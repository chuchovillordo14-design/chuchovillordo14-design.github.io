/* ══════════════════════════════════════════════════════════
   MODO DT — LIGA DE TRUCO (formato fútbol argentino)
   - Elegís tu avatar de DT y tu club (equipos.js)
   - Cada partido vs la IA es una FECHA de la liga
   - Victoria: 3 pts · Derrota: 0 pts (en el truco no hay empate)
   - Los otros clubes (uno menos que el total de LIGA.equipos) juegan su
     fecha simulada (pueden empatar: 1 pt) — el fixture y la cantidad de
     fechas salen de LIGA.equipos.length (round-robin), no de un número fijo
   - El de más puntos sale CAMPEÓN
   No modifica el código existente del juego.
   ══════════════════════════════════════════════════════════ */

const AVATARES_DT = [
  {id:"h_river",    nombre:"Hincha de River",         img:"avatares/hincha_river.png"},
  {id:"h_boca",     nombre:"Hincha de Boca",          img:"avatares/hincha_boca.png"},
  {id:"h_indep",    nombre:"Hincha de Independiente", img:"avatares/hincha_independiente.png"},
  {id:"h_sanloren", nombre:"Hincha de San Lorenzo",   img:"avatares/hincha_sanlorenzo.png"},
  {id:"h_racing",   nombre:"Hincha de Racing",        img:"avatares/hincha_racing.png"},
  // Lote 2 — mismo orden que AVATARS (cartas.js): el click de la grilla DT
  // activa el item de la grilla original POR ÍNDICE.
  {id:"h_velez",    nombre:"Hincha de Vélez",         img:"avatares/hincha_velez.png"},
  {id:"h_estudi",   nombre:"Hincha de Estudiantes",   img:"avatares/hincha_estudiantes.png"},
  {id:"h_newells",  nombre:"Hincha de Newell's",      img:"avatares/hincha_newells.png"},
  {id:"h_central",  nombre:"Hincha de Central",       img:"avatares/hincha_central.png"},
  {id:"h_lanus",    nombre:"Hincha de Lanús",         img:"avatares/hincha_lanus.png"},
  {id:"h_banfield", nombre:"Hincha de Banfield",      img:"avatares/hincha_banfield.png"},
  {id:"h_platense", nombre:"Hincha de Platense",      img:"avatares/hincha_platense.png"},
  {id:"h_argjrs",   nombre:"Hincha de Argentinos",    img:"avatares/hincha_argentinos.png"},
  {id:"h_talleres", nombre:"Hincha de Talleres",      img:"avatares/hincha_talleres.png"},
  {id:"h_huracan",  nombre:"Hincha de Huracán",       img:"avatares/hincha_huracan.png"},
  {id:"h_instit",   nombre:"Hincha de Instituto",     img:"avatares/hincha_instituto.png"},
  {id:"h_belgrano", nombre:"Hincha de Belgrano",      img:"avatares/hincha_belgrano.png"},
  {id:"h_atucuman", nombre:"Hincha del Decano",       img:"avatares/hincha_atucuman.png"},
  {id:"h_defensa",  nombre:"Hincha del Halcón",       img:"avatares/hincha_defensa.png"},
  {id:"h_gimnasia", nombre:"Hincha del Lobo",         img:"avatares/hincha_gimnasia.png"},
  // Clásico santafesino (1 ago 2026) — al FINAL, mismo motivo que cartas.js.
  {id:"h_union",    nombre:"Hincha de Unión",         img:"avatares/hincha_union.png"},
  {id:"h_colon",    nombre:"Hincha de Colón",         img:"avatares/hincha_colon.png"},
  // ── HINCHAS EUROPEOS (LaLiga + Premier). AL FINAL a proposito:
  //    AVATARS y AVATARES_DT se traducen POR INDICE.
  {id:"e_realmadrid", nombre:"Hincha de Real Madrid", img:"avatares/hincha_realmadrid.png"},
  {id:"e_barcelona", nombre:"Hincha de FC Barcelona", img:"avatares/hincha_barcelona.png"},
  {id:"e_atleticomadrid", nombre:"Hincha de Atlético de Madrid", img:"avatares/hincha_atleticomadrid.png"},
  {id:"e_arsenal", nombre:"Hincha de Arsenal", img:"avatares/hincha_arsenal.png"},
  {id:"e_chelsea", nombre:"Hincha de Chelsea", img:"avatares/hincha_chelsea.png"},
  {id:"e_liverpool", nombre:"Hincha de Liverpool", img:"avatares/hincha_liverpool.png"},
  {id:"e_mancity", nombre:"Hincha de Manchester City", img:"avatares/hincha_mancity.png"},
  {id:"e_manunited", nombre:"Hincha de Manchester United", img:"avatares/hincha_manunited.png"},
  {id:"e_newcastle", nombre:"Hincha de Newcastle United", img:"avatares/hincha_newcastle.png"},
  {id:"e_tottenham", nombre:"Hincha de Tottenham Hotspur", img:"avatares/hincha_tottenham.png"},
  // ── HINCHAS EUROPEOS (LaLiga + Premier). AL FINAL a proposito:
  //    AVATARS y AVATARES_DT se traducen POR INDICE.
  {id:"e_sevilla", nombre:"Hincha de Sevilla FC", img:"avatares/hincha_sevilla.png"},
  {id:"e_valencia", nombre:"Hincha de Valencia CF", img:"avatares/hincha_valencia.png"},
  {id:"e_villarreal", nombre:"Hincha de Villarreal CF", img:"avatares/hincha_villarreal.png"},
  {id:"e_realbetis", nombre:"Hincha de Real Betis", img:"avatares/hincha_realbetis.png"},
  {id:"e_realsociedad", nombre:"Hincha de Real Sociedad", img:"avatares/hincha_realsociedad.png"},
  {id:"e_athleticclub", nombre:"Hincha de Athletic Club", img:"avatares/hincha_athleticclub.png"},
  {id:"e_espanyol", nombre:"Hincha de RCD Espanyol", img:"avatares/hincha_espanyol.png"},
  {id:"e_celta", nombre:"Hincha de Celta de Vigo", img:"avatares/hincha_celta.png"},
  {id:"e_deportivo", nombre:"Hincha de Deportivo La Coruña", img:"avatares/hincha_deportivo.png"},
  {id:"e_elche", nombre:"Hincha de Elche CF", img:"avatares/hincha_elche.png"},
  {id:"e_getafe", nombre:"Hincha de Getafe CF", img:"avatares/hincha_getafe.png"},
  {id:"e_oviedo", nombre:"Hincha de Real Oviedo", img:"avatares/hincha_oviedo.png"},
  {id:"e_osasuna", nombre:"Hincha de CA Osasuna", img:"avatares/hincha_osasuna.png"},
  {id:"e_mallorca", nombre:"Hincha de RCD Mallorca", img:"avatares/hincha_mallorca.png"},
  {id:"e_levante", nombre:"Hincha de Levante UD", img:"avatares/hincha_levante.png"},
  {id:"e_girona", nombre:"Hincha de Girona FC", img:"avatares/hincha_girona.png"},
  {id:"e_rayovallecano", nombre:"Hincha de Rayo Vallecano", img:"avatares/hincha_rayovallecano.png"},
  {id:"e_astonvilla", nombre:"Hincha de Aston Villa", img:"avatares/hincha_astonvilla.png"},
  {id:"e_bournemouth", nombre:"Hincha de Bournemouth", img:"avatares/hincha_bournemouth.png"},
  {id:"e_brentford", nombre:"Hincha de Brentford", img:"avatares/hincha_brentford.png"},
  {id:"e_brighton", nombre:"Hincha de Brighton", img:"avatares/hincha_brighton.png"},
  {id:"e_coventry", nombre:"Hincha de Coventry City", img:"avatares/hincha_coventry.png"},
  {id:"e_crystalpalace", nombre:"Hincha de Crystal Palace", img:"avatares/hincha_crystalpalace.png"},
  {id:"e_everton", nombre:"Hincha de Everton", img:"avatares/hincha_everton.png"},
  {id:"e_fulham", nombre:"Hincha de Fulham", img:"avatares/hincha_fulham.png"},
  {id:"e_hull", nombre:"Hincha de Hull City", img:"avatares/hincha_hull.png"},
  {id:"e_ipswich", nombre:"Hincha de Ipswich Town", img:"avatares/hincha_ipswich.png"},
  {id:"e_leeds", nombre:"Hincha de Leeds United", img:"avatares/hincha_leeds.png"},
  {id:"e_nottmforest", nombre:"Hincha de Nottingham Forest", img:"avatares/hincha_nottmforest.png"},
  {id:"e_sunderland", nombre:"Hincha de Sunderland", img:"avatares/hincha_sunderland.png"}
];

const DT_KEY = "truco_dt_avatar";
let dtAvatarSel = null;
let ligaRegistrado = false; // evita registrar el mismo partido dos veces

/* ── Clave de almacenamiento por liga (cada liga tiene su propia tabla) ── */
function ligaKeyActual() {
  const id = (typeof LIGA !== "undefined" && LIGA && LIGA.id) ? LIGA.id : "lpa";
  return id === "lpa" ? "truco_liga" : "truco_liga_" + id;
}

/* ── FIXTURE — todos contra todos (algoritmo del círculo / Berger) ──
   Con n equipos (par) → n-1 fechas, n/2 partidos por fecha.
   Si la liga tiene un número impar de equipos se agrega un "BYE"
   virtual: en cada fecha el equipo emparejado con el BYE descansa
   y ese partido se descarta (así toda liga, par o impar, arma un
   fixture todos-contra-todos válido).
   Se genera UNA vez al crear el torneo y queda guardado en la liga. */
function generarFixture() {
  let ids = mezclarIds(LIGA.equipos.map(e => e.id));
  if (ids.length % 2 !== 0) ids.push("__BYE__");
  const n = ids.length;
  const fechas = [];
  const fijo = ids[0];
  let rueda = ids.slice(1);        // n-1 que rotan

  for (let f = 0; f < n - 1; f++) {
    const izquierda = [fijo].concat(rueda.slice(0, n / 2 - 1));
    const derecha   = rueda.slice(n / 2 - 1).reverse();
    const partidos  = [];
    for (let i = 0; i < n / 2; i++) {
      const par = [izquierda[i], derecha[i]];
      if (par[0] !== "__BYE__" && par[1] !== "__BYE__") partidos.push(par);
    }
    fechas.push(partidos);
    rueda.unshift(rueda.pop());    // rotar
  }
  return fechas;
}

function mezclarIds(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/* ── Fuerza de un equipo de la liga por su id (fallback 60 = promedio) ── */
function _ligaFuerza(id) {
  const e = LIGA.equipos.find(x => x.id === id);
  return (e && typeof e.fuerza === "number") ? e.fuerza : 60;
}

/* Estas tres ahora delegan en SIM (sim.js), la fuente única de la
   simulación deportiva. Se conservan los nombres por compatibilidad. */
function _ligaProbGana(fA, fB)   { return SIM.probGana(fA, fB); }
function _ligaScorePerdedor(pA)  { return SIM.scorePerdedor(pA); }
function _golesDesdeTruco(L)     { return SIM.golesFutbol(L); }

/* ── Estado de la liga ── */
function ligaNueva() {
  const tabla = {};
  LIGA.equipos.forEach(e => {
    tabla[e.id] = { pj:0, pg:0, db:0, pp:0, pts:0, gf:0, gc:0 };
  });
  return {
    fecha: 0,
    tabla: tabla,
    campeon: null,
    fixture: generarFixture(),
    resultados: [],        // por fecha: [{a, b, w (id ganador), db (perdió en buenas)}]
    premiosEntregados: false
  };
}

function ligaCargar() {
  try {
    const raw = localStorage.getItem(ligaKeyActual());
    if (raw) {
      const l = JSON.parse(raw);
      // La tabla tiene que ser un OBJETO {id: fila}. Con `l.tabla` a secas
      // pasaban también un array o un string: un array hace que JSON.stringify
      // descarte las filas al re-guardar (y el fixture se re-sortee en cada
      // carga), y un string reventaba en `tj.pj++` con un TypeError. En
      // cualquiera de esos casos el torneo no es recuperable: se arranca uno
      // nuevo, que es lo que hace el camino de abajo.
      if (l && l.tabla && typeof l.tabla === "object" && !Array.isArray(l.tabla)) {
        // Migrar datos viejos: la columna "pe" pasa a ser "db"
        Object.values(l.tabla).forEach(t => {
          if (t.db === undefined) { t.db = t.pe || 0; delete t.pe; }
          // Goles a favor/en contra: nuevos en esta versión
          if (t.gf === undefined) t.gf = 0;
          if (t.gc === undefined) t.gc = 0;
        });
        // Migrar torneos viejos sin fixture: generarlo respetando la fecha actual
        if (!l.fixture)    l.fixture = generarFixture();
        // El PLANTEL de la liga puede haber cambiado desde que se guardó el
        // torneo: desde el 7 ago 2026, fundar un club en el Modo Carrera lo
        // mete como un equipo más de su liga. Sin migrar esto:
        //   · ligaOrdenar() hacía Object.assign(fila, undefined) y la tabla
        //     mostraba "undefined" en cinco columnas, ordenada en cualquier
        //     lado (todas las restas daban NaN);
        //   · y como el fixture guardado tampoco lo contenía, un jugador que
        //     eligiera SU club quedaba con "😴 esta fecha tu equipo descansa"
        //     en todas las fechas: el torneo no avanzaba nunca.
        // ⚠️ La migración TIENE que persistirse acá mismo. generarFixture()
        // SORTEA, y cada consumidor (tabla, fixture, ligaRivalProgramado,
        // ligaRegistrarPartido) llama a ligaCargar() por su cuenta: sin
        // guardar, cada pantalla se llevaba un sorteo distinto — el
        // encabezado decía una fecha, el fixture mostraba otro rival y al
        // jugar se acreditaba contra un tercero. Es exactamente el bug que el
        // comentario de más abajo dice haber arreglado al crear la liga.
        // ⚠️ SOLO con el torneo SIN EMPEZAR. Regenerar el fixture a mitad de
        // camino es destructivo: `l.fecha` se conserva apuntando a un sorteo
        // nuevo, así que los resultados ya jugados dejan de corresponder a
        // ningún partido (la pestaña Fixture mostraba 10 fechas marcadas
        // "✓ Jugada" con "vs" en vez del marcador), rivales ya jugados
        // vuelven a aparecer y otros no se juegan nunca. Media temporada se
        // evaporaba a la vista del jugador.
        // Con el torneo ya arrancado no se toca NADA: el club recién fundado
        // simplemente no juega ESTE torneo —entró tarde, como en la vida
        // real— y aparece en la tabla en 0 gracias a los ceros defensivos de
        // ligaOrdenar(). El torneo siguiente ya lo incluye.
        const faltantes = LIGA.equipos.filter(e => !l.tabla[e.id]);
        if (faltantes.length && !l.fecha && !l.campeon) {
          faltantes.forEach(e => { l.tabla[e.id] = { pj:0, pg:0, db:0, pp:0, pts:0, gf:0, gc:0 }; });
          l.fixture = generarFixture();   // el viejo no incluye a los nuevos
          if (!l.resultados) l.resultados = [];
          if (l.premiosEntregados === undefined) l.premiosEntregados = false;
          try { ligaGuardar(l); } catch (_) {}
          return l;
        }
        if (!l.resultados) l.resultados = [];
        if (l.premiosEntregados === undefined) l.premiosEntregados = false;
        return l;
      }
    }
  } catch (e) {}
  // Persistir la liga recien creada: ligaNueva() sortea el fixture, y como
  // cada consumidor llama a ligaCargar() por su cuenta, sin guardar salia un
  // fixture distinto por pantalla (la tabla decia un rival, el fixture otro,
  // y al jugar se acreditaba contra un tercero).
  const nueva = ligaNueva();
  try { ligaGuardar(nueva); } catch (_) {}
  return nueva;
}

/* ── Rival programado por el fixture para la próxima fecha ── */
function ligaRivalProgramado() {
  if (!equipoSel) return null;
  const liga = ligaCargar();
  if (liga.campeon) return null;
  const fecha = liga.fixture && liga.fixture[liga.fecha];
  if (!fecha) return null;
  const par = fecha.find(p => p[0] === equipoSel.id || p[1] === equipoSel.id);
  if (!par) return null;
  const ridval = par[0] === equipoSel.id ? par[1] : par[0];
  return LIGA.equipos.find(e => e.id === ridval) || null;
}

function ligaGuardar(l) { lsSet(ligaKeyActual(), JSON.stringify(l)); }

function ligaResetear() {
  ligaGuardar(ligaNueva());
  localStorage.removeItem(_reglasKeyLiga()); // que se muestren las reglas del nuevo torneo
  ligaRenderTabla();
  ligaRenderFixture();
  if (typeof closeModal === "function") { try { closeModal("liga-modal"); } catch (e) {} }
  mostrarReglasLiga(true);
}

/* ── Reglas de la liga: se muestran al arrancar cada torneo ── */
const REGLAS_KEY = "truco_liga_reglas_vistas";
// Namespaceada por liga: con la clave global, empezar un torneo en otra liga
// (Brasil, LaLiga...) nunca volvia a mostrar las reglas.
function _reglasKeyLiga() {
  return REGLAS_KEY + "_" + ((typeof LIGA !== "undefined" && LIGA && LIGA.id) ? LIGA.id : "lpa");
}

function mostrarReglasLiga(forzar) {
  // Por liga, no global: la clave suelta hacia que empezar un torneo en otra
  // liga (Brasil, LaLiga...) nunca volviera a mostrar las reglas.
  const key = _reglasKeyLiga();
  if (!forzar && localStorage.getItem(key)) return;
  lsSet(key, "1");
  _reglasLigaNumeros();
  if (typeof openModal === "function") {
    try { openModal("liga-reglas-modal"); } catch (e) {}
  }
}

/* Los números de las reglas salen de la liga REAL. Estaban escritos a mano
   ("20 clubes, 19 fechas") y no coincidían con ninguna liga del juego —la
   Liga Profesional tiene 22— y menos desde que fundar un club en el Modo
   Carrera suma un equipo más a su liga. El modal se abre solo la primera vez
   que entrás al Torneo de Liga, así que era lo primero que leía el jugador. */
function _reglasLigaNumeros() {
  const n = (typeof LIGA !== "undefined" && LIGA && LIGA.equipos) ? LIGA.equipos.length : 0;
  if (!n) return;
  // Con cantidad impar, generarFixture() agrega un BYE: hay n fechas y en
  // cada una descansa uno. Con cantidad par, n-1.
  const fechas = n % 2 === 0 ? n - 1 : n;
  const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = String(v); };
  set("lr-clubes", n);
  set("lr-fechas", fechas);
  set("lr-fechas2", fechas);
  // Los que juegan entre ellos mientras jugás vos: todos menos vos y tu rival
  // (y menos el que descansa, si la liga es impar y hay BYE).
  set("lr-otros", Math.max(0, n % 2 === 0 ? n - 2 : n - 3));
  // La fecha de descanso solo existe con cantidad impar de equipos.
  set("lr-clubes2", n);
  const item = document.getElementById("lr-descanso-item");
  if (item) item.style.display = (n % 2 === 1) ? "" : "none";
}

/* ── Registrar resultado del jugador + simular la fecha ──
   gano: true/false · ptsJ: puntos del jugador · limite: 30 o 15
   Derrota en las buenas (ptsJ >= mitad del límite): suma 1 punto */
function ligaRegistrarPartido(gano, ptsJ, limite, ptsR) {
  if (!equipoSel) return;
  const liga = ligaCargar();
  if (liga.campeon) return; // torneo terminado, esperar reset

  const fechaIdx = liga.fecha;          // fecha que se está jugando (0-index)
  const fixture  = liga.fixture[fechaIdx] || [];
  // Ligas con cantidad IMPAR de equipos (Colombia 17, Ecuador 15) tienen
  // fechas de descanso: el club del jugador no aparece en el fixture. Antes
  // se registraba igual contra el rival de la mesa Y el bucle de abajo
  // simulaba tambien el partido de ese rival, dejandolo con dos partidos en
  // la misma fecha y la tabla corrupta para el resto del torneo.
  // ⚠️ La fecha de descanso TIENE que avanzar igual (7 ago 2026). Antes se
  // salía de la función sin tocar `liga.fecha`, y como ninguna otra cosa la
  // mueve, el torneo se congelaba ahí PARA SIEMPRE: se jugaban partidos, el
  // modal seguía diciendo la misma fecha y no había manera de terminarlo
  // salvo reiniciar (y volvía a trabarse). Nunca se había notado porque las 5
  // ligas jugables tenían cantidad PAR de equipos y el BYE no se activaba
  // jamás — hasta que fundar un club dejó la Liga Profesional en 23 y todo
  // jugador que fundara uno se trababa dentro de su primera temporada.
  // Ahora el descanso sigue el camino normal: el partido del jugador no se
  // registra (no está en el fixture), pero los demás juegan su fecha, se
  // guarda y el torneo puede terminar.
  const esDescanso = !fixture.some(p => p[0] === equipoSel.id || p[1] === equipoSel.id);
  liga.fecha++;

  const enBuenas = !esDescanso && !gano && typeof ptsJ === "number"
                   && typeof limite === "number" && ptsJ >= limite / 2;

  // Partido del jugador: el rival es el programado por el fixture
  const idJ = equipoSel.id;
  let idR = (equipoRival && equipoRival.id !== idJ) ? equipoRival.id : null;
  const parJugador = fixture.find(p => p[0] === idJ || p[1] === idJ);
  if (parJugador) idR = parJugador[0] === idJ ? parJugador[1] : parJugador[0];

  const resultadosFecha = [];

  if (!esDescanso) {
    // Marcador "de fútbol" del partido del jugador, a partir del margen de
    // truco. Normalizamos a escala 0-30 (en partido chico, limite=15, x2).
    const factor30   = limite ? 30 / limite : 1;
    const perdedorPts = gano ? (typeof ptsR === "number" ? ptsR : 0) : ptsJ;
    const L30        = Math.round(perdedorPts * factor30);
    const [gG, gP]   = _golesDesdeTruco(L30);
    const golesJ     = gano ? gG : gP;
    const golesR     = gano ? gP : gG;

    const tj = liga.tabla[idJ];
    tj.pj++; tj.gf += golesJ; tj.gc += golesR;
    if (gano)          { tj.pg++; tj.pts += 3; }
    else if (enBuenas) { tj.db++; tj.pts += 1; }
    else               { tj.pp++; }
    if (idR && liga.tabla[idR]) {
      const tr = liga.tabla[idR];
      tr.pj++; tr.gf += golesR; tr.gc += golesJ;
      if (!gano) { tr.pg++; tr.pts += 3; }
      else {
        // El rival TAMBIÉN puede perder "en las buenas": si llegó a la mitad
        // del tanteador se lleva su punto, igual que cualquier equipo de la
        // fecha simulada (ver `db = perdPts >= 15` más abajo). Antes esta
        // línea era `gano ? tr.pp++ : ...` a secas y el punto no se lo daba
        // NUNCA — 0 de 300 veces, medido — mientras los perdedores simulados
        // lo cobraban 10 de 10. La regla está anunciada en el modal de
        // reglas como regla de la liga, sin excepciones.
        const rivalEnBuenas = typeof ptsR === "number" && typeof limite === "number"
                              && ptsR >= limite / 2;
        if (rivalEnBuenas) { tr.db++; tr.pts += 1; } else { tr.pp++; }
      }
    }
    resultadosFecha.push({
      a: idJ, b: idR, w: gano ? idJ : idR,
      db: enBuenas, ga: golesJ, gb: golesR, jugador: true
    });
  }
  // (El aviso del descanso se arma abajo, junto con el resto de los avisos,
  // para que no salgan dos toasts contradictorios.)

  // Fecha simulada: el resto de los partidos del fixture
  // (no hay empates: el perdedor puede caer en las buenas y sumar 1).
  // El resultado se decide PONDERANDO la fuerza de cada equipo, no a
  // cara o cruz: los grandes ganan más seguido, pero siempre hay chance
  // de batacazo. Y cuanto más parejo el partido, más probable que el
  // perdedor caiga "en las buenas" (partido peleado).
  fixture.forEach(par => {
    if (par[0] === idJ || par[1] === idJ) return; // ya registrado
    const pA    = _ligaProbGana(_ligaFuerza(par[0]), _ligaFuerza(par[1]));
    const gIdx  = Math.random() < pA ? 0 : 1;
    const probG = gIdx === 0 ? pA : 1 - pA;        // prob. del que efectivamente ganó
    const g = liga.tabla[par[gIdx]], p = liga.tabla[par[1 - gIdx]];
    const perdPts = _ligaScorePerdedor(probG);     // puntos de truco del perdedor (0-29)
    const [gG, gP] = _golesDesdeTruco(perdPts);
    const db = perdPts >= 15;                       // perdió en las buenas
    g.pj++; p.pj++;
    g.pg++; g.pts += 3; g.gf += gG; g.gc += gP;
    if (db) { p.db++; p.pts += 1; }
    else    { p.pp++; }
    p.gf += gP; p.gc += gG;
    // ga/gb se guardan en el orden a=par[0], b=par[1]
    const ga = gIdx === 0 ? gG : gP;
    const gb = gIdx === 0 ? gP : gG;
    resultadosFecha.push({ a: par[0], b: par[1], w: par[gIdx], db, ga, gb });
  });

  liga.resultados[fechaIdx] = resultadosFecha;

  // ── PREMIOS POR FECHA: sobres de figuritas ────────────────
  // Victoria: 1 sobre · Derrota en las buenas: 50% de chances de 1 sobre
  let sobresGanados = 0;
  // En la fecha de descanso el partido no cuenta para la tabla: tampoco paga
  // sobres, o sería la forma más barata de farmearlos.
  if (typeof figusOtorgarSobres === "function" && !esDescanso) {
    if (gano) sobresGanados = 1;
    else if (enBuenas && Math.random() < 0.5) sobresGanados = 1;
    if (sobresGanados > 0) figusOtorgarSobres(sobresGanados);
  }

  // ¿Terminó el torneo?
  let mensajeCampeon = null;
  if (liga.fecha >= liga.fixture.length) {
    const orden = ligaOrdenar(liga);
    liga.campeon = orden[0].id;

    // ── PREMIOS DE FIN DE TORNEO según posición final ────────
    // El guard de idempotencia es `premiosEntregados` SOLO. Antes también
    // pedía que existiera figusOtorgarSobres, así que todo lo que colgara de
    // acá quedaba atado al módulo de figuritas: si no estaba cargado, no se
    // entregaba nada Y ADEMÁS no se marcaba como entregado.
    if (!liga.premiosEntregados) {
      liga.premiosEntregados = true;
      const pos = orden.findIndex(t => t.id === idJ) + 1;

      if (typeof figusOtorgarSobres === "function") {
        if (pos === 1) figusOtorgarSobres(5, true); // campeón: 5 sobres + Leyenda
        else if (pos <= 4) figusOtorgarSobres(2);
        else figusOtorgarSobres(1);
      }

      if (pos === 1) {
        mensajeCampeon = "🏆 ¡CAMPEÓN! Premio: 5 sobres de figuritas + 1 LEYENDA garantizada";
        // La Liga es EL torneo del juego y no contaba como tal: ni sumaba el
        // récord "Torneos Ganados" ni pagaba el bonus del sponsor TV Deportes
        // ("+100 PT por ganar torneos", 500 PT de contrato). Se conectó el
        // 2-ago junto con los otros tres torneos.
        if (typeof window.sumarRecord === "function") window.sumarRecord("torneo_wins", 1, "Liga");
        if (typeof window.sponsorPagarBonus === "function") window.sponsorPagarBonus("torneo");
      } else if (pos <= 4) {
        mensajeCampeon = `🥈 Terminaste ${pos}º — Premio: 2 sobres de figuritas`;
      } else {
        mensajeCampeon = `Terminaste ${pos}º — Premio consuelo: 1 sobre de figuritas`;
      }
    }
  }

  ligaGuardar(liga);

  // Aviso
  const eqR = idR ? LIGA.equipos.find(e => e.id === idR) : null;
  const rivalNom = eqR ? eqR.nombre : "tu rival";
  let msg;
  if (esDescanso) {
    // Sin esto el aviso se armaba igual y MENTÍA: decía "¡le ganaste a River
    // Plate! +3 pts" en una fecha donde no se registró nada (idR caía al
    // fallback de equipoRival, que ni siquiera está en el fixture). Con la
    // liga en 23 —que es lo que queda al fundar un club— cada equipo descansa
    // una vez por torneo, así que le pasaba a todos.
    msg = "😴 Fecha " + liga.fecha + ": tu equipo descansó. El resto jugó su fecha.";
  }
  else if (gano)     msg = "⚽ Fecha " + liga.fecha + ": ¡le ganaste a " + rivalNom + "! +3 pts";
  else if (enBuenas) msg = "⚽ Fecha " + liga.fecha + ": perdiste con " + rivalNom + " en las buenas. +1 pt";
  else               msg = "⚽ Fecha " + liga.fecha + ": perdiste con " + rivalNom + " en las malas. 0 pts";
  if (typeof showToast === "function") {
    try {
      showToast(msg);
      if (sobresGanados > 0) showToast("✉️ ¡Ganaste " + sobresGanados + " sobre de figuritas! Abrilo desde el álbum 📒");
      if (mensajeCampeon)    showToast(mensajeCampeon, 4500);
    } catch (e) {}
  }
  setTimeout(() => openModal && openModal("liga-modal"), 1200);
  ligaRenderTabla();
  if (typeof ligaRenderFixture === "function") ligaRenderFixture();
}

function ligaOrdenar(liga) {
  const dg = t => (t.gf || 0) - (t.gc || 0);
  // Los ceros del medio son un piso defensivo: si un equipo de LIGA no está
  // en la tabla guardada (ligaCargar lo migra, pero por si alguien llega acá
  // con una tabla vieja en memoria), la fila sale en 0 y no con `undefined`
  // en cada columna — que además envenenaba el orden con NaN.
  return LIGA.equipos
    .map(e => Object.assign(
      { id: e.id, nombre: e.nombre, escudo: e.escudo },
      { pj:0, pg:0, db:0, pp:0, pts:0, gf:0, gc:0 },
      liga.tabla[e.id]))
    .sort((a, b) =>
      b.pts - a.pts ||
      dg(b) - dg(a) ||              // diferencia de gol
      (b.gf || 0) - (a.gf || 0) || // más goles a favor
      b.pg - a.pg ||
      a.nombre.localeCompare(b.nombre));
}

/* ── Tabla de posiciones ── */
function ligaRenderTabla() {
  const cont = document.getElementById("liga-tabla");
  if (!cont) return;
  const liga = ligaCargar();
  const orden = ligaOrdenar(liga);

  const tituloEl = document.getElementById("liga-modal-title");
  if (tituloEl) tituloEl.textContent = "🏆 " + LIGA.nombre + " de Truco";

  const fechaLbl = document.getElementById("liga-fecha-lbl");
  if (fechaLbl) {
    // `liga.fecha` es el índice 0-based de la PRÓXIMA fecha, así que mostrarlo
    // crudo arrancaba en "Fecha 0 de 21" y después iba siempre una atrás: el
    // encabezado decía "Fecha 1" mientras la pestaña Fixture ya marcaba la 1
    // como jugada y la 2 en juego. Se muestra la que se está por jugar.
    fechaLbl.textContent = liga.campeon
      ? "TORNEO FINALIZADO"
      : "Fecha " + Math.min(liga.fecha + 1, liga.fixture.length) + " de " + liga.fixture.length;
  }

  let html = '<table class="liga-t"><thead><tr>' +
    "<th>#</th><th class='tl'>Club</th><th>PJ</th><th>PG</th><th>DB</th><th>PP</th><th>DG</th><th>Pts</th>" +
    "</tr></thead><tbody>";
  orden.forEach((t, i) => {
    const mio = equipoSel && t.id === equipoSel.id;
    const pos = i + 1;
    const zona = pos === 1 ? "z1" : (pos <= 4 ? "z4" : (pos >= orden.length - 1 ? "zd" : ""));
    const dg = (t.gf || 0) - (t.gc || 0);
    const dgTxt = (dg > 0 ? "+" : "") + dg;
    html += '<tr class="' + (mio ? "mio " : "") + zona + '">' +
      "<td>" + pos + "</td>" +
      '<td class="tl"><img src="' + escudoDe(t) + '" class="liga-esc" onerror="escudoFallback(this)">' + t.nombre + (mio ? " ★" : "") + "</td>" +
      "<td>" + t.pj + "</td><td>" + t.pg + "</td><td>" + t.db + "</td><td>" + t.pp + "</td>" +
      "<td>" + dgTxt + "</td>" +
      "<td><b>" + t.pts + "</b></td></tr>";
  });
  html += "</tbody></table>";

  if (liga.campeon) {
    const c = LIGA.equipos.find(e => e.id === liga.campeon);
    const esMio = equipoSel && liga.campeon === equipoSel.id;
    html = '<div class="liga-campeon">🏆 CAMPEÓN: ' + c.nombre +
      (esMio ? " — ¡SALISTE CAMPEÓN, DT!" : "") + "</div>" + html;
  } else if (equipoSel) {
    // Próximo rival según el fixture
    const prox = ligaRivalProgramado();
    if (prox) {
      html = '<div class="liga-proximo">📅 Próxima fecha: <b>' + equipoSel.nombre +
        '</b> vs <b>' + prox.nombre + '</b></div>' + html;
    }
  }
  cont.innerHTML = html;
}

/* ── FIXTURE — vista de todas las fechas ── */
function ligaRenderFixture() {
  const cont = document.getElementById("liga-fixture");
  if (!cont) return;
  const liga = ligaCargar();
  if (!liga.fixture) { cont.innerHTML = ""; return; }

  const nom = id => {
    const e = LIGA.equipos.find(x => x.id === id);
    return e ? e.nombre : id;
  };
  const esc = id => {
    const e = LIGA.equipos.find(x => x.id === id);
    return '<img src="' + escudoDe(e) + '" class="liga-esc" onerror="escudoFallback(this)">';
  };

  let html = "";
  liga.fixture.forEach((fecha, fi) => {
    const jugada  = fi < liga.fecha;
    const actual  = fi === liga.fecha && !liga.campeon;
    const abierta = actual; // la fecha actual arranca desplegada
    const res     = liga.resultados[fi] || [];

    html += '<div class="fx-fecha' + (abierta ? " open" : "") + (actual ? " actual" : "") + '">' +
      '<div class="fx-hdr" onclick="this.parentNode.classList.toggle(\'open\')">' +
        '<span class="fx-num">FECHA ' + (fi + 1) + '</span>' +
        '<span class="fx-estado">' + (jugada ? "✓ Jugada" : (actual ? "▶ En juego" : "Pendiente")) + '</span>' +
        '<span class="fx-arrow">▾</span>' +
      '</div><div class="fx-partidos">';

    fecha.forEach(par => {
      const mio = equipoSel && (par[0] === equipoSel.id || par[1] === equipoSel.id);
      const r = res.find(x => (x.a === par[0] && x.b === par[1]) || (x.a === par[1] && x.b === par[0]));
      let marcador = "vs";
      let claseA = "", claseB = "";
      if (r && r.w) {
        // Marcador real guardado (ga/gb por equipo a/b). Fallback al viejo
        // esquema 3-0/3-1 para partidos jugados antes de esta versión.
        const tieneGoles = typeof r.ga === "number" && typeof r.gb === "number";
        // Orientar los goles al orden del fixture (par[0] – par[1]), porque
        // r.a/r.b pueden venir invertidos respecto de par.
        let g0, g1;
        if (tieneGoles) {
          if (r.a === par[0]) { g0 = r.ga; g1 = r.gb; }
          else                { g0 = r.gb; g1 = r.ga; }
        }
        if (r.w === par[0]) {
          claseA = "fx-gano"; claseB = "fx-perdio";
          marcador = tieneGoles ? (g0 + " – " + g1) : (r.db ? "3 – 1" : "3 – 0");
        } else {
          claseB = "fx-gano"; claseA = "fx-perdio";
          marcador = tieneGoles ? (g0 + " – " + g1) : (r.db ? "1 – 3" : "0 – 3");
        }
      }
      html += '<div class="fx-partido' + (mio ? " mio" : "") + '">' +
        '<span class="fx-eq ' + claseA + '">' + esc(par[0]) + nom(par[0]) + '</span>' +
        '<span class="fx-marcador">' + marcador + '</span>' +
        '<span class="fx-eq fx-der ' + claseB + '">' + nom(par[1]) + esc(par[1]) + '</span>' +
      '</div>';
    });
    html += "</div></div>";
  });
  cont.innerHTML = html;
}

/* ── Tabs del modal de liga (Tabla / Fixture) ── */
function ligaSetTab(tab) {
  const tabla   = document.getElementById("liga-tab-tabla");
  const fixture = document.getElementById("liga-tab-fixture");
  const btnT    = document.getElementById("liga-btn-tabla");
  const btnF    = document.getElementById("liga-btn-fixture");
  if (!tabla || !fixture) return;
  const esTabla = tab === "tabla";
  tabla.style.display   = esTabla ? "block" : "none";
  fixture.style.display = esTabla ? "none"  : "block";
  if (btnT) btnT.classList.toggle("active", esTabla);
  if (btnF) btnF.classList.toggle("active", !esTabla);
  if (!esTabla) ligaRenderFixture();
}

/* ── Avatares de DT en el registro ── */
function renderAvataresDT() {
  const gridOriginal = document.getElementById("avatar-grid");
  if (!gridOriginal) return;

  // Ocultar la grilla original pero mantenerla funcional para el juego
  gridOriginal.style.display = "none";

  let cont = document.getElementById("dt-avatar-grid");
  if (!cont) {
    cont = document.createElement("div");
    cont.id = "dt-avatar-grid";
    gridOriginal.parentNode.insertBefore(cont, gridOriginal);
  }
  cont.innerHTML = "";

  const guardado = localStorage.getItem(DT_KEY);

  AVATARES_DT.forEach((a, idx) => {
    const card = document.createElement("div");
    card.className = "dt-card";
    card.innerHTML = '<img src="' + a.img + '" alt="' + a.nombre + '">' +
                     '<span>' + a.nombre + '</span>';
    card.onclick = () => {
      dtAvatarSel = a;
      lsSet(DT_KEY, a.id);
      document.querySelectorAll(".dt-card").forEach(c => c.classList.remove("activo"));
      card.classList.add("activo");
      // Activar también un avatar de la grilla original (validación del juego)
      const orig = gridOriginal.children[idx] || gridOriginal.children[0];
      if (orig) orig.click();
    };
    cont.appendChild(card);
    if (guardado === a.id) card.click();
  });
}

function aplicarAvatarDT() {
  if (!dtAvatarSel) return;
  const img = document.getElementById("player-avatar-sm");
  if (img) img.src = dtAvatarSel.img;
}

/* ── Detección de fin de partido ──
   Antes se observaba el texto del marcador lateral (#side-pts-j/#side-pts-r)
   con un MutationObserver: frágil, depende del DOM/render y de que el
   marcador esté visible. Después se pasó a "wrappear" repartirNuevaMano /
   _iniciarPartida / reiniciarPartida, pero ese patrón ya lo usan varios
   módulos (motor_online.js, figuritas.js) y se acumula riesgo de que un
   wrapper se pise con otro. Ahora nos suscribimos a los eventos del motor
   (juego.js: onJuego/_emitJuego), que es la fuente de verdad:
   - 'finDePartido' se emite desde repartirNuevaMano() cuando S.juegoTerminado
     pasa a true, con los puntos finales → ahí registramos la fecha de la liga.
   - 'nuevoPartido' se emite desde _iniciarPartida()/reiniciarPartida() →
     ahí habilitamos el registro del próximo resultado. */
function ligaEngancharFinDePartido() {
  if (typeof onJuego !== "function") return;

  onJuego("finDePartido", ({ puntosJugador, puntosRival, limite }) => {
    // El Modo DT (liga) es el modo "por defecto": solo se registra acá si NO
    // estamos en otro modo. Sin estas guardas, los partidos del Mundial y los
    // partidos Online se contabilizaban TAMBIÉN en la tabla del Modo DT
    // (modoAmistoso era la única exclusión), ensuciando las estadísticas.
    // El Picadito es una manito suelta contra la IA: no es una fecha de la
    // liga. Sin esta guarda, al terminar se abría la tabla de posiciones.
    if (typeof window !== "undefined" && window.modoPicadito) return;
    // El Desafío del día (features_gameplay.js) es otro modo: sin esta guarda
    // cada partida suya se registraba como fecha de la Liga (y abría la tabla).
    if (typeof window !== "undefined" && window.modoDesafioDiario) return;
    if (typeof window !== "undefined" && window.modoCopaRapida) return;
    // Torneo Rápido (extras.js): mejor de 3 sueltas, no son fechas de la
    // liga. Sin esta guarda cada una de las 3 partidas se registraba como
    // fecha del Modo DT y regalaba sobres.
    if (typeof window !== "undefined" && window.modoTorneoRapido) return;
    // Maratón y Modo Historia: mismos motivos. Sin estas guardas, cada
    // victoria del maratón avanzaba una fecha de la Liga (y regalaba sobres),
    // y un capítulo de Historia hacía lo propio.
    if (typeof window !== "undefined" && window.modoMaraton)  return;
    if (typeof window !== "undefined" && window.modoHistoria) return;
    // Entrenamiento: con las cartas del rival a la vista, una "fecha" de la
    // Liga no vale nada (y regalaba sobres de figuritas).
    if (typeof window !== "undefined" && window.modoEntrenamiento) return;
    if (typeof modoAmistoso !== "undefined" && modoAmistoso) return;
    if (typeof modoMundial  !== "undefined" && modoMundial)  return;
    if (typeof modoCopa     !== "undefined" && modoCopa)     return;
    if (typeof S !== "undefined" && S.modoOnline)            return;
    if (ligaRegistrado) return;
    if (puntosJugador >= limite)      { ligaRegistrado = true; ligaRegistrarPartido(true,  puntosJugador, limite, puntosRival); }
    else if (puntosRival >= limite)   { ligaRegistrado = true; ligaRegistrarPartido(false, puntosJugador, limite, puntosRival); }
  });

  onJuego("nuevoPartido", () => { ligaRegistrado = false; });
}

/* ── Inicio ── */
document.addEventListener("DOMContentLoaded", () => {
  renderAvataresDT();
  ligaRenderTabla();
  ligaRenderFixture();
  ligaEngancharFinDePartido();

  // Aplicar avatar de DT al entrar a la mesa (después del hook de equipos.js)
  if (typeof window.setName === "function") {
    const fn = window.setName;
    window.setName = function () {
      fn.apply(this, arguments);
      setTimeout(aplicarAvatarDT, 80);
      setTimeout(aplicarAvatarDT, 600);
    };
  }

  // Al entrar al Modo DT con la liga sin arrancar, mostrar las reglas
  if (typeof window.irA === "function") {
    const irAOriginal = window.irA;
    window.irA = function (destino) {
      irAOriginal.apply(this, arguments);
      if (destino === "name-screen" && ligaCargar().fecha === 0) {
        setTimeout(() => mostrarReglasLiga(false), 350);
      }
    };
  }
});
