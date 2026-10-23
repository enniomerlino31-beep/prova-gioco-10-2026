// =====================================================================
//  CANCELLO DELLA CORSA
//  Un arco di legno sul sentiero che porta nella foresta.
//  Se il boscaiolo resta sulla zona per "tempoCancello" secondi
//  (il cerchio si riempie), parte una nuova corsa.
// =====================================================================

import * as THREE from 'three';
import { CONFIG } from '../config.js';
import { tinta, creaScritta } from '../modelli/materiali.js';
import { creaZonaATerra } from './catasta.js';

const RAGGIO_ZONA = 1.3;

export class Cancello {
  constructor(genitore, posizione) {
    this.posizione = posizione.clone();
    this.carica = 0; // da 0 a 1: quanto è pieno il cerchio
    this.gruppo = new THREE.Group();
    this.gruppo.position.copy(posizione);
    genitore.add(this.gruppo);

    // Arco: due pali, una trave e il cartello
    const scatola = new THREE.BoxGeometry(1, 1, 1);
    const legno = tinta(0x7a461c);
    for (const z of [-1.4, 1.4]) {
      const palo = new THREE.Mesh(scatola, legno);
      palo.scale.set(0.22, 3, 0.22);
      palo.position.set(-1.2, 1.5, z);
      palo.castShadow = true;
      this.gruppo.add(palo);
    }
    const trave = new THREE.Mesh(scatola, legno);
    trave.scale.set(0.3, 0.3, 3.4);
    trave.position.set(-1.2, 3, 0);
    trave.castShadow = true;
    this.gruppo.add(trave);
    const cartello = creaScritta('CORSA!', { larghezza: 2.4, altezza: 0.8, sfondo: '#2f6fd6', coloreTesto: '#ffffff' });
    cartello.position.set(-1.0, 3.25, 0);
    cartello.rotation.set(-0.5, 0, 0);
    this.gruppo.add(cartello);

    // Zona a terra con il cerchio che si riempie
    this.gruppo.add(creaZonaATerra(RAGGIO_ZONA, 0x7fc1ff));
    this.riempimento = new THREE.Mesh(
      new THREE.CircleGeometry(RAGGIO_ZONA - 0.12, 40),
      new THREE.MeshBasicMaterial({ color: 0x2f8fff, transparent: true, opacity: 0.45, depthWrite: false })
    );
    this.riempimento.rotation.x = -Math.PI / 2;
    this.riempimento.position.y = 0.025;
    this.riempimento.scale.setScalar(0.001);
    this.gruppo.add(this.riempimento);

    // Freccia sul sentiero che indica la direzione
    const freccia = new THREE.Mesh(new THREE.ConeGeometry(0.35, 0.8, 3), tinta(0x7fc1ff));
    freccia.rotation.z = Math.PI / 2; // la punta guarda verso la foresta (sinistra)
    freccia.position.set(-2.4, 0.15, 0);
    freccia.scale.set(1, 1, 0.25);    // schiacciata, come una freccia dipinta
    this.gruppo.add(freccia);
  }

  // Restituisce true quando il cerchio è pieno (= parte la corsa)
  aggiorna(dt, posizioneBoscaiolo) {
    const dentro = Math.hypot(posizioneBoscaiolo.x - this.posizione.x, posizioneBoscaiolo.z - this.posizione.z) < RAGGIO_ZONA;
    if (dentro) this.carica = Math.min(1, this.carica + dt / CONFIG.segheria.tempoCancello);
    else this.carica = Math.max(0, this.carica - dt * 3);
    this.riempimento.scale.setScalar(Math.max(0.001, this.carica));
    return this.carica >= 1;
  }

  azzera() {
    this.carica = 0;
    this.riempimento.scale.setScalar(0.001);
  }
}
