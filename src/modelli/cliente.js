// =====================================================================
//  MODELLO DEL CLIENTE
//  Un abitante della montagna con cappotto e berretto colorati e la sciarpa.
//  Stesso stile e stesse proporzioni del boscaiolo (alto circa 1,25 m),
//  con gambe e braccia mobili per camminare. Guarda verso la Z negativa.
// =====================================================================

import * as THREE from 'three';
import { tinta } from './materiali.js';

const sfera = new THREE.SphereGeometry(1, 14, 10);
const mezzaSfera = new THREE.SphereGeometry(1, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2);
const cilindro = new THREE.CylinderGeometry(1, 1, 1, 12);
const capsula = new THREE.CapsuleGeometry(1, 1, 4, 12);

// Combinazioni di colori: ogni cliente ne pesca una a caso
const CAPPOTTI = [0x2f8fd8, 0x3fae5a, 0x8e5bd6, 0xf08a24, 0xe0457b, 0x2bb3a6];
const BERRETTI = [0xffd23f, 0xffffff, 0x2f4a7a, 0xff6b6b, 0x6bd16b];
const PELLI = [0xf5c49c, 0xe0a678, 0xb57a52, 0xf7d3b5];

export function creaCliente() {
  const scegli = (lista) => lista[Math.floor(Math.random() * lista.length)];
  const cappotto = scegli(CAPPOTTI);
  const berretto = scegli(BERRETTI);
  const pelle = scegli(PELLI);

  const radice = new THREE.Group();
  const pezzo = (genitore, geometria, colore, pos, scala) => {
    const m = new THREE.Mesh(geometria, tinta(colore));
    m.position.set(...pos);
    m.scale.set(...scala);
    m.castShadow = true;
    genitore.add(m);
    return m;
  };
  const perno = (pos) => {
    const g = new THREE.Group();
    g.position.set(...pos);
    radice.add(g);
    return g;
  };

  // Gambe con gli stivali
  const gambaSx = perno([-0.09, 0.42, 0]);
  const gambaDx = perno([0.09, 0.42, 0]);
  for (const g of [gambaSx, gambaDx]) {
    pezzo(g, cilindro, 0x3a3f4a, [0, -0.16, 0], [0.075, 0.32, 0.075]);
    pezzo(g, sfera, 0x2a1d14, [0, -0.36, -0.03], [0.08, 0.06, 0.12]);
  }

  // Cappotto, sciarpa, testa e berretto con il pon-pon
  pezzo(radice, capsula, cappotto, [0, 0.64, 0], [0.2, 0.18, 0.15]);
  pezzo(radice, cilindro, berretto, [0, 0.86, 0], [0.15, 0.07, 0.13]);
  pezzo(radice, sfera, pelle, [0, 1.02, 0], [0.19, 0.19, 0.19]);
  pezzo(radice, sfera, 0x1b1b1b, [-0.065, 1.05, -0.17], [0.024, 0.03, 0.02]);
  pezzo(radice, sfera, 0x1b1b1b, [0.065, 1.05, -0.17], [0.024, 0.03, 0.02]);
  pezzo(radice, sfera, 0xff8a8a, [0, 0.99, -0.19], [0.04, 0.035, 0.035]);
  pezzo(radice, mezzaSfera, berretto, [0, 1.08, 0], [0.2, 0.2, 0.2]);
  pezzo(radice, sfera, 0xffffff, [0, 1.3, 0], [0.055, 0.055, 0.055]);

  // Braccia
  const braccioSx = perno([-0.24, 0.78, 0]);
  const braccioDx = perno([0.24, 0.78, 0]);
  for (const b of [braccioSx, braccioDx]) {
    pezzo(b, capsula, cappotto, [0, -0.14, 0], [0.06, 0.13, 0.06]);
    pezzo(b, sfera, pelle, [0, -0.29, 0], [0.06, 0.06, 0.06]);
  }

  radice.userData.perni = { gambaSx, gambaDx, braccioSx, braccioDx };
  return radice;
}
