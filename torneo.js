/* ══════════════════════════════════════════════════════════
   MOTOR DE TORNEO DE CLUBES (reutilizable) — TRUCO GOL
   Lógica pura (sin DOM). Lo usan la Copa Libertadores, la
   Champions y el Mundial de Clubes. Estructura: fase de grupos
   (todos contra todos) + llave de eliminación directa.
   Los partidos del jugador se juegan en la mesa; el resto se
   simulan por "fuerza" del equipo + algo de azar.
   ══════════════════════════════════════════════════════════ */

const TORNEO = (function () {

  // Mezcla (usa la del juego si está; si no, Fisher-Yates propio)
  function _mezclar(arr) {
    if (typeof mezclarMazo === "function") return mezclarMazo(arr);
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  const LETRAS = "ABCDEFGH";

  /* Crea el torneo: reparte los equipos en grupos y arma el fixture
     (todos contra todos dentro de cada grupo). */
  function crear(config) {
    const equipos = config.equipos.slice();
    const numGrupos = config.numGrupos || 2;
    const porGrupo  = config.clasificanPorGrupo || 2;

    const mezclados = _mezclar(equipos);
    const grupos = [];
    for (let g = 0; g < numGrupos; g++) grupos.push({ nombre: LETRAS[g], equipos: [], partidos: [] });
    mezclados.forEach((eq, i) => grupos[i % numGrupos].equipos.push(eq.id));

    grupos.forEach(gr => {
      const ids = gr.equipos;
      for (let i = 0; i < ids.length; i++)
        for (let j = i + 1; j < ids.length; j++)
          gr.partidos.push({ a: ids[i], b: ids[j], ganador: null });
    });

    return {
      id: config.id, nombre: config.nombre,
      fase: "grupos",
      clasificanPorGrupo: porGrupo,
      grupos,
      // mapa id -> equipo (para fuerza/nombre/escudo)
      mapa: equipos.reduce((m, e) => (m[e.id] = e, m), {}),
      bracket: null,
      campeon: null,
    };
  }

  /* Probabilidad de que gane A según la fuerza (con piso de azar). */
  function _probA(fa, fb) {
    fa = fa || 50; fb = fb || 50;
    return 0.15 + 0.7 * (fa / (fa + fb)); // 0.15..0.85
  }
  function simularPartido(estado, idA, idB) {
    const fa = (estado.mapa[idA] || {}).fuerza, fb = (estado.mapa[idB] || {}).fuerza;
    return (Math.random() < _probA(fa, fb)) ? idA : idB;
  }

  /* Tabla de un grupo, ordenada: PTS, PG, fuerza, (estable por id). */
  function tablaGrupo(estado, gIdx) {
    const gr = estado.grupos[gIdx];
    const st = {};
    gr.equipos.forEach(id => st[id] = { id, pj: 0, pg: 0, pp: 0, pts: 0 });
    gr.partidos.forEach(p => {
      if (!p.ganador) return;
      const perd = p.ganador === p.a ? p.b : p.a;
      st[p.ganador].pj++; st[p.ganador].pg++; st[p.ganador].pts += 3;
      st[perd].pj++; st[perd].pp++;
    });
    return Object.values(st).sort((x, y) =>
      y.pts - x.pts || y.pg - x.pg ||
      ((estado.mapa[y.id] || {}).fuerza || 0) - ((estado.mapa[x.id] || {}).fuerza || 0) ||
      (x.id < y.id ? -1 : 1)
    );
  }

  /* Registra el ganador de un partido de grupos. */
  function registrarGrupo(estado, gIdx, idxPartido, ganadorId) {
    const p = estado.grupos[gIdx].partidos[idxPartido];
    if (p && !p.ganador) p.ganador = ganadorId;
  }

  /* Simula todos los partidos de grupo pendientes que NO involucran al
     equipo del jugador (esos se juegan en la mesa). */
  function simularPendientesGrupo(estado, idJugador) {
    estado.grupos.forEach(gr => gr.partidos.forEach(p => {
      if (p.ganador) return;
      if (p.a === idJugador || p.b === idJugador) return;
      p.ganador = simularPartido(estado, p.a, p.b);
    }));
  }

  function gruposCompletos(estado) {
    return estado.grupos.every(gr => gr.partidos.every(p => !!p.ganador));
  }

  /* Clasificados: los primeros N de cada grupo. */
  function clasificados(estado) {
    const out = [];
    estado.grupos.forEach((gr, gi) => {
      const tabla = tablaGrupo(estado, gi);
      for (let i = 0; i < estado.clasificanPorGrupo && i < tabla.length; i++)
        out.push({ id: tabla[i].id, grupo: gi, pos: i });
    });
    return out;
  }

  /* Arma la llave cruzando 1º de un grupo vs 2º de otro (siembra clásica). */
  function armarBracket(estado) {
    const clas = clasificados(estado);
    const primeros = clas.filter(c => c.pos === 0);
    const segundos = clas.filter(c => c.pos === 1);
    // Cruce: 1ºA-2ºB, 1ºB-2ºA, ... (rotando los segundos)
    const cruces = [];
    primeros.forEach((p, i) => {
      const seg = segundos[(i + 1) % segundos.length] || segundos[i];
      cruces.push({ a: p.id, b: seg ? seg.id : null, ganador: null });
    });
    estado.bracket = { rondas: [cruces] };
    estado.fase = "bracket";
    return estado;
  }

  function rondaActualBracket(estado) {
    if (!estado.bracket) return null;
    return estado.bracket.rondas[estado.bracket.rondas.length - 1];
  }

  /* Registra el ganador de un cruce de la ronda actual. */
  function registrarBracket(estado, idxCruce, ganadorId) {
    const ronda = rondaActualBracket(estado);
    if (ronda && ronda[idxCruce] && !ronda[idxCruce].ganador) ronda[idxCruce].ganador = ganadorId;
  }

  /* Simula los cruces pendientes de la ronda actual que no son del jugador. */
  function simularPendientesBracket(estado, idJugador) {
    const ronda = rondaActualBracket(estado);
    if (!ronda) return;
    ronda.forEach(c => {
      if (c.ganador || !c.b) return;
      if (c.a === idJugador || c.b === idJugador) return;
      c.ganador = simularPartido(estado, c.a, c.b);
    });
  }

  function rondaCompleta(estado) {
    const ronda = rondaActualBracket(estado);
    return !!ronda && ronda.every(c => !!c.ganador || !c.b);
  }

  /* Avanza a la próxima ronda con los ganadores. Si queda 1, es campeón. */
  function avanzarBracket(estado) {
    const ronda = rondaActualBracket(estado);
    if (!ronda || !rondaCompleta(estado)) return estado;
    const ganadores = ronda.map(c => c.ganador || c.a).filter(Boolean);
    if (ganadores.length <= 1) {
      estado.campeon = ganadores[0] || null;
      estado.fase = "fin";
      return estado;
    }
    const nueva = [];
    for (let i = 0; i < ganadores.length; i += 2)
      nueva.push({ a: ganadores[i], b: ganadores[i + 1] || null, ganador: null });
    estado.bracket.rondas.push(nueva);
    return estado;
  }

  return {
    crear, simularPartido, tablaGrupo, registrarGrupo, simularPendientesGrupo,
    gruposCompletos, clasificados, armarBracket, rondaActualBracket,
    registrarBracket, simularPendientesBracket, rondaCompleta, avanzarBracket,
  };
})();

if (typeof module !== "undefined" && module.exports) module.exports = TORNEO;
