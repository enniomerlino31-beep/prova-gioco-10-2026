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

  // Muri fatti di tronchi orizzontali, più semplici e più vicini allo stile della base di riferimento
  const tronco = new THREE.CylinderGeometry(0.22, 0.22, 1, 10);
  for (let i = 0; i < 7; i++) {
    const colore = i % 2 ? 0x9a5b2e : 0x86501f;
    pezzo(tronco, colore, [0, 0.22 + i * 0.42, 2], [1, 7, 1], [0, 0, Math.PI / 2]);
    pezzo(tronco, colore, [0, 0.22 + i * 0.42, -2], [1, 7, 1], [0, 0, Math.PI / 2]);
  }
  pezzo(scatola, 0x7a461c, [0, 1.5, 0], [6.8, 3.1, 4.1]);

  // Tetto a capanna, più semplice e più leggero: spigolo e neve
  const prisma = new THREE.CylinderGeometry(1, 1, 1, 3);
  pezzo(prisma, 0x5b3519, [0, 3.6, 0], [2.8, 7.2, 2.9], [0, 0, Math.PI / 2]);
  pezzo(prisma, 0xffffff, [0, 3.82, 0], [2.6, 7.5, 2.7], [0, 0, Math.PI / 2]);

  // Camino leggero e finestre calde
  pezzo(scatola, 0x8a8f99, [2, 4.7, 0.8], [0.6, 1.6, 0.6]);
  pezzo(scatola, 0x4a2a12, [0, 1, 2.15], [1.4, 2.1, 0.1]);
  pezzo(scatola, 0xffe08a, [-2.2, 1.7, 2.15], [0.9, 0.8, 0.1]);
  pezzo(scatola, 0xffe08a, [2.2, 1.7, 2.15], [0.9, 0.8, 0.1]);

  // Lama della sega e struttura di supporto semplificata: rimane come elemento visivo di base ma senza clutter eccessivo
  const lama = pezzo(new THREE.CylinderGeometry(1.25, 1.25, 0.08, 24), 0xc9d2dc, [4.2, 1.5, 1.2], [1, 1, 1], [Math.PI / 2, 0, 0]);
  gruppo.userData.lama = lama;

  // Cartello semplice e basso
  const cartello = creaScritta('SEGHERIA', { larghezza: 4, altezza: 1, sfondo: '#8a4f1f', coloreTesto: '#ffe9b0' });
  cartello.position.set(0, 2.75, 2.3);
  gruppo.add(cartello);

  return gruppo;
}
