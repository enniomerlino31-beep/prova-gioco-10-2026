// =====================================================================
//  SALVATAGGIO: ricorda i progressi sul dispositivo
//  Usa il "localStorage" del browser: una piccola memoria che resta anche
//  chiudendo la pagina (ma è diversa per ogni browser e dispositivo).
// =====================================================================

import { CONFIG } from './config.js';

const CHIAVE = 'segheria-assediata-salvataggio-v1';

// Com'è fatta una partita nuova
function statoIniziale() {
  return {
    soldi: 0,                                  // soldi in tasca al giocatore
    catasta: CONFIG.segheria.legnaIniziale,    // legna nella catasta (unità)
    dispensa: 0,                               // carne nella dispensa (unità)
    schiena: [],                               // pezzi sulla schiena del boscaiolo: [{ tipo, quantita }]
    sportelli: { legna: 0, carne: 0 },         // merce esposta negli sportelli di vendita (unità)
    soldiSportelli: { legna: 0, carne: 0 },    // soldi lasciati dai clienti accanto a ogni sportello, da raccogliere
    vendute: { legna: 0, carne: 0 },           // unità vendute in tutto (serviranno per sbloccare le basi)
    guadagnoTotale: 0,                         // tutti i soldi guadagnati da sempre
    corseFatte: 0,
  };
}

// Legge il salvataggio. Se non c'è (o è rovinato) riparte da una partita nuova.
export function carica() {
  try {
    const testo = localStorage.getItem(CHIAVE);
    if (!testo) return statoIniziale();
    // Le voci mancanti (aggiunte in versioni nuove del gioco) prendono il valore iniziale
    const stato = { ...statoIniziale(), ...JSON.parse(testo) };
    // Salvataggi vecchi: la merce del tavolino e i soldi a terra passano agli sportelli
    if (stato.tavolino) {
      stato.sportelli.legna += stato.tavolino.legna ?? 0;
      stato.sportelli.carne += stato.tavolino.carne ?? 0;
      delete stato.tavolino;
    }
    if (stato.soldiATerra) stato.soldiSportelli.legna += stato.soldiATerra;
    delete stato.soldiATerra;
    return stato;
  } catch {
    return statoIniziale();
  }
}

// Scrive il salvataggio. Se il browser non lo permette (es. navigazione privata) il gioco continua lo stesso.
export function salva(stato) {
  try {
    localStorage.setItem(CHIAVE, JSON.stringify(stato));
  } catch {
    // niente da fare: il gioco funziona anche senza salvare
  }
}

// Cancella tutto e riparte da zero (utile per le prove)
export function cancella() {
  try {
    localStorage.removeItem(CHIAVE);
  } catch {
    // ignorato
  }
}
