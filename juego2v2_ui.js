// ══════════════════════════════════════════════════════════════
// JUEGO2V2_UI.JS — Mesa jugable del 2v2 (Parte 1)
//
// UI autocontenida (inyecta su pantalla #mesa2v2 + CSS). Maneja el
// motor juego2v2.js: rendea las 4 manos, deja al humano (asiento 0)
// tirar carta, y corre los 3 bots con delay para que se vea.
//
// Cantos: por ahora salen como toast (los botones de canto = Parte 2).
// ══════════════════════════════════════════════════════════════

let _2v2_modo = null;      // 'juega' (tira/canta) | 'responde' (a un canto) | null
let _2v2_logIdx = 0;
let _2v2_corriendo = false;
let _2v2_centroPrev = 0;   // cuántas cartas del centro ya se renderizaron (para animar solo las nuevas)
let _2v2_miAsiento = 0;    // qué asiento soy YO en la pantalla (0 offline; 0..3 online)
let _2v2_online = null;    // null = offline. Online: { esHost, enviar(payload), continuar() }
let _2v2_senas = true;     // el compañero te muestra una seña de su mano (offline)
let _2v2_senaRecibida = null; // online: seña que me mandó mi compañero {emoji,texto}
let _2v2_senaTimer = null;    // timeout para borrar la seña recibida
let _2v2_senaCazada = null;   // online: seña de un RIVAL que cazaste {asiento,emoji,texto}
let _2v2_senaCazadaTimer = null;
// Probabilidad de que el rival CACE una seña que hacés (como en la mesa real:
// hacer señas tiene riesgo). El host (autoritativo) tira el dado.
const _2V2_PROB_CAZA = 0.3;

// Señas que un jugador le puede hacer a su compañero EN ONLINE (elegidas a
// mano, como en la vida real: podés decir la verdad o mentir). Solo las ve
// tu compañero, no el rival.
const _2V2_SENAS_ONLINE = [
  { emoji: "🤨", texto: "As de espada" },
  { emoji: "😬", texto: "As de basto" },
  { emoji: "😉", texto: "7 de espada" },
  { emoji: "👄", texto: "7 de oro" },
  { emoji: "😗", texto: "Tengo un 3" },
  { emoji: "🤏", texto: "Tengo un 2" },
  { emoji: "🌸", texto: "¡Tengo flor!" },
  { emoji: "✌️", texto: "Buen envido" },
  { emoji: "🎺", texto: "Cantá truco" },
  { emoji: "🛑", texto: "No quieras" },
  { emoji: "🫤", texto: "Mano floja" },
  { emoji: "👍", texto: "Dale, quiero" },
];

// Seña que hace tu COMPAÑERO sobre su mano (su mejor carta / activo). Le da
// info al humano para cantar/jugar mejor, como las señas de verdad (pero sin
// riesgo de que las cace el rival). Devuelve {emoji, texto} o null.
const _2V2_SENAS_CARTA = {
  "1_e": { emoji: "🤨", texto: "As de espada" },
  "1_b": { emoji: "😬", texto: "As de basto" },
  "7_e": { emoji: "😉", texto: "Siete de espada" },
  "7_o": { emoji: "☝️", texto: "Siete de oro" },
};
function _2v2SenaDe(asiento) {
  const j = S2.jugadores[asiento];
  const mano = (j && j.mano || []).filter(Boolean);
  if (!mano.length || typeof C === "undefined") return null;
  // Flor (3 del mismo palo)
  const palos = {};
  mano.forEach(id => { const p = C[id] && C[id].p; if (p) palos[p] = (palos[p] || 0) + 1; });
  if (Object.values(palos).some(n => n >= 3)) return { emoji: "🌸", texto: "¡Tiene FLOR!" };
  // Carta más fuerte
  let top = mano[0];
  mano.forEach(id => { if (C[id] && C[top] && C[id].f > C[top].f) top = id; });
  if (_2V2_SENAS_CARTA[top]) return _2V2_SENAS_CARTA[top];
  const n = C[top] && C[top].n;
  if (n === 3) return { emoji: "😗", texto: "Tiene un tres" };
  if (n === 2) return { emoji: "🤏", texto: "Tiene un dos" };
  if (n === 1) return { emoji: "👃", texto: "Un as (falso)" };
  const env = (typeof calcularEnvido === "function") ? calcularEnvido(j.mano) : 0;
  if (env >= 28) return { emoji: "✌️", texto: "Envido " + env };
  return { emoji: "🫤", texto: "Mano floja" };
}
function _2v2ToggleSenas() {
  _2v2_senas = !_2v2_senas;
  const b = document.getElementById("m2v2-btn-senas");
  if (b) b.classList.toggle("off", !_2v2_senas);
  _2v2Render();
  if (typeof showToast === "function") showToast(_2v2_senas ? "🤫 Señas del compañero: ON" : "Señas: OFF", 1400);
}

// El botón 🤫: offline togglea la seña automática; online abre el panel para
// hacerle una seña a mano a tu compañero.
function _2v2BotonSenas() {
  if (_2v2_online) _2v2TogglePanelSenas();
  else _2v2ToggleSenas();
}

function _2v2TogglePanelSenas() {
  const p = document.getElementById("m2v2-senas-panel");
  if (!p) return;
  p.classList.toggle("show");
}

// Manda una seña (por índice del palette) a tu compañero. Ruteo host-autoritativo:
// el host la manda directo al compañero; el guest la manda al host, que la reenvía.
function _2v2EnviarSena(idx) {
  const sena = _2V2_SENAS_ONLINE[idx];
  if (!sena || !_2v2_online) return;
  const yo = _2v2_miAsiento;
  if (_2v2_online.esHost) {
    // Soy el host (autoritativo): proceso mi propia seña directamente.
    _2v2HostProcesarSena(yo, sena);
  } else {
    // Guest → va al host, que la procesa (entrega al compañero + tira la caza).
    if (typeof netEnviar4 === "function") netEnviar4({ tipo: "sena", sena, deAsiento: yo });
  }
  const p = document.getElementById("m2v2-senas-panel");
  if (p) p.classList.remove("show");
  if (typeof showToast === "function") showToast(`✋ Le hiciste la seña: ${sena.emoji} ${sena.texto}`, 1500);
}

// Host (autoritativo): procesa una seña hecha por `deAsiento`.
//  1) La entrega SIEMPRE al compañero (deAsiento+2).
//  2) Tira el dado de la caza: con prob _2V2_PROB_CAZA, los 2 RIVALES se
//     enteran (les llega "sena_cazada"). En la mesa real, hacer señas arriesga.
function _2v2HostProcesarSena(deAsiento, sena) {
  if (typeof deAsiento !== "number" || !sena) return;
  const compa = (deAsiento + 2) % 4;
  _2v2EntregarA(compa, { tipo: "sena", sena, deAsiento });

  if (Math.random() < _2V2_PROB_CAZA) {
    const rivales = [(deAsiento + 1) % 4, (deAsiento + 3) % 4];
    rivales.forEach(r => _2v2EntregarA(r, { tipo: "sena_cazada", sena, deAsiento }));
  }
}

// Host: entrega un payload de seña a un asiento. Si es el propio host (0) lo
// muestra local; si es otro, se lo manda por la red.
function _2v2EntregarA(asiento, payload) {
  if (asiento === 0) {
    if (payload.tipo === "sena_cazada") _2v2MostrarSenaCazada(payload);
    else _2v2MostrarSenaRecibida(payload);
    return;
  }
  if (typeof netEnviar4 === "function") netEnviar4(payload, asiento);
}

// Host: rutea una seña que le llegó de un guest (asiento `de`).
function _2v2HostRuteaSena(payload, de) {
  if (typeof de !== "number" || !payload || !payload.sena) return;
  _2v2HostProcesarSena(de, payload.sena);
}

// Muestra la seña que me hizo mi compañero (toast + badge en su asiento, se borra sola).
function _2v2MostrarSenaRecibida(payload) {
  const sena = payload && payload.sena;
  if (!sena) return;
  _2v2_senaRecibida = { emoji: sena.emoji, texto: sena.texto };
  clearTimeout(_2v2_senaTimer);
  _2v2_senaTimer = setTimeout(() => { _2v2_senaRecibida = null; _2v2Render(); }, 5000);
  if (typeof showToast === "function") showToast(`🤫 Seña de tu compañero: ${sena.emoji} ${sena.texto}`, 2600);
  _2v2Render();
}

// Cazaste la seña de un RIVAL: toast + badge en SU asiento (distinto color),
// se borra sola. Ahora sabés lo que tiene (o lo que quiere hacerte creer).
function _2v2MostrarSenaCazada(payload) {
  const sena = payload && payload.sena;
  if (!sena || typeof payload.deAsiento !== "number") return;
  _2v2_senaCazada = { asiento: payload.deAsiento, emoji: sena.emoji, texto: sena.texto };
  clearTimeout(_2v2_senaCazadaTimer);
  _2v2_senaCazadaTimer = setTimeout(() => { _2v2_senaCazada = null; _2v2Render(); }, 5500);
  if (typeof showToast === "function") showToast(`🕵️ ¡Cazaste una seña del rival: ${sena.emoji} ${sena.texto}!`, 2800);
  _2v2Render();
}

// Posición de pantalla de un asiento ABSOLUTO, relativa a mi asiento:
// yo siempre abajo (sur), mi compañero arriba (norte), rivales a los costados.
const _2V2_POS_REL = ["sur", "oeste", "norte", "este"];
function _2v2PosDe(asiento) { return _2V2_POS_REL[(asiento - _2v2_miAsiento + 4) % 4]; }
function _2v2EsGuest() { return !!(_2v2_online && !_2v2_online.esHost); }

function iniciar2v2() {
  _2v2AsegurarPantalla();
  _2v2_online = null;
  _2v2_miAsiento = 0;
  const manoIni = Math.floor(Math.random() * 4);
  nuevo2v2({ manoInicial: manoIni, nombres: ["Vos", "Rival 1", "Compañero", "Rival 2"] });
  _2v2_logIdx = 0;           // desde 0 para no perder el toast de flor del 1er reparto
  _2v2_centroPrev = 0;
  _2v2_modo = null;
  document.getElementById("mesa2v2").classList.add("show");
  _2v2Render();
  _2v2Correr();
}

function salir2v2() {
  _2v2_corriendo = false;
  if (_2v2_online && typeof online2v2Cleanup === "function") online2v2Cleanup();
  _2v2_online = null;
  _2v2_miAsiento = 0;
  document.getElementById("mesa2v2")?.classList.remove("show");
  if (typeof irA === "function") irA("main-menu");
}

// Corre pasos de bots con delay hasta que le toca al humano o termina.
function _2v2Correr() {
  if (_2v2_corriendo) return;
  _2v2_corriendo = true;
  const step = () => {
    if (!document.getElementById("mesa2v2")?.classList.contains("show")) { _2v2_corriendo = false; return; }
    const r = pasoBot2v2();
    _2v2ToastCantos();
    _2v2Render();
    if (r === "humano")      { _2v2_corriendo = false; _2v2_modo = "juega";    _2v2Render(); return; }
    if (r === "humanoCanto") { _2v2_corriendo = false; _2v2_modo = "responde"; _2v2Render(); return; }
    if (r === "fin")         { _2v2_corriendo = false; _2v2FinPartido(); return; }
    setTimeout(step, r === "canto" ? 900 : 780); // pausa para ver la jugada/canto
  };
  setTimeout(step, 500);
}

// El jugador local tira una carta (click).
function _2v2JugarHumano(idx) {
  if (_2v2_modo !== "juega" || S2.turno !== _2v2_miAsiento || S2.terminado) return;
  if (!S2.jugadores[_2v2_miAsiento].mano[idx]) return;
  _2v2_modo = null;
  if (_2v2EsGuest()) { _2v2_online.enviar({ accion: "jugar", idx }); _2v2Render(); return; }
  jugarCarta2v2(_2v2_miAsiento, idx);
  _2v2TrasAccion();
}

// El jugador local canta. tipo: 'truco' | 'envido' | 'real' | 'falta'.
function _2v2Cantar(tipo) {
  if (_2v2_modo !== "juega") return;
  if (_2v2EsGuest()) { _2v2_modo = null; _2v2_online.enviar({ accion: "cantar", tipo }); _2v2Render(); return; }
  const ok = tipo === "truco" ? accionCantarTruco2v2(_2v2_miAsiento) : accionCantarEnvido2v2(_2v2_miAsiento, tipo);
  if (!ok) return;
  _2v2_modo = null;
  _2v2TrasAccion();
}

// El jugador local responde a un canto pendiente ('quiero'|'no'|'subir'|'real'...).
function _2v2Responder(resp) {
  if (_2v2_modo !== "responde") return;
  if (_2v2EsGuest()) { _2v2_modo = null; _2v2_online.enviar({ accion: "responder", resp }); _2v2Render(); return; }
  if (!accionResponderCanto2v2(_2v2_miAsiento, resp)) return;
  _2v2_modo = null;
  _2v2TrasAccion();
}

// "El envido está primero": el jugador responde al TRUCO pendiente
// cantando envido en su lugar (el truco queda en pausa hasta resolverlo).
function _2v2ResponderConEnvido(tipo) {
  if (_2v2_modo !== "responde") return;
  if (_2v2EsGuest()) { _2v2_modo = null; _2v2_online.enviar({ accion: "responder_con_envido", tipo }); _2v2Render(); return; }
  if (!accionResponderTrucoConEnvido2v2(_2v2_miAsiento, tipo)) return;
  _2v2_modo = null;
  _2v2TrasAccion();
}

// Común tras una acción aplicada localmente (offline o host): refrescar y
// devolver el control al driver correspondiente.
function _2v2TrasAccion() {
  _2v2ToastCantos();
  _2v2Render();
  if (_2v2_online && _2v2_online.esHost) { _2v2_online.continuar(); return; }
  if (S2.terminado) { _2v2FinPartido(); return; }
  _2v2Correr();
}

// Placa 3D de canto/resultado (reemplaza a los toasts, estilo 1v1).
// variante: 'mio' (dorado) | 'rival' (rojo) | 'gano' | 'pierde' | 'parda'.
let _2v2_ovTimer = null;
function _2v2Overlay(texto, sub, variante) {
  const ov = document.getElementById("m2v2-ov");
  const card = document.getElementById("m2v2-ov-card");
  if (!ov || !card) return;
  document.getElementById("m2v2-ov-txt").textContent = texto;
  document.getElementById("m2v2-ov-sub").textContent = sub || "";
  card.className = "m2v2-ov-card " + (variante || "mio");
  ov.classList.remove("show");
  void ov.offsetWidth;               // reinicia la animación
  ov.classList.add("show");
  clearTimeout(_2v2_ovTimer);
  const dur = /gano|pierde|parda/.test(variante) ? 1500 : 1050;
  _2v2_ovTimer = setTimeout(() => ov.classList.remove("show"), dur);
}

// Traduce una línea del log del motor a una placa (o nada).
function _2v2MostrarEventoLog(l) {
  l = (l || "").trim();
  let m;
  // Resultado de la mano
  if ((m = l.match(/^Mano para (nos|ellos).*?\+(\d+)/))) {
    const gano = m[1] === _2v2MiEq();
    _2v2Overlay(gano ? "¡GANARON!" : "PERDIERON",
      gano ? `+${m[2]} para ustedes` : `${m[2]} para ellos`, gano ? "gano" : "pierde");
    return;
  }
  // Flor / contraflor
  if ((m = l.match(/^(FLOR|CONTRAFLOR)/))) {
    const mio = new RegExp(`\\b${_2v2MiEq()}\\b`).test(l) && !new RegExp(`\\b${_2v2OtroEq()}\\b`).test(l);
    _2v2Overlay(m[1] === "CONTRAFLOR" ? "¡CONTRAFLOR!" : "¡FLOR!", "", mio ? "mio" : "rival");
    return;
  }
  // Envido resuelto: "Envido: NOS a vs ELLOS b → +n g"
  if ((m = l.match(/^Envido: NOS (\d+) vs ELLOS (\d+) .*?\+(\d+) (nos|ellos)/))) {
    const gano = m[4] === _2v2MiEq();
    const mis = _2v2MiEq() === "nos" ? m[1] : m[2], sus = _2v2MiEq() === "nos" ? m[2] : m[1];
    _2v2Overlay("ENVIDO", `${mis} son ${gano ? "mejores" : "menos"} (${sus})`, gano ? "mio" : "rival");
    return;
  }
  // Flor resuelta por comparación: "Flor: nos X vs ellos Y → +N g"
  if ((m = l.match(/^Flor: nos (\d+) vs ellos (\d+) .*?\+(\d+) (nos|ellos)/))) {
    const gano = m[4] === _2v2MiEq();
    _2v2Overlay("FLOR", `${gano ? "la más alta" : "no alcanzó"} · +${m[3]}`, gano ? "gano" : "pierde");
    return;
  }
  // Contraflor no querida: "Contraflor NO querida → +N eq"
  if ((m = l.match(/^Contraflor NO querida.*?\+(\d+) (nos|ellos)/))) {
    const mio = m[2] === _2v2MiEq();
    _2v2Overlay("NO QUIERO", "contraflor", mio ? "mio" : "rival");
    return;
  }
  // Canto de envido / truco / flor: "eq canta NOMBRE ..."
  if ((m = l.match(/^(nos|ellos) canta ([A-ZÁ-Ú 4]+)/))) {
    const mio = m[1] === _2v2MiEq();
    _2v2Overlay("¡" + m[2].trim() + "!", mio ? "NOSOTROS" : "ELLOS", mio ? "mio" : "rival");
    return;
  }
  // Quiero / no quiero
  if ((m = l.match(/^(nos|ellos) QUIERE/))) { const mio = m[1] === _2v2MiEq(); _2v2Overlay("¡QUIERO!", "", mio ? "mio" : "rival"); return; }
  if ((m = l.match(/^(nos|ellos) NO QUIERE/))) { const mio = m[1] === _2v2MiEq(); _2v2Overlay("NO QUIERO", "", mio ? "mio" : "rival"); return; }
  if (/^Envido NO querido/.test(l)) { _2v2Overlay("NO QUIERO", "envido", "rival"); return; }
}

// Procesa las líneas nuevas del log y las muestra como placas.
function _2v2ToastCantos() {
  const nuevos = S2._log.slice(_2v2_logIdx);
  _2v2_logIdx = S2._log.length;
  nuevos.forEach(_2v2MostrarEventoLog);
}

function _2v2FinPartido() {
  const gano = S2.ganadorPartido === _2v2MiEq();
  const el = document.getElementById("m2v2-fin");
  if (el) {
    const box = el.querySelector(".m2v2-fin-box");
    if (box) { box.classList.toggle("gano", gano); box.classList.toggle("pierde", !gano); }
    el.querySelector(".m2v2-fin-trofeo").textContent = gano ? "🏆" : "💪";
    el.querySelector(".m2v2-fin-txt").textContent = gano ? "¡GANARON USTEDES!" : "GANARON ELLOS";
    el.querySelector(".m2v2-fin-sub").textContent = `NOSOTROS ${S2.puntos[_2v2MiEq()]} — ${S2.puntos[_2v2OtroEq()]} ELLOS`;
    // Botón revancha: offline reinicia local; online lo controla el host.
    const rev = document.getElementById("m2v2-revancha");
    if (rev) {
      if (_2v2_online) {
        rev.style.display = _2v2_online.esHost ? "inline-block" : "none";
        rev.onclick = () => { el.classList.remove("show"); online2v2Revancha(); };
      } else {
        rev.style.display = "inline-block";
        rev.onclick = () => { el.classList.remove("show"); iniciar2v2(); };
      }
    }
    el.classList.add("show");
  }
}

// ─────────────────────────────────────────────────────────────
// RENDER
// ─────────────────────────────────────────────────────────────
// Equipo del jugador local y clase relativa (mi equipo = "nos"/verde siempre).
function _2v2MiEq()  { return (_2v2_miAsiento % 2 === 0) ? "nos" : "ellos"; }
function _2v2OtroEq() { return _2v2MiEq() === "nos" ? "ellos" : "nos"; }
function _2v2ClaseRel(asiento) { return (asiento % 2) === (_2v2_miAsiento % 2) ? "nos" : "ellos"; }

function _2v2Render() {
  if (!document.getElementById("mesa2v2")) return;
  // Marcador (relativo: mi equipo a la izquierda como "NOSOTROS")
  _2v2Set("m2v2-pts-nos", S2.puntos[_2v2MiEq()]);
  _2v2Set("m2v2-pts-ellos", S2.puntos[_2v2OtroEq()]);

  // Cada jugador
  S2.jugadores.forEach((j, asiento) => {
    const pos  = _2v2PosDe(asiento);
    const slot = document.getElementById(`m2v2-${pos}`);
    if (!slot) return;
    const esTurno = (S2.turno === asiento && !S2.terminado);
    const rel = _2v2ClaseRel(asiento);
    slot.classList.toggle("turno", esTurno);
    slot.classList.toggle("equipo-nos", rel === "nos");
    slot.classList.toggle("equipo-ellos", rel === "ellos");

    const nombreEl = slot.querySelector(".m2v2-nombre");
    if (nombreEl) {
      const nom = (asiento === _2v2_miAsiento) ? "Vos" : j.nombre;
      nombreEl.textContent = nom + (asiento === S2.manoAsiento ? " (mano)" : "");
    }

    // Seña del COMPAÑERO (el asiento de enfrente, mi equipo): solo la de él,
    // solo si las señas están activas y offline (online = jugadores reales).
    const senaEl = slot.querySelector(".m2v2-sena");
    if (senaEl) {
      const esCompa = asiento === (_2v2_miAsiento + 2) % 4;
      let sena = null, cazada = false;
      if (!S2.terminado) {
        if (esCompa) {
          if (_2v2_online) sena = _2v2_senaRecibida;          // online: la que me hizo mi compañero
          else if (_2v2_senas) sena = _2v2SenaDe(asiento);    // offline: auto (su mejor carta)
        } else if (_2v2_online && _2v2_senaCazada && _2v2_senaCazada.asiento === asiento) {
          sena = _2v2_senaCazada; cazada = true;              // rival al que le cazaste una seña
        }
      }
      if (sena) { senaEl.textContent = (cazada ? "🕵️ " : "") + `${sena.emoji} ${sena.texto}`; senaEl.style.display = "flex"; }
      else { senaEl.textContent = ""; senaEl.style.display = "none"; }
      senaEl.classList.toggle("cazada", !!sena && cazada);
    }

    const manoEl = slot.querySelector(".m2v2-mano");
    if (!manoEl) return;
    manoEl.innerHTML = "";

    if (asiento === _2v2_miAsiento) {
      // Mi mano: cartas boca arriba, jugables si es mi turno.
      j.mano.forEach((c, i) => {
        if (!c) return;
        const div = document.createElement("div");
        const jugable = _2v2_modo === "juega" && esTurno;
        div.className = "m2v2-carta" + (jugable ? " jugable" : "");
        const img = document.createElement("img");
        img.src = `${c}.webp`; img.alt = c; img.draggable = false;
        img.onerror = () => { div.textContent = c; };
        div.appendChild(img);
        if (jugable) div.onclick = () => _2v2JugarHumano(i);
        manoEl.appendChild(div);
      });
    } else {
      // Rivales/compañero: dorsos según cuántas cartas les quedan.
      const n = j.mano.filter(Boolean).length;
      for (let k = 0; k < n; k++) {
        const div = document.createElement("div");
        div.className = "m2v2-carta dorso";
        manoEl.appendChild(div);
      }
    }
  });

  // Cartas jugadas en la baza actual (centro), ubicadas por asiento.
  const centro = document.getElementById("m2v2-centro");
  if (centro) {
    if (S2.jugadasBaza.length === 0) _2v2_centroPrev = 0; // baza nueva → reset animación
    centro.innerHTML = "";
    S2.jugadasBaza.forEach((jug, i) => {
      const div = document.createElement("div");
      const nueva = i >= _2v2_centroPrev ? " recien" : "";
      div.className = `m2v2-carta jugada ${_2v2ClaseRel(jug.asiento)} pos-${_2v2PosDe(jug.asiento)}${nueva}`;
      const img = document.createElement("img");
      img.src = `${jug.carta}.webp`; img.alt = jug.carta; img.draggable = false;
      img.onerror = () => { div.textContent = jug.carta; };
      div.appendChild(img);
      centro.appendChild(div);
    });
    _2v2_centroPrev = S2.jugadasBaza.length;
  }

  // Bazas ganadas (indicadores, relativas: ✓ = mi equipo)
  const bz = document.getElementById("m2v2-bazas");
  if (bz) {
    bz.innerHTML = S2.bazas.map(b => {
      const rel = b === "parda" ? "parda" : (b === _2v2MiEq() ? "nos" : "ellos");
      return `<span class="m2v2-baza ${rel}">${rel === "nos" ? "✓" : rel === "ellos" ? "✗" : "="}</span>`;
    }).join("");
  }

  _2v2RenderAcciones();
}

const _TN2V2 = ["", "", "TRUCO", "RETRUCO", "VALE 4"];

// Botones de canto: responder (si te cantaron) o iniciar (en tu turno).
function _2v2RenderAcciones() {
  const el = document.getElementById("m2v2-acciones");
  if (!el) return;
  let html = "";

  if (_2v2_modo === "responde" && S2.canto) {
    const c = S2.canto;
    if (c.tipo === "envido") {
      const nombre = _ENV_NOMBRE[c.cadena[c.cadena.length - 1]];
      html += `<span class="m2v2-acc-lbl">Te cantaron <b>${nombre}</b> <em>(vale ${c.enJuego})</em></span>`;
      html += `<button class="m2v2-acc quiero" onclick="_2v2Responder('quiero')">QUIERO</button>`;
      (_envidoRaises2v2(c.cadena) || []).forEach(r => {
        html += `<button class="m2v2-acc subir" onclick="_2v2Responder('${r}')">${_ENV_NOMBRE[r]}</button>`;
      });
      html += `<button class="m2v2-acc no" onclick="_2v2Responder('no')">NO QUIERO</button>`;
    } else if (c.tipo === "flor") {
      const nombre = _FLOR_NOMBRE[c.cadena[c.cadena.length - 1]];
      html += `<span class="m2v2-acc-lbl">Hay <b>${nombre}</b> <em>(vale ${c.enJuego})</em></span>`;
      html += `<button class="m2v2-acc quiero" onclick="_2v2Responder('quiero')">CON FLOR QUIERO</button>`;
      (_florRaises2v2(c.cadena) || []).forEach(r => {
        html += `<button class="m2v2-acc subir" onclick="_2v2Responder('${r}')">${_FLOR_NOMBRE[r]}</button>`;
      });
      if (c.cadena.length > 1) html += `<button class="m2v2-acc no" onclick="_2v2Responder('no')">NO QUIERO</button>`;
    } else {
      html += `<span class="m2v2-acc-lbl">Te cantaron <b>${_TN2V2[c.nivel]}</b></span>`;
      html += `<button class="m2v2-acc quiero" onclick="_2v2Responder('quiero')">QUIERO</button>`;
      if (c.nivel < 4) html += `<button class="m2v2-acc subir" onclick="_2v2Responder('subir')">${_TN2V2[c.nivel + 1]}</button>`;
      html += `<button class="m2v2-acc no" onclick="_2v2Responder('no')">NO QUIERO</button>`;
      if (puedeResponderTrucoConEnvido2v2(_equipoDe(_2v2_miAsiento))) {
        html += `<button class="m2v2-acc envido" onclick="_2v2ResponderConEnvido('envido')">EL ENVIDO ESTÁ PRIMERO</button>`;
      }
    }
  } else if (_2v2_modo === "juega" && !S2.terminado) {
    const puedeTruco  = !S2.canto && S2.nivelTruco < 2 && !S2._trucoRechazado;
    const puedeEnvido = !S2.canto && S2.ronda === 0 && !S2.envidoResuelto && !S2.florActiva;
    if (puedeEnvido) {
      html += `<button class="m2v2-acc envido" onclick="_2v2Cantar('envido')">ENVIDO</button>`;
      html += `<button class="m2v2-acc envido" onclick="_2v2Cantar('real')">REAL</button>`;
      html += `<button class="m2v2-acc envido" onclick="_2v2Cantar('falta')">FALTA</button>`;
    }
    if (puedeTruco)  html += `<button class="m2v2-acc truco" onclick="_2v2Cantar('truco')">TRUCO</button>`;
    if (html) html = `<span class="m2v2-acc-hint">Tu turno:</span>` + html;
  }
  el.innerHTML = html;
}

function _equipo2vDe(asiento) { return asiento % 2 === 0 ? "nos" : "ellos"; }
function _2v2Set(id, v) { const el = document.getElementById(id); if (el) el.textContent = v; }

// ─────────────────────────────────────────────────────────────
// INYECCIÓN DE PANTALLA + CSS
// ─────────────────────────────────────────────────────────────
function _2v2AsegurarPantalla() {
  if (document.getElementById("mesa2v2")) return;
  const div = document.createElement("div");
  div.id = "mesa2v2";
  div.innerHTML = `
    <div class="m2v2-top">
      <button class="m2v2-salir" onclick="salir2v2()">← Salir</button>
      <div class="m2v2-marcador">
        <span class="m2v2-eq nos">NOSOTROS <b id="m2v2-pts-nos">0</b></span>
        <span class="m2v2-bazas" id="m2v2-bazas"></span>
        <span class="m2v2-eq ellos"><b id="m2v2-pts-ellos">0</b> ELLOS</span>
      </div>
      <button class="m2v2-btn-senas" id="m2v2-btn-senas" onclick="_2v2BotonSenas()" title="Señas">🤫</button>
    </div>
    <div class="m2v2-senas-panel" id="m2v2-senas-panel">
      <div class="m2v2-senas-tit">Hacele una seña a tu compañero 🤫<br><span class="m2v2-senas-sub">ojo: el rival puede cazártela 🕵️</span></div>
      <div class="m2v2-senas-grid">
        ${_2V2_SENAS_ONLINE.map((s, i) => `<button class="m2v2-sena-op" onclick="_2v2EnviarSena(${i})"><span class="m2v2-sena-emo">${s.emoji}</span><span class="m2v2-sena-lbl">${esc(s.texto)}</span></button>`).join("")}
      </div>
      <button class="m2v2-senas-cerrar" onclick="_2v2TogglePanelSenas()">Cerrar</button>
    </div>
    <div class="m2v2-tablero">
      <div class="m2v2-slot norte" id="m2v2-norte"><div class="m2v2-nombre"></div><div class="m2v2-sena"></div><div class="m2v2-mano"></div></div>
      <div class="m2v2-slot oeste" id="m2v2-oeste"><div class="m2v2-nombre"></div><div class="m2v2-sena"></div><div class="m2v2-mano"></div></div>
      <div class="m2v2-centro" id="m2v2-centro"></div>
      <div class="m2v2-slot este"  id="m2v2-este"><div class="m2v2-nombre"></div><div class="m2v2-sena"></div><div class="m2v2-mano"></div></div>
      <div class="m2v2-slot sur"   id="m2v2-sur"><div class="m2v2-nombre"></div><div class="m2v2-sena"></div><div class="m2v2-mano"></div></div>
    </div>
    <div class="m2v2-acciones" id="m2v2-acciones"></div>
    <div class="m2v2-ov" id="m2v2-ov">
      <div class="m2v2-ov-card mio" id="m2v2-ov-card">
        <div class="m2v2-ov-txt" id="m2v2-ov-txt"></div>
        <div class="m2v2-ov-sub" id="m2v2-ov-sub"></div>
      </div>
    </div>
    <div class="m2v2-fin" id="m2v2-fin">
      <div class="m2v2-fin-box">
        <div class="m2v2-fin-trofeo"></div>
        <div class="m2v2-fin-txt"></div>
        <div class="m2v2-fin-sub"></div>
        <div class="m2v2-fin-btns">
          <button id="m2v2-revancha" class="m2v2-fin-btn primary">↻ REVANCHA</button>
          <button class="m2v2-fin-btn" onclick="document.getElementById('m2v2-fin').classList.remove('show'); salir2v2();">MENÚ</button>
        </div>
      </div>
    </div>`;
  document.body.appendChild(div);
}

(function _2v2CSS() {
  const s = document.createElement("style");
  s.textContent = `
    #mesa2v2 { display:none; position:fixed; inset:0; z-index:900; overflow:hidden;
      background:
        radial-gradient(circle at 50% 46%, transparent 74px, rgba(255,255,255,.10) 75px, rgba(255,255,255,.10) 78px, transparent 79px),
        repeating-linear-gradient(90deg, rgba(255,255,255,.028) 0 72px, transparent 72px 144px),
        radial-gradient(ellipse 130% 80% at 50% 42%, rgba(64,168,100,.40), transparent 60%),
        radial-gradient(ellipse at center, #15582f 0%, #0b3a20 55%, #05160d 100%);
      flex-direction:column; color:#fff; font-family:var(--f-ui,'Oswald',sans-serif); }
    #mesa2v2.show { display:flex; }
    .m2v2-top { position:relative; z-index:2; display:flex; align-items:center; justify-content:space-between; padding:12px 14px; gap:10px; }
    .m2v2-salir { background:rgba(0,0,0,.45); color:#fff; border:1px solid rgba(255,255,255,.2);
      border-radius:20px; padding:7px 15px; font-size:13px; cursor:pointer; transition:background .15s; }
    .m2v2-salir:hover { background:rgba(0,0,0,.7); }
    .m2v2-marcador { display:flex; align-items:center; gap:14px; font-size:12px; letter-spacing:1px;
      background:rgba(4,16,10,.5); border:1px solid rgba(255,255,255,.08); padding:5px 16px; border-radius:24px;
      box-shadow:0 4px 14px rgba(0,0,0,.35); }
    .m2v2-eq { color:rgba(255,255,255,.75); }
    .m2v2-eq b { font-family:var(--f-display,'Bebas Neue',sans-serif); font-size:26px; }
    .m2v2-eq.nos b { color:#3ff08a; text-shadow:0 0 12px rgba(46,204,113,.4); }
    .m2v2-eq.ellos b { color:#ff6a5a; text-shadow:0 0 12px rgba(231,76,60,.4); }
    .m2v2-bazas { display:flex; gap:4px; }
    .m2v2-baza { font-size:14px; opacity:.95; }
    .m2v2-baza.nos { color:#3ff08a; } .m2v2-baza.ellos { color:#ff6a5a; } .m2v2-baza.parda { color:#f5c518; }
    .m2v2-tablero { position:relative; z-index:1; flex:1; display:grid;
      grid-template-columns:auto 1fr auto; grid-template-rows:auto 1fr auto;
      grid-template-areas:". norte ." "oeste centro este" ". sur ."; padding:8px; gap:6px; }
    .m2v2-slot { display:flex; flex-direction:column; align-items:center; gap:6px; padding:8px 10px; border-radius:14px; transition:box-shadow .25s, background .25s; }
    .m2v2-slot.norte { grid-area:norte; } .m2v2-slot.sur { grid-area:sur; }
    .m2v2-slot.oeste { grid-area:oeste; justify-content:center; } .m2v2-slot.este { grid-area:este; justify-content:center; }
    .m2v2-slot.turno { background:rgba(245,197,24,.12); box-shadow:0 0 0 2px rgba(245,197,24,.55) inset, 0 0 26px rgba(245,197,24,.18); }
    .m2v2-nombre { font-size:12px; letter-spacing:.5px; color:rgba(255,255,255,.85); white-space:nowrap;
      background:rgba(0,0,0,.3); padding:3px 12px; border-radius:14px; }
    .m2v2-slot.equipo-nos  .m2v2-nombre { color:#8ff5b3; box-shadow:0 0 0 1px rgba(46,204,113,.3) inset; }
    .m2v2-slot.equipo-ellos .m2v2-nombre { color:#ffa79c; box-shadow:0 0 0 1px rgba(231,76,60,.3) inset; }
    .m2v2-slot.sur .m2v2-nombre { font-size:13px; }
    .m2v2-sena { display:none; align-items:center; gap:4px; font-size:11px; letter-spacing:.3px;
      background:rgba(245,197,24,.14); color:#ffe27a; border:1px solid rgba(245,197,24,.4);
      padding:3px 9px; border-radius:12px; white-space:nowrap; animation:m2v2SenaIn .3s ease; }
    .m2v2-sena.cazada { background:rgba(231,76,60,.18); color:#ff9a8f; border-color:rgba(231,76,60,.5); }
    @keyframes m2v2SenaIn { from{opacity:0; transform:scale(.8)} to{opacity:1; transform:scale(1)} }
    .m2v2-btn-senas { background:rgba(0,0,0,.45); border:1px solid rgba(245,197,24,.4); border-radius:50%;
      width:36px; height:36px; font-size:16px; cursor:pointer; transition:opacity .15s, filter .15s; }
    .m2v2-btn-senas.off { opacity:.4; filter:grayscale(1); }
    .m2v2-btn-senas:hover { filter:brightness(1.15); }
    .m2v2-senas-panel { display:none; position:absolute; top:56px; right:12px; z-index:6; width:min(320px,88vw);
      background:linear-gradient(160deg,rgba(16,32,58,.98),rgba(6,12,24,.99)); border:1.5px solid rgba(245,197,24,.4);
      border-radius:16px; padding:14px; box-shadow:0 18px 44px rgba(0,0,0,.6); animation:m2v2SenaIn .22s ease; }
    .m2v2-senas-panel.show { display:block; }
    .m2v2-senas-tit { font-size:13px; opacity:.85; text-align:center; margin-bottom:10px; letter-spacing:.4px; }
    .m2v2-senas-sub { font-size:11px; opacity:.7; color:#ff9a8f; }
    .m2v2-senas-grid { display:grid; grid-template-columns:1fr 1fr; gap:7px; }
    .m2v2-sena-op { display:flex; align-items:center; gap:7px; padding:8px 9px; border-radius:11px; cursor:pointer;
      background:rgba(255,255,255,.06); border:1px solid rgba(255,255,255,.12); color:#fff; text-align:left;
      transition:background .13s, transform .1s; }
    .m2v2-sena-op:hover { background:rgba(245,197,24,.16); border-color:rgba(245,197,24,.4); }
    .m2v2-sena-op:active { transform:scale(.94); }
    .m2v2-sena-emo { font-size:19px; line-height:1; }
    .m2v2-sena-lbl { font-size:12px; line-height:1.1; }
    .m2v2-senas-cerrar { width:100%; margin-top:10px; padding:9px; border-radius:11px; cursor:pointer;
      background:rgba(255,255,255,.1); border:none; color:#fff; font-family:inherit; font-size:13px; letter-spacing:.5px; }
    .m2v2-senas-cerrar:hover { background:rgba(255,255,255,.18); }
    .m2v2-mano { display:flex; gap:4px; }
    .m2v2-slot.oeste .m2v2-mano, .m2v2-slot.este .m2v2-mano { flex-direction:column; }
    .m2v2-carta { width:52px; height:74px; border-radius:7px; overflow:hidden; background:#0d1015;
      box-shadow:0 5px 12px rgba(0,0,0,.55); display:flex; align-items:center; justify-content:center; font-size:10px; }
    .m2v2-carta img { width:100%; height:100%; object-fit:fill; }
    .m2v2-carta.dorso { width:34px; height:50px;
      background:repeating-linear-gradient(45deg,#8a1416,#8a1416 6px,#5a0d0e 6px,#5a0d0e 12px);
      border:1px solid rgba(245,197,24,.35); box-shadow:0 4px 9px rgba(0,0,0,.45); }
    .m2v2-slot.norte .m2v2-carta.dorso, .m2v2-slot.oeste .m2v2-carta.dorso, .m2v2-slot.este .m2v2-carta.dorso { width:30px; height:44px; }
    .m2v2-carta.jugable { cursor:pointer; transition:transform .15s, box-shadow .15s; }
    .m2v2-carta.jugable:hover { transform:translateY(-12px); box-shadow:0 14px 26px rgba(0,0,0,.6), 0 0 0 2px rgba(245,197,24,.75); }
    .m2v2-centro { grid-area:centro; position:relative; min-height:170px; min-width:170px; align-self:center; justify-self:center; }
    .m2v2-carta.jugada { position:absolute; width:52px; height:74px; }
    .m2v2-carta.jugada.pos-sur   { left:calc(50% - 26px); top:calc(50% + 3px); }
    .m2v2-carta.jugada.pos-norte { left:calc(50% - 26px); top:calc(50% - 77px); }
    .m2v2-carta.jugada.pos-oeste { left:calc(50% - 74px); top:calc(50% - 37px); }
    .m2v2-carta.jugada.pos-este  { left:calc(50% + 22px); top:calc(50% - 37px); }
    .m2v2-carta.jugada.nos   { box-shadow:0 5px 12px rgba(0,0,0,.55), 0 0 0 2px rgba(63,240,138,.8); }
    .m2v2-carta.jugada.ellos { box-shadow:0 5px 12px rgba(0,0,0,.55), 0 0 0 2px rgba(255,106,90,.8); }
    .m2v2-carta.jugada.recien { animation:m2v2-entra .26s cubic-bezier(.2,.9,.3,1.2); z-index:2; }
    @keyframes m2v2-entra { from { opacity:0; transform:scale(.55); } to { opacity:1; transform:scale(1); } }
    .m2v2-acciones { position:relative; z-index:2; display:flex; flex-wrap:wrap; align-items:center; justify-content:center; gap:8px;
      min-height:52px; padding:8px 10px 14px; background:linear-gradient(rgba(0,0,0,0), rgba(0,0,0,.3)); }
    .m2v2-acc-hint, .m2v2-acc-lbl { font-size:12px; color:rgba(255,255,255,.75); letter-spacing:.5px; }
    .m2v2-acc-lbl b { color:#f5c518; }
    .m2v2-acc { font-family:var(--f-ui,'Oswald',sans-serif); font-weight:700; font-size:13px; letter-spacing:1px;
      padding:10px 20px; border-radius:24px; border:none; cursor:pointer; color:#04120a;
      box-shadow:0 4px 12px rgba(0,0,0,.35); transition:transform .12s, filter .12s; }
    .m2v2-acc.truco, .m2v2-acc.envido, .m2v2-acc.subir { background:linear-gradient(#ffe064,#f5c518); }
    .m2v2-acc.quiero { background:linear-gradient(#43e07f,#25b866); }
    .m2v2-acc.no { background:linear-gradient(#ff6a5a,#d43b2c); color:#fff; }
    .m2v2-acc:hover { filter:brightness(1.08); transform:translateY(-2px); box-shadow:0 8px 18px rgba(0,0,0,.45); }

    /* ── OVERLAY 3D de canto / resultado ── */
    .m2v2-ov { position:absolute; inset:0; z-index:20; display:flex; align-items:center; justify-content:center;
      pointer-events:none; opacity:0; transition:opacity .18s; perspective:900px; }
    .m2v2-ov.show { opacity:1; }
    .m2v2-ov-card { min-width:210px; padding:20px 44px; border-radius:18px; text-align:center;
      background:linear-gradient(150deg, rgba(16,32,58,.99), rgba(5,10,22,1));
      border:2px solid var(--gold,#f5c518); transform-style:preserve-3d;
      box-shadow:0 0 46px rgba(245,197,24,.28), 0 22px 48px rgba(0,0,0,.75);
      transform:rotateY(-108deg) scale(.72); opacity:0; }
    .m2v2-ov.show .m2v2-ov-card { animation:m2v2FlipIn .5s cubic-bezier(.22,.85,.35,1.15) forwards; }
    @keyframes m2v2FlipIn { 0%{transform:rotateY(-108deg) scale(.72);opacity:0} 60%{transform:rotateY(13deg) scale(1.05);opacity:1} 100%{transform:rotateY(0) scale(1);opacity:1} }
    .m2v2-ov-txt { font-family:var(--f-display,'Bebas Neue',sans-serif); font-size:38px; letter-spacing:3px; line-height:1;
      color:var(--gold,#f5c518); text-shadow:0 0 18px rgba(245,197,24,.5); }
    .m2v2-ov-sub { margin-top:6px; font-size:11px; letter-spacing:3px; text-transform:uppercase; color:rgba(255,255,255,.55); }
    .m2v2-ov-card.rival { border-color:var(--red,#c0392b); box-shadow:0 0 46px rgba(192,57,43,.3), 0 22px 44px rgba(0,0,0,.7); }
    .m2v2-ov-card.rival .m2v2-ov-txt { color:#ff8a7a; text-shadow:0 0 18px rgba(192,57,43,.5); }
    .m2v2-ov-card.gano .m2v2-ov-txt { color:#7ef0a8; text-shadow:0 0 22px rgba(46,204,113,.55); font-size:34px; }
    .m2v2-ov-card.pierde { border-color:var(--red,#c0392b); }
    .m2v2-ov-card.pierde .m2v2-ov-txt { color:#ff8a7a; text-shadow:0 0 18px rgba(192,57,43,.5); font-size:34px; }
    .m2v2-ov-card.parda .m2v2-ov-txt { color:#fff; text-shadow:none; font-size:34px; }

    /* ── FIN DE PARTIDO ── */
    .m2v2-fin { display:none; position:absolute; inset:0; z-index:30;
      background:radial-gradient(ellipse at center, rgba(0,0,0,.68), rgba(0,0,0,.9));
      align-items:center; justify-content:center; }
    .m2v2-fin.show { display:flex; animation:m2v2Fade .3s ease; }
    @keyframes m2v2Fade { from{opacity:0} to{opacity:1} }
    .m2v2-fin-box { background:linear-gradient(160deg,#12281c,#0a1610); border:1px solid rgba(245,197,24,.35);
      border-radius:22px; padding:30px 36px 26px; text-align:center; display:flex; flex-direction:column; align-items:center; gap:6px;
      min-width:290px; box-shadow:0 24px 60px rgba(0,0,0,.7); animation:m2v2Pop .45s cubic-bezier(.22,.85,.35,1.2); }
    @keyframes m2v2Pop { 0%{transform:scale(.82) translateY(18px);opacity:0} 100%{transform:scale(1) translateY(0);opacity:1} }
    .m2v2-fin-box.gano { border-color:rgba(245,197,24,.6); box-shadow:0 0 60px rgba(245,197,24,.16), 0 24px 60px rgba(0,0,0,.7); }
    .m2v2-fin-box.pierde { border-color:rgba(192,57,43,.5); }
    .m2v2-fin-trofeo { font-size:58px; line-height:1; filter:drop-shadow(0 6px 14px rgba(0,0,0,.55)); }
    .m2v2-fin-txt { font-family:var(--f-display,'Bebas Neue',sans-serif); font-size:34px; letter-spacing:2px; }
    .m2v2-fin-box.gano .m2v2-fin-txt { color:var(--gold,#f5c518); }
    .m2v2-fin-box.pierde .m2v2-fin-txt { color:#ff8a7a; }
    .m2v2-fin-sub { color:rgba(255,255,255,.7); font-size:14px; letter-spacing:1px; margin-bottom:14px; }
    .m2v2-fin-btns { display:flex; gap:10px; }
    .m2v2-fin-btn { font-family:var(--f-ui,'Oswald',sans-serif); font-weight:700; letter-spacing:1px; font-size:13px;
      padding:11px 22px; border-radius:24px; border:1px solid rgba(255,255,255,.2); background:rgba(255,255,255,.08); color:#fff; cursor:pointer; transition:transform .12s, filter .12s; }
    .m2v2-fin-btn.primary { background:linear-gradient(#ffe064,#f5c518); color:#04120a; border-color:transparent; }
    .m2v2-fin-btn:hover { filter:brightness(1.08); transform:translateY(-1px); }

    @media (max-width:520px){ .m2v2-carta { width:44px; height:62px; } .m2v2-ov-txt { font-size:30px; } }
  `;
  document.head.appendChild(s);
})();

if (typeof window !== "undefined") { window.iniciar2v2 = iniciar2v2; window.salir2v2 = salir2v2; }
