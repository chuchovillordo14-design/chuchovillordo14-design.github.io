// features_modos.js
// Modo Contrarreloj, Sistema de Apuestas PT, Modo Entrenamiento
// No modifica otros archivos. Se inyecta desde index.html.
(function () {
  'use strict';

  // ─────────────────────────────────────────────────────────────
  // HELPERS COMPARTIDOS
  // ─────────────────────────────────────────────────────────────

  // Acceso al estado global — S es var global de juego.js
  function getS() { return typeof S !== 'undefined' ? S : (window.S || null); }

  // Sonido tick con Web Audio API (sin assets externos)
  function tickSonido() {
    try {
      var s = getS();
      if (s && s.cfgSonido === false) return;
      var ctx = new (window.AudioContext || window.webkitAudioContext)();
      var osc = ctx.createOscillator();
      var gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.08);
    } catch (e) { /* silencioso */ }
  }

  // Toast genérico
  function mostrarToast(msg, tipo, duracion) {
    duracion = duracion || 3000;
    var t = document.createElement('div');
    t.className = 'fm-toast fm-toast-' + (tipo || 'neutro');
    t.textContent = msg;
    document.body.appendChild(t);
    requestAnimationFrame(function () { t.classList.add('show'); });
    setTimeout(function () {
      t.classList.remove('show');
      setTimeout(function () { if (t.parentNode) t.parentNode.removeChild(t); }, 400);
    }, duracion);
  }

  // ─────────────────────────────────────────────────────────────
  // FEATURE 1: MODO CONTRARRELOJ
  // ─────────────────────────────────────────────────────────────

  function setupContrarreloj() {
    var timerActivo = false;
    var timerInterval = null;
    var segundosRestantes = 15;
    var modoCR = localStorage.getItem('tg_contrarreloj') === '1';

    // — UI: contenedor de barra de timer —
    var container = document.createElement('div');
    container.id = 'fm-timer-container';
    container.innerHTML =
      '<div id="fm-timer-track">' +
        '<div id="fm-timer-bar"></div>' +
        '<span id="fm-timer-num">15</span>' +
      '</div>';
    container.style.display = 'none';

    function insertarTimer() {
      if (document.getElementById('fm-timer-container')) return;
      var playerHand = document.getElementById('player-hand');
      if (playerHand && playerHand.parentNode) {
        playerHand.parentNode.insertBefore(container, playerHand);
      }
    }
    insertarTimer();
    setTimeout(insertarTimer, 1500);

    function mostrarBarraTimer() { container.style.display = 'block'; }

    function ocultarBarraTimer() {
      container.style.display = 'none';
      var bar = document.getElementById('fm-timer-bar');
      if (bar) { bar.style.width = '100%'; bar.classList.remove('urgente'); }
      var num = document.getElementById('fm-timer-num');
      if (num) num.textContent = '15';
    }

    function actualizarBarraTimer() {
      var bar = document.getElementById('fm-timer-bar');
      var num = document.getElementById('fm-timer-num');
      if (!bar || !num) return;
      var pct = (segundosRestantes / 15) * 100;
      bar.style.width = pct + '%';
      num.textContent = segundosRestantes;
      if (segundosRestantes <= 3) {
        bar.style.background = '#e63946';
        bar.classList.add('urgente');
      } else if (segundosRestantes <= 7) {
        bar.style.background = '#f4a261';
        bar.classList.remove('urgente');
      } else {
        bar.style.background = '#2ecc71';
        bar.classList.remove('urgente');
      }
    }

    function iniciarTimer() {
      if (timerActivo) return;
      timerActivo = true;
      segundosRestantes = 15;
      actualizarBarraTimer();
      mostrarBarraTimer();
      timerInterval = setInterval(function () {
        segundosRestantes--;
        actualizarBarraTimer();
        if (segundosRestantes <= 3) tickSonido();
        if (segundosRestantes <= 0) {
          detenerTimer();
          accionAutomatica();
        }
      }, 1000);
    }

    function detenerTimer() {
      timerActivo = false;
      clearInterval(timerInterval);
      timerInterval = null;
      ocultarBarraTimer();
    }

    function accionAutomatica() {
      // Prioridad 1: primera carta jugable
      var carta = document.querySelector('#player-hand .card.can-play');
      if (carta) { carta.click(); return; }
      // Prioridad 2: botón disponible sin MAZO
      var botones = Array.prototype.slice.call(
        document.querySelectorAll('#acciones .btn:not(:disabled), #acciones button:not(:disabled)')
      );
      var noMazo = botones.filter(function (b) {
        return !(b.textContent || '').toUpperCase().includes('MAZO');
      });
      var btn = noMazo[0] || botones[0];
      if (btn) btn.click();
    }

    var observer = new MutationObserver(function () {
      if (!modoCR) return;
      var s = getS();
      if (!s || s.turnoActual !== 'jugador' || s.cantoPendiente || s.juegoTerminado) {
        if (timerActivo) detenerTimer();
        return;
      }
      var cartasJugables = document.querySelectorAll('#player-hand .card.can-play');
      var botonesAccion  = document.querySelectorAll('#acciones .btn:not(:disabled), #acciones button:not(:disabled)');
      if (cartasJugables.length > 0 || botonesAccion.length > 0) {
        if (!timerActivo) iniciarTimer();
      } else {
        if (timerActivo) detenerTimer();
      }
    });

    function iniciarObserver() {
      var zona = document.getElementById('mesa') || document.body;
      observer.observe(zona, {
        childList: true, subtree: true,
        attributes: true, attributeFilter: ['class', 'disabled']
      });
    }
    iniciarObserver();

    if (typeof onJuego === 'function') {
      onJuego('render', function () {
        var s = getS();
        if (!modoCR) return;
        if (!s || s.turnoActual !== 'jugador' || s.cantoPendiente || s.juegoTerminado) {
          if (timerActivo) detenerTimer();
        }
      });
      onJuego('nuevoPartido', function () { detenerTimer(); });
    }

    function actualizarBtnCR() {
      var btn = document.getElementById('fm-btn-cr');
      if (!btn) return;
      btn.classList.toggle('activo', modoCR);
      btn.innerHTML = modoCR
        ? '&#x23F1;&#xFE0F; CONTRARRELOJ <span class="fm-badge on">ON</span>'
        : '&#x23F1;&#xFE0F; CONTRARRELOJ <span class="fm-badge off">OFF</span>';
    }

    window.toggleContrarreloj = function () {
      modoCR = !modoCR;
      localStorage.setItem('tg_contrarreloj', modoCR ? '1' : '0');
      actualizarBtnCR();
      if (!modoCR) detenerTimer();
      mostrarToast(modoCR ? '⏱️ Contrarreloj activado' : '⏱️ Contrarreloj desactivado', modoCR ? 'verde' : 'neutro');
    };

    setTimeout(actualizarBtnCR, 300);
  }

  // ─────────────────────────────────────────────────────────────
  // FEATURE 2: SISTEMA DE APUESTAS PT
  // ─────────────────────────────────────────────────────────────

  function setupApuestas() {
    var apuestaActual = 0;
    var modalInyectado = false;

    function inyectarModal() {
      if (modalInyectado || document.getElementById('fm-apuesta-modal')) return;
      modalInyectado = true;
      var modal = document.createElement('div');
      modal.id = 'fm-apuesta-modal';
      modal.className = 'fm-modal-overlay';
      modal.innerHTML =
        '<div class="fm-modal-card fm-apuesta-card">' +
          '<button class="fm-modal-close" id="fm-apuesta-close">&#x2715;</button>' +
          '<div class="fm-apuesta-icon">&#x1F4B0;</div>' +
          '<h2 class="fm-apuesta-titulo">APOST&#xC1; EN ESTA PARTIDA</h2>' +
          '<p class="fm-apuesta-saldo">Saldo: <strong id="fm-apuesta-saldo-num">0</strong> PT</p>' +
          '<div class="fm-apuesta-opciones" id="fm-apuesta-opciones">' +
            '<button class="fm-apuesta-btn selected" data-monto="0">PASO<br><small>0 PT</small></button>' +
            '<button class="fm-apuesta-btn" data-monto="10">LIGHT<br><small>10 PT</small></button>' +
            '<button class="fm-apuesta-btn" data-monto="25">NORMAL<br><small>25 PT</small></button>' +
            '<button class="fm-apuesta-btn" data-monto="50">FUERTE<br><small>50 PT</small></button>' +
            '<button class="fm-apuesta-btn" data-monto="100">TODO<br><small>100 PT</small></button>' +
          '</div>' +
          '<p class="fm-apuesta-info">Si gan&#xE1;s: <strong id="fm-apuesta-ganancia">0</strong> PT &middot; ' +
            'Si perd&#xE9;s: <strong id="fm-apuesta-perdida">0</strong> PT</p>' +
          '<button class="fm-apuesta-confirmar btn primary" id="fm-apuesta-confirmar">&#x26BD; APOSTAR Y JUGAR</button>' +
        '</div>';
      document.body.appendChild(modal);

      var btnOpciones = modal.querySelectorAll('.fm-apuesta-btn');
      Array.prototype.forEach.call(btnOpciones, function (btn) {
        btn.addEventListener('click', function () {
          Array.prototype.forEach.call(btnOpciones, function (b) { b.classList.remove('selected'); });
          btn.classList.add('selected');
          actualizarInfoApuesta(parseInt(btn.dataset.monto, 10));
        });
      });

      document.getElementById('fm-apuesta-close').addEventListener('click', cerrarModalApuesta);
      modal.addEventListener('click', function (e) { if (e.target === modal) cerrarModalApuesta(); });
      document.getElementById('fm-apuesta-confirmar').addEventListener('click', confirmarApuesta);
    }

    function actualizarInfoApuesta(monto) {
      var ganEl = document.getElementById('fm-apuesta-ganancia');
      var perEl = document.getElementById('fm-apuesta-perdida');
      if (ganEl) ganEl.textContent = monto * 2;
      if (perEl) perEl.textContent = monto;
      var saldo = window.getPesos ? window.getPesos() : 0;
      var modal = document.getElementById('fm-apuesta-modal');
      if (!modal) return;
      Array.prototype.forEach.call(modal.querySelectorAll('.fm-apuesta-btn'), function (btn) {
        var m = parseInt(btn.dataset.monto, 10);
        var sinSaldo = m > 0 && m > saldo;
        btn.disabled = sinSaldo;
        btn.classList.toggle('sin-saldo', sinSaldo);
      });
    }

    function abrirModalApuesta() {
      inyectarModal();
      var modal = document.getElementById('fm-apuesta-modal');
      if (!modal) return;
      var saldo = window.getPesos ? window.getPesos() : 0;
      var saldoEl = document.getElementById('fm-apuesta-saldo-num');
      if (saldoEl) saldoEl.textContent = saldo;
      Array.prototype.forEach.call(modal.querySelectorAll('.fm-apuesta-btn'), function (b) { b.classList.remove('selected'); });
      var paso = modal.querySelector('[data-monto="0"]');
      if (paso) paso.classList.add('selected');
      actualizarInfoApuesta(0);
      modal.classList.add('show');
    }

    function cerrarModalApuesta() {
      var modal = document.getElementById('fm-apuesta-modal');
      if (modal) modal.classList.remove('show');
      apuestaActual = 0;
      actualizarBannerApuesta();
    }

    function confirmarApuesta() {
      var modal = document.getElementById('fm-apuesta-modal');
      var sel = modal ? modal.querySelector('.fm-apuesta-btn.selected') : null;
      apuestaActual = sel ? parseInt(sel.dataset.monto, 10) : 0;
      if (modal) modal.classList.remove('show');
      actualizarBannerApuesta();
      if (apuestaActual > 0) mostrarToast('💰 Apostaste ' + apuestaActual + ' PT en esta partida', 'verde');
    }

    function inyectarBanner() {
      if (document.getElementById('fm-apuesta-banner')) return;
      var banner = document.createElement('div');
      banner.id = 'fm-apuesta-banner';
      banner.className = 'fm-apuesta-banner';
      var mesa = document.getElementById('mesa-central') || document.getElementById('mesa');
      if (mesa) mesa.prepend(banner);
    }

    function actualizarBannerApuesta() {
      inyectarBanner();
      var banner = document.getElementById('fm-apuesta-banner');
      if (!banner) return;
      if (apuestaActual > 0) {
        banner.textContent = '💰 Apostaste ' + fmtPT(apuestaActual);
        banner.style.display = 'block';
      } else {
        banner.style.display = 'none';
      }
    }

    // Hookear botón "NUEVA PARTIDA" que se inyecta dinámicamente en #acciones
    var obsAcciones = new MutationObserver(function () {
      var btns = document.querySelectorAll('[onclick="reiniciarPartida()"]');
      Array.prototype.forEach.call(btns, function (btn) {
        if (btn.dataset.fmHooked) return;
        btn.dataset.fmHooked = '1';
        btn.removeAttribute('onclick');
        btn.addEventListener('click', function () {
          abrirModalApuesta();
          // Al confirmar: ejecutar reiniciarPartida real
          var conf = document.getElementById('fm-apuesta-confirmar');
          if (conf) {
            conf.addEventListener('click', function ejecutar() {
              conf.removeEventListener('click', ejecutar);
              if (typeof reiniciarPartida === 'function') reiniciarPartida();
            });
          }
          // Si cierra sin apostar: igual arranca
          var close = document.getElementById('fm-apuesta-close');
          if (close) {
            close.addEventListener('click', function ejecutar() {
              close.removeEventListener('click', ejecutar);
              if (typeof reiniciarPartida === 'function') reiniciarPartida();
            });
          }
          var overlay = document.getElementById('fm-apuesta-modal');
          if (overlay) {
            overlay.addEventListener('click', function ejecutar(e) {
              if (e.target !== overlay) return;
              overlay.removeEventListener('click', ejecutar);
              if (typeof reiniciarPartida === 'function') reiniciarPartida();
            });
          }
        });
      });
    });
    var zonaAcc = document.getElementById('acciones') || document.body;
    obsAcciones.observe(zonaAcc, { childList: true, subtree: true });

    if (typeof onJuego === 'function') {
      onJuego('nuevoPartido', function () {
        apuestaActual = 0;
        actualizarBannerApuesta();
      });
      onJuego('finDePartido', function (data) {
        if (apuestaActual === 0) return;
        var gano = data && data.puntosJugador >= data.limite;
        if (gano) {
          var ganancia = apuestaActual * 2;
          if (window.addPesos) window.addPesos(ganancia, '¡Apuesta ganada! x2');
          mostrarToast('¡GANASTE la apuesta! +' + ganancia + ' PT 🎉', 'verde', 4000);
        } else {
          if (window.addPesos) window.addPesos(-apuestaActual, 'Apuesta perdida');
          mostrarToast('Perdiste la apuesta: -' + apuestaActual + ' PT 😤', 'rojo', 4000);
        }
        apuestaActual = 0;
        actualizarBannerApuesta();
      });
    }

    setTimeout(function () {
      inyectarModal();
      inyectarBanner();
    }, 800);

    window.abrirModalApuesta = abrirModalApuesta;
  }

  // ─────────────────────────────────────────────────────────────
  // FEATURE 3: MODO ENTRENAMIENTO
  // ─────────────────────────────────────────────────────────────

  function setupEntrenamiento() {
    var modoEntrenamiento = localStorage.getItem('tg_entrenamiento') === '1';

    function inyectarBannerEntrena() {
      if (document.getElementById('fm-entrena-banner')) return;
      var banner = document.createElement('div');
      banner.id = 'fm-entrena-banner';
      banner.className = 'fm-entrena-banner';
      banner.textContent = '🎓 MODO ENTRENAMIENTO · No cuenta para racha ni PT';
      var mesa = document.getElementById('mesa') || document.body;
      if (mesa.firstChild) mesa.insertBefore(banner, mesa.firstChild);
      else mesa.appendChild(banner);
    }

    // Convierte cartaId (ej: "1e", "7b", "12c") a texto legible
    function cartaLabel(cartaId) {
      var palos = { e: 'Esp', o: 'Oro', b: 'Bas', c: 'Cop' };
      var m = String(cartaId).match(/^(\d+)([eobcEOBC]?)$/);
      if (!m) return cartaId;
      var num = m[1];
      var palo = palos[(m[2] || '').toLowerCase()] || m[2];
      return num + ' ' + palo;
    }

    function mostrarCartasRival() {
      if (!modoEntrenamiento) return;
      var s = getS();
      if (!s || !s.manoRival) return;
      var rivalHand = document.getElementById('rival-hand');
      if (!rivalHand) return;

      var cardEls = rivalHand.querySelectorAll('.dorso, .dorso-trugol, [class*="dorso"]');

      s.manoRival.forEach(function (cartaId, i) {
        if (!cartaId) return; // carta ya jugada
        var el = cardEls[i];
        if (!el) return;
        if (el.dataset.fmRevelada === String(cartaId)) return; // ya revelada
        el.dataset.fmRevelada = String(cartaId);
        el.classList.add('fm-carta-rival-revelada');
        // Quitar label anterior si existe
        var prev = el.querySelector('.fm-carta-label');
        if (prev) prev.parentNode.removeChild(prev);
        var span = document.createElement('span');
        span.className = 'fm-carta-label';
        span.textContent = cartaLabel(cartaId);
        el.appendChild(span);
      });
    }

    function limpiarCartasRival() {
      var reveladas = document.querySelectorAll('.fm-carta-rival-revelada');
      Array.prototype.forEach.call(reveladas, function (el) {
        el.classList.remove('fm-carta-rival-revelada');
        var label = el.querySelector('.fm-carta-label');
        if (label) label.parentNode.removeChild(label);
        delete el.dataset.fmRevelada;
      });
    }

    var obsRival = new MutationObserver(function () {
      if (!modoEntrenamiento) return;
      setTimeout(mostrarCartasRival, 60);
    });

    function iniciarObserverRival() {
      var rivalHand = document.getElementById('rival-hand');
      if (rivalHand) obsRival.observe(rivalHand, { childList: true, subtree: true, attributes: true });
    }
    setTimeout(iniciarObserverRival, 700);

    if (typeof onJuego === 'function') {
      onJuego('render', function () {
        if (modoEntrenamiento) setTimeout(mostrarCartasRival, 80);
      });
    }

    // Bloquear economía mientras modo entrenamiento esté activo
    function bloquearEconomia() {
      if (window._addPesosOriginalModos) return; // ya bloqueado
      window._addPesosOriginalModos = window.addPesos || null;
      window.addPesos = function (cant, motivo) {
        mostrarToast('🎓 No cuenta en entrenamiento (' + (cant > 0 ? '+' : '') + cant + ' PT)', 'neutro');
      };
    }
    function restaurarEconomia() {
      if (window._addPesosOriginalModos) {
        window.addPesos = window._addPesosOriginalModos;
        window._addPesosOriginalModos = null;
      }
    }

    function actualizarBtnEntrena() {
      var btn = document.getElementById('fm-btn-entrena');
      if (!btn) return;
      btn.classList.toggle('activo', modoEntrenamiento);
      btn.innerHTML = modoEntrenamiento
        ? '&#x1F393; ENTRENAMIENTO <span class="fm-badge on">ON</span>'
        : '&#x1F393; ENTRENAMIENTO <span class="fm-badge off">OFF</span>';
    }

    window.toggleEntrenamiento = function () {
      modoEntrenamiento = !modoEntrenamiento;
      localStorage.setItem('tg_entrenamiento', modoEntrenamiento ? '1' : '0');
      actualizarBtnEntrena();
      var banner = document.getElementById('fm-entrena-banner');
      if (banner) banner.classList.toggle('show', modoEntrenamiento);
      if (modoEntrenamiento) {
        bloquearEconomia();
        mostrarCartasRival();
        mostrarToast('🎓 Entrenamiento ON — ves las cartas del rival', 'verde');
      } else {
        restaurarEconomia();
        limpiarCartasRival();
        mostrarToast('🎓 Entrenamiento OFF', 'neutro');
      }
    };

    setTimeout(function () {
      inyectarBannerEntrena();
      var banner = document.getElementById('fm-entrena-banner');
      if (banner) banner.classList.toggle('show', modoEntrenamiento);
      if (modoEntrenamiento) { bloquearEconomia(); mostrarCartasRival(); }
      actualizarBtnEntrena();
    }, 800);
  }

  // ─────────────────────────────────────────────────────────────
  // BOTONES EN MESA (panel flotante si no hay contenedor de menú)
  // ─────────────────────────────────────────────────────────────

  function inyectarBotonesMenu() {
    if (document.getElementById('fm-modos-panel')) return;

    var candidatos = ['#fm-opciones-extra', '#menu-opciones', '#side-menu', '.menu-botones', '#opciones-container'];
    var contenedor = null;
    for (var i = 0; i < candidatos.length; i++) {
      contenedor = document.querySelector(candidatos[i]);
      if (contenedor) break;
    }

    if (!contenedor) {
      // Panel flotante en la mesa
      var panel = document.createElement('div');
      panel.id = 'fm-modos-panel';
      panel.className = 'fm-modos-panel';
      panel.innerHTML =
        '<div class="fm-modos-lista">' +
          '<button class="fm-modo-btn" id="fm-btn-cr" onclick="window.toggleContrarreloj && window.toggleContrarreloj()">' +
            '&#x23F1;&#xFE0F; CONTRARRELOJ <span class="fm-badge off">OFF</span>' +
          '</button>' +
          '<button class="fm-modo-btn" id="fm-btn-tutorial" onclick="window.abrirTutorialInteractivo && window.abrirTutorialInteractivo()">' +
            '&#x1F393; C&Oacute;MO JUGAR' +
          '</button>' +
          '<button class="fm-modo-btn" id="fm-btn-apostar" onclick="window.abrirModalApuesta && window.abrirModalApuesta()">' +
            '&#x1F4B0; APOSTAR PT' +
          '</button>' +
        '</div>' +
        '<button class="fm-modos-toggle" id="fm-modos-toggle" aria-expanded="false" aria-label="Modos de juego">' +
          '&#x2699;&#xFE0F; MODOS' +
        '</button>';
      var mesa = document.getElementById('mesa') || document.body;
      mesa.appendChild(panel);
      // Colapsado por defecto: un solo botón chico; al tocarlo se agrandan los 3.
      var _tg = panel.querySelector('#fm-modos-toggle');
      _tg.addEventListener('click', function () {
        var abierto = panel.classList.toggle('abierto');
        _tg.setAttribute('aria-expanded', abierto ? 'true' : 'false');
        _tg.innerHTML = abierto ? '&#x2715; CERRAR' : '&#x2699;&#xFE0F; MODOS';
      });
      // Cerrar al elegir una opción (para que no quede tapando la mesa).
      panel.querySelector('.fm-modos-lista').addEventListener('click', function () {
        if (panel.classList.contains('abierto')) { _tg.click(); }
      });
    } else {
      var mkBtn = function (id, html, onclick) {
        var b = document.createElement('button');
        b.id = id;
        b.className = 'fm-modo-btn btn';
        b.innerHTML = html;
        b.setAttribute('onclick', onclick);
        contenedor.appendChild(b);
      };
      mkBtn('fm-btn-cr',     '&#x23F1;&#xFE0F; CONTRARRELOJ <span class="fm-badge off">OFF</span>', 'window.toggleContrarreloj && window.toggleContrarreloj()');
      mkBtn('fm-btn-tutorial','&#x1F393; C&Oacute;MO JUGAR',                                          'window.abrirTutorialInteractivo && window.abrirTutorialInteractivo()');
      mkBtn('fm-btn-apostar','&#x1F4B0; APOSTAR PT',                                                  'window.abrirModalApuesta && window.abrirModalApuesta()');
    }
  }

  // ─────────────────────────────────────────────────────────────
  // INIT
  // ─────────────────────────────────────────────────────────────

  // Placeholders hasta init
  window.toggleContrarreloj  = function () {};
  window.toggleEntrenamiento = function () {};
  window.abrirModalApuesta   = function () {};

  function init() {
    try { setupContrarreloj(); }   catch (e) { console.warn('[features_modos] contrarreloj:', e); }
    try { setupApuestas(); }       catch (e) { console.warn('[features_modos] apuestas:', e); }
    try { setupEntrenamiento(); }  catch (e) { console.warn('[features_modos] entrenamiento:', e); }
    try { inyectarBotonesMenu(); } catch (e) { console.warn('[features_modos] menu:', e); }
  }

  window.addEventListener('load', function () { setTimeout(init, 1200); });

})();
