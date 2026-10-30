// =====================================================================
//  SCENA: prepara il mondo 3D
//  - il "renderer" (il pittore che disegna sullo schermo)
//  - la telecamera, le luci, il cielo e la nebbia
//  - il terreno innevato, la pista, gli abeti ai lati e la neve che cade
//  Convenzione: la squadra corre verso la Z NEGATIVA. Una "distanza" percorsa
//  di 100 metri corrisponde quindi alla posizione z = -100.
// =====================================================================

import * as THREE from 'three';
import { CONFIG } from '../config.js';
import { creaForestaDecorativa } from '../modelli/albero.js';

const COLORE_CIELO = 0xbfe3f7;

export function creaMondo(contenitore) {
  // --- Il pittore ---
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  // sui telefoni molto nitidi (3 pixel per punto) si disegna con meno pixel: meno lavoro per la scheda grafica, immagine un po' meno nitida
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, CONFIG.grafica.pixelMassimi));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  contenitore.appendChild(renderer.domElement);

  // --- La scena: il "palcoscenico" che contiene tutti gli oggetti ---
  const scena = new THREE.Scene();
  scena.background = new THREE.Color(COLORE_CIELO);
  scena.fog = new THREE.Fog(COLORE_CIELO, 40, 105); // gli oggetti lontani sfumano nel cielo

  // --- La telecamera: da dove guardiamo ---
  const telecamera = new THREE.PerspectiveCamera(60, 1, 0.1, 220);

  // --- Le luci ---
  // Luce "ambiente" che arriva dal cielo (azzurra) e dalla neve (bianca)
  scena.add(new THREE.HemisphereLight(0xeaf6ff, 0xa9c6e0, 2.2));
  // Il sole: fa le ombre
  const sole = new THREE.DirectionalLight(0xfff4e0, 2.4);
  sole.castShadow = true;
  sole.shadow.mapSize.set(1024, 1024);
  sole.shadow.camera.left = -16;
  sole.shadow.camera.right = 16;
  sole.shadow.camera.top = 22;
  sole.shadow.camera.bottom = -22;
  sole.shadow.camera.near = 1;
  sole.shadow.camera.far = 60;
  sole.shadow.bias = -0.0008;
  scena.add(sole);
  scena.add(sole.target);

  // --- Terreno e pista (fissi nel mondo, lunghi quanto tutta la corsa) ---
  const lunghezzaTotale = CONFIG.pista.lunghezza + 200;

  const terreno = new THREE.Mesh(
    new THREE.PlaneGeometry(160, lunghezzaTotale + 120),
    new THREE.MeshLambertMaterial({ color: 0xf3f8ff })
  );
  terreno.rotation.x = -Math.PI / 2; // il piano nasce in verticale: lo sdraiamo
  terreno.position.set(0, -0.02, -lunghezzaTotale / 2 + 40);
  terreno.receiveShadow = true;
  scena.add(terreno);

  const pista = new THREE.Mesh(
    new THREE.PlaneGeometry(CONFIG.pista.larghezza, lunghezzaTotale),
    new THREE.MeshLambertMaterial({ map: creaTexturaPista(lunghezzaTotale) })
  );
  pista.rotation.x = -Math.PI / 2;
  pista.position.set(0, 0, -lunghezzaTotale / 2 + 20);
  pista.receiveShadow = true;
  scena.add(pista);

  // Due bordi di neve ammucchiata ai lati della pista
  const materialeBordo = new THREE.MeshLambertMaterial({ color: 0xffffff });
  for (const lato of [-1, 1]) {
    const bordo = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.6, lunghezzaTotale, 8, 1), materialeBordo);
    bordo.rotation.x = Math.PI / 2;
    bordo.scale.set(1, 1, 0.55);
    bordo.position.set(lato * (CONFIG.pista.larghezza / 2 + 0.35), 0.05, -lunghezzaTotale / 2 + 20);
    bordo.receiveShadow = true;
    scena.add(bordo);
  }

  // Abeti decorativi ai lati della pista
  scena.add(creaForestaDecorativa(lunghezzaTotale));

  // --- Neve che cade ---
  const neve = creaNeve();
  scena.add(neve.punti);

  // --- Adatta tutto quando cambia la dimensione dello schermo (o si ruota il telefono) ---
  function adattaSchermo() {
    const larghezza = window.innerWidth;
    const altezza = window.innerHeight;
    renderer.setSize(larghezza, altezza);
    telecamera.aspect = larghezza / altezza;
    // In verticale serve una visuale più ampia, altrimenti la pista non ci sta
    telecamera.fov = telecamera.aspect < 1 ? CONFIG.telecamera.angoloTelefono : CONFIG.telecamera.angoloComputer;
    telecamera.updateProjectionMatrix();
  }
  window.addEventListener('resize', adattaSchermo);
  adattaSchermo();

  // Punto che la telecamera sta inseguendo (serve per muoverla in modo morbido)
  const puntoSeguito = new THREE.Vector3();
  let primaVolta = true;
  let zoomAttuale = 1;
  let tremore = 0; // 0 = ferma; sale con scuoti() e scende da solo (colpi dell'orso)

  return {
    renderer,
    scena,
    telecamera,

    // Sposta telecamera, sole e neve per seguire la squadra.
    // "zoom" > 1 allontana la telecamera (serve quando il carro diventa grande)
    // "morbidezza": più è bassa, più la telecamera si muove con calma (gli avvisi delle novità la usano per andare sulla novità)
    segui(x, y, z, dt, zoom = 1, morbidezza = 6) {
      const cfg = CONFIG.telecamera;
      zoomAttuale += (zoom - zoomAttuale) * Math.min(1, dt * 2);
      // più il carro è grande, più la telecamera guarda un po' indietro, verso il carro
      const obiettivo = new THREE.Vector3(x * 0.45, y, z + (zoomAttuale - 1) * 6);
      if (primaVolta) {
        puntoSeguito.copy(obiettivo);
        primaVolta = false;
      } else {
        puntoSeguito.lerp(obiettivo, Math.min(1, dt * morbidezza));
      }
      telecamera.position.set(
        puntoSeguito.x,
        puntoSeguito.y + cfg.altezza * zoomAttuale,
        puntoSeguito.z + cfg.distanzaDietro * zoomAttuale
      );
      if (tremore > 0.001) {
        // tremolio breve: la telecamera si sposta di poco e a caso, poi si calma da sola
        telecamera.position.x += (Math.random() - 0.5) * tremore;
        telecamera.position.y += (Math.random() - 0.5) * tremore;
        tremore = Math.max(0, tremore - dt * 2.2);
      }
      telecamera.lookAt(puntoSeguito.x, puntoSeguito.y, puntoSeguito.z - cfg.guardaAvanti);

      sole.position.set(x + 8, y + 22, z + 4);
      sole.target.position.set(x, y, z - 6);

      neve.aggiorna(dt, telecamera.position);
    },

    // Fa tremare un attimo la telecamera (forza in metri, per esempio 0.4)
    scuoti(forza) {
      tremore = Math.max(tremore, forza);
    },

    // Riporta la telecamera di colpo al punto giusto (a inizio corsa)
    reimpostaTelecamera() {
      primaVolta = true;
      zoomAttuale = 1;
      tremore = 0;
    },

    disegna() {
      renderer.render(scena, telecamera);
    },
  };
}

// Disegna su una "tela" (canvas) la neve battuta della pista con i solchi delle slitte
function creaTexturaPista(lunghezzaTotale) {
  const tela = document.createElement('canvas');
  tela.width = 128;
  tela.height = 128;
  const ctx = tela.getContext('2d');
  ctx.fillStyle = '#e4eef8';
  ctx.fillRect(0, 0, 128, 128);
  // Puntini casuali per dare la sensazione di velocità
  for (let i = 0; i < 160; i++) {
    ctx.fillStyle = Math.random() < 0.5 ? 'rgba(255,255,255,0.9)' : 'rgba(170,195,225,0.45)';
    ctx.fillRect(Math.random() * 128, Math.random() * 128, 2 + Math.random() * 3, 2 + Math.random() * 6);
  }
  // Due solchi lungo la pista
  ctx.fillStyle = 'rgba(160,185,215,0.5)';
  ctx.fillRect(30, 0, 6, 128);
  ctx.fillRect(92, 0, 6, 128);

  const texture = new THREE.CanvasTexture(tela);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(1, lunghezzaTotale / CONFIG.pista.larghezza);
  texture.anisotropy = 4;
  return texture;
}

// Fiocchi di neve: tanti puntini bianchi che scendono e si ripetono attorno alla telecamera
export function creaNeve() {
  const quanti = 700;
  const posizioni = new Float32Array(quanti * 3);
  for (let i = 0; i < quanti; i++) {
    posizioni[i * 3] = (Math.random() - 0.5) * 50;
    posizioni[i * 3 + 1] = Math.random() * 25;
    posizioni[i * 3 + 2] = -Math.random() * 60;
  }
  const geometria = new THREE.BufferGeometry();
  geometria.setAttribute('position', new THREE.BufferAttribute(posizioni, 3));
  const punti = new THREE.Points(
    geometria,
    new THREE.PointsMaterial({ color: 0xffffff, size: 0.18, transparent: true, opacity: 0.9, fog: true })
  );
  punti.frustumCulled = false;

  return {
    punti,
    aggiorna(dt, posizioneTelecamera) {
      const p = geometria.attributes.position.array;
      for (let i = 0; i < quanti; i++) {
        p[i * 3 + 1] -= dt * 2.5; // scende
        p[i * 3] += Math.sin(p[i * 3 + 1] + i) * dt * 0.5; // ondeggia
        if (p[i * 3 + 1] < posizioneTelecamera.y - 20) p[i * 3 + 1] += 25;
        // se il fiocco resta indietro rispetto alla telecamera, lo rimettiamo davanti
        if (p[i * 3 + 2] > posizioneTelecamera.z + 5) p[i * 3 + 2] -= 60;
        if (p[i * 3 + 2] < posizioneTelecamera.z - 55) p[i * 3 + 2] += 60;
      }
      geometria.attributes.position.needsUpdate = true;
    },
  };
}
