// =====================================================================
//  ANIMAZIONI DEI PERSONAGGI
//  Usate da boscaiolo, lavoratori, clienti e lupi, così si muovono tutti
//  nello stesso modo morbido:
//  - persone: camminata con rimbalzo, dondolio e piccola schiacciata a ogni
//    passo; respiro quando sono ferme; colpo d'ascia con il caricamento
//  - lupi: galoppo a balzi, morso alle mura, ringhio da fermi
//  Le persone si muovono con la "molla" (il gruppo dentro il modello),
//  così chi le usa può continuare a spostarle e girarle come prima.
// =====================================================================

import { ALTEZZA_CORPO } from './lupo.js';

const morbido = (t) => t * t * (3 - 2 * t); // parte e arriva piano

// Il colpo d'ascia dura "durata" secondi; la lama tocca il lupo a "impatto" (frazione del colpo)
export const COLPO = { durata: 0.38, impatto: 0.5 };

// Camminata e respiro di una persona (boscaiolo, lavoratori, clienti).
// forza: 0 = ferma, 1 = cammina. velocita: quanto sono svelti i passi.
// carica: di quanto tiene le braccia in avanti (es. quando porta qualcosa).
// Restituisce true nell'istante in cui un piede tocca terra (per la polvere di neve).
export function animaPersona(modello, dt, forza, { velocita = 11, carica = 0 } = {}) {
  const a = (modello.userData.anim ??= { fase: 0, moto: 0, tempo: Math.random() * 10 });
  const p = modello.userData.perni;
  const molla = modello.userData.molla;
  a.tempo += dt;
  a.moto += (forza - a.moto) * Math.min(1, dt * 10); // parte e si ferma dolcemente, senza scatti
  const m = a.moto;
  const primaDelPasso = Math.sin(a.fase);
  a.fase += dt * velocita * Math.max(forza, m);
  const passo = Math.sin(a.fase);
  const alto = Math.abs(passo); // 0 quando un piede tocca terra, 1 a metà passo
  const respiro = Math.sin(a.tempo * 2.4) * (1 - m);

  p.gambaSx.rotation.x = passo * 0.75 * m;
  p.gambaDx.rotation.x = -passo * 0.75 * m;
  p.braccioSx.rotation.x = -passo * 0.6 * m + carica + respiro * 0.04;
  p.braccioDx.rotation.x = passo * 0.6 * m + carica + respiro * 0.04;
  p.braccioSx.rotation.z = -0.08 - respiro * 0.03; // braccia un po' staccate dal corpo
  p.braccioDx.rotation.z = 0.08 + respiro * 0.03;

  // rimbalzo a ogni passo, un po' piegato in avanti, dondola da una parte all'altra
  molla.position.y = alto * 0.07 * m;
  molla.rotation.set(-0.1 * m, passo * 0.07 * m, passo * 0.05 * m);
  // si allunga a metà passo e si schiaccia quando il piede tocca terra; da fermo respira
  const allunga = (alto - 0.5) * 0.08 * m + respiro * 0.018;
  molla.scale.set(1 - allunga * 0.5, 1 + allunga, 1 - allunga * 0.5);

  return m > 0.3 && Math.sign(primaDelPasso) !== Math.sign(passo);
}

// Il colpo d'ascia (da chiamare dopo animaPersona). k: da 0 (inizio) a 1 (fine del colpo).
// Carica: alza l'ascia sopra la testa girando le spalle e piegandosi indietro.
// Colpo: la cala di scatto piegandosi in avanti, con una piccola schiacciata. Poi torna dritto.
export function animaColpo(modello, k) {
  const p = modello.userData.perni;
  const molla = modello.userData.molla;
  const CARICA = 0.36;
  let braccio, piega, torsione;
  if (k < CARICA) {
    const t = morbido(k / CARICA);
    braccio = 0.3 + 2.6 * t;
    piega = 0.16 * t;
    torsione = -0.35 * t;
  } else if (k < COLPO.impatto) {
    const t = ((k - CARICA) / (COLPO.impatto - CARICA)) ** 2; // sempre più veloce
    braccio = 2.9 - 2.75 * t;
    piega = 0.16 - 0.44 * t;
    torsione = -0.35 + 0.6 * t;
  } else {
    const t = morbido((k - COLPO.impatto) / (1 - COLPO.impatto));
    braccio = 0.15 * (1 - t);
    piega = -0.28 * (1 - t);
    torsione = 0.25 * (1 - t);
  }
  p.braccioDx.rotation.x = braccio;
  p.braccioDx.rotation.z = 0.1;
  p.braccioSx.rotation.x = braccio * 0.45;
  molla.rotation.x = piega;
  molla.rotation.y = torsione;
  const botta = k >= COLPO.impatto ? Math.max(0, 1 - (k - COLPO.impatto) * 6) : 0;
  molla.scale.set(1 + botta * 0.06, 1 - botta * 0.08, 1 + botta * 0.06);
}

// Galoppo a balzi: le zampe davanti si allungano insieme mentre quelle dietro spingono,
// il corpo si inarca e si stacca da terra; la testa resta ferma e la coda ondeggia.
// velocita: quanto sono svelti i balzi; forza: 0 = fermo, 1 = corsa piena.
// Restituisce true quando atterra (per la polvere di neve).
export function animaGaloppo(lupo, dt, velocita, forza = 1) {
  const a = lupo.anim;
  const primaDelBalzo = Math.sin(a.fase - 0.8);
  a.fase += dt * velocita;
  const f = a.fase;
  const [as, ad, ps, pd] = lupo.zampe;
  as.rotation.x = Math.sin(f) * 0.9 * forza;
  ad.rotation.x = Math.sin(f - 0.4) * 0.9 * forza;
  ps.rotation.x = -Math.sin(f - 1.0) * 0.8 * forza;
  pd.rotation.x = -Math.sin(f - 1.4) * 0.8 * forza;
  const inAria = Math.sin(f - 0.8);
  lupo.corpo.position.set(0, ALTEZZA_CORPO + Math.max(0, inAria) * 0.14 * forza, 0);
  lupo.corpo.rotation.x = Math.cos(f) * 0.13 * forza; // muso in su quando le zampe davanti si allungano
  lupo.testa.rotation.x = -Math.cos(f) * 0.1 * forza;
  lupo.coda.rotation.set(0.2 + Math.sin(f) * 0.35 * forza, Math.sin(f * 0.5) * 0.2, 0);
  return forza > 0.3 && primaDelBalzo > 0 && inAria <= 0;
}

// Il lupo attacca le mura: si alza un po' sulle zampe dietro, graffia con quelle davanti
// una dopo l'altra e ogni tanto si slancia a mordere; la coda scodinzola veloce.
export function animaMorso(lupo, dt) {
  const a = lupo.anim;
  a.fase += dt * 9;
  const f = a.fase;
  const slancio = Math.max(0, Math.sin(f * 0.45)) ** 3;
  const [as, ad, ps, pd] = lupo.zampe;
  as.rotation.x = 0.8 + Math.sin(f) * 0.6;
  ad.rotation.x = 0.8 - Math.sin(f) * 0.6;
  ps.rotation.x = pd.rotation.x = -0.25;
  lupo.corpo.position.set(0, ALTEZZA_CORPO + 0.03 + Math.abs(Math.sin(f)) * 0.03, -slancio * 0.15);
  lupo.corpo.rotation.x = 0.22 - slancio * 0.2;
  lupo.testa.rotation.x = -0.15 - slancio * 0.35;
  if (lupo.mascella) lupo.mascella.rotation.x = -0.12 - slancio * 0.5; // il gigante spalanca la bocca quando morde
  lupo.coda.rotation.set(0.5, Math.sin(f * 1.6) * 0.45, 0);
}
// Il lupo gigante cammina pesante: passi lenti, il corpo che ondeggia da un lato all'altro e sprofonda a ogni passo,
// la testa bassa e minacciosa. Restituisce true quando una zampa batte per terra (serve per la polvere e il tonfo).
export function animaPassoPesante(lupo, dt, velocita) {
  const a = lupo.anim;
  const prima = Math.sin(a.fase);
  a.fase += dt * (2.2 + velocita * 1.6);
  const f = a.fase;
  const [as, ad, ps, pd] = lupo.zampe;
  as.rotation.x = Math.sin(f) * 0.55;
  pd.rotation.x = -Math.sin(f) * 0.5;
  ad.rotation.x = -Math.sin(f) * 0.55;
  ps.rotation.x = Math.sin(f) * 0.5;
  lupo.corpo.position.set(Math.sin(f) * 0.03, ALTEZZA_CORPO - 0.03 + Math.abs(Math.cos(f)) * 0.06, 0);
  lupo.corpo.rotation.z = Math.sin(f) * 0.06;
  lupo.corpo.rotation.x = 0.03;
  lupo.testa.rotation.x = -0.2 + Math.sin(f * 2) * 0.04;
  lupo.testa.rotation.y = Math.sin(f) * 0.12;
  if (lupo.mascella) lupo.mascella.rotation.x = -0.1 - Math.abs(Math.sin(f)) * 0.06;
  lupo.coda.rotation.set(-0.25, Math.sin(f) * 0.15, 0);
  return velocita > 0.05 && prima * Math.sin(f) < 0; // il segno cambia: un piede è arrivato a terra
}

// Il lupo gigante ulula: si alza sulle zampe di dietro con la testa al cielo, la bocca aperta che trema e la coda alta.
// salita (0-1) è quanto è già alzato: all'inizio la testa sale piano.
export function animaUlulato(lupo, dt) {
  const a = lupo.anim;
  a.fase += dt * 3;
  a.ululato = Math.min(1, (a.ululato ?? 0) + dt * 1.6);
  const sale = a.ululato;
  const f = a.fase;
  const [as, ad, ps, pd] = lupo.zampe;
  as.rotation.x = ad.rotation.x = -0.45 * sale;
  ps.rotation.x = pd.rotation.x = 0.25 * sale;
  lupo.corpo.position.set(0, ALTEZZA_CORPO + 0.09 * sale, 0);
  lupo.corpo.rotation.set(0.45 * sale + Math.sin(f) * 0.02, 0, 0);
  lupo.testa.rotation.set(1.0 * sale + Math.sin(f * 2.3) * 0.05, 0, 0);
  if (lupo.mascella) lupo.mascella.rotation.x = -(0.55 + Math.sin(f * 4) * 0.08) * sale;
  lupo.coda.rotation.set(0.9 * sale, Math.sin(f) * 0.12, 0);
}


// Il lupo fermo ringhia: basso sulle zampe, testa giù che trema, coda bassa
export function animaRinghio(lupo, dt) {
  const a = lupo.anim;
  a.fase += dt * 4;
  const f = a.fase;
  const [as, ad, ps, pd] = lupo.zampe;
  as.rotation.x = ad.rotation.x = -0.25;
  ps.rotation.x = pd.rotation.x = 0.25;
  lupo.corpo.position.set(0, ALTEZZA_CORPO - 0.06 + Math.abs(Math.sin(f * 3)) * 0.015, 0);
  lupo.corpo.rotation.x = -0.12;
  lupo.testa.rotation.x = -0.1 + Math.sin(f * 6) * 0.04;
  lupo.coda.rotation.set(-0.4, Math.sin(f) * 0.1, 0);
}
