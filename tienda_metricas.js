// ══════════════════════════════════════════════════════════════
// TIENDA_METRICAS.JS — Embudo de conversión de la tienda (lado cliente)
//
// Manda un evento por cada paso: abrió la tienda → tocó un pack → se fue a
// Mercado Pago → volvió → se acreditó. El server (server/embudo.js) solo
// guarda CONTADORES por día; no viaja ni un dato personal.
//
// REGLA: una métrica NUNCA puede romper una compra. Todo va con
// fire-and-forget, con catch mudo, y sin await en el camino del pago.
// Si el server no está, el juego no se entera.
// ══════════════════════════════════════════════════════════════

// Cola chica con reintento: si el server está dormido (Render free tarda
// hasta un minuto en despertar), el primer evento se perdería justo en el
// momento más interesante — el de alguien abriendo la tienda.
const _TM_COLA = [];
let _tmEnviando = false;

function _tmBase() {
  if (typeof _tiendaServerBase === "function") return _tiendaServerBase();
  let u = (typeof netGetUrl === "function") ? netGetUrl() : "https://trucogol.onrender.com";
  return u.replace(/^wss:/i, "https:").replace(/^ws:/i, "http:").replace(/\/+$/, "");
}

async function _tmDrenar() {
  if (_tmEnviando || !_TM_COLA.length) return;
  _tmEnviando = true;
  try {
    while (_TM_COLA.length) {
      const ev = _TM_COLA[0];
      try {
        const r = await fetch(_tmBase() + "/tienda/evento", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(ev),
          keepalive: true, // sobrevive a que el usuario cambie de pestaña
        });
        if (!r.ok && r.status !== 429) throw new Error("http " + r.status);
        _TM_COLA.shift();
      } catch (e) {
        ev._intentos = (ev._intentos || 0) + 1;
        if (ev._intentos >= 3) { _TM_COLA.shift(); continue; } // se pierde, y está bien
        await new Promise((r) => setTimeout(r, 2000 * ev._intentos));
      }
    }
  } finally {
    _tmEnviando = false;
  }
}

// Único punto de entrada. No devuelve nada y no lanza nunca.
function tiendaEvento(paso, pack) {
  try {
    const ev = { paso };
    if (typeof pack === "number") ev.pack = pack;
    if (typeof getDeviceToken === "function") {
      // Token anónimo del dispositivo (el mismo que ya usa el saldo). Del
      // lado del server solo entra a un HyperLogLog para contar únicos:
      // no se guarda ni se puede recuperar quién es quién.
      try { ev.token = getDeviceToken(); } catch (e) {}
    }
    if (_TM_COLA.length < 20) _TM_COLA.push(ev);
    _tmDrenar().catch(() => {});
  } catch (e) { /* una métrica no rompe nada */ }
}

if (typeof window !== "undefined") window.tiendaEvento = tiendaEvento;
