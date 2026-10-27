// =====================================================================
//  GENERATORE DEL LIVELLO
//  Decide dove mettere porte, alberi, rocce e lupi lungo la pista.
//  Restituisce un semplice elenco di "cose da costruire", per esempio:
//    { tipo: 'porte', distanza: 40, sinistra: {tipo:'+', valore:10}, destra: {tipo:'-', valore:5} }
//    { tipo: 'albero', distanza: 70, x: -2.5 }
//    { tipo: 'roccia', distanza: 95, x: 1.25 }
//    { tipo: 'lupo', distanza: 130, x: 3, corre: true }
//
//  REGOLA DEL PASSAGGIO LIBERO: in ogni gruppo di ostacoli c'è SEMPRE un
//  "corridoio" vuoto abbastanza largo da far passare la squadra più larga
//  possibile E il carro più grande possibile (più un margine). Gli ostacoli
//  vengono messi solo fuori dal corridoio, quindi si possono sempre evitare tutti.
//
//  Nella tappa 5 questo file genererà livelli infiniti sempre più difficili.
// =====================================================================

import { CONFIG } from '../config.js';

// Generatore di numeri casuali "con seme": con lo stesso seme esce sempre lo stesso livello
function creaCasuale(seme) {
  let s = seme >>> 0;
  return function () {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Larghezza del passaggio libero: la più larga tra squadra e carro (al massimo della crescita) + margine
export function larghezzaPassaggioLibero() {
  const sq = CONFIG.squadra;
  const ca = CONFIG.carro;
  const colonneMassime = Math.floor(sq.larghezzaMassimaFolla / sq.distanzaTraOmini) + 1;
  const larghezzaSquadra = (colonneMassime - 1) * sq.distanzaTraOmini + 2 * (sq.raggioCollisioneOmino + 0.1);
  const larghezzaCarro = ca.larghezzaIniziale * (1 + ca.crescitaMassima) * ca.riduzioneCollisione;
  return Math.max(larghezzaSquadra, larghezzaCarro) + CONFIG.livello.margineLibero;
}

// primaCorsa = true (tutorial): niente coppie con tutte e due le porte rosse
export function generaLivello({ primaCorsa = false } = {}) {
  const seme = CONFIG.livello.seme || Math.floor(Math.random() * 1e9);
  const caso = creaCasuale(seme);
  const intero = (min, max) => Math.floor(min + caso() * (max - min + 1));
  const metaPista = CONFIG.pista.larghezza / 2;
  const passaggio = larghezzaPassaggioLibero();

  // Mescola un elenco (per scegliere posizioni a caso)
  const mescola = (lista) => {
    const copia = [...lista];
    for (let i = copia.length - 1; i > 0; i--) {
      const j = Math.floor(caso() * (i + 1));
      [copia[i], copia[j]] = [copia[j], copia[i]];
    }
    return copia;
  };

  // --- Porte ---
  // "p" va da 0 (inizio della corsa) a 1 (ultima coppia): le porte diventano più generose (e le cattive più dure) man mano che si va avanti
  const tra = (coppia, p) => coppia[0] + (coppia[1] - coppia[0]) * p;
  const portaBuona = (p) => {
    const c = CONFIG.porte;
    const r = caso();
    const x5 = p >= 0.6 ? tra(c.probabilitaX5, (p - 0.6) / 0.4) : 0;
    const x4 = p >= 0.35 ? tra(c.probabilitaX4, (p - 0.35) / 0.65) : 0;
    const x3 = tra(c.probabilitaX3, p);
    if (r < x5) return { tipo: 'x', valore: 5 };
    if (r < x5 + x4) return { tipo: 'x', valore: 4 };
    if (r < x5 + x4 + x3) return { tipo: 'x', valore: 3 };
    if (r < x5 + x4 + x3 + c.probabilitaX2) return { tipo: 'x', valore: 2 };
    return { tipo: '+', valore: Math.round(intero(c.sommaMinima, c.sommaMassima) * (1 + c.crescitaSomme * p * p)) };
  };
  const portaCattiva = (p) => {
    const c = CONFIG.porte;
    if (caso() < c.probabilitaDiviso) return { tipo: '÷', valore: 2 };
    return { tipo: '-', valore: Math.round(intero(c.sottrazioneMinima, c.sottrazioneMassima) * (1 + c.crescitaSottrazioni * p * p)) };
  };
  // Coppia con tutte e due le porte rosse: una toglie un numero fisso, l'altra divide (÷2 o ÷3).
  // Quale conviene dipende da quanti boscaioli si hanno: -V conviene se la squadra è piccola, la divisione se è grande.
  const coppiaRossa = (p) => {
    const c = CONFIG.porte;
    const grezzo = c.rosseMinimo + (c.rosseMassimo - c.rosseMinimo) * p;
    const passo = grezzo < 40 ? 5 : grezzo < 100 ? 10 : 20;
    return [{ tipo: '-', valore: Math.max(10, Math.round(grezzo / passo) * passo) }, { tipo: '÷', valore: caso() < c.rosseDiviso3 ? 3 : 2 }];
  };
  const coppiaDiPorte = (distanza, p, rossa) => {
    let a;
    let b;
    if (rossa) {
      [a, b] = coppiaRossa(p);
    } else {
      a = portaBuona(p);
      if (caso() < CONFIG.porte.probabilitaDueBuone) {
        // due porte buone ma diverse: il giocatore deve scegliere la migliore
        do b = portaBuona(p); while (b.tipo === a.tipo && b.valore === a.valore);
      } else {
        b = portaCattiva(p);
      }
    }
    if (caso() < 0.5) [a, b] = [b, a]; // la porta buona (o la rossa che toglie) a volte a sinistra, a volte a destra
    return [{ tipo: 'porte', distanza, sinistra: a, destra: b, rossa }];
  };

  // --- Il corridoio libero e le zone dove si possono mettere ostacoli ---
  // Il corridoio sta un po' a destra o un po' a sinistra (mai sempre nello stesso punto)
  const scegliCorridoio = () => {
    const spostamentoMassimo = Math.max(0, metaPista - passaggio / 2);
    const lato = caso() < 0.5 ? -1 : 1;
    return lato * spostamentoMassimo * (0.35 + 0.65 * caso());
  };
  // Posizioni (x) possibili per ostacoli di un certo ingombro, fuori dal corridoio
  const postiFuoriDalCorridoio = (centroCorridoio, ingombro) => {
    const bordo = 0.5; // gli ostacoli possono toccare la neve ai lati della pista
    const zone = [
      [-metaPista + bordo, centroCorridoio - passaggio / 2 - ingombro],
      [centroCorridoio + passaggio / 2 + ingombro, metaPista - bordo],
    ];
    const posti = [];
    const passo = ingombro * 2 + 0.4;
    for (const [da, a] of zone) {
      if (a < da) continue;
      const quanti = Math.floor((a - da) / passo) + 1;
      const avanzo = a - da - (quanti - 1) * passo;
      for (let i = 0; i < quanti; i++) posti.push(da + avanzo / 2 + i * passo);
    }
    return mescola(posti);
  };

  // --- Sezioni con ostacoli ---
  const raggioAlbero = CONFIG.alberi.raggio * 0.7;
  const sezioneAlberi = (distanza) => {
    const c = scegliCorridoio();
    const posti = postiFuoriDalCorridoio(c, raggioAlbero).slice(0, intero(3, 4));
    const cose = posti.map((x) => ({ tipo: 'albero', distanza, x }));
    // a volte una seconda fila poco più avanti (un piccolo bosco), con lo stesso corridoio
    if (caso() < 0.7) {
      for (const x of postiFuoriDalCorridoio(c, raggioAlbero).slice(0, intero(1, 3))) {
        cose.push({ tipo: 'albero', distanza: distanza + 6, x });
      }
    }
    return cose;
  };
  const sezioneRocce = (distanza) => {
    const c = scegliCorridoio();
    const posti = postiFuoriDalCorridoio(c, CONFIG.rocce.raggioCollisione).slice(0, intero(1, 3));
    return posti.map((x) => ({ tipo: 'roccia', distanza, x }));
  };
  const sezioneLupi = (distanza) => {
    const L = CONFIG.lupi;
    const c = scegliCorridoio();
    const corre = caso() < L.probabilitaCorrono;
    const quanti = intero(L.lupiPerBrancoMinimo, L.lupiPerBrancoMassimo);
    const posti = postiFuoriDalCorridoio(c, L.raggioCollisione).slice(0, quanti);
    // il branco è un po' "sparpagliato" in avanti e indietro
    return posti.map((x) => ({ tipo: 'lupo', distanza: distanza + (caso() - 0.5) * 3, x, corre }));
  };
  const sezioneMista = (distanza) => {
    const c = scegliCorridoio();
    const ingombro = Math.max(raggioAlbero, CONFIG.rocce.raggioCollisione);
    const [primo, secondo] = postiFuoriDalCorridoio(c, ingombro);
    const cose = [];
    if (primo !== undefined) cose.push({ tipo: 'albero', distanza, x: primo });
    if (secondo !== undefined) {
      cose.push(caso() < 0.5 ? { tipo: 'roccia', distanza, x: secondo } : { tipo: 'lupo', distanza, x: secondo, corre: false });
    }
    return cose;
  };

  // Scelta a caso del tipo di sezione, rispettando i "pesi" della configurazione
  const L = CONFIG.livello;
  const tipi = [
    { peso: L.pesoAlberi, crea: sezioneAlberi },
    { peso: L.pesoRocce, crea: sezioneRocce },
    { peso: L.pesoLupi, crea: sezioneLupi },
    { peso: L.pesoMisto, crea: sezioneMista },
  ];
  const pesoTotale = tipi.reduce((t, x) => t + x.peso, 0);
  const sceltaTipo = () => {
    let r = caso() * pesoTotale;
    for (const t of tipi) {
      if ((r -= t.peso) < 0) return t;
    }
    return tipi[0];
  };

  // --- 1. Le "fermate" lungo la pista, ben distanziate per avere il tempo di reagire ---
  const fermate = [];
  const fine = CONFIG.pista.lunghezza - CONFIG.pista.margineFinale;
  for (let d = CONFIG.pista.inizioOggetti; d <= fine; ) {
    fermate.push(d);
    d += L.distanzaMinimaSezioni + caso() * (L.distanzaMassimaSezioni - L.distanzaMinimaSezioni);
  }

  // --- 2. Le porte occupano fermate distribuite in modo regolare (la prima è sempre una porta) ---
  const coppie = Math.min(CONFIG.porte.numeroCoppie, fermate.length);
  const fermateConPorte = new Map(); // fermata -> numero della coppia (0 = la prima)
  for (let k = 0; k < coppie; k++) fermateConPorte.set(Math.round((k * fermate.length) / coppie), k);
  // quali coppie sono "rosse" (tutte e due le porte tolgono boscaioli): a caso, mai la prima e mai nella prima corsa
  const rosse = new Set(primaCorsa ? [] : mescola(Array.from({ length: Math.max(0, coppie - 1) }, (_, i) => i + 1)).slice(0, CONFIG.porte.coppieRosse));

  // --- 3. Tutte le altre fermate diventano gruppi di ostacoli ---
  const elenco = [];
  let ultimoTipo = null;
  let ultimoPericolo = null; // l'ultimo tra rocce e lupi: si alternano
  fermate.forEach((distanza, i) => {
    if (fermateConPorte.has(i)) {
      const k = fermateConPorte.get(i);
      elenco.push(...coppiaDiPorte(distanza, coppie > 1 ? k / (coppie - 1) : 0, rosse.has(k)));
      return;
    }
    let tipo = sceltaTipo();
    if (tipo === ultimoTipo && caso() < 0.6) tipo = sceltaTipo(); // evita troppe ripetizioni
    // rocce e lupi si alternano: dopo le rocce i lupi, dopo i lupi le rocce
    if (tipo === tipi[1] || tipo === tipi[2]) {
      if (tipo === ultimoPericolo) tipo = tipo === tipi[1] ? tipi[2] : tipi[1];
      ultimoPericolo = tipo;
    }
    elenco.push(...tipo.crea(distanza));
    ultimoTipo = tipo;
  });

  return { seme, elenco, passaggio };
}
