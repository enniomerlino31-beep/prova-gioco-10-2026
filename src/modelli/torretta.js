// =====================================================================
//  MODELLI DELLA TORRETTA, DELL'ARCO E DELLA FRECCIA
//  La torretta è una piccola torre di legno: quattro gambe a cavallo
//  della palizzata, rinforzate da traverse e diagonali, una piattaforma
//  con la ringhiera (dove sta l'arciere) e una bandierina.
//  Senza tetto: vista dall'alto coprirebbe l'arciere.
//  Con "Potenzia arcieri" la torre diventa più robusta, come le mura:
//   aspetto 1: base di pietra sotto le gambe, bandiera blu, arco scuro, frecce con le piume blu
//   aspetto 2: anche fasce e piastre di ferro con i bulloni, bandiera d'oro, arco d'oro,
//              frecce con la punta che brilla
//  La freccia è disegnata più grande del vero, così si vede volare.
// =====================================================================

import * as THREE from 'three';
import { tinta } from './materiali.js';

export const ALTEZZA_PIATTAFORMA = 2.45; // dove appoggia i piedi l'arciere

const LEGNO = 0x8a5a31;
const LEGNO_SCURO = 0x6e4022;
const LEGNO_CHIARO = 0xb57a45;
export const COLORI_BANDIERA = [0xd8262e, 0x2f7fd6, 0xf2b632];
export const COLORI_ARCO = [0x8a5328, 0x4a2d16, 0xd9a520];
const COLORI_PIUME = [0xd8262e, 0x2f7fd6, 0xf2b632];

const scatola = new THREE.BoxGeometry(1, 1, 1);
const roccia = new THREE.MeshLambertMaterial({ color: 0x9aa2ad, flatShading: true });
const rocciaScura = new THREE.MeshLambertMaterial({ color: 0x7f8894, flatShading: true });
const ferro = new THREE.MeshStandardMaterial({ color: 0x3b4149, metalness: 0.6, roughness: 0.45 });
const acciaio = new THREE.MeshStandardMaterial({ color: 0xb4bcc6, metalness: 0.7, roughness: 0.3 });
const masso = new THREE.DodecahedronGeometry(1, 0);
const bullone = new THREE.CylinderGeometry(0.035, 0.035, 0.04, 6);

export function creaTorretta() {
  const gruppo = new THREE.Group();
  // ogni pezzo ricorda la sua grandezza vera ("scala"): serve per farlo spuntare con un'animazione
  const pezzo = (materiale, pos, scala, rotZ = 0, rotX = 0, genitore = gruppo, geometria = scatola) => {
    const m = new THREE.Mesh(geometria, typeof materiale === 'number' ? tinta(materiale) : materiale);
    m.position.set(...pos);
    m.scale.set(...scala);
    m.rotation.set(rotX, 0, rotZ);
    m.castShadow = true;
    m.receiveShadow = true;
    m.userData.scala = m.scale.clone();
    genitore.add(m);
    return m;
  };
  const h = ALTEZZA_PIATTAFORMA - 0.07;
  const g = 0.45; // distanza delle gambe dal centro
  const r = 0.64; // distanza dei paletti della ringhiera dal centro

  // --- Quattro gambe, traverse a metà altezza e diagonali su ogni lato ---
  for (const lx of [-1, 1]) for (const lz of [-1, 1]) pezzo(LEGNO_SCURO, [lx * g, h / 2, lz * g], [0.16, h, 0.16]);
  const diagonale = Math.hypot(g * 2, 1.1);
  const angolo = Math.atan2(1.1, g * 2);
  for (const lato of [-1, 1]) {
    pezzo(LEGNO, [0, 1.15, lato * g], [g * 2, 0.1, 0.08]);
    pezzo(LEGNO, [lato * g, 1.15, 0], [0.08, 0.1, g * 2]);
    pezzo(LEGNO, [0, 0.6, lato * g], [diagonale, 0.08, 0.06], lato * angolo);
    pezzo(LEGNO, [lato * g, 1.7, 0], [0.06, 0.08, diagonale], 0, lato * angolo);
  }

  // --- Piattaforma con la ringhiera ---
  pezzo(LEGNO_CHIARO, [0, h + 0.035, 0], [1.4, 0.14, 1.4]);
  for (const lx of [-1, 1]) for (const lz of [-1, 1]) pezzo(LEGNO_SCURO, [lx * r, h + 0.32, lz * r], [0.1, 0.5, 0.1]);
  for (const lato of [-1, 1]) {
    pezzo(LEGNO, [0, h + 0.5, lato * r], [1.38, 0.1, 0.06]);
    pezzo(LEGNO, [lato * r, h + 0.5, 0], [0.06, 0.1, 1.38]);
    pezzo(LEGNO, [0, h + 0.26, lato * r], [1.38, 0.07, 0.05]);
    pezzo(LEGNO, [lato * r, h + 0.26, 0], [0.05, 0.07, 1.38]);
  }

  // --- Bandierina su un angolo (cambia colore con i potenziamenti) ---
  pezzo(LEGNO_SCURO, [r, h + 0.95, -r], [0.05, 1.3, 0.05]);
  const bandiera = pezzo(COLORI_BANDIERA[0], [r + 0.25, h + 1.42, -r], [0.48, 0.28, 0.03]);

  // --- Aspetto 1: base di pietra (un blocco sotto ogni gamba, muretti tra le gambe e qualche masso) ---
  const pietra = new THREE.Group();
  for (const lx of [-1, 1]) {
    for (const lz of [-1, 1]) {
      pezzo(roccia, [lx * g, 0.32, lz * g], [0.42, 0.64, 0.42], 0, 0, pietra).rotation.y = lx * lz * 0.3;
      pezzo(rocciaScura, [lx * (g + 0.22), 0.1, lz * (g + 0.15)], [0.15, 0.12, 0.15], 0, 0, pietra, masso);
    }
    pezzo(rocciaScura, [lx * g, 0.22, 0], [0.3, 0.44, g * 2], 0, 0, pietra); // muretto lungo la palizzata
  }
  pietra.visible = false;
  gruppo.add(pietra);

  // --- Aspetto 2: fasce di ferro sulle gambe, piastre agli angoli della ringhiera, bordo della piattaforma, bulloni ---
  const metallo = new THREE.Group();
  for (const lx of [-1, 1]) {
    for (const lz of [-1, 1]) {
      for (const y of [0.95, 1.85]) {
        pezzo(ferro, [lx * g, y, lz * g], [0.21, 0.09, 0.21], 0, 0, metallo);
        pezzo(acciaio, [lx * (g + 0.11), y, lz * g], [1, 1, 1], Math.PI / 2, 0, metallo, bullone);
      }
      pezzo(ferro, [lx * r, h + 0.36, lz * r], [0.15, 0.56, 0.15], 0, 0, metallo);
    }
    pezzo(ferro, [0, h + 0.035, lx * 0.71], [1.46, 0.17, 0.04], 0, 0, metallo);
    pezzo(ferro, [lx * 0.71, h + 0.035, 0], [0.04, 0.17, 1.46], 0, 0, metallo);
  }
  metallo.visible = false;
  gruppo.add(metallo);

  gruppo.userData = { pietra, metallo, bandiera };
  return gruppo;
}

// Arco con la corda, da mettere nella mano dell'arciere (verticale, curvo in avanti verso la Z negativa)
export function creaArco() {
  const arco = new THREE.Group();
  const legno = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.025, 6, 16, Math.PI), tinta(COLORI_ARCO[0]));
  legno.rotation.set(0, Math.PI / 2, -Math.PI / 2);
  const corda = new THREE.Mesh(scatola, tinta(0xefe6d0));
  corda.scale.set(0.012, 0.56, 0.012);
  arco.add(legno, corda);
  arco.userData.legno = legno;
  return arco;
}

// Alone luminoso (una macchia di luce sfumata) per la punta delle frecce dell'ultimo livello
let materialeAlone = null;
function alone() {
  if (!materialeAlone) {
    const tela = document.createElement('canvas');
    tela.width = 64;
    tela.height = 64;
    const ctx = tela.getContext('2d');
    const sfumatura = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    sfumatura.addColorStop(0, 'rgba(255,255,220,1)');
    sfumatura.addColorStop(0.35, 'rgba(255,210,80,0.8)');
    sfumatura.addColorStop(1, 'rgba(255,170,40,0)');
    ctx.fillStyle = sfumatura;
    ctx.fillRect(0, 0, 64, 64);
    const texture = new THREE.CanvasTexture(tela);
    texture.colorSpace = THREE.SRGBColorSpace;
    materialeAlone = new THREE.SpriteMaterial({ map: texture, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true });
  }
  const sprite = new THREE.Sprite(materialeAlone);
  sprite.scale.setScalar(0.75);
  return sprite;
}

// Freccia: asta di legno, punta di ferro e piume. La punta guarda verso la Z positiva
// (così "lookAt" la gira nella direzione in cui vola). aspetto: come nella torretta.
const asta = new THREE.CylinderGeometry(0.03, 0.03, 0.9, 6);
const punta = new THREE.ConeGeometry(0.075, 0.2, 6);
const puntaLuminosa = new THREE.MeshBasicMaterial({ color: 0xffe066 });
export function creaFreccia(aspetto = 0) {
  const freccia = new THREE.Group();
  const a = new THREE.Mesh(asta, tinta(0x9a6234));
  a.rotation.x = Math.PI / 2;
  const p = new THREE.Mesh(punta, aspetto >= 2 ? puntaLuminosa : tinta(0xb4bcc6));
  p.rotation.x = Math.PI / 2;
  p.position.z = 0.53;
  if (aspetto >= 1) p.scale.setScalar(1.3);
  freccia.add(a, p);
  for (const giro of [0, Math.PI / 2]) {
    const piuma = new THREE.Mesh(scatola, tinta(COLORI_PIUME[aspetto]));
    piuma.scale.set(0.16, 0.015, 0.2);
    piuma.position.z = -0.36;
    piuma.rotation.z = giro;
    freccia.add(piuma);
  }
  for (const m of freccia.children) m.castShadow = true;
  if (aspetto >= 2) {
    const luce = alone();
    luce.position.z = 0.55;
    freccia.add(luce);
  }
  return freccia;
}
