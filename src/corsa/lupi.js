// =====================================================================
//  LUPI: piccoli branchi sulla strada
//  - alcuni branchi stanno fermi, altri corrono incontro alla squadra
//    (sempre dritti nella loro parte di strada: si possono evitare come i sassi)
//  - se un lupo tocca la squadra, combatte: elimina alcuni boscaioli;
//    se la squadra resiste, il lupo è sconfitto e lascia CARNE che vola sul carro
//  - se un lupo raggiunge il carro, ruba un po' di carico e scappa
// =====================================================================

import * as THREE from 'three';
import { CONFIG } from '../config.js';
import { creaLupo } from '../modelli/lupo.js';
import { animaGaloppo, animaRinghio } from '../modelli/animazioni.js';

export class Lupi {
  constructor(genitore, effetti) {
    this.genitore = genitore;
    this.effetti = effetti;
    this.lupi = [];
  }

  // Aggiunge un lupo. "corre" = corre incontro alla squadra quando si avvicina
  aggiungi(distanza, x, corre) {
    const modello = creaLupo();
    modello.gruppo.position.set(x, 0, -distanza);
    modello.gruppo.rotation.y = Math.PI; // guarda verso la squadra
    modello.gruppo.scale.setScalar(CONFIG.lupi.dimensione);
    this.genitore.add(modello.gruppo);
    this.lupi.push({
      distanza,
      x,
      corre,
      modello,
      stato: 'attesa', // 'attesa', 'corre', 'sconfitto', 'scappa', 'sparito'
      tempo: 0,
    });
  }

  aggiorna(dt, squadra, carro) {
    const cfg = CONFIG.lupi;
    for (const lupo of this.lupi) {
      const g = lupo.modello.gruppo;

      // --- Movimento ---
      if (lupo.stato === 'attesa') {
        // fermo, ma ringhia (basso sulle zampe, con la testa che trema)
        animaRinghio(lupo.modello, dt);
        if (lupo.corre && lupo.distanza - squadra.distanza < cfg.distanzaAttivazione) lupo.stato = 'corre';
      } else if (lupo.stato === 'corre') {
        lupo.distanza -= cfg.velocita * dt; // corre verso la squadra, dritto nella sua corsia
        this.animaCorsa(lupo, dt, 13);
        // superata la squadra e il carro, se ne va
        if (lupo.distanza < carro.distanza - 10) lupo.stato = 'sparito';
      } else if (lupo.stato === 'scappa') {
        // scappa di lato fuori dalla strada
        lupo.x += Math.sign(lupo.x || 1) * 9 * dt;
        g.rotation.y = Math.sign(lupo.x || 1) > 0 ? -Math.PI / 2 : Math.PI / 2;
        this.animaCorsa(lupo, dt, 15);
        lupo.tempo += dt;
        if (lupo.tempo > 1.5) lupo.stato = 'sparito';
      } else if (lupo.stato === 'sconfitto') {
        // si rovescia e sprofonda nella neve
        lupo.tempo += dt;
        g.rotation.z = Math.min(Math.PI / 2, lupo.tempo * 6);
        if (lupo.tempo > 0.5) g.position.y -= dt * 2;
        if (lupo.tempo > 1.3) lupo.stato = 'sparito';
      }
      g.position.x = lupo.x;
      g.position.z = -lupo.distanza;
      if (lupo.stato === 'sparito') g.visible = false;

      // --- Combattimento con la squadra ---
      if ((lupo.stato === 'attesa' || lupo.stato === 'corre') && squadra.numero > 0) {
        const toccati = squadra.ominiCheToccano(lupo.x, lupo.distanza, cfg.raggioCollisione);
        if (toccati.length > 0) this.combatti(lupo, squadra, carro, toccati);
      }

      // --- Il lupo raggiunge il carro: ruba e scappa ---
      if ((lupo.stato === 'attesa' || lupo.stato === 'corre') && carro.tocca(lupo.x, lupo.distanza, cfg.raggioCollisione)) {
        carro.perdiCaricoConEffetto(cfg.caricoRubatoDalCarro, this.effetti);
        lupo.stato = 'scappa';
        lupo.tempo = 0;
      }
    }
  }

  // Un lupo combatte con la squadra: ogni lupo elimina alcuni boscaioli
  combatti(lupo, squadra, carro, toccati) {
    const cfg = CONFIG.lupi;
    // Cadono prima gli omini che toccano il lupo, poi i più vicini, fino al numero stabilito
    const vicini = this.ominiPiuVicini(squadra, lupo, cfg.boscaioliPerLupo, toccati);
    const { persi, posizioni } = squadra.elimina(vicini, cfg.boscaioliPerLupo);
    for (const p of posizioni) this.effetti.sbuffo(p.x, 0.5, -p.distanza, 0xffffff, 5);
    this.effetti.sbuffo(lupo.x, 0.7, -lupo.distanza, 0x4d5b7c, 10, 4); // ciuffi di pelo
    if (persi > 0) this.effetti.testo(lupo.x, 2.2, -lupo.distanza, `-${persi}`, 'cattivo');

    if (squadra.numero > 0) {
      // La squadra ha vinto: il lupo è sconfitto e lascia la carne
      lupo.stato = 'sconfitto';
      lupo.tempo = 0;
      const carne = cfg.carnePerLupo;
      this.effetti.testo(lupo.x, 3, -lupo.distanza, `+${carne} carne`, 'buono');
      const partenza = new THREE.Vector3(lupo.x, 1, -lupo.distanza);
      this.effetti.lancia('carne', partenza, carro, 0.1, () => carro.aggiungiCarne(carne));
    }
  }

  // Sceglie quali omini eliminare: quelli che toccano il lupo + i più vicini
  ominiPiuVicini(squadra, lupo, quanti, toccati) {
    const scelti = new Set(toccati.slice(0, quanti));
    if (scelti.size < quanti) {
      const altri = [];
      squadra.omini.forEach((o, i) => {
        if (!o.vivo || scelti.has(i)) return;
        const p = squadra.posizioneOmino(i);
        altri.push({ i, d: Math.hypot(p.x - lupo.x, p.distanza - lupo.distanza) });
      });
      altri.sort((a, b) => a.d - b.d);
      for (const a of altri) {
        if (scelti.size >= quanti) break;
        scelti.add(a.i);
      }
    }
    return [...scelti];
  }

  // Corsa a balzi (vedi animazioni.js): quando atterra alza un po' di neve
  animaCorsa(lupo, dt, velocitaBalzi) {
    if (animaGaloppo(lupo.modello, dt, velocitaBalzi)) this.effetti.polvere(lupo.x, -lupo.distanza, 3, 1.6);
  }
}
