// =====================================================================
//  CLIENTI
//  Arrivano di continuo dal basso, fuori dalle mura, uno dopo l'altro.
//  Ognuno vuole legna o carne e si mette nella fila davanti a quello
//  sportello. Il primo della fila prende la merce dal bancone un pezzo
//  alla volta; poi paga (i soldi volano nella pila di monete dentro la
//  base) e se ne va. Se il deposito è vuoto, la fila aspetta finché il
//  boscaiolo non porta altra merce.
// =====================================================================

import * as THREE from 'three';
import { CONFIG } from '../config.js';
import { creaCliente } from '../modelli/cliente.js';
import { animaPersona } from '../modelli/animazioni.js';
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
    this.rapidita = 1;       // con il venditore è più di 1: i clienti arrivano e vengono serviti più in fretta
    this.spinta = 0;         // inizio più veloce: 1 = clienti come in CONFIG.clienti.avvio, 0 = ritmo normale (vedi segheria.js)
  }

  // Un numero a metà tra quello normale e quello dell'inizio più veloce, secondo la spinta
  conSpinta(normale, avvio) {
    return THREE.MathUtils.lerp(normale, avvio, this.spinta);
  }

  // Quanto in fretta vengono serviti i clienti (venditore e inizio più veloce)
  get svelti() {
    return this.rapidita * this.conSpinta(1, CONFIG.clienti.avvio.rapidita);
  }

  aggiorna(dt) {
    const cfg = CONFIG.clienti;

    // --- Arrivo di nuovi clienti, uno dopo l'altro (finché le file non sono piene) ---
    this.prossimoArrivo -= dt;
    if (this.prossimoArrivo <= 0) {
      const arrivato = this.aggiungiCliente();
      const minimo = this.conSpinta(cfg.intervalloMinimo, cfg.avvio.intervalloMinimo);
      const massimo = this.conSpinta(cfg.intervalloMassimo, cfg.avvio.intervalloMassimo);
      this.prossimoArrivo = arrivato ? (minimo + Math.random() * (massimo - minimo)) / this.rapidita : 0.5;
    }

    // --- Ogni fila: il primo al bancone, gli altri dietro, lungo le mura ---
    for (const [tipo, sportello] of Object.entries(this.sportelli)) {
      this.fila(tipo).forEach((cliente, posto) => {
        sportello.posizioneFila(posto, cliente.obiettivo);
        const arrivato = this.cammina(cliente, dt);
        cliente.fumetto.visible = arrivato;
        if (arrivato) {
          // il primo guarda il bancone, gli altri guardano verso lo sportello
          cliente.modello.rotation.y = posto === 0 ? 0 : sportello.versoFuori * (Math.PI / 2);
        }
        if (posto === 0 && arrivato) {
          cliente.attesa += dt;
          if (cliente.attesa > cfg.tempoAcquisto / this.svelti) this.compra(cliente, dt);
        } else {
          cliente.attesa = 0;
        }
        cliente.fumetto.rotation.set(-0.6, -cliente.modello.rotation.y, 0);
      });
    }

    // --- Chi ha comprato se ne va ---
    for (const cliente of this.lista) {
      if (cliente.stato !== 'esce') continue;
      cliente.obiettivo.copy(this.sportelli[cliente.vuole].uscita);
      if (this.cammina(cliente, dt)) cliente.daTogliere = true;
    }
    for (const cliente of this.lista.filter((c) => c.daTogliere)) this.togli(cliente);
    this.lista = this.lista.filter((c) => !c.daTogliere);
  }

  // I clienti di una fila (in ordine di arrivo)
  fila(tipo) {
    return this.lista.filter((c) => c.vuole === tipo && c.stato !== 'esce');
  }

  // Quanti clienti possono aspettare in fila davanti a uno sportello (la fila della carne è più corta)
  postiInFila(tipo) {
    return tipo === 'carne' ? CONFIG.clienti.filaCarne : CONFIG.clienti.filaPerSportello;
  }

  // Arriva un cliente nuovo. Chi vuole carne e trova la fila piena va a comprare legna;
  // chi vuole legna e trova la fila piena non arriva (così la carne ha sempre meno clienti).
  aggiungiCliente() {
    const cfg = CONFIG.clienti;
    let vuole = Math.random() < cfg.probabilitaCarne ? 'carne' : 'legna';
    if (vuole === 'carne' && this.fila('carne').length >= this.postiInFila('carne')) vuole = 'legna';
    if (this.fila(vuole).length >= this.postiInFila(vuole)) return false;

    const modello = creaCliente();
    modello.scale.setScalar(DIMENSIONE);
    modello.position.copy(MAPPA.ingressoClienti);
    this.genitore.add(modello);
    const cliente = {
      modello,
      posizione: MAPPA.ingressoClienti.clone(),
      obiettivo: new THREE.Vector3(),
      stato: 'inFila',
      vuole,
      quantita: Math.round(this.conSpinta(cfg.acquistoMinimo, cfg.avvio.acquistoMinimo) +
        Math.random() * (this.conSpinta(cfg.acquistoMassimo, cfg.avvio.acquistoMassimo) - this.conSpinta(cfg.acquistoMinimo, cfg.avvio.acquistoMinimo))),
      preso: 0,           // unità già prese dal bancone
      prossimoPezzo: 0,   // secondi prima di prendere il prossimo pezzo
      attesa: 0,
    };
    this.creaFumetto(cliente);
    this.lista.push(cliente);
    return true;
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

    if (sportello.quantita <= 0) return; // merce finita: aspetta al bancone che il boscaiolo ne porti altra

    // Un pezzo vola dalla pila dello sportello al cliente; se c'è il venditore, glielo passa lui (parte dalle sue mani)
    const dalBancone = { da: sportello.cima(), ritardo: 0 };
    const presa = sportello.prendiPezzo(cliente.quantita - cliente.preso);
    cliente.preso += presa;
    const { da, ritardo } = sportello.venditore ? sportello.venditore.passa() : dalBancone;
    const testa = cliente.posizione.clone().setY(1.6);
    this.effetti.lancia(cliente.vuole, da, () => testa, ritardo, null, { durata: 0.4, altezza: 1.4, scala: 0.5, sbuffo: false });
    cliente.prossimoPezzo = CONFIG.clienti.intervalloPezzi / this.svelti;

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
    this.effetti.testo(testa.x, testa.y + 0.6, testa.z, `+${incasso}`, 'buono', 'moneta');

    this.alVendita(cliente.vuole, cliente.preso, incasso);
    if (this.sportelli[cliente.vuole].venditore && Math.random() < CONFIG.economia.probabilitaMancia) this.mancia(cliente, testa, pila);
    cliente.stato = 'esce';
    cliente.fumetto.visible = false;
  }

  // Con il venditore, a volte il cliente lascia una mancia: una monetina in più salta fuori e vola nella pila
  mancia(cliente, testa, pila) {
    const { manciaMinima, manciaMassima } = CONFIG.economia;
    const mancia = manciaMinima + Math.floor(Math.random() * (manciaMassima - manciaMinima + 1));
    this.inVolo.soldi += mancia;
    this.effetti.lancia('moneta', testa, pila, 0.5, () => {
      this.inVolo.soldi -= mancia;
      pila.aggiungi(mancia);
      this.effetti.scintille(pila.posizione.x, 0.4, pila.posizione.z, 0xffe066, 5);
    }, { durata: 0.75, altezza: 2.8, sbuffo: false });
    this.effetti.testo(testa.x, testa.y + 1.2, testa.z, `+${mancia} mancia`, 'buono', 'moneta');
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
    // passo con rimbalzo (vedi animazioni.js), da fermo respira; a ogni passo un po' di neve
    if (animaPersona(cliente.modello, dt, arrivato ? 0 : 1)) this.effetti.passo(cliente.modello);
    cliente.modello.position.set(cliente.posizione.x, 0, cliente.posizione.z);
    return arrivato;
  }

  togli(cliente) {
    this.genitore.remove(cliente.modello);
    cliente.fumetto.material.map.dispose();
    cliente.fumetto.material.dispose();
    cliente.fumetto.geometry.dispose();
  }
}
