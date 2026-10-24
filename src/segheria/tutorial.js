// =====================================================================
//  TUTORIAL (solo alla prima partita)
//  Tre passaggi guidati, uno alla volta. Per ognuno c'è un breve messaggio
//  in alto e una grande freccia gialla che salta sopra il punto giusto
//  (se il punto è fuori dallo schermo, una freccia sul bordo indica da che
//  parte andare):
//   1. "Fai la prima corsa!"              → cerchio CORSA
//   2. "Porta la legna allo sportello!"   → sportello LEGNA (prima la catasta, se non si ha legna)
//   3. "Compra le mura di pietra!"        → il cerchio delle mura (l'unico acceso durante il tutorial)
//  Un passaggio sparisce quando il giocatore lo completa (la prima corsa conta
//  solo se è vinta). Il passaggio a cui si è arrivati è salvato: finito il terzo
//  arriva la schermata di festa e il tutorial non compare più.
//  I lupi non arrivano finché non ci sono le mura di pietra (vedi segheria.js).
// =====================================================================

import * as THREE from 'three';

const PASSI = [
  { evento: 'corsa', testo: 'Fai la prima corsa!' },
  { evento: 'legna', testo: 'Porta la legna allo sportello!' },
  { evento: 'miglioramento', testo: 'Compra le mura di pietra!' },
];

// Freccia gialla che punta verso il basso (cono + asta), luminosa così si vede sempre
function creaFreccia() {
  const materiale = new THREE.MeshLambertMaterial({ color: 0xffc21a, emissive: 0x6a4a00 });
  const freccia = new THREE.Group();
  const punta = new THREE.Mesh(new THREE.ConeGeometry(0.5, 0.85, 16), materiale);
  punta.rotation.x = Math.PI; // la punta guarda in basso
  const asta = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.8, 12), materiale);
  asta.position.y = 0.8;
  freccia.add(punta, asta);
  freccia.visible = false;
  return freccia;
}

export class Tutorial {
  // passo: da dove ripartire (0 = dall'inizio, 3 = finito), preso dal salvataggio
  constructor(genitore, schermate, passo) {
    this.schermate = schermate;
    this.passo = passo;
    this.tempo = 0;
    this.freccia = creaFreccia();
    genitore.add(this.freccia);
  }

  get finito() {
    return this.passo >= PASSI.length;
  }

  // Il giocatore ha fatto qualcosa ('corsa', 'legna' o 'miglioramento'): se era il passaggio di adesso
  // si passa al successivo. Restituisce true quando il tutorial è appena finito.
  completa(evento) {
    if (this.finito || PASSI[this.passo].evento !== evento) return false;
    this.passo += 1;
    this.tempo = 0;
    if (this.finito) this.nascondi();
    return this.finito;
  }

  // bersaglio: il punto del mondo da indicare per il passaggio di adesso
  aggiorna(dt, bersaglio) {
    if (this.finito) return;
    this.tempo += dt;
    this.freccia.visible = true;
    this.freccia.position.set(bersaglio.x, 2.3 + Math.abs(Math.sin(this.tempo * 4)) * 0.7, bersaglio.z);
    this.freccia.rotation.y += dt * 2;
    this.schermate.mostraTutorial(PASSI[this.passo].testo, this.passo + 1, PASSI.length, bersaglio);
  }

  // Si esce dalla base (corsa) o il tutorial è finito
  nascondi() {
    this.freccia.visible = false;
    this.schermate.mostraTutorial(null);
  }
}
