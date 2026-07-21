/* ══════════════════════════════════════════════════════════
   MODO DT — LIGA DE TRUCO (formato fútbol argentino)
   - Elegís tu avatar de DT y tu club (equipos.js)
   - Cada partido vs la IA es una FECHA de la liga
   - Victoria: 3 pts · Derrota: 0 pts (en el truco no hay empate)
   - Los otros 18 clubes juegan su fecha simulada (pueden empatar: 1 pt)
   - Torneo de 19 fechas; el de más puntos sale CAMPEÓN
   No modifica el código existente del juego.
   ══════════════════════════════════════════════════════════ */

const AVATARES_DT = [
  {id:"dt1", nombre:"El Estratega", img:"data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBAUEBAYFBQUGBgYHCQ4JCQgICRINDQoOFRIWFhUSFBQXGiEcFxgfGRQUHScdHyIjJSUlFhwpLCgkKyEkJST/2wBDAQYGBgkICREJCREkGBQYJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCT/wAARCACgAJADASIAAhEBAxEB/8QAHQAAAQQDAQEAAAAAAAAAAAAAAAUGBwgBAwQCCf/EAEkQAAEDAwEFBQIKBAsJAAAAAAECAwQABREGBxIhMVETIkFhcQiBFBgyQlJVYpGUoRUzsfAWIyQ0VGNyksHR4RdDRFNzgqLC8f/EABoBAQACAwEAAAAAAAAAAAAAAAADBAECBQb/xAApEQACAgEEAgEEAQUAAAAAAAAAAQIDEQQSMVETIfAUIkFhgQVxobHx/9oADAMBAAIRAxEAPwC1NFFFAFFFFAFFFMDa3tUjbObWhDCG5N4lg/BmFHupA5uL+yD4eJ4dSDeDKWR7XC5wbTHMm4TI8Ngc3H3AhI95NMTU+2/SFrs8521363zbi00pTEdCioOLHJOQMfnVVtQ6lu+q56p96nvTX1HILh7qPJKeSR5AUntqSkneGQRio3MkVfZbW3+0Hs/mRkOv3V6E4RlTL8ZzeSemUgg+40P+0Js+ZPdu0h7/AKcN3/FIqpf8UP8AmHy4CsFafmtj1JJpvZnxot3btvez+4OBv9N/BlHgPhLDjaf7xGB7zT7hTolyjIkwpLMlhYyl1lYWlXoRwqgq1bo3lObo68BSvpDaPe9n9zRNsc/uFWXobhJZfHiFDwPRQ4isqfZhw6L1UUg6G1lA17piFf7dlLUhPfaUcqZcHBSD5g/fwPjS9W5EFFFFAFFFFAFFFFAFYcWlpClrOEpBJPQVmuG/XZuxWabc3G1upisqd7NsEqcIHBI8ycD30Ax9X7d9H6ahuGJPavE7GG40NW9x+2vkkdfHyqr+qdQXLWF5fvdye7WVI4lCeCWkjglCB9ED/HPOtGpb9P1NfJl2uakmXIcKlpSAEo8AkY8BypO3zu7vAjwyOXpUTeSeMUgKVJ5gj1rzRzOM8T1rY0UBRSsApIxnoetamxrry4vcA4Ek8gOZroKAkZShJ8ysGtPiT4nmetAc3wd11W84vc8k8T9/h7q5JJVHe7MrU62QCUrOf/lKTjiWkFajgCuebp+/iCi8uWeam3vJC0yeyJb3fA5HIeZplLkYb4HHoParq3Z8h2HYpzAguO9suPJYDjalEAZyOKSQByI5VZHZXt2h66kotF2it2y8LBLYbXvMyccSEE8Uqxx3TnyJqoEKUWHAknuKPHy86XYsl+3vx50NwtSGHA42tPAoWkggj8q2UmjTamX4opM0zeUah09bbu3jdmxm38DwKkgke45FKdSkIUUUUAUUUUAU3tokx+BoTUEqMSl5u3vqQoc0ncPH3c6cNct1t7V2tku3v57GUythePoqSQf20CKCnvOpbHyUDJ8+gr2tYbQtxXEISVEda6NS2WbpW/T7HcWy3KiOhtWRwWnwUOoUMEHzrndR2rTjZON9JGelQlk1MHdb7V5Q318STwx5Dyr327R/3qP7wpS0ToC4a/my22pbENuGE9qt0FRGc4CUjnyPlTuk+zxcUpzGv8JxXRxhac+8E1FK6EXiTJYUWSW6K9DA7Rvnvo+8VqdnMND5W+eieNOiXsM1jHUeyYgSh1akgfkoCtlu2F6uluhMpMGC34rcfCyPRKc5p5q+dw8FucbWNawWmXrC/wAO0sAjt3AFEcm0DipR9BmrWR4jESI3EZbSmO02GkIxw3AMAY9KbWhNnds0NGWY6lSpzwCXpbicEj6KR81Pl4+NOsDPIZrn6m5WP1wjp6Wh1RzLlldtsWgWdKXVu52xoN2yeVDsk/JYeHEpHRJHEDwwRTfjKQpoIcVuEgccZGetPnbVqePfbhEsMF1LzEBanZLqDlJdIwEA+OBnPmfKmtp/Ts7U94hWW3NFcuWvdHDghPio9ABkmr9Dk4Ldyc3UKKse3gtnsR3/APZZp7tOfYKx/Z7RWPyxT4rhsVoj2CzQbVFGGIbCGEeYSMZPmedd1W0UXyFFFFZMBRRRQBRRRQEabZ9j8baRbBMhFuNf4iCI76uCXk8+yc8s8j80+RNVMuEaXa3JUSbHcjTYhU28w4MKbWPA/vxHGr/E4FVa9pphi5Kj6lgwS0W1mHLfQP1reO4VdSCCAfPFRWSimk+WT1QlJNpekJKJmo7PbbbL0tp22Qks29qMu6XKQhgy+6FK3UKWkKSFE4UrPjjhSGvbZr61SA3LjWSXxxutBKwfQtLNSXpbZ8X9NM3i4RmJ01MD4ZMny2kvKYQlsFDDCFApScYAOMDBJySBUYT9bWObqOyw7YJk6I+hLVxamR2lJS+VYPYjdwUY5ZAPLlxxQVe7Lxk6nl24jnBL+zzVtz1jaHZtzsTloW24G0BRVh7hkqSFAEAcvGly9z5Frs8ydEhLnvx2lOIjIVuqdI+aDg8fdTTdlK2YXdNtmGU5a5KnWGozaVvrYlIwQhkHKi24hQUEk908M4rN71y/L7GyQId1tN3mr3UmZF3VtsBJU463xKVKATgDPBShkVWlS93peizG+O32/ZHM/bnrd6T2MaxwLbnkmS0reHqXFJH5VsVd9pOr2kB5UCQwAQti1XFlDzifEbiXCFHyI8q6dop0/s+dulmfRcf4SoZYcjPIIWhTisKc7Zau8oYOAcnJBOBwFPDQmmo2uNCwb7c7REmR3ith5xbKESI7ifkrQ4kAlJ5Z5pVjiQeFp1bFuSKyu3va38ZF2prC3p25sw47jslLrDT7ZdZ7NY3/AJpR4KB4Y61aXY9s0j6EsDT8phCr5MQFy3jxUjPENA+AT49Tk9Kr3bnLiNslstUxC7o9Z5CUqfeTvF2O2Ctta+qgFIBPiQOtWzsN3ReoAkBG4sKKFp6KFWqprKi37xk599csOUV9ucCjRRRVkqBRRRQBRRRQBRRRQARkEHxqItZWBqVbbrY5iEFt9lxvvjgcglKvccH3VLtJ14sUS8tgPpwtPBKwOI8j1FVdVS7EnHlFzR6iNUmp8MiLZzqR2dpeGtp0tSo7SYc1kgHcdQN1SVJPgcZGeYNc1t2daWtOoRf4tmipmJX2iAQotoXz3ggnH+Fd9+0DGiXhx+JOl265oSltU2GQkvpA7ocQoFK8DqM+dcSrBqR3uO6yeS14mPbmW3CP7RyB64rmuTTaTx+jrqKazjP77/0e71cXb/tDtjalhxdsYdlSVJAAQtxHZtJOPEp31egFeNYPG1O2S/5wzap6XJCsZ7NlxJbUv0SVJJ8ga6oViRp+KE2loOrK1OPmQ4VOyVqxlanDxKuHjwxw4V3NB+W243NitIZWkoU2ohe+DwII5YxUbs+5MlVP2NfP0cesNK2bXkhmVfoEaXIaACX0pKFlPgCUkZFKbJatdqagtFqJboiO40kBDTSRxJP5kk5NN1vSM+1pDNi1JMgRE/IiSGESmmh0QV4UlPQZIFZd0a5dcJ1Fe5l3jggmGEIjxlkfTQjiseSiR5Vs5t8y9fPnJooY4j7/AMfP4EzQDLU+637VZQE/ph5JjbycK+DJylB9Fbu96YqcdKQVQ7WFLTuqeUXMdB4f5++kzTukIiG2p0jCytKVIaCAlKBgADzGBy5U7OVdDS0y3eSX8HM1moi4+KH8/wB/+hRRRV45oUUUUAUUUUAUUUUAUUUUAy9Yxi1cUP47rqAM+Y/0xSDUjXS2M3WKWHcpIOUrHNJ60xblaZVrc3X0ZQT3XE/JV+/SuPq6JRk5rhnd0OojKCg+UJrbzywN6ItB6FaT+w16PbnkltHmok/5V6WhLiSlYCknmDXlqO0zns20pzzxVMvmENEL31uKWrGOiR7hXQyyqQ8hlAypxQSPeaw0y4+4ltpClrUcBKRkmnhp/TXwFSZcvBfHyUDiEf5mpqaZWSwuCvqNRGqOXyLzTaWWkNp+SgBI9BXqiiu8ebCiiigCiiigCiiigCiiigCiiue4XKFaYjky4S2IkZsZW68sIQn1JoDopE1kyHrC8gqUg7yCFJOCDvCmtfdvGiLTaDPh3Vu7OqKkNRYn6xah1zjdTn5x4HwzXZL1WzqfSEa7wUZiSEoeVxyptPzgfNJ4H0NRapONTbRPo/d0dvaGv28yL3XmDISOTjXP3isG5uL4MwpClfaG6BXcCCAQQR1FZrz2H2eo3L8oW9nrUn4XNdlLSVKbQEoTyQMmnvTCtd0b05An3qYpKIbDJU4T4hPE4/Z6mkrRftBaZ1FFeF4WmxS2UKcUh9e82tAGcoVjicfNxnpmu7oYN0+lwec/qM0722SlRSXp/VFl1VD+GWS5xZ7HipleSnyUOaT5EClSrOCmFFFFAFFFFAFFFClBIJJAA4kmgCioy1p7QejdJKcjR5Kr1ORkFiCQpCT0U4e6Pdk+VQbrH2kNZ6iafYt62LHEUkjdijedI83Ff+oFSxplI0diRNW03b5ZtFKdttqS3drynuqbSr+Jjn+sUOZ+yOPUiqzas1vf9bzfhd9uLsog5ba+S015IQOA9efnSEDkA9eNZq3CpR4K8puR6i8JSvtI/Yf9anH2fdYBqTJ0nNWC1J3n4gVy38d9HvHH3HrUHMHElB6hQ/f7qVLfPk2udHnw3C1JjOJdaWPmqByKzbWrIOLM12OElJFnHoyrPcl25ZJZUO0jKPin6Purey2uTJaitfrHOOfoJHNR9P24r01Pj6/0ZEvcHCH9ztUpB4tuJ4Lb+8fsre3KZ0fpqZqC78HEtdq4nkcfMbHmSR7z5V5P6aSt8ePnR636uLo8uffz2R1t+1aiLGi6QgrwCEvy8H5o/VoPqe8fdUFyThvHUilK83eVfrtLuk1e/JlOl1Z8AT4DyAwB5CkqWeLY9TXrKalVWoo8lbY7JuTN9nvdy0/PRcLTOkQZaOTrCyk+h6jyORVhdmvtKRrgpq2azS3DkHuouLYwys/1ifmHzHd9KrbRSdalyYjJx4PoQ06h5tLrS0rQsBSVJOQoHkQa9VTfZ/t91PoWG1aktRLlaY6lJbjvJ3FtpzkhLg48yeYNT1ov2hNG6tU3GkyFWWcvADM4gIUeiXB3T78HyqnKmUSxGxMk6isJUFAKSQQRkEeNZqI3Cqi7a9sd01de5tltc1cewRXFMBDKt34WUnClrI5pyDhPLAyc1Y3axqY6S2fXq6NrCZCY5ZYOcHtXO4kj0Ks+6qNYxw51Z08M/cyG2X4DkMeFYIyCOoxWaKtkBsYO8y2eqRWytMT9QkfRJT9xrdQAk7rrR+2B9/Cu6k55W40pf0cK+40o5B4jiDxrKMMlPYRrH9FXxWnpjuIdxUFM5PBMgDgPRQ4eoTXb7QGtPh1wZ0vDcyzDIelkH5TpHdR/2g59T5VDxfdYdaLC1NvBQUlaTgowc7w8xW6TJemyXZMl1br7yy444s5UtROST55qD6ePl8pN5n4/Gaq5ZJy/jon9prqricOX3T5gfcKsMhRiiisKO6kq6DNamTlZOUb30lE/ma98xjwrXHGGG/7IrZRAlbYrtiumj73Cs1zmuSNPyXEsqbeUVfBCo4C0E8QkEjKeWMngat5XzsIyMdavJsk1MdW7PLLc3F78jsAw+c8e0bO4on13c++qmogl9yJ6pfgjT2sb92FksliQvjKkLlOJ+y2nA/8AJf5VWerJ7ctlOt9oGsm51qhxHLfGiIYZU5KSgk5KlHB8yB7qjz4tu0X6vgfjUVJVKMYpZNJpuXBFijhxA65Fe6kxz2a9o6ltlNugd1WT/LkcsVs+LbtF+r4H41FSeSPZrsfRGEbh2qei8/eK31JDXs27RkPKJt0DdUkf8ajmK2/Fx2h/V8D8ainkj2NkuiMHE77ak9QRWbNLD0EBau8z3VZ6eB/fpUn/ABcdof1fA/GoritvszbR48lxTsCAGj4Cag73HhTyRzyNjxwMhkE5dUMKXyHQeArZUlfF51//AECD+MTR8XnX/wDQIP4xNbeSHZjZLojUkJBJ5DjSelW8Co/OJNSrJ9nfaEtopRb4JJ4fz1HKtCfZw2hhIH6PgfjUVh2R7GyXRGdaZityK6fskffUp/Fx2h/V8D8aitEz2bdo7zIQi3QDlQz/AC5HKsOyPZlQfRGCRupSOgAryk7ziuicD3/vipT+LbtF+r4H41Fa2fZr2jpSret1vClKJ/nyKeSPY2S6IzqyvsnX7trPe7CtfGM+iW2n7Lid1X5oH31HXxbdov1fA/GoqQth2yjW+gNaKn3WHEbt8iK5HeU3KSsg5CknA58U499R2yjKLWTaCalwf//Z"},
  {id:"dt2", nombre:"El Motivador", img:"data:image/jpeg;base64,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"},
  {id:"dt3", nombre:"El Pibe de Oro", img:"data:image/jpeg;base64,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"}
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
      if (l && l.tabla) {
        // Migrar datos viejos: la columna "pe" pasa a ser "db"
        Object.values(l.tabla).forEach(t => {
          if (t.db === undefined) { t.db = t.pe || 0; delete t.pe; }
          // Goles a favor/en contra: nuevos en esta versión
          if (t.gf === undefined) t.gf = 0;
          if (t.gc === undefined) t.gc = 0;
        });
        // Migrar torneos viejos sin fixture: generarlo respetando la fecha actual
        if (!l.fixture)    l.fixture = generarFixture();
        if (!l.resultados) l.resultados = [];
        if (l.premiosEntregados === undefined) l.premiosEntregados = false;
        return l;
      }
    }
  } catch (e) {}
  return ligaNueva();
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
  localStorage.removeItem(REGLAS_KEY); // que se muestren las reglas del nuevo torneo
  ligaRenderTabla();
  ligaRenderFixture();
  if (typeof closeModal === "function") { try { closeModal("liga-modal"); } catch (e) {} }
  mostrarReglasLiga(true);
}

/* ── Reglas de la liga: se muestran al arrancar cada torneo ── */
const REGLAS_KEY = "truco_liga_reglas_vistas";

function mostrarReglasLiga(forzar) {
  if (!forzar && localStorage.getItem(REGLAS_KEY)) return;
  lsSet(REGLAS_KEY, "1");
  if (typeof openModal === "function") {
    try { openModal("liga-reglas-modal"); } catch (e) {}
  }
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
  liga.fecha++;

  const enBuenas = !gano && typeof ptsJ === "number" && typeof limite === "number"
                   && ptsJ >= limite / 2;

  // Partido del jugador: el rival es el programado por el fixture
  const idJ = equipoSel.id;
  let idR = (equipoRival && equipoRival.id !== idJ) ? equipoRival.id : null;
  const parJugador = fixture.find(p => p[0] === idJ || p[1] === idJ);
  if (parJugador) idR = parJugador[0] === idJ ? parJugador[1] : parJugador[0];

  const resultadosFecha = [];

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
    gano ? tr.pp++ : (tr.pg++, tr.pts += 3);
  }
  resultadosFecha.push({
    a: idJ, b: idR, w: gano ? idJ : idR,
    db: enBuenas, ga: golesJ, gb: golesR, jugador: true
  });

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
  if (typeof figusOtorgarSobres === "function") {
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
    if (!liga.premiosEntregados && typeof figusOtorgarSobres === "function") {
      liga.premiosEntregados = true;
      const pos = orden.findIndex(t => t.id === idJ) + 1;
      if (pos === 1) {
        figusOtorgarSobres(5, true); // campeón: 5 sobres + Leyenda garantizada
        mensajeCampeon = "🏆 ¡CAMPEÓN! Premio: 5 sobres de figuritas + 1 LEYENDA garantizada";
      } else if (pos <= 4) {
        figusOtorgarSobres(2);
        mensajeCampeon = `🥈 Terminaste ${pos}º — Premio: 2 sobres de figuritas`;
      } else {
        figusOtorgarSobres(1);
        mensajeCampeon = `Terminaste ${pos}º — Premio consuelo: 1 sobre de figuritas`;
      }
    }
  }

  ligaGuardar(liga);

  // Aviso
  const eqR = idR ? LIGA.equipos.find(e => e.id === idR) : null;
  const rivalNom = eqR ? eqR.nombre : "tu rival";
  let msg;
  if (gano)          msg = "⚽ Fecha " + liga.fecha + ": ¡le ganaste a " + rivalNom + "! +3 pts";
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
  return LIGA.equipos
    .map(e => Object.assign({ id: e.id, nombre: e.nombre, escudo: e.escudo }, liga.tabla[e.id]))
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
    fechaLbl.textContent = liga.campeon
      ? "TORNEO FINALIZADO"
      : "Fecha " + liga.fecha + " de " + liga.fixture.length;
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
