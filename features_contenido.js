// features_contenido.js
// Tabla de Récords | Estadísticas Avanzadas
// Depende de: juego.js (onJuego, finDePartido), features_progression.js (addPesos, tg_historial)

(function () {
  'use strict';

  // lsGet/lsPut viven en features_storage.js (compartidos).

  // ─── Historial de partidas (compartido con features_progression) ──────────
  function getHistorial() {
    try { return JSON.parse(lsGet('tg_historial', '[]')); } catch(e) { return []; }
  }

  // ─── Copa del Mundo de Naciones: ELIMINADA (2026-07-31) ──────────────────
  // Duplicaba al Mundial real de src/features/mundial.js (que tiene grupos,
  // fixture y persistencia en truco_mundial); esta versión perdía el torneo
  // con un F5. Si alguna vez se extraña algo de acá (narrativas por rival,
  // confetti), está en el historial de git.

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
    // Entrenamiento: con las cartas del rival a la vista, un récord no es
    // un récord (mismo criterio que PT, XP, Liga y misiones).
    if (typeof window !== 'undefined' && window.modoEntrenamiento) return false;
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

  // Suma +delta a un récord acumulativo (torneos ganados, desafíos hechos).
  // Existe porque `actualizarRecord` pide el valor final y los contadores
  // acumulativos no lo saben: viven en el propio récord.
  function sumarRecord(id, delta, contexto) {
    return actualizarRecord(id, _getRecordValor(id) + (delta || 1), contexto);
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
    _hookRecordTrucos();
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

  // El récord 'trucos_canta' estaba definido pero NO tenía un solo escritor
  // en todo el proyecto: quedaba clavado en 0 para siempre. Se envuelve el
  // canto del jugador (mismo patrón que extras.js con el envido).
  function _hookRecordTrucos() {
    if (typeof window.cantarTrucoJugador !== 'function') return;
    var _orig = window.cantarTrucoJugador;
    window.cantarTrucoJugador = function() {
      try {
        var n = (parseInt(lsGet('tg_trucos_cantados', '0'), 10) || 0) + 1;
        lsPut('tg_trucos_cantados', String(n));
        actualizarRecord('trucos_canta', n, '');
      } catch(e) {}
      return _orig.apply(this, arguments);
    };
  }

  function _hookRecordsFinDePartida() {
    if (typeof window.onJuego !== 'function') return;

    var _manosPartida = 0;

    onJuego('nuevoPartido', function() { _manosPartida = 0; });
    // 'manoRepartida' es el evento REAL del motor: 'nuevaMano' no existe, así
    // que _manosPartida quedaba en 0 y la guarda `> 0` de abajo hacía que el
    // récord 'partida_rapida' no se escribiera nunca.
    onJuego('manoRepartida', function() { _manosPartida++; });

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

      // Racha máxima. La unidad del récord es "victorias seguidas", así que
      // va tg_racha_part (PARTIDOS al hilo, extras.js): tg_racha es la racha
      // de MANOS dentro de un partido y se resetea en cada partido nuevo.
      var rachaActual = parseInt(lsGet('tg_racha_part', '0'), 10) || 0;
      if (ganamos) actualizarRecord('racha_max', rachaActual, 'Racha activa');

      // PT totales acumulados
      var ptTotal = parseInt(lsGet('tg_pesos', '0'), 10) || 0;
      actualizarRecord('pt_total', ptTotal, '');

      // PT en el día. Antes acumulaba data.puntosJugador (los PUNTOS DE
      // TRUCO del partido, ~30), o sea que "Más PT en un día" medía otra
      // cosa. Ahora se mide contra el saldo: PT ganadas hoy = saldo actual
      // menos el saldo con el que arrancó el día.
      var hoyStr = _formatFechaCorta(new Date());
      if (lsGet('tg_rec_ptdia_fecha', '') !== hoyStr) {
        lsPut('tg_rec_ptdia_fecha', hoyStr);
        lsPut('tg_rec_ptdia_base', String(ptTotal));
      }
      var baseDia = parseInt(lsGet('tg_rec_ptdia_base', String(ptTotal)), 10) || 0;
      var ptDia = Math.max(0, ptTotal - baseDia);
      if (ptDia > 0) actualizarRecord('pt_dia', ptDia, hoyStr);

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
    try { setupRecords(); }      catch(e) { console.warn('[fc] records:', e); }
    try { setupEstadisticas(); } catch(e) { console.warn('[fc] stats:', e); }
  }

  window.addEventListener('load', function() { setTimeout(init, 1300); });

  window.abrirRecords       = abrirRecords;
  window.cerrarRecords      = cerrarRecords;
  window.abrirEstadisticas  = abrirEstadisticas;
  window.cerrarEstadisticas = cerrarEstadisticas;
  window.actualizarRecord   = actualizarRecord;
  window.sumarRecord        = sumarRecord;

})();
