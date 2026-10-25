// =====================================================================
//  MODELLI DELLA TORRETTA, DELL'ARCO E DELLA FRECCIA
//  La torretta è una piccola torre a cavallo della palizzata: quattro
//  gambe di tronco, traverse e diagonali, una piattaforma di assi con la
//  ringhiera (dove sta l'arciere) e una bandierina. Senza tetto: vista
//  dall'alto coprirebbe l'arciere.
//  Il suo aspetto cambia per DUE motivi, indipendenti tra loro:
//   1. la PARTE BASSA segue il materiale delle mura (come le mura):
//      legno: tronchi con la corteccia, pali della ringhiera a punta con la neve
//             (lo stesso legno della palizzata)
//      pietra: basamento di pietra sotto le gambe e rocce appuntite verso fuori
//      metallo: fasce di ferro con i bulloni sulle gambe e bordo di ferro della piattaforma
//   2. la PARTE ALTA segue i potenziamenti degli arcieri:
//      base: ringhiera semplice e bandiera rossa
//      "Potenzia arcieri": scudi blu appesi alla ringhiera, barile delle frecce, bandiera blu
//      "Potenzia arcieri 2": anche pomoli d'oro sui pali, bordi d'oro sugli scudi,
//                            stendardo d'oro e due bandierine in più, bandiera d'oro
//  Così si possono avere tutte le combinazioni (es. mura di legno con gli arcieri d'oro).
//  Anche l'arco cambia con gli arcieri: semplice, più grande con le fasce di cuoio,
//  grande e d'oro con le punte e una gemma.
//  La freccia è disegnata più grande del vero, così si vede volare.
// =====================================================================

import * as THREE from 'three';
import { tinta, legnoPali } from './materiali.js';

export const ALTEZZA_PIATTAFORMA = 2.45; // dove appoggia i piedi l'arciere

const LEGNO = 0x8a5a31;
const LEGNO_SCURO = 0x6e4022;
const LEGNO_CHIARO = 0xb57a45;
export const COLORI_BANDIERA = [0xd8262e, 0x2f7fd6, 0xf2b632];
const COLORI_PIUME = [0xd8262e, 0x2f7fd6, 0xf2b632];
const BLU_SCUDO = 0x2f6fc2;
const ORO = 0xf2b632;

const scatola = new THREE.BoxGeometry(1, 1, 1);
const tronco = new THREE.CylinderGeometry(1, 1, 1, 8);    // un tronco (si allunga con la scala)
const puntaPalo = new THREE.ConeGeometry(1, 1, 8);
const disco = new THREE.CylinderGeometry(1, 1, 1, 16);
const pomolo = new THREE.SphereGeometry(1, 10, 8);
const roccia = new THREE.MeshLambertMaterial({ color: 0x9aa2ad, flatShading: true });
const rocciaScura = new THREE.MeshLambertMaterial({ color: 0x7f8894, flatShading: true });
const ferro = new THREE.MeshStandardMaterial({ color: 0x3b4149, metalness: 0.6, roughness: 0.45 });
const acciaio = new THREE.MeshStandardMaterial({ color: 0xb4bcc6, metalness: 0.7, roughness: 0.3 });
const oro = new THREE.MeshStandardMaterial({ color: ORO, metalness: 0.6, roughness: 0.35 });
const masso = new THREE.DodecahedronGeometry(1, 0);
const rocciaAppuntita = new THREE.ConeGeometry(1, 1, 5);
const bullone = new THREE.CylinderGeometry(0.035, 0.035, 0.04, 6);

// fuori: da che parte è l'esterno delle mura (-1 = la torre sta sulle mura di sinistra, 1 = di destra)
export function creaTorretta(fuori = -1) {
  const { corteccia, punta, neve } = legnoPali();
  const gruppo = new THREE.Group();
  // ogni pezzo ricorda la sua grandezza vera ("scala"): serve per farlo spuntare con un'animazione
  const pezzo = (materiale, pos, scala, rot = [0, 0, 0], genitore = gruppo, geometria = scatola) => {
    const m = new THREE.Mesh(geometria, typeof materiale === 'number' ? tinta(materiale) : materiale);
    m.position.set(...pos);
    m.scale.set(...scala);
    m.rotation.set(...rot);
    m.castShadow = true;
    m.receiveShadow = true;
    m.userData.scala = m.scale.clone();
    genitore.add(m);
    return m;
  };
  // un tronco orizzontale da a a b (raggio r)
  const trave = (a, b, r, genitore = gruppo) => {
    const da = new THREE.Vector3(...a);
    const verso = new THREE.Vector3(...b).sub(da);
    const m = pezzo(corteccia, [0, 0, 0], [r, verso.length(), r], [0, 0, 0], genitore, tronco);
    m.position.copy(da).addScaledVector(verso, 0.5);
    m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), verso.normalize());
    return m;
  };
  const h = ALTEZZA_PIATTAFORMA - 0.07;
  const g = 0.45; // distanza delle gambe dal centro
  const r = 0.64; // distanza dei pali della ringhiera dal centro

  // ===== PARTE DI LEGNO (c'è sempre): lo stesso legno della palizzata =====
  // quattro gambe di tronco, traverse a metà altezza e diagonali su ogni lato
  for (const lx of [-1, 1]) for (const lz of [-1, 1]) pezzo(corteccia, [lx * g, h / 2, lz * g], [0.1, h, 0.1], [0, 0, 0], gruppo, tronco);
  for (const lato of [-1, 1]) {
    trave([-g, 1.15, lato * g], [g, 1.15, lato * g], 0.055);
    trave([lato * g, 1.15, -g], [lato * g, 1.15, g], 0.055);
    trave([-g, 0.15, lato * g], [g, 1.05, lato * g], 0.045);
    trave([lato * g, 1.25, -g], [lato * g, 2.15, g], 0.045);
  }
  // la piattaforma: quattro assi un po' diverse
  [-0.525, -0.175, 0.175, 0.525].forEach((z, i) => pezzo(i % 2 ? LEGNO_CHIARO : 0xa86d3a, [0, h + 0.035, z], [1.42, 0.14, 0.33]));
  // la ringhiera: pali agli angoli che finiscono a punta con la neve, e due tronchi sottili per lato
  for (const lx of [-1, 1]) {
    for (const lz of [-1, 1]) {
      pezzo(corteccia, [lx * r, h + 0.36, lz * r], [0.07, 0.6, 0.07], [0, 0, 0], gruppo, tronco);
      pezzo(punta, [lx * r, h + 0.76, lz * r], [0.07, 0.2, 0.07], [0, 0, 0], gruppo, puntaPalo);
      pezzo(neve, [lx * r, h + 0.83, lz * r], [0.035, 0.07, 0.035], [0, 0, 0], gruppo, puntaPalo);
    }
  }
  for (const lato of [-1, 1]) {
    for (const y of [h + 0.26, h + 0.5]) {
      trave([-r, y, lato * r], [r, y, lato * r], 0.035);
      trave([lato * r, y, -r], [lato * r, y, r], 0.035);
    }
  }
  // dal lato di fuori, tra i pali, una fila di paletti a punta come la palizzata
  for (const z of [-0.38, -0.13, 0.13, 0.38]) {
    pezzo(corteccia, [fuori * r, h + 0.3, z], [0.045, 0.48, 0.045], [0, 0, 0], gruppo, tronco);
    pezzo(punta, [fuori * r, h + 0.62, z], [0.045, 0.16, 0.045], [0, 0, 0], gruppo, puntaPalo);
  }
  // la bandierina su un angolo (cambia colore con gli arcieri)
  pezzo(LEGNO_SCURO, [-fuori * r, h + 1.1, -r], [0.05, 1.3, 0.05]);
  const bandiera = pezzo(COLORI_BANDIERA[0], [-fuori * r - fuori * 0.25, h + 1.57, -r], [0.48, 0.28, 0.03]);

  // ===== MURA DI PIETRA: basamento di pietra e rocce appuntite verso fuori (come le mura) =====
  const pietra = new THREE.Group();
  for (const lx of [-1, 1]) {
    for (const lz of [-1, 1]) {
      pezzo(roccia, [lx * g, 0.36, lz * g], [0.44, 0.72, 0.44], [0, lx * lz * 0.3, 0], pietra);
      pezzo(rocciaScura, [lx * (g + 0.22), 0.1, lz * (g + 0.15)], [0.15, 0.12, 0.15], [0, 0, 0], pietra, masso);
    }
    pezzo(rocciaScura, [lx * g, 0.25, 0], [0.32, 0.5, g * 2], [0, 0, 0], pietra);  // muretto lungo la palizzata
  }
  for (const z of [-0.5, 0, 0.5]) {
    pezzo(roccia, [fuori * (g + 0.42), 0.32, z], [0.22, 1.0, 0.22], [0, 0, -fuori * 0.95], pietra, rocciaAppuntita);
  }

  // ===== RINFORZO IN METALLO: fasce di ferro con i bulloni sulle gambe, piastre e bordo della piattaforma =====
  const metallo = new THREE.Group();
  for (const lx of [-1, 1]) {
    for (const lz of [-1, 1]) {
      for (const y of [0.95, 1.85]) {
        pezzo(ferro, [lx * g, y, lz * g], [0.23, 0.09, 0.23], [0, 0, 0], metallo);
        pezzo(acciaio, [lx * (g + 0.12), y, lz * g], [1, 1, 1], [0, 0, Math.PI / 2], metallo, bullone);
      }
      pezzo(ferro, [lx * r, h + 0.38, lz * r], [0.16, 0.12, 0.16], [0, 0, 0], metallo);
    }
    pezzo(ferro, [0, h + 0.035, lx * 0.71], [1.46, 0.17, 0.04], [0, 0, 0], metallo);
    pezzo(ferro, [lx * 0.71, h + 0.035, 0], [0.04, 0.17, 1.46], [0, 0, 0], metallo);
  }
  for (const z of [-0.45, 0.45]) pezzo(acciaio, [fuori * 0.74, h + 0.035, z], [1, 1, 1], [0, 0, Math.PI / 2], metallo, bullone);

  // ===== "POTENZIA ARCIERI": scudi blu appesi alla ringhiera dal lato di fuori e barile delle frecce =====
  // gli scudi sono inclinati verso l'alto, così si vedono anche dalla telecamera (che guarda dall'alto)
  const arcieri1 = new THREE.Group();
  const inclinazione = [0, 0, -fuori * 0.9];
  const asse = new THREE.Vector3(fuori * Math.sin(0.9), Math.cos(0.9), 0); // verso dove guarda lo scudo
  const scudi = [-0.32, 0.32].map((z) => {
    const centro = new THREE.Vector3(fuori * (r + 0.08), h + 0.36, z);
    pezzo(BLU_SCUDO, centro.toArray(), [0.2, 0.04, 0.2], inclinazione, arcieri1, disco);
    pezzo(acciaio, centro.clone().addScaledVector(asse, 0.025).toArray(), [0.06, 0.04, 0.06], inclinazione, arcieri1, pomolo);
    return { centro };
  });
  pezzo(LEGNO_SCURO, [-fuori * 0.42, h + 0.27, 0.42], [0.13, 0.4, 0.13], [0, 0, 0], arcieri1, disco);
  for (const [dx, dz] of [[0.04, 0], [-0.04, 0.03], [0, -0.04]]) {
    pezzo(COLORI_PIUME[1], [-fuori * 0.42 + dx, h + 0.52, 0.42 + dz], [0.04, 0.06, 0.04], [0, 0, 0], arcieri1, pomolo);
  }

  // ===== "POTENZIA ARCIERI 2": oro sui pali e sugli scudi, stendardo d'oro e due bandierine in più =====
  const arcieri2 = new THREE.Group();
  for (const lx of [-1, 1]) for (const lz of [-1, 1]) pezzo(oro, [lx * r, h + 0.9, lz * r], [0.075, 0.075, 0.075], [0, 0, 0], arcieri2, pomolo);
  // il bordo d'oro degli scudi: un disco d'oro un po' più grande, appena dietro lo scudo
  for (const { centro } of scudi) {
    pezzo(oro, centro.clone().addScaledVector(asse, -0.012).toArray(), [0.235, 0.03, 0.235], inclinazione, arcieri2, disco);
  }
  pezzo(ORO, [fuori * (r + 0.11), h + 0.1, 0], [0.03, 0.55, 0.22], [0, 0, 0], arcieri2);         // lo stendardo, appeso alla ringhiera
  pezzo(0xd8262e, [fuori * (r + 0.13), h + 0.12, 0], [0.02, 0.13, 0.13], [Math.PI / 4, 0, 0], arcieri2); // con il rombo rosso
  // le due bandierine sugli angoli davanti (dietro c'è già la bandiera grande)
  for (const lx of [-1, 1]) {
    pezzo(LEGNO_SCURO, [lx * r, h + 1.05, r], [0.035, 0.5, 0.035], [0, 0, 0], arcieri2);
    pezzo(ORO, [lx * r + 0.12, h + 1.22, r], [0.22, 0.14, 0.02], [0, 0, 0], arcieri2);
  }

  pietra.visible = false;
  metallo.visible = false;
  arcieri1.visible = false;
  arcieri2.visible = false;
  gruppo.add(pietra, metallo, arcieri1, arcieri2);
  // materiali[i]: le parti in più delle mura di livello i; arcieri[i]: le parti in più del potenziamento i
  gruppo.userData = { materiali: [null, pietra, metallo], arcieri: [null, arcieri1, arcieri2], bandiera };
  return gruppo;
}

// Arco con la corda, da mettere nella mano dell'arciere (verticale, curvo in avanti verso la Z negativa).
// livello: 0 = semplice, 1 = più grande con le fasce di cuoio, 2 = grande, d'oro, con le punte e una gemma
const ARCHI = [
  { raggio: 0.28, spessore: 0.025, colore: 0x8a5328 },
  { raggio: 0.34, spessore: 0.03, colore: 0x4a2d16 },
  { raggio: 0.39, spessore: 0.034, colore: 0xd9a520 },
];
export function creaArco(livello = 0) {
  const { raggio, spessore, colore } = ARCHI[livello];
  const arco = new THREE.Group();
  const legno = new THREE.Mesh(new THREE.TorusGeometry(raggio, spessore, 6, 16, Math.PI), livello === 2 ? oro : tinta(colore));
  legno.rotation.set(0, Math.PI / 2, -Math.PI / 2);
  const corda = new THREE.Mesh(scatola, tinta(0xefe6d0));
  corda.scale.set(0.012, raggio * 2, 0.012);
  arco.add(legno, corda);
  // i decori stanno "dentro" l'arco: (0, raggio) è l'impugnatura, (±raggio, 0) sono le due punte
  const decoro = (geometria, materiale, pos, scala, rot = [0, 0, 0]) => {
    const m = new THREE.Mesh(geometria, typeof materiale === 'number' ? tinta(materiale) : materiale);
    m.position.set(...pos);
    m.scale.set(...scala);
    m.rotation.set(...rot);
    legno.add(m);
  };
  if (livello >= 1) {
    // impugnatura e due fasce di cuoio (rosso scuro sull'arco d'oro)
    const cuoio = livello === 2 ? 0x8a1c22 : 0x9a5f2e;
    decoro(tronco, cuoio, [0, raggio, 0], [spessore * 1.5, 0.12, spessore * 1.5], [0, 0, Math.PI / 2]);
    for (const lato of [-1, 1]) {
      const a = Math.PI / 2 + lato * 0.75;
      decoro(tronco, cuoio, [Math.cos(a) * raggio, Math.sin(a) * raggio, 0], [spessore * 1.4, 0.04, spessore * 1.4], [0, 0, a]);
    }
  }
  if (livello === 2) {
    decoro(pomolo, 0xe8483a, [0, raggio, -spessore * 1.4], [0.03, 0.03, 0.02]);  // la gemma
    for (const lato of [-1, 1]) decoro(puntaPalo, acciaio, [lato * raggio, -0.04, 0], [0.03, 0.09, 0.03], [0, 0, Math.PI]);
  }
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
// (così "lookAt" la gira nella direzione in cui vola). aspetto: il potenziamento degli arcieri
// (0 piume rosse, 1 piume blu e punta più grande, 2 piume d'oro e punta che brilla).
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
