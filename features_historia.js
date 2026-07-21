// ══════════════════════════════════════════════════════════════
// features_historia.js  — Truco GOL
// Feature 1: Modo Historia (10 capítulos narrativos)
// Feature 2: Misiones Semanales
// Feature 3: Logros Expandidos
// Feature 4: Jugadores Extra en Fichajes
// ══════════════════════════════════════════════════════════════
(function () {
  'use strict';

  // lsGet/lsPut/lsGetJSON/lsPutJSON viven en features_storage.js (compartidos).

  // ════════════════════════════════════════════════
  // FEATURE 1: MODO HISTORIA
  // ════════════════════════════════════════════════

  var HISTORIA_CAPITULOS = [
    {
      id: 1,
      titulo: 'El Comienzo',
      subtitulo: 'Barrio de Flores, Buenos Aires',
      narrativa_pre: 'Sos el nuevo DT del club del barrio. Tu primer rival es el equipo del almacenero. Todo el barrio te mira.',
      narrativa_post_victoria: '¡Primera victoria! El barrio entero festeja. El presidente del club te llama.',
      narrativa_post_derrota: 'Perdiste el primer partido. El almacenero te dedica una sonrisa. Hay revancha.',
      rival_nombre: 'El Almacenero',
      rival_emoji: '🏪',
      rival_equipo: 'atlanta',
      dificultad: 'facil',
      recompensa: { pesos: 100, titulo: 'DT Debutante' }
    },
    {
      id: 2,
      titulo: 'La Prueba de Fuego',
      subtitulo: 'Torneo Clausura — Fecha 3',
      narrativa_pre: 'El DT rival tiene 20 años de experiencia. Dice que sos "un pibito sin futuro". Demostralo.',
      narrativa_post_victoria: '¡Le ganaste al veterano! La prensa local te menciona por primera vez.',
      narrativa_post_derrota: 'El veterano tenía razón esta vez. Pero aprendiste. La revancha llega.',
      rival_nombre: 'El Veterano',
      rival_emoji: '👴',
      rival_equipo: 'huracan',
      dificultad: 'normal',
      recompensa: { pesos: 150, titulo: 'Promesa del Truco' }
    },
    {
      id: 3,
      titulo: 'El Clásico del Barrio',
      subtitulo: 'Derby Local — Partido Especial',
      narrativa_pre: 'El peor rival: el club de la cuadra de enfrente. 50 años de historia entre ambos. Esta noche se define quién es el dueño del barrio.',
      narrativa_post_victoria: '¡CAMPEÓN DEL BARRIO! La murga sale a la calle. Sos una leyenda local.',
      narrativa_post_derrota: 'El barrio rival festeja en tu cara. Habrá que esperar un año para la revancha.',
      rival_nombre: 'El Clásico Rival',
      rival_emoji: '⚔️',
      rival_equipo: 'san-lorenzo',
      dificultad: 'normal',
      recompensa: { pesos: 200, titulo: 'Rey del Barrio' }
    },
    {
      id: 4,
      titulo: 'Primera Nacional',
      subtitulo: 'Ascenso a Primera División',
      narrativa_pre: 'Conseguiste el ascenso. Ahora jugás contra equipos de primera. El nivel subió. ¿Estás listo?',
      narrativa_post_victoria: 'Primera victoria en Primera. El estadio te ovaciona. Llegaste.',
      narrativa_post_derrota: 'Primera derrota en Primera. Es normal. Acá se juega diferente.',
      rival_nombre: 'El Capitán',
      rival_emoji: '🎖️',
      rival_equipo: 'independiente',
      dificultad: 'normal',
      recompensa: { pesos: 250, titulo: 'DT de Primera' }
    },
    {
      id: 5,
      titulo: 'El Grande',
      subtitulo: 'Superclásico',
      narrativa_pre: 'Te tocó el Superclásico. Boca vs River. El partido más visto del mundo. 80.000 personas en el Monumental. Respirá hondo.',
      narrativa_post_victoria: '¡GANASTE EL SUPERCLÁSICO! Tu nombre ya es historia del fútbol argentino.',
      narrativa_post_derrota: 'El Superclásico se perdió. El hincha no te lo perdonará fácil. Pero hay revancha.',
      rival_nombre: 'El Superclásico',
      rival_emoji: '🔥',
      rival_equipo: 'river',
      dificultad: 'dificil',
      recompensa: { pesos: 400, titulo: 'Héroe del Superclásico', logro: 'superclasico' },
      efecto: 'superclasico'
    },
    {
      id: 6,
      titulo: 'Copa Argentina',
      subtitulo: 'Cuartos de Final',
      narrativa_pre: 'Llegaste a la Copa Argentina. Queda solo un paso para la final nacional.',
      narrativa_post_victoria: '¡A la semifinal! El país empieza a conocer tu nombre.',
      narrativa_post_derrota: 'La Copa se fue. Pero la Liga sigue abierta.',
      rival_nombre: 'El Nacional',
      rival_emoji: '🇦🇷',
      rival_equipo: 'racing',
      dificultad: 'dificil',
      recompensa: { pesos: 300, titulo: 'Semifinalista' }
    },
    {
      id: 7,
      titulo: 'La Libertadores',
      subtitulo: 'Fase de Grupos — Sudamérica te espera',
      narrativa_pre: 'Primera vez en la Copa Libertadores. Viajás a Brasil a enfrentar al campeón fluminense. El truco se juega igual en todos lados.',
      narrativa_post_victoria: '¡Primera victoria sudamericana! El continente entero te vio ganar.',
      narrativa_post_derrota: 'Brasil ganó este round. Pero quedan más fechas en el grupo.',
      rival_nombre: 'O Campeão Brasileiro',
      rival_emoji: '🇧🇷',
      rival_equipo: 'fluminense',
      dificultad: 'dificil',
      recompensa: { pesos: 500, titulo: 'Conquistador' }
    },
    {
      id: 8,
      titulo: 'Semifinal Continental',
      subtitulo: 'Copa Libertadores — Todo o Nada',
      narrativa_pre: 'Semifinal. Dos equipos. Un boleto a la final. Toda América mirando.',
      narrativa_post_victoria: '¡FINAL DE LA LIBERTADORES! Llorás en el vestuario. Lo lograste.',
      narrativa_post_derrota: 'A un paso de la gloria. La derrota duele, pero volvés más fuerte.',
      rival_nombre: 'El Semidios',
      rival_emoji: '⚡',
      rival_equipo: 'boca',
      dificultad: 'dificil',
      recompensa: { pesos: 600, titulo: 'Finalista Continental' }
    },
    {
      id: 9,
      titulo: 'La Gran Final',
      subtitulo: 'Final de la Copa Libertadores — Estadio Monumental',
      narrativa_pre: 'La final de la Libertadores. El partido más importante de tu vida. 84.000 personas. Cámaras de todo el mundo. Hora de la verdad.',
      narrativa_post_victoria: '¡¡¡CAMPEÓN DE SUDAMÉRICA!!! El trofeo en tus manos. Las lágrimas no paran. Sos eterno.',
      narrativa_post_derrota: 'Subcampeón de Sudamérica. Perdiste la final, pero ganaste el corazón de todos.',
      rival_nombre: 'El Campeón del Mundo',
      rival_emoji: '🌍',
      rival_equipo: 'flamengo',
      dificultad: 'dificil',
      recompensa: { pesos: 1000, titulo: 'Campeón Sudamericano', logro: 'campeon_libertadores' },
      efecto: 'final'
    },
    {
      id: 10,
      titulo: 'El Último Desafío',
      subtitulo: 'Mundial de Clubes — El Mejor del Mundo',
      narrativa_pre: 'Llegaste a lo más alto. El Mundial de Clubes. Tu rival: el campeón de Europa. El mejor del mundo contra vos. Demostrá que el truco argentino no tiene igual.',
      narrativa_post_victoria: '¡¡¡CAMPEÓN DEL MUNDO!!! Escribiste tu nombre en la historia del fútbol y del truco para siempre. LEYENDA.',
      narrativa_post_derrota: 'Europa ganó esta vez. Pero fuiste el mejor de América. Eso nadie te lo quita.',
      rival_nombre: 'El Campeón Europeo',
      rival_emoji: '👑',
      rival_equipo: 'real-madrid',
      dificultad: 'dificil',
      recompensa: { pesos: 2000, titulo: 'Campeón del Mundo', logro: 'campeon_mundo' },
      efecto: 'mundial'
    }
  ];

  // Estado persistente del modo historia
  var _historiaState = lsGetJSON('tg_historia', { capituloActual: 1, completados: [], victorias: [] });
  var _historiaActiva = false;   // true mientras el jugador está en un capítulo
  var _capituloEnJuego = null;   // referencia al capítulo actual

  function _guardarHistoria() {
    lsPutJSON('tg_historia', _historiaState);
  }

  // ── Crear overlays en el DOM ──────────────────────────────────

  function _crearOverlays() {
    // Modal de lista de capítulos
    if (!document.getElementById('hist-menu-modal')) {
      var m = document.createElement('div');
      m.id = 'hist-menu-modal';
      m.innerHTML = '<div class="hist-modal-box">' +
        '<div class="hist-modal-header">' +
          '<div>' +
            '<div class="hist-modal-title">📖 MODO HISTORIA</div>' +
            '<div class="hist-modal-progress" id="hist-modal-prog"></div>' +
          '</div>' +
          '<button class="hist-modal-close" onclick="window._histCerrarMenu()">✕</button>' +
        '</div>' +
        '<div class="hist-capitulos-list" id="hist-capitulos-list"></div>' +
      '</div>';
      document.body.appendChild(m);
      m.addEventListener('click', function(e) { if (e.target === m) window._histCerrarMenu(); });
    }

    // Overlay narrativo (pre/post partido)
    if (!document.getElementById('hist-narrativa-overlay')) {
      var ov = document.createElement('div');
      ov.id = 'hist-narrativa-overlay';
      ov.innerHTML = '<div class="hist-narr-bg" id="hist-narr-bg"></div>' +
        '<div class="hist-narr-box">' +
          '<div class="hist-narr-cap-label" id="hist-narr-cap-label"></div>' +
          '<div class="hist-narr-titulo" id="hist-narr-titulo"></div>' +
          '<div class="hist-narr-subtitulo" id="hist-narr-subtitulo"></div>' +
          '<div class="hist-narr-escudos">' +
            '<div class="hist-narr-escudo" id="hist-narr-ico-jugador">⚽</div>' +
            '<div class="hist-narr-vs">VS</div>' +
            '<div class="hist-narr-escudo rival" id="hist-narr-ico-rival">🏆</div>' +
          '</div>' +
          '<div class="hist-narr-rival-nombre" id="hist-narr-rival-nombre"></div>' +
          '<div class="hist-narr-texto" id="hist-narr-texto"></div>' +
          '<button class="hist-narr-btn-jugar" id="hist-narr-btn-jugar"></button>' +
          '<button class="hist-narr-btn-cerrar" id="hist-narr-btn-cerrar">VOLVER AL MENÚ</button>' +
        '</div>';
      document.body.appendChild(ov);
    }

    // Overlay de recompensa (post partido)
    if (!document.getElementById('hist-recompensa-overlay')) {
      var rv = document.createElement('div');
      rv.id = 'hist-recompensa-overlay';
      rv.innerHTML = '<div class="hist-recomp-box">' +
        '<div class="hist-recomp-resultado" id="hist-recomp-resultado"></div>' +
        '<span class="hist-recomp-ico" id="hist-recomp-ico">🏆</span>' +
        '<div class="hist-recomp-narrativa" id="hist-recomp-narrativa"></div>' +
        '<div class="hist-recomp-premios" id="hist-recomp-premios"></div>' +
        '<button class="hist-recomp-btn" id="hist-recomp-btn">CONTINUAR</button>' +
      '</div>';
      document.body.appendChild(rv);
    }
  }

  // ── Render de lista de capítulos ─────────────────────────────

  function _renderListaCapitulos() {
    var lista = document.getElementById('hist-capitulos-list');
    var prog  = document.getElementById('hist-modal-prog');
    if (!lista) return;

    var completados = _historiaState.completados || [];
    var victorias   = _historiaState.victorias   || [];
    var actual      = _historiaState.capituloActual || 1;

    if (prog) {
      prog.textContent = completados.length + ' / ' + HISTORIA_CAPITULOS.length + ' completados';
    }

    lista.innerHTML = HISTORIA_CAPITULOS.map(function(cap) {
      var completado = completados.indexOf(cap.id) !== -1;
      var esActual   = cap.id === actual;
      var bloqueado  = cap.id > actual;
      var victoria   = victorias.indexOf(cap.id) !== -1;

      var estadoClass = bloqueado ? 'bloqueado' : (completado ? 'completado' : (esActual ? 'actual' : ''));
      var badge = bloqueado
        ? '<span class="hist-cap-badge hist-cap-badge-lock">🔒</span>'
        : (completado
            ? '<span class="hist-cap-badge">' + (victoria ? '✅' : '❌') + '</span>'
            : (esActual ? '<span class="hist-cap-badge">▶</span>' : ''));

      var onclick = (!bloqueado)
        ? 'onclick="window._histSeleccionarCapitulo(' + cap.id + ')"'
        : '';

      return '<div class="hist-cap-row ' + estadoClass + '" ' + onclick + '>' +
        '<div class="hist-cap-num">' + cap.id + '</div>' +
        '<div class="hist-cap-rival-ico">' + cap.rival_emoji + '</div>' +
        '<div class="hist-cap-info">' +
          '<div class="hist-cap-titulo">' + cap.titulo + '</div>' +
          '<div class="hist-cap-subtitulo">' + cap.subtitulo + '</div>' +
        '</div>' +
        badge +
      '</div>';
    }).join('');
  }

  // ── Mostrar overlay narrativo (pre-partido) ───────────────────

  function _mostrarNarrativaPre(cap) {
    var avatarJugador = '⚽';
    try { if (typeof S !== 'undefined' && S.avatarJugador) avatarJugador = S.avatarJugador; } catch(e) {}

    var bgEl       = document.getElementById('hist-narr-bg');
    var labelEl    = document.getElementById('hist-narr-cap-label');
    var tituloEl   = document.getElementById('hist-narr-titulo');
    var subEl      = document.getElementById('hist-narr-subtitulo');
    var icoJugEl   = document.getElementById('hist-narr-ico-jugador');
    var icoRivEl   = document.getElementById('hist-narr-ico-rival');
    var rivalNomEl = document.getElementById('hist-narr-rival-nombre');
    var textoEl    = document.getElementById('hist-narr-texto');
    var btnJugarEl = document.getElementById('hist-narr-btn-jugar');
    var btnCerrarEl= document.getElementById('hist-narr-btn-cerrar');

    if (bgEl)       { bgEl.className = 'hist-narr-bg' + (cap.efecto ? ' ' + cap.efecto : ''); }
    if (labelEl)    labelEl.textContent = 'CAPÍTULO ' + cap.id + ' — ' + (cap.dificultad || '').toUpperCase();
    if (tituloEl)   tituloEl.textContent = cap.titulo;
    if (subEl)      subEl.textContent = cap.subtitulo;
    if (icoJugEl)   icoJugEl.textContent = avatarJugador;
    if (icoRivEl)   icoRivEl.textContent = cap.rival_emoji;
    if (rivalNomEl) rivalNomEl.textContent = 'vs ' + cap.rival_nombre;
    if (textoEl)    textoEl.textContent = cap.narrativa_pre;

    if (btnJugarEl) {
      btnJugarEl.textContent = '¡JUGAR!';
      btnJugarEl.onclick = function() { _iniciarCapitulo(cap); };
    }
    if (btnCerrarEl) {
      btnCerrarEl.style.display = 'block';
      btnCerrarEl.onclick = function() { _ocultarNarrativa(); window._histAbrirMenu(); };
    }

    // Efectos especiales de entrada
    if (cap.efecto === 'final') _lanzarPapelPicado();
    if (cap.efecto === 'mundial') _lanzarEstrellas();

    var ov = document.getElementById('hist-narrativa-overlay');
    if (ov) ov.classList.add('show');
  }

  function _mostrarNarrativaPost(cap, victoria) {
    var bgEl       = document.getElementById('hist-narr-bg');
    var labelEl    = document.getElementById('hist-narr-cap-label');
    var tituloEl   = document.getElementById('hist-narr-titulo');
    var subEl      = document.getElementById('hist-narr-subtitulo');
    var icoJugEl   = document.getElementById('hist-narr-ico-jugador');
    var icoRivEl   = document.getElementById('hist-narr-ico-rival');
    var rivalNomEl = document.getElementById('hist-narr-rival-nombre');
    var textoEl    = document.getElementById('hist-narr-texto');
    var btnJugarEl = document.getElementById('hist-narr-btn-jugar');
    var btnCerrarEl= document.getElementById('hist-narr-btn-cerrar');

    var avatarJugador = '⚽';
    try { if (typeof S !== 'undefined' && S.avatarJugador) avatarJugador = S.avatarJugador; } catch(e) {}

    if (bgEl)       { bgEl.className = 'hist-narr-bg' + (cap.efecto ? ' ' + cap.efecto : ''); }
    if (labelEl)    labelEl.textContent = victoria ? '✅ VICTORIA' : '❌ DERROTA';
    if (tituloEl)   tituloEl.textContent = cap.titulo;
    if (subEl)      subEl.textContent = victoria ? 'Resultado: Victoria' : 'Resultado: Derrota';
    if (icoJugEl)   icoJugEl.textContent = victoria ? avatarJugador : cap.rival_emoji;
    if (icoRivEl)   icoRivEl.textContent = victoria ? cap.rival_emoji : avatarJugador;
    if (rivalNomEl) rivalNomEl.textContent = victoria ? 'Derrotaste a ' + cap.rival_nombre : 'Perdiste contra ' + cap.rival_nombre;
    if (textoEl)    textoEl.textContent = victoria ? cap.narrativa_post_victoria : cap.narrativa_post_derrota;

    if (btnJugarEl) {
      btnJugarEl.textContent = '🏆 VER RECOMPENSA';
      btnJugarEl.onclick = function() {
        _ocultarNarrativa();
        _mostrarRecompensa(cap, victoria);
      };
    }
    if (btnCerrarEl) {
      btnCerrarEl.style.display = 'none';
    }

    var ov = document.getElementById('hist-narrativa-overlay');
    if (ov) ov.classList.add('show');
  }

  function _ocultarNarrativa() {
    var ov = document.getElementById('hist-narrativa-overlay');
    if (ov) ov.classList.remove('show');
    _limpiarEfectos();
  }

  // ── Iniciar partida del capítulo ──────────────────────────────

  function _iniciarCapitulo(cap) {
    _capituloEnJuego = cap;
    _historiaActiva  = true;
    _ocultarNarrativa();

    // Aplicar dificultad si está disponible
    try {
      if (typeof S !== 'undefined') {
        if (cap.dificultad === 'dificil') {
          if (typeof window.setDificultad === 'function') window.setDificultad('dificil');
        } else if (cap.dificultad === 'facil') {
          if (typeof window.setDificultad === 'function') window.setDificultad('facil');
        } else {
          if (typeof window.setDificultad === 'function') window.setDificultad('normal');
        }
      }
    } catch(e) {}

    // Ir a la pantalla de juego
    try {
      if (typeof window.iniciarPartidaRapida === 'function') {
        window.iniciarPartidaRapida();
      } else if (typeof window.irA === 'function') {
        window.irA('game-screen');
      } else {
        var gs = document.getElementById('game-screen');
        var ms = document.getElementById('menu-screen');
        if (gs) gs.style.display = 'flex';
        if (ms) ms.style.display = 'none';
      }
      if (typeof window.nuevoPartido === 'function') window.nuevoPartido();
    } catch(e) { console.warn('[historia] iniciar partida:', e); }
  }

  // ── Mostrar recompensa ────────────────────────────────────────

  function _mostrarRecompensa(cap, victoria) {
    var resultEl   = document.getElementById('hist-recomp-resultado');
    var icoEl      = document.getElementById('hist-recomp-ico');
    var narrEl     = document.getElementById('hist-recomp-narrativa');
    var premiosEl  = document.getElementById('hist-recomp-premios');
    var btnEl      = document.getElementById('hist-recomp-btn');

    if (resultEl)  { resultEl.textContent = victoria ? '✅ VICTORIA' : '❌ DERROTA'; resultEl.className = 'hist-recomp-resultado ' + (victoria ? 'victoria' : 'derrota'); }
    if (icoEl)     icoEl.textContent = victoria ? '🏆' : '💪';
    if (narrEl)    narrEl.textContent = victoria ? cap.narrativa_post_victoria : cap.narrativa_post_derrota;

    // Premios (solo si victoria)
    if (premiosEl) {
      if (victoria) {
        var html = '<div class="hist-recomp-premio pesos">+' + cap.recompensa.pesos + ' PT</div>' +
          '<div class="hist-recomp-premio titulo">🎖 ' + cap.recompensa.titulo + '</div>';
        premiosEl.innerHTML = html;
        // Dar los pesos
        try {
          if (typeof window.addPesos === 'function') window.addPesos(cap.recompensa.pesos, 'Capítulo ' + cap.id + ' completado');
        } catch(e) {}
        // Dar el logro si corresponde
        try {
          if (cap.recompensa.logro && typeof window.desbloquearLogro === 'function') {
            window.desbloquearLogro(cap.recompensa.logro);
          }
        } catch(e) {}
      } else {
        premiosEl.innerHTML = '<div class="hist-recomp-premio titulo" style="border-color:#e05555;color:#e05555">Podés volver a intentarlo</div>';
      }
    }

    if (btnEl) {
      btnEl.onclick = function() {
        var rv = document.getElementById('hist-recompensa-overlay');
        if (rv) rv.classList.remove('show');
        // Ir al menú principal
        try {
          if (typeof window.irA === 'function') window.irA('menu-screen');
          else {
            var ms = document.getElementById('menu-screen');
            var gs = document.getElementById('game-screen');
            if (ms) ms.style.display = 'flex';
            if (gs) gs.style.display = 'none';
          }
        } catch(e) {}
        // Abrir menú historia para que vea el progreso
        setTimeout(function() { window._histAbrirMenu(); }, 400);
      };
    }

    var rv = document.getElementById('hist-recompensa-overlay');
    if (rv) rv.classList.add('show');

    // Chequear logros de progreso historia
    try { _checkLogrosHistoria(); } catch(e) {}
  }

  // ── Hook al bus de eventos para detectar fin de partida ───────

  function _hookFinDePartida() {
    if (typeof onJuego !== 'function') return;
    onJuego('finDePartido', function(data) {
      if (!_historiaActiva || !_capituloEnJuego) return;
      _historiaActiva  = false;
      var cap          = _capituloEnJuego;
      _capituloEnJuego = null;

      var victoria = data && data.puntosJugador >= (data.limite || 30);

      // Actualizar estado
      var completados = _historiaState.completados || [];
      var victorias   = _historiaState.victorias   || [];
      if (completados.indexOf(cap.id) === -1) completados.push(cap.id);
      if (victoria && victorias.indexOf(cap.id) === -1) victorias.push(cap.id);
      if (victoria && _historiaState.capituloActual === cap.id && cap.id < HISTORIA_CAPITULOS.length) {
        _historiaState.capituloActual = cap.id + 1;
      }
      _historiaState.completados = completados;
      _historiaState.victorias   = victorias;
      _guardarHistoria();

      // Mostrar narrativa post después de un momento
      setTimeout(function() {
        _mostrarNarrativaPost(cap, victoria);
      }, 1500);
    });
  }

  // ── Funciones de apertura/cierre ─────────────────────────────

  function abrirModoHistoria() {
    _renderListaCapitulos();
    var m = document.getElementById('hist-menu-modal');
    if (m) m.classList.add('show');
  }

  window._histAbrirMenu = abrirModoHistoria;

  window._histCerrarMenu = function() {
    var m = document.getElementById('hist-menu-modal');
    if (m) m.classList.remove('show');
  };

  window._histSeleccionarCapitulo = function(id) {
    var cap = HISTORIA_CAPITULOS.find(function(c) { return c.id === id; });
    if (!cap) return;
    window._histCerrarMenu();
    setTimeout(function() { _mostrarNarrativaPre(cap); }, 200);
  };

  // ── Inyectar botón en el menú ─────────────────────────────────

  function _inyectarBotonHistoria() {
    if (document.getElementById('hist-btn-menu')) return;
    var seccion = document.querySelector('.mm-seccion');
    if (!seccion) { setTimeout(_inyectarBotonHistoria, 400); return; }

    var btn = document.createElement('button');
    btn.id = 'hist-btn-menu';
    btn.className = 'hist-menu-btn';
    btn.innerHTML =
      '<span class="hist-menu-btn-ico">📖</span>' +
      '<span class="hist-menu-btn-texto">' +
        '<strong>MODO HISTORIA</strong>' +
        '<small>Campaña narrativa: del potrero a la Libertadores</small>' +
      '</span>';
    btn.onclick = function() { abrirModoHistoria(); };

    // Insertar después del primer .mm-seccion (sección PARTIDA)
    seccion.insertAdjacentElement('afterend', btn);
  }

  // ── Efectos especiales ────────────────────────────────────────

  function _lanzarPapelPicado() {
    _limpiarEfectos();
    var container = document.createElement('div');
    container.className = 'hist-confetti-container';
    container.id = 'hist-confetti-container';
    document.body.appendChild(container);

    var colores = ['#ffd700','#c8a84b','#7ed856','#e05555','#5ab4e0','#ffffff','#ff69b4'];
    for (var i = 0; i < 60; i++) {
      (function(idx) {
        var piece = document.createElement('div');
        piece.className = 'hist-confetti-piece';
        piece.style.left       = Math.random() * 100 + 'vw';
        piece.style.background = colores[Math.floor(Math.random() * colores.length)];
        piece.style.animationDuration  = (2 + Math.random() * 3) + 's';
        piece.style.animationDelay     = (Math.random() * 2) + 's';
        piece.style.transform          = 'rotate(' + Math.random() * 360 + 'deg)';
        container.appendChild(piece);
      })(i);
    }
    setTimeout(_limpiarEfectos, 8000);
  }

  function _lanzarEstrellas() {
    _limpiarEfectos();
    var container = document.createElement('div');
    container.className = 'hist-stars-container';
    container.id = 'hist-stars-container';
    document.body.appendChild(container);

    for (var i = 0; i < 20; i++) {
      var star = document.createElement('div');
      star.className = 'hist-star-piece';
      star.textContent = '⭐';
      star.style.left             = Math.random() * 100 + 'vw';
      star.style.top              = (20 + Math.random() * 60) + 'vh';
      star.style.animationDuration = (2 + Math.random() * 3) + 's';
      star.style.animationDelay   = (Math.random() * 2) + 's';
      container.appendChild(star);
    }
  }

  function _limpiarEfectos() {
    ['hist-confetti-container', 'hist-stars-container'].forEach(function(id) {
      var el = document.getElementById(id);
      if (el && el.parentNode) el.parentNode.removeChild(el);
    });
  }

  function setupModoHistoria() {
    _crearOverlays();
    _hookFinDePartida();
    _inyectarBotonHistoria();
  }

  // ════════════════════════════════════════════════
  // FEATURE 2: MISIONES SEMANALES
  // ════════════════════════════════════════════════

  var MISIONES_POOL = [
    { id:'ganar3',   nombre:'Hat-Trick Semanal',   desc:'Ganá 3 partidas esta semana',         objetivo:3,  tipo:'partidas_ganadas',    recompensa:150 },
    { id:'envido5',  nombre:'El Envidador',         desc:'Ganá 5 envidos esta semana',          objetivo:5,  tipo:'envidos_ganados',     recompensa:100 },
    { id:'truco5',   nombre:'Truco Master',         desc:'Ganá 5 trucos cantados',              objetivo:5,  tipo:'trucos_ganados',      recompensa:100 },
    { id:'racha3',   nombre:'Racha Imparable',      desc:'Hacé una racha de 3 manos',           objetivo:3,  tipo:'racha_maxima',        recompensa:120 },
    { id:'sin_mazo', nombre:'Sin Rendirse',         desc:'Jugá 5 partidas sin ir al mazo',      objetivo:5,  tipo:'partidas_sin_mazo',   recompensa:180 },
    { id:'ganar5',   nombre:'Semana Perfecta',      desc:'Ganá 5 partidas esta semana',         objetivo:5,  tipo:'partidas_ganadas',    recompensa:200 },
    { id:'falta',    nombre:'Falta Envido x3',      desc:'Ganá con Falta Envido 3 veces',       objetivo:3,  tipo:'falta_envidos',       recompensa:250 },
    { id:'desafio',  nombre:'Desafiante',           desc:'Completá el desafío diario 3 días',   objetivo:3,  tipo:'desafios_completados',recompensa:300 },
  ];

  var _misionesState = lsGetJSON('tg_misiones', { semana: 0, misiones: [], progreso: {} });

  function _semanaActual() {
    var ahora = new Date();
    var inicio = new Date(2024, 0, 1);
    var diff   = Math.floor((ahora - inicio) / (7 * 24 * 60 * 60 * 1000));
    return diff;
  }

  function _semillaConSeed(seed, max) {
    // PRNG determinístico simple con seed
    var s = seed;
    s = ((s * 1664525) + 1013904223) & 0xffffffff;
    return Math.abs(s) % max;
  }

  function _generarMisionesDeSemana(semana) {
    var misiones = [];
    var usados   = [];
    var seed     = semana * 31337;
    var intentos = 0;
    while (misiones.length < 3 && intentos < 50) {
      intentos++;
      var idx = _semillaConSeed(seed + intentos, MISIONES_POOL.length);
      var mis = MISIONES_POOL[idx];
      if (usados.indexOf(mis.id) === -1) {
        usados.push(mis.id);
        misiones.push(mis.id);
      }
    }
    return misiones;
  }

  function _checkResetMisiones() {
    var semana = _semanaActual();
    if (_misionesState.semana !== semana) {
      _misionesState.semana   = semana;
      _misionesState.misiones = _generarMisionesDeSemana(semana);
      _misionesState.progreso = {};
      lsPutJSON('tg_misiones', _misionesState);
    }
  }

  function _getMisionActual(id) {
    return MISIONES_POOL.find(function(m) { return m.id === id; });
  }

  function _getProgresoMision(id) {
    return _misionesState.progreso[id] || 0;
  }

  function _actualizarProgresoMision(tipo, incremento) {
    incremento = incremento || 1;
    _checkResetMisiones();
    var cambiado = false;
    _misionesState.misiones.forEach(function(mid) {
      var mis = _getMisionActual(mid);
      if (!mis || mis.tipo !== tipo) return;
      var progActual = _getProgresoMision(mid);
      if (progActual >= mis.objetivo) return; // ya completada
      var nuevo = Math.min(progActual + incremento, mis.objetivo);
      _misionesState.progreso[mid] = nuevo;
      cambiado = true;

      // Chequear si se completó
      if (nuevo >= mis.objetivo) {
        _misionCompletada(mis);
      }
    });
    if (cambiado) {
      lsPutJSON('tg_misiones', _misionesState);
      _renderMisionesCard();
    }
  }

  function _misionCompletada(mis) {
    // Dar recompensa
    try {
      if (typeof window.addPesos === 'function') window.addPesos(mis.recompensa, 'Misión: ' + mis.nombre);
    } catch(e) {}

    // Toast
    try {
      var msg = '📋 Misión completada: ' + mis.nombre + ' +' + fmtPT(mis.recompensa);
      if (typeof showToast === 'function') showToast(msg);
      else if (typeof window._showToastFP === 'function') window._showToastFP(msg);
    } catch(e) {}

    // Chequear si todas las misiones de la semana se completaron
    var todas = _misionesState.misiones.every(function(mid) {
      var m = _getMisionActual(mid);
      return m && _getProgresoMision(mid) >= m.objetivo;
    });
    if (todas) {
      // Logro semana perfecta
      try { _desbloquearLogroExtra('semana_perfec'); } catch(e) {}
      // Contar misiones totales completadas
      var totalMis = parseInt(lsGet('tg_misiones_total', '0'), 10) + 1;
      lsPut('tg_misiones_total', totalMis);
      if (totalMis >= 10) { try { _desbloquearLogroExtra('misiones10'); } catch(e) {} }
    }
  }

  // ── Render card de misiones en el menú ───────────────────────

  function _renderMisionesCard() {
    var card = document.getElementById('hist-misiones-card');
    if (!card) return;
    _checkResetMisiones();

    var dias = _diasRestantesSemana();

    var misHtml = _misionesState.misiones.map(function(mid) {
      var mis     = _getMisionActual(mid);
      if (!mis) return '';
      var prog    = _getProgresoMision(mid);
      var pct     = Math.min(100, Math.round(prog / mis.objetivo * 100));
      var completa = prog >= mis.objetivo;
      return '<div class="hist-mis-item' + (completa ? ' completada' : '') + '">' +
        '<div class="hist-mis-item-info">' +
          '<div class="hist-mis-nombre">' + mis.nombre + '</div>' +
          '<div class="hist-mis-desc">' + mis.desc + '</div>' +
          '<div class="hist-mis-barra-wrap"><div class="hist-mis-barra" style="width:' + pct + '%"></div></div>' +
        '</div>' +
        '<div class="hist-mis-recomp">+' + mis.recompensa + ' PT</div>' +
        '<div class="hist-mis-check">' + (completa ? '✅' : '○') + '</div>' +
      '</div>';
    }).join('');

    card.innerHTML = '<div class="hist-mis-card">' +
      '<div class="hist-mis-header">' +
        '<div class="hist-mis-titulo">📋 MISIONES SEMANALES</div>' +
        '<div class="hist-mis-timer">' + dias + ' días</div>' +
      '</div>' +
      '<div class="hist-mis-lista">' + misHtml + '</div>' +
    '</div>';
  }

  function _diasRestantesSemana() {
    var ahora   = new Date();
    var diaSem  = ahora.getDay(); // 0=dom ... 6=sab
    // Lunes = inicio de semana
    var diasHastaLunes = diaSem === 0 ? 1 : (8 - diaSem);
    return diasHastaLunes;
  }

  function _inyectarCardMisiones() {
    if (document.getElementById('hist-misiones-card')) return;
    // Buscar la card del desafío diario para insertar después
    var desafioCard = document.getElementById('ext-desafio-card-menu');
    if (desafioCard) {
      var card = document.createElement('div');
      card.id = 'hist-misiones-card';
      desafioCard.insertAdjacentElement('afterend', card);
      _renderMisionesCard();
      return;
    }
    // Fallback: insertar después del primer .mm-seccion
    var seccion = document.querySelector('.mm-seccion');
    if (!seccion) { setTimeout(_inyectarCardMisiones, 600); return; }
    var card = document.createElement('div');
    card.id = 'hist-misiones-card';
    seccion.insertAdjacentElement('afterend', card);
    _renderMisionesCard();
  }

  // ── Hooks de progreso de misiones ─────────────────────────────

  function _hookMisiones() {
    if (typeof onJuego !== 'function') return;

    var _misionFueAlMazo = false;

    onJuego('nuevoPartido', function() {
      _misionFueAlMazo = false;
    });

    onJuego('finDePartido', function(data) {
      if (!data) return;
      var ganamos = data.puntosJugador >= (data.limite || 30);

      if (ganamos) {
        _actualizarProgresoMision('partidas_ganadas');
        if (!_misionFueAlMazo) _actualizarProgresoMision('partidas_sin_mazo');
      }
      _misionFueAlMazo = false;

      // Chequeo de racha para misión racha_maxima
      try {
        var racha = parseInt(lsGet('tg_racha', '0'), 10) || 0;
        if (racha >= 3) {
          // Contar cuánto progreso de racha ya tenemos (sólo 1 vez cuando llega a 3)
          var progRacha = _getProgresoMision('racha3');
          if (progRacha < 1) _actualizarProgresoMision('racha_maxima');
        }
      } catch(e) {}
    });

    // Wrap irseAlMazo para detectar mazo
    var _origMazo = window.irseAlMazo;
    if (typeof _origMazo === 'function') {
      window.irseAlMazo = function(quien) {
        if (quien === 'jugador') _misionFueAlMazo = true;
        return _origMazo.apply(this, arguments);
      };
    }

    // Wrap mostrarOverlayEnvido para contar falta envido
    var _origEnvido = window.mostrarOverlayEnvido;
    if (typeof _origEnvido === 'function') {
      window.mostrarOverlayEnvido = function(ptsJ, ptsR, ganoJugador, apuesta, cartasJ, cartasR, titulo) {
        try {
          if (ganoJugador) {
            _actualizarProgresoMision('envidos_ganados');
            if (titulo === 'ENVIDO' && typeof S !== 'undefined' && S.historialEnvido && S.historialEnvido.includes('falta')) {
              _actualizarProgresoMision('falta_envidos');
            }
          }
        } catch(e) {}
        return _origEnvido.apply(this, arguments);
      };
    }

    // Desafío diario completado → avanzar misión
    onJuego('finDePartido', function() {
      try {
        var desKey = 'tg_desafio_diario';
        var dHoy   = JSON.parse(localStorage.getItem(desKey) || '{}');
        var hoy    = new Date().toDateString();
        if (dHoy.fecha === hoy && dHoy.gano) {
          _actualizarProgresoMision('desafios_completados');
        }
      } catch(e) {}
    });
  }

  function setupMisionesSemanales() {
    _checkResetMisiones();
    setTimeout(_inyectarCardMisiones, 900);
    _hookMisiones();

    // Re-render en cada render del juego
    if (typeof onJuego === 'function') {
      onJuego('render', function() {
        var card = document.getElementById('hist-misiones-card');
        if (card && card.offsetParent !== null) _renderMisionesCard();
      });
    }
  }

  // ════════════════════════════════════════════════
  // FEATURE 3: LOGROS EXPANDIDOS
  // ════════════════════════════════════════════════

  var LOGROS_EXTRA = [
    { id:'historia_1',    ico:'📖', nombre:'La Historia Empieza',   desc:'Completaste el capítulo 1 del Modo Historia' },
    { id:'historia_5',    ico:'🌟', nombre:'A Mitad de Camino',      desc:'Completaste 5 capítulos de la Historia' },
    { id:'historia_10',   ico:'👑', nombre:'Campeón del Mundo',       desc:'Completaste el Modo Historia completo' },
    { id:'superclasico',  ico:'🔥', nombre:'El Superclásico',         desc:'Ganaste el Superclásico en el Modo Historia' },
    { id:'campeon_libertadores', ico:'🏆', nombre:'Campeón de América', desc:'Ganaste la final de la Libertadores' },
    { id:'campeon_mundo', ico:'🌍', nombre:'Campeón del Mundo',       desc:'Ganaste el Mundial de Clubes en Historia' },
    { id:'semana_perfec', ico:'🗓️', nombre:'Semana Perfecta',         desc:'Completaste las 3 misiones semanales' },
    { id:'misiones10',    ico:'✅', nombre:'Misionero',               desc:'Completaste 10 misiones semanales en total' },
    { id:'sin_derrota',   ico:'🛡️', nombre:'Invicto',                 desc:'Ganaste 10 partidas seguidas' },
    { id:'madrugador',    ico:'🌅', nombre:'Madrugador',              desc:'Jugaste antes de las 8am' },
    { id:'nocturno',      ico:'🌙', nombre:'El Búho',                 desc:'Jugaste después de la medianoche' },
    { id:'velocista',     ico:'⚡', nombre:'Velocista',               desc:'Ganaste un partido en menos de 5 manos' },
    { id:'30_cero',       ico:'🎯', nombre:'Goleada',                 desc:'Ganaste 30-0 (rival sin puntos)' },
    { id:'fiel',          ico:'💚', nombre:'Hincha Fiel',             desc:'Jugaste 50 partidas totales' },
  ];

  // Notificación propia para logros extra (usa la del sistema si está disponible)
  function _desbloquearLogroExtra(id) {
    // Primero intentar con el sistema de logros de extras.js
    if (typeof window.desbloquearLogro === 'function') {
      // El sistema de extras.js sólo conoce sus propios logros.
      // Intentamos igual — si no lo encuentra lo ignora silenciosamente.
      window.desbloquearLogro(id);
    }

    // Sistema propio: verificar si ya fue desbloqueado
    var desbloqueados = lsGetJSON('tg_logros_extra', []);
    if (desbloqueados.indexOf(id) !== -1) return;

    var def = LOGROS_EXTRA.find(function(l) { return l.id === id; });
    if (!def) return;

    desbloqueados.push(id);
    lsPutJSON('tg_logros_extra', desbloqueados);

    // Mostrar notificación
    _mostrarNotifLogroExtra(def);
  }

  function _mostrarNotifLogroExtra(def) {
    // Si el sistema de extras.js ya mostró notif, no duplicar
    // Usamos un div con ID propio
    var notif = document.getElementById('hist-logro-notif');
    if (!notif) {
      notif = document.createElement('div');
      notif.id = 'hist-logro-notif';
      notif.style.cssText = 'position:fixed;bottom:80px;left:50%;transform:translateX(-50%) translateY(100px);background:linear-gradient(135deg,#1a2a0a,#0a1a0a);border:1px solid #7ed856;border-radius:12px;padding:12px 16px;display:flex;align-items:center;gap:10px;z-index:3000;transition:transform 0.4s cubic-bezier(0.34,1.56,0.64,1);pointer-events:none;min-width:280px;max-width:90vw;';
      notif.innerHTML = '<div id="hist-logro-notif-ico" style="font-size:28px"></div>' +
        '<div><div style="font-family:var(--f-ui,monospace);font-size:9px;letter-spacing:2px;color:#5a9e45;margin-bottom:2px">¡LOGRO EXTRA!</div>' +
        '<div id="hist-logro-notif-nom" style="font-family:var(--f-ui,monospace);font-size:12px;font-weight:bold;color:#c8f0a0;letter-spacing:1px"></div>' +
        '<div id="hist-logro-notif-des" style="font-family:var(--f-body,serif);font-size:10px;color:#7ed856;margin-top:2px"></div></div>';
      document.body.appendChild(notif);
    }

    document.getElementById('hist-logro-notif-ico').textContent = def.ico;
    document.getElementById('hist-logro-notif-nom').textContent = def.nombre;
    document.getElementById('hist-logro-notif-des').textContent = def.desc;
    notif.style.transform = 'translateX(-50%) translateY(0)';

    setTimeout(function() {
      notif.style.transform = 'translateX(-50%) translateY(100px)';
    }, 4000);
  }

  // Chequeos automáticos de logros extra
  function _checkLogrosHistoria() {
    var completados = (_historiaState.completados || []).length;
    if (completados >= 1)  _desbloquearLogroExtra('historia_1');
    if (completados >= 5)  _desbloquearLogroExtra('historia_5');
    if (completados >= 10) _desbloquearLogroExtra('historia_10');
  }

  function _hookLogrosExtra() {
    if (typeof onJuego !== 'function') return;

    var _partidasConsecutivas = parseInt(lsGet('tg_racha', '0'), 10) || 0;
    var _manosEnPartidaActual = 0;

    onJuego('nuevoPartido', function() {
      _manosEnPartidaActual = 0;
      // Chequear hora para logros de horario
      var hora = new Date().getHours();
      if (hora < 8)  _desbloquearLogroExtra('madrugador');
      if (hora >= 24 || hora === 0) _desbloquearLogroExtra('nocturno');
      // Midnight = hora 0
      if (hora === 0) _desbloquearLogroExtra('nocturno');
    });

    onJuego('render', function() {
      // Contar manos (estimación: ganadoresRonda llenos)
      try {
        if (typeof S !== 'undefined' && S.ganadoresRonda) {
          _manosEnPartidaActual = S.ganadoresRonda.filter(function(g) { return g !== null && g !== undefined; }).length;
        }
      } catch(e) {}
    });

    onJuego('finDePartido', function(data) {
      if (!data) return;
      var ganamos = data.puntosJugador >= (data.limite || 30);

      // Total partidas (para 'fiel')
      var total = parseInt(lsGet('tg_partidas_total_g', '0'), 10) + 1;
      lsPut('tg_partidas_total_g', total);
      if (total >= 50) _desbloquearLogroExtra('fiel');

      if (ganamos) {
        // Racha para 'sin_derrota'
        _partidasConsecutivas++;
        lsPut('tg_racha_abs', _partidasConsecutivas);
        if (_partidasConsecutivas >= 10) _desbloquearLogroExtra('sin_derrota');

        // 30-0
        if (data.puntosRival === 0 && data.puntosJugador >= (data.limite || 30)) {
          _desbloquearLogroExtra('30_cero');
        }

        // Velocista: ganó en pocas manos (heurística: pocos puntos jugados = pocas manos)
        if (_manosEnPartidaActual <= 5 && _manosEnPartidaActual > 0) {
          _desbloquearLogroExtra('velocista');
        }

        // Hora nocturna
        var hora = new Date().getHours();
        if (hora === 0 || hora >= 24) _desbloquearLogroExtra('nocturno');
        if (hora < 8) _desbloquearLogroExtra('madrugador');
      } else {
        _partidasConsecutivas = 0;
        lsPut('tg_racha_abs', 0);
      }
    });
  }

  function setupLogrosExtra() {
    _hookLogrosExtra();
    // Exponer para uso externo
    window.desbloquearLogroExtra = _desbloquearLogroExtra;
    window.LOGROS_EXTRA = LOGROS_EXTRA;
  }

  // ════════════════════════════════════════════════
  // FEATURE 4: JUGADORES EXTRA EN FICHAJES
  // ════════════════════════════════════════════════

  var JUGADORES_EXTRA = [
    { id:'higuain',     nombre:'El Pipita',    emoji:'🎯', precio:130, descripcion:'Delantero goleador',          rareza:'oro'       },
    { id:'demichelis',  nombre:'El Cerebro',   emoji:'🧠', precio: 85, descripcion:'Ordena al equipo',            rareza:'plata'     },
    { id:'verón',       nombre:'La Brujita',   emoji:'✨', precio:160, descripcion:'Magia pura',                  rareza:'oro'       },
    { id:'redondo',     nombre:'El Príncipe',  emoji:'🤴', precio:175, descripcion:'Juega con elegancia',         rareza:'oro'       },
    { id:'simeone',     nombre:'El Cholo',     emoji:'😤', precio:140, descripcion:'Intensidad máxima',           rareza:'oro'       },
    { id:'gallardo',    nombre:'El Muñeco',    emoji:'🪆', precio:200, descripcion:'Estratega total',             rareza:'legendario'},
    { id:'kempes',      nombre:'El Matador',   emoji:'🗡️', precio:220, descripcion:'Campeón del mundo \'78',     rareza:'legendario'},
    { id:'bochini',     nombre:'El Bocha',     emoji:'🎩', precio:195, descripcion:'Ídolo de Independiente',      rareza:'legendario'},
    { id:'passarella',  nombre:'El Kaiser',    emoji:'👑', precio:185, descripcion:'Capitán campeón',             rareza:'legendario'},
    { id:'labruna',     nombre:'El Maestro',   emoji:'🎓', precio:170, descripcion:'Crack histórico de River',    rareza:'legendario'},
    { id:'lacaba',      nombre:'Ángel',        emoji:'😇', precio: 65, descripcion:'El volante incansable',       rareza:'bronce'    },
    { id:'almeyda',     nombre:'El Toro',      emoji:'🐂', precio: 75, descripcion:'No afloja nunca',             rareza:'bronce'    },
    { id:'scaloni',     nombre:'El Técnico',   emoji:'📋', precio:300, descripcion:'Armó el equipo campeón',      rareza:'icono'     },
    { id:'menotti',     nombre:'El Flaco',     emoji:'🚬', precio:280, descripcion:'Filosofía del buen fútbol',   rareza:'icono'     },
    { id:'bilardo',     nombre:'El Doctor',    emoji:'🩺', precio:290, descripcion:'Ganó el \'86 con ciencia',   rareza:'icono'     },
  ];

  function agregarJugadoresExtra() {
    // Exponer el array para que features_progression.js lo pueda usar
    window.JUGADORES_EXTRA = JUGADORES_EXTRA;

    // Intentar inyectar en el mercado de fichajes si ya existe el modal
    var _tryInyectar = function() {
      // Buscar el array interno JUGADORES_MERCADO parchando la función de render
      // Features_progression expone _renderFichajes indirectamente a través de _fichajesFiltro.
      // El truco: si el modal está visible, forzar un re-render con los extra sumados.
      var grid = document.getElementById('fp-fichajes-grid');
      if (!grid) return; // modal no abierto, intentar más tarde

      // Ya que no podemos tocar JUGADORES_MERCADO directamente (es una const privada),
      // inyectamos las cards extra al final del grid cuando se abre el modal.
      _inyectarJugadoresExtraEnGrid();
    };

    // Cuando se abre el modal de fichajes, añadir los extra
    // Observamos cambios en el modal
    var fichajesModal = document.getElementById('ext-fichajes-modal');
    if (fichajesModal) {
      var observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(m) {
          if (m.type === 'attributes' && m.attributeName === 'class') {
            if (fichajesModal.classList.contains('show')) {
              setTimeout(_inyectarJugadoresExtraEnGrid, 100);
            }
          }
        });
      });
      observer.observe(fichajesModal, { attributes: true });
    }

    // También parchamos abrirFichajes si está disponible
    var _origAbrirFichajes = window.abrirFichajes;
    if (typeof _origAbrirFichajes === 'function') {
      window.abrirFichajes = function() {
        _origAbrirFichajes.apply(this, arguments);
        setTimeout(_inyectarJugadoresExtraEnGrid, 200);
      };
    }

    // Parchamos _fichajesFiltro para que re-inyecte después de cada filtro
    var _origFiltro = window._fichajesFiltro;
    if (typeof _origFiltro === 'function') {
      window._fichajesFiltro = function(filtro, btn) {
        _origFiltro.apply(this, arguments);
        setTimeout(_inyectarJugadoresExtraEnGrid, 50);
      };
    }
  }

  function _inyectarJugadoresExtraEnGrid() {
    var grid = document.getElementById('fp-fichajes-grid');
    if (!grid) return;

    // Evitar duplicados: remover cards extra previas
    var prevExtras = grid.querySelectorAll('.fp-fichaje-card-extra');
    prevExtras.forEach(function(el) { el.parentNode.removeChild(el); });

    // Verificar filtro activo
    var filtroActual = window._fichajesFiltroActual || 'todos';

    var comprados = (typeof window.getFichajesComprados === 'function') ? window.getFichajesComprados() : [];
    var equipado  = (typeof window.getFichajeEquipado === 'function') ? window.getFichajeEquipado() : '';

    var RAREZA_COLOR = {
      bronce:    '#cd7f32',
      plata:     '#c0c0c0',
      oro:       '#ffd700',
      legendario:'#9b59b6',
      icono:     '#f5c518',
    };

    JUGADORES_EXTRA.forEach(function(j) {
      var comprado = comprados.indexOf(j.id) !== -1;
      var esEquip  = j.id === equipado;

      // Aplicar filtro
      if (filtroActual === 'disponibles' && comprado) return;
      if (filtroActual === 'mios'        && !comprado) return;

      var color  = RAREZA_COLOR[j.rareza] || '#aaa';
      var btnHTML;
      if (comprado) {
        btnHTML = esEquip
          ? '<button class="fp-btn-equipado" disabled>✓ Equipado</button>'
          : '<button class="fp-btn-equipar" onclick="window._equiparJugadorExtra(\'' + j.id + '\')">Equipar</button>';
      } else {
        btnHTML = '<button class="fp-btn-comprar" onclick="window._comprarJugadorExtra(\'' + j.id + '\')">Comprar</button>';
      }

      var card = document.createElement('div');
      card.className = 'fp-fichaje-card fp-fichaje-card-extra';
      card.style.setProperty('--rareza-color', color);
      card.innerHTML =
        '<div class="fp-fichaje-rareza" style="background:' + color + '">' + j.rareza.toUpperCase() + '</div>' +
        '<div class="fp-fichaje-emoji">' + j.emoji + '</div>' +
        '<div class="fp-fichaje-nombre">' + j.nombre + '</div>' +
        '<div class="fp-fichaje-desc">' + j.descripcion + '</div>' +
        '<div class="fp-fichaje-precio">' + j.precio + ' PT</div>' +
        btnHTML;
      grid.appendChild(card);
    });
  }

  window._comprarJugadorExtra = function(id) {
    var jugador = JUGADORES_EXTRA.find(function(j) { return j.id === id; });
    if (!jugador) return;
    // Compra por el camino único de features_progression.js (misma billetera,
    // mismo tg_fichajes) — antes esto reimplementaba su propia lectura/escritura
    // cruda de localStorage y podía divergir del mercado base.
    if (typeof window._comprarFichajeGenerico !== 'function') return;
    if (!window._comprarFichajeGenerico(jugador)) {
      var msg = '❌ PT insuficientes para fichar a ' + jugador.nombre;
      if (typeof showToast === 'function') showToast(msg);
      return;
    }
    var msg2 = '✅ ¡' + jugador.emoji + ' ' + jugador.nombre + ' fichado!';
    if (typeof showToast === 'function') showToast(msg2);
    _inyectarJugadoresExtraEnGrid();
  };

  window._equiparJugadorExtra = function(id) {
    var jugador = JUGADORES_EXTRA.find(function(j) { return j.id === id; });
    if (!jugador) return;
    lsPut('tg_fichaje_equipado', id);
    try {
      if (typeof S !== 'undefined') S.avatarJugador = jugador.emoji;
    } catch(e) {}
    var msg = '✅ ' + jugador.nombre + ' equipado como avatar';
    if (typeof showToast === 'function') showToast(msg);
    _inyectarJugadoresExtraEnGrid();
  };

  // ════════════════════════════════════════════════
  // INIT
  // ════════════════════════════════════════════════

  function init() {
    try { setupModoHistoria();      } catch(e) { console.warn('[historia] modo historia:', e); }
    try { setupMisionesSemanales(); } catch(e) { console.warn('[historia] misiones:', e); }
    try { setupLogrosExtra();       } catch(e) { console.warn('[historia] logros extra:', e); }
    try { agregarJugadoresExtra();  } catch(e) { console.warn('[historia] jugadores extra:', e); }
  }

  window.addEventListener('load', function() { setTimeout(init, 600); });

  // ── Exposición global ──────────────────────────────────────────
  window.abrirModoHistoria    = abrirModoHistoria;
  window.JUGADORES_EXTRA      = JUGADORES_EXTRA;
  window.HISTORIA_CAPITULOS   = HISTORIA_CAPITULOS;
  window.MISIONES_POOL        = MISIONES_POOL;
  window.LOGROS_EXTRA         = LOGROS_EXTRA;

})();
