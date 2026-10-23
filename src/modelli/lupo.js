// =====================================================================
//  MODELLO DEL LUPO
//  Stesso stile cartoon dell'orso: pelo blu-grigio scuro, petto e muso
//  color crema, sopracciglia arrabbiate, artigli scuri.
//  Lungo circa 1,1 metri. Guarda verso la Z negativa (poi lo giriamo).
//
//  COME SOSTITUIRLO IN FUTURO con un modello 3D vero: basta che
//  "creaLupo()" restituisca un gruppo e l'elenco delle zampe da animare.
// =====================================================================

import * as THREE from 'three';
import { tinta } from './materiali.js';

const PELO = 0x4d5b7c;
const PELO_SCURO = 0x3a4561;
const CREMA = 0xf1e2c4;
const NERO = 0x1b1b22;
const BIANCO = 0xffffff;
const ARTIGLI = 0x2a2a33;

const sfera = new THREE.SphereGeometry(1, 14, 10);
const cilindro = new THREE.CylinderGeometry(1, 1, 1, 10);
const cono = new THREE.ConeGeometry(1, 1, 10);
const scatola = new THREE.BoxGeometry(1, 1, 1);
const capsula = new THREE.CapsuleGeometry(1, 1, 4, 12);

export function creaLupo() {
  const gruppo = new THREE.Group();
  const corpo = new THREE.Group(); // tutto tranne le zampe (serve per farlo "saltellare")
  gruppo.add(corpo);

  const pezzo = (genitore, geometria, colore, pos, scala, rot = [0, 0, 0]) => {
    const m = new THREE.Mesh(geometria, tinta(colore));
    m.position.set(...pos);
    m.scale.set(...scala);
    m.rotation.set(...rot);
    m.castShadow = true;
    genitore.add(m);
    return m;
  };

  // Corpo, petto e pancia color crema
  pezzo(corpo, capsula, PELO, [0, 0.58, 0.02], [0.27, 0.32, 0.27], [Math.PI / 2, 0, 0]);
  pezzo(corpo, sfera, CREMA, [0, 0.52, -0.3], [0.2, 0.22, 0.16]);

  // Testa, muso crema, naso
  pezzo(corpo, sfera, PELO, [0, 0.85, -0.46], [0.25, 0.23, 0.24]);
  pezzo(corpo, sfera, CREMA, [0, 0.77, -0.66], [0.14, 0.11, 0.17]);
  pezzo(corpo, sfera, NERO, [0, 0.81, -0.82], [0.055, 0.045, 0.045]);
  // Bocca arrabbiata (una linea scura)
  pezzo(corpo, scatola, NERO, [0, 0.71, -0.76], [0.1, 0.018, 0.02]);

  // Occhi bianchi con la pupilla e sopracciglia arrabbiate (inclinate verso il centro)
  for (const lato of [-1, 1]) {
    pezzo(corpo, sfera, BIANCO, [lato * 0.09, 0.9, -0.64], [0.055, 0.06, 0.03]);
    pezzo(corpo, sfera, NERO, [lato * 0.085, 0.89, -0.668], [0.028, 0.032, 0.015]);
    pezzo(corpo, scatola, NERO, [lato * 0.095, 0.97, -0.65], [0.13, 0.035, 0.03], [0, 0, lato * 0.45]);
    // Orecchie a punta con l'interno crema
    pezzo(corpo, cono, PELO_SCURO, [lato * 0.13, 1.08, -0.42], [0.09, 0.2, 0.06], [0, 0, -lato * 0.25]);
    pezzo(corpo, cono, CREMA, [lato * 0.13, 1.06, -0.45], [0.05, 0.13, 0.03], [0, 0, -lato * 0.25]);
  }

  // Coda folta con la punta crema
  pezzo(corpo, cono, PELO, [0, 0.72, 0.52], [0.11, 0.45, 0.11], [-1.0, 0, 0]);
  pezzo(corpo, sfera, CREMA, [0, 0.85, 0.7], [0.07, 0.07, 0.07]);

  // Zampe: ognuna in un gruppo con il perno all'anca, per farle muovere
  const zampe = [];
  for (const [x, z] of [[-0.15, -0.28], [0.15, -0.28], [-0.15, 0.3], [0.15, 0.3]]) {
    const zampa = new THREE.Group();
    zampa.position.set(x, 0.5, z);
    pezzo(zampa, cilindro, PELO, [0, -0.22, 0], [0.075, 0.42, 0.075]);
    pezzo(zampa, sfera, PELO_SCURO, [0, -0.44, -0.02], [0.09, 0.06, 0.11]);
    // artigli scuri
    for (const ax of [-0.04, 0, 0.04]) pezzo(zampa, cono, ARTIGLI, [ax, -0.45, -0.12], [0.018, 0.06, 0.018], [-Math.PI / 2, 0, 0]);
    gruppo.add(zampa);
    zampe.push(zampa);
  }

  return { gruppo, corpo, zampe };
}
