// ══════════════════════════════════════════════
// CARTAS Y AVATARES
// ══════════════════════════════════════════════
const C = {
  "1_e":  { n: 1,  p: "espadas", f: 14 }, "2_e":  { n: 2,  p: "espadas", f: 9  }, "3_e":  { n: 3,  p: "espadas", f: 10 },
  "4_e":  { n: 4,  p: "espadas", f: 1  }, "5_e":  { n: 5,  p: "espadas", f: 2  }, "6_e":  { n: 6,  p: "espadas", f: 3  },
  "7_e":  { n: 7,  p: "espadas", f: 12 }, "10_e": { n: 10, p: "espadas", f: 5  }, "11_e": { n: 11, p: "espadas", f: 6  }, "12_e": { n: 12, p: "espadas", f: 7  },
  "1_b":  { n: 1,  p: "bastos",  f: 13 }, "2_b":  { n: 2,  p: "bastos",  f: 9  }, "3_b":  { n: 3,  p: "bastos",  f: 10 },
  "4_b":  { n: 4,  p: "bastos",  f: 1  }, "5_b":  { n: 5,  p: "bastos",  f: 2  }, "6_b":  { n: 6,  p: "bastos",  f: 3  },
  "7_b":  { n: 7,  p: "bastos",  f: 4  }, "10_b": { n: 10, p: "bastos",  f: 5  }, "11_b": { n: 11, p: "bastos",  f: 6  }, "12_b": { n: 12, p: "bastos",  f: 7  },
  "1_o":  { n: 1,  p: "oros",    f: 8  }, "2_o":  { n: 2,  p: "oros",    f: 9  }, "3_o":  { n: 3,  p: "oros",    f: 10 },
  "4_o":  { n: 4,  p: "oros",    f: 1  }, "5_o":  { n: 5,  p: "oros",    f: 2  }, "6_o":  { n: 6,  p: "oros",    f: 3  },
  "7_o":  { n: 7,  p: "oros",    f: 11 }, "10_o": { n: 10, p: "oros",    f: 5  }, "11_o": { n: 11, p: "oros",    f: 6  }, "12_o": { n: 12, p: "oros",    f: 7  },
  "1_c":  { n: 1,  p: "copas",   f: 8  }, "2_c":  { n: 2,  p: "copas",   f: 9  }, "3_c":  { n: 3,  p: "copas",   f: 10 },
  "4_c":  { n: 4,  p: "copas",   f: 1  }, "5_c":  { n: 5,  p: "copas",   f: 2  }, "6_c":  { n: 6,  p: "copas",   f: 3  },
  "7_c":  { n: 7,  p: "copas",   f: 4  }, "10_c": { n: 10, p: "copas",   f: 5  }, "11_c": { n: 11, p: "copas",   f: 6  }, "12_c": { n: 12, p: "copas",   f: 7  }
};

// ── Ruta de las imágenes de las 40 cartas ──────────────────────────────
// Viven en assets/images/. deploy-pages.sh las copia a dist/images/ y el dev
// server las aliasea igual, así que en los dos lados la URL buena es
// "images/5_o.webp". Pedirlas peladas ("5_o.webp") da 404 y la carta cae al
// placeholder gris — que es lo que estuvo pasando en producción.
// Misma convención que los escudos ("escudos/..."). Usar SIEMPRE este helper.
function urlCarta(cartaId) { return "images/" + cartaId + ".webp"; }

// icon: emoji (fallback) o ruta a imagen ("avatares/...") — ver
// _avatarEsImagen()/_avatarIconHTML() más abajo, únicos lugares que hay
// que tocar si se agrega un avatar nuevo con imagen.
const AVATARS = [
  { name: "Hincha de River",         icon: "avatares/hincha_river.png" },
  { name: "Hincha de Boca",          icon: "avatares/hincha_boca.png" },
  { name: "Hincha de Independiente", icon: "avatares/hincha_independiente.png" },
  { name: "Hincha de San Lorenzo",   icon: "avatares/hincha_sanlorenzo.png" },
  { name: "Hincha de Racing",        icon: "avatares/hincha_racing.png" },
  // Lote 2 (31 jul) — mantener el ORDEN espejado con AVATARES_DT (liga.js)
  // y con AVATAR_POR_CLUB (equipos.js), que referencia estos índices.
  { name: "Hincha de Vélez",         icon: "avatares/hincha_velez.png" },
  { name: "Hincha de Estudiantes",   icon: "avatares/hincha_estudiantes.png" },
  { name: "Hincha de Newell's",      icon: "avatares/hincha_newells.png" },
  { name: "Hincha de Central",       icon: "avatares/hincha_central.png" },
  { name: "Hincha de Lanús",         icon: "avatares/hincha_lanus.png" },
  { name: "Hincha de Banfield",      icon: "avatares/hincha_banfield.png" },
  { name: "Hincha de Platense",      icon: "avatares/hincha_platense.png" },
  { name: "Hincha de Argentinos",    icon: "avatares/hincha_argentinos.png" },
  { name: "Hincha de Talleres",      icon: "avatares/hincha_talleres.png" },
  { name: "Hincha de Huracán",       icon: "avatares/hincha_huracan.png" },
  { name: "Hincha de Instituto",     icon: "avatares/hincha_instituto.png" },
  { name: "Hincha de Belgrano",      icon: "avatares/hincha_belgrano.png" },
  { name: "Hincha del Decano",       icon: "avatares/hincha_atucuman.png" },
  { name: "Hincha del Halcón",       icon: "avatares/hincha_defensa.png" },
  { name: "Hincha del Lobo",         icon: "avatares/hincha_gimnasia.png" },
  // Clásico santafesino (1 ago 2026) — índices 20/21, al FINAL a propósito:
  // mismo motivo que en equipos.js (AVATAR_POR_CLUB usa estos índices fijos).
  { name: "Hincha de Unión",         icon: "avatares/hincha_union.png" },
  { name: "Hincha de Colón",         icon: "avatares/hincha_colon.png" },
  // ── HINCHAS EUROPEOS (LaLiga + Premier). AL FINAL a proposito:
  //    AVATARS y AVATARES_DT se traducen POR INDICE.
  { name: "Hincha de Real Madrid", icon: "avatares/hincha_realmadrid.png" },
  { name: "Hincha de FC Barcelona", icon: "avatares/hincha_barcelona.png" },
  { name: "Hincha de Atlético de Madrid", icon: "avatares/hincha_atleticomadrid.png" },
  { name: "Hincha de Arsenal", icon: "avatares/hincha_arsenal.png" },
  { name: "Hincha de Chelsea", icon: "avatares/hincha_chelsea.png" },
  { name: "Hincha de Liverpool", icon: "avatares/hincha_liverpool.png" },
  { name: "Hincha de Manchester City", icon: "avatares/hincha_mancity.png" },
  { name: "Hincha de Manchester United", icon: "avatares/hincha_manunited.png" },
  { name: "Hincha de Newcastle United", icon: "avatares/hincha_newcastle.png" },
  { name: "Hincha de Tottenham Hotspur", icon: "avatares/hincha_tottenham.png" },
  // ── HINCHAS EUROPEOS (LaLiga + Premier). AL FINAL a proposito:
  //    AVATARS y AVATARES_DT se traducen POR INDICE.
  { name: "Hincha de Sevilla FC", icon: "avatares/hincha_sevilla.png" },
  { name: "Hincha de Valencia CF", icon: "avatares/hincha_valencia.png" },
  { name: "Hincha de Villarreal CF", icon: "avatares/hincha_villarreal.png" },
  { name: "Hincha de Real Betis", icon: "avatares/hincha_realbetis.png" },
  { name: "Hincha de Real Sociedad", icon: "avatares/hincha_realsociedad.png" },
  { name: "Hincha de Athletic Club", icon: "avatares/hincha_athleticclub.png" },
  { name: "Hincha de RCD Espanyol", icon: "avatares/hincha_espanyol.png" },
  { name: "Hincha de Celta de Vigo", icon: "avatares/hincha_celta.png" },
  { name: "Hincha de Deportivo La Coruña", icon: "avatares/hincha_deportivo.png" },
  { name: "Hincha de Elche CF", icon: "avatares/hincha_elche.png" },
  { name: "Hincha de Getafe CF", icon: "avatares/hincha_getafe.png" },
  { name: "Hincha de Real Oviedo", icon: "avatares/hincha_oviedo.png" },
  { name: "Hincha de CA Osasuna", icon: "avatares/hincha_osasuna.png" },
  { name: "Hincha de RCD Mallorca", icon: "avatares/hincha_mallorca.png" },
  { name: "Hincha de Levante UD", icon: "avatares/hincha_levante.png" },
  { name: "Hincha de Girona FC", icon: "avatares/hincha_girona.png" },
  { name: "Hincha de Rayo Vallecano", icon: "avatares/hincha_rayovallecano.png" },
  { name: "Hincha de Aston Villa", icon: "avatares/hincha_astonvilla.png" },
  { name: "Hincha de Bournemouth", icon: "avatares/hincha_bournemouth.png" },
  { name: "Hincha de Brentford", icon: "avatares/hincha_brentford.png" },
  { name: "Hincha de Brighton", icon: "avatares/hincha_brighton.png" },
  { name: "Hincha de Coventry City", icon: "avatares/hincha_coventry.png" },
  { name: "Hincha de Crystal Palace", icon: "avatares/hincha_crystalpalace.png" },
  { name: "Hincha de Everton", icon: "avatares/hincha_everton.png" },
  { name: "Hincha de Fulham", icon: "avatares/hincha_fulham.png" },
  { name: "Hincha de Hull City", icon: "avatares/hincha_hull.png" },
  { name: "Hincha de Ipswich Town", icon: "avatares/hincha_ipswich.png" },
  { name: "Hincha de Leeds United", icon: "avatares/hincha_leeds.png" },
  { name: "Hincha de Nottingham Forest", icon: "avatares/hincha_nottmforest.png" },
  { name: "Hincha de Sunderland", icon: "avatares/hincha_sunderland.png" }
];

// ── Avatares que llegan por red: allowlist, no filtro ────────────────────
// El avatar del rival online lo elige el CLIENTE de enfrente, así que es
// dato ajeno y termina en el DOM. Antes el único control era que el string
// TERMINARA en .png/.jpg/.webp, y con eso alcanzaba para romper el atributo
// del <img> y ejecutar JS en la máquina del oponente
// (`x" onerror="..." y=".png` pasa ese test).
//
// El Set se arma ACÁ, al cargar, y no se recalcula: motor_online.js pushea
// el avatar del rival dentro de AVATARS, así que leer el array en vivo haría
// que un avatar inyectado se auto-autorizara.
const AVATAR_FALLBACK = "avatares/hincha_misterioso.png";
const _AVATARS_PROPIOS = new Set(AVATARS.map(a => a.icon).concat(AVATAR_FALLBACK));

// Slot del "hincha genérico": rival de un club SIN hincha propio (LALIGA,
// Brasileirão, selecciones…). equipos.js le pone el nombre del club de turno
// ("Hincha de Real Sociedad") y usa el muñeco misterioso. Existe SIEMPRE —
// aunque no haya rival genérico en juego — para que un snapshot guardado con
// este índice no apunte afuera del array al recargar la página.
const AVATAR_GENERICO_IDX = AVATARS.length;
AVATARS.push({ name: "Hincha rival", icon: AVATAR_FALLBACK, _generico: true });

// Solo dos cosas pueden llegar al DOM: una ruta EXACTA de nuestra lista, o
// un emoji corto y sin sintaxis de HTML. Cualquier otra cosa es el hincha
// misterioso — que además es la respuesta honesta: no sabemos quién es.
function avatarSeguro(icon) {
  if (typeof icon !== "string") return AVATAR_FALLBACK;
  if (_AVATARS_PROPIOS.has(icon)) return icon;
  if (icon.length > 8 || /[<>"'&\\\/]/.test(icon)) return AVATAR_FALLBACK;
  return icon;
}

// Escapa HTML de verdad (para innerHTML). Docenas de lugares del proyecto
// (club, apuesta con plata real, liga, historial, 2v2, avatares) ya
// llamaban a esc() dando por sentado que existía en algún lado — nunca
// existió: cada uno de esos renders tiraba ReferenceError en producción en
// vez de mostrar nada. cartas.js es el primer script que carga, así que
// definirla acá la deja disponible como global para todos los demás.
function esc(s) {
  return String(s == null ? "" : s)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
window.esc = esc;

// El nombre del rival también viaja por red. El maxlength=12 del input lo
// aplica el cliente honesto, no el server: acá se recorta de verdad.
function nombreSeguro(s, fallback) {
  const limpio = String(s == null ? "" : s).replace(/\s+/g, " ").trim().slice(0, 12);
  return limpio || (fallback || "Rival");
}

// true si el icon es una imagen (ruta con extensión) en vez de un emoji.
function _avatarEsImagen(icon) {
  return typeof icon === "string" && /\.(png|jpe?g|webp)$/i.test(icon);
}

// Devuelve el HTML a insertar donde antes iba el emoji crudo: una imagen
// recortada en círculo si `icon` es una ruta, o el emoji tal cual si no.
// avatarSeguro() ya es un ALLOWLIST (ruta exacta conocida, o emoji corto sin
// sintaxis de HTML) — lo que devuelve no puede traer '<>"\'&\/' salvo que
// sea uno de los paths de AVATARS, así que no hace falta volver a escapar.
// (Antes llamaba a esc(), una función que nunca existió en el proyecto:
// tiraba ReferenceError cada vez que esto se ejecutaba de verdad —
// nadie lo notó porque el llamador más visible solo entra acá cuando
// _avatarEsImagen() da true, el caso raro de los avatares "hincha de club".)
function _avatarIconHTML(icon, sizePx) {
  const safe = avatarSeguro(icon);
  if (_avatarEsImagen(safe)) {
    // onerror: si el PNG no está (avatar nuevo agregado a AVATARS antes de
    // que exista su imagen, o un archivo que no llegó al deploy) se cae al
    // hincha misterioso en vez de mostrar el ícono de imagen rota. El
    // onerror se desarma a sí mismo para no entrar en bucle si el fallback
    // tampoco carga.
    const fb = AVATAR_FALLBACK;
    const err = safe === fb ? "" : ` onerror="this.onerror=null;this.src='${fb}'"`;
    return `<img src="${safe}" alt=""${err} style="width:${sizePx}px;height:${sizePx}px;border-radius:50%;object-fit:cover;display:block">`;
  }
  return safe;
}

// ── Guardado seguro en localStorage ────────────────────────────────────────
// Devuelve true si se guardó OK. Si falla (cuota llena, modo privado,
// localStorage deshabilitado, etc.) avisa UNA vez con un toast para que el
// jugador sepa que su progreso no se está guardando, en vez de fallar en
// silencio (el comportamiento anterior en anotador.js / liga.js).
let _lsAvisoFallo = false;
function lsSet(key, value) {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (e) {
    if (!_lsAvisoFallo) {
      _lsAvisoFallo = true;
      if (typeof showToast === "function") {
        showToast("⚠️ No se pudo guardar el progreso (almacenamiento lleno o bloqueado)");
      }
    }
    return false;
  }
}

// ── Fisher-Yates real (reemplaza el .sort() sesgado) ──────────────────────────
function mezclarMazo(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ── Calcula los tantos de envido de una mano ──────────────────────────────────
// Maneja correctamente 1, 2 o 3 cartas (funciona en ronda 2 y 3)
function calcularEnvido(mano) {
  const cartas = mano.filter(x => x !== null).map(x => C[x]);
  if (cartas.length === 0) return 0;

  const val = (carta) => (carta.n >= 10 ? 0 : carta.n);

  // Si solo queda 1 carta, el envido es su valor (sin +20)
  if (cartas.length === 1) return val(cartas[0]);

  // Si los 3 palos son distintos, se toma la carta de mayor valor (sin +20)
  const palos = [...new Set(cartas.map(x => x.p))];
  if (palos.length === cartas.length) return Math.max(...cartas.map(val));

  // Buscar el mejor par del mismo palo
  let mejorEnvido = 0;
  for (let i = 0; i < cartas.length; i++) {
    for (let j = i + 1; j < cartas.length; j++) {
      if (cartas[i].p === cartas[j].p) {
        const puntos = val(cartas[i]) + val(cartas[j]) + 20;
        if (puntos > mejorEnvido) mejorEnvido = puntos;
      }
    }
  }

  // Si no encontró par, tomar la carta de mayor valor
  return mejorEnvido || Math.max(...cartas.map(val));
}

// ── Calcula el envido y devuelve también las cartas que lo forman ─────────────
// Igual que calcularEnvido, pero además indica qué carta(s) suman los tantos
// (1 carta si no hay par del mismo palo, 2 cartas si hay un par).
// Útil para mostrarlas en el overlay del envido cuando alguien gana.
function calcularEnvidoConCartas(mano) {
  const ids = mano.filter(x => x !== null);
  if (ids.length === 0) return { puntos: 0, cartas: [] };

  const val = (id) => (C[id].n >= 10 ? 0 : C[id].n);

  // Si solo queda 1 carta, el envido es su valor (sin +20)
  if (ids.length === 1) return { puntos: val(ids[0]), cartas: [ids[0]] };

  // Si los 3 palos son distintos, se toma la carta de mayor valor (sin +20)
  const palos = [...new Set(ids.map(id => C[id].p))];
  if (palos.length === ids.length) {
    let mejor = ids[0];
    for (const id of ids) if (val(id) > val(mejor)) mejor = id;
    return { puntos: val(mejor), cartas: [mejor] };
  }

  // Buscar el mejor par del mismo palo
  let mejorEnvido = -1, mejorPar = null;
  for (let i = 0; i < ids.length; i++) {
    for (let j = i + 1; j < ids.length; j++) {
      if (C[ids[i]].p === C[ids[j]].p) {
        const puntos = val(ids[i]) + val(ids[j]) + 20;
        if (puntos > mejorEnvido) { mejorEnvido = puntos; mejorPar = [ids[i], ids[j]]; }
      }
    }
  }
  if (mejorPar) return { puntos: mejorEnvido, cartas: mejorPar };

  // Si no encontró par, tomar la carta de mayor valor
  let mejor = ids[0];
  for (const id of ids) if (val(id) > val(mejor)) mejor = id;
  return { puntos: val(mejor), cartas: [mejor] };
}

// ── FLOR ────────────────────────────────────────────────────────────────────
// Tener flor = las 3 cartas de la mano inicial son del mismo palo.
function tieneFlor(mano) {
  const cartas = mano.filter(x => x !== null);
  if (cartas.length !== 3) return false;
  const palos = new Set(cartas.map(id => C[id].p));
  return palos.size === 1;
}

// Calcula los tantos de flor: 20 + suma de los valores de envido de las 3 cartas.
// Solo tiene sentido si tieneFlor(mano) === true.
function calcularFlor(mano) {
  const cartas = mano.filter(x => x !== null).map(x => C[x]);
  if (cartas.length !== 3) return 0;
  const val = (carta) => (carta.n >= 10 ? 0 : carta.n);
  return 20 + cartas.reduce((sum, c) => sum + val(c), 0);
}

// ══════════════════════════════════════════════
// DORSO TRUGOL — colores de la Selección Argentina
// ══════════════════════════════════════════════
const DORSO_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 750 1050">
<defs>
<linearGradient id="dGold" x1="0" y1="0" x2="1" y2="1">
<stop offset="0%" stop-color="#c89b3c"/><stop offset="50%" stop-color="#ffe08a"/><stop offset="100%" stop-color="#c89b3c"/>
</linearGradient>
<linearGradient id="dCeleste" x1="0" y1="0" x2="0" y2="1">
<stop offset="0%" stop-color="#8fd9ff"/><stop offset="100%" stop-color="#5aa9dc"/>
</linearGradient>
<clipPath id="dInner"><rect x="40" y="40" width="670" height="970" rx="26"/></clipPath>
</defs>
<rect width="750" height="1050" rx="42" fill="#06121f"/>
<rect x="18" y="18" width="714" height="1014" rx="32" fill="none" stroke="url(#dGold)" stroke-width="8"/>
<rect x="34" y="34" width="682" height="982" rx="27" fill="none" stroke="#0e2a44" stroke-width="4"/>
<g clip-path="url(#dInner)">
<rect x="40"  y="40" width="96" height="970" fill="url(#dCeleste)"/>
<rect x="136" y="40" width="96" height="970" fill="#f4f9ff"/>
<rect x="232" y="40" width="96" height="970" fill="url(#dCeleste)"/>
<rect x="328" y="40" width="96" height="970" fill="#f4f9ff"/>
<rect x="424" y="40" width="96" height="970" fill="url(#dCeleste)"/>
<rect x="520" y="40" width="96" height="970" fill="#f4f9ff"/>
<rect x="616" y="40" width="96" height="970" fill="url(#dCeleste)"/>
<g opacity="0.10" stroke="#06121f" stroke-width="5" fill="none">
<line x1="40" y1="525" x2="710" y2="525"/>
<circle cx="375" cy="525" r="120"/>
<rect x="220" y="40" width="310" height="120"/>
<rect x="220" y="890" width="310" height="120"/>
</g>
</g>
<g text-anchor="middle" font-family="Georgia, serif">
<text x="225" y="195" font-size="52" fill="url(#dGold)">★</text>
<text x="225" y="238" font-size="26" font-weight="bold" fill="#06121f">1978</text>
<text x="375" y="175" font-size="66" fill="url(#dGold)">★</text>
<text x="375" y="238" font-size="26" font-weight="bold" fill="#06121f">1986</text>
<text x="525" y="195" font-size="52" fill="url(#dGold)">★</text>
<text x="525" y="238" font-size="26" font-weight="bold" fill="#06121f">2022</text>
</g>
<path d="M375 320 L555 365 V600 Q555 720 375 790 Q195 720 195 600 V365 Z" fill="#06121f" stroke="url(#dGold)" stroke-width="9"/>
<path d="M375 345 L530 384 V598 Q530 700 375 762 Q220 700 220 598 V384 Z" fill="none" stroke="#3d6b94" stroke-width="3"/>
<g transform="translate(375 455)">
<g stroke="url(#dGold)" stroke-width="6">
<line y1="-62" y2="-86"/><line y1="62" y2="86"/>
<line x1="-62" x2="-86"/><line x1="62" x2="86"/>
<line x1="-44" y1="-44" x2="-61" y2="-61"/><line x1="44" y1="44" x2="61" y2="61"/>
<line x1="-44" y1="44" x2="-61" y2="61"/><line x1="44" y1="-44" x2="61" y2="-61"/>
</g>
<circle r="52" fill="url(#dGold)"/>
<circle r="52" fill="none" stroke="#8a6420" stroke-width="3"/>
<g transform="scale(0.62)" stroke="#06121f" stroke-width="5" fill="none">
<circle r="70" fill="#fff"/>
<polygon points="0,-28 27,-9 17,23 -17,23 -27,-9" fill="#06121f" stroke="none"/>
<line x1="0" y1="-28" x2="0" y2="-70"/>
<line x1="27" y1="-9" x2="66" y2="-22"/>
<line x1="17" y1="23" x2="42" y2="56"/>
<line x1="-17" y1="23" x2="-42" y2="56"/>
<line x1="-27" y1="-9" x2="-66" y2="-22"/>
</g>
</g>
<g text-anchor="middle" font-family="Georgia, serif">
<text x="375" y="635" font-size="68" font-weight="bold" letter-spacing="4" fill="url(#dGold)" stroke="#8a6420" stroke-width="1.5">TRUGOL</text>
<rect x="275" y="658" width="200" height="3" fill="url(#dGold)"/>
<text x="375" y="700" font-size="22" letter-spacing="3" fill="#8fd9ff">EDICIÓN LEYENDA</text>
</g>
<g text-anchor="middle" font-family="Georgia, serif">
<rect x="195" y="880" width="360" height="64" rx="32" fill="#06121f" stroke="url(#dGold)" stroke-width="5"/>
<text x="375" y="922" font-size="30" font-weight="bold" letter-spacing="4" fill="url(#dGold)">ARGENTINA</text>
</g>
</svg>`;

// Dorso vigente: arte de Chucho, exportado de CorelDRAW a webp 400×600 (2:3
// exacto, retina para el máximo de 200×300 que se renderiza). Va como ARCHIVO
// y no como data-URI: son 27 KB, meterlos inline en este .js lo inflaría al
// pedo y el service worker no podría cachearlo por separado.
// Sirve tanto para <img src> como para background-image.
const DORSO_URI = "images/dorso.webp";

// Fallback si el webp no carga: el dorso vectorial viejo, inline (3,8 KB).
// DORSO_SVG sigue arriba justamente para esto — no es código muerto.
const DORSO_URI_FALLBACK = "data:image/svg+xml," + encodeURIComponent(DORSO_SVG);

// HTML de una carta boca abajo (usar donde se dibujan las cartas del rival o el mazo)
function dibujarDorso(claseExtra = "") {
  return `<div class="carta dorso ${claseExtra}"><img src="${DORSO_URI}" alt="Dorso TRUGOL" draggable="false"></div>`;
}


/* ── PRECARGA DE LOS NAIPES ───────────────────────────────────────
   Por qué: las 40 imágenes del mazo (~5,5 MB en total) NO están en el
   precache del service worker —que solo lleva el HTML, los JS y los
   iconos— y tampoco se pedían por adelantado. Resultado: cada carta se
   bajaba de la red la PRIMERA vez que salía, y en la mesa se veían
   rectángulos BLANCOS que se llenaban de a poco. Se notaba sobre todo en
   la primera mano y con datos móviles.

   Se piden todas apenas arranca el juego, en segundo plano: el navegador
   las guarda en su caché y el SW las suma a la suya (tiene cache-first
   para imágenes), así que a partir de ahí salen instantáneas — también
   offline. No bloquea nada: son `new Image()` sueltas, sin await, y van
   con `fetchPriority: low` para no pelearle ancho de banda al arranque.

   Se hace después del 'load' para no competir con el primer render. */
(function _precargarNaipes() {
  const PALOS = ["e", "b", "o", "c"];                 // espada, basto, oro, copa
  const NUMS  = [1, 2, 3, 4, 5, 6, 7, 10, 11, 12];    // el mazo del truco
  function precargar() {
    PALOS.forEach(p => NUMS.forEach(n => {
      const img = new Image();
      if ("fetchPriority" in img) img.fetchPriority = "low";
      img.src = `images/${n}_${p}.webp`;
    }));
    // El dorso también: es la que más se repite en la mesa.
    const dorso = new Image();
    if ("fetchPriority" in dorso) dorso.fetchPriority = "low";
    dorso.src = "images/dorso.webp";
  }
  if (document.readyState === "complete") setTimeout(precargar, 400);
  else window.addEventListener("load", () => setTimeout(precargar, 400));
})();
