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
  jugadores: [],          // [{id, nombre, equipo, mano:[cartaId..], manoInicial:[..], esBot}]
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
  trucoQuienQuiso: null,  // equipo que dijo el último "quiero" (solo él puede subir)
  cantoPendiente: null,   // 'truco' | 'envido' | null (espera respuesta)
  trucoDiferido: false,   // "el envido está primero": truco en pausa
  trucoDiferidoDe: null,  // equipo que había cantado el truco diferido
  // envido / flor
  cfgFlor: true,          // regla de la mesa: ¿se juega con flor? (2v2 nació con flor siempre)
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
  S2.cfgFlor = opts.conFlor !== false; // config de la mesa (default: con flor, como siempre fue)
  S2.manoAsiento = (typeof opts.manoInicial === "number") ? opts.manoInicial : 0;
  S2.terminado = false;
  S2.ganadorPartido = null;
  S2._log = [];
  _repartir2v2();
}

// RNG del motor: Math.random en juego real; en la simulación se siembra
// (S2._rand) para que una corrida fallida sea REPRODUCIBLE.
function _rnd2() { return (S2._rand || Math.random)(); }
function _mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function _mazoMezclado() {
  const mazo = Object.keys(C);
  for (let i = mazo.length - 1; i > 0; i--) {
    const j = Math.floor(_rnd2() * (i + 1));
    [mazo[i], mazo[j]] = [mazo[j], mazo[i]];
  }
  return mazo;
}

function _repartir2v2() {
  const mazo = _mazoMezclado();
  // manoInicial: snapshot ANTES de jugar cartas — el envido y la flor se
  // calculan siempre sobre esto (la mano viva tiene null en lo ya jugado).
  S2.jugadores.forEach((j, k) => {
    j.mano = [mazo[k], mazo[k + 4], mazo[k + 8]];
    j.manoInicial = j.mano.slice();
  });
  S2.ronda = 0;
  S2.jugadasBaza = [];
  S2.bazas = [];
  S2.liderBaza = S2.manoAsiento;
  S2.turno = S2.manoAsiento;
  S2.nivelTruco = 1;
  S2.trucoEquipoCanto = null;
  S2.trucoAceptado = false;
  S2.trucoQuienQuiso = null;
  S2.canto = null;
  S2._trucoRechazado = false;
  S2.trucoDiferido = false;
  S2.trucoDiferidoDe = null;
  S2.envidoResuelto = false;   // true una vez jugado el envido (o anulado por flor)
  // La flor NO se resuelve al repartir: se CANTA (ver la sección FLOR).
  S2.florActiva = false;       // hay flor cantada en juego
  S2.florResuelta = !S2.cfgFlor;  // mesa sin flor = nada que resolver
  S2.florCantadas = [];        // asientos que cantaron su flor, en orden (público)
  S2.florPaso = [false, false, false, false]; // se la guardó (PRIVADO: no viaja)
  _log2(`── Nueva repartida. Mano: asiento ${S2.manoAsiento} (${_equipoDe(S2.manoAsiento)}) ──`);
}

// ─────────────────────────────────────────────────────────────
// FLOR (v2: CANTADA — 2026-07-30)
//
// Antes se resolvía sola al repartir: la flor se hacía pública al instante y
// nadie podía guardársela. Ahora es como en la mesa (y como el 1v1): el que
// tiene flor la canta EN SU TURNO, en la primera baza, antes de tirar carta —
// o se la guarda, y entonces el rival nunca se entera de que la tenía.
//
// Ventana: misma que el envido (ronda 0, hasta que el PIE juega su primera
// carta). Si jugás tu carta con flor sin declarar, se te fue la flor.
//
// Resolución (_cerrarFlorSiCorresponde2v2), una vez que nadie tiene flor
// pendiente o se cerró la ventana:
//   · cantó UN solo equipo  → cobra 3 por CADA flor cantada (decisión de
//     Chucho, 30 jul: cada flor vale 3).
//   · cantaron LOS DOS      → se abre la negociación de contraflor de siempre
//     (canto pendiente tipo 'flor'; responde el equipo que cantó segundo).
//
// Qué es privado: que alguien SE GUARDE la flor no se loguea ni viaja en el
// snapshot (revelaría que la tenía). Cantarla sí es público.
// ─────────────────────────────────────────────────────────────
// Puntos de flor de un asiento (20 + suma de los tres) o null si no tiene.
// Lee manoInicial: la flor son las 3 cartas REPARTIDAS, jugadas o no.
function _florPts2v2(asiento) {
  const j = S2.jugadores[asiento];
  const cs = (j.manoInicial || j.mano).filter(Boolean).map(x => C[x]);
  if (cs.length < 3) return null;
  const palos = {};
  cs.forEach(c => { palos[c.p] = (palos[c.p] || 0) + 1; });
  if (!Object.values(palos).some(n => n >= 3)) return null; // no son 3 del mismo palo
  return cs.reduce((s, c) => s + (c.n >= 10 ? 0 : c.n), 20);
}
// Solo cuentan las flores CANTADAS del equipo: la que alguien se guardó
// (accionGuardarFlor2v2) nunca se revela ni se compara — es exactamente lo
// que "guardársela" significa. Antes este reduce recorría TODOS los
// jugadores del equipo (cantaron o no), así que una flor guardada más alta
// que la cantada terminaba ganando la comparación sin haberse anunciado
// nunca (bug auditoría 2026-08-03).
function _florEquipo2v2(eq) {
  return S2.jugadores.filter(j => j.equipo === eq && S2.florCantadas.includes(j.id))
    .reduce((mx, j) => { const f = _florPts2v2(j.id); return f !== null ? Math.max(mx, f) : mx; }, null);
}
// Cuántas flores CANTÓ un equipo. CADA flor cantada vale 3, así que una pareja
// que cantó las dos cobra 6 (regla clásica, decidida el 30 jul 2026). Se cuenta
// sobre lo CANTADO, no sobre lo que hay: la que te guardás no paga.
function _floresCantadasEq2v2(eq) {
  return S2.florCantadas.filter(a => _equipoDe(a) === eq).length;
}

// El PIE es el último en jugar de la primera vuelta: el asiento anterior al
// mano. Su primera carta cierra la ventana de envido/flor (igual que el 1v1).
function _pieAsiento2v2() { return (S2.manoAsiento + 3) % 4; }

function _florVentanaAbierta2v2() {
  if (!S2.cfgFlor || S2.terminado || S2.ronda !== 0) return false;
  return !S2.jugadasBaza.some(j => j.asiento === _pieAsiento2v2());
}

// ¿Este asiento tiene flor y todavía no la declaró (ni cantada ni guardada)?
// Obligación PERSONAL, igual que florPropiaPendiente() del 1v1: mientras la
// tengas sin resolver no podés cantar envido. Que la tenga OTRO no te bloquea
// (eso cantaría su flor por él — fuga de información).
function _florPropiaPendiente2v2(asiento) {
  if (!S2.cfgFlor || S2.florResuelta) return false;
  return _florPts2v2(asiento) !== null
    && !S2.florCantadas.includes(asiento)
    && !S2.florPaso[asiento];
}

// ¿El asiento puede declarar su flor AHORA? (cantarla o guardársela)
function puedeCantarFlor2v2(asiento) {
  if (S2.terminado || S2.canto || S2.turno !== asiento) return false;
  if (!_florVentanaAbierta2v2()) return false;
  return _florPropiaPendiente2v2(asiento);
}

// Cierra la fase de declaración cuando ya nadie puede/quiere declarar:
// paga la flor de un solo equipo, o abre la contraflor si cantaron los dos.
function _cerrarFlorSiCorresponde2v2() {
  if (S2.florResuelta || S2.canto || !S2.florCantadas.length) return;
  // Si alguien todavía tiene flor por declarar y le queda turno, se espera:
  // todas las flores se cantan ANTES de negociar la contraflor.
  const pendiente = [0, 1, 2, 3].some(a => _florPropiaPendiente2v2(a));
  if (pendiente && _florVentanaAbierta2v2()) return;

  const nNos = _floresCantadasEq2v2(EQ2.NOS), nEllos = _floresCantadasEq2v2(EQ2.ELLOS);
  if (nNos && nEllos) {
    // Los dos equipos cantaron → contraflor. Responde el que cantó SEGUNDO:
    // es el que "contesta" la flor del otro, que es el rol de la contraflor.
    // Silencioso: las dos FLOR ya se anunciaron al cantarse.
    _cantarFlor2v2(_equipoDe(S2.florCantadas[0]), "flor", true);
    return;
  }
  // Un solo equipo: cobra 3 por cada flor cantada, sin nada que negociar.
  // OJO: sin los puntos en el log — S2._log viaja entero a los guests
  // (snap._log) y los tantos son privados hasta que se comparan (bug #5).
  const eq = nNos ? EQ2.NOS : EQ2.ELLOS;
  const p = 3 * (nNos || nEllos);
  S2.puntos[eq] += p;
  _log2(`FLOR ${eq} → +${p}`);
  S2.florResuelta = true;
  _chequearFin2v2();
}

// ── Acciones de declaración (por asiento: valen para local y online) ──
function accionCantarFlor2v2(asiento) {
  if (!puedeCantarFlor2v2(asiento)) return false;
  S2.florCantadas.push(asiento);
  S2.florActiva = true;
  S2.envidoResuelto = true;   // la flor anula el envido (regla oficial)
  _log2(`${_equipoDe(asiento)} canta FLOR`);
  _cerrarFlorSiCorresponde2v2();
  return true;
}

// "Guardársela": tenés flor y elegís no cantarla. Perdés los 3 puntos, pero
// el rival nunca se entera. NO se loguea: el log viaja a todos los guests y
// decir "se guardó la flor" es exactamente la información que se protege.
function accionGuardarFlor2v2(asiento) {
  if (!puedeCantarFlor2v2(asiento)) return false;
  S2.florPaso[asiento] = true;
  _cerrarFlorSiCorresponde2v2();
  return true;
}

// Escaladas de flor disponibles para el que responde.
const _FLOR_NOMBRE = { flor: "FLOR", contraflor: "CONTRAFLOR", contraflorresto: "CONTRAFLOR AL RESTO" };
// La regla de escaladas vive en reglas_truco.js (compartida).
function _florRaises2v2(cadena) { return reglasFlorRaises(cadena); }

// Canta/escala la flor. enJuego = puntos si se comparan las flores; noQuiero =
// lo que cobra el que escaló si el otro se achica.
// `silencioso`: al abrir la negociación de contraflor, el "FLOR" del equipo
// ya se anunció cuando el jugador la cantó — volver a loguearlo duplica el
// anuncio y el overlay de la mesa.
function _cantarFlor2v2(equipoCanto, tipo, silencioso) {
  const prev = (S2.canto && S2.canto.tipo === "flor") ? S2.canto : null;
  const cadena = prev ? prev.cadena.concat(tipo) : [tipo];
  let enJuego, noQuiero;
  if (tipo === "flor")             { enJuego = 3; noQuiero = 3; }
  else if (tipo === "contraflor")  { enJuego = 6; noQuiero = prev ? prev.enJuego : 3; }
  // Contraflor al resto: vale "la falta", pero nunca menos que lo ya
  // aceptado en la cadena (flor=3 / contraflor=6) — mismo piso que aplica
  // el 1v1 en _registrarCantoFlor (juego.js). Sin el Math.max, con el
  // límite cerca (ej. 29 a 29) _faltaPts2v2() podía dar menos que 6 y la
  // contraflor al resto pagaba MENOS que un "no quiero" a la contraflor
  // (bug auditoría 2026-08-03).
  else                             { enJuego = Math.max(prev ? prev.enJuego : 0, _faltaPts2v2()); noQuiero = prev ? prev.enJuego : 6; }
  S2.canto = { tipo: "flor", cadena, enJuego, noQuiero, equipoCanto, equipoResponde: _rival2(equipoCanto) };
  if (!silencioso) _log2(`${equipoCanto} canta ${_FLOR_NOMBRE[tipo]}`);
}

// Respuesta a la flor: 'quiero' | 'no' | 'contraflor' | 'contraflorresto'.
// Devuelve true si la respuesta era válida y se aplicó (misma guarda de motor
// que _responderEnvido2v2: el guest online manda `resp` crudo).
function _responderFlor2v2(resp) {
  const c = S2.canto;
  if (!c || c.tipo !== "flor") return false;
  // "No quiero" solo tiene sentido si hay una escalada (contraflor+) que rechazar.
  if (resp === "no" && c.cadena.length > 1) {
    S2.puntos[c.equipoCanto] += c.noQuiero;
    _log2(`Contraflor NO querida → +${c.noQuiero} ${c.equipoCanto}`);
    S2.florResuelta = true; S2.canto = null; _chequearFin2v2();
    return true;
  }
  if (resp === "contraflor" || resp === "contraflorresto") {
    if (!_florRaises2v2(c.cadena).includes(resp)) return false;
    _cantarFlor2v2(c.equipoResponde, resp);
    return true;
  }
  // A una flor pelada no se le dice "no quiero": el "no" existe recién a partir
  // de la contraflor (arriba). Mismo criterio que el 1v1 (juego.js), si no el
  // invitado online recibe dos respuestas distintas al mismo mensaje.
  if (resp !== "quiero") return false;
  // Se comparan las flores: gana la más alta.
  const fNos = _florEquipo2v2(EQ2.NOS), fEllos = _florEquipo2v2(EQ2.ELLOS);
  const g = fNos > fEllos ? EQ2.NOS : fEllos > fNos ? EQ2.ELLOS : _equipoDe(S2.manoAsiento);
  // Sin escalada, la flor pelada paga 3 por CADA flor cantada del ganador
  // (misma regla que el pago de un solo equipo). Con contraflor mandan los
  // puntos del canto.
  const pts = (c.cadena.length === 1) ? 3 * Math.max(1, _floresCantadasEq2v2(g)) : c.enJuego;
  S2.puntos[g] += pts;
  _log2(`Flor: nos ${fNos} vs ellos ${fEllos} → +${pts} ${g}`);
  S2.florResuelta = true; S2.canto = null; _chequearFin2v2();
  return true;
}

// El bot responde a un canto de flor de su equipo.
function _botResponderFlor2v2() {
  const c = S2.canto;
  const miFlor = _florEquipo2v2(c.equipoResponde) || 0;
  const suFlor = _florEquipo2v2(c.equipoCanto) || 0;
  const raises = _florRaises2v2(c.cadena);
  const puedeNo = c.cadena.length > 1;
  if (miFlor >= 33 && raises.length) { _responderFlor2v2(raises[0]); return; }        // flor tope → escala
  if (miFlor >= 29 && raises.includes("contraflor") && _rnd2() < 0.4) { _responderFlor2v2("contraflor"); return; }
  if (puedeNo && miFlor < suFlor - 3 && _rnd2() < 0.6) { _responderFlor2v2("no"); return; } // me achico
  _responderFlor2v2("quiero");                                                          // comparo
}

// ─────────────────────────────────────────────────────────────
// ENVIDO — cadena completa: envido / envido-envido / real / falta
// ─────────────────────────────────────────────────────────────
function _tantos2v2(asiento) {
  // SIEMPRE sobre la mano inicial: si el jugador ya tiró una carta en la
  // primera baza, sus tantos no cambian (bug #1 de la auditoría 2026-07-29:
  // la mano viva tiene null en lo jugado y el envido salía podado).
  const j = S2.jugadores[asiento];
  const mano = j.manoInicial || j.mano;
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
// La cuenta de la falta (malas/buenas) vive en reglas_truco.js, compartida
// con el 1v1 (bug #4 auditoría 2v2: cada motor tenía su copia y derivaron).
// También alimenta la CONTRAFLOR AL RESTO.
function _faltaPts2v2() {
  return reglasFaltaEnvido(Math.max(S2.puntos.nos, S2.puntos.ellos), S2.limite);
}

// Subas disponibles sobre una cadena de envido en curso (para el que
// responde). La regla vive en reglas_truco.js (compartida).
function _envidoRaises2v2(cadena) { return reglasEnvidoRaises(cadena); }

// Canta o escala el envido. Acumula el valor "en juego" (si se quiere) y el
// "no quiero" (lo que cobra el que cantó si el otro se achica).
function _cantarEnvido2v2(equipoCanto, tipo) {
  tipo = tipo || "envido";
  const prev = (S2.canto && S2.canto.tipo === "envido") ? S2.canto : null;
  const cadena = prev ? prev.cadena.concat(tipo) : [tipo];
  const prevEnJuego = prev ? prev.enJuego : 0;
  let enJuego, noQuiero;
  // Falta envido: vale "la falta", pero nunca menos que lo ya acumulado en
  // la cadena (envido/real previos) — mismo piso que el 1v1 aplica en
  // _registrarCantoEnvido (juego.js, Math.max con S.nivelEnvido). Sin esto,
  // con el límite cerca, un envido→falta podía pagar MENOS que un "no
  // quiero" al envido simple (bug auditoría 2026-08-03).
  if (tipo === "falta") { enJuego = Math.max(prevEnJuego, _faltaPts2v2()); noQuiero = prev ? prevEnJuego : 1; }
  else { enJuego = prevEnJuego + REGLAS_PTS_ENVIDO[tipo === "real" ? "real" : "envido"]; noQuiero = prev ? prevEnJuego : 1; }
  S2.canto = { tipo: "envido", cadena, enJuego, noQuiero, equipoCanto, equipoResponde: _rival2(equipoCanto) };
  _log2(`${equipoCanto} canta ${_ENV_NOMBRE[tipo]} (en juego ${enJuego})`);
}

// Respuesta al envido: 'quiero' | 'no' | 'envido'|'real'|'falta' (suba).
// Devuelve true si la respuesta era válida y se aplicó. Toda suba se valida
// contra _envidoRaises2v2 ACÁ, en el motor: la UI solo ofrece botones legales,
// pero el guest online manda `resp` crudo por WebSocket (bug #2 auditoría 2v2).
function _responderEnvido2v2(resp) {
  const c = S2.canto;
  if (!c || c.tipo !== "envido") return false;
  // "La flor está primero" (regla oficial, ya vale para quien CANTA envido
  // — accionCantarEnvido2v2 mira _florPropiaPendiente2v2 — pero faltaba
  // para quien RESPONDE). Sin esto: equipo A sin flor canta envido, un
  // jugador de equipo B con flor sin declarar responde QUIERO/NO/sube, se
  // resuelve el envido normal, y DESPUÉS en su turno ese jugador seguía
  // pudiendo cantar su flor — cobrando las dos cosas por la misma mano.
  // Responder el envido sin declarar la flor implícitamente la guarda
  // ("achicar"), igual que el criterio ya usado en el 1v1
  // (responderCantoJugador, juego.js) y en el online (motor_online.js).
  // _florPropiaPendiente2v2 ya mira florPaso, así que alcanza con marcarlo:
  // no hace falta tocar florResuelta (ese campo solo lo lee esta misma
  // función y _cerrarFlorSiCorresponde2v2, y ninguna de las dos bloquea
  // nada más del partido si queda en false sin que nadie cantara flor).
  [0, 1, 2, 3].forEach((a) => {
    if (_equipoDe(a) === c.equipoResponde && _florPropiaPendiente2v2(a)) {
      S2.florPaso[a] = true;
    }
  });
  if (resp === "no") {
    S2.puntos[c.equipoCanto] += c.noQuiero;
    _log2(`Envido NO querido → +${c.noQuiero} ${c.equipoCanto}`);
    S2.envidoResuelto = true; S2.canto = null; _chequearFin2v2();
    if (!S2.terminado) _restaurarTrucoDiferido2v2();
    return true;
  }
  if (resp !== "quiero") { // suba
    if (!_envidoRaises2v2(c.cadena).includes(resp)) return false;
    _cantarEnvido2v2(c.equipoResponde, resp);
    return true;
  }
  const tNos = _tantosEquipo(EQ2.NOS), tEllos = _tantosEquipo(EQ2.ELLOS);
  const g = tNos > tEllos ? EQ2.NOS : tEllos > tNos ? EQ2.ELLOS : _equipoDe(S2.manoAsiento);
  S2.puntos[g] += c.enJuego;
  _log2(`Envido: NOS ${tNos} vs ELLOS ${tEllos} → +${c.enJuego} ${g}`);
  S2.envidoResuelto = true; S2.canto = null; _chequearFin2v2();
  if (!S2.terminado) _restaurarTrucoDiferido2v2();
  return true;
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
// `asiento` es opcional y solo se usa para la guarda de flor: la obligación
// es PERSONAL (mi flor me bloquea a mí, la de mi compañero no — mirar la de él
// apagaría mi botón y le cantaría su flor, la misma fuga que arregló el 1v1).
function puedeResponderTrucoConEnvido2v2(equipo, asiento) {
  const c = S2.canto;
  if (!c || c.tipo !== "truco") return false;
  if (c.equipoResponde !== equipo) return false;
  if (S2.nivelTruco !== 2) return false; // solo aplica al primer TRUCO
  if (S2.envidoResuelto || S2.florActiva) return false;
  if (typeof asiento === "number" && _florPropiaPendiente2v2(asiento)) return false;
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

// ¿El bot se guarda la flor en vez de cantarla? Cantarla son 3 puntos
// seguros, así que guardársela tiene que tener un motivo:
//   · Cantar FLOR le avisa al rival que tenés 3 del mismo palo y ANULA el
//     envido. Con flor floja, callarte deja vivo un envido que capaz rinde
//     más de 3 (una flor de 26 es un envido de 26).
//   · Con flor floja también te exponés a que te contrafloreen con una más
//     alta y perder 6 en vez de 3.
// Nunca se la guarda si YA hay una flor cantada: la del compañero suma, y
// contra la del rival hay que estar para comparar.
function _botSeGuardaLaFlor2v2(asiento) {
  if (S2.florCantadas.length) return false;
  const pts = _florPts2v2(asiento) || 0;
  if (pts >= 32) return false;                    // flor grande: se canta y listo
  const eq = _equipoDe(asiento);
  if (S2.puntos[_rival2(eq)] - S2.puntos[eq] >= 8) return false; // abajo por goleada: los 3 valen
  const prob = pts <= 26 ? 0.35 : (pts <= 29 ? 0.22 : 0.12);
  return _rnd2() < prob;
}

// El bot declara su flor en su turno: la canta, o se la guarda y sigue como
// si nada (el turno no avanza, así que puede cantar envido justo después).
function _botQuizasDeclararFlor2v2(asiento) {
  if (!puedeCantarFlor2v2(asiento)) return false;
  if (_botSeGuardaLaFlor2v2(asiento)) accionGuardarFlor2v2(asiento);
  else accionCantarFlor2v2(asiento);
  return true;
}

// El bot decide si canta envido en su turno (durante toda la 1ª baza, sin flor).
function _botQuizasCantarEnvido2v2(asiento) {
  if (S2.ronda !== 0 || S2.envidoResuelto || S2.florActiva || S2.trucoAceptado) return false;
  if (_florPropiaPendiente2v2(asiento)) return false;   // la flor está primero
  const j = S2.jugadores[asiento];
  if (_tantosEquipo(j.equipo) >= 27 && _rnd2() < 0.6) { _cantarEnvido2v2(j.equipo, "envido"); return true; }
  return false;
}

// ─────────────────────────────────────────────────────────────
// TRUCO (2/3/4) — de a pares
// ─────────────────────────────────────────────────────────────
function _valorTruco(nivel) { return nivel; }        // 2,3,4
const _NOMBRE_TRUCO = ["", "", "TRUCO", "RETRUCO", "VALE 4"];

// Nivel de truco que puede cantar un equipo AHORA (0 = ninguno).
// Regla real (igual que _nivelTrucoDisponible del 1v1): sin truco cantado,
// cualquiera puede cantar TRUCO; con un nivel ya querido, solo puede subir
// el equipo que dijo el último "quiero" — y puede hacerlo en cualquier
// momento posterior de la mano, no solo al responder (bug #3 auditoría 2v2).
function _nivelTrucoDisponible2v2(equipo) {
  if (S2.canto || S2._trucoRechazado || S2.terminado) return 0;
  if (S2.nivelTruco < 2) return 2;
  if (S2.trucoAceptado && S2.trucoQuienQuiso === equipo && S2.nivelTruco < 4) return S2.nivelTruco + 1;
  return 0;
}

// Canta/sube truco: abre un canto pendiente que el otro equipo responde.
function _cantarTruco2v2(equipoCanto, nivel) {
  S2.nivelTruco = nivel;
  S2.trucoEquipoCanto = equipoCanto;
  S2.canto = { tipo: "truco", nivel, equipoCanto, equipoResponde: _rival2(equipoCanto) };
  _log2(`${equipoCanto} canta ${_NOMBRE_TRUCO[nivel]}`);
}

// Resuelve la respuesta al truco: 'quiero' | 'no' | 'subir'.
// Devuelve true si la respuesta era válida y se aplicó.
function _responderTruco2v2(resp) {
  const c = S2.canto;
  if (!c || c.tipo !== "truco") return false;
  if (resp !== "quiero" && resp !== "no" && resp !== "subir") return false;
  const eqResp = c.equipoResponde, eqCanto = c.equipoCanto;
  if (resp === "no") {
    const pts = c.nivel - 1; // truco→1, retruco→2, vale4→3
    S2.puntos[eqCanto] += pts;
    S2._trucoRechazado = true;
    S2.canto = null;
    _log2(`${eqResp} NO QUIERE → +${pts} ${eqCanto}`);
    _siguienteMano2v2(); // el truco no-querido cierra la mano de inmediato
    return true;
  }
  if (resp === "subir" && c.nivel < 4) {
    S2.trucoAceptado = true;                 // acepta el nivel actual y sube
    S2.trucoQuienQuiso = eqResp;             // aceptación implícita: él "quiso" el nivel previo
    _cantarTruco2v2(eqResp, c.nivel + 1);    // ahora responde el equipo original
    return true;
  }
  // quiero (o "subir" en vale 4 = quiero)
  S2.trucoAceptado = true;
  S2.trucoQuienQuiso = eqResp;               // solo este equipo puede subir después
  S2.canto = null;
  _log2(`${eqResp} QUIERE (nivel ${S2.nivelTruco})`);
  return true;
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

// El bot decide si canta (o sube) truco en su turno.
function _botQuizasCantarTruco2v2(asiento) {
  const j = S2.jugadores[asiento];
  const nivel = _nivelTrucoDisponible2v2(j.equipo);
  if (!nivel) return false;
  const fs = j.mano.filter(Boolean).map(c => C[c].f).sort((a, b) => b - a);
  const fuerza = (fs[0] || 0) + (fs[1] || 0) * 0.5;
  if (nivel > 2) { // subir a retruco/vale4: exige mano fuerte de verdad
    if (fuerza >= 24 && _rnd2() < 0.35) { _cantarTruco2v2(j.equipo, nivel); return true; }
    return false;
  }
  const umbral = S2.bazas.filter(b => b === j.equipo).length >= 1 ? 12 : 18;
  if (fuerza >= umbral && _rnd2() < 0.5) { _cantarTruco2v2(j.equipo, 2); return true; }
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
  if (S2.turno !== asiento || S2.terminado) return false;
  const nivel = _nivelTrucoDisponible2v2(_equipoDe(asiento));
  if (!nivel) return false;
  _cantarTruco2v2(_equipoDe(asiento), nivel);
  return true;
}
function accionCantarEnvido2v2(asiento, tipo) {
  // S2.trucoAceptado: el truco QUERIDO cierra el envido (mismo criterio que
  // envidoSigueVivo del 1v1) — hallado probando online con cliente hostil.
  if (S2.turno !== asiento || S2.canto || S2.ronda !== 0 || S2.envidoResuelto || S2.florActiva
      || S2.trucoAceptado || S2.terminado) return false;
  // "La flor está primero": con flor propia sin declarar, primero la resolvés.
  if (_florPropiaPendiente2v2(asiento)) return false;
  _cantarEnvido2v2(_equipoDe(asiento), tipo || "envido");
  return true;
}
function accionResponderCanto2v2(asiento, resp) {
  const c = S2.canto;
  if (!c || !_puedeResponderCanto(asiento)) return false;
  if (c.tipo === "envido") return _responderEnvido2v2(resp); // resp: 'quiero'|'no'|'envido'|'real'|'falta'
  if (c.tipo === "flor")   return _responderFlor2v2(resp);   // resp: 'quiero'|'no'|'contraflor'|'contraflorresto'
  return _responderTruco2v2(resp);                           // resp: 'quiero'|'no'|'subir'
}

// "El envido está primero": el asiento responde al TRUCO pendiente
// cantando envido en su lugar (ver puedeResponderTrucoConEnvido2v2).
function accionResponderTrucoConEnvido2v2(asiento, tipo) {
  if (!_puedeResponderCanto(asiento)) return false;
  if (!puedeResponderTrucoConEnvido2v2(_equipoDe(asiento), asiento)) return false;
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
  // Con un canto pendiente NO se juegan cartas: primero se responde.
  // La UI y la puerta online ya lo bloquean, pero la guarda va en el motor
  // (lección del 1v1: toda guarda de reglas en los dos lados).
  if (S2.terminado || S2.canto || asiento !== S2.turno) return false;
  const j = S2.jugadores[asiento];
  const carta = j.mano[cartaIdx];
  if (!carta) return false;
  // Tirar carta con flor sin declarar = se te fue la flor (no se avisa: que
  // la tenía sigue siendo información suya).
  if (_florPropiaPendiente2v2(asiento)) S2.florPaso[asiento] = true;
  j.mano[cartaIdx] = null;
  S2.jugadasBaza.push({ asiento, carta });
  _log2(`  asiento ${asiento} (${j.equipo}) juega ${carta}`);
  // Si esta carta cerró la ventana (la del PIE), la flor cantada se resuelve
  // ya: no queda nadie que pueda declarar.
  _cerrarFlorSiCorresponde2v2();
  if (S2.terminado) return true;

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

  // El que ganó abre la próxima; si fue parda, abre el MANO (misma
  // convención que el 1v1, juego.js: turnoActual = turnoMano en parda).
  S2.liderBaza = (resultado === "parda") ? S2.manoAsiento : mejor.asiento;
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
  if (!S2.jugadores[asiento].esBot) return "humano"; // el humano juega, canta o declara flor
  // El bot puede declarar flor, cantar envido (ventana) o truco antes de tirar.
  if (_botQuizasDeclararFlor2v2(asiento)) return "canto";
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
// Determinista por defecto (semilla fija): una corrida que falla se puede
// reproducir tal cual. Pasá otra semilla para explorar más casos.
function simular2v2(nPartidas, semilla) {
  nPartidas = nPartidas || 200;
  S2._rand = _mulberry32((typeof semilla === "number") ? semilla : 20260729);
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
  S2._rand = null; // el juego real vuelve a Math.random
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
  window._nivelTrucoDisponible2v2 = _nivelTrucoDisponible2v2;
  window._faltaPts2v2 = _faltaPts2v2;
  window._asientoRespondeCanto = _asientoRespondeCanto;
  window._puedeResponderCanto = _puedeResponderCanto;
  window._equipoDe2v2 = _equipoDe;
  window._envidoRaises2v2 = _envidoRaises2v2;
  window._ENV_NOMBRE = _ENV_NOMBRE;
  window._florRaises2v2 = _florRaises2v2;
  window._FLOR_NOMBRE = _FLOR_NOMBRE;
  window.S2 = S2;
}
