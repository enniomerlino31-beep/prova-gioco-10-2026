// =====================================================================
//  IL PERSONALE (Gruppo 8): paga, licenziare e assumere
//  Ogni lavoratore a pagamento (aiutante, i due cacciatori, il venditore della carne, il boscaiolo secondario) ha uno stato nel
//  salvataggio (stato.personale): 'lavora', 'attesa' (a fine giornata non c'erano le monete: resta al lavoro e viene pagato con le
//  prime monete che arrivano, entro CONFIG.personale.margine secondi), 'casa' (non è stato pagato in tempo: aspetta di essere
//  richiamato) o 'licenziato'. Il PRIMO acquisto resta quello dei cerchi (prezzi invariati); poi Richiama/Assumi costa UNA paga.
//  Il venditore della legna è gratuito: non ha paga e non si licenzia. Gli arcieri non sono personale.
//  A fine giornata (Segheria.fineGiornata) si paga: venditore carne, aiutante, cacciatori, boscaiolo secondario, finché ci sono monete.
//  Chi esce lo fa a piedi dal cancello (PartenzaLavoratore); chi rientra arriva a piedi (ArrivoLavoratore), come con l'acquisto.
//  Se il lavoratore sta facendo qualcosa che non si può interrompere (legna o carne in volo) esce appena finisce.
// =====================================================================

import * as THREE from 'three';
import { CONFIG } from '../config.js';
import { LAVORATORI } from '../salvataggio.js';
import { MAPPA } from './ambiente.js';
import { postoVenditore } from './venditore.js';
import { durataGiro } from './secondario.js';
import { PartenzaLavoratore } from './arrivo.js';

const NOMI = { aiutante: 'Aiutante', cacciatore0: 'Cacciatore', cacciatore1: 'Secondo cacciatore', venditoreCarne: 'Venditore carne', secondario: 'Boscaiolo secondario' };

export class Personale {
  constructor(base) {
    this.base = base;
    this.dati = base.stato.personale;
    this.primoACasa = false; // è successo almeno una volta che qualcuno non sia stato pagato in tempo (serve all'avviso)
  }

  // ---- chi c'è e quanto costa ----

  // Il lavoratore è stato comprato (con il suo cerchio)?
  comprato(chiave) {
    const l = this.base.livelli;
    switch (chiave) {
      case 'aiutante': return l.aiutante > 0;
      case 'cacciatore0': return l.cacciatore > 0;
      case 'cacciatore1': return l.secondoCacciatore > 0;
      case 'venditoreCarne': return l.venditore > 0;
      default: return l.boscaioloSecondario > 0;
    }
  }

  stato(chiave) {
    return this.dati[chiave].stato;
  }

  // Sta lavorando (o sta aspettando di essere pagato)?
  lavora(chiave) {
    const s = this.stato(chiave);
    return s === 'lavora' || s === 'attesa';
  }

  // La paga di un giorno (secondo il livello comprato)
  paga(chiave) {
    const P = CONFIG.personale.paghe;
    const l = this.base.livelli;
    switch (chiave) {
      case 'aiutante': return P.aiutante;
      case 'cacciatore0':
      case 'cacciatore1': return P.cacciatore[Math.max(0, l.cacciatore - 1)];
      case 'venditoreCarne': return P.venditore[Math.max(0, l.venditore - 1)];
      default: return P.secondario;
    }
  }

  nome(chiave) {
    return NOMI[chiave];
  }

  // Almeno un lavoratore a pagamento è stato comprato (serve al pulsante del personale)
  get ciSono() {
    return LAVORATORI.some((chiave) => this.comprato(chiave));
  }

  // L'elenco per il menu: solo chi è stato comprato
  elenco() {
    return LAVORATORI.filter((chiave) => this.comprato(chiave)).map((chiave) => ({
      chiave,
      nome: chiave === 'cacciatore0' && this.base.livelli.secondoCacciatore > 0 ? 'Cacciatore 1' : chiave === 'cacciatore1' ? 'Cacciatore 2' : NOMI[chiave],
      stato: this.stato(chiave),
      paga: this.paga(chiave),
      dorme: Boolean(this.oggetto(chiave)?.dorme),
    }));
  }

  // Quanto si pagherà a fine giornata (solo chi lavora)
  get totaleGiornaliero() {
    return LAVORATORI.filter((chiave) => this.comprato(chiave) && this.stato(chiave) === 'lavora').reduce((somma, chiave) => somma + this.paga(chiave), 0);
  }

  // Il lavoratore vero in scena (null se non c'è: sta arrivando, o è a casa)
  oggetto(chiave) {
    const b = this.base;
    switch (chiave) {
      case 'aiutante': return b.aiutante;
      case 'cacciatore0': return b.cacciatori.find((c) => c.numero === 0) ?? null;
      case 'cacciatore1': return b.cacciatori.find((c) => c.numero === 1) ?? null;
      case 'venditoreCarne': return b.sportelli.carne.venditore ?? null;
      case 'venditoreLegna': return b.sportelli.legna.venditore ?? null; // gratuito: non è nell'elenco, ma si può stancare
      default: return b.secondario;
    }
  }

  // ---- la paga ----

  // A fine giornata: paga chi lavora, nell'ordine venditore carne, aiutante, cacciatori, secondario. Chi non può essere pagato
  // resta "in attesa" per il margine. Restituisce le monete pagate.
  pagaFineGiornata() {
    let totale = 0;
    for (const chiave of ['venditoreCarne', 'aiutante', 'cacciatore0', 'cacciatore1', 'secondario']) {
      if (!this.comprato(chiave) || this.stato(chiave) !== 'lavora') continue;
      const paga = this.paga(chiave);
      if (this.base.stato.soldi >= paga) {
        this.base.stato.soldi -= paga;
        totale += paga;
      } else {
        this.dati[chiave] = { stato: 'attesa', attesa: CONFIG.personale.margine };
      }
    }
    return totale;
  }

  // Da chiamare a ogni fotogramma (base e corsa): chi aspetta la paga viene pagato appena ci sono le monete; scaduto il margine va a casa
  aggiorna(dt) {
    for (const chiave of LAVORATORI) {
      const d = this.dati[chiave];
      if (d.stato === 'attesa' && this.comprato(chiave)) {
        const paga = this.paga(chiave);
        if (this.base.stato.soldi >= paga) {
          this.base.stato.soldi -= paga;
          this.dati[chiave] = { stato: 'lavora', attesa: 0 };
        } else {
          d.attesa -= dt;
          if (d.attesa <= 0) {
            this.primoACasa = true;
            this.manda(chiave, 'casa');
          }
        }
      }
      // chi è a casa o licenziato esce appena può (non a metà di un trasporto)
      if ((d.stato === 'casa' || d.stato === 'licenziato') && this.oggetto(chiave)) this.togli(chiave);
    }
  }

  // ---- licenziare, mandare a casa, assumere ----

  // Il lavoratore smette di lavorare: stato 'casa' (non pagato) o 'licenziato'; esce quando può
  manda(chiave, stato) {
    this.dati[chiave] = { stato, attesa: 0 };
    this.base.salvaOra();
    this.aggiornaRapidita();
    this.togli(chiave);
  }

  licenzia(chiave) {
    if (!this.comprato(chiave) || !this.lavora(chiave)) return false;
    this.manda(chiave, 'licenziato');
    return true;
  }

  // Richiama (era a casa) o assume di nuovo (era licenziato): costa UNA paga. Restituisce false se mancano le monete.
  riassumi(chiave) {
    if (!this.comprato(chiave) || this.lavora(chiave)) return false;
    const paga = this.paga(chiave);
    if (this.base.stato.soldi < paga) return false;
    this.base.stato.soldi -= paga;
    this.dati[chiave] = { stato: 'lavora', attesa: 0 };
    this.aggiornaRapidita();
    if (!this.oggetto(chiave)) this.faiArrivare(chiave);
    this.base.salvaOra();
    return true;
  }

  // I clienti sono più veloci solo se il venditore della carne (quello che ha i miglioramenti "svelto" ed "esperto") lavora
  aggiornaRapidita() {
    const livello = this.base.livelloComprato('venditore');
    this.base.clienti.rapidita = livello && this.lavora('venditoreCarne') ? livello.rapidita : 1;
  }

  // Si può togliere il lavoratore adesso, senza perdere legna o carne in volo?
  puoUscire(oggetto, chiave) {
    if (chiave === 'aiutante') return !oggetto.sequenza;
    if (chiave === 'secondario') return oggetto.dalSlitta.length === 0;
    if (chiave.startsWith('cacciatore')) return oggetto.stato !== 'attesa';
    return true;
  }

  // Toglie il lavoratore dalla scena (a piedi dal cancello; il boscaiolo secondario, che sta nella foresta, sparisce con una nuvoletta)
  togli(chiave) {
    const b = this.base;
    const o = this.oggetto(chiave);
    if (!o || !this.puoUscire(o, chiave)) return;
    if (chiave === 'aiutante') {
      if (o.carico > 0) b.catasta.aggiungi(o.carico); // la legna che portava torna nella catasta
      b.aiutante = null;
      this.parte('aiutante', o);
    } else if (chiave.startsWith('cacciatore')) {
      if (o.carico > 0) b.sportelli.carne.aggiungi(o.carico);
      b.cacciatori = b.cacciatori.filter((c) => c !== o);
      this.parte('cacciatore', o);
    } else if (chiave === 'venditoreCarne') {
      b.sportelli.carne.venditore = null;
      b.venditori = b.venditori.filter((v) => v !== o);
      this.parte('venditore', o);
    } else {
      b.secondario = null;
      o.modello.parent?.remove(o.modello);
      o.cartellino.sprite.parent?.remove(o.cartellino.sprite);
      b.effetti.sbuffo(MAPPA.cancelli.corsa.x, 0.8, MAPPA.cancelli.corsa.z, 0xe9e1cc, 6, 1.4);
    }
    o.dorme = false;
    b.riposo?.perso(o); // se dormiva, il suo sonno finisce
  }

  // Esce a piedi dal cancello del suo lato
  parte(tipo, oggetto) {
    const b = this.base;
    oggetto.modello.parent?.remove(oggetto.modello);
    b.arrivi.push(new PartenzaLavoratore(b.radice, b.effetti, tipo, oggetto.posizione ?? oggetto.modello.position));
  }

  // Arriva a piedi da un cancello e prende il suo posto (come dopo l'acquisto). Se nel frattempo è stato mandato via di nuovo, niente.
  faiArrivare(chiave) {
    const b = this.base;
    const ancora = () => this.lavora(chiave);
    if (chiave === 'aiutante') {
      const posto = b.catasta.posizione.clone().add(new THREE.Vector3(0, 0, 1));
      b.arrivaALavorare('aiutante', posto, () => { if (ancora() && !b.aiutante) b.aiutante = b.creaAiutante(false); });
    } else if (chiave.startsWith('cacciatore')) {
      const numero = chiave === 'cacciatore0' ? 0 : 1;
      b.arrivaALavorare('cacciatore', MAPPA.casaCacciatore, () => { if (ancora() && !this.oggetto(chiave)) b.nuovoCacciatore(b.livelloComprato('cacciatore'), numero); });
    } else if (chiave === 'venditoreCarne') {
      const sportello = b.sportelli.carne;
      b.arrivaALavorare('venditore', postoVenditore(sportello), () => { if (ancora() && !sportello.venditore) b.venditori.push(b.creaVenditore(sportello, false)); });
    } else {
      b.arrivaALavorare('secondario', MAPPA.giroSecondario[0], () => { if (ancora() && !b.secondario) b.secondario = b.creaSecondario(durataGiro(), false); });
    }
  }

  // Inizia una nuova giornata (qui, più avanti, si svegliano tutti: vedi riposo.js)
  nuovaGiornata() {}
}
