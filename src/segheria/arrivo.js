// =====================================================================
//  ARRIVO A PIEDI DI UN LAVORATORE (Gruppo 7)
//  Pagato un miglioramento che assume un lavoratore (aiutante, cacciatori, venditori, boscaiolo secondario) NON c'è il cantiere:
//  dopo un attimo (CONFIG.lavoratori.arrivo.ritardo) il lavoratore compare fuori da uno dei due cancelli dei lati, entra e
//  cammina fino al suo posto. Quando arriva, questo "camminatore" sparisce e prende il suo posto il lavoratore vero, già in
//  piedi (Segheria.arrivaALavorare gli passa la funzione che lo crea). L'aspetto è lo stesso del lavoratore vero.
// =====================================================================

import * as THREE from 'three';
import { CONFIG } from '../config.js';
import { creaLavoratore } from '../modelli/boscaiolo.js';
import { animaPersona } from '../modelli/animazioni.js';
import { MAPPA } from './ambiente.js';

// Com'è vestito ogni tipo di lavoratore (gli stessi colori dei lavoratori veri)
export const ASPETTO = {
  aiutante: { berretto: 0x2f7fd6, berrettoScuro: 0x1f5fa8 },
  venditore: { berretto: 0xf2b632, berrettoScuro: 0xc98f1c, giacca: 0xf1ead8, senzaAscia: true },
  cacciatore: { berretto: 0x3d7a34, berrettoScuro: 0x2b5a25, giacca: 0x8a6239 },
  secondario: { berretto: 0x8e4fc4, berrettoScuro: 0x6a3596 },
};

// Da che cancello arriva chi deve andare in un posto: quello del suo lato (sinistro o destro)
export function cancelloPerArrivare(posto) {
  return posto.x < 0 ? MAPPA.cancelli.foresta : MAPPA.cancelli.destra;
}

// La strada che fa: fuori dal cancello, dentro il cancello, il suo posto
export function stradaDiArrivo(posto) {
  const cancello = cancelloPerArrivare(posto);
  const verso = Math.sign(cancello.x); // -1 = lato sinistro, 1 = lato destro
  return [
    new THREE.Vector3(cancello.x + verso * 2.6, 0, cancello.z),
    new THREE.Vector3(cancello.x - verso * 1.2, 0, cancello.z),
    new THREE.Vector3(posto.x, 0, posto.z),
  ];
}

// Quanti secondi dura tutto (attesa e cammino): serve alla telecamera per restare a guardare
export function durataArrivo(posto) {
  const strada = stradaDiArrivo(posto);
  let lunghezza = 0;
  for (let i = 1; i < strada.length; i++) lunghezza += strada[i].distanceTo(strada[i - 1]);
  const { ritardo, velocita } = CONFIG.lavoratori.arrivo;
  return ritardo + lunghezza / velocita;
}

export class ArrivoLavoratore {
  // tipo: 'aiutante', 'venditore'...; posto: dove deve arrivare; allaFine: crea il lavoratore vero
  constructor(genitore, effetti, tipo, posto, allaFine) {
    this.effetti = effetti;
    this.allaFine = allaFine;
    this.genitore = genitore;
    this.ritardo = CONFIG.lavoratori.arrivo.ritardo;
    this.strada = stradaDiArrivo(posto);
    this.indice = 1;
    this.posizione = this.strada[0].clone();
    this.finito = false;
    this.modello = creaLavoratore(ASPETTO[tipo]);
    this.modello.scale.setScalar(CONFIG.segheria.dimensioneBoscaiolo * 0.9);
    this.modello.position.copy(this.posizione);
    this.modello.visible = false; // compare dopo "ritardo" secondi
    genitore.add(this.modello);
    // finché cammina qualcuno si deve aprire il cancello (vedi Segheria.aggiorna)
    this.inCammino = false;
  }

  aggiorna(dt) {
    if (this.finito) return;
    if (this.ritardo > 0) {
      this.ritardo -= dt;
      if (this.ritardo > 0) return;
      this.modello.visible = true;
      this.inCammino = true;
    }
    const obiettivo = this.strada[this.indice];
    const verso = obiettivo.clone().sub(this.posizione).setY(0);
    const distanza = verso.length();
    const passo = CONFIG.lavoratori.arrivo.velocita * dt;
    if (distanza <= passo) {
      this.posizione.copy(obiettivo);
      this.indice += 1;
    } else {
      this.posizione.addScaledVector(verso, passo / distanza);
      this.modello.rotation.y = Math.atan2(-verso.x, -verso.z);
    }
    const arrivato = this.indice >= this.strada.length;
    if (animaPersona(this.modello, dt, arrivato ? 0 : 1)) this.effetti.passo(this.modello, { grandezza: 1.2 });
    this.modello.position.set(this.posizione.x, 0, this.posizione.z);
    if (arrivato) {
      this.finito = true;
      this.inCammino = false;
      this.genitore.remove(this.modello);
      this.allaFine();
    }
  }
}

// =====================================================================
//  PARTENZA A PIEDI DI UN LAVORATORE (Gruppo 8)
//  Un lavoratore licenziato (o mandato a casa perché non è stato pagato) esce a piedi dal cancello del suo lato, lo stesso da cui
//  arriverebbe, e sparisce fuori dalle mura. Ha la stessa interfaccia dell'ArrivoLavoratore (aggiorna, finito, inCammino,
//  posizione), così Segheria.arrivi li gestisce insieme e il cancello si apre da solo.
// =====================================================================
export class PartenzaLavoratore {
  // tipo: 'aiutante', 'venditore', 'cacciatore'; da: dove si trova adesso il lavoratore
  constructor(genitore, effetti, tipo, da) {
    this.effetti = effetti;
    this.genitore = genitore;
    this.strada = stradaDiArrivo(da).reverse(); // dal suo posto, dentro il cancello, fuori dal cancello
    this.strada[0] = new THREE.Vector3(da.x, 0, da.z);
    this.indice = 1;
    this.posizione = this.strada[0].clone();
    this.finito = false;
    this.inCammino = true;
    this.modello = creaLavoratore(ASPETTO[tipo]);
    this.modello.scale.setScalar(CONFIG.segheria.dimensioneBoscaiolo * 0.9);
    this.modello.position.copy(this.posizione);
    genitore.add(this.modello);
  }

  aggiorna(dt) {
    if (this.finito) return;
    const obiettivo = this.strada[this.indice];
    const verso = obiettivo.clone().sub(this.posizione).setY(0);
    const distanza = verso.length();
    const passo = CONFIG.lavoratori.arrivo.velocita * dt;
    if (distanza <= passo) {
      this.posizione.copy(obiettivo);
      this.indice += 1;
    } else {
      this.posizione.addScaledVector(verso, passo / distanza);
      this.modello.rotation.y = Math.atan2(-verso.x, -verso.z);
    }
    if (animaPersona(this.modello, dt, 1)) this.effetti.passo(this.modello, { grandezza: 1.2 });
    this.modello.position.set(this.posizione.x, 0, this.posizione.z);
    if (this.indice >= this.strada.length) {
      this.finito = true;
      this.inCammino = false;
      this.genitore.remove(this.modello);
    }
  }
}
