// ══════════════════════════════════════════════════════════════
// REGLAS_TRUCO.JS — reglas puras COMPARTIDAS entre los dos motores
// (juego.js 1v1 y juego2v2.js). Nace de la auditoría 2v2 del
// 2026-07-29: la cuenta de la falta, los valores de los cantos y
// las cadenas de suba habían derivado entre motores porque cada
// uno tenía su copia. Todo lo que entre acá se arregla UNA vez.
//
// Solo funciones puras y constantes: nada de estado, DOM ni red.
// Se carga ANTES de juego.js / juego2v2.js (ver index.html).
// ══════════════════════════════════════════════════════════════

// Puntos que suma cada canto de envido a la apuesta acumulada.
const REGLAS_PTS_ENVIDO = { envido: 2, real: 3 };

// Falta envido tradicional "por las malas y por las buenas":
// en un partido a 30, los primeros 15 son las MALAS. Si el líder
// todavía está en las malas, la falta se cuenta hasta terminar las
// malas (15 − sus puntos); si ya entró en las buenas, hasta el final.
// En partido chico (a 15) no hay división. También alimenta la
// CONTRAFLOR AL RESTO en los dos motores.
function reglasFaltaEnvido(lider, limite) {
  if (limite >= 30) {
    const mitad = Math.floor(limite / 2); // 15 en partido a 30
    if (lider < mitad) return Math.max(1, mitad - lider); // por las malas
  }
  return Math.max(1, limite - lider);                     // por las buenas
}

// Subas legales sobre una cadena de envido en curso (para el que responde):
// envido → envido (1 vez más) / real / falta · real → falta · falta → nada.
function reglasEnvidoRaises(cadena) {
  const ult = cadena[cadena.length - 1];
  if (ult === "falta") return [];
  const dobleEnvido = cadena.filter(x => x === "envido").length >= 2;
  const tieneReal = cadena.includes("real");
  const opts = [];
  if (ult === "envido" && !dobleEnvido) opts.push("envido");
  if (!tieneReal) opts.push("real");
  opts.push("falta");
  return opts;
}

// Escaladas legales de flor para el que responde.
function reglasFlorRaises(cadena) {
  const ult = cadena[cadena.length - 1];
  if (ult === "contraflorresto") return [];
  if (ult === "contraflor") return ["contraflorresto"];
  return ["contraflor", "contraflorresto"]; // sobre la flor base
}

if (typeof window !== "undefined") {
  window.REGLAS_PTS_ENVIDO = REGLAS_PTS_ENVIDO;
  window.reglasFaltaEnvido = reglasFaltaEnvido;
  window.reglasEnvidoRaises = reglasEnvidoRaises;
  window.reglasFlorRaises = reglasFlorRaises;
}
