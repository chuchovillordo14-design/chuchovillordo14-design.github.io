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

const AVATARS = [
  { name: "Martín Fierro", icon: "🤠" },
  { name: "Juan Moreira",  icon: "⚔️"  },
  { name: "La Pasto Verde",icon: "🌿" },
  { name: "Santos Vega",   icon: "🎸" }
];

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

// Data-URI listo para <img src> o background-image
const DORSO_URI = "data:image/svg+xml," + encodeURIComponent(DORSO_SVG);

// HTML de una carta boca abajo (usar donde se dibujan las cartas del rival o el mazo)
function dibujarDorso(claseExtra = "") {
  return `<div class="carta dorso ${claseExtra}"><img src="${DORSO_URI}" alt="Dorso TRUGOL" draggable="false"></div>`;
}
