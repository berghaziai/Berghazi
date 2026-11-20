import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { Box, ChevronDown, ChevronUp, RotateCcw, Sun } from 'lucide-react';

type LightingMode = 'studio' | 'atlas_gold' | 'evening';

function detectWebGL(): boolean {
  try {
    const canvas = document.createElement('canvas');
    return Boolean(
      window.WebGLRenderingContext &&
        (canvas.getContext('webgl2') || canvas.getContext('webgl'))
    );
  } catch {
    return false;
  }
}

export const Amazigh3DScene: React.FC = () => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [webglSupported] = useState<boolean>(() => detectWebGL());
  const [autoRotate, setAutoRotate] = useState(true);
  const [lightingMode, setLightingMode] = useState<LightingMode>('studio');
  const [dockCollapsed, setDockCollapsed] = useState(false);

  const autoRotateRef = useRef(autoRotate);
  const lightingRef = useRef<LightingMode>(lightingMode);
  const resetCameraFnRef = useRef<(() => void) | null>(null);
  const applyLightingFnRef = useRef<((mode: LightingMode) => void) | null>(null);

  useEffect(() => {
    autoRotateRef.current = autoRotate;
  }, [autoRotate]);

  useEffect(() => {
    lightingRef.current = lightingMode;
    applyLightingFnRef.current?.(lightingMode);
  }, [lightingMode]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container || !webglSupported) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    } catch {
      return;
    }

    const width = container.clientWidth || 720;
    const height = container.clientHeight || 480;
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x16222e);

    const pmrem = new THREE.PMREMGenerator(renderer);
    const roomEnv = new RoomEnvironment();
    const envTarget = pmrem.fromScene(roomEnv, 0.04);
    scene.environment = envTarget.texture;
    roomEnv.dispose();

    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 100);
    camera.position.set(0, 2.4, 5.4);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.minDistance = 2.6;
    controls.maxDistance = 10;
    controls.target.set(0, 0.85, 0);

    resetCameraFnRef.current = () => {
      camera.position.set(0, 2.4, 5.4);
      controls.target.set(0, 0.85, 0);
      controls.update();
    };

    // Lighting setup
    const hemi = new THREE.HemisphereLight(0xfef3c7, 0x1e293b, 0.55);
    scene.add(hemi);

    const keyLight = new THREE.DirectionalLight(0xfff7ed, 2.2);
    keyLight.position.set(4, 7, 5);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.set(1024, 1024);
    keyLight.shadow.bias = -0.0005;
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x60a5fa, 0.9);
    rimLight.position.set(-4, 3, -5);
    scene.add(rimLight);

    applyLightingFnRef.current = (mode: LightingMode) => {
      if (mode === 'studio') {
        scene.background = new THREE.Color(0x16222e);
        keyLight.color.setHex(0xfff7ed);
        keyLight.intensity = 2.2;
        rimLight.color.setHex(0x60a5fa);
        rimLight.intensity = 0.9;
      } else if (mode === 'atlas_gold') {
        scene.background = new THREE.Color(0x2a1e16);
        keyLight.color.setHex(0xfbbf24);
        keyLight.intensity = 2.6;
        rimLight.color.setHex(0xfb7185);
        rimLight.intensity = 0.7;
      } else {
        scene.background = new THREE.Color(0x0b1320);
        keyLight.color.setHex(0x93c5fd);
        keyLight.intensity = 1.4;
        rimLight.color.setHex(0xe5ad44);
        rimLight.intensity = 1.4;
      }
    };
    applyLightingFnRef.current(lightingRef.current);

    // Materials
    const basaltMat = new THREE.MeshStandardMaterial({
      color: 0x26323f,
      roughness: 0.78,
      metalness: 0.12,
    });
    const goldMat = new THREE.MeshStandardMaterial({
      color: 0xd49b2b,
      roughness: 0.24,
      metalness: 0.92,
    });
    const silverMat = new THREE.MeshStandardMaterial({
      color: 0xdbe2ea,
      roughness: 0.22,
      metalness: 0.95,
    });
    const coralGemMat = new THREE.MeshPhysicalMaterial({
      color: 0x9f2c1b,
      roughness: 0.12,
      metalness: 0.05,
      clearcoat: 1.0,
      clearcoatRoughness: 0.08,
    });
    const enamelMat = new THREE.MeshStandardMaterial({
      color: 0x1b6b50,
      roughness: 0.35,
      metalness: 0.25,
    });

    // Composite Heritage Artifact Group (Amazigh Fibula Tazerzit & Yaz Crest)
    const monument = new THREE.Group();
    scene.add(monument);

    // 1. Floor receiver shadow plane
    const floorGeo = new THREE.CircleGeometry(4.5, 48);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x111a24,
      roughness: 0.9,
      metalness: 0.05,
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    // 2. Stepped Atlas Basalt Pedestal
    const base1 = new THREE.Mesh(new THREE.CylinderGeometry(1.55, 1.72, 0.24, 32), basaltMat);
    base1.position.y = 0.12;
    base1.castShadow = true;
    base1.receiveShadow = true;
    monument.add(base1);

    // 3. Engraved Gold Trim Collar
    const goldRing = new THREE.Mesh(new THREE.TorusGeometry(1.42, 0.045, 16, 64), goldMat);
    goldRing.rotation.x = Math.PI / 2;
    goldRing.position.y = 0.26;
    monument.add(goldRing);

    // 4. Inner Plinth
    const base2 = new THREE.Mesh(new THREE.CylinderGeometry(1.15, 1.3, 0.22, 8), basaltMat);
    base2.position.y = 0.35;
    base2.castShadow = true;
    base2.receiveShadow = true;
    monument.add(base2);

    // 5. Fibula Triangular Silver Body (ExtrudeGeometry)
    const fibulaGroup = new THREE.Group();
    fibulaGroup.position.set(0, 0.72, 0);
    monument.add(fibulaGroup);

    const triShape = new THREE.Shape();
    triShape.moveTo(0, 1.25);
    triShape.lineTo(-0.78, -0.05);
    triShape.lineTo(0.78, -0.05);
    triShape.closePath();

    const triGeo = new THREE.ExtrudeGeometry(triShape, {
      depth: 0.1,
      bevelEnabled: true,
      bevelThickness: 0.03,
      bevelSize: 0.03,
      bevelSegments: 3,
    });
    triGeo.translate(0, 0, -0.05);
    const triMesh = new THREE.Mesh(triGeo, silverMat);
    triMesh.castShadow = true;
    fibulaGroup.add(triMesh);

    // 6. Central Coral Cabochon Boss & Enamel Medallion
    const bezel = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.28, 0.14, 24), goldMat);
    bezel.rotation.x = Math.PI / 2;
    bezel.position.set(0, 0.42, 0.05);
    fibulaGroup.add(bezel);

    const gem = new THREE.Mesh(new THREE.SphereGeometry(0.2, 24, 16), coralGemMat);
    gem.scale.set(1, 1, 0.55);
    gem.position.set(0, 0.42, 0.12);
    fibulaGroup.add(gem);

    // 7. Side Filigree Enamel Accents
    [-0.4, 0.4].forEach((xPos) => {
      const sideBoss = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.14, 16), enamelMat);
      sideBoss.rotation.x = Math.PI / 2;
      sideBoss.position.set(xPos, 0.14, 0.05);
      fibulaGroup.add(sideBoss);
    });

    // 8. Curved Silver Torus Ring & Pin Bar
    const archRing = new THREE.Mesh(
      new THREE.TorusGeometry(0.66, 0.055, 16, 48, Math.PI * 1.45),
      silverMat
    );
    archRing.position.set(0, 1.38, 0);
    archRing.rotation.z = -Math.PI * 0.22;
    archRing.castShadow = true;
    fibulaGroup.add(archRing);

    const pinBar = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.018, 1.75, 12), goldMat);
    pinBar.rotation.z = Math.PI / 2;
    pinBar.position.set(0, 1.05, 0.11);
    pinBar.castShadow = true;
    fibulaGroup.add(pinBar);

    // 9. Floating Yaz (ⵣ) Crest Emblem
    const yazGroup = new THREE.Group();
    yazGroup.position.set(0, 2.38, 0);
    fibulaGroup.add(yazGroup);

    const yazSpine = new THREE.Mesh(new THREE.CylinderGeometry(0.036, 0.036, 0.78, 16), goldMat);
    yazGroup.add(yazSpine);

    const yazTopArc = new THREE.Mesh(
      new THREE.TorusGeometry(0.24, 0.032, 12, 32, Math.PI),
      goldMat
    );
    yazTopArc.position.set(0, 0.36, 0);
    yazTopArc.rotation.z = Math.PI;
    yazGroup.add(yazTopArc);

    const yazBottomArc = new THREE.Mesh(
      new THREE.TorusGeometry(0.24, 0.032, 12, 32, Math.PI),
      goldMat
    );
    yazBottomArc.position.set(0, -0.36, 0);
    yazGroup.add(yazBottomArc);

    const yazCross = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.028, 0.34, 12), goldMat);
    yazCross.rotation.z = Math.PI / 2;
    yazGroup.add(yazCross);

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth || 720;
      const h = container.clientHeight || 480;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    const clock = new THREE.Clock();
    let rafId = 0;

    const animate = () => {
      rafId = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();
      if (autoRotateRef.current) {
        monument.rotation.y = elapsed * 0.28;
      }
      yazGroup.position.y = 2.36 + Math.sin(elapsed * 2) * 0.05;
      yazGroup.rotation.y = elapsed * 0.6;
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', handleResize);
      controls.dispose();
      scene.traverse((obj) => {
        if ((obj as THREE.Mesh).isMesh) {
          const mesh = obj as THREE.Mesh;
          mesh.geometry.dispose();
          if (Array.isArray(mesh.material)) {
            mesh.material.forEach((m) => m.dispose());
          } else {
            mesh.material.dispose();
          }
        }
      });
      envTarget.dispose();
      pmrem.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [webglSupported]);

  if (!webglSupported) {
    return (
      <div className="bg-[#16222E] text-white rounded-2xl p-8 text-center space-y-3 border border-slate-800">
        <Box className="w-8 h-8 text-[#E5AD44] mx-auto" />
        <h3 className="text-lg font-semibold">3D WebGL Unavailable in This Browser Context</h3>
        <p className="text-xs text-slate-300 max-w-md mx-auto">
          Hardware or WebGL acceleration is not enabled in the current environment. Open Berghazi in a standard WebGL-enabled browser to inspect the 3D Amazigh Tazerzit Fibula &amp; Yaz monument.
        </p>
      </div>
    );
  }

  return (
    <div className="relative rounded-2xl overflow-hidden border border-[#E5E4DF] bg-[#16222E]">
      <div ref={mountRef} className="w-full h-[460px] sm:h-[520px]" />

      {/* Top Subtle Artifact Title */}
      <div className="absolute top-3 left-3 pointer-events-none bg-[#16222E]/80 backdrop-blur border border-white/10 rounded-xl px-3.5 py-2 text-white">
        <div className="text-[11px] font-semibold text-[#E5AD44]">ⵜⴰⵣⵔⵣⵉⵜ &amp; ⵣ</div>
        <div className="text-xs font-medium">3D Amazigh Silver Fibula &amp; Yaz Emblem</div>
      </div>

      {/* Collapsible Bottom Control Dock */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 max-w-[95%]">
        <div className="bg-[#16222E]/90 backdrop-blur border border-white/15 rounded-xl px-3 py-2 text-white shadow-lg">
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setDockCollapsed((c) => !c)}
              className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#E5AD44]"
            >
              {dockCollapsed ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              <span>{dockCollapsed ? 'Show 3D Controls' : '3D Controls'}</span>
            </button>

            {!dockCollapsed && (
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setAutoRotate((r) => !r)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
                    autoRotate ? 'bg-[#C68B1C] text-[#16222E]' : 'bg-white/10 text-white'
                  }`}
                >
                  {autoRotate ? 'Auto-Rotate On' : 'Auto-Rotate Off'}
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setLightingMode((m) =>
                      m === 'studio' ? 'atlas_gold' : m === 'atlas_gold' ? 'evening' : 'studio'
                    )
                  }
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium bg-white/10 hover:bg-white/20"
                >
                  <Sun className="w-3 h-3 text-[#E5AD44]" />
                  <span>
                    {lightingMode === 'studio'
                      ? 'Studio Light'
                      : lightingMode === 'atlas_gold'
                      ? 'Atlas Gold'
                      : 'Evening Sky'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => resetCameraFnRef.current?.()}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium bg-white/10 hover:bg-white/20"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset View</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
