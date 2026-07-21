(function () {
  'use strict';

  // --- Registrar Service Worker ---
  function registrarSW() {
    if (!('serviceWorker' in navigator)) return;
    navigator.serviceWorker.register('/sw.js').then(reg => {
      console.log('[PWA] SW registrado:', reg.scope);
    }).catch(e => console.warn('[PWA] SW error:', e));
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
      if (outcome === 'accepted') btn.remove();
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
        new Notification('⚽ Truco GOL', {
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

    if (modo === 'desafio') {
      setTimeout(() => {
        if (typeof window.abrirDesafioDiario === 'function') {
          window.abrirDesafioDiario();
        } else {
          // Buscar botón de desafío como fallback
          const btn = document.querySelector('[data-modo="desafio"], #btn-desafio, .btn-desafio');
          if (btn) btn.click();
        }
      }, 1500);
    }

    if (modo === 'ia') {
      setTimeout(() => {
        if (typeof window.iniciarPartidaIA === 'function') {
          window.iniciarPartidaIA();
        } else {
          const btn = document.querySelector('[data-modo="ia"], #btn-jugar-ia, .btn-jugar-ia');
          if (btn) btn.click();
        }
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
