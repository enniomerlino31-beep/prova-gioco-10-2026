// =====================================================================
//  MODELLO DELL'ORSO GIGANTE (il boss di fine corsa)
//  Stile cartoon come gli altri personaggi, ma CATTIVO: enorme, marrone scuro,
//  gobba di pelo arruffato sulle spalle, occhi rossi che brillano, zanne e
//  artigli grandi, cicatrici e muso arrabbiato. Sta a quattro zampe; all'arrivo
//  si alza sulle zampe di dietro e ruggisce; poi dà zampate e alla fine cade.
//
//  Guarda verso la Z negativa (come il lupo): chi lo mette nella scena lo gira.
//  Testa, mascella e zampe hanno ognuna il suo perno. I pezzi di ogni perno sono
//  uniti in una forma sola (vedi pezzi.js), quindi l'orso intero si disegna con
//  7 pezzi soltanto, anche se ha tanti dettagli: leggero per il telefono.
//
//  Misure del modello (prima di ingrandirlo): lungo circa 1,9 metri, alto circa
//  1,3 sulla gobba; alzato sulle zampe di dietro arriva a circa 2 metri.
// =====================================================================

import * as THREE from 'three';
import { pezzo, unisciPezzi, costruisci } from './pezzi.js';

// Occhi rossi che brillano (non li tocca la luce, quindi si vedono sempre)
const OCCHI_ROSSI = new THREE.MeshBasicMaterial({ color: 0xff2a1a });
const OCCHI_CENTRO = new THREE.MeshBasicMaterial({ color: 0xffe27a });

const PELO = 0x4a2c1a;
const SCURO = 0x2e1a0f;
const VENTRE = 0x5e3a22;
const MUSO = 0x9b7550;
const CICATRICE = 0xd1a98f;
const GENGIVE = 0x7a1f2a;
const ARTIGLI = 0xeadfc3;
const NERO = 0x16110d;
const BIANCO = 0xffffff;

// Altezza del perno del corpo: le zampe di dietro e di davanti scendono da qui fino a terra
export const ALTEZZA_CORPO_ORSO = 0.95;

const PERNI = {
  corpo: new THREE.Vector3(0, ALTEZZA_CORPO_ORSO, 0),
  testa: new THREE.Vector3(0, 0.3, -0.8),
  mascella: new THREE.Vector3(0, -0.2, -0.18), // la mascella inferiore: si spalanca quando ruggisce
  zampaAs: new THREE.Vector3(-0.5, 0.15, -0.55), // braccio anteriore sinistro (spalla)
  zampaAd: new THREE.Vector3(0.5, 0.15, -0.55),
  zampaPs: new THREE.Vector3(-0.4, -0.1, 0.55),  // gamba posteriore sinistra (anca)
  zampaPd: new THREE.Vector3(0.4, -0.1, 0.55),
};
const GENITORI = { mascella: 'testa', testa: 'corpo', zampaAs: 'corpo', zampaAd: 'corpo', zampaPs: 'corpo', zampaPd: 'corpo' };

function pezziOrso() {
  const p = [
    // --- Corpo: busto massiccio, gobba sulle spalle, pancia più chiara, sedere tondo ---
    pezzo('corpo', 'sfera', PELO, [0, 0.02, 0.05], [0.66, 0.62, 0.88]),
    pezzo('corpo', 'sfera', PELO, [0, 0.34, -0.42], [0.62, 0.48, 0.52]),
    pezzo('corpo', 'sfera', PELO, [0, 0.05, 0.62], [0.56, 0.52, 0.5]),
    pezzo('corpo', 'sfera', VENTRE, [0, -0.28, 0], [0.5, 0.4, 0.72]),
  ];
  // pelo arruffato: ciuffi a punta lungo la schiena, più lunghi sulla gobba
  for (let i = 0; i < 11; i++) {
    const z = -0.72 + i * 0.14;
    const lungo = i < 5 ? 0.34 : 0.26;
    const lato = (i % 2 ? 1 : -1) * 0.06;
    p.push(pezzo('corpo', 'cono', i % 3 === 0 ? SCURO : PELO, [lato, 0.62 - Math.abs(i - 3) * 0.035, z], [0.1, lungo, 0.09], [0.45 + (i % 3) * 0.12, 0, lato * 5]));
  }
  // collare di pelo ai lati del collo, a ciuffi
  for (const lato of [-1, 1]) {
    for (let k = 0; k < 4; k++) {
      p.push(pezzo('corpo', 'cono', k % 2 ? SCURO : PELO, [lato * (0.36 + k * 0.05), 0.28 - k * 0.1, -0.7 + k * 0.04], [0.1, 0.28, 0.09], [0, 0, -lato * (Math.PI / 2 + 0.2 - k * 0.12)]));
    }
  }
  // cicatrici sul fianco e sulla schiena
  p.push(pezzo('corpo', 'scatola', CICATRICE, [0.6, 0.12, 0.1], [0.02, 0.02, 0.5], [0.2, 0.1, -0.5]));
  p.push(pezzo('corpo', 'scatola', CICATRICE, [-0.62, 0.0, 0.3], [0.02, 0.02, 0.4], [-0.25, 0, 0.55]));
  p.push(pezzo('corpo', 'scatola', CICATRICE, [0.18, 0.62, 0.15], [0.02, 0.03, 0.34], [0.1, 0.4, 0.2]));

  // --- Testa: cranio, muso chiaro, naso, orecchie tonde ---
  p.push(
    pezzo('testa', 'sfera', PELO, [0, 0.0, -0.05], [0.46, 0.42, 0.44]),
    pezzo('testa', 'sfera', MUSO, [0, -0.13, -0.42], [0.24, 0.2, 0.32]),
    pezzo('testa', 'sfera', NERO, [0, -0.04, -0.72], [0.1, 0.075, 0.075]),
    pezzo('testa', 'scatola', SCURO, [0, 0.1, -0.42], [0.08, 0.04, 0.22], [0.2, 0, 0]), // ponte del naso con le rughe
    pezzo('testa', 'sfera', GENGIVE, [0, -0.2, -0.4], [0.12, 0.03, 0.2]),                // il rosso della bocca (si vede quando è aperta)
  );
  for (const lato of [-1, 1]) {
    p.push(
      pezzo('testa', 'sfera', PELO, [lato * 0.32, 0.36, 0.02], [0.14, 0.14, 0.09]),             // orecchie tonde
      pezzo('testa', 'sfera', SCURO, [lato * 0.32, 0.36, -0.03], [0.08, 0.08, 0.05]),
      pezzo('testa', 'sfera', OCCHI_ROSSI, [lato * 0.17, 0.1, -0.38], [0.085, 0.075, 0.05]),    // occhi rossi che brillano
      pezzo('testa', 'sfera', OCCHI_CENTRO, [lato * 0.165, 0.098, -0.42], [0.035, 0.04, 0.02]),
      pezzo('testa', 'scatola', NERO, [lato * 0.17, 0.23, -0.34], [0.2, 0.065, 0.05], [0, 0, lato * 0.6]), // sopracciglia spesse e arrabbiate
      pezzo('testa', 'cono', PELO, [lato * 0.4, -0.04, -0.05], [0.09, 0.22, 0.08], [0, 0, -lato * (Math.PI / 2 + 0.3)]), // ciuffi sulle guance
      pezzo('testa', 'cono', SCURO, [lato * 0.37, -0.14, -0.02], [0.08, 0.18, 0.07], [0, 0, -lato * (Math.PI / 2 + 0.6)]),
      pezzo('testa', 'cono', BIANCO, [lato * 0.1, -0.24, -0.6], [0.04, 0.2, 0.035], [Math.PI, 0, 0]),   // zanne grandi in alto
      pezzo('testa', 'cono', BIANCO, [lato * 0.17, -0.2, -0.47], [0.03, 0.1, 0.03], [Math.PI, 0, 0]),
      pezzo('testa', 'scatola', CICATRICE, [lato * 0.24, -0.02, -0.26], [0.025, 0.22, 0.015], [0.2, lato * 0.3, lato * 0.5]), // cicatrice sulla guancia
      // mascella inferiore: zanne in basso e denti
      pezzo('mascella', 'cono', BIANCO, [lato * 0.09, 0.12, -0.52], [0.035, 0.16, 0.03]),
      pezzo('mascella', 'cono', BIANCO, [lato * 0.16, 0.08, -0.38], [0.028, 0.09, 0.026]),
    );
  }
  p.push(
    pezzo('testa', 'scatola', CICATRICE, [-0.15, 0.2, -0.36], [0.018, 0.24, 0.015], [0.1, 0, -0.4]), // cicatrice che taglia l'occhio sinistro
    pezzo('mascella', 'sfera', SCURO, [0, -0.0, -0.3], [0.2, 0.09, 0.34]),
    pezzo('mascella', 'sfera', MUSO, [0, -0.02, -0.55], [0.11, 0.07, 0.12]),
  );

  // --- Zampe: anteriori (braccia enormi con grandi artigli) e posteriori ---
  for (const perno of ['zampaAs', 'zampaAd']) {
    p.push(
      pezzo(perno, 'sfera', PELO, [0, -0.15, 0], [0.26, 0.38, 0.28]),          // spalla e braccio
      pezzo(perno, 'cilindro', PELO, [0, -0.52, 0], [0.19, 0.62, 0.2]),         // avambraccio
      pezzo(perno, 'sfera', SCURO, [0, -0.85, -0.04], [0.23, 0.13, 0.27]),      // zampa
    );
    for (const ax of [-0.12, -0.04, 0.04, 0.12]) p.push(pezzo(perno, 'cono', ARTIGLI, [ax, -0.9, -0.3], [0.035, 0.24, 0.035], [-Math.PI / 2 - 0.2, 0, 0])); // artigli grandi
  }
  for (const perno of ['zampaPs', 'zampaPd']) {
    p.push(
      pezzo(perno, 'sfera', PELO, [0, -0.15, 0.02], [0.3, 0.42, 0.34]),          // coscia
      pezzo(perno, 'cilindro', PELO, [0, -0.5, 0.02], [0.17, 0.56, 0.18]),       // gamba
      pezzo(perno, 'sfera', SCURO, [0, -0.78, -0.06], [0.22, 0.1, 0.3]),         // piede
    );
    for (const ax of [-0.1, 0, 0.1]) p.push(pezzo(perno, 'cono', ARTIGLI, [ax, -0.82, -0.32], [0.03, 0.17, 0.03], [-Math.PI / 2 - 0.2, 0, 0]));
  }
  return p;
}

// Le forme unite, preparate una volta sola
let giaPronto = null;

// Restituisce il gruppo dell'orso e i suoi perni da animare.
// "radice" è quello che si mette nella scena (lo si sposta e gira); "modello" è il corpo che si inclina quando cade.
export function creaOrso() {
  giaPronto ??= unisciPezzi(pezziOrso());
  const modello = new THREE.Group();
  const perni = costruisci(giaPronto, PERNI, modello, GENITORI);
  const radice = new THREE.Group();
  radice.add(modello);
  // Materiali solo suoi (copie): servono per farlo lampeggiare di bianco quando è colpito e per gli occhi più luminosi
  // quando è furioso, senza cambiare i colori degli altri personaggi che usano gli stessi materiali
  const copie = new Map();
  const materiali = { pelo: null, occhi: null };
  modello.traverse((m) => {
    if (!m.isMesh) return;
    if (!copie.has(m.material)) {
      const copia = m.material.clone();
      copia.userData.daLiberare = true;
      copie.set(m.material, copia);
      if (m.material === OCCHI_ROSSI) materiali.occhi = copia;
      else if (m.material.isMeshLambertMaterial) materiali.pelo = copia;
    }
    m.material = copie.get(m.material);
  });
  return {
    radice,
    modello,
    materiali,
    corpo: perni.corpo,
    testa: perni.testa,
    mascella: perni.mascella,
    braccia: [perni.zampaAs, perni.zampaAd],
    gambe: [perni.zampaPs, perni.zampaPd],
    anim: { fase: Math.random() * 6, alzato: 0, ruggito: 0, zampata: -1, schianto: -1, lato: 1, passo: 0 },
  };
}

const morbido = (t) => t * t * (3 - 2 * t);

// Tempi (secondi) dei due attacchi: la zampata (si carica all'indietro, poi colpisce) e lo schianto (si alza e colpisce a terra
// con tutte e due le zampe davanti). "impatto" = a che parte del tempo arriva il colpo.
export const ZAMPATA = { durata: 0.8, impatto: 0.72 };
export const SCHIANTO = { durata: 1.4, impatto: 0.72 };

const limita = (v, a, b) => Math.min(b, Math.max(a, v));

// Posa e movimento dell'orso a ogni fotogramma.
//  alzato: sulle zampe di dietro (all'arrivo, mentre ruggisce, e nella prima parte dello schianto)
//  ruggisce: testa al cielo e bocca spalancata che trema
//  furia: 0-1, sotto il 30% di vita: occhi più luminosi, tutto un po' più nervoso
//  cammina: 0-1, quanto sta camminando (le zampe si muovono)
export function animaOrso(orso, dt, { alzato, ruggisce, furia = 0, cammina = 0 }) {
  const a = orso.anim;
  a.fase += dt * (3 + furia * 2.5);
  const f = a.fase;
  a.alzato += ((alzato ? 1 : 0) - a.alzato) * Math.min(1, dt * (alzato ? 4.5 : 10)); // si alza piano, si abbassa in fretta
  a.ruggito += ((ruggisce ? 1 : 0) - a.ruggito) * Math.min(1, dt * 8);
  a.passo += dt * 7 * cammina;
  a.lampo = Math.max(0, (a.lampo ?? 0) - dt * 6);
  const su = morbido(limita(a.alzato, 0, 1));
  const [bs, bd] = orso.braccia;
  const [gs, gd] = orso.gambe;
  const tremito = Math.sin(f * 9) * 0.04 * a.ruggito;
  const passo = Math.sin(a.passo);

  // --- la zampata: si carica all'indietro (braccio alzato, busto che si gira e si piega indietro), poi colpisce ---
  let carica = 0;
  let colpo = 0;
  if (a.zampata >= 0) {
    const k = Math.min(1, a.zampata);
    carica = k < 0.5 ? morbido(k / 0.5) : 1 - morbido((k - 0.5) / 0.22);
    colpo = k < 0.5 ? 0 : morbido(limita((k - 0.5) / 0.22, 0, 1)) * (k < 0.85 ? 1 : 1 - (k - 0.85) / 0.15);
    a.zampata += dt / ZAMPATA.durata;
    if (a.zampata >= 1) a.zampata = -1;
  }
  // --- lo schianto: braccia in alto mentre si alza, poi giù di colpo, a terra ---
  let schiantoSu = 0;
  let schiantoGiu = 0;
  if (a.schianto >= 0) {
    const k = Math.min(1, a.schianto);
    schiantoSu = k < 0.55 ? morbido(k / 0.55) : k < 0.72 ? 1 : 1 - morbido((k - 0.72) / 0.28);
    schiantoGiu = k < 0.55 ? 0 : k < 0.72 ? morbido((k - 0.55) / 0.17) : 1 - morbido((k - 0.72) / 0.28);
    a.schianto += dt / SCHIANTO.durata;
    if (a.schianto >= 1) a.schianto = -1;
  }

  // inclinazione del busto: in piedi sulle zampe di dietro, le gambe restano a terra; durante lo schianto si piega in avanti
  const inclinazione = 1.05 * su;
  orso.corpo.rotation.set(inclinazione - 0.28 * carica + 0.22 * colpo + 0.5 * schiantoGiu + Math.sin(f) * 0.02, a.lato * (-0.4 * carica + 0.5 * colpo) * (1 - su * 0.4), 0);
  orso.corpo.position.set(0, ALTEZZA_CORPO_ORSO + 0.5 * su + Math.abs(Math.sin(f * 0.8)) * 0.015 + Math.abs(passo) * 0.05 * cammina, 0.15 * su);
  gs.rotation.x = -inclinazione + 0.1 * su + passo * 0.55 * cammina * (1 - su * 0.6);
  gd.rotation.x = -inclinazione + 0.1 * su - passo * 0.55 * cammina * (1 - su * 0.6);

  // testa: bassa e minacciosa a quattro zampe, alzata verso il cielo quando ruggisce, in avanti nello schianto
  orso.testa.rotation.set(-0.15 * (1 - su) - 0.55 * a.ruggito * su + 0.3 * schiantoGiu + Math.sin(f * 1.3) * 0.03 + tremito, Math.sin(f * 0.7) * 0.1 * (1 - a.ruggito), 0);
  orso.mascella.rotation.x = -(0.12 + 0.75 * a.ruggito + 0.35 * furia + 0.4 * schiantoGiu) + Math.sin(f * 9) * 0.05 * (a.ruggito + furia * 0.5);

  // braccia: a quattro zampe camminano; in piedi larghe e alzate se ruggisce; zampata: una si abbatte di lato; schianto: tutte e due
  const largo = 0.65 * a.ruggito;
  const bracciaSu = -0.5 * su - 1.1 * a.ruggito * su;
  let sx = bracciaSu + (1 - su) * (Math.sin(f) * 0.25 - passo * 0.6 * cammina);
  let dx = bracciaSu + (1 - su) * (-Math.sin(f) * 0.25 + passo * 0.6 * cammina);
  let zs = -largo;
  let zd = largo;
  if (a.lato > 0) {
    dx += (-0.2 - 1.9 * carica + 1.5 * colpo);
    zd += 0.9 * carica - 1.2 * colpo + 0.2 * (carica + colpo);
  } else {
    sx += -0.2 - 1.9 * carica + 1.5 * colpo;
    zs += -(0.9 * carica - 1.2 * colpo) - 0.2 * (carica + colpo);
  }
  // schianto: braccia alzate (x -2,7) poi giù (x +0,3)
  if (a.schianto >= 0 || schiantoGiu > 0 || schiantoSu > 0) {
    const x = schiantoSu * -2.7 + schiantoGiu * 2.9;
    sx = sx * (1 - Math.max(schiantoSu, schiantoGiu)) + x;
    dx = dx * (1 - Math.max(schiantoSu, schiantoGiu)) + x;
    zs = zs * (1 - schiantoSu) - 0.5 * schiantoSu;
    zd = zd * (1 - schiantoSu) + 0.5 * schiantoSu;
  }
  bs.rotation.set(sx, 0, zs);
  bd.rotation.set(dx, 0, zd);

  // occhi: sempre rossi e luminosi; con la furia diventano arancio brillante e pulsano
  const m = orso.materiali;
  if (m.occhi) m.occhi.color.setRGB(1, 0.16 + furia * (0.34 + 0.12 * Math.sin(f * 4)), 0.1 + furia * 0.1);
  // lampo bianco quando è colpito
  if (m.pelo) m.pelo.emissive.setScalar(a.lampo * 0.8);
}

// L'orso è stato colpito: lampeggia di bianco
export function colpisciOrso(orso) {
  orso.anim.lampo = 1;
}

// Fa partire una zampata (lato = 1 destra, -1 sinistra)
export function avviaZampata(orso, lato) {
  orso.anim.zampata = 0;
  orso.anim.lato = lato;
}

// Fa partire lo schianto (si alza e batte a terra con tutte e due le zampe)
export function avviaSchianto(orso) {
  orso.anim.schianto = 0;
}
