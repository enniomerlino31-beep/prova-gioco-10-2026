// =====================================================================
//  CERCHIO DI UN MIGLIORAMENTO (verde, piatto a terra)
//  Dentro c'è un'icona grande di cosa si compra e sotto, con la moneta,
//  quante monete MANCANO per comprarlo (il numero scende mentre si paga).
//  Sopra il cerchio, a terra, c'è la scritta con il nome di cosa si compra
//  (per il pavimento anche il titolo PAVIMENTO). Quando il boscaiolo ci sta sopra, le monete
//  volano dentro e il bordo si riempie come una barra circolare. A
//  pagamento finito il cerchio fa un piccolo "salto" e mostra il livello
//  successivo; quando i livelli sono finiti sparisce.
//  Ogni cerchio è una lista di livelli: una "fila" di acquisti (DIFESA,
//  ECONOMIA, vedi CONFIG.file) oppure una catena (il pavimento).
//  Un livello può stare in un posto diverso dal precedente (es. la seconda
//  torretta è dall'altra parte della base): allora, dopo l'acquisto, il
//  cerchio si rimpicciolisce, si sposta lì e ricompare.
// =====================================================================

import * as THREE from 'three';
import { CONFIG } from '../config.js';
import { disegnaIcona } from '../modelli/materiali.js';
import { suoni } from '../motore/suoni.js';

const RAGGIO = 1.2;           // come gli altri cerchi a terra (es. il deposito degli sportelli)
const LARGHEZZA_BARRA = 0.24; // spessore della barra circolare
const ALTEZZA_SCRITTA = 0.95; // la scritta a terra sopra il cerchio (metri)

export class CerchioMiglioramento {
  // posizioni: un punto, oppure un punto per ogni livello (da MAPPA.miglioramenti; scrittaSotto = scritta sotto il cerchio)
  // livelli: la lista dei livelli ({ nome, prezzo, icona }); comprati: a quale livello si è arrivati; pagato: monete già messe nel livello attuale
  // titolo: una parola piccola scritta sopra il nome di cosa si compra (es. 'PAVIMENTO'; '' = solo il nome);
  // larghezzaScritta: quanto è larga la scritta (metri), così non tocca le scritte e le insegne vicine;
  // raggio: quanto è grande il cerchio (di solito RAGGIO); iconaPrezzo: l'icona del numero che manca
  constructor(genitore, posizioni, livelli, comprati, pagato, titolo = '', larghezzaScritta = 2.5, raggio = RAGGIO, iconaPrezzo = 'moneta', altezzaScritta = ALTEZZA_SCRITTA) {
    this.raggio = raggio;           // quanto è grande il cerchio (metri)
    this.larghezzaScritta = larghezzaScritta;
    this.altezzaScritta = altezzaScritta; // quanto è alta la scritta (metri)
    this.sospeso = false;           // rimpicciolito per fare posto a un altro cerchio più grande (vedi sospendi)
    this.iconaPrezzo = iconaPrezzo; // l'icona accanto al numero che manca ('moneta', oppure 'legna' per la riparazione delle mura)
    this.posizioni = Array.isArray(posizioni) ? posizioni : livelli.map(() => posizioni);
    this.posizione = (this.posizioni[comprati] ?? this.posizioni[this.posizioni.length - 1]).clone();
    this.livelli = livelli;
    this.comprati = comprati;
    // se nel frattempo il prezzo è sceso sotto quanto già pagato, manca una sola moneta per finire
    this.pagato = this.livello ? Math.min(pagato, this.livello.prezzo - 1) : pagato;
    this.inArrivo = 0;    // soldi in volo verso il cerchio
    this.attesa = 0;      // secondi prima del prossimo volo di monete
    this.salto = 0;       // animazione quando si completa un livello (da 1 a 0)
    this.sparisce = false;
    this.trasloco = 0;    // animazione dello spostamento verso il posto del livello successivo (da 1 a 0)
    this.nascosto = false; // aspetta di essere sbloccato (es. i potenziamenti dei lavoratori)
    this.presenza = 1;    // 1 = si vede tutto, 0 = rimpicciolito e nascosto (per comparire e scomparire dolcemente)
    this.spento = false;  // grigio e trasparente, non si può comprare (es. durante il tutorial)
    this.inCantiere = false; // pagato: ci sono i lavori in corso (il cerchio sparisce finché non finiscono, vedi Segheria.iniziaCantiere)

    this.gruppo = new THREE.Group();
    this.gruppo.position.copy(this.posizione).setY(0.02);
    genitore.add(this.gruppo);
    const piatto = (geometria, colore, opacita, y) => {
      const mesh = new THREE.Mesh(
        geometria,
        new THREE.MeshBasicMaterial({ color: colore, transparent: true, opacity: opacita, depthWrite: false, side: THREE.DoubleSide })
      );
      mesh.rotation.x = -Math.PI / 2;
      mesh.position.y = y;
      mesh.userData.colore = colore;   // i colori veri, per tornare normale dopo essere stato spento
      mesh.userData.opacita = opacita;
      this.gruppo.add(mesh);
      return mesh;
    };
    piatto(new THREE.CircleGeometry(this.raggio, 48), 0x2f8f4a, 0.5, 0);                                 // fondo verde
    piatto(new THREE.RingGeometry(this.raggio - LARGHEZZA_BARRA, this.raggio, 64), 0x123d20, 0.85, 0.005);    // binario della barra
    this.barra = piatto(new THREE.BufferGeometry(), 0xffd23f, 1, 0.01);                             // barra che si riempie (oro, come le monete)
    piatto(new THREE.RingGeometry(this.raggio - 0.03, this.raggio + 0.04, 64), 0xe9ffe0, 0.9, 0.012);        // bordo chiaro

    // Icona e prezzo, disegnati su una tela appoggiata a terra
    this.tela = document.createElement('canvas');
    this.tela.width = 256;
    this.tela.height = 256;
    this.texture = new THREE.CanvasTexture(this.tela);
    this.texture.colorSpace = THREE.SRGBColorSpace;
    this.disegno = piatto(new THREE.PlaneGeometry(this.raggio * 1.5, this.raggio * 1.5), 0xffffff, 1, 0.015);
    this.disegno.material.map = this.texture;
    this.disegno.renderOrder = 1;

    // La scritta sopra il cerchio (verso il fondo della base): titolo della fila e nome di cosa si compra
    this.titolo = titolo;
    this.telaScritta = document.createElement('canvas');
    this.telaScritta.width = 512;
    this.telaScritta.height = Math.round((512 * this.altezzaScritta) / larghezzaScritta);
    this.textureScritta = new THREE.CanvasTexture(this.telaScritta);
    this.textureScritta.colorSpace = THREE.SRGBColorSpace;
    this.scritta = piatto(new THREE.PlaneGeometry(larghezzaScritta, this.altezzaScritta), 0xffffff, 1, 0.015);
    this.scritta.material.map = this.textureScritta;
    this.scritta.renderOrder = 1;
    this.sistemaScritta();

    this.ridisegna();
    this.aggiornaBarra();
    this.gruppo.visible = Boolean(this.livello);
  }

  // Il livello che si può comprare adesso (null = catena finita)
  get livello() {
    return this.livelli[this.comprati] ?? null;
  }

  get attivo() {
    return Boolean(this.livello) && !this.sparisce && this.trasloco <= 0 && !this.fuori && !this.spento;
  }

  // Il cerchio non si vede (nascosto, oppure sospeso per fare posto a un altro)
  get fuori() {
    return this.nascosto || this.sospeso || this.inCantiere;
  }

  // Toglie il cerchio di mezzo per un po' (si rimpicciolisce) e poi lo rimette com'era, senza suoni
  sospendi(si) {
    if (si === this.sospeso) return;
    this.sospeso = si;
    if (!si && this.livello && !this.nascosto) {
      this.gruppo.visible = true;
      this.salto = 1;
    }
  }

  // Il cerchio (o la sua scritta) tocca un cerchio più grande, di centro (cx, cz) e raggio r?
  occupa(cx, cz, r) {
    if (this.nascosto || !this.livello) return false;
    if (Math.hypot(this.posizione.x - cx, this.posizione.z - cz) < this.raggio + r) return true;
    const posto = this.posizioni[this.comprati] ?? this.posizioni[this.posizioni.length - 1];
    const zScritta = this.posizione.z + (posto.scrittaSotto ? 1 : -1) * (this.raggio + this.altezzaScritta / 2 + 0.05);
    // il punto della scritta (un rettangolo) più vicino al centro del cerchio grande
    const px = Math.min(Math.max(cx, this.posizione.x - this.larghezzaScritta / 2), this.posizione.x + this.larghezzaScritta / 2);
    const pz = Math.min(Math.max(cz, zScritta - this.altezzaScritta / 2), zScritta + this.altezzaScritta / 2);
    return Math.hypot(px - cx, pz - cz) < r;
  }

  // Spegne il cerchio (grigio e trasparente, non si compra) o lo riaccende con un saltello
  spegni(si) {
    if (si === this.spento) return;
    this.spento = si;
    for (const mesh of this.gruppo.children) {
      const colore = new THREE.Color(mesh.userData.colore);
      if (si) colore.setScalar(colore.r * 0.3 + colore.g * 0.59 + colore.b * 0.11); // grigio della stessa luminosità
      mesh.material.color.copy(colore);
      mesh.material.opacity = mesh.userData.opacita * (si ? 0.45 : 1);
    }
    this.ridisegna();
    if (!si) this.salto = 1;
  }

  // Nasconde il cerchio (si rimpicciolisce e sparisce) o lo fa ricomparire con un saltello.
  // subito: senza animazione (all'avvio)
  nascondi(si, subito = false, silenzioso = false) {
    if (si === this.nascosto) return;
    this.nascosto = si;
    if (subito) {
      this.presenza = si ? 0 : 1;
      this.gruppo.visible = !si && Boolean(this.livello);
    } else if (!si && this.livello) {
      this.gruppo.visible = true;
      this.salto = 1;
      if (!silenzioso) suoni.suona('nuovoCerchio'); // compare un nuovo cerchio da comprare
    }
  }

  contiene(posizione) {
    if (this.trasloco > 0) return false;
    return Math.hypot(posizione.x - this.posizione.x, posizione.z - this.posizione.z) < this.raggio;
  }

  // Quante gocce di monete servono per pagare un livello intero (Gruppo 7: le monete entrano nel cerchio una alla volta)
  static gocce(prezzo) {
    const M = CONFIG.miglioramenti;
    return Math.min(M.gocceMassime, Math.max(M.gocceMinime, Math.round(prezzo / M.monetePerGoccia)));
  }

  // Quanti soldi mandare nella prossima goccia (0 = niente da pagare adesso)
  prossimaRata(soldiInTasca, dt) {
    if (!this.attivo || this.livello.gratis) return 0;
    this.attesa -= dt;
    if (this.attesa > 0) return 0;
    const prezzo = this.livello.prezzo;
    const mancante = prezzo - this.pagato - this.inArrivo;
    const rata = Math.min(mancante, Math.floor(soldiInTasca), Math.ceil(prezzo / CerchioMiglioramento.gocce(prezzo)));
    if (rata <= 0) return 0;
    this.attesa = CONFIG.miglioramenti.intervalloGoccia;
    this.inArrivo += rata;
    return rata;
  }

  // Un livello gratuito (il venditore della legna): stando sul cerchio la barra si riempie con il tempo.
  // Restituisce true quando è piena.
  riempiGratis(dt) {
    if (!this.attivo || !this.livello.gratis) return false;
    this.pagato = Math.min(this.livello.prezzo, this.pagato + (dt / CONFIG.miglioramenti.tempoGratis) * this.livello.prezzo);
    this.aggiornaBarra();
    return this.pagato >= this.livello.prezzo;
  }

  // Parte il cantiere: il cerchio sparisce (si rimpicciolisce) finché non finiscono i lavori. Le monete sono già state pagate.
  iniziaCantiere() {
    this.inCantiere = true;
    this.pagato = 0;
    this.inArrivo = 0;
    this.aggiornaBarra();
  }

  // Finiti i lavori: il cerchio può passare al livello successivo (vedi passaAlSuccessivo) e ricompare
  finisciCantiere() {
    this.inCantiere = false;
    if (this.livello) this.gruppo.visible = true;
  }

  // Una rata è arrivata nel cerchio: restituisce true se il livello è pagato tutto
  riceviRata(rata) {
    this.inArrivo -= rata;
    this.pagato += rata;
    this.aggiornaBarra();
    this.ridisegna(); // il numero delle monete che mancano scende
    return this.pagato >= this.livello.prezzo;
  }

  // Il livello è comprato: si passa al successivo (o il cerchio sparisce).
  // prossimo: a quale livello passare (di solito quello dopo; una fila può saltare i passi già fatti)
  passaAlSuccessivo(prossimo = this.comprati + 1) {
    this.comprati = prossimo;
    this.pagato = 0;
    this.inArrivo = 0;
    this.salto = 1;
    if (this.livello) {
      const nuova = this.posizioni[this.comprati] ?? this.posizione;
      if (nuova.distanceTo(this.posizione) > 0.01) {
        this.trasloco = 1; // a metà animazione il cerchio cambia posto e disegno (vedi aggiorna)
        this.salto = 0;
      } else {
        this.ridisegna();
        this.aggiornaBarra();
      }
    } else {
      this.sparisce = true;
    }
  }

  // Le monete in volo atterrano al centro del cerchio
  puntoDiArrivo(tipo, risultato = new THREE.Vector3()) {
    return risultato.copy(this.posizione).setY(0.2);
  }

  aggiorna(dt) {
    this.presenza = THREE.MathUtils.clamp(this.presenza + (this.fuori ? -dt : dt) * 3, 0, 1);
    if (this.fuori) {
      this.gruppo.scale.setScalar(Math.max(0.001, this.presenza));
      if (this.presenza <= 0) {
        this.gruppo.visible = false;
        // si è nascosto mentre si spostava: quando ricompare è già nel posto nuovo
        if (this.trasloco > 0) {
          this.trasloco = 0;
          this.cambiaPosto();
        }
      }
      return;
    }
    if (!this.gruppo.visible) return;
    if (this.trasloco > 0) {
      // prima metà: si rimpicciolisce dove era; seconda metà: ricompare nel posto nuovo con il livello nuovo
      const primaMeta = this.trasloco > 0.5;
      this.trasloco = Math.max(0, this.trasloco - dt * 1.6);
      if (primaMeta && this.trasloco <= 0.5) this.cambiaPosto();
      this.gruppo.scale.setScalar(Math.max(0.001, Math.abs(this.trasloco - 0.5) * 2));
      if (this.trasloco <= 0) this.salto = 1;
      return;
    }
    this.salto = Math.max(0, this.salto - dt * 2.2);
    if (this.sparisce) {
      // si rimpicciolisce e sparisce
      this.gruppo.scale.setScalar(Math.max(0.001, this.salto));
      if (this.salto <= 0) this.gruppo.visible = false;
      return;
    }
    const s = 1 + Math.sin((1 - this.salto) * Math.PI * 3) * this.salto * 0.25;
    this.gruppo.scale.setScalar(Math.max(0.001, s * this.presenza));
  }

  // Il cerchio va nel posto del livello di adesso, con il suo disegno
  cambiaPosto() {
    this.posizione.copy(this.posizioni[this.comprati] ?? this.posizione);
    this.sistemaScritta();
    this.gruppo.position.copy(this.posizione).setY(0.02);
    this.ridisegna();
    this.aggiornaBarra();
  }

  // La barra circolare: parte dall'alto e gira come le lancette dell'orologio
  aggiornaBarra() {
    const quota = this.livello ? Math.min(1, this.pagato / this.livello.prezzo) : 0;
    this.barra.geometry.dispose();
    this.barra.geometry = quota > 0
      ? new THREE.RingGeometry(this.raggio - LARGHEZZA_BARRA, this.raggio, 64, 1, Math.PI / 2, -quota * Math.PI * 2)
      : new THREE.BufferGeometry();
  }

  // Icona grande in alto e, sotto, le monete che mancano (con l'icona della moneta); sopra il cerchio la scritta
  ridisegna() {
    this.ridisegnaScritta();
    const ctx = this.tela.getContext('2d');
    const { width: l, height: a } = this.tela;
    ctx.clearRect(0, 0, l, a);
    if (!this.livello) return;
    ctx.beginPath();
    ctx.arc(l / 2, 92, 66, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.fill();
    disegnaIcona(ctx, this.livello.icona, l / 2 - 52, 40, 104);

    const gratis = Boolean(this.livello.gratis);
    const testo = gratis ? 'GRATIS' : String(Math.max(0, Math.ceil(this.livello.prezzo - this.pagato)));
    ctx.font = '62px "Lilita One", "Arial Black", sans-serif';
    ctx.textBaseline = 'middle';
    const latoMoneta = gratis ? 0 : 50; // il livello gratuito non ha l'icona della moneta
    const larghezzaRiga = latoMoneta + (gratis ? 0 : 8) + ctx.measureText(testo).width;
    const inizio = (l - larghezzaRiga) / 2;
    if (!gratis) disegnaIcona(ctx, this.iconaPrezzo, inizio, 200 - latoMoneta / 2, latoMoneta);
    ctx.lineJoin = 'round';
    ctx.lineWidth = 10;
    ctx.strokeStyle = 'rgba(20,60,30,0.9)';
    ctx.strokeText(testo, inizio + latoMoneta + (gratis ? 0 : 8), 203);
    ctx.fillStyle = '#ffffff';
    ctx.fillText(testo, inizio + latoMoneta + (gratis ? 0 : 8), 203);
    if (this.spento) grigio(ctx); // cerchio spento: anche l'icona e il prezzo diventano grigi
    this.texture.needsUpdate = true;
  }

  // La scritta sta sopra il cerchio (verso il fondo della base), o sotto se il posto lo chiede (scrittaSotto)
  sistemaScritta() {
    const posto = this.posizioni[this.comprati] ?? this.posizioni[this.posizioni.length - 1];
    this.scritta.position.z = (posto.scrittaSotto ? 1 : -1) * (this.raggio + this.altezzaScritta / 2 + 0.05);
  }

  // La scritta a terra sopra il cerchio: il titolo piccolo (se c'è) e sotto il nome di cosa si compra
  ridisegnaScritta() {
    const ctx = this.telaScritta.getContext('2d');
    const { width: l, height: a } = this.telaScritta;
    ctx.clearRect(0, 0, l, a);
    if (!this.livello) return;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineJoin = 'round';
    const riga = (testo, y, grandezza, colore) => {
      let dimensione = grandezza;
      ctx.font = `${dimensione}px "Lilita One", "Arial Black", sans-serif`;
      const larga = ctx.measureText(testo).width;
      if (larga > l - 24) { // se non ci sta, si rimpicciolisce
        dimensione = Math.floor((dimensione * (l - 24)) / larga);
        ctx.font = `${dimensione}px "Lilita One", "Arial Black", sans-serif`;
      }
      ctx.lineWidth = dimensione * 0.2;
      ctx.strokeStyle = 'rgba(20,60,30,0.9)';
      ctx.strokeText(testo, l / 2, y);
      ctx.fillStyle = colore;
      ctx.fillText(testo, l / 2, y);
    };
    // la scritta è più alta che larga se il cerchio è stretto: i caratteri seguono l'altezza della tela
    if (this.titolo) riga(this.titolo, a * 0.27, Math.round(a * 0.3), '#ffd23f');
    riga(this.livello.etichetta ?? this.livello.nome, this.titolo ? a * 0.7 : a / 2, Math.round(a * 0.4), '#ffffff');
    if (this.spento) grigio(ctx);
    this.textureScritta.needsUpdate = true;
  }
}

// Rende grigio tutto quello che è disegnato su una tela (per i cerchi spenti)
function grigio(ctx) {
  const { width, height } = ctx.canvas;
  const immagine = ctx.getImageData(0, 0, width, height);
  const p = immagine.data;
  for (let i = 0; i < p.length; i += 4) p[i] = p[i + 1] = p[i + 2] = p[i] * 0.3 + p[i + 1] * 0.59 + p[i + 2] * 0.11;
  ctx.putImageData(immagine, 0, 0);
}
