// =====================================================================
//  PAVIMENTO DELLA BASE (si compra con il cerchio "Pavimento in pietra",
//  al centro della base)
//  All'inizio dentro la base c'è la neve, come fuori. Comprato un
//  pavimento, compare con un cerchio che si allarga dal punto d'acquisto
//  (con il bordo che luccica e un po' di polvere) fino a coprire tutta
//  la base. Cambia solo l'aspetto.
//  Leggero per il telefono: una sola forma piatta, con il disegno delle
//  lastre fatto una volta sola su una tela e ripetuto.
// =====================================================================

import * as THREE from 'three';
import { MAPPA, R_PALO } from './ambiente.js';

const DURATA = 2.2;  // secondi perché il pavimento copra tutta la base
const ALTEZZA = 0.008; // appena sopra la neve (e sopra le impronte: sul pavimento non restano)

// Un numero "a caso" ma sempre uguale per lo stesso seme (così il disegno è sempre lo stesso)
function casuale(seme) {
  const v = Math.sin(seme * 12.9898) * 43758.5453;
  return v - Math.floor(v);
}

// Lastre di pietra grigie di grandezze diverse, in file sfalsate, con le fughe scure
function disegnaPietra() {
  const tela = document.createElement('canvas');
  tela.width = tela.height = 512;
  const ctx = tela.getContext('2d');
  ctx.fillStyle = '#5f646c'; // le fughe
  ctx.fillRect(0, 0, 512, 512);
  let seme = 1;
  for (let riga = 0; riga < 4; riga++) {
    const y = riga * 128;
    let x = -casuale(seme++) * 100;
    while (x < 512) {
      const largo = 110 + casuale(seme++) * 90;
      const grigio = 150 + Math.floor(casuale(seme++) * 40);
      const blu = Math.floor(casuale(seme++) * 12);
      for (const dx of [0, -512, 512]) { // la tela si ripete: le lastre che escono da un lato rientrano dall'altro
        ctx.fillStyle = `rgb(${grigio - 6}, ${grigio}, ${grigio + 6 + blu})`;
        ctx.beginPath();
        ctx.roundRect(x + dx + 5, y + 5, largo - 10, 118, 14);
        ctx.fill();
        // un po' di luce in alto a sinistra e qualche macchiolina
        ctx.fillStyle = 'rgba(255,255,255,0.12)';
        ctx.fillRect(x + dx + 12, y + 10, largo - 30, 10);
        for (let k = 0; k < 5; k++) {
          ctx.fillStyle = `rgba(70,75,85,${0.12 + casuale(seme + k) * 0.12})`;
          ctx.beginPath();
          ctx.arc(x + dx + 20 + casuale(seme + k * 3) * (largo - 40), y + 25 + casuale(seme + k * 7) * 80, 3 + casuale(seme + k) * 6, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      seme += 20;
      x += largo;
    }
  }
  return tela;
}

// Come è fatto il pavimento: il disegno e quanti metri copre una tela
const TIPI = {
  pietra: { disegna: disegnaPietra, metri: 3, polvere: 0x9aa2ad },
};

export class Pavimento {
  constructor(genitore, effetti) {
    this.effetti = effetti;
    this.tipo = null;
    this.raggio = 0;
    this.centro = new THREE.Vector2();
    this.attesaPolvere = 0;
    // il pavimento copre l'interno delle mura (fino ai pali, così non si vede il bordo)
    const M = MAPPA.mura;
    const bordo = R_PALO * 0.8;
    this.larghezza = M.destra - M.sinistra - bordo * 2;
    this.profondita = M.fronte - M.fondo - bordo * 2;
    this.mesh = new THREE.Mesh(new THREE.PlaneGeometry(this.larghezza, this.profondita), new THREE.MeshLambertMaterial());
    this.mesh.rotation.x = -Math.PI / 2;
    this.mesh.position.set((M.sinistra + M.destra) / 2, ALTEZZA, (M.fondo + M.fronte) / 2);
    this.mesh.receiveShadow = true;
    this.mesh.visible = false;
    this.mesh.renderOrder = -2; // prima delle impronte e dei cerchi a terra
    genitore.add(this.mesh);
    // il raggio che serve per coprire tutto, partendo da qualsiasi punto della base
    this.raggioMassimo = Math.hypot(this.larghezza, this.profondita) + 1;
    this.uniformi = { centro: { value: this.centro }, raggio: { value: 0 } };
  }

  // Mette il pavimento ("pietra"). punto: da dove si allarga; conAnimazione: false = subito tutto (all'avvio)
  posa(tipo, punto, conAnimazione) {
    const cfg = TIPI[tipo];
    this.tipo = tipo;
    const texture = new THREE.CanvasTexture(cfg.disegna());
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(this.larghezza / cfg.metri, this.profondita / cfg.metri);
    texture.anisotropy = 4;
    const materiale = new THREE.MeshLambertMaterial({ map: texture });
    // il pavimento si vede solo dentro il cerchio che si allarga; vicino al bordo del cerchio luccica un po'
    const uniformi = this.uniformi;
    materiale.onBeforeCompile = (shader) => {
      shader.uniforms.centro = uniformi.centro;
      shader.uniforms.raggio = uniformi.raggio;
      shader.vertexShader = shader.vertexShader
        .replace('void main() {', 'varying vec2 vMondo;\nvoid main() {')
        .replace('#include <begin_vertex>', '#include <begin_vertex>\n  vMondo = (modelMatrix * vec4(transformed, 1.0)).xz;');
      shader.fragmentShader = shader.fragmentShader
        .replace('void main() {', 'uniform vec2 centro;\nuniform float raggio;\nvarying vec2 vMondo;\nvoid main() {\n  float dalBordo = raggio - distance(vMondo, centro);\n  if (dalBordo < 0.0) discard;')
        .replace('#include <map_fragment>', '#include <map_fragment>\n  diffuseColor.rgb = mix(diffuseColor.rgb, vec3(1.0, 0.95, 0.78), smoothstep(0.5, 0.0, dalBordo) * 0.7);');
    };
    this.mesh.material.map?.dispose();
    this.mesh.material.dispose();
    this.mesh.material = materiale;
    this.mesh.visible = true;
    this.centro.set(punto.x, punto.z);
    this.raggio = conAnimazione ? 0 : this.raggioMassimo;
    uniformi.raggio.value = conAnimazione ? 0 : 1000; // 1000 = tutto coperto, senza il bordo che luccica
  }

  aggiorna(dt) {
    if (!this.tipo || this.raggio >= this.raggioMassimo) return;
    this.raggio = Math.min(this.raggioMassimo, this.raggio + (this.raggioMassimo / DURATA) * dt);
    this.uniformi.raggio.value = this.raggio >= this.raggioMassimo ? 1000 : this.raggio;
    // un po' di polvere lungo il bordo che avanza (solo dentro la base)
    this.attesaPolvere -= dt;
    if (this.attesaPolvere > 0) return;
    this.attesaPolvere = 0.05;
    const angolo = Math.random() * Math.PI * 2;
    const x = this.centro.x + Math.cos(angolo) * this.raggio;
    const z = this.centro.y + Math.sin(angolo) * this.raggio;
    if (Math.abs(x - this.mesh.position.x) < this.larghezza / 2 && Math.abs(z - this.mesh.position.z) < this.profondita / 2) {
      this.effetti.sbuffo(x, 0.15, z, TIPI[this.tipo].polvere, 3, 1.2);
    }
  }
}
