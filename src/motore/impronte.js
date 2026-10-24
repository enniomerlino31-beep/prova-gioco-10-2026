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

// Disegno dell'impronta su una tela (la punta del piede è in alto, cioè in avanti)
function disegnaImpronta(tipo) {
  const tela = document.createElement('canvas');
  tela.width = 64;
  tela.height = 64;
  const ctx = tela.getContext('2d');
  const ombra = 'rgba(112, 138, 176, 0.55)';
  const ellisse = (x, y, rx, ry, colore) => {
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
    ctx.fillStyle = colore;
    ctx.fill();
  };
  if (tipo === 'stivale') {
    // suola e tacco, con le righe della suola un po' più chiare
    ellisse(32, 22, 15, 19, ombra);
    ellisse(32, 50, 12, 11, ombra);
    ctx.fillStyle = 'rgba(200, 216, 236, 0.5)';
    for (const y of [12, 20, 28]) ctx.fillRect(21, y, 22, 2.5);
  } else {
    // zampa: il cuscinetto grande e quattro dita
    ellisse(32, 42, 13, 11, ombra);
    for (const [x, y] of [[17, 22], [27, 15], [37, 15], [47, 22]]) ellisse(x, y, 5.5, 7, ombra);
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
