// =====================================================================
//  SQUADRA DI BOSCAIOLI
//  Tiene il conto di quanti boscaioli ci sono, dove si trova la squadra
//  e disegna la folla di omini che corrono (o tagliano, o si fermano).
//
//  FORMAZIONE: gli omini stanno in file ordinate e compatte. La squadra non
//  diventa mai più larga di "larghezzaMassimaFolla": se gli omini sono tanti,
//  la formazione si allunga all'indietro invece di allargarsi.
//
//  URTI: ogni omino ha il suo piccolo ingombro. Se un sasso tocca solo
//  il bordo della squadra, muoiono solo gli omini che lo toccano davvero.
//  Al loro posto resta un "buco" che si richiude poco dopo, quando la
//  squadra è di nuovo al sicuro (così nessun altro omino ci finisce contro).
//
//  Per disegnare tanti omini velocemente usiamo le "InstancedMesh":
//  ogni pezzo del boscaiolo (berretto, barba, gamba...) viene disegnato
//  una volta sola per TUTTI gli omini insieme.
// =====================================================================

import * as THREE from 'three';
import { CONFIG } from '../config.js';
import { partiBoscaiolo, PERNI } from '../modelli/boscaiolo.js';

const PAUSA_PRIMA_DI_RICOMPATTARE = 0.7; // secondi senza urti prima di richiudere i buchi

export class Squadra {
  constructor(genitore) {
    this.numero = CONFIG.squadra.boscaioliIniziali; // quanti boscaioli ci sono davvero
    this.x = 0;          // posizione a destra/sinistra (metri)
    this.distanza = 0;   // metri percorsi dalla partenza
    this.y = 0;          // altezza (serve nella salita finale)
    this.azione = 'ferma'; // 'corre', 'taglia' oppure 'ferma'
    this.tempoDallUltimoUrto = 99;

    // Il gruppo che contiene tutti gli omini: spostando lui si sposta la folla
    this.radice = new THREE.Group();
    genitore.add(this.radice);

    // Un'InstancedMesh per ogni pezzo del boscaiolo.
    // Spazio doppio rispetto ai visibili: durante gli urti restano per un attimo anche gli omini che stanno sparendo.
    this.capienza = CONFIG.squadra.massimoVisibili * 2;
    this.parti = partiBoscaiolo().map((parte) => {
      const mesh = new THREE.InstancedMesh(parte.geometria, parte.materiale, this.capienza);
      mesh.castShadow = true;
      mesh.frustumCulled = false; // gli omini si muovono: non lasciamo che Three.js li nasconda per errore
      mesh.count = 0;
      this.radice.add(mesh);
      return { ...parte, mesh };
    });

    // Gli omini in formazione (compresi quelli appena caduti, che lasciano un buco)
    this.omini = [];
    this.sincronizza();

    // Oggetti di appoggio per i calcoli (creati una volta sola)
    this._mOmino = new THREE.Matrix4();
    this._mPerno = new THREE.Matrix4();
    this._mFinale = new THREE.Matrix4();
    this._q = new THREE.Quaternion();
    this._e = new THREE.Euler();
    this._v = new THREE.Vector3();
    this._s = new THREE.Vector3();
  }

  // Quanti omini dovrebbero essere in piedi e visibili
  get visibili() {
    return Math.min(this.numero, CONFIG.squadra.massimoVisibili);
  }

  get spaziatura() {
    return CONFIG.squadra.distanzaTraOmini;
  }

  // Quante colonne ha la formazione (mai più larga del massimo consentito)
  get colonne() {
    const n = Math.max(1, this.omini.length);
    const massimo = Math.floor(CONFIG.squadra.larghezzaMassimaFolla / this.spaziatura) + 1;
    return Math.max(1, Math.min(massimo, Math.ceil(Math.sqrt(n))));
  }

  get file() {
    return Math.ceil(Math.max(1, this.omini.length) / this.colonne);
  }

  // Metà della larghezza della squadra (dal centro al bordo, metri)
  get semiLarghezza() {
    const colonneUsate = Math.min(this.colonne, Math.max(1, this.omini.length));
    return ((colonneUsate - 1) / 2) * this.spaziatura + CONFIG.squadra.raggioCollisioneOmino + 0.1;
  }

  // Metà della profondità della squadra (dal centro alla prima fila, metri)
  get semiProfondita() {
    return ((this.file - 1) / 2) * this.spaziatura * 0.9 + CONFIG.squadra.raggioCollisioneOmino + 0.1;
  }

  // Cambia il numero di boscaioli (porte, salita): mai sotto zero, sempre intero
  imposta(nuovoNumero) {
    this.numero = Math.max(0, Math.floor(nuovoNumero));
    this.sincronizza();
  }

  // Aggiunge o toglie omini disegnati finché corrispondono al numero vero
  sincronizza() {
    let vivi = this.omini.filter((o) => o.vivo).length;
    const obiettivo = this.visibili;
    // Troppi: si tolgono dal fondo della formazione
    for (let i = this.omini.length - 1; i >= 0 && vivi > obiettivo; i--) {
      if (this.omini[i].vivo) {
        this.omini.splice(i, 1);
        vivi--;
      }
    }
    // Pochi: i nuovi nascono al centro, piccoli, e poi "spuntano"
    while (vivi < obiettivo && this.omini.length < this.capienza) {
      this.omini.push({
        x: (Math.random() - 0.5) * 0.4,
        z: (Math.random() - 0.5) * 0.4,
        fase: Math.random() * Math.PI * 2,
        scala: 0,
        vivo: true,
      });
      vivi++;
    }
  }

  // Posizione nel mondo dell'omino numero i: { x, distanza }
  posizioneOmino(i) {
    const o = this.omini[i];
    return { x: this.x + o.x, distanza: this.distanza - o.z };
  }

  // Quali omini (ancora in piedi) toccano un oggetto rotondo in quel punto?
  ominiCheToccano(x, distanza, raggioOggetto) {
    const portata = raggioOggetto + CONFIG.squadra.raggioCollisioneOmino;
    // Controllo veloce: l'oggetto è almeno vicino alla squadra?
    if (Math.abs(x - this.x) > this.semiLarghezza + portata + 0.5) return [];
    if (Math.abs(distanza - this.distanza) > this.semiProfondita + portata + 0.5) return [];
    const indici = [];
    for (let i = 0; i < this.omini.length; i++) {
      if (!this.omini[i].vivo) continue;
      const p = this.posizioneOmino(i);
      if (Math.hypot(p.x - x, p.distanza - distanza) < portata) indici.push(i);
    }
    return indici;
  }

  // Elimina gli omini indicati (es. quelli che toccano una roccia).
  // Restituisce quanti boscaioli VERI sono stati persi e dove erano gli omini.
  // "persiEsatti" (facoltativo) = quanti boscaioli veri togliere, qualunque sia il numero di omini.
  elimina(indici, persiEsatti) {
    if (indici.length === 0) return { persi: 0, posizioni: [] };
    const vivi = this.omini.filter((o) => o.vivo).length;
    // Se ci sono più boscaioli di quelli disegnati, ogni omino "vale" più di un boscaiolo
    const valore = vivi > 0 ? this.numero / vivi : 1;
    const persi = Math.min(
      this.numero,
      persiEsatti ?? Math.max(indici.length, Math.round(indici.length * valore))
    );
    const posizioni = indici.map((i) => this.posizioneOmino(i));
    for (const i of indici) this.omini[i].vivo = false;
    this.numero -= persi;
    this.tempoDallUltimoUrto = 0;
    this.sincronizza();
    return { persi, posizioni };
  }

  // Posto di ogni omino nella formazione: file ordinate, la fila 0 è davanti
  posto(i) {
    const s = this.spaziatura;
    const colonne = this.colonne;
    const file = this.file;
    const fila = Math.floor(i / colonne);
    const colonna = i % colonne;
    const inQuestaFila = fila === file - 1 ? this.omini.length - fila * colonne : colonne;
    // piccolo spostamento casuale (sempre uguale per lo stesso omino) per un aspetto più naturale
    const tremolio = Math.sin(i * 12.9898) * 0.05;
    return {
      x: (colonna - (inQuestaFila - 1) / 2) * s + (fila % 2 ? 0.06 : -0.06) + tremolio,
      z: (fila - (file - 1) / 2) * s * 0.9 + Math.cos(i * 4.1) * 0.04,
    };
  }

  // Aggiorna la posizione della folla e anima gli omini
  aggiorna(dt, tempo) {
    this.radice.position.set(this.x, this.y, -this.distanza);

    // Quando la squadra è di nuovo al sicuro, si richiudono i buchi lasciati dagli omini caduti
    this.tempoDallUltimoUrto += dt;
    if (this.tempoDallUltimoUrto > PAUSA_PRIMA_DI_RICOMPATTARE) {
      this.omini = this.omini.filter((o) => o.vivo || o.scala > 0);
    }

    const velocitaPasso = this.azione === 'corre' ? 14 : this.azione === 'taglia' ? 9 : 0;
    const dimensione = CONFIG.squadra.dimensioneOmino;

    for (let i = 0; i < this.omini.length; i++) {
      const o = this.omini[i];
      if (o.vivo) {
        // Ogni omino va piano piano verso il suo posto nella formazione
        const posto = this.posto(i);
        const morbidezza = Math.min(1, dt * 7);
        o.x += (posto.x - o.x) * morbidezza;
        o.z += (posto.z - o.z) * morbidezza;
        o.scala = Math.min(1, o.scala + dt * 4);
      } else {
        // L'omino caduto si rimpicciolisce e sparisce
        o.scala = Math.max(0, o.scala - dt * 5);
      }
      o.fase += dt * velocitaPasso;

      const passo = Math.sin(o.fase);
      const saltello = this.azione === 'corre' && o.vivo ? Math.abs(passo) * 0.06 : 0;

      // Matrice dell'omino intero (posizione nella folla + dimensione)
      this._v.set(o.x, saltello, o.z);
      this._q.identity();
      this._s.setScalar(o.scala * dimensione);
      this._mOmino.compose(this._v, this._q, this._s);

      // Angoli di gambe e braccia per questo fotogramma
      const angoli = this.angoliArti(passo, o.fase);

      for (const parte of this.parti) {
        const perno = PERNI[parte.perno];
        this._e.set(angoli[parte.perno] || 0, 0, 0);
        this._q.setFromEuler(this._e);
        this._mPerno.compose(perno, this._q, this._s.setScalar(1));
        this._mFinale.multiplyMatrices(this._mOmino, this._mPerno).multiply(parte.matrice);
        parte.mesh.setMatrixAt(i, this._mFinale);
      }
    }

    for (const parte of this.parti) {
      parte.mesh.count = this.omini.length;
      parte.mesh.instanceMatrix.needsUpdate = true;
    }
  }

  // Come si muovono gambe e braccia: corsa, colpi d'ascia o fermi
  // (angolo positivo = l'arto va in avanti)
  angoliArti(passo, fase) {
    if (this.azione === 'corre') {
      return { gambaSx: passo * 0.7, gambaDx: -passo * 0.7, braccioSx: -passo * 0.6, braccioDx: passo * 0.3 + 0.3 };
    }
    if (this.azione === 'taglia') {
      // il braccio destro alza l'ascia sopra la testa e la abbatte in avanti
      const colpo = (Math.sin(fase * 1.5) + 1) / 2;
      return { braccioDx: 0.8 + 1.8 * colpo, braccioSx: 0.4 };
    }
    return {};
  }
}
