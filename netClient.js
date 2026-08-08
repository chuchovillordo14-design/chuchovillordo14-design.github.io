// ══════════════════════════════════════════════════════════════
// NET CLIENT — conexión WebSocket con el servidor de relay
// para el modo "Partido Amistoso Online"
//
// No sabe nada de las reglas del truco: solo conecta, crea/une
// salas, y permite enviar/recibir mensajes JSON con el rival.
// La lógica de juego (juego_online.js) se suscribe via NET.on(...)
// ══════════════════════════════════════════════════════════════

const NET_URL_KEY = "truco_net_url";

// URL por defecto del servidor de relay. El usuario puede pisarla
// desde la pantalla "Jugar Online" (se guarda en localStorage).
const NET_URL_DEFAULT = "wss://trucogol.onrender.com";

const NET = {
  ws:        null,
  rol:       null,   // 'host' | 'guest'
  codigo:    null,
  asiento:   null,   // solo salas de 4 (2v2): distingue unirse vs unirse4 al reconectar
  conectado: false,
  auto1v1:   null,   // { codigo, asiento:"p1"|"p2", token } mientras hay una mesa autoritativa activa
  _handlers: {},      // evento -> [callbacks]
};

// ── Reconexión automática (invitado peer-hosted, o cualquiera de los dos
// asientos de una mesa auto1v1) ───────────────────────────────────────
// Si el HOST peer-hosted se desconecta, el server borra la sala al toque
// (ver server/server.js: "Sin host no hay partida posible") — no hay nada
// a lo que reconectarse, así que el host no reintenta. El invitado sí
// puede: la sala sigue viva esperando que vuelva a entrar con el mismo
// código. El reingreso en sí ya estaba resuelto del lado del juego (el
// host resincroniza el estado completo al recibir "hola" de nuevo — ver
// motor_online.js — o al ver "jugador4_conectado" — ver
// juego2v2_online.js); acá solo faltaba automatizar el "reconectate con
// el mismo código", que antes había que hacerlo a mano.
//
// La mesa auto1v1 (server/reglas/orquestador1v1.js) es distinta: al correr
// el motor en el server, NINGÚN asiento es "el host" — los dos pueden (y
// deben) reconectar igual. El server la pausa y espera dentro de una
// ventana de gracia (ver abandonarSala) en vez de cerrarla al toque.
const NET_RECONEXION_MAX_INTENTOS = 5;
const NET_RECONEXION_BASE_MS = 1500; // backoff: 1.5s, 3s, 6s, 12s, 24s

let _reconectTimer    = null;
let _reconectIntentos = 0;

// _enReintento: netConectar() arranca llamando a _cancelarReconexion(), y
// como el propio reintento llama a netConectar(), el contador se reseteaba
// a 0 en CADA vuelta. Resultado: _reconectIntentos nunca pasaba de 1, la
// espera quedaba clavada en la base (sin backoff), el tope de 5 intentos no
// se alcanzaba NUNCA y "reconexion_fallida" no se emitía jamás — el guest
// reintentaba de por vida y el camino manual no aparecía nunca.
let _enReintento = false;

function _cancelarReconexion() {
  if (_reconectTimer) { clearTimeout(_reconectTimer); _reconectTimer = null; }
  if (!_enReintento) _reconectIntentos = 0;
}

function _debeReconectar() {
  return (NET.rol === "guest" && !!NET.codigo) || !!NET.auto1v1;
}

// Único punto que programa un reintento: lo dispara el listener de
// "close" de CADA socket (incluido uno que nunca llegó a abrir), así que
// no hace falta re-llamarlo manualmente en ningún otro lado — evita
// programar el reintento dos veces para el mismo intento fallido.
function _programarReconexion() {
  if (!_debeReconectar() || _reconectIntentos >= NET_RECONEXION_MAX_INTENTOS) {
    if (_debeReconectar()) _netEmit("reconexion_fallida");
    _cancelarReconexion();
    return;
  }
  const codigo   = NET.codigo;
  const auto1v1  = NET.auto1v1;
  const esSala4  = typeof NET.asiento === "number";
  const espera   = NET_RECONEXION_BASE_MS * Math.pow(2, _reconectIntentos);
  _reconectIntentos++;
  _netEmit("reconectando", { intento: _reconectIntentos, maxIntentos: NET_RECONEXION_MAX_INTENTOS });

  _reconectTimer = setTimeout(() => {
    _reconectTimer = null;
    _enReintento = true;
    netConectar()
      .then(() => {
        _enReintento = false;
        _reconectIntentos = 0; // reconectó de verdad: el backoff vuelve a cero
        if (auto1v1) netAuto1v1Reconectar(auto1v1.codigo, auto1v1.asiento, auto1v1.token);
        else if (esSala4) netUnirseSala4(codigo);
        else netUnirseSala(codigo);
      })
      .catch(() => { _enReintento = false; /* el close del socket fallido vuelve a disparar esto */ });
  }, espera);
}

// ── Configuración de URL del servidor ──────────────────────────

function netGetUrl() {
  try {
    return localStorage.getItem(NET_URL_KEY) || NET_URL_DEFAULT;
  } catch (e) {
    return NET_URL_DEFAULT;
  }
}

function netSetUrl(url) {
  lsSet(NET_URL_KEY, url.trim());
}

// ── Sistema de eventos ──────────────────────────────────────────
// Eventos emitidos: 'open', 'sala_creada', 'unido', 'rival_conectado',
// 'rival_desconectado', 'error', 'msg', 'close'

function netOn(evento, cb) {
  (NET._handlers[evento] = NET._handlers[evento] || []).push(cb);
}

function netOff(evento, cb) {
  const arr = NET._handlers[evento];
  if (!arr) return;
  const i = arr.indexOf(cb);
  if (i >= 0) arr.splice(i, 1);
}

function _netEmit(evento, data) {
  (NET._handlers[evento] || []).forEach(cb => {
    try { cb(data); } catch (e) { console.error("netClient handler error:", e); }
  });
}

// ── Conexión ─────────────────────────────────────────────────────

function netConectar(url) {
  return new Promise((resolve, reject) => {
    const target = url || netGetUrl();

    // Cancelar cualquier reintento programado y soltar el socket anterior:
    // sin esto quedaba un socket huerfano (el del intento lento) que al
    // conectar tarde pisaba NET.ws y mandaba todo por una conexion que el
    // server no tiene en ninguna sala.
    _cancelarReconexion();
    if (NET.ws) {
      const viejo = NET.ws;
      NET.ws = null;
      try { viejo.onclose = null; viejo.onmessage = null; viejo.onerror = null; viejo.close(); } catch (e) {}
    }

    let ws;
    try {
      ws = new WebSocket(target);
    } catch (e) {
      reject(e);
      return;
    }

    NET.ws = ws;
    NET.conectado = false;

    // El relay corre en Render (plan gratis): si estuvo inactivo se
    // duerme y la primera conexión puede tardar ~30-60s en despertar.
    // Sin timeout, el WebSocket queda colgado sin límite. Cortamos a 75s
    // con un mensaje claro en vez de dejar "Conectando..." para siempre.
    let saldado = false;
    const timeoutId = setTimeout(() => {
      if (saldado) return;
      saldado = true;
      try { ws.close(); } catch (e) { /* ignore */ }
      reject(new Error("El servidor tardó demasiado en responder (puede estar despertando). Probá de nuevo en unos segundos."));
    }, 75000);

    const onOpenError = (ev) => {
      if (saldado) return;
      saldado = true;
      clearTimeout(timeoutId);
      ws.removeEventListener("open", onOpen);
      ws.removeEventListener("error", onErr);
      reject(new Error("No se pudo conectar al servidor"));
    };
    const onOpen = () => {
      if (saldado) return;
      saldado = true;
      clearTimeout(timeoutId);
      ws.removeEventListener("error", onErr);
      NET.conectado = true;
      _netEmit("open");
      resolve(ws);
    };
    const onErr = onOpenError;

    ws.addEventListener("open", onOpen, { once: true });
    ws.addEventListener("error", onErr, { once: true });

    ws.addEventListener("message", (ev) => {
      let data;
      try { data = JSON.parse(ev.data); } catch (e) { return; }
      _onServerMessage(data);
    });

    ws.addEventListener("close", () => {
      NET.conectado = false;
      // Avisamos ANTES de programar el reintento, para que quien escuche
      // "close" sepa si conviene mostrar "reconectando..." en vez de tirar
      // abajo la pantalla de juego (ver juego_online.js/juego2v2_online.js).
      _netEmit("close", { seVaAReconectar: _debeReconectar() && _reconectIntentos < NET_RECONEXION_MAX_INTENTOS });
      _programarReconexion();
    });
  });
}

function _onServerMessage(data) {
  switch (data.type) {
    case "sala_creada":
      // Si estabamos jugando de GUEST, esto es el server promocionandonos a
      // host porque el socket del host todavia figuraba abierto. Aceptarlo
      // nos dejaba mudos: ni difundimos (S.esHost sigue false) ni recibimos
      // estado (ya no somos "guest"). Se trata como sala caida.
      if (NET.rol === "guest" && typeof S !== "undefined" && S.modoOnline) {
        _netEmit("error", "Se cayo la conexion con la mesa. Volve a entrar con el codigo.");
        break;
      }
      NET.rol    = "host";
      NET.codigo = data.codigo;
      NET.asiento = null;
      _reconectIntentos = 0;
      _netEmit("sala_creada", data.codigo);
      break;
    case "unido":
      NET.rol    = "guest";
      NET.codigo = data.codigo;
      NET.asiento = null;   // sala de 2: sin esto la reconexion manda unirse4
      _reconectIntentos = 0; // reingreso confirmado: el próximo corte arranca con backoff fresco
      _netEmit("unido", data.codigo);
      break;
    case "rival_conectado":
      _netEmit("rival_conectado");
      break;
    case "rival_desconectado":
      _netEmit("rival_desconectado");
      break;
    case "error":
      _netEmit("error", data.mensaje);
      break;
    case "msg":
      _netEmit("msg", data.payload);
      break;
    // ── Cola pública 1v1 (matchmaking) ──
    case "en_cola":
      _netEmit("en_cola");
      break;
    case "busqueda_cancelada":
      _netEmit("busqueda_cancelada");
      break;
    // ── Cola pública 2v2 (matchmaking de 4) ──
    case "en_cola4":
      _netEmit("en_cola4", data);
      break;
    case "busqueda4_cancelada":
      _netEmit("busqueda4_cancelada");
      break;
    // ── Salas de 4 (2v2 online) ──
    case "sala4_creada":
      // Misma guarda que el 1v1: si YA estamos jugando de guest, esto nos
      // "promociona" a host de una mesa que no manejamos — el cliente
      // dejaba de aplicar los snapshots del host real y la mesa se
      // congelaba sin aviso ni reconexión.
      if (NET.rol === "guest" && typeof O2 !== "undefined" && O2 && O2.activa) {
        _netEmit("error", "Se cayo la conexion con la mesa. Volve a entrar con el codigo.");
        break;
      }
      NET.rol     = "host";
      NET.codigo  = data.codigo;
      NET.asiento = data.asiento;
      _reconectIntentos = 0;
      _netEmit("sala4_creada", data);
      break;
    case "unido4":
      NET.rol     = "guest";
      NET.codigo  = data.codigo;
      NET.asiento = data.asiento;
      _reconectIntentos = 0; // reingreso confirmado: el próximo corte arranca con backoff fresco
      _netEmit("unido4", data);
      break;
    case "jugador4_conectado":
      _netEmit("jugador4_conectado", data);
      break;
    case "jugador4_desconectado":
      _netEmit("jugador4_desconectado", data);
      break;
    case "host4_desconectado":
      _netEmit("host4_desconectado", data);
      break;
    case "msg4":
      _netEmit("msg4", { payload: data.payload, de: data.de });
      break;
    // ── Resultado autoritativo (confirmación doble host+guest) ──
    case "resultado_confirmado":
    case "resultado_discrepancia":
    case "resultado_incompleto":
    case "resultado_abandono":
      _netEmit(data.type, data.resultado);
      break;
    // ── Mesa 1v1 AUTORITATIVA (server/reglas/orquestador1v1.js) ──
    // A diferencia del resto del online, acá el server corre el motor:
    // no hay "host" ni promoción de rol, así que no hace falta ninguna
    // guarda de las de arriba — pasa derecho. NET.auto1v1 es lo que usa
    // _debeReconectar()/_programarReconexion() de arriba para saber que
    // hay una mesa a la que volver (y con qué asiento) tras un corte.
    case "auto1v1_creada":
      NET.auto1v1 = { codigo: data.codigo, asiento: "p1", token: data.token };
      _reconectIntentos = 0;
      _netEmit(data.type, data);
      break;
    case "auto1v1_unido":
      NET.auto1v1 = { codigo: data.codigo, asiento: "p2", token: data.token };
      _reconectIntentos = 0;
      _netEmit(data.type, data);
      break;
    case "auto1v1_reconectado":
      _reconectIntentos = 0; // reingreso confirmado: el próximo corte arranca con backoff fresco
      _netEmit(data.type, data);
      break;
    case "auto1v1_estado":
    case "auto1v1_fin":
    case "auto1v1_rival_reconectando":
    case "auto1v1_rival_reconectado":
      _netEmit(data.type, data);
      break;
    case "auto1v1_rival_desconectado":
      // Definitivo (venció la ventana de gracia, o nunca hubo partida que
      // preservar): no hay a qué reconectarse más.
      NET.auto1v1 = null;
      _netEmit(data.type, data);
      break;
    case "auto1v1_error":
      _netEmit("auto1v1_error", data.mensaje);
      break;
    default:
      break;
  }
}

// ── Acciones ──────────────────────────────────────────────────────

function netCrearSala() {
  if (!NET.ws || !NET.conectado) return;
  NET.ws.send(JSON.stringify({ type: "crear" }));
}

function netUnirseSala(codigo) {
  if (!NET.ws || !NET.conectado) return;
  NET.ws.send(JSON.stringify({ type: "unirse", codigo: (codigo || "").toUpperCase().trim() }));
}

// ── Cola pública 1v1 (matchmaking) ────────────────────────────────
// Pide al servidor que nos empareje con otro jugador que esté buscando.
function netBuscarPartida() {
  if (!NET.ws || !NET.conectado) return;
  NET.ws.send(JSON.stringify({ type: "buscar" }));
}
function netCancelarBusqueda() {
  if (!NET.ws || !NET.conectado) return;
  NET.ws.send(JSON.stringify({ type: "cancelar_buscar" }));
}

// Cola pública 2v2 (junta de a 4 jugadores).
function netBuscarPartida4() {
  if (!NET.ws || !NET.conectado) return;
  NET.ws.send(JSON.stringify({ type: "buscar4" }));
}
function netCancelarBusqueda4() {
  if (!NET.ws || !NET.conectado) return;
  NET.ws.send(JSON.stringify({ type: "cancelar_buscar4" }));
}

// Envía un mensaje de juego al rival (lo procesa juego_online.js del otro lado)
//
// SALVO en la mesa 1v1 AUTORITATIVA ("JUGAR CON UN AMIGO"): ahí no hay un
// rival que procese nada, el árbitro es el server. Desde el 5 ago esa mesa
// se juega en la pantalla de siempre, y la pantalla manda sus acciones con
// el protocolo del relay ({accion:"mazo"}); auto1v1_mesa.js las traduce a
// las que espera el motor del server ({tipo:"irseAlMazo"}).
//
// El desvío va ACÁ, en la capa de transporte, y no en los 14 puntos de
// juego.js que llaman a esta función: elegir a dónde va un mensaje es
// justo lo que le toca decidir a esta capa, y así juego.js no se entera de
// que existe un modo nuevo. Lo que no es una acción de juego (el "hola"
// del relay, por ejemplo) no tiene sentido en este modo y no se manda.
function netEnviar(payload) {
  if (!NET.ws || !NET.conectado) return;
  if (typeof S !== "undefined" && S && S.modoAuto1v1 &&
      typeof auto1v1MesaEnviarAccion === "function") {
    auto1v1MesaEnviarAccion(payload);
    return;
  }
  NET.ws.send(JSON.stringify({ type: "msg", payload }));
}

// ── Salas de 4 (2v2 online) ──────────────────────────────────────
function netCrearSala4() {
  if (!NET.ws || !NET.conectado) return;
  NET.ws.send(JSON.stringify({ type: "crear4" }));
}
function netUnirseSala4(codigo) {
  if (!NET.ws || !NET.conectado) return;
  NET.ws.send(JSON.stringify({ type: "unirse4", codigo: (codigo || "").toUpperCase().trim() }));
}
// Host: enviar a un guest puntual (para) o a todos (para omitido).
// Guest: enviar su acción al host (para se ignora).
function netEnviar4(payload, para) {
  if (!NET.ws || !NET.conectado) return;
  const msg = { type: "msg4", payload };
  if (typeof para === "number") msg.para = para;
  NET.ws.send(JSON.stringify(msg));
}

// Cada cliente (host y guest) reporta por su cuenta cómo terminó la
// partida — el server solo lo confirma si ambos reportes coinciden
// (ver src/online/reporte_resultado.js, que arma el payload).
// `yo` (token + nombre, para el ranking) viaja FUERA de `payload`: el
// server compara solo `payload`, y host y guest tienen nombres distintos.
function netReportarResultado(payload, yo) {
  if (!NET.ws || !NET.conectado) return;
  NET.ws.send(JSON.stringify({ type: "partida_terminada", payload, yo }));
}

// ── Mesa 1v1 autoritativa (server/reglas/orquestador1v1.js) ──────────
// El motor corre en el server: acá solo se manda el pedido crudo (mismo
// patrón que netCrearSala4/netUnirseSala4) y las acciones de juego
// (jugarCarta, cantarEnvido, responderCanto, irseAlMazo...) tal cual las
// espera aplicarAccion() del lado servidor — ver src/online/auto1v1_client.js.
// Nivel de estadio propio, para que la mesa se juegue en el del más
// avanzado de los dos (el server lo satura a 1-6 y calcula el máximo, ver
// _nivelMesaAuto1v1 en server/server.js). Es cosmético: si escenarios.js
// todavía no cargó, vale 1 y la mesa arranca en el estadio mínimo.
function _netNivelEstadio() {
  try {
    if (typeof window.escenarioNivelActual === "function") return window.escenarioNivelActual();
  } catch (e) { /* escenarios.js no cargado */ }
  return 1;
}

// `yo` (token de dispositivo + nombre) viaja al SENTARSE, no al terminar:
// en esta mesa el resultado lo dicta el server, no hay "partida_terminada"
// del cliente donde colgar la identidad. Sin esto el server guardaba el
// resultado sin poder sumárselo a nadie (ni ranking ni torneo posible).
// Lo arma auto1v1_client.js (_auto1v1Identidad), que es el que sabe con
// qué nombre se sentó el jugador en ESTA mesa.
function netAuto1v1Crear(config, yo) {
  if (!NET.ws || !NET.conectado) return;
  NET.ws.send(JSON.stringify({
    type: "auto1v1_crear",
    config: config || {},
    nivel: _netNivelEstadio(),
    yo: yo || null,
  }));
}
function netAuto1v1Unirse(codigo, yo) {
  if (!NET.ws || !NET.conectado) return;
  NET.ws.send(JSON.stringify({
    type: "auto1v1_unirse",
    codigo: (codigo || "").toUpperCase().trim(),
    nivel: _netNivelEstadio(),
    yo: yo || null,
  }));
}
function netAuto1v1Accion(accion) {
  if (!NET.ws || !NET.conectado) return;
  NET.ws.send(JSON.stringify({ type: "auto1v1_accion", accion }));
}
// Vuelve a un asiento propio tras un corte — lo dispara solo
// _programarReconexion() de arriba (backoff automático), nunca hace falta
// llamarlo a mano.
function netAuto1v1Reconectar(codigo, asiento, token) {
  if (!NET.ws || !NET.conectado) return;
  NET.ws.send(JSON.stringify({ type: "auto1v1_reconectar", codigo, asiento, token }));
}

function netDesconectar() {
  // Cancelar ANTES de cerrar: nulear rol/codigo acá hace que _debeReconectar()
  // ya dé false para cuando el listener de "close" del socket dispare (los
  // eventos close son siempre asíncronos), pero cancelamos el timer también
  // por las dudas de que ya hubiera uno programado de un corte anterior.
  _cancelarReconexion();
  if (NET.ws) {
    try { NET.ws.close(); } catch (e) { /* ignore */ }
  }
  NET.ws = null;
  NET.conectado = false;
  NET.rol = null;
  NET.codigo = null;
  NET.asiento = null;
  NET.auto1v1 = null;
}
