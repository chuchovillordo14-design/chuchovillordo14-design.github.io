// ══════════════════════════════════════════════════════════════
// AUTO1V1_CLIENT.JS — el "cerebro" de la mesa 1v1 autoritativa (beta).
//
// Punto 4 de la auditoría del online (2 ago), etapa 3: acá no hay motor
// corriendo en este navegador — el server (server/reglas/motor1v1.js +
// orquestador1v1.js) reparte, valida y resuelve todo. Este módulo solo:
//   - manda las acciones del jugador tal cual las espera el server
//     (netAuto1v1Accion, ver netClient.js), y
//   - guarda el ÚLTIMO snapshot redactado que llegó (A1.snapshot), que es
//     lo único que este cliente sabe de la partida — nunca la mano real
//     del rival, ni siquiera de paso.
//
// src/ui/auto1v1_ui.js pinta A1.snapshot; este archivo no toca el DOM.
// ══════════════════════════════════════════════════════════════

const A1 = {
  activa: false,       // hay una mesa en curso (creada o unida)
  codigo: null,
  config: { limite: 30, conFlor: false },
  snapshot: null,       // el último auto1v1_estado.snapshot recibido
  finalizado: null,     // { ganeYo } tras auto1v1_fin
  miNombre: "",         // vacío = que decida _auto1v1Identidad (y si no hay nada, el server pone "Anónimo")
  nivelMesa: null,      // estadio de la mesa (máx. de los dos), lo manda el server
  rivalNombre: "",      // nombre del otro asiento, lo manda el server
};

// ── Ciclo de vida ────────────────────────────────────────────────────
function auto1v1Reset() {
  A1.activa = false;
  A1.codigo = null;
  A1.snapshot = null;
  A1.finalizado = null;
  // Sin esto, la mesa siguiente arrancaba mostrando el estadio (y el
  // nombre) del rival anterior hasta que llegara el primer estado.
  A1.nivelMesa = null;
  A1.rivalNombre = "";
}

// Identidad de ESTA mesa: el token de dispositivo que ya usa el ranking
// (_netIdentidad, src/online/reporte_resultado.js) + el nombre con el que
// el jugador se sentó acá, que puede no ser el del perfil (el lobby tiene
// su propio campo). Sin el token el server guarda la partida pero no se la
// puede sumar a nadie.
function _auto1v1Identidad() {
  let yo = {};
  try { if (typeof _netIdentidad === "function") yo = _netIdentidad() || {}; } catch (e) {}
  return { token: yo.token, nombre: String(A1.miNombre || yo.nombre || "").slice(0, 20) };
}

async function auto1v1Crear(config) {
  A1.finalizado = null;
  if (!NET.conectado) await netConectar();
  netAuto1v1Crear(config, _auto1v1Identidad());
}

async function auto1v1Unirse(codigo) {
  A1.finalizado = null;
  if (!NET.conectado) await netConectar();
  netAuto1v1Unirse(codigo, _auto1v1Identidad());
}

function auto1v1Salir() {
  if (typeof netDesconectar === "function") netDesconectar();
  auto1v1Reset();
}

// ── Acciones de juego (una función chica por tipo — todas mandan la
// acción tal cual y dejan que el SERVER decida si es legal; el cliente
// no duplica las reglas, solo decide qué botones mostrar como sugerencia
// — ver _auto1v1Puede* en auto1v1_ui.js, que son heurísticas, no la
// autoridad real). Si el server rechaza algo, llega "auto1v1_error" y la
// UI muestra un toast — no debería pasar con un cliente honesto, pero no
// tiene nada de raro si pasa (doble click, snapshot viejo en pantalla).
function auto1v1JugarCarta(idx) { netAuto1v1Accion({ tipo: "jugarCarta", idx }); }
function auto1v1CantarEnvido(tipo) { netAuto1v1Accion({ tipo: "cantarEnvido", valor: tipo }); }
function auto1v1SubirEnvido(tipo) { netAuto1v1Accion({ tipo: "subirEnvido", valor: tipo }); }
function auto1v1CantarFlor() { netAuto1v1Accion({ tipo: "cantarFlor" }); }
function auto1v1PasarFlor() { netAuto1v1Accion({ tipo: "pasarFlor" }); }
function auto1v1ResponderFlor(tipo) { netAuto1v1Accion({ tipo: "responderFlor", valor: tipo }); }
function auto1v1CantarTruco(nivel) { netAuto1v1Accion({ tipo: "cantarTruco", valor: nivel }); }
function auto1v1SubirTruco(nivel) { netAuto1v1Accion({ tipo: "subirTruco", valor: nivel }); }
function auto1v1TrucoConFlor() { netAuto1v1Accion({ tipo: "trucoConFlor" }); }
function auto1v1TrucoConEnvido(tipo) { netAuto1v1Accion({ tipo: "trucoConEnvido", valor: tipo }); }
function auto1v1EnvidoConFlor() { netAuto1v1Accion({ tipo: "envidoConFlor" }); }
function auto1v1ResponderCanto(acepta) { netAuto1v1Accion({ tipo: "responderCanto", acepta }); }
function auto1v1IrseAlMazo() { netAuto1v1Accion({ tipo: "irseAlMazo" }); }

// ── Eventos de red ────────────────────────────────────────────────────
netOn("auto1v1_creada", (d) => {
  A1.activa = true;
  A1.codigo = d.codigo;
  A1.config = d.config;
  if (typeof _auto1v1Render === "function") _auto1v1Render();
});

netOn("auto1v1_unido", (d) => {
  A1.activa = true;
  A1.codigo = d.codigo;
  A1.config = d.config;
  if (typeof _auto1v1Render === "function") _auto1v1Render();
});

netOn("auto1v1_estado", (d) => {
  if (!A1.activa) return;
  A1.snapshot = d.snapshot;
  // Nivel de estadio de la MESA (el máximo de los dos asientos, lo calcula
  // el server): con esto los dos ven exactamente el mismo fondo. Llega en
  // cada estado, así que también queda bien después de una reconexión.
  if (d.nivelMesa) A1.nivelMesa = d.nivelMesa;
  // Contra quién estoy jugando (lo manda el server desde la identidad del
  // otro asiento; su token nunca sale del server).
  if (typeof d.rivalNombre === "string") A1.rivalNombre = d.rivalNombre;
  // La partida se juega en la MESA REAL (la misma de Picadito): el estado
  // del server se traduce y se aplica ahí. Ver src/online/auto1v1_mesa.js.
  // El _auto1v1Render() de abajo queda como respaldo por si ese módulo no
  // cargó — sin él la mesa quedaría muda y no habría dónde jugar.
  if (typeof auto1v1MesaAplicar === "function") { auto1v1MesaAplicar(d); return; }
  if (typeof _auto1v1Render === "function") _auto1v1Render();
});

netOn("auto1v1_fin", (d) => {
  if (!A1.activa) return;
  A1.finalizado = { ganeYo: !!d.ganeYo };
  if (typeof _auto1v1Render === "function") _auto1v1Render();
});

// Definitivo: venció la ventana de gracia del server (o nunca hubo
// partida que preservar) — ver abandonarSala en server.js. No hay más
// reconexión posible, recién acá se cierra la mesa del lado del cliente.
netOn("auto1v1_rival_desconectado", () => {
  if (!A1.activa) return;
  if (typeof showToast === "function") showToast("⚠️ El rival se desconectó. La mesa se cerró.");
  // Solo llega con la partida SIN resolver (ver abandonarSala en
  // server.js), así que no puede pisarle a nadie la tarjeta de fin de
  // partido: si el rival se va después de terminar, este evento no sale.
  const enMesaReal = (typeof A1MESA !== "undefined" && A1MESA.abierta);
  auto1v1Reset();
  if (enMesaReal) {
    if (typeof auto1v1MesaCerrar === "function") auto1v1MesaCerrar();
    if (typeof irA === "function") irA("main-menu");
    return;
  }
  if (typeof _auto1v1Render === "function") _auto1v1Render();
});

// Temporal: el rival se cayó pero el server todavía está esperando que
// vuelva (ventana de gracia) — la mesa sigue viva, solo pausada.
netOn("auto1v1_rival_reconectando", () => {
  if (!A1.activa) return;
  if (typeof showToast === "function") showToast("⚠️ El rival se desconectó. Esperando que vuelva...", 4000);
});

netOn("auto1v1_rival_reconectado", () => {
  if (!A1.activa) return;
  if (typeof showToast === "function") showToast("✅ Tu rival se reconectó.");
});

netOn("auto1v1_reconectado", () => {
  if (!A1.activa) return;
  if (typeof showToast === "function") showToast("✅ Te reconectaste a la mesa.");
});

netOn("auto1v1_error", (mensaje) => {
  if (!A1.activa) return;
  if (typeof showToast === "function") showToast("⚠️ " + (mensaje || "Acción inválida."), 2600);
});

// Errores genéricos del server (código inexistente, mesa llena) — el
// mismo canal "error" que usa el resto del online. Solo pasa en el lobby
// (código inexistente, mesa llena) — los rechazos de una acción durante
// la partida usan el canal aparte "auto1v1_error", no este.
netOn("error", (mensaje) => {
  if (typeof _auto1v1MostrarErrorLobby === "function") _auto1v1MostrarErrorLobby(mensaje);
});

// netClient.js decide con "seVaAReconectar" si conviene reintentar solo
// (mesa auto1v1 activa con NET.auto1v1 seteado, ver netClient.js). Antes
// esto tiraba la mesa abajo con CUALQUIER corte — un blip de wifi bastaba
// para perder la partida aunque el server la hubiera dejado pausada
// esperando. Ahora solo se resetea si de verdad no hay reintento en curso.
netOn("close", (info) => {
  if (!A1.activa) return;
  if (info && info.seVaAReconectar) {
    if (typeof showToast === "function") showToast("⚠️ Se cortó la conexión — reconectando...");
    return;
  }
  if (typeof showToast === "function") showToast("⚠️ Se cortó la conexión con el servidor.");
  auto1v1Reset();
  if (typeof _auto1v1Render === "function") _auto1v1Render();
});

netOn("reconectando", (info) => {
  if (!A1.activa) return;
  if (typeof showToast === "function") showToast(`🔄 Reconectando... (intento ${info.intento}/${info.maxIntentos})`);
});

netOn("reconexion_fallida", () => {
  if (!A1.activa) return;
  if (typeof showToast === "function") showToast("⚠️ No se pudo reconectar. Volvé a intentarlo desde el menú.");
  auto1v1Reset();
  if (typeof _auto1v1Render === "function") _auto1v1Render();
});
