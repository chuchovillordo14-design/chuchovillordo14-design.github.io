// ══════════════════════════════════════════════════════════════
// MENÚ 2.0 — jerarquía y movimiento del menú principal
//
// El menú era una columna de ~20 botones con el mismo peso: el HTML
// base trae 14 y las features se auto-inyectan el resto. Acá se
// colapsan las secciones en un "acordeón"…
//
// …PERO SIN MOVER UN SOLO NODO. La primera versión envolvía los
// botones en contenedores nuevos y quedó en ruinas: los inyectores
// (misiones, desafío, historia, retomar partida…) insertan con
// insertBefore sobre anclas del DOM original, y al re-estructurarlo
// los paneles caían en cualquier lado (títulos verticales, botones
// fuera de su grupo). Lección: acá el DOM del nav es territorio de
// muchos — se ETIQUETA (data-mmg en cada item, según la sección que
// tenga arriba) y el colapso lo hace CSS con esas etiquetas. Un
// MutationObserver re-etiqueta lo que se inyecte tarde, idempotente.
// Los clicks van delegados en document (hay features que reescriben
// el nav con innerHTML y matan listeners por-elemento).
//
// Además: parallax al scrollear, entrada escalonada y transición
// entre pantallas. Cero assets de red; estilos en style.css (bloque
// "MENÚ 2.0"); prefers-reduced-motion apaga el movimiento.
// ══════════════════════════════════════════════════════════════
(function () {
  const REDUCIDO = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const LS_KEY = "tg_menu_grupos";

  function _estado() {
    try { return JSON.parse(localStorage.getItem(LS_KEY)) || {}; } catch (e) { return {}; }
  }
  function _guardar(sec, abierto) {
    const st = _estado(); st[sec] = abierto;
    try { localStorage.setItem(LS_KEY, JSON.stringify(st)); } catch (e) {}
  }

  // ── Etiquetado (idempotente, se puede correr mil veces) ──────
  // Recorre los hijos del nav en orden: todo lo que viene después de
  // la sección N lleva data-mmg="N". Lo anterior a la primera sección
  // (PICADITO, RETOMAR PARTIDA, desafíos…) queda sin etiqueta: hero,
  // siempre visible.
  function etiquetar() {
    const nav = document.querySelector(".mm-nav");
    if (!nav) return;
    let sec = 0;
    const cuentas = {};
    [...nav.children].forEach(el => {
      if (el.classList.contains("mm-seccion")) {
        sec++;
        el.dataset.mmSec = sec;
        el.classList.add("mm-sec-toggle");
        // Son <div> con onclick: sin esto no existen para el teclado ni para
        // un lector de pantalla, y son la ÚNICA puerta a casi todo el menú.
        el.setAttribute("role", "button");
        el.setAttribute("tabindex", "0");
        if (!el.querySelector(".mm-chev")) {
          const chev = document.createElement("span");
          chev.className = "mm-chev"; chev.textContent = "▾";
          chev.setAttribute("aria-hidden", "true");
          el.appendChild(chev);
        }
      } else if (el.dataset.mmFuera === "1") {
        // Fuera del acordeón a propósito (hoy: ANOTADOR, que va último).
        // Sin esto heredaría la sección que tenga arriba y se plegaría con
        // ella. Tampoco entra en el contador de "N modos": no es un modo.
        delete el.dataset.mmg;
      } else if (sec > 0) {
        el.dataset.mmg = sec;
        // Contar solo lo VISIBLE: el bloque de lanzamiento (styles/style.css,
        // "LANZAMIENTO INICIAL") esconde varios botones con
        // display:none, y sin este chequeo el contador seguía diciendo
        // "10 modos" con 8 de esos 10 invisibles — Chucho lo pescó en
        // vivo apenas se publicó (3 ago).
        if (getComputedStyle(el).display !== "none") {
          cuentas[sec] = (cuentas[sec] || 0) + 1;
        }
      }
    });
    // contador "N modos" en cada título
    nav.querySelectorAll(".mm-seccion[data-mm-sec]").forEach(s => {
      const n = cuentas[s.dataset.mmSec] || 0;
      let c = s.querySelector(".mm-count");
      if (!c) { c = document.createElement("span"); c.className = "mm-count"; s.insertBefore(c, s.querySelector(".mm-chev")); }
      c.textContent = n ? (n + (n === 1 ? " modo" : " modos")) : "";
    });
    aplicarColapso(nav, sec, cuentas);
  }

  // ── Colapso por CSS: .mmg-cerrado-N esconde [data-mmg="N"] ───
  // Las reglas se generan según cuántas secciones haya (hoy 3, pero
  // si una feature agrega la suya, salen solas).
  let _reglasHasta = 0;
  function aplicarColapso(nav, totalSecciones, cuentas) {
    if (totalSecciones > _reglasHasta) {
      const st = document.createElement("style");
      let css = "";
      for (let n = _reglasHasta + 1; n <= totalSecciones; n++) {
        css += `.mm-nav.mmg-cerrado-${n} > [data-mmg="${n}"] { display: none !important; }\n`;
        css += `.mm-nav.mmg-cerrado-${n} > .mm-seccion[data-mm-sec="${n}"] .mm-chev { transform: rotate(-90deg); }\n`;
        // Cerrada: sin el borde izquierdo dorado que marca "esto sigue abajo".
        css += `.mm-nav.mmg-cerrado-${n} > .mm-seccion[data-mm-sec="${n}"] { border-left-width: 1px; border-left-color: rgba(200,168,75,.22); }\n`;
      }
      st.textContent = css;
      document.head.appendChild(st);
      _reglasHasta = totalSecciones;
    }
    const estado = _estado();

    /* Sección que arranca ABIERTA la primera vez: la primera que tenga al
       menos un botón VISIBLE (4 ago 2026).

       Antes arrancaban todas cerradas, y con el menú reducido eso dejaba al
       jugador nuevo viendo solo PICADITO: "BUSCAR RIVAL" y "JUGAR CON UN
       AMIGO" —el modo que sostiene el modelo de WhatsApp— quedaban atrás de
       un clic en un título que no se lee como botón. Pedido de Chucho tras
       verlo en el navegador.

       Se elige por CONTENIDO VISIBLE y no por número fijo a propósito: hoy
       la sección 1 (MODO DT) está entera oculta por el bloque de lanzamiento
       y la que tiene todo es la 2, pero si mañana se reactiva un modo la
       regla sigue valiendo sola. `cuentas` ya viene calculado por etiquetar()
       contando solo lo que no está en display:none.
       No pisa la preferencia guardada: solo aplica a quien nunca tocó nada.

       ⚠️ Abre la sección con MÁS botones visibles (empate: la primera). Era
       "la primera con al menos uno" hasta que ONLINE pasó a ser sección
       propia (4 ago, ronda 2): con esa regla se abría "PARTIDA RÁPIDA" —un
       solo botón, el amistoso contra la IA— y BUSCAR RIVAL / JUGAR CON UN
       AMIGO volvían a quedar atrás de un clic, que es justo lo que este
       bloque existe para evitar. */
    let porDefecto = 0;
    if (cuentas) {
      let mejor = 0;
      for (let n = 1; n <= totalSecciones; n++) {
        const c = cuentas[n] || 0;
        if (c > mejor) { mejor = c; porDefecto = n; }
      }
    }

    for (let n = 1; n <= totalSecciones; n++) {
      const abierta = ("s" + n in estado) ? !!estado["s" + n] : (n === porDefecto);
      nav.classList.toggle("mmg-cerrado-" + n, !abierta);
    }
    _sincronizarAria(nav);
  }

  // aria-expanded refleja el estado real (lo lee el lector de pantalla).
  function _sincronizarAria(nav) {
    nav.querySelectorAll(".mm-seccion[data-mm-sec]").forEach(s => {
      s.setAttribute("aria-expanded", String(!nav.classList.contains("mmg-cerrado-" + s.dataset.mmSec)));
    });
  }

  // Al abrir, los items entran escalonados (reusa la animación de carga).
  function _animarApertura(nav, n) {
    if (REDUCIDO) return;
    let i = 0;
    nav.querySelectorAll(`[data-mmg="${n}"]`).forEach(el => {
      el.classList.remove("mm-anim-in");
      void el.offsetWidth;                       // reinicia la animación
      el.style.setProperty("--d", (i++ * 0.03) + "s");
      el.classList.add("mm-anim-in");
    });
  }

  // Toggle delegado — sobrevive a cualquier re-render del nav.
  document.addEventListener("click", (ev) => {
    const secEl = ev.target.closest && ev.target.closest(".mm-seccion[data-mm-sec]");
    if (!secEl) return;
    _alternar(secEl);
  });

  // Teclado: Enter y Espacio, como cualquier botón.
  document.addEventListener("keydown", (ev) => {
    if (ev.key !== "Enter" && ev.key !== " ") return;
    const secEl = ev.target.closest && ev.target.closest(".mm-seccion[data-mm-sec]");
    if (!secEl) return;
    ev.preventDefault();   // que el espacio no scrollee la página
    _alternar(secEl);
  });

  function _alternar(secEl) {
    const nav = secEl.closest(".mm-nav");
    const n = secEl.dataset.mmSec;
    const cerrada = nav.classList.toggle("mmg-cerrado-" + n);
    _guardar("s" + n, !cerrada);
    secEl.setAttribute("aria-expanded", String(!cerrada));
    if (!cerrada) {
      _animarApertura(nav, n);
      // Que el título quede a la vista: si abrís una sección de abajo, el
      // contenido nuevo empuja y el encabezado se te va de pantalla.
      if (secEl.scrollIntoView) {
        try { secEl.scrollIntoView({ behavior: REDUCIDO ? "auto" : "smooth", block: "nearest" }); } catch (e) {}
      }
    }
  }

  // ── Entrada escalonada (una vez, al cargar) ──────────────────
  function entradaEscalonada() {
    if (REDUCIDO) return;
    const cont = document.querySelector("#main-menu .mm-content");
    if (!cont) return;
    let i = 0;
    [...cont.querySelectorAll(":scope > .mm-escudo-img, .mm-nav > *, .mm-footer")].forEach(el => {
      el.classList.add("mm-anim-in");
      el.style.setProperty("--d", (i++ * 0.04) + "s");
    });
  }

  // ── Parallax al scrollear el menú ────────────────────────────
  function parallax() {
    if (REDUCIDO) return;
    const menu = document.getElementById("main-menu");
    const cancha = menu && menu.querySelector(".mm-cancha");
    const confetti = menu && menu.querySelector(".mm-confetti");
    if (!menu || !cancha) return;
    let pedido = false;
    menu.addEventListener("scroll", () => {
      if (pedido) return; pedido = true;
      requestAnimationFrame(() => {
        pedido = false;
        const y = menu.scrollTop;
        cancha.style.transform = "translate3d(0," + (y * 0.55) + "px,0)";
        if (confetti) confetti.style.transform = "translate3d(0," + (y * 0.3) + "px,0)";
      });
    }, { passive: true });
  }

  // ── Transición entre pantallas ───────────────────────────────
  function transiciones() {
    if (REDUCIDO || typeof window.irA !== "function") return;
    const orig = window.irA;
    window.irA = function (id) {
      orig(id);
      const dest = document.getElementById(id);
      if (!dest) return;
      dest.classList.remove("screen-enter");
      void dest.offsetWidth;
      dest.classList.add("screen-enter");
      dest.addEventListener("animationend", () => dest.classList.remove("screen-enter"), { once: true });
    };
  }

  window.addEventListener("load", () => {
    etiquetar();
    // Inyectores tardíos (algunos corren con timeouts): re-etiquetar en
    // cada cambio del nav. etiquetar() es idempotente, así que da igual
    // cuántas veces dispare.
    const nav = document.querySelector(".mm-nav");
    if (nav) new MutationObserver(() => etiquetar()).observe(nav, { childList: true });
    entradaEscalonada();
    parallax();
    transiciones();
  });
})();
