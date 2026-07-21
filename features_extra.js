// ══════════════════════════════════════════════════════════════
// features_extra.js — Espectador IA vs IA · Replay de mano · 2v2 Pasar y Jugar
// Se carga DESPUÉS de juego.js y juego_ui.js
// NO modifica index.html: crea sus propios nodos DOM en tiempo de ejecución.
// ══════════════════════════════════════════════════════════════
(function () {
  'use strict';

  // ──────────────────────────────────────────────────────────
  // UTILIDADES COMPARTIDAS
  // ──────────────────────────────────────────────────────────

  function qs(sel, ctx) { return (ctx || document).querySelector(sel); }

  function crearEl(tag, attrs, html) {
    const el = document.createElement(tag);
    if (attrs) Object.entries(attrs).forEach(([k, v]) => {
      if (k === 'class') el.className = v;
      else if (k === 'style') el.style.cssText = v;
      else el.setAttribute(k, v);
    });
    if (html !== undefined) el.innerHTML = html;
    return el;
  }

  // Inyecta un nodo una sola vez (idempotente)
  function injectOnce(id, buildFn) {
    if (document.getElementById(id)) return document.getElementById(id);
    const el = buildFn();
    el.id = id;
    document.body.appendChild(el);
    return el;
  }

  // ──────────────────────────────────────────────────────────
  // FEATURE 1 — MODO ESPECTADOR (IA vs IA)
  // ──────────────────────────────────────────────────────────

  function setupEspectador() {

    let activo     = false;
    let velocidad  = 1200;   // ms entre acciones
    let timerAuto  = null;

    // ── DOM del banner ─────────────────────────────────────
    function crearBannerEspectador() {
      const banner = crearEl('div', { class: 'ext-espectador-banner' }, [
        '<div class="ext-esp-title">👁️ MODO ESPECTADOR</div>',
        '<div class="ext-esp-score" id="ext-esp-score">0 – 0</div>',
        '<div class="ext-esp-controls">',
        '  <span class="ext-esp-lbl">Velocidad:</span>',
        '  <button class="ext-esp-vel active" data-ms="2000">🐢 Lento</button>',
        '  <button class="ext-esp-vel" data-ms="1200">⚽ Normal</button>',
        '  <button class="ext-esp-vel" data-ms="550">⚡ Rápido</button>',
        '</div>',
        '<button class="ext-esp-control-btn" id="ext-esp-tomar">🎮 Tomar el Control</button>'
      ].join(''));
      return banner;
    }

    function initBannerDOM() {
      const banner = injectOnce('ext-espectador-banner', crearBannerEspectador);

      banner.querySelectorAll('.ext-esp-vel').forEach(function(btn) {
        btn.addEventListener('click', function() {
          velocidad = parseInt(btn.dataset.ms, 10);
          banner.querySelectorAll('.ext-esp-vel').forEach(function(b) { b.classList.remove('active'); });
          btn.classList.add('active');
        });
      });

      var btnTomar = banner.querySelector('#ext-esp-tomar');
      if (btnTomar) btnTomar.addEventListener('click', desactivar);

      return banner;
    }

    function actualizarScoreBanner() {
      try {
        var el = document.getElementById('ext-esp-score');
        if (!el || typeof S === 'undefined') return;
        el.textContent = S.puntosJugador + ' – ' + S.puntosRival;
      } catch (e) { /* silencioso */ }
    }

    function autoJugar() {
      if (!activo) return;

      actualizarScoreBanner();

      try {
        var accionesEl     = document.getElementById('acciones');
        var cartasJugables = document.querySelectorAll('.card.can-play');
        var botonesRaw     = accionesEl
          ? accionesEl.querySelectorAll('button:not([disabled]):not(.bloq)')
          : [];

        var TEXTOS_EXCLUIDOS = ['MENÚ', 'VOLVER', '☰', '←'];
        var botones = Array.from(botonesRaw).filter(function(b) {
          var txt = b.textContent.trim().toUpperCase();
          return !TEXTOS_EXCLUIDOS.some(function(ex) { return txt.indexOf(ex) !== -1; });
        });

        var totalAccionables = cartasJugables.length + botones.length;

        if (totalAccionables === 0) {
          timerAuto = setTimeout(autoJugar, 400);
          return;
        }

        var jitter = (Math.random() * 0.3 - 0.15) * velocidad;
        var delay  = Math.max(300, velocidad + jitter);

        timerAuto = setTimeout(function() {
          if (!activo) return;

          try {
            var cartasNow  = document.querySelectorAll('.card.can-play');
            var accionesN  = document.getElementById('acciones');
            var botonesNow = accionesN
              ? Array.from(accionesN.querySelectorAll('button:not([disabled]):not(.bloq)'))
                  .filter(function(b) {
                    return !TEXTOS_EXCLUIDOS.some(function(ex) {
                      return b.textContent.trim().toUpperCase().indexOf(ex) !== -1;
                    });
                  })
              : [];

            var total = cartasNow.length + botonesNow.length;
            if (total === 0) { timerAuto = setTimeout(autoJugar, 400); return; }

            var elegirCarta;
            if (cartasNow.length === 0)      elegirCarta = false;
            else if (botonesNow.length === 0) elegirCarta = true;
            else                              elegirCarta = Math.random() < 0.65;

            if (elegirCarta && cartasNow.length > 0) {
              var idx = Math.floor(Math.random() * cartasNow.length);
              cartasNow[idx].click();
            } else if (botonesNow.length > 0) {
              var pool = botonesNow;
              var sinMazo = botonesNow.filter(function(b) {
                return b.textContent.toUpperCase().indexOf('MAZO') === -1;
              });
              if (sinMazo.length > 0 && Math.random() > 0.15) pool = sinMazo;
              var ri = Math.floor(Math.random() * pool.length);
              pool[ri].click();
            }
          } catch (e) { console.warn('[Espectador] autoJugar inner:', e); }

          timerAuto = setTimeout(autoJugar, 200);

        }, delay);

      } catch (e) {
        console.warn('[Espectador] autoJugar:', e);
        timerAuto = setTimeout(autoJugar, 800);
      }
    }

    function activar() {
      if (activo) return;
      activo = true;

      var banner = initBannerDOM();
      banner.classList.add('show');
      document.body.classList.add('modo-espectador');

      timerAuto = setTimeout(autoJugar, 800);

      if (typeof onJuego === 'function') {
        window._espectadorRenderUnsub = onJuego('render', actualizarScoreBanner);
      }
    }

    function desactivar() {
      activo = false;
      clearTimeout(timerAuto);
      timerAuto = null;

      var banner = document.getElementById('ext-espectador-banner');
      if (banner) banner.classList.remove('show');
      document.body.classList.remove('modo-espectador');

      if (typeof window._espectadorRenderUnsub === 'function') {
        window._espectadorRenderUnsub();
        window._espectadorRenderUnsub = null;
      }
    }

    function inyectarBotonMenu() {
      var nav = qs('.mm-nav');
      if (!nav) return;
      if (document.getElementById('ext-esp-menu-btn')) return;

      var btn = crearEl('button', {
        id: 'ext-esp-menu-btn',
        class: 'mm-btn mm-btn-secondary ext-espectador-menu-btn'
      }, [
        '<span class="mm-btn-icon">👁️</span>',
        '<span class="mm-btn-text">',
        '  <strong>ESPECTADOR</strong>',
        '  <small>La IA juega sola — mirá y aprendé</small>',
        '</span>'
      ].join(''));

      btn.addEventListener('click', function() {
        try {
          if (typeof irA === 'function') irA('mesa');
          setTimeout(function() {
            try {
              if (typeof S !== 'undefined' && S.puntosJugador === 0 && S.puntosRival === 0) {
                if (typeof repartirNuevaMano === 'function') repartirNuevaMano();
              }
            } catch (e) { /* el juego puede estar corriendo */ }
            activar();
          }, 400);
        } catch (e) { console.warn('[Espectador] iniciar:', e); }
      });

      var btnAmistoso = nav.querySelector('.mm-acc-amistoso');
      if (btnAmistoso && btnAmistoso.parentNode) {
        btnAmistoso.parentNode.insertBefore(btn, btnAmistoso.nextSibling);
      } else {
        nav.appendChild(btn);
      }
    }

    window.activarModoEspectador    = activar;
    window.desactivarModoEspectador = desactivar;
    window.setEspectadorVelocidad   = function(ms) { velocidad = ms; };

    inyectarBotonMenu();

    if (!qs('.mm-nav')) {
      var obs = new MutationObserver(function() {
        if (qs('.mm-nav')) { obs.disconnect(); inyectarBotonMenu(); }
      });
      obs.observe(document.body, { childList: true, subtree: true });
    }
  }

  // ──────────────────────────────────────────────────────────
  // FEATURE 2 — REPLAY DE LA MANO
  // ──────────────────────────────────────────────────────────

  function setupReplay() {

    var capturaActual = { jugador: [], rival: [] };
    var replayTimer   = null;

    function crearOverlayReplay() {
      var el = crearEl('div', { class: 'ext-replay-overlay' }, [
        '<div class="ext-replay-inner">',
        '  <div class="ext-replay-title">🎬 REPLAY</div>',
        '  <div class="ext-replay-section ext-replay-rival">',
        '    <div class="ext-replay-label" id="ext-replay-label-r">RIVAL</div>',
        '    <div class="ext-replay-cartas" id="ext-replay-cartas-r"></div>',
        '  </div>',
        '  <div class="ext-replay-section ext-replay-jugador">',
        '    <div class="ext-replay-label" id="ext-replay-label-j">VOS</div>',
        '    <div class="ext-replay-cartas" id="ext-replay-cartas-j"></div>',
        '  </div>',
        '</div>'
      ].join(''));
      return el;
    }

    function initReplayDOM() {
      return injectOnce('ext-replay-overlay', crearOverlayReplay);
    }

    function capturarEstado() {
      try {
        if (typeof S === 'undefined') return;
        var j = S.cartasRondaJugador.filter(Boolean);
        var r = S.cartasRondaRival.filter(Boolean);
        if (j.length > 0 || r.length > 0) {
          capturaActual = {
            jugador: j.slice(),
            rival:   r.slice(),
            nombreJ: S.nombreJugador || 'VOS',
            nombreR: (typeof AVATARS !== 'undefined' && AVATARS[S.idRival])
                     ? AVATARS[S.idRival].name : 'RIVAL'
          };
        }
      } catch (e) { console.warn('[Replay] capturarEstado:', e); }
    }

    function mostrarReplay() {
      try {
        var overlay = initReplayDOM();
        var cJ = capturaActual.jugador || [];
        var cR = capturaActual.rival   || [];

        if (cJ.length === 0 && cR.length === 0) return;

        var labelJ = overlay.querySelector('#ext-replay-label-j');
        var labelR = overlay.querySelector('#ext-replay-label-r');
        if (labelJ) labelJ.textContent = capturaActual.nombreJ || 'VOS';
        if (labelR) labelR.textContent = capturaActual.nombreR || 'RIVAL';

        var divJ = overlay.querySelector('#ext-replay-cartas-j');
        if (divJ) {
          divJ.innerHTML = cJ.map(function(id, i) {
            return '<div class="ext-replay-carta" style="animation-delay:' + (i * 120) + 'ms">' +
              '<img src="' + id + '.webp" alt="carta" onerror="this.parentNode.innerHTML=\'<div class=ext-replay-ph>' + id + '</div>\'">' +
              '<span class="ext-replay-ronda">' + (i + 1) + 'ª</span>' +
              '</div>';
          }).join('');
        }

        var divR = overlay.querySelector('#ext-replay-cartas-r');
        if (divR) {
          divR.innerHTML = cR.map(function(id, i) {
            return '<div class="ext-replay-carta" style="animation-delay:' + (i * 120) + 'ms">' +
              '<img src="' + id + '.webp" alt="carta" onerror="this.parentNode.innerHTML=\'<div class=ext-replay-ph>' + id + '</div>\'">' +
              '<span class="ext-replay-ronda">' + (i + 1) + 'ª</span>' +
              '</div>';
          }).join('');
        }

        overlay.classList.add('show');
        clearTimeout(replayTimer);
        replayTimer = setTimeout(function() {
          overlay.classList.remove('show');
          capturaActual = { jugador: [], rival: [] };
        }, 3200);

      } catch (e) { console.warn('[Replay] mostrarReplay:', e); }
    }

    function hookResultadoOverlay() {
      var resultadoOverlay = document.getElementById('resultado-overlay');
      if (!resultadoOverlay) {
        setTimeout(hookResultadoOverlay, 500);
        return;
      }

      var ultimoShow = false;
      new MutationObserver(function() {
        var estaShow = resultadoOverlay.classList.contains('show');
        if (estaShow && !ultimoShow) {
          capturarEstado();
          clearTimeout(replayTimer);
          replayTimer = setTimeout(mostrarReplay, 1800);
        }
        ultimoShow = estaShow;
      }).observe(resultadoOverlay, { attributes: true, attributeFilter: ['class'] });
    }

    hookResultadoOverlay();
  }

  // ──────────────────────────────────────────────────────────
  // FEATURE 3 — 2 JUGADORES: PASAR Y JUGAR
  // ──────────────────────────────────────────────────────────
  // El motor es 1v1 contra IA. Para hacer 2 humanos sin reescribir el motor:
  // J1 juega como "jugador", J2 como "rival". Cuando toca el "rival", en vez
  // de la IA, mostramos pantalla negra y pedimos que pase el celu a J2.
  // J2 ve sus cartas reales (las mostramos nosotros) y puede jugarlas.
  // ──────────────────────────────────────────────────────────

  function setup2v2() {

    var pvpActivo  = false;
    var nombres    = { j1: 'Jugador 1', j2: 'Jugador 2' };
    var turnoActualPVP = 'j1';
    var turnoRivalOriginal = null;

    // ── Setup screen ───────────────────────────────────────
    function crearSetupScreen() {
      var el = crearEl('div', { class: 'ext-pvp-setup' }, [
        '<div class="ext-pvp-setup-inner">',
        '  <button class="ext-pvp-back" id="ext-pvp-back">← Volver</button>',
        '  <div class="ext-pvp-setup-title">👥 2 JUGADORES</div>',
        '  <div class="ext-pvp-setup-sub">Un dispositivo, dos jugadores — turnos alternados</div>',
        '  <div class="ext-pvp-setup-field">',
        '    <label>Jugador 1 (juega como "Vos")</label>',
        '    <input type="text" id="ext-pvp-name-j1" maxlength="12" placeholder="Jugador 1" autocomplete="off">',
        '  </div>',
        '  <div class="ext-pvp-setup-field">',
        '    <label>Jugador 2 (juega como "Rival")</label>',
        '    <input type="text" id="ext-pvp-name-j2" maxlength="12" placeholder="Jugador 2" autocomplete="off">',
        '  </div>',
        '  <div class="ext-pvp-setup-nota">',
        '    ⚠️ Cuando cambia el turno aparece pantalla negra para que el otro no vea tus cartas.',
        '  </div>',
        '  <button class="ext-pvp-iniciar" id="ext-pvp-iniciar">⚽ ¡EMPEZAR!</button>',
        '</div>'
      ].join(''));
      return el;
    }

    // ── Overlay pantalla negra ─────────────────────────────
    function crearOverlayPVP() {
      var el = crearEl('div', { class: 'ext-pvp-overlay' }, [
        '<div class="ext-pvp-inner">',
        '  <div class="ext-pvp-icon">📱</div>',
        '  <div class="ext-pvp-msg" id="ext-pvp-msg">Pasá el celu</div>',
        '  <div class="ext-pvp-sub" id="ext-pvp-sub">El otro jugador no debe ver tus cartas</div>',
        '  <button class="ext-pvp-btn" id="ext-pvp-show-btn">Listo, veo mis cartas ✅</button>',
        '  <button class="ext-pvp-salir" id="ext-pvp-salir">✕ Salir del modo 2 jugadores</button>',
        '</div>'
      ].join(''));
      return el;
    }

    // ── Banner de turno ────────────────────────────────────
    function crearBannerPVP() {
      var el = crearEl('div', { class: 'ext-pvp-banner' }, [
        '<span class="ext-pvp-turno-ico">🎮</span>',
        '<span class="ext-pvp-turno-txt" id="ext-pvp-turno-txt">Turno de J1</span>'
      ].join(''));
      return el;
    }

    function initPVPDOM() {
      var overlay = injectOnce('ext-pvp-overlay', crearOverlayPVP);
      var banner  = injectOnce('ext-pvp-banner',  crearBannerPVP);

      var btnShow = overlay.querySelector('#ext-pvp-show-btn');
      if (btnShow && !btnShow._pvpInited) {
        btnShow._pvpInited = true;
        btnShow.addEventListener('click', function() {
          overlay.classList.remove('show');
          // Si es el turno de J2 (rival), habilitar sus cartas
          if (turnoActualPVP === 'j2') {
            habilitarCartasRivalParaJ2();
          }
        });
      }

      var btnSalir = overlay.querySelector('#ext-pvp-salir');
      if (btnSalir && !btnSalir._pvpInited) {
        btnSalir._pvpInited = true;
        btnSalir.addEventListener('click', desactivarPVP);
      }

      return { overlay: overlay, banner: banner };
    }

    function mostrarPasarCelu(nombreQueJuega) {
      var overlay = document.getElementById('ext-pvp-overlay');
      if (!overlay) return;

      var msg = overlay.querySelector('#ext-pvp-msg');
      var sub = overlay.querySelector('#ext-pvp-sub');
      if (msg) msg.textContent = '📱 Pasá el celu a ' + nombreQueJuega;
      if (sub) sub.textContent = 'El otro jugador no debe ver tus cartas ni tus acciones';

      overlay.classList.add('show');
    }

    function actualizarBannerPVP() {
      var txt = document.getElementById('ext-pvp-turno-txt');
      if (!txt) return;
      var nombre = turnoActualPVP === 'j1' ? nombres.j1 : nombres.j2;
      txt.textContent = '🎮 Turno de ' + nombre;
    }

    // ── Mostrar cartas reales del rival para J2 ────────────
    function habilitarCartasRivalParaJ2() {
      try {
        var rivalHand = document.getElementById('rival-hand');
        if (!rivalHand) return;
        if (typeof S === 'undefined' || typeof C === 'undefined') return;

        rivalHand.innerHTML = '';
        rivalHand.classList.add('pvp-rival-mano');

        S.manoRival.forEach(function(cartaId, idx) {
          if (!cartaId) return;
          var carta = C[cartaId];
          if (!carta) return;

          var div = document.createElement('div');
          div.className = 'card can-play pvp-rival-carta';
          div.dataset.idx = idx;

          var img = document.createElement('img');
          img.src = cartaId + '.webp';
          img.alt = carta.n || cartaId;
          img.draggable = false;
          img.onerror = function() {
            var ph = document.createElement('div');
            ph.className = 'dorso-inner';
            ph.textContent = carta.n || cartaId;
            img.replaceWith(ph);
          };

          div.appendChild(img);

          div.addEventListener('click', (function(capturedIdx) {
            return function() {
              if (!pvpActivo) return;
              if (typeof S !== 'undefined' && S.cantoPendiente) return;
              if (typeof jugarCartaRivalFisico === 'function') {
                jugarCartaRivalFisico(capturedIdx);
                // Después de jugar, restaurar dorso y programar pase a J1
                rivalHand.classList.remove('pvp-rival-mano');
                if (typeof renderizarManoRival === 'function') {
                  setTimeout(renderizarManoRival, 150);
                }
                programarPaseJ1();
              }
            };
          })(idx));

          rivalHand.appendChild(div);
        });

        // También desbloquear botones de acción para J2
        if (typeof bloquearBotonesAccion === 'function') {
          bloquearBotonesAccion(false);
        }
        // Escuchar clicks en botones de acción para detectar cuando J2 terminó
        escucharAccionesJ2();

      } catch (e) { console.warn('[PVP] habilitarCartasRivalParaJ2:', e); }
    }

    // ── Escuchar acciones de J2 (cantos: quiero, no quiero, etc.) ──
    function escucharAccionesJ2() {
      var accionesEl = document.getElementById('acciones');
      if (!accionesEl || accionesEl._pvpJ2listener) return;
      accionesEl._pvpJ2listener = true;

      accionesEl.addEventListener('click', function handler(e) {
        var btn = e.target.closest('button');
        if (!btn) return;
        if (!pvpActivo || turnoActualPVP !== 'j2') return;
        // Un canto/respuesta de J2: programar pase a J1 con delay
        setTimeout(function() {
          if (pvpActivo && turnoActualPVP === 'j2') {
            var rivalHand = document.getElementById('rival-hand');
            if (rivalHand) {
              rivalHand.classList.remove('pvp-rival-mano');
              if (typeof renderizarManoRival === 'function') renderizarManoRival();
            }
            programarPaseJ1();
          }
        }, 600);
      }, true); // capture: true para interceptar antes que el motor
    }

    function programarPaseJ1() {
      turnoActualPVP = 'j1';
      actualizarBannerPVP();
      setTimeout(function() {
        if (pvpActivo && typeof S !== 'undefined' && !S.juegoTerminado) {
          mostrarPasarCelu(nombres.j1);
        }
      }, 700);
    }

    // ── Hook de turnoRival ─────────────────────────────────
    // En lugar de correr la IA, mostramos pantalla negra para J2.
    function hookTurnoRival() {
      if (typeof window.turnoRival !== 'function') return;
      if (turnoRivalOriginal) return; // ya hookeado

      turnoRivalOriginal = window.turnoRival;

      window.turnoRival = function() {
        if (!pvpActivo) {
          if (turnoRivalOriginal) turnoRivalOriginal.apply(this, arguments);
          return;
        }

        // Turno de J2: mostrar pantalla negra
        turnoActualPVP = 'j2';
        actualizarBannerPVP();

        // Ocultar el indicador "pensando..." que podría aparecer
        var thinking = document.getElementById('thinking');
        if (thinking) thinking.classList.remove('show');

        // Desbloquear botones antes de mostrar la pantalla (el motor los bloqueó)
        // pero la pantalla negra los oculta de todas formas hasta que J2 confirme
        setTimeout(function() {
          if (pvpActivo) mostrarPasarCelu(nombres.j2);
        }, 200);
      };
    }

    // ── Eventos del motor ──────────────────────────────────
    function hookEventosMotor() {
      if (typeof onJuego !== 'function') return;

      // Al repartir nueva mano: volver a J1, mostrar pantalla de cambio
      window._pvpManoUnsub = onJuego('manoRepartida', function() {
        if (!pvpActivo) return;
        turnoActualPVP = 'j1';
        actualizarBannerPVP();
        // Si el turno inicial de la nueva mano corresponde al jugador (J1), pedir celu
        setTimeout(function() {
          if (pvpActivo && typeof S !== 'undefined' && !S.juegoTerminado) {
            // Solo pedir si el turno es del jugador (J1)
            if (S.turnoActual === 'jugador') {
              mostrarPasarCelu(nombres.j1);
            }
            // Si turno = rival, nuestro hook de turnoRival se encargará
          }
        }, 800);
      });

      // Al fin de partido: desactivar
      window._pvpFinUnsub = onJuego('finDePartido', function() {
        if (!pvpActivo) return;
        setTimeout(desactivarPVP, 2000);
      });
    }

    // ── Pantalla de setup ──────────────────────────────────
    function mostrarSetup() {
      var setup = document.getElementById('ext-pvp-setup');
      if (!setup) {
        setup = crearSetupScreen();
        setup.id = 'ext-pvp-setup';
        document.body.appendChild(setup);

        setup.querySelector('#ext-pvp-back').addEventListener('click', function() {
          setup.classList.remove('show');
        });

        setup.querySelector('#ext-pvp-iniciar').addEventListener('click', function() {
          var n1 = (setup.querySelector('#ext-pvp-name-j1').value || '').trim() || 'Jugador 1';
          var n2 = (setup.querySelector('#ext-pvp-name-j2').value || '').trim() || 'Jugador 2';
          nombres = { j1: n1, j2: n2 };
          setup.classList.remove('show');
          activarPVP();
        });
      }
      setup.classList.add('show');
    }

    // ── Activar ────────────────────────────────────────────
    function activarPVP() {
      pvpActivo = true;

      var dom = initPVPDOM();
      dom.banner.classList.add('show');
      actualizarBannerPVP();

      hookTurnoRival();
      hookEventosMotor();

      try {
        if (typeof irA === 'function') irA('mesa');
        setTimeout(function() {
          try {
            if (typeof S !== 'undefined') {
              S.puntosJugador  = 0;
              S.puntosRival    = 0;
              S.juegoTerminado = false;
            }
            if (typeof repartirNuevaMano === 'function') repartirNuevaMano();
          } catch (e) { console.warn('[PVP] repartir:', e); }
        }, 400);
      } catch (e) { console.warn('[PVP] irA:', e); }

      // Primer turno: mostrar pantalla para J1
      setTimeout(function() { mostrarPasarCelu(nombres.j1); }, 1100);
    }

    // ── Desactivar ─────────────────────────────────────────
    function desactivarPVP() {
      pvpActivo = false;

      if (turnoRivalOriginal) {
        window.turnoRival = turnoRivalOriginal;
        turnoRivalOriginal = null;
      }

      var overlay = document.getElementById('ext-pvp-overlay');
      if (overlay) overlay.classList.remove('show');

      var banner = document.getElementById('ext-pvp-banner');
      if (banner) banner.classList.remove('show');

      if (typeof window._pvpManoUnsub === 'function') { window._pvpManoUnsub(); window._pvpManoUnsub = null; }
      if (typeof window._pvpFinUnsub  === 'function') { window._pvpFinUnsub();  window._pvpFinUnsub  = null; }

      var rivalHand = document.getElementById('rival-hand');
      if (rivalHand) {
        rivalHand.classList.remove('pvp-rival-mano');
        if (typeof renderizarManoRival === 'function') renderizarManoRival();
      }

      try { if (typeof irA === 'function') irA('main-menu'); } catch (e) { /* ok */ }
    }

    // ── Botón en el menú ───────────────────────────────────
    function inyectarBotonMenu2v2() {
      var nav = qs('.mm-nav');
      if (!nav) return;
      if (document.getElementById('ext-pvp-menu-btn')) return;

      var btn = crearEl('button', {
        id: 'ext-pvp-menu-btn',
        class: 'mm-btn mm-btn-secondary ext-pvp-menu-btn'
      }, [
        '<span class="mm-btn-icon">👥</span>',
        '<span class="mm-btn-text">',
        '  <strong>2 JUGADORES</strong>',
        '  <small>Un dispositivo, dos rivales humanos — se turnan</small>',
        '</span>'
      ].join(''));

      btn.addEventListener('click', mostrarSetup);

      var btnEsp      = document.getElementById('ext-esp-menu-btn');
      var btnAmistoso = nav.querySelector('.mm-acc-amistoso');
      var anchor      = btnEsp || btnAmistoso;
      if (anchor && anchor.parentNode) {
        anchor.parentNode.insertBefore(btn, anchor.nextSibling);
      } else {
        nav.appendChild(btn);
      }
    }

    inyectarBotonMenu2v2();

    if (!qs('.mm-nav')) {
      var obs = new MutationObserver(function() {
        if (qs('.mm-nav')) { obs.disconnect(); inyectarBotonMenu2v2(); }
      });
      obs.observe(document.body, { childList: true, subtree: true });
    }
  }

  // ──────────────────────────────────────────────────────────
  // INIT
  // ──────────────────────────────────────────────────────────

  function init() {
    try { setupEspectador(); } catch (e) { console.warn('[features_extra] espectador:', e); }
    try { setupReplay();     } catch (e) { console.warn('[features_extra] replay:', e); }
    try { setup2v2();        } catch (e) { console.warn('[features_extra] 2v2:', e); }
  }

  if (document.readyState === 'complete') {
    setTimeout(init, 700);
  } else {
    window.addEventListener('load', function() { setTimeout(init, 700); });
  }

})();
