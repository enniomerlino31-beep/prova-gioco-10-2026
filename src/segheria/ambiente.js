// =====================================================================
//  AMBIENTE DELLA SEGHERIA
//  La radura innevata in alta montagna: terreno, abeti tutt'intorno,
//  montagne sullo sfondo, la casa-segheria, luci, neve e telecamera.
//  Qui c'è anche la "mappa": dove stanno tavolino, catasta, soldi, cancello...
//  Vista dall'alto e un po' da dietro, come nei giochi "idle arcade".
// =====================================================================

import * as THREE from 'three';
import { CONFIG } from '../config.js';
import { creaAbetiIstanziati } from '../modelli/albero.js';
import { creaSegheria } from '../modelli/segheria.js';
import { tinta, matrice } from '../modelli/materiali.js';
import { creaNeve } from '../motore/scena.js';

const COLORE_CIELO = 0xbfe3f7;

// Dove si trova ogni cosa nella segheria (x = destra/sinistra, z = avanti/indietro; z negativo = lontano)
export const MAPPA = {
  limiti: { xMin: -10, xMax: 10, zMin: -6, zMax: 8 }, // dove può camminare il boscaiolo
  partenza: new THREE.Vector3(0, 0, 3),               // dove compare il boscaiolo
  tavolino: new THREE.Vector3(2.5, 0, -2),
  soldi: new THREE.Vector3(2.5, 0, -0.35),            // la pila di soldi, davanti al tavolino
  catasta: new THREE.Vector3(-2.8, 0, -2.4),
  dispensa: new THREE.Vector3(-2.8, 0, 0.9),          // la cassa della carne
  cancello: new THREE.Vector3(-8.6, 0, 4),            // il sentiero per partire per una nuova corsa
  // I clienti arrivano da destra, si mettono in fila dietro al tavolino e se ne vanno in fondo
  ingressoClienti: new THREE.Vector3(14, 0, -3.2),
  filaClienti: (posto) => new THREE.Vector3(2.5 + posto * 1.3, 0, -3.2),
  uscitaClienti: new THREE.Vector3(14, 0, -7),
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

  const radura = new THREE.Mesh(new THREE.CircleGeometry(12.5, 48), tinta(0xd3e0ee));
  radura.rotation.x = -Math.PI / 2;
  radura.scale.set(1, 0.75, 1);
  radura.position.set(0, -0.01, 0.5);
  radura.receiveShadow = true;
  scena.add(radura);

  // Sentiero che esce dalla radura verso la foresta (da lì parte la corsa)
  const sentiero = new THREE.Mesh(new THREE.PlaneGeometry(14, 2.6), tinta(0xbfcfe2));
  sentiero.rotation.x = -Math.PI / 2;
  sentiero.position.set(MAPPA.cancello.x - 6, -0.005, MAPPA.cancello.z);
  sentiero.receiveShadow = true;
  scena.add(sentiero);

  // --- Abeti tutt'intorno (non davanti alla telecamera e non sul sentiero) ---
  const posti = [];
  for (let i = 0; i < 260; i++) {
    const angolo = Math.random() * Math.PI * 2;
    const raggio = 13 + Math.random() * 22;
    const x = Math.cos(angolo) * raggio;
    const z = Math.sin(angolo) * raggio * 0.85;
    if (z > 9 && Math.abs(x) < 16) continue; // lascia libera la vista
    if (x < -8 && Math.abs(z - MAPPA.cancello.z) < 2.5) continue; // lascia libero il sentiero
    posti.push(matrice([x, 0, z], [0, Math.random() * 6, 0], Array(3).fill(1 + Math.random() * 0.9)));
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
