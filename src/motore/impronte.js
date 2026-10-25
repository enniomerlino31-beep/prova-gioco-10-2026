// =====================================================================
//  IMPRONTE NELLA NEVE
//  A ogni passo i personaggi lasciano un'impronta di stivale, i lupi
//  un'impronta di zampa. Dopo qualche secondo sbiadiscono e spariscono.
//  Leggere per il telefono: tutte le impronte dello stesso tipo si
//  disegnano insieme, e ce ne sono al massimo CONFIG.impronte.massimo
//  (quando sono troppe, sparisce prima la più vecchia).
// =====================================================================

import * as THREE from 'three';
import { CONFIG } from '../config.js';

// Disegno dell'impronta su una tela, in stile cartoon (la punta del piede è in alto, cioè in avanti):
// forme tonde e morbide, con un bordo un po' più scuro e un riflesso chiaro in alto, come neve schiacciata
function disegnaImpronta(tipo) {
  const tela = document.createElement('canvas');
  tela.width = 128;
  tela.height = 128;
  const ctx = tela.getContext('2d');
  // una "macchia" tonda: fondo azzurrino, bordo morbido più scuro, riflesso bianco in alto a sinistra
  const macchia = (disegna) => {
    ctx.beginPath();
    disegna();
    ctx.fillStyle = 'rgba(122, 150, 196, 0.5)';
    ctx.fill();
    ctx.lineWidth = 5;
    ctx.lineJoin = 'round';
    ctx.strokeStyle = 'rgba(92, 120, 172, 0.55)';
    ctx.stroke();
  };
  const ellisse = (x, y, rx, ry, angolo = 0) => macchia(() => ctx.ellipse(x, y, rx, ry, angolo, 0, Math.PI * 2));
  const riflesso = (x, y, rx, ry, angolo = 0) => {
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, angolo, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
    ctx.fill();
  };
  if (tipo === 'stivale') {
    // suola a "fagiolo" (larga davanti, stretta in mezzo), tacco tondo e tre pallini della suola
    macchia(() => {
      ctx.moveTo(64, 8);
      ctx.bezierCurveTo(96, 8, 98, 52, 86, 70);
      ctx.bezierCurveTo(80, 80, 48, 80, 42, 70);
      ctx.bezierCurveTo(30, 52, 32, 8, 64, 8);
    });
    ellisse(64, 104, 21, 17);
    for (const [x, y] of [[56, 30], [72, 30], [64, 50]]) {
      ctx.beginPath();
      ctx.arc(x, y, 6, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(214, 228, 246, 0.6)';
      ctx.fill();
    }
    riflesso(52, 20, 8, 4, -0.6);
    riflesso(56, 97, 7, 3, -0.4);
  } else {
    // zampa: cuscinetto grande a forma di nuvoletta e quattro "fagiolini" per le dita
    macchia(() => {
      ctx.moveTo(64, 62);
      ctx.bezierCurveTo(88, 62, 102, 84, 94, 100);
      ctx.bezierCurveTo(88, 114, 74, 108, 64, 112);
      ctx.bezierCurveTo(54, 108, 40, 114, 34, 100);
      ctx.bezierCurveTo(26, 84, 40, 62, 64, 62);
    });
    riflesso(52, 74, 8, 4, -0.5);
    for (const [x, y, angolo] of [[28, 46, -0.35], [50, 28, -0.1], [78, 28, 0.1], [100, 46, 0.35]]) {
      ellisse(x, y, 11, 14, angolo);
      riflesso(x - 3, y - 6, 4, 2.5, angolo - 0.5);
    }
  }
  const texture = new THREE.CanvasTexture(tela);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

// Le impronte di un tipo: un'unica forma ripetuta, con la trasparenza di ognuna nella sua "opacita"
function creaTipo(genitore, tipo) {
  const massimo = CONFIG.impronte.massimo;
  const geometria = new THREE.PlaneGeometry(1, 1);
  geometria.rotateX(-Math.PI / 2); // sdraiata a terra, con la punta verso -z (in avanti)
  const opacita = new THREE.InstancedBufferAttribute(new Float32Array(massimo), 1);
  geometria.setAttribute('opacita', opacita);
  const materiale = new THREE.MeshBasicMaterial({ map: disegnaImpronta(tipo), transparent: true, depthWrite: false });
  // ogni impronta ha la sua trasparenza: il materiale la legge da "opacita"
  materiale.onBeforeCompile = (shader) => {
    shader.vertexShader = shader.vertexShader
      .replace('void main() {', 'attribute float opacita;\nvarying float vOpacita;\nvoid main() {\n  vOpacita = opacita;');
    shader.fragmentShader = shader.fragmentShader
      .replace('void main() {', 'varying float vOpacita;\nvoid main() {')
      .replace('#include <opaque_fragment>', '#include <opaque_fragment>\n  gl_FragColor.a *= vOpacita;');
  };
  const mesh = new THREE.InstancedMesh(geometria, materiale, massimo);
  mesh.count = 0;
  mesh.frustumCulled = false;
  mesh.renderOrder = -1; // prima dei personaggi, subito sopra la neve
  genitore.add(mesh);
  return { mesh, opacita, lista: [] };
}

export class Impronte {
  constructor(genitore) {
    this.tipi = { stivale: creaTipo(genitore, 'stivale'), zampa: creaTipo(genitore, 'zampa') };
    this._m = new THREE.Matrix4();
    this._q = new THREE.Quaternion();
    this._p = new THREE.Vector3();
    this._s = new THREE.Vector3();
    this._asse = new THREE.Vector3(0, 1, 0);
  }

  // Una nuova impronta ('stivale' o 'zampa') in (x, z), girata come "angolo"; larghezza e lunghezza in metri
  aggiungi(tipo, x, z, angolo, larghezza, lunghezza) {
    const { lista } = this.tipi[tipo];
    if (lista.length >= CONFIG.impronte.massimo) lista.shift();
    lista.push({ x, z, angolo, larghezza, lunghezza, eta: 0 });
  }

  aggiorna(dt) {
    const { durata, sbiadisce } = CONFIG.impronte;
    for (const tipo of Object.values(this.tipi)) {
      tipo.lista = tipo.lista.filter((impronta) => (impronta.eta += dt) < durata);
      tipo.lista.forEach((impronta, i) => {
        this._q.setFromAxisAngle(this._asse, impronta.angolo);
        this._m.compose(this._p.set(impronta.x, 0.004, impronta.z), this._q, this._s.set(impronta.larghezza, 1, impronta.lunghezza));
        tipo.mesh.setMatrixAt(i, this._m);
        tipo.opacita.setX(i, Math.min(1, (durata - impronta.eta) / sbiadisce));
      });
      tipo.mesh.count = tipo.lista.length;
      tipo.mesh.instanceMatrix.needsUpdate = true;
      tipo.opacita.needsUpdate = true;
    }
  }
}
