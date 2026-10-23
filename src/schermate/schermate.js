// =====================================================================
//  SCHERMATE: tutto quello che si vede "sopra" il mondo 3D
//  - schermata iniziale e di fine corsa
//  - barra in alto della corsa (boscaioli, legna, carne, progresso)
//  - barra in alto della segheria (soldi, legna, carne) e suggerimenti
//  - il numero sopra la squadra e i testi volanti ("+12 legna", "-4")
// =====================================================================

import * as THREE from 'three';
import { formatta } from '../economia.js';

const $ = (id) => document.getElementById(id);

export class Schermate {
  constructor(telecamera) {
    this.telecamera = telecamera;
    this.testi = []; // testi volanti attivi
    this._v = new THREE.Vector3();
  }

  // La telecamera da usare per i testi volanti (cambia tra corsa e segheria)
  impostaTelecamera(telecamera) {
    this.telecamera = telecamera;
  }

  // Collega i pulsanti alle azioni del gioco
  quandoGioca(funzione) {
    $('pulsante-inizia').addEventListener('click', funzione);
  }

  quandoFineCorsa(funzione) {
    $('pulsante-ricomincia').addEventListener('click', funzione);
  }

  // Toglie eventuali testi volanti rimasti dalla scena precedente
  pulisciTesti() {
    for (const t of this.testi) t.elemento.remove();
    this.testi = [];
  }

  mostraCorsa() {
    $('schermata-inizio').classList.add('nascosto');
    $('schermata-fine').classList.add('nascosto');
    $('hud-segheria').classList.add('nascosto');
    $('suggerimento-segheria').classList.add('nascosto');
    $('hud').classList.remove('nascosto');
    $('contatore-squadra').classList.remove('nascosto');
    this.pulisciTesti();
  }

  mostraSegheria(conSuggerimento) {
    $('schermata-inizio').classList.add('nascosto');
    $('schermata-fine').classList.add('nascosto');
    $('hud').classList.add('nascosto');
    $('contatore-squadra').classList.add('nascosto');
    $('hud-segheria').classList.remove('nascosto');
    const suggerimento = $('suggerimento-segheria');
    suggerimento.classList.toggle('nascosto', !conSuggerimento);
    suggerimento.style.opacity = '1';
    this.pulisciTesti();
  }

  // Il suggerimento in basso svanisce quando il giocatore inizia a camminare
  nascondiSuggerimento() {
    const suggerimento = $('suggerimento-segheria');
    suggerimento.style.opacity = '0';
    setTimeout(() => suggerimento.classList.add('nascosto'), 700);
  }

  aggiornaSegheria({ soldi, legna, carne }) {
    this.aggiornaContatore('sg-soldi', soldi);
    this.aggiornaContatore('sg-legna', legna);
    this.aggiornaContatore('sg-carne', carne);
  }

  mostraFine(risultato) {
    $('hud').classList.add('nascosto');
    $('contatore-squadra').classList.add('nascosto');
    const dati = $('fine-dati');
    const riga = (nome, valore, classe = '') => `<div class="dato ${classe}"><span>${nome}</span><span>${valore}</span></div>`;

    if (risultato.vinto) {
      $('fine-titolo').textContent = 'Arrivati alla segheria!';
      $('fine-messaggio').textContent =
        risultato.moltiplicatore >= 5 ? 'Che scalata! Il bottino si moltiplica.' : 'Buona corsa! Con più boscaioli si sale più in alto.';
      dati.innerHTML =
        riga('🪓 Boscaioli arrivati', risultato.boscaioliArrivati) +
        riga('<i class="tronco"></i> Legna sul carro', risultato.legna) +
        riga('🍖 Carne sul carro', risultato.carne) +
        riga('⛰️ Gradino raggiunto', `x${risultato.moltiplicatore}`) +
        riga('Bottino totale', `${risultato.legnaFinale} legna · ${risultato.carneFinale} carne`, 'totale');
    } else {
      $('fine-titolo').textContent = 'Squadra sconfitta!';
      $('fine-messaggio').textContent =
        'Tutti i boscaioli sono caduti: il carico è andato perso. Scegli porte migliori ed evita rocce e lupi! Torna alla segheria e riprova.';
      dati.innerHTML =
        riga('<i class="tronco"></i> Legna persa', risultato.legnaPersa) + riga('🍖 Carne persa', risultato.carnePersa);
    }
    $('schermata-fine').classList.remove('nascosto');
  }

  // Aggiorna la barra in alto e il numero sopra la squadra
  aggiornaCorsa({ boscaioli, legna, carne, progresso, posizioneContatore }) {
    $('hud-boscaioli').textContent = boscaioli;
    this.aggiornaContatore('legna', legna);
    this.aggiornaContatore('carne', carne);
    $('hud-progresso').style.width = `${Math.round(progresso * 100)}%`;
    const contatore = $('contatore-squadra');
    contatore.textContent = boscaioli;
    const schermo = this.proietta(posizioneContatore);
    contatore.style.transform = `translate(${schermo.x}px, ${schermo.y}px) translate(-50%, -100%)`;
  }

  // Scrive un valore (legna, carne, soldi...); se è aumentato, il contatore fa un "pulse"
  aggiornaContatore(nome, valore) {
    const numero = $(`hud-${nome}`);
    const precedente = Number(numero.dataset.valore ?? 0);
    if (numero.dataset.valore !== undefined && precedente === valore) return;
    const aumentato = numero.dataset.valore !== undefined && valore > precedente;
    numero.dataset.valore = String(valore);
    numero.textContent = formatta(valore);
    if (aumentato) {
      const pillola = $(`pillola-${nome}`);
      pillola.classList.remove('pulse');
      void pillola.offsetWidth; // trucco per far ripartire l'animazione da capo
      pillola.classList.add('pulse');
    }
  }

  // Mostra un testo che sale e svanisce in un punto del mondo 3D
  testoVolante(x, y, z, testo, tipo = 'buono') {
    const elemento = document.createElement('div');
    elemento.className = `testo-volante ${tipo}`;
    elemento.textContent = testo;
    $('testi-mondo').appendChild(elemento);
    this.testi.push({ elemento, posizione: new THREE.Vector3(x, y, z), vita: 0 });
  }

  // Da chiamare a ogni fotogramma: muove i testi volanti
  aggiorna(dt) {
    for (const t of this.testi) {
      t.vita += dt;
      t.posizione.y += dt * 1.5;
      const schermo = this.proietta(t.posizione);
      const scala = t.vita < 0.15 ? 0.6 + t.vita * 3 : 1.05;
      t.elemento.style.transform = `translate(${schermo.x}px, ${schermo.y}px) translate(-50%, -50%) scale(${scala})`;
      t.elemento.style.opacity = String(Math.max(0, 1 - Math.max(0, t.vita - 0.7) / 0.5));
    }
    this.testi = this.testi.filter((t) => {
      if (t.vita > 1.2) {
        t.elemento.remove();
        return false;
      }
      return true;
    });
  }

  // Trasforma un punto del mondo 3D nella posizione sullo schermo (in pixel)
  proietta(punto) {
    this._v.copy(punto).project(this.telecamera);
    return {
      x: (this._v.x * 0.5 + 0.5) * window.innerWidth,
      y: (-this._v.y * 0.5 + 0.5) * window.innerHeight,
    };
  }
}
