// ══════════════════════════════════════════════════════════════
// JUEGO2V2_ONLINE.JS — 2 vs 2 ONLINE (host-autoritativo sobre S2)
//
// Arquitectura (igual espíritu que el 1v1, pero sobre el motor S2):
//   · El HOST (asiento 0) corre el motor real S2 para los 4 asientos.
//     Los asientos con humano conectado tienen esBot=false; los vacíos
//     quedan como bots que el host maneja con pasoBot2v2().
//   · Cada GUEST (asientos 1..3) NO corre el motor: recibe un snapshot
//     de S2 (con las manos AJENAS redactadas a solo la cuenta) y lo
//     pinta desde su propia perspectiva (_2v2_miAsiento). Sus acciones
//     (jugar/cantar/responder) viajan al host, que las aplica con las
//     funciones accion*2v2(asiento) y vuelve a difundir el estado.
//
// La UI (juego2v2_ui.js) es la misma: expone el "seam" _2v2_online que
// este módulo setea para interceptar las acciones del jugador local.
// ══════════════════════════════════════════════════════════════

const O2 = {
  activa: false,
  esHost: false,
  miAsiento: 0,
  codigo: null,
  ocupados: [0],     // asientos con humano conectado (incluye al host)
  nombres: {},       // asiento -> nombre
  miNombre: "Jugador",
  buscando: false,   // esperando emparejamiento en la cola pública de 4
  _corriendo: false,
  _prevLog: [],
};

// ── Snapshot de estado (host → guest) ────────────────────────────
const _S2_CAMPOS = [
  "puntos", "limite", "manoAsiento", "turno", "ronda", "jugadasBaza",
  "bazas", "nivelTruco", "trucoEquipoCanto", "trucoAceptado", "_trucoRechazado",
  "canto", "envidoResuelto", "florActiva", "florResuelta", "terminado", "ganadorPartido",
];

// Snapshot redactado: el guest solo ve SU mano; de los demás, la cuenta.
function _snapshotParaGuest(asientoGuest) {
  const snap = {};
  _S2_CAMPOS.forEach(k => { snap[k] = S2[k]; });
  snap.jugadores = S2.jugadores.map((j, i) => ({
    id: j.id, nombre: j.nombre, equipo: j.equipo, esBot: j.esBot,
    mano: (i === asientoGuest) ? j.mano.slice() : j.mano.map(c => (c ? "?" : null)),
  }));
  snap._log = S2._log.slice(-5);
  return snap;
}

function _hostBroadcastEstado() {
  if (!O2.esHost) return;
  O2.ocupados.forEach(a => {
    if (a === 0) return;
    netEnviar4({ tipo: "estado", snap: _snapshotParaGuest(a) }, a);
  });
}

function _2v2VisibleOnline() {
  return !!document.getElementById("mesa2v2")?.classList.contains("show");
}

// ── Watchdog: forfeit automático si un guest queda AFK ────────────
// El host corre el motor para los 4 asientos: si le toca jugar o
// responder a un GUEST (asiento 1-3) y no llega su mensaje en
// TURNO_TIMEOUT_MS_2V2, el host resuelve por él con la opción más
// simple, para no trabar la partida a un socket colgado.
const TURNO_TIMEOUT_MS_2V2 = 45000;
let _watchdog2v2 = null;
function _limpiarWatchdog2v2() { if (_watchdog2v2) { clearTimeout(_watchdog2v2); _watchdog2v2 = null; } }
function _armarWatchdog2v2(fn) { _limpiarWatchdog2v2(); _watchdog2v2 = setTimeout(fn, TURNO_TIMEOUT_MS_2V2); }

// ── Host: loop del motor (corre bots, frena en asientos humanos) ──
function _hostLoop() {
  if (!O2.esHost || O2._corriendo) return;
  O2._corriendo = true;
  const step = () => {
    _limpiarWatchdog2v2();
    if (!_2v2VisibleOnline()) { O2._corriendo = false; return; }
    const r = pasoBot2v2();
    _hostBroadcastEstado();
    _2v2ToastCantos();
    _2v2Render();
    if (r === "humano") {
      O2._corriendo = false;
      if (S2.turno === 0) { _2v2_modo = "juega"; _2v2Render(); } // le toca al host
      else _armarWatchdog2v2(() => {
        if (S2.terminado || S2.turno === 0) return;
        const idx = (S2.jugadores[S2.turno].mano || []).findIndex(c => c);
        if (idx >= 0 && jugarCarta2v2(S2.turno, idx)) _hostContinuar();
      });
      return; // si es un guest, esperamos su mensaje
    }
    if (r === "humanoCanto") {
      O2._corriendo = false;
      if (_puedeResponderCanto(0)) { _2v2_modo = "responde"; _2v2Render(); }
      else _armarWatchdog2v2(() => {
        if (S2.terminado || !S2.canto) return;
        const a = _asientoRespondeCanto();
        if (a >= 0 && accionResponderCanto2v2(a, "no")) _hostContinuar();
      });
      return; // si responde un guest, esperamos su mensaje
    }
    if (r === "fin") { O2._corriendo = false; _hostBroadcastEstado(); _2v2FinPartido(); return; }
    setTimeout(step, r === "canto" ? 900 : 780);
  };
  setTimeout(step, 380);
}

// El seam que continúa el juego tras una acción del host local.
function _hostContinuar() { _hostBroadcastEstado(); _hostLoop(); }

// Host: aplica la acción recibida de un guest (asiento `de`).
function _hostRecibirAccion(de, payload) {
  if (!O2.esHost || S2.terminado || typeof de !== "number") return;
  if (S2.jugadores[de] && S2.jugadores[de].esBot) return; // el asiento no es humano
  let ok = false;
  switch (payload.accion) {
    case "jugar":
      if (S2.turno === de && !S2.canto && S2.jugadores[de].mano[payload.idx]) ok = jugarCarta2v2(de, payload.idx);
      break;
    case "cantar":
      ok = (payload.tipo === "truco") ? accionCantarTruco2v2(de) : accionCantarEnvido2v2(de, payload.tipo);
      break;
    case "responder":
      ok = accionResponderCanto2v2(de, payload.resp);
      break;
    case "responder_con_envido":
      ok = accionResponderTrucoConEnvido2v2(de, payload.tipo);
      break;
  }
  if (!ok) return;
  _limpiarWatchdog2v2();
  _hostBroadcastEstado();
  _2v2ToastCantos();
  _2v2Render();
  if (S2.terminado) { _2v2FinPartido(); return; }
  _hostLoop();
}

// ── Guest: aplica un snapshot recibido y renderiza ───────────────
function _guestModo() {
  if (S2.terminado || !S2.jugadores) return null;
  if (S2.canto) return _puedeResponderCanto(_2v2_miAsiento) ? "responde" : null;
  return (S2.turno === _2v2_miAsiento) ? "juega" : null;
}

function _guestRecibirEstado(snap) {
  _S2_CAMPOS.forEach(k => { S2[k] = snap[k]; });
  S2.jugadores = snap.jugadores;
  S2._log = snap._log || [];
  _2v2_miAsiento = O2.miAsiento;
  _guestToasts(snap._log);
  _2v2_modo = _guestModo();
  _2v2Render();
  if (S2.terminado) _2v2FinPartido();
}

function _guestToasts(log) {
  log = log || [];
  const prev = O2._prevLog || [];
  log.forEach(l => {
    if (!prev.includes(l) && typeof _2v2MostrarEventoLog === "function") _2v2MostrarEventoLog(l);
  });
  O2._prevLog = log.slice();
}

// ── Arranque de la partida ───────────────────────────────────────
function online2v2Empezar() {
  if (!O2.esHost) return;
  _2v2AsegurarPantalla();
  const nombres = [0, 1, 2, 3].map(a =>
    O2.nombres[a] || (a === 0 ? O2.miNombre : (O2.ocupados.includes(a) ? ("Jugador " + a) : ("Bot " + a))));
  nuevo2v2({ manoInicial: Math.floor(Math.random() * 4), nombres });
  S2.jugadores.forEach((j, i) => { j.esBot = !O2.ocupados.includes(i); });

  _2v2_miAsiento = 0;
  _2v2_online = { esHost: true, enviar: function () {}, continuar: _hostContinuar };
  O2.activa = true;
  O2._prevLog = [];
  _2v2_logIdx = 0; _2v2_centroPrev = 0; _2v2_modo = null;

  document.getElementById("mesa2v2").classList.add("show");
  O2.ocupados.forEach(a => { if (a !== 0) netEnviar4({ tipo: "empezar", nombres }, a); });
  _hostBroadcastEstado();
  _2v2Render();
  _hostLoop();
}

function _guestEmpezar(msg) {
  _2v2AsegurarPantalla();
  (msg && msg.nombres || []).forEach((n, i) => { O2.nombres[i] = n; });
  _2v2_miAsiento = O2.miAsiento;
  _2v2_online = { esHost: false, enviar: function (p) { netEnviar4(p); } };
  O2.activa = true;
  O2._prevLog = [];
  _2v2_logIdx = 0; _2v2_centroPrev = 0; _2v2_modo = null;
  _lobby2v2Ocultar();
  document.getElementById("mesa2v2").classList.add("show");
}

// Revancha online: solo el host reparte de nuevo y difunde.
function online2v2Revancha() {
  if (!O2.esHost) return;
  document.getElementById("m2v2-fin")?.classList.remove("show");
  online2v2Empezar();
}

// ── Limpieza ─────────────────────────────────────────────────────
function online2v2Cleanup() {
  O2.activa = false;
  O2._corriendo = false;
  O2.esHost = false;
  O2.buscando = false;
  O2.codigo = null;
  O2.ocupados = [0];
  O2.nombres = {};
  O2._prevLog = [];
  if (typeof _2v2_senaRecibida !== "undefined") { _2v2_senaRecibida = null; clearTimeout(_2v2_senaTimer); }
  if (typeof _2v2_senaCazada !== "undefined") { _2v2_senaCazada = null; clearTimeout(_2v2_senaCazadaTimer); }
  if (typeof netDesconectar === "function") netDesconectar();
}

// ── Lobby ────────────────────────────────────────────────────────
async function online2v2() {
  _lobby2v2Asegurar();
  O2.miNombre = (localStorage.getItem("truco_nombre") || "Jugador");
  _lobby2v2Vista("menu");
  document.getElementById("lobby2v2").classList.add("show");
  try {
    if (!NET.conectado) await netConectar();
    _lobby2v2Msg("Conectado. Creá una sala o entrá con un código.");
  } catch (e) {
    _lobby2v2Msg("No se pudo conectar al servidor. Reintentá en unos segundos.");
  }
}

function online2v2Crear() {
  O2.miNombre = (document.getElementById("lb2v2-nombre")?.value || "").trim() || "Jugador";
  try { localStorage.setItem("truco_nombre", O2.miNombre); } catch (e) {}
  if (!NET.conectado) { _lobby2v2Msg("Sin conexión. Cerrá y volvé a entrar."); return; }
  O2.nombres[0] = O2.miNombre;
  netCrearSala4();
}

// ── Buscar rivales (cola pública / matchmaking de 4) ─────────────
async function online2v2Buscar() {
  O2.miNombre = (document.getElementById("lb2v2-nombre")?.value || "").trim() || O2.miNombre || "Jugador";
  try { localStorage.setItem("truco_nombre", O2.miNombre); } catch (e) {}
  O2.nombres[0] = O2.miNombre;
  O2.buscando = true;
  _lobby2v2Vista("buscando");
  _lobby2v2SetBuscando("Conectando...");
  try {
    if (!NET.conectado) await netConectar();
    netBuscarPartida4();
  } catch (e) {
    O2.buscando = false;
    _lobby2v2Vista("menu");
    _lobby2v2Msg("No se pudo conectar al servidor. Reintentá en unos segundos.");
  }
}

function online2v2CancelarBusqueda() {
  netCancelarBusqueda4();
  O2.buscando = false;
  _lobby2v2Vista("menu");
  _lobby2v2Msg("");
}

function online2v2Unirse() {
  const codigo = (document.getElementById("lb2v2-codigo")?.value || "").trim();
  if (codigo.length < 5) { _lobby2v2Msg("Ingresá el código de 5 caracteres."); return; }
  O2.miNombre = (document.getElementById("lb2v2-nombre")?.value || "").trim() || "Jugador";
  try { localStorage.setItem("truco_nombre", O2.miNombre); } catch (e) {}
  if (!NET.conectado) { _lobby2v2Msg("Sin conexión. Cerrá y volvé a entrar."); return; }
  netUnirseSala4(codigo);
}

function online2v2Salir() {
  online2v2Cleanup();
  document.getElementById("lobby2v2")?.classList.remove("show");
  document.getElementById("mesa2v2")?.classList.remove("show");
  if (typeof irA === "function") irA("main-menu");
}

// Copia el código de la sala al portapapeles (para compartirlo).
function online2v2CopiarCodigo() {
  if (!O2.codigo) return;
  const ok = () => { if (typeof showToast === "function") showToast("📋 Código copiado: " + O2.codigo, 1800); };
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) { navigator.clipboard.writeText(O2.codigo).then(ok, ok); return; }
  } catch (e) {}
  // Fallback viejo
  const t = document.createElement("textarea");
  t.value = O2.codigo; t.style.position = "fixed"; t.style.opacity = "0";
  document.body.appendChild(t); t.select();
  try { document.execCommand("copy"); } catch (e) {}
  document.body.removeChild(t); ok();
}

// ── Eventos de red del lobby ─────────────────────────────────────
netOn("sala4_creada", (d) => {
  O2.buscando = false;
  O2.esHost = true; O2.miAsiento = 0; O2.codigo = d.codigo; O2.ocupados = [0];
  _lobby2v2Vista("sala");
  _lobby2v2Render();
});
netOn("unido4", (d) => {
  O2.buscando = false;
  O2.esHost = false; O2.miAsiento = d.asiento; O2.codigo = d.codigo;
  O2.ocupados = d.ocupados || [0, d.asiento];
  _lobby2v2Vista("sala");
  _lobby2v2Render();
});
netOn("en_cola4", (d) => {
  const n = (d && d.enCola) || 1;
  _lobby2v2SetBuscando(`Buscando rivales… ${n}/4 en la cola. Quedate en línea.`);
});
netOn("jugador4_conectado", (d) => {
  O2.ocupados = d.ocupados || O2.ocupados;
  // Reingreso/entrada durante la partida: el host marca el asiento como humano
  // de nuevo y le reenvía "empezar" + el estado actual para resincronizarlo.
  if (O2.activa && O2.esHost && typeof d.asiento === "number") {
    S2.jugadores.forEach((j, i) => { j.esBot = !O2.ocupados.includes(i); });
    const nombres = S2.jugadores.map(j => j.nombre);
    netEnviar4({ tipo: "empezar", nombres }, d.asiento);
    _hostBroadcastEstado();
    if (typeof showToast === "function") showToast("✅ Un jugador entró al asiento " + d.asiento + ".");
  }
  _lobby2v2Render();
});
netOn("jugador4_desconectado", (d) => {
  O2.ocupados = d.ocupados || O2.ocupados;
  if (O2.activa && typeof showToast === "function") showToast("⚠️ Se desconectó un jugador (queda como bot).");
  if (O2.activa && O2.esHost) {
    S2.jugadores.forEach((j, i) => { j.esBot = !O2.ocupados.includes(i); });
    // Si el loop estaba frenado esperando a ese humano (su turno o su respuesta
    // a un canto), ahora es bot: reactivamos el loop para que no se cuelgue.
    _hostBroadcastEstado();
    _hostLoop();
  }
  _lobby2v2Render();
});
netOn("host4_desconectado", () => {
  if (typeof showToast === "function") showToast("⚠️ El anfitrión se fue. Sala cerrada.");
  online2v2Salir();
});
// Se cortó nuestra propia conexión con el servidor durante una partida de 4.
netOn("close", () => {
  if (!O2.activa) return;
  if (typeof showToast === "function") {
    showToast(O2.esHost
      ? "⚠️ Se cortó tu conexión. La sala se cerró; creá una nueva."
      : "⚠️ Se cortó la conexión. Volvé a entrar con el mismo código.");
  }
});

netOn("msg4", ({ payload, de }) => {
  if (!payload) return;
  // Señas (2v2 online): el host procesa las de los guests (entrega al compañero
  // + tira la caza); cada cliente muestra lo que le toca.
  if (payload.tipo === "sena") {
    if (O2.esHost) { if (typeof _2v2HostRuteaSena === "function") _2v2HostRuteaSena(payload, de); }
    else { if (typeof _2v2MostrarSenaRecibida === "function") _2v2MostrarSenaRecibida(payload); }
    return;
  }
  // Un guest cazó la seña de un rival (el host se la mandó).
  if (payload.tipo === "sena_cazada") {
    if (typeof _2v2MostrarSenaCazada === "function") _2v2MostrarSenaCazada(payload);
    return;
  }
  if (O2.esHost) { _hostRecibirAccion(de, payload); return; }
  if (payload.tipo === "empezar") _guestEmpezar(payload);
  else if (payload.tipo === "estado") { if (!O2.activa) _guestEmpezar({ nombres: [] }); _guestRecibirEstado(payload.snap); }
});

// ── Inyección del lobby (pantalla #lobby2v2) ─────────────────────
function _lobby2v2Vista(v) {
  ["lb2v2-menu", "lb2v2-buscando", "lb2v2-sala"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = (id === "lb2v2-" + v) ? "flex" : "none";
  });
}
function _lobby2v2Msg(t) { const el = document.getElementById("lb2v2-msg"); if (el) el.textContent = t || ""; }
function _lobby2v2SetBuscando(t) { const el = document.getElementById("lb2v2-buscando-msg"); if (el) el.textContent = t || ""; }
function _lobby2v2Ocultar() { document.getElementById("lobby2v2")?.classList.remove("show"); }

function _lobby2v2Render() {
  const cod = document.getElementById("lb2v2-codigo-big");
  if (cod) cod.textContent = O2.codigo || "-----";
  const rolTxt = document.getElementById("lb2v2-rol");
  if (rolTxt) rolTxt.textContent = O2.esHost ? "Sos el anfitrión (asiento 0, NOSOTROS)" : `Entraste al asiento ${O2.miAsiento} (${O2.miAsiento % 2 === 0 ? "NOSOTROS" : "ELLOS"})`;
  // lista de asientos
  const lista = document.getElementById("lb2v2-asientos");
  if (lista) {
    const eq = a => (a % 2 === 0 ? "NOSOTROS" : "ELLOS");
    lista.innerHTML = [0, 1, 2, 3].map(a => {
      const ocupado = O2.ocupados.includes(a);
      const yo = a === O2.miAsiento;
      const quien = ocupado ? (yo ? "Vos" : (O2.nombres[a] || "Jugador")) : "libre → 🤖 bot";
      const avatar = a === 0 ? "👑" : ocupado ? "🧑" : "🤖";
      return `<div class="lb2v2-asiento ${a % 2 === 0 ? "nos" : "ellos"} ${ocupado ? "on" : "off"} ${yo ? "yo" : ""}">
        <span class="lb2v2-as-av">${avatar}</span>
        <span class="lb2v2-as-txt">
          <span class="lb2v2-as-eq">${eq(a)} · A${a}</span>
          <span class="lb2v2-as-q">${esc(quien)}</span>
        </span></div>`;
    }).join("");
  }
  // botón empezar solo para el host
  const btn = document.getElementById("lb2v2-empezar");
  if (btn) btn.style.display = O2.esHost ? "inline-block" : "none";
  const espera = document.getElementById("lb2v2-espera");
  if (espera) espera.style.display = O2.esHost ? "none" : "block";
}

function _lobby2v2Asegurar() {
  if (document.getElementById("lobby2v2")) return;
  const div = document.createElement("div");
  div.id = "lobby2v2";
  div.innerHTML = `
    <div class="lb2v2-box">
      <button class="lb2v2-cerrar" onclick="online2v2Salir()">✕</button>
      <h2 class="lb2v2-tit">2 VS 2 ONLINE</h2>

      <div id="lb2v2-menu" class="lb2v2-vista">
        <input id="lb2v2-nombre" class="lb2v2-inp" placeholder="Tu nombre" maxlength="14">
        <button class="lb2v2-btn primary" onclick="online2v2Buscar()">🎯 BUSCAR RIVALES</button>
        <div class="lb2v2-sub2">Te juntamos con otros 3 que estén buscando</div>
        <div class="lb2v2-sep">— o jugá con amigos —</div>
        <button class="lb2v2-btn" onclick="online2v2Crear()">CREAR SALA</button>
        <div class="lb2v2-sep">— o entrá con un código —</div>
        <input id="lb2v2-codigo" class="lb2v2-inp" placeholder="CÓDIGO" maxlength="5" style="text-transform:uppercase">
        <button class="lb2v2-btn" onclick="online2v2Unirse()">UNIRME</button>
        <div id="lb2v2-msg" class="lb2v2-msg"></div>
      </div>

      <div id="lb2v2-buscando" class="lb2v2-vista" style="display:none">
        <div class="lb2v2-spinner"></div>
        <div id="lb2v2-buscando-msg" class="lb2v2-buscando-msg">Buscando rivales…</div>
        <button class="lb2v2-btn" onclick="online2v2CancelarBusqueda()">CANCELAR</button>
      </div>

      <div id="lb2v2-sala" class="lb2v2-vista" style="display:none">
        <div class="lb2v2-cod-lbl">CÓDIGO DE LA SALA</div>
        <div class="lb2v2-cod-row">
          <div id="lb2v2-codigo-big" class="lb2v2-cod">-----</div>
          <button class="lb2v2-copiar" onclick="online2v2CopiarCodigo()" title="Copiar código">📋</button>
        </div>
        <div id="lb2v2-rol" class="lb2v2-rol"></div>
        <div id="lb2v2-asientos" class="lb2v2-asientos"></div>
        <button id="lb2v2-empezar" class="lb2v2-btn primary" onclick="online2v2Empezar()">EMPEZAR <span class="lb2v2-btn-sub">— asientos vacíos = bots</span></button>
        <div id="lb2v2-espera" class="lb2v2-espera">⏳ Esperando que el anfitrión arranque…</div>
      </div>
    </div>`;
  document.body.appendChild(div);
  _lobby2v2CSS();
}

function _lobby2v2CSS() {
  if (document.getElementById("lobby2v2-css")) return;
  const s = document.createElement("style");
  s.id = "lobby2v2-css";
  s.textContent = `
    #lobby2v2 { display:none; position:fixed; inset:0; z-index:950; align-items:center; justify-content:center;
      color:#fff; font-family:var(--f-ui,'Oswald',sans-serif); overflow:auto; padding:20px;
      background:
        radial-gradient(circle at 50% 46%, transparent 120px, rgba(255,255,255,.05) 121px, rgba(255,255,255,.05) 123px, transparent 124px),
        repeating-linear-gradient(90deg, rgba(255,255,255,.025) 0 72px, transparent 72px 144px),
        radial-gradient(ellipse 130% 80% at 50% 42%, rgba(64,168,100,.35), transparent 60%),
        radial-gradient(ellipse at center, #15582f 0%, #0b3a20 55%, #05160d 100%); }
    #lobby2v2.show { display:flex; }
    .lb2v2-box { position:relative; width:min(430px,94vw);
      background:linear-gradient(160deg, rgba(16,32,58,.98), rgba(6,12,24,1));
      border:1.5px solid rgba(245,197,24,.4); border-radius:22px; padding:28px 28px 30px;
      box-shadow:0 0 50px rgba(245,197,24,.12), 0 24px 60px rgba(0,0,0,.7);
      animation:lb2v2Pop .4s cubic-bezier(.22,.85,.35,1.2); }
    @keyframes lb2v2Pop { 0%{transform:scale(.9) translateY(14px);opacity:0} 100%{transform:scale(1) translateY(0);opacity:1} }
    .lb2v2-cerrar { position:absolute; top:12px; right:14px; width:32px; height:32px; background:rgba(255,255,255,.08);
      border:none; border-radius:50%; color:#fff; font-size:15px; cursor:pointer; opacity:.75; transition:background .15s; }
    .lb2v2-cerrar:hover { background:rgba(255,255,255,.2); opacity:1; }
    .lb2v2-tit { font-family:var(--f-display,'Bebas Neue',sans-serif); font-size:32px; text-align:center; margin:0 0 20px; letter-spacing:2px;
      color:var(--gold,#f5c518); text-shadow:0 0 20px rgba(245,197,24,.35); }
    .lb2v2-vista { display:flex; flex-direction:column; gap:12px; }
    .lb2v2-inp { padding:13px 14px; border-radius:12px; border:1px solid rgba(255,255,255,.18); background:rgba(0,0,0,.4);
      color:#fff; font-size:16px; text-align:center; letter-spacing:1px; transition:border-color .15s, box-shadow .15s; }
    .lb2v2-inp:focus { outline:none; border-color:rgba(245,197,24,.6); box-shadow:0 0 0 3px rgba(245,197,24,.12); }
    .lb2v2-inp::placeholder { color:rgba(255,255,255,.4); }
    .lb2v2-btn { position:relative; padding:14px; border-radius:26px; border:none; cursor:pointer; font-family:var(--f-ui,'Oswald',sans-serif);
      font-weight:700; letter-spacing:1px; font-size:14px; background:rgba(255,255,255,.12); color:#fff;
      box-shadow:0 4px 14px rgba(0,0,0,.35); transition:transform .12s, filter .12s; }
    .lb2v2-btn.primary { color:#04120a; } /* el verde neón lo pone el .primary global de la app (CTA estándar) */
    .lb2v2-btn:hover { filter:brightness(1.08); transform:translateY(-2px); }
    .lb2v2-btn-sub { font-weight:400; font-size:11px; opacity:.7; letter-spacing:0; }
    .lb2v2-sep { text-align:center; opacity:.5; font-size:12px; margin:2px 0; letter-spacing:1px; }
    .lb2v2-msg { text-align:center; font-size:13px; opacity:.85; min-height:18px; margin-top:4px; }
    .lb2v2-cod-lbl { text-align:center; font-size:11px; opacity:.55; letter-spacing:3px; }
    .lb2v2-cod-row { display:flex; align-items:center; justify-content:center; gap:10px; margin:2px 0 8px; }
    .lb2v2-cod { font-family:var(--f-display,'Bebas Neue',sans-serif); font-size:48px; letter-spacing:9px; line-height:1;
      color:var(--gold,#f5c518); text-shadow:0 0 22px rgba(245,197,24,.4); padding-left:9px; }
    .lb2v2-copiar { width:40px; height:40px; border-radius:12px; border:1px solid rgba(245,197,24,.3);
      background:rgba(245,197,24,.1); font-size:17px; cursor:pointer; transition:background .15s, transform .1s; }
    .lb2v2-copiar:hover { background:rgba(245,197,24,.22); } .lb2v2-copiar:active { transform:scale(.9); }
    .lb2v2-rol { text-align:center; font-size:13px; opacity:.85; margin-bottom:8px; }
    .lb2v2-asientos { display:grid; grid-template-columns:1fr 1fr; gap:9px; margin-bottom:8px; }
    .lb2v2-asiento { display:flex; align-items:center; gap:9px; padding:9px 11px; border-radius:12px;
      border:1px solid rgba(255,255,255,.1); background:rgba(0,0,0,.28); transition:box-shadow .2s, opacity .2s; }
    .lb2v2-asiento.nos.on  { box-shadow:0 0 0 1px rgba(46,204,113,.4) inset, 0 0 16px rgba(46,204,113,.1); border-color:rgba(46,204,113,.4); }
    .lb2v2-asiento.ellos.on { box-shadow:0 0 0 1px rgba(231,76,60,.4) inset, 0 0 16px rgba(231,76,60,.1); border-color:rgba(231,76,60,.4); }
    .lb2v2-asiento.off { opacity:.5; }
    .lb2v2-asiento.yo { box-shadow:0 0 0 1.5px rgba(245,197,24,.6) inset, 0 0 18px rgba(245,197,24,.14); }
    .lb2v2-as-av { font-size:24px; line-height:1; }
    .lb2v2-as-txt { display:flex; flex-direction:column; gap:1px; min-width:0; }
    .lb2v2-as-eq { font-size:10px; font-weight:700; letter-spacing:1px; opacity:.85; }
    .lb2v2-asiento.nos .lb2v2-as-eq { color:#3ff08a; } .lb2v2-asiento.ellos .lb2v2-as-eq { color:#ff6a5a; }
    .lb2v2-as-q { font-size:14px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
    .lb2v2-espera { text-align:center; font-size:13px; opacity:.7; }
    .lb2v2-sub2 { text-align:center; font-size:12px; opacity:.6; margin-top:-4px; }
    .lb2v2-buscando-msg { text-align:center; font-size:15px; opacity:.9; min-height:22px; }
    .lb2v2-spinner { width:44px; height:44px; margin:6px auto 2px; border-radius:50%;
      border:3px solid rgba(245,197,24,.2); border-top-color:var(--gold,#f5c518);
      animation:lb2v2Spin .8s linear infinite; }
    @keyframes lb2v2Spin { to { transform:rotate(360deg); } }
  `;
  document.head.appendChild(s);
}

if (typeof window !== "undefined") {
  window.online2v2 = online2v2;
  window.online2v2Crear = online2v2Crear;
  window.online2v2Buscar = online2v2Buscar;
  window.online2v2CancelarBusqueda = online2v2CancelarBusqueda;
  window.online2v2Unirse = online2v2Unirse;
  window.online2v2Empezar = online2v2Empezar;
  window.online2v2Salir = online2v2Salir;
  window.online2v2CopiarCodigo = online2v2CopiarCodigo;
  window.online2v2Revancha = online2v2Revancha;
  window.online2v2Cleanup = online2v2Cleanup;
  window.O2 = O2;
}
