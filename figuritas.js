/* ══════════════════════════════════════════════════════════
   FIGURITAS TRUGOL — Álbum de 56 jugadores
   - Las figuritas se ganan en SOBRES (3 figuritas por sobre)
   - Premios: ganar una fecha de la liga = 1 sobre
              perder en las buenas = 50% de chances de 1 sobre
              campeón del torneo  = 5 sobres + 1 LEYENDA garantizada
              2º a 4º             = 2 sobres · resto = 1 sobre
   - Rangos: LEYENDA (6) · ORO (10) · PLATA (14) · COMÚN (20)
   - El álbum se abre con el FAB 📒 o desde el menú principal
   No modifica el motor del truco: liga.js llama a figusOtorgarSobres().
   ══════════════════════════════════════════════════════════ */

const FIGUS_KEY = "truco_figus";

/* ── Las 50 figuritas, agrupadas por rango ──
   num: número de figurita en el álbum (1-50) */
const FIGUS = [
  // ── LEYENDA (6) ──────────────────────────────────────────
  { num: 1,  nombre: "Diego Maradona",    pos: "Enganche",       rango: "leyenda", rating: 99 },
  { num: 2,  nombre: "Lionel Messi",      pos: "Delantero",      rango: "leyenda", rating: 99 },
  { num: 3,  nombre: "Alfredo Di Stéfano",pos: "Delantero",      rango: "leyenda", rating: 96 },
  { num: 4,  nombre: "Mario Kempes",      pos: "Goleador",       rango: "leyenda", rating: 92 },
  { num: 5,  nombre: "Daniel Passarella", pos: "Defensor",       rango: "leyenda", rating: 90 },
  { num: 6,  nombre: "Gabriel Batistuta", pos: "Delantero",      rango: "leyenda", rating: 91 },
  // ── ORO (10) ─────────────────────────────────────────────
  { num: 7,  nombre: "Juan R. Riquelme",  pos: "Enganche",       rango: "oro", rating: 89 },
  { num: 8,  nombre: "Ángel Di María",    pos: "Extremo",        rango: "oro", rating: 88 },
  { num: 9,  nombre: "Ubaldo Fillol",     pos: "Arquero",        rango: "oro", rating: 87 },
  { num: 10, nombre: "Oscar Ruggeri",     pos: "Defensor",       rango: "oro", rating: 85 },
  { num: 11, nombre: "Emiliano Martínez", pos: "Arquero",        rango: "oro", rating: 89 },
  { num: 12, nombre: "Javier Zanetti",    pos: "Lateral",        rango: "oro", rating: 88 },
  { num: 13, nombre: "Hernán Crespo",     pos: "Delantero",      rango: "oro", rating: 86 },
  { num: 14, nombre: "Sergio Agüero",     pos: "Delantero",      rango: "oro", rating: 89 },
  { num: 15, nombre: "Fernando Redondo",  pos: "Volante",        rango: "oro", rating: 87 },
  { num: 16, nombre: "Osvaldo Ardiles",   pos: "Volante",        rango: "oro", rating: 85 },
  // ── PLATA (14) ───────────────────────────────────────────
  { num: 17, nombre: "Julián Álvarez",    pos: "Delantero",      rango: "plata", rating: 84 },
  { num: 18, nombre: "Enzo Fernández",    pos: "Volante",        rango: "plata", rating: 83 },
  { num: 19, nombre: "Alexis Mac Allister", pos: "Volante",      rango: "plata", rating: 84 },
  { num: 20, nombre: "Rodrigo De Paul",   pos: "Volante",        rango: "plata", rating: 82 },
  { num: 21, nombre: "Cuti Romero",       pos: "Defensor",       rango: "plata", rating: 85 },
  { num: 22, nombre: "Nicolás Otamendi",  pos: "Defensor",       rango: "plata", rating: 82 },
  { num: 23, nombre: "Lautaro Martínez",  pos: "Delantero",      rango: "plata", rating: 86 },
  { num: 24, nombre: "Carlos Tevez",      pos: "Delantero",      rango: "plata", rating: 85 },
  { num: 25, nombre: "Juan Pablo Sorín",  pos: "Lateral",        rango: "plata", rating: 81 },
  { num: 26, nombre: "Ariel Ortega",      pos: "Enganche",       rango: "plata", rating: 83 },
  { num: 27, nombre: "Claudio Caniggia",  pos: "Delantero",      rango: "plata", rating: 82 },
  { num: 28, nombre: "Sergio Goycochea",  pos: "Arquero",        rango: "plata", rating: 80 },
  { num: 29, nombre: "Esteban Cambiasso", pos: "Volante",        rango: "plata", rating: 83 },
  { num: 30, nombre: "Pablo Aimar",       pos: "Enganche",       rango: "plata", rating: 84 },
  // ── COMÚN (20) — 10 del plantel mundialista + 10 ídolos de clubes ──
  { num: 31, nombre: "Sergio Romero",        pos: "Arquero",     rango: "comun", rating: 79 },
  { num: 32, nombre: "Pablo Zabaleta",       pos: "Lateral",     rango: "comun", rating: 78 },
  { num: 33, nombre: "Nicolás Tagliafico",   pos: "Lateral",     rango: "comun", rating: 79 },
  { num: 34, nombre: "Marcos Acuña",         pos: "Lateral",     rango: "comun", rating: 79 },
  { num: 35, nombre: "Lisandro Martínez",    pos: "Defensor",    rango: "comun", rating: 82 },
  { num: 36, nombre: "Germán Pezzella",      pos: "Defensor",    rango: "comun", rating: 77 },
  { num: 37, nombre: "Leandro Paredes",      pos: "Volante",     rango: "comun", rating: 80 },
  { num: 38, nombre: "Giovani Lo Celso",     pos: "Volante",     rango: "comun", rating: 80 },
  { num: 39, nombre: "Guido Rodríguez",      pos: "Volante",     rango: "comun", rating: 78 },
  { num: 40, nombre: "Gonzalo Higuaín",      pos: "Delantero",   rango: "comun", rating: 84 },
  { num: 41, nombre: "Enzo Francescoli",     pos: "Enganche",    rango: "comun", rating: 86 },
  { num: 42, nombre: "Ricardo Bochini",      pos: "Enganche",    rango: "comun", rating: 85 },
  { num: 43, nombre: "Juan S. Verón",        pos: "Volante",     rango: "comun", rating: 84 },
  { num: 44, nombre: "Martín Palermo",       pos: "Delantero",   rango: "comun", rating: 84 },
  { num: 45, nombre: "Carlos Bianchi",       pos: "Goleador",    rango: "comun", rating: 86 },
  { num: 46, nombre: "Hugo Gatti",           pos: "Arquero",     rango: "comun", rating: 82 },
  { num: 47, nombre: "Roberto Perfumo",      pos: "Defensor",    rango: "comun", rating: 83 },
  { num: 48, nombre: "Marcelo Gallardo",     pos: "Volante",     rango: "comun", rating: 85 },
  { num: 49, nombre: "Diego Latorre",        pos: "Delantero",   rango: "comun", rating: 80 },
  { num: 50, nombre: "Ángel Labruna",        pos: "Delantero",   rango: "comun", rating: 85 },
  // ── AMPLIACIÓN: campeones e ídolos ───────────────────────
  { num: 51, nombre: "Roberto Ayala",        pos: "Defensor",    rango: "oro",   rating: 85 },
  { num: 52, nombre: "Jorge Valdano",        pos: "Delantero",   rango: "plata", rating: 85 },
  { num: 53, nombre: "Diego Simeone",        pos: "Volante",     rango: "plata", rating: 84 },
  { num: 54, nombre: "Walter Samuel",        pos: "Defensor",    rango: "plata", rating: 83 },
  { num: 55, nombre: "Jorge Burruchaga",     pos: "Enganche",    rango: "comun", rating: 83 },
  { num: 56, nombre: "José Luis Brown",      pos: "Defensor",    rango: "comun", rating: 80 }
];

/* ── Atributos tipo "carta": derivados del rating + arquetipo de la
   posición, de forma determinística (siempre los mismos para cada
   jugador). Se muestran en el zoom de la figurita. ── */
const FIGUS_ARQUETIPOS = {
  // [RIT, TIR, PAS, REG, DEF, FIS] sesgos por posición (se suman al rating)
  "Arquero":   { labels:["ELA","MAN","SAQ","REF","POS","FIS"], bias:[-8,-20,-4,-12, 6, 2] },
  "Defensor":  { bias:[-2,-10,-3,-6, 10, 6] },
  "Lateral":   { bias:[ 6,-6, 2, 2, 6, 3] },
  "Volante":   { bias:[ 0,-2, 8, 4, 2, 1] },
  "Enganche":  { bias:[ 0, 2,10,10,-8,-4] },
  "Extremo":   { bias:[10, 2, 4,10,-8,-2] },
  "Delantero": { bias:[ 6,10, 2, 6,-12,-2] },
  "Goleador":  { bias:[ 4,12,-2, 4,-12, 2] },
};
const FIGUS_STAT_LABELS = ["RIT","TIR","PAS","REG","DEF","FIS"];

function figuStats(f) {
  const arq = FIGUS_ARQUETIPOS[f.pos] || FIGUS_ARQUETIPOS["Volante"];
  const labels = arq.labels || FIGUS_STAT_LABELS;
  // Pseudo-aleatorio estable por número de figurita (para que no cambie)
  const rnd = (i) => {
    const x = Math.sin((f.num * 13.13) + i * 7.7) * 10000;
    return (x - Math.floor(x)) * 8 - 4; // -4..+4
  };
  const vals = arq.bias.map((b, i) =>
    Math.max(40, Math.min(99, Math.round(f.rating + b + rnd(i))))
  );
  return labels.map((l, i) => ({ label: l, val: vals[i] }));
}

/* Reseña breve de cada figurita (se muestra al seleccionarla) */
const FIGUS_BIO = {
  1:"El 10 eterno. Campeón del mundo en México '86 y el mejor gambeteador de la historia.",
  2:"La Pulga. Campeón del mundo 2022 y múltiple Balón de Oro, el máximo ídolo argentino.",
  3:"La Saeta Rubia. Genio total del Real Madrid, ganó cinco Copas de Europa.",
  4:"El Matador. Goleador y figura del Mundial '78, primer título argentino.",
  5:"El Gran Capitán. Líder y caudillo, levantó la copa en el '78.",
  6:"Batigol. El killer del área, máximo goleador histórico de la Selección por años.",
  7:"El último 10 clásico. Magia y pausa, ídolo máximo de Boca.",
  8:"Fideo. Decisivo en finales: marcó en la Copa América y el Mundial 2022.",
  9:"El Pato. Arquerazo del '78, uno de los mejores de la historia argentina.",
  10:"El Cabezón. Defensor de raza y campeón del mundo en el '86.",
  11:"Dibu. Héroe atajador de Qatar 2022, el mejor arquero del Mundial.",
  12:"Pupi. Lateral incansable, leyenda eterna del Inter.",
  13:"Goleador nato, brilló en River, Lazio, Inter y la Selección.",
  14:"El Kun. Killer del City y de la Selección, gol y desequilibrio.",
  15:"Elegancia pura en el medio, distinción de River y Real Madrid.",
  16:"Cerebro del mediocampo campeón del '78, ídolo en Inglaterra.",
  17:"La Araña. Goleador joven, campeón del mundo 2022 y figura en Europa.",
  18:"Volante moderno, mejor jugador joven del Mundial 2022.",
  19:"Motor del mediocampo campeón en Qatar, llegada al gol.",
  20:"El motorcito. Garra y entrega, socio de Messi en la Selección.",
  21:"Cuti. Defensor aguerrido, marca dura y carácter, campeón del mundo.",
  22:"General. Defensor experimentado y líder de la última camada.",
  23:"El Toro. Goleador potente del Inter y la Selección.",
  24:"El Apache. Corazón y gol, ídolo de Boca y de la gente.",
  25:"Lateral con alma de capitán, garra y vuelta olímpica.",
  26:"El Burrito. Gambeta endiablada, talento puro de River.",
  27:"El Hijo del Viento. Velocidad explosiva en Italia y la Selección.",
  28:"Héroe de los penales en Italia '90.",
  29:"Volante de quite y orden, leyenda del Inter del triplete.",
  30:"El Payaso. Enganche exquisito de River, ídolo de Messi.",
  31:"Chiquito. Arquero de los penales en Brasil 2014.",
  32:"Lateral guerrero, ídolo del Manchester City.",
  33:"Lateral sólido y campeón del mundo 2022.",
  34:"Huevo. Lateral de doble función, pura intensidad.",
  35:"Carnicero. Defensor chico pero feroz, campeón 2022.",
  36:"Defensor elegante y capitán en la Fiorentina.",
  37:"Volante de pase largo y pelota parada.",
  38:"Talento zurdo para el mediocampo.",
  39:"Cinco de marca y equilibrio.",
  40:"Pipita. Goleador de River, Napoli, Juventus y la Selección.",
  41:"El Príncipe. Elegancia uruguaya, ídolo máximo de River.",
  42:"El Bocha. Maestro del pase, ídolo eterno de Independiente.",
  43:"La Brujita. Visión y pase, crack de Estudiantes y Europa.",
  44:"El Titán. Máximo goleador histórico de Boca.",
  45:"Goleador histórico y luego DT multicampeón.",
  46:"El Loco. Arquero adelantado y revolucionario.",
  47:"El Mariscal. Defensor central de época en Racing.",
  48:"El Muñeco. Crack de River y luego su DT más ganador.",
  49:"Coco. Talento y gambeta, dupla de ataque en Boca.",
  50:"Ídolo histórico y goleador eterno de River.",
  51:"El Ratón. Marcador central de jerarquía, capitán de la Selección.",
  52:"Campeón del mundo '86, goleador y pensador del fútbol.",
  53:"El Cholo. Volante de raza y luego DT ganador del Atlético.",
  54:"El Muro. Defensor central infranqueable en Italia.",
  55:"Autor del gol del título en México '86.",
  56:"El Tata. Héroe inesperado: gol en la final del '86.",
};

const FIGUS_RANGOS = {
  leyenda: { label: "LEYENDA", color: "#f5c518", borde: "#c89b3c", fondo: "#2b5fa8", estrellas: 5, prob: 0.04 },
  oro:     { label: "ORO",     color: "#ffd700", borde: "#b8860b", fondo: "#3a3a1a", estrellas: 4, prob: 0.13 },
  plata:   { label: "PLATA",   color: "#d9d9e3", borde: "#9a9aa8", fondo: "#2c3140", estrellas: 3, prob: 0.28 },
  comun:   { label: "COMÚN",   color: "#9fd49f", borde: "#5a8a5a", fondo: "#23321f", estrellas: 2, prob: 0.55 }
};

/* ── Persistencia ── */
function figusCargar() {
  try {
    const raw = localStorage.getItem(FIGUS_KEY);
    if (raw) {
      const d = JSON.parse(raw);
      if (d && d.owned) return d;
    }
  } catch (e) {}
  return { owned: {}, sobres: 1, abiertos: 0, leyendaGarantizada: 0, premios: {} }; // arranca con 1 sobre de regalo
}

/* ── PREMIOS POR COMPLETAR ──
   Completar un rango entero o el álbum completo da sobres de regalo
   (una sola vez cada uno). Devuelve los mensajes a mostrar. */
const FIGUS_PREMIO_RANGO = { leyenda: 3, oro: 2, plata: 2, comun: 1 };
const FIGUS_PREMIO_ALBUM = 5;
let figusUltimosPremios = [];

function _figusChequearPremios(d) {
  d.premios = d.premios || {};
  const msgs = [];
  ["leyenda", "oro", "plata", "comun"].forEach(rango => {
    if (d.premios[rango]) return;
    const grupo = FIGUS.filter(f => f.rango === rango);
    if (grupo.every(f => d.owned[f.num])) {
      d.premios[rango] = true;
      d.sobres += FIGUS_PREMIO_RANGO[rango];
      msgs.push(`🏅 ¡Completaste el rango ${FIGUS_RANGOS[rango].label}! +${FIGUS_PREMIO_RANGO[rango]} sobres`);
    }
  });
  if (!d.premios.album && FIGUS.every(f => d.owned[f.num])) {
    d.premios.album = true;
    d.sobres += FIGUS_PREMIO_ALBUM;
    d.leyendaGarantizada = (d.leyendaGarantizada || 0) + 1;
    msgs.push(`🏆 ¡ÁLBUM COMPLETO! +${FIGUS_PREMIO_ALBUM} sobres y una LEYENDA garantizada`);
  }
  return msgs;
}

function figusGuardar(d) { lsSet(FIGUS_KEY, JSON.stringify(d)); }

/* ── PREMIOS — la liga llama acá ──
   garantizarLeyenda=true: el próximo sobre incluye una LEYENDA segura */
function figusOtorgarSobres(cantidad, garantizarLeyenda) {
  const d = figusCargar();
  d.sobres += cantidad;
  if (garantizarLeyenda) d.leyendaGarantizada = (d.leyendaGarantizada || 0) + 1;
  figusGuardar(d);
  figusActualizarBadge();
}

/* ── Sorteo de una figurita según probabilidades de rango ── */
function _figuSortear(rangoForzado) {
  let rango = rangoForzado;
  if (!rango) {
    const r = Math.random();
    if      (r < FIGUS_RANGOS.leyenda.prob) rango = "leyenda";
    else if (r < FIGUS_RANGOS.leyenda.prob + FIGUS_RANGOS.oro.prob) rango = "oro";
    else if (r < FIGUS_RANGOS.leyenda.prob + FIGUS_RANGOS.oro.prob + FIGUS_RANGOS.plata.prob) rango = "plata";
    else rango = "comun";
  }
  const pool = FIGUS.filter(f => f.rango === rango);
  return pool[Math.floor(Math.random() * pool.length)];
}

/* ── Abrir un sobre: devuelve 3 figuritas y las suma al álbum ──
   Cada figurita devuelta incluye "_nueva" indicando si ANTES de
   este sobre el jugador no la tenía (aunque salga repetida dos
   veces en el mismo sobre, solo la primera cuenta como nueva). */
function figusAbrirSobre() {
  const d = figusCargar();
  if (d.sobres <= 0) return null;
  d.sobres--;
  d.abiertos = (d.abiertos || 0) + 1;

  const figus = [];
  const conLeyenda = (d.leyendaGarantizada || 0) > 0;
  if (conLeyenda) d.leyendaGarantizada--;

  for (let i = 0; i < 3; i++) {
    const f = _figuSortear(conLeyenda && i === 0 ? "leyenda" : null);
    const yaTenia = !!d.owned[f.num];
    d.owned[f.num] = (d.owned[f.num] || 0) + 1;
    figus.push(Object.assign({ _nueva: !yaTenia }, f));
  }
  // Premios por completar rango/álbum (suma sobres dentro de d).
  figusUltimosPremios = _figusChequearPremios(d);
  figusGuardar(d);
  figusActualizarBadge();
  return figus;
}

/* ── Canje de repetidas por sobres ──
   Cada FIGUS_CANJE_COSTO figuritas repetidas (copias de más,
   sin contar la primera de cada una) se canjean por 1 sobre. */
const FIGUS_CANJE_COSTO = 5;

function figusRepesDisponibles(d) {
  const data = d || figusCargar();
  return Object.values(data.owned || {}).reduce((s, c) => s + Math.max(0, c - 1), 0);
}

function figusCanjear() {
  const d = figusCargar();
  if (figusRepesDisponibles(d) < FIGUS_CANJE_COSTO) return false;

  let restante = FIGUS_CANJE_COSTO;
  for (const num of Object.keys(d.owned)) {
    if (restante <= 0) break;
    const extra = d.owned[num] - 1;
    if (extra <= 0) continue;
    const usar = Math.min(extra, restante);
    d.owned[num] -= usar;
    restante -= usar;
  }
  d.sobres += 1;
  figusGuardar(d);
  figusActualizarBadge();
  return true;
}

function figusCanjearUI() {
  const ok = figusCanjear();
  if (!ok) {
    if (typeof showToast === "function") showToast(`Necesitás ${FIGUS_CANJE_COSTO} figuritas repetidas para canjear.`);
    return;
  }
  if (typeof playSound === "function") playSound("punto");
  if (typeof showToast === "function") showToast(`🔄 Canjeaste ${FIGUS_CANJE_COSTO} repetidas por 1 sobre nuevo.`);
  figusRenderAlbum();
}

/* Código corto de posición para la carta */
const FIGUS_POS_CORTA = {
  Arquero:"ARQ", Defensor:"DEF", Lateral:"LAT", Volante:"VOL",
  Enganche:"ENG", Extremo:"EXT", Delantero:"DEL", Goleador:"GOL"
};
function _figuPosCorta(pos) { return FIGUS_POS_CORTA[pos] || (pos || "").substring(0, 3).toUpperCase(); }

/* Aclara/oscurece un color hex por un factor (para barba/sombras) */
function _figuShade(hex, f) {
  const h = (hex || "#333").replace("#", "");
  const r = parseInt(h.substr(0,2),16)||40, g = parseInt(h.substr(2,2),16)||40, b = parseInt(h.substr(4,2),16)||40;
  const cl = x => Math.max(0, Math.min(255, Math.round(x * f)));
  return "#" + [cl(r),cl(g),cl(b)].map(x => x.toString(16).padStart(2,"0")).join("");
}

/* Rasgos curados por jugador para que el retrato SE PAREZCA al real
   (tono de piel, color y tipo de pelo, barba). No es un retrato
   fotográfico: son los rasgos característicos, estilizados.
   skin: A clara · B media · C morena clara · D morena
   pelo: K negro · D castaño osc · C castaño · L castaño claro · G canoso · B rubio
   estilo: 0 normal · 1 corto · 2 pelado/entradas · 3 largo */
const _S = { A:"#f0c39a", B:"#e8b48c", C:"#d89b6c", D:"#c98a5a" };
const _H = { K:"#1a120a", D:"#2a1d12", C:"#4a3420", L:"#5a4326", G:"#8a8a8a", B:"#b88a3a" };
// [skin, pelo, estilo, barba]
const FIGUS_LOOKS = {
  1:[_S.C,_H.K,3,false], 2:[_S.B,_H.C,1,true],  3:[_S.B,_H.G,2,false], 4:[_S.C,_H.K,3,false],
  5:[_S.B,_H.D,1,false], 6:[_S.B,_H.C,3,true],  7:[_S.C,_H.K,1,false], 8:[_S.B,_H.C,1,false],
  9:[_S.B,_H.D,0,false], 10:[_S.C,_H.K,1,false],11:[_S.B,_H.K,1,true], 12:[_S.B,_H.K,1,false],
  13:[_S.B,_H.D,1,false],14:[_S.C,_H.K,1,true], 15:[_S.B,_H.K,3,false],16:[_S.B,_H.D,0,false],
  17:[_S.B,_H.C,1,false],18:[_S.B,_H.C,0,true], 19:[_S.B,_H.C,3,true], 20:[_S.B,_H.K,1,true],
  21:[_S.C,_H.K,1,true], 22:[_S.C,_H.K,2,true], 23:[_S.C,_H.K,1,true], 24:[_S.C,_H.K,1,false],
  25:[_S.B,_H.K,3,false],26:[_S.C,_H.K,1,false],27:[_S.B,_H.B,3,false],28:[_S.B,_H.D,0,false],
  29:[_S.B,_H.K,2,true], 30:[_S.A,_H.L,1,false],31:[_S.B,_H.K,1,true], 32:[_S.B,_H.D,1,true],
  33:[_S.B,_H.D,1,false],34:[_S.C,_H.K,1,true], 35:[_S.B,_H.C,1,true], 36:[_S.A,_H.L,1,true],
  37:[_S.B,_H.D,1,true], 38:[_S.B,_H.C,1,true], 39:[_S.C,_H.K,1,true], 40:[_S.B,_H.D,1,false],
  41:[_S.B,_H.D,0,false],42:[_S.B,_H.D,0,false],43:[_S.B,_H.K,2,false],44:[_S.B,_H.C,1,false],
  45:[_S.B,_H.G,0,false],46:[_S.B,_H.G,3,false],47:[_S.B,_H.D,0,false],48:[_S.B,_H.C,1,false],
  49:[_S.B,_H.D,1,false],50:[_S.B,_H.G,0,false],51:[_S.B,_H.D,2,false],52:[_S.B,_H.D,0,false],
  53:[_S.C,_H.K,1,false],54:[_S.C,_H.K,1,false],55:[_S.B,_H.D,0,false],56:[_S.C,_H.K,0,false],
};

/* Look del jugador: rasgos curados (parecidos al real) + camiseta por hash */
function _figuLook(f) {
  const jerseys = [
    ["#7ec2ec","#ffffff"], ["#e0151d","#ffffff"], ["#1b1b1b","#f4d000"],
    ["#0a5a2c","#ffffff"], ["#0033a0","#ffffff"], ["#6a1b9a","#ffffff"],
    ["#d81e5b","#ffffff"], ["#ff6f00","#1b1b1b"],
  ];
  const h = (f.num * 2654435761) >>> 0;
  const jersey = jerseys[(h >>> 11) % jerseys.length];
  const ov = FIGUS_LOOKS[f.num];
  if (ov) return { skin: ov[0], hair: ov[1], estilo: ov[2], barba: ov[3], jersey };
  // Sin override: rasgos determinísticos por hash (fallback)
  const skins = ["#f0c39a","#e8b48c","#d89b6c","#c98a5a"];
  const hairs = ["#1a120a","#2a1d12","#4a3420","#5a4326"];
  return {
    skin: skins[(h >>> 2) % skins.length],
    hair: hairs[(h >>> 5) % hairs.length],
    estilo: (h >>> 17) % 4,
    barba: ((h >>> 23) % 3) === 0,
    jersey,
  };
}

/* Dibuja el pelo según el peinado del look */
function _figuPelo(look, hair) {
  switch (look.estilo) {
    case 2: // pelado / entradas: apenas a los costados
      return `<path d="M46 68 Q45 60 50 57 Q47 64 49 69 Z M74 68 Q75 60 70 57 Q73 64 71 69 Z" fill="${hair}"/>`;
    case 1: // corto / rapado
      return `<path d="M46 68 Q45 54 60 54 Q75 54 74 68 Q70 60 60 60 Q50 60 46 68 Z" fill="${hair}"/>`;
    case 3: // largo: baja por los costados
      return `<path d="M44 72 Q42 50 60 50 Q78 50 76 72 Q76 80 73 82 L71 64 Q68 58 60 58 Q52 58 49 64 L47 82 Q44 80 44 72 Z" fill="${hair}"/>`;
    default: // normal
      return `<path d="M45 69 Q44 51 60 51 Q76 51 75 69 Q72 59 60 58 Q48 59 45 69 Z" fill="${hair}"/>`;
  }
}

/* ── Mini-carta SVG estilo "LEYENDA" (marco dorado + franjas celestes) ── */
function figuSVG(f, opts) {
  const r       = FIGUS_RANGOS[f.rango];
  const nueva   = opts && opts.nueva;
  const repe    = opts && opts.repe;
  // Sufijo para que el id del gradiente sea único aunque la misma
  // figurita se renderice más de una vez en pantalla (álbum + zoom)
  const gid     = "fr" + f.num + (opts && opts.idSuffix ? opts.idSuffix : "");
  const iniciales = f.nombre.split(" ").map(p => p[0]).join("").substring(0, 3).toUpperCase();
  const estrellas = "★".repeat(r.estrellas);
  // Nombre en dos líneas si es largo
  const partes = f.nombre.split(" ");
  let l1 = f.nombre, l2 = "";
  if (f.nombre.length > 13 && partes.length > 1) {
    const mitad = Math.ceil(partes.length / 2);
    l1 = partes.slice(0, mitad).join(" ");
    l2 = partes.slice(mitad).join(" ");
  }
  // "Look" del jugador: piel, pelo, peinado, barba y camiseta, todo
  // determinístico por número (siempre el mismo retrato para cada figu).
  const look = _figuLook(f);
  const skin = look.skin;
  const hair = look.hair;
  // El nombre va en una sola línea acá (l1) — si era largo, l1+l2 se unen.
  const nombreLinea = (l1 + (l2 ? " " + l2 : "")).trim() || f.nombre;
  const fsNombre = nombreLinea.length > 16 ? 8 : (nombreLinea.length > 13 ? 9 : 10);
  return `
  <svg viewBox="0 0 120 170" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="${gid}" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="${r.borde}"/>
        <stop offset="50%" stop-color="${r.color}"/>
        <stop offset="100%" stop-color="${r.borde}"/>
      </linearGradient>
      <linearGradient id="${gid}s" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#1b3a5c"/><stop offset="100%" stop-color="#0a1827"/>
      </linearGradient>
    </defs>
    <rect x="1" y="1" width="118" height="168" rx="10" fill="url(#${gid})"/>
    <rect x="6" y="6" width="108" height="158" rx="7" fill="${r.fondo}"/>
    <rect x="6" y="6" width="108" height="158" rx="7" fill="none" stroke="rgba(255,255,255,.15)"/>
    <!-- Valoración tipo carta (esquina sup-izq) -->
    <text x="18" y="29" text-anchor="middle" font-family="Oswald,sans-serif" font-size="19" font-weight="800" fill="${r.color}">${f.rating || ""}</text>
    <text x="18" y="40" text-anchor="middle" font-family="Oswald,sans-serif" font-size="7.5" font-weight="700" fill="${r.color}" letter-spacing=".5">${_figuPosCorta(f.pos)}</text>
    <text x="68" y="22" text-anchor="middle" font-family="Oswald,sans-serif" font-size="9" fill="${r.color}" letter-spacing="1.5" font-weight="700">${r.label}</text>
    <text x="68" y="33" text-anchor="middle" font-size="8" fill="${r.color}">${estrellas}</text>
    <!-- Retrato ilustrado del jugador (cabeza + camiseta con franjas) -->
    <rect x="22" y="37" width="76" height="76" rx="6" fill="url(#${gid}s)"/>
    <!-- Hombros / mangas (con sombra) -->
    <path d="M24 113 C24 99 34 92 44 89 L46 113 Z" fill="${_figuShade(look.jersey[0], .78)}"/>
    <path d="M96 113 C96 99 86 92 76 89 L74 113 Z" fill="${_figuShade(look.jersey[0], .78)}"/>
    <!-- Torso / camiseta -->
    <path d="M30 113 C30 97 42 91 48 88 L54 92 Q60 98 66 92 L72 88 C78 91 90 97 90 113 Z" fill="${look.jersey[0]}"/>
    <rect x="43" y="89" width="6" height="24" fill="${look.jersey[1]}" opacity=".9"/>
    <rect x="71" y="89" width="6" height="24" fill="${look.jersey[1]}" opacity=".9"/>
    <!-- Cuello camiseta -->
    <path d="M54 92 Q60 98 66 92 L63 89 Q60 91 57 89 Z" fill="#0a1827"/>
    <rect x="55.5" y="80" width="9" height="11" fill="${skin}"/>
    <!-- Orejas (detrás de la cabeza) -->
    <circle cx="45.5" cy="70" r="2.8" fill="${skin}"/><circle cx="74.5" cy="70" r="2.8" fill="${_figuShade(skin, .9)}"/>
    <!-- Cabeza -->
    <circle cx="60" cy="70" r="15.5" fill="${skin}"/>
    <!-- Sombra del mentón -->
    <path d="M51 79 Q60 85 69 79 Q65 83 60 83 Q55 83 51 79 Z" fill="${_figuShade(skin, .9)}" opacity=".5"/>
    ${_figuPelo(look, hair)}
    ${look.barba ? `<path d="M47 73 Q49 88 60 88 Q71 88 73 73 Q70 81 60 81 Q50 81 47 73 Z" fill="${_figuShade(hair, .82)}"/>` : ""}
    <!-- Cejas -->
    <path d="M50 65.5 Q53.5 64 57 65.5" stroke="${hair}" stroke-width="1.4" fill="none" stroke-linecap="round"/>
    <path d="M63 65.5 Q66.5 64 70 65.5" stroke="${hair}" stroke-width="1.4" fill="none" stroke-linecap="round"/>
    <!-- Ojos -->
    <circle cx="53.5" cy="70" r="1.6" fill="#16202c"/><circle cx="66.5" cy="70" r="1.6" fill="#16202c"/>
    <!-- Nariz -->
    <path d="M60 70 L58.4 75 Q60 76.4 61.6 75" stroke="${_figuShade(skin, .78)}" stroke-width="1" fill="none" stroke-linecap="round"/>
    <!-- Boca -->
    <path d="M55 79 Q60 82 65 79" stroke="#9a5a3a" stroke-width="1.2" fill="none" stroke-linecap="round"/>
    <text x="60" y="109" text-anchor="middle" font-family="Oswald,sans-serif" font-size="12" font-weight="800" fill="#0a1827">${f.num}</text>
    <rect x="22" y="37" width="76" height="76" rx="6" fill="none" stroke="url(#${gid})" stroke-width="2"/>
    <text x="60" y="129" text-anchor="middle" font-family="Oswald,sans-serif" font-size="${fsNombre}" font-weight="700" fill="#fff">${nombreLinea}</text>
    <text x="60" y="143" text-anchor="middle" font-family="Oswald,sans-serif" font-size="8" fill="rgba(255,255,255,.75)">${f.pos}</text>
    <text x="60" y="158" text-anchor="middle" font-family="Oswald,sans-serif" font-size="8" fill="${r.color}" font-weight="700">#${String(f.num).padStart(3, "0")}</text>
    ${nueva ? `<rect x="6" y="6" width="40" height="14" rx="4" fill="#1f9e4b"/><text x="26" y="16" text-anchor="middle" font-size="8" font-weight="700" fill="#fff" font-family="Oswald,sans-serif">¡NUEVA!</text>` : ""}
    ${repe  ? `<rect x="74" y="6" width="40" height="14" rx="4" fill="rgba(0,0,0,.6)"/><text x="94" y="16" text-anchor="middle" font-size="8" font-weight="700" fill="#ccc" font-family="Oswald,sans-serif">REPE</text>` : ""}
  </svg>`;
}

/* Figurita faltante (silueta) */
function figuFaltanteSVG(f) {
  const r = FIGUS_RANGOS[f.rango];
  return `
  <svg viewBox="0 0 120 170" xmlns="http://www.w3.org/2000/svg">
    <rect x="2" y="2" width="116" height="166" rx="10" fill="rgba(0,0,0,.35)"
      stroke="${r.borde}" stroke-width="1.5" stroke-dasharray="6 4" opacity=".7"/>
    <text x="60" y="80" text-anchor="middle" font-size="34" fill="rgba(255,255,255,.18)">?</text>
    <text x="60" y="112" text-anchor="middle" font-family="Oswald,sans-serif" font-size="9" fill="rgba(255,255,255,.35)">${r.label}</text>
    <text x="60" y="155" text-anchor="middle" font-family="Oswald,sans-serif" font-size="9" fill="rgba(255,255,255,.3)">#${String(f.num).padStart(3, "0")}</text>
  </svg>`;
}

/* ── Render del álbum ── */
function figusRenderAlbum() {
  const cont = document.getElementById("album-grid");
  if (!cont) return;
  const d = figusCargar();
  const total = FIGUS.length;
  const tengo = FIGUS.filter(f => d.owned[f.num]).length;
  const repes = Object.values(d.owned).reduce((s, c) => s + Math.max(0, c - 1), 0);

  const prog = document.getElementById("album-progreso");
  if (prog) {
    prog.innerHTML =
      '<div class="album-prog-txt">' + tengo + ' / ' + total + ' figuritas' +
      (repes ? ' · <span class="album-repes">' + repes + ' repetidas</span>' : '') + '</div>' +
      '<div class="album-prog-bar"><div style="width:' + Math.round((tengo / total) * 100) + '%"></div></div>' +
      (tengo === total ? '<div class="album-completo">🏆 ¡ÁLBUM COMPLETO! Sos historia grande del truco.</div>' : '');
  }

  const btnSobre = document.getElementById("album-btn-sobre");
  if (btnSobre) {
    btnSobre.textContent = "✉️ ABRIR SOBRE (" + d.sobres + ")";
    btnSobre.disabled = d.sobres <= 0;
    btnSobre.classList.toggle("pulse", d.sobres > 0);
  }

  const btnCanje = document.getElementById("album-btn-canje");
  if (btnCanje) {
    const disp = figusRepesDisponibles(d);
    btnCanje.textContent = "🔄 CANJEAR REPETIDAS (" + Math.min(disp, FIGUS_CANJE_COSTO) + "/" + FIGUS_CANJE_COSTO + ") → +1 SOBRE";
    btnCanje.disabled = disp < FIGUS_CANJE_COSTO;
  }

  let html = "";
  ["leyenda", "oro", "plata", "comun"].forEach(rango => {
    const r = FIGUS_RANGOS[rango];
    const grupo = FIGUS.filter(f => f.rango === rango);
    const tengoG = grupo.filter(f => d.owned[f.num]).length;
    html += '<div class="album-seccion"><div class="album-sec-titulo" style="color:' + r.color + '">' +
      "★".repeat(r.estrellas) + " " + r.label + " · " + tengoG + "/" + grupo.length + "</div>" +
      '<div class="album-fila">';
    grupo.forEach(f => {
      const cant = d.owned[f.num] || 0;
      const foil = (cant && (f.rango === "leyenda" || f.rango === "oro")) ? " foil foil-" + f.rango : "";
      html += '<div class="album-figu' + (cant ? "" : " falta") + foil + '" title="' + f.nombre + '"' +
        (cant ? ' onclick="figusZoom(' + f.num + ')"' : "") + '>' +
        (cant ? figuSVG(f) : figuFaltanteSVG(f)) +
        (cant > 1 ? '<span class="album-cant">x' + cant + "</span>" : "") +
        "</div>";
    });
    html += "</div></div>";
  });
  cont.innerHTML = html;
}

/* ── Zoom de una figurita ── */
function figusZoom(num) {
  const f = FIGUS.find(x => x.num === num);
  if (!f) return;
  const d = figusCargar();
  const cant = d.owned[f.num] || 0;
  if (!cant) return;

  const overlay = document.getElementById("figu-zoom-overlay");
  const card    = document.getElementById("figu-zoom-card");
  const info    = document.getElementById("figu-zoom-info");
  if (!overlay || !card) return;

  card.innerHTML = figuSVG(f, { idSuffix: "-zoom" });
  card.className = "figu-zoom-card" + ((f.rango === "leyenda" || f.rango === "oro") ? " foil foil-" + f.rango : "");
  if (info) {
    const r = FIGUS_RANGOS[f.rango];
    const stats = figuStats(f);
    const statsHtml =
      '<div class="figu-zoom-rating" style="color:' + r.color + '">' + (f.rating || "") + ' <span>OVR</span></div>' +
      '<div class="figu-zoom-stats">' +
      stats.map(s =>
        '<div class="figu-stat"><span class="figu-stat-val">' + s.val + '</span>' +
        '<span class="figu-stat-lbl">' + s.label + '</span></div>'
      ).join("") +
      '</div>';
    const bio = FIGUS_BIO[f.num] ? '<div class="figu-zoom-bio">' + FIGUS_BIO[f.num] + '</div>' : "";
    info.innerHTML =
      '<div class="figu-zoom-nombre">' + f.nombre + '</div>' +
      '<div class="figu-zoom-meta">' + f.pos + ' · <span style="color:' + r.color + '">' + r.label + '</span> ' + "★".repeat(r.estrellas) + '</div>' +
      bio +
      statsHtml +
      (cant > 1 ? '<div class="figu-zoom-cant">Tenés ' + cant + ' copias</div>' : "");
  }

  overlay.classList.add("show");
  if (typeof playSound === "function") playSound("click");
}

function figusCerrarZoom() {
  const overlay = document.getElementById("figu-zoom-overlay");
  if (overlay) overlay.classList.remove("show");
}

/* ── Apertura de sobre con animación ── */
function figusAbrirSobreUI() {
  const figus = figusAbrirSobre();
  if (!figus) {
    if (typeof showToast === "function") showToast("No tenés sobres. ¡Ganá fechas de la liga para conseguir más!");
    return;
  }
  const overlay = document.getElementById("sobre-overlay");
  const zona    = document.getElementById("sobre-cartas");
  if (!overlay || !zona) { figusRenderAlbum(); return; }

  zona.innerHTML = "";
  figus.forEach((f, i) => {
    const esNueva = !!f._nueva;
    const wrap = document.createElement("div");
    wrap.className = "sobre-carta";
    wrap.style.animationDelay = (i * 0.35) + "s";
    wrap.innerHTML = figuSVG(f, { nueva: esNueva, repe: !esNueva });
    if (f.rango === "leyenda") wrap.classList.add("sobre-leyenda");
    if (f.rango === "leyenda" || f.rango === "oro") wrap.classList.add("foil", "foil-" + f.rango);
    zona.appendChild(wrap);
  });

  const sub = document.getElementById("sobre-sub");
  if (sub) {
    const hayLeyenda = figus.some(f => f.rango === "leyenda");
    sub.textContent = hayLeyenda ? "⭐ ¡SALIÓ UNA LEYENDA! ⭐" : "¡3 figuritas nuevas para el álbum!";
  }

  overlay.classList.add("show");
  if (typeof playSound === "function") {
    playSound(figus.some(f => f.rango === "leyenda" || f.rango === "oro") ? "win" : "punto");
  }

  // Avisos de premio por completar rango/álbum, después del overlay del sobre.
  if (figusUltimosPremios && figusUltimosPremios.length) {
    const premios = figusUltimosPremios.slice();
    figusUltimosPremios = [];
    premios.forEach((m, i) => setTimeout(() => {
      if (typeof showToast === "function") showToast(m, 3200);
      if (typeof playSound === "function") playSound("ovacion");
    }, 1700 + i * 1400));
  }

  figusRenderAlbum();
}

function figusCerrarSobre() {
  const overlay = document.getElementById("sobre-overlay");
  if (overlay) overlay.classList.remove("show");
}

/* ── Badge del FAB con cantidad de sobres pendientes ── */
function figusActualizarBadge() {
  const badge = document.getElementById("fab-sobres-badge");
  if (!badge) return;
  const d = figusCargar();
  badge.textContent = d.sobres;
  badge.style.display = d.sobres > 0 ? "flex" : "none";
}

/* ── Init ── */
document.addEventListener("DOMContentLoaded", () => {
  figusActualizarBadge();
  // Renderizar el álbum cada vez que se abre el modal
  // (antes wrappeaba window.openModal; ahora se suscribe al evento
  // 'modalAbierto' emitido desde openModal() en juego_ui.js).
  if (typeof onJuego === "function") {
    onJuego("modalAbierto", ({ id }) => {
      if (id === "album-modal") figusRenderAlbum();
      if (id === "liga-modal" && typeof ligaRenderFixture === "function") ligaRenderFixture();
    });
  }
});
