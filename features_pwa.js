(function () {
  'use strict';

  // --- Registrar Service Worker ---
  function registrarSW() {
    if (!('serviceWorker' in navigator)) return;

    // Aviso de versión nueva. El sw.js hace skipWaiting + clients.claim,
    // así que cuando llega un deploy el SW nuevo toma el control de esta
    // pestaña EN CALIENTE: la página queda corriendo código viejo sobre
    // caches nuevos. Hasta hoy eso se "resolvía" con la doble recarga a
    // ciegas — el usuario no tenía forma de saber que había versión nueva
    // (cada "no se ve" de esta semana fue esto). controllerchange es
    // exactamente ese momento; un banner y listo.
    let teniaControl = !!navigator.serviceWorker.controller;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      // La primera instalación también dispara controllerchange: ahí la
      // página ya vino de la red, no hay nada que avisar.
      if (!teniaControl) { teniaControl = true; return; }
      mostrarBannerVersionNueva();
    });

    navigator.serviceWorker.register('/sw.js').then(reg => {
      console.log('[PWA] SW registrado:', reg.scope);

      // El banner de arriba escucha controllerchange, que solo ocurre si el
      // navegador YA descargó un sw.js nuevo — y eso lo chequea solo en una
      // navegación o cada 24h. Una pestaña que queda abierta (o una PWA
      // instalada, que nunca "navega") podía pasar días con la versión vieja
      // sin que el banner apareciera nunca: el mecanismo estaba, faltaba el
      // disparador. Con el ritmo de deploys de estos días (v117→v125 en dos
      // jornadas) era la causa #1 de "no se ve el cambio".
      const buscarVersionNueva = () => { reg.update().catch(() => {}); };
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') buscarVersionNueva();
      });
      // Respaldo para la pestaña que queda visible horas sin tocarse.
      setInterval(buscarVersionNueva, 30 * 60 * 1000);
    }).catch(e => console.warn('[PWA] SW error:', e));
  }

  function mostrarBannerVersionNueva() {
    if (document.getElementById('pwa-update-banner')) return;
    const b = document.createElement('button');
    b.id = 'pwa-update-banner';
    b.textContent = '🔄 Hay una versión nueva — tocá para actualizar';
    // Arriba y no abajo: abajo viven la barra de acciones y la mano.
    b.style.cssText =
      'position:fixed;top:0;left:0;right:0;z-index:99999;' +
      'padding:11px 16px;border:none;cursor:pointer;' +
      'background:linear-gradient(180deg,#1c2f16,#0f1c0c);color:#cdf5b4;' +
      'font:700 13px/1.2 Oswald,sans-serif;letter-spacing:.5px;' +
      'border-bottom:1px solid rgba(122,201,67,.6);' +
      'box-shadow:0 4px 18px rgba(0,0,0,.6);';
    b.onclick = () => location.reload();
    document.body.appendChild(b);
  }

  // --- Botón de instalación (A2HS) ---
  let installPrompt = null;

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    installPrompt = e;
    mostrarBotonInstalar();
  });

  function mostrarBotonInstalar() {
    if (document.getElementById('ext-install-btn')) return;
    const btn = document.createElement('button');
    btn.id = 'ext-install-btn';
    btn.className = 'btn ext-install-btn';
    btn.innerHTML = '📲 Instalar App';
    btn.title = 'Instalar Truco GOL en tu dispositivo';
    btn.onclick = async () => {
      if (!installPrompt) return;
      installPrompt.prompt();
      const { outcome } = await installPrompt.userChoice;
      // El evento capturado solo se puede usar UNA vez (lo acepten o no), y
      // beforeinstallprompt no vuelve a disparar en la misma sesión en la
      // mayoría de navegadores: dejar el botón visible pero muerto tras un
      // rechazo era peor que sacarlo — clickearlo no hacía nada.
      btn.remove();
      installPrompt = null;
    };
    // Intentar footer del menú, si no existe usar body
    const footer = document.querySelector('.mm-footer') || document.querySelector('.menu-footer');
    if (footer) {
      footer.appendChild(btn);
    } else {
      // Botón flotante como fallback
      btn.style.cssText = 'position:fixed;bottom:80px;right:16px;z-index:9999;padding:10px 16px;border-radius:24px;font-size:14px;box-shadow:0 4px 16px rgba(0,0,0,.5);';
      document.body.appendChild(btn);
    }
  }

  // --- Notificaciones locales para el desafío diario ---
  function setupNotificaciones() {
    if (!('Notification' in window)) return;

    // Sin esto, el recordatorio solo se reprogramaba la primera vez (al
    // togglear el switch) y en las llamadas encadenadas de programarNotificacion
    // — si esa MISMA pestaña seguía abierta a las 20:00. Como el setTimeout no
    // sobrevive a cerrar la pestaña ni a que el teléfono se bloquee, en la
    // práctica solo sonaba en la sesión en la que lo activaste. Re-armarlo acá,
    // en cada carga, hace que vuelva a valer mientras el jugador abra la app
    // alguna vez antes de las 20:00 — sigue sin ser una notificación real (eso
    // pide Push API + servidor), pero deja de depender de una sola pestaña.
    if (Notification.permission === 'granted' && localStorage.getItem('tg_notif') === '1') {
      programarNotificacion();
    }

    // Esperar a que el modal de ajustes esté en el DOM
    const TIMEOUT_MS = 800;
    setTimeout(() => {
      const settingsModal =
        document.getElementById('settings-modal') ||
        document.getElementById('modal-ajustes') ||
        document.querySelector('[id*="setting"]');
      if (!settingsModal) return;

      const modalBox = settingsModal.querySelector('.modal-box') || settingsModal;
      const row = document.createElement('div');
      row.className = 'setting-row';
      row.id = 'setting-row-notif';
      row.innerHTML = `
        <div>
          <div class="setting-lbl">🔔 Notificación Desafío Diario</div>
          <div class="setting-sub">Recordatorio diario a las 20:00 para el desafío</div>
        </div>
        <div class="toggle${Notification.permission === 'granted' && localStorage.getItem('tg_notif') === '1' ? ' on' : ''}" id="toggle-notif"></div>
      `;
      row.querySelector('#toggle-notif').onclick = async function () {
        if (Notification.permission === 'granted') {
          this.classList.toggle('on');
          localStorage.setItem('tg_notif', this.classList.contains('on') ? '1' : '0');
          if (this.classList.contains('on')) programarNotificacion();
        } else {
          const perm = await Notification.requestPermission();
          if (perm === 'granted') {
            this.classList.add('on');
            localStorage.setItem('tg_notif', '1');
            programarNotificacion();
          }
        }
      };
      modalBox.insertBefore(row, modalBox.firstChild);
    }, TIMEOUT_MS);
  }

  function programarNotificacion() {
    const ahora = new Date();
    const objetivo = new Date();
    objetivo.setHours(20, 0, 0, 0);
    if (objetivo <= ahora) objetivo.setDate(objetivo.getDate() + 1);
    const ms = objetivo - ahora;

    setTimeout(() => {
      if (
        Notification.permission === 'granted' &&
        localStorage.getItem('tg_notif') === '1'
      ) {
        mostrarNotificacion('⚽ Truco GOL', {
          body: '¡El Desafío Diario te espera! ¿Podés ganarlo hoy?',
          icon: '/portada.png',
          badge: '/portada.png',
          tag: 'desafio-diario',
          requireInteraction: false,
        });
        // Re-programar para mañana
        programarNotificacion();
      }
    }, ms);
  }

  // En Chrome/Android con SW activo, `new Notification()` tira
  // "Illegal constructor": la única vía es registration.showNotification()
  // (y es la que hace funcionar el notificationclick del sw.js).
  function mostrarNotificacion(titulo, opts) {
    if (navigator.serviceWorker && navigator.serviceWorker.getRegistration) {
      navigator.serviceWorker.getRegistration().then(reg => {
        if (reg) return reg.showNotification(titulo, opts);
        new Notification(titulo, opts);
      }).catch(() => {
        try { new Notification(titulo, opts); } catch (e) {}
      });
    } else {
      try { new Notification(titulo, opts); } catch (e) {}
    }
  }

  // --- Detectar modo standalone (ya instalada) ---
  function detectarModoStandalone() {
    const esStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true;
    if (esStandalone) {
      document.body.classList.add('pwa-standalone');
      const btn = document.getElementById('ext-install-btn');
      if (btn) btn.remove();
      console.log('[PWA] Corriendo en modo standalone');
    }
  }

  // --- Manejar parámetros URL (shortcuts de PWA) ---
  function handleURLParams() {
    const params = new URLSearchParams(window.location.search);
    const modo = params.get('modo');
    if (!modo) return;

    // Sacar ?modo= de la URL ya mismo: sin esto, cada F5 de la sesión
    // lanzada por el shortcut volvía a disparar jugarYa() a los 1.5s.
    try {
      params.delete('modo');
      const qs = params.toString();
      history.replaceState(null, '', location.pathname + (qs ? '?' + qs : '') + location.hash);
    } catch (e) {}

    // OJO: estos nombres tienen que existir de verdad. La primera versión
    // apuntaba a abrirDesafioDiario/iniciarPartidaIA y a tres selectores por
    // shortcut, y NINGUNO existía: los dos accesos directos del manifest no
    // hacían absolutamente nada desde que se crearon.
    if (modo === 'desafio') {
      // La tarjeta del desafío se inyecta al menú en load+700ms; damos margen.
      setTimeout(() => {
        if (typeof window.fgJugarDesafio === 'function') window.fgJugarDesafio();
        else if (typeof window.jugarYa === 'function') window.jugarYa();
      }, 1500);
    }

    if (modo === 'ia') {
      setTimeout(() => {
        if (typeof window.jugarYa === 'function') window.jugarYa();
      }, 1500);
    }
  }

  // --- Init ---
  function init() {
    registrarSW();
    detectarModoStandalone();
    handleURLParams();
    setupNotificaciones();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    setTimeout(init, 100);
  }
})();
