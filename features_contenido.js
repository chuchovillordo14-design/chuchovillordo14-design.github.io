// features_contenido.js
// Copa del Mundo de Naciones | Tabla de Récords | Estadísticas Avanzadas
// Depende de: juego.js (onJuego, finDePartido), features_progression.js (addPesos, tg_historial)

(function () {
  'use strict';

  // lsGet/lsPut viven en features_storage.js (compartidos).

  // ─── Historial de partidas (compartido con features_progression) ──────────
  function getHistorial() {
    try { return JSON.parse(lsGet('tg_historial', '[]')); } catch(e) { return []; }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // FEATURE 1: COPA DEL MUNDO DE NACIONES
  // ═══════════════════════════════════════════════════════════════════════════

  var SELECCIONES_MUNDIAL = [
    { id: 'argentina',  nombre: 'Argentina',  bandera: '🇦🇷', color: '#74ACDF', himno_desc: 'Oid Mortales' },
    { id: 'brasil',     nombre: 'Brasil',     bandera: '🇧🇷', color: '#009C3B', himno_desc: 'Hino Nacional' },
    { id: 'uruguay',    nombre: 'Uruguay',    bandera: '🇺🇾', color: '#5ba4cf', himno_desc: 'Orientales' },
    { id: 'francia',    nombre: 'Francia',    bandera: '🇫🇷', color: '#0055A4', himno_desc: 'La Marsellesa' },
    { id: 'espana',     nombre: 'España',     bandera: '🇪🇸', color: '#AA151B', himno_desc: 'Marcha Real' },
    { id: 'alemania',   nombre: 'Alemania',   bandera: '🇩🇪', color: '#555555', himno_desc: 'Deutschlandlied' },
    { id: 'italia',     nombre: 'Italia',     bandera: '🇮🇹', color: '#009246', himno_desc: "Fratelli d'Italia" },
    { id: 'inglaterra', nombre: 'Inglaterra', bandera: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', color: '#CF142B', himno_desc: 'God Save the King' },
  ];

  var NARRATIVAS_RIVAL = {
    argentina:  {
      pre:    'Espejo: enfrentás a una copia tuya. El truco mental será decisivo.',
      gano:   '¡Ganaste el clásico nacional! Puro corazón argentino.',
      perdio: 'Te ganó otro argentino. Duele más.',
    },
    brasil: {
      pre:    'El clásico sudamericano. El Maracanazo al revés. Brasil viene enojado.',
      gano:   '¡Le ganaste a Brasil! El Monumental explota. Histórico.',
      perdio: 'Brasil ganó. El Jogo Bonito se impuso esta vez.',
    },
    uruguay: {
      pre:    'Uruguay: pocos puntos, toda la garra. Cuidado con el mate amargo.',
      gano:   '¡Uruguay cayó! La Celeste baja la cabeza.',
      perdio: 'Uruguay ganó con carácter. Próxima vez.',
    },
    francia: {
      pre:    'Francia: elegancia y frialdad. No se inmutan con nada.',
      gano:   '¡Venciste a la selección campeona! Mon dieu.',
      perdio: 'Les Bleus fueron superiores esta vez.',
    },
    espana: {
      pre:    'España: tiki-taka del truco. Te van a marear con los cantos.',
      gano:   '¡Olé! España eliminada. La Roja se fue a casa.',
      perdio: 'España mantuvo la pelota y ganó. Paciencia.',
    },
    alemania: {
      pre:    'Alemania: disciplina máxima, sin errores. El truco requiere sangre fría.',
      gano:   '¡7-1 al revés! El mundo no lo puede creer.',
      perdio: 'Die Mannschaft fue implacable. Próxima vez.',
    },
    italia: {
      pre:    'Italia: defensiva, astuta, peligrosa. El catenaccio del truco.',
      gano:   '¡Gli Azzurri eliminados! Mamma mia.',
      perdio: 'Italia esperó el error y lo aprovechó.',
    },
    inglaterra: {
      pre:    'Inglaterra: convencidos de que inventaron el truco. A demostrarles.',
      gano:   '¡Les ganaste a los ingleses! Venganza del naipe.',
      perdio: 'England dreaming. Ganaron esta vez.',
    },
  };

  var PREMIOS_MUNDIAL = { grupos: 150, semis: 300, final: 600, campeon: 1500 };

  var mundialState = {
    activo:               false,
    seleccion:            null,
    rival:                null,
    fase:                 null,
    pantalla:             'seleccion',
    _esperandoResultado:  false,
  };

  function getSelById(id) {
    return SELECCIONES_MUNDIAL.find(function(s) { return s.id === id; }) || SELECCIONES_MUNDIAL[0];
  }

  function shuffle(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  function setupMundial() {
    _crearModalMundial();
    _crearBtnMundial();
  }

  function _crearBtnMundial() {
    var secciones = document.querySelectorAll('.mm-seccion');
    var secCopas = null;
    secciones.forEach(function(s) {
      if (s.textContent && s.textContent.indexOf('COPAS') !== -1) secCopas = s;
    });
    if (!secCopas) return;
    if (document.getElementById('btn-fc-mundial')) return;
    var btn = document.createElement('button');
    btn.id = 'btn-fc-mundial';
    btn.className = 'mm-btn mm-btn-secondary';
    btn.innerHTML =
      '<span class="mm-btn-icon">🌍</span>' +
      '<span class="mm-btn-text"><strong>COPA DEL MUNDO</strong><small>Selecciones nacionales</small></span>';
    btn.onclick = function() { abrirMundial(); };
    secCopas.parentNode.insertBefore(btn, secCopas.nextSibling);
  }

  function _crearModalMundial() {
    if (document.getElementById('fc-mundial-modal')) return;
    var div = document.createElement('div');
    div.className = 'modal fc-modal-fullscreen';
    div.id = 'fc-mundial-modal';
    div.innerHTML =
      '<div class="modal-box fc-mundial-box">' +
        '<button class="fc-modal-close" onclick="cerrarMundial()">✕</button>' +
        '<div id="fc-mundial-inner"></div>' +
      '</div>';
    document.body.appendChild(div);
  }

  function abrirMundial() {
    var modal = document.getElementById('fc-mundial-modal');
    if (!modal) return;
    modal.classList.add('show');
    _renderMundialPantalla();
  }

  function cerrarMundial() {
    var modal = document.getElementById('fc-mundial-modal');
    if (modal) modal.classList.remove('show');
  }

  function _renderMundialPantalla() {
    var inner = document.getElementById('fc-mundial-inner');
    if (!inner) return;
    var p = mundialState.pantalla;
    if      (p === 'seleccion')  inner.innerHTML = _tplSeleccion();
    else if (p === 'sorteo')     inner.innerHTML = _tplSorteo();
    else if (p === 'grupos' || p === 'semis' || p === 'final') inner.innerHTML = _tplPartida(p);
    else if (p === 'campeon')    inner.innerHTML = _tplCampeon();
    else if (p === 'eliminado')  inner.innerHTML = _tplEliminado();
  }

  function _tplSeleccion() {
    var html =
      '<div class="fc-mundial-header">' +
        '<div class="fc-mundial-logo">🏆</div>' +
        '<h2 class="fc-mundial-titulo">COPA DEL MUNDO</h2>' +
        '<p class="fc-mundial-sub">Elegí tu selección y conquistá el mundo</p>' +
      '</div>' +
      '<div class="fc-selecciones-grid">';
    SELECCIONES_MUNDIAL.forEach(function(sel) {
      html +=
        '<button class="fc-sel-card" style="border-color:' + sel.color + '" ' +
          'onclick="fcElegirSeleccion(\'' + sel.id + '\')">' +
          '<span class="fc-sel-bandera">' + sel.bandera + '</span>' +
          '<span class="fc-sel-nombre">' + sel.nombre + '</span>' +
          '<span class="fc-sel-himno">' + sel.himno_desc + '</span>' +
        '</button>';
    });
    html += '</div>';
    return html;
  }

  function _tplSorteo() {
    var otras = SELECCIONES_MUNDIAL.filter(function(s) { return s.id !== mundialState.seleccion.id; });
    var bolas = shuffle(otras);
    var html =
      '<div class="fc-mundial-header">' +
        '<h2 class="fc-mundial-titulo">SORTEO DE GRUPOS</h2>' +
        '<p class="fc-mundial-sub">' + mundialState.seleccion.bandera + ' ' + mundialState.seleccion.nombre + ' está en el bombo</p>' +
      '</div>' +
      '<div class="fc-sorteo-bolas">';
    bolas.forEach(function(s, i) {
      html += '<div class="fc-bola" style="animation-delay:' + (i * 0.15) + 's">' + s.bandera + '</div>';
    });
    html += '</div>' +
      '<div class="fc-sorteo-rival">' +
        '<p>Tu primer rival:</p>' +
        '<div class="fc-rival-grande">' + mundialState.rival.bandera + ' ' + mundialState.rival.nombre + '</div>' +
      '</div>' +
      '<div class="fc-narrativa">' + ((NARRATIVAS_RIVAL[mundialState.rival.id] || {}).pre || '') + '</div>' +
      '<button class="fc-btn-primario" onclick="fcIniciarFase()">⚽ JUGAR FASE DE GRUPOS</button>';
    return html;
  }

  function _tplPartida(fase) {
    var labels = { grupos: 'FASE DE GRUPOS', semis: 'SEMIFINAL', final: 'GRAN FINAL 🏆' };
    var narrativa = NARRATIVAS_RIVAL[mundialState.rival.id] || {};
    return (
      '<div class="fc-mundial-header">' +
        '<div class="fc-fase-badge">' + labels[fase] + '</div>' +
        '<div class="fc-versus">' +
          '<div class="fc-team">' +
            '<span class="fc-team-flag">' + mundialState.seleccion.bandera + '</span>' +
            '<span class="fc-team-name">' + mundialState.seleccion.nombre + '</span>' +
          '</div>' +
          '<span class="fc-vs">VS</span>' +
          '<div class="fc-team">' +
            '<span class="fc-team-flag">' + mundialState.rival.bandera + '</span>' +
            '<span class="fc-team-name">' + mundialState.rival.nombre + '</span>' +
          '</div>' +
        '</div>' +
        '<div class="fc-narrativa">' + (narrativa.pre || '') + '</div>' +
      '</div>' +
      '<div class="fc-partida-acciones">' +
        '<button class="fc-btn-primario" onclick="fcJugarPartidaMundial()">⚽ JUGAR AHORA</button>' +
        '<button class="fc-btn-secundario" onclick="cerrarMundial()">Volver al menú</button>' +
      '</div>'
    );
  }

  function _tplCampeon() {
    var sel = mundialState.seleccion;
    return (
      '<div class="fc-campeon-screen">' +
        '<div class="fc-confetti-container" id="fc-confetti-box"></div>' +
        '<div class="fc-trofeo-anim">🏆</div>' +
        '<div class="fc-campeon-bandera">' + sel.bandera + '</div>' +
        '<h1 class="fc-campeon-titulo">CAMPEÓN<br>DEL MUNDO</h1>' +
        '<div class="fc-campeon-nombre">' + sel.nombre + '</div>' +
        '<div class="fc-campeon-premio">+' + PREMIOS_MUNDIAL.campeon + ' PT 🌟</div>' +
        '<button class="fc-btn-primario" onclick="fcNuevoMundial()">🌍 NUEVA COPA</button>' +
        '<button class="fc-btn-secundario" onclick="cerrarMundial()">Volver al menú</button>' +
      '</div>'
    );
  }

  function _tplEliminado() {
    var narrativa = ((NARRATIVAS_RIVAL[mundialState.rival ? mundialState.rival.id : ''] || {}).perdio) || 'Eliminado. Próxima vez.';
    return (
      '<div class="fc-eliminado-screen">' +
        '<div class="fc-eliminado-icon">😔</div>' +
        '<h2 class="fc-eliminado-titulo">ELIMINADO</h2>' +
        '<div class="fc-narrativa">' + narrativa + '</div>' +
        '<button class="fc-btn-primario" onclick="fcNuevoMundial()">🔄 INTENTAR DE NUEVO</button>' +
        '<button class="fc-btn-secundario" onclick="cerrarMundial()">Volver al menú</button>' +
      '</div>'
    );
  }

  window.fcElegirSeleccion = function(id) {
    mundialState.seleccion = getSelById(id);
    mundialState.pantalla  = 'sorteo';
    var otras = SELECCIONES_MUNDIAL.filter(function(s) { return s.id !== id; });
    mundialState.rival = shuffle(otras)[0];
    mundialState.fase  = 'grupos';
    mundialState.activo = true;
    _renderMundialPantalla();
  };

  window.fcIniciarFase = function() {
    mundialState.pantalla = mundialState.fase;
    _renderMundialPantalla();
  };

  window.fcJugarPartidaMundial = function() {
    cerrarMundial();
    mundialState._esperandoResultado = true;
    if (typeof window.nuevoJuego === 'function') window.nuevoJuego();
    else if (typeof window.irA === 'function') window.irA('juego-screen');
  };

  function _procesarResultadoMundial(data) {
    if (!mundialState._esperandoResultado) return;
    mundialState._esperandoResultado = false;

    var limite  = data.limite || 30;
    var ganamos = data.puntosJugador >= limite;

    if (!ganamos) {
      mundialState.pantalla = 'eliminado';
      setTimeout(function() { abrirMundial(); }, 600);
      return;
    }

    // Premio por fase
    var premioFase = { grupos: PREMIOS_MUNDIAL.grupos, semis: PREMIOS_MUNDIAL.semis, final: PREMIOS_MUNDIAL.final };
    var p = premioFase[mundialState.fase] || 0;
    if (p > 0 && typeof window.addPesos === 'function') window.addPesos(p, 'Mundial - ' + mundialState.fase);

    // Avanzar de fase
    var usados = [mundialState.seleccion.id, mundialState.rival.id];
    var restantes = SELECCIONES_MUNDIAL.filter(function(s) { return usados.indexOf(s.id) === -1; });

    if (mundialState.fase === 'grupos') {
      mundialState.fase  = 'semis';
      mundialState.rival = shuffle(restantes)[0];
      mundialState.pantalla = 'semis';
    } else if (mundialState.fase === 'semis') {
      mundialState.fase  = 'final';
      mundialState.rival = shuffle(restantes)[0];
      mundialState.pantalla = 'final';
    } else if (mundialState.fase === 'final') {
      mundialState.pantalla = 'campeon';
      if (typeof window.addPesos === 'function') window.addPesos(PREMIOS_MUNDIAL.campeon, 'CAMPEÓN DEL MUNDO');
      actualizarRecord('torneo_wins', _getRecordValor('torneo_wins') + 1, 'Copa del Mundo');
    }

    setTimeout(function() {
      abrirMundial();
      if (mundialState.pantalla === 'campeon') {
        setTimeout(_lanzarConfetti, 400);
      }
    }, 600);
  }

  function _lanzarConfetti() {
    var box = document.getElementById('fc-confetti-box');
    if (!box) return;
    var colores = mundialState.seleccion
      ? [mundialState.seleccion.color, '#FFD700', '#FFFFFF']
      : ['#FFD700', '#4CAF50', '#FFFFFF'];
    for (var i = 0; i < 60; i++) {
      (function(idx) {
        var p = document.createElement('div');
        p.className = 'fc-confetti-piece';
        p.style.left             = Math.random() * 100 + '%';
        p.style.background       = colores[idx % colores.length];
        p.style.animationDelay    = Math.random() * 2 + 's';
        p.style.animationDuration = (1.5 + Math.random() * 2) + 's';
        box.appendChild(p);
        setTimeout(function() { if (p.parentNode) p.parentNode.removeChild(p); }, 4500);
      })(i);
    }
  }

  window.fcNuevoMundial = function() {
    mundialState = {
      activo: false, seleccion: null, rival: null,
      fase: null, pantalla: 'seleccion', _esperandoResultado: false,
    };
    _renderMundialPantalla();
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // FEATURE 2: TABLA DE RÉCORDS LOCALES
  // ═══════════════════════════════════════════════════════════════════════════

  var RECORDS_DEFINICION = [
    { id: 'racha_max',      nombre: 'Racha Máxima',          emoji: '🔥', unidad: 'victorias seguidas', teorico: 50    },
    { id: 'pt_dia',         nombre: 'Más PT en un día',      emoji: '💰', unidad: 'PT',                 teorico: 5000  },
    { id: 'partida_rapida', nombre: 'Partida más rápida',    emoji: '⚡', unidad: 'manos jugadas',      teorico: 20    },
    { id: 'pt_total',       nombre: 'PT Totales Ganados',    emoji: '⭐', unidad: 'PT acumulados',      teorico: 50000 },
    { id: 'victorias',      nombre: 'Total de Victorias',    emoji: '🏆', unidad: 'partidas ganadas',   teorico: 500   },
    { id: 'envidos_gana',   nombre: 'Envidos Ganados',       emoji: '🎯', unidad: 'envidos',            teorico: 300   },
    { id: 'trucos_canta',   nombre: 'Trucos Cantados',       emoji: '📢', unidad: 'trucos',             teorico: 500   },
    { id: 'partidas_total', nombre: 'Total de Partidas',     emoji: '🃏', unidad: 'partidas',           teorico: 1000  },
    { id: 'max_puntos',     nombre: 'Máx Puntos en Partida', emoji: '📊', unidad: 'puntos',             teorico: 30    },
    { id: 'torneo_wins',    nombre: 'Torneos Ganados',       emoji: '🥇', unidad: 'torneos',            teorico: 50    },
    { id: 'desafios',       nombre: 'Desafíos Completados',  emoji: '📅', unidad: 'desafíos',           teorico: 100   },
    { id: 'logros_total',   nombre: 'Logros Desbloqueados',  emoji: '🏅', unidad: 'logros',             teorico: 50    },
  ];

  function getRecords() {
    try { return JSON.parse(lsGet('tg_records', '{}')); } catch(e) { return {}; }
  }
  function saveRecords(r) { lsPut('tg_records', JSON.stringify(r)); }

  function _getRecordValor(id) {
    var r = getRecords();
    return r[id] ? r[id].valor : 0;
  }

  function actualizarRecord(id, nuevoValor, contexto) {
    if (typeof nuevoValor !== 'number' || isNaN(nuevoValor)) return false;
    var r      = getRecords();
    var actual = r[id] ? r[id].valor : 0;

    // partida_rapida: menor es mejor
    var esMejor = (id === 'partida_rapida')
      ? (actual === 0 || nuevoValor < actual)
      : (nuevoValor > actual);

    if (!esMejor) return false;

    r[id] = { valor: nuevoValor, fecha: _formatFechaCorta(new Date()), contexto: contexto || '' };
    saveRecords(r);
    _mostrarNotifNuevoRecord(id, nuevoValor);
    return true;
  }

  function _formatFechaCorta(d) {
    function p(n) { return String(n).padStart(2, '0'); }
    return p(d.getDate()) + '/' + p(d.getMonth() + 1) + '/' + d.getFullYear();
  }

  function _mostrarNotifNuevoRecord(id, valor) {
    var def = RECORDS_DEFINICION.find(function(r) { return r.id === id; });
    if (!def) return;
    var n = document.createElement('div');
    n.className = 'fc-notif-record';
    n.innerHTML = '🆕 <strong>¡NUEVO RÉCORD!</strong><br>' + def.emoji + ' ' + def.nombre + ': <strong>' + valor + '</strong> ' + def.unidad;
    document.body.appendChild(n);
    setTimeout(function() { n.classList.add('fc-notif-show'); }, 50);
    setTimeout(function() {
      n.classList.remove('fc-notif-show');
      setTimeout(function() { if (n.parentNode) n.parentNode.removeChild(n); }, 400);
    }, 3500);
  }

  function setupRecords() {
    _crearModalRecords();
    _crearBtnRecords();
    _hookRecordsFinDePartida();
  }

  function _crearBtnRecords() {
    var footer = document.querySelector('.mm-footer');
    if (!footer) return;
    if (document.getElementById('btn-fc-records')) return;
    var btn = document.createElement('button');
    btn.id = 'btn-fc-records';
    btn.className = 'mm-link';
    btn.textContent = '📊 MIS RÉCORDS';
    btn.onclick = function() { abrirRecords(); };
    footer.appendChild(btn);
  }

  function _crearModalRecords() {
    if (document.getElementById('fc-records-modal')) return;
    var div = document.createElement('div');
    div.className = 'modal';
    div.id = 'fc-records-modal';
    div.innerHTML =
      '<div class="modal-box fc-modal-box">' +
        '<button class="fc-modal-close" onclick="cerrarRecords()">✕</button>' +
        '<h2 class="fc-modal-titulo">📊 MIS RÉCORDS</h2>' +
        '<div id="fc-records-grid" class="fc-records-grid"></div>' +
        '<button class="fc-btn-secundario" style="margin-top:14px;width:100%;" onclick="cerrarRecords()">CERRAR</button>' +
      '</div>';
    document.body.appendChild(div);
  }

  function abrirRecords() {
    var modal = document.getElementById('fc-records-modal');
    if (!modal) return;
    _renderRecords();
    modal.classList.add('show');
  }

  function cerrarRecords() {
    var modal = document.getElementById('fc-records-modal');
    if (modal) modal.classList.remove('show');
  }

  function _renderRecords() {
    var grid = document.getElementById('fc-records-grid');
    if (!grid) return;
    var r = getRecords();
    grid.innerHTML = '';
    RECORDS_DEFINICION.forEach(function(def) {
      var entry  = r[def.id] || null;
      var valor  = entry ? entry.valor : 0;
      var fecha  = entry ? entry.fecha : '—';
      var ctx    = entry ? (entry.contexto || '') : '';
      var pct    = def.teorico ? Math.min(100, Math.round(valor / def.teorico * 100)) : 0;

      var card = document.createElement('div');
      card.className = 'fc-record-card' + (entry ? '' : ' fc-record-vacio');
      card.innerHTML =
        '<div class="fc-rec-emoji">' + def.emoji + '</div>' +
        '<div class="fc-rec-info">' +
          '<div class="fc-rec-nombre">' + def.nombre + '</div>' +
          '<div class="fc-rec-valor">' + (valor || '—') + (valor ? ' <small>' + def.unidad + '</small>' : '') + '</div>' +
          '<div class="fc-rec-fecha">' + (entry ? fecha : 'Sin registro') + (ctx ? ' · ' + ctx : '') + '</div>' +
          '<div class="fc-rec-barra-wrap"><div class="fc-rec-barra" style="width:' + pct + '%"></div></div>' +
        '</div>';
      grid.appendChild(card);
    });
  }

  function _hookRecordsFinDePartida() {
    if (typeof window.onJuego !== 'function') return;

    var _manosPartida = 0;

    onJuego('nuevoPartido', function() { _manosPartida = 0; });
    onJuego('nuevaMano',    function() { _manosPartida++; });

    onJuego('finDePartido', function(data) {
      if (!data) return;
      var limite  = data.limite || 30;
      var ganamos = data.puntosJugador >= limite;

      // Victorias totales
      var partG = parseInt(lsGet('tg_partidas_g', '0'), 10) || 0;
      actualizarRecord('victorias', partG, '');

      // Partidas totales
      var hist = getHistorial();
      actualizarRecord('partidas_total', hist.length, '');

      // Puntos máximos en una partida
      actualizarRecord('max_puntos', data.puntosJugador || 0, '');

      // Racha máxima
      var rachaActual = parseInt(lsGet('tg_racha', '0'), 10) || 0;
      if (ganamos) actualizarRecord('racha_max', rachaActual, 'Racha activa');

      // PT totales acumulados
      var ptTotal = parseInt(lsGet('tg_pesos', '0'), 10) || 0;
      actualizarRecord('pt_total', ptTotal, '');

      // PT en el día
      var hoyStr = _formatFechaCorta(new Date());
      if (lsGet('tg_rec_ptdia_fecha', '') !== hoyStr) {
        lsPut('tg_rec_ptdia_fecha', hoyStr);
        lsPut('tg_rec_ptdia_acum', '0');
      }
      if (ganamos) {
        var ptDia = (parseInt(lsGet('tg_rec_ptdia_acum', '0'), 10) || 0) + (data.puntosJugador || 0);
        lsPut('tg_rec_ptdia_acum', String(ptDia));
        actualizarRecord('pt_dia', ptDia, hoyStr);
      }

      // Partida más rápida (ganada con menos manos)
      if (ganamos && _manosPartida > 0) actualizarRecord('partida_rapida', _manosPartida, 'Partida veloz');

      // Logros desbloqueados
      try {
        var logros = JSON.parse(localStorage.getItem('tg_logros') || '[]');
        actualizarRecord('logros_total', logros.length, '');
      } catch(e) {}

      _manosPartida = 0;
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // FEATURE 3: ESTADÍSTICAS AVANZADAS CON CHART.JS
  // ═══════════════════════════════════════════════════════════════════════════

  var _chartsInstancias = {};

  function setupEstadisticas() {
    _crearModalStats();
    _crearBtnStats();
  }

  function _crearBtnStats() {
    var footer = document.querySelector('.mm-footer');
    if (!footer) return;
    if (document.getElementById('btn-fc-estads')) return;
    var btn = document.createElement('button');
    btn.id = 'btn-fc-estads';
    btn.className = 'mm-link';
    btn.textContent = '📈 ESTADÍSTICAS';
    btn.onclick = function() { abrirEstadisticas(); };
    footer.appendChild(btn);
  }

  function _crearModalStats() {
    if (document.getElementById('fc-stats-modal')) return;
    var div = document.createElement('div');
    div.className = 'modal fc-modal-fullscreen';
    div.id = 'fc-stats-modal';
    div.innerHTML =
      '<div class="modal-box fc-stats-box">' +
        '<button class="fc-modal-close" onclick="cerrarEstadisticas()">✕</button>' +
        '<div class="fc-stats-header">' +
          '<h2 class="fc-modal-titulo">📊 MIS ESTADÍSTICAS</h2>' +
          '<div style="display:flex;gap:8px">' +
            '<button class="fc-btn-mini" onclick="fcRefrescarStats()">🔄 Actualizar</button>' +
            '<button class="fc-btn-mini" onclick="fcCapturarStats()">📸 Capturar</button>' +
          '</div>' +
        '</div>' +
        '<div id="fc-stats-resumen" class="fc-stats-resumen"></div>' +
        '<div id="fc-stats-empty" class="fc-stats-empty" style="display:none">📊 Jugá más partidas para ver tus stats</div>' +
        '<div class="fc-charts-grid">' +
          '<div class="fc-chart-section">' +
            '<div class="fc-chart-titulo">📈 Últimas 20 partidas</div>' +
            '<canvas id="fc-chart-linea" height="120"></canvas>' +
          '</div>' +
          '<div class="fc-chart-section">' +
            '<div class="fc-chart-titulo">🥧 Victorias vs Derrotas</div>' +
            '<canvas id="fc-chart-donut" height="160"></canvas>' +
          '</div>' +
          '<div class="fc-chart-section fc-chart-full">' +
            '<div class="fc-chart-titulo">📅 Últimos 6 meses</div>' +
            '<canvas id="fc-chart-barras" height="140"></canvas>' +
          '</div>' +
        '</div>' +
        '<button class="fc-btn-secundario" style="margin-top:14px;width:100%;" onclick="cerrarEstadisticas()">CERRAR</button>' +
      '</div>';
    document.body.appendChild(div);
  }

  function abrirEstadisticas() {
    var modal = document.getElementById('fc-stats-modal');
    if (!modal) return;
    modal.classList.add('show');
    cargarChartJS(renderizarGraficos);
  }

  function cerrarEstadisticas() {
    var modal = document.getElementById('fc-stats-modal');
    if (modal) modal.classList.remove('show');
  }

  function cargarChartJS(callback) {
    if (window.Chart) { callback(); return; }
    var s = document.createElement('script');
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.min.js';
    s.onload = callback;
    s.onerror = function() {
      var empty = document.getElementById('fc-stats-empty');
      if (empty) { empty.style.display = 'block'; empty.textContent = '⚠️ No se pudo cargar Chart.js. Revisá tu conexión.'; }
    };
    document.head.appendChild(s);
  }

  function renderizarGraficos() {
    var historial = getHistorial();
    var resumen   = document.getElementById('fc-stats-resumen');
    var empty     = document.getElementById('fc-stats-empty');

    if (historial.length < 3) {
      if (empty)   { empty.style.display = 'block'; empty.textContent = '📊 Jugá más partidas para ver tus stats'; }
      if (resumen) resumen.innerHTML = '';
      return;
    }
    if (empty) empty.style.display = 'none';

    var pj  = historial.length;
    var pg  = historial.filter(function(p) { return p.resultado === 'victoria'; }).length;
    var pp  = pj - pg;
    var pct = pj > 0 ? Math.round(pg / pj * 100) : 0;
    var racha = parseInt(lsGet('tg_racha', '0'), 10) || 0;

    if (resumen) {
      resumen.innerHTML =
        '<div class="fc-stat-pill">PJ <strong>' + pj + '</strong></div>' +
        '<div class="fc-stat-pill verde">PG <strong>' + pg + '</strong></div>' +
        '<div class="fc-stat-pill rojo">PP <strong>' + pp + '</strong></div>' +
        '<div class="fc-stat-pill">% <strong>' + pct + '%</strong></div>' +
        '<div class="fc-stat-pill">Racha <strong>' + racha + '</strong></div>';
    }

    // Destruir instancias previas
    ['linea', 'donut', 'barras'].forEach(function(k) {
      if (_chartsInstancias[k]) {
        try { _chartsInstancias[k].destroy(); } catch(e) {}
        delete _chartsInstancias[k];
      }
    });

    // ── Gráfico 1: línea últimas 20 partidas ─────────────────────────────
    var ultimas20 = historial.slice(-20);
    var ctxLinea  = document.getElementById('fc-chart-linea');
    if (ctxLinea && window.Chart) {
      _chartsInstancias.linea = new window.Chart(ctxLinea, {
        type: 'line',
        data: {
          labels: ultimas20.map(function(_, i) { return '#' + (i + 1); }),
          datasets: [{
            data: ultimas20.map(function(p) { return p.resultado === 'victoria' ? 1 : 0; }),
            borderColor: '#4caf50',
            backgroundColor: 'rgba(76,175,80,0.08)',
            tension: 0.3,
            pointBackgroundColor: ultimas20.map(function(p) { return p.resultado === 'victoria' ? '#4caf50' : '#f44336'; }),
            pointRadius: 5,
            fill: true,
          }],
        },
        options: {
          responsive: true,
          plugins: { legend: { display: false } },
          scales: {
            y: { min: -0.1, max: 1.1, display: false },
            x: { ticks: { color: '#aaa', font: { size: 9 } }, grid: { color: 'rgba(255,255,255,0.05)' } },
          },
        },
      });
    }

    // ── Gráfico 2: donut victorias/derrotas ──────────────────────────────
    var ctxDonut = document.getElementById('fc-chart-donut');
    if (ctxDonut && window.Chart) {
      _chartsInstancias.donut = new window.Chart(ctxDonut, {
        type: 'doughnut',
        data: {
          labels: ['Victorias', 'Derrotas'],
          datasets: [{
            data: [pg, pp],
            backgroundColor: ['#4caf50', '#f44336'],
            borderWidth: 0,
          }],
        },
        options: {
          cutout: '70%',
          plugins: {
            legend: { position: 'bottom', labels: { color: '#ccc', font: { size: 11 } } },
            tooltip: {
              callbacks: {
                label: function(ctx) {
                  var total = ctx.dataset.data.reduce(function(a, b) { return a + b; }, 0);
                  return ctx.label + ': ' + ctx.parsed + ' (' + (total ? Math.round(ctx.parsed / total * 100) : 0) + '%)';
                },
              },
            },
          },
        },
        plugins: [{
          id: 'fc-center-text',
          afterDraw: function(chart) {
            var w = chart.width, h = chart.height;
            var c = chart.ctx;
            c.save();
            c.font = 'bold 22px sans-serif';
            c.fillStyle = '#fff';
            c.textAlign = 'center';
            c.textBaseline = 'middle';
            c.fillText(pct + '%', w / 2, h / 2 - 10);
            c.font = '10px sans-serif';
            c.fillStyle = '#aaa';
            c.fillText('victorias', w / 2, h / 2 + 12);
            c.restore();
          },
        }],
      });
    }

    // ── Gráfico 3: barras apiladas últimos 6 meses ────────────────────────
    var ctxBarras = document.getElementById('fc-chart-barras');
    if (ctxBarras && window.Chart) {
      var meses   = _ultimos6Meses();
      var porMes  = _agruparPorMes(historial, meses);
      _chartsInstancias.barras = new window.Chart(ctxBarras, {
        type: 'bar',
        data: {
          labels: meses.map(function(m) { return m.label; }),
          datasets: [
            {
              label: 'Victorias',
              data: meses.map(function(m) { return (porMes[m.key] || { v: 0 }).v; }),
              backgroundColor: 'rgba(76,175,80,0.85)',
              borderRadius: 4,
            },
            {
              label: 'Derrotas',
              data: meses.map(function(m) { return (porMes[m.key] || { d: 0 }).d; }),
              backgroundColor: 'rgba(244,67,54,0.85)',
              borderRadius: 4,
            },
          ],
        },
        options: {
          responsive: true,
          indexAxis: 'y',
          plugins: {
            legend: { position: 'bottom', labels: { color: '#ccc', font: { size: 11 } } },
          },
          scales: {
            x: { stacked: true, ticks: { color: '#aaa', font: { size: 10 } }, grid: { color: 'rgba(255,255,255,0.05)' } },
            y: { stacked: true, ticks: { color: '#ccc', font: { size: 10 } }, grid: { display: false } },
          },
        },
      });
    }
  }

  function _ultimos6Meses() {
    var NOMBRES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
    var meses = [];
    var d = new Date();
    for (var i = 5; i >= 0; i--) {
      var t = new Date(d.getFullYear(), d.getMonth() - i, 1);
      meses.push({
        key:   t.getFullYear() + '-' + String(t.getMonth() + 1).padStart(2, '0'),
        label: NOMBRES[t.getMonth()] + ' \'' + String(t.getFullYear()).slice(-2),
      });
    }
    return meses;
  }

  function _agruparPorMes(historial, meses) {
    var resultado = {};
    meses.forEach(function(m) { resultado[m.key] = { v: 0, d: 0 }; });
    historial.forEach(function(p) {
      if (!p.fecha) return;
      var key = '';
      if (/^\d{4}-\d{2}-\d{2}/.test(p.fecha)) {
        key = p.fecha.slice(0, 7);                          // YYYY-MM-DD HH:MM
      } else if (/^\d{2}\/\d{2}\/\d{4}/.test(p.fecha)) {
        var parts = p.fecha.split('/');                      // DD/MM/YYYY
        key = parts[2] + '-' + parts[1];
      }
      if (resultado[key]) {
        if (p.resultado === 'victoria') resultado[key].v++;
        else resultado[key].d++;
      }
    });
    return resultado;
  }

  window.fcRefrescarStats = function() { renderizarGraficos(); };

  window.fcCapturarStats = function() {
    var canvases = document.querySelectorAll('#fc-stats-modal canvas');
    canvases.forEach(function(c, i) {
      try {
        var link = document.createElement('a');
        link.download = 'truco-stats-' + (i + 1) + '.png';
        link.href = c.toDataURL('image/png');
        link.click();
      } catch(e) {}
    });
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // INIT
  // ═══════════════════════════════════════════════════════════════════════════

  function init() {
    try { setupMundial(); }      catch(e) { console.warn('[fc] mundial:', e); }
    try { setupRecords(); }      catch(e) { console.warn('[fc] records:', e); }
    try { setupEstadisticas(); } catch(e) { console.warn('[fc] stats:', e); }

    if (typeof window.onJuego === 'function') {
      onJuego('finDePartido', function(data) {
        try { _procesarResultadoMundial(data); } catch(e) {}
      });
    }
  }

  window.addEventListener('load', function() { setTimeout(init, 1300); });

  window.abrirMundial       = abrirMundial;
  window.cerrarMundial      = cerrarMundial;
  window.abrirRecords       = abrirRecords;
  window.cerrarRecords      = cerrarRecords;
  window.abrirEstadisticas  = abrirEstadisticas;
  window.cerrarEstadisticas = cerrarEstadisticas;
  window.actualizarRecord   = actualizarRecord;

})();
