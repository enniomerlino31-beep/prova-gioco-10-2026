// =====================================================================
//  IL BOSCAIOLO DELLA SEGHERIA (quello che controlla il giocatore)
//  - cammina con il joystick o la tastiera; le mura lo bloccano, esce solo dai cancelli aperti
//  - porta sulla schiena legna, carne e monete SENZA limiti: tre pile centrate
//    sulla schiena, una dietro l'altra (dalla schiena verso fuori: legna,
//    carne, monete), disegnate fino a un'altezza massima, con il numero vero
// =====================================================================

import * as THREE from 'three';
import { CONFIG } from '../config.js';
import { creaBoscaiolo } from '../modelli/boscaiolo.js';
import { animaPersona, animaColpo, COLPO } from '../modelli/animazioni.js';
import { geometriaTronco, materialiTronco } from '../modelli/carro.js';
import { creaCarne } from '../modelli/carne.js';
import { creaMoneta } from '../modelli/soldi.js';
import { creaEtichetta, liberaEtichetta } from '../modelli/materiali.js';
import { MAPPA } from './ambiente.js';

const ALTEZZA_PEZZO = { legna: 0.2, carne: 0.2, monete: 0.075 }; // spazio occupato da ogni pezzo nella pila (misura del modello)
const ORDINE = ['legna', 'carne', 'monete']; // le pile, dalla schiena verso fuori
const PASSO_PILE = 0.3;        // distanza tra una pila e quella dietro
const MONETE_PER_PEZZO = 25;   // ogni quante monete in tasca c'è una moneta in più nella pila
const MONETE_VISIBILI = 12;    // monete disegnate al massimo nella pila
const RAGGIO_BOSCAIOLO = 0.35; // ingombro per non attraversare banconi e depositi degli sportelli

export class Giocatore {
  constructor(genitore, effetti) {
    this.modello = creaBoscaiolo();
    this.modello.scale.setScalar(CONFIG.segheria.dimensioneBoscaiolo);
    genitore.add(this.modello);
    this.effetti = effetti; // per la polvere di neve sotto i piedi e le scintille

    this.posizione = MAPPA.partenza.clone();
    this.angolo = 0;        // verso dove guarda (0 = verso il fondo della radura)
    this.colpo = null;      // a che punto è il colpo d'ascia (da 0 a 1); null = non sta colpendo
    this.versoColpo = 0;    // verso dove si gira per colpire il lupo
    this.saltoPila = 0;     // saltello della pila quando arriva un pezzo (da 1 a 0)
    this.chino = 0;         // quanto è piegato in avanti per raccogliere o lasciare i tronchi (da 1 a 0, vedi chinati)

    // Le pile sulla schiena: un gruppo attaccato al boscaiolo (alla sua "molla", così rimbalza con lui), dietro le spalle.
    // Il carico NON ha limiti: si disegnano al massimo "pezziVisibiliSchiena" pezzi per pila
    // e sopra le pile c'è il numero vero (es. "x150"). Le pile stanno al centro della schiena, in fila
    // verso il retro: se una pila è vuota, quelle dietro scivolano avanti a prendere il suo posto.
    this.schiena = new THREE.Group();
    this.schiena.position.set(0, 0.55, 0.24);
    this.modello.userData.molla.add(this.schiena);
    this.carico = { legna: 0, carne: 0 }; // unità portate sulla schiena (le monete sono i soldi in tasca: vedi impostaMonete)
    this.monete = 0;
    this.colonne = {};
    for (const tipo of ORDINE) this.creaColonna(tipo);
    this.ostacoli = [];     // rettangoli { x, z, mezzaX, mezzaZ } che il boscaiolo non può attraversare
  }

  // Prepara i pezzi (nascosti) di una pila e il posto per la sua etichetta
  creaColonna(tipo) {
    const gruppo = new THREE.Group(); // la pila intera: scivola avanti e indietro lungo la schiena
    this.schiena.add(gruppo);
    const pezzi = [];
    const quanti = tipo === 'monete' ? MONETE_VISIBILI : CONFIG.segheria.pezziVisibiliSchiena;
    for (let i = 0; i < quanti; i++) {
      let mesh;
      if (tipo === 'carne') {
        mesh = creaCarne();
        mesh.scale.setScalar(0.75);
      } else if (tipo === 'monete') {
        mesh = creaMoneta();
        mesh.scale.set(0.15, 0.05, 0.15);
        mesh.position.x = (Math.random() - 0.5) * 0.03; // non perfettamente in colonna
      } else {
        mesh = new THREE.Mesh(geometriaTronco, materialiTronco);
        mesh.rotation.z = Math.PI / 2; // tronco di traverso sulla schiena
        mesh.scale.set(0.7, 0.32, 0.7);
        mesh.castShadow = true;
      }
      mesh.position.y = i * ALTEZZA_PEZZO[tipo] + 0.06;
      mesh.rotation.y = (Math.random() - 0.5) * 0.2;
      mesh.visible = false;
      gruppo.add(mesh);
      pezzi.push(mesh);
    }
    this.colonne[tipo] = { gruppo, pezzi, etichetta: null, numero: 0, z: 0 };
  }

  // Quante unità ci sono in una pila
  quantita(tipo) {
    return tipo === 'monete' ? this.monete : this.carico[tipo];
  }

  // Pezzi disegnati in una pila (al massimo quelli preparati)
  pezziVisibili(tipo) {
    const perPezzo = tipo === 'monete' ? MONETE_PER_PEZZO : CONFIG.segheria.unitaPerPezzo;
    return Math.min(this.colonne[tipo].pezzi.length, Math.ceil(this.quantita(tipo) / perPezzo));
  }

  // Dove sta (lungo la schiena) la pila: le pile non vuote si mettono in fila, nell'ordine legna, carne, monete
  posizionePila(tipo) {
    const piene = ORDINE.filter((nome) => this.quantita(nome) > 0);
    const posto = piene.includes(tipo) ? piene.indexOf(tipo) : piene.filter((nome) => ORDINE.indexOf(nome) < ORDINE.indexOf(tipo)).length;
    return posto * PASSO_PILE;
  }

  // I soldi in tasca: si vedono come una pila di monete, l'ultima sulla schiena
  impostaMonete(soldi) {
    const monete = Math.max(0, Math.floor(soldi));
    if (monete === this.monete) return;
    this.monete = monete;
    this.aggiornaColonna('monete');
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

  // Mostra i pezzi giusti e aggiorna il numero sopra la pila
  aggiornaColonna(tipo) {
    const colonna = this.colonne[tipo];
    const visibili = this.pezziVisibili(tipo);
    colonna.pezzi.forEach((mesh, i) => (mesh.visible = i < visibili));
    const numero = this.quantita(tipo);
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
      icona: tipo === 'monete' ? 'moneta' : tipo,
      coloreTesto: '#ffffff',
      coloreBordo: 'rgba(0,0,0,0.75)',
    });
    this.schiena.add(colonna.etichetta); // la mette al suo posto sistemaEtichette, a ogni fotogramma
  }

  // Le etichette stanno una sopra l'altra, sopra la pila più alta (dall'alto: legna, carne, monete),
  // così non si coprono mai, da qualsiasi parte sia girato il boscaiolo
  sistemaEtichette() {
    const conEtichetta = ORDINE.filter((tipo) => this.colonne[tipo].etichetta);
    if (conEtichetta.length === 0) return;
    const cima = Math.max(...ORDINE.map((tipo) => this.pezziVisibili(tipo) * ALTEZZA_PEZZO[tipo]));
    const centro = Math.max(...ORDINE.map((tipo) => this.colonne[tipo].z)) / 2;
    conEtichetta.forEach((tipo, i) => {
      this.colonne[tipo].etichetta.position.set(0, cima + 0.3 + (conEtichetta.length - 1 - i) * 0.27, centro);
    });
  }

  // Punto del mondo in cima a una pila (dove atterrano i pezzi raccolti, e da dove partono quelli scaricati)
  cimaSchiena(risultato = new THREE.Vector3(), tipo = 'legna') {
    risultato.set(0, (this.pezziVisibili(tipo) + 0.5) * ALTEZZA_PEZZO[tipo] + 0.08, this.posizionePila(tipo));
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
      // si gira dolcemente verso dove cammina (mentre colpisce resta girato verso il lupo)
      if (this.colpo === null) this.giraVerso(Math.atan2(-dx, -dz), dt * 12);
    }
    if (this.colpo !== null) this.giraVerso(this.versoColpo, dt * 18);

    // Resta dentro la radura e non attraversa banconi e depositi
    const L = MAPPA.limiti;
    this.posizione.x = THREE.MathUtils.clamp(this.posizione.x, L.xMin, L.xMax);
    this.posizione.z = THREE.MathUtils.clamp(this.posizione.z, L.zMin, L.zMax);
    for (const ostacolo of this.ostacoli) this.spingiFuoriDa(ostacolo);

    this.modello.position.copy(this.posizione);
    this.modello.rotation.y = this.angolo;
    this.anima(dt, forza);
  }

  // Si gira un po' alla volta verso un angolo (dalla parte più corta)
  giraVerso(angoloVoluto, quanto) {
    let differenza = angoloVoluto - this.angolo;
    differenza = Math.atan2(Math.sin(differenza), Math.cos(differenza));
    this.angolo += differenza * Math.min(1, quanto);
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

  // Passo con rimbalzo (vedi animazioni.js); con la pila le braccia stanno un po' avanti.
  // A ogni passo si alza un po' di neve (e si sente il passo: alPasso, vedi segheria.js);
  // durante il colpo d'ascia si muovono braccia e corpo.
  anima(dt, forza) {
    const carica = this.carico.legna + this.carico.carne > 0 ? 0.5 : 0;
    if (animaPersona(this.modello, dt, forza, { velocita: 12, carica })) {
      this.effetti?.passo(this.modello, { polvere: 3, grandezza: 1.3 });
      if (forza > 0.1) this.alPasso?.();
    }
    if (this.colpo !== null) {
      this.colpo += dt / COLPO.durata;
      if (this.colpo >= 1) this.colpo = null;
      else animaColpo(this.modello, this.colpo);
    }
    // la pila ondeggia mentre cammina e fa un saltello quando arriva un pezzo; più legna e carne porta, più ondeggia e pesa
    // (il boscaiolo si piega un po' all'indietro e la pila sale e scende a ogni passo)
    const { fase, moto } = this.modello.userData.anim;
    const peso = Math.min(1, (this.carico.legna + this.carico.carne) / 200);
    this.schiena.rotation.x = -Math.abs(Math.sin(fase)) * (0.05 + 0.08 * peso) * moto;
    this.schiena.rotation.z = Math.sin(fase * 0.5) * (0.04 + 0.07 * peso) * moto;
    this.schiena.position.y = 0.55 - Math.abs(Math.sin(fase)) * 0.04 * peso * moto;
    // si china a raccogliere o a lasciare i tronchi (vedi chinati), poi si rialza
    this.chino = Math.max(0, this.chino - dt * 3.5);
    this.modello.rotation.order = 'YXZ';
    this.modello.rotation.x = -Math.sin(Math.min(1, this.chino) * Math.PI * 0.5) * 0.42 + peso * 0.08 * moto;
    this.saltoPila = Math.max(0, this.saltoPila - dt * 5);
    const salto = Math.sin(this.saltoPila * Math.PI);
    this.schiena.scale.set(1 + salto * 0.12, 1 + salto * 0.2, 1 + salto * 0.12);
    // le pile scivolano dolcemente al loro posto nella fila
    for (const tipo of ORDINE) {
      const colonna = this.colonne[tipo];
      colonna.z += (this.posizionePila(tipo) - colonna.z) * Math.min(1, dt * 10);
      colonna.gruppo.position.z = colonna.z;
    }
    this.sistemaEtichette();
  }

  // Il boscaiolo si china in avanti per un attimo (a ogni pezzo che prende o lascia: restando fermo a lavorare resta piegato)
  chinati() {
    this.chino = 1;
  }

  // Inizia il colpo d'ascia verso il lupo che si trova in (x, z)
  colpisciAscia(x, z) {
    this.colpo = 0;
    this.versoColpo = Math.atan2(-(x - this.posizione.x), -(z - this.posizione.z));
  }

  // È arrivato qualcosa (legna, carne o soldi): la pila fa un saltello e brillano delle scintille.
  // punto: dove brillano (se manca, sopra la testa)
  rimbalza(colore = 0xffe066, punto = null) {
    this.saltoPila = 1;
    const p = punto ?? this.posizione.clone().setY(2.2);
    this.effetti?.scintille(p.x, p.y, p.z, colore, 4);
  }

  // Mette a posto il boscaiolo (es. quando torna da una corsa)
  riposiziona() {
    this.posizione.copy(MAPPA.partenza);
    this.angolo = 0;
    this.modello.position.copy(this.posizione);
  }
}
