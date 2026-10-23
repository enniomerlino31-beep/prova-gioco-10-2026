// =====================================================================
//  CORSA: il "regista" di una partita
//  Crea squadra, carro, porte, alberi, rocce, lupi e salita finale,
//  li aggiorna a ogni fotogramma e decide quando la corsa finisce.
// =====================================================================

import * as THREE from 'three';
import { CONFIG } from '../config.js';
import { Squadra } from './squadra.js';
import { Carro } from './carro.js';
import { Porte } from './porte.js';
import { Alberi } from './alberi.js';
import { Ostacoli } from './ostacoli.js';
import { Lupi } from './lupi.js';
import { Effetti } from '../motore/effetti.js';
import { SfidaFinale } from './sfidaFinale.js';
import { generaLivello } from './generatoreLivello.js';

export class Corsa {
  // mondo: scena e telecamera; controlli: dito/tastiera; schermate: interfaccia;
  // alTermine: funzione chiamata con i risultati quando la corsa finisce
  constructor(mondo, controlli, schermate, alTermine) {
    this.mondo = mondo;
    this.controlli = controlli;
    this.schermate = schermate;
    this.alTermine = alTermine;

    // Tutti gli oggetti di questa corsa stanno qui dentro: così a fine corsa si buttano via in un colpo
    this.radice = new THREE.Group();
    mondo.scena.add(this.radice);

    // "effetti": testi volanti, particelle e oggetti che volano sul carro
    const effetti = new Effetti(this.radice, schermate);
    this.effetti = effetti;

    this.squadra = new Squadra(this.radice);
    this.carro = new Carro(this.radice);
    this.porte = new Porte(this.radice, effetti);
    this.alberi = new Alberi(this.radice, effetti);
    this.ostacoli = new Ostacoli(this.radice, effetti);
    this.lupi = new Lupi(this.radice, effetti);
    this.sfida = new SfidaFinale(this.radice, effetti);

    // Costruisce il livello a partire dall'elenco del generatore
    const livello = generaLivello();
    for (const cosa of livello.elenco) {
      if (cosa.tipo === 'porte') this.porte.aggiungiCoppia(cosa.distanza, cosa.sinistra, cosa.destra);
      if (cosa.tipo === 'albero') this.alberi.aggiungi(cosa.distanza, cosa.x);
      if (cosa.tipo === 'roccia') this.ostacoli.aggiungiRoccia(cosa.distanza, cosa.x);
      if (cosa.tipo === 'lupo') this.lupi.aggiungi(cosa.distanza, cosa.x, cosa.corre);
    }

    this.stato = 'corsa'; // 'corsa' → 'salita' → 'finita'
    this.bersaglioX = 0;   // dove il giocatore vuole portare la squadra
    this.tempo = 0;
    this.velocita = 0;
    this.attesaFine = 0;

    controlli.azzera();
    mondo.reimpostaTelecamera();
    this.carro.segui(this.squadra, 0, 0);
  }

  aggiorna(dt) {
    this.tempo += dt;
    const squadra = this.squadra;
    const carro = this.carro;

    if (this.stato === 'corsa') {
      // --- 1. Spostamento a destra/sinistra ---
      const fatica = carro.fatica(squadra.numero);
      // la squadra (e il carro dietro di lei) non esce mai dalla pista
      const ingombro = Math.max(squadra.semiLarghezza, carro.larghezza / 2);
      const limite = Math.max(0, CONFIG.pista.larghezza / 2 - ingombro);
      this.bersaglioX = THREE.MathUtils.clamp(this.bersaglioX + this.controlli.leggiSpostamento(dt), -limite, limite);
      // con il carro carico la squadra si sposta più lentamente (ma perde al massimo "perditaAgilitaMassima")
      const velocitaLaterale = CONFIG.squadra.velocitaLaterale * (1 - CONFIG.carro.perditaAgilitaMassima * fatica);
      const differenza = this.bersaglioX - squadra.x;
      const passoMassimo = velocitaLaterale * dt;
      squadra.x += THREE.MathUtils.clamp(differenza, -passoMassimo, passoMassimo);

      // --- 2. Avanzamento (ci si ferma se si sta tagliando un albero) ---
      const toccati = this.alberi.alberiToccati(squadra);
      if (toccati.length > 0) {
        this.velocita = 0;
        squadra.azione = 'taglia';
      } else {
        this.velocita = CONFIG.squadra.velocitaBase * (1 - CONFIG.carro.rallentamentoMassimo * fatica);
        squadra.azione = 'corre';
      }
      squadra.distanza += this.velocita * dt;

      // --- 3. Tutto il resto: carro, porte, alberi, rocce, lupi ---
      carro.segui(squadra, dt, this.velocita);
      this.porte.aggiorna(dt, squadra);
      this.alberi.aggiorna(dt, squadra, carro, toccati);
      this.ostacoli.aggiorna(dt, squadra, carro);
      this.lupi.aggiorna(dt, squadra, carro);

      // --- 4. Fine corsa? ---
      if (squadra.numero <= 0) {
        // Squadra finita: il carico è perso
        this.stato = 'finita';
        squadra.azione = 'ferma';
        this.risultato = { vinto: false, legnaPersa: carro.legna, carnePersa: carro.carne };
      } else if (squadra.distanza >= CONFIG.pista.lunghezza) {
        this.stato = 'salita';
        this.sfida.inizia(squadra);
      }
    } else if (this.stato === 'salita') {
      this.alberi.aggiorna(dt, squadra, carro, []);
      this.sfida.aggiorna(dt, squadra, carro);
      carro.segui(squadra, dt, squadra.azione === 'corre' ? CONFIG.salita.velocita : 0);
      if (this.sfida.finita) {
        this.stato = 'finita';
        this.risultato = {
          vinto: true,
          boscaioliArrivati: this.sfida.boscaioliArrivati,
          gradini: this.sfida.gradiniRaggiunti,
          moltiplicatore: this.sfida.moltiplicatore,
          legna: carro.legna,
          legnaFinale: Math.round(carro.legna * this.sfida.moltiplicatore),
          carne: carro.carne,
          carneFinale: Math.round(carro.carne * this.sfida.moltiplicatore),
          tempo: this.tempo,
        };
      }
    } else if (this.stato === 'finita') {
      // Piccola pausa prima della schermata finale
      this.attesaFine += dt;
      if (this.attesaFine > 0.8 && this.alTermine) {
        this.alTermine(this.risultato);
        this.alTermine = null;
      }
    }

    // --- Grafica: omini, effetti, telecamera, interfaccia ---
    squadra.aggiorna(dt, this.tempo);
    this.effetti.aggiorna(dt);
    const zoom = 1 + (carro.scala - 1) * CONFIG.telecamera.allontanamentoCarro;
    this.mondo.segui(squadra.x, squadra.y, -squadra.distanza, dt, zoom);
    this.schermate.aggiornaCorsa({
      boscaioli: squadra.numero,
      legna: carro.legna,
      carne: carro.carne,
      progresso: Math.min(1, squadra.distanza / CONFIG.pista.lunghezza),
      posizioneContatore: new THREE.Vector3(squadra.x, squadra.y + 1.9, -squadra.distanza),
    });
  }

  // Butta via tutti gli oggetti di questa corsa (quando se ne inizia un'altra)
  distruggi() {
    this.mondo.scena.remove(this.radice);
    this.radice.traverse((oggetto) => {
      if (oggetto.isInstancedMesh) oggetto.dispose();
      if (oggetto.geometry?.userData.daLiberare) oggetto.geometry.dispose();
      const materiali = Array.isArray(oggetto.material) ? oggetto.material : [oggetto.material];
      for (const m of materiali) {
        if (m?.userData.daLiberare) {
          m.map?.dispose();
          m.dispose();
        }
      }
    });
  }
}
