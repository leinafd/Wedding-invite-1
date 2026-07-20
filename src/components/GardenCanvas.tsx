import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { Play, Volume2, VolumeX, Eye } from "lucide-react";

interface GardenCanvasProps {
  onEntered: () => void;
  audioRef: React.RefObject<HTMLAudioElement | null>;
  isMuted: boolean;
  toggleMute: () => void;
}

export default function GardenCanvas({ onEntered, audioRef, isMuted, toggleMute }: GardenCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isEntering, setIsEntering] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);

  // Store references for the animation loop
  const stateRef = useRef<{
    scene: THREE.Scene | null;
    camera: THREE.PerspectiveCamera | null;
    renderer: THREE.WebGLRenderer | null;
    gateLeft: THREE.Group | null;
    gateRight: THREE.Group | null;
    fireflies: THREE.Points | null;
    fallingPetals: THREE.Points | null;
    windTime: number;
    flowers: THREE.Mesh[];
    leaves: THREE.Mesh[];
    mouse: THREE.Vector2;
    targetCameraPos: THREE.Vector3;
    currentCameraPos: THREE.Vector3;
    onEnteredCalled: boolean;
  }>({
    scene: null,
    camera: null,
    renderer: null,
    gateLeft: null,
    gateRight: null,
    fireflies: null,
    fallingPetals: null,
    windTime: 0,
    flowers: [],
    leaves: [],
    mouse: new THREE.Vector2(0, 0),
    targetCameraPos: new THREE.Vector3(0, 2.5, 12),
    currentCameraPos: new THREE.Vector3(0, 2.5, 12),
    onEnteredCalled: false,
  });

  useEffect(() => {
    if (!canvasRef.current) return;

    // Simulate procedural loading
    const loadTimer = setInterval(() => {
      setLoadingProgress((prev) => {
        if (prev >= 100) {
          clearInterval(loadTimer);
          return 100;
        }
        return prev + 10;
      });
    }, 120);

    // --- 1. Scene Setup ---
    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#0f1d13"); // Mystical dark green night/twilight
    scene.fog = new THREE.FogExp2("#0f1d13", 0.04);

    // --- 2. Camera Setup ---
    const width = containerRef.current?.clientWidth || window.innerWidth;
    const height = containerRef.current?.clientHeight || window.innerHeight;
    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 100);
    camera.position.set(0, 2.5, 12);
    
    // --- 3. Renderer Setup ---
    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: true,
      powerPreference: "high-performance",
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // Save core objects
    stateRef.current.scene = scene;
    stateRef.current.camera = camera;
    stateRef.current.renderer = renderer;

    // --- 4. Lighting ---
    // Ambient light - mysterious indigo/green hue
    const ambientLight = new THREE.AmbientLight("#2e4c3a", 0.8);
    scene.add(ambientLight);

    // Soft warm moonlight/twilight light
    const moonLight = new THREE.DirectionalLight("#a6c3b0", 1.2);
    moonLight.position.set(10, 20, 10);
    moonLight.castShadow = true;
    moonLight.shadow.mapSize.width = 1024;
    moonLight.shadow.mapSize.height = 1024;
    moonLight.shadow.bias = -0.001;
    scene.add(moonLight);

    // Warm path lanterns (Point lights)
    const addLantern = (x: number, z: number, color: string) => {
      const lanternGroup = new THREE.Group();
      
      // Pole
      const poleGeo = new THREE.CylinderGeometry(0.04, 0.04, 2, 8);
      const poleMat = new THREE.MeshStandardMaterial({ color: "#111111", roughness: 0.9 });
      const pole = new THREE.Mesh(poleGeo, poleMat);
      pole.position.y = 1;
      lanternGroup.add(pole);

      // Light glass
      const glassGeo = new THREE.CylinderGeometry(0.12, 0.08, 0.3, 8);
      const glassMat = new THREE.MeshStandardMaterial({ 
        color: color, 
        emissive: color, 
        emissiveIntensity: 1.5,
        transparent: true,
        opacity: 0.8 
      });
      const glass = new THREE.Mesh(glassGeo, glassMat);
      glass.position.y = 2.15;
      lanternGroup.add(glass);

      // Cap
      const capGeo = new THREE.ConeGeometry(0.18, 0.1, 8);
      const cap = new THREE.Mesh(capGeo, poleMat);
      cap.position.y = 2.35;
      lanternGroup.add(cap);

      // Point Light source
      const pointLight = new THREE.PointLight(color, 2, 8);
      pointLight.position.set(0, 2.15, 0);
      pointLight.castShadow = true;
      pointLight.shadow.bias = -0.002;
      lanternGroup.add(pointLight);

      // Glow sprite effect using a subtle sphere
      const glowGeo = new THREE.SphereGeometry(0.35, 16, 16);
      const glowMat = new THREE.MeshBasicMaterial({
        color: color,
        transparent: true,
        opacity: 0.25,
      });
      const glow = new THREE.Mesh(glowGeo, glowMat);
      glow.position.set(0, 2.15, 0);
      lanternGroup.add(glow);

      lanternGroup.position.set(x, 0, z);
      scene.add(lanternGroup);
    };

    // Place warm golden lanterns along the path
    addLantern(-2.5, 7, "#ffbc42");
    addLantern(2.5, 7, "#ffbc42");
    addLantern(-2.5, 1, "#ffbc42");
    addLantern(2.5, 1, "#ffbc42");
    addLantern(-2.5, -5, "#ffbc42");
    addLantern(2.5, -5, "#ffbc42");

    // --- 5. Environment: Ground & Path ---
    // Stone Pathway
    const pathGeo = new THREE.PlaneGeometry(3.5, 40);
    const pathMat = new THREE.MeshStandardMaterial({
      color: "#2a312c",
      roughness: 0.8,
    });
    const pathway = new THREE.Mesh(pathGeo, pathMat);
    pathway.rotation.x = -Math.PI / 2;
    pathway.position.set(0, 0.01, -5);
    pathway.receiveShadow = true;
    scene.add(pathway);

    // Stepping stones procedurally added
    for (let i = 0; i < 20; i++) {
      const stoneGeo = new THREE.BoxGeometry(0.6 + Math.random() * 0.4, 0.02, 0.4 + Math.random() * 0.3);
      const stoneMat = new THREE.MeshStandardMaterial({ color: "#444a45", roughness: 0.9 });
      const stone = new THREE.Mesh(stoneGeo, stoneMat);
      stone.position.set(
        (Math.random() - 0.5) * 1.5,
        0.02,
        8 - i * 1.8
      );
      stone.rotation.y = Math.random() * 0.4 - 0.2;
      scene.add(stone);
    }

    // Grass / Garden Ground
    const groundGeo = new THREE.PlaneGeometry(100, 100);
    const groundMat = new THREE.MeshStandardMaterial({
      color: "#16281a",
      roughness: 0.95,
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = 0;
    ground.receiveShadow = true;
    scene.add(ground);

    // --- 6. Majestic Garden Archways ---
    const buildGardenArch = (zOffset: number) => {
      const archGroup = new THREE.Group();

      // Main arch tube
      // We make a semi-torus for the top and cylinders for columns
      const archColor = "#1a3322";
      const frameMat = new THREE.MeshStandardMaterial({ color: archColor, metalness: 0.3, roughness: 0.8 });

      // Left post
      const leftPost = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 3.5, 12), frameMat);
      leftPost.position.set(-2, 1.75, 0);
      leftPost.castShadow = true;
      archGroup.add(leftPost);

      // Right post
      const rightPost = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 3.5, 12), frameMat);
      rightPost.position.set(2, 1.75, 0);
      rightPost.castShadow = true;
      archGroup.add(rightPost);

      // Curved Arch Top
      const torusGeo = new THREE.TorusGeometry(2, 0.08, 12, 48, Math.PI);
      const torus = new THREE.Mesh(torusGeo, frameMat);
      torus.position.set(0, 3.5, 0);
      archGroup.add(torus);

      // Add lots of little leaf meshes climbing up the posts and arch
      const leafGeo = new THREE.DodecahedronGeometry(0.18, 1);
      const leafColors = ["#1b4d24", "#2c6b37", "#123318", "#417e4e"];
      
      const addLeafClutter = (x: number, y: number, z: number) => {
        const mat = new THREE.MeshStandardMaterial({
          color: leafColors[Math.floor(Math.random() * leafColors.length)],
          roughness: 0.8,
        });
        const leaf = new THREE.Mesh(leafGeo, mat);
        leaf.position.set(x + (Math.random() - 0.5) * 0.25, y + (Math.random() - 0.5) * 0.25, z + (Math.random() - 0.5) * 0.25);
        leaf.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
        leaf.scale.setScalar(0.6 + Math.random() * 0.8);
        archGroup.add(leaf);
        stateRef.current.leaves.push(leaf);
      };

      // Add foliage along columns
      for (let y = 0.2; y <= 3.5; y += 0.2) {
        addLeafClutter(-2, y, 0);
        addLeafClutter(2, y, 0);
      }
      // Add foliage along torus arch
      for (let angle = 0; angle <= Math.PI; angle += 0.15) {
        const ax = Math.cos(angle) * 2;
        const ay = 3.5 + Math.sin(angle) * 2;
        addLeafClutter(ax, ay, 0);
      }

      // Add beautiful glowing flowers (pink and cream roses) nested in the leaves
      const flowerGeo = new THREE.SphereGeometry(0.12, 8, 8);
      const flowerColors = ["#ff6b8b", "#ff9bb0", "#fdfaf6", "#fbc531"];
      const addFlower = (x: number, y: number, z: number) => {
        const fMat = new THREE.MeshStandardMaterial({
          color: flowerColors[Math.floor(Math.random() * flowerColors.length)],
          roughness: 0.6,
          emissive: "#ff9bb0",
          emissiveIntensity: 0.15
        });
        const flower = new THREE.Mesh(flowerGeo, fMat);
        flower.position.set(x + (Math.random() - 0.5) * 0.15, y + (Math.random() - 0.5) * 0.15, z + (Math.random() - 0.5) * 0.15);
        archGroup.add(flower);
        stateRef.current.flowers.push(flower);
      };

      for (let y = 0.5; y <= 3.3; y += 0.4) {
        if (Math.random() > 0.3) addFlower(-2, y, 0);
        if (Math.random() > 0.3) addFlower(2, y, 0);
      }
      for (let angle = 0.1; angle <= Math.PI - 0.1; angle += 0.3) {
        const ax = Math.cos(angle) * 2;
        const ay = 3.5 + Math.sin(angle) * 2;
        if (Math.random() > 0.2) addFlower(ax, ay, 0);
      }

      archGroup.position.z = zOffset;
      scene.add(archGroup);
    };

    // Create 3 archways at Z = 4, Z = -1, Z = -6
    buildGardenArch(4);
    buildGardenArch(-1);
    buildGardenArch(-6);

    // --- 7. Wrought-Iron Gate at Z = 5 ---
    const buildGate = () => {
      const gateLeftGroup = new THREE.Group();
      const gateRightGroup = new THREE.Group();

      const gateMat = new THREE.MeshStandardMaterial({
        color: "#181a18",
        roughness: 0.5,
        metalness: 0.8,
      });

      // Left gate leaf
      // Hinge bar
      const hingeLeft = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 2.5, 8), gateMat);
      hingeLeft.position.set(0, 1.25, 0);
      gateLeftGroup.add(hingeLeft);

      // Horizontals
      for (let y = 0.3; y <= 2.3; y += 0.6) {
        const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 1.8, 8), gateMat);
        bar.rotation.z = Math.PI / 2;
        bar.position.set(-0.9, y, 0);
        gateLeftGroup.add(bar);
      }

      // Vertical pickets
      for (let x = -0.3; x >= -1.7; x -= 0.3) {
        const picketHeight = 2.0 - Math.abs(x + 1) * 0.3;
        const picket = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, picketHeight, 8), gateMat);
        picket.position.set(x, picketHeight / 2 + 0.1, 0);
        gateLeftGroup.add(picket);

        // Elegant gold tips
        const tipGeo = new THREE.ConeGeometry(0.03, 0.1, 6);
        const tipMat = new THREE.MeshStandardMaterial({ color: "#d4af37", metalness: 0.9, roughness: 0.2 });
        const tip = new THREE.Mesh(tipGeo, tipMat);
        tip.position.set(x, picketHeight + 0.15, 0);
        gateLeftGroup.add(tip);
      }

      // Place left gate at left post hinge coordinate (-2)
      // The pivot should be at (-2, 0, 5) so we position the group at (-2, 0, 5) and the meshes shifted +2 in group X
      gateLeftGroup.position.set(-2, 0, 4.55);
      // Shift child meshes relative to hinge pivot
      gateLeftGroup.children.forEach(child => {
        child.position.x += 2; 
      });

      // Right gate leaf (mirrored copy of left)
      const hingeRight = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 2.5, 8), gateMat);
      hingeRight.position.set(0, 1.25, 0);
      gateRightGroup.add(hingeRight);

      // Horizontals
      for (let y = 0.3; y <= 2.3; y += 0.6) {
        const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 1.8, 8), gateMat);
        bar.rotation.z = Math.PI / 2;
        bar.position.set(0.9, y, 0);
        gateRightGroup.add(bar);
      }

      // Vertical pickets
      for (let x = 0.3; x <= 1.7; x += 0.3) {
        const picketHeight = 2.0 - Math.abs(x - 1) * 0.3;
        const picket = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, picketHeight, 8), gateMat);
        picket.position.set(x, picketHeight / 2 + 0.1, 0);
        gateRightGroup.add(picket);

        // Gold tip
        const tipGeo = new THREE.ConeGeometry(0.03, 0.1, 6);
        const tipMat = new THREE.MeshStandardMaterial({ color: "#d4af37", metalness: 0.9, roughness: 0.2 });
        const tip = new THREE.Mesh(tipGeo, tipMat);
        tip.position.set(x, picketHeight + 0.15, 0);
        gateRightGroup.add(tip);
      }

      gateRightGroup.position.set(2, 0, 4.55);
      // Shift child meshes relative to hinge pivot
      gateRightGroup.children.forEach(child => {
        child.position.x -= 2;
      });

      scene.add(gateLeftGroup);
      scene.add(gateRightGroup);

      stateRef.current.gateLeft = gateLeftGroup;
      stateRef.current.gateRight = gateRightGroup;
    };

    buildGate();

    // --- 8. Beautiful Ambient Trees on Margins ---
    const buildTree = (x: number, z: number) => {
      const treeGroup = new THREE.Group();

      // Trunk
      const trunkHeight = 4 + Math.random() * 3;
      const trunkGeo = new THREE.CylinderGeometry(0.15, 0.25, trunkHeight, 10);
      const trunkMat = new THREE.MeshStandardMaterial({ color: "#362111", roughness: 0.9 });
      const trunk = new THREE.Mesh(trunkGeo, trunkMat);
      trunk.position.y = trunkHeight / 2;
      trunk.castShadow = true;
      treeGroup.add(trunk);

      // Foliage Clutter
      const canopyCount = 4 + Math.floor(Math.random() * 3);
      const foliageMat = new THREE.MeshStandardMaterial({
        color: ["#143a1d", "#1f502d", "#0f2e17"][Math.floor(Math.random() * 3)],
        roughness: 0.9,
      });

      for (let i = 0; i < canopyCount; i++) {
        const sphereGeo = new THREE.DodecahedronGeometry(1.2 + Math.random() * 0.8, 1);
        const canopy = new THREE.Mesh(sphereGeo, foliageMat);
        canopy.position.set(
          (Math.random() - 0.5) * 1.2,
          trunkHeight + (Math.random() - 0.2) * 1.5,
          (Math.random() - 0.5) * 1.2
        );
        canopy.castShadow = true;
        canopy.receiveShadow = true;
        treeGroup.add(canopy);
      }

      treeGroup.position.set(x, 0, z);
      scene.add(treeGroup);
    };

    // Populate margins with rich procedural trees
    for (let z = 12; z >= -25; z -= 5) {
      if (Math.abs(z - 4.5) < 2) continue; // Keep space near gate free
      buildTree(-5 - Math.random() * 3, z + (Math.random() - 0.5) * 2);
      buildTree(5 + Math.random() * 3, z + (Math.random() - 0.5) * 2);
    }

    // --- 9. Magical Glowing Fireflies ---
    const fireflyCount = 70;
    const fireflyGeo = new THREE.BufferGeometry();
    const fireflyPositions = new Float32Array(fireflyCount * 3);
    const fireflySpeeds = new Float32Array(fireflyCount);

    for (let i = 0; i < fireflyCount; i++) {
      // Firefly positions bounded near the garden pathway
      fireflyPositions[i * 3] = (Math.random() - 0.5) * 12; // X
      fireflyPositions[i * 3 + 1] = 0.5 + Math.random() * 4.5; // Y
      fireflyPositions[i * 3 + 2] = 15 - Math.random() * 35; // Z
      fireflySpeeds[i] = 0.4 + Math.random() * 0.8;
    }

    fireflyGeo.setAttribute("position", new THREE.BufferAttribute(fireflyPositions, 3));

    // Custom circular glow firefly texture
    const fireflyCanvas = document.createElement("canvas");
    fireflyCanvas.width = 16;
    fireflyCanvas.height = 16;
    const ctx = fireflyCanvas.getContext("2d");
    if (ctx) {
      const grad = ctx.createRadialGradient(8, 8, 0, 8, 8, 8);
      grad.addColorStop(0, "rgba(235, 255, 140, 1)");
      grad.addColorStop(0.3, "rgba(180, 240, 80, 0.8)");
      grad.addColorStop(1, "rgba(180, 240, 80, 0)");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 16, 16);
    }
    const fireflyTexture = new THREE.CanvasTexture(fireflyCanvas);

    const fireflyMat = new THREE.PointsMaterial({
      size: 0.35,
      map: fireflyTexture,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const fireflies = new THREE.Points(fireflyGeo, fireflyMat);
    scene.add(fireflies);
    stateRef.current.fireflies = fireflies;

    // --- 10. Gently Falling Blossom Petals ---
    const petalCount = 100;
    const petalGeo = new THREE.BufferGeometry();
    const petalPositions = new Float32Array(petalCount * 3);
    const petalRotations = new Float32Array(petalCount * 3);

    for (let i = 0; i < petalCount; i++) {
      petalPositions[i * 3] = (Math.random() - 0.5) * 14; // X
      petalPositions[i * 3 + 1] = 4 + Math.random() * 8; // Y (starts higher up)
      petalPositions[i * 3 + 2] = 12 - Math.random() * 32; // Z
      
      petalRotations[i * 3] = Math.random() * Math.PI; // rotX
      petalRotations[i * 3 + 1] = Math.random() * Math.PI; // rotY
      petalRotations[i * 3 + 2] = Math.random() * Math.PI; // rotZ
    }

    petalGeo.setAttribute("position", new THREE.BufferAttribute(petalPositions, 3));

    // Create a beautiful circular pink blossom petal canvas
    const petalCanvas = document.createElement("canvas");
    petalCanvas.width = 16;
    petalCanvas.height = 16;
    const pCtx = petalCanvas.getContext("2d");
    if (pCtx) {
      pCtx.beginPath();
      pCtx.ellipse(8, 8, 6, 4, Math.PI / 4, 0, 2 * Math.PI);
      const pGrad = pCtx.createRadialGradient(8, 8, 0, 8, 8, 8);
      pGrad.addColorStop(0, "rgba(255, 180, 200, 0.95)");
      pGrad.addColorStop(0.7, "rgba(255, 140, 170, 0.7)");
      pGrad.addColorStop(1, "rgba(255, 140, 170, 0)");
      pCtx.fillStyle = pGrad;
      pCtx.fill();
    }
    const petalTexture = new THREE.CanvasTexture(petalCanvas);

    const petalMat = new THREE.PointsMaterial({
      size: 0.28,
      map: petalTexture,
      transparent: true,
      blending: THREE.NormalBlending,
      depthWrite: false,
    });

    const fallingPetals = new THREE.Points(petalGeo, petalMat);
    scene.add(fallingPetals);
    stateRef.current.fallingPetals = fallingPetals;

    // --- 11. Mouse & Parallax Handling ---
    const handleMouseMove = (e: MouseEvent) => {
      // Scale coordinates between -1 and 1
      stateRef.current.mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
      stateRef.current.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
    };
    window.addEventListener("mousemove", handleMouseMove);

    // --- 12. Animation & Frame Loop ---
    let animationId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animationId = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      const elapsedTime = clock.getElapsedTime();
      
      const state = stateRef.current;
      if (!state.scene || !state.camera || !state.renderer) return;

      // Parallax calculations based on mouse
      // Gentle orbit drift
      const targetX = state.mouse.x * 1.5;
      const targetY = 2.5 + state.mouse.y * 0.7;
      
      if (!isEntering) {
        // Soft lag/easing for natural parallax camera glide
        state.targetCameraPos.x = targetX;
        state.targetCameraPos.y = targetY;
        state.camera.position.lerp(state.targetCameraPos, 0.05);
        state.camera.lookAt(0, 1.8, 0);
      } else {
        // Dramatic entrance fly-through!
        // Camera flies from current position down to Z = -5
        state.targetCameraPos.set(0, 1.8, -5.5);
        state.camera.position.lerp(state.targetCameraPos, 0.032);
        
        // Tilt camera slightly up as we enter to make it majestic
        const lookTarget = new THREE.Vector3(0, 1.9 + Math.sin(elapsedTime * 0.5) * 0.05, -12);
        state.camera.lookAt(lookTarget);

        // Open the gates beautifully
        if (state.gateLeft && state.gateRight) {
          // Gate pivots on hinge, rotate outward
          // Left gate rotates clockwise (negative Y)
          // Right gate rotates counter-clockwise (positive Y)
          const targetRotLeft = -Math.PI / 1.5;
          const targetRotRight = Math.PI / 1.5;

          state.gateLeft.rotation.y = THREE.MathUtils.lerp(state.gateLeft.rotation.y, targetRotLeft, 0.04);
          state.gateRight.rotation.y = THREE.MathUtils.lerp(state.gateRight.rotation.y, targetRotRight, 0.04);
        }

        // Trigger transition once camera has flown deep past the gate at Z = 3.5
        if (state.camera.position.z < 3.2 && !state.onEnteredCalled) {
          state.onEnteredCalled = true;
          // Fade out the canvas and transition to dashboard after flying in
          setTimeout(() => {
            onEntered();
          }, 600);
        }
      }

      // Wind & Leaf sway
      state.windTime += delta;
      const windForce = Math.sin(state.windTime * 1.2) * 0.03;
      state.leaves.forEach((leaf) => {
        leaf.rotation.x += windForce * 0.01;
        leaf.rotation.y += windForce * 0.02;
      });

      // Animate fireflies floating randomly using sine/cosine offsets
      if (state.fireflies) {
        const positions = state.fireflies.geometry.attributes.position.array as Float32Array;
        for (let i = 0; i < fireflyCount; i++) {
          const speed = fireflySpeeds[i];
          const index = i * 3;
          
          // Floating wave
          positions[index] += Math.sin(elapsedTime * speed + i) * 0.004; // X drift
          positions[index + 1] += Math.cos(elapsedTime * speed * 0.5 + i) * 0.003; // Y drift
          positions[index + 2] += Math.sin(elapsedTime * speed * 1.2 + i) * 0.005; // Z drift

          // Bounce back to bounds if drift goes too far
          if (Math.abs(positions[index]) > 7) positions[index] *= -0.9;
          if (positions[index + 1] < 0.2 || positions[index + 1] > 5) positions[index + 1] = 2.0;
          if (positions[index + 2] > 16) positions[index + 2] = -20;
          if (positions[index + 2] < -22) positions[index + 2] = 14;
        }
        state.fireflies.geometry.attributes.position.needsUpdate = true;
      }

      // Animate falling rose petals falling and swirling
      if (state.fallingPetals) {
        const positions = state.fallingPetals.geometry.attributes.position.array as Float32Array;
        for (let i = 0; i < petalCount; i++) {
          const index = i * 3;
          
          // Falling speed
          positions[index + 1] -= 0.012 + (i % 5) * 0.004; // fall Y
          // Gentle sway sideways with wind
          positions[index] += Math.sin(elapsedTime * 0.8 + i) * 0.006 + windForce * 0.05; // sway X
          
          // Reset when petal hits the ground
          if (positions[index + 1] < 0.02) {
            positions[index] = (Math.random() - 0.5) * 14; // X
            positions[index + 1] = 6 + Math.random() * 4; // Y
            positions[index + 2] = 12 - Math.random() * 32; // Z
          }
        }
        state.fallingPetals.geometry.attributes.position.needsUpdate = true;
      }

      state.renderer.render(state.scene, state.camera);
    };

    animate();

    // --- 13. Window Resize Handling ---
    const handleResize = () => {
      if (!containerRef.current || !stateRef.current.camera || !stateRef.current.renderer) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;

      stateRef.current.camera.aspect = w / h;
      stateRef.current.camera.updateProjectionMatrix();
      stateRef.current.renderer.setSize(w, h);
    };
    window.addEventListener("resize", handleResize);

    // --- 14. Cleanup ---
    return () => {
      clearInterval(loadTimer);
      cancelAnimationFrame(animationId);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("resize", handleResize);
      renderer.dispose();
      scene.clear();
    };
  }, [isEntering]);

  const handleStartEntrance = () => {
    setIsEntering(true);
    // Trigger romantic chime/synth sounds if they exist
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : 0.65;
      audioRef.current.play().catch((err) => {
        console.log("Audio play deferred or failed until direct user interaction gesture:", err);
      });
    }
  };

  return (
    <div id="garden-3d-entrance-container" ref={containerRef} className="relative w-full h-screen overflow-hidden bg-[#0f1d13] select-none">
      {/* 3D WebGL Canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full block" />

      {/* Cinematic Vignette Overlay */}
      <div id="vignette-overlay" className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,rgba(0,0,0,0)_20%,rgba(0,0,0,0.8)_100%)] z-10" />

      {/* Ambient Lighting Glow elements */}
      <div id="mystic-glow" className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_top,rgba(26,46,26,0.15)_0%,rgba(0,0,0,0)_70%)] z-10" />

      {/* Loading Overlay */}
      {loadingProgress < 100 && (
        <div id="canvas-loading-screen" className="absolute inset-0 flex flex-col items-center justify-center bg-[#0f1d13] z-50 transition-opacity duration-1000">
          <div className="flex flex-col items-center max-w-sm px-6 text-center animate-fade-in">
            {/* Elegant Calligraphy Loader */}
            <h2 className="font-serif text-3xl tracking-widest text-[#f4f1ea] mb-3 font-light">
              N & E
            </h2>
            <p className="font-sans text-xs tracking-[0.25em] text-[#8ea495] uppercase mb-8">
              Growing the Garden
            </p>
            <div className="w-48 h-[2px] bg-[#1a3322] rounded-full overflow-hidden mb-3">
              <div 
                className="h-full bg-[#d4af37] transition-all duration-300 rounded-full"
                style={{ width: `${loadingProgress}%` }}
              />
            </div>
            <p className="font-mono text-[9px] text-[#556b5c]">
              Loading {loadingProgress}%
            </p>
          </div>
        </div>
      )}

      {/* Controls Bar (Always present in high z-index) */}
      <div id="entrance-controls-bar" className="absolute top-6 left-6 right-6 flex justify-between items-center z-40 pointer-events-none">
        {/* Monogram branding */}
        <div className="pointer-events-auto bg-[#0f1d13]/75 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-[#d4af37]/20 shadow-xl flex items-center gap-2">
          <span className="font-serif text-sm text-[#f4f1ea] font-medium tracking-widest">N & E</span>
          <div className="w-1.5 h-1.5 rounded-full bg-[#d4af37] animate-pulse" />
          <span className="font-sans text-[10px] tracking-[0.18em] text-[#8ea495] uppercase">Proposal</span>
        </div>

        {/* Mute controls */}
        <button
          id="toggle-entrance-mute-btn"
          onClick={toggleMute}
          className="pointer-events-auto w-10 h-10 rounded-full bg-[#0f1d13]/75 backdrop-blur-md border border-[#d4af37]/20 flex items-center justify-center text-[#f4f1ea] hover:bg-[#1a2e1a] hover:border-[#d4af37]/50 transition-all duration-300 shadow-xl"
          title={isMuted ? "Unmute Ambient Music" : "Mute Music"}
        >
          {isMuted ? <VolumeX className="w-4.5 h-4.5" /> : <Volume2 className="w-4.5 h-4.5" />}
        </button>
      </div>

      {/* Floating Interactive Call-To-Action Overlay */}
      {!isEntering && loadingProgress >= 100 && (
        <div id="entrance-invitation-card" className="absolute inset-0 flex items-center justify-center z-30 px-6">
          <div className="max-w-md w-full bg-[#0f1d13]/85 backdrop-blur-md border border-[#d4af37]/30 rounded-2xl p-8 text-center shadow-[0_20px_50px_rgba(0,0,0,0.8)] border-t-[#d4af37]/50 transition-all duration-500 animate-slide-up">
            
            {/* Elegant Flower Emblem */}
            <div className="flex justify-center mb-6">
              <div className="relative flex items-center justify-center w-12 h-12 rounded-full border border-[#d4af37]/30 bg-[#1a2e1a]/40">
                <span className="text-xl text-[#d4af37] animate-pulse">🌸</span>
                <div className="absolute inset-0 rounded-full border border-dashed border-[#d4af37]/10 animate-[spin_20s_linear_infinite]" />
              </div>
            </div>

            <p className="font-sans text-[11px] tracking-[0.3em] text-[#8ea495] uppercase mb-3">
              You Are Cordially Invited
            </p>
            
            <h1 className="font-serif text-3xl md:text-4xl text-[#f4f1ea] tracking-wide mb-2 font-extralight leading-relaxed">
              Nichelle <span className="font-sans text-xl text-[#d4af37]/80 italic">&amp;</span> Eniola
            </h1>
            
            <p className="font-serif text-lg text-[#d4af37] italic tracking-wide mb-6">
              Proposal Celebration
            </p>

            <div className="w-16 h-[1px] bg-[#d4af37]/30 mx-auto mb-6" />

            <div className="space-y-1.5 mb-8">
              <p className="font-sans text-xs tracking-widest text-[#f4f1ea]/80">
                AUGUST 1ST, 2026
              </p>
              <p className="font-sans text-[10px] tracking-[0.15em] text-[#8ea495] uppercase">
                Acworth, Georgia
              </p>
            </div>

            {/* Immersive Enter Button */}
            <button
              id="enter-garden-btn"
              onClick={handleStartEntrance}
              className="group relative w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-[#1a2e1a] to-[#0f1d13] border border-[#d4af37]/40 text-[#f4f1ea] font-sans text-xs tracking-[0.25em] uppercase font-medium hover:from-[#254225] hover:to-[#1a2e1a] hover:border-[#d4af37] hover:text-white hover:scale-[1.02] transition-all duration-500 cursor-pointer shadow-[0_4px_20px_rgba(0,0,0,0.4)]"
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                Open Garden <Play className="w-3 h-3 text-[#d4af37] group-hover:translate-x-0.5 transition-transform" />
              </span>
              <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-[#d4af37]/0 via-[#d4af37]/10 to-[#d4af37]/0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
            </button>
            
            <p className="font-mono text-[9px] text-[#8ea495]/60 mt-4 flex items-center justify-center gap-1">
              <Eye className="w-3 h-3" /> Drag mouse to look around the garden
            </p>
          </div>
        </div>
      )}

      {/* Smooth Screen Transition Curtain */}
      {isEntering && (
        <div className="absolute inset-0 bg-[#fcfaf7] pointer-events-none opacity-0 z-50 animate-[fade-in-bg_1.6s_ease-in-out_forwards]" style={{ animationDelay: '0.8s' }} />
      )}
    </div>
  );
}
