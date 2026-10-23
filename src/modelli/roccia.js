// =====================================================================
//  MODELLO DELLA ROCCIA
//  Un sasso grigio "sfaccettato" con un cappello di neve.
// =====================================================================

import * as THREE from 'three';
import { tinta } from './materiali.js';

const materialeSasso = new THREE.MeshLambertMaterial({ color: 0x8592a6, flatShading: true });
const geometriaSasso = new THREE.DodecahedronGeometry(1, 0);
const geometriaNeve = new THREE.SphereGeometry(1, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2);

export function creaRoccia() {
  const gruppo = new THREE.Group();

  const sasso = new THREE.Mesh(geometriaSasso, materialeSasso);
  sasso.scale.set(1.15, 0.85, 1);
  sasso.position.y = 0.45;
  sasso.rotation.y = Math.random() * Math.PI;
  sasso.castShadow = true;
  gruppo.add(sasso);

  const neve = new THREE.Mesh(geometriaNeve, tinta(0xffffff));
  neve.scale.set(0.85, 0.35, 0.75);
  neve.position.y = 1.0;
  gruppo.add(neve);

  return gruppo;
}
