// ══════════════════════════════════════════════════════════════
// features_gameplay.js — IA Personalidades, Clima, Vestuario, Maratón, Desafío
// No modifica juego.js ni juego_ui.js directamente. Wrappea funciones
// globales y se suscribe al bus de eventos (onJuego).
// ══════════════════════════════════════════════════════════════
(function () {
  'use strict';

  // ─────────────────────────────────────────────────────────────
  // INIT — espera a que el motor esté listo
  // ─────────────────────────────────────────────────────────────
  function init() {
    try { setupPersonalidadIA(); }   catch (e) { console.warn('[fg] personalidad:', e); }
    try { setupClima(); }            catch (e) { console.warn('[fg] clima:', e); }
    try { setupVestuario(); }        catch (e) { console.warn('[fg] vestuario:', e); }
    try { setupMaraton(); }          catch (e) { console.warn('[fg] maraton:', e); }
    try { setupDesafioDiario(); }    catch (e) { console.warn('[fg] desafio:', e); }
    try { _setupRenderHooks(); }     catch (e) { console.warn('[fg] render hooks:', e); }
  }

  window.addEventListener('load', () => setTimeout(init, 500));

  // ══════════════════════════════════════════════════════════════
  // FEATURE 1 — IA CON PERSONALIDAD
  // ══════════════════════════════════════════════════════════════

  const PERSONALIDADES_IA = {
    agresivo: {
      id: 'agresivo',
      nombre: 'El Agresivo',
      emoji: '🔥',
      desc: 'Siempre canta truco, no le importa lo que tiene',
      trucoBonus: 0.4,
      mazoMalus: 0.2,
    },
    conservador: {
      id: 'conservador',
      nombre: 'El Conservador',
      emoji: '🛡️',
      desc: 'Solo canta cuando tiene cartas buenas',
      trucoMalus: 0.3,
      mazoBueno: 0.4,
    },
    bluffero: {
      id: 'bluffero',
      nombre: 'El Bluffero',
      emoji: '🎭',
      desc: 'Miente seguido, pero a veces te sorprende',
      bluffChance: 0.35,
      mensajesFarol: [
        'Venite si te animás...',
        'Tengo todo hoy...',
        '¿Cuánto apostás?',
        'Hoy no te llevo ni el mazo...',
      ],
    },
    academico: {
      id: 'academico',
      nombre: 'El Académico',
      emoji: '📚',
      desc: 'Juega según la teoría, nunca improvisa',
      esPuro: true,
    },
  };

  let personalidadActual = null;

  function elegirPersonalidadAleatoria() {
    const ids = Object.keys(PERSONALIDADES_IA);
    return PERSONALIDADES_IA[ids[Math.floor(Math.random() * ids.length)]];
  }

  function setupPersonalidadIA() {
    if (typeof onJuego !== 'function') return;

    onJuego('nuevoPartido', () => {
      personalidadActual = elegirPersonalidadAleatoria();
      setTimeout(mostrarBadgePersonalidad, 400);
      console.log('[fg] Personalidad IA:', personalidadActual.nombre);
    });

    // Wrappear logicaOfensivaRival — agrega comportamiento bluffero antes de actuar
    const _ofensivaOriginal = window.logicaOfensivaRival;
    if (typeof _ofensivaOriginal === 'function') {
      window.logicaOfensivaRival = function () {
        if (personalidadActual && personalidadActual.bluffChance && personalidadActual.mensajesFarol) {
          if (typeof S !== 'undefined' && !S.cantoPendiente && Math.random() < personalidadActual.bluffChance * 0.3) {
            const msgs = personalidadActual.mensajesFarol;
            const msg  = msgs[Math.floor(Math.random() * msgs.length)];
            if (typeof showToast === 'function' && typeof AVATARS !== 'undefined') {
              setTimeout(() => showToast((AVATARS[S.idRival] ? AVATARS[S.idRival].name : 'Rival') + ': "' + msg + '"'), 200);
            }
          }
        }
        return _ofensivaOriginal.apply(this, arguments);
      };
    }

    // Wrappear _decidirAceptarTruco — modifica probabilidades según personalidad
    const _decidirOriginal = window._decidirAceptarTruco;
    if (typeof _decidirOriginal === 'function') {
      window._decidirAceptarTruco = function () {
        const resultado = _decidirOriginal.apply(this, arguments);
        if (!personalidadActual || personalidadActual.esPuro) return resultado;

        const p = personalidadActual;
        const r = Math.random();

        // Agresivo: acepta truco aunque la IA original dijo que no
        if (p.trucoBonus && !resultado && r < p.trucoBonus) return true;
        // Conservador: se va al mazo aunque la IA original dijo sí
        if (p.mazoBueno && resultado && r < p.mazoBueno * 0.4) return false;
        // Bluffero: farolea aceptando sin tener buenas cartas
        if (p.bluffChance && !resultado && r < p.bluffChance) return true;

        return resultado;
      };
    }
  }

  function mostrarBadgePersonalidad() {
    const viejo = document.getElementById('fg-personalidad-badge');
    if (viejo) viejo.remove();
    if (!personalidadActual) return;

    const rivalInfo = document.querySelector('.rival-info');
    if (!rivalInfo) return;

    const badge = document.createElement('div');
    badge.id = 'fg-personalidad-badge';
    badge.className = 'fg-personalidad-badge';
    badge.textContent = personalidadActual.emoji + ' ' + personalidadActual.nombre;
    badge.title = personalidadActual.desc;
    rivalInfo.appendChild(badge);
  }

  window.fgGetPersonalidad = () => personalidadActual;

  // ══════════════════════════════════════════════════════════════
  // FEATURE 2 — CLIMA DEL PARTIDO
  // ══════════════════════════════════════════════════════════════

  let climaActual      = null;
  let _lluviaContainer = null;

  function sortearClima() {
    const r = Math.random();
    if (r < 0.60) return 'normal';
    if (r < 0.85) return 'lluvia';
    if (r < 0.95) return 'viento';
    return 'noche';
  }

  function iniciarClima() {
    limpiarClima();
    climaActual = sortearClima();
    const body = document.body;
    if (climaActual === 'normal') return;

    body.classList.add('clima-' + climaActual);

    if (climaActual === 'lluvia') _crearLluvia();
    if (climaActual === 'viento') _crearViento();

    if (climaActual === 'noche') {
      let ovl = document.getElementById('pano-noche-ovl');
      if (!ovl) {
        ovl = document.createElement('div');
        ovl.id = 'pano-noche-ovl';
        body.appendChild(ovl);
      }
      ovl.style.display = 'block';
      body.classList.add('pano-noche');
    }

    const badges = {
      lluvia: '🌧️ Partido bajo la lluvia',
      viento: '💨 Hay viento hoy',
      noche:  '🌙 Partido nocturno',
    };
    if (badges[climaActual]) _mostrarBadgeClima(badges[climaActual]);
  }

  function limpiarClima() {
    const body = document.body;
    ['clima-lluvia', 'clima-viento', 'clima-noche', 'pano-noche'].forEach(c => body.classList.remove(c));

    const ovl = document.getElementById('pano-noche-ovl');
    if (ovl) ovl.style.display = 'none';

    if (_lluviaContainer) { _lluviaContainer.remove(); _lluviaContainer = null; }
    const vientoEl = document.getElementById('fg-viento-container');
    if (vientoEl) vientoEl.remove();

    const badgeEl = document.getElementById('fg-clima-badge');
    if (badgeEl) badgeEl.remove();

    climaActual = null;
  }

  function _crearLluvia() {
    const c = document.createElement('div');
    c.id = 'fg-lluvia-container';
    c.className = 'fg-lluvia-container';
    for (let i = 0; i < 60; i++) {
      const g = document.createElement('div');
      g.className = 'lluvia-gota';
      g.style.left             = (Math.random() * 100) + '%';
      g.style.animationDelay   = (Math.random() * 2) + 's';
      g.style.animationDuration = (0.4 + Math.random() * 0.6) + 's';
      g.style.opacity          = (0.15 + Math.random() * 0.35);
      g.style.height           = (10 + Math.random() * 16) + 'px';
      c.appendChild(g);
    }
    document.body.appendChild(c);
    _lluviaContainer = c;
  }

  function _crearViento() {
    const c = document.createElement('div');
    c.id = 'fg-viento-container';
    c.className = 'fg-viento-container';
    for (let i = 0; i < 14; i++) {
      const p = document.createElement('div');
      p.className = 'viento-particula';
      p.style.top               = (Math.random() * 100) + '%';
      p.style.animationDelay    = (Math.random() * 3) + 's';
      p.style.animationDuration = (1.5 + Math.random() * 2) + 's';
      p.style.opacity           = (0.08 + Math.random() * 0.2);
      p.style.width             = (40 + Math.random() * 100) + 'px';
      c.appendChild(p);
    }
    document.body.appendChild(c);
  }

  function _mostrarBadgeClima(texto) {
    const infoBar = document.querySelector('.info-bar');
    if (!infoBar) return;
    const b = document.createElement('div');
    b.id = 'fg-clima-badge';
    b.className = 'fg-clima-badge';
    b.textContent = texto;
    infoBar.appendChild(b);
  }

  function setupClima() {
    if (typeof onJuego !== 'function') return;
    onJuego('nuevoPartido', iniciarClima);
  }

  window.fgIniciarClima = iniciarClima;
  window.fgLimpiarClima = limpiarClima;

  // ══════════════════════════════════════════════════════════════
  // FEATURE 3 — PANTALLA DE VESTUARIO ENTRE MANOS
  // ══════════════════════════════════════════════════════════════

  const FRASES_DT = {
    ganando: [
      '¡Seguimos así! No aflojés.',
      '¡Bien, crack! Mantené el nivel.',
      'Gestioná bien y cerramos.',
      '¡Eso! Que transpiren ellos.',
    ],
    perdiendo: [
      '¡Arriba esa cabeza! Diste vuelta peores.',
      'Cambio de chip. Vamos de atrás.',
      '¡Queda cancha! No es el final.',
      "Acordate del '99. Todo es posible.",
    ],
    parejo: [
      'Definición mano a mano. El que aguante gana.',
      'Partido parejo. Quien quiera más se lleva todo.',
      '¡Concentración! Un descuido y chau.',
      'Esto se define en los detalles.',
    ],
    ultimo: [
      '¡TODO O NADA! Esta es la definitiva.',
      'El partido se define ahora. ¡Metele!',
      'Un punto y somos campeones. ¡Vamos!',
      'La final. No hay mañana.',
    ],
  };

  let _manoContador       = 0;
  let _vestTimeout        = null;
  let _primeraManoPasada  = false;

  function _crearVestOverlay() {
    if (document.getElementById('vest-overlay')) return;
    const el = document.createElement('div');
    el.id = 'vest-overlay';
    el.innerHTML =
      '<div class="vest-inner">' +
        '<div class="vest-titulo" id="vest-titulo">⚽ MEDIO TIEMPO</div>' +
        '<div class="vest-frase" id="vest-frase"></div>' +
        '<div class="vest-marcador">' +
          '<div class="vest-score-item"><div class="vest-score-label" id="vest-label-j">VOS</div><div class="vest-score-pts" id="vest-pts-j">0</div></div>' +
          '<div class="vest-score-sep">—</div>' +
          '<div class="vest-score-item"><div class="vest-score-label" id="vest-label-r">RIVAL</div><div class="vest-score-pts" id="vest-pts-r">0</div></div>' +
        '</div>' +
        '<div class="vest-barra-container"><div class="vest-barra-fill" id="vest-barra-fill"></div></div>' +
        '<div class="vest-mano-num" id="vest-mano-num">MANO 1</div>' +
      '</div>';
    document.body.appendChild(el);
  }

  function mostrarVestuario() {
    if (typeof S === 'undefined') return;
    if (!_primeraManoPasada) { _primeraManoPasada = true; return; }

    _crearVestOverlay();
    const el = document.getElementById('vest-overlay');
    if (!el) return;

    const pj  = S.puntosJugador || 0;
    const pr  = S.puntosRival   || 0;
    const lim = S.limitePuntos  || 30;
    const diff = pj - pr;
    const esUltimo = (lim - pj <= 3) || (lim - pr <= 3);

    let clave = 'parejo';
    if (esUltimo)        clave = 'ultimo';
    else if (diff >= 4)  clave = 'ganando';
    else if (diff <= -4) clave = 'perdiendo';

    const frases = FRASES_DT[clave];
    const frase  = frases[Math.floor(Math.random() * frases.length)];
    const titulo = _manoContador <= 1 ? '⚽ MEDIO TIEMPO' : '🔄 MANO ' + _manoContador;
    const nomRival = (typeof AVATARS !== 'undefined' && AVATARS[S.idRival]) ? AVATARS[S.idRival].name : 'Rival';
    const pct = Math.min(100, Math.round((pj / lim) * 100));

    _setTxt('vest-titulo',   titulo);
    _setTxt('vest-frase',    frase);
    _setTxt('vest-pts-j',    pj);
    _setTxt('vest-pts-r',    pr);
    _setTxt('vest-label-j',  (S.nombreJugador || 'VOS').toUpperCase().substring(0, 6));
    _setTxt('vest-label-r',  nomRival.toUpperCase().substring(0, 6));
    _setTxt('vest-mano-num', 'MANO ' + _manoContador);

    const barra = document.getElementById('vest-barra-fill');
    if (barra) barra.style.width = pct + '%';

    el.classList.add('show');

    if (_vestTimeout) clearTimeout(_vestTimeout);
    _vestTimeout = setTimeout(() => el.classList.remove('show'), 2500);
  }

  function _setTxt(id, val) {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  }

  function setupVestuario() {
    if (typeof onJuego !== 'function') return;

    onJuego('nuevoPartido', () => {
      _manoContador      = 0;
      _primeraManoPasada = false;
    });

    onJuego('manoRepartida', () => {
      _manoContador++;
      mostrarVestuario();
    });
  }

  // ══════════════════════════════════════════════════════════════
  // FEATURE 4 — MODO MARATÓN
  // ══════════════════════════════════════════════════════════════

  const MARATON_KEY = 'tg_maraton';

  let maratonState = {
    activo:        false,
    victorias:     0,
    derrotas:      0,
    rachaActual:   0,
    rachaMejor:    0,
    puntosTotales: 0,
  };

  function _maratonCargar() {
    try {
      const d = JSON.parse(localStorage.getItem(MARATON_KEY) || '{}');
      maratonState.rachaMejor    = d.rachaMejor    || 0;
      maratonState.puntosTotales = d.puntosTotales || 0;
    } catch (e) { /* silencio */ }
  }

  function _maratonGuardar() {
    try {
      localStorage.setItem(MARATON_KEY, JSON.stringify({
        rachaMejor:    maratonState.rachaMejor,
        puntosTotales: maratonState.puntosTotales,
      }));
    } catch (e) { /* silencio */ }
  }

  function maratonActivar() {
    maratonState.activo        = true;
    maratonState.victorias     = 0;
    maratonState.derrotas      = 0;
    maratonState.rachaActual   = 0;
    maratonState.puntosTotales = 0;
    _maratonBannerActualizar();
    _maratonBannerMostrar(true);
    if (typeof reiniciarPartida === 'function') reiniciarPartida();
    else if (typeof _iniciarPartida === 'function') _iniciarPartida();
  }

  function maratonDesactivar() {
    maratonState.activo = false;
    _maratonBannerMostrar(false);
    _ocultarModalMaraton();
  }

  function maratonSiguiente() {
    _ocultarModalMaraton();
    _maratonBannerActualizar();
    if (typeof reiniciarPartida === 'function') reiniciarPartida();
    else if (typeof _iniciarPartida === 'function') _iniciarPartida();
  }

  function _maratonBannerMostrar(v) {
    const b = document.getElementById('ext-maraton-banner');
    if (b) b.style.display = v ? 'flex' : 'none';
  }

  function _maratonBannerActualizar() {
    const b = document.getElementById('ext-maraton-banner');
    if (!b) return;
    b.innerHTML =
      '<span class="maraton-banner-ico">🏃</span>' +
      '<span class="maraton-banner-txt">MARATÓN · <strong>' + maratonState.victorias + 'V</strong> - <strong>' + maratonState.derrotas + 'D</strong> · Racha: <strong>' + maratonState.rachaActual + '</strong> · Récord: <strong>' + maratonState.rachaMejor + '</strong></span>' +
      '<button class="maraton-banner-stop" onclick="window.fgMaratonDesactivar()" title="Terminar maratón">✕</button>';
  }

  function _mostrarModalMaraton(ganoJugador) {
    let modal = document.getElementById('fg-maraton-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'fg-maraton-modal';
      modal.className = 'fg-modal-overlay';
      document.body.appendChild(modal);
    }

    const emoji  = ganoJugador ? '🏆' : '😤';
    const titulo = ganoJugador ? '¡VICTORIA!' : 'DERROTA';
    const subtxt = ganoJugador
      ? 'Racha actual: ' + maratonState.rachaActual + ' seguidas'
      : 'Racha cortada';
    const alerta3 = !ganoJugador && maratonState.derrotas >= 3;

    modal.innerHTML =
      '<div class="fg-modal-box">' +
        '<div class="fg-modal-ico">' + emoji + '</div>' +
        '<div class="fg-modal-titulo">' + titulo + '</div>' +
        '<div class="fg-modal-sub">' + subtxt + '</div>' +
        '<div class="maraton-stats">' +
          '<span>✅ ' + maratonState.victorias + ' victorias</span>' +
          '<span>❌ ' + maratonState.derrotas + ' derrotas</span>' +
          '<span>🏅 Récord: ' + maratonState.rachaMejor + '</span>' +
        '</div>' +
        (alerta3 ? '<div class="maraton-alerta">⚠️ Tres derrotas seguidas. ¿Seguís?</div>' : '') +
        '<div class="fg-modal-btns">' +
          '<button class="fg-modal-btn fg-modal-btn-primary" onclick="window.fgMaratonSiguiente()">▶ Siguiente</button>' +
          '<button class="fg-modal-btn fg-modal-btn-secondary" onclick="window.fgMaratonDesactivar()">🚪 Terminar</button>' +
        '</div>' +
      '</div>';

    modal.style.display = 'flex';
  }

  function _ocultarModalMaraton() {
    const m = document.getElementById('fg-maraton-modal');
    if (m) m.style.display = 'none';
  }

  function _crearBannerMaraton() {
    if (document.getElementById('ext-maraton-banner')) return;
    const b = document.createElement('div');
    b.id = 'ext-maraton-banner';
    b.className = 'ext-maraton-banner';
    b.style.display = 'none';
    const mesa = document.getElementById('mesa');
    if (mesa) mesa.insertAdjacentElement('beforebegin', b);
    else document.body.prepend(b);
  }

  function _crearBotonMaratonMenu() {
    if (document.getElementById('fg-btn-maraton')) return;
    const mundial = document.querySelector('.mm-acc-mundial');
    if (!mundial) return;

    const btn = document.createElement('button');
    btn.id = 'fg-btn-maraton';
    btn.className = 'mm-btn mm-btn-secondary fg-btn-maraton';
    btn.innerHTML =
      '<span class="mm-btn-icon">🏃</span>' +
      '<span class="mm-btn-text"><strong>MODO MARATÓN</strong><small>Partidas infinitas encadenadas · Récord: <span id="fg-maraton-record">0</span></small></span>';
    btn.onclick = () => maratonActivar();
    mundial.insertAdjacentElement('afterend', btn);
    _actualizarRecordDisplay();
  }

  function _actualizarRecordDisplay() {
    const el = document.getElementById('fg-maraton-record');
    if (el) el.textContent = maratonState.rachaMejor;
  }

  function setupMaraton() {
    _maratonCargar();
    _crearBannerMaraton();

    const _tryBtn = () => {
      if (document.querySelector('.mm-acc-mundial')) {
        _crearBotonMaratonMenu();
      } else {
        setTimeout(_tryBtn, 400);
      }
    };
    setTimeout(_tryBtn, 700);

    if (typeof onJuego !== 'function') return;

    onJuego('finDePartido', (data) => {
      if (!maratonState.activo) return;

      const gano = data.puntosJugador >= data.limite;
      maratonState.puntosTotales += data.puntosJugador;

      if (gano) {
        maratonState.victorias++;
        maratonState.rachaActual++;
        if (maratonState.rachaActual > maratonState.rachaMejor) {
          maratonState.rachaMejor = maratonState.rachaActual;
        }
      } else {
        maratonState.derrotas++;
        maratonState.rachaActual = 0;
      }

      _maratonGuardar();
      _actualizarRecordDisplay();
      setTimeout(() => _mostrarModalMaraton(gano), 1200);
    });
  }

  window.fgMaratonActivar    = maratonActivar;
  window.fgMaratonDesactivar = maratonDesactivar;
  window.fgMaratonSiguiente  = maratonSiguiente;
  window.fgMaratonState      = maratonState;

  // ══════════════════════════════════════════════════════════════
  // FEATURE 5 — DESAFÍO DIARIO
  // ══════════════════════════════════════════════════════════════

  const DESAFIO_KEY = 'tg_desafio_diario';

  const TIPOS_DESAFIO = [
    { id: 'flor_on',    emoji: '🌸', nombre: 'La Flor Manda',  desc: 'Partida con Flor activada obligatoria',  config: { flor: true } },
    { id: 'rapido',     emoji: '⚡', nombre: 'A 15 Puntos',     desc: 'Partida corta, todo se define rápido',   config: { chico: true } },
    { id: 'sin_envido', emoji: '🚫', nombre: 'Solo Truco',       desc: 'No se puede cantar envido — solo truco', config: { sinEnvido: true } },
    { id: 'dificil',    emoji: '💀', nombre: 'El Pibe en Forma', desc: 'IA al máximo nivel — sin piedad',        config: { dificultad: 'dificil' } },
    { id: 'empate',     emoji: '⚖️', nombre: 'Están Parejos',   desc: 'Empezás con 7 puntos ya marcados',       config: { puntosIniciales: 7 } },
  ];

  function _seedDelDia() {
    const h = new Date();
    return h.getFullYear() * 10000 + (h.getMonth() + 1) * 100 + h.getDate();
  }

  function getDesafioHoy() {
    return TIPOS_DESAFIO[_seedDelDia() % TIPOS_DESAFIO.length];
  }

  function _fechaHoyStr() {
    const h = new Date();
    return h.getFullYear() + '-' + (h.getMonth() + 1) + '-' + h.getDate();
  }

  function _desafioCompletadoHoy() {
    try {
      const d = JSON.parse(localStorage.getItem(DESAFIO_KEY) || '{}');
      return d.fecha === _fechaHoyStr() && d.completado === true;
    } catch (e) { return false; }
  }

  function _marcarDesafioCompletado(gano) {
    try {
      localStorage.setItem(DESAFIO_KEY, JSON.stringify({
        fecha:      _fechaHoyStr(),
        completado: true,
        ganado:     gano,
        desafioId:  getDesafioHoy().id,
      }));
    } catch (e) { /* silencio */ }
  }

  let _desafioActivo = false;

  function jugarDesafioHoy() {
    const desafio = getDesafioHoy();
    _desafioActivo = true;

    // Aplicar config sobre el estado
    if (typeof S !== 'undefined') {
      if (desafio.config.flor)  S.cfgFlor  = true;
      if (desafio.config.chico) {
        S.cfgChico = true;
        S.limitePuntos = 15;
      }
    }

    // Forzar personalidad academico (dificil) si el desafío lo pide
    if (desafio.config.dificultad === 'dificil') {
      personalidadActual = PERSONALIDADES_IA.academico;
    }

    // Arrancar partida
    if (typeof reiniciarPartida === 'function') reiniciarPartida();
    else if (typeof _iniciarPartida === 'function') _iniciarPartida();

    // Puntos iniciales (con delay para que S se inicialice)
    if (desafio.config.puntosIniciales && typeof S !== 'undefined') {
      setTimeout(() => {
        S.puntosJugador = desafio.config.puntosIniciales;
        S.puntosRival   = desafio.config.puntosIniciales;
        if (typeof actualizarTodaLaInterfaz === 'function') actualizarTodaLaInterfaz();
      }, 800);
    }

    _renderCardDesafio();

    // Navegar a la mesa
    if (typeof irA === 'function') irA('mesa');
  }

  function _inyectarCardEnMenu() {
    if (document.getElementById('ext-desafio-card-menu')) return;
    const seccion = document.querySelector('.mm-seccion');
    if (!seccion) return;

    const wrapper = document.createElement('div');
    wrapper.id = 'ext-desafio-card-menu';
    seccion.insertAdjacentElement('afterend', wrapper);
    _renderCardDesafio(wrapper);
  }

  function _renderCardDesafio(container) {
    const el = container || document.getElementById('ext-desafio-card-menu');
    if (!el) return;

    const d = getDesafioHoy();
    const completado = _desafioCompletadoHoy();

    el.innerHTML =
      '<div class="desafio-card' + (completado ? ' completado' : '') + '">' +
        '<div class="desafio-card-header">' +
          '<span class="desafio-card-ico">' + d.emoji + '</span>' +
          '<div class="desafio-card-info">' +
            '<div class="desafio-card-label">⚡ DESAFÍO DEL DÍA</div>' +
            '<div class="desafio-card-nombre">' + d.nombre + '</div>' +
            '<div class="desafio-card-desc">' + d.desc + '</div>' +
          '</div>' +
        '</div>' +
        (completado
          ? '<div class="desafio-card-completado">✅ COMPLETADO HOY</div>'
          : '<button class="desafio-card-btn" onclick="window.fgJugarDesafio()">Jugar Desafío</button>') +
      '</div>';
  }

  function setupDesafioDiario() {
    const _tryMenu = () => {
      if (document.querySelector('.mm-seccion')) {
        _inyectarCardEnMenu();
      } else {
        setTimeout(_tryMenu, 400);
      }
    };
    setTimeout(_tryMenu, 700);

    if (typeof onJuego !== 'function') return;

    onJuego('finDePartido', (data) => {
      if (!_desafioActivo) return;
      _desafioActivo = false;

      const gano = data.puntosJugador >= data.limite;

      // Restaurar configs
      const d = getDesafioHoy();
      if (typeof S !== 'undefined') {
        if (d.config.flor)  S.cfgFlor  = false;
        if (d.config.chico) { S.cfgChico = false; S.limitePuntos = 30; }
      }

      _marcarDesafioCompletado(gano);
      _renderCardDesafio();

      if (gano) {
        // Reward monedas (varios sistemas posibles)
        if (typeof window.clubAgregarMonedas === 'function') window.clubAgregarMonedas(50);
        // Logro
        if (typeof window.desbloquearLogro === 'function') window.desbloquearLogro('desafio_diario');
        setTimeout(() => {
          if (typeof showToast === 'function') showToast('🏅 ¡Desafío completado! +50 monedas');
        }, 1500);
      }
    });

    // Re-render card si el menú es visible
    onJuego('render', () => {
      const el = document.getElementById('ext-desafio-card-menu');
      if (el && el.offsetParent !== null) _renderCardDesafio(el);
    });
  }

  window.fgJugarDesafio  = jugarDesafioHoy;
  window.fgGetDesafioHoy = getDesafioHoy;

  // ══════════════════════════════════════════════════════════════
  // HOOKS DE RENDER — re-sincronizar badges si el DOM cambia
  // ══════════════════════════════════════════════════════════════
  function _setupRenderHooks() {
    if (typeof onJuego !== 'function') return;
    onJuego('render', () => {
      if (personalidadActual && !document.getElementById('fg-personalidad-badge')) {
        mostrarBadgePersonalidad();
      }
    });
  }

})();
