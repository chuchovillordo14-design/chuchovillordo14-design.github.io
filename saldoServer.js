// ══════════════════════════════════════════════════════════════
// SALDOSERVER.JS — Saldo de fichas (PT) espejado contra el servidor
//
// Fundación liviana, SIN login. Cada dispositivo genera un token anónimo
// (`tg_device`). El servidor guarda el saldo autoritativo de ese token
// (server/cuentas.js). Acá:
//   · getDeviceToken()  → token del dispositivo (lo crea si no existe)
//   · saldoSyncInit()   → al cargar, sincroniza el local con el server
//   · saldoPushDelta()  → empuja cada ganancia/gasto (debounced)
//
// El local (tg_pesos, via getPesos/setPesosLocal de features_progression.js)
// es un ESPEJO para lecturas síncronas y para andar offline. El server manda.
//
// Seguridad honesta: lo único server-INICIADO (y por ende no falsificable
// editando localStorage) son las COMPRAS, que la tienda acredita server-side
// tras verificar el pago con MP. El gameplay se empuja como delta y se CONFÍA.
//
// Degradación: si el server no responde o no tiene persistencia real
// (Upstash sin configurar → responde persistente:false), NO tocamos el local:
// todo sigue funcionando como antes, sin blindaje pero sin perder saldo.
// ══════════════════════════════════════════════════════════════

(function () {
  "use strict";

  const TOKEN_KEY = "tg_device";
  const MIGR_KEY  = "tg_saldo_migrado";
  const CHARSET   = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-";

  function _lsGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function _lsSet(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }

  // Base HTTP del server (misma URL del relay: wss→https), igual que tienda.js.
  function _base() {
    let u = (typeof netGetUrl === "function") ? netGetUrl() : "https://trucogol.onrender.com";
    return u.replace(/^wss:/i, "https:").replace(/^ws:/i, "http:").replace(/\/+$/, "");
  }

  function _rand() {
    let s = "";
    try {
      const a = new Uint8Array(24);
      crypto.getRandomValues(a);
      for (let i = 0; i < a.length; i++) s += CHARSET[a[i] % CHARSET.length];
    } catch (e) {
      for (let i = 0; i < 24; i++) s += CHARSET[Math.floor(Math.random() * CHARSET.length)];
    }
    return s;
  }

  function getDeviceToken() {
    let t = _lsGet(TOKEN_KEY);
    if (!t || !/^[A-Za-z0-9_-]{8,64}$/.test(t)) { t = _rand(); _lsSet(TOKEN_KEY, t); }
    return t;
  }

  function _localSaldo() {
    if (typeof window.getPesos === "function") return window.getPesos();
    return parseInt(_lsGet("tg_pesos") || "0", 10) || 0;
  }
  function _setLocal(n) {
    n = Math.max(0, Math.trunc(Number(n) || 0));
    if (typeof window.setPesosLocal === "function") window.setPesosLocal(n);
    else _lsSet("tg_pesos", String(n));
  }

  // ── Vale de partida ─────────────────────────────────────────────
  // El server (cuentas.js) emite un vale al empezar la partida y solo
  // las ganancias que canjean un vale con edad de partida real acceden
  // al tope de ganancia normal; sin vale el tope es chico. Acá se pide
  // al repartirse una mano (si no hay uno vivo) y se adjunta al primer
  // push de ganancia cuando ya maduró. Si el server no responde, no
  // pasa nada: el push sale sin vale, como los clientes viejos.
  const VALE_EDAD_MIN_MS = 150000; // debe coincidir con el server
  let _vale = null, _valeTs = 0, _valePidiendo = false;

  async function _valePedir() {
    if (_vale || _valePidiendo) return;
    _valePidiendo = true;
    try {
      const r = await fetch(_base() + "/cuenta/partida/inicio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: getDeviceToken() }),
      });
      const d = await r.json().catch(() => ({}));
      if (r.ok && typeof d.vale === "string") { _vale = d.vale; _valeTs = Date.now(); }
    } catch (e) {}
    _valePidiendo = false;
  }

  // ── Push de un delta al server ──────────────────────────────────────────
  // Devuelve { ok:true, saldo } o { ok:false, permanente }.
  // La distinción importa: un 4xx que no sea 429 (token inválido, delta
  // fuera de rango, body gigante) va a fallar IGUAL las veces que se
  // reintente, mientras que un 429/502/red caída se resuelve solo esperando.
  async function _push(delta, motivo) {
    const token = getDeviceToken();
    const body = { token, delta: Math.trunc(delta), motivo: motivo || "" };
    // El vale es de un solo uso: se adjunta solo a ganancias y solo si ya
    // tiene la edad mínima (si no, se guarda para el próximo push).
    let valeUsado = null;
    if (delta > 0 && _vale && Date.now() - _valeTs >= VALE_EDAD_MIN_MS) {
      body.vale = _vale;
      valeUsado = _vale;
      _vale = null;
    }
    try {
      const r = await fetch(_base() + "/cuenta/evento", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const d = await r.json().catch(() => ({}));
      if (r.ok && typeof d.saldo === "number") return { ok: true, saldo: d.saldo };
      // El vale no llegó a consumirse del lado del server: se devuelve para
      // que el reintento no salga sin él (sin vale el tope de ganancia por
      // hora es mucho más chico).
      if (valeUsado) _vale = valeUsado;
      return { ok: false, permanente: r.status >= 400 && r.status < 500 && r.status !== 429 };
    } catch (e) {
      if (valeUsado) _vale = valeUsado;
      return { ok: false, permanente: false };   // red caída: se reintenta
    }
  }

  // ── Debounce de deltas de gameplay (evita una ráfaga de POSTs) ──────────
  // DELTA_MAX del server (cuentas.js): cualquier |delta| mayor vuelve 400.
  const DELTA_MAX_CLIENTE = 2000;
  const REINTENTO_BASE_MS = 300;
  const REINTENTO_TOPE_MS = 30000;
  let _pend = 0, _timer = null, _flushing = false, _reintentoMs = REINTENTO_BASE_MS;

  async function _flush() {
    if (_flushing || !_pend) return;
    // Se manda en tandas de como mucho DELTA_MAX. El debounce puede acumular
    // por encima de ese tope de forma perfectamente legítima (el capítulo 10
    // de Historia paga 2000 justos, y cualquier otra ganancia que caiga en la
    // misma ventana de 700 ms lo pasa). Mandarlo entero era un 400 seguro, y
    // con el reintento de abajo, un 400 para siempre. El freno real contra el
    // abuso es el tope de ganancia POR HORA del server, no éste.
    const envio = Math.max(-DELTA_MAX_CLIENTE, Math.min(DELTA_MAX_CLIENTE, _pend));
    _pend -= envio;

    _flushing = true;
    const res = await _push(envio, "gameplay");
    _flushing = false;

    if (res.ok) {
      _reintentoMs = REINTENTO_BASE_MS;
      // Reconciliar con el valor autoritativo, sumándole lo que quedó
      // pendiente (el resto de la tanda + lo que entró mientras esperábamos),
      // así no se pierden ganancias en vuelo.
      _setLocal(res.saldo + _pend);
    } else {
      // El delta NO puede perderse en el aire: se re-encola siempre. Antes se
      // descartaba y, si el server ya tenía persistencia real, la siguiente
      // sync pisaba el local y esas PT desaparecían sin dejar rastro.
      _pend += envio;
      if (res.permanente) {
        // Reintentar esto no va a funcionar nunca. Se corta el ciclo: sin
        // esto el cliente quedaba mandando un POST cada 300 ms para siempre
        // (~200 por minuto contra un Render gratuito, y quemándose su propio
        // rate limit). El próximo evento de juego lo reintenta, a ritmo
        // humano, vía saldoPushDelta().
        return;
      }
      // Transitorio (429, 502, red caída): backoff exponencial con techo.
      _reintentoMs = Math.min(_reintentoMs * 2, REINTENTO_TOPE_MS);
    }
    if (_pend) { clearTimeout(_timer); _timer = setTimeout(_flush, _reintentoMs); }
  }

  function saldoPushDelta(delta, motivo) {
    delta = Math.trunc(Number(delta) || 0);
    if (!delta) return;
    _pend += delta;
    clearTimeout(_timer);
    _timer = setTimeout(_flush, 700);
  }

  // ── Sync inicial ────────────────────────────────────────────────────────
  async function saldoSyncInit() {
    const token = getDeviceToken();
    let saldo, persistente;
    try {
      const r = await fetch(_base() + "/cuenta/saldo?token=" + encodeURIComponent(token));
      const d = await r.json().catch(() => ({}));
      if (!r.ok || typeof d.saldo !== "number") return;   // server no disponible → seguir local
      saldo = d.saldo; persistente = !!d.persistente;
    } catch (e) { return; }

    // Sin persistencia real (dev/Upstash sin configurar): no tocar el local,
    // para no borrar el saldo cuando el server se reinicia.
    if (!persistente) return;

    const migrado = _lsGet(MIGR_KEY) === "1";
    const local = _localSaldo();
    if (!migrado && local > saldo) {
      // Primera vez en este dispositivo con saldo previo → subirlo al server.
      // El push puede fallar por motivos LEGÍTIMOS (delta > DELTA_MAX o el
      // tope de ganancia por hora del server): eso NO significa que no haya
      // saldo que migrar. Antes se marcaba "migrado" igual pase lo que pase,
      // así que la PRÓXIMA carga entraba al `else` de abajo y pisaba el
      // local con el saldo del server (que nunca recibió la migración) —
      // el saldo entero se borraba en el segundo arranque.
      const res = await _push(local - saldo, "migracion inicial");
      if (res.ok) {
        _setLocal(res.saldo);
        _lsSet(MIGR_KEY, "1"); // recién se marca migrado si migró de verdad
      }
      // Si falló: no tocar el local, no marcar migrado — se reintenta en
      // el próximo arranque, sin perder nada mientras tanto.
    } else {
      // El server es autoritativo (acá se blindan las compras).
      _setLocal(saldo);
      _lsSet(MIGR_KEY, "1");
    }
  }

  // ── Código PÚBLICO de jugador (4 ago 2026) ──────────────────────────
  // Lo que el jugador ve en Ajustes y manda al grupo para anotarse a un
  // torneo. NO es el token: el token es lo que lo identifica ante el
  // server (quien lo tenga puede sentarse en una mesa diciendo que es él),
  // así que publicarlo sería repartir la llave de casa. Esto son los
  // primeros 60 bits de un SHA-256 del token, en el alfabeto sin ambiguos
  // y en grupos de 4 — del código no se vuelve al token.
  //
  // ⚠️ Tiene que dar EXACTAMENTE lo mismo que codigoPublicoDe() en
  // server/cuadro.js (mismo alfabeto, mismos 12 caracteres, mismos
  // guiones): el server traduce el token del asiento a este código para
  // cerrar la llave. Si se toca uno, tocar el otro.
  const COD_ALF = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";  // 32 = 5 bits

  function _codigoDesdeBytes(bytes) {
    let out = "", acc = 0, bits = 0, i = 0;
    while (out.length < 12) {
      if (bits < 5) { acc = (acc << 8) | bytes[i++]; bits += 8; }
      bits -= 5;
      out += COD_ALF[(acc >> bits) & 31];
    }
    return out.slice(0, 4) + "-" + out.slice(4, 8) + "-" + out.slice(8, 12);
  }

  // Async porque crypto.subtle lo es. Requiere contexto seguro (https o
  // localhost): en http plano no existe y devuelve null, que la UI muestra
  // como "no disponible" en vez de inventar un código que el server no va
  // a reconocer.
  async function codigoJugadorPublico() {
    try {
      if (!crypto.subtle) return null;
      const datos = new TextEncoder().encode(getDeviceToken());
      const hash = new Uint8Array(await crypto.subtle.digest("SHA-256", datos));
      return _codigoDesdeBytes(hash);
    } catch (e) { return null; }
  }

  window.getDeviceToken = getDeviceToken;
  window.codigoJugadorPublico = codigoJugadorPublico;
  window.saldoSyncInit  = saldoSyncInit;
  window.saldoPushDelta = saldoPushDelta;

  // Arranque: sincronizar poco después de cargar (deja que features_progression
  // exponga getPesos/setPesosLocal primero).
  function _arrancar() {
    setTimeout(saldoSyncInit, 500);
    // Pedir vale con cada mano repartida (si no hay uno vivo). El evento
    // lo emite el motor; si onJuego no existe todavía, reintentamos una vez.
    setTimeout(function () {
      if (typeof onJuego === "function") onJuego("manoRepartida", _valePedir);
      else setTimeout(function () {
        if (typeof onJuego === "function") onJuego("manoRepartida", _valePedir);
      }, 2000);
    }, 800);
  }
  if (document.readyState !== "loading") _arrancar();
  else window.addEventListener("DOMContentLoaded", _arrancar);
})();
