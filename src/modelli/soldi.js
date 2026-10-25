// =====================================================================
//  MODELLO DEI SOLDI: nel gioco i soldi sono sempre MONETE d'oro
//  Una moneta (con il bordo più scuro e la faccia più chiara) e un
//  mucchietto di monete che vola quando si paga o si incassa.
// =====================================================================

import * as THREE from 'three';
import { tinta, matrice } from './materiali.js';

const cilindro = new THREE.CylinderGeometry(1, 1, 1, 16);

let partiGiaCreate = null;

// Pezzi di una moneta (servono anche per disegnarne tante insieme nella pila): il bordo d'oro scuro
// e, appena sopra, la faccia più chiara
export function partiMoneta() {
  if (partiGiaCreate) return partiGiaCreate;
  partiGiaCreate = [
    { geometria: cilindro, materiale: tinta(0xe0a420), matrice: matrice([0, 0.025, 0], [0, 0, 0], [0.17, 0.05, 0.17]) },
    { geometria: cilindro, materiale: tinta(0xf6c83b), matrice: matrice([0, 0.04, 0], [0, 0, 0], [0.13, 0.025, 0.13]) },
  ];
  return partiGiaCreate;
}

// Un mucchietto di tre monete, un po' storte (quello che vola quando si paga o si incassa)
export function creaMucchietto() {
  const gruppo = new THREE.Group();
  for (let i = 0; i < 3; i++) {
    const moneta = new THREE.Group();
    for (const parte of partiMoneta()) {
      const mesh = new THREE.Mesh(parte.geometria, parte.materiale);
      mesh.applyMatrix4(parte.matrice);
      mesh.castShadow = true;
      moneta.add(mesh);
    }
    moneta.position.set((i - 1) * 0.06, i * 0.055, (i % 2) * 0.05);
    moneta.rotation.set(0.15 * (i - 1), 0, 0.1 * i);
    gruppo.add(moneta);
  }
  return gruppo;
}

export function creaMoneta() {
  const moneta = new THREE.Mesh(cilindro, tinta(0xf2c230));
  moneta.scale.set(0.12, 0.03, 0.12);
  moneta.castShadow = true;
  return moneta;
}
