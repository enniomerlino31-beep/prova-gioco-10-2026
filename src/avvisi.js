// =====================================================================
//  AVVISI DELLE NOVITÀ (mini tutorial)
//  La PRIMA volta che compare una novità (il primo lupo, le prime mura rovinate, l'orso...):
//   1. il gioco si ferma;
//   2. la telecamera va con calma sulla novità;
//   3. compare un riquadro con un titolo e una o due frasi semplici;
//   4. un tocco chiude il riquadro, la telecamera torna sul boscaiolo (o sulla squadra) e il gioco riparte.
//  Ogni avviso compare UNA VOLTA SOLA: è segnato come "visto" nel salvataggio (stato.avvisiVisti), anche
//  quando si ricomincia dopo la caduta delle mura. Con ?avvisi nell'indirizzo (solo in locale) si rivedono tutti.
//
//  PER AGGIUNGERE UN NUOVO AVVISO:
//   1. scrivi titolo e testo qui sotto, in AVVISI;
//   2. nel punto del gioco in cui la novità compare chiama  avvisi.chiedi('nome', { punto, zoom, ... })
//      (nella base si fa in Segheria.controllaAvvisi, nella corsa in Corsa.controllaAvvisi).
//   chiedi() non fa niente se l'avviso è già stato visto o se ce n'è un altro in corso: si può richiamare a ogni
//  fotogramma finché la novità c'è, parte da solo appena si può.
//  Il gioco che ospita l'avviso (base o corsa) deve fermarsi finché avvisi.attivo è vero e, a ogni fotogramma,
//  chiamare avvisi.aggiorna(dt, muoviTelecamera) (vedi Segheria.aggiornaAvviso e Corsa.aggiornaAvviso).
// =====================================================================

import { CONFIG } from './config.js';
import { suoni } from './motore/suoni.js';

// I testi sono brevi e in italiano semplice. 'ritornoAssenza' non ha la telecamera: il suo testo compare dentro
// la schermata "Bentornato!" (vedi Segheria.apriBentornato).
export const AVVISI = {
  primoLupo: {
    titolo: 'Arrivano i lupi!',
    testo: 'Gli arcieri delle torrette li fermano (puoi colpirli anche tu con l’ascia). La carne che lasciano a terra si raccoglie e, con il venditore della carne, si vende allo sportello.',
  },
  muraDanneggiate: {
    titolo: 'Le mura sono danneggiate!',
    testo: `Porta la legna nel grande cerchio verde al centro della base: con ${CONFIG.muraAllarme.legnaRiparazione} legna le mura tornano come nuove.`,
  },
  lupoGigante: {
    titolo: 'Il lupo gigante!',
    testo: 'È molto più forte dei lupi normali. Resisti con arcieri e ascia finché non viene abbattuto: lascia tanta carne.',
  },
  primaCorsa: {
    titolo: 'Le porte!',
    testo: 'Trascina il dito per muovere la squadra. Le porte azzurre la fanno crescere, quelle rosse tolgono boscaioli: evitale!',
  },
  orsoCorsa: {
    titolo: 'L’orso gigante!',
    testo: 'Protegge la scalinata: per batterlo serve una squadra numerosa. Se vince lui, porti a casa solo la legna degli alberi.',
  },
  scalinata: {
    titolo: 'La scalinata!',
    testo: 'Più gradini sale la squadra, più il bottino si moltiplica (fino a ×20). Ogni gradino fa restare indietro qualche boscaiolo.',
  },
  boscaioloSecondario: {
    titolo: 'Il boscaiolo secondario',
    testo: 'Fa le corse da solo e riporta la legna alla catasta, anche quando il gioco è chiuso. Il conto alla rovescia vicino al cancello dice quando torna.',
  },
  // --- Gruppo 7: nuova economia ---
  venditoreLegna: {
    titolo: 'Il venditore della legna',
    testo: 'È gratis: resta sul cerchio finché si riempie. Da allora i clienti comprano la legna dello sportello e ti pagano; senza di lui la legna si accumula soltanto.',
  },
  primoCantiere: {
    titolo: 'Lavori in corso!',
    testo: 'Pagato in un attimo! La costruzione cresce a fasi mentre la barra si riempie: puntelli, travi, assi e infine i teli, con gli operai al lavoro. Alla fine i teli si alzano e compare il miglioramento. Nel frattempo funziona come prima.',
  },

  legnaInEsaurimento: {
    titolo: 'Legna in esaurimento!',
    testo: 'Nella catasta restano meno di 10 pezzi (l’icona lampeggia): senza legna non hai niente da vendere. Fai una corsa per portarne di nuova.',
  },
  venditoreCarne: {
    titolo: 'Il venditore della carne',
    testo: 'Costa monete. Finché non c’è, la carne dei lupi si accumula e non si vende; con lui i clienti la comprano allo sportello CARNE.',
  },
  ritornoAssenza: {
    titolo: 'Bentornato!',
    testo: 'La tua segheria lavora anche quando il gioco è chiuso: il boscaiolo secondario porta la legna alla catasta e i venditori la vendono. Qui sotto vedi quanto hai guadagnato.',
  },
};

const $ = (id) => document.getElementById(id);

export class Avvisi {
  // stato: il salvataggio (ci si scrive stato.avvisiVisti); salva: funzione che lo scrive sul dispositivo
  constructor(stato, salva) {
    this.stato = stato;
    this.salva = salva;
    this.corrente = null;       // l'avviso in corso: { id, punto, zoom, fase, tempo, ... } (null = nessuno)
    this.vistiInProva = new Set(); // le prove (?orso...) non toccano la partita salvata: lì gli avvisi si ricordano solo finché la pagina resta aperta
    this.schermata = $('schermata-novita');
    // un tocco sul riquadro (o Invio) lo chiude, ma non subito dopo che è comparso
    this.schermata.addEventListener('click', () => this.chiudi());
    window.addEventListener('keydown', (evento) => {
      if (evento.key === 'Enter') this.chiudi();
    });
  }

  // Il gioco deve restare fermo
  get attivo() {
    return this.corrente !== null;
  }

  visto(id, prova = false) {
    return prova ? this.vistiInProva.has(id) : this.stato.avvisiVisti.includes(id);
  }

  segna(id, prova = false) {
    if (this.visto(id, prova)) return;
    if (prova) this.vistiInProva.add(id);
    else this.stato.avvisiVisti.push(id);
  }

  // Vuole mostrare l'avviso "id". Se è già stato visto o ce n'è un altro in corso non fa niente (restituisce false).
  //  punto: dove guarda la telecamera (un Vector3 del mondo; la telecamera della corsa guarda solo la distanza z)
  //  zoom: quanto lontano guardare (come nella telecamera del gioco che lo ospita)
  //  prova: è una prova (?orso...), non si salva
  //  alMostrare / allaChiusura: funzioni chiamate quando compare e quando si è chiuso del tutto (es. per spegnere e riaccendere il joystick)
  chiedi(id, { punto, zoom = 1, prova = false, alMostrare = () => {}, allaChiusura = () => {} }) {
    if (this.corrente || this.visto(id, prova) || !AVVISI[id]) return false;
    this.corrente = { id, punto, zoom, prova, alMostrare, allaChiusura, fase: 'viaggio', tempo: 0, apertoAlle: 0 };
    return true;
  }

  // Come chiedi(), ma senza telecamera: restituisce subito il testo (e segna l'avviso come visto) oppure null se non va mostrato.
  // Serve a chi mostra l'avviso dentro un'altra schermata (la schermata "Bentornato!").
  consuma(id) {
    if (this.corrente || this.visto(id) || !AVVISI[id]) return null;
    this.segna(id);
    this.salva();
    return AVVISI[id];
  }

  // Da chiamare a ogni fotogramma mentre l'avviso è attivo.
  // muoviTelecamera(punto, zoom, dt, morbidezza): porta la telecamera sul punto; punto = null vuol dire "torna sul boscaiolo (o sulla squadra)"
  aggiorna(dt, muoviTelecamera) {
    const a = this.corrente;
    if (!a) return;
    const C = CONFIG.avvisi;
    a.tempo += dt;
    if (a.fase === 'viaggio') {
      muoviTelecamera(a.punto, a.zoom, dt, C.morbidezza);
      if (a.tempo >= C.viaggio) this.apri();
    } else if (a.fase === 'attesa') {
      muoviTelecamera(a.punto, a.zoom, dt, C.morbidezza);
    } else {
      muoviTelecamera(null, 1, dt, C.morbidezza);
      if (a.tempo >= C.ritorno) {
        this.corrente = null;
        a.allaChiusura();
      }
    }
  }

  // La telecamera è arrivata: compare il riquadro e l'avviso conta come visto
  apri() {
    const a = this.corrente;
    const testi = AVVISI[a.id];
    a.fase = 'attesa';
    a.tempo = 0;
    a.apertoAlle = performance.now();
    this.segna(a.id, a.prova);
    if (!a.prova) this.salva();
    $('novita-titolo').textContent = testi.titolo;
    $('novita-testo').textContent = testi.testo;
    $('avviso-segheria').classList.add('nascosto'); // la scritta grande (es. "Le mura stanno cedendo!") lascia il posto al riquadro
    this.schermata.classList.remove('nascosto');
    suoni.suona('acquisto');
    a.alMostrare();
  }

  // Un tocco: chiude il riquadro e comincia il ritorno della telecamera
  chiudi() {
    const a = this.corrente;
    if (!a || a.fase !== 'attesa' || performance.now() - a.apertoAlle < CONFIG.avvisi.attesaTocco * 1000) return;
    this.schermata.classList.add('nascosto');
    suoni.suona('clic');
    a.fase = 'ritorno';
    a.tempo = 0;
  }
}
