// ══════════════════════════════════════════════════════════════
// AUTO1V1_UI.JS — pantalla de la mesa 1v1 autoritativa (BETA).
//
// Pinta A1 (src/online/auto1v1_client.js) adentro de #auto1v1-screen.
// Todo el DOM y el CSS de la mesa se inyectan acá en tiempo de carga
// (mismo patrón que la tarjeta de fin de juego_ui.js) para no tener que
// tocar el esqueleto de public/index.html más que el contenedor vacío y
// el botón del menú.
//
// A PROPÓSITO simple/utilitaria, no la mesa ilustrada del juego real: es
// la primera versión jugable de punta a punta del servidor-autoritativo
// (punto 4 de la auditoría del online). El server decide todo — acá solo
// se sugieren botones según el snapshot; si el cliente sugiere mal, el
// server responde "auto1v1_error" y no pasa nada más.
// ══════════════════════════════════════════════════════════════

(function () {
  const css = document.createElement("style");
  css.textContent = `
    #auto1v1-screen { display: none; flex-direction: column; align-items: center;
      min-height: 100vh; padding: 20px 14px 40px; gap: 14px;
      background: radial-gradient(ellipse at top, #0f2818, #061b10 70%); color: #fff; }
    .a1-titulo { font-family: var(--f-display, 'Bebas Neue', sans-serif); font-size: 26px;
      letter-spacing: 2px; color: var(--gold, #f5c518); display: flex; align-items: center; gap: 8px; }
    .a1-badge-beta { font-size: 10px; letter-spacing: 1px; background: rgba(245,197,24,.15);
      border: 1px solid rgba(245,197,24,.4); color: var(--gold, #f5c518); border-radius: 20px; padding: 2px 9px; }
    .a1-caja { background: rgba(255,255,255,.04); border: 1px solid rgba(255,255,255,.1);
      border-radius: 16px; padding: 18px; width: 100%; max-width: 420px; display: flex;
      flex-direction: column; gap: 12px; }
    .a1-fila { display: flex; gap: 8px; flex-wrap: wrap; justify-content: center; }
    .a1-input { flex: 1; min-width: 0; background: rgba(0,0,0,.3); border: 1px solid rgba(255,255,255,.2);
      border-radius: 10px; padding: 10px 12px; color: #fff; font-size: 15px; text-align: center;
      letter-spacing: 2px; text-transform: uppercase; }
    .a1-btn { font-family: var(--f-ui, Oswald, sans-serif); font-weight: 700; letter-spacing: .5px;
      font-size: 13px; padding: 11px 16px; border-radius: 10px; border: 1px solid rgba(255,255,255,.18);
      background: rgba(255,255,255,.06); color: #fff; cursor: pointer; }
    .a1-btn:hover { background: rgba(255,255,255,.12); }
    .a1-btn.primary { background: linear-gradient(#ffe064, #f5c518); color: #04120a; border-color: transparent; }
    .a1-btn.peligro { border-color: rgba(220,80,80,.4); color: #ff9d9d; }
    .a1-btn:disabled { opacity: .35; cursor: default; }
    .a1-toggle { display: flex; gap: 8px; align-items: center; font-size: 13px; color: rgba(255,255,255,.7); }
    .a1-msg { font-size: 13px; color: rgba(255,255,255,.6); text-align: center; min-height: 16px; }
    .a1-msg.err { color: #ff8a7a; }
    .a1-codigo-grande { font-family: var(--f-display, 'Bebas Neue', sans-serif); font-size: 40px;
      letter-spacing: 6px; color: var(--gold, #f5c518); }

    .a1-mesa { width: 100%; max-width: 460px; display: flex; flex-direction: column; gap: 10px; }
    .a1-top { display: flex; justify-content: space-between; align-items: center; font-size: 13px;
      color: rgba(255,255,255,.65); }
    .a1-puntos { font-family: var(--f-display, 'Bebas Neue', sans-serif); font-size: 20px; color: #fff; }
    .a1-puntos b { color: var(--gold, #f5c518); }
    .a1-cerrar { background: none; border: none; color: rgba(255,255,255,.5); font-size: 18px; cursor: pointer; }

    .a1-manos { display: flex; justify-content: center; gap: 8px; }
    .a1-carta { width: 58px; height: 87px; border-radius: 7px; background-size: cover; background-position: center;
      box-shadow: 0 3px 8px rgba(0,0,0,.5); border: 1px solid rgba(255,255,255,.15); }
    .a1-carta.jugable { cursor: pointer; transition: transform .12s ease; }
    .a1-carta.jugable:hover { transform: translateY(-6px); }
    .a1-carta.hueco { visibility: hidden; }

    .a1-centro { display: flex; flex-direction: column; align-items: center; gap: 6px; padding: 6px 0; }
    .a1-jugadas { display: flex; gap: 14px; align-items: center; min-height: 87px; }
    .a1-jugada-slot { width: 58px; height: 87px; border-radius: 7px; border: 1.5px dashed rgba(255,255,255,.15); }
    .a1-turno { font-size: 12.5px; letter-spacing: .5px; color: var(--gold, #f5c518);
      background: rgba(245,197,24,.08); border: 1px solid rgba(245,197,24,.25); border-radius: 20px;
      padding: 5px 14px; }
    .a1-turno.ajeno { color: rgba(255,255,255,.55); background: rgba(255,255,255,.04); border-color: rgba(255,255,255,.12); }

    .a1-acciones { display: flex; gap: 8px; flex-wrap: wrap; justify-content: center; }
    .a1-acciones .a1-btn { flex: 0 0 auto; }

    .a1-fin { text-align: center; display: flex; flex-direction: column; gap: 10px; align-items: center; }
    .a1-fin-titulo { font-family: var(--f-display, 'Bebas Neue', sans-serif); font-size: 32px; letter-spacing: 2px; }
    .a1-fin-titulo.gano { color: var(--gold, #f5c518); }
    .a1-fin-titulo.pierde { color: #ff8a7a; }
    .a1-comprobante { font-size: 10.5px; color: rgba(255,255,255,.4); }

    /* ── Estadio de fondo (4 ago 2026) ────────────────────────────────
       Esta es la ÚNICA mesa del juego que no es #mesa: la pinta este
       módulo entero, así que los escenarios (src/ui/escenarios.js, que
       cuelgan de body.tema-* + #esc-fondo) nunca la tocaron — mientras
       Picadito/Amistoso/relay ya jugaban en un estadio lleno, "JUGAR CON
       UN AMIGO" seguía siendo un degradé verde plano.
       Se reusa la MISMA imagen del escenario resuelto (window.escenarioSocial,
       que aplica el piso de estadio) montada como <img>, igual que allá: un
       elemento aparte no compite con la propiedad background y avisa por
       consola si el archivo no llega.
       Cada jugador ve SU estadio: acá no hay handshake de nivel como en el
       relay y es solo el telón de fondo, no información de la partida.
       (Sin comillas invertidas en este comentario: todo este CSS vive dentro
       de un template literal y una sola backtick corta el string — se comió
       el módulo entero hasta que saltó en la consola.) */
    #auto1v1-screen { position: relative; isolation: isolate; }
    .a1-fondo, .a1-velo { position: fixed; inset: 0; width: 100%; height: 100%;
      pointer-events: none; user-select: none; }
    .a1-fondo { object-fit: cover; object-position: center center; z-index: -2; }
    /* Velo: la cancha es clara y con gente: sin esto no se leen ni las
       cartas ni los botones. Más oscuro arriba y abajo, que es donde va
       el texto, y más liviano en el medio para que se vea el césped. */
    .a1-velo { z-index: -1; background: linear-gradient(180deg,
      rgba(4,14,8,.80), rgba(4,14,8,.42) 42%, rgba(4,14,8,.86)); }

    /* Sobre el césped los paneles necesitan cuerpo propio. */
    .a1-caja { background: rgba(6,20,12,.86); backdrop-filter: blur(6px);
      -webkit-backdrop-filter: blur(6px); border-color: rgba(255,255,255,.16);
      box-shadow: 0 14px 40px rgba(0,0,0,.55); }
    .a1-mesa { background: rgba(6,20,12,.52); backdrop-filter: blur(3px);
      -webkit-backdrop-filter: blur(3px); border: 1px solid rgba(255,255,255,.1);
      border-radius: 18px; padding: 14px 12px; box-shadow: 0 16px 44px rgba(0,0,0,.5); }
    .a1-titulo, .a1-top { text-shadow: 0 2px 10px rgba(0,0,0,.75); }
    .a1-carta { box-shadow: 0 9px 20px rgba(0,0,0,.55); }

    /* El "← Volver" es position:absolute (top 14px, alto ~30) y el título
       arrancaba a 20px: en un teléfono de 375 se montaban uno sobre otro.
       El colchón va en el contenedor, no en el título, para que valga
       también cuando adentro se pinte otra cosa. */
    #auto1v1-screen { padding-top: 56px; }
    .a1-titulo { text-align: center; justify-content: center; flex-wrap: wrap; }
  `;
  document.head.appendChild(css);
})();

// ── Fondo de estadio ─────────────────────────────────────────────────
// Se re-pinta en cada apertura (y no una sola vez al cargar) porque el
// escenario puede haber subido de nivel entre partida y partida: ganar,
// o mejorar el estadio del club, cambia lo que devuelve escenarioSocial().
// Idempotente: si el <img> ya está con la misma imagen no toca nada.
function _auto1v1PintarFondo() {
  const screen = document.getElementById("auto1v1-screen");
  if (!screen) return;
  if (!screen.querySelector(".a1-velo")) {
    const velo = document.createElement("div");
    velo.className = "a1-velo";
    screen.prepend(velo);
  }
  // Ojo con el nombre: `esc` a secas es el escapador global de cartas.js.
  // A1.nivelMesa lo manda el server (el máximo de los dos asientos): con eso
  // los dos jugadores ven EL MISMO estadio. Mientras no llegó —lobby, mesa
  // recién creada— vale el propio.
  const nivelMesa = (typeof A1 !== "undefined" && A1.nivelMesa) || null;
  const escenario = (typeof window.escenarioSocial === "function") ? window.escenarioSocial(nivelMesa) : null;
  let img = screen.querySelector(".a1-fondo");
  if (!escenario || !escenario.fondo) { if (img) img.remove(); return; }
  if (!img) {
    img = document.createElement("img");
    img.className = "a1-fondo";
    img.alt = "";
    img.draggable = false;
    img.onerror = () => console.warn("[auto1v1] no cargó el fondo:", escenario.fondo);
    screen.prepend(img);
  }
  if (img.getAttribute("src") !== escenario.fondo) img.src = escenario.fondo;
}

// ── Entrada desde el menú ────────────────────────────────────────────
function auto1v1Abrir() {
  auto1v1Reset();
  if (typeof irA === "function") irA("auto1v1-screen");
  _auto1v1PintarFondo();
  _auto1v1Render();
}

function auto1v1SalirClick() {
  auto1v1Salir();
  if (typeof irA === "function") irA("main-menu");
}

// El nombre propio para esta mesa: el que el jugador puso en Ajustes. El
// default de la UI ("Jugador") solo queda para el que nunca puso ninguno.
// `esc` es el escapador global de cartas.js (el valor va a un atributo).
function _auto1v1MiNombre() {
  if (typeof S !== "undefined" && S.nombreJugador &&
      (typeof NOMBRE_DEFAULT === "undefined" || S.nombreJugador !== NOMBRE_DEFAULT)) {
    return S.nombreJugador;
  }
  return "";
}
function _a1Esc(s) { return (typeof esc === "function") ? esc(s) : String(s || ""); }

let _a1MsgLobby = "";
function _auto1v1MostrarErrorLobby(mensaje) {
  _a1MsgLobby = mensaje || "Error de conexión.";
  _auto1v1Render();
}

async function _auto1v1CrearClick() {
  // Sin nombre propio se manda "" y el server pone "Anónimo": un solo
  // placeholder para el ranking y el cuadro, en vez de mezclar "Jugador"
  // con "Anónimo" según por dónde entró cada uno (auditoría del 5 ago).
  const nombre = (document.getElementById("a1-nombre")?.value || "").trim() || _auto1v1MiNombre() || "";
  A1.miNombre = nombre;
  const limite = document.getElementById("a1-limite-30")?.checked ? 30 : 15;
  const conFlor = !!document.getElementById("a1-conflor")?.checked;
  _a1MsgLobby = "Conectando...";
  _auto1v1Render();
  try { await auto1v1Crear({ limite, conFlor }); }
  catch (e) { _a1MsgLobby = "No se pudo conectar. Probá de nuevo."; _auto1v1Render(); }
}

async function _auto1v1UnirseClick() {
  const codigo = (document.getElementById("a1-codigo-input")?.value || "").trim();
  if (codigo.length < 5) { _a1MsgLobby = "Ingresá el código de 5 caracteres."; _auto1v1Render(); return; }
  // Sin nombre propio se manda "" y el server pone "Anónimo": un solo
  // placeholder para el ranking y el cuadro, en vez de mezclar "Jugador"
  // con "Anónimo" según por dónde entró cada uno (auditoría del 5 ago).
  const nombre = (document.getElementById("a1-nombre")?.value || "").trim() || _auto1v1MiNombre() || "";
  A1.miNombre = nombre;
  _a1MsgLobby = "Conectando...";
  _auto1v1Render();
  try { await auto1v1Unirse(codigo); }
  catch (e) { _a1MsgLobby = "No se pudo conectar. Probá de nuevo."; _auto1v1Render(); }
}

function _auto1v1CopiarCodigo() {
  if (!A1.codigo) return;
  const ok = () => { if (typeof showToast === "function") showToast("📋 Código copiado: " + A1.codigo, 1800); };
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) { navigator.clipboard.writeText(A1.codigo).then(ok, ok); return; }
  } catch (e) {}
}

// ── Qué botones sugerir según el snapshot (heurística de UI, NO la
// autoridad — el server valida todo de nuevo con aplicarAccion()) ──────
function _auto1v1AccionesSugeridas(snap) {
  const m = snap.mano;
  const out = [];
  // Mesa pausada (el rival se desconectó, ver auto1v1_rival_reconectando):
  // el server rechaza CUALQUIER acción de los dos lados hasta que vuelva
  // (orquestador1v1.aplicarAccion), así que no tiene sentido ofrecer
  // botones que solo van a volver con un error.
  if (snap.terminado || m.cerrada || snap.pausada) return out;
  const miTurno = m.turnoActual === "propio";
  const respondiendo = m.cantoPendiente && m.quienCantoPendiente === "ajeno";

  if (respondiendo && m.cantoPendiente === "envido") {
    out.push({ id: "q", label: "¡QUIERO!", clase: "primary", fn: () => auto1v1ResponderCanto(true) });
    out.push({ id: "nq", label: "NO QUIERO", fn: () => auto1v1ResponderCanto(false) });
    // Mismo cálculo que reglasEnvidoRaises() (motor1v1.js) — antes esto
    // ofrecía "ENVIDO" de nuevo después de un Envido-Envido (tope: ya no
    // se puede subir un tercero) y "REAL ENVIDO" aunque ya se hubiera
    // cantado Real antes, y el server rechazaba ambos.
    const ult = m.historialEnvido[m.historialEnvido.length - 1];
    if (ult !== "falta") {
      const dobleEnvido = m.historialEnvido.filter((x) => x === "envido").length >= 2;
      const tieneReal = m.historialEnvido.includes("real");
      if (ult === "envido" && !dobleEnvido) out.push({ id: "su-e", label: "ENVIDO", fn: () => auto1v1SubirEnvido("envido") });
      if (!tieneReal) out.push({ id: "su-r", label: "REAL ENVIDO", fn: () => auto1v1SubirEnvido("real") });
      out.push({ id: "su-f", label: "FALTA ENVIDO", fn: () => auto1v1SubirEnvido("falta") });
    }
    // "Con flor" para anular el envido: solo si todavía no jugué mi
    // carta de ronda 0 (si ya la jugué, perdí la ventana — el server la
    // rechaza igual, pero mejor no ofrecer el botón).
    if (m.tieneFlorPropia && !m.pasoFlorPropia && !m.tiroEnR0Propio) out.push({ id: "ecf", label: "CON FLOR", fn: auto1v1EnvidoConFlor });
  } else if (respondiendo && m.cantoPendiente === "truco") {
    out.push({ id: "qt", label: "¡QUIERO!", clase: "primary", fn: () => auto1v1ResponderCanto(true) });
    out.push({ id: "nqt", label: "NO QUIERO", fn: () => auto1v1ResponderCanto(false) });
    if (m.nivelTruco < 4) out.push({ id: "sut", label: m.nivelTruco === 2 ? "RETRUCO" : "VALE 4", fn: () => auto1v1SubirTruco(m.nivelTruco + 1) });
    if (m.rondaActual === 0 && m.nivelTruco === 2 && !m.tiroEnR0Propio) {
      if (m.tieneFlorPropia && !m.pasoFlorPropia) out.push({ id: "tcf", label: "CON FLOR", fn: auto1v1TrucoConFlor });
      if (!m.envidoCantado) out.push({ id: "tce", label: "CON ENVIDO", fn: () => auto1v1TrucoConEnvido("envido") });
    }
  } else if (respondiendo && m.cantoPendiente === "flor") {
    out.push({ id: "cfq", label: "¡CON FLOR QUIERO!", clase: "primary", fn: () => auto1v1ResponderFlor("quiero") });
    if (m.historialFlor.includes("contraflor") || m.historialFlor.includes("contraflorresto")) {
      out.push({ id: "cfnq", label: "NO QUIERO", fn: () => auto1v1ResponderFlor("no-quiero") });
    }
    if (!m.historialFlor.includes("contraflorresto")) {
      if (!m.historialFlor.includes("contraflor")) out.push({ id: "cf", label: "CONTRAFLOR", fn: () => auto1v1ResponderFlor("contraflor") });
      out.push({ id: "cfr", label: "CONTRAFLOR AL RESTO", fn: () => auto1v1ResponderFlor("contraflorresto") });
    }
  } else if (miTurno && !m.cantoPendiente) {
    // El `&& !m.cantoPendiente` importa: cantar un envido/truco NO mueve
    // turnoActual (motor1v1.js), así que justo después de cantar algo yo
    // mismo, miTurno seguía dando true — sin esta guarda se ofrecía TRUCO
    // (y "irse al mazo" más abajo) mientras esperaba que respondiera el
    // rival, y el server los rechazaba con "hay un canto pendiente".
    if (m.rondaActual === 0 && !m.envidoCantado && !m.florCantada && !(m.tieneFlorPropia && !m.pasoFlorPropia)) {
      out.push({ id: "e", label: "ENVIDO", fn: () => auto1v1CantarEnvido("envido") });
      out.push({ id: "re", label: "REAL ENVIDO", fn: () => auto1v1CantarEnvido("real") });
      out.push({ id: "fe", label: "FALTA ENVIDO", fn: () => auto1v1CantarEnvido("falta") });
    }
    if (m.tieneFlorPropia && !m.florCantada && !m.pasoFlorPropia && m.rondaActual === 0) {
      out.push({ id: "flor", label: "FLOR", fn: auto1v1CantarFlor });
      out.push({ id: "paso-flor", label: "GUARDAR FLOR", fn: auto1v1PasarFlor });
    }
    // Mismo cálculo que _nivelTrucoDisponible() (motor1v1.js): nivel 2 si
    // nadie cantó truco todavía, o nivelTrucoAceptado+1 si YO fui el
    // último en aceptar (tengo la mano y nadie cantó nada más todavía).
    // Antes esto mandaba SIEMPRE valor:2, y apenas había un truco previo
    // aceptado el server lo rechazaba — la escalada ofensiva (Retruco,
    // Vale 4 cantados fuera de una respuesta) estaba rota del todo.
    let nivelTruco = null;
    if (m.nivelTrucoAceptado === 0 && !m.trucoCantado) nivelTruco = 2;
    else if (m.trucoCantado && m.nivelTrucoAceptado > 0 && m.ultimoEnAceptarTruco === "propio" && m.nivelTrucoAceptado < 4) nivelTruco = m.nivelTrucoAceptado + 1;
    if (nivelTruco) {
      const label = nivelTruco === 2 ? "TRUCO" : nivelTruco === 3 ? "RETRUCO" : "VALE 4";
      out.push({ id: "truco", label, fn: () => auto1v1CantarTruco(nivelTruco) });
    }
  }
  // Irse al mazo es legal sin nada pendiente, o respondiendo un canto del
  // rival — pero NO con un canto PROPIO todavía sin responder (el server
  // lo rechaza: "hay un canto tuyo pendiente de respuesta del rival").
  if (!m.cerrada && (!m.cantoPendiente || respondiendo)) {
    out.push({ id: "mazo", label: "IRSE AL MAZO", clase: "peligro", fn: auto1v1IrseAlMazo });
  }
  return out;
}

function _auto1v1Carta(cartaId, opts) {
  opts = opts || {};
  const clases = ["a1-carta"].concat(opts.clases || []).join(" ");
  if (!cartaId) return `<div class="${clases} hueco"></div>`;
  if (cartaId === "?") return `<div class="${clases}" style="background-image:url('${typeof DORSO_URI === "string" ? DORSO_URI : ""}')"></div>`;
  const url = typeof urlCarta === "function" ? urlCarta(cartaId) : "";
  const click = opts.onclick ? ` onclick="${opts.onclick}"` : "";
  return `<div class="${clases}" style="background-image:url('${url}')"${click}></div>`;
}

function _auto1v1RenderMesa(cont) {
  const snap = A1.snapshot;
  const m = snap.mano;
  const manoAjenaVisible = m.manoAjenaOculta.map((c, i) => m.cartasJugadas.ajeno[i] || c);

  const jugadasHtml = `
    <div class="a1-jugadas">
      ${m.cartasJugadas.ajeno[m.rondaActual] ? _auto1v1Carta(m.cartasJugadas.ajeno[m.rondaActual]) : '<div class="a1-jugada-slot"></div>'}
      ${m.cartasJugadas.propio[m.rondaActual] ? _auto1v1Carta(m.cartasJugadas.propio[m.rondaActual]) : '<div class="a1-jugada-slot"></div>'}
    </div>`;

  const puedeJugar = !snap.terminado && !m.cerrada && !snap.pausada && m.turnoActual === "propio" && !m.cantoPendiente;
  const manoHtml = m.manoPropia.map((c, i) => {
    if (!c) return _auto1v1Carta(null);
    return _auto1v1Carta(c, { clases: puedeJugar ? ["jugable"] : [], onclick: puedeJugar ? `auto1v1JugarCarta(${i})` : null });
  }).join("");

  let turnoTxt = "Repartiendo...";
  let turnoClase = "ajeno";
  if (snap.pausada) {
    turnoTxt = "⏸ Mesa pausada — esperando a que tu rival vuelva...";
  } else if (!snap.terminado && !m.cerrada) {
    if (m.cantoPendiente) {
      turnoTxt = m.quienCantoPendiente === "ajeno" ? "Te cantaron algo — respondé" : "Esperando respuesta del rival...";
      turnoClase = m.quienCantoPendiente === "ajeno" ? "" : "ajeno";
    } else {
      turnoTxt = m.turnoActual === "propio" ? "Tu turno" : "Turno del rival...";
      turnoClase = m.turnoActual === "propio" ? "" : "ajeno";
    }
  }

  const acciones = _auto1v1AccionesSugeridas(snap);
  const accionesHtml = acciones.map((a) =>
    `<button class="a1-btn ${a.clase || ""}" id="a1-accion-${a.id}">${a.label}</button>`).join("");

  cont.innerHTML = `
    <div class="a1-mesa">
      <div class="a1-top">
        <span>${A1.rivalNombre ? "vs " + _a1Esc(A1.rivalNombre) : "Mesa: " + _a1Esc(A1.codigo)}</span>
        <span class="a1-puntos"><b>${snap.puntos.propio}</b> — ${snap.puntos.ajeno}</span>
        <button class="a1-cerrar" onclick="auto1v1SalirClick()">✕</button>
      </div>
      <div class="a1-manos">${manoAjenaVisible.map((c) => _auto1v1Carta(c)).join("")}</div>
      <div class="a1-centro">
        ${jugadasHtml}
        <span class="a1-turno ${turnoClase}">${turnoTxt}</span>
      </div>
      <div class="a1-acciones">${accionesHtml}</div>
      <div class="a1-manos">${manoHtml}</div>
    </div>`;

  acciones.forEach((a) => {
    const el = document.getElementById("a1-accion-" + a.id);
    if (el) el.onclick = a.fn;
  });
}

const _A1_TXT_COMPROBANTE = {
  confirmado: "✅ Confirmado por el servidor", discrepancia: "⚠️ Discrepancia",
  incompleto: "⚠️ Incompleto", abandono: "⚠️ Se cortó la conexión",
};

function _auto1v1RenderFin(cont) {
  const gano = A1.finalizado.ganeYo;
  cont.innerHTML = `
    <div class="a1-caja a1-fin">
      <div class="a1-fin-titulo ${gano ? "gano" : "pierde"}">${gano ? "🏆 ¡GANASTE!" : "PERDISTE"}</div>
      <div class="a1-comprobante">Mesa ${A1.codigo} · resuelto por el servidor, no por este navegador</div>
      <button class="a1-btn primary" onclick="auto1v1Abrir()">▶ JUGAR DE NUEVO</button>
      <button class="a1-btn" onclick="auto1v1SalirClick()">🏟 VOLVER AL MENÚ</button>
    </div>`;
}

function _auto1v1RenderLobby(cont) {
  if (A1.codigo && !A1.snapshot) {
    // Mesa creada/unida, esperando al rival (o esperando el primer reparto).
    cont.innerHTML = `
      <div class="a1-caja" style="align-items:center;text-align:center;">
        <div class="a1-codigo-grande">${A1.codigo}</div>
        <div class="a1-msg">Mandale el link al que quieras. La partida arranca sola apenas entren los dos.</div>
        <div class="a1-fila">
          <button class="a1-btn primary" onclick="auto1v1CompartirWsp()">🟢 INVITAR POR WHATSAPP</button>
          <button class="a1-btn" onclick="_auto1v1CopiarCodigo()">📋 COPIAR CÓDIGO</button>
          <button class="a1-btn" onclick="auto1v1SalirClick()">CANCELAR</button>
        </div>
      </div>`;
    return;
  }
  // El nombre viene prellenado con el del jugador (Ajustes → "Tu nombre").
  // Antes arrancaba vacío y caía en "Jugador", que es el mismo problema que
  // "El Gaucho": el rival te ve con un nombre que no elegiste (ver
  // NOMBRE_DEFAULT en src/ui/juego_ui.js).
  const _nom = _auto1v1MiNombre();
  cont.innerHTML = `
    <div class="a1-caja">
      <input class="a1-input" id="a1-nombre" placeholder="Tu nombre" maxlength="20" value="${_a1Esc(_nom)}" style="text-transform:none;letter-spacing:normal;">
      <div class="a1-fila">
        <label class="a1-toggle"><input type="radio" name="a1-limite" id="a1-limite-15" checked> 15 puntos</label>
        <label class="a1-toggle"><input type="radio" name="a1-limite" id="a1-limite-30"> 30 puntos</label>
      </div>
      <label class="a1-toggle"><input type="checkbox" id="a1-conflor"> Con flor</label>
      <button class="a1-btn primary" onclick="_auto1v1CrearClick()">🆕 CREAR MESA</button>
      <div class="a1-fila">
        <input class="a1-input" id="a1-codigo-input" placeholder="CÓDIGO" maxlength="5">
        <button class="a1-btn" onclick="_auto1v1UnirseClick()">UNIRME</button>
      </div>
      <div class="a1-msg ${_a1MsgLobby ? "err" : ""}">${_a1MsgLobby}</div>
    </div>`;
}

function _auto1v1Render() {
  const cont = document.getElementById("auto1v1-screen-inner");
  if (!cont) return;
  // Desde el 5 ago la PARTIDA se juega en la mesa de verdad (la de
  // Picadito, ver src/online/auto1v1_mesa.js) y esta pantalla quedó solo
  // como lobby: crear la mesa, entrar con el código, compartir el link.
  // Con la mesa real abierta no hay nada que dibujar acá — y además
  // _auto1v1PintarFondo() le pisaría el escenario a la mesa.
  if (typeof A1MESA !== "undefined" && A1MESA.abierta) return;
  // El fondo se re-evalúa en cada render porque A1.nivelMesa puede cambiar
  // a mitad de camino: entra el rival y la mesa pasa al estadio del más
  // avanzado de los dos. Es idempotente (solo toca el DOM si cambió el src).
  _auto1v1PintarFondo();
  if (A1.finalizado) { _auto1v1RenderFin(cont); return; }
  if (A1.activa && A1.snapshot) { _auto1v1RenderMesa(cont); return; }
  _auto1v1RenderLobby(cont);
}

// Estructura fija de la pantalla (el contenido de adentro lo arma
// _auto1v1Render en cada cambio de estado).
document.addEventListener("DOMContentLoaded", () => {
  const screen = document.getElementById("auto1v1-screen");
  if (!screen) return;
  screen.innerHTML = `
    <button class="back-btn" onclick="auto1v1SalirClick()">← Volver</button>
    <!-- 4 ago: se publicó como "JUGAR CON UN AMIGO". El título decía
         "MESA 1v1 · BETA · SERVIDOR": nombre de arquitectura, no de jugador.
         El badge queda pero contando lo que le importa al que juega —que
         nadie puede ver sus cartas— en vez de dónde corre el motor. -->
    <div class="a1-titulo">🤝 MANO A MANO <span class="a1-badge-beta">CARTAS PROTEGIDAS</span></div>
    <div id="auto1v1-screen-inner" style="width:100%;display:flex;justify-content:center;"></div>
  `;
  // Después del innerHTML, siempre: montarlo antes lo borraría. Acá el
  // <img> ya queda descargado para cuando el jugador entre.
  _auto1v1PintarFondo();
});
