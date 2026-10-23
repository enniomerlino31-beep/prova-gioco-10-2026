// =====================================================================
//  DEPOSITI: la CATASTA di legna e la DISPENSA della carne
//  Qui finisce il bottino portato dalle corse.
//  Il boscaiolo raccoglie camminandoci sopra: un pezzo alla volta
//  vola sulla sua schiena (ogni pezzo vale "unitaPerPezzo" unità).
// =====================================================================

import * as THREE from 'three';
import { CONFIG } from '../config.js';
import { geometriaTronco, materialiTronco } from '../modelli/carro.js';
import { partiCarne } from '../modelli/carne.js';
import { tinta, creaScritta } from '../modelli/materiali.js';

const PEZZI_MASSIMI = { legna: 60, carne: 24 }; // pezzi disegnati al massimo

// Cerchio chiaro a terra che indica la zona dove stare (catasta, soldi, cancello...)
export function creaZonaATerra(raggio, colore = 0xffffff) {
  const materiale = new THREE.MeshBasicMaterial({ color: colore, transparent: true, opacity: 0.55, depthWrite: false });
  const anello = new THREE.Mesh(new THREE.RingGeometry(raggio - 0.12, raggio, 40), materiale);
  anello.rotation.x = -Math.PI / 2;
  anello.position.y = 0.02;
  return anello;
}

export class Deposito {
  // tipo: 'legna' (catasta) oppure 'carne' (dispensa)
  constructor(genitore, tipo, posizione, quantita) {
    this.tipo = tipo;
    this.quantita = quantita;
    this.posizione = posizione.clone();
    this.gruppo = new THREE.Group();
    this.gruppo.position.copy(posizione);
    genitore.add(this.gruppo);
    this.gruppo.add(creaZonaATerra(CONFIG.segheria.raggioRaccolta));

    this.posti = [];
    const m4 = new THREE.Matrix4();
    const uno = new THREE.Vector3(1, 1, 1);

    if (tipo === 'legna') {
      // Catasta: tronchi di traverso, 5 per fila, uno sopra l'altro (con due paletti ai lati)
      const traverso = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, Math.PI / 2));
      const scalaTronco = new THREE.Vector3(1, 0.8, 1);
      for (let i = 0; i < PEZZI_MASSIMI.legna; i++) {
        const strato = Math.floor(i / 5);
        const colonna = i % 5;
        this.posti.push(new THREE.Vector3((strato % 2) * 0.05, 0.15 + strato * 0.27, (colonna - 2) * 0.31));
      }
      this.istanze = [new THREE.InstancedMesh(geometriaTronco, materialiTronco, this.posti.length)];
      this.posti.forEach((p, i) => this.istanze[0].setMatrixAt(i, m4.compose(p, traverso, scalaTronco)));
      for (const z of [-0.95, 0.95]) {
        const paletto = new THREE.Mesh(new THREE.BoxGeometry(0.12, 2.2, 0.12), tinta(0x6e4022));
        paletto.position.set(0, 1.1, z);
        paletto.castShadow = true;
        this.gruppo.add(paletto);
      }
    } else {
      // Dispensa: una cassa di legno con i pezzi di carne sopra
      const cassa = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.5, 1.1), tinta(0x9a6234));
      cassa.position.y = 0.25;
      cassa.castShadow = true;
      cassa.receiveShadow = true;
      this.gruppo.add(cassa);
      for (let i = 0; i < PEZZI_MASSIMI.carne; i++) {
        const strato = Math.floor(i / 6);
        const k = i % 6;
        this.posti.push(new THREE.Vector3(((k % 3) - 1) * 0.45, 0.58 + strato * 0.2, (Math.floor(k / 3) - 0.5) * 0.45));
      }
      this.istanze = partiCarne().map((parte) => {
        const mesh = new THREE.InstancedMesh(parte.geometria, parte.materiale, this.posti.length);
        const finale = new THREE.Matrix4();
        this.posti.forEach((p, i) => {
          const girato = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, i * 1.9, 0));
          mesh.setMatrixAt(i, finale.multiplyMatrices(m4.compose(p, girato, uno), parte.matrice));
        });
        return mesh;
      });
    }
    for (const mesh of this.istanze) {
      mesh.castShadow = true;
      this.gruppo.add(mesh);
    }

    // Cartello con il nome
    const cartello = creaScritta(tipo === 'legna' ? 'LEGNA' : 'CARNE', {
      larghezza: 1.4,
      altezza: 0.45,
      sfondo: tipo === 'legna' ? '#8a4f1f' : '#b8322a',
      coloreTesto: '#fff6dc',
    });
    cartello.position.set(0, 0.25, 1.15);
    cartello.rotation.x = -0.9;
    this.gruppo.add(cartello);

    this.aggiornaGrafica();
  }

  get pezziVisibili() {
    return Math.min(this.posti.length, Math.ceil(this.quantita / CONFIG.segheria.unitaPerPezzo));
  }

  // Il boscaiolo è abbastanza vicino per raccogliere?
  contiene(posizione) {
    return Math.hypot(posizione.x - this.posizione.x, posizione.z - this.posizione.z) < CONFIG.segheria.raggioRaccolta;
  }

  // Toglie un pezzo (al massimo "unitaPerPezzo" unità). Restituisce quante unità ha tolto (0 = vuoto).
  prendiPezzo() {
    const quantita = Math.min(CONFIG.segheria.unitaPerPezzo, this.quantita);
    this.quantita -= quantita;
    this.aggiornaGrafica();
    return quantita;
  }

  aggiungi(quantita) {
    this.quantita += quantita;
    this.aggiornaGrafica();
  }

  // Punto del mondo in cima al deposito (da lì partono i pezzi raccolti)
  cima(risultato = new THREE.Vector3()) {
    const indice = Math.max(0, this.pezziVisibili - 1);
    risultato.copy(this.posti[indice]).add(this.posizione);
    risultato.y += 0.2;
    return risultato;
  }

  aggiornaGrafica() {
    for (const mesh of this.istanze) mesh.count = this.pezziVisibili;
  }
}
