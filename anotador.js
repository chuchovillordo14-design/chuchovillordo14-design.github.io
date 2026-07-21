// ══════════════════════════════════════════════════════════════
// NAVEGACIÓN ENTRE PANTALLAS
// ══════════════════════════════════════════════════════════════

const PANTALLAS = ["main-menu", "name-screen", "amistoso-screen", "anotador-screen", "online-screen", "mundial-screen", "copa-screen", "club-screen", "mesa"];

function irA(id) {
  PANTALLAS.forEach(p => {
    const el = document.getElementById(p);
    if (!el) return;
    el.style.display = "none";
  });

  const dest = document.getElementById(id);
  if (!dest) return;

  // Cada pantalla tiene su display correcto
  const displays = {
    "main-menu":        "flex",
    "name-screen":      "flex",
    "amistoso-screen":  "flex",
    "anotador-screen":  "flex",
    "online-screen":    "flex",
    "mundial-screen":   "flex",
    "copa-screen":      "flex",
    "club-screen":      "flex",
    "mesa":             "grid",
  };
  dest.style.display = displays[id] || "flex";

  // FABs solo en la mesa
  const fabs = document.getElementById("fab-group");
  if (fabs) fabs.style.display = id === "mesa" ? "flex" : "none";

  // Paño según la competición: solo en la mesa; fuera de ella se limpia.
  if (id === "mesa") {
    if (typeof aplicarPanoCompeticion === "function") aplicarPanoCompeticion();
  } else if (document.body) {
    document.body.className = document.body.className.replace(/\bcomp-\S+/g, "").replace(/\bpano-noche\b/g, "").trim();
    const ovl = document.getElementById("pano-noche-ovl");
    if (ovl) ovl.style.display = "none";
  }

  // Marcador lateral de fósforos: solo visible en la mesa (y si hay ancho)
  if (typeof _actualizarSideScore === "function") _actualizarSideScore();

  // Panel de actividad: solo visible en la mesa
  if (typeof _actualizarPanelActividad === "function") _actualizarPanelActividad();

  // Detener timer si se sale de la mesa
  if (id !== "mesa" && typeof detenerTimer === "function") detenerTimer();

  // Si vuelven al menú desde la mesa, pausar cualquier acción pendiente
  if (id === "main-menu" && typeof S !== "undefined") {
    S.juegoTerminado = true;
  }

  // Avisar una sola vez si se retomó una partida guardada del anotador
  if (id === "anotador-screen" && !_anAvisoRestauro) {
    _anAvisoRestauro = true;
    const hayProgreso = AN.ptsJ > 0 || AN.ptsR > 0 || AN.historial.length > 0;
    if (hayProgreso && typeof showToast === "function") {
      showToast("🔄 Retomando partida guardada");
    }
  }
}

// ══════════════════════════════════════════════════════════════
// ANOTADOR
// ══════════════════════════════════════════════════════════════

const AN = {
  ptsJ:    0,
  ptsR:    0,
  limite:  30,
  modo:    30,       // 30 | 15 | 'bo3'
  manoN:   1,        // número de mano actual
  historial: [],     // [{ mano, j, r, quienGano }]
  bo3J:    0,        // chicos ganados (modo mejor de 3)
  bo3R:    0,
  partidoResuelto: false, // true si ya se contabilizó el ganador del chico/partido actual
  ultimoGanadorBo3: null, // 'j' | 'r' | null — para deshacer el conteo bo3 al corregir
};

const ANOTADOR_KEY = "truco_anotador";
let _anAvisoRestauro = false;

// ── Guardar / cargar partida ───────────────────────────────────

// Guardado silencioso (autosave en cada cambio de puntaje)
function anGuardarEstado() {
  const data = {
    ptsJ:      AN.ptsJ,
    ptsR:      AN.ptsR,
    limite:    AN.limite,
    modo:      AN.modo,
    manoN:     AN.manoN,
    historial: AN.historial,
    bo3J:      AN.bo3J,
    bo3R:      AN.bo3R,
    partidoResuelto:  AN.partidoResuelto,
    ultimoGanadorBo3: AN.ultimoGanadorBo3,
    nombreJ:   document.getElementById("an-name-j")?.value || "",
    nombreR:   document.getElementById("an-name-r")?.value || "",
  };
  lsSet(ANOTADOR_KEY, JSON.stringify(data));
}

// Botón "Guardar partida": guarda y confirma con sonido + toast
function anGuardarPartida() {
  anGuardarEstado();
  if (typeof playSound === "function") playSound("click");
  if (typeof showToast === "function") showToast("💾 Partida guardada");
}

// Restaura el estado guardado (si existe). Devuelve true si había datos.
function anCargarPartida() {
  let data = null;
  try { data = JSON.parse(localStorage.getItem(ANOTADOR_KEY)); } catch (e) { /* ignore */ }
  if (!data) return false;

  AN.ptsJ      = data.ptsJ      || 0;
  AN.ptsR      = data.ptsR      || 0;
  AN.limite    = data.limite    || 30;
  AN.modo      = data.modo      || 30;
  AN.manoN     = data.manoN     || 1;
  AN.historial = Array.isArray(data.historial) ? data.historial : [];
  AN.bo3J      = data.bo3J      || 0;
  AN.bo3R      = data.bo3R      || 0;
  AN.partidoResuelto  = !!data.partidoResuelto;
  AN.ultimoGanadorBo3 = data.ultimoGanadorBo3 || null;

  const inJ = document.getElementById("an-name-j");
  const inR = document.getElementById("an-name-r");
  if (inJ) inJ.value = data.nombreJ || "";
  if (inR) inR.value = data.nombreR || "";

  ["30", "15", "bo3"].forEach(m => {
    const btn = document.getElementById(`an-mode-${m}`);
    if (btn) btn.classList.toggle("active", String(AN.modo) === m);
  });
  const lbl = document.getElementById("an-limit-lbl");
  if (lbl) lbl.textContent = AN.modo === "bo3" ? "MJ3" : AN.modo;

  anActualizar();
  anRenderizar();
  anRenderizarHistorial();
  anOcultarGanador();
  return true;
}

function anBorrarPartidaGuardada() {
  try { localStorage.removeItem(ANOTADOR_KEY); } catch (e) { /* ignore */ }
}

// ── Modo de juego ─────────────────────────────────────────────

function anSetMode(modo) {
  AN.modo   = modo;
  AN.limite = (modo === 'bo3') ? 30 : modo;
  AN.ptsJ   = 0;
  AN.ptsR   = 0;
  AN.manoN  = 1;
  AN.historial = [];
  AN.bo3J   = 0;
  AN.bo3R   = 0;
  AN.partidoResuelto  = false;
  AN.ultimoGanadorBo3 = null;

  // Activar botón
  ["30", "15", "bo3"].forEach(m => {
    const btn = document.getElementById(`an-mode-${m}`);
    if (btn) btn.classList.toggle("active", String(modo) === m);
  });

  const lbl = document.getElementById("an-limit-lbl");
  if (lbl) lbl.textContent = modo === "bo3" ? "MJ3" : modo;

  anRenderizar();
  anOcultarGanador();
  anGuardarEstado();
}

// ── Sumar/restar puntos ───────────────────────────────────────

function anSumar(equipo, delta) {
  // Una vez que alguien llegó al límite ya no se puede SUMAR más sin pasar
  // por "Nueva mano"/reset — pero sí se puede RESTAR, para corregir un toque
  // de más sin tener que reiniciar todo el partido.
  const enLimite = AN.ptsJ >= AN.limite || AN.ptsR >= AN.limite;
  if (enLimite && delta > 0) return;

  if (equipo === "j") {
    AN.ptsJ = Math.max(0, AN.ptsJ + delta);
  } else {
    AN.ptsR = Math.max(0, AN.ptsR + delta);
  }

  anRenderizar();

  // Si una corrección hace que ya nadie llegue al límite, el chico/partido
  // "revive": ocultar el banner y deshacer el conteo de bo3 si correspondía.
  if (AN.partidoResuelto && AN.ptsJ < AN.limite && AN.ptsR < AN.limite) {
    if (AN.modo === "bo3") {
      if (AN.ultimoGanadorBo3 === "j") AN.bo3J = Math.max(0, AN.bo3J - 1);
      else if (AN.ultimoGanadorBo3 === "r") AN.bo3R = Math.max(0, AN.bo3R - 1);
    }
    AN.partidoResuelto  = false;
    AN.ultimoGanadorBo3 = null;
    anOcultarGanador();
  }

  anChequearGanador();
  anGuardarEstado();

  // Sonido si existe
  if (typeof playSound === "function" && delta > 0) playSound("punto");
}

// ── Nueva mano ────────────────────────────────────────────────

function anNuevaMano() {
  const ptsAntes = { j: AN.ptsJ, r: AN.ptsR };
  // Guardar en historial quién sumó en esta mano
  AN.historial.push({
    mano: AN.manoN,
    j: AN.ptsJ,
    r: AN.ptsR,
  });
  AN.manoN++;
  anRenderizarHistorial();
  anRenderizar();
  anGuardarEstado();

  // Feedback visual breve
  const panel = document.querySelector(".an-tanteador");
  if (panel) {
    panel.classList.add("nueva-mano-flash");
    setTimeout(() => panel.classList.remove("nueva-mano-flash"), 400);
  }
}

// ── Reset completo ────────────────────────────────────────────

function anReset() {
  AN.ptsJ      = 0;
  AN.ptsR      = 0;
  AN.manoN     = 1;
  AN.historial = [];
  AN.bo3J      = 0;
  AN.bo3R      = 0;
  AN.partidoResuelto  = false;
  AN.ultimoGanadorBo3 = null;
  anRenderizar();
  anRenderizarHistorial();
  anOcultarGanador();
  anBorrarPartidaGuardada();
}

// ── Actualizar nombres ────────────────────────────────────────

function anActualizar() {
  const nj = document.getElementById("an-name-j")?.value.trim() || "Jugador 1";
  const nr = document.getElementById("an-name-r")?.value.trim() || "Jugador 2";
  _ansetText("an-lbl-j", nj);
  _ansetText("an-lbl-r", nr);
  anGuardarEstado();
}

// ── Renderizado principal ─────────────────────────────────────

function anRenderizar() {
  const lim = AN.limite;

  _ansetText("an-pts-j", AN.ptsJ);
  _ansetText("an-pts-r", AN.ptsR);

  // Barras de progreso verticales
  const pj = document.getElementById("an-prog-j");
  const pr = document.getElementById("an-prog-r");
  if (pj) pj.style.height = Math.min(100, (AN.ptsJ / lim) * 100) + "%";
  if (pr) pr.style.height = Math.min(100, (AN.ptsR / lim) * 100) + "%";

  // Fósforos SVG
  anRenderFosforos("an-fosforos-j", AN.ptsJ, false, lim);
  anRenderFosforos("an-fosforos-r", AN.ptsR, true,  lim);

  // Resaltar quién va ganando
  const panelJ = document.getElementById("an-panel-j");
  const panelR = document.getElementById("an-panel-r");
  if (panelJ) panelJ.classList.toggle("an-ganando", AN.ptsJ > AN.ptsR);
  if (panelR) panelR.classList.toggle("an-ganando", AN.ptsR > AN.ptsJ);
}

// ── Tanteador de fósforos para el anotador ───────────────────

function anRenderFosforos(id, puntos, esRival, limite) {
  const el = document.getElementById(id);
  if (!el) return;

  const COLOR_PALO   = esRival ? "#e05252" : "#e67e22";
  const COLOR_CABEZA = esRival ? "#a01010" : "#c0392b";
  const COLOR_GHOST  = esRival ? "rgba(200,80,80,.15)" : "rgba(200,168,75,.15)";

  // Tamaño adaptado al anotador (más grande que el panel lateral)
  const SZ     = 44;
  const GAP    = 10;
  const GROSOR = 4;
  const R_CAB  = 4;

  const grupos = Math.max(1, Math.ceil(limite / 5));
  const ptsMax = limite;

  const anchoTotal = grupos * SZ + (grupos - 1) * GAP;
  const H = SZ + 4;

  const NS  = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(NS, "svg");
  svg.setAttribute("width",   anchoTotal);
  svg.setAttribute("height",  H);
  svg.setAttribute("viewBox", `0 0 ${anchoTotal} ${H}`);
  svg.style.overflow = "visible";
  svg.style.display  = "block";
  svg.style.margin   = "0 auto";

  for (let g = 0; g < grupos; g++) {
    const ox = g * (SZ + GAP);
    const oy = 2;
    const puntosEnGrupo = Math.min(5, puntos - g * 5);
    const totalEnGrupo  = Math.min(5, ptsMax - g * 5);

    // Fondo fantasma del cuadrado (muestra hasta dónde llega el límite)
    if (totalEnGrupo > 0) {
      const rect = document.createElementNS(NS, "rect");
      rect.setAttribute("x", ox + 1); rect.setAttribute("y", oy + 1);
      rect.setAttribute("width",  SZ - 2); rect.setAttribute("height", SZ - 2);
      rect.setAttribute("rx", 3); rect.setAttribute("fill", "none");
      rect.setAttribute("stroke", COLOR_GHOST);
      rect.setAttribute("stroke-width", "1");
      rect.setAttribute("stroke-dasharray", "4 3");
      svg.appendChild(rect);
    }

    // Palitos reales
    const palitos = [
      () => _anPalito(svg, ox+2,    oy,     ox+SZ-2, oy,     GROSOR, COLOR_PALO, COLOR_CABEZA, R_CAB),
      () => _anPalito(svg, ox+SZ-2, oy,     ox+SZ-2, oy+SZ,  GROSOR, COLOR_PALO, COLOR_CABEZA, R_CAB),
      () => _anPalito(svg, ox+SZ-2, oy+SZ,  ox+2,    oy+SZ,  GROSOR, COLOR_PALO, COLOR_CABEZA, R_CAB),
      () => _anPalito(svg, ox+2,    oy+SZ,  ox+2,    oy,     GROSOR, COLOR_PALO, COLOR_CABEZA, R_CAB),
      () => _anPalito(svg, ox+2,    oy+2,   ox+SZ-2, oy+SZ-2,GROSOR, COLOR_PALO, COLOR_CABEZA, R_CAB),
    ];

    for (let p = 0; p < Math.max(0, puntosEnGrupo); p++) {
      palitos[p]();
    }
  }

  el.innerHTML = "";
  el.appendChild(svg);
}

function _anPalito(svg, x1, y1, x2, y2, grosor, colorP, colorC, rC) {
  const NS = "http://www.w3.org/2000/svg";
  const line = document.createElementNS(NS, "line");
  line.setAttribute("x1", x1); line.setAttribute("y1", y1);
  line.setAttribute("x2", x2); line.setAttribute("y2", y2);
  line.setAttribute("stroke", colorP);
  line.setAttribute("stroke-width", grosor);
  line.setAttribute("stroke-linecap", "round");
  svg.appendChild(line);

  const circ = document.createElementNS(NS, "circle");
  circ.setAttribute("cx", x2); circ.setAttribute("cy", y2);
  circ.setAttribute("r",  rC); circ.setAttribute("fill", colorC);
  svg.appendChild(circ);
}

// ── Historial ─────────────────────────────────────────────────

function anRenderizarHistorial() {
  const el = document.getElementById("an-historial");
  if (!el) return;

  const nj = window.esc(document.getElementById("an-name-j")?.value.trim() || "J1");
  const nr = window.esc(document.getElementById("an-name-r")?.value.trim() || "J2");

  if (AN.historial.length === 0) {
    el.innerHTML = `<div class="an-hist-empty">Sin manos jugadas aún</div>`;
    return;
  }

  el.innerHTML = AN.historial.map((h, i) => {
    const prev = AN.historial[i - 1];
    const deltaJ = h.j - (prev ? prev.j : 0);
    const deltaR = h.r - (prev ? prev.r : 0);
    return `<div class="an-hist-row">
      <span class="an-hist-mano">M${h.mano}</span>
      <span class="an-hist-j ${deltaJ > 0 ? 'sumó' : ''}">${nj.substring(0,6)}: ${h.j} ${deltaJ > 0 ? `<em>+${deltaJ}</em>` : ''}</span>
      <span class="an-hist-sep">·</span>
      <span class="an-hist-r ${deltaR > 0 ? 'sumó' : ''}">${nr.substring(0,6)}: ${h.r} ${deltaR > 0 ? `<em>+${deltaR}</em>` : ''}</span>
    </div>`;
  }).reverse().join(""); // más reciente primero
}

// ── Chequear ganador ──────────────────────────────────────────

function anChequearGanador() {
  if (AN.ptsJ < AN.limite && AN.ptsR < AN.limite) return;
  if (AN.partidoResuelto) return; // ya contabilizado (evita duplicar al corregir)
  AN.partidoResuelto = true;

  const nj = document.getElementById("an-name-j")?.value.trim() || "Jugador 1";
  const nr = document.getElementById("an-name-r")?.value.trim() || "Jugador 2";
  const ladoGanador = AN.ptsJ >= AN.limite ? "j" : "r";
  const ganador = ladoGanador === "j" ? nj : nr;

  if (AN.modo === "bo3") {
    if (ladoGanador === "j") AN.bo3J++; else AN.bo3R++;
    AN.ultimoGanadorBo3 = ladoGanador;

    if (AN.bo3J >= 2 || AN.bo3R >= 2) {
      const ganMJ3 = AN.bo3J >= 2 ? nj : nr;
      _anMostrarGanador(`🏆 ¡${ganMJ3} ganó el partido (${AN.bo3J}–${AN.bo3R})!`);
      return;
    }
    // Siguiente chico (si no se corrige el resultado en estos 2s)
    setTimeout(() => {
      if (!AN.partidoResuelto || AN.ultimoGanadorBo3 !== ladoGanador) return;
      AN.ptsJ  = 0;
      AN.ptsR  = 0;
      AN.manoN = 1;
      AN.historial = [];
      AN.partidoResuelto  = false;
      AN.ultimoGanadorBo3 = null;
      anRenderizar();
      anRenderizarHistorial();
      anOcultarGanador();
      anGuardarEstado();
      if (typeof showToast === "function") showToast(`¡${ganador} ganó el chico! Siguiente...`);
    }, 2000);
    _anMostrarGanador(`🏆 ¡${ganador} ganó el chico!`);
    return;
  }

  _anMostrarGanador(`🏆 ¡${ganador} ganó el partido!`);
  if (typeof playSound === "function") playSound("win");
}

function _anMostrarGanador(texto) {
  const banner = document.getElementById("an-winner-banner");
  const txt    = document.getElementById("an-winner-text");
  if (!banner || !txt) return;
  txt.textContent = texto;
  banner.style.display = "flex";
  banner.classList.add("an-winner-in");
}

function anOcultarGanador() {
  const banner = document.getElementById("an-winner-banner");
  if (banner) { banner.style.display = "none"; banner.classList.remove("an-winner-in"); }
}

// ── Helpers ───────────────────────────────────────────────────

function _ansetText(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}

// ══════════════════════════════════════════════════════════════
// INIT — reemplaza el DOMContentLoaded de juego_ui.js para
// mostrar el menú en vez de la pantalla de nombre directamente
// ══════════════════════════════════════════════════════════════

window.addEventListener("DOMContentLoaded", () => {
  // Ocultar todo menos el loading (lo oculta juego.js en window.load)
  PANTALLAS.forEach(p => {
    const el = document.getElementById(p);
    if (el) el.style.display = "none";
  });

  const fabs = document.getElementById("fab-group");
  if (fabs) fabs.style.display = "none";
}, { once: true }); // once:true para no competir con juego_ui.js

// Después de que cargue todo, mostrar el menú principal
window.addEventListener("load", () => {
  // Restaurar partida guardada del anotador (si existe), aunque la
  // pantalla esté oculta — así queda lista cuando el usuario entre.
  anCargarPartida();

  // juego.js ya ocultó el loading — mostrar menú
  setTimeout(() => irA("main-menu"), 100);
}, { once: true });
