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
    schiena: { legna: 0, carne: 0 },           // unità portate sulla schiena del boscaiolo (nessun limite)
    miglioramenti: {                           // per ogni cerchio: livelli comprati e soldi già messi nel livello attuale
      mura: { comprati: 0, pagato: 0 },
      riparazione: { comprati: 0, pagato: 0 },
      torretta: { comprati: 0, pagato: 0 },
      aiutante: { comprati: 0, pagato: 0 },
      cacciatore: { comprati: 0, pagato: 0 },
      venditore: { comprati: 0, pagato: 0 },
    },
    sportelli: { legna: 0, carne: 0 },         // merce esposta negli sportelli di vendita (unità)
    soldiSportelli: { legna: 0, carne: 0 },    // soldi lasciati dai clienti accanto a ogni sportello, da raccogliere
    vendute: { legna: 0, carne: 0 },           // unità vendute in tutto (serviranno per sbloccare le basi)
    guadagnoTotale: 0,                         // tutti i soldi guadagnati da sempre
    corseFatte: 0,
    tutorial: 0,                               // a che passaggio del tutorial si è arrivati (3 = finito, non compare più)
  };
}

// Legge il salvataggio. Se non c'è (o è rovinato) riparte da una partita nuova.
export function carica() {
  try {
    const testo = localStorage.getItem(CHIAVE);
    if (!testo) return statoIniziale();
    // Le voci mancanti (aggiunte in versioni nuove del gioco) prendono il valore iniziale
    const salvato = JSON.parse(testo);
    const stato = { ...statoIniziale(), ...salvato };
    // Salvataggi di prima del tutorial: chi ha già fatto almeno una corsa non lo rivede
    if (salvato.tutorial === undefined && (salvato.corseFatte ?? 0) > 0) stato.tutorial = 3;
    // Salvataggi vecchi: la merce del tavolino e i soldi a terra passano agli sportelli
    if (stato.tavolino) {
      stato.sportelli.legna += stato.tavolino.legna ?? 0;
      stato.sportelli.carne += stato.tavolino.carne ?? 0;
      delete stato.tavolino;
    }
    if (stato.soldiATerra) stato.soldiSportelli.legna += stato.soldiATerra;
    delete stato.soldiATerra;
    // Salvataggi vecchi: la schiena era un elenco di pezzi { tipo, quantita }
    if (Array.isArray(stato.schiena)) {
      const schiena = { legna: 0, carne: 0 };
      for (const pezzo of stato.schiena) if (pezzo.tipo in schiena) schiena[pezzo.tipo] += pezzo.quantita;
      stato.schiena = schiena;
    }
    stato.miglioramenti = { ...statoIniziale().miglioramenti, ...stato.miglioramenti };
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
