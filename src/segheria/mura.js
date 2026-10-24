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
//
//  DANNI (niente rosso): quando un lupo morde le mura il palo colpito trema,
//  saltano fuori schegge di legno e dalla cima cade un po' di neve.
//  Più la vita scende, più le mura si rovinano: sotto il 70% piccole crepe,
//  sotto il 40% pali scheggiati e qualche punta rotta, sotto il 15% pali
//  storti e pali spezzati. Ogni palo si rovina a un punto un po' diverso,
//  così i danni arrivano (e con le riparazioni spariscono) poco alla volta.
//  Crepe e schegge sono disegnate tutte insieme, come le rocce.
// =====================================================================

import * as THREE from 'three';
import { CONFIG } from '../config.js';

const DURATA_ONDA = 1.8;   // secondi perché l'onda faccia il giro delle mura
const DURATA_COMPARSA = 0.4; // secondi perché ogni pezzo "spunti" fuori
const ALTEZZE_ASSI = [0.42, 1.02];
const SU = new THREE.Vector3(0, 1, 0);
const DANNI = { crepe: 0.7, scheggiati: 0.4, rotti: 0.15 }; // sotto queste parti di vita compaiono i danni
const MEZZO_PALO = 0.725;  // metà dell'altezza di un palo (il palo è centrato a 0,72 m da terra)
const RISALITA = 0.25;     // dopo una riparazione i danni spariscono piano: la vita "che si vede" risale di 1/4 al secondo

export class Mura {
  // palizzata: il gruppo di ambiente.js (con userData.pali e userData.collegamenti)
  // origineOnda: da dove parte l'animazione (il cerchio del miglioramento); effetti: per schegge e neve
  constructor(genitore, palizzata, origineOnda, effetti) {
    this.pali = palizzata.userData.pali;
    this.effetti = effetti;
    this.livello = 0;
    this.maxHp = CONFIG.segheria.hpMura;
    this.hp = this.maxHp;
    this.ratioVisivo = 1; // la vita "che si vede": scende subito, risale piano (i danni spariscono poco alla volta)
    this.tempo = 0;
    this.onda = null; // secondi da quando è partita l'animazione (null = ferma)

    // Per ogni palo: dove sta, numeri "a caso" sempre uguali (a che punto si rovina, da che parte si storce...)
    // e quanto è rovinato adesso (crepa, scheggia, rotto: da 0 a 1, cambiano piano piano)
    const n = this.pali.length;
    this.stati = this.pali.map((palo, i) => {
      palo.material.color.setHSL(0.08 + (i / n) * 0.09, 0.43, 0.46);
      const caso = (k) => {
        const v = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453;
        return v - Math.floor(v);
      };
      return {
        x: palo.position.x, z: palo.position.z, punta: palo.children[0],
        caso: [caso(1), caso(2), caso(3), caso(4), caso(5)],
        tremore: 0, crepa: 0, scheggia: 0, rotto: 0,
      };
    });
    this.creaDanni(genitore);

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
  }

  // Un lupo morde le mura vicino a (x, z): il palo più vicino trema (e un po' anche quelli accanto),
  // saltano fuori schegge di legno che cadono nella neve e dalla cima si stacca un po' di neve.
  // forza: quanto è forte il morso (il lupo gigante morde più forte)
  colpisci(x, z, forza = 1) {
    let colpito = 0;
    let distanza = Infinity;
    this.stati.forEach((stato, i) => {
      const d = Math.hypot(stato.x - x, stato.z - z);
      if (d < distanza) {
        distanza = d;
        colpito = i;
      }
    });
    for (let k = -1; k <= 1; k++) {
      const stato = this.stati[colpito + k];
      if (stato) stato.tremore = Math.max(stato.tremore, k === 0 ? forza : forza * 0.5);
    }
    const { x: px, z: pz } = this.stati[colpito];
    const { x: nx, z: nz } = this.pali[colpito].userData.normale;
    this.effetti.sbuffo(px + nx * 0.3, 0.7, pz + nz * 0.3, 0xb07a45, Math.round(5 * forza), 2.2); // schegge di legno
    this.effetti.sbuffo(px, 1.5, pz, 0xf4f8ff, Math.round(4 * forza), 1.2);                      // neve dalla cima
  }

  // Crepe (righe scure) e schegge (pezzetti di legno chiaro che spuntano) sui pali:
  // una per lato del palo (dentro e fuori), tutte disegnate in un colpo solo e nascoste finché non servono
  creaDanni(genitore) {
    const n = this.pali.length;
    const crea = (colore) => {
      const mesh = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshLambertMaterial({ color: colore }), n * 2);
      mesh.frustumCulled = false;
      genitore.add(mesh);
      return mesh;
    };
    this.crepe = crea(0x3a2412);
    this.schegge = crea(0xe2b77e);
    this._m = new THREE.Matrix4();
    this._locale = new THREE.Matrix4();
    this._q = new THREE.Quaternion();
    this._v = new THREE.Vector3();
    this._s = new THREE.Vector3();
    this._asse = new THREE.Vector3();
    // dove stanno crepa e scheggia su ogni lato del palo (calcolato una volta sola: non cambia mai)
    const inclinaFuori = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), 0.6);
    this.stati.forEach((stato, i) => {
      const { x: nx, z: nz } = this.pali[i].userData.normale;
      stato.lati = [1, -1].map((verso) => {
        const angolo = Math.atan2(nx * verso, nz * verso); // il lato del palo che guarda da quella parte
        return {
          // crepa: una riga scura inclinata a metà palo
          posCrepa: new THREE.Vector3(nx * verso * 0.2, 0.05 + stato.caso[4] * 0.2, nz * verso * 0.2),
          qCrepa: new THREE.Quaternion().setFromEuler(new THREE.Euler(0, angolo, (stato.caso[0] - 0.5) * 0.9)),
          // scheggia: un pezzetto di legno chiaro che spunta in alto, inclinato verso fuori
          posScheggia: new THREE.Vector3(nx * verso * 0.17, 0.5, nz * verso * 0.17),
          qScheggia: new THREE.Quaternion().setFromEuler(new THREE.Euler(0, angolo, 0)).multiply(inclinaFuori),
        };
      });
    });
  }

  // Sistema un palo: rovinato quanto dice il suo stato, che trema se è appena stato morso
  // e con la base sempre a terra (anche quando è storto o spezzato)
  sistemaPalo(i, salto) {
    const palo = this.pali[i];
    const stato = this.stati[i];
    const [, c2, , c4, c5] = stato.caso;
    const { x: nx, z: nz } = palo.userData.normale;
    const spezzato = c4 < 0.35; // tra i pali rotti, alcuni si spezzano a metà, gli altri si storcono
    // altezza: un po' più basso se ha la punta rotta, solo un moncone se è spezzato; saltello quando passa l'onda
    let altezza = 1 + salto;
    if (c2 < 0.6) altezza -= stato.scheggia * 0.1;
    if (spezzato) altezza -= stato.rotto * 0.65;
    stato.punta.visible = !(c2 < 0.6 && stato.scheggia > 0.5) && !(spezzato && stato.rotto > 0.3);
    palo.scale.y = altezza;
    // storto: ruota attorno alla direzione della fila, verso fuori o verso dentro
    this._asse.set(-nz, 0, nx);
    palo.quaternion.setFromAxisAngle(this._asse, spezzato ? 0 : stato.rotto * 0.24 * (c5 < 0.5 ? -1 : 1));
    // la base resta a terra: il centro del palo sta "mezzo palo" sopra la base, nella direzione in cui è inclinato
    this._v.set(0, MEZZO_PALO * altezza, 0).applyQuaternion(palo.quaternion);
    const scossa = Math.sin(this.tempo * 55 + i) * 0.06 * stato.tremore; // trema lungo la fila
    palo.position.set(stato.x + this._v.x - nz * scossa, -0.005 + this._v.y, stato.z + this._v.z + nx * scossa);
    palo.updateMatrix();

    // crepa e scheggia su ogni lato del palo (fuori e dentro), seguendo il palo
    stato.lati.forEach((lato, j) => {
      const k = i * 2 + j;
      this._locale.compose(lato.posCrepa, lato.qCrepa, this._s.set(0.025, 0.34, 0.03).multiplyScalar(Math.max(0.0001, stato.crepa)));
      this.crepe.setMatrixAt(k, this._m.multiplyMatrices(palo.matrix, this._locale));
      this._locale.compose(lato.posScheggia, lato.qScheggia, this._s.set(0.06, 0.18, 0.05).multiplyScalar(Math.max(0.0001, stato.scheggia)));
      this.schegge.setMatrixAt(k, this._m.multiplyMatrices(palo.matrix, this._locale));
    });
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
    this.tempo += dt;
    if (this.onda !== null) {
      this.onda += dt;
      if (this.onda > DURATA_ONDA + DURATA_COMPARSA) this.onda = null;
      this.aggiornaPezzi();
    }

    // La vita "che si vede" scende subito con i morsi, ma risale piano: riparate o migliorate le mura,
    // i danni spariscono poco alla volta
    const ratio = this.ratio;
    this.ratioVisivo = ratio < this.ratioVisivo ? ratio : Math.min(ratio, this.ratioVisivo + dt * RISALITA);
    const v = this.ratioVisivo;

    const verso = (attuale, voluto) => attuale + THREE.MathUtils.clamp(voluto - attuale, -dt * 2, dt * 2);
    for (let i = 0; i < this.pali.length; i++) {
      const stato = this.stati[i];
      // ogni palo si rovina a un punto un po' diverso (secondo i suoi numeri a caso)
      const [c1, c2, c3] = stato.caso;
      stato.crepa = verso(stato.crepa, v < DANNI.crepe - c1 * 0.5 ? 1 : 0);
      stato.scheggia = verso(stato.scheggia, v < DANNI.scheggiati - c2 * 0.3 ? 1 : 0);
      stato.rotto = verso(stato.rotto, v < DANNI.rotti - c3 * 0.15 ? 1 : 0);
      stato.tremore = Math.max(0, stato.tremore - dt * 3.5);
      // saltello quando passa l'onda del miglioramento
      let salto = 0;
      if (this.onda !== null) {
        const k = (this.onda - this.ritardi[i] * DURATA_ONDA) / DURATA_COMPARSA;
        if (k > 0 && k < 1) salto = Math.sin(k * Math.PI) * 0.25;
      }
      this.sistemaPalo(i, salto);
    }
    this.crepe.instanceMatrix.needsUpdate = true;
    this.schegge.instanceMatrix.needsUpdate = true;
  }
}
