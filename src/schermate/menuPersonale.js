// =====================================================================
//  MENU DEL PERSONALE (Gruppo 8)
//  Il pulsante rotondo sotto l'ingranaggio (nella base, quando c'è almeno un lavoratore a pagamento) apre un pannello come quello
//  delle impostazioni: il gioco sta in pausa. Una riga alta almeno 64 pixel per ogni lavoratore, con il nome, lo stato (Al lavoro,
//  In attesa di paga, Dorme, A casa, Licenziato), la paga al giorno e pulsanti grandi:
//   - Licenzia: chiede conferma con un secondo tocco ("Sicuro?", per 3 secondi) per non licenziare per sbaglio;
//   - Richiama (a casa, non pagato) o Assumi (licenziato): costa UNA paga (disabilitato se mancano le monete);
//   - Sveglia (solo se dorme): lo sveglia al volo.
//  In alto "Giorno N · paga a fine giornata: X monete (hai Y)". Il venditore della legna è gratuito e non si licenzia: compare in fondo
//  come riga informativa. La logica vera sta in Personale (src/segheria/personale.js): qui c'è solo il disegno e i tocchi.
// =====================================================================

const $ = (id) => document.getElementById(id);

const STATI = { lavora: 'Al lavoro', attesa: 'In attesa di paga', casa: 'A casa (non pagato)', licenziato: 'Licenziato' };

export class MenuPersonale {
  // segheria: il gioco della base; impostaPausa(aperto): mette il gioco in pausa (o lo riparte)
  constructor(segheria, impostaPausa) {
    this.segheria = segheria;
    this.impostaPausa = impostaPausa;
    this.menu = $('menu-personale');
    this.elenco = $('personale-elenco');
    this.aperto = false;
    this.conferma = null; // il lavoratore per cui si aspetta il secondo tocco di "Licenzia"
    this.timerConferma = null;
    $('pulsante-personale').addEventListener('click', () => this.apri());
    $('pulsante-chiudi-personale').addEventListener('click', () => this.chiudi());
    // toccando fuori dal riquadro, o con Esc, si chiude
    this.menu.addEventListener('click', (evento) => {
      if (evento.target === this.menu) this.chiudi();
    });
    window.addEventListener('keydown', (evento) => {
      if (evento.key === 'Escape' && this.aperto) this.chiudi();
    });
  }

  apri() {
    const s = this.segheria;
    if (this.aperto || !s.attiva || s.avvisi.attivo || s.schermoNero) return;
    this.aperto = true;
    this.menu.classList.remove('nascosto');
    this.impostaPausa(true);
    this.disegna();
  }

  chiudi() {
    if (!this.aperto) return;
    this.aperto = false;
    this.conferma = null;
    clearTimeout(this.timerConferma);
    this.menu.classList.add('nascosto');
    this.impostaPausa(false);
  }

  // Ridisegna tutto l'elenco (poche righe: nessun peso)
  disegna() {
    const s = this.segheria;
    const p = s.personale;
    $('personale-titolo-giorno').textContent = `Giorno ${s.giornata.giorno} · paga a fine giornata: ${p.totaleGiornaliero} monete (hai ${Math.floor(s.stato.soldi)})`;
    this.elenco.replaceChildren();
    for (const voce of p.elenco()) this.elenco.append(this.riga(voce, s.stato.soldi));
    // il venditore della legna: gratuito, sempre al lavoro
    const fisso = document.createElement('div');
    fisso.className = 'personale-riga personale-riga--fissa';
    const dormeLegna = Boolean(s.sportelli.legna.venditore?.dorme);
    fisso.innerHTML = '<div class="personale-info"><span class="personale-nome">Venditore legna</span><span class="personale-stato">' + (dormeLegna ? 'Dorme (Zzz)' : 'Gratis, sempre al lavoro') + '</span></div>';
    if (dormeLegna) {
      const azioni = document.createElement('div');
      azioni.className = 'personale-azioni';
      azioni.append(this.pulsante('Sveglia', 'pulsante-riga--sveglia', () => this.azione(() => s.riposo.sveglia('venditoreLegna'))));
      fisso.append(azioni);
    }
    this.elenco.append(fisso);
  }

  riga(voce, soldi) {
    const riga = document.createElement('div');
    riga.className = 'personale-riga';
    const info = document.createElement('div');
    info.className = 'personale-info';
    const nome = document.createElement('span');
    nome.className = 'personale-nome';
    nome.textContent = voce.nome;
    const stato = document.createElement('span');
    stato.className = `personale-stato personale-stato--${voce.stato}`;
    stato.textContent = voce.dorme ? 'Dorme (Zzz)' : STATI[voce.stato];
    const paga = document.createElement('span');
    paga.className = 'personale-paga';
    paga.textContent = `Paga: ${voce.paga} al giorno`;
    info.append(nome, stato, paga);
    const azioni = document.createElement('div');
    azioni.className = 'personale-azioni';
    if (voce.dorme) azioni.append(this.pulsante('Sveglia', 'pulsante-riga--sveglia', () => this.azione(() => this.segheria.riposo.sveglia(voce.chiave))));
    if (voce.stato === 'lavora' || voce.stato === 'attesa') {
      const sicuro = this.conferma === voce.chiave;
      azioni.append(this.pulsante(sicuro ? 'Sicuro?' : 'Licenzia', sicuro ? 'pulsante-riga--attenzione' : 'pulsante-riga--rosso', () => this.licenzia(voce.chiave)));
    } else {
      const manca = soldi < voce.paga;
      const testo = voce.stato === 'casa' ? 'Richiama' : 'Assumi';
      azioni.append(this.pulsante(`${testo} · ${voce.paga}`, 'pulsante-riga--verde', () => this.azione(() => this.segheria.personale.riassumi(voce.chiave)), manca));
    }
    riga.append(info, azioni);
    return riga;
  }

  pulsante(testo, classe, allaPressione, disabilitato = false) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = `pulsante-riga ${classe}`;
    b.textContent = testo;
    b.disabled = disabilitato;
    b.addEventListener('click', allaPressione);
    return b;
  }

  // Licenzia: il primo tocco chiede "Sicuro?", il secondo (entro 3 secondi) licenzia
  licenzia(chiave) {
    if (this.conferma !== chiave) {
      this.conferma = chiave;
      clearTimeout(this.timerConferma);
      this.timerConferma = setTimeout(() => {
        this.conferma = null;
        if (this.aperto) this.disegna();
      }, 3000);
      this.disegna();
      return;
    }
    this.conferma = null;
    clearTimeout(this.timerConferma);
    this.azione(() => this.segheria.personale.licenzia(chiave));
  }

  azione(fai) {
    fai();
    this.disegna();
  }
}
