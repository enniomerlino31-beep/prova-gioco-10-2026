// =====================================================================
//  MODELLO DEL TAVOLINO DI VENDITA
//  Un piccolo banco di legno con le gambe e un cartello "VENDITA".
//  Il piano è largo 2 m e profondo 1 m, alto 0,9 m.
// =====================================================================

import * as THREE from 'three';
import { tinta, creaScritta } from './materiali.js';

export const ALTEZZA_PIANO = 0.92;
export const LARGHEZZA_PIANO = 2.0;
export const PROFONDITA_PIANO = 1.0;

export function creaTavolino() {
  const gruppo = new THREE.Group();
  const scatola = new THREE.BoxGeometry(1, 1, 1);
  const pezzo = (colore, pos, scala) => {
    const m = new THREE.Mesh(scatola, tinta(colore));
    m.position.set(...pos);
    m.scale.set(...scala);
    m.castShadow = true;
    m.receiveShadow = true;
    gruppo.add(m);
    return m;
  };

  // Piano e bordo
  pezzo(0xb57a45, [0, ALTEZZA_PIANO - 0.06, 0], [LARGHEZZA_PIANO, 0.12, PROFONDITA_PIANO]);
  pezzo(0x8a5528, [0, ALTEZZA_PIANO - 0.18, 0], [LARGHEZZA_PIANO - 0.1, 0.12, PROFONDITA_PIANO - 0.1]);
  // Gambe
  for (const x of [-1, 1]) {
    for (const z of [-1, 1]) {
      pezzo(0x6e4022, [x * (LARGHEZZA_PIANO / 2 - 0.12), (ALTEZZA_PIANO - 0.12) / 2, z * (PROFONDITA_PIANO / 2 - 0.12)], [0.12, ALTEZZA_PIANO - 0.12, 0.12]);
    }
  }
  // Paletti e cartello
  for (const x of [-1, 1]) pezzo(0x6e4022, [x * 0.8, 1.45, -0.42], [0.08, 1.1, 0.08]);
  const cartello = creaScritta('VENDITA', { larghezza: 1.7, altezza: 0.45, sfondo: '#d8262e', coloreTesto: '#fff6dc' });
  cartello.position.set(0, 1.85, -0.38);
  cartello.rotation.x = -0.35;
  gruppo.add(cartello);

  return gruppo;
}
