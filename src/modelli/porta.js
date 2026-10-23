// =====================================================================
//  MODELLO DELLA PORTA CON IL NUMERO
//  Due pali di legno, una trave in alto, un pannello colorato trasparente
//  (azzurro = buona, rosso = cattiva) e la scritta con l'operazione.
// =====================================================================

import * as THREE from 'three';
import { tinta, creaScritta } from './materiali.js';

const ALTEZZA = 2.6;
const palo = new THREE.CylinderGeometry(0.12, 0.14, ALTEZZA, 8);
const trave = new THREE.BoxGeometry(1, 0.22, 0.22);

export function creaPorta(testo, buona, larghezza) {
  const gruppo = new THREE.Group();
  const legno = tinta(0x9a6234);

  for (const lato of [-1, 1]) {
    const p = new THREE.Mesh(palo, legno);
    p.position.set((lato * larghezza) / 2, ALTEZZA / 2, 0);
    p.castShadow = true;
    gruppo.add(p);
  }
  const t = new THREE.Mesh(trave, legno);
  t.scale.x = larghezza + 0.3;
  t.position.y = ALTEZZA;
  gruppo.add(t);

  // Pannello colorato semitrasparente
  const materialePannello = new THREE.MeshBasicMaterial({
    color: buona ? 0x3aa0ff : 0xff4a4a,
    transparent: true,
    opacity: 0.45,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  materialePannello.userData.daLiberare = true;
  const pannello = new THREE.Mesh(new THREE.PlaneGeometry(larghezza, ALTEZZA - 0.1), materialePannello);
  pannello.geometry.userData.daLiberare = true;
  pannello.position.y = (ALTEZZA - 0.1) / 2;
  gruppo.add(pannello);

  // La scritta ("+10", "x2"...), un po' rivolta verso la telecamera
  const scritta = creaScritta(testo, { larghezza: larghezza * 0.9, altezza: 1.3 });
  scritta.position.set(0, 1.5, 0.05);
  scritta.rotation.x = -0.25;
  gruppo.add(scritta);

  return { gruppo, pannello, scritta };
}
