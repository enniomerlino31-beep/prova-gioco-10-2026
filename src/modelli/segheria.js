// =====================================================================
//  MODELLO DELLA SEGHERIA (in cima alla salita finale)
//  Una baita di tronchi con il tetto innevato, il camino e una grande sega.
//  Nella tappa 3 diventerà la base vera e propria.
// =====================================================================

import * as THREE from 'three';
import { tinta, creaScritta } from './materiali.js';

export function creaSegheria() {
  const gruppo = new THREE.Group();
  const scatola = new THREE.BoxGeometry(1, 1, 1);

  const pezzo = (geometria, colore, pos, scala, rot = [0, 0, 0]) => {
    const m = new THREE.Mesh(geometria, tinta(colore));
    m.position.set(...pos);
    m.scale.set(...scala);
    m.rotation.set(...rot);
    m.castShadow = true;
    m.receiveShadow = true;
    gruppo.add(m);
    return m;
  };

  // Muri fatti di tronchi orizzontali
  const tronco = new THREE.CylinderGeometry(0.22, 0.22, 1, 10);
  for (let i = 0; i < 7; i++) {
    const colore = i % 2 ? 0x9a5b2e : 0x86501f;
    pezzo(tronco, colore, [0, 0.22 + i * 0.42, 2], [1, 7, 1], [0, 0, Math.PI / 2]);
    pezzo(tronco, colore, [0, 0.22 + i * 0.42, -2], [1, 7, 1], [0, 0, Math.PI / 2]);
  }
  pezzo(scatola, 0x7a461c, [0, 1.5, 0], [6.6, 3, 4]);

  // Tetto a capanna con la neve sopra
  const prisma = new THREE.CylinderGeometry(1, 1, 1, 3);
  pezzo(prisma, 0x5b3519, [0, 3.6, 0], [2.6, 7.4, 2.9], [0, 0, Math.PI / 2]);
  pezzo(prisma, 0xffffff, [0, 3.75, 0], [2.45, 7.6, 2.75], [0, 0, Math.PI / 2]);

  // Camino
  pezzo(scatola, 0x8a8f99, [2, 4.6, 0.8], [0.6, 1.6, 0.6]);

  // Porta e finestre
  pezzo(scatola, 0x4a2a12, [0, 1, 2.15], [1.3, 2, 0.1]);
  pezzo(scatola, 0xffe08a, [-2.2, 1.7, 2.15], [0.9, 0.8, 0.1]);
  pezzo(scatola, 0xffe08a, [2.2, 1.7, 2.15], [0.9, 0.8, 0.1]);

  // Grande lama circolare della sega
  const lama = pezzo(new THREE.CylinderGeometry(1.3, 1.3, 0.08, 24), 0xc9d2dc, [4.2, 1.5, 1.2], [1, 1, 1], [Math.PI / 2, 0, 0]);
  gruppo.userData.lama = lama;

  // Cartello
  const cartello = creaScritta('SEGHERIA', { larghezza: 4, altezza: 1, sfondo: '#8a4f1f', coloreTesto: '#ffe9b0' });
  cartello.position.set(0, 2.75, 2.3);
  gruppo.add(cartello);

  return gruppo;
}
