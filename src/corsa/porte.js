// =====================================================================
//  PORTE CON I NUMERI
//  Le porte arrivano a coppie: una a sinistra e una a destra della pista.
//  La squadra passa da una sola delle due e il suo numero cambia:
//   "+10" aggiunge, "-5" toglie, "x2" moltiplica, "÷2" divide.
// =====================================================================

import { CONFIG } from '../config.js';
import { creaPorta } from '../modelli/porta.js';

// Cosa fa ogni tipo di porta al numero di boscaioli
export function applicaOperazione(numero, operazione) {
  switch (operazione.tipo) {
    case '+': return numero + operazione.valore;
    case '-': return numero - operazione.valore;
    case 'x': return numero * operazione.valore;
    case '÷': return Math.floor(numero / operazione.valore);
    default: return numero;
  }
}

// Una porta è "buona" se fa aumentare i boscaioli
export function eBuona(operazione) {
  return operazione.tipo === '+' || operazione.tipo === 'x';
}

export function testoOperazione(operazione) {
  return `${operazione.tipo}${operazione.valore}`;
}

export class Porte {
  constructor(genitore, effetti) {
    this.genitore = genitore;
    this.effetti = effetti; // per mostrare i testi volanti
    this.coppie = [];
  }

  // Aggiunge una coppia di porte. sinistra/destra sono operazioni {tipo, valore} oppure null (niente porta)
  aggiungiCoppia(distanza, sinistra, destra) {
    const larghezzaPorta = CONFIG.pista.larghezza / 2 - 0.4;
    const coppia = { distanza, usata: false, tempoSparizione: 0, lati: [] };
    [sinistra, destra].forEach((operazione, indice) => {
      if (!operazione) {
        coppia.lati.push(null);
        return;
      }
      const porta = creaPorta(testoOperazione(operazione), eBuona(operazione), larghezzaPorta);
      const x = (indice === 0 ? -1 : 1) * (CONFIG.pista.larghezza / 4);
      porta.gruppo.position.set(x, 0, -distanza);
      this.genitore.add(porta.gruppo);
      coppia.lati.push({ operazione, porta });
    });
    this.coppie.push(coppia);
  }

  aggiorna(dt, squadra) {
    for (const coppia of this.coppie) {
      // La squadra attraversa la coppia di porte?
      if (!coppia.usata && squadra.distanza >= coppia.distanza) {
        coppia.usata = true;
        const lato = coppia.lati[squadra.x < 0 ? 0 : 1];
        if (lato) {
          const prima = squadra.numero;
          squadra.imposta(applicaOperazione(prima, lato.operazione));
          const differenza = squadra.numero - prima;
          this.effetti.testo(
            squadra.x, 2.2, -squadra.distanza,
            `${differenza >= 0 ? '+' : ''}${differenza}`,
            differenza >= 0 ? 'buono' : 'cattivo'
          );
        }
      }

      // Dopo il passaggio, le porte svaniscono sprofondando nella neve
      if (coppia.usata && coppia.tempoSparizione < 1) {
        coppia.tempoSparizione = Math.min(1, coppia.tempoSparizione + dt * 2);
        for (const lato of coppia.lati) {
          if (!lato) continue;
          lato.porta.gruppo.position.y = -3 * coppia.tempoSparizione * coppia.tempoSparizione;
          lato.porta.pannello.material.opacity = 0.45 * (1 - coppia.tempoSparizione);
        }
      }
    }
  }
}
