// =====================================================================
//  TORRETTE CON L'ARCIERE (si comprano dalla fila DIFESA)
//  Ogni torretta sta a cavallo della palizzata. Sopra c'è un arciere che
//  si gira verso il lupo più vicino del SUO lato e, se è a portata, gli
//  tira una freccia da solo. La freccia vola ad arco, insegue il lupo e
//  quando lo colpisce gli toglie delle tacche di vita. Se il lupo muore
//  prima, la freccia si pianta nella neve.
//  Portata: ogni arciere difende solo il lato della sua torre (le torri di
//  sinistra solo il lato sinistro, quelle di destra solo il destro), ma
//  tutto il lato: da un angolo all'altro, cancello compreso, dentro e fuori
//  dalle mura, fino a "gittata" metri dalla linea delle mura. Non arriva
//  mai all'altra metà della base.
//  Livelli: 1-4 = le quattro torri (sinistra 1, destra 1, sinistra 2,
//  destra 2), 5 e 6 = "Potenzia arcieri": frecce più forti e più rapide.
//  Aspetto (vedi modelli/torretta.js), due cose indipendenti:
//   - la parte bassa segue il materiale delle mura: quando si migliorano le
//     mura, ogni torre cambia quando l'onda del miglioramento le passa sotto
//   - la parte alta, l'arco e l'armatura dell'arciere (stoffa, cuoio,
//     metallo) seguono i potenziamenti degli arcieri
// =====================================================================

import * as THREE from 'three';
import { CONFIG } from '../config.js';
import { creaLavoratore } from '../modelli/boscaiolo.js';
import { tinta } from '../modelli/materiali.js';
import {
  creaTorretta, creaArco, creaFreccia, ALTEZZA_PIATTAFORMA, COLORI_BANDIERA,
} from '../modelli/torretta.js';
import { MAPPA } from './ambiente.js';

const SCALA_ARCIERE = 1.3;
const ALTEZZA_TIRO = ALTEZZA_PIATTAFORMA + 1.0; // da qui parte la freccia (le mani dell'arciere)
const TEMPO_PIANTATA = 1.2;                     // secondi che una freccia resta piantata nella neve
const OLTRE_GLI_ANGOLI = 3;                     // metri oltre gli angoli del lato (per i lupi che girano attorno all'angolo)
const ARMATURE = [null, 'cuoio', 'metallo'];    // l'armatura dell'arciere per ogni potenziamento

// "easeOutBack": da 0 a 1 superando un po' la misura e poi tornando (per far "spuntare" le cose)
function spunta(k) {
  if (k >= 1) return 1;
  return 1 + 2.2 * Math.pow(k - 1, 3) + 1.2 * Math.pow(k - 1, 2);
}

export class Torrette {
  // posizioni: dove stanno le torri (MAPPA.torri); mura: per sapere di che materiale sono e quando passa l'onda
  constructor(genitore, effetti, posizioni, mura) {
    this.genitore = genitore;
    this.effetti = effetti;
    this.mura = mura;
    this.livello = null; // il livello comprato (da CONFIG.miglioramenti.torretta), null = nessuna torretta
    this.frecce = [];
    this.torri = posizioni.map((posizione, i) => {
      const fuori = Math.sign(posizione.x); // -1 = torre sulle mura di sinistra, 1 = di destra
      const gruppo = creaTorretta(fuori);
      gruppo.position.copy(posizione);
      gruppo.visible = false;
      genitore.add(gruppo);
      const torre = {
        gruppo, posizione: posizione.clone(), fuori,
        ricarica: i * 0.6, tiro: 0, comparsa: 1,
        materiale: 0,   // il materiale delle mura che la torre mostra adesso (0 legno, 1 pietra, 2 metallo)
        arcieri: 0,     // il potenziamento degli arcieri che la torre mostra adesso (0, 1, 2)
        parti: [],      // parti nuove che stanno spuntando: { gruppo, k } (k da 0 a 1)
        nuovoArciere: 1, // l'arciere con la nuova armatura che spunta (da 0 a 1)
      };
      this.vestiArciere(torre);
      torre.arciere.rotation.y = fuori < 0 ? Math.PI / 2 : -Math.PI / 2; // all'inizio guarda fuori dalle mura
      return torre;
    });
  }

  // Mette sulla torre l'arciere con l'armatura e l'arco del suo potenziamento (al posto di quello di prima)
  vestiArciere(torre) {
    const prima = torre.arciere;
    if (prima) torre.gruppo.remove(prima);
    const arciere = creaLavoratore({
      berretto: 0x7b3fb5, berrettoScuro: 0x5a2b88, giacca: 0x3c6e47, senzaAscia: true, armatura: ARMATURE[torre.arcieri],
    });
    arciere.scale.setScalar(SCALA_ARCIERE);
    arciere.position.y = ALTEZZA_PIATTAFORMA;
    if (prima) arciere.rotation.y = prima.rotation.y;
    // l'arco nella mano sinistra: il gruppo compensa il braccio teso in avanti, così l'arco resta dritto
    const presa = new THREE.Group();
    presa.position.set(0, -0.3, 0);
    presa.rotation.x = -1.45;
    presa.add(creaArco(torre.arcieri));
    arciere.userData.perni.braccioSx.add(presa);
    torre.gruppo.add(arciere);
    torre.arciere = arciere;
    torre.perni = arciere.userData.perni;
  }

  // Il livello comprato: forza delle frecce, ricarica e gittata (per tutte le torri)
  imposta(comprati) {
    this.livello = CONFIG.miglioramenti.torretta[comprati - 1] ?? null;
  }

  // Quante torri ci sono con il livello comprato
  get quanteTorri() {
    return this.livello?.torri ?? 0;
  }

  // La torre numero i compare (conAnimazione: spunta dal basso con uno sbuffo di trucioli),
  // già del materiale delle mura di adesso e con gli arcieri del potenziamento comprato
  mostraTorre(i, conAnimazione) {
    const torre = this.torri[i];
    if (torre.gruppo.visible) return;
    torre.gruppo.visible = true;
    torre.comparsa = conAnimazione ? 0 : 1;
    this.cambiaMateriale(torre, this.mura.livello, false);
    this.aggiornaAspetto(i, false);
    if (conAnimazione) this.effetti.sbuffo(torre.posizione.x, 0.3, torre.posizione.z, 0xb07a45, 18, 3);
  }

  // Le parti nuove di un gruppo (es. la pietra) spuntano dal nulla, una dopo l'altra
  animaParti(gruppo, k) {
    const n = gruppo.children.length;
    gruppo.children.forEach((parte, j) => {
      const f = spunta(THREE.MathUtils.clamp(k * 1.6 - (j / n) * 0.6, 0, 1));
      parte.scale.copy(parte.userData.scala).multiplyScalar(Math.max(0.0001, f));
    });
  }

  // Mostra (e fa spuntare, se conAnimazione) i gruppi di parti fino al livello indicato
  mostraParti(torre, gruppi, livello, conAnimazione) {
    gruppi.forEach((gruppo, l) => {
      if (!gruppo) return;
      const era = gruppo.visible;
      gruppo.visible = l <= livello;
      if (gruppo.visible && !era && conAnimazione) {
        this.animaParti(gruppo, 0);
        torre.parti.push({ gruppo, k: 0 });
      } else if (gruppo.visible) this.animaParti(gruppo, 1);
    });
  }

  // La parte bassa della torre prende il materiale delle mura (0 legno, 1 pietra, 2 metallo)
  cambiaMateriale(torre, livello, conAnimazione) {
    if (livello === torre.materiale) return;
    torre.materiale = livello;
    this.mostraParti(torre, torre.gruppo.userData.materiali, livello, conAnimazione);
    if (conAnimazione) {
      const { x, z } = torre.posizione;
      this.effetti.sbuffo(x, 0.4, z, livello >= 2 ? 0x8b939e : 0x9aa2ad, 20, 3.5);
      if (livello >= 2) this.effetti.scintille(x, 1.4, z, 0xfff3b0, 8, 2);
    }
  }

  // La torre numero i prende l'aspetto del potenziamento degli arcieri comprato:
  // parte alta, bandiera, arco e armatura dell'arciere
  aggiornaAspetto(i, conAnimazione) {
    const torre = this.torri[i];
    const aspetto = this.livello?.aspetto ?? 0;
    if (aspetto === torre.arcieri) return;
    torre.arcieri = aspetto;
    const { arcieri, bandiera } = torre.gruppo.userData;
    this.mostraParti(torre, arcieri, aspetto, conAnimazione);
    bandiera.material = tinta(COLORI_BANDIERA[aspetto]);
    this.vestiArciere(torre);
    torre.nuovoArciere = conAnimazione ? 0 : 1;
    if (conAnimazione) {
      const { x, z } = torre.posizione;
      this.effetti.sbuffo(x, ALTEZZA_PIATTAFORMA + 0.8, z, aspetto >= 2 ? 0xffd23f : 0x9fc8ff, 18, 3);
      if (aspetto >= 2) this.effetti.scintille(x, ALTEZZA_PIATTAFORMA + 1.4, z, 0xffe066, 12, 2.5);
    }
  }

  torriAttive() {
    return this.torri.filter((torre) => torre.gruppo.visible);
  }

  // lupi: tutti i lupi della base; colpisci(lupo, danno) toglie "danno" tacche di vita al lupo
  aggiorna(dt, lupi, colpisci) {
    for (const torre of this.torriAttive()) {
      // le mura sono cambiate: la torre cambia quando l'onda del miglioramento le passa sotto
      if (torre.materiale !== this.mura.livello && this.mura.ondaArrivata(torre.posizione.x, torre.posizione.z)) {
        this.cambiaMateriale(torre, this.mura.livello, this.mura.onda !== null);
      }
      // spunta dal basso con un piccolo rimbalzo
      torre.comparsa = Math.min(1, torre.comparsa + dt * 1.8);
      const c = torre.comparsa;
      // quando cambia qualcosa la torre fa un saltello e le parti nuove spuntano
      let cambio = 1;
      for (const parte of torre.parti) {
        parte.k = Math.min(1, parte.k + dt * 1.1);
        this.animaParti(parte.gruppo, parte.k);
        cambio = Math.min(cambio, parte.k);
      }
      torre.parti = torre.parti.filter((parte) => parte.k < 1);
      if (torre.nuovoArciere < 1) {
        torre.nuovoArciere = Math.min(1, torre.nuovoArciere + dt * 2);
        cambio = Math.min(cambio, torre.nuovoArciere);
      }
      torre.arciere.scale.setScalar(SCALA_ARCIERE * Math.max(0.001, spunta(torre.nuovoArciere)));
      const saltello = cambio < 1 ? Math.sin(cambio * Math.PI * 2) * (1 - cambio) * 0.12 : 0;
      torre.gruppo.scale.set(1 + saltello * 0.5, Math.max(0.001, spunta(c)) * (1 - saltello * 0.3), 1 + saltello * 0.5);

      torre.ricarica -= dt;
      torre.tiro = Math.max(0, torre.tiro - dt * 2.5);
      const bersaglio = this.lupoDaColpire(torre, lupi);
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

  // Il lupo più vicino tra quelli che questa torre difende: solo dal suo lato delle mura (sinistro o destro),
  // da un angolo all'altro (un po' oltre, per i lupi che girano l'angolo), al massimo "gittata" metri
  // dalla linea delle mura, dentro o fuori
  lupoDaColpire(torre, lupi) {
    const M = MAPPA.mura;
    const gittata = this.livello.gittata;
    let migliore = null;
    let distanzaMinima = Infinity;
    for (const lupo of lupi) {
      if (!lupo.vivo || Math.sign(lupo.x) !== torre.fuori) continue;
      if (Math.abs(lupo.x - torre.posizione.x) > gittata) continue;
      if (lupo.z < M.fondo - OLTRE_GLI_ANGOLI || lupo.z > M.fronte + OLTRE_GLI_ANGOLI) continue;
      const d = Math.hypot(lupo.x - torre.posizione.x, lupo.z - torre.posizione.z);
      if (d < distanzaMinima) {
        distanzaMinima = d;
        migliore = lupo;
      }
    }
    return migliore;
  }

  tira(torre, lupo) {
    const mesh = creaFreccia(torre.arcieri);
    const da = new THREE.Vector3(torre.posizione.x, ALTEZZA_TIRO, torre.posizione.z);
    const arrivo = new THREE.Vector3(lupo.x, 0.6, lupo.z);
    mesh.position.copy(da);
    this.genitore.add(mesh);
    const distanza = da.distanceTo(arrivo);
    this.frecce.push({
      mesh, da, arrivo, lupo, generazione: lupo.generazione, danno: this.livello.danno, luminosa: torre.arcieri >= 2,
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
