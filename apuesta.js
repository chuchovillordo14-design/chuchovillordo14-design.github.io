// ══════════════════════════════════════════════════════════════
// APUESTA.JS — Coordinador de partidas TrucoGOL
//
// MODELO: PAGO DIRECTO perdedor → ganador. El organizador NO custodia
// el pozo ni cobra comisión sobre él (eso lo convertiría en "banca" y
// dispara regulación de juego + riesgo de que MP le congele la cuenta).
// La app solo COORDINA: arma la apuesta, anota el resultado y le dice a
// cada perdedor cuánto transferirle directo al ganador.
//
// FLUJO:
//   1. El organizador arma la sala: buy-in por jugador (lo que arriesga
//      cada uno) + jugadores con su alias MP.
//   2. Se juega — TrucoGOL registra el resultado.
//   3. Al terminar: cada PERDEDOR transfiere su buy-in DIRECTO al alias
//      del GANADOR. Aporte al organizador = opcional/voluntario.
// ══════════════════════════════════════════════════════════════

// ─────────────────────────────────────────────────────────────
// CONFIG PERMANENTE DEL ORGANIZADOR
// ─────────────────────────────────────────────────────────────
const CASA = {
  alias:     localStorage.getItem("casa_alias")      || "",
  nombre:    localStorage.getItem("casa_nombre")     || "TrucoGOL",
  comision:  parseFloat(localStorage.getItem("casa_comision") || "0"), // aporte OPCIONAL %
};

function casaGuardar() {
  lsSet("casa_alias",     CASA.alias);
  lsSet("casa_nombre",    CASA.nombre);
  lsSet("casa_comision",  CASA.comision);
}

// ─────────────────────────────────────────────────────────────
// PREVIEW DEL POZO
// ─────────────────────────────────────────────────────────────
function casaActualizarPozo() {
  const buyin = parseFloat(document.getElementById("sala-buyin")?.value) || 0;
  const pct   = parseFloat(document.getElementById("casa-comision-inp")?.value) || 0;
  const aporte = Math.round(buyin * pct / 100); // colaboración OPCIONAL, sobre el buy-in

  // Pago DIRECTO: por cada mano se arriesga UN buy-in. Ganás +buy-in del rival,
  // perdés -buy-in. Vale igual en 1v1 y en cada partida de un torneo. No hay
  // "pozo central" (eso sería banca), por eso mostramos el riesgo por jugador.
  const f = v => `$${v.toLocaleString("es-AR")}`;
  _setText("pv-arriesga", f(buyin));
  _setText("pv-gana", `+${f(buyin)}`);
  _setText("pv-pierde", `-${f(buyin)}`);

  const note = document.getElementById("pv-aporte-note");
  if (note) note.style.display = aporte ? "inline" : "none";
  _setText("pv-aporte", f(aporte));
}

function casaTipoChange() { casaActualizarPozo(); }

// ─────────────────────────────────────────────────────────────
// ESTADO DE LA SALA ACTIVA
// ─────────────────────────────────────────────────────────────
const SALA = {
  activa:    false,
  tipo:      "1v1",      // "1v1" | "torneo"
  buyin:     0,          // monto que paga cada jugador
  jugadores: [],         // [{nombre, aliasMP, pago:false}]
  iniciada:  false,      // true cuando todos pagaron y se habilitó jugar
};

// ─────────────────────────────────────────────────────────────
// ABRIR PANEL ORGANIZADOR (reemplaza modales anteriores)
// ─────────────────────────────────────────────────────────────
function casaAbrirPanel(modo) {
  // Pre-seleccionar tipo si viene del menú
  if (modo) {
    const sel = document.getElementById("sala-tipo");
    if (sel) {
      if (modo === "1v1")    sel.value = "1v1";
      if (modo === "torneo") sel.value = "torneo4";
    }
  }
  _casaRellenar();
  document.getElementById("casa-modal")?.classList.add("show");
}
function casaCerrar() {
  document.getElementById("casa-modal")?.classList.remove("show");
}

function _casaRellenar() {
  const inpAlias  = document.getElementById("casa-alias-inp");
  const inpNombre = document.getElementById("casa-nombre-inp");
  const inpCom    = document.getElementById("casa-comision-inp");
  if (inpAlias)  inpAlias.value  = CASA.alias;
  if (inpNombre) inpNombre.value = CASA.nombre;
  if (inpCom)    inpCom.value    = CASA.comision;
  _casaRenderJugadores();
  _casaActualizarEstado();
  casaActualizarPozo();

  // Mostrar/ocultar botón cerrar sala
  const btnCerrar = document.getElementById("btn-cerrar-sala");
  if (btnCerrar) btnCerrar.style.display = SALA.activa ? "block" : "none";
}

function casaGuardarConfig() {
  CASA.alias    = (document.getElementById("casa-alias-inp")?.value  || "").trim();
  CASA.nombre   = (document.getElementById("casa-nombre-inp")?.value || "").trim() || "TrucoGOL";
  CASA.comision = parseFloat(document.getElementById("casa-comision-inp")?.value) || 0;
  casaGuardar();
  casaActualizarPozo();
  showToast("✅ Datos del organizador guardados", 1600);
}

// ─────────────────────────────────────────────────────────────
// GESTIÓN DE JUGADORES EN LA SALA
// ─────────────────────────────────────────────────────────────
function casaAgregarJugador() {
  const nombre = (document.getElementById("sala-j-nombre")?.value || "").trim();
  const alias  = (document.getElementById("sala-j-alias")?.value  || "").trim();
  if (!nombre) { showToast("Ingresá el nombre", 1400); return; }
  if (SALA.jugadores.length >= 8) { showToast("Máximo 8 jugadores", 1400); return; }
  if (SALA.jugadores.find(j => j.nombre === nombre)) {
    showToast("Ya existe ese jugador", 1400); return;
  }
  SALA.jugadores.push({ nombre, aliasMP: alias, pago: false });
  const inpN = document.getElementById("sala-j-nombre");
  const inpA = document.getElementById("sala-j-alias");
  if (inpN) inpN.value = "";
  if (inpA) inpA.value = "";
  if (inpN) inpN.focus(); // listo para tipear el siguiente
  _casaRenderJugadores();
  _casaActualizarEstado();
}

function casaQuitarJugador(idx) {
  SALA.jugadores.splice(idx, 1);
  _casaRenderJugadores();
}

function casaTogglePago(idx) {
  SALA.jugadores[idx].pago = !SALA.jugadores[idx].pago;
  _casaRenderJugadores();
  _casaActualizarEstado();
}

function _casaRenderJugadores() {
  const lista = document.getElementById("sala-lista");
  if (!lista) return;
  if (SALA.jugadores.length === 0) {
    lista.innerHTML = `<div class="sa-empty">Agregá los jugadores de esta partida</div>`;
    return;
  }
  lista.innerHTML = SALA.jugadores.map((j, i) => `
    <div class="sa-jugador ${j.pago ? 'pagado' : 'pendiente'}">
      <div class="sa-jugador-info">
        <span class="sa-jugador-nombre">${esc(j.nombre)}${esMoroso(j) ? ` <span class="sa-moroso" title="Quedó debiendo en una partida anterior">⚠️ MOROSO</span>` : ""}</span>
        ${j.aliasMP ? `<span class="sa-jugador-alias">💳 @${esc(j.aliasMP)}</span>` : ""}
      </div>
      <button class="sa-pago-btn ${j.pago ? 'confirmado' : ''}"
              onclick="casaTogglePago(${i})"
              title="${j.pago ? 'Marcar como NO confirmado' : 'Confirmar que este jugador entra a la apuesta'}">
        ${j.pago ? "✅ ADENTRO" : "⏳ CONFIRMAR"}
      </button>
      ${!SALA.iniciada ? `<button class="g-quitar" onclick="casaQuitarJugador(${i})">✕</button>` : ""}
    </div>`).join("");

  // Resumen: cuántos confirmaron que juegan y el pozo total en juego.
  const confirmados = SALA.jugadores.filter(j => j.pago).length;
  const total       = SALA.jugadores.length;
  const pot         = total * SALA.buyin;
  const resumen     = document.getElementById("sala-resumen");
  if (resumen) {
    resumen.innerHTML = `
      <span class="${confirmados === total ? 'ok' : 'warn'}">
        ${confirmados}/${total} confirmados
      </span>
      <span class="pot">💰 En juego: $${pot.toLocaleString("es-AR")}</span>`;
  }
}

function _casaActualizarEstado() {
  const btnIniciar  = document.getElementById("sala-btn-iniciar");
  const btnCompartir = document.getElementById("sala-btn-compartir");
  if (!btnIniciar || !btnCompartir) return;

  const todosPagaron = SALA.jugadores.length >= 2 &&
                       SALA.jugadores.every(j => j.pago);

  btnIniciar.disabled   = !todosPagaron || SALA.iniciada;
  btnCompartir.disabled = SALA.jugadores.length < 1 || SALA.buyin <= 0;
}

// ─────────────────────────────────────────────────────────────
// CREAR SALA
// ─────────────────────────────────────────────────────────────
function casaCrearSala() {
  const buyin = parseFloat(document.getElementById("sala-buyin")?.value) || 0;
  if (buyin <= 0) { showToast("Ingresá el monto del buy-in", 1600); return; }
  // El alias del organizador ya NO es obligatorio: la plata va directo al
  // ganador, no a Chucho. Solo hace falta el alias de cada jugador.

  SALA.activa    = true;
  SALA.iniciada  = false;
  SALA.buyin     = buyin;
  SALA.tipo      = document.getElementById("sala-tipo")?.value || "1v1";
  SALA.comision  = parseFloat(document.getElementById("casa-comision-inp")?.value) || CASA.comision;
  SALA.jugadores = [];
  SALA.bracket   = [];  // para torneos

  _casaRenderJugadores();
  _casaActualizarEstado();
  showToast(`✅ Sala creada — $${buyin} buy-in`, 1600);
  _casaBadgeActualizar();

  // Mostrar sección de bracket si es torneo
  const brackets = document.getElementById("torneo-bracket-section");
  if (brackets) brackets.style.display = SALA.tipo !== "1v1" ? "block" : "none";
}

function casaCerrarSala() {
  SALA.activa   = false;
  SALA.iniciada = false;
  SALA.jugadores = [];
  SALA.bracket   = [];
  _casaBadgeActualizar();
  casaCerrar();
  showToast("Sala cerrada", 1400);
}

// ─────────────────────────────────────────────────────────────
// COMPARTIR INSTRUCCIONES DE PAGO por WhatsApp
// ─────────────────────────────────────────────────────────────
function casaCompartirInstrucciones() {
  if (SALA.buyin <= 0) { showToast("Configurá el buy-in primero", 1600); return; }

  const nombres = SALA.jugadores.map(j => `• ${j.nombre}`).join("\n") || "• (jugadores por confirmar)";
  const msg =
`🎴⚽ *TRUCO GOL — Convocatoria*
━━━━━━━━━━━━━━━
📋 Jugadores:
${nombres}
━━━━━━━━━━━━━━━
💰 Apuesta: *$${SALA.buyin.toLocaleString("es-AR")} por cabeza*
━━━━━━━━━━━━━━━
💸 *Cómo se paga:* el que pierde le transfiere
$${SALA.buyin.toLocaleString("es-AR")} *directo al ganador* (a su alias MP).
Nadie paga por adelantado a un tercero.
━━━━━━━━━━━━━━━
🏆 Ganador se lleva todo el pozo de los perdedores.
Partida registrada en *TrucoGOL*. 🎴⚽`;

  const url = `https://wa.me/?text=${encodeURIComponent(msg)}`;
  window.open(url, "_blank", "noopener");
}

// Compartir instrucción individual a un jugador específico
function casaCompartirAJugador(idx) {
  const j = SALA.jugadores[idx];
  if (!j) return;

  const msg =
`🎴 *TRUCO GOL — ${j.nombre}, quedás anotado*
Apuesta: *$${SALA.buyin.toLocaleString("es-AR")} por cabeza*.
💸 Si perdés, le transferís ese monto *directo al ganador*.
Si ganás, cada perdedor te paga a vos.
${j.aliasMP ? `Tu alias MP cargado: *${j.aliasMP}*` : "⚠️ Pasame tu alias MP para poder anotarlo."}
¡Nos vemos en la mesa! ⚽`;

  const url = `https://wa.me/?text=${encodeURIComponent(msg)}`;
  window.open(url, "_blank", "noopener");
}

// ─────────────────────────────────────────────────────────────
// INICIAR PARTIDA (todos pagaron)
// ─────────────────────────────────────────────────────────────
function casaIniciarPartida() {
  const todosPagaron = SALA.jugadores.every(j => j.pago);
  if (!todosPagaron) { showToast("⚠️ Hay pagos pendientes", 1800); return; }
  SALA.iniciada = true;
  casaCerrar();
  showToast(`🎯 ¡A jugar! Cada mano vale $${SALA.buyin.toLocaleString("es-AR")} — pago directo al ganador`, 2800);
  _casaBadgeActualizar();
}

// ─────────────────────────────────────────────────────────────
// LEDGER DE MOROSOS — la única defensa real contra el que no paga.
// Como la app no puede FORZAR el pago (es P2P), lo que hace es dejar
// marcado por alias/nombre a quien quedó debiendo. Ese ⚠️ MOROSO le
// aparece la próxima vez que lo agregan a una sala: castigo social.
// ─────────────────────────────────────────────────────────────
const MOROSOS_KEY = "tg_morosos";
function _morosoKey(j)  { return ((j.aliasMP || j.nombre) || "").trim().toLowerCase(); }
function _morososGet()  { try { return JSON.parse(localStorage.getItem(MOROSOS_KEY) || "{}"); } catch (_) { return {}; } }
function _morososSave(m) { try { localStorage.setItem(MOROSOS_KEY, JSON.stringify(m)); } catch (_) {} }
function esMoroso(j)    { return !!_morososGet()[_morosoKey(j)]; }
function marcarMoroso(j, debe) {
  const m = _morososGet(), k = _morosoKey(j);
  if (!k) return;
  if (debe) m[k] = { nombre: j.nombre, alias: j.aliasMP || "", desde: Date.now() };
  else      delete m[k];
  _morososSave(m);
}

// Renderiza en el overlay de resultado la lista de perdedores con un
// toggle "✅ pagó / ⚠️ me debe" por cada uno.
function _casaRenderCobros(perdedorObj) {
  const cont = document.getElementById("cp-cobros");
  if (!cont) return;
  // Pago directo: en cada partida hay UN solo perdedor (el rival) que le
  // transfiere el buy-in al ganador. Antes listaba a TODOS los no-ganadores,
  // lo que en un torneo mostraba deudores que no jugaron esa partida.
  const perdedores = (perdedorObj && perdedorObj.nombre) ? [perdedorObj] : [];
  if (!perdedores.length) { cont.innerHTML = ""; return; }

  cont.innerHTML = `<div class="cp-cobros-tit">¿Quién ya te pagó?</div>` +
    perdedores.map(j => {
      const idx  = SALA.jugadores.indexOf(j);
      const debe = esMoroso(j);
      return `<div class="cp-cobro-row ${debe ? "debe" : ""}">
        <span class="cp-cobro-nombre">${esc(j.nombre)}${j.aliasMP ? ` <span class="cp-cobro-alias">@${esc(j.aliasMP)}</span>` : ""}</span>
        <button class="cp-cobro-btn ${debe ? "rojo" : "ok"}" onclick="casaToggleCobro(${idx})">
          ${debe ? "⚠️ ME DEBE" : "✅ PAGÓ"}
        </button>
      </div>`;
    }).join("");
}

function casaToggleCobro(idx) {
  const j = SALA.jugadores[idx];
  if (!j) return;
  marcarMoroso(j, !esMoroso(j)); // toggle: pagó ↔ me debe
  const modal = document.getElementById("casa-pago-modal");
  _casaRenderCobros(modal ? modal._ganador : "");
}

// ─────────────────────────────────────────────────────────────
// RESULTADO — dónde transferir al ganador
// ─────────────────────────────────────────────────────────────
// Resuelve ganador/perdedor por POSICIÓN en la sala, no por string frágil
// (antes, si S.nombreJugador no matcheaba EXACTO una entrada, mostraba el alias
// MP equivocado → plata al que no ganó). El jugador local es el que matchea su
// nombre, o el asiento 0 si no matchea (el organizador suele ser el local). En
// 1v1 el rival es el otro asiento, sin ambigüedad. Devuelve objetos reales de
// la sala (con su aliasMP), nunca un fantasma.
function _casaGanadorPerdedor(nombreJ, ganoJ) {
  const js = SALA.jugadores || [];
  const norm = s => ((s || "") + "").trim().toLowerCase();
  let idxLocal = js.findIndex(j => norm(j.nombre) === norm(nombreJ));
  if (idxLocal < 0) idxLocal = 0;
  let idxRival;
  if (js.length === 2) idxRival = idxLocal === 0 ? 1 : 0;
  else idxRival = js.findIndex((j, i) => i !== idxLocal);
  const local = js[idxLocal] || {}, rival = js[idxRival] || {};
  return ganoJ ? { ganadorObj: local, perdedorObj: rival }
               : { ganadorObj: rival, perdedorObj: local };
}

function casaMostrarPago(ptsJ, ptsR) {
  if (!SALA.activa || !SALA.iniciada) return;

  const modal = document.getElementById("casa-pago-modal");
  if (!modal) return;

  // Modelo del app (ver convocatoria): pago DIRECTO por partida — el que
  // pierde ESA partida le transfiere UN buy-in al que ganó, nada de pozo
  // central ni "todos le pagan al campeón". Vale igual para 1v1 y para cada
  // partida de un torneo.
  const pct         = (SALA.comision ?? CASA.comision) || 0;
  const aporte      = Math.round(SALA.buyin * pct / 100);         // opcional, sobre el buy-in transferido
  const recibe      = SALA.buyin;                                 // un buy-in, del rival de esta partida
  const ganoJugador = ptsJ > ptsR;

  const nombreJ = (typeof S !== "undefined" ? S.nombreJugador : "Jugador") || "Jugador";
  const { ganadorObj: gObj, perdedorObj: pObj } = _casaGanadorPerdedor(nombreJ, ganoJugador);
  const ganadorNombre = (gObj && gObj.nombre) || "Rival";
  const ganadorObj = (gObj && gObj.nombre) ? gObj : null;
  const perdedores  = 1;                                          // un solo rival por partida

  _setText("cp-marcador", `${ptsJ} - ${ptsR}`);
  _setText("cp-ganador",  ganadorNombre);
  _setText("cp-pot",      `$${recibe.toLocaleString("es-AR")}`);
  _setText("cp-comision", aporte ? `$${aporte.toLocaleString("es-AR")} (opc.)` : "—");

  const aliasEl = document.getElementById("cp-alias");
  const btnMP   = document.getElementById("cp-btn-mp");
  if (ganadorObj?.aliasMP) {
    // Cada perdedor le transfiere el buy-in a ESTE alias (el del ganador).
    aliasEl.textContent   = `💳 ${perdedores} perdedor(es) transfieren $${SALA.buyin.toLocaleString("es-AR")} c/u a: ${ganadorObj.aliasMP}`;
    aliasEl.style.display = "block";
    if (btnMP) {
      btnMP.style.display = "block";
      btnMP.onclick = () => window.open(`https://mpago.la/${ganadorObj.aliasMP}`, "_blank", "noopener");
    }
  } else {
    aliasEl.textContent   = "⚠️ El ganador no tiene alias MP cargado — pídanselo para cobrar.";
    aliasEl.style.display = "block";
    if (btnMP) btnMP.style.display = "none";
  }

  modal._ganador  = ganadorNombre;
  modal._pot      = recibe;
  modal._comision = aporte;
  modal._alias    = ganadorObj?.aliasMP || "";
  modal._buyin    = SALA.buyin;

  // Ledger: quién le debe al ganador de ESTA partida (solo su rival).
  _casaRenderCobros(pObj);

  // Registrar en bracket si es torneo
  if (SALA.tipo !== "1v1") {
    _torneoRegistrarResultado(ganoJugador ? nombreJ : ganadorNombre,
                              ganoJugador ? ganadorNombre : nombreJ);
    _torneoRenderBracket();
  }

  modal.classList.add("show");
}

function casaPagoCerrar() {
  document.getElementById("casa-pago-modal")?.classList.remove("show");
}

function casaCompartirPago() {
  const modal = document.getElementById("casa-pago-modal");
  if (!modal) return;
  const { _ganador, _pot, _comision, _alias, _buyin } = modal;
  const pagoLinea  = _alias
    ? `\n💸 El perdedor transfiere *$${(_buyin||0).toLocaleString("es-AR")}* a: *${_alias}*`
    : `\n💸 El perdedor le paga *$${(_buyin||0).toLocaleString("es-AR")}* al ganador.`;
  const aporteLinea = _comision ? `\n🤝 Aporte al organizador (opcional): $${(_comision||0).toLocaleString("es-AR")}` : "";
  const msg =
`🏆 *TRUCO GOL — Resultado Oficial*
━━━━━━━━━━━━━━━
🥇 Ganador: *${_ganador}*
💰 Recibe en total: *$${(_pot||0).toLocaleString("es-AR")}*${pagoLinea}${aporteLinea}
━━━━━━━━━━━━━━━
La plata va directo perdedor → ganador.
Partida registrada en *TrucoGOL* 🎴⚽`;

  const url = `https://wa.me/?text=${encodeURIComponent(msg)}`;
  window.open(url, "_blank", "noopener");
}

// ─────────────────────────────────────────────────────────────
// BRACKET DE TORNEO
// ─────────────────────────────────────────────────────────────
function _torneoRegistrarResultado(ganador, perdedor) {
  if (!SALA.bracket) SALA.bracket = [];
  SALA.bracket.push({ ganador, perdedor, ts: Date.now() });
}

function _torneoRenderBracket() {
  const el = document.getElementById("torneo-bracket");
  if (!el || !SALA.bracket?.length) return;
  el.innerHTML = SALA.bracket.map((r, i) => `
    <div style="display:flex;align-items:center;gap:8px;padding:6px 0;
                border-bottom:1px solid rgba(255,255,255,.06);font-size:12px;">
      <span style="color:rgba(255,255,255,.4);font-size:10px;width:20px;">P${i+1}</span>
      <span style="color:#27ae60;font-weight:bold;">🏆 ${r.ganador}</span>
      <span style="color:rgba(255,255,255,.3);">vs</span>
      <span style="color:#e74c3c;">❌ ${r.perdedor}</span>
    </div>`).join("");
}

function casaCompartirBracket() {
  if (!SALA.bracket?.length) { showToast("No hay partidas registradas aún", 1400); return; }
  const lineas = SALA.bracket.map((r, i) => `P${i+1}: 🏆 ${r.ganador} vs ❌ ${r.perdedor}`);
  const n      = SALA.tipo === "torneo6" ? 6 : 4;
  const msg =
`🎴 *TRUCO GOL — Bracket Torneo ${n} jugadores*
Buy-in: $${SALA.buyin.toLocaleString("es-AR")} c/u
━━━━━━━━━━━━━━━
${lineas.join("\n")}
━━━━━━━━━━━━━━━
🏠 Organizador: *${CASA.nombre}*
Supervisado en *TrucoGOL* 🎴⚽`;

  const url = `https://wa.me/?text=${encodeURIComponent(msg)}`;
  window.open(url, "_blank", "noopener");
}

// ─────────────────────────────────────────────────────────────
// BADGE y helpers UI
// ─────────────────────────────────────────────────────────────
function _casaBadgeActualizar() {
  const badge = document.getElementById("casa-badge");
  if (!badge) return;
  if (!SALA.activa) { badge.style.display = "none"; return; }
  const pagados = SALA.jugadores.filter(j => j.pago).length;
  const total   = SALA.jugadores.length;
  const pot     = pagados * SALA.buyin;
  badge.style.display = "flex";
  badge.innerHTML = SALA.iniciada
    ? `🎯 $${pot.toLocaleString("es-AR")} en juego`
    : `💰 ${pagados}/${total} pagaron`;
}

// ─────────────────────────────────────────────────────────────
// HOOK AL FIN DE PARTIDA
// ─────────────────────────────────────────────────────────────
if (typeof onJuego === "function") {
  onJuego("finDePartido", (data) => {
    if (SALA.activa && SALA.iniciada) {
      setTimeout(() => casaMostrarPago(data.puntosJugador, data.puntosRival), 1800);
    }
  });
  onJuego("nuevoPartido", () => {
    // No resetear la sala automáticamente — el organizador decide cuándo cerrarla
  });
}

// ─────────────────────────────────────────────────────────────
// CSS
// ─────────────────────────────────────────────────────────────
(function _apuestaCSS() {
  const s = document.createElement("style");
  s.textContent = `
    /* ── Badge sala activa ── */
    #casa-badge {
      display: none;
      align-items: center;
      gap: 4px;
      font-family: var(--f-ui, 'Oswald', sans-serif);
      font-size: 10px; letter-spacing: 1px;
      background: linear-gradient(135deg,rgba(200,168,75,.2),rgba(200,168,75,.05));
      border: 1px solid rgba(200,168,75,.6);
      color: var(--gold, #f5c518);
      padding: 4px 12px;
      border-radius: 20px;
      position: fixed;
      top: 10px; left: 50%; transform: translateX(-50%);
      z-index: 80; cursor: pointer;
      box-shadow: 0 2px 12px rgba(0,0,0,.4);
    }

    /* ── Filas de jugadores en la sala ── */
    .sa-empty {
      text-align:center; color:rgba(255,255,255,.35);
      font-size:12px; padding:14px 0;
    }
    .sa-jugador {
      display:flex; align-items:center; gap:8px;
      padding:8px 0;
      border-bottom:1px solid rgba(255,255,255,.06);
    }
    .sa-jugador.pagado  { opacity:1; }
    .sa-jugador.pendiente { opacity:.8; }
    .sa-moroso {
      display:inline-block; font-size:9px; font-weight:700; letter-spacing:.5px;
      color:#fff; background:#c0392b; padding:1px 6px; border-radius:10px;
      margin-left:6px; vertical-align:middle;
    }
    /* Ledger de cobros en el overlay de resultado */
    .cp-cobros-tit {
      font-size:11px; letter-spacing:1px; color:rgba(255,255,255,.5);
      text-transform:uppercase; margin:6px 0 6px; text-align:center;
    }
    .cp-cobro-row {
      display:flex; align-items:center; justify-content:space-between;
      gap:8px; padding:6px 10px; margin-bottom:6px; border-radius:8px;
      background:rgba(255,255,255,.04); border:1px solid rgba(255,255,255,.08);
    }
    .cp-cobro-row.debe { border-color:rgba(192,57,43,.5); background:rgba(192,57,43,.1); }
    .cp-cobro-nombre { font-size:13px; color:#fff; }
    .cp-cobro-alias  { font-size:11px; color:rgba(255,255,255,.4); }
    .cp-cobro-btn {
      font-size:11px; font-weight:700; padding:5px 10px; border-radius:20px;
      border:none; cursor:pointer; white-space:nowrap;
    }
    .cp-cobro-btn.ok   { background:rgba(39,174,96,.2);  color:#2ecc71; }
    .cp-cobro-btn.rojo { background:rgba(192,57,43,.25); color:#ff6b5e; }
    .sa-jugador-info    { flex:1; display:flex; flex-direction:column; gap:1px; }
    .sa-jugador-nombre  { font-size:13px; color:#fff; font-weight:500; }
    .sa-jugador-alias   { font-size:11px; color:rgba(200,168,75,.75); }

    .sa-pago-btn {
      font-family:var(--f-ui,'Oswald',sans-serif);
      font-size:10px; letter-spacing:1px;
      padding:5px 10px; border-radius:20px; border:none;
      cursor:pointer; transition:all .15s;
      background:rgba(255,255,255,.08); color:rgba(255,255,255,.5);
    }
    .sa-pago-btn.confirmado {
      background:rgba(39,174,96,.2); color:#27ae60;
      border:1px solid rgba(39,174,96,.4);
    }
    .sa-pago-btn:hover { filter:brightness(1.2); }

    /* Resumen de pagos */
    #sala-resumen {
      display:flex; justify-content:space-between;
      align-items:center;
      font-family:var(--f-ui,'Oswald',sans-serif);
      font-size:11px; letter-spacing:1px;
      padding:8px 0; margin-top:4px;
    }
    #sala-resumen .ok   { color:#27ae60; }
    #sala-resumen .warn { color:#e67e22; }
    #sala-resumen .pot  { color:var(--gold,#f5c518); font-size:12px; }

    /* ── Modal de pago al ganador ── */
    .cp-titulo {
      font-family:var(--f-display,'Bebas Neue',sans-serif);
      font-size:32px; color:var(--gold,#f5c518);
      text-align:center; margin-bottom:4px;
    }
    .cp-marcador {
      font-size:18px; text-align:center;
      color:rgba(255,255,255,.6); margin-bottom:14px;
    }
    .cp-box {
      background:rgba(0,0,0,.35);
      border:1px solid rgba(200,168,75,.3);
      border-radius:12px; padding:16px;
      text-align:center; margin-bottom:14px;
    }
    .cp-box .lbl { font-size:11px; color:rgba(255,255,255,.45); letter-spacing:1px; }
    .cp-box .ganador {
      font-family:var(--f-display,'Bebas Neue',sans-serif);
      font-size:28px; color:#fff; margin:4px 0;
    }
    .cp-box .pot {
      font-family:var(--f-display,'Bebas Neue',sans-serif);
      font-size:40px; color:#27ae60; margin:4px 0;
    }
    .cp-alias {
      font-size:13px; color:#3498db;
      margin-top:6px; display:none;
    }
    .cp-instruccion {
      font-size:12px; color:rgba(255,255,255,.5);
      text-align:center; margin-bottom:12px;
      line-height:1.5;
    }
    .btn-wa  { background:#25D366!important; color:#fff!important; }
    .btn-mp  { background:#009EE3!important; color:#fff!important; }
    .g-quitar {
      background:none; border:none;
      color:rgba(255,255,255,.35); cursor:pointer;
      font-size:14px; padding:2px 6px;
    }
    .g-quitar:hover { color:#e74c3c; }

    /* Sección config del organizador */
    .casa-section {
      background:rgba(0,0,0,.25);
      border:1px solid rgba(200,168,75,.15);
      border-radius:10px; padding:12px;
      margin-bottom:14px;
    }
    .casa-section-title {
      font-family:var(--f-ui,'Oswald',sans-serif);
      font-size:10px; letter-spacing:2px;
      color:rgba(200,168,75,.7);
      margin-bottom:10px;
    }
  `;
  document.head.appendChild(s);
})();

document.addEventListener("DOMContentLoaded", () => {
  _casaBadgeActualizar();
  rankingCargar();
  historialCargar();
});

// ═══════════════════════════════════════════════════════════════
// RANKING DE JUGADORES
// Persiste en localStorage. Se actualiza automáticamente al
// cerrar cada sala con un ganador registrado.
// ═══════════════════════════════════════════════════════════════

let RANKING = []; // [{nombre, alias, victorias, derrotas, ganado, perdido}]

function rankingCargar() {
  try { RANKING = JSON.parse(localStorage.getItem("casa_ranking") || "[]"); }
  catch(e) { RANKING = []; }
}

function rankingGuardar() {
  lsSet("casa_ranking", JSON.stringify(RANKING));
}

function _rankingGetOrCreate(nombre, alias) {
  let j = RANKING.find(r => r.nombre === nombre);
  if (!j) {
    j = { nombre, alias: alias || "", victorias: 0, derrotas: 0, ganado: 0, perdido: 0 };
    RANKING.push(j);
  }
  if (alias) j.alias = alias;
  return j;
}

function rankingRegistrar(ganador, perdedor, montoGanador, buyin) {
  rankingCargar();
  const g = _rankingGetOrCreate(ganador.nombre, ganador.aliasMP);
  const p = _rankingGetOrCreate(perdedor.nombre, perdedor.aliasMP);
  g.victorias++;
  g.ganado += montoGanador;
  p.derrotas++;
  p.perdido += buyin;
  rankingGuardar();
}

function rankingAbrirModal() {
  rankingCargar();
  _rankingRender();
  document.getElementById("ranking-modal")?.classList.add("show");
}

function rankingCerrar() {
  document.getElementById("ranking-modal")?.classList.remove("show");
}

function _rankingRender() {
  const lista = document.getElementById("rank-lista");
  if (!lista) return;

  if (RANKING.length === 0) {
    lista.innerHTML = `<div class="sa-empty">Todavía no hay partidas registradas</div>`;
    return;
  }

  const sorted = [...RANKING].sort((a, b) => {
    // Primero por victorias, luego por ganado
    if (b.victorias !== a.victorias) return b.victorias - a.victorias;
    return b.ganado - a.ganado;
  });

  lista.innerHTML = sorted.map((j, i) => {
    const total   = j.victorias + j.derrotas;
    const pct     = total ? Math.round(j.victorias / total * 100) : 0;
    const medalla = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i+1}.`;
    return `
    <div class="rank-row ${i < 3 ? 'top' : ''}">
      <span class="rank-pos">${medalla}</span>
      <div class="rank-info">
        <div class="rank-nombre">${esc(j.nombre)}</div>
        ${j.alias ? `<div class="rank-alias">💳 @${esc(j.alias)}</div>` : ""}
      </div>
      <div class="rank-stats">
        <span class="rank-v">${j.victorias}V</span>
        <span class="rank-d">${j.derrotas}D</span>
        <span class="rank-pct">${pct}%</span>
      </div>
      <div class="rank-ganado">
        <div style="color:#27ae60;font-size:12px;">+$${j.ganado.toLocaleString("es-AR")}</div>
        <div style="color:#e74c3c;font-size:10px;">-$${j.perdido.toLocaleString("es-AR")}</div>
      </div>
    </div>`;
  }).join("");
}

function rankingCompartirWA() {
  rankingCargar();
  if (!RANKING.length) { showToast("No hay ranking todavía", 1400); return; }
  const sorted = [...RANKING].sort((a,b) => b.victorias - a.victorias).slice(0, 8);
  const lineas = sorted.map((j, i) => {
    const med = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i+1}.`;
    return `${med} ${j.nombre} — ${j.victorias}V ${j.derrotas}D`;
  });
  const msg =
`🏆 *TRUCO GOL — Ranking de Jugadores*
━━━━━━━━━━━━━━━
${lineas.join("\n")}
━━━━━━━━━━━━━━━
Organizado por *${CASA.nombre}* 🎴⚽`;
  window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, "_blank", "noopener");
}

function rankingResetear() {
  if (!confirm("¿Resetear todo el ranking? No se puede deshacer.")) return;
  RANKING = [];
  rankingGuardar();
  _rankingRender();
  showToast("Ranking reseteado", 1400);
}

// ═══════════════════════════════════════════════════════════════
// QR DE PAGO — genera QR con el link de MP del organizador
// Usa la API gratuita de qrserver.com (sin SDK extra).
// ═══════════════════════════════════════════════════════════════

function qrAbrirModal() {
  if (!CASA.alias) {
    showToast("⚠️ Configurá tu alias de MP primero", 1800);
    casaAbrirPanel();
    return;
  }
  _qrRender(SALA.buyin || 0);
  document.getElementById("qr-modal")?.classList.add("show");
}

function qrCerrar() {
  document.getElementById("qr-modal")?.classList.remove("show");
}

function _qrRender(monto) {
  const alias    = CASA.alias;
  const mpUrl    = `https://mpago.la/${alias}`;
  const size     = 220;
  const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(mpUrl)}&bgcolor=0f1a0f&color=f5c518&margin=10`;

  const img = document.getElementById("qr-img");
  if (img) {
    img.src = qrApiUrl;
    img.alt = `QR Mercado Pago — ${alias}`;
  }

  _setText("qr-alias",   alias);
  _setText("qr-monto",   monto > 0 ? `$${monto.toLocaleString("es-AR")}` : "Monto a acordar");
  _setText("qr-nombre",  CASA.nombre);

  // Link directo
  const linkEl = document.getElementById("qr-link");
  if (linkEl) { linkEl.href = mpUrl; linkEl.textContent = mpUrl; }
}

function qrActualizarMonto() {
  const m = parseFloat(document.getElementById("qr-monto-inp")?.value) || 0;
  _qrRender(m);
}

function qrCompartirWA() {
  const monto = parseFloat(document.getElementById("qr-monto-inp")?.value) || 0;
  const montoLinea = monto > 0 ? `\n💰 Sugerido: *$${monto.toLocaleString("es-AR")}*` : "";
  const msg =
`🤝 *Aporte al organizador (opcional)*
━━━━━━━━━━━━━━━
Si querés bancar la organización, va con onda 🙌${montoLinea}
🔗 Escaneá el QR o entrá acá:
👉 https://mpago.la/${CASA.alias}
👤 *${CASA.nombre}* — TrucoGOL 🎴⚽`;
  window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, "_blank", "noopener");
}

// ═══════════════════════════════════════════════════════════════
// HISTORIAL DE SALAS
// Guarda cada sala cerrada con fecha, jugadores y resultado.
// ═══════════════════════════════════════════════════════════════

let HISTORIAL_SALAS = [];

function historialCargar() {
  try { HISTORIAL_SALAS = JSON.parse(localStorage.getItem("casa_historial") || "[]"); }
  catch(e) { HISTORIAL_SALAS = []; }
}

function historialGuardar() {
  // Mantener las últimas 50 salas
  if (HISTORIAL_SALAS.length > 50) HISTORIAL_SALAS = HISTORIAL_SALAS.slice(-50);
  lsSet("casa_historial", JSON.stringify(HISTORIAL_SALAS));
}

function historialRegistrarSala(ganador, potGanador, comMonto) {
  historialCargar();
  HISTORIAL_SALAS.push({
    fecha:      new Date().toLocaleDateString("es-AR"),
    hora:       new Date().toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" }),
    tipo:       SALA.tipo,
    buyin:      SALA.buyin,
    jugadores:  SALA.jugadores.map(j => j.nombre),
    ganador:    ganador,
    potGanador: potGanador,
    comMonto:   comMonto,
  });
  historialGuardar();
}

function historialAbrirModal() {
  historialCargar();
  _historialRender();
  document.getElementById("historial-modal")?.classList.add("show");
}

function historialCerrar() {
  document.getElementById("historial-modal")?.classList.remove("show");
}

function _historialRender() {
  const lista = document.getElementById("hist-lista");
  if (!lista) return;

  if (!HISTORIAL_SALAS.length) {
    lista.innerHTML = `<div class="sa-empty">No hay salas registradas todavía</div>`;
    return;
  }

  const recientes = [...HISTORIAL_SALAS].reverse();
  lista.innerHTML = recientes.map(s => {
    const tipoLabel = s.tipo === "1v1" ? "1v1" : s.tipo === "torneo4" ? "T×4" : "T×6";
    const jugadores = (s.jugadores || []).join(", ");
    return `
    <div class="hist-row">
      <div class="hist-fecha">${s.fecha} ${s.hora} · <span class="hist-tipo">${tipoLabel}</span></div>
      <div class="hist-jugadores">${jugadores}</div>
      <div class="hist-resultado">
        <span class="hist-ganador">🏆 ${s.ganador}</span>
        <span class="hist-pot">+$${(s.potGanador||0).toLocaleString("es-AR")}</span>
        <span class="hist-com">Aporte: $${(s.comMonto||0).toLocaleString("es-AR")}</span>
      </div>
    </div>`;
  }).join("");

  // Totales
  const totalComision = HISTORIAL_SALAS.reduce((s, h) => s + (h.comMonto || 0), 0);
  const totalSalas    = HISTORIAL_SALAS.length;
  _setText("hist-total-salas",    `${totalSalas} salas`);
  _setText("hist-total-comision", `$${totalComision.toLocaleString("es-AR")}`);
}

function historialLimpiar() {
  if (!confirm("¿Borrar todo el historial?")) return;
  HISTORIAL_SALAS = [];
  historialGuardar();
  _historialRender();
  showToast("Historial borrado", 1400);
}

// ─────────────────────────────────────────────────────────────
// HOOK: registrar ranking e historial al cerrar sala
// ─────────────────────────────────────────────────────────────
const _casaMostrarPagoOrig = casaMostrarPago;
// Extender casaMostrarPago para registrar datos al mostrarse el resultado
if (typeof onJuego === "function") {
  onJuego("finDePartido", (data) => {
    if (!SALA.activa || !SALA.iniciada) return;
    // Calculamos para guardar en historial/ranking
    setTimeout(() => {
      const potTotal   = SALA.jugadores.length * SALA.buyin;
      const pct        = (SALA.comision ?? CASA.comision) || 0;
      const aporte     = Math.round(potTotal * pct / 100);              // opcional
      const potGanador = Math.max(0, (SALA.jugadores.length - 1) * SALA.buyin); // pago directo
      const nombreJ    = (typeof S !== "undefined" ? S.nombreJugador : "") || "";
      const ganoJ      = data.puntosJugador > data.puntosRival;
      const { ganadorObj, perdedorObj } = _casaGanadorPerdedor(nombreJ, ganoJ);
      const ganadorNom = (ganadorObj && ganadorObj.nombre) || "Rival";

      rankingRegistrar(ganadorObj, perdedorObj, potGanador, SALA.buyin);
      historialRegistrarSala(ganadorNom, potGanador, aporte);
    }, 500);
  });
}

// CSS adicional para ranking, QR e historial
(function _extraCSS() {
  const s = document.createElement("style");
  s.textContent = `
    /* ── Ranking ── */
    .rank-row {
      display:flex; align-items:center; gap:8px;
      padding:8px 0; border-bottom:1px solid rgba(255,255,255,.06);
    }
    .rank-row.top .rank-nombre { color:var(--gold,#f5c518); }
    .rank-pos  { width:28px; font-size:16px; text-align:center; flex-shrink:0; }
    .rank-info { flex:1; }
    .rank-nombre { font-size:13px; color:#fff; font-weight:500; }
    .rank-alias  { font-size:10px; color:rgba(200,168,75,.6); }
    .rank-stats  { display:flex; gap:6px; font-family:var(--f-ui,'Oswald',sans-serif);
                   font-size:11px; letter-spacing:1px; }
    .rank-v    { color:#27ae60; }
    .rank-d    { color:#e74c3c; }
    .rank-pct  { color:rgba(255,255,255,.4); }
    .rank-ganado { text-align:right; font-family:var(--f-ui,'Oswald',sans-serif); }

    /* ── QR ── */
    #qr-img {
      display:block; margin:12px auto;
      border-radius:12px;
      border:3px solid rgba(200,168,75,.4);
      box-shadow:0 0 24px rgba(200,168,75,.2);
    }
    .qr-info {
      text-align:center;
      font-family:var(--f-ui,'Oswald',sans-serif);
      letter-spacing:1px;
    }
    .qr-alias-lbl { font-size:18px; color:var(--gold,#f5c518); margin:4px 0; }
    .qr-monto-lbl { font-size:22px; color:#27ae60; margin:2px 0; }
    .qr-link      { font-size:11px; color:#3498db; display:block;
                    margin-top:6px; word-break:break-all; text-decoration:none; }
    .qr-link:hover{ text-decoration:underline; }

    /* ── Historial ── */
    .hist-row {
      padding:10px 0; border-bottom:1px solid rgba(255,255,255,.06);
    }
    .hist-fecha    { font-size:10px; color:rgba(255,255,255,.4);
                     font-family:var(--f-ui,'Oswald',sans-serif); letter-spacing:1px; }
    .hist-tipo     { color:var(--gold,#f5c518); }
    .hist-jugadores{ font-size:12px; color:rgba(255,255,255,.6); margin:2px 0; }
    .hist-resultado{ display:flex; align-items:center; gap:10px; margin-top:4px; }
    .hist-ganador  { font-size:13px; color:#fff; font-weight:500; flex:1; }
    .hist-pot      { font-size:12px; color:#27ae60;
                     font-family:var(--f-ui,'Oswald',sans-serif); }
    .hist-com      { font-size:11px; color:rgba(200,168,75,.7);
                     font-family:var(--f-ui,'Oswald',sans-serif); }
    .hist-totales  {
      display:flex; justify-content:space-between;
      padding:10px 0;
      font-family:var(--f-ui,'Oswald',sans-serif);
      font-size:11px; letter-spacing:1px;
      border-top:1px solid rgba(200,168,75,.25);
      margin-top:6px;
    }
  `;
  document.head.appendChild(s);
})();
