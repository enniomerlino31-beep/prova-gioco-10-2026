// =====================================================================
//  MODELLO DELLO SPORTELLO DI VENDITA (fa parte delle mura)
//  Due pali grossi chiudono il varco nella palizzata; in mezzo c'è il
//  bancone che sporge verso l'esterno, coperto da una tettoia innevata
//  con l'insegna al centro. Dentro la base, un po' più indietro, c'è il
//  punto di deposito: una rastrelliera per i tronchi oppure un tavolo
//  con i ganci per la carne.
//  Misure "locali": x lungo le mura, z verso l'esterno (z = 0 è la linea
//  della palizzata, z negativo = dentro la base).
// =====================================================================

import * as THREE from 'three';
import { tinta, creaScritta } from './materiali.js';

export const MEZZA_APERTURA = 1.4;  // metà della luce tra i due pali (il bancone la riempie)
export const MEZZO_INGOMBRO = 1.76; // metà della larghezza totale, pali compresi: qui si ferma la palizzata
export const ALTEZZA_BANCO = 0.95;
export const BANCO_DENTRO = -0.3;   // il bancone entra di poco nella base...
export const BANCO_FUORI = 1.1;     // ...e sporge verso l'esterno
// Il deposito sta 2,4 m dentro la base: la telecamera guarda dal basso dello
// schermo, e se fosse attaccato al bancone la tettoia lo coprirebbe.
export const DEPOSITO_Z = -2.4;
export const DEPOSITO_MEZZA_X = 1.2;
export const DEPOSITO_MEZZA_Z = 0.45;
export const ALTEZZA_TAVOLO = 0.75;

const ALTEZZA_PALI = 2.7;
const LEGNO = 0x8a5a31;
const LEGNO_SCURO = 0x6e4022;
const LEGNO_CHIARO = 0xb57a45;
const NEVE = 0xf3f8ff;

export function creaSportello(tipo) {
  const gruppo = new THREE.Group();
  const scatola = new THREE.BoxGeometry(1, 1, 1);
  const pezzo = (colore, pos, scala, genitore = gruppo) => {
    const m = new THREE.Mesh(scatola, tinta(colore));
    m.position.set(...pos);
    m.scale.set(...scala);
    m.castShadow = true;
    m.receiveShadow = true;
    genitore.add(m);
    return m;
  };

  // --- Pali grossi ai lati del varco (la palizzata si ferma qui) ---
  for (const lato of [-1, 1]) {
    pezzo(LEGNO_SCURO, [lato * (MEZZA_APERTURA + 0.18), ALTEZZA_PALI / 2, 0], [0.36, ALTEZZA_PALI, 0.36]);
  }

  // --- Bancone: chiude il varco e sporge verso l'esterno ---
  const profondita = BANCO_FUORI - BANCO_DENTRO;
  const zBanco = (BANCO_FUORI + BANCO_DENTRO) / 2;
  pezzo(LEGNO, [0, (ALTEZZA_BANCO - 0.1) / 2, zBanco], [MEZZA_APERTURA * 2, ALTEZZA_BANCO - 0.1, profondita]);
  pezzo(LEGNO_CHIARO, [0, ALTEZZA_BANCO - 0.05, zBanco + 0.05], [MEZZA_APERTURA * 2 + 0.1, 0.1, profondita + 0.15]);
  for (let i = 0; i < 5; i++) {
    pezzo(LEGNO_SCURO, [-1.12 + i * 0.56, 0.42, BANCO_FUORI + 0.01], [0.06, 0.8, 0.04]); // assi sul davanti
  }
  // paletti sugli angoli esterni del bancone che reggono la tettoia
  for (const lato of [-1, 1]) {
    pezzo(LEGNO_SCURO, [lato * 1.28, ALTEZZA_BANCO + 0.78, BANCO_FUORI - 0.12], [0.14, 1.56, 0.14]);
  }

  // --- Tettoia di assi di legno, in pendenza verso l'esterno, con un filo di neve in cima ---
  const tettoia = new THREE.Group();
  tettoia.position.set(0, 2.62, 0.55);
  tettoia.rotation.x = 0.2;
  const larghezzaTetto = MEZZA_APERTURA * 2 + 0.9;
  const assi = 7;
  for (let i = 0; i < assi; i++) {
    const largo = larghezzaTetto / assi;
    pezzo(i % 2 ? LEGNO : LEGNO_CHIARO, [-larghezzaTetto / 2 + largo * (i + 0.5), 0, 0], [largo - 0.03, 0.1, 1.7], tettoia);
  }
  pezzo(LEGNO_SCURO, [0, -0.02, 0.83], [larghezzaTetto + 0.1, 0.16, 0.12], tettoia); // bordo davanti
  pezzo(NEVE, [0, 0.07, -0.72], [larghezzaTetto, 0.06, 0.26], tettoia);                // neve in cima
  gruppo.add(tettoia);

  // --- Insegna al centro, sul bordo esterno della tettoia ---
  const insegna = new THREE.Group();
  insegna.position.set(0, 2.78, 1.33);
  insegna.rotation.x = -0.25; // un po' inclinata all'indietro, così si legge dall'alto
  pezzo(LEGNO_SCURO, [0, 0, 0], [2.4, 0.64, 0.08], insegna);
  const scritta = creaScritta(tipo === 'carne' ? 'CARNE' : 'LEGNA', {
    larghezza: 2.2,
    altezza: 0.52,
    sfondo: tipo === 'carne' ? '#b33b2d' : '#6e8f39',
    coloreTesto: '#fff6dc',
  });
  scritta.position.z = 0.05;
  insegna.add(scritta);
  gruppo.add(insegna);

  // --- Punto di deposito, dentro la base ---
  if (tipo === 'carne') creaTavoloCarne(pezzo);
  else creaRastrelliera(pezzo);

  return gruppo;
}

// Rastrelliera: due traversine a terra e quattro montanti; i tronchi ci stanno sopra, uno sull'altro
function creaRastrelliera(pezzo) {
  const z = DEPOSITO_Z;
  for (const dz of [-0.3, 0.3]) {
    pezzo(LEGNO_SCURO, [0, 0.06, z + dz], [DEPOSITO_MEZZA_X * 2 - 0.1, 0.12, 0.14]);
    for (const lato of [-1, 1]) pezzo(LEGNO_SCURO, [lato * 1.08, 0.7, z + dz], [0.12, 1.4, 0.12]);
  }
  for (const lato of [-1, 1]) pezzo(LEGNO, [lato * 1.08, 1.36, z], [0.12, 0.1, 0.72]);
}

// Tavolo con una barra di ganci dietro: la carne viene appoggiata sul piano
function creaTavoloCarne(pezzo) {
  const z = DEPOSITO_Z;
  pezzo(LEGNO_CHIARO, [0, ALTEZZA_TAVOLO - 0.05, z], [DEPOSITO_MEZZA_X * 2, 0.1, DEPOSITO_MEZZA_Z * 2]);
  for (const lx of [-1, 1]) {
    for (const lz of [-1, 1]) {
      pezzo(LEGNO_SCURO, [lx * (DEPOSITO_MEZZA_X - 0.1), (ALTEZZA_TAVOLO - 0.1) / 2, z + lz * (DEPOSITO_MEZZA_Z - 0.1)], [0.1, ALTEZZA_TAVOLO - 0.1, 0.1]);
    }
  }
  // barra con i ganci, sul lato del tavolo verso l'interno della base
  const zBarra = z - DEPOSITO_MEZZA_Z - 0.08;
  for (const lato of [-1, 1]) pezzo(LEGNO_SCURO, [lato * 1.12, 0.95, zBarra], [0.1, 1.9, 0.1]);
  pezzo(LEGNO, [0, 1.85, zBarra], [2.34, 0.1, 0.1]);
  for (let i = 0; i < 5; i++) pezzo(0x9aa3ad, [-0.8 + i * 0.4, 1.7, zBarra], [0.04, 0.22, 0.04]);
}
