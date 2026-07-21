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
  conectado: false,
  _handlers: {},      // evento -> [callbacks]
};

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
      _netEmit("close");
    });
  });
}

function _onServerMessage(data) {
  switch (data.type) {
    case "sala_creada":
      NET.rol    = "host";
      NET.codigo = data.codigo;
      _netEmit("sala_creada", data.codigo);
      break;
    case "unido":
      NET.rol    = "guest";
      NET.codigo = data.codigo;
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
      NET.rol     = "host";
      NET.codigo  = data.codigo;
      NET.asiento = data.asiento;
      _netEmit("sala4_creada", data);
      break;
    case "unido4":
      NET.rol     = "guest";
      NET.codigo  = data.codigo;
      NET.asiento = data.asiento;
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
function netEnviar(payload) {
  if (!NET.ws || !NET.conectado) return;
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

function netDesconectar() {
  if (NET.ws) {
    try { NET.ws.close(); } catch (e) { /* ignore */ }
  }
  NET.ws = null;
  NET.conectado = false;
  NET.rol = null;
  NET.codigo = null;
}
