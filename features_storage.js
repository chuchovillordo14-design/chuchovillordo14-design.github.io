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
