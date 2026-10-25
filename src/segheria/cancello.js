// =====================================================================
//  CANCELLO (nella palizzata: in alto quello della corsa, ai lati gli altri due)
//  Un varco con due pali grossi e alti ai lati e due ante di legno in
//  mezzo. Quando il boscaiolo si avvicina (da dentro o da fuori) le ante
//  si aprono verso l'esterno; quando si allontana si richiudono. Da chiuse
//  non si passa.
//  Il cancello della CORSA ha anche un cerchio a terra: se il boscaiolo ci
//  resta per "tempoCancello" secondi (il cerchio si riempie), parte una
//  nuova corsa. Quello della FORESTA serve solo per uscire.
//  Misure "locali": z lungo le mura, x negativo = fuori dalla base
//  (il cancello poi viene girato verso il suo lato delle mura).
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
const DISTANZA_APERTURA = 3.2;        // a questa distanza dal centro del varco le ante si aprono
const ANGOLO_APERTO = 1.65;           // quanto si girano le ante (radianti, circa 95 gradi)

export class Cancello {
  // posizione: il centro del varco, sulla linea della palizzata
  // normale: da che parte è "fuori" ({ x: -1, z: 0 } = lato sinistro, { x: 0, z: -1 } = lato in alto...)
  // scritta: per il cancello della corsa, il testo nel cerchio a terra (senza scritta non c'è il cerchio)
  constructor(genitore, posizione, { normale = { x: -1, z: 0 }, scritta = null } = {}) {
    this.posizione = posizione.clone();
    this.normale = normale;
    this.conCerchio = Boolean(scritta);
    this.centroZona = posizione.clone().add(new THREE.Vector3(-normale.x * ZONA_X, 0, -normale.z * ZONA_X)); // dentro la base
    this.carica = 0;    // da 0 a 1: quanto è pieno il cerchio
    this.apertura = 0;  // da 0 (chiuso) a 1 (ante spalancate)

    // Rettangoli che il boscaiolo non può attraversare: i due pali sempre, le ante solo quando sono chiuse
    const lungoX = normale.z !== 0; // le mura (e quindi il varco) vanno lungo x?
    this.ostacoliPali = [-1, 1].map((lato) => ({
      x: posizione.x + (lungoX ? lato * DISTANZA_PALI : 0),
      z: posizione.z + (lungoX ? 0 : lato * DISTANZA_PALI),
      mezzaX: RAGGIO_PALO, mezzaZ: RAGGIO_PALO,
    }));
    this.ostacoloAnte = {
      x: posizione.x, z: posizione.z,
      mezzaX: lungoX ? LARGHEZZA_ANTA : 0.25, mezzaZ: lungoX ? 0.25 : LARGHEZZA_ANTA,
    };
    this.gruppo = new THREE.Group();
    this.gruppo.position.copy(posizione);
    this.gruppo.rotation.y = Math.atan2(normale.z, -normale.x); // il "fuori" locale (x negativo) guarda verso normale
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

    if (this.conCerchio) this.creaCerchio(scritta);
  }

  // Cerchio a terra (dentro la base) che si riempie, con la scritta, e freccia sul sentiero
  creaCerchio(scritta) {
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
    const cartello = creaScritta(scritta, { larghezza: 1.9, altezza: 0.6, coloreTesto: '#ffffff', coloreBordo: '#1d4f9e' });
    // sdraiato a terra e girato al contrario del cancello: la scritta si legge sempre dritta
    cartello.rotation.set(-Math.PI / 2, 0, -this.gruppo.rotation.y);
    cartello.position.set(ZONA_X, 0.04, 0);
    cartello.renderOrder = 1;
    this.gruppo.add(cartello);

    // Freccia a terra fuori dal cancello, sul sentiero
    const freccia = new THREE.Mesh(new THREE.ConeGeometry(0.35, 0.8, 3), tinta(0x7fc1ff));
    freccia.rotation.z = Math.PI / 2;
    freccia.position.set(-1.9, 0.15, 0);
    freccia.scale.set(1, 1, 0.25);
    this.gruppo.add(freccia);
  }

  // Le ante bloccano il passaggio finché non sono quasi del tutto aperte
  get ostacoli() {
    return this.apertura < 0.8 ? [...this.ostacoliPali, this.ostacoloAnte] : this.ostacoliPali;
  }

  // Le ante sono aperte abbastanza per passare (serve al cacciatore, che aspetta prima di attraversare)
  get aperto() {
    return this.apertura >= 0.8;
  }

  // Restituisce true quando il cerchio è pieno (= parte la corsa)
  // altri: posizioni di chi altro può aprire il cancello (es. il cacciatore), ma non far partire la corsa
  aggiorna(dt, posizioneBoscaiolo, altri = []) {
    // Le ante si aprono verso l'esterno quando qualcuno si avvicina al varco, da dentro o da fuori
    const vicino = [posizioneBoscaiolo, ...altri].some(
      (p) => Math.hypot(p.x - this.posizione.x, p.z - this.posizione.z) < DISTANZA_APERTURA
    );
    const passo = dt * 2.5;
    this.apertura += THREE.MathUtils.clamp((vicino ? 1 : 0) - this.apertura, -passo, passo);
    const morbido = THREE.MathUtils.smoothstep(this.apertura, 0, 1);
    for (const anta of this.ante) anta.perno.rotation.y = anta.lato * morbido * ANGOLO_APERTO;

    if (!this.conCerchio) return false;
    const distanza = Math.hypot(posizioneBoscaiolo.x - this.centroZona.x, posizioneBoscaiolo.z - this.centroZona.z);
    if (distanza < RAGGIO_ZONA) this.carica = Math.min(1, this.carica + dt / CONFIG.segheria.tempoCancello);
    else this.carica = Math.max(0, this.carica - dt * 3);
    this.riempimento.scale.setScalar(Math.max(0.001, this.carica));
    return this.carica >= 1;
  }

  azzera() {
    this.carica = 0;
    this.riempimento?.scale.setScalar(0.001);
    this.apertura = 0;
    for (const anta of this.ante) anta.perno.rotation.y = 0;
  }
}
