// ══════════════════════════════════════════════════════════════
// JUEGO ONLINE — pantalla de lobby para "Partido Online"
//
// Maneja: crear sala / unirse con código / configuración del
// servidor de relay / estados de conexión.
//
// La sincronización de la partida en sí (motor host/invitado)
// se conecta a este lobby una vez que ambos jugadores están
// en la misma sala (evento "ambos_listos").
// ══════════════════════════════════════════════════════════════

const ONLINE = {
  nombre: "",
  nombreRival: "",
  avatarRival: "🌐",
  partidaIniciada: false,
  buscando: false,   // esperando emparejamiento en la cola pública
  _avatarsBaseLen: null,
};

// ── Limpieza al salir del modo online ────────────────────────────
function _onlineResetEstadoPartida() {
  if (typeof S !== "undefined") {
    S.modoOnline = false;
    S.esHost     = false;
  }
  ONLINE.partidaIniciada = false;
  ONLINE.buscando        = false;
  ONLINE.nombreRival     = "";
  if (typeof AVATARS !== "undefined" && ONLINE._avatarsBaseLen !== null) {
    AVATARS.length = ONLINE._avatarsBaseLen;
    ONLINE._avatarsBaseLen = null;
  }
}

// ── Vistas dentro de #online-screen ─────────────────────────────

function _onlineMostrarVista(id) {
  ["online-menu", "online-buscando", "online-waiting", "online-status"].forEach(v => {
    const el = document.getElementById(v);
    if (el) el.style.display = (v === id) ? "flex" : "none";
  });
}

function _onlineSetMsg(id, texto) {
  const el = document.getElementById(id);
  if (el) el.textContent = texto || "";
}

// ── Configuración del servidor ──────────────────────────────────

function onlineToggleConfig() {
  const cfg = document.getElementById("online-config");
  if (!cfg) return;
  const visible = cfg.style.display !== "none";
  cfg.style.display = visible ? "none" : "flex";
  if (!visible) {
    const inp = document.getElementById("online-server-url");
    if (inp) inp.value = netGetUrl();
  }
}

function onlineGuardarUrl() {
  const inp = document.getElementById("online-server-url");
  if (!inp || !inp.value.trim()) return;
  netSetUrl(inp.value);
  if (typeof showToast === "function") showToast("✅ Dirección del servidor guardada");
}

// ── Buscar rival (cola pública / matchmaking) ────────────────────

async function onlineBuscarPartida() {
  ONLINE.nombre = (document.getElementById("online-nombre")?.value || "").trim() || ONLINE.nombre || "Jugador";
  ONLINE.buscando = true;
  _onlineMostrarVista("online-buscando");
  _onlineSetMsg("online-buscando-msg", "Conectando...");

  try {
    if (!NET.conectado) {
      const avisar = setTimeout(() => _onlineSetMsg("online-buscando-msg",
        "Despertando el servidor... la primera conexión del día puede tardar hasta 1 minuto. Quedate acá."), 4000);
      try { await netConectar(); } finally { clearTimeout(avisar); }
    }
    netBuscarPartida();
  } catch (e) {
    ONLINE.buscando = false;
    _onlineMostrarVista("online-menu");
    _onlineSetMsg("online-menu-msg", (e && e.message) || "No se pudo conectar al servidor. Probá de nuevo en unos segundos.");
  }
}

function onlineCancelarBusqueda() {
  netCancelarBusqueda();
  ONLINE.buscando = false;
  _onlineMostrarVista("online-menu");
  _onlineSetMsg("online-menu-msg", "");
}

// ── Crear sala (host) ────────────────────────────────────────────

async function onlineCrearSala() {
  ONLINE.nombre = (document.getElementById("online-nombre")?.value || "").trim() || ONLINE.nombre || "Jugador";
  _onlineSetMsg("online-menu-msg", "Conectando...");

  try {
    if (!NET.conectado) {
      const avisar = setTimeout(() => _onlineSetMsg("online-menu-msg",
        "Despertando el servidor... la primera conexión del día puede tardar hasta 1 minuto. Esperá."), 4000);
      try { await netConectar(); } finally { clearTimeout(avisar); }
    }
    netCrearSala();
  } catch (e) {
    _onlineSetMsg("online-menu-msg", (e && e.message) || "No se pudo conectar al servidor. Probá de nuevo en unos segundos.");
  }
}

// ── Unirse a sala (invitado) ─────────────────────────────────────

async function onlineUnirseSala() {
  const codigo = (document.getElementById("online-codigo-input")?.value || "").trim();
  if (codigo.length < 5) {
    _onlineSetMsg("online-menu-msg", "Ingresá el código de 5 caracteres que te pasó tu rival.");
    return;
  }
  ONLINE.nombre = (document.getElementById("online-nombre")?.value || "").trim() || ONLINE.nombre || "Jugador";
  _onlineSetMsg("online-menu-msg", "Conectando...");

  try {
    if (!NET.conectado) {
      const avisar = setTimeout(() => _onlineSetMsg("online-menu-msg",
        "Despertando el servidor... la primera conexión del día puede tardar hasta 1 minuto. Esperá."), 4000);
      try { await netConectar(); } finally { clearTimeout(avisar); }
    }
    netUnirseSala(codigo);
  } catch (e) {
    _onlineSetMsg("online-menu-msg", (e && e.message) || "No se pudo conectar al servidor. Probá de nuevo en unos segundos.");
  }
}

// ── Cancelar / volver ─────────────────────────────────────────────

function onlineCancelar() {
  netDesconectar();
  _onlineResetEstadoPartida();
  _onlineMostrarVista("online-menu");
  _onlineSetMsg("online-menu-msg", "");
}

function onlineVolverAlMenu() {
  _onlineMostrarVista("online-menu");
  _onlineSetMsg("online-menu-msg", "");
}

function onlineVolver() {
  netDesconectar();
  _onlineResetEstadoPartida();
  _onlineMostrarVista("online-menu");
  _onlineSetMsg("online-menu-msg", "");
  irA("main-menu");
}

// Se llama cuando termina una partida online (botón "NUEVA PARTIDA"
// en la pantalla de fin de juego). Como ambos jugadores deberían
// coordinar una nueva sala, simplemente cortamos la conexión y
// volvemos al lobby online.
function onlineFinalizarPartida() {
  netDesconectar();
  _onlineResetEstadoPartida();
  if (typeof irA === "function") irA("online-screen");
  _onlineMostrarVista("online-menu");
  _onlineSetMsg("online-menu-msg", "La partida terminó. Podés crear o unirte a otra sala.");
}

// ── Handshake de inicio de partida ───────────────────────────────
// En cuanto ambos lados confirman que están en la sala, se mandan
// mutuamente su nombre/avatar ("hola"). El host, al recibir el "hola"
// del invitado, arranca el motor real y le manda el primer estado.
function _onlineEnviarHola() {
  netEnviar({ accion: "hola", nombre: ONLINE.nombre || "Jugador", avatar: "🌐" });
}

// ── Eventos de red ────────────────────────────────────────────────

// Reconexión básica: mientras la partida está en curso, recordamos el
// último código de sala para poder ofrecer un reingreso rápido si se
// corta la conexión.
function _onlinePrefillCodigo() {
  const inp = document.getElementById("online-codigo-input");
  if (inp && ONLINE._ultimoCodigo) inp.value = ONLINE._ultimoCodigo;
  // Prefill del nombre para reconectar sin re-tipearlo.
  const nInp = document.getElementById("online-nombre");
  if (nInp && ONLINE.nombre && !nInp.value) nInp.value = ONLINE.nombre;
}

netOn("sala_creada", (codigo) => {
  ONLINE._ultimoCodigo = codigo;
  if (ONLINE.buscando) {
    // Emparejado por la cola pública: el rival YA está (llega rival_conectado
    // enseguida), así que no mostramos el código ni la pantalla de espera.
    ONLINE.buscando = false;
    _onlineMostrarVista("online-status");
    _onlineSetMsg("online-status-msg", "✅ ¡Rival encontrado! Preparando la partida...");
    return;
  }
  _onlineMostrarVista("online-waiting");
  _onlineSetMsg("online-codigo-big", codigo);
  _onlineSetMsg("online-waiting-msg", "Esperando al rival...");
});

netOn("en_cola", () => {
  _onlineSetMsg("online-buscando-msg", "Buscando rival... quedate en línea, te emparejamos ni bien aparezca alguien.");
});

netOn("unido", (codigo) => {
  ONLINE.buscando = false;
  ONLINE._ultimoCodigo = codigo;
  _onlineMostrarVista("online-status");
  _onlineSetMsg("online-status-msg", `🔗 Conectado a la sala ${codigo}. Esperando que el rival arranque la partida...`);
  _onlineEnviarHola();
});

netOn("rival_conectado", () => {
  if (typeof playSound === "function") playSound("silbato");
  _onlineMostrarVista("online-status");
  _onlineSetMsg("online-status-msg", "✅ ¡Tu rival se conectó! Preparando la partida...");
  _onlineEnviarHola();
});

// El invitado se desconectó / el rival se desconectó.
netOn("rival_desconectado", () => {
  if (S && S.modoOnline && NET.rol === "host") {
    // La sala sigue abierta (el servidor la mantiene): el invitado puede
    // volver a unirse con el mismo código y le reenviamos el estado.
    if (typeof showToast === "function") {
      showToast(`⚠️ Tu rival se desconectó. La sala ${ONLINE._ultimoCodigo || ""} sigue abierta: puede volver a entrar con el mismo código.`);
    }
    return;
  }

  // Soy el invitado y se cortó el host (o no estábamos jugando todavía):
  // esa sala ya no sirve, no hay forma de reconectar.
  if (typeof showToast === "function") showToast("⚠️ El rival se desconectó");
  const estabaJugando = !!(S && S.modoOnline);
  _onlineResetEstadoPartida();
  if (estabaJugando && typeof irA === "function") irA("online-screen");
  _onlineMostrarVista("online-menu");
  _onlineSetMsg("online-menu-msg", "⚠️ El rival se desconectó y esa sala ya no está disponible. Podés crear o unirte a otra.");
});

netOn("error", (mensaje) => {
  ONLINE.buscando = false;
  _onlineMostrarVista("online-menu");
  _onlineSetMsg("online-menu-msg", mensaje || "Ocurrió un error de conexión.");
});

// Se cortó nuestra propia conexión con el servidor.
netOn("close", () => {
  if (S && S.modoOnline) {
    if (typeof showToast === "function") {
      showToast("⚠️ Se perdió la conexión con el servidor. Podés intentar reconectarte con el mismo código.");
    }
    _onlineResetEstadoPartida();
    if (typeof irA === "function") irA("online-screen");
    _onlineMostrarVista("online-menu");
    _onlinePrefillCodigo();
    _onlineSetMsg("online-menu-msg", "Se perdió la conexión. Podés reintentar uniéndote con el mismo código (si sos el anfitrión, creá una sala nueva).");
    return;
  }
  _onlineMostrarVista("online-status");
  _onlineSetMsg("online-status-msg", "⚠️ Se perdió la conexión con el servidor.");
});

// ── Mensajes de juego (relay) ────────────────────────────────────
// Todo mensaje de tipo "msg" se delega al motor online (motor_online.js),
// que sabe distinguir entre el handshake ("hola"), el estado espejado
// ("estado") y las acciones del invitado.
netOn("msg", (payload) => {
  if (!payload || typeof payload !== "object") return;
  if (typeof onlineProcesarMensaje === "function") onlineProcesarMensaje(payload);
});
