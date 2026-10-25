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
import { creaNeveATerra } from './neveATerra.js';

const COLORE_CIELO = 0xbfe3f7;
export const R_PALO = 0.24;    // raggio alla base di ogni palo verticale della palizzata
const PASSO_PALI = 0.55;       // distanza tra un palo e l'altro: quasi attaccati (come nella foto distanza-pali)

// Dove si trova ogni cosa nella segheria (x = destra/sinistra, z = avanti/indietro; z negativo = lontano)
// Disposizione: a sinistra la colonna della LEGNA, a destra quella della CARNE, al centro una corsia libera.
// Dall'alto in basso la colonna della legna ha: catasta, deposito e sportello; quella della carne: il banco
// da lavoro del cacciatore, il deposito (il tavolo dove arriva anche la carne della corsa) e lo sportello.
const COLONNA = 5.5; // distanza delle due colonne dal centro della base
// le torrette stanno a cavallo della palizzata, due per lato: una sopra e una sotto il cancello del lato.
// L'ordine è quello in cui si comprano: sinistra 1 (in alto), destra 1 (in alto), sinistra 2 (in basso), destra 2 (in basso)
const TORRI = [
  new THREE.Vector3(-11.2, 0, -4.2), new THREE.Vector3(11.2, 0, -4.2),
  new THREE.Vector3(-11.2, 0, 2.8), new THREE.Vector3(11.2, 0, 2.8),
];
// Il cerchio di ogni torre, dentro la base: quelle in alto 2 metri dentro, alla stessa altezza; quelle in basso
// un po' più dentro e più in alto
const CERCHIO_TORRE = (i) => {
  const torre = TORRI[i];
  const verso = Math.sign(torre.x);
  return i < 2 ? new THREE.Vector3(torre.x - verso * 2, 0, torre.z) : new THREE.Vector3(torre.x - verso * 2.6, 0, torre.z - 1.2);
};
// Un posto di un cerchio con la scritta sotto invece che sopra
const sotto = (punto) => Object.assign(punto, { scrittaSotto: true });
const MURA = { sinistra: -11.2, destra: 11.2, fondo: -7.4, fronte: 7.3 }; // le quattro file della palizzata
const META_LATO = (MURA.fondo + MURA.fronte) / 2; // il centro dei lati sinistro e destro
export const MAPPA = {
  limiti: { xMin: -19, xMax: 19, zMin: -14.5, zMax: 16 }, // fin dove può andare il boscaiolo (anche fuori dalle mura)
  mura: MURA,
  partenza: new THREE.Vector3(0, 0, 0.2),                // dove compare il boscaiolo: in mezzo alla corsia centrale (tra la scritta del pavimento e quella del venditore)
  catasta: new THREE.Vector3(-COLONNA, 0, -1.6),         // qui arriva la legna dalla corsa
  // Il banco da lavoro del cacciatore, nella colonna di destra (di fronte alla catasta);
  // quando non caccia, il cacciatore sta davanti al banco, girato verso il tavolo
  bancoCacciatore: new THREE.Vector3(COLONNA, 0, -1.6),
  casaCacciatore: new THREE.Vector3(COLONNA, 0, -0.75),
  // Cerchi dei miglioramenti, ognuno accanto a dove compare quello che compra. Delle due file (DIFESA ed
  // ECONOMIA) si vede solo il prossimo acquisto, nel suo posto; comprato quello, il cerchio si sposta nel
  // posto del successivo. Una lista invece di un punto = un posto diverso per ogni livello.
  // Nessun cerchio (e nessuna scritta dei cerchi) tocca un altro cerchio, un edificio o un'insegna:
  // "sotto" = la scritta sta sotto il cerchio (di solito sta sopra, ma lì non ci sarebbe posto).
  miglioramenti: {
    // in alto, ai due lati del cerchio CORSA: mura a destra, riparazione a sinistra
    mura: sotto(new THREE.Vector3(3.2, 0, -5.9)),
    riparazione: sotto(new THREE.Vector3(-3.2, 0, -5.9)),
    // ogni torretta accanto alla sua torre; "Potenzia arcieri" (livelli 5 e 6) accanto alla torre destra 1
    torretta: [CERCHIO_TORRE(0), CERCHIO_TORRE(1), CERCHIO_TORRE(2), CERCHIO_TORRE(3), CERCHIO_TORRE(1), CERCHIO_TORRE(1)],
    aiutante: sotto(new THREE.Vector3(-2.6, 0, -1.6)), // accanto alla catasta, verso la corsia (non sulla strada catasta-sportello)
    venditore: new THREE.Vector3(0, 0, 2.65),          // al centro, tra i due sportelli dove lavorano i venditori
    cacciatore: new THREE.Vector3(5.8, 0, -4.5),       // accanto al banco del cacciatore, in alto a destra: non è sulla strada di nessuno
    secondoCacciatore: new THREE.Vector3(5.8, 0, -4.5), // nello stesso posto: si compra dopo il primo
    // il pavimento (si vede solo quando sono stati assunti tutti i lavoratori base): al centro della base, tra il
    // cerchio CORSA e il punto dove compare il boscaiolo, con la scritta sotto
    pavimentoPietra: sotto(new THREE.Vector3(0, 0, -3.45)),
  },
  // L'unico cerchio delle monete: i clienti dei due sportelli pagano qui, dentro la base tra i due depositi
  monete: new THREE.Vector3(0, 0, 5.2),
  torri: TORRI,
  // Tre cancelli (il punto è il centro del varco, sulla linea delle mura)
  cancelli: {
    corsa: new THREE.Vector3(0, 0, MURA.fondo),              // in alto al centro, davanti alla segheria: per partire per una corsa
    foresta: new THREE.Vector3(MURA.sinistra, 0, META_LATO), // al centro del lato sinistro: per uscire nella foresta
    destra: new THREE.Vector3(MURA.destra, 0, META_LATO),    // al centro del lato destro (lo usa anche il cacciatore)
  },
  // Gli sportelli di vendita sono varchi nella palizzata davanti (in basso nello schermo)
  sportelli: {
    legna: new THREE.Vector3(-COLONNA, 0, 7.3),
    carne: new THREE.Vector3(COLONNA, 0, 7.3),
  },
  // I clienti arrivano dal basso, si mettono in fila davanti al loro sportello e se ne vanno di nuovo in basso
  ingressoClienti: new THREE.Vector3(0, 0, 16),
  casa: new THREE.Vector3(0, 0, -12.5), // la segheria, fuori dal cancello della corsa
};

// Da che parte è "fuori" per un punto sulla linea delle mura (es. un cancello): { x, z }
export function latoDelleMura(punto) {
  if (Math.abs(punto.z - MURA.fondo) < 0.01) return { x: 0, z: -1 };
  if (Math.abs(punto.z - MURA.fronte) < 0.01) return { x: 0, z: 1 };
  return { x: Math.sign(punto.x), z: 0 };
}

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

  // --- Terreno innevato, anche dentro la base (onde leggere, mucchietti, scintillio: vedi neveATerra.js) ---
  const neveATerra = creaNeveATerra(scena);

  // --- Palizzata continua attorno a tutta la base ---
  // Solo pali verticali grossi, quasi attaccati. Qui ci sono solo i "dati" (dove sta ogni palo, ogni fila):
  // i pali li disegna mura.js, tutti in un colpo solo.
  // Si interrompe solo dove ci sono gli sportelli di vendita e i cancelli:
  // ogni fila di pali arriva fino ai pali grossi del varco e riprende subito dopo.
  // Ogni fila è anche un "muro" solido: un rettangolo che il boscaiolo non può attraversare.
  const pali = [];         // { position, userData: { normale } } (normale = da che parte è "fuori": le rocce stanno solo lì)
  const collegamenti = []; // coppie di pali vicini nella stessa fila [indiceA, indiceB] (servono per le fasce di metallo)
  const muri = [];
  // Pali in fila dritta da (x1, z1) a (x2, z2), con un palo a ogni estremità (le file sono sempre dritte in x o in z)
  const filaDiPali = (x1, z1, x2, z2, normale) => {
    const n = Math.max(1, Math.round(Math.hypot(x2 - x1, z2 - z1) / PASSO_PALI));
    for (let i = 0; i <= n; i++) {
      if (i > 0) collegamenti.push([pali.length - 1, pali.length]);
      pali.push({ position: new THREE.Vector3(x1 + ((x2 - x1) * i) / n, 0, z1 + ((z2 - z1) * i) / n), userData: { normale } });
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
  // i cancelli di ogni lato: sul lato in alto il varco è lungo x, su quelli a destra e sinistra lungo z
  const cancelli = Object.values(MAPPA.cancelli);
  const varchiCancelli = (lato) => cancelli
    .filter((p) => { const n = latoDelleMura(p); return n.x === lato.x && n.z === lato.z; })
    .map((p) => ({ centro: lato.z ? p.x : p.z, mezzo: MEZZO_INGOMBRO_CANCELLO + R_PALO }));
  for (const [a, b] of tratti(M.sinistra, M.destra, varchiCancelli({ x: 0, z: -1 }))) filaDiPali(a, M.fondo, b, M.fondo, { x: 0, z: -1 });
  for (const [a, b] of tratti(M.sinistra, M.destra, varchiFronte)) filaDiPali(a, M.fronte, b, M.fronte, { x: 0, z: 1 });
  // i due lati partono un passo dopo gli angoli (i pali d'angolo ci sono già)
  for (const [a, b] of tratti(M.fondo + PASSO_PALI, M.fronte - PASSO_PALI, varchiCancelli({ x: -1, z: 0 }))) filaDiPali(M.sinistra, a, M.sinistra, b, { x: -1, z: 0 });
  for (const [a, b] of tratti(M.fondo + PASSO_PALI, M.fronte - PASSO_PALI, varchiCancelli({ x: 1, z: 0 }))) filaDiPali(M.destra, a, M.destra, b, { x: 1, z: 0 });
  const palizzata = { pali, collegamenti };

  // Sentiero che esce dal cancello della corsa e arriva alla segheria
  const sentiero = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 3.4), tinta(0xbfcfe2));
  sentiero.rotation.x = -Math.PI / 2;
  sentiero.position.set(MAPPA.cancelli.corsa.x, -0.005, MAPPA.cancelli.corsa.z - 1.7);
  sentiero.receiveShadow = true;
  scena.add(sentiero);

  // --- Foresta molto più grande e più densa intorno alla base ---
  const posti = [];
  for (let i = 0; i < 560; i++) {
    const angolo = Math.random() * Math.PI * 2;
    const raggio = 21.5 + Math.random() * 36;
    const x = Math.cos(angolo) * raggio;
    const z = Math.sin(angolo) * raggio * 0.95;
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
      neveATerra.aggiorna(dt);
      // la lama della sega gira
      casa.userData.lama.rotation.y += dt * 5;
    },
    reimpostaTelecamera() {
      primaVolta = true;
    },
  };
}
