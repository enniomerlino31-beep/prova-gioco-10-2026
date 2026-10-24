// =====================================================================
//  AMBIENTE DELLA SEGHERIA
//  La radura innevata in alta montagna: terreno, abeti tutt'intorno,
//  montagne sullo sfondo, la casa-segheria, luci, neve e telecamera.
//  Qui c'è anche la "mappa": dove stanno mura, sportelli, catasta, cancello...
//  Vista dall'alto e un po' da dietro, come nei giochi "idle arcade".
// =====================================================================

import * as THREE from 'three';
import { CONFIG } from '../config.js';
import { creaAbetiIstanziati } from '../modelli/albero.js';
import { creaSegheria } from '../modelli/segheria.js';
import { tinta, matrice } from '../modelli/materiali.js';
import { MEZZO_INGOMBRO } from '../modelli/sportello.js';
import { creaNeve } from '../motore/scena.js';
import { MEZZO_INGOMBRO_CANCELLO } from './cancello.js';

const COLORE_CIELO = 0xbfe3f7;
const R_PALO = 0.24;     // raggio alla base di ogni palo della palizzata
const PASSO_PALI = 0.55; // distanza tra un palo e l'altro

// Dove si trova ogni cosa nella segheria (x = destra/sinistra, z = avanti/indietro; z negativo = lontano)
// Disposizione: a sinistra la colonna della LEGNA, a destra quella della CARNE, al centro una corsia libera.
// Dall'alto in basso ogni colonna ha: cerchio del miglioramento, catasta (o dispensa), deposito e sportello.
const COLONNA = 5.5; // distanza delle due colonne dal centro della base
// le torrette stanno a cavallo della palizzata: la prima a sinistra tra i due cancelli, la seconda a destra
const TORRI = [new THREE.Vector3(-11.2, 0, -0.3), new THREE.Vector3(11.2, 0, -0.3)];
const CERCHIO_TORRE = (torre) => new THREE.Vector3(torre.x - Math.sign(torre.x) * 2, 0, torre.z); // 2 metri dentro la base
export const MAPPA = {
  limiti: { xMin: -19, xMax: 19, zMin: -14.5, zMax: 16 }, // fin dove può andare il boscaiolo (anche fuori dalle mura)
  mura: { sinistra: -11.2, destra: 11.2, fondo: -7.4, fronte: 7.3 }, // le quattro file della palizzata
  partenza: new THREE.Vector3(0, 0, 1.2),                // dove compare il boscaiolo: in mezzo alla corsia centrale
  catasta: new THREE.Vector3(-COLONNA, 0, -1.6),         // qui arriva la legna dalla corsa
  dispensa: new THREE.Vector3(COLONNA, 0, -1.6),         // qui arriva la carne dalla corsa
  casaCacciatore: new THREE.Vector3(-7.8, 0, -3.7),      // dove aspetta il cacciatore (abbastanza lontano da non tenere aperto il cancello)
  // Cerchi dei miglioramenti, ognuno accanto a dove compare quello che compra (nessuno tocca un altro cerchio o un edificio).
  // Una lista invece di un punto = un posto diverso per ogni livello (il cerchio si sposta dopo l'acquisto).
  miglioramenti: {
    aiutante: new THREE.Vector3(-COLONNA, 0, -5.3),      // sopra la catasta, dove compare l'aiutante
    cacciatore: new THREE.Vector3(-8.6, 0, -5.8),        // accanto alla casa del cacciatore, vicino al cancello della foresta
    // prima torre: accanto alla torre di sinistra; seconda torre e "Potenzia arcieri": accanto alla torre di destra
    torretta: [CERCHIO_TORRE(TORRI[0]), CERCHIO_TORRE(TORRI[1]), CERCHIO_TORRE(TORRI[1]), CERCHIO_TORRE(TORRI[1])],
    mura: new THREE.Vector3(COLONNA, 0, -5.3),           // vicino alle mura di fondo
    riparazione: new THREE.Vector3(8.6, 0, -5.8),        // nell'angolo delle mura, accanto al cerchio delle mura
    venditore: new THREE.Vector3(8.8, 0, 3.6),           // accanto allo sportello CARNE, dove compare uno dei due venditori
  },
  torri: TORRI,
  // Due cancelli nella palizzata di sinistra (il punto è il centro del varco, sulla linea delle mura)
  cancelli: {
    foresta: new THREE.Vector3(-11.2, 0, -3.6),          // per uscire nella foresta
    corsa: new THREE.Vector3(-11.2, 0, 3.0),             // per partire per una nuova corsa
  },
  // Gli sportelli di vendita sono varchi nella palizzata davanti (in basso nello schermo)
  sportelli: {
    legna: new THREE.Vector3(-COLONNA, 0, 7.3),
    carne: new THREE.Vector3(COLONNA, 0, 7.3),
  },
  // I clienti arrivano dal basso, si mettono in fila davanti al loro sportello e se ne vanno di nuovo in basso
  ingressoClienti: new THREE.Vector3(0, 0, 16),
  casa: new THREE.Vector3(-1, 0, -12.5),
};

export function creaAmbiente() {
  const scena = new THREE.Scene();
  scena.background = new THREE.Color(COLORE_CIELO);
  scena.fog = new THREE.Fog(COLORE_CIELO, 30, 80);

  // --- Luci ---
  // (un po' meno forti che nella corsa: vista dall'alto la neve sembrerebbe tutta bianca)
  scena.add(new THREE.HemisphereLight(0xeaf6ff, 0x9fb9d6, 1.5));
  const sole = new THREE.DirectionalLight(0xfff1dc, 2.1);
  sole.position.set(8, 20, 8);
  sole.castShadow = true;
  sole.shadow.mapSize.set(2048, 2048);
  Object.assign(sole.shadow.camera, { left: -22, right: 22, top: 22, bottom: -22, near: 1, far: 60 });
  sole.shadow.bias = -0.0008;
  scena.add(sole, sole.target);

  // --- Terreno innevato e radura di neve battuta ---
  const terreno = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), tinta(0xf3f8ff));
  terreno.rotation.x = -Math.PI / 2;
  terreno.position.y = -0.02;
  terreno.receiveShadow = true;
  scena.add(terreno);

  const radura = new THREE.Mesh(new THREE.CircleGeometry(9.6, 48), tinta(0xd3e0ee));
  radura.rotation.x = -Math.PI / 2;
  radura.scale.set(1, 0.75, 1);
  radura.position.set(0, -0.01, 0.6);
  radura.receiveShadow = true;
  scena.add(radura);

  // --- Palizzata continua attorno a tutta la base ---
  // Si interrompe solo dove ci sono gli sportelli di vendita e i cancelli:
  // ogni fila di pali arriva fino ai pali grossi del varco e riprende subito dopo.
  // Ogni fila è anche un "muro" solido: un rettangolo che il boscaiolo non può attraversare.
  const palizzata = new THREE.Group();
  const pali = [];
  const collegamenti = []; // coppie di pali vicini nella stessa fila [indiceA, indiceB] (servono per le assi di metallo)
  const muri = [];
  // normale = da che parte è "fuori" per quel palo (serve per le rocce, che stanno solo all'esterno)
  const aggiungiPalo = (x, z, normale) => {
    const paloMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.17, R_PALO, 1.45, 10),
      new THREE.MeshStandardMaterial({ color: new THREE.Color().setHSL((0.07 + Math.abs(x) * 0.012 + Math.abs(z) * 0.01) % 1, 0.38, 0.41) })
    );
    paloMesh.position.set(x, 0.72, z);
    paloMesh.castShadow = true;
    const punta = new THREE.Mesh(new THREE.ConeGeometry(0.17, 0.5, 8), new THREE.MeshStandardMaterial({ color: 0xf3f8ff }));
    punta.position.set(0, 0.95, 0);
    punta.castShadow = true;
    paloMesh.add(punta);
    paloMesh.userData.normale = normale;
    palizzata.add(paloMesh);
    pali.push(paloMesh);
  };
  // Pali in fila dritta da (x1, z1) a (x2, z2), con un palo a ogni estremità (le file sono sempre dritte in x o in z)
  const filaDiPali = (x1, z1, x2, z2, normale) => {
    const n = Math.max(1, Math.round(Math.hypot(x2 - x1, z2 - z1) / PASSO_PALI));
    for (let i = 0; i <= n; i++) {
      if (i > 0) collegamenti.push([pali.length - 1, pali.length]);
      aggiungiPalo(x1 + ((x2 - x1) * i) / n, z1 + ((z2 - z1) * i) / n, normale);
    }
    muri.push({
      x: (x1 + x2) / 2,
      z: (z1 + z2) / 2,
      mezzaX: Math.abs(x2 - x1) / 2 + R_PALO,
      mezzaZ: Math.abs(z2 - z1) / 2 + R_PALO,
    });
  };
  // Divide un lato (da "da" ad "a") nei tratti che restano fuori dai varchi { centro, mezzo }
  const tratti = (da, a, varchi) => {
    const risultato = [];
    let inizio = da;
    for (const varco of [...varchi].sort((p, q) => p.centro - q.centro)) {
      risultato.push([inizio, varco.centro - varco.mezzo]);
      inizio = varco.centro + varco.mezzo;
    }
    risultato.push([inizio, a]);
    return risultato;
  };
  const M = MAPPA.mura;
  const varchiFronte = Object.values(MAPPA.sportelli).map((p) => ({ centro: p.x, mezzo: MEZZO_INGOMBRO + R_PALO }));
  const varchiSinistra = Object.values(MAPPA.cancelli).map((p) => ({ centro: p.z, mezzo: MEZZO_INGOMBRO_CANCELLO + R_PALO }));
  for (const [a, b] of tratti(M.sinistra, M.destra, [])) filaDiPali(a, M.fondo, b, M.fondo, { x: 0, z: -1 });
  for (const [a, b] of tratti(M.sinistra, M.destra, varchiFronte)) filaDiPali(a, M.fronte, b, M.fronte, { x: 0, z: 1 });
  // i due lati partono un passo dopo gli angoli (i pali d'angolo ci sono già)
  for (const [a, b] of tratti(M.fondo + PASSO_PALI, M.fronte - PASSO_PALI, varchiSinistra)) filaDiPali(M.sinistra, a, M.sinistra, b, { x: -1, z: 0 });
  for (const [a, b] of tratti(M.fondo + PASSO_PALI, M.fronte - PASSO_PALI, [])) filaDiPali(M.destra, a, M.destra, b, { x: 1, z: 0 });
  palizzata.userData.pali = pali;
  palizzata.userData.collegamenti = collegamenti;
  scena.add(palizzata);

  // Sentiero che esce dal cancello della corsa verso la foresta
  const sentiero = new THREE.Mesh(new THREE.PlaneGeometry(14, 2.6), tinta(0xbfcfe2));
  sentiero.rotation.x = -Math.PI / 2;
  sentiero.position.set(MAPPA.cancelli.corsa.x - 7, -0.005, MAPPA.cancelli.corsa.z);
  sentiero.receiveShadow = true;
  scena.add(sentiero);

  // --- Foresta molto più grande e più densa intorno alla base ---
  const posti = [];
  for (let i = 0; i < 560; i++) {
    const angolo = Math.random() * Math.PI * 2;
    const raggio = 21.5 + Math.random() * 36;
    const x = Math.cos(angolo) * raggio;
    const z = Math.sin(angolo) * raggio * 0.95;
    if (x < -9 && Math.abs(z - MAPPA.cancelli.corsa.z) < 3.5) continue;
    const scala = 1.1 + Math.random() * 1.3;
    posti.push(matrice([x, 0, z], [0, Math.random() * 6, 0], [scala, scala * 1.18, scala]));
  }
  scena.add(creaAbetiIstanziati(posti));

  // --- Montagne sullo sfondo con la cima innevata ---
  const cono = new THREE.ConeGeometry(1, 1, 7);
  for (let i = 0; i < 9; i++) {
    const x = -70 + i * 17 + Math.random() * 6;
    const altezza = 18 + Math.random() * 16;
    const larghezza = 14 + Math.random() * 8;
    const z = -55 - Math.random() * 15;
    const roccia = new THREE.Mesh(cono, tinta(0x8fa6c4));
    roccia.scale.set(larghezza, altezza, larghezza);
    roccia.position.set(x, altezza / 2 - 1, z);
    const cima = new THREE.Mesh(cono, tinta(0xffffff));
    cima.scale.set(larghezza * 0.42, altezza * 0.42, larghezza * 0.42);
    cima.position.set(x, altezza - 1 - (altezza * 0.42) / 2 + 0.2, z);
    scena.add(roccia, cima);
  }

  // --- La casa-segheria sullo sfondo ---
  const casa = creaSegheria();
  casa.position.copy(MAPPA.casa);
  casa.scale.setScalar(0.85);
  scena.add(casa);

  // --- Neve che cade ---
  const neve = creaNeve();
  scena.add(neve.punti);

  // --- Telecamera ---
  const telecamera = new THREE.PerspectiveCamera(50, 1, 0.1, 200);
  function adattaSchermo() {
    telecamera.aspect = window.innerWidth / window.innerHeight;
    const cfg = CONFIG.telecameraSegheria;
    telecamera.fov = telecamera.aspect < 1 ? cfg.angoloTelefono : cfg.angoloComputer;
    telecamera.updateProjectionMatrix();
  }
  window.addEventListener('resize', adattaSchermo);
  adattaSchermo();

  const puntoSeguito = new THREE.Vector3();
  let zoomAttuale = 1;
  let primaVolta = true;

  return {
    scena,
    telecamera,
    palizzata,
    muri,
    // La telecamera segue il boscaiolo con un po' di morbidezza.
    // Opzioni (le usa la telecamera che va a vedere un miglioramento appena comprato):
    //  zoom: 1 = normale, più di 1 = più in alto e più lontano, meno di 1 = più vicino
    //  libero: true = può guardare anche il bordo della base (di solito resta un po' verso il centro)
    //  morbidezza: più è alta, più in fretta raggiunge il punto
    segui(posizione, dt, { zoom = 1, libero = false, morbidezza = 4 } = {}) {
      const cfg = CONFIG.telecameraSegheria;
      // la telecamera non si allontana troppo dalla base (ma segue il boscaiolo anche quando esce)
      const obiettivo = libero
        ? new THREE.Vector3(posizione.x, 0, posizione.z)
        : new THREE.Vector3(THREE.MathUtils.clamp(posizione.x, -10, 10), 0, THREE.MathUtils.clamp(posizione.z, -6.5, 7.5));
      const passo = Math.min(1, dt * morbidezza);
      if (primaVolta) {
        puntoSeguito.copy(obiettivo);
        zoomAttuale = zoom;
        primaVolta = false;
      } else {
        puntoSeguito.lerp(obiettivo, passo);
        zoomAttuale += (zoom - zoomAttuale) * passo;
      }
      telecamera.position.set(puntoSeguito.x, cfg.altezza * zoomAttuale, puntoSeguito.z + cfg.distanzaDietro * zoomAttuale);
      telecamera.lookAt(puntoSeguito.x, 0, puntoSeguito.z - 1);
      neve.aggiorna(dt, telecamera.position);
      // la lama della sega gira
      casa.userData.lama.rotation.y += dt * 5;
    },
    reimpostaTelecamera() {
      primaVolta = true;
    },
  };
}
