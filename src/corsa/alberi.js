// =====================================================================
//  ALBERI DA ABBATTERE
//  Se la squadra va contro un albero si ferma e lo taglia.
//  Più boscaioli = taglio più veloce. Quando l'albero cade, la legna va sul carro.
//  Il giocatore può anche scegliere di passare di lato e non fermarsi.
//  Se il carro (che è largo!) urta un albero ancora in piedi, perde un po' di carico.
// =====================================================================

import * as THREE from 'three';
import { CONFIG } from '../config.js';
import { creaAbete } from '../modelli/albero.js';
import { tinta } from '../modelli/materiali.js';
import { suoni } from '../motore/suoni.js';

const geometriaBarra = new THREE.PlaneGeometry(1.6, 0.18);

export class Alberi {
  constructor(genitore, effetti) {
    this.genitore = genitore;
    this.effetti = effetti;
    this.alberi = [];
    this.attesaColpo = 0; // secondi al prossimo colpo d'ascia sentito mentre si taglia
  }

  aggiungi(distanza, x) {
    const modello = creaAbete();
    modello.position.set(x, 0, -distanza);
    modello.rotation.y = Math.random() * Math.PI;
    const scala = 0.9 + Math.random() * 0.25;
    modello.scale.setScalar(scala);
    this.genitore.add(modello);

    // Barra della "vita" dell'albero, visibile solo mentre lo si taglia
    const barra = new THREE.Group();
    const fondo = new THREE.Mesh(geometriaBarra, tinta(0x3a2a20));
    const pieno = new THREE.Mesh(geometriaBarra, new THREE.MeshBasicMaterial({ color: 0x7ee05a }));
    pieno.material.userData.daLiberare = true;
    pieno.position.z = 0.01;
    barra.add(fondo, pieno);
    barra.position.set(x, 4, -distanza);
    barra.rotation.x = -0.6;
    barra.visible = false;
    this.genitore.add(barra);

    this.alberi.push({
      distanza,
      x,
      modello,
      barra,
      pieno,
      vita: CONFIG.alberi.resistenza,
      stato: 'inPiedi', // 'inPiedi', 'cade', 'sparito'
      tempoCaduta: 0,
      urtatoDalCarro: false,
    });
  }

  // La squadra sta toccando almeno un albero davanti a sé? Se sì, deve fermarsi.
  alberiToccati(squadra) {
    const toccati = [];
    const r = CONFIG.alberi.raggio;
    for (const a of this.alberi) {
      if (a.stato !== 'inPiedi') continue;
      const davanti = a.distanza - squadra.distanza; // positivo = albero davanti
      if (davanti < -squadra.semiProfondita) continue; // già superato
      // la formazione è un rettangolo: l'albero tocca la prima fila e sta entro la sua larghezza
      const diLato = Math.abs(a.x - squadra.x) < squadra.semiLarghezza + r * 0.7;
      const diFronte = davanti < squadra.semiProfondita + r * 0.8;
      if (diLato && diFronte) toccati.push(a);
    }
    return toccati;
  }

  aggiorna(dt, squadra, carro, toccati) {
    // --- Taglio degli alberi toccati dalla squadra ---
    if (toccati.length > 0 && squadra.numero > 0) {
      const cfg = CONFIG.alberi;
      // colpi d'ascia sul legno: a ritmo più fitto con più boscaioli (il limite di suoni insieme sta in suoni.js)
      this.attesaColpo -= dt;
      if (this.attesaColpo <= 0) {
        suoni.suona('taglio', { volume: 0.7 + Math.random() * 0.3 });
        this.attesaColpo = Math.max(CONFIG.audio.colpiTaglio, 1 / Math.sqrt(squadra.numero)) * (0.85 + Math.random() * 0.3);
      }
      // colpi al secondo: tanti boscaioli = tanti colpi (ma c'è un tempo minimo)
      const colpiAlSecondo = Math.min(squadra.numero * cfg.forzaAscia, cfg.resistenza / cfg.tempoMinimoTaglio);
      for (const a of toccati) {
        a.vita -= colpiAlSecondo * dt;
        a.barra.visible = true;
        a.pieno.scale.x = Math.max(0, a.vita / cfg.resistenza);
        a.pieno.position.x = -0.8 * (1 - a.pieno.scale.x);
        // l'albero trema a ogni colpo
        a.modello.rotation.z = Math.sin(performance.now() / 40) * 0.03;
        if (a.vita <= 0) this.abbatti(a, carro, true);
      }
    }

    // --- Il carro urta gli alberi rimasti in piedi? ---
    for (const a of this.alberi) {
      if (a.stato !== 'inPiedi' || a.urtatoDalCarro) continue;
      if (carro.tocca(a.x, a.distanza, CONFIG.alberi.raggio * 0.6)) {
        a.urtatoDalCarro = true;
        carro.perdiCaricoConEffetto(CONFIG.carro.caricoPersoSuAlbero, this.effetti);
        this.abbatti(a, carro, false);
      }
    }

    // --- Animazione di caduta ---
    for (const a of this.alberi) {
      if (a.stato !== 'cade') continue;
      a.tempoCaduta += dt;
      const t = Math.min(1, a.tempoCaduta / 0.6);
      a.modello.rotation.x = -t * t * (Math.PI / 2); // cade in avanti
      if (a.tempoCaduta > 0.9) {
        // poi sprofonda nella neve
        a.modello.position.y = -(a.tempoCaduta - 0.9) * 4;
      }
      if (a.tempoCaduta > 1.6) {
        a.stato = 'sparito';
        a.modello.visible = false;
      }
    }
  }

  // Fa cadere l'albero; se è stato tagliato dalla squadra, i tronchi VOLANO sul carro
  abbatti(albero, carro, tagliato) {
    albero.stato = 'cade';
    suoni.suona('albero');
    suoni.suona('grido', { ritardo: 0.2 }); // "Hey!" dei boscaioli
    albero.barra.visible = false;
    albero.modello.rotation.z = 0;
    this.effetti.sbuffo(albero.x, 0.6, -albero.distanza, 0xb07a45, 10, 3); // schegge alla base
    if (!tagliato) return;

    const totale = CONFIG.alberi.legnaPerAlbero;
    const quantiTronchi = Math.max(1, CONFIG.volo.tronchiPerAlbero);
    this.effetti.testo(albero.x, 3, -albero.distanza, `+${totale} legna`, 'buono');
    let rimasta = totale;
    for (let i = 0; i < quantiTronchi; i++) {
      // ogni tronco porta una parte della legna (l'ultimo prende il resto)
      const quantita = i === quantiTronchi - 1 ? rimasta : Math.floor(totale / quantiTronchi);
      rimasta -= quantita;
      const partenza = new THREE.Vector3(albero.x + (Math.random() - 0.5) * 0.6, 1 + i * 0.5, -albero.distanza);
      this.effetti.lancia('legna', partenza, carro, i * CONFIG.volo.intervallo, () => carro.aggiungiLegna(quantita));
    }
  }
}
