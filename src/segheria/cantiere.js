// =====================================================================
//  CANTIERE (Gruppo 7)
//  Pagato il miglioramento di una COSTRUZIONE (mura, riparazione, torrette, pavimento) parte un cantiere SULLA COSA MIGLIORATA:
//   - 'mura': impalcature (pali e travi) tutto intorno alla palizzata e, davanti, il cartello "LAVORI IN CORSO" con la barra;
//   - 'locale': nel punto (o nei punti) della cosa, due pali con il cartello e la barra, terreno smosso e assi che saltellano
//     (per una torretta: sulla torretta; per il pavimento: al centro della base).
//  Ogni tanto si alza un po' di polvere. Solo quando la barra è piena si vede il miglioramento (lo decide Segheria.finisceCantiere);
//  nel frattempo la costruzione funziona al livello vecchio. La durata è in "cantiere" di ogni livello (CONFIG.miglioramenti) e
//  passa anche con il gioco chiuso. I lavoratori invece non hanno cantiere: arrivano a piedi (vedi arrivo.js).
// =====================================================================

import * as THREE from 'three';
import { tinta, creaScritta, creaEtichettaVariabile } from '../modelli/materiali.js';
import { MAPPA } from './ambiente.js';

const LARGHEZZA_BARRA = 1.9;
const DISTANZA_PONTEGGIO = 0.9; // quanto fuori dalle mura stanno le impalcature (metri)
const PASSO_PALI = 3;           // distanza tra un palo e l'altro delle impalcature (metri)

export class Cantiere {
  // tipo: 'mura' o 'locale'; punti: i punti del mondo dove stanno i cartelli (per 'locale'); durata e rimasto in secondi
  constructor(genitore, effetti, { tipo, punti = [], durata, rimasto = durata }) {
    this.effetti = effetti;
    this.tipo = tipo;
    this.durata = durata;
    this.rimasto = rimasto;
    this.comparsa = 0;     // 0 → 1: spunta con un saltello
    this.attesaPolvere = 0.3;
    this.tempo = 0;
    this.scatola = new THREE.BoxGeometry(1, 1, 1);
    this.segnali = [];     // i cartelli con la barra (uno per punto, uno solo per le mura)
    this.assi = [];

    this.gruppo = new THREE.Group();
    genitore.add(this.gruppo);
    this.legno = tinta(0x9a6234);
    this.scuro = tinta(0x5e3517);

    if (tipo === 'mura') {
      this.creaPonteggio();
      // il cartello davanti, al centro del lato in basso (quello che si vede meglio), fuori dalle impalcature
      this.creaSegnale(0, MAPPA.mura.fronte + DISTANZA_PONTEGGIO + 1.1, 1.25);
      this.centro = new THREE.Vector3(0, 0, 2.5); // un po' verso il davanti, dove sta il cartello
      this.zoom = 1.6;
      this.punti = [new THREE.Vector3(0, 0, MAPPA.mura.fronte)];
    } else {
      for (const punto of punti) this.creaStruttura(punto);
      this.punti = punti.map((p) => new THREE.Vector3(p.x, 0, p.z));
      this.centro = this.punti.reduce((somma, p) => somma.add(p), new THREE.Vector3()).multiplyScalar(1 / Math.max(1, this.punti.length));
      this.zoom = punti.length > 1 ? 1.5 : 0.85;
    }
    this.aggiornaBarra();
  }

  pezzo(materiale, pos, scala, rot = [0, 0, 0], genitore = this.gruppo) {
    const m = new THREE.Mesh(this.scatola, materiale);
    m.position.set(...pos);
    m.scale.set(...scala);
    m.rotation.set(...rot);
    m.castShadow = true;
    genitore.add(m);
    return m;
  }

  // Impalcature intorno a tutta la palizzata: due travi orizzontali per lato e un palo ogni tre metri (tutti i pali in una sola forma)
  creaPonteggio() {
    const M = MAPPA.mura;
    const d = DISTANZA_PONTEGGIO;
    const sx = M.sinistra - d, dx = M.destra + d, fo = M.fondo - d, fr = M.fronte + d;
    const lati = [
      { x: (sx + dx) / 2, z: fo, lungo: dx - sx, dir: 'x' },
      { x: (sx + dx) / 2, z: fr, lungo: dx - sx, dir: 'x' },
      { x: sx, z: (fo + fr) / 2, lungo: fr - fo, dir: 'z' },
      { x: dx, z: (fo + fr) / 2, lungo: fr - fo, dir: 'z' },
    ];
    const posti = [];
    for (const lato of lati) {
      for (const y of [0.9, 1.9]) {
        this.pezzo(this.legno, [lato.x, y, lato.z], lato.dir === 'x' ? [lato.lungo, 0.1, 0.1] : [0.1, 0.1, lato.lungo]);
      }
      const quanti = Math.floor(lato.lungo / PASSO_PALI) + 1;
      for (let i = 0; i < quanti; i++) {
        const t = -lato.lungo / 2 + (i * lato.lungo) / (quanti - 1);
        posti.push(lato.dir === 'x' ? [lato.x + t, lato.z] : [lato.x, lato.z + t]);
      }
    }
    const pali = new THREE.InstancedMesh(this.scatola, this.scuro, posti.length);
    const m4 = new THREE.Matrix4();
    posti.forEach(([x, z], i) => pali.setMatrixAt(i, m4.compose(new THREE.Vector3(x, 1.15, z), new THREE.Quaternion(), new THREE.Vector3(0.14, 2.3, 0.14))));
    pali.castShadow = true;
    this.gruppo.add(pali);
    this.posti = posti;
  }

  // Un cartello "LAVORI IN CORSO" con la barra che si riempie e i secondi che mancano, in (x, z)
  creaSegnale(x, z, scala = 1) {
    const gruppo = new THREE.Group();
    gruppo.position.set(x, 0, z);
    gruppo.scale.setScalar(scala);
    this.gruppo.add(gruppo);
    for (const px of [-1.05, 1.05]) this.pezzo(this.scuro, [px, 0.9, 0], [0.12, 1.8, 0.12], [0, 0, 0], gruppo);
    const cartello = creaScritta('LAVORI IN CORSO', { larghezza: 2.3, altezza: 0.5, sfondo: '#f2b632', coloreTesto: '#3a2a05', coloreBordo: 'rgba(255,255,255,0.6)' });
    cartello.position.set(0, 1.62, 0.1);
    cartello.rotation.x = -0.25;
    gruppo.add(cartello);
    const barra = new THREE.Group();
    barra.position.set(0, 1.18, 0.12);
    barra.rotation.x = -0.25;
    const binario = new THREE.Mesh(this.scatola, new THREE.MeshBasicMaterial({ color: 0x1d2128 }));
    binario.scale.set(LARGHEZZA_BARRA + 0.12, 0.26, 0.04);
    const riempimento = new THREE.Mesh(this.scatola, new THREE.MeshBasicMaterial({ color: 0x6fe17d }));
    riempimento.scale.set(0.001, 0.18, 0.05);
    riempimento.position.z = 0.02;
    barra.add(binario, riempimento);
    gruppo.add(barra);
    const conto = creaEtichettaVariabile({ larghezza: 1.1, altezza: 0.4, icona: 'martello', sfondo: 'rgba(40,40,40,0.8)', coloreTesto: '#ffffff', coloreBordo: 'rgba(0,0,0,0.8)' });
    conto.sprite.position.set(0, 0.62, 0.15);
    gruppo.add(conto.sprite);
    this.segnali.push({ riempimento, conto });
    return gruppo;
  }

  // Una struttura di cantiere in un punto: terreno smosso, assi che saltellano, cartello e barra
  creaStruttura(punto) {
    const terra = new THREE.Mesh(new THREE.CircleGeometry(1.2, 28), new THREE.MeshBasicMaterial({ color: 0x6b4a2d, transparent: true, opacity: 0.85, depthWrite: false }));
    terra.rotation.x = -Math.PI / 2;
    terra.position.set(punto.x, 0.03, punto.z);
    this.gruppo.add(terra);
    const gruppo = this.creaSegnale(punto.x, punto.z + 1.2, 1);
    const assi = [
      this.pezzo(this.legno, [-0.45, 0.07, -0.6], [0.9, 0.08, 0.2], [0, 0.25, 0], gruppo),
      this.pezzo(this.legno, [0.4, 0.07, -0.55], [0.8, 0.08, 0.2], [0, -0.3, 0], gruppo),
      this.pezzo(this.legno, [0.0, 0.16, -0.58], [0.7, 0.08, 0.2], [0, 0.05, 0], gruppo),
    ];
    for (const asse of assi) {
      asse.userData.y0 = asse.position.y;
      this.assi.push(asse);
    }
  }

  get finito() {
    return this.rimasto <= 0;
  }

  // Le barre e i secondi che mancano
  aggiornaBarra() {
    const parte = 1 - Math.max(0, this.rimasto) / this.durata;
    const larga = Math.max(0.001, LARGHEZZA_BARRA * parte);
    const secondi = Math.ceil(Math.max(0, this.rimasto));
    const testo = secondi >= 60 ? `${Math.floor(secondi / 60)}:${String(secondi % 60).padStart(2, '0')}` : `${secondi}s`;
    for (const { riempimento, conto } of this.segnali) {
      riempimento.scale.x = larga;
      riempimento.position.x = -LARGHEZZA_BARRA / 2 + larga / 2;
      conto.imposta(testo);
    }
  }

  // dt: secondi passati (a gioco aperto)
  aggiorna(dt) {
    this.passa(dt);
    this.tempo += dt;
    this.comparsa = Math.min(1, this.comparsa + dt * 3);
    const c = this.comparsa;
    this.gruppo.scale.setScalar(Math.max(0.001, c < 1 ? c + Math.sin(c * Math.PI) * 0.25 : 1));
    // le assi saltellano un po', a turno
    this.assi.forEach((asse, i) => {
      const onda = Math.max(0, Math.sin(this.tempo * 7 + i * 2.1));
      asse.position.y = asse.userData.y0 + onda * onda * 0.12;
    });
    this.attesaPolvere -= dt;
    if (this.attesaPolvere <= 0) {
      this.attesaPolvere = 0.6 + Math.random() * 0.5;
      // un po' di polvere in un punto del cantiere (sulle mura: lungo l'impalcatura)
      let x;
      let z;
      if (this.tipo === 'mura') {
        [x, z] = this.posti[Math.floor(Math.random() * this.posti.length)];
      } else {
        ({ x, z } = this.punti[Math.floor(Math.random() * this.punti.length)]);
      }
      this.effetti.sbuffo(x + (Math.random() - 0.5) * 1.2, 0.3, z + (Math.random() - 0.5) * 0.8, 0xd9c8a8, 4, 1.5);
    }
  }

  // Passa il tempo senza animazioni (durante una corsa)
  passa(dt) {
    this.rimasto = Math.max(0, this.rimasto - dt);
    this.aggiornaBarra();
  }

  // Toglie il cantiere dalla scena
  distruggi() {
    this.gruppo.parent?.remove(this.gruppo);
    this.gruppo.traverse((oggetto) => {
      if (oggetto.isSprite) {
        oggetto.material.map.dispose();
        oggetto.material.dispose();
      } else if (oggetto.isMesh && oggetto.material.map) {
        oggetto.material.map.dispose();
        oggetto.material.dispose();
        oggetto.geometry.dispose();
      }
    });
    this.scatola.dispose();
  }
}
