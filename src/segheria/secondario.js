// =====================================================================
//  BOSCAIOLO SECONDARIO (si compra dalla fila ECONOMIA, dopo i quattro lavoratori)
//  Un boscaiolo con il berretto viola che fa le corse da solo: parte dalla
//  catasta tirando una slitta vuota, esce dal cancello della corsa e sparisce
//  tra gli abeti; quando torna, la slitta è carica di tronchi: rientra dal
//  cancello, scarica la legna sulla catasta e riparte.
//  Un giro intero dura "minutiSecondario" minuti e porta "legnaSecondario"
//  unità di legna (CONFIG.lavoratori).
//  Tutto dipende da un solo numero, "mancano": i secondi che mancano al suo
//  arrivo alla catasta con la legna. Così si salva facilmente, va avanti
//  anche durante le corse (avanza) e quando il gioco è chiuso (offline.js).
//  Accanto al cancello della corsa un cartellino dice tra quanto torna.
// =====================================================================

import * as THREE from 'three';
import { CONFIG } from '../config.js';
import { creaLavoratore } from '../modelli/boscaiolo.js';
import { animaPersona } from '../modelli/animazioni.js';
import { geometriaTronco, materialiTronco } from '../modelli/carro.js';
import { tinta, creaEtichettaVariabile } from '../modelli/materiali.js';
import { MAPPA } from './ambiente.js';
import { suoni } from '../motore/suoni.js';

const SCALA = CONFIG.segheria.dimensioneBoscaiolo * 0.9; // grande come l'aiutante
const SOSTA = 1.2;        // secondi fermo alla catasta mentre la legna vola dalla slitta
const SPARISCE_IN = 2.5;  // negli ultimi metri verso la foresta si rimpicciolisce e sparisce (e ricompare da lì)
const VOLI_SCARICO = 6;   // in quanti voli la legna passa dalla slitta alla catasta
const VOLO = { durata: 0.45, altezza: 1.6, scala: 0.55, sbuffo: false };
// il conto alla rovescia sta accanto al cancello della corsa, a destra, sopra la palizzata
// (non al centro, dove in alto c'è la barra della vita delle mura)
const POSTO_CARTELLINO = { x: 3.6, y: 2.4 };

// I secondi di un giro intero (da quando scarica la legna a quando torna a scaricarla)
export function durataGiro() {
  return CONFIG.lavoratori.minutiSecondario * 60;
}

export class BoscaioloSecondario {
  // mancano: secondi che mancano al suo arrivo alla catasta con la legna (dal salvataggio);
  // conAnimazione: appena comprato compare con un saltello
  constructor(genitore, catasta, effetti, inVolo, mancano, conAnimazione) {
    this.catasta = catasta;
    this.effetti = effetti;
    this.inVolo = inVolo;
    // un numero strano nel salvataggio (o un giro più corto in config.js) non deve rompere niente
    this.mancano = Number.isFinite(mancano) ? THREE.MathUtils.clamp(mancano, 0.01, durataGiro()) : durataGiro();
    this.comparsa = conAnimazione ? 0 : 1;
    this.posizione = new THREE.Vector3();
    this.visibile = false;

    // La strada: dalla catasta al cancello e poi nella foresta (si percorre all'andata e, al contrario, al ritorno)
    this.strada = MAPPA.giroSecondario;
    this.tappe = [0];
    for (let i = 1; i < this.strada.length; i++) this.tappe.push(this.tappe[i - 1] + this.strada[i].distanceTo(this.strada[i - 1]));
    this.lunghezza = this.tappe[this.tappe.length - 1];
    // andata e ritorno devono stare nel giro: se il giro è cortissimo cammina più in fretta
    this.velocita = Math.max(CONFIG.lavoratori.velocitaSecondario, (2 * this.lunghezza) / (durataGiro() - SOSTA - 1));
    this.tempoCammino = this.lunghezza / this.velocita;

    // berretto viola, per distinguerlo dagli altri lavoratori
    this.modello = creaLavoratore({ berretto: 0x8e4fc4, berrettoScuro: 0x6a3596 });
    this.modello.visible = false;
    genitore.add(this.modello);
    this.creaSlitta();

    // il conto alla rovescia accanto al cancello della corsa
    this.cartellino = creaEtichettaVariabile({
      larghezza: 1.5, altezza: 0.5, icona: 'secondario', sfondo: 'rgba(60,30,90,0.78)', coloreTesto: '#ffffff', coloreBordo: 'rgba(0,0,0,0.8)',
    });
    this.cartellino.sprite.position.set(MAPPA.cancelli.corsa.x + POSTO_CARTELLINO.x, POSTO_CARTELLINO.y, MAPPA.cancelli.corsa.z);
    genitore.add(this.cartellino.sprite);
  }

  // La slitta dietro di lui (misure del modello: il boscaiolo è alto circa 1,4), con la corda e i tronchi
  creaSlitta() {
    const legno = tinta(0x9a5a2a);
    const scuro = tinta(0x5e3517);
    const scatola = new THREE.BoxGeometry(1, 1, 1);
    const pezzo = (materiale, pos, scala, genitore) => {
      const m = new THREE.Mesh(scatola, materiale);
      m.position.set(...pos);
      m.scale.set(...scala);
      m.castShadow = true;
      genitore.add(m);
      return m;
    };
    this.slitta = new THREE.Group();
    this.slitta.position.set(0, 0, 0.62); // dietro di lui (il davanti del modello è verso -z)
    this.modello.add(this.slitta);
    // due pattini, con la punta piegata all'insù verso di lui
    for (const x of [-0.2, 0.2]) {
      pezzo(scuro, [x, 0.025, 0.42], [0.045, 0.04, 0.82], this.slitta);
      const punta = pezzo(scuro, [x, 0.07, 0.0], [0.045, 0.04, 0.14], this.slitta);
      punta.rotation.x = 0.7;
      for (const z of [0.15, 0.65]) pezzo(scuro, [x, 0.07, z], [0.035, 0.08, 0.035], this.slitta); // gambette
    }
    pezzo(legno, [0, 0.125, 0.4], [0.5, 0.04, 0.72], this.slitta); // pianale
    // la corda: dalla punta della slitta alla sua cintura
    const corda = pezzo(tinta(0xd9c39a), [0, 0.0, 0.0], [0.025, 0.025, 1], this.modello);
    const da = new THREE.Vector3(0, 0.42, 0.1);
    const a = new THREE.Vector3(0, 0.1, 0.62);
    corda.position.copy(da).add(a).multiplyScalar(0.5);
    corda.scale.z = da.distanceTo(a);
    corda.rotation.x = Math.atan2(da.y - a.y, a.z - da.z);
    // i tronchi sul pianale (si vedono solo al ritorno): tre sotto e due sopra, per il lungo
    this.tronchi = new THREE.Group();
    this.slitta.add(this.tronchi);
    const posti = [[-0.16, 0.2], [0, 0.2], [0.16, 0.2], [-0.08, 0.34], [0.08, 0.34]];
    for (const [x, y] of posti) {
      const tronco = new THREE.Mesh(geometriaTronco, materialiTronco);
      tronco.rotation.x = Math.PI / 2;
      tronco.scale.set(0.52, 0.42, 0.52);
      tronco.position.set(x, y, 0.4);
      tronco.castShadow = true;
      this.tronchi.add(tronco);
    }
  }

  // Fa passare il tempo. Quando arriva alla catasta scarica la legna e riparte per un altro giro.
  // conAnimazione: nella base la legna vola dalla slitta alla catasta; durante una corsa arriva e basta
  avanza(dt, conAnimazione = false) {
    this.mancano -= dt;
    while (this.mancano <= 0) {
      this.mancano += durataGiro();
      this.scarica(conAnimazione);
    }
  }

  // La legna della slitta finisce sulla catasta
  scarica(conAnimazione) {
    const legna = CONFIG.lavoratori.legnaSecondario;
    if (!conAnimazione) {
      this.catasta.aggiungi(legna);
      return;
    }
    suoni.suona('tronchiCatasta'); // i tronchi scaricati sulla catasta
    this.modello.updateMatrixWorld();
    const partenza = this.slitta.localToWorld(new THREE.Vector3(0, 0.45, 0.4));
    for (let i = 0; i < VOLI_SCARICO; i++) {
      const parte = Math.floor(legna / VOLI_SCARICO) + (i < legna % VOLI_SCARICO ? 1 : 0);
      this.inVolo.legna += parte;
      this.effetti.lancia('legna', partenza, (v) => this.catasta.cima(v), i * 0.12, () => {
        this.inVolo.legna -= parte;
        this.catasta.aggiungi(parte);
      }, VOLO);
    }
    const { x, z } = this.catasta.posizione;
    this.effetti.testo(x, 2.6, z, `+${legna} legna`, 'buono');
  }

  aggiorna(dt) {
    this.avanza(dt, true);
    if (this.comparsa === 0) suoni.suona('comparsa'); // appena comprato: un suono breve mentre spunta
    this.comparsa = Math.min(1, this.comparsa + dt * 2);

    // Dove si trova adesso, in metri di strada dalla catasta (null = è nella foresta, non si vede)
    const dopo = durataGiro() - this.mancano; // secondi da quando ha scaricato l'ultima legna
    let distanza = null;
    let torna = false;
    if (dopo < SOSTA) distanza = 0;                                                  // fermo alla catasta
    else if (dopo < SOSTA + this.tempoCammino) distanza = (dopo - SOSTA) * this.velocita; // va verso la foresta
    else if (this.mancano < this.tempoCammino) {                                      // torna con la legna
      distanza = this.mancano * this.velocita;
      torna = true;
    }
    // ricompare dalla foresta con la slitta carica: si sente la slitta che scivola sulla neve
    if (torna && !this.tornava) suoni.suona('slitta');
    this.tornava = torna;
    this.visibile = distanza !== null;
    this.modello.visible = this.visibile;
    this.cartellino.imposta(this.testoConto());
    if (!this.visibile) return;

    const verso = this.puntoSullaStrada(distanza, this.posizione);
    const inCammino = distanza > 0;
    if (inCammino) {
      // guarda dove va: verso la foresta all'andata, verso la catasta al ritorno
      const segno = torna ? -1 : 1;
      this.modello.rotation.y = Math.atan2(-verso.x * segno, -verso.z * segno);
    } else {
      this.modello.rotation.y = Math.PI / 2; // fermo: guarda la catasta (a sinistra)
    }
    this.tronchi.visible = torna;
    // compare con un saltello quando viene comprato; vicino alla foresta si rimpicciolisce (e ricompare da lì)
    const c = this.comparsa;
    const salto = c < 1 ? c + Math.sin(c * Math.PI) * 0.35 : 1;
    const bosco = THREE.MathUtils.clamp((this.lunghezza - distanza) / SPARISCE_IN, 0, 1);
    this.modello.scale.setScalar(Math.max(0.001, SCALA * salto * bosco));
    if (animaPersona(this.modello, dt, inCammino ? 1 : 0, { carica: torna ? 0.5 : 0 })) {
      this.effetti.passo(this.modello, { grandezza: 1.2 });
    }
    this.modello.position.set(this.posizione.x, 0, this.posizione.z);
  }

  // Il punto della strada a "distanza" metri dalla catasta; restituisce la direzione della strada lì (verso la foresta)
  puntoSullaStrada(distanza, risultato) {
    const d = THREE.MathUtils.clamp(distanza, 0, this.lunghezza);
    let i = 1;
    while (i < this.tappe.length - 1 && this.tappe[i] < d) i++;
    const da = this.strada[i - 1];
    const a = this.strada[i];
    const parte = (d - this.tappe[i - 1]) / Math.max(0.001, this.tappe[i] - this.tappe[i - 1]);
    risultato.lerpVectors(da, a, parte);
    return a.clone().sub(da).normalize();
  }

  // Il conto alla rovescia: minuti e secondi che mancano al suo ritorno alla catasta
  testoConto() {
    const secondi = Math.ceil(this.mancano);
    return `${Math.floor(secondi / 60)}:${String(secondi % 60).padStart(2, '0')}`;
  }
}
