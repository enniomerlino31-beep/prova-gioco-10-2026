// =====================================================================
//  CACCIATORI (si comprano dalla fila ECONOMIA: "Cacciatore", poi
//  "Secondo cacciatore"; "Cacciatore esperto" li rende più svelti tutti e due)
//  Un boscaiolo con il berretto verde e la giacca di pelle marrone.
//  Aspettano al loro banco da lavoro, nella colonna di destra, sistemando
//  gli attrezzi (vedi banco.js). Ognuno difende un lato della base:
//   - il primo esce dal cancello di SINISTRA e si occupa del lato sinistro
//   - il secondo esce dal cancello di DESTRA e si occupa del lato destro
//  così non inseguono mai lo stesso lupo. Finché c'è un solo cacciatore,
//  lui si occupa di tutti e due i lati ed esce dal cancello più vicino a
//  quello che deve fare.
//  Appena c'è un lupo (o della carne a terra) dalla sua parte, esce dal suo
//  cancello, gira attorno alle mura senza attraversarle, combatte il lupo
//  con l'ascia e raccoglie la carne che lascia. Quando fuori non c'è più
//  niente (o ha già sulla schiena il massimo, "caricoCacciatore" unità),
//  rientra dallo stesso cancello e porta la carne al tavolo dello sportello
//  CARNE, poi torna al banco (o esce di nuovo).
//  Quando ci sono tutte e quattro le torrette i lupi li fermano gli arcieri:
//  i cacciatori smettono di combattere ed escono solo a raccogliere la
//  carne rimasta a terra.
//  Fuori dalle mura: se le mura sono in mezzo, gira da un angolo all'altro
//  (sempre nello stesso verso finché non vede l'obiettivo), così non resta
//  mai incastrato contro le mura.
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
const SPESSORE_MURA = 0.45; // per decidere se le mura sono in mezzo (meno di MARGINE_MURA: lui non ci sta mai dentro)
const PEZZI_SCHIENA = 3;    // pezzi di carne disegnati al massimo sulla schiena
const PASSAGGIO = 1.6;      // i punti appena dentro e appena fuori da un cancello, a questa distanza dal varco
// dentro la base il cacciatore di sinistra passa da qui (tra la catasta e il cerchio del venditore),
// così non attraversa la catasta né i cerchi
const CORRIDOIO = new THREE.Vector3(-4, 0, 0.9);
const CORRIDOIO_DESTRA = new THREE.Vector3(2.8, 0, 0.9);

// I due punti di un cancello: appena dentro e appena fuori (lato: -1 = cancello di sinistra, 1 = di destra)
function puntiCancello(lato) {
  const cancello = lato < 0 ? MAPPA.cancelli.foresta : MAPPA.cancelli.destra;
  return {
    cancello,
    nome: lato < 0 ? 'foresta' : 'destra',
    dentro: new THREE.Vector3(cancello.x - lato * PASSAGGIO, 0, cancello.z),
    fuori: new THREE.Vector3(cancello.x + lato * PASSAGGIO, 0, cancello.z),
  };
}

// Il lato della base di un punto: -1 = metà sinistra, 1 = metà destra
const latoDi = (x) => (x < 0 ? -1 : 1);

export class Cacciatore {
  // base: la segheria (lupi, carne a terra, sportello CARNE, cancelli, effetti); livello: da CONFIG.miglioramenti.cacciatore
  // numero: 0 = il primo (cancello di sinistra), 1 = il secondo (cancello di destra)
  constructor(base, livello, numero) {
    this.base = base;
    this.livello = livello;
    this.numero = numero;
    this.carico = 0;        // unità di carne sulla schiena
    this.stato = 'casa';    // 'casa', 'esce', 'fuori', 'rientra', 'entra', 'attesa' (carne in volo), 'torna'
    this.percorso = [];     // punti da raggiungere uno dopo l'altro (per passare dal cancello)
    this.porta = puntiCancello(numero === 0 ? -1 : 1); // il cancello da cui esce (e rientra) in questo giro
    this.giro = null;       // come gira attorno alle mura: { verso: 1 o -1, chi: l'obiettivo } (null = va dritto)
    this.ricarica = 0;
    this.colpo = null;      // a che punto è il colpo d'ascia (da 0 a 1); null = non sta colpendo
    this.bersaglio = null;  // il lupo che riceverà il colpo quando la lama cala
    this.comparsa = 0;
    // al banco: il primo sta a sinistra, il secondo a destra
    this.casa = MAPPA.casaCacciatore.clone().add(new THREE.Vector3(numero === 0 ? -0.5 : 0.5, 0, 0));
    this.posizione = this.casa.clone();
    // dal cancello allo sportello CARNE: fino accanto al cerchio del deposito
    const zona = base.sportelli.carne.zona;
    this.postoSportello = new THREE.Vector3(zona.x - 0.9, 0, zona.z);

    this.modello = creaLavoratore({ berretto: 0x3d7a34, berrettoScuro: 0x2b5a25, giacca: 0x8a6239 });
    this.modello.scale.setScalar(0.001);
    this.modello.position.copy(this.posizione);
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

  // Il lato che difende: -1 sinistro, 1 destro, 0 = tutti e due (quando è l'unico cacciatore)
  get lato() {
    if (this.base.cacciatori.length < 2) return 0;
    return this.numero === 0 ? -1 : 1;
  }

  aggiorna(dt) {
    // compare con un piccolo salto
    this.comparsa = Math.min(1, this.comparsa + dt * 2);
    const c = this.comparsa;
    this.modello.scale.setScalar(Math.max(0.001, CONFIG.segheria.dimensioneBoscaiolo * 0.9 * (c < 1 ? c + Math.sin(c * Math.PI) * 0.35 : 1)));
    this.ricarica = Math.max(0, this.ricarica - dt);

    // solo quello che sta dalla sua parte; i lupi solo finché non ci sono tutte le torrette
    const suo = (cosa) => this.lato === 0 || latoDi(cosa.x) === this.lato;
    const lupi = this.base.cacciatoriCombattono ? this.base.lupiBase.filter((lupo) => lupo.vivo && suo(lupo)) : [];
    const massimo = CONFIG.lavoratori.caricoCacciatore;
    // la carne a terra che ci sta ancora sulla schiena
    const carne = this.base.carneCadute.filter((pezzo) => !pezzo.preso && suo(pezzo) && this.carico + pezzo.quantita <= massimo);
    const fuoriCeQualcosa = lupi.length > 0 || carne.length > 0;
    const pieno = this.carico >= massimo;

    if (this.stato === 'casa' || this.stato === 'torna') {
      if (fuoriCeQualcosa) {
        // esce: va al suo cancello (quello del suo lato, o il più vicino a ciò che c'è da fare)
        const primo = [...lupi, ...carne].reduce((a, b) => (this.distanza(b) < this.distanza(a) ? b : a));
        this.porta = puntiCancello(this.lato || latoDi(primo.x));
        this.stato = 'esce';
        this.percorso = [...this.versoIlCancello(), this.porta.dentro, this.porta.fuori];
      } else if (this.stato === 'torna') {
        if (this.seguiPercorso(dt)) this.stato = 'casa';
      } else {
        this.lavoraAlBanco(dt);
      }
    } else if (this.stato === 'esce' || this.stato === 'entra') {
      if (this.seguiPercorso(dt)) {
        if (this.stato === 'esce') {
          this.stato = 'fuori';
          this.giro = null;
        } else if (this.carico > 0) this.scarica();
        else this.torna([this.casa]);
      }
    } else if (this.stato === 'fuori') {
      if (pieno) this.stato = 'rientra'; // schiena piena: prima porta la carne allo sportello
      else this.caccia(lupi, carne, dt);
    } else if (this.stato === 'rientra') {
      if (fuoriCeQualcosa && !pieno) this.stato = 'fuori';
      else if (this.vaiFuori(this.porta.fuori, dt)) {
        this.stato = 'entra';
        this.percorso = [this.porta.dentro, ...this.dalCancello(), ...(this.carico > 0 ? [this.postoSportello] : [this.casa])];
      }
    } else {
      this.fermo(dt); // 'attesa': la carne sta volando verso lo sportello
    }
    this.aggiornaColpo(dt);
  }

  // Dentro la base, i punti da cui passare prima di arrivare al cancello (o dopo esserne entrati):
  // per il cancello di sinistra si passa dal corridoio tra la catasta e il cerchio del venditore
  versoIlCancello() {
    if (this.porta.nome !== 'foresta') return [];
    return this.posizione.x > CORRIDOIO.x ? [CORRIDOIO] : [];
  }

  dalCancello() {
    return this.porta.nome === 'foresta' ? [CORRIDOIO, CORRIDOIO_DESTRA] : [];
  }

  // Fuori dalle mura: prima i lupi (il più vicino), poi la carne rimasta a terra; se non c'è niente rientra
  caccia(lupi, carne, dt) {
    const piuVicino = (lista) => lista.reduce((a, b) => (this.distanza(b) < this.distanza(a) ? b : a));
    if (lupi.length > 0) {
      const lupo = piuVicino(lupi);
      if (this.distanza(lupo) > CONFIG.lavoratori.raggioColpoCacciatore + lupo.ingombro) {
        this.vaiFuori(lupo, dt);
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
      if (this.vaiFuori(pezzo, dt) || this.distanza(pezzo) < 0.8) this.prendi(pezzo);
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
      this.torna([this.casa]); // dallo sportello sale dritto fino al banco
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
    const x = this.porta.cancello.x;
    const attraversaCancello = (this.posizione.x - x) * (prossimo.x - x) < 0;
    if (attraversaCancello && !this.base.cancelli[this.porta.nome].aperto) {
      this.fermo(dt);
      return false;
    }
    if (this.cammina(prossimo, dt)) this.percorso.shift();
    return this.percorso.length === 0;
  }

  // Cammina fuori dalle mura verso "chi" (un lupo, un pezzo di carne o un punto). True quando è arrivato.
  // Se le mura sono in mezzo va all'angolo successivo, sempre nello stesso verso (quello più corto, deciso
  // la prima volta) finché non vede di nuovo l'obiettivo: così non torna mai indietro e non resta incastrato.
  vaiFuori(chi, dt) {
    const obiettivo = new THREE.Vector3(chi.x, 0, chi.z);
    let tappa = obiettivo;
    if (muraInMezzo(this.posizione, obiettivo)) {
      if (this.giro?.chi !== chi) this.giro = { chi, verso: versoPiuCorto(this.posizione, obiettivo) };
      tappa = prossimoAngolo(this.posizione, this.giro.verso);
    } else this.giro = null;
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
    this.tempoBanco = (this.tempoBanco ?? this.numero * 1.7) + dt;
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
// Il "giro" è un rettangolo un po' più largo delle mura: i suoi quattro angoli sono le curve.
// Ogni punto fuori dalle mura ha una "distanza lungo il giro" (0 = angolo in alto a sinistra,
// poi in senso orario visto dall'alto: alto a destra, basso a destra, basso a sinistra).

function rettangoloGiro() {
  const M = MAPPA.mura;
  const x1 = M.sinistra - MARGINE_GIRO;
  const x2 = M.destra + MARGINE_GIRO;
  const z1 = M.fondo - MARGINE_GIRO;
  const z2 = M.fronte + MARGINE_GIRO;
  const W = x2 - x1;
  const H = z2 - z1;
  return { x1, x2, z1, z2, W, H, giro: 2 * (W + H), angoli: [[x1, z1, 0], [x2, z1, W], [x2, z2, W + H], [x1, z2, 2 * W + H]] };
}

function lungoIlGiro(p, r) {
  const px = THREE.MathUtils.clamp(p.x, r.x1, r.x2);
  const pz = THREE.MathUtils.clamp(p.z, r.z1, r.z2);
  const distanze = [pz - r.z1, r.x2 - px, r.z2 - pz, px - r.x1]; // dal lato in alto, destro, in basso, sinistro
  const lato = distanze.indexOf(Math.min(...distanze));
  return [px - r.x1, r.W + pz - r.z1, r.W + r.H + r.x2 - px, 2 * r.W + r.H + r.z2 - pz][lato];
}

// Il verso più corto per andare da "da" ad "a" lungo il giro: 1 = senso orario, -1 = antiorario
function versoPiuCorto(da, a) {
  const r = rettangoloGiro();
  const avanti = (((lungoIlGiro(a, r) - lungoIlGiro(da, r)) % r.giro) + r.giro) % r.giro;
  return avanti <= r.giro / 2 ? 1 : -1;
}

// Il prossimo angolo del giro nel verso indicato (se è già su un angolo, quello dopo)
function prossimoAngolo(da, verso) {
  const r = rettangoloGiro();
  const t = lungoIlGiro(da, r);
  let migliore = r.angoli[0];
  let piuVicino = Infinity;
  for (const angolo of r.angoli) {
    const d = ((((angolo[2] - t) * verso) % r.giro) + r.giro) % r.giro;
    if (d > 0.05 && d < piuVicino) {
      piuVicino = d;
      migliore = angolo;
    }
  }
  return new THREE.Vector3(migliore[0], 0, migliore[1]);
}

// Le mura sono in mezzo tra "a" e "b"? (la linea dritta passa dentro il rettangolo delle mura,
// un po' ingrossato: metodo di Liang-Barsky)
function muraInMezzo(a, b) {
  const M = MAPPA.mura;
  const xMin = M.sinistra - SPESSORE_MURA;
  const xMax = M.destra + SPESSORE_MURA;
  const zMin = M.fondo - SPESSORE_MURA;
  const zMax = M.fronte + SPESSORE_MURA;
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
