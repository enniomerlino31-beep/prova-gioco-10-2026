// =====================================================================
//  GUADAGNI MENTRE SI È VIA (Fase 5)
//  Quando si riapre il gioco, la base ha continuato a lavorare:
//   - il boscaiolo secondario ha portato la sua legna sulla catasta, a ogni giro;
//   - l'aiutante ha portato QUELLA legna dalla catasta allo sportello LEGNA;
//   - i venditori hanno venduto ai clienti quella legna e la carne già sul tavolo della carne.
//  REGOLA (decisa dall'utente): mentre si è via si vende SOLO la legna portata dal boscaiolo
//  secondario (e la carne già sul tavolo). La legna delle corse (nella catasta o sul banco) non si
//  vende e resta dov'è: altrimenti con tanta legna si guadagnerebbero migliaia di monete all'ora
//  invece di circa 1.000. I ritmi sono quelli del gioco vero (vedi ritmi). Senza aiutante la legna
//  del secondario resta nella catasta; senza venditori non si vende niente. I lupi non fanno danni e i
//  cacciatori non portano carne nuova (si vende solo quella già sul tavolo).
//  Sotto "minimoMinuti" di assenza non succede niente; oltre "massimoOre"
//  non succede più niente (CONFIG.offline).
// =====================================================================

import { CONFIG } from '../config.js';
import { registraVendita } from '../economia.js';
import { MAPPA } from './ambiente.js';
import { ZONA_Z, SPAZIO_FILA } from './sportello.js';
import { durataGiro } from './secondario.js';

const VOLO_AIUTANTE = 0.4; // secondi del volo della legna, quando l'aiutante la prende e quando la scarica (aiutante.js)

// Quanti secondi si è stati via: dall'ultimo salvataggio (stato.orologio, in millisecondi) ad adesso, più i
// minuti finti di ?offline=N. Se l'orologio del telefono è andato indietro (o il numero è strano) vale 0:
// l'orario salvato resta il più avanti mai visto (vedi salvaOra), così lo stesso tempo non si guadagna due volte.
export function secondiDiAssenza(stato, adesso, minutiFinti = 0) {
  const ultimo = Number(stato.orologio);
  let secondi = Number.isFinite(ultimo) && ultimo > 0 ? (adesso - ultimo) / 1000 : 0;
  if (!Number.isFinite(secondi) || secondi < 0) secondi = 0;
  const finti = Number(minutiFinti);
  if (Number.isFinite(finti) && finti > 0) secondi += finti * 60;
  return secondi;
}

// Quanto riescono a fare al secondo i lavoratori e i clienti, con i ritmi del gioco (unità al secondo).
// rapidita: quanto sono veloci i clienti (1 = ritmo normale; "Venditore svelto" e "esperto" la alzano)
// conCarne: c'è anche il venditore della carne (solo allora una parte dei clienti vuole carne)
export function ritmi(rapidita, conCarne = true) {
  const c = CONFIG.clienti;
  const unitaPerCliente = (c.acquistoMinimo + c.acquistoMassimo) / 2;
  // i clienti arrivano in media ogni (min+max)/2 secondi, divisi per la rapidità del venditore...
  const arrivi = rapidita / ((c.intervalloMinimo + c.intervalloMassimo) / 2);
  // ...e allo sportello ognuno aspetta, prende i suoi pezzi uno alla volta e poi il prossimo avanza di un posto
  const pezzi = Math.ceil(unitaPerCliente / CONFIG.segheria.unitaPerPezzo);
  const alBancone = (c.tempoAcquisto + (pezzi - 1) * c.intervalloPezzi) / rapidita + SPAZIO_FILA / c.velocita;
  const clienti = (parte) => Math.min(arrivi * parte, 1 / alBancone); // clienti al secondo serviti da uno sportello
  // l'aiutante va avanti e indietro tra la catasta e il deposito dello sportello LEGNA
  const puntoCatasta = MAPPA.catasta.z + 1;
  const puntoSportello = MAPPA.sportelli.legna.z + ZONA_Z;
  const giroAiutante = (2 * Math.abs(puntoSportello - puntoCatasta)) / CONFIG.segheria.velocitaAiutante + 2 * VOLO_AIUTANTE;
  return {
    unitaPerCliente,
    legna: clienti(conCarne ? 1 - c.probabilitaCarne : 1) * unitaPerCliente,
    carne: clienti(conCarne ? c.probabilitaCarne : 0) * unitaPerCliente,
    aiutante: CONFIG.lavoratori.caricoMassimo / giroAiutante,
  };
}

// Fa lavorare la base per "secondi" secondi (già limitati dal chiamante) e cambia lo stato salvato:
// catasta, banconi, giro del boscaiolo secondario, vendite. Restituisce cosa è successo:
// { legnaPortata, legnaVenduta, carneVenduta, monete } (le monete NON sono ancora date: vedi segheria.js)
export function lavoroOffline(stato, secondi) {
  const m = stato.miglioramenti;
  const conSecondario = (m.boscaioloSecondario?.comprati ?? 0) > 0;
  const conAiutante = (m.aiutante?.comprati ?? 0) > 0;
  // Gruppo 7: si vende solo dove c'è il venditore: la legna con quello della legna (gratuito), la carne con quello della carne
  const vendeLegna = (m.venditoreLegna?.comprati ?? 0) > 0;
  const vendeCarne = (m.venditore?.comprati ?? 0) > 0;
  const livelloVenditore = CONFIG.miglioramenti.venditore[(m.venditore?.comprati ?? 0) - 1] ?? null;
  const ritmo = vendeLegna || vendeCarne ? ritmi(livelloVenditore?.rapidita ?? 1, vendeCarne) : null;

  // solo la legna del secondario può essere venduta: "inCatasta" è quella che l'aiutante deve ancora portare,
  // "sulBanco" quella già sul banco (la legna vera della catasta e del banco non si tocca)
  let inCatasta = 0;
  let sulBanco = 0;
  let carneBanco = stato.sportelli.carne;
  let mancano = Number.isFinite(stato.secondarioMancano) ? stato.secondarioMancano : durataGiro();
  let legnaPortata = 0;
  let legnaVenduta = 0;
  let carneVenduta = 0;
  const passo = CONFIG.offline.passo;
  for (let t = 0; t < secondi; t += passo) {
    const dt = Math.min(passo, secondi - t);
    if (conSecondario) {
      mancano -= dt;
      while (mancano <= 0) {
        mancano += durataGiro();
        inCatasta += CONFIG.lavoratori.legnaSecondario;
        legnaPortata += CONFIG.lavoratori.legnaSecondario;
      }
    }
    if (ritmo) {
      if (conAiutante) {
        const spostata = Math.min(inCatasta, ritmo.aiutante * dt);
        inCatasta -= spostata;
        sulBanco += spostata;
      }
      const legna = vendeLegna ? Math.min(sulBanco, ritmo.legna * dt) : 0;
      const carne = vendeCarne ? Math.min(carneBanco, ritmo.carne * dt) : 0;
      sulBanco -= legna;
      carneBanco -= carne;
      legnaVenduta += legna;
      carneVenduta += carne;
    }
  }

  // unità intere: la legna del secondario non venduta resta (quella già sul banco sul banco, il resto nella catasta);
  // la legna che c'era prima (delle corse) è come l'ha lasciata il giocatore
  legnaVenduta = Math.floor(legnaVenduta);
  carneVenduta = Math.floor(carneVenduta);
  const restano = legnaPortata - legnaVenduta;
  const restaSulBanco = Math.min(restano, Math.max(0, Math.round(sulBanco)));
  stato.sportelli.legna += restaSulBanco;
  stato.catasta += restano - restaSulBanco;
  stato.sportelli.carne = Math.max(0, stato.sportelli.carne - carneVenduta);
  if (conSecondario) stato.secondarioMancano = mancano;

  // le monete delle vendite, più le mance che i clienti lasciano in media ai venditori
  const { prezzoLegna, prezzoCarne, probabilitaMancia, manciaMinima, manciaMassima } = CONFIG.economia;
  const clienti = ritmo ? (legnaVenduta + carneVenduta) / ritmo.unitaPerCliente : 0;
  const mance = Math.floor(clienti * probabilitaMancia * ((manciaMinima + manciaMassima) / 2));
  const incassoLegna = legnaVenduta * prezzoLegna;
  const incassoCarne = carneVenduta * prezzoCarne;
  if (legnaVenduta > 0) registraVendita(stato, 'legna', legnaVenduta, incassoLegna);
  if (carneVenduta > 0) registraVendita(stato, 'carne', carneVenduta, incassoCarne);
  stato.guadagnoTotale += mance;
  return { legnaPortata, legnaVenduta, carneVenduta, monete: incassoLegna + incassoCarne + mance };
}
