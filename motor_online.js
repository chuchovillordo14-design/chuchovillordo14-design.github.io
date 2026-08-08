// ══════════════════════════════════════════════════════════════
// MOTOR ONLINE — adapta el motor de juego (S, juego.js, juego_ui.js)
// al modo "Partido Amistoso Online".
//
// Arquitectura: HOST AUTORITATIVO + ESPEJO
//   - El HOST corre el motor real (S, igual que en modo offline).
//     Para el host, "jugador" = vos, "rival" = tu amigo conectado.
//   - El INVITADO no corre la lógica: recibe un snapshot de S ya
//     ESPEJADO (donde "jugador"/"rival" están invertidos, para que
//     en su pantalla "jugador" siga siendo "vos mismo") y lo aplica
//     directo a su S local. La UI (juego_ui.js) se renderiza igual
//     que en modo offline, sin saber que está en red.
//   - Las acciones del invitado (jugar carta, cantar, responder...)
//     se interceptan en juego.js (S.modoOnline && !S.esHost) y se
//     mandan como mensajes al host, que las aplica con las funciones
//     "Rival" de este archivo (equivalentes a las del jugador, pero
//     para el bando "rival").
// ══════════════════════════════════════════════════════════════

// ── Serialización del estado ─────────────────────────────────────

const _ONLINE_CAMPOS_ESTADO = [
  "puntosJugador", "puntosRival", "limitePuntos",
  "manoJugador", "manoRival",
  "cartasRondaJugador", "cartasRondaRival", "ganadoresRonda",
  "rondaActual", "turnoActual", "turnoMano",
  "envidoCantado", "envidoTerminado", "nivelEnvido", "historialEnvido",
  "jugadorTiroEnR0", "rivalTiroEnR0",
  "trucoCantado", "nivelTruco", "nivelTrucoAceptado",
  "ultimoEnCantarTruco", "ultimoEnAceptarTruco",
  "cantoPendiente", "quienCantoPendiente",
  "trucoDiferido", "trucoDiferidoDe",
  // cfgFlor viaja porque es config de la PARTIDA y la fija el host: sin esto
  // el invitado se quedaba con su default local (false) y florPropiaPendiente()
  // le daba false teniendo flor → le aparecía el botón ENVIDO, lo apretaba y el
  // host se lo rechazaba en silencio. Botón muerto.
  "cfgFlor",
  "jugadorTieneFlor", "rivalTieneFlor", "florCantada", "florCantadaPor", "florTerminada",
  "jugadorPasoFlor", "rivalPasoFlor",
  "nivelFlor", "historialFlor",
  "revealEnvidoMano",
  "juegoTerminado",
];

// Espeja el reveal de envido/flor (las cartas que se muestran al fin de mano):
// swap jugador<->rival para la perspectiva del invitado.
function _espejarReveal(r) {
  if (!r) return null;
  return {
    titulo: r.titulo, apuesta: r.apuesta, ganoJugador: !r.ganoJugador,
    ptsJ: r.ptsR, ptsR: r.ptsJ, cartasJ: r.cartasR, cartasR: r.cartasJ,
  };
}

function netSerializarEstado() {
  const out = {};
  _ONLINE_CAMPOS_ESTADO.forEach(k => { out[k] = S[k]; });
  return out;
}

// 'jugador' <-> 'rival' ; deja 'parda', null, etc. sin tocar
function _swapRol(x) {
  if (x === "jugador") return "rival";
  if (x === "rival")   return "jugador";
  return x;
}

// Redacta una mano oculta: preserva la cuenta (para pintar los dorsos) pero
// NO manda las cartas reales. Evita que el invitado lea la mano del host por
// el WebSocket (la UI del rival solo cuenta cartas, nunca usa el valor).
function _redactarMano(mano) {
  return (mano || []).map(c => (c ? "?" : null));
}

// Invierte un snapshot para que el invitado lo vea desde su propio
// punto de vista ("jugador" = invitado, "rival" = host).
function netEspejarEstado(snap) {
  return {
    puntosJugador: snap.puntosRival,
    puntosRival:   snap.puntosJugador,
    limitePuntos:  snap.limitePuntos,

    manoJugador: snap.manoRival,                 // la mano del invitado (la ve él, ok)
    manoRival:   _redactarMano(snap.manoJugador), // la mano del HOST: redactada (no filtrar cartas)

    cartasRondaJugador: snap.cartasRondaRival,
    cartasRondaRival:   snap.cartasRondaJugador,
    ganadoresRonda:     (snap.ganadoresRonda || []).map(_swapRol),

    rondaActual: snap.rondaActual,
    turnoActual: _swapRol(snap.turnoActual),
    turnoMano:   _swapRol(snap.turnoMano),

    envidoCantado:   snap.envidoCantado,
    envidoTerminado: snap.envidoTerminado,
    nivelEnvido:     snap.nivelEnvido,
    historialEnvido: snap.historialEnvido,
    jugadorTiroEnR0: snap.rivalTiroEnR0,
    rivalTiroEnR0:   snap.jugadorTiroEnR0,

    trucoCantado:         snap.trucoCantado,
    nivelTruco:           snap.nivelTruco,
    nivelTrucoAceptado:   snap.nivelTrucoAceptado,
    ultimoEnCantarTruco:  _swapRol(snap.ultimoEnCantarTruco),
    ultimoEnAceptarTruco: _swapRol(snap.ultimoEnAceptarTruco),

    cantoPendiente:      snap.cantoPendiente,
    quienCantoPendiente: _swapRol(snap.quienCantoPendiente),

    trucoDiferido:   snap.trucoDiferido,
    trucoDiferidoDe: _swapRol(snap.trucoDiferidoDe),

    // La flor del HOST es información privada hasta que la canta — igual que
    // sus cartas. Se redacta: si se mandaba tal cual, el invitado sabía que
    // el host tenía flor antes del canto (y florTerminada se deduce de lo
    // mismo, así que también se recalcula desde lo que el invitado sí puede
    // saber: su propia flor).
    cfgFlor:          snap.cfgFlor,          // la regla la fija el host
    jugadorTieneFlor: snap.rivalTieneFlor,   // la del invitado: es suya, la ve
    rivalTieneFlor:   snap.florCantada ? snap.jugadorTieneFlor : false,
    florCantada:      snap.florCantada,
    florCantadaPor:   _swapRol(snap.florCantadaPor),
    florTerminada:    snap.florCantada
                        ? snap.florTerminada
                        : (!snap.cfgFlor || !snap.rivalTieneFlor),
    jugadorPasoFlor:  snap.rivalPasoFlor,
    rivalPasoFlor:    snap.florCantada ? snap.jugadorPasoFlor : false,
    nivelFlor:        snap.nivelFlor,
    historialFlor:    snap.historialFlor,

    revealEnvidoMano: _espejarReveal(snap.revealEnvidoMano),

    juegoTerminado: snap.juegoTerminado,
  };
}

// ── Aplicar estado recibido (lado invitado) ──────────────────────

// El ENVÍO ya usaba la allowlist _ONLINE_CAMPOS_ESTADO; la RECEPCIÓN copiaba
// cualquier clave que mandara el host. Con `esHost:true` el guest se creía
// autoritativo y dejaba de mandar sus jugadas (mesa muda), y con `idRival`
// fuera de rango AVATARS[...] tiraba TypeError en cada fin de mano.
// Misma lista en las dos direcciones: la clase entera se cierra acá.
function _estadoSeguro(estado) {
  const out = {};
  if (!estado || typeof estado !== "object") return out;
  _ONLINE_CAMPOS_ESTADO.forEach(k => { if (k in estado) out[k] = estado[k]; });
  return out;
}

function netAplicarEstadoRemoto(estadoCrudo) {
  const estado = _estadoSeguro(estadoCrudo);
  const prev = {
    cantoPendiente:      S.cantoPendiente,
    quienCantoPendiente: S.quienCantoPendiente,
    envidoTerminado:     S.envidoTerminado,
    trucoCantado:        S.trucoCantado,
    nivelTruco:          S.nivelTruco,
    rondaActual:         S.rondaActual,
    puntosJugador:       S.puntosJugador,
    puntosRival:         S.puntosRival,
    juegoTerminado:      S.juegoTerminado,
    ganadoresRondaLen:   (S.ganadoresRonda || []).length,
    historialEnvido:     S.historialEnvido || [],
    florTerminada:       S.florTerminada,
    florCantada:         S.florCantada,
  };

  // El reveal de envido es transitorio: el host lo pone al resolver el envido
  // y lo limpia al fin de mano. Para que no se pierda por una carrera de
  // renders, NO lo pisamos con null — solo lo seteamos cuando llega con datos;
  // el propio overlay de resultado del invitado lo consume y limpia.
  const reveal = estado.revealEnvidoMano;
  delete estado.revealEnvidoMano;

  Object.assign(S, estado);
  if (reveal) S.revealEnvidoMano = reveal;

  _onlineNotificarCambios(prev, estado);

  if (typeof actualizarTodaLaInterfaz === "function") actualizarTodaLaInterfaz();
  if (typeof evaluarTurnoActual === "function") evaluarTurnoActual();
}

// Toasts/sonidos al recibir un nuevo estado, para que el invitado
// se entere de lo que pasó (cantos del rival, resultado de envidos,
// rondas, manos y fin de partido) sin tener que mirar la mesa fijo.
function _onlineNotificarCambios(prev, nuevo) {
  const nombreRival = (typeof AVATARS !== "undefined" && AVATARS[S.idRival])
    ? AVATARS[S.idRival].name : "Rival";

  // ── Nuevo canto del rival ──────────────────────────────────
  if (nuevo.cantoPendiente && !prev.cantoPendiente && nuevo.quienCantoPendiente === "rival") {
    if (nuevo.cantoPendiente === "envido") {
      const labels = { envido: "¡ENVIDO!", real: "¡REAL ENVIDO!", falta: "¡FALTA ENVIDO!" };
      const hist = nuevo.historialEnvido || [];
      const tipo = hist[hist.length - 1] || "envido";
      const label = labels[tipo] || "¡ENVIDO!";
      showToast(`${nombreRival}: ${label}`);
      if (typeof mostrarOverlayCanto === "function") mostrarOverlayCanto(label, "rival");
      if (typeof playSound === "function") playSound("canto");
    } else if (nuevo.cantoPendiente === "truco") {
      const labels = { 2: "¡TRUCO!", 3: "¡RETRUCO!", 4: "¡VALE 4!" };
      const label = labels[nuevo.nivelTruco] || "¡TRUCO!";
      showToast(`${nombreRival}: ${label}`);
      if (typeof mostrarOverlayCanto === "function") mostrarOverlayCanto(label, "rival");
      if (typeof playSound === "function") playSound("silbato");
    } else if (nuevo.cantoPendiente === "flor") {
      const labels = { flor: "¡FLOR!", contraflor: "¡CONTRAFLOR!", contraflorresto: "¡CONTRAFLOR AL RESTO!" };
      const hist = nuevo.historialFlor || [];
      const tipo = hist[hist.length - 1] || "flor";
      const label = labels[tipo] || "¡FLOR!";
      showToast(`${nombreRival}: ${label}`);
      if (typeof mostrarOverlayCanto === "function") mostrarOverlayCanto(label, "rival");
      if (typeof playSound === "function") playSound("canto");
    }
  }

  // ── Flor recién cantada ──────────────────────────────────────
  // Antes esto asumía que la había cantado el rival SIEMPRE, así que el
  // invitado que cantaba su propia flor recibía "HOST: ¡FLOR!". Ahora el
  // estado dice quién la cantó (florCantadaPor, ya espejado).
  if (nuevo.florCantada && !prev.florCantada && !nuevo.cantoPendiente) {
    const laCantoElRival = nuevo.florCantadaPor !== "jugador";
    showToast(laCantoElRival ? `${nombreRival}: ¡FLOR!` : `Cantaste: ¡FLOR!`);
    if (typeof mostrarOverlayCanto === "function") {
      mostrarOverlayCanto("¡FLOR!", laCantoElRival ? "rival" : "jugador");
    }
    if (typeof playSound === "function") playSound("canto");
  }

  // ── Envido resuelto ─────────────────────────────────────────
  // Si la FLOR acaba de anular el envido, el envido "termina" sin pagar nada y
  // los puntos que se movieron son los de la flor. Sin esta guarda el invitado
  // veía "ganó el envido (+3)" Y "ganó la flor (+3)" por los mismos 3 puntos:
  // uno era mentira y el otro sonaba a que había perdido 6.
  const florAnuloElEnvido = nuevo.florCantada && !prev.florCantada;
  if (prev.cantoPendiente === "envido" && !nuevo.cantoPendiente
      && nuevo.envidoTerminado && !prev.envidoTerminado && !florAnuloElEnvido) {
    if (nuevo.puntosJugador > prev.puntosJugador) {
      showToast(`✅ Ganaste el envido (+${nuevo.puntosJugador - prev.puntosJugador})`);
      if (typeof playSound === "function") playSound("punto");
    } else if (nuevo.puntosRival > prev.puntosRival) {
      showToast(`❌ ${nombreRival} ganó el envido (+${nuevo.puntosRival - prev.puntosRival})`);
      if (typeof playSound === "function") playSound("parda");
    }
  }

  // ── Flor resuelta (con o sin respuesta) ──────────────────────
  // Ojo: florTerminada llega REDACTADA mientras nadie cantó flor (para no
  // filtrarle al invitado la flor del host), así que para el invitado sin
  // flor nunca hay transición false→true. El disparo bueno en ese caso es
  // el de florCantada; las dos ramas piden que los puntos se hayan movido,
  // así que no se duplica el aviso.
  if ((nuevo.florTerminada && !prev.florTerminada) ||
      (nuevo.florCantada   && !prev.florCantada)) {
    if (nuevo.puntosJugador > prev.puntosJugador) {
      showToast(`✅ Ganaste la flor (+${nuevo.puntosJugador - prev.puntosJugador})`);
      if (typeof playSound === "function") playSound("punto");
    } else if (nuevo.puntosRival > prev.puntosRival) {
      showToast(`❌ ${nombreRival} ganó la flor (+${nuevo.puntosRival - prev.puntosRival})`);
      if (typeof playSound === "function") playSound("parda");
    }
  }

  // ── Truco aceptado ────────────────────────────────────────────
  if (prev.cantoPendiente === "truco" && !nuevo.cantoPendiente
      && nuevo.trucoCantado && !prev.trucoCantado) {
    showToast(`${nombreRival}: ¡QUIERO!`);
    if (typeof mostrarOverlayCanto === "function") mostrarOverlayCanto("¡QUIERO!", "rival");
  }

  // ── Ronda resuelta ────────────────────────────────────────────
  const ganadoresLen = (nuevo.ganadoresRonda || []).length;
  if (ganadoresLen > prev.ganadoresRondaLen) {
    const g = nuevo.ganadoresRonda[ganadoresLen - 1];
    if (g === "jugador")     showToast("¡Ganaste la ronda!");
    else if (g === "rival")  showToast(`${nombreRival} ganó la ronda.`);
    else                      showToast("Ronda parda.");
  }

  // ── Fin de mano (se repartieron cartas nuevas) ────────────────
  if (!nuevo.juegoTerminado && nuevo.rondaActual === 0 && ganadoresLen === 0
      && (prev.ganadoresRondaLen > 0 || prev.rondaActual > 0)) {
    if (nuevo.puntosJugador > prev.puntosJugador) {
      const pts = nuevo.puntosJugador - prev.puntosJugador;
      showToast(`¡Ganaste la mano! +${pts}`);
      if (typeof mostrarOverlayResultadoMano === "function") mostrarOverlayResultadoMano("gano", pts);
    } else if (nuevo.puntosRival > prev.puntosRival) {
      const pts = nuevo.puntosRival - prev.puntosRival;
      showToast(`${nombreRival} ganó la mano.`);
      if (typeof mostrarOverlayResultadoMano === "function") mostrarOverlayResultadoMano("pierde", pts);
    }
    if (typeof playSound === "function") playSound("deal");
  }

  // ── Fin del partido ────────────────────────────────────────────
  if (nuevo.juegoTerminado && !prev.juegoTerminado) {
    if (nuevo.puntosJugador > nuevo.puntosRival) {
      showToast("🏆 ¡FELICITACIONES! GANASTE EL PARTIDO 🏆");
      if (typeof playSound === "function") playSound("win");
    } else {
      showToast(`${nombreRival} ganó el partido. ¡Otra vez será!`);
      if (typeof playSound === "function") playSound("lose");
    }
    // El guest nunca corre juego.js (no dispara 'finDePartido'): se
    // reporta acá, sobre el mismo estado espejado que ya aplicó.
    if (typeof reportarResultadoOnline === "function") {
      reportarResultadoOnline(nuevo.puntosJugador, nuevo.puntosRival, nuevo.limitePuntos);
    }
    // Y por lo mismo, se emite el evento a mano para que la pantalla de fin
    // de partido (overlay con REVANCHA/CONTINUAR) también salga del lado guest.
    if (typeof _emitJuego === "function") {
      _emitJuego("finDePartido", {
        puntosJugador: nuevo.puntosJugador,
        puntosRival:   nuevo.puntosRival,
        limite:        nuevo.limitePuntos || S.limitePuntos,
      });
    }
  }
}

// ── Arranque de la partida online ────────────────────────────────

// El HOST recibe el "hola" del invitado → arranca el motor real.
function onlineIniciarPartidaHost() {
  ONLINE.partidaIniciada = true;
  ONLINE._avatarsBaseLen = AVATARS.length;
  AVATARS.push({ name: ONLINE.nombreRival || "Rival", icon: ONLINE.avatarRival || "avatares/hincha_misterioso.png" });
  S.idRival = AVATARS.length - 1;

  S.nombreJugador = ONLINE.nombre || "Vos";
  S.avatarJugador = "🤠";
  S.modoOnline    = true;
  S.esHost        = true;
  S.puntosJugador = 0;
  S.puntosRival   = 0;
  // Sorteamos quién es mano para que no sea siempre el mismo.
  S.turnoMano     = Math.random() < 0.5 ? "jugador" : "rival";
  S.juegoTerminado = false;

  if (typeof _iniciarPartida === "function") _iniciarPartida();

  // _iniciarPartida() llama a seleccionarRivalAleatorio(), que pisa
  // S.idRival con un avatar al azar: lo volvemos a fijar al del
  // rival real (ya conectado online).
  S.idRival = AVATARS.length - 1;
}

// El INVITADO recibe el primer "estado" del host → se inicializa.
function onlineIniciarPartidaGuest(payload) {
  ONLINE.partidaIniciada = true;
  ONLINE._avatarsBaseLen = AVATARS.length;
  // El host también es un cliente cualquiera: su nombre y su avatar se
  // sanean igual que los del invitado.
  AVATARS.push({ name: nombreSeguro(payload.nombreRival, "Rival"), icon: avatarSeguro(payload.avatarRival) });
  S.idRival = AVATARS.length - 1;

  S.nombreJugador = ONLINE.nombre || "Vos";
  S.avatarJugador = "🤠";
  S.modoOnline    = true;
  S.esHost        = false;
  S.juegoTerminado = false;

  if (typeof irA === "function") irA("mesa");
}

// ── Funciones "Rival" (host aplicando acciones del invitado) ─────
// Son el espejo de las funciones *Jugador / *Subida de juego.js,
// pero para el bando "rival" (controlado por el invitado humano).

function cantarFlorRival() {
  if (S.cantoPendiente) return;
  if (S.turnoActual !== "rival") return;
  if (S.florCantada) return;
  if (typeof florSigueVivo !== "function" || !florSigueVivo()) return;
  if (!S.rivalTieneFlor) return;

  playSound("canto");
  _registrarCantoFlor('flor');
  S.florCantada = true;
  S.florCantadaPor = "rival";

  showToast(`${AVATARS[S.idRival].name}: ¡FLOR!`);
  if (typeof mostrarOverlayCanto === "function") mostrarOverlayCanto("¡FLOR!", "rival");

  if (!S.jugadorTieneFlor) {
    _resolverFlorSinContrincante("rival");
    return;
  }

  S.cantoPendiente      = "flor";
  S.quienCantoPendiente = "rival";
  actualizarTodaLaInterfaz();
  evaluarTurnoActual();
}

// "Achicar" del invitado (rival): se guarda la flor sin cantarla.
// Espejo de pasarFlorJugador() para el bando "rival".
function pasarFlorRival() {
  if (S.cantoPendiente) return;
  if (S.turnoActual !== "rival") return;
  if (S.florCantada) return;
  if (S.rivalPasoFlor) return;
  if (typeof florSigueVivo !== "function" || !florSigueVivo()) return;
  if (!S.rivalTieneFlor) return;

  playSound("click");
  S.rivalPasoFlor = true;
  showToast(`${AVATARS[S.idRival].name} se guardó la flor.`);

  if (!S.jugadorTieneFlor) {
    S.florTerminada = true;
  }

  actualizarTodaLaInterfaz();
  evaluarTurnoActual();
}

// Responde a una Flor cantada por el host (jugador) que está esperando
// respuesta. Espejo de responderFlorJugador() para el bando "rival".
function responderFlorRival(tipo) {
  if (!S.cantoPendiente || S.cantoPendiente !== "flor") return;
  if (S.quienCantoPendiente !== "jugador") return;
  // Igual que del lado del jugador: a una flor pelada no se le dice "no quiero".
  if (tipo === 'no-quiero' && !S.historialFlor.includes('contraflor')
      && !S.historialFlor.includes('contraflorresto')) return;

  if (tipo === 'quiero' || tipo === 'no-quiero') {
    playSound("click");
    if (tipo === 'quiero') {
      showToast(`${AVATARS[S.idRival].name}: ¡CON FLOR QUIERO!`);
      if (typeof mostrarOverlayCanto === "function") mostrarOverlayCanto("¡CON FLOR QUIERO!", "rival");
      setTimeout(() => resolverFlorMesa("quiero"), 400);
    } else {
      showToast(`${AVATARS[S.idRival].name}: NO QUIERO.`);
      if (typeof mostrarOverlayCanto === "function") mostrarOverlayCanto("NO QUIERO", "rival");
      setTimeout(() => resolverFlorMesa("no-quiero"), 400);
    }
    return;
  }

  // contraflor / contraflorresto: sube la apuesta y pasa la pelota al host.
  // Misma validación que el envido: el `tipo` llega por red, se chequea
  // contra la regla compartida antes de mover el pozo.
  if (typeof reglasFlorRaises === "function" &&
      !reglasFlorRaises(S.historialFlor || []).includes(tipo)) return;
  playSound("canto");
  _registrarCantoFlor(tipo);
  S.quienCantoPendiente = "rival"; // ahora el host (jugador) tiene que responder

  const labels = { contraflor: "¡CONTRAFLOR!", contraflorresto: "¡CONTRAFLOR AL RESTO!" };
  showToast(`${AVATARS[S.idRival].name}: ${labels[tipo]}`);
  if (typeof mostrarOverlayCanto === "function") mostrarOverlayCanto(labels[tipo], "rival");
  actualizarTodaLaInterfaz();
  evaluarTurnoActual();
}

function cantarEnvidoRival(tipo) {
  if (S.cantoPendiente) return;
  if (S.turnoActual !== "rival") return;
  if (!envidoSigueVivo()) return;
  // Con flor propia sin resolver no se canta envido (se canta la flor o se achica)
  if (typeof florPropiaPendiente === "function" && florPropiaPendiente("rival")) return;
  if (S.envidoCantado && (tipo === 'real' || tipo === 'falta')) return;

  playSound("canto");
  _registrarCantoEnvido(tipo);
  S.envidoCantado       = true;
  S.cantoPendiente      = "envido";
  S.quienCantoPendiente = "rival";

  const labels = { envido: "¡ENVIDO!", real: "¡REAL ENVIDO!", falta: "¡FALTA ENVIDO!" };
  showToast(`${AVATARS[S.idRival].name}: ${labels[tipo]}`);
  if (typeof mostrarOverlayCanto === "function") mostrarOverlayCanto(labels[tipo], "rival");
  actualizarTodaLaInterfaz();
  evaluarTurnoActual();
}

function cantarTrucoRival(nivel) {
  if (S.cantoPendiente) return;
  if (S.juegoTerminado) return;
  // El truco se canta en tu turno. Sin esta guarda el host aceptaba el
  // "cantarTruco" del invitado en cualquier momento de la mano.
  if (S.turnoActual !== "rival") return;
  if (typeof _nivelTrucoDisponible !== "function") return;
  if (_nivelTrucoDisponible("rival") !== nivel) return;

  playSound("silbato");
  S.cantoPendiente       = "truco";
  S.quienCantoPendiente  = "rival";
  S.ultimoEnCantarTruco  = "rival";
  S.nivelTruco           = nivel;
  if (nivel > 2) S.trucoCantado = true;

  const labels = { 2: "¡TRUCO!", 3: "¡RETRUCO!", 4: "¡VALE 4!" };
  showToast(`${AVATARS[S.idRival].name}: ${labels[nivel]}`);
  if (typeof mostrarOverlayCanto === "function") mostrarOverlayCanto(labels[nivel], "rival");
  actualizarTodaLaInterfaz();
  evaluarTurnoActual();
}

function responderCantoRival(acepta) {
  if (!S.cantoPendiente || S.quienCantoPendiente !== "jugador") return;
  playSound("click");

  if (S.cantoPendiente === "envido") {
    // Mismo criterio que responderCantoJugador (juego.js): responder el
    // envido sin declarar una flor propia pendiente equivale a guardársela
    // ("achicar") — si no, el invitado podía ganar el envido con QUIERO y
    // DESPUÉS seguir teniendo el botón FLOR disponible, cobrando las dos.
    if (typeof florPropiaPendiente === "function" && florPropiaPendiente("rival")) {
      S.rivalPasoFlor = true;
      if (!S.jugadorTieneFlor) S.florTerminada = true;
    }
    if (acepta) {
      showToast(`${AVATARS[S.idRival].name}: ¡QUIERO!`);
      if (typeof mostrarOverlayCanto === "function") mostrarOverlayCanto("¡QUIERO!", "rival");
      setTimeout(() => resolverEnvidoMesa("quiero"), 400);
    } else {
      showToast(`${AVATARS[S.idRival].name}: NO QUIERO.`);
      if (typeof mostrarOverlayCanto === "function") mostrarOverlayCanto("NO QUIERO", "rival");
      setTimeout(() => resolverEnvidoMesa("no-quiero"), 400);
    }
  } else if (S.cantoPendiente === "truco") {
    if (acepta) {
      showToast(`${AVATARS[S.idRival].name}: ¡QUIERO!`);
      if (typeof mostrarOverlayCanto === "function") mostrarOverlayCanto("¡QUIERO!", "rival");
      S.trucoCantado          = true;
      S.nivelTrucoAceptado    = S.nivelTruco;
      S.ultimoEnAceptarTruco  = "rival";
      S.cantoPendiente        = null;
      S.quienCantoPendiente   = null;
      actualizarTodaLaInterfaz();
      evaluarTurnoActual();
    } else {
      showToast(`${AVATARS[S.idRival].name} se fue al mazo.`);
      if (typeof mostrarOverlayCanto === "function") mostrarOverlayCanto("AL MAZO", "rival");
      irseAlMazo("rival");
    }
  }
}

function responderEnvidoConSubidaRival(tipo) {
  if (!S.cantoPendiente || S.cantoPendiente !== "envido") return;
  if (S.quienCantoPendiente !== "jugador") return;
  // La suba llega por RED: validar la legalidad ACÁ, en el host, contra la
  // misma regla compartida que usa el 2v2 (reglas_truco.js). La UI solo
  // ofrece botones legales, pero un guest modificado mandaba "envido" sobre
  // un doble envido, o "real" después de un real, y el pozo escalaba de más.
  if (typeof reglasEnvidoRaises === "function" &&
      !reglasEnvidoRaises(S.historialEnvido || []).includes(tipo)) return;
  // Con flor propia sin resolver el invitado no sube el envido: responde con
  // flor (acción "envido_con_flor").
  if (typeof florPropiaPendiente === "function" && florPropiaPendiente("rival")) return;

  playSound("canto");
  _registrarCantoEnvido(tipo);
  S.envidoCantado       = true;
  S.cantoPendiente      = "envido";
  S.quienCantoPendiente = "rival"; // ahora el host tiene que responder

  const labels = { envido: "¡ENVIDO!", real: "¡REAL ENVIDO!", falta: "¡FALTA ENVIDO!" };
  showToast(`${AVATARS[S.idRival].name}: ${labels[tipo]}`);
  if (typeof mostrarOverlayCanto === "function") mostrarOverlayCanto(labels[tipo], "rival");
  actualizarTodaLaInterfaz();
  evaluarTurnoActual();
}

function responderTrucoSubidaRival(nivel) {
  if (S.cantoPendiente !== "truco" || S.quienCantoPendiente !== "jugador") return;
  if (nivel !== S.nivelTruco + 1 || nivel > 4) return;

  playSound("silbato");

  // Aceptación implícita del nivel cantado por el host
  S.trucoCantado         = true;
  S.nivelTrucoAceptado   = S.nivelTruco;
  S.ultimoEnAceptarTruco = "rival";

  // El invitado canta el nivel superior — el host debe responder
  S.cantoPendiente       = "truco";
  S.quienCantoPendiente  = "rival";
  S.ultimoEnCantarTruco  = "rival";
  S.nivelTruco           = nivel;

  const labels = { 3: "¡RETRUCO!", 4: "¡VALE 4!" };
  showToast(`${AVATARS[S.idRival].name}: ${labels[nivel]}`);
  if (typeof mostrarOverlayCanto === "function") mostrarOverlayCanto(labels[nivel], "rival");
  actualizarTodaLaInterfaz();
  evaluarTurnoActual();
}

function irseAlMazoConCantoPendienteRival() {
  if (!S.cantoPendiente || S.quienCantoPendiente !== "jugador") return;
  playSound("click");

  if (S.cantoPendiente === "flor") {
    S.florTerminada       = true;
    const pts             = puntosFlorNoQuiero();
    S.puntosJugador      += pts;
    S.cantoPendiente      = null;
    S.quienCantoPendiente = null;
    S.trucoDiferido       = false;
    S.trucoDiferidoDe     = null;

    showToast(`${AVATARS[S.idRival].name} no quiso la flor. Vos +${pts} pto${pts > 1 ? "s" : ""}.`);
    if (typeof mostrarOverlayCanto === "function") mostrarOverlayCanto("AL MAZO", "rival");
    actualizarTodaLaInterfaz();
    guardarProgreso();

    if (S.puntosJugador >= S.limitePuntos) {
      setTimeout(repartirNuevaMano, 1000);
      return;
    }
    setTimeout(() => irseAlMazo("rival"), 600);

  } else if (S.cantoPendiente === "envido") {
    S.envidoTerminado     = true;
    const pts             = puntosEnvidoNoQuiero();
    S.puntosJugador      += pts;
    S.cantoPendiente      = null;
    S.quienCantoPendiente = null;
    S.trucoDiferido       = false;
    S.trucoDiferidoDe     = null;

    showToast(`${AVATARS[S.idRival].name} no quiso el envido. Vos +${pts} pto${pts > 1 ? "s" : ""}.`);
    if (typeof mostrarOverlayCanto === "function") mostrarOverlayCanto("AL MAZO", "rival");
    actualizarTodaLaInterfaz();
    guardarProgreso();

    if (S.puntosJugador >= S.limitePuntos) {
      setTimeout(repartirNuevaMano, 1000);
      return;
    }
    setTimeout(() => irseAlMazo("rival"), 600);

  } else if (S.cantoPendiente === "truco") {
    S.cantoPendiente      = null;
    S.quienCantoPendiente = null;
    showToast(`${AVATARS[S.idRival].name} se fue al mazo.`);
    if (typeof mostrarOverlayCanto === "function") mostrarOverlayCanto("AL MAZO", "rival");
    irseAlMazo("rival");
  }
}

function irseAlMazoRival() {
  if (S.cantoPendiente) return;
  if (S.juegoTerminado) return;
  irseAlMazo("rival");
}

// ── Dispatcher de mensajes de red ────────────────────────────────

function onlineProcesarMensaje(payload) {
  if (!payload || typeof payload !== "object" || !payload.accion) return;

  switch (payload.accion) {
    case "hola":
      // Nombre y avatar los elige el cliente de enfrente: se sanean ACÁ, en
      // el borde, para que nada aguas abajo tenga que acordarse de hacerlo.
      ONLINE.nombreRival = nombreSeguro(payload.nombre, "Rival");
      ONLINE.avatarRival = avatarSeguro(payload.avatar);
      // El nivel de estadio del rival decide, junto con el propio, qué mesa
      // ven los dos (el del más avanzado). Viene de la red: se satura al
      // rango real de la escalera acá, en el borde, o un cliente modificado
      // podría mandar cualquier cosa y romper la resolución del escenario.
      ONLINE.nivelRival = Math.max(1, Math.min(6, parseInt(payload.nivel, 10) || 1));
      if (typeof window.escenarioSincronizar === "function") window.escenarioSincronizar();
      if (NET.rol === "host") {
        if (!ONLINE.partidaIniciada) {
          onlineIniciarPartidaHost();
        } else if (S.modoOnline && typeof actualizarTodaLaInterfaz === "function") {
          // El invitado se reconectó a una partida en curso: resincronizamos
          // su nombre/avatar en AVATARS (por si el "hola" trae datos nuevos o
          // se habían perdido) y le reenviamos el estado actual.
          if (typeof AVATARS !== "undefined" && AVATARS[S.idRival]) {
            AVATARS[S.idRival].name = ONLINE.nombreRival || AVATARS[S.idRival].name;
            AVATARS[S.idRival].icon = ONLINE.avatarRival || AVATARS[S.idRival].icon;
          }
          if (typeof showToast === "function") showToast("✅ Tu rival se reconectó.");
          actualizarTodaLaInterfaz();
          // Reenvío EXPLÍCITO del estado: no confiamos en que el 'render'
          // de actualizarTodaLaInterfaz dispare el envío (puede no haber
          // cambios que renderizar, o llegar antes de que el guest esté
          // listo). Sin esto, el guest reconectado se queda con la mesa
          // vacía. Es idempotente: si el render también manda, el guest
          // recibe el mismo estado dos veces y no pasa nada.
          if (typeof netEnviar === "function") {
            netEnviar({
              accion: "estado",
              estado: netEspejarEstado(netSerializarEstado()),
              nombreRival: S.nombreJugador,
              avatarRival: S.avatarJugador,
            });
          }
        }
      }
      break;

    case "estado":
      if (NET.rol !== "guest") return; // solo el invitado recibe estado
      if (!S.modoOnline) onlineIniciarPartidaGuest(payload);
      netAplicarEstadoRemoto(payload.estado);
      break;

    // ── Acciones del invitado (solo el host las procesa) ────────
    case "jugarCarta":
    case "cantarEnvido":
    case "cantarTruco":
    case "responderCanto":
    case "subirEnvido":
    case "subirTruco":
    case "truco_con_envido":
    case "envido_con_flor":
    case "cantarFlor":
    case "pasarFlor":
    case "responderFlor":
    case "truco_con_flor":
    case "mazoConCanto":
    case "mazo":
      _dispatchAccionRival(payload);
      break;

    default:
      break;
  }
}

function _dispatchAccionRival(payload) {
  if (NET.rol !== "host" || !S.modoOnline || !S.esHost) return;

  switch (payload.accion) {
    case "jugarCarta": {
      const idx = Number(payload.idx);
      if (!Number.isInteger(idx) || idx < 0 || idx > 2) break;
      if (S.turnoActual === "rival" && !S.cantoPendiente && !S.juegoTerminado
          && S.manoRival[idx]) {
        jugarCartaRivalFisico(idx);
      }
      break;
    }
    case "cantarEnvido":
      cantarEnvidoRival(payload.tipo);
      break;
    case "cantarTruco":
      cantarTrucoRival(payload.nivel);
      break;
    case "responderCanto":
      responderCantoRival(!!payload.acepta);
      break;
    case "subirEnvido":
      responderEnvidoConSubidaRival(payload.tipo);
      break;
    case "subirTruco":
      responderTrucoSubidaRival(payload.nivel);
      break;
    case "truco_con_envido":
      if (typeof responderTrucoConEnvido === "function") {
        responderTrucoConEnvido("rival", payload.tipo);
      }
      break;
    case "envido_con_flor":
      if (typeof responderEnvidoConFlor === "function") {
        responderEnvidoConFlor("rival");
      }
      break;
    case "cantarFlor":
      cantarFlorRival();
      break;
    case "pasarFlor":
      pasarFlorRival();
      break;
    case "responderFlor":
      responderFlorRival(payload.tipo);
      break;
    case "truco_con_flor":
      if (typeof responderTrucoConFlor === "function") {
        responderTrucoConFlor("rival");
      }
      break;
    case "mazoConCanto":
      irseAlMazoConCantoPendienteRival();
      break;
    case "mazo":
      irseAlMazoRival();
      break;
  }
}

// ── Enganches al motor existente ─────────────────────────────────

let _ultimoEstadoEnviado = null;

function _netBroadcastEstado() {
  if (!S.modoOnline || !S.esHost || typeof netEnviar !== "function") return;
  const estado = netEspejarEstado(netSerializarEstado());
  const firma = JSON.stringify(estado);
  if (firma === _ultimoEstadoEnviado) return;
  _ultimoEstadoEnviado = firma;
  netEnviar({
    accion: "estado",
    estado,
    nombreRival: S.nombreJugador,
    avatarRival: S.avatarJugador,
  });
}

// Cada vez que se redibuja toda la interfaz, si somos el host de
// una partida online, mandamos el estado espejado al invitado.
// (Antes esto wrappeaba actualizarTodaLaInterfaz; ahora nos suscribimos
// al evento 'render' emitido desde juego_ui.js vía onJuego/_emitJuego.)
if (typeof onJuego === "function") {
  onJuego("render", _netBroadcastEstado);
}

// evaluarTurnoActual() ajusta S.turnoActual (y corre después de S.rondaActual++)
// mediante re-renders PARCIALES: nunca llama a actualizarTodaLaInterfaz(), así
// que no emite 'render' y el invitado se quedaba con el turno/ronda viejos —
// veía "TU TURNO" cuando no le tocaba y el host le descartaba cada click.
if (typeof evaluarTurnoActual === "function") {
  const _evaluarTurnoActualBase = evaluarTurnoActual;
  evaluarTurnoActual = function () {
    const r = _evaluarTurnoActualBase.apply(this, arguments);
    _netBroadcastEstado();
    return r;
  };
}

// El gateo de turnoRival() en modo online ahora vive directo en
// ia.js (turnoRival hace `if (S.modoOnline) return;`), ya no hace
// falta wrappearla acá.

// ── Watchdog: forfeit automático si el invitado queda AFK ─────────
// El host es quien corre el motor: si le toca jugar o responder al
// invitado y no lo hace en TURNO_TIMEOUT_MS (socket abierto pero nadie
// del otro lado — pestaña en background, se fue, lo que sea), el host
// resuelve por él con la opción más simple, para no trabar la partida
// indefinidamente. No aplica a las propias decisiones del host (esas
// las toma la persona que tiene el control acá).
const TURNO_TIMEOUT_MS = 45000;
let _watchdogTimer = null;

// true si, del lado del host, se está esperando una acción DEL INVITADO
// (jugar carta o responder un canto que cantó el host).
function _esperandoAlInvitado() {
  if (S.juegoTerminado) return false;
  if (S.cantoPendiente) return S.quienCantoPendiente === "jugador";
  return S.turnoActual === "rival";
}

function _forzarAccionInvitado() {
  if (!S.modoOnline || !S.esHost || S.juegoTerminado) return;
  if (S.cantoPendiente) {
    if (S.cantoPendiente === "flor") {
      // A una flor PELADA no se le dice "no quiero" (es ilegal y
      // responderFlorRival lo rechaza sin cambiar nada, lo que dejaba el
      // watchdog muerto y la mesa colgada). Lo unico legal ahi es comparar.
      const hayContra = S.historialFlor &&
        (S.historialFlor.includes("contraflor") || S.historialFlor.includes("contraflorresto"));
      responderFlorRival(hayContra ? "no-quiero" : "quiero");
      return;
    }
    responderCantoRival(false); // envido/truco: no quiero
    return;
  }
  if (S.turnoActual === "rival") {
    // Jugamos la carta MÁS FLOJA del rival, no la primera del array —
    // antes usaba findIndex(c => c), que podía tirarle el ancho de
    // espadas sin querer. Mismo criterio de fuerza que ia.js (C[c].f).
    const mano = S.manoRival || [];
    let idx = -1, minFuerza = Infinity;
    mano.forEach((c, i) => {
      if (!c) return;
      const f = C[c] ? C[c].f : 0;
      if (f < minFuerza) { minFuerza = f; idx = i; }
    });
    if (idx >= 0) jugarCartaRivalFisico(idx);
  }
}

function _watchdogTick() {
  _watchdogTimer = null;
  if (!S.modoOnline || !S.esHost || !_esperandoAlInvitado()) return;
  if (typeof showToast === "function") showToast("⏱️ Tu rival tardó demasiado — se resuelve solo.");
  _forzarAccionInvitado();
}

if (typeof onJuego === "function") {
  onJuego("render", () => {
    if (!S.modoOnline || !S.esHost) return;
    if (_watchdogTimer) { clearTimeout(_watchdogTimer); _watchdogTimer = null; }
    if (_esperandoAlInvitado()) _watchdogTimer = setTimeout(_watchdogTick, TURNO_TIMEOUT_MS);
  });
}
