// =====================================================================
//  CANCELLO DELLA CORSA
//  Un varco nella palizzata di sinistra: due pali grossi e alti ai lati
//  e due ante di legno in mezzo. Quando il boscaiolo si avvicina le ante
//  si aprono verso il sentiero; se resta sul cerchio per "tempoCancello"
//  secondi (il cerchio si riempie), parte una nuova corsa.
//  Misure "locali": z lungo le mura, x negativo = fuori dalla base.
// =====================================================================

import * as THREE from 'three';
import { CONFIG } from '../config.js';
import { tinta, creaScritta } from '../modelli/materiali.js';
import { creaZonaATerra } from './catasta.js';

const DISTANZA_PALI = 1.5;            // distanza di ogni palo dal centro del varco
const RAGGIO_PALO = 0.38;
export const MEZZO_INGOMBRO_CANCELLO = DISTANZA_PALI + RAGGIO_PALO; // qui si ferma la palizzata
const LARGHEZZA_ANTA = DISTANZA_PALI - RAGGIO_PALO;
const ALTEZZA_ANTA = 1.6;
const RAGGIO_ZONA = 1.3;
const ZONA_X = 1.4;                   // il cerchio sta dentro la base, davanti al cancello
const DISTANZA_APERTURA = 2.8;        // a questa distanza dal cerchio le ante si aprono
const ANGOLO_APERTO = 1.65;           // quanto si girano le ante (radianti, circa 95 gradi)

export class Cancello {
  // posizione: il centro del varco, sulla linea della palizzata
  constructor(genitore, posizione) {
    this.posizione = posizione.clone();
    this.centroZona = posizione.clone().add(new THREE.Vector3(ZONA_X, 0, 0));
    this.carica = 0;    // da 0 a 1: quanto è pieno il cerchio
    this.apertura = 0;  // da 0 (chiuso) a 1 (ante spalancate)
    this.gruppo = new THREE.Group();
    this.gruppo.position.copy(posizione);
    genitore.add(this.gruppo);

    const legno = tinta(0x7a461c);
    const legnoScuro = tinta(0x5e3517);
    const neve = tinta(0xf3f8ff);
    const scatola = new THREE.BoxGeometry(1, 1, 1);
    const pezzo = (materiale, pos, scala, genitorePezzo = this.gruppo) => {
      const m = new THREE.Mesh(scatola, materiale);
      m.position.set(...pos);
      m.scale.set(...scala);
      m.castShadow = true;
      genitorePezzo.add(m);
      return m;
    };

    // --- Due pali grossi e più alti della palizzata, con la neve in cima ---
    for (const lato of [-1, 1]) {
      const palo = new THREE.Mesh(new THREE.CylinderGeometry(RAGGIO_PALO - 0.04, RAGGIO_PALO, 2.8, 12), legnoScuro);
      palo.position.set(0, 1.4, lato * DISTANZA_PALI);
      palo.castShadow = true;
      const cima = new THREE.Mesh(new THREE.ConeGeometry(RAGGIO_PALO, 0.55, 12), neve);
      cima.position.y = 1.67;
      palo.add(cima);
      this.gruppo.add(palo);
    }
    // Trave in alto che unisce i pali, dritta sulla linea delle mura
    pezzo(legno, [0, 2.5, 0], [0.26, 0.26, DISTANZA_PALI * 2 + 0.5]);

    // --- Due ante: ognuna gira sul suo palo (il "perno") ---
    this.ante = [];
    for (const lato of [-1, 1]) {
      const perno = new THREE.Group();
      perno.position.set(0, 0, lato * LARGHEZZA_ANTA);
      // tre assi verticali che vanno dal palo verso il centro del varco
      for (let i = 0; i < 3; i++) {
        const largo = LARGHEZZA_ANTA / 3;
        pezzo(legno, [0, 0.1 + ALTEZZA_ANTA / 2, -lato * (largo / 2 + i * largo)], [0.12, ALTEZZA_ANTA, largo - 0.04], perno);
      }
      // due traverse e una diagonale, sul lato esterno
      for (const y of [0.45, 1.35]) pezzo(legnoScuro, [-0.09, y, -lato * LARGHEZZA_ANTA / 2], [0.06, 0.14, LARGHEZZA_ANTA - 0.06], perno);
      const diagonale = pezzo(legnoScuro, [-0.09, 0.9, -lato * LARGHEZZA_ANTA / 2], [0.06, 0.12, Math.hypot(LARGHEZZA_ANTA, 0.9) - 0.1], perno);
      diagonale.rotation.x = lato * Math.atan2(0.9, LARGHEZZA_ANTA);
      this.gruppo.add(perno);
      this.ante.push({ perno, lato });
    }

    // --- Cerchio a terra (dentro la base) che si riempie, con la scritta ---
    const zona = creaZonaATerra(RAGGIO_ZONA, 0x7fc1ff);
    zona.position.x = ZONA_X;
    this.gruppo.add(zona);
    this.riempimento = new THREE.Mesh(
      new THREE.CircleGeometry(RAGGIO_ZONA - 0.12, 40),
      new THREE.MeshBasicMaterial({ color: 0x2f8fff, transparent: true, opacity: 0.45, depthWrite: false })
    );
    this.riempimento.rotation.x = -Math.PI / 2;
    this.riempimento.position.set(ZONA_X, 0.025, 0);
    this.riempimento.scale.setScalar(0.001);
    this.gruppo.add(this.riempimento);
    const scritta = creaScritta('CORSA', { larghezza: 1.9, altezza: 0.6, coloreTesto: '#ffffff', coloreBordo: '#1d4f9e' });
    scritta.rotation.x = -Math.PI / 2;
    scritta.position.set(ZONA_X, 0.04, 0);
    scritta.renderOrder = 1;
    this.gruppo.add(scritta);

    // Freccia a terra fuori dal cancello, sul sentiero
    const freccia = new THREE.Mesh(new THREE.ConeGeometry(0.35, 0.8, 3), tinta(0x7fc1ff));
    freccia.rotation.z = Math.PI / 2;
    freccia.position.set(-1.9, 0.15, 0);
    freccia.scale.set(1, 1, 0.25);
    this.gruppo.add(freccia);
  }

  // Restituisce true quando il cerchio è pieno (= parte la corsa)
  aggiorna(dt, posizioneBoscaiolo) {
    const distanza = Math.hypot(posizioneBoscaiolo.x - this.centroZona.x, posizioneBoscaiolo.z - this.centroZona.z);

    // Le ante si aprono verso l'esterno quando il boscaiolo si avvicina
    const voluta = distanza < DISTANZA_APERTURA ? 1 : 0;
    const passo = dt * 2.5;
    this.apertura += THREE.MathUtils.clamp(voluta - this.apertura, -passo, passo);
    const morbido = THREE.MathUtils.smoothstep(this.apertura, 0, 1);
    for (const anta of this.ante) anta.perno.rotation.y = anta.lato * morbido * ANGOLO_APERTO;

    if (distanza < RAGGIO_ZONA) this.carica = Math.min(1, this.carica + dt / CONFIG.segheria.tempoCancello);
    else this.carica = Math.max(0, this.carica - dt * 3);
    this.riempimento.scale.setScalar(Math.max(0.001, this.carica));
    return this.carica >= 1;
  }

  azzera() {
    this.carica = 0;
    this.riempimento.scale.setScalar(0.001);
    this.apertura = 0;
    for (const anta of this.ante) anta.perno.rotation.y = 0;
  }
}
