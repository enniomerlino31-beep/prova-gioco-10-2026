// =====================================================================
//  IL BOSCAIOLO DELLA SEGHERIA (quello che controlla il giocatore)
//  - cammina libero nella radura con il joystick o la tastiera
//  - porta sulla schiena una pila di pezzi (tronchi o carne), visibili,
//    fino a un massimo regolabile ("capacitaSchiena")
// =====================================================================

import * as THREE from 'three';
import { CONFIG } from '../config.js';
import { creaBoscaiolo } from '../modelli/boscaiolo.js';
import { geometriaTronco, materialiTronco } from '../modelli/carro.js';
import { creaCarne } from '../modelli/carne.js';
import { MAPPA } from './ambiente.js';

const ALTEZZA_PEZZO = 0.2;     // spazio occupato da ogni pezzo nella pila (misura del modello)
const RAGGIO_BOSCAIOLO = 0.35; // ingombro per non attraversare il tavolino

export class Giocatore {
  constructor(genitore) {
    this.modello = creaBoscaiolo();
    this.modello.scale.setScalar(CONFIG.segheria.dimensioneBoscaiolo);
    genitore.add(this.modello);
    this.perni = this.modello.userData.perni;

    this.posizione = MAPPA.partenza.clone();
    this.angolo = 0;        // verso dove guarda (0 = verso il fondo della radura)
    this.fase = 0;          // per l'animazione del passo
    this.velocitaAttuale = 0;
    this.attaccoAnim = 0;

    // La pila sulla schiena: un gruppo attaccato al boscaiolo, dietro le spalle
    this.schiena = new THREE.Group();
    this.schiena.position.set(0, 0.55, 0.24);
    this.modello.add(this.schiena);
    this.pezzi = [];        // [{ tipo, quantita, mesh }]
    this.inArrivo = 0;      // pezzi in volo verso la schiena (già "prenotati")
  }

  get capacita() {
    return CONFIG.segheria.capacitaSchiena;
  }

  // Quanti posti ci sono ancora sulla schiena (contando anche quelli in volo)
  get spazioLibero() {
    return this.capacita - this.pezzi.length - this.inArrivo;
  }

  get pieno() {
    return this.spazioLibero <= 0;
  }

  // Mette un pezzo in cima alla pila
  aggiungi(tipo, quantita) {
    let mesh;
    const xColonna = { legna: -0.35, carne: 0.1, soldi: 0.48 };
    const yBase = this.pezzi.filter((p) => p.tipo === tipo).length * ALTEZZA_PEZZO + 0.06;
    if (tipo === 'carne') {
      mesh = creaCarne();
      mesh.scale.setScalar(0.75);
    } else if (tipo === 'soldi') {
      mesh = new THREE.Mesh(geometriaTronco, materialiTronco);
      mesh.rotation.z = Math.PI / 2;
      mesh.scale.set(0.52, 0.25, 0.52);
      mesh.castShadow = true;
    } else {
      mesh = new THREE.Mesh(geometriaTronco, materialiTronco);
      mesh.rotation.z = Math.PI / 2; // tronco di traverso sulla schiena
      mesh.scale.set(0.7, 0.32, 0.7);
      mesh.castShadow = true;
    }
    mesh.position.set(xColonna[tipo] ?? 0, yBase, 0);
    mesh.rotation.y = (Math.random() - 0.5) * 0.2;
    this.schiena.add(mesh);
    this.pezzi.push({ tipo, quantita, mesh });
  }

  // Toglie il pezzo in cima alla pila (se c'è) e lo restituisce
  togliUltimo(tipoRichiesto = null) {
    const ultimo = this.pezzi[this.pezzi.length - 1];
    if (!ultimo || (tipoRichiesto && ultimo.tipo !== tipoRichiesto)) return null;
    this.pezzi.pop();
    this.schiena.remove(ultimo.mesh);
    return ultimo;
  }

  // Punto del mondo in cima alla pila (dove atterrano i pezzi raccolti)
  cimaSchiena(risultato = new THREE.Vector3(), tipo = null) {
    const colonna = tipo ?? this.pezzi[this.pezzi.length - 1]?.tipo ?? 'legna';
    const conteggio = this.pezzi.filter((p) => p.tipo === colonna).length;
    const xColonna = { legna: -0.35, carne: 0.1, soldi: 0.48 };
    risultato.set(xColonna[colonna] ?? 0, (conteggio + 0.5) * ALTEZZA_PEZZO + 0.08, 0);
    this.modello.updateMatrixWorld();
    return this.schiena.localToWorld(risultato);
  }

  // Muove il boscaiolo. direzione = { x, y } del joystick (y positivo = verso il basso dello schermo)
  aggiorna(dt, direzione) {
    const cfg = CONFIG.segheria;
    const forza = Math.min(1, Math.hypot(direzione.x, direzione.y));

    if (forza > 0) {
      // Sullo schermo "su" è verso il fondo della radura (z negativo)
      const dx = direzione.x;
      const dz = direzione.y;
      this.posizione.x += dx * cfg.velocitaBoscaiolo * dt;
      this.posizione.z += dz * cfg.velocitaBoscaiolo * dt;
      // si gira dolcemente verso dove cammina
      const angoloVoluto = Math.atan2(-dx, -dz);
      let differenza = angoloVoluto - this.angolo;
      differenza = Math.atan2(Math.sin(differenza), Math.cos(differenza));
      this.angolo += differenza * Math.min(1, dt * 12);
    }
    this.velocitaAttuale = forza * cfg.velocitaBoscaiolo;

    // Resta dentro la radura e non attraversa il tavolino
    const L = MAPPA.limiti;
    this.posizione.x = THREE.MathUtils.clamp(this.posizione.x, L.xMin, L.xMax);
    this.posizione.z = THREE.MathUtils.clamp(this.posizione.z, L.zMin, L.zMax);
    this.spingiFuoriDalTavolino();

    this.modello.position.copy(this.posizione);
    this.modello.rotation.y = this.angolo;
    this.anima(dt, forza);
  }

  // Il tavolino è un rettangolo: se il boscaiolo ci entra, viene spinto fuori dal lato più vicino
  spingiFuoriDalTavolino() {
    const t = MAPPA.tavolino;
    const mezzaX = 1.0 + RAGGIO_BOSCAIOLO;
    const mezzaZ = 0.5 + RAGGIO_BOSCAIOLO;
    const dx = this.posizione.x - t.x;
    const dz = this.posizione.z - t.z;
    if (Math.abs(dx) < mezzaX && Math.abs(dz) < mezzaZ) {
      const fuoriX = mezzaX - Math.abs(dx);
      const fuoriZ = mezzaZ - Math.abs(dz);
      if (fuoriX < fuoriZ) this.posizione.x = t.x + Math.sign(dx || 1) * mezzaX;
      else this.posizione.z = t.z + Math.sign(dz || 1) * mezzaZ;
    }
  }

  // Passo: gambe e braccia oscillano; con la pila le braccia stanno un po' avanti
  anima(dt, forza) {
    this.fase += dt * 12 * forza;
    const passo = forza > 0 ? Math.sin(this.fase) : 0;
    const p = this.perni;
    p.gambaSx.rotation.x = passo * 0.7;
    p.gambaDx.rotation.x = -passo * 0.7;
    const carica = this.pezzi.length > 0 ? 0.5 : 0;
    this.attaccoAnim = Math.max(0, this.attaccoAnim - dt * 5);
    const swing = this.attaccoAnim > 0 ? Math.sin((1 - this.attaccoAnim) * Math.PI * 2) * 1.3 : 0;
    p.braccioSx.rotation.x = -passo * 0.5 + carica + swing * 0.3;
    p.braccioDx.rotation.x = passo * 0.5 + carica - swing * 1.2;
    p.braccioDx.rotation.z = -0.6 + swing * 0.4;
    this.modello.position.y = Math.abs(passo) * 0.05;
    // la pila ondeggia un po' mentre cammina
    this.schiena.rotation.x = -Math.abs(passo) * 0.06 * forza;
    this.schiena.rotation.z = Math.sin(this.fase * 0.5) * 0.04 * forza;
  }

  colpisciAscia() {
    this.attaccoAnim = 1;
  }

  // Mette a posto il boscaiolo (es. quando torna da una corsa)
  riposiziona() {
    this.posizione.copy(MAPPA.partenza);
    this.angolo = 0;
    this.modello.position.copy(this.posizione);
  }
}
