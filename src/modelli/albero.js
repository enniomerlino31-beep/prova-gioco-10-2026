// =====================================================================
//  MODELLO DELL'ABETE INNEVATO
//  Tronco marrone + tre "coni" verdi con la punta di neve.
//  Usato sia per gli alberi da abbattere sia per la foresta ai lati.
// =====================================================================

import * as THREE from 'three';
import { tinta, matrice } from './materiali.js';

const TRONCO = 0x6b4426;
const VERDE = 0x2e7d4f;
const VERDE_SCURO = 0x24663f;
const NEVE = 0xffffff;

const cono = new THREE.ConeGeometry(1, 1, 9);
const cilindro = new THREE.CylinderGeometry(1, 1, 1, 8);

// Pezzi dell'abete: forma, materiale e posizione (albero alto circa 3,3 metri)
function partiAbete() {
  return [
    { geometria: cilindro, materiale: tinta(TRONCO), matrice: matrice([0, 0.4, 0], [0, 0, 0], [0.2, 0.8, 0.2]) },
    { geometria: cono, materiale: tinta(VERDE_SCURO), matrice: matrice([0, 1.25, 0], [0, 0, 0], [1.15, 1.3, 1.15]) },
    { geometria: cono, materiale: tinta(NEVE), matrice: matrice([0, 1.55, 0], [0, 0.3, 0], [0.75, 0.7, 0.75]) },
    { geometria: cono, materiale: tinta(VERDE), matrice: matrice([0, 1.95, 0], [0, 0, 0], [0.88, 1.15, 0.88]) },
    { geometria: cono, materiale: tinta(NEVE), matrice: matrice([0, 2.22, 0], [0, 0.6, 0], [0.56, 0.6, 0.56]) },
    { geometria: cono, materiale: tinta(VERDE), matrice: matrice([0, 2.6, 0], [0, 0, 0], [0.58, 0.95, 0.58]) },
    { geometria: cono, materiale: tinta(NEVE), matrice: matrice([0, 2.88, 0], [0, 0.2, 0], [0.32, 0.45, 0.32]) },
  ];
}

// Un abete singolo (per gli alberi da tagliare)
export function creaAbete() {
  const gruppo = new THREE.Group();
  for (const parte of partiAbete()) {
    const mesh = new THREE.Mesh(parte.geometria, parte.materiale);
    mesh.applyMatrix4(parte.matrice);
    mesh.castShadow = true;
    gruppo.add(mesh);
  }
  return gruppo;
}

// Tanti abeti ai lati della pista, disegnati in un colpo solo (molto più veloce)
export function creaForestaDecorativa(lunghezzaTotale) {
  const metaPista = 5;
  const posizioni = [];
  for (let z = 40; z > -lunghezzaTotale - 60; z -= 2.2) {
    for (const lato of [-1, 1]) {
      // fila vicina alla pista + alberi sparsi più lontano
      posizioni.push(
        matrice(
          [lato * (metaPista + 2.2 + Math.random() * 3), 0, z + Math.random() * 2],
          [0, Math.random() * 6, 0],
          Array(3).fill(0.9 + Math.random() * 0.6)
        )
      );
      if (Math.random() < 0.7) {
        posizioni.push(
          matrice(
            [lato * (metaPista + 6 + Math.random() * 30), 0, z + Math.random() * 2],
            [0, Math.random() * 6, 0],
            Array(3).fill(1 + Math.random() * 1.2)
          )
        );
      }
    }
  }

  return creaAbetiIstanziati(posizioni);
}

// Disegna tanti abeti in un colpo solo. "posizioni" è un elenco di matrici (posto, rotazione, grandezza).
export function creaAbetiIstanziati(posizioni) {
  const foresta = new THREE.Group();
  const finale = new THREE.Matrix4();
  for (const parte of partiAbete()) {
    const istanze = new THREE.InstancedMesh(parte.geometria, parte.materiale, posizioni.length);
    posizioni.forEach((m, i) => {
      finale.multiplyMatrices(m, parte.matrice);
      istanze.setMatrixAt(i, finale);
    });
    foresta.add(istanze);
  }
  return foresta;
}
