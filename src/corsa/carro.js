// =====================================================================
//  CARRO: l'elemento centrale della corsa
//  - tiene il conto della legna e della carne caricate
//  - più è carico, più diventa GRANDE (difficile da far passare tra gli ostacoli)
//    e PESANTE (la squadra va più piano e si sposta più a fatica)
//  - segue la squadra da vicino, come se fosse trainato
//  - quando un tronco o un pezzo di carne atterra, "rimbalza"
// =====================================================================

import * as THREE from 'three';
import { CONFIG } from '../config.js';
import { creaModelloCarro, LUNGHEZZA_CARRO } from '../modelli/carro.js';

export class Carro {
  constructor(genitore) {
    this.legna = 0;      // unità di legna sul carro
    this.carne = 0;      // unità di carne sul carro
    this.x = 0;          // posizione a destra/sinistra
    this.distanza = 0;   // metri percorsi
    this.y = 0;          // altezza (nella salita)
    this.rimbalzo = 0;   // 1 = appena colpito da un oggetto in arrivo, poi scende a 0

    const c = CONFIG.carro;
    this.modello = creaModelloCarro(c.tronchiMassimi, c.pezziCarneMassimi);
    this.gruppo = this.modello.gruppo;
    genitore.add(this.gruppo);
    this._v = new THREE.Vector3();
  }

  get carico() {
    return this.legna + this.carne;
  }

  // Quanto è ingrandito il carro (1 = vuoto). Cresce in fretta all'inizio, poi sempre più piano.
  get scala() {
    const c = CONFIG.carro;
    return 1 + c.crescitaMassima * (1 - Math.exp(-this.carico / c.caricoPerCrescita));
  }

  get larghezza() {
    return CONFIG.carro.larghezzaIniziale * this.scala;
  }

  get lunghezza() {
    return LUNGHEZZA_CARRO * this.scala;
  }

  get peso() {
    return this.legna * CONFIG.carro.pesoPerLegna + this.carne * CONFIG.carro.pesoPerCarne;
  }

  // Quanto il carro "frena" la squadra: 0 = per niente, quasi 1 = tantissimo.
  // Più boscaioli tirano, meno si sente il peso.
  fatica(numeroBoscaioli) {
    const forza = Math.max(0, numeroBoscaioli) * CONFIG.carro.forzaPerBoscaiolo;
    if (this.peso <= 0) return 0;
    return this.peso / (this.peso + forza);
  }

  aggiungiLegna(quantita) {
    this.legna += quantita;
  }

  aggiungiCarne(quantita) {
    this.carne += quantita;
  }

  // Fa "rimbalzare" il carro (quando ci atterra sopra qualcosa)
  rimbalza() {
    this.rimbalzo = 1;
  }

  // Un oggetto rotondo in quel punto tocca il carro?
  // L'area di urto è un po' più stretta del carro disegnato, per perdonare i colpi di striscio.
  tocca(x, distanza, raggio) {
    const c = CONFIG.carro;
    const vicinoDiLato = Math.abs(x - this.x) < (this.larghezza * c.riduzioneCollisione) / 2 + raggio;
    const vicinoInAvanti = Math.abs(distanza - this.distanza) < (this.lunghezza * c.riduzioneCollisione) / 2 + raggio;
    return vicinoDiLato && vicinoInAvanti;
  }

  // Toglie una parte del carico (es. urto contro una roccia) e lo mostra a schermo
  perdiCaricoConEffetto(percentuale, effetti) {
    const legnaPersa = Math.round(this.legna * percentuale);
    const carnePersa = Math.round(this.carne * percentuale);
    this.legna -= legnaPersa;
    this.carne -= carnePersa;
    this.rimbalza();
    if (legnaPersa + carnePersa > 0) {
      const testo = [legnaPersa ? `-${legnaPersa} legna` : '', carnePersa ? `-${carnePersa} carne` : ''].filter(Boolean).join('  ');
      effetti.testo(this.x, this.y + 2.5, -this.distanza, testo, 'cattivo');
      effetti.sbuffo(this.x, this.y + 1.2, -this.distanza, 0x8a5328, 14);
    }
  }

  // Punto del mondo in cima alla pila: lì atterrano i tronchi ('legna') o la carne ('carne')
  puntoDiArrivo(tipo, risultato = new THREE.Vector3()) {
    const c = CONFIG.carro;
    if (tipo === 'carne') {
      risultato.copy(this.modello.cimaCarne(Math.ceil(this.carne / c.carnePerPezzo)));
    } else {
      const quanti = Math.ceil(this.legna / c.legnaPerTronco);
      risultato.copy(this.modello.cimaTronchi(Math.min(quanti, c.tronchiMassimi - 1)));
      // se la pila è "ingrossata" (cataste), anche la sua cima è più in alto
      risultato.y = 0.71 + (risultato.y - 0.71) * this.modello.pila.scale.y;
    }
    this.gruppo.updateMatrixWorld();
    return this.gruppo.localToWorld(risultato);
  }

  // Il carro sta dietro alla squadra e la segue di lato in modo pronto e prevedibile
  segui(squadra, dt, velocita) {
    const ritardo = squadra.x - this.x;
    this.x += ritardo * Math.min(1, dt * CONFIG.carro.prontezzaCarro);
    // Dietro alla folla: spazio libero + timone (lungo 1,8 m) + mezzo carro
    this.distanza =
      squadra.distanza - squadra.semiProfondita - CONFIG.carro.distanzaDallaSquadra - 1.8 * this.scala - this.lunghezza / 2;
    this.aggiornaGrafica(dt, velocita, ritardo);
  }

  aggiornaGrafica(dt, velocita, ritardo = 0) {
    const c = CONFIG.carro;
    const s = this.scala;

    // Rimbalzo: il carro si schiaccia un attimo e torna su
    this.rimbalzo = Math.max(0, this.rimbalzo - dt * 4);
    const schiacciamento = Math.sin((1 - this.rimbalzo) * Math.PI * 2) * this.rimbalzo * 0.14;

    this.gruppo.position.set(this.x, this.y, -this.distanza);
    this.gruppo.scale.set(s * (1 + schiacciamento * 0.5), s * (1 - schiacciamento), s * (1 + schiacciamento * 0.5));
    // Il carro si gira un po' quando sterza
    this.gruppo.rotation.y = -ritardo * 0.08;

    // Le ruote girano in base alla velocità
    for (const ruota of this.modello.ruote) ruota.rotation.x -= (velocita * dt) / (0.4 * s);

    // Un tronco in più ogni tot di legna. Oltre il massimo la pila diventa "cataste" più grosse.
    const tronchiNecessari = Math.ceil(this.legna / c.legnaPerTronco);
    this.modello.tronchi.count = Math.min(c.tronchiMassimi, tronchiNecessari);
    const ingrossamento = Math.min(1.6, Math.sqrt(Math.max(1, tronchiNecessari / c.tronchiMassimi)));
    this.modello.pila.scale.set(ingrossamento, ingrossamento, 1);
    // (la pila si ingrossa partendo dal pianale, non da terra)
    this.modello.pila.position.y = -0.71 * (ingrossamento - 1);

    const pezzi = Math.min(c.pezziCarneMassimi, Math.ceil(this.carne / c.carnePerPezzo));
    for (const mesh of this.modello.carne) mesh.count = pezzi;
  }
}
