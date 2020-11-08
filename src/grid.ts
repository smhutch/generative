import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { createRandom } from "canvas-sketch-util/random";
import { lerp } from "canvas-sketch-util/math";
import eases from "eases";

import { getAntialias } from "./util";

const random = createRandom();

const width = window.innerWidth;
const height = window.innerHeight;
const aspect = width / height;
const fov = 50;
const grid = random.rangeFloor(40, 60);
const count = Math.pow(grid, 2);
const posLimit = Math.min(width, height) * 0.05;
const maxSize = (posLimit / grid) * 0.8;

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(fov, aspect, 1, 1000);
scene.add(camera);

const renderer = new THREE.WebGLRenderer({
  alpha: false,
  antialias: getAntialias(),
  powerPreference: "high-performance",
});
renderer.setSize(width, height);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

const geometry = new THREE.BoxBufferGeometry();
const material = new THREE.MeshPhongMaterial();
material.shininess = 200;
material.reflectivity = 100;

const mesh = new THREE.InstancedMesh(geometry, material, count);

mesh.castShadow = true;
mesh.receiveShadow = true;

// optimize for updates every frame
mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
scene.add(mesh);

const backLight = new THREE.PointLight(0xffffff);
backLight.intensity = 0.8;
backLight.castShadow = true;
backLight.position.set(
  (posLimit / 2) * random.sign(),
  (posLimit / 2) * random.sign(),
  fov * 2
);
backLight.decay = 4;
scene.add(backLight);

const frontLight = new THREE.PointLight(0xffffff);
frontLight.intensity = 0.1;
frontLight.castShadow = true;
frontLight.position.set(
  (posLimit / 2) * random.sign(),
  (posLimit / 2) * random.sign(),
  -fov
);
frontLight.decay = 4;
scene.add(frontLight);

// const helper = new THREE.PointLightHelper(frontLight);
// scene.add(helper);

// Allow user to move around central axis
// NOTE: code breaks if this is removed. Why?
const controls = new OrbitControls(camera, renderer.domElement);
// controls.autoRotate = true;
// controls.enableDamping = true;
// controls.autoRotateSpeed = 0.5;
// controls.dampingFactor = 0.05;
// controls.minDistance = 0;
// controls.maxDistance = 3000;
// controls.update();

// Variables required to update meshed instance
const matrix = new THREE.Matrix4();
const position = new THREE.Vector3();
const rotation = new THREE.Euler();
const quaternion = new THREE.Quaternion();
const scale = new THREE.Vector3();

// animation loop
const duration = 12000; // ms

const rv = random.valueNonZero();
const rx = random.range(-5, 5);

function animate(now) {
  // loop from 0..1, repeating every duration
  const time = (now / duration) % 1;
  // varies from 0..1 and back
  const loop = Math.sin(time * Math.PI);
  // varies from 0..1 and back, with easing
  const shapeLoop = Math.pow(loop, 5);
  const moveLoop = eases.cubicInOut(loop);

  let i = 0;
  for (let x = 0; x < grid; x++) {
    const px = x / (grid - 1);
    for (let y = 0; y < grid; y++) {
      const py = y / (grid - 1);
      const noise = random.noise3D(px, py, rv);

      position.x = lerp(-posLimit, posLimit, px);
      position.y = lerp(-posLimit, posLimit, py);

      rotation.x = Math.PI * shapeLoop * noise;
      rotation.z = lerp(Math.PI / 3, Math.PI * noise * rx, shapeLoop);

      quaternion.setFromEuler(rotation);

      scale.set(
        lerp(maxSize, maxSize, py),
        lerp(maxSize, maxSize, px),
        maxSize
      );

      matrix.compose(position, quaternion, scale);
      mesh.setMatrixAt(i, matrix);
      i++;
    }
  }

  camera.position.y = lerp(-fov * 5, 0, moveLoop);
  camera.position.z = lerp(-20, -fov * 2.5, moveLoop);

  mesh.instanceMatrix.needsUpdate = true;
  controls.update();
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

requestAnimationFrame(animate);

document.body.onkeyup = function (e) {
  // space bar
  if (e.key == " ") {
    e.preventDefault();
    const seed = random.getRandomSeed();
    random.setSeed(seed);
    requestAnimationFrame(animate);
  }
};
