// =====================================================================
//  MODELLO DEL BOSCAIOLO
//  Costruito con forme semplici: berretto rosso, barba castana,
//  camicia a quadri, bretelle, jeans arrotolati, scarponi e ascia.
//  Alto circa 1,25 metri. Guarda verso la Z negativa (la direzione di corsa).
//
//  COME SOSTITUIRLO IN FUTURO con un modello 3D vero:
//  basta cambiare questo file. La squadra usa solo "partiBoscaiolo()"
//  (l'elenco dei pezzi) e "PERNI" (i punti in cui gambe e braccia ruotano).
// =====================================================================

import * as THREE from 'three';
import { tinta, materialeQuadri, matrice } from './materiali.js';

// Colori del personaggio
const PELLE = 0xf5c49c;
const PELLE_SCURA = 0xe9a27f;
const BARBA = 0x7b4a22;
const BERRETTO = 0xd8262e;
const BERRETTO_SCURO = 0xa91c22;
const JEANS = 0x2f5fb3;
const JEANS_CHIARO = 0x7aa3e6;
const SCARPONI = 0x6b3f1f;
const BRETELLE = 0x2a1a10;
const MANICO = 0x9a6234;
const LAMA = 0xc9d2dc;
const NERO = 0x1b1b1b;

// Punti attorno a cui ruotano le parti mobili (anche e spalle)
export const PERNI = {
  corpo: new THREE.Vector3(0, 0, 0),
  gambaSx: new THREE.Vector3(-0.09, 0.42, 0),
  gambaDx: new THREE.Vector3(0.09, 0.42, 0),
  braccioSx: new THREE.Vector3(-0.23, 0.78, 0),
  braccioDx: new THREE.Vector3(0.23, 0.78, 0),
};

// Geometrie riusate (create una volta sola)
const G = {
  sfera: new THREE.SphereGeometry(1, 14, 10),
  mezzaSfera: new THREE.SphereGeometry(1, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2),
  cilindro: new THREE.CylinderGeometry(1, 1, 1, 12),
  scatola: new THREE.BoxGeometry(1, 1, 1),
  capsula: new THREE.CapsuleGeometry(1, 1, 4, 12),
};

let partiGiaCreate = null;

// Elenco dei pezzi: ognuno dice a quale perno è attaccato, che forma ha,
// di che materiale è e dove si trova rispetto al perno.
export function partiBoscaiolo() {
  if (partiGiaCreate) return partiGiaCreate;
  const p = (perno, geometria, materiale, pos, rot, scala) => ({
    perno,
    geometria,
    materiale,
    matrice: matrice(pos, rot, scala),
  });
  const quadri = materialeQuadri();

  partiGiaCreate = [
    // --- Gambe (jeans, risvolto chiaro, scarpone) ---
    p('gambaSx', G.cilindro, tinta(JEANS), [0, -0.15, 0], [0, 0, 0], [0.075, 0.3, 0.075]),
    p('gambaSx', G.cilindro, tinta(JEANS_CHIARO), [0, -0.29, 0], [0, 0, 0], [0.088, 0.06, 0.088]),
    p('gambaSx', G.scatola, tinta(SCARPONI), [0, -0.36, -0.03], [0, 0, 0], [0.15, 0.12, 0.24]),
    p('gambaDx', G.cilindro, tinta(JEANS), [0, -0.15, 0], [0, 0, 0], [0.075, 0.3, 0.075]),
    p('gambaDx', G.cilindro, tinta(JEANS_CHIARO), [0, -0.29, 0], [0, 0, 0], [0.088, 0.06, 0.088]),
    p('gambaDx', G.scatola, tinta(SCARPONI), [0, -0.36, -0.03], [0, 0, 0], [0.15, 0.12, 0.24]),

    // --- Corpo: bacino, camicia a quadri, bretelle ---
    p('corpo', G.scatola, tinta(JEANS), [0, 0.45, 0], [0, 0, 0], [0.32, 0.12, 0.2]),
    p('corpo', G.capsula, quadri, [0, 0.65, 0], [0, 0, 0], [0.19, 0.14, 0.14]),
    p('corpo', G.scatola, tinta(BRETELLE), [-0.08, 0.64, -0.135], [0, 0, 0], [0.04, 0.32, 0.02]),
    p('corpo', G.scatola, tinta(BRETELLE), [0.08, 0.64, -0.135], [0, 0, 0], [0.04, 0.32, 0.02]),

    // --- Testa: viso, barba, baffi, naso, occhi ---
    p('corpo', G.sfera, tinta(PELLE), [0, 0.99, 0], [0, 0, 0], [0.2, 0.2, 0.2]),
    p('corpo', G.sfera, tinta(BARBA), [0, 0.9, -0.08], [0, 0, 0], [0.18, 0.17, 0.14]),
    p('corpo', G.sfera, tinta(BARBA), [0, 0.95, -0.18], [0, 0, 0], [0.1, 0.035, 0.04]),
    p('corpo', G.sfera, tinta(PELLE_SCURA), [0, 0.99, -0.2], [0, 0, 0], [0.05, 0.045, 0.045]),
    p('corpo', G.sfera, tinta(NERO), [-0.07, 1.05, -0.175], [0, 0, 0], [0.026, 0.032, 0.02]),
    p('corpo', G.sfera, tinta(NERO), [0.07, 1.05, -0.175], [0, 0, 0], [0.026, 0.032, 0.02]),

    // --- Berretto di lana rosso con risvolto e pon-pon ---
    p('corpo', G.mezzaSfera, tinta(BERRETTO), [0, 1.06, 0], [0, 0, 0], [0.21, 0.22, 0.21]),
    p('corpo', G.cilindro, tinta(BERRETTO_SCURO), [0, 1.07, 0], [0, 0, 0], [0.215, 0.07, 0.215]),
    p('corpo', G.sfera, tinta(BERRETTO), [0, 1.3, 0.02], [0, 0, 0], [0.06, 0.06, 0.06]),

    // --- Braccia: manica a quadri e mano ---
    p('braccioSx', G.capsula, quadri, [0, -0.14, 0], [0, 0, 0], [0.065, 0.14, 0.065]),
    p('braccioSx', G.sfera, tinta(PELLE), [0, -0.3, 0], [0, 0, 0], [0.065, 0.065, 0.065]),
    p('braccioDx', G.capsula, quadri, [0, -0.14, 0], [0, 0, 0], [0.065, 0.14, 0.065]),
    p('braccioDx', G.sfera, tinta(PELLE), [0, -0.3, 0], [0, 0, 0], [0.065, 0.065, 0.065]),

    // --- Ascia nella mano destra: manico e lama ---
    p('braccioDx', G.cilindro, tinta(MANICO), [0, -0.3, -0.16], [Math.PI / 2, 0, 0], [0.022, 0.5, 0.022]),
    p('braccioDx', G.scatola, tinta(LAMA), [0, -0.24, -0.37], [0, 0, 0], [0.035, 0.16, 0.12]),
  ];
  return partiGiaCreate;
}

// Crea un singolo boscaiolo come oggetto normale (utile per menu e schermate future).
// La squadra invece usa direttamente "partiBoscaiolo()" per disegnarne tanti in modo veloce.
export function creaBoscaiolo() {
  const radice = new THREE.Group();
  const gruppiPerno = {};
  for (const [nome, posizione] of Object.entries(PERNI)) {
    const g = new THREE.Group();
    g.position.copy(posizione);
    radice.add(g);
    gruppiPerno[nome] = g;
  }
  for (const parte of partiBoscaiolo()) {
    const mesh = new THREE.Mesh(parte.geometria, parte.materiale);
    mesh.applyMatrix4(parte.matrice);
    mesh.castShadow = true;
    gruppiPerno[parte.perno].add(mesh);
  }
  radice.userData.perni = gruppiPerno;
  return radice;
}
