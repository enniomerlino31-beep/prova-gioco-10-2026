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
import { tinta, matrice, creaScritta } from '../modelli/materiali.js';
import { creaNeve } from '../motore/scena.js';

const COLORE_CIELO = 0xbfe3f7;

// Dove si trova ogni cosa nella segheria (x = destra/sinistra, z = avanti/indietro; z negativo = lontano)
export const MAPPA = {
  limiti: { xMin: -14, xMax: 14, zMin: -10, zMax: 12 }, // dove può camminare il boscaiolo
  partenza: new THREE.Vector3(0, 0, 3),                  // dove compare il boscaiolo
  tavolino: new THREE.Vector3(0, 0, 5.4),                // tavolo di vendita nascosto: l'azione avviene sugli sportelli delle mura
  soldi: new THREE.Vector3(2.5, 0, -0.35),               // la pila di soldi, davanti al tavolino
  catasta: new THREE.Vector3(-2.8, 0, -2.4),
  dispensa: new THREE.Vector3(-2.8, 0, 0.9),             // la cassa della carne
  cancello: new THREE.Vector3(-8.8, 0, 4),               // il sentiero per partire per una nuova corsa
  vendiLegna: new THREE.Vector3(-6.7, 0, 4.0),
  vendiCarne: new THREE.Vector3(6.7, 0, 4.0),
  // I clienti arrivano dal basso a destra, passano davanti agli sportelli e se ne vanno a sinistra in basso
  ingressoClienti: new THREE.Vector3(11, 0, 10),
  filaClienti: (posto) => new THREE.Vector3(8.5 - posto * 2.1, 0, 9.4),
  uscitaClienti: new THREE.Vector3(-11, 0, 12),
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

  // Palizzata continua attorno a tutta la base: nessun buco, tranne i due cancelli del sentiero.
  const palizzata = new THREE.Group();
  const pali = [];
  const aggiungiPalo = (x, z, rot = 0) => {
    const paloMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.17, 0.24, 1.45, 10),
      new THREE.MeshStandardMaterial({ color: new THREE.Color().setHSL((0.07 + Math.abs(x) * 0.012 + Math.abs(z) * 0.01) % 1, 0.38, 0.41) })
    );
    paloMesh.position.set(x, 0.72, z);
    paloMesh.rotation.z = rot;
    paloMesh.castShadow = true;
    const punta = new THREE.Mesh(new THREE.ConeGeometry(0.17, 0.5, 8), new THREE.MeshStandardMaterial({ color: 0xf3f8ff }));
    punta.position.set(0, 0.95, 0);
    punta.castShadow = true;
    paloMesh.add(punta);
    palizzata.add(paloMesh);
    pali.push(paloMesh);
    return paloMesh;
  };

  const half = 9.1;
  for (let i = 0; i < 34; i++) {
    const x = -half + i * ((half * 2) / 33);
    aggiungiPalo(x, -6.1, 0.04);
    aggiungiPalo(x, 6.0, -0.04);
  }
  for (let i = 0; i < 33; i++) {
    const z = -5.8 + i * (11.6 / 32);
    aggiungiPalo(-9.2, z, 0.06);
    aggiungiPalo(9.2, z, -0.06);
  }
  // Rimane un piccolo varco laterale cittato con il cancello di entrata/uscita.
  for (let i = 0; i < 12; i++) {
    const z = -5.8 + i * (11.6 / 11);
    if (z >= 2.9 && z <= 5.1) continue;
    aggiungiPalo(-9.2, z, 0.06);
  }

  const cancelloLegno = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1, 0.25), new THREE.MeshStandardMaterial({ color: 0x8a5a31 }));
  cancelloLegno.position.set(-8.8, 0.75, 4.0);
  cancelloLegno.castShadow = true;
  const cancelloLegno2 = cancelloLegno.clone();
  cancelloLegno2.position.set(-8.8, 0.75, 3.0);
  palizzata.add(cancelloLegno, cancelloLegno2);
  palizzata.userData.pali = pali;
  scena.add(palizzata);

  const sportelloLegna = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.52, 1.2), tinta(0x9f6a39));
  sportelloLegna.position.set(MAPPA.vendiLegna.x, 0.26, MAPPA.vendiLegna.z);
  sportelloLegna.castShadow = true;
  const sportelloCarne = sportelloLegna.clone();
  sportelloCarne.position.set(MAPPA.vendiCarne.x, 0.26, MAPPA.vendiCarne.z);
  const segnoLegna = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.3, 0.12), tinta(0x5b8e39));
  segnoLegna.position.set(MAPPA.vendiLegna.x, 0.95, MAPPA.vendiLegna.z + 0.12);
  const segnoCarne = segnoLegna.clone();
  segnoCarne.position.set(MAPPA.vendiCarne.x, 0.95, MAPPA.vendiCarne.z + 0.12);
  const cartelloLegna = creaScritta('LEGNA', { larghezza: 1.5, altezza: 0.38, sfondo: '#6e8f39', coloreTesto: '#fff6dc' });
  cartelloLegna.position.set(MAPPA.vendiLegna.x, 1.15, MAPPA.vendiLegna.z + 0.1);
  cartelloLegna.rotation.x = -0.7;
  const cartelloCarne = creaScritta('CARNE', { larghezza: 1.5, altezza: 0.38, sfondo: '#b33b2d', coloreTesto: '#fff6dc' });
  cartelloCarne.position.set(MAPPA.vendiCarne.x, 1.15, MAPPA.vendiCarne.z + 0.1);
  cartelloCarne.rotation.x = -0.7;
  scena.add(sportelloLegna, sportelloCarne, segnoLegna, segnoCarne, cartelloLegna, cartelloCarne);

  // Sentiero che esce dalla radura verso la foresta (da lì parte la corsa)
  const sentiero = new THREE.Mesh(new THREE.PlaneGeometry(14, 2.6), tinta(0xbfcfe2));
  sentiero.rotation.x = -Math.PI / 2;
  sentiero.position.set(MAPPA.cancello.x - 6, -0.005, MAPPA.cancello.z);
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
