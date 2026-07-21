/* ══════════════════════════════════════════════════════════
   COPAS DE CLUBES — Libertadores / Champions (motor: torneo.js)
   - Libertadores: 16 clubes sudamericanos (Argentina, Brasil, etc.)
   - Champions:    16 clubes europeos (LaLiga, Premier, ...)
   Formato: 4 grupos de 4 (todos contra todos), clasifican 2 →
   cuartos / semis / final. Los partidos del jugador se juegan en
   la mesa; el resto se simula por fuerza. El campeón queda guardado
   para el futuro Mundial de Clubes (América vs Europa).
   ══════════════════════════════════════════════════════════ */

const COPAS_DEFS = {
  libertadores: { id: "libertadores", nombre: "Copa Libertadores", region: "sudamerica", icon: "🏆", color: "#1f7a3d" },
  champions:    { id: "champions",    nombre: "Champions League",  region: "europa",     icon: "⭐", color: "#1b2a6b" },
};

const _copaKey       = id => "truco_copa_" + id;
const _copaCampeonKey = id => "truco_copa_campeon_" + id;

let copaActual     = null;   // id de copa abierta en pantalla
let copaRegistrado = false;  // guard de finDePartido

/* Junta todos los equipos de las ligas de una región (de equipos.js LIGAS). */
function _copaEquiposRegion(region) {
  if (typeof LIGAS === "undefined") return [];
  const out = [];
  LIGAS.forEach(l => { if (l.region === region && Array.isArray(l.equipos)) out.push(...l.equipos); });
  return out;
}

/* Pool del torneo: los N clubes más fuertes de la región. */
function copaPool(region, n) {
  const eq = _copaEquiposRegion(region).slice().sort((a, b) => (b.fuerza || 0) - (a.fuerza || 0));
  return eq.slice(0, n || 16);
}

/* ── CUADRO REAL DE LA COPA LIBERTADORES ──
   En vez de "los 16 más fuertes de Sudamérica" (que metía cualquier
   equipo), armamos el campo con clubes que realmente la juegan. Algunos
   ya están en las ligas (se referencian por id); los de Uruguay, Paraguay,
   Chile y Bolivia se agregan acá (con escudo monograma generado, porque
   no hay imagen oficial cargada). */
// Color de texto legible (negro o blanco) según el brillo del fondo
function _libContraste(hex) {
  const h = String(hex || "#243049").replace("#", "");
  const r = parseInt(h.substr(0,2),16)||36, g = parseInt(h.substr(2,2),16)||48, b = parseInt(h.substr(4,2),16)||73;
  return (0.299*r + 0.587*g + 0.114*b) > 150 ? "#10243a" : "#ffffff";
}
// Escudo monograma con los colores del club (escudo + franja + iniciales)
function _libCrest(nombre, color, color2) {
  color = color || "#243049"; color2 = color2 || "#ffffff";
  const palabras = String(nombre).replace(/[^\p{L}\s]/gu, "").trim().split(/\s+/).filter(Boolean);
  let ini = palabras.length >= 2 ? palabras.map(w => w[0]).join("").slice(0,3).toUpperCase()
                                 : (palabras[0] || "?").slice(0,3).toUpperCase();
  const txt = _libContraste(color);
  const svg = "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 110'>" +
    "<path d='M8 8 H92 V60 Q92 92 50 104 Q8 92 8 60 Z' fill='" + color + "' stroke='" + color2 + "' stroke-width='6'/>" +
    "<path d='M8 42 H92' stroke='" + color2 + "' stroke-width='3' opacity='.6'/>" +
    "<text x='50' y='66' font-size='30' text-anchor='middle' fill='" + txt + "' font-family='Arial,sans-serif' font-weight='800'>" + ini + "</text></svg>";
  return "data:image/svg+xml," + encodeURIComponent(svg);
}
// escudoFile (opcional): si se pasa, usa ese archivo real; si no, monograma.
function _libNuevo(id, nombre, sub, color, fuerza, color2, escudoFile) {
  return { id, nombre, sub, color, color2: color2 || "#ffffff", fuerza,
    escudo: escudoFile || _libCrest(nombre, color, color2) };
}
const LIBERTADORES_EXISTENTES = ["boca", "river", "racing", "estudiantes", "flamengo", "palmeiras", "botafogo", "nacional", "ldu", "idv"];
const LIBERTADORES_INVITADOS = [
  _libNuevo("penarol",      "Peñarol",        "Carbonero",   "#f5c518", 74, "#1a1a1a", "escudos/uruguay_penarol.football-logos.cc.svg"),
  _libNuevo("nacional-uru", "Nacional (URU)", "El Bolso",    "#1c4f9c", 72, "#d2122e", "escudos/uruguay_nacional.football-logos.cc.svg"),
  _libNuevo("olimpia",      "Olimpia",        "El Decano",   "#1a1a1a", 70, "#ffffff", "escudos/paraguay_olimpia.football-logos.cc.svg"),
  _libNuevo("cerro",        "Cerro Porteño",  "El Ciclón",   "#1c5fa8", 69, "#d2122e", "escudos/paraguay_cerro-porteno.football-logos.cc.svg"),
  _libNuevo("colo-colo",    "Colo-Colo",      "El Cacique",  "#1a1a1a", 73, "#ffffff", "escudos/chile_colo-colo.football-logos.cc.svg"),
  _libNuevo("bolivar",      "Bolívar",        "La Academia", "#1c8ad4", 67, "#ffffff", "escudos/bolivia_bolivar.football-logos.cc.svg"),
];
function _libertadoresPool() {
  const ex = LIBERTADORES_EXISTENTES
    .map(id => (typeof buscarEquipo === "function" ? (buscarEquipo(id) || {}).equipo : null))
    .filter(Boolean);
  return ex.concat(LIBERTADORES_INVITADOS).slice(0, 16);
}

const COPA_VERSION = 2; // subir esto invalida las copas guardadas en formatos viejos

function copaCargar(id) {
  try {
    const e = JSON.parse(localStorage.getItem(_copaKey(id)));
    // Validación de integridad: descarta copas viejas/corruptas para evitar
    // estados raros (p.ej. que se simule todo de golpe). Si no pasa, se
    // arranca de cero (pantalla de elegir club).
    if (e && e.grupos && e.v === COPA_VERSION && e.equipoId && e.mapa && e.mapa[e.equipoId]) return e;
  } catch (_) {}
  return null;
}
function copaGuardar(id, est) {
  if (typeof lsSet === "function") lsSet(_copaKey(id), JSON.stringify(est));
  else { try { localStorage.setItem(_copaKey(id), JSON.stringify(est)); } catch (_) {} }
}
function copaReset(id) {
  try { localStorage.removeItem(_copaKey(id)); } catch (_) {}
  copaRender(id);
}

/* Arranca una copa nueva con el club elegido por el jugador. */
function copaEmpezar(id, equipoId) {
  const def = COPAS_DEFS[id];
  const pool = (id === "libertadores") ? _libertadoresPool() : copaPool(def.region, 16);
  if (!pool.some(e => e.id === equipoId)) equipoId = pool[0].id;
  const est = TORNEO.crear({ id, nombre: def.nombre, equipos: pool, numGrupos: 4, clasificanPorGrupo: 2 });
  est.equipoId = equipoId;
  est.v = COPA_VERSION;
  TORNEO.simularPendientesGrupo(est, equipoId); // el resto de los grupos
  copaGuardar(id, est);
  copaRender(id);
}

/* Próximo partido del jugador (grupo o cruce). null si no le toca. */
function _copaPartidoJugador(est) {
  const jug = est.equipoId;
  if (est.fase === "grupos") {
    for (let g = 0; g < est.grupos.length; g++) {
      const ps = est.grupos[g].partidos;
      for (let i = 0; i < ps.length; i++) {
        const p = ps[i];
        if (!p.ganador && (p.a === jug || p.b === jug))
          return { tipo: "grupo", grupo: g, idx: i, rival: p.a === jug ? p.b : p.a };
      }
    }
  } else if (est.fase === "bracket") {
    const ronda = TORNEO.rondaActualBracket(est) || [];
    for (let i = 0; i < ronda.length; i++) {
      const c = ronda[i];
      if (!c.ganador && (c.a === jug || c.b === jug))
        return { tipo: "bracket", idx: i, rival: c.a === jug ? c.b : c.a };
    }
  }
  return null;
}

/* Avanza el torneo simulando todo lo que no juega el jugador, hasta que
   le toque un partido o se defina el campeón. */
function copaAvanzar(est) {
  const jug = est.equipoId;
  if (est.fase === "grupos") {
    TORNEO.simularPendientesGrupo(est, jug);
    if (TORNEO.gruposCompletos(est)) TORNEO.armarBracket(est);
    else return est; // al jugador le quedan partidos de grupo
  }
  if (est.fase === "bracket") {
    let guard = 0;
    while (guard++ < 12) {
      TORNEO.simularPendientesBracket(est, jug);
      const ronda = TORNEO.rondaActualBracket(est) || [];
      const pendienteJugador = ronda.some(c => (c.a === jug || c.b === jug) && !c.ganador);
      if (pendienteJugador) return est; // tiene que jugar
      if (TORNEO.rondaCompleta(est)) {
        TORNEO.avanzarBracket(est);
        if (est.fase === "fin") { _copaConsagrar(est); return est; }
      } else return est;
    }
  }
  return est;
}

function _copaConsagrar(est) {
  if (est.campeon) {
    try {
      localStorage.setItem(_copaCampeonKey(est.id),
        JSON.stringify({ id: est.campeon, jugador: est.campeon === est.equipoId }));
    } catch (_) {}
  }
}

/* Lee el campeón guardado de una copa: { id, jugador }. Compatible con el
   formato viejo (string suelto). null si esa copa todavía no tiene campeón. */
function _copaCampeonData(id) {
  try {
    const raw = localStorage.getItem(_copaCampeonKey(id));
    if (!raw) return null;
    if (raw.charAt(0) === "{") return JSON.parse(raw);
    return { id: raw, jugador: false };
  } catch (_) { return null; }
}

/* Pone en la mesa el partido del jugador y arranca (igual que el Mundial). */
function copaJugarSiguiente(id) {
  const est = copaCargar(id);
  if (!est) return;
  const pm = _copaPartidoJugador(est);
  if (!pm) { copaRender(id); return; } // no le toca (eliminado o terminado)

  modoCopa = true;
  copaActual = id;

  const encJ = buscarEquipo(est.equipoId);
  if (encJ) { equipoSel = encJ.equipo; LIGA = encJ.liga; }
  const encR = buscarEquipo(pm.rival);
  equipoRival = encR ? encR.equipo : (est.mapa[pm.rival] || null);

  // Preservar el nombre del jugador si ya lo tenía
  const inp = document.getElementById("name-input");
  if (inp && !inp.value && typeof S !== "undefined" && S.nombreJugador) inp.value = S.nombreJugador;

  if (typeof window.setName === "function") window.setName();
}

/* ── Captura del resultado y avance (bus de eventos) ── */
if (typeof onJuego === "function") {
  onJuego("finDePartido", ({ puntosJugador, limite }) => {
    if (!modoCopa || copaRegistrado) return;
    copaRegistrado = true;
    const gano = puntosJugador >= limite;
    const id = copaActual;

    // IMPORTANTE: NO apagar modoCopa de forma sincrónica. Los handlers de
    // finDePartido corren en secuencia dentro del mismo evento, y el de liga.js
    // corre DESPUÉS que éste. Si acá ponemos modoCopa=false ya, la liga ve el
    // flag apagado y registra el partido de copa como una fecha de la liga
    // argentina. Lo diferimos un tick para que todos lo vean en true.
    const _apagarModoCopa = () => setTimeout(() => { modoCopa = false; }, 0);

    // ── Final del Mundial de Clubes ──
    if (id === "cwc") {
      _cwcResolver(gano);
      _apagarModoCopa();
      setTimeout(() => { if (typeof irA === "function") irA("copa-screen"); copaRender("cwc"); }, 1700);
      return;
    }

    const est = copaCargar(id);
    if (!est) { _apagarModoCopa(); return; }

    const pm = _copaPartidoJugador(est);
    if (pm) {
      const ganadorId = gano ? est.equipoId : pm.rival;
      if (pm.tipo === "grupo") TORNEO.registrarGrupo(est, pm.grupo, pm.idx, ganadorId);
      else                     TORNEO.registrarBracket(est, pm.idx, ganadorId);
    }
    copaAvanzar(est);
    copaGuardar(id, est);
    _apagarModoCopa();

    // Volver a la pantalla de la copa con el cuadro actualizado
    setTimeout(() => { if (typeof irA === "function") irA("copa-screen"); copaRender(id); }, 1700);
  });
  onJuego("nuevoPartido", () => { copaRegistrado = false; });
}

/* ── Abrir la copa desde el menú ── */
function copaAbrir(id) {
  copaActual = id;
  if (typeof irA === "function") irA("copa-screen");
  copaRender(id);
}

/* ══════════════════════════════════════════════════════════
   RENDER de la pantalla de copa
   ══════════════════════════════════════════════════════════ */
function _copaNombre(est, idEq) { const e = est.mapa[idEq] || {}; return e.nombre || idEq || "—"; }
function _copaEscudoImg(est, idEq, cls) {
  const e = est.mapa[idEq];
  if (!e) return "";
  const src = (typeof escudoDe === "function") ? escudoDe(e) : (e.escudo || "");
  return '<img src="' + src + '" class="' + (cls || "copa-esc") + '" onerror="escudoFallback&&escudoFallback(this)">';
}

// Color de identidad de cada copa (coincide con el --acc del menú) para teñir
// la pantalla: cabecera, grupos, llave y fondo.
const _COPA_ACC = { libertadores: "#f2c200", champions: "#5566ff", mundial: "#3aa0ff", cwc: "#d4af37" };
function _copaTeñir(id) {
  const scr = document.getElementById("copa-screen");
  if (scr) scr.style.setProperty("--copa-acc", _COPA_ACC[id] || "#f2c200");
}

// Genera N piezas de confeti con posición/velocidad/giro/color variados (para
// la celebración de campeón). Cada una lleva sus vars CSS inline.
function _copaConfeti(n) {
  const cols = ["#f5c518", "#2ecc71", "#6ab4f5", "#e74c3c", "#ffffff", "#ff8a3d"];
  let s = "";
  for (let k = 0; k < n; k++) {
    const x = Math.round(Math.random() * 100);
    const d = (1.7 + Math.random() * 1.4).toFixed(2);
    const dl = (Math.random() * 0.9).toFixed(2);
    const r = 360 + Math.round(Math.random() * 780);
    s += '<i class="copa-confeti" style="--x:' + x + '%;--d:' + d + 's;--dl:' + dl + 's;--r:' + r + 'deg;--c:' + cols[k % cols.length] + '"></i>';
  }
  return s;
}

function copaRender(id) {
  const cont = document.getElementById("copa-content");
  if (!cont) return;
  _copaTeñir(id);
  if (id === "cwc") return _cwcRender(cont);
  const def = COPAS_DEFS[id] || {};
  const est = copaCargar(id);

  // Cabecera común
  let html = '<div class="copa-head"><button class="btn" onclick="irA(\'main-menu\')">‹ Menú</button>' +
    '<h2 class="copa-title">' + (def.icon || "🏆") + " " + (def.nombre || "Copa") + '</h2></div>';

  if (!est) {
    // SETUP: elegir club
    const pool = (id === "libertadores") ? _libertadoresPool() : copaPool(def.region, 16);
    html += '<p class="copa-sub">Elegí tu club para la copa:</p><div class="copa-pool">';
    pool.forEach(e => {
      const src = (typeof escudoDe === "function") ? escudoDe(e) : (e.escudo || "");
      html += '<button class="copa-eq" onclick="copaEmpezar(\'' + id + '\',\'' + e.id + '\')">' +
        '<img src="' + src + '" onerror="escudoFallback&&escudoFallback(this)"><span>' + e.nombre + '</span></button>';
    });
    html += '</div>';
    cont.innerHTML = html;
    return;
  }

  // Campeón — con celebración de motion graphics si ganó el jugador
  if (est.fase === "fin" && est.campeon) {
    const esJugador = est.campeon === est.equipoId;
    html += '<div class="copa-campeon' + (esJugador ? ' gano' : '') + '">' +
      (esJugador ? '<div class="copa-confeti-wrap">' + _copaConfeti(30) + '</div><div class="copa-campeon-burst"></div>' : '') +
      '<div class="copa-campeon-esc">' + _copaEscudoImg(est, est.campeon, "copa-esc-big") + '</div>' +
      '<div class="copa-campeon-txt">' + (esJugador ? "🏆 ¡SALISTE CAMPEÓN!" : "Campeón: " + _copaNombre(est, est.campeon)) + '</div>' +
      '<button class="btn primary" onclick="copaReset(\'' + id + '\')">Jugar otra</button></div>';
  } else {
    // Botón jugar / estado del jugador
    const pm = _copaPartidoJugador(est);
    if (pm) {
      html += '<div class="copa-jugar"><div class="copa-vs">' +
        _copaEscudoImg(est, est.equipoId) + '<b>VS</b>' + _copaEscudoImg(est, pm.rival) +
        '<span>' + _copaNombre(est, est.equipoId) + " vs " + _copaNombre(est, pm.rival) + '</span></div>' +
        '<button class="btn primary copa-btn-jugar" onclick="copaJugarSiguiente(\'' + id + '\')">▶ JUGAR MI PARTIDO</button></div>';
    } else {
      const sigueJugador = _copaJugadorSigueVivo(est);
      html += '<div class="copa-jugar"><p class="copa-sub">' +
        (sigueJugador ? "Esperando el cuadro..." : "Quedaste eliminado — mirá quién se queda con la copa.") + '</p></div>';
    }
  }

  // Fase de grupos: tablas
  if (est.fase === "grupos") {
    html += '<div class="copa-grupos">';
    est.grupos.forEach((gr, gi) => {
      const tabla = TORNEO.tablaGrupo(est, gi);
      html += '<div class="copa-grupo"><div class="copa-grupo-tit">Grupo ' + gr.nombre + '</div>';
      tabla.forEach((t, pos) => {
        const yo = t.id === est.equipoId;
        const clasi = pos < est.clasificanPorGrupo;
        html += '<div class="copa-row' + (yo ? " yo" : "") + (clasi ? " clasi" : "") + '">' +
          '<span class="copa-pos">' + (pos + 1) + '</span>' + _copaEscudoImg(est, t.id, "copa-esc-sm") +
          '<span class="copa-nom">' + _copaNombre(est, t.id) + '</span>' +
          '<span class="copa-pts">' + t.pts + '</span></div>';
      });
      html += '</div>';
    });
    html += '</div>';
  } else if (est.bracket) {
    // Llave
    html += '<div class="copa-bracket">';
    const nombresRonda = ["Cuartos", "Semis", "Final", "Campeón"];
    est.bracket.rondas.forEach((ronda, ri) => {
      html += '<div class="copa-ronda"><div class="copa-ronda-tit">' + (nombresRonda[ri] || ("Ronda " + (ri + 1))) + '</div>';
      ronda.forEach(c => {
        const winA = c.ganador && c.ganador === c.a, winB = c.ganador && c.ganador === c.b;
        html += '<div class="copa-cruce">' +
          '<div class="copa-lado' + (winA ? " gana" : "") + (c.a === est.equipoId ? " yo" : "") + '">' + _copaEscudoImg(est, c.a, "copa-esc-sm") + _copaNombre(est, c.a) + '</div>' +
          '<div class="copa-lado' + (winB ? " gana" : "") + (c.b === est.equipoId ? " yo" : "") + '">' + (c.b ? _copaEscudoImg(est, c.b, "copa-esc-sm") + _copaNombre(est, c.b) : "—") + '</div>' +
          '</div>';
      });
      html += '</div>';
    });
    html += '</div>';
  }

  html += '<div class="copa-foot"><button class="btn danger" onclick="if(confirm(\'¿Reiniciar la copa?\'))copaReset(\'' + id + '\')">Reiniciar copa</button></div>';
  cont.innerHTML = html;
}

/* ¿El jugador sigue en carrera (clasificó / no perdió su cruce)? */
function _copaJugadorSigueVivo(est) {
  const jug = est.equipoId;
  if (est.fase === "fin") return est.campeon === jug;
  if (est.fase === "bracket") {
    // vivo si aparece en la ronda actual (como a/b sin perder) o ganó la última
    const ronda = TORNEO.rondaActualBracket(est) || [];
    return ronda.some(c => (c.a === jug || c.b === jug) && (!c.ganador || c.ganador === jug));
  }
  return true;
}

/* ══════════════════════════════════════════════════════════
   MUNDIAL DE CLUBES — la final del mundo:
   campeón de Libertadores (América) vs campeón de Champions (Europa).
   ══════════════════════════════════════════════════════════ */
const CWC_KEY = "truco_cwc_campeon";

function _cwcEq(id)     { const e = (typeof buscarEquipo === "function") ? buscarEquipo(id) : null; return e ? e.equipo : null; }
function _cwcNombre(id) { const e = _cwcEq(id); return e ? e.nombre : id; }
function _cwcEscudo(id, cls) {
  const e = _cwcEq(id); if (!e) return "";
  const src = (typeof escudoDe === "function") ? escudoDe(e) : (e.escudo || "");
  return '<img src="' + src + '" class="' + (cls || "copa-esc") + '" onerror="escudoFallback&&escudoFallback(this)">';
}
function _cwcCampeon() { try { const r = localStorage.getItem(CWC_KEY); return r ? JSON.parse(r) : null; } catch (_) { return null; } }
function cwcReset() { try { localStorage.removeItem(CWC_KEY); } catch (_) {} copaRender("cwc"); }

function _cwcParticipantes() {
  const libD = _copaCampeonData("libertadores");
  const chD  = _copaCampeonData("champions");
  return {
    lib:   libD ? Object.assign({}, libD, { equipo: _cwcEq(libD.id) }) : null,
    champ: chD  ? Object.assign({}, chD,  { equipo: _cwcEq(chD.id)  }) : null,
  };
}

/* Define al campeón del mundo a partir del resultado del partido del jugador. */
function _cwcResolver(gano) {
  const { lib, champ } = _cwcParticipantes();
  if (!lib || !champ) return;
  const playerSide = lib.jugador ? lib : (champ.jugador ? champ : null);
  const otherId    = (playerSide && playerSide.id === lib.id) ? champ.id : lib.id;
  const ganadorId  = gano ? (playerSide ? playerSide.id : lib.id) : otherId;
  try { localStorage.setItem(CWC_KEY, JSON.stringify({ id: ganadorId, jugador: !!(playerSide && gano) })); } catch (_) {}
}

/* Simula la final (cuando el jugador no controla ninguno de los dos campeones). */
function cwcSimular() {
  const { lib, champ } = _cwcParticipantes();
  if (!lib || !champ) return;
  const fa = (lib.equipo || {}).fuerza || 60, fb = (champ.equipo || {}).fuerza || 60;
  const winner = (Math.random() < 0.15 + 0.7 * (fa / (fa + fb))) ? lib.id : champ.id;
  try { localStorage.setItem(CWC_KEY, JSON.stringify({ id: winner, jugador: false })); } catch (_) {}
  copaRender("cwc");
}

/* Pone la final en la mesa (el jugador controla su campeón). */
function cwcJugar() {
  const { lib, champ } = _cwcParticipantes();
  if (!lib || !champ) return;
  const playerSide = lib.jugador ? lib : (champ.jugador ? champ : null);
  if (!playerSide) { cwcSimular(); return; }
  const other = playerSide.id === lib.id ? champ : lib;

  modoCopa = true;
  copaActual = "cwc";
  const encJ = buscarEquipo(playerSide.id); if (encJ) { equipoSel = encJ.equipo; LIGA = encJ.liga; }
  const encR = buscarEquipo(other.id);      equipoRival = encR ? encR.equipo : null;
  const inp = document.getElementById("name-input");
  if (inp && !inp.value && typeof S !== "undefined" && S.nombreJugador) inp.value = S.nombreJugador;
  if (typeof window.setName === "function") window.setName();
}

function _cwcReqCard(copaId, label, data) {
  const ok = !!data;
  return '<div class="copa-eq" ' + (ok ? '' : 'onclick="copaAbrir(\'' + copaId + '\')"') +
    ' style="cursor:' + (ok ? 'default' : 'pointer') + '">' +
    '<div style="font-size:24px">' + (ok ? '✅' : '▶') + '</div>' +
    '<span>' + label + '<br><small style="opacity:.7">' + (ok ? ('Campeón: ' + _cwcNombre(data.id)) : 'jugala para definir') + '</small></span></div>';
}

function _cwcRender(cont) {
  const { lib, champ } = _cwcParticipantes();
  let html = '<div class="copa-head"><button class="btn" onclick="irA(\'main-menu\')">‹ Menú</button>' +
    '<h2 class="copa-title">👑 Mundial de Clubes</h2></div>';

  if (!lib || !champ) {
    html += '<p class="copa-sub">La final del mundo: el campeón de América contra el de Europa. Primero definí las dos copas:</p>' +
      '<div class="copa-pool" style="grid-template-columns:1fr 1fr;max-width:460px;margin:0 auto">' +
      _cwcReqCard("libertadores", "🏆 Libertadores", lib) +
      _cwcReqCard("champions", "⭐ Champions", champ) + '</div>';
    cont.innerHTML = html; return;
  }

  const camp = _cwcCampeon();
  if (camp) {
    html += '<div class="copa-campeon">' + _cwcEscudo(camp.id, "copa-esc-big") +
      '<div class="copa-campeon-txt">' + (camp.jugador ? "👑 ¡CAMPEÓN DEL MUNDO!" : "Campeón del mundo: " + _cwcNombre(camp.id)) + '</div>' +
      '<button class="btn primary" onclick="cwcReset()">Jugar otra final</button></div>';
    cont.innerHTML = html; return;
  }

  const playerEnFinal = lib.jugador || champ.jugador;
  html += '<p class="copa-sub" style="font-size:15px;color:#ffe08a;letter-spacing:2px">★ LA FINAL DEL MUNDO ★</p>' +
    '<div class="copa-jugar"><div class="copa-vs" style="gap:18px">' +
      '<div style="text-align:center">' + _cwcEscudo(lib.id, "copa-esc-big") + '<div>' + _cwcNombre(lib.id) + '<br><small style="opacity:.6">AMÉRICA</small></div></div>' +
      '<b style="font-size:26px">VS</b>' +
      '<div style="text-align:center">' + _cwcEscudo(champ.id, "copa-esc-big") + '<div>' + _cwcNombre(champ.id) + '<br><small style="opacity:.6">EUROPA</small></div></div>' +
    '</div>' +
    (playerEnFinal
      ? '<button class="btn primary copa-btn-jugar" onclick="cwcJugar()">▶ JUGAR LA FINAL</button>'
      : '<button class="btn primary copa-btn-jugar" onclick="cwcSimular()">Simular la final</button>') +
    '</div>';
  cont.innerHTML = html;
}
