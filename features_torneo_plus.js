/**
 * features_torneo_plus.js
 * FEATURE 1: Bracket visual del torneo (Copa Rápida 8 equipos)
 * FEATURE 2: Animación de barrida de mesa al terminar cada mano
 *
 * DOM real confirmado:
 *  - Cartas mesa: .played-card-wrap > .card.played(.j-played/.r-played)
 *  - Filas:  #played-row-rival, #played-row-jugador (o fallback #played-row)
 *  - Overlay fin de mano: #resultado-overlay (clase "show" cuando aparece)
 *  - Eventos: onJuego('finDePartido', cb), onJuego('render', cb)
 *  - Estado: window.S.ganadoresRonda[], window.addPesos(), window.getPesos()
 */
(function () {
  'use strict';

  /* =========================================================
     EQUIPOS
     ========================================================= */
  var EQUIPOS_TORNEO = [
    { id: 'boca',          nombre: 'Boca Juniors',   emoji: '💛', color: '#003087' },
    { id: 'river',         nombre: 'River Plate',    emoji: '❤️', color: '#CC0000' },
    { id: 'racing',        nombre: 'Racing Club',    emoji: '💙', color: '#87CEEB' },
    { id: 'independiente', nombre: 'Independiente',  emoji: '❤️', color: '#CC0000' },
    { id: 'san-lorenzo',   nombre: 'San Lorenzo',    emoji: '💙', color: '#003087' },
    { id: 'huracan',       nombre: 'Huracán',        emoji: '🔵', color: '#0055A5' },
    { id: 'belgrano',      nombre: 'Belgrano',       emoji: '💙', color: '#003DA5' },
    { id: 'talleres',      nombre: 'Talleres',       emoji: '🔵', color: '#003DA5' },
  ];

  var PREMIOS = { 0: 100, 1: 200, 2: 400, campeon: 800 };

  /* =========================================================
     ESTADO TORNEO
     ========================================================= */
  var torneoState = {
    activo:          false,
    ronda:           0,      // 0=cuartos, 1=semis, 2=final
    bracket:         [],     // 8 slots: { equipo, ganador, esJugador }
    partidosPorRonda: [],    // [[par0, par1], [par0], [par0]] pares de índices
    rivalActual:     null,
    posJugador:      0,
    victorias:       0,
    eliminado:       false,
  };

  /* =========================================================
     UTILIDADES
     ========================================================= */
  function _shuffle(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  function _equipoJugador() {
    // Equipo del jugador (si features_progression existe lo usa, sino Boca por default)
    var id = null;
    try {
      var perfil = JSON.parse(localStorage.getItem('fp_perfil') || '{}');
      if (perfil.equipoId) id = perfil.equipoId;
    } catch (e) {}
    return EQUIPOS_TORNEO.find(function (e) { return e.id === id; }) || EQUIPOS_TORNEO[0];
  }

  function _toast(msg, dur) {
    if (typeof showToast === 'function') showToast(msg, dur || 2200);
  }

  /* =========================================================
     INICIALIZAR BRACKET
     ========================================================= */
  function _initBracket() {
    var jugadorEq = _equipoJugador();
    // Elegir 7 rivales distintos al jugador
    var rivales = _shuffle(EQUIPOS_TORNEO.filter(function (e) { return e.id !== jugadorEq.id; })).slice(0, 7);
    var todos = _shuffle([jugadorEq].concat(rivales)); // mezclar posiciones

    torneoState.bracket = todos.map(function (eq) {
      return { equipo: eq, ganador: null, esJugador: eq.id === jugadorEq.id };
    });
    torneoState.ronda      = 0;
    torneoState.victorias  = 0;
    torneoState.eliminado  = false;
    torneoState.posJugador = torneoState.bracket.findIndex(function (s) { return s.esJugador; });

    // Generar pares de cuartos: 0v1, 2v3, 4v5, 6v7
    torneoState.partidosPorRonda = [
      [[0,1],[2,3],[4,5],[6,7]],
      [], // se generan después
      [],
    ];

    // Encontrar qué par le toca al jugador en cuartos
    var posJ = torneoState.posJugador;
    var parIdx = Math.floor(posJ / 2);
    var rivalPos = (posJ % 2 === 0) ? posJ + 1 : posJ - 1;
    torneoState.rivalActual = torneoState.bracket[rivalPos].equipo;
  }

  /* =========================================================
     SIMULAR RESULTADO IA vs IA
     ========================================================= */
  function _simularPartido() {
    return Math.random() < 0.5 ? 0 : 1; // 0 = primer equipo gana, 1 = segundo gana
  }

  /* =========================================================
     AVANZAR RONDA (para el jugador y simular el resto)
     ========================================================= */
  function _resolverRondaIA(ronda) {
    // Marcar ganadores de todos los pares donde el jugador NO participa
    var pares = torneoState.partidosPorRonda[ronda];
    var posJ  = torneoState.posJugador;

    pares.forEach(function (par) {
      var idxA = par[0], idxB = par[1];
      // El par del jugador ya fue resuelto por la partida real
      if (idxA === posJ || idxB === posJ) return;
      if (torneoState.bracket[idxA].ganador !== null) return; // ya resuelto
      var ganadorEnPar = _simularPartido();
      var ganadorIdx = ganadorEnPar === 0 ? idxA : idxB;
      var perdedorIdx = ganadorEnPar === 0 ? idxB : idxA;
      torneoState.bracket[ganadorIdx].ganador  = 'ganador';
      torneoState.bracket[perdedorIdx].ganador = 'perdedor';
    });
  }

  function _armarSiguienteRonda(ronda) {
    // Construir pares de la siguiente ronda a partir de los ganadores de la actual
    var pares    = torneoState.partidosPorRonda[ronda];
    var nuevos   = [];
    var ganadores = [];

    pares.forEach(function (par) {
      var idxA = par[0], idxB = par[1];
      var gA   = torneoState.bracket[idxA].ganador === 'ganador';
      var gB   = torneoState.bracket[idxB].ganador === 'ganador';
      if (gA) ganadores.push(idxA);
      else if (gB) ganadores.push(idxB);
      // Si el jugador participó y ganó su slot ya tiene 'ganador'
    });

    // Pares de la nueva ronda
    for (var i = 0; i < ganadores.length; i += 2) {
      if (ganadores[i + 1] !== undefined) {
        nuevos.push([ganadores[i], ganadores[i + 1]]);
      }
    }
    torneoState.partidosPorRonda[ronda + 1] = nuevos;

    // Actualizar rival del jugador en la nueva ronda
    var posJ = torneoState.posJugador;
    var parJugador = nuevos.find(function (p) { return p[0] === posJ || p[1] === posJ; });
    if (parJugador) {
      var rivalPos = parJugador[0] === posJ ? parJugador[1] : parJugador[0];
      torneoState.rivalActual = torneoState.bracket[rivalPos].equipo;
    }
  }

  /* =========================================================
     HOOK: fin de partido
     ========================================================= */
  function _onFinDePartido(data) {
    if (!torneoState.activo) return;

    var ganoJugador = data && data.puntosJugador >= data.limite;
    var posJ = torneoState.posJugador;

    // Marcar resultado del jugador en su par
    var pares = torneoState.partidosPorRonda[torneoState.ronda];
    var parJ  = pares.find(function (p) { return p[0] === posJ || p[1] === posJ; });
    if (!parJ) return;

    var rivalPos = parJ[0] === posJ ? parJ[1] : parJ[0];

    if (ganoJugador) {
      torneoState.bracket[posJ].ganador    = 'ganador';
      torneoState.bracket[rivalPos].ganador = 'perdedor';
      torneoState.victorias++;
    } else {
      torneoState.bracket[posJ].ganador    = 'perdedor';
      torneoState.bracket[rivalPos].ganador = 'ganador';
      torneoState.eliminado = true;
    }

    // Simular los otros partidos de esta ronda
    _resolverRondaIA(torneoState.ronda);

    // Otorgar premio parcial por ronda alcanzada
    var premio = PREMIOS[torneoState.ronda] || 0;
    if (ganoJugador && premio && typeof window.addPesos === 'function') {
      window.addPesos(premio, 'Copa Rápida - ' + _nombreRonda(torneoState.ronda));
    }

    // Re-renderizar bracket
    _renderBracket();

    var rondaActual = torneoState.ronda;

    if (!ganoJugador) {
      // Jugador eliminado
      setTimeout(function () {
        _mostrarResultadoRonda(false, rondaActual);
      }, 600);
      return;
    }

    if (rondaActual === 2) {
      // Ganó la final = CAMPEÓN
      if (typeof window.addPesos === 'function') {
        window.addPesos(PREMIOS.campeon, 'Copa Rápida - ¡CAMPEÓN!');
      }
      setTimeout(function () { _mostrarCampeon(); }, 800);
      torneoState.activo = false;
      return;
    }

    // Preparar siguiente ronda
    _armarSiguienteRonda(rondaActual);
    torneoState.ronda++;

    setTimeout(function () {
      _mostrarResultadoRonda(true, rondaActual);
    }, 600);
  }

  function _nombreRonda(ronda) {
    return ['Cuartos', 'Semis', 'Final'][ronda] || 'Ronda';
  }

  /* =========================================================
     OVERLAY RESULTADO DE RONDA
     ========================================================= */
  function _mostrarResultadoRonda(gano, ronda) {
    var overlay = document.getElementById('tp-resultado-ronda');
    if (!overlay) return;

    var mensajes = {
      gano: [
        { icono: '⚽', titulo: '¡A LAS SEMIS!',   sub: 'Pasaste a Semifinales' },
        { icono: '🔥', titulo: '¡A LA FINAL!',    sub: 'Llegaste a la Final' },
      ],
      perdio: { icono: '😔', titulo: 'ELIMINADO', sub: 'El torneo sigue sin vos...' },
    };

    var iconoEl  = document.getElementById('tp-resultado-icono');
    var tituloEl = document.getElementById('tp-resultado-titulo');
    var subEl    = document.getElementById('tp-resultado-sub');
    var ptsEl    = document.getElementById('tp-resultado-pts');

    if (!iconoEl || !tituloEl || !subEl || !ptsEl) return;

    if (gano && ronda < 2) {
      var info = mensajes.gano[ronda] || mensajes.gano[0];
      iconoEl.textContent  = info.icono;
      tituloEl.textContent = info.titulo;
      subEl.textContent    = info.sub;
      var pts = PREMIOS[ronda] || 0;
      ptsEl.textContent = pts ? '+' + fmtPT(pts) : '';
    } else if (!gano) {
      iconoEl.textContent  = mensajes.perdio.icono;
      tituloEl.textContent = mensajes.perdio.titulo;
      subEl.textContent    = mensajes.perdio.sub;
      ptsEl.textContent    = '';
    }

    overlay.classList.add('show');
  }

  function _cerrarResultadoRonda() {
    var overlay = document.getElementById('tp-resultado-ronda');
    if (overlay) overlay.classList.remove('show');
  }

  /* =========================================================
     OVERLAY CAMPEÓN
     ========================================================= */
  function _mostrarCampeon() {
    var overlay = document.getElementById('tp-campeon-overlay');
    if (!overlay) return;

    var jugEq = _equipoJugador();
    var subEl = document.getElementById('tp-campeon-sub');
    var ptsEl = document.getElementById('tp-campeon-pts');
    if (subEl) subEl.textContent = jugEq.emoji + ' ' + jugEq.nombre + ' — ¡Campeón de la Copa!';
    if (ptsEl) ptsEl.textContent = '+' + (PREMIOS[0] + PREMIOS[1] + PREMIOS[2] + PREMIOS.campeon) + ' PT total';

    overlay.classList.add('show');
    if (typeof window.desbloquearLogro === 'function') {
      try { window.desbloquearLogro('campeon_copa_rapida'); } catch(e) {}
    }
  }

  /* =========================================================
     RENDER BRACKET
     ========================================================= */
  function _renderBracket() {
    var grid = document.getElementById('tp-bracket-grid');
    if (!grid) return;
    grid.innerHTML = '';

    // Columna cuartos
    grid.appendChild(_crearColumnaRonda('CUARTOS', _slotsParaRonda(0)));

    // Conector 1
    grid.appendChild(_crearConector('tp-conn-cuartos-semis'));

    // Columna semis (ganadores de cuartos)
    grid.appendChild(_crearColumnaRonda('SEMIFINAL', _slotsGanadores(0, 4)));

    // Conector 2
    grid.appendChild(_crearConector('tp-conn-semis-final'));

    // Columna final (campeón)
    grid.appendChild(_crearColumnaCampeon());
  }

  function _slotsParaRonda(ronda) {
    // Devuelve los 8 (cuartos) o 4 (semis) slots según la ronda
    if (ronda === 0) return torneoState.bracket.slice(0, 8);
    return [];
  }

  function _slotsGanadores(rondaOrigen, total) {
    // Slots de los ganadores de rondaOrigen
    var pares   = torneoState.partidosPorRonda[rondaOrigen] || [];
    var slots   = [];
    pares.forEach(function (par) {
      var gA = torneoState.bracket[par[0]];
      var gB = torneoState.bracket[par[1]];
      if (gA && gA.ganador === 'ganador') slots.push(gA);
      else if (gB && gB.ganador === 'ganador') slots.push(gB);
      else slots.push(null); // TBD
    });
    return slots;
  }

  function _crearColumnaRonda(titulo, slots) {
    var col = document.createElement('div');
    col.className = 'tp-ronda-col';

    var h = document.createElement('div');
    h.className = 'tp-ronda-header';
    h.textContent = titulo;
    col.appendChild(h);

    var wrap = document.createElement('div');
    wrap.className = 'tp-ronda-slots';

    slots.forEach(function (slot) {
      wrap.appendChild(_crearSlotEl(slot));
    });
    col.appendChild(wrap);
    return col;
  }

  function _crearSlotEl(slot) {
    var div = document.createElement('div');
    div.className = 'tp-slot';

    if (!slot) {
      div.classList.add('tp-slot-tbd');
      div.innerHTML = '<span class="tp-slot-emoji">❓</span><span class="tp-slot-nombre">Por definir</span>';
      return div;
    }

    if (slot.esJugador) div.classList.add('tp-slot-jugador');
    if (slot.ganador === 'ganador')  div.classList.add('tp-slot-ganador');
    if (slot.ganador === 'perdedor') div.classList.add('tp-slot-perdedor');

    var emoji = document.createElement('span');
    emoji.className = 'tp-slot-emoji';
    emoji.textContent = slot.equipo.emoji;

    var nombre = document.createElement('span');
    nombre.className = 'tp-slot-nombre';
    nombre.textContent = slot.equipo.nombre;

    var badge = document.createElement('span');
    badge.className = 'tp-slot-badge';
    if (slot.esJugador) {
      badge.textContent = 'VOS';
      badge.classList.add('badge-vos');
    } else if (slot.ganador === 'ganador') {
      badge.textContent = '✓';
      badge.classList.add('badge-champ');
    } else {
      badge.textContent = 'IA';
      badge.classList.add('badge-ia');
    }

    div.appendChild(emoji);
    div.appendChild(nombre);
    div.appendChild(badge);
    return div;
  }

  function _crearConector(id) {
    var col = document.createElement('div');
    col.className = 'tp-connector-col';

    var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 24 280');
    svg.setAttribute('preserveAspectRatio', 'none');
    svg.id = id;

    // Líneas de conexión (simples verticales en la mitad)
    var line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', '12'); line.setAttribute('y1', '0');
    line.setAttribute('x2', '12'); line.setAttribute('y2', '280');
    line.className.baseVal = 'tp-conn-line';

    // Si hay victorias en la ronda relevante, iluminar
    if (torneoState.victorias > 0) {
      var pares0 = torneoState.partidosPorRonda[0] || [];
      if (id === 'tp-conn-cuartos-semis' && torneoState.victorias >= 1) {
        line.className.baseVal = 'tp-conn-line active';
      }
      if (id === 'tp-conn-semis-final' && torneoState.victorias >= 2) {
        line.className.baseVal = 'tp-conn-line active';
      }
    }

    svg.appendChild(line);
    col.appendChild(svg);
    return col;
  }

  function _crearColumnaCampeon() {
    var col = document.createElement('div');
    col.className = 'tp-ronda-col';

    var h = document.createElement('div');
    h.className = 'tp-ronda-header';
    h.textContent = 'CAMPEÓN';
    col.appendChild(h);

    var wrap = document.createElement('div');
    wrap.className = 'tp-ronda-slots';
    wrap.style.justifyContent = 'center';
    wrap.style.flex = '1';
    wrap.style.display = 'flex';
    wrap.style.flexDirection = 'column';
    wrap.style.alignItems = 'center';

    var campDiv = document.createElement('div');
    campDiv.className = 'tp-slot-campeon';

    // ¿Hay campeón?
    var finalPares = torneoState.partidosPorRonda[2] || [];
    var campeonSlot = null;
    finalPares.forEach(function (par) {
      var sA = torneoState.bracket[par[0]];
      var sB = torneoState.bracket[par[1]];
      if (sA && sA.ganador === 'ganador') campeonSlot = sA;
      else if (sB && sB.ganador === 'ganador') campeonSlot = sB;
    });

    var trofeo = document.createElement('div');
    trofeo.className = 'tp-campeon-trofeo';
    trofeo.textContent = '🏆';
    campDiv.appendChild(trofeo);

    var label = document.createElement('div');
    label.className = 'tp-campeon-label';
    label.textContent = campeonSlot ? campeonSlot.equipo.nombre : '???';
    campDiv.appendChild(label);

    if (campeonSlot) {
      var nombre = document.createElement('div');
      nombre.className = 'tp-campeon-nombre';
      nombre.textContent = campeonSlot.equipo.emoji + ' ' + campeonSlot.equipo.nombre;
      campDiv.appendChild(nombre);
    }

    wrap.appendChild(campDiv);
    col.appendChild(wrap);
    return col;
  }

  /* =========================================================
     CONSTRUIR DOM DEL MODAL
     ========================================================= */
  function _crearModal() {
    if (document.getElementById('tp-bracket-modal')) return;

    // Modal bracket
    var modal = document.createElement('div');
    modal.id = 'tp-bracket-modal';
    modal.innerHTML =
      '<div id="tp-bracket-box">' +
        '<button id="tp-bracket-close" title="Cerrar">✕</button>' +
        '<div id="tp-bracket-titulo">🏆 COPA RÁPIDA</div>' +
        '<div id="tp-bracket-subtitulo">Torneo de 8 equipos · Eliminación directa</div>' +
        '<div id="tp-bracket-grid"></div>' +
        '<div id="tp-premios-bar">' +
          '<div class="tp-premio-item"><div class="tp-premio-ronda">Cuartos</div><div class="tp-premio-pts">+100 PT</div></div>' +
          '<div class="tp-premio-item"><div class="tp-premio-ronda">Semis</div><div class="tp-premio-pts">+200 PT</div></div>' +
          '<div class="tp-premio-item"><div class="tp-premio-ronda">Final</div><div class="tp-premio-pts">+400 PT</div></div>' +
          '<div class="tp-premio-item"><div class="tp-premio-ronda">Campeón</div><div class="tp-premio-pts">+800 PT</div></div>' +
        '</div>' +
        '<div id="tp-bracket-actions">' +
          '<button class="tp-btn tp-btn-primary" id="tp-btn-jugar">▶ JUGAR MI PARTIDO</button>' +
          '<button class="tp-btn tp-btn-secondary" id="tp-btn-nuevo">↺ Nuevo torneo</button>' +
          '<button class="tp-btn tp-btn-secondary" id="tp-btn-cerrar-bracket">✕ Cerrar</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(modal);

    // Overlay resultado de ronda
    var resOverlay = document.createElement('div');
    resOverlay.id = 'tp-resultado-ronda';
    resOverlay.innerHTML =
      '<div id="tp-resultado-card">' +
        '<span id="tp-resultado-icono">⚽</span>' +
        '<div id="tp-resultado-titulo">¡A LAS SEMIS!</div>' +
        '<div id="tp-resultado-sub">Pasaste a Semifinales</div>' +
        '<div id="tp-resultado-pts"></div>' +
        '<button class="tp-resultado-btn" id="tp-btn-cerrar-resultado">CONTINUAR</button>' +
      '</div>';
    document.body.appendChild(resOverlay);

    // Overlay campeón
    var campOverlay = document.createElement('div');
    campOverlay.id = 'tp-campeon-overlay';
    campOverlay.innerHTML =
      '<div id="tp-campeon-trofeo-big">🏆</div>' +
      '<div id="tp-campeon-titulo">¡CAMPEÓN!</div>' +
      '<div id="tp-campeon-sub"></div>' +
      '<div id="tp-campeon-pts"></div>' +
      '<button id="tp-campeon-cerrar">¡CELEBRAR!</button>';
    document.body.appendChild(campOverlay);

    // Eventos
    document.getElementById('tp-bracket-close').onclick    = _cerrarBracket;
    document.getElementById('tp-btn-cerrar-bracket').onclick = _cerrarBracket;
    document.getElementById('tp-btn-nuevo').onclick          = function () { _initBracket(); _renderBracket(); _actualizarBotonesModal(); };
    document.getElementById('tp-btn-jugar').onclick          = _jugarPartido;
    document.getElementById('tp-btn-cerrar-resultado').onclick = function () {
      _cerrarResultadoRonda();
      if (!torneoState.eliminado && torneoState.activo) {
        _actualizarBotonesModal();
      }
    };
    document.getElementById('tp-campeon-cerrar').onclick = function () {
      document.getElementById('tp-campeon-overlay').classList.remove('show');
      _cerrarBracket();
    };

    // Cerrar al click fuera
    modal.addEventListener('click', function (e) {
      if (e.target === modal) _cerrarBracket();
    });
  }

  function _actualizarBotonesModal() {
    var btnJugar  = document.getElementById('tp-btn-jugar');
    var btnNuevo  = document.getElementById('tp-btn-nuevo');
    if (!btnJugar || !btnNuevo) return;

    if (!torneoState.activo) {
      btnJugar.textContent = '▶ INICIAR COPA';
      btnJugar.style.display = '';
    } else if (torneoState.eliminado) {
      btnJugar.style.display = 'none';
    } else {
      var rival = torneoState.rivalActual;
      var txt   = rival ? '▶ JUGAR vs ' + rival.nombre.toUpperCase() : '▶ JUGAR MI PARTIDO';
      btnJugar.textContent = txt;
      btnJugar.style.display = '';
    }
  }

  /* =========================================================
     ABRIR / CERRAR
     ========================================================= */
  function abrirBracketTorneo() {
    _crearModal();
    if (!torneoState.activo) {
      _initBracket();
    }
    _renderBracket();
    _actualizarBotonesModal();
    document.getElementById('tp-bracket-modal').classList.add('open');
  }

  function _cerrarBracket() {
    var modal = document.getElementById('tp-bracket-modal');
    if (modal) modal.classList.remove('open');
  }

  /* =========================================================
     JUGAR PARTIDO
     ========================================================= */
  function _jugarPartido() {
    if (!torneoState.activo) {
      torneoState.activo = true;
      _initBracket();
      _renderBracket();
    }
    if (torneoState.eliminado) return;

    // Cerrar modal y arrancar partido
    _cerrarBracket();

    var rival = torneoState.rivalActual;
    _toast('⚽ Copa Rápida · ' + _nombreRonda(torneoState.ronda) + ' vs ' + (rival ? rival.nombre : 'Rival'), 2500);

    setTimeout(function () {
      if (typeof reiniciarPartida === 'function') {
        reiniciarPartida();
      } else {
        _toast('⚠️ Iniciá una partida desde el menú', 2500);
      }
    }, 400);
  }

  /* =========================================================
     SETUP BRACKET TORNEO
     ========================================================= */
  function setupBracketTorneo() {
    // Inyectar botón en menú principal
    setTimeout(function () {
      // Insertar después del botón de torneo rápido si existe, o del online
      var torneoBtn = document.querySelector('.mm-btn-torneo');
      var onlineBtn = document.querySelector('.mm-btn.mm-acc-online');
      var ref       = torneoBtn || onlineBtn;
      if (!ref) return;

      var btn = document.createElement('button');
      btn.className = 'mm-btn mm-btn-secondary mm-btn-copa-rapida';
      btn.innerHTML =
        '<span class="mm-btn-icon">🏆</span>' +
        '<span class="mm-btn-text"><strong>COPA RÁPIDA</strong><small>Bracket de 8 equipos · Eliminación</small></span>';
      btn.onclick = abrirBracketTorneo;

      if (torneoBtn && torneoBtn.nextSibling) {
        torneoBtn.parentNode.insertBefore(btn, torneoBtn.nextSibling);
      } else if (ref) {
        ref.parentNode.insertBefore(btn, ref);
      }
    }, 500);

    // Suscribir al fin de partido para actualizar bracket
    if (typeof onJuego === 'function') {
      onJuego('finDePartido', function (data) {
        try { _onFinDePartido(data); } catch (e) { console.warn('[tp] finDePartido:', e); }
      });
    }
  }

  /* =========================================================
     FEATURE 2: ANIMACIÓN DE BARRIDA DE MESA
     ========================================================= */
  function setupAnimacionBarrida() {
    var _barriendo = false;

    // Observar el overlay de resultado de mano (#resultado-overlay)
    var overlay = document.getElementById('resultado-overlay');

    if (!overlay) {
      // Si el overlay no existe todavía, intentar con MutationObserver en body
      var bodyObs = new MutationObserver(function (muts) {
        muts.forEach(function (m) {
          m.addedNodes.forEach(function (n) {
            if (n.id === 'resultado-overlay') {
              bodyObs.disconnect();
              _observarOverlay(n);
            }
          });
        });
        // También revisar si ya existe
        var ov = document.getElementById('resultado-overlay');
        if (ov) { bodyObs.disconnect(); _observarOverlay(ov); }
      });
      bodyObs.observe(document.body, { childList: true, subtree: true });
      return;
    }

    _observarOverlay(overlay);

    function _observarOverlay(ov) {
      var obs = new MutationObserver(function (muts) {
        muts.forEach(function (m) {
          if (m.type !== 'attributes' || m.attributeName !== 'class') return;
          var tieneShow = ov.classList.contains('show');
          if (tieneShow && !_barriendo) {
            _barriendo = true;
            _dispararBarrida();
            setTimeout(function () { _barriendo = false; }, 800);
          }
        });
      });
      obs.observe(ov, { attributes: true });
    }

    function _dispararBarrida() {
      // Leer estado del juego para saber quién ganó la última ronda
      var ganador = null;
      try {
        var S = window.S;
        if (S && S.ganadoresRonda && S.ganadoresRonda.length > 0) {
          ganador = S.ganadoresRonda[S.ganadoresRonda.length - 1];
        }
      } catch (e) {}

      // Si no podemos leer el estado, igual animamos (dirección neutral)
      var direccion = 'der'; // jugador ganó → cartas van a la derecha (a él)
      if (ganador === 'rival') direccion = 'izq';
      else if (ganador === 'parda') return; // parda: sin barrida

      _barrerCartas(direccion);

      // Sonido suave si está disponible
      try {
        if (typeof window.playSound === 'function') window.playSound('barrida');
      } catch (e) {}
    }

    function _barrerCartas(direccion) {
      // Buscar cartas en la mesa (estructura nueva: #played-row-rival + #played-row-jugador)
      // Clase del wrapper: played-card-wrap
      var cartas = Array.from(document.querySelectorAll(
        '#played-row-rival .played-card-wrap, #played-row-jugador .played-card-wrap, #played-row .played-card-wrap'
      ));

      if (cartas.length === 0) return;

      var claseAnim = direccion === 'izq' ? 'tp-barrer-izq' : 'tp-barrer-der';

      cartas.forEach(function (c, i) {
        // Stagger leve
        setTimeout(function () {
          c.style.animationDelay = '0ms';
          c.classList.add(claseAnim);
        }, i * 55);
      });
    }
  }

  /* =========================================================
     INIT
     ========================================================= */
  function init() {
    try { setupBracketTorneo(); }     catch (e) { console.warn('[tp] bracket:', e); }
    try { setupAnimacionBarrida(); }  catch (e) { console.warn('[tp] barrida:', e); }
  }

  window.addEventListener('load', function () { setTimeout(init, 900); });
  window.abrirBracketTorneo = abrirBracketTorneo;

})();
