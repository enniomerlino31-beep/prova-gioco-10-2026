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

// Disegna l'iconcina del tronco o della carne in un quadrato di lato "lato" (stessi disegni delle icone in stile.css).
// Niente emoji: non tutti i dispositivi le hanno.
function disegnaIcona(ctx, tipo, x, y, lato) {
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
  if (tipo === 'carne') {
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
