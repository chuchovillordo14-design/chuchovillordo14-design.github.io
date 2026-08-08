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
    mercadoRefrescos: 0,
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
  // El techo del entrenamiento lo pone la CIUDAD DEPORTIVA (8 ago 2026).
  // Antes era un 15 fijo, y como clubDescansar() no cuesta nada, alternar
  // Descansar/Entrenar daba +15 de Poder gratis e infinito: ~25 clicks y un
  // club recién fundado, con las instalaciones en CERO y el plantel de
  // regalo, llegaba al tope absoluto de 99. Consecuencia medida: los $174.665
  // que cuesta TODO el modo (instalaciones + las 56 figuritas) compraban cero
  // Poder, y fichar era contraproducente porque subía los sueldos sin dar
  // nada. El mercado de pases, la cantera y las obras quedaban decorativos.
  // Ahora el arco es el que el modo promete: se arranca en ~86 y llegar a 99
  // exige construir. Con la Ciudad al máximo el techo sigue siendo 18.
  const techoEntren = 3 + i.ciudad * 3;
  const trainBonus = Math.min(techoEntren, (c.entren.fisico + c.entren.tecnico + c.entren.tactico));
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
/* Desgaste de UN partido sobre el plantel. Lo comparten el partido jugado y
   el simulado A PROPÓSITO: el partido se disputó igual, que el DT no se haya
   sentado a jugar al truco no descansa a nadie. Antes simular era gratis en
   energía y en moral, y por eso "Simular + Nueva temporada" era un bucle sin
   ningún costo (medido: 468 fechas simuladas y el plantel quedaba 100/100). */
function _clubDesgastePartido(c, gano, enBuenas) {
  const i = c.instalaciones;
  const gastoEnergia = c.tactica === "ofensiva" ? 14 : 10;
  c.energia = Math.max(0, c.energia - gastoEnergia);
  let golpeMoral = gano ? 6 : (enBuenas ? 0 : -6);
  if (golpeMoral < 0) golpeMoral = Math.round(golpeMoral * (1 - i.medico * 0.12));
  c.moral = Math.max(0, Math.min(clubMoralMax(), c.moral + golpeMoral));
}

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
  _clubDesgastePartido(c, gano, enBuenas);

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
   Una sola temporada = la campaña de Liga (+ copa continental). El objetivo
   es de posición y se endurece con los años: primero entrar en zona de
   copa, después el podio, y al final salir campeón. La escalera arranca en
   la zona de clasificación real (top 8 desde el 7 ago), así el objetivo del
   primer año y el corte de la copa dicen lo mismo. */
function clubObjetivoTemporada(c) {
  const t = c.temporada || 1;
  const copa = clubCopaContinental(c);
  let posMax, desc;
  if (t <= 1)      { posMax = COPA_CLASIFICAN_DE_LA_LIGA; desc = `Meterte en zona de ${copa.corto} (top ${COPA_CLASIFICAN_DE_LA_LIGA})`; }
  else if (t === 2){ posMax = 4; desc = "Terminar entre los 4 primeros"; }
  else if (t === 3){ posMax = 2; desc = "Pelear el título (top 2)"; }
  // Desde la T4 el objetivo se queda en el PODIO, no en "salir campeón".
  // Medido sobre 300 temporadas simuladas con el Poder en el tope absoluto
  // del juego (99): salís 1º el 40% de las veces y no hay forma de mejorarlo
  // —SIM.probGana está clampeada en 0,88—, así que pedir el título dejaba
  // "🎯 Objetivo fallado" como estado por defecto para siempre y el bonus de
  // $800 casi inalcanzable. Con top 3 el objetivo es exigente pero se cumple.
  else             { posMax = 3; desc = "Terminar en el podio de la Liga"; }
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
    // Solo CLUBES, y sin el club del jugador.
    //  · Sin el propio: desde el 7 ago el club está dentro de LIGAS con
    //    fuerza = clubPoder(c). Como acá se busca al rival de fuerza MÁS
    //    CERCANA a poder+2..+7, al llegar al tope de 99 ningún equipo real
    //    alcanzaba el objetivo (el más fuerte es Real Madrid, 97) y el más
    //    cercano pasaba a ser él mismo: "Mi Club vs Mi Club", sin salida.
    //  · Sin selecciones: LIGAS incluye `selecciones` y `mundial2026`, que
    //    son SELECCIONADOS NACIONALES. Por el mismo criterio de cercanía se
    //    comían el sorteo apenas subías: con Poder 99 salía Argentina el
    //    100% de las veces. Un club amistoso contra una selección no tiene
    //    ningún sentido en este modo.
    const REGIONES_DE_SELECCIONES = ["selecciones", "mundial2026"];
    const todos = _clubSinMiClub(
      LIGAS.filter(l => REGIONES_DE_SELECCIONES.indexOf(l.region) < 0)
           .flatMap(l => l.equipos || []))
      .filter(e => e.id !== c.realId);
    const objetivo = poder + 2 + Math.floor(Math.random() * 6);
    rival = todos.slice().sort((a, b) =>
      Math.abs((a.fuerza || 60) - objetivo) - Math.abs((b.fuerza || 60) - objetivo))[0] || null;
  }

  const escudoURI = "data:image/svg+xml," + encodeURIComponent(clubEscudoSVG(c, 120));
  if (typeof equipoSel !== "undefined")
    equipoSel = { id: CLUB_ID, realId: c.realId || null, nombre: c.nombre, sub: c.ciudad, color: c.color, escudo: escudoURI, fuerza: poder };
  if (typeof equipoRival !== "undefined")
    equipoRival = rival || { id: "__rival__", nombre: "Rival de turno", sub: "", color: "#888", escudo: escudoURI, fuerza: poder };
  if (typeof limpiarBanderasDeModo === "function") limpiarBanderasDeModo();
  if (typeof modoAmistoso !== "undefined") modoAmistoso = true;
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
      // La copa continental de la carrera depende de la región de la liga del
      // club (7 ago): con un club europeo el toast y el header ya decían
      // "⭐ Champions" mientras el paño y la marca de agua del césped seguían
      // diciendo "🌎 LIBERTADORES". El tema body.comp-champions ya existía y
      // no lo usaba nadie desde la Carrera.
      comp = (ent && ent.comp === "liberta") ? clubCopaDeSeason(c.season).id : "liga";
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

/* Lo que cuesta mandar al scout a buscar una vidriera nueva. El primero de
   cada temporada es gratis (es la rotación que promete la tarjeta); del
   segundo en adelante se paga, y se duplica, porque refrescar era GRATIS y
   SIN COOLDOWN: con mediana de 5 clicks aparecía cualquier figurita del
   álbum —incluido El Diez (99)— y el 36% de descuento de la tendencia
   "oferta" se farmeaba hasta que saliera. Elegir a quién fichar dejaba de
   ser una decisión. */
function clubMercadoCostoRefresco(c) {
  const n = c.mercadoRefrescos || 0;
  if (n <= 0) return 0;
  return Math.min(3200, 400 * Math.pow(2, n - 1));
}

function clubMercadoRefrescar() {
  const c = clubCargar();
  const costo = clubMercadoCostoRefresco(c);
  if (costo > 0 && c.dinero < costo) {
    showToast(`El scout cobra $${costo.toLocaleString("es-AR")} por otra vidriera y no te alcanza. Jugá una fecha o esperá a la temporada que viene.`, 3600);
    return;
  }
  c.dinero -= costo;
  c.mercadoRefrescos = (c.mercadoRefrescos || 0) + 1;
  c.mercado = _clubMercadoGenerar();
  clubGuardar(c);
  if (typeof playSound === "function") playSound("click");
  if (costo > 0) showToast(`🔎 El scout salió a buscar: -$${costo.toLocaleString("es-AR")}.`, 2600);
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
  // Fichar también puede completar un rango o el álbum: sin esto el premio
  // quedaba esperando a que abrieras un sobre.
  if (typeof figusChequearPremiosSueltos === "function") figusChequearPremiosSueltos();
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

/* ══════════════════════════════════════════════════════════
   COPA CONTINENTAL (7 ago 2026)
   La copa de la carrera ya no es siempre la Libertadores: sale de la
   REGIÓN de la liga del club, igual que en la vida real. Un club de la
   Liga Profesional juega la Libertadores; uno de LaLiga o la Premier
   juega la Champions. El id coincide a propósito con el de copas.js
   (COPAS_DEFS), porque el campeón se guarda en la MISMA clave que mira
   el Mundial de Clubes.
   ══════════════════════════════════════════════════════════ */
const CLUB_COPAS = {
  libertadores: { id: "libertadores", nombre: "Copa Libertadores", corto: "Libertadores", icon: "🌎" },
  champions:    { id: "champions",    nombre: "Champions League",  corto: "Champions",    icon: "⭐" },
};

function clubCopaContinental(c) {
  const liga = _clubLigaDelClub(c);
  return (liga && liga.region === "europa") ? CLUB_COPAS.champions : CLUB_COPAS.libertadores;
}

/* Todos los clubes del continente de una copa (incluye al club del jugador
   si está registrado en su liga — los llamadores lo filtran). */
function _clubPoolDeCopa(copaId) {
  const ligas = copaId === "champions"
    ? [typeof LIGA_LALIGA !== "undefined" ? LIGA_LALIGA : null,
       typeof LIGA_PREMIER !== "undefined" ? LIGA_PREMIER : null]
    : [typeof LIGA_LPA       !== "undefined" ? LIGA_LPA       : null,
       typeof LIGA_BRASIL    !== "undefined" ? LIGA_BRASIL    : null,
       typeof LIGA_COLOMBIA  !== "undefined" ? LIGA_COLOMBIA  : null,
       typeof LIGA_ECUADOR   !== "undefined" ? LIGA_ECUADOR   : null,
       typeof LIGA_VENEZUELA !== "undefined" ? LIGA_VENEZUELA : null];
  let pool = [];
  ligas.forEach(l => { if (l && l.equipos) pool = pool.concat(l.equipos); });
  return pool;
}

/* Los clubes que pueden cruzarse en la copa continental del club: los de
   su continente, sin el club del jugador (se cruzaría consigo mismo). */
function _clubPoolContinental(c) {
  return _clubSinMiClub(_clubPoolDeCopa(clubCopaContinental(c).id))
    .filter(e => e.id !== c.realId);
}

// NOTA (venía de _clubPoolLiberta, que esta pareja de funciones reemplazó):
// las ligas se declaran con `const` a nivel de script, así que NO son
// propiedades de window — nombrarlas una por una obliga a tocar acá si se
// suma una liga, pero a cambio el proyecto se queda sin un solo eval, y sin
// eval no hace falta abrir 'unsafe-eval' en la CSP (justo la directiva que
// le devolvería a un XSS la capacidad de compilar código nuevo).

function _clubEquipoPorId(id) {
  if (typeof LIGAS === "undefined") return null;
  // LIGAS NO incluye a Brasil/Colombia/Ecuador/Venezuela: esas viven aparte
  // en LIGAS_LIBERTADORES porque no se muestran como liga jugable, pero sus
  // clubes SÍ salen sorteados como rivales de la copa continental. Sin
  // sumarlas acá, una fecha de Libertadores contra Flamengo moría en
  // "Rival no encontrado" y la temporada se trababa (bug viejo, encontrado
  // el 7 ago al cablear la copa).
  const fuentes = (typeof LIGAS_LIBERTADORES !== "undefined")
    ? LIGAS.concat(LIGAS_LIBERTADORES) : LIGAS;
  for (const l of fuentes) { const e = (l.equipos||[]).find(x => x.id === id); if (e) return e; }
  return null;
}

/* ══════════════════════════════════════════════════════════
   EL CLUB FUNDADO ES UN EQUIPO MÁS (7 ago 2026, pedido de Chucho:
   "si funda un club, agregarlo en los equipos ya creados")

   Hasta acá el club propio existía SOLO adentro de la carrera: CLUB_ID
   era un id fantasma que no estaba en ninguna liga, así que el club no
   aparecía en el Partido Amistoso, ni en la tabla del Torneo de Liga, ni
   podía ser el campeón que juega el Mundial de Clubes (que resuelve los
   nombres con buscarEquipo()). Ahora se inserta en la liga que eligió.

   Dos reglas que NO hay que romper:
   1. Un club REAL (c.realId) NO se inserta — ya está en su liga con su
      id de siempre; meterlo de nuevo como CLUB_ID lo duplicaría.
   2. Donde se arman RIVALES hay que excluir CLUB_ID, o el club se
      cruzaría consigo mismo (ver clubSeasonNueva y _clubPoolContinental).
   ══════════════════════════════════════════════════════════ */
/* El nombre del club es TEXTO LIBRE del jugador y, desde que el club entra a
   LIGAS, lo pintan renderizadores que nunca escaparon nada porque hasta hoy
   solo veían nombres literales del código (la grilla de equipos, la tabla y
   el fixture del Torneo de Liga, la pantalla del Mundial de Clubes...). Con
   `<svg onload=…>` —que entra en los 22 caracteres del input— eso es un
   self-XSS, y con un simple `Ñuls & Cía` ya se rompía el render.
   Se sanea en el ORIGEN, que es el único punto por el que pasa. Se dejan
   fuera solo los caracteres que pueden salirse de un texto o de un atributo;
   el `&` y los acentos se conservan, que es lo que la gente escribe. */
function clubNombreSeguro(s, max) {
  return String(s == null ? "" : s).replace(/[<>"'`]/g, "").trim().slice(0, max || 22);
}

function clubComoEquipo(c) {
  return {
    id: CLUB_ID,
    nombre: clubNombreSeguro(c.nombre),
    sub: c.ciudad || "Club del jugador",
    color: c.color || "#1e88e5",
    color2: c.color2 || "#ffffff",
    fuerza: clubPoder(c),
    escudo: "data:image/svg+xml," + encodeURIComponent(clubEscudoSVG(c, 120)),
    esDelJugador: true,
  };
}

/* Inserta (o refresca) el club propio en su liga. Idempotente: se puede
   llamar en cada arranque y después de cada temporada — la fuerza del
   club sube con los fichajes, así que el equipo se re-escribe en el
   lugar en vez de agregarse otra vez. */
function clubRegistrarEnLigas(c) {
  c = c || clubCargar();
  if (!c || !c.fundado || c.realId) return null;   // regla 1
  const liga = _clubLigaDelClub(c);
  if (!liga || !Array.isArray(liga.equipos)) return null;
  const eq = clubComoEquipo(c);
  const i = liga.equipos.findIndex(e => e.id === CLUB_ID);
  if (i >= 0) liga.equipos[i] = eq; else liga.equipos.push(eq);
  return eq;
}

/* Saca al club propio de una lista de equipos (para armar rivales). */
function _clubSinMiClub(equipos) {
  return (equipos || []).filter(e => e && e.id !== CLUB_ID);
}

/* Las grillas de equipos (registro y Partido Amistoso) las dibuja equipos.js
   UNA vez, en su DOMContentLoaded — que corre ANTES que el de club.js porque
   su <script> va primero. Sin volver a dibujarlas, el club recién insertado
   existe en LIGAS pero no aparece en ninguna pantalla hasta el próximo
   refresh... que tampoco alcanzaba, porque el orden es siempre el mismo. */
function _clubRefrescarSelectores() {
  try {
    if (typeof renderSelectorEquipos === "function")  renderSelectorEquipos();
    if (typeof renderSelectorAmistoso === "function") renderSelectorAmistoso();
  } catch (e) { console.error("club: refrescar selectores de equipos", e); }
}

/* Si el jugador tenía elegido SU club como equipo, hay que volver a
   resolverlo. equipos.js restaura `equipoSel` desde truco_equipo en SU
   DOMContentLoaded, que corre antes que el de club.js (su <script> va
   primero en el index): en ese momento `__club__` todavía no existe en
   LIGAS, buscarEquipo() devolvía null y el jugador se quedaba sin equipo
   —con el Modo DT dejando de registrar partidos en silencio. */
function _clubRestaurarEquipoGuardado() {
  try {
    if (typeof EQ_KEY === "undefined") return;
    if (localStorage.getItem(EQ_KEY) !== CLUB_ID) return;
    if (typeof equipoSel !== "undefined" && equipoSel && equipoSel.id === CLUB_ID) return;
    const enc = (typeof buscarEquipo === "function") ? buscarEquipo(CLUB_ID) : null;
    if (!enc) return;
    if (typeof equipoSel !== "undefined") equipoSel = enc.equipo;
    if (typeof LIGA !== "undefined")      LIGA      = enc.liga;
  } catch (e) { console.error("club: restaurar equipo guardado", e); }
}
function _clubNombreId(c, id) { return id === CLUB_ID ? c.nombre : ((_clubEquipoPorId(id)||{}).nombre || id); }
function _clubFuerzaId(id, poder) { return id === CLUB_ID ? poder : ((_clubEquipoPorId(id)||{}).fuerza || 60); }

// Fixtures y tablas: delegan en SIM (sim.js), la fuente única.
function _roundRobin(ids)              { return SIM.roundRobin(ids); }
function _tablaInit(ids)               { return SIM.tablaInit(ids); }
function _aplicarRes(tabla, a, b, ga, gb, db) { return SIM.aplicarResultado(tabla, a, b, ga, gb, db); }
function _ordenarTabla(tabla)          { return SIM.ordenarTabla(tabla); }

function _calEntry(comp, fecha, fase) {
  const par = fecha.pares.find(p => p[0] === CLUB_ID || p[1] === CLUB_ID);
  const rivalId = par ? (par[0] === CLUB_ID ? par[1] : par[0]) : null;
  const otros = fecha.pares.filter(p => p !== par);
  return { comp, fase: fase || "grupo", fi: fecha.fi, rivalId, otros, jugado:false, gj:0, gr:0, gano:false };
}

/* Entrada de calendario para un partido de eliminación directa (semi/final):
   no hay tabla ni "otros" que simular contra ella — el otro cruce se
   resuelve aparte, en _clubCopaAvanzar. */
function _calEntryLlave(fase, rivalId) {
  // comp sigue siendo "liberta" (el nombre viejo del campo, que ya está en
  // las temporadas guardadas): lo que cambia es la FASE.
  return { comp: "liberta", fase, fi: 0, rivalId, otros: [], jugado:false, gj:0, gr:0, gano:false };
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
  // Fuera el club del jugador: entra como CLUB_ID, y desde el 7 ago también
  // está EN la liga como equipo (clubRegistrarEnLigas) — sin este filtro se
  // cruzaría consigo mismo.
  let rivalesLiga = _clubSinMiClub(liga.equipos).filter(e => e.id !== c.realId).map(e => e.id);
  // Paridad par para que no haya fechas libres ("bye") sin partido del club.
  // El que se recorta se sortea: antes era `slice(0, length-1)`, o sea SIEMPRE
  // el último del array. Como LIGA_LPA tiene orden fijo y el club propio se
  // empuja al final, el sacrificado era invariablemente el mismo club (Colón,
  // 30 de 30 temporadas medidas): no existía en ninguna campaña, nunca.
  if ((rivalesLiga.length + 1) % 2 !== 0) {
    const fuera = Math.floor(Math.random() * rivalesLiga.length);
    rivalesLiga = rivalesLiga.filter((_, i) => i !== fuera);
  }
  const ligaIds = [CLUB_ID, ...rivalesLiga];
  const ligaFechas = _roundRobin(ligaIds);

  const copa = clubCopaContinental(c);
  let liberta = null;
  if (c.clasificadoLiberta) {
    // La copa continental es más dura: los rivales salen de los más fuertes
    // del continente (top por fuerza), no de cualquiera del pool.
    const pool = _clubPoolContinental(c).sort((a, b) => (b.fuerza || 0) - (a.fuerza || 0));
    const elite = pool.slice(0, Math.max(6, Math.ceil(pool.length * 0.22)));
    const rivalesL = _clubSample(elite, 3).map(e => e.id);
    const lIds = [CLUB_ID, ...rivalesL];
    liberta = {
      copaId: copa.id,
      ids: lIds, fechas: _roundRobin(lIds), tabla: _tablaInit(lIds),
      fase: "grupo",          // grupo → semi → final → campeon | subcampeon | eliminado
      semiRival: null, otraSemi: null, finalRival: null,
    };
  }

  // Calendario: intercalar fecha de liga y fecha de copa. La fase final
  // (semi y final) NO se agenda acá — se apendea al calendario recién
  // cuando el club clasifica, en _clubCopaAvanzar.
  const ligaF = ligaFechas.map((pares, fi) => ({ fi, pares }));
  const libF  = liberta ? liberta.fechas.map((pares, fi) => ({ fi, pares })) : [];
  const cal = [];
  let li = 0, ci = 0;
  while (li < ligaF.length || ci < libF.length) {
    if (li < ligaF.length) cal.push(_calEntry("liga", ligaF[li++]));
    if (ci < libF.length)  cal.push(_calEntry("liberta", libF[ci++], "grupo"));
  }

  return {
    ligaIds, ligaTabla: _tablaInit(ligaIds),
    copaId: copa.id,
    liberta, cal, idx: 0, fin: false,
    campeonLiga: null, libertaResultado: null,
    objetivo: clubObjetivoTemporada(c),
  };
}

/* Nombre lindo de la copa de una temporada (sirve para saves viejas, que
   no tienen copaId y siempre eran Libertadores). */
function clubCopaDeSeason(s) {
  const id = (s && (s.copaId || (s.liberta && s.liberta.copaId))) || "libertadores";
  return CLUB_COPAS[id] || CLUB_COPAS.libertadores;
}

function clubEmpezarTemporada() {
  const c = clubCargar();
  // La fuerza del club cambia con los fichajes: se refresca su ficha en la
  // liga antes de armar el fixture.
  clubRegistrarEnLigas(c);
  _clubRefrescarSelectores();   // que la ficha del Amistoso no quede con la fuerza vieja
  c.season = clubSeasonNueva(c);
  c.mercado = _clubMercadoGenerar(); // vidriera nueva cada temporada
  c.mercadoRefrescos = 0;            // y el scout vuelve a salir gratis una vez
  clubGuardar(c);
  if (typeof playSound === "function") playSound("win");
  const copa = clubCopaContinental(c);
  showToast(c.clasificadoLiberta
    ? `📅 ¡Nueva temporada! Jugás Liga y ${copa.corto}.`
    : `📅 ¡Nueva temporada de Liga! Terminá entre los ${COPA_CLASIFICAN_DE_LA_LIGA} primeros para clasificar a la ${copa.corto}.`, 3600);
  clubRender("temporada");
}

let _clubSeasonPend = null;
/* Solo lo prende _clubLanzarVs, y el hook de nuevoPartido lo apaga en cuanto
   arranca una partida que NO es la que él lanzó. Es lo que distingue una
   fecha de temporada de un Partido Amistoso con los mismos dos equipos. */
let _clubSeasonEsNuestro = false;
/* Lo pone _clubLanzarVs en 1 justo antes de arrancar la partida, para que el
   hook sepa que el nuevoPartido que viene es el suyo y no lo invalide. */
let _clubSeasonArmando = false;

function clubSeasonJugarProximo() {
  const c = clubCargar();
  if (!c.season || c.season.fin) { showToast("No hay temporada en curso. Empezá una nueva."); return; }
  if ((c.onceIds || []).length < 3) { showToast("Armá tu 11 en el Plantel antes de salir a la cancha."); return; }
  const ent = c.season.cal[c.season.idx];
  if (!ent) return;
  const rival = _clubEquipoPorId(ent.rivalId);
  if (!rival) { showToast("Rival no encontrado."); return; }
  // rivalId viaja en el pend para que clubSeasonRegistrar pueda verificar
  // que el partido que terminó es DE VERDAD el de esta fecha.
  _clubSeasonPend = { comp: ent.comp, rivalId: ent.rivalId };
  _clubLanzarVs(c, rival, ent.comp, ent.fase);
}

/* Cómo se anuncia un partido de la temporada: "🏆 Liga", "🌎 Libertadores"
   o, en la fase final, "⭐ Champions · SEMIFINAL". */
function clubEtiquetaPartido(c, comp, fase) {
  if (comp !== "liberta") return "🏆 Liga";
  const copa = clubCopaContinental(c);
  const f = fase === "semi" ? " · SEMIFINAL" : fase === "final" ? " · FINAL" : "";
  return `${copa.icon} ${copa.corto}${f}`;
}

// Lanza una partida del club contra un rival concreto (real)
function _clubLanzarVs(c, rival, etiqueta, fase) {
  const poder = clubPoder(c);
  const escudoURI = "data:image/svg+xml," + encodeURIComponent(clubEscudoSVG(c, 120));
  // `realId` viaja para que equipos.js pueda resolver el HINCHA del club que
  // dirigís: el id que va a la mesa es el fantasma CLUB_ID, que no está en
  // AVATAR_POR_CLUB, y sin esto el jugador quedaba con el avatar por defecto.
  if (typeof equipoSel !== "undefined")  equipoSel  = { id: CLUB_ID, realId: c.realId || null, nombre: c.nombre, sub: c.ciudad, color: c.color, escudo: escudoURI, fuerza: poder };
  if (typeof equipoRival !== "undefined") equipoRival = rival;
  if (typeof limpiarBanderasDeModo === "function") limpiarBanderasDeModo();
  if (typeof modoAmistoso !== "undefined") modoAmistoso = true;
  if (typeof S !== "undefined") S.nombreJugador = c.nombre;
  if (typeof playSound === "function") playSound("silbato");
  const comp = clubEtiquetaPartido(c, etiqueta, fase);
  showToast(`${comp}: ${c.nombre} (${poder}) vs ${rival.nombre} (${rival.fuerza}).`, 2600);
  // Marca de origen: esta partida —y solo esta— cuenta como fecha de la
  // temporada. El hook de nuevoPartido de más abajo la confirma.
  _clubSeasonEsNuestro = true;
  _clubSeasonArmando = true;
  if (typeof _iniciarPartida === "function") _iniciarPartida();
  if (typeof aplicarEquipoEnMesa === "function") setTimeout(aplicarEquipoEnMesa, 60);
}

// Registra el resultado del partido del CLUB en la temporada (lo llama el hook
// de finDePartido). Simula el resto de los partidos de esa fecha y avanza.
// Aplica el resultado del CLUB a la fecha actual, simula el resto de los
// partidos de esa fecha, avanza el calendario y cierra la temporada si toca.
function _clubSeasonAplicar(c, gj, gr, gano, enBuenas, simulado) {
  const s = c.season;
  const ent = s.cal[s.idx];
  if (!ent || ent.jugado) return;
  ent.jugado = true; ent.gj = gj; ent.gr = gr; ent.gano = gano;
  ent.db = !!enBuenas;
  // Quién dirigió esta fecha: la usa _clubCerrarTemporada para pagar los
  // premios deportivos. Sin flag = jugada (las temporadas guardadas antes
  // del 8 ago cuentan como dirigidas, que es lo justo con quien ya jugó).
  ent.simulado = !!simulado;

  // Semi y final son a un partido: no hay tabla que actualizar.
  const esLlave = ent.comp === "liberta" && (ent.fase || "grupo") !== "grupo";
  const tabla = esLlave ? null
              : (ent.comp === "liga" ? s.ligaTabla : (s.liberta && s.liberta.tabla));
  // `enBuenas` es la MISMA regla anunciada en el modal de reglas: el que
  // pierde pasando la mitad del tanteador rescata 1 punto. La tabla de la
  // Carrera no la aplicaba, así que perder 31-28 —un partido peleadísimo— te
  // dejaba en cero mientras la misma derrota en el Torneo de Liga pagaba 1.
  if (tabla) _aplicarRes(tabla, CLUB_ID, ent.rivalId, gj, gr, enBuenas);

  const poder = clubPoder(c);
  (ent.otros || []).forEach(p => {
    if (!tabla) return;
    const r = SIM.partido(_clubFuerzaId(p[0], poder), _clubFuerzaId(p[1], poder));
    _aplicarRes(tabla, p[0], p[1], r.ga, r.gb, r.db);
  });

  s.idx++;
  // Puede APENDEAR semi/final al calendario, así que va antes del corte.
  if (ent.comp === "liberta") _clubCopaAvanzar(c, ent, gano);
  if (s.idx >= s.cal.length) _clubCerrarTemporada(c);
}

/* ══════════════════════════════════════════════════════════
   FASE FINAL DE LA COPA CONTINENTAL (7 ago 2026)
   Antes la copa de la carrera era un grupo de 4 y "campeón" era salir 1º
   de ese grupo — tres partidos y la levantabas. Ahora clasifican DOS del
   grupo y hay semifinal y final a un partido, contra clubes nuevos del
   continente. Las fechas de la llave se apendean al calendario recién
   cuando el club clasifica, así el que queda afuera no ve partidos
   fantasma en su calendario.
   ══════════════════════════════════════════════════════════ */
const COPA_CLASIFICAN_DEL_GRUPO = 2;
// Puestos de la liga que dan copa continental el año siguiente.
const COPA_CLASIFICAN_DE_LA_LIGA = 8;

function _clubCopaAvanzar(c, ent, gano) {
  const s = c.season, L = s.liberta;
  if (!L) return;
  const fase = ent.fase || "grupo";
  const poder = clubPoder(c);

  if (fase === "grupo") {
    const grupo = s.cal.filter(e => e.comp === "liberta" && (e.fase || "grupo") === "grupo");
    if (!grupo.every(e => e.jugado)) return;          // todavía quedan fechas

    const ord = _ordenarTabla(L.tabla);
    L.posGrupo = ord.findIndex(t => t.id === CLUB_ID) + 1;
    if (L.posGrupo > COPA_CLASIFICAN_DEL_GRUPO) {
      L.fase = "eliminado"; s.libertaResultado = "grupo";
      return;
    }

    // Clasificó: tres rivales NUEVOS del continente (uno para la semi, dos
    // para el otro cruce). Si el continente no da para tres —ligas chicas,
    // o el pool quedó corto— se reusan los del grupo antes que romper.
    const yaJugados = L.ids;
    const pool = _clubPoolContinental(c)
      .filter(e => yaJugados.indexOf(e.id) < 0)
      .sort((a, b) => (b.fuerza || 0) - (a.fuerza || 0));
    const elite = pool.slice(0, Math.max(6, Math.ceil(pool.length * 0.25)));
    let tres = _clubSample(elite.length >= 3 ? elite : pool, 3).map(e => e.id);
    if (tres.length < 3) {
      const suplentes = yaJugados.filter(id => id !== CLUB_ID);
      while (tres.length < 3 && suplentes.length) tres.push(suplentes.shift());
    }
    if (tres.length < 3) { L.fase = "campeon"; s.libertaResultado = "campeon"; return; }

    L.semiRival = tres[0];
    L.otraSemi  = [tres[1], tres[2]];
    L.fase = "semi";
    s.cal.push(_calEntryLlave("semi", L.semiRival));
    return;
  }

  if (fase === "semi") {
    if (!gano) { L.fase = "eliminado"; s.libertaResultado = "semifinal"; return; }
    // El otro cruce lo resuelve la simulación: el ganador espera en la final.
    const [a, b] = L.otraSemi || [];
    if (a && b) {
      const r = SIM.partido(_clubFuerzaId(a, poder), _clubFuerzaId(b, poder));
      L.finalRival = r.ganaA ? a : b;
    } else {
      L.finalRival = a || b || L.semiRival;
    }
    L.fase = "final";
    s.cal.push(_calEntryLlave("final", L.finalRival));
    return;
  }

  if (fase === "final") {
    L.fase = gano ? "campeon" : "subcampeon";
    s.libertaResultado = gano ? "campeon" : "subcampeon";
  }
}

/* ══════════════════════════════════════════════════════════
   DEL CAMPEÓN CONTINENTAL AL MUNDIAL DE CLUBES
   copas.js resuelve el Mundial de Clubes cruzando lo que haya en
   truco_copa_campeon_libertadores y truco_copa_campeon_champions. Hasta
   acá esas claves SOLO las escribían las copas sueltas del menú, así que
   ganar la copa en la carrera no habilitaba nada. Ahora el campeón de la
   carrera entra ahí, y si el otro continente todavía no tiene campeón se
   le pone uno simulado — si no, ganar la Libertadores dejaría el Mundial
   de Clubes esperando una copa que el jugador quizá nunca juegue.
   ══════════════════════════════════════════════════════════ */
function _clubGuardarCampeonCopa(copaId, dato) {
  try { localStorage.setItem("truco_copa_campeon_" + copaId, JSON.stringify(dato)); } catch (_) {}
}
function _clubHayCampeonCopa(copaId) {
  try { return !!localStorage.getItem("truco_copa_campeon_" + copaId); } catch (_) { return false; }
}
function _clubCampeonSimuladoDe(copaId) {
  const pool = _clubSinMiClub(_clubPoolDeCopa(copaId))
    .slice().sort((a, b) => (b.fuerza || 0) - (a.fuerza || 0));
  const top = pool.slice(0, 8);
  return _clubSample(top, 1)[0] || pool[0] || null;
}
/* Lo llama copas.js cuando el jugador GANA la final del Mundial de Clubes.
   `ganadorId` es el equipo que la levantó: hay que compararlo contra el club
   de la carrera, porque el finalista "del jugador" puede venir de la Copa
   Libertadores SUELTA del menú (ganada con Boca, por ejemplo) y entonces el
   club de la carrera —que no jugó nada— se llevaba el 👑 en su vitrina. */
function clubSumarTituloCWC(ganadorId) {
  const c = clubCargar();
  if (!c || !c.fundado) return;
  const miId = c.realId || CLUB_ID;
  if (ganadorId !== miId) return;
  // El PASE es de un solo uso. Sin este guard, el botón "Jugar otra final"
  // (cwcReset) volvía a ofrecer la misma final —borra el campeón del mundo
  // pero deja los dos campeones continentales— y cada replay sumaba otro 👑:
  // 25 clicks, 25 títulos, sin volver a clasificar nunca.
  if (!c.clasificadoCWC) return;
  c.palmares = c.palmares || { liga: 0, libertadores: 0 };
  c.palmares.cwc = (c.palmares.cwc || 0) + 1;
  c.clasificadoCWC = false;   // se consume acá; clubCerrarCicloCWC ya no tiene qué hacer
  clubGuardar(c);
}

/* ¿Este id de equipo ES el club de la carrera? (CLUB_ID si lo fundaste, o el
   id real si dirigís un club existente). Lo usa copas.js para no cerrarle el
   pase al Mundial de Clubes por una final que jugó otro. */
function clubEsDeLaCarrera(id) {
  const c = clubCargar();
  if (!c || !c.fundado) return false;
  return id === (c.realId || CLUB_ID);
}

/* Lo llama copas.js cuando la final del Mundial de Clubes YA SE DEFINIÓ, la
   haya ganado el club o no. `clasificadoCWC` es el pase a ESA final: sin
   apagarlo quedaba prendido para siempre y el botón "👑 JUGAR EL MUNDIAL DE
   CLUBES" seguía apareciendo en la tarjeta de fin de temporada temporadas
   después de haberla jugado y perdido. */
function clubCerrarCicloCWC() {
  const c = clubCargar();
  if (!c || !c.fundado || !c.clasificadoCWC) return;
  c.clasificadoCWC = false;
  clubGuardar(c);
}

/* ¿Hay una final del Mundial de Clubes PENDIENTE para este club? */
function clubTieneFinalCWCPendiente(c) {
  if (!c || !c.clasificadoCWC) return false;
  // Blindaje para partidas guardadas ANTES del arreglo de arriba, que
  // tienen el flag prendido y la final ya jugada.
  if (typeof _cwcCampeon === "function" && _cwcCampeon()) return false;
  // Y los dos finalistas tienen que seguir existiendo: reiniciar una copa
  // desde el menú borra su campeón (copaReset), y el botón quedaba llevando a
  // una pantalla que dice "primero definí las dos copas" y no se resolvía
  // nunca — el flag se apaga solo en _cwcResolver/cwcSimular, que en ese
  // estado no llegan a correr.
  if (!_clubHayCampeonCopa("libertadores") || !_clubHayCampeonCopa("champions")) return false;
  return true;
}

function clubClasificarAlMundialDeClubes(c, copaId) {
  const idEquipo = c.realId || CLUB_ID;
  _clubGuardarCampeonCopa(copaId, { id: idEquipo, jugador: true });
  const otra = copaId === "libertadores" ? "champions" : "libertadores";
  if (!_clubHayCampeonCopa(otra)) {
    const rival = _clubCampeonSimuladoDe(otra);
    if (rival) _clubGuardarCampeonCopa(otra, { id: rival.id, jugador: false, simulado: true });
  }
  // La final del mundo ANTERIOR ya se jugó y su campeón sigue guardado:
  // _cwcRender cortocircuita cuando esa clave existe y muestra la pantalla
  // del campeón viejo. Sin borrarla, el Mundial de Clubes se podía jugar UNA
  // sola vez en toda la carrera — la segunda copa llevaba a una pantalla
  // muerta.
  try { localStorage.removeItem("truco_cwc_campeon"); } catch (_) {}
  c.clasificadoCWC = true;
}

// Lo llama el hook de finDePartido cuando el partido jugado era de la temporada.
function clubSeasonRegistrar(gano, puntosJugador, puntosRival, limite) {
  if (!_clubSeasonPend) return;
  // ¿El partido que terminó es de verdad el de la fecha? El pend queda
  // prendido si el DT abandonó el partido de temporada a mitad de camino,
  // y sin este chequeo la PRÓXIMA partida de cualquier modo (online,
  // desafío, picadito...) se registraba como esa fecha de la Liga del club.
  // La firma del partido de temporada: lo lanzó _clubLanzarVs (equipoSel es
  // el club, modoAmistoso prendido, nunca online) contra el rival agendado.
  //
  // ⚠️ Esa firma DEJÓ DE ALCANZAR el 7 ago: al registrar el club en LIGA_LPA
  // pasó a ser elegible en el Partido Amistoso, que también prende
  // modoAmistoso — o sea que el jugador podía abandonar la semifinal, ir al
  // Amistoso, elegir su club contra el mismo rival y que ESE resultado se
  // anotara como la semifinal. Por eso ahora manda `_clubSeasonEsNuestro`,
  // que solo lo puede prender _clubLanzarVs y que se apaga en cuanto arranca
  // cualquier otra partida (hook nuevoPartido, más abajo).
  const esElPartidoAgendado =
    _clubSeasonEsNuestro &&
    (typeof equipoSel !== "undefined" && equipoSel && equipoSel.id === CLUB_ID) &&
    (typeof equipoRival !== "undefined" && equipoRival && equipoRival.id === _clubSeasonPend.rivalId) &&
    (typeof modoAmistoso !== "undefined" && modoAmistoso) &&
    !(typeof S !== "undefined" && S.modoOnline);
  _clubSeasonPend = null;
  _clubSeasonEsNuestro = false;
  if (!esElPartidoAgendado) return; // la fecha queda sin jugar, se relanza del panel
  const c = clubCargar();
  if (!c.season || c.season.fin) return;
  const factor30 = limite ? 30 / limite : 1;
  const perdPts = gano ? puntosRival : puntosJugador;
  const [gG, gP] = SIM.golesFutbol(Math.round((perdPts || 0) * factor30));
  // Derrota "en las buenas": perdiste pero pasaste la mitad del tanteador.
  const enBuenas = !gano && typeof puntosJugador === "number"
                   && typeof limite === "number" && puntosJugador >= limite / 2;
  _clubSeasonAplicar(c, gano ? gG : gP, gano ? gP : gG, gano, enBuenas);
  clubGuardar(c);
}

// Simular el partido del club (sin jugar al truco): rinde menos que jugarlo.
// Y CANSA IGUAL: el partido se jugó, lo dirigiste vos o lo dirigió el ayudante.
function clubSeasonSimularProximo() {
  const c = clubCargar();
  if (!c.season || c.season.fin) return;
  const ent = c.season.cal[c.season.idx];
  if (!ent) return;
  const gasto = c.tactica === "ofensiva" ? 14 : 10;
  if (c.energia < gasto) {
    showToast("El plantel está fundido: no le podés meter otra fecha encima. Hacelo descansar.", 3400);
    return;
  }
  const rival = _clubEquipoPorId(ent.rivalId) || { fuerza: clubPoder(c) };
  const r = SIM.partido(clubPoder(c), rival.fuerza || 60);
  const i = c.instalaciones;
  const base = 120 + i.estadio * 70 + i.tienda * 45;
  c.dinero += Math.round((r.ganaA ? base : base * 0.3) * 0.5);
  c.partidos = (c.partidos || 0) + 1;
  _clubDesgastePartido(c, r.ganaA, !r.ganaA && r.db);
  _clubSeasonAplicar(c, r.ga, r.gb, r.ganaA, !r.ganaA && r.db, true);
  clubGuardar(c);
  if (typeof playSound === "function") playSound("click");
  showToast(`⏭️ Simulado: ${c.nombre} ${r.ga}-${r.gb} ${_clubNombreId(c, ent.rivalId)}`, 2400);
  clubRender("temporada");
}

/* ── ¿CUÁNTO DIRIGISTE? ──
   Los premios deportivos de fin de temporada (puesto en la liga, copa,
   objetivo del presidente) se pagan por DIRIGIR, no por existir. Antes se
   cobraban enteros aunque no hubieras jugado una sola mano de truco, y eran
   el grueso de la plata del modo: "Simular todo + Nueva temporada" daba
   +$4.427 por temporada, 0 en rojo sobre 20 medidas, y pagaba las
   instalaciones completas ($54.805) en ~12 vueltas de puro click.
   El sponsor y los sueldos NO se tocan: el sponsor es un contrato firmado y
   a los jugadores se les paga igual. El que juega su temporada entera cobra
   exactamente lo mismo que antes — esto no le saca nada a nadie que juegue. */
const CLUB_PREMIO_PISO = 0.25;

function clubDirigido(s) {
  if (!s || !s.cal) return 1;
  const resueltas = s.cal.filter(e => e.jugado);
  if (!resueltas.length) return 1;
  return resueltas.filter(e => !e.simulado).length / resueltas.length;
}
function clubFactorPremio(s) {
  return CLUB_PREMIO_PISO + (1 - CLUB_PREMIO_PISO) * clubDirigido(s);
}

/* Un título de la Carrera cuenta como torneo ganado: récord "Torneos
   Ganados" + bonus del sponsor TV Deportes ("+100 PT por ganar torneos").
   ⚠️ CONTRATO del proyecto: torneo nuevo = alguien tiene que llamar a
   sponsorPagarBonus("torneo"); ningún módulo puede sumar torneo_wins sin
   pagarlo. Los dos van juntos, siempre. */
function _clubAcreditarTorneoGanado(nombre) {
  try {
    if (typeof window !== "undefined" && typeof window.sumarRecord === "function")
      window.sumarRecord("torneo_wins", 1, nombre);
    if (typeof window !== "undefined" && typeof window.sponsorPagarBonus === "function")
      window.sponsorPagarBonus("torneo");
  } catch (e) { console.error("club: acreditar torneo ganado", e); }
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
  if (typeof c.palmares.champions !== "number") c.palmares.champions = 0;
  let campLiga = s.campeonLiga === CLUB_ID, campLib = false;
  if (campLiga) {
    c.palmares.liga++;
    // Los cuatro torneos viejos (Liga del menú, Copas, Mundial, Copa Rápida)
    // suman el récord "Torneos Ganados" y pagan el bonus del sponsor TV
    // Deportes. Los dos de la Carrera —que son los títulos más caros de
    // conseguir del juego— no lo hacían: solo tocaban el palmarés.
    _clubAcreditarTorneoGanado("Liga · Carrera");
  }

  // Copa continental: el resultado lo dejó la llave (_clubCopaAvanzar). El
  // fallback del `if` de abajo es para temporadas GUARDADAS antes del 7 ago,
  // que no tienen fase ni libertaResultado y se cerraban mirando el grupo.
  const copa = clubCopaDeSeason(s);
  let posL = null;
  if (s.liberta) {
    if (!s.libertaResultado) {
      const ordL = _ordenarTabla(s.liberta.tabla);
      s.liberta.posGrupo = ordL.findIndex(t => t.id === CLUB_ID) + 1;
      s.libertaResultado = s.liberta.posGrupo === 1 ? "campeon" : "grupo";
    }
    posL = s.liberta.posGrupo || null;
    if (s.libertaResultado === "campeon") {
      premio += 3000; campLib = true;
      c.palmares[copa.id] = (c.palmares[copa.id] || 0) + 1;
      _clubAcreditarTorneoGanado(copa.corto + " · Carrera");
      msg += ` · ${copa.icon} ¡CAMPEÓN DE ${copa.corto.toUpperCase()}!`;
      clubClasificarAlMundialDeClubes(c, copa.id);
      msg += " · 👑 ¡Clasificaste al MUNDIAL DE CLUBES!";
    } else if (s.libertaResultado === "subcampeon") {
      premio += 1500; msg += ` · ${copa.icon} Subcampeón de ${copa.corto}: perdiste la final`;
    } else if (s.libertaResultado === "semifinal") {
      premio += 800;  msg += ` · ${copa.icon} ${copa.corto}: caíste en semifinal`;
    } else {
      msg += ` · ${copa.icon} ${copa.corto}: quedaste ${posL ? posL + "º " : ""}en el grupo`;
    }
  }

  // Objetivo del presidente (posición): cumplirlo da un plus
  const obj = s.objetivo || clubObjetivoTemporada(c);
  s.objetivoCumplido = posClub <= obj.posMax;
  if (s.objetivoCumplido) { premio += 800; msg += ` · 🎯 ¡Objetivo cumplido!`; }
  else msg += ` · 🎯 Objetivo fallado (${obj.desc})`;

  // Clasificación a la copa continental de la PRÓXIMA temporada: los 8
  // mejores de la liga (pedido de Chucho, 7 ago — antes eran solo 2, que en
  // una liga de 22 equipos dejaba la copa fuera de alcance casi siempre).
  c.clasificadoLiberta = posClub <= COPA_CLASIFICAN_DE_LA_LIGA;
  if (c.clasificadoLiberta) msg += ` · ✅ ¡Clasificaste a la próxima ${copa.corto}!`;
  else msg += ` · ❌ Sin ${copa.corto}: hay que entrar entre los ${COPA_CLASIFICAN_DE_LA_LIGA} primeros`;

  // ── FINANZAS DE FIN DE TEMPORADA ──
  // Sponsor: ingreso fijo según Estadio + Tienda. Sueldos: gasto según
  // lo caro que es tu 11 (mejores jugadores = sueldos más altos).
  const sponsor = 600 + (c.instalaciones.estadio + c.instalaciones.tienda) * 150;
  // Los sueldos se cobran sobre el PLANTEL, no sobre el once que esté puesto
  // en el instante del cierre. Con clubOnce(c) alcanzaba con sacar a los
  // titulares antes de la última fecha y volver a ponerlos después para
  // pagar $0 (+$32.274 en 10 temporadas, medido), y una temporada entera se
  // podía jugar con el once VACÍO. A los jugadores se les paga por estar en
  // el club, no por entrar a la cancha.
  const plantel = (typeof clubPlantelDisponible === "function" ? clubPlantelDisponible(c) : []) || [];
  const sueldos = plantel
    .slice().sort((a, b) => (b.rating || 0) - (a.rating || 0)).slice(0, 11)
    .reduce((s2, j) => s2 + Math.max(0, (j.rating || 60) - 50) * 8, 0);

  // Los premios DEPORTIVOS se cobran por dirigir. El sponsor se suma DESPUÉS
  // del recorte, a propósito: es plata de contrato, no de cancha.
  const dirig = clubDirigido(s);
  const factor = clubFactorPremio(s);
  if (factor < 0.999) {
    const antes = premio;
    premio = Math.round(premio * factor);
    msg += ` · 🪑 Dirigiste el ${Math.round(dirig * 100)}% de las fechas: premios al ${Math.round(factor * 100)}% (-$${(antes - premio).toLocaleString("es-AR")})`;
  }
  premio += sponsor;
  // Piso en 0: era la ÚNICA resta del modo sin clamp (fichar, mejorar y ocio
  // sí chequean saldo), y una temporada mala con sueldos altos dejaba la caja
  // en negativo y hundiéndose más cada año: -2.830 → -5.660 → -8.490…
  c.dinero = Math.max(0, c.dinero + premio - sueldos);
  msg += ` · 💰 Sponsor +$${sponsor.toLocaleString("es-AR")} · 💸 Sueldos -$${sueldos.toLocaleString("es-AR")} · Premios +$${premio.toLocaleString("es-AR")}`;
  if (typeof figusOtorgarSobres === "function") figusOtorgarSobres(2);

  // Historial / vitrina
  c.historial = c.historial || [];
  // `copaId` va guardado para que el historial pueda mostrar el ícono de la
  // copa REAL de esa temporada (🌎 o ⭐) y no siempre el de la Libertadores.
  c.historial.unshift({ temporada: c.temporada, posLiga: posClub, campLiga,
                        posLib: posL, campLib, copaId: copa.id });
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
  // Tope por disciplina: el bonus ya está capado en clubPoder, pero el
  // CONTADOR no lo estaba y crecía sin límite (290 tras 40 temporadas
  // medidas), engordando el save y mintiendo en la pantalla de Entrenamiento.
  const topeDisciplina = 3 + c.instalaciones.ciudad * 3;
  if (c.entren[tipo] >= topeDisciplina) {
    showToast("Tu Ciudad Deportiva no da para más. Mejorala para seguir subiendo el Poder.", 3400);
    return;
  }
  c.entren[tipo] = Math.min(topeDisciplina, Math.round((c.entren[tipo] + ganancia) * 10) / 10);
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
  // Mejorar el ESTADIO cambia el escenario de la mesa (src/ui/escenarios.js).
  // Sin este aviso el cambio recién se veía al terminar el próximo partido:
  // pagás la mejora, volvés a la mesa y está igual — parece que no sirvió.
  if (id === "estadio" && typeof document !== "undefined") {
    document.dispatchEvent(new CustomEvent("clubEstadioMejorado", { detail: { nivel: nivel + 1 } }));
  }
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
  // Los tres son texto libre y terminan en LIGAS y en pantallas que arman
  // HTML por concatenación: se sanean acá, en el único punto de entrada.
  const nombre = clubNombreSeguro(document.getElementById("club-in-nombre")?.value);
  const ciudad = clubNombreSeguro(document.getElementById("club-in-ciudad")?.value);
  const estadio = clubNombreSeguro(document.getElementById("club-in-estadio")?.value, 26);
  if (!nombre) { showToast("Poné un nombre para tu club."); return; }
  const c = clubNuevo();
  c.fundado = true;
  c.nombre = nombre;
  c.ciudad = ciudad || "Tu ciudad";
  c.estadioNombre = estadio || ("Estadio " + nombre);
  c.color = _clubColorSel;
  c.color2 = _clubColor2Sel;
  c.escudoForma = _clubForm.forma || 0;
  // Las iniciales se dibujan DENTRO del SVG del escudo, que se inyecta como
  // innerHTML en la vista previa: mismo saneo que el nombre.
  c.iniciales = clubNombreSeguro(_clubForm.iniciales, 3);
  c.ligaId = "lpa";            // el club propio entra a la Liga Profesional
  _clubRegaloInicial(c);       // plantel humilde para arrancar + 11 armado
  clubGuardar(c);
  clubRegistrarEnLigas(c);     // desde ahora es un equipo más de su liga
  _clubRefrescarSelectores();  // ...y se ve en el Amistoso sin recargar
  if (typeof playSound === "function") playSound("win");
  showToast(`🎉 ¡Fundaste ${nombre}! Ya es un equipo más de la liga. Te dejé un plantel para arrancar.`, 3600);
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
      <div class="club-card-sub">${(s.objetivo||clubObjetivoTemporada(c)).desc} · Partido ${s.idx+1}/${s.cal.length}${s.liberta?` · jugás Liga + ${esc(clubCopaDeSeason(s).corto)}`:""}</div>
      <button class="btn primary" style="margin-top:8px;width:100%" onclick="clubRender('temporada')">📅 IR A LA TEMPORADA</button>
    </div>`;
  } else {
    tempCard = `<div class="club-card">
      <div class="club-card-t">📅 Temporada ${c.temporada}</div>
      <div class="club-card-sub">${c.season&&c.season.fin?"La temporada terminó. ":""}Empezá una nueva campaña de Liga${c.clasificadoLiberta?` + ${esc(clubCopaContinental(c).corto)}`:""} desde la pestaña Liga/Copa.</div>
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
      // Temporadas guardadas antes del 7 ago no tienen copaId: eran siempre
      // Libertadores, así que el fallback es el correcto.
      const lib  = h.campLib ? " · " + (CLUB_COPAS[h.copaId] || CLUB_COPAS.libertadores).icon : "";
      return `<div class="club-hist-row"><span>T${h.temporada}</span><span>Liga ${liga}${lib}</span></div>`;
    }).join("") + "</div>";
  }
  return `<div class="club-card">
    <div class="club-card-t">🏆 Vitrina del club</div>
    <div class="club-card-sub">Ligas: <b>${p.liga}</b> 🏆 · Libertadores: <b>${p.libertadores||0}</b> 🌎 · Champions: <b>${p.champions||0}</b> ⭐ · Mundial de Clubes: <b>${p.cwc||0}</b> 👑</div>
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
  // La columna DB (derrotas "en las buenas") faltaba: los puntos no cerraban
  // a la vista, porque una derrota peleada suma 1 y la tabla solo mostraba PJ.
  let html = `<div class="club-card-t">${titulo}</div><table class="club-tabla"><thead><tr><th>#</th><th class="tl">Equipo</th><th>PJ</th><th>DB</th><th>Pts</th><th>DG</th></tr></thead><tbody>`;
  ord.forEach((t, i) => {
    const mio = t.id === CLUB_ID;
    const zona = (resaltarTop && i < resaltarTop) ? "z4" : "";
    const dg = (t.gf||0) - (t.gc||0);
    html += `<tr class="${mio?"mio ":""}${zona}"><td>${i+1}</td><td class="tl">${esc(_clubNombreId(c, t.id))}${mio?" ★":""}</td><td>${t.pj}</td><td>${t.db||0}</td><td><b>${t.pts}</b></td><td>${dg>0?"+":""}${dg}</td></tr>`;
  });
  html += "</tbody></table>";
  return html;
}

/* Texto del recorrido del club en la copa continental de esta temporada. */
function _clubCopaResumen(c, s) {
  const copa = clubCopaDeSeason(s);
  const L = s.liberta;
  if (!L) return "";
  switch (s.libertaResultado || L.fase) {
    case "campeon":    return ` · ${copa.icon} ¡CAMPEÓN DE ${copa.corto.toUpperCase()}! 👑 Jugás el Mundial de Clubes`;
    case "subcampeon": return ` · ${copa.icon} Subcampeón de ${copa.corto}`;
    case "semifinal":  return ` · ${copa.icon} ${copa.corto}: eliminado en semifinal`;
    case "grupo":
    case "eliminado":  return ` · ${copa.icon} ${copa.corto}: quedaste ${L.posGrupo ? L.posGrupo + "º " : ""}en el grupo`;
    case "semi":       return ` · ${copa.icon} ${copa.corto}: clasificaste a semifinal`;
    case "final":      return ` · ${copa.icon} ${copa.corto}: ¡estás en la FINAL!`;
    default:           return ` · ${copa.icon} ${copa.corto} en juego`;
  }
}

function _clubRenderTemporada(c) {
  const copaProx = clubCopaContinental(c);
  if (!c.season) {
    return `<div class="club-card">
      <div class="club-card-t">📅 Temporada del club</div>
      <div class="club-card-sub">Jugá una temporada completa: tu Liga (todos contra todos)${c.clasificadoLiberta?` y la <b>${esc(copaProx.nombre)}</b> en simultáneo, con un calendario intercalado como en la vida real — grupo, semifinal y final`:`. Si terminás entre los <b>${COPA_CLASIFICAN_DE_LA_LIGA} primeros</b>, clasificás a la ${esc(copaProx.corto)}`}.</div>
      <button class="btn primary" style="margin-top:10px;width:100%" onclick="clubEmpezarTemporada()">▶ EMPEZAR TEMPORADA</button>
    </div>`;
  }
  const s = c.season;
  const copa = clubCopaDeSeason(s);
  let html = "";

  if (s.fin) {
    html += `<div class="club-card"><div class="club-card-t">🏁 Temporada terminada</div>
      <div class="club-card-sub">Campeón de Liga: <b>${esc(_clubNombreId(c, s.campeonLiga))}</b>${_clubCopaResumen(c, s)}</div>
      ${clubTieneFinalCWCPendiente(c) ? `<button class="btn primary" style="margin-top:10px;width:100%" onclick="copaAbrir('cwc')">👑 JUGAR EL MUNDIAL DE CLUBES</button>` : ""}
      <button class="btn primary" style="margin-top:10px;width:100%" onclick="clubEmpezarTemporada()">▶ NUEVA TEMPORADA</button></div>`;
  } else {
    const ent = s.cal[s.idx];
    const total = s.cal.length;
    html += `<div class="club-card">
      <div class="club-card-t">📅 Próximo partido (${s.idx+1}/${total})</div>
      <div class="club-card-sub">🎯 Objetivo: ${(s.objetivo||clubObjetivoTemporada(c)).desc}</div>
      <div class="club-card-sub" style="margin-top:3px">${esc(clubEtiquetaPartido(c, ent.comp, ent.fase))} · ${esc(c.nombre)} vs <b>${esc(_clubNombreId(c, ent.rivalId))}</b></div>
      <button class="btn primary" style="margin-top:10px;width:100%" onclick="clubSeasonJugarProximo()">⚽ JUGAR ESTE PARTIDO</button>
      <button class="btn" style="margin-top:6px;width:100%" onclick="clubSeasonSimularProximo()">⏭️ Simular este partido</button>
      <div class="club-card-sub" style="margin-top:8px">🪑 Dirigidas por vos: <b>${Math.round(clubDirigido(s) * 100)}%</b> · los premios de fin de temporada se pagan al <b>${Math.round(clubFactorPremio(s) * 100)}%</b>. Simular cansa al plantel igual que jugar.</div>
    </div>`;
  }

  // Calendario (próximos y jugados)
  html += '<div class="club-card"><div class="club-card-t">🗓️ Calendario</div><div class="club-cal">';
  s.cal.forEach((e, i) => {
    const estado = e.jugado ? `${e.gj}-${e.gr} ${e.gano?"✓":"✗"}` : (i === s.idx && !s.fin ? "▶" : "·");
    const cls = e.jugado ? (e.gano ? "win" : "lose") : (i === s.idx && !s.fin ? "next" : "");
    const fase = e.comp === "liberta" && e.fase && e.fase !== "grupo"
      ? (e.fase === "semi" ? " (semi)" : " (final)") : "";
    html += `<div class="club-cal-row ${cls}"><span class="club-cal-comp">${e.comp==="liberta"?copa.icon:"🏆"}</span><span class="club-cal-riv">${esc(_clubNombreId(c, e.rivalId))}${fase}</span><span class="club-cal-res">${estado}</span></div>`;
  });
  html += "</div></div>";

  // Tablas
  html += `<div class="club-card">${_clubTablaHTML(c, s.ligaTabla, "🏆 Tabla de la Liga", COPA_CLASIFICAN_DE_LA_LIGA)}<div class="club-card-sub" style="margin-top:6px">Los ${COPA_CLASIFICAN_DE_LA_LIGA} primeros (resaltados) clasifican a la ${esc(copaProx.corto)} del año que viene.</div></div>`;
  if (s.liberta) {
    html += `<div class="club-card">${_clubTablaHTML(c, s.liberta.tabla, `${copa.icon} Grupo de ${esc(copa.corto)}`, COPA_CLASIFICAN_DEL_GRUPO)}<div class="club-card-sub" style="margin-top:6px">Los ${COPA_CLASIFICAN_DEL_GRUPO} primeros del grupo pasan a semifinal. Después, semi y final a un partido.</div>`;
    if (s.liberta.semiRival) {
      html += `<div class="club-card-sub" style="margin-top:6px">🔑 Semifinal vs <b>${esc(_clubNombreId(c, s.liberta.semiRival))}</b>${s.liberta.finalRival?` · Final vs <b>${esc(_clubNombreId(c, s.liberta.finalRival))}</b>`:""}</div>`;
    }
    html += "</div>";
  }

  return html;
}

function _clubRenderMercado(c) {
  const lista = clubMercadoLista(c);
  const costoRef = clubMercadoCostoRefresco(c);
  const etiqRef = costoRef > 0 ? `🔄 Refrescar · $${costoRef.toLocaleString("es-AR")}` : "🔄 Refrescar · gratis";
  let html = `<div class="club-plantel-top"><span>💸 Mercado · Caja: <b>$${c.dinero.toLocaleString("es-AR")}</b></span><button class="btn" onclick="clubMercadoRefrescar()">${etiqRef}</button></div>
    <div class="club-card-sub" style="margin:0 0 8px">Los precios se mueven por la demanda. La vidriera rota gratis cada temporada; mandar al scout de nuevo se paga, y cada salida sale el doble que la anterior.</div>`;
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
    // LaLiga y Premier se suman el 7 ago: la copa continental de la carrera
    // sale de la REGIÓN de la liga (clubCopaContinental), así que dirigir un
    // club europeo es el camino para jugar la Champions en la carrera.
    const ligasReales = ["lpa", "laliga", "premier"];
    let grid = "";
    (typeof LIGAS !== "undefined" ? LIGAS : []).filter(l => ligasReales.includes(l.id)).forEach(l => {
      const copaL = l.region === "europa" ? CLUB_COPAS.champions : CLUB_COPAS.libertadores;
      grid += `<div class="club-real-liga">${l.nombre} <small style="opacity:.7;font-weight:400">· ${copaL.icon} ${copaL.corto}</small></div><div class="club-real-grid">`;
      _clubSinMiClub(l.equipos).slice().sort((a,b)=>(b.fuerza||0)-(a.fuerza||0)).forEach(e => {
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
  // El plantel de regalo puede completar el rango COMÚN: mismo motivo que en
  // clubFichar, el premio no se puede quedar esperando un sobre.
  if (typeof figusChequearPremiosSueltos === "function") figusChequearPremiosSueltos();
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
    /* padding-top de 52px, no 14px (7 ago): con 14 el escudo del club caía
       justo encima del botón "← Volver" (position:absolute; top:14; left:14)
       y en celular el texto quedaba ilegible sobre el escudo. En desktop no
       chocaba solo porque la tarjeta va centrada y el escudo arranca lejos.
       Mismo respiro que usan Amistoso y Mundial. */
    #club-screen{ display:none; position:fixed; inset:0; flex-direction:column; align-items:center; padding:52px 14px 24px; box-sizing:border-box; overflow-y:auto; -webkit-overflow-scrolling:touch; }
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

/* Suma dinero al club desde afuera (lo llama el premio del desafío diario,
   que hasta ahora invocaba window.clubAgregarMonedas — inexistente — con
   guarda typeof, o sea que la recompensa nunca llegaba). */
function clubAgregarMonedas(cant) {
  cant = Math.trunc(Number(cant) || 0);
  if (!cant) return 0;
  const c = clubCargar();
  if (!c.fundado) return 0;
  c.dinero = Math.max(0, (c.dinero || 0) + cant);
  clubGuardar(c);
  if (typeof clubActualizarBadge === "function") clubActualizarBadge();
  return c.dinero;
}
if (typeof window !== "undefined") window.clubAgregarMonedas = clubAgregarMonedas;

/* El estadio del club, para que el ESCENARIO de la mesa sea el estadio que
   construiste vos y no un premio por victorias sueltas (src/ui/escenarios.js).
   Antes los escenarios seguían NIVELES_ESTADIO —la escalera global por
   victorias— y eso convivía mal con este modo: acá el estadio es una
   instalación que pagás y mejorás, y hasta le ponés nombre propio. Si fundaste
   club, manda el club.
   Devuelve `fundado:false` cuando no hay club, para que quien lo lea pueda
   caer a la escalera global sin adivinar. */
if (typeof window !== "undefined") {
  window.getEstadioClub = function () {
    try {
      const c = clubCargar();
      if (!c || !c.fundado) return { fundado: false, nivel: 0, max: CLUB_INST_MAX };
      return {
        fundado: true,
        nivel: (c.instalaciones && c.instalaciones.estadio) || 1,
        max: CLUB_INST_MAX,
        nombre: c.estadioNombre || "",
      };
    } catch (e) {
      return { fundado: false, nivel: 0, max: CLUB_INST_MAX };
    }
  };
}

/* ── Enganches al motor ── */
document.addEventListener("DOMContentLoaded", () => {
  // El club fundado vive en localStorage, pero LIGAS se reconstruye en cada
  // carga: hay que volver a insertarlo o desaparece de los equipos al
  // recargar la página.
  try {
    if (clubRegistrarEnLigas()) { _clubRefrescarSelectores(); _clubRestaurarEquipoGuardado(); }
  } catch (e) { console.error("club: registrar en ligas", e); }
  clubActualizarBadge();
  if (typeof onJuego === "function") {
    onJuego("finDePartido", ({ puntosJugador, puntosRival, limite }) => {
      // Modo Entrenamiento: se ven las cartas del rival, así que un partido
      // de práctica NO es un partido del club — ni plata, ni sobres de la
      // cantera, ni energía/moral/temporada. addPesos ya tenía este muro
      // para las PT; club.js no lo tenía y era farmeable con información
      // perfecta (mapa por áreas del 2-ago, área Economía).
      // OJO: esto NO toca el contrato de "la economía del club paga por
      // cualquier modo" — los modos REALES siguen pagando todos; lo que se
      // bloquea es exactamente el único modo donde no se compite.
      if (typeof window !== "undefined" && window.modoEntrenamiento) return;
      const gano = puntosJugador >= limite;
      clubRegistrarPartido(gano, puntosJugador, puntosRival, limite);
      clubSeasonRegistrar(gano, puntosJugador, puntosRival, limite);
    });
    // Re-armar comodines al repartir cada mano
    onJuego("manoRepartida", clubPerksReset);
    onJuego("nuevoPartido",  clubPerksReset);
    // Cualquier partida que NO haya lanzado _clubLanzarVs invalida la fecha
    // de temporada que hubiera quedado colgada por un abandono. Sin esto, un
    // Partido Amistoso del club contra el mismo rival resolvía la fecha.
    onJuego("nuevoPartido", () => {
      if (_clubSeasonArmando) { _clubSeasonArmando = false; return; } // es la nuestra
      _clubSeasonEsNuestro = false;
      _clubSeasonPend = null;
    });
  }
});
