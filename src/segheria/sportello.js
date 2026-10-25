// =====================================================================
//  SPORTELLO DI VENDITA (uno per la legna, uno per la carne)
//  È un varco nelle mura con il bancone. Dal lato interno il boscaiolo
//  passa sul punto di deposito e i pezzi volano dalla sua schiena alla
//  rastrelliera (o al tavolo), uno alla volta, e restano impilati.
//  Dal lato esterno i clienti aspettano in fila lungo le mura, comprano un
//  pezzo alla volta e la pila si abbassa; i soldi finiscono nell'unico
//  cerchio delle monete, dentro la base tra i due sportelli (soldi.js).
// =====================================================================

import * as THREE from 'three';
import { CONFIG } from '../config.js';
import {
  creaSportello, MEZZO_INGOMBRO, BANCO_DENTRO, BANCO_FUORI,
  DEPOSITO_Z, DEPOSITO_MEZZA_X, DEPOSITO_MEZZA_Z, ALTEZZA_TAVOLO,
} from '../modelli/sportello.js';
import { geometriaTronco, materialiTronco } from '../modelli/carro.js';
import { partiCarne } from '../modelli/carne.js';
import { creaZonaATerra } from './catasta.js';
import { MAPPA } from './ambiente.js';

export const ZONA_Z = DEPOSITO_Z - 1.2;  // dove si mette il boscaiolo per scaricare (davanti al deposito, verso l'interno)
const CLIENTE_Z = BANCO_FUORI + 0.7;
export const SPAZIO_FILA = 1.45;        // distanza tra un cliente e l'altro in fila (i fumetti non si toccano)

export class Sportello {
  // posizione: il punto della palizzata dove si apre lo sportello
  // soldi: la pila di monete (una sola per tutti e due gli sportelli) dove pagano i clienti
  constructor(genitore, tipo, posizione, quantita, soldi) {
    this.tipo = tipo;
    this.posizione = posizione.clone();
    this.quantita = quantita; // unità di merce sul deposito
    this.rimbalzo = 0;

    this.gruppo = new THREE.Group();
    this.gruppo.position.copy(posizione);
    genitore.add(this.gruppo);
    this.gruppo.add(creaSportello(tipo));

    // Punto di deposito a terra, ben visibile
    this.zona = posizione.clone().add(new THREE.Vector3(0, 0, ZONA_Z));
    const anello = creaZonaATerra(CONFIG.segheria.raggioSportello, 0xffe08a);
    anello.position.z = ZONA_Z;
    this.gruppo.add(anello);

    // Dove si ferma il cliente che compra, fuori dal bancone; la fila si allunga lungo le mura, verso l'esterno
    this.puntoCliente = posizione.clone().add(new THREE.Vector3(0, 0, CLIENTE_Z));
    this.versoFuori = posizione.x < 0 ? -1 : 1;
    this.uscita = new THREE.Vector3(posizione.x + this.versoFuori * 3.5, 0, MAPPA.ingressoClienti.z);

    this.soldi = soldi;

    // Rettangoli che il boscaiolo non può attraversare: bancone (con i pali) e deposito
    this.ostacoli = [
      { x: posizione.x, z: posizione.z + (BANCO_DENTRO + BANCO_FUORI) / 2, mezzaX: MEZZO_INGOMBRO, mezzaZ: (BANCO_FUORI - BANCO_DENTRO) / 2 },
      { x: posizione.x, z: posizione.z + DEPOSITO_Z, mezzaX: DEPOSITO_MEZZA_X, mezzaZ: DEPOSITO_MEZZA_Z },
    ];

    // La merce impilata: si muove tutta insieme quando ci atterra qualcosa
    this.merce = new THREE.Group();
    this.merce.position.z = DEPOSITO_Z;
    this.gruppo.add(this.merce);
    const massimo = CONFIG.segheria.pezziMassimiSportello;
    const m4 = new THREE.Matrix4();
    this.posti = [];

    if (tipo === 'legna') {
      // Tronchi sdraiati di traverso sulla rastrelliera, 6 per fila
      for (let i = 0; i < massimo; i++) {
        const strato = Math.floor(i / 6);
        this.posti.push(new THREE.Vector3(-0.8 + (i % 6) * 0.32, 0.27 + strato * 0.29, 0));
      }
      const sdraiato = new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.PI / 2, 0, 0));
      const scala = new THREE.Vector3(1, 0.45, 1);
      const tronchi = new THREE.InstancedMesh(geometriaTronco, materialiTronco, massimo);
      this.posti.forEach((p, i) => tronchi.setMatrixAt(i, m4.compose(p, sdraiato, scala)));
      this.istanze = [tronchi];
    } else {
      // Carne sul tavolo, 2 file da 4
      for (let i = 0; i < massimo; i++) {
        const strato = Math.floor(i / 8);
        const k = i % 8;
        this.posti.push(new THREE.Vector3(-0.75 + (k % 4) * 0.5, ALTEZZA_TAVOLO + 0.07 + strato * 0.16, (Math.floor(k / 4) - 0.5) * 0.42));
      }
      const scala = new THREE.Vector3(0.75, 0.75, 0.75);
      const finale = new THREE.Matrix4();
      this.istanze = partiCarne().map((parte) => {
        const mesh = new THREE.InstancedMesh(parte.geometria, parte.materiale, massimo);
        this.posti.forEach((p, i) => {
          const girato = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, (i % 2 ? 0.25 : -0.25) + Math.floor(i / 8) * 0.4, 0));
          mesh.setMatrixAt(i, finale.multiplyMatrices(m4.compose(p, girato, scala), parte.matrice));
        });
        return mesh;
      });
    }
    for (const mesh of this.istanze) {
      mesh.castShadow = true;
      this.merce.add(mesh);
    }
    this.aggiornaGrafica();
  }

  // Dove aspetta il cliente al posto "posto" della fila (0 = quello al bancone)
  posizioneFila(posto, risultato = new THREE.Vector3()) {
    return risultato.copy(this.puntoCliente).setX(this.puntoCliente.x + this.versoFuori * posto * SPAZIO_FILA);
  }

  get pezzi() {
    return Math.min(this.posti.length, Math.ceil(this.quantita / CONFIG.segheria.unitaPerPezzo));
  }

  // Il boscaiolo è sul punto di deposito?
  vicino(posizione) {
    return Math.hypot(posizione.x - this.zona.x, posizione.z - this.zona.z) < CONFIG.segheria.raggioSportello;
  }

  aggiungi(quantita) {
    this.quantita += quantita;
    this.aggiornaGrafica();
  }

  // Un cliente prende un pezzo (al massimo "massimo" unità): restituisce quante unità ha preso
  prendiPezzo(massimo) {
    const presa = Math.min(this.quantita, CONFIG.segheria.unitaPerPezzo, massimo);
    this.quantita -= presa;
    this.aggiornaGrafica();
    return presa;
  }

  // Punto del mondo del pezzo in cima alla pila (da lì parte quello che compra il cliente)
  cima(risultato = new THREE.Vector3()) {
    const indice = Math.max(0, this.pezzi - 1);
    return this.puntoDelPosto(indice, risultato);
  }

  // Punto del mondo dove atterra il prossimo pezzo (usato dagli effetti di volo)
  puntoDiArrivo(tipo, risultato = new THREE.Vector3()) {
    return this.puntoDelPosto(Math.min(this.posti.length - 1, this.pezzi), risultato);
  }

  puntoDelPosto(indice, risultato) {
    risultato.copy(this.posti[indice]).add(this.posizione);
    risultato.z += DEPOSITO_Z;
    return risultato;
  }

  // Piccolo rimbalzo della pila quando ci atterra qualcosa
  rimbalza() {
    this.rimbalzo = 1;
  }

  aggiorna(dt) {
    this.rimbalzo = Math.max(0, this.rimbalzo - dt * 5);
    const s = Math.sin((1 - this.rimbalzo) * Math.PI * 2) * this.rimbalzo * 0.08;
    this.merce.scale.set(1 + s * 0.5, 1 - s, 1 + s * 0.5);
  }

  aggiornaGrafica() {
    for (const mesh of this.istanze) mesh.count = this.pezzi;
  }
}
