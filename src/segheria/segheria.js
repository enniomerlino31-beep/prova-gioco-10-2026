// =====================================================================
//  SEGHERIA: il "regista" della base
//  Mette insieme ambiente, boscaiolo, catasta, dispensa, tavolino,
//  pila di soldi, clienti e cancello. A ogni fotogramma:
//   - muove il boscaiolo con il joystick
//   - raccoglie/scarica pezzi quando il boscaiolo è nella zona giusta
//   - fa comprare i clienti
//   - salva i progressi sul dispositivo
// =====================================================================

import * as THREE from 'three';
import { CONFIG } from '../config.js';
import { carica, salva } from '../salvataggio.js';
import { registraVendita } from '../economia.js';
import { Effetti } from '../motore/effetti.js';
import { creaAmbiente, MAPPA } from './ambiente.js';
import { Giocatore } from './giocatore.js';
import { Deposito } from './catasta.js';
import { Tavolino } from './tavolino.js';
import { PilaSoldi } from './soldi.js';
import { Clienti } from './clienti.js';
import { Cancello } from './cancello.js';

const OGNI_QUANTO_SALVARE = 2; // secondi

// Opzioni dei voli dentro la segheria (più brevi e piccoli di quelli della corsa)
const VOLO_CORTO = { durata: 0.35, altezza: 1.4, scala: 0.55, sbuffo: false };

export class Segheria {
  // alPartenzaCorsa: funzione chiamata quando il boscaiolo entra nel cancello
  constructor(renderer, schermate, joystick, alPartenzaCorsa) {
    this.renderer = renderer;
    this.schermate = schermate;
    this.joystick = joystick;
    this.alPartenzaCorsa = alPartenzaCorsa;

    const ambiente = creaAmbiente();
    this.ambiente = ambiente;
    this.scena = ambiente.scena;
    this.telecamera = ambiente.telecamera;

    // Progressi salvati
    this.stato = carica();
    const s = this.stato;

    this.radice = new THREE.Group();
    this.scena.add(this.radice);
    this.effetti = new Effetti(this.radice, schermate);

    this.giocatore = new Giocatore(this.radice);
    for (const pezzo of s.schiena) this.giocatore.aggiungi(pezzo.tipo, pezzo.quantita);
    this.catasta = new Deposito(this.radice, 'legna', MAPPA.catasta, s.catasta);
    this.dispensa = new Deposito(this.radice, 'carne', MAPPA.dispensa, s.dispensa);
    this.tavolino = new Tavolino(this.radice, MAPPA.tavolino, s.tavolino);
    this.pilaSoldi = new PilaSoldi(this.radice, MAPPA.soldi, s.soldiATerra);
    this.cancello = new Cancello(this.radice, MAPPA.cancello);

    // Merce e soldi "in volo": se la pagina si chiude a metà volo, nel salvataggio non si perdono
    this.inVolo = { legna: 0, carne: 0, soldi: 0 };

    this.clienti = new Clienti(this.radice, this.tavolino, this.pilaSoldi, this.effetti, this.inVolo, (tipo, quantita, incasso) =>
      registraVendita(this.stato, tipo, quantita, incasso)
    );

    this.attesaRaccolta = 0;
    this.attesaSalvataggio = OGNI_QUANTO_SALVARE;
    this.attiva = false;
    this.haCamminato = false;

    // Salva anche quando la pagina viene chiusa o messa in secondo piano
    window.addEventListener('pagehide', () => this.salvaOra());
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) this.salvaOra();
    });
  }

  // Il bottino della corsa finisce in catasta e dispensa (e viene salvato subito)
  aggiungiBottino(legna, carne) {
    this.catasta.aggiungi(legna);
    this.dispensa.aggiungi(carne);
    this.ultimoBottino = { legna, carne };
    this.salvaOra();
  }

  // Si entra nella segheria (all'avvio o dopo una corsa)
  entra() {
    this.attiva = true;
    this.giocatore.riposiziona();
    this.cancello.azzera();
    this.ambiente.reimpostaTelecamera();
    this.ambiente.segui(this.giocatore.posizione, 0);
    this.joystick.attivo = true;
    this.schermate.mostraSegheria(!this.haCamminato);
    // Mostra cosa è arrivato dalla corsa
    if (this.ultimoBottino) {
      const { legna, carne } = this.ultimoBottino;
      if (legna > 0) this.effetti.testo(MAPPA.catasta.x, 2.6, MAPPA.catasta.z, `+${legna} legna`, 'buono');
      if (carne > 0) this.effetti.testo(MAPPA.dispensa.x, 2, MAPPA.dispensa.z, `+${carne} carne`, 'buono');
      this.effetti.sbuffo(MAPPA.catasta.x, 1, MAPPA.catasta.z, 0xb07a45, 16, 3);
      this.ultimoBottino = null;
    }
  }

  // Si esce dalla segheria (parte una corsa)
  esci() {
    this.attiva = false;
    this.joystick.spegni();
    this.stato.corseFatte += 1;
    this.salvaOra();
  }

  aggiorna(dt) {
    const direzione = this.joystick.leggi();
    if (!this.haCamminato && (direzione.x || direzione.y)) {
      this.haCamminato = true;
      this.schermate.nascondiSuggerimento();
    }
    this.giocatore.aggiorna(dt, direzione);
    const pos = this.giocatore.posizione;

    // --- Raccolta e scarico, un pezzo alla volta ---
    this.attesaRaccolta -= dt;
    if (this.attesaRaccolta <= 0) {
      let fatto = false;
      if (!this.giocatore.pieno && this.catasta.contiene(pos) && this.catasta.quantita > 0) {
        fatto = this.raccogli(this.catasta, 'legna');
      } else if (!this.giocatore.pieno && this.dispensa.contiene(pos) && this.dispensa.quantita > 0) {
        fatto = this.raccogli(this.dispensa, 'carne');
      } else if (this.tavolino.vicino(pos) && this.giocatore.pezzi.length > 0) {
        fatto = this.scarica();
      }
      if (fatto) this.attesaRaccolta = CONFIG.segheria.intervalloRaccolta;
    }

    // --- Soldi a terra ---
    if (this.pilaSoldi.valore > 0 && this.pilaSoldi.contiene(pos)) this.raccogliSoldi();

    // --- Tutto il resto ---
    this.tavolino.aggiorna(dt);
    this.clienti.aggiorna(dt);
    this.effetti.aggiorna(dt);
    this.ambiente.segui(pos, dt);

    // --- Cancello: si parte per una nuova corsa ---
    if (this.cancello.aggiorna(dt, pos)) {
      this.cancello.azzera();
      this.alPartenzaCorsa();
      return;
    }

    // --- Barra in alto ---
    this.schermate.aggiornaSegheria({
      soldi: this.stato.soldi,
      legna: this.catasta.quantita,
      carne: this.dispensa.quantita,
    });

    // --- Salvataggio ogni tanto ---
    this.attesaSalvataggio -= dt;
    if (this.attesaSalvataggio <= 0) {
      this.salvaOra();
      this.attesaSalvataggio = OGNI_QUANTO_SALVARE;
    }
  }

  // Un pezzo vola dal deposito alla schiena del boscaiolo
  raccogli(deposito, tipo) {
    const partenza = deposito.cima();
    const quantita = deposito.prendiPezzo();
    if (quantita <= 0) return false;
    this.giocatore.inArrivo++;
    this.inVolo[tipo] += quantita;
    this.effetti.lancia(tipo, partenza, (v) => this.giocatore.cimaSchiena(v), 0, () => {
      this.giocatore.inArrivo--;
      this.inVolo[tipo] -= quantita;
      this.giocatore.aggiungi(tipo, quantita);
    }, VOLO_CORTO);
    return true;
  }

  // Il pezzo in cima alla schiena vola sul tavolino
  scarica() {
    const pezzo = this.giocatore.togliUltimo();
    if (!pezzo) return false;
    const partenza = this.giocatore.cimaSchiena();
    this.inVolo[pezzo.tipo] += pezzo.quantita;
    this.effetti.lancia(pezzo.tipo, partenza, this.tavolino, 0, () => {
      this.inVolo[pezzo.tipo] -= pezzo.quantita;
      this.tavolino.aggiungi(pezzo.tipo, pezzo.quantita);
    }, VOLO_CORTO);
    return true;
  }

  // Tutti i soldi a terra volano verso il boscaiolo (divisi in qualche mazzetta)
  raccogliSoldi() {
    const totale = this.pilaSoldi.prendiTutto();
    const mazzette = Math.min(8, Math.max(1, Math.ceil(totale / CONFIG.economia.soldiPerMazzetta)));
    let rimasti = totale;
    for (let i = 0; i < mazzette; i++) {
      const parte = i === mazzette - 1 ? rimasti : Math.floor(totale / mazzette);
      rimasti -= parte;
      this.inVolo.soldi += parte;
      const partenza = MAPPA.soldi.clone().add(new THREE.Vector3((Math.random() - 0.5) * 0.5, 0.2 + i * 0.05, (Math.random() - 0.5) * 0.4));
      const verso = (v) => v.copy(this.giocatore.posizione).setY(1.4);
      this.effetti.lancia('soldi', partenza, verso, i * 0.05, () => {
        this.inVolo.soldi -= parte;
        this.stato.soldi += parte;
      }, { durata: 0.35, altezza: 1.2, sbuffo: false });
    }
    this.effetti.testo(this.giocatore.posizione.x, 2.4, this.giocatore.posizione.z, `+${totale} $`, 'buono');
  }

  // Scrive i progressi sul dispositivo
  salvaOra() {
    const s = this.stato;
    // ciò che è in volo viene salvato "a casa" (catasta, dispensa, tasca) per non perderlo mai
    s.catasta = this.catasta.quantita + this.inVolo.legna;
    s.dispensa = this.dispensa.quantita + this.inVolo.carne;
    s.soldi = Math.round(s.soldi);
    const soldiInVolo = this.inVolo.soldi;
    s.schiena = this.giocatore.pezzi.map((p) => ({ tipo: p.tipo, quantita: p.quantita }));
    s.tavolino = { legna: this.tavolino.legna, carne: this.tavolino.carne };
    s.soldiATerra = this.pilaSoldi.valore + soldiInVolo;
    salva(s);
  }

  disegna() {
    this.renderer.render(this.scena, this.telecamera);
  }
}
