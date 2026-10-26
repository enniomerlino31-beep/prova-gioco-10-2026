// =====================================================================
//  CERCHIO VERDE PER RIPARARE LE MURA
//  Un cerchio come gli altri (si riempie depositando legna invece di monete) ma molto più grande, al centro della base:
//  - quando compare "esplode" dal terreno: parte piccolo e si ingrandisce con un rimbalzo;
//  - poi pulsa piano e brilla di verde (un alone luminoso che si allarga) finché non sparisce;
//  - la scritta "Ripara le mura" sta dentro il cerchio, grande, sopra l'icona della legna e il numero dei pezzi che mancano.
// =====================================================================

import * as THREE from 'three';
import { CerchioMiglioramento } from './miglioramenti.js';

const DURATA_SCOPPIO = 1.0;  // secondi dell'animazione di quando compare
const PULSAZIONE = 0.035;    // di quanto si ingrandisce e si rimpicciolisce mentre pulsa (3,5%)
const VELOCITA_PULSAZIONE = 2.6;

// 0 → 1 con un rimbalzo: supera di circa il 17% e si assesta
const scoppio = (e) => 1 - Math.exp(-5 * e) * Math.cos(9 * e);

export class CerchioRiparazione extends CerchioMiglioramento {
  // posizione: il centro; legna: i pezzi necessari; raggio: grandezza; durataTelecamera non serve qui (la gestisce la Segheria)
  constructor(genitore, posizione, legna, raggio) {
    const livelli = [{ nome: 'Ripara le mura', prezzo: legna, icona: 'legna' }];
    super(genitore, posizione, livelli, 0, 0, '', raggio * 1.2, raggio, 'legna', raggio * 0.62);
    this.disegno.position.z = raggio * 0.33; // l'icona e il numero scendono, per fare posto alla scritta (su due righe) dentro il cerchio in alto
    this.tempoScoppio = DURATA_SCOPPIO; // già finito (il cerchio parte nascosto)
    this.tempo = 0;
    // l'alone: un anello verde luminoso che si allarga e svanisce, di continuo
    this.alone = new THREE.Mesh(
      new THREE.RingGeometry(raggio * 0.97, raggio * 1.18, 72),
      new THREE.MeshBasicMaterial({ color: 0x57e87a, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide })
    );
    this.alone.rotation.x = -Math.PI / 2;
    this.alone.position.y = 0.02;
    this.gruppo.add(this.alone);
    this.fondo = this.gruppo.children[0]; // il disco verde: si schiarisce e si scurisce piano
  }

  // La scritta sta dentro il cerchio, in alto
  sistemaScritta() {
    this.scritta.position.z = -this.raggio * 0.55;
  }

  // "RIPARA" e "LE MURA" su due righe, grandi, bianche con il bordo verde scuro (si leggono bene anche sul telefono)
  ridisegnaScritta() {
    const ctx = this.telaScritta.getContext('2d');
    const { width: l, height: a } = this.telaScritta;
    ctx.clearRect(0, 0, l, a);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineJoin = 'round';
    ctx.font = `${Math.round(a * 0.42)}px "Lilita One", "Arial Black", sans-serif`;
    ctx.lineWidth = a * 0.09;
    ctx.strokeStyle = 'rgba(20,60,30,0.95)';
    ctx.fillStyle = '#ffffff';
    for (const [testo, y] of [['RIPARA', a * 0.27], ['LE MURA', a * 0.74]]) {
      ctx.strokeText(testo, l / 2, y);
      ctx.fillText(testo, l / 2, y);
    }
    this.textureScritta.needsUpdate = true;
  }

  // Compare "esplodendo": riparte da piccolo (e rimbalza)
  nascondi(si, subito = false, silenzioso = false) {
    if (!si && this.nascosto) this.tempoScoppio = 0;
    super.nascondi(si, subito, silenzioso);
  }

  aggiorna(dt) {
    super.aggiorna(dt);
    this.tempo += dt;
    if (!this.gruppo.visible) {
      this.alone.material.opacity = 0;
      return;
    }
    if (this.fuori || this.sparisce) return; // sta sparendo: la scala la decide il cerchio normale
    this.tempoScoppio = Math.min(DURATA_SCOPPIO, this.tempoScoppio + dt);
    const crescita = scoppio(this.tempoScoppio / DURATA_SCOPPIO);
    const onda = Math.sin(this.tempo * VELOCITA_PULSAZIONE);
    this.gruppo.scale.setScalar(Math.max(0.001, crescita * (1 + PULSAZIONE * onda)));
    // brilla: il disco si schiarisce e l'alone si allarga e svanisce, di continuo
    this.fondo.material.opacity = 0.55 + 0.2 * (0.5 + 0.5 * onda);
    const giro = (this.tempo * 0.9) % 1;
    this.alone.scale.setScalar(1 + giro * 0.12);
    this.alone.material.opacity = 0.55 * (1 - giro) * Math.min(1, this.presenza);
  }
}
