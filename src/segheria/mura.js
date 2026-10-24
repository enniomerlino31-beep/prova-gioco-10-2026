// =====================================================================
//  MURA DELLA BASE
//  La palizzata ha 3 livelli (si comprano con il cerchio "Mura"):
//   0. pali di legno appuntiti
//   1. "Mura di pietra": alla base dei pali, SOLO sul lato esterno,
//      rocce grigie appuntite che li sostengono e sporgono verso fuori
//   2. "Rinforzo in metallo": assi di ferro scuro orizzontali, con i
//      bulloni, che tengono uniti i pali
//  I pali restano sempre di legno. Ogni livello dà più vita alle mura e
//  le ripara. Quando si compra un livello, le nuove parti compaiono con
//  un'onda che parte dal cerchio del miglioramento e passa palo dopo palo.
//  Tutte le rocce (e tutte le assi) sono disegnate in un colpo solo,
//  così il gioco resta leggero anche sul telefono.
// =====================================================================

import * as THREE from 'three';
import { CONFIG } from '../config.js';

const DURATA_ONDA = 1.8;   // secondi perché l'onda faccia il giro delle mura
const DURATA_COMPARSA = 0.4; // secondi perché ogni pezzo "spunti" fuori
const ALTEZZE_ASSI = [0.42, 1.02];
const SU = new THREE.Vector3(0, 1, 0);

export class Mura {
  // palizzata: il gruppo di ambiente.js (con userData.pali e userData.collegamenti)
  // origineOnda: da dove parte l'animazione (il cerchio del miglioramento)
  constructor(genitore, palizzata, origineOnda) {
    this.pali = palizzata.userData.pali;
    this.livello = 0;
    this.maxHp = CONFIG.segheria.hpMura;
    this.hp = this.maxHp;
    this.flash = 0;
    this.onda = null; // secondi da quando è partita l'animazione (null = ferma)

    // Ritardo dell'onda per ogni palo: 0 vicino al cerchio, 1 dalla parte opposta della base
    const angoloOrigine = Math.atan2(origineOnda.z, origineOnda.x);
    this.ritardi = this.pali.map((palo) => {
      const differenza = Math.atan2(palo.position.z, palo.position.x) - angoloOrigine;
      return Math.abs(Math.atan2(Math.sin(differenza), Math.cos(differenza))) / Math.PI;
    });

    this.pezzi = []; // tutti i pezzi aggiunti dai miglioramenti: { mesh, indice, livello, ritardo, posizione, rotazione, scala }
    this.creaRocce(genitore);
    this.creaMetallo(genitore, palizzata.userData.collegamenti);
    this.aggiornaPezzi();
  }

  get ratio() {
    return this.hp / this.maxHp;
  }

  // Disegna "quanti" pezzi uguali in un colpo solo; ognuno poi si sistema con aggiungiPezzo
  istanze(genitore, geometria, materiale, quanti) {
    const mesh = new THREE.InstancedMesh(geometria, materiale, quanti);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.userData.liberi = 0;
    genitore.add(mesh);
    return mesh;
  }

  aggiungiPezzo(mesh, livello, ritardo, posizione, rotazione, scala) {
    this.pezzi.push({ mesh, indice: mesh.userData.liberi++, livello, ritardo, posizione, rotazione, scala });
  }

  // Livello 1: per ogni palo una roccia grande e una piccola appuntite (verso fuori e in alto) e un masso alla base
  creaRocce(genitore) {
    const n = this.pali.length;
    const roccia = (colore) => new THREE.MeshLambertMaterial({ color: colore, flatShading: true });
    const grandi = this.istanze(genitore, new THREE.ConeGeometry(0.24, 1.05, 5), roccia(0x9aa2ad), n);
    const piccole = this.istanze(genitore, new THREE.ConeGeometry(0.17, 0.7, 5), roccia(0x7f8894), n);
    const massi = this.istanze(genitore, new THREE.DodecahedronGeometry(0.24, 0), roccia(0x8b939e), n);
    this.pali.forEach((palo, i) => {
      const { x: nx, z: nz } = palo.userData.normale;
      const fuori = new THREE.Vector3(nx, 0, nz);
      const lato = new THREE.Vector3(-nz, 0, nx); // lungo la fila
      const base = new THREE.Vector3(palo.position.x, 0, palo.position.z);
      const caso = (k) => Math.sin(i * 12.9898 + k * 78.233) * 0.5 + 0.5; // numeri "a caso" ma sempre uguali
      const punta = (verso, salita) => new THREE.Quaternion().setFromUnitVectors(SU, verso.clone().multiplyScalar(salita).add(new THREE.Vector3(0, 1, 0)).normalize());

      // la roccia grande è inclinata di circa 55 gradi: appoggiata al palo, con la punta verso fuori
      this.aggiungiPezzo(grandi, 1, this.ritardi[i],
        base.clone().addScaledVector(fuori, 0.55).addScaledVector(lato, (caso(1) - 0.5) * 0.12).setY(0.3),
        punta(fuori.clone().addScaledVector(lato, (caso(2) - 0.5) * 0.4), 1.45),
        new THREE.Vector3(1, 0.85 + caso(3) * 0.3, 1));
      this.aggiungiPezzo(piccole, 1, this.ritardi[i],
        base.clone().addScaledVector(fuori, 0.42).addScaledVector(lato, caso(4) < 0.5 ? -0.24 : 0.24).setY(0.2),
        punta(fuori.clone().addScaledVector(lato, (caso(5) - 0.5) * 0.8), 1.0),
        new THREE.Vector3(1, 0.8 + caso(6) * 0.4, 1));
      this.aggiungiPezzo(massi, 1, this.ritardi[i],
        base.clone().addScaledVector(fuori, 0.22).setY(0.07),
        new THREE.Quaternion().setFromEuler(new THREE.Euler(0, caso(7) * 6, 0)),
        new THREE.Vector3(1.1, 0.55, 1.1));
    });
  }

  // Livello 2: assi di ferro tra un palo e il successivo (sui due lati della fila) e bulloni su ogni palo
  creaMetallo(genitore, collegamenti) {
    const ferro = new THREE.MeshStandardMaterial({ color: 0x3b4149, metalness: 0.6, roughness: 0.45 });
    const acciaio = new THREE.MeshStandardMaterial({ color: 0xb4bcc6, metalness: 0.7, roughness: 0.3 });
    const assi = this.istanze(genitore, new THREE.BoxGeometry(1, 1, 1), ferro, collegamenti.length * 4);
    const bulloni = this.istanze(genitore, new THREE.CylinderGeometry(0.05, 0.05, 0.05, 6), acciaio, this.pali.length * 4);

    for (const [a, b] of collegamenti) {
      const pa = this.pali[a].position;
      const pb = this.pali[b].position;
      const { x: nx, z: nz } = this.pali[a].userData.normale;
      const lunghezza = Math.hypot(pb.x - pa.x, pb.z - pa.z) + 0.12;
      const rotazione = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, -Math.atan2(pb.z - pa.z, pb.x - pa.x), 0));
      const ritardo = (this.ritardi[a] + this.ritardi[b]) / 2;
      for (const verso of [-1, 1]) {
        ALTEZZE_ASSI.forEach((y, k) => {
          const sporgenza = (k === 0 ? 0.23 : 0.2) * verso; // il palo è più grosso in basso
          this.aggiungiPezzo(assi, 2, ritardo,
            new THREE.Vector3((pa.x + pb.x) / 2 + nx * sporgenza, y, (pa.z + pb.z) / 2 + nz * sporgenza),
            rotazione, new THREE.Vector3(lunghezza, 0.11, 0.05));
        });
      }
    }
    this.pali.forEach((palo, i) => {
      const { x: nx, z: nz } = palo.userData.normale;
      for (const verso of [-1, 1]) {
        const direzione = new THREE.Vector3(nx * verso, 0, nz * verso);
        ALTEZZE_ASSI.forEach((y, k) => {
          const sporgenza = (k === 0 ? 0.26 : 0.23) * verso;
          this.aggiungiPezzo(bulloni, 2, this.ritardi[i],
            new THREE.Vector3(palo.position.x + nx * sporgenza, y, palo.position.z + nz * sporgenza),
            new THREE.Quaternion().setFromUnitVectors(SU, direzione), new THREE.Vector3(1, 1, 1));
        });
      }
    });
  }

  // Le mura passano al livello indicato: più vita e tutte riparate (con l'onda se conAnimazione)
  applicaLivello(livello, conAnimazione) {
    const livelli = CONFIG.miglioramenti.mura;
    this.livello = livello;
    this.maxHp = livello > 0 ? livelli[livello - 1].hpMura : CONFIG.segheria.hpMura;
    this.hp = this.maxHp;
    this.onda = conAnimazione ? 0 : null;
    this.aggiornaPezzi();
  }

  // Riparazione automatica: un po' di vita in più, senza superare il massimo
  ripara(quantita) {
    this.hp = Math.min(this.maxHp, this.hp + quantita);
  }

  danneggia(quantita) {
    this.hp = Math.max(0, this.hp - quantita);
    this.flash = Math.min(0.52, this.flash + 0.45);
  }

  // Quanto è "spuntato" un pezzo: 0 = non c'è, 1 = al suo posto (con un piccolo rimbalzo mentre spunta)
  comparsa(livello, ritardo) {
    if (livello > this.livello) return 0;
    if (this.onda === null || livello < this.livello) return 1;
    const k = (this.onda - ritardo * DURATA_ONDA) / DURATA_COMPARSA;
    if (k <= 0) return 0;
    if (k >= 1) return 1;
    const c = 2.2; // "easeOutBack": supera un po' la misura e poi torna
    return 1 + (c + 1) * Math.pow(k - 1, 3) + c * Math.pow(k - 1, 2);
  }

  aggiornaPezzi() {
    const m4 = new THREE.Matrix4();
    const scala = new THREE.Vector3();
    const toccate = new Set();
    for (const pezzo of this.pezzi) {
      const f = this.comparsa(pezzo.livello, pezzo.ritardo);
      scala.copy(pezzo.scala).multiplyScalar(Math.max(0.0001, f));
      pezzo.mesh.setMatrixAt(pezzo.indice, m4.compose(pezzo.posizione, pezzo.rotazione, scala));
      toccate.add(pezzo.mesh);
    }
    for (const mesh of toccate) {
      mesh.instanceMatrix.needsUpdate = true;
      mesh.computeBoundingSphere();
    }
  }

  aggiorna(dt) {
    this.flash = Math.max(0, this.flash - dt * 3);
    if (this.onda !== null) {
      this.onda += dt;
      if (this.onda > DURATA_ONDA + DURATA_COMPARSA) this.onda = null;
      this.aggiornaPezzi();
    }

    // Pali: sempre di legno; più chiari se danneggiati, rossi quando vengono colpiti, saltello quando passa l'onda
    const ratio = this.ratio;
    const n = this.pali.length;
    for (let i = 0; i < n; i++) {
      const palo = this.pali[i];
      const colore = new THREE.Color().setHSL(0.08 + (i / n) * 0.09, 0.43, 0.46 + (1 - ratio) * 0.12);
      if (this.flash > 0.02) palo.material.color.lerpColors(colore, new THREE.Color(0xd63f33), 0.85);
      else palo.material.color.copy(colore);
      let salto = 0;
      if (this.onda !== null) {
        const k = (this.onda - this.ritardi[i] * DURATA_ONDA) / DURATA_COMPARSA;
        if (k > 0 && k < 1) salto = Math.sin(k * Math.PI) * 0.25;
      }
      palo.scale.y = (1 - ratio > 0.15 && i % 2 === 0 ? 0.85 + ratio * 0.4 : 1) + salto;
    }
  }
}
