// ══════════════════════════════════════════════════════════════
// ESCENARIOS — la mesa donde jugás, atada a cuánto progresaste.
//
// ANTES: un interruptor binario en Ajustes (PALCO sí/no) y nada más. No
// entraba un tercero: el estado era una clase que se ponía o se sacaba.
//
// Y al mismo tiempo el juego YA TENÍA la escalera que hacía falta:
// NIVELES_ESTADIO en features_progression.js —Potrero → Cancha de Club →
// Estadio Chico → Grande → Monumental— que sube con las victorias. Pero
// `getNivelEstadio()` no lo leía NADIE fuera del modal que lo muestra como
// texto: podías llegar al Monumental y seguir jugando en la misma mesa.
//
// Acá los escenarios pasan a ser DATOS con su nivel de desbloqueo, y el que
// ves sale de esa escalera. Sumar uno es agregar un renglón a ESCENARIOS y
// su CSS scopeado, no tocar tres archivos.
//
// ⚠️ CÓMO SE APILA EL CSS (es lo que mató al escenario de pulpería):
// mesa_futbol.css y mesa_realismo.css NO están scopeados: son la BASE y se
// aplican siempre. Cada escenario es una capa de overrides bajo su propia
// clase de body — `body.tema-x #mesa` (1-1-1) le gana a `#mesa` (1-0-0).
// Escenario nuevo = TODAS sus reglas bajo `body.tema-<id>`. Sin excepciones.
//
// ⚠️⚠️ PERO CON EL FONDO LA ESPECIFICIDAD NO ALCANZA, y esta es la trampa:
// mesa_realismo.css declara `#mesa { background: ...9 capas... !important }`.
// Contra un !important no hay selector que gane, así que un escenario que
// intente pisar `background` NO PUEDE hacerlo sin poner su propio !important
// — y esa es exactamente la guerra de !important que mató a la pulpería.
//
// Por eso el fondo NO se pone por CSS: se declara en `fondo` acá abajo y este
// módulo inyecta un <img> detrás de la mesa, que es lo que el palco venía
// haciendo a mano. Un elemento aparte no compite con `background`: no hay
// nada que pisar. Escenario con fondo propio = campo `fondo`, nunca
// background-image.
// ══════════════════════════════════════════════════════════════
(function () {
  const LS      = "tg_escenario";     // id elegido, o "auto"
  const LS_VIEJO = "tg_tema_palco";   // el interruptor que esto reemplaza

  // `nivel` = nivel de NIVELES_ESTADIO desde el que se desbloquea.
  // `listo` = tiene su arte y su CSS. Los que no, NO se ofrecen: un escenario
  // en la lista sin CSS propio se ve idéntico al clásico y parece un bug.
  // El orden de la lista NO decide nada: manda `nivel`. Ver resolver().
  //
  // El clásico va en nivel 0 a propósito: está siempre disponible para
  // elegirlo a mano, pero no puede ser lo que "Automático" te muestre —
  // es la mesa sin escenario, el punto de partida técnico y no un escalón.
  //
  // La escalera offline llega hasta nv6 (Monumental) — completa, sin
  // escalones sin arte. nv6 solo es alcanzable sin club fundado
  // (CLUB_INST_MAX=5 en club.js). El palco NO es un escalón — es el
  // escenario del online, ver su entrada.
  const ESCENARIOS = [
    { id:"clasico", nombre:"Clásico",  emoji:"🟩", clase:"",            nivel:0, listo:true,
      desc:"La mesa de siempre, césped y nada más." },
    { id:"potrero", nombre:"Potrero",  emoji:"⚽",  clase:"tema-potrero", nivel:1, listo:true,
      fondo:"escenarios/potrero.svg",
      desc:"Tierra, alambrado y dos arcos de caño." },
    { id:"club",    nombre:"Cancha de Club", emoji:"🏠", clase:"tema-club", nivel:2, listo:true,
      fondo:"escenarios/club.svg",
      desc:"Pasto disparejo y tribuna de tablones." },
    // nv3-6: vista aérea de la cancha (tribunas a los costados, franja
    // central despejada para las cartas) en vez de la vista de tribuna del
    // potrero/club — pedido de Chucho el 3 ago para que las cartas nunca
    // tapen a la gente. Generadas con Draw Things + corregidas a mano (la
    // línea vertical espuria que el modelo insistía en dibujar en el medio
    // de la cancha, ver escenografia-3d/).
    { id:"estadio-chico", nombre:"Estadio Chico", emoji:"🏟️", clase:"tema-estadio-chico", nivel:3, listo:true,
      fondo:"escenarios/estadio_chico.webp",
      desc:"Ya tenés tribuna local." },
    // 5 ago: arte nuevo (vista aérea real de estadio lleno, generado con el
    // prompt de marketing/PROMPTS_IMAGENES.md). Va en .webp y no .png como
    // el resto de la escalera: el mismo cuadro pesa 288 KB contra 1,7 MB
    // en PNG, y este fondo se carga en CADA partida del nivel 4. Los otros
    // escenarios siguen en PNG hasta que se renueven igual.
    { id:"estadio-grande", nombre:"Estadio Grande", emoji:"🌟", clase:"tema-estadio-grande", nivel:4, listo:true,
      fondo:"escenarios/estadio_grande.webp",
      desc:"El estadio retumba." },
    { id:"bombonera", nombre:"La Bombonera", emoji:"👑", clase:"tema-bombonera", nivel:5, listo:true,
      fondo:"escenarios/bombonera.webp",
      desc:"Esta no tiembla: late." },
    // nv6: el techo en anillo (no torres sueltas) y el confeti lo separan
    // visualmente del resto — es el único de la escalera offline que en la
    // práctica casi nadie ve con club fundado (CLUB_INST_MAX=5 en club.js),
    // solo llega quien corta las 100 victorias SIN fundar club.
    { id:"monumental", nombre:"Monumental", emoji:"🏆", clase:"tema-monumental", nivel:6, listo:true,
      fondo:"escenarios/monumental.webp",
      desc:"El más grande del continente." },
    // El palco (la cancha renderizada sobre la mesa) ERA el escenario
    // exclusivo del online (pedido del 2-ago). Desde el 4-ago el online
    // muestra el estadio del más avanzado de los dos, así que el palco se
    // quedaba SIN NINGUNA vía de acceso: con `soloOnline` estaba fuera de
    // la escalera Y de la elección manual, o sea directamente inalcanzable.
    // Ahora es elegible a mano, como el Clásico: nivel 0 (nunca lo elige el
    // "Automático", que busca el nivel más alto) pero siempre disponible.
    { id:"palco",   nombre:"Palco",    emoji:"🏟️", clase:"tema-palco",  nivel:0, listo:true,
      desc:"La cancha en la mesa, vista desde el palco." },
  ];

  const disponibles = () => ESCENARIOS.filter((e) => e.listo && !e.soloOnline);
  const porId = (id) => ESCENARIOS.find((e) => e.id === id) || null;

  /* De dónde sale el nivel del escenario. Hay DOS progresiones de estadio en
     el juego y no son la misma cosa:

       · club.instalaciones.estadio — la instalación que CONSTRUÍS y pagás en
         el modo Fundar Club (1 a 5), a la que además le ponés nombre propio.
       · NIVELES_ESTADIO — la escalera global por victorias totales, que se
         muestra en el modal "Mi Estadio".

     Si fundaste club MANDA EL CLUB: el escenario es el estadio que levantaste
     vos, no un premio por partidos sueltos. Sin club se cae a la escalera
     global, que es lo único que existe en ese caso.

     Devuelve { nivel, fuente } — la fuente la usa el cartel del candado para
     decirte cómo se desbloquea, que cambia según cuál mande. */
  function origenNivel() {
    try {
      if (typeof window.getEstadioClub === "function") {
        const c = window.getEstadioClub();
        if (c && c.fundado) return { nivel: c.nivel || 1, fuente: "club" };
      }
    } catch (e) { /* club no cargado */ }
    try {
      if (typeof window.getNivelEstadioActual === "function") {
        const n = window.getNivelEstadioActual();
        if (n && n.nivel) return { nivel: n.nivel, fuente: "global" };
      }
    } catch (e) { /* progresión no cargada todavía */ }
    return { nivel: 1, fuente: "global" };
  }

  function nivelActual() { return origenNivel().nivel; }

  function desbloqueado(esc) { return nivelActual() >= esc.nivel; }

  /* Qué escenario corresponde. "auto" = el más alto que tengas desbloqueado,
     que es lo que hace que la mesa acompañe el progreso sin que el jugador
     tenga que ir a tocar nada. */
  function elegido() {
    const guardado = (typeof lsGet === "function") ? lsGet(LS, null) : null;

    // Migración del interruptor viejo. Sin esto, al que tenía el palco
    // apagado a propósito se le vuelve a encender solo, que es justo el tipo
    // de "le pisamos la preferencia" que ya nos pasó con el nombre.
    if (!guardado) {
      const viejo = (typeof lsGet === "function") ? lsGet(LS_VIEJO, null) : null;
      if (viejo === "0") return porId("clasico");
      return "auto";
    }
    if (guardado === "auto") return "auto";
    const esc = porId(guardado);
    return (esc && esc.listo && !esc.soloOnline && desbloqueado(esc)) ? esc : "auto";
  }

  /* ── Modos SOCIALES: siempre estadio con gente (4 ago 2026) ──────────
     Pedido de Chucho: Picadito, Partido Amistoso y las partidas online se
     juegan SIEMPRE en un estadio lleno; el Potrero y la Cancha de Club
     quedan para el MODO DT, que es donde la escalera significa algo
     (ahí se ve el progreso partido a partido).

     El motivo es de producto, no técnico: con el menú reducido, Picadito es
     la primera —y para muchos la única— pantalla del juego, y un jugador
     nuevo (nivel 1) caía en tierra y alambrado. La escalera no se toca: el
     que ya tiene un estadio más alto sigue viendo el suyo, esto es un PISO,
     no un valor fijo.

     Modo DT = no está prendida ninguna de estas banderas. Copas, Mundial y
     Carrera siguen con la escalera de siempre a propósito: son progresión.
     (La mesa 1v1 del server —"JUGAR CON UN AMIGO"— pinta en su propia UI
     `a1-*`, no en #mesa, así que no entra por acá.) */
  const NIVEL_ESTADIO_MIN = 3;   // Estadio Chico: el primero con tribuna llena

  function esModoSocial() {
    if (typeof S !== "undefined" && S.modoOnline) return true;
    if (typeof window !== "undefined" && window.modoPicadito) return true;
    // modoAmistoso es un `let` de nivel superior de equipos.js (scope léxico
    // compartido entre <script> clásicos), no una propiedad de window.
    if (typeof modoAmistoso !== "undefined" && modoAmistoso) return true;
    return false;
  }

  /* El piso en sí. Simétrico entre los dos clientes del online: la
     constante es fija y no depende de nada local. */
  function _pisoEstadio(esc) {
    if (esc && esc.nivel >= NIVEL_ESTADIO_MIN) return esc;
    return porId("estadio-chico") || esc;
  }

  /* Lo aplica solo si el modo lo pide (lo que usa resolver()). */
  function conPisoDeEstadio(esc) {
    return esModoSocial() ? _pisoEstadio(esc) : esc;
  }

  /* En automático gana el de MAYOR `nivel` entre los desbloqueados, no el
     último de la lista. Elegir por posición fue un bug real: con el palco en
     nivel 1 y la cancha de club en 2, apenas se desbloqueaba el club el palco
     —el escenario más trabajado— no volvía a mostrarse nunca. El orden del
     array es cosmético; el que ordena es el nivel. */
  function resolver() { return conPisoDeEstadio(_resolverEscalera()); }

  function _resolverEscalera() {
    // Partida online activa (1v1): la mesa es el estadio del MÁS AVANZADO de
    // los dos (pedido de Chucho, 4 ago — antes era siempre el palco).
    // Sigue siendo UNA sola mesa para ambos: el cálculo es simétrico
    // (max de los dos niveles) y NO entra la elección manual de nadie, así
    // que los dos clientes llegan al mismo escenario sin negociar nada.
    // El nivel del rival llega en el handshake "hola" y ya viene saturado
    // a 1-6 en motor_online.js. Mientras no llegó, vale el propio: el
    // escenario se re-resuelve solo cuando entra (escenarioSincronizar).
    if (typeof S !== "undefined" && S.modoOnline) {
      const mio   = nivelActual();
      const suyo  = (typeof ONLINE !== "undefined" && ONLINE.nivelRival) || 1;
      const tope  = Math.max(mio, suyo);
      const hasta = disponibles().filter((e) => e.nivel > 0 && e.nivel <= tope);
      if (!hasta.length) return porId("clasico");
      return hasta.reduce((a, b) => (b.nivel > a.nivel ? b : a));
    }
    const e = elegido();
    if (e !== "auto") return e;
    const abiertos = disponibles().filter(desbloqueado);
    if (!abiertos.length) return porId("clasico");
    return abiertos.reduce((a, b) => (b.nivel > a.nivel ? b : a));
  }

  /* Monta o saca el <img> de fondo. Va como elemento y no como
     background-image por el !important de mesa_realismo.css (ver el
     encabezado). Como <img> además avisa por consola si el archivo no llega,
     cosa que un background nunca hace. */
  function _fondo(esc) {
    const mesa = document.getElementById("mesa");
    const viejo = document.getElementById("esc-fondo");
    if (viejo) viejo.remove();
    if (!mesa || !esc || !esc.fondo) return;
    const img = document.createElement("img");
    img.id = "esc-fondo";
    img.src = esc.fondo;
    img.alt = "";
    img.draggable = false;
    img.onerror = () => console.warn("[escenarios] no cargó el fondo:", esc.fondo);
    mesa.prepend(img);
  }

  /* Aplica el escenario: saca las clases de TODOS y pone la del elegido.
     Sacarlas todas y no solo la anterior es a propósito — si alguien deja
     una clase colgada a mano o queda de una sesión vieja, esto la limpia. */
  function aplicar(esc) {
    ESCENARIOS.forEach((e) => { if (e.clase) document.body.classList.remove(e.clase); });
    if (esc && esc.clase) document.body.classList.add(esc.clase);
    _fondo(esc);
    // El palco tiene capas de DOM propias (fondo, marcador, slots) que se
    // crean y destruyen aparte; su módulo escucha esto.
    document.dispatchEvent(new CustomEvent("escenarioCambiado", { detail: { id: esc ? esc.id : "clasico" } }));
    if (typeof actualizarTodaLaInterfaz === "function") actualizarTodaLaInterfaz();
  }

  window.escenarioActual = () => resolver();
  window.escenarioEsActivo = (id) => resolver().id === id;

  /* El escenario para una pantalla que NO es #mesa y que ya sabe que es
     social — hoy la mesa 1v1 del server ("JUGAR CON UN AMIGO"), que se
     pinta entera en auto1v1_ui.js y por eso nunca pasó por acá. Devuelve
     siempre con el piso de estadio aplicado, sin depender de banderas de
     modo: quien la llama es, por definición, una partida contra otra
     persona (por eso usa _pisoEstadio directo y no conPisoDeEstadio, que
     antes mira las banderas — desde esa pantalla no hay ninguna prendida).

     Con `nivelMesa` (el máximo de los dos asientos, que calcula el server y
     manda en cada auto1v1_estado) los DOS jugadores resuelven el mismo
     escenario: la cuenta es la misma de los dos lados y no entra nada
     local. Sin argumento —lobby, antes de que entre el rival— vale el
     nivel propio. */
  window.escenarioSocial = (nivelMesa) => {
    const n = Math.round(Number(nivelMesa));
    if (!Number.isFinite(n) || n < 1) return _pisoEstadio(_resolverEscalera());
    const tope = Math.min(n, 6);
    const hasta = disponibles().filter((e) => e.nivel > 0 && e.nivel <= tope);
    const mejor = hasta.length ? hasta.reduce((a, b) => (b.nivel > a.nivel ? b : a)) : porId("clasico");
    return _pisoEstadio(mejor);
  };

  // El nivel de estadio propio, para mandarlo en el handshake del online.
  window.escenarioNivelActual = () => nivelActual();

  // Recalcula y aplica el escenario resuelto YA, sin tocar la preferencia
  // guardada. El polling de "render" de más abajo cubre la mayoría de las
  // entradas/salidas de partida online, pero solo corre durante un ciclo de
  // render activo — si se sale del online por un camino que no dispara uno
  // (ej. _onlineResetEstadoPartida cuando el jugador ya volvió al menú), el
  // body se queda con la clase/fondo del palco pegados. Los puntos de salida
  // del online llaman esto explícitamente para no depender de esa carrera.
  window.escenarioSincronizar = () => aplicar(resolver());

  window.escenarioElegir = function (id) {
    const esc = porId(id);
    if (id !== "auto" && (!esc || !esc.listo || !desbloqueado(esc))) return;
    if (typeof lsPut === "function") lsPut(LS, id);
    const final = resolver();
    aplicar(final);
    _pintarSelector();
    if (typeof showToast === "function") {
      showToast(id === "auto" ? "Escenario automático: sigue tu progreso" : _textoToast(final));
    }
  };

  /* nv3-5 (Estadio Chico/Grande/Bombonera): el cartel dice "ESTADIO: <nombre
     del nivel>" en vez de "Escenario: <nombre>" — pedido del 3 ago.
     ⚠️ Se probó usar club.estadioNombre (el nombre propio del club, ej.
     "Estadio de Villordo") pero Chucho lo rechazó el mismo día: NO mostrar
     ahí el nombre real/apellido del jugador. Usar SIEMPRE el nombre
     genérico del nivel, nunca datos del club. El resto de los escenarios
     (Potrero/Club/Clásico/Palco) no cambia. */
  function _textoToast(esc) {
    if (esc.nivel >= 3 && !esc.soloOnline) return `🏟️ ESTADIO: ${esc.nombre}`;
    return `Escenario: ${esc.nombre}`;
  }

  /* ── Selector en Ajustes ──────────────────────────────────────────── */
  function _pintarSelector() {
    const grid = document.getElementById("esc-grid");
    if (!grid) return;
    const sel = elegido();
    const activo = resolver();
    const tarjeta = (id, emoji, nombre, desc, marcado, bloqueado, nivelReq) =>
      `<button type="button" class="esc-card${marcado ? " sel" : ""}${bloqueado ? " lock" : ""}"
         ${bloqueado ? "disabled" : `onclick="escenarioElegir('${id}')"`}>
         <span class="esc-emoji">${bloqueado ? "🔒" : emoji}</span>
         <span class="esc-nom">${nombre}</span>
         <span class="esc-desc">${bloqueado ? `Se abre en ${nivelReq}` : desc}</span>
       </button>`;

    grid.innerHTML =
      tarjeta("auto", "✨", "Automático", `Ahora: ${activo.nombre}`, sel === "auto", false, "") +
      disponibles().map((e) => {
        const abierto = desbloqueado(e);
        const nivelReq = nombreNivel(e.nivel);
        return tarjeta(e.id, e.emoji, e.nombre, e.desc, sel !== "auto" && sel.id === e.id, !abierto, nivelReq);
      }).join("");
    // Acá había una tarjeta FIJA del Palco, bloqueada, que decía "El escenario
    // de las partidas online". Se sacó el 4 ago por dos motivos: el texto ya
    // era falso (desde ese día el online muestra el estadio del más avanzado
    // de los dos) y el Palco pasó a ser elegible a mano, así que `disponibles()`
    // de arriba ya lo pinta — quedaba DUPLICADO, una vez elegible y otra
    // bloqueado contradiciéndose.
  }

  /* Nombre del nivel para el cartel "se abre en…". Se LEE de la escalera real
     en vez de copiarla acá: una segunda lista con los mismos nombres es
     exactamente la "lista acoplada" que este proyecto ya pagó varias veces —
     alguien renombra un estadio de un lado y el candado sigue prometiendo el
     nombre viejo del otro. Pasó al reemplazar Wembley por La Bombonera. */
  function nombreNivel(n) {
    // Con club fundado el desbloqueo NO depende de victorias sino de la
    // instalación, así que el cartel tiene que mandarte al lugar correcto:
    // decir "se abre en Cancha de Club" a alguien que lo desbloquea pagando
    // una mejora es mandarlo a hacer lo que no es.
    if (origenNivel().fuente === "club") return `Estadio nv${n} del club`;
    try {
      if (typeof window.getEscalaEstadios === "function") {
        const e = window.getEscalaEstadios().find((x) => x.nivel === n);
        if (e) return e.nombre;
      }
    } catch (err) { /* progresión todavía no cargada */ }
    return "nivel " + n;
  }

  function _crearSelector() {
    const cont = document.querySelector("#settings-modal .modal-box");
    if (!cont || document.getElementById("esc-selector")) return;
    // El botón viejo de palco se va: lo reemplaza esta galería.
    const viejo = document.getElementById("btn-tema-palco");
    if (viejo) viejo.remove();

    const wrap = document.createElement("div");
    wrap.id = "esc-selector";
    wrap.innerHTML = `<div class="esc-titulo">🏟 ESCENARIO</div><div class="esc-grid" id="esc-grid"></div>`;
    cont.appendChild(wrap);
    _pintarSelector();
  }

  document.addEventListener("DOMContentLoaded", () => {
    aplicar(resolver());
    _crearSelector();
    // El nivel sube al ganar: si el escenario es automático, la mesa tiene que
    // acompañar sin esperar a que recargue la página.
    if (typeof onJuego === "function") {
      onJuego("finDePartido", () => {
        if (elegido() === "auto") aplicar(resolver());
        _pintarSelector();
      });
      onJuego("modalAbierto", (d) => { if (d && d.id === "settings-modal") { _crearSelector(); _pintarSelector(); } });
    }
    // Mejorar el estadio del club sube el escenario en el acto. Sin esto
    // pagabas la mejora, volvías a la mesa y estaba igual hasta terminar el
    // próximo partido.
    document.addEventListener("clubEstadioMejorado", () => {
      if (elegido() === "auto") aplicar(resolver());
      _pintarSelector();
    });
    // Entrar o salir de una partida online —o de un modo social (Picadito /
    // Amistoso, que ahora tienen piso de estadio)— cambia el escenario en el
    // acto. Se mira en cada render (barato: dos booleanos) porque ninguna de
    // esas banderas emite un evento propio: S.modoOnline lo prende
    // motor_online y lo apaga juego_online en momentos distintos, y
    // modoPicadito/modoAmistoso las mueve equipos.js sin avisar.
    let _clavePrev = "";
    if (typeof onJuego === "function") {
      onJuego("render", () => {
        const on = !!(typeof S !== "undefined" && S.modoOnline);
        const clave = (on ? "1" : "0") + (esModoSocial() ? "1" : "0");
        if (clave !== _clavePrev) { _clavePrev = clave; aplicar(resolver()); }
      });
    }
  });
})();
