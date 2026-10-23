// =====================================================================
//  CLIENTI
//  Arrivano da destra, fuori dalle mura, e si mettono in fila. Il primo
//  della fila va allo sportello della merce che vuole (legna o carne) e
//  la prende dal bancone un pezzo alla volta; poi paga: i soldi volano
//  nella pila di monete dentro la base, accanto allo sportello.
//  Se la merce non c'è, aspetta (o cambia idea se c'è l'altra).
// =====================================================================

import * as THREE from 'three';
import { CONFIG } from '../config.js';
import { creaCliente } from '../modelli/cliente.js';
import { creaScritta } from '../modelli/materiali.js';
import { prezzo } from '../economia.js';
import { MAPPA } from './ambiente.js';

const DIMENSIONE = 1.5; // grandezza dei clienti (come il boscaiolo)

export class Clienti {
  // sportelli: { legna, carne }; alVendita(tipo, quantita, incasso) viene chiamata a ogni acquisto;
  // inVolo tiene il conto dei soldi in volo verso le pile (per il salvataggio)
  constructor(genitore, sportelli, effetti, inVolo, alVendita) {
    this.genitore = genitore;
    this.sportelli = sportelli;
    this.effetti = effetti;
    this.alVendita = alVendita;
    this.inVolo = inVolo;
    this.lista = [];
    this.prossimoArrivo = 1; // il primo cliente arriva quasi subito
  }

  aggiorna(dt) {
    const cfg = CONFIG.clienti;

    // --- Arrivo di nuovi clienti ---
    this.prossimoArrivo -= dt;
    const inFila = this.lista.filter((c) => c.stato !== 'esce');
    if (this.prossimoArrivo <= 0 && inFila.length < cfg.filaMassima) {
      this.aggiungiCliente();
      this.prossimoArrivo = cfg.intervalloMinimo + Math.random() * (cfg.intervalloMassimo - cfg.intervalloMinimo);
    }

    // --- Ogni cliente va al suo posto: il primo allo sportello, gli altri in fila ---
    inFila.forEach((cliente, posto) => {
      if (posto === 0) cliente.obiettivo.copy(this.sportelli[cliente.vuole].puntoCliente);
      else cliente.obiettivo.copy(MAPPA.filaClienti(posto));
      const arrivato = this.cammina(cliente, dt);
      cliente.fumetto.visible = posto === 0 && arrivato;
      if (posto === 0 && arrivato) {
        cliente.modello.rotation.y = 0; // guarda il bancone
        cliente.attesa += dt;
        if (cliente.attesa > cfg.tempoAcquisto) this.compra(cliente, dt);
      } else {
        cliente.attesa = 0;
      }
      cliente.fumetto.rotation.set(-0.6, -cliente.modello.rotation.y, 0);
    });

    // --- Chi ha comprato se ne va ---
    for (const cliente of this.lista) {
      if (cliente.stato !== 'esce') continue;
      cliente.obiettivo.copy(MAPPA.uscitaClienti);
      if (this.cammina(cliente, dt)) cliente.daTogliere = true;
    }
    for (const cliente of this.lista.filter((c) => c.daTogliere)) this.togli(cliente);
    this.lista = this.lista.filter((c) => !c.daTogliere);
  }

  aggiungiCliente() {
    const cfg = CONFIG.clienti;
    const modello = creaCliente();
    modello.scale.setScalar(DIMENSIONE);
    modello.position.copy(MAPPA.ingressoClienti);
    this.genitore.add(modello);
    const cliente = {
      modello,
      perni: modello.userData.perni,
      posizione: MAPPA.ingressoClienti.clone(),
      obiettivo: new THREE.Vector3(),
      stato: 'inFila',
      vuole: Math.random() < cfg.probabilitaCarne ? 'carne' : 'legna',
      quantita: cfg.acquistoMinimo + Math.floor(Math.random() * (cfg.acquistoMassimo - cfg.acquistoMinimo + 1)),
      preso: 0,           // unità già prese dal bancone
      prossimoPezzo: 0,   // secondi prima di prendere il prossimo pezzo
      attesa: 0,
      fase: Math.random() * 6,
    };
    this.creaFumetto(cliente);
    this.lista.push(cliente);
  }

  // Il fumetto sopra la testa dice cosa vuole comprare (e quanto ne manca)
  creaFumetto(cliente) {
    let visibile = false;
    if (cliente.fumetto) {
      visibile = cliente.fumetto.visible;
      cliente.modello.remove(cliente.fumetto);
      cliente.fumetto.material.map.dispose();
      cliente.fumetto.material.dispose();
      cliente.fumetto.geometry.dispose();
    }
    cliente.fumetto = creaScritta(`${cliente.quantita - cliente.preso}`, {
      icona: cliente.vuole,
      larghezza: 1.1,
      altezza: 0.38,
      sfondo: '#ffffff',
      coloreTesto: cliente.vuole === 'carne' ? '#c8392f' : '#8a4f1f',
      coloreBordo: 'rgba(0,0,0,0)',
    });
    cliente.fumetto.position.set(0, 1.75, 0);
    cliente.fumetto.rotation.order = 'YXZ'; // così possiamo girarlo sempre verso la telecamera
    cliente.fumetto.visible = visibile;
    cliente.modello.add(cliente.fumetto);
  }

  // Il cliente allo sportello prende la merce un pezzo alla volta
  compra(cliente, dt) {
    cliente.prossimoPezzo -= dt;
    if (cliente.prossimoPezzo > 0) return;
    const sportello = this.sportelli[cliente.vuole];

    if (sportello.quantita <= 0) {
      // Merce finita: se ha già preso qualcosa paga quello, altrimenti prova l'altro sportello
      if (cliente.preso > 0) {
        this.paga(cliente);
        return;
      }
      const altro = cliente.vuole === 'carne' ? 'legna' : 'carne';
      if (this.sportelli[altro].quantita > 0) {
        cliente.vuole = altro;
        this.creaFumetto(cliente);
      }
      return; // niente merce: aspetta
    }

    // Un pezzo vola dalla pila dello sportello al cliente
    const partenza = sportello.cima();
    const presa = sportello.prendiPezzo(cliente.quantita - cliente.preso);
    cliente.preso += presa;
    const testa = cliente.posizione.clone().setY(1.6);
    this.effetti.lancia(cliente.vuole, partenza, () => testa, 0, null, { durata: 0.4, altezza: 1.4, scala: 0.5, sbuffo: false });
    cliente.prossimoPezzo = CONFIG.clienti.intervalloPezzi;

    if (cliente.preso >= cliente.quantita) this.paga(cliente);
    else this.creaFumetto(cliente);
  }

  // I soldi volano dal cliente alla pila di monete dentro la base, e il cliente se ne va
  paga(cliente) {
    const incasso = prezzo(cliente.vuole, cliente.preso);
    const pila = this.sportelli[cliente.vuole].soldi;
    const testa = cliente.posizione.clone().setY(1.6);
    this.inVolo.soldi += incasso;
    this.effetti.lancia('soldi', testa, pila, 0.3, () => {
      this.inVolo.soldi -= incasso;
      pila.aggiungi(incasso);
    }, { durata: 0.55, altezza: 1.8 });
    this.effetti.testo(testa.x, testa.y + 0.6, testa.z, `+${incasso} $`, 'buono');

    this.alVendita(cliente.vuole, cliente.preso, incasso);
    cliente.stato = 'esce';
    cliente.fumetto.visible = false;
  }

  // Fa camminare il cliente verso il suo obiettivo. Restituisce true se è arrivato.
  cammina(cliente, dt) {
    const verso = cliente.obiettivo.clone().sub(cliente.posizione);
    verso.y = 0;
    const distanza = verso.length();
    const passo = CONFIG.clienti.velocita * dt;
    const arrivato = distanza <= passo;
    if (arrivato) {
      cliente.posizione.copy(cliente.obiettivo);
    } else {
      cliente.posizione.addScaledVector(verso, passo / distanza);
      cliente.modello.rotation.y = Math.atan2(-verso.x, -verso.z);
    }
    // animazione del passo
    const muove = !arrivato;
    cliente.fase += dt * (muove ? 11 : 0);
    const p = muove ? Math.sin(cliente.fase) : 0;
    cliente.perni.gambaSx.rotation.x = p * 0.7;
    cliente.perni.gambaDx.rotation.x = -p * 0.7;
    cliente.perni.braccioSx.rotation.x = -p * 0.5;
    cliente.perni.braccioDx.rotation.x = p * 0.5;
    cliente.modello.position.set(cliente.posizione.x, Math.abs(p) * 0.05, cliente.posizione.z);
    return arrivato;
  }

  togli(cliente) {
    this.genitore.remove(cliente.modello);
    cliente.fumetto.material.map.dispose();
    cliente.fumetto.material.dispose();
    cliente.fumetto.geometry.dispose();
  }
}
