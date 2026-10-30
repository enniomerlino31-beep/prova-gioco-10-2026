// =====================================================================
//  EFFETTI SPECIALI (usati sia dalla corsa sia dalla segheria)
//  - oggetti che VOLANO da un punto a un altro (tronchi, carne, monete)
//    con un arco e una rotazione
//  - sbuffi di particelle: schegge di legno, neve, polvere
//  - polvere di neve sotto i piedi e scintille che brillano (raccolta, colpi)
//  - impronte nella neve (vedi impronte.js): stivali per le persone, zampe per i lupi
//  - testi volanti ("+12 legna", "-3", "+20" con la moneta), disegnati dalle schermate
// =====================================================================

import * as THREE from 'three';
import { CONFIG } from '../config.js';
import { geometriaTronco, materialiTronco } from '../modelli/carro.js';
import { creaCarne } from '../modelli/carne.js';
import { creaMucchietto, creaMoneta } from '../modelli/soldi.js';
import { Impronte } from './impronte.js';

const MASSIMO_PARTICELLE = 300;
const MASSIMO_SCINTILLE = 120;
const GRAVITA = 14;

export class Effetti {
  constructor(genitore, schermate) {
    this.genitore = genitore;
    this.schermate = schermate;
    this.voli = [];

    // Tutte le particelle sono cubetti disegnati insieme (molto veloce)
    this.particelle = [];
    const materiale = new THREE.MeshLambertMaterial({ color: 0xffffff });
    materiale.userData.daLiberare = true;
    this.cubetti = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), materiale, MASSIMO_PARTICELLE);
    this.cubetti.geometry.userData.daLiberare = true;
    this.cubetti.frustumCulled = false;
    this.cubetti.count = 0;
    // prepara il "colore per particella"
    this.cubetti.setColorAt(0, new THREE.Color(0xffffff));
    genitore.add(this.cubetti);

    // Le scintille sono rombi luminosi: il materiale "Basic" non ha ombre, così sembrano brillare
    this.scintilleAttive = [];
    const luce = new THREE.MeshBasicMaterial({ color: 0xffffff });
    luce.userData.daLiberare = true;
    this.rombi = new THREE.InstancedMesh(new THREE.OctahedronGeometry(1, 0), luce, MASSIMO_SCINTILLE);
    this.rombi.geometry.userData.daLiberare = true;
    this.rombi.frustumCulled = false;
    this.rombi.count = 0;
    this.rombi.setColorAt(0, new THREE.Color(0xffffff));
    genitore.add(this.rombi);

    this._m = new THREE.Matrix4();
    this._q = new THREE.Quaternion();
    this._e = new THREE.Euler();
    this._s = new THREE.Vector3();
    this._arrivo = new THREE.Vector3();
  }

  // Testo che sale e svanisce (es. "+12 legna"); icona: 'moneta' = con l'icona della moneta dopo il numero
  testo(x, y, z, testo, tipo, icona = null) {
    this.schermate.testoVolante(x, y, z, testo, tipo, icona);
  }

  // Sbuffo di particelle in un punto: colore e quantità a scelta
  sbuffo(x, y, z, colore, quante = 8, forza = 3) {
    for (let i = 0; i < quante; i++) {
      const angolo = Math.random() * Math.PI * 2;
      const v = forza * (0.4 + Math.random() * 0.8);
      this.aggiungi(this.particelle, MASSIMO_PARTICELLE, {
        posizione: new THREE.Vector3(x, y, z),
        velocita: new THREE.Vector3(Math.cos(angolo) * v, 2 + Math.random() * forza, Math.sin(angolo) * v),
        rotazione: new THREE.Vector3(Math.random() * 6, Math.random() * 6, 0),
        dimensione: 0.08 + Math.random() * 0.1,
        vita: 0,
        durata: 0.5 + Math.random() * 0.4,
        colore: new THREE.Color(colore).offsetHSL(0, 0, (Math.random() - 0.5) * 0.15),
        gravita: GRAVITA,
      });
    }
  }

  // Polvere di neve sollevata da un piede o da una zampa: pochi fiocchi bassi e lenti che svaniscono subito
  polvere(x, z, quante = 3, grandezza = 1) {
    for (let i = 0; i < quante; i++) {
      const angolo = Math.random() * Math.PI * 2;
      const v = (0.5 + Math.random() * 0.7) * grandezza;
      this.aggiungi(this.particelle, MASSIMO_PARTICELLE, {
        posizione: new THREE.Vector3(x + Math.cos(angolo) * 0.12, 0.05, z + Math.sin(angolo) * 0.12),
        velocita: new THREE.Vector3(Math.cos(angolo) * v, 0.6 + Math.random() * 0.6, Math.sin(angolo) * v),
        rotazione: new THREE.Vector3(Math.random() * 6, Math.random() * 6, 0),
        dimensione: (0.05 + Math.random() * 0.05) * grandezza,
        vita: 0,
        durata: 0.35 + Math.random() * 0.2,
        colore: new THREE.Color(0xf4f8ff),
        gravita: 3,
      });
    }
  }

  // Scintille che brillano (raccolta, monete, colpi): salgono girando, lampeggiano e svaniscono
  scintille(x, y, z, colore = 0xffe066, quante = 6, forza = 1.6) {
    for (let i = 0; i < quante; i++) {
      const angolo = Math.random() * Math.PI * 2;
      const v = forza * (0.3 + Math.random() * 0.7);
      this.aggiungi(this.scintilleAttive, MASSIMO_SCINTILLE, {
        posizione: new THREE.Vector3(x, y, z),
        velocita: new THREE.Vector3(Math.cos(angolo) * v, 1 + Math.random() * forza, Math.sin(angolo) * v),
        rotazione: new THREE.Vector3(0, Math.random() * 6, 0),
        dimensione: 0.07 + Math.random() * 0.05,
        vita: 0,
        durata: 0.45 + Math.random() * 0.25,
        colore: new THREE.Color(colore),
        gravita: 2,
        luccica: true,
      });
    }
  }

  // Le impronte si preparano solo la prima volta che servono (nella corsa non ci sono)
  get impronte() {
    this._impronte ??= new Impronte(this.genitore);
    return this._impronte;
  }

  // Un passo di una persona (boscaiolo, lavoratore, cliente): un'impronta di stivale sotto il piede
  // che tocca terra (uno a destra e uno a sinistra) e un po' di polvere di neve
  passo(modello, { polvere = 2, grandezza = 1 } = {}) {
    const { x, z } = modello.position;
    const angolo = modello.rotation.y;
    const scala = modello.scale.x;
    const lato = Math.sin(modello.userData.anim.fase) > 0 ? 1 : -1;
    const fianco = 0.09 * scala * lato; // il piede sta un po' di lato rispetto al centro
    this.impronte.aggiungi('stivale', x + Math.cos(angolo) * fianco, z - Math.sin(angolo) * fianco, angolo, 0.24 * scala, 0.36 * scala);
    this.polvere(x, z, polvere, grandezza);
  }

  // Un'impronta di zampa di lupo in (x, z), girata come "angolo"; scala = grandezza del lupo
  orma(x, z, angolo, scala) {
    this.impronte.aggiungi('zampa', x, z, angolo, 0.34 * scala, 0.34 * scala);
  }

  // Aggiunge una particella a un elenco; se è pieno toglie la più vecchia
  aggiungi(lista, massimo, particella) {
    if (lista.length >= massimo) lista.shift();
    lista.push(particella);
  }

  // Lancia un oggetto ('legna', 'carne', 'soldi' = un mucchietto di monete, o 'moneta') dal punto "da" fino alla destinazione.
  // destinazione: una funzione che restituisce il punto di arrivo (può muoversi!)
  //               oppure un oggetto con il metodo puntoDiArrivo(tipo) come il carro.
  // Quando atterra viene chiamata la funzione alArrivo (che aggiunge il carico).
  // opzioni: { durata, altezza, scala, sbuffo, rimbalzo }
  //   rimbalzo: true = quando atterra (e alArrivo è già stato chiamato) il tronco fa un piccolo rimbalzo sul posto prima di sparire
  //   (solo per destinazioni ferme, come la catasta o la rastrelliera)
  lancia(tipo, da, destinazione, ritardo, alArrivo, opzioni = {}) {
    let oggetto;
    if (tipo === 'carne') {
      oggetto = creaCarne();
      oggetto.scale.setScalar(1.3 * (opzioni.scala ?? 1));
    } else if (tipo === 'soldi') {
      oggetto = creaMucchietto();
      oggetto.scale.setScalar(1.4 * (opzioni.scala ?? 1));
    } else if (tipo === 'moneta') {
      oggetto = creaMoneta();
      oggetto.scale.multiplyScalar(1.8 * (opzioni.scala ?? 1));
    } else {
      oggetto = new THREE.Mesh(geometriaTronco, materialiTronco);
      oggetto.castShadow = true;
      if (opzioni.scala) oggetto.scale.setScalar(opzioni.scala);
    }
    oggetto.visible = false;
    oggetto.position.copy(da);
    this.genitore.add(oggetto);
    this.voli.push({
      tipo,
      oggetto,
      da: da.clone(),
      destinazione,
      tempo: -ritardo, // negativo = deve ancora partire
      durata: opzioni.durata ?? CONFIG.volo.durata,
      altezza: opzioni.altezza ?? CONFIG.volo.altezzaArco,
      sbuffo: opzioni.sbuffo ?? true,
      rimbalzo: Boolean(opzioni.rimbalzo),
      giri: new THREE.Vector3(5 + Math.random() * 4, (Math.random() - 0.5) * 4, 3 + Math.random() * 3),
      alArrivo,
    });
  }

  // Calcola dove deve arrivare un oggetto in volo
  puntoDiArrivo(volo) {
    if (typeof volo.destinazione === 'function') return volo.destinazione(this._arrivo);
    return volo.destinazione.puntoDiArrivo(volo.tipo, this._arrivo);
  }

  // Quanti oggetti sono ancora in volo (utile per sapere se un trasferimento è finito)
  get inVolo() {
    return this.voli.length;
  }

  aggiorna(dt) {
    // --- Oggetti in volo ---
    for (const volo of this.voli) {
      volo.tempo += dt;
      if (volo.tempo < 0) continue;
      volo.oggetto.visible = true;
      const k = Math.min(1, volo.tempo / volo.durata);
      // Il punto di arrivo può muoversi (carro, boscaiolo...): lo ricalcoliamo ogni volta
      const arrivo = this.puntoDiArrivo(volo);
      volo.oggetto.position.lerpVectors(volo.da, arrivo, k);
      volo.oggetto.position.y += Math.sin(k * Math.PI) * volo.altezza; // arco
      volo.oggetto.rotation.set(volo.giri.x * k, volo.giri.y * k, volo.giri.z * k);
      if (k >= 1 && volo.rimbalzando) {
        volo.finito = true; // il rimbalzo è finito
        this.genitore.remove(volo.oggetto);
      } else if (k >= 1) {
        volo.destinazione.rimbalza?.();
        if (volo.rimbalzo) {
          // atterrato: la merce è già arrivata (alArrivo); il tronco fa un piccolo salto sul posto e poi sparisce
          volo.alArrivo?.();
          volo.alArrivo = null;
          volo.rimbalzando = true;
          volo.tempo = 0;
          volo.durata = 0.2;
          volo.altezza = 0.22;
          volo.da = arrivo.clone();
          const fermo = arrivo.clone();
          volo.destinazione = (r) => r.copy(fermo);
          volo.giri.multiplyScalar(0.15);
          continue;
        }
        volo.finito = true;
        this.genitore.remove(volo.oggetto);
        if (volo.sbuffo) {
          // schegge (di legno o di carne) + un po' di polvere di neve
          const colore = volo.tipo === 'carne' ? 0xc8392f : volo.tipo === 'soldi' ? 0xffd23f : 0xb07a45;
          this.sbuffo(arrivo.x, arrivo.y, arrivo.z, colore, 6, 2.5);
          this.sbuffo(arrivo.x, arrivo.y, arrivo.z, 0xf4f8ff, 4, 2);
        }
        volo.alArrivo?.();
      }
    }
    this.voli = this.voli.filter((v) => !v.finito);

    this._impronte?.aggiorna(dt);

    // --- Particelle e scintille ---
    this.particelle = this.disegna(this.particelle, this.cubetti, dt);
    this.scintilleAttive = this.disegna(this.scintilleAttive, this.rombi, dt);
  }

  // Muove le particelle di un elenco e le disegna tutte insieme; restituisce quelle ancora vive
  disegna(lista, mesh, dt) {
    let n = 0;
    for (const p of lista) {
      p.vita += dt;
      if (p.vita > p.durata) continue;
      p.velocita.y -= p.gravita * dt;
      p.posizione.addScaledVector(p.velocita, dt);
      p.rotazione.x += dt * 8;
      p.rotazione.y += dt * 6;
      let scala = p.dimensione * (1 - p.vita / p.durata);
      if (p.luccica) scala *= 0.7 + 0.3 * Math.sin(p.vita * 40); // le scintille lampeggiano
      this._q.setFromEuler(this._e.set(p.rotazione.x, p.rotazione.y, 0));
      this._m.compose(p.posizione, this._q, this._s.setScalar(scala));
      mesh.setMatrixAt(n, this._m);
      mesh.setColorAt(n, p.colore);
      n++;
    }
    mesh.count = n;
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    return lista.filter((p) => p.vita <= p.durata);
  }
}
