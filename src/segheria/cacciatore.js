// =====================================================================
//  CACCIATORE (si compra con il cerchio "Cacciatore")
//  Un boscaiolo con il berretto verde e la giacca di pelle marrone.
//  Aspetta al suo banco da lavoro, al centro della base, sistemando gli
//  attrezzi (vedi banco.js). Appena c'è
//  un lupo (o della carne a terra) esce dal cancello di destra, gira attorno alle
//  mura senza attraversarle, combatte il lupo con l'ascia e raccoglie la
//  carne che lascia. Quando fuori non c'è più niente (o ha già sulla
//  schiena il massimo, "caricoMassimo" unità), rientra dal cancello e porta
//  la carne direttamente al deposito dello sportello CARNE, poi torna al banco
//  (o esce di nuovo). Il banco è nella colonna di destra, tra il cancello di
//  destra e lo sportello CARNE: tutti i giri sono in linea dritta.
// =====================================================================

import * as THREE from 'three';
import { CONFIG } from '../config.js';
import { creaLavoratore } from '../modelli/boscaiolo.js';
import { animaPersona, animaColpo, COLPO } from '../modelli/animazioni.js';
import { creaCarne } from '../modelli/carne.js';
import { MAPPA } from './ambiente.js';

const VOLO = { durata: 0.45, altezza: 1.4, scala: 0.55, sbuffo: false };
const MARGINE_GIRO = 1.3;   // a che distanza dalle mura gira attorno agli angoli (metri)
const MARGINE_MURA = 0.6;   // più vicino di così alle mura non va (come i lupi)
const PEZZI_SCHIENA = 3;    // pezzi di carne disegnati al massimo sulla schiena

// I punti fissi del suo giro: il suo posto (davanti al banco) e i due lati del cancello di destra
const cancello = MAPPA.cancelli.destra;
const PUNTI = {
  casa: MAPPA.casaCacciatore,
  dentro: new THREE.Vector3(cancello.x - 1.6, 0, cancello.z),
  fuori: new THREE.Vector3(cancello.x + 1.6, 0, cancello.z),
};

export class Cacciatore {
  // base: la segheria (lupi, carne a terra, sportello CARNE, cancello, effetti); livello: da CONFIG.miglioramenti.cacciatore
  constructor(base, livello) {
    this.base = base;
    this.livello = livello;
    this.carico = 0;        // unità di carne sulla schiena
    this.stato = 'casa';    // 'casa', 'esce', 'fuori', 'rientra', 'entra', 'attesa' (carne in volo), 'torna'
    this.percorso = [];     // punti da raggiungere uno dopo l'altro (per passare dal cancello)
    this.ricarica = 0;
    this.colpo = null;      // a che punto è il colpo d'ascia (da 0 a 1); null = non sta colpendo
    this.bersaglio = null;  // il lupo che riceverà il colpo quando la lama cala
    this.comparsa = 0;
    this.posizione = PUNTI.casa.clone();
    // dal cancello allo sportello CARNE: dritto fino accanto al cerchio del deposito
    const zona = base.sportelli.carne.zona;
    this.postoSportello = new THREE.Vector3(zona.x - 0.9, 0, zona.z);

    this.modello = creaLavoratore({ berretto: 0x3d7a34, berrettoScuro: 0x2b5a25, giacca: 0x8a6239 });
    this.modello.scale.setScalar(0.001);
    this.modello.position.copy(this.posizione);
    this.modello.rotation.y = -Math.PI / 2; // guarda il cancello
    base.radice.add(this.modello);

    // la carne sulla schiena (si vede solo quando ne porta)
    this.schiena = new THREE.Group();
    this.schiena.position.set(0, 0.55, 0.24);
    this.pezzi = [];
    for (let i = 0; i < PEZZI_SCHIENA; i++) {
      const pezzo = creaCarne();
      pezzo.scale.setScalar(0.75);
      pezzo.position.y = 0.08 + i * 0.2;
      pezzo.visible = false;
      this.schiena.add(pezzo);
      this.pezzi.push(pezzo);
    }
    this.modello.userData.molla.add(this.schiena); // sulla "molla", così rimbalza con lui
  }

  aggiorna(dt) {
    // compare con un piccolo salto
    this.comparsa = Math.min(1, this.comparsa + dt * 2);
    const c = this.comparsa;
    this.modello.scale.setScalar(Math.max(0.001, CONFIG.segheria.dimensioneBoscaiolo * 0.9 * (c < 1 ? c + Math.sin(c * Math.PI) * 0.35 : 1)));
    this.ricarica = Math.max(0, this.ricarica - dt);

    const lupi = this.base.lupiBase.filter((lupo) => lupo.vivo);
    const massimo = CONFIG.lavoratori.caricoMassimo;
    // la carne a terra che ci sta ancora sulla schiena
    const carne = this.base.carneCadute.filter((pezzo) => !pezzo.preso && this.carico + pezzo.quantita <= massimo);
    const fuoriCeQualcosa = lupi.length > 0 || carne.length > 0;
    const pieno = this.carico >= massimo;

    if (this.stato === 'casa' || this.stato === 'torna') {
      if (fuoriCeQualcosa) {
        // esce subito: va dritto al cancello
        this.stato = 'esce';
        this.percorso = [PUNTI.dentro, PUNTI.fuori];
      } else if (this.stato === 'torna') {
        if (this.seguiPercorso(dt)) this.stato = 'casa';
      } else {
        this.lavoraAlBanco(dt);
      }
    } else if (this.stato === 'esce' || this.stato === 'entra') {
      if (this.seguiPercorso(dt)) {
        if (this.stato === 'esce') this.stato = 'fuori';
        else if (this.carico > 0) this.scarica();
        else this.torna([PUNTI.casa]);
      }
    } else if (this.stato === 'fuori') {
      if (pieno) this.stato = 'rientra'; // schiena piena: prima porta la carne allo sportello
      else this.caccia(lupi, carne, dt);
    } else if (this.stato === 'rientra') {
      if (fuoriCeQualcosa && !pieno) this.stato = 'fuori';
      else if (this.vaiFuori(PUNTI.fuori, dt)) {
        this.stato = 'entra';
        this.percorso = this.carico > 0 ? [PUNTI.dentro, this.postoSportello] : [PUNTI.dentro];
      }
    } else {
      this.fermo(dt); // 'attesa': la carne sta volando verso lo sportello
    }
    this.aggiornaColpo(dt);
  }

  // Fuori dalle mura: prima i lupi (il più vicino), poi la carne rimasta a terra; se non c'è niente rientra
  caccia(lupi, carne, dt) {
    const piuVicino = (lista) => lista.reduce((a, b) => (this.distanza(b) < this.distanza(a) ? b : a));
    if (lupi.length > 0) {
      const lupo = piuVicino(lupi);
      if (this.distanza(lupo) > CONFIG.lavoratori.raggioColpoCacciatore + lupo.ingombro) {
        this.vaiFuori(new THREE.Vector3(lupo.x, 0, lupo.z), dt);
        return;
      }
      this.fermo(dt);
      this.guarda(lupo);
      if (this.ricarica <= 0) {
        this.colpo = 0;
        this.ricarica = this.livello.ricarica;
        this.bersaglio = { lupo, generazione: lupo.generazione };
      }
    } else if (carne.length > 0) {
      const pezzo = piuVicino(carne);
      if (this.vaiFuori(new THREE.Vector3(pezzo.x, 0, pezzo.z), dt) || this.distanza(pezzo) < 0.8) this.prendi(pezzo);
    } else {
      this.stato = 'rientra';
    }
  }

  // Raccoglie un pezzo di carne lasciato da un lupo
  prendi(pezzo) {
    pezzo.preso = true;
    this.base.radice.remove(pezzo.mesh);
    const quantita = pezzo.quantita;
    this.carico += quantita;
    this.aggiornaSchiena();
    this.base.effetti.testo(pezzo.x, 1.8, pezzo.z, `+${quantita} carne`, 'buono');
  }

  // Arrivato accanto al deposito dello sportello CARNE: la carne vola dalla schiena al tavolo
  scarica() {
    const quantita = this.carico;
    const { effetti, inVolo } = this.base;
    const sportello = this.base.sportelli.carne;
    this.carico = 0;
    this.stato = 'attesa';
    this.modello.updateMatrixWorld();
    const partenza = this.schiena.localToWorld(new THREE.Vector3(0, 0.4, 0));
    this.aggiornaSchiena();
    inVolo.carne += quantita;
    effetti.lancia('carne', partenza, sportello, 0, () => {
      inVolo.carne -= quantita;
      sportello.aggiungi(quantita);
      this.torna([PUNTI.casa]); // dallo sportello sale dritto fino al banco
    }, VOLO);
    effetti.testo(sportello.zona.x, 2.2, sportello.zona.z, `+${quantita} carne`, 'buono');
  }

  // Torna al suo posto seguendo questi punti
  torna(percorso) {
    this.stato = 'torna';
    this.percorso = [...percorso];
  }

  aggiornaSchiena() {
    const visibili = Math.min(PEZZI_SCHIENA, Math.ceil(this.carico / CONFIG.segheria.unitaPerPezzo));
    this.pezzi.forEach((pezzo, i) => (pezzo.visible = i < visibili));
  }

  // Segue i punti del percorso; al cancello aspetta che le ante siano aperte. True quando ha finito.
  seguiPercorso(dt) {
    const prossimo = this.percorso[0];
    if (!prossimo) return true;
    const attraversaCancello = (this.posizione.x - cancello.x) * (prossimo.x - cancello.x) < 0;
    if (attraversaCancello && !this.base.cancelli.destra.aperto) {
      this.fermo(dt);
      return false;
    }
    if (this.cammina(prossimo, dt)) this.percorso.shift();
    return this.percorso.length === 0;
  }

  // Cammina fuori dalle mura verso un punto, girando attorno agli angoli se le mura sono in mezzo. True quando è arrivato.
  vaiFuori(obiettivo, dt) {
    const tappa = prossimaTappa(this.posizione, obiettivo);
    const arrivato = this.cammina(tappa, dt) && tappa === obiettivo;
    const fuori = this.base.fuoriDalleMura(this.posizione.x, this.posizione.z, MARGINE_MURA);
    this.posizione.set(fuori.x, 0, fuori.z);
    this.modello.position.x = fuori.x;
    this.modello.position.z = fuori.z;
    return arrivato;
  }

  distanza(cosa) {
    return Math.hypot(cosa.x - this.posizione.x, cosa.z - this.posizione.z);
  }

  guarda(cosa) {
    this.modello.rotation.y = Math.atan2(-(cosa.x - this.posizione.x), -(cosa.z - this.posizione.z));
  }

  fermo(dt) {
    this.cammina(this.posizione, dt);
  }

  // Al banco: chino sul tavolo, sistema gli attrezzi con piccoli gesti delle mani
  // e ogni tanto si gira un po' a guardare un altro attrezzo
  lavoraAlBanco(dt) {
    this.fermo(dt);
    this.tempoBanco = (this.tempoBanco ?? 0) + dt;
    const t = this.tempoBanco;
    const { perni, molla } = this.modello.userData;
    perni.braccioDx.rotation.x = 1.0 + Math.sin(t * 3.1) * 0.25;
    perni.braccioSx.rotation.x = 0.85 + Math.sin(t * 2.3 + 1) * 0.2;
    molla.rotation.x = -0.14;
    this.modello.rotation.y = Math.sin(t * 0.6) * 0.3; // 0 = guarda il banco (verso il fondo della base)
  }

  // Cammina verso un punto: restituisce true quando è arrivato
  cammina(obiettivo, dt) {
    const verso = obiettivo.clone().sub(this.posizione).setY(0);
    const distanza = verso.length();
    const passo = this.livello.velocita * dt;
    const arrivato = distanza <= passo;
    if (arrivato) this.posizione.copy(obiettivo);
    else {
      this.posizione.addScaledVector(verso, passo / distanza);
      this.modello.rotation.y = Math.atan2(-verso.x, -verso.z);
    }
    // passo con rimbalzo (vedi animazioni.js); a ogni passo un po' di neve
    if (animaPersona(this.modello, dt, arrivato ? 0 : 1, { carica: this.carico > 0 ? 0.5 : 0 })) {
      this.base.effetti.passo(this.modello, { grandezza: 1.2 });
    }
    this.modello.position.set(this.posizione.x, 0, this.posizione.z);
    return arrivato;
  }

  // Il colpo d'ascia, come quello del boscaiolo: carica, cala, e il lupo viene colpito
  // quando la lama arriva giù (se nel frattempo non è già morto). Il cacciatore esperto colpisce più svelto.
  aggiornaColpo(dt) {
    if (this.colpo === null) return;
    const prima = this.colpo;
    this.colpo += dt / Math.min(COLPO.durata, this.livello.ricarica * 0.8);
    if (prima < COLPO.impatto && this.colpo >= COLPO.impatto && this.bersaglio) {
      const { lupo, generazione } = this.bersaglio;
      if (lupo.vivo && lupo.generazione === generazione) this.base.colpisciLupo(lupo, lupo.dannoAscia);
      this.bersaglio = null;
    }
    if (this.colpo >= 1) this.colpo = null;
    else animaColpo(this.modello, this.colpo);
  }
}

// ---------------- Come girare attorno alle mura ----------------

// Il prossimo punto verso cui camminare per andare da "da" ad "a" restando fuori dalle mura:
// se la linea dritta non attraversa le mura si va dritti, altrimenti si va al prossimo angolo
// (girando dalla parte più corta).
function prossimaTappa(da, a) {
  const M = MAPPA.mura;
  if (!attraversa(da, a, M.sinistra - 0.4, M.destra + 0.4, M.fondo - 0.4, M.fronte + 0.4)) return a;

  // un rettangolo un po' più largo delle mura: i suoi angoli sono le "curve" del giro
  const x1 = M.sinistra - MARGINE_GIRO;
  const x2 = M.destra + MARGINE_GIRO;
  const z1 = M.fondo - MARGINE_GIRO;
  const z2 = M.fronte + MARGINE_GIRO;
  const W = x2 - x1;
  const H = z2 - z1;
  const giro = 2 * (W + H);
  // ogni punto diventa una "distanza lungo il giro" (0 = angolo in fondo a sinistra, in senso orario visto dall'alto)
  const lungoIlGiro = (p) => {
    const px = THREE.MathUtils.clamp(p.x, x1, x2);
    const pz = THREE.MathUtils.clamp(p.z, z1, z2);
    const distanze = [pz - z1, x2 - px, z2 - pz, px - x1]; // dal lato di fondo, destro, davanti, sinistro
    const lato = distanze.indexOf(Math.min(...distanze));
    return [px - x1, W + pz - z1, W + H + x2 - px, 2 * W + H + z2 - pz][lato];
  };
  const angoli = [[x1, z1, 0], [x2, z1, W], [x2, z2, W + H], [x1, z2, 2 * W + H]];
  const tDa = lungoIlGiro(da);
  const avanti = (((lungoIlGiro(a) - tDa) % giro) + giro) % giro;
  const senso = avanti <= giro / 2 ? 1 : -1;
  let migliore = angoli[0];
  let piuVicino = Infinity;
  for (const angolo of angoli) {
    const d = ((((angolo[2] - tDa) * senso) % giro) + giro) % giro;
    if (d > 0.05 && d < piuVicino) {
      piuVicino = d;
      migliore = angolo;
    }
  }
  return new THREE.Vector3(migliore[0], 0, migliore[1]);
}

// La linea da "a" a "b" passa dentro il rettangolo? (metodo di Liang-Barsky)
function attraversa(a, b, xMin, xMax, zMin, zMax) {
  let t0 = 0;
  let t1 = 1;
  const dx = b.x - a.x;
  const dz = b.z - a.z;
  for (const [p, q] of [[-dx, a.x - xMin], [dx, xMax - a.x], [-dz, a.z - zMin], [dz, zMax - a.z]]) {
    if (p === 0) {
      if (q < 0) return false;
      continue;
    }
    const r = q / p;
    if (p < 0) {
      if (r > t1) return false;
      t0 = Math.max(t0, r);
    } else {
      if (r < t0) return false;
      t1 = Math.min(t1, r);
    }
  }
  return true;
}
