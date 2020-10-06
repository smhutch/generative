import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { createRandom } from "canvas-sketch-util/random";
import { lerp } from "canvas-sketch-util/math";

const random = createRandom();

const width = window.innerWidth;
const height = window.innerHeight;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(100, width / height, 1, 1000);
const renderer = new THREE.WebGLRenderer({
  alpha: false,
});
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;
renderer.setSize(width, height);
document.body.appendChild(renderer.domElement);

const geometry = new THREE.IcosahedronGeometry();
const material = new THREE.MeshPhongMaterial({
  color: "white",
  shininess: 100,
  opacity: 0.2,
});

const grid = 12;
const items = [];
for (let y = 0; y < grid; y++) {
  const py = y / (grid - 1);
  for (let x = 0; x < grid; x++) {
    const px = x / (grid - 1);
    for (let z = 0; z < grid; z++) {
      const pz = z / (grid - 1);
      const noise = random.noise3D(py, px, pz);

      const space = 50;
      const shape = new THREE.Mesh(geometry, material);
      shape.position.x = lerp(-space, space, px);
      shape.position.y = lerp(-space, space, py);
      shape.position.z = lerp(-space, space, pz);

      const scale = Math.abs(5 * noise) + 1;
      shape.scale.x = scale;
      shape.scale.y = scale;
      shape.scale.z = scale;

      const rotation = random.range(0, 2);
      shape.rotation.x = rotation;
      shape.rotation.y = rotation;
      shape.rotation.z = rotation;

      shape.receiveShadow = true;
      shape.castShadow = true;

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
controls.update();

const innerLight = new THREE.PointLight(0xffffff);
innerLight.castShadow = true;
innerLight.position.x = 100;
innerLight.position.y = 100;
innerLight.distance = 200;
scene.add(innerLight);

const topLight = new THREE.PointLight(0xffffff);
topLight.intensity = 1;
topLight.position.y = 100;
topLight.distance = 200;
innerLight.castShadow = true;
scene.add(topLight);

function animate() {
  requestAnimationFrame(animate);

  items.forEach(({ shape, noise }) => {
    shape.rotation.z += 0.01 * noise;
    shape.rotation.x = noise * 2;
  });

  controls.update();

  renderer.render(scene, camera);
}

animate();
