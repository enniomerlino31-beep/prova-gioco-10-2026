// =====================================================================
//  MODELLO DELLA CARNE
//  Un "cosciotto" da cartone animato: polpa rossa con il bordo chiaro
//  e un osso bianco che spunta. Lungo circa 60 cm.
// =====================================================================

import * as THREE from 'three';
import { tinta, matrice } from './materiali.js';

const sfera = new THREE.SphereGeometry(1, 12, 8);
const cilindro = new THREE.CylinderGeometry(1, 1, 1, 8);

let partiGiaCreate = null;

// Elenco dei pezzi (serve per disegnarne tanti insieme sul carro)
export function partiCarne() {
  if (partiGiaCreate) return partiGiaCreate;
  partiGiaCreate = [
    { geometria: sfera, materiale: tinta(0xf3a7a0), matrice: matrice([-0.05, -0.02, 0], [0, 0, 0], [0.27, 0.12, 0.21]) },
    { geometria: sfera, materiale: tinta(0xc8392f), matrice: matrice([-0.05, 0.02, 0], [0, 0, 0], [0.25, 0.13, 0.19]) },
    { geometria: cilindro, materiale: tinta(0xfaf3e3), matrice: matrice([0.24, 0, 0], [0, 0, Math.PI / 2], [0.045, 0.24, 0.045]) },
    { geometria: sfera, materiale: tinta(0xfaf3e3), matrice: matrice([0.37, 0, 0.045], [0, 0, 0], [0.06, 0.06, 0.06]) },
    { geometria: sfera, materiale: tinta(0xfaf3e3), matrice: matrice([0.37, 0, -0.045], [0, 0, 0], [0.06, 0.06, 0.06]) },
  ];
  return partiGiaCreate;
}

// Un pezzo di carne singolo (per quella che vola verso il carro)
export function creaCarne() {
  const gruppo = new THREE.Group();
  for (const parte of partiCarne()) {
    const mesh = new THREE.Mesh(parte.geometria, parte.materiale);
    mesh.applyMatrix4(parte.matrice);
    mesh.castShadow = true;
    gruppo.add(mesh);
  }
  return gruppo;
}
