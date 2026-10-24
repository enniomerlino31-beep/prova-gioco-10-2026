// =====================================================================
//  VENDITORE (si compra con il cerchio "Venditore")
//  Uno per sportello, con il berretto giallo, la camicia chiara e il
//  grembiule verde. Sta sempre fermo dietro il bancone, rivolto verso i
//  clienti, e passa loro tutta la merce che chiedono: a ogni pezzo si gira
//  un attimo a prenderlo dal deposito alle sue spalle e poi si sporge in
//  avanti allungando le braccia verso il cliente, e il pezzo parte dalle
//  sue mani. La velocità dei clienti la regola Clienti (vedi "rapidita").
//  La merce sul deposito la portano il boscaiolo, l'aiutante e il cacciatore.
// =====================================================================

import * as THREE from 'three';
import { CONFIG } from '../config.js';
import { creaLavoratore } from '../modelli/boscaiolo.js';
import { animaPersona } from '../modelli/animazioni.js';
import { tinta } from '../modelli/materiali.js';
import { DEPOSITO_Z, DEPOSITO_MEZZA_Z, BANCO_DENTRO } from '../modelli/sportello.js';

// in mezzo tra il deposito e il bancone (così la tettoia non lo copre)
const Z_VENDITORE = (DEPOSITO_Z + DEPOSITO_MEZZA_Z + BANCO_DENTRO) / 2 - 0.15;
const RITARDO_PASSAGGIO = 0.12; // secondi dall'inizio del gesto a quando il pezzo parte dalle mani

// Dove sta il venditore dietro il bancone di uno sportello (serve anche alla telecamera, prima che compaia)
export function postoVenditore(sportello) {
  return sportello.posizione.clone().setZ(sportello.posizione.z + Z_VENDITORE);
}

export class Venditore {
  constructor(genitore, sportello) {
    this.sportello = sportello;
    this.servizio = 0; // animazione del passaggio della merce (da 1 a 0)
    this.comparsa = 0;
    this.tempo = Math.random() * 6;

    this.modello = creaLavoratore({ berretto: 0xf2b632, berrettoScuro: 0xc98f1c, giacca: 0xf1ead8, senzaAscia: true });
    const grembiule = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), tinta(0x4f8a3c));
    grembiule.position.set(0, 0.55, -0.16);
    grembiule.scale.set(0.3, 0.36, 0.03);
    this.modello.userData.perni.corpo.add(grembiule);
    this.perni = this.modello.userData.perni;
    this.modello.position.copy(postoVenditore(sportello));
    this.modello.rotation.order = 'YXZ'; // prima si gira (Y), poi si sporge in avanti (X)
    this.modello.rotation.y = Math.PI;   // guarda i clienti, fuori dalle mura
    this.modello.scale.setScalar(0.001);
    genitore.add(this.modello);
    sportello.venditore = this; // così i clienti ricevono la merce dalle sue mani
  }

  // Un cliente compra un pezzo: il venditore lo prende dal deposito e glielo passa.
  // Restituisce da dove parte il pezzo (le sue mani) e dopo quanto (a metà gesto).
  passa() {
    this.servizio = 1;
    const mani = new THREE.Vector3(0, 0.62, -0.42);
    this.modello.updateMatrixWorld();
    return { da: this.modello.localToWorld(mani), ritardo: RITARDO_PASSAGGIO };
  }

  aggiorna(dt) {
    this.comparsa = Math.min(1, this.comparsa + dt * 2);
    const c = this.comparsa;
    this.modello.scale.setScalar(Math.max(0.001, CONFIG.segheria.dimensioneBoscaiolo * 0.9 * (c < 1 ? c + Math.sin(c * Math.PI) * 0.35 : 1)));
    this.tempo += dt;
    this.servizio = Math.max(0, this.servizio - dt * 3.5);

    animaPersona(this.modello, dt, 0); // da fermo respira (le braccia le muove il gesto qui sotto)

    // Il gesto: prima metà si gira un po' verso il deposito e abbassa le braccia a prendere il pezzo,
    // seconda metà si sporge verso il cliente con le braccia tese in avanti
    const k = 1 - this.servizio; // da 0 (inizio gesto) a 1 (fine)
    const prende = this.servizio > 0 && k < 0.35 ? Math.sin((k / 0.35) * Math.PI) : 0;
    const porge = this.servizio > 0 && k >= 0.35 ? Math.sin(((k - 0.35) / 0.65) * Math.PI) : 0;
    this.perni.braccioSx.rotation.x = 0.2 - prende * 0.5 + porge * 1.45;
    this.perni.braccioDx.rotation.x = 0.2 - prende * 0.5 + porge * 1.45;
    this.modello.rotation.y = Math.PI + prende * 0.5 + (this.servizio > 0 ? 0 : Math.sin(this.tempo * 1.5) * 0.08);
    this.modello.rotation.x = -porge * 0.2; // si sporge in avanti
    this.modello.position.y = porge * 0.05;
  }
}
