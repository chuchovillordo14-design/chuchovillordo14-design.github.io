/* ══════════════════════════════════════════════════════════
   NIVEL Y EXPERIENCIA (XP) — TRUCO GOL
   El jugador gana XP por los puntos que hace en cada partida y
   por ganar partidos. Al juntar la XP necesaria sube de nivel y
   se lleva 1 sobre de figuritas por nivel.
   No toca el motor: se engancha al bus de eventos de juego.js
   ('render', 'finDePartido', 'nuevoPartido').
   ══════════════════════════════════════════════════════════ */

const NIVEL_KEY = "truco_nivel";

/* XP necesaria para pasar del nivel n al n+1 (sube 40 por nivel). */
function nivelXpReq(n) { return 120 + (Math.max(1, n) - 1) * 40; }

function nivelCargar() {
  try {
    const d = JSON.parse(localStorage.getItem(NIVEL_KEY));
    if (d && typeof d.nivel === "number") return d;
  } catch (e) {}
  return { nivel: 1, xp: 0, xpTotal: 0 };
}

function nivelGuardar(d) {
  if (typeof lsSet === "function") lsSet(NIVEL_KEY, JSON.stringify(d));
  else { try { localStorage.setItem(NIVEL_KEY, JSON.stringify(d)); } catch (e) {} }
}

/* Suma XP y procesa los saltos de nivel (puede subir más de uno de una). */
function nivelAgregarXP(cant) {
  if (!(cant > 0)) return;
  const d = nivelCargar();
  d.xp      += cant;
  d.xpTotal  = (d.xpTotal || 0) + cant;

  let niveles = 0;
  while (d.xp >= nivelXpReq(d.nivel)) {
    d.xp -= nivelXpReq(d.nivel);
    d.nivel++;
    niveles++;
    if (d.nivel > 999) { d.xp = 0; break; } // tope de seguridad
  }
  nivelGuardar(d);
  nivelRenderChip();
  if (niveles > 0) _nivelFestejar(d.nivel, niveles);
}

function _nivelFestejar(nivel, niveles) {
  if (typeof showToast === "function") {
    showToast(`⭐ ¡SUBISTE A NIVEL ${nivel}!  +${niveles} sobre${niveles > 1 ? "s" : ""}`, 2800);
  }
  if (typeof playSound === "function") playSound("win");
  // Premio: 1 sobre de figuritas por cada nivel ganado
  if (typeof figusOtorgarSobres === "function") figusOtorgarSobres(niveles);
}

/* ── Chip de nivel en el menú principal ── */
function nivelRenderChip() {
  const menu = document.getElementById("main-menu");
  if (!menu) return;
  const d   = nivelCargar();
  const req = nivelXpReq(d.nivel);
  const pct = Math.max(0, Math.min(100, Math.round((d.xp / req) * 100)));

  let chip = document.getElementById("mm-nivel-chip");
  if (!chip) {
    chip = document.createElement("div");
    chip.id = "mm-nivel-chip";
    chip.style.cssText =
      "margin:0 auto 14px;max-width:320px;width:88%;padding:8px 14px;border-radius:12px;" +
      "background:rgba(0,0,0,.35);border:1px solid rgba(200,168,75,.45);" +
      "font-family:var(--f-ui,sans-serif);color:#fff;box-shadow:0 4px 14px rgba(0,0,0,.35)";
    // Insertarlo arriba de la navegación del menú
    const nav = menu.querySelector(".mm-nav");
    if (nav && nav.parentElement) nav.parentElement.insertBefore(chip, nav);
    else menu.appendChild(chip);
  }
  chip.innerHTML =
    '<div style="display:flex;justify-content:space-between;align-items:center;font-size:12px;letter-spacing:1px">' +
      '<span style="color:#f5c518;font-weight:700">⭐ NIVEL ' + d.nivel + '</span>' +
      '<span style="opacity:.7;font-size:10px">' + d.xp + ' / ' + req + ' XP</span>' +
    '</div>' +
    '<div style="margin-top:6px;height:8px;border-radius:5px;background:rgba(255,255,255,.12);overflow:hidden">' +
      '<div style="height:100%;width:' + pct + '%;border-radius:5px;background:linear-gradient(90deg,#c89b3c,#ffe08a)"></div>' +
    '</div>';
}

/* ── Enganche al motor (bus de eventos de juego.js) ── */
let _nivelLastPts = null; // último puntaje del jugador visto (para el delta)

if (typeof onJuego === "function") {
  // XP por cada punto que suma el jugador (cubre mano, envido, truco, mazo)
  onJuego("render", () => {
    if (typeof S === "undefined") return;
    const p = S.puntosJugador;
    if (_nivelLastPts === null) { _nivelLastPts = p; return; }
    if (p > _nivelLastPts) nivelAgregarXP((p - _nivelLastPts) * 3);
    _nivelLastPts = p;
  });

  // Bono al cerrar el partido (siempre suma algo, gane o pierda)
  onJuego("finDePartido", ({ puntosJugador, limite }) => {
    nivelAgregarXP(puntosJugador >= limite ? 25 : 8);
  });

  // Nuevo partido: el puntaje arranca en 0, reseteamos el delta
  onJuego("nuevoPartido", () => { _nivelLastPts = 0; });
}

/* ── Mostrar el chip al llegar al menú ── */
window.addEventListener("load", () => setTimeout(nivelRenderChip, 450));
if (typeof window.irA === "function") {
  const _irAnivelPrev = window.irA;
  window.irA = function (destino) {
    _irAnivelPrev.apply(this, arguments);
    if (destino === "main-menu") setTimeout(nivelRenderChip, 40);
  };
}
