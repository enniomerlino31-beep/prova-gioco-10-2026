// =====================================================================
//  CERCHIO DELLE MONETE (uno solo, dentro la base tra i due sportelli)
//  I clienti di tutti e due gli sportelli ci lasciano le monete; il
//  boscaiolo le raccoglie camminandoci sopra e le monete volano verso di
//  lui. Le monete a terra sono impilate in sette colonne: più se ne
//  guadagnano, più le colonne crescono. Sopra la pila un cartellino con
//  la moneta e il numero dice quante monete ci sono (vuoto = niente cartellino).
// =====================================================================

import * as THREE from 'three';
import { CONFIG } from '../config.js';
import { partiMoneta } from '../modelli/soldi.js';
import { creaEtichettaVariabile } from '../modelli/materiali.js';
import { formatta } from '../economia.js';
import { creaZonaATerra } from './catasta.js';

const ALTEZZA_MONETA = 0.055;
// Il cartellino galleggia sopra la pila più alta (circa 0,5 m): visto dalla telecamera resta dentro il cerchio
// delle monete, sotto il cerchio del venditore, senza toccarlo
const ALTEZZA_CARTELLINO = 1.15;

export class PilaSoldi {
  constructor(genitore, posizione, valore) {
    this.posizione = posizione.clone();
    this.valore = valore; // monete a terra
    this.gruppo = new THREE.Group();
    this.gruppo.position.copy(posizione);
    genitore.add(this.gruppo);
    this.gruppo.add(creaZonaATerra(CONFIG.segheria.raggioRaccolta * 0.75, 0x9be37a));

    // Sette colonne di monete (una al centro e sei intorno); si riempiono a giro, uno strato alla volta
    const colonne = [[0, 0]];
    for (let k = 0; k < 6; k++) colonne.push([Math.cos((k / 6) * Math.PI * 2) * 0.36, Math.sin((k / 6) * Math.PI * 2) * 0.36]);
    const massimo = CONFIG.economia.moneteMassime;
    this.posti = [];
    for (let i = 0; i < massimo; i++) {
      const [x, z] = colonne[i % colonne.length];
      const strato = Math.floor(i / colonne.length);
      // ogni moneta è un pochino spostata, così le colonne non sembrano perfette
      this.posti.push(new THREE.Vector3(x + Math.sin(i * 7.1) * 0.025, strato * ALTEZZA_MONETA, z + Math.cos(i * 5.3) * 0.025));
    }
    const m4 = new THREE.Matrix4();
    const finale = new THREE.Matrix4();
    const uno = new THREE.Vector3(1, 1, 1);
    this.istanze = partiMoneta().map((parte) => {
      const mesh = new THREE.InstancedMesh(parte.geometria, parte.materiale, massimo);
      this.posti.forEach((p, i) => {
        const storta = new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.sin(i * 3.7) * 0.06, 0, Math.cos(i * 2.9) * 0.06));
        mesh.setMatrixAt(i, finale.multiplyMatrices(m4.compose(p, storta, uno), parte.matrice));
      });
      mesh.castShadow = true;
      this.gruppo.add(mesh);
      return mesh;
    });
    this.cartellino = creaEtichettaVariabile({
      larghezza: 1.25, altezza: 0.42, icona: 'moneta', sfondo: 'rgba(30,40,30,0.72)', coloreTesto: '#ffe066', coloreBordo: 'rgba(0,0,0,0.8)',
    });
    this.cartellino.sprite.position.y = ALTEZZA_CARTELLINO;
    this.gruppo.add(this.cartellino.sprite);
    this.aggiornaGrafica();
  }

  contiene(posizione) {
    return Math.hypot(posizione.x - this.posizione.x, posizione.z - this.posizione.z) < CONFIG.segheria.raggioRaccolta * 0.75;
  }

  aggiungi(valore) {
    this.valore += valore;
    this.aggiornaGrafica();
  }

  // Prende tutte le monete a terra
  prendiTutto() {
    const valore = this.valore;
    this.valore = 0;
    this.aggiornaGrafica();
    return valore;
  }

  // Punto in cima alla pila (dove atterrano le monete lasciate dai clienti)
  puntoDiArrivo(tipo, risultato = new THREE.Vector3()) {
    const indice = Math.min(this.posti.length - 1, this.monete);
    return risultato.copy(this.posti[indice]).add(this.posizione).setY(this.posti[indice].y + 0.1);
  }

  // Quante monete si vedono nella pila
  get monete() {
    return Math.min(this.posti.length, Math.ceil(this.valore / CONFIG.economia.soldiPerMoneta));
  }

  aggiornaGrafica() {
    for (const mesh of this.istanze) mesh.count = this.monete;
    const valore = Math.floor(this.valore);
    this.cartellino.sprite.visible = valore > 0;
    if (valore > 0) this.cartellino.imposta(formatta(valore));
  }
}
