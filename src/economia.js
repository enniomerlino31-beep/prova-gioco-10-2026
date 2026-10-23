// =====================================================================
//  ECONOMIA: prezzi e vendite
//  Tutti i prezzi sono nel file di configurazione (sezione "economia").
// =====================================================================

import { CONFIG } from './config.js';

// Quanto paga un cliente per una certa quantità di legna o di carne
export function prezzo(tipo, quantita) {
  const prezzoUnitario = tipo === 'carne' ? CONFIG.economia.prezzoCarne : CONFIG.economia.prezzoLegna;
  return Math.round(prezzoUnitario * quantita);
}

// Registra una vendita nel salvataggio (servirà per sbloccare le basi più grandi)
export function registraVendita(stato, tipo, quantita, incasso) {
  stato.vendute[tipo] += quantita;
  stato.guadagnoTotale += incasso;
}

// Scrive i numeri grandi in modo compatto: 1500 → "1,5K", 2000000 → "2M"
export function formatta(numero) {
  const n = Math.floor(numero);
  const corto = (valore, lettera) => `${(Math.floor(valore * 10) / 10).toString().replace('.', ',')}${lettera}`;
  if (n >= 1e9) return corto(n / 1e9, 'B');
  if (n >= 1e6) return corto(n / 1e6, 'M');
  if (n >= 1e4) return corto(n / 1e3, 'K');
  return String(n);
}
