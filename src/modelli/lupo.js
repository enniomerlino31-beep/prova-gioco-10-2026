// =====================================================================
//  MODELLO DEL LUPO
//  Stile cartoon: pelo blu-grigio con la sella più scura sul dorso,
//  collare di pelo e petto color crema, ciuffi sulle guance, sopracciglia
//  arrabbiate, dentini, coda folta e artigli scuri.
//  Lungo circa 1,1 metri. Guarda verso la Z negativa (poi lo giriamo).
//
//  Testa, coda e zampe hanno ognuna il suo perno, per animarle (vedi animazioni.js).
//  I pezzi di ogni perno sono uniti in una forma sola (vedi pezzi.js).
//
//  COME SOSTITUIRLO IN FUTURO con un modello 3D vero: basta che
//  "creaLupo()" restituisca il gruppo, il corpo, la testa, la coda e le zampe da animare.
// =====================================================================

import * as THREE from 'three';
import { pezzo, unisciPezzi, costruisci } from './pezzi.js';

// Occhi del lupo gigante: rossi e luminosi (non li tocca la luce, quindi brillano sempre)
const OCCHI_ROSSI = new THREE.MeshBasicMaterial({ color: 0xff3a24 });
const OCCHI_CENTRO = new THREE.MeshBasicMaterial({ color: 0xffe27a });

// Colori del lupo normale e del lupo gigante (più scuro, con gli occhi gialli)
const COLORI = {
  normale: { pelo: 0x4d5b7c, scuro: 0x3a4561, crema: 0xf1e2c4, occhi: 0xffffff },
  gigante: { pelo: 0x2b3245, scuro: 0x1d2231, crema: 0x9a8f7a, occhi: 0xffd75a, cicatrice: 0xc9a58f, gengive: 0x7a1f2a },
};
const NERO = 0x1b1b22;
const BIANCO = 0xffffff;
const ARTIGLI = 0x2a2a33;

// Altezza del perno del corpo (le anche): le animazioni lo fanno saltare da qui
export const ALTEZZA_CORPO = 0.5;

// Dove stanno i perni: il corpo è sopra le zampe; testa, coda e zampe sono dentro il corpo
const PERNI = {
  corpo: new THREE.Vector3(0, ALTEZZA_CORPO, 0),
  testa: new THREE.Vector3(0, 0.3, -0.4),
  mascella: new THREE.Vector3(0, -0.04, -0.14), // la mascella inferiore, solo per il gigante (si apre quando ulula e morde)
  coda: new THREE.Vector3(0, 0.18, 0.45),
  zampaAs: new THREE.Vector3(-0.15, 0, -0.28), // anteriore sinistra
  zampaAd: new THREE.Vector3(0.15, 0, -0.28),  // anteriore destra
  zampaPs: new THREE.Vector3(-0.15, 0, 0.3),   // posteriore sinistra
  zampaPd: new THREE.Vector3(0.15, 0, 0.3),    // posteriore destra
};
const GENITORI = { mascella: 'testa', testa: 'corpo', coda: 'corpo', zampaAs: 'corpo', zampaAd: 'corpo', zampaPs: 'corpo', zampaPd: 'corpo' };

function pezziLupo({ pelo, scuro, crema, occhi, cicatrice, gengive }, gigante) {
  const pezzi = [
    // --- Corpo: busto, sella scura sul dorso, pancia, petto e collare di pelo ---
    pezzo('corpo', 'capsula', pelo, [0, 0.08, 0.02], [0.28, 0.32, 0.28], [Math.PI / 2, 0, 0]),
    pezzo('corpo', 'sfera', scuro, [0, 0.22, 0.08], [0.2, 0.12, 0.4]),
    pezzo('corpo', 'sfera', crema, [0, -0.06, 0], [0.2, 0.14, 0.38]),
    pezzo('corpo', 'sfera', crema, [0, 0.06, -0.3], [0.24, 0.26, 0.18]),
    pezzo('corpo', 'sfera', pelo, [0, 0.2, -0.3], [0.27, 0.22, 0.22]),
    // --- Testa: muso, naso, bocca ---
    pezzo('testa', 'sfera', pelo, [0, 0.05, -0.08], [0.26, 0.24, 0.25]),
    pezzo('testa', 'sfera', crema, [0, -0.03, -0.27], [0.14, 0.11, 0.17]),
    pezzo('testa', 'sfera', NERO, [0, 0.01, -0.43], [0.06, 0.05, 0.05]),
    ...(gigante ? [] : [pezzo('testa', 'scatola', NERO, [0, -0.09, -0.405], [0.1, 0.018, 0.02])]),
    // --- Coda folta con la punta crema ---
    pezzo('coda', 'sfera', pelo, [0, 0.1, 0.22], [0.12, 0.12, 0.26], [-0.6, 0, 0]),
    pezzo('coda', 'sfera', crema, [0, 0.24, 0.44], [0.085, 0.085, 0.085]),
  ];
  // ciuffi di pelo crema che pendono dal petto
  for (const x of [-0.08, 0, 0.08]) pezzi.push(pezzo('corpo', 'cono', crema, [x, -0.12, -0.36], [0.06, 0.14, 0.05], [Math.PI, 0, 0]));

  for (const lato of [-1, 1]) {
    pezzi.push(
      // ciuffi sulle guance, dentini
      pezzo('testa', 'cono', pelo, [lato * 0.2, -0.02, -0.06], [0.07, 0.16, 0.07], [0, 0, -lato * (Math.PI / 2 + 0.3)]),
      pezzo('testa', 'cono', BIANCO, [lato * 0.04, -0.115, -0.395], [0.015, 0.04, 0.015], [Math.PI, 0, 0]),
      // occhi con la pupilla e il riflesso, sopracciglia arrabbiate (inclinate verso il centro)
      ...(gigante
        ? [
            // occhi rossi che brillano, con il centro giallo, e sopracciglia spesse molto arrabbiate
            pezzo('testa', 'sfera', OCCHI_ROSSI, [lato * 0.095, 0.1, -0.3], [0.07, 0.065, 0.04]),
            pezzo('testa', 'sfera', OCCHI_CENTRO, [lato * 0.09, 0.098, -0.33], [0.03, 0.035, 0.015]),
            pezzo('testa', 'scatola', NERO, [lato * 0.1, 0.18, -0.25], [0.15, 0.05, 0.04], [0, 0, lato * 0.62]),
          ]
        : [
            pezzo('testa', 'sfera', occhi, [lato * 0.09, 0.1, -0.3], [0.055, 0.06, 0.035]),
            pezzo('testa', 'sfera', NERO, [lato * 0.085, 0.09, -0.325], [0.028, 0.032, 0.018]),
            pezzo('testa', 'sfera', BIANCO, [lato * 0.078, 0.105, -0.345], [0.01, 0.012, 0.006]),
            pezzo('testa', 'scatola', NERO, [lato * 0.095, 0.17, -0.25], [0.13, 0.035, 0.03], [0, 0, lato * 0.45]),
          ]),
      // orecchie a punta con l'interno crema
      pezzo('testa', 'cono', scuro, [lato * 0.13, 0.28, -0.02], [0.09, 0.2, 0.06], [0, 0, -lato * 0.25]),
      pezzo('testa', 'cono', crema, [lato * 0.13, 0.26, -0.05], [0.05, 0.13, 0.03], [0, 0, -lato * 0.25]),
    );
  }

  if (gigante) pezzi.push(...extraGigante({ pelo, scuro, crema, cicatrice, gengive }));

  // Zampe: coscia folta, gamba, piede scuro e tre artigli
  for (const perno of ['zampaAs', 'zampaAd', 'zampaPs', 'zampaPd']) {
    const dietro = perno.startsWith('zampaP');
    pezzi.push(
      pezzo(perno, 'sfera', pelo, [0, -0.05, dietro ? 0.02 : 0], dietro ? [0.11, 0.17, 0.13] : [0.095, 0.13, 0.1]),
      pezzo(perno, 'cilindro', pelo, [0, -0.22, 0], [0.075, 0.42, 0.075]),
      pezzo(perno, 'sfera', scuro, [0, -0.44, -0.02], [0.095, 0.06, 0.115]),
    );
    for (const ax of [-0.04, 0, 0.04]) pezzi.push(pezzo(perno, 'cono', ARTIGLI, [ax, -0.45, -0.12], [0.018, 0.06, 0.018], [-Math.PI / 2, 0, 0]));
  }
  return pezzi;
}

// Dettagli in più del lupo gigante: pelo folto e arruffato su collo e schiena, spalle larghe, muso arrabbiato con le zanne
// grandi e la bocca che si apre, cicatrici. Sono pochi pezzi, uniti ai perni come gli altri, quindi resta leggero.
function extraGigante({ pelo, scuro, crema, cicatrice, gengive }) {
  const p = [];
  // spalle e gobba: il petto è più largo e imponente
  p.push(pezzo('corpo', 'sfera', pelo, [0, 0.27, -0.22], [0.3, 0.2, 0.24]));
  // criniera arruffata: ciuffi a punta lungo il collo e la schiena (più lunghi sul collo)
  for (let i = 0; i < 9; i++) {
    const z = -0.38 + i * 0.1;
    const lungo = i < 4 ? 0.26 : 0.2;
    const lato = (i % 2 ? 1 : -1) * 0.03;
    p.push(pezzo('corpo', 'cono', i % 3 === 0 ? pelo : scuro, [lato, 0.36 - i * 0.012, z], [0.07, lungo, 0.06], [0.5 + (i % 3) * 0.1, 0, lato * 6]));
  }
  // collare di pelo ai lati del collo, a ciuffi
  for (const lato of [-1, 1]) {
    for (let k = 0; k < 3; k++) {
      p.push(pezzo('corpo', 'cono', k === 1 ? scuro : pelo, [lato * (0.2 + k * 0.03), 0.12 - k * 0.07, -0.32 + k * 0.03], [0.07, 0.19, 0.06], [0, 0, -lato * (Math.PI / 2 + 0.2 - k * 0.15)]));
    }
  }
  // ciuffi irti sulla coda
  for (const lato of [-1, 1]) p.push(pezzo('coda', 'cono', pelo, [lato * 0.07, 0.2, 0.38], [0.05, 0.16, 0.05], [0.4, 0, -lato * 0.7]));
  // muso: ponte del naso scuro con le rughe, il rosso della bocca (si vede quando è aperta), zanne grandi in alto e in basso
  p.push(pezzo('testa', 'scatola', scuro, [0, 0.07, -0.34], [0.07, 0.03, 0.2], [0.18, 0, 0]));
  p.push(pezzo('testa', 'sfera', gengive, [0, -0.075, -0.31], [0.085, 0.022, 0.12]));
  for (const lato of [-1, 1]) {
    p.push(pezzo('testa', 'cono', BIANCO, [lato * 0.06, -0.12, -0.38], [0.028, 0.1, 0.026], [Math.PI, 0, 0]));   // zanna in alto
    p.push(pezzo('testa', 'cono', BIANCO, [lato * 0.1, -0.1, -0.3], [0.02, 0.06, 0.02], [Math.PI, 0, 0]));
    p.push(pezzo('mascella', 'cono', BIANCO, [lato * 0.05, 0.05, -0.28], [0.024, 0.08, 0.022]));                 // zanna in basso
    p.push(pezzo('mascella', 'cono', BIANCO, [lato * 0.085, 0.03, -0.18], [0.018, 0.05, 0.018]));
    // cicatrice sulla guancia
    p.push(pezzo('testa', 'scatola', cicatrice, [lato * 0.19, 0.0, -0.16], [0.02, 0.12, 0.012], [0.2, lato * 0.3, lato * 0.5]));
  }
  // mascella inferiore: scura sotto, con il mento a punta
  p.push(pezzo('mascella', 'sfera', scuro, [0, 0.0, -0.17], [0.1, 0.045, 0.17]));
  p.push(pezzo('mascella', 'sfera', crema, [0, -0.02, -0.3], [0.06, 0.035, 0.06]));
  // cicatrici lunghe sul fianco e una che taglia l'occhio sinistro
  p.push(pezzo('corpo', 'scatola', cicatrice, [0.25, 0.1, 0.08], [0.012, 0.012, 0.3], [0.2, 0.1, -0.5]));
  p.push(pezzo('corpo', 'scatola', cicatrice, [-0.26, 0.05, 0.2], [0.012, 0.012, 0.24], [-0.2, 0, 0.6]));
  p.push(pezzo('testa', 'scatola', cicatrice, [-0.09, 0.13, -0.3], [0.012, 0.16, 0.012], [0.1, 0, -0.4]));
  return p;
}

// Le forme unite, preparate una volta sola per il lupo normale e per il gigante
const giaPronte = {};

// gigante: usa i colori del lupo gigante (la grandezza la decide chi lo crea)
export function creaLupo({ gigante = false } = {}) {
  const tipo = gigante ? 'gigante' : 'normale';
  giaPronte[tipo] ??= unisciPezzi(pezziLupo(COLORI[tipo], gigante));
  const gruppo = new THREE.Group();
  const perni = costruisci(giaPronte[tipo], PERNI, gruppo, GENITORI);
  const zampe = [perni.zampaAs, perni.zampaAd, perni.zampaPs, perni.zampaPd];
  return { gruppo, corpo: perni.corpo, testa: perni.testa, mascella: perni.mascella, coda: perni.coda, zampe, anim: { fase: Math.random() * 6 } };
}
