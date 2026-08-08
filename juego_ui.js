// ══════════════════════════════════════════════════════════════
// TRUCO ARGENTINO — juego_ui.js  v4  "El Realismo"
// ══════════════════════════════════════════════════════════════

// ─────────────────────────────────────────────────────────────
// FRASES DEL RIVAL — lunfardo auténtico
// ─────────────────────────────────────────────────────────────
const FRASES = {
  // Al cantar — todo con onda de cancha
  truco:       ["¡Truco, esto es la final!", "¡Mano a mano, como un penal!", "¡Truco! ¿Te la bancás?", "¡Dale que es de local!"],
  retruco:     ["¡Retruco, y vamos por la goleada!", "¡Subila, crack!", "¡Retruco, no afloja el equipo!", "¡Tiempo de definir!"],
  vale4:       ["¡Vale cuatro, tiempo de descuento!", "¡Todo o nada, como un penal!", "¡Vale cuatro, va el campeonato!"],
  envido:      ["¡Envido! ¿Tenés con qué?", "¡Te tiro un caño, envido!", "¡Envido, juego de media cancha!", "¡Pongo el envido, dale!"],
  real:        ["¡Real envido, jugadón!", "¡Real envido al ángulo!", "¡Le meto el real, pibe!"],
  falta:       ["¡Falta envido, al fondo de la red!", "¡Falta envido, todo o nada!", "¡Al ángulo con la falta!"],
  flor:        ["¡Flor! Tres palos, tres puntos.", "¡Tengo flor, golazo!", "¡Acá hay flor, eh!", "¡Flor, mirá vos!"],
  contraflor:  ["¡Contraflor, te empardo y te paso!", "¡Y contraflor, dale!", "¡Contraflor, no te me achiques!"],
  contraflorresto: ["¡Contraflor al resto, va el título!", "¡Al resto, todo a la cancha!", "¡Contraflor al resto, qué hacés!"],
  // Al responder
  quiero:      ["¡Quiero! Arrancó el partido.", "¡Voy al frente como un nueve!", "¡Quiero, le entro de una!", "¡Dale, que la juego!"],
  noQuiero:    ["No quiero, me paro atrás.", "Achico y espero el contra.", "Tiro la pelota afuera.", "Paso, no me apuro."],
  mazo:        ["Me voy a los vestuarios.", "Tiro la pelota a la tribuna.", "Pido el cambio, salí.", "No arriesgo, juego al achique."],
  // Al ganar ronda
  ganoRonda:   ["¡Gooool!", "¡Adentro!", "¡La clavé en un ángulo!", "¡Esa es mía, dale!"],
  // Al ganar mano
  ganoMano:    ["¡Partido ganado, a dar la vuelta!", "¡Tres puntos pa'l equipo!", "¡Goleada, papá!", "¡Y la gente lo pide!"],
  // Al perder mano
  perdioMano:  ["Me hiciste un golazo...", "Bien jugada, eh.", "Ahí me ganaste el clásico.", "Qué partidazo, te la dejo."],
  // Comentarios al azar cuando tira carta
  tiraCarta:   ["Ahí va el centro...", "La juego al pie.", "Pase filtrado...", "Tomá, pa' vos.", "La pongo en el área...", "Tocá y andá."],
  // Reacciones al ver carta del jugador
  veCartaBuena:  ["Uy, jugadón...", "Ojo que mete miedo esa.", "Tremendo caño me tiraste."],
  veCartaMala:   ["Esa va al córner.", "Pelota afuera, jaja.", "Fácil pa'l arquero."],
};

function _frase(tipo) {
  const arr = FRASES[tipo];
  if (!arr) return "";
  return arr[Math.floor(Math.random() * arr.length)];
}

// ─────────────────────────────────────────────────────────────
// GLOBALES DE UI
// ─────────────────────────────────────────────────────────────
let avatarSeleccionadoIdx = 0;
/* ¿La cara la eligió el jugador, o se la puso el juego solo (sincronizada
   con su club)? Solo la elegida a mano se persiste en tg_avatar_dt y bloquea
   la sincronización automática. Ver buildAvatarGrid() y setName(). */
let _avatarElegidoAMano = false;
let _repartiendoCartas    = false; // bloquea interacción durante el reparto

/* ── El nombre por defecto ya NO es "El Gaucho" (4 ago 2026) ────────────
   "El Gaucho" era el default de la pantalla de registro, que con el menú
   reducido quedó inalcanzable: en la práctica TODO el que entraba a jugar
   se llamaba así, en la mesa, en el comprobante que se comparte por
   WhatsApp y en el ranking. Chucho lo reportó jugando ("sigue apareciendo
   el gaucho") después de que se arreglara el bug de que además lo GUARDABA
   (ver bugs del 2 ago): aquel fix cortó el pisado del nombre real, pero el
   default seguía saliendo por todos lados.

   Ahora el default es neutro ("Vos", que es como el juego ya te nombra en
   los avisos del envido) y el nombre viejo se trata como "sin nombre":
   quien lo tenga guardado de antes lo tiene porque se lo pusimos nosotros,
   no porque lo haya elegido, así que se borra al leerlo — si no, el fix no
   le llega justamente a los que ya vienen jugando.
   Para ponerse nombre propio: Ajustes → "Tu nombre". */
const NOMBRE_DEFAULT = "Vos";
const _NOMBRE_HEREDADO = "El Gaucho";

function nombreGuardadoDT() {
  let v = "";
  try { v = (localStorage.getItem("tg_nombre_dt") || "").trim(); } catch (_) { return ""; }
  if (v === _NOMBRE_HEREDADO) {
    try { localStorage.removeItem("tg_nombre_dt"); } catch (_) {}
    return "";
  }
  return v;
}

// Restaurar el avatar de sesiones anteriores (se persiste en setName y al
// equipar un fichaje). Sin esto, el avatar elegido se perdía al recargar.
try {
  const _avGuardado = localStorage.getItem("tg_avatar_dt");
  if (_avGuardado) {
    S.avatarJugador = _avGuardado;
    const _avIdx = AVATARS.findIndex(a => a.icon === _avGuardado);
    if (_avIdx >= 0) avatarSeleccionadoIdx = _avIdx;
    // Si hay una cara guardada es porque el jugador la eligió (desde este
    // arreglo solo se persiste la elegida): que siga ganando en los próximos
    // registros y no la pise la sincronización con el club.
    _avatarElegidoAMano = true;
  }
  // El nombre también: sin esto la pantalla de registro aparecía en blanco
  // aunque ya tuvieras nombre puesto, y volver a entrar y darle a "SALIR A
  // LA CANCHA" sin escribir nada te renombraba con el default.
  const _nomGuardado = nombreGuardadoDT();
  if (_nomGuardado) {
    S.nombreJugador = _nomGuardado;
    const _inp = document.getElementById("name-input");
    if (_inp && !_inp.value) _inp.value = _nomGuardado;
  }
} catch (e) {}

// ─────────────────────────────────────────────────────────────
// PANTALLA DE REGISTRO
// ─────────────────────────────────────────────────────────────

// setName() es el botón real de la pantalla de registro ("⚽ SALIR A LA
// CANCHA", el flujo del Modo DT): entrar por ahí apaga TODA bandera de
// modo que haya quedado prendida por abandonar otro modo a mitad de
// partida (ver limpiarBanderasDeModo en equipos.js).
//
// copas.js / mundial.js / equipos.js (amistoso) NO deben llamar a este
// setName(): ya limpian las banderas y prenden la SUYA antes de arrancar
// el partido, y si después llamaran a setName(), su propio
// limpiarBanderasDeModo() interno la volvía a apagar un instante después
// — el cuadro nunca avanzaba, la Liga anotaba el partido como fecha del
// Modo DT, y el rival se re-sorteaba en vez de ser el del cuadro. Por eso
// existe _arrancarConNombreYAvatar(): el registro compartido de
// nombre/avatar/partida, SIN tocar banderas. Los tres módulos la llaman
// directo. setName() sigue siendo la única puerta que limpia.
function _arrancarConNombreYAvatar() {
  const input = document.getElementById("name-input");
  // El input SOLO tiene algo si el jugador pasó por la pantalla de registro.
  // Los modos que arrancan directo (Copas, Mundial, Amistoso, Torneo Rápido)
  // no pasan por ahí, así que lo leían vacío, caían en el default y —lo
  // peor— lo GUARDABAN, pisando el nombre real del jugador para siempre.
  // El guardado manda antes que el default, igual que en jugarYa().
  const tipeado = (input && input.value.trim()) || "";
  const guardado = nombreGuardadoDT();
  const elegido = tipeado || guardado;
  S.nombreJugador = elegido || NOMBRE_DEFAULT;
  S.avatarJugador = AVATARS[avatarSeleccionadoIdx].icon;
  // Persistir nombre y avatar para que "JUGAR YA" (y la próxima sesión) los
  // reuse. ⚠️ El DEFAULT no se guarda: guardarlo lo volvía indistinguible de
  // un nombre elegido a mano, que es como "El Gaucho" terminó pegado en el
  // localStorage de todo el mundo. Solo se persiste lo que el jugador puso.
  try {
    if (elegido) localStorage.setItem("tg_nombre_dt", elegido);
    // MISMO criterio que el nombre: solo se persiste la cara ELEGIDA. Antes
    // se guardaba siempre, así que el primer registro clavaba el avatar
    // auto-sincronizado con el club de ese momento y ya nunca volvía a
    // cambiar: jugabas con River y seguías con la cara del hincha de Boca, y
    // en la Carrera con el Real Madrid, lo mismo.
    if (_avatarElegidoAMano) localStorage.setItem("tg_avatar_dt", S.avatarJugador);
  } catch (_) {}
  _iniciarPartida();
}

function setName() {
  if (typeof limpiarBanderasDeModo === "function") limpiarBanderasDeModo();
  // Restaurar el club/liga del Modo DT: si el jugador venía de Mundial/
  // Copas/Amistoso/Club, equipoSel/LIGA quedaron pisados por el equipo de
  // ese modo (aplicarEquipoEnMesa no re-sortea en esos modos). Sin esto,
  // "SALIR A LA CANCHA" arrancaba el Modo DT con un club/liga ajenos en vez
  // de restaurar el guardado (ver restaurarEquipoDT en equipos.js, que
  // hasta ahora solo se llamaba desde jugarYa()).
  if (typeof restaurarEquipoDT === "function") restaurarEquipoDT();
  _arrancarConNombreYAvatar();
}

// Arranca un partido nuevo y navega a la mesa. Se usa tanto desde
// setName() (registro normal / Modo DT) como desde Partido Amistoso,
// que ya dejó equipoSel/equipoRival fijados antes de llamar acá.
// Transición de "kickoff": overlay breve con la pelota entrando pateada y
// "¡ARRANCA!" que se desvanece revelando la mesa. Respeta reduce-motion.
function _kickoffTransition() {
  try {
    if (window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let ov = document.getElementById("kickoff-ov");
    if (!ov) {
      ov = document.createElement("div");
      ov.id = "kickoff-ov";
      ov.innerHTML = '<div class="ko-ball">⚽</div><div class="ko-txt">¡ARRANCA!</div>';
      document.body.appendChild(ov);
    }
    ov.classList.remove("go"); void ov.offsetWidth; ov.classList.add("go");
    if (typeof playSound === "function") playSound("silbato");
    clearTimeout(ov._t); ov._t = setTimeout(() => ov.classList.remove("go"), 1050);
  } catch (e) {}
}

function _iniciarPartida() {
  // Navegar a la mesa usando el sistema de pantallas
  if (typeof irA === "function") {
    irA("mesa");
  } else {
    document.getElementById("name-screen").style.display = "none";
    document.getElementById("mesa").style.display = "grid";
  }
  _kickoffTransition();
  // Toda partida iniciada vía setName() arranca de cero. Sin esto, los
  // partidos de torneo (Copas / Mundial) que se lanzan con setName empezaban
  // con el marcador del partido anterior ya en el límite, y repartirNuevaMano
  // los daba por terminados al instante ("el rival ganó") sin jugar.
  // (Retomar partida NO pasa por acá: usa repartirNuevaMano directo.)
  purgarOverlays();
  S.puntosJugador  = 0;
  S.puntosRival    = 0;
  S.juegoTerminado = false;
  S._manoCerrada   = false;
  // BUG FIX: el primer mano de cada partido debe ser aleatorio.
  // repartirNuevaMano() ALTERNA S.turnoMano, así que pre-seteamos un valor
  // aleatorio y el toggle produce un primer mano al azar.
  S.turnoMano = Math.random() < 0.5 ? "jugador" : "rival";
  seleccionarRivalAleatorio();
  if (typeof _emitJuego === "function") _emitJuego("nuevoPartido");
  repartirNuevaMano();
}

// ⚡ JUGAR YA — arranca una mano vs IA en un solo toque, sin pasar por
// la pantalla de registro. Usa el equipo guardado (o sortea uno la
// primera vez) y el nombre que haya, con default. Cero fricción: el
// jugador personaliza avatar/equipo/nombre DESPUÉS si quiere.
function jugarYa() {
  // Partido casual: limpiar TODOS los modos especiales para que sortee
  // rival solo (ver limpiarBanderasDeModo en equipos.js).
  if (typeof limpiarBanderasDeModo === "function") limpiarBanderasDeModo();
  // Y DESPUÉS prender la propia (contrato de limpiarBanderasDeModo). Nadie
  // la prendía: la guarda de liga.js estaba muerta y cada Picadito avanzaba
  // una fecha del Modo DT contra el rival del FIXTURE (no el de la mesa),
  // regalaba sobres y abría la tabla de posiciones.
  if (typeof window !== "undefined") window.modoPicadito = true;
  if (typeof _retomando   !== "undefined") _retomando   = false;

  // Equipo: restaurar el guardado; si es la primera vez, sortear uno
  // de la liga argentina (default con onda para un juego de truco).
  if (typeof restaurarEquipoDT === "function") restaurarEquipoDT();
  if (typeof equipoSel === "undefined" || !equipoSel) {
    if (typeof LIGA_LPA !== "undefined" && LIGA_LPA.equipos && LIGA_LPA.equipos.length) {
      equipoSel = LIGA_LPA.equipos[Math.floor(Math.random() * LIGA_LPA.equipos.length)];
      if (typeof LIGA !== "undefined") LIGA = LIGA_LPA;
    }
  }
  // GUARDARLO. Sin esto el sorteo se repetía en cada arranque: con el menú
  // reducido la pantalla de registro no es alcanzable, así que el Picadito
  // es el único lugar donde sale un club — y el jugador amanecía hincha de
  // otro equipo cada vez que abría el juego. Va fuera del if de arriba a
  // propósito: también cubre el caso de que equipoSel ya esté en memoria
  // (de esta misma sesión) pero todavía no se haya persistido nunca.
  if (typeof equipoSel !== "undefined" && equipoSel && equipoSel.id &&
      typeof lsSet === "function" && !localStorage.getItem("truco_equipo")) {
    lsSet("truco_equipo", equipoSel.id);
  }

  // Nombre/avatar: lo que ya haya, sin obligar a completar nada.
  if (!S.nombreJugador || S.nombreJugador === NOMBRE_DEFAULT) {
    S.nombreJugador = nombreGuardadoDT() || NOMBRE_DEFAULT;
  }
  // Sin avatar elegido a mano, que sea el hincha del club que acaba de
  // salir sorteado — si no, el Picadito te pone la cara de un hincha de
  // River al lado del escudo de cualquier otro club.
  if (typeof sincronizarAvatarJugadorConClub === "function") sincronizarAvatarJugadorConClub();
  if (AVATARS[avatarSeleccionadoIdx]) S.avatarJugador = AVATARS[avatarSeleccionadoIdx].icon;

  _iniciarPartida();
  // Sortear y pintar el escudo del rival (sin esto quedaba en blanco).
  if (typeof aplicarEquipoEnMesa === "function") aplicarEquipoEnMesa();
}

function buildAvatarGrid() {
  const grid = document.getElementById("avatar-grid");
  if (!grid) return;
  grid.innerHTML = "";
  AVATARS.forEach((av, i) => {
    if (av._generico) return; // slot interno del rival sin hincha propio
    const div = document.createElement("div");
    div.className = `av-item ${i === avatarSeleccionadoIdx ? "selected" : ""}`;
    // esc() en el nombre: la grilla itera TODO AVATARS, y motor_online.js
    // le agrega una entrada con el nombre que mandó el rival.
    div.innerHTML = `<div class="av-icon" style="font-size:30px;line-height:1">${_avatarIconHTML(av.icon, 44)}</div>
                     <div class="av-name">${esc(av.name)}</div>`;
    // _avatarElegidoAMano: marca que la cara la puso el JUGADOR. Sin esta
    // señal, setName() persistía el avatar SIEMPRE —incluso el que se había
    // auto-sincronizado con el club— y a partir de ahí quedaba clavado: te
    // pasabas a River y seguías con la cara del hincha de Boca. Es el mismo
    // error que ya se había arreglado para el NOMBRE ("El Gaucho"), que por
    // eso se guarda solo `if (elegido)`.
    div.onclick = () => { avatarSeleccionadoIdx = i; _avatarElegidoAMano = true; buildAvatarGrid(); };
    grid.appendChild(div);
  });
}

// ─────────────────────────────────────────────────────────────
// ACTUALIZACIÓN GLOBAL
// ─────────────────────────────────────────────────────────────

function actualizarTodaLaInterfaz() {
  renderizarManoJugador();
  renderizarManoRival();
  renderizarCartasEnMesa();
  renderizarRondasPanel();
  renderizarPuntajes();
  renderizarAvataresFijos();
  renderizarBadgesMano();
  renderizarBotonesAccionJugador();
  renderizarInfoBar();
  renderizarPanelLateral();
  _actualizarPosicionMazo();
  _actualizarPanelActividad();
  // Arrancar o detener el timer según el estado actual del turno
  if (typeof iniciarTimer === "function") {
    const hayTurnoActivo = !S.juegoTerminado && (
      S.turnoActual === "jugador" ||
      (S.cantoPendiente && S.quienCantoPendiente === "rival")
    );
    if (hayTurnoActivo && !_timerActivo) iniciarTimer();
    else if (!hayTurnoActivo) detenerTimer();
  }
  if (typeof _emitJuego === "function") _emitJuego("render");
}

// Mazo sobrante: pila decorativa boca abajo, ubicada a la izquierda
// de la mano de quien es "mano" en el reparto actual (S.turnoMano).
function _actualizarPosicionMazo() {
  const mazo = document.getElementById("mazo-pos");
  if (!mazo) return;
  const slotId = S.turnoMano === "rival" ? "mazo-slot-rival" : "mazo-slot-jugador";
  const slot = document.getElementById(slotId);
  if (slot && mazo.parentElement !== slot) slot.appendChild(mazo);
}

// ─────────────────────────────────────────────────────────────
// MANOS — reparto animado carta por carta
// ─────────────────────────────────────────────────────────────

// Candado anti doble-click: evita que dos taps rápidos en cartas
// distintas agenden dos jugadas en el mismo turno.
let _jugandoCarta = false;

function renderizarManoJugador(animar) {
  const container = document.getElementById("player-hand");
  if (!container) return;
  // Barrer cualquier fantasma de arrastre que haya quedado flotando: al
  // jugar una carta la mano se re-renderiza, así que acá garantizamos que
  // no sobreviva ninguna copia de la carta fuera de la mano.
  if (typeof _limpiarGhostsHuerfanos === "function") _limpiarGhostsHuerfanos();
  container.innerHTML = "";
  _jugandoCarta = false; // cada re-render habilita una nueva jugada
  // Nueva mano: las cartas de la mesa vieja ya no cuentan como "animadas".
  if (animar && typeof _resetAnimMesa === "function") _resetAnimMesa();
  const puedejugar = S.turnoActual === "jugador"
    && !S.cantoPendiente
    && !S.juegoTerminado
    && !_repartiendoCartas
    // BUG FIX: si ya jugaste tu carta de esta ronda (esperando la del
    // rival / resolverFinDeRonda diferido), las restantes no son
    // jugables hasta que arranque la próxima ronda.
    && !S.cartasRondaJugador[S.rondaActual];

  S.manoJugador.forEach((cartaId, idx) => {
    if (!cartaId) return;
    const carta = C[cartaId];
    const div   = document.createElement("div");
    const anim  = animar ? ` deal-anim` : "";
    div.className = `card${anim}${puedejugar ? " can-play" : ""}`;
    if (animar) div.style.animationDelay = `${idx * 0.09}s`;
    div.title = `${carta.n} de ${carta.p}`;
    const img = document.createElement("img");
    img.src = urlCarta(cartaId);
    img.alt = `${carta.n} de ${carta.p}`;
    img.draggable = false;
    img.onerror = () => { div.innerHTML = `<div class="carta-ph"><span class="carta-ph-n">${carta.n}</span><span class="carta-ph-p">${carta.p}</span></div>`; };
    div.appendChild(img);
    if (puedejugar) {
      div.onclick = () => {
        if (_suprimirClick) return; // venía de un drag: no jugar de nuevo
        if (_jugandoCarta) return;  // ya hay una jugada en curso
        _jugandoCarta = true;
        _volarCartaJugador(div, idx); // clon que vuela a la mesa
      };
      // La jugada central del juego era inalcanzable por teclado/lector de
      // pantalla (un <div onclick> sin más). role+tabindex+Enter/Espacio la
      // exponen sin tocar el mouse/touch de arriba.
      div.setAttribute("role", "button");
      div.setAttribute("tabindex", "0");
      div.setAttribute("aria-label", `Jugar ${carta.n} de ${carta.p}`);
      div.onkeydown = (e) => {
        if (e.key !== "Enter" && e.key !== " ") return;
        e.preventDefault();
        div.onclick();
      };
      _hacerCartaArrastrable(div, idx); // arrastrar a la mesa para jugar
      _hacerCartaTilt(div);             // inclinación 3D según el mouse
    }
    container.appendChild(div);
  });
}

// ─────────────────────────────────────────────────────────────
// DRAG & DROP — arrastrar una carta a la mesa para jugarla.
// Usa Pointer Events (mouse + touch unificados) con fallback a click:
// un toque simple (sin mover) sigue jugando la carta como antes.
// ─────────────────────────────────────────────────────────────
let _suprimirClick = false; // true brevemente tras un drag, para que el
                            // "click" que dispara el pointerup no rejuegue.

function _dropZoneEl()  { return document.getElementById("played-row"); }
function _dropOverlay() { return document.getElementById("drop-zone-overlay"); }
function _dragHintEl()  { return document.getElementById("drag-hint"); }

function _sobreDropZone(x, y) {
  const z = _dropZoneEl();
  if (!z) return false;
  const r = z.getBoundingClientRect();
  return x >= r.left && x <= r.right && y >= r.top && y <= r.bottom;
}

// Borra CUALQUIER fantasma de arrastre que haya quedado flotando (no solo el
// que conocemos), para que nunca quede una copia de la carta en pantalla.
function _limpiarGhostsHuerfanos() {
  document.querySelectorAll(".card-drag-ghost").forEach(g => g.remove());
  document.querySelectorAll(".card.dragging-origin").forEach(d => d.classList.remove("dragging-origin"));
}

function _limpiarDrag(ghost, div) {
  if (ghost && ghost.parentNode) ghost.parentNode.removeChild(ghost);
  if (div) div.classList.remove("dragging-origin");
  _limpiarGhostsHuerfanos();
  const ov = _dropOverlay(); if (ov) ov.classList.remove("drag-over");
  const h  = _dragHintEl();  if (h)  h.classList.remove("show");
}

function _hacerCartaArrastrable(div, idx) {
  let startX = 0, startY = 0, pointerId = null, dragging = false, ghost = null;
  const UMBRAL = 8; // px que hay que mover para que cuente como "arrastre"

  div.addEventListener("pointerdown", (e) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    startX = e.clientX; startY = e.clientY;
    pointerId = e.pointerId; dragging = false;
  });

  div.addEventListener("pointermove", (e) => {
    if (pointerId === null) return;
    const dx = e.clientX - startX, dy = e.clientY - startY;

    if (!dragging && Math.hypot(dx, dy) > UMBRAL) {
      dragging = true;
      try { div.setPointerCapture(pointerId); } catch (_) {}
      ghost = div.cloneNode(true);
      ghost.classList.add("card-drag-ghost");
      ghost.classList.remove("can-play", "selected");
      document.body.appendChild(ghost);
      div.classList.add("dragging-origin");
      const h = _dragHintEl(); if (h) h.classList.add("show");
    }

    if (dragging) {
      e.preventDefault();
      ghost.style.left = e.clientX + "px";
      ghost.style.top  = e.clientY + "px";
      const ov = _dropOverlay();
      if (ov) ov.classList.toggle("drag-over", _sobreDropZone(e.clientX, e.clientY));
    }
  });

  div.addEventListener("pointerup", (e) => {
    if (pointerId === null) return;
    const fueDrag = dragging;
    const enZona  = _sobreDropZone(e.clientX, e.clientY);
    _limpiarDrag(ghost, div);
    ghost = null; pointerId = null; dragging = false;

    if (fueDrag) {
      // Evitar que el "click" que sigue al pointerup rejuegue la carta.
      _suprimirClick = true;
      setTimeout(() => { _suprimirClick = false; }, 60);
      if (enZona) jugarCartaJugador(idx);
      // Si se soltó fuera de la mesa, no se juega (la carta vuelve sola).
    }
  });

  div.addEventListener("pointercancel", () => {
    _limpiarDrag(ghost, div);
    ghost = null; pointerId = null; dragging = false;
  });
}

// ─────────────────────────────────────────────────────────────
// HOVER 3D — la carta se inclina siguiendo el mouse (tilt dinámico).
// Se desactiva en touch (no hay hover) y con prefers-reduced-motion.
// ─────────────────────────────────────────────────────────────
function _reduceMotion() {
  return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function _hacerCartaTilt(div) {
  if (_reduceMotion()) return;
  const MAX = 14; // grados máximos de inclinación
  div.addEventListener("pointermove", (e) => {
    if (e.pointerType === "touch") return;      // el touch se usa para arrastrar
    if (div.classList.contains("dragging-origin")) return;
    const r = div.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;   // 0..1
    const py = (e.clientY - r.top)  / r.height;  // 0..1
    const rotY = (px - 0.5) *  2 * MAX;          // izq/der
    const rotX = (py - 0.5) * -2 * MAX;          // arriba/abajo
    div.classList.add("tilting");
    div.style.transform =
      `perspective(700px) rotateX(${rotX.toFixed(1)}deg) rotateY(${rotY.toFixed(1)}deg) translateY(-10px) scale(1.04)`;
  });
  const reset = () => {
    div.classList.remove("tilting");
    div.style.transform = "";
  };
  div.addEventListener("pointerleave", reset);
  div.addEventListener("pointercancel", reset);
}

// ─────────────────────────────────────────────────────────────
// LANZAR CARTA — clon que vuela desde la mano hasta la mesa.
// Al ~60% del vuelo se ejecuta la jugada real: la carta aterriza
// en la mesa (land-anim) justo cuando el clon llega y se desvanece.
// ─────────────────────────────────────────────────────────────
function _volarCartaJugador(div, idx) {
  const cartaId = S.manoJugador[idx];
  // Fallback: si algo falta o el usuario pidió menos movimiento, jugar directo.
  if (!cartaId || _reduceMotion()) { jugarCartaJugador(idx); return; }

  const origen = div.getBoundingClientRect();
  const destinoEl = document.getElementById("played-row-jugador")
                 || document.getElementById("played-row");
  const dr = destinoEl ? destinoEl.getBoundingClientRect() : origen;
  const tx = dr.left + dr.width  / 2;
  const ty = dr.top  + dr.height / 2;
  const dx = tx - (origen.left + origen.width  / 2);
  const dy = ty - (origen.top  + origen.height / 2);

  const clone = document.createElement("div");
  clone.className = "carta-volando";
  clone.style.left   = origen.left + "px";
  clone.style.top    = origen.top  + "px";
  clone.style.width  = origen.width  + "px";
  clone.style.height = origen.height + "px";
  clone.style.setProperty("--dx",  dx.toFixed(0) + "px");
  clone.style.setProperty("--dy",  dy.toFixed(0) + "px");
  clone.style.setProperty("--rot", (Math.random() * 10 - 5).toFixed(1) + "deg");
  const img = document.createElement("img");
  img.src = urlCarta(cartaId);
  img.draggable = false;
  clone.appendChild(img);
  document.body.appendChild(clone);

  div.style.opacity = "0"; // ocultar el original mientras vuela

  // Disparar la jugada cuando el vuelo va llegando (la mesa renderiza
  // la carta con su propia land-anim, empalmando con el clon).
  setTimeout(() => jugarCartaJugador(idx), 260);

  const quitar = () => { if (clone.parentNode) clone.remove(); };
  clone.addEventListener("animationend", quitar);
  setTimeout(quitar, 700); // red de seguridad si no dispara animationend
}

function renderizarManoRival(animar) {
  const container = document.getElementById("rival-hand");
  if (!container) return;
  container.innerHTML = "";
  S.manoRival.forEach((cartaId, idx) => {
    if (!cartaId) return;
    const div = document.createElement("div");
    const anim = animar ? ` deal-anim-rival` : "";
    div.className = `dorso${anim}`;
    if (animar) div.style.animationDelay = `${idx * 0.09 + 0.04}s`;
    if (typeof DORSO_URI !== "undefined") {
      // El dorso TRUGOL se aplica como background (clase .dorso-trugol
      // definida en index.html) — no hace falta cargar dorso.svg.
      div.classList.add("dorso-trugol");
    } else {
      const img = document.createElement("img");
      img.src = "dorso.svg";
      img.alt = "Dorso";
      img.draggable = false;
      img.onerror = () => { div.innerHTML = `<div class="dorso-inner">🂠</div>`; };
      div.appendChild(img);
    }
    container.appendChild(div);
  });
}

// Reparto con animación escalonada real (llama con animar=true al inicio de mano)
function animarReparto() {
  _repartiendoCartas = true;
  renderizarManoJugador(true);
  renderizarManoRival(true);
  // Desbloquear después de que terminen las animaciones
  setTimeout(() => {
    _repartiendoCartas = false;
    renderizarBotonesAccionJugador();
  }, 600);
}

// ─────────────────────────────────────────────────────────────
// CARTAS EN MESA
// ─────────────────────────────────────────────────────────────

// Cartas que YA hicieron su animación de aterrizaje/flip en la mesa.
// Sin esto, como la mesa se re-renderiza entera en cada jugada, la
// última carta (esUltima) re-disparaba su land-anim/flip cada vez
// (p.ej. la carta del rival volvía a hacer flip al jugar vos la tuya).
const _cartasMesaAnim = new Set();
function _resetAnimMesa() { _cartasMesaAnim.clear(); }

// Devuelve true la PRIMERA vez que se ve esta carta en la mesa.
function _debeAnimarMesa(esUltima, rondaIdx, cartaId) {
  if (!esUltima) return false;
  const k = `${rondaIdx}|${cartaId}`;
  if (_cartasMesaAnim.has(k)) return false;
  _cartasMesaAnim.add(k);
  return true;
}

function renderizarCartasEnMesa() {
  const row = document.getElementById("played-row");
  if (!row) return;
  const rowRival   = document.getElementById("played-row-rival");
  const rowJugador = document.getElementById("played-row-jugador");

  if (rowRival && rowJugador) {
    // Estructura nueva: una fila para el rival (lado de arriba)
    // y otra para el jugador (lado de abajo), cada carta con su badge de ronda.
    rowRival.innerHTML   = "";
    rowJugador.innerHTML = "";
    for (let i = 0; i <= S.rondaActual; i++) {
      const esUltima = (i === S.rondaActual);
      const cR = S.cartasRondaRival[i], cJ = S.cartasRondaJugador[i];
      if (cR) rowRival.appendChild(_crearCartaMesa(cR,   "r-played", _debeAnimarMesa(esUltima, i, cR), i));
      if (cJ) rowJugador.appendChild(_crearCartaMesa(cJ, "j-played", _debeAnimarMesa(esUltima, i, cJ), i));
    }
    return;
  }

  // Fallback: estructura antigua de fila única
  const overlay = document.getElementById("drop-zone-overlay");
  const hint    = document.getElementById("drag-hint");
  row.innerHTML = "";
  if (overlay) row.appendChild(overlay);
  if (hint)    row.appendChild(hint);

  for (let i = 0; i <= S.rondaActual; i++) {
    const esUltima = (i === S.rondaActual);
    const cJ = S.cartasRondaJugador[i], cR = S.cartasRondaRival[i];
    if (cJ) row.appendChild(_crearCartaMesa(cJ, "j-played", _debeAnimarMesa(esUltima, i, cJ), i));
    if (cR) row.appendChild(_crearCartaMesa(cR, "r-played", _debeAnimarMesa(esUltima, i, cR), i));
  }
}

function _crearCartaMesa(cartaId, extraClass, animar, rondaIdx) {
  const carta = C[cartaId];
  const wrap  = document.createElement("div");
  wrap.className = "played-card-wrap";
  const div   = document.createElement("div");
  div.className = `card played ${extraClass}${animar ? " land-anim playing" : ""}`;
  // Quitar .playing después de la animación para que el scale final sea .82
  if (animar) setTimeout(() => div.classList.remove('playing'), 600);
  // Ligera rotación aleatoria para aspecto "tirada en la mesa"
  const rot = (Math.random() * 8 - 4).toFixed(1);
  div.style.transform = `rotate(${rot}deg)`;
  const img = document.createElement("img");
  img.src = urlCarta(cartaId);
  img.alt = `${carta.n} de ${carta.p}`;
  img.draggable = false;
  img.onerror = () => {
    const ph = document.createElement("div");
    ph.className = "carta-ph";
    ph.innerHTML = `<span class="carta-ph-n">${carta.n}</span><span class="carta-ph-p">${carta.p}</span>`;
    img.replaceWith(ph);
  };
  div.appendChild(img);
  wrap.appendChild(div);

  // "Pelotazo": onda de impacto al caer la carta en la mesa
  if (animar) {
    const ring1 = document.createElement("span");
    ring1.className = "impact-ring";
    wrap.appendChild(ring1);
    const ring2 = document.createElement("span");
    ring2.className = "impact-ring ring-2";
    wrap.appendChild(ring2);
  }

  if (typeof rondaIdx === "number") {
    const badge = document.createElement("span");
    badge.className = "ronda-badge";
    badge.textContent = `${rondaIdx + 1}ª`;
    wrap.appendChild(badge);
  }

  return wrap;
}

// ─────────────────────────────────────────────────────────────
// FESTEJO DE GOL — explosión de partículas al ganar ronda/mano.
// Se cuelga del bus del motor: _tribuna() emite 'golTribuna' con
// { lado, tipo }. tipo 'ronda' = gol chico, 'mano' = gol grande.
// ─────────────────────────────────────────────────────────────
function _explosionGol(lado, tipo) {
  if (_reduceMotion()) return;
  const grande = (tipo === "mano");
  const N = grande ? 46 : 24;
  const zona = document.getElementById("played-row")
            || document.getElementById("game-screen")
            || document.body;
  const r  = zona.getBoundingClientRect();
  const cx = r.left + r.width  / 2;
  const cy = r.top  + r.height / 2;
  // Verde neón para el jugador, oro/rojo para el rival.
  const colores = (lado === "jugador")
    ? ["#00E676", "#27ae60", "#D4AF37", "#ffffff"]
    : ["#D4AF37", "#e74c3c", "#ffd479", "#ffffff"];

  for (let i = 0; i < N; i++) {
    const p = document.createElement("span");
    p.className = "particula-gol";
    const ang  = Math.random() * Math.PI * 2;
    const dist = (grande ? 90 : 60) + Math.random() * (grande ? 220 : 150);
    p.style.left = cx + "px";
    p.style.top  = cy + "px";
    p.style.background = colores[i % colores.length];
    p.style.setProperty("--dx", (Math.cos(ang) * dist).toFixed(0) + "px");
    p.style.setProperty("--dy", (Math.sin(ang) * dist - 50).toFixed(0) + "px"); // sesgo hacia arriba
    p.style.setProperty("--sz", (6 + Math.random() * 10).toFixed(0) + "px");
    p.style.setProperty("--br", Math.random() < 0.5 ? "50%" : "2px");
    p.style.setProperty("--spin", (Math.random() * 540 - 270).toFixed(0) + "deg");
    p.style.setProperty("--d", (0.6 + Math.random() * 0.5).toFixed(2) + "s");
    document.body.appendChild(p);
    p.addEventListener("animationend", () => p.remove());
  }

  // Destello dorado/verde a pantalla completa: sólo en el gol grande,
  // para no saturar (la ronda suena 2-3 veces por mano).
  if (grande) {
    const f = document.createElement("div");
    f.className = "gol-flash" + (lado === "jugador" ? " verde" : "");
    document.body.appendChild(f);
    f.addEventListener("animationend", () => f.remove());
  }
}

if (typeof onJuego === "function") {
  onJuego("golTribuna", (d) => {
    if (d && (d.tipo === "ronda" || d.tipo === "mano")) _explosionGol(d.lado, d.tipo);
  });
}

// ─────────────────────────────────────────────────────────────
// PANEL DE RONDAS
// ─────────────────────────────────────────────────────────────

function renderizarRondasPanel() {
  const MAP = {
    jugador: { txt: "✓", cls: "ronda-ganador win"  },
    rival:   { txt: "✗", cls: "ronda-ganador lose" },
    parda:   { txt: "=", cls: "ronda-ganador draw" }
  };
  for (let i = 0; i < 3; i++) {
    const el = document.getElementById(`r${i + 1}-ganador`);
    if (!el) continue;
    const g = S.ganadoresRonda[i];
    if (g && MAP[g]) { el.textContent = MAP[g].txt; el.className = MAP[g].cls; }
    else             { el.textContent = "-";         el.className = "ronda-ganador"; }
  }
}

// ─────────────────────────────────────────────────────────────
// PUNTAJES Y BARRAS
// ─────────────────────────────────────────────────────────────

// Cache de los últimos puntajes mostrados, para animar el "pop"
// del marcador cuando alguno de los dos suma puntos.
let _prevPtsJugador = null;
let _prevPtsRival   = null;

function renderizarPuntajes() {
  // El marcador central fue removido: #side-score (panel lateral) es
  // ahora el único tanteador (ver renderizarPanelLateral, que también
  // maneja el "pop" de animación al sumar puntos).
  // Acá solo queda el cálculo de tantos del envido.

  // ── Tantos del envido ──────────────────────────────────
  // El envido se calcula con las 3 cartas INICIALES de la mano.
  // Lo computamos una sola vez (cuando la mano está completa) y
  // lo cacheamos, así no cambia al jugar cartas ni le pasamos
  // un array con huecos (null) a calcularEnvido().
  const cartasVivas = S.manoJugador.filter(Boolean);
  if (cartasVivas.length === 3) {
    _tantosCache = calcularEnvido(cartasVivas);
  } else if (cartasVivas.length === 0) {
    _tantosCache = null; // mano terminada / sin repartir
  }
  _setText("info-tantos", `Tantos: ${_tantosCache !== null ? _tantosCache : "--"}`);
}

// Cache de los tantos de la mano actual (ver renderizarPuntajes)
let _tantosCache = null;

// ─────────────────────────────────────────────────────────────
// AVATARES (sin replaceWith — mantiene IDs)
// ─────────────────────────────────────────────────────────────

function renderizarAvataresFijos() {
  const rival = AVATARS[S.idRival];
  _setEmojiEl("rival-avatar",     rival.icon,       "rival-avatar rival-anim");
  _setEmojiEl("player-avatar-sm", S.avatarJugador,  "player-avatar-sm");
  _setText("rival-name-txt", rival.name);

  const mesaAvs = document.getElementById("mesa-avatares");
  if (mesaAvs) {
    mesaAvs.innerHTML = `
      <span style="font-size:20px">${_avatarIconHTML(rival.icon, 20)}</span>
      <span style="font-size:9px;color:rgba(255,255,255,.3);padding:0 4px">vs</span>
      <span style="font-size:20px">${_avatarIconHTML(S.avatarJugador, 20)}</span>`;
  }
}

function _setEmojiEl(id, icon, className) {
  let el = document.getElementById(id);
  if (!el) return;
  if (el.tagName !== "SPAN") {
    const span = document.createElement("span");
    span.id = id; span.className = className;
    span.style.cssText = "font-size:24px;width:36px;height:36px;display:inline-flex;align-items:center;justify-content:center;border-radius:50%;border:2px solid rgba(200,168,75,.45);flex-shrink:0;overflow:hidden;";
    el.replaceWith(span);
    el = span;
  }
  // Imagen: innerHTML con el <img> recortado en círculo. Emoji: textContent
  // como antes (no hay riesgo de HTML injection, AVATARS es data propia).
  if (_avatarEsImagen(icon)) el.innerHTML = _avatarIconHTML(icon, 32);
  else el.textContent = icon;
}

// ─────────────────────────────────────────────────────────────
// BADGES DE MANO
// ─────────────────────────────────────────────────────────────

function renderizarBadgesMano() {
  const bJ = document.getElementById("player-mano-badge");
  const bR = document.getElementById("rival-mano-badge");
  if (bJ) bJ.style.display = S.turnoMano === "jugador" ? "inline-block" : "none";
  if (bR) bR.style.display = S.turnoMano === "rival"   ? "inline-block" : "none";
}

// ─────────────────────────────────────────────────────────────
// INFO BAR — mensajes contextuales
// ─────────────────────────────────────────────────────────────

function renderizarInfoBar() {
  const manoNombre = S.turnoMano === "jugador" ? S.nombreJugador : AVATARS[S.idRival].name;
  _setText("info-mano", `Mano: ${manoNombre}`);

  const msgEl = document.getElementById("info-msg");
  if (!msgEl) return;

  if (S.juegoTerminado) {
    msgEl.textContent = S.puntosJugador >= S.limitePuntos ? "🏆 ¡Ganaste el partido!" : "❌ Perdiste el partido.";
    return;
  }
  if (_repartiendoCartas) {
    msgEl.textContent = "Repartiendo cartas...";
    return;
  }
  if (S.cantoPendiente && S.quienCantoPendiente === "rival") {
    const cant  = S.historialEnvido[S.historialEnvido.length - 1];
    const cantF = S.historialFlor[S.historialFlor.length - 1];
    const rival = AVATARS[S.idRival].name;
    const textos = {
      envido: `🃏 ${rival} cantó ENVIDO — en juego: ${S.nivelEnvido} pts`,
      real:   `🃏 ${rival} cantó REAL ENVIDO — en juego: ${S.nivelEnvido} pts`,
      falta:  `🃏 ${rival} cantó FALTA ENVIDO — ¡todo o nada!`,
      truco:  `⚽ ${rival} cantó TRUCO — vale ${S.nivelTruco > 1 ? S.nivelTruco : 2} pts`,
      retruco:`⚽ ${rival} cantó RETRUCO — vale ${S.nivelTruco} pts`,
      vale4:  `🔥 ${rival} cantó VALE 4 — ¡el campeonato!`,
      flor:        `🌼 ${rival} cantó FLOR — vale ${S.nivelFlor} pts`,
      contraflor:  `🌼 ${rival} cantó CONTRAFLOR — vale ${S.nivelFlor} pts`,
      contraflorresto: `🔥 ${rival} cantó CONTRAFLOR AL RESTO — ¡todo o nada!`,
    };
    const nivelLabel = { 2:"truco", 3:"retruco", 4:"vale4" };
    let key;
    if (S.cantoPendiente === "envido")    key = cant  || "envido";
    else if (S.cantoPendiente === "flor") key = cantF || "flor";
    else                                   key = nivelLabel[S.nivelTruco] || "truco";
    msgEl.textContent = textos[key] || "Respondé el canto";
    return;
  }
  if (S.cantoPendiente && S.quienCantoPendiente === "jugador") {
    msgEl.textContent = `${AVATARS[S.idRival].name} está pensando tu canto...`;
    return;
  }
  if (S.turnoActual === "jugador") {
    const r = S.ganadoresRonda;
    // Agregar indicador de malas/buenas al mensaje cuando es relevante
    const lim = S.limitePuntos;
    const mitad = Math.floor(lim / 2);
    const enBuenas = lim >= 30 && S.puntosJugador >= mitad;
    const rivalEnBuenas = lim >= 30 && S.puntosRival >= mitad;
    let sufijo = "";
    if (enBuenas && !rivalEnBuenas) sufijo = " 🟢";
    else if (!enBuenas && rivalEnBuenas) sufijo = " 🔴";
    else if (enBuenas && rivalEnBuenas) sufijo = " ⚡";

    if (r[0] === "jugador" && r[1] === undefined) msgEl.textContent = `Ganaste la 1ª — jugá la 2ª${sufijo}`;
    else if (r[0] === "rival" && r[1] === undefined) msgEl.textContent = `Perdiste la 1ª — dale a la 2ª${sufijo}`;
    else if (r[0] === "parda" && r[1] === undefined) msgEl.textContent = `Parda en la 1ª — jugá la 2ª${sufijo}`;
    else if (r[0] === "jugador" && r[1] === "parda") msgEl.textContent = `Ganaste 1ª y parda — ¡cerrás!${sufijo}`;
    else if (r[0] === "rival"   && r[1] === "parda") msgEl.textContent = `1-1 con parda — ¡todo en la 3ª!${sufijo}`;
    else if (r[0] === "parda"   && r[1] === "jugador") msgEl.textContent = `Ganaste 2ª — ¡cerrás la mano!${sufijo}`;
    else if (r[0] === "parda"   && r[1] === "rival")   msgEl.textContent = `Rival ganó 2ª — a definir en 3ª${sufijo}`;
    else msgEl.textContent = `Tu turno — tocá una carta${sufijo}`;
  } else {
    msgEl.textContent = `${AVATARS[S.idRival].name} está pensando...`;
  }
}

// ─────────────────────────────────────────────────────────────
// PANEL LATERAL
// ─────────────────────────────────────────────────────────────

function renderizarPanelLateral() {
  const lim = S.limitePuntos;
  _setTextConPop("side-pts-j", S.puntosJugador, _prevPtsJugador);
  _setTextConPop("side-pts-r", S.puntosRival,   _prevPtsRival);
  _prevPtsJugador = S.puntosJugador;
  _prevPtsRival   = S.puntosRival;
  _setWidth("side-pbar-j", (S.puntosJugador / lim) * 100);
  _setWidth("side-pbar-r", (S.puntosRival   / lim) * 100);
  _setText("side-pts-needed", `F.${lim - Math.max(S.puntosJugador, S.puntosRival)}`);
  _setText("side-lbl-j", S.nombreJugador.substring(0, 4).toUpperCase());
  _setText("side-lbl-r", AVATARS[S.idRival].name.substring(0, 4).toUpperCase());
  _setText("tant-lbl-j", S.nombreJugador.substring(0, 4).toUpperCase());
  _setText("tant-lbl-r", AVATARS[S.idRival].name.substring(0, 4).toUpperCase());
  _renderCuadrados("cuadrados-jugador", S.puntosJugador, false);
  _renderCuadrados("cuadrados-rival",   S.puntosRival,   true);
  _actualizarStakeFlor();
  _actualizarMalasBuenas();
}

// ── MALAS / BUENAS ───────────────────────────────────────────────────────────
// Muestra en el panel lateral en qué "mitad" del partido está cada jugador.
// Clásico argentino: los primeros 15 puntos son "las malas", los segundos "las buenas".
// Solo aplica para partidos a 30; en modo chico (15) no hay división.
function _actualizarMalasBuenas() {
  let el = document.getElementById("side-malas-buenas");
  if (!el) {
    el = document.createElement("div");
    el.id = "side-malas-buenas";
    el.style.cssText = `
      font-family:var(--f-ui,Oswald,sans-serif); font-size:10px; letter-spacing:2px;
      text-align:center; margin:4px 0 2px; opacity:.85;
      display:flex; gap:6px; justify-content:center; align-items:center;
    `;
    const sideInner = document.querySelector(".side-score-inner");
    const stakeEl   = document.getElementById("side-stake");
    if (sideInner && stakeEl) sideInner.insertBefore(el, stakeEl.nextSibling);
    else if (sideInner) sideInner.appendChild(el);
  }

  if (S.limitePuntos < 30) { el.style.display = "none"; return; }
  el.style.display = "flex";

  const mitad  = 15;
  const lblJ   = S.puntosJugador < mitad ? "MALAS" : "BUENAS";
  const lblR   = S.puntosRival   < mitad ? "MALAS" : "BUENAS";
  const colorJ = S.puntosJugador < mitad ? "rgba(255,160,0,.75)" : "rgba(100,220,100,.85)";
  const colorR = S.puntosRival   < mitad ? "rgba(255,160,0,.75)" : "rgba(100,220,100,.85)";

  el.innerHTML = `
    <span style="color:${colorJ}">${lblJ}</span>
    <span style="color:rgba(255,255,255,.35)">·</span>
    <span style="color:${colorR}">${lblR}</span>
  `;
}

// ── HISTORIAL LIVE DE MANOS ───────────────────────────────────────────────────
// Log compacto en el panel lateral: quién ganó cada mano y los puntos.
// Se actualiza llamando a _pushHistorialMano() al final de cada mano.
let _historialManos = [];

function _pushHistorialMano(gano, pts) {
  // gano: 'jugador' | 'rival'
  // pts: puntos en juego en esa mano
  _historialManos.push({ gano, pts, pJ: S.puntosJugador, pR: S.puntosRival });
  if (_historialManos.length > 8) _historialManos.shift(); // guardar solo las últimas 8
  _renderHistorialManos();
}

function _renderHistorialManos() {
  let el = document.getElementById("side-historial-manos");
  if (!el) {
    el = document.createElement("div");
    el.id = "side-historial-manos";
    el.style.cssText = `
      font-family:var(--f-ui,Oswald,sans-serif); font-size:9px; letter-spacing:1px;
      margin-top:6px; border-top:1px solid rgba(255,255,255,.1); padding-top:5px;
      max-height:80px; overflow-y:auto;
    `;
    const sideInner = document.querySelector(".side-score-inner");
    if (sideInner) sideInner.appendChild(el);
  }
  el.innerHTML = _historialManos.slice().reverse().map(h => {
    const ico   = h.gano === "jugador" ? "✅" : "❌";
    const color = h.gano === "jugador" ? "rgba(100,220,100,.8)" : "rgba(255,100,100,.8)";
    return `<div style="color:${color};margin:1px 0">${ico} +${h.pts} → ${h.pJ}-${h.pR}</div>`;
  }).join("");
}

// Cartelito de apuesta en el side-score: muestra el canto activo en juego.
// - Flor: "FLOR ×3 / ×6 / AL RESTO"
// - Truco aceptado: "⚽ TRUCO ×2" / "RETRUCO ×3" / "VALE 4"
// Se oculta cuando no hay nada activo.
function _actualizarStakeFlor() {
  const el = document.getElementById("side-stake");
  if (!el) return;

  // Prioridad: Flor > Truco
  if (S.florCantada && !S.florTerminada && S.nivelFlor) {
    const esResto = S.historialFlor.includes("contraflorresto");
    el.textContent = esResto ? "🌼 FLOR AL RESTO" : `🌼 FLOR ×${S.nivelFlor}`;
    el.style.display = "block";
    return;
  }

  // Truco cantado (pendiente o aceptado)
  if (S.trucoCantado || S.cantoPendiente === "truco") {
    const nivel = S.nivelTrucoAceptado > 0 ? S.nivelTrucoAceptado : S.nivelTruco;
    const labels = { 2: "⚽ TRUCO ×2", 3: "⚽ RETRUCO ×3", 4: "🔥 VALE CUATRO" };
    el.textContent = labels[nivel] || `⚽ TRUCO ×${nivel}`;
    el.style.display = "block";
    return;
  }

  // Envido en juego (cantado pero no resuelto)
  if (S.envidoCantado && !S.envidoTerminado && S.nivelEnvido > 0) {
    const ultimo = S.historialEnvido[S.historialEnvido.length - 1];
    const labels = { envido: "🃏 ENVIDO", real: "🃏 REAL ENV.", falta: "🃏 FALTA ENV." };
    el.textContent = `${labels[ultimo] || "🃏 ENVIDO"} ×${S.nivelEnvido}`;
    el.style.display = "block";
    return;
  }

  el.style.display = "none";
}

// ─────────────────────────────────────────────────────────────
// TANTEADOR CON FÓSFOROS REALES — SVG dinámico
//
// Cada grupo de 5 puntos forma un cuadrado:
//   Palito 1: arriba      (─)
//   Palito 2: derecha     (|)
//   Palito 3: abajo       (─)
//   Palito 4: izquierda   (|)
//   Palito 5: diagonal    (\)
// Los grupos se renderizan de izquierda a derecha.
// ─────────────────────────────────────────────────────────────

function _renderCuadrados(id, puntos, esRival) {
  const el = document.getElementById(id);
  if (!el) return;

  const COLOR_PALO  = esRival ? "#e05252" : "#e67e22";
  const COLOR_CABEZA = esRival ? "#a01010" : "#c0392b";

  // Dimensiones de cada cuadrado SVG
  const SZ  = 36;   // tamaño del cuadrado (px)
  const GAP = 8;    // espacio entre grupos
  const GROSOR = 3.5;
  const R_CAB  = 3.5;

  const grupos = Math.ceil(puntos / 5);
  const anchoTotal = grupos > 0 ? grupos * SZ + (grupos - 1) * GAP : SZ;
  const H = SZ + 2;

  const SVG_NS = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(SVG_NS, "svg");
  svg.setAttribute("width", anchoTotal || SZ);
  svg.setAttribute("height", H);
  svg.setAttribute("viewBox", `0 0 ${anchoTotal || SZ} ${H}`);
  svg.style.overflow = "visible";
  svg.style.display  = "block";
  // El ancho crece con los puntos sin tope (a 25-30, el momento más tenso
  // del partido, es cuando más grupos hay y más chance de desbordar en
  // 320-390px). max-width:100% + height:auto lo achica proporcional
  // (el viewBox ya mantiene el aspecto) en vez de desbordar el contenedor.
  svg.style.maxWidth = "100%";
  svg.style.height   = "auto";

  // ── Dibujar cada grupo ──────────────────────────────────
  for (let g = 0; g < grupos; g++) {
    const ox = g * (SZ + GAP); // origen X del grupo
    const oy = 1;              // origen Y

    // Cuántos palitos tiene este grupo
    const puntosEnGrupo = Math.min(5, puntos - g * 5);

    // Definiciones de cada palito como función de ox/oy
    const palitos = [
      // 1: arriba (horizontal) — de izq a der
      () => _palitoSVG(svg, ox + 2, oy, ox + SZ - 2, oy, GROSOR, COLOR_PALO, COLOR_CABEZA, R_CAB, "derecha"),
      // 2: derecha (vertical) — de arriba a abajo
      () => _palitoSVG(svg, ox + SZ - 2, oy, ox + SZ - 2, oy + SZ, GROSOR, COLOR_PALO, COLOR_CABEZA, R_CAB, "abajo"),
      // 3: abajo (horizontal) — de der a izq
      () => _palitoSVG(svg, ox + SZ - 2, oy + SZ, ox + 2, oy + SZ, GROSOR, COLOR_PALO, COLOR_CABEZA, R_CAB, "izquierda"),
      // 4: izquierda (vertical) — de abajo a arriba
      () => _palitoSVG(svg, ox + 2, oy + SZ, ox + 2, oy, GROSOR, COLOR_PALO, COLOR_CABEZA, R_CAB, "arriba"),
      // 5: diagonal — de arriba-izq a abajo-der
      () => _palitoSVG(svg, ox + 2, oy + 2, ox + SZ - 2, oy + SZ - 2, GROSOR, COLOR_PALO, COLOR_CABEZA, R_CAB, "diagonal"),
    ];

    for (let p = 0; p < puntosEnGrupo; p++) {
      palitos[p]();
    }
  }

  // Si no hay puntos, mostrar un cuadrado fantasma (guía)
  if (puntos === 0) {
    const rect = document.createElementNS(SVG_NS, "rect");
    rect.setAttribute("x", 2); rect.setAttribute("y", 2);
    rect.setAttribute("width", SZ - 4); rect.setAttribute("height", SZ - 4);
    rect.setAttribute("rx", 3);
    rect.setAttribute("fill", "none");
    rect.setAttribute("stroke", esRival ? "rgba(200,80,80,.18)" : "rgba(200,168,75,.18)");
    rect.setAttribute("stroke-width", "1");
    rect.setAttribute("stroke-dasharray", "3 3");
    svg.appendChild(rect);
  }

  el.innerHTML = "";
  el.appendChild(svg);
}

function _palitoSVG(svg, x1, y1, x2, y2, grosor, colorPalo, colorCabeza, rCab, dir) {
  const NS = "http://www.w3.org/2000/svg";

  // Cuerpo del palito
  const line = document.createElementNS(NS, "line");
  line.setAttribute("x1", x1); line.setAttribute("y1", y1);
  line.setAttribute("x2", x2); line.setAttribute("y2", y2);
  line.setAttribute("stroke", colorPalo);
  line.setAttribute("stroke-width", grosor);
  line.setAttribute("stroke-linecap", "round");
  svg.appendChild(line);

  // Cabeza (círculo en el extremo "final" del palito)
  const circle = document.createElementNS(NS, "circle");
  circle.setAttribute("cx", x2);
  circle.setAttribute("cy", y2);
  circle.setAttribute("r", rCab);
  circle.setAttribute("fill", colorCabeza);
  svg.appendChild(circle);
}

// ─────────────────────────────────────────────────────────────
// BOTONES DE ACCIÓN
// ─────────────────────────────────────────────────────────────

// ── "FALTA ENVIDO" y "CONTRAFLOR AL RESTO": mostrar cuánto valen ──────────
// La falta se juega "por las malas y por las buenas": a 0-0 en un partido a
// 30 vale 15 (lo que falta para salir de las malas), NO 30. Es regla
// tradicional legítima, pero un botón que dice solo "FALTA ENVIDO" hace que
// el jugador espere 30, cobre 15 y crea que el juego está roto. Por eso el
// botón muestra el número, y el tooltip explica de dónde sale.
function _puntosFaltaUI() {
  return (typeof _puntasFaltaEnvido === "function") ? _puntasFaltaEnvido() : null;
}

function _tituloFalta(pts) {
  if (pts === null) return "";
  // S.limitePuntos viaja en el estado remoto (_ONLINE_CAMPOS_ESTADO) sin
  // validar tipo: un host modificado lo mandaba como string con HTML y
  // rompía el atributo title="..." abierto, ejecutando JS en el guest SIN
  // que nadie tocara nada (ni siquiera hacía falta responder el canto).
  // Number(): si no es un número real, cae al default de 30.
  const limite = Number(S.limitePuntos) || 30;
  const mitad  = Math.floor(limite / 2);
  const lider  = Math.max(S.puntosJugador, S.puntosRival);
  return (limite >= 30 && lider < mitad)
    ? `Vale ${pts}. El que va ganando todavía está en las MALAS, así que la falta se cuenta hasta la mitad del partido (${mitad}) y no hasta ${limite}.`
    : `Vale ${pts}: lo que le falta al que va ganando para terminar el partido (${limite}).`;
}

function _btnFalta(onclick, clase) {
  const pts = _puntosFaltaUI();
  const lbl = pts === null ? "🔥 FALTA ENVIDO" : `🔥 FALTA ENVIDO (${pts})`;
  // esc() en el atributo: defensa en profundidad además del Number() de
  // arriba (mismo sink que rompió con limitePuntos hostil).
  return `<button class="btn ${clase} btn-max" title="${esc(_tituloFalta(pts))}" onclick="${onclick}">${lbl}</button>`;
}

function _btnContraflorResto(onclick) {
  const pts = _puntosFaltaUI();
  const lbl = pts === null ? "🔥 CONTRAFLOR AL RESTO" : `🔥 CONTRAFLOR AL RESTO (${pts})`;
  return `<button class="btn respond btn-max" title="${esc(_tituloFalta(pts))}" onclick="${onclick}">${lbl}</button>`;
}

function renderizarBotonesAccionJugador() {
  const acc = document.getElementById("acciones");
  if (!acc) return;
  acc.innerHTML = "";

  if (S.juegoTerminado) {
    acc.innerHTML = `<button class="btn primary" onclick="reiniciarPartida()">▶ NUEVA PARTIDA</button>`;
    return;
  }
  if (_repartiendoCartas) return;

  // ── Responder canto del rival ─────────────────────────
  if (S.cantoPendiente && S.quienCantoPendiente === "rival") {
    if (S.cantoPendiente === "flor") {
      const h = S.historialFlor;
      if (h.length <= 1) {
        // Solo "Flor" cantada: con flor quiero (3) o contraflor (sube a 6)
        acc.innerHTML = `
          <button class="btn primary" onclick="responderFlorJugador('quiero')">✅ CON FLOR QUIERO</button>
          <button class="btn respond" onclick="responderFlorJugador('contraflor')">CONTRAFLOR</button>`;
      } else if (h.includes('contraflor') && !h.includes('contraflorresto')) {
        // Contraflor cantada: con flor quiero (6), contraflor al resto, o no quiero (pierde 3)
        acc.innerHTML = `
          <button class="btn primary" onclick="responderFlorJugador('quiero')">✅ CON FLOR QUIERO</button>
          ${_btnContraflorResto("responderFlorJugador('contraflorresto')")}
          <button class="btn danger" onclick="responderFlorJugador('no-quiero')">❌ NO QUIERO</button>`;
      } else {
        // Contraflor al resto cantada: quiero (al resto) o no quiero (pierde 6)
        acc.innerHTML = `
          <button class="btn primary" onclick="responderFlorJugador('quiero')">✅ QUIERO</button>
          <button class="btn danger"  onclick="responderFlorJugador('no-quiero')">❌ NO QUIERO</button>`;
      }
      acc.innerHTML += `<button class="btn danger" onclick="irseAlMazoConCantoPendiente()">AL MAZO</button>`;
      return;
    }
    if (S.cantoPendiente === "envido") {
      acc.innerHTML = `
        <button class="btn primary" onclick="responderCantoJugador(true)">✅ QUIERO</button>
        <button class="btn danger"  onclick="responderCantoJugador(false)">❌ NO QUIERO</button>`;
      // "La flor está primero": si tenés flor sin cantar, la cantás ahora y
      // el envido queda anulado.
      if (typeof puedeResponderEnvidoConFlor === "function" && puedeResponderEnvidoConFlor("jugador")) {
        acc.innerHTML += `<button class="btn respond" onclick="responderEnvidoConFlor('jugador')">FLOR</button>`;
      }
      // Subir la apuesta: no se ofrece con flor propia sin resolver (ahí lo
      // que corresponde es cantar FLOR, que anula el envido).
      const conFlorPropia = typeof florPropiaPendiente === "function"
                         && florPropiaPendiente("jugador");
      if (typeof envidoSigueVivo === "function" && envidoSigueVivo() && !conFlorPropia) {
        const ya = S.historialEnvido;
        if (ya.filter(x => x === 'envido').length < 2 && !ya.includes('real') && !ya.includes('falta'))
          acc.innerHTML += `<button class="btn respond" onclick="responderEnvidoConSubida('envido')">ENVIDO</button>`;
        if (!ya.includes('real') && !ya.includes('falta'))
          acc.innerHTML += `<button class="btn respond" onclick="responderEnvidoConSubida('real')">REAL ENVIDO</button>`;
        if (!ya.includes('falta'))
          acc.innerHTML += _btnFalta("responderEnvidoConSubida('falta')", "respond");
      }
      acc.innerHTML += `<button class="btn danger" onclick="irseAlMazoConCantoPendiente()">AL MAZO</button>`;
      return;
    }
    if (S.cantoPendiente === "truco") {
      acc.innerHTML = `
        <button class="btn primary" onclick="responderCantoJugador(true)">✅ QUIERO</button>
        <button class="btn danger"  onclick="responderCantoJugador(false)">❌ NO QUIERO</button>`;
      // Subir el canto: si cantó TRUCO se puede responder RETRUCO,
      // si cantó RETRUCO se puede responder VALE 4.
      const nivelSubida = (S.nivelTruco || 2) + 1;
      if (nivelSubida <= 4) {
        const lbls = { 3: "RETRUCO", 4: "VALE 4" };
        const claseMax = nivelSubida === 4 ? " btn-max" : "";
        const prefijo  = nivelSubida === 4 ? "🔥 " : "";
        acc.innerHTML += `<button class="btn respond${claseMax}" onclick="responderTrucoConSubida(${nivelSubida})">${prefijo}${lbls[nivelSubida]}</button>`;
      }
      // "La flor está primero": tiene prioridad sobre "el envido está
      // primero". Si tenés flor sin cantar todavía, podés cantarla
      // ahora y dejar el truco en espera.
      if (typeof puedeResponderTrucoConFlor === "function" && puedeResponderTrucoConFlor("jugador")) {
        acc.innerHTML += `<button class="btn respond" onclick="responderTrucoConFlor('jugador')">FLOR</button>`;
      }
      // "El envido está primero": si te cantaron TRUCO en la ronda 0
      // antes de que tirés carta y todavía no se cantó envido, podés
      // responder con envido y dejar el truco en espera.
      if (typeof puedeResponderTrucoConEnvido === "function" && puedeResponderTrucoConEnvido("jugador")) {
        acc.innerHTML += `<button class="btn respond" onclick="responderTrucoConEnvido('jugador','envido')">ENVIDO</button>`;
        acc.innerHTML += `<button class="btn respond" onclick="responderTrucoConEnvido('jugador','real')">REAL ENVIDO</button>`;
        acc.innerHTML += _btnFalta("responderTrucoConEnvido('jugador','falta')", "respond");
      }
      acc.innerHTML += `<button class="btn danger" onclick="irseAlMazoConCantoPendiente()">AL MAZO</button>`;
      return;
    }
  }

  if (S.turnoActual !== "jugador" || S.cantoPendiente) return;

  // ── Flor ofensiva ──────────────────────────────────────
  // "La flor está primero": si tenés flor y todavía no se cantó, podés
  // cantarla (aunque sea tu turno de tirar carta) o achicarte (PASAR).
  if (typeof puedeJugadorCantarFlor === "function" && puedeJugadorCantarFlor()) {
    acc.innerHTML += `<button class="btn" onclick="cantarFlorJugador()">FLOR</button>`;
    acc.innerHTML += `<button class="btn respond" onclick="pasarFlorJugador()">PASAR</button>`;
  }

  // ── Envido ofensivo ───────────────────────────────────
  // (si CUALQUIERA de los dos ya tiró carta en R0, el envido quedó perdido)
  // Se pregunta por puedeJugadorCantarEnvido() y no por envidoSigueVivo() a
  // secas: la primera incluye la guarda de flor propia, así que el botón no
  // aparece cuando el canto iba a ser rechazado igual.
  if (typeof puedeJugadorCantarEnvido === "function" && puedeJugadorCantarEnvido() && !S.envidoCantado) {
    acc.innerHTML += `<button class="btn" onclick="cantarEnvidoJugador('envido')">ENVIDO</button>`;
    acc.innerHTML += `<button class="btn" onclick="cantarEnvidoJugador('real')">REAL ENVIDO</button>`;
    acc.innerHTML += _btnFalta("cantarEnvidoJugador('falta')", "");
  }

  // ── Truco ofensivo ────────────────────────────────────
  const nivelTruco = (typeof _nivelTrucoDisponible === 'function') ? _nivelTrucoDisponible("jugador") : null;
  if (nivelTruco !== null) {
    const labels = { 2: "TRUCO", 3: "RETRUCO", 4: "VALE 4" };
    const claseMaxT = nivelTruco === 4 ? " btn-max" : "";
    const prefijoT  = nivelTruco === 4 ? "🔥 " : "";
    acc.innerHTML += `<button class="btn${claseMaxT}" onclick="cantarTrucoJugador(${nivelTruco})">${prefijoT}${labels[nivelTruco]}</button>`;
  }

  acc.innerHTML += `<button class="btn danger" onclick="irseAlMazo('jugador')">AL MAZO</button>`;
}


// Subir un canto de truco pendiente del rival.
// En el truco, subir el canto implica aceptar el nivel anterior:
// se limpia el canto pendiente como "querido" y se canta el nivel superior.
// NOTA: si juego.js ya tiene una función propia para esto, usala en su lugar.
function responderTrucoConSubida(nivel) {
  if (typeof responderTrucoSubida === "function") { // por si juego.js la define
    responderTrucoSubida(nivel);
    return;
  }
  // Aceptación implícita del nivel cantado por el rival
  S.cantoPendiente = null;
  S.quienCantoPendiente = null;
  S.trucoAceptado = true; // si juego.js usa otro nombre de flag, ajustar aquí
  playSound("silbato");
  cantarTrucoJugador(nivel);
}

function bloquearBotonesAccion(bloquear) {
  document.querySelectorAll("#acciones button").forEach(b => {
    b.disabled = bloquear;
    b.classList.toggle("bloq", bloquear);
  });
}

// ─────────────────────────────────────────────────────────────
// COLA DE OVERLAYS 3D — evita que envido/canto/resultado se
// tapen entre sí mostrándose al mismo tiempo.
// ─────────────────────────────────────────────────────────────
const _overlayCola = [];
let   _overlayActivo = false;
const _OVERLAY_GAP = 120; // pausa entre overlays consecutivos

/* Tira a la basura los overlays encolados de la partida (o la mano) anterior.
   Sin esto, la cola avanza a su propio ritmo (1-2,6 s por overlay) y el motor
   al suyo: si el jugador toca REVANCHA o vuelve al menu con backlog, los
   overlays viejos se disparan encima de la pantalla nueva. Y como el nombre
   del rival se resuelve AL MOSTRARSE (no al encolarse), se veia el canto viejo
   con el rival nuevo: "¡ENVIDO! - HINCHA DE TALLERES" a pantalla completa
   sobre la mesa recien repartida. */
function purgarOverlays() {
  _overlayCola.length = 0;
  _overlayActivo = false;
  // ext-stats-fin / ext-torneo-modal (src/ui/extras.js) se agregan a
  // document.body por fuera de #mesa, con hasta 2.5s de setTimeout propio:
  // sin purgarlos acá también, tapaban el menú/anotador si el jugador
  // navegaba justo en esa ventana.
  ["canto-overlay", "envido-overlay", "resultado-mano-overlay", "ext-stats-fin", "ext-torneo-modal"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.remove("show");
  });
}
window.purgarOverlays = purgarOverlays;

function _encolarOverlay(fn, duracion) {
  _overlayCola.push({ fn, duracion });
  if (!_overlayActivo) _procesarOverlayCola();
}

function _procesarOverlayCola() {
  if (_overlayCola.length === 0) { _overlayActivo = false; return; }
  _overlayActivo = true;
  const { fn, duracion } = _overlayCola.shift();
  fn();
  setTimeout(() => setTimeout(_procesarOverlayCola, _OVERLAY_GAP), duracion);
}

// ─────────────────────────────────────────────────────────────
// OVERLAY DE ENVIDO — muestra los tantos con animación
// ─────────────────────────────────────────────────────────────

// Arma el canto auténtico de tantos: el "pie" (el que NO es mano) canta
// primero su número, y el "mano" responde. Si el mano gana (incluido el
// desempate, que se lo lleva por ser mano) dice "son mejores"; si pierde
// concede con "son buenas". Devuelve los textos para overlay y burbuja.
function _fraseTantosEnvido(ptsJ, ptsR) {
  const manoEsJugador = S.turnoMano === "jugador";
  const nomJ = S.nombreJugador || "Vos";
  const nomR = (AVATARS[S.idRival] && AVATARS[S.idRival].name) || "Rival";

  const piePts     = manoEsJugador ? ptsR : ptsJ;   // el pie canta primero
  const manoPts    = manoEsJugador ? ptsJ : ptsR;
  const pieNombre  = manoEsJugador ? nomR : nomJ;
  const manoNombre = manoEsJugador ? nomJ : nomR;

  let manoFrase;
  if (manoPts > piePts)        manoFrase = `${manoPts}, ¡son mejores!`;
  else if (manoPts === piePts) manoFrase = `${manoPts}, son mejores (mano)`;
  else                         manoFrase = `son buenas`;

  // Qué dice el rival (para mostrarlo en su burbuja)
  const rivalDice = manoEsJugador
    ? `${piePts}`        // el rival es pie: canta su número
    : manoFrase;         // el rival es mano: responde
  return {
    resumen: `${pieNombre}: ${piePts}  —  ${manoNombre}: ${manoFrase}`,
    rivalDice,
  };
}

function mostrarOverlayEnvido(ptsJ, ptsR, ganoJugador, apuesta, cartasJ, cartasR, titulo = "ENVIDO") {
  const overlay = document.getElementById("envido-overlay");
  if (!overlay) return;
  const DURACION = 1800;

  _encolarOverlay(() => {
    _ocultarToastViejo();

    _setText("eo-title",  titulo);
    _setText("eo-name-j", S.nombreJugador.toUpperCase());
    _setText("eo-name-r", AVATARS[S.idRival].name.toUpperCase());
    _setText("eo-pts-j",  ptsJ);
    _setText("eo-pts-r",  ptsR);

    const ptsjEl = document.getElementById("eo-pts-j");
    const ptsrEl = document.getElementById("eo-pts-r");
    if (ptsjEl) ptsjEl.className = `envido-pts ${ganoJugador ? "win" : "lose"}`;
    if (ptsrEl) ptsrEl.className = `envido-pts ${ganoJugador ? "lose" : "win"}`;

    _setText("eo-res",   ganoJugador ? `¡GANASTE! +${apuesta}` : `Ganó ${AVATARS[S.idRival].name} +${apuesta}`);
    // Canto auténtico de tantos (solo Envido; la Flor tiene su propio diálogo).
    if (titulo === "ENVIDO") {
      const ct = _fraseTantosEnvido(ptsJ, ptsR);
      _setText("eo-extra", ct.resumen);
      // Cue de voz: se "canta" el tanto antes de resolver (suena a mesa real).
      playSound("canto");
      // El rival "canta" sus tantos en su burbuja
      if (typeof mostrarFraseRivalTexto === "function") mostrarFraseRivalTexto(ct.rivalDice);
    } else {
      _setText("eo-extra", `Apuesta: ${apuesta} ${apuesta === 1 ? "punto" : "puntos"}`);
    }

    // No mostramos las cartas acá: se revelan recién al final de la mano
    // (overlay de resultado), para no filtrar la mano del rival en pleno juego.

    overlay.classList.remove("show");
    void overlay.offsetWidth;
    overlay.classList.add("show");
    playSound(ganoJugador ? "ovacion" : "lose");

    clearTimeout(overlay._envTimer);
    overlay._envTimer = setTimeout(() => overlay.classList.remove("show"), DURACION);
  }, DURACION);
}

// Renderiza las 1 o 2 cartas que forman el envido de un jugador dentro
// del overlay (id = "eo-cards-j" | "eo-cards-r"). `gano` resalta el grupo
// si ese jugador se llevó la apuesta.
function _renderCartasEnvido(id, cartas, gano) {
  const cont = document.getElementById(id);
  if (!cont) return;
  cont.innerHTML = "";
  cont.className = `envido-cards${gano ? " gano" : ""}`;
  (cartas || []).forEach(cartaId => {
    const carta = C[cartaId];
    if (!carta) return;
    const div = document.createElement("div");
    div.className = "envido-mini-card";
    div.title = `${carta.n} de ${carta.p}`;
    const img = document.createElement("img");
    img.src = urlCarta(cartaId);
    img.alt = `${carta.n} de ${carta.p}`;
    img.draggable = false;
    img.onerror = () => { div.innerHTML = `<div class="carta-ph"><span class="carta-ph-n">${carta.n}</span><span class="carta-ph-p">${carta.p}</span></div>`; };
    div.appendChild(img);
    cont.appendChild(div);
  });
}

// ─────────────────────────────────────────────────────────────
// OVERLAY DE CANTO — banner 3D para truco/envido y sus subidas
// ─────────────────────────────────────────────────────────────

function mostrarOverlayCanto(texto, quien) {
  const overlay = document.getElementById("canto-overlay");
  const card    = document.getElementById("canto-card");
  const label   = document.getElementById("canto-label");
  const sub     = document.getElementById("canto-quien");
  if (!overlay || !card || !label || !sub) return;
  const DURACION = 1000;

  _encolarOverlay(() => {
    _ocultarToastViejo();

    label.textContent = texto;
    sub.textContent = (quien === "rival")
      ? (AVATARS[S.idRival] ? AVATARS[S.idRival].name : "RIVAL").toUpperCase()
      : (S.nombreJugador || "VOS").toUpperCase();
    card.classList.toggle("rival", quien === "rival");

    // Reinicia la animación si ya estaba visible (ej. subidas seguidas)
    overlay.classList.remove("show");
    void overlay.offsetWidth;
    overlay.classList.add("show");

    clearTimeout(overlay._cantoTimer);
    overlay._cantoTimer = setTimeout(() => overlay.classList.remove("show"), DURACION);
  }, DURACION);
}

// ─────────────────────────────────────────────────────────────
// OVERLAY DE RESULTADO DE MANO — placa 3D con los puntos ganados
// ─────────────────────────────────────────────────────────────

function mostrarOverlayResultadoMano(resultado, pts) {
  // resultado: 'gano' | 'pierde' | 'parda'
  const overlay  = document.getElementById("resultado-overlay");
  const card     = document.getElementById("resultado-card");
  const titulo   = document.getElementById("resultado-titulo");
  const puntos   = document.getElementById("resultado-puntos");
  const marcador = document.getElementById("resultado-marcador");
  const reveal   = document.getElementById("resultado-envido-reveal");
  if (!overlay || !card || !titulo || !puntos || !marcador) return;

  // Si esta mano tuvo un envido/flor "querido", recién ahora se revelan
  // las cartas que lo formaron (antes solo se mostraban los tantos).
  const rev = S.revealEnvidoMano;
  const DURACION = rev ? 2600 : 1300;

  _encolarOverlay(() => {
    _ocultarToastViejo();

    card.classList.remove("gano", "pierde", "parda");
    card.classList.add(resultado);

    const titulos = {
      gano:   "¡GANASTE LA MANO!",
      pierde: "PERDISTE LA MANO",
      parda:  "MANO PARDA",
    };
    titulo.textContent = titulos[resultado] || "";
    puntos.textContent = (resultado === "gano") ? `+${pts}`
                        : (resultado === "pierde") ? `-${pts}`
                        : "—";
    marcador.textContent = `${S.puntosJugador} - ${S.puntosRival}`;

    if (reveal) {
      if (rev) {
        _setText("rev-titulo", `${rev.titulo}: ${S.nombreJugador.toUpperCase()} ${rev.ptsJ} - ${rev.ptsR} ${AVATARS[S.idRival].name.toUpperCase()}`);
        _setText("rev-name-j", S.nombreJugador.toUpperCase());
        _setText("rev-name-r", AVATARS[S.idRival].name.toUpperCase());
        _renderCartasEnvido("rev-cards-j", rev.cartasJ, rev.ganoJugador);
        _renderCartasEnvido("rev-cards-r", rev.cartasR, !rev.ganoJugador);
        reveal.classList.add("show");
      } else {
        reveal.classList.remove("show");
      }
    }

    overlay.classList.remove("show");
    void overlay.offsetWidth;
    overlay.classList.add("show");

    clearTimeout(overlay._resTimer);
    overlay._resTimer = setTimeout(() => overlay.classList.remove("show"), DURACION);
  }, DURACION);

  // Ya se mostró: no repetir el reveal en próximas mano (se vuelve a setear
  // en la próxima resolución de envido/flor, y se limpia en repartirNuevaMano).
  S.revealEnvidoMano = null;
}

// ─────────────────────────────────────────────────────────────
// BURBUJA DE DIÁLOGO DEL RIVAL — frase flotante
// ─────────────────────────────────────────────────────────────

function mostrarFraseRival(tipo) {
  const texto = _frase(tipo);
  if (!texto) return;
  mostrarFraseRivalTexto(texto);
}

// Muestra texto ARBITRARIO en la burbuja del rival (no de la lista FRASES).
// Lo usa el canto de tantos del envido ("28 son mejores", etc.).
function mostrarFraseRivalTexto(texto) {
  // Flag propio para las frases (independiente del sonido).
  // Por defecto están activadas; solo se ocultan si S.cfgFrases === false.
  if (S.cfgFrases === false) return;
  if (!texto) return;

  // Crear o reusar burbuja
  let burbuja = document.getElementById("rival-bubble");
  if (!burbuja) {
    burbuja = document.createElement("div");
    burbuja.id = "rival-bubble";
    burbuja.style.cssText = `
      position:absolute; top:82px; left:50%; transform:translateX(-50%);
      background:rgba(0,0,0,.78); color:#fff;
      font-size:12px; font-family:var(--f-body);
      padding:6px 14px; border-radius:20px;
      border:1px solid rgba(200,168,75,.35);
      white-space:nowrap; z-index:30;
      opacity:0; transition:opacity .2s;
      pointer-events:none;
      box-shadow: 0 4px 12px rgba(0,0,0,.4);
    `;
    document.getElementById("mesa")?.appendChild(burbuja);
  }

  // La burbuja es texto plano (textContent, sin riesgo de injection) — no
  // puede llevar un <img>, así que un avatar-imagen usa un emoji genérico
  // de reemplazo en vez de mostrar la ruta del archivo como si fuera texto.
  const _iconRival = AVATARS[S.idRival].icon;
  const _prefijoBurbuja = _avatarEsImagen(_iconRival) ? "💬" : _iconRival;
  burbuja.textContent = `${_prefijoBurbuja} "${texto}"`;
  burbuja.style.opacity = "1";
  clearTimeout(burbuja._t);
  burbuja._t = setTimeout(() => { burbuja.style.opacity = "0"; }, 2200);
}

// Versión pública que usa ia.js para mostrar frases en momentos clave
function fraseRivalCanto(tipo) {
  mostrarFraseRival(tipo);
}

// ─────────────────────────────────────────────────────────────
// INDICADOR DE TURNO — resalta quién tiene que jugar
// ─────────────────────────────────────────────────────────────

function actualizarIndicadorTurno() {
  const zonaRival   = document.querySelector(".zona-rival");
  const zonaJugador = document.querySelector(".zona-jugador");
  if (!zonaRival || !zonaJugador) return;

  const esJugador = S.turnoActual === "jugador" && !S.cantoPendiente && !S.juegoTerminado;
  const esRival   = S.turnoActual === "rival"   && !S.cantoPendiente;

  zonaJugador.classList.toggle("turno-activo", esJugador);
  zonaRival.classList.toggle("turno-activo",   esRival);
}

// ─────────────────────────────────────────────────────────────
// TOAST — apilable con cola
// ─────────────────────────────────────────────────────────────

const _toastCola = [];
let   _toastActivo = false;

// Corta cualquier toast en cola/visible. Se usa cuando entra un overlay 3D
// (canto/resultado) para que no quede el aviso viejo superpuesto.
let _toastTimer = null;

function _ocultarToastViejo() {
  _toastCola.length = 0;
  _toastActivo = false;
  // Cancelar la cadena en vuelo: sin esto el timer viejo seguia corriendo y
  // le cortaba el .show al toast SIGUIENTE, ademas de arrancar una segunda
  // cadena de _procesarToast en paralelo.
  if (_toastTimer) { clearTimeout(_toastTimer); _toastTimer = null; }
  const t = document.getElementById("toast");
  if (t) t.classList.remove("show");
}

function showToast(msg, duracion) {
  _toastCola.push({ msg, duracion: duracion || 1600 });
  if (!_toastActivo) _procesarToast();
}

function _procesarToast() {
  if (_toastCola.length === 0) { _toastActivo = false; return; }
  _toastActivo = true;
  const { msg, duracion } = _toastCola.shift();
  const t = document.getElementById("toast");
  if (!t) { _toastActivo = false; return; }
  t.textContent = msg;
  t.classList.add("show");
  _toastTimer = setTimeout(() => {
    _toastTimer = null;
    t.classList.remove("show");
    _toastTimer = setTimeout(_procesarToast, 100); // pausa entre toasts
  }, duracion);
}

// ─────────────────────────────────────────────────────────────
// SONIDOS — Web Audio enriquecido
// ─────────────────────────────────────────────────────────────

let _audioCtx = null;
function _ctx() {
  if (!_audioCtx) {
    try { _audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch(e) {}
  }
  return _audioCtx;
}

function playSound(tipo) {
  if (!S.cfgSonido) return;
  const ctx = _ctx();
  if (!ctx) return;
  try {
    switch(tipo) {
      case "click":   _nota(ctx, 480, 0.08, "sine",     0.18); break;
      case "deal":    _repiqueDeal(ctx); break;
      case "canto":   _notaCanto(ctx); break;
      case "win":     _fanfarria(ctx); break;
      case "lose":    _descenso(ctx); break;
      case "parda":   _nota(ctx, 370, 0.2,  "triangle", 0.14); break;
      case "punto":   _nota(ctx, 550, 0.15, "triangle", 0.2); break;
      case "silbato": _silbato(ctx); break;
      case "ovacion": _ovacion(ctx); break;
      default:        _nota(ctx, 440, 0.1,  "sine",     0.15);
    }
  } catch(e) {}
}

function _nota(ctx, freq, dur, type, gain) {
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.connect(g); g.connect(ctx.destination);
  o.type = type; o.frequency.value = freq;
  g.gain.setValueAtTime(gain, ctx.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
  o.start(); o.stop(ctx.currentTime + dur);
}

function _repiqueDeal(ctx) {
  // Sonido de carta deslizándose: 3 notas rápidas descendentes
  [380, 340, 300].forEach((f, i) => {
    setTimeout(() => _nota(ctx, f, 0.08, "sine", 0.12), i * 60);
  });
}

function _notaCanto(ctx) {
  // Canto: nota larga + armónico
  _nota(ctx, 520, 0.35, "triangle", 0.2);
  setTimeout(() => _nota(ctx, 650, 0.2, "sine", 0.08), 100);
}

function _fanfarria(ctx) {
  // Victoria: Do-Mi-Sol-Do ascendente
  const notas = [523, 659, 784, 1047];
  notas.forEach((f, i) => setTimeout(() => _nota(ctx, f, 0.18, "triangle", 0.22), i * 120));
}

function _descenso(ctx) {
  // Derrota: descendente triste
  const notas = [392, 349, 294, 262];
  notas.forEach((f, i) => setTimeout(() => _nota(ctx, f, 0.22, "sawtooth", 0.15), i * 110));
}

function _silbato(ctx) {
  // Silbato de árbitro: dos pitidos agudos con vibrato (truco / al mazo)
  const pitido = (delay) => {
    const o    = ctx.createOscillator();
    const g    = ctx.createGain();
    const lfo  = ctx.createOscillator();
    const lfoG = ctx.createGain();
    o.type = "square";
    o.frequency.value = 2900;
    lfo.type = "sine";
    lfo.frequency.value = 24;   // velocidad del trémolo del silbato
    lfoG.gain.value = 120;      // profundidad del trémolo (Hz)
    lfo.connect(lfoG);
    lfoG.connect(o.frequency);
    o.connect(g); g.connect(ctx.destination);
    const t0 = ctx.currentTime + delay;
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(0.22, t0 + 0.015);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.16);
    o.start(t0); lfo.start(t0);
    o.stop(t0 + 0.17); lfo.stop(t0 + 0.17);
  };
  pitido(0);
  pitido(0.2);
}

function _ovacion(ctx) {
  // Ovación de la hinchada: ruido filtrado con ataque rápido y caída suave
  const dur = 0.9;
  const buffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * dur), ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;

  const noise = ctx.createBufferSource();
  noise.buffer = buffer;

  const filtro = ctx.createBiquadFilter();
  filtro.type = "bandpass";
  filtro.frequency.value = 1100;
  filtro.Q.value = 0.6;

  const g = ctx.createGain();
  const t0 = ctx.currentTime;
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(0.35, t0 + 0.12);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);

  noise.connect(filtro);
  filtro.connect(g);
  g.connect(ctx.destination);
  noise.start(t0);
  noise.stop(t0 + dur);

  // Acompaña con un pequeño "redoble" de campana arriba
  _nota(ctx, 1320, 0.4, "triangle", 0.1);
}

// ─────────────────────────────────────────────────────────────
// CONFIGURACIÓN VISUAL
// ─────────────────────────────────────────────────────────────

function aplicarConfiguracionVisual() {
  _setToggle("opt-flor",      S.cfgFlor);
  _setToggle("opt-fast",      S.cfgChico);
  _setToggle("opt-sound",     S.cfgSonido);
  // Respetar la preferencia guardada del marcador lateral
  // (antes se forzaba siempre a oculto y se pisaba lo guardado)
  _setToggle("opt-sidescore", !!S.cfgSideScore);
  _actualizarSideScore();
  _renderDificultadIA();
  _pintarIdentidad();
}

/* ── Identidad del jugador (nombre + club) en Ajustes ──────────────────
   Única vía publicada para esto: la pantalla de registro cuelga de
   "TORNEO DE LIGA", oculto por el lanzamiento reducido. Sin esto todos
   los jugadores juegan con el nombre por defecto y con un club que se
   re-sortea solo. */
function _pintarIdentidad() {
  const inp = document.getElementById("opt-nombre");
  if (inp) {
    // Ni el default de hoy ni el heredado se muestran como si fueran un
    // nombre elegido: el campo queda vacío con su placeholder, que es la
    // invitación a ponerse uno.
    const generico = (n) => !n || n === NOMBRE_DEFAULT || n === _NOMBRE_HEREDADO;
    const guardado = nombreGuardadoDT();
    inp.value = !generico(guardado) ? guardado
              : (!generico(S.nombreJugador) ? S.nombreJugador : "");
  }

  _pintarCodigoJugador();

  const sel = document.getElementById("opt-club");
  if (!sel || typeof LIGA_LPA === "undefined" || !LIGA_LPA.equipos) return;
  const actual = (typeof equipoSel !== "undefined" && equipoSel) ? equipoSel.id : "";
  sel.innerHTML = LIGA_LPA.equipos
    .map((e) => `<option value="${e.id}"${e.id === actual ? " selected" : ""}>${nombreSeguro(e.nombre, "Club")}</option>`)
    .join("");
}

/* ── Código de jugador (para anotarse a un torneo) ──────────────────────
   Se calcula del token del dispositivo con SHA-256 (window.codigoJugadorPublico,
   src/saldoServer.js) — no es el token, que es lo que identifica al jugador
   ante el server y no puede andar circulando por un grupo de WhatsApp.
   Es async: hasta que resuelve queda el "…" del HTML. */
let _codigoJugadorCache = null;

function _pintarCodigoJugador() {
  const el = document.getElementById("opt-codigo");
  if (!el) return;
  if (_codigoJugadorCache) { el.textContent = _codigoJugadorCache; return; }
  if (typeof window.codigoJugadorPublico !== "function") { el.textContent = "no disponible"; return; }
  window.codigoJugadorPublico().then((c) => {
    _codigoJugadorCache = c;
    // Sin contexto seguro (http plano) crypto.subtle no existe: mejor
    // decirlo que mostrar un código que el server no va a reconocer.
    el.textContent = c || "no disponible";
  });
}

function copiarCodigoJugador() {
  const c = _codigoJugadorCache;
  if (!c) { if (typeof showToast === "function") showToast("Todavía no está listo tu código"); return; }
  const ok = () => { if (typeof showToast === "function") showToast("📋 Código copiado: " + c, 2200); };
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) { navigator.clipboard.writeText(c).then(ok, ok); return; }
  } catch (e) {}
  ok();   // sin portapapeles (http, navegador viejo) igual queda a la vista
}

function guardarNombreJugador(valor) {
  const limpio = (valor || "").trim().slice(0, 18);
  // Vacío = volver al default, no guardar cadena vacía.
  S.nombreJugador = limpio || NOMBRE_DEFAULT;
  if (typeof lsPut === "function") lsPut("tg_nombre_dt", limpio);
  if (typeof actualizarTodaLaInterfaz === "function") actualizarTodaLaInterfaz();
}

function guardarClubJugador(id) {
  // ⚠️ seleccionarEquipo() recibe el OBJETO equipo, no el id: pasarle el id
  // guardaba el string "undefined" en localStorage (eq.id de un string).
  const hallado = (typeof buscarEquipo === "function") ? buscarEquipo(id) : null;
  if (!hallado) return;
  if (typeof seleccionarEquipo === "function") {
    // seleccionarEquipo ya persiste en EQ_KEY y sincroniza LIGA.
    seleccionarEquipo(hallado.equipo, null, true);
  }
  // El hincha tiene que acompañar al escudo (si no, cara de un club y
  // escudo de otro — el mismo desfasaje que arregla jugarYa()).
  if (typeof sincronizarAvatarJugadorConClub === "function") sincronizarAvatarJugadorConClub();
  if (typeof AVATARS !== "undefined" && AVATARS[avatarSeleccionadoIdx]) {
    S.avatarJugador = AVATARS[avatarSeleccionadoIdx].icon;
  }
  if (typeof aplicarEquipoEnMesa === "function") aplicarEquipoEnMesa();
  if (typeof actualizarTodaLaInterfaz === "function") actualizarTodaLaInterfaz();
  if (typeof showToast === "function" && typeof equipoSel !== "undefined" && equipoSel) {
    showToast(`⚽ Ahora sos hincha de ${equipoSel.nombre}`);
  }
}

// ─────────────────────────────────────────────────────────────
// PANEL LATERAL DE FÓSFOROS (#side-score)
// Se muestra a la derecha de la mesa solo si: está habilitado en
// config, estamos en la pantalla "mesa" y hay ancho suficiente
// para que no se superponga con la cancha.
// ─────────────────────────────────────────────────────────────
// #side-score es ahora el ÚNICO tanteador (se quitó el marcador central
// duplicado del centro de la mesa). En pantallas anchas flota como panel
// fijo a la derecha de #mesa; en pantallas angostas se reubica como
// barra horizontal arriba de #mesa (clase .side-score-compact).
function _actualizarSideScore() {
  const side = document.getElementById("side-score");
  const mesa = document.getElementById("mesa");
  if (!side || !mesa) return;

  const enMesa  = getComputedStyle(mesa).display !== "none";
  const compact = window.innerWidth < 1100;

  side.classList.toggle("side-score-compact", compact);

  // En modo compacto, el panel pasa a vivir dentro de #mesa (arriba de
  // todo) para quedar en el flujo normal del documento.
  if (compact) {
    if (mesa.firstElementChild !== side) mesa.insertBefore(side, mesa.firstElementChild);
  } else {
    if (side.parentElement !== mesa.parentElement) mesa.parentElement.insertBefore(side, mesa.nextSibling);
  }

  side.style.display = (enMesa && !!S.cfgSideScore) ? "block" : "none";
}
window.addEventListener("resize", () => { if (typeof S !== "undefined") _actualizarSideScore(); });

// La dificultad de la IA ahora depende del equipo rival (su "fuerza"
// es un proxy del ranking FIFA / nivel del club). Mostramos un
// indicador informativo en Ajustes en vez del viejo switch manual.
function _renderDificultadIA() {
  const el = document.getElementById("ia-dificultad-info");
  if (!el) return;
  if (typeof equipoRival === "undefined" || !equipoRival || typeof equipoRival.fuerza !== "number") {
    el.textContent = "Se define al elegir el equipo rival";
    return;
  }
  const f = equipoRival.fuerza;
  let nivel = "Fácil";
  if (f >= 75) nivel = "Muy difícil";
  else if (f >= 60) nivel = "Difícil";
  else if (f >= 45) nivel = "Media";
  el.textContent = `${equipoRival.nombre} (fuerza ${f}/100) → ${nivel}`;
}

function _setToggle(id, on) {
  const el = document.getElementById(id);
  if (el) el.classList.toggle("on", !!on);
}

function toggleOpt(opt) {
  if (opt === "flor")      { S.cfgFlor = !S.cfgFlor; _setToggle("opt-flor", S.cfgFlor); }
  if (opt === "fast")      {
    // No permitir cambiar el límite a mitad de partida:
    // si alguien ya tiene puntos, el cambio recién aplica en la próxima.
    const partidaEnCurso = !S.juegoTerminado && (S.puntosJugador > 0 || S.puntosRival > 0);
    if (partidaEnCurso) {
      showToast("⚠️ El modo rápido se aplica en la próxima partida", 2500);
      return;
    }
    S.cfgChico = !S.cfgChico; _setToggle("opt-fast", S.cfgChico);
    S.limitePuntos = S.cfgChico ? 15 : 30;
  }
  if (opt === "sound")     {
    S.cfgSonido = !S.cfgSonido; _setToggle("opt-sound", S.cfgSonido);
    // "Sonido" apaga TODO el audio, no solo los efectos: hasta el 4 ago la
    // hinchada seguía murmurando con el toggle en OFF.
    if (typeof window.setMusicaEstadio === "function") window.setMusicaEstadio(S.cfgSonido);
  }
  if (opt === "sidescore") {
    S.cfgSideScore = !S.cfgSideScore;
    _actualizarSideScore();
    _setToggle("opt-sidescore", S.cfgSideScore);
  }
  guardarProgreso();
}

function setTheme(theme) {
  document.body.className = document.body.className.replace(/theme-\S+/g, "").trim();
  if (theme !== "green") document.body.classList.add(`theme-${theme}`);
  ["green","red","blue","dark"].forEach(t => {
    const el = document.getElementById(`th-${t}`);
    if (el) el.classList.toggle("active", t === theme);
  });
}

// ─────────────────────────────────────────────────────────────
// MODALES
// ─────────────────────────────────────────────────────────────

function openModal(id) {
  const m = document.getElementById(id);
  if (m) m.classList.add("show");
  if (id === "stats-modal") _renderEstadisticas();
  // Nombre y club pueden haber cambiado desde afuera de Ajustes (el Picadito
  // sortea club la primera vez), así que se repintan AL ABRIR, no solo en el
  // arranque — si no, el selector muestra el club anterior.
  if (id === "settings-modal") _pintarIdentidad();
  if (typeof _emitJuego === "function") _emitJuego("modalAbierto", { id });
}
function closeModal(id) {
  const m = document.getElementById(id);
  if (m) m.classList.remove("show");
}
function _renderEstadisticas() {
  const ef = ESTADISTICAS.partidasJugadas
    ? Math.round((ESTADISTICAS.partidasGanadas / ESTADISTICAS.partidasJugadas) * 100) + "%" : "0%";
  _setText("st-jugadas",     ESTADISTICAS.partidasJugadas);
  _setText("st-ganadas",     ESTADISTICAS.partidasGanadas);
  _setText("st-perdidas",    ESTADISTICAS.partidasPerdidas);
  _setText("st-efectividad", ef);
  _setText("st-puntos",      S.puntosJugador + S.puntosRival);
  // Estado vacío con onda: una columna de ceros no invita a nada. El aviso
  // se inyecta una sola vez y solo existe mientras no haya partidas.
  const box = document.querySelector("#stats-modal .modal-box");
  let hint = document.getElementById("st-vacio-hint");
  if (!ESTADISTICAS.partidasJugadas) {
    if (!hint && box) {
      hint = document.createElement("div");
      hint.id = "st-vacio-hint";
      hint.style.cssText = "margin:10px 0 4px;padding:9px 12px;border:1px dashed rgba(245,197,24,.45);border-radius:9px;font-size:12px;color:var(--gold,#f5c518);text-align:center";
      hint.textContent = "⚽ Todavía no jugaste ninguna. Un Picadito y estrenamos estos números.";
      box.insertBefore(hint, box.querySelector(".stat-row"));
    }
  } else if (hint) {
    hint.remove();
  }
}
function resetStats() {
  if (confirm("¿Resetear todos los datos? No se puede deshacer.")) resetearGuardadoTotal();
}

// ─────────────────────────────────────────────────────────────
// NUEVA PARTIDA
// ─────────────────────────────────────────────────────────────

function reiniciarPartida() {
  if (S.modoOnline) {
    if (typeof onlineFinalizarPartida === "function") onlineFinalizarPartida();
    return;
  }
  // Revancha: descartar los overlays de la partida que se acaba de cerrar.
  // Con backlog en la cola se veian encima de la mesa nueva, y con el rival
  // NUEVO en el subtitulo (el nombre se resuelve al mostrarse).
  purgarOverlays();
  // ⚠️ La revancha vuelve al MODO DT, y hay que devolverle su club (7 ago).
  // mundialJugarSiguiente/copaJugarSiguiente pisan los globals `equipoSel` y
  // `LIGA` con el equipo del torneo y no los restauran nunca. Como
  // ligaKeyActual() deriva la clave del Torneo de Liga de LIGA.id, apretar
  // "▶ NUEVA PARTIDA" después de un partido del Mundial arrancaba un
  // campeonato FANTASMA en `truco_liga_mundial2026`: 48 selecciones, 47
  // fechas, pagando sobres de figuritas — mientras la Liga de verdad del
  // jugador no avanzaba. setName() y jugarYa() ya restauraban; esto no.
  // Solo si NO quedó ningún modo de torneo prendido: con el torneo en curso,
  // su propio flujo maneja el equipo.
  const _enTorneo = (typeof modoCopa !== "undefined" && modoCopa) ||
                    (typeof modoMundial !== "undefined" && modoMundial) ||
                    (typeof window !== "undefined" && (window.modoTorneoRapido || window.modoCopaRapida));
  if (!_enTorneo && typeof restaurarEquipoDT === "function") restaurarEquipoDT();
  S.puntosJugador  = 0;
  S.puntosRival    = 0;
  S.juegoTerminado = false;
  S._manoCerrada   = false;
  // BUG FIX: primer mano aleatorio (antes siempre empezaba el rival)
  S.turnoMano = Math.random() < 0.5 ? "jugador" : "rival";
  seleccionarRivalAleatorio();
  if (typeof _emitJuego === "function") _emitJuego("nuevoPartido");
  repartirNuevaMano();
}

// ─────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────

function _setText(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}

// Igual que _setText, pero si el valor numérico aumentó respecto al
// anterior, dispara la animación "score-pop" (marcador tipo estadio).
function _setTextConPop(id, val, prev) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = val;
  if (prev !== null && val > prev) {
    el.classList.remove("score-pop");
    // Forzar reflow para poder re-disparar la animación
    void el.offsetWidth;
    el.classList.add("score-pop");
    setTimeout(() => el.classList.remove("score-pop"), 600);
  }
}
function _setWidth(id, pct) {
  const el = document.getElementById(id);
  if (el) el.style.width = Math.min(100, Math.max(0, pct)) + "%";
}

// ─────────────────────────────────────────────────────────────
// CSS DINÁMICO — clases de realismo que no estaban en style.css
// ─────────────────────────────────────────────────────────────

(function _inyectarCSS() {
  const s = document.createElement("style");
  s.textContent = `
    /* Indicador de turno activo */
    .turno-activo .player-hand .card.can-play,
    .turno-activo .card.can-play {
      box-shadow: 0 8px 16px rgba(0,0,0,.35), 0 0 0 2px rgba(200,168,75,.35) !important;
    }
    .zona-jugador.turno-activo::after {
      content: "▲ TU TURNO";
      display: block;
      font-size: 8px;
      color: var(--gold);
      text-align: center;
      letter-spacing: 1.5px;
      font-family: var(--f-ui);
      animation: badgePulse .8s ease-in-out infinite alternate;
      margin-top: 2px;
    }
    /* Carta girada ligeramente al caer en mesa (refuerza la rotación JS) */
    .card.played.j-played { transform-origin: bottom center }
    .card.played.r-played { transform-origin: top center }
    /* Efecto de hover con brillo dorado más pronunciado */
    .card.can-play:hover::before {
      opacity: 1 !important;
      background: linear-gradient(125deg, rgba(255,255,255,.7) 0%, transparent 22%, transparent 58%, rgba(255,255,255,.25) 100%) !important;
    }
    /* Toast más dramático para cantos */
    .toast.canto {
      font-size: 26px !important;
      letter-spacing: 3px !important;
      border-color: rgba(200,168,75,1) !important;
      box-shadow: 0 0 30px rgba(200,168,75,.4), 0 12px 28px rgba(0,0,0,.6) !important;
    }
    /* ── DRAG & DROP (arrastrar carta a la mesa) ── */
    /* touch-action:none evita que el navegador haga scroll al arrastrar en mobile */
    .player-hand .card.can-play { touch-action: none; }
    .card.dragging-origin { opacity: .25 !important; transform: scale(.96) !important; }
    .card-drag-ghost {
      position: fixed; left: 0; top: 0;
      width: var(--cw); height: var(--ch);
      transform: translate(-50%, -50%) rotate(-3deg) scale(1.06);
      border-radius: var(--cr); overflow: hidden;
      pointer-events: none; z-index: 9999;
      box-shadow: 0 24px 50px rgba(0,0,0,.6), 0 0 0 3px rgba(106,180,245,.5);
    }
    .card-drag-ghost img { width: 100%; height: 100%; object-fit: fill; display: block; border-radius: inherit; }
  `;
  document.head.appendChild(s);
})();

// ─────────────────────────────────────────────────────────────
// INIT
// ─────────────────────────────────────────────────────────────
// INIT — solo construye el grid de avatares
// La navegación de pantallas la maneja anotador.js
// ─────────────────────────────────────────────────────────────

window.addEventListener("DOMContentLoaded", () => {
  buildAvatarGrid();
  // NO mostrar name-screen aquí — lo hace irA() desde anotador.js
  _iniciarAtajosTeclado();
  // Resetear historial al iniciar nueva partida
  if (typeof onJuego === "function") {
    onJuego("nuevoPartido", () => { _historialManos = []; _renderHistorialManos(); });
  }
});

// ── ATAJOS DE TECLADO ─────────────────────────────────────────────────────────
// trucogame.com los tiene; acá los implementamos para escritorio.
//   E → Envido (o Quiero si hay envido pendiente del rival)
//   R → Real Envido
//   F → Falta Envido / Flor (según contexto)
//   T → Truco / Retruco / Vale 4
//   Q → Quiero (responder cualquier canto)
//   N → No Quiero
//   M → Al Mazo
//   F2 → Menú de frases del jugador
function _iniciarAtajosTeclado() {
  document.addEventListener("keydown", (e) => {
    // No disparar si el usuario está escribiendo en un input
    const tag = (e.target || {}).tagName || "";
    if (tag === "INPUT" || tag === "TEXTAREA" || e.ctrlKey || e.metaKey || e.altKey) return;
    // No disparar si hay un modal abierto
    if (document.querySelector(".modal.show")) return;

    const acc = document.getElementById("acciones");
    if (!acc) return;

    // Helper: hacer click en el primer botón que contiene el texto dado
    const clickBtn = (texto) => {
      const btns = acc.querySelectorAll("button:not(:disabled)");
      for (const b of btns) {
        if (b.textContent.toUpperCase().includes(texto.toUpperCase())) {
          b.click(); return true;
        }
      }
      return false;
    };

    switch (e.key.toUpperCase()) {
      case "E":
        // Envido ofensivo o Quiero si hay envido del rival
        if (!clickBtn("ENVIDO")) clickBtn("QUIERO");
        break;
      case "R": clickBtn("REAL ENVIDO"); break;
      case "F":
        if (e.key === "F" && e.shiftKey) break; // no conflicto con F-keys del SO
        clickBtn("FALTA ENVIDO") || clickBtn("FLOR");
        break;
      case "T": clickBtn("TRUCO") || clickBtn("RETRUCO") || clickBtn("VALE"); break;
      case "Q": clickBtn("QUIERO"); break;
      case "N": clickBtn("NO QUIERO"); break;
      case "M": clickBtn("AL MAZO"); break;
    }
  });

  // Hint de atajos en la mesa (solo escritorio, una vez por sesión)
  if (!sessionStorage.getItem("atajos-hint-visto")) {
    setTimeout(() => {
      if (document.getElementById("mesa")?.style.display !== "none") {
        showToast("💡 Atajos: E=Envido T=Truco Q=Quiero N=No M=Mazo F2=Frases", 3500);
        sessionStorage.setItem("atajos-hint-visto", "1");
      }
    }, 4000);
  }
}

// ─────────────────────────────────────────────────────────────
// PANEL DE ACTIVIDAD — log persistente de cantos y jugadas
// Inspirado en trucogame.com. Muestra los últimos N eventos
// de la partida en un panel lateral fijo.
// ─────────────────────────────────────────────────────────────

const _PA_MAX = 14; // entradas máximas en el panel
const _PA_LOG = []; // {msg, tipo, ts}

// Clasificar el tipo de entrada para colorear
function _paTipo(msg) {
  const m = msg.toLowerCase();
  if (m.includes("truco") || m.includes("retruco") || m.includes("vale")) return "truco";
  if (m.includes("envido") || m.includes("real") || m.includes("falta")) return "envido";
  if (m.includes("flor") || m.includes("contraflor")) return "flor";
  if (m.includes("no quiero")) return "noquiero"; // antes que "quiero": lo contiene
  if (m.includes("quiero")) return "quiero";
  if (m.includes("mazo")) return "mazo";
  if (m.includes("ganaste") || m.includes("gané") || m.includes("gano") || m.includes("goleada")) return "gano";
  if (m.includes("rival") && (m.includes("ganó") || m.includes("gano"))) return "pierde";
  if (m.includes("+")) return "pts";
  return "info";
}

function logActividad(msg) {
  if (!msg) return;
  _PA_LOG.unshift({ msg, tipo: _paTipo(msg), ts: Date.now() });
  if (_PA_LOG.length > _PA_MAX) _PA_LOG.length = _PA_MAX;
  _renderPanelActividad();
}

function _renderPanelActividad() {
  const lista = document.getElementById("pa-lista");
  if (!lista) return;
  lista.innerHTML = _PA_LOG.map(e =>
    `<div class="pa-item pa-${e.tipo}">${_paIcono(e.tipo)} ${_paHtml(e.msg)}</div>`
  ).join("");
}

function _paIcono(tipo) {
  const m = { truco:"🎯", envido:"🪙", flor:"🌸", quiero:"✅", noquiero:"❌",
               mazo:"🃏", gano:"🏆", pierde:"💔", pts:"📊", info:"💬" };
  return m[tipo] || "•";
}

function _paHtml(msg) {
  // esc() PRIMERO: acá entra todo lo que pasa por showToast, y varios de
  // esos textos vienen de la red (señas del 2v2, nombre del rival). Sin
  // escapar, una seña con <img onerror> ejecutaba JS en la máquina del
  // compañero y de los rivales. nombreSeguro() recorta pero NO escapa:
  // "pasó por nombreSeguro" nunca equivale a "es seguro en innerHTML".
  const seguro = (typeof esc === "function") ? esc(String(msg)) : String(msg)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  // Resaltar puntos con span dorado
  return seguro.replace(/(\+\d+)/g, '<span class="pa-pts">$1</span>');
}

// Mostrar/ocultar el panel según la pantalla activa
function _actualizarPanelActividad() {
  const panel = document.getElementById("panel-actividad");
  if (!panel) return;
  const enMesa = document.getElementById("mesa")?.style.display !== "none";
  panel.style.display = (enMesa && window.innerWidth >= 900) ? "flex" : "none";
}

// Interceptar showToast para también loguear al panel
const _showToastOrig = showToast;
window.showToast = function(msg, dur) {
  _showToastOrig(msg, dur);
  // Filtrar mensajes poco interesantes
  if (msg && !msg.startsWith("💡") && !msg.startsWith("⚠️")) {
    logActividad(msg);
  }
};

// Hook para limpiar panel al nuevo partido
if (typeof onJuego === "function") {
  onJuego("nuevoPartido", () => { _PA_LOG.length = 0; _renderPanelActividad(); });
}

// CSS del panel de actividad y temporizador (inyectado dinámicamente)
(function _cssExtra() {
  const s = document.createElement("style");
  s.textContent = `
    /* ── Panel de Actividad ── */
    #panel-actividad {
      display: none; /* JS lo activa */
      position: fixed;
      right: 0;
      /* Antes: top:50% + translateY(-50%) + max-height:70vh. O sea, centrado
         y creciendo hacia ARRIBA Y ABAJO hasta 70vh. #mesa-ranking (el TOP)
         está clavado en bottom:140px, así que en cuanto entraban un par de
         eventos este panel le caía encima y quedaban los dos ilegibles, uno
         transparentándose sobre el otro. No había nada coordinándolos.
         Ahora se ancla arriba y su alto máximo reserva la franja de abajo
         donde vive el ranking: no se pueden pisar en ningún tamaño. */
      top: 90px;
      width: 190px;
      max-height: calc(100vh - 400px);
      flex-direction: column;
      background: rgba(5,20,12,.92);
      border: 1px solid rgba(200,168,75,.3);
      border-right: none;
      border-radius: 12px 0 0 12px;
      /* auto y no hidden: ahora que el alto está topeado, los eventos que no
         entran se scrollean adentro en vez de quedar recortados sin aviso. */
      overflow-y: auto; overflow-x: hidden;
      z-index: 90;
      box-shadow: -4px 0 24px rgba(0,0,0,.5);
    }
    .pa-header {
      font-family: var(--f-ui, 'Oswald', sans-serif);
      font-size: 10px;
      letter-spacing: 2px;
      color: var(--gold, #f5c518);
      text-align: center;
      padding: 7px 8px 5px;
      border-bottom: 1px solid rgba(200,168,75,.2);
      background: rgba(0,0,0,.3);
    }
    .pa-lista {
      overflow-y: auto;
      flex: 1;
      padding: 4px 0;
      scrollbar-width: thin;
      scrollbar-color: rgba(200,168,75,.3) transparent;
    }
    .pa-item {
      font-family: var(--f-body, 'Oswald', sans-serif);
      font-size: 11px;
      padding: 5px 8px;
      border-bottom: 1px solid rgba(255,255,255,.04);
      color: rgba(255,255,255,.8);
      line-height: 1.3;
      display: flex;
      gap: 5px;
      align-items: flex-start;
    }
    .pa-item:first-child { animation: paFadeIn .25s ease; }
    @keyframes paFadeIn { from { opacity:0; transform: translateX(8px); } to { opacity:1; transform: none; } }
    /* Colores por tipo */
    .pa-truco  { border-left: 3px solid #e74c3c; }
    .pa-envido { border-left: 3px solid #3498db; }
    .pa-flor   { border-left: 3px solid #9b59b6; }
    .pa-quiero { border-left: 3px solid #27ae60; }
    .pa-noquiero { border-left: 3px solid #e67e22; }
    .pa-mazo   { border-left: 3px solid #7f8c8d; }
    .pa-gano   { border-left: 3px solid var(--gold, #f5c518); color: var(--gold, #f5c518); font-weight:bold; }
    .pa-pierde { border-left: 3px solid #e74c3c; color: #e74c3c; }
    .pa-pts    { border-left: 3px solid #2ecc71; }
    .pa-info   { border-left: 3px solid rgba(255,255,255,.15); }
    .pa-pts span.pa-pts { color: #2ecc71; font-weight: bold; }

    /* ── Temporizador ── */
    #timer-jugador {
      display: none;
      position: absolute;
      bottom: 6px;
      left: 50%;
      transform: translateX(-50%);
      width: 42px; height: 42px;
      pointer-events: none;
      z-index: 50;
    }
    #timer-jugador svg { width: 42px; height: 42px; }
    #timer-jugador .timer-bg  { fill: none; stroke: rgba(255,255,255,.1); stroke-width: 3; }
    #timer-jugador .timer-arc { fill: none; stroke: var(--gold, #f5c518); stroke-width: 3;
      stroke-linecap: round; transform: rotate(-90deg); transform-origin: 50% 50%;
      transition: stroke-dashoffset .9s linear, stroke .5s; }
    #timer-jugador .timer-txt {
      position: absolute; top:50%; left:50%; transform:translate(-50%,-50%);
      font-family: var(--f-ui, 'Oswald', sans-serif);
      font-size: 13px; font-weight: 700;
      color: var(--gold, #f5c518);
    }
    #timer-jugador.urgente .timer-arc { stroke: #e74c3c; }
    #timer-jugador.urgente .timer-txt { color: #e74c3c; }
    #timer-jugador.urgente { animation: timerPulse .5s ease-in-out infinite alternate; }
    @keyframes timerPulse { from { opacity:.7; } to { opacity:1; } }
  `;
  document.head.appendChild(s);
})();

// ─────────────────────────────────────────────────────────────
// TEMPORIZADOR DE TURNO
// 30s por turno del jugador. Al agotarse:
//  - Si hay canto pendiente (del rival) → no quiero automático
//  - Si es turno de jugar carta → juega la de menor fuerza
// ─────────────────────────────────────────────────────────────

const TIMER_SEG = 30;
let _timerHandle   = null;
let _timerRestante = 0;
let _timerActivo   = false;

function _crearTimerDOM() {
  if (document.getElementById("timer-jugador")) return;
  const r = 17; // radio del arco
  const circ = 2 * Math.PI * r;
  const el = document.createElement("div");
  el.id = "timer-jugador";
  el.innerHTML = `
    <svg viewBox="0 0 42 42">
      <circle class="timer-bg"  cx="21" cy="21" r="${r}"/>
      <circle class="timer-arc" cx="21" cy="21" r="${r}"
        stroke-dasharray="${circ}" stroke-dashoffset="0"/>
    </svg>
    <div class="timer-txt" id="timer-num">${TIMER_SEG}</div>`;
  // Insertar en la zona del jugador
  const zona = document.querySelector(".zona-jugador");
  if (zona) zona.style.position = "relative", zona.appendChild(el);
}

function _timerActualizar() {
  const el  = document.getElementById("timer-jugador");
  const arc = el?.querySelector(".timer-arc");
  const num = document.getElementById("timer-num");
  if (!el || !arc || !num) return;

  const r    = 17;
  const circ = 2 * Math.PI * r;
  const pct  = _timerRestante / TIMER_SEG;
  arc.style.strokeDashoffset = circ * (1 - pct);
  num.textContent = _timerRestante;

  el.classList.toggle("urgente", _timerRestante <= 8);
}

function iniciarTimer() {
  detenerTimer();
  if (typeof S === "undefined" || S.juegoTerminado || S.modoOnline) return;
  // Solo timer cuando es turno activo del jugador
  const hayAccion = S.turnoActual === "jugador" ||
    (S.cantoPendiente && S.quienCantoPendiente === "rival");
  if (!hayAccion) return;

  _crearTimerDOM();
  const el = document.getElementById("timer-jugador");
  if (el) el.style.display = "block";

  _timerRestante = TIMER_SEG;
  _timerActivo   = true;
  _timerActualizar();

  _timerHandle = setInterval(() => {
    if (!_timerActivo) { clearInterval(_timerHandle); return; }
    _timerRestante--;
    _timerActualizar();

    if (_timerRestante <= 0) {
      detenerTimer();
      _timerAutoAction();
    }
  }, 1000);
}

function detenerTimer() {
  _timerActivo = false;
  clearInterval(_timerHandle);
  _timerHandle = null;
  const el = document.getElementById("timer-jugador");
  if (el) el.style.display = "none";
}

function _timerAutoAction() {
  // Seguridad: no actuar si ya no es turno del jugador
  if (typeof S === "undefined") return;

  showToast("⏱ Tiempo agotado — jugada automática", 1800);

  if (S.cantoPendiente && S.quienCantoPendiente === "rival") {
    // Responder con "no quiero" al canto del rival
    const acc = document.getElementById("acciones");
    const btnNQ = acc && [...acc.querySelectorAll("button")].find(b =>
      b.textContent.toUpperCase().includes("NO QUIERO"));
    if (btnNQ) { btnNQ.click(); return; }
    // Fallback directo
    if (typeof responderCantoJugador === "function") responderCantoJugador(false);
    return;
  }

  if (S.turnoActual === "jugador") {
    // Jugar la carta de menor fuerza (la más conservadora)
    const mano = S.manoJugador || [];
    // OJO: jugarCartaJugador espera el INDICE, no el id. Con el id,
    // S.manoJugador["5_o"] es undefined y la funcion salia sin hacer nada:
    // se agotaba el tiempo, no se jugaba, y el turno quedaba colgado sin
    // cronometro (detenerTimer ya habia corrido).
    let idxMin = -1, fuerzaMin = Infinity;
    for (let i = 0; i < mano.length; i++) {
      const id = mano[i];
      if (!id) continue;
      const c = (typeof C !== "undefined") ? C[id] : null;
      if (c && c.f < fuerzaMin) { fuerzaMin = c.f; idxMin = i; }
    }
    if (idxMin >= 0 && typeof jugarCartaJugador === "function") {
      jugarCartaJugador(idxMin);
    }
  }
}

// Exponer para que juego.js pueda arrancar/detener el timer
// (se llama desde actualizarTodaLaInterfaz)
window.iniciarTimer  = iniciarTimer;
window.detenerTimer  = detenerTimer;

// ─────────────────────────────────────────────────────────────
// FIN DE PARTIDO — pantalla de cierre
// Antes el partido terminaba con un toast que se esfumaba y un botón
// "NUEVA PARTIDA" perdido en la fila de acciones (que encima podía quedar
// tapado por el cartel de logros). El jugador quedaba mirando la mesa sin
// saber qué apretar. Esto pone un cierre explícito: resultado, marcador y
// dos salidas claras. Online muestra un solo botón (CONTINUAR) que delega
// en el flujo de onlineFinalizarPartida, igual que hacía el botón viejo.
// ─────────────────────────────────────────────────────────────
(function _finDePartidoUI() {
  const css = document.createElement("style");
  css.textContent = `
    #fin-partido-overlay {
      position: fixed; inset: 0; z-index: 530;
      display: none; align-items: center; justify-content: center;
      background: rgba(4,14,8,.82); backdrop-filter: blur(3px);
    }
    #fin-partido-overlay.show { display: flex; }
    .fp-card {
      background: linear-gradient(160deg, #0d2818, #06140c);
      border: 1px solid rgba(200,168,75,.45); border-radius: 18px;
      padding: 30px 40px 26px; text-align: center; max-width: 90vw;
      box-shadow: 0 24px 70px rgba(0,0,0,.75);
    }
    .fp-titulo { font-family: var(--f-camiseta, Oswald, sans-serif);
      font-size: 30px; letter-spacing: 2px; margin-bottom: 4px; }
    .fp-card.gano  .fp-titulo { color: var(--gold, #f5c518); }
    .fp-card.pierde .fp-titulo { color: #e74c3c; }
    .fp-marcador { font-family: var(--f-camiseta, Oswald, sans-serif);
      font-size: 44px; font-weight: 800; color: #fff; margin: 6px 0 2px; }
    .fp-vs { font-size: 12px; color: rgba(255,255,255,.55);
      letter-spacing: 1px; margin-bottom: 14px; }
    .fp-racha { display: none; font-family: var(--f-ui, Oswald, sans-serif);
      font-size: 13px; letter-spacing: .5px; color: #ffd97a;
      background: rgba(245,197,24,.09); border: 1px solid rgba(245,197,24,.22);
      border-radius: 20px; padding: 6px 14px; margin: 0 auto 16px; }
    .fp-card.pierde .fp-racha { color: rgba(255,255,255,.72);
      background: rgba(255,255,255,.05); border-color: rgba(255,255,255,.14); }
    .fp-stats { display: none; gap: 26px; justify-content: center; margin-bottom: 18px; }
    .fp-stat { display: flex; flex-direction: column; align-items: center; gap: 2px; }
    .fp-stat-lbl { font-size: 9px; letter-spacing: 1.5px; color: rgba(255,255,255,.45); }
    .fp-stat-num { font-family: var(--f-camiseta, Oswald, sans-serif); font-size: 20px;
      line-height: 1; color: rgba(255,255,255,.55); }
    .fp-stat-num.gana { color: #fff; }
    .fp-stat-sep { font-size: 10px; color: rgba(255,255,255,.3); line-height: 1; }
    .fp-comprobante { color: rgba(255,255,255,.4); font-size: 10.5px; letter-spacing: .5px;
      margin-bottom: 14px; min-height: 13px; }
    .fp-botones { display: flex; gap: 10px; justify-content: center; flex-wrap: wrap; }
  `;
  document.head.appendChild(css);

  const ov = document.createElement("div");
  ov.id = "fin-partido-overlay";
  ov.innerHTML = `
    <div class="fp-card" id="fp-card">
      <div class="fp-titulo" id="fp-titulo"></div>
      <div class="fp-marcador" id="fp-marcador"></div>
      <div class="fp-vs" id="fp-vs"></div>
      <div class="fp-racha" id="fp-racha"></div>
      <div class="fp-stats" id="fp-stats"></div>
      <div class="fp-comprobante" id="fp-comprobante"></div>
      <div class="fp-botones" id="fp-botones"></div>
    </div>`;
  document.body.appendChild(ov);

  // Estado del comprobante SERVER (no la tarjeta local, que se puede
  // falsificar editando el DOM): lo que de verdad sirve para pagar una
  // apuesta es que el server lo tenga guardado, consultable con el código
  // de mesa en GET /interno/salas/<código> (auditoría del online, 2 ago,
  // punto 3). Se refresca al pintar el cierre y de nuevo cuando llega la
  // confirmación (viaje de ida y vuelta al relay, puede tardar un toque más
  // que el cierre de la mano).
  function _fpActualizarComprobante() {
    const el = document.getElementById("fp-comprobante");
    if (!el) return;
    if (typeof S === "undefined" || !S.modoOnline) { el.textContent = ""; return; }
    // Mesa AUTORITATIVA: no hay confirmación que esperar. Acá el resultado
    // no sale de dos reportes que tienen que coincidir — lo dictó el server,
    // que corrió el motor, y lo persistió al terminar. Sin esta rama el
    // cartel se quedaba en "⏳ Esperando la confirmación…" para siempre,
    // esperando un viaje de ida y vuelta que en este modo no existe.
    if (S.modoAuto1v1) {
      const cod = (typeof A1 !== "undefined" && A1.codigo) ? ` · consultable con el código ${A1.codigo}` : "";
      el.textContent = `✅ Resultado del servidor${cod}`;
      return;
    }
    const r = (typeof ONLINE !== "undefined") ? ONLINE._ultimoResultado : null;
    if (!r || !r.codigo) { el.textContent = "⏳ Esperando la confirmación del servidor…"; return; }
    const TXT = { confirmado: "✅ Confirmado por el servidor", discrepancia: "⚠️ Discrepancia — no coincide con el rival",
      incompleto: "⚠️ Incompleto — faltó algún reporte", abandono: "⚠️ Se cortó la conexión antes de reportar" };
    el.textContent = `${TXT[r.estado] || r.estado} · consultable con el código ${r.codigo}`;
  }
  window._fpActualizarComprobante = _fpActualizarComprobante;
  if (typeof netOn === "function") {
    ["resultado_confirmado", "resultado_discrepancia", "resultado_incompleto", "resultado_abandono"]
      .forEach((evento) => netOn(evento, () => _fpActualizarComprobante()));
  }

  function fpCerrar() { ov.classList.remove("show"); }
  window._fpRevancha = function () {
    fpCerrar();
    // En la mesa autoritativa no hay revancha en el lugar: el server ya
    // cerró la sala al terminar la partida (y borró el código), así que
    // reiniciarPartida() acá arrancaría un juego LOCAL contra nadie, con la
    // mesa todavía marcada como online. Se sale limpio al menú, desde donde
    // se arma una mesa nueva.
    if (typeof S !== "undefined" && S.modoAuto1v1) {
      if (typeof auto1v1Reset === "function") auto1v1Reset();
      if (typeof auto1v1MesaCerrar === "function") auto1v1MesaCerrar();
      if (typeof irA === "function") irA("main-menu");
      return;
    }
    reiniciarPartida();
  };
  window._fpMenu     = function () { fpCerrar(); if (typeof irA === "function") irA("main-menu"); };

  // Compartir el resultado del 1v1 online al grupo de WhatsApp — el 2v2 ya
  // lo tenía (_2v2CompartirResultado) y el 1v1 no, pedido de Chucho del
  // 2-ago. Mismo mecanismo wa.me: WhatsApp no deja precargar texto DENTRO
  // de un grupo puntual por URL, así que se abre con el mensaje armado y el
  // jugador elige el grupo — igual que el botón del 2v2.
  let _fpDatosWA = null;
  window._fpCompartirWA = function () {
    if (!_fpDatosWA) return;
    const d = _fpDatosWA;
    const r = (typeof ONLINE !== "undefined") ? ONLINE._ultimoResultado : null;
    const compTxt = (r && r.codigo && r.estado === "confirmado")
      ? `\n✅ Confirmado por el servidor — verificable con el código ${r.codigo}`
      : "";
    const texto = `🏆 RESULTADO — TRUCO GOL ONLINE\n` +
      `✅ Ganó (${d.pg}): ${d.ganador}\n` +
      `❌ Perdió (${d.pp}): ${d.perdedor}` + compTxt + `\n` +
      `⚔️ La revancha se juega en https://trucogol.com.ar`;
    window.open("https://wa.me/?text=" + encodeURIComponent(texto), "_blank", "noopener");
  };

  let fpRegistrado = false;   // la racha se cuenta una vez por partido

  // ¿Este partido cierra con ESTA tarjeta? Solo en amistoso y online:
  // Liga/Mundial/Copa ya tienen su propio flujo post-partido (abren su modal
  // con el fixture ~1.2s después del final), y ahí un botón "REVANCHA" que
  // arranca un partido suelto rompería el torneo.
  // Lo consulta extras.js para no abrir su "RESUMEN DE PARTIDO" encima: las
  // stats de ese resumen se muestran acá adentro (una sola pantalla de cierre).
  function _fpAplica() {
    const esAmistoso = typeof modoAmistoso !== "undefined" && modoAmistoso;
    const esOnline   = typeof S !== "undefined" && S.modoOnline;
    // Picadito sumado el 4 ago: es el BOTÓN PRINCIPAL del menú publicado y
    // era el único modo que terminaba sin tarjeta ni revancha — un toast y
    // la mesa muerta. Es un partido suelto igual que el amistoso, así que
    // la revancha de esta tarjeta no rompe ningún torneo.
    const esPicadito = typeof window !== "undefined" && window.modoPicadito;
    return !!(esAmistoso || esOnline || esPicadito);
  }
  window._fpAplica = _fpAplica;

  onJuego("finDePartido", (d) => {
    if (!_fpAplica()) return;
    const gano = d.puntosJugador >= d.limite;
    const card = document.getElementById("fp-card");
    card.classList.remove("gano", "pierde");
    card.classList.add(gano ? "gano" : "pierde");
    _setText("fp-titulo", gano ? "🏆 ¡GANASTE EL PARTIDO!" : "PERDISTE EL PARTIDO");
    _setText("fp-marcador", `${d.puntosJugador} - ${d.puntosRival}`);
    _setText("fp-vs", `${(S.nombreJugador || "VOS").toUpperCase()} vs ${(AVATARS[S.idRival]?.name || "RIVAL").toUpperCase()}`);
    // Racha de partidos: el gancho para la revancha. Se registra una sola vez.
    const rachaEl = document.getElementById("fp-racha");
    if (rachaEl) {
      if (!fpRegistrado) {
        fpRegistrado = true;
        try {
          rachaEl.dataset.frase = (typeof window.tgRachaPartidos === "function")
            ? window.tgRachaPartidos(gano).frase : "";
        } catch (e) { rachaEl.dataset.frase = ""; }
      }
      const frase = rachaEl.dataset.frase || "";
      rachaEl.textContent = frase;
      rachaEl.style.display = frase ? "inline-block" : "none";
    }
    // Cómo se ganó (lo que antes abría un segundo modal encima).
    const stEl = document.getElementById("fp-stats");
    if (stEl) {
      const st = (typeof window.tgStatsPartido === "function") ? window.tgStatsPartido() : null;
      const hay = st && (st.manosJ + st.manosR + st.envidosJ + st.envidosR) > 0;
      stEl.innerHTML = hay
        ? [["MANOS", st.manosJ, st.manosR], ["ENVIDOS", st.envidosJ, st.envidosR]]
            .map(([lbl, j, r]) => `<div class="fp-stat"><span class="fp-stat-lbl">${lbl}</span>` +
              `<span class="fp-stat-num${j >= r ? " gana" : ""}">${j}</span>` +
              `<span class="fp-stat-sep">-</span>` +
              `<span class="fp-stat-num${r > j ? " gana" : ""}">${r}</span></div>`).join("")
        : "";
      stEl.style.display = hay ? "flex" : "none";
    }
    const btns = document.getElementById("fp-botones");
    if (S.modoOnline) {
      // Datos para el compartir: nombres reales de la partida online. El
      // rival viene del intercambio "hola" (ONLINE.nombreRival); si por lo
      // que sea no llegó, cae al nombre del avatar de la mesa.
      const nomJ = S.nombreJugador || "Vos";
      const nomR = (typeof ONLINE !== "undefined" && ONLINE.nombreRival) ||
                   (AVATARS[S.idRival] && AVATARS[S.idRival].name) || "Rival";
      _fpDatosWA = {
        ganador: gano ? nomJ : nomR,
        perdedor: gano ? nomR : nomJ,
        pg: Math.max(d.puntosJugador, d.puntosRival),
        pp: Math.min(d.puntosJugador, d.puntosRival),
      };
      _fpActualizarComprobante();
      btns.innerHTML =
        `<button class="btn primary" onclick="_fpRevancha()">▶ CONTINUAR</button>
         <button class="btn" onclick="_fpCompartirWA()">🟢 COMPARTIR AL GRUPO</button>`;
    } else {
      _fpDatosWA = null;
      _fpActualizarComprobante();
      btns.innerHTML =
        `<button class="btn primary" onclick="_fpRevancha()">🔁 REVANCHA</button>
         <button class="btn" onclick="_fpMenu()">🏟 VOLVER AL MENÚ</button>`;
    }
    // Un respiro para que se vea el último punto/overlay de mano antes del cierre.
    // 1600, no 1400: el efecto de GOLAZO (features_visual.js, si el jugador
    // ganó) dispara a los 300ms y tarda 1220ms en apagarse del todo (z-index
    // 8900-9100, por encima de esta tarjeta en 530) — con 1400 la tarjeta
    // aparecía todavía tapada por la cola de rayos/texto.
    setTimeout(() => ov.classList.add("show"), 1600);
  });

  // Si arranca otra partida por cualquier otro camino, que no quede colgado
  onJuego("nuevoPartido", () => { fpCerrar(); fpRegistrado = false; });
})();

// ── Salir de la mesa EN MEDIO de la partida (5 ago 2026) ─────────────
// Reporte de Chucho jugando: "cuando inicio picadito no me da la opción de
// volver al menú principal o salir al jugar, solo aparece al finalizar la
// partida". Y era literal: la ÚNICA salida de la mesa era el botón "VOLVER
// AL MENÚ" de la tarjeta de fin de partido. El ☰ de la mesa quedó podado el
// 4 ago a Reglas + Ajustes (bien podado: exponía Tienda y Sala de apuestas),
// pero ninguno de los 11 accesos que tenía era "salir" — así que el que
// arrancaba un Picadito se quedaba adentro hasta terminarlo.
//
// No es lo mismo irse de un Picadito que de una partida online: si hay un
// rival humano del otro lado, irse es abandonar, y hay que soltar el socket
// (si no, el rival se queda esperando a alguien que ya cerró la pantalla).
function mesaSalirAlMenu() {
  const enOnline = (typeof S !== "undefined" && S && S.modoOnline && !S.juegoTerminado);
  const enPartida = (typeof S !== "undefined" && S && !S.juegoTerminado &&
    ((S.puntosJugador || 0) > 0 || (S.puntosRival || 0) > 0 || (S.rondaActual || 0) > 0 ||
     ((S.ganadoresRonda || []).length > 0)));

  // Solo se pregunta si hay algo que perder: salir de una mesa recién
  // repartida no merece un cartel.
  if (enOnline || enPartida) {
    const msg = enOnline
      ? "Si te vas, tu rival gana por abandono. ¿Salir igual?"
      : "Vas a perder esta partida. ¿Volver al menú?";
    if (typeof confirm === "function" && !confirm(msg)) return;
  }

  // Cerrar el ☰ para que no quede abierto la próxima vez que se entre a
  // la mesa (el grupo vive fuera de la pantalla, no se resetea solo).
  const grupo = document.getElementById("fab-group");
  const btn = document.getElementById("fab-menu-btn");
  if (grupo) grupo.classList.remove("fab-abierto");
  if (btn) { btn.setAttribute("aria-expanded", "false"); btn.textContent = "☰"; }

  // Misma secuencia de limpieza que usa el deeplink cuando entrás a otra
  // mesa con una partida en curso (src/online/deeplink.js).
  try { if (enOnline && typeof netDesconectar === "function") netDesconectar(); } catch (e) {}
  // La mesa autoritativa tiene además su propio estado de sala (el código,
  // el asiento, el token de reconexión): sin esto, volver a entrar creía
  // que seguías sentado en la mesa anterior.
  try {
    if (typeof A1MESA !== "undefined" && A1MESA.abierta) {
      if (typeof auto1v1Reset === "function") auto1v1Reset();
      if (typeof auto1v1MesaCerrar === "function") auto1v1MesaCerrar();
    }
  } catch (e) {}
  try { if (typeof _onlineResetEstadoPartida === "function") _onlineResetEstadoPartida(); } catch (e) {}
  try { if (typeof _2v2FinOcultar === "function") _2v2FinOcultar(); } catch (e) {}
  if (typeof O2 !== "undefined" && O2) O2.activa = false;

  if (typeof irA === "function") irA("main-menu");
}
window.mesaSalirAlMenu = mesaSalirAlMenu;
