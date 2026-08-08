// ══════════════════════════════════════════════════════════════
// AMIGOS — pantalla privada para entrar a partidas 1v1 o de torneo
// organizadas por el bot de WhatsApp (ver plan del bot de torneos).
//
// Deliberadamente SEPARADA de "online-screen": acá el código/link
// siempre lo generó el admin del grupo (sala pre-creada server-side,
// nunca el matchmaking público), para no confundir los dos flujos.
//
// Reusa la conexión/protocolo de src/online/netClient.js tal cual
// (mismo servidor, mismo mensaje "unirse") — los handlers globales
// de src/online/juego_online.js (hola, arranque de partida, etc.) ya
// se disparan solos sea cual sea la pantalla que inició la conexión.
// ══════════════════════════════════════════════════════════════

function _amigosMostrarVista(id) {
  ["amigos-menu", "amigos-status"].forEach((v) => {
    const el = document.getElementById(v);
    if (el) el.style.display = v === id ? "flex" : "none";
  });
}

function _amigosSetMsg(id, texto) {
  const el = document.getElementById(id);
  if (el) el.textContent = texto || "";
}

async function amigosUnirseSala(codigoForzado) {
  const btn = document.getElementById("amigos-btn-unirse");
  if (btn && btn.disabled) return; // ya hay un intento de conexión en curso

  const codigo = (codigoForzado || document.getElementById("amigos-codigo-input")?.value || "").trim();
  if (codigo.length < 5) {
    _amigosSetMsg("amigos-menu-msg", "Pegá el código de 5 caracteres que te mandó el admin (o abrí directo su link).");
    return;
  }
  ONLINE.nombre = (document.getElementById("amigos-nombre")?.value || "").trim() || ONLINE.nombre || "Jugador";
  _amigosSetMsg("amigos-menu-msg", "Conectando...");
  // La propia conexión puede tardar "hasta 1 minuto" (server dormido): sin
  // deshabilitar el botón, tocarlo de nuevo en esa espera manda joins
  // duplicados. Se reactiva en el catch de acá y en el listener de "error"
  // (la otra forma en que se vuelve a esta pantalla sin haber conectado).
  if (btn) btn.disabled = true;

  try {
    if (!NET.conectado) {
      const avisar = setTimeout(() => _amigosSetMsg("amigos-menu-msg",
        "Despertando el servidor... puede tardar hasta 1 minuto. Esperá."), 4000);
      try { await netConectar(); } finally { clearTimeout(avisar); }
    }
    netUnirseSala(codigo);
  } catch (e) {
    _amigosSetMsg("amigos-menu-msg", (e && e.message) || "No se pudo conectar al servidor. Probá de nuevo en unos segundos.");
    if (btn) btn.disabled = false;
  }
}

function amigosVolver() {
  netDesconectar();
  if (typeof _onlineResetEstadoPartida === "function") _onlineResetEstadoPartida();
  _amigosMostrarVista("amigos-menu");
  _amigosSetMsg("amigos-menu-msg", "");
  irA("main-menu");
}

// ── Torneos activos ──────────────────────────────────────────────
// Placeholder hasta la Fase 3 del bot (GET /torneo/publico todavía
// no existe en el server).
function amigosCargarTorneos() {
  const cont = document.getElementById("amigos-torneos-lista");
  if (!cont) return;
  cont.innerHTML = '<div class="online-sub">Por ahora no hay torneos activos. Se anuncian en el grupo de WhatsApp.</div>';
}

// ── Deep-link ?sala=XXXX ─────────────────────────────────────────
// Un link mandado por el bot siempre abre Amigos, nunca Online.
// Devuelve true si había un código en la URL y lo manejó (para que el
// boot de anotador.js no pise esto forzando el menú principal).
function _amigosAutoJoinDesdeURL() {
  const params = new URLSearchParams(location.search);
  const codigo = (params.get("sala") || "").trim().toUpperCase();
  if (!codigo) return false;
  history.replaceState(null, "", location.pathname);

  irA("amigos-screen");
  const input = document.getElementById("amigos-codigo-input");
  if (input) input.value = codigo;

  const nombre = (document.getElementById("amigos-nombre")?.value || ONLINE.nombre || "").trim();
  if (nombre) {
    amigosUnirseSala(codigo);
  } else {
    _amigosSetMsg("amigos-menu-msg", "Poné tu nombre arriba y tocá UNIRSE para entrar a la partida.");
  }
  return true;
}

// ── Eventos de red propios de esta pantalla ──────────────────────
// netOn admite varios listeners por evento: estos conviven sin
// pisar los que ya registró juego_online.js para "online-screen".
netOn("sala_creada", (codigo) => {
  _amigosMostrarVista("amigos-status");
  _amigosSetMsg("amigos-status-msg", `🔗 Sala ${codigo} reclamada. Esperando al otro jugador...`);
});
netOn("unido", () => {
  _amigosMostrarVista("amigos-status");
  _amigosSetMsg("amigos-status-msg", "🔗 Conectado. Esperando que arranque la partida...");
});
netOn("rival_conectado", () => {
  _amigosSetMsg("amigos-status-msg", "✅ ¡Conectados los dos! Preparando la partida...");
});
netOn("error", (mensaje) => {
  _amigosMostrarVista("amigos-menu");
  _amigosSetMsg("amigos-menu-msg", mensaje || "Ocurrió un error de conexión.");
  const btn = document.getElementById("amigos-btn-unirse");
  if (btn) btn.disabled = false;
});

document.addEventListener("DOMContentLoaded", () => {
  amigosCargarTorneos();
});
