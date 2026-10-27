// =====================================================================
//  SCONTRO CON L'ORSO GIGANTE (il boss di fine corsa)
//  L'orso aspetta davanti alla scalinata. Quando la squadra si ferma a poca distanza:
//   1. l'orso si alza sulle zampe di dietro e ruggisce (compare "Orso livello N");
//   2. scontro AUTOMATICO e movimentato:
//      - i boscaioli corrono da lui a ondate e lo circondano a semicerchio, da più lati; alcuni gli
//        saltano addosso con l'ascia alzata; ogni boscaiolo che lo colpisce gli toglie 1 punto di vita
//        e sparisce (l'orso lampeggia di bianco, sobbalza, schegge di neve e ciuffi di pelo);
//      - l'orso cammina avanti e indietro, si gira verso il gruppo più grande e attacca: zampate ampie
//        (si carica all'indietro, poi colpisce: i boscaioli colpiti volano via ad arco e ricadono
//        nella neve) e ogni tanto lo SCHIANTO (si alza e batte a terra con tutte e due le zampe: colpo
//        più forte e onda di neve). A ogni colpo trema un attimo la telecamera;
//      - sotto il 30% di vita diventa FURIOSO: ruggisce, occhi più luminosi, attacca più spesso;
//   3. il colpo finale va al RALLENTATORE per mezzo secondo, poi l'orso crolla con un tonfo, neve e
//      scintille e i boscaioli esultano (e si va alla scalinata). Se i boscaioli finiscono prima, vince lui.
//  Il numero vero dei boscaioli (squadra.numero) scende man mano che partono all'attacco o vengono
//  spazzati via. Si disegnano al massimo CONFIG.orso.visibiliMassimi boscaioli in corsa o in volo: ognuno
//  può "valere" più boscaioli veri, così anche con 1.000 boscaioli il telefono non rallenta.
//  Tutti i numeri sono in CONFIG.orso.
// =====================================================================

import * as THREE from 'three';
import { CONFIG } from '../config.js';
import { partiBoscaiolo, PERNI } from '../modelli/boscaiolo.js';
import { creaOrso, animaOrso, avviaZampata, avviaSchianto, colpisciOrso, ZAMPATA, SCHIANTO } from '../modelli/orso.js';
import { creaBarraGigante } from '../segheria/barraGigante.js';
import { suoni } from '../motore/suoni.js';

const CAPIENZA = 80; // omini che si possono disegnare insieme (ne servono al massimo CONFIG.orso.visibiliMassimi)
const GRAVITA = 22;
const ALTEZZA_BARRA = 8.8;
const SCIA = 0.09;   // dopo quanti secondi dall'arrivo l'ascia colpisce davvero
const limita = (v, a, b) => Math.min(b, Math.max(a, v));

// Quanta vita ha l'orso a un certo livello (livello 1 = CONFIG.orso.vita, poi sempre di più)
export function vitaOrso(livello) {
  const C = CONFIG.orso;
  const l = Math.min(Math.max(1, livello), C.livelloMassimoForza);
  return Math.round(C.vita * Math.pow(1 + C.crescitaVita, l - 1));
}

export class ScontroOrso {
  constructor(genitore, effetti, livello) {
    const C = CONFIG.orso;
    this.effetti = effetti;
    this.livello = livello;
    this.vita = vitaOrso(livello);
    this.hp = this.vita;
    this.distanzaBase = CONFIG.pista.lunghezza - C.distanzaOrso; // dove sta il centro dell'orso a riposo (metri dalla partenza)
    this.distanza = this.distanzaBase; // dove sta adesso (cammina avanti e indietro)
    this.x = 0;
    this.yaw = 0;
    this.fase = 'attesa'; // 'attesa', 'ruggito', 'scontro', 'finale' (rallentatore), 'caduta', 'trionfo'
    this.tempoFase = 0;
    this.esito = null;    // null finché si combatte, poi 'vinto' o 'perso'
    this.attesaOndata = 0;
    this.attesaAttacco = 1;
    this.attacchi = 0;
    this.latoZampata = 1;
    this.pendente = null; // l'attacco in corso: { tipo, tempo (secondi all'impatto) }
    this.furioso = false;
    this.tempoFuria = 0;
    this.attesaGrido = 0;
    this.corridori = [];
    this.tremito = 0;
    this.camminata = 0;
    this.bersaglio = { d: this.distanza, x: 0 };
    this.attesaPasso = 1;
    this.alTremito = null; // la corsa lo collega alla telecamera: alTremito(metri)

    // --- L'orso ---
    this.orso = creaOrso();
    this.orso.modello.scale.setScalar(C.grandezza);
    this.orso.radice.rotation.y = Math.PI; // guarda verso la squadra
    this.orso.radice.position.set(0, 0, -this.distanza);
    genitore.add(this.orso.radice);

    // --- Barra della vita grande, sopra la testa (trema quando l'orso è colpito) ---
    this.barra = creaBarraGigante(ALTEZZA_BARRA, 8.4);
    this.barra.gruppo.traverse((o) => {
      if (o.material) o.material.userData.daLiberare = true; // si butta via a fine corsa
    });
    this.orso.radice.add(this.barra.gruppo);
    this.barra.aggiorna(this);

    // --- Onda di neve dello schianto: un anello piatto che si allarga e svanisce ---
    const geometria = new THREE.RingGeometry(0.85, 1, 36);
    geometria.userData.daLiberare = true;
    const materiale = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide });
    materiale.userData.daLiberare = true;
    this.onda = new THREE.Mesh(geometria, materiale);
    this.onda.rotation.x = -Math.PI / 2;
    this.onda.visible = false;
    this.tempoOnda = 99;
    genitore.add(this.onda);

    // --- I boscaioli che corrono da lui o volano via: un'InstancedMesh per ogni pezzo, come la squadra ---
    this.parti = partiBoscaiolo().map((parte) => {
      const mesh = new THREE.InstancedMesh(parte.geometria, parte.materiale, CAPIENZA);
      mesh.castShadow = true;
      mesh.frustumCulled = false;
      mesh.count = 0;
      genitore.add(mesh);
      return { ...parte, mesh };
    });
    this._mOmino = new THREE.Matrix4();
    this._mPerno = new THREE.Matrix4();
    this._mFinale = new THREE.Matrix4();
    this._q = new THREE.Quaternion();
    this._e = new THREE.Euler();
    this._v = new THREE.Vector3();
    this._s = new THREE.Vector3();
  }

  // La squadra si è fermata davanti all'orso: comincia il ruggito
  inizia() {
    this.cambiaFase('ruggito');
    this.barra.gruppo.visible = true;
    this.ruggitoSuonato = false;
  }

  // Dove guardare con la telecamera durante lo scontro (distanza dalla partenza): fisso, l'orso si muove un po' davanti
  get centroInquadratura() {
    return this.distanzaBase - CONFIG.orso.distanzaScontro / 2 - 2;
  }

  // Quanto va veloce il tempo: il colpo finale va al rallentatore
  get fattoreTempo() {
    return this.fase === 'finale' ? CONFIG.orso.rallentatore[1] : 1;
  }

  cambiaFase(fase) {
    this.fase = fase;
    this.tempoFase = 0;
  }

  tremaTutto(forza) {
    this.tremito = Math.max(this.tremito, Math.min(1, forza * 2));
    this.alTremito?.(forza);
  }

  // dt = secondi di gioco (già rallentati nel rallentatore); dtReale = secondi veri
  aggiorna(dt, squadra, dtReale = dt) {
    const C = CONFIG.orso;
    this.tempoFase += this.fase === 'finale' ? dtReale : dt;
    this.tremito = Math.max(0, this.tremito - dt * 4);

    if (this.fase === 'ruggito') {
      if (!this.ruggitoSuonato && this.tempoFase > 0.35) {
        this.ruggitoSuonato = true;
        suoni.suona('orsoRuggito');
        this.effetti.sbuffo(this.x, 0.4, -this.distanza, 0xf3f8ff, 22, 4);
      }
      if (this.tempoFase >= C.tempoRuggito) {
        this.cambiaFase('scontro');
        this.attesaOndata = 0;
        this.attesaAttacco = 0.9;
        this.attesaGrido = 1.4;
        this.boscaioliInizio = squadra.numero;
        suoni.suona('orsoCarica'); // grido di carica di tutta la squadra, forte, all'inizio dello scontro
      }
    } else if (this.fase === 'scontro') {
      this.aggiornaScontro(dt, squadra);
    } else if (this.fase === 'finale') {
      // il colpo finale al rallentatore (mezzo secondo vero), poi l'orso crolla
      if (this.tempoFase >= C.rallentatore[0]) {
        this.cambiaFase('caduta');
        this.corridori.forEach((c) => { if (c.stato === 'corre' || c.stato === 'colpisce') c.stato = 'esce'; });
        this.crollo();
      }
    } else if (this.fase === 'caduta') {
      if (this.tempoFase >= C.pausaDopo) this.esito = 'vinto';
    } else if (this.fase === 'trionfo') {
      if (this.tempoFase >= 2) this.esito = 'perso';
    }

    this.muoviOrso(dt, squadra);
    this.muoviCorridori(dt);
    this.animaOrsoInScena(dt);
    this.animaOnda(dt);
    this.disegnaCorridori();
    this.barra.aggiorna(this);
  }

  aggiornaScontro(dt, squadra) {
    const C = CONFIG.orso;
    // --- ondate di boscaioli ---
    this.attesaOndata -= dt;
    if (this.attesaOndata <= 0 && squadra.numero > 0) {
      this.attesaOndata = C.pausaOndate;
      this.lanciaOndata(squadra);
    }
    // --- furia: sotto il 30% di vita ruggisce e attacca più spesso ---
    if (!this.furioso && this.hp < this.vita * C.furiaSotto) {
      this.furioso = true;
      this.tempoFuria = 0.9;
      this.attesaAttacco = Math.max(this.attesaAttacco, 0.9);
      suoni.suona('orsoRuggito');
      this.effetti.sbuffo(this.x, 0.4, -this.distanza, 0xf3f8ff, 14, 3.5);
      this.tremaTutto(C.tremitoTelecamera[0] * 0.7);
    }
    if (this.tempoFuria > 0) this.tempoFuria -= dt;
    // --- grida di battaglia: ogni tanto, più piene con la squadra grande ---
    this.attesaGrido -= dt;
    if (this.attesaGrido <= 0) {
      this.attesaGrido = C.gridaScontro[0] + Math.random() * (C.gridaScontro[1] - C.gridaScontro[0]);
      const folla = this.boscaioliInizio >= C.boscaioliGridaFolla && Math.random() < Math.min(0.85, 0.25 + this.boscaioliInizio / 500);
      suoni.suona(folla ? 'orsoGridoFolla' : 'orsoGrido');
    }
    // --- attacchi: zampata, e ogni tanto lo schianto ---
    this.attesaAttacco -= dt;
    if (this.attesaAttacco <= 0 && !this.pendente && this.tempoFuria <= 0) {
      this.attacchi++;
      const schianto = this.attacchi % C.schiantoOgni === 0;
      const rapido = this.furioso ? C.furiaVelocita : 1;
      this.attesaAttacco = (C.zampata[0] + Math.random() * (C.zampata[1] - C.zampata[0])) * rapido + (schianto ? 0.4 : 0);
      if (schianto) {
        avviaSchianto(this.orso);
        this.pendente = { tipo: 'schianto', tempo: SCHIANTO.durata * SCHIANTO.impatto, passato: 0 };
      } else {
        this.latoZampata = -this.latoZampata;
        avviaZampata(this.orso, this.latoZampata);
        this.pendente = { tipo: 'zampata', tempo: ZAMPATA.durata * ZAMPATA.impatto, passato: 0 };
        suoni.suona('orsoZampata');
      }
    }
    if (this.pendente) {
      this.pendente.tempo -= dt;
      this.pendente.passato += dt;
      if (this.pendente.tempo <= 0) {
        const tipo = this.pendente.tipo;
        this.pendente = null;
        this.colpoDellOrso(squadra, tipo);
      }
    }
    // --- fine dello scontro? ---
    if (this.hp <= 0) {
      this.cambiaFase('finale'); // l'ultimo colpo è arrivato: rallentatore
      this.pendente = null;
      this.orso.anim.zampata = -1;
      this.orso.anim.schianto = -1;
      this.effetti.sbuffo(this.x, 1.6, -this.distanza + 2, 0xffffff, 10, 4);
    } else if (squadra.numero <= 0 && !this.corridori.some((c) => c.stato === 'corre' || c.stato === 'colpisce')) {
      this.cambiaFase('trionfo'); // i boscaioli sono finiti: l'orso ha vinto
      suoni.suona('orsoRuggito');
    }
  }

  // L'orso crolla: tonfo, neve e scintille (e i boscaioli esultano: lo decide la corsa)
  crollo() {
    suoni.suona('orsoCade');
    suoni.suona('grido', { ritardo: 0.3 });
    this.effetti.testo(this.x, 6, -this.distanza, 'Orso sconfitto!', 'buono');
    this.effetti.sbuffo(this.x, 0.5, -this.distanza, 0xf3f8ff, 34, 5.5);
    this.effetti.scintille(this.x, 2.2, -this.distanza, 0xffe066, 18, 3.2);
    this.tremaTutto(CONFIG.orso.tremitoTelecamera[1]);
    this.mostraOnda();
  }

  // Un'ondata: parte dalla squadra un gruppo di boscaioli, che circondano l'orso a semicerchio
  lanciaOndata(squadra) {
    const C = CONFIG.orso;
    const dimensione = Math.min(squadra.numero, Math.ceil(this.vita / C.ondate));
    if (dimensione <= 0) return;
    squadra.imposta(squadra.numero - dimensione);
    const visibili = this.corridori.filter((c) => c.visibile).length;
    const quanti = Math.max(1, Math.min(dimensione, 6, C.visibiliMassimi - visibili));
    const base = Math.floor(dimensione / quanti);
    let resto = dimensione - base * quanti;
    const giro = Math.random();
    for (let i = 0; i < quanti; i++) {
      const valore = base + (resto-- > 0 ? 1 : 0);
      // ognuno sceglie il suo punto sull'arco attorno all'orso (da un lato all'altro, davanti): in ogni ondata sono sparpagliati
      const angolo = (((i + giro) / quanti) * 2 - 1) * C.semicerchio;
      this.corridori.push({
        stato: 'corre',
        visibile: visibili + i < C.visibiliMassimi,
        valore,
        x: squadra.x + (Math.random() - 0.5) * 2 * Math.max(0.5, squadra.semiLarghezza),
        d: squadra.distanza + (Math.random() - 0.3) * 1.2,
        y: 0, vx: 0, vd: 0, vy: 0,
        angolo,
        raggio: C.raggioAttacco[0] + Math.random() * (C.raggioAttacco[1] - C.raggioAttacco[0]),
        salta: Math.random() < C.saltatori,
        fase: Math.random() * 6,
        giro: 0, rot: 0,
        scala: 1,
        t: 0,
      });
    }
  }

  // Dove deve arrivare un boscaiolo: sul suo punto dell'arco attorno all'orso (che intanto si muove)
  puntoSuArco(c) {
    return { x: this.x + Math.sin(c.angolo + this.yaw) * c.raggio, d: this.distanza - Math.cos(c.angolo + this.yaw) * c.raggio };
  }

  // Il colpo dell'orso arriva: dei boscaioli vengono spazzati via e volano ad arco
  colpoDellOrso(squadra, tipo) {
    const C = CONFIG.orso;
    const schianto = tipo === 'schianto';
    const base = Math.max(C.zampataMinimo, Math.ceil(this.vita * C.boscaioliPerZampata));
    const quanti = schianto ? base * C.schiantoForza : base;
    const persi = Math.min(squadra.numero, quanti);
    this.tremaTutto(C.tremitoTelecamera[schianto ? 1 : 0]);
    // davanti all'orso, dal lato della zampata (o tutto intorno nello schianto)
    const davanti = this.distanza - 2.6;
    const latoX = schianto ? 0 : this.latoZampata * 1.4;
    if (persi > 0) {
      squadra.imposta(squadra.numero - persi);
      this.effetti.testo(this.x + latoX, 4.4, -davanti, `-${persi}`, 'cattivo');
      suoni.suona('perso');
    }
    suoni.suona('orsoZampata', { volume: schianto ? 1.3 : 0.9, ritardo: schianto ? 0.02 : 0 });
    // un po' di neve alzata dal colpo
    this.effetti.sbuffo(this.x + latoX, 0.4, -davanti, 0xf3f8ff, schianto ? 26 : 14, schianto ? 5.5 : 4);
    if (schianto) this.mostraOnda();
    // boscaioli che volano via ad arco (solo da vedere: quelli veri sono già stati tolti dal conto)
    const volanti = Math.min(schianto ? 14 : 8, Math.max(3, Math.round(persi / 3)), C.visibiliMassimi - this.corridori.filter((c) => c.visibile).length);
    for (let i = 0; i < volanti; i++) {
      const verso = schianto ? (Math.random() < 0.5 ? -1 : 1) : this.latoZampata;
      this.corridori.push({
        stato: 'vola', visibile: true, valore: 0,
        x: this.x + latoX + (Math.random() - 0.5) * 2.2, d: davanti + Math.random() * 0.8, y: 0.6 + Math.random() * 0.6,
        vx: verso * (2.5 + Math.random() * 5), vd: 4 + Math.random() * 9, vy: 8 + Math.random() * 7,
        fase: 0, giro: (Math.random() - 0.5) * 16, rot: 0, scala: 1, t: 0,
      });
    }
  }

  mostraOnda() {
    this.tempoOnda = 0;
    this.onda.visible = true;
    this.onda.position.set(this.x, 0.2, -(this.distanza - 2.4));
  }

  animaOnda(dt) {
    if (this.tempoOnda > 0.6) {
      this.onda.visible = false;
      return;
    }
    this.tempoOnda += dt;
    const k = limita(this.tempoOnda / 0.6, 0, 1);
    this.onda.scale.setScalar(1 + k * 9);
    this.onda.material.opacity = 0.75 * (1 - k) * (1 - k);
  }

  // L'orso cammina avanti e indietro davanti ai boscaioli e si gira verso il gruppo più grande
  muoviOrso(dt, squadra) {
    const C = CONFIG.orso;
    const combatte = this.fase === 'scontro' || this.fase === 'finale';
    if (combatte && !this.pendente) {
      this.attesaPasso -= dt;
      if (this.attesaPasso <= 0) {
        this.attesaPasso = 1.1 + Math.random() * 0.9;
        this.bersaglio = { d: this.distanzaBase - 2.4 + Math.random() * 3.6, x: limita(this.centroGruppo(squadra) * 0.5 + (Math.random() - 0.5) * 1.6, -1.6, 1.6) };
      }
      const dd = this.bersaglio.d - this.distanza;
      const dx = this.bersaglio.x - this.x;
      const dist = Math.hypot(dd, dx);
      const passo = C.passiOrso * dt;
      if (dist > 0.05) {
        const m = Math.min(passo, dist);
        this.distanza += (dd / dist) * m;
        this.x += (dx / dist) * m;
        this.camminata += (1 - this.camminata) * Math.min(1, dt * 6);
      } else {
        this.camminata += (0 - this.camminata) * Math.min(1, dt * 6);
      }
    } else {
      this.camminata += (0 - this.camminata) * Math.min(1, dt * 8);
    }
    // si gira verso il gruppo più grande di boscaioli
    const verso = combatte ? Math.atan2(this.centroGruppo(squadra) - this.x, 12) : 0;
    this.yaw += (limita(verso, -0.7, 0.7) - this.yaw) * Math.min(1, dt * 4);
  }

  // Dove sta (in x) la maggior parte dei boscaioli che attaccano; se non ce ne sono, la squadra
  centroGruppo(squadra) {
    let somma = 0;
    let peso = 0;
    for (const c of this.corridori) {
      if (c.stato !== 'corre' || c.valore <= 0) continue;
      somma += c.x * c.valore;
      peso += c.valore;
    }
    return peso > 0 ? somma / peso : squadra.x;
  }

  muoviCorridori(dt) {
    const C = CONFIG.orso;
    for (const c of this.corridori) {
      c.t += dt;
      if (c.stato === 'corre') {
        const p = this.puntoSuArco(c);
        const dx = p.x - c.x;
        const dd = p.d - c.d;
        const dist = Math.hypot(dx, dd);
        const passo = C.velocitaAttacco * dt;
        c.fase += dt * 18;
        // gli ultimi metri: chi è "saltatore" salta addosso all'orso con l'ascia alzata
        c.y = c.salta && dist < 3.4 ? Math.sin((1 - dist / 3.4) * Math.PI) * 1.1 : 0;
        if (dist <= passo) {
          c.stato = 'colpisce';
          c.t = 0;
          c.colpito = false;
          c.x = p.x;
          c.d = p.d;
        } else {
          c.x += (dx / dist) * passo;
          c.d += (dd / dist) * passo;
        }
      } else if (c.stato === 'colpisce') {
        // l'ascia cala e a metà colpo toglie vita all'orso: lo si vede (lampo bianco, sobbalzo, neve e pelo)
        c.y = c.salta ? Math.max(0, 0.6 - c.t * 4) : 0;
        if (!c.colpito && c.t >= SCIA) {
          c.colpito = true;
          this.hp = Math.max(0, this.hp - c.valore);
          colpisciOrso(this.orso);
          this.tremito = Math.max(this.tremito, 0.45);
          if (c.visibile) {
            const px = c.x + (this.x - c.x) * 0.45;
            const pd = c.d + (this.distanza - c.d) * 0.45;
            this.effetti.scintille(px, 1.5, -pd, 0xffffff, 3, 1.6);
            this.effetti.sbuffo(px, 1.3, -pd, 0xf3f8ff, 3, 2.4); // schegge di neve
            this.effetti.sbuffo(px, 1.5, -pd, 0x4a2c1a, 2, 1.8); // ciuffi di pelo
          }
          suoni.suona('orsoColpo');
        }
        if (c.t >= 0.32) {
          c.stato = 'esce';
          c.t = 0;
        }
      } else if (c.stato === 'vola') {
        c.vy -= GRAVITA * dt;
        c.x += c.vx * dt;
        c.d += c.vd * dt;
        c.y += c.vy * dt;
        c.rot += c.giro * dt;
        if (c.y <= 0) {
          // ricade nella neve con uno sbuffo e resta a terra un attimo
          c.y = 0;
          c.stato = 'terra';
          c.t = 0;
          c.rot = 1.5;
          this.effetti.sbuffo(c.x, 0.2, -c.d, 0xf3f8ff, 7, 2.6);
        }
      } else if (c.stato === 'terra') {
        if (c.t > 0.6) {
          c.stato = 'esce';
          c.t = 0;
        }
      } else if (c.stato === 'esce') {
        c.scala = Math.max(0, 1 - c.t * 4);
      }
    }
    this.corridori = this.corridori.filter((c) => c.stato !== 'esce' || c.scala > 0);
  }

  animaOrsoInScena(dt) {
    const o = this.orso;
    const C = CONFIG.orso;
    const schiantoSu = this.pendente?.tipo === 'schianto' && this.pendente.passato < SCHIANTO.durata * 0.55;
    const alzato =
      this.fase === 'ruggito' || this.fase === 'trionfo' || schiantoSu || (this.fase === 'caduta' && this.tempoFase < 0.3) || this.tempoFuria > 0;
    const ruggisce = this.fase === 'ruggito' || this.fase === 'trionfo' || this.tempoFuria > 0;
    animaOrso(o, dt, { alzato, ruggisce, furia: this.furioso ? 1 : 0, cammina: this.camminata });
    o.radice.position.set(this.x, 0, -this.distanza);
    o.radice.rotation.y = Math.PI + this.yaw;
    // ogni colpo lo fa sobbalzare
    const sussulto = 1 + Math.sin(limita(this.tremito, 0, 1) * Math.PI) * 0.05;
    o.modello.scale.setScalar(C.grandezza * sussulto);
    if (this.fase === 'caduta') {
      // barcolla, si inclina di lato e cade; poi sprofonda nella neve
      const t = this.tempoFase;
      const cade = limita((t - 0.2) / 0.9, 0, 1);
      o.modello.rotation.z = (-Math.PI / 2) * 0.93 * cade * cade * (3 - 2 * cade);
      o.modello.position.y = -Math.max(0, t - 1.3) * 3 + (cade > 0 ? 0.9 * Math.sin(cade * Math.PI) * 0.4 : 0);
      this.barra.gruppo.visible = t < 0.6;
    }
    // la barra della vita trema quando l'orso è colpito
    const tr = limita(this.tremito, 0, 1);
    this.barra.gruppo.position.set((Math.random() - 0.5) * 0.55 * tr, ALTEZZA_BARRA + (Math.random() - 0.5) * 0.4 * tr, 0);
  }

  // Disegna i boscaioli che corrono, saltano o volano
  disegnaCorridori() {
    const dimensione = CONFIG.squadra.dimensioneOmino;
    let n = 0;
    for (const c of this.corridori) {
      if (!c.visibile || n >= CAPIENZA) continue;
      const corre = c.stato === 'corre';
      const passo = Math.sin(c.fase);
      this._v.set(c.x, c.y + (corre && c.y === 0 ? Math.abs(passo) * 0.08 : 0), -c.d);
      if (c.stato === 'vola') this._e.set(c.rot, 0, c.vx * 0.05);
      else if (c.stato === 'terra') this._e.set(c.rot, 0, 0);
      else this._e.set(corre ? -0.14 : 0, 0, 0);
      this._q.setFromEuler(this._e);
      this._s.setScalar(Math.max(0.001, c.scala) * dimensione);
      this._mOmino.compose(this._v, this._q, this._s);
      let angoli;
      if (c.stato === 'vola') {
        angoli = { gambaSx: 0.8, gambaDx: -0.6, braccioSx: -2.4, braccioDx: -2.8 };
      } else if (c.stato === 'terra') {
        angoli = { gambaSx: 0.3, gambaDx: -0.2, braccioSx: -0.8, braccioDx: 0.6 };
      } else if (c.stato === 'colpisce') {
        // ascia alzata, poi cala di scatto
        const k = limita(c.t / SCIA, 0, 1);
        const braccio = -2.9 + 3.3 * k * k;
        angoli = { gambaSx: 0.4, gambaDx: -0.4, braccioSx: braccio * 0.5, braccioDx: braccio };
      } else if (c.salta && c.y > 0) {
        angoli = { gambaSx: 0.7, gambaDx: -0.5, braccioSx: -2.2, braccioDx: -2.9 }; // salta con l'ascia alzata
      } else {
        angoli = { gambaSx: passo * 0.7, gambaDx: -passo * 0.7, braccioSx: -passo * 0.6, braccioDx: passo * 0.3 + 0.5 };
      }
      for (const parte of this.parti) {
        this._e.set(angoli[parte.perno] || 0, 0, 0);
        this._q.setFromEuler(this._e);
        this._mPerno.compose(PERNI[parte.perno], this._q, this._s.setScalar(1));
        this._mFinale.multiplyMatrices(this._mOmino, this._mPerno);
        parte.mesh.setMatrixAt(n, this._mFinale);
      }
      n++;
    }
    for (const parte of this.parti) {
      parte.mesh.count = n;
      parte.mesh.instanceMatrix.needsUpdate = true;
    }
  }
}
