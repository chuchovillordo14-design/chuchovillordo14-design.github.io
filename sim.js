/* ══════════════════════════════════════════════════════════
   SIM — Núcleo de simulación deportiva (TRUCO GOL)
   Lógica pura y compartida por liga.js, mundial.js, torneo.js y
   club.js: decidir un partido por "fuerza", traducir el margen de
   truco a un marcador de fútbol, y armar fixtures/tablas.
   Antes esto estaba duplicado en cada módulo (y club.js dependía
   de funciones que vivían en liga.js). Ahora hay una sola fuente.
   ══════════════════════════════════════════════════════════ */
const SIM = (function () {

  /* Probabilidad de que A le gane a B según su fuerza.
     Se elevan al cuadrado para que la diferencia se note, pero se
     acota a 0.12..0.88 para que el batacazo siempre sea posible. */
  function probGana(fA, fB) {
    fA = fA || 60; fB = fB || 60;
    const wA = fA * fA, wB = fB * fB;
    const p = wA / (wA + wB || 1);
    return Math.max(0.12, Math.min(0.88, p));
  }

  /* Marcador (puntos de truco 0-29) del PERDEDOR según lo parejo del
     cruce: parejo → peleado (llega a las buenas), paliza → goleada.
     pA = probabilidad con la que ganó el favorito. */
  function scorePerdedor(pA) {
    const paridad = 1 - Math.min(1, Math.abs(pA - 0.5) * 2);
    // ⚠️ Recalibrada el 8 ago 2026. Con `4 + paridad*22` y ruido ±5 el
    // perdedor simulado llegaba a los 15 puntos —el umbral de "derrota en las
    // buenas"— el 95,3% de las veces: la excepción era la regla. Dos daños
    // medidos sobre 500 temporadas de la Liga Profesional:
    //   · la tabla dejaba de separar (campeón 52 pts, último 29,7 de 63), y
    //     un equipo que perdía TODO igual juntaba ~20;
    //   · y perjudicaba al JUGADOR, que es el único que no pasa por acá: con
    //     la MISMA tasa de victorias hacía 36,7 pts contra 42,1 de la máquina,
    //     porque él llega a las buenas ~50% de sus derrotas y la CPU 95%.
    // Los números de abajo dejan ese 50% (medido: 52,4%), que es la paridad
    // que importa, con una distribución pareja de goleadas a partidos
    // peleados. Se mantiene el sentido: parejo → el perdedor llega más lejos.
    const centro  = 2 + paridad * 16;          // ~2 goleada .. ~18 peleado
    const ruido   = (Math.random() - 0.5) * 16;
    return Math.max(0, Math.min(29, Math.round(centro + ruido)));
  }

  /* Traduce el margen de truco a un marcador "de fútbol".
     L = puntos de truco del PERDEDOR (0-29, el ganador hizo 30).
     Goleada (L bajo) → 5-0 · peleado (L alto) → 1-0.
     Devuelve [golesGanador, golesPerdedor].

     ⚠️ Reescrita el 7 ago 2026. La fórmula anterior era NO MONÓTONA y
     contradecía su propio comentario: por el piso `gG = max(gP+1, …)`, un
     30-29 —el partido más peleado posible— terminaba **4-3**, más goles que
     un 30-20. Y como `gP` solo crecía, el marcador mínimo era 3-1: en todo
     el juego existían apenas 6 resultados y NUNCA salía un 1-0, un 2-0 ni
     un 2-1, que son los marcadores más futboleros de todos.
     Ahora la DIFERENCIA de gol crece de forma monótona con el margen de
     truco, que es lo que la tabla usa para desempatar. */
  function golesFutbol(L) {
    L = Math.max(0, Math.min(29, Math.round(Number(L) || 0)));
    if (L >= 26) return [1, 0];   // 30-29 .. 30-26 · un gol y a cuidarlo
    if (L >= 21) return [2, 1];
    if (L >= 16) return [3, 2];   // el clásico peleado
    if (L >= 11) return [3, 1];
    if (L >= 6)  return [4, 1];
    if (L >= 3)  return [4, 0];
    return [5, 0];                // paliza
  }

  /* Simula un partido completo entre dos fuerzas. Devuelve
     { ganaA, ga, gb } con marcador de fútbol orientado a A/B. */
  function partido(fA, fB) {
    const pA = probGana(fA, fB);
    const ganaA = Math.random() < pA;
    const perd = scorePerdedor(ganaA ? pA : 1 - pA);
    const [gG, gP] = golesFutbol(perd);
    // `perd` y `db` viajan para que quien arme una tabla pueda dar el punto de
    // "derrota en las buenas": del marcador de fútbol solo no se deduce (el
    // umbral de 15 cae dentro de una banda de goles, no en su borde).
    const db = perd >= 15;
    return ganaA ? { ganaA, ga: gG, gb: gP, perd, db }
                 : { ganaA, ga: gP, gb: gG, perd, db };
  }

  /* Round-robin (método del círculo). Devuelve fechas de pares [a,b]. */
  function roundRobin(ids) {
    const a = ids.slice();
    if (a.length % 2 !== 0) a.push("__bye__");
    const n = a.length, fechas = [];
    for (let r = 0; r < n - 1; r++) {
      const pares = [];
      for (let i = 0; i < n / 2; i++) {
        const x = a[i], y = a[n - 1 - i];
        if (x !== "__bye__" && y !== "__bye__") pares.push([x, y]);
      }
      fechas.push(pares);
      a.splice(1, 0, a.pop()); // rota dejando fijo a[0]
    }
    return fechas;
  }

  /* Tabla vacía indexada por id.
     `db` = derrotas "en las buenas" (el perdedor pasó la mitad del tanteador
     y rescata 1 punto). La tabla del Torneo de Liga siempre tuvo esa columna;
     la de la Carrera no, y por eso perder 30-28 pagaba 1 punto en un modo y 0
     en el otro con la MISMA regla anunciada en el modal de reglas. */
  function tablaInit(ids) {
    const t = {};
    ids.forEach(id => t[id] = { pj:0, pg:0, pp:0, db:0, pts:0, gf:0, gc:0 });
    return t;
  }

  /* Aplica un resultado a la tabla (sin empates: gana quien hizo más). */
  /* `dbPerdedor` (opcional): el que perdió llegó a las buenas y suma 1. */
  function aplicarResultado(tabla, a, b, ga, gb, dbPerdedor) {
    if (!tabla[a] || !tabla[b]) return;
    tabla[a].pj++; tabla[b].pj++;
    tabla[a].gf += ga; tabla[a].gc += gb;
    tabla[b].gf += gb; tabla[b].gc += ga;
    if (dbPerdedor && ga !== gb) {
      const perd = ga > gb ? b : a;
      tabla[perd].db = (tabla[perd].db || 0) + 1;
      tabla[perd].pts += 1;
    }
    // En el truco no hay empate, así que golesFutbol() nunca devuelve uno.
    // Pero `ga >= gb` le daba la victoria al LOCAL si algún día llegaba un
    // empate por otra vía (goles armados a mano): un empate no es una
    // victoria de nadie. Se reparte 1 punto a cada uno, que es la lectura
    // futbolera y no inventa un ganador.
    if (ga > gb)      { tabla[a].pg++; tabla[a].pts += 3; tabla[b].pp++; }
    else if (gb > ga) { tabla[b].pg++; tabla[b].pts += 3; tabla[a].pp++; }
    else              { tabla[a].pts += 1; tabla[b].pts += 1; }
  }

  /* Ordena una tabla: PTS, diferencia de gol, GF, id (estable).
     El último criterio compara los ids SIN los guiones bajos del
     principio: "__club__" (el club del jugador) empieza con `_` (ASCII
     95, menor que cualquier minúscula) y ganaba TODOS los empates
     totales contra cualquier rival — medido en las auditorías del 8 ago.
     Sin los `_` compara como "club..." y cae donde le toca, igual de
     determinístico. */
  function ordenarTabla(tabla) {
    const clave = id => String(id).replace(/^_+/, "");
    return Object.keys(tabla).map(id => Object.assign({ id }, tabla[id]))
      .sort((x, y) =>
        y.pts - x.pts ||
        (y.gf - y.gc) - (x.gf - x.gc) ||
        y.gf - x.gf ||
        (clave(x.id) < clave(y.id) ? -1 : 1));
  }

  return { probGana, scorePerdedor, golesFutbol, partido, roundRobin, tablaInit, aplicarResultado, ordenarTabla };
})();

if (typeof module !== "undefined" && module.exports) module.exports = SIM;
