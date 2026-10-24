// =====================================================================
//  MODELLO DEL BANCO DA LAVORO DEL CACCIATORE
//  Un tavolo di legno robusto (piano con le assi, gambe grosse e traverse)
//  con sopra gli attrezzi da caccia, in stile cartoon:
//  un coltello, un rotolo di corda, una pelle tesa su un telaio di
//  bastoni, tre frecce e una lanterna accesa.
//  Lungo circa 1,8 metri. Il lato "davanti" (dove sta il cacciatore) è verso +z.
//  Ogni attrezzo ha il suo perno, così può spuntare da solo quando il banco
//  viene costruito (vedi src/segheria/banco.js).
// =====================================================================

import * as THREE from 'three';
import { pezzo, unisciPezzi, costruisci } from './pezzi.js';

const LEGNO = 0xb07a45;
const LEGNO_SCURO = 0x7a4a24;
const VENATURE = 0x8a5a30;
const ACCIAIO = 0xc9d2dc;
const MANICO = 0x5a3418;
const CORDA = 0xd9b77a;
const PELLE = 0xc08a55;
const PELLE_SCURA = 0x9a6a3a;
const PIUME = 0xd8262e;
const PUNTA = 0x9aa3ad;
const FERRO = 0x3b4149;
const LUCE = new THREE.MeshBasicMaterial({ color: 0xffd36b }); // il vetro della lanterna: sembra acceso

const ALTO = 0.86; // altezza del piano del tavolo (gli attrezzi ci stanno sopra)

// Dove stanno i perni: il tavolo a terra, ogni attrezzo nel suo punto sul piano
export const PERNI_BANCO = {
  tavolo: new THREE.Vector3(0, 0, 0),
  corda: new THREE.Vector3(-0.58, ALTO, -0.18),
  coltello: new THREE.Vector3(-0.42, ALTO, 0.2),
  frecce: new THREE.Vector3(0.3, ALTO, 0.22),
  pelle: new THREE.Vector3(0.38, ALTO, -0.36),
  lanterna: new THREE.Vector3(0.74, ALTO, -0.02),
};

function pezziBanco() {
  const pezzi = [
    // --- Tavolo: piano con le assi, bordo sotto il piano, quattro gambe grosse e le traverse ---
    pezzo('tavolo', 'scatola', LEGNO, [0, 0.8, 0], [1.8, 0.1, 0.9]),
    pezzo('tavolo', 'scatola', LEGNO_SCURO, [0, 0.7, 0], [1.66, 0.1, 0.76]),
    pezzo('tavolo', 'scatola', LEGNO_SCURO, [0, 0.2, 0], [1.5, 0.07, 0.07]),
  ];
  for (const z of [-0.3, 0, 0.3]) pezzi.push(pezzo('tavolo', 'scatola', VENATURE, [0, 0.852, z], [1.82, 0.012, 0.025]));
  for (const x of [-0.78, 0.78]) {
    pezzi.push(pezzo('tavolo', 'scatola', LEGNO_SCURO, [x, 0.2, 0], [0.07, 0.07, 0.7]));
    for (const z of [-0.36, 0.36]) pezzi.push(pezzo('tavolo', 'cilindro', LEGNO_SCURO, [x, 0.38, z], [0.075, 0.76, 0.075]));
  }

  // --- Coltello: lama d'acciaio e manico scuro, un po' di traverso ---
  pezzi.push(
    pezzo('coltello', 'scatola', ACCIAIO, [0, 0.008, 0], [0.28, 0.012, 0.06], [0, 0.3, 0]),
    pezzo('coltello', 'scatola', MANICO, [0.2, 0.016, -0.062], [0.14, 0.03, 0.045], [0, 0.3, 0]),
  );

  // --- Rotolo di corda: due giri uno sopra l'altro ---
  pezzi.push(
    pezzo('corda', 'ciambella', CORDA, [0, 0.03, 0], [0.15, 0.15, 0.15], [Math.PI / 2, 0, 0]),
    pezzo('corda', 'ciambella', CORDA, [0.01, 0.075, 0.01], [0.11, 0.11, 0.13], [Math.PI / 2, 0, 0]),
  );

  // --- Pelle tesa su un telaio di bastoni, appoggiata in fondo al tavolo ---
  for (const x of [-0.3, 0.3]) pezzi.push(pezzo('pelle', 'cilindro', VENATURE, [x, 0.3, 0], [0.02, 0.62, 0.02]));
  for (const y of [0.06, 0.55]) pezzi.push(pezzo('pelle', 'cilindro', VENATURE, [0, y, 0], [0.018, 0.7, 0.018], [0, 0, Math.PI / 2]));
  pezzi.push(
    pezzo('pelle', 'scatola', PELLE, [0, 0.3, 0.01], [0.5, 0.42, 0.02]),
    pezzo('pelle', 'sfera', PELLE_SCURA, [-0.08, 0.36, 0.022], [0.1, 0.07, 0.01]),
    pezzo('pelle', 'sfera', PELLE_SCURA, [0.12, 0.22, 0.022], [0.07, 0.05, 0.01]),
  );

  // --- Tre frecce sdraiate: asta, punta e piume rosse ---
  for (const z of [-0.06, 0, 0.06]) {
    pezzi.push(
      pezzo('frecce', 'cilindro', VENATURE, [0, 0.015, z], [0.012, 0.5, 0.012], [0, 0, Math.PI / 2]),
      pezzo('frecce', 'cono', PUNTA, [0.28, 0.015, z], [0.024, 0.07, 0.024], [0, 0, -Math.PI / 2]),
      pezzo('frecce', 'scatola', PIUME, [-0.22, 0.015, z], [0.07, 0.006, 0.035]),
    );
  }

  // --- Lanterna: base e tetto di ferro, vetro acceso, maniglia ---
  pezzi.push(
    pezzo('lanterna', 'cilindro', FERRO, [0, 0.02, 0], [0.085, 0.04, 0.085]),
    pezzo('lanterna', 'cilindro', LUCE, [0, 0.12, 0], [0.065, 0.16, 0.065]),
    pezzo('lanterna', 'cono', FERRO, [0, 0.24, 0], [0.095, 0.08, 0.095]),
    pezzo('lanterna', 'ciambella', FERRO, [0, 0.3, 0], [0.04, 0.04, 0.04]),
  );
  for (const [x, z] of [[-0.06, -0.06], [0.06, -0.06], [-0.06, 0.06], [0.06, 0.06]]) {
    pezzi.push(pezzo('lanterna', 'cilindro', FERRO, [x, 0.12, z], [0.008, 0.17, 0.008]));
  }
  return pezzi;
}

let parti = null;

// Il banco intero: un gruppo con dentro un perno per il tavolo e uno per ogni attrezzo (in userData.perni)
export function creaBancoCacciatore() {
  parti ??= unisciPezzi(pezziBanco());
  const gruppo = new THREE.Group();
  gruppo.userData.perni = costruisci(parti, PERNI_BANCO, gruppo);
  return gruppo;
}
