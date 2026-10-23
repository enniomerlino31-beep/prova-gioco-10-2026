// =====================================================================
//  TAVOLINO DI VENDITA
//  Il boscaiolo ci passa vicino e i pezzi che porta volano sul tavolino.
//  La merce resta esposta (legna a sinistra, carne a destra) finché
//  un cliente non la compra.
// =====================================================================

import * as THREE from 'three';
import { CONFIG } from '../config.js';
import { creaTavolino, ALTEZZA_PIANO } from '../modelli/tavolino.js';
import { geometriaTronco, materialiTronco } from '../modelli/carro.js';
import { partiCarne } from '../modelli/carne.js';
import { creaZonaATerra } from './catasta.js';

export class Tavolino {
  constructor(genitore, posizione, merce) {
    this.posizione = posizione.clone();
    this.legna = merce.legna; // unità di legna esposte
    this.carne = merce.carne; // unità di carne esposte
    this.rimbalzo = 0;

    this.gruppo = new THREE.Group();
    this.gruppo.position.copy(posizione);
    genitore.add(this.gruppo);
    this.modello = creaTavolino();
    this.gruppo.add(this.modello);
    const zona = creaZonaATerra(CONFIG.segheria.raggioTavolino, 0xffe08a);
    this.gruppo.add(zona);

    const massimo = CONFIG.segheria.pezziMassimiTavolino;
    const m4 = new THREE.Matrix4();
    const uno = new THREE.Vector3(1, 1, 1);

    // Legna: tronchetti sdraiati, a sinistra del piano
    this.postiLegna = [];
    for (let i = 0; i < massimo; i++) {
      const strato = Math.floor(i / 4);
      this.postiLegna.push(new THREE.Vector3(-0.78 + (i % 4) * 0.21 + (strato % 2) * 0.1, ALTEZZA_PIANO + 0.08 + strato * 0.17, 0));
    }
    const sdraiato = new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.PI / 2, 0, 0));
    const scalaTronco = new THREE.Vector3(0.55, 0.48, 0.55);
    this.tronchi = new THREE.InstancedMesh(geometriaTronco, materialiTronco, massimo);
    this.postiLegna.forEach((p, i) => this.tronchi.setMatrixAt(i, m4.compose(p, sdraiato, scalaTronco)));
    this.tronchi.castShadow = true;
    this.gruppo.add(this.tronchi);

    // Carne: a destra del piano
    this.postiCarne = [];
    for (let i = 0; i < massimo; i++) {
      const strato = Math.floor(i / 6);
      const k = i % 6;
      this.postiCarne.push(new THREE.Vector3(0.25 + (k % 3) * 0.28, ALTEZZA_PIANO + 0.07 + strato * 0.16, (Math.floor(k / 3) - 0.5) * 0.4));
    }
    const piccolo = new THREE.Vector3(0.75, 0.75, 0.75);
    this.pezziCarne = partiCarne().map((parte) => {
      const mesh = new THREE.InstancedMesh(parte.geometria, parte.materiale, massimo);
      const finale = new THREE.Matrix4();
      this.postiCarne.forEach((p, i) => {
        const girato = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, i * 1.3, 0));
        mesh.setMatrixAt(i, finale.multiplyMatrices(m4.compose(p, girato, piccolo), parte.matrice));
      });
      mesh.castShadow = true;
      this.gruppo.add(mesh);
      return mesh;
    });

    this.aggiornaGrafica();
  }

  // Il boscaiolo è abbastanza vicino per scaricare?
  vicino(posizione) {
    return Math.hypot(posizione.x - this.posizione.x, posizione.z - this.posizione.z) < CONFIG.segheria.raggioTavolino;
  }

  pezzi(tipo) {
    const quantita = tipo === 'carne' ? this.carne : this.legna;
    return Math.min(CONFIG.segheria.pezziMassimiTavolino, Math.ceil(quantita / CONFIG.segheria.unitaPerPezzo));
  }

  aggiungi(tipo, quantita) {
    if (tipo === 'carne') this.carne += quantita;
    else this.legna += quantita;
    this.aggiornaGrafica();
  }

  // Un cliente prende la merce: restituisce quante unità ha preso davvero
  prendi(tipo, quantita) {
    const disponibile = tipo === 'carne' ? this.carne : this.legna;
    const presa = Math.min(disponibile, quantita);
    if (tipo === 'carne') this.carne -= presa;
    else this.legna -= presa;
    this.aggiornaGrafica();
    return presa;
  }

  // Punto del mondo dove atterrano i pezzi in arrivo (usato dagli effetti di volo)
  puntoDiArrivo(tipo, risultato = new THREE.Vector3()) {
    const posti = tipo === 'carne' ? this.postiCarne : this.postiLegna;
    const indice = Math.min(posti.length - 1, this.pezzi(tipo));
    risultato.copy(posti[indice]).add(this.posizione);
    return risultato;
  }

  // Piccolo rimbalzo del tavolino quando ci atterra qualcosa
  rimbalza() {
    this.rimbalzo = 1;
  }

  aggiorna(dt) {
    this.rimbalzo = Math.max(0, this.rimbalzo - dt * 5);
    const s = Math.sin((1 - this.rimbalzo) * Math.PI * 2) * this.rimbalzo * 0.06;
    this.gruppo.scale.set(1 + s * 0.5, 1 - s, 1 + s * 0.5);
  }

  aggiornaGrafica() {
    this.tronchi.count = this.pezzi('legna');
    for (const mesh of this.pezziCarne) mesh.count = this.pezzi('carne');
  }
}
