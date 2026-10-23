// =====================================================================
//  PUNTO DI PARTENZA DEL GIOCO
//  Prepara il mondo, i controlli e le schermate, poi fa "girare" il gioco:
//  circa 60 volte al secondo aggiorna tutto e ridisegna lo schermo.
//
//  Il gioco ha tre "modi":
//   - 'menu'     → schermata iniziale
//   - 'segheria' → la base, dove si vende (schermata principale)
//   - 'corsa'    → la corsa nella foresta
// =====================================================================

import { creaMondo } from './motore/scena.js';
import { Controlli } from './motore/controlli.js';
import { Joystick } from './motore/joystick.js';
import { Schermate } from './schermate/schermate.js';
import { Corsa } from './corsa/corsa.js';
import { Segheria } from './segheria/segheria.js';

const contenitore = document.getElementById('gioco');
const mondo = creaMondo(contenitore); // il mondo della corsa (e il "pittore" condiviso)
const controlli = new Controlli(contenitore);
const joystick = new Joystick(contenitore);
const schermate = new Schermate(mondo.telecamera);
const segheria = new Segheria(mondo.renderer, schermate, joystick, avviaCorsa);

let modo = 'menu';let corsa = null;

// Dal cancello della segheria parte una nuova corsa
function avviaCorsa() {
  segheria.esci();
  if (corsa) corsa.distruggi();
  corsa = new Corsa(mondo, controlli, schermate, fineCorsa);
  schermate.impostaTelecamera(mondo.telecamera);
  schermate.mostraCorsa();
  modo = 'corsa';
}

// A fine corsa il bottino va SUBITO in magazzino (e viene salvato), poi si vede il riepilogo
function fineCorsa(risultato) {
  if (risultato.vinto) segheria.aggiungiBottino(risultato.legnaFinale, risultato.carneFinale);
  schermate.mostraFine(risultato);
}

// Si entra (o si torna) nella segheria
function vaiAllaSegheria() {
  if (corsa) {
    corsa.distruggi();
    corsa = null;
  }
  schermate.impostaTelecamera(segheria.telecamera);
  segheria.entra();
  modo = 'segheria';
}

schermate.quandoGioca(vaiAllaSegheria);
schermate.quandoFineCorsa(vaiAllaSegheria);

// Aspetta il carattere dei titoli prima di disegnare le scritte sulle porte
document.fonts.load('40px "Lilita One"').catch(() => {});

// --- Il ciclo del gioco ---
let ultimoIstante = performance.now();
function ciclo(adesso) {
  // dt = secondi passati dall'ultimo fotogramma (al massimo 0,05 per evitare salti se il telefono rallenta)
  const dt = Math.min(0.05, (adesso - ultimoIstante) / 1000);
  ultimoIstante = adesso;

  if (modo === 'segheria') {
    segheria.aggiorna(dt);
  } else if (modo === 'corsa') {
    corsa.aggiorna(dt);
  } else {
    // sulla schermata iniziale si vede la segheria sullo sfondo
    segheria.ambiente.segui(segheria.giocatore.posizione, dt);
  }
  schermate.aggiorna(dt);
  if (modo === 'corsa') mondo.disegna();
  else segheria.disegna();

  requestAnimationFrame(ciclo);
}
requestAnimationFrame(ciclo);
