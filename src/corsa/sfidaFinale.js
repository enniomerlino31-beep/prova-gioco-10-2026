// =====================================================================
//  SFIDA FINALE: la salita a gradini verso la segheria
//  La squadra spinge il carro su per la collina. Per salire ogni gradino
//  alcuni boscaioli restano indietro stanchi (il "costo" del gradino).
//  Il costo cresce gradino dopo gradino ed è più alto se il carro è pesante.
//  Il gradino più alto raggiunto decide il moltiplicatore del bottino (da x1 a x20).
// =====================================================================

import * as THREE from 'three';
import { CONFIG } from '../config.js';
import { creaScritta, tinta } from '../modelli/materiali.js';
import { creaSegheria } from '../modelli/segheria.js';
import { suoni } from '../motore/suoni.js';

// Colori dei gradini, dal basso verso l'alto (allegri, come nei giochi mobile)
const COLORI_GRADINI = [0x8fd3ff, 0x9be37a, 0xffe066, 0xffb35c, 0xff8a7a, 0xe39bff];

export class SfidaFinale {
  // livelloMura: l'aspetto della segheria in cima (come quella della base: 0 legno, 1 pietra, 2 metallo)
  constructor(genitore, effetti, livelloMura = 0) {
    this.effetti = effetti;
    const cfg = CONFIG.salita;
    this.numeroGradini = cfg.moltiplicatori.length;
    this.inizio = CONFIG.pista.lunghezza + 4; // distanza a cui inizia il primo gradino

    // --- Costruzione dei gradini ---
    const scatola = new THREE.BoxGeometry(1, 1, 1);
    const larghezza = CONFIG.pista.larghezza + 1.5;
    this.scritte = [];
    for (let i = 0; i < this.numeroGradini; i++) {
      const altezza = (i + 1) * cfg.altezzaGradino;
      const gradino = new THREE.Mesh(scatola, tinta(COLORI_GRADINI[i % COLORI_GRADINI.length]));
      gradino.scale.set(larghezza, altezza, cfg.profonditaGradino);
      gradino.position.set(0, altezza / 2, -(this.inizio + i * cfg.profonditaGradino + cfg.profonditaGradino / 2));
      gradino.receiveShadow = true;
      genitore.add(gradino);

      // Scritta del moltiplicatore sdraiata sul gradino
      const scritta = creaScritta(`x${cfg.moltiplicatori[i]}`, { larghezza: 5, altezza: 2.5 });
      scritta.rotation.x = -Math.PI / 2;
      scritta.position.set(0, altezza + 0.02, -(this.inizio + i * cfg.profonditaGradino + cfg.profonditaGradino / 2));
      genitore.add(scritta);
      this.scritte.push(scritta);
    }

    // --- In cima: uno spiazzo innevato con la segheria ---
    const altezzaCima = this.numeroGradini * cfg.altezzaGradino;
    const fineGradini = this.inizio + this.numeroGradini * cfg.profonditaGradino;
    const spiazzo = new THREE.Mesh(scatola, tinta(0xf3f8ff));
    spiazzo.scale.set(40, altezzaCima, 30);
    spiazzo.position.set(0, altezzaCima / 2, -(fineGradini + 15));
    spiazzo.receiveShadow = true;
    genitore.add(spiazzo);

    this.segheria = creaSegheria();
    this.segheria.userData.imposta(livelloMura, false);
    this.segheria.position.set(0, altezzaCima, -(fineGradini + 8));
    genitore.add(this.segheria);

    this.stato = 'attesa'; // 'attesa', 'sale', 'fermo', 'arrivato'
    this.gradiniRaggiunti = 0;
    this.tempoFermo = 0;
    this.finita = false;
    this.carneOrso = 0; // carne dell'orso sconfitto: si aggiunge al bottino dopo la scalinata, senza essere moltiplicata
  }

  // Altezza del terreno a una certa distanza (0 prima della salita)
  altezzaA(distanza) {
    const cfg = CONFIG.salita;
    if (distanza < this.inizio) return 0;
    const i = Math.floor((distanza - this.inizio) / cfg.profonditaGradino);
    return Math.min(i + 1, this.numeroGradini) * cfg.altezzaGradino;
  }

  // Quanti boscaioli servono per salire il gradino numero i (0 = il primo)
  costoGradino(i, carro) {
    const cfg = CONFIG.salita;
    const crescita = Math.pow(1 + cfg.crescitaCosto, i);
    const pesantezza = 1 + carro.peso / cfg.pesoRiferimento;
    return Math.ceil(cfg.costoBase * crescita * pesantezza);
  }

  get moltiplicatore() {
    if (this.gradiniRaggiunti === 0) return 1;
    return CONFIG.salita.moltiplicatori[this.gradiniRaggiunti - 1];
  }

  inizia(squadra) {
    this.stato = 'sale';
    this.boscaioliArrivati = squadra.numero; // questi diventeranno lavoratori della base
  }

  aggiorna(dt, squadra, carro) {
    const cfg = CONFIG.salita;

    if (this.stato === 'sale') {
      squadra.azione = 'corre';
      // La squadra si porta al centro della pista
      squadra.x += (0 - squadra.x) * Math.min(1, dt * 2);

      if (this.gradiniRaggiunti >= this.numeroGradini) {
        this.stato = 'arrivato';
      } else {
        const inizioGradino = this.inizio + this.gradiniRaggiunti * cfg.profonditaGradino;
        if (squadra.distanza >= inizioGradino - 0.6) {
          // Siamo davanti al gradino: basta la squadra per salirlo?
          const costo = this.costoGradino(this.gradiniRaggiunti, carro);
          if (squadra.numero >= costo) {
            squadra.imposta(squadra.numero - costo);
            if (costo > 0) suoni.suona('restaIndietro'); // qualcuno resta indietro, stanco, su questo gradino
            this.gradiniRaggiunti++;
            this.effetti.testo(squadra.x, squadra.y + 2.4, -squadra.distanza, `x${this.moltiplicatore}`, 'buono');
            const scritta = this.scritte[this.gradiniRaggiunti - 1];
            scritta.scale.setScalar(1.35); // la scritta "salta" quando il gradino è conquistato
            if (squadra.numero === 0) this.stato = 'fermo';
          } else {
            this.stato = 'fermo';
          }
        }
        if (this.stato === 'sale') {
          // prima dei gradini la squadra corre veloce (arriva dall'orso), poi sale a passo di salita
          squadra.distanza += (squadra.distanza < this.inizio - 3 ? CONFIG.squadra.velocitaBase : cfg.velocita) * dt;
          // i passi della squadra sui gradini, mentre sale
          this.attesaPasso = (this.attesaPasso ?? 0) - dt;
          if (this.attesaPasso <= 0) {
            this.attesaPasso = 0.3;
            suoni.suona('gradino');
          }
        }
      }
    } else if (this.stato === 'fermo' || this.stato === 'arrivato') {
      squadra.azione = 'ferma';
      this.tempoFermo += dt;
      if (this.tempoFermo > 1.6) this.finita = true;
    }

    // Le scritte "saltate" tornano piano piano normali
    for (const s of this.scritte) s.scale.setScalar(Math.max(1, s.scale.x - dt));

    // Squadra e carro salgono sui gradini in modo morbido
    squadra.y += (this.altezzaA(squadra.distanza) - squadra.y) * Math.min(1, dt * 10);
    carro.y += (this.altezzaA(carro.distanza + carro.lunghezza * 0.3) - carro.y) * Math.min(1, dt * 8);

    // La segheria: lama che gira, tronco, segatura e fumo
    this.segheria.userData.aggiorna(dt);
  }
}
