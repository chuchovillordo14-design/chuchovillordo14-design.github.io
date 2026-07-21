// ══════════════════════════════════════════════════════════════
// JUEGO2V2.JS — Motor de Truco de a PARES (2 vs 2) — Fase 1 (offline)
//
// Motor NUEVO y separado: no toca juego.js (que es 1v1 y anda). Reusa
// solo los datos puros de cartas.js: el mapa C (con .f = fuerza) y el
// mazo Object.keys(C).
//
// Modelo:
//   4 jugadores en asientos 0,1,2,3. Equipos alternados por asiento:
//     NOSOTROS = asientos 0 y 2   ·   ELLOS = asientos 1 y 3
//   El asiento 0 es el humano (esBot=false); el resto IA.
//   Se juega en RONDA a la derecha: 0 → 1 → 2 → 3.
//
// Alcance: reparto, 3 bazas, resolución por equipo, truco (2/3/4),
// envido con cadena real/falta, flor con contraflor/contraflor al resto
// (automática al repartir), y "el envido está primero" sobre un truco
// pendiente. Cualquiera de los dos compañeros de un equipo puede
// responder sus cantos (no hay un "capitán" fijo).
// Headless + testeable: simular2v2(n) juega n partidas full con bots.
// ══════════════════════════════════════════════════════════════

const EQ2 = { NOS: "nos", ELLOS: "ellos" };
function _equipoDe(asiento) { return (asiento % 2 === 0) ? EQ2.NOS : EQ2.ELLOS; }
function _rival2(eq) { return eq === EQ2.NOS ? EQ2.ELLOS : EQ2.NOS; }

// Estado global del partido 2v2 (singleton, como S en 1v1).
const S2 = {
  jugadores: [],          // [{id, nombre, equipo, mano:[cartaId..], esBot}]
  puntos: { nos: 0, ellos: 0 },
  limite: 30,
  manoAsiento: 0,         // quién es "mano" en esta repartida
  turno: 0,               // asiento que debe jugar
  ronda: 0,               // baza actual 0..2
  jugadasBaza: [],        // [{asiento, carta}] de la baza en curso
  liderBaza: 0,           // asiento que abre la baza actual
  bazas: [],              // 'nos'|'ellos'|'parda' por baza cerrada
  // truco
  nivelTruco: 1,          // 1=sin cantar, 2=truco, 3=retruco, 4=vale4
  trucoEquipoCanto: null, // equipo que cantó el nivel pendiente
  trucoAceptado: false,
  cantoPendiente: null,   // 'truco' | 'envido' | null (espera respuesta)
  trucoDiferido: false,   // "el envido está primero": truco en pausa
  trucoDiferidoDe: null,  // equipo que había cantado el truco diferido
  // envido / flor
  envidoResuelto: false,
  florActiva: false,
  florResuelta: false,
  // control
  terminado: false,
  ganadorPartido: null,
  _log: [],
};

function _log2(msg) { S2._log.push(msg); if (S2._log.length > 200) S2._log.shift(); }

// Termina el partido apenas un equipo llega al límite (regla real: ganás
// al tocar 30, incluso a mitad de mano por el envido). Devuelve true si
// se terminó.
function _chequearFin2v2() {
  if (S2.terminado) return true;
  if (S2.puntos.nos >= S2.limite || S2.puntos.ellos >= S2.limite) {
    S2.terminado = true;
    S2.ganadorPartido = S2.puntos.nos >= S2.limite ? EQ2.NOS : EQ2.ELLOS;
    _log2(`🏆 PARTIDO para ${S2.ganadorPartido}`);
    return true;
  }
  return false;
}

// ─────────────────────────────────────────────────────────────
// INICIO / REPARTO
// ─────────────────────────────────────────────────────────────
function nuevo2v2(opts) {
  opts = opts || {};
  const nombres = opts.nombres || ["Vos", "Rival 1", "Compañero", "Rival 2"];
  const todosBot = !!opts.todosBot; // para simulación
  S2.jugadores = [0, 1, 2, 3].map(i => ({
    id: i, nombre: nombres[i], equipo: _equipoDe(i), mano: [],
    esBot: todosBot ? true : (i !== 0),
  }));
  S2.puntos = { nos: 0, ellos: 0 };
  S2.limite = opts.limite || 30;
  S2.manoAsiento = (typeof opts.manoInicial === "number") ? opts.manoInicial : 0;
  S2.terminado = false;
  S2.ganadorPartido = null;
  S2._log = [];
  _repartir2v2();
}

function _mazoMezclado() {
  const mazo = Object.keys(C);
  for (let i = mazo.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [mazo[i], mazo[j]] = [mazo[j], mazo[i]];
  }
  return mazo;
}

function _repartir2v2() {
  const mazo = _mazoMezclado();
  S2.jugadores.forEach((j, k) => { j.mano = [mazo[k], mazo[k + 4], mazo[k + 8]]; });
  S2.ronda = 0;
  S2.jugadasBaza = [];
  S2.bazas = [];
  S2.liderBaza = S2.manoAsiento;
  S2.turno = S2.manoAsiento;
  S2.nivelTruco = 1;
  S2.trucoEquipoCanto = null;
  S2.trucoAceptado = false;
  S2.canto = null;
  S2._trucoRechazado = false;
  S2.trucoDiferido = false;
  S2.trucoDiferidoDe = null;
  S2.envidoResuelto = false;   // true una vez jugado el envido (o anulado por flor)
  S2.florActiva = false;       // hubo flor en esta mano
  _resolverFlor2v2();          // la flor se canta/cobra al repartir (v1: automática)
  _log2(`── Nueva repartida. Mano: asiento ${S2.manoAsiento} (${_equipoDe(S2.manoAsiento)}) ──`);
}

// ─────────────────────────────────────────────────────────────
// FLOR (v1: automática — se canta y cobra al repartir)
// ─────────────────────────────────────────────────────────────
// Puntos de flor de un asiento (20 + suma de los tres) o null si no tiene.
function _florPts2v2(asiento) {
  const cs = S2.jugadores[asiento].mano.filter(Boolean).map(x => C[x]);
  if (cs.length < 3) return null;
  const palos = {};
  cs.forEach(c => { palos[c.p] = (palos[c.p] || 0) + 1; });
  if (!Object.values(palos).some(n => n >= 3)) return null; // no son 3 del mismo palo
  return cs.reduce((s, c) => s + (c.n >= 10 ? 0 : c.n), 20);
}
function _florEquipo2v2(eq) {
  return S2.jugadores.filter(j => j.equipo === eq)
    .reduce((mx, j) => { const f = _florPts2v2(j.id); return f !== null ? Math.max(mx, f) : mx; }, null);
}
// Al repartir: si NADIE tiene flor no pasa nada; si UNA sola pareja tiene,
// cobra +3 automático (no hay con quién negociar); si LAS DOS tienen, se abre
// la negociación interactiva de contraflor (canto pendiente tipo 'flor').
function _resolverFlor2v2() {
  const fNos = _florEquipo2v2(EQ2.NOS), fEllos = _florEquipo2v2(EQ2.ELLOS);
  S2.florActiva = (fNos !== null || fEllos !== null);
  S2.florResuelta = !S2.florActiva;
  if (!S2.florActiva) return;
  S2.envidoResuelto = true; // la flor anula el envido
  if (fNos !== null && fEllos === null) { S2.puntos.nos += 3; _log2(`FLOR nos (${fNos}) → +3`); S2.florResuelta = true; _chequearFin2v2(); return; }
  if (fEllos !== null && fNos === null) { S2.puntos.ellos += 3; _log2(`FLOR ellos (${fEllos}) → +3`); S2.florResuelta = true; _chequearFin2v2(); return; }
  // Ambas tienen flor → contraflor. Declara la pareja de la mano; responde la otra.
  _cantarFlor2v2(_equipoDe(S2.manoAsiento), "flor");
}

// Escaladas de flor disponibles para el que responde.
const _FLOR_NOMBRE = { flor: "FLOR", contraflor: "CONTRAFLOR", contraflorresto: "CONTRAFLOR AL RESTO" };
function _florRaises2v2(cadena) {
  const ult = cadena[cadena.length - 1];
  if (ult === "contraflorresto") return [];
  if (ult === "contraflor") return ["contraflorresto"];
  return ["contraflor", "contraflorresto"]; // sobre la flor base
}

// Canta/escala la flor. enJuego = puntos si se comparan las flores; noQuiero =
// lo que cobra el que escaló si el otro se achica.
function _cantarFlor2v2(equipoCanto, tipo) {
  const prev = (S2.canto && S2.canto.tipo === "flor") ? S2.canto : null;
  const cadena = prev ? prev.cadena.concat(tipo) : [tipo];
  let enJuego, noQuiero;
  if (tipo === "flor")             { enJuego = 3; noQuiero = 3; }
  else if (tipo === "contraflor")  { enJuego = 6; noQuiero = prev ? prev.enJuego : 3; }
  else                             { enJuego = _faltaPts2v2(); noQuiero = prev ? prev.enJuego : 6; }
  S2.canto = { tipo: "flor", cadena, enJuego, noQuiero, equipoCanto, equipoResponde: _rival2(equipoCanto) };
  _log2(`${equipoCanto} canta ${_FLOR_NOMBRE[tipo]}`);
}

// Respuesta a la flor: 'quiero' | 'no' | 'contraflor' | 'contraflorresto'.
function _responderFlor2v2(resp) {
  const c = S2.canto;
  if (!c || c.tipo !== "flor") return;
  // "No quiero" solo tiene sentido si hay una escalada (contraflor+) que rechazar.
  if (resp === "no" && c.cadena.length > 1) {
    S2.puntos[c.equipoCanto] += c.noQuiero;
    _log2(`Contraflor NO querida → +${c.noQuiero} ${c.equipoCanto}`);
    S2.florResuelta = true; S2.canto = null; _chequearFin2v2();
    return;
  }
  if (resp === "contraflor" || resp === "contraflorresto") { _cantarFlor2v2(c.equipoResponde, resp); return; }
  // quiero (o "no" sobre la flor base = igual se comparan): gana la flor más alta.
  const fNos = _florEquipo2v2(EQ2.NOS), fEllos = _florEquipo2v2(EQ2.ELLOS);
  const g = fNos > fEllos ? EQ2.NOS : fEllos > fNos ? EQ2.ELLOS : _equipoDe(S2.manoAsiento);
  S2.puntos[g] += c.enJuego;
  _log2(`Flor: nos ${fNos} vs ellos ${fEllos} → +${c.enJuego} ${g}`);
  S2.florResuelta = true; S2.canto = null; _chequearFin2v2();
}

// El bot responde a un canto de flor de su equipo.
function _botResponderFlor2v2() {
  const c = S2.canto;
  const miFlor = _florEquipo2v2(c.equipoResponde) || 0;
  const suFlor = _florEquipo2v2(c.equipoCanto) || 0;
  const raises = _florRaises2v2(c.cadena);
  const puedeNo = c.cadena.length > 1;
  if (miFlor >= 33 && raises.length) { _responderFlor2v2(raises[0]); return; }        // flor tope → escala
  if (miFlor >= 29 && raises.includes("contraflor") && Math.random() < 0.4) { _responderFlor2v2("contraflor"); return; }
  if (puedeNo && miFlor < suFlor - 3 && Math.random() < 0.6) { _responderFlor2v2("no"); return; } // me achico
  _responderFlor2v2("quiero");                                                          // comparo
}

// ─────────────────────────────────────────────────────────────
// ENVIDO — cadena completa: envido / envido-envido / real / falta
// ─────────────────────────────────────────────────────────────
function _tantos2v2(asiento) {
  const mano = S2.jugadores[asiento].mano;
  if (typeof calcularEnvido === "function") return calcularEnvido(mano);
  // fallback autónomo (mismo algoritmo que cartas.js)
  const cs = mano.filter(Boolean).map(x => C[x]);
  const porPalo = {};
  cs.forEach(c => { (porPalo[c.p] = porPalo[c.p] || []).push(c.n >= 10 ? 0 : c.n); });
  let best = 0;
  for (const p in porPalo) {
    const v = porPalo[p].sort((a, b) => b - a);
    best = Math.max(best, v.length >= 2 ? 20 + v[0] + v[1] : v[0]);
  }
  return best;
}

// Mejor tanto de un equipo (el máximo de sus dos jugadores).
function _tantosEquipo(eq) {
  return S2.jugadores.filter(j => j.equipo === eq)
    .reduce((mx, j) => Math.max(mx, _tantos2v2(j.id)), 0);
}

// Nombres y "puntos que faltan" para la falta envido.
const _ENV_NOMBRE = { envido: "ENVIDO", real: "REAL ENVIDO", falta: "FALTA ENVIDO" };
function _faltaPts2v2() { return Math.max(1, S2.limite - Math.max(S2.puntos.nos, S2.puntos.ellos)); }

// Subas disponibles sobre una cadena de envido en curso (para el que responde).
// envido → puede envido(1 vez más)/real/falta · real → falta · falta → nada.
function _envidoRaises2v2(cadena) {
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

// Canta o escala el envido. Acumula el valor "en juego" (si se quiere) y el
// "no quiero" (lo que cobra el que cantó si el otro se achica).
function _cantarEnvido2v2(equipoCanto, tipo) {
  tipo = tipo || "envido";
  const prev = (S2.canto && S2.canto.tipo === "envido") ? S2.canto : null;
  const cadena = prev ? prev.cadena.concat(tipo) : [tipo];
  const prevEnJuego = prev ? prev.enJuego : 0;
  let enJuego, noQuiero;
  if (tipo === "falta") { enJuego = _faltaPts2v2(); noQuiero = prev ? prevEnJuego : 1; }
  else { enJuego = prevEnJuego + (tipo === "real" ? 3 : 2); noQuiero = prev ? prevEnJuego : 1; }
  S2.canto = { tipo: "envido", cadena, enJuego, noQuiero, equipoCanto, equipoResponde: _rival2(equipoCanto) };
  _log2(`${equipoCanto} canta ${_ENV_NOMBRE[tipo]} (en juego ${enJuego})`);
}

// Respuesta al envido: 'quiero' | 'no' | 'envido'|'real'|'falta' (suba).
function _responderEnvido2v2(resp) {
  const c = S2.canto;
  if (!c || c.tipo !== "envido") return;
  if (resp === "no") {
    S2.puntos[c.equipoCanto] += c.noQuiero;
    _log2(`Envido NO querido → +${c.noQuiero} ${c.equipoCanto}`);
    S2.envidoResuelto = true; S2.canto = null; _chequearFin2v2();
    if (!S2.terminado) _restaurarTrucoDiferido2v2();
    return;
  }
  if (resp !== "quiero") { _cantarEnvido2v2(c.equipoResponde, resp); return; } // suba
  const tNos = _tantosEquipo(EQ2.NOS), tEllos = _tantosEquipo(EQ2.ELLOS);
  const g = tNos > tEllos ? EQ2.NOS : tEllos > tNos ? EQ2.ELLOS : _equipoDe(S2.manoAsiento);
  S2.puntos[g] += c.enJuego;
  _log2(`Envido: NOS ${tNos} vs ELLOS ${tEllos} → +${c.enJuego} ${g}`);
  S2.envidoResuelto = true; S2.canto = null; _chequearFin2v2();
  if (!S2.terminado) _restaurarTrucoDiferido2v2();
}

// Vuelve a poner en pie un TRUCO que había quedado en pausa porque el
// equipo que debía responderlo interpuso el envido primero ("el envido
// está primero"). Se llama al resolverse ese envido.
function _restaurarTrucoDiferido2v2() {
  if (!S2.trucoDiferido) return false;
  const equipo = S2.trucoDiferidoDe;
  S2.trucoDiferido = false;
  S2.trucoDiferidoDe = null;
  S2.canto = { tipo: "truco", nivel: S2.nivelTruco, equipoCanto: equipo, equipoResponde: _rival2(equipo) };
  _log2(`El ${_NOMBRE_TRUCO[S2.nivelTruco]} de ${equipo} sigue en pie — hay que responder`);
  return true;
}

// ¿El equipo ya jugó una carta en la baza 0? Si ya tiró, perdió la chance
// de interponer envido sobre un truco pendiente.
function _equipoYaJugoR0(equipo) {
  return S2.ronda !== 0 || S2.jugadasBaza.some(j => _equipoDe(j.asiento) === equipo);
}

// "El envido está primero": si a un equipo le cantan el primer TRUCO (nivel
// 2) antes de jugar carta en la baza 0 y el envido sigue vivo, puede
// responder cantando envido en lugar de quiero/no querer — el truco queda
// diferido y vuelve a ponerse en juego al resolverse ese envido.
function puedeResponderTrucoConEnvido2v2(equipo) {
  const c = S2.canto;
  if (!c || c.tipo !== "truco") return false;
  if (c.equipoResponde !== equipo) return false;
  if (S2.nivelTruco !== 2) return false; // solo aplica al primer TRUCO
  if (S2.envidoResuelto || S2.florActiva) return false;
  return !_equipoYaJugoR0(equipo);
}

function responderTrucoConEnvido2v2(equipo, tipo) {
  if (!puedeResponderTrucoConEnvido2v2(equipo)) return false;
  S2.trucoDiferido = true;
  S2.trucoDiferidoDe = S2.canto.equipoCanto;
  S2.canto = null;
  _cantarEnvido2v2(equipo, tipo || "envido");
  _log2(`"El envido está primero" — ${equipo} interpone envido, el TRUCO queda en pausa`);
  return true;
}

// El bot decide si canta envido en su turno (durante toda la 1ª baza, sin flor).
function _botQuizasCantarEnvido2v2(asiento) {
  if (S2.ronda !== 0 || S2.envidoResuelto || S2.florActiva) return false;
  const j = S2.jugadores[asiento];
  if (_tantosEquipo(j.equipo) >= 27 && Math.random() < 0.6) { _cantarEnvido2v2(j.equipo, "envido"); return true; }
  return false;
}

// ─────────────────────────────────────────────────────────────
// TRUCO (2/3/4) — de a pares
// ─────────────────────────────────────────────────────────────
function _valorTruco(nivel) { return nivel; }        // 2,3,4
const _NOMBRE_TRUCO = ["", "", "TRUCO", "RETRUCO", "VALE 4"];

// Canta/sube truco: abre un canto pendiente que el otro equipo responde.
function _cantarTruco2v2(equipoCanto, nivel) {
  S2.nivelTruco = nivel;
  S2.trucoEquipoCanto = equipoCanto;
  S2.canto = { tipo: "truco", nivel, equipoCanto, equipoResponde: _rival2(equipoCanto) };
  _log2(`${equipoCanto} canta ${_NOMBRE_TRUCO[nivel]}`);
}

// Resuelve la respuesta al truco: 'quiero' | 'no' | 'subir'.
function _responderTruco2v2(resp) {
  const c = S2.canto;
  if (!c || c.tipo !== "truco") return;
  const eqResp = c.equipoResponde, eqCanto = c.equipoCanto;
  if (resp === "no") {
    const pts = c.nivel - 1; // truco→1, retruco→2, vale4→3
    S2.puntos[eqCanto] += pts;
    S2._trucoRechazado = true;
    S2.canto = null;
    _log2(`${eqResp} NO QUIERE → +${pts} ${eqCanto}`);
    _siguienteMano2v2(); // el truco no-querido cierra la mano de inmediato
    return;
  }
  if (resp === "subir" && c.nivel < 4) {
    S2.trucoAceptado = true;                 // acepta el nivel actual y sube
    _cantarTruco2v2(eqResp, c.nivel + 1);    // ahora responde el equipo original
    return;
  }
  // quiero (o "subir" en vale 4 = quiero)
  S2.trucoAceptado = true;
  S2.canto = null;
  _log2(`${eqResp} QUIERE (nivel ${S2.nivelTruco})`);
}

// Fuerza combinada aproximada de la mejor mano de un equipo (0..~28).
function _fuerzaMejorMano(eq) {
  return S2.jugadores.filter(j => j.equipo === eq).reduce((mx, j) => {
    const fs = j.mano.filter(Boolean).map(c => C[c].f).sort((a, b) => b - a);
    const sc = (fs[0] || 0) + (fs[1] || 0) * 0.5;
    return Math.max(mx, sc);
  }, 0);
}

// El bot responde el canto pendiente (flor, envido o truco) de su equipo.
function _botResponderCanto2v2() {
  const c = S2.canto;
  if (!c) return;
  if (c.tipo === "flor") { _botResponderFlor2v2(); return; }
  if (c.tipo === "envido") {
    const t = _tantosEquipo(c.equipoResponde);
    const raises = _envidoRaises2v2(c.cadena);
    if (t >= 31 && raises.includes("real")) _responderEnvido2v2("real");
    else if (t >= 27) _responderEnvido2v2("quiero");
    else _responderEnvido2v2("no");
    return;
  }
  const fuerza = _fuerzaMejorMano(c.equipoResponde);
  if (fuerza >= 24 && c.nivel < 4) _responderTruco2v2("subir");
  else if (fuerza >= 15)           _responderTruco2v2("quiero");
  else                             _responderTruco2v2("no");
}

// El bot decide si canta truco en su turno.
function _botQuizasCantarTruco2v2(asiento) {
  if (S2.nivelTruco >= 2 || S2._trucoRechazado) return false;
  const j = S2.jugadores[asiento];
  const fs = j.mano.filter(Boolean).map(c => C[c].f).sort((a, b) => b - a);
  const fuerza = (fs[0] || 0) + (fs[1] || 0) * 0.5;
  const umbral = S2.bazas.filter(b => b === j.equipo).length >= 1 ? 12 : 18;
  if (fuerza >= umbral && Math.random() < 0.5) { _cantarTruco2v2(j.equipo, 2); return true; }
  return false;
}

// Asiento "por defecto" que responde un canto pendiente offline: el más
// bajo del equipo que responde. Offline eso da 0 para NOS y 1 para ELLOS
// (siempre un asiento válido para decidir si el turno de responder es de
// un bot o del humano local). Con 4 humanos reales (online) CUALQUIER
// compañero del equipo puede responder — ver _puedeResponderCanto.
function _asientoRespondeCanto() {
  if (!S2.canto) return -1;
  const eq = S2.canto.equipoResponde;
  for (let a = 0; a < 4; a++) if (_equipoDe(a) === eq) return a;
  return -1;
}

// Devuelve true si el asiento pertenece al equipo que debe responder el
// canto pendiente — cualquiera de los dos compañeros puede hacerlo (regla
// real: no hay un "capitán" fijo que monopolice la respuesta del equipo).
function _puedeResponderCanto(asiento) {
  return !!S2.canto && _equipoDe(asiento) === S2.canto.equipoResponde;
}

// ── Acciones parametrizadas por ASIENTO (sirven para local y online) ──
// El host las aplica tanto para su propio asiento como para el de cada
// jugador remoto. Devuelven true si la acción fue válida y se aplicó.
function accionCantarTruco2v2(asiento) {
  if (S2.turno !== asiento || S2.canto || S2.nivelTruco >= 2 || S2._trucoRechazado || S2.terminado) return false;
  _cantarTruco2v2(_equipoDe(asiento), 2);
  return true;
}
function accionCantarEnvido2v2(asiento, tipo) {
  if (S2.turno !== asiento || S2.canto || S2.ronda !== 0 || S2.envidoResuelto || S2.florActiva
      || S2.terminado) return false;
  _cantarEnvido2v2(_equipoDe(asiento), tipo || "envido");
  return true;
}
function accionResponderCanto2v2(asiento, resp) {
  const c = S2.canto;
  if (!c || !_puedeResponderCanto(asiento)) return false;
  if (c.tipo === "envido") _responderEnvido2v2(resp);   // resp: 'quiero'|'no'|'envido'|'real'|'falta'
  else if (c.tipo === "flor") _responderFlor2v2(resp);  // resp: 'quiero'|'no'|'contraflor'|'contraflorresto'
  else _responderTruco2v2(resp);                        // resp: 'quiero'|'no'|'subir'
  return true;
}

// "El envido está primero": el asiento responde al TRUCO pendiente
// cantando envido en su lugar (ver puedeResponderTrucoConEnvido2v2).
function accionResponderTrucoConEnvido2v2(asiento, tipo) {
  if (!_puedeResponderCanto(asiento)) return false;
  return responderTrucoConEnvido2v2(_equipoDe(asiento), tipo || "envido");
}

// ── Wrappers del HUMANO local (asiento 0) — compat con la UI offline ──
function humanoCantarTruco2v2()      { return accionCantarTruco2v2(0); }
function humanoCantarEnvido2v2(tipo) { return accionCantarEnvido2v2(0, tipo); }
function humanoResponderCanto2v2(resp) { return accionResponderCanto2v2(0, resp); }

// ─────────────────────────────────────────────────────────────
// JUGAR CARTA / BAZAS
// ─────────────────────────────────────────────────────────────
function jugarCarta2v2(asiento, cartaIdx) {
  if (S2.terminado || asiento !== S2.turno) return false;
  const j = S2.jugadores[asiento];
  const carta = j.mano[cartaIdx];
  if (!carta) return false;
  j.mano[cartaIdx] = null;
  S2.jugadasBaza.push({ asiento, carta });
  _log2(`  asiento ${asiento} (${j.equipo}) juega ${carta}`);

  if (S2.jugadasBaza.length === 4) {
    _cerrarBaza2v2();
  } else {
    S2.turno = (S2.turno + 1) % 4;
  }
  return true;
}

function _cerrarBaza2v2() {
  // Carta más alta gana la baza para su equipo.
  let mejor = S2.jugadasBaza[0];
  for (const jug of S2.jugadasBaza) if (C[jug.carta].f > C[mejor.carta].f) mejor = jug;
  // ¿parda? (empate de fuerza máxima entre equipos distintos)
  const maxF = C[mejor.carta].f;
  const equiposConMax = new Set(
    S2.jugadasBaza.filter(j => C[j.carta].f === maxF).map(j => _equipoDe(j.asiento))
  );
  const resultado = equiposConMax.size > 1 ? "parda" : _equipoDe(mejor.asiento);
  S2.bazas.push(resultado);
  _log2(`  → baza ${S2.ronda}: ${resultado}`);

  S2.liderBaza = mejor.asiento;          // el que ganó abre la próxima
  S2.jugadasBaza = [];
  S2.ronda++;

  const g = _ganadorMano2v2(S2.bazas);
  if (g || S2.ronda >= 3) {
    _cerrarMano2v2(g || _ganadorMano2v2Forzado());
  } else {
    S2.turno = S2.liderBaza;
  }
}

// Determina el ganador de la mano según las bazas ('nos'|'ellos'|'parda').
// Devuelve null si aún no está decidido.
function _ganadorMano2v2(bazas) {
  const w = e => bazas.filter(b => b === e).length;
  if (w(EQ2.NOS) >= 2) return EQ2.NOS;
  if (w(EQ2.ELLOS) >= 2) return EQ2.ELLOS;
  if (bazas.length >= 1 && bazas[0] === "parda") {
    for (const b of bazas) if (b !== "parda") return b; // gana la 1ª no-parda
  }
  if (bazas.length >= 2 && bazas[0] !== "parda" && bazas[1] === "parda") {
    return bazas[0]; // ganó la 1ª y la 2ª pardó → se la lleva
  }
  return null;
}

// Tras 3 bazas sin definir por conteo: 1-1 con parda, o todas pardas.
function _ganadorMano2v2Forzado() {
  const b = S2.bazas;
  if (b[0] && b[0] !== "parda") return b[0]; // "primera vale"
  for (const x of b) if (x !== "parda") return x;
  return _equipoDe(S2.manoAsiento); // todas pardas: gana la mano
}

function _cerrarMano2v2(ganador) {
  // Puntos del truco (o 1 si no se cantó / se aceptó truco).
  const pts = S2.trucoAceptado ? _valorTruco(S2.nivelTruco) : 1;
  S2.puntos[ganador] += pts;
  _log2(`Mano para ${ganador} → +${pts} (total nos ${S2.puntos.nos} / ellos ${S2.puntos.ellos})`);
  _siguienteMano2v2();
}

// Cierra la repartida: chequea fin y, si no terminó, rota la mano y
// reparte. Se usa tanto tras jugar las bazas como tras un truco no-querido
// (donde NO se otorgan puntos de mano — ya los cobró el que cantó).
function _siguienteMano2v2() {
  if (_chequearFin2v2()) return;
  S2.manoAsiento = (S2.manoAsiento + 1) % 4;
  _repartir2v2();
}

// ─────────────────────────────────────────────────────────────
// IA — juega la carta de un bot
// ─────────────────────────────────────────────────────────────
function _botElegirCarta2v2(asiento) {
  const j = S2.jugadores[asiento];
  const idxs = j.mano.map((c, i) => c ? i : -1).filter(i => i >= 0);
  // Carta más alta que va ganando la baza en curso (si hay).
  const cartasBaza = S2.jugadasBaza.map(x => C[x.carta].f);
  const maxEnMesa = cartasBaza.length ? Math.max(...cartasBaza) : 0;
  const ordenadas = idxs.sort((a, b) => C[j.mano[a]].f - C[j.mano[b]].f);
  // La más baja que supera lo que hay en mesa; si no, la más baja.
  const ganadora = ordenadas.find(i => C[j.mano[i]].f > maxEnMesa);
  return (ganadora !== undefined && maxEnMesa > 0) ? ganadora : ordenadas[0];
}

// ─────────────────────────────────────────────────────────────
// DRIVER — procesa turnos de bots hasta que juega el humano o termina
// ─────────────────────────────────────────────────────────────
// UN paso del motor: procesa envido/truco y la carta de UN bot.
// Devuelve 'humano' (espera al asiento 0), 'fin' (terminó), 'jugo' (un
// bot jugó una carta). La UI lo llama con delays para animar; la
// simulación lo llama en loop cerrado.
function pasoBot2v2() {
  if (S2.terminado) return "fin";
  // 1. ¿Hay un canto pendiente de respuesta?
  if (S2.canto) {
    const aResp = _asientoRespondeCanto();
    if (aResp >= 0 && !S2.jugadores[aResp].esBot) return "humanoCanto"; // espera respuesta humana
    _botResponderCanto2v2();
    return S2.terminado ? "fin" : "canto";
  }
  // 2. Turno de jugar carta
  const asiento = S2.turno;
  if (!S2.jugadores[asiento].esBot) return "humano"; // el humano juega o canta
  // El bot puede cantar envido (ventana) o truco antes de tirar.
  if (_botQuizasCantarEnvido2v2(asiento)) return "canto";
  if (_botQuizasCantarTruco2v2(asiento)) return "canto";
  const idx = _botElegirCarta2v2(asiento);
  jugarCarta2v2(asiento, idx);
  return S2.terminado ? "fin" : "jugo";
}

// Corre pasos de bots hasta que le toca al humano o termina (para la sim).
function avanzar2v2() {
  let guard = 0;
  while (!S2.terminado && guard++ < 500) {
    const r = pasoBot2v2();
    if (r === "humano" || r === "fin") return r;
  }
  return S2.terminado ? "fin" : "limite";
}

// ─────────────────────────────────────────────────────────────
// SIMULACIÓN HEADLESS — test de correctitud del motor
// ─────────────────────────────────────────────────────────────
function simular2v2(nPartidas) {
  nPartidas = nPartidas || 200;
  const stats = { partidas: 0, ganaNos: 0, ganaEllos: 0, errores: 0, manosTotales: 0, maxPuntos: 0 };
  for (let p = 0; p < nPartidas; p++) {
    try {
      nuevo2v2({ todosBot: true, manoInicial: p % 4 });
      let manos = 0, guard = 0;
      while (!S2.terminado && guard++ < 300) {
        avanzar2v2();
        manos++;
      }
      if (!S2.terminado) { stats.errores++; continue; }
      stats.partidas++;
      stats.manosTotales += manos;
      if (S2.ganadorPartido === EQ2.NOS) stats.ganaNos++; else stats.ganaEllos++;
      stats.maxPuntos = Math.max(stats.maxPuntos, S2.puntos.nos, S2.puntos.ellos);
    } catch (e) {
      stats.errores++;
      stats._ultimoError = String(e && e.message || e);
    }
  }
  stats.manosProm = +(stats.manosTotales / Math.max(1, stats.partidas)).toFixed(1);
  return stats;
}

// Exponer para consola / UI
if (typeof window !== "undefined") {
  window.nuevo2v2 = nuevo2v2;
  window.jugarCarta2v2 = jugarCarta2v2;
  window.avanzar2v2 = avanzar2v2;
  window.pasoBot2v2 = pasoBot2v2;
  window.simular2v2 = simular2v2;
  window.humanoCantarTruco2v2 = humanoCantarTruco2v2;
  window.humanoCantarEnvido2v2 = humanoCantarEnvido2v2;
  window.humanoResponderCanto2v2 = humanoResponderCanto2v2;
  window.accionCantarTruco2v2 = accionCantarTruco2v2;
  window.accionCantarEnvido2v2 = accionCantarEnvido2v2;
  window.accionResponderCanto2v2 = accionResponderCanto2v2;
  window.accionResponderTrucoConEnvido2v2 = accionResponderTrucoConEnvido2v2;
  window.puedeResponderTrucoConEnvido2v2 = puedeResponderTrucoConEnvido2v2;
  window._asientoRespondeCanto = _asientoRespondeCanto;
  window._puedeResponderCanto = _puedeResponderCanto;
  window._equipoDe2v2 = _equipoDe;
  window._envidoRaises2v2 = _envidoRaises2v2;
  window._ENV_NOMBRE = _ENV_NOMBRE;
  window._florRaises2v2 = _florRaises2v2;
  window._FLOR_NOMBRE = _FLOR_NOMBRE;
  window.S2 = S2;
}
