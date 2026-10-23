// =====================================================================
//  PILA DI SOLDI accanto a uno sportello di vendita (dentro la base)
//  I clienti ci lasciano i soldi; il boscaiolo li raccoglie camminandoci
//  sopra e le mazzette volano verso di lui.
// =====================================================================

import * as THREE from 'three';
import { CONFIG } from '../config.js';
import { partiMazzetta } from '../modelli/soldi.js';
import { creaZonaATerra } from './catasta.js';

export class PilaSoldi {
  constructor(genitore, posizione, valore) {
    this.posizione = posizione.clone();
    this.valore = valore; // dollari a terra
    this.gruppo = new THREE.Group();
    this.gruppo.position.copy(posizione);
    genitore.add(this.gruppo);
    this.gruppo.add(creaZonaATerra(CONFIG.segheria.raggioRaccolta * 0.75, 0x9be37a));

    // Mazzette in 4 colonne (2x2), una sopra l'altra
    const massimo = CONFIG.economia.mazzetteMassime;
    this.posti = [];
    for (let i = 0; i < massimo; i++) {
      const strato = Math.floor(i / 4);
      const k = i % 4;
      this.posti.push(new THREE.Vector3(((k % 2) - 0.5) * 0.44, strato * 0.09, (Math.floor(k / 2) - 0.5) * 0.24));
    }
    const m4 = new THREE.Matrix4();
    const finale = new THREE.Matrix4();
    const uno = new THREE.Vector3(1.2, 1.2, 1.2);
    this.istanze = partiMazzetta().map((parte) => {
      const mesh = new THREE.InstancedMesh(parte.geometria, parte.materiale, massimo);
      this.posti.forEach((p, i) => {
        const girato = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, (Math.sin(i * 3.7) * 0.25), 0));
        mesh.setMatrixAt(i, finale.multiplyMatrices(m4.compose(p, girato, uno), parte.matrice));
      });
      mesh.castShadow = true;
      this.gruppo.add(mesh);
      return mesh;
    });
    this.aggiornaGrafica();
  }

  contiene(posizione) {
    return Math.hypot(posizione.x - this.posizione.x, posizione.z - this.posizione.z) < CONFIG.segheria.raggioRaccolta * 0.75;
  }

  aggiungi(valore) {
    this.valore += valore;
    this.aggiornaGrafica();
  }

  // Prende tutti i soldi a terra
  prendiTutto() {
    const valore = this.valore;
    this.valore = 0;
    this.aggiornaGrafica();
    return valore;
  }

  // Punto in cima alla pila (dove atterrano i soldi lasciati dai clienti)
  puntoDiArrivo(tipo, risultato = new THREE.Vector3()) {
    const indice = Math.min(this.posti.length - 1, this.mazzette);
    return risultato.copy(this.posti[indice]).add(this.posizione).setY(this.posti[indice].y + 0.1);
  }

  get mazzette() {
    return Math.min(this.posti.length, Math.ceil(this.valore / CONFIG.economia.soldiPerMazzetta));
  }

  aggiornaGrafica() {
    for (const mesh of this.istanze) mesh.count = this.mazzette;
  }
}
