// =====================================================================
//  LA STANCHEZZA (Gruppo 8)
//  Dopo 150-210 secondi di lavoro (a caso, CONFIG.personale.stanchezza) un lavoratore in base (aiutante, cacciatori, venditori; NON il
//  boscaiolo secondario, che sta nella foresta) è stanco: sbadiglia ("Uaaah...") e, appena è al suo posto e non sta portando niente
//  (aiutante alla catasta, cacciatore al banco, venditore fermo), si addormenta: si china in avanti, respira piano e sopra di lui c'è
//  "Zzz". Finché dorme non lavora (il venditore non serve i clienti: vedi Clienti.vende). MAI più di uno addormentato alla volta.
//  Si sveglia:
//   - toccandolo sullo schermo (area di CONFIG.personale.stanchezza.raggioTocco pixel),
//   - avvicinandosi (il boscaiolo a meno di raggioRisveglio metri),
//   - dal menu del personale (pulsante "Sveglia"),
//   - da solo all'inizio della giornata dopo (a fine giornata si svegliano tutti).
//  Il risveglio: un saltello con un "!" e una nuvoletta. Il tempo di lavoro passa solo nella base (Segheria.aggiorna). Un solo disegno
//  "Zzz" (uno sprite) per tutti: nessun peso per il telefono. Da offline nessuno si stanca.
//  Ogni lavoratore (Aiutante, Cacciatore, Venditore) controlla "dorme" all'inizio del suo aggiorna e, se dorme, non fa niente.
// =====================================================================

import * as THREE from 'three';
import { CONFIG } from '../config.js';
import { suoni } from '../motore/suoni.js';

// "Z z z" disegnato una volta sola
function creaTexture() {
  const tela = document.createElement('canvas');
  tela.width = 128;
  tela.height = 64;
  const ctx = tela.getContext('2d');
  ctx.font = '900 40px "Baloo 2", "Arial Rounded MT Bold", system-ui, sans-serif';
  ctx.textBaseline = 'middle';
  ctx.lineJoin = 'round';
  ctx.lineWidth = 8;
  ctx.strokeStyle = 'rgba(30,45,70,0.9)';
  ctx.fillStyle = '#ffffff';
  [['Z', 8, 44, 36], ['z', 48, 30, 30], ['z', 84, 16, 24]].forEach(([lettera, x, y, dimensione]) => {
    ctx.font = `900 ${dimensione}px "Baloo 2", system-ui, sans-serif`;
    ctx.strokeText(lettera, x, y);
    ctx.fillText(lettera, x, y);
  });
  const texture = new THREE.CanvasTexture(tela);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

const dueNumeri = ([a, b]) => a + Math.random() * (b - a);

export class Riposo {
  constructor(base, contenitore) {
    this.base = base;
    this.dormiente = null; // { chiave, oggetto }: chi dorme adesso (al massimo uno)
    this.tempo = 0;
    this.zzz = new THREE.Sprite(new THREE.SpriteMaterial({ map: creaTexture(), transparent: true, depthWrite: false }));
    this.zzz.scale.set(1.1, 0.55, 1);
    this.zzz.visible = false;
    base.radice.add(this.zzz);
    // un tocco sul lavoratore che dorme lo sveglia
    contenitore.addEventListener('pointerdown', (evento) => this.tocco(evento));
  }

  // Chi può stancarsi: [chiave, lavoratore] di quelli che ci sono in scena
  lavoratori() {
    const p = this.base.personale;
    return ['aiutante', 'cacciatore0', 'cacciatore1', 'venditoreCarne', 'venditoreLegna']
      .map((chiave) => [chiave, p.oggetto(chiave)])
      .filter(([, o]) => o && o.comparsa >= 1);
  }

  // È al suo posto e non sta portando né facendo niente? (solo allora si può addormentare)
  alSuoPosto(chiave, o) {
    if (chiave === 'aiutante') return o.stato === 'catasta' && !o.sequenza && o.carico === 0 && o.posizione.distanceTo(o.puntoCatasta) < 0.2;
    if (chiave.startsWith('cacciatore')) return o.stato === 'casa' && o.carico === 0 && o.colpo === null;
    return o.servizio === 0; // venditori
  }

  // Da chiamare a ogni fotogramma nella base
  aggiorna(dt) {
    this.tempo += dt;
    const S = CONFIG.personale.stanchezza;
    for (const [chiave, o] of this.lavoratori()) {
      const r = (o.riposo ??= { lavoro: dueNumeri(S.lavoro), sbadiglio: 0, stanco: false });
      if (o.dorme) continue;
      if (!r.stanco) {
        r.lavoro -= dt;
        if (r.lavoro > 0 || this.dormiente) continue; // mai più di uno addormentato (e nemmeno stanco) alla volta
        r.stanco = true;
        r.sbadiglio = S.sbadiglio;
        const { x, z } = o.modello.position;
        this.base.effetti.testo(x, 2.1, z, 'Uaaah...', 'buono');
      } else {
        r.sbadiglio -= dt;
        if (r.sbadiglio <= 0 && !this.dormiente && this.alSuoPosto(chiave, o)) this.addormenta(chiave, o);
      }
    }
    if (this.dormiente) this.aggiornaSonno(dt);
  }

  addormenta(chiave, o) {
    o.dorme = true;
    o.riposo.k = 0;
    this.dormiente = { chiave, oggetto: o };
    this.zzz.visible = true;
  }

  // La posa di chi dorme (il lavoratore non si muove da solo: lo decide qui) e il "Zzz" che galleggia
  aggiornaSonno(dt) {
    const { chiave, oggetto: o } = this.dormiente;
    const r = o.riposo;
    r.k = Math.min(1, r.k + dt * 2.2);
    const { molla, perni } = o.modello.userData;
    const respiro = Math.sin(this.tempo * 1.7);
    molla.rotation.set(0.7 * r.k, 0, 0);
    molla.position.y = -0.14 * r.k;
    const allunga = respiro * 0.02 * r.k;
    molla.scale.set(1 - allunga * 0.5, 1 + allunga, 1 - allunga * 0.5);
    perni.braccioSx.rotation.x = perni.braccioDx.rotation.x = 0.5 * r.k;
    const { x, z } = o.modello.position;
    this.zzz.position.set(x, 2.35 + Math.sin(this.tempo * 1.6) * 0.1, z);
    this.zzz.material.opacity = 0.75 + Math.sin(this.tempo * 2.4) * 0.25;
    // avvicinandosi (il boscaiolo) si sveglia
    const g = this.base.giocatore.posizione;
    if (Math.hypot(g.x - x, g.z - z) < CONFIG.personale.stanchezza.raggioRisveglio) this.sveglia(chiave);
  }

  // Un tocco sullo schermo: se è sul lavoratore che dorme lo sveglia
  tocco(evento) {
    if (!this.dormiente || !this.base.attiva) return;
    const rett = evento.currentTarget.getBoundingClientRect();
    const { x, z } = this.dormiente.oggetto.modello.position;
    const p = new THREE.Vector3(x, 1.0, z).project(this.base.telecamera);
    if (p.z > 1) return;
    const sx = rett.left + ((p.x + 1) / 2) * rett.width;
    const sy = rett.top + ((1 - p.y) / 2) * rett.height;
    if (Math.hypot(evento.clientX - sx, evento.clientY - sy) < CONFIG.personale.stanchezza.raggioTocco) this.sveglia(this.dormiente.chiave);
  }

  // Sveglia chi dorme (chiave: 'aiutante', 'cacciatore0'...; senza chiave, chiunque dorma). Restituisce true se ha svegliato qualcuno.
  sveglia(chiave = null) {
    const d = this.dormiente;
    if (!d || (chiave && d.chiave !== chiave)) return false;
    const o = d.oggetto;
    o.dorme = false;
    this.dormiente = null;
    this.zzz.visible = false;
    const { molla, perni } = o.modello.userData;
    molla.rotation.set(0, 0, 0);
    molla.position.y = 0;
    molla.scale.set(1, 1, 1);
    perni.braccioSx.rotation.x = perni.braccioDx.rotation.x = 0;
    o.riposo = { lavoro: dueNumeri(CONFIG.personale.stanchezza.lavoro), sbadiglio: 0, stanco: false };
    const { x, z } = o.modello.position;
    this.base.effetti.testo(x, 2.1, z, '!', 'buono');
    this.base.effetti.sbuffo(x, 0.6, z, 0xf4f8ff, 6, 1.6);
    suoni.suona('comparsa');
    return true;
  }

  // Un lavoratore sparisce dalla scena (licenziato, a casa): se dormiva, il suo sonno finisce
  perso(oggetto) {
    if (this.dormiente?.oggetto === oggetto) {
      this.dormiente = null;
      this.zzz.visible = false;
    }
  }

  // Nuova giornata: si svegliano tutti e il lavoro riparte da capo
  nuovaGiornata() {
    this.sveglia();
    for (const [, o] of this.lavoratori()) o.riposo = { lavoro: dueNumeri(CONFIG.personale.stanchezza.lavoro), sbadiglio: 0, stanco: false };
  }
}
