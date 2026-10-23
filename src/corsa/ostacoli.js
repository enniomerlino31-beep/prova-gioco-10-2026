// =====================================================================
//  OSTACOLI: le rocce da evitare
//  - ogni omino che tocca DAVVERO la roccia viene eliminato
//    (un colpo di striscio costa solo gli omini sul bordo)
//  - se il carro ci va contro, perde una parte del carico
//  L'area di urto è un po' più piccola della roccia disegnata, per essere "giusti".
// =====================================================================

import { CONFIG } from '../config.js';
import { creaRoccia } from '../modelli/roccia.js';

export class Ostacoli {
  constructor(genitore, effetti) {
    this.genitore = genitore;
    this.effetti = effetti;
    this.rocce = [];
  }

  aggiungiRoccia(distanza, x) {
    const modello = creaRoccia();
    modello.position.set(x, 0, -distanza);
    this.genitore.add(modello);
    this.rocce.push({ distanza, x, modello, colpitaDalCarro: false, scossa: 0 });
  }

  aggiorna(dt, squadra, carro) {
    const r = CONFIG.rocce.raggioCollisione;
    for (const roccia of this.rocce) {
      // --- Urto con gli omini: muore solo chi tocca la roccia ---
      if (squadra.numero > 0) {
        const toccati = squadra.ominiCheToccano(roccia.x, roccia.distanza, r);
        if (toccati.length > 0) {
          const { persi, posizioni } = squadra.elimina(toccati);
          roccia.scossa = 1;
          for (const p of posizioni) this.effetti.sbuffo(p.x, 0.5, -p.distanza, 0xffffff, 6);
          if (persi > 0) this.effetti.testo(roccia.x, 2.2, -roccia.distanza, `-${persi}`, 'cattivo');
        }
      }

      // --- Urto con il carro (un rettangolo un po' più stretto di quello disegnato) ---
      if (!roccia.colpitaDalCarro && carro.tocca(roccia.x, roccia.distanza, r)) {
        roccia.colpitaDalCarro = true;
        roccia.scossa = 1;
        carro.perdiCaricoConEffetto(CONFIG.carro.caricoPersoSuRoccia, this.effetti);
      }

      // Piccola scossa della roccia quando viene urtata
      if (roccia.scossa > 0) {
        roccia.scossa = Math.max(0, roccia.scossa - dt * 3);
        roccia.modello.position.x = roccia.x + Math.sin(roccia.scossa * 40) * 0.12 * roccia.scossa;
      }
    }
  }
}
