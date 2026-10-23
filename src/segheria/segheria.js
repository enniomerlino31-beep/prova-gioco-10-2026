// =====================================================================
//  SEGHERIA: il "regista" della base
//  Mette insieme ambiente, boscaiolo, catasta, dispensa, tavolino,
//  pila di soldi, clienti e cancello. A ogni fotogramma:
//   - muove il boscaiolo con il joystick
//   - raccoglie/scarica pezzi quando il boscaiolo è nella zona giusta
//   - fa comprare i clienti
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
import { Tavolino } from './tavolino.js';
import { PilaSoldi } from './soldi.js';
import { Clienti } from './clienti.js';
import { Cancello } from './cancello.js';
import { creaLupo } from '../modelli/lupo.js';
import { creaCarne } from '../modelli/carne.js';

const OGNI_QUANTO_SALVARE = 2; // secondi

// Opzioni dei voli dentro la segheria (più brevi e piccoli di quelli della corsa)
const VOLO_CORTO = { durata: 0.35, altezza: 1.4, scala: 0.55, sbuffo: false };

export class Segheria {
  // alPartenzaCorsa: funzione chiamata quando il boscaiolo entra nel cancello
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
    for (const pezzo of s.schiena) this.giocatore.aggiungi(pezzo.tipo, pezzo.quantita);
    this.catasta = new Deposito(this.radice, 'legna', MAPPA.catasta, s.catasta);
    this.dispensa = new Deposito(this.radice, 'carne', MAPPA.dispensa, s.dispensa);
    this.tavolino = new Tavolino(this.radice, MAPPA.tavolino, s.tavolino);
    this.pilaSoldi = new PilaSoldi(this.radice, MAPPA.soldi, s.soldiATerra);
    this.cancello = new Cancello(this.radice, MAPPA.cancello);

    // Merce e soldi "in volo": se la pagina si chiude a metà volo, nel salvataggio non si perdono
    this.inVolo = { legna: 0, carne: 0, soldi: 0 };

    this.clienti = new Clienti(this.radice, this.tavolino, this.pilaSoldi, this.effetti, this.inVolo, (tipo, quantita, incasso) =>
      registraVendita(this.stato, tipo, quantita, incasso)
    );

    this.attesaRaccolta = 0;
    this.attesaSalvataggio = OGNI_QUANTO_SALVARE;
    this.attiva = false;
    this.haCamminato = false;
    this.mura = { hp: CONFIG.segheria.hpMura, maxHp: CONFIG.segheria.hpMura, livello: 1, flash: 0, pali: ambiente.palizzata?.userData?.pali ?? [] };
    this.tempoGioco = 0;
    this.prossimoLupo = 60;
    this.lupiBase = this.creaLupiBase();
    this.attaccoCooldown = 0;
    this.carneCadute = [];
    this.miglioramenti = [
      { id: 'mura-pietra', prezzo: 80, iconeClass: 'stone', posizione: new THREE.Vector3(-6.6, 0, -1.8), visible: true, progress: 0 },
      { id: 'lavoratore', prezzo: 120, iconeClass: 'axe', posizione: new THREE.Vector3(0.2, 0, -4.2), visible: false, progress: 0 },
      { id: 'mura-cemento', prezzo: 180, iconeClass: 'cement', posizione: new THREE.Vector3(6.6, 0, -1.8), visible: false, progress: 0 },
    ];
    this.miglioramenti[1].bloccato = true;
    this.miglioramenti[2].bloccato = true;
    this.schermate.setMiglioramenti(this.miglioramenti);
    this.aggiornaMuraVisiva();

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
    this.attiva = true;
    this.giocatore.riposiziona();
    this.cancello.azzera();
    this.ambiente.reimpostaTelecamera();
    this.ambiente.segui(this.giocatore.posizione, 0);
    this.joystick.attivo = true;
    this.schermate.mostraSegheria(!this.haCamminato);
    this.schermate.aggiornaMura(this.mura.hp / this.mura.maxHp);
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

  creaLupiBase() {
    const puntiMura = [
      { x: -8.8, z: -5.2 }, { x: -8.8, z: 1.5 }, { x: -8.8, z: 5.2 },
      { x: 8.8, z: -5.2 }, { x: 8.8, z: 1.0 }, { x: 8.8, z: 5.2 },
      { x: -6.4, z: -6.2 }, { x: 6.4, z: -6.2 }, { x: -6.4, z: 6.2 }, { x: 6.4, z: 6.2 },
    ];
    const lupi = [
      { x: -12.2, z: -4.4, hp: CONFIG.segheria.hpLupo, vivo: false, obiettivo: puntiMura[0] },
      { x: 11.4, z: -3.2, hp: CONFIG.segheria.hpLupo, vivo: false, obiettivo: puntiMura[3] },
      { x: -9.8, z: 7.4, hp: CONFIG.segheria.hpLupo, vivo: false, obiettivo: puntiMura[8] },
      { x: 11.8, z: 6.8, hp: CONFIG.segheria.hpLupo, vivo: false, obiettivo: puntiMura[5] },
      { x: -13.2, z: 2.8, hp: CONFIG.segheria.hpLupo, vivo: false, obiettivo: puntiMura[1] },
    ];
    return lupi.map((lupo) => {
      const { gruppo } = creaLupo();
      gruppo.scale.setScalar(0.72);
      gruppo.position.set(lupo.x, 0, lupo.z);
      gruppo.rotation.y = Math.PI;
      gruppo.visible = false;
      const barra = new THREE.Group();
      barra.position.set(0, 1.4, 0);
      barra.visible = false;
      for (let i = 0; i < 3; i++) {
        const cella = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.05, 0.02), new THREE.MeshBasicMaterial({ color: 0x6fe17d }));
        cella.position.set(-0.18 + i * 0.18, 0, 0);
        barra.add(cella);
      }
      gruppo.add(barra);
      this.radice.add(gruppo);
      return { ...lupo, gruppo, barra, celle: barra.children, flash: 0, attacco: 0 };
    });
  }

  svegliaLupoCasuale() {
    const dormienti = this.lupiBase.filter((lupo) => !lupo.vivo);
    if (dormienti.length === 0) return;
    const lupo = dormienti[Math.floor(Math.random() * dormienti.length)];
    lupo.vivo = true;
    lupo.hp = CONFIG.segheria.hpLupo;
    lupo.flash = 0;
    lupo.attacco = 0;
    lupo.gruppo.visible = true;
    lupo.barra.visible = true;
    lupo.gruppo.position.set(lupo.x, 0, lupo.z);
    const cella = lupo.celle[0];
    if (cella) cella.material.color.set(0x6fe17d);
  }

  aggiornaMuraVisiva() {
    const ratio = this.mura.hp / this.mura.maxHp;
    const flash = Math.max(0, this.mura.flash);
    for (let i = 0; i < this.mura.pali.length; i++) {
      const palo = this.mura.pali[i];
      if (!palo) continue;
      const baseCol = new THREE.Color().setHSL(0.08 + (i / this.mura.pali.length) * 0.09, 0.43, 0.46 + (1 - ratio) * 0.12);
      if (flash > 0.02) {
        const rosso = new THREE.Color().lerpColors(baseCol, new THREE.Color(0xd63f33), 0.85);
        if (palo.material) palo.material.color.copy(rosso);
      } else if (palo.material) {
        palo.material.color.copy(baseCol);
      }
      const stress = 1 - ratio;
      if (stress > 0.15 && i % 2 === 0) palo.scale.y = 0.85 + ratio * 0.4;
      else palo.scale.y = 1;
    }
    this.schermate.aggiornaMura(ratio);
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
    obiettivo.hp -= 1;
    obiettivo.flash = 0.5;
    obiettivo.gruppo.position.x += 0.14;
    obiettivo.gruppo.position.z += 0.1;
    this.effetti.testo(obiettivo.x, 1.6, obiettivo.z, '-1', 'cattivo');
    for (let i = 0; i < 3; i++) {
      const cella = obiettivo.celle[i];
      if (cella) cella.material.color.set(i < obiettivo.hp ? 0x6fe17d : 0x3b4149);
    }

    if (obiettivo.hp <= 0) {
      obiettivo.vivo = false;
      obiettivo.gruppo.visible = false;
      obiettivo.barra.visible = false;
      const drop = creaCarne();
      drop.position.set(obiettivo.x, 0.35, obiettivo.z);
      drop.scale.setScalar(0.8);
      this.radice.add(drop);
      this.carneCadute.push({ mesh: drop, x: obiettivo.x, z: obiettivo.z, preso: false });
      this.effetti.testo(obiettivo.x, 1.8, obiettivo.z, '+carne', 'buono');
    }
  }

  aggiorna(dt) {
    const direzione = this.joystick.leggi();
    if (!this.haCamminato && (direzione.x || direzione.y)) {
      this.haCamminato = true;
      this.schermate.nascondiSuggerimento();
    }
    this.giocatore.aggiorna(dt, direzione);
    const pos = this.giocatore.posizione;
    this.attaccoCooldown = Math.max(0, this.attaccoCooldown - dt);
    this.tempoGioco += dt;
    this.mura.flash = Math.max(0, this.mura.flash - dt * 3);

    if (this.tempoGioco >= 60) {
      const maxAttivi = Math.min(this.lupiBase.length, 1 + Math.floor((this.tempoGioco - 60) / 120));
      const attivi = this.lupiBase.filter((lupo) => lupo.vivo).length;
      this.prossimoLupo -= dt;
      if (this.prossimoLupo <= 0 && attivi < maxAttivi) {
        this.svegliaLupoCasuale();
        this.prossimoLupo = 12 + Math.random() * 8;
      }
    }

    for (const lupo of this.lupiBase) {
      if (!lupo.vivo) continue;
      lupo.flash = Math.max(0, lupo.flash - dt * 2.5);
      const distanza = Math.hypot(this.giocatore.posizione.x - lupo.x, this.giocatore.posizione.z - lupo.z);
      const target = lupo.obiettivo ?? { x: -8.8, z: 4 };
      const versoX = (target.x - lupo.x) * 0.28;
      const versoZ = (target.z - lupo.z) * 0.28;
      const velocita = CONFIG.segheria.velocitaLupo;
      lupo.x += versoX * dt * velocita;
      lupo.z += versoZ * dt * velocita;
      const sollevamento = 0.2 + Math.sin((performance.now() * 0.004) + lupo.x) * 0.05 + lupo.flash * 0.5;
      lupo.gruppo.position.set(lupo.x, sollevamento, lupo.z);
      lupo.gruppo.rotation.y = Math.PI - Math.sign(versoX || 1) * 0.2;

      const daMura = Math.hypot(lupo.x - target.x, lupo.z - target.z);
      if (daMura < 1.1) {
        const prossimo = this.mura.pali && this.mura.pali.length ? this.mura.pali[Math.floor(Math.random() * this.mura.pali.length)] : null;
        if (prossimo) {
          lupo.obiettivo = { x: prossimo.position.x, z: prossimo.position.z };
        }
      }

      if (daMura < 1.7) {
        this.mura.hp = Math.max(0, this.mura.hp - CONFIG.segheria.dannoMura * dt);
        this.mura.flash = Math.min(0.52, this.mura.flash + 0.45);
        lupo.attacco += dt;
        if (lupo.attacco > 0.9) {
          lupo.attacco = 0;
        }
      }

      if (distanza < 1.4) {
        this.giocatore.posizione.x += (this.giocatore.posizione.x - lupo.x) * dt * 0.18;
        this.giocatore.posizione.z += (this.giocatore.posizione.z - lupo.z) * dt * 0.18;
      }

      if (distanza < 1.8 && this.attaccoCooldown <= 0) {
        this.attaccaLupi(true);
      }
    }

    if (this.mura.hp <= 0) {
      this.mura.hp = 0;
      this.mura.livello = 0;
    }
    this.aggiornaMuraVisiva();

    for (const drop of this.carneCadute) {
      const d = Math.hypot(pos.x - drop.x, pos.z - drop.z);
      if (d < 1.0 && !drop.preso) {
        drop.preso = true;
        this.radice.remove(drop.mesh);
        this.giocatore.aggiungi('carne', 1);
        this.effetti.testo(drop.x, 1.8, drop.z, '+1 carne', 'buono');
      }
    }
    this.carneCadute = this.carneCadute.filter((drop) => !drop.preso);

    this.gestisceMiglioramenti(pos);
    this.schermate.aggiornaMiglioramenti(this.miglioramenti, this.giocatore.posizione);

    // --- Raccolta e scarico, un pezzo alla volta ---
    this.attesaRaccolta -= dt;
    if (this.attesaRaccolta <= 0) {
      let fatto = false;
      if (!this.giocatore.pieno && this.catasta.contiene(pos) && this.catasta.quantita > 0) {
        fatto = this.raccogli(this.catasta, 'legna');
      } else if (!this.giocatore.pieno && this.dispensa.contiene(pos) && this.dispensa.quantita > 0) {
        fatto = this.raccogli(this.dispensa, 'carne');
      } else if (this.tavolino.vicino(pos) && this.giocatore.pezzi.length > 0) {
        fatto = this.scarica();
      }
      if (fatto) this.attesaRaccolta = CONFIG.segheria.intervalloRaccolta;
    }

    // --- Soldi a terra ---
    if (this.pilaSoldi.valore > 0 && this.pilaSoldi.contiene(pos)) this.raccogliSoldi();

    // --- Tutto il resto ---
    this.tavolino.aggiorna(dt);
    this.clienti.aggiorna(dt);
    this.effetti.aggiorna(dt);
    this.ambiente.segui(pos, dt);

    // --- Cancello: si parte per una nuova corsa ---
    if (this.cancello.aggiorna(dt, pos)) {
      this.cancello.azzera();
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

  gestisceMiglioramenti(pos) {
    for (let i = 0; i < this.miglioramenti.length; i++) {
      const upgrade = this.miglioramenti[i];
      if (!upgrade.visible) continue;
      const d = Math.hypot(pos.x - upgrade.posizione.x, pos.z - upgrade.posizione.z);
      if (d < 0.9) {
        if (this.stato.soldi >= upgrade.prezzo) {
          upgrade.progress = Math.min(1, (upgrade.progress ?? 0) + 0.06);
          if (upgrade.progress >= 1) {
            this.stato.soldi -= upgrade.prezzo;
            upgrade.visible = false;
            upgrade.progress = 0;
            if (i < this.miglioramenti.length - 1) this.miglioramenti[i + 1].visible = true;
            const partenza = this.giocatore.cimaSchiena(new THREE.Vector3(), 'soldi');
            const arrivo = upgrade.posizione.clone().setY(0.2);
            for (let j = 0; j < 5; j++) {
              this.effetti.lancia('soldi', partenza, () => arrivo.clone(), j * 0.07, null, { durata: 0.5, altezza: 1.5, sbuffo: false });
            }
            this.effetti.testo(arrivo.x, 1.5, arrivo.z, `-${upgrade.prezzo} $`, 'cattivo');
            this.schermate.setMiglioramenti(this.miglioramenti);
            this.schermate.aggiornaMiglioramenti(this.miglioramenti, this.giocatore.posizione);
            break;
          }
        } else {
          upgrade.progress = 0;
        }
      } else {
        upgrade.progress = 0;
      }
    }
  }

  // Un pezzo vola dal deposito alla schiena del boscaiolo
  raccogli(deposito, tipo) {
    const partenza = deposito.cima();
    const quantita = deposito.prendiPezzo();
    if (quantita <= 0) return false;
    this.giocatore.inArrivo++;
    this.inVolo[tipo] += quantita;
    this.effetti.lancia(tipo, partenza, (v) => this.giocatore.cimaSchiena(v), 0, () => {
      this.giocatore.inArrivo--;
      this.inVolo[tipo] -= quantita;
      this.giocatore.aggiungi(tipo, quantita);
    }, VOLO_CORTO);
    return true;
  }

  // Il pezzo in cima alla schiena vola sul tavolino
  scarica() {
    const pezzo = this.giocatore.togliUltimo();
    if (!pezzo) return false;
    const partenza = this.giocatore.cimaSchiena();
    this.inVolo[pezzo.tipo] += pezzo.quantita;
    this.effetti.lancia(pezzo.tipo, partenza, this.tavolino, 0, () => {
      this.inVolo[pezzo.tipo] -= pezzo.quantita;
      this.tavolino.aggiungi(pezzo.tipo, pezzo.quantita);
    }, VOLO_CORTO);
    return true;
  }

  // Tutti i soldi a terra volano verso il boscaiolo (divisi in qualche mazzetta)
  raccogliSoldi() {
    const totale = this.pilaSoldi.prendiTutto();
    const mazzette = Math.min(8, Math.max(1, Math.ceil(totale / CONFIG.economia.soldiPerMazzetta)));
    let rimasti = totale;
    for (let i = 0; i < mazzette; i++) {
      const parte = i === mazzette - 1 ? rimasti : Math.floor(totale / mazzette);
      rimasti -= parte;
      this.inVolo.soldi += parte;
      const partenza = MAPPA.soldi.clone().add(new THREE.Vector3((Math.random() - 0.5) * 0.5, 0.2 + i * 0.05, (Math.random() - 0.5) * 0.4));
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
    // ciò che è in volo viene salvato "a casa" (catasta, dispensa, tasca) per non perderlo mai
    s.catasta = this.catasta.quantita + this.inVolo.legna;
    s.dispensa = this.dispensa.quantita + this.inVolo.carne;
    s.soldi = Math.round(s.soldi);
    const soldiInVolo = this.inVolo.soldi;
    s.schiena = this.giocatore.pezzi.map((p) => ({ tipo: p.tipo, quantita: p.quantita }));
    s.tavolino = { legna: this.tavolino.legna, carne: this.tavolino.carne };
    s.soldiATerra = this.pilaSoldi.valore + soldiInVolo;
    salva(s);
  }

  disegna() {
    this.renderer.render(this.scena, this.telecamera);
  }
}
