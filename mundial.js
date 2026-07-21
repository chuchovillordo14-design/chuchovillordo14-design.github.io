/* ══════════════════════════════════════════════════════════
   MUNDIAL 2026 — modo torneo (formato Copa del Mundo)
   - Elegís tu selección de los 48 clasificados (equipos.js → LIGA_MUNDIAL2026)
   - Sorteo de 12 grupos de 4 (4 potes por fuerza, sorteo dentro de cada pote)
   - Fase de grupos: 3 fechas todos-contra-todos. Victoria 3pts, derrota
     en las buenas (≥15 de 30) 1pt, derrota en las malas 0pts (sin empates)
   - Clasifican los 2 primeros de cada grupo + los 8 mejores terceros (32)
   - Eliminación directa: dieciseisavos → octavos → cuartos → semis → final
     (+ tercer puesto, simulado, entre los perdedores de semifinales)
   - Si el jugador queda eliminado (en grupos o en cualquier cruce), el
     resto del torneo se simula solo para definir el campeón.
   No modifica el código existente del juego (salvo el flag modoMundial
   y un chequeo en aplicarEquipoEnMesa, ver equipos.js).
   ══════════════════════════════════════════════════════════ */

const MUNDIAL_KEY = "truco_mundial";
const MUNDIAL_REGLAS_KEY = "truco_mundial_reglas_vistas";
let mundialRegistrado = false; // evita registrar el mismo partido dos veces
let mundialEquipoSel  = null;  // selección elegida en la pantalla de armado

/* Fixture fijo de un grupo de 4 (índices 0-3 dentro de g.equipos).
   3 fechas, todos contra todos (igual que el círculo de liga.js para n=4). */
const MUNDIAL_FIXTURE_GRUPO = [
  [[0,3],[1,2]],
  [[0,2],[3,1]],
  [[0,1],[2,3]]
];

const MUNDIAL_LETRAS = "ABCDEFGHIJKL";

/* ── Estado: cargar / guardar / resetear ── */
function mundialCargar() {
  try {
    const raw = localStorage.getItem(MUNDIAL_KEY);
    if (raw) {
      const m = JSON.parse(raw);
      if (m && m.grupos) return m;
    }
  } catch (e) {}
  return null; // null = todavía no se armó ningún Mundial
}

function mundialGuardar(m) { lsSet(MUNDIAL_KEY, JSON.stringify(m)); }

function mundialResetear() {
  localStorage.removeItem(MUNDIAL_KEY);
  localStorage.removeItem(MUNDIAL_REGLAS_KEY);
  mundialEquipoSel = null;
  if (typeof closeModal === "function") { try { closeModal("mundial-modal"); } catch (e) {} }
  mundialRenderTodo();
}

/* ── Sorteo de grupos: 4 potes de 12 por fuerza, mezclados con mezclarIds ── */
function mundialNuevo(equipoId) {
  const equipos = LIGA_MUNDIAL2026.equipos.slice().sort((a, b) => b.fuerza - a.fuerza);
  const potes = [
    mezclarIds(equipos.slice(0, 12).map(e => e.id)),
    mezclarIds(equipos.slice(12, 24).map(e => e.id)),
    mezclarIds(equipos.slice(24, 36).map(e => e.id)),
    mezclarIds(equipos.slice(36, 48).map(e => e.id)),
  ];

  const grupos = {};
  for (let i = 0; i < 12; i++) {
    const letra = MUNDIAL_LETRAS[i];
    const ids = [potes[0][i], potes[1][i], potes[2][i], potes[3][i]];
    const tabla = {};
    ids.forEach(id => { tabla[id] = { pj:0, pg:0, db:0, pp:0, pts:0, gf:0, gc:0 }; });
    grupos[letra] = { equipos: ids, tabla, fixture: MUNDIAL_FIXTURE_GRUPO, fecha: 0, resultados: [] };
  }

  let grupoJugador = null;
  for (const letra in grupos) {
    if (grupos[letra].equipos.includes(equipoId)) { grupoJugador = letra; break; }
  }

  // Los otros 11 grupos juegan sus 3 fechas de una, completas y simuladas
  for (const letra in grupos) {
    if (letra === grupoJugador) continue;
    _mundialSimularGrupoCompleto(grupos[letra]);
  }

  return {
    equipoId,
    grupoJugador,
    fase: "grupos",
    grupos,
    bracket: null,
    bracketTercer: null,
    premiosEntregados: { grupos: false, final: false }
  };
}

function _mundialSimularGrupoCompleto(g) {
  g.fixture.forEach((fecha, fi) => {
    const resultadosFecha = [];
    fecha.forEach(par => {
      const idA = g.equipos[par[0]], idB = g.equipos[par[1]];
      const [ga, gb] = _mundialSimularPartido(idA, idB);
      _mundialAplicarResultado(g.tabla, idA, idB, ga, gb);
      resultadosFecha.push({ a: idA, b: idB, ga, gb });
    });
    g.resultados[fi] = resultadosFecha;
    g.fecha++;
  });
}

/* ── Helpers ── */
function _mundialEquipo(id) {
  return LIGA_MUNDIAL2026.equipos.find(e => e.id === id);
}

function _mundialOrdenarGrupo(g) {
  return g.equipos
    .map(id => Object.assign({ id }, _mundialEquipo(id), g.tabla[id]))
    .sort((a, b) => b.pts - a.pts || (b.gf - b.gc) - (a.gf - a.gc) || b.gf - a.gf || a.nombre.localeCompare(b.nombre));
}

function _mundialSeedScore(t) {
  return t.pts * 1000 + (t.gf - t.gc) * 10 + t.gf;
}

/* Delegan en SIM (sim.js), la fuente única de la simulación. */
function _mundialProbGana(fA, fB)  { return SIM.probGana(fA, fB); }
function _mundialScorePerdedor(pA) { return SIM.scorePerdedor(pA); }

/* Resultado simulado entre dos equipos que no juega el usuario.
   Marcador en escala 0-30 (igual que el límite normal del truco x1).
   El ganador se decide PONDERANDO la fuerza de cada selección (los
   grandes pasan más seguido, pero el batacazo es posible), y el
   marcador refleja si fue paliza o partido peleado. */
function _mundialSimularPartido(idA, idB) {
  const fA = _mundialEquipo(idA)?.fuerza ?? 60;
  const fB = _mundialEquipo(idB)?.fuerza ?? 60;
  const pA = _mundialProbGana(fA, fB);
  const ganaA = Math.random() < pA;
  const perd = _mundialScorePerdedor(ganaA ? pA : 1 - pA);
  return ganaA ? [30, perd] : [perd, 30];
}

/* Aplica un resultado (scoreA/scoreB en escala 0-30) a una tabla de grupo */
function _mundialAplicarResultado(tabla, idA, idB, scoreA, scoreB) {
  const ta = tabla[idA], tb = tabla[idB];
  ta.pj++; tb.pj++;
  ta.gf += scoreA; ta.gc += scoreB;
  tb.gf += scoreB; tb.gc += scoreA;
  if (scoreA > scoreB) {
    ta.pg++; ta.pts += 3;
    if (scoreB >= 15) { tb.db++; tb.pts += 1; } else { tb.pp++; }
  } else {
    tb.pg++; tb.pts += 3;
    if (scoreA >= 15) { ta.db++; ta.pts += 1; } else { ta.pp++; }
  }
}

/* ── Registrar resultado del partido del jugador en fase de grupos ── */
function mundialRegistrarResultadoGrupo(gano, ptsJ, ptsR, limite) {
  const m = mundialCargar();
  if (!m || m.fase !== "grupos") return;

  const g = m.grupos[m.grupoJugador];
  const fechaIdx = g.fecha;
  const fixture = g.fixture[fechaIdx];
  if (!fixture) return;
  g.fecha++;

  const idJ = m.equipoId;
  const par = fixture.find(p => g.equipos[p[0]] === idJ || g.equipos[p[1]] === idJ);
  const idR = g.equipos[par[0]] === idJ ? g.equipos[par[1]] : g.equipos[par[0]];

  const factor = limite === 15 ? 2 : 1;
  const scoreJ = gano ? 30 : Math.min(29, ptsJ * factor);
  const scoreR = gano ? Math.min(29, ptsR * factor) : 30;

  _mundialAplicarResultado(g.tabla, idJ, idR, scoreJ, scoreR);
  const resultadosFecha = [{ a: idJ, b: idR, ga: scoreJ, gb: scoreR, jugador: true }];

  // Resto de la fecha del grupo del jugador: simulado
  fixture.forEach(p => {
    const idA = g.equipos[p[0]], idB = g.equipos[p[1]];
    if (idA === idJ || idB === idJ) return;
    const [ga, gb] = _mundialSimularPartido(idA, idB);
    _mundialAplicarResultado(g.tabla, idA, idB, ga, gb);
    resultadosFecha.push({ a: idA, b: idB, ga, gb });
  });
  g.resultados[fechaIdx] = resultadosFecha;

  // ── Sobres de figuritas por fecha ──
  const enBuenas = !gano && scoreJ >= 15;
  let sobres = 0;
  if (typeof figusOtorgarSobres === "function") {
    if (gano) sobres = 1;
    else if (enBuenas && Math.random() < 0.5) sobres = 1;
    if (sobres > 0) figusOtorgarSobres(sobres);
  }

  let mensajeExtra = null;
  if (g.fecha >= g.fixture.length) {
    mensajeExtra = _mundialCerrarFaseGrupos(m);
  }

  mundialGuardar(m);

  const rivalNom = _mundialEquipo(idR)?.nombre || "tu rival";
  let msg;
  if (gano)          msg = "⚽ Fecha " + g.fecha + ": ¡le ganaste a " + rivalNom + "! +3 pts";
  else if (enBuenas) msg = "⚽ Fecha " + g.fecha + ": perdiste con " + rivalNom + " en las buenas. +1 pt";
  else               msg = "⚽ Fecha " + g.fecha + ": perdiste con " + rivalNom + " en las malas. 0 pts";

  if (typeof showToast === "function") {
    try {
      showToast(msg);
      if (sobres > 0) showToast("✉️ ¡Ganaste " + sobres + " sobre de figuritas! Abrilo desde el álbum 📒");
      if (mensajeExtra) showToast(mensajeExtra, 4500);
    } catch (e) {}
  }
  setTimeout(() => openModal && openModal("mundial-modal"), 1200);
  mundialRenderTodo();
}

/* ── Cierre de la fase de grupos → clasificados y armado del cuadro ── */
function _mundialCerrarFaseGrupos(m) {
  const primeros = [], segundos = [], terceros = [];
  for (const letra in m.grupos) {
    const orden = _mundialOrdenarGrupo(m.grupos[letra]);
    primeros.push(Object.assign({ grupo: letra }, orden[0]));
    segundos.push(Object.assign({ grupo: letra }, orden[1]));
    terceros.push(Object.assign({ grupo: letra }, orden[2]));
  }
  terceros.sort((a, b) => _mundialSeedScore(b) - _mundialSeedScore(a));
  const mejoresTerceros = terceros.slice(0, 8);

  const clasificados = primeros.concat(segundos, mejoresTerceros);
  m.bracket = _mundialArmarBracket(clasificados);
  m.fase = "bracket";

  const jugadorClasificado = clasificados.some(t => t.id === m.equipoId);
  let mensaje = null;
  if (typeof figusOtorgarSobres === "function" && !m.premiosEntregados.grupos) {
    m.premiosEntregados.grupos = true;
    if (jugadorClasificado) {
      figusOtorgarSobres(2);
      mensaje = "🎉 ¡Clasificaste a la fase de eliminación! Premio: 2 sobres de figuritas";
    } else {
      figusOtorgarSobres(1);
      mensaje = "Quedaste eliminado en la fase de grupos. Premio consuelo: 1 sobre de figuritas";
    }
  }
  if (!jugadorClasificado) _mundialSimularBracketCompleto(m);
  return mensaje;
}

/* Arma el cuadro de 32: sembrado por puntos/diferencia/goles a favor,
   1º vs 32º ... 16º vs 17º. Heurística simple para evitar que dos
   equipos del mismo grupo se cruquen ya en dieciseisavos (NO reproduce
   el sorteo oficial de bombos de FIFA, es una simplificación). */
function _mundialArmarBracket(clasificados) {
  const orden = clasificados.slice().sort((a, b) => _mundialSeedScore(b) - _mundialSeedScore(a));
  const pares = [];
  for (let i = 0; i < 16; i++) pares.push([orden[i], orden[31 - i]]);

  for (let i = 0; i < pares.length; i++) {
    const [a, b] = pares[i];
    if (a.grupo === b.grupo) {
      for (let j = 0; j < pares.length; j++) {
        if (j === i) continue;
        const [c, d] = pares[j];
        if (c.grupo !== b.grupo && d.grupo !== a.grupo) {
          pares[i][1] = d; pares[j][1] = b;
          break;
        }
      }
    }
  }

  const partidos = pares.map((p, idx) => ({
    id: "r32-" + idx,
    a: p[0].id, b: p[1].id,
    seedA: orden.indexOf(p[0]) + 1, seedB: orden.indexOf(p[1]) + 1,
    ga: null, gb: null, w: null, terminado: false
  }));

  return { ronda: "r32", partidos, historial: [], campeon: null, subcampeon: null, tercero: null, finalizado: false };
}

function _mundialNombreRonda(r) {
  return {
    r32: "Dieciseisavos de Final",
    r16: "Octavos de Final",
    cuartos: "Cuartos de Final",
    semis: "Semifinal",
    final: "Final",
    tercer: "Tercer Puesto"
  }[r] || r;
}

/* ── Registrar resultado del jugador en un cruce de eliminación ── */
function mundialRegistrarResultadoBracket(gano, ptsJ, ptsR, limite) {
  const m = mundialCargar();
  if (!m || m.fase !== "bracket" || !m.bracket || m.bracket.finalizado) return;
  const b = m.bracket;
  const idJ = m.equipoId;
  const partido = b.partidos.find(p => !p.terminado && (p.a === idJ || p.b === idJ));
  if (!partido) return;

  const factor = limite === 15 ? 2 : 1;
  const scoreJ = gano ? 30 : Math.min(29, ptsJ * factor);
  const scoreR = gano ? Math.min(29, ptsR * factor) : 30;
  const esA = partido.a === idJ;

  partido.ga = esA ? scoreJ : scoreR;
  partido.gb = esA ? scoreR : scoreJ;
  partido.w  = gano ? idJ : (esA ? partido.b : partido.a);
  partido.terminado = true;

  // Resto de los cruces de esta ronda: simulados
  b.partidos.forEach(p => {
    if (p.terminado) return;
    const [ga, gb] = _mundialSimularPartido(p.a, p.b);
    p.ga = ga; p.gb = gb; p.w = ga > gb ? p.a : p.b; p.terminado = true;
  });

  const enBuenas = !gano && scoreJ >= 15;
  let sobres = 0;
  if (typeof figusOtorgarSobres === "function") {
    if (gano) sobres = 2;
    else if (enBuenas && Math.random() < 0.5) sobres = 1;
    if (sobres > 0) figusOtorgarSobres(sobres);
  }

  const rivalNom = _mundialEquipo(esA ? partido.b : partido.a)?.nombre || "tu rival";
  let mensajeExtra;
  if (!gano) {
    mensajeExtra = "Quedaste eliminado en " + _mundialNombreRonda(b.ronda) + ".";
    _mundialAvanzarRonda(m);
    _mundialSimularBracketCompleto(m);
  } else {
    mensajeExtra = _mundialAvanzarRonda(m);
  }

  mundialGuardar(m);

  let msg = gano ? "🏆 ¡Avanzaste de ronda venciendo a " + rivalNom + "!" : "Perdiste con " + rivalNom + ".";
  if (typeof showToast === "function") {
    try {
      showToast(msg);
      if (sobres > 0) showToast("✉️ ¡Ganaste " + sobres + " sobre(s) de figuritas! Abrilo desde el álbum 📒");
      if (mensajeExtra) showToast(mensajeExtra, 4500);
    } catch (e) {}
  }
  setTimeout(() => openModal && openModal("mundial-modal"), 1200);
  mundialRenderTodo();
}

/* Avanza el cuadro a la siguiente ronda en base a los ganadores actuales.
   En semis arma también el partido (simulado) por el tercer puesto. */
function _mundialAvanzarRonda(m) {
  const b = m.bracket;
  const ronda = b.ronda;
  if (!b.historial) b.historial = [];

  if (ronda === "final") {
    b.historial.push({ ronda, partidos: b.partidos });
    const f = b.partidos[0];
    b.campeon = f.w;
    b.subcampeon = f.w === f.a ? f.b : f.a;
    b.finalizado = true;
    m.fase = "fin";

    let mensaje = null;
    if (typeof figusOtorgarSobres === "function" && !m.premiosEntregados.final) {
      m.premiosEntregados.final = true;
      if (b.campeon === m.equipoId) {
        figusOtorgarSobres(5, true);
        mensaje = "🏆 ¡CAMPEÓN DEL MUNDIAL! Premio: 5 sobres de figuritas + 1 LEYENDA garantizada";
      } else if (b.subcampeon === m.equipoId) {
        figusOtorgarSobres(3);
        mensaje = "🥈 ¡Subcampeón del Mundial! Premio: 3 sobres de figuritas";
      } else if (b.tercero === m.equipoId) {
        figusOtorgarSobres(2);
        mensaje = "🥉 ¡Tercer puesto en el Mundial! Premio: 2 sobres de figuritas";
      }
    }
    return mensaje;
  }

  b.historial.push({ ronda, partidos: b.partidos });
  const ganadores = b.partidos.map(p => p.w);
  const siguiente = { r32: "r16", r16: "cuartos", cuartos: "semis", semis: "final" }[ronda];

  const nuevosPartidos = [];
  for (let i = 0; i < ganadores.length; i += 2) {
    nuevosPartidos.push({
      id: siguiente + "-" + (i / 2),
      a: ganadores[i], b: ganadores[i + 1],
      ga: null, gb: null, w: null, terminado: false
    });
  }

  if (ronda === "semis") {
    const perdedores = b.partidos.map(p => (p.w === p.a ? p.b : p.a));
    const tp = { id: "tercer-0", a: perdedores[0], b: perdedores[1], ga: null, gb: null, w: null, terminado: false };
    const [ga, gb] = _mundialSimularPartido(tp.a, tp.b);
    tp.ga = ga; tp.gb = gb; tp.w = ga > gb ? tp.a : tp.b; tp.terminado = true;
    m.bracketTercer = { ronda: "tercer", partidos: [tp] };
    b.tercero = tp.w;
  }

  b.ronda = siguiente;
  b.partidos = nuevosPartidos;
  return null;
}

/* Simula todo lo que quede del cuadro (cuando el jugador ya fue eliminado) */
function _mundialSimularBracketCompleto(m) {
  const b = m.bracket;
  if (!b || b.finalizado) return;
  while (!b.finalizado) {
    b.partidos.forEach(p => {
      if (p.terminado) return;
      const [ga, gb] = _mundialSimularPartido(p.a, p.b);
      p.ga = ga; p.gb = gb; p.w = ga > gb ? p.a : p.b; p.terminado = true;
    });
    _mundialAvanzarRonda(m);
  }
}

/* ══════════════════════════════════════════════════════════
   ARMADO / SELECTOR / ARRANQUE DE PARTIDOS
   ══════════════════════════════════════════════════════════ */

/* Selector de selección (una sola liga: LIGA_MUNDIAL2026), reutiliza _crearEqCat */
function _mundialRenderSelector() {
  const cont = document.getElementById("mundial-eq-container");
  if (!cont) return;
  cont.innerHTML = "";

  const sec = _crearEqCat(LIGA_MUNDIAL2026, true, (eq, card) => {
    mundialEquipoSel = eq;
    document.querySelectorAll("#mundial-eq-container .eq-card").forEach(c => c.classList.remove("activo"));
    if (card) card.classList.add("activo");
    const lbl = document.getElementById("mundial-eq-lbl");
    if (lbl) lbl.textContent = "🌍 " + eq.nombre + " — " + eq.sub;
    const btn = document.getElementById("btn-mundial-empezar");
    if (btn) btn.disabled = false;
  });
  cont.appendChild(sec);
}

/* Arranca un Mundial nuevo con la selección elegida */
function mundialEmpezar() {
  if (!mundialEquipoSel) {
    if (typeof showToast === "function") showToast("Elegí tu selección para el Mundial 🌍");
    return;
  }
  const m = mundialNuevo(mundialEquipoSel.id);
  mundialGuardar(m);
  localStorage.removeItem(MUNDIAL_REGLAS_KEY);
  mundialRenderTodo();
  mostrarReglasMundial(true);
}

/* Pone en la mesa la selección del jugador y la del próximo rival
   (fase de grupos o cruce de eliminación pendiente) y arranca el partido */
function mundialJugarSiguiente() {
  const m = mundialCargar();
  if (!m) return;

  let idR = null;
  if (m.fase === "grupos") {
    const g = m.grupos[m.grupoJugador];
    const fixture = g.fixture[g.fecha];
    if (!fixture) return;
    const par = fixture.find(p => g.equipos[p[0]] === m.equipoId || g.equipos[p[1]] === m.equipoId);
    idR = g.equipos[par[0]] === m.equipoId ? g.equipos[par[1]] : g.equipos[par[0]];
  } else if (m.fase === "bracket" && m.bracket) {
    const partido = m.bracket.partidos.find(p => !p.terminado && (p.a === m.equipoId || p.b === m.equipoId));
    if (!partido) return;
    idR = partido.a === m.equipoId ? partido.b : partido.a;
  }
  if (!idR) return;

  modoMundial = true;

  const encJ = buscarEquipo(m.equipoId);
  if (encJ) { equipoSel = encJ.equipo; LIGA = encJ.liga; }
  const encR = buscarEquipo(idR);
  equipoRival = encR ? encR.equipo : _mundialEquipo(idR);

  if (typeof closeModal === "function") { try { closeModal("mundial-modal"); } catch (e) {} }
  if (typeof window.setName === "function") window.setName();
}

/* ── Detección de fin de partido (bus de eventos de juego.js) ── */
function mundialEngancharFinDePartido() {
  if (typeof onJuego !== "function") return;

  onJuego("finDePartido", ({ puntosJugador, puntosRival, limite }) => {
    if (!modoMundial) return;
    if (mundialRegistrado) return;
    mundialRegistrado = true;

    const m = mundialCargar();
    if (!m) { modoMundial = false; return; }

    const gano = puntosJugador >= limite;
    if (m.fase === "grupos")  mundialRegistrarResultadoGrupo(gano, puntosJugador, puntosRival, limite);
    else if (m.fase === "bracket") mundialRegistrarResultadoBracket(gano, puntosJugador, puntosRival, limite);

    modoMundial = false;
  });

  onJuego("nuevoPartido", () => { mundialRegistrado = false; });
}

/* ══════════════════════════════════════════════════════════
   RENDER
   ══════════════════════════════════════════════════════════ */

/* Pantalla principal del Mundial: armado (sin torneo) o estado en curso */
function mundialRenderEstadoScreen() {
  const setup = document.getElementById("mundial-setup");
  const curso = document.getElementById("mundial-en-curso");
  if (!setup || !curso) return;

  const m = mundialCargar();
  if (!m) {
    setup.style.display = "block";
    curso.style.display = "none";
    _mundialRenderSelector();
    return;
  }
  setup.style.display = "none";
  curso.style.display = "block";

  const info = document.getElementById("mundial-info");
  if (!info) return;

  const eqJ = _mundialEquipo(m.equipoId);
  let html = '<div class="mundial-info-linea">🌍 Jugando con: <b>' + eqJ.nombre + '</b>' +
    (m.grupoJugador ? ' (Grupo ' + m.grupoJugador + ')' : '') + '</div>';

  if (m.fase === "grupos") {
    const g = m.grupos[m.grupoJugador];
    const fechaIdx = g.fecha;
    if (fechaIdx < g.fixture.length) {
      const par = g.fixture[fechaIdx].find(p => g.equipos[p[0]] === m.equipoId || g.equipos[p[1]] === m.equipoId);
      const idR = g.equipos[par[0]] === m.equipoId ? g.equipos[par[1]] : g.equipos[par[0]];
      const rival = _mundialEquipo(idR);
      html += '<div class="mundial-proximo">📅 Fase de grupos — Fecha ' + (fechaIdx + 1) + ' de ' + g.fixture.length + '<br>' +
        '<b>' + eqJ.nombre + '</b> vs <b>' + rival.nombre + '</b></div>' +
        '<button class="btn btn-gold" onclick="mundialJugarSiguiente()">⚽ JUGAR PARTIDO</button>';
    }
  } else if (m.fase === "bracket" && m.bracket) {
    const b = m.bracket;
    const partido = b.partidos.find(p => !p.terminado && (p.a === m.equipoId || p.b === m.equipoId));
    if (partido) {
      const idR = partido.a === m.equipoId ? partido.b : partido.a;
      const rival = _mundialEquipo(idR);
      html += '<div class="mundial-proximo">🏆 ' + _mundialNombreRonda(b.ronda) + '<br>' +
        '<b>' + eqJ.nombre + '</b> vs <b>' + rival.nombre + '</b></div>' +
        '<button class="btn btn-gold" onclick="mundialJugarSiguiente()">⚽ JUGAR PARTIDO</button>';
    } else {
      html += '<div class="mundial-fin">Definiendo el resto del cuadro…</div>';
    }
  } else if (m.fase === "fin" && m.bracket) {
    const camp = _mundialEquipo(m.bracket.campeon);
    const esMio = m.bracket.campeon === m.equipoId;
    const nom = (typeof esc === "function") ? esc(camp.nombre) : camp.nombre;
    if (esMio) {
      html += '<div class="mundial-campeon gano">' +
        (typeof _copaConfeti === "function" ? '<div class="copa-confeti-wrap">' + _copaConfeti(28) + '</div>' : '') +
        '<div class="mundial-camp-trofeo">🏆</div>' +
        '<div class="mundial-camp-txt">¡CAMPEÓN DEL MUNDO!</div>' +
        '<div class="mundial-camp-sub">' + nom + '</div></div>';
    } else {
      html += '<div class="mundial-campeon">🏆 Campeón del Mundial: ' + nom + '</div>';
    }
  }

  html += '<button class="btn" onclick="openModal(\'mundial-modal\')">📊 VER GRUPOS Y CUADRO</button>' +
    '<button class="btn btn-out" onclick="mundialResetear()">🔄 NUEVO MUNDIAL</button>';

  info.innerHTML = html;
}

/* Tablas de los 12 grupos */
function mundialRenderGrupos() {
  const cont = document.getElementById("mundial-grupos");
  if (!cont) return;
  const m = mundialCargar();
  if (!m) { cont.innerHTML = '<div class="mundial-vacio">Todavía no armaste el Mundial.</div>'; return; }

  let html = "";
  Object.keys(m.grupos).sort().forEach(letra => {
    const g = m.grupos[letra];
    const orden = _mundialOrdenarGrupo(g);
    const esGrupoJugador = letra === m.grupoJugador;
    html += '<div class="mundial-grupo' + (esGrupoJugador ? " mundial-grupo-mio" : "") + '">' +
      '<div class="fx-num">GRUPO ' + letra + '</div>' +
      '<table class="liga-t"><thead><tr><th>#</th><th class="tl">Selección</th><th>PJ</th><th>PG</th><th>DB</th><th>PP</th><th>GF</th><th>GC</th><th>Pts</th></tr></thead><tbody>';
    orden.forEach((t, i) => {
      const mio = t.id === m.equipoId;
      const pos = i + 1;
      const zona = pos <= 2 ? "z4" : "zd";
      html += '<tr class="' + (mio ? "mio " : "") + zona + '">' +
        "<td>" + pos + "</td>" +
        '<td class="tl"><img src="' + escudoDe(t) + '" class="liga-esc" onerror="escudoFallback(this)">' + t.nombre + (mio ? " ★" : "") + "</td>" +
        "<td>" + t.pj + "</td><td>" + t.pg + "</td><td>" + t.db + "</td><td>" + t.pp + "</td>" +
        "<td>" + t.gf + "</td><td>" + t.gc + "</td><td><b>" + t.pts + "</b></td></tr>";
    });
    html += "</tbody></table></div>";
  });
  cont.innerHTML = html;
}

/* Cuadro de eliminación directa */
function mundialRenderBracket() {
  const cont = document.getElementById("mundial-bracket-cont");
  if (!cont) return;
  const m = mundialCargar();
  if (!m || !m.bracket) {
    cont.innerHTML = '<div class="mundial-vacio">El cuadro de eliminación se arma al cerrar la fase de grupos.</div>';
    return;
  }

  const b = m.bracket;
  const rondas = (b.historial || []).slice();
  rondas.push({ ronda: b.ronda, partidos: b.partidos });

  let html = '<div class="mundial-bracket">';
  rondas.forEach(r => {
    html += '<div class="mb-ronda"><div class="mb-ronda-titulo">' + _mundialNombreRonda(r.ronda) + '</div>';
    r.partidos.forEach(p => { html += _mundialRenderPartidoBracket(p, m.equipoId); });
    html += '</div>';
  });
  if (m.bracketTercer) {
    html += '<div class="mb-ronda"><div class="mb-ronda-titulo">Tercer Puesto</div>';
    m.bracketTercer.partidos.forEach(p => { html += _mundialRenderPartidoBracket(p, m.equipoId); });
    html += '</div>';
  }
  html += '</div>';

  if (b.finalizado) {
    const camp = _mundialEquipo(b.campeon);
    const esMio = b.campeon === m.equipoId;
    html = '<div class="mundial-campeon">🏆 CAMPEÓN: ' + camp.nombre +
      (esMio ? " — ¡CAMPEÓN DEL MUNDO!" : "") + '</div>' + html;
  }

  cont.innerHTML = html;
}

function _mundialRenderPartidoBracket(p, idJ) {
  const eqA = _mundialEquipo(p.a), eqB = _mundialEquipo(p.b);
  const mio = p.a === idJ || p.b === idJ;
  let claseA = "", claseB = "", marcador = "vs";
  if (p.terminado) {
    if (p.w === p.a) { claseA = "fx-gano"; claseB = "fx-perdio"; }
    else             { claseB = "fx-gano"; claseA = "fx-perdio"; }
    marcador = p.ga + " – " + p.gb;
  }
  return '<div class="mb-partido' + (mio ? " mio" : "") + '">' +
    '<div class="mb-jugador ' + claseA + '"><img src="' + escudoDe(eqA) + '" class="liga-esc" onerror="escudoFallback(this)">' + eqA.nombre + '</div>' +
    '<div class="fx-marcador">' + marcador + '</div>' +
    '<div class="mb-jugador ' + claseB + '"><img src="' + escudoDe(eqB) + '" class="liga-esc" onerror="escudoFallback(this)">' + eqB.nombre + '</div>' +
  '</div>';
}

/* Tabs del modal (Grupos / Eliminación) */
function mundialSetTab(tab) {
  const grupos  = document.getElementById("mundial-tab-grupos");
  const bracket = document.getElementById("mundial-tab-bracket");
  const btnG = document.getElementById("mundial-btn-grupos");
  const btnB = document.getElementById("mundial-btn-bracket");
  if (!grupos || !bracket) return;
  const esGrupos = tab === "grupos";
  grupos.style.display  = esGrupos ? "block" : "none";
  bracket.style.display = esGrupos ? "none"  : "block";
  if (btnG) btnG.classList.toggle("active", esGrupos);
  if (btnB) btnB.classList.toggle("active", !esGrupos);
  if (!esGrupos) mundialRenderBracket();
}

function mundialRenderTodo() {
  mundialRenderEstadoScreen();
  mundialRenderGrupos();
  mundialRenderBracket();
}

/* ── Reglas del Mundial: se muestran al arrancar cada torneo ── */
function mostrarReglasMundial(forzar) {
  if (!forzar && localStorage.getItem(MUNDIAL_REGLAS_KEY)) return;
  lsSet(MUNDIAL_REGLAS_KEY, "1");
  if (typeof openModal === "function") {
    try { openModal("mundial-reglas-modal"); } catch (e) {}
  }
}

/* ── Inicio ── */
document.addEventListener("DOMContentLoaded", () => {
  mundialRenderTodo();
  mundialEngancharFinDePartido();
});
