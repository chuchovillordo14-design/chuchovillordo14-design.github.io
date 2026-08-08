// ══════════════════════════════════════════════════════════════
// FEATURES_STORAGE.JS — helpers de localStorage compartidos por los
// módulos features_*.js (progression, historia, ambiente, visual,
// contenido). Antes cada uno reimplementaba lsGet/lsPut/lsGetJSON/
// lsPutJSON por su cuenta (5 copias casi idénticas); viven acá una
// sola vez. Cargar ANTES que cualquier features_*.js que los use.
//
// Sin IIFE a propósito: son <script> clásicos que comparten el mismo
// scope léxico de nivel superior (como pasa con `C` de cartas.js), así
// que estas funciones quedan visibles para el resto sin colgarlas de
// window.
// ══════════════════════════════════════════════════════════════

function lsGet(k, def) {
  try { var v = localStorage.getItem(k); return v !== null ? v : def; } catch (e) { return def; }
}
function lsPut(k, v) {
  try { localStorage.setItem(k, typeof v === 'string' ? v : JSON.stringify(v)); } catch (e) {}
}
function lsGetJSON(k, def) {
  try { var raw = localStorage.getItem(k); return raw ? JSON.parse(raw) : def; } catch (e) { return def; }
}
function lsPutJSON(k, v) {
  lsPut(k, JSON.stringify(v));
}

// Formato estándar de "N PT" en toda la UI (antes escrito suelto en
// 5 archivos distintos: 'N + " PT"'). Cambiar el símbolo/formato de la
// moneda del juego ahora es un solo lugar.
function fmtPT(n) {
  return n + ' PT';
}

// ══════════════════════════════════════════════════════════════
// RESPALDO DE PROGRESO (8 ago 2026)
// TODO el juego vive en localStorage: liga de 21 fechas, club de la
// Carrera, álbum de 56 figuritas, PT, ranking... Un "borrar datos de
// navegación" y el jugador pierde semanas (hallazgo del análisis
// externo: era el "mínimo urgente"). Esto genera un código de respaldo
// (JSON de TODO el localStorage → base64 con encabezado versionado)
// para guardarlo donde sea y restaurarlo en cualquier dispositivo.
// ══════════════════════════════════════════════════════════════

var RESPALDO_MAGIA = 'TRUCOGOL1'; // versión del formato, por si algún día cambia

function progresoExportar() {
  try {
    var todo = {};
    for (var i = 0; i < localStorage.length; i++) {
      var k = localStorage.key(i);
      todo[k] = localStorage.getItem(k);
    }
    var json = JSON.stringify({ v: RESPALDO_MAGIA, fecha: new Date().toISOString(), datos: todo });
    // btoa no banca UTF-8 crudo (nombres con acentos): puente clásico.
    var code = btoa(unescape(encodeURIComponent(json)));
    var ta = document.getElementById('opt-respaldo-ta');
    if (ta) { ta.value = code; ta.style.display = 'block'; ta.select(); }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(code).then(function () {
        if (typeof showToast === 'function') showToast('📋 Código de respaldo copiado. Guardalo en un chat o una nota.', 3600);
      }, function () {
        if (typeof showToast === 'function') showToast('Copialo a mano desde el recuadro.', 3000);
      });
    } else if (typeof showToast === 'function') {
      showToast('Copialo a mano desde el recuadro.', 3000);
    }
  } catch (e) {
    console.error('respaldo: exportar', e);
    if (typeof showToast === 'function') showToast('No se pudo generar el respaldo.', 2600);
  }
}

function progresoImportar() {
  try {
    var ta = document.getElementById('opt-respaldo-ta');
    if (ta && ta.style.display === 'none') { ta.style.display = 'block'; ta.value = ''; ta.focus();
      if (typeof showToast === 'function') showToast('Pegá tu código de respaldo en el recuadro y tocá RESTAURAR de nuevo.', 4200);
      return;
    }
    var code = (ta && ta.value || '').trim();
    if (!code) { if (typeof showToast === 'function') showToast('El recuadro está vacío: pegá el código primero.', 3000); return; }
    var json;
    try { json = JSON.parse(decodeURIComponent(escape(atob(code)))); }
    catch (e2) { if (typeof showToast === 'function') showToast('Ese código no es un respaldo válido.', 3000); return; }
    if (!json || json.v !== RESPALDO_MAGIA || typeof json.datos !== 'object' || json.datos === null) {
      if (typeof showToast === 'function') showToast('Ese código no es un respaldo válido.', 3000); return;
    }
    var n = Object.keys(json.datos).length;
    if (!window.confirm('Restaurar el respaldo del ' + String(json.fecha || '').slice(0, 10) +
        ' (' + n + ' datos)?\n\nPISA todo el progreso de este dispositivo y recarga el juego.')) return;
    localStorage.clear();
    Object.keys(json.datos).forEach(function (k) {
      try { localStorage.setItem(k, json.datos[k]); } catch (e3) {}
    });
    location.reload();
  } catch (e) {
    console.error('respaldo: importar', e);
    if (typeof showToast === 'function') showToast('No se pudo restaurar el respaldo.', 2600);
  }
}
