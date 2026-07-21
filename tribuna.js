/* ══════════════════════════════════════════════════════════
   TRIBUNAS CON HINCHADA — TRUCO GOL
   Dos franjas verticales a los costados de la mesa con una
   multitud dibujada en los colores de cada equipo:
   izquierda = tu equipo, derecha = el rival.
   Se ven en pantallas anchas (en los márgenes de la mesa, que
   mide máx 680px) y se ocultan solas en mobile donde no hay lugar.
   Puro decorado: pointer-events:none, detrás del juego.
   ══════════════════════════════════════════════════════════ */

/* Aclara (f>1) u oscurece (f<1) un color hex */
function _tribShade(hex, f) {
  const h = (hex || "#888888").replace("#", "");
  let r = parseInt(h.substr(0, 2), 16) || 136;
  let g = parseInt(h.substr(2, 2), 16) || 136;
  let b = parseInt(h.substr(4, 2), 16) || 136;
  const cl = (x) => Math.max(0, Math.min(255, Math.round(x * f)));
  return "#" + [cl(r), cl(g), cl(b)].map(x => x.toString(16).padStart(2, "0")).join("");
}

/* Tile de hinchada (multitud con cuerpos, pelo y camisetas) → data URI.
   Mayoría con la camiseta del equipo, algunas blancas/oscuras, bufandas
   en alto y una fila de fondo más chica/tenue para dar profundidad. */
function _tribCrowdURI(color) {
  const team = color, dark = _tribShade(color, 0.65), lite = _tribShade(color, 1.3);
  const shirts = [team, team, team, dark, lite, "#f2f2f2", "#2a2a2a", team];
  const skins  = ["#f0c39a", "#e8b48c", "#d89b6c", "#c98a5a", "#9c6a44", "#7a4a2c"];
  const hairs  = ["#1a1208", "#2a1d12", "#4a3420", "#0e0e0e", "#5a4326", "#6b6b6b"];
  const filas = [
    { y: 11, r: 3.0, op: 0.55, xs: [8, 24, 40, 56, 72] },
    { y: 26, r: 3.6, op: 0.8,  xs: [0, 16, 32, 48, 64, 80] },
    { y: 44, r: 4.0, op: 1,    xs: [8, 24, 40, 56, 72] },
    { y: 63, r: 4.3, op: 1,    xs: [0, 16, 32, 48, 64, 80] },
  ];
  let body = "", k = 0;
  filas.forEach(f => {
    f.xs.forEach(x => {
      const sh = shirts[k % shirts.length];
      const sk = skins[(k * 3 + 1) % skins.length];
      const ha = hairs[(k * 2) % hairs.length];
      const r = f.r, hy = f.y, sy = f.y + r + 1;
      body += `<g opacity="${f.op}">`;
      body += `<path d="M${x-r*1.7} ${sy+r*2.6} Q${x-r*1.5} ${sy} ${x} ${sy} Q${x+r*1.5} ${sy} ${x+r*1.7} ${sy+r*2.6} Z" fill="${sh}"/>`;
      if (k % 7 === 2) body += `<rect x="${x-r*1.3}" y="${hy-r*1.9}" width="${r*2.6}" height="${r*0.7}" rx="${r*0.3}" fill="${team}" opacity=".9"/>`;
      body += `<circle cx="${x}" cy="${hy}" r="${r}" fill="${sk}"/>`;
      body += `<path d="M${x-r} ${hy-r*0.15} Q${x-r} ${hy-r*1.25} ${x} ${hy-r*1.25} Q${x+r} ${hy-r*1.25} ${x+r} ${hy-r*0.15} Q${x+r*0.5} ${hy-r*0.6} ${x} ${hy-r*0.55} Q${x-r*0.5} ${hy-r*0.6} ${x-r} ${hy-r*0.15} Z" fill="${ha}"/>`;
      body += `</g>`; k++;
    });
  });
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="84" height="72" viewBox="0 0 84 72"><rect width="84" height="72" fill="#0a160d"/>${body}</svg>`;
  return "data:image/svg+xml," + encodeURIComponent(svg);
}

let _tribState = { left: null, right: null, gutter: -1, visible: null };

/* Inyecta una sola vez los keyframes de la ola y las banderas */
function _tribInyectarCSS() {
  if (document.getElementById("trib-css")) return;
  const s = document.createElement("style");
  s.id = "trib-css";
  s.textContent = `
    @keyframes tribOla { 0%{transform:translateY(115%)} 100%{transform:translateY(-35%)} }
    @keyframes tribBandera { 0%,100%{transform:rotate(-7deg) skewX(0)} 50%{transform:rotate(7deg) skewX(-10deg)} }
    @keyframes tribPapel { 0%{transform:translateY(-30px) rotate(0)} 100%{transform:translateY(105vh) rotate(620deg)} }
    @keyframes tribHumo  { 0%{transform:translateY(0) scale(.5);opacity:0} 25%{opacity:.45} 100%{transform:translateY(-180px) scale(1.7);opacity:0} }
    @keyframes tribBanderon { 0%,100%{transform:skewY(-1.2deg) scaleY(1)} 50%{transform:skewY(1.2deg) scaleY(1.04)} }
    .trib-ola {
      position:absolute; left:0; right:0; height:32%; pointer-events:none;
      background:linear-gradient(0deg, rgba(255,255,255,0) 0%, rgba(255,255,255,.16) 50%, rgba(255,255,255,0) 100%);
      animation:tribOla 5.5s linear infinite; will-change:transform;
    }
    .trib-bandera {
      position:absolute; width:16px; height:11px; border-radius:2px;
      transform-origin:left center; animation:tribBandera 1.8s ease-in-out infinite;
      box-shadow:0 1px 2px rgba(0,0,0,.45); pointer-events:none;
    }
    .trib-papel {
      position:absolute; width:5px; height:8px; border-radius:1px; top:0;
      opacity:.9; animation:tribPapel linear infinite; will-change:transform;
    }
    .trib-humo {
      position:absolute; bottom:6%; width:80px; height:80px; border-radius:50%;
      filter:blur(9px); animation:tribHumo 6.5s ease-in infinite; will-change:transform,opacity;
    }
    .trib-banderon {
      position:absolute; left:8%; right:8%; top:34%; height:64px; opacity:.20;
      border-radius:4px; transform-origin:center; animation:tribBanderon 4.2s ease-in-out infinite;
      box-shadow:0 6px 14px rgba(0,0,0,.4);
    }
    /* ── Reacciones de la hinchada a las jugadas ── */
    @keyframes tribPulse  { 0%{filter:brightness(1)} 18%{filter:brightness(1.7) saturate(1.3)} 100%{filter:brightness(1)} }
    @keyframes tribLament { 0%{filter:brightness(1)} 35%{filter:brightness(.42) grayscale(.55)} 100%{filter:brightness(1)} }
    @keyframes tribFlash  { 0%{opacity:0} 14%{opacity:.7} 100%{opacity:0} }
    @keyframes tribBurst  { 0%{transform:translateY(-20px) rotate(0);opacity:1} 100%{transform:translateY(105vh) rotate(680deg);opacity:.85} }
    .trib-festeja { animation:tribPulse  1.4s ease-out; }
    .trib-lamenta { animation:tribLament 1.7s ease-out; }
    .trib-flash {
      position:absolute; inset:0; pointer-events:none; opacity:0;
      background:radial-gradient(circle at 50% 38%, rgba(255,255,255,.95) 0%, rgba(255,255,255,0) 62%);
    }
    .trib-flash.go { animation:tribFlash 1.1s ease-out; }
    .trib-burst {
      position:absolute; width:6px; height:9px; border-radius:1px; top:0;
      animation:tribBurst linear forwards; will-change:transform,opacity; z-index:2;
    }
  `;
  document.head.appendChild(s);
}

function _tribCrear(id, lado) {
  let el = document.getElementById(id);
  if (el) return el;
  _tribInyectarCSS();
  el = document.createElement("div");
  el.id = id;
  el.style.cssText =
    "position:fixed;top:0;bottom:0;" + lado + ":0;z-index:0;pointer-events:none;" +
    "overflow:hidden;display:none;" +
    "box-shadow:inset 0 60px 80px -30px rgba(0,0,0,.7);";

  // Banderón grande de fondo (se colorea en _tribPintar)
  const banderon = document.createElement("div");
  banderon.className = "trib-banderon";
  if (lado === "right") banderon.style.animationDelay = "-2s";
  el.appendChild(banderon);

  // La ola (banda de luz que sube). En la tribuna derecha va desfasada.
  const ola = document.createElement("div");
  ola.className = "trib-ola";
  if (lado === "right") ola.style.animationDelay = "-2.7s";
  el.appendChild(ola);

  // Humo de bengala (2 columnas que suben y se disipan)
  ["28%", "66%"].forEach((left, i) => {
    const h = document.createElement("div");
    h.className = "trib-humo";
    h.style.left = left;
    h.style.animationDelay = (-2.5 * i - (lado === "right" ? 1.3 : 0)) + "s";
    el.appendChild(h);
  });

  // 3 banderitas que ondean
  ["18%", "48%", "76%"].forEach((left, i) => {
    const b = document.createElement("div");
    b.className = "trib-bandera";
    b.style.top = (4 + i % 2 * 3) + "%";
    b.style.left = left;
    b.style.animationDelay = (-0.4 * i) + "s";
    el.appendChild(b);
  });

  // Papelitos cayendo (confetti) — posición/velocidad variadas
  for (let i = 0; i < 9; i++) {
    const p = document.createElement("div");
    p.className = "trib-papel";
    p.style.left = Math.round(6 + Math.random() * 88) + "%";
    p.style.animationDuration = (5 + Math.random() * 5).toFixed(1) + "s";
    p.style.animationDelay = (-Math.random() * 8).toFixed(1) + "s";
    el.appendChild(p);
  }

  document.body.appendChild(el);
  return el;
}

function _tribPintar(el, color, haciaCancha) {
  const uri = _tribCrowdURI(color);
  // Degradé que oscurece hacia la cancha (borde interno) para dar profundidad
  const grad = haciaCancha === "right"
    ? "linear-gradient(90deg, rgba(0,0,0,0) 60%, rgba(0,0,0,.55) 100%)"
    : "linear-gradient(270deg, rgba(0,0,0,0) 60%, rgba(0,0,0,.55) 100%)";
  el.style.backgroundImage  = grad + ', url("' + uri + '")';
  el.style.backgroundRepeat = "no-repeat, repeat";
  el.style.backgroundSize   = "cover, 84px 72px";
  // Colorear los elementos animados con el color del equipo
  el.querySelectorAll(".trib-bandera").forEach(b => { b.style.background = color; });
  // Banderón: franja equipo / blanco / equipo (estilo bandera)
  const banderon = el.querySelector(".trib-banderon");
  if (banderon) banderon.style.background =
    `linear-gradient(180deg, ${color} 0 34%, #ffffff 34% 66%, ${color} 66%)`;
  // Humo tintado del color del equipo
  el.querySelectorAll(".trib-humo").forEach(h => {
    h.style.background = `radial-gradient(circle, ${_tribShade(color, 1.2)} 0%, rgba(0,0,0,0) 70%)`;
  });
  // Papelitos: alternan color del equipo y blanco
  el.querySelectorAll(".trib-papel").forEach((p, i) => {
    p.style.background = (i % 3 === 0) ? "#ffffff" : (i % 3 === 1 ? color : _tribShade(color, 1.25));
  });
}

function tribunaActualizar() {
  const mesa = document.getElementById("mesa");
  const enMesa = mesa && getComputedStyle(mesa).display !== "none";
  const gutter = Math.floor((window.innerWidth - 700) / 2);
  const visible = !!(enMesa && gutter >= 60);

  const izq = _tribCrear("tribuna-izq", "left");
  const der = _tribCrear("tribuna-der", "right");

  if (!visible) {
    if (_tribState.visible !== false) {
      izq.style.display = "none"; der.style.display = "none";
      _tribState.visible = false;
    }
    return;
  }

  // Colores de cada lado (fallback: celeste vs rojo)
  const colL = (typeof equipoSel  !== "undefined" && equipoSel  && equipoSel.color)  || "#6CA9E0";
  const colR = (typeof equipoRival !== "undefined" && equipoRival && equipoRival.color) || "#E0564F";

  if (_tribState.gutter !== gutter || _tribState.visible !== true) {
    izq.style.width = gutter + "px"; der.style.width = gutter + "px";
    izq.style.display = "block"; der.style.display = "block";
  }
  if (_tribState.left  !== colL) _tribPintar(izq, colL, "left");
  if (_tribState.right !== colR) _tribPintar(der, colR, "right");

  _tribState = { left: colL, right: colR, gutter, visible: true };
}

/* ══════════════════════════════════════════════════════════
   REACCIONES DE LA HINCHADA
   El motor (juego.js) emite 'golTribuna' con { lado, tipo } en
   los momentos clave: gana una ronda, el envido, la mano, o el
   rival se va al mazo. La hinchada del que ganó festeja (brillo +
   destello + lluvia de papelitos) y la del otro lado se lamenta.
   Solo visual: el sonido lo maneja el motor.
   ══════════════════════════════════════════════════════════ */
function _tribFestejar(el, tipo) {
  if (!el) return;
  el.classList.remove("trib-festeja"); void el.offsetWidth; el.classList.add("trib-festeja");

  let flash = el.querySelector(".trib-flash");
  if (!flash) { flash = document.createElement("div"); flash.className = "trib-flash"; el.appendChild(flash); }
  flash.classList.remove("go"); void flash.offsetWidth; flash.classList.add("go");

  // Lluvia de papelitos: más cantidad cuanto más grande el festejo.
  const cuanto = tipo === "mano" ? 22 : tipo === "envido" ? 14 : tipo === "mazo" ? 16 : 8;
  const color  = el.id === "tribuna-izq" ? _tribState.left : _tribState.right;
  for (let i = 0; i < cuanto; i++) {
    const p = document.createElement("div");
    p.className = "trib-burst";
    p.style.left = Math.round(Math.random() * 100) + "%";
    p.style.background = (i % 3 === 0) ? "#ffffff" : (color || "#ffd34d");
    p.style.animationDuration = (1.5 + Math.random() * 1.6).toFixed(2) + "s";
    p.style.animationDelay = (Math.random() * 0.3).toFixed(2) + "s";
    el.appendChild(p);
    setTimeout(() => p.remove(), 3400);
  }
}

function _tribLamentar(el) {
  if (!el) return;
  el.classList.remove("trib-lamenta"); void el.offsetWidth; el.classList.add("trib-lamenta");
}

function tribunaReaccion(lado, tipo) {
  if (_tribState.visible !== true) return; // no hay tribunas a la vista (mobile/angosto)
  const izq = document.getElementById("tribuna-izq");
  const der = document.getElementById("tribuna-der");
  if (!izq || !der) return;
  const festeja = lado === "jugador" ? izq : der;
  const lamenta = lado === "jugador" ? der : izq;
  _tribFestejar(festeja, tipo);
  // El otro lado se lamenta solo en los golpes grandes (mano o mazo).
  if (tipo === "mano" || tipo === "mazo") _tribLamentar(lamenta);
}

if (typeof onJuego === "function") {
  onJuego("golTribuna", (d) => { if (d) tribunaReaccion(d.lado, d.tipo); });
}

/* ── Enganches ── */
window.addEventListener("load",   () => setTimeout(tribunaActualizar, 500));
window.addEventListener("resize", tribunaActualizar);

// Resincronizar al renderizar el juego (capta el cambio de equipos al
// empezar/retomar una partida). Barato: solo repinta si cambió el color.
if (typeof onJuego === "function") {
  onJuego("render", tribunaActualizar);
}

// Mostrar/ocultar al cambiar de pantalla
if (typeof window.irA === "function") {
  const _irAtribPrev = window.irA;
  window.irA = function (destino) {
    _irAtribPrev.apply(this, arguments);
    setTimeout(tribunaActualizar, 40);
  };
}
