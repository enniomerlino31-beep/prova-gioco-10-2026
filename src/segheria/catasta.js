// =====================================================================
//  LA CATASTA di legna (la carne della corsa invece va direttamente sul
//  tavolo dello sportello CARNE). Qui finisce la legna portata dalle corse.
//  Il boscaiolo raccoglie camminandoci sopra: un pezzo alla volta
//  vola sulla sua schiena (ogni pezzo vale "unitaPerPezzo" unità).
// =====================================================================

import * as THREE from 'three';
import { CONFIG } from '../config.js';
import { geometriaTronco, materialiTronco } from '../modelli/carro.js';
import { tinta, creaScritta } from '../modelli/materiali.js';

const PEZZI_MASSIMI = 60; // tronchi disegnati al massimo

// Cerchio chiaro a terra che indica la zona dove stare (catasta, soldi, cancello...)
export function creaZonaATerra(raggio, colore = 0xffffff) {
  const materiale = new THREE.MeshBasicMaterial({ color: colore, transparent: true, opacity: 0.55, depthWrite: false });
  const anello = new THREE.Mesh(new THREE.RingGeometry(raggio - 0.12, raggio, 40), materiale);
  anello.rotation.x = -Math.PI / 2;
  anello.position.y = 0.02;
  return anello;
}

export class Deposito {
  // tipo: 'legna' (c'è solo la catasta)
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

    // Catasta: tronchi di traverso, 5 per fila, uno sopra l'altro (con due paletti ai lati)
    const traverso = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, Math.PI / 2));
    const scalaTronco = new THREE.Vector3(1, 0.8, 1);
    for (let i = 0; i < PEZZI_MASSIMI; i++) {
      const strato = Math.floor(i / 5);
      const colonna = i % 5;
      this.posti.push(new THREE.Vector3((strato % 2) * 0.05, 0.15 + strato * 0.27, (colonna - 2) * 0.31));
    }
    this.istanze = [new THREE.InstancedMesh(geometriaTronco, materialiTronco, this.posti.length)];
    this.posti.forEach((p, i) => this.istanze[0].setMatrixAt(i, m4.compose(p, traverso, scalaTronco)));
    for (const z of [-0.95, 0.95]) {
      // paletti bassi: visti dall'alto non coprono il cerchio del miglioramento dietro la catasta
      const paletto = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.2, 0.12), tinta(0x6e4022));
      paletto.position.set(0, 0.6, z);
      paletto.castShadow = true;
      this.gruppo.add(paletto);
    }
    for (const mesh of this.istanze) {
      mesh.castShadow = true;
      this.gruppo.add(mesh);
    }

    // Cartello con il nome
    const cartello = creaScritta('LEGNA', {
      larghezza: 1.4,
      altezza: 0.45,
      sfondo: '#8a4f1f',
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

  // Toglie un pezzo (di solito "unitaPerPezzo" unità, o quante se ne chiedono). Restituisce quante unità ha tolto (0 = vuoto).
  prendiPezzo(richiesta = CONFIG.segheria.unitaPerPezzo) {
    const quantita = Math.min(richiesta, this.quantita);
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
