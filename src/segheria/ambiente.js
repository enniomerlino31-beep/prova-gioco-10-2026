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
export const MAPPA = {
  limiti: { xMin: -14, xMax: 14, zMin: -10, zMax: 12 }, // dove può camminare il boscaiolo
  mura: { sinistra: -9.2, destra: 9.2, fondo: -6.1, fronte: 6.0 }, // le quattro file della palizzata
  partenza: new THREE.Vector3(0, 0, 3),                  // dove compare il boscaiolo
  catasta: new THREE.Vector3(-2.8, 0, -2.4),
  dispensa: new THREE.Vector3(-2.8, 0, 0.9),             // la cassa della carne
  cancello: new THREE.Vector3(-9.2, 0, 1),               // il varco nella palizzata di sinistra per partire per una nuova corsa
  // Gli sportelli di vendita sono varchi nella palizzata davanti (in basso nello schermo)
  sportelli: {
    legna: new THREE.Vector3(-5.5, 0, 6.0),
    carne: new THREE.Vector3(5.5, 0, 6.0),
  },
  // I clienti arrivano da destra, fuori dalle mura, aspettano in fila e se ne vanno a sinistra
  ingressoClienti: new THREE.Vector3(13, 0, 9.6),
  filaClienti: (posto) => new THREE.Vector3(9.5 - posto * 2, 0, 9.6),
  uscitaClienti: new THREE.Vector3(-13, 0, 9.6),
  casa: new THREE.Vector3(-1, 0, -10),
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
  Object.assign(sole.shadow.camera, { left: -18, right: 18, top: 18, bottom: -18, near: 1, far: 60 });
  sole.shadow.bias = -0.0008;
  scena.add(sole, sole.target);

  // --- Terreno innevato e radura di neve battuta ---
  const terreno = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), tinta(0xf3f8ff));
  terreno.rotation.x = -Math.PI / 2;
  terreno.position.y = -0.02;
  terreno.receiveShadow = true;
  scena.add(terreno);

  const radura = new THREE.Mesh(new THREE.CircleGeometry(7.8, 48), tinta(0xd3e0ee));
  radura.rotation.x = -Math.PI / 2;
  radura.scale.set(1, 0.75, 1);
  radura.position.set(0, -0.01, 0.5);
  radura.receiveShadow = true;
  scena.add(radura);

  // --- Palizzata continua attorno a tutta la base ---
  // Si interrompe solo dove ci sono gli sportelli di vendita e il cancello della corsa:
  // ogni fila di pali arriva fino ai pali grossi del varco e riprende subito dopo.
  const palizzata = new THREE.Group();
  const pali = [];
  const aggiungiPalo = (x, z) => {
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
    palizzata.add(paloMesh);
    pali.push(paloMesh);
  };
  // Pali in fila dritta da (x1, z1) a (x2, z2), con un palo a ogni estremità
  const filaDiPali = (x1, z1, x2, z2) => {
    const n = Math.max(1, Math.round(Math.hypot(x2 - x1, z2 - z1) / PASSO_PALI));
    for (let i = 0; i <= n; i++) aggiungiPalo(x1 + ((x2 - x1) * i) / n, z1 + ((z2 - z1) * i) / n);
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
  const varcoCancello = { centro: MAPPA.cancello.z, mezzo: MEZZO_INGOMBRO_CANCELLO + R_PALO };
  for (const [a, b] of tratti(M.sinistra, M.destra, [])) filaDiPali(a, M.fondo, b, M.fondo);
  for (const [a, b] of tratti(M.sinistra, M.destra, varchiFronte)) filaDiPali(a, M.fronte, b, M.fronte);
  // i due lati partono un passo dopo gli angoli (i pali d'angolo ci sono già)
  for (const [a, b] of tratti(M.fondo + PASSO_PALI, M.fronte - PASSO_PALI, [varcoCancello])) filaDiPali(M.sinistra, a, M.sinistra, b);
  for (const [a, b] of tratti(M.fondo + PASSO_PALI, M.fronte - PASSO_PALI, [])) filaDiPali(M.destra, a, M.destra, b);
  palizzata.userData.pali = pali;
  scena.add(palizzata);

  // Sentiero che esce dal cancello verso la foresta (da lì parte la corsa)
  const sentiero = new THREE.Mesh(new THREE.PlaneGeometry(14, 2.6), tinta(0xbfcfe2));
  sentiero.rotation.x = -Math.PI / 2;
  sentiero.position.set(MAPPA.cancello.x - 7, -0.005, MAPPA.cancello.z);
  sentiero.receiveShadow = true;
  scena.add(sentiero);

  // --- Foresta molto più grande e più densa intorno alla base ---
  const posti = [];
  for (let i = 0; i < 560; i++) {
    const angolo = Math.random() * Math.PI * 2;
    const raggio = 18 + Math.random() * 36;
    const x = Math.cos(angolo) * raggio;
    const z = Math.sin(angolo) * raggio * 0.95;
    if (Math.abs(x) < 12 && Math.abs(z) < 9) continue;
    if (x < -7 && Math.abs(z - MAPPA.cancello.z) < 3.5) continue;
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
  let primaVolta = true;

  return {
    scena,
    telecamera,
    palizzata,
    // La telecamera segue il boscaiolo con un po' di morbidezza
    segui(posizione, dt) {
      const cfg = CONFIG.telecameraSegheria;
      // la telecamera non si allontana troppo dal centro della radura
      const obiettivo = new THREE.Vector3(
        THREE.MathUtils.clamp(posizione.x, -6, 6),
        0,
        THREE.MathUtils.clamp(posizione.z, -4, 5)
      );
      if (primaVolta) {
        puntoSeguito.copy(obiettivo);
        primaVolta = false;
      } else {
        puntoSeguito.lerp(obiettivo, Math.min(1, dt * 4));
      }
      telecamera.position.set(puntoSeguito.x, cfg.altezza, puntoSeguito.z + cfg.distanzaDietro);
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
