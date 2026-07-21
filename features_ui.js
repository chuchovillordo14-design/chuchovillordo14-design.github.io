/**
 * features_ui.js — Truco GOL
 * Feature 1: Tutorial interactivo
 * Feature 2: Botón de Revancha
 * Feature 3: Perfil de DT
 * Feature 4: Compartir Resultado
 */
(function () {
  'use strict';

  // ══════════════════════════════════════════════
  // FEATURE 1 — TUTORIAL INTERACTIVO
  // ══════════════════════════════════════════════

  const TUTORIAL_STEPS = [
    {
      titulo: '¡Bienvenido a Truco GOL!',
      texto: 'Acá el truco se juega como un partido: estrategia, huevo y algo de caradurismo. Vos sos el DT y tus cartas son tu equipo. ¡Salimos a la cancha!',
      target: null,
      spotlight: false
    },
    {
      titulo: 'Tu equipo (tus cartas)',
      texto: 'Tenés 3 cartas: son tus 3 jugadores en la cancha. Tocá una para mandarla a jugar (o arrastrala). La clave está en elegir a quién tirás en cada jugada.',
      target: '#player-hand',
      spotlight: true
    },
    {
      titulo: 'El crack y los suplentes',
      texto: 'No todas valen igual, como en un plantel. El 1 de espadas es tu Messi: la carta más fuerte del juego. Lo siguen el 1 de bastos, el 7 de espadas y el 7 de oro. El resto, de mayor a menor.',
      target: null,
      spotlight: false,
      tabla: true
    },
    {
      titulo: 'Los tres tiempos',
      texto: 'Cada mano se define hasta en 3 rondas (los "tiempos"). Gana la mano el que se lleva 2 de 3. Cada carta que se tira cae en el centro de la cancha.',
      target: '#rondas-panel',
      spotlight: true
    },
    {
      titulo: 'El Truco: jugártela al ataque',
      texto: 'Cantar TRUCO es irte al ataque: subís lo que vale la mano. Si la ganás, te llevás esos puntos. Se puede subir más con Retruco (3) y Vale Cuatro (4). El que se anima, mete.',
      target: '#acciones',
      spotlight: true
    },
    {
      titulo: 'Cómo respondés al Truco',
      texto: '"QUIERO" acepta y se juega la mano por esos puntos. "NO QUIERO" te achicás y le regalás los puntos que ya valía. "RETRUCO / VALE CUATRO" le devolvés la subida, más fuerte.',
      target: '#acciones',
      spotlight: true
    },
    {
      titulo: 'El Envido: se define en el mediocampo',
      texto: 'Antes de tirar la primera carta se puede cantar ENVIDO. Es una pulseada aparte, por los puntos de tu palo. Ojo clave: el envido va SIEMPRE antes que el truco.',
      target: '#acciones',
      spotlight: true
    },
    {
      titulo: 'Cómo se cuenta el Envido',
      texto: 'Con 2 o más cartas del mismo palo: 20 + los valores de las dos más altas (las figuras 10, 11 y 12 valen 0). Sin par de palo, vale tu carta más alta sola. Real Envido suma 3; Falta Envido se juega todo lo que le falta al que va ganando.',
      target: null,
      spotlight: false
    },
    {
      titulo: 'El marcador',
      texto: 'Gana el partido el primero en llegar a 30 (en modo rápido, 15). Seguí el tanteador al costado: las "malas" son la primera mitad, las "buenas" la segunda.',
      target: '#side-score',
      spotlight: true
    },
    {
      titulo: 'Quién saca del medio (Mano)',
      texto: 'El "Mano" es el que saca: canta primero y juega último en la 1ª ronda, así que tiene ventaja. El mazo marca quién es mano. En las rondas que siguen arranca el que ganó la anterior.',
      target: '#mazo-pos',
      spotlight: true
    },
    {
      titulo: 'Irse al Mazo: tirarla afuera',
      texto: 'Si la mano viene fea, "Ite al Mazo": cortás la jugada como quien tira la pelota al lateral. Regalás los puntos en juego, pero no arriesgás más. Achicarse a tiempo también es de vivos.',
      target: '#acciones',
      spotlight: true
    },
    {
      titulo: '¡A la cancha!',
      texto: 'Ya sabés lo básico. Acordate: el truco es 70% psicología. Cantá con cara de póker aunque tengas basura, que el que miente mejor gana. ¡Suerte, DT!',
      target: null,
      spotlight: false
    }
  ];

  let _tutorialStep = 0;
  let _tutorialOverlay = null;
  let _tutorialActive = false;

  function tutInit() {
    if (_tutorialOverlay) return;

    _tutorialOverlay = document.createElement('div');
    _tutorialOverlay.id = 'tut-overlay';
    _tutorialOverlay.innerHTML =
      '<div id="tut-spotlight"></div>' +
      '<div id="tut-card">' +
        '<div id="tut-step-indicator"></div>' +
        '<h3 id="tut-titulo"></h3>' +
        '<div id="tut-tabla-jerarquia" style="display:none">' +
          '<table class="tut-tabla">' +
            '<thead><tr><th>Carta</th><th>Palo</th><th>Fuerza</th></tr></thead>' +
            '<tbody>' +
              '<tr><td>1</td><td>Espadas</td><td>★★★★★</td></tr>' +
              '<tr><td>1</td><td>Bastos</td><td>★★★★☆</td></tr>' +
              '<tr><td>7</td><td>Espadas</td><td>★★★★☆</td></tr>' +
              '<tr><td>7</td><td>Oros</td><td>★★★☆☆</td></tr>' +
              '<tr><td>3</td><td>Cualquiera</td><td>★★★☆☆</td></tr>' +
              '<tr><td>2</td><td>Cualquiera</td><td>★★☆☆☆</td></tr>' +
              '<tr><td>1</td><td>Copa / Oro</td><td>★★☆☆☆</td></tr>' +
              '<tr><td>12, 11, 10</td><td>Cualquiera</td><td>★★☆☆☆</td></tr>' +
              '<tr><td>7</td><td>Copa / Basto</td><td>★☆☆☆☆</td></tr>' +
              '<tr><td>6, 5, 4</td><td>Cualquiera</td><td>☆☆☆☆☆</td></tr>' +
            '</tbody>' +
          '</table>' +
        '</div>' +
        '<p id="tut-texto"></p>' +
        '<div id="tut-btns">' +
          '<button id="tut-btn-saltar" class="tut-btn tut-btn-skip">Saltar</button>' +
          '<div class="tut-nav-btns">' +
            '<button id="tut-btn-prev" class="tut-btn tut-btn-prev">&#8592; Anterior</button>' +
            '<button id="tut-btn-next" class="tut-btn tut-btn-next">Siguiente &#8594;</button>' +
          '</div>' +
        '</div>' +
      '</div>';

    document.body.appendChild(_tutorialOverlay);

    document.getElementById('tut-btn-saltar').addEventListener('click', tutClose);
    document.getElementById('tut-btn-prev').addEventListener('click', tutPrev);
    document.getElementById('tut-btn-next').addEventListener('click', tutNext);
  }

  function tutShowStep(n) {
    var step = TUTORIAL_STEPS[n];
    if (!step) return;

    var titulo = document.getElementById('tut-titulo');
    var texto  = document.getElementById('tut-texto');
    var tabla  = document.getElementById('tut-tabla-jerarquia');
    var ind    = document.getElementById('tut-step-indicator');
    var prev   = document.getElementById('tut-btn-prev');
    var next   = document.getElementById('tut-btn-next');
    var spot   = document.getElementById('tut-spotlight');
    var card   = document.getElementById('tut-card');

    if (titulo) titulo.textContent = step.titulo;
    if (texto)  texto.textContent  = step.texto;
    if (tabla)  tabla.style.display = step.tabla ? 'block' : 'none';
    if (ind)    ind.textContent = (n + 1) + ' / ' + TUTORIAL_STEPS.length;
    if (prev)   prev.style.visibility = n === 0 ? 'hidden' : 'visible';
    if (next)   next.textContent = n === TUTORIAL_STEPS.length - 1 ? '¡Jugar!' : 'Siguiente →';

    // Mover spotlight
    if (spot) {
      if (step.target && step.spotlight) {
        var el = document.querySelector(step.target);
        if (el) {
          var rect = el.getBoundingClientRect();
          var pad = 12;
          spot.style.display      = 'block';
          spot.style.left         = (rect.left - pad) + 'px';
          spot.style.top          = (rect.top - pad) + 'px';
          spot.style.width        = (rect.width  + pad * 2) + 'px';
          spot.style.height       = (rect.height + pad * 2) + 'px';
          spot.style.borderRadius = '12px';
        } else {
          spot.style.display = 'none';
        }
      } else {
        spot.style.display = 'none';
      }
    }

    // posicionar card
    if (card) {
      card.classList.remove('tut-card-anim');
      void card.offsetWidth;
      card.classList.add('tut-card-anim');

      if (step.target && step.spotlight) {
        var el2 = document.querySelector(step.target);
        if (el2) {
          var rect2 = el2.getBoundingClientRect();
          var winH  = window.innerHeight;
          if (rect2.top < winH / 2) {
            card.style.top       = 'auto';
            card.style.bottom    = '70px';
            card.style.transform = 'translateX(-50%)';
          } else {
            card.style.bottom    = 'auto';
            card.style.top       = '70px';
            card.style.transform = 'translateX(-50%)';
          }
        }
      } else {
        card.style.top       = '50%';
        card.style.bottom    = 'auto';
        card.style.transform = 'translate(-50%, -50%)';
      }
    }
  }

  function tutNext() {
    if (_tutorialStep >= TUTORIAL_STEPS.length - 1) { tutClose(); return; }
    _tutorialStep++;
    tutShowStep(_tutorialStep);
  }

  function tutPrev() {
    if (_tutorialStep <= 0) return;
    _tutorialStep--;
    tutShowStep(_tutorialStep);
  }

  function tutClose() {
    try { localStorage.setItem('tg_tutorial_done', '1'); } catch (e) {}
    if (_tutorialOverlay) {
      _tutorialOverlay.classList.add('tut-overlay-saliendo');
      setTimeout(function () {
        if (_tutorialOverlay) {
          _tutorialOverlay.style.display = 'none';
          _tutorialOverlay.classList.remove('tut-overlay-saliendo');
        }
      }, 350);
    }
    _tutorialActive = false;
  }

  function abrirTutorial() {
    tutInit();
    _tutorialStep  = 0;
    _tutorialActive = true;
    if (_tutorialOverlay) _tutorialOverlay.style.display = 'flex';
    tutShowStep(0);
  }

  function setupTutorial() {
    try {
      tutInit();
      var done = localStorage.getItem('tg_tutorial_done');
      if (!done) setTimeout(abrirTutorial, 1400);
    } catch (e) { console.error('features_ui: setupTutorial error', e); }
  }

  window.abrirTutorialInteractivo = abrirTutorial;


  // ══════════════════════════════════════════════
  // FEATURE 4 — COMPARTIR RESULTADO
  // ══════════════════════════════════════════════

  var FRASES_RELATOR = [
    '¡Y el truco argentino sigue siendo el mejor del mundo!',
    '¡Qué partidazo! El fútbol y el truco, pasiones nacionales.',
    '¡Envido al corazón, truco a la cabeza!',
    '¡La remontada del siglo! Truco GOL no perdona.',
    '¡Se terminó! El árbitro cobró los puntos finales.',
    '¡Goool de truco! La tribuna enloquece.',
    '¡Flor de partida! Así se juega en Argentina.'
  ];

  function compartirResultado(datosPartida) {
    try {
      var canvas = document.createElement('canvas');
      canvas.width  = 600;
      canvas.height = 400;
      var ctx = canvas.getContext('2d');

      // fondo cancha
      var grad = ctx.createLinearGradient(0, 0, 0, 400);
      grad.addColorStop(0, '#0f4a28');
      grad.addColorStop(1, '#060f08');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 600, 400);

      // líneas decorativas de cancha
      ctx.strokeStyle = 'rgba(255,255,255,0.07)';
      ctx.lineWidth   = 2;
      ctx.beginPath();
      ctx.arc(300, 200, 100, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(300, 0);
      ctx.lineTo(300, 400);
      ctx.stroke();

      // logo
      ctx.font        = 'bold 52px Impact, "Arial Narrow", sans-serif';
      ctx.fillStyle   = '#f5c518';
      ctx.textAlign   = 'center';
      ctx.shadowColor = 'rgba(0,0,0,0.8)';
      ctx.shadowBlur  = 12;
      ctx.fillText('TRUCO GOL', 300, 72);

      // línea separadora
      ctx.shadowBlur  = 0;
      ctx.strokeStyle = '#f5c518';
      ctx.lineWidth   = 2;
      ctx.beginPath();
      ctx.moveTo(60, 90);
      ctx.lineTo(540, 90);
      ctx.stroke();

      var pJ = datosPartida ? datosPartida.puntosJugador : 0;
      var pR = datosPartida ? datosPartida.puntosRival   : 0;
      var ganaste = pJ >= pR;

      // marcador
      ctx.font        = 'bold 96px Impact, sans-serif';
      ctx.fillStyle   = '#ffffff';
      ctx.shadowColor = 'rgba(0,0,0,0.9)';
      ctx.shadowBlur  = 16;
      ctx.textAlign   = 'center';
      ctx.fillText(pJ + '  -  ' + pR, 300, 220);

      // etiquetas
      ctx.font      = 'bold 20px Arial, sans-serif';
      ctx.shadowBlur = 6;
      ctx.fillStyle = '#aaffaa';
      ctx.fillText('VOS', 140, 250);
      ctx.fillStyle = '#ffaaaa';
      ctx.fillText('RIVAL', 460, 250);

      // resultado
      ctx.font        = 'bold 28px Impact, sans-serif';
      ctx.fillStyle   = ganaste ? '#f5c518' : '#ff6666';
      ctx.shadowColor = 'rgba(0,0,0,0.9)';
      ctx.shadowBlur  = 10;
      ctx.fillText(ganaste ? '¡VICTORIA!' : 'DERROTA', 300, 295);

      // frase relator con wrap
      var frase  = FRASES_RELATOR[Math.floor(Math.random() * FRASES_RELATOR.length)];
      ctx.font   = 'italic 16px Arial, sans-serif';
      ctx.fillStyle  = 'rgba(255,255,255,0.75)';
      ctx.shadowBlur = 0;
      var words  = frase.split(' ');
      var line   = '';
      var y      = 332;
      for (var i = 0; i < words.length; i++) {
        var test = line + words[i] + ' ';
        if (ctx.measureText(test).width > 480 && i > 0) {
          ctx.fillText(line.trim(), 300, y);
          line = words[i] + ' ';
          y   += 22;
        } else {
          line = test;
        }
      }
      ctx.fillText(line.trim(), 300, y);

      // URL
      ctx.font      = 'bold 13px Arial, sans-serif';
      ctx.fillStyle = 'rgba(245,197,24,0.6)';
      ctx.fillText('trucogol.netlify.app', 300, 388);

      canvas.toBlob(function (blob) {
        if (!blob) return;
        var file = new File([blob], 'trucogol-resultado.png', { type: 'image/png' });
        if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
          navigator.share({ files: [file], title: 'Truco GOL', text: '¡Jugá Truco Argentino! 🃏⚽' })
            .catch(function () { _descargarImagen(blob); });
        } else {
          _descargarImagen(blob);
        }
      }, 'image/png');
    } catch (e) { console.error('features_ui: compartirResultado error', e); }
  }

  function _descargarImagen(blob) {
    var a    = document.createElement('a');
    a.href   = URL.createObjectURL(blob);
    a.download = 'trucogol-resultado.png';
    a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 5000);
  }

  function _inyectarBotonCompartir(btns, data) {
    if (btns.querySelector('.ext-compartir-btn')) return;
    var btn      = document.createElement('button');
    btn.className = 'btn ext-compartir-btn';
    btn.innerHTML = '📤 COMPARTIR';
    btn.title     = 'Compartir resultado como imagen';
    btn.onclick   = function () { compartirResultado(data); };
    btns.appendChild(btn);
  }

  window.compartirResultadoTrucoGol = compartirResultado;


  // ══════════════════════════════════════════════
  // FEATURE 2 — REVANCHA
  // ══════════════════════════════════════════════

  function setupRevancha() {
    try {
      onJuego('finDePartido', function (data) {
        setTimeout(function () {
          try {
            var btns = document.getElementById('result-buttons');
            if (!btns) return;

            if (!btns.querySelector('.ext-revancha-btn')) {
              var btn      = document.createElement('button');
              btn.className = 'btn ext-revancha-btn';
              btn.innerHTML = '🔄 REVANCHA';
              btn.title     = 'Jugar otro partido con el mismo rival';
              btn.onclick   = function () {
                closeModal('result-modal');
                if (typeof reiniciarPartida === 'function') reiniciarPartida();
              };
              btns.appendChild(btn);
            }

            _inyectarBotonCompartir(btns, data);
          } catch (e) { console.error('features_ui: revancha inject error', e); }
        }, 420);
      });
    } catch (e) { console.error('features_ui: setupRevancha error', e); }
  }


  // ══════════════════════════════════════════════
  // FEATURE 3 — PERFIL DE DT
  // ══════════════════════════════════════════════

  var RANGOS = [
    { min: 0,   max: 30,  nombre: 'Juvenil',           icono: '🥉' },
    { min: 30,  max: 50,  nombre: 'Amateur',            icono: '🥈' },
    { min: 50,  max: 65,  nombre: 'Profesional',        icono: '🥇' },
    { min: 65,  max: 80,  nombre: 'Primera División',   icono: '⭐' },
    { min: 80,  max: 101, nombre: 'Selección Nacional', icono: '🌟' }
  ];

  function _getRango(ef) {
    for (var i = 0; i < RANGOS.length; i++) {
      if (ef >= RANGOS[i].min && ef < RANGOS[i].max) return RANGOS[i];
    }
    return RANGOS[0];
  }

  function _crearModalPerfil() {
    if (document.getElementById('tut-perfil-modal')) return;
    var modal = document.createElement('div');
    modal.className = 'modal';
    modal.id        = 'tut-perfil-modal';
    modal.innerHTML =
      '<div class="modal-box perfil-box">' +
        '<button class="perfil-close-btn" onclick="closeModal(\'tut-perfil-modal\')">✕</button>' +
        '<div class="perfil-header">' +
          '<div class="perfil-avatar-wrap"><span id="perfil-avatar" class="perfil-avatar">🤠</span></div>' +
          '<div class="perfil-header-info">' +
            '<div id="perfil-nombre" class="perfil-nombre">DT</div>' +
            '<div id="perfil-rango-badge" class="perfil-rango-badge">🥉 Juvenil</div>' +
          '</div>' +
        '</div>' +
        '<div class="perfil-escudo-wrap">' +
          '<div id="perfil-escudo" class="perfil-escudo-placeholder">🛡️</div>' +
          '<div id="perfil-equipo-nombre" class="perfil-equipo-nombre">Sin equipo</div>' +
        '</div>' +
        '<div class="perfil-stats-grid">' +
          '<div class="perfil-stat-card"><div class="perfil-stat-num" id="ps-jugadas">0</div><div class="perfil-stat-lbl">Partidas</div></div>' +
          '<div class="perfil-stat-card"><div class="perfil-stat-num stat-win" id="ps-ganadas">0</div><div class="perfil-stat-lbl">Ganadas</div></div>' +
          '<div class="perfil-stat-card"><div class="perfil-stat-num stat-lose" id="ps-perdidas">0</div><div class="perfil-stat-lbl">Perdidas</div></div>' +
          '<div class="perfil-stat-card"><div class="perfil-stat-num stat-gold" id="ps-efectividad">0%</div><div class="perfil-stat-lbl">Efectividad</div></div>' +
        '</div>' +
        '<div class="perfil-barra-wrap">' +
          '<div class="perfil-barra-lbl"><span>Progreso de rango</span><span id="ps-barra-pct">0%</span></div>' +
          '<div class="perfil-barra-bg"><div class="perfil-barra-fill" id="ps-barra-fill" style="width:0%"></div></div>' +
          '<div class="perfil-rango-labels"><span>🥉</span><span>🥈</span><span>🥇</span><span>⭐</span><span>🌟</span></div>' +
        '</div>' +
        '<div class="perfil-logros-titulo">Logros</div>' +
        '<div class="perfil-logros-grid" id="ps-logros"></div>' +
        '<button class="btn primary" style="width:100%;margin-top:14px;" onclick="closeModal(\'tut-perfil-modal\')">CERRAR</button>' +
      '</div>';
    document.body.appendChild(modal);
  }

  function _getLogros(stats) {
    var logros = [];
    if (stats.partidasJugadas >= 1)   logros.push({ icono: '🎮', nombre: 'Debut',          desc: 'Primera partida jugada' });
    if (stats.partidasJugadas >= 10)  logros.push({ icono: '🔟', nombre: 'Veterano',        desc: '10 partidas jugadas' });
    if (stats.partidasJugadas >= 50)  logros.push({ icono: '🏅', nombre: 'Experimentado',   desc: '50 partidas jugadas' });
    if (stats.partidasGanadas  >= 1)  logros.push({ icono: '🏆', nombre: 'Primera Copa',    desc: 'Primera victoria' });
    if (stats.partidasGanadas  >= 5)  logros.push({ icono: '⭐', nombre: 'Ganador Serial',  desc: '5 victorias' });
    if (stats.partidasGanadas  >= 20) logros.push({ icono: '🌟', nombre: 'Crack',           desc: '20 victorias' });
    var ef = stats.partidasJugadas ? Math.round((stats.partidasGanadas / stats.partidasJugadas) * 100) : 0;
    if (ef >= 60) logros.push({ icono: '🎯', nombre: 'Preciso',    desc: '60% efectividad' });
    if (ef >= 80) logros.push({ icono: '🔥', nombre: 'Imparable',  desc: '80% efectividad' });
    if (logros.length === 0) logros.push({ icono: '🌱', nombre: 'Empezando', desc: 'Jugá tu primera partida' });
    return logros;
  }

  function _rellenarPerfil() {
    try {
      var stats   = (typeof ESTADISTICAS !== 'undefined') ? ESTADISTICAS : { partidasJugadas: 0, partidasGanadas: 0, partidasPerdidas: 0 };
      var ef      = stats.partidasJugadas ? Math.round((stats.partidasGanadas / stats.partidasJugadas) * 100) : 0;
      var rango   = _getRango(ef);

      var avatarEl  = document.getElementById('perfil-avatar');
      var nombreEl  = document.getElementById('perfil-nombre');
      var rangoEl   = document.getElementById('perfil-rango-badge');
      var escudoEl  = document.getElementById('perfil-escudo');
      var equipoNEl = document.getElementById('perfil-equipo-nombre');

      if (avatarEl && typeof S !== 'undefined') avatarEl.textContent = S.avatarJugador || '🤠';
      if (nombreEl && typeof S !== 'undefined') nombreEl.textContent = S.nombreJugador || 'DT';
      if (rangoEl) rangoEl.textContent = rango.icono + ' ' + rango.nombre;

      if (typeof clubCargar === 'function') {
        var club = clubCargar();
        if (club && club.fundado) {
          if (escudoEl)  escudoEl.textContent  = '🛡️';
          if (equipoNEl) equipoNEl.textContent = club.nombre || 'Mi Club';
        } else {
          if (escudoEl)  escudoEl.textContent  = '🛡️';
          if (equipoNEl) equipoNEl.textContent = 'Sin club fundado';
        }
      }

      var _s = function (id, val) { var el = document.getElementById(id); if (el) el.textContent = val; };
      _s('ps-jugadas',     stats.partidasJugadas);
      _s('ps-ganadas',     stats.partidasGanadas);
      _s('ps-perdidas',    stats.partidasPerdidas);
      _s('ps-efectividad', ef + '%');

      var fill  = document.getElementById('ps-barra-fill');
      var pctEl = document.getElementById('ps-barra-pct');
      if (fill)  fill.style.width    = Math.min(ef, 100) + '%';
      if (pctEl) pctEl.textContent   = ef + '%';

      var logrosEl = document.getElementById('ps-logros');
      if (logrosEl) {
        var logros = _getLogros(stats);
        var html   = '';
        for (var i = 0; i < logros.length; i++) {
          var l = logros[i];
          html += '<div class="perfil-logro-item" title="' + l.desc + '">' +
                    '<span class="perfil-logro-icono">' + l.icono + '</span>' +
                    '<span class="perfil-logro-nombre">' + l.nombre + '</span>' +
                  '</div>';
        }
        logrosEl.innerHTML = html;
      }
    } catch (e) { console.error('features_ui: _rellenarPerfil error', e); }
  }

  function abrirPerfilDT() {
    try {
      _crearModalPerfil();
      _rellenarPerfil();
      if (typeof openModal === 'function') openModal('tut-perfil-modal');
    } catch (e) { console.error('features_ui: abrirPerfilDT error', e); }
  }

  function setupPerfilDT() {
    try {
      _crearModalPerfil();

      var fabGroup = document.getElementById('fab-group');
      if (fabGroup && !fabGroup.querySelector('.fab-perfil-dt')) {
        var fabBtn      = document.createElement('button');
        fabBtn.className = 'fab fab-perfil-dt';
        fabBtn.title     = 'Perfil de DT';
        fabBtn.textContent = '👤';
        fabBtn.onclick   = abrirPerfilDT;
        fabGroup.insertBefore(fabBtn, fabGroup.firstChild);
      }

      var mmFooter = document.querySelector('.mm-footer');
      if (mmFooter && !mmFooter.querySelector('.mm-link-perfil-dt')) {
        var link      = document.createElement('button');
        link.className = 'mm-link mm-link-perfil-dt';
        link.textContent = '👤 Perfil';
        link.onclick   = abrirPerfilDT;
        mmFooter.appendChild(link);
      }
    } catch (e) { console.error('features_ui: setupPerfilDT error', e); }
  }

  window.abrirPerfilDT = abrirPerfilDT;


  // ══════════════════════════════════════════════
  // INIT
  // ══════════════════════════════════════════════

  function init() {
    try { setupTutorial(); } catch (e) { console.error('features_ui: tutorial',  e); }
    try { setupRevancha(); } catch (e) { console.error('features_ui: revancha',  e); }
    try { setupPerfilDT(); } catch (e) { console.error('features_ui: perfilDT',  e); }
  }

  window.addEventListener('load', function () { setTimeout(init, 300); });

})();
