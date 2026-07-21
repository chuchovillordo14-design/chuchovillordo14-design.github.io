// ══════════════════════════════════════════════
// BUS DE EVENTOS DEL MOTOR
// ══════════════════════════════════════════════
// Otros módulos (liga.js, motor_online.js, figuritas.js, etc.) se
// suscriben a eventos del motor con onJuego(evento, cb) en vez de
// "wrappear" (parchear) las funciones globales del motor. Evita que se
// acumulen cadenas de wrappers que se pisan entre sí a medida que
// crecen los módulos.
//
// Eventos emitidos:
//   'finDePartido' → al llegar al límite de puntos.
//                     payload: { puntosJugador, puntosRival, limite }
//   'nuevoPartido' → al arrancar un partido desde cero. Sin payload.
//   'render'       → al final de cada actualizarTodaLaInterfaz(). Sin payload.
//   'modalAbierto' → al abrir un modal con openModal(id).
//                     payload: { id }
const EVENTOS_JUEGO = {};

// Suscribe cb al evento dado. Devuelve una función para desuscribirse.
function onJuego(evento, cb) {
  (EVENTOS_JUEGO[evento] = EVENTOS_JUEGO[evento] || []).push(cb);
  return () => offJuego(evento, cb);
}

// Desuscribe cb del evento dado (no-op si no estaba suscripto).
function offJuego(evento, cb) {
  const subs = EVENTOS_JUEGO[evento];
  if (!subs) return;
  const i = subs.indexOf(cb);
  if (i !== -1) subs.splice(i, 1);
}

function _emitJuego(evento, data) {
  // Copiamos el array antes de iterar: si un callback se desuscribe
  // (o suscribe a otro) durante el emit, no rompe la iteración.
  (EVENTOS_JUEGO[evento] || []).slice().forEach(cb => {
    try { cb(data); } catch (e) { console.error(`evento '${evento}':`, e); }
  });
}

// Avisa a la tribuna que festeje un lado ('jugador' | 'rival').
//   tipo: 'ronda' (gol chico) | 'envido' | 'mano' (gol grande) | 'mazo'
// tribuna.js se suscribe a 'golTribuna' y hace reaccionar a la hinchada.
function _tribuna(lado, tipo) {
  if (typeof _emitJuego === "function") _emitJuego("golTribuna", { lado, tipo });
}

// ══════════════════════════════════════════════
// ESTADO GLOBAL DEL JUEGO (SINGLETON)
// ══════════════════════════════════════════════
const S = {
  nombreJugador: "Vos",
  avatarJugador: "🤠",
  idRival: 0,

  puntosJugador: 0,
  puntosRival:   0,
  limitePuntos:  30,

  manoJugador: [],
  manoRival:   [],
  manoJugadorInicial: [], // copia de la mano antes de jugar cartas (para reveal envido/flor)
  manoRivalInicial:   [],

  cartasRondaJugador: [],   // null o cartaId por ronda
  cartasRondaRival:   [],
  ganadoresRonda:     [],   // 'jugador' | 'rival' | 'parda'

  rondaActual:  0,          // 0 1 2
  turnoActual:  "jugador",  // 'jugador' | 'rival'
  turnoMano:    "jugador",  // quién es mano esta mano

  // ── ENVIDO ────────────────────────────────────────────
  // Estado de la cadena de envido
  // nivelEnvido: acumula puntos apostados según la cadena
  //   Envido        → +2 (total apuesta: 2)
  //   Envido+Envido → +2 (total apuesta: 4)
  //   Real Envido   → +3 (total apuesta: sobre lo anterior)
  //   Falta Envido  → todo lo que falta para terminar
  envidoCantado:    false,  // se cantó alguna vez en esta mano
  envidoTerminado:  false,
  nivelEnvido:      0,      // puntos en juego actualmente si se acepta
  historialEnvido:  [],     // ['envido','envido','real','falta'] — cantos hechos
  jugadorTiroEnR0:  false,  // el jugador ya tiró carta en ronda 0
  rivalTiroEnR0:    false,

  // ── TRUCO ─────────────────────────────────────────────
  // nivelTruco: puntos que valen si se acepta el canto actual
  //   Sin cantar  → 1
  //   Truco       → 2
  //   Retruco     → 3
  //   Vale 4      → 4
  // trucoCantado: se aceptó algún nivel de truco
  // nivelTrucoAceptado: el último nivel aceptado (para saber cuánto vale si alguien se va al mazo)
  trucoCantado:        false,
  nivelTruco:          1,   // nivel ACTUAL cantado (en disputa o aceptado)
  nivelTrucoAceptado:  0,   // último nivel que fue aceptado por "quiero"
  ultimoEnCantarTruco: null,// 'jugador' | 'rival'

  // ── CANTO PENDIENTE ───────────────────────────────────
  // cantoPendiente: qué está esperando respuesta ('envido'|'truco'|null)
  // quienCantoPendiente: quién lo cantó
  cantoPendiente:      null,
  quienCantoPendiente: null,

  // ── "EL ENVIDO ESTÁ PRIMERO" ──────────────────────────
  // Si alguien canta TRUCO en la ronda 0 y el otro todavía puede cantar
  // envido, puede responder con un envido: el truco queda DIFERIDO y
  // se vuelve a poner en juego cuando termina el envido.
  trucoDiferido:       false,
  trucoDiferidoDe:     null,   // quién había cantado el truco diferido

  // ── FLOR ──────────────────────────────────────────────
  // jugadorTieneFlor / rivalTieneFlor: se calculan al repartir (3 cartas
  // del mismo palo en la mano inicial) y no cambian durante la mano.
  // florTerminada: true si no hay flor en juego (nadie tiene, o ya se
  // resolvió, o la regla está desactivada). Mientras sea false, el
  // envido NO se puede cantar ("la flor está primero").
  // nivelFlor / historialFlor: igual que su equivalente de envido
  //   Flor                 → +3 (total apuesta: 3)
  //   Flor+Contraflor      → +3 (total apuesta: 6)
  //   Contraflor al Resto  → todo lo que falta para terminar
  jugadorTieneFlor: false,
  rivalTieneFlor:   false,
  florCantada:      false,
  florTerminada:    true,
  nivelFlor:        0,
  historialFlor:    [],
  // jugadorPasoFlor / rivalPasoFlor: el jugador "se guarda" la flor (achica)
  // en vez de cantarla. No renuncia a los puntos para siempre: si el otro
  // tiene flor y la canta, igual hay que responder con la propia.
  jugadorPasoFlor:  false,
  rivalPasoFlor:    false,

  // revealEnvidoMano: cuando se acepta un envido/flor ("quiero"), guarda los
  // datos para mostrar las cartas reveladas recién al final de la mano (en el
  // overlay de resultado), evitando filtrar las cartas del rival en pleno juego.
  // { titulo, ganoJugador, apuesta, ptsJ, ptsR, cartasJ, cartasR } | null
  revealEnvidoMano: null,

  juegoTerminado: false,

  // ── ONLINE ────────────────────────────────────────────
  // modoOnline: true si esta partida es "Partido Amistoso Online"
  // esHost: true si esta instancia es la autoridad del motor
  // (el "host" corre el motor real; el "invitado" recibe un
  // estado espejado y reenvía sus acciones por red)
  modoOnline: false,
  esHost:     false,

  // ── CONFIG ────────────────────────────────────────────
  cfgFlor:      false,
  cfgChico:     false,
  cfgSonido:    true,
  cfgSideScore: true
};

let ESTADISTICAS = {
  partidasJugadas:  0,
  partidasGanadas:  0,
  partidasPerdidas: 0
};

// ══════════════════════════════════════════════
// PERSISTENCIA
// ══════════════════════════════════════════════

function cargarProgreso() {
  try {
    const raw = localStorage.getItem("truco_data");
    if (!raw) return;
    const p        = JSON.parse(raw);
    ESTADISTICAS   = p.stats        || ESTADISTICAS;
    S.cfgFlor      = !!p.cfgFlor;
    S.cfgChico     = !!p.cfgChico;
    S.cfgSonido    = p.cfgSonido !== false;
    S.cfgSideScore = (p.cfgSideScore !== false);
    S.limitePuntos = S.cfgChico ? 15 : 30;
  } catch(e) { console.error("cargarProgreso:", e); }
}

function guardarProgreso() {
  lsSet("truco_data", JSON.stringify({
    stats: ESTADISTICAS,
    cfgFlor: S.cfgFlor,
    cfgChico: S.cfgChico, cfgSonido: S.cfgSonido,
    cfgSideScore: !!S.cfgSideScore
  }));
}

function resetearGuardadoTotal() { localStorage.clear(); location.reload(); }

// ══════════════════════════════════════════════
// HELPERS DE REGLAS
// ══════════════════════════════════════════════

// Calcula cuántos puntos vale el envido si se acepta ahora
function puntosEnvidoSiQuiero() {
  return S.nivelEnvido;
}

// Calcula cuántos puntos vale el envido si NO se quiere
// Regla oficial: el NQ vale la suma de los cantos ANTERIORES al último.
//   Envido NQ                  → 1
//   Envido→Envido NQ           → 2
//   Envido→Real NQ             → 2
//   Envido→Envido→Real NQ      → 4
//   Envido→Falta NQ            → 2
//   Real→Falta NQ              → 3
function puntosEnvidoNoQuiero() {
  const h = S.historialEnvido;
  if (h.length <= 1) return 1;
  let pts = 0;
  for (let i = 0; i < h.length - 1; i++) {
    if (h[i] === 'envido') pts += 2;
    else if (h[i] === 'real') pts += 3;
  }
  return Math.max(1, pts);
}

function _puntasFaltaEnvido() {
  // Falta envido tradicional "por las malas y por las buenas":
  // en un partido a 30, los primeros 15 son las MALAS y los últimos 15
  // las BUENAS. Si el que va ganando todavía está en las malas, la falta
  // se cuenta solo hasta terminar las malas (15 − sus puntos); si ya
  // entró en las buenas, se cuenta hasta el final del partido.
  // En partido "chico" (15) no hay división: vale lo que falta para 15.
  const lider = Math.max(S.puntosJugador, S.puntosRival);
  if (S.limitePuntos >= 30) {
    const mitad = Math.floor(S.limitePuntos / 2); // 15 en partido a 30
    if (lider < mitad) return Math.max(1, mitad - lider); // por las malas
  }
  return Math.max(1, S.limitePuntos - lider);             // por las buenas
}

// Agrega un canto al historial y actualiza nivelEnvido
function _registrarCantoEnvido(tipo) {
  S.historialEnvido.push(tipo);
  if (tipo === 'envido')  S.nivelEnvido += 2;
  if (tipo === 'real')    S.nivelEnvido += 3;
  // Regla: la Falta Envido vale la falta, pero nunca MENOS que lo ya acumulado
  // en la cadena (envido/real previos). El Math.max lo garantiza — igual que el
  // Contraflor al Resto en _registrarCantoFlor. (Si tu variante juega la falta
  // "pura" aunque valga menos, sacá el S.nivelEnvido del Math.max.)
  if (tipo === 'falta')   S.nivelEnvido = Math.max(1, S.nivelEnvido, _puntasFaltaEnvido());
}

// ── FLOR ────────────────────────────────────────────────────────────────────
// Agrega un canto de flor al historial y actualiza nivelFlor
//   Flor                → +3 (total apuesta: 3)
//   Flor + Contraflor   → +3 (total apuesta: 6)
//   Contraflor al Resto → "lo que falta" para terminar el partido
function _registrarCantoFlor(tipo) {
  S.historialFlor.push(tipo);
  if (tipo === 'flor')                 S.nivelFlor += 3;
  else if (tipo === 'contraflor')      S.nivelFlor += 3;
  else if (tipo === 'contraflorresto') S.nivelFlor = Math.max(S.nivelFlor, _puntasFaltaEnvido());
}

// Puntos de flor si NO se quiere (mismo criterio que puntosEnvidoNoQuiero,
// pero la base es 3 — el valor de la primera Flor — en vez de 1, porque
// la Flor en sí misma siempre vale como mínimo 3).
function puntosFlorNoQuiero() {
  const h = S.historialFlor;
  if (h.length <= 1) return 3;
  let pts = 0;
  for (let i = 0; i < h.length - 1; i++) {
    if (h[i] === 'flor' || h[i] === 'contraflor') pts += 3;
  }
  return Math.max(3, pts);
}

// Devuelve qué nivel de truco puede cantar un jugador ahora
// Regla: solo puede subir quien aceptó el nivel anterior ("quiero" dicho por él)
// Si el rival cantó truco y vos dijiste quiero → vos podés cantar retruco
function _nivelTrucoDisponible(quien) {
  if (S.nivelTrucoAceptado === 0 && !S.trucoCantado) return 2; // puede cantar Truco
  if (S.trucoCantado && S.nivelTrucoAceptado > 0) {
    // Solo puede subir quien fue el último en decir "quiero"
    if (S.ultimoEnAceptarTruco === quien && S.nivelTrucoAceptado < 4) {
      return S.nivelTrucoAceptado + 1;
    }
  }
  return null; // no puede cantar
}

// Puntos de truco si no se quiere: lo cantado - 1
function puntasTrucoNoQuiero() {
  return Math.max(1, S.nivelTruco - 1);
}

// Puntos de truco si se quiere (y se gana la mano): el nivel aceptado
function puntasTrucoGanaMano() {
  return S.nivelTrucoAceptado > 0 ? S.nivelTrucoAceptado : S.nivelTruco;
}

// ══════════════════════════════════════════════
// MOTOR
// ══════════════════════════════════════════════

function seleccionarRivalAleatorio() {
  S.idRival = Math.floor(Math.random() * AVATARS.length);
}

function repartirNuevaMano() {
  if (S.puntosJugador >= S.limitePuntos || S.puntosRival >= S.limitePuntos) {
    S.juegoTerminado = true;
    ESTADISTICAS.partidasJugadas++;
    if (S.puntosJugador >= S.limitePuntos) {
      ESTADISTICAS.partidasGanadas++;
      showToast("🏆 ¡FELICITACIONES! GANASTE EL PARTIDO 🏆");
      playSound("win");
    } else {
      ESTADISTICAS.partidasPerdidas++;
      showToast("❌ El rival ganó el partido. ¡Otra vez será!");
      playSound("lose");
    }
    guardarProgreso();
    actualizarTodaLaInterfaz();
    _emitJuego("finDePartido", {
      puntosJugador: S.puntosJugador,
      puntosRival:   S.puntosRival,
      limite:        S.limitePuntos,
    });
    return;
  }

  const keys = mezclarMazo(Object.keys(C));
  S.manoJugador = [keys[0], keys[1], keys[2]];
  S.manoRival   = [keys[3], keys[4], keys[5]];
  // Guardamos las manos iniciales para el reveal de envido/flor al final
  // (manoJugador/Rival van perdiendo cartas a medida que se juegan)
  S.manoJugadorInicial = [keys[0], keys[1], keys[2]];
  S.manoRivalInicial   = [keys[3], keys[4], keys[5]];

  S.cartasRondaJugador = [null, null, null];
  S.cartasRondaRival   = [null, null, null];
  S.ganadoresRonda     = [];
  S.rondaActual        = 0;

  // Reset envido
  S.envidoCantado       = false;
  S.envidoTerminado     = false;
  S.nivelEnvido         = 0;
  S.historialEnvido     = [];
  S.jugadorTiroEnR0     = false;
  S.rivalTiroEnR0       = false;

  // Reset truco
  S.trucoCantado        = false;
  S.nivelTruco          = 1;
  S.nivelTrucoAceptado  = 0;
  S.ultimoEnCantarTruco = null;
  S.ultimoEnAceptarTruco= null;

  S.cantoPendiente      = null;
  S.quienCantoPendiente = null;
  S.trucoDiferido       = false;
  S.trucoDiferidoDe     = null;

  // Reset reveal de cartas de envido/flor (se vuelve a tapar todo)
  S.revealEnvidoMano    = null;

  // Reset flor — se calcula con las 3 cartas iniciales (mismo palo)
  S.jugadorTieneFlor = (typeof tieneFlor === "function") && tieneFlor(S.manoJugador);
  S.rivalTieneFlor   = (typeof tieneFlor === "function") && tieneFlor(S.manoRival);
  S.florCantada      = false;
  S.jugadorPasoFlor  = false;
  S.rivalPasoFlor    = false;
  S.nivelFlor        = 0;
  S.historialFlor    = [];
  // Si la regla de la flor está apagada, o nadie tiene flor, queda
  // "terminada" de entrada y el envido funciona como siempre.
  S.florTerminada    = !S.cfgFlor || !(S.jugadorTieneFlor || S.rivalTieneFlor);

  S.turnoMano   = S.turnoMano === "jugador" ? "rival" : "jugador";
  S.turnoActual = S.turnoMano;

  playSound("deal");
  actualizarTodaLaInterfaz();
  // Punto seguro para autosalvar la partida 1J (entre manos, nunca a mitad
  // de mano): liga.js/equipos.js se suscriben a este evento para guardar el
  // marcador y poder retomar la partida si se cierra el juego.
  if (typeof _emitJuego === "function") _emitJuego("manoRepartida");
  if (typeof animarReparto === "function") animarReparto();
  setTimeout(evaluarTurnoActual, 650);
}

function evaluarTurnoActual() {
  if (S.juegoTerminado) return;
  if (typeof actualizarIndicadorTurno === "function") actualizarIndicadorTurno();
  renderizarBotonesAccionJugador();
  // BUG FIX: actualizarTodaLaInterfaz() puede haberse llamado ANTES de
  // actualizar S.turnoActual (p.ej. al jugar una carta), dejando el
  // mensaje "...está pensando..." pegado aunque ya cambió el turno.
  // Re-renderizamos la barra de info acá, con el estado ya actualizado.
  if (typeof renderizarInfoBar === "function") renderizarInfoBar();

  // BUG FIX: cuando el rival juega su carta, actualizarTodaLaInterfaz()
  // se llama ANTES de pasar S.turnoActual a "jugador" (ver
  // jugarCartaRivalFisico), por lo que renderizarManoJugador() calcula
  // "puedejugar = false" y las cartas quedan sin la clase can-play ni
  // onclick. Re-renderizamos la mano acá, ya con el turno actualizado,
  // para que el jugador pueda tocar sus cartas sin tener que cantar algo.
  if (typeof renderizarManoJugador === "function") renderizarManoJugador();
  // Barra de comodines del Modo Manager (se habilitan/deshabilitan según turno)
  if (typeof clubPerksRender === "function") clubPerksRender();

  if (S.cantoPendiente && S.quienCantoPendiente === "jugador") {
    bloquearBotonesAccion(true);
    turnoRival();
    return;
  }
  if (S.cantoPendiente && S.quienCantoPendiente === "rival") {
    bloquearBotonesAccion(false);
    return;
  }
  if (S.turnoActual === "rival") {
    bloquearBotonesAccion(true);
    turnoRival();
  } else {
    bloquearBotonesAccion(false);
  }
}

// ══════════════════════════════════════════════
// JUGAR CARTAS
// ══════════════════════════════════════════════

function jugarCartaJugador(idx) {
  if (S.turnoActual !== "jugador") return;
  if (S.cantoPendiente) return;
  if (!S.manoJugador[idx]) return;
  // BUG FIX: si ya jugaste tu carta de esta ronda (esperando la del
  // rival o el resolverFinDeRonda diferido), no se puede jugar otra.
  // Sin esta guarda, un doble click rápido pisaba la carta recién
  // jugada en S.cartasRondaJugador y la dejaba "perdida": desaparecía
  // de la mano sin quedar registrada en la mesa.
  if (S.cartasRondaJugador[S.rondaActual]) return;
  if (S.juegoTerminado) return;
  if (S.modoOnline && !S.esHost) { netEnviar({ accion: "jugarCarta", idx }); return; }

  S.cartasRondaJugador[S.rondaActual] = S.manoJugador[idx];
  S.manoJugador[idx] = null;

  // Marcar que el jugador ya tiró en R0 (ya no puede cantar envido)
  if (S.rondaActual === 0) S.jugadorTiroEnR0 = true;

  playSound("click");

  // BUG FIX: decidir el próximo turno ANTES de re-renderizar. Si
  // dejábamos turnoActual="jugador" hasta después de
  // actualizarTodaLaInterfaz(), el re-render de la mano (que resetea
  // el candado _jugandoCarta) mostraba las cartas restantes como
  // "jugables" durante un instante, permitiendo que un segundo click
  // rápido se colara y jugara otra carta de más.
  const rivalYaJugoEstaRonda = !!S.cartasRondaRival[S.rondaActual];
  if (!rivalYaJugoEstaRonda) S.turnoActual = "rival";

  actualizarTodaLaInterfaz();

  if (rivalYaJugoEstaRonda) {
    setTimeout(resolverFinDeRonda, 800);
  } else {
    evaluarTurnoActual();
  }
}

function jugarCartaRivalFisico(idx) {
  if (!S.manoRival[idx]) return;

  S.cartasRondaRival[S.rondaActual] = S.manoRival[idx];
  S.manoRival[idx] = null;

  if (S.rondaActual === 0) S.rivalTiroEnR0 = true;

  playSound("click");
  actualizarTodaLaInterfaz();

  if (S.cartasRondaJugador[S.rondaActual]) {
    setTimeout(resolverFinDeRonda, 800);
  } else {
    S.turnoActual = "jugador";
    evaluarTurnoActual();
  }
}

// ══════════════════════════════════════════════
// CANTOS DEL JUGADOR
// ══════════════════════════════════════════════

// ──────────────────────────────────────────────
// El "pie" es el jugador que NO es mano (el que reparte, juega último
// en la ronda 1). Regla oficial ("el envido está primero"): la ventana
// del envido/flor se cierra recién cuando el PIE juega su PRIMERA carta;
// que el "mano" haya tirado la suya NO la cierra.
// ──────────────────────────────────────────────
function _pieYaTiroEnR0() {
  return S.turnoMano === "jugador" ? S.rivalTiroEnR0 : S.jugadorTiroEnR0;
}

// ──────────────────────────────────────────────
// Regla central: ¿el envido todavía se puede cantar/responder por
// alguno de los dos jugadores? Solo en ronda 0, mientras el "pie" no
// haya tirado su primera carta y el envido no haya quedado
// terminado/cerrado.
// Usada por jugador (juego.js), IA (ia.js), online (motor_online.js)
// y la UI de botones (juego_ui.js).
// ──────────────────────────────────────────────
function envidoSigueVivo() {
  return S.rondaActual === 0
    && !S.envidoTerminado
    && !_pieYaTiroEnR0()
    && S.florTerminada   // "la flor está primero": no hay envido hasta resolverla
    && !S.florCantada;   // y si alguien cantó flor, la flor anula el envido (regla oficial)
}

// ──────────────────────────────────────────────
// Regla central: ¿la flor todavía se puede cantar/responder por alguno
// de los dos? Mismas condiciones que el envido, pero sin depender de
// que la flor ya esté terminada (es justamente lo que se está jugando).
// ──────────────────────────────────────────────
function florSigueVivo() {
  return S.rondaActual === 0
    && !S.florTerminada
    && !_pieYaTiroEnR0();
}

// Verifica si el jugador puede cantar envido ahora
function puedeJugadorCantarEnvido() {
  if (S.cantoPendiente) return false;
  if (S.turnoActual !== "jugador") return false;
  // Si ya jugó su primera carta, solo podría subir una apuesta ya
  // hecha por el rival (eso pasa por el flujo de cantoPendiente, no por
  // este botón ofensivo).
  if (S.jugadorTiroEnR0) return false;
  return envidoSigueVivo();
}

function puedeJugadorCantarTruco() {
  if (S.cantoPendiente) return false;
  if (S.juegoTerminado) return false;
  const nivel = _nivelTrucoDisponible("jugador");
  return nivel !== null;
}

// Verifica si el jugador puede cantar Flor ahora
function puedeJugadorCantarFlor() {
  if (S.cantoPendiente) return false;
  if (S.turnoActual !== "jugador") return false;
  if (S.florCantada) return false;
  if (S.jugadorPasoFlor) return false;
  // Si ya jugó su primera carta, ya no puede iniciar el canto de flor.
  if (S.jugadorTiroEnR0) return false;
  if (!florSigueVivo()) return false;
  return !!S.jugadorTieneFlor;
}

// "Achicar": el jugador tiene flor pero elige no cantarla todavía.
// No regala los puntos para siempre — si el rival tiene flor y la
// canta, el jugador sigue pudiendo responder con la suya (Contraflor).
// Pero si el rival NO tiene flor, no queda nada por resolver y se
// destraba el envido de inmediato ("la flor está primero" deja de aplicar).
function pasarFlorJugador() {
  if (!puedeJugadorCantarFlor()) return;
  if (S.modoOnline && !S.esHost) { netEnviar({ accion: "pasarFlor" }); return; }

  playSound("click");
  S.jugadorPasoFlor = true;
  showToast("Te guardaste la flor.");

  if (!S.rivalTieneFlor) {
    S.florTerminada = true;
  }

  actualizarTodaLaInterfaz();
  evaluarTurnoActual();
}

function cantarFlorJugador() {
  if (!puedeJugadorCantarFlor()) return;
  if (S.modoOnline && !S.esHost) { netEnviar({ accion: "cantarFlor" }); return; }

  playSound("canto");
  _registrarCantoFlor('flor');
  S.florCantada = true;

  showToast("Cantaste: ¡FLOR!");
  if (typeof mostrarOverlayCanto === "function") mostrarOverlayCanto("¡FLOR!", "jugador");

  if (!S.rivalTieneFlor) {
    // El rival no tiene flor: se anota directo, no hay nada que responder
    _resolverFlorSinContrincante("jugador");
    return;
  }

  // El rival también tiene flor: tiene que responder
  S.cantoPendiente      = "flor";
  S.quienCantoPendiente = "jugador";
  actualizarTodaLaInterfaz();
  evaluarTurnoActual();
}

// Flor cantada y el otro NO tiene flor: se anota sola, sin respuesta posible.
function _resolverFlorSinContrincante(quien) {
  S.florTerminada = true;
  const pts = S.nivelFlor; // 3 (la primera Flor siempre vale 3)

  if (quien === "jugador") {
    S.puntosJugador += pts;
    showToast(`Flor sin respuesta: +${pts} pts`);
  } else {
    S.puntosRival += pts;
    showToast(`${AVATARS[S.idRival].name} cantó Flor (sin respuesta): +${pts} pts`);
  }

  playSound("punto");
  actualizarTodaLaInterfaz();
  guardarProgreso();

  if (S.puntosJugador >= S.limitePuntos || S.puntosRival >= S.limitePuntos) {
    setTimeout(repartirNuevaMano, 1500);
    return;
  }

  if (_restaurarTrucoDiferido(900)) return;
  setTimeout(evaluarTurnoActual, 600);
}

// Responde a una Flor del rival que está esperando respuesta.
//   tipo === 'quiero'          → "¡Con flor quiero!" — se compara ahora
//   tipo === 'no-quiero'       → solo válido después de un Contraflor
//   tipo === 'contraflor'      → sube la apuesta a 6
//   tipo === 'contraflorresto' → sube la apuesta "al resto"
function responderFlorJugador(tipo) {
  if (!S.cantoPendiente || S.cantoPendiente !== "flor") return;
  if (S.quienCantoPendiente !== "rival") return;
  if (S.modoOnline && !S.esHost) { netEnviar({ accion: "responderFlor", tipo }); return; }

  if (tipo === 'quiero' || tipo === 'no-quiero') {
    playSound("click");
    if (tipo === 'quiero') {
      showToast("Dijiste: ¡CON FLOR QUIERO!");
      if (typeof mostrarOverlayCanto === "function") mostrarOverlayCanto("¡CON FLOR QUIERO!", "jugador");
      setTimeout(() => resolverFlorMesa("quiero"), 400);
    } else {
      showToast("Dijiste: NO QUIERO.");
      if (typeof mostrarOverlayCanto === "function") mostrarOverlayCanto("NO QUIERO", "jugador");
      setTimeout(() => resolverFlorMesa("no-quiero"), 400);
    }
    return;
  }

  // contraflor / contraflorresto: sube la apuesta y pasa la pelota al rival
  playSound("canto");
  _registrarCantoFlor(tipo);
  S.quienCantoPendiente = "jugador"; // ahora el rival tiene que responder

  const labels = { contraflor: "¡CONTRAFLOR!", contraflorresto: "¡CONTRAFLOR AL RESTO!" };
  showToast(`Cantaste: ${labels[tipo]}`);
  if (typeof mostrarOverlayCanto === "function") mostrarOverlayCanto(labels[tipo], "jugador");
  actualizarTodaLaInterfaz();
  evaluarTurnoActual();
}

function cantarEnvidoJugador(tipo) {
  // tipo: 'envido' | 'real' | 'falta'
  if (!puedeJugadorCantarEnvido()) return;
  // No se puede cantar real ni falta si ya se aceptó un envido anteriormente
  // (el envido encadenado solo es válido antes de que el rival acepte)
  if (S.envidoCantado && (tipo === 'real' || tipo === 'falta')) return;
  if (S.modoOnline && !S.esHost) { netEnviar({ accion: "cantarEnvido", tipo }); return; }

  playSound("canto");
  _registrarCantoEnvido(tipo);
  S.envidoCantado       = true;
  S.cantoPendiente      = "envido";
  S.quienCantoPendiente = "jugador";

  const labels = { envido: "¡ENVIDO!", real: "¡REAL ENVIDO!", falta: "¡FALTA ENVIDO!" };
  showToast(`Cantaste: ${labels[tipo]}`);
  if (typeof mostrarOverlayCanto === "function") mostrarOverlayCanto(labels[tipo], "jugador");
  actualizarTodaLaInterfaz();
  evaluarTurnoActual();
}

function cantarTrucoJugador(nivel) {
  if (!puedeJugadorCantarTruco()) return;
  if (_nivelTrucoDisponible("jugador") !== nivel) return;
  if (S.modoOnline && !S.esHost) { netEnviar({ accion: "cantarTruco", nivel }); return; }

  playSound("silbato");
  S.cantoPendiente       = "truco";
  S.quienCantoPendiente  = "jugador";
  S.ultimoEnCantarTruco  = "jugador";
  S.nivelTruco           = nivel;
  if (nivel > 2) S.trucoCantado = true; // retruco/vale4 implica que el truco fue aceptado antes

  const labels = { 2: "¡TRUCO!", 3: "¡RETRUCO!", 4: "¡VALE 4!" };
  showToast(`Cantaste: ${labels[nivel]}`);
  if (typeof mostrarOverlayCanto === "function") mostrarOverlayCanto(labels[nivel], "jugador");
  actualizarTodaLaInterfaz();
  evaluarTurnoActual();
}

function responderCantoJugador(acepta) {
  if (!S.cantoPendiente || S.quienCantoPendiente !== "rival") return;
  if (S.modoOnline && !S.esHost) { netEnviar({ accion: "responderCanto", acepta }); return; }
  playSound("click");

  if (S.cantoPendiente === "envido") {
    if (acepta) {
      showToast("Dijiste: ¡QUIERO!");
      if (typeof mostrarOverlayCanto === "function") mostrarOverlayCanto("¡QUIERO!", "jugador");
      setTimeout(() => resolverEnvidoMesa("quiero"), 400);
    } else {
      showToast("Dijiste: NO QUIERO.");
      if (typeof mostrarOverlayCanto === "function") mostrarOverlayCanto("NO QUIERO", "jugador");
      setTimeout(() => resolverEnvidoMesa("no-quiero"), 400);
    }

  } else if (S.cantoPendiente === "truco") {
    if (acepta) {
      showToast("Dijiste: ¡QUIERO!");
      if (typeof mostrarOverlayCanto === "function") mostrarOverlayCanto("¡QUIERO!", "jugador");
      S.trucoCantado          = true;
      S.nivelTrucoAceptado    = S.nivelTruco;
      S.ultimoEnAceptarTruco  = "jugador";
      S.cantoPendiente        = null;
      S.quienCantoPendiente   = null;
      actualizarTodaLaInterfaz();
      evaluarTurnoActual();
    } else {
      showToast("Te fuiste al mazo.");
      if (typeof mostrarOverlayCanto === "function") mostrarOverlayCanto("AL MAZO", "jugador");
      irseAlMazo("jugador");
    }
  }
}

// Responder envido ENCADENANDO (subir la apuesta en vez de quiero/no-quiero)
function responderEnvidoConSubida(tipo) {
  // El jugador puede responder al envido del rival subiendo la apuesta
  if (!S.cantoPendiente || S.cantoPendiente !== "envido") return;
  if (S.quienCantoPendiente !== "rival") return;
  if (S.modoOnline && !S.esHost) { netEnviar({ accion: "subirEnvido", tipo }); return; }

  playSound("canto");
  _registrarCantoEnvido(tipo);
  S.envidoCantado       = true;
  S.cantoPendiente      = "envido";
  S.quienCantoPendiente = "jugador"; // ahora el rival tiene que responder

  const labels = { envido: "¡ENVIDO!", real: "¡REAL ENVIDO!", falta: "¡FALTA ENVIDO!" };
  showToast(`Cantaste: ${labels[tipo]}`);
  if (typeof mostrarOverlayCanto === "function") mostrarOverlayCanto(labels[tipo], "jugador");
  actualizarTodaLaInterfaz();
  evaluarTurnoActual();
}

// ══════════════════════════════════════════════
// SUBIR EL TRUCO (Retruco / Vale 4 como respuesta)
// ══════════════════════════════════════════════
// Subir un canto de truco implica ACEPTAR el nivel anterior.
// Esta función arregla el bug donde subir el truco limpiaba el
// canto pendiente sin aceptar nada y dejaba el juego trabado.
function responderTrucoSubida(nivel) {
  if (S.cantoPendiente !== "truco" || S.quienCantoPendiente !== "rival") return;
  if (nivel !== S.nivelTruco + 1 || nivel > 4) return;
  if (S.modoOnline && !S.esHost) { netEnviar({ accion: "subirTruco", nivel }); return; }

  playSound("silbato");

  // 1. Aceptación implícita del nivel que cantó el rival
  S.trucoCantado         = true;
  S.nivelTrucoAceptado   = S.nivelTruco;
  S.ultimoEnAceptarTruco = "jugador";

  // 2. El jugador canta el nivel superior — el rival debe responder
  S.cantoPendiente       = "truco";
  S.quienCantoPendiente  = "jugador";
  S.ultimoEnCantarTruco  = "jugador";
  S.nivelTruco           = nivel;

  const labels = { 3: "¡RETRUCO!", 4: "¡VALE 4!" };
  showToast(`Cantaste: ${labels[nivel]}`);
  if (typeof mostrarOverlayCanto === "function") mostrarOverlayCanto(labels[nivel], "jugador");
  actualizarTodaLaInterfaz();
  evaluarTurnoActual();
}

// ══════════════════════════════════════════════
// "LA FLOR ESTÁ PRIMERO"
// ══════════════════════════════════════════════
// Igual que "el envido está primero", pero con prioridad MÁS ALTA: si
// alguien canta TRUCO en la ronda 0 y el OTRO tiene flor sin cantar
// todavía, puede responder cantando FLOR en lugar de quiero/no quiero.
// El truco queda diferido y vuelve a ponerse en juego al resolverse la
// flor. "quien" = quién respondería con la flor (el que NO cantó el
// truco pendiente).
function puedeResponderTrucoConFlor(quien) {
  if (S.cantoPendiente !== "truco") return false;
  if (S.quienCantoPendiente === quien) return false; // el truco lo cantó el otro
  if (S.nivelTruco !== 2) return false;          // solo aplica al primer TRUCO
  if (S.florCantada) return false;
  // La flor se canta antes de jugar la primera carta: si "quien" ya
  // tiró la suya, perdió la chance de responder con flor.
  if (quien === "jugador" ? S.jugadorTiroEnR0 : S.rivalTiroEnR0) return false;
  if (!florSigueVivo()) return false;
  return quien === "jugador" ? !!S.jugadorTieneFlor : !!S.rivalTieneFlor;
}

function responderTrucoConFlor(quien) {
  if (!puedeResponderTrucoConFlor(quien)) return;
  if (quien === "jugador" && S.modoOnline && !S.esHost) {
    netEnviar({ accion: "truco_con_flor" });
    return;
  }

  // Diferir el truco pendiente
  S.trucoDiferido       = true;
  S.trucoDiferidoDe     = S.quienCantoPendiente;
  S.cantoPendiente      = null;
  S.quienCantoPendiente = null;

  // Cantar la flor de "quien"
  playSound("canto");
  _registrarCantoFlor('flor');
  S.florCantada = true;

  if (quien === "rival") {
    showToast(`${AVATARS[S.idRival].name}: "La flor está primero" — ¡FLOR!`);
  } else {
    showToast(`"La flor está primero" — ¡FLOR!`);
  }
  if (typeof mostrarOverlayCanto === "function") mostrarOverlayCanto("¡FLOR!", quien);

  const otroTieneFlor = quien === "jugador" ? S.rivalTieneFlor : S.jugadorTieneFlor;

  if (!otroTieneFlor) {
    // El otro no tiene flor: se anota directo, no hay nada que responder
    _resolverFlorSinContrincante(quien);
    return;
  }

  // El otro también tiene flor: tiene que responder
  S.cantoPendiente      = "flor";
  S.quienCantoPendiente = quien;
  actualizarTodaLaInterfaz();
  evaluarTurnoActual();
}

// ══════════════════════════════════════════════
// "EL ENVIDO ESTÁ PRIMERO"
// ══════════════════════════════════════════════
// Si alguien canta TRUCO en la primera ronda y el OTRO todavía
// no tiró carta ni se cantó envido, puede responder cantando ENVIDO
// (en lugar de quiero/no quiero). El truco queda diferido y se vuelve
// a poner en juego al terminar el envido (regla clásica del truco
// argentino). "quien" = quién respondería con el envido (el que NO
// cantó el truco pendiente).
function puedeResponderTrucoConEnvido(quien) {
  if (S.cantoPendiente !== "truco") return false;
  if (S.quienCantoPendiente === quien) return false; // el truco lo cantó el otro
  if (S.nivelTruco !== 2) return false;          // solo aplica al primer TRUCO
  if (S.envidoCantado) return false;
  // El envido se canta antes de jugar la primera carta: si "quien" ya
  // tiró la suya, perdió la chance de responder con envido.
  if (quien === "jugador" ? S.jugadorTiroEnR0 : S.rivalTiroEnR0) return false;
  return envidoSigueVivo();
}

function responderTrucoConEnvido(quien, tipo) {
  if (!puedeResponderTrucoConEnvido(quien)) return;
  if (quien === "jugador" && S.modoOnline && !S.esHost) {
    netEnviar({ accion: "truco_con_envido", tipo });
    return;
  }

  // Diferir el truco pendiente
  S.trucoDiferido       = true;
  S.trucoDiferidoDe     = S.quienCantoPendiente;
  S.cantoPendiente      = null;
  S.quienCantoPendiente = null;

  // Cantar el envido de "quien"
  playSound("canto");
  _registrarCantoEnvido(tipo);
  S.envidoCantado       = true;
  S.cantoPendiente      = "envido";
  S.quienCantoPendiente = quien;

  const labels = { envido: "¡ENVIDO!", real: "¡REAL ENVIDO!", falta: "¡FALTA ENVIDO!" };
  if (quien === "rival") {
    showToast(`${AVATARS[S.idRival].name}: "El envido está primero" — ${labels[tipo]}`);
    if (typeof fraseRivalCanto === "function") fraseRivalCanto(tipo);
  } else {
    showToast(`"El envido está primero" — ${labels[tipo]}`);
  }
  if (typeof mostrarOverlayCanto === "function") mostrarOverlayCanto(labels[tipo], quien);
  actualizarTodaLaInterfaz();
  evaluarTurnoActual();
}

// ══════════════════════════════════════════════
// RESOLUCIÓN DE APUESTAS
// ══════════════════════════════════════════════

// ── Restaurar el truco diferido ("el envido/la flor está primero") ──
// Si había un TRUCO cantado que quedó diferido porque el otro respondió
// con flor o envido, lo vuelve a poner en juego una vez resuelta esa
// apuesta. Devuelve true si quedó programado (el caller debe hacer
// return), false si no había nada diferido.
function _restaurarTrucoDiferido(delayMs) {
  if (!S.trucoDiferido) return false;
  const quien = S.trucoDiferidoDe || "rival";
  S.trucoDiferido   = false;
  S.trucoDiferidoDe = null;
  setTimeout(() => {
    if (S.juegoTerminado) return;
    S.cantoPendiente      = "truco";
    S.quienCantoPendiente = quien;
    const nom = quien === "rival" ? AVATARS[S.idRival].name : S.nombreJugador;
    showToast(`El TRUCO de ${nom} sigue en pie — hay que responder`);
    actualizarTodaLaInterfaz();
    evaluarTurnoActual();
  }, delayMs);
  return true;
}

function resolverEnvidoMesa(respuesta) {
  S.envidoTerminado     = true;
  // BUG FIX: usar la mano INICIAL para calcular tantos.
  // Si el jugador mano tiró una carta antes de que se resolviera el envido,
  // S.manoJugador ya tiene un null y calcularEnvido daría un score incorrecto.
  const ptsJ            = calcularEnvido(S.manoJugadorInicial || S.manoJugador);
  const ptsR            = calcularEnvido(S.manoRivalInicial   || S.manoRival);
  const quienCanto      = S.quienCantoPendiente;

  S.cantoPendiente      = null;
  S.quienCantoPendiente = null;

  let ganoJugador = false;

  if (respuesta === "quiero") {
    const apuesta = S.nivelEnvido;
    ganoJugador = ptsJ > ptsR || (ptsJ === ptsR && S.turnoMano === "jugador");
    if (ganoJugador) {
      S.puntosJugador += apuesta;
      showToast(`✅ Envido: Vos ${ptsJ} vs Rival ${ptsR} — +${apuesta} pts`);
    } else {
      S.puntosRival += apuesta;
      showToast(`❌ Envido: Rival ${ptsR} vs Vos ${ptsJ} — Rival +${apuesta} pts`);
    }
    // Guardar reveal para mostrar las cartas recién al final de la mano
    // (no filtrar info del rival mientras el partido sigue en juego).
    // Usar la mano INICIAL (las 3 cartas repartidas) para el reveal, no la
    // mano restante — el jugador mano puede haber tirado 1 carta antes de
    // resolverse el envido y el reveal mostraría cartas equivocadas.
    const manoJRev = S.manoJugadorInicial || S.manoJugador;
    const manoRRev = S.manoRivalInicial   || S.manoRival;
    const infoJ = (typeof calcularEnvidoConCartas === "function")
      ? calcularEnvidoConCartas(manoJRev) : { cartas: [] };
    const infoR = (typeof calcularEnvidoConCartas === "function")
      ? calcularEnvidoConCartas(manoRRev) : { cartas: [] };
    S.revealEnvidoMano = {
      titulo: "ENVIDO", ganoJugador, apuesta, ptsJ, ptsR,
      cartasJ: infoJ.cartas, cartasR: infoR.cartas,
    };
    // Mostrar overlay visual con los tantos (sin las cartas)
    if (typeof mostrarOverlayEnvido === "function") {
      mostrarOverlayEnvido(ptsJ, ptsR, ganoJugador, apuesta, infoJ.cartas, infoR.cartas);
    }
  } else {
    const pts = puntosEnvidoNoQuiero();
    if (quienCanto === "jugador") {
      S.puntosJugador += pts;
      ganoJugador = true;
      showToast(`No quiso el envido. Vos +${pts} pto${pts > 1 ? "s" : ""}`);
    } else {
      S.puntosRival += pts;
      showToast(`No quisiste el envido. Rival +${pts} pto${pts > 1 ? "s" : ""}`);
    }
  }

  _tribuna(ganoJugador ? "jugador" : "rival", "envido");
  playSound(ganoJugador ? "punto" : "parda");
  actualizarTodaLaInterfaz();
  guardarProgreso();

  // ── Fin inmediato del partido ─────────────────────────
  // BUG FIX: antes, ganar el partido con un Falta Envido no terminaba
  // la partida hasta que se completara la mano. Ahora corta al instante.
  if (S.puntosJugador >= S.limitePuntos || S.puntosRival >= S.limitePuntos) {
    setTimeout(repartirNuevaMano, respuesta === "quiero" ? 2900 : 1000);
    return;
  }

  // ── Restaurar el truco diferido ("el envido está primero") ──
  if (_restaurarTrucoDiferido(respuesta === "quiero" ? 3000 : 1100)) return;

  setTimeout(evaluarTurnoActual, respuesta === "quiero" ? 2900 : 800);
}

// ── FLOR ────────────────────────────────────────────────────────────────────
// Resuelve la apuesta de Flor en la mesa. Igual estructura que
// resolverEnvidoMesa, pero usando calcularFlor / nivelFlor / historialFlor.
//   respuesta === "quiero"    → se comparan los puntos de flor de cada uno
//   respuesta === "no-quiero" → quienCanto se lleva puntosFlorNoQuiero()
function resolverFlorMesa(respuesta) {
  S.florTerminada       = true;
  // BUG FIX: calcularFlor devuelve 0 si la mano tiene menos de 3 cartas no-null.
  // Si el mano tiró una carta antes de que se resuelva la flor, el puntaje
  // sería 0 y perdería injustamente. Usamos la mano inicial.
  const ptsJ            = calcularFlor(S.manoJugadorInicial || S.manoJugador);
  const ptsR            = calcularFlor(S.manoRivalInicial   || S.manoRival);
  const quienCanto      = S.quienCantoPendiente;

  S.cantoPendiente      = null;
  S.quienCantoPendiente = null;

  let ganoJugador = false;

  if (respuesta === "quiero") {
    const apuesta = S.nivelFlor;
    ganoJugador = ptsJ > ptsR || (ptsJ === ptsR && S.turnoMano === "jugador");
    if (ganoJugador) {
      S.puntosJugador += apuesta;
      showToast(`✅ Flor: Vos ${ptsJ} vs Rival ${ptsR} — +${apuesta} pts`);
    } else {
      S.puntosRival += apuesta;
      showToast(`❌ Flor: Rival ${ptsR} vs Vos ${ptsJ} — Rival +${apuesta} pts`);
    }
    // Guardar reveal para mostrar las 3 cartas de cada uno recién al
    // final de la mano (usar mano inicial para no revelar cartas ya jugadas).
    const cartasJ = (S.manoJugadorInicial || S.manoJugador).filter(x => x !== null);
    const cartasR = (S.manoRivalInicial   || S.manoRival).filter(x => x !== null);
    S.revealEnvidoMano = {
      titulo: "FLOR", ganoJugador, apuesta, ptsJ, ptsR, cartasJ, cartasR,
    };
    // Mostrar overlay visual con los tantos (sin las cartas)
    if (typeof mostrarOverlayEnvido === "function") {
      mostrarOverlayEnvido(ptsJ, ptsR, ganoJugador, apuesta, cartasJ, cartasR, "FLOR");
    }
  } else {
    const pts = puntosFlorNoQuiero();
    if (quienCanto === "jugador") {
      S.puntosJugador += pts;
      ganoJugador = true;
      showToast(`No quiso la flor. Vos +${pts} pto${pts > 1 ? "s" : ""}`);
    } else {
      S.puntosRival += pts;
      showToast(`No quisiste la flor. Rival +${pts} pto${pts > 1 ? "s" : ""}`);
    }
  }

  _tribuna(ganoJugador ? "jugador" : "rival", "envido");
  playSound(ganoJugador ? "punto" : "parda");
  actualizarTodaLaInterfaz();
  guardarProgreso();

  // ── Fin inmediato del partido ─────────────────────────
  if (S.puntosJugador >= S.limitePuntos || S.puntosRival >= S.limitePuntos) {
    setTimeout(repartirNuevaMano, respuesta === "quiero" ? 2900 : 1000);
    return;
  }

  // ── Restaurar el truco diferido ("la flor está primero") ──
  if (_restaurarTrucoDiferido(respuesta === "quiero" ? 3000 : 1100)) return;

  setTimeout(evaluarTurnoActual, respuesta === "quiero" ? 2900 : 800);
}

function irseAlMazo(quien) {
  if (quien === "jugador" && S.modoOnline && !S.esHost) {
    netEnviar({ accion: "mazo" });
    return;
  }
  playSound("silbato"); // el árbitro marca el final de la mano

  // Si truco fue aceptado, vale nivelTrucoAceptado; si solo fue cantado sin aceptar, vale NQ = nivel-1
  const pts = S.nivelTrucoAceptado > 0
    ? S.nivelTrucoAceptado
    : puntasTrucoNoQuiero();

  if (quien === "jugador") {
    S.puntosRival += pts;
    _tribuna("rival", "mazo");
    showToast(`Te fuiste al mazo. Rival +${pts}`);
    if (typeof _pushHistorialMano === "function") _pushHistorialMano("rival", pts);
  } else {
    S.puntosJugador += pts;
    _tribuna("jugador", "mazo");
    showToast(`¡El rival se fue al mazo! Vos +${pts}`);
    if (typeof _pushHistorialMano === "function") _pushHistorialMano("jugador", pts);
  }

  guardarProgreso();
  actualizarTodaLaInterfaz();

  // Si en esta mano hubo un envido/flor "querido", recién ahora (al cerrarse
  // la mano por irse al mazo) revelamos las cartas que lo formaron. Antes esto
  // solo pasaba cuando la mano se definía jugando cartas (resolverFinDeRonda),
  // así que al mazo las cartas quedaban tapadas. mostrarOverlayResultadoMano
  // lee S.revealEnvidoMano y lo limpia, por eso capturamos el flag antes.
  const huboReveal = !!S.revealEnvidoMano;
  if (huboReveal && typeof mostrarOverlayResultadoMano === "function") {
    mostrarOverlayResultadoMano(quien === "jugador" ? "pierde" : "gano", pts);
  }

  setTimeout(repartirNuevaMano, huboReveal ? 2800 : 1500);
}

// ── Irse al mazo teniendo un canto pendiente por responder ────────
// El truco real permite irse al mazo aunque te hayan cantado envido
// o truco y todavía no hayas respondido. Si era un ENVIDO, primero
// se liquida como "no quiero" (el rival se lleva esos puntos) y
// recién después se reparte la mano al mazo. Si era un TRUCO, es
// equivalente a decir "no quiero".
function irseAlMazoConCantoPendiente() {
  if (!S.cantoPendiente || S.quienCantoPendiente !== "rival") return;
  if (S.modoOnline && !S.esHost) { netEnviar({ accion: "mazoConCanto" }); return; }
  playSound("click");

  if (S.cantoPendiente === "flor") {
    S.florTerminada       = true;
    const pts             = puntosFlorNoQuiero();
    S.puntosRival        += pts;
    S.cantoPendiente      = null;
    S.quienCantoPendiente = null;
    S.trucoDiferido       = false;
    S.trucoDiferidoDe     = null;

    showToast(`No quisiste la flor. Rival +${pts} pto${pts > 1 ? "s" : ""}. Te fuiste al mazo.`);
    if (typeof mostrarOverlayCanto === "function") mostrarOverlayCanto("AL MAZO", "jugador");
    actualizarTodaLaInterfaz();
    guardarProgreso();

    if (S.puntosRival >= S.limitePuntos) {
      setTimeout(repartirNuevaMano, 1000);
      return;
    }
    setTimeout(() => irseAlMazo("jugador"), 600);

  } else if (S.cantoPendiente === "envido") {
    S.envidoTerminado     = true;
    const pts             = puntosEnvidoNoQuiero();
    S.puntosRival        += pts;
    S.cantoPendiente      = null;
    S.quienCantoPendiente = null;
    S.trucoDiferido       = false;
    S.trucoDiferidoDe     = null;

    showToast(`No quisiste el envido. Rival +${pts} pto${pts > 1 ? "s" : ""}. Te fuiste al mazo.`);
    if (typeof mostrarOverlayCanto === "function") mostrarOverlayCanto("AL MAZO", "jugador");
    actualizarTodaLaInterfaz();
    guardarProgreso();

    if (S.puntosRival >= S.limitePuntos) {
      setTimeout(repartirNuevaMano, 1000);
      return;
    }
    setTimeout(() => irseAlMazo("jugador"), 600);

  } else if (S.cantoPendiente === "truco") {
    S.cantoPendiente      = null;
    S.quienCantoPendiente = null;
    showToast("Te fuiste al mazo.");
    if (typeof mostrarOverlayCanto === "function") mostrarOverlayCanto("AL MAZO", "jugador");
    irseAlMazo("jugador");
  }
}

function resolverFinDeRonda() {
  const cJ = S.cartasRondaJugador[S.rondaActual];
  const cR = S.cartasRondaRival[S.rondaActual];
  if (!cJ || !cR) return;

  const fJ = C[cJ].f;
  const fR = C[cR].f;

  let ganador = "parda";
  if (fJ > fR) ganador = "jugador";
  else if (fR > fJ) ganador = "rival";

  // Comodín "Garra" del Modo Manager: si está armado y la ronda fue parda,
  // el equipo se impone y se la lleva el jugador (lo consume una vez).
  if (ganador === "parda" && typeof clubConsumirGarra === "function" && clubConsumirGarra()) {
    ganador = "jugador";
    if (typeof showToast === "function") showToast("💪 ¡Garra! El equipo se impone en la parda.");
  }

  S.ganadoresRonda.push(ganador);
  S.turnoActual = (ganador === "parda") ? S.turnoMano : ganador;

  // Gol chico: la hinchada del que ganó la ronda festeja (la parda no cuenta).
  if (ganador !== "parda") _tribuna(ganador, "ronda");

  actualizarTodaLaInterfaz();

  const r       = S.ganadoresRonda;
  const conteoJ = r.filter(g => g === "jugador").length;
  const conteoR = r.filter(g => g === "rival").length;

  const ganaJ = conteoJ >= 2
    || (r[0] === "jugador" && r[1] === "parda")
    || (r[0] === "parda"   && r[1] === "jugador");
  const ganaR = conteoR >= 2
    || (r[0] === "rival" && r[1] === "parda")
    || (r[0] === "parda" && r[1] === "rival");

  const pts = puntasTrucoGanaMano();

  if (ganaJ) {
    S.puntosJugador += pts;
    _tribuna("jugador", "mano");
    showToast(`¡Ganaste la mano! +${pts}`);
    if (typeof mostrarOverlayResultadoMano === "function") mostrarOverlayResultadoMano("gano", pts);
    if (typeof _pushHistorialMano === "function") _pushHistorialMano("jugador", pts);
    guardarProgreso(); setTimeout(repartirNuevaMano, 1500); return;
  }
  if (ganaR) {
    S.puntosRival += pts;
    _tribuna("rival", "mano");
    showToast(`El rival ganó la mano. -${pts}`);
    if (typeof mostrarOverlayResultadoMano === "function") mostrarOverlayResultadoMano("pierde", pts);
    if (typeof _pushHistorialMano === "function") _pushHistorialMano("rival", pts);
    guardarProgreso(); setTimeout(repartirNuevaMano, 1500); return;
  }

  if (S.rondaActual < 2) {
    S.rondaActual++;
    evaluarTurnoActual();
    return;
  }

  // Tercera ronda — resolución completa de los 8 escenarios posibles:
  //   J-R-P / R-J-P → 1-1 con parda → GANA EL MANO (regla del empate)
  //   P-P-J / P-P-R / P-P-P → buscar primer ganador o mano
  //   R1≠P y R2=P, o R1=R2 → R1 decide (ya manejado por ganaJ/ganaR arriba,
  //                            este código solo llega con casos residuales)
  let ganadorFinal;
  if (r[0] === "parda") {
    // R1 parda: primer no-parda gana, si todos son parda gana el mano
    ganadorFinal = r.find(g => g !== "parda") || S.turnoMano;
  } else {
    // R1 tuvo ganador
    const r1yr2Distintos = r[1] !== "parda" && r[0] !== r[1];
    if (r1yr2Distintos && r[2] === "parda") {
      // J-R-P o R-J-P: 1 a 1 y parda final → gana el MANO (regla del empate)
      ganadorFinal = S.turnoMano;
    } else {
      // R1 decide (R2=parda, o R2=R1 — ya cubiertos por ganaJ/ganaR,
      // este fallback no debería ejecutarse pero se deja por seguridad)
      ganadorFinal = r[0];
    }
  }

  if (ganadorFinal === "jugador") {
    S.puntosJugador += pts;
    _tribuna("jugador", "mano");
    showToast(`¡Ganaste la mano! +${pts}`);
    if (typeof mostrarOverlayResultadoMano === "function") mostrarOverlayResultadoMano("gano", pts);
    if (typeof _pushHistorialMano === "function") _pushHistorialMano("jugador", pts);
  } else {
    S.puntosRival += pts;
    _tribuna("rival", "mano");
    showToast(`El rival ganó la mano.`);
    if (typeof mostrarOverlayResultadoMano === "function") mostrarOverlayResultadoMano("pierde", pts);
    if (typeof _pushHistorialMano === "function") _pushHistorialMano("rival", pts);
  }
  guardarProgreso();
  setTimeout(repartirNuevaMano, 1500);
}

// ══════════════════════════════════════════════
// ARRANQUE
// ══════════════════════════════════════════════
window.addEventListener("load", () => {
  const loading = document.getElementById("loading");
  if (loading) loading.style.display = "none";
  cargarProgreso();
  if (typeof aplicarConfiguracionVisual === "function") {
    aplicarConfiguracionVisual();
  } else {
    setTimeout(() => {
      if (typeof aplicarConfiguracionVisual === "function") aplicarConfiguracionVisual();
    }, 200);
  }
});
