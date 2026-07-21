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
    const centro  = 4 + paridad * 22;          // ~4 goleada .. ~26 peleado
    const ruido   = (Math.random() - 0.5) * 10;
    return Math.max(0, Math.min(29, Math.round(centro + ruido)));
  }

  /* Traduce el margen de truco a un marcador "de fútbol".
     L = puntos de truco del PERDEDOR (0-29, el ganador hizo 30).
     Goleada (L bajo) → 4-0/5-1 · peleado (L alto) → 2-1/3-2.
     Devuelve [golesGanador, golesPerdedor]. */
  function golesFutbol(L) {
    L = Math.max(0, Math.min(29, L | 0));
    const margen = 30 - L;
    let gP = L >= 15 ? 1 + Math.round((L - 15) / 7) : (L >= 7 ? 1 : 0);
    let gG = Math.max(gP + 1, 1 + Math.round(margen / 8));
    gG = Math.min(gG, 6);
    gP = Math.min(gP, gG - 1);
    return [gG, gP];
  }

  /* Simula un partido completo entre dos fuerzas. Devuelve
     { ganaA, ga, gb } con marcador de fútbol orientado a A/B. */
  function partido(fA, fB) {
    const pA = probGana(fA, fB);
    const ganaA = Math.random() < pA;
    const perd = scorePerdedor(ganaA ? pA : 1 - pA);
    const [gG, gP] = golesFutbol(perd);
    return ganaA ? { ganaA, ga: gG, gb: gP } : { ganaA, ga: gP, gb: gG };
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

  /* Tabla vacía indexada por id. */
  function tablaInit(ids) {
    const t = {};
    ids.forEach(id => t[id] = { pj:0, pg:0, pp:0, pts:0, gf:0, gc:0 });
    return t;
  }

  /* Aplica un resultado a la tabla (sin empates: gana quien hizo más). */
  function aplicarResultado(tabla, a, b, ga, gb) {
    if (!tabla[a] || !tabla[b]) return;
    tabla[a].pj++; tabla[b].pj++;
    tabla[a].gf += ga; tabla[a].gc += gb;
    tabla[b].gf += gb; tabla[b].gc += ga;
    if (ga >= gb) { tabla[a].pg++; tabla[a].pts += 3; tabla[b].pp++; }
    else          { tabla[b].pg++; tabla[b].pts += 3; tabla[a].pp++; }
  }

  /* Ordena una tabla: PTS, diferencia de gol, GF, id (estable). */
  function ordenarTabla(tabla) {
    return Object.keys(tabla).map(id => Object.assign({ id }, tabla[id]))
      .sort((x, y) =>
        y.pts - x.pts ||
        (y.gf - y.gc) - (x.gf - x.gc) ||
        y.gf - x.gf ||
        (x.id < y.id ? -1 : 1));
  }

  return { probGana, scorePerdedor, golesFutbol, partido, roundRobin, tablaInit, aplicarResultado, ordenarTabla };
})();

if (typeof module !== "undefined" && module.exports) module.exports = SIM;
