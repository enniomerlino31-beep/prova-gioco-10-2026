// =====================================================================
//  SUONI E MUSICA (Fase 4)
//  Tutti i suoni sono file audio veri, con licenza CC0 (liberi da diritti),
//  in public/suoni/ (da dove vengono: CREDITI-SUONI.md). Sono morbidi e
//  realistici, puliti e chiari (niente filtri, eco o riverbero) e con il volume già pareggiato.
//  - suoni.suona('nome') fa partire un effetto (l'elenco è in EFFETTI; se un
//    effetto ha più file, ne sceglie uno a caso, così non è sempre uguale).
//    Ogni effetto ha un limite: non riparte prima di "pausa" secondi e non ne
//    suonano più di "insieme" alla volta; in fondo c'è un compressore che tiene
//    il volume moderato anche con tanti lupi, frecce e monete.
//  - suoni.ciclo('nome') dà un suono che si ripete senza stacchi (passi della
//    squadra, carro), con il suo volume regolabile.
//  - suoni.musica('nome') fa partire una musica di sottofondo (sfuma dolcemente
//    nell'altra); le musiche si caricano dopo l'avvio, così l'apertura resta veloce.
//  - Sul telefono il browser fa partire l'audio solo dopo il primo tocco:
//    suoni.sblocca() viene chiamata a ogni tocco o tasto (vedi ascoltaTocchi).
//  - Musica ed effetti si accendono e spengono ognuno per conto suo; la scelta
//    resta salvata nelle impostazioni (memoria separata dalla partita).
// =====================================================================

import { CONFIG } from '../config.js';

const CHIAVE_IMPOSTAZIONI = 'segheria-assediata-impostazioni';
const CARTELLA = `${import.meta.env.BASE_URL}suoni/`;
// I volumi generali stanno in config.js (CONFIG.audio); la musica non supera mai una parte del volume degli effetti
const VOLUME_EFFETTI = CONFIG.audio.volumeEffetti;
const VOLUME_MUSICA = Math.min(CONFIG.audio.volumeMusica, CONFIG.audio.volumeEffetti * CONFIG.audio.musicaSottoEffetti);
const VOCI_MASSIME = 16;     // effetti che possono suonare insieme in tutto
const ANTICIPO = 3;             // quanti secondi prima si preparano le ripetizioni dei suoni continui (così un rallentamento del gioco non li interrompe)
const SFUMATURA_CICLO = 0.6; // secondi in cui una ripetizione di un ciclo sfuma nella successiva
const SFUMATURA_CAMBIO = 2;   // secondi in cui una musica sfuma e l'altra sale (quando arriva o muore il lupo gigante)
const SFUMATURA_MUSICA = 1;   // secondi in cui la fine della musica sfuma nell'inizio della ripetizione (breve, senza stacchi né silenzi)

// I file di ogni effetto (più file = uno a caso), il volume (0-1), la pausa minima tra due uguali (s) e quanti
// uguali al massimo insieme. varia: di quanto può cambiare a caso il tono (0.05 = ±5%), per non stancare l'orecchio
const tanti = (nome, n) => Array.from({ length: n }, (_, i) => `${nome}-${i + 1}`);
const EFFETTI = {
  // --- Base ---
  passoNeve: { file: tanti('passo-neve', 4), volume: 0.39, pausa: 0.08, insieme: 2, varia: 0.04 },
  passoPietra: { file: tanti('passo-pietra', 4), volume: 0.34, pausa: 0.08, insieme: 2, varia: 0.04 },
  ascia: { file: tanti('ascia', 2), volume: 0.94, pausa: 0.05, insieme: 3, varia: 0.04 },
  lupoMuore: { file: ['lupo-muore'], volume: 0.68, pausa: 0.15, insieme: 2, varia: 0.04 },
  morso: { file: tanti('morso', 3), volume: 0.51, pausa: 0.25, insieme: 2, varia: 0.04 },
  morsoGigante: { file: ['morso-gigante'], volume: 0.77, pausa: 0.4, insieme: 1, varia: 0.04 },
  ululato: { file: ['ululato'], volume: 0.94, pausa: 3, insieme: 1 },
  monete: { file: tanti('monete', 2), volume: 0.77, pausa: 0.12, insieme: 2, varia: 0.04 },
  vendita: { file: ['vendita'], volume: 0.51, pausa: 0.2, insieme: 2, varia: 0.04 },
  mancia: { file: ['mancia'], volume: 0.59, pausa: 0.2, insieme: 2, varia: 0.04 },
  pagamento: { file: tanti('pagamento', 3), volume: 0.51, pausa: 0.07, insieme: 2, varia: 0.04 },
  acquisto: { file: ['acquisto'], volume: 0.68, pausa: 0.4, insieme: 1 },
  legnaSchiena: { file: ['legna-schiena'], volume: 0.51, pausa: 0.12, insieme: 2, varia: 0.04 },
  carneSchiena: { file: ['carne-schiena'], volume: 0.59, pausa: 0.12, insieme: 2, varia: 0.04 },
  legnaDeposito: { file: ['legna-deposito'], volume: 0.51, pausa: 0.12, insieme: 2, varia: 0.04 },
  carneDeposito: { file: ['carne-deposito'], volume: 0.59, pausa: 0.12, insieme: 2, varia: 0.04 },
  cancelloApre: { file: ['cancello-apre'], volume: 0.35, pausa: 0.5, insieme: 2, varia: 0.03 },
  cancelloChiude: { file: ['cancello-chiude'], volume: 0.3, pausa: 0.5, insieme: 2, varia: 0.03 },
  slitta: { file: ['slitta'], volume: 0.59, pausa: 2, insieme: 1 },
  passoGigante: { file: ['passo-gigante'], volume: 0.7, pausa: 0.5, insieme: 1, varia: 0.05 }, // tonfo di un passo del lupo gigante
  cerchioRiparazione: { file: ['cerchio-riparazione'], volume: 0.7, pausa: 2, insieme: 1 },  // compare il cerchio verde per riparare le mura
  riparazioneMura: { file: ['riparazione-mura'], volume: 0.8, pausa: 2, insieme: 1 },      // le mura sono state riparate con la legna
  allarmeMura: { file: ['allarme-mura'], volume: 0.6, pausa: 10, insieme: 1 },                // le mura stanno cedendo
  muraCadute: { file: ['mura-cadute'], volume: 0.9, pausa: 5, insieme: 1 },                   // le mura sono crollate
  tronchiCatasta: { file: ['tronchi-catasta'], volume: 0.68, pausa: 0.5, insieme: 1 },
  // --- Costruzioni ---
  costruisciLegno: { file: tanti('costruisci-legno', 3), volume: 0.68, pausa: 0.15, insieme: 2, varia: 0.04 },
  costruisciPietra: { file: tanti('costruisci-pietra', 3), volume: 0.68, pausa: 0.15, insieme: 2, varia: 0.04 },
  costruisciMetallo: { file: tanti('costruisci-metallo', 3), volume: 0.51, pausa: 0.15, insieme: 2, varia: 0.04 },
  armatura: { file: ['armatura'], volume: 0.68, pausa: 0.3, insieme: 2, varia: 0.04 },
  lastra: { file: tanti('lastra', 2), volume: 0.59, pausa: 0.2, insieme: 2, varia: 0.04 },
  comparsa: { file: ['comparsa'], volume: 0.59, pausa: 0.2, insieme: 2, varia: 0.04 },
  // --- Corsa ---
  taglio: { file: tanti('taglio', 3), volume: 0.85, pausa: CONFIG.audio.colpiTaglio, insieme: 2, varia: 0.05 }, // ascia sul legno dell'albero
  grido: { file: tanti('grido', 6), volume: 0.8, pausa: CONFIG.audio.pausaGrida, insieme: 1, varia: 0.04 }, // incitamento allegro dei boscaioli
  portaBuona: { file: ['porta-buona'], volume: 0.68, pausa: 0.3, insieme: 1 },
  portaCattiva: { file: ['porta-cattiva'], volume: 0.59, pausa: 0.3, insieme: 1 },
  albero: { file: ['albero'], volume: 0.68, pausa: 0.15, insieme: 2, varia: 0.04 },
  perso: { file: ['perso'], volume: 0.59, pausa: 0.1, insieme: 3, varia: 0.04 },
  gradino: { file: tanti('gradino', 3), volume: 0.51, pausa: 0.1, insieme: 2, varia: 0.04 },
  restaIndietro: { file: ['resta-indietro'], volume: 0.59, pausa: 0.2, insieme: 1, varia: 0.04 },
  vittoria: { file: ['vittoria'], volume: 0.77, pausa: 1, insieme: 1 },
  sconfitta: { file: ['sconfitta'], volume: 0.68, pausa: 1, insieme: 1 },
  // --- Menu e feste ---
  clic: { file: ['clic'], volume: 0.68, pausa: 0.05, insieme: 2 },
  nuovoCerchio: { file: ['nuovo-cerchio'], volume: 0.51, pausa: 0.4, insieme: 1 },
  festa: { file: ['festa'], volume: 0.77, pausa: 1, insieme: 1 },
};
// Suoni che si ripetono (cicli) e musiche
const CICLI = { corsaNeve: 'corsa-neve', corsaNeveTanti: 'corsa-neve-tanti', carro: 'carro' };
// Una sola musica per tutto il gioco: passando dalla base alla corsa (e ritorno) continua senza ripartire
// "paura" è la musica inquietante del lupo gigante (vedi impostaPaura): sfuma al posto della musica normale e poi torna
const MUSICHE = { base: 'musica', corsa: 'musica', paura: 'musica-paura' };

// Curve della dissolvenza a potenza costante (seno e coseno)
const CURVA_ENTRATA = Float32Array.from({ length: 64 }, (_, i) => Math.sin((i / 63) * Math.PI / 2));
const CURVA_USCITA = Float32Array.from({ length: 64 }, (_, i) => Math.cos((i / 63) * Math.PI / 2));

class Suoni {
  constructor() {
    const impostazioni = leggiImpostazioni();
    this.conMusica = impostazioni.musica;
    this.conEffetti = impostazioni.effetti;
    this.contesto = null;           // l'AudioContext, creato al primo tocco
    this.dati = new Map();          // nome del file -> ArrayBuffer scaricato (o la promessa del download)
    this.buffer = new Map();        // nome del file -> AudioBuffer pronto da suonare
    this.ultimo = {};               // effetto -> quando è partito l'ultimo
    this.fini = {};                 // effetto -> quando finiscono quelli che stanno suonando
    this.fineVoci = [];             // quando finiscono tutti gli effetti che stanno suonando
    this.cicli = [];                // i cicli e le musiche che stanno suonando
    this.musicaVoluta = null;       // quale musica deve suonare ('base', 'corsa' o null)
    this.musicaAttuale = null;      // { file, ciclo }
    this.paura = false;             // c'è il lupo gigante: al posto della musica normale suona quella inquietante
    this.ultimoTentativo = 0;       // quando si è provato l'ultima volta a far ripartire l'audio fermato dal browser
    this.inPausa = false;           // menu delle impostazioni aperto: gli effetti tacciono, la musica continua
  }

  // Scarica gli effetti subito (sono piccoli) e le musiche un po' dopo l'avvio
  carica() {
    const effetti = [...Object.values(EFFETTI).flatMap((e) => e.file), ...Object.values(CICLI)];
    for (const nome of effetti) this.scarica(nome);
    setTimeout(() => Object.values(MUSICHE).forEach((nome) => this.scarica(nome)), 2500);
  }

  scarica(nome) {
    if (this.dati.has(nome)) return this.dati.get(nome);
    const promessa = fetch(`${CARTELLA}${nome}.mp3`)
      .then((risposta) => (risposta.ok ? risposta.arrayBuffer() : null))
      .catch(() => null);
    this.dati.set(nome, promessa);
    promessa.then((dati) => {
      this.dati.set(nome, dati);
      if (this.contesto) this.decodifica(nome);
    });
    return promessa;
  }

  // Trasforma il file scaricato in suono pronto (serve l'AudioContext, quindi dopo il primo tocco)
  decodifica(nome) {
    const dati = this.dati.get(nome);
    if (!(dati instanceof ArrayBuffer) || this.buffer.has(nome)) return;
    this.buffer.set(nome, null); // in corso
    this.contesto.decodeAudioData(dati.slice(0)).then((b) => this.buffer.set(nome, b)).catch(() => this.buffer.delete(nome));
  }

  // Crea (o fa ripartire) l'audio: va chiamata durante un tocco o un tasto, altrimenti il browser non lo permette
  sblocca() {
    try {
      if (!this.contesto) {
        const Contesto = window.AudioContext || window.webkitAudioContext;
        if (!Contesto) return;
        this.contesto = new Contesto();
        this.preparaUscite();
        for (const nome of this.dati.keys()) this.decodifica(nome);
      }
      if (this.contesto.state !== 'running') this.contesto.resume();
    } catch {
      // niente audio su questo dispositivo: il gioco funziona lo stesso
    }
  }

  // Due uscite: gli effetti (con il compressore, così tanti suoni insieme non fanno un rumore forte) e la musica
  preparaUscite() {
    const c = this.contesto;
    this.uscitaEffetti = c.createGain();
    this.uscitaEffetti.gain.value = this.volumeEffettiVoluto;
    const compressore = c.createDynamicsCompressor();
    compressore.threshold.value = -14;
    compressore.ratio.value = 3;
    this.uscitaEffetti.connect(compressore);
    compressore.connect(c.destination);
    this.uscitaMusica = c.createGain();
    this.uscitaMusica.gain.value = this.conMusica ? VOLUME_MUSICA : 0;
    this.uscitaMusica.connect(c.destination);
  }

  get volumeEffettiVoluto() {
    return this.conEffetti && !this.inPausa ? VOLUME_EFFETTI : 0;
  }

  // Il gioco è in pausa (menu aperto): gli effetti e i suoni continui tacciono subito, la musica va avanti
  mettiInPausa(pausa) {
    this.inPausa = pausa;
    if (this.uscitaEffetti) this.uscitaEffetti.gain.setTargetAtTime(this.volumeEffettiVoluto, this.contesto.currentTime, 0.05);
  }

  get pronto() {
    return this.contesto?.state === 'running';
  }

  // Accende o spegne la musica o gli effetti (e lo ricorda)
  impostaMusica(acceso) {
    this.conMusica = acceso;
    salvaImpostazioni({ musica: acceso });
    if (this.uscitaMusica) this.uscitaMusica.gain.setTargetAtTime(acceso ? VOLUME_MUSICA : 0, this.contesto.currentTime, 0.3);
  }

  impostaEffetti(acceso) {
    this.conEffetti = acceso;
    salvaImpostazioni({ effetti: acceso });
    if (this.uscitaEffetti) this.uscitaEffetti.gain.setTargetAtTime(this.volumeEffettiVoluto, this.contesto.currentTime, 0.05);
  }

  // Fa partire un effetto, se gli effetti sono accesi e se non ce ne sono già troppi uguali.
  // volume: da moltiplicare al suo (es. 0.5 = a metà); ritardo: tra quanti secondi
  suona(nome, { volume = 1, ritardo = 0 } = {}) {
    const effetto = EFFETTI[nome];
    if (!effetto || !this.conEffetti || this.inPausa || !this.pronto) return;
    const c = this.contesto;
    const adesso = c.currentTime;
    const inizio = adesso + ritardo;
    if (Math.abs(inizio - (this.ultimo[nome] ?? -Infinity)) < effetto.pausa) return;
    const fini = (this.fini[nome] ?? []).filter((fine) => fine > adesso);
    this.fineVoci = this.fineVoci.filter((fine) => fine > adesso);
    if (fini.length >= effetto.insieme || this.fineVoci.length >= VOCI_MASSIME) return;
    const file = effetto.file[Math.floor(Math.random() * effetto.file.length)];
    const buffer = this.buffer.get(file);
    if (!buffer) return; // non ancora caricato
    const sorgente = c.createBufferSource();
    sorgente.buffer = buffer;
    if (effetto.varia) sorgente.playbackRate.value = 1 + (Math.random() * 2 - 1) * effetto.varia;
    const g = c.createGain();
    g.gain.value = effetto.volume * volume;
    sorgente.connect(g);
    g.connect(this.uscitaEffetti);
    sorgente.start(inizio);
    const fine = inizio + buffer.duration / sorgente.playbackRate.value;
    this.ultimo[nome] = inizio;
    fini.push(fine);
    this.fini[nome] = fini;
    this.fineVoci.push(fine);
  }

  // Un suono che si ripete senza stacchi (passi della squadra, carro): il volume si cambia con ciclo.volume(v)
  ciclo(nome) {
    const ciclo = new Ciclo(this, CICLI[nome], () => this.uscitaEffetti, SFUMATURA_CICLO);
    this.cicli.push(ciclo);
    return ciclo;
  }

  // Con il lupo gigante in giro (true) la musica normale sfuma e parte quella inquietante; quando non c'è più (false)
  // sfuma e torna la normale. Se la musica è spenta dalle impostazioni non si sente niente, come sempre.
  impostaPaura(acceso) {
    this.paura = acceso;
  }

  // Quale musica suona: 'base', 'corsa' (o null = nessuna). Passa dolcemente da una all'altra.
  musica(nome) {
    this.musicaVoluta = nome;
  }

  // Da chiamare a ogni fotogramma: prepara le prossime ripetizioni dei cicli e cambia musica se serve
  aggiorna() {
    // Se il browser ha messo in pausa l'audio (succede, per esempio, sul telefono), ogni tanto si prova a farlo ripartire
    if (this.contesto && this.contesto.state !== 'running' && performance.now() - this.ultimoTentativo > 1000) {
      this.ultimoTentativo = performance.now();
      this.contesto.resume?.().catch(() => {});
    }
    if (!this.pronto) return;
    // si cambia musica solo se il FILE è diverso: base e corsa usano lo stesso, quindi non ci sono né riavvii né interruzioni
    const voluta = this.paura ? 'paura' : this.musicaVoluta;
    const fileVoluto = voluta ? MUSICHE[voluta] : null;
    if (fileVoluto && !this.buffer.get(fileVoluto)) this.decodifica(fileVoluto); // il nuovo brano deve essere pronto prima di cambiare
    if (fileVoluto !== (this.musicaAttuale?.file ?? null) && (!fileVoluto || this.buffer.get(fileVoluto))) {
      this.musicaAttuale?.ciclo.ferma(SFUMATURA_CAMBIO);
      this.musicaAttuale = null;
      if (this.musicaVoluta) {
        const ciclo = new Ciclo(this, fileVoluto, () => this.uscitaMusica, SFUMATURA_MUSICA);
        ciclo.volume(1, SFUMATURA_CAMBIO);
        this.cicli.push(ciclo);
        this.musicaAttuale = { file: fileVoluto, ciclo };
      }
    }
    for (const ciclo of this.cicli) ciclo.aggiorna();
    this.cicli = this.cicli.filter((ciclo) => !ciclo.finito);
  }
}

// Un suono che si ripete: ogni ripetizione parte un po' prima della fine della precedente e le due sfumano
// l'una nell'altra, così non si sente lo stacco. Ha il suo volume (che può cambiare dolcemente).
class Ciclo {
  constructor(suoni, file, uscita, sfumatura) {
    this.suoni = suoni;
    this.file = file;
    this.sfumatura = sfumatura;
    this.prossimo = null;   // quando parte la prossima ripetizione
    this.finito = false;
    this.fermo = false;
    const c = suoni.contesto;
    this.uscita = uscita;
    this.guadagno = c ? c.createGain() : null;
    this.voluto = 0;
    if (this.guadagno) {
      this.guadagno.gain.value = 0;
      this.guadagno.connect(uscita());
    }
    suoni.scarica(file);
  }

  // Cambia il volume (0-1) dolcemente in "tempo" secondi
  volume(v, tempo = 0.3) {
    if (Math.abs(v - this.voluto) < 0.01) return;
    this.voluto = v;
    if (!this.guadagno) return; // l'audio non è ancora sbloccato: il volume si applica appena c'è (vedi aggiorna)
    const c = this.suoni.contesto;
    this.guadagno.gain.setTargetAtTime(v, c.currentTime, tempo / 3);
  }

  // Si spegne dolcemente e poi smette
  ferma(tempo = 0.5) {
    if (!this.guadagno) {
      this.finito = true;
      return;
    }
    this.volume(0, tempo);
    this.fermo = true;
    this.fineFermata = this.suoni.contesto.currentTime + tempo * 1.7; // il volume scende piano: si stacca solo quando è davvero a zero
  }

  aggiorna() {
    const c = this.suoni.contesto;
    if (!this.guadagno) {
      // creato prima che l'audio fosse sbloccato: si collega adesso
      this.guadagno = c.createGain();
      this.guadagno.gain.value = 0;
      this.guadagno.connect(this.uscita());
      const v = this.voluto;
      this.voluto = 0;
      this.volume(v);
    }
    if (this.fermo) {
      if (c.currentTime >= this.fineFermata) {
        this.finito = true;
        this.guadagno.disconnect();
      }
      return;
    }
    if (this.voluto <= 0 && this.prossimo === null) return; // non serve partire finché è muto
    const buffer = this.suoni.buffer.get(this.file);
    if (!buffer) {
      this.suoni.decodifica(this.file);
      return;
    }
    if (this.prossimo === null || this.prossimo < c.currentTime) this.prossimo = c.currentTime + 0.05; // se si è rimasti indietro (fotogramma molto lento) si riparte da adesso

    const s = Math.min(this.sfumatura, buffer.duration / 3);
    while (this.prossimo < c.currentTime + ANTICIPO) {
      const sorgente = c.createBufferSource();
      sorgente.buffer = buffer;
      const g = c.createGain();
      const t = this.prossimo;
      // dissolvenza a potenza costante: l'ingresso della nuova ripetizione e l'uscita della vecchia si sommano senza buchi di volume
      g.gain.setValueAtTime(0, t);
      g.gain.setValueCurveAtTime(CURVA_ENTRATA, t, s);
      g.gain.setValueCurveAtTime(CURVA_USCITA, t + buffer.duration - s, s);
      sorgente.connect(g);
      g.connect(this.guadagno);
      sorgente.start(t);
      sorgente.stop(t + buffer.duration + 0.05);
      this.prossimo = t + buffer.duration - s;
    }
  }
}

function leggiImpostazioni() {
  try {
    const salvate = JSON.parse(localStorage.getItem(CHIAVE_IMPOSTAZIONI) ?? '{}');
    // "audio" è l'impostazione di prima (un solo pulsante): spento = musica ed effetti spenti
    const audio = salvate.audio !== false;
    return { musica: salvate.musica ?? audio, effetti: salvate.effetti ?? audio };
  } catch {
    return { musica: true, effetti: true };
  }
}

function salvaImpostazioni(cambiate) {
  try {
    const salvate = JSON.parse(localStorage.getItem(CHIAVE_IMPOSTAZIONI) ?? '{}');
    localStorage.setItem(CHIAVE_IMPOSTAZIONI, JSON.stringify({ ...salvate, ...cambiate }));
  } catch {
    // niente da fare: l'impostazione vale fino alla chiusura della pagina
  }
}

export const suoni = new Suoni();

// A ogni tocco, clic o tasto l'audio viene sbloccato (o fatto ripartire, es. sul telefono dopo aver cambiato app)
export function ascoltaTocchi() {
  for (const evento of ['pointerdown', 'touchend', 'click', 'keydown']) {
    window.addEventListener(evento, () => suoni.sblocca(), { capture: true, passive: true });
  }
}
