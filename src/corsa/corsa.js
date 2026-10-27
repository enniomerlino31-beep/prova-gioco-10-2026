// =====================================================================
//  CORSA: il "regista" di una partita
//  Crea squadra, carro, porte, alberi, rocce, lupi, orso e salita finale,
//  li aggiorna a ogni fotogramma e decide quando la corsa finisce.
//  Stati: 'corsa' → ('scontro' con l'orso, se c'è) → 'salita' → 'finita'.
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
import { ScontroOrso } from './orso.js';
import { generaLivello } from './generatoreLivello.js';
import { suoni } from '../motore/suoni.js';

// Distanza dal centro della folla al retro del carro con pochi boscaioli: oltre questa la telecamera si allarga
const CODA_NORMALE = 5.5;

export class Corsa {
  // mondo: scena e telecamera; controlli: dito/tastiera; schermate: interfaccia;
  // alTermine: funzione chiamata con i risultati quando la corsa finisce
  // opzioni: { primaCorsa: true nel tutorial (niente porte tutte rosse);
  //            orso: livello dell'orso di fine corsa (null = niente orso, si va dritti alla scalinata);
  //            prova: { boscaioli } per provare lo scontro (?orso=5&boscaioli=200): si parte vicino alla fine, senza livello }
  constructor(mondo, controlli, schermate, alTermine, opzioni = {}) {
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
    this.prova = opzioni.prova ?? null;
    this.orso = opzioni.orso ? new ScontroOrso(this.radice, effetti, opzioni.orso) : null;
    if (this.orso) this.orso.alTremito = (forza) => mondo.scuoti(forza); // ogni colpo dell'orso fa tremare la telecamera
    // la squadra si ferma qui, davanti all'orso (se non c'è, va avanti fino alla scalinata)
    this.fermataOrso = CONFIG.pista.lunghezza - CONFIG.orso.distanzaOrso - CONFIG.orso.distanzaScontro;

    // Costruisce il livello a partire dall'elenco del generatore (nelle prove dello scontro non c'è: si parte vicino alla fine)
    const livello = this.prova ? { elenco: [] } : generaLivello({ primaCorsa: !!opzioni.primaCorsa });
    for (const cosa of livello.elenco) {
      if (cosa.tipo === 'porte') this.porte.aggiungiCoppia(cosa.distanza, cosa.sinistra, cosa.destra);
      if (cosa.tipo === 'albero') this.alberi.aggiungi(cosa.distanza, cosa.x);
      if (cosa.tipo === 'roccia') this.ostacoli.aggiungiRoccia(cosa.distanza, cosa.x);
      if (cosa.tipo === 'lupo') this.lupi.aggiungi(cosa.distanza, cosa.x, cosa.corre);
    }

    // Suoni continui della corsa: i passi della squadra sulla neve (pochi o tanti boscaioli) e il carro
    this.suonoPassi = suoni.ciclo('corsaNeve');
    this.suonoPassiTanti = suoni.ciclo('corsaNeveTanti');
    this.suonoCarro = suoni.ciclo('carro');

    this.stato = 'corsa'; // 'corsa' → 'scontro' → 'salita' → 'finita'
    this.prossimoGrido = CONFIG.audio.gridaCorsa[0]; // quando grideranno la prossima volta (secondi dall'inizio)
    this.bersaglioX = 0;   // dove il giocatore vuole portare la squadra
    this.tempo = 0;
    this.velocita = 0;
    this.attesaFine = 0;

    if (this.prova) {
      this.squadra.imposta(this.prova.boscaioli);
      this.squadra.distanza = (this.orso ? this.fermataOrso : CONFIG.pista.lunghezza) - 14;
      this.carro.legna = this.prova.legna ?? 200;
      this.carro.carne = 20;
    }
    controlli.azzera();
    mondo.reimpostaTelecamera();
    this.carro.segui(this.squadra, 0, 0);
  }

  aggiorna(dtReale) {
    // il colpo finale con l'orso va al rallentatore: tutto il mondo di gioco (non l'audio) va più piano
    const dt = dtReale * (this.orso?.fattoreTempo ?? 1);
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
      squadra.muoviVersoBersaglio(this.bersaglioX, velocitaLaterale, dt);

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
      } else if (this.orso && squadra.distanza >= this.fermataOrso) {
        // la squadra si ferma davanti all'orso: ruggito e scontro (il carro resta fermo dietro la squadra)
        this.stato = 'scontro';
        squadra.azione = 'ferma';
        this.velocita = 0;
        this.orso.inizia();
        this.schermate.mostraAvviso(`Orso livello ${this.orso.livello}`, CONFIG.orso.tempoRuggito);
        suoni.impostaPaura(true); // parte la musica paurosa del lupo gigante (con la stessa dissolvenza)
      } else if (!this.orso && squadra.distanza >= CONFIG.pista.lunghezza) {
        this.stato = 'salita';
        this.sfida.inizia(squadra);
      }
    } else if (this.stato === 'scontro') {
      squadra.azione = this.orso.fase === 'caduta' ? 'esulta' : 'ferma'; // l'orso è caduto: i boscaioli esultano
      carro.segui(squadra, dt, 0);
      this.alberi.aggiorna(dt, squadra, carro, []);
      if (this.orso.esito === 'vinto') {
        suoni.impostaPaura(false);
        this.stato = 'salita';
        this.sfida.carneOrso = CONFIG.orso.carne;
        this.sfida.inizia(squadra);
      } else if (this.orso.esito === 'perso') {
        // i boscaioli sono finiti: si porta a casa solo la legna raccolta con gli alberi, senza moltiplicatori e senza carne
        suoni.impostaPaura(false);
        this.stato = 'finita';
        this.risultato = {
          vinto: false,
          orsoVince: true,
          livelloOrso: this.orso.livello,
          legnaPortata: carro.legna,
          carnePersa: carro.carne,
          prova: !!this.prova,
        };
      }
    } else if (this.stato === 'salita') {
      this.alberi.aggiorna(dt, squadra, carro, []);
      this.sfida.aggiorna(dt, squadra, carro);
      carro.segui(squadra, dt, squadra.azione === 'corre' ? CONFIG.salita.velocita : 0);
      if (this.sfida.finita) {
        this.stato = 'finita';
        this.risultato = {
          vinto: true,
          orsoSconfitto: !!this.orso,
          livelloOrso: this.orso?.livello ?? 0,
          carneOrso: this.sfida.carneOrso,
          prova: !!this.prova,
          boscaioliArrivati: this.sfida.boscaioliArrivati,
          gradini: this.sfida.gradiniRaggiunti,
          moltiplicatore: this.sfida.moltiplicatore,
          legna: carro.legna,
          legnaFinale: Math.round(carro.legna * this.sfida.moltiplicatore),
          carne: carro.carne,
          carneFinale: Math.round(carro.carne * this.sfida.moltiplicatore) + this.sfida.carneOrso, // la carne dell'orso non si moltiplica
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

    this.aggiornaSuoni();
    this.orso?.aggiorna(dt, squadra, dtReale);

    // --- Grafica: omini, effetti, telecamera, interfaccia ---
    squadra.aggiorna(dt, this.tempo);
    this.effetti.aggiorna(dt);
    // Con tanti boscaioli la folla si allunga all'indietro e spinge il carro in fondo allo schermo, fino a tagliarlo:
    // la telecamera allora guarda un po' più indietro e si alza, così folla, carro e carico si vedono sempre tutti
    const coda = squadra.distanza - carro.distanza + carro.lunghezza / 2; // dal centro della folla al retro del carro
    const allungamento = Math.max(0, coda - CODA_NORMALE);
    const zoom = (1 + (carro.scala - 1) * CONFIG.telecamera.allontanamentoCarro) * (1 + allungamento * 0.04);
    if (this.stato === 'scontro' && this.orso) {
      // durante lo scontro la telecamera si ferma e inquadra insieme squadra e orso
      this.mondo.segui(0, 0, -this.orso.centroInquadratura, dt, CONFIG.orso.zoomTelecamera);
    } else {
      this.mondo.segui(squadra.x, squadra.y, -squadra.distanza + allungamento * 0.6, dt, zoom);
    }
    this.schermate.aggiornaCorsa({
      boscaioli: squadra.numero,
      legna: carro.legna,
      carne: carro.carne,
      progresso: Math.min(1, squadra.distanza / CONFIG.pista.lunghezza),
      posizioneContatore: new THREE.Vector3(squadra.x, squadra.y + 1.9, -squadra.distanza),
    });
  }

  // Un solo suono di passi di gruppo: più pieno con tanti boscaioli (sfuma nel suono dei "tanti"), più leggero con
  // pochi; tace quando la squadra è ferma (a tagliare un albero) o la corsa è finita. Il carro si sente quando avanza.
  // Sulla salita finale i passi sono quelli sui gradini (vedi sfidaFinale.js).
  aggiornaSuoni() {
    const squadra = this.squadra;
    const corre = this.stato === 'corsa' && squadra.azione === 'corre' && this.velocita > 0;
    const pieno = THREE.MathUtils.clamp((squadra.numero - 6) / 40, 0, 1);  // 0 con pochi boscaioli, 1 con 46 o più
    const forza = corre ? THREE.MathUtils.clamp(0.45 + squadra.numero / 30, 0.45, 1) : 0;
    this.suonoPassi.volume(forza * (1 - pieno * 0.7));
    this.suonoPassiTanti.volume(forza * pieno);
    const spinto = this.stato === 'salita' && squadra.azione === 'corre';
    this.suonoCarro.volume(corre ? 0.7 : spinto ? 0.45 : 0);
    // ogni tanto, mentre corrono, i boscaioli gridano per incitarsi (mai troppo spesso: vedi CONFIG.audio)
    if (corre && this.tempo >= this.prossimoGrido) {
      suoni.suona('grido');
      this.prossimoGrido = this.tempo + CONFIG.audio.gridaCorsa[0] + Math.random() * (CONFIG.audio.gridaCorsa[1] - CONFIG.audio.gridaCorsa[0]);
    }
  }

  // Butta via tutti gli oggetti di questa corsa (quando se ne inizia un'altra)
  distruggi() {
    for (const ciclo of [this.suonoPassi, this.suonoPassiTanti, this.suonoCarro]) ciclo.ferma(0.4);
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
