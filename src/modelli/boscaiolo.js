// =====================================================================
//  MODELLO DEL BOSCAIOLO
//  Stile cartoon caldo: testa grande e tonda, guance rosa, occhi con il
//  riflesso, barba folta, berretto di lana con il pon-pon, camicia a quadri,
//  bretelle, cintura con la fibbia, jeans arrotolati, scarponi e ascia.
//  Alto circa 1,3 metri. Guarda verso la Z negativa (la direzione di corsa).
//
//  I pezzi che si muovono insieme sono uniti in una forma sola (vedi pezzi.js):
//  così anche la folla della corsa resta leggera sul telefono.
//
//  COME SOSTITUIRLO IN FUTURO con un modello 3D vero:
//  basta cambiare questo file. La squadra usa solo "partiBoscaiolo()"
//  (l'elenco delle forme) e "PERNI" (i punti in cui gambe e braccia ruotano).
// =====================================================================

import * as THREE from 'three';
import { materialeQuadri } from './materiali.js';
import { pezzo, unisciPezzi, costruisci } from './pezzi.js';

// Colori del personaggio
const PELLE = 0xf7c9a0;
const GUANCE = 0xf08f80;
const NASO = 0xec9f7e;
const BARBA = 0x8a5226;
const BERRETTO = 0xd8262e;
const BERRETTO_SCURO = 0xa91c22;
const JEANS = 0x3366b8;
const JEANS_CHIARO = 0x7aa3e6;
const SCARPONI = 0x6b3f1f;
const SUOLA = 0x3a2414;
const CUOIO = 0x4a2a14;
const FIBBIA = 0xf2c14e;
const MANICO = 0x9a6234;
const LAMA = 0xb9c3cf;
const FILO = 0xf1f5fa;
const NERO = 0x1b1b1b;
const BIANCO = 0xffffff;

// Punti attorno a cui ruotano le parti mobili (anche e spalle)
export const PERNI = {
  corpo: new THREE.Vector3(0, 0, 0),
  gambaSx: new THREE.Vector3(-0.09, 0.42, 0),
  gambaDx: new THREE.Vector3(0.09, 0.42, 0),
  braccioSx: new THREE.Vector3(-0.23, 0.78, 0),
  braccioDx: new THREE.Vector3(0.23, 0.78, 0),
};

// Elenco dei pezzi. colori: { berretto, berrettoScuro, giacca, senzaAscia } per i lavoratori
// (giacca = colore che prende il posto della camicia a quadri).
function pezziBoscaiolo({ berretto = BERRETTO, berrettoScuro = BERRETTO_SCURO, giacca = null, senzaAscia = false }) {
  const stoffa = giacca ?? materialeQuadri();
  const pezzi = [
    // --- Corpo: bacino, camicia, cintura con la fibbia, bretelle ---
    pezzo('corpo', 'sfera', JEANS, [0, 0.46, 0], [0.17, 0.1, 0.13]),
    pezzo('corpo', 'capsula', stoffa, [0, 0.64, 0], [0.2, 0.13, 0.16]),
    pezzo('corpo', 'cilindro', CUOIO, [0, 0.515, 0], [0.188, 0.055, 0.152]),
    pezzo('corpo', 'scatola', FIBBIA, [0, 0.515, -0.155], [0.06, 0.045, 0.015]),

    // --- Testa: viso, orecchie, barba, baffi, naso, guance, occhi, sopracciglia ---
    pezzo('corpo', 'sfera', PELLE, [0, 1.0, 0], [0.235, 0.225, 0.225]),
    pezzo('corpo', 'sfera', BARBA, [0, 0.86, -0.07], [0.2, 0.17, 0.16]),
    pezzo('corpo', 'sfera', BARBA, [0, 0.76, -0.12], [0.11, 0.09, 0.08]),
    pezzo('corpo', 'sfera', NASO, [0, 0.985, -0.225], [0.055, 0.048, 0.05]),

    // --- Berretto di lana con il risvolto e il pon-pon ---
    pezzo('corpo', 'mezzaSfera', berretto, [0, 1.1, 0], [0.245, 0.25, 0.245]),
    pezzo('corpo', 'cilindro', berrettoScuro, [0, 1.125, 0], [0.25, 0.075, 0.25]),
    pezzo('corpo', 'sfera', berretto, [0, 1.37, 0.02], [0.075, 0.075, 0.075]),
  ];
  for (const lato of [-1, 1]) {
    pezzi.push(
      pezzo('corpo', 'scatola', CUOIO, [lato * 0.085, 0.67, -0.158], [0.04, 0.26, 0.02]),
      pezzo('corpo', 'sfera', PELLE, [lato * 0.228, 0.99, 0.01], [0.045, 0.06, 0.04]),
      pezzo('corpo', 'sfera', BARBA, [lato * 0.055, 0.945, -0.205], [0.07, 0.032, 0.04], [0, 0, -lato * 0.25]),
      pezzo('corpo', 'sfera', GUANCE, [lato * 0.13, 0.965, -0.175], [0.05, 0.035, 0.03]),
      pezzo('corpo', 'sfera', NERO, [lato * 0.078, 1.03, -0.2], [0.03, 0.042, 0.02]),
      pezzo('corpo', 'sfera', BIANCO, [lato * 0.07, 1.045, -0.217], [0.01, 0.012, 0.006]),
      pezzo('corpo', 'scatola', BARBA, [lato * 0.08, 1.074, -0.19], [0.07, 0.022, 0.025], [0, 0, lato * 0.12]),
    );
    // --- Gambe: jeans, risvolto chiaro, scarpone con la suola ---
    const gamba = lato < 0 ? 'gambaSx' : 'gambaDx';
    pezzi.push(
      pezzo(gamba, 'cilindro', JEANS, [0, -0.14, 0], [0.08, 0.28, 0.08]),
      pezzo(gamba, 'cilindro', JEANS_CHIARO, [0, -0.28, 0], [0.09, 0.06, 0.09]),
      pezzo(gamba, 'sfera', SCARPONI, [0, -0.355, -0.035], [0.095, 0.075, 0.14]),
      pezzo(gamba, 'cilindro', SUOLA, [0, -0.405, -0.035], [0.095, 0.03, 0.14]),
    );
    // --- Braccia: manica e mano ---
    const braccio = lato < 0 ? 'braccioSx' : 'braccioDx';
    pezzi.push(
      pezzo(braccio, 'capsula', stoffa, [0, -0.14, 0], [0.068, 0.13, 0.068]),
      pezzo(braccio, 'sfera', PELLE, [0, -0.31, 0], [0.07, 0.07, 0.07]),
    );
  }
  // --- Ascia nella mano destra: manico, lama e filo lucido ---
  if (!senzaAscia) {
    pezzi.push(
      pezzo('braccioDx', 'cilindro', MANICO, [0, -0.3, -0.16], [0.024, 0.5, 0.024], [Math.PI / 2, 0, 0]),
      pezzo('braccioDx', 'scatola', LAMA, [0, -0.24, -0.37], [0.035, 0.16, 0.12]),
      pezzo('braccioDx', 'scatola', FILO, [0, -0.24, -0.437], [0.04, 0.17, 0.02]),
    );
  }
  return pezzi;
}

// Le forme unite, preparate una volta sola per ogni combinazione di colori
const giaPronte = new Map();
function partiPer(colori) {
  const chiave = JSON.stringify(colori);
  if (!giaPronte.has(chiave)) giaPronte.set(chiave, unisciPezzi(pezziBoscaiolo(colori)));
  return giaPronte.get(chiave);
}

// Elenco delle forme: ognuna dice a quale perno è attaccata e di che materiale è.
// La squadra della corsa le disegna tutte insieme in modo veloce.
export function partiBoscaiolo() {
  return partiPer({});
}

// Crea un boscaiolo come oggetto normale. Dentro c'è la "molla": il gruppo che
// le animazioni fanno rimbalzare, piegare e respirare (vedi animazioni.js).
export function creaBoscaiolo(colori = {}) {
  const radice = new THREE.Group();
  const molla = new THREE.Group();
  radice.add(molla);
  radice.userData.perni = costruisci(partiPer(colori), PERNI, molla);
  radice.userData.molla = molla;
  return radice;
}

// Un boscaiolo con altri colori, per riconoscere a colpo d'occhio i lavoratori
// (cacciatore, venditore, arciere). berretto/berrettoScuro: colori del berretto e del risvolto;
// giacca: colore che prende il posto della camicia a quadri; senzaAscia: senza l'ascia.
export function creaLavoratore({ berretto, berrettoScuro, giacca = null, senzaAscia = false }) {
  return creaBoscaiolo({ berretto, berrettoScuro, giacca, senzaAscia });
}
