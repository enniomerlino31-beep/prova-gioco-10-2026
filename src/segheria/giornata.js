// =====================================================================
//  LA GIORNATA (Gruppo 8)
//  Ogni giornata dura CONFIG.giornata.durata secondi (4 minuti e mezzo). Il tempo scorre nella base e durante le corse; non quando c'è
//  un avviso, un menu o la festa, e non durante il tutorial (lo decide Segheria: qui si conta e basta). A fine giornata Segheria paga i
//  lavoratori (vedi personale.js) e mostra lo schermo nero con "Giorno N". Il numero del giorno e i secondi passati stanno nel
//  salvataggio (stato.giornata). Da offline la giornata non avanza.
// =====================================================================

import { CONFIG } from '../config.js';

export class Giornata {
  // dati: stato.giornata, { giorno, tempo }: si scrive direttamente lì, così il salvataggio è sempre aggiornato
  constructor(dati) {
    this.dati = dati;
  }

  get giorno() {
    return this.dati.giorno;
  }

  // Quanto è passata della giornata, da 0 a 1
  get frazione() {
    return Math.min(1, this.dati.tempo / CONFIG.giornata.durata);
  }

  // Quanti secondi mancano alla fine
  get mancano() {
    return Math.max(0, CONFIG.giornata.durata - this.dati.tempo);
  }

  // Fa passare dt secondi. Restituisce true quando la giornata è finita: comincia subito la successiva.
  avanza(dt) {
    this.dati.tempo += dt;
    if (this.dati.tempo < CONFIG.giornata.durata) return false;
    this.dati.tempo %= CONFIG.giornata.durata;
    this.dati.giorno += 1;
    return true;
  }
}
