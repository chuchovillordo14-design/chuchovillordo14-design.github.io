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
  avatarRival: "avatares/hincha_misterioso.png",
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
  // Sin esto, la partida SIGUIENTE arrancaba resolviendo el escenario con el
  // nivel del rival ANTERIOR hasta que llegara el "hola" nuevo: una ventana
  // en la que los dos clientes podían estar viendo estadios distintos.
  ONLINE.nivelRival      = 0;
  ONLINE._ultimoResultado = null;
  if (typeof AVATARS !== "undefined" && ONLINE._avatarsBaseLen !== null) {
    AVATARS.length = ONLINE._avatarsBaseLen;
    ONLINE._avatarsBaseLen = null;
  }
  // Sin esto el fondo del palco (tema-palco + #palco-ambiente en el body)
  // queda pegado si se sale del online sin pasar por un ciclo de render
  // activo, y se cuela en pantallas sin fondo propio (ej. #amigos-screen).
  if (typeof window.escenarioSincronizar === "function") window.escenarioSincronizar();
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
// El botón ⚙️ Servidor es una herramienta de debug: nace oculto en el HTML
// y solo aparece con localStorage trucogol_dev=1 (consola:
// localStorage.setItem("trucogol_dev","1")). Un jugador común no tiene por
// qué ver dónde se cambia la URL del relay.
document.addEventListener("DOMContentLoaded", () => {
  try {
    if (localStorage.getItem("trucogol_dev") === "1") {
      const t = document.getElementById("online-config-toggle");
      if (t) t.style.display = "";
    }
  } catch (_) {}
});

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
    // El await de arriba puede tardar hasta ~60s (Render dormido) y en ese
    // rato el usuario ya pudo tocar CANCELAR y volver al menú. Sin este
    // chequeo entraba a la cola igual y, al aparecer un rival, la pantalla
    // saltaba sola a la partida desde el menú principal.
    if (!ONLINE.buscando) return;
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
  // El avatar que viaja es el hincha misterioso: en el online el rival no
  // muestra su identidad (antes era el emoji 🌐).
  // `nivel` es el escalón de estadio propio: la mesa online muestra el
  // estadio del MÁS AVANZADO de los dos (pedido de Chucho, 4 ago), así que
  // cada lado necesita saber el del otro. Es un número, no una preferencia:
  // el escenario elegido a mano NO viaja, para que los dos vean lo mismo.
  netEnviar({
    accion: "hola",
    nombre: ONLINE.nombre || "Jugador",
    avatar: "avatares/hincha_misterioso.png",
    nivel: (typeof window.escenarioNivelActual === "function") ? window.escenarioNivelActual() : 1,
  });
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
  const txt = mensaje || "Ocurrió un error de conexión.";
  // Si estabamos EN PARTIDA, el mensaje escrito en #online-menu-msg es
  // invisible (esa pantalla esta oculta detras de la mesa): hay que sacar
  // al jugador de la mesa y cortar la sesion online, si no queda congelado
  // sin aviso y sin reintentos.
  const enPartida = (typeof S !== "undefined") && S.modoOnline;
  if (enPartida) {
    if (typeof netDesconectar === "function") netDesconectar();
    _onlineResetEstadoPartida();
    if (typeof irA === "function") irA("online-screen");
    if (typeof showToast === "function") showToast("⚠️ " + txt, 4200);
  }
  _onlineMostrarVista("online-menu");
  _onlineSetMsg("online-menu-msg", txt);
});

// Se cortó nuestra propia conexión con el servidor. Si netClient.js va a
// reintentar solo (somos el invitado y tenemos código), no tiramos abajo
// la pantalla de juego — solo avisamos y esperamos "unido" o
// "reconexion_fallida" (ver netOn más abajo).
netOn("close", (info) => {
  if (info && info.seVaAReconectar) {
    if (typeof showToast === "function") showToast("⚠️ Se cortó la conexión — reconectando...");
    return;
  }
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

netOn("reconectando", (info) => {
  if (typeof showToast === "function") {
    showToast(`🔄 Reconectando... (intento ${info.intento}/${info.maxIntentos})`);
  }
});

// Se agotaron los reintentos automáticos: recién ahí caemos al camino
// manual de siempre (mismo mensaje que el "close" sin reconexión).
netOn("reconexion_fallida", () => {
  if (typeof showToast === "function") showToast("⚠️ No se pudo reconectar solo. Reintentá con el mismo código.");
  if (S && S.modoOnline) {
    _onlineResetEstadoPartida();
    if (typeof irA === "function") irA("online-screen");
  }
  _onlineMostrarVista("online-menu");
  _onlinePrefillCodigo();
  _onlineSetMsg("online-menu-msg", "No se pudo reconectar automáticamente. Reintentá con el mismo código.");
});

// ── Resultado autoritativo (comprobante) ──────────────────────────
// El server confirma con doble reporte y le pone un `ts` — eso, más el
// código de la sala, es el comprobante que el admin puede chequear contra
// GET /interno/salas/<codigo> antes de pagar una apuesta (auditoría del
// online, 2 ago: la tarjeta de fin por sí sola es una pantalla local
// falsificable). Se guarda para que juego_ui.js lo estampe en la tarjeta.
["resultado_confirmado", "resultado_discrepancia", "resultado_incompleto", "resultado_abandono"].forEach((evento) => {
  netOn(evento, (resultado) => {
    ONLINE._ultimoResultado = { estado: (resultado && resultado.estado) || evento.replace("resultado_", ""), ts: resultado && resultado.ts, codigo: ONLINE._ultimoCodigo };
  });
});

// ── Mensajes de juego (relay) ────────────────────────────────────
// Todo mensaje de tipo "msg" se delega al motor online (motor_online.js),
// que sabe distinguir entre el handshake ("hola"), el estado espejado
// ("estado") y las acciones del invitado.
netOn("msg", (payload) => {
  if (!payload || typeof payload !== "object") return;
  if (typeof onlineProcesarMensaje === "function") onlineProcesarMensaje(payload);
});
