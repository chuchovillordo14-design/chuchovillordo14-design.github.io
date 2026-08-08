// ══════════════════════════════════════════════════════════════
// REPORTE DE RESULTADO — cada cliente manda su propio reporte del
// resultado final al servidor (confirmación doble: ver plan del bot
// de torneos, server/resultado.js). El HOST se engancha acá al evento
// 'finDePartido' del motor real (juego.js). El GUEST nunca corre ese
// motor — se reporta desde motor_online.js, en el mismo punto donde
// ya detecta juegoTerminado sobre el estado espejado recibido.
// ══════════════════════════════════════════════════════════════

// Arma el payload en marco ABSOLUTO host/guest (no relativo jugador/rival):
// si los dos jugaron honesto, el reporte del host y el del guest deben
// coincidir byte a byte pese a partir de perspectivas opuestas de S.
function _netArmarPayloadResultado(puntosJugador, puntosRival, limite) {
  const esHost = NET.rol === "host";
  const puntosHost  = esHost ? puntosJugador : puntosRival;
  const puntosGuest = esHost ? puntosRival   : puntosJugador;
  return {
    puntosHost, puntosGuest, limite,
    ganador: puntosHost > puntosGuest ? "host" : "guest",
  };
}

// Identidad para el RANKING semanal. Va SEPARADA del payload comparado a
// propósito: host y guest tienen nombres distintos, así que meterla adentro
// haría que compararReportes() diera "discrepancia" en TODAS las partidas.
//
// El nombre POR DEFECTO no cuenta como nombre. S.nombreJugador arranca en
// NOMBRE_DEFAULT ("Vos") para todo el que nunca pasó por Ajustes, así que
// mandarlo tal cual llenaba el ranking del grupo de filas "🥇 Vos — 5
// ganadas" — que además de leerse mal junta a varios jugadores distintos
// bajo la misma etiqueta. Mandando "" el server pone "Anónimo", que es lo
// que ya hace con cualquier nombre vacío. La mesa autoritativa ya tenía
// esta defensa (_auto1v1MiNombre en auto1v1_ui.js); esto la trae al relay.
function _netIdentidad() {
  let token;
  try { token = (typeof getDeviceToken === "function") ? getDeviceToken() : undefined; } catch (e) {}
  let nombre = "";
  try {
    // Genérico = el default de hoy o el nombre heredado que se dejó de
    // usar. Si el de S es genérico todavía puede haber uno elegido en
    // localStorage (el lobby del 2v2 lo guarda ahí), así que se prueba
    // antes de rendirse.
    const generico = (n) => !n ||
      (typeof NOMBRE_DEFAULT !== "undefined" && n === NOMBRE_DEFAULT) ||
      (typeof _NOMBRE_HEREDADO !== "undefined" && n === _NOMBRE_HEREDADO);
    const deS = (typeof S !== "undefined" && S.nombreJugador) || "";
    nombre = !generico(deS) ? deS : (localStorage.getItem("truco_nombre") || "");
    if (generico(nombre)) nombre = "";
  } catch (e) { nombre = ""; }
  return { token, nombre: String(nombre).slice(0, 20) };
}

function reportarResultadoOnline(puntosJugador, puntosRival, limite) {
  if (!S.modoOnline || typeof netReportarResultado !== "function") return;
  // En la mesa autoritativa no se reporta nada: el resultado lo dicta el
  // server, que corrió el motor, y ya lo persistió y se lo pasó al ranking
  // y al cuadro de torneo cuando terminó la partida. Mandar además el
  // reporte del relay sería un mensaje que el server descarta (esas salas
  // no tienen `rol`) y que encima podría confundir a quien lea los logs.
  if (S.modoAuto1v1) return;
  netReportarResultado(_netArmarPayloadResultado(puntosJugador, puntosRival, limite), _netIdentidad());
}

// Lado host: juego.js dispara este evento al llegar al límite de puntos.
if (typeof onJuego === "function") {
  onJuego("finDePartido", (payload) => {
    reportarResultadoOnline(payload.puntosJugador, payload.puntosRival, payload.limite);
  });
}
