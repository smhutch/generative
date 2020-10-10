import * as THREE from "three";
import Stats from "stats.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { createRandom } from "canvas-sketch-util/random";
import { lerp } from "canvas-sketch-util/math";

function getAntialias() {
  return window.devicePixelRatio > 1 ? false : true;
}

type Item = {
  shape: THREE.Mesh;
  noise: number;
};

const random = createRandom();

const width = window.innerWidth;
const height = window.innerHeight;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(100, width / height, 1, 1000);
const renderer = new THREE.WebGLRenderer({
  alpha: false,
  antialias: getAntialias(),
  powerPreference: "high-performance",
});
renderer.setSize(width, height);
document.body.appendChild(renderer.domElement);

const geometry = new THREE.BoxBufferGeometry();
const material = new THREE.MeshLambertMaterial();
const baseShape = new THREE.Mesh(geometry, material);

const grid = 15;
const items: Item[] = [];
for (let y = 0; y < grid; y++) {
  const py = y / (grid - 1);
  for (let x = 0; x < grid; x++) {
    const px = x / (grid - 1);
    for (let z = 0; z < grid; z++) {
      const pz = z / (grid - 1);
      const noise = random.noise3D(py, px, pz);

      const space = 45;
      const shape = baseShape.clone();
      shape.position.x = lerp(-space, space, px);
      shape.position.y = lerp(-space, space, py);
      shape.position.z = lerp(-space, space, pz);

      const scale = Math.abs(5 * noise) + 2;
      shape.scale.x = scale;
      shape.scale.y = scale;
      shape.scale.z = scale;

      const rotation = random.range(0, 2);
      shape.rotation.x = rotation;
      shape.rotation.y = rotation;
      shape.rotation.z = rotation;

      // Render shape
      scene.add(shape);

      // Expose shape to parent scope
      items.push({
        shape,
        noise,
      });
    }
  }
}

const controls = new OrbitControls(camera, renderer.domElement);
camera.position.set(40, 120, 80);
controls.autoRotate = true;
controls.enableDamping = true;
controls.autoRotateSpeed = 0.3;
controls.dampingFactor = 0.05;
controls.minDistance = 50;
controls.maxDistance = 300;
controls.update();

camera.position.z = 120;

const topLight = new THREE.SpotLight(0xffffff);
topLight.intensity = 1;
topLight.position.y = 100;
topLight.distance = 200;
scene.add(topLight);

// const duration = 5; // seconds
// const durationMs = duration * 1000;
// const startTime = performance.now();

function animate(timestamp: number) {
  requestAnimationFrame(animate);
  // const time = timestamp - startTime;
  // const playhead = time % durationMs;
  // const t = playhead / durationMs;
  // const r = Math.sin(t * Math.PI);

  controls.update();
  renderer.render(scene, camera);
}

requestAnimationFrame(animate);
