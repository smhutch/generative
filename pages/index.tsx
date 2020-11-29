import { useEffect, useRef } from "react";
import * as THREE from "three";
import OrbitControls from "three-orbitcontrols";
import { createRandom } from "canvas-sketch-util/random";
import { lerp } from "canvas-sketch-util/math";

import { getAntialias } from "../common/util";

export default function Index() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const random = createRandom();

    const width = window.innerWidth;
    const height = window.innerHeight;

    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(100, width / height, 1, 1000);
    camera.position.set(40, 100, 120);

    const renderer = new THREE.WebGLRenderer({
      alpha: false,
      antialias: getAntialias(),
      canvas: canvasRef.current,
      powerPreference: "high-performance",
    });
    renderer.setSize(width, height);

    const geometry = new THREE.IcosahedronBufferGeometry();
    const material = new THREE.MeshPhongMaterial();
    material.shininess = 100;
    material.reflectivity = 100;

    const grid = 12;
    const count = Math.pow(grid, 3);

    const mesh = new THREE.InstancedMesh(geometry, material, count);
    // optimize for updates every frame
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    scene.add(mesh);

    // Allow user to move around central axis
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.autoRotate = true;
    controls.enableDamping = true;
    controls.autoRotateSpeed = 0.3;
    controls.dampingFactor = 0.05;
    controls.minDistance = 50;
    controls.maxDistance = 300;
    controls.update();

    const topLight = new THREE.SpotLight(0xffffff);
    topLight.intensity = 1;
    topLight.position.y = grid * 10;
    topLight.position.x = grid * 5;
    topLight.distance = grid * 10 * 3;
    topLight.decay = 2;
    scene.add(topLight);

    // Variables required to update meshed instance
    const matrix = new THREE.Matrix4();
    const position = new THREE.Vector3();
    const rotation = new THREE.Euler();
    const quaternion = new THREE.Quaternion();
    const scale = new THREE.Vector3();

    // animation loop
    const duration = 5; // seconds
    const durationMs = duration * 1000;
    const startTime = performance.now();

    function animate(timestamp: number) {
      // time from init to current render timestamp
      const time = timestamp - startTime;
      // loop from 0 to {{duration}}
      const playhead = time % durationMs;
      // percentage from 0 to 1, where 1 is {{duration}}
      const t = playhead / durationMs;
      // 0 to 1 to 0 in {{duration}} seconds
      const r = Math.sin(t * Math.PI);

      let i = 0;
      for (let x = 0; x < grid; x++) {
        const px = x / (grid - 1);
        for (let y = 0; y < grid; y++) {
          const py = y / (grid - 1);
          for (let z = 0; z < grid; z++) {
            const pz = z / (grid - 1);
            const noise = random.noise3D(px, py, pz);
            const posLimit = grid * 5;

            position.x = lerp(-posLimit, posLimit, px);
            position.y = lerp(-posLimit, posLimit, py);
            position.z = lerp(-posLimit, posLimit, pz);

            rotation.x = lerp(0, Math.PI * px, r);

            quaternion.setFromEuler(rotation);

            scale.x = scale.y = scale.z = 5 * px * py * pz + 2;

            matrix.compose(position, quaternion, scale);
            mesh.setMatrixAt(i, matrix);
            i++;
          }
        }
      }

      mesh.instanceMatrix.needsUpdate = true;
      controls.update();
      renderer.render(scene, camera);
      requestAnimationFrame(animate);
    }

    requestAnimationFrame(animate);
  });

  return <canvas ref={canvasRef} />;
}
