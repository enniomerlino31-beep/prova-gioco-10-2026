// =====================================================================
//  SEGHERIA: il "regista" della base
//  Mette insieme ambiente e mura, boscaiolo, catasta, sportelli
//  di vendita (con il cerchio delle monete), clienti, cancelli, cerchi dei
//  miglioramenti, pavimento, lavoratori (aiutante, due cacciatori, venditori),
//  torrette con l'arciere e lupi. A ogni fotogramma:
//   - muove il boscaiolo con il joystick (le mura e i cancelli chiusi lo bloccano)
//   - raccoglie/scarica la merce quando il boscaiolo è nella zona giusta
//   - fa pagare i miglioramenti quando il boscaiolo sta sul loro cerchio
//   - fa comprare i clienti
//   - fa lavorare i lavoratori e tirare gli arcieri; ripara le mura se c'è la riparazione
//   - quando si compra qualcosa che compare lontano, porta la telecamera a vederlo
//   - alla prima partita guida il giocatore con il tutorial (e intanto niente lupi)
//   - salva i progressi sul dispositivo
// =====================================================================

import * as THREE from 'three';
import { CONFIG } from '../config.js';
import { carica, salva, ricominciaDaCapo } from '../salvataggio.js';
import { registraVendita } from '../economia.js';
import { Effetti } from '../motore/effetti.js';
import { creaAmbiente, MAPPA, latoDelleMura } from './ambiente.js';
import { Giocatore } from './giocatore.js';
import { Deposito } from './catasta.js';
import { Sportello } from './sportello.js';
import { PilaSoldi } from './soldi.js';
import { Pavimento } from './pavimento.js';
import { Clienti } from './clienti.js';
import { Cancello } from './cancello.js';
import { CerchioMiglioramento } from './miglioramenti.js';
import { Aiutante } from './aiutante.js';
import { Cacciatore } from './cacciatore.js';
import { Venditore, postoVenditore } from './venditore.js';
import { Torrette } from './torrette.js';
import { Tutorial } from './tutorial.js';
import { Mura, SUONO_MATERIALE } from './mura.js';
import { BancoCacciatore } from './banco.js';
import { BoscaioloSecondario, durataGiro } from './secondario.js';
import { lavoroOffline, secondiDiAssenza } from './offline.js';
import { creaBarraGigante } from './barraGigante.js';
import { CerchioRiparazione } from './cerchioRiparazione.js';
import { suoni } from '../motore/suoni.js';
import { creaLupo } from '../modelli/lupo.js';
import { animaGaloppo, animaMorso, animaPassoPesante, animaUlulato, COLPO } from '../modelli/animazioni.js';
import { creaCarne } from '../modelli/carne.js';

const OGNI_QUANTO_SALVARE = 2; // secondi
const MONETE_INFINITE = 999999; // con ?moneteinfinite le monete in tasca tornano sempre a questo numero
const LAVORATORI_BASE = ['aiutante', 'cacciatore', 'venditore']; // assunti tutti e tre, compare il cerchio del pavimento
// I due cerchi della fila ECONOMIA vanno avanti a coppie: prima "Aiutante" e "Cacciatore", poi "Venditore" e
// "Secondo cacciatore", poi i potenziamenti (vedi aggiornaVisibilita)
const CERCHI_ECONOMIA = ['economia', 'caccia'];
const PASSI_INSIEME = 2; // quanti passi dei due cerchi si comprano a coppie (dopo, i potenziamenti aspettano tutti e quattro)
// il cerchio del pavimento (nome del cerchio -> tipo di pavimento)
const PAVIMENTI = { pavimentoPietra: 'pietra' };

// Opzioni dei voli dentro la segheria (più brevi e piccoli di quelli della corsa)
const VOLO_CORTO = { durata: 0.35, altezza: 1.4, scala: 0.55, sbuffo: false };

// Toglie un comando di prova (come ?gigante) dall'indirizzo, così ricaricando la pagina non si ripete
function togliDallIndirizzo(nome) {
  const indirizzo = new URL(window.location.href);
  indirizzo.searchParams.delete(nome);
  window.history.replaceState(null, '', indirizzo);
}

// ---------------- LUPI ----------------
const DISTANZA_PREPARA_CORSA = 5; // a questa distanza dal cerchio CORSA (metri) la corsa comincia a prepararsi
const LUPI_NORMALI = 12;  // lupi normali che possono esserci al massimo (più il lupo gigante)
const SCALA_LUPO = 0.72;  // grandezza dei lupi intorno alla base
const VERDE = 0x6fe17d;
// Da dove escono dalla foresta (fuori dalle mura); i lupi di un gruppo partono un po' sparsi attorno al punto
const PARTENZE_LUPI = [
  { x: -14.9, z: -5.4 }, { x: 13.9, z: -3.9 }, { x: -12.0, z: 9.0 }, { x: 14.4, z: 8.3 }, { x: -16.1, z: 3.4 },
];

// Barra della vita sopra un lupo: una striscia che si accorcia a ogni colpo (verde, poi gialla, poi rossa).
// larga: lunghezza nel modello del lupo; tacche: in quante parti è divisa da righe scure (0 = nessuna).
// Il lupo normale ha 5 tacche: ogni freccia della torretta di legno ne toglie una, un colpo d'ascia quasi due.
function creaBarra(larga, tacche, altezza) {
  const gruppo = new THREE.Group();
  gruppo.position.set(0, altezza, 0);
  gruppo.visible = false;
  const sfondo = new THREE.Mesh(new THREE.BoxGeometry(larga + 0.08, 0.17, 0.02), new THREE.MeshBasicMaterial({ color: 0x1d2128 }));
  sfondo.position.z = 0.03; // dietro la striscia, visto dalla telecamera
  const pieno = new THREE.Mesh(new THREE.BoxGeometry(larga, 0.1, 0.03), new THREE.MeshBasicMaterial({ color: VERDE }));
  gruppo.add(sfondo, pieno);
  for (let i = 1; i < tacche; i++) {
    const riga = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.12, 0.035), sfondo.material);
    riga.position.set(-larga / 2 + (larga * i) / tacche, 0, -0.005); // davanti alla striscia
    gruppo.add(riga);
  }
  return {
    gruppo,
    aggiorna: (lupo) => {
      const parte = Math.max(0, lupo.hp / lupo.vita);
      pieno.scale.x = Math.max(0.001, parte);
      pieno.position.x = ((1 - parte) * larga) / 2; // resta attaccata a sinistra e si accorcia da destra
      pieno.material.color.set(parte > 0.5 ? VERDE : parte > 0.25 ? 0xffd23f : 0xe8483a);
    },
  };
}

export class Segheria {
  // alPartenzaCorsa: funzione chiamata quando il boscaiolo riempie il cerchio del cancello della corsa
  // alVicinoAlCancello(true/false): chiamata quando il boscaiolo si avvicina al cancello della corsa (e quando si allontana):
  // serve a preparare la corsa un attimo prima, così all'avvio non c'è lo scatto
  constructor(renderer, schermate, joystick, alPartenzaCorsa, alVicinoAlCancello = () => {}) {
    this.renderer = renderer;
    this.schermate = schermate;
    this.joystick = joystick;
    this.alPartenzaCorsa = alPartenzaCorsa;
    this.alVicinoAlCancello = alVicinoAlCancello;
    this.vicinoAlCancello = false;

    const ambiente = creaAmbiente();
    this.ambiente = ambiente;
    this.scena = ambiente.scena;
    this.telecamera = ambiente.telecamera;

    // Progressi salvati
    this.stato = carica();
    const s = this.stato;
    // Tutorial: solo alla prima partita (aggiungendo ?tutorial all'indirizzo si può rivedere,
    // con ?senzatutorial si salta: 3 = tutti e tre i passaggi fatti)
    const indirizzo = new URLSearchParams(window.location.search);
    if (indirizzo.has('tutorial')) s.tutorial = 0;
    if (indirizzo.has('senzatutorial')) s.tutorial = 3;
    // Per le prove: con ?moneteinfinite le monete in tasca non finiscono mai (vedi aggiorna)
    this.moneteInfinite = indirizzo.has('moneteinfinite');
    // Per le prove: con ?tuttocomprato è già comprato tutto tranne il boscaiolo secondario, con 5000 monete in tasca
    if (indirizzo.has('tuttocomprato')) this.compraTuttoPerProva();
    // Mentre si era via la base ha lavorato (?offline=N finge N minuti di assenza, per provare)
    this.lavoroMentreVia(indirizzo.get('offline'));

    this.radice = new THREE.Group();
    this.scena.add(this.radice);
    this.effetti = new Effetti(this.radice, schermate);

    this.giocatore = new Giocatore(this.radice, this.effetti);
    for (const [tipo, quantita] of Object.entries(s.schiena)) if (quantita > 0) this.giocatore.aggiungi(tipo, quantita);
    // a ogni passo del boscaiolo: morbido sulla neve, diverso sul pavimento di pietra (gli altri non fanno rumore)
    this.giocatore.alPasso = () => suoni.suona(this.pavimento.copre(this.giocatore.posizione) ? 'passoPietra' : 'passoNeve');
    this.catasta = new Deposito(this.radice, 'legna', MAPPA.catasta, s.catasta);
    // un solo cerchio delle monete, tra i due sportelli: ci pagano i clienti di tutti e due
    this.soldi = new PilaSoldi(this.radice, MAPPA.monete, s.soldiATerra);
    this.sportelli = {
      legna: new Sportello(this.radice, 'legna', MAPPA.sportelli.legna, s.sportelli.legna, this.soldi),
      carne: new Sportello(this.radice, 'carne', MAPPA.sportelli.carne, s.sportelli.carne, this.soldi),
    };
    // tre cancelli: quello della corsa in alto (con il cerchio CORSA), quello della foresta a sinistra e uno a destra
    const cancello = (posizione, opzioni = {}) => new Cancello(this.radice, posizione, { normale: latoDelleMura(posizione), ...opzioni });
    this.cancelli = {
      corsa: cancello(MAPPA.cancelli.corsa, { scritta: 'CORSA' }),
      foresta: cancello(MAPPA.cancelli.foresta),
      destra: cancello(MAPPA.cancelli.destra),
    };
    // Cose che il boscaiolo non attraversa mai: palizzata, banconi e depositi degli sportelli
    this.ostacoliFissi = [...ambiente.muri, ...Object.values(this.sportelli).flatMap((sportello) => sportello.ostacoli)];

    // Merce e soldi "in volo": se la pagina si chiude a metà volo, nel salvataggio non si perdono
    this.inVolo = { legna: 0, carne: 0, soldi: 0 };

    this.clienti = new Clienti(this.radice, this.sportelli, this.effetti, this.inVolo, (tipo, quantita, incasso) =>
      registraVendita(this.stato, tipo, quantita, incasso)
    );

    this.attesaRaccolta = 0;
    this.trasferimento = null; // { chiave, pezzo }: quanto è grande ogni pezzo nel trasferimento in corso
    this.attesaSalvataggio = OGNI_QUANTO_SALVARE;
    this.attiva = false;
    this.haCamminato = false;
    this.mura = new Mura(this.radice, ambiente.palizzata, MAPPA.miglioramenti.mura, this.effetti);
    // Il grande cerchio verde dove si porta la legna per riparare le mura: compare sotto il 25% della vita (vedi gestisceRiparazione)
    const R = CONFIG.muraAllarme;
    this.cerchioMura = new CerchioRiparazione(this.radice, MAPPA.riparazioneMura, R.legnaRiparazione, R.raggioCerchio);
    this.cerchioMura.nascondi(true, true);
    this.tempoGioco = 0;
    // Da dove arrivano i lupi (vedi aggiornaLupi): ogni "fronte" ha il suo orologio, che parte quando il fronte si apre.
    // lato: -1 = dal lato sinistro della foresta, 1 = dal destro, 0 = da tutte le parti
    const primo = CONFIG.segheria.primoLupo;
    this.fronti = {
      deboli: { tempo: 0, prossimo: primo, lato: 0 },   // dopo le mura di pietra: pochi lupi deboli
      sinistra: { tempo: 0, prossimo: primo, lato: -1 }, // dopo la torretta di sinistra
      destra: { tempo: 0, prossimo: primo, lato: 1 },    // dopo la torretta di destra
    };
    this.lupiBase = this.creaLupiBase();
    this.lupoGigante = this.lupiBase.find((lupo) => lupo.gigante);
    this.prossimoGigante = CONFIG.lupoGigante.ogniMinimo + Math.random() * (CONFIG.lupoGigante.ogniMassimo - CONFIG.lupoGigante.ogniMinimo);
    this.attesaAvvisoGigante = null; // secondi alla scritta "Arriva il lupo gigante!" (parte quando la telecamera è arrivata da lui)
    this.muraCadute = false;         // le mura sono arrivate a zero: partita persa, si aspetta "Ricomincia"
    this.dannoGigante = 0;           // quanto danno ha fatto alle mura il lupo gigante di adesso (non può superare CONFIG.lupoGigante.limiteDanno)
    this.riparazioneAperta = false;  // il cerchio verde per riparare le mura con la legna c'è (resta finché le mura non sono riparate)
    this.attesaAllarme = 0;          // secondi prima che l'avviso "Le mura stanno cedendo!" possa ricomparire
    // Per le prove: ?gigante fa arrivare subito il lupo gigante, ?mura=N mette le mura a N% della vita (0 = cadono)
    this.provaGigante = indirizzo.has('gigante');
    if (this.provaGigante) {
      this.prossimoGigante = 3;
      togliDallIndirizzo('gigante');
    }
    // Per le prove: ?lupi=N tiene sempre N lupi normali in giro (al massimo 12): appena uno muore ne arriva un altro
    this.provaLupi = indirizzo.has('lupi') ? THREE.MathUtils.clamp(Math.floor(Number(indirizzo.get('lupi'))) || 0, 0, LUPI_NORMALI) : 0;
    if (indirizzo.has('lupi')) togliDallIndirizzo('lupi');
    this.attaccoCooldown = 0;
    this.colpoInArrivo = null; // il colpo d'ascia del boscaiolo arriva sul lupo quando la lama cala
    this.carneCadute = [];

    // Quanti livelli di ogni catena sono stati comprati (mura, torretta, riparazione, aiutante, ..., il pavimento)
    this.livelli = {};
    for (const [nome, catena] of Object.entries(CONFIG.miglioramenti)) {
      if (Array.isArray(catena)) this.livelli[nome] = s.miglioramenti[nome]?.comprati ?? 0;
    }
    // Cerchi dei miglioramenti: le file (DIFESA e i due cerchi ECONOMIA), che mostrano solo il loro prossimo
    // acquisto nel posto giusto per lui (accanto a quello che compra), e il pavimento. Sopra c'è solo il nome
    // dell'acquisto (niente titolo della fila)
    this.cerchi = {};
    const posto = (catena, indice) => {
      const p = MAPPA.miglioramenti[catena];
      return Array.isArray(p) ? p[indice] : p;
    };
    for (const [fila, passi] of Object.entries(CONFIG.file)) {
      const livelli = passi.map(([catena, indice]) => ({ ...CONFIG.miglioramenti[catena][indice], catena, indice }));
      const posti = passi.map(([catena, indice]) => posto(catena, indice));
      this.cerchi[fila] = new CerchioMiglioramento(this.radice, posti, livelli, this.prossimoPasso(fila), s.file[fila]?.pagato ?? 0);
    }
    for (const nome of Object.keys(PAVIMENTI)) {
      this.cerchi[nome] = new CerchioMiglioramento(this.radice, MAPPA.miglioramenti[nome], CONFIG.miglioramenti[nome], this.livelli[nome], s.miglioramenti[nome].pagato, 'PAVIMENTO', 2);
    }
    this.torrette = new Torrette(this.radice, this.effetti, MAPPA.torri, this.mura);
    this.pavimento = new Pavimento(this.radice, this.effetti);
    this.cacciatori = []; // il primo esce dal cancello di sinistra, il secondo da quello di destra
    this.venditori = [];
    this.attesaScintille = 0;
    this.regia = null; // la telecamera che va a vedere un miglioramento appena comprato (null = segue il boscaiolo)
    // Il banco del cacciatore compare quando si comprano le mura di pietra; nei salvataggi con le mura di pietra
    // o il cacciatore già comprati c'è subito
    this.banco = new BancoCacciatore(this.radice, MAPPA.bancoCacciatore, this.effetti);
    this.bancoAperto = this.livelli.mura >= 1 || this.livelli.cacciatore >= 1;
    if (this.bancoAperto) this.banco.mostra(false);
    this.ripristinaMiglioramenti();
    this.aggiornaVisibilita(true);
    if (indirizzo.has('mura')) {
      this.mura.hp = this.mura.maxHp * THREE.MathUtils.clamp(Number(indirizzo.get('mura')) / 100, 0, 1);
      togliDallIndirizzo('mura');
    }
    this.tutorial = new Tutorial(this.radice, schermate, s.tutorial);
    // Durante il tutorial si può comprare solo il primo acquisto della fila DIFESA (le mura di pietra): gli altri
    // cerchi sono spenti (grigi); il cerchio DIFESA si accende solo al terzo passaggio, vedi aggiorna
    for (const [nome, cerchio] of Object.entries(this.cerchi)) cerchio.spegni(!this.tutorial.finito && (nome !== 'difesa' || this.tutorial.passo < 2));
    this.festaDopoLaRegia = false; // finito il tutorial, quando la telecamera torna sul boscaiolo arriva la schermata di festa
    this.inFesta = false;          // la schermata di festa è aperta: il gioco aspetta il pulsante "Gioca"
    // Inizio più veloce: finché non ci sono le mura di pietra i clienti sono di più e comprano più in fretta
    this.clienti.spinta = this.livelli.mura === 0 ? 1 : 0;

    document.addEventListener('keydown', (event) => {
      if (event.code === 'Space' || event.key === 'e' || event.key === 'E') this.attaccaLupi(true);
    });

    // Salva anche quando la pagina viene chiusa o messa in secondo piano
    window.addEventListener('pagehide', () => this.salvaOra());
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.salvaOra();
        return;
      }
      // Si torna nella base dopo un po' con la pagina rimasta aperta (es. sul telefono, cambiando app):
      // si ricarica, così si calcolano i guadagni di quando si era via, come riaprendo il gioco
      const via = (Date.now() - this.stato.orologio) / 1000;
      if (this.attiva && this.tutorial.finito && via >= CONFIG.offline.minimoMinuti * 60) window.location.reload();
    });
  }

  // Per le prove (?tuttocomprato): tutti i miglioramenti comprati tranne il boscaiolo secondario (il suo cerchio
  // compare subito), le monete già messe nei cerchi azzerate e 5000 monete in tasca. Il tutorial risulta finito.
  // Poi ?tuttocomprato sparisce dall'indirizzo, così ricaricando la pagina la partita va avanti normalmente.
  compraTuttoPerProva() {
    const s = this.stato;
    for (const [nome, catena] of Object.entries(CONFIG.miglioramenti)) {
      if (!Array.isArray(catena)) continue;
      s.miglioramenti[nome] = { comprati: nome === 'boscaioloSecondario' ? 0 : catena.length, pagato: 0 };
    }
    for (const fila of Object.keys(CONFIG.file)) s.file[fila] = { pagato: 0 };
    s.secondarioMancano = null;
    s.soldi = CONFIG.miglioramenti.boscaioloSecondario[0].prezzo;
    s.tutorial = 3;
    const indirizzo = new URL(window.location.href);
    indirizzo.searchParams.delete('tuttocomprato');
    window.history.replaceState(null, '', indirizzo);
    salva(s);
  }

  // ---------------- MENTRE SI ERA VIA ----------------

  // All'avvio: la base ha lavorato per il tempo in cui si era via (vedi offline.js). Le monete guadagnate non sono
  // ancora date: aspettano nel salvataggio ("bentornato") finché non si preme "Raccogli" (vedi apriBentornato).
  // Durante il tutorial e sotto i "minimoMinuti" non succede niente; oltre le "massimoOre" non si conta più.
  // minutiFinti: da ?offline=N nell'indirizzo, per provare senza aspettare (poi sparisce dall'indirizzo)
  lavoroMentreVia(minutiFinti) {
    const s = this.stato;
    const adesso = Date.now();
    if (minutiFinti !== null) {
      const indirizzo = new URL(window.location.href);
      indirizzo.searchParams.delete('offline');
      window.history.replaceState(null, '', indirizzo);
    }
    const via = secondiDiAssenza(s, adesso, minutiFinti);
    const massimo = CONFIG.offline.massimoOre * 3600;
    // l'ora salvata non torna mai indietro (se l'orologio del telefono va indietro non si guadagna due volte
    // lo stesso tempo), ma non resta nemmeno più avanti di "massimoOre" rispetto a adesso
    s.orologio = Math.min(Math.max(Number(s.orologio) || 0, adesso), adesso + massimo * 1000);
    if (s.tutorial < 3 || via < CONFIG.offline.minimoMinuti * 60) return;
    const secondi = Math.min(via, massimo);
    const fatto = lavoroOffline(s, secondi);
    if (fatto.legnaPortata > 0 || fatto.monete > 0) {
      // se c'erano già guadagni non raccolti (la pagina è stata chiusa prima di "Raccogli"), si sommano
      const prima = s.bentornato ?? { secondi: 0, legna: 0, monete: 0 };
      s.bentornato = { secondi: prima.secondi + secondi, legna: prima.legna + fatto.legnaPortata, monete: prima.monete + fatto.monete };
    }
    salva(s); // subito: ricaricando la pagina lo stesso tempo non deve contare di nuovo
  }

  // La schermata "Bentornato!": premendo "Raccogli" le monete guadagnate volano nel cerchio delle monete
  apriBentornato() {
    const guadagno = this.stato.bentornato;
    this.joystick.spegni();
    this.schermate.mostraBentornato(guadagno, () => {
      this.joystick.attivo = true;
      this.stato.bentornato = null;
      this.versaMonete(guadagno.monete);
      this.salvaOra();
    });
  }

  // Le monete cadono dall'alto nel cerchio delle monete, in qualche mucchietto
  versaMonete(totale) {
    if (totale <= 0) return;
    const pila = this.soldi;
    const mucchietti = Math.min(10, Math.max(1, Math.ceil(totale / 50)));
    let rimasti = totale;
    for (let i = 0; i < mucchietti; i++) {
      const parte = i === mucchietti - 1 ? rimasti : Math.floor(totale / mucchietti);
      rimasti -= parte;
      this.inVolo.soldi += parte;
      const partenza = pila.posizione.clone().add(new THREE.Vector3((Math.random() - 0.5) * 3, 5, (Math.random() - 0.5) * 2));
      this.effetti.lancia('soldi', partenza, pila, 0.2 + i * 0.12, () => {
        this.inVolo.soldi -= parte;
        pila.aggiungi(parte);
        suoni.suona('monete');
        this.effetti.scintille(pila.posizione.x, 0.4, pila.posizione.z, 0xffe066, 5);
      }, { durata: 0.6, altezza: 0.6 });
    }
    this.effetti.testo(pila.posizione.x, 2.4, pila.posizione.z, `+${totale}`, 'buono', 'moneta');
  }

  // Durante una corsa la base non si vede, ma il boscaiolo secondario continua i suoi giri
  lavoraDuranteLaCorsa(dt) {
    this.secondario?.avanza(dt, false);
  }

  // Il bottino della corsa vinta finisce nella catasta (la legna) e sul tavolo dello sportello CARNE (la carne),
  // e viene salvato subito.
  // La prima corsa del tutorial si completa solo vincendo, e porta a casa almeno "legnaPrimaCorsa" legna
  // (se ne serve, si aggiunge un bonus). Restituisce il bonus, da mostrare nella schermata di fine corsa.
  aggiungiBottino(legna, carne) {
    const bonus = this.tutorial.passo === 0 ? Math.max(0, CONFIG.tutorial.legnaPrimaCorsa - legna) : 0;
    this.catasta.aggiungi(legna + bonus);
    this.sportelli.carne.aggiungi(carne);
    this.ultimoBottino = { legna: legna + bonus, carne };
    this.completaTutorial('corsa');
    this.salvaOra();
    return bonus;
  }

  // Sta per partire una corsa: dice se è la prima (tutorial: niente orso né porte tutte rosse) e quale orso aspetta alla fine
  // (livello, oppure null se è ancora lontano: dopo che è stato sconfitto salta da 3 a 5 corse; ogni corsa iniziata ne conta una)
  preparaCorsa() {
    const opzioni = this.opzioniCorsa();
    if (!opzioni.primaCorsa && this.stato.orso.corseMancanti > 0) this.stato.orso.corseMancanti--;
    this.salvaOra();
    return opzioni;
  }

  // Come sarà la prossima corsa, senza cambiare niente (serve a prepararla in anticipo: vedi alVicinoAlCancello)
  opzioniCorsa() {
    const primaCorsa = this.tutorial.passo === 0;
    const o = this.stato.orso;
    return { primaCorsa, orso: primaCorsa || o.corseMancanti > 0 ? null : o.livello };
  }

  // Finita una corsa: se l'orso è stato sconfitto sale di livello e sparisce per un numero di corse a caso (3-5);
  // se ha vinto lui, resta lo stesso livello e alla corsa dopo c'è di nuovo
  registraOrso(risultato) {
    if (!risultato.vinto || !risultato.orsoSconfitto) return;
    const [da, a] = CONFIG.orso.corseSaltate;
    this.stato.orso.livello = risultato.livelloOrso + 1;
    this.stato.orso.corseMancanti = da + Math.floor(Math.random() * (a - da + 1));
    this.salvaOra();
  }

  // Si entra nella segheria (all'avvio o dopo una corsa)
  entra() {
    this.chiudiRegia();
    if (this.lupoGigante.vivo && !this.muraCadute) suoni.impostaPaura(true); // il lupo gigante c'è ancora: torna la musica inquietante
    this.attiva = true;
    this.giocatore.riposiziona();
    for (const cancello of Object.values(this.cancelli)) cancello.azzera();
    this.ambiente.reimpostaTelecamera();
    this.ambiente.segui(this.giocatore.posizione, 0);
    this.joystick.attivo = true;
    this.schermate.mostraSegheria(!this.haCamminato);
    this.schermate.aggiornaMura(this.mura.ratio);
    // Mostra cosa è arrivato dalla corsa
    if (this.ultimoBottino) {
      const { legna, carne } = this.ultimoBottino;
      if (legna > 0) this.effetti.testo(MAPPA.catasta.x, 2.6, MAPPA.catasta.z, `+${legna} legna`, 'buono');
      const tavolo = this.sportelli.carne.zona;
      if (carne > 0) this.effetti.testo(tavolo.x, 2, tavolo.z, `+${carne} carne`, 'buono');
      this.effetti.sbuffo(MAPPA.catasta.x, 1, MAPPA.catasta.z, 0xb07a45, 16, 3);
      this.ultimoBottino = null;
    }
    // Guadagni di quando si era via, da raccogliere (mai durante il tutorial)
    if (this.stato.bentornato && this.tutorial.finito) this.apriBentornato();
  }

  // Si esce dalla segheria (parte una corsa)
  esci() {
    this.vicinoAlCancello = false;
    this.tutorial.nascondi();
    suoni.impostaPaura(false); // durante la corsa c'è la musica della corsa
    this.attiva = false;
    this.joystick.spegni();
    this.stato.corseFatte += 1;
    this.salvaOra();
  }

  // ---------------- LUPI (restano sempre fuori dalle mura) ----------------

  // Tutti i lupi della base, nascosti finché non arrivano: LUPI_NORMALI lupi normali e un lupo gigante
  creaLupiBase() {
    const lupi = [];
    for (let i = 0; i < LUPI_NORMALI; i++) lupi.push(this.creaLupoBase(false));
    lupi.push(this.creaLupoBase(true));
    return lupi;
  }

  // Un lupo. gigante: grande il doppio, con il pelo più scuro, gli occhi gialli e la barra della vita grande
  creaLupoBase(gigante) {
    const G = CONFIG.lupoGigante;
    const modello = creaLupo({ gigante });
    const { gruppo } = modello;
    gruppo.scale.setScalar(SCALA_LUPO * (gigante ? G.grandezza : 1));
    gruppo.rotation.y = Math.PI;
    gruppo.visible = false;
    // ogni lupo ha i suoi materiali (copie di quelli del modello), così può lampeggiare da solo quando viene colpito
    const materiali = new Map();
    gruppo.traverse((parte) => {
      if (!parte.isMesh) return;
      if (!materiali.has(parte.material)) materiali.set(parte.material, parte.material.clone());
      parte.material = materiali.get(parte.material);
    });
    const barra = gigante ? creaBarraGigante() : creaBarra(0.8, 5, 1.45);
    gruppo.add(barra.gruppo);
    this.radice.add(gruppo);
    const vita = gigante ? G.vita : CONFIG.segheria.hpLupo;
    return {
      gigante, x: 0, z: 0, vita, hp: vita, vivo: false, obiettivo: null,
      dannoAscia: gigante ? G.dannoAscia : CONFIG.segheria.dannoAscia, // punti tolti da un colpo d'ascia (boscaiolo o cacciatore)
      ingombro: gigante ? 0.8 : 0,            // quanto è più grosso di un lupo normale (per colpirlo e per stare fuori dalle mura)
      gruppo, modello, barra, flash: 0, lampo: 0, materiali: [...materiali.values()],
      angolo: Math.PI, // verso dove guarda (si gira dolcemente verso dove corre)
      generazione: 0, // cresce ogni volta che il lupo ricompare (così le frecce non inseguono il lupo "nuovo")
    };
  }

  // Un lupo esce dalla foresta nel punto (x, z) e va verso le mura.
  // fronte: da quale fronte arriva (per contarli); debole: lupo debole (meno vita); velocita: parte della velocità piena
  sveglia(lupo, x, z, { fronte = null, debole = false, velocita = 1 } = {}) {
    lupo.fronte = fronte;
    lupo.debole = debole;
    lupo.velocita = velocita;
    lupo.vita = lupo.gigante ? CONFIG.lupoGigante.vita : debole ? CONFIG.segheria.lupiDeboli.vita : CONFIG.segheria.hpLupo;
    lupo.vivo = true;
    lupo.generazione += 1;
    lupo.hp = lupo.vita;
    lupo.flash = 0;
    lupo.lampo = 0;
    lupo.x = x;
    lupo.z = z;
    lupo.obiettivo = this.bersaglioVicino(lupo);
    lupo.angolo = Math.atan2(-(lupo.obiettivo.x - x), -(lupo.obiettivo.z - z)); // esce già girato verso le mura
    lupo.gruppo.visible = true;
    lupo.barra.gruppo.visible = true;
    lupo.gruppo.position.set(x, 0, z);
    lupo.barra.aggiorna(lupo);
  }

  // Un punto a caso della foresta da cui escono i lupi: lato -1 = a sinistra della base, 1 = a destra, 0 = ovunque
  partenzaLupi(lato) {
    const partenze = PARTENZE_LUPI.filter((p) => lato === 0 || Math.sign(p.x) === lato);
    return partenze[Math.floor(Math.random() * partenze.length)];
  }

  // Arriva un gruppo di "quanti" lupi dallo stesso punto della foresta, un po' sparsi.
  // fronte: il nome del fronte (deboli, sinistra o destra); opzioni: come in sveglia
  arrivaGruppo(quanti, fronte, opzioni = {}) {
    const partenza = this.partenzaLupi(this.fronti[fronte].lato);
    const lupi = this.lupiBase.filter((lupo) => !lupo.vivo && !lupo.gigante).slice(0, quanti);
    lupi.forEach((lupo, i) => {
      const angolo = (i / lupi.length) * Math.PI * 2 + Math.random();
      const distanza = lupi.length > 1 ? 1.1 : 0;
      this.sveglia(lupo, partenza.x + Math.cos(angolo) * distanza, partenza.z + Math.sin(angolo) * distanza, { fronte, ...opzioni });
    });
    if (lupi.length > 0 && !this.bancoAperto) this.apriBanco();
  }

  // Quanti lupi vivi sono arrivati da questo fronte
  lupiDelFronte(nome) {
    return this.lupiBase.filter((lupo) => lupo.vivo && lupo.fronte === nome).length;
  }

  // Quali fronti sono aperti: i lupi deboli dopo le mura di pietra, ogni lato dopo la sua torretta
  frontiAperti() {
    const torri = this.livelli.torretta;
    return { deboli: this.livelli.mura >= 1, sinistra: torri >= 1, destra: torri >= 2 };
  }

  // Per le prove (?lupi=N): se i lupi normali vivi sono meno di N ne arrivano altri, da punti a caso della foresta
  tieniLupiDiProva() {
    let vivi = this.lupiBase.filter((lupo) => lupo.vivo && !lupo.gigante).length;
    for (const lupo of this.lupiBase) {
      if (vivi >= this.provaLupi) break;
      if (lupo.vivo || lupo.gigante) continue;
      const partenza = this.partenzaLupi(0);
      this.sveglia(lupo, partenza.x + (Math.random() - 0.5) * 2, partenza.z + (Math.random() - 0.5) * 2);
      vivi += 1;
    }
  }

  // Un lupo debole e lento, da un punto qualsiasi della foresta (se non ce ne sono già abbastanza).
  // Restituisce fra quanti secondi arriva il prossimo.
  arrivaDebole() {
    const D = CONFIG.segheria.lupiDeboli;
    if (this.lupiDelFronte('deboli') < D.insieme) this.arrivaGruppo(1, 'deboli', { debole: true, velocita: D.velocita });
    return D.intervalloMinimo + Math.random() * (D.intervalloMassimo - D.intervalloMinimo);
  }

  // Un gruppo di lupi normali da un lato. Più il lato è aperto da tanto, più i lupi sono numerosi e veloci
  // (nei primi "calmaIniziale" secondi sono più lenti e più radi). Restituisce fra quanti secondi arriva il prossimo gruppo.
  arrivaDalLato(nome, fronte) {
    const cfg = CONFIG.segheria;
    const calma = THREE.MathUtils.clamp(fronte.tempo / cfg.calmaIniziale, 0, 1);
    const massimi = Math.min(cfg.lupiInsiemeMassimo, cfg.lupiInsiemeInizio + Math.floor(fronte.tempo / cfg.unLupoInPiuOgni));
    const posto = massimi - this.lupiDelFronte(nome);
    if (posto > 0) {
      this.arrivaGruppo(Math.min(this.grandezzaGruppo(fronte.tempo), posto), nome, { velocita: THREE.MathUtils.lerp(cfg.velocitaLupiInizio, 1, calma) });
    }
    const intervallo = cfg.intervalloLupiMinimo + Math.random() * (cfg.intervalloLupiMassimo - cfg.intervalloLupiMinimo);
    return intervallo * THREE.MathUtils.lerp(cfg.intervalloLupiInizio, 1, calma);
  }

  // Quanti lupi nel prossimo gruppo: all'inizio 1 o 2, poi pian piano 3 o 4 (tempo: da quanto è aperto il lato)
  grandezzaGruppo(tempo) {
    const cfg = CONFIG.segheria;
    const crescita = THREE.MathUtils.clamp(tempo / cfg.gruppiCresconoIn, 0, 1);
    const media = THREE.MathUtils.lerp(cfg.lupiPerGruppoInizio, cfg.lupiPerGruppoFine, crescita);
    return THREE.MathUtils.clamp(Math.round(media + Math.random() - 0.5), 1, 4);
  }

  // Arriva il lupo gigante, con la scritta sullo schermo
  // (arriva da un lato già aperto: solo da sinistra finché non c'è la torretta di destra)
  // La telecamera va dolcemente su di lui (se non si vede già bene) mentre il boscaiolo resta fermo; lui si ferma e ulula
  // con la testa al cielo; quando la telecamera è arrivata compare la scritta e si sente l'ululato; poi la telecamera
  // torna sul boscaiolo e il lupo si muove verso le mura.
  arrivaGigante() {
    const G = CONFIG.lupoGigante;
    const gigante = this.lupoGigante;
    const partenza = this.partenzaLupi(this.frontiAperti().destra ? 0 : -1);
    this.sveglia(gigante, partenza.x, partenza.z, { fronte: 'gigante' });
    this.effetti.sbuffo(partenza.x, 0.5, partenza.z, 0xf4f8ff, 20, 4);
    const punto = new THREE.Vector3(partenza.x, 0, partenza.z);
    const conTelecamera = !this.visibile(punto); // se si vede già bene la telecamera non si muove
    const viaggio = conTelecamera ? CONFIG.regia.viaggio : 0;
    if (conTelecamera) {
      this.regia = { tappe: [{ punto, azione: () => {}, zoom: G.zoomTelecamera, sempre: false, sosta: G.sostaTelecamera, punti: [punto], senzaTesto: true }], indice: 0, tempo: 0, nome: 'Lupo gigante' };
    }
    this.dannoGigante = 0;
    gigante.prossimoMorso = 0.4;
    suoni.impostaPaura(true); // la musica normale sfuma e parte quella inquietante
    gigante.fermoPer = viaggio + G.ululato; // fermo (a ululare) finché la telecamera non ha finito di guardarlo
    gigante.modello.anim.ululato = 0;
    this.attesaAvvisoGigante = viaggio;
  }

  // Un palo a caso tra i più vicini al lupo: il lupo ci va davanti, dal lato esterno delle mura
  bersaglioVicino(lupo) {
    const vicini = [...this.mura.pali]
      .sort((a, b) => Math.hypot(a.position.x - lupo.x, a.position.z - lupo.z) - Math.hypot(b.position.x - lupo.x, b.position.z - lupo.z))
      .slice(0, 10);
    const palo = vicini[Math.floor(Math.random() * vicini.length)];
    return this.fuoriDalleMura(palo.position.x, palo.position.z, 0.8 + lupo.ingombro);
  }

  // Se il punto è dentro le mura (o ci è troppo vicino), lo sposta fuori dal lato più vicino
  fuoriDalleMura(x, z, margine) {
    const M = MAPPA.mura;
    const sx = M.sinistra - margine;
    const dx = M.destra + margine;
    const fo = M.fondo - margine;
    const fr = M.fronte + margine;
    if (x <= sx || x >= dx || z <= fo || z >= fr) return { x, z };
    const uscite = [
      { d: x - sx, x: sx, z },
      { d: dx - x, x: dx, z },
      { d: z - fo, x, z: fo },
      { d: fr - z, x, z: fr },
    ];
    return uscite.reduce((a, b) => (b.d < a.d ? b : a));
  }

  aggiornaLupi(dt) {
    const cfg = CONFIG.segheria;
    const G = CONFIG.lupoGigante;
    // Nessun lupo finché non ci sono le mura di pietra (e mentre è aperta la schermata di fine tutorial).
    // Poi pochi lupi deboli; ogni torretta apre un lato da cui arrivano lupi normali, sempre di più:
    // così la difficoltà cresce insieme alle difese.
    const aperti = this.inFesta ? {} : this.frontiAperti();
    for (const [nome, fronte] of Object.entries(this.fronti)) {
      if (!aperti[nome]) continue;
      fronte.tempo += dt;
      fronte.prossimo -= dt;
      if (fronte.prossimo <= 0) fronte.prossimo = nome === 'deboli' ? this.arrivaDebole() : this.arrivaDalLato(nome, fronte);
    }
    // il lupo gigante, ogni 2-3 minuti dopo la prima torretta (uno solo alla volta: se c'è ancora, il prossimo aspetta)
    if (this.provaLupi > 0 && !this.inFesta) this.tieniLupiDiProva();
    if (aperti.sinistra || this.provaGigante) this.prossimoGigante -= dt;
    if (this.prossimoGigante <= 0) {
      if (this.lupoGigante.vivo) {
        this.prossimoGigante = G.ogniMinimo + Math.random() * (G.ogniMassimo - G.ogniMinimo);
      } else if (!this.regia && !this.inFesta) {
        // se la telecamera sta mostrando un acquisto, il lupo gigante aspetta che abbia finito
        this.arrivaGigante();
        this.prossimoGigante = G.ogniMinimo + Math.random() * (G.ogniMassimo - G.ogniMinimo);
      }
    }
    if (this.attesaAvvisoGigante !== null) {
      this.attesaAvvisoGigante -= dt;
      if (this.attesaAvvisoGigante <= 0) {
        this.attesaAvvisoGigante = null;
        this.schermate.mostraAvviso('Arriva il lupo gigante!', G.tempoAvviso);
        suoni.suona('ululato');
      }
    }

    const pos = this.giocatore.posizione;
    for (const lupo of this.lupiBase) {
      if (!lupo.vivo) continue;
      lupo.flash = Math.max(0, lupo.flash - dt * 2.5);
      // appena colpito lampeggia di bianco: si accende e si spegne tre volte
      lupo.lampo = Math.max(0, lupo.lampo - dt);
      const acceso = lupo.lampo > 0 && Math.floor(lupo.lampo / 0.07) % 2 === 0;
      for (const materiale of lupo.materiali) materiale.emissive?.setScalar(acceso ? 0.85 : 0); // gli occhi del gigante (che brillano da soli) non lampeggiano
      const distanza = Math.hypot(pos.x - lupo.x, pos.z - lupo.z);
      const target = lupo.obiettivo;
      const versoX = (target.x - lupo.x) * 0.28;
      const versoZ = (target.z - lupo.z) * 0.28;
      const fermo = (lupo.fermoPer ?? 0) > 0; // il gigante appena arrivato si ferma a ululare
      if (fermo) lupo.fermoPer -= dt;
      const velocita = fermo ? 0 : cfg.velocitaLupo * lupo.velocita * (lupo.gigante ? G.velocita : 1);
      lupo.x += versoX * dt * velocita;
      lupo.z += versoZ * dt * velocita;
      // i lupi non passano le mura (nemmeno dai cancelli)
      const fuori = this.fuoriDalleMura(lupo.x, lupo.z, 0.6 + lupo.ingombro);
      lupo.x = fuori.x;
      lupo.z = fuori.z;
      const daMura = Math.hypot(lupo.x - target.x, lupo.z - target.z);
      const attacca = !fermo && daMura < 1.7 + lupo.ingombro;
      this.animaLupo(lupo, dt, Math.hypot(versoX, versoZ) * velocita, attacca, fermo);
      if (daMura < 1.1 + lupo.ingombro) lupo.obiettivo = this.bersaglioVicino(lupo); // passa a un palo lì vicino

      if (attacca) {
        // i lupi normali tolgono vita alle mura in continuazione; il gigante a ogni morso (vedi sotto)
        if (!lupo.gigante) this.mura.danneggia(cfg.dannoMura * dt);
        // ogni tanto un morso si vede: il palo trema, schegge e neve (il gigante morde più forte e più spesso)
        lupo.prossimoMorso = (lupo.prossimoMorso ?? Math.random()) - dt;
        if (lupo.prossimoMorso <= 0) {
          if (lupo.gigante) {
            const [minimo, massimo] = G.intervalloMorso;
            lupo.prossimoMorso = minimo + Math.random() * (massimo - minimo);
            this.mordeIlGigante();
          } else {
            lupo.prossimoMorso = 1.1 + Math.random() * 0.6;
          }
          this.mura.colpisci(lupo.x, lupo.z, lupo.gigante ? 1.6 : 1);
          suoni.suona(lupo.gigante ? 'morsoGigante' : 'morso');
        }
      }

      if (distanza < 1.4 + lupo.ingombro) {
        pos.x += (pos.x - lupo.x) * dt * 0.18;
        pos.z += (pos.z - lupo.z) * dt * 0.18;
      }

      if (distanza < 1.8 + lupo.ingombro && this.attaccoCooldown <= 0) this.attaccaLupi(true);
    }
  }

  // Come si muove un lupo: corre a balzi girato verso dove va (con la polvere di neve quando atterra);
  // quando è alle mura si gira verso di loro e le morde e graffia. Salta un po' quando viene colpito.
  animaLupo(lupo, dt, velocita, attacca, fermo = false) {
    let angoloVoluto = null;
    if (attacca) {
      // si gira verso il punto delle mura più vicino a lui
      const M = MAPPA.mura;
      const x = THREE.MathUtils.clamp(lupo.x, M.sinistra, M.destra);
      const z = THREE.MathUtils.clamp(lupo.z, M.fondo, M.fronte);
      angoloVoluto = Math.atan2(-(x - lupo.x), -(z - lupo.z));
      animaMorso(lupo.modello, dt);
    } else {
      let atterra;
      if (lupo.gigante && fermo) {
        animaUlulato(lupo.modello, dt); // testa al cielo, bocca aperta
        atterra = false;
      } else if (lupo.gigante) {
        atterra = animaPassoPesante(lupo.modello, dt, velocita); // cammina pesante e minaccioso
        if (atterra) suoni.suona('passoGigante');
      } else {
        atterra = animaGaloppo(lupo.modello, dt, 8 + velocita * 1.5, Math.min(1, velocita / 1.2));
      }
      if (atterra) {
        // quando atterra: un po' di neve e un'impronta di zampa, una a destra e una a sinistra
        this.effetti.polvere(lupo.x, lupo.z, lupo.gigante ? 5 : 3, lupo.gigante ? 2.6 : 1.2);
        const scala = lupo.gruppo.scale.x;
        lupo.passi = (lupo.passi ?? 0) + 1;
        const fianco = (lupo.passi % 2 ? 0.12 : -0.12) * scala;
        this.effetti.orma(lupo.x + Math.cos(lupo.angolo) * fianco, lupo.z - Math.sin(lupo.angolo) * fianco, lupo.angolo, scala);
      }
      if (velocita > 0.05) angoloVoluto = Math.atan2(-(lupo.obiettivo.x - lupo.x), -(lupo.obiettivo.z - lupo.z));
    }
    if (angoloVoluto !== null) {
      const differenza = Math.atan2(Math.sin(angoloVoluto - lupo.angolo), Math.cos(angoloVoluto - lupo.angolo));
      lupo.angolo += differenza * Math.min(1, dt * 6);
    }
    lupo.gruppo.position.set(lupo.x, lupo.flash * 0.5, lupo.z);
    lupo.gruppo.rotation.y = lupo.angolo;
    lupo.barra.gruppo.rotation.y = Math.PI - lupo.angolo; // la barra resta sempre dritta verso la telecamera
  }

  attaccaLupi(auto = false) {
    if (this.attaccoCooldown > 0 || !this.attiva) return;
    const pos = this.giocatore.posizione;
    const distanza = (lupo) => Math.hypot(pos.x - lupo.x, pos.z - lupo.z) - lupo.ingombro;
    const obiettivo = this.lupiBase
      .filter((lupo) => lupo.vivo)
      .sort((a, b) => distanza(a) - distanza(b))
      .find((lupo) => distanza(lupo) < CONFIG.segheria.raggioAttaccoLupo + (auto ? 0.4 : 0));

    if (!obiettivo) return;
    this.giocatore.colpisciAscia(obiettivo.x, obiettivo.z);
    this.attaccoCooldown = CONFIG.segheria.attaccoCooldown;
    // il boscaiolo prima carica l'ascia: il lupo viene colpito quando la lama cala
    this.colpoInArrivo = { lupo: obiettivo, generazione: obiettivo.generazione, tempo: COLPO.durata * COLPO.impatto };
  }

  // Conta il tempo del colpo d'ascia in arrivo; se il lupo è ancora lì (vivo e non già ricomparso) viene colpito
  aggiornaColpo(dt) {
    if (!this.colpoInArrivo) return;
    this.colpoInArrivo.tempo -= dt;
    if (this.colpoInArrivo.tempo > 0) return;
    const { lupo, generazione } = this.colpoInArrivo;
    if (lupo.vivo && lupo.generazione === generazione) this.colpisciLupo(lupo, lupo.dannoAscia, 'ascia');
    this.colpoInArrivo = null;
  }

  // Un colpo a un lupo (ascia del boscaiolo, freccia di un arciere o ascia del cacciatore):
  // lampeggia e perde "danno" tacche di vita; a zero muore e lascia la carne a terra.
  // arma: 'ascia' o 'freccia' (ognuna con il suo suono quando colpisce)
  colpisciLupo(lupo, danno = 1, arma = 'freccia') {
    if (!lupo.vivo) return;
    lupo.hp -= danno;
    if (arma === 'ascia') suoni.suona('ascia');
    lupo.flash = lupo.gigante ? 0.2 : 0.5; // il gigante è pesante: salta poco
    lupo.lampo = 0.42;
    lupo.gruppo.position.x += 0.14;
    lupo.gruppo.position.z += 0.1;
    const altezza = lupo.gigante ? 2.8 : 1.6;
    this.effetti.testo(lupo.x, altezza, lupo.z, `-${danno}`, 'cattivo');
    // scintille del colpo e qualche ciuffo di pelo
    const punto = lupo.gigante ? 1.2 : 0.6;
    this.effetti.scintille(lupo.x, punto, lupo.z, 0xfff3b0, 5, 2);
    this.effetti.sbuffo(lupo.x, punto, lupo.z, lupo.gigante ? 0x2b3245 : 0x4d5b7c, 3, 2);
    lupo.barra.aggiorna(lupo);

    if (lupo.hp <= 0) {
      if (lupo.gigante) suoni.impostaPaura(false); // sfuma la musica inquietante e torna quella normale
      suoni.suona('lupoMuore');
      lupo.vivo = false;
      lupo.gruppo.visible = false;
      lupo.barra.gruppo.visible = false;
      const cfg = CONFIG.segheria;
      const carne = lupo.gigante
        ? CONFIG.lupoGigante.carne
        : cfg.carneLupoMinima + Math.floor(Math.random() * (cfg.carneLupoMassima - cfg.carneLupoMinima + 1));
      this.lasciaCarne(lupo.x, lupo.z, carne, lupo.gigante ? CONFIG.lupoGigante.pezziCarne : 1);
      this.effetti.testo(lupo.x, altezza + 0.2, lupo.z, `+${carne} carne`, 'buono');
    }
  }

  // La carne di un lupo morto resta a terra: "unita" unità divise in "pezzi" pezzi sparsi intorno (sempre fuori dalle mura)
  lasciaCarne(x, z, unita, pezzi = 1) {
    for (let i = 0; i < pezzi; i++) {
      const quantita = Math.floor(unita / pezzi) + (i < unita % pezzi ? 1 : 0);
      const angolo = (i / pezzi) * Math.PI * 2;
      const distanza = pezzi > 1 ? 0.6 + (i % 2) * 0.5 : 0;
      const punto = this.fuoriDalleMura(x + Math.cos(angolo) * distanza, z + Math.sin(angolo) * distanza, 0.6);
      const mesh = creaCarne();
      mesh.position.set(punto.x, 0.35, punto.z);
      mesh.rotation.y = angolo;
      mesh.scale.setScalar(0.8);
      this.radice.add(mesh);
      this.carneCadute.push({ mesh, x: punto.x, z: punto.z, preso: false, quantita });
    }
  }

  // ---------------- MIGLIORAMENTI ----------------

  // Il prossimo passo da comprare di una fila: il primo il cui livello non è ancora stato comprato
  // (i passi già fatti, ad esempio nei salvataggi vecchi, si saltano). Fila finita = numero dei passi.
  prossimoPasso(fila) {
    const passi = CONFIG.file[fila];
    const i = passi.findIndex(([catena, indice]) => this.livelli[catena] <= indice);
    return i < 0 ? passi.length : i;
  }

  // Quali cerchi si vedono. I due cerchi ECONOMIA compaiono insieme quando c'è il banco del cacciatore
  // (con le mura di pietra) e vanno avanti a coppie: un cerchio al passo N si vede solo quando anche
  // l'altro ha comprato i suoi passi prima di N (dopo il secondo passo: quando sono stati assunti tutti e quattro).
  // Il pavimento compare quando sono stati assunti tutti i lavoratori base.
  // subito: all'avvio, senza l'animazione del cerchio che compare
  aggiornaVisibilita(subito) {
    for (const fila of CERCHI_ECONOMIA) {
      const passo = Math.min(this.cerchi[fila].comprati, PASSI_INSIEME);
      const coppiaPronta = CERCHI_ECONOMIA.every((altra) => this.cerchi[altra].comprati >= passo);
      this.cerchi[fila].nascondi(!this.bancoAperto || !coppiaPronta, subito);
    }
    // il boscaiolo secondario (anche lui della fila ECONOMIA) è l'ultimo acquisto: compare quando tutte le altre
    // file sono finite (potenziamenti compresi) ed è stato comprato il pavimento
    const altreFileFinite = Object.keys(CONFIG.file)
      .filter((fila) => fila !== 'secondario')
      .every((fila) => this.cerchi[fila].comprati >= CONFIG.file[fila].length);
    const pavimentoComprato = Object.keys(PAVIMENTI).every((nome) => this.livelli[nome] > 0);
    this.cerchi.secondario.nascondi(!altreFileFinite || !pavimentoComprato, subito);
    const tuttiAssunti = LAVORATORI_BASE.every((nome) => this.livelli[nome] > 0);
    for (const nome of Object.keys(PAVIMENTI)) this.cerchi[nome].nascondi(!tuttiAssunti || this.livelli[nome] > 0, subito);
  }

  // Compare il banco del cacciatore con la sua costruzione (se è fuori dallo schermo la telecamera va a
  // vederlo, come per i miglioramenti). Di solito succede con le mura di pietra (vedi tappeDelMiglioramento);
  // se nel frattempo arrivano i lupi e il banco non c'è ancora, compare in quel momento.
  apriBanco() {
    this.bancoAperto = true;
    const punto = MAPPA.bancoCacciatore;
    const azione = () => this.banco.mostra(true);
    if (this.regia || this.inFesta || this.visibile(punto)) {
      azione();
      return;
    }
    const tappa = { punto: punto.clone(), azione, zoom: 0.8, sempre: false, sosta: CONFIG.regia.sosta, punti: [punto] };
    this.regia = { tappe: [tappa], indice: 0, tempo: 0, nome: 'Banco del cacciatore' };
  }

  // Il boscaiolo sta sul cerchio: le monete volano dentro un po' alla volta
  gestisceMiglioramenti(pos, dt) {
    for (const [nome, cerchio] of Object.entries(this.cerchi)) {
      cerchio.aggiorna(dt);
      if (this.regia || !cerchio.contiene(pos)) continue;
      const rata = cerchio.prossimaRata(this.stato.soldi, dt);
      if (rata <= 0) continue;
      this.stato.soldi -= rata;
      // le monete che entrano nel cerchio
      suoni.suona('pagamento');
      const partenza = this.giocatore.cimaSchiena(new THREE.Vector3(), 'monete'); // le monete partono dalla pila sulla schiena
      this.effetti.lancia('soldi', partenza, cerchio, 0, () => {
        if (cerchio.riceviRata(rata)) this.completaMiglioramento(nome);
      }, { durata: 0.35, altezza: 1.2, scala: 0.8, sbuffo: false });
    }
  }

  // Un livello è pagato tutto: il miglioramento compare e il cerchio passa al prossimo acquisto
  // Se compare lontano o fuori dallo schermo, la telecamera va a vederlo (vedi aggiornaRegia).
  // nomeCerchio: 'difesa', 'economia' o un pavimento
  completaMiglioramento(nomeCerchio) {
    const cerchio = this.cerchi[nomeCerchio];
    const livello = cerchio.livello;
    const nome = livello.catena ?? nomeCerchio; // la catena di quel livello (mura, torretta...) o il pavimento
    this.livelli[nome] += 1;
    cerchio.passaAlSuccessivo(nomeCerchio in CONFIG.file ? this.prossimoPasso(nomeCerchio) : undefined);
    const { x, z } = cerchio.posizione;
    this.effetti.testo(x, 2.2, z, `${livello.nome}!`, 'buono');
    this.effetti.sbuffo(x, 0.4, z, 0x9be37a, 24, 3.5);
    suoni.suona('acquisto');
    const tappe = this.tappeDelMiglioramento(nome, livello);
    const daMostrare = tappe.filter((tappa) => tappa.sempre || !tappa.punti.every((punto) => this.visibile(punto)));
    for (const tappa of tappe) if (!daMostrare.includes(tappa)) tappa.azione();
    if (daMostrare.length > 0) this.regia = { tappe: daMostrare, indice: 0, tempo: 0, nome: livello.nome };
    this.completaTutorial('miglioramento');
    this.salvaOra();
  }

  // ---------------- TUTORIAL ----------------

  // Il giocatore ha fatto qualcosa: se era il passaggio del tutorial, si va avanti.
  // Finito il tutorial (comprate le mura di pietra), quando la telecamera torna sul boscaiolo arriva la festa.
  completaTutorial(evento) {
    if (!this.tutorial.completa(evento)) return;
    this.festaDopoLaRegia = true;
    this.salvaOra();
  }

  // Fine del tutorial: grande schermata di festa. Il gioco aspetta il pulsante "Gioca";
  // poi tutti i cerchi si riaccendono con un saltello e le scintille.
  apriFesta() {
    this.festaDopoLaRegia = false;
    this.inFesta = true;
    this.joystick.spegni();
    this.schermate.mostraFesta(() => {
      this.inFesta = false;
      this.joystick.attivo = true;
      for (const cerchio of Object.values(this.cerchi)) {
        if (!cerchio.spento) continue;
        cerchio.spegni(false);
        if (cerchio.gruppo.visible) this.effetti.scintille(cerchio.posizione.x, 0.3, cerchio.posizione.z, 0xffe066, 10, 2);
      }
    });
  }

  // Dove punta la freccia del tutorial nel passaggio di adesso
  bersaglioTutorial() {
    const passo = this.tutorial.passo;
    if (passo === 0) return this.cancelli.corsa.centroZona;
    // senza legna sulla schiena, prima la freccia indica la catasta da cui prenderla
    if (passo === 1) return this.giocatore.ha('legna') ? this.sportelli.legna.zona : this.catasta.posizione;
    const cerchi = Object.values(this.cerchi).filter((cerchio) => cerchio.attivo);
    if (cerchi.length === 0) return this.giocatore.posizione;
    return cerchi.reduce((a, b) => (b.livello.prezzo < a.livello.prezzo ? b : a)).posizione; // il più economico
  }

  // Le "tappe" di un miglioramento appena comprato: dove compare (punto), come inquadrarlo (zoom),
  // quanto guardarlo (sosta) e cosa far comparire lì (azione, con l'animazione della costruzione).
  // punti = cosa deve vedersi (di solito solo "punto"); se si vede già tutto, la telecamera non si muove.
  // sempre = la telecamera ci va anche se il punto si vede (le mura fanno il giro di tutta la base).
  // Quello che non si vede (riparazione, venditori e cacciatore più svelti) funziona subito, senza tappe.
  tappeDelMiglioramento(nome, livello) {
    const comprati = this.livelli[nome];
    const tappa = (punto, azione, { zoom = 0.8, sempre = false, sosta = CONFIG.regia.sosta, punti = [punto] } = {}) => (
      { punto: punto.clone(), azione, zoom, sempre, sosta, punti }
    );
    if (nome === 'mura') {
      const tappe = [tappa(new THREE.Vector3(0, 0, 0), () => this.mura.applicaLivello(comprati, true), { zoom: 1.5, sempre: true, sosta: 2.4 })];
      // con le mura di pietra compare anche il banco del cacciatore
      if (!this.bancoAperto) {
        this.bancoAperto = true;
        tappe.push(tappa(MAPPA.bancoCacciatore, () => this.banco.mostra(true)));
      }
      return tappe;
    }
    if (nome in PAVIMENTI) {
      // la telecamera si alza e guarda il pavimento nuovo che si allarga dal cerchio fino a coprire tutta la base
      const punto = this.cerchi[nome].posizione.clone();
      return [tappa(new THREE.Vector3(0, 0, 0), () => this.pavimento.posa(PAVIMENTI[nome], punto, true), { zoom: 1.5, sempre: true, sosta: 2.6 })];
    }
    if (nome === 'torretta') {
      this.torrette.imposta(comprati);
      const prima = CONFIG.miglioramenti.torretta[comprati - 2];
      const tappe = [];
      // le torri nuove spuntano dal basso...
      for (let i = prima?.torri ?? 0; i < livello.torri; i++) {
        tappe.push(tappa(this.torrette.torri[i].posizione, () => this.torrette.mostraTorre(i, true)));
      }
      // ...e con "Potenzia arcieri" tutte le torri costruite cambiano insieme (arcieri, archi, parte alta):
      // la telecamera le inquadra tutte (alzandosi e allontanandosi quanto serve perché entrino nello schermo)
      if ((prima?.aspetto ?? 0) !== livello.aspetto) {
        const indici = this.torrette.torri.map((_, i) => i).filter((i) => i < livello.torri);
        const torri = indici.map((i) => this.torrette.torri[i].posizione);
        const centro = torri.reduce((a, b) => a.clone().add(b)).multiplyScalar(1 / torri.length);
        tappe.push(tappa(centro, () => indici.forEach((i) => this.torrette.aggiornaAspetto(i, true)), {
          zoom: this.zoomPerVedere(torri, centro), punti: torri, sosta: 2.2,
        }));
      }
      return tappe;
    }
    if (nome === 'aiutante') {
      if (this.aiutante) return [];
      return [tappa(this.catasta.posizione.clone().add(new THREE.Vector3(0, 0, 1)), () => (this.aiutante = this.creaAiutante(true)))];
    }
    if (nome === 'cacciatore') {
      // "Cacciatore esperto" rende più svelti tutti e due
      if (this.cacciatori.length > 0) {
        for (const cacciatore of this.cacciatori) cacciatore.livello = livello;
        return [];
      }
      return [tappa(MAPPA.casaCacciatore, () => this.cacciatori.push(new Cacciatore(this, livello, 0)))];
    }
    if (nome === 'secondoCacciatore') {
      // il secondo cacciatore lavora allo stesso banco, con la bravura del primo
      return [tappa(MAPPA.casaCacciatore, () => this.cacciatori.push(new Cacciatore(this, this.livelloComprato('cacciatore'), 1)))];
    }
    if (nome === 'boscaioloSecondario') {
      // compare accanto alla catasta e parte subito per il suo primo giro
      if (this.secondario) return [];
      return [tappa(MAPPA.giroSecondario[0], () => (this.secondario = this.creaSecondario(durataGiro(), true)))];
    }
    if (nome === 'venditore') {
      this.clienti.rapidita = livello.rapidita;
      if (this.venditori.length > 0) return [];
      return Object.values(this.sportelli).map((sportello) =>
        // la telecamera guarda un po' più dentro la base, così la tettoia dello sportello non copre il venditore
        tappa(postoVenditore(sportello).add(new THREE.Vector3(0, 0, -3.5)), () => this.venditori.push(this.creaVenditore(sportello, true)))
      );
    }
    return [];
  }

  // I cacciatori combattono i lupi solo finché non ci sono tutte e quattro le torrette:
  // dopo ci pensano gli arcieri, e loro escono solo a raccogliere la carne rimasta a terra
  get cacciatoriCombattono() {
    return this.livelli.torretta < MAPPA.torri.length;
  }

  // Il livello comprato di una catena (null = non ancora comprato)
  livelloComprato(nome) {
    return CONFIG.miglioramenti[nome][this.livelli[nome] - 1] ?? null;
  }

  // All'avvio: ciò che era già stato comprato c'è subito, senza animazioni e senza spostare la telecamera.
  // La riparazione non ha bisogno di niente: si legge il suo livello a ogni fotogramma.
  ripristinaMiglioramenti() {
    this.mura.applicaLivello(this.livelli.mura, false);
    this.ambiente.casa.userData.imposta(this.livelli.mura, false);
    this.aiutante = this.livelli.aiutante > 0 ? this.creaAiutante(false) : null;
    this.secondario = this.livelli.boscaioloSecondario > 0 ? this.creaSecondario(this.stato.secondarioMancano, false) : null;
    this.torrette.imposta(this.livelli.torretta);
    for (let i = 0; i < this.torrette.quanteTorri; i++) {
      this.torrette.mostraTorre(i, false);
      this.torrette.aggiornaAspetto(i, false);
    }
    const cacciatore = this.livelloComprato('cacciatore');
    if (cacciatore) {
      const quanti = this.livelli.secondoCacciatore > 0 ? 2 : 1;
      for (let i = 0; i < quanti; i++) {
        const nuovo = new Cacciatore(this, cacciatore, i);
        nuovo.comparsa = 1;
        this.cacciatori.push(nuovo);
      }
    }
    const venditore = this.livelloComprato('venditore');
    if (venditore) {
      this.venditori = Object.values(this.sportelli).map((sportello) => this.creaVenditore(sportello, false));
      this.clienti.rapidita = venditore.rapidita;
    }
    for (const [nome, tipo] of Object.entries(PAVIMENTI)) {
      if (this.livelli[nome] > 0) this.pavimento.posa(tipo, this.cerchi[nome].posizione, false);
    }
  }

  // Un venditore fermo dietro il bancone dello sportello, che passa la merce ai clienti
  creaVenditore(sportello, conAnimazione) {
    const venditore = new Venditore(this.radice, sportello);
    if (!conAnimazione) venditore.comparsa = 1;
    return venditore;
  }

  // ---------------- MURA CHE CEDONO E MURA CADUTE ----------------

  // Sotto il 25% della vita compare l'avviso "Le mura stanno cedendo! Riparale!" (al massimo uno ogni 30 secondi, con un
  // suono); a zero le mura cadono e la partita è persa (vedi CONFIG.muraAllarme)
  controllaMura(dt) {
    const A = CONFIG.muraAllarme;
    this.attesaAllarme = Math.max(0, this.attesaAllarme - dt);
    if (this.mura.ratio < A.sotto && this.attesaAllarme <= 0) {
      this.attesaAllarme = A.ogniSecondi;
      this.schermate.mostraAvviso('Le mura stanno cedendo! Riparale!', A.tempoAvviso);
      suoni.suona('allarmeMura');
    }
  }

  // Un morso del lupo gigante: toglie "dannoMorso" punti alle mura, ma in tutto (dall'arrivo a quando muore) mai più della parte
  // di vita massima indicata da CONFIG.lupoGigante.limiteDanno, qualunque sia il livello delle mura
  mordeIlGigante() {
    const G = CONFIG.lupoGigante;
    const massimo = this.mura.maxHp * G.limiteDanno;
    const danno = Math.min(G.dannoMorso, Math.max(0, massimo - this.dannoGigante));
    this.dannoGigante += danno;
    if (danno > 0) this.mura.danneggia(danno);
  }

  // ---------------- RIPARARE LE MURA CON LA LEGNA ----------------

  // Sotto il 25% della vita compare il grande cerchio verde, esattamente al centro della base (se la telecamera sta già
  // mostrando qualcos'altro aspetta che abbia finito): il boscaiolo ci passa sopra e deposita la legna che porta (un po'
  // alla volta, come negli altri cerchi). Quando c'è tutta la legna le mura tornano alla vita massima e il cerchio sparisce.
  // Resta finché le mura non sono riparate, anche se la vita risale sopra il 25%; la legna depositata resta nel cerchio.
  // Finché c'è, i cerchi e le scritte che si sovrappongono si rimpiccioliscono; quando sparisce tornano come prima.
  gestisceRiparazione(pos, dt) {
    const cerchio = this.cerchioMura;
    cerchio.aggiorna(dt);
    if (!this.riparazioneAperta && !this.regia && !this.inFesta && this.mura.ratio < CONFIG.muraAllarme.sotto) {
      this.apriRiparazione();
    } else if (this.riparazioneAperta && this.mura.hp >= this.mura.maxHp) {
      // le mura sono già al massimo (riparazione automatica o mura nuove): il cerchio sparisce e tiene la legna già messa
      this.riparazioneAperta = false;
      cerchio.nascondi(true);
    }
    const centro = MAPPA.riparazioneMura;
    for (const altro of Object.values(this.cerchi)) altro.sospendi(this.riparazioneAperta && altro.occupa(centro.x, centro.z, cerchio.raggio));
    if (!this.riparazioneAperta || this.regia || !cerchio.contiene(pos)) return;
    const rata = cerchio.prossimaRata(this.giocatore.carico.legna, dt);
    if (rata <= 0) return;
    const partenza = this.giocatore.cimaSchiena(new THREE.Vector3(), 'legna');
    const tolta = this.giocatore.togli('legna', rata);
    cerchio.inArrivo -= rata - tolta;
    if (tolta <= 0) return;
    this.inVolo.legna += tolta;
    this.effetti.lancia('legna', partenza, cerchio, 0, () => {
      this.inVolo.legna -= tolta;
      suoni.suona('legnaDeposito');
      if (cerchio.riceviRata(tolta)) this.riparaMuraConLaLegna();
    }, VOLO_CORTO);
  }

  // Il cerchio compare: "esplode" dal terreno con scintille e un suono. Se al centro della base non si vede bene, prima la
  // telecamera ci va dolcemente (CONFIG.muraAllarme.durataTelecamera) e poi torna sul boscaiolo
  apriRiparazione() {
    const centro = MAPPA.riparazioneMura;
    const azione = () => {
      this.riparazioneAperta = true;
      this.cerchioMura.nascondi(false, false, true);
      suoni.suona('cerchioRiparazione');
      this.effetti.sbuffo(centro.x, 0.3, centro.z, 0x9be37a, 40, 5);
      this.effetti.sbuffo(centro.x, 0.3, centro.z, 0xf4f8ff, 24, 4);
      this.effetti.scintille(centro.x, 0.5, centro.z, 0xb6ffa8, 14, 3);
    };
    if (this.visibile(centro)) {
      azione();
      return;
    }
    const r = this.cerchioMura.raggio;
    const punti = [new THREE.Vector3(centro.x + r, 0, centro.z), new THREE.Vector3(centro.x, 0, centro.z + r)];
    this.regia = {
      tappe: [{ punto: centro.clone(), azione, zoom: this.zoomPerVedere(punti, centro), sempre: false, sosta: CONFIG.muraAllarme.durataTelecamera, punti: [centro], senzaTesto: true }],
      indice: 0, tempo: 0, nome: 'Riparazione',
    };
  }

  // Tutta la legna è arrivata: le mura tornano alla vita massima (la barra risale piano) e il cerchio sparisce
  riparaMuraConLaLegna() {
    const cerchio = this.cerchioMura;
    this.mura.hp = this.mura.maxHp;
    cerchio.pagato = 0;
    cerchio.inArrivo = 0;
    cerchio.aggiornaBarra();
    cerchio.ridisegna();
    this.riparazioneAperta = false;
    cerchio.nascondi(true);
    suoni.suona('riparazioneMura');
    const { x, z } = cerchio.posizione;
    this.effetti.testo(x, 2.4, z, 'Mura riparate!', 'buono');
    this.effetti.sbuffo(x, 0.4, z, 0x9be37a, 24, 3.5);
    for (let i = 0; i < 8; i++) {
      const palo = this.mura.pali[Math.floor((i / 8) * this.mura.pali.length)];
      this.effetti.sbuffo(palo.position.x, 1.5, palo.position.z, 0x9be37a, 5, 1.5);
    }
  }

  // Le mura crollano: schegge e neve lungo tutta la palizzata, il suono del crollo e la schermata con "Ricomincia"
  cadonoLeMura() {
    this.muraCadute = true;
    suoni.impostaPaura(false); // anche con il lupo gigante in giro la musica inquietante si ferma
    this.joystick.spegni();
    this.chiudiRegia();
    suoni.suona('muraCadute');
    const pali = this.mura.pali;
    for (let i = 0; i < 10; i++) {
      const palo = pali[Math.floor((i / 10) * pali.length)];
      this.mura.colpisci(palo.position.x, palo.position.z, 2);
    }
    this.schermate.nascondiAvviso();
    setTimeout(() => this.schermate.mostraMuraCadute(() => this.ricomincia()), 1200);
  }

  // "Ricomincia": si perde tutto e si riparte con la base dell'inizio (il tutorial resta fatto, l'audio resta com'è).
  // Il salvataggio nuovo viene scritto e la pagina si ricarica; da adesso niente deve più sovrascriverlo.
  ricomincia() {
    this.salvaOra = () => {};
    ricominciaDaCapo();
    window.location.reload();
  }

  // ---------------- TELECAMERA SUL MIGLIORAMENTO ----------------

  // Quanto alzare e allontanare la telecamera (zoom) perché, guardando "centro", si vedano tutti questi punti
  zoomPerVedere(punti, centro) {
    const cfg = CONFIG.telecameraSegheria;
    const distanza = Math.hypot(cfg.altezza, cfg.distanzaDietro); // distanza dal punto guardato, con zoom 1
    const metaVerticale = Math.tan(THREE.MathUtils.degToRad(this.telecamera.fov) / 2);
    const metaOrizzontale = metaVerticale * this.telecamera.aspect;
    const MARGINE = 2.5;     // metri in più attorno a ogni punto (la torre è larga e alta)
    const RIEMPIMENTO = 0.7; // i punti stanno nella parte centrale dello schermo, non attaccati ai bordi
    let zoom = 0.8;
    for (const punto of punti) {
      zoom = Math.max(zoom,
        (Math.abs(punto.x - centro.x) + MARGINE) / (distanza * metaOrizzontale * RIEMPIMENTO),
        (Math.abs(punto.z - centro.z) + MARGINE) / (distanza * metaVerticale * RIEMPIMENTO));
    }
    return zoom;
  }

  // Il punto si vede bene sullo schermo? (non troppo vicino ai bordi)
  visibile(punto) {
    const p = new THREE.Vector3(punto.x, 1, punto.z).project(this.telecamera);
    return Math.abs(p.x) < 0.8 && p.y > -0.8 && p.y < 0.7;
  }

  // La telecamera va dolcemente su ogni tappa (intanto il boscaiolo resta fermo), appena arriva fa partire
  // la costruzione, la guarda per un po' e passa alla tappa successiva; alla fine torna dolcemente sul boscaiolo
  aggiornaRegia(dt) {
    const r = this.regia;
    const cfg = CONFIG.regia;
    r.tempo += dt;
    const tappa = r.tappe[r.indice];
    if (tappa) {
      this.ambiente.segui(tappa.punto, dt, { zoom: tappa.zoom, libero: true, morbidezza: 3 });
      if (!tappa.fatta && r.tempo >= cfg.viaggio) {
        tappa.fatta = true;
        tappa.azione();
        if (!tappa.senzaTesto) this.effetti.testo(tappa.punto.x, 4, tappa.punto.z, `${r.nome}!`, 'buono');
      }
      if (r.tempo >= cfg.viaggio + tappa.sosta) {
        r.indice += 1;
        r.tempo = 0;
      }
    } else {
      this.ambiente.segui(this.giocatore.posizione, dt, { morbidezza: 3 });
      if (r.tempo >= cfg.ritorno) this.regia = null;
    }
  }

  // Chiude subito la regia (es. quando si rientra da una corsa): quello che non è ancora comparso compare adesso
  chiudiRegia() {
    if (!this.regia) return;
    for (const tappa of this.regia.tappe) {
      if (tappa.fatta) continue;
      tappa.fatta = true;
      tappa.azione();
    }
    this.regia = null;
  }

  // Riparazione automatica: le mura recuperano un po' di vita al secondo; ogni tanto una scintilla verde
  // spunta su un palo vicino al boscaiolo, così si vede che stanno guarendo
  riparaMura(dt) {
    const riparazione = this.livelloComprato('riparazione');
    if (!riparazione || this.mura.hp >= this.mura.maxHp) return;
    this.mura.ripara(riparazione.vitaAlSecondo * dt);
    this.attesaScintille -= dt;
    if (this.attesaScintille > 0) return;
    this.attesaScintille = 0.5;
    const pos = this.giocatore.posizione;
    const vicini = this.mura.pali.filter((palo) => Math.hypot(palo.position.x - pos.x, palo.position.z - pos.z) < 9);
    const palo = vicini[Math.floor(Math.random() * vicini.length)];
    if (palo) this.effetti.sbuffo(palo.position.x, 1.5, palo.position.z, 0x9be37a, 5, 1.5);
  }

  creaAiutante(conAnimazione) {
    const aiutante = new Aiutante(this.radice, this.catasta, this.sportelli.legna, this.effetti, this.inVolo);
    if (!conAnimazione) aiutante.comparsa = 1;
    return aiutante;
  }

  // mancano: secondi al suo ritorno alla catasta con la legna
  creaSecondario(mancano, conAnimazione) {
    return new BoscaioloSecondario(this.radice, this.catasta, this.effetti, this.inVolo, mancano, conAnimazione);
  }

  // ---------------- OGNI FOTOGRAMMA ----------------

  // La segheria prende il materiale delle mura quando l'onda del miglioramento le passa vicino (come le torrette)
  aggiornaCasa() {
    const casa = this.ambiente.casa.userData;
    if (casa.livello === this.mura.livello || !this.mura.ondaArrivata(MAPPA.casa.x, MAPPA.casa.z)) return;
    const conAnimazione = this.mura.onda !== null;
    casa.imposta(this.mura.livello, conAnimazione);
    if (!conAnimazione) return;
    const { x, z } = MAPPA.casa;
    for (const dx of [-2.5, 1, 4.5]) this.effetti.sbuffo(x + dx, 0.4, z, this.mura.livello >= 2 ? 0x8b939e : 0x9aa2ad, 14, 3);
    if (this.mura.livello >= 2) this.effetti.scintille(x + 3, 2, z + 1, 0xfff3b0, 10, 2);
    suoni.suona(SUONO_MATERIALE[this.mura.livello]);
    suoni.suona(SUONO_MATERIALE[this.mura.livello], { ritardo: 0.35, volume: 0.8 });
  }


  aggiorna(dt) {
    if (this.muraCadute) return; // le mura sono cadute: tutto fermo, si aspetta "Ricomincia"
    // mentre la telecamera guarda un miglioramento appena comprato il boscaiolo resta fermo
    const direzione = this.regia ? { x: 0, y: 0 } : this.joystick.leggi();
    if (!this.haCamminato && (direzione.x || direzione.y)) {
      this.haCamminato = true;
      this.schermate.nascondiSuggerimento();
    }
    // le mura bloccano sempre; le ante dei cancelli solo quando sono chiuse
    this.giocatore.ostacoli = [
      ...this.ostacoliFissi,
      ...(this.banco.visibile ? [this.banco.ostacolo] : []),
      ...Object.values(this.cancelli).flatMap((cancello) => cancello.ostacoli),
    ];
    this.giocatore.aggiorna(dt, direzione);
    const pos = this.giocatore.posizione;
    this.attaccoCooldown = Math.max(0, this.attaccoCooldown - dt);
    this.aggiornaColpo(dt);
    this.tempoGioco += dt;

    this.aggiornaLupi(dt);
    // le mura cadono appena i morsi le portano a zero (prima della riparazione automatica, che altrimenti le rimetterebbe in piedi)
    if (this.mura.hp <= 0) {
      this.cadonoLeMura();
      return;
    }
    this.torrette.aggiorna(dt, this.lupiBase, (lupo, danno) => this.colpisciLupo(lupo, danno));
    this.aggiornaCasa();
    this.riparaMura(dt);
    this.mura.aggiorna(dt);
    this.schermate.aggiornaMura(this.mura.ratio);
    this.controllaMura(dt);
    this.gestisceRiparazione(pos, dt);

    // carne lasciata dai lupi (fuori dalle mura): si raccoglie passandoci sopra
    for (const drop of this.carneCadute) {
      const d = Math.hypot(pos.x - drop.x, pos.z - drop.z);
      if (d < 1.0 && !drop.preso) {
        drop.preso = true;
        this.radice.remove(drop.mesh);
        this.giocatore.aggiungi('carne', drop.quantita);
        suoni.suona('carneSchiena');
        this.giocatore.rimbalza(0xff9a8a, this.giocatore.cimaSchiena(new THREE.Vector3(), 'carne'));
        this.effetti.testo(drop.x, 1.8, drop.z, `+${drop.quantita} carne`, 'buono');
      }
    }
    this.carneCadute = this.carneCadute.filter((drop) => !drop.preso);

    this.aggiornaVisibilita(false);
    if (this.moneteInfinite) this.stato.soldi = Math.max(this.stato.soldi, MONETE_INFINITE);
    this.gestisceMiglioramenti(pos, dt);

    // --- Raccolta e scarico, un pezzo alla volta (nessun limite di carico) ---
    this.attesaRaccolta -= dt;
    if (this.attesaRaccolta <= 0) {
      let fatto = false;
      if (this.catasta.contiene(pos) && this.catasta.quantita > 0) {
        fatto = this.raccogli(this.catasta, 'legna');
      } else {
        // sul punto di deposito di uno sportello scarica solo la merce di quello sportello
        const sportello = Object.values(this.sportelli).find((sp) => sp.vicino(pos) && this.giocatore.ha(sp.tipo));
        if (sportello) fatto = this.scarica(sportello);
      }
      if (fatto) this.attesaRaccolta = CONFIG.segheria.intervalloRaccolta;
      else this.trasferimento = null;
    }

    // --- Soldi nel cerchio delle monete tra i due sportelli ---
    if (this.soldi.valore > 0 && this.soldi.contiene(pos)) this.raccogliSoldi(this.soldi);
    this.giocatore.impostaMonete(this.stato.soldi);

    // --- Tutto il resto ---
    for (const sportello of Object.values(this.sportelli)) sportello.aggiorna(dt);
    this.aiutante?.aggiorna(dt);
    this.secondario?.aggiorna(dt);
    this.banco.aggiorna(dt);
    this.pavimento.aggiorna(dt);
    for (const cacciatore of this.cacciatori) cacciatore.aggiorna(dt);
    for (const venditore of this.venditori) venditore.aggiorna(dt);
    this.clienti.aggiorna(dt);
    this.effetti.aggiorna(dt);
    if (!this.tutorial.finito) {
      // il cerchio DIFESA (le mura di pietra) si accende (con un saltello) quando arriva il passaggio "Compra le mura di pietra!"
      this.cerchi.difesa.spegni(this.tutorial.passo < 2);
      this.tutorial.aggiorna(dt, this.bersaglioTutorial());
    }
    if (this.regia) this.aggiornaRegia(dt);
    else this.ambiente.segui(pos, dt);
    if (this.festaDopoLaRegia && !this.regia) this.apriFesta();

    // Inizio più veloce: prima delle mura di pietra i clienti sono di più; dopo tornano piano piano al ritmo normale
    this.clienti.spinta = this.livelli.mura === 0 ? 1 : Math.max(0, this.clienti.spinta - dt / CONFIG.clienti.avvio.ritornoIn);

    // --- Cancelli: si aprono quando il boscaiolo si avvicina; da quello della corsa si parte ---
    // i cancelli dei lati si aprono anche per i cacciatori
    const cacciatori = this.cacciatori.map((cacciatore) => cacciatore.posizione);
    this.cancelli.foresta.aggiorna(dt, pos, cacciatori);
    this.cancelli.destra.aggiorna(dt, pos, cacciatori);
    // quando il boscaiolo si avvicina al cerchio CORSA la corsa si prepara in anticipo (se si allontana, la si butta)
    const zonaCorsa = this.cancelli.corsa.centroZona;
    const distanzaCorsa = Math.hypot(pos.x - zonaCorsa.x, pos.z - zonaCorsa.z);
    if (!this.vicinoAlCancello && distanzaCorsa < DISTANZA_PREPARA_CORSA) {
      this.vicinoAlCancello = true;
      this.alVicinoAlCancello(true);
    } else if (this.vicinoAlCancello && distanzaCorsa > DISTANZA_PREPARA_CORSA + 3) {
      this.vicinoAlCancello = false;
      this.alVicinoAlCancello(false);
    }
    // quello della corsa si apre anche per il boscaiolo secondario (ma la corsa la fa partire solo il giocatore)
    if (this.cancelli.corsa.aggiorna(dt, pos, this.secondario?.visibile ? [this.secondario.posizione] : [])) {
      this.cancelli.corsa.azzera();
      this.alPartenzaCorsa();
      return;
    }

    // --- Barra in alto ---
    this.schermate.aggiornaSegheria({
      soldi: this.stato.soldi,
      legna: this.catasta.quantita,
      carne: this.sportelli.carne.quantita,
    });

    // --- Salvataggio ogni tanto ---
    this.attesaSalvataggio -= dt;
    if (this.attesaSalvataggio <= 0) {
      this.salvaOra();
      this.attesaSalvataggio = OGNI_QUANTO_SALVARE;
    }
  }

  // Quante unità spostare a ogni volo: le pile grandi si spostano in pezzi più grossi,
  // così tutto passa in circa "voliPerTrasferimento" voli (deciso all'inizio del trasferimento)
  pezzoDelTrasferimento(chiave, totale) {
    if (this.trasferimento?.chiave !== chiave) {
      const unita = CONFIG.segheria.unitaPerPezzo;
      const pezzo = Math.max(unita, Math.ceil(totale / CONFIG.segheria.voliPerTrasferimento / unita) * unita);
      this.trasferimento = { chiave, pezzo };
    }
    return this.trasferimento.pezzo;
  }

  // Un pezzo vola dal deposito alla schiena del boscaiolo
  raccogli(deposito, tipo) {
    const partenza = deposito.cima();
    const quantita = deposito.prendiPezzo(this.pezzoDelTrasferimento(`raccogli-${tipo}`, deposito.quantita));
    if (quantita <= 0) return false;
    this.inVolo[tipo] += quantita;
    this.effetti.lancia(tipo, partenza, (v) => this.giocatore.cimaSchiena(v, tipo), 0, () => {
      this.inVolo[tipo] -= quantita;
      this.giocatore.aggiungi(tipo, quantita);
      suoni.suona(tipo === 'carne' ? 'carneSchiena' : 'legnaSchiena');
      this.giocatore.rimbalza(tipo === 'carne' ? 0xff9a8a : 0xffd27a, this.giocatore.cimaSchiena(new THREE.Vector3(), tipo));
    }, VOLO_CORTO);
    return true;
  }

  // Un pezzo di quel tipo vola dalla schiena alla pila dello sportello
  scarica(sportello) {
    const tipo = sportello.tipo;
    const partenza = this.giocatore.cimaSchiena(new THREE.Vector3(), tipo);
    const quantita = this.giocatore.togli(tipo, this.pezzoDelTrasferimento(`scarica-${tipo}`, this.giocatore.carico[tipo]));
    if (quantita <= 0) return false;
    if (tipo === 'legna') this.completaTutorial('legna');
    this.inVolo[tipo] += quantita;
    this.effetti.lancia(tipo, partenza, sportello, 0, () => {
      this.inVolo[tipo] -= quantita;
      sportello.aggiungi(quantita);
      suoni.suona(tipo === 'carne' ? 'carneDeposito' : 'legnaDeposito');
    }, VOLO_CORTO);
    return true;
  }

  // Tutte le monete del cerchio volano verso il boscaiolo (divise in qualche mucchietto)
  raccogliSoldi(pila) {
    const totale = pila.prendiTutto();
    suoni.suona('monete');
    const mucchietti = Math.min(8, Math.max(1, Math.ceil(totale / (CONFIG.economia.soldiPerMoneta * 2))));
    let rimasti = totale;
    for (let i = 0; i < mucchietti; i++) {
      const parte = i === mucchietti - 1 ? rimasti : Math.floor(totale / mucchietti);
      rimasti -= parte;
      this.inVolo.soldi += parte;
      const partenza = pila.posizione.clone().add(new THREE.Vector3((Math.random() - 0.5) * 0.5, 0.2 + i * 0.05, (Math.random() - 0.5) * 0.4));
      const verso = (v) => this.giocatore.cimaSchiena(v, 'monete');
      this.effetti.lancia('soldi', partenza, verso, i * 0.05, () => {
        this.inVolo.soldi -= parte;
        this.stato.soldi += parte;
        this.giocatore.rimbalza(0xffe066);
      }, { durata: 0.35, altezza: 1.2, sbuffo: false });
    }
    this.effetti.testo(this.giocatore.posizione.x, 2.4, this.giocatore.posizione.z, `+${totale}`, 'buono', 'moneta');
  }

  // Scrive i progressi sul dispositivo
  salvaOra() {
    const s = this.stato;
    // ciò che è in volo (o in mano ai lavoratori) viene salvato "a casa" (catasta, tavolo della carne, tasca) per non perderlo mai
    // (anche la legna già messa nel cerchio per riparare le mura: ricaricando le mura sono di nuovo intere, quindi torna nella catasta)
    s.catasta = this.catasta.quantita + this.inVolo.legna + (this.aiutante?.carico ?? 0) + this.cerchioMura.pagato;
    s.tutorial = this.tutorial.passo;
    s.soldi = Math.round(s.soldi);
    s.schiena = { ...this.giocatore.carico };
    s.sportelli = {
      legna: this.sportelli.legna.quantita,
      carne: this.sportelli.carne.quantita + this.inVolo.carne + this.cacciatori.reduce((somma, cacciatore) => somma + cacciatore.carico, 0),
    };
    s.soldiATerra = this.soldi.valore + this.inVolo.soldi;
    s.miglioramenti = {};
    for (const [nome, comprati] of Object.entries(this.livelli)) s.miglioramenti[nome] = { comprati, pagato: 0 };
    // le monete già messe nei cerchi: per le file sono del prossimo acquisto della fila, per il pavimento del pavimento
    const pagato = (cerchio) => cerchio.pagato + cerchio.inArrivo;
    s.file = {};
    for (const fila of Object.keys(CONFIG.file)) s.file[fila] = { pagato: pagato(this.cerchi[fila]) };
    for (const nome of Object.keys(PAVIMENTI)) s.miglioramenti[nome].pagato = pagato(this.cerchi[nome]);
    s.secondarioMancano = this.secondario ? this.secondario.mancano : null;
    // l'ora del salvataggio, per i guadagni di quando si è via: non torna mai indietro (vedi lavoroMentreVia)
    s.orologio = Math.max(Number(s.orologio) || 0, Date.now());
    salva(s);
  }

  disegna() {
    this.renderer.render(this.scena, this.telecamera);
  }
}
