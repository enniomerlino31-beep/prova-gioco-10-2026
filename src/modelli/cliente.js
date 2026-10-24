// =====================================================================
//  MODELLO DEL CLIENTE
//  Un abitante della montagna nello stesso stile cartoon del boscaiolo:
//  testa grande, guance rosa, cappotto lungo con i bottoni, sciarpa,
//  berretto con il pon-pon, muffole e stivali.
//  Alto circa 1,3 metri, con gambe e braccia mobili. Guarda verso la Z negativa.
// =====================================================================

import * as THREE from 'three';
import { PERNI } from './boscaiolo.js';
import { pezzo, unisciPezzi, costruisci } from './pezzi.js';

// Vestiti già abbinati: [cappotto, berretto e muffole, sciarpa, capelli]. Ogni cliente ne pesca uno a caso.
const VESTITI = [
  [0x2f8fd8, 0xffd23f, 0xe0453b, 0x5a3418],
  [0x3fae5a, 0xffffff, 0xd8262e, 0x2a1a10],
  [0x8e5bd6, 0xff8fb0, 0xffffff, 0xe0b050],
  [0xf08a24, 0x2f4a7a, 0xffd23f, 0x8a4a20],
  [0xe0457b, 0xffffff, 0x6fc3ee, 0x2a1a10],
  [0x2bb3a6, 0xff6b6b, 0xffd23f, 0x5a3418],
  [0x9a5b34, 0x6bd16b, 0xf08a24, 0xe0b050],
  [0xc8323a, 0x2f4a7a, 0xffffff, 0x8a4a20],
];
const PELLI = [0xf5c49c, 0xe0a678, 0xb57a52, 0xf7d3b5];
const PANTALONI = 0x3a3f4a;
const STIVALI = 0x5a3a24;
const SUOLA = 0x2a1d14;
const BOTTONI = 0x3a2a1a;
const GUANCE = 0xf08f80;
const NERO = 0x1b1b1b;
const BIANCO = 0xffffff;

// Un colore un po' più scuro (per il risvolto del berretto)
const scurisci = (colore, quanto) => new THREE.Color(colore).multiplyScalar(quanto).getHex();

function pezziCliente(vestito, pelle) {
  const [cappotto, berretto, sciarpa, capelli] = VESTITI[vestito];
  const naso = new THREE.Color(pelle).lerp(new THREE.Color(0xe0705a), 0.3).getHex();
  const pezzi = [
    // Cappotto lungo con i bottoni, sciarpa con la coda che pende davanti
    pezzo('corpo', 'capsula', cappotto, [0, 0.62, 0], [0.205, 0.15, 0.165]),
    pezzo('corpo', 'sfera', BOTTONI, [0, 0.68, -0.163], [0.025, 0.025, 0.012]),
    pezzo('corpo', 'sfera', BOTTONI, [0, 0.57, -0.163], [0.025, 0.025, 0.012]),
    pezzo('corpo', 'cilindro', sciarpa, [0, 0.84, 0], [0.17, 0.07, 0.15]),
    pezzo('corpo', 'scatola', sciarpa, [0.08, 0.72, -0.165], [0.06, 0.18, 0.03], [0, 0, 0.1]),

    // Testa: viso, capelli che spuntano dal berretto, naso, sorriso
    pezzo('corpo', 'sfera', pelle, [0, 1.02, 0], [0.22, 0.21, 0.21]),
    pezzo('corpo', 'sfera', capelli, [0, 1.04, 0.05], [0.225, 0.18, 0.2]),
    pezzo('corpo', 'sfera', naso, [0, 1.0, -0.21], [0.04, 0.036, 0.04]),
    pezzo('corpo', 'sfera', NERO, [0, 0.94, -0.197], [0.035, 0.012, 0.01]),

    // Berretto con il risvolto e il pon-pon bianco
    pezzo('corpo', 'mezzaSfera', berretto, [0, 1.1, 0], [0.23, 0.22, 0.23]),
    pezzo('corpo', 'cilindro', scurisci(berretto, 0.78), [0, 1.12, 0], [0.235, 0.07, 0.235]),
    pezzo('corpo', 'sfera', BIANCO, [0, 1.33, 0], [0.065, 0.065, 0.065]),
  ];
  for (const lato of [-1, 1]) {
    pezzi.push(
      pezzo('corpo', 'sfera', pelle, [lato * 0.215, 1.0, 0], [0.04, 0.055, 0.035]),
      pezzo('corpo', 'sfera', NERO, [lato * 0.072, 1.045, -0.19], [0.028, 0.038, 0.02]),
      pezzo('corpo', 'sfera', BIANCO, [lato * 0.065, 1.058, -0.206], [0.009, 0.011, 0.006]),
      pezzo('corpo', 'sfera', GUANCE, [lato * 0.12, 0.985, -0.17], [0.045, 0.032, 0.028]),
    );
    // Gambe con gli stivali
    const gamba = lato < 0 ? 'gambaSx' : 'gambaDx';
    pezzi.push(
      pezzo(gamba, 'cilindro', PANTALONI, [0, -0.15, 0], [0.075, 0.3, 0.075]),
      pezzo(gamba, 'sfera', STIVALI, [0, -0.355, -0.03], [0.09, 0.075, 0.13]),
      pezzo(gamba, 'cilindro', SUOLA, [0, -0.405, -0.03], [0.09, 0.03, 0.13]),
    );
    // Braccia con le muffole dello stesso colore del berretto
    const braccio = lato < 0 ? 'braccioSx' : 'braccioDx';
    pezzi.push(
      pezzo(braccio, 'capsula', cappotto, [0, -0.14, 0], [0.062, 0.13, 0.062]),
      pezzo(braccio, 'sfera', berretto, [0, -0.31, 0], [0.068, 0.068, 0.068]),
    );
  }
  return pezzi;
}

// Le forme unite, preparate una volta sola per ogni combinazione (al massimo 8 vestiti x 4 pelli)
const giaPronte = new Map();

export function creaCliente() {
  const vestito = Math.floor(Math.random() * VESTITI.length);
  const pelle = PELLI[Math.floor(Math.random() * PELLI.length)];
  const chiave = `${vestito}|${pelle}`;
  if (!giaPronte.has(chiave)) giaPronte.set(chiave, unisciPezzi(pezziCliente(vestito, pelle)));

  const radice = new THREE.Group();
  const molla = new THREE.Group(); // il gruppo che le animazioni fanno rimbalzare e respirare
  radice.add(molla);
  radice.userData.perni = costruisci(giaPronte.get(chiave), PERNI, molla);
  radice.userData.molla = molla;
  return radice;
}
