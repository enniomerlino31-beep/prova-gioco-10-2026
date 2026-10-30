// =====================================================================
//  AIUTANTE (si compra con il miglioramento "Aiutante")
//  Un boscaiolo con il berretto blu che lavora da solo, sempre con lo
//  stesso giro, in linea dritta:
//   1. davanti alla catasta prende la legna (al massimo "caricoMassimo")
//   2. la porta sul cerchio del deposito dello sportello LEGNA
//   3. la scarica sulla rastrelliera
//   4. torna alla catasta
//  Se la catasta è vuota aspetta lì, fermo, finché non arriva altra legna.
// =====================================================================

import * as THREE from 'three';
import { CONFIG } from '../config.js';
import { creaLavoratore } from '../modelli/boscaiolo.js';
import { animaPersona } from '../modelli/animazioni.js';
import { geometriaTronco, materialiTronco } from '../modelli/carro.js';
import { suoni } from '../motore/suoni.js';

const VOLO = { durata: 0.4, altezza: 1.3, scala: 0.55, sbuffo: false };
const VOLO_CADUTA = { ...VOLO, durata: 0.45, rimbalzo: true }; // quando lascia i tronchi sulla rastrelliera: arco e piccolo rimbalzo
const INTERVALLO_TRONCO = 0.17; // secondi tra un tronco e il successivo, quando li prende o li lascia

export class Aiutante {
  // inVolo: il conto della legna in volo (per il salvataggio)
  constructor(genitore, catasta, sportello, effetti, inVolo) {
    this.catasta = catasta;
    this.sportello = sportello;
    this.effetti = effetti;
    this.inVolo = inVolo;
    this.carico = 0;
    this.stato = 'catasta'; // 'catasta' (va a prendere), 'sportello' (va a scaricare), 'attesa' (la legna sta volando)
    this.comparsa = 0;      // animazione quando compare (da 0 a 1)
    this.sequenza = null;   // i tronchi che sta prendendo o lasciando, uno alla volta (vedi prendi e scarica)
    this.chinato = 0;       // quanto è piegato in avanti mentre prende o lascia i tronchi (da 0 a 1)
    this.tempo = 0;

    // I due soli punti del giro: davanti alla catasta e sul cerchio del deposito, sulla stessa linea
    this.puntoCatasta = catasta.posizione.clone().add(new THREE.Vector3(0, 0, 1.0));
    this.puntoSportello = new THREE.Vector3(this.puntoCatasta.x, 0, sportello.zona.z);
    this.posizione = this.puntoCatasta.clone();

    // berretto blu, per distinguerlo dal boscaiolo del giocatore
    this.modello = creaLavoratore({ berretto: 0x2f7fd6, berrettoScuro: 0x1f5fa8 });
    this.modello.rotation.order = 'YXZ'; // prima si gira, poi si china in avanti
    this.modello.scale.setScalar(0.001);
    this.modello.position.copy(this.posizione);
    genitore.add(this.modello);

    // i tronchi sulla schiena (si vedono solo quando porta qualcosa)
    this.schiena = new THREE.Group();
    this.schiena.position.set(0, 0.55, 0.24);
    for (let i = 0; i < 3; i++) {
      const tronco = new THREE.Mesh(geometriaTronco, materialiTronco);
      tronco.rotation.z = Math.PI / 2;
      tronco.scale.set(0.7, 0.32, 0.7);
      tronco.position.y = 0.06 + i * 0.2;
      tronco.castShadow = true;
      this.schiena.add(tronco);
    }
    this.schiena.visible = false;
    this.modello.userData.molla.add(this.schiena); // sulla "molla", così rimbalza con lui
  }

  aggiorna(dt) {
    // compare con un piccolo salto
    if (this.comparsa === 0) suoni.suona('comparsa'); // appena comprato: un suono breve mentre spunta
    this.comparsa = Math.min(1, this.comparsa + dt * 2);
    const c = this.comparsa;
    const scala = CONFIG.segheria.dimensioneBoscaiolo * 0.9 * (c < 1 ? c + Math.sin(c * Math.PI) * 0.35 : 1);
    this.modello.scale.setScalar(Math.max(0.001, scala));
    this.aggiornaPosa(dt);

    if (this.stato === 'catasta') {
      if (!this.cammina(this.puntoCatasta, dt)) return;
      this.guarda(-1); // arrivato: guarda la catasta
      if (this.catasta.quantita > 0) this.prendi();
    } else if (this.stato === 'sportello') {
      if (!this.cammina(this.puntoSportello, dt)) return;
      this.guarda(1); // arrivato: guarda la rastrelliera
      this.scarica();
    } else {
      this.cammina(this.posizione, dt); // fermo mentre la legna vola
      this.avanzaSequenza(dt);
    }
  }

  // Si china mentre prende o lascia i tronchi, poi si rialza; la pila sulla schiena ondeggia mentre cammina (si vede che pesa)
  aggiornaPosa(dt) {
    this.chinato += ((this.sequenza ? 1 : 0) - this.chinato) * Math.min(1, dt * 9);
    this.modello.rotation.x = -this.chinato * 0.4;
    this.tempo += dt;
    const peso = this.carico > 0 ? this.carico / CONFIG.lavoratori.caricoMassimo : 0;
    const moto = this.stato === 'attesa' ? 0 : 1;
    this.schiena.rotation.z = Math.sin(this.tempo * 6) * 0.12 * peso * moto;
    this.schiena.rotation.x = -Math.abs(Math.sin(this.tempo * 6)) * 0.08 * peso * moto;
    this.schiena.position.y = 0.55 - Math.abs(Math.sin(this.tempo * 6)) * 0.05 * peso * moto;
  }

  // 1. Prende la legna dalla catasta: si china e i tronchi (di 5 unità) volano uno alla volta sulla sua schiena; la catasta si abbassa a ogni tronco
  prendi() {
    this.stato = 'attesa';
    const pezzi = Math.ceil(Math.min(CONFIG.lavoratori.caricoMassimo, this.catasta.quantita) / CONFIG.segheria.unitaPerPezzo);
    this.sequenza = { tipo: 'prende', restano: pezzi, attesa: 0, inVolo: 0 };
  }

  // 3. Lascia la legna sulla rastrelliera: si china e i tronchi volano uno alla volta con un arco e un rimbalzo
  scarica() {
    this.stato = 'attesa';
    this.sequenza = { tipo: 'scarica', restano: Math.ceil(this.carico / CONFIG.segheria.unitaPerPezzo), attesa: 0, inVolo: 0 };
  }

  // Fa partire un tronco alla volta e, quando sono atterrati tutti, passa al compito dopo
  avanzaSequenza(dt) {
    const q = this.sequenza;
    if (!q) return;
    const unita = CONFIG.segheria.unitaPerPezzo;
    q.attesa -= dt;
    if (q.restano > 0 && q.attesa <= 0) {
      q.restano -= 1;
      q.attesa = INTERVALLO_TRONCO;
      if (q.tipo === 'prende') {
        const partenza = this.catasta.cima();
        const quantita = this.catasta.prendiPezzo(unita);
        if (quantita > 0) {
          q.inVolo += 1;
          this.inVolo.legna += quantita;
          this.effetti.lancia('legna', partenza, (v) => this.puntoSchiena(v), 0, () => {
            this.inVolo.legna -= quantita;
            this.carico += quantita;
            this.schiena.visible = true;
            q.inVolo -= 1;
            suoni.suona('legnaSchiena');
          }, VOLO);
        } else {
          q.restano = 0; // la catasta si è svuotata
        }
      } else {
        const quantita = Math.min(unita, this.carico);
        this.carico -= quantita;
        if (this.carico <= 0) this.schiena.visible = false;
        q.inVolo += 1;
        this.inVolo.legna += quantita;
        this.effetti.lancia('legna', this.puntoSchiena(new THREE.Vector3()), this.sportello, 0, () => {
          this.inVolo.legna -= quantita;
          this.sportello.aggiungi(quantita);
          q.inVolo -= 1;
          suoni.suona('legnaDeposito');
        }, VOLO_CADUTA);
      }
    }
    if (q.restano <= 0 && q.inVolo <= 0) {
      this.sequenza = null;
      this.stato = q.tipo === 'prende' && this.carico > 0 ? 'sportello' : 'catasta';
    }
  }

  // Da fermo guarda verso il fondo della base (-1, la catasta) o verso il davanti (1, lo sportello)
  guarda(verso) {
    this.modello.rotation.y = verso < 0 ? 0 : Math.PI;
  }

  puntoSchiena(risultato) {
    risultato.set(0, 0.8, 0);
    this.modello.updateMatrixWorld();
    return this.schiena.localToWorld(risultato);
  }

  // Cammina dritto verso un punto: restituisce true quando è arrivato
  cammina(obiettivo, dt) {
    const verso = obiettivo.clone().sub(this.posizione).setY(0);
    const distanza = verso.length();
    const passo = CONFIG.segheria.velocitaAiutante * dt;
    const arrivato = distanza <= passo;
    if (arrivato) this.posizione.copy(obiettivo);
    else {
      this.posizione.addScaledVector(verso, passo / distanza);
      this.modello.rotation.y = Math.atan2(-verso.x, -verso.z);
    }
    // passo con rimbalzo (vedi animazioni.js); a ogni passo un po' di neve
    if (animaPersona(this.modello, dt, arrivato ? 0 : 1, { carica: this.carico > 0 ? 0.5 : 0 })) {
      this.effetti.passo(this.modello, { grandezza: 1.2 });
    }
    this.modello.position.set(this.posizione.x, 0, this.posizione.z);
    return arrivato;
  }
}
