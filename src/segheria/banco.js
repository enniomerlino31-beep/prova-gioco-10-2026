// =====================================================================
//  BANCO DA LAVORO DEL CACCIATORE
//  Sta al centro della base ed è il posto del cacciatore: quando non è a
//  caccia aspetta lì e sistema gli attrezzi (vedi cacciatore.js).
//  Compare quando arrivano i primi lupi (dopo le mura di pietra), con una
//  piccola costruzione: prima il tavolo spunta da terra, poi gli attrezzi
//  saltano fuori uno alla volta. Il boscaiolo non lo può attraversare.
// =====================================================================

import { creaBancoCacciatore } from '../modelli/banco.js';
import { suoni } from '../motore/suoni.js';

const ORDINE = ['tavolo', 'corda', 'coltello', 'frecce', 'pelle', 'lanterna']; // come compaiono, uno dopo l'altro
const PAUSA = 0.15;   // secondi tra un attrezzo e il successivo
const COMPARSA = 0.4; // secondi perché ogni pezzo spunti

// Spunta con un piccolo rimbalzo: supera un po' la misura e poi torna (k da 0 a 1)
function rimbalzo(k) {
  if (k <= 0) return 0;
  if (k >= 1) return 1;
  const c = 2.2;
  return 1 + (c + 1) * Math.pow(k - 1, 3) + c * Math.pow(k - 1, 2);
}

export class BancoCacciatore {
  // posizione: il centro del banco a terra; effetti: per la polvere e le scintille della costruzione
  constructor(genitore, posizione, effetti) {
    this.effetti = effetti;
    this.posizione = posizione.clone();
    this.gruppo = creaBancoCacciatore();
    this.gruppo.position.copy(posizione);
    this.gruppo.visible = false;
    genitore.add(this.gruppo);
    this.perni = this.gruppo.userData.perni;
    this.costruzione = null; // secondi da quando è iniziata la costruzione (null = ferma)
    // il rettangolo che il boscaiolo non può attraversare (il tavolo, un po' più largo)
    this.ostacolo = { x: posizione.x, z: posizione.z, mezzaX: 0.95, mezzaZ: 0.5 };
  }

  get visibile() {
    return this.gruppo.visible;
  }

  // Il banco compare. conAnimazione: il tavolo spunta da terra e poi gli attrezzi uno alla volta
  mostra(conAnimazione) {
    this.gruppo.visible = true;
    this.costruzione = conAnimazione ? 0 : null;
    if (conAnimazione) {
      this.effetti.sbuffo(this.posizione.x, 0.4, this.posizione.z, 0xf4f8ff, 14, 3);
      this.effetti.sbuffo(this.posizione.x, 0.6, this.posizione.z, 0xb07a45, 8, 2.5);
      suoni.suona('comparsa');
    }
    this.aggiorna(0);
  }

  aggiorna(dt) {
    if (this.costruzione === null) {
      for (const nome of ORDINE) this.perni[nome].scale.setScalar(1);
      return;
    }
    const prima = this.costruzione;
    this.costruzione += dt;
    ORDINE.forEach((nome, i) => {
      const inizio = i === 0 ? 0 : COMPARSA + (i - 1) * PAUSA; // gli attrezzi arrivano quando il tavolo è su
      const f = Math.max(0.0001, rimbalzo((this.costruzione - inizio) / COMPARSA));
      // il tavolo cresce da terra; gli attrezzi saltano fuori ingrandendosi
      if (nome === 'tavolo') this.perni.tavolo.scale.set(1, f, 1);
      else this.perni[nome].scale.setScalar(f);
      // appena un attrezzo spunta, una piccola scintilla
      if (i > 0 && prima < inizio && this.costruzione >= inizio) {
        const p = this.perni[nome].position;
        this.effetti.scintille(this.posizione.x + p.x, p.y + 0.2, this.posizione.z + p.z, 0xffe066, 4, 1.2);
      }
    });
    if (this.costruzione > COMPARSA * 2 + ORDINE.length * PAUSA) this.costruzione = null;
  }
}
