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
    schiena: { legna: 0, carne: 0 },           // unità portate sulla schiena del boscaiolo (nessun limite)
    miglioramenti: {                           // per ogni catena: livelli comprati (e, per il pavimento, monete già messe nel cerchio)
      mura: { comprati: 0, pagato: 0 },
      riparazione: { comprati: 0, pagato: 0 },
      torretta: { comprati: 0, pagato: 0 },
      aiutante: { comprati: 0, pagato: 0 },
      cacciatore: { comprati: 0, pagato: 0 },
      secondoCacciatore: { comprati: 0, pagato: 0 },
      venditore: { comprati: 0, pagato: 0 },     // dal Gruppo 7: il venditore della CARNE e i due che servono più in fretta
      venditoreLegna: { comprati: 0, pagato: 0 }, // il venditore della legna (gratuito, il primo cerchio dopo il tutorial)
      pavimentoPietra: { comprati: 0, pagato: 0 },
      boscaioloSecondario: { comprati: 0, pagato: 0 },
    },
    cantieri: [],                              // lavori in corso: [{ cerchio, rimasto, durata }] (secondi che mancano e durata intera); a fine lavori arriva il miglioramento
    file: {                                    // le file di cerchi: monete già messe nel loro prossimo acquisto
      legna: { pagato: 0 },
      difesa: { pagato: 0 },
      economia: { pagato: 0 },
      caccia: { pagato: 0 },
      secondario: { pagato: 0 },
    },
    secondarioMancano: null,                   // secondi al ritorno del boscaiolo secondario con la legna (null = non c'è)
    orologio: 0,                               // l'ora dell'ultimo salvataggio (millisecondi), per i guadagni mentre si è via
    bentornato: null,                          // guadagni di quando si era via, non ancora raccolti: { secondi, legna, monete }
    cerchi: 5,                                 // 2 = con le due file di cerchi, 3 = con i due cerchi ECONOMIA,
                                               // 4 = con il boscaiolo secondario come ultimo acquisto,
                                               // 5 = con il venditore della legna gratuito e i cantieri (Gruppo 7; vedi carica)
    sportelli: { legna: 0, carne: 0 },         // merce esposta negli sportelli di vendita (unità; la carne della corsa arriva qui)
    soldiATerra: 0,                            // soldi lasciati dai clienti nel cerchio delle monete tra i due sportelli, da raccogliere
    vendute: { legna: 0, carne: 0 },           // unità vendute in tutto (serviranno per sbloccare le basi)
    guadagnoTotale: 0,                         // tutti i soldi guadagnati da sempre
    corseFatte: 0,
    tutorial: 0,                               // a che passaggio del tutorial si è arrivati (3 = finito, non compare più)
    orso: { livello: 1, corseMancanti: 0 },    // l'orso di fine corsa: a che livello è e fra quante corse ricompare (0 = alla prossima)
    avvisiVisti: [],                           // gli avvisi delle novità già mostrati (nomi, vedi src/avvisi.js): ognuno compare una volta sola
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
    // Salvataggi vecchi: la merce del tavolino passa agli sportelli
    if (stato.tavolino) {
      stato.sportelli.legna += stato.tavolino.legna ?? 0;
      stato.sportelli.carne += stato.tavolino.carne ?? 0;
      delete stato.tavolino;
    }
    // Salvataggi vecchi: la dispensa non c'è più, la sua carne va sul tavolo dello sportello CARNE
    if (stato.dispensa !== undefined) {
      stato.sportelli.carne += stato.dispensa;
      delete stato.dispensa;
    }
    // Salvataggi vecchi: i soldi delle due pile accanto agli sportelli finiscono nell'unico cerchio delle monete
    if (stato.soldiSportelli) {
      stato.soldiATerra += (stato.soldiSportelli.legna ?? 0) + (stato.soldiSportelli.carne ?? 0);
      delete stato.soldiSportelli;
    }
    // Salvataggi vecchi: la schiena era un elenco di pezzi { tipo, quantita }
    if (Array.isArray(stato.schiena)) {
      const schiena = { legna: 0, carne: 0 };
      for (const pezzo of stato.schiena) if (pezzo.tipo in schiena) schiena[pezzo.tipo] += pezzo.quantita;
      stato.schiena = schiena;
    }
    // Salvataggi di prima del secondo cacciatore: nella fila ECONOMIA c'è un passo nuovo, quindi le monete già
    // messe nel cerchio ECONOMIA tornano in tasca (erano per un altro acquisto)
    if (salvato.miglioramenti && !salvato.miglioramenti.secondoCacciatore && stato.file?.economia) {
      stato.soldi += stato.file.economia.pagato ?? 0;
      stato.file.economia.pagato = 0;
    }
    // L'orso di fine corsa: nei salvataggi vecchi parte dal livello 1; i valori strani si sistemano
    const orso = stato.orso && typeof stato.orso === 'object' ? stato.orso : {};
    stato.orso = {
      livello: Math.max(1, Math.floor(Number(orso.livello)) || 1),
      corseMancanti: Math.max(0, Math.floor(Number(orso.corseMancanti)) || 0),
    };
    // Gli avvisi già visti: nei salvataggi vecchi non ce n'è nessuno; i valori strani si scartano
    stato.avvisiVisti = Array.isArray(stato.avvisiVisti) ? [...new Set(stato.avvisiVisti.filter((nome) => typeof nome === 'string'))] : [];
    stato.miglioramenti = { ...statoIniziale().miglioramenti, ...stato.miglioramenti };
    // Salvataggi con il parquet (non c'è più): chi l'aveva comprato ha il pavimento in pietra;
    // le monete messe nel cerchio del parquet (o in quello della pietra, se ormai è comprato) tornano in tasca
    const parquet = stato.miglioramenti.parquet;
    if (parquet) {
      const pietra = stato.miglioramenti.pavimentoPietra;
      stato.soldi += parquet.pagato ?? 0;
      if (parquet.comprati > 0) {
        stato.soldi += pietra.pagato ?? 0;
        pietra.pagato = 0;
        pietra.comprati = 1;
      }
      delete stato.miglioramenti.parquet;
    }
    stato.file = { ...statoIniziale().file, ...stato.file };
    // Salvataggi di prima delle due file di cerchi: le monete già messe in un cerchio tornano in tasca
    // (quei cerchi ora non ci sono più); le torrette sono diventate 4 prima di "Potenzia arcieri":
    // chi aveva già un potenziamento degli arcieri ha subito anche le due torrette nuove
    if (!salvato.cerchi || salvato.cerchi < 2) {
      for (const catena of Object.values(stato.miglioramenti)) {
        stato.soldi += catena.pagato ?? 0;
        catena.pagato = 0;
      }
      if (stato.miglioramenti.torretta.comprati >= 3) stato.miglioramenti.torretta.comprati += 2;
    }
    // Salvataggi di prima dei due cerchi ECONOMIA: le monete già messe nel cerchio ECONOMIA tornano in tasca
    // (ora il prossimo acquisto può essere in un altro cerchio); quello che è già comprato resta comprato
    if (!salvato.cerchi || salvato.cerchi < 3) {
      stato.soldi += stato.file.economia.pagato ?? 0;
      stato.file.economia.pagato = 0;
    }
    // Salvataggi di prima che il boscaiolo secondario diventasse l'ultimo acquisto (e costasse 5000): le monete
    // già messe nel suo cerchio tornano in tasca; se era già comprato resta comprato
    if (!salvato.cerchi || salvato.cerchi < 4) {
      stato.soldi += stato.file.secondario.pagato ?? 0;
      stato.file.secondario.pagato = 0;
      stato.cerchi = 4;
    }
    // Salvataggi di prima del Gruppo 7: chi aveva già comprato il "Venditore" ha anche quello della legna (che ora è un acquisto
    // a parte, gratuito); i prezzi sono cambiati ma le monete già messe nei cerchi restano (se sono più del nuovo prezzo il cerchio
    // si completa con una moneta)
    if (!salvato.cerchi || salvato.cerchi < 5) {
      if ((stato.miglioramenti.venditore?.comprati ?? 0) > 0) stato.miglioramenti.venditoreLegna = { comprati: 1, pagato: 0 };
      stato.cerchi = 5;
    }
    // I cantieri: solo quelli scritti bene
    stato.cantieri = (Array.isArray(stato.cantieri) ? stato.cantieri : [])
      .filter((c) => c && typeof c.cerchio === 'string' && Number.isFinite(c.rimasto) && Number.isFinite(c.durata))
      .map((c) => ({ cerchio: c.cerchio, rimasto: Math.max(0, c.rimasto), durata: Math.max(1, c.durata) }));
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

// Dopo che le mura sono cadute: partita nuova come all'inizio, ma il tutorial resta fatto e gli avvisi già visti
// non ricompaiono (le impostazioni dell'audio stanno in un'altra memoria e restano)
export function ricominciaDaCapo(avvisiVisti = []) {
  const stato = statoIniziale();
  stato.tutorial = 3;
  stato.avvisiVisti = [...avvisiVisti];
  stato.orologio = Date.now();
  salva(stato);
}

// Cancella tutto e riparte da zero (utile per le prove)
export function cancella() {
  try {
    localStorage.removeItem(CHIAVE);
  } catch {
    // ignorato
  }
}
