// =====================================================================
//  MODELLO DEI SOLDI
//  Una mazzetta di banconote verdi con la fascetta bianca, e una moneta d'oro.
// =====================================================================

import * as THREE from 'three';
import { tinta, matrice } from './materiali.js';

const scatola = new THREE.BoxGeometry(1, 1, 1);
const cilindro = new THREE.CylinderGeometry(1, 1, 1, 16);

let partiGiaCreate = null;

// Pezzi della mazzetta (servono anche per disegnarne tante insieme nella pila)
export function partiMazzetta() {
  if (partiGiaCreate) return partiGiaCreate;
  partiGiaCreate = [
    { geometria: scatola, materiale: tinta(0x5cb85c), matrice: matrice([0, 0.04, 0], [0, 0, 0], [0.4, 0.08, 0.2]) },
    { geometria: scatola, materiale: tinta(0x8fdc7c), matrice: matrice([0, 0.081, 0], [0, 0, 0], [0.34, 0.004, 0.15]) },
    { geometria: scatola, materiale: tinta(0xf5f0e0), matrice: matrice([0, 0.04, 0], [0, 0, 0], [0.07, 0.085, 0.205]) },
  ];
  return partiGiaCreate;
}

export function creaMazzetta() {
  const gruppo = new THREE.Group();
  for (const parte of partiMazzetta()) {
    const mesh = new THREE.Mesh(parte.geometria, parte.materiale);
    mesh.applyMatrix4(parte.matrice);
    mesh.castShadow = true;
    gruppo.add(mesh);
  }
  return gruppo;
}

export function creaMoneta() {
  const moneta = new THREE.Mesh(cilindro, tinta(0xf2c230));
  moneta.scale.set(0.12, 0.03, 0.12);
  moneta.castShadow = true;
  return moneta;
}
