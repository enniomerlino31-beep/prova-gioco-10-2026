// =====================================================================
//  SEGHERIA: il "regista" della base
//  Mette insieme ambiente e mura, boscaiolo, catasta, dispensa, sportelli
//  di vendita (con le loro pile di soldi), clienti, cancelli, cerchi dei
//  miglioramenti, lavoratori (aiutante, cacciatore, venditori), torrette
//  con l'arciere e lupi. A ogni fotogramma:
//   - muove il boscaiolo con il joystick (le mura e i cancelli chiusi lo bloccano)
//   - raccoglie/scarica la merce quando il boscaiolo è nella zona giusta
//   - fa pagare i miglioramenti quando il boscaiolo sta sul loro cerchio
//   - fa comprare i clienti
//   - fa lavorare i lavoratori e tirare gli arcieri; ripara le mura se c'è la riparazione
//   - quando si compra qualcosa che compare lontano, porta la telecamera a vederlo
//   - salva i progressi sul dispositivo
// =====================================================================

import * as THREE from 'three';
import { CONFIG } from '../config.js';
import { carica, salva } from '../salvataggio.js';
import { registraVendita } from '../economia.js';
import { Effetti } from '../motore/effetti.js';
import { creaAmbiente, MAPPA } from './ambiente.js';
import { Giocatore } from './giocatore.js';
import { Deposito } from './catasta.js';
import { Sportello } from './sportello.js';
import { Clienti } from './clienti.js';
import { Cancello } from './cancello.js';
import { CerchioMiglioramento } from './miglioramenti.js';
import { Aiutante } from './aiutante.js';
import { Cacciatore } from './cacciatore.js';
import { Venditore, postoVenditore } from './venditore.js';
import { Torrette } from './torrette.js';
import { Mura } from './mura.js';
import { creaLupo } from '../modelli/lupo.js';
import { creaCarne } from '../modelli/carne.js';

const OGNI_QUANTO_SALVARE = 2; // secondi

// Opzioni dei voli dentro la segheria (più brevi e piccoli di quelli della corsa)
const VOLO_CORTO = { durata: 0.35, altezza: 1.4, scala: 0.55, sbuffo: false };

export class Segheria {
  // alPartenzaCorsa: funzione chiamata quando il boscaiolo riempie il cerchio del cancello della corsa
  constructor(renderer, schermate, joystick, alPartenzaCorsa) {
    this.renderer = renderer;
    this.schermate = schermate;
    this.joystick = joystick;
    this.alPartenzaCorsa = alPartenzaCorsa;

    const ambiente = creaAmbiente();
    this.ambiente = ambiente;
    this.scena = ambiente.scena;
    this.telecamera = ambiente.telecamera;

    // Progressi salvati
    this.stato = carica();
    const s = this.stato;

    this.radice = new THREE.Group();
    this.scena.add(this.radice);
    this.effetti = new Effetti(this.radice, schermate);

    this.giocatore = new Giocatore(this.radice);
    for (const [tipo, quantita] of Object.entries(s.schiena)) if (quantita > 0) this.giocatore.aggiungi(tipo, quantita);
    this.catasta = new Deposito(this.radice, 'legna', MAPPA.catasta, s.catasta);
    this.dispensa = new Deposito(this.radice, 'carne', MAPPA.dispensa, s.dispensa);
    this.sportelli = {
      legna: new Sportello(this.radice, 'legna', MAPPA.sportelli.legna, s.sportelli.legna, s.soldiSportelli.legna),
      carne: new Sportello(this.radice, 'carne', MAPPA.sportelli.carne, s.sportelli.carne, s.soldiSportelli.carne),
    };
    this.cancelli = {
      corsa: new Cancello(this.radice, MAPPA.cancelli.corsa, { scritta: 'CORSA' }),
      foresta: new Cancello(this.radice, MAPPA.cancelli.foresta),
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
    this.mura = new Mura(this.radice, ambiente.palizzata, MAPPA.miglioramenti.mura);
    this.tempoGioco = 0;
    this.prossimoLupo = CONFIG.segheria.primoLupo;
    this.lupiBase = this.creaLupiBase();
    this.attaccoCooldown = 0;
    this.carneCadute = [];

    // Cerchi dei miglioramenti: ognuno è una catena di livelli
    this.cerchi = {};
    for (const nome of Object.keys(MAPPA.miglioramenti)) {
      const salvato = s.miglioramenti[nome];
      this.cerchi[nome] = new CerchioMiglioramento(this.radice, MAPPA.miglioramenti[nome], CONFIG.miglioramenti[nome], salvato.comprati, salvato.pagato);
    }
    this.torrette = new Torrette(this.radice, this.effetti, MAPPA.torri);
    this.cacciatore = null;
    this.venditori = [];
    this.attesaScintille = 0;
    this.regia = null; // la telecamera che va a vedere un miglioramento appena comprato (null = segue il boscaiolo)
    this.ripristinaMiglioramenti();

    document.addEventListener('keydown', (event) => {
      if (event.code === 'Space' || event.key === 'e' || event.key === 'E') this.attaccaLupi(true);
    });

    // Salva anche quando la pagina viene chiusa o messa in secondo piano
    window.addEventListener('pagehide', () => this.salvaOra());
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) this.salvaOra();
    });
  }

  // Il bottino della corsa finisce in catasta e dispensa (e viene salvato subito)
  aggiungiBottino(legna, carne) {
    this.catasta.aggiungi(legna);
    this.dispensa.aggiungi(carne);
    this.ultimoBottino = { legna, carne };
    this.salvaOra();
  }

  // Si entra nella segheria (all'avvio o dopo una corsa)
  entra() {
    this.chiudiRegia();
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
      if (carne > 0) this.effetti.testo(MAPPA.dispensa.x, 2, MAPPA.dispensa.z, `+${carne} carne`, 'buono');
      this.effetti.sbuffo(MAPPA.catasta.x, 1, MAPPA.catasta.z, 0xb07a45, 16, 3);
      this.ultimoBottino = null;
    }
  }

  // Si esce dalla segheria (parte una corsa)
  esci() {
    this.attiva = false;
    this.joystick.spegni();
    this.stato.corseFatte += 1;
    this.salvaOra();
  }

  // ---------------- LUPI (restano sempre fuori dalle mura) ----------------

  creaLupiBase() {
    const partenze = [
      { x: -14.9, z: -5.4 }, { x: 13.9, z: -3.9 }, { x: -12.0, z: 9.0 }, { x: 14.4, z: 8.3 }, { x: -16.1, z: 3.4 },
    ];
    return partenze.map((partenza) => {
      const { gruppo } = creaLupo();
      gruppo.scale.setScalar(0.72);
      gruppo.position.set(partenza.x, 0, partenza.z);
      gruppo.rotation.y = Math.PI;
      gruppo.visible = false;
      // ogni lupo ha i suoi materiali (copie di quelli del modello), così può lampeggiare da solo quando viene colpito
      const materiali = new Map();
      gruppo.traverse((parte) => {
        if (!parte.isMesh) return;
        if (!materiali.has(parte.material)) materiali.set(parte.material, parte.material.clone());
        parte.material = materiali.get(parte.material);
      });
      // barra della vita: tre tacche verdi su uno sfondo scuro (una tacca diventa grigia a ogni colpo)
      const barra = new THREE.Group();
      barra.position.set(0, 1.45, 0);
      barra.visible = false;
      const celle = [];
      for (let i = 0; i < 3; i++) {
        const cella = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.1, 0.03), new THREE.MeshBasicMaterial({ color: 0x6fe17d }));
        cella.position.set(-0.25 + i * 0.25, 0, 0);
        barra.add(cella);
        celle.push(cella);
      }
      const sfondo = new THREE.Mesh(new THREE.BoxGeometry(0.82, 0.17, 0.02), new THREE.MeshBasicMaterial({ color: 0x1d2128 }));
      sfondo.position.z = 0.03; // dietro le tacche, visto dalla telecamera
      barra.add(sfondo);
      gruppo.add(barra);
      this.radice.add(gruppo);
      return {
        partenza, x: partenza.x, z: partenza.z, hp: CONFIG.segheria.hpLupo, vivo: false, obiettivo: null,
        gruppo, barra, celle, flash: 0, lampo: 0, attacco: 0, materiali: [...materiali.values()],
        generazione: 0, // cresce ogni volta che il lupo ricompare (così le frecce non inseguono il lupo "nuovo")
      };
    });
  }

  svegliaLupoCasuale() {
    const dormienti = this.lupiBase.filter((lupo) => !lupo.vivo);
    if (dormienti.length === 0) return;
    const lupo = dormienti[Math.floor(Math.random() * dormienti.length)];
    lupo.vivo = true;
    lupo.generazione += 1;
    lupo.hp = CONFIG.segheria.hpLupo;
    lupo.flash = 0;
    lupo.attacco = 0;
    lupo.x = lupo.partenza.x;
    lupo.z = lupo.partenza.z;
    lupo.obiettivo = this.bersaglioVicino(lupo);
    lupo.gruppo.visible = true;
    lupo.barra.visible = true;
    lupo.lampo = 0;
    lupo.gruppo.position.set(lupo.x, 0, lupo.z);
    for (const cella of lupo.celle) cella.material.color.set(0x6fe17d);
  }

  // Un palo a caso tra i più vicini al lupo: il lupo ci va davanti, dal lato esterno delle mura
  bersaglioVicino(lupo) {
    const vicini = [...this.mura.pali]
      .sort((a, b) => Math.hypot(a.position.x - lupo.x, a.position.z - lupo.z) - Math.hypot(b.position.x - lupo.x, b.position.z - lupo.z))
      .slice(0, 10);
    const palo = vicini[Math.floor(Math.random() * vicini.length)];
    return this.fuoriDalleMura(palo.position.x, palo.position.z, 0.8);
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
    // i lupi arrivano fin dall'inizio: nei primi "calmaIniziale" secondi sono più lenti e più radi, poi vanno come sempre
    const calma = THREE.MathUtils.clamp(this.tempoGioco / cfg.calmaIniziale, 0, 1);
    const maxAttivi = Math.min(this.lupiBase.length, 1 + Math.floor(this.tempoGioco / cfg.unLupoInPiuOgni));
    const attivi = this.lupiBase.filter((lupo) => lupo.vivo).length;
    this.prossimoLupo -= dt;
    if (this.prossimoLupo <= 0 && attivi < maxAttivi) {
      this.svegliaLupoCasuale();
      const intervallo = cfg.intervalloLupiMinimo + Math.random() * (cfg.intervalloLupiMassimo - cfg.intervalloLupiMinimo);
      this.prossimoLupo = intervallo * THREE.MathUtils.lerp(cfg.intervalloLupiInizio, 1, calma);
    }

    const pos = this.giocatore.posizione;
    for (const lupo of this.lupiBase) {
      if (!lupo.vivo) continue;
      lupo.flash = Math.max(0, lupo.flash - dt * 2.5);
      // appena colpito lampeggia di bianco: si accende e si spegne tre volte
      lupo.lampo = Math.max(0, lupo.lampo - dt);
      const acceso = lupo.lampo > 0 && Math.floor(lupo.lampo / 0.07) % 2 === 0;
      for (const materiale of lupo.materiali) materiale.emissive.setScalar(acceso ? 0.85 : 0);
      const distanza = Math.hypot(pos.x - lupo.x, pos.z - lupo.z);
      const target = lupo.obiettivo;
      const versoX = (target.x - lupo.x) * 0.28;
      const versoZ = (target.z - lupo.z) * 0.28;
      const velocita = cfg.velocitaLupo * THREE.MathUtils.lerp(cfg.velocitaLupiInizio, 1, calma);
      lupo.x += versoX * dt * velocita;
      lupo.z += versoZ * dt * velocita;
      // i lupi non passano le mura (nemmeno dai cancelli)
      const fuori = this.fuoriDalleMura(lupo.x, lupo.z, 0.6);
      lupo.x = fuori.x;
      lupo.z = fuori.z;
      const sollevamento = 0.2 + Math.sin((performance.now() * 0.004) + lupo.x) * 0.05 + lupo.flash * 0.5;
      lupo.gruppo.position.set(lupo.x, sollevamento, lupo.z);
      lupo.gruppo.rotation.y = Math.PI - Math.sign(versoX || 1) * 0.2;

      const daMura = Math.hypot(lupo.x - target.x, lupo.z - target.z);
      if (daMura < 1.1) lupo.obiettivo = this.bersaglioVicino(lupo); // passa a un palo lì vicino

      if (daMura < 1.7) {
        this.mura.danneggia(CONFIG.segheria.dannoMura * dt);
      }

      if (distanza < 1.4) {
        pos.x += (pos.x - lupo.x) * dt * 0.18;
        pos.z += (pos.z - lupo.z) * dt * 0.18;
      }

      if (distanza < 1.8 && this.attaccoCooldown <= 0) this.attaccaLupi(true);
    }
  }

  attaccaLupi(auto = false) {
    if (this.attaccoCooldown > 0 || !this.attiva) return;
    const obiettivo = this.lupiBase
      .filter((lupo) => lupo.vivo)
      .sort((a, b) => {
        const da = Math.hypot(this.giocatore.posizione.x - a.x, this.giocatore.posizione.z - a.z);
        const db = Math.hypot(this.giocatore.posizione.x - b.x, this.giocatore.posizione.z - b.z);
        return da - db;
      })
      .find((lupo) => Math.hypot(this.giocatore.posizione.x - lupo.x, this.giocatore.posizione.z - lupo.z) < CONFIG.segheria.raggioAttaccoLupo + (auto ? 0.4 : 0));

    if (!obiettivo) return;
    this.giocatore.colpisciAscia();
    this.attaccoCooldown = CONFIG.segheria.attaccoCooldown;
    this.colpisciLupo(obiettivo);
  }

  // Un colpo a un lupo (ascia del boscaiolo, freccia di un arciere o ascia del cacciatore):
  // lampeggia e perde "danno" tacche di vita (di solito 1: servono 3 colpi); a zero muore e lascia la carne a terra
  colpisciLupo(lupo, danno = 1) {
    if (!lupo.vivo) return;
    lupo.hp -= danno;
    lupo.flash = 0.5;
    lupo.lampo = 0.42;
    lupo.gruppo.position.x += 0.14;
    lupo.gruppo.position.z += 0.1;
    this.effetti.testo(lupo.x, 1.6, lupo.z, `-${danno}`, 'cattivo');
    for (let i = 0; i < 3; i++) {
      const cella = lupo.celle[i];
      if (cella) cella.material.color.set(i < lupo.hp ? 0x6fe17d : 0x3b4149);
    }

    if (lupo.hp <= 0) {
      lupo.vivo = false;
      lupo.gruppo.visible = false;
      lupo.barra.visible = false;
      const drop = creaCarne();
      drop.position.set(lupo.x, 0.35, lupo.z);
      drop.scale.setScalar(0.8);
      this.radice.add(drop);
      this.carneCadute.push({ mesh: drop, x: lupo.x, z: lupo.z, preso: false });
      this.effetti.testo(lupo.x, 1.8, lupo.z, '+carne', 'buono');
    }
  }

  // ---------------- MIGLIORAMENTI ----------------

  // Il boscaiolo sta sul cerchio: le monete volano dentro un po' alla volta
  gestisceMiglioramenti(pos, dt) {
    for (const [nome, cerchio] of Object.entries(this.cerchi)) {
      cerchio.aggiorna(dt);
      if (this.regia || !cerchio.contiene(pos)) continue;
      const rata = cerchio.prossimaRata(this.stato.soldi, dt);
      if (rata <= 0) continue;
      this.stato.soldi -= rata;
      const partenza = pos.clone().setY(1.4);
      this.effetti.lancia('soldi', partenza, cerchio, 0, () => {
        if (cerchio.riceviRata(rata)) this.completaMiglioramento(nome);
      }, { durata: 0.35, altezza: 1.2, scala: 0.8, sbuffo: false });
    }
  }

  // Un livello è pagato tutto: il miglioramento compare e il cerchio passa al livello successivo
  // Se compare lontano o fuori dallo schermo, la telecamera va a vederlo (vedi aggiornaRegia).
  completaMiglioramento(nome) {
    const cerchio = this.cerchi[nome];
    const livello = cerchio.livello;
    cerchio.passaAlSuccessivo();
    const { x, z } = cerchio.posizione;
    this.effetti.testo(x, 2.2, z, `${livello.nome}!`, 'buono');
    this.effetti.sbuffo(x, 0.4, z, 0x9be37a, 24, 3.5);
    const tappe = this.tappeDelMiglioramento(nome, livello);
    const daMostrare = tappe.filter((tappa) => tappa.sempre || !this.visibile(tappa.punto));
    for (const tappa of tappe) if (!daMostrare.includes(tappa)) tappa.azione();
    if (daMostrare.length > 0) this.regia = { tappe: daMostrare, indice: 0, tempo: 0, nome: livello.nome };
    this.salvaOra();
  }

  // Le "tappe" di un miglioramento appena comprato: dove compare (punto), come inquadrarlo (zoom),
  // quanto guardarlo (sosta) e cosa far comparire lì (azione, con l'animazione della costruzione).
  // sempre = la telecamera ci va anche se il punto si vede (le mura fanno il giro di tutta la base).
  // Quello che non si vede (riparazione, venditori e cacciatore più svelti) funziona subito, senza tappe.
  tappeDelMiglioramento(nome, livello) {
    const comprati = this.cerchi[nome].comprati;
    const tappa = (punto, azione, { zoom = 0.8, sempre = false, sosta = CONFIG.regia.sosta } = {}) => (
      { punto: punto.clone(), azione, zoom, sempre, sosta }
    );
    if (nome === 'mura') {
      return [tappa(new THREE.Vector3(0, 0, 0), () => this.mura.applicaLivello(comprati, true), { zoom: 1.5, sempre: true, sosta: 2.4 })];
    }
    if (nome === 'torretta') {
      this.torrette.imposta(comprati);
      const prima = CONFIG.miglioramenti.torretta[comprati - 2];
      const tappe = [];
      // le torri nuove spuntano dal basso...
      for (let i = prima?.torri ?? 0; i < livello.torri; i++) {
        tappe.push(tappa(this.torrette.torri[i].posizione, () => this.torrette.mostraTorre(i, true)));
      }
      // ...e con "Potenzia arcieri" tutte le torri diventano più robuste, una alla volta
      if ((prima?.aspetto ?? 0) !== livello.aspetto) {
        this.torrette.torri.forEach((torre, i) => tappe.push(tappa(torre.posizione, () => this.torrette.aggiornaAspetto(i, true))));
      }
      return tappe;
    }
    if (nome === 'aiutante') {
      if (this.aiutante) return [];
      return [tappa(this.catasta.posizione.clone().add(new THREE.Vector3(0, 0, 1)), () => (this.aiutante = this.creaAiutante(true)))];
    }
    if (nome === 'cacciatore') {
      if (this.cacciatore) {
        this.cacciatore.livello = livello;
        return [];
      }
      return [tappa(MAPPA.casaCacciatore, () => (this.cacciatore = new Cacciatore(this, livello)))];
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

  // Il livello comprato di una catena (null = non ancora comprato)
  livelloComprato(nome) {
    return CONFIG.miglioramenti[nome][this.cerchi[nome].comprati - 1] ?? null;
  }

  // All'avvio: ciò che era già stato comprato c'è subito, senza animazioni e senza spostare la telecamera.
  // La riparazione non ha bisogno di niente: si legge il suo livello a ogni fotogramma.
  ripristinaMiglioramenti() {
    this.mura.applicaLivello(this.cerchi.mura.comprati, false);
    this.aiutante = this.cerchi.aiutante.comprati > 0 ? this.creaAiutante(false) : null;
    this.torrette.imposta(this.cerchi.torretta.comprati);
    for (let i = 0; i < this.torrette.quanteTorri; i++) {
      this.torrette.mostraTorre(i, false);
      this.torrette.aggiornaAspetto(i, false);
    }
    const cacciatore = this.livelloComprato('cacciatore');
    if (cacciatore) {
      this.cacciatore = new Cacciatore(this, cacciatore);
      this.cacciatore.comparsa = 1;
    }
    const venditore = this.livelloComprato('venditore');
    if (venditore) {
      this.venditori = Object.values(this.sportelli).map((sportello) => this.creaVenditore(sportello, false));
      this.clienti.rapidita = venditore.rapidita;
    }
  }

  // Il venditore dello sportello LEGNA prende la merce dalla catasta, quello della CARNE dalla dispensa
  creaVenditore(sportello, conAnimazione) {
    const magazzino = sportello.tipo === 'legna' ? this.catasta : this.dispensa;
    const venditore = new Venditore(this.radice, sportello, magazzino, this.effetti, this.inVolo);
    if (!conAnimazione) venditore.comparsa = 1;
    return venditore;
  }

  // ---------------- TELECAMERA SUL MIGLIORAMENTO ----------------

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
        this.effetti.testo(tappa.punto.x, 4, tappa.punto.z, `${r.nome}!`, 'buono');
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

  // ---------------- OGNI FOTOGRAMMA ----------------

  aggiorna(dt) {
    // mentre la telecamera guarda un miglioramento appena comprato il boscaiolo resta fermo
    const direzione = this.regia ? { x: 0, y: 0 } : this.joystick.leggi();
    if (!this.haCamminato && (direzione.x || direzione.y)) {
      this.haCamminato = true;
      this.schermate.nascondiSuggerimento();
    }
    // le mura bloccano sempre; le ante dei cancelli solo quando sono chiuse
    this.giocatore.ostacoli = [...this.ostacoliFissi, ...Object.values(this.cancelli).flatMap((cancello) => cancello.ostacoli)];
    this.giocatore.aggiorna(dt, direzione);
    const pos = this.giocatore.posizione;
    this.attaccoCooldown = Math.max(0, this.attaccoCooldown - dt);
    this.tempoGioco += dt;

    this.aggiornaLupi(dt);
    this.torrette.aggiorna(dt, this.lupiBase, (lupo, danno) => this.colpisciLupo(lupo, danno));
    this.riparaMura(dt);
    this.mura.aggiorna(dt);
    this.schermate.aggiornaMura(this.mura.ratio);

    // carne lasciata dai lupi (fuori dalle mura): si raccoglie passandoci sopra
    for (const drop of this.carneCadute) {
      const d = Math.hypot(pos.x - drop.x, pos.z - drop.z);
      if (d < 1.0 && !drop.preso) {
        drop.preso = true;
        this.radice.remove(drop.mesh);
        this.giocatore.aggiungi('carne', CONFIG.segheria.unitaPerPezzo);
        this.effetti.testo(drop.x, 1.8, drop.z, `+${CONFIG.segheria.unitaPerPezzo} carne`, 'buono');
      }
    }
    this.carneCadute = this.carneCadute.filter((drop) => !drop.preso);

    this.gestisceMiglioramenti(pos, dt);

    // --- Raccolta e scarico, un pezzo alla volta (nessun limite di carico) ---
    this.attesaRaccolta -= dt;
    if (this.attesaRaccolta <= 0) {
      let fatto = false;
      if (this.catasta.contiene(pos) && this.catasta.quantita > 0) {
        fatto = this.raccogli(this.catasta, 'legna');
      } else if (this.dispensa.contiene(pos) && this.dispensa.quantita > 0) {
        fatto = this.raccogli(this.dispensa, 'carne');
      } else {
        // sul punto di deposito di uno sportello scarica solo la merce di quello sportello
        const sportello = Object.values(this.sportelli).find((sp) => sp.vicino(pos) && this.giocatore.ha(sp.tipo));
        if (sportello) fatto = this.scarica(sportello);
      }
      if (fatto) this.attesaRaccolta = CONFIG.segheria.intervalloRaccolta;
      else this.trasferimento = null;
    }

    // --- Soldi a terra accanto agli sportelli ---
    for (const sportello of Object.values(this.sportelli)) {
      if (sportello.soldi.valore > 0 && sportello.soldi.contiene(pos)) this.raccogliSoldi(sportello.soldi);
    }

    // --- Tutto il resto ---
    for (const sportello of Object.values(this.sportelli)) sportello.aggiorna(dt);
    this.aiutante?.aggiorna(dt);
    this.cacciatore?.aggiorna(dt);
    for (const venditore of this.venditori) venditore.aggiorna(dt);
    this.clienti.aggiorna(dt);
    this.effetti.aggiorna(dt);
    if (this.regia) this.aggiornaRegia(dt);
    else this.ambiente.segui(pos, dt);

    // --- Cancelli: si aprono quando il boscaiolo si avvicina; da quello della corsa si parte ---
    this.cancelli.foresta.aggiorna(dt, pos, this.cacciatore ? [this.cacciatore.posizione] : []);
    if (this.cancelli.corsa.aggiorna(dt, pos)) {
      this.cancelli.corsa.azzera();
      this.alPartenzaCorsa();
      return;
    }

    // --- Barra in alto ---
    this.schermate.aggiornaSegheria({
      soldi: this.stato.soldi,
      legna: this.catasta.quantita,
      carne: this.dispensa.quantita,
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
    }, VOLO_CORTO);
    return true;
  }

  // Un pezzo di quel tipo vola dalla schiena alla pila dello sportello
  scarica(sportello) {
    const tipo = sportello.tipo;
    const partenza = this.giocatore.cimaSchiena(new THREE.Vector3(), tipo);
    const quantita = this.giocatore.togli(tipo, this.pezzoDelTrasferimento(`scarica-${tipo}`, this.giocatore.carico[tipo]));
    if (quantita <= 0) return false;
    this.inVolo[tipo] += quantita;
    this.effetti.lancia(tipo, partenza, sportello, 0, () => {
      this.inVolo[tipo] -= quantita;
      sportello.aggiungi(quantita);
    }, VOLO_CORTO);
    return true;
  }

  // Tutti i soldi di una pila volano verso il boscaiolo (divisi in qualche mazzetta)
  raccogliSoldi(pila) {
    const totale = pila.prendiTutto();
    const mazzette = Math.min(8, Math.max(1, Math.ceil(totale / CONFIG.economia.soldiPerMazzetta)));
    let rimasti = totale;
    for (let i = 0; i < mazzette; i++) {
      const parte = i === mazzette - 1 ? rimasti : Math.floor(totale / mazzette);
      rimasti -= parte;
      this.inVolo.soldi += parte;
      const partenza = pila.posizione.clone().add(new THREE.Vector3((Math.random() - 0.5) * 0.5, 0.2 + i * 0.05, (Math.random() - 0.5) * 0.4));
      const verso = (v) => v.copy(this.giocatore.posizione).setY(1.4);
      this.effetti.lancia('soldi', partenza, verso, i * 0.05, () => {
        this.inVolo.soldi -= parte;
        this.stato.soldi += parte;
      }, { durata: 0.35, altezza: 1.2, sbuffo: false });
    }
    this.effetti.testo(this.giocatore.posizione.x, 2.4, this.giocatore.posizione.z, `+${totale} $`, 'buono');
  }

  // Scrive i progressi sul dispositivo
  salvaOra() {
    const s = this.stato;
    // ciò che è in volo (o in mano ai lavoratori) viene salvato "a casa" (catasta, dispensa, tasca) per non perderlo mai
    const inMano = { legna: this.aiutante?.carico ?? 0, carne: this.cacciatore?.carico ?? 0 };
    for (const venditore of this.venditori) inMano[venditore.tipo] += venditore.carico;
    s.catasta = this.catasta.quantita + this.inVolo.legna + inMano.legna;
    s.dispensa = this.dispensa.quantita + this.inVolo.carne + inMano.carne;
    s.soldi = Math.round(s.soldi);
    s.schiena = { ...this.giocatore.carico };
    s.sportelli = { legna: this.sportelli.legna.quantita, carne: this.sportelli.carne.quantita };
    s.soldiSportelli = { legna: this.sportelli.legna.soldi.valore + this.inVolo.soldi, carne: this.sportelli.carne.soldi.valore };
    s.miglioramenti = {};
    for (const [nome, cerchio] of Object.entries(this.cerchi)) {
      s.miglioramenti[nome] = { comprati: cerchio.comprati, pagato: cerchio.pagato + cerchio.inArrivo };
    }
    salva(s);
  }

  disegna() {
    this.renderer.render(this.scena, this.telecamera);
  }
}
