// =====================================================================
//  BARRA DELLA VITA DEL LUPO GIGANTE
//  Una grande barra in stile cartoon sopra la sua testa: contorno scuro e spesso,
//  striscia che si accorcia a ogni colpo (verde, poi gialla, poi rossa), riflesso
//  chiaro, tacche ogni 10% e il numero dei punti di vita rimasti.
//  È un cartellino (sprite) sempre rivolto verso la telecamera e sempre visibile,
//  anche se qualcosa gli passa davanti. Si ridisegna solo quando la vita cambia.
// =====================================================================

import * as THREE from 'three';

const LARGHEZZA = 512;
const ALTEZZA = 112;

function arrotondato(c, x, y, l, a, r) {
  c.beginPath();
  c.moveTo(x + r, y);
  c.arcTo(x + l, y, x + l, y + a, r);
  c.arcTo(x + l, y + a, x, y + a, r);
  c.arcTo(x, y + a, x, y, r);
  c.arcTo(x, y, x + l, y, r);
  c.closePath();
}

// altezza: dove sta la barra nel modello del lupo (metri locali); larga: quanto è larga (metri locali)
export function creaBarraGigante(altezza = 2.1, larga = 2.6) {
  const tela = document.createElement('canvas');
  tela.width = LARGHEZZA;
  tela.height = ALTEZZA;
  const c = tela.getContext('2d');
  const trama = new THREE.CanvasTexture(tela);
  trama.colorSpace = THREE.SRGBColorSpace;
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: trama, transparent: true, depthTest: false }));
  sprite.renderOrder = 10;
  sprite.scale.set(larga, (larga * ALTEZZA) / LARGHEZZA, 1);
  const gruppo = new THREE.Group();
  gruppo.position.set(0, altezza, 0);
  gruppo.visible = false;
  gruppo.add(sprite);

  let ultimo = -1;
  const disegna = (hp, vita) => {
    const parte = Math.max(0, hp / vita);
    c.clearRect(0, 0, LARGHEZZA, ALTEZZA);
    // contorno scuro e spesso, poi fondo
    arrotondato(c, 6, 6, LARGHEZZA - 12, ALTEZZA - 12, 36);
    c.fillStyle = '#1d2128';
    c.fill();
    arrotondato(c, 16, 16, LARGHEZZA - 32, ALTEZZA - 32, 26);
    c.fillStyle = '#5a2a2a';
    c.fill();
    // striscia della vita
    const x0 = 16;
    const l0 = LARGHEZZA - 32;
    if (parte > 0) {
      const colore = parte > 0.5 ? ['#8df09a', '#3fbf56'] : parte > 0.25 ? ['#ffe27a', '#f2b320'] : ['#ff8a7a', '#e03a2c'];
      c.save();
      arrotondato(c, 16, 16, LARGHEZZA - 32, ALTEZZA - 32, 26);
      c.clip();
      const gradiente = c.createLinearGradient(0, 16, 0, ALTEZZA - 16);
      gradiente.addColorStop(0, colore[0]);
      gradiente.addColorStop(1, colore[1]);
      c.fillStyle = gradiente;
      c.fillRect(x0, 16, Math.max(8, l0 * parte), ALTEZZA - 32);
      // riflesso chiaro in alto
      c.fillStyle = 'rgba(255,255,255,0.35)';
      c.fillRect(x0, 20, Math.max(8, l0 * parte), 14);
      // tacche ogni 10%
      c.fillStyle = 'rgba(29,33,40,0.55)';
      for (let i = 1; i < 10; i++) c.fillRect(x0 + (l0 * i) / 10 - 2, 16, 4, ALTEZZA - 32);
      c.restore();
    }
    // numero dei punti di vita, con il bordo scuro
    c.font = '700 44px "Lilita One", system-ui, sans-serif';
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.lineWidth = 8;
    c.lineJoin = 'round';
    c.strokeStyle = '#1d2128';
    c.fillStyle = '#ffffff';
    const testo = `${Math.max(0, Math.ceil(hp))}`;
    c.strokeText(testo, LARGHEZZA / 2, ALTEZZA / 2 + 2);
    c.fillText(testo, LARGHEZZA / 2, ALTEZZA / 2 + 2);
    trama.needsUpdate = true;
  };

  return {
    gruppo,
    aggiorna: (lupo) => {
      const hp = Math.max(0, Math.ceil(lupo.hp));
      if (hp === ultimo) return;
      ultimo = hp;
      disegna(lupo.hp, lupo.vita);
    },
  };
}
