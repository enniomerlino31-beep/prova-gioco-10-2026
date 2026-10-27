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
import { cancella } from './salvataggio.js';
import { suoni, ascoltaTocchi } from './motore/suoni.js';

// Con ?reset nell'indirizzo si ricomincia da zero: il salvataggio viene cancellato prima di caricare la base.
// Poi ?reset viene tolto dall'indirizzo, così ricaricando la pagina non si cancella di nuovo tutto.
const indirizzo = new URL(window.location.href);
if (indirizzo.searchParams.has('reset')) {
  cancella();
  indirizzo.searchParams.delete('reset');
  window.history.replaceState(null, '', indirizzo);
}

// Suoni e musica: si scaricano subito (la musica un po' dopo), si sbloccano al primo tocco (il telefono lo vuole).
ascoltaTocchi();
suoni.carica();
suoni.musica('base');

// Impostazioni: l'ingranaggio apre un piccolo menu con gli interruttori di effetti e musica (restano salvati).
// Mentre il menu è aperto il gioco è in pausa (gli effetti tacciono, la musica va avanti).
const menuImpostazioni = document.getElementById('menu-impostazioni');
const interruttoreEffetti = document.getElementById('interruttore-effetti');
const interruttoreMusica = document.getElementById('interruttore-musica');
let inPausa = false;
function mostraInterruttori() {
  interruttoreEffetti.setAttribute('aria-checked', String(suoni.conEffetti));
  interruttoreMusica.setAttribute('aria-checked', String(suoni.conMusica));
}
function impostaMenu(aperto) {
  inPausa = aperto;
  menuImpostazioni.classList.toggle('nascosto', !aperto);
  suoni.mettiInPausa(aperto);
  if (aperto) mostraInterruttori();
}
document.getElementById('pulsante-impostazioni').addEventListener('click', () => impostaMenu(true));
document.getElementById('pulsante-chiudi-impostazioni').addEventListener('click', () => impostaMenu(false));
// toccando fuori dal riquadro, o premendo Esc, il menu si chiude
menuImpostazioni.addEventListener('click', (evento) => {
  if (evento.target === menuImpostazioni) impostaMenu(false);
});
window.addEventListener('keydown', (evento) => {
  if (evento.key === 'Escape') impostaMenu(!inPausa);
});
interruttoreEffetti.addEventListener('click', () => {
  suoni.impostaEffetti(!suoni.conEffetti);
  mostraInterruttori();
});
interruttoreMusica.addEventListener('click', () => {
  suoni.impostaMusica(!suoni.conMusica);
  mostraInterruttori();
});
// Tutti i pulsanti dei menu (Gioca, Alla segheria, Raccogli, ingranaggio...) fanno un piccolo clic
document.addEventListener('click', (evento) => {
  if (evento.target.closest?.('.pulsante, .pulsante-impostazioni, .interruttore')) suoni.suona('clic');
});

const contenitore = document.getElementById('gioco');
const mondo = creaMondo(contenitore); // il mondo della corsa (e il "pittore" condiviso)
const controlli = new Controlli(contenitore);
const joystick = new Joystick(contenitore);
const schermate = new Schermate(mondo.telecamera);
const segheria = new Segheria(mondo.renderer, schermate, joystick, avviaCorsa);

let modo = 'menu';let corsa = null;

// Con ?orso=5&boscaioli=200 (o ?orso=0 per la sola scalinata) parte subito una prova dello scontro con l'orso:
// livello e numero di boscaioli a piacere, vicino alla fine della corsa. Una prova non cambia la partita salvata.
const provaOrso = indirizzo.searchParams.has('orso')
  ? { livello: Math.max(0, Math.floor(Number(indirizzo.searchParams.get('orso'))) || 0), boscaioli: Math.max(1, Math.floor(Number(indirizzo.searchParams.get('boscaioli'))) || 100), legna: Math.max(0, Math.floor(Number(indirizzo.searchParams.get('legna'))) || 200) }
  : null;

// Dal cancello della segheria parte una nuova corsa
function avviaCorsa(provaOrsoRichiesta = null) {
  const prova = provaOrsoRichiesta && typeof provaOrsoRichiesta.livello === 'number' ? provaOrsoRichiesta : null; // solo ?orso passa una prova
  segheria.esci();
  suoni.preparaPaura(); // la musica dello scontro con l'orso deve essere pronta quando serve
  if (corsa) corsa.distruggi();
  const opzioni = prova
    ? { primaCorsa: false, orso: prova.livello > 0 ? prova.livello : null, prova: { boscaioli: prova.boscaioli, legna: prova.legna } }
    : segheria.preparaCorsa();
  opzioni.livelloMura = segheria.livelli.mura; // la segheria in cima alla salita ha lo stesso aspetto di quella della base
  corsa = new Corsa(mondo, controlli, schermate, fineCorsa, opzioni);
  schermate.impostaTelecamera(mondo.telecamera);
  schermate.mostraCorsa();
  suoni.musica('corsa');
  modo = 'corsa';
}

// A fine corsa il bottino va SUBITO in magazzino (e viene salvato), poi si vede il riepilogo
// (la prima corsa del tutorial può avere un bonus di legna, che si vede nel riepilogo)
// Le prove (?orso) non toccano la partita: niente bottino e l'orso non cambia livello.
// Se i boscaioli finiscono contro l'orso si porta a casa SOLO la legna degli alberi (niente carne, niente moltiplicatore).
function fineCorsa(risultato) {
  if (!risultato.prova) {
    if (risultato.vinto) risultato.bonusLegna = segheria.aggiungiBottino(risultato.legnaFinale, risultato.carneFinale);
    else if (risultato.orsoVince) segheria.aggiungiBottino(risultato.legnaPortata, 0);
    segheria.registraOrso(risultato);
  }
  suoni.suona(risultato.vinto ? 'vittoria' : 'sconfitta');
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
  suoni.musica('base');
  modo = 'segheria';
  // Con ?corsa nell'indirizzo, la prima volta che si entra nella base parte subito una corsa (per provarla senza camminare)
  if (indirizzo.searchParams.has('corsa')) {
    indirizzo.searchParams.delete('corsa');
    window.history.replaceState(null, '', indirizzo);
    avviaCorsa();
  } else if (provaOrso) {
    for (const nome of ['orso', 'boscaioli', 'legna']) indirizzo.searchParams.delete(nome);
    window.history.replaceState(null, '', indirizzo);
    avviaCorsa(provaOrso);
  }
}

schermate.quandoGioca(vaiAllaSegheria);
schermate.quandoFineCorsa(vaiAllaSegheria);

// Aspetta il carattere dei titoli prima di disegnare le scritte sulle porte
document.fonts.load('40px "Lilita One"').catch(() => {});

// --- Il ciclo del gioco ---
let ultimoIstante = performance.now();
// Un errore in un pezzo del gioco non deve fermare tutto il resto (né i suoni): lo si scrive nella console, una volta sola
let ultimoErrore = '';
function segnala(errore) {
  const testo = String(errore?.stack ?? errore);
  if (testo === ultimoErrore) return;
  ultimoErrore = testo;
  console.error(errore);
}

function ciclo(adesso) {
  requestAnimationFrame(ciclo); // si prenota subito il prossimo fotogramma: il ciclo non si ferma mai
  // dt = secondi passati dall'ultimo fotogramma (al massimo 0,05 per evitare salti se il telefono rallenta)
  const dt = Math.min(0.05, (adesso - ultimoIstante) / 1000);
  ultimoIstante = adesso;

  try {
    if (inPausa) {
      // menu aperto: niente si muove (si ridisegna solo la scena ferma)
    } else if (modo === 'segheria') {
      segheria.aggiorna(dt);
    } else if (modo === 'corsa') {
      corsa.aggiorna(dt);
      segheria.lavoraDuranteLaCorsa(dt); // intanto il boscaiolo secondario continua a portare legna alla base
    } else {
      // sulla schermata iniziale si vede la segheria sullo sfondo
      segheria.ambiente.segui(segheria.giocatore.posizione, dt);
    }
    if (!inPausa) schermate.aggiorna(dt);
  } catch (errore) {
    segnala(errore);
  }
  try {
    suoni.aggiorna(); // ripetizioni dei suoni continui e cambio di musica (anche se il resto del gioco avesse un problema)
  } catch (errore) {
    segnala(errore);
  }
  try {
    if (modo === 'corsa') mondo.disegna();
    else segheria.disegna();
  } catch (errore) {
    segnala(errore);
  }
}
requestAnimationFrame(ciclo);
