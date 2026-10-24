// =====================================================================
//  MODELLO DEL CARRO
//  Pianale di legno, sponde basse, quattro ruote, un timone davanti.
//  Sopra: una PILA di tronchi (parte anteriore) e un mucchietto di CARNE
//  (parte posteriore), che crescono man mano che si carica.
//  Misure del carro vuoto: largo 1,8 m, lungo 2,4 m. Guarda verso la Z negativa.
// =====================================================================

import * as THREE from 'three';
import { tinta } from './materiali.js';
import { partiCarne } from './carne.js';

export const LUNGHEZZA_CARRO = 2.4;
const LARGHEZZA = 1.8;

// Dove stanno le due pile sul carro (posizione lungo il carro)
export const Z_PILA_TRONCHI = -0.3;
export const Z_PILA_CARNE = 0.85;
const ALTEZZA_PIANALE = 0.71;  // il piano su cui appoggia il carico
const RAGGIO_TRONCO = 0.15;
const ALTEZZA_STRATO = 0.26;   // altezza di ogni strato di tronchi

const LEGNO = 0xa8693a;
const LEGNO_SCURO = 0x6e4022;
const FERRO = 0x5a6370;

// Geometria del tronco: corteccia + cerchi chiari alle estremità
export const geometriaTronco = new THREE.CylinderGeometry(RAGGIO_TRONCO, RAGGIO_TRONCO, 1.7, 10);
export const materialiTronco = [tinta(0x7a4520), tinta(0xf0c98e), tinta(0xf0c98e)];

// Posizione di ogni tronco nella pila (a piramide bassa e larga: tanti sotto, sempre meno sopra).
// La pila resta bassa apposta: se fosse alta, vista da dietro coprirebbe i boscaioli davanti al carro.
function postiTronchi(quanti) {
  const posti = [];
  const perStrato = [6, 6, 5, 5, 4, 4, 3, 3, 2, 2];
  for (let strato = 0; posti.length < quanti; strato++) {
    const n = perStrato[Math.min(strato, perStrato.length - 1)];
    for (let i = 0; i < n && posti.length < quanti; i++) {
      posti.push(
        new THREE.Vector3(
          (i - (n - 1) / 2) * RAGGIO_TRONCO * 2.05,
          ALTEZZA_PIANALE + RAGGIO_TRONCO + strato * ALTEZZA_STRATO,
          Z_PILA_TRONCHI + Math.sin(posti.length * 7.3) * 0.06 // piccole irregolarità
        )
      );
    }
  }
  return posti;
}

// Posizione di ogni pezzo di carne (2 file x 3, a strati)
function postiCarne(quanti) {
  const posti = [];
  for (let i = 0; i < quanti; i++) {
    const strato = Math.floor(i / 6);
    const k = i % 6;
    posti.push(
      new THREE.Vector3(((k % 3) - 1) * 0.45, ALTEZZA_PIANALE + 0.12 + strato * 0.2, Z_PILA_CARNE + (Math.floor(k / 3) - 0.5) * 0.36)
    );
  }
  return posti;
}

export function creaModelloCarro(tronchiMassimi, pezziCarneMassimi) {
  const gruppo = new THREE.Group();
  const scatola = new THREE.BoxGeometry(1, 1, 1);

  const aggiungi = (geometria, colore, pos, scala) => {
    const m = new THREE.Mesh(geometria, tinta(colore));
    m.position.set(...pos);
    m.scale.set(...scala);
    m.castShadow = true;
    gruppo.add(m);
    return m;
  };

  // Pianale e sponde basse (così il carico si vede bene)
  aggiungi(scatola, LEGNO, [0, 0.62, 0], [LARGHEZZA, 0.18, LUNGHEZZA_CARRO]);
  aggiungi(scatola, LEGNO_SCURO, [-LARGHEZZA / 2, 0.76, 0], [0.1, 0.16, LUNGHEZZA_CARRO]);
  aggiungi(scatola, LEGNO_SCURO, [LARGHEZZA / 2, 0.76, 0], [0.1, 0.16, LUNGHEZZA_CARRO]);
  aggiungi(scatola, LEGNO_SCURO, [0, 0.76, LUNGHEZZA_CARRO / 2], [LARGHEZZA, 0.16, 0.1]);
  aggiungi(scatola, LEGNO_SCURO, [0, 0.76, -LUNGHEZZA_CARRO / 2], [LARGHEZZA, 0.16, 0.1]);
  // Paletti agli angoli che "tengono" la pila
  for (const x of [-1, 1]) {
    for (const z of [-1, 1]) {
      aggiungi(scatola, LEGNO_SCURO, [x * (LARGHEZZA / 2 - 0.02), 1.0, z * (LUNGHEZZA_CARRO / 2 - 0.05)], [0.1, 0.65, 0.1]);
    }
  }

  // Timone (il palo con cui la squadra tira il carro) e traversa
  aggiungi(scatola, LEGNO_SCURO, [0, 0.55, -LUNGHEZZA_CARRO / 2 - 0.9], [0.12, 0.12, 1.8]);
  aggiungi(scatola, LEGNO_SCURO, [0, 0.55, -LUNGHEZZA_CARRO / 2 - 1.75], [1.2, 0.12, 0.12]);

  // Ruote (ognuna con il mozzo di ferro)
  const geometriaRuota = new THREE.CylinderGeometry(0.4, 0.4, 0.18, 16);
  const geometriaMozzo = new THREE.CylinderGeometry(0.12, 0.12, 0.22, 8);
  const ruote = [];
  for (const x of [-1, 1]) {
    for (const z of [-0.75, 0.75]) {
      const ruota = new THREE.Group();
      const r = new THREE.Mesh(geometriaRuota, tinta(LEGNO_SCURO));
      r.rotation.z = Math.PI / 2;
      r.castShadow = true;
      const m = new THREE.Mesh(geometriaMozzo, tinta(FERRO));
      m.rotation.z = Math.PI / 2;
      // Una "razza" chiara per vedere la ruota girare
      const razza = new THREE.Mesh(scatola, tinta(LEGNO));
      razza.scale.set(0.2, 0.7, 0.08);
      ruota.add(r, m, razza);
      ruota.position.set(x * (LARGHEZZA / 2 + 0.1), 0.4, z);
      gruppo.add(ruota);
      ruote.push(ruota);
    }
  }

  // --- Pila di tronchi: disegnati tutti insieme; se ne mostrano tanti quanti il carico ---
  // La pila sta in un gruppo a parte, così possiamo "ingrossarla" (cataste) quando i tronchi sono troppi
  const pila = new THREE.Group();
  gruppo.add(pila);
  const tronchi = new THREE.InstancedMesh(geometriaTronco, materialiTronco, tronchiMassimi);
  tronchi.castShadow = true;
  const m4 = new THREE.Matrix4();
  const sdraiato = new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.PI / 2, 0, 0));
  const uno = new THREE.Vector3(1, 1, 1);
  const posti = postiTronchi(tronchiMassimi);
  posti.forEach((p, i) => tronchi.setMatrixAt(i, m4.compose(p, sdraiato, uno)));
  tronchi.count = 0;
  pila.add(tronchi);

  // --- Mucchio di carne (un'InstancedMesh per ogni pezzo del modello della carne) ---
  const postiDellaCarne = postiCarne(pezziCarneMassimi);
  const carne = partiCarne().map((parte) => {
    const mesh = new THREE.InstancedMesh(parte.geometria, parte.materiale, pezziCarneMassimi);
    mesh.castShadow = true;
    const finale = new THREE.Matrix4();
    postiDellaCarne.forEach((p, i) => {
      const girato = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, i * 1.7, 0));
      finale.multiplyMatrices(m4.compose(p, girato, uno), parte.matrice);
      mesh.setMatrixAt(i, finale);
    });
    mesh.count = 0;
    gruppo.add(mesh);
    return mesh;
  });

  return {
    gruppo,
    ruote,
    pila,
    tronchi,
    carne,
    // Punto (nel carro) in cima alla pila di tronchi / di carne, dove atterrano gli oggetti in volo
    cimaTronchi: (quanti) => {
      const p = posti[Math.max(0, Math.min(quanti, posti.length - 1))];
      return new THREE.Vector3(0, p.y + 0.1, Z_PILA_TRONCHI);
    },
    cimaCarne: (quanti) => {
      const p = postiDellaCarne[Math.max(0, Math.min(quanti, postiDellaCarne.length - 1))];
      return new THREE.Vector3(p.x, p.y + 0.1, p.z);
    },
  };
}
