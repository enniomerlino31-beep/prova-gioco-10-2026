// =====================================================================
//  VENDITORE (si compra con il cerchio "Venditore")
//  Uno per sportello, con il berretto giallo, la camicia chiara e il
//  grembiule verde. Sta dietro il bancone, tra il deposito e i clienti,
//  e ogni volta che un cliente prende un pezzo allunga le braccia come per
//  passarglielo. Quando sul deposito resta poca merce va a prenderne altra:
//  il venditore della LEGNA dalla catasta, quello della CARNE dalla
//  dispensa. Gira attorno al deposito lungo la corsia laterale, torna con
//  il carico sulla schiena, lo scarica sul deposito e torna al bancone.
//  La velocità dei clienti la regola Clienti (vedi "rapidita").
// =====================================================================

import * as THREE from 'three';
import { CONFIG } from '../config.js';
import { creaLavoratore } from '../modelli/boscaiolo.js';
import { tinta } from '../modelli/materiali.js';
import { geometriaTronco, materialiTronco } from '../modelli/carro.js';
import { creaCarne } from '../modelli/carne.js';
import { DEPOSITO_Z, DEPOSITO_MEZZA_Z, DEPOSITO_MEZZA_X, BANCO_DENTRO } from '../modelli/sportello.js';

const VOLO = { durata: 0.4, altezza: 1.3, scala: 0.55, sbuffo: false };
// in mezzo tra il deposito e il bancone (così la tettoia non lo copre)
const Z_VENDITORE = (DEPOSITO_Z + DEPOSITO_MEZZA_Z + BANCO_DENTRO) / 2 - 0.15;
const CORSIA = DEPOSITO_MEZZA_X + 0.7; // la corsia laterale per girare attorno al deposito (dalla parte delle mura)
const PEZZI_SCHIENA = 3;

// Dove sta il venditore dietro il bancone di uno sportello (serve anche alla telecamera, prima che compaia)
export function postoVenditore(sportello) {
  return sportello.posizione.clone().setZ(sportello.posizione.z + Z_VENDITORE);
}

export class Venditore {
  // magazzino: la catasta (per lo sportello LEGNA) o la dispensa (per lo sportello CARNE)
  // inVolo: il conto della merce in volo (per il salvataggio)
  constructor(genitore, sportello, magazzino, effetti, inVolo) {
    this.sportello = sportello;
    this.magazzino = magazzino;
    this.effetti = effetti;
    this.inVolo = inVolo;
    this.tipo = sportello.tipo;
    this.ultimaQuantita = sportello.quantita;
    this.carico = 0;     // unità di merce sulla schiena
    this.stato = 'banco'; // 'banco', 'va' (verso il magazzino), 'porta' (verso il deposito), 'torna', 'attesa' (merce in volo)
    this.percorso = [];
    this.servizio = 0;   // animazione del passaggio della merce (da 1 a 0)
    this.comparsa = 0;
    this.fase = 0;
    this.tempo = Math.random() * 6;

    // I punti del suo giro
    const verso = sportello.versoFuori; // -1 a sinistra, +1 a destra: la corsia sta dalla parte delle mura
    const lato = sportello.posizione.x + verso * CORSIA;
    this.punti = {
      banco: postoVenditore(sportello),
      corsiaBanco: new THREE.Vector3(lato, 0, sportello.posizione.z + Z_VENDITORE),
      corsiaDeposito: new THREE.Vector3(lato, 0, sportello.zona.z),
      deposito: sportello.zona.clone().add(new THREE.Vector3(verso * 0.6, 0, 0)),     // accanto a dove scarica l'aiutante
      magazzino: magazzino.posizione.clone().add(new THREE.Vector3(verso * 0.6, 0, 1.2)), // davanti alla catasta o alla dispensa
    };
    this.posizione = this.punti.banco.clone();

    this.modello = creaLavoratore({ berretto: 0xf2b632, berrettoScuro: 0xc98f1c, giacca: 0xf1ead8, senzaAscia: true });
    const grembiule = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), tinta(0x4f8a3c));
    grembiule.position.set(0, 0.55, -0.16);
    grembiule.scale.set(0.3, 0.36, 0.03);
    this.modello.userData.perni.corpo.add(grembiule);
    this.perni = this.modello.userData.perni;
    this.modello.position.copy(this.posizione);
    this.modello.rotation.y = Math.PI; // guarda i clienti, fuori dalle mura
    this.modello.scale.setScalar(0.001);
    genitore.add(this.modello);

    // la merce sulla schiena (si vede solo quando porta qualcosa)
    this.schiena = new THREE.Group();
    this.schiena.position.set(0, 0.55, 0.24);
    this.pezzi = [];
    for (let i = 0; i < PEZZI_SCHIENA; i++) {
      let pezzo;
      if (this.tipo === 'carne') {
        pezzo = creaCarne();
        pezzo.scale.setScalar(0.75);
      } else {
        pezzo = new THREE.Mesh(geometriaTronco, materialiTronco);
        pezzo.rotation.z = Math.PI / 2;
        pezzo.scale.set(0.7, 0.32, 0.7);
        pezzo.castShadow = true;
      }
      pezzo.position.y = 0.06 + i * 0.2;
      pezzo.visible = false;
      this.schiena.add(pezzo);
      this.pezzi.push(pezzo);
    }
    this.modello.add(this.schiena);
  }

  aggiorna(dt) {
    this.comparsa = Math.min(1, this.comparsa + dt * 2);
    const c = this.comparsa;
    this.modello.scale.setScalar(Math.max(0.001, CONFIG.segheria.dimensioneBoscaiolo * 0.9 * (c < 1 ? c + Math.sin(c * Math.PI) * 0.35 : 1)));
    this.tempo += dt;

    // un cliente ha preso un pezzo: se il venditore è al bancone glielo "passa"
    if (this.sportello.quantita < this.ultimaQuantita && this.stato === 'banco') this.servizio = 1;
    this.ultimaQuantita = this.sportello.quantita;
    this.servizio = Math.max(0, this.servizio - dt * 4);

    const p = this.punti;
    if (this.stato === 'banco') {
      this.alBanco(dt);
      if (this.sportello.quantita < CONFIG.lavoratori.scortaSportello && this.magazzino.quantita > 0 && this.servizio <= 0) {
        this.stato = 'va';
        this.percorso = [p.corsiaBanco, p.corsiaDeposito, p.magazzino];
      }
    } else if (this.stato === 'va') {
      if (this.seguiPercorso(dt)) this.prendi();
    } else if (this.stato === 'porta') {
      if (this.seguiPercorso(dt)) this.scarica();
    } else if (this.stato === 'torna') {
      if (this.seguiPercorso(dt)) this.stato = 'banco';
    } else {
      this.cammina(this.posizione, dt); // 'attesa': fermo mentre la merce vola
    }
  }

  // Dietro il bancone: si guarda un po' intorno e passa la merce ai clienti
  alBanco(dt) {
    this.cammina(this.posizione, dt);
    const s = Math.sin(this.servizio * Math.PI);
    this.perni.braccioSx.rotation.x = 0.25 + s * 1.3;
    this.perni.braccioDx.rotation.x = 0.25 + s * 1.3;
    this.modello.rotation.y = Math.PI + Math.sin(this.tempo * 1.5) * 0.12;
    this.modello.position.y = s * 0.06;
  }

  // Davanti alla catasta (o alla dispensa): un carico vola sulla sua schiena
  prendi() {
    const partenza = this.magazzino.cima();
    const quantita = this.magazzino.prendiPezzo(CONFIG.lavoratori.caricoVenditore);
    if (quantita <= 0) {
      // il magazzino si è svuotato mentre arrivava: torna al bancone a mani vuote
      this.stato = 'torna';
      this.percorso = [this.punti.corsiaDeposito, this.punti.corsiaBanco, this.punti.banco];
      return;
    }
    this.stato = 'attesa';
    this.inVolo[this.tipo] += quantita;
    this.effetti.lancia(this.tipo, partenza, (v) => this.puntoSchiena(v), 0, () => {
      this.inVolo[this.tipo] -= quantita;
      this.carico = quantita;
      this.aggiornaSchiena();
      this.stato = 'porta';
      this.percorso = [this.punti.deposito];
    }, VOLO);
  }

  // Sul cerchio del deposito: il carico vola dalla schiena al deposito dello sportello
  scarica() {
    const quantita = this.carico;
    const partenza = this.puntoSchiena(new THREE.Vector3());
    this.carico = 0;
    this.aggiornaSchiena();
    this.stato = 'attesa';
    this.inVolo[this.tipo] += quantita;
    this.effetti.lancia(this.tipo, partenza, this.sportello, 0, () => {
      this.inVolo[this.tipo] -= quantita;
      this.sportello.aggiungi(quantita);
      this.stato = 'torna';
      this.percorso = [this.punti.corsiaDeposito, this.punti.corsiaBanco, this.punti.banco];
    }, VOLO);
  }

  aggiornaSchiena() {
    const visibili = Math.min(PEZZI_SCHIENA, Math.ceil(this.carico / CONFIG.segheria.unitaPerPezzo));
    this.pezzi.forEach((pezzo, i) => (pezzo.visible = i < visibili));
  }

  puntoSchiena(risultato) {
    risultato.set(0, 0.8, 0);
    this.modello.updateMatrixWorld();
    return this.schiena.localToWorld(risultato);
  }

  // Segue i punti del percorso uno dopo l'altro: true quando è arrivato all'ultimo
  seguiPercorso(dt) {
    const prossimo = this.percorso[0];
    if (!prossimo) return true;
    if (this.cammina(prossimo, dt)) this.percorso.shift();
    return this.percorso.length === 0;
  }

  // Cammina verso un punto: restituisce true quando è arrivato
  cammina(obiettivo, dt) {
    const verso = obiettivo.clone().sub(this.posizione).setY(0);
    const distanza = verso.length();
    const passo = CONFIG.lavoratori.velocitaVenditore * dt;
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
    // con il carico le braccia stanno un po' in avanti, come se lo reggessero
    this.perni.braccioSx.rotation.x = -p * 0.5 + (this.carico > 0 ? 0.5 : 0);
    this.perni.braccioDx.rotation.x = p * 0.5 + (this.carico > 0 ? 0.5 : 0);
    this.modello.position.set(this.posizione.x, Math.abs(p) * 0.05, this.posizione.z);
    return arrivato;
  }
}
