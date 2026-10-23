// =====================================================================
//  CLIENTI
//  Arrivano da destra, si mettono in fila al tavolino, il primo della
//  fila compra la merce che vuole (legna o carne), lascia i soldi nella
//  pila accanto al tavolino e se ne va. Se la merce non c'è, aspetta.
// =====================================================================

import * as THREE from 'three';
import { CONFIG } from '../config.js';
import { creaCliente } from '../modelli/cliente.js';
import { creaScritta } from '../modelli/materiali.js';
import { prezzo } from '../economia.js';
import { MAPPA } from './ambiente.js';

const DIMENSIONE = 1.5; // grandezza dei clienti (come il boscaiolo)

export class Clienti {
  // alVendita(tipo, quantita, incasso) viene chiamata a ogni acquisto;
  // inVolo tiene il conto dei soldi in volo verso la pila (per il salvataggio)
  constructor(genitore, tavolino, pilaSoldi, effetti, inVolo, alVendita) {
    this.genitore = genitore;
    this.tavolino = tavolino;
    this.pilaSoldi = pilaSoldi;
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

    // --- Ogni cliente va al suo posto nella fila ---
    inFila.forEach((cliente, posto) => {
      cliente.obiettivo.copy(MAPPA.filaClienti(posto));
      const arrivato = this.cammina(cliente, dt);
      cliente.fumetto.visible = posto === 0 && arrivato;
      // il fumetto guarda sempre verso la telecamera, comunque sia girato il cliente
      cliente.fumetto.rotation.set(-0.6, -cliente.modello.rotation.y, 0);
      if (posto === 0 && arrivato) {
        cliente.modello.rotation.y = Math.PI; // si gira verso il tavolino
        cliente.attesa += dt;
        if (cliente.attesa > cfg.tempoAcquisto) this.provaAComprare(cliente);
      } else {
        cliente.attesa = 0;
      }
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
      attesa: 0,
      fase: Math.random() * 6,
    };
    this.creaFumetto(cliente);
    this.lista.push(cliente);
  }

  // Il fumetto sopra la testa dice cosa vuole comprare
  creaFumetto(cliente) {
    if (cliente.fumetto) {
      cliente.modello.remove(cliente.fumetto);
      cliente.fumetto.material.map.dispose();
      cliente.fumetto.material.dispose();
    }
    cliente.fumetto = creaScritta(`${cliente.quantita} ${cliente.vuole}`, {
      larghezza: 1.1,
      altezza: 0.38,
      sfondo: '#ffffff',
      coloreTesto: cliente.vuole === 'carne' ? '#c8392f' : '#8a4f1f',
      coloreBordo: 'rgba(0,0,0,0)',
    });
    cliente.fumetto.position.set(0, 1.75, 0);
    cliente.fumetto.rotation.order = 'YXZ'; // così possiamo girarlo sempre verso la telecamera
    cliente.fumetto.visible = false;
    cliente.modello.add(cliente.fumetto);
  }

  // Il cliente in testa alla fila compra (se la merce c'è)
  provaAComprare(cliente) {
    const t = this.tavolino;
    const disponibile = (tipo) => (tipo === 'carne' ? t.carne : t.legna) > 0;
    // Se quello che vuole non c'è ma c'è l'altra merce, cambia idea
    const altro = cliente.vuole === 'carne' ? 'legna' : 'carne';
    if (!disponibile(cliente.vuole) && disponibile(altro)) {
      cliente.vuole = altro;
      this.creaFumetto(cliente);
    }
    if (!disponibile(cliente.vuole)) return; // niente merce: aspetta

    const presa = t.prendi(cliente.vuole, cliente.quantita);
    const incasso = prezzo(cliente.vuole, presa);
    const testa = cliente.posizione.clone().setY(1.6);

    // La merce vola dal tavolino al cliente
    const pezziVisibili = Math.min(3, Math.ceil(presa / CONFIG.segheria.unitaPerPezzo));
    for (let i = 0; i < pezziVisibili; i++) {
      const partenza = t.puntoDiArrivo(cliente.vuole);
      this.effetti.lancia(cliente.vuole, partenza, () => testa, i * 0.08, null, { durata: 0.4, altezza: 1.2, scala: 0.5, sbuffo: false });
    }
    // I soldi volano dal cliente alla pila accanto al tavolino
    this.inVolo.soldi += incasso;
    this.effetti.lancia('soldi', testa, this.pilaSoldi, 0.35, () => {
      this.inVolo.soldi -= incasso;
      this.pilaSoldi.aggiungi(incasso);
    }, { durata: 0.5, altezza: 1.5 });
    this.effetti.testo(testa.x, testa.y + 0.6, testa.z, `+${incasso} $`, 'buono');

    this.alVendita(cliente.vuole, presa, incasso);
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
