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

    const camera = new THREE.PerspectiveCamera();

    const renderer = new THREE.WebGLRenderer({
      alpha: false,
      antialias: getAntialias(),
      canvas: canvasRef.current,
      powerPreference: "high-performance",
    });
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.render(scene, camera);

    const geometry = new THREE.BoxBufferGeometry();
    const material = new THREE.MeshPhongMaterial();
    material.shininess = 100;
    material.reflectivity = 100;

    const grid = 8;
    const count = Math.pow(grid, 3);

    const mesh = new THREE.InstancedMesh(geometry, material, count);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    // optimize for updates every frame
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    scene.add(mesh);

    const topLight = new THREE.SpotLight(0xffffff);
    topLight.intensity = 1;
    topLight.position.x = 0;
    topLight.position.y = 80;
    topLight.position.z = 80;
    topLight.distance = grid * 10 * 3;
    topLight.castShadow = true;
    scene.add(topLight);

    // const helper = new THREE.SpotLightHelper(topLight);
    // scene.add(helper);

    // Variables required to update meshed instance
    const matrix = new THREE.Matrix4();
    const position = new THREE.Vector3();
    const quaternion = new THREE.Quaternion();
    const scale = new THREE.Vector3();

    function draw() {
      let i = 0;
      for (let x = 0; x < grid; x++) {
        const px = x / (grid - 1);
        for (let y = 0; y < grid; y++) {
          const py = y / (grid - 1);
          const noise = random.noise3D(px, py, 1);
          const posLimit = grid * 5;

          position.x = lerp(-posLimit, posLimit, px);
          // position.y = lerp(-posLimit, posLimit, py);
          position.z = lerp(-posLimit, posLimit, py);

          // rotation.x = lerp(0, Math.PI * px, r);
          const isVisible = random.chance(0.8);

          scale.x = isVisible ? 10 * Math.abs(noise) : 0;
          scale.y = isVisible ? 10 * Math.abs(noise) : 0;
          scale.z = isVisible ? 10 * Math.abs(noise) : 0;

          matrix.compose(position, quaternion, scale);
          mesh.setMatrixAt(i, matrix);
          i++;
        }
      }

      camera.position.set(200, 200, 200);
      camera.lookAt(scene.position);

      mesh.instanceMatrix.needsUpdate = true;
      renderer.render(scene, camera);
    }

    draw();

    document.body.onkeyup = function (e) {
      // space bar
      if (e.key == " ") {
        e.preventDefault();
        const seed = random.getRandomSeed();
        random.setSeed(seed);
        draw();
      }
    };
  });

  return <canvas ref={canvasRef} />;
}
