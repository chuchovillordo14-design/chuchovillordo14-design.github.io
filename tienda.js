// ══════════════════════════════════════════════════════════════
// TIENDA.JS — Compra de FICHAS (Pesos Trucosos / PT)
//
// MODELO LEGAL: la plata ENTRA (comprás fichas), pero NO SALE. Las
// fichas son moneda virtual del juego, sin valor legal ni retiro a
// efectivo. Eso es lo único que separa esto de un casino ilegal:
// vender fichas es una compra in-app; recomprarlas en efectivo NO.
//
// Acredita sobre la economía PT existente (window.addPesos/getPesos,
// definidas en features_progression.js — key localStorage "tg_pesos").
//
// PAGOS: el checkout REAL de Mercado Pago vía backend (server/tienda.js
// con MP_ACCESS_TOKEN). Las PT se acreditan recién cuando el server
// confirma el pago contra la API de MP (poll a /tienda/estado).
// Si el backend no responde, la compra NO se inicia — sin fallback "a
// confianza": ese modo acreditaba packs sin verificar pago (bastaba
// bloquear la red al backend y tocar "Ya pagué" para regalarse PT).
//
// ⚠️ LÍMITE que queda: las PT viven en el localStorage del cliente. Esto
// verifica que HUBO un pago real antes de acreditar, pero un usuario que
// edite su localStorage se auto-acredita igual. Blindarlo requiere saldo
// del lado del servidor + cuentas de usuario (proyecto aparte).
// ══════════════════════════════════════════════════════════════

// Packs. `pt` = fichas totales entregadas (ya incluye el bonus).
// El bonus es solo la etiqueta de marketing (más pagás, más rinde).
const TIENDA_PACKS = [
  { emoji: "☕", nombre: "Cafecito", pt: 500,  precio: 500,  bonus: 0  },
  { emoji: "🍟", nombre: "Picada",   pt: 1200, precio: 1000, bonus: 20 },
  { emoji: "🥩", nombre: "Asado",    pt: 3000, precio: 2000, bonus: 50, destacado: "🔥 MÁS ELEGIDO" },
  { emoji: "🏆", nombre: "Mundial",  pt: 8000, precio: 4500, bonus: 78, destacado: "💎 MEJOR VALOR" },
];

// Índice del pack cuyo pago se inició (para habilitar el botón de confirmar).
let _tiendaPendiente = -1;
let _tiendaRef = null;          // external_reference de la compra en curso
let _tiendaModo = null;         // 'backend' (pago verificado) | null (sin compra en curso)
let _tiendaPollIv = null;       // intervalo de chequeo automático del pago
const _tiendaAcreditados = {};  // ref -> true, para no acreditar dos veces

// Base HTTP del servidor de pagos (deriva de la URL del relay: wss→https).
function _tiendaServerBase() {
  let u = (typeof netGetUrl === "function") ? netGetUrl() : "https://trucogol.onrender.com";
  return u.replace(/^wss:/i, "https:").replace(/^ws:/i, "http:").replace(/\/+$/, "");
}

function _tiendaCancelarPoll() { if (_tiendaPollIv) { clearInterval(_tiendaPollIv); _tiendaPollIv = null; } }

// Devuelve { pagado, pt } del server (el server dicta las PT según lo pagado).
async function _tiendaChequearPago(ref) {
  try {
    const r = await fetch(_tiendaServerBase() + "/tienda/estado?ref=" + encodeURIComponent(ref));
    const data = await r.json().catch(() => ({}));
    return { pagado: !!data.pagado, pt: data.pt, saldo: data.saldo };
  } catch (e) { return { pagado: false }; }
}

// Chequea el pago cada 4s hasta acreditar o rendirse (~2.5 min).
function _tiendaPollear(idx, ref) {
  _tiendaCancelarPoll();
  let intentos = 0;
  _tiendaPollIv = setInterval(async () => {
    intentos++;
    if (_tiendaRef !== ref || intentos > 40) { _tiendaCancelarPoll(); return; }
    const res = await _tiendaChequearPago(ref);
    if (res.pagado) { _tiendaCancelarPoll(); _tiendaAcreditar(idx, ref, res.pt, res.saldo); }
  }, 4000);
}

// Acredita las PT una sola vez por ref, con el `pt` que DICTA el server
// (según el monto realmente pagado).
function _tiendaAcreditar(idx, ref, ptServidor, saldoServidor) {
  if (ref && _tiendaAcreditados[ref]) return;
  const p = TIENDA_PACKS[idx];
  const pt = (typeof ptServidor === "number") ? ptServidor : (p ? p.pt : 0);
  if (!pt || pt <= 0) {
    if (typeof showToast === "function") showToast("No pudimos confirmar el monto pagado. Si pagaste, escribinos.", 3400);
    return;
  }
  if (ref) _tiendaAcreditados[ref] = true;
  if (typeof saldoServidor === "number" && typeof window.setPesosLocal === "function") {
    // El server YA acreditó la compra en el saldo server-side (blindado).
    // Adoptamos ese valor autoritativo; NO sumamos por cliente (doble crédito).
    window.setPesosLocal(saldoServidor);
  } else if (typeof window.addPesos === "function") {
    window.addPesos(pt, `Compra: ${p ? p.nombre : "fichas"}`);
  } else {
    const actual = parseInt(localStorage.getItem("tg_pesos") || "0", 10) || 0;
    try { localStorage.setItem("tg_pesos", actual + pt); } catch (_) {}
  }
  _tiendaPendiente = -1; _tiendaRef = null; _tiendaModo = null;
  _tiendaRender();
  if (typeof showToast === "function") {
    showToast(`✅ +${pt.toLocaleString("es-AR")} PT acreditadas. ¡A jugar!`, 2600);
  }
}

function tiendaAbrir() {
  _tiendaAsegurarModal();
  _tiendaRender();
  if (typeof openModal === "function") openModal("tienda-modal");
  else document.getElementById("tienda-modal")?.classList.add("show");
}

function _tiendaSaldo() {
  return (typeof window.getPesos === "function") ? window.getPesos() : 0;
}

function _tiendaRender() {
  const saldoEl = document.getElementById("tienda-saldo-num");
  if (saldoEl) saldoEl.textContent = _tiendaSaldo().toLocaleString("es-AR");

  const cont = document.getElementById("tienda-packs");
  if (!cont) return;
  cont.innerHTML = TIENDA_PACKS.map((p, i) => `
    <div class="tienda-pack ${p.destacado ? "destacado" : ""}">
      ${p.destacado ? `<span class="tp-badge">${p.destacado}</span>` : ""}
      <div class="tp-emoji">${p.emoji}</div>
      <div class="tp-info">
        <div class="tp-nombre">${p.nombre} ${p.bonus ? `<span class="tp-bonus">+${p.bonus}%</span>` : ""}</div>
        <div class="tp-pt">💰 ${p.pt.toLocaleString("es-AR")} PT</div>
      </div>
      <div class="tp-buy">
        <button class="btn primary tp-precio" onclick="tiendaComprar(${i})">$${p.precio.toLocaleString("es-AR")}</button>
        <button class="btn respond tp-confirmar" id="tp-conf-${i}"
                style="display:${_tiendaPendiente === i ? "block" : "none"};"
                onclick="tiendaConfirmar(${i})">🔄 Verificar pago</button>
      </div>
    </div>`).join("");
}

// Inicia el pago por el checkout real del backend. Si el backend no
// responde, la compra no arranca: nunca se acredita sin pago verificado.
async function tiendaComprar(idx) {
  const p = TIENDA_PACKS[idx];
  if (!p) return;
  _tiendaCancelarPoll();
  const ref = "tg_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  _tiendaPendiente = idx; _tiendaRef = ref; _tiendaModo = null;
  _tiendaRender();

  try {
    const r = await fetch(_tiendaServerBase() + "/tienda/crear-pago", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pack: idx, ref, token: (typeof getDeviceToken === "function") ? getDeviceToken() : undefined }),
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok || !data.init_point) throw new Error(data.error || "sin_backend");
    _tiendaModo = "backend";
    window.open(data.init_point, "_blank", "noopener");
    if (typeof showToast === "function") {
      showToast("💳 Se abrió Mercado Pago. Cuando pagues, volvé: se acredita solo.", 3600);
    }
    _tiendaPollear(idx, ref);
  } catch (e) {
    _tiendaPendiente = -1; _tiendaRef = null; _tiendaModo = null;
    if (typeof showToast === "function") {
      showToast("⚠️ La tienda no está disponible en este momento. Probá más tarde.", 3200);
    }
  }
  _tiendaRender();
}

// Botón de confirmar: VERIFICA el pago contra el servidor. Sin
// verificación no hay acreditación.
async function tiendaConfirmar(idx) {
  if (_tiendaPendiente !== idx || _tiendaModo !== "backend") {
    if (typeof showToast === "function") showToast("Primero tocá el precio para abrir Mercado Pago", 2200);
    return;
  }
  if (typeof showToast === "function") showToast("Verificando el pago con Mercado Pago…", 1800);
  const res = await _tiendaChequearPago(_tiendaRef);
  if (res.pagado) {
    _tiendaCancelarPoll();
    _tiendaAcreditar(idx, _tiendaRef, res.pt, res.saldo);
  } else if (typeof showToast === "function") {
    showToast("Todavía no nos llegó el pago. Esperá unos segundos y reintentá.", 2800);
  }
}

// ─────────────────────────────────────────────────────────────
// Inyección del modal + estilos (autocontenido, un solo <script>).
// ─────────────────────────────────────────────────────────────
function _tiendaAsegurarModal() {
  if (document.getElementById("tienda-modal")) return;
  const wrap = document.createElement("div");
  wrap.innerHTML = `
    <div class="modal" id="tienda-modal">
      <div class="modal-box" style="max-height:90vh;overflow-y:auto;">
        <h2>🛒 Tienda de Fichas</h2>
        <div class="tienda-saldo">Tu saldo: <b id="tienda-saldo-num">0</b> PT</div>
        <div id="tienda-packs"></div>
        <p class="tienda-legal">
          💡 Las fichas (PT) son virtuales, para jugar dentro de TrucoGOL.
          <b>No tienen valor legal ni se retiran a efectivo.</b>
        </p>
        <button class="btn primary" style="width:100%;margin-top:6px;" onclick="closeModal('tienda-modal')">CERRAR</button>
      </div>
    </div>`;
  document.body.appendChild(wrap.firstElementChild);
}

(function _tiendaCSS() {
  const s = document.createElement("style");
  s.textContent = `
    .tienda-saldo {
      text-align:center; font-family:var(--f-ui,'Oswald',sans-serif);
      font-size:13px; color:rgba(255,255,255,.7); margin-bottom:12px;
    }
    .tienda-saldo b { color:var(--gold,#f5c518); font-size:16px; }
    .tienda-pack {
      position:relative; display:flex; align-items:center; gap:12px;
      background:rgba(255,255,255,.04); border:1px solid rgba(255,255,255,.1);
      border-radius:12px; padding:12px 14px; margin-bottom:10px;
    }
    .tienda-pack.destacado {
      border-color:rgba(0,230,118,.5);
      box-shadow:0 0 20px rgba(0,230,118,.12);
      background:rgba(0,230,118,.05);
    }
    .tp-badge {
      position:absolute; top:-9px; left:12px;
      background:var(--neon,#00E676); color:#04120a;
      font-family:var(--f-ui,'Oswald',sans-serif); font-weight:700;
      font-size:9px; letter-spacing:1px; padding:2px 8px; border-radius:20px;
    }
    .tp-emoji { font-size:32px; line-height:1; }
    .tp-info { flex:1; }
    .tp-nombre {
      font-family:var(--f-display,'Bebas Neue',sans-serif);
      font-size:20px; letter-spacing:1px; color:#fff;
    }
    .tp-bonus {
      font-size:11px; color:var(--neon,#00E676); font-weight:700;
      background:rgba(0,230,118,.12); padding:1px 6px; border-radius:10px;
      vertical-align:middle; margin-left:4px;
    }
    .tp-pt { font-size:13px; color:var(--gold,#f5c518); font-weight:600; }
    .tp-buy { display:flex; flex-direction:column; gap:6px; min-width:96px; }
    .tp-precio { font-size:15px; padding:8px 10px; }
    .tp-confirmar { font-size:11px; padding:6px 8px; }
    .tienda-legal {
      font-size:10px; color:rgba(255,255,255,.45); line-height:1.5;
      text-align:center; margin:14px 4px 10px;
    }
  `;
  document.head.appendChild(s);
})();
