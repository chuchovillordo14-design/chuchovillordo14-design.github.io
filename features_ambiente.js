// ══════════════════════════════════════════════════════════════
// features_ambiente.js — Truco GOL v1
// Features:
//   1. Música ambiente de estadio (Web Audio API, sin archivos externos)
//   2. Sistema de temporadas mensuales con tabla de posiciones
// ══════════════════════════════════════════════════════════════

(function () {
  'use strict';

  // lsGet/lsPut/lsGetJSON viven en features_storage.js (compartidos).

  // ─────────────────────────────────────────────────────────────
  // 1. MÚSICA AMBIENTE DE ESTADIO
  // ─────────────────────────────────────────────────────────────

  var audioCtx = null;
  var estadioNodos = null;        // { gainNode, whiteNoise, filter, filter2, lfo, lfoGain }
  var musicaActiva = false;
  var musicaHabilitada = false;   // toggle del usuario
  var cantoTimer = null;

  // Intensidad actual
  var intensidadActual = 'base';

  var INTENSIDADES = {
    base:        { gain: 0.05, freq: 300 },
    tension:     { gain: 0.12, freq: 500 },
    rondasGano:  { gain: 0.25, freq: 800 },
    rondasPierdo:{ gain: 0.06, freq: 250 },
    victoria:    { gain: 0.40, freq: 1000 },
    derrota:     { gain: 0.04, freq: 200 },
  };

  function getAudioCtx() {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    return audioCtx;
  }

  function crearNoiseBuffer(ctx) {
    var bufferSize = 2 * ctx.sampleRate;
    var noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    var output = noiseBuffer.getChannelData(0);
    for (var i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }
    return noiseBuffer;
  }

  function crearAmbienteEstadio(ctx) {
    var noiseBuffer = crearNoiseBuffer(ctx);

    var whiteNoise = ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;
    whiteNoise.loop = true;

    var filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 300;
    filter.Q.value = 0.5;

    // Segundo filtro para suavizar el ruido
    var filter2 = ctx.createBiquadFilter();
    filter2.type = 'lowpass';
    filter2.frequency.value = 1200;
    filter2.Q.value = 0.8;

    var gainNode = ctx.createGain();
    gainNode.gain.value = 0;  // arranca en silencio, sube con ramp

    // LFO para modulación orgánica (fluctuación de crowd)
    var lfo = ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = 0.15;  // muy lento

    var lfoGain = ctx.createGain();
    lfoGain.gain.value = 0.008;

    lfo.connect(lfoGain);
    lfoGain.connect(gainNode.gain);

    whiteNoise.connect(filter);
    filter.connect(filter2);
    filter2.connect(gainNode);
    gainNode.connect(ctx.destination);

    whiteNoise.start();
    lfo.start();

    return { gainNode: gainNode, whiteNoise: whiteNoise, filter: filter, filter2: filter2, lfo: lfo, lfoGain: lfoGain };
  }

  function setIntensidad(nombre, duracionRamp) {
    if (!estadioNodos || !audioCtx) return;
    var cfg = INTENSIDADES[nombre] || INTENSIDADES.base;
    var ramp = (duracionRamp !== undefined) ? duracionRamp : 0.8;
    intensidadActual = nombre;

    estadioNodos.gainNode.gain.cancelScheduledValues(audioCtx.currentTime);
    estadioNodos.gainNode.gain.linearRampToValueAtTime(
      cfg.gain, audioCtx.currentTime + ramp
    );
    estadioNodos.filter.frequency.cancelScheduledValues(audioCtx.currentTime);
    estadioNodos.filter.frequency.linearRampToValueAtTime(
      cfg.freq, audioCtx.currentTime + ramp
    );
  }

  function cantarHinchada() {
    if (!audioCtx || !musicaActiva) return;
    var ctx = audioCtx;

    // Patrones de cantos: frecuencias que simulan vocales de multitud
    var patrones = [
      // "¡DA-LE DA-LE DA-LE!"
      { tiempos: [0, 0.28, 0.56, 0.84, 1.12, 1.40], frecs: [280, 280, 280, 280, 280, 280] },
      // "¡O-LÉ O-LÉ O-LÉ!"
      { tiempos: [0, 0.30, 0.60, 0.90, 1.20],        frecs: [260, 340, 260, 340, 260] },
      // "¡GOL! ¡GOL! ¡GOL!"
      { tiempos: [0, 0.35, 0.70],                     frecs: [320, 320, 320] },
      // glissando ascendente de celebración
      { tiempos: [0, 0.20, 0.40, 0.60, 0.80, 1.00],  frecs: [220, 260, 300, 340, 370, 400] },
    ];

    var patron = patrones[Math.floor(Math.random() * patrones.length)];
    var volBase = musicaActiva ? 0.08 : 0;

    patron.tiempos.forEach(function(t, i) {
      var osc = ctx.createOscillator();
      var env = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.value = patron.frecs[i];

      env.gain.setValueAtTime(0, ctx.currentTime + t);
      env.gain.linearRampToValueAtTime(volBase, ctx.currentTime + t + 0.04);
      env.gain.linearRampToValueAtTime(volBase * 0.6, ctx.currentTime + t + 0.12);
      env.gain.linearRampToValueAtTime(0, ctx.currentTime + t + 0.26);

      osc.connect(env);
      env.connect(ctx.destination);
      osc.start(ctx.currentTime + t);
      osc.stop(ctx.currentTime + t + 0.3);
    });
  }

  function programarCanto() {
    if (cantoTimer) clearTimeout(cantoTimer);
    if (!musicaActiva) return;

    var delay = 15000 + Math.random() * 20000;  // 15-35 segundos
    cantoTimer = setTimeout(function() {
      if (musicaActiva) {
        cantarHinchada();
        programarCanto();
      }
    }, delay);
  }

  function iniciarMusica() {
    if (musicaActiva) return;
    try {
      var ctx = getAudioCtx();
      estadioNodos = crearAmbienteEstadio(ctx);
      musicaActiva = true;
      setIntensidad('base', 1.5);
      programarCanto();
    } catch(e) {
      console.warn('[ambiente] Error al iniciar música:', e);
    }
  }

  function detenerMusica() {
    if (!musicaActiva || !estadioNodos) return;
    try {
      estadioNodos.gainNode.gain.cancelScheduledValues(audioCtx.currentTime);
      estadioNodos.gainNode.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 1.0);
      var nodos = estadioNodos;
      setTimeout(function() {
        try { nodos.whiteNoise.stop(); } catch(e) {}
        try { nodos.lfo.stop(); } catch(e) {}
      }, 1100);
      estadioNodos = null;
      musicaActiva = false;
      if (cantoTimer) { clearTimeout(cantoTimer); cantoTimer = null; }
    } catch(e) {
      console.warn('[ambiente] Error al detener música:', e);
    }
  }

  function toggleMusica() {
    musicaHabilitada = !musicaHabilitada;
    lsPut('tg_musica', musicaHabilitada ? '1' : '0');
    actualizarBotonMusica();

    if (musicaHabilitada) {
      iniciarMusica();
    } else {
      detenerMusica();
    }
  }

  function actualizarBotonMusica() {
    var btn = document.getElementById('amb-btn-musica');
    if (!btn) return;
    btn.textContent = musicaHabilitada ? '🔊' : '🔇';
    btn.title = musicaHabilitada ? 'Silenciar ambiente' : 'Activar ambiente de estadio';
    btn.classList.toggle('amb-activo', musicaHabilitada);
  }

  function crearBotonMusica() {
    if (document.getElementById('amb-btn-musica')) return;

    var mesa = document.getElementById('mesa');
    if (!mesa) return;

    var btn = document.createElement('button');
    btn.id = 'amb-btn-musica';
    btn.className = 'amb-btn-musica';
    btn.textContent = '🔇';
    btn.title = 'Activar ambiente de estadio';
    btn.setAttribute('aria-label', 'Toggle música de estadio');

    btn.addEventListener('click', toggleMusica);
    mesa.appendChild(btn);
  }

  // Reaccionar a eventos del juego para cambiar intensidad
  function hookEventosMusica() {
    if (typeof onJuego !== 'function') return;

    // 'render' → detectar tensión (truco cantado pendiente)
    onJuego('render', function() {
      if (!musicaActiva) return;
      var S = (typeof window.S !== 'undefined') ? window.S : null;
      if (S && S.cantoPendiente === 'truco') {
        if (intensidadActual !== 'tension') setIntensidad('tension', 0.5);
      } else if (intensidadActual === 'tension') {
        setIntensidad('base', 1.2);
      }
    });

    // 'golTribuna' → ronda terminada
    onJuego('golTribuna', function(data) {
      if (!musicaActiva) return;
      if (!data) return;
      if (data.lado === 'jugador') {
        setIntensidad('rondasGano', 0.3);
        setTimeout(cantarHinchada, 200);
        setTimeout(function() {
          if (musicaActiva && intensidadActual === 'rondasGano') setIntensidad('base', 1.0);
        }, 2500);
      } else if (data.lado === 'rival') {
        setIntensidad('rondasPierdo', 0.4);
        setTimeout(function() {
          if (musicaActiva && intensidadActual === 'rondasPierdo') setIntensidad('base', 1.2);
        }, 2000);
      }
    });

    // 'finDePartido' → victoria o derrota
    onJuego('finDePartido', function(data) {
      if (!musicaActiva) return;
      var ganoJugador = data && data.puntosJugador >= data.limite;
      if (ganoJugador) {
        setIntensidad('victoria', 0.3);
        cantarHinchada();
        setTimeout(cantarHinchada, 800);
        setTimeout(cantarHinchada, 1600);
        setTimeout(function() { if (musicaActiva) setIntensidad('base', 2.0); }, 5000);
      } else {
        setIntensidad('derrota', 0.6);
        setTimeout(function() { if (musicaActiva) setIntensidad('base', 2.5); }, 3000);
      }
    });

    // 'nuevoPartido' → reset a base
    onJuego('nuevoPartido', function() {
      if (!musicaActiva) return;
      setIntensidad('base', 1.0);
    });
  }

  function setupMusicaEstadio() {
    musicaHabilitada = lsGet('tg_musica', '0') === '1';

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', crearBotonMusica);
    } else {
      crearBotonMusica();
    }
    actualizarBotonMusica();

    // Si el usuario tenía música activada, arrancar al primer click (política de autoplay)
    if (musicaHabilitada) {
      var iniciarAlClick = function() {
        if (musicaHabilitada && !musicaActiva) iniciarMusica();
        document.removeEventListener('click', iniciarAlClick, true);
      };
      document.addEventListener('click', iniciarAlClick, true);
    }

    hookEventosMusica();
  }

  // ─────────────────────────────────────────────────────────────
  // 2. SISTEMA DE TEMPORADAS MENSUALES
  // ─────────────────────────────────────────────────────────────

  var TEMPORADA_KEY = 'tg_temporada';
  var HISTORIAL_KEY = 'tg_temporadas_historial';

  var MESES = [
    'Enero','Febrero','Marzo','Abril','Mayo','Junio',
    'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'
  ];

  var EQUIPOS_IA = [
    'River Plate','Boca Juniors','Racing Club','Independiente',
    'San Lorenzo','Huracán','Vélez Sársfield','Lanús',
    'Estudiantes','Gimnasia LP','Talleres','Belgrano',
  ];

  var PREMIOS_TEMPORADA = {
    campeon:      { emoji: '🏆', titulo: 'Campeón de la Temporada',   pt: 500 },
    libertadores: { emoji: '🌟', titulo: 'Clasificado a Libertadores', pt: 300 },
    copa:         { emoji: '🥉', titulo: 'Clasificado a Copa',         pt: 150 },
    permanencia:  { emoji: '✅', titulo: 'Permanencia asegurada',      pt: 50  },
    descenso:     { emoji: '📉', titulo: 'Descendiste a División B',   pt: 10  },
  };

  function calcularCategoria(pj, victorias) {
    if (pj === 0) return 'permanencia';
    var winrate = victorias / pj;
    if (winrate > 0.75)  return 'campeon';
    if (winrate > 0.65)  return 'libertadores';
    if (winrate > 0.55)  return 'copa';
    if (winrate >= 0.40) return 'permanencia';
    return 'descenso';
  }

  function getTemporadaActual() {
    var def = {
      mes: 0, año: 0,
      stats: { partidas: 0, victorias: 0, derrotas: 0, ptGanados: 0, logrosDesbloqueados: 0, racha_max: 0 },
    };
    return lsGetJSON(TEMPORADA_KEY, def);
  }

  function guardarTemporada(t) {
    lsPut(TEMPORADA_KEY, JSON.stringify(t));
  }

  function getHistorial() {
    return lsGetJSON(HISTORIAL_KEY, []);
  }

  function guardarHistorial(h) {
    lsPut(HISTORIAL_KEY, JSON.stringify(h));
  }

  function generarTabla(statsJugador) {
    var nombreJugador = lsGet('tg_nombre_dt', 'Vos') || 'Vos';
    var equiposPool = EQUIPOS_IA.slice().sort(function() { return Math.random() - 0.5; });
    var rivales = equiposPool.slice(0, 5);

    var filas = rivales.map(function(nombre) {
      var pj = 5 + Math.floor(Math.random() * 20);
      var pg = Math.floor(pj * (0.3 + Math.random() * 0.5));
      var pp = pj - pg;
      return { nombre: nombre, pj: pj, pg: pg, pp: pp, pct: pj > 0 ? Math.round(pg / pj * 100) : 0, esJugador: false };
    });

    var pj = statsJugador.partidas || 0;
    var pg = statsJugador.victorias || 0;
    var pp = statsJugador.derrotas || 0;
    filas.push({ nombre: nombreJugador, pj: pj, pg: pg, pp: pp, pct: pj > 0 ? Math.round(pg / pj * 100) : 0, esJugador: true });

    filas.sort(function(a, b) { return b.pct - a.pct || b.pg - a.pg; });
    filas.forEach(function(f, i) { f.pos = i + 1; });

    return filas;
  }

  function mostrarModalCierreTemporada(temporadaVieja, premio) {
    var mesNombre = MESES[temporadaVieja.mes - 1] || 'Mes';
    var tabla = generarTabla(temporadaVieja.stats);

    var prev = document.getElementById('tp-cierre-temporada');
    if (prev) prev.remove();

    var modal = document.createElement('div');
    modal.id = 'tp-cierre-temporada';
    modal.className = 'tp-modal-overlay';

    var filasPosiciones = tabla.map(function(f) {
      var clasePos = f.pos === 1 ? 'tp-pos-1' : f.pos === 2 ? 'tp-pos-2' : f.pos === 3 ? 'tp-pos-3' : '';
      return '<tr class="' + (f.esJugador ? 'tp-fila-jugador' : '') + '">' +
        '<td class="tp-td-pos ' + clasePos + '">' + f.pos + '</td>' +
        '<td class="tp-td-nombre">' + (f.esJugador ? '⭐ ' : '') + esc(f.nombre) + '</td>' +
        '<td class="tp-td-num">' + f.pj + '</td>' +
        '<td class="tp-td-num">' + f.pg + '</td>' +
        '<td class="tp-td-num">' + f.pp + '</td>' +
        '<td class="tp-td-pct">' + f.pct + '%</td>' +
        '</tr>';
    }).join('');

    modal.innerHTML =
      '<div class="tp-modal-box">' +
        '<div class="tp-modal-header">' +
          '<span class="tp-mes-titulo">⚽ FIN DE TEMPORADA — ' + mesNombre.toUpperCase() + ' ' + temporadaVieja.año + '</span>' +
        '</div>' +
        '<div class="tp-premio-banner tp-premio-' + premio.cat + '">' +
          '<span class="tp-premio-emoji">' + premio.emoji + '</span>' +
          '<div class="tp-premio-texto">' +
            '<strong>' + premio.titulo + '</strong>' +
            '<span>+' + premio.pt + ' PT ganados</span>' +
          '</div>' +
        '</div>' +
        '<div class="tp-tabla-wrap">' +
          '<table class="tp-tabla">' +
            '<thead><tr>' +
              '<th>#</th><th>Equipo</th><th>PJ</th><th>PG</th><th>PP</th><th>%</th>' +
            '</tr></thead>' +
            '<tbody>' + filasPosiciones + '</tbody>' +
          '</table>' +
        '</div>' +
        '<div class="tp-modal-footer">' +
          '<p class="tp-nueva-temp">🗓️ ¡Empieza una nueva temporada!</p>' +
          '<button class="tp-btn-cerrar" id="tp-btn-cerrar-modal">Continuar</button>' +
        '</div>' +
      '</div>';

    document.body.appendChild(modal);

    document.getElementById('tp-btn-cerrar-modal').addEventListener('click', function() {
      modal.classList.add('tp-modal-fade-out');
      setTimeout(function() { modal.remove(); }, 400);
    });

    setTimeout(function() { modal.classList.add('tp-modal-visible'); }, 30);
  }

  function procesarCierreTemporada(temporadaVieja) {
    var s = temporadaVieja.stats;
    var catKey = calcularCategoria(s.partidas, s.victorias);
    var premioBase = PREMIOS_TEMPORADA[catKey];
    var premio = { cat: catKey, emoji: premioBase.emoji, titulo: premioBase.titulo, pt: premioBase.pt };

    if (typeof window.addPesos === 'function') {
      window.addPesos(premio.pt, 'Temporada: ' + premio.titulo);
    }

    var historial = getHistorial();
    historial.push({
      mes: temporadaVieja.mes,
      año: temporadaVieja.año,
      stats: temporadaVieja.stats,
      resultado: catKey,
      pt: premio.pt,
    });
    if (historial.length > 12) historial.shift();
    guardarHistorial(historial);

    setTimeout(function() {
      mostrarModalCierreTemporada(temporadaVieja, premio);
    }, 1500);
  }

  function iniciarNuevaTemporada(mesActual, añoActual) {
    var nueva = {
      mes: mesActual + 1,  // guardar como 1-12
      año: añoActual,
      stats: { partidas: 0, victorias: 0, derrotas: 0, ptGanados: 0, logrosDesbloqueados: 0, racha_max: 0 },
    };
    guardarTemporada(nueva);
    return nueva;
  }

  function chequearNuevoMes() {
    var hoy = new Date();
    var mesActual = hoy.getMonth();   // 0-11
    var añoActual = hoy.getFullYear();

    var t = getTemporadaActual();

    if (t.mes === 0) {
      iniciarNuevaTemporada(mesActual, añoActual);
      return;
    }

    var mesSaved = t.mes - 1;  // convertir de 1-12 a 0-11
    var añoSaved = t.año;
    var esNuevoMes = (mesActual !== mesSaved) || (añoActual !== añoSaved);

    if (esNuevoMes) {
      if (t.stats.partidas > 0) {
        procesarCierreTemporada(t);
      }
      iniciarNuevaTemporada(mesActual, añoActual);
    }
  }

  function hookTemporadaEnPartidas() {
    if (typeof onJuego !== 'function') return;

    onJuego('finDePartido', function(data) {
      var t = getTemporadaActual();
      if (!t || t.mes === 0) return;

      t.stats.partidas = (t.stats.partidas || 0) + 1;

      if (data && data.puntosJugador >= data.limite) {
        t.stats.victorias = (t.stats.victorias || 0) + 1;
      } else {
        t.stats.derrotas = (t.stats.derrotas || 0) + 1;
      }

      var rachaActual = typeof window._extRachaActual === 'function' ? window._extRachaActual() : 0;
      if (rachaActual > (t.stats.racha_max || 0)) {
        t.stats.racha_max = rachaActual;
      }

      guardarTemporada(t);
      actualizarCardTemporada();
    });
  }

  function calcularProyeccion(pj, victorias) {
    if (pj < 3) return 'Muy pronto para proyectar';
    var cat = calcularCategoria(pj, victorias);
    var info = PREMIOS_TEMPORADA[cat];
    return 'Vas a terminar: ' + info.emoji + ' ' + info.titulo;
  }

  function crearCardTemporada() {
    if (document.getElementById('tp-tabla-temporada')) return;

    var menu = document.getElementById('menu') ||
               document.getElementById('pantalla-inicio') ||
               document.getElementById('pantalla-menu') ||
               document.querySelector('.pantalla-menu') ||
               document.querySelector('[id*="menu"]');
    if (!menu) return;

    var card = document.createElement('div');
    card.id = 'tp-tabla-temporada';
    card.className = 'tp-card-temporada';
    menu.appendChild(card);
    actualizarCardTemporada();
  }

  function actualizarCardTemporada() {
    var card = document.getElementById('tp-tabla-temporada');
    if (!card) return;

    var t = getTemporadaActual();
    if (!t || t.mes === 0) { card.style.display = 'none'; return; }

    var mesNombre = MESES[t.mes - 1] || 'Mes';
    var s = t.stats;
    var pct = s.partidas > 0 ? Math.round(s.victorias / s.partidas * 100) : 0;

    var hoy = new Date();
    var diasDelMes = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0).getDate();
    var diasRestantes = diasDelMes - hoy.getDate();

    var proyeccion = calcularProyeccion(s.partidas, s.victorias);

    card.innerHTML =
      '<div class="tp-card-titulo">📅 Temporada ' + mesNombre + ' ' + t.año + '</div>' +
      '<div class="tp-card-stats">' +
        '<span>PJ: <strong>' + s.partidas + '</strong></span>' +
        '<span>PG: <strong>' + s.victorias + '</strong></span>' +
        '<span>PP: <strong>' + s.derrotas + '</strong></span>' +
        '<span>%: <strong>' + pct + '%</strong></span>' +
      '</div>' +
      '<div class="tp-card-dias">⏳ ' + diasRestantes + ' días restantes</div>' +
      '<div class="tp-card-proyeccion">' + proyeccion + '</div>';

    card.style.display = '';
  }

  function setupTemporadas() {
    chequearNuevoMes();
    hookTemporadaEnPartidas();

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', crearCardTemporada);
    } else {
      crearCardTemporada();
    }

    window.getTemporadaActual = getTemporadaActual;
    window.actualizarCardTemporada = actualizarCardTemporada;
  }

  // ─────────────────────────────────────────────────────────────
  // INIT
  // ─────────────────────────────────────────────────────────────

  function init() {
    try { setupMusicaEstadio(); } catch(e) { console.warn('[ambiente] musica:', e); }
    try { setupTemporadas(); }    catch(e) { console.warn('[ambiente] temporadas:', e); }
  }

  window.addEventListener('load', function() {
    setTimeout(init, 1000);
  });

  // API pública
  window.toggleMusicaEstadio = toggleMusica;
  window.setIntensidadMusica  = setIntensidad;

})();
