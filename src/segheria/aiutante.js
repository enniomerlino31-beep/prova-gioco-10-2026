// =====================================================================
//  AIUTANTE (si compra con il miglioramento "Aiutante")
//  Un boscaiolo con il berretto blu che lavora da solo: va alla catasta,
//  prende un carico di legna, lo porta alla rastrelliera dello sportello
//  LEGNA, e ricomincia. Se la catasta è vuota aspetta lì.
// =====================================================================

import * as THREE from 'three';
import { CONFIG } from '../config.js';
import { creaBoscaiolo } from '../modelli/boscaiolo.js';
import { geometriaTronco, materialiTronco } from '../modelli/carro.js';
import { tinta } from '../modelli/materiali.js';

const VOLO = { durata: 0.4, altezza: 1.3, scala: 0.55, sbuffo: false };

export class Aiutante {
  // inVolo: il conto della legna in volo (per il salvataggio)
  constructor(genitore, catasta, sportello, effetti, inVolo) {
    this.catasta = catasta;
    this.sportello = sportello;
    this.effetti = effetti;
    this.inVolo = inVolo;
    this.carico = 0;
    this.stato = 'andata'; // 'andata' (verso la catasta), 'ritorno' (verso lo sportello), 'attesa' (pezzo in volo)
    this.fase = 0;
    this.comparsa = 0;     // animazione quando compare (da 0 a 1)

    // Dove si ferma: davanti alla catasta e sul cerchio del deposito dello sportello
    this.puntoCatasta = catasta.posizione.clone().add(new THREE.Vector3(0, 0, 1.0));
    this.puntoSportello = sportello.zona.clone();
    this.posizione = this.puntoCatasta.clone();

    this.modello = creaBoscaiolo();
    // berretto blu, per distinguerlo dal boscaiolo del giocatore
    const cambi = new Map([[tinta(0xd8262e), tinta(0x2f7fd6)], [tinta(0xa91c22), tinta(0x1f5fa8)]]);
    this.modello.traverse((m) => {
      if (cambi.has(m.material)) m.material = cambi.get(m.material);
    });
    this.perni = this.modello.userData.perni;
    this.modello.scale.setScalar(0.001);
    this.modello.position.copy(this.posizione);
    genitore.add(this.modello);

    // i tronchi sulla schiena (si vedono solo quando porta qualcosa)
    this.schiena = new THREE.Group();
    this.schiena.position.set(0, 0.55, 0.24);
    for (let i = 0; i < 3; i++) {
      const tronco = new THREE.Mesh(geometriaTronco, materialiTronco);
      tronco.rotation.z = Math.PI / 2;
      tronco.scale.set(0.7, 0.32, 0.7);
      tronco.position.y = 0.06 + i * 0.2;
      tronco.castShadow = true;
      this.schiena.add(tronco);
    }
    this.schiena.visible = false;
    this.modello.add(this.schiena);
  }

  aggiorna(dt) {
    // compare con un piccolo salto
    this.comparsa = Math.min(1, this.comparsa + dt * 2);
    const c = this.comparsa;
    const scala = CONFIG.segheria.dimensioneBoscaiolo * 0.9 * (c < 1 ? c + Math.sin(c * Math.PI) * 0.35 : 1);
    this.modello.scale.setScalar(Math.max(0.001, scala));

    if (this.stato === 'andata') {
      if (!this.cammina(this.puntoCatasta, dt)) return;
      if (this.catasta.quantita <= 0) return; // catasta vuota: aspetta
      const partenza = this.catasta.cima();
      const quantita = this.catasta.prendiPezzo(CONFIG.segheria.caricoAiutante);
      this.stato = 'attesa';
      this.inVolo.legna += quantita;
      this.effetti.lancia('legna', partenza, (v) => this.puntoSchiena(v), 0, () => {
        this.inVolo.legna -= quantita;
        this.carico = quantita;
        this.schiena.visible = true;
        this.stato = 'ritorno';
      }, VOLO);
    } else if (this.stato === 'ritorno') {
      if (!this.cammina(this.puntoSportello, dt)) return;
      const quantita = this.carico;
      this.carico = 0;
      this.schiena.visible = false;
      this.stato = 'attesa';
      this.inVolo.legna += quantita;
      this.effetti.lancia('legna', this.puntoSchiena(new THREE.Vector3()), this.sportello, 0, () => {
        this.inVolo.legna -= quantita;
        this.sportello.aggiungi(quantita);
        this.stato = 'andata';
      }, VOLO);
    } else {
      this.cammina(this.posizione, dt); // fermo mentre il pezzo vola
    }
  }

  puntoSchiena(risultato) {
    risultato.set(0, 0.8, 0);
    this.modello.updateMatrixWorld();
    return this.schiena.localToWorld(risultato);
  }

  // Cammina verso un punto: restituisce true quando è arrivato
  cammina(obiettivo, dt) {
    const verso = obiettivo.clone().sub(this.posizione).setY(0);
    const distanza = verso.length();
    const passo = CONFIG.segheria.velocitaAiutante * dt;
    const arrivato = distanza <= passo;
    if (arrivato) this.posizione.copy(obiettivo);
    else {
      this.posizione.addScaledVector(verso, passo / distanza);
      this.modello.rotation.y = Math.atan2(-verso.x, -verso.z);
    }
    this.fase += arrivato ? 0 : dt * 11;
    const p = arrivato ? 0 : Math.sin(this.fase);
    this.perni.gambaSx.rotation.x = p * 0.7;
    this.perni.gambaDx.rotation.x = -p * 0.7;
    this.perni.braccioSx.rotation.x = -p * 0.5 + (this.carico > 0 ? 0.5 : 0);
    this.perni.braccioDx.rotation.x = p * 0.5 + (this.carico > 0 ? 0.5 : 0);
    this.modello.position.set(this.posizione.x, Math.abs(p) * 0.05, this.posizione.z);
    return arrivato;
  }
}
