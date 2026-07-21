/* ══════════════════════════════════════════════════════════
   MODO MANAGER — TRUCO GOL
   Fundá un club de la nada y manejalo como PRESIDENTE + DT:
   construí las instalaciones, dirigí los entrenamientos, elegí
   la táctica y armá el 11 titular con tus figuritas y juveniles.

   Cada mejora da una VENTAJA concreta:
   - 🏟️ Estadio   → más recaudación + comodín "Veedor" (ver el envido rival)
   - 🏟 Ciudad Dep.→ entrena más barato + comodín "Pizarrón" (re-repartir)
   - 🌱 Cantera    → genera juveniles propios + chance de sobres
   - 🏋️ Gimnasio  → más energía + comodín "Garra" (ganar una parda)
   - 🏥 C. Médico  → recupera energía y amortigua el bajón de moral/energía
   - 🛍️ Tienda    → ingreso fijo + estrellas en el escudo (cosmético)
   - 🎮 Ocio       → sube y sostiene la moral (que modula el poder)

   La plata se gana JUGANDO al truco (cualquier modo).
   ══════════════════════════════════════════════════════════ */

const CLUB_KEY = "truco_club";

const CLUB_INSTALACIONES = [
  { id:"estadio",  nombre:"Estadio",          icon:"🏟️", desc:"Más aforo = más recaudación. Nv2+: comodín 👁 Veedor (ver el envido del rival)." },
  { id:"ciudad",   nombre:"Ciudad Deportiva", icon:"🏟",  desc:"Entrenás más barato y rinde más. Nv2+: comodín 📋 Pizarrón (re-repartís tu mano)." },
  { id:"cantera",  nombre:"Cantera",          icon:"🌱", desc:"Genera juveniles propios y chance de sobres al jugar." },
  { id:"gimnasio", nombre:"Gimnasio",         icon:"🏋️", desc:"Sube el tope de energía y el poder. Nv2+: comodín 💪 Garra (ganás una parda)." },
  { id:"medico",   nombre:"Centro Médico",    icon:"🏥", desc:"Recuperás más al descansar y amortigua el bajón de energía y moral." },
  { id:"tienda",   nombre:"Tienda Oficial",   icon:"🛍️", desc:"Ingreso fijo de merch por partido + una estrella en el escudo por nivel." },
  { id:"ocio",     nombre:"Zona de Ocio",     icon:"🎮", desc:"Sube la moral del plantel y su recuperación (la moral modula el poder)." },
];
const CLUB_INST_MAX = 5;

const CLUB_COLORES = ["#1e88e5","#e53935","#43a047","#fdd835","#8e24aa","#fb8c00","#00897b","#000000","#ffffff","#d81b60"];
const CLUB_TACTICAS = {
  defensiva:  { label:"Defensiva ⛨",  desc:"Achicás y esperás. +moral, -1 poder, mejor consuelo al perder.", poder:-1 },
  equilibrada:{ label:"Equilibrada ⚖", desc:"El término medio. Sin bonus ni penalización.", poder:0 },
  ofensiva:   { label:"Ofensiva ⚔",   desc:"Al frente como un nueve. +2 poder y +15% recaudación al ganar, gasta más energía.", poder:+2 },
};

/* Pools para los nombres de los juveniles de la cantera */
const CLUB_NOMBRES_JUV   = ["Lucas","Matías","Thiago","Valentín","Benjamín","Santiago","Bautista","Joaquín","Tomás","Ramiro","Franco","Gael","Dylan","Ciro","Lautaro"];
const CLUB_APELLIDOS_JUV = ["Gómez","Fernández","Sosa","Romero","Ibáñez","Ledesma","Acosta","Ojeda","Cabrera","Vega","Páez","Quiroga","Coronel","Maidana","Ferreyra"];
const CLUB_POS_JUV       = ["Arquero","Defensor","Lateral","Volante","Enganche","Extremo","Delantero","Goleador"];

/* ── Persistencia ── */
function clubNuevo() {
  return {
    fundado: false,
    nombre: "", ciudad: "", estadioNombre: "",
    color: CLUB_COLORES[0], color2: "#ffffff",
    escudoForma: 0, iniciales: "",
    dinero: 1500,
    instalaciones: { estadio:1, ciudad:0, cantera:0, gimnasio:0, medico:0, tienda:0, ocio:0 },
    energia: 100, moral: 70,
    tactica: "equilibrada",
    entren: { fisico:0, tecnico:0, tactico:0 },
    onceIds: [],
    juveniles: [], canteraProgreso: 0,
    temporada: 1, partidos: 0,
    cfgComodines: true,
    palmares: { liga: 0, libertadores: 0 },
    historial: [],
  };
}

function clubCargar() {
  try {
    const raw = localStorage.getItem(CLUB_KEY);
    if (raw) {
      const c = JSON.parse(raw);
      if (c && typeof c === "object") {
        const base = clubNuevo();
        const merged = Object.assign(base, c);
        merged.instalaciones = Object.assign(base.instalaciones, c.instalaciones || {});
        merged.entren = Object.assign(base.entren, c.entren || {});
        merged.juveniles = c.juveniles || [];
        if (merged.cfgComodines === undefined) merged.cfgComodines = true;
        if (!merged.palmares)  merged.palmares  = { liga: 0, libertadores: 0 };
        if (!merged.historial) merged.historial = [];
        return merged;
      }
    }
  } catch (e) {}
  return clubNuevo();
}
function clubGuardar(c) { if (typeof lsSet === "function") lsSet(CLUB_KEY, JSON.stringify(c)); else localStorage.setItem(CLUB_KEY, JSON.stringify(c)); }

/* ── Cálculos ── */
function clubCostoMejora(id, nivel) {
  const base = { estadio:500, ciudad:350, cantera:400, gimnasio:300, medico:300, tienda:350, ocio:250 }[id] || 300;
  return Math.round(base * Math.pow(1.8, nivel));
}

// Plantel disponible = figuritas propias + juveniles de la cantera
function clubPlantelDisponible(c) {
  const d = (typeof figusCargar === "function") ? figusCargar() : { owned:{} };
  const figus = (typeof FIGUS !== "undefined")
    ? FIGUS.filter(f => d.owned[f.num]).map(f => ({ num:f.num, nombre:f.nombre, pos:f.pos, rating:f.rating, juvenil:false }))
    : [];
  const juv = (c.juveniles || []).map(j => ({ num:j.num, nombre:j.nombre, pos:j.pos, rating:j.rating, juvenil:true }));
  return figus.concat(juv).sort((a, b) => (b.rating||0) - (a.rating||0));
}

// Once titular (objetos), buscando tanto en figuritas como en juveniles
function clubOnce(c) {
  const todos = clubPlantelDisponible(c);
  const byId = {}; todos.forEach(p => byId[p.num] = p);
  return (c.onceIds || []).map(id => byId[id]).filter(Boolean);
}

function clubRatingOnce(c) {
  const ratings = clubOnce(c).map(f => f.rating || 60);
  while (ratings.length < 11) ratings.push(55);
  return ratings.reduce((s, r) => s + r, 0) / 11;
}

function clubPoder(c) {
  const base = clubRatingOnce(c);
  const i = c.instalaciones;
  const facBonus = i.gimnasio * 1.5 + i.estadio * 1.0 + i.ciudad * 0.8 + (i.cantera + i.medico + i.tienda + i.ocio) * 0.4;
  const trainBonus = Math.min(15, (c.entren.fisico + c.entren.tecnico + c.entren.tactico));
  const tac = CLUB_TACTICAS[c.tactica] || CLUB_TACTICAS.equilibrada;
  const moralFactor = 0.9 + (c.moral / 100) * 0.15;
  let poder = (base + facBonus + trainBonus + tac.poder) * moralFactor;
  // Penalización por plantel agotado, amortiguada por el Centro Médico
  if (c.energia < 30) poder -= Math.max(0, (30 - c.energia) * (0.5 - i.medico * 0.08));
  return Math.max(40, Math.min(99, Math.round(poder)));
}

function clubEnergiaMax(c) { return 100 + c.instalaciones.gimnasio * 10; }
function clubMoralMax()    { return 100; }

/* ── Escudo SVG (con estrellas de la Tienda) ── */
// Siluetas de escudo disponibles. divisor: si lleva la franja del medio.
const CLUB_FORMAS = [
  { id:"clasico", divisor:true,  shape:(c1,c2)=>`<path d="M6 6 H94 V64 Q94 96 50 108 Q6 96 6 64 Z" fill="${c1}" stroke="${c2}" stroke-width="4"/>` },
  { id:"redondo", divisor:true,  shape:(c1,c2)=>`<path d="M16 6 H84 Q94 6 94 18 V62 Q94 92 50 108 Q6 92 6 62 V18 Q6 6 16 6 Z" fill="${c1}" stroke="${c2}" stroke-width="4"/>` },
  { id:"puntudo", divisor:true,  shape:(c1,c2)=>`<path d="M6 8 H94 V54 L50 108 L6 54 Z" fill="${c1}" stroke="${c2}" stroke-width="4"/>` },
  { id:"ingles",  divisor:true,  shape:(c1,c2)=>`<path d="M10 6 H90 Q94 6 94 12 V64 Q94 90 50 106 Q6 90 6 64 V12 Q6 6 10 6 Z" fill="${c1}" stroke="${c2}" stroke-width="4"/>` },
  { id:"circulo", divisor:false, shape:(c1,c2)=>`<circle cx="50" cy="56" r="46" fill="${c1}" stroke="${c2}" stroke-width="4"/>` },
  { id:"rombo",   divisor:false, shape:(c1,c2)=>`<path d="M50 6 L94 56 L50 106 L6 56 Z" fill="${c1}" stroke="${c2}" stroke-width="4"/>` },
];

// Iniciales del escudo: las custom (hasta 3) o, si no hay, auto del nombre.
function _clubIniciales(c) {
  if (c.iniciales) return String(c.iniciales).toUpperCase().slice(0, 3);
  const nom = (c.nombre || "FC").trim();
  const palabras = nom.split(/\s+/).filter(Boolean);
  let ini = palabras.length >= 2 ? palabras.map(w => w[0]).join("") : nom;
  return (ini.slice(0, 3).toUpperCase()) || "FC";
}

function clubEscudoSVG(c, size) {
  const ini = _clubIniciales(c);
  const s = size || 80;
  const forma = CLUB_FORMAS[(c.escudoForma || 0) % CLUB_FORMAS.length] || CLUB_FORMAS[0];
  const estrellas = (c.instalaciones && c.instalaciones.tienda) || 0;
  let stars = "";
  if (estrellas > 0) {
    const total = estrellas, anchoU = 12, x0 = 50 - (total - 1) * anchoU / 2;
    for (let k = 0; k < total; k++)
      stars += `<text x="${x0 + k * anchoU}" y="93" text-anchor="middle" font-size="11" fill="${c.color2}">★</text>`;
  }
  const fs = ini.length >= 3 ? 21 : 24;
  return `<svg viewBox="0 0 100 110" width="${s}" height="${s*1.1}" xmlns="http://www.w3.org/2000/svg">
    ${forma.shape(c.color, c.color2)}
    ${forma.divisor ? `<path d="M8 40 H92" stroke="${c.color2}" stroke-width="3" opacity=".7"/>` : ""}
    <circle cx="50" cy="26" r="13" fill="${c.color2}" opacity=".9"/>
    <text x="50" y="31" text-anchor="middle" font-family="Oswald,sans-serif" font-size="13" font-weight="800" fill="${c.color}">⚽</text>
    <text x="50" y="73" text-anchor="middle" font-family="Oswald,sans-serif" font-size="${fs}" font-weight="800" fill="${c.color2}">${ini}</text>
    ${stars}
  </svg>`;
}

/* ══════════════════════════════════════════════════════════
   ECONOMÍA — se gana plata jugando (cualquier modo de truco)
   ══════════════════════════════════════════════════════════ */
function clubRegistrarPartido(gano, puntosJugador, puntosRival, limite) {
  const c = clubCargar();
  if (!c.fundado) return;
  const i = c.instalaciones;

  const recaudacion = 120 + i.estadio * 70 + i.tienda * 45;
  const enBuenas = !gano && typeof puntosJugador === "number" && typeof limite === "number" && puntosJugador >= limite / 2;
  let premio = gano ? recaudacion : (enBuenas ? Math.round(recaudacion * 0.45) : Math.round(recaudacion * 0.2));

  // Efecto de la táctica en la economía
  if (gano && c.tactica === "ofensiva")  premio = Math.round(premio * 1.15);
  if (!gano && c.tactica === "defensiva") premio = Math.round(premio * 1.6);

  // Rival más fuerte paga más: cierra el loop (más Poder → rival más duro → más plata)
  const rf = (typeof equipoRival !== "undefined" && equipoRival && typeof equipoRival.fuerza === "number") ? equipoRival.fuerza : 60;
  premio = Math.round(premio * (0.7 + rf / 100)); // ~1.0 a fuerza 60, ~1.67 a 97

  c.dinero += premio;
  c.partidos = (c.partidos || 0) + 1;

  // Energía: la ofensiva cansa más; el médico amortigua el bajón de moral
  const gastoEnergia = c.tactica === "ofensiva" ? 14 : 10;
  c.energia = Math.max(0, c.energia - gastoEnergia);
  let golpeMoral = gano ? 6 : (enBuenas ? 0 : -6);
  if (golpeMoral < 0) golpeMoral = Math.round(golpeMoral * (1 - i.medico * 0.12));
  c.moral = Math.max(0, Math.min(clubMoralMax(), c.moral + golpeMoral));

  // Cantera: chance de sobre + progreso hacia un juvenil propio
  let sobre = false, juvenil = null;
  if (i.cantera > 0) {
    if (typeof figusOtorgarSobres === "function" && Math.random() < 0.08 + i.cantera * 0.05) { figusOtorgarSobres(1); sobre = true; }
    c.canteraProgreso = (c.canteraProgreso || 0) + i.cantera;
    if (c.canteraProgreso >= 12) {
      c.canteraProgreso -= 12;
      juvenil = clubGenerarJuvenil(c);
      c.juveniles = c.juveniles || [];
      c.juveniles.push(juvenil);
    }
  }

  clubGuardar(c);

  if (typeof showToast === "function") {
    let msg = `🏛️ ${c.nombre}: +$${premio}`;
    if (sobre)   msg += " · ✉️ sobre de la cantera";
    showToast(msg, 2400);
    if (juvenil)  setTimeout(() => showToast(`🌱 ¡Debutó un juvenil! ${juvenil.nombre} (${juvenil.rating}) sale de tu cantera.`, 3200), 1500);
  }
  if (typeof clubActualizarBadge === "function") clubActualizarBadge();
}

/* ── OBJETIVO DE TEMPORADA (del presidente) ──
   Una sola temporada = la campaña de Liga (+ Libertadores). El objetivo
   es de posición y se endurece con los años: primero entrar en zona de
   copa, después el podio, y al final salir campeón. */
function clubObjetivoTemporada(c) {
  const t = c.temporada || 1;
  let posMax, desc;
  if (t <= 1)      { posMax = 4; desc = "Meterte en zona de Libertadores (top 4)"; }
  else if (t === 2){ posMax = 3; desc = "Terminar en el podio (top 3)"; }
  else if (t === 3){ posMax = 2; desc = "Clasificar a la Libertadores (top 2)"; }
  else             { posMax = 1; desc = "Salir CAMPEÓN de la Liga"; }
  return { posMax, desc };
}

/* ── Jugar un PARTIDO DEL CLUB: rival real escalado a tu Poder ──
   Cierra el loop: cuanto más fuerte tu club, más duro el rival y más
   paga. No ensucia liga/mundial/copa (va como amistoso). */
function clubJugarPartido() {
  const c = clubCargar();
  if (!c.fundado) return;
  if ((c.onceIds || []).length < 3) { showToast("Armá tu 11 en el Plantel antes de salir a la cancha."); return; }
  const poder = clubPoder(c);

  // Rival real, levemente más fuerte que vos para que sea desafío
  let rival = null;
  if (typeof LIGAS !== "undefined") {
    const todos = LIGAS.flatMap(l => l.equipos || []);
    const objetivo = poder + 2 + Math.floor(Math.random() * 6);
    rival = todos.slice().sort((a, b) =>
      Math.abs((a.fuerza || 60) - objetivo) - Math.abs((b.fuerza || 60) - objetivo))[0] || null;
  }

  const escudoURI = "data:image/svg+xml," + encodeURIComponent(clubEscudoSVG(c, 120));
  if (typeof equipoSel !== "undefined")
    equipoSel = { id: "__club__", nombre: c.nombre, sub: c.ciudad, color: c.color, escudo: escudoURI, fuerza: poder };
  if (typeof equipoRival !== "undefined")
    equipoRival = rival || { id: "__rival__", nombre: "Rival de turno", sub: "", color: "#888", escudo: escudoURI, fuerza: poder };
  if (typeof modoAmistoso !== "undefined") modoAmistoso = true;
  if (typeof modoMundial !== "undefined") modoMundial = false;
  if (typeof modoCopa !== "undefined") modoCopa = false;
  if (typeof S !== "undefined") S.nombreJugador = c.nombre;

  if (typeof playSound === "function") playSound("silbato");
  showToast(`⚽ ${c.nombre} (${poder}) vs ${equipoRival.nombre} (${equipoRival.fuerza}). ¡A la cancha!`, 2600);

  if (typeof _iniciarPartida === "function") _iniciarPartida();
  if (typeof aplicarEquipoEnMesa === "function") setTimeout(aplicarEquipoEnMesa, 60);
}

/* ── PAÑO SEGÚN LA COMPETICIÓN ──
   Pone una clase body.comp-* al entrar a la mesa, que recolorea el
   césped y el fondo según el torneo en juego. La llama irA('mesa'). */
const CLUB_PANO_INFO = {
  liga:         { emblema:"🏆", nombre:"LIGA",              noche:false },
  amistoso:     { emblema:"🤝", nombre:"AMISTOSO",          noche:false },
  libertadores: { emblema:"🌎", nombre:"LIBERTADORES",      noche:true  },
  champions:    { emblema:"⭐", nombre:"CHAMPIONS",         noche:true  },
  cwc:          { emblema:"👑", nombre:"MUNDIAL DE CLUBES", noche:true  },
  mundial:      { emblema:"🌍", nombre:"MUNDIAL",           noche:false },
  online:       { emblema:"🌐", nombre:"ONLINE",            noche:false },
};

function aplicarPanoCompeticion() {
  const body = document.body; if (!body) return;
  body.className = body.className.replace(/\bcomp-\S+/g, "").replace(/\bpano-noche\b/g, "").trim();
  let comp = "liga";
  if (typeof S !== "undefined" && S.modoOnline) comp = "online";
  else if (typeof modoMundial !== "undefined" && modoMundial) comp = "mundial";
  else if (typeof modoCopa !== "undefined" && modoCopa) {
    comp = (typeof copaActual !== "undefined" && copaActual) ? copaActual : "amistoso";
  } else if (typeof modoAmistoso !== "undefined" && modoAmistoso) {
    let c = null; try { c = clubCargar(); } catch (e) {}
    if (_clubSeasonPend && c && c.fundado && c.season && !c.season.fin) {
      const ent = c.season.cal[c.season.idx];
      comp = (ent && ent.comp === "liberta") ? "libertadores" : "liga";
    } else comp = "amistoso";
  }
  body.classList.add("comp-" + comp);

  const info = CLUB_PANO_INFO[comp] || CLUB_PANO_INFO.liga;
  // Marca de agua del trofeo en el centro de la cancha
  const mesa = document.getElementById("mesa");
  if (mesa) {
    let marca = document.getElementById("pano-marca");
    if (!marca) { marca = document.createElement("div"); marca.id = "pano-marca"; mesa.appendChild(marca); }
    marca.innerHTML = `<div class="pano-marca-em">${info.emblema}</div><div class="pano-marca-tx">${info.nombre}</div>`;
  }
  // Partido nocturno (copas de gala): overlay de reflectores + vignette
  if (info.noche) body.classList.add("pano-noche");
  let ovl = document.getElementById("pano-noche-ovl");
  if (!ovl) { ovl = document.createElement("div"); ovl.id = "pano-noche-ovl"; body.appendChild(ovl); }
  ovl.style.display = info.noche ? "block" : "none";
}

function clubToggleComodines() {
  const c = clubCargar();
  c.cfgComodines = c.cfgComodines === false ? true : false;
  clubGuardar(c);
  showToast(c.cfgComodines ? "🎟️ Comodines activados." : "Comodines desactivados.");
  clubRender("resumen");
}

/* ══════════════════════════════════════════════════════════
   MERCADO DE PASES DINÁMICO — fichar figuritas con plata
   El precio depende del RATING (curva), por un factor de DEMANDA
   que varía por jugador y rota cada temporada (vidriera nueva).
   ══════════════════════════════════════════════════════════ */
// Precio base según el rating (curva cuadrática: los cracks valen mucho más)
function _clubPrecioBase(rating) {
  const r = rating || 60;
  return Math.max(150, Math.round((r - 50) * (r - 50) * 2.2));
}
// Precio final con la demanda aplicada, redondeado
function _clubPrecioFicha(f, factor) {
  return Math.round(_clubPrecioBase(f.rating) * (factor || 1) / 10) * 10;
}

// Vidriera: 6 jugadores libres con su factor de demanda (0.80–1.30).
function _clubMercadoGenerar() {
  if (typeof FIGUS === "undefined") return [];
  const d = (typeof figusCargar === "function") ? figusCargar() : { owned:{} };
  const libres = FIGUS.filter(f => !d.owned[f.num]);
  for (let i = libres.length - 1; i > 0; i--) { const j = Math.floor(Math.random()*(i+1)); [libres[i],libres[j]]=[libres[j],libres[i]]; }
  return libres.slice(0, 6).map(f => ({ num: f.num, factor: Math.round((0.8 + Math.random() * 0.5) * 100) / 100 }));
}

function clubMercadoLista(c) {
  if (!c.mercado || !c.mercado.length) { c.mercado = _clubMercadoGenerar(); clubGuardar(c); }
  const d = (typeof figusCargar === "function") ? figusCargar() : { owned:{} };
  // Compatibilidad con el formato viejo (array de números)
  c.mercado = c.mercado.map(e => typeof e === "object" ? e : { num: e, factor: 1 })
                       .filter(e => !d.owned[e.num]);
  return c.mercado.map(e => {
    const f = FIGUS.find(x => x.num === e.num);
    if (!f) return null;
    const precio = _clubPrecioFicha(f, e.factor);
    const tendencia = e.factor >= 1.12 ? "alza" : (e.factor <= 0.92 ? "oferta" : "estable");
    return { f, precio, factor: e.factor, tendencia };
  }).filter(Boolean);
}

function clubMercadoRefrescar() {
  const c = clubCargar();
  c.mercado = _clubMercadoGenerar();
  clubGuardar(c);
  clubRender("mercado");
}

function clubFichar(num) {
  const c = clubCargar();
  const f = FIGUS.find(x => x.num === num);
  if (!f) return;
  const entry = (c.mercado || []).find(e => (typeof e === "object" ? e.num : e) === num);
  const factor = entry && typeof entry === "object" ? entry.factor : 1;
  const precio = _clubPrecioFicha(f, factor);
  if (c.dinero < precio) { showToast(`Te faltan $${(precio - c.dinero).toLocaleString("es-AR")} para fichar a ${f.nombre}.`); return; }
  const d = (typeof figusCargar === "function") ? figusCargar() : { owned:{} };
  if (d.owned[f.num]) { showToast("Ya tenés a ese jugador."); return; }
  c.dinero -= precio;
  d.owned[f.num] = 1;
  if (typeof figusGuardar === "function") figusGuardar(d);
  c.mercado = (c.mercado || []).filter(e => (typeof e === "object" ? e.num : e) !== num);
  clubGuardar(c);
  if (typeof playSound === "function") playSound("ovacion");
  if (typeof figusActualizarBadge === "function") figusActualizarBadge();
  showToast(`✍️ ¡Fichaste a ${f.nombre} (${f.rating}) por $${precio.toLocaleString("es-AR")}!`, 3000);
  clubRender("mercado");
}

/* ══════════════════════════════════════════════════════════
   TEMPORADA: LIGA + LIBERTADORES con CALENDARIO intercalado
   ══════════════════════════════════════════════════════════ */
const CLUB_ID = "__club__";

function _clubSample(arr, n) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; }
  return a.slice(0, n);
}
function _clubPoolLiga() { return (typeof LIGA_LPA !== "undefined" ? LIGA_LPA.equipos : []).slice(); }
function _clubPoolLiberta() {
  let pool = [];
  ["LIGA_LPA","LIGA_BRASIL","LIGA_COLOMBIA","LIGA_ECUADOR","LIGA_VENEZUELA"].forEach(n => {
    if (typeof window !== "undefined" && window[n] && window[n].equipos) pool = pool.concat(window[n].equipos);
    else { try { const ref = eval(n); if (ref && ref.equipos) pool = pool.concat(ref.equipos); } catch(e){} }
  });
  return pool;
}
function _clubEquipoPorId(id) {
  if (typeof LIGAS === "undefined") return null;
  for (const l of LIGAS) { const e = (l.equipos||[]).find(x => x.id === id); if (e) return e; }
  return null;
}
function _clubNombreId(c, id) { return id === CLUB_ID ? c.nombre : ((_clubEquipoPorId(id)||{}).nombre || id); }
function _clubFuerzaId(id, poder) { return id === CLUB_ID ? poder : ((_clubEquipoPorId(id)||{}).fuerza || 60); }

// Fixtures y tablas: delegan en SIM (sim.js), la fuente única.
function _roundRobin(ids)              { return SIM.roundRobin(ids); }
function _tablaInit(ids)               { return SIM.tablaInit(ids); }
function _aplicarRes(tabla, a, b, ga, gb) { return SIM.aplicarResultado(tabla, a, b, ga, gb); }
function _ordenarTabla(tabla)          { return SIM.ordenarTabla(tabla); }

function _calEntry(comp, fecha) {
  const par = fecha.pares.find(p => p[0] === CLUB_ID || p[1] === CLUB_ID);
  const rivalId = par ? (par[0] === CLUB_ID ? par[1] : par[0]) : null;
  const otros = fecha.pares.filter(p => p !== par);
  return { comp, fi: fecha.fi, rivalId, otros, jugado:false, gj:0, gr:0, gano:false };
}

// Liga (objeto) en la que juega el club: la real si dirige un club real,
// si no la Liga Profesional Argentina (donde "entra" el club propio).
function _clubLigaDelClub(c) {
  const lid = c.ligaId || "lpa";
  const l = (typeof LIGAS !== "undefined") ? LIGAS.find(x => x.id === lid) : null;
  return l || ((typeof LIGA_LPA !== "undefined") ? LIGA_LPA : { equipos: [] });
}

function clubSeasonNueva(c) {
  // La liga real COMPLETA: todos los equipos de la liga del club. El jugador
  // entra como CLUB_ID; si dirige un club real, ese id no se duplica.
  const liga = _clubLigaDelClub(c);
  let rivalesLiga = (liga.equipos || []).filter(e => e.id !== c.realId).map(e => e.id);
  // Paridad par para que no haya fechas libres ("bye") sin partido del club.
  if ((rivalesLiga.length + 1) % 2 !== 0) rivalesLiga = rivalesLiga.slice(0, rivalesLiga.length - 1);
  const ligaIds = [CLUB_ID, ...rivalesLiga];
  const ligaFechas = _roundRobin(ligaIds);

  let liberta = null;
  if (c.clasificadoLiberta) {
    // La Libertadores es más dura: los rivales salen de los más fuertes
    // del continente (top por fuerza), no de cualquiera del pool.
    const pool = _clubPoolLiberta().sort((a, b) => (b.fuerza || 0) - (a.fuerza || 0));
    const elite = pool.slice(0, Math.max(6, Math.ceil(pool.length * 0.22)));
    const rivalesL = _clubSample(elite, 3).map(e => e.id);
    const lIds = [CLUB_ID, ...rivalesL];
    liberta = { ids: lIds, fechas: _roundRobin(lIds), tabla: _tablaInit(lIds) };
  }

  // Calendario: intercalar fecha de liga y fecha de libertadores
  const ligaF = ligaFechas.map((pares, fi) => ({ fi, pares }));
  const libF  = liberta ? liberta.fechas.map((pares, fi) => ({ fi, pares })) : [];
  const cal = [];
  let li = 0, ci = 0;
  while (li < ligaF.length || ci < libF.length) {
    if (li < ligaF.length) cal.push(_calEntry("liga", ligaF[li++]));
    if (ci < libF.length)  cal.push(_calEntry("liberta", libF[ci++]));
  }

  return {
    ligaIds, ligaTabla: _tablaInit(ligaIds),
    liberta, cal, idx: 0, fin: false,
    campeonLiga: null, libertaResultado: null,
    objetivo: clubObjetivoTemporada(c),
  };
}

function clubEmpezarTemporada() {
  const c = clubCargar();
  c.season = clubSeasonNueva(c);
  c.mercado = _clubMercadoGenerar(); // vidriera nueva cada temporada
  clubGuardar(c);
  if (typeof playSound === "function") playSound("win");
  showToast(c.clasificadoLiberta ? "📅 ¡Nueva temporada! Jugás Liga y Libertadores." : "📅 ¡Nueva temporada de Liga! Terminá entre los 2 primeros para clasificar a la Libertadores.", 3600);
  clubRender("temporada");
}

let _clubSeasonPend = null;

function clubSeasonJugarProximo() {
  const c = clubCargar();
  if (!c.season || c.season.fin) { showToast("No hay temporada en curso. Empezá una nueva."); return; }
  if ((c.onceIds || []).length < 3) { showToast("Armá tu 11 en el Plantel antes de salir a la cancha."); return; }
  const ent = c.season.cal[c.season.idx];
  if (!ent) return;
  const rival = _clubEquipoPorId(ent.rivalId);
  if (!rival) { showToast("Rival no encontrado."); return; }
  _clubSeasonPend = { comp: ent.comp };
  _clubLanzarVs(c, rival, ent.comp);
}

// Lanza una partida del club contra un rival concreto (real)
function _clubLanzarVs(c, rival, etiqueta) {
  const poder = clubPoder(c);
  const escudoURI = "data:image/svg+xml," + encodeURIComponent(clubEscudoSVG(c, 120));
  if (typeof equipoSel !== "undefined")  equipoSel  = { id: CLUB_ID, nombre: c.nombre, sub: c.ciudad, color: c.color, escudo: escudoURI, fuerza: poder };
  if (typeof equipoRival !== "undefined") equipoRival = rival;
  if (typeof modoAmistoso !== "undefined") modoAmistoso = true;
  if (typeof modoMundial !== "undefined") modoMundial = false;
  if (typeof modoCopa !== "undefined") modoCopa = false;
  if (typeof S !== "undefined") S.nombreJugador = c.nombre;
  if (typeof playSound === "function") playSound("silbato");
  const comp = etiqueta === "liberta" ? "🏆 Libertadores" : "🏆 Liga";
  showToast(`${comp}: ${c.nombre} (${poder}) vs ${rival.nombre} (${rival.fuerza}).`, 2600);
  if (typeof _iniciarPartida === "function") _iniciarPartida();
  if (typeof aplicarEquipoEnMesa === "function") setTimeout(aplicarEquipoEnMesa, 60);
}

// Registra el resultado del partido del CLUB en la temporada (lo llama el hook
// de finDePartido). Simula el resto de los partidos de esa fecha y avanza.
// Aplica el resultado del CLUB a la fecha actual, simula el resto de los
// partidos de esa fecha, avanza el calendario y cierra la temporada si toca.
function _clubSeasonAplicar(c, gj, gr, gano) {
  const s = c.season;
  const ent = s.cal[s.idx];
  if (!ent || ent.jugado) return;
  ent.jugado = true; ent.gj = gj; ent.gr = gr; ent.gano = gano;
  const tabla = ent.comp === "liga" ? s.ligaTabla : (s.liberta && s.liberta.tabla);
  if (tabla) _aplicarRes(tabla, CLUB_ID, ent.rivalId, gj, gr);

  const poder = clubPoder(c);
  (ent.otros || []).forEach(p => {
    if (!tabla) return;
    const r = SIM.partido(_clubFuerzaId(p[0], poder), _clubFuerzaId(p[1], poder));
    _aplicarRes(tabla, p[0], p[1], r.ga, r.gb);
  });

  s.idx++;
  if (s.idx >= s.cal.length) _clubCerrarTemporada(c);
}

// Lo llama el hook de finDePartido cuando el partido jugado era de la temporada.
function clubSeasonRegistrar(gano, puntosJugador, puntosRival, limite) {
  if (!_clubSeasonPend) return;
  _clubSeasonPend = null;
  const c = clubCargar();
  if (!c.season || c.season.fin) return;
  const factor30 = limite ? 30 / limite : 1;
  const perdPts = gano ? puntosRival : puntosJugador;
  const [gG, gP] = SIM.golesFutbol(Math.round((perdPts || 0) * factor30));
  _clubSeasonAplicar(c, gano ? gG : gP, gano ? gP : gG, gano);
  clubGuardar(c);
}

// Simular el partido del club (sin jugar al truco): rinde menos que jugarlo.
function clubSeasonSimularProximo() {
  const c = clubCargar();
  if (!c.season || c.season.fin) return;
  const ent = c.season.cal[c.season.idx];
  if (!ent) return;
  const rival = _clubEquipoPorId(ent.rivalId) || { fuerza: clubPoder(c) };
  const r = SIM.partido(clubPoder(c), rival.fuerza || 60);
  const i = c.instalaciones;
  const base = 120 + i.estadio * 70 + i.tienda * 45;
  c.dinero += Math.round((r.ganaA ? base : base * 0.3) * 0.5);
  c.partidos = (c.partidos || 0) + 1;
  _clubSeasonAplicar(c, r.ga, r.gb, r.ganaA);
  clubGuardar(c);
  if (typeof playSound === "function") playSound("click");
  showToast(`⏭️ Simulado: ${c.nombre} ${r.ga}-${r.gb} ${_clubNombreId(c, ent.rivalId)}`, 2400);
  clubRender("temporada");
}

function _clubCerrarTemporada(c) {
  const s = c.season;
  s.fin = true;

  // Campeón de Liga + posición del club
  const ordLiga = _ordenarTabla(s.ligaTabla);
  s.campeonLiga = ordLiga[0].id;
  const posClub = ordLiga.findIndex(t => t.id === CLUB_ID) + 1;

  let msg = `🏁 Fin de temporada. Liga: ${posClub}º`;
  let premio = Math.max(0, (ordLiga.length - posClub + 1)) * 250;
  if (s.campeonLiga === CLUB_ID) { premio += 2000; msg = "🏆 ¡SALISTE CAMPEÓN DE LIGA! " + msg; }

  // Palmarés
  c.palmares = c.palmares || { liga: 0, libertadores: 0 };
  let campLiga = s.campeonLiga === CLUB_ID, campLib = false;
  if (campLiga) c.palmares.liga++;

  // Libertadores: si jugó, ¿ganó el grupo?
  let posL = null;
  if (s.liberta) {
    const ordL = _ordenarTabla(s.liberta.tabla);
    posL = ordL.findIndex(t => t.id === CLUB_ID) + 1;
    if (posL === 1) { s.libertaResultado = "campeon"; premio += 3000; campLib = true; c.palmares.libertadores++; msg += " · 🌎 ¡CAMPEÓN DE LIBERTADORES!"; }
    else { s.libertaResultado = "eliminado"; msg += ` · Libertadores: ${posL}º del grupo`; }
  }

  // Objetivo del presidente (posición): cumplirlo da un plus
  const obj = s.objetivo || clubObjetivoTemporada(c);
  s.objetivoCumplido = posClub <= obj.posMax;
  if (s.objetivoCumplido) { premio += 800; msg += ` · 🎯 ¡Objetivo cumplido!`; }
  else msg += ` · 🎯 Objetivo fallado (${obj.desc})`;

  // Clasificación a la Libertadores de la PRÓXIMA temporada: top 2 de la liga
  c.clasificadoLiberta = posClub <= 2;
  if (c.clasificadoLiberta) msg += " · ✅ ¡Clasificaste a la próxima Libertadores!";

  // ── FINANZAS DE FIN DE TEMPORADA ──
  // Sponsor: ingreso fijo según Estadio + Tienda. Sueldos: gasto según
  // lo caro que es tu 11 (mejores jugadores = sueldos más altos).
  const sponsor = 600 + (c.instalaciones.estadio + c.instalaciones.tienda) * 150;
  const sueldos = clubOnce(c).reduce((s2, j) => s2 + Math.max(0, (j.rating || 60) - 50) * 8, 0);
  premio += sponsor;
  c.dinero += premio - sueldos;
  msg += ` · 💰 Sponsor +$${sponsor.toLocaleString("es-AR")} · 💸 Sueldos -$${sueldos.toLocaleString("es-AR")} · Premios +$${premio.toLocaleString("es-AR")}`;
  if (typeof figusOtorgarSobres === "function") figusOtorgarSobres(2);

  // Historial / vitrina
  c.historial = c.historial || [];
  c.historial.unshift({ temporada: c.temporada, posLiga: posClub, campLiga, posLib: posL, campLib });
  if (c.historial.length > 12) c.historial.length = 12;

  c.temporada = (c.temporada || 1) + 1; // la próxima campaña endurece el objetivo

  setTimeout(() => { if (typeof showToast === "function") showToast(msg, 5500); }, 1600);
}

function clubGenerarJuvenil(c) {
  const nom = CLUB_NOMBRES_JUV[Math.floor(Math.random() * CLUB_NOMBRES_JUV.length)] + " " +
              CLUB_APELLIDOS_JUV[Math.floor(Math.random() * CLUB_APELLIDOS_JUV.length)];
  const pos = CLUB_POS_JUV[Math.floor(Math.random() * CLUB_POS_JUV.length)];
  const rating = Math.min(90, 56 + c.instalaciones.cantera * 4 + Math.floor(Math.random() * 9));
  const id = "j" + Date.now().toString(36) + Math.floor(Math.random() * 1000);
  return { num: id, nombre: nom, pos, rating, rango: "juvenil" };
}

/* ══════════════════════════════════════════════════════════
   ACCIONES DEL DT
   ══════════════════════════════════════════════════════════ */
function clubEntrenar(tipo) {
  const c = clubCargar();
  const costo = Math.max(15, 25 - c.instalaciones.ciudad * 2); // Ciudad Deportiva abarata
  if (c.energia < costo) { showToast("El plantel está agotado. Hacé descansar o mejorá el Centro Médico."); return; }
  const ganancia = 1 + c.instalaciones.ciudad * 0.5;
  c.entren[tipo] = Math.round((c.entren[tipo] + ganancia) * 10) / 10;
  c.energia -= costo;
  c.moral = Math.max(0, c.moral - 2);
  clubGuardar(c);
  const nom = { fisico:"físico", tecnico:"técnico", tactico:"táctico" }[tipo] || tipo;
  if (typeof playSound === "function") playSound("silbato");
  showToast(`🏃 Sesión de entrenamiento ${nom} completada. Poder en alza.`);
  clubRender("entren");
}

function clubDescansar() {
  const c = clubCargar();
  const rec = 30 + c.instalaciones.medico * 12;
  c.energia = Math.min(clubEnergiaMax(c), c.energia + rec);
  clubGuardar(c);
  if (typeof playSound === "function") playSound("click");
  showToast(`😴 El plantel descansó. +${rec} de energía.`);
  clubRender("entren");
}

function clubOcio() {
  const c = clubCargar();
  const sube = 8 + c.instalaciones.ocio * 5;
  const costo = 80;
  if (c.dinero < costo) { showToast("No te alcanza la plata para la actividad de ocio ($80)."); return; }
  c.dinero -= costo;
  c.moral = Math.min(clubMoralMax(), c.moral + sube);
  clubGuardar(c);
  if (typeof playSound === "function") playSound("punto");
  showToast(`🎉 Actividad de ocio: +${sube} de moral.`);
  clubRender("entren");
}

function clubSetTactica(t) {
  const c = clubCargar();
  if (!CLUB_TACTICAS[t]) return;
  c.tactica = t;
  clubGuardar(c);
  clubRender("tactica");
}

function clubMejorar(id) {
  const c = clubCargar();
  const nivel = c.instalaciones[id] || 0;
  if (nivel >= CLUB_INST_MAX) { showToast("Esa instalación ya está al máximo nivel."); return; }
  const costo = clubCostoMejora(id, nivel);
  if (c.dinero < costo) { showToast(`Te faltan $${(costo - c.dinero).toLocaleString("es-AR")} para esa mejora. ¡A ganar partidos!`); return; }
  c.dinero -= costo;
  c.instalaciones[id] = nivel + 1;
  clubGuardar(c);
  if (typeof playSound === "function") playSound("ovacion");
  const inst = CLUB_INSTALACIONES.find(x => x.id === id);
  showToast(`🏗️ ${inst ? inst.nombre : id} mejorado a nivel ${nivel + 1}.`);
  clubRender("instal");
}

function clubToggleOnce(num) {
  const c = clubCargar();
  c.onceIds = c.onceIds || [];
  const i = c.onceIds.indexOf(num);
  if (i !== -1) { c.onceIds.splice(i, 1); }
  else {
    if (c.onceIds.length >= 11) { showToast("Ya tenés 11 titulares. Sacá uno para poner otro."); return; }
    c.onceIds.push(num);
  }
  clubGuardar(c);
  clubRender("plantel");
}

function clubOnceAuto() {
  const c = clubCargar();
  c.onceIds = clubPlantelDisponible(c).slice(0, 11).map(p => p.num);
  clubGuardar(c);
  if (typeof playSound === "function") playSound("click");
  showToast("⚽ Armé el 11 ideal con tus mejores jugadores.");
  clubRender("plantel");
}

/* ══════════════════════════════════════════════════════════
   COMODINES DE PARTIDO — la ventaja se siente en la cancha.
   Se re-arman en cada mano según el nivel de las instalaciones.
   Solo en partidos contra la IA (no online).
   ══════════════════════════════════════════════════════════ */
let CLUB_PERKS = null;

function clubPerksReset() {
  const c = clubCargar();
  // Los comodines NO se usan en competencias externas (Mundial / Copas) ni
  // online, ni si el jugador los apagó: ahí el partido tiene que ser parejo.
  const enCompetencia = (typeof modoMundial !== "undefined" && modoMundial) ||
                        (typeof modoCopa !== "undefined" && modoCopa);
  if (!c.fundado || c.cfgComodines === false || enCompetencia ||
      (typeof S !== "undefined" && S.modoOnline)) { CLUB_PERKS = null; clubPerksRender(); return; }
  const i = c.instalaciones;
  CLUB_PERKS = {
    ojo:      i.estadio  >= 2 ? 1 : 0,
    pizarron: i.ciudad   >= 2 ? 1 : 0,
    garra:    i.gimnasio >= 2 ? 1 : 0,
    garraArmada: false,
  };
  clubPerksRender();
}

function clubPerksRender() {
  _clubInyectarCSS();
  const bar = document.getElementById("club-perks-bar");
  if (!bar) return;
  if (!CLUB_PERKS || (typeof S !== "undefined" && (S.modoOnline || S.juegoTerminado))) { bar.innerHTML = ""; bar.style.display = "none"; return; }

  const enR0    = typeof S !== "undefined" && S.rondaActual === 0 && !S.jugadorTiroEnR0;
  const miTurno = typeof S !== "undefined" && S.turnoActual === "jugador" && !S.cantoPendiente;
  let html = "";
  if (CLUB_PERKS.ojo > 0)
    html += `<button class="club-perk" ${enR0 ? "" : "disabled"} onclick="clubUsarPerk('ojo')">👁 Veedor</button>`;
  if (CLUB_PERKS.pizarron > 0)
    html += `<button class="club-perk" ${(enR0 && miTurno && !S.envidoCantado) ? "" : "disabled"} onclick="clubUsarPerk('pizarron')">📋 Pizarrón</button>`;
  if (CLUB_PERKS.garra > 0)
    html += `<button class="club-perk${CLUB_PERKS.garraArmada ? " on" : ""}" onclick="clubUsarPerk('garra')">💪 Garra${CLUB_PERKS.garraArmada ? " ✓" : ""}</button>`;

  bar.innerHTML = html;
  bar.style.display = html ? "flex" : "none";
}

function clubUsarPerk(id) {
  if (!CLUB_PERKS || typeof S === "undefined") return;

  if (id === "ojo") {
    if (CLUB_PERKS.ojo <= 0) return;
    if (!(S.rondaActual === 0 && !S.jugadorTiroEnR0)) { showToast("El Veedor solo sirve antes de tirar la primera carta."); return; }
    const e = (typeof calcularEnvido === "function") ? calcularEnvido(S.manoRival) : "?";
    const flor = S.cfgFlor && typeof tieneFlor === "function" && tieneFlor(S.manoRival);
    CLUB_PERKS.ojo = 0;
    if (typeof playSound === "function") playSound("canto");
    showToast(`👁 El veedor: el rival tiene ${e} de envido${flor ? " y ¡FLOR!" : ""}.`, 3200);
    clubPerksRender();
    return;
  }

  if (id === "pizarron") {
    if (CLUB_PERKS.pizarron <= 0) return;
    if (!(S.rondaActual === 0 && !S.jugadorTiroEnR0 && !S.envidoCantado && S.turnoActual === "jugador" && !S.cantoPendiente)) {
      showToast("El Pizarrón solo sirve en tu turno, antes de tirar y antes del envido."); return;
    }
    const usados = new Set([...(S.manoJugador||[]), ...(S.manoRival||[]), ...(S.cartasRondaJugador||[]), ...(S.cartasRondaRival||[])].filter(Boolean));
    const disp = Object.keys(C).filter(k => !usados.has(k));
    if (disp.length < 3) { showToast("No hay cartas para re-repartir."); return; }
    const nuevas = (typeof mezclarMazo === "function" ? mezclarMazo(disp) : disp).slice(0, 3);
    S.manoJugador = nuevas;
    if (typeof tieneFlor === "function") {
      S.jugadorTieneFlor = tieneFlor(S.manoJugador);
      S.florTerminada = !S.cfgFlor || !(S.jugadorTieneFlor || S.rivalTieneFlor);
    }
    CLUB_PERKS.pizarron = 0;
    if (typeof playSound === "function") playSound("deal");
    showToast("📋 Pizarrón: te repartiste una mano nueva.");
    if (typeof actualizarTodaLaInterfaz === "function") actualizarTodaLaInterfaz();
    clubPerksRender();
    return;
  }

  if (id === "garra") {
    if (CLUB_PERKS.garra <= 0) return;
    CLUB_PERKS.garraArmada = !CLUB_PERKS.garraArmada;
    if (typeof playSound === "function") playSound("click");
    showToast(CLUB_PERKS.garraArmada ? "💪 Garra armada: ganás la próxima parda." : "Garra desactivada.");
    clubPerksRender();
    return;
  }
}

// La llama el motor (resolverFinDeRonda) cuando hay parda: si la Garra
// está armada, la consume y devuelve true para dársela al jugador.
function clubConsumirGarra() {
  if (CLUB_PERKS && CLUB_PERKS.garraArmada && CLUB_PERKS.garra > 0) {
    CLUB_PERKS.garra = 0;
    CLUB_PERKS.garraArmada = false;
    clubPerksRender();
    return true;
  }
  return false;
}

/* ══════════════════════════════════════════════════════════
   CREACIÓN DEL CLUB
   ══════════════════════════════════════════════════════════ */
let _clubColorSel = CLUB_COLORES[0];
let _clubColor2Sel = "#ffffff";

function clubFundar() {
  const nombre = (document.getElementById("club-in-nombre")?.value || "").trim();
  const ciudad = (document.getElementById("club-in-ciudad")?.value || "").trim();
  const estadio = (document.getElementById("club-in-estadio")?.value || "").trim();
  if (!nombre) { showToast("Poné un nombre para tu club."); return; }
  const c = clubNuevo();
  c.fundado = true;
  c.nombre = nombre;
  c.ciudad = ciudad || "Tu ciudad";
  c.estadioNombre = estadio || ("Estadio " + nombre);
  c.color = _clubColorSel;
  c.color2 = _clubColor2Sel;
  c.escudoForma = _clubForm.forma || 0;
  c.iniciales = _clubForm.iniciales || "";
  c.ligaId = "lpa";            // el club propio entra a la Liga Profesional
  _clubRegaloInicial(c);       // plantel humilde para arrancar + 11 armado
  clubGuardar(c);
  if (typeof playSound === "function") playSound("win");
  showToast(`🎉 ¡Fundaste ${nombre}! Te dejé un plantel para arrancar. A construir el imperio.`, 3400);
  clubActualizarBadge();
  clubRender("resumen");
}

// Empezar la carrera dirigiendo un CLUB REAL (estilo Modo DT, ahora dentro
// del mismo modo). Toma su nombre/colores/escudo y su liga real.
function clubDirigirReal(realId) {
  const r = (typeof _clubEquipoPorId === "function") ? _clubEquipoPorId(realId) : null;
  if (!r) { showToast("Club no encontrado."); return; }
  const liga = (typeof LIGAS !== "undefined") ? LIGAS.find(l => (l.equipos || []).some(e => e.id === realId)) : null;
  const c = clubNuevo();
  c.fundado = true;
  c.realId = realId;
  c.ligaId = liga ? liga.id : "lpa";
  c.nombre = r.nombre;
  c.ciudad = r.sub || "";
  c.estadioNombre = "Estadio de " + r.nombre;
  c.color = r.color || "#1e88e5";
  c.color2 = "#ffffff";
  c.escudoReal = r.escudo || "";
  _clubRegaloInicial(c);
  clubGuardar(c);
  if (typeof playSound === "function") playSound("win");
  showToast(`🎉 Te hacés cargo de ${r.nombre}. ¡A hacer historia, DT!`, 3400);
  clubActualizarBadge();
  clubRender("resumen");
}

/* ══════════════════════════════════════════════════════════
   RENDER
   ══════════════════════════════════════════════════════════ */
let _clubTab = "resumen";

function clubAbrir() {
  if (typeof irA === "function") irA("club-screen");
  clubRender(_clubTab);
}

function clubRender(tab) {
  _clubInyectarCSS();
  if (tab) _clubTab = tab;
  const mount = document.getElementById("club-mount");
  if (!mount) return;
  const c = clubCargar();

  if (!c.fundado) { mount.innerHTML = _clubRenderCreacion(); return; }

  const tabs = [
    ["resumen","📋 Resumen"], ["temporada","📅 Liga/Copa"], ["mercado","💸 Fichajes"],
    ["instal","🏗️ Obras"], ["entren","🏃 Entreno"], ["plantel","👥 Plantel"], ["tactica","♟️ Táctica"],
  ];
  let html = _clubHeader(c) +
    '<div class="club-tabs">' +
    tabs.map(([id, lbl]) => `<button class="club-tab${_clubTab===id?" active":""}" onclick="clubRender('${id}')">${lbl}</button>`).join("") +
    '</div><div class="club-tabbody">';

  if (_clubTab === "resumen")   html += _clubRenderResumen(c);
  if (_clubTab === "temporada") html += _clubRenderTemporada(c);
  if (_clubTab === "mercado")   html += _clubRenderMercado(c);
  if (_clubTab === "instal")    html += _clubRenderInstal(c);
  if (_clubTab === "entren")    html += _clubRenderEntren(c);
  if (_clubTab === "plantel")   html += _clubRenderPlantel(c);
  if (_clubTab === "tactica")   html += _clubRenderTactica(c);

  html += "</div>";
  mount.innerHTML = html;
}

// Escudo del club: imagen real si dirige un club real, si no el SVG propio.
function _clubEscudoHTML(c, size) {
  if (c.realId && c.escudoReal) {
    const src = (typeof escudoDe === "function") ? escudoDe({ id: c.realId, escudo: c.escudoReal }) : c.escudoReal;
    return `<img src="${src}" width="${size}" height="${size}" style="object-fit:contain;background:rgba(255,255,255,.9);border-radius:9px;padding:3px;box-shadow:0 0 0 1px rgba(0,0,0,.25)" onerror="escudoFallback&&escudoFallback(this)">`;
  }
  return clubEscudoSVG(c, size);
}

function _clubHeader(c) {
  return `<div class="club-header">
    <div class="club-escudo">${_clubEscudoHTML(c, 60)}</div>
    <div class="club-hinfo">
      <div class="club-nombre">${esc(c.nombre)}</div>
      <div class="club-sub">${esc(c.ciudad)} · ${esc(c.estadioNombre)}</div>
    </div>
    <div class="club-money">
      <div class="club-dinero">$${c.dinero.toLocaleString("es-AR")}</div>
      <div class="club-poder">PODER ${clubPoder(c)}</div>
    </div>
  </div>`;
}

function _clubBarra(label, val, max, color) {
  const pct = Math.max(0, Math.min(100, Math.round((val / max) * 100)));
  return `<div class="club-stat">
    <div class="club-stat-top"><span>${label}</span><span>${Math.round(val)}/${max}</span></div>
    <div class="club-bar"><div style="width:${pct}%;background:${color}"></div></div>
  </div>`;
}

function _clubRenderResumen(c) {
  const once = clubOnce(c);
  const perks = [];
  if (c.instalaciones.estadio  >= 2) perks.push("👁 Veedor");
  if (c.instalaciones.ciudad   >= 2) perks.push("📋 Pizarrón");
  if (c.instalaciones.gimnasio >= 2) perks.push("💪 Garra");
  // Tarjeta de temporada (la campaña de Liga/Copa es LA temporada)
  let tempCard;
  if (c.season && !c.season.fin) {
    const s = c.season;
    tempCard = `<div class="club-card">
      <div class="club-card-t">📅 Temporada ${c.temporada} · Objetivo del presidente</div>
      <div class="club-card-sub">${(s.objetivo||clubObjetivoTemporada(c)).desc} · Partido ${s.idx+1}/${s.cal.length}${s.liberta?" · jugás Liga + Libertadores":""}</div>
      <button class="btn primary" style="margin-top:8px;width:100%" onclick="clubRender('temporada')">📅 IR A LA TEMPORADA</button>
    </div>`;
  } else {
    tempCard = `<div class="club-card">
      <div class="club-card-t">📅 Temporada ${c.temporada}</div>
      <div class="club-card-sub">${c.season&&c.season.fin?"La temporada terminó. ":""}Empezá una nueva campaña de Liga${c.clasificadoLiberta?" + Libertadores":""} desde la pestaña Liga/Copa.</div>
      <button class="btn primary" style="margin-top:8px;width:100%" onclick="clubRender('temporada')">📅 IR A LA TEMPORADA</button>
    </div>`;
  }
  return `
    <div class="club-resumen-grid">
      ${_clubBarra("⚡ Energía", c.energia, clubEnergiaMax(c), "#43a047")}
      ${_clubBarra("😊 Moral",   c.moral,   clubMoralMax(),    "#fdd835")}
    </div>
    ${tempCard}
    <div class="club-card">
      <div class="club-card-t">💪 Poder del Club: <b>${clubPoder(c)}</b></div>
      <div class="club-card-sub">11 titular: ${once.length}/11 · Táctica: ${CLUB_TACTICAS[c.tactica].label} · Partidos totales: ${c.partidos||0}</div>
      <button class="btn primary" style="margin-top:8px;width:100%" onclick="clubJugarPartido()">⚽ JUGAR PARTIDO DEL CLUB</button>
      <div class="club-card-sub" style="margin-top:5px">Te toca un rival escalado a tu Poder: más fuerte sos, más duro el rival y más paga.</div>
    </div>
    <div class="club-card">
      <div class="club-card-t">🎟️ Comodines en la cancha <span style="float:right;cursor:pointer;color:${c.cfgComodines===false?'rgba(255,255,255,.4)':'var(--gold,#f5c518)'}" onclick="clubToggleComodines()">${c.cfgComodines===false?"OFF":"ON"}</span></div>
      <div class="club-card-sub">${perks.length ? "Disponibles cada mano: <b>" + perks.join(" · ") + "</b>. Aparecen arriba de tus acciones (no se usan en Mundial ni Copas)." : "Mejorá Estadio, Ciudad Deportiva o Gimnasio a Nv2 para desbloquear comodines de partido."}</div>
    </div>
    ${_clubVitrinaCard(c)}`;
}

function _clubVitrinaCard(c) {
  const p = c.palmares || { liga:0, libertadores:0 };
  let hist = "";
  if (c.historial && c.historial.length) {
    hist = '<div class="club-hist">' + c.historial.slice(0, 6).map(h => {
      const liga = h.campLiga ? "🏆" : `${h.posLiga}º`;
      const lib  = h.campLib ? " · 🌎" : (h.posLib ? "" : "");
      return `<div class="club-hist-row"><span>T${h.temporada}</span><span>Liga ${liga}${lib}</span></div>`;
    }).join("") + "</div>";
  }
  return `<div class="club-card">
    <div class="club-card-t">🏆 Vitrina del club</div>
    <div class="club-card-sub">Ligas: <b>${p.liga}</b> 🏆 · Libertadores: <b>${p.libertadores}</b> 🌎</div>
    ${hist || '<div class="club-card-sub" style="margin-top:4px">Todavía no ganaste títulos. ¡A hacer historia!</div>'}
  </div>`;
}

function _clubRenderInstal(c) {
  let html = '<div class="club-inst-list">';
  CLUB_INSTALACIONES.forEach(inst => {
    const nivel = c.instalaciones[inst.id] || 0;
    const tope = nivel >= CLUB_INST_MAX;
    const costo = tope ? 0 : clubCostoMejora(inst.id, nivel);
    const puede = !tope && c.dinero >= costo;
    const pips = Array.from({length: CLUB_INST_MAX}, (_, k) => `<span class="club-pip${k < nivel ? " on" : ""}"></span>`).join("");
    html += `<div class="club-inst">
      <div class="club-inst-ic">${inst.icon}</div>
      <div class="club-inst-mid">
        <div class="club-inst-nom">${inst.nombre} <span class="club-inst-lv">Nv ${nivel}</span></div>
        <div class="club-inst-desc">${inst.desc}</div>
        <div class="club-pips">${pips}</div>
      </div>
      <div class="club-inst-act">
        ${tope ? '<span class="club-max">MÁX</span>'
               : `<button class="btn${puede?" primary":""}" ${puede?"":"disabled"} onclick="clubMejorar('${inst.id}')">$${costo.toLocaleString("es-AR")}</button>`}
      </div>
    </div>`;
  });
  html += "</div>";
  return html;
}

function _clubRenderEntren(c) {
  const costo = Math.max(15, 25 - c.instalaciones.ciudad * 2);
  return `
    <div class="club-resumen-grid">
      ${_clubBarra("⚡ Energía", c.energia, clubEnergiaMax(c), "#43a047")}
      ${_clubBarra("😊 Moral",   c.moral,   clubMoralMax(),    "#fdd835")}
    </div>
    <div class="club-card-sub" style="margin:8px 0">Entrenar sube el Poder pero gasta ${costo} de energía (la Ciudad Deportiva lo abarata). Acumulado: Fís ${c.entren.fisico} · Téc ${c.entren.tecnico} · Tác ${c.entren.tactico}.</div>
    <div class="club-train-grid">
      <button class="btn" onclick="clubEntrenar('fisico')">🏃 Físico</button>
      <button class="btn" onclick="clubEntrenar('tecnico')">🎯 Técnico</button>
      <button class="btn" onclick="clubEntrenar('tactico')">🧠 Táctico</button>
      <button class="btn" onclick="clubDescansar()">😴 Descansar</button>
      <button class="btn" onclick="clubOcio()">🎉 Ocio ($80)</button>
    </div>`;
}

function _clubRenderTactica(c) {
  let html = '<div class="club-tac-list">';
  Object.keys(CLUB_TACTICAS).forEach(t => {
    const tac = CLUB_TACTICAS[t];
    const sel = c.tactica === t;
    html += `<button class="club-tac${sel?" active":""}" onclick="clubSetTactica('${t}')">
      <div class="club-tac-nom">${tac.label}</div>
      <div class="club-tac-desc">${tac.desc}</div>
    </button>`;
  });
  html += "</div>";
  return html;
}

function _clubRenderPlantel(c) {
  const todos = clubPlantelDisponible(c);
  const onceSet = new Set(c.onceIds || []);

  let html = `<div class="club-plantel-top">
    <span>11 titular: <b>${(c.onceIds||[]).length}/11</b></span>
    <button class="btn primary" onclick="clubOnceAuto()">⚡ 11 ideal</button>
  </div>`;

  if (todos.length === 0) {
    return html + `<div class="club-card-sub" style="margin-top:10px">Todavía no tenés jugadores. Conseguí figuritas ganando partidos (la Cantera te da juveniles propios y sobres) y armá tu plantel acá.</div>`;
  }

  html += '<div class="club-plantel-grid">';
  todos.forEach(p => {
    const titular = onceSet.has(p.num);
    const idArg = typeof p.num === "string" ? `'${p.num}'` : p.num;
    const posCorta = typeof _figuPosCorta === "function" ? _figuPosCorta(p.pos) : (p.pos||"").substring(0,3).toUpperCase();
    html += `<button class="club-jug${titular?" titular":""}${p.juvenil?" juv":""}" onclick="clubToggleOnce(${idArg})" title="${esc(p.nombre)}">
      <span class="club-jug-rat">${p.rating||""}</span>
      <span class="club-jug-pos">${posCorta}${p.juvenil?" · JUV":""}</span>
      <span class="club-jug-nom">${esc(p.nombre)}</span>
      ${titular?'<span class="club-jug-check">✓</span>':''}
    </button>`;
  });
  html += "</div>";
  return html;
}

function _clubTablaHTML(c, tabla, titulo, resaltarTop) {
  const ord = _ordenarTabla(tabla);
  let html = `<div class="club-card-t">${titulo}</div><table class="club-tabla"><thead><tr><th>#</th><th class="tl">Equipo</th><th>PJ</th><th>Pts</th><th>DG</th></tr></thead><tbody>`;
  ord.forEach((t, i) => {
    const mio = t.id === CLUB_ID;
    const zona = (resaltarTop && i < resaltarTop) ? "z4" : "";
    const dg = (t.gf||0) - (t.gc||0);
    html += `<tr class="${mio?"mio ":""}${zona}"><td>${i+1}</td><td class="tl">${_clubNombreId(c, t.id)}${mio?" ★":""}</td><td>${t.pj}</td><td><b>${t.pts}</b></td><td>${dg>0?"+":""}${dg}</td></tr>`;
  });
  html += "</tbody></table>";
  return html;
}

function _clubRenderTemporada(c) {
  if (!c.season) {
    return `<div class="club-card">
      <div class="club-card-t">📅 Temporada del club</div>
      <div class="club-card-sub">Jugá una temporada completa: tu Liga (todos contra todos)${c.clasificadoLiberta?" y la <b>Copa Libertadores</b> en simultáneo, con un calendario intercalado como en la vida real":". Si terminás entre los 2 primeros, clasificás a la Libertadores"}.</div>
      <button class="btn primary" style="margin-top:10px;width:100%" onclick="clubEmpezarTemporada()">▶ EMPEZAR TEMPORADA</button>
    </div>`;
  }
  const s = c.season;
  let html = "";

  if (s.fin) {
    html += `<div class="club-card"><div class="club-card-t">🏁 Temporada terminada</div>
      <div class="club-card-sub">Campeón de Liga: <b>${_clubNombreId(c, s.campeonLiga)}</b>${s.libertaResultado==="campeon"?" · 🌎 ¡Fuiste campeón de Libertadores!":(s.liberta?" · Libertadores: quedaste en el grupo":"")}</div>
      <button class="btn primary" style="margin-top:10px;width:100%" onclick="clubEmpezarTemporada()">▶ NUEVA TEMPORADA</button></div>`;
  } else {
    const ent = s.cal[s.idx];
    const total = s.cal.length;
    html += `<div class="club-card">
      <div class="club-card-t">📅 Próximo partido (${s.idx+1}/${total})</div>
      <div class="club-card-sub">🎯 Objetivo: ${(s.objetivo||clubObjetivoTemporada(c)).desc}</div>
      <div class="club-card-sub" style="margin-top:3px">${ent.comp==="liberta"?"🌎 Libertadores":"🏆 Liga"} · ${c.nombre} vs <b>${_clubNombreId(c, ent.rivalId)}</b></div>
      <button class="btn primary" style="margin-top:10px;width:100%" onclick="clubSeasonJugarProximo()">⚽ JUGAR ESTE PARTIDO</button>
      <button class="btn" style="margin-top:6px;width:100%" onclick="clubSeasonSimularProximo()">⏭️ Simular este partido</button>
    </div>`;
  }

  // Calendario (próximos y jugados)
  html += '<div class="club-card"><div class="club-card-t">🗓️ Calendario</div><div class="club-cal">';
  s.cal.forEach((e, i) => {
    const estado = e.jugado ? `${e.gj}-${e.gr} ${e.gano?"✓":"✗"}` : (i === s.idx && !s.fin ? "▶" : "·");
    const cls = e.jugado ? (e.gano ? "win" : "lose") : (i === s.idx && !s.fin ? "next" : "");
    html += `<div class="club-cal-row ${cls}"><span class="club-cal-comp">${e.comp==="liberta"?"🌎":"🏆"}</span><span class="club-cal-riv">${_clubNombreId(c, e.rivalId)}</span><span class="club-cal-res">${estado}</span></div>`;
  });
  html += "</div></div>";

  // Tablas
  html += `<div class="club-card">${_clubTablaHTML(c, s.ligaTabla, "🏆 Tabla de la Liga", 2)}<div class="club-card-sub" style="margin-top:6px">Los 2 primeros (resaltados) clasifican a la Libertadores del año que viene.</div></div>`;
  if (s.liberta) html += `<div class="club-card">${_clubTablaHTML(c, s.liberta.tabla, "🌎 Grupo de Libertadores", 1)}<div class="club-card-sub" style="margin-top:6px">Salí 1º del grupo para ser campeón continental.</div></div>`;

  return html;
}

function _clubRenderMercado(c) {
  const lista = clubMercadoLista(c);
  let html = `<div class="club-plantel-top"><span>💸 Mercado · Caja: <b>$${c.dinero.toLocaleString("es-AR")}</b></span><button class="btn" onclick="clubMercadoRefrescar()">🔄 Refrescar</button></div>
    <div class="club-card-sub" style="margin:0 0 8px">Los precios se mueven por la demanda. La vidriera rota cada temporada.</div>`;
  if (!lista.length) return html + `<div class="club-card-sub" style="margin-top:10px">No hay jugadores en venta (¿ya los tenés a todos?). Tocá Refrescar.</div>`;
  html += '<div class="club-mercado-grid">';
  lista.forEach(({ f, precio, tendencia }) => {
    const puede = c.dinero >= precio;
    const col = (typeof FIGUS_RANGOS !== "undefined" && FIGUS_RANGOS[f.rango]) ? FIGUS_RANGOS[f.rango].color : "#ccc";
    const pos = typeof _figuPosCorta === "function" ? _figuPosCorta(f.pos) : f.pos;
    const tend = tendencia === "alza" ? '<span class="club-tend alza">▲ cotizado</span>'
              : tendencia === "oferta" ? '<span class="club-tend oferta">▼ oferta</span>' : '';
    html += `<div class="club-ficha">
      <div class="club-ficha-top"><span class="club-ficha-rat">${f.rating}</span><span class="club-ficha-rango" style="color:${col}">${(FIGUS_RANGOS[f.rango]||{}).label||""}</span></div>
      <div class="club-ficha-nom">${f.nombre}</div>
      <div class="club-ficha-pos">${pos}</div>
      ${tend}
      <button class="btn${puede?" primary":""}" ${puede?"":"disabled"} onclick="clubFichar(${f.num})">$${precio.toLocaleString("es-AR")}</button>
    </div>`;
  });
  html += "</div>";
  return html;
}

let _clubCrearModo = "propio"; // "propio" | "real"
function clubSetCrearModo(m) { _clubCrearModo = m; clubRender(); }

function _clubRenderCreacion() {
  const tabs = `<div class="club-crear-modos">
    <button class="club-modo${_clubCrearModo==="propio"?" on":""}" onclick="clubSetCrearModo('propio')">🏛️ Fundar club propio</button>
    <button class="club-modo${_clubCrearModo==="real"?" on":""}" onclick="clubSetCrearModo('real')">🛡️ Dirigir club real</button>
  </div>`;

  if (_clubCrearModo === "real") {
    const ligasReales = ["lpa"];
    let grid = "";
    (typeof LIGAS !== "undefined" ? LIGAS : []).filter(l => ligasReales.includes(l.id)).forEach(l => {
      grid += `<div class="club-real-liga">${l.nombre}</div><div class="club-real-grid">`;
      (l.equipos || []).slice().sort((a,b)=>(b.fuerza||0)-(a.fuerza||0)).forEach(e => {
        const src = (typeof escudoDe === "function") ? escudoDe(e) : (e.escudo||"");
        grid += `<button class="club-real-eq" onclick="clubDirigirReal('${e.id}')" title="${e.nombre}">
          <img src="${src}" onerror="escudoFallback&&escudoFallback(this)"><span>${e.nombre}</span></button>`;
      });
      grid += "</div>";
    });
    return `<div class="club-crear">
      <h2 class="club-crear-t">🛡️ DIRIGÍ UN CLUB</h2>
      <p class="club-crear-sub">Elegí un club real y dirigilo como DT y presidente: su liga, su escudo, su historia.</p>
      ${tabs}
      <div class="club-real-cont">${grid}</div>
    </div>`;
  }

  const cols = CLUB_COLORES.map(col => `<button class="club-col${col===_clubColorSel?" sel":""}" style="background:${col}" onclick="clubElegirColor('${col}',1)"></button>`).join("");
  const cols2 = CLUB_COLORES.map(col => `<button class="club-col${col===_clubColor2Sel?" sel":""}" style="background:${col}" onclick="clubElegirColor('${col}',2)"></button>`).join("");
  const formas = CLUB_FORMAS.map((f, i) =>
    `<button class="club-forma${i===(_clubForm.forma||0)?" sel":""}" onclick="clubElegirForma(${i})">${clubEscudoSVG({nombre:" ", iniciales:" ", escudoForma:i, color:_clubColorSel, color2:_clubColor2Sel, instalaciones:{tienda:0}}, 34)}</button>`
  ).join("");
  return `
    <div class="club-crear">
      <h2 class="club-crear-t">🏛️ FUNDÁ TU CLUB</h2>
      <p class="club-crear-sub">Creá un club de la nada y construí todo: ciudad deportiva, estadio, cantera y más. Sos el presidente y el DT.</p>
      ${tabs}
      <div class="club-prev" id="club-prev">${clubEscudoSVG({nombre:_clubForm.nombre||"FC", iniciales:_clubForm.iniciales, escudoForma:_clubForm.forma, color:_clubColorSel, color2:_clubColor2Sel, instalaciones:{tienda:0}}, 90)}</div>
      <label class="club-lbl">Nombre del club</label>
      <input id="club-in-nombre" class="club-input" maxlength="22" placeholder="Ej: Atlético Truco" value="${_clubEsc(_clubForm.nombre)}" oninput="clubFormInput()">
      <label class="club-lbl">Iniciales del escudo (máx 3)</label>
      <input id="club-in-iniciales" class="club-input" maxlength="3" placeholder="Auto del nombre (ej: ATR)" value="${_clubEsc(_clubForm.iniciales)}" oninput="clubFormInput()">
      <label class="club-lbl">Ciudad</label>
      <input id="club-in-ciudad" class="club-input" maxlength="22" placeholder="Ej: Rosario" value="${_clubEsc(_clubForm.ciudad)}" oninput="clubFormInput()">
      <label class="club-lbl">Nombre del estadio</label>
      <input id="club-in-estadio" class="club-input" maxlength="26" placeholder="Ej: La Bombonerita" value="${_clubEsc(_clubForm.estadio)}" oninput="clubFormInput()">
      <label class="club-lbl">Silueta del escudo</label>
      <div class="club-formas">${formas}</div>
      <label class="club-lbl">Color principal</label>
      <div class="club-cols">${cols}</div>
      <label class="club-lbl">Color secundario</label>
      <div class="club-cols">${cols2}</div>
      <button class="btn primary club-fundar" onclick="clubFundar()">⚽ FUNDAR EL CLUB</button>
    </div>`;
}

// Regala un plantel inicial (comunes/plata) hasta llegar a 11 jugadores
// y deja el 11 titular armado, para que un club nuevo pueda jugar ya.
function _clubRegaloInicial(c) {
  if (typeof FIGUS === "undefined" || typeof figusCargar !== "function") return;
  const d = figusCargar();
  const candidatos = FIGUS
    .filter(f => !d.owned[f.num] && (f.rango === "comun" || f.rango === "plata"))
    .sort((a, b) => (a.rating || 0) - (b.rating || 0)); // los más humildes primero
  const faltan = Math.max(0, 11 - Object.keys(d.owned || {}).length);
  candidatos.slice(0, faltan).forEach(f => { d.owned[f.num] = 1; });
  if (typeof figusGuardar === "function") figusGuardar(d);
  if (typeof figusActualizarBadge === "function") figusActualizarBadge();
  c.onceIds = clubPlantelDisponible(c).slice(0, 11).map(p => p.num);
}

// Guarda lo tipeado para que NO se borre al re-dibujar (al elegir color, etc.)
let _clubForm = { nombre: "", ciudad: "", estadio: "", iniciales: "", forma: 0 };
function _clubEsc(s) { return String(s || "").replace(/&/g,"&amp;").replace(/"/g,"&quot;").replace(/</g,"&lt;").replace(/>/g,"&gt;"); }
function clubFormInput() {
  _clubForm.nombre    = document.getElementById("club-in-nombre")?.value || "";
  _clubForm.ciudad    = document.getElementById("club-in-ciudad")?.value || "";
  _clubForm.estadio   = document.getElementById("club-in-estadio")?.value || "";
  _clubForm.iniciales = (document.getElementById("club-in-iniciales")?.value || "").toUpperCase().slice(0,3);
  clubRefrescarPrev();
}
function clubElegirColor(col, cual) {
  clubFormInput(); // captura lo tipeado antes de re-dibujar
  if (cual === 2) _clubColor2Sel = col; else _clubColorSel = col;
  clubRender();
}
function clubElegirForma(i) {
  clubFormInput();
  _clubForm.forma = i;
  clubRender();
}
function clubRefrescarPrev() {
  const prev = document.getElementById("club-prev");
  if (prev) prev.innerHTML = clubEscudoSVG({ nombre: _clubForm.nombre || "FC", iniciales:_clubForm.iniciales, escudoForma:_clubForm.forma, color:_clubColorSel, color2:_clubColor2Sel, instalaciones:{tienda:0} }, 90);
}

function clubActualizarBadge() {
  const el = document.getElementById("club-menu-money");
  if (!el) return;
  const c = clubCargar();
  el.textContent = c.fundado ? ("$" + c.dinero.toLocaleString("es-AR")) : "Nuevo";
}

/* ── CSS (inyectado una sola vez) ── */
function _clubInyectarCSS() {
  if (document.getElementById("club-css")) return;
  const s = document.createElement("style");
  s.id = "club-css";
  s.textContent = `
    #club-screen{ display:none; position:fixed; inset:0; flex-direction:column; align-items:center; padding:14px; box-sizing:border-box; overflow-y:auto; -webkit-overflow-scrolling:touch; }
    #club-mount{ width:100%; max-width:560px; }
    .club-header{ display:flex; align-items:center; gap:10px; background:rgba(0,0,0,.28); border:1px solid rgba(255,255,255,.12); border-radius:14px; padding:10px 12px; }
    .club-escudo{ flex:0 0 auto; line-height:0; }
    .club-hinfo{ flex:1 1 auto; min-width:0; }
    .club-nombre{ font-family:'Oswald',sans-serif; font-weight:800; font-size:18px; color:#fff; line-height:1.1; }
    .club-sub{ font-family:'Oswald',sans-serif; font-size:10px; color:rgba(255,255,255,.6); }
    .club-money{ text-align:right; }
    .club-dinero{ font-family:'Oswald',sans-serif; font-weight:800; font-size:16px; color:#7ee08a; }
    .club-poder{ font-family:'Oswald',sans-serif; font-size:10px; color:var(--gold,#f5c518); font-weight:700; }
    .club-tabs{ display:flex; gap:4px; margin:10px 0; flex-wrap:wrap; }
    .club-tab{ flex:1 1 auto; font-family:'Oswald',sans-serif; font-size:11px; font-weight:700; padding:8px 5px; border-radius:9px; border:1px solid rgba(255,255,255,.12); background:rgba(255,255,255,.05); color:rgba(255,255,255,.7); cursor:pointer; }
    .club-tab.active{ background:var(--gold,#f5c518); color:#10243a; border-color:var(--gold,#f5c518); }
    .club-card{ background:rgba(0,0,0,.25); border:1px solid rgba(255,255,255,.1); border-radius:12px; padding:12px; margin-bottom:10px; }
    .club-card-t{ font-family:'Oswald',sans-serif; font-weight:700; color:#fff; font-size:14px; margin-bottom:4px; }
    .club-card-sub{ font-family:'Oswald',sans-serif; font-size:11px; color:rgba(255,255,255,.65); line-height:1.4; }
    .club-resumen-grid{ display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:10px; }
    .club-stat-top{ display:flex; justify-content:space-between; font-family:'Oswald',sans-serif; font-size:10px; color:rgba(255,255,255,.7); margin-bottom:3px; }
    .club-bar{ height:9px; border-radius:6px; background:rgba(255,255,255,.1); overflow:hidden; }
    .club-bar>div{ height:100%; border-radius:6px; transition:width .3s; }
    .club-inst{ display:flex; align-items:center; gap:10px; background:rgba(0,0,0,.25); border:1px solid rgba(255,255,255,.1); border-radius:12px; padding:10px; margin-bottom:8px; }
    .club-inst-ic{ font-size:24px; flex:0 0 auto; width:34px; text-align:center; }
    .club-inst-mid{ flex:1 1 auto; min-width:0; }
    .club-inst-nom{ font-family:'Oswald',sans-serif; font-weight:700; color:#fff; font-size:13px; }
    .club-inst-lv{ font-size:10px; color:var(--gold,#f5c518); margin-left:4px; }
    .club-inst-desc{ font-family:'Oswald',sans-serif; font-size:10px; color:rgba(255,255,255,.6); line-height:1.3; margin:2px 0 4px; }
    .club-pips{ display:flex; gap:3px; }
    .club-pip{ width:14px; height:6px; border-radius:3px; background:rgba(255,255,255,.15); }
    .club-pip.on{ background:#43a047; }
    .club-inst-act{ flex:0 0 auto; }
    .club-inst-act .btn{ font-size:11px; padding:7px 9px; white-space:nowrap; }
    .club-max{ font-family:'Oswald',sans-serif; font-size:11px; font-weight:800; color:var(--gold,#f5c518); }
    .club-train-grid{ display:grid; grid-template-columns:1fr 1fr 1fr; gap:8px; }
    .club-train-grid .btn{ font-size:12px; }
    .club-tac{ display:block; width:100%; text-align:left; background:rgba(0,0,0,.25); border:1px solid rgba(255,255,255,.1); border-radius:12px; padding:11px; margin-bottom:8px; cursor:pointer; }
    .club-tac.active{ border-color:var(--gold,#f5c518); background:rgba(245,197,24,.12); }
    .club-tac-nom{ font-family:'Oswald',sans-serif; font-weight:700; color:#fff; font-size:14px; }
    .club-tac-desc{ font-family:'Oswald',sans-serif; font-size:11px; color:rgba(255,255,255,.65); }
    .club-plantel-top{ display:flex; align-items:center; justify-content:space-between; font-family:'Oswald',sans-serif; color:#fff; font-size:13px; margin-bottom:8px; }
    .club-plantel-grid{ display:grid; grid-template-columns:repeat(auto-fill,minmax(86px,1fr)); gap:6px; }
    .club-jug{ position:relative; display:flex; flex-direction:column; align-items:center; gap:1px; background:rgba(0,0,0,.3); border:1px solid rgba(255,255,255,.12); border-radius:10px; padding:7px 4px; cursor:pointer; }
    .club-jug.titular{ border-color:#43a047; background:rgba(67,160,71,.18); }
    .club-jug.juv .club-jug-rat{ color:#7ee0c0; }
    .club-jug-rat{ font-family:'Oswald',sans-serif; font-weight:800; font-size:16px; color:var(--gold,#f5c518); }
    .club-jug-pos{ font-family:'Oswald',sans-serif; font-size:8px; font-weight:700; color:rgba(255,255,255,.6); }
    .club-jug-nom{ font-family:'Oswald',sans-serif; font-size:8.5px; color:#fff; text-align:center; line-height:1.1; max-height:22px; overflow:hidden; }
    .club-jug-check{ position:absolute; top:3px; right:4px; color:#7ee08a; font-size:11px; font-weight:800; }
    .club-crear{ background:rgba(0,0,0,.28); border:1px solid rgba(255,255,255,.12); border-radius:16px; padding:16px; }
    .club-crear-t{ font-family:'Oswald',sans-serif; color:#fff; text-align:center; margin:0 0 4px; }
    .club-crear-sub{ font-family:'Oswald',sans-serif; font-size:11px; color:rgba(255,255,255,.65); text-align:center; margin:0 0 12px; line-height:1.4; }
    .club-prev{ text-align:center; margin-bottom:12px; line-height:0; }
    .club-lbl{ display:block; font-family:'Oswald',sans-serif; font-size:11px; color:rgba(255,255,255,.7); margin:8px 0 3px; }
    .club-input{ width:100%; box-sizing:border-box; padding:9px 11px; border-radius:9px; border:1px solid rgba(255,255,255,.18); background:rgba(255,255,255,.06); color:#fff; font-family:'Oswald',sans-serif; font-size:13px; }
    .club-cols{ display:flex; gap:6px; flex-wrap:wrap; }
    .club-formas{ display:flex; gap:6px; flex-wrap:wrap; }
    .club-forma{ background:rgba(0,0,0,.25); border:1px solid rgba(255,255,255,.16); border-radius:8px; padding:3px; cursor:pointer; line-height:0; }
    .club-forma.sel{ border-color:#fff; box-shadow:0 0 8px rgba(255,255,255,.45); }
    .club-forma svg{ display:block; }
    .club-col{ width:28px; height:28px; border-radius:50%; border:2px solid rgba(255,255,255,.25); cursor:pointer; }
    .club-col.sel{ border-color:#fff; transform:scale(1.12); box-shadow:0 0 8px rgba(255,255,255,.5); }
    .club-fundar{ width:100%; margin-top:14px; }
    /* Barra de comodines en la mesa */
    .club-perks-bar{ display:none; gap:6px; justify-content:center; flex-wrap:wrap; margin:4px 0 2px; }
    .club-perk{ font-family:'Oswald',sans-serif; font-size:11px; font-weight:700; padding:5px 9px; border-radius:20px; cursor:pointer;
      border:1px solid var(--gold,#f5c518); background:rgba(245,197,24,.14); color:var(--gold,#f5c518); }
    .club-perk:disabled{ opacity:.35; cursor:default; }
    .club-perk.on{ background:var(--gold,#f5c518); color:#10243a; }
    /* Temporada: calendario y tablas */
    .club-tabla{ width:100%; border-collapse:collapse; font-family:'Oswald',sans-serif; font-size:11px; color:#fff; }
    .club-tabla th{ font-size:9px; color:rgba(255,255,255,.55); font-weight:700; padding:3px 2px; text-align:center; }
    .club-tabla td{ padding:4px 2px; text-align:center; border-top:1px solid rgba(255,255,255,.06); }
    .club-tabla .tl{ text-align:left; }
    .club-tabla tr.mio{ background:rgba(245,197,24,.14); }
    .club-tabla tr.z4 td{ box-shadow:inset 2px 0 0 #43a047; }
    .club-cal{ display:flex; flex-direction:column; gap:3px; margin-top:6px; max-height:200px; overflow-y:auto; }
    .club-cal-row{ display:flex; align-items:center; gap:8px; font-family:'Oswald',sans-serif; font-size:11px; color:rgba(255,255,255,.8); padding:4px 8px; border-radius:7px; background:rgba(255,255,255,.04); }
    .club-cal-row.next{ background:rgba(245,197,24,.16); color:#fff; }
    .club-cal-row.win{ background:rgba(67,160,71,.16); }
    .club-cal-row.lose{ background:rgba(229,57,53,.14); }
    .club-cal-comp{ flex:0 0 auto; }
    .club-cal-riv{ flex:1 1 auto; min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
    .club-cal-res{ flex:0 0 auto; font-weight:700; }
    .club-mercado-grid{ display:grid; grid-template-columns:repeat(auto-fill,minmax(110px,1fr)); gap:8px; }
    .club-ficha{ background:rgba(0,0,0,.3); border:1px solid rgba(255,255,255,.12); border-radius:10px; padding:8px; text-align:center; }
    .club-ficha-top{ display:flex; justify-content:space-between; align-items:center; }
    .club-ficha-rat{ font-family:'Oswald',sans-serif; font-weight:800; font-size:18px; color:var(--gold,#f5c518); }
    .club-ficha-rango{ font-family:'Oswald',sans-serif; font-size:8px; font-weight:700; }
    .club-ficha-nom{ font-family:'Oswald',sans-serif; font-size:10px; color:#fff; margin:3px 0 1px; line-height:1.1; min-height:22px; }
    .club-ficha-pos{ font-family:'Oswald',sans-serif; font-size:8px; color:rgba(255,255,255,.6); margin-bottom:5px; }
    .club-ficha .btn{ width:100%; font-size:11px; padding:6px; }
    .club-tend{ display:block; font-family:'Oswald',sans-serif; font-size:8.5px; font-weight:700; margin-bottom:5px; }
    .club-tend.alza{ color:#ff7a7a; }
    .club-tend.oferta{ color:#7ee08a; }
    .club-hist{ margin-top:6px; display:flex; flex-direction:column; gap:2px; }
    .club-hist-row{ display:flex; justify-content:space-between; font-family:'Oswald',sans-serif; font-size:10px; color:rgba(255,255,255,.7); padding:2px 6px; border-radius:5px; background:rgba(255,255,255,.04); }
    .club-crear-modos{ display:flex; gap:6px; margin:0 0 12px; }
    .club-modo{ flex:1; font-family:'Oswald',sans-serif; font-size:11px; font-weight:700; padding:9px 6px; border-radius:9px; cursor:pointer; border:1px solid rgba(255,255,255,.14); background:rgba(255,255,255,.05); color:rgba(255,255,255,.7); }
    .club-modo.on{ background:var(--gold,#f5c518); color:#10243a; border-color:var(--gold,#f5c518); }
    .club-real-cont{ max-height:60vh; overflow-y:auto; }
    .club-real-liga{ font-family:'Oswald',sans-serif; font-size:11px; font-weight:700; letter-spacing:1px; color:var(--gold,#f5c518); margin:10px 2px 6px; }
    .club-real-grid{ display:grid; grid-template-columns:repeat(auto-fill,minmax(82px,1fr)); gap:6px; }
    .club-real-eq{ display:flex; flex-direction:column; align-items:center; gap:4px; padding:8px 4px; border-radius:10px; cursor:pointer; border:1px solid rgba(255,255,255,.12); background:rgba(0,0,0,.25); }
    .club-real-eq:hover{ border-color:var(--gold,#f5c518); background:rgba(245,197,24,.12); }
    .club-real-eq img{ width:34px; height:34px; object-fit:contain; background:rgba(255,255,255,.9); border-radius:50%; padding:2px; box-shadow:0 0 0 1px rgba(0,0,0,.25); }
    .club-real-eq span{ font-family:'Oswald',sans-serif; font-size:8.5px; color:#fff; text-align:center; line-height:1.05; max-height:21px; overflow:hidden; }
  `;
  document.head.appendChild(s);
}

/* ── Enganches al motor ── */
document.addEventListener("DOMContentLoaded", () => {
  clubActualizarBadge();
  if (typeof onJuego === "function") {
    onJuego("finDePartido", ({ puntosJugador, puntosRival, limite }) => {
      const gano = puntosJugador >= limite;
      clubRegistrarPartido(gano, puntosJugador, puntosRival, limite);
      clubSeasonRegistrar(gano, puntosJugador, puntosRival, limite);
    });
    // Re-armar comodines al repartir cada mano
    onJuego("manoRepartida", clubPerksReset);
    onJuego("nuevoPartido",  clubPerksReset);
  }
});
