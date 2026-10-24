// =====================================================================
//  CERCHIO DI UN MIGLIORAMENTO (verde, piatto a terra)
//  Dentro c'è un'icona grande di cosa si compra e sotto il prezzo con
//  la moneta. Quando il boscaiolo ci sta sopra, le monete volano dentro
//  e il bordo si riempie come una barra circolare. A pagamento finito il
//  cerchio fa un piccolo "salto" e mostra il livello successivo; quando
//  i livelli sono finiti sparisce.
//  Ogni cerchio è una "catena" di livelli (vedi CONFIG.miglioramenti).
//  Un livello può stare in un posto diverso dal precedente (es. la seconda
//  torretta è dall'altra parte della base): allora, dopo l'acquisto, il
//  cerchio si rimpicciolisce, si sposta lì e ricompare.
// =====================================================================

import * as THREE from 'three';
import { CONFIG } from '../config.js';
import { disegnaIcona } from '../modelli/materiali.js';

const RAGGIO = 1.2;           // come gli altri cerchi a terra (es. il deposito degli sportelli)
const LARGHEZZA_BARRA = 0.24; // spessore della barra circolare
const PASSI_PAGAMENTO = 12;   // in quanti "voli" di monete si paga un livello

export class CerchioMiglioramento {
  // posizioni: un punto, oppure un punto per ogni livello (da MAPPA.miglioramenti)
  // livelli: la catena da CONFIG.miglioramenti; comprati: quanti livelli sono già stati comprati; pagato: soldi già messi nel livello attuale
  constructor(genitore, posizioni, livelli, comprati, pagato) {
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
    piatto(new THREE.CircleGeometry(RAGGIO, 48), 0x2f8f4a, 0.5, 0);                                 // fondo verde
    piatto(new THREE.RingGeometry(RAGGIO - LARGHEZZA_BARRA, RAGGIO, 64), 0x123d20, 0.85, 0.005);    // binario della barra
    this.barra = piatto(new THREE.BufferGeometry(), 0xffd23f, 1, 0.01);                             // barra che si riempie (oro, come le monete)
    piatto(new THREE.RingGeometry(RAGGIO - 0.03, RAGGIO + 0.04, 64), 0xe9ffe0, 0.9, 0.012);        // bordo chiaro

    // Icona e prezzo, disegnati su una tela appoggiata a terra
    this.tela = document.createElement('canvas');
    this.tela.width = 256;
    this.tela.height = 256;
    this.texture = new THREE.CanvasTexture(this.tela);
    this.texture.colorSpace = THREE.SRGBColorSpace;
    this.disegno = piatto(new THREE.PlaneGeometry(RAGGIO * 1.5, RAGGIO * 1.5), 0xffffff, 1, 0.015);
    this.disegno.material.map = this.texture;
    this.disegno.renderOrder = 1;

    this.ridisegna();
    this.aggiornaBarra();
    this.gruppo.visible = Boolean(this.livello);
  }

  // Il livello che si può comprare adesso (null = catena finita)
  get livello() {
    return this.livelli[this.comprati] ?? null;
  }

  get attivo() {
    return Boolean(this.livello) && !this.sparisce && this.trasloco <= 0 && !this.nascosto && !this.spento;
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
  nascondi(si, subito = false) {
    if (si === this.nascosto) return;
    this.nascosto = si;
    if (subito) {
      this.presenza = si ? 0 : 1;
      this.gruppo.visible = !si && Boolean(this.livello);
    } else if (!si && this.livello) {
      this.gruppo.visible = true;
      this.salto = 1;
    }
  }

  contiene(posizione) {
    if (this.trasloco > 0) return false;
    return Math.hypot(posizione.x - this.posizione.x, posizione.z - this.posizione.z) < RAGGIO;
  }

  // Quanti soldi mandare nel prossimo volo (0 = niente da pagare adesso)
  prossimaRata(soldiInTasca, dt) {
    if (!this.attivo) return 0;
    this.attesa -= dt;
    if (this.attesa > 0) return 0;
    const prezzo = this.livello.prezzo;
    const mancante = prezzo - this.pagato - this.inArrivo;
    const rata = Math.min(mancante, Math.floor(soldiInTasca), Math.ceil(prezzo / PASSI_PAGAMENTO));
    if (rata <= 0) return 0;
    this.attesa = CONFIG.miglioramenti.tempoPagamento / PASSI_PAGAMENTO;
    this.inArrivo += rata;
    return rata;
  }

  // Una rata è arrivata nel cerchio: restituisce true se il livello è pagato tutto
  riceviRata(rata) {
    this.inArrivo -= rata;
    this.pagato += rata;
    this.aggiornaBarra();
    return this.pagato >= this.livello.prezzo;
  }

  // Il livello è comprato: si passa al successivo (o il cerchio sparisce)
  passaAlSuccessivo() {
    this.comprati += 1;
    this.pagato = 0;
    this.inArrivo = 0;
    this.salto = 1;
    if (this.livello) {
      const nuova = this.posizioni[this.comprati];
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
    this.presenza = THREE.MathUtils.clamp(this.presenza + (this.nascosto ? -dt : dt) * 3, 0, 1);
    if (this.nascosto) {
      this.gruppo.scale.setScalar(Math.max(0.001, this.presenza));
      if (this.presenza <= 0) this.gruppo.visible = false;
      return;
    }
    if (!this.gruppo.visible) return;
    if (this.trasloco > 0) {
      // prima metà: si rimpicciolisce dove era; seconda metà: ricompare nel posto nuovo con il livello nuovo
      const primaMeta = this.trasloco > 0.5;
      this.trasloco = Math.max(0, this.trasloco - dt * 1.6);
      if (primaMeta && this.trasloco <= 0.5) {
        this.posizione.copy(this.posizioni[this.comprati]);
        this.gruppo.position.copy(this.posizione).setY(0.02);
        this.ridisegna();
        this.aggiornaBarra();
      }
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

  // La barra circolare: parte dall'alto e gira come le lancette dell'orologio
  aggiornaBarra() {
    const quota = this.livello ? Math.min(1, this.pagato / this.livello.prezzo) : 0;
    this.barra.geometry.dispose();
    this.barra.geometry = quota > 0
      ? new THREE.RingGeometry(RAGGIO - LARGHEZZA_BARRA, RAGGIO, 64, 1, Math.PI / 2, -quota * Math.PI * 2)
      : new THREE.BufferGeometry();
  }

  // Icona grande in alto, prezzo con la moneta sotto
  ridisegna() {
    const ctx = this.tela.getContext('2d');
    const { width: l, height: a } = this.tela;
    ctx.clearRect(0, 0, l, a);
    if (!this.livello) return;
    ctx.beginPath();
    ctx.arc(l / 2, 92, 66, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.fill();
    disegnaIcona(ctx, this.livello.icona, l / 2 - 52, 40, 104);

    const testo = String(this.livello.prezzo);
    ctx.font = '62px "Lilita One", "Arial Black", sans-serif';
    ctx.textBaseline = 'middle';
    const latoMoneta = 50;
    const larghezzaRiga = latoMoneta + 8 + ctx.measureText(testo).width;
    const inizio = (l - larghezzaRiga) / 2;
    disegnaIcona(ctx, 'moneta', inizio, 200 - latoMoneta / 2, latoMoneta);
    ctx.lineJoin = 'round';
    ctx.lineWidth = 10;
    ctx.strokeStyle = 'rgba(20,60,30,0.9)';
    ctx.strokeText(testo, inizio + latoMoneta + 8, 203);
    ctx.fillStyle = '#ffffff';
    ctx.fillText(testo, inizio + latoMoneta + 8, 203);
    if (this.spento) {
      // cerchio spento: anche l'icona e il prezzo diventano grigi
      const immagine = ctx.getImageData(0, 0, l, a);
      const p = immagine.data;
      for (let i = 0; i < p.length; i += 4) p[i] = p[i + 1] = p[i + 2] = p[i] * 0.3 + p[i + 1] * 0.59 + p[i + 2] * 0.11;
      ctx.putImageData(immagine, 0, 0);
    }
    this.texture.needsUpdate = true;
  }
}
