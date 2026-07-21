// ══════════════════════════════════════════════════════════════
// features_adaptive.js — Dificultad Adaptativa + Frases de Provocación
// Depende de: juego.js (onJuego, S, _dificultadIA), juego_ui.js (fraseRivalCanto)
// ══════════════════════════════════════════════════════════════
(function () {
  'use strict';

  // ─────────────────────────────────────────────────────────────
  // CONSTANTES
  // ─────────────────────────────────────────────────────────────
  const ADAPTIVE = {
    ventana:         10,   // últimas N partidas consideradas
    umbral_facil:    0.35, // gana menos del 35% → bajar dificultad
    umbral_dificil:  0.70, // gana más del 70% → subir dificultad
    cooldown:        3,    // no cambiar más seguido que cada 3 partidas
  };

  const NIVELES   = ['facil', 'normal', 'dificil'];
  const BADGE_CFG = {
    facil:   { emoji: '🟢', label: 'Fácil'  },
    normal:  { emoji: '🟡', label: 'Normal' },
    dificil: { emoji: '🔴', label: 'Difícil'},
  };

  const TOASTS_BAJA = [
    'El DT rival está teniendo un mal día 😅',
    'El banco de suplentes tomó el mando 😅',
    'El rival aflojó el ritmo 😌',
  ];
  const TOASTS_SUBA = [
    'La IA aprendió de vos 🧠',
    'El rival subió el nivel 🔥',
    '¡El DT rival se puso las pilas! 🧠',
  ];

  // ─────────────────────────────────────────────────────────────
  // ESTADO ADAPTATIVO
  // ─────────────────────────────────────────────────────────────
  let historialAdaptativo = [];
  let dificultadActual    = 'normal';
  let partidasSinCambio   = 0;

  let _dificultadIA_original = null;

  function _cargarHistorial() {
    try {
      const raw = localStorage.getItem('tg_historial_adaptativo');
      historialAdaptativo = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(historialAdaptativo)) historialAdaptativo = [];
    } catch (e) {
      historialAdaptativo = [];
    }
  }

  function _guardarHistorial() {
    try {
      const recorte = historialAdaptativo.slice(-20);
      localStorage.setItem('tg_historial_adaptativo', JSON.stringify(recorte));
    } catch (e) { /* storage lleno: ignorar */ }
  }

  function _calcularWinrate() {
    const ventana = historialAdaptativo.slice(-ADAPTIVE.ventana);
    if (ventana.length === 0) return 0.5;
    return ventana.filter(Boolean).length / ventana.length;
  }

  // ─────────────────────────────────────────────────────────────
  // WRAPPERS DE _dificultadIA
  // ─────────────────────────────────────────────────────────────
  function _aplicarNivel(nivel) {
    if (!_dificultadIA_original) return;

    if (nivel === 'normal') {
      window._dificultadIA = _dificultadIA_original;
      return;
    }

    if (nivel === 'facil') {
      window._dificultadIA = function () { return 0; };
      return;
    }

    if (nivel === 'dificil') {
      window._dificultadIA = function () { return 1; };
      return;
    }
  }

  // Override de logicaOfensivaRival para errores de propósito en fácil
  let _logicaOfensiva_original = null;

  function _hookLogicaOfensiva() {
    if (typeof window.logicaOfensivaRival !== 'function') return;
    if (_logicaOfensiva_original) return;

    _logicaOfensiva_original = window.logicaOfensivaRival;

    window.logicaOfensivaRival = function () {
      if (dificultadActual !== 'facil') {
        return _logicaOfensiva_original.apply(this, arguments);
      }

      // 30% de chance de ir al mazo en primera ronda sin canto activo
      if (Math.random() < 0.30
          && typeof window.irseAlMazo === 'function'
          && typeof window.S !== 'undefined'
          && window.S.rondaActual === 0
          && !window.S.cantoPendiente) {
        window.irseAlMazo('rival');
        return;
      }

      // La lógica normal corre con _dificultadIA() devolviendo 0
      return _logicaOfensiva_original.apply(this, arguments);
    };
  }

  function _unhookLogicaOfensiva() {
    if (_logicaOfensiva_original) {
      window.logicaOfensivaRival = _logicaOfensiva_original;
      _logicaOfensiva_original   = null;
    }
  }

  // ─────────────────────────────────────────────────────────────
  // AJUSTE DE DIFICULTAD
  // ─────────────────────────────────────────────────────────────
  function _ajustarDificultad() {
    partidasSinCambio++;
    if (partidasSinCambio < ADAPTIVE.cooldown) return;

    const wr   = _calcularWinrate();
    const actual = dificultadActual;
    let   nuevo  = actual;

    if (wr < ADAPTIVE.umbral_facil && actual !== 'facil') {
      nuevo = actual === 'dificil' ? 'normal' : 'facil';
    } else if (wr > ADAPTIVE.umbral_dificil && actual !== 'dificil') {
      nuevo = actual === 'facil' ? 'normal' : 'dificil';
    }

    if (nuevo !== actual) {
      const subiendo = NIVELES.indexOf(nuevo) > NIVELES.indexOf(actual);
      dificultadActual  = nuevo;
      partidasSinCambio = 0;

      _aplicarNivel(nuevo);
      _actualizarBadge();
      _actualizarPerfilDT();
      _toastAdaptativo(subiendo ? TOASTS_SUBA : TOASTS_BAJA);

      if (nuevo === 'facil') _hookLogicaOfensiva();
      else                   _unhookLogicaOfensiva();
    }
  }

  function _registrarResultado(ganoJugador) {
    historialAdaptativo.push(!!ganoJugador);
    _guardarHistorial();
    _ajustarDificultad();
  }

  // ─────────────────────────────────────────────────────────────
  // UI — BADGE
  // ─────────────────────────────────────────────────────────────
  function _crearBadge() {
    if (document.getElementById('ext-adaptive-badge')) return;
    const badge      = document.createElement('div');
    badge.id         = 'ext-adaptive-badge';
    badge.title      = 'Dificultad adaptativa';
    badge.setAttribute('aria-label', 'Nivel de dificultad');
    badge.textContent = BADGE_CFG[dificultadActual].emoji;
    const mesa = document.getElementById('mesa');
    (mesa || document.body).appendChild(badge);
  }

  function _actualizarBadge() {
    const badge = document.getElementById('ext-adaptive-badge');
    if (!badge) return;
    badge.textContent    = BADGE_CFG[dificultadActual].emoji;
    badge.dataset.nivel  = dificultadActual;
    badge.classList.remove('ext-badge-pulse');
    void badge.offsetWidth;
    badge.classList.add('ext-badge-pulse');
  }

  function _actualizarPerfilDT() {
    const el = document.getElementById('ext-perfil-dificultad');
    if (!el) return;
    el.textContent = 'Dificultad actual: ' + BADGE_CFG[dificultadActual].label;
  }

  function _toastAdaptativo(lista) {
    if (typeof window.showToast !== 'function') return;
    const txt = lista[Math.floor(Math.random() * lista.length)];
    window.showToast(txt, 2800);
  }

  // ─────────────────────────────────────────────────────────────
  // SETUP ADAPTATIVO
  // ─────────────────────────────────────────────────────────────
  function setupAdaptativo() {
    _cargarHistorial();

    if (typeof window._dificultadIA === 'function') {
      _dificultadIA_original = window._dificultadIA;
    }

    // Calcular nivel inicial con el historial guardado
    const wr = _calcularWinrate();
    if (historialAdaptativo.length >= ADAPTIVE.ventana) {
      if (wr < ADAPTIVE.umbral_facil)        dificultadActual = 'facil';
      else if (wr > ADAPTIVE.umbral_dificil) dificultadActual = 'dificil';
      else                                   dificultadActual = 'normal';
    }

    _aplicarNivel(dificultadActual);
    if (dificultadActual === 'facil') _hookLogicaOfensiva();

    _crearBadge();
    _actualizarBadge();

    if (typeof window.onJuego === 'function') {
      window.onJuego('finDePartido', function (data) {
        const ganoJugador = data && data.puntosJugador >= data.limite;
        _registrarResultado(ganoJugador);
        _crearBadge();
        _actualizarBadge();
        _actualizarPerfilDT();
      });

      window.onJuego('nuevoPartido', function () {
        _crearBadge();
        _actualizarBadge();
      });

      window.onJuego('render', function () {
        if (!document.getElementById('ext-adaptive-badge')) {
          _crearBadge();
          _actualizarBadge();
        }
      });
    }
  }

  // ─────────────────────────────────────────────────────────────
  // FRASES DE PROVOCACIÓN
  // ─────────────────────────────────────────────────────────────
  const FRASES_JUGADOR = [
    { emoji: '😤', texto: '¡Qué mano te tocó!',   id: 'burla'   },
    { emoji: '🤫', texto: 'Silencio, pienso yo.',  id: 'silencio'},
    { emoji: '🎯', texto: 'Ya te vi venir.',        id: 'leyo'   },
    { emoji: '🃏', texto: '¡Truco va a ser!',       id: 'amago'  },
    { emoji: '⚽', texto: '¡Golazo de mano!',       id: 'gol'    },
    { emoji: '🤝', texto: 'Buena mano, rival.',     id: 'fair'   },
  ];

  const FRASES_IA = {
    canta_truco:     ['¡Truco va, DT!', '¿Aceptás o te rajás?', '¡Dale, animate!'],
    gana_ronda:      ['¡Una menos!', '¡Qué cartón!', '¿Y ahora qué, DT?'],
    responde_truco:  ['Tranquilo, que te espero.', '¡Quiero!', 'Veamos esas cartas...'],
    va_al_mazo:      ['Esta vez te la regalo.', 'Estrategia, DT, estrategia.', 'Aguardá que vuelvo.'],
    respuesta_burla: ['Ja, hablás mucho.', 'Las cartas hablan solas.', '¡Veremos al final!'],
    va_ganando:      ['¿Cuándo salís campeón vos?', '¡Imposible pararme!', '¡DT del año soy yo!'],
    canta_envido:    ['¡Los puntos son míos!', 'Suma eso, DT.', '¡Envido con todo!'],
    gana_partida:    ['¡Ganamos el clásico!', '¡La copa es nuestra!', 'Eso se llama categoría.'],
  };

  const COOLDOWN_JUGADOR_MS = 8000;
  const PROB_FRASE_IA       = 0.60;

  let lastFraseJugadorTime = 0;
  let _ultimaFraseIA       = '';

  function _pick(arr) {
    if (!arr || arr.length === 0) return '';
    return arr[Math.floor(Math.random() * arr.length)];
  }

  function _mostrarFraseJugador(frase) {
    let burbuja = document.getElementById('ext-frase-bubble-j');
    if (!burbuja) {
      burbuja        = document.createElement('div');
      burbuja.id     = 'ext-frase-bubble-j';
      burbuja.className = 'ext-frase-bubble ext-frase-bubble--jugador';
      (document.getElementById('mesa') || document.body).appendChild(burbuja);
    }
    burbuja.innerHTML = '<span class="ext-frase-avatar">' + frase.emoji + '</span>'
                      + '<span class="ext-frase-texto">' + frase.texto + '</span>';
    burbuja.classList.remove('ext-frase-show', 'ext-frase-hide');
    void burbuja.offsetWidth;
    burbuja.classList.add('ext-frase-show');
    clearTimeout(burbuja._t);
    burbuja._t = setTimeout(function () {
      burbuja.classList.add('ext-frase-hide');
    }, 2500);
  }

  function _mostrarFraseIA(texto) {
    if (!texto) return;
    if (Math.random() > PROB_FRASE_IA) return;
    if (texto === _ultimaFraseIA) return;
    _ultimaFraseIA = texto;

    let burbuja = document.getElementById('ext-frase-bubble-r');
    if (!burbuja) {
      burbuja        = document.createElement('div');
      burbuja.id     = 'ext-frase-bubble-r';
      burbuja.className = 'ext-frase-bubble ext-frase-bubble--rival';
      (document.getElementById('mesa') || document.body).appendChild(burbuja);
    }

    var iconoRival = '🤖';
    if (typeof window.AVATARS !== 'undefined' && typeof window.S !== 'undefined'
        && window.AVATARS[window.S.idRival]) {
      iconoRival = window.AVATARS[window.S.idRival].icon || iconoRival;
    }

    burbuja.innerHTML = '<span class="ext-frase-avatar">' + iconoRival + '</span>'
                      + '<span class="ext-frase-texto">' + texto + '</span>';
    burbuja.classList.remove('ext-frase-show', 'ext-frase-hide');
    void burbuja.offsetWidth;
    burbuja.classList.add('ext-frase-show');
    clearTimeout(burbuja._t);
    burbuja._t = setTimeout(function () {
      burbuja.classList.add('ext-frase-hide');
    }, 2500);
  }

  function _crearPanelFrases() {
    if (document.getElementById('ext-frases-panel')) return;

    var panel = document.createElement('div');
    panel.id  = 'ext-frases-panel';
    panel.className = 'ext-frases-panel';

    FRASES_JUGADOR.forEach(function (frase) {
      var btn = document.createElement('button');
      btn.className   = 'ext-frase-btn';
      btn.title       = frase.texto;
      btn.dataset.id  = frase.id;
      btn.textContent = frase.emoji;
      btn.setAttribute('aria-label', frase.texto);

      btn.addEventListener('click', function () {
        var ahora = Date.now();
        if (ahora - lastFraseJugadorTime < COOLDOWN_JUGADOR_MS) {
          btn.classList.add('ext-frase-btn--blocked');
          setTimeout(function () { btn.classList.remove('ext-frase-btn--blocked'); }, 400);
          return;
        }
        lastFraseJugadorTime = ahora;
        _mostrarFraseJugador(frase);

        if (frase.id === 'burla' || frase.id === 'amago') {
          setTimeout(function () {
            _mostrarFraseIA(_pick(FRASES_IA.respuesta_burla));
          }, 800 + Math.random() * 600);
        }
      });

      panel.appendChild(btn);
    });

    (document.getElementById('mesa') || document.body).appendChild(panel);
  }

  function _hookFraseRivalCanto() {
    var original = window.fraseRivalCanto;
    if (typeof original !== 'function') return;

    window.fraseRivalCanto = function (tipo) {
      original.apply(this, arguments);

      var pool = null;
      if (tipo === 'truco' || tipo === 'retruco' || tipo === 'vale4') {
        pool = FRASES_IA.canta_truco;
      } else if (tipo === 'envido' || tipo === 'real' || tipo === 'falta') {
        pool = FRASES_IA.canta_envido;
      } else if (tipo === 'quiero') {
        pool = FRASES_IA.responde_truco;
      } else if (tipo === 'mazo') {
        pool = FRASES_IA.va_al_mazo;
      }

      if (pool) {
        setTimeout(function () { _mostrarFraseIA(_pick(pool)); }, 400);
      }
    };
  }

  function _hookEventosPartida() {
    if (typeof window.onJuego !== 'function') return;

    window.onJuego('render', function () {
      if (typeof window.S === 'undefined') return;
      var ganadoresFiltradas = (window.S.ganadoresRonda || []).filter(Boolean);
      var ultimoGanador      = ganadoresFiltradas[ganadoresFiltradas.length - 1];

      if (ultimoGanador === 'rival'
          && ganadoresFiltradas.length !== window._extLastRondaCount) {
        window._extLastRondaCount = ganadoresFiltradas.length;
        setTimeout(function () {
          _mostrarFraseIA(_pick(FRASES_IA.gana_ronda));
        }, 600);

        if (window.S.puntosRival > window.S.puntosJugador + 5) {
          setTimeout(function () {
            _mostrarFraseIA(_pick(FRASES_IA.va_ganando));
          }, 1800);
        }
      }
    });

    window.onJuego('finDePartido', function (data) {
      window._extLastRondaCount = 0;
      if (data && data.puntosRival >= data.limite) {
        setTimeout(function () {
          _ultimaFraseIA = '';
          _mostrarFraseIA(_pick(FRASES_IA.gana_partida));
        }, 800);
      }
    });

    window.onJuego('nuevoPartido', function () {
      window._extLastRondaCount = 0;
      _crearPanelFrases();
      _crearBadge();
      _actualizarBadge();
    });
  }

  function _controlarVisibilidadPanel() {
    var mesaEl = document.getElementById('mesa');
    if (!mesaEl) return;

    var obs = new MutationObserver(function () {
      var panel = document.getElementById('ext-frases-panel');
      if (!panel) return;
      var st = getComputedStyle(mesaEl);
      var visible = st.display !== 'none' && st.visibility !== 'hidden';
      panel.style.display = visible ? 'flex' : 'none';
    });
    obs.observe(mesaEl, { attributes: true, attributeFilter: ['style', 'class'] });
  }

  // ─────────────────────────────────────────────────────────────
  // SETUP FRASES
  // ─────────────────────────────────────────────────────────────
  function setupFrases() {
    _crearPanelFrases();
    _hookFraseRivalCanto();
    _hookEventosPartida();
    requestAnimationFrame(_controlarVisibilidadPanel);
  }

  // ─────────────────────────────────────────────────────────────
  // INIT
  // ─────────────────────────────────────────────────────────────
  function init() {
    try { setupAdaptativo(); } catch (e) { console.warn('[adaptive] adaptativo:', e); }
    try { setupFrases();     } catch (e) { console.warn('[adaptive] frases:', e); }
  }

  if (document.readyState === 'complete') {
    setTimeout(init, 800);
  } else {
    window.addEventListener('load', function () { setTimeout(init, 800); });
  }

  // API pública mínima (se sobreescribe en init con versiones completas)
  window.getDificultadAdaptativa = function () { return dificultadActual; };
  window.getWinrateAdaptativo    = function () { return _calcularWinrate(); };
  window.setDificultadAdaptativa = function (nivel) {
    if (NIVELES.indexOf(nivel) === -1) return;
    dificultadActual = nivel;
    _aplicarNivel(nivel);
    if (nivel === 'facil') _hookLogicaOfensiva();
    else                   _unhookLogicaOfensiva();
    _actualizarBadge();
    _actualizarPerfilDT();
  };

})();
