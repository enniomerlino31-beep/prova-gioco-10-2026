// =====================================================================
//  PEZZI UNITI: personaggi leggeri anche sul telefono
//  Un personaggio è fatto di tante forme semplici (sfere, cilindri...).
//  Disegnarle una per una costa: per questo qui le forme che si muovono
//  insieme (stesso "perno") vengono unite in una forma sola, con i colori
//  dipinti direttamente sui suoi punti. Così un boscaiolo intero si
//  disegna con pochissimi pezzi, anche se ha tanti dettagli.
// =====================================================================

import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

// Un solo materiale per tutte le forme colorate: il colore sta nei punti della forma
const MATERIALE_COLORI = new THREE.MeshLambertMaterial({ vertexColors: true });

// Forme di base riusate da tutti i modelli (create una volta sola)
export const FORME = {
  sfera: new THREE.SphereGeometry(1, 14, 10),
  mezzaSfera: new THREE.SphereGeometry(1, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2),
  cilindro: new THREE.CylinderGeometry(1, 1, 1, 12),
  scatola: new THREE.BoxGeometry(1, 1, 1),
  capsula: new THREE.CapsuleGeometry(1, 1, 4, 12),
  cono: new THREE.ConeGeometry(1, 1, 10),
  ciambella: new THREE.TorusGeometry(1, 0.35, 8, 16), // in piedi: per sdraiarla si gira di 90 gradi sull'asse x
};

// Un pezzo: su quale perno sta, che forma ha, di che colore è (un numero come 0xff0000,
// oppure un materiale speciale come la stoffa a quadri) e dove si trova rispetto al perno.
export function pezzo(perno, forma, colore, pos, scala, rot = [0, 0, 0]) {
  return { perno, forma, colore, pos, scala, rot };
}

// Unisce i pezzi: una forma per ogni perno (più una per ogni materiale speciale).
// Restituisce un elenco di { perno, geometria, materiale }.
export function unisciPezzi(pezzi) {
  const gruppi = new Map();
  const matrice = new THREE.Matrix4();
  const colore = new THREE.Color();
  for (const p of pezzi) {
    const materiale = typeof p.colore === 'number' ? MATERIALE_COLORI : p.colore;
    const chiave = `${p.perno}|${materiale.uuid}`;
    if (!gruppi.has(chiave)) gruppi.set(chiave, { perno: p.perno, materiale, forme: [] });
    // "forma" è il nome di una forma di base, oppure una geometria già pronta (es. un prisma)
    const forma = (typeof p.forma === 'string' ? FORME[p.forma] : p.forma).clone();
    matrice.compose(
      new THREE.Vector3(...p.pos),
      new THREE.Quaternion().setFromEuler(new THREE.Euler(...p.rot)),
      new THREE.Vector3(...p.scala)
    );
    forma.applyMatrix4(matrice);
    if (materiale === MATERIALE_COLORI) {
      // dipinge tutti i punti della forma con il colore del pezzo
      colore.setHex(p.colore);
      const n = forma.attributes.position.count;
      const colori = new Float32Array(n * 3);
      for (let i = 0; i < n; i++) colore.toArray(colori, i * 3);
      forma.setAttribute('color', new THREE.BufferAttribute(colori, 3));
    }
    gruppi.get(chiave).forme.push(forma);
  }
  return [...gruppi.values()].map((g) => {
    const geometria = mergeGeometries(g.forme);
    for (const forma of g.forme) forma.dispose();
    return { perno: g.perno, geometria, materiale: g.materiale };
  });
}

// Costruisce il modello: un gruppo per ogni perno (nella posizione indicata in "perni"),
// con dentro le forme unite. genitori: per ogni perno, dentro quale altro perno va
// (es. la testa del lupo dentro il corpo); se manca va dentro "radice".
export function costruisci(parti, perni, radice, genitori = {}) {
  const gruppi = {};
  for (const [nome, posizione] of Object.entries(perni)) {
    const g = new THREE.Group();
    g.position.copy(posizione);
    gruppi[nome] = g;
  }
  for (const [nome, g] of Object.entries(gruppi)) (gruppi[genitori[nome]] ?? radice).add(g);
  for (const parte of parti) {
    const mesh = new THREE.Mesh(parte.geometria, parte.materiale);
    mesh.castShadow = true;
    gruppi[parte.perno].add(mesh);
  }
  return gruppi;
}
