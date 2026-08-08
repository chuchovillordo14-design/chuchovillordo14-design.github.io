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
    // true entre "confirmé la apuesta" y el 'nuevoPartido' que la estrena
    // (ver confirmarApuesta): evita que ese mismo evento la cobre como
    // abandonada.
    var apuestaParaLaProxima = false;
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
          '<div class="fm-apuesta-icon">&#x1F3AF;</div>' +
          '<h2 class="fm-apuesta-titulo">DESAF&#xCD;O PT: &#xBF;CU&#xC1;NTO TE JUG&#xC1;S?</h2>' +
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
          '<button class="fm-apuesta-confirmar btn primary" id="fm-apuesta-confirmar">&#x26BD; ACEPTAR EL DESAF&#xCD;O</button>' +
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
      // Simétrico: se gana lo mismo que se arriesga. El texto decía "x2"
      // porque el pago estaba roto (ver el handler de finDePartido).
      if (ganEl) ganEl.textContent = monto ? '+' + monto : '0';
      if (perEl) perEl.textContent = monto ? '-' + monto : '0';
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

    // El botón flotante "🎯 DESAFÍO PT" está visible DURANTE todo el
    // partido, no solo antes de arrancar. Sin este freno: ibas 29-3, casi
    // ganado, abrías el panel, apostabas el máximo y cobrabas el doble
    // segundos después — una apuesta con el resultado prácticamente
    // decidido no es una apuesta. Solo se puede apostar con el marcador en
    // 0-0 (sin scoring todavía), igual que el flujo de "apostar antes de
    // arrancar" desde NUEVA PARTIDA.
    function _partidoAunSinDecidir() {
      if (typeof S === 'undefined' || !S) return true; // sin partido en curso: se deja abrir (arranca en 0-0)
      return (S.puntosJugador || 0) === 0 && (S.puntosRival || 0) === 0;
    }

    // `paraProximaPartida`: true cuando se abre desde el hook de NUEVA
    // PARTIDA (features_modos.js más abajo) — ahí el marcador ES el de la
    // partida VIEJA (todavía no corrió reiniciarPartida()), así que el
    // freno de "0-0" no aplica: se está apostando para la que arranca.
    // Recordado para que confirmarApuesta() sepa qué chequeo aplicar (no
    // puede recibir el parámetro directo: la llama un listener del botón
    // CONFIRMAR sin argumentos).
    var _abriendoParaProxima = false;

    function abrirModalApuesta(paraProximaPartida) {
      if (!paraProximaPartida && !_partidoAunSinDecidir()) {
        if (typeof mostrarToast === 'function') {
          mostrarToast('Solo podés apostar antes de que arranque el marcador (0-0)', 'rojo', 3200);
        }
        return;
      }
      _abriendoParaProxima = !!paraProximaPartida;
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
      apuestaParaLaProxima = false;
      actualizarBannerApuesta();
    }

    function confirmarApuesta() {
      // Defensa en profundidad: aunque el modal ya no debería poder abrirse
      // con el partido en curso, si de algún modo llegó a estar abierto
      // (por ejemplo, se abrió a las 0-0 y el usuario tardó en confirmar
      // mientras la partida avanzaba) no se acepta la apuesta.
      if (!_abriendoParaProxima && !_partidoAunSinDecidir()) {
        var modalCancel = document.getElementById('fm-apuesta-modal');
        if (modalCancel) modalCancel.classList.remove('show');
        if (typeof mostrarToast === 'function') {
          mostrarToast('El marcador ya arrancó: esa apuesta no se acepta', 'rojo', 3200);
        }
        return;
      }
      var modal = document.getElementById('fm-apuesta-modal');
      var sel = modal ? modal.querySelector('.fm-apuesta-btn.selected') : null;
      apuestaActual = sel ? parseInt(sel.dataset.monto, 10) : 0;
      // Esta apuesta es PARA la partida que está por arrancar: el propio
      // botón ACEPTAR llama después a reiniciarPartida(), que emite
      // 'nuevoPartido' sincrónicamente, y el handler la cobraba como
      // "abandonada" antes de repartir la primera mano — era imposible
      // ganar una apuesta hecha desde NUEVA PARTIDA.
      apuestaParaLaProxima = apuestaActual > 0;
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
          abrirModalApuesta(true); // true: es PARA la partida que arranca, no la actual
          // Los 3 disparadores (confirmar / cerrar con ✕ / click afuera)
          // apuntan al MISMO modal singleton, reusado en cada apertura
          // (incluida la del botón flotante DESAFÍO PT mid-partido). Antes
          // cada listener solo se desenganchaba A SÍ MISMO — así que tocar
          // NUEVA PARTIDA una vez dejaba los otros DOS colgados para
          // siempre, acumulándose en cada match. Meses después, cerrar el
          // panel de DESAFÍO PT con la ✕ (sin querer arrancar nada) podía
          // disparar un reiniciarPartida() añejo y BORRAR el marcador de
          // una partida en curso sin ninguna relación con NUEVA PARTIDA.
          // Ahora los 3 se dan de baja JUNTOS, dispare el que dispare.
          var conf    = document.getElementById('fm-apuesta-confirmar');
          var close   = document.getElementById('fm-apuesta-close');
          var overlay = document.getElementById('fm-apuesta-modal');
          function limpiar() {
            if (conf)    conf.removeEventListener('click', onConfirmar);
            if (close)   close.removeEventListener('click', onCerrar);
            if (overlay) overlay.removeEventListener('click', onOverlay);
          }
          function onConfirmar() { limpiar(); if (typeof reiniciarPartida === 'function') reiniciarPartida(); }
          function onCerrar()    { limpiar(); if (typeof reiniciarPartida === 'function') reiniciarPartida(); }
          function onOverlay(e)  { if (e.target !== overlay) return; limpiar(); if (typeof reiniciarPartida === 'function') reiniciarPartida(); }
          if (conf)    conf.addEventListener('click', onConfirmar);
          if (close)   close.addEventListener('click', onCerrar);
          if (overlay) overlay.addEventListener('click', onOverlay);
        });
      });
    });
    var zonaAcc = document.getElementById('acciones') || document.body;
    obsAcciones.observe(zonaAcc, { childList: true, subtree: true });

    if (typeof onJuego === 'function') {
      onJuego('nuevoPartido', function () {
        // Abandonar una apuesta perdida ya no es gratis: si habia una
        // apuesta viva y el partido no la liquido, se cobra al arrancar
        // la partida nueva (antes 'nuevoPartido' la borraba y listo).
        if (apuestaParaLaProxima) {
          // La apuesta es DE esta partida que arranca: se mantiene viva y
          // la liquida 'finDePartido'.
          apuestaParaLaProxima = false;
          actualizarBannerApuesta();
          return;
        }
        if (apuestaActual > 0) {
          if (window.addPesos) window.addPesos(-apuestaActual, 'Apuesta abandonada');
          mostrarToast('Abandonaste la apuesta: -' + apuestaActual + ' PT', 'rojo', 3500);
        }
        apuestaActual = 0;
        actualizarBannerApuesta();
      });
      onJuego('finDePartido', function (data) {
        if (apuestaActual === 0) return;
        var gano = data && data.puntosJugador >= data.limite;
        if (gano) {
          // +1x, NO +2x. Esta apuesta se cobra AL LIQUIDAR, no al confirmar
          // (por eso existe el camino de 'Apuesta abandonada' de arriba): el
          // monto nunca se descontó, así que pagar el doble al ganar contra
          // descontar el simple al perder daba +2x neto ganando y -1x
          // perdiendo — el punto de equilibrio quedaba en 33% de victorias
          // en vez de 50%, y con la apuesta máxima cada partido ganado eran
          // 200 PT gratis encima del premio normal. Auditoría 1 ago 2026.
          if (window.addPesos) window.addPesos(apuestaActual, 'Apuesta ganada');
          mostrarToast('¡GANASTE la apuesta! +' + apuestaActual + ' PT 🎉', 'verde', 4000);
        } else {
          if (window.addPesos) window.addPesos(-apuestaActual, 'Apuesta perdida');
          mostrarToast('Perdiste la apuesta: -' + apuestaActual + ' PT 😤', 'rojo', 4000);
        }
        apuestaActual = 0;
        apuestaParaLaProxima = false;
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
    // Espejo global: lo lee addPesos (features_progression.js) para no
    // acreditar mientras se ven las cartas del rival.
    window.modoEntrenamiento = modoEntrenamiento;

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

    // Bloquear GANANCIAS mientras modo entrenamiento esté activo. Solo las
    // ganancias: antes este stub tapaba window.addPesos ENTERO (positivo Y
    // negativo), así que cualquier GASTO real durante el entrenamiento
    // —firmar un sponsor, comprar algo con PT— también quedaba gratis: el
    // toast decía "no cuenta" y el saldo ni se tocaba. Los gastos van al
    // addPesos de verdad.
    function bloquearEconomia() {
      if (window._addPesosOriginalModos) return; // ya bloqueado
      window._addPesosOriginalModos = window.addPesos || null;
      window.addPesos = function (cant, motivo) {
        if (cant <= 0 && typeof window._addPesosOriginalModos === 'function') {
          return window._addPesosOriginalModos(cant, motivo);
        }
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
      // window.modoEntrenamiento es lo que miran TODOS los demás guardas
      // del proyecto (addPesos, XP en nivel.js, records en
      // features_contenido.js, misiones/logros en features_historia.js,
      // la Liga en liga.js, la racha en extras.js) — pero acá solo se
      // seteaba UNA vez al cargar la página (línea 457) y nunca se
      // volvía a tocar al togglear. Prender/apagar Entrenamiento a mitad
      // de sesión (sin recargar, el camino normal) dejaba TODOS esos
      // guardas mirando un valor viejo: con las cartas del rival a la
      // vista se seguía farmeando XP, récords, fechas de Liga y misiones.
      window.modoEntrenamiento = modoEntrenamiento;
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
            '&#x1F3AF; DESAF&Iacute;O PT' +
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
      mkBtn('fm-btn-apostar','&#x1F3AF; DESAF&Iacute;O PT',                                                  'window.abrirModalApuesta && window.abrirModalApuesta()');
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
