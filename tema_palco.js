// ══════════════════════════════════════════════════════════════
// TEMA PALCO — activa el escenario del palco y le pone los números
// reales encima (2026-07-26).
//
// El fondo (palco-fondo.webp) trae la pizarra LOCAL/VISITA y el
// anotador dibujados, con números FALSOS horneados en la imagen
// (decían 2-1 y "R: 30"). Este módulo dibuja los de verdad encima,
// que es lo que convierte al marcador en un objeto de la mesa en vez
// de un panel flotante — la crítica que arrastrábamos del HUD viejo.
//
// Va como TEMA con interruptor: si en la pantalla de Chucho no cierra,
// se apaga desde Ajustes sin tocar código y vuelve el tema anterior.
// Todo el CSS está bajo `body.tema-palco` (styles/themes/mesa_palco.css).
// ══════════════════════════════════════════════════════════════
(function () {
  const LS = "tg_tema_palco";
  const activo = () => (typeof lsGet === "function" ? lsGet(LS, "1") : "1") === "1";
  // Quién manda es el selector de escenarios (src/ui/escenarios.js), no esta
  // clave vieja: `activo()` es SOLO el respaldo para si escenarios.js no
  // cargó todavía. Usarlo como gate principal fue el bug del 4 ago —
  // `lsGet(LS, "1")` por defecto da "1" (ON) para cualquiera que nunca tocó
  // el interruptor viejo, o sea casi todo el mundo hoy, así que pintar()
  // corría completo en CUALQUIER escenario y _reubicarEnSlots() secuestraba
  // el botón ☰ (y el de música) al contenedor del palco, oculto fuera de
  // ahí — "no hay opción para volver al menú" en cualquier cancha que no
  // fuera el palco.
  const esPalcoActivo = () => (typeof window.escenarioEsActivo === "function")
    ? window.escenarioEsActivo("palco")
    : activo();

  function _crearCapas() {
    const mesa = document.getElementById("mesa");
    if (!mesa || document.getElementById("palco-marcador")) return;

    // El fondo va como <img> DE VERDAD, no como background-image de CSS.
    // En la pantalla de Chucho el background no pintaba (mesa negra) pero
    // las <img> de la misma carpeta cargaban perfecto — mano-jugador.webp
    // se veía mientras el fondo no. Un <img> además avisa con onerror si
    // el archivo no llega, cosa que un background nunca hace. Va con
    // z-index:-1: dentro del stacking context de #mesa eso lo deja
    // encima del color de respaldo y debajo de TODO el contenido.
    const fondo = document.createElement("img");
    fondo.id = "palco-fondo-img";
    fondo.dataset.palcoLayer = "1";
    fondo.src = "escenografia-3d/palco-fondo-v5.webp";
    fondo.alt = "";
    fondo.draggable = false;
    fondo.onerror = function () {
      console.warn("[palco] no cargó el fondo:", fondo.src);
    };
    mesa.prepend(fondo);

    // AMBIENTE: el mismo arte, a pantalla completa y desenfocado, DETRÁS
    // de la mesa. El palco letterboxea a propósito (#mesa va pegada abajo
    // para que la barra quede al alcance del pulgar), pero en un celular
    // 9:19.5 esa franja se come el 38% de la pantalla y se veía como un
    // vacío negro plano. Usando la misma imagen los colores empalman solos
    // y la franja pasa a leerse como el estadio siguiendo hacia arriba.
    // Va en el <body>, NO en #mesa: adentro lo recortaría el overflow:hidden.
    // Y va como <img> por lo mismo que el fondo — el background-image de
    // CSS no pinta en la pantalla de Chucho.
    if (!document.getElementById("palco-ambiente")) {
      const amb = document.createElement("img");
      amb.id = "palco-ambiente";
      amb.dataset.palcoLayer = "1";
      amb.src = "escenografia-3d/palco-fondo-v5.webp";
      amb.alt = "";
      amb.draggable = false;
      document.body.prepend(amb);
    }

    const marc = document.createElement("div");
    marc.id = "palco-marcador";
    marc.dataset.palcoLayer = "1";
    marc.innerHTML = '<span id="palco-pts-j">0</span><span id="palco-pts-r">0</span>';
    mesa.appendChild(marc);

    const tantos = document.createElement("div");
    tantos.id = "palco-tantos";
    tantos.dataset.palcoLayer = "1";
    mesa.appendChild(tantos);

    // La mano que "sostiene" las cartas: imagen fija detrás de la fila.
    // No sostiene nada de verdad — los dedos caen sobre el borde inferior
    // de las cartas y la ilusión la completa el que mira.
    // La mano vive DENTRO de .zona-jugador, no en #mesa: su piso es el
    // techo de la barra de acciones en cualquier viewport, así que la
    // mano queda pegada al abanico siempre (anclada al arte con top:74%
    // se despegaba de las cartas en pantallas cortas, donde la barra
    // empuja el abanico hacia arriba). Posición y recorte en el CSS.
    const mano = document.createElement("div");
    mano.id = "palco-mano";
    mano.dataset.palcoLayer = "1";
    mano.innerHTML = '<img src="images/mano-jugador.webp" alt="" draggable="false">';
    (document.querySelector(".zona-jugador") || mesa).appendChild(mano);
  }

  function pintar() {
    if (!esPalcoActivo() || typeof S === "undefined") return;
    // El interval de 700ms corre para siempre en cualquier pantalla (menú,
    // anotador...) desde que carga la página. Sin salir temprano acá, cada
    // tick hacía el trabajo completo (_reubicarEnSlots + varios
    // getElementById) aunque #mesa estuviera oculta — CPU/DOM de fondo
    // indefinido si el jugador deja el Anotador abierto un rato largo.
    const mesaEl = document.getElementById("mesa");
    if (!mesaEl || mesaEl.style.display === "none") return;
    // En cada repintado (interval de 700ms + eventos) se re-muda lo que
    // haga falta: elementos que se crean tarde (el timer, el sponsor)
    // entran solos a su slot cuando aparecen. Es idempotente y barato.
    _reubicarEnSlots();
    const j = document.getElementById("palco-pts-j");
    const r = document.getElementById("palco-pts-r");
    // "LOCAL" es el jugador (el que está sentado a la mesa), "VISITA" el rival:
    // mismo orden en que están pintados en el arte.
    if (j) j.textContent = S.puntosJugador;
    if (r) r.textContent = S.puntosRival;
    const t = document.getElementById("palco-tantos");
    if (t) {
      const lim = S.limitePuntos || 30;
      // Los tantos del envido viven acá y no en la info-bar: el anotador
      // de papel es exactamente para anotar eso, y la barra de abajo
      // necesita su ancho completo para el mensaje de la mano (con
      // "Tantos: N" y "Mano: Fulano" adentro, el mensaje envolvía a dos
      // renglones y se comía las cartas del rival o el anotador).
      // Se LEE el texto que ya calculó el motor (renderizarPuntajes) en
      // vez de recalcular el envido: una sola fuente de verdad.
      const src = document.getElementById("info-tantos");
      const tantos = src ? src.textContent.replace(/^tantos:\s*/i, "").trim() : "";
      // DOS renglones CORTOS apilados ("A 30" / "TANTOS 27"): viven en el
      // casillero libre de la grilla del papel (ver #palco-tantos en el
      // CSS del arte v2), que es angosto — "PARTIDO A 30" no entraba.
      t.innerHTML = `A ${lim}` +
        (tantos && tantos !== "--" ? ` · <b>TANTOS ${tantos}</b>` : "");
    }
  }

  // ── SLOTS: el contrato de layout del palco ──────────────────────
  // La clase de bug que más nos costó: cada feature se auto-inyecta en
  // #mesa (o body) con coordenadas absolutas duras elegidas contra el
  // layout viejo — MODOS en bottom:130px, el timer en el centro del
  // abanico, el sponsor sobre la barra, cuatro botones apilados en la
  // misma esquina. En vez de perseguir cada elemento con CSS, el tema
  // define TRES lugares con nombre y muda ahí a los inquilinos:
  //   nav  → esquina superior derecha (menú ☰, música)
  //   dock → columna sobre la barra de acciones (MODOS, timer); cuelga
  //          de .zona-jugador porque su piso ES el techo de la barra,
  //          mida lo que mida (la barra crece al responder un canto)
  //   ads  → franja izquierda sobre el campo (sponsor)
  // Para sumar un feature nuevo a la mesa: UN selector acá. Nada de
  // coordenadas. La mudanza es reversible: se guarda el padre original
  // y aplicar(false) devuelve todo (los temas viejos posicionan estos
  // elementos con sus propias coordenadas, que siguen intactas).
  const SLOTS = {
    "palco-slot-nav":  { anclaje: "#mesa",         sel: [".mesa-menu-btn", "#amb-btn-musica"] },
    "palco-slot-dock": { anclaje: ".zona-jugador", sel: ["#fm-modos-panel", "#timer-jugador"] },
    "palco-slot-ads":  { anclaje: "#mesa",         sel: ["#fv-sponsor-banner"] },
  };
  const _mudados = [];

  function _reubicarEnSlots() {
    Object.keys(SLOTS).forEach((id) => {
      const cfg = SLOTS[id];
      const ancla = document.querySelector(cfg.anclaje);
      if (!ancla) return;
      let slot = document.getElementById(id);
      if (!slot) {
        slot = document.createElement("div");
        slot.id = id;
        ancla.appendChild(slot);
      } else if (slot.parentElement !== ancla) {
        ancla.appendChild(slot);
      }
      cfg.sel.forEach((s) => {
        const el = document.querySelector(s);
        if (!el || el.parentElement === slot) return;
        if (!el._palcoParentOrig) { el._palcoParentOrig = el.parentElement; _mudados.push(el); }
        slot.appendChild(el);
      });
    });
  }

  function _restaurarSlots() {
    _mudados.forEach((el) => {
      if (el._palcoParentOrig && el.parentElement !== el._palcoParentOrig) {
        el._palcoParentOrig.appendChild(el);
      }
    });
    _mudados.length = 0;
    document.querySelectorAll("[id^='palco-slot-']").forEach((s) => s.remove());
    // Borra los nodos que _crearCapas() agregó (fondo/ambiente/marcador/
    // tantos/mano), no solo los slots de reubicación: antes quedaban en el
    // DOM al apagar el tema y solo el CSS de cada uno los tapaba — menos
    // #palco-tantos, que no tenía esa regla de respaldo y quedaba flotando
    // con el último puntaje pintado sobre la mesa clásica.
    document.querySelectorAll("[data-palco-layer]").forEach((s) => s.remove());
  }

  // La clase `tema-palco` ya NO la pone este módulo: la maneja el selector de
  // escenarios (src/ui/escenarios.js), que es quien sabe cuál corresponde.
  // Acá quedan solo las capas de DOM propias del palco —fondo, marcador,
  // slots de reubicación—, que son las que hay que crear y destruir a mano.
  function aplicar(on) {
    if (on) { _crearCapas(); pintar(); }
    else { _restaurarSlots(); }
  }

  // El interruptor binario `palcoToggle` y su botón en Ajustes se eliminaron:
  // los reemplaza la galería de escenarios. La clave vieja `tg_tema_palco`
  // NO se borra — escenarios.js la lee una última vez para migrar al que la
  // tenía apagada a propósito y no volver a encenderle el palco solo.

  document.addEventListener("DOMContentLoaded", () => {
    // Quién manda es el selector de escenarios. Este módulo solo reacciona:
    // si el escenario activo es el palco, monta sus capas; si no, las saca.
    aplicar(esPalcoActivo());
    document.addEventListener("escenarioCambiado", (ev) => {
      aplicar(!!(ev.detail && ev.detail.id === "palco"));
    });
    // Los puntos cambian en cada render del motor
    if (typeof onJuego === "function") {
      onJuego("render", pintar);
      onJuego("manoRepartida", pintar);
      onJuego("finDePartido", pintar);
    }
    // Red de seguridad: el motor no emite un evento por cada suma de puntos,
    // así que se repinta también en un intervalo lento. Es barato (dos
    // textContent) y evita un marcador desactualizado, que sería justo el
    // tipo de bug "el estado está bien pero la pantalla miente" que venimos
    // persiguiendo todo el día.
    setInterval(pintar, 700);
  });
})();
