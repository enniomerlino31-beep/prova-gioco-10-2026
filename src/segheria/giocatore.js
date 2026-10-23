// =====================================================================
//  IL BOSCAIOLO DELLA SEGHERIA (quello che controlla il giocatore)
//  - cammina con il joystick o la tastiera; le mura lo bloccano, esce solo dai cancelli aperti
//  - porta sulla schiena legna e carne SENZA limiti: due colonne di pezzi
//    (disegnate fino a un'altezza massima) con sopra il numero vero
// =====================================================================

import * as THREE from 'three';
import { CONFIG } from '../config.js';
import { creaBoscaiolo } from '../modelli/boscaiolo.js';
import { geometriaTronco, materialiTronco } from '../modelli/carro.js';
import { creaCarne } from '../modelli/carne.js';
import { creaEtichetta, liberaEtichetta } from '../modelli/materiali.js';
import { MAPPA } from './ambiente.js';

const ALTEZZA_PEZZO = 0.2;     // spazio occupato da ogni pezzo nella pila (misura del modello)
const X_COLONNA = { legna: -0.28, carne: 0.28 }; // le due colonne sulla schiena, una accanto all'altra
const RAGGIO_BOSCAIOLO = 0.35; // ingombro per non attraversare banconi e depositi degli sportelli

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

    // Le pile sulla schiena: un gruppo attaccato al boscaiolo, dietro le spalle.
    // Il carico NON ha limiti: si disegnano al massimo "pezziVisibiliSchiena" pezzi per colonna
    // e sopra ogni colonna c'è il numero vero (es. "x150").
    this.schiena = new THREE.Group();
    this.schiena.position.set(0, 0.55, 0.24);
    this.modello.add(this.schiena);
    this.carico = { legna: 0, carne: 0 }; // unità portate sulla schiena
    this.colonne = {};
    for (const tipo of Object.keys(this.carico)) this.creaColonna(tipo);
    this.ostacoli = [];     // rettangoli { x, z, mezzaX, mezzaZ } che il boscaiolo non può attraversare
  }

  // Prepara i pezzi (nascosti) di una colonna e il posto per la sua etichetta
  creaColonna(tipo) {
    const pezzi = [];
    for (let i = 0; i < CONFIG.segheria.pezziVisibiliSchiena; i++) {
      let mesh;
      if (tipo === 'carne') {
        mesh = creaCarne();
        mesh.scale.setScalar(0.75);
      } else {
        mesh = new THREE.Mesh(geometriaTronco, materialiTronco);
        mesh.rotation.z = Math.PI / 2; // tronco di traverso sulla schiena
        mesh.scale.set(0.7, 0.32, 0.7);
        mesh.castShadow = true;
      }
      mesh.position.set(X_COLONNA[tipo], i * ALTEZZA_PEZZO + 0.06, 0);
      mesh.rotation.y = (Math.random() - 0.5) * 0.2;
      mesh.visible = false;
      this.schiena.add(mesh);
      pezzi.push(mesh);
    }
    this.colonne[tipo] = { pezzi, etichetta: null, numero: 0 };
  }

  // Pezzi disegnati in una colonna (al massimo "pezziVisibiliSchiena")
  pezziVisibili(tipo) {
    return Math.min(CONFIG.segheria.pezziVisibiliSchiena, Math.ceil(this.carico[tipo] / CONFIG.segheria.unitaPerPezzo));
  }

  // Aggiunge legna o carne sulla schiena (nessun limite)
  aggiungi(tipo, quantita) {
    this.carico[tipo] += quantita;
    this.aggiornaColonna(tipo);
  }

  // Ha qualcosa di questo tipo sulla schiena?
  ha(tipo) {
    return this.carico[tipo] > 0;
  }

  // Toglie al massimo "quantita" unità di quel tipo: restituisce quante ne ha tolte davvero
  togli(tipo, quantita) {
    const tolta = Math.min(quantita, this.carico[tipo]);
    this.carico[tipo] -= tolta;
    this.aggiornaColonna(tipo);
    return tolta;
  }

  // Mostra i pezzi giusti e aggiorna il numero sopra la colonna
  aggiornaColonna(tipo) {
    const colonna = this.colonne[tipo];
    const visibili = this.pezziVisibili(tipo);
    colonna.pezzi.forEach((mesh, i) => (mesh.visible = i < visibili));
    const numero = this.carico[tipo];
    if (numero === colonna.numero) return;
    colonna.numero = numero;
    if (colonna.etichetta) {
      this.schiena.remove(colonna.etichetta);
      liberaEtichetta(colonna.etichetta);
      colonna.etichetta = null;
    }
    if (numero <= 0) return;
    colonna.etichetta = creaEtichetta(`x${numero}`, {
      larghezza: 0.62,
      altezza: 0.25,
      icona: tipo,
      coloreTesto: '#ffffff',
      coloreBordo: 'rgba(0,0,0,0.75)',
    });
    colonna.etichetta.position.set(X_COLONNA[tipo], visibili * ALTEZZA_PEZZO + 0.3, 0);
    this.schiena.add(colonna.etichetta);
  }

  // Punto del mondo in cima a una colonna (dove atterrano i pezzi raccolti, e da dove partono quelli scaricati)
  cimaSchiena(risultato = new THREE.Vector3(), tipo = 'legna') {
    risultato.set(X_COLONNA[tipo] ?? 0, (this.pezziVisibili(tipo) + 0.5) * ALTEZZA_PEZZO + 0.08, 0);
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

    // Resta dentro la radura e non attraversa banconi e depositi
    const L = MAPPA.limiti;
    this.posizione.x = THREE.MathUtils.clamp(this.posizione.x, L.xMin, L.xMax);
    this.posizione.z = THREE.MathUtils.clamp(this.posizione.z, L.zMin, L.zMax);
    for (const ostacolo of this.ostacoli) this.spingiFuoriDa(ostacolo);

    this.modello.position.copy(this.posizione);
    this.modello.rotation.y = this.angolo;
    this.anima(dt, forza);
  }

  // Ogni ostacolo è un rettangolo: se il boscaiolo ci entra, viene spinto fuori dal lato più vicino
  spingiFuoriDa(t) {
    const mezzaX = t.mezzaX + RAGGIO_BOSCAIOLO;
    const mezzaZ = t.mezzaZ + RAGGIO_BOSCAIOLO;
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
    const carica = this.carico.legna + this.carico.carne > 0 ? 0.5 : 0;
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
