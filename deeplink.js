// ══════════════════════════════════════════════════════════════
// DEEPLINK.JS — enlace directo a la mesa + compartir por WhatsApp
//
// El modelo grupo-de-WhatsApp (docs/IDEAS_MODELO_WHATSAPP_2026-07-30.md):
// el admin crea la mesa y tira UN LINK al grupo; el que lo toca entra
// directo a la sala, sin tipear códigos.
//
//   #mesa=ABCDE     → se une a una sala 1v1
//   #mesa2v2=ABCDE  → se une a una sala 2v2
//
// OJO ORDEN DE CARGA: en index.html este script va ANTES de
// juego_online.js y anotador.js, así que en carga fría el join se difiere
// a window.load (cuando ya corrieron todos los defer). La bandera
// window._deepLinkEnCurso se setea EN EVAL para que anotador.js no fuerce
// el main-menu a los 100ms del load. El hash se limpia apenas se procesa
// para que un reload no re-una a una sala vieja.
// ══════════════════════════════════════════════════════════════

// Link canónico a una mesa (funciona igual en localhost y en producción).
function mesaLink(modo, codigo) {
  const base = location.origin + location.pathname;
  const prefijo = modo === "2v2" ? "#mesa2v2=" : modo === "servidor" ? "#mesa1=" : "#mesa=";
  return base + prefijo + codigo;
}

// Abre WhatsApp con la invitación lista para mandar al grupo.
function mesaCompartirWhatsApp(modo, codigo) {
  if (!codigo) return;
  const texto = (modo === "2v2")
    ? `🃏⚽ ¡Mesa de TRUCO GOL 2 vs 2! Tocá y entrás directo:\n${mesaLink("2v2", codigo)}\n(código: ${codigo})`
    : (modo === "servidor")
    ? `🃏⚽ ¡Te espero en TRUCO GOL, mano a mano! Tocá y entrás directo:\n${mesaLink("servidor", codigo)}\n(código: ${codigo})`
    : `🃏⚽ ¡Te espero en TRUCO GOL, mano a mano! Tocá y entrás directo:\n${mesaLink("1v1", codigo)}\n(código: ${codigo})`;
  window.open("https://wa.me/?text=" + encodeURIComponent(texto), "_blank", "noopener");
}

// Botones de los lobbies.
function onlineCompartirWsp()    { mesaCompartirWhatsApp("1v1", (typeof ONLINE !== "undefined" && ONLINE._ultimoCodigo) || null); }
function online2v2CompartirWsp() { mesaCompartirWhatsApp("2v2", (typeof O2 !== "undefined" && O2.codigo) || null); }
// Mesa autoritativa (la del server). Le faltaba TODA la capa de compartir:
// era la única de las tres sin link ni botón de WhatsApp, justo la pieza que
// sostiene el modelo "armamos la mesa por el grupo".
function auto1v1CompartirWsp()   { mesaCompartirWhatsApp("servidor", (typeof A1 !== "undefined" && A1.codigo) || null); }

// ── Entrada por deep link ────────────────────────────────────────
function _deepLinkMesa() {
  // Grupo 1: "2v2" | "1" | undefined. "1" = mesa autoritativa del server.
  const m = (location.hash || "").match(/^#mesa(2v2|1)?=([A-Za-z0-9]{4,8})$/);
  if (!m) return false;
  const codigo = m[2].toUpperCase();
  // Tocar tu propio link (el caso tipico: el admin lo prueba desde el grupo)
  // reusa la pestaña y volvia a mandar unirse/unirse4 sobre el MISMO socket.
  // El server ahora suelta la sala anterior antes de sentarte: si sos el
  // host, eso la BORRA para todos. Si ya estamos en esa sala, no hay nada
  // que hacer mas que limpiar el hash.
  if (typeof NET !== "undefined" && NET && NET.codigo === codigo && NET.conectado) {
    try { history.replaceState(null, "", location.pathname + location.search); } catch (e) {}
    if (typeof showToast === "function") showToast("Ya estas en esa mesa 👍");
    return true;
  }
  // Link de OTRA mesa con una partida en curso: sin esto se mandaba
  // `unirse` por el MISMO socket, el server soltaba la sala anterior (si
  // eras host, la BORRABA para tu rival) y vos entrabas a la nueva con
  // S.esHost/ONLINE.partidaIniciada de la partida vieja: al desconocido se
  // le reenviaba el estado en curso y se sentaba en la silla del expulsado.
  const jugando1v1 = (typeof S !== "undefined" && S && S.modoOnline && !S.juegoTerminado);
  const jugando2v2 = (typeof O2 !== "undefined" && O2 && O2.activa);
  if (jugando1v1 || jugando2v2) {
    const sigue = (typeof confirm !== "function") ||
      confirm("Estás jugando una partida. ¿Salir y entrar a la mesa nueva?");
    if (!sigue) {
      try { history.replaceState(null, "", location.pathname + location.search); } catch (e) {}
      return true;
    }
    try { if (typeof netDesconectar === "function") netDesconectar(); } catch (e) {}
    try { if (typeof _onlineResetEstadoPartida === "function") _onlineResetEstadoPartida(); } catch (e) {}
    try { if (typeof _2v2FinOcultar === "function") _2v2FinOcultar(); } catch (e) {}
    if (typeof O2 !== "undefined" && O2) O2.activa = false;
  }

  // Limpiar el hash YA: un F5 no tiene que volver a intentar unirse.
  try { history.replaceState(null, "", location.pathname + location.search); } catch (e) {}
  // El tutorial de bienvenida (features_ui) se auto-abre tras el load y le
  // taparía el lobby al que entra por el link del grupo. Lo marcamos visto
  // ANTES de que setupTutorial lo lea (este script corre en defer, el init
  // de features_ui recién en load+300ms). Queda disponible en "CÓMO JUGAR".
  try { localStorage.setItem("tg_tutorial_done", "1"); } catch (e) {}
  const nombre = (function () { try { return localStorage.getItem("truco_nombre") || ""; } catch (e) { return ""; } })();

  if (m[1] === "1") {
    // Mesa autoritativa: abrir su pantalla y unirse. auto1v1Unirse conecta
    // solo si hace falta.
    (async () => {
      try {
        if (typeof auto1v1Abrir === "function") auto1v1Abrir();
        const nInp = document.getElementById("a1-nombre");
        if (nInp && !nInp.value && nombre) nInp.value = nombre;
        if (typeof A1 !== "undefined" && nombre) A1.miNombre = nombre;
        await auto1v1Unirse(codigo);
      } catch (e) { /* la pantalla muestra su propio error */ }
    })();
    return true;
  }

  if (m[1]) {
    // 2v2: abrir el lobby (conecta solo) y unirse con el código.
    (async () => {
      try {
        await online2v2();
        const nInp = document.getElementById("lb2v2-nombre");
        if (nInp && !nInp.value && nombre) nInp.value = nombre;
        const cInp = document.getElementById("lb2v2-codigo");
        if (cInp) cInp.value = codigo;
        online2v2Unirse();
      } catch (e) { /* el lobby ya muestra su propio mensaje de error */ }
    })();
    return true;
  }

  // 1v1: ir a la pantalla online y unirse (onlineUnirseSala conecta solo).
  if (typeof irA === "function") irA("online-screen");
  const nInp = document.getElementById("online-nombre");
  if (nInp && !nInp.value && nombre) nInp.value = nombre;
  const cInp = document.getElementById("online-codigo-input");
  if (cInp) cInp.value = codigo;
  onlineUnirseSala();
  return true;
}

// Los scripts van con defer, pero onlineUnirseSala/irA viven en scripts
// que cargan DESPUÉS de este: el join en frío recién puede correr en
// window.load. La bandera se decide YA (en eval) para que anotador.js
// sepa no pisar la pantalla con el main-menu.
window._deepLinkEnCurso = /^#mesa(2v2|1)?=[A-Za-z0-9]{4,8}$/.test(location.hash || "");
window.addEventListener("load", () => {
  if (!window._deepLinkEnCurso) return;
  try {
    if (!_deepLinkMesa()) window._deepLinkEnCurso = false;
  } catch (e) {
    window._deepLinkEnCurso = false;
    console.warn("deeplink:", e);
  }
}, { once: true });

// Si la app YA está abierta y el usuario toca un link de mesa, el browser
// puede reusar la pestaña y solo cambiar el hash (sin recargar): también
// hay que engancharlo ahí.
window.addEventListener("hashchange", () => {
  try { _deepLinkMesa(); } catch (e) { console.warn("deeplink:", e); }
});

if (typeof window !== "undefined") {
  window.mesaLink = mesaLink;
  window.mesaCompartirWhatsApp = mesaCompartirWhatsApp;
  window.onlineCompartirWsp = onlineCompartirWsp;
  window.online2v2CompartirWsp = online2v2CompartirWsp;
}
