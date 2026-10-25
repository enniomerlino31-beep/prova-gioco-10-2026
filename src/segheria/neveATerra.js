// =====================================================================
//  NEVE A TERRA
//  Il terreno innevato della base e della foresta intorno:
//  - dove si cammina (dentro e attorno alle mura) è quasi piatto, con onde
//    leggerissime e sfumature di bianco e azzurro chiaro
//  - più lontano, verso la foresta, la neve si alza in dune morbide
//  - piccoli mucchietti di neve sparsi fuori dalle mura
//  - un leggero scintillio: puntini che brillano per un attimo qua e là
//  Tutto leggero per il telefono: due forme per il terreno, i mucchietti
//  disegnati tutti insieme e lo scintillio in un colpo solo.
// =====================================================================

import * as THREE from 'three';

// Zona dove si cammina (il boscaiolo può uscire dalle mura fin qui): qui la neve è quasi piatta
const ZONA = { xMin: -22, xMax: 22, zMin: -17.5, zMax: 18.5 };
const BIANCO = new THREE.Color(0xf7fbff);
const AZZURRO = new THREE.Color(0xd9e7f6);

// Un "rumore" morbido fatto di onde: dà un numero tra 0 e 1 che cambia piano piano da un punto all'altro
function onde(x, z) {
  const a = Math.sin(x * 1.3 + Math.sin(z * 0.7) * 1.5) * Math.cos(z * 1.1 + x * 0.4);
  const b = Math.sin(x * 0.37 - z * 0.53 + 1.7) * Math.sin(z * 0.29 + x * 0.21 + 0.8);
  const c = Math.sin(x * 2.9 + z * 2.3) * 0.3;
  return THREE.MathUtils.clamp(0.5 + a * 0.25 + b * 0.3 + c * 0.15, 0, 1);
}

// Dipinge i punti del terreno: più in alto più bianco, nelle conche un po' azzurro
function coloraPunti(geometria, quanto) {
  const pos = geometria.attributes.position;
  const colori = new Float32Array(pos.count * 3);
  const colore = new THREE.Color();
  for (let i = 0; i < pos.count; i++) {
    colore.copy(AZZURRO).lerp(BIANCO, quanto(pos.getX(i), pos.getZ(i)));
    colore.toArray(colori, i * 3);
  }
  geometria.setAttribute('color', new THREE.BufferAttribute(colori, 3));
}

// Un terreno: piano orizzontale con i punti alzati da "altezza(x, z)"
function creaTerreno(larghezza, profondita, segmentiX, segmentiZ, centroZ, altezza, quanto) {
  const geometria = new THREE.PlaneGeometry(larghezza, profondita, segmentiX, segmentiZ);
  geometria.rotateX(-Math.PI / 2);
  geometria.translate(0, 0, centroZ);
  const pos = geometria.attributes.position;
  for (let i = 0; i < pos.count; i++) pos.setY(i, altezza(pos.getX(i), pos.getZ(i)));
  geometria.computeVertexNormals();
  coloraPunti(geometria, quanto);
  const terreno = new THREE.Mesh(geometria, new THREE.MeshLambertMaterial({ vertexColors: true }));
  terreno.receiveShadow = true;
  return terreno;
}

// Quanto un punto è fuori dalla zona dove si cammina (0 = dentro, poi cresce in metri)
function fuoriZona(x, z) {
  const dx = Math.max(ZONA.xMin - x, 0, x - ZONA.xMax);
  const dz = Math.max(ZONA.zMin - z, 0, z - ZONA.zMax);
  return Math.hypot(dx, dz);
}

export function creaNeveATerra(scena) {
  // Dove si cammina: quadretti fitti, onde di pochi centimetri, sempre un po' sotto i piedi
  // (così personaggi, impronte e cerchi restano sopra la neve)
  const vicino = creaTerreno(
    ZONA.xMax - ZONA.xMin, ZONA.zMax - ZONA.zMin, 110, 90, (ZONA.zMin + ZONA.zMax) / 2,
    (x, z) => -0.045 + onde(x, z) * 0.033,
    (x, z) => 0.35 + onde(x, z) * 0.65
  );
  scena.add(vicino);

  // Tutto intorno, fino all'orizzonte: sotto la zona vicina resta nascosto; fuori si alza in dune morbide
  const lontano = creaTerreno(
    200, 200, 100, 100, 0,
    (x, z) => -0.07 + Math.min(1, fuoriZona(x, z) / 6) * (0.15 + onde(x * 0.4, z * 0.4) * 0.3),
    (x, z) => 0.3 + onde(x * 0.5, z * 0.5) * 0.7
  );
  scena.add(lontano);

  // Mucchietti di neve fuori dalle mura (non sul sentiero della corsa)
  const quanti = 70;
  const mucchietti = new THREE.InstancedMesh(
    new THREE.SphereGeometry(1, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2),
    new THREE.MeshLambertMaterial({ color: 0xf4f8ff }),
    quanti
  );
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  let n = 0;
  while (n < quanti) {
    const angolo = Math.random() * Math.PI * 2;
    const raggio = 13 + Math.random() * 10;
    const x = Math.cos(angolo) * raggio * 1.15;
    const z = Math.sin(angolo) * raggio * 0.85;
    if (Math.abs(x) < 4.5 && z < -7) continue; // il sentiero che esce dal cancello della corsa e la segheria
    const largo = 0.35 + Math.random() * 0.8;
    q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.random() * Math.PI);
    m.compose(new THREE.Vector3(x, -0.04, z), q, new THREE.Vector3(largo, 0.1 + Math.random() * 0.2, largo * (0.6 + Math.random() * 0.5)));
    mucchietti.setMatrixAt(n++, m);
  }
  mucchietti.receiveShadow = true;
  scena.add(mucchietti);

  // Scintillio: puntini sulla neve che ogni tanto brillano per un attimo
  const punti = 260;
  const posizioni = new Float32Array(punti * 3);
  const fasi = new Float32Array(punti);
  const ritmi = new Float32Array(punti);
  for (let i = 0; i < punti; i++) {
    posizioni[i * 3] = THREE.MathUtils.lerp(ZONA.xMin, ZONA.xMax, Math.random());
    posizioni[i * 3 + 1] = 0.02;
    posizioni[i * 3 + 2] = THREE.MathUtils.lerp(ZONA.zMin, ZONA.zMax, Math.random());
    fasi[i] = Math.random() * 100;
    ritmi[i] = 0.6 + Math.random() * 1.4;
  }
  const geometria = new THREE.BufferGeometry();
  geometria.setAttribute('position', new THREE.BufferAttribute(posizioni, 3));
  geometria.setAttribute('fase', new THREE.BufferAttribute(fasi, 1));
  geometria.setAttribute('ritmo', new THREE.BufferAttribute(ritmi, 1));
  const materiale = new THREE.ShaderMaterial({
    uniforms: { tempo: { value: 0 } },
    transparent: true,
    depthWrite: false,
    vertexShader: `
      attribute float fase;
      attribute float ritmo;
      uniform float tempo;
      varying float vLuce;
      void main() {
        // brilla solo per un attimo: un'onda con la punta molto stretta
        vLuce = pow(max(sin(tempo * ritmo + fase), 0.0), 24.0);
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = 0.9 * (300.0 / -mv.z);
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: `
      varying float vLuce;
      void main() {
        // una stellina: luminosa al centro, con due raggi a croce
        vec2 p = abs(gl_PointCoord - 0.5) * 2.0;
        float croce = max(1.0 - p.x * 4.0 - p.y, 1.0 - p.y * 4.0 - p.x);
        float alfa = clamp(croce, 0.0, 1.0) * vLuce;
        if (alfa < 0.02) discard;
        gl_FragColor = vec4(1.0, 1.0, 1.0, alfa);
      }`,
  });
  const scintillio = new THREE.Points(geometria, materiale);
  scintillio.frustumCulled = false;
  scena.add(scintillio);

  return {
    aggiorna(dt) {
      materiale.uniforms.tempo.value += dt;
    },
  };
}
