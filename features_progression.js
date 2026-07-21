// ══════════════════════════════════════════════════════════════
// features_progression.js  — Truco GOL
// Economía (PT), Fichajes, Historial completo, Estadio, Camiseta,
// Modo Nocturno
// ══════════════════════════════════════════════════════════════
(function () {
  'use strict';

  // ────────────────────────────────────────────────
  // CONSTANTES DE ECONOMÍA
  // ────────────────────────────────────────────────
  const ECONOMIA = {
    ganar_partido:       50,
    ganar_con_diferencia:25,
    ganar_envido:        10,
    ganar_truco:          8,
    racha_3:             30,
    racha_5:             75,
    desafio_diario:     100,
    primer_logro:        50,
  };

  // ────────────────────────────────────────────────
  // JUGADORES DEL MERCADO
  // ────────────────────────────────────────────────
  const JUGADORES_MERCADO = [
    { id:'messi',    nombre:'La Pulga',     emoji:'🐭', precio:200, descripcion:'El mejor de todos',        rareza:'legendario' },
    { id:'maradona', nombre:'El Diez',      emoji:'💎', precio:500, descripcion:'D10S del truco',           rareza:'icono'      },
    { id:'riquelme', nombre:'El Maestro',   emoji:'🎯', precio:150, descripcion:'Maneja los tiempos',       rareza:'oro'        },
    { id:'tevez',    nombre:'El Apache',    emoji:'💪', precio:120, descripcion:'Garra y corazón',          rareza:'oro'        },
    { id:'batistuta',nombre:'Batigol',      emoji:'⚡', precio:180, descripcion:'Potencia pura',            rareza:'oro'        },
    { id:'palermo',  nombre:'El Titán',     emoji:'🏆', precio:100, descripcion:'Goleador histórico',       rareza:'plata'      },
    { id:'crespo',   nombre:'El Pistolero', emoji:'🎯', precio: 80, descripcion:'Preciso y letal',          rareza:'plata'      },
    { id:'aimar',    nombre:'El Payaso',    emoji:'🎪', precio: 90, descripcion:'Regatea hasta el árbitro', rareza:'plata'      },
    { id:'zanetti',  nombre:'El Tractor',   emoji:'🚜', precio: 70, descripcion:'No para nunca',            rareza:'bronce'     },
    { id:'ortega',   nombre:'El Burrito',   emoji:'🫏', precio: 60, descripcion:'Rápido y técnico',         rareza:'bronce'     },
  ];

  const RAREZA_COLOR = {
    bronce:    '#cd7f32',
    plata:     '#c0c0c0',
    oro:       '#ffd700',
    legendario:'#9b59b6',
    icono:     '#f5c518',
  };

  // ────────────────────────────────────────────────
  // NIVELES DE ESTADIO
  // ────────────────────────────────────────────────
  const NIVELES_ESTADIO = [
    { nivel:1, nombre:'Potrero',        capacidad:'100 hinchas', descripcion:'Empezaste de cero.',           puntosReq:0,   emoji:'⚽' },
    { nivel:2, nombre:'Cancha de Club', capacidad:'1.000',       descripcion:'El barrio te conoce.',         puntosReq:5,   emoji:'🏠' },
    { nivel:3, nombre:'Estadio Chico',  capacidad:'10.000',      descripcion:'Ya tenés tribuna local.',      puntosReq:15,  emoji:'🏟️' },
    { nivel:4, nombre:'Estadio Grande', capacidad:'30.000',      descripcion:'El estadio retumba.',          puntosReq:30,  emoji:'🌟' },
    { nivel:5, nombre:'Monumental',     capacidad:'84.000',      descripcion:'El más grande del continente.',puntosReq:60,  emoji:'👑' },
    { nivel:6, nombre:'Wembley',        capacidad:'90.000',      descripcion:'Estadio del mundo.',           puntosReq:100, emoji:'🏆' },
  ];

  const MEJORAS_ESTADIO = [
    { nivel:2, nombre:'Vestuario',           emoji:'🚿' },
    { nivel:3, nombre:'Iluminación nocturna', emoji:'💡' },
    { nivel:4, nombre:'Césped premium',       emoji:'🌿' },
    { nivel:5, nombre:'Pantalla LED gigante', emoji:'📺' },
    { nivel:6, nombre:'Museo del club',       emoji:'🏛️' },
  ];

  // ────────────────────────────────────────────────
  // COLORES PRESET CAMISETA
  // ────────────────────────────────────────────────
  const COLORES_PRESET = [
    { nombre:'Azul y Oro',    c1:'#0d2f7a', c2:'#f5c518' },
    { nombre:'Rojo y Blanco', c1:'#b30000', c2:'#ffffff' },
    { nombre:'Verde',         c1:'#1a6b3c', c2:'#ffffff' },
    { nombre:'Celeste',       c1:'#2b5fa8', c2:'#ffffff' },
    { nombre:'Rojo y Negro',  c1:'#c00000', c2:'#111111' },
    { nombre:'Violeta',       c1:'#6a0dad', c2:'#ffffff' },
  ];

  // lsGet/lsPut viven en features_storage.js (compartidos).

  // ════════════════════════════════════════════════
  // FEATURE 1: ECONOMÍA — PESOS TRUCOSOS
  // ════════════════════════════════════════════════
  function getPesos() {
    return parseInt(lsGet('tg_pesos', '0'), 10) || 0;
  }

  function addPesos(cantidad, motivo) {
    const actual = getPesos();
    const nuevo  = actual + cantidad;
    lsPut('tg_pesos', nuevo);
    mostrarAnimMoneda(cantidad, motivo);
    _actualizarContadorPesos();
    // Empujar el delta al saldo server-side (si está disponible). El server es
    // la fuente de verdad; esto lo mantiene en sync. Degrada a solo-local si no
    // hay conexión/servidor.
    if (typeof window.saldoPushDelta === 'function') { try { window.saldoPushDelta(cantidad, motivo); } catch(e) {} }
    return nuevo;
  }

  // Fija el saldo local a un valor autoritativo (lo usa el sync con el server).
  // NO re-empuja al server ni muestra animación: solo espeja y refresca la UI.
  function setPesosLocal(n) {
    n = Math.max(0, Math.trunc(Number(n) || 0));
    lsPut('tg_pesos', n);
    _actualizarContadorPesos();
    return n;
  }

  function mostrarAnimMoneda(cantidad, motivo) {
    const el = document.createElement('div');
    el.className = 'fp-moneda-anim';
    el.textContent = '+' + cantidad + ' PT ⭐';
    if (motivo) el.title = motivo;
    const mesa = document.getElementById('game-table');
    const parent = (mesa && getComputedStyle(mesa).display !== 'none') ? mesa : document.body;
    parent.appendChild(el);
    el.style.left = (25 + Math.random() * 50) + '%';
    el.style.top  = '50%';
    void el.offsetHeight;
    el.classList.add('fp-moneda-anim--activo');
    setTimeout(() => { if (el.parentNode) el.parentNode.removeChild(el); }, 1800);
  }

  function _actualizarContadorPesos() {
    const pts = getPesos();
    document.querySelectorAll('.fp-pesos-display').forEach(function(el) {
      el.textContent = '💰 ' + fmtPT(pts);
    });
  }

  function setupEconomia() {
    // Badge arriba del footer en el menú
    const mmFooter = document.querySelector('.mm-footer');
    if (mmFooter) {
      const badge = document.createElement('div');
      badge.className = 'fp-pesos-badge fp-pesos-display';
      badge.textContent = '💰 ' + fmtPT(getPesos());
      mmFooter.parentNode.insertBefore(badge, mmFooter);
    }

    // Corner en la mesa
    const gameTable = document.getElementById('game-table');
    if (gameTable) {
      const corner = document.createElement('div');
      corner.className = 'fp-pesos-corner fp-pesos-display';
      corner.textContent = '💰 ' + fmtPT(getPesos());
      gameTable.appendChild(corner);
    }

    // PT por partido ganado
    onJuego('finDePartido', function(data) {
      if (!data) return;
      const limite  = data.limite || 30;
      const ganamos = data.puntosJugador >= limite;
      if (!ganamos) return;
      addPesos(ECONOMIA.ganar_partido, 'Victoria');
      const diff = data.puntosJugador - data.puntosRival;
      if (diff >= 10) addPesos(ECONOMIA.ganar_con_diferencia, 'Goleada');
      const racha = parseInt(lsGet('tg_racha', '0'), 10) || 0;
      if (racha >= 5) addPesos(ECONOMIA.racha_5, 'Racha x5');
      else if (racha >= 3) addPesos(ECONOMIA.racha_3, 'Racha x3');
    });

    // PT por envido ganado
    var _origEnvido = window.mostrarOverlayEnvido;
    window.mostrarOverlayEnvido = function(ptsJ, ptsR, ganoJugador, apuesta, cartasJ, cartasR, titulo) {
      if (ganoJugador) addPesos(ECONOMIA.ganar_envido, 'Envido ganado');
      if (typeof _origEnvido === 'function') _origEnvido.apply(this, arguments);
    };

    _actualizarContadorPesos();
  }

  // ════════════════════════════════════════════════
  // FEATURE 2: MERCADO DE FICHAJES
  // ════════════════════════════════════════════════
  function getFichajesComprados() {
    try { return JSON.parse(lsGet('tg_fichajes', '[]')); } catch(e) { return []; }
  }
  function getFichajeEquipado() {
    return lsGet('tg_fichaje_equipado', '');
  }

  function setupFichajes() {
    _crearModalFichajes();
    var mmFooter = document.querySelector('.mm-footer');
    if (mmFooter) {
      var btn = document.createElement('button');
      btn.className = 'mm-link';
      btn.textContent = '⚽ FICHAJES';
      btn.onclick = function() { window.abrirFichajes(); };
      mmFooter.appendChild(btn);
    }
  }

  function _crearModalFichajes() {
    if (document.getElementById('ext-fichajes-modal')) return;
    var modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'ext-fichajes-modal';
    modal.innerHTML =
      '<div class="modal-box fp-modal-box">' +
        '<button class="fp-modal-close" onclick="window.cerrarFichajes()">✕</button>' +
        '<h2>⚽ Mercado de Fichajes</h2>' +
        '<div class="fp-saldo-header">Tu saldo: <span id="fp-saldo-fichajes">0 PT</span></div>' +
        '<div class="fp-fichajes-filtros">' +
          '<button class="fp-filtro-btn fp-filtro-activo" onclick="window._fichajesFiltro(\'todos\', this)">Todos</button>' +
          '<button class="fp-filtro-btn" onclick="window._fichajesFiltro(\'disponibles\', this)">Disponibles</button>' +
          '<button class="fp-filtro-btn" onclick="window._fichajesFiltro(\'mios\', this)">Mis Fichajes</button>' +
        '</div>' +
        '<div class="fp-fichajes-grid" id="fp-fichajes-grid"></div>' +
      '</div>';
    document.body.appendChild(modal);
    window._fichajesFiltroActual = 'todos';
  }

  function _renderFichajes(filtro) {
    filtro = filtro || window._fichajesFiltroActual || 'todos';
    var grid = document.getElementById('fp-fichajes-grid');
    if (!grid) return;
    var comprados = getFichajesComprados();
    var equipado  = getFichajeEquipado();
    var lista     = JUGADORES_MERCADO.slice();
    if (filtro === 'disponibles') lista = lista.filter(function(j) { return comprados.indexOf(j.id) === -1; });
    if (filtro === 'mios')        lista = lista.filter(function(j) { return comprados.indexOf(j.id) !== -1; });

    grid.innerHTML = lista.map(function(j) {
      var comprado  = comprados.indexOf(j.id) !== -1;
      var esEquip   = j.id === equipado;
      var color     = RAREZA_COLOR[j.rareza] || '#aaa';
      var btnHTML   = comprado
        ? (esEquip
            ? '<button class="fp-btn-equipado" disabled>✓ Equipado</button>'
            : '<button class="fp-btn-equipar" onclick="window._equiparFichaje(\'' + j.id + '\')">Equipar</button>')
        : '<button class="fp-btn-comprar" onclick="window._comprarFichaje(\'' + j.id + '\')">Comprar</button>';
      return '<div class="fp-fichaje-card" style="--rareza-color:' + color + '">' +
        '<div class="fp-fichaje-rareza" style="background:' + color + '">' + j.rareza.toUpperCase() + '</div>' +
        '<div class="fp-fichaje-emoji">' + j.emoji + '</div>' +
        '<div class="fp-fichaje-nombre">' + j.nombre + '</div>' +
        '<div class="fp-fichaje-desc">' + j.descripcion + '</div>' +
        '<div class="fp-fichaje-precio">' + j.precio + ' PT</div>' +
        btnHTML +
        '</div>';
    }).join('');

    var saldoEl = document.getElementById('fp-saldo-fichajes');
    if (saldoEl) saldoEl.textContent = fmtPT(getPesos());
  }

  window._fichajesFiltro = function(filtro, btn) {
    window._fichajesFiltroActual = filtro;
    document.querySelectorAll('.fp-filtro-btn').forEach(function(b) { b.classList.remove('fp-filtro-activo'); });
    if (btn) btn.classList.add('fp-filtro-activo');
    _renderFichajes(filtro);
  };

  // Compra genérica de un fichaje (mercado base o "extra" de features_historia):
  // descuenta PT y agrega el id a tg_fichajes. Única fuente de verdad para la
  // billetera — antes historia.js reimplementaba este mismo camino a mano con
  // localStorage crudo, y las dos rutas podían divergir. Devuelve false si no
  // alcanza el saldo (no descuenta nada en ese caso).
  function comprarFichajeGenerico(jugador) {
    var saldo = getPesos();
    if (saldo < jugador.precio) return false;
    lsPut('tg_pesos', saldo - jugador.precio);
    if (typeof window.saldoPushDelta === 'function') { try { window.saldoPushDelta(-jugador.precio, 'fichaje: ' + jugador.nombre); } catch(e) {} }
    var comprados = getFichajesComprados();
    comprados.push(jugador.id);
    lsPut('tg_fichajes', JSON.stringify(comprados));
    return true;
  }
  window._comprarFichajeGenerico = comprarFichajeGenerico;
  window.getFichajesComprados    = getFichajesComprados;
  window.getFichajeEquipado      = getFichajeEquipado;

  window._comprarFichaje = function(id) {
    var jugador = null;
    for (var i = 0; i < JUGADORES_MERCADO.length; i++) { if (JUGADORES_MERCADO[i].id === id) { jugador = JUGADORES_MERCADO[i]; break; } }
    if (!jugador) return;
    if (!comprarFichajeGenerico(jugador)) { _showToastFP('❌ PT insuficientes para fichar a ' + jugador.nombre); return; }
    _mostrarCelebracionFichaje(jugador);
    _actualizarContadorPesos();
    _renderFichajes(window._fichajesFiltroActual);
  };

  window._equiparFichaje = function(id) {
    var jugador = null;
    for (var i = 0; i < JUGADORES_MERCADO.length; i++) { if (JUGADORES_MERCADO[i].id === id) { jugador = JUGADORES_MERCADO[i]; break; } }
    if (!jugador) return;
    lsPut('tg_fichaje_equipado', id);
    try {
      if (typeof S !== 'undefined') S.avatarJugador = jugador.emoji;
    } catch(e) {}
    _showToastFP('✅ ' + jugador.nombre + ' equipado como avatar');
    _renderFichajes(window._fichajesFiltroActual);
  };

  function _mostrarCelebracionFichaje(jugador) {
    var cel = document.createElement('div');
    cel.className = 'fp-celebracion-fichaje';
    var color = RAREZA_COLOR[jugador.rareza] || '#aaa';
    cel.innerHTML = '<div class="fp-cel-emoji">' + jugador.emoji + '</div>' +
      '<div class="fp-cel-titulo">¡FICHAJE CONFIRMADO!</div>' +
      '<div class="fp-cel-nombre">' + jugador.nombre + '</div>' +
      '<div class="fp-cel-rareza" style="color:' + color + '">' + jugador.rareza.toUpperCase() + '</div>';
    document.body.appendChild(cel);
    void cel.offsetHeight;
    cel.classList.add('fp-cel--activo');
    setTimeout(function() { if (cel.parentNode) cel.parentNode.removeChild(cel); }, 2500);
  }

  window.abrirFichajes = function() {
    window._fichajesFiltroActual = 'todos';
    _renderFichajes('todos');
    var modal = document.getElementById('ext-fichajes-modal');
    if (modal) modal.style.display = 'flex';
  };
  window.cerrarFichajes = function() {
    var modal = document.getElementById('ext-fichajes-modal');
    if (modal) modal.style.display = 'none';
  };

  // ════════════════════════════════════════════════
  // FEATURE 3: HISTORIAL COMPLETO DE PARTIDAS
  // ════════════════════════════════════════════════
  var HISTORIAL_MAX = 50;

  function getHistorial() {
    try { return JSON.parse(lsGet('tg_historial', '[]')); } catch(e) { return []; }
  }

  function agregarEntradaHistorial(entry) {
    var hist = getHistorial();
    hist.unshift(entry);
    if (hist.length > HISTORIAL_MAX) hist.length = HISTORIAL_MAX;
    lsPut('tg_historial', JSON.stringify(hist));
  }

  function _formatFecha(d) {
    function pad(n) { return String(n).padStart(2,'0'); }
    return d.getFullYear() + '-' + pad(d.getMonth()+1) + '-' + pad(d.getDate()) +
      ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes());
  }

  function setupHistorialPartidas() {
    _crearModalHistorial();

    var mmFooter = document.querySelector('.mm-footer');
    if (mmFooter) {
      var btn = document.createElement('button');
      btn.className = 'mm-link';
      btn.textContent = '📋 HISTORIAL';
      btn.onclick = function() { window.abrirHistorial(); };
      mmFooter.appendChild(btn);
    }

    var _manosEnPartida = 0;
    onJuego('nuevoPartido', function() { _manosEnPartida = 0; });

    var _origResultado = window.mostrarOverlayResultadoMano;
    window.mostrarOverlayResultadoMano = function(resultado, pts) {
      _manosEnPartida++;
      if (typeof _origResultado === 'function') _origResultado.apply(this, arguments);
    };

    onJuego('finDePartido', function(data) {
      if (!data) return;
      var limite  = data.limite || 30;
      var ganamos = data.puntosJugador >= limite;
      var equipoJ = 'Vos', equipoR = 'Rival';
      try {
        if (typeof S !== 'undefined' && typeof AVATARS !== 'undefined') {
          equipoR = (AVATARS[S.idRival] || {}).name || 'Rival';
          equipoJ = S.nombreJugador || 'Vos';
        }
      } catch(e) {}
      agregarEntradaHistorial({
        fecha:     _formatFecha(new Date()),
        resultado: ganamos ? 'victoria' : 'derrota',
        puntosJ:   data.puntosJugador,
        puntosR:   data.puntosRival,
        equipoJ:   equipoJ,
        equipoR:   equipoR,
        duracion:  _manosEnPartida + ' manos',
        modo:      'normal',
      });
      _manosEnPartida = 0;
    });
  }

  function _crearModalHistorial() {
    if (document.getElementById('ext-historial-modal')) return;
    var modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'ext-historial-modal';
    modal.innerHTML =
      '<div class="modal-box fp-modal-box">' +
        '<button class="fp-modal-close" onclick="window.cerrarHistorial()">✕</button>' +
        '<h2>📋 Historial de Partidas</h2>' +
        '<div class="fp-hist-stats" id="fp-hist-stats"></div>' +
        '<div class="fp-fichajes-filtros">' +
          '<button class="fp-filtro-btn fp-filtro-activo" onclick="window._histFiltro(\'todas\', this)">Todas</button>' +
          '<button class="fp-filtro-btn" onclick="window._histFiltro(\'victorias\', this)">Victorias</button>' +
          '<button class="fp-filtro-btn" onclick="window._histFiltro(\'derrotas\', this)">Derrotas</button>' +
        '</div>' +
        '<div class="fp-hist-lista" id="fp-hist-lista"></div>' +
      '</div>';
    document.body.appendChild(modal);
  }

  function _renderHistorial(filtro) {
    filtro = filtro || 'todas';
    var total    = getHistorial();
    var victs    = total.filter(function(h) { return h.resultado === 'victoria'; }).length;
    var derrotas = total.length - victs;
    var efect    = total.length ? Math.round(victs / total.length * 100) : 0;

    var statsEl = document.getElementById('fp-hist-stats');
    if (statsEl) {
      statsEl.innerHTML =
        '<div class="fp-hist-stat"><span class="fp-stat-num">' + total.length + '</span><span class="fp-stat-lbl">Total</span></div>' +
        '<div class="fp-hist-stat fp-stat-verde"><span class="fp-stat-num">' + victs + '</span><span class="fp-stat-lbl">Victorias</span></div>' +
        '<div class="fp-hist-stat fp-stat-rojo"><span class="fp-stat-num">' + derrotas + '</span><span class="fp-stat-lbl">Derrotas</span></div>' +
        '<div class="fp-hist-stat"><span class="fp-stat-num">' + efect + '%</span><span class="fp-stat-lbl">Efect.</span></div>';
    }

    var hist = total.slice();
    if (filtro === 'victorias') hist = hist.filter(function(h) { return h.resultado === 'victoria'; });
    if (filtro === 'derrotas')  hist = hist.filter(function(h) { return h.resultado === 'derrota'; });

    var listaEl = document.getElementById('fp-hist-lista');
    if (!listaEl) return;
    if (hist.length === 0) {
      listaEl.innerHTML = '<div class="fp-hist-vacio">No hay partidas registradas todavía.</div>';
      return;
    }
    listaEl.innerHTML = hist.map(function(h) {
      var esVict = h.resultado === 'victoria';
      var clase  = esVict ? 'fp-hist-victoria' : 'fp-hist-derrota';
      var ico    = esVict ? '🏆' : '💀';
      return '<div class="fp-hist-row ' + clase + '">' +
        '<div class="fp-hist-ico">' + ico + '</div>' +
        '<div class="fp-hist-info">' +
          '<div class="fp-hist-vs">' + esc(h.equipoJ) + ' vs ' + esc(h.equipoR) + '</div>' +
          '<div class="fp-hist-fecha">' + h.fecha + ' · ' + h.duracion + '</div>' +
        '</div>' +
        '<div class="fp-hist-score">' + h.puntosJ + '-' + h.puntosR + '</div>' +
      '</div>';
    }).join('');
  }

  window._histFiltro = function(filtro, btn) {
    document.querySelectorAll('#ext-historial-modal .fp-filtro-btn')
      .forEach(function(b) { b.classList.remove('fp-filtro-activo'); });
    if (btn) btn.classList.add('fp-filtro-activo');
    _renderHistorial(filtro);
  };

  window.abrirHistorial = function() {
    _renderHistorial('todas');
    var modal = document.getElementById('ext-historial-modal');
    if (modal) modal.style.display = 'flex';
  };
  window.cerrarHistorial = function() {
    var modal = document.getElementById('ext-historial-modal');
    if (modal) modal.style.display = 'none';
  };

  // ════════════════════════════════════════════════
  // FEATURE 4: ESTADIO PROPIO CON PROGRESIÓN
  // ════════════════════════════════════════════════
  function getVictorias() {
    return parseInt(lsGet('tg_partidas_g', '0'), 10) || 0;
  }

  function getNivelEstadio(victorias) {
    var nivel = NIVELES_ESTADIO[0];
    for (var i = 0; i < NIVELES_ESTADIO.length; i++) {
      if (victorias >= NIVELES_ESTADIO[i].puntosReq) nivel = NIVELES_ESTADIO[i];
    }
    return nivel;
  }

  function getSiguienteNivel(nivelActual) {
    for (var i = 0; i < NIVELES_ESTADIO.length; i++) {
      if (NIVELES_ESTADIO[i].nivel === nivelActual.nivel + 1) return NIVELES_ESTADIO[i];
    }
    return null;
  }

  function setupEstadio() {
    _crearModalEstadio();
    var mmFooter = document.querySelector('.mm-footer');
    if (mmFooter) {
      var btn = document.createElement('button');
      btn.className = 'mm-link';
      btn.textContent = '🏟️ ESTADIO';
      btn.onclick = function() { window.abrirEstadio(); };
      mmFooter.appendChild(btn);
    }

    var _victoriasPrevias = getVictorias();
    onJuego('finDePartido', function(data) {
      if (!data) return;
      var ganamos = data.puntosJugador >= (data.limite || 30);
      if (!ganamos) return;
      var victoriasNuevas = getVictorias();
      var nivelAntes = getNivelEstadio(_victoriasPrevias);
      var nivelAhora = getNivelEstadio(victoriasNuevas);
      if (nivelAhora.nivel > nivelAntes.nivel) _mostrarSubidaNivel(nivelAhora);
      _victoriasPrevias = victoriasNuevas;
    });
  }

  function _crearModalEstadio() {
    if (document.getElementById('ext-estadio-modal')) return;
    var modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'ext-estadio-modal';
    modal.innerHTML =
      '<div class="modal-box fp-modal-box fp-estadio-box">' +
        '<button class="fp-modal-close" onclick="window.cerrarEstadio()">✕</button>' +
        '<h2>🏟️ Mi Estadio</h2>' +
        '<div id="fp-estadio-contenido"></div>' +
      '</div>';
    document.body.appendChild(modal);
  }

  function _renderEstadio() {
    var cont = document.getElementById('fp-estadio-contenido');
    if (!cont) return;
    var victorias = getVictorias();
    var nivel     = getNivelEstadio(victorias);
    var siguiente = getSiguienteNivel(nivel);
    var pctProg   = siguiente
      ? Math.min(100, Math.round((victorias - nivel.puntosReq) / (siguiente.puntosReq - nivel.puntosReq) * 100))
      : 100;
    var victSig   = siguiente ? (siguiente.puntosReq - victorias) : 0;

    var mejorasHTML = MEJORAS_ESTADIO.map(function(m) {
      var ok = nivel.nivel >= m.nivel;
      return '<div class="fp-mejora-row ' + (ok ? 'fp-mejora-ok' : 'fp-mejora-lock') + '">' +
        '<span>' + m.emoji + '</span><span>' + m.nombre + '</span>' +
        '<span>' + (ok ? '✅' : '🔒 Nivel ' + m.nivel) + '</span>' +
      '</div>';
    }).join('');

    var progHTML = siguiente
      ? '<div class="fp-prog-label">Próximo: ' + siguiente.emoji + ' ' + siguiente.nombre + '</div>' +
        '<div class="fp-prog-bar-bg"><div class="fp-prog-bar-fill" style="width:' + pctProg + '%"></div></div>' +
        '<div class="fp-prog-sub">' + victSig + ' victorias más para subir de nivel</div>'
      : '<div class="fp-prog-label">🏆 ¡Nivel máximo alcanzado!</div>';

    cont.innerHTML =
      '<div class="fp-estadio-emoji">' + nivel.emoji + '</div>' +
      '<div class="fp-estadio-nombre">' + nivel.nombre + '</div>' +
      '<div class="fp-estadio-cap">Capacidad: ' + nivel.capacidad + '</div>' +
      '<div class="fp-estadio-desc">' + nivel.descripcion + '</div>' +
      '<div class="fp-estadio-victorias">' + victorias + ' victorias totales</div>' +
      progHTML +
      '<h3 style="margin-top:16px;font-size:12px;text-transform:uppercase;opacity:.7">Mejoras del estadio</h3>' +
      '<div class="fp-mejoras-lista">' + mejorasHTML + '</div>';
  }

  function _mostrarSubidaNivel(nivel) {
    var el = document.createElement('div');
    el.className = 'fp-subida-nivel';
    el.innerHTML =
      '<div class="fp-sn-emoji">' + nivel.emoji + '</div>' +
      '<div class="fp-sn-titulo">¡ESTADIO MEJORADO!</div>' +
      '<div class="fp-sn-nombre">' + nivel.nombre + '</div>' +
      '<div class="fp-sn-desc">' + nivel.descripcion + '</div>';
    document.body.appendChild(el);
    void el.offsetHeight;
    el.classList.add('fp-sn--activo');
    setTimeout(function() { if (el.parentNode) el.parentNode.removeChild(el); }, 3000);
  }

  window.abrirEstadio = function() {
    _renderEstadio();
    var modal = document.getElementById('ext-estadio-modal');
    if (modal) modal.style.display = 'flex';
  };
  window.cerrarEstadio = function() {
    var modal = document.getElementById('ext-estadio-modal');
    if (modal) modal.style.display = 'none';
  };

  // ════════════════════════════════════════════════
  // FEATURE 5: CAMISETA PERSONALIZABLE
  // ════════════════════════════════════════════════
  function getCamiseta() {
    return {
      c1: lsGet('tg_camiseta_1', '#0d2f7a'),
      c2: lsGet('tg_camiseta_2', '#f5c518'),
    };
  }

  function _oscurecer(hex, factor) {
    try {
      var r = parseInt(hex.slice(1,3),16), g = parseInt(hex.slice(3,5),16), b = parseInt(hex.slice(5,7),16);
      return 'rgb(' + Math.round(r*factor) + ',' + Math.round(g*factor) + ',' + Math.round(b*factor) + ')';
    } catch(e) { return hex; }
  }
  function _aclarar(hex, factor) {
    try {
      var r = Math.min(255,Math.round(parseInt(hex.slice(1,3),16)*factor));
      var g = Math.min(255,Math.round(parseInt(hex.slice(3,5),16)*factor));
      var b = Math.min(255,Math.round(parseInt(hex.slice(5,7),16)*factor));
      return 'rgb(' + r + ',' + g + ',' + b + ')';
    } catch(e) { return hex; }
  }

  function aplicarCamiseta(c1, c2) {
    lsPut('tg_camiseta_1', c1);
    lsPut('tg_camiseta_2', c2);
    document.documentElement.style.setProperty('--felt',   c1);
    document.documentElement.style.setProperty('--felt-d', _oscurecer(c1, 0.7));
    document.documentElement.style.setProperty('--felt-l', _aclarar(c1, 1.3));
    _actualizarPreviewCamiseta(c1, c2);
  }

  function _svgCamiseta(c1, c2) {
    return '<svg viewBox="0 0 100 90" xmlns="http://www.w3.org/2000/svg" width="80" height="72">' +
      '<path d="M30 5 L10 25 L20 30 L20 80 L80 80 L80 30 L90 25 L70 5 Q60 15 50 15 Q40 15 30 5Z" fill="' + c1 + '" stroke="' + c2 + '" stroke-width="2"/>' +
      '<path d="M30 5 Q40 15 50 15 Q60 15 70 5 L65 20 L35 20 Z" fill="' + c2 + '" opacity=".8"/>' +
      '<path d="M10 25 L30 5 L35 20 L20 30Z" fill="' + c2 + '" opacity=".5"/>' +
      '<path d="M90 25 L70 5 L65 20 L80 30Z" fill="' + c2 + '" opacity=".5"/>' +
    '</svg>';
  }

  function _actualizarPreviewCamiseta(c1, c2) {
    var prev = document.getElementById('fp-camiseta-preview');
    if (prev) prev.innerHTML = _svgCamiseta(c1, c2);
  }

  function setupCamiseta() {
    var cam = getCamiseta();
    aplicarCamiseta(cam.c1, cam.c2);

    var settingsBox = document.querySelector('#settings-modal .modal-box');
    if (!settingsBox) return;

    var presetsHTML = COLORES_PRESET.map(function(p, i) {
      return '<button class="fp-preset-btn" title="' + p.nombre + '" ' +
        'style="background:linear-gradient(135deg,' + p.c1 + ' 50%,' + p.c2 + ' 50%)" ' +
        'onclick="window._aplicarPreset(' + i + ')"></button>';
    }).join('');

    var section = document.createElement('div');
    section.className = 'fp-camiseta-section';
    section.innerHTML =
      '<div class="fp-camiseta-titulo">🎽 Tu Camiseta</div>' +
      '<div class="fp-camiseta-inner">' +
        '<div id="fp-camiseta-preview" class="fp-camiseta-preview">' + _svgCamiseta(cam.c1, cam.c2) + '</div>' +
        '<div class="fp-camiseta-controles">' +
          '<div class="fp-presets-grid">' + presetsHTML + '</div>' +
          '<div class="fp-color-custom">' +
            '<label>Principal <input type="color" id="fp-col1" value="' + cam.c1 + '" oninput="window._customCamiseta()"></label>' +
            '<label>Secundario <input type="color" id="fp-col2" value="' + cam.c2 + '" oninput="window._customCamiseta()"></label>' +
          '</div>' +
        '</div>' +
      '</div>';

    var btnGuardar = settingsBox.querySelector('.btn.primary');
    if (btnGuardar) settingsBox.insertBefore(section, btnGuardar);
    else settingsBox.appendChild(section);
  }

  window._aplicarPreset = function(idx) {
    var p = COLORES_PRESET[idx];
    if (!p) return;
    var col1 = document.getElementById('fp-col1');
    var col2 = document.getElementById('fp-col2');
    if (col1) col1.value = p.c1;
    if (col2) col2.value = p.c2;
    aplicarCamiseta(p.c1, p.c2);
  };

  window._customCamiseta = function() {
    var c1 = document.getElementById('fp-col1');
    var c2 = document.getElementById('fp-col2');
    if (c1 && c2) aplicarCamiseta(c1.value, c2.value);
  };

  // ════════════════════════════════════════════════
  // FEATURE 6: MODO NOCTURNO EXPLÍCITO
  // ════════════════════════════════════════════════
  function _activarNocturno(activo) {
    document.body.classList.toggle('fp-modo-nocturno', activo);
    // Asegurar que el overlay exista
    var ovl = document.getElementById('pano-noche-ovl');
    if (activo && !ovl) {
      ovl = document.createElement('div');
      ovl.id = 'pano-noche-ovl';
      document.body.appendChild(ovl);
    }
    // Badge en título
    var titulo = document.querySelector('.mm-title') ||
                 document.querySelector('#main-menu h1') ||
                 document.querySelector('.mm h1');
    if (titulo) {
      titulo.textContent = titulo.textContent.replace(' 🌙', '');
      if (activo) titulo.textContent += ' 🌙';
    }
    // Actualizar toggle visual
    var toggle = document.getElementById('opt-nocturno');
    if (toggle) toggle.classList.toggle('on', activo);
  }

  function setupModoNocturno() {
    var activo = lsGet('tg_nocturno', '0') === '1';
    if (activo) _activarNocturno(true);

    var settingsBox = document.querySelector('#settings-modal .modal-box');
    if (!settingsBox) return;

    var row = document.createElement('div');
    row.className = 'setting-row';
    row.innerHTML =
      '<div>' +
        '<div class="setting-lbl">🌙 Modo Nocturno</div>' +
        '<div class="setting-sub">Oscurece menú y mesa permanentemente</div>' +
      '</div>' +
      '<div class="toggle ' + (activo ? 'on' : '') + '" id="opt-nocturno" onclick="window._toggleNocturno()"></div>';

    var primeraRow = settingsBox.querySelector('.setting-row');
    if (primeraRow) settingsBox.insertBefore(row, primeraRow);
    else settingsBox.appendChild(row);
  }

  window._toggleNocturno = function() {
    var activo = lsGet('tg_nocturno', '0') === '1';
    var nuevo  = !activo;
    lsPut('tg_nocturno', nuevo ? '1' : '0');
    _activarNocturno(nuevo);
  };

  // ════════════════════════════════════════════════
  // UTILIDAD TOAST
  // ════════════════════════════════════════════════
  function _showToastFP(msg) {
    if (typeof showToast === 'function') { showToast(msg); return; }
    var el = document.createElement('div');
    el.className = 'fp-toast';
    el.textContent = msg;
    document.body.appendChild(el);
    void el.offsetHeight;
    el.classList.add('fp-toast--show');
    setTimeout(function() { if (el.parentNode) el.parentNode.removeChild(el); }, 2500);
  }

  // ════════════════════════════════════════════════
  // EXPONER GLOBALES ADICIONALES
  // ════════════════════════════════════════════════
  window.addPesos      = addPesos;
  window.getPesos      = getPesos;
  window.setPesosLocal = setPesosLocal;

  // ════════════════════════════════════════════════
  // INIT
  // ════════════════════════════════════════════════
  function init() {
    try { setupEconomia();          } catch(e) { console.warn('[FP] economia:', e); }
    try { setupFichajes();          } catch(e) { console.warn('[FP] fichajes:', e); }
    try { setupHistorialPartidas(); } catch(e) { console.warn('[FP] historial:', e); }
    try { setupEstadio();           } catch(e) { console.warn('[FP] estadio:', e); }
    try { setupCamiseta();          } catch(e) { console.warn('[FP] camiseta:', e); }
    try { setupModoNocturno();      } catch(e) { console.warn('[FP] nocturno:', e); }
  }

  window.addEventListener('load', function() { setTimeout(init, 500); });

})();
