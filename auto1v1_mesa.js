// ══════════════════════════════════════════════════════════════
// AUTO1V1_MESA — "JUGAR CON UN AMIGO" se juega en la MESA DE VERDAD
//
// POR QUÉ EXISTE ESTE ARCHIVO. La mesa 1v1 autoritativa nació el 2 ago con
// pantalla propia (src/ui/auto1v1_ui.js): un rectángulo verde con las cartas
// y unos botones, escrito para verificar que el server repartía y validaba
// bien sin tener que tocar la mesa real. Servía para eso. Pero el 4 ago se
// publicó como "JUGAR CON UN AMIGO" —porque era la que cerraba el agujero
// del host que veía las cartas del rival— y el jugador se encontró con una
// pantalla que no se parece en nada al Picadito. Pedido de Chucho: "quiero
// que se vea como una partida de picadito".
//
// CÓMO. No se recrea la mesa: se ENTRA a la de siempre. El truco es que la
// mesa real YA sabe jugar sin motor propio — es exactamente lo que hace el
// INVITADO del online viejo, que no corre las reglas: manda su acción y
// pinta el estado que le llega (netAplicarEstadoRemoto en motor_online.js).
// Así que acá solo hacen falta dos traducciones:
//
//   server → mesa :  el snapshot viene en "propio"/"ajeno" (el server no
//                    sabe cuál de los dos sos vos) y la mesa habla de
//                    "jugador"/"rival". Eso es _a1EstadoParaMesa().
//   mesa → server :  la mesa manda las acciones con los nombres del relay
//                    ({accion:"mazo"}), el motor del server espera los
//                    suyos ({tipo:"irseAlMazo"}). Eso es _A1_ACCIONES.
//
// LO QUE NO CAMBIA, y es el punto de todo esto: las cartas del rival siguen
// sin viajar. El snapshot manda "?" por cada carta que el otro todavía
// tiene en la mano, igual que antes — la mesa real dibuja dorsos con eso,
// que es justo lo que ya hacía con la mano del rival en el modo offline.
//
// El panel de auto1v1_ui.js NO se borra: queda como LOBBY (crear mesa /
// entrar con código / compartir el link). Lo que deja de usarse es su
// pantalla de juego.
// ══════════════════════════════════════════════════════════════

// ¿Estamos jugando en la mesa real con el server de árbitro? Lo miran
// netEnviar (para saber a dónde mandar las acciones) y auto1v1_client
// (para no dibujar su panel viejo encima).
const A1MESA = { abierta: false };

// "propio"/"ajeno" (lo que manda el server, que es simétrico) →
// "jugador"/"rival" (lo que entiende la mesa). Cualquier otra cosa
// (null, "parda") pasa derecho.
function _a1Rol(x) {
  if (x === "propio") return "jugador";
  if (x === "ajeno")  return "rival";
  return x;
}

/* Traduce el snapshot del server al estado que netAplicarEstadoRemoto() ya
   sabe aplicar (los campos de _ONLINE_CAMPOS_ESTADO en motor_online.js).
   Devuelve null si el snapshot no tiene la forma esperada — un estado a
   medio aplicar pinta una mesa inconsistente, es mejor ignorarlo. */
function _a1EstadoParaMesa(snap) {
  if (!snap || !snap.mano || !snap.puntos) return null;
  const m = snap.mano;
  const r = m.revealEnvidoMano;

  return {
    puntosJugador: snap.puntos.propio,
    puntosRival:   snap.puntos.ajeno,
    limitePuntos:  snap.limite,

    manoJugador: m.manoPropia,
    // Ya viene redactada del server: "?" por cada carta que el rival
    // TODAVÍA tiene, null por cada una que ya jugó. Es la misma forma que
    // produce _redactarMano() para el invitado del relay, así que la mesa
    // la dibuja sin enterarse de la diferencia.
    manoRival:   m.manoAjenaOculta,

    cartasRondaJugador: m.cartasJugadas.propio,
    cartasRondaRival:   m.cartasJugadas.ajeno,
    ganadoresRonda:     (m.ganadoresRonda || []).map(_a1Rol),

    rondaActual: m.rondaActual,
    turnoActual: _a1Rol(m.turnoActual),
    turnoMano:   _a1Rol(snap.turnoMano),

    envidoCantado:   m.envidoCantado,
    envidoTerminado: m.envidoTerminado,
    nivelEnvido:     m.nivelEnvido,
    historialEnvido: m.historialEnvido,
    jugadorTiroEnR0: m.tiroEnR0Propio,
    rivalTiroEnR0:   m.tiroEnR0Ajeno,

    trucoCantado:         m.trucoCantado,
    nivelTruco:           m.nivelTruco,
    nivelTrucoAceptado:   m.nivelTrucoAceptado,
    ultimoEnCantarTruco:  _a1Rol(m.ultimoEnCantarTruco),
    ultimoEnAceptarTruco: _a1Rol(m.ultimoEnAceptarTruco),

    cantoPendiente:      m.cantoPendiente,
    quienCantoPendiente: _a1Rol(m.quienCantoPendiente),

    trucoDiferido:   m.trucoDiferido,
    trucoDiferidoDe: _a1Rol(m.trucoDiferidoDe),

    cfgFlor:          snap.conFlor,
    jugadorTieneFlor: m.tieneFlorPropia,
    // La flor del rival es información privada igual que sus cartas: el
    // server NO la manda. Solo se sabe que la tiene cuando la CANTA (y ahí
    // ya es público). Guardársela no se entera nadie, que es la regla.
    // Ojo: acá se compara contra "ajeno" —lo que manda el server— y no
    // contra "rival", que es como se llama recién DESPUÉS de _a1Rol().
    rivalTieneFlor:   !!(m.florCantada && m.florCantadaPor === "ajeno"),
    florCantada:      m.florCantada,
    florCantadaPor:   _a1Rol(m.florCantadaPor),
    // florTerminada llega en null mientras nadie cantó, porque mandarla
    // ahí diría "tu rival tiene flor" antes del canto. Mientras es null se
    // deduce de lo único que sí puedo saber: mi propia flor. Puede quedar
    // corta (el rival puede tener una sin cantar todavía) y está bien —
    // acá solo decide qué botones ofrecer, la legalidad la dicta el server.
    florTerminada:    (m.florTerminada === null || m.florTerminada === undefined)
                        ? (!snap.conFlor || !m.tieneFlorPropia)
                        : m.florTerminada,
    jugadorPasoFlor:  m.pasoFlorPropia,
    rivalPasoFlor:    m.pasoFlorAjena,
    nivelFlor:        m.nivelFlor,
    historialFlor:    m.historialFlor,

    // El reveal de envido/flor cambia de nombres además de perspectiva.
    revealEnvidoMano: r ? {
      titulo:      r.titulo,
      apuesta:     r.apuesta,
      ganoJugador: r.gano === "propio",
      ptsJ:        r.ptsPropio,
      ptsR:        r.ptsAjeno,
      cartasJ:     r.cartasPropias,
      cartasR:     r.cartasAjenas,
    } : null,

    juegoTerminado: snap.terminado,
  };
}

// ── mesa → server ────────────────────────────────────────────────────
// La mesa real manda sus acciones con los nombres del relay (juego.js, la
// rama `S.modoOnline && !S.esHost`). El motor del server usa los suyos.
// Esta tabla es el único punto donde se cruzan: cada entrada recibe el
// payload del relay y llama al emisor que ya existe en auto1v1_client.js.
//
// ⚠️ Las dos puntas tienen que seguir coincidiendo. Si aparece una acción
// nueva en juego.js y no está acá, el botón queda MUDO (la mesa cree que
// mandó algo y el server nunca se entera). Hay un test que compara las dos
// listas: tests/test_auto1v1_mesa.js.
const _A1_ACCIONES = {
  jugarCarta:        (p) => auto1v1JugarCarta(p.idx),
  cantarEnvido:      (p) => auto1v1CantarEnvido(p.tipo),
  subirEnvido:       (p) => auto1v1SubirEnvido(p.tipo),
  cantarTruco:       (p) => auto1v1CantarTruco(p.nivel),
  subirTruco:        (p) => auto1v1SubirTruco(p.nivel),
  responderCanto:    (p) => auto1v1ResponderCanto(p.acepta),
  cantarFlor:        ()  => auto1v1CantarFlor(),
  pasarFlor:         ()  => auto1v1PasarFlor(),
  responderFlor:     (p) => auto1v1ResponderFlor(p.tipo),
  truco_con_flor:    ()  => auto1v1TrucoConFlor(),
  envido_con_flor:   ()  => auto1v1EnvidoConFlor(),
  truco_con_envido:  (p) => auto1v1TrucoConEnvido(p.tipo),
  // Los dos caminos de irse al mazo del cliente (con o sin canto
  // pendiente) son la MISMA acción para el motor del server, que decide
  // solo cuánto se paga según el estado.
  mazo:              ()  => auto1v1IrseAlMazo(),
  mazoConCanto:      ()  => auto1v1IrseAlMazo(),
};

/* Ruta una acción de la mesa real hacia el server autoritativo. La llama
   netEnviar() (netClient.js) cuando la partida es de este modo: así los 14
   puntos de juego.js que ya mandaban al host siguen sin saber nada de este
   archivo. Devuelve true si la manejó. */
function auto1v1MesaEnviarAccion(payload) {
  const fn = payload && _A1_ACCIONES[payload.accion];
  if (!fn) return false;   // no es una acción de juego (p.ej. "hola"): no va a ningún lado
  fn(payload);
  return true;
}

// ── Entrada y salida de la mesa ──────────────────────────────────────

/* Abre la mesa real para este modo. Espejo de onlineIniciarPartidaGuest()
   (motor_online.js): el invitado del relay y el asiento de la mesa
   autoritativa están en la misma posición —no corren el motor, solo pintan
   lo que les llega— así que se configura igual, con una bandera más para
   que netEnviar sepa a dónde mandar las acciones. */
function auto1v1MesaAbrir(d) {
  if (typeof S === "undefined") return;
  if (typeof AVATARS !== "undefined") {
    if (typeof ONLINE !== "undefined" && ONLINE._avatarsBaseLen === null) {
      ONLINE._avatarsBaseLen = AVATARS.length;
    }
    AVATARS.push({
      name: (typeof nombreSeguro === "function") ? nombreSeguro(d && d.rivalNombre, "Rival") : "Rival",
      icon: (typeof avatarSeguro === "function") ? avatarSeguro(null) : "avatares/hincha_misterioso.png",
    });
    S.idRival = AVATARS.length - 1;
  }
  if (typeof ONLINE !== "undefined") ONLINE.partidaIniciada = true;

  S.nombreJugador = (typeof A1 !== "undefined" && A1.miNombre) || S.nombreJugador || "Vos";
  // modoOnline + !esHost es lo que ya destraba, en juego.js, las 14 ramas
  // de "no corras las reglas: mandá la acción". modoAuto1v1 es lo único
  // nuevo, y solo decide el DESTINO de esas acciones.
  S.modoOnline    = true;
  S.esHost        = false;
  S.modoAuto1v1   = true;
  S.juegoTerminado = false;

  A1MESA.abierta = true;
  if (typeof irA === "function") irA("mesa");
}

/* Aplica un "auto1v1_estado" del server a la mesa real. Es el único camino
   por el que entra estado en este modo. */
function auto1v1MesaAplicar(d) {
  const estado = _a1EstadoParaMesa(d && d.snapshot);
  if (!estado) return;
  if (!A1MESA.abierta) auto1v1MesaAbrir(d);
  // El estadio de la mesa lo decide el server (el del más avanzado de los
  // dos, ver _nivelMesaAuto1v1) — misma regla que el relay.
  if (d && typeof d.nivelMesa === "number" && typeof ONLINE !== "undefined") {
    ONLINE.nivelRival = d.nivelMesa;
    if (typeof window.escenarioSincronizar === "function") window.escenarioSincronizar();
  }
  if (typeof netAplicarEstadoRemoto === "function") netAplicarEstadoRemoto(estado);
}

/* Deja la mesa y limpia las banderas. La llama tanto el ✕ del jugador como
   el fin de partida por abandono del rival. */
function auto1v1MesaCerrar() {
  A1MESA.abierta = false;
  if (typeof S !== "undefined") {
    S.modoAuto1v1 = false;
    // ⚠️ ANTES de resetear: _onlineResetEstadoPartida() recorta AVATARS
    // hasta su largo original (saca el avatar del rival online) y de paso
    // llama a escenarioSincronizar() → actualizarTodaLaInterfaz() →
    // renderizarAvataresFijos(), que lee AVATARS[S.idRival].icon. Si
    // idRival sigue apuntando al avatar que se acaba de sacar, eso es un
    // TypeError en el medio del cierre y la pantalla queda a medio pintar.
    // Encontrado probando con dos clientes reales.
    S.idRival = 0;
  }
  if (typeof _onlineResetEstadoPartida === "function") _onlineResetEstadoPartida();
}
