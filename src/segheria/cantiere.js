// =====================================================================
//  CANTIERE (Gruppo 7)
//  Pagato il miglioramento di una COSTRUZIONE (mura, riparazione, torrette, pavimento) parte un cantiere SULLA COSA MIGLIORATA:
//   - 'mura': la palizzata viene AVVOLTA da teli di tela, legati con travi e puntelli e con un piano di assi in cima;
//   - 'torre': la torretta (o il posto della nuova torretta) viene avvolta nello stesso modo;
//   - 'locale' (il pavimento): al centro due pali con il cartello e la barra, terreno smosso e assi che saltellano.
//  FASI legate alla barra (FASI): puntelli 20%, travi 20%, piano di assi 20%, teli 40%. Si parte dal davanti (dove guarda la
//  telecamera) e si va verso i lati, un telo dopo l'altro. Un cantiere ripreso a metà (salvataggio) mostra subito la fase giusta.
//  Tutto è disegnato con pochi pezzi "istanziati" (puntelli, travi, assi, teli: 4 pezzi in tutto, qualunque sia la lunghezza).
//  OPERAI (3, o 1 per ogni torretta nuova): finché non c'è il piano lavorano a terra; poi salgono dalla scala e sul piano camminano,
//  prendono un'asse da una pila, la posano e martellano; ogni tanto cambiano postazione. Restano sempre sul piano che c'è già e
//  non vanno mai oltre i teli, quindi mai oltre i cancelli. Ogni martellata fa una nuvoletta e qualche truciolo e si sente
//  (solo se il cantiere si vede o è vicino: Segheria.ascoltoLavori). Ogni tanto cade un'asse, che sparisce nella neve.
//  A fine lavori (svela): gli operai esultano con un salto, scendono e se ne vanno; i teli si arrotolano verso l'alto, uno dopo
//  l'altro, con le scintille; poi sparisce anche la struttura. Meno di 3 secondi in tutto.
//  Nel frattempo la costruzione funziona al livello vecchio. La durata è in "cantiere" di ogni livello (CONFIG.miglioramenti) e
//  passa anche con il gioco chiuso. Non dipende dal pagamento. I lavoratori invece non hanno cantiere: arrivano a piedi (arrivo.js).
// =====================================================================

import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { CONFIG } from '../config.js';
import { tinta, creaScritta, creaEtichettaVariabile } from '../modelli/materiali.js';
import { creaLavoratore } from '../modelli/boscaiolo.js';
import { animaPersona, animaColpo, COLPO } from '../modelli/animazioni.js';
import { suoni } from '../motore/suoni.js';
import { MAPPA } from './ambiente.js';

const LARGHEZZA_BARRA = 1.9;
const MEZZO_TELO = 0.6;          // metà dello spessore della copertura intorno alla palizzata (metri): lascia libero il boscaiolo
const ALTEZZA_TELO = 2.5;        // più alta dei pali con la punta (circa 2 metri): non spunta niente
const CAMPATA = 3;               // lunghezza di ogni telo (metri): ogni telo si costruisce per conto suo
const TORRE = { lato: 1.9, altezza: 3.3 }; // la copertura di una torretta (la ringhiera arriva a 3,3 metri)
const PIANO = 0.08;              // spessore del piano di assi in cima
const SPORGENZA = 0.35;          // di quanto i puntelli superano il piano
const SCALA_OPERAIO = CONFIG.segheria.dimensioneBoscaiolo * 0.6; // operai piccoli
const DURATA_COLPO = 0.5;        // secondi di un colpo di martello
const DURATA_COMPARSA = 0.4;     // secondi che ogni pezzo impiega a "spuntare" (con un piccolo rimbalzo)
// le fasi: da che parte della barra a che parte (0 = lavori appena partiti, 1 = finiti)
const FASI = { puntelli: [0, 0.2], travi: [0.2, 0.4], assi: [0.4, 0.6], teli: [0.6, 1] };
const NOMI_PARTI = Object.keys(FASI);
const SVELAMENTO = { attesa: 0.35, onda: 1.8, telo: 0.5, telaio: 0.4, operai: 2.25 }; // tempi di fine lavori (secondi, in tutto meno di 3)
// quanto dura al massimo lo svelamento (la telecamera resta a guardare per tutto questo tempo)
export const DURATA_SVELAMENTO_MASSIMA = 3;
const MAX_ASSI_CADENTI = 2;      // le assi che cadono dal piano: mai più di due insieme

const BOX = new THREE.BoxGeometry(1, 1, 1);

// --- Materiali dei cantieri (fatti una volta sola, usati da tutti) ---
let materiali = null;

// Tela chiara con pieghe verticali morbide, qualche toppa e l'orlo in basso sporco di neve e terra
function creaTelo() {
  const tela = document.createElement('canvas');
  tela.width = 256;
  tela.height = 256;
  const ctx = tela.getContext('2d');
  ctx.fillStyle = '#e3d6b4';
  ctx.fillRect(0, 0, 256, 256);
  for (let x = 0; x < 256; x += 32) {
    const sfumatura = ctx.createLinearGradient(x, 0, x + 32, 0);
    sfumatura.addColorStop(0, 'rgba(110,90,55,0)');
    sfumatura.addColorStop(0.5, 'rgba(110,90,55,0.24)');
    sfumatura.addColorStop(1, 'rgba(110,90,55,0)');
    ctx.fillStyle = sfumatura;
    ctx.fillRect(x, 0, 32, 256);
  }
  ctx.fillStyle = 'rgba(170,150,105,0.55)';
  ctx.fillRect(40, 96, 46, 34);
  ctx.fillRect(168, 150, 38, 40);
  ctx.strokeStyle = 'rgba(90,70,40,0.5)';
  ctx.setLineDash([5, 4]);
  ctx.lineWidth = 2;
  ctx.strokeRect(41, 97, 44, 32);
  ctx.strokeRect(169, 151, 36, 38);
  const orlo = ctx.createLinearGradient(0, 200, 0, 256);
  orlo.addColorStop(0, 'rgba(80,60,35,0)');
  orlo.addColorStop(1, 'rgba(80,60,35,0.4)');
  ctx.fillStyle = orlo;
  ctx.fillRect(0, 200, 256, 56);
  const texture = new THREE.CanvasTexture(tela);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

// Assi del piano: tavole di legno una accanto all'altra, di larghezza e tono un po' diversi
function creaAssi() {
  const tela = document.createElement('canvas');
  tela.width = 256;
  tela.height = 64;
  const ctx = tela.getContext('2d');
  const toni = ['#b57a45', '#a86d3a', '#bf8650', '#ad7340'];
  for (let i = 0; i < 6; i++) {
    ctx.fillStyle = toni[i % toni.length];
    ctx.fillRect((i * 256) / 6, 0, 256 / 6 + 1, 64);
    ctx.fillStyle = 'rgba(70,40,15,0.55)';
    ctx.fillRect((i * 256) / 6, 0, 3, 64);
  }
  const texture = new THREE.CanvasTexture(tela);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function materialiCantiere() {
  if (materiali) return materiali;
  const telo = new THREE.MeshLambertMaterial({ map: creaTelo() });
  // i teli ondeggiano piano: più in basso, più si muovono (ancorati in cima). Lo fa la scheda grafica, nessun calcolo in più per il gioco
  telo.onBeforeCompile = (shader) => {
    shader.uniforms.uTempo = { value: 0 };
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nuniform float uTempo;')
      .replace('#include <begin_vertex>', `#include <begin_vertex>
        float peso = clamp(0.5 - position.y, 0.0, 1.0);
        float fase = instanceMatrix[3].x * 0.9 + instanceMatrix[3].z * 0.9;
        transformed.z += sin(uTempo * 1.7 + fase + position.x * 2.5) * 0.05 * peso * peso;
        transformed.x += sin(uTempo * 1.3 + fase * 1.3) * 0.02 * peso;`);
    telo.userData.shader = shader;
  };
  materiali = {
    telo,
    legno: new THREE.MeshLambertMaterial({ color: 0x7a4a24 }),
    assi: new THREE.MeshLambertMaterial({ map: creaAssi() }),
    vertici: new THREE.MeshLambertMaterial({ vertexColors: true }),
  };
  for (const m of Object.values(materiali)) m.userData.condiviso = true;
  return materiali;
}

// Una scatola di un colore, già messa al suo posto (per unire più pezzi in una forma sola)
function scatolaColorata(larghezza, altezza, profondita, x, y, z, colore) {
  const forma = new THREE.BoxGeometry(larghezza, altezza, profondita);
  forma.translate(x, y, z);
  const c = new THREE.Color(colore);
  const colori = new Float32Array(forma.attributes.position.count * 3);
  for (let i = 0; i < colori.length; i += 3) c.toArray(colori, i);
  forma.setAttribute('color', new THREE.BufferAttribute(colori, 3));
  return forma;
}

const unisci = (parti) => {
  const forma = mergeGeometries(parti);
  for (const parte of parti) parte.dispose();
  return forma;
};

// Un piccolo rimbalzo (parte da 0, supera un po' 1 e si ferma a 1)
const rimbalzo = (k) => {
  if (k <= 0) return 0;
  if (k >= 1) return 1;
  const c = 2.2;
  return 1 + (c + 1) * (k - 1) ** 3 + c * (k - 1) ** 2;
};
const limita = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const angolo = (dx, dz) => Math.atan2(-dx, -dz); // il modello guarda verso la z negativa
const differenzaAngoli = (a, b) => Math.atan2(Math.sin(b - a), Math.cos(b - a));

// Per mettere un pezzo nel posto giusto di un telo: (lx, ly, lz) sono relative al telo (lungo x = lungo il telo) e ly è già l'altezza
const _m = new THREE.Matrix4();
const _q = new THREE.Quaternion();
const _p = new THREE.Vector3();
const _s = new THREE.Vector3();
const _su = new THREE.Vector3(0, 1, 0);
function matrice(tessera, lx, ly, lz, sx, sy, sz) {
  _q.setFromAxisAngle(_su, tessera.giro);
  _p.set(lx, 0, lz).applyQuaternion(_q);
  _p.x += tessera.x;
  _p.z += tessera.z;
  _p.y = ly;
  _s.set(Math.max(0.0001, sx), Math.max(0.0001, sy), Math.max(0.0001, sz));
  return _m.compose(_p, _q, _s);
}

// Il martello degli operai (manico e testa uniti): la forma si fa una volta sola e la usano tutti
let formaMartello = null;
function martelloComune() {
  if (!formaMartello) {
    const manico = new THREE.CylinderGeometry(0.024, 0.024, 0.5, 6);
    manico.rotateX(Math.PI / 2);
    manico.translate(0, -0.3, -0.16);
    const colora = (forma, colore) => {
      const c = new THREE.Color(colore);
      const colori = new Float32Array(forma.attributes.position.count * 3);
      for (let i = 0; i < colori.length; i += 3) c.toArray(colori, i);
      forma.setAttribute('color', new THREE.BufferAttribute(colori, 3));
      return forma;
    };
    formaMartello = unisci([colora(manico, 0x9a6234), scatolaColorata(0.07, 0.16, 0.1, 0, -0.3, -0.4, 0x6b7480)]);
  }
  return new THREE.Mesh(formaMartello, materialiCantiere().vertici);
}

// Un operaio: un piccolo lavoratore con elmetto giallo e martello. Segue una lista di cose da fare (azioni): va in un punto,
// prende un'asse dalla pila, la posa, martella qualche colpo, sale dalla scala. A fine lavori esulta, scende e se ne va.
class Operaio {
  constructor(cantiere, catena, indice) {
    this.cantiere = cantiere;
    this.catena = catena;
    this.effetti = cantiere.effetti;
    this.indice = indice;
    this.pos = new THREE.Vector3();
    this.giro = 0;
    this.azioni = [];
    this.azione = null;
    this.tempo = 0;
    this.suPiano = false;
    this.porta = false;
    this.atterraggio = 0;   // piccolo rimbalzo dopo ogni arrivo
    this.finito = false;
    this.inChiusura = false;
    this.modello = creaLavoratore({ berretto: 0xf2a62c, berrettoScuro: 0xc77d14, giacca: 0x6b7f99, senzaAscia: true });
    this.modello.scale.setScalar(SCALA_OPERAIO);
    this.modello.userData.anim = { fase: 0, moto: 0, tempo: Math.random() * 10 };
    // il martello: manico e testa in una forma sola (una sola chiamata di disegno per operaio)
    this.modello.userData.perni.braccioDx.add(martelloComune());
    // l'asse che porta in braccio
    this.asse = new THREE.Mesh(BOX, tinta(0xb57a45));
    this.asse.scale.set(0.2, 0.05, 0.8);
    this.asse.position.set(0, 0.62, -0.36);
    this.asse.visible = false;
    this.modello.userData.molla.add(this.asse);
    // parte a terra, davanti alla sua catena, in un posto diverso da quello degli altri
    const partenza = catena.suolo[indice % catena.suolo.length];
    this.pos.set(partenza.x, 0, partenza.z);
    this.giro = angolo(-catena.normale.x, -catena.normale.z);
    this.attesa = 0.2 + Math.random() * 1.2;
    cantiere.gruppo.add(this.modello);
    this.applica();
  }

  get y() {
    return this.pos.y;
  }

  applica() {
    this.modello.position.copy(this.pos);
    this.modello.rotation.y = this.giro;
  }

  guarda(verso, dt, forza = 8) {
    this.giro += differenzaAngoli(this.giro, verso) * Math.min(1, dt * forza);
  }

  // Cosa fare dopo: decide in base a dove si trova e a come procedono i lavori
  pianifica() {
    const c = this.cantiere;
    const catena = this.catena;
    const azioni = [];
    if (!this.suPiano) {
      if (c.progresso >= FASI.assi[0] + 0.03 && c.scalaPronta(catena) && c.stazioniPiano(catena).length > 0 && (!catena.scalaOccupata || catena.scalaOccupata === this)) {
        catena.scalaOccupata = this; // sulla scala si sale uno alla volta
        azioni.push({ tipo: 'vai', x: catena.scala.piede.x, z: catena.scala.piede.z }, { tipo: 'sali' });
      } else {
        const posti = c.stazioniSuolo(catena);
        const posto = posti.length > 0 ? posti[Math.floor(Math.random() * posti.length)] : catena.suolo[0];
        azioni.push({ tipo: 'vai', x: posto.x, z: posto.z, giro: angolo(-catena.normale.x, -catena.normale.z) }, { tipo: 'martella', n: 2 + Math.floor(Math.random() * 3), giro: angolo(-catena.normale.x, -catena.normale.z) });
      }
    } else {
      const posti = c.stazioniPiano(catena).filter((p) => Math.hypot(p.x - this.pos.x, p.z - this.pos.z) > 0.5 && !c.operaiVicini(this, p));
      const posto = posti.length > 0 ? posti[Math.floor(Math.random() * posti.length)] : null;
      const pila = c.pilaPronta(catena) ? catena.pila : null;
      if (pila && posto && Math.random() < 0.5) {
        azioni.push({ tipo: 'vai', x: pila.sosta.x, z: pila.sosta.z }, { tipo: 'prendi' }, { tipo: 'vai', x: posto.x, z: posto.z }, { tipo: 'posa' });
      } else if (posto) {
        azioni.push({ tipo: 'vai', x: posto.x, z: posto.z });
      }
      azioni.push({ tipo: 'martella', n: 2 + Math.floor(Math.random() * 3), giro: Math.PI });
    }
    this.azioni = azioni;
  }

  // A fine lavori: esulta con un salto, scende dal piano, se ne va e sparisce
  finisci() {
    this.inChiusura = true;
    if (this.catena.scalaOccupata === this) this.catena.scalaOccupata = null;
    this.azione = null;
    this.porta = false;
    this.asse.visible = false;
    this.azioni = [];
    if (this.suPiano) this.azioni.push({ tipo: 'esulta' }, { tipo: 'salta' });
    this.azioni.push({ tipo: 'via' }, { tipo: 'sparisce' });
  }

  // Il martello tocca: un colpo piano, una nuvoletta e qualche truciolo (solo se il cantiere si vede o è vicino)
  martella() {
    const v = this.cantiere.ascolto(this.pos.x, this.pos.z);
    if (v <= 0.02) return;
    suoni.suona('martello', { volume: v });
    const davanti = new THREE.Vector3(0, 0, -0.35 * SCALA_OPERAIO).applyAxisAngle(_su, this.giro);
    this.cantiere.dettagliColpo(this.pos.x + davanti.x, this.pos.y + 0.12, this.pos.z + davanti.z);
  }

  aggiorna(dt) {
    const m = this.modello;
    const perni = m.userData.perni;
    this.atterraggio = Math.max(0, this.atterraggio - dt * 3);
    if (!this.azione) {
      if (this.azioni.length === 0) {
        // fermo a respirare un attimo, poi pianifica
        this.attesa -= dt;
        animaPersona(m, dt, 0, { carica: this.porta ? 1.1 : 0 });
        this.molleggio(m);
        if (this.attesa <= 0 && !this.inChiusura) {
          this.attesa = 0.15 + Math.random() * 0.5;
          this.pianifica();
        }
        this.applica();
        return;
      }
      this.azione = this.azioni.shift();
      this.tempo = 0;
      this.colpo = null;
      this.colpiFatti = 0;
      this.riposo = 0.15;
      if (this.azione.tipo === 'via') this.dirVia = new THREE.Vector3(this.catena.normale.x, 0, this.catena.normale.z);
      if (this.azione.tipo === 'salta') {
        this.da = this.pos.clone();
        this.a = new THREE.Vector3(this.pos.x + this.catena.normale.x * 1.5, 0, this.pos.z + this.catena.normale.z * 1.5);
      }
      if (this.azione.tipo === 'vai') this.percorso = Math.hypot(this.azione.x - this.pos.x, this.azione.z - this.pos.z);
      if (this.azione.tipo === 'sali') this.salita = this.cantiere.altezzaPiano(this.catena);
    }
    const a = this.azione;
    this.tempo += dt;
    switch (a.tipo) {
      case 'vai': {
        const dx = a.x - this.pos.x;
        const dz = a.z - this.pos.z;
        const resta = Math.hypot(dx, dz);
        if (resta < 0.04) {
          this.atterraggio = 1;
          this.fine();
          break;
        }
        // parte e rallenta piano: la velocità sale all'inizio e scende negli ultimi 40 cm
        const fatto = this.percorso - resta;
        const velocita = 1.25 * limita(Math.min((fatto + 0.12) / 0.45, (resta + 0.05) / 0.45), 0.18, 1);
        this.guarda(angolo(dx, dz), dt, 10);
        const passo = Math.min(resta, velocita * dt);
        this.pos.x += (dx / resta) * passo;
        this.pos.z += (dz / resta) * passo;
        animaPersona(m, dt, 1, { velocita: 9, carica: this.porta ? 1.1 : 0 });
        break;
      }
      case 'prendi':
      case 'posa': {
        const k = this.tempo / 0.7;
        animaPersona(m, dt, 0);
        perni.braccioSx.rotation.x = perni.braccioDx.rotation.x = 0.8 * Math.sin(k * Math.PI);
        m.userData.molla.rotation.x = 0.38 * Math.sin(k * Math.PI);
        if (a.tipo === 'prendi' && k > 0.45 && !this.porta) {
          this.porta = true;
          this.asse.visible = true;
        }
        if (a.tipo === 'posa' && k > 0.5 && this.porta) {
          this.porta = false;
          this.asse.visible = false;
          if (this.cantiere.ascolto(this.pos.x, this.pos.z) > 0.02) this.effetti.sbuffo(this.pos.x, this.pos.y + 0.1, this.pos.z, 0xe6d9ba, 3, 1);
        }
        if (k >= 1) this.fine();
        break;
      }
      case 'martella': {
        // fermo, guarda dove lavora, qualche colpo con una pausa tra l'uno e l'altro
        animaPersona(m, dt, 0);
        this.guarda(a.giro, dt, 6);
        if (this.colpo === null) {
          this.riposo -= dt;
          if (this.riposo <= 0) {
            this.colpo = 0;
            this.colpito = false;
          }
        } else {
          this.colpo += dt / DURATA_COLPO;
          animaColpo(m, Math.min(1, this.colpo));
          if (!this.colpito && this.colpo >= COLPO.impatto) {
            this.colpito = true;
            this.martella();
          }
          if (this.colpo >= 1) {
            this.colpo = null;
            this.colpiFatti++;
            // ogni tanto due colpi di fila, poi una pausa (stesso ritmo di prima: circa un colpo e mezzo al secondo in tutto)
            this.riposo = Math.random() < 0.3 ? 0.08 : 0.5 + Math.random();
            if (this.colpiFatti >= a.n) this.fine();
          }
        }
        break;
      }
      case 'sali': {
        // sale la scala verso il piano, poi fa un passo sopra
        const c = this.cantiere;
        const alto = this.salita;
        animaPersona(m, dt, 1, { velocita: 8 });
        this.guarda(angolo(-this.catena.normale.x, -this.catena.normale.z), dt, 10);
        if (this.pos.y < alto) {
          this.pos.y = Math.min(alto, this.pos.y + 1.6 * dt);
          this.pos.x += (this.catena.scala.x - this.pos.x) * Math.min(1, dt * 8);
          this.pos.z += (this.catena.scala.z - this.pos.z) * Math.min(1, dt * 8);
        } else {
          const posti = c.stazioniPiano(this.catena);
          const posto = posti.length > 0 ? posti[0] : null;
          if (posto) {
            // un saltello sul piano
            this.pos.x += (posto.x - this.pos.x) * Math.min(1, dt * 7);
            this.pos.z += (posto.z - this.pos.z) * Math.min(1, dt * 7);
            if (Math.hypot(posto.x - this.pos.x, posto.z - this.pos.z) < 0.08) {
              this.suPiano = true;
              if (this.catena.scalaOccupata === this) this.catena.scalaOccupata = null;
              this.atterraggio = 1;
              this.fine();
            }
          } else {
            this.pos.y = alto;
          }
        }
        break;
      }
      case 'esulta': {
        const k = limita(this.tempo / 0.5);
        animaPersona(m, dt, 0);
        perni.braccioSx.rotation.x = perni.braccioDx.rotation.x = -2.7;
        this.pos.y = this.cantiere.altezzaPiano(this.catena) + Math.sin(k * Math.PI) * 0.35;
        this.guarda(Math.PI, dt, 8);
        if (k >= 1) {
          this.pos.y = this.cantiere.altezzaPiano(this.catena);
          this.fine();
        }
        break;
      }
      case 'salta': {
        const k = limita(this.tempo / 0.5);
        animaPersona(m, dt, 0);
        perni.braccioSx.rotation.x = perni.braccioDx.rotation.x = -2.3;
        this.pos.lerpVectors(this.da, this.a, k);
        this.pos.y = this.da.y * (1 - k * k) + Math.sin(k * Math.PI) * 0.4;
        this.guarda(angolo(this.catena.normale.x, this.catena.normale.z), dt, 8);
        if (k >= 1) {
          this.suPiano = false;
          this.pos.y = 0;
          this.atterraggio = 1;
          this.effetti.sbuffo(this.pos.x, 0.2, this.pos.z, 0xf4f8ff, 5, 1.4);
          this.fine();
        }
        break;
      }
      case 'via': {
        animaPersona(m, dt, 1, { velocita: 9 });
        this.guarda(angolo(this.dirVia.x, this.dirVia.z), dt, 10);
        this.pos.addScaledVector(this.dirVia, dt * 1.5);
        if (this.tempo >= 1.0) this.fine();
        break;
      }
      case 'sparisce': {
        animaPersona(m, dt, 1, { velocita: 9 });
        this.pos.addScaledVector(this.dirVia, dt * 1.5);
        const k = limita(this.tempo / 0.25);
        m.scale.setScalar(Math.max(0.001, SCALA_OPERAIO * (1 - k)));
        if (k >= 1) {
          this.effetti.sbuffo(this.pos.x, 0.6, this.pos.z, 0xe9e1cc, 4, 1.2);
          this.finito = true;
        }
        break;
      }
      default:
        this.fine();
    }
    this.molleggio(m, this.azione?.tipo === 'martella');
    this.applica();
  }

  fine() {
    this.azione = null;
  }

  // Il piccolo rimbalzo dopo un arrivo: si schiaccia un po' e torna su
  molleggio(m, fermo = false) {
    if (this.atterraggio <= 0 || fermo) return;
    const s = Math.sin(this.atterraggio * Math.PI) * 0.07;
    const molla = m.userData.molla;
    molla.scale.y *= 1 - s;
    molla.scale.x *= 1 + s * 0.6;
    molla.scale.z *= 1 + s * 0.6;
  }

  togli() {
    this.modello.parent?.remove(this.modello);
  }
}

export class Cantiere {
  // tipo: 'mura', 'torre' o 'locale'; punti: i punti del mondo dove stanno le cose (per 'torre' e 'locale'); durata e rimasto in
  // secondi; file: le file di pali della palizzata (per 'mura'); ascolto(x, z): quanto si sente un rumore lì (0-1, vedi Segheria)
  constructor(genitore, effetti, { tipo, punti = [], durata, rimasto = durata, file = [], ascolto = () => 1 }) {
    this.effetti = effetti;
    this.tipo = tipo;
    this.durata = durata;
    this.rimasto = rimasto;
    this.ascolto = ascolto;
    this.comparsa = 0;     // 0 → 1: spunta con un saltello
    this.attesaPolvere = 0.3;
    this.attesaAsse = 2 + Math.random() * 3;
    this.attesaVoce = 6 + Math.random() * 8;
    this.attesaSega = 3 + Math.random() * 4;
    this.attesaMartello = 1;
    this.attesaCaduta = 4 + Math.random() * 4;
    this.tempo = 0;
    this.svelando = null;  // secondi da quando sono finiti i lavori (null = i lavori sono in corso)
    this.scatola = BOX;
    this.segnali = [];     // i cartelli con la barra (uno per punto, uno solo per le mura)
    this.cartelli = [];    // i gruppi dei cartelli (si rimpiccioliscono a fine lavori)
    this.assi = [];        // le assi che saltellano (solo nel cantiere del pavimento)
    this.tessere = [];     // i teli: dove stanno, a che punto è ogni parte
    this.catene = [];      // i tratti di piano dove lavorano gli operai
    this.operai = [];
    this.cadenti = [];     // le assi che cadono dal piano
    this.suoni = [];       // i punti da cui arrivano i rumori dei lavori
    this.geometrie = [];   // le forme fatte apposta per questo cantiere (da liberare alla fine)
    this.istanze = null;

    this.gruppo = new THREE.Group();
    genitore.add(this.gruppo);
    this.legno = tinta(0x9a6234);
    this.scuro = tinta(0x5e3517);

    if (tipo === 'mura') {
      this.copriMura(file);
      // il cartello davanti, al centro del lato in basso (quello che si vede meglio), fuori dai teli
      this.creaSegnale(0, MAPPA.mura.fronte + MEZZO_TELO + 1.1, 1.25);
      this.centro = new THREE.Vector3(0, 0, 2.5); // un po' verso il davanti, dove sta il cartello
      this.zoom = 1.6;
      this.punti = [new THREE.Vector3(0, 0, MAPPA.mura.fronte)];
    } else {
      for (const punto of punti) {
        if (tipo === 'torre') this.copriTorre(punto);
        else this.creaStruttura(punto);
      }
      this.punti = punti.map((p) => new THREE.Vector3(p.x, 0, p.z));
      this.centro = this.punti.reduce((somma, p) => somma.add(p), new THREE.Vector3()).multiplyScalar(1 / Math.max(1, this.punti.length));
      this.zoom = punti.length > 1 ? 1.5 : 0.85;
      this.suoni = this.punti.map((p) => ({ x: p.x, z: p.z }));
    }
    if (this.tessere.length > 0) {
      this.creaIstanze();
      this.creaOperai();
    }
    this.aggiornaBarra();
  }

  // Dopo quanti secondi dall'inizio dello svelamento il miglioramento vero diventa effettivo: quando i primi teli cominciano ad alzarsi
  // (il pavimento e le strutture senza teli: subito)
  get attesaEffetto() {
    return this.tessere.length > 0 ? SVELAMENTO.attesa : 0;
  }

  get progresso() {
    return 1 - Math.max(0, this.rimasto) / this.durata;
  }

  pezzo(materiale, pos, scala, rot = [0, 0, 0], genitore = this.gruppo) {
    const m = new THREE.Mesh(this.scatola, materiale);
    m.position.set(...pos);
    m.scale.set(...scala);
    m.rotation.set(...rot);
    m.castShadow = true;
    genitore.add(m);
    return m;
  }

  // --------------------------------------------------------------------- teli e fasi ---

  // Un telo (una "tessera" della copertura): x, z il centro; lunghezza lungo il telo, larghezza attraverso, altezza = piano in cima
  aggiungiTessera(x, z, lunghezza, larghezza, altezza, { lungoZ = false, latiCorti = false, normale, ritardo = 0 } = {}) {
    const tessera = { x, z, lunghezza, larghezza, altezza, giro: lungoZ ? Math.PI / 2 : 0, latiCorti, normale, ritardo, ordine: 0, parti: {}, soglie: {}, attiva: true, indici: {} };
    for (const nome of NOMI_PARTI) tessera.parti[nome] = null; // quando è spuntata la parte (secondi del cantiere); null = non ancora
    this.tessere.push(tessera);
    return tessera;
  }

  // La palizzata avvolta dai teli: ogni fila di pali è divisa in teli lunghi circa 3 metri. Ai varchi (cancelli e sportelli)
  // la copertura si ferma; agli angoli si chiude.
  copriMura(file) {
    const M = MAPPA.mura;
    const origine = Math.atan2(MAPPA.miglioramenti.mura.z, MAPPA.miglioramenti.mura.x); // da dove parte l'onda delle mura nuove
    const ritardo = (x, z) => {
      const d = Math.atan2(z, x) - origine;
      return Math.abs(Math.atan2(Math.sin(d), Math.cos(d))) / Math.PI;
    };
    let catenaDavanti = null;
    for (const riga of file) {
      const lungoX = Math.abs(riga.z1 - riga.z2) < 0.01;
      let da = lungoX ? riga.x1 : riga.z1;
      let a = lungoX ? riga.x2 : riga.z2;
      const fisso = lungoX ? riga.z1 : riga.x1;
      // negli angoli (le file in alto e in basso arrivano fino ai pali d'angolo) la copertura si chiude; ai varchi sporge poco
      const angolo = (v) => lungoX && (Math.abs(v - M.sinistra) < 0.01 || Math.abs(v - M.destra) < 0.01);
      da -= angolo(da) ? MEZZO_TELO : 0.12;
      a += angolo(a) ? MEZZO_TELO : 0.12;
      const quanti = Math.max(1, Math.round((a - da) / CAMPATA));
      const lunghezza = (a - da) / quanti;
      const fila = [];
      for (let i = 0; i < quanti; i++) {
        const centro = da + lunghezza * (i + 0.5);
        const x = lungoX ? centro : fisso;
        const z = lungoX ? fisso : centro;
        const tessera = this.aggiungiTessera(x, z, lunghezza, MEZZO_TELO * 2, ALTEZZA_TELO, { lungoZ: !lungoX, normale: riga.normale, ritardo: ritardo(x, z) });
        tessera.rialzo = lungoX ? 0 : 0.005; // le file sui lati stanno un millimetro più su: niente sfarfallio dove si toccano
        fila.push(tessera);
        this.suoni.push({ x, z });
      }
      // la fila davanti al centro è dove lavorano gli operai (si vede meglio e non ci sono varchi in mezzo)
      if (lungoX && riga.normale.z === 1 && riga.x1 <= 0 && riga.x2 >= 0) catenaDavanti = { fila, lungoX, fisso, normale: riga.normale };
    }
    // ordine di costruzione: dal davanti (al centro) verso i lati
    const centroDavanti = new THREE.Vector3(0, 0, M.fronte);
    const lontano = Math.max(...this.tessere.map((t) => Math.hypot(t.x - centroDavanti.x, t.z - centroDavanti.z)));
    for (const t of this.tessere) t.ordine = Math.hypot(t.x - centroDavanti.x, t.z - centroDavanti.z) / lontano;
    if (catenaDavanti) this.catene.push(this.creaCatena(catenaDavanti.fila, catenaDavanti.fisso, catenaDavanti.normale, 3));
  }

  // Una torretta avvolta dai teli, con un operaio
  copriTorre(punto) {
    const tessera = this.aggiungiTessera(punto.x, punto.z, TORRE.lato, TORRE.lato, TORRE.altezza, { latiCorti: true, normale: { x: Math.sign(punto.x) || 1, z: 0 } });
    tessera.ordine = 0; // tutte le torrette nuove si costruiscono insieme (stesse fasi, stessi tempi) e finiscono nello stesso momento
    // il cartello accanto, lungo la palizzata
    this.creaSegnale(punto.x, punto.z + TORRE.lato / 2 + 0.9, 1);
    this.catene.push(this.creaTorreCatena(tessera)); // un operaio per ogni torretta
  }

  // Dove possono stare gli operai lungo una fila di teli: a terra (fuori, davanti ai teli), sul piano, alla pila di assi e alla scala
  creaCatena(fila, fisso, normale, operai) {
    const suolo = [];
    const piano = [];
    for (const t of fila) {
      suolo.push({ x: t.x, z: fisso + normale.z * (MEZZO_TELO + 0.55), tessera: t });
      for (let k = -1; k <= 1; k++) piano.push({ x: t.x + k * (t.lunghezza / 2 - 0.45), z: fisso, tessera: t });
    }
    const primo = fila[0];
    const scalaX = primo.x - primo.lunghezza / 2 + 0.55;
    const catena = {
      fila, normale, operai, suolo, piano,
      pila: { x: scalaX + 0.8, z: fisso + normale.z * 0.28, sosta: { x: scalaX + 0.8, z: fisso - normale.z * 0.1 }, tessera: primo },
      scala: { x: scalaX, z: fisso + normale.z * (MEZZO_TELO + 0.12), piede: { x: scalaX, z: fisso + normale.z * (MEZZO_TELO + 0.45) }, tessera: primo },
    };
    return catena;
  }

  creaTorreCatena(tessera) {
    const fuori = tessera.normale.x;
    const piano = [[-0.35, -0.35], [0.35, -0.35], [0.35, 0.35], [-0.35, 0.35]].map(([dx, dz]) => ({ x: tessera.x + dx, z: tessera.z + dz, tessera }));
    return {
      fila: [tessera], normale: tessera.normale, operai: 1,
      suolo: [{ x: tessera.x + fuori * (TORRE.lato / 2 + 0.6), z: tessera.z, tessera }],
      piano,
      pila: { x: tessera.x - fuori * 0.55, z: tessera.z - 0.55, sosta: { x: tessera.x - fuori * 0.2, z: tessera.z - 0.2 }, tessera },
      scala: { x: tessera.x + fuori * (TORRE.lato / 2 + 0.12), z: tessera.z - 0.5, piede: { x: tessera.x + fuori * (TORRE.lato / 2 + 0.45), z: tessera.z - 0.5 }, tessera, sulX: true },
    };
  }

  // I pezzi istanziati: tutti i puntelli, tutte le travi, tutti i piani e tutti i teli, ognuno in un'unica forma
  creaIstanze() {
    const m = materialiCantiere();
    let nPunt = 0;
    let nTravi = 0;
    for (const t of this.tessere) {
      t.travi = this.travi(t);
      t.indici = { puntelli: nPunt, travi: nTravi, assi: this.tessere.indexOf(t), teli: this.tessere.indexOf(t) };
      nPunt += 4;
      nTravi += t.travi.length;
    }
    const crea = (materiale, quanti) => {
      const mesh = new THREE.InstancedMesh(BOX, materiale, Math.max(1, quanti));
      mesh.frustumCulled = false;
      mesh.castShadow = true;
      mesh.count = quanti;
      this.gruppo.add(mesh);
      return mesh;
    };
    this.istanze = {
      puntelli: crea(m.legno, nPunt),
      travi: crea(m.legno, nTravi),
      assi: crea(m.assi, this.tessere.length),
      teli: crea(m.telo, this.tessere.length),
    };
    // quando spunta ogni parte: dentro la sua fase, un telo dopo l'altro (dal davanti verso i lati)
    for (const t of this.tessere) {
      for (const nome of NOMI_PARTI) {
        const [da, a] = FASI[nome];
        t.soglie[nome] = da + (a - da) * 0.8 * t.ordine;
      }
    }
    // la scala (compare con le travi), la pila di assi (compare con il piano) e la scala per salire
    for (const catena of this.catene) this.creaAttrezzi(catena);
    // un cantiere ripreso a metà: le parti già fatte ci sono subito, senza rifare l'animazione
    const p = this.progresso;
    for (const t of this.tessere) {
      for (const nome of NOMI_PARTI) if (p >= t.soglie[nome]) t.parti[nome] = -100;
    }
    for (const catena of this.catene) {
      if (p >= FASI.travi[0]) catena.scalaT0 = -100;
      if (p >= FASI.assi[0] + 0.05) catena.pilaT0 = -100;
    }
    this.aggiornaIstanze(true);
  }

  travi(t) {
    const lista = [];
    const mz = t.larghezza / 2 + 0.03;
    for (const sz of [-1, 1]) {
      for (const y of [t.altezza - 1.7, t.altezza - 0.8]) lista.push({ lx: 0, ly: y, lz: sz * mz, lungo: 'x', misura: t.lunghezza, spess: 0.06 });
    }
    if (t.latiCorti) {
      const mx = t.lunghezza / 2 + 0.03;
      for (const sx of [-1, 1]) {
        for (const y of [t.altezza - 2.5, t.altezza - 1.7, t.altezza - 0.8]) lista.push({ lx: sx * mx, ly: y, lz: 0, lungo: 'z', misura: t.larghezza, spess: 0.06 });
      }
    }
    return lista;
  }

  // La scala per salire sul piano e la pila di assi: una forma sola ognuna
  creaAttrezzi(catena) {
    const m = materialiCantiere();
    const alto = catena.fila[0].altezza + PIANO;
    const parti = [];
    for (const sx of [-1, 1]) parti.push(scatolaColorata(0.06, alto + 0.25, 0.05, sx * 0.24, (alto + 0.25) / 2, 0, 0x6e4022));
    for (let y = 0.3; y < alto; y += 0.3) parti.push(scatolaColorata(0.5, 0.04, 0.05, 0, y, 0, 0x8a5a31));
    const scala = new THREE.Mesh(unisci(parti), m.vertici);
    this.geometrie.push(scala.geometry);
    scala.castShadow = true;
    scala.position.set(catena.scala.x, 0, catena.scala.z);
    // la scala sta contro il telo, con i pioli verso l'esterno: di lato, per la torretta
    if (catena.scala.sulX) scala.rotation.y = Math.PI / 2;
    scala.scale.setScalar(0.001);
    this.gruppo.add(scala);
    catena.meshScala = scala;
    const pile = [];
    for (let i = 0; i < 3; i++) {
      pile.push(scatolaColorata(0.8, 0.07, 0.2, 0, 0.04 + i * 0.075, -0.12, i % 2 ? 0xb57a45 : 0xa86d3a));
      pile.push(scatolaColorata(0.8, 0.07, 0.2, 0.02 * i, 0.04 + i * 0.075, 0.12, i % 2 ? 0xa86d3a : 0xb57a45));
    }
    const pila = new THREE.Mesh(unisci(pile), m.vertici);
    this.geometrie.push(pila.geometry);
    pila.castShadow = true;
    pila.position.set(catena.pila.x, alto, catena.pila.z);
    pila.scale.setScalar(0.001);
    this.gruppo.add(pila);
    catena.meshPila = pila;
  }

  // Quanto è "spuntato" un pezzo adesso: 0 = non c'è, 1 = al suo posto (con un piccolo rimbalzo mentre spunta)
  fattore(t0) {
    if (t0 === null || t0 === undefined) return 0;
    return rimbalzo((this.tempo - t0) / DURATA_COMPARSA);
  }

  // Mette ogni pezzo al suo posto. Se "tutto" è falso aggiorna solo i teli che stanno ancora spuntando o si stanno togliendo
  aggiornaIstanze(tutto = false) {
    if (!this.istanze) return;
    const { puntelli, travi, assi, teli } = this.istanze;
    const svela = this.svelando;
    let cambiato = false;
    for (const t of this.tessere) {
      // il telaio (puntelli, travi, piano) a fine lavori si rimpicciolisce; il telo si arrotola verso l'alto (vedi sotto)
      let resta = 1;
      let roll = 0;
      if (svela !== null) {
        const inizio = t.inizioSvela;
        resta = 1 - limita((svela - inizio - 0.25) / SVELAMENTO.telaio) ** 2;
        roll = limita((svela - inizio) / SVELAMENTO.telo);
      }
      const fP = this.fattore(t.parti.puntelli) * resta;
      const fT = this.fattore(t.parti.travi) * resta;
      const fA0 = this.fattore(t.parti.assi);
      const sA = fA0 > 0 ? resta : 0.0001;
      const fL = this.fattore(t.parti.teli);
      // a fine lavori ogni telo si muove solo nel suo momento (prima è fermo, dopo è sparito): gli altri non si ricalcolano
      const inMoto = svela !== null ? (svela >= t.inizioSvela - 0.05 && svela <= t.inizioSvela + 0.25 + SVELAMENTO.telaio + 0.1) : (t.attiva || tutto);
      if (!inMoto) continue;
      const H = t.altezza + SPORGENZA;
      // puntelli: crescono dal terreno
      const mx = t.lunghezza / 2 - 0.07;
      const mz = t.larghezza / 2 + 0.03;
      let i = t.indici.puntelli;
      for (const sx of [-1, 1]) {
        for (const sz of [-1, 1]) puntelli.setMatrixAt(i++, matrice(t, sx * mx, (H * fP) / 2, sz * mz, fP > 0 ? 0.14 : 0, H * fP, fP > 0 ? 0.14 : 0));
      }
      // travi: scorrono (si allungano dal centro)
      let j = t.indici.travi;
      for (const b of t.travi) {
        if (b.lungo === 'x') travi.setMatrixAt(j++, matrice(t, b.lx, b.ly, b.lz, b.misura * fT, 0.1 * Math.min(1, fT * 2), b.spess));
        else travi.setMatrixAt(j++, matrice(t, b.lx, b.ly, b.lz, b.spess, 0.1 * Math.min(1, fT * 2), b.misura * fT));
      }
      // piano di assi: cala dall'alto e rimbalza
      assi.setMatrixAt(t.indici.assi, matrice(t, 0, t.altezza + PIANO / 2 + (t.rialzo ?? 0) + (1 - Math.min(1, fA0)) * 0.9 * (fA0 > 0 ? 1 : 0), 0, (t.lunghezza + 0.04) * sA, PIANO * sA, (t.larghezza + 0.12) * sA));
      // telo: si srotola dall'alto (fissato in cima); a fine lavori si arrotola verso l'alto, con un'ondina
      const alto = t.altezza * Math.max(0.0001, (fL > 0 ? Math.min(1.04, fL) : 0) * (1 - roll * roll));
      const onda = roll > 0 ? Math.sin(roll * Math.PI * 2.5) * 0.12 * (1 - roll) : 0;
      const presente = fL > 0 && roll < 1 ? 1 : 0; // finché non spunta (o dopo che si è arrotolato) non si vede niente
      teli.setMatrixAt(t.indici.teli, matrice(t, 0, t.altezza - alto / 2 + (t.rialzo ?? 0), onda, t.lunghezza * (1 + (roll > 0 ? 0.04 * Math.sin(roll * 9) : 0)) * presente, alto * presente, (t.larghezza - 0.02) * presente));
      cambiato = true;
      if (!tutto && svela === null) {
        // finito di spuntare tutto quello che è già comparso: non serve più aggiornarlo ogni fotogramma
        t.attiva = NOMI_PARTI.some((nome) => t.parti[nome] !== null && this.tempo - t.parti[nome] < DURATA_COMPARSA + 0.05);
      }
    }
    if (cambiato) for (const mesh of [puntelli, travi, assi, teli]) mesh.instanceMatrix.needsUpdate = true;
  }

  // Fa spuntare le parti che la barra ha raggiunto
  avanzaFasi() {
    const p = this.progresso;
    for (const t of this.tessere) {
      for (const nome of NOMI_PARTI) {
        if (t.parti[nome] === null && p >= t.soglie[nome]) {
          t.parti[nome] = this.tempo;
          t.attiva = true;
        }
      }
    }
    for (const catena of this.catene) {
      if (catena.scalaT0 === undefined && p >= FASI.travi[0]) catena.scalaT0 = this.tempo;
      if (catena.pilaT0 === undefined && p >= FASI.assi[0] + 0.05) catena.pilaT0 = this.tempo;
      if (catena.meshScala) catena.meshScala.scale.setScalar(Math.max(0.001, this.fattore(catena.scalaT0)));
      if (catena.meshPila) catena.meshPila.scale.setScalar(Math.max(0.001, this.fattore(catena.pilaT0)));
    }
  }

  // --------------------------------------------------------------------- per gli operai ---
  // Il piano di un telo c'è (e ha finito di cadere al suo posto)?
  pianoPronto(t) {
    return t.parti.assi !== null && this.tempo - t.parti.assi > DURATA_COMPARSA;
  }

  stazioniPiano(catena) {
    return catena.piano.filter((s) => this.pianoPronto(s.tessera));
  }

  stazioniSuolo(catena) {
    const fatti = catena.suolo.filter((s) => s.tessera.parti.puntelli !== null);
    return fatti.length > 0 ? fatti : catena.suolo.slice(0, 1);
  }

  scalaPronta(catena) {
    return catena.scalaT0 !== undefined && this.fattore(catena.scalaT0) >= 1 && this.pianoPronto(catena.scala.tessera);
  }

  pilaPronta(catena) {
    return catena.pilaT0 !== undefined && this.pianoPronto(catena.pila.tessera);
  }

  altezzaPiano(catena) {
    return catena.fila[0].altezza + PIANO;
  }

  // Un altro operaio è già lì vicino (o ci sta andando)?
  operaiVicini(operaio, posto) {
    return this.operai.some((o) => o !== operaio && o.suPiano && Math.hypot(o.pos.x - posto.x, o.pos.z - posto.z) < 0.7);
  }

  creaOperai() {
    let indice = 0;
    for (const catena of this.catene) {
      for (let k = 0; k < catena.operai; k++) this.operai.push(new Operaio(this, catena, indice++));
    }
  }

  // Nuvoletta e qualche truciolo a ogni martellata
  dettagliColpo(x, y, z) {
    this.effetti.sbuffo(x, y, z, 0xe6d9ba, 2, 0.9);
    this.effetti.sbuffo(x, y + 0.1, z, 0xd8b078, 3, 1.7); // trucioli di legno
  }

  // Ogni tanto un'asse cade dal piano, rimbalza e sparisce nella neve (mai più di MAX_ASSI_CADENTI insieme)
  aggiornaCadute(dt) {
    this.attesaCaduta -= dt;
    if (this.attesaCaduta <= 0) {
      this.attesaCaduta = 5 + Math.random() * 5;
      const pronti = this.tessere.filter((t) => this.pianoPronto(t) && t.normale);
      const t = pronti[Math.floor(Math.random() * pronti.length)];
      if (t && this.cadenti.length < MAX_ASSI_CADENTI && this.ascolto(t.x, t.z) > 0) {
        const mesh = new THREE.Mesh(BOX, tinta(0xb57a45));
        mesh.scale.set(0.7, 0.05, 0.18);
        mesh.castShadow = true;
        mesh.position.set(t.x + (Math.random() - 0.5) * 1.0 + t.normale.x * 0.55, t.altezza + 0.1, t.z + t.normale.z * 0.55 + (t.normale.z === 0 ? (Math.random() - 0.5) : 0));
        this.gruppo.add(mesh);
        this.cadenti.push({ mesh, vy: 0.5, vx: t.normale.x * 0.9, vz: t.normale.z * 0.9, giro: (Math.random() - 0.5) * 5, stato: 'cade', tempo: 0, rimbalzi: 0 });
      }
    }
    for (const asse of [...this.cadenti]) {
      const m = asse.mesh;
      if (asse.stato === 'cade') {
        asse.vy -= 9.8 * dt;
        m.position.x += asse.vx * dt;
        m.position.z += asse.vz * dt;
        m.position.y += asse.vy * dt;
        m.rotation.z += asse.giro * dt;
        if (m.position.y <= 0.05) {
          m.position.y = 0.05;
          if (asse.rimbalzi === 0) {
            asse.rimbalzi = 1;
            asse.vy = 1.6;
            this.effetti.sbuffo(m.position.x, 0.1, m.position.z, 0xf4f8ff, 4, 1.2);
          } else {
            asse.stato = 'affonda';
            asse.tempo = 0;
          }
        }
      } else {
        // si posa e sprofonda piano nella neve
        asse.tempo += dt;
        m.position.y = 0.05 - asse.tempo * 0.12;
        if (asse.tempo > 0.7) {
          m.parent?.remove(m);
          this.cadenti.splice(this.cadenti.indexOf(asse), 1);
        }
      }
    }
  }

  // --------------------------------------------------------------------- cartelli e pavimento ---

  // Un cartello "LAVORI IN CORSO" con la barra che si riempie e i secondi che mancano, in (x, z)
  creaSegnale(x, z, scala = 1) {
    const gruppo = new THREE.Group();
    gruppo.position.set(x, 0, z);
    gruppo.scale.setScalar(scala);
    gruppo.userData.scala = scala;
    this.gruppo.add(gruppo);
    this.cartelli.push(gruppo);
    for (const px of [-1.05, 1.05]) this.pezzo(this.scuro, [px, 0.9, 0], [0.12, 1.8, 0.12], [0, 0, 0], gruppo);
    const cartello = creaScritta('LAVORI IN CORSO', { larghezza: 2.3, altezza: 0.5, sfondo: '#f2b632', coloreTesto: '#3a2a05', coloreBordo: 'rgba(255,255,255,0.6)' });
    cartello.position.set(0, 1.62, 0.1);
    cartello.rotation.x = -0.25;
    gruppo.add(cartello);
    const barra = new THREE.Group();
    barra.position.set(0, 1.18, 0.12);
    barra.rotation.x = -0.25;
    const binario = new THREE.Mesh(this.scatola, new THREE.MeshBasicMaterial({ color: 0x1d2128 }));
    binario.scale.set(LARGHEZZA_BARRA + 0.12, 0.26, 0.04);
    const riempimento = new THREE.Mesh(this.scatola, new THREE.MeshBasicMaterial({ color: 0x6fe17d }));
    riempimento.scale.set(0.001, 0.18, 0.05);
    riempimento.position.z = 0.02;
    barra.add(binario, riempimento);
    gruppo.add(barra);
    const conto = creaEtichettaVariabile({ larghezza: 1.1, altezza: 0.4, icona: 'martello', sfondo: 'rgba(40,40,40,0.8)', coloreTesto: '#ffffff', coloreBordo: 'rgba(0,0,0,0.8)' });
    conto.sprite.position.set(0, 0.62, 0.15);
    gruppo.add(conto.sprite);
    this.segnali.push({ riempimento, conto });
    return gruppo;
  }

  // Una struttura di cantiere in un punto (il pavimento): terreno smosso, assi che saltellano, cartello e barra
  creaStruttura(punto) {
    const terra = new THREE.Mesh(new THREE.CircleGeometry(1.2, 28), new THREE.MeshBasicMaterial({ color: 0x6b4a2d, transparent: true, opacity: 0.85, depthWrite: false }));
    terra.rotation.x = -Math.PI / 2;
    terra.position.set(punto.x, 0.03, punto.z);
    this.gruppo.add(terra);
    const gruppo = this.creaSegnale(punto.x, punto.z + 1.2, 1);
    const assi = [
      this.pezzo(this.legno, [-0.45, 0.07, -0.6], [0.9, 0.08, 0.2], [0, 0.25, 0], gruppo),
      this.pezzo(this.legno, [0.4, 0.07, -0.55], [0.8, 0.08, 0.2], [0, -0.3, 0], gruppo),
      this.pezzo(this.legno, [0.0, 0.16, -0.58], [0.7, 0.08, 0.2], [0, 0.05, 0], gruppo),
    ];
    for (const asse of assi) {
      asse.userData.y0 = asse.position.y;
      this.assi.push(asse);
    }
  }

  get finito() {
    return this.rimasto <= 0;
  }

  // Le barre e i secondi che mancano
  aggiornaBarra() {
    const parte = this.progresso;
    const larga = Math.max(0.001, LARGHEZZA_BARRA * parte);
    const secondi = Math.ceil(Math.max(0, this.rimasto));
    const testo = secondi >= 60 ? `${Math.floor(secondi / 60)}:${String(secondi % 60).padStart(2, '0')}` : `${secondi}s`;
    for (const { riempimento, conto } of this.segnali) {
      riempimento.scale.x = larga;
      riempimento.position.x = -LARGHEZZA_BARRA / 2 + larga / 2;
      conto.imposta(testo);
    }
  }

  // Un punto a caso da cui arriva un rumore, e quanto si sente da lì
  rumoreA() {
    const dove = this.suoni[Math.floor(Math.random() * this.suoni.length)];
    return dove ? { dove, volume: this.ascolto(dove.x, dove.z) } : { dove: null, volume: 0 };
  }

  // dt: secondi passati (a gioco aperto)
  aggiorna(dt) {
    const orologio = performance.now() / 1000;
    const shader = materiali?.telo.userData.shader;
    if (shader) shader.uniforms.uTempo.value = orologio; // i teli ondeggiano
    if (this.svelando !== null) {
      this.aggiornaSvelamento(dt);
      return;
    }
    this.passa(dt);
    this.tempo += dt;
    this.comparsa = Math.min(1, this.comparsa + dt * 3);
    const c = this.comparsa;
    const salto = Math.max(0.001, c < 1 ? c + Math.sin(c * Math.PI) * 0.25 : 1);
    if (this.tessere.length > 0) for (const cartello of this.cartelli) cartello.scale.setScalar(cartello.userData.scala * salto); // la struttura cresce a fasi
    else this.gruppo.scale.setScalar(salto);
    if (this.istanze) {
      this.avanzaFasi();
      this.aggiornaIstanze();
    }
    for (const operaio of this.operai) operaio.aggiorna(dt);
    this.aggiornaCadute(dt);
    // le assi saltellano un po', a turno (solo nel cantiere del pavimento)
    this.assi.forEach((asse, i) => {
      const onda = Math.max(0, Math.sin(this.tempo * 7 + i * 2.1));
      asse.position.y = asse.userData.y0 + onda * onda * 0.12;
    });
    this.attesaPolvere -= dt;
    if (this.attesaPolvere <= 0) {
      this.attesaPolvere = 0.6 + Math.random() * 0.5;
      // un po' di polvere in un punto del cantiere (sulle mura: lungo i teli)
      const dove = this.suoni[Math.floor(Math.random() * this.suoni.length)];
      if (dove && this.ascolto(dove.x, dove.z) > 0) this.effetti.sbuffo(dove.x + (Math.random() - 0.5) * 1.2, 0.3, dove.z + (Math.random() - 0.5) * 0.8, 0xd9c8a8, 4, 1.5);
    }
    this.suoniDeiLavori(dt);
  }

  // Un'asse posata ogni tanto, un "ehi!" lontano, una sega mentre si fanno travi e piano e (dove non ci sono operai) qualche colpo
  suoniDeiLavori(dt) {
    this.attesaAsse -= dt;
    if (this.attesaAsse <= 0) {
      this.attesaAsse = 4 + Math.random() * 6;
      const { volume } = this.rumoreA();
      if (volume > 0.02) suoni.suona('asseAppoggiata', { volume });
    }
    this.attesaVoce -= dt;
    if (this.attesaVoce <= 0) {
      this.attesaVoce = 14 + Math.random() * 16;
      const { volume } = this.rumoreA();
      if (volume > 0.02) suoni.suona('voceOperaio', { volume });
    }
    // la sega: ogni tanto, solo nelle fasi in cui si tagliano travi e assi (dal 20% al 60% della barra)
    this.attesaSega -= dt;
    if (this.attesaSega <= 0) {
      this.attesaSega = 9 + Math.random() * 8;
      const p = this.progresso;
      if (this.tessere.length > 0 && p >= FASI.travi[0] && p < FASI.assi[1]) {
        const { volume } = this.rumoreA();
        if (volume > 0.02) suoni.suona('sega', { volume });
      }
    }
    if (this.operai.length === 0) {
      this.attesaMartello -= dt;
      if (this.attesaMartello <= 0) {
        this.attesaMartello = Math.random() < 0.6 ? 0.45 : 1.4 + Math.random() * 1.8; // qualche colpo di fila, poi una pausa
        const { dove, volume } = this.rumoreA();
        if (volume > 0.02) {
          suoni.suona('martello', { volume });
          this.dettagliColpo(dove.x + (Math.random() - 0.5) * 0.8, 0.2, dove.z - 0.5);
        }
      }
    }
  }

  // Passa il tempo senza animazioni (durante una corsa)
  passa(dt) {
    this.rimasto = Math.max(0, this.rimasto - dt);
    this.aggiornaBarra();
  }

  // I lavori sono finiti: gli operai esultano e se ne vanno, il cartello sparisce e i teli si arrotolano uno dopo l'altro, nello
  // stesso ordine con cui compaiono le mura nuove, poi sparisce anche la struttura. Poi il cantiere si può togliere (svelato).
  svela() {
    if (this.svelando !== null) return;
    this.svelando = 0;
    this.comparsa = 1;
    this.gruppo.scale.setScalar(1);
    for (const operaio of this.operai) operaio.finisci();
    let fine = this.operai.length > 0 ? SVELAMENTO.operai : 0;
    // il primo telo comincia ad alzarsi esattamente a "attesa" (è lì che il miglioramento diventa effettivo, vedi attesaEffetto)
    const primo = this.tipo === 'mura' ? Math.min(...this.tessere.map((t) => t.ritardo)) : 0;
    for (const t of this.tessere) {
      // tutto già al suo posto (si stava ancora costruendo? l'ultima parte arriva subito)
      for (const nome of NOMI_PARTI) if (t.parti[nome] === null) t.parti[nome] = this.tempo - DURATA_COMPARSA;
      t.inizioSvela = SVELAMENTO.attesa + (this.tipo === 'mura' ? (t.ritardo - primo) * SVELAMENTO.onda : 0);
      t.partito = false;
      fine = Math.max(fine, t.inizioSvela + 0.25 + SVELAMENTO.telaio);
    }
    for (const catena of this.catene) {
      if (catena.meshScala) catena.meshScala.visible = false;
      if (catena.meshPila) catena.meshPila.visible = false;
    }
    this.durataSvelamento = Math.max(fine, this.tessere.length === 0 ? 0.6 : 0);
  }

  get svelato() {
    return this.svelando !== null && this.svelando >= this.durataSvelamento && this.operai.every((o) => o.finito);
  }

  aggiornaSvelamento(dt) {
    this.svelando += dt;
    this.tempo += dt;
    const t = this.svelando;
    const morbido = (k) => k * k * (3 - 2 * k);
    // il cartello si rimpicciolisce subito
    const k0 = Math.min(1, t / 0.3);
    for (const cartello of this.cartelli) cartello.scale.setScalar(Math.max(0.001, cartello.userData.scala * (1 - morbido(k0))));
    for (const operaio of this.operai) if (!operaio.finito) operaio.aggiorna(dt);
    for (const asse of this.cadenti) asse.mesh.parent?.remove(asse.mesh);
    this.cadenti.length = 0;
    // i teli si arrotolano verso l'alto: ai loro piedi una nuvoletta di neve e due scintille
    let primo = false;
    for (const tessera of this.tessere) {
      if (!tessera.partito && t >= tessera.inizioSvela) {
        tessera.partito = true;
        primo = true;
        if (this.ascolto(tessera.x, tessera.z) > 0) {
          this.effetti.sbuffo(tessera.x, 0.25, tessera.z, 0xece5d2, 4, 1.6);
          this.effetti.scintille(tessera.x, 1.3, tessera.z, 0xfff2c4, 3, 1.1);
        }
      }
    }
    this.aggiornaIstanze();
    if (primo && !this.suonoSvelamento) {
      this.suonoSvelamento = true;
      const { volume } = this.rumoreA();
      if (volume > 0.02) suoni.suona('comparsa', { volume: Math.min(1, volume * 1.2) });
    }
    // il pavimento (e simili): la struttura si rimpicciolisce in una nuvola di polvere
    if (this.tessere.length === 0) {
      const k = Math.min(1, t / 0.6);
      this.gruppo.scale.setScalar(Math.max(0.001, 1 - morbido(k)));
      if (!this.suonoSvelamento) {
        this.suonoSvelamento = true;
        for (const punto of this.punti) this.effetti.sbuffo(punto.x, 0.5, punto.z, 0xd9c8a8, 20, 3);
      }
    }
  }

  // Toglie il cantiere dalla scena
  distruggi() {
    for (const operaio of this.operai) operaio.togli();
    this.gruppo.parent?.remove(this.gruppo);
    this.gruppo.traverse((oggetto) => {
      if (oggetto.isSprite) {
        oggetto.material.map.dispose();
        oggetto.material.dispose();
      } else if (oggetto.isMesh && oggetto.material.map && !oggetto.material.userData.condiviso) {
        oggetto.material.map.dispose();
        oggetto.material.dispose();
        oggetto.geometry.dispose();
      }
    });
    if (this.istanze) for (const mesh of Object.values(this.istanze)) mesh.dispose();
    for (const forma of this.geometrie) forma.dispose();
  }
}
