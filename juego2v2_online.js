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
  // Config de la mesa: la fija el HOST en el lobby y viaja a los guests
  // (badges). puntos 15/30 · flor sí/no · turnoSeg = watchdog por turno.
  config: { puntos: 30, flor: true, turnoSeg: 45 },
  avatares: {},      // asiento -> emoji (cada humano manda el suyo al entrar)
  _corriendo: false,
  _prevLog: [],
};

// Avatar propio (el del Perfil DT); se manda al host al entrar a una sala.
function _2v2MiAvatar() { return (typeof S !== "undefined" && S.avatarJugador) || "🤠"; }

// ── Snapshot de estado (host → guest) ────────────────────────────
const _S2_CAMPOS = [
  "puntos", "limite", "cfgFlor", "manoAsiento", "turno", "ronda", "jugadasBaza",
  "bazas", "nivelTruco", "trucoEquipoCanto", "trucoAceptado", "trucoQuienQuiso", "_trucoRechazado",
  "canto", "envidoResuelto", "florActiva", "florResuelta", "florCantadas",
  "terminado", "ganadorPartido",
];
// OJO: `florPaso` NO está en la lista y no puede estarlo — "el asiento 2 se
// guardó la flor" dice que TENÍA flor, que es justo lo que la flor cantada
// protege. Viaja redactado abajo: solo el del propio guest.

// Snapshot redactado: el guest solo ve SU mano; de los demás, la cuenta.
function _snapshotParaGuest(asientoGuest) {
  const snap = {};
  _S2_CAMPOS.forEach(k => { snap[k] = S2[k]; });
  snap.jugadores = S2.jugadores.map((j, i) => ({
    id: j.id, nombre: j.nombre, equipo: j.equipo, esBot: j.esBot,
    mano: (i === asientoGuest) ? j.mano.slice() : j.mano.map(c => (c ? "?" : null)),
    // manoInicial propia: el guest la necesita para saber si TIENE flor (y
    // mostrarse el botón) aun después de tirar una carta. De los demás, nada.
    manoInicial: (i === asientoGuest) ? (j.manoInicial || []).slice() : [],
  }));
  snap.florPaso = S2.florPaso.map((v, i) => (i === asientoGuest ? v : false));
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
// El tiempo por turno es parte de la config de la mesa (10/30/45s): así el
// forfeit automático es una regla elegida, no una sorpresa.
let _turnoTimeoutMs2v2 = 45000;
let _watchdog2v2 = null;
function _limpiarWatchdog2v2() { if (_watchdog2v2) { clearTimeout(_watchdog2v2); _watchdog2v2 = null; } }
function _armarWatchdog2v2(fn) {
  _limpiarWatchdog2v2();
  // Re-validar AL DISPARAR (no al armar): entre medio el host pudo salir de
  // la mesa online y arrancar una partida offline sobre el mismo S2.
  _watchdog2v2 = setTimeout(() => { if (O2.activa && O2.esHost) fn(); }, _turnoTimeoutMs2v2);
}

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
      else _armarWatchdog2v2(function reintentar() {
        if (S2.terminado || !S2.canto) return;
        const a = _asientoRespondeCanto();
        if (a < 0) return;
        // A una flor pelada (cadena de 1) no se le puede decir que no: el
        // motor rechaza la respuesta, no cambia nada y la mesa quedaba
        // colgada para siempre. Ahi lo unico legal es comparar.
        const c = S2.canto;
        const florPelada = c && c.tipo === "flor" && (c.cadena || []).length <= 1;
        const resp = florPelada ? "quiero" : "no";
        if (accionResponderCanto2v2(a, resp)) _hostContinuar();
        else _armarWatchdog2v2(reintentar); // no se aplico: no dejar la mesa muda
      });
      return; // si responde un guest, esperamos su mensaje
    }
    if (r === "fin") { O2._corriendo = false; _hostBroadcastEstado(); _2v2OnlineReportar(); _2v2FinPartido(); return; }
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
    case "jugar": {
      // idx por RED: entero de la mano, no cualquier clave truthy ("length",
      // "__proto__" colgaban la mesa para los cuatro).
      const idx = Number(payload.idx);
      if (!Number.isInteger(idx) || idx < 0 || idx > 2) break;
      if (S2.turno === de && !S2.canto && S2.jugadores[de].mano[idx]) ok = jugarCarta2v2(de, idx);
      break;
    }
    case "cantar":
      ok = (payload.tipo === "truco") ? accionCantarTruco2v2(de) : accionCantarEnvido2v2(de, payload.tipo);
      break;
    case "flor":
      ok = (payload.tipo === "guardar") ? accionGuardarFlor2v2(de) : accionCantarFlor2v2(de);
      break;
    case "responder":
      ok = accionResponderCanto2v2(de, payload.resp);
      break;
    case "responder_con_envido":
      ok = accionResponderTrucoConEnvido2v2(de, payload.tipo);
      break;
  }
  if (!ok) {
    // Acción inválida (suba ilegal, fuera de turno, resp basura): el motor
    // la rechazó, pero el guest ya puso su UI en "esperando" antes de
    // mandarla. Le reenviamos el estado para que recalcule su modo y no
    // quede sin botones hasta el próximo evento.
    netEnviar4({ tipo: "estado", snap: _snapshotParaGuest(de) }, de);
    return;
  }
  _limpiarWatchdog2v2();
  _hostBroadcastEstado();
  _2v2ToastCantos();
  _2v2Render();
  if (S2.terminado) { _2v2OnlineReportar(); _2v2FinPartido(); return; }
  _hostLoop();
}

// ── Guest: aplica un snapshot recibido y renderiza ───────────────
function _guestModo() {
  if (S2.terminado || !S2.jugadores) return null;
  if (S2.canto) return _puedeResponderCanto(_2v2_miAsiento) ? "responde" : null;
  return (S2.turno === _2v2_miAsiento) ? "juega" : null;
}

function _guestRecibirEstado(snap) {
  // Un snapshot con la forma equivocada (jugadores:{}, _log:[1,2]) hacía
  // reventar _2v2Render DENTRO del handler, que se come la excepción con un
  // console.error: la mesa quedaba a medio pintar, sin error visible y sin
  // reconexión. Se valida la forma antes de aplicar nada.
  if (!snap || typeof snap !== "object" || !Array.isArray(snap.jugadores)) return;
  _S2_CAMPOS.forEach(k => { S2[k] = snap[k]; });
  S2.florPaso = Array.isArray(snap.florPaso) ? snap.florPaso : [false, false, false, false];
  S2.jugadores = snap.jugadores;
  S2._log = Array.isArray(snap._log) ? snap._log.filter(l => typeof l === "string") : [];
  _2v2_miAsiento = O2.miAsiento;
  _guestToasts(snap._log);
  _2v2_modo = _guestModo();
  _2v2Render();
  if (S2.terminado) { _2v2OnlineReportar(); _2v2FinPartido(); }
}

function _guestToasts(log) {
  log = log || [];
  const prev = O2._prevLog || [];
  log.forEach(l => {
    if (!prev.includes(l) && typeof _2v2MostrarEventoLog === "function") _2v2MostrarEventoLog(l);
  });
  O2._prevLog = log.slice();
}

// ── Reporte del resultado al server ──────────────────────────────
// El server confirma cruzando reportes de los DOS equipos (paridad de
// asiento), así que TODOS los humanos reportan — host y guests. El payload
// va en marco absoluto pares/impares: S2 está espejado del host en todos
// los clientes, así que los reportes de una partida honesta coinciden byte
// a byte sin reencuadrar nada. Antes esto no existía y el 2v2 online era
// invisible para el ranking.
let _o2ResultadoReportado = false;
function _2v2OnlineReportar() {
  if (!O2.activa || _o2ResultadoReportado) return;
  if (!S2.terminado || !S2.ganadorPartido) return;
  _o2ResultadoReportado = true;
  if (typeof netReportarResultado !== "function") return;
  const payload = {
    puntosPares:   (S2.puntos && S2.puntos[EQ2.NOS])    || 0,
    puntosImpares: (S2.puntos && S2.puntos[EQ2.ELLOS])  || 0,
    limite: S2.limite,
    ganador: S2.ganadorPartido === EQ2.NOS ? "pares" : "impares",
  };
  // _netIdentidad viene de reporte_resultado.js (scope global compartido).
  const yo = (typeof _netIdentidad === "function") ? _netIdentidad() : {};
  netReportarResultado(payload, yo);
}

// El aviso de confirmación: sin esto el server confirmaba y nadie se
// enteraba (resultado_confirmado no lo escuchaba nadie, del mapa del 2-ago).
if (typeof netOn === "function") {
  netOn("resultado_confirmado", () => {
    if (O2.activa && typeof showToast === "function") {
      showToast("✅ Resultado confirmado por los dos equipos — va al ranking", 2600);
    }
  });
  netOn("resultado_discrepancia", () => {
    if (O2.activa && typeof showToast === "function") {
      showToast("⚠️ Los reportes del resultado no coinciden: no va al ranking", 3200);
    }
  });
  // Comprobante (código de sala + ts del server) para la tarjeta de fin —
  // ver la misma lógica del lado 1v1 en juego_online.js.
  ["resultado_confirmado", "resultado_discrepancia", "resultado_incompleto", "resultado_abandono"].forEach((evento) => {
    netOn(evento, (resultado) => {
      O2._ultimoResultado = { estado: (resultado && resultado.estado) || evento.replace("resultado_", ""), ts: resultado && resultado.ts, codigo: O2.codigo };
      // La tarjeta de cierre puede estar ya pintada cuando llega la
      // confirmación (viaje de ida y vuelta al relay) — refrescarla en vivo.
      if (typeof _2v2ActualizarComprobante === "function") _2v2ActualizarComprobante();
    });
  });
}

// ── Arranque de la partida ───────────────────────────────────────
function online2v2Empezar() {
  if (!O2.esHost) return;
  _2v2AsegurarPantalla();
  if (typeof _2v2FinOcultar === "function") _2v2FinOcultar();
  const nombres = [0, 1, 2, 3].map(a =>
    O2.nombres[a] || (a === 0 ? O2.miNombre : (O2.ocupados.includes(a) ? ("Jugador " + a) : ("Bot " + a))));
  nuevo2v2({
    manoInicial: Math.floor(Math.random() * 4), nombres,
    limite: O2.config.puntos, conFlor: O2.config.flor,   // reglas de la mesa (las fijó el host)
  });
  _turnoTimeoutMs2v2 = (O2.config.turnoSeg || 45) * 1000;
  S2.jugadores.forEach((j, i) => { j.esBot = !O2.ocupados.includes(i); });

  _2v2_miAsiento = 0;
  _2v2_online = { esHost: true, enviar: function () {}, continuar: _hostContinuar };
  O2.activa = true;
  O2._prevLog = [];
  _2v2_logIdx = 0; _2v2_centroPrev = 0; _2v2_modo = null; _2v2_finRegistrado = false; _o2ResultadoReportado = false;

  document.getElementById("mesa2v2").classList.add("show");
  O2.ocupados.forEach(a => { if (a !== 0) netEnviar4({ tipo: "empezar", nombres }, a); });
  _hostBroadcastEstado();
  _2v2Render();
  _hostLoop();
}

function _guestEmpezar(msg) {
  _2v2AsegurarPantalla();
  // Si venimos de una revancha, el invitado todavía tiene el cierre del
  // partido anterior tapando la mesa: el host reparte y el otro no ve nada.
  if (typeof _2v2FinOcultar === "function") _2v2FinOcultar();
  (msg && msg.nombres || []).forEach((n, i) => { O2.nombres[i] = n; });
  _2v2_miAsiento = O2.miAsiento;
  _2v2_online = { esHost: false, enviar: function (p) { netEnviar4(p); } };
  O2.activa = true;
  O2._prevLog = [];
  _2v2_logIdx = 0; _2v2_centroPrev = 0; _2v2_modo = null; _2v2_finRegistrado = false; _o2ResultadoReportado = false;
  _lobby2v2Ocultar();
  document.getElementById("mesa2v2").classList.add("show");
}

// Revancha online: solo el host reparte de nuevo y difunde. La sala (y por
// lo tanto el CÓDIGO y el link que circula por el grupo) es la misma: acá no
// se crea ni se renombra nada, solo se reparte de nuevo.
function online2v2Revancha() {
  if (!O2.esHost) return;
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
  O2.config = { puntos: 30, flor: true, turnoSeg: 45 };
  O2.avatares = {};
  O2._prevLog = [];
  O2._ultimoResultado = null;
  _limpiarWatchdog2v2();
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
  O2.avatares = { 0: _2v2MiAvatar() };
  _lobby2v2Vista("sala");
  _lobby2v2Render();
});
netOn("unido4", (d) => {
  O2.buscando = false;
  O2.esHost = false; O2.miAsiento = d.asiento; O2.codigo = d.codigo;
  O2.ocupados = d.ocupados || [0, d.asiento];
  O2.avatares[d.asiento] = _2v2MiAvatar();
  netEnviar4({ tipo: "perfil", avatar: _2v2MiAvatar() }); // que el host lo reparta
  _lobby2v2Vista("sala");
  _lobby2v2Render();
});
netOn("en_cola4", (d) => {
  const n = (d && d.enCola) || 1;
  _lobby2v2SetBuscando(`Buscando rivales… ${n}/4 en la cola. Quedate en línea.`);
});
netOn("jugador4_conectado", (d) => {
  O2.ocupados = d.ocupados || O2.ocupados;
  // El host le manda la config de la mesa y los avatares al que acaba de entrar.
  if (O2.esHost && typeof d.asiento === "number") {
    netEnviar4({ tipo: "config", config: O2.config }, d.asiento);
    netEnviar4({ tipo: "avatares", avatares: O2.avatares }, d.asiento);
  }
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
// Errores del server en el lobby/mesa 2v2: sin esto, "Esa sala de 4 no
// existe" o "ya tiene 4 jugadores" no se mostraban en ningun lado y el
// boton UNIRME parecia no hacer nada.
netOn("error", (mensaje) => {
  if (!O2.buscando && !O2.codigo && !O2.activa) return; // no es nuestro
  const txt = mensaje || "Error de conexión.";
  O2.buscando = false;
  if (O2.activa) {
    if (typeof netDesconectar === "function") netDesconectar();
    online2v2Cleanup();
    if (typeof irA === "function") irA("online-screen");
  }
  if (typeof showToast === "function") showToast("⚠️ " + txt, 4200);
  const el = document.getElementById("lb2v2-msg");
  if (el) el.textContent = txt;
});

netOn("host4_desconectado", () => {
  if (typeof showToast === "function") showToast("⚠️ El anfitrión se fue. Sala cerrada.");
  online2v2Salir();
});
// Se cortó nuestra propia conexión con el servidor durante una partida de 4.
// Si netClient.js va a reintentar solo (invitado con código), no asustamos
// con "volvé a entrar a mano" — esperamos a que el reintento resuelva.
netOn("close", (info) => {
  if (!O2.activa) return;
  if (info && info.seVaAReconectar) {
    if (typeof showToast === "function") showToast("⚠️ Se cortó la conexión — reconectando...");
    return;
  }
  if (typeof showToast === "function") {
    showToast(O2.esHost
      ? "⚠️ Se cortó tu conexión. La sala se cerró; creá una nueva."
      : "⚠️ Se cortó la conexión. Volvé a entrar con el mismo código.");
  }
});

netOn("reconectando", (info) => {
  if (!O2.activa) return;
  if (typeof showToast === "function") showToast(`🔄 Reconectando... (intento ${info.intento}/${info.maxIntentos})`);
});

netOn("reconexion_fallida", () => {
  if (!O2.activa) return;
  if (typeof showToast === "function") showToast("⚠️ No se pudo reconectar solo. Volvé a entrar con el mismo código.");
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
  // Un jugador mandó su avatar: el host lo guarda y reparte el mapa completo.
  if (payload.tipo === "perfil") {
    if (O2.esHost && typeof de === "number") {
      O2.avatares[de] = String(payload.avatar || "🧑").slice(0, 8);
      O2.ocupados.forEach(a => { if (a !== 0) netEnviar4({ tipo: "avatares", avatares: O2.avatares }, a); });
      _lobby2v2Render();
      if (O2.activa) _2v2Render(); // por si entró con la partida ya andando
    }
    return;
  }
  if (O2.esHost) { _hostRecibirAccion(de, payload); return; }
  // Mismo clamp que aplica el host al recibirlos de a uno (línea del
  // "perfil"): el mapa completo llega del host y venía sin sanear — un
  // "avatar" de 100 KB rompía el layout del lobby y de la mesa.
  if (payload.tipo === "avatares") { O2.avatares = _avataresSeguros(payload.avatares); _lobby2v2Render(); if (O2.activa) _2v2Render(); return; }
  if (payload.tipo === "config") { O2.config = _configSegura(payload.config); _lobby2v2Render(); return; }
  if (payload.tipo === "empezar") _guestEmpezar(payload);
  else if (payload.tipo === "estado") { if (!O2.activa) _guestEmpezar({ nombres: [] }); _guestRecibirEstado(payload.snap); }
});

// El host cambia una regla de la mesa desde el lobby y la difunde.
function online2v2SetCfg(campo, valor) {
  if (!O2.esHost || O2.activa) return; // solo el host, solo antes de empezar
  O2.config[campo] = valor;
  O2.ocupados.forEach(a => { if (a !== 0) netEnviar4({ tipo: "config", config: O2.config }, a); });
  _lobby2v2Render();
}

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

// Reglas de la mesa en el lobby: el host las elige (chips), los guests las ven.
function _lobby2v2RenderConfig() {
  const el = document.getElementById("lb2v2-config");
  if (!el) return;
  const c = O2.config;
  if (!O2.esHost) {
    el.innerHTML = `<div class="lb2v2-cfg-badges">` +
      `<span class="lb2v2-cfg-badge">🏁 a ${c.puntos}</span>` +
      `<span class="lb2v2-cfg-badge">🌸 ${c.flor ? "con flor" : "sin flor"}</span>` +
      `<span class="lb2v2-cfg-badge">⏱ ${c.turnoSeg}s por turno</span></div>`;
    return;
  }
  const chip = (campo, valor, label) =>
    `<button class="lb2v2-cfg-chip ${c[campo] === valor ? "on" : ""}" ` +
    `onclick="online2v2SetCfg('${campo}', ${JSON.stringify(valor)})">${label}</button>`;
  el.innerHTML =
    `<div class="lb2v2-cfg-row"><span class="lb2v2-cfg-lbl">PUNTOS</span>${chip("puntos", 15, "15")}${chip("puntos", 30, "30")}</div>` +
    `<div class="lb2v2-cfg-row"><span class="lb2v2-cfg-lbl">FLOR</span>${chip("flor", true, "SÍ")}${chip("flor", false, "NO")}</div>` +
    `<div class="lb2v2-cfg-row"><span class="lb2v2-cfg-lbl">TIEMPO</span>${chip("turnoSeg", 10, "10s")}${chip("turnoSeg", 30, "30s")}${chip("turnoSeg", 45, "45s")}</div>`;
}

/* La config la elige el HOST, o sea que es dato ajeno y termina en un
   innerHTML del lobby del guest. Allowlist de valores cerrados (no un
   escape): puntos y turnoSeg solo pueden ser los del selector, y flor es
   booleano. Un host modificado mandaba `puntos:"<img src=x onerror=...>"`
   y ejecutaba JS en los otros tres, sin que nadie tocara nada — mismo
   agujero que se cerro para avatar/nombre, por otra puerta. */
function _configSegura(cfg) {
  const base = O2.config || { puntos: 30, flor: false, turnoSeg: 30 };
  cfg = cfg && typeof cfg === "object" ? cfg : {};
  const puntos = [15, 30].includes(Number(cfg.puntos)) ? Number(cfg.puntos) : base.puntos;
  const turnoSeg = [10, 30, 45].includes(Number(cfg.turnoSeg)) ? Number(cfg.turnoSeg) : base.turnoSeg;
  return { puntos, flor: !!cfg.flor, turnoSeg };
}

/* El mapa de avatares también llega del host: mismo criterio que
   _configSegura, clamp por asiento (0-3) y 8 chars, igual que el que ya
   aplicaba el host al recibirlos de a uno. */
function _avataresSeguros(mapa) {
  const out = {};
  if (!mapa || typeof mapa !== "object") return out;
  for (let a = 0; a <= 3; a++) {
    if (mapa[a] != null) out[a] = String(mapa[a]).slice(0, 8);
  }
  return out;
}

function _lobby2v2Render() {
  _lobby2v2RenderConfig();
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
      const avatar = esc(O2.avatares[a] || (a === 0 ? "👑" : ocupado ? "🧑" : "🤖"));
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
        <div id="lb2v2-config" class="lb2v2-config"></div>
        <div id="lb2v2-asientos" class="lb2v2-asientos"></div>
        <button class="lb2v2-btn" onclick="online2v2CompartirWsp()">📲 COMPARTIR POR WHATSAPP <span class="lb2v2-btn-sub">— link directo a la mesa</span></button>
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
    .lb2v2-config { display:flex; flex-direction:column; gap:6px; margin-bottom:10px; }
    .lb2v2-cfg-row { display:flex; align-items:center; gap:6px; }
    .lb2v2-cfg-lbl { font-size:10px; font-weight:700; letter-spacing:2px; opacity:.6; width:58px; text-align:right; }
    .lb2v2-cfg-chip { padding:6px 13px; border-radius:14px; border:1px solid rgba(255,255,255,.18);
      background:rgba(0,0,0,.3); color:#fff; font-size:12px; font-weight:700; cursor:pointer;
      font-family:var(--f-ui,'Oswald',sans-serif); letter-spacing:1px; transition:all .12s; }
    .lb2v2-cfg-chip:hover { border-color:rgba(245,197,24,.5); }
    .lb2v2-cfg-chip.on { background:rgba(245,197,24,.18); border-color:var(--gold,#f5c518); color:var(--gold,#f5c518); }
    .lb2v2-cfg-badges { display:flex; justify-content:center; gap:7px; flex-wrap:wrap; }
    .lb2v2-cfg-badge { padding:5px 11px; border-radius:12px; font-size:11.5px; letter-spacing:.5px;
      background:rgba(0,0,0,.3); border:1px solid rgba(255,255,255,.14); color:rgba(255,255,255,.85); }
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
  window.online2v2SetCfg = online2v2SetCfg;
  window.online2v2CopiarCodigo = online2v2CopiarCodigo;
  window.online2v2Revancha = online2v2Revancha;
  window.online2v2Cleanup = online2v2Cleanup;
  window.O2 = O2;
}
