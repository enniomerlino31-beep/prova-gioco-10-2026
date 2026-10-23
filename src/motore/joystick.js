// =====================================================================
//  JOYSTICK VIRTUALE (per la segheria)
//  - Telefono: tocca in QUALSIASI punto dello schermo e trascina:
//    il joystick compare sotto il dito e il boscaiolo cammina in quella direzione.
//  - Computer: frecce oppure W A S D (va bene anche il mouse, tenendo premuto).
//  Il resto del gioco legge "direzione": { x, y } con valori da -1 a 1
//  (x = destra/sinistra, y = su/giù sullo schermo).
// =====================================================================

import { CONFIG } from '../config.js';

export class Joystick {
  constructor(elemento) {
    this.attivo = false;          // il joystick funziona solo nella segheria
    this.direzione = { x: 0, y: 0 };
    this.ditoGiu = false;
    this.centro = { x: 0, y: 0 };
    this.tasti = new Set();

    // Le due parti disegnate: la base (cerchio grande) e il pomello (cerchio piccolo)
    this.base = document.getElementById('joystick');
    this.pomello = document.getElementById('joystick-pomello');

    elemento.addEventListener('pointerdown', (e) => {
      if (!this.attivo) return;
      this.ditoGiu = true;
      this.centro = { x: e.clientX, y: e.clientY };
      this.base.style.left = `${e.clientX}px`;
      this.base.style.top = `${e.clientY}px`;
      this.base.classList.remove('nascosto');
      this.muoviDito(e.clientX, e.clientY);
    });
    elemento.addEventListener('pointermove', (e) => {
      if (this.ditoGiu) this.muoviDito(e.clientX, e.clientY);
    });
    const fine = () => {
      this.ditoGiu = false;
      this.direzione = { x: 0, y: 0 };
      this.base.classList.add('nascosto');
      this.pomello.style.transform = 'translate(-50%, -50%)';
    };
    elemento.addEventListener('pointerup', fine);
    elemento.addEventListener('pointercancel', fine);

    window.addEventListener('keydown', (e) => this.tasti.add(e.key.toLowerCase()));
    window.addEventListener('keyup', (e) => this.tasti.delete(e.key.toLowerCase()));
    window.addEventListener('blur', () => this.tasti.clear());
  }

  muoviDito(x, y) {
    const raggio = CONFIG.segheria.raggioJoystick;
    let dx = x - this.centro.x;
    let dy = y - this.centro.y;
    const lunghezza = Math.hypot(dx, dy);
    if (lunghezza > raggio) {
      dx = (dx / lunghezza) * raggio;
      dy = (dy / lunghezza) * raggio;
    }
    this.pomello.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
    // piccola "zona morta" al centro, così il boscaiolo non scivola da solo
    const forza = Math.hypot(dx, dy) / raggio;
    this.direzione = forza < 0.12 ? { x: 0, y: 0 } : { x: dx / raggio, y: dy / raggio };
  }

  // Direzione da usare in questo momento (il dito ha la precedenza sulla tastiera)
  leggi() {
    if (!this.attivo) return { x: 0, y: 0 };
    if (this.ditoGiu) return this.direzione;
    const t = this.tasti;
    let x = (t.has('arrowright') || t.has('d') ? 1 : 0) - (t.has('arrowleft') || t.has('a') ? 1 : 0);
    let y = (t.has('arrowdown') || t.has('s') ? 1 : 0) - (t.has('arrowup') || t.has('w') ? 1 : 0);
    const l = Math.hypot(x, y);
    if (l > 0) {
      x /= l;
      y /= l;
    }
    return { x, y };
  }

  // Spegne il joystick (es. quando si entra nella corsa)
  spegni() {
    this.attivo = false;
    this.ditoGiu = false;
    this.direzione = { x: 0, y: 0 };
    this.base.classList.add('nascosto');
  }
}
