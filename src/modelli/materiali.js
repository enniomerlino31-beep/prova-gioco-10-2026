// =====================================================================
//  MATERIALI: i "colori" e le "stoffe" usati dai modelli
//  Ogni colore viene creato una volta sola e poi riusato (più veloce).
// =====================================================================

import * as THREE from 'three';

const materialiGiaCreati = new Map();

// Restituisce un materiale opaco del colore scelto (es. 0xff0000 = rosso)
export function tinta(colore) {
  if (!materialiGiaCreati.has(colore)) {
    materialiGiaCreati.set(colore, new THREE.MeshLambertMaterial({ color: colore }));
  }
  return materialiGiaCreati.get(colore);
}

// Stoffa a quadri rossi e neri per la camicia del boscaiolo
let stoffaQuadri = null;
export function materialeQuadri() {
  if (stoffaQuadri) return stoffaQuadri;
  const tela = document.createElement('canvas');
  tela.width = 32;
  tela.height = 32;
  const ctx = tela.getContext('2d');
  ctx.fillStyle = '#d42a2a';
  ctx.fillRect(0, 0, 32, 32);
  ctx.fillStyle = 'rgba(25,10,10,0.75)';
  ctx.fillRect(0, 0, 16, 32); // banda verticale scura
  ctx.fillRect(0, 0, 32, 16); // banda orizzontale scura (dove si incrociano diventa più scuro)
  ctx.fillStyle = 'rgba(25,10,10,0.5)';
  ctx.fillRect(0, 0, 16, 16);
  const texture = new THREE.CanvasTexture(tela);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(3, 2);
  texture.magFilter = THREE.NearestFilter; // quadretti netti, non sfocati
  stoffaQuadri = new THREE.MeshLambertMaterial({ map: texture });
  return stoffaQuadri;
}

// Crea un cartello piatto con una scritta (es. "+10" sulle porte).
// Va "liberato" quando non serve più: per questo lo segniamo con userData.daLiberare.
export function creaScritta(testo, opzioni = {}) {
  const {
    larghezza = 2,          // larghezza del cartello nel mondo (metri)
    altezza = 1,            // altezza del cartello nel mondo (metri)
    coloreTesto = '#ffffff',
    coloreBordo = 'rgba(0,0,0,0.55)',
    sfondo = null,          // colore di sfondo, oppure null per trasparente
    icona = null,           // 'legna' o 'carne': disegna l'iconcina prima del testo
  } = opzioni;

  const tela = document.createElement('canvas');
  tela.width = 256;
  tela.height = Math.round((256 * altezza) / larghezza);
  const ctx = tela.getContext('2d');
  if (sfondo) {
    ctx.fillStyle = sfondo;
    ctx.beginPath();
    ctx.roundRect(4, 4, tela.width - 8, tela.height - 8, 24);
    ctx.fill();
  }
  const dimensioneCarattere = Math.round(tela.height * 0.72);
  ctx.font = `${dimensioneCarattere}px "Lilita One", "Arial Black", sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  let xTesto = tela.width / 2;
  if (icona) {
    // icona + testo, centrati insieme
    const latoIcona = dimensioneCarattere * 1.05;
    const spazio = latoIcona * 0.15;
    const inizio = (tela.width - (latoIcona + spazio + ctx.measureText(testo).width)) / 2;
    disegnaIcona(ctx, icona, inizio, tela.height / 2 - latoIcona / 2, latoIcona);
    ctx.textAlign = 'left';
    xTesto = inizio + latoIcona + spazio;
  }
  ctx.lineJoin = 'round';
  ctx.lineWidth = dimensioneCarattere * 0.14;
  ctx.strokeStyle = coloreBordo;
  ctx.strokeText(testo, xTesto, tela.height / 2 + 4);
  ctx.fillStyle = coloreTesto;
  ctx.fillText(testo, xTesto, tela.height / 2 + 4);

  const texture = new THREE.CanvasTexture(tela);
  texture.colorSpace = THREE.SRGBColorSpace;
  const materiale = new THREE.MeshBasicMaterial({ map: texture, transparent: true, depthWrite: false });
  materiale.userData.daLiberare = true;
  const cartello = new THREE.Mesh(new THREE.PlaneGeometry(larghezza, altezza), materiale);
  cartello.geometry.userData.daLiberare = true;
  return cartello;
}

// Come creaScritta, ma la scritta è sempre girata verso la telecamera (uno "sprite").
// Si usa per i numeri che galleggiano sopra le cose (es. "x150" sulla schiena).
export function creaEtichetta(testo, opzioni = {}) {
  const { larghezza = 1, altezza = 0.4 } = opzioni;
  const cartello = creaScritta(testo, opzioni);
  const materiale = new THREE.SpriteMaterial({ map: cartello.material.map, transparent: true, depthWrite: false });
  cartello.material.dispose();
  cartello.geometry.dispose();
  const etichetta = new THREE.Sprite(materiale);
  etichetta.scale.set(larghezza, altezza, 1);
  return etichetta;
}

// Libera la memoria di un'etichetta che non serve più
export function liberaEtichetta(etichetta) {
  etichetta.material.map.dispose();
  etichetta.material.dispose();
}

// Disegna un'iconcina ('legna', 'carne', 'moneta', 'pietra', 'metallo', 'ascia', 'torre', 'martello', 'arco',
// 'arcoOro', 'cacciatore', 'venditore') in un quadrato di lato "lato"
// (legna, carne, moneta e ascia sono uguali alle icone in stile.css). Niente emoji: non tutti i dispositivi le hanno.
export function disegnaIcona(ctx, tipo, x, y, lato) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(lato / 32, lato / 32); // i disegni sono fatti su una griglia 32 x 32
  ctx.lineCap = 'round';
  const tratto = (percorso, colore, spessore) => {
    ctx.strokeStyle = colore;
    ctx.lineWidth = spessore;
    ctx.stroke(new Path2D(percorso));
  };
  const ellisse = (cx, cy, rx, ry, rotazione, riempimento, bordo = null, spessore = 0) => {
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, rotazione, 0, Math.PI * 2);
    if (riempimento) {
      ctx.fillStyle = riempimento;
      ctx.fill();
    }
    if (bordo) {
      ctx.strokeStyle = bordo;
      ctx.lineWidth = spessore;
      ctx.stroke();
    }
  };
  const pieno = (percorso, colore, bordo = null, spessore = 0) => {
    const forma = new Path2D(percorso);
    ctx.fillStyle = colore;
    ctx.fill(forma);
    if (bordo) {
      ctx.strokeStyle = bordo;
      ctx.lineWidth = spessore;
      ctx.lineJoin = 'round';
      ctx.stroke(forma);
    }
  };
  const blocco = (bx, by, larghezza, altezza, raggio, colore, bordo, spessore) => {
    ctx.beginPath();
    ctx.roundRect(bx, by, larghezza, altezza, raggio);
    ctx.fillStyle = colore;
    ctx.fill();
    ctx.strokeStyle = bordo;
    ctx.lineWidth = spessore;
    ctx.stroke();
  };
  if (tipo === 'moneta') {
    ellisse(16, 16, 13.5, 13.5, 0, '#f6c33b', '#b9821a', 2.5);
    ellisse(16, 16, 8.5, 8.5, 0, null, '#d99a1e', 2);
    tratto('M9.5 12a7.5 7.5 0 0 1 5.5-5', '#fff3c4', 2.4);
  } else if (tipo === 'pietra') {
    blocco(3, 18, 12, 9, 3, '#8e97a3', '#5d6672', 1.5);
    blocco(17, 18, 12, 9, 3, '#a3acb7', '#5d6672', 1.5);
    blocco(9, 8, 14, 9, 3, '#b8c0ca', '#5d6672', 1.5);
  } else if (tipo === 'metallo') {
    // tre pali di legno tenuti insieme da due assi di ferro con i bulloni
    for (const px of [5, 13.5, 22]) blocco(px, 3, 5.5, 26, 2, '#a0672f', '#6b4426', 1.2);
    for (const py of [9, 19]) {
      blocco(2, py, 28, 5, 1.2, '#3b4149', '#22262b', 1);
      for (const px of [7.75, 16.25, 24.75]) ellisse(px, py + 2.5, 1.5, 1.5, 0, '#c9d0d8');
    }
  } else if (tipo === 'torre') {
    // torretta di legno: quattro gambe incrociate, piattaforma con la ringhiera e una bandierina
    tratto('M10 30L11.5 16M22 30L20.5 16M11 22L21 29M21 22L11 29', '#7a461c', 2.2);
    blocco(6, 12.5, 20, 4, 1.2, '#a0672f', '#6b4426', 1.2);
    blocco(7.5, 8, 17, 4.5, 1, '#c08a52', '#6b4426', 1.2);
    tratto('M23 8V1.5', '#6b4426', 1.4);
    pieno('M23.5 1.5L30 3.5L23.5 5.5Z', '#d8262e');
  } else if (tipo === 'martello') {
    // martello (manico e testa di ferro) con un "+" verde: le mura si riparano
    tratto('M7 28L18 15', '#8a5328', 4);
    ctx.save();
    ctx.translate(19.5, 12.5);
    ctx.rotate(0.7);
    blocco(-7.5, -3.5, 15, 7, 1.5, '#9aa3ad', '#5d6672', 1.5);
    ctx.restore();
    tratto('M26 21v9M21.5 25.5h9', '#3fae5a', 3.2);
  } else if (tipo === 'arco' || tipo === 'arcoOro') {
    // arco con la corda e una freccia pronta ("arcoOro": arco dorato e punta che brilla, l'ultimo potenziamento)
    const oro = tipo === 'arcoOro';
    if (oro) ellisse(27.5, 16, 5, 5, 0, 'rgba(255,214,90,0.55)');
    tratto('M11 3Q27 16 11 29', oro ? '#d9a520' : '#4a2d16', 3.2);
    tratto('M11 3L11 29', '#efe6d0', 1.2);
    tratto('M4 16H26', '#6b4426', 2.2);
    pieno('M31 16L25 12.5V19.5Z', oro ? '#ffe066' : '#9aa3ad', oro ? '#e0a010' : '#5d6672', 1);
    pieno('M5 16L2 12.5H6L8.5 16L6 19.5H2Z', oro ? '#f2b632' : '#2f7fd6');
  } else if (tipo === 'cacciatore' || tipo === 'venditore') {
    // la faccia del lavoratore con il suo berretto (verde il cacciatore, giallo il venditore)
    // e in basso a destra cosa fa: la carne che porta o la moneta che incassa
    const [berretto, scuro] = tipo === 'cacciatore' ? ['#3d7a34', '#2b5a25'] : ['#f2b632', '#c98f1c'];
    ellisse(14, 18, 9.5, 9.5, 0, '#f5c49c', '#c98a6a', 1.2);
    ellisse(10.5, 18.5, 1.4, 1.7, 0, '#1b1b1b');
    ellisse(17.5, 18.5, 1.4, 1.7, 0, '#1b1b1b');
    pieno('M4 14.5A10 10 0 0 1 24 14.5Z', berretto, scuro, 1.2);
    blocco(3.5, 12.5, 21, 4, 1.5, scuro, scuro, 0.5);
    ellisse(14, 4, 2.8, 2.8, 0, berretto);
    disegnaIcona(ctx, tipo === 'cacciatore' ? 'carne' : 'moneta', 18, 18, 14);
  } else if (tipo === 'ascia') {
    tratto('M8 29L21 6', '#8a5328', 3.6);
    pieno('M16.5 5.5L21.5 8.4Q29 8 28.4 16.6Q24.6 12.6 19.2 12.2Z', '#c9d2dc', '#6f7b88', 1.5);
  } else if (tipo === 'carne') {
    tratto('M17 17l8 8', '#faf3e3', 4);
    ellisse(27.3, 24.3, 2.7, 2.7, 0, '#faf3e3');
    ellisse(24.3, 27.3, 2.7, 2.7, 0, '#faf3e3');
    ellisse(13, 13, 11, 9, -Math.PI / 4, '#f3a7a0');
    ellisse(12.4, 12.4, 9, 7.2, -Math.PI / 4, '#c8392f');
    tratto('M7.5 12a5.5 5.5 0 0 1 4.5-4.5', '#e8685d', 2);
  } else {
    ctx.fillStyle = '#8a5328';
    ctx.beginPath();
    ctx.roundRect(2, 9, 24, 14, 7);
    ctx.fill();
    tratto('M6 13h10M9 19h10', '#683c1c', 1.6);
    ellisse(25, 16, 5, 7, 0, '#f1cf96', '#c98a4b', 1.6);
    ellisse(25, 16, 2.2, 3.2, 0, null, '#c98a4b', 1.3);
  }
  ctx.restore();
}

// Costruisce una matrice di posizione/rotazione/scala (serve per mettere i pezzi al loro posto)
export function matrice(posizione = [0, 0, 0], rotazione = [0, 0, 0], scala = [1, 1, 1]) {
  return new THREE.Matrix4().compose(
    new THREE.Vector3(...posizione),
    new THREE.Quaternion().setFromEuler(new THREE.Euler(...rotazione)),
    new THREE.Vector3(...scala)
  );
}
