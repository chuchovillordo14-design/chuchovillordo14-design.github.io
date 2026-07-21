/* ══════════════════════════════════════════════════════════════
   features_visual.js  —  Truco GOL
   Feature 1: Animación de reparto de cartas
   Feature 2: Skin de cartas con futbolistas
   Feature 3: Efectos de Golazo al ganar partida
   Feature 4: Sistema de Sponsors
   ══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  /* ────────────────────────────────────────────────────────────
     JERARQUÍA TRUCO: campo "f" de cartas.js
     f=14: 1e (ancho espada)  — Messi
     f=13: 1b (ancho basto)   — Maradona
     f=12: 7e (7 espada)      — Riquelme
     f=11: 7o (7 oro)         — Tevez
     f=10: 3 cualquier palo   — Palermo
     f=9:  2 cualquier palo   — Aimar
     f=8:  1 copa / 1 oro     — Batistuta
     f=7:  12 (rey)           — Zanetti
     f=6:  11 (caballo)       — Kempes
     f=5:  10 (sota)          — Passarella
     f=4:  7b / 7c (7 malos)  — Redondo
     f=3:  6 cualquier palo   — Verón
     f=2:  5 cualquier palo   — Ortega
     f=1:  4 cualquier palo   — Rojo (la más débil)
   ────────────────────────────────────────────────────────────── */
  var SKIN_FUTBOLISTAS = {
    14: { emoji: '⭐', nombre: 'Messi',      color: '#f5c518' },
    13: { emoji: '🐉', nombre: 'Maradona',   color: '#87CEEB' },
    12: { emoji: '🔥', nombre: 'Riquelme',   color: '#ff6b35' },
    11: { emoji: '⚡', nombre: 'Tevez',      color: '#ffd700' },
    10: { emoji: '🎯', nombre: 'Palermo',    color: '#ff4444' },
    9:  { emoji: '💎', nombre: 'Aimar',      color: '#00bcd4' },
    8:  { emoji: '🌟', nombre: 'Batistuta',  color: '#9c27b0' },
    7:  { emoji: '🏆', nombre: 'Zanetti',    color: '#4caf50' },
    6:  { emoji: '👑', nombre: 'Kempes',     color: '#ff9800' },
    5:  { emoji: '🎖️', nombre: 'Passarella', color: '#795548' },
    4:  { emoji: '🦁', nombre: 'Redondo',    color: '#607d8b' },
    3:  { emoji: '🎸', nombre: 'Verón',      color: '#e91e63' },
    2:  { emoji: '💫', nombre: 'Ortega',     color: '#673ab7' },
    1:  { emoji: '🃏', nombre: 'Rojo',       color: '#546e7a' },
  };

  /* ────────────────────────────────────────────────────────────
     SPONSORS
   ────────────────────────────────────────────────────────────── */
  var SPONSORS = [
    {
      id: 'adidas_gol',
      nombre: 'AdiGOL',
      logo: '⚫⚪',
      color: '#000000',
      descripcion: 'Equipamiento oficial del campeón',
      bonus: { tipo: 'victoria', pt: 15, desc: '+15 PT por victoria' },
      duracion_dias: 7,
      costo: 0,
    },
    {
      id: 'energia_max',
      nombre: 'EnergíaMAX',
      logo: '⚡🟡',
      color: '#ffcc00',
      descripcion: 'La energía que te hace ganar',
      bonus: { tipo: 'racha', pt: 25, desc: '+25 PT extra con racha de 3' },
      duracion_dias: 7,
      costo: 200,
    },
    {
      id: 'futbol_banco',
      nombre: 'FútbolBanco',
      logo: '🏦💚',
      color: '#00aa44',
      descripcion: 'Tu banco del deporte',
      bonus: { tipo: 'diario', pt: 30, desc: '+30 PT por jugar cada día' },
      duracion_dias: 14,
      costo: 350,
    },
    {
      id: 'tv_deportes',
      nombre: 'TV Deportes',
      logo: '📺🔴',
      color: '#cc0000',
      descripcion: 'Te transmitimos al mundo',
      bonus: { tipo: 'torneo', pt: 100, desc: '+100 PT por ganar torneos' },
      duracion_dias: 7,
      costo: 500,
    },
    {
      id: 'cerveza_gol',
      nombre: 'Cerveza GOL',
      logo: '🍺⭐',
      color: '#f5a623',
      descripcion: 'El sponsor clásico del potrero',
      bonus: { tipo: 'envido', pt: 20, desc: '+20 PT por ganar envidos' },
      duracion_dias: 7,
      costo: 300,
    },
    {
      id: 'mate_campeon',
      nombre: 'Mate Campeón',
      logo: '🧉🏆',
      color: '#5d8a3c',
      descripcion: 'La infusión de los ganadores',
      bonus: { tipo: 'desafio', pt: 50, desc: '+50 PT en el desafío diario' },
      duracion_dias: 14,
      costo: 450,
    },
  ];

  /* lsGet/lsPut/lsGetJSON/lsPutJSON viven en features_storage.js (compartidos). */

  /* ─── getPesos / addPesos: reusa la función global si existe ─── */
  function _addPesos(cantidad, motivo) {
    if (typeof window.addPesos === 'function') {
      window.addPesos(cantidad, motivo);
    } else {
      var actual = parseInt(lsGet('tg_pesos', '0'), 10) || 0;
      lsPut('tg_pesos', actual + cantidad);
    }
  }
  function _getPesos() {
    if (typeof window.getPesos === 'function') return window.getPesos();
    return parseInt(lsGet('tg_pesos', '0'), 10) || 0;
  }

  /* ══════════════════════════════════════════════════════════════
     FEATURE 1: ANIMACIÓN DE REPARTO DE CARTAS
     ══════════════════════════════════════════════════════════════ */
  function setupRepartoCartas() {
    // El motor llama a animarReparto() directamente si existe (juego.js lo comprueba)
    // Exponemos la función globalmente.
    window.animarReparto = function animarReparto() {
      var hand = document.getElementById('player-hand');
      if (!hand) return;
      // Pequeño delay para que el DOM ya tenga las cartas renderizadas
      setTimeout(function () {
        var cartas = hand.querySelectorAll('.card');
        if (cartas.length === 0) return;

        // Centro de la pantalla vs posición de cada carta
        var cx = window.innerWidth / 2;
        var cy = window.innerHeight / 2;

        cartas.forEach(function (card, idx) {
          // Limpiar animaciones previas por si acaso
          card.classList.remove('carta-dealt');
          void card.offsetWidth; // reflow

          var rect = card.getBoundingClientRect();
          var cardCx = rect.left + rect.width / 2;
          var cardCy = rect.top + rect.height / 2;

          // Offset desde la posición final hasta el centro (la carta "viene" del centro)
          var dx = cx - cardCx;
          var dy = cy - cardCy;

          card.style.setProperty('--deal-x', dx + 'px');
          card.style.setProperty('--deal-y', dy + 'px');
          card.style.animationDelay = (idx * 150) + 'ms';
          card.classList.add('carta-dealt');
        });

        // Limpiar clases después de que terminen todas las animaciones
        var totalMs = (cartas.length - 1) * 150 + 350 + 50;
        setTimeout(function () {
          cartas.forEach(function (card) {
            card.classList.remove('carta-dealt');
            card.style.removeProperty('--deal-x');
            card.style.removeProperty('--deal-y');
            card.style.animationDelay = '';
          });
        }, totalMs);
      }, 60);
    };

    // También observamos con MutationObserver como fallback
    // por si algún flujo no pasa por animarReparto()
    var hand = document.getElementById('player-hand');
    if (!hand) return;

    var prevCount = 0;
    var obs = new MutationObserver(function () {
      var cartas = hand.querySelectorAll('.card');
      var count = cartas.length;
      // Si pasamos de 0 (o menos) a 3, es nueva mano y animarReparto ya fue llamado
      // Este observer solo actúa si animarReparto NO fue llamado (fallback)
      if (count === 3 && prevCount < 3) {
        // Verificar si las cartas ya tienen la clase (ya se animó)
        var yaAnimado = hand.querySelector('.carta-dealt');
        if (!yaAnimado && typeof window.animarReparto === 'function') {
          window.animarReparto();
        }
      }
      prevCount = count;
    });
    obs.observe(hand, { childList: true });
  }

  /* ══════════════════════════════════════════════════════════════
     FEATURE 2: SKIN DE CARTAS CON FUTBOLISTAS
     ══════════════════════════════════════════════════════════════ */
  var _skinEnabled = lsGet('tg_skin_futbolistas', '1') === '1';

  function _getCartaFuerza(cardEl) {
    // Intentar leer del atributo title que tiene formato "N de palo"
    // La función global C está disponible si cartas.js ya cargó
    var title = cardEl.getAttribute('title') || '';
    // title = "7 de espadas", "1 de bastos", etc.
    if (!title) return null;
    var match = title.match(/^(\d+) de (\w+)$/i);
    if (!match) return null;
    var n = parseInt(match[1], 10);
    var p = match[2].toLowerCase();

    // Traducir a ID de carta para buscar en C
    var palos = { espadas: 'e', bastos: 'b', oros: 'o', copas: 'c' };
    var pKey = palos[p];
    if (!pKey) return null;
    var cartaId = n + '_' + pKey;

    // Usar el objeto global C si está disponible
    if (typeof C !== 'undefined' && C[cartaId]) {
      return C[cartaId].f;
    }
    return null;
  }

  function _agregarBadge(cardEl) {
    if (!_skinEnabled) return;
    if (cardEl.querySelector('.fv-futbolista-badge')) return; // ya tiene badge
    if (cardEl.classList.contains('dorso')) return; // es el dorso (carta oculta)

    var f = _getCartaFuerza(cardEl);
    if (f === null) return;

    var futbo = SKIN_FUTBOLISTAS[f];
    if (!futbo) return;

    var badge = document.createElement('div');
    badge.className = 'fv-futbolista-badge';
    badge.style.background = hexToRgba(futbo.color, 0.7);

    var emoji = document.createElement('span');
    emoji.className = 'fv-fb-emoji';
    emoji.textContent = futbo.emoji;

    var nombre = document.createElement('span');
    nombre.className = 'fv-fb-nombre';
    nombre.textContent = futbo.nombre;

    badge.appendChild(emoji);
    badge.appendChild(nombre);
    cardEl.appendChild(badge);
  }

  function hexToRgba(hex, alpha) {
    var r = parseInt(hex.slice(1, 3), 16);
    var g = parseInt(hex.slice(3, 5), 16);
    var b = parseInt(hex.slice(5, 7), 16);
    return 'rgba(' + r + ',' + g + ',' + b + ',' + alpha + ')';
  }

  function _escanearCartas() {
    if (!_skinEnabled) return;
    var targets = document.querySelectorAll('#player-hand .card, #played-row .card, .envido-mini-card');
    targets.forEach(_agregarBadge);
  }

  function _limpiarBadges() {
    document.querySelectorAll('.fv-futbolista-badge').forEach(function (b) {
      b.parentNode && b.parentNode.removeChild(b);
    });
  }

  function setupSkinFutbolistas() {
    // Observar el player-hand y played-row
    var targets = [
      document.getElementById('player-hand'),
      document.getElementById('played-row'),
    ].filter(Boolean);

    if (targets.length === 0) return;

    var obs = new MutationObserver(function () {
      _escanearCartas();
    });

    targets.forEach(function (t) {
      obs.observe(t, { childList: true, subtree: true });
    });

    // Escaneo inicial
    _escanearCartas();

    // Toggle en ajustes
    _inyectarToggleSkin();
  }

  function _inyectarToggleSkin() {
    // Inyectar setting row en el modal de ajustes
    var settingsModal = document.getElementById('settings-modal');
    if (!settingsModal) return;
    if (settingsModal.querySelector('.fv-setting-row')) return; // ya existe

    var guardarBtn = settingsModal.querySelector('.btn.primary');
    if (!guardarBtn) return;

    var row = document.createElement('div');
    row.className = 'fv-setting-row setting-row';
    row.innerHTML =
      '<div>' +
        '<div class="fv-setting-lbl setting-lbl">Skin de Futbolistas</div>' +
        '<div class="fv-setting-sub setting-sub">Muestra el ídolo en cada carta según su jerarquía</div>' +
      '</div>' +
      '<div class="fv-toggle' + (_skinEnabled ? ' on' : '') + '" id="fv-toggle-skin"></div>';

    guardarBtn.parentNode.insertBefore(row, guardarBtn);

    document.getElementById('fv-toggle-skin').addEventListener('click', function () {
      _skinEnabled = !_skinEnabled;
      lsPut('tg_skin_futbolistas', _skinEnabled ? '1' : '0');
      this.classList.toggle('on', _skinEnabled);
      if (_skinEnabled) {
        _escanearCartas();
      } else {
        _limpiarBadges();
      }
    });
  }

  /* ══════════════════════════════════════════════════════════════
     FEATURE 3: EFECTOS DE GOLAZO
     ══════════════════════════════════════════════════════════════ */
  var _golazoBusy = false;

  function _crearElementosGolazo() {
    if (document.getElementById('fv-golazo-flash')) return;

    // Flash
    var flash = document.createElement('div');
    flash.id = 'fv-golazo-flash';
    document.body.appendChild(flash);

    // Rayos
    var rayos = document.createElement('div');
    rayos.id = 'fv-golazo-rayos';
    for (var i = 0; i < 4; i++) {
      var rayo = document.createElement('div');
      rayo.className = 'fv-rayo';
      rayos.appendChild(rayo);
    }
    document.body.appendChild(rayos);

    // Texto GOLAZO
    var texto = document.createElement('div');
    texto.id = 'fv-golazo-texto';
    texto.textContent = '¡GOLAZO!';
    document.body.appendChild(texto);
  }

  function _getEquipoColor() {
    // Intentar leer el equipo del jugador desde localStorage y equipos.js (C global)
    try {
      var clubId = localStorage.getItem('truco_equipo');
      if (clubId && typeof EQUIPOS !== 'undefined') {
        for (var i = 0; i < EQUIPOS.length; i++) {
          if (EQUIPOS[i].id === clubId) return EQUIPOS[i].color || '#ffd700';
        }
      }
    } catch (e) {}
    return '#ffd700';
  }

  function _lanzarConfetti(colorPrincipal) {
    var colores = [colorPrincipal, '#ffffff', '#ffd700', '#ff4444', '#00e676'];
    for (var i = 0; i < 30; i++) {
      (function (idx) {
        setTimeout(function () {
          var p = document.createElement('div');
          p.className = 'fv-confetti';
          p.style.left = (5 + Math.random() * 90) + 'vw';
          p.style.background = colores[Math.floor(Math.random() * colores.length)];
          p.style.setProperty('--cx', ((Math.random() - 0.5) * 120) + 'px');
          p.style.setProperty('--cr', (Math.random() * 720 - 360) + 'deg');
          p.style.animation = 'confettiFall ' + (600 + Math.random() * 400) + 'ms ease-in forwards';
          document.body.appendChild(p);
          setTimeout(function () { if (p.parentNode) p.parentNode.removeChild(p); }, 1100);
        }, idx * 18);
      })(i);
    }
  }

  function _dispararGolazo() {
    if (_golazoBusy) return;
    _golazoBusy = true;

    _crearElementosGolazo();

    var flash  = document.getElementById('fv-golazo-flash');
    var texto  = document.getElementById('fv-golazo-texto');
    var rayos  = document.getElementById('fv-golazo-rayos');
    var mesa   = document.getElementById('mesa');
    var color  = _getEquipoColor();

    // 1. Shake de mesa (0ms)
    if (mesa) {
      mesa.classList.add('fv-golazo-shake');
      setTimeout(function () { mesa.classList.remove('fv-golazo-shake'); }, 320);
    }

    // 2. Flash blanco (0-120ms)
    flash.style.animation = 'none';
    void flash.offsetWidth;
    flash.style.animation = 'fvFlash 120ms ease-out forwards';

    // 3. Confetti (0ms en adelante)
    _lanzarConfetti(color);

    // 4. Rayos desde esquinas (150ms)
    setTimeout(function () {
      var rayEls = rayos.querySelectorAll('.fv-rayo');
      rayEls.forEach(function (r) {
        r.style.animation = 'none';
        void r.offsetWidth;
        r.style.animation = 'rayoExpand 650ms ease-out forwards';
      });
    }, 150);

    // 5. Texto GOLAZO (100ms)
    setTimeout(function () {
      texto.style.animation = 'none';
      void texto.offsetWidth;
      texto.style.animation = 'golazoPop 550ms cubic-bezier(0.34, 1.56, 0.64, 1) forwards';
    }, 100);

    // 6. Fade out del texto (900ms) y reset
    setTimeout(function () {
      texto.style.animation = 'golazoPop_out 300ms ease-in forwards';
      setTimeout(function () {
        texto.style.animation = 'none';
        texto.style.opacity = '0';
        texto.style.transform = 'translate(-50%, -50%) scale(0)';
        flash.style.animation = 'none';
        var rayEls = rayos.querySelectorAll('.fv-rayo');
        rayEls.forEach(function (r) { r.style.animation = 'none'; r.style.opacity = '0'; });
        _golazoBusy = false;
      }, 320);
    }, 900);
  }

  function setupEfectosGolazo() {
    if (typeof onJuego !== 'function') return;
    onJuego('finDePartido', function (data) {
      if (!data) return;
      var limite = data.limite || 30;
      if (data.puntosJugador >= limite) {
        setTimeout(_dispararGolazo, 300);
      }
    });
  }

  /* ══════════════════════════════════════════════════════════════
     FEATURE 4: SISTEMA DE SPONSORS
     ══════════════════════════════════════════════════════════════ */
  var sponsorActivo = lsGetJSON('tg_sponsor', null);

  function isSponsorActivo() {
    if (!sponsorActivo) return false;
    return new Date() < new Date(sponsorActivo.fechaFin);
  }

  function aplicarBonusSponsors(tipo, basePt) {
    if (!isSponsorActivo()) return basePt;
    var sponsor = SPONSORS.find(function (s) { return s.id === sponsorActivo.id; });
    if (sponsor && sponsor.bonus.tipo === tipo) {
      return basePt + sponsor.bonus.pt;
    }
    return basePt;
  }
  // Exponer globalmente para que otros módulos puedan llamarlo
  window.aplicarBonusSponsors = aplicarBonusSponsors;

  function _ficharSponsor(sponsorId) {
    var sponsor = SPONSORS.find(function (s) { return s.id === sponsorId; });
    if (!sponsor) return;

    // Verificar fondos
    if (sponsor.costo > 0) {
      var pesos = _getPesos();
      if (pesos < sponsor.costo) {
        if (typeof showToast === 'function') showToast('💰 No tenés suficientes PT (necesitás ' + sponsor.costo + ')');
        return;
      }
      _addPesos(-sponsor.costo, 'Contrato ' + sponsor.nombre);
    }

    var ahora = new Date();
    var fin = new Date(ahora.getTime() + sponsor.duracion_dias * 24 * 60 * 60 * 1000);
    sponsorActivo = {
      id: sponsor.id,
      fechaInicio: ahora.toISOString(),
      fechaFin: fin.toISOString(),
      bonus: sponsor.bonus,
    };
    lsPutJSON('tg_sponsor', sponsorActivo);

    _animarFirmaContrato(sponsor);
    _actualizarBannerSponsor();
    _renderSponsorsModal();

    if (typeof showToast === 'function') {
      showToast('✅ ¡Contrato firmado con ' + sponsor.nombre + '! ' + sponsor.bonus.desc);
    }
  }

  function _animarFirmaContrato(sponsor) {
    var overlay = document.createElement('div');
    overlay.id = 'fv-contrato-overlay';
    overlay.innerHTML =
      '<div class="fv-contrato-papel">' +
        '<h3>¡CONTRATO FIRMADO!</h3>' +
        '<span class="fv-contrato-logo">' + sponsor.logo + '</span>' +
        '<div class="fv-contrato-nombre">' + sponsor.nombre + '</div>' +
        '<div class="fv-contrato-bonus">' + sponsor.bonus.desc + '</div>' +
        '<span class="fv-contrato-sello" id="fv-sello">✅</span>' +
      '</div>';
    document.body.appendChild(overlay);

    // Disparar sello con delay
    setTimeout(function () {
      var sello = document.getElementById('fv-sello');
      if (sello) sello.classList.add('stamping');
    }, 10);

    setTimeout(function () {
      if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
    }, 1400);
  }

  function _actualizarBannerSponsor() {
    var banner = document.getElementById('fv-sponsor-banner');
    if (!banner) return;

    if (!isSponsorActivo()) {
      banner.classList.remove('visible');
      return;
    }

    var sponsor = SPONSORS.find(function (s) { return s.id === sponsorActivo.id; });
    if (!sponsor) return;

    banner.innerHTML =
      '<span class="fv-banner-logo">' + sponsor.logo + '</span>' +
      '<span class="fv-banner-nombre">' + sponsor.nombre + '</span>';
    banner.classList.add('visible');
  }

  function _crearBannerSponsor() {
    if (document.getElementById('fv-sponsor-banner')) return;
    var mesa = document.getElementById('mesa');
    if (!mesa) return;
    var banner = document.createElement('div');
    banner.id = 'fv-sponsor-banner';
    mesa.appendChild(banner);
    _actualizarBannerSponsor();
  }

  function _renderSponsorsModal() {
    var modal = document.getElementById('fv-sponsors-modal');
    if (!modal) return;

    var grid = modal.querySelector('.fv-sponsors-grid');
    if (!grid) return;

    // Verificar si el sponsor 'adidas_gol' fue desbloqueado alguna vez
    var desbloqueados = lsGetJSON('tg_sponsors_desbloqueados', ['adidas_gol']);

    grid.innerHTML = '';
    SPONSORS.forEach(function (sponsor) {
      var esActivo = isSponsorActivo() && sponsorActivo && sponsorActivo.id === sponsor.id;
      var esVencido = !esActivo && desbloqueados.indexOf(sponsor.id) !== -1;

      var card = document.createElement('div');
      card.className = 'fv-sponsor-card' + (esActivo ? ' activo' : esVencido ? ' vencido' : '');
      card.style.borderColor = esActivo ? '#4caf50' : 'rgba(255,255,255,0.1)';

      var btnLabel, btnClass;
      if (esActivo) {
        btnLabel = '✅ ACTIVO';
        btnClass = 'activo-btn';
      } else if (esVencido) {
        btnLabel = 'RENOVAR';
        btnClass = 'fichar';
      } else {
        btnLabel = sponsor.costo === 0 ? '🤝 GRATIS' : '💰 FICHAR ' + fmtPT(sponsor.costo);
        btnClass = 'fichar';
      }

      // Días restantes si activo
      var diasRestantes = '';
      if (esActivo) {
        var diff = new Date(sponsorActivo.fechaFin) - new Date();
        var dias = Math.ceil(diff / (1000 * 60 * 60 * 24));
        diasRestantes = '<div style="font-size:9px;color:#4caf50;margin-top:4px;">⏳ ' + dias + ' días restantes</div>';
      }

      card.innerHTML =
        '<span class="fv-sponsor-logo">' + sponsor.logo + '</span>' +
        '<div class="fv-sponsor-nombre">' + sponsor.nombre + '</div>' +
        '<div class="fv-sponsor-desc">' + sponsor.descripcion + '</div>' +
        '<span class="fv-sponsor-bonus">🏅 ' + sponsor.bonus.desc + '</span>' +
        diasRestantes +
        '<div class="fv-sponsor-footer">' +
          '<span class="fv-sponsor-costo">' + (sponsor.costo === 0 ? 'GRATIS' : fmtPT(sponsor.costo)) + '</span>' +
          '<button class="fv-sponsor-btn ' + btnClass + '" data-id="' + sponsor.id + '">' + btnLabel + '</button>' +
        '</div>';

      grid.appendChild(card);
    });

    // Event listeners en los botones
    grid.querySelectorAll('.fv-sponsor-btn.fichar').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var id = this.getAttribute('data-id');
        if (id) {
          // Registrar desbloqueado
          var desbloqueados2 = lsGetJSON('tg_sponsors_desbloqueados', ['adidas_gol']);
          if (desbloqueados2.indexOf(id) === -1) desbloqueados2.push(id);
          lsPutJSON('tg_sponsors_desbloqueados', desbloqueados2);
          _ficharSponsor(id);
        }
      });
    });
  }

  function abrirSponsors() {
    var modal = document.getElementById('fv-sponsors-modal');
    if (modal) {
      _renderSponsorsModal();
      modal.classList.add('show');
    }
  }
  window.abrirSponsors = abrirSponsors;

  function _cerrarSponsors() {
    var modal = document.getElementById('fv-sponsors-modal');
    if (modal) modal.classList.remove('show');
  }

  function _crearModalSponsors() {
    if (document.getElementById('fv-sponsors-modal')) return;

    var modal = document.createElement('div');
    modal.id = 'fv-sponsors-modal';
    modal.innerHTML =
      '<div class="fv-sponsors-box">' +
        '<h2>💼 SPONSORS</h2>' +
        '<div class="fv-sponsors-subtitle">Firmá un contrato y conseguí bonus de PT automáticos</div>' +
        '<div class="fv-sponsors-grid"></div>' +
        '<button class="btn primary" style="margin-top:16px;width:100%;" onclick="closeModal(\'fv-sponsors-modal\')">CERRAR</button>' +
      '</div>';

    // Cerrar al click fuera del box
    modal.addEventListener('click', function (e) {
      if (e.target === modal) _cerrarSponsors();
    });

    document.body.appendChild(modal);

    // Sobreescribir closeModal para que sepa cerrar este modal también
    var _origClose = window.closeModal;
    window.closeModal = function (id) {
      if (id === 'fv-sponsors-modal') { _cerrarSponsors(); return; }
      if (typeof _origClose === 'function') _origClose(id);
    };
  }

  function _inyectarBotonSponsors() {
    // Agregar botón en el menú principal (dentro de mm-links o mm-footer)
    var mmLinks = document.querySelector('.mm-links');
    if (!mmLinks) return;
    if (mmLinks.querySelector('.fv-sponsors-menu-btn')) return;

    var btn = document.createElement('button');
    btn.className = 'mm-link fv-sponsors-menu-btn';
    btn.textContent = '💼 Sponsors';
    btn.onclick = function () { abrirSponsors(); };
    mmLinks.appendChild(btn);
  }

  function _hookSponsorVictoria() {
    if (typeof onJuego !== 'function') return;
    onJuego('finDePartido', function (data) {
      if (!data) return;
      var limite = data.limite || 30;
      if (data.puntosJugador < limite) return;
      if (!isSponsorActivo()) return;
      var sponsor = SPONSORS.find(function (s) { return s.id === sponsorActivo.id; });
      if (!sponsor) return;
      if (sponsor.bonus.tipo === 'victoria') {
        setTimeout(function () {
          _addPesos(sponsor.bonus.pt, 'Bonus ' + sponsor.nombre);
        }, 800);
      }
    });

    // Bonus diario del sponsor FútbolBanco
    onJuego('manoRepartida', function () {
      if (!isSponsorActivo()) return;
      var sponsor = SPONSORS.find(function (s) { return s.id === sponsorActivo.id; });
      if (!sponsor || sponsor.bonus.tipo !== 'diario') return;
      var hoy = new Date().toDateString();
      var ultimoDia = lsGet('tg_sponsor_diario_fecha', '');
      if (ultimoDia !== hoy) {
        lsPut('tg_sponsor_diario_fecha', hoy);
        _addPesos(sponsor.bonus.pt, 'Bono diario ' + sponsor.nombre);
      }
    });
  }

  // Sponsor inicial adidas_gol desbloqueado gratis para todos
  function _asegurarSponsorInicial() {
    var desbloqueados = lsGetJSON('tg_sponsors_desbloqueados', null);
    if (!desbloqueados) {
      lsPutJSON('tg_sponsors_desbloqueados', ['adidas_gol']);
    }
    // Si no tiene ningún sponsor activo, activar adidas_gol por defecto
    if (!isSponsorActivo() && !sponsorActivo) {
      var ahora = new Date();
      var fin = new Date(ahora.getTime() + 7 * 24 * 60 * 60 * 1000);
      sponsorActivo = {
        id: 'adidas_gol',
        fechaInicio: ahora.toISOString(),
        fechaFin: fin.toISOString(),
        bonus: SPONSORS[0].bonus,
      };
      lsPutJSON('tg_sponsor', sponsorActivo);
    }
  }

  function setupSponsors() {
    _asegurarSponsorInicial();
    _crearModalSponsors();
    _crearBannerSponsor();
    _inyectarBotonSponsors();
    _hookSponsorVictoria();
  }

  /* ══════════════════════════════════════════════════════════════
     INIT
     ══════════════════════════════════════════════════════════════ */
  function init() {
    try { setupRepartoCartas();  } catch (e) { console.warn('[FV] reparto:', e); }
    try { setupSkinFutbolistas(); } catch (e) { console.warn('[FV] skin:', e); }
    try { setupEfectosGolazo();  } catch (e) { console.warn('[FV] golazo:', e); }
    try { setupSponsors();       } catch (e) { console.warn('[FV] sponsors:', e); }
  }

  if (document.readyState === 'loading') {
    window.addEventListener('load', function () { setTimeout(init, 1100); });
  } else {
    setTimeout(init, 1100);
  }

})();
