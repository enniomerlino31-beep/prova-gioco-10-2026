// =====================================================================
//  CONTROLLI: legge il dito (o il mouse) e la tastiera
//  - Dito/mouse: tieni premuto e trascina a destra o sinistra
//  - Tastiera: frecce ← → oppure A e D
//  Il resto del gioco chiede "di quanto si è spostato il giocatore?"
// =====================================================================

import { CONFIG } from '../config.js';

export class Controlli {
  constructor(elemento) {
    this.spostamentoAccumulato = 0; // metri di spostamento non ancora letti
    this.ditoGiu = false;
    this.ultimaX = 0;
    this.sinistraPremuta = false;
    this.destraPremuta = false;

    // "pointer" comprende sia il dito sia il mouse
    elemento.addEventListener('pointerdown', (e) => {
      this.ditoGiu = true;
      this.ultimaX = e.clientX;
      elemento.setPointerCapture(e.pointerId); // continua a seguire il dito anche fuori dal gioco
    });
    elemento.addEventListener('pointermove', (e) => {
      if (!this.ditoGiu) return;
      const differenzaPixel = e.clientX - this.ultimaX;
      this.ultimaX = e.clientX;
      // Trasforma i pixel in metri: tutta la larghezza dello schermo = tutta la pista (per la sensibilità)
      this.spostamentoAccumulato +=
        (differenzaPixel / window.innerWidth) * CONFIG.pista.larghezza * CONFIG.controlli.sensibilitaDito;
    });
    const fine = () => (this.ditoGiu = false);
    elemento.addEventListener('pointerup', fine);
    elemento.addEventListener('pointercancel', fine);

    window.addEventListener('keydown', (e) => this.tasto(e.key, true));
    window.addEventListener('keyup', (e) => this.tasto(e.key, false));
  }

  tasto(nome, premuto) {
    if (nome === 'ArrowLeft' || nome === 'a' || nome === 'A') this.sinistraPremuta = premuto;
    if (nome === 'ArrowRight' || nome === 'd' || nome === 'D') this.destraPremuta = premuto;
  }

  // Restituisce di quanti metri il giocatore vuole spostarsi dall'ultima volta (negativo = sinistra)
  leggiSpostamento(dt) {
    let spostamento = this.spostamentoAccumulato;
    this.spostamentoAccumulato = 0;
    const direzione = (this.destraPremuta ? 1 : 0) - (this.sinistraPremuta ? 1 : 0);
    spostamento += direzione * CONFIG.controlli.velocitaTastiera * dt;
    return spostamento;
  }

  // Dimentica i movimenti fatti prima (per esempio sulla schermata iniziale)
  azzera() {
    this.spostamentoAccumulato = 0;
  }
}
