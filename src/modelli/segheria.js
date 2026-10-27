// =====================================================================
//  MODELLO DELLA SEGHERIA (fuori dal cancello della corsa e in cima alla salita finale)
//  Un capanno di tronchi (lo stesso legno delle mura) con il tetto spiovente coperto
//  di neve e i ghiaccioli, il camino che fuma piano, le finestre con la luce calda,
//  la lanterna accanto alla porta e l'insegna "SEGHERIA" sul tetto, sopra la porta.
//  Di lato, sotto una tettoia, c'è la sega circolare: la lama gira, un tronco avanza
//  verso la lama e vola un po' di segatura.
//  L'aspetto segue le mura (imposta(livello)):
//    0 legno:   capanno semplice
//    1 pietra:  basamento e camino in pietra
//    2 metallo: angoli e cerniere di ferro con i bulloni, lama più grande e lucida
//  Leggero per il telefono: tutti i pezzi fermi di un gruppo sono uniti in una forma
//  sola per materiale (come le mura e i personaggi), vedi pezzi.js.
// =====================================================================

import * as THREE from 'three';
import { creaScritta, legnoPali } from './materiali.js';
import { pezzo as parte, unisciPezzi } from './pezzi.js';

const MEZZO_PI = Math.PI / 2;
const LEGNO = 0x8a5a31;
const LEGNO_SCURO = 0x4a2a12;
const LEGNO_CHIARO = 0xb57a45;
const TAVOLE = [0xcf9f5f, 0xbf8f50];
const NEVE = 0xf6faff;
const GHIACCIO = 0xd8f0ff;
const PIETRE = [0x9aa2ad, 0x8b939e, 0xa9b0ba, 0x7f8894];
const ORO = 0xe8b84a;

// Il tetto: cresta a 4,8 m, gronda a 2,05 m dall'asse (pendenza di circa 34 gradi)
const CRESTA = 4.8;
const PENDENZA = 1.4 / 2.05;
const INCLINAZIONE = Math.atan(PENDENZA);
const COS = Math.cos(INCLINAZIONE);
const SIN = Math.sin(INCLINAZIONE);
// un punto della falda davanti: a distanza z dalla cresta, alzato di "sopra" metri lungo la normale
const falda = (z, sopra = 0) => [0, CRESTA - z * PENDENZA + sopra * COS, z + sopra * SIN];

// La sega e il tronco
const LAMA = new THREE.Vector3(4.4, 1.5, 1.1); // il centro della lama (gira attorno all'asse z)
const TAVOLO = 0.95;                           // altezza del piano del tavolo
const TRONCO = { lunghezza: 1.3, raggio: 0.28, partenza: 5.4, taglio: 4.55 }; // x del centro del tronco
// il carrello: avanti, fermo a tagliare, indietro svelto, pausa (secondi)
const FASI = { avanti: 4.4, fermo: 0.5, indietro: 0.9, pausa: 0.8 };
const CICLO = FASI.avanti + FASI.fermo + FASI.indietro + FASI.pausa;
const SEGATURE = 18;
const NUVOLE = 7;

// Numeri "a caso" ma sempre uguali (così i ghiaccioli e le pietre sono sempre gli stessi)
const caso = (i, k = 0) => {
  const v = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453;
  return v - Math.floor(v);
};

// Rimbalzo quando un pezzo spunta (k da 0 a 1), come le torrette
function spunta(k) {
  if (k >= 1) return 1;
  return 1 + 2.2 * Math.pow(k - 1, 3) + 1.2 * Math.pow(k - 1, 2);
}

// Prisma a base triangolare lungo x (1 m), base a terra e punta in alto a 1,5 m: il timpano del tetto
function prismaTimpano() {
  const g = new THREE.CylinderGeometry(1, 1, 1, 3);
  g.rotateZ(MEZZO_PI);
  g.rotateX(-MEZZO_PI);
  g.translate(0, 0.5, 0);
  return g;
}

// Macchia di luce sfumata (finestre e lanterna)
let materialeAlone = null;
function alone(opacita, scala) {
  if (!materialeAlone) {
    const tela = document.createElement('canvas');
    tela.width = 64;
    tela.height = 64;
    const ctx = tela.getContext('2d');
    const sfumatura = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    sfumatura.addColorStop(0, 'rgba(255,225,150,1)');
    sfumatura.addColorStop(0.4, 'rgba(255,190,90,0.55)');
    sfumatura.addColorStop(1, 'rgba(255,160,60,0)');
    ctx.fillStyle = sfumatura;
    ctx.fillRect(0, 0, 64, 64);
    const texture = new THREE.CanvasTexture(tela);
    texture.colorSpace = THREE.SRGBColorSpace;
    materialeAlone = texture;
  }
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
    map: materialeAlone, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: opacita,
  }));
  sprite.scale.setScalar(scala);
  return sprite;
}

export function creaSegheria() {
  const radice = new THREE.Group();
  const parti = [];
  // aggiunge un pezzo: perno = a quale gruppo appartiene (base, pietraDx, metalloSx, lama0...)
  const p = (perno, forma, colore, pos, scala, rot = [0, 0, 0]) => parti.push(parte(perno, forma, colore, pos, scala, rot));
  const lato = (x) => (x >= 0 ? 'Dx' : 'Sx');

  // ---- Materiali ----
  const { corteccia } = legnoPali();
  const corteccia2 = corteccia.clone(); // lo stesso legno un po' più scuro: i tronchi non sono tutti uguali
  corteccia2.color.set(0xd2b49a);
  const vetro = new THREE.MeshBasicMaterial({ color: 0xffd36b });
  const vetroLanterna = new THREE.MeshBasicMaterial({ color: 0xffc84a });
  const ferro = new THREE.MeshStandardMaterial({ color: 0x3b4149, metalness: 0.6, roughness: 0.45 });
  const acciaio = new THREE.MeshStandardMaterial({ color: 0xb4bcc6, metalness: 0.7, roughness: 0.3 });
  const acciaioLucido = new THREE.MeshStandardMaterial({ color: 0xf2f6fa, metalness: 0.3, roughness: 0.15, emissive: 0x56636f });
  const bullone = new THREE.CylinderGeometry(0.045, 0.045, 0.05, 6);

  // =====================================================================
  //  IL CAPANNO
  // =====================================================================
  // dentro: un blocco scuro, così tra un tronco e l'altro non si vede il vuoto
  p('base', 'scatola', 0x6e3f18, [0, 1.7, 0], [6.5, 3.4, 3.7]);
  // i muri: tronchi orizzontali. Quelli davanti e dietro e quelli dei lati sono sfalsati di mezzo tronco e sporgono agli angoli
  for (let i = 0; i < 8; i++) {
    const y = 0.2 + i * 0.42;
    const legno = i % 2 ? corteccia2 : corteccia;
    for (const lz of [-1, 1]) {
      p('base', 'cilindro', legno, [0, y, lz * 1.9], [0.21, 7.4, 0.21], [0, 0, MEZZO_PI]);
      for (const lx of [-1, 1]) {
        // gli anelli sulla testa del tronco: legno chiaro con un anello più scuro
        p('base', 'cilindro', 0xe2b878, [lx * 3.7, y, lz * 1.9], [0.2, 0.03, 0.2], [0, 0, MEZZO_PI]);
        p('base', 'cilindro', 0xb4803f, [lx * 3.71, y, lz * 1.9], [0.1, 0.03, 0.1], [0, 0, MEZZO_PI]);
      }
    }
  }
  for (let i = 0; i < 7; i++) {
    const y = 0.41 + i * 0.42;
    const legno = i % 2 ? corteccia : corteccia2;
    for (const lx of [-1, 1]) {
      p('base', 'cilindro', legno, [lx * 3.2, y, 0], [0.21, 4.5, 0.21], [MEZZO_PI, 0, 0]);
      for (const lz of [-1, 1]) {
        p('base', 'cilindro', 0xe2b878, [lx * 3.2, y, lz * 2.25], [0.2, 0.03, 0.2], [MEZZO_PI, 0, 0]);
        p('base', 'cilindro', 0xb4803f, [lx * 3.2, y, lz * 2.26], [0.1, 0.03, 0.1], [MEZZO_PI, 0, 0]);
      }
    }
  }
  // il timpano (il triangolo di legno sotto il tetto) sui due lati
  p('base', prismaTimpano(), 0x7a461c, [0, 3.4, 0], [6.8, 1.4 / 1.5, 2.05 / 0.866]);

  // ---- Il tetto: falde di tavole, neve sopra, ghiaccioli sotto il bordo ----
  const lunghezzaFalda = 2.5 / COS;
  p('base', 'scatola', 0x6b3f1e, [falda(1.25, 0.08)[0], falda(1.25, 0.08)[1], falda(1.25, 0.08)[2]], [7.4, 0.16, lunghezzaFalda], [INCLINAZIONE, 0, 0]);
  p('base', 'scatola', 0x6b3f1e, [0, falda(1.25, 0.08)[1], -falda(1.25, 0.08)[2]], [7.4, 0.16, lunghezzaFalda], [-INCLINAZIONE, 0, 0]);
  // la neve del tetto è a strisce lungo la falda, con toni e spessori un po' diversi (così non è un unico pannello piatto)
  [[0.05, 0.75, NEVE, 0.2], [0.8, 0.75, 0xe9f1fb, 0.17], [1.55, 0.75, NEVE, 0.21]].forEach(([da, lungo, colore, spessore]) => {
    const centro = falda(da + lungo / 2, 0.16 + spessore / 2);
    p('base', 'scatola', colore, centro, [7.5, spessore, lungo / COS + 0.02], [INCLINAZIONE, 0, 0]);
    p('base', 'scatola', colore, [0, centro[1], -centro[2]], [7.5, spessore, lungo / COS + 0.02], [-INCLINAZIONE, 0, 0]);
  });
  p('base', 'scatola', NEVE, [0, CRESTA + 0.12, 0], [7.5, 0.3, 0.7]);
  // la neve si accumula a ciuffi tondi sul bordo
  for (let i = 0; i < 9; i++) {
    const v = falda(2.3, 0.2);
    p('base', 'sfera', NEVE, [-3.2 + i * 0.8, v[1] + (caso(i, 1) - 0.5) * 0.08, v[2]], [0.5, 0.2, 0.32]);
  }
  // i ghiaccioli, di lunghezze diverse, sotto il bordo del tetto davanti
  for (let i = 0; i < 13; i++) {
    const altezza = 0.18 + caso(i, 2) * 0.3;
    p('base', 'cono', GHIACCIO, [-3.3 + i * 0.55, 3.03 - altezza / 2, 2.46], [0.06, altezza, 0.06], [Math.PI, 0, 0]);
  }

  // ---- Il camino di legno (con le pietre ci sarà sopra il camino di pietra) ----
  p('base', 'scatola', 0x5f3a1e, [2.1, 5.0, 0.4], [0.7, 1.6, 0.7]);
  for (const t of [-1, 1]) {
    p('base', 'scatola', 0x3a2210, [2.1, 5.84, 0.4 + t * 0.35], [0.88, 0.1, 0.14]);
    p('base', 'scatola', 0x3a2210, [2.1 + t * 0.35, 5.84, 0.4], [0.14, 0.1, 0.62]);
  }
  p('base', 'scatola', 0x15100c, [2.1, 5.78, 0.4], [0.58, 0.02, 0.58]);

  // ---- La porta (non si sposta: davanti, al centro) ----
  [-0.46, 0, 0.46].forEach((x, i) => p('base', 'scatola', i === 1 ? 0x6a4422 : 0x5a3a1c, [x, 1.05, 2.17], [0.46, 2.1, 0.1]));
  for (const y of [0.5, 1.65]) p('base', 'scatola', 0x3e2511, [0, y, 2.24], [1.3, 0.14, 0.04]);
  for (const x of [-0.85, 0.85]) p('base', 'scatola', LEGNO_CHIARO, [x, 1.15, 2.17], [0.14, 2.3, 0.16]);
  p('base', 'scatola', LEGNO_CHIARO, [0, 2.3, 2.17], [1.84, 0.16, 0.18]);
  p('base', 'scatola', NEVE, [0, 2.4, 2.17], [1.9, 0.08, 0.22]);
  p('base', 'sfera', ORO, [0.3, 1.0, 2.26], [0.06, 0.06, 0.06]);
  p('base', 'scatola', 0x9b6a3c, [0, 0.06, 2.5], [1.9, 0.12, 0.7]);
  p('base', 'scatola', NEVE, [0, 0.15, 2.5], [1.8, 0.06, 0.6]);

  // ---- Le finestre con la luce calda ----
  for (const sx of [-1, 1]) {
    const cx = sx * 2.3;
    p('base', 'scatola', LEGNO_SCURO, [cx, 1.8, 2.17], [1.1, 0.95, 0.1]);
    p('base', 'scatola', vetro, [cx, 1.8, 2.22], [0.84, 0.7, 0.06]);
    p('base', 'scatola', LEGNO_SCURO, [cx, 1.8, 2.255], [0.06, 0.7, 0.04]);
    p('base', 'scatola', LEGNO_SCURO, [cx, 1.8, 2.255], [0.84, 0.06, 0.04]);
    for (const t of [-1, 1]) p('base', 'scatola', 0x3c6e47, [cx + t * 0.73, 1.8, 2.18], [0.34, 0.95, 0.07]);
    p('base', 'scatola', LEGNO, [cx, 1.28, 2.27], [1.3, 0.09, 0.28]);
    p('base', 'scatola', NEVE, [cx, 1.35, 2.27], [1.2, 0.07, 0.22]);
  }

  // ---- La lanterna accanto alla porta ----
  p('base', 'scatola', LEGNO_SCURO, [-1.35, 2.25, 2.4], [0.06, 0.06, 0.5]);
  p('base', 'scatola', 0x2a2a2a, [-1.35, 2.1, 2.6], [0.02, 0.2, 0.02]);
  p('base', 'cono', 0x2a2a2a, [-1.35, 1.99, 2.6], [0.17, 0.12, 0.17]);
  p('base', 'cilindro', vetroLanterna, [-1.35, 1.82, 2.6], [0.11, 0.26, 0.11]);
  p('base', 'cilindro', 0x2a2a2a, [-1.35, 1.67, 2.6], [0.14, 0.04, 0.14]);

  // ---- L'insegna di legno "SEGHERIA", appoggiata sul tetto sopra la porta e girata verso la telecamera ----
  const FI = MEZZO_PI - INCLINAZIONE; // quanto l'insegna è inclinata all'indietro (come la falda)
  const sopraNeve = falda(1.45, 0.38);
  const centroInsegna = [sopraNeve[0], sopraNeve[1] + 0.35 * COS, sopraNeve[2] + 0.35 * SIN];
  p('base', 'scatola', LEGNO_SCURO, centroInsegna, [3.55, 0.98, 0.12], [-FI, 0, 0]);
  p('base', 'scatola', 0xb07236, centroInsegna, [3.35, 0.82, 0.14], [-FI, 0, 0]);
  for (const x of [-1.45, 1.45]) p('base', 'scatola', LEGNO, [x, 3.9, 2.2], [0.12, 0.7, 0.12]);
  for (const x of [-1.0, 0.4, 1.2]) p('base', 'sfera', NEVE, [x, centroInsegna[1] + 0.3, centroInsegna[2] - 0.38], [0.5, 0.1, 0.12], [-FI, 0, 0]);
  const insegna = creaScritta('SEGHERIA', {
    larghezza: 3.3, altezza: 0.8, sfondo: '#b07236', coloreTesto: '#fff1c9', coloreBordo: 'rgba(60,28,8,0.95)',
  });
  insegna.position.set(centroInsegna[0], centroInsegna[1] + 0.075 * Math.sin(FI), centroInsegna[2] + 0.075 * Math.cos(FI));
  insegna.rotation.x = -FI;
  radice.add(insegna);

  // ---- Un mucchio di tavole a sinistra ----
  for (let i = 0; i < 6; i++) {
    p('base', 'scatola', TAVOLE[i % 2], [-4.9 + (caso(i, 3) - 0.5) * 0.12, 0.2 + i * 0.13, 0.8], [1.9, 0.11, 0.5]);
  }
  for (const x of [-5.5, -4.3]) p('base', 'scatola', LEGNO_SCURO, [x, 0.07, 0.8], [0.14, 0.14, 0.62]);
  p('base', 'scatola', NEVE, [-4.9, 0.2 + 5 * 0.13 + 0.1, 0.8], [1.9, 0.08, 0.52]);

  // =====================================================================
  //  LA TETTOIA CON LA SEGA (a destra del capanno)
  // =====================================================================
  // il tavolo: tavole con la fessura per la lama, quattro gambe e due travi
  [[0.18, 0.6], [0.8, 0.55], [1.42, 0.57], [1.93, 0.43]].forEach(([z, larghezza], i) => {
    p('base', 'scatola', i % 2 ? LEGNO_CHIARO : 0xa86d3a, [4.85, TAVOLO - 0.06, z], [2.3, 0.12, larghezza]);
  });
  p('base', 'scatola', 0x2b2b2b, [LAMA.x, TAVOLO - 0.035, LAMA.z], [1.4, 0.02, 0.12]);
  for (const x of [3.95, 5.75]) {
    for (const z of [0.0, 2.0]) p('base', 'scatola', LEGNO, [x, 0.415, z], [0.14, 0.83, 0.14]);
  }
  for (const z of [0.0, 2.0]) p('base', 'scatola', LEGNO_SCURO, [4.85, 0.5, z], [1.9, 0.1, 0.1]);
  // il sostegno della lama: un montante dietro la lama e l'asse
  p('base', 'scatola', LEGNO_SCURO, [LAMA.x, 1.425, 0.45], [0.3, 0.95, 0.3]);
  p('base', 'cilindro', ferro, [LAMA.x, LAMA.y, 0.75], [0.07, 0.7, 0.07], [MEZZO_PI, 0, 0]);
  // il tetto della tettoia: appoggiato al capanno, scende verso fuori. Copre la parte di dietro del tavolo
  const pendenzaTettoia = Math.atan(0.45 / 2.8);
  p('base', 'scatola', 0x6b3f1e, [4.8, 3.37, -0.5], [2.84, 0.14, 3.6], [0, 0, -pendenzaTettoia]);
  p('base', 'scatola', NEVE, [4.82, 3.54, -0.5], [2.8, 0.2, 3.5], [0, 0, -pendenzaTettoia]);
  const quotaTettoia = (x) => 3.6 - (x - 3.4) * 0.16; // l'altezza del tetto a quel punto
  for (let i = 0; i < 4; i++) {
    const x = 3.8 + i * 0.75;
    p('base', 'sfera', NEVE, [x, quotaTettoia(x) + 0.2, 1.32], [0.5, 0.17, 0.28]);
  }
  for (let i = 0; i < 7; i++) {
    const x = 3.8 + i * 0.4;
    const altezza = 0.16 + caso(i, 5) * 0.26;
    p('base', 'cono', GHIACCIO, [x, quotaTettoia(x) - altezza / 2, 1.28], [0.055, altezza, 0.055], [Math.PI, 0, 0]);
  }
  for (const z of [1.25, -0.5, -2.25]) p('base', 'cilindro', corteccia, [6.1, 1.5, z], [0.1, 3.0, 0.1]);

  // =====================================================================
  //  LIVELLO 1 (mura di pietra): basamento e camino di pietra
  // =====================================================================
  const basamento = (x, z, larghezza, profondita, i) => {
    p(`pietra${lato(x)}`, 'scatola', PIETRE[Math.floor(caso(i, 6) * 4)], [x, 0.34, z], [larghezza, 0.62 + caso(i, 7) * 0.1, profondita], [0, (caso(i, 8) - 0.5) * 0.1, 0]);
  };
  let n = 0;
  for (const x of [-3.35, -2.45, -1.55, 1.55, 2.45, 3.35]) basamento(x, 2.02, 0.9, 0.6, n++);
  for (const lx of [-1, 1]) for (const z of [-1.5, -0.5, 0.5, 1.5]) basamento(lx * 3.4, z, 0.6, 0.9, n++);
  // il camino: blocchi di pietra uno sopra l'altro, con il cappello e il buco scuro
  for (let i = 0; i < 5; i++) {
    p('pietraDx', 'scatola', PIETRE[i % 4], [2.1, 4.2 + 0.33 * i + 0.165, 0.4], [1.0, 0.32, 1.0], [0, (i % 2 ? 1 : -1) * 0.06, 0]);
  }
  p('pietraDx', 'scatola', 0x6e7681, [2.1, 5.93, 0.4], [1.2, 0.14, 1.2]);
  p('pietraDx', 'scatola', 0x15100c, [2.1, 6.01, 0.4], [0.7, 0.02, 0.7]);

  // =====================================================================
  //  LIVELLO 2 (rinforzo in metallo): angoli e cerniere di ferro con i bulloni
  // =====================================================================
  const bulloneSu = (perno, pos, rot) => p(perno, bullone, acciaio, pos, [1, 1, 1], rot);
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      const m = `metallo${lato(sx)}`;
      const cx = sx * 3.45;
      const cz = sz * 2.13;
      p(m, 'scatola', ferro, [cx, 1.7, cz], [0.09, 3.4, 0.09]); // la banda dell'angolo
      for (const y of [0.6, 1.7, 2.8]) {
        p(m, 'scatola', ferro, [cx - sx * 0.4, y, cz], [0.9, 0.14, 0.05]); // sul muro lungo
        p(m, 'scatola', ferro, [cx, y, cz - sz * 0.4], [0.05, 0.14, 0.9]); // sul muro corto
        bulloneSu(m, [cx - sx * 0.72, y, cz + sz * 0.03], [MEZZO_PI, 0, 0]);
        bulloneSu(m, [cx + sx * 0.03, y, cz - sz * 0.72], [0, 0, MEZZO_PI]);
      }
    }
  }
  // le cerniere della porta e una fascia sul camino
  for (const y of [0.55, 1.65]) {
    p('metalloSx', 'scatola', ferro, [-0.45, y, 2.26], [0.8, 0.1, 0.03]);
    bulloneSu('metalloSx', [-0.72, y, 2.285], [MEZZO_PI, 0, 0]);
    bulloneSu('metalloSx', [-0.2, y, 2.285], [MEZZO_PI, 0, 0]);
  }
  p('metalloDx', 'scatola', ferro, [2.1, 5.1, 0.4], [1.07, 0.1, 1.07]);
  for (const [dx, dz] of [[0.54, 0], [-0.54, 0], [0, 0.54], [0, -0.54]]) {
    bulloneSu('metalloDx', [2.1 + dx, 5.1, 0.4 + dz], dx ? [0, 0, MEZZO_PI] : [MEZZO_PI, 0, 0]);
  }

  // =====================================================================
  //  LA LAMA: piccola e chiara (legno e pietra), grande e lucida (metallo)
  // =====================================================================
  const lama = (perno, raggio, denti, materialeDisco, materialeBuchi, colori) => {
    const disco = materialeDisco ?? colori.disco;
    p(perno, 'cilindro', disco, [0, 0, 0], [raggio, 0.06, raggio], [MEZZO_PI, 0, 0]);
    for (let i = 0; i < denti; i++) {
      const a = (i / denti) * Math.PI * 2;
      p(perno, 'cono', materialeDisco ?? colori.denti, [Math.cos(a) * (raggio + 0.04), Math.sin(a) * (raggio + 0.04), 0], [0.1, 0.2, 0.05], [0, 0, a - MEZZO_PI]);
    }
    // i fori scuri servono a vedere che la lama gira
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2;
      p(perno, 'cilindro', materialeBuchi ?? colori.buchi, [Math.cos(a) * raggio * 0.62, Math.sin(a) * raggio * 0.62, 0], [raggio * 0.14, 0.08, raggio * 0.14], [MEZZO_PI, 0, 0]);
    }
    p(perno, 'cilindro', materialeBuchi ?? colori.mozzo, [0, 0, 0], [0.2, 0.1, 0.2], [MEZZO_PI, 0, 0]);
  };
  lama('lama0', 0.85, 16, null, null, { disco: 0xc9d2dc, denti: 0xa9b3bf, buchi: 0x8d98a5, mozzo: 0x5b6672 });
  lama('lama2', 1.1, 20, acciaioLucido, ferro, {});

  // =====================================================================
  //  IL TRONCO SUL CARRELLO (si muove: gruppo a parte)
  // =====================================================================
  const y = TAVOLO + 0.38;
  p('carro', 'cilindro', corteccia, [0, y, 0], [TRONCO.raggio, TRONCO.lunghezza, TRONCO.raggio], [0, 0, MEZZO_PI]);
  for (const t of [-1, 1]) {
    p('carro', 'cilindro', 0xe8c690, [t * (TRONCO.lunghezza / 2 + 0.001), y, 0], [TRONCO.raggio - 0.02, 0.02, TRONCO.raggio - 0.02], [0, 0, MEZZO_PI]);
    p('carro', 'cilindro', 0xb98a4e, [t * (TRONCO.lunghezza / 2 + 0.003), y, 0], [0.13, 0.02, 0.13], [0, 0, MEZZO_PI]);
    p('carro', 'scatola', LEGNO_SCURO, [t * 0.45, TAVOLO + 0.06, 0], [0.2, 0.12, 0.7]);
  }

  // ---- Si uniscono i pezzi e si mettono nei gruppi ----
  const nomi = ['base', 'pietraDx', 'pietraSx', 'metalloDx', 'metalloSx', 'lama0', 'lama2', 'carro'];
  const gruppi = Object.fromEntries(nomi.map((nome) => [nome, new THREE.Group()]));
  for (const { perno, geometria, materiale } of unisciPezzi(parti)) {
    const mesh = new THREE.Mesh(geometria, materiale);
    mesh.castShadow = false;
    mesh.receiveShadow = true;
    gruppi[perno].add(mesh);
  }
  radice.add(gruppi.base, gruppi.pietraDx, gruppi.pietraSx, gruppi.metalloDx, gruppi.metalloSx);

  // L'ombra sulla neve la fanno poche scatole invisibili (muri, tetti, camino, tettoia): i pezzi veri non fanno ombra,
  // perché disegnare tutti i tronchi anche nella mappa delle ombre rallentava il telefono
  const invisibile = new THREE.MeshBasicMaterial({ colorWrite: false, depthWrite: false });
  const ombra = (geometria, pos, scala, rot = [0, 0, 0]) => {
    const m = new THREE.Mesh(geometria, invisibile);
    m.position.set(...pos);
    m.scale.set(...scala);
    m.rotation.set(...rot);
    m.castShadow = true;
    radice.add(m);
  };
  const scatolaOmbra = new THREE.BoxGeometry(1, 1, 1);
  ombra(scatolaOmbra, [0, 1.7, 0], [7.4, 3.4, 4.3]);                                            // il capanno
  ombra(prismaTimpano(), [0, 3.4, 0], [7.4, 1.5 / 1.5, 2.5 / 0.866]);                           // il tetto
  ombra(scatolaOmbra, [2.1, 5.0, 0.4], [1, 1.9, 1]);                                            // il camino
  ombra(scatolaOmbra, [4.8, 3.4, -0.5], [2.84, 0.3, 3.6], [0, 0, -Math.atan(0.45 / 2.8)]);      // il tetto della tettoia
  ombra(scatolaOmbra, [4.85, 0.7, 1.0], [2.3, 1.5, 2.3]);                                       // il tavolo con il tronco e la lama
  ombra(scatolaOmbra, [-4.9, 0.45, 0.8], [1.9, 0.9, 0.55]);                                     // le tavole

  const perno = new THREE.Group(); // la lama gira attorno a questo punto
  perno.position.copy(LAMA);
  perno.add(gruppi.lama0, gruppi.lama2);
  radice.add(perno);

  const carrello = gruppi.carro;
  carrello.position.set(TRONCO.partenza, 0, LAMA.z);
  radice.add(carrello);

  // ---- Le luci: un alone caldo sulle finestre e sulla lanterna ----
  const aloniFinestre = [-2.3, 2.3].map((x) => {
    const a = alone(0.5, 2.4);
    a.position.set(x, 1.8, 2.5);
    radice.add(a);
    return a;
  });
  const aloneLanterna = alone(0.7, 1.7);
  aloneLanterna.position.set(-1.35, 1.85, 2.85);
  radice.add(aloneLanterna);

  // ---- Il fumo del camino: poche nuvolette tonde che salgono piano ----
  const fumo = new THREE.InstancedMesh(
    new THREE.SphereGeometry(1, 7, 5),
    new THREE.MeshLambertMaterial({ color: 0xcfd6e0, transparent: true, opacity: 0.85, depthWrite: false }),
    NUVOLE,
  );
  fumo.frustumCulled = false;
  radice.add(fumo);

  // ---- La segatura: pezzettini chiari che saltano via dalla lama mentre taglia ----
  const segatura = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshLambertMaterial({ color: 0xf2d9a6 }), SEGATURE);
  segatura.frustumCulled = false;
  radice.add(segatura);
  const granelli = Array.from({ length: SEGATURE }, () => ({ pos: new THREE.Vector3(), vel: new THREE.Vector3(), vita: 0, durata: 1, dim: 0.05 }));

  // =====================================================================
  //  I LIVELLI E LE ANIMAZIONI
  // =====================================================================
  const stato = { livello: -1, tempo: 0, emetti: 0, prossimo: 0 };
  // gruppi che compaiono con un livello: { gruppo, da: dal livello, ritardo, tipo }
  const gruppiDiLivello = [
    { gruppo: gruppi.lama2, da: 2, ritardo: 0, tipo: 'pop' },
    { gruppo: gruppi.metalloDx, da: 2, ritardo: 0.15, tipo: 'su' },
    { gruppo: gruppi.metalloSx, da: 2, ritardo: 0.45, tipo: 'su' },
    { gruppo: gruppi.pietraDx, da: 1, ritardo: 0, tipo: 'su' },
    { gruppo: gruppi.pietraSx, da: 1, ritardo: 0.3, tipo: 'su' },
  ];
  const nuovi = []; // i gruppi che stanno spuntando: { gruppo, tipo, k } (k parte da meno di 0: è il ritardo)

  // pezzi che spuntano: salgono da terra (tipo "su") o si ingrandiscono sul posto (tipo "pop")
  const scalaPezzi = (gruppo, tipo, k) => {
    gruppo.children.forEach((figlio, j) => {
      const f = Math.max(0.0001, spunta(THREE.MathUtils.clamp(k * 1.5 - j * 0.15, 0, 1)));
      if (tipo === 'su') figlio.scale.set(1, f, 1);
      else figlio.scale.setScalar(f);
    });
  };

  // livello: 0 legno, 1 pietra, 2 metallo; conAnimazione: i pezzi nuovi spuntano uno dopo l'altro
  function imposta(livello, conAnimazione) {
    if (livello === stato.livello) return;
    const prima = stato.livello;
    stato.livello = livello;
    for (const g of gruppiDiLivello) {
      const visibile = livello >= g.da;
      const eraVisibile = prima >= g.da;
      g.gruppo.visible = visibile;
      g.gruppo.children.forEach((figlio) => figlio.scale.set(1, 1, 1));
      if (visibile && !eraVisibile && conAnimazione && prima >= 0) {
        scalaPezzi(g.gruppo, g.tipo, 0);
        nuovi.push({ gruppo: g.gruppo, tipo: g.tipo, k: -g.ritardo });
      }
    }
    gruppi.lama0.visible = livello < 2;
    stato.alto = livello >= 1 ? 6.15 : 5.9; // da dove esce il fumo
  }
  imposta(0, false);

  function aggiorna(dt) {
    dt = Math.min(dt, 0.1);
    stato.tempo += dt;
    const t = stato.tempo;

    // pezzi nuovi che spuntano
    for (const nuovo of nuovi) {
      nuovo.k += dt * 1.1;
      if (nuovo.k > 0) scalaPezzi(nuovo.gruppo, nuovo.tipo, Math.min(1, nuovo.k));
    }
    for (let i = nuovi.length - 1; i >= 0; i--) {
      if (nuovi[i].k >= 1) {
        nuovi[i].gruppo.children.forEach((figlio) => figlio.scale.set(1, 1, 1));
        nuovi.splice(i, 1);
      }
    }

    // la lama gira (quella grande più svelta)
    perno.rotation.z -= dt * (stato.livello >= 2 ? 12 : 9);

    // il carrello: avanti piano fino alla lama, fermo a tagliare, indietro svelto, pausa
    const tc = t % CICLO;
    let x = TRONCO.partenza;
    let taglia = false;
    if (tc < FASI.avanti) {
      x = THREE.MathUtils.lerp(TRONCO.partenza, TRONCO.taglio, tc / FASI.avanti);
      taglia = true;
    } else if (tc < FASI.avanti + FASI.fermo) {
      x = TRONCO.taglio;
      taglia = true;
    } else if (tc < FASI.avanti + FASI.fermo + FASI.indietro) {
      const u = (tc - FASI.avanti - FASI.fermo) / FASI.indietro;
      x = THREE.MathUtils.lerp(TRONCO.taglio, TRONCO.partenza, u * u * (3 - 2 * u));
    }
    // la lama tocca il tronco quando la sua punta (a sinistra) arriva alla lama
    taglia = taglia && x - TRONCO.lunghezza / 2 < LAMA.x + 0.02;
    carrello.position.x = x;
    carrello.position.y = taglia ? Math.sin(t * 90) * 0.008 : 0;

    // la segatura parte solo mentre taglia
    if (taglia) stato.emetti += dt * 16;
    for (const g of granelli) {
      if (g.vita >= g.durata && stato.emetti >= 1) {
        stato.emetti -= 1;
        g.vita = 0;
        g.durata = 0.5 + Math.random() * 0.45;
        g.dim = 0.04 + Math.random() * 0.04;
        g.pos.set(LAMA.x + (Math.random() - 0.3) * 0.25, TAVOLO + 0.62, LAMA.z + (Math.random() - 0.5) * 0.1);
        g.vel.set(0.6 + Math.random() * 1.6, 1.4 + Math.random() * 1.8, 0.2 + Math.random() * 1.0);
      }
    }
    if (!taglia) stato.emetti = Math.min(stato.emetti, 1);
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const v = new THREE.Vector3();
    const s = new THREE.Vector3();
    granelli.forEach((g, i) => {
      if (g.vita < g.durata) {
        g.vita += dt;
        g.vel.y -= 9 * dt;
        g.pos.addScaledVector(g.vel, dt);
        if (g.pos.y < TAVOLO + 0.04) { g.pos.y = TAVOLO + 0.04; g.vel.set(0, 0, 0); }
      }
      const dim = g.vita < g.durata ? g.dim * (1 - Math.max(0, g.vita / g.durata - 0.6) / 0.4) : 0;
      m.compose(g.pos, q.setFromAxisAngle(v.set(0, 1, 0), g.vita * 7), s.set(dim, dim, dim));
      segatura.setMatrixAt(i, m);
    });
    segatura.instanceMatrix.needsUpdate = true;

    // il fumo sale piano, si allarga e svanisce rimpicciolendosi
    for (let i = 0; i < NUVOLE; i++) {
      const u = (t * 0.3 + i / NUVOLE) % 1;
      const dim = (0.18 + 0.5 * u) * Math.min(1, u * 6) * (1 - THREE.MathUtils.smoothstep(u, 0.65, 1));
      m.compose(
        v.set(2.1 + u * 1.0 + Math.sin(u * 6 + i * 2) * 0.12, stato.alto + u * 2.7, 0.4 + u * 0.3 + Math.cos(u * 5 + i) * 0.08),
        q.identity(),
        s.set(dim, dim, dim),
      );
      fumo.setMatrixAt(i, m);
    }
    fumo.instanceMatrix.needsUpdate = true;

    // la luce della lanterna sfarfalla appena
    aloneLanterna.material.opacity = 0.62 + Math.sin(t * 7) * 0.05 + Math.sin(t * 13.3) * 0.04;
    aloniFinestre.forEach((a, i) => { a.material.opacity = 0.5 + Math.sin(t * 1.7 + i * 2) * 0.04; });
  }

  radice.userData = {
    imposta,
    aggiorna,
    get livello() { return stato.livello; },
  };
  return radice;
}
