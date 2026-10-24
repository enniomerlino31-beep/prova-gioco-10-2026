// =====================================================================
//  TORRETTE CON L'ARCIERE (si comprano con il cerchio "Torretta")
//  Ogni torretta sta a cavallo della palizzata. Sopra c'è un arciere con
//  il berretto viola che si gira verso il lupo più vicino e, se è
//  abbastanza vicino, gli tira una freccia da solo. La freccia vola ad
//  arco, insegue il lupo e quando lo colpisce gli toglie delle tacche di
//  vita (1 all'inizio: servono 3 frecce, come con l'ascia). Se il lupo
//  muore prima, la freccia si pianta nella neve.
//  Livelli: 1 = torretta a sinistra, 2 = anche a destra,
//  3 e 4 = "Potenzia arcieri": frecce più forti e più rapide, e torri,
//  archi e frecce più robusti (vedi modelli/torretta.js).
// =====================================================================

import * as THREE from 'three';
import { CONFIG } from '../config.js';
import { creaLavoratore } from '../modelli/boscaiolo.js';
import { tinta } from '../modelli/materiali.js';
import {
  creaTorretta, creaArco, creaFreccia, ALTEZZA_PIATTAFORMA, COLORI_BANDIERA, COLORI_ARCO,
} from '../modelli/torretta.js';

const SCALA_ARCIERE = 1.3;
const ALTEZZA_TIRO = ALTEZZA_PIATTAFORMA + 1.0; // da qui parte la freccia (le mani dell'arciere)
const TEMPO_PIANTATA = 1.2;                     // secondi che una freccia resta piantata nella neve

// "easeOutBack": da 0 a 1 superando un po' la misura e poi tornando (per far "spuntare" le cose)
function spunta(k) {
  if (k >= 1) return 1;
  return 1 + 2.2 * Math.pow(k - 1, 3) + 1.2 * Math.pow(k - 1, 2);
}

export class Torrette {
  // posizioni: dove stanno le torri (MAPPA.torri)
  constructor(genitore, effetti, posizioni) {
    this.genitore = genitore;
    this.effetti = effetti;
    this.livello = null; // il livello comprato (da CONFIG.miglioramenti.torretta), null = nessuna torretta
    this.frecce = [];
    this.torri = posizioni.map((posizione, i) => {
      const gruppo = creaTorretta();
      gruppo.position.copy(posizione);
      gruppo.visible = false;
      genitore.add(gruppo);
      const arciere = creaLavoratore({ berretto: 0x7b3fb5, berrettoScuro: 0x5a2b88, giacca: 0x3c6e47, senzaAscia: true });
      arciere.scale.setScalar(SCALA_ARCIERE);
      arciere.position.y = ALTEZZA_PIATTAFORMA;
      arciere.rotation.y = posizione.x < 0 ? Math.PI / 2 : -Math.PI / 2; // all'inizio guarda fuori dalle mura
      const perni = arciere.userData.perni;
      // l'arco nella mano sinistra: il gruppo compensa il braccio teso in avanti, così l'arco resta dritto
      const presa = new THREE.Group();
      presa.position.set(0, -0.3, 0);
      presa.rotation.x = -1.45;
      const arco = creaArco();
      presa.add(arco);
      perni.braccioSx.add(presa);
      gruppo.add(arciere);
      return {
        gruppo, arciere, perni, arco: arco.userData.legno, posizione: posizione.clone(),
        ricarica: i * 0.6, tiro: 0, comparsa: 1,
        aspetto: 0,       // come è fatta adesso (può restare indietro di un attimo, finché la telecamera non arriva)
        potenziamento: 1, // animazione delle parti nuove (da 0 a 1)
      };
    });
  }

  // Il livello comprato: forza delle frecce, ricarica e gittata (per tutte le torri)
  imposta(comprati) {
    this.livello = CONFIG.miglioramenti.torretta[comprati - 1] ?? null;
  }

  // Quante torri ci sono con il livello comprato
  get quanteTorri() {
    return this.livello?.torri ?? 0;
  }

  // La torre numero i compare (conAnimazione: spunta dal basso con uno sbuffo di trucioli)
  mostraTorre(i, conAnimazione) {
    const torre = this.torri[i];
    if (torre.gruppo.visible) return;
    torre.gruppo.visible = true;
    torre.comparsa = conAnimazione ? 0 : 1;
    if (conAnimazione) this.effetti.sbuffo(torre.posizione.x, 0.3, torre.posizione.z, 0xb07a45, 18, 3);
  }

  // La torre numero i prende l'aspetto del livello comprato (pietra, poi metallo; bandiera e arco cambiano colore)
  aggiornaAspetto(i, conAnimazione) {
    const torre = this.torri[i];
    const aspetto = this.livello?.aspetto ?? 0;
    if (aspetto === torre.aspetto) return;
    torre.aspetto = aspetto;
    const { pietra, metallo, bandiera } = torre.gruppo.userData;
    pietra.visible = aspetto >= 1;
    metallo.visible = aspetto >= 2;
    bandiera.material = tinta(COLORI_BANDIERA[aspetto]);
    torre.arco.material = tinta(COLORI_ARCO[aspetto]);
    torre.potenziamento = conAnimazione ? 0 : 1;
    if (conAnimazione) {
      const { x, z } = torre.posizione;
      this.effetti.sbuffo(x, 0.4, z, aspetto >= 2 ? 0x8b939e : 0x9aa2ad, 20, 3.5);
      if (aspetto >= 2) this.effetti.sbuffo(x, ALTEZZA_PIATTAFORMA + 1.2, z, 0xffd23f, 14, 2.5);
    }
    this.animaParti(torre);
  }

  // Le parti nuove (la pietra o il metallo) spuntano dal nulla, una dopo l'altra
  animaParti(torre) {
    const gruppo = torre.aspetto >= 2 ? torre.gruppo.userData.metallo : torre.gruppo.userData.pietra;
    const n = gruppo.children.length;
    gruppo.children.forEach((parte, k) => {
      const f = spunta(THREE.MathUtils.clamp(torre.potenziamento * 1.6 - (k / n) * 0.6, 0, 1));
      parte.scale.copy(parte.userData.scala).multiplyScalar(Math.max(0.0001, f));
    });
  }

  torriAttive() {
    return this.torri.filter((torre) => torre.gruppo.visible);
  }

  // lupi: tutti i lupi della base; colpisci(lupo, danno) toglie "danno" tacche di vita al lupo
  aggiorna(dt, lupi, colpisci) {
    for (const torre of this.torriAttive()) {
      // spunta dal basso con un piccolo rimbalzo
      torre.comparsa = Math.min(1, torre.comparsa + dt * 1.8);
      const c = torre.comparsa;
      // quando arriva un potenziamento la torre fa un saltello e le parti nuove spuntano
      if (torre.potenziamento < 1) {
        torre.potenziamento = Math.min(1, torre.potenziamento + dt * 1.1);
        this.animaParti(torre);
      }
      const saltello = torre.potenziamento < 1 ? Math.sin(torre.potenziamento * Math.PI * 2) * (1 - torre.potenziamento) * 0.12 : 0;
      torre.gruppo.scale.set(1 + saltello * 0.5, Math.max(0.001, spunta(c)) * (1 - saltello * 0.3), 1 + saltello * 0.5);

      torre.ricarica -= dt;
      torre.tiro = Math.max(0, torre.tiro - dt * 2.5);
      const bersaglio = this.lupoPiuVicino(torre, lupi);
      if (bersaglio) {
        torre.arciere.rotation.y = Math.atan2(-(bersaglio.x - torre.posizione.x), -(bersaglio.z - torre.posizione.z));
        if (torre.ricarica <= 0 && c >= 1) {
          this.tira(torre, bersaglio);
          torre.ricarica = this.livello.ricarica;
          torre.tiro = 1;
        }
      }
      // braccio sinistro teso con l'arco; il destro tira la corda e la lascia andare quando tira
      const p = torre.perni;
      p.braccioSx.rotation.x = 1.45;
      p.braccioDx.rotation.x = 1.3 + Math.sin(torre.tiro * Math.PI) * 0.35;
      p.braccioDx.rotation.z = -0.25 - torre.tiro * 0.35;
    }
    this.aggiornaFrecce(dt, colpisci);
  }

  lupoPiuVicino(torre, lupi) {
    let migliore = null;
    let distanzaMinima = this.livello.gittata;
    for (const lupo of lupi) {
      if (!lupo.vivo) continue;
      const d = Math.hypot(lupo.x - torre.posizione.x, lupo.z - torre.posizione.z);
      if (d < distanzaMinima) {
        distanzaMinima = d;
        migliore = lupo;
      }
    }
    return migliore;
  }

  tira(torre, lupo) {
    const mesh = creaFreccia(torre.aspetto);
    const da = new THREE.Vector3(torre.posizione.x, ALTEZZA_TIRO, torre.posizione.z);
    const arrivo = new THREE.Vector3(lupo.x, 0.6, lupo.z);
    mesh.position.copy(da);
    this.genitore.add(mesh);
    const distanza = da.distanceTo(arrivo);
    this.frecce.push({
      mesh, da, arrivo, lupo, generazione: lupo.generazione, danno: this.livello.danno, luminosa: torre.aspetto >= 2,
      tempo: 0, durata: distanza / CONFIG.lavoratori.velocitaFreccia, arco: distanza * 0.12, piantata: -1,
    });
  }

  // Dove si trova la freccia al momento k (da 0 a 1): una linea dritta con un piccolo arco verso l'alto
  puntoDelVolo(freccia, k, risultato) {
    risultato.lerpVectors(freccia.da, freccia.arrivo, k);
    risultato.y += Math.sin(k * Math.PI) * freccia.arco;
    return risultato;
  }

  aggiornaFrecce(dt, colpisci) {
    const davanti = new THREE.Vector3();
    for (const freccia of this.frecce) {
      if (freccia.piantata >= 0) {
        freccia.piantata += dt;
        if (freccia.piantata > TEMPO_PIANTATA) freccia.finita = true;
        continue;
      }
      // finché il lupo è vivo la freccia lo insegue (generazione: lo stesso lupo, non uno nuovo comparso al suo posto)
      const lupo = freccia.lupo;
      const segue = lupo.vivo && lupo.generazione === freccia.generazione;
      if (segue) freccia.arrivo.set(lupo.x, 0.6, lupo.z);
      freccia.tempo += dt;
      const k = Math.min(1, freccia.tempo / freccia.durata);
      this.puntoDelVolo(freccia, k, freccia.mesh.position);
      if (k < 1) {
        freccia.mesh.lookAt(this.puntoDelVolo(freccia, Math.min(1, k + 0.05), davanti));
        continue;
      }
      if (segue) {
        freccia.finita = true;
        this.effetti.sbuffo(freccia.arrivo.x, 0.7, freccia.arrivo.z, freccia.luminosa ? 0xffd23f : 0xf4f8ff, 6, 2);
        colpisci(lupo, freccia.danno);
      } else {
        freccia.piantata = 0; // il lupo non c'è più: la freccia resta nella neve
        freccia.mesh.position.y = 0.3;
      }
    }
    for (const freccia of this.frecce.filter((f) => f.finita)) this.genitore.remove(freccia.mesh);
    this.frecce = this.frecce.filter((f) => !f.finita);
  }
}
