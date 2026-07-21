// ══════════════════════════════════════════════════════════════
// INTELIGENCIA ARTIFICIAL DEL RIVAL — v3
//
// Arquitectura de decisión:
//   1. Evaluación de la mano  → score 0-100 sobre fuerza del truco
//                             → tantos para el envido
//   2. Contexto de la partida → quién va ganando, cuánto falta,
//                               qué rondas se ganaron/perdieron
//   3. Perfil de riesgo       → Fácil: conservador y predecible
//                               Difícil: agresivo, farolea, blefa
//   4. Decisión               → canta / responde / juega carta
// ══════════════════════════════════════════════════════════════

// ─────────────────────────────────────────────────────────────
// DIFICULTAD DEL RIVAL — basada en la "fuerza" del equipo elegido
// ─────────────────────────────────────────────────────────────
// Devuelve un valor continuo 0..1: 0 = equipo más débil (IA fácil),
// 1 = equipo más fuerte (IA difícil). Reemplaza el viejo switch
// manual "IA Difícil" — ahora la dificultad depende del rival.
function _dificultadIA() {
  if (typeof equipoRival !== "undefined" && equipoRival && typeof equipoRival.fuerza === "number") {
    return Math.max(0, Math.min(1, equipoRival.fuerza / 100));
  }
  return 0.5; // sin equipo asignado todavía: dificultad neutra
}

// ─────────────────────────────────────────────────────────────
// MEMORIA / PERFIL DEL JUGADOR (persiste durante la partida)
// ─────────────────────────────────────────────────────────────
// Un truquero de verdad se acuerda de lo que vio. Esta memoria hace
// que la IA deje de ser un umbral fijo memorizable: lee cómo abre el
// humano y cuánto canta, y ajusta su riesgo en consecuencia.
const IA_MEM = {
  cartasJugadorVistas: 0,
  sumaFuerzaJugador:   0,
  altasJugadorVistas:  0,   // cartas f>=10 que jugó el humano
  aperturas:           0,   // cuántas manos vimos su 1ª carta
  sumaApertura:        0,   // suma de fuerza de esas aperturas
  envidoCantadosJugador: 0, // veces que el humano INICIÓ envido
  trucoCantadosJugador:  0, // veces que el humano INICIÓ truco
  manosJugadas:        0,
  _rondasVistas:       new Set(),
  _aperturaContada:    false,
  _envidoContado:      false,
  _trucoContado:       false,
};

function _iaLimpiarMano() {
  IA_MEM._rondasVistas    = new Set();
  IA_MEM._aperturaContada = false;
  IA_MEM._envidoContado   = false;
  IA_MEM._trucoContado    = false;
}

function iaResetMemoria() {
  IA_MEM.cartasJugadorVistas   = 0;
  IA_MEM.sumaFuerzaJugador     = 0;
  IA_MEM.altasJugadorVistas    = 0;
  IA_MEM.aperturas             = 0;
  IA_MEM.sumaApertura          = 0;
  IA_MEM.envidoCantadosJugador = 0;
  IA_MEM.trucoCantadosJugador  = 0;
  IA_MEM.manosJugadas          = 0;
  _iaLimpiarMano();
}

// Registra las cartas del humano ya visibles en la mesa que todavía no
// contamos. Se llama al inicio de cada acción de la IA.
function _iaObservar() {
  const arr = S.cartasRondaJugador || [];
  for (let i = 0; i < arr.length; i++) {
    const c = arr[i];
    if (!c || IA_MEM._rondasVistas.has(i)) continue;
    IA_MEM._rondasVistas.add(i);
    const f = C[c] ? C[c].f : 0;
    IA_MEM.cartasJugadorVistas++;
    IA_MEM.sumaFuerzaJugador += f;
    if (f >= 10) IA_MEM.altasJugadorVistas++;
    if (i === 0 && !IA_MEM._aperturaContada) {
      IA_MEM._aperturaContada = true;
      IA_MEM.aperturas++;
      IA_MEM.sumaApertura += f;
    }
  }
}

// Fuerza media con la que ABRE el humano (0..14). Sin datos: 7 (neutro).
// Si abre siempre bajo, la IA infiere que esconde o que es flojo.
function _aperturaMediaJugador() {
  return IA_MEM.aperturas > 0 ? IA_MEM.sumaApertura / IA_MEM.aperturas : 7;
}

// Agresividad del humano en cantos: 0 = pasivo (se achica), 1 = cantador.
// Con menos de 2 manos de muestra devuelve 0.5 (neutro).
function _agresividadJugador() {
  if (IA_MEM.manosJugadas < 2) return 0.5;
  const tasa = (IA_MEM.envidoCantadosJugador + IA_MEM.trucoCantadosJugador) / IA_MEM.manosJugadas;
  return Math.max(0, Math.min(1, tasa / 1.2)); // ~1.2 cantos/mano = muy agresivo
}

// ─────────────────────────────────────────────────────────────
// ESTADO DEL PARTIDO — "las malas y las buenas"
// ─────────────────────────────────────────────────────────────
// Un truquero perdiendo se juega la vida; ganando, achica. La IA no
// miraba la DIFERENCIA de puntos, solo la falta absoluta. Esto le da
// esa dimensión: devuelve empujones al riesgo según el marcador.
//   envido: delta de probabilidad (±)   truco: delta de score (±, escala 0-100)
//   bluff:  multiplicador del faroleo
function _modRiesgo() {
  const faltaN = S.limitePuntos - S.puntosRival;
  const faltaJ = S.limitePuntos - S.puntosJugador;
  const diff   = S.puntosRival - S.puntosJugador; // >0 vamos ganando
  let envido = 0, truco = 0, bluff = 1;

  // En las malas: perdiendo feo o el humano a punto de cerrar → agresivo.
  if (diff <= -5 || faltaJ <= 5)      { envido += 0.08; truco += 6; bluff = 1.5; }
  else if (diff <= -2)                { envido += 0.04; truco += 3; bluff = 1.2; }
  // En las buenas: cómodo arriba → achica y asegura.
  if (diff >= 5 && faltaN > 5)        { envido -= 0.05; truco -= 4; bluff = 0.7; }
  // A punto de ganar: no regalar la partida con un farol.
  if (faltaN <= 3)                    { truco -= 3; bluff = Math.min(bluff, 0.8); }
  return { envido, truco, bluff };
}

// ─────────────────────────────────────────────────────────────
// PROBABILIDAD DE GANAR EL ENVIDO — modelo, no umbral fijo
// ─────────────────────────────────────────────────────────────
// Curva logística sobre la distribución típica del envido de 2 cartas
// (media del rival ~20-21, 33 casi imbatible). Si el humano fue quien
// cantó, su envido suele ser mejor → bajamos la estimación, más aún si
// es un jugador agresivo (canta con menos).
function _probGanarEnvido(tantos, humanoInicio) {
  let p = 1 / (1 + Math.exp(-(tantos - 21) / 3.2));
  if (humanoInicio) p -= 0.10 * (0.5 + _agresividadJugador());
  return Math.max(0.02, Math.min(0.98, p));
}

// ─────────────────────────────────────────────────────────────
// RETRUCO — solo con ventaja REAL de tablero (ya no es reflejo)
// ─────────────────────────────────────────────────────────────
// Antes: tras aceptar truco, si score>=72 tiraba retruco en 45%*dif
// SIEMPRE, aunque fuera perdiendo la mano. Era explotable (tirabas bajo
// post-truco y no pasaba nada). Ahora exige haber ganado la 1ª ronda o
// tener mano bomba, y contempla el robo puro contra un humano pasivo.
function _considerarRetrucoTrasAceptar() {
  if (S.juegoTerminado) return;
  if (S.nivelTruco !== 2 || S.cantoPendiente) { evaluarTurnoActual(); return; }

  const score  = _scoreTruco(S.manoRival);
  const dif    = _dificultadIA();
  const ganoR0 = S.ganadoresRonda[0] === "rival";
  const mod    = _modRiesgo();
  const agr    = _agresividadJugador();

  let prob = 0;
  if (ganoR0 && score >= 62)  prob = 0.28 + 0.34 * dif;            // ventaja real
  else if (score >= 80)       prob = 0.16 + 0.24 * dif;            // mano bomba
  else if (agr < 0.35)        prob = 0.07 + 0.11 * dif;             // robo a pasivo
  prob *= mod.bluff;                                                 // bluff se aplica una sola vez, a todas las ramas

  if (Math.random() < prob) {
    setTimeout(() => {
      if (!S.juegoTerminado && !S.cantoPendiente) {
        showToast(`${AVATARS[S.idRival].name}: ¡RETRUCO!`);
        if (typeof mostrarOverlayCanto === "function") mostrarOverlayCanto("¡RETRUCO!", "rival");
        if (typeof fraseRivalCanto === "function") fraseRivalCanto("retruco");
        if (typeof playSound === "function") playSound("silbato");
        S.cantoPendiente      = "truco";
        S.quienCantoPendiente = "rival";
        S.ultimoEnCantarTruco = "rival";
        S.nivelTruco          = 3;
        actualizarTodaLaInterfaz();
        evaluarTurnoActual();
      } else if (!S.juegoTerminado) {
        evaluarTurnoActual();
      }
    }, 700);
  } else {
    evaluarTurnoActual();
  }
}

// Enganches al bus del motor: resetear memoria al empezar partida y
// limpiar el estado por-mano en cada reparto. No toca juego.js.
if (typeof onJuego === "function") {
  onJuego("nuevoPartido",  iaResetMemoria);
  onJuego("manoRepartida", () => { _iaLimpiarMano(); IA_MEM.manosJugadas++; });
}

// ─────────────────────────────────────────────────────────────
// EVALUACIÓN DE LA MANO
// ─────────────────────────────────────────────────────────────

/**
 * Devuelve la fuerza máxima entre las cartas disponibles (no jugadas).
 */
function obtenerFuerzaMaximaMano(mano) {
  return mano.reduce((max, c) => (c && C[c].f > max ? C[c].f : max), 0);
}

/**
 * Devuelve la segunda carta más fuerte (para evaluar consistencia).
 */
function _segundaFuerza(mano) {
  const fs = mano.filter(Boolean).map(c => C[c].f).sort((a, b) => b - a);
  return fs[1] ?? 0;
}

/**
 * Score de truco 0-100.
 * Tiene en cuenta la mejor carta, la segunda y cuántas rondas ganó ya.
 */
function _scoreTruco(mano) {
  const max    = obtenerFuerzaMaximaMano(mano);
  const seg    = _segundaFuerza(mano);
  const ganadas = S.ganadoresRonda.filter(g => g === "rival").length;
  // Base: mejor carta pesa 60%, segunda 25%, rondas ganadas 15%
  const base = (max / 14) * 60 + (seg / 14) * 25 + ganadas * 15;
  return Math.min(100, base);
}

/**
 * Probabilidad estimada de ganar el truco considerando las cartas ya jugadas.
 * Compara la mejor carta disponible vs la mejor carta que puede tener el humano.
 */
function _probGanarTruco() {
  const miMejor    = obtenerFuerzaMaximaMano(S.manoRival);
  // Fuerza del humano: si ya tiró, usamos su carta más alta vista como piso.
  // Si no tiró nada, usamos su APERTURA MEDIA histórica (memoria) en vez de
  // un 7 fijo: contra un humano que abre siempre fuerte, la IA es más cauta.
  const cartasTiradasJ = S.cartasRondaJugador.filter(Boolean);
  const fuerzaVistaJ   = cartasTiradasJ.length > 0
    ? Math.max(...cartasTiradasJ.map(c => C[c].f))
    : _aperturaMediaJugador();
  const ganoUna  = S.ganadoresRonda.filter(g => g === "rival").length >= 1;
  const perdioUna = S.ganadoresRonda.filter(g => g === "jugador").length >= 1;
  let base = miMejor / (fuerzaVistaJ + 1);
  if (ganoUna)   base += 0.15;
  if (perdioUna) base -= 0.12; // ir abajo en la mano baja la chance real
  return Math.max(0, Math.min(1, base));
}

/**
 * ¿Conviene cantar/aceptar envido?
 * Devuelve un objeto { decision: 'quiero'|'no-quiero'|'subir', tipo }
 */
function _decidirEnvido() {
  // BUG FIX: usar mano inicial — la mano actual puede tener nulls (si mano ya tiró).
  const tantosReales = calcularEnvido(S.manoRivalInicial || S.manoRival);
  // Ser MANO gana los empates: un jugador real sabe que con la misma
  // cantidad de tantos vale más ir de mano que de pie. Ajustamos el tanto
  // "efectivo" con el que la IA toma la decisión (no toca el real que se
  // compara en la mesa, solo su criterio de riesgo).
  const esMano  = S.turnoMano === "rival";
  const tantos  = tantosReales + (esMano ? 1 : -1);
  const apuesta = S.nivelEnvido;
  // Cuánto nos falta a nosotros y al rival
  const faltaN  = S.limitePuntos - S.puntosRival;
  const faltaJ  = S.limitePuntos - S.puntosJugador;

  // Si rechazar le regala al jugador los puntos que le faltan para ganar,
  // no querer es perder seguro → siempre conviene aceptar y jugársela.
  // (El "no quiero" otorga como mínimo 1 punto al que cantó.)
  if (faltaJ <= 1) {
    return { decision: 'quiero' };
  }
  // Si aceptar puede cerrarnos el partido y tenemos tantos decentes → quiero
  // (sin mirar la mano del jugador: la IA no debe hacer trampa)
  if (apuesta >= faltaN && tantos >= 27) {
    return { decision: 'quiero' };
  }
  // Si el jugador necesita poco y tenemos tantos flojos → arriesgado aceptar
  if (faltaJ <= 4 && tantos < 25) {
    return { decision: 'no-quiero' };
  }

  // Decisión por PROBABILIDAD (no umbral fijo): estimamos la chance de
  // ganar el envido y la corregimos por el estado del partido. El humano
  // (que inició este envido) tiende a tener buen tanto → se descuenta.
  const dif = _dificultadIA();
  const mod = _modRiesgo();
  const p   = _probGanarEnvido(tantos, true) + mod.envido;

  // Muy probable ganar → subir la apuesta (si todavía se puede).
  if (p >= 0.80 && !S.historialEnvido.includes('falta')) {
    const yaReal = S.historialEnvido.includes('real');
    return { decision: 'subir', tipo: yaReal ? 'falta' : 'real' };
  }

  // Aceptar si la chance es favorable (el corte baja con la dificultad).
  if (p >= 0.46 - 0.06 * dif) {
    return { decision: 'quiero' };
  }

  // Faroleo: aceptar igual con tanto flojo. Escala con dificultad y con
  // el estado del partido (en las malas se juega más).
  if (Math.random() < (0.12 + 0.16 * dif) * mod.bluff) {
    return { decision: 'quiero' };
  }

  return { decision: 'no-quiero' };
}

/**
 * ¿Conviene cantar/aceptar/subir la flor?
 * Devuelve un objeto { decision: 'quiero'|'no-quiero'|'subir', tipo }
 * Espejo de _decidirEnvido() pero con la escala de la Flor:
 *   historialFlor = ['flor']                  → quiero (3) o subir a 'contraflor' (6)
 *   historialFlor = ['flor','contraflor']     → quiero (6), subir a 'contraflorresto' (resto) o no-quiero (pierde 3)
 *   historialFlor = [...,'contraflorresto']   → quiero (resto) o no-quiero (pierde 6)
 * La Flor en truco argentino va de 20 a 33 puntos (20 = floja, 33 = la mejor posible).
 */
function _decidirFlor() {
  const tantos = calcularFlor(S.manoRivalInicial || S.manoRival);
  const dif    = _dificultadIA();
  const stage  = S.historialFlor.length;
  const faltaN = S.limitePuntos - S.puntosRival;
  const faltaJ = S.limitePuntos - S.puntosJugador;

  const umbralSubir = 30 - 2 * dif; // difícil(1)=28 .. fácil(0)=30

  if (stage <= 1) {
    // Responde a "Flor": quiero (3) o contraflor (sube a 6)
    if (tantos >= umbralSubir && Math.random() < 0.5 + 0.3 * dif) {
      return { decision: 'subir', tipo: 'contraflor' };
    }
    return { decision: 'quiero' };
  }

  if (stage === 2) {
    // Responde a "Contraflor": quiero (6), contraflorresto (al resto) o no-quiero (pierde 3)
    if (faltaJ <= 3) return { decision: 'quiero' }; // no querer casi regala lo mismo: jugársela
    if (tantos >= umbralSubir + 2 && Math.random() < 0.35 * dif) {
      return { decision: 'subir', tipo: 'contraflorresto' };
    }
    if (tantos >= 24 - 2 * dif) return { decision: 'quiero' };
    return { decision: 'no-quiero' };
  }

  // stage >= 3: Responde a "Contraflor al Resto": quiero (resto) o no-quiero (pierde 6)
  if (faltaN <= 6 || tantos >= 28 - 2 * dif) return { decision: 'quiero' };
  return { decision: 'no-quiero' };
}

/**
 * ¿Conviene cantar/aceptar truco?
 * Devuelve true/false.
 */
function _decidirAceptarTruco() {
  const prob   = _probGanarTruco();
  const dif    = _dificultadIA();
  const umbral = 0.48 - 0.10 * dif; // difícil(1)=0.38 .. fácil(0)=0.48
  // Si ya ganamos la primera ronda → más dispuestos a aceptar
  const bonus  = S.ganadoresRonda[0] === "rival" ? 0.12 : 0;
  return (prob + bonus) >= umbral || (Math.random() < 0.12 * dif);
}

// ─────────────────────────────────────────────────────────────
// TURNO PRINCIPAL
// ─────────────────────────────────────────────────────────────

function turnoRival() {
  if (S.juegoTerminado) return;
  // En modo online el "rival" es un humano conectado por red, no la IA:
  // turnoRival() no debe actuar (antes esto se hacía wrappeando la función
  // desde motor_online.js).
  if (S.modoOnline) return;

  const thinking = document.getElementById("thinking");
  if (thinking) thinking.classList.add("show");

  // Delay variable y CON SENTIDO: una jugada obvia sale rápido, una
  // decisión difícil (responder un truco/envido, o tirar con varias
  // cartas en juego) se demora más. Así el rival no se siente robótico.
  const espera = _delayPensar();

  setTimeout(() => {
    if (thinking) thinking.classList.remove("show");
    if (S.juegoTerminado) return;

    _iaObservar(); // memoria: registrar lo que el humano dejó en la mesa

    if (S.cantoPendiente && S.quienCantoPendiente === "jugador") {
      logicaRespuestaRival();
    } else {
      logicaOfensivaRival();
    }
  }, espera);
}

// ─────────────────────────────────────────────────────────────
// TEMPO — cuánto "piensa" el rival antes de actuar
// ─────────────────────────────────────────────────────────────
// Devuelve los milisegundos de espera según lo difícil que sea la
// jugada. Le suma una pizca de azar para que nunca sea idéntico.
function _delayPensar() {
  const dif  = _dificultadIA();
  const rnd  = (a, b) => a + Math.random() * (b - a);
  const cartasEnMano = S.manoRival.filter(Boolean).length;

  // 1) Tiene que RESPONDER un canto → es lo que más se piensa.
  if (S.cantoPendiente && S.quienCantoPendiente === "jugador") {
    if (S.cantoPendiente === "flor")   return rnd(700, 1100);   // casi automático
    if (S.cantoPendiente === "envido") return rnd(1100, 2300);  // medir los tantos
    if (S.cantoPendiente === "truco")  return rnd(1300, 2600);  // la decisión más jugada
  }

  // 2) Última carta sin nada que decidir → la tira casi al toque.
  if (cartasEnMano <= 1) return rnd(350, 700);

  // 3) Primera ronda con envido/flor en juego → evalúa si canta.
  if (S.rondaActual === 0 && !S.rivalTiroEnR0 && envidoSigueVivo()) {
    return rnd(900, 1900);
  }

  // 4) Jugada común: depende un poco de la dificultad (el fuerte "piensa" más).
  return rnd(600, 1200 + 500 * dif);
}

// ─────────────────────────────────────────────────────────────
// RESPUESTA A CANTOS DEL JUGADOR
// ─────────────────────────────────────────────────────────────

function logicaRespuestaRival() {

  // ── FLOR ──────────────────────────────────────────────────
  if (S.cantoPendiente === "flor") {
    const res = _decidirFlor();

    if (res.decision === 'subir') {
      const labels = { contraflor: '¡CONTRAFLOR!', contraflorresto: '¡CONTRAFLOR AL RESTO!' };
      showToast(`${AVATARS[S.idRival].name}: ${labels[res.tipo]}`);
      if (typeof mostrarOverlayCanto === "function") mostrarOverlayCanto(labels[res.tipo], "rival");
      if (typeof fraseRivalCanto==="function") fraseRivalCanto(res.tipo);
      _registrarCantoFlor(res.tipo);
      S.quienCantoPendiente = "rival"; // ahora el jugador tiene que responder
      actualizarTodaLaInterfaz();
      evaluarTurnoActual();
      return;
    }

    if (res.decision === 'quiero') {
      showToast(`${AVATARS[S.idRival].name}: ¡CON FLOR QUIERO!`);
      if (typeof mostrarOverlayCanto === "function") mostrarOverlayCanto("¡CON FLOR QUIERO!", "rival");
      if (typeof fraseRivalCanto==="function") fraseRivalCanto("quiero");
      resolverFlorMesa("quiero");
    } else {
      showToast(`${AVATARS[S.idRival].name}: NO QUIERO.`);
      if (typeof mostrarOverlayCanto === "function") mostrarOverlayCanto("NO QUIERO", "rival");
      if (typeof fraseRivalCanto==="function") fraseRivalCanto("noQuiero");
      resolverFlorMesa("no-quiero");
    }
    return;
  }

  // ── ENVIDO ────────────────────────────────────────────────
  if (S.cantoPendiente === "envido") {
    // Memoria: el humano inició envido esta mano (una sola vez).
    if (!IA_MEM._envidoContado) { IA_MEM.envidoCantadosJugador++; IA_MEM._envidoContado = true; }
    const res = _decidirEnvido();

    if (res.decision === 'subir') {
      // Sube la apuesta
      const label = res.tipo === 'real' ? '¡REAL ENVIDO!' : '¡FALTA ENVIDO!';
      showToast(`${AVATARS[S.idRival].name}: ${label}`);
      if (typeof mostrarOverlayCanto === "function") mostrarOverlayCanto(label, "rival");
      if (typeof fraseRivalCanto==="function") fraseRivalCanto(res.tipo);
      _registrarCantoEnvido(res.tipo);
      S.envidoCantado       = true;
      S.cantoPendiente      = "envido";
      S.quienCantoPendiente = "rival";
      actualizarTodaLaInterfaz();
      evaluarTurnoActual();
      return;
    }

    if (res.decision === 'quiero') {
      showToast(`${AVATARS[S.idRival].name}: ¡QUIERO!`);
      if (typeof mostrarOverlayCanto === "function") mostrarOverlayCanto("¡QUIERO!", "rival");
      if (typeof fraseRivalCanto==="function") fraseRivalCanto("quiero");
      resolverEnvidoMesa("quiero");
    } else {
      showToast(`${AVATARS[S.idRival].name}: NO QUIERO.`);
      if (typeof mostrarOverlayCanto === "function") mostrarOverlayCanto("NO QUIERO", "rival");
      if (typeof fraseRivalCanto==="function") fraseRivalCanto("noQuiero");
      resolverEnvidoMesa("no-quiero");
    }
    return;
  }

  // ── TRUCO ─────────────────────────────────────────────────
  if (S.cantoPendiente === "truco") {

    // Memoria: el humano inició/subió truco esta mano (una sola vez).
    if (!IA_MEM._trucoContado) { IA_MEM.trucoCantadosJugador++; IA_MEM._trucoContado = true; }

    // "La flor está primero": tiene prioridad sobre el envido. Si el rival
    // tiene flor sin cantar todavía, la canta ahora y el truco queda en espera.
    if (typeof puedeResponderTrucoConFlor === "function" && puedeResponderTrucoConFlor("rival")) {
      responderTrucoConFlor("rival");
      return;
    }

    // "El envido está primero": si el jugador cantó TRUCO en la ronda 0
    // antes de tirar carta y el envido no se cantó todavía, el rival
    // puede preferir cantar envido y dejar el truco en espera.
    if (typeof puedeResponderTrucoConEnvido === "function" && puedeResponderTrucoConEnvido("rival")) {
      const tantosE = calcularEnvido(S.manoRivalInicial || S.manoRival);
      const difE    = _dificultadIA();
      const umbralE = 27 - 3 * difE; // mismo criterio que la ofensiva de envido

      if (tantosE >= umbralE) {
        let tipo = 'envido';
        if (tantosE >= 38 - 5 * difE)      tipo = 'falta';
        else if (tantosE >= 35 - 5 * difE) tipo = 'real';
        responderTrucoConEnvido("rival", tipo);
        return;
      }
    }

    const acepta = _decidirAceptarTruco();

    if (acepta) {
      showToast(`${AVATARS[S.idRival].name}: ¡QUIERO!`);
      if (typeof mostrarOverlayCanto === "function") mostrarOverlayCanto("¡QUIERO!", "rival");
      if (typeof fraseRivalCanto==="function") fraseRivalCanto("quiero");
      S.trucoCantado         = true;
      S.nivelTrucoAceptado   = S.nivelTruco;
      S.ultimoEnAceptarTruco = "rival";
      S.cantoPendiente       = null;
      S.quienCantoPendiente  = null;
      guardarProgreso();
      actualizarTodaLaInterfaz();

      // Considerar subir a Retruco — solo con ventaja REAL de tablero,
      // nunca como reflejo automático tras aceptar (era explotable).
      // _considerarRetrucoTrasAceptar() se encarga de devolver el turno
      // en todos los casos (cante o no cante).
      _considerarRetrucoTrasAceptar();
    } else {
      showToast(`${AVATARS[S.idRival].name} se fue al mazo.`);
      if (typeof mostrarOverlayCanto === "function") mostrarOverlayCanto("AL MAZO", "rival");
      if (typeof fraseRivalCanto==="function") fraseRivalCanto("mazo");
      irseAlMazo("rival");
    }
    return;
  }
}

// ─────────────────────────────────────────────────────────────
// INICIATIVA OFENSIVA
// ─────────────────────────────────────────────────────────────

function logicaOfensivaRival() {
  // BUG FIX: usar mano inicial para calcular tantos de envido.
  // Si el rival ya tiró una carta (siendo mano), la mano actual tiene un null
  // y calcularEnvido daría un score incorrecto.
  const manoEval = S.manoRivalInicial || S.manoRival;
  const tantos  = calcularEnvido(manoEval);
  const score   = _scoreTruco(S.manoRival);

  // ── A0. FLOR ──────────────────────────────────────────────
  // "La flor está primero": si el rival tiene flor y todavía no se
  // cantó, la canta antes que nada. Mínimo vale 3 puntos, así que
  // siempre conviene cantarla.
  if (florSigueVivo() && !S.rivalTiroEnR0 && S.rivalTieneFlor && !S.florCantada) {
    showToast(`${AVATARS[S.idRival].name} canta: ¡FLOR!`);
    if (typeof mostrarOverlayCanto === "function") mostrarOverlayCanto("¡FLOR!", "rival");
    if (typeof fraseRivalCanto==="function") fraseRivalCanto("flor");
    _registrarCantoFlor('flor');
    S.florCantada = true;

    if (!S.jugadorTieneFlor) {
      _resolverFlorSinContrincante("rival");
      return;
    }

    S.cantoPendiente      = "flor";
    S.quienCantoPendiente = "rival";
    actualizarTodaLaInterfaz();
    evaluarTurnoActual();
    return;
  }

  // ── A. ENVIDO ─────────────────────────────────────────────
  // Solo ronda 0, antes de tirar, envido no cantado ni terminado
  if (envidoSigueVivo() && !S.rivalTiroEnR0 && !S.envidoCantado) {

    const difO   = _dificultadIA();
    const mod    = _modRiesgo();
    const agr    = _agresividadJugador();
    // Ser mano gana los empates → la IA se anima a cantar con un punto menos.
    const tantosEf = tantos + (S.turnoMano === "rival" ? 1 : -1);
    const p = _probGanarEnvido(tantosEf, false) + mod.envido;

    // Canta si la chance es buena; el corte baja con la dificultad.
    let debeCantar = p >= (0.54 - 0.10 * difO);
    // ROBO: contra un humano pasivo (que se achica) canta de farol con
    // tanto flojo para llevarse el punto gratis. Es el engaño que faltaba.
    if (!debeCantar && p < 0.42) {
      const probRobo = (0.10 + 0.16 * difO) * (1 - agr) * mod.bluff;
      if (Math.random() < probRobo) debeCantar = true;
    }

    if (debeCantar) {
      // Elige qué canto lanzar según los tantos (umbrales de "real"/"falta"
      // se acercan a lo alcanzable cuanto más fuerte es el rival)
      let tipo = 'envido';
      if (tantos >= 38 - 5 * difO)      tipo = 'falta';
      else if (tantos >= 35 - 5 * difO) tipo = 'real';

      const labels = { envido: '¡ENVIDO!', real: '¡REAL ENVIDO!', falta: '¡FALTA ENVIDO!' };
      showToast(`${AVATARS[S.idRival].name} canta: ${labels[tipo]}`);
      if (typeof mostrarOverlayCanto === "function") mostrarOverlayCanto(labels[tipo], "rival");
      if (typeof fraseRivalCanto==="function") fraseRivalCanto(tipo);
      _registrarCantoEnvido(tipo);
      S.envidoCantado       = true;
      S.cantoPendiente      = "envido";
      S.quienCantoPendiente = "rival";
      actualizarTodaLaInterfaz();
      evaluarTurnoActual();
      return;
    }
  }

  // ── B. TRUCO ──────────────────────────────────────────────
  const nivelDisponible = _nivelTrucoDisponible("rival");
  if (nivelDisponible !== null && !S.cantoPendiente) {
    const difB        = _dificultadIA();
    const mod         = _modRiesgo();
    const agr         = _agresividadJugador();
    const umbralScore = 62 - 10 * difB; // difícil(1)=52 .. fácil(0)=62
    // Más dispuesto a cantar si ya ganó una ronda
    const bonus       = S.ganadoresRonda[0] === "rival" ? 8 : 0;
    // Menos dispuesto si ya perdió la primera ronda
    const penalizacion = S.ganadoresRonda[0] === "jugador" ? 12 : 0;
    // El estado del partido (mod.truco) empuja el score efectivo: en las
    // malas canta con menos; cómodo arriba, achica.
    const efectivo    = score + bonus - penalizacion + mod.truco;
    const prob        = (0.42 + 0.18 * difB) * mod.bluff;

    let debeCantar = efectivo >= umbralScore && Math.random() < prob;
    // ROBO de truco: humano pasivo + mano no tan buena → farol para
    // arrancarle un "no quiero". Meta-bluff contra el que se achica.
    if (!debeCantar && efectivo < umbralScore && agr < 0.40) {
      const probRobo = (0.08 + 0.14 * difB) * (1 - agr) * mod.bluff;
      if (Math.random() < probRobo) debeCantar = true;
    }

    if (debeCantar) {
      const labels = { 2: "¡TRUCO!", 3: "¡RETRUCO!", 4: "¡VALE 4!" };
      showToast(`${AVATARS[S.idRival].name} canta: ${labels[nivelDisponible]}`);
      if (typeof mostrarOverlayCanto === "function") mostrarOverlayCanto(labels[nivelDisponible], "rival");
      if (typeof fraseRivalCanto==="function") {
        fraseRivalCanto(nivelDisponible >= 3 ? "retruco" : "truco");
      }
      if (typeof playSound==="function") playSound("silbato");
      S.cantoPendiente       = "truco";
      S.quienCantoPendiente  = "rival";
      S.ultimoEnCantarTruco  = "rival";
      S.nivelTruco           = nivelDisponible;
      actualizarTodaLaInterfaz();
      evaluarTurnoActual();
      return;
    }
  }

  // ── C. TIRAR CARTA ────────────────────────────────────────
  tirarCartaRival();
}

// ─────────────────────────────────────────────────────────────
// ESTRATEGIA DE CARTA
// ─────────────────────────────────────────────────────────────

function tirarCartaRival() {
  let indices = S.manoRival
    .map((c, i) => c !== null ? i : -1)
    .filter(i => i !== -1);
  if (indices.length === 0) return;

  const cartaJugador = S.cartasRondaJugador[S.rondaActual];
  const rondas       = S.ganadoresRonda;
  const ganadas      = rondas.filter(g => g === "rival").length;
  const perdidas     = rondas.filter(g => g === "jugador").length;

  // Ordenar de menor a mayor fuerza (índice 0 = más débil)
  indices.sort((a, b) => C[S.manoRival[a]].f - C[S.manoRival[b]].f);

  let chosenIdx;

  // Cuanto más fuerte el rival, más probable que use la estrategia avanzada
  if (Math.random() >= _dificultadIA()) {
    // ── MODO SIMPLE ────────────────────────────────
    if (cartaJugador) {
      const fH = C[cartaJugador].f;
      // Intenta ganar con la carta más débil que supere al humano
      const ganadora = indices.find(i => C[S.manoRival[i]].f > fH);
      chosenIdx = ganadora !== undefined ? ganadora : indices[0];
    } else {
      // Va primero. Antes tiraba SIEMPRE la más débil → era cantado.
      // Ahora varía: la mayoría de las veces guarda las buenas tirando
      // bajo, pero a veces "miente" abriendo con una carta alta para
      // intimidar (faroleo), o tira una intermedia para despistar.
      const r = Math.random();
      if (indices.length >= 3 && r < 0.18) {
        chosenIdx = indices[indices.length - 1];   // farol: abre fuerte
      } else if (indices.length >= 3 && r < 0.38) {
        chosenIdx = indices[1];                     // intermedia: despista
      } else {
        chosenIdx = indices[0];                     // lo clásico: la más débil
      }
    }

  } else {
    // ── MODO ESTRATÉGICO ─────────────────────────
    chosenIdx = _elegirCartaDificil(indices, cartaJugador, ganadas, perdidas);
  }

  jugarCartaRivalFisico(chosenIdx);
}

function _elegirCartaDificil(indices, cartaJugador, ganadas, perdidas) {
  const totalRondas = S.rondaActual; // rondas ya cerradas

  // ── Situación de "partido": ya ganó una ronda ─────────────
  // Si ganó primera y va segunda, puede tirar lo mínimo para ganar
  // (guardar la buena para la tercera si hace falta)
  if (ganadas >= 1 && cartaJugador) {
    const fH = C[cartaJugador].f;
    const ganadora = indices.find(i => C[S.manoRival[i]].f > fH);
    if (ganadora !== undefined) return ganadora; // gana con lo justo
    return indices[0]; // no puede ganar, tira la más baja (conserva la buena)
  }

  // ── Perdió la primera: necesita ganar las dos restantes ──
  if (perdidas >= 1 && ganadas === 0) {
    if (cartaJugador) {
      const fH = C[cartaJugador].f;
      const ganadora = indices.find(i => C[S.manoRival[i]].f > fH);
      // Sí puede ganar → gana con lo justo para guardar la mejor para la 3ª
      if (ganadora !== undefined) return ganadora;
      // No puede ganar → tira la más débil (no desperdiciar la buena)
      return indices[0];
    } else {
      // Va primero y ya perdió una → tira la MEJOR para asegurarse
      return indices[indices.length - 1];
    }
  }

  // ── Primera ronda sin info (el rival va primero) ──────────
  // La apertura depende de la FUERZA real de la mano, no de porcentajes
  // fijos (eso era lo cantado). Engaño en ambas direcciones:
  if (!cartaJugador && totalRondas === 0) {
    const score = _scoreTruco(S.manoRival);
    // Mano BOMBA → la esconde tirando bajo ("guardar el ancho"): induce al
    // humano a cantar o a confiarse. Es el meta-bluff que faltaba.
    if (score >= 78 && indices.length >= 2 && Math.random() < 0.6) {
      return indices[0];
    }
    // Mano FLOJA → a veces abre fuerte para intimidar (farol clásico).
    if (score < 45 && indices.length >= 3 && Math.random() < 0.28) {
      return indices[indices.length - 1];
    }
    // Mezcla por defecto para no ser leíble.
    if (indices.length >= 3 && Math.random() < 0.25) return indices[1];
    if (Math.random() < 0.55) return indices[0];
    return indices[indices.length - 1];
  }

  // ── Rondas 1 y 2 con empate previo ───────────────────────
  if (cartaJugador) {
    const fH = C[cartaJugador].f;
    const ganadora = indices.find(i => C[S.manoRival[i]].f > fH);
    if (ganadora !== undefined) return ganadora;
    return indices[0];
  }

  // ── Fallback: si va primero en rondas 1-2 ────────────────
  // Tira la mejor disponible
  return indices[indices.length - 1];
}
