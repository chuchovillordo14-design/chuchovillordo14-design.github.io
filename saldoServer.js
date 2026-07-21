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

  // ── Push de un delta al server; devuelve el saldo nuevo o null si falló ──
  async function _push(delta, motivo) {
    const token = getDeviceToken();
    try {
      const r = await fetch(_base() + "/cuenta/evento", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, delta: Math.trunc(delta), motivo: motivo || "" }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok || typeof d.saldo !== "number") return null;
      return d.saldo;
    } catch (e) { return null; }
  }

  // ── Debounce de deltas de gameplay (evita una ráfaga de POSTs) ──────────
  let _pend = 0, _timer = null, _flushing = false;

  async function _flush() {
    if (_flushing) return;
    const delta = _pend; _pend = 0;
    if (!delta) return;
    _flushing = true;
    const nuevo = await _push(delta, "gameplay");
    _flushing = false;
    // Reconciliar con el valor autoritativo, sumándole lo que se acumuló
    // mientras esperábamos la respuesta (así no perdemos ganancias en vuelo).
    if (nuevo != null) _setLocal(nuevo + _pend);
    if (_pend) { clearTimeout(_timer); _timer = setTimeout(_flush, 300); }
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
      const nuevo = await _push(local - saldo, "migracion inicial");
      _setLocal(nuevo != null ? nuevo : local);
    } else {
      // El server es autoritativo (acá se blindan las compras).
      _setLocal(saldo);
    }
    _lsSet(MIGR_KEY, "1");
  }

  window.getDeviceToken = getDeviceToken;
  window.saldoSyncInit  = saldoSyncInit;
  window.saldoPushDelta = saldoPushDelta;

  // Arranque: sincronizar poco después de cargar (deja que features_progression
  // exponga getPesos/setPesosLocal primero).
  if (document.readyState !== "loading") setTimeout(saldoSyncInit, 500);
  else window.addEventListener("DOMContentLoaded", function () { setTimeout(saldoSyncInit, 500); });
})();
