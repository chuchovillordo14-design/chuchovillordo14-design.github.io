// ══════════════════════════════════════════════════════════════
// extras.js — Truco GOL extras v1
// Features:
//   1. Historial de cantos
//   2. Racha de manos ganadas consecutivas
//   3. Relator futbolero
//   4. Logros desbloqueables
//   5. Dificultad de IA ajustable (sobre el sistema de equipos existente)
//   6. Estadísticas finales de partido
//   7. Papel picado al ganar
//   8. Partículas en el fondo del menú
//   9. Sonidos adicionales (complementan los de juego_ui.js)
//  10. Modo torneo rápido (mejor de 3)
// ══════════════════════════════════════════════════════════════

(function () {
  'use strict';

  // ─────────────────────────────────────────────────────────────
  // 1. HISTORIAL DE CANTOS
  // ─────────────────────────────────────────────────────────────

  function setupHistorial() {
    // Crear el div flotante dentro de #mesa
    const mesa = document.getElementById('mesa');
    if (!mesa) return;

    const hist = document.createElement('div');
    hist.id = 'ext-historial';
    mesa.appendChild(hist);

    const MAX_ITEMS = 6;
    let _items = [];

    function agregarCanto(texto, quien) {
      _items.push({ texto, quien });
      if (_items.length > MAX_ITEMS) _items.shift();
      renderHistorial();
    }

    function renderHistorial() {
      const el = document.getElementById('ext-historial');
      if (!el) return;
      el.innerHTML = '';
      _items.forEach(it => {
        const d = document.createElement('div');
        d.className = `ext-hist-item ${it.quien}`;
        const icono = it.quien === 'jugador' ? '▶ ' : '◀ ';
        d.textContent = icono + it.texto;
        el.appendChild(d);
      });
    }

    // Limpiar al iniciar nueva mano/partido
    function limpiarHistorial() {
      _items = [];
      renderHistorial();
    }

    // Wrappear mostrarOverlayCanto para detectar cantos en tiempo real
    if (typeof window.mostrarOverlayCanto === 'function') {
      const _orig = window.mostrarOverlayCanto;
      window.mostrarOverlayCanto = function (texto, quien) {
        try { agregarCanto(texto, quien); } catch (e) {}
        return _orig.apply(this, arguments);
      };
    }

    // Limpiar al nuevo partido
    if (typeof onJuego === 'function') {
      onJuego('nuevoPartido', limpiarHistorial);
    }

    // También limpiar en cada render cuando hay nueva mano
    // (detectamos ronda 0 sin cantos activos)
    let _ultimaRonda = -1;
    if (typeof onJuego === 'function') {
      onJuego('render', function () {
        try {
          if (typeof S !== 'undefined' && S.rondaActual === 0 && S.historialEnvido && S.historialEnvido.length === 0 && !S.trucoCantado) {
            if (_ultimaRonda !== 0) {
              limpiarHistorial();
              _ultimaRonda = 0;
            }
          } else {
            _ultimaRonda = typeof S !== 'undefined' ? S.rondaActual : -1;
          }
        } catch (e) {}
      });
    }
  }

  // ─────────────────────────────────────────────────────────────
  // 2. RACHA DE MANOS GANADAS
  // ─────────────────────────────────────────────────────────────

  function setupRacha() {
    let rachaActual = parseInt(localStorage.getItem('tg_racha') || '0', 10);
    let mejorRacha  = parseInt(localStorage.getItem('tg_mejor_racha') || '0', 10);

    function actualizarBadge() {
      const badge = document.getElementById('ext-racha-badge');
      if (!badge) return;
      if (rachaActual >= 2) {
        badge.textContent = `🔥 RACHA x${rachaActual}`;
        badge.style.display = 'block';
      } else {
        badge.style.display = 'none';
      }
    }

    // Crear badge en #mesa
    const mesa = document.getElementById('mesa');
    if (mesa) {
      const badge = document.createElement('div');
      badge.id = 'ext-racha-badge';
      mesa.appendChild(badge);
    }

    // Wrappear mostrarOverlayResultadoMano para detectar resultado de mano
    if (typeof window.mostrarOverlayResultadoMano === 'function') {
      const _origRes = window.mostrarOverlayResultadoMano;
      window.mostrarOverlayResultadoMano = function (resultado, pts) {
        try {
          if (resultado === 'gano') {
            rachaActual++;
            if (rachaActual > mejorRacha) {
              mejorRacha = rachaActual;
              localStorage.setItem('tg_mejor_racha', mejorRacha);
            }
            localStorage.setItem('tg_racha', rachaActual);
            // Verificar logros de racha
            if (typeof _checkLogroRacha === 'function') _checkLogroRacha(rachaActual);
            setTimeout(actualizarBadge, 300);
          } else if (resultado === 'pierde') {
            rachaActual = 0;
            localStorage.setItem('tg_racha', 0);
            setTimeout(actualizarBadge, 300);
          }
        } catch (e) {}
        return _origRes.apply(this, arguments);
      };
    }

    // Reset al nuevo partido
    if (typeof onJuego === 'function') {
      onJuego('nuevoPartido', function () {
        rachaActual = 0;
        localStorage.setItem('tg_racha', 0);
        actualizarBadge();
      });
    }

    // Exponer para logros
    window._extRachaActual = function () { return rachaActual; };
    window._extMejorRacha  = function () { return mejorRacha; };
  }

  // ─────────────────────────────────────────────────────────────
  // 2b. RACHA DE PARTIDOS (la que se muestra al terminar)
  //
  // Ojo: la racha de arriba (tg_racha) es de MANOS dentro de un partido y
  // se resetea en cada partido nuevo. Esta cuenta PARTIDOS ganados al hilo
  // y sobrevive entre partidos: es el gancho de "una más" del fin de
  // partido (1v1 amistoso/online y 2v2).
  //
  // La llama el que muestra el cierre, UNA sola vez por partido, y le
  // devuelve la frase ya armada.
  // ─────────────────────────────────────────────────────────────

  const _PART_FRASES_GANO = [
    "Sigue la buena.", "Van bien encaminados.", "Otra más y es fiesta.",
  ];
  const _PART_FRASES_PIERDE = [
    "La próxima es tuya.", "A la revancha.", "Se juega hasta el final.",
  ];

  function tgRachaPartidos(gano) {
    // Entrenamiento: el banner dice "no cuenta para racha ni PT" — hasta
    // acá solo se cumplía la parte de las PT.
    if (typeof window !== 'undefined' && window.modoEntrenamiento) {
      const r = parseInt(localStorage.getItem('tg_racha_part') || '0', 10) || 0;
      return r >= 2 ? `🎓 Entrenamiento — la racha de ${r} sigue intacta` : '🎓 Entrenamiento: no cuenta para la racha';
    }
    let racha = parseInt(localStorage.getItem('tg_racha_part') || '0', 10) || 0;
    let mejor = parseInt(localStorage.getItem('tg_mejor_racha_part') || '0', 10) || 0;
    const previa = racha;

    if (gano) { racha++; if (racha > mejor) mejor = racha; }
    else      { racha = 0; }

    try {
      localStorage.setItem('tg_racha_part', String(racha));
      localStorage.setItem('tg_mejor_racha_part', String(mejor));
    } catch (e) {}

    let frase;
    if (gano) {
      if (racha >= 2 && racha === mejor)  frase = `🔥 ${racha} al hilo — tu mejor racha`;
      else if (racha >= 2)                frase = `🔥 ${racha} al hilo — tu récord es ${mejor}`;
      else                                frase = `🔥 Arrancó la racha. ${_azar(_PART_FRASES_GANO)}`;
    } else {
      if (previa >= 2) frase = `Se cortó la racha de ${previa}. ${_azar(_PART_FRASES_PIERDE)}`;
      else             frase = _azar(_PART_FRASES_PIERDE);
    }
    return { racha, mejor, frase };
  }

  function _azar(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

  window.tgRachaPartidos = tgRachaPartidos;

  // ─────────────────────────────────────────────────────────────
  // 3. RELATOR FUTBOLERO
  // ─────────────────────────────────────────────────────────────

  function setupRelator() {
    const FRASES_RELATOR = {
      gano_mano:    ["¡Golazo de media cancha!", "¡Vuela la pelota, vuela!", "¡Eso es categoría de primera!", "¡Qué volcada, maestro!", "¡El público enloquece!", "¡La rompió al ángulo!", "¡Crack total!", "¡Lo tiró a la red con todo!"],
      pierdo_mano:  ["Entró por el caño...", "Se le fue al córner...", "El arquero la atajó fácil.", "Fuera del área, fuera del juego.", "Mala suerte, pibe.", "Se la robó el cinco.", "Perdió la pelota en el mediocampo.", "Pum pa' la tribuna."],
      gano_envido:  ["¡Cantó el gol el estadio!", "¡Eso paga las entradas!", "¡Qué bajada de telón!", "¡Que pase el siguiente!", "¡El envidador letal!", "¡De volea y adentro!", "¡Gol de taco, señores!", "¡Sin arquero y sin perdón!"],
      pierdo_envido:["Le pifió al arco vacío...", "Se la devolvieron.", "Quedó en offside.", "Le comieron el envido.", "El rival tenía más flor.", "Se la ganó limpio.", "La perdió en los últimos segundos.", "No alcanzó."],
      gano_partido: ["¡¡¡CAMPEÓN!!!", "¡Se fue el partido, se fue el rival!", "¡El estadio estalla!", "¡Final, final, final!", "¡Tres puntos en el bolsillo!", "¡Hoy no se trabaja, se festeja!", "¡Tocó la cumbre!", "¡El rey del tablón!"],
      pierdo_partido:["Derrota para el olvido...", "Habrá revancha.", "Mal partido, pibe. A entrenar.", "Se fue a los vestuarios con la cabeza baja.", "Perdió el clásico.", "Día negro para el hincha.", "La racha se cortó.", "Volveremos más fuertes."],
      canto_truco:  ["¡Se armó!", "¡La tensión se corta con cuchillo!", "¡Aquí está la definición!", "¡Momento clave del partido!", "¡Ahora se define todo!"],
      mazo:         ["Se bajó del partido...", "No quiso saber nada.", "Prefirió guardar fuerzas.", "Sabiduría o miedo, ¿quién sabe?", "Otro día será."]
    };

    // Crear div del relator
    const relatorEl = document.createElement('div');
    relatorEl.id = 'ext-relator';
    document.body.appendChild(relatorEl);

    let _relatorTimer = null;
    let _relatorOcupado = false;

    function mostrarRelator(categoria) {
      if (_relatorOcupado) return;
      const arr = FRASES_RELATOR[categoria];
      if (!arr) return;
      const frase = arr[Math.floor(Math.random() * arr.length)];
      const el = document.getElementById('ext-relator');
      if (!el) return;

      _relatorOcupado = true;
      el.textContent = '"' + frase + '"';
      el.classList.add('visible');

      clearTimeout(_relatorTimer);
      _relatorTimer = setTimeout(() => {
        el.classList.remove('visible');
        setTimeout(() => { _relatorOcupado = false; }, 350);
      }, 3000);
    }

    // Exponer globalmente para que otros módulos lo usen
    window.extMostrarRelator = mostrarRelator;

    // Detectar eventos del juego
    if (typeof onJuego === 'function') {
      onJuego('finDePartido', function (data) {
        try {
          const gano = data && data.puntosJugador >= data.limite;
          mostrarRelator(gano ? 'gano_partido' : 'pierdo_partido');
        } catch (e) {}
      });
    }

    // Wrappear overlay de resultado de mano
    if (typeof window.mostrarOverlayResultadoMano === 'function') {
      const _origRelRes = window.mostrarOverlayResultadoMano;
      window.mostrarOverlayResultadoMano = function (resultado, pts) {
        try {
          if (resultado === 'gano')   mostrarRelator('gano_mano');
          if (resultado === 'pierde') mostrarRelator('pierdo_mano');
        } catch (e) {}
        return _origRelRes.apply(this, arguments);
      };
    }

    // Detectar cantos de truco a través del overlay de canto
    if (typeof window.mostrarOverlayCanto === 'function') {
      const _origRelCanto = window.mostrarOverlayCanto;
      window.mostrarOverlayCanto = function (texto, quien) {
        try {
          const t = (texto || '').toUpperCase();
          if (quien === 'rival' && (t.includes('TRUCO') || t.includes('RETRUCO') || t.includes('VALE'))) {
            mostrarRelator('canto_truco');
          }
          if (quien === 'rival' && t.includes('MAZO')) {
            mostrarRelator('mazo');
          }
        } catch (e) {}
        return _origRelCanto.apply(this, arguments);
      };
    }

    // Detectar resultado de envido
    if (typeof window.mostrarOverlayEnvido === 'function') {
      const _origRelEnv = window.mostrarOverlayEnvido;
      window.mostrarOverlayEnvido = function (ptsJ, ptsR, ganoJugador) {
        try {
          setTimeout(() => mostrarRelator(ganoJugador ? 'gano_envido' : 'pierdo_envido'), 600);
        } catch (e) {}
        return _origRelEnv.apply(this, arguments);
      };
    }
  }

  // ─────────────────────────────────────────────────────────────
  // 4. LOGROS DESBLOQUEABLES
  // ─────────────────────────────────────────────────────────────

  function setupLogros() {
    const LOGROS_DEF = [
      { id: 'primer_truco',    ico: '🃏', nombre: 'Primer Truco',   desc: 'Ganaste tu primer truco' },
      { id: 'racha3',          ico: '⚽', nombre: 'Hat-trick',      desc: '3 manos seguidas' },
      { id: 'racha5',          ico: '🔥', nombre: 'La Máquina',     desc: '5 manos seguidas sin parar' },
      { id: 'envido10',        ico: '🎯', nombre: 'El Envidador',   desc: '10 envidos ganados' },
      { id: 'falta_envido',    ico: '🌟', nombre: 'Falta Envido!',  desc: 'Ganaste con Falta Envido' },
      { id: 'goleador20',      ico: '🥇', nombre: 'Goleador',       desc: '20 partidas ganadas' },
      { id: 'primera_victoria',ico: '🏆', nombre: 'Primera Copa',   desc: 'Tu primer partido ganado' },
      { id: 'sin_mazo',        ico: '💪', nombre: 'Sin Piedad',     desc: 'Ganaste sin ir al mazo' },
    ];

    let logrosDesbloqueados = [];
    try {
      logrosDesbloqueados = JSON.parse(localStorage.getItem('tg_logros') || '[]');
    } catch (e) { logrosDesbloqueados = []; }

    let _envidosGanados = parseInt(localStorage.getItem('tg_envidos_g') || '0', 10);
    let _fueAlMazo = false;

    // Crear notificación
    const notifEl = document.createElement('div');
    notifEl.id = 'ext-logro-notif';
    notifEl.innerHTML = '<div class="ext-logro-ico" id="ext-logro-notif-ico">🏆</div><div class="ext-logro-texto"><div class="ext-logro-titulo">¡LOGRO DESBLOQUEADO!</div><div class="ext-logro-nombre" id="ext-logro-notif-nom"></div><div class="ext-logro-desc" id="ext-logro-notif-des"></div></div>';
    document.body.appendChild(notifEl);

    let _notifTimer = null;
    let _notifCola = [];
    let _notifActiva = false;

    function _procesarNotifCola() {
      if (_notifActiva || _notifCola.length === 0) return;
      _notifActiva = true;
      const { ico, nombre, desc } = _notifCola.shift();
      const el = document.getElementById('ext-logro-notif');
      const icoEl  = document.getElementById('ext-logro-notif-ico');
      const nomEl  = document.getElementById('ext-logro-notif-nom');
      const desEl  = document.getElementById('ext-logro-notif-des');
      if (!el) { _notifActiva = false; return; }
      if (icoEl) icoEl.textContent = ico;
      if (nomEl) nomEl.textContent = nombre;
      if (desEl) desEl.textContent = desc;

      // Sonido de logro
      try {
        if (typeof S !== 'undefined' && S.cfgSonido !== false) {
          if (typeof _ctx === 'function') {
            const ctx = _ctx();
            if (ctx) {
              [523, 659, 784, 1047, 1319].forEach((f, i) => {
                setTimeout(() => {
                  const o = ctx.createOscillator();
                  const g = ctx.createGain();
                  o.connect(g); g.connect(ctx.destination);
                  o.type = 'triangle'; o.frequency.value = f;
                  g.gain.setValueAtTime(0.18, ctx.currentTime);
                  g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
                  o.start(); o.stop(ctx.currentTime + 0.25);
                }, i * 100);
              });
            }
          }
        }
      } catch (e) {}

      el.classList.add('show');
      clearTimeout(_notifTimer);
      _notifTimer = setTimeout(() => {
        el.classList.remove('show');
        setTimeout(() => {
          _notifActiva = false;
          _procesarNotifCola();
        }, 500);
      }, 3500);
    }

    function desbloquearLogro(id) {
      if (logrosDesbloqueados.includes(id)) return; // ya tiene el logro
      const def = LOGROS_DEF.find(l => l.id === id);
      if (!def) {
        // No es de los 8 de acá: puede ser uno de LOGROS_EXTRA
        // (features_historia.js), que tiene su propia lista y su propio
        // store. Hasta el 2-ago-2026 esto era un `return` seco, o sea un
        // no-op SILENCIOSO: los 5 logros que se pedían desde otros módulos
        // —incluidos los premios de los capítulos 5, 9 y 10 de Historia,
        // el clímax de la campaña— no se podían conseguir de ninguna forma.
        // Ahora se delega en vez de descartar; si tampoco existe allá, ese
        // lado avisa por consola.
        if (typeof window._desbloquearLogroExtra === 'function') {
          window._desbloquearLogroExtra(id);
        } else {
          console.warn('[logros] id desconocido y sin sistema extra cargado:', id);
        }
        return;
      }
      logrosDesbloqueados.push(id);
      localStorage.setItem('tg_logros', JSON.stringify(logrosDesbloqueados));
      _notifCola.push(def);
      _procesarNotifCola();
    }

    // Exponer el desbloqueo: features_gameplay (desafío diario),
    // features_torneo_plus y features_historia lo llaman como
    // window.desbloquearLogro y hasta ahora no existía (no-op silencioso).
    window.desbloquearLogro = desbloquearLogro;

    // Exponer función de check de racha para setupRacha()
    window._checkLogroRacha = function (racha) {
      if (racha >= 3) desbloquearLogro('racha3');
      if (racha >= 5) desbloquearLogro('racha5');
    };

    // Detectar primer truco y sin_mazo
    if (typeof window.mostrarOverlayResultadoMano === 'function') {
      const _origLogRes = window.mostrarOverlayResultadoMano;
      window.mostrarOverlayResultadoMano = function (resultado, pts) {
        try {
          if (resultado === 'gano') {
            // Chequear si había truco aceptado
            if (typeof S !== 'undefined' && S.trucoCantado) {
              desbloquearLogro('primer_truco');
            }
          }
        } catch (e) {}
        return _origLogRes.apply(this, arguments);
      };
    }

    // Detectar mazo (sin_mazo: rastrear si el jugador fue al mazo)
    if (typeof window.irseAlMazo === 'function') {
      const _origMazo = window.irseAlMazo;
      window.irseAlMazo = function (quien) {
        try {
          if (quien === 'jugador') _fueAlMazo = true;
        } catch (e) {}
        return _origMazo.apply(this, arguments);
      };
    }

    // Detectar envido ganado
    if (typeof window.mostrarOverlayEnvido === 'function') {
      const _origLogEnv = window.mostrarOverlayEnvido;
      window.mostrarOverlayEnvido = function (ptsJ, ptsR, ganoJugador, apuesta, cartasJ, cartasR, titulo) {
        try {
          // El overlay lo comparten envido y FLOR: sin mirar el título, una
          // flor ganada sumaba al contador de envidos y a su logro.
          const _esFlor = typeof titulo === 'string' && titulo.toUpperCase().indexOf('FLOR') !== -1;
          if (ganoJugador && !_esFlor) {
            _envidosGanados++;
            localStorage.setItem('tg_envidos_g', _envidosGanados);
            if (typeof window.actualizarRecord === 'function')
              window.actualizarRecord('envidos_gana', _envidosGanados, '');
            if (_envidosGanados >= 10) desbloquearLogro('envido10');
            // Detectar falta envido
            if (titulo === 'ENVIDO' && typeof S !== 'undefined' && S.historialEnvido && S.historialEnvido.includes('falta')) {
              desbloquearLogro('falta_envido');
            }
          }
        } catch (e) {}
        return _origLogEnv.apply(this, arguments);
      };
    }

    // Detectar fin de partido para logros de victoria
    if (typeof onJuego === 'function') {
      onJuego('finDePartido', function (data) {
        try {
          if (!data) return;
          if (data.puntosJugador >= data.limite) {
            desbloquearLogro('primera_victoria');
            const ganadas = parseInt(localStorage.getItem('tg_partidas_g') || '0', 10) + 1;
            localStorage.setItem('tg_partidas_g', ganadas);
            if (ganadas >= 20) desbloquearLogro('goleador20');
            if (!_fueAlMazo) desbloquearLogro('sin_mazo');
          }
          _fueAlMazo = false;
        } catch (e) {}
      });

      onJuego('nuevoPartido', function () {
        _fueAlMazo = false;
      });
    }

    // Construir modal de logros y agregar botón en FABs
    function _crearModalLogros() {
      const m = document.createElement('div');
      m.id = 'ext-logros-modal';
      m.innerHTML = `
        <div class="ext-modal-box">
          <h2 style="color:#c8a84b;font-family:var(--f-ui,monospace);font-size:14px;letter-spacing:2px;margin-bottom:4px;">🏅 LOGROS</h2>
          <div style="font-size:10px;color:#888;font-family:var(--f-body,serif);margin-bottom:12px;">
            <span id="ext-logros-counter">0</span> de ${LOGROS_DEF.length} desbloqueados
          </div>
          <div class="ext-logros-grid" id="ext-logros-grid"></div>
          <button onclick="document.getElementById('ext-logros-modal').classList.remove('show')"
            style="margin-top:20px;width:100%;padding:10px;background:linear-gradient(135deg,#c8a84b,#a07830);color:#1a1a1a;border:none;border-radius:10px;font-family:var(--f-ui,monospace);font-size:11px;font-weight:bold;letter-spacing:2px;cursor:pointer;">
            CERRAR
          </button>
        </div>`;
      document.body.appendChild(m);

      m.addEventListener('click', function (e) {
        if (e.target === m) m.classList.remove('show');
      });
    }

    function _renderModalLogros() {
      const grid = document.getElementById('ext-logros-grid');
      const counter = document.getElementById('ext-logros-counter');
      if (!grid) return;
      if (counter) counter.textContent = logrosDesbloqueados.length;
      grid.innerHTML = '';
      LOGROS_DEF.forEach(def => {
        const card = document.createElement('div');
        card.className = 'ext-logro-card' + (logrosDesbloqueados.includes(def.id) ? ' desbloqueado' : '');
        card.innerHTML = `<div class="ico">${def.ico}</div><div class="info"><div class="nom">${def.nombre}</div><div class="des">${def.desc}</div></div>`;
        grid.appendChild(card);
      });
    }

    function abrirLogros() {
      _renderModalLogros();
      const m = document.getElementById('ext-logros-modal');
      if (m) m.classList.add('show');
    }

    window.extAbrirLogros = abrirLogros;

    _crearModalLogros();

    // Agregar botón en fab-group
    setTimeout(function () {
      const fab = document.getElementById('fab-group');
      if (fab) {
        const btn = document.createElement('button');
        btn.className = 'fab';
        btn.title = 'Logros';
        btn.textContent = '🏅';
        btn.onclick = abrirLogros;
        fab.insertBefore(btn, fab.firstChild);
      }
    }, 500);
  }

  // ─────────────────────────────────────────────────────────────
  // 5. DIFICULTAD DE IA AJUSTABLE
  //    El sistema ya tiene _dificultadIA() basado en equipoRival.fuerza.
  //    Agregamos un override manual que multiplica esa fuerza.
  // ─────────────────────────────────────────────────────────────

  function setupDificultad() {
    const KEY = 'tg_dificultad_override';
    let _nivel = localStorage.getItem(KEY) || 'normal';

    // Multiplicadores sobre la fuerza del equipo
    const MULT = { facil: 0.2, normal: 1.0, dificil: 1.5 };

    // Wrappear _dificultadIA si existe
    if (typeof window._dificultadIA === 'function') {
      const _origDif = window._dificultadIA;
      window._dificultadIA = function () {
        try {
          const base = _origDif.call(this);
          const mult = MULT[_nivel] || 1.0;
          return Math.max(0, Math.min(1, base * mult));
        } catch (e) {
          return _origDif.apply(this, arguments);
        }
      };
    }

    function setNivel(n) {
      _nivel = n;
      localStorage.setItem(KEY, n);
      renderBotones();
    }

    function renderBotones() {
      ['facil', 'normal', 'dificil'].forEach(n => {
        const btn = document.getElementById('ext-dif-' + n);
        if (btn) btn.classList.toggle('active', n === _nivel);
      });
    }

    // Agregar controles en settings-modal
    function _inyectarControles() {
      // ⚠️ Anclar al CONTENIDO, no a la posición. Esto era
      // `.setting-row:nth-child(2)` y se rompió el 4 ago al sumar las filas
      // de nombre y club arriba de todo: los botones Fácil/Normal/Difícil
      // aparecían pegados al campo "Tu nombre". Con el ancla al elemento que
      // describe la dificultad, reordenar Ajustes ya no lo mueve.
      const info = document.getElementById('ia-dificultad-info');
      const row = info ? info.closest('.setting-row')
                       : document.querySelector('#settings-modal .setting-row:nth-child(2)');
      if (!row) return;

      const wrapper = document.createElement('div');
      wrapper.style.cssText = 'display:flex;gap:6px;margin-top:8px;';

      ['facil', 'normal', 'dificil'].forEach(n => {
        const btn = document.createElement('button');
        btn.id = 'ext-dif-' + n;
        btn.textContent = { facil: '🐣 Fácil', normal: '⚽ Normal', dificil: '🔥 Difícil' }[n];
        btn.style.cssText = `flex:1;padding:6px 4px;border:1.5px solid rgba(200,168,75,0.3);border-radius:8px;background:rgba(255,255,255,0.05);color:#ccc;font-family:var(--f-body,serif);font-size:10px;cursor:pointer;transition:all 0.2s;`;
        btn.onclick = () => setNivel(n);
        // estilos para activo
        const origBtn = btn;
        const _origStyle = origBtn.style.cssText;
        Object.defineProperty(btn, '_activeStyle', {
          value: 'background:rgba(200,168,75,0.2);border-color:#c8a84b;color:#f5c518;font-weight:bold;',
          writable: true
        });
        wrapper.appendChild(btn);
      });

      row.appendChild(wrapper);

      // CSS inline para botón activo
      const st = document.createElement('style');
      st.textContent = `
        #ext-dif-facil.active, #ext-dif-normal.active, #ext-dif-dificil.active {
          background: rgba(200,168,75,0.2) !important;
          border-color: #c8a84b !important;
          color: #f5c518 !important;
          font-weight: bold !important;
        }
      `;
      document.head.appendChild(st);

      renderBotones();
    }

    // Esperar a que el modal esté en el DOM
    if (document.getElementById('settings-modal')) {
      _inyectarControles();
    } else {
      document.addEventListener('DOMContentLoaded', _inyectarControles);
    }
  }

  // ─────────────────────────────────────────────────────────────
  // 6. ESTADÍSTICAS FINALES DE PARTIDO
  // ─────────────────────────────────────────────────────────────

  function setupStatsFinales() {
    // Contadores de la partida actual
    let _stats = {
      manosJ: 0, manosR: 0,
      envidosJ: 0, envidosR: 0,
      trucoJ: 0, trucoR: 0,
    };

    function resetStats() {
      _stats = { manosJ: 0, manosR: 0, envidosJ: 0, envidosR: 0, trucoJ: 0, trucoR: 0 };
    }

    if (typeof onJuego === 'function') {
      onJuego('nuevoPartido', resetStats);
    }

    // Los mismos números, para que la tarjeta de fin de partido
    // (juego_ui.js) los muestre adentro en vez de abrir un segundo modal
    // encima. Ver la nota de abajo sobre por qué el modal sigue existiendo.
    window.tgStatsPartido = function () {
      return { manosJ: _stats.manosJ, manosR: _stats.manosR,
               envidosJ: _stats.envidosJ, envidosR: _stats.envidosR };
    };

    // Trackear manos ganadas
    if (typeof window.mostrarOverlayResultadoMano === 'function') {
      const _origStatRes = window.mostrarOverlayResultadoMano;
      window.mostrarOverlayResultadoMano = function (resultado, pts) {
        try {
          if (resultado === 'gano')   _stats.manosJ++;
          if (resultado === 'pierde') _stats.manosR++;
        } catch (e) {}
        return _origStatRes.apply(this, arguments);
      };
    }

    // Trackear envidos
    if (typeof window.mostrarOverlayEnvido === 'function') {
      const _origStatEnv = window.mostrarOverlayEnvido;
      window.mostrarOverlayEnvido = function (ptsJ, ptsR, ganoJugador) {
        try {
          if (ganoJugador) _stats.envidosJ++;
          else             _stats.envidosR++;
        } catch (e) {}
        return _origStatEnv.apply(this, arguments);
      };
    }

    // Crear modal
    const modal = document.createElement('div');
    modal.id = 'ext-stats-fin';
    modal.innerHTML = `
      <div class="ext-stats-fin-box">
        <div class="ext-stats-fin-title">📊 RESUMEN DE PARTIDO</div>
        <div class="ext-stats-fin-cols">
          <div>
            <div class="ext-stats-col-lbl" id="ext-sf-lbl-j">VOS</div>
            <div id="ext-sf-bars-j"></div>
          </div>
          <div class="ext-stats-divider">⚽</div>
          <div>
            <div class="ext-stats-col-lbl" id="ext-sf-lbl-r">RIVAL</div>
            <div id="ext-sf-bars-r"></div>
          </div>
        </div>
        <div style="margin-top:16px;display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;text-align:center;">
          <div>
            <div style="font-size:9px;color:#888;font-family:var(--f-body,serif);">MANOS</div>
            <div style="font-size:18px;color:#fff;" id="ext-sf-manos-j">0</div>
            <div style="font-size:10px;color:#666;">-</div>
            <div style="font-size:18px;color:#fff;" id="ext-sf-manos-r">0</div>
          </div>
          <div>
            <div style="font-size:9px;color:#888;font-family:var(--f-body,serif);">ENVIDOS</div>
            <div style="font-size:18px;color:#fff;" id="ext-sf-env-j">0</div>
            <div style="font-size:10px;color:#666;">-</div>
            <div style="font-size:18px;color:#fff;" id="ext-sf-env-r">0</div>
          </div>
          <div>
            <div style="font-size:9px;color:#888;font-family:var(--f-body,serif);">PUNTOS</div>
            <div style="font-size:18px;color:#fff;" id="ext-sf-pts-j">0</div>
            <div style="font-size:10px;color:#666;">-</div>
            <div style="font-size:18px;color:#fff;" id="ext-sf-pts-r">0</div>
          </div>
        </div>
        <button class="ext-stats-close" id="ext-sf-close">CONTINUAR</button>
      </div>`;
    document.body.appendChild(modal);

    modal.querySelector('#ext-sf-close').addEventListener('click', function () {
      modal.classList.remove('show');
    });

    if (typeof onJuego === 'function') {
      onJuego('finDePartido', function (data) {
        try {
          // Capturado ACÁ, sincrónico con el evento finDePartido: el hook de
          // Historia (features_historia.js, _hookFinDePartida) apaga
          // window.modoHistoria en SU PROPIO handler del mismo evento, que
          // corre después de este (se registra más tarde, en el load de la
          // página) — para cuando el setTimeout de 2s de acá abajo dispara,
          // la bandera ya está en false y el guard nunca detectaría Historia.
          // Capturando el valor ahora evitamos esa carrera. Maratón no tiene
          // este problema (su bandera sigue prendida entre partidas), pero
          // se captura igual por consistencia.
          const esHistoria = !!(typeof window !== 'undefined' && window.modoHistoria);
          const esMaraton  = !!(typeof window !== 'undefined' && window.modoMaraton);
          setTimeout(function () {
            if (!data) return;
            // Si el jugador ya navegó a otra pantalla en esta ventana de
            // 2s, no reaparecer encima del menú/anotador (purgarOverlays()
            // ya limpió el modal al salir, pero este setTimeout seguía en
            // pie y lo iba a mostrar de nuevo).
            const mesaEl = document.getElementById('mesa');
            if (mesaEl && mesaEl.style.display === 'none') return;
            // Amistoso y online tienen SU cierre (la tarjeta con marcador,
            // racha y REVANCHA) y ahí adentro van estas stats: si abrimos
            // también este modal, son dos pantallas encimadas y la revancha
            // queda tapada. En Liga/Mundial/Copa la tarjeta no aparece, así
            // que este modal sigue siendo el resumen de esos modos.
            if (typeof window._fpAplica === 'function' && window._fpAplica()) return;
            // Historia (features_historia.js, _mostrarNarrativaPost, 1500ms)
            // y Maratón (features_gameplay.js, _mostrarModalMaraton, 1200ms)
            // también tienen su propia pantalla de cierre, que aparece ANTES
            // que este modal (2000ms) — sin este guard el resumen genérico
            // las tapaba 500-800ms después de mostrarse. No se puede resolver
            // reusando _fpAplica(): esa función también decide si se abre la
            // fp-card de Amistoso/Online (juego_ui.js), y agregar Historia/
            // Maratón ahí abriría también esa tarjeta encima de la propia.
            if (esHistoria || esMaraton) return;
            const ganoJ = data.puntosJugador >= data.limite;

            const lblJ = document.getElementById('ext-sf-lbl-j');
            const lblR = document.getElementById('ext-sf-lbl-r');
            if (lblJ) { lblJ.textContent = (typeof S !== 'undefined' ? S.nombreJugador : 'VOS').toUpperCase(); lblJ.classList.toggle('ganador', ganoJ); }
            if (lblR) { const rName = (typeof AVATARS !== 'undefined' && typeof S !== 'undefined' ? AVATARS[S.idRival]?.name : 'RIVAL') || 'RIVAL'; lblR.textContent = rName.toUpperCase(); lblR.classList.toggle('ganador', !ganoJ); }

            // Barras de progreso
            function _setBar(id, pct, tipo) {
              const el = document.getElementById(id);
              if (!el) return;
              el.innerHTML = `<div class="ext-stat-bar-bg"><div class="ext-stat-bar-fill ${tipo}" style="width:${pct}%"></div></div>`;
            }

            const totalManos = _stats.manosJ + _stats.manosR || 1;
            const totalEnv   = _stats.envidosJ + _stats.envidosR || 1;

            const barsJ = document.getElementById('ext-sf-bars-j');
            const barsR = document.getElementById('ext-sf-bars-r');
            if (barsJ) barsJ.innerHTML = `
              <div class="ext-stat-bar-wrap"><div class="ext-stat-bar-lbl">Manos</div><div class="ext-stat-bar-bg"><div class="ext-stat-bar-fill jugador" style="width:${Math.round(_stats.manosJ/totalManos*100)}%"></div></div></div>
              <div class="ext-stat-bar-wrap"><div class="ext-stat-bar-lbl">Envidos</div><div class="ext-stat-bar-bg"><div class="ext-stat-bar-fill jugador" style="width:${Math.round(_stats.envidosJ/totalEnv*100)}%"></div></div></div>`;
            if (barsR) barsR.innerHTML = `
              <div class="ext-stat-bar-wrap"><div class="ext-stat-bar-lbl">Manos</div><div class="ext-stat-bar-bg"><div class="ext-stat-bar-fill rival" style="width:${Math.round(_stats.manosR/totalManos*100)}%"></div></div></div>
              <div class="ext-stat-bar-wrap"><div class="ext-stat-bar-lbl">Envidos</div><div class="ext-stat-bar-bg"><div class="ext-stat-bar-fill rival" style="width:${Math.round(_stats.envidosR/totalEnv*100)}%"></div></div></div>`;

            const _t = (id, val) => { const e = document.getElementById(id); if (e) e.textContent = val; };
            _t('ext-sf-manos-j', _stats.manosJ);
            _t('ext-sf-manos-r', _stats.manosR);
            _t('ext-sf-env-j',   _stats.envidosJ);
            _t('ext-sf-env-r',   _stats.envidosR);
            _t('ext-sf-pts-j',   data.puntosJugador || 0);
            _t('ext-sf-pts-r',   data.puntosRival || 0);

            modal.classList.add('show');
          }, 2000);
        } catch (e) {}
      });
    }
  }

  // ─────────────────────────────────────────────────────────────
  // 7. PAPEL PICADO
  // ─────────────────────────────────────────────────────────────

  function setupPapelPicado() {
    const colores = ['#6ab4f5', '#f5c518', '#fff', '#e74c3c', '#2ecc71', '#9b59b6', '#f39c12', '#1abc9c'];

    window.lanzarPapelPicado = function () {
      for (let i = 0; i < 60; i++) {
        const el = document.createElement('div');
        el.className = 'ext-papel-pieza';
        const w = 6 + Math.random() * 8;
        const h = 8 + Math.random() * 12;
        const dur = 2.5 + Math.random() * 2;
        const delay = Math.random() * 2;
        el.style.cssText = [
          `left:${Math.random() * 100}vw`,
          `background:${colores[i % colores.length]}`,
          `animation-delay:${delay}s`,
          `animation-duration:${dur}s`,
          `width:${w}px`,
          `height:${h}px`,
          `transform:rotate(${Math.random() * 360}deg)`,
        ].join(';');
        document.body.appendChild(el);
        setTimeout(() => { if (el.parentNode) el.parentNode.removeChild(el); }, (dur + delay + 0.5) * 1000);
      }
    };

    if (typeof onJuego === 'function') {
      onJuego('finDePartido', function (data) {
        try {
          if (data && data.puntosJugador >= data.limite) {
            setTimeout(window.lanzarPapelPicado, 400);
          }
        } catch (e) {}
      });
    }
  }

  // ─────────────────────────────────────────────────────────────
  // 8. PARTÍCULAS DE MENÚ
  // ─────────────────────────────────────────────────────────────

  function setupParticulas() {
    const contenedor = document.querySelector('.mm-cancha') || document.getElementById('main-menu');
    if (!contenedor) return;

    // Asegurar posición relativa para que las partículas se anclen bien
    const cs = getComputedStyle(contenedor);
    if (cs.position === 'static') contenedor.style.position = 'relative';
    contenedor.style.overflow = 'hidden';

    const coloresP = ['rgba(255,255,255,0.6)', 'rgba(245,197,24,0.7)', 'rgba(106,180,245,0.5)', 'rgba(255,255,255,0.4)'];

    for (let i = 0; i < 20; i++) {
      const p = document.createElement('div');
      p.className = 'ext-particle';
      const size = 2 + Math.random() * 3;
      const durP = 4 + Math.random() * 6;
      const delayP = Math.random() * 6;
      p.style.cssText = [
        `width:${size}px`,
        `height:${size}px`,
        `left:${Math.random() * 100}%`,
        `bottom:${Math.random() * 60}%`,
        `background:${coloresP[i % coloresP.length]}`,
        `animation-duration:${durP}s`,
        `animation-delay:${delayP}s`,
        `box-shadow:0 0 ${size * 2}px ${coloresP[i % coloresP.length]}`,
      ].join(';');
      contenedor.appendChild(p);
    }
  }

  // ─────────────────────────────────────────────────────────────
  // 9. SONIDOS ADICIONALES (complementan los de juego_ui.js)
  //    Solo agregan tipos que no existen en playSound() original
  // ─────────────────────────────────────────────────────────────

  function setupSonidos() {
    // El juego ya tiene un playSound() robusto en juego_ui.js.
    // Solo extendemos con aliases / aliases por si extras.js
    // necesita llamar sonidos con nombres propios.
    if (typeof window.playSound !== 'function') return;

    const _origPlay = window.playSound;
    window.playSound = function (tipo) {
      // Mapear nombres extras a los existentes
      const MAP = {
        gano_mano:    'ovacion',
        pierdo_mano:  'lose',
        canto_truco:  'silbato',
        canto_envido: 'canto',
        gano_partido: 'win',
        logro:        'win',
      };
      const mapped = MAP[tipo] || tipo;
      return _origPlay.call(this, mapped);
    };
  }

  // ─────────────────────────────────────────────────────────────
  // 10. MODO TORNEO RÁPIDO (mejor de 3)
  // ─────────────────────────────────────────────────────────────

  function setupTorneoRapido() {
    let torneoState = { activo: false, serieJ: 0, serieR: 0, meta: 2 };

    // Crear banner en mesa
    const mesa = document.getElementById('mesa');
    if (mesa) {
      const banner = document.createElement('div');
      banner.id = 'ext-torneo-banner';
      mesa.insertBefore(banner, mesa.firstChild);
    }

    // Crear modal de campeón
    const modalT = document.createElement('div');
    modalT.id = 'ext-torneo-modal';
    modalT.innerHTML = `
      <div class="ext-torneo-box">
        <div class="ext-torneo-trofeo" id="ext-torneo-trofeo">🏆</div>
        <div class="ext-torneo-titulo">¡CAMPEÓN DE SERIE!</div>
        <div class="ext-torneo-ganador" id="ext-torneo-ganador">VOS</div>
        <div class="ext-torneo-serie" id="ext-torneo-serie">2 - 0</div>
        <button onclick="extCerrarTorneo()" style="padding:10px 28px;background:linear-gradient(135deg,#c8a84b,#a07830);color:#1a1a1a;border:none;border-radius:10px;font-family:var(--f-ui,monospace);font-weight:bold;font-size:11px;letter-spacing:2px;cursor:pointer;">NUEVA SERIE</button>
      </div>`;
    document.body.appendChild(modalT);

    window.extCerrarTorneo = function () {
      torneoState = { activo: false, serieJ: 0, serieR: 0, meta: 2 };
      // Y la BANDERA, que es la que miran los otros modos. Antes esta era la
      // única salida de la serie que no la apagaba (limpiarBanderasDeModo sí
      // lo hace, pero "NUEVA SERIE" es un camino paralelo): quedaba prendida
      // con la serie ya cerrada, y a partir de ahí el Modo DT descartaba
      // TODAS sus fechas en silencio. El propio tripwire del proyecto lo
      // gritaba en consola: "la bandera y la serie no coinciden".
      window.modoTorneoRapido = false;
      modalT.classList.remove('show');
      actualizarBannerTorneo();
    };

    // Lo llama limpiarBanderasDeModo() (equipos.js): arrancar CUALQUIER otro
    // modo abandona la serie. Sin esto, torneoState.activo sobrevivía al
    // cambio de modo y las partidas del modo nuevo se contaban como partidas
    // de la serie (el mismo patrón que ya se arregló para Copa Rápida).
    window._torneoRapidoAbandonar = function () {
      if (!torneoState.activo) return;
      torneoState = { activo: false, serieJ: 0, serieR: 0, meta: 2 };
      actualizarBannerTorneo();
    };

    // La bandera y torneoState.activo tienen que contar lo mismo: si alguna
    // vez vuelven a separarse (un camino de arranque nuevo que no pase por
    // iniciarTorneoRapido), esto lo deja a la vista en la consola en vez de
    // que la Liga se ensucie en silencio.
    if (typeof onJuego === 'function') {
      onJuego('manoRepartida', function () {
        if (typeof window === 'undefined') return;
        if (!!window.modoTorneoRapido !== !!torneoState.activo) {
          console.warn('[torneo rápido] la bandera y la serie no coinciden:',
            { bandera: !!window.modoTorneoRapido, serie: !!torneoState.activo });
        }
      });
    }

    function actualizarBannerTorneo() {
      const banner = document.getElementById('ext-torneo-banner');
      if (!banner) return;
      if (!torneoState.activo) {
        banner.classList.remove('activo');
        return;
      }
      banner.classList.add('activo');
      const estrellasJ = _estrellas(torneoState.serieJ, torneoState.meta);
      const estrellasR = _estrellas(torneoState.serieR, torneoState.meta);
      banner.textContent = `⭐ TORNEO · VOS ${estrellasJ} vs ${estrellasR} RIVAL`;
    }

    function _estrellas(n, meta) {
      let s = '';
      for (let i = 0; i < meta; i++) s += i < n ? '★' : '○';
      return s;
    }

    window.iniciarTorneoRapido = function () {
      // Contrato de limpiarBanderasDeModo() (equipos.js): limpiar PRIMERO,
      // prender la propia DESPUÉS. Este era el único modo que no participaba
      // —no limpiaba y no tenía bandera—, así que cada una de sus hasta 3
      // partidas se anotaba como fecha del Modo DT, regalaba sobres de
      // figuritas y abría la tabla de posiciones. Auditoría 1 ago 2026.
      if (typeof limpiarBanderasDeModo === 'function') limpiarBanderasDeModo();
      if (typeof window !== 'undefined') window.modoTorneoRapido = true;
      torneoState = { activo: true, serieJ: 0, serieR: 0, meta: 2 };
      actualizarBannerTorneo();
      // Arranca DIRECTO con _arrancarConNombreYAvatar(), igual que Copas,
      // Mundial y Amistoso. Antes mandaba a #name-screen, cuyo botón es
      // setName() — y setName() vuelve a llamar a limpiarBanderasDeModo(),
      // apagando la bandera que acabamos de prender un instante antes. Ese
      // desvío además era la ÚNICA forma de llegar al registro de DT en todo
      // el juego; ahora esa pantalla tiene su propio botón en el menú.
      if (typeof window._arrancarConNombreYAvatar === 'function') window._arrancarConNombreYAvatar();
      else if (typeof irA === 'function') irA('name-screen');
      if (typeof showToast === 'function') showToast('⭐ ¡TORNEO RÁPIDO INICIADO! Mejor de 3 partidas', 2500);
    };

    if (typeof onJuego === 'function') {
      onJuego('finDePartido', function (data) {
        try {
          if (!torneoState.activo || !data) return;

          const ganoJ = data.puntosJugador >= data.limite;
          if (ganoJ) torneoState.serieJ++;
          else       torneoState.serieR++;

          actualizarBannerTorneo();

          // ¿Hay campeón de serie?
          if (torneoState.serieJ >= torneoState.meta || torneoState.serieR >= torneoState.meta) {
            const ganoSerie = torneoState.serieJ >= torneoState.meta;
            setTimeout(function () {
              // Mismo guard que ext-stats-fin: no reaparecer si el jugador
              // ya navegó a otra pantalla en esta ventana de 2.5s.
              const mesaEl = document.getElementById('mesa');
              if (mesaEl && mesaEl.style.display === 'none') return;
              const trofeo  = document.getElementById('ext-torneo-trofeo');
              const ganador = document.getElementById('ext-torneo-ganador');
              const serie   = document.getElementById('ext-torneo-serie');
              if (trofeo)  trofeo.textContent  = ganoSerie ? '🏆' : '😔';
              if (ganador) ganador.textContent  = ganoSerie ? (typeof S !== 'undefined' ? S.nombreJugador : 'VOS') : ((typeof AVATARS !== 'undefined' && typeof S !== 'undefined') ? AVATARS[S.idRival]?.name : 'RIVAL') || 'RIVAL';
              if (serie)   serie.textContent    = `${torneoState.serieJ} - ${torneoState.serieR}`;
              modalT.classList.add('show');
              if (ganoSerie) { try { window.lanzarPapelPicado && window.lanzarPapelPicado(); } catch(e){} }
            }, 2500);
          } else {
            // Otra partida
            setTimeout(function () {
              if (typeof showToast === 'function') showToast(`⭐ Torneo: ${torneoState.serieJ} - ${torneoState.serieR} · Siguiente partida...`, 2500);
              setTimeout(function () {
                if (typeof reiniciarPartida === 'function') reiniciarPartida();
              }, 2800);
            }, 2000);
          }
        } catch (e) {}
      });
    }

    // Agregar botón en menú principal (entre Amistoso y Online)
    setTimeout(function () {
      const onlineBtn = document.querySelector('.mm-btn.mm-acc-online');
      if (!onlineBtn) return;
      const btn = document.createElement('button');
      btn.className = 'mm-btn mm-btn-secondary mm-btn-torneo';
      btn.innerHTML = `<span class="mm-btn-icon">⭐</span><span class="mm-btn-text"><strong>TORNEO RÁPIDO</strong><small>Mejor de 3 partidas · sin equipos</small></span>`;
      btn.onclick = window.iniciarTorneoRapido;
      onlineBtn.parentNode.insertBefore(btn, onlineBtn);
    }, 300);
  }

  // ─────────────────────────────────────────────────────────────
  // INIT — arrancar todo con try/catch para no romper el juego
  // ─────────────────────────────────────────────────────────────

  function init() {
    try { setupSonidos(); }       catch (e) { console.warn('[extras] sonidos:', e); }
    try { setupHistorial(); }     catch (e) { console.warn('[extras] historial:', e); }
    try { setupRacha(); }         catch (e) { console.warn('[extras] racha:', e); }
    try { setupRelator(); }       catch (e) { console.warn('[extras] relator:', e); }
    try { setupLogros(); }        catch (e) { console.warn('[extras] logros:', e); }
    try { setupDificultad(); }    catch (e) { console.warn('[extras] dificultad:', e); }
    try { setupStatsFinales(); }  catch (e) { console.warn('[extras] statsFinales:', e); }
    try { setupPapelPicado(); }   catch (e) { console.warn('[extras] papelPicado:', e); }
    try { setupTorneoRapido(); }  catch (e) { console.warn('[extras] torneo:', e); }
    try { setupParticulas(); }    catch (e) { console.warn('[extras] particulas:', e); }
  }

  // Esperar a que todos los scripts del juego carguen
  window.addEventListener('load', function () {
    setTimeout(init, 250);
  });

})();
