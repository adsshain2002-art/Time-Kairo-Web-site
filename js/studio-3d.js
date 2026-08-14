/**
 * TIME KAIRO — Interactive WebGL 3D T-Shirt Studio
 * Powered by Three.js & OrbitControls
 * 360° Rotation, Dynamic Real-Time Fabric & Graphic Texture Mapping
 */

(function () {
  'use strict';

  window.Studio3D = {
    scene: null,
    camera: null,
    renderer: null,
    controls: null,
    tshirtGroup: null,
    frontMesh: null,
    backMesh: null,
    sleevesMesh: null,
    collarMesh: null,
    offscreenCanvas: null,
    offscreenCtx: null,
    canvasTexture: null,
    isInitialized: false,
    animFrameId: null,
    currentGarmentColor: '#121218',
    isAutoRotating: false,
    autoRotateTimer: null,

    init: function () {
      if (this.isInitialized) return;

      const container = document.getElementById('studio-3d-wrapper');
      const canvas = document.getElementById('studio-3d-canvas');
      if (!container || !canvas) return;

      if (typeof THREE === 'undefined') {
        console.warn('Three.js library not loaded yet.');
        return;
      }

      const rect = container.getBoundingClientRect();
      const width = rect.width || 400;
      const height = rect.height || 500;

      // 1. Three.js Scene Setup
      this.scene = new THREE.Scene();

      // 2. Perspective Camera
      this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
      this.camera.position.set(0, 0, 4.8);

      // 3. WebGL Renderer
      this.renderer = new THREE.WebGLRenderer({
        canvas: canvas,
        alpha: true,
        antialias: true,
        preserveDrawingBuffer: true,
        powerPreference: 'high-performance'
      });
      this.renderer.setSize(width, height);
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      this.renderer.shadowMap.enabled = true;
      this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

      // 4. Orbit Controls (360 Degree Interactive Drag Rotation)
      let OrbitControlsClass = THREE.OrbitControls;
      if (typeof OrbitControlsClass === 'undefined' && typeof OrbitControls !== 'undefined') {
        OrbitControlsClass = OrbitControls;
      }

      if (typeof OrbitControlsClass !== 'undefined') {
        this.controls = new OrbitControlsClass(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.08;
        this.controls.rotateSpeed = 0.85;
        this.controls.zoomSpeed = 0.8;
        this.controls.minDistance = 2.8;
        this.controls.maxDistance = 7.0;
        this.controls.maxPolarAngle = Math.PI * 0.85;
        this.controls.minPolarAngle = Math.PI * 0.15;
      }

      // 5. Lighting Setup for Realistic Fabric Depth & Metallic Cyber Highlights
      this.setupLights();

      // 6. Dynamic Offscreen Texture Canvas Setup
      this.setupOffscreenCanvas();

      // 7. Create 3D T-Shirt Geometry Mesh
      this.create3DTShirtMesh();

      // 8. Event Listeners (Resize)
      window.addEventListener('resize', this.onWindowResize.bind(this));

      this.isInitialized = true;
      this.animate();
      this.updateTexture();
    },

    setupLights: function () {
      // Soft Ambient Light
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
      this.scene.add(ambientLight);

      // Key Directional Studio Light
      const keyLight = new THREE.DirectionalLight(0xffffff, 0.85);
      keyLight.position.set(3, 5, 4);
      keyLight.castShadow = true;
      this.scene.add(keyLight);

      // Cyber Cyan Rim Light
      const rimLight = new THREE.DirectionalLight(0x00f2fe, 0.45);
      rimLight.position.set(-4, 2, -4);
      this.scene.add(rimLight);

      // Soft Gold Fill Light
      const fillLight = new THREE.DirectionalLight(0xe6c875, 0.25);
      fillLight.position.set(0, -3, 3);
      this.scene.add(fillLight);
    },

    setupOffscreenCanvas: function () {
      this.offscreenCanvas = document.createElement('canvas');
      this.offscreenCanvas.width = 1024;
      this.offscreenCanvas.height = 1024;
      this.offscreenCtx = this.offscreenCanvas.getContext('2d');

      this.canvasTexture = new THREE.CanvasTexture(this.offscreenCanvas);
      this.canvasTexture.wrapS = THREE.ClampToEdgeWrapping;
      this.canvasTexture.wrapT = THREE.ClampToEdgeWrapping;
      this.canvasTexture.minFilter = THREE.LinearFilter;
      this.canvasTexture.magFilter = THREE.LinearFilter;
    },

    create3DTShirtMesh: function () {
      this.tshirtGroup = new THREE.Group();

      // Shared High-Density Heavy Cotton Fabric Material
      const fabricMaterial = new THREE.MeshStandardMaterial({
        map: this.canvasTexture,
        roughness: 0.82,
        metalness: 0.02,
        side: THREE.DoubleSide
      });

      // --- A. REAL 3D TUBULAR TORSO (Cylinder with flattened z depth & sloped chest) ---
      const torsoW = 1.85;
      const torsoH = 2.4;

      const torsoGeo = new THREE.CylinderGeometry(torsoW * 0.52, torsoW * 0.5, torsoH, 64, 32, true);
      // Flatten Z to body proportions and curve chest/back
      const torsoPos = torsoGeo.attributes.position;
      const torsoUvs = torsoGeo.attributes.uv;

      for (let i = 0; i < torsoPos.count; i++) {
        let x = torsoPos.getX(i);
        let y = torsoPos.getY(i);
        let z = torsoPos.getZ(i);

        // Scale Z axis down to realistic body thickness (~0.45 ratio)
        z *= 0.45;

        // Taper waist slightly
        const waistFactor = 1.0 - (y + 1.2) * 0.05;
        x *= waistFactor;

        torsoPos.setXYZ(i, x, y, z);

        // UV Projection:
        // Front Half (z >= 0): Map x to Left Texture Canvas (u = 0.0 .. 0.5)
        // Back Half (z < 0): Map x to Right Texture Canvas (u = 0.5 .. 1.0)
        let u = 0.25 + (x / torsoW) * 0.46;
        let v = 0.5 + (y / torsoH) * 0.9;

        if (z < 0) {
          u = 0.75 - (x / torsoW) * 0.46;
        }

        torsoUvs.setXY(i, Math.max(0.01, Math.min(0.99, u)), Math.max(0.01, Math.min(0.99, v)));
      }
      torsoGeo.computeVertexNormals();

      this.frontMesh = new THREE.Mesh(torsoGeo, fabricMaterial);
      this.tshirtGroup.add(this.frontMesh);

      // --- B. REAL 3D SLEEVES (Angled hollow sleeves) ---
      const sleeveRadiusTop = 0.40;
      const sleeveRadiusBot = 0.36;
      const sleeveLength = 0.95;

      const sleeveGeoLeft = new THREE.CylinderGeometry(sleeveRadiusTop, sleeveRadiusBot, sleeveLength, 32, 16, true);
      const sleeveUvsL = sleeveGeoLeft.attributes.uv;
      for (let i = 0; i < sleeveUvsL.count; i++) {
        sleeveUvsL.setXY(i, 0.02, 0.02);
      }
      sleeveGeoLeft.computeVertexNormals();

      const leftSleeve = new THREE.Mesh(sleeveGeoLeft, fabricMaterial);
      leftSleeve.position.set(1.18, 0.50, 0);
      leftSleeve.rotation.z = -Math.PI * 0.24; // 43° streetwear drape angle
      leftSleeve.rotation.y = -Math.PI * 0.04;
      leftSleeve.scale.set(1.0, 1.0, 0.55);
      this.tshirtGroup.add(leftSleeve);

      const rightSleeve = new THREE.Mesh(sleeveGeoLeft.clone(), fabricMaterial);
      rightSleeve.position.set(-1.18, 0.50, 0);
      rightSleeve.rotation.z = Math.PI * 0.24;
      rightSleeve.rotation.y = Math.PI * 0.04;
      rightSleeve.scale.set(1.0, 1.0, 0.55);
      this.tshirtGroup.add(rightSleeve);

      // --- C. REAL 3D CREWNECK COLLAR RIBBING ---
      const collarGeo = new THREE.TorusGeometry(0.44, 0.065, 16, 48);
      const collarUvs = collarGeo.attributes.uv;
      for (let i = 0; i < collarUvs.count; i++) {
        collarUvs.setXY(i, 0.02, 0.02);
      }
      const collarMesh = new THREE.Mesh(collarGeo, fabricMaterial);
      collarMesh.rotation.x = Math.PI * 0.48;
      collarMesh.position.set(0, 1.15, 0);
      collarMesh.scale.set(1.0, 0.6, 1.0);
      this.tshirtGroup.add(collarMesh);

      // --- D. 3D STUDIO CONTACT SHADOW PLANE UNDER SHIRT ---
      const shadowCanvas = document.createElement('canvas');
      shadowCanvas.width = 256;
      shadowCanvas.height = 256;
      const sCtx = shadowCanvas.getContext('2d');
      const grad = sCtx.createRadialGradient(128, 128, 10, 128, 128, 120);
      grad.addColorStop(0, 'rgba(0, 0, 0, 0.6)');
      grad.addColorStop(0.5, 'rgba(0, 0, 0, 0.2)');
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      sCtx.fillStyle = grad;
      sCtx.fillRect(0, 0, 256, 256);

      const shadowTex = new THREE.CanvasTexture(shadowCanvas);
      const shadowGeo = new THREE.PlaneGeometry(3.6, 3.6);
      const shadowMat = new THREE.MeshBasicMaterial({
        map: shadowTex,
        transparent: true,
        opacity: 0.7,
        depthWrite: false
      });
      const shadowPlane = new THREE.Mesh(shadowGeo, shadowMat);
      shadowPlane.rotation.x = -Math.PI * 0.5;
      shadowPlane.position.set(0, -1.35, 0);
      this.scene.add(shadowPlane);

      // Center Group in Scene
      this.tshirtGroup.position.set(0, 0, 0);
      this.scene.add(this.tshirtGroup);
    },

    updateTexture: function () {
      if (!this.offscreenCtx) return;

      const ctx = this.offscreenCtx;
      const w = 1024;
      const h = 1024;

      // Determine Garment Hex Color
      let hexColor = '#121218';
      if (typeof customStudioState !== 'undefined' && customStudioState.color) {
        const colorMap = {
          'black': '#121218',
          'white': '#F8FAFC',
          'cyan': '#00f2fe',
          'beige': '#D4B886',
          'navy': '#0F172A',
          'crimson': '#991B1B'
        };
        hexColor = colorMap[customStudioState.color] || customStudioState.color;
      }
      this.currentGarmentColor = hexColor;

      // Clear Canvas
      ctx.clearRect(0, 0, w, h);

      // Fill Garment Base Background
      ctx.fillStyle = hexColor;
      ctx.fillRect(0, 0, w, h);

      // Add Micro-Cotton Weave Noise Pattern
      ctx.fillStyle = hexColor === '#F8FAFC' ? 'rgba(0, 0, 0, 0.03)' : 'rgba(255, 255, 255, 0.04)';
      for (let y = 0; y < h; y += 4) {
        for (let x = 0; x < w; x += 4) {
          if ((x + y) % 8 === 0) {
            ctx.fillRect(x, y, 2, 2);
          }
        }
      }

      // Draw Seam Stitch Lines (Visual Detail)
      ctx.strokeStyle = hexColor === '#F8FAFC' ? 'rgba(0, 0, 0, 0.15)' : 'rgba(255, 255, 255, 0.15)';
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);

      // Collar Seams on Left & Right halves
      ctx.beginPath();
      ctx.arc(256, 120, 140, 0, Math.PI);
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(768, 120, 140, 0, Math.PI);
      ctx.stroke();

      ctx.setLineDash([]); // Reset dash

      // --- DRAW ARTWORK IMAGES (FRONT & BACK STRICTLY CLIPPED) ---
      const frontImgEl = document.getElementById('studio-artwork-img') || document.getElementById('studio-front-artwork-img');
      const backImgEl = document.getElementById('studio-back-artwork-img');
      const scaleVal = (typeof customStudioState !== 'undefined' ? parseInt(customStudioState.scale) || 100 : 100) / 100;
      const offX = typeof customStudioState !== 'undefined' ? (customStudioState.offsetX || 0) * 1.2 : 0;
      const offY = typeof customStudioState !== 'undefined' ? (customStudioState.offsetY || 0) * 1.2 : 0;
      const placement = typeof customStudioState !== 'undefined' ? customStudioState.placement : 'front-center';

      // 1. Draw Front Artwork (Strictly Clipped to Left Half of Texture Canvas: x 0..500)
      if (frontImgEl && frontImgEl.src && !frontImgEl.classList.contains('hidden') && frontImgEl.complete && frontImgEl.naturalWidth > 0 && placement !== 'full-back') {
        const maxBox = 320 * scaleVal;
        const imgAspect = frontImgEl.naturalWidth / frontImgEl.naturalHeight;
        let drawW = maxBox;
        let drawH = maxBox;
        if (imgAspect > 1) {
          drawH = maxBox / imgAspect;
        } else {
          drawW = maxBox * imgAspect;
        }

        ctx.save();
        ctx.beginPath();
        ctx.rect(0, 0, 500, 1024); // Strict Front Canvas Clipping Region
        ctx.clip();

        if (placement === 'pocket') {
          // Left Chest Pocket (Front: x = 340)
          ctx.drawImage(frontImgEl, 340 - drawW / 2 + offX, 420 - drawH / 2 + offY, drawW, drawH);
        } else {
          // Front Center Chest (Front: x = 256)
          ctx.drawImage(frontImgEl, 256 - drawW / 2 + offX, 500 - drawH / 2 + offY, drawW, drawH);
        }
        ctx.restore();
      }

      // 2. Draw Back Artwork (Strictly Clipped to Right Half of Texture Canvas: x 512..1024)
      const activeBackImg = (placement === 'full-back' && frontImgEl && frontImgEl.src && !frontImgEl.classList.contains('hidden')) ? frontImgEl : backImgEl;
      if (activeBackImg && activeBackImg.src && !activeBackImg.classList.contains('hidden') && activeBackImg.complete && activeBackImg.naturalWidth > 0) {
        const maxBox = 320 * scaleVal;
        const imgAspect = activeBackImg.naturalWidth / activeBackImg.naturalHeight;
        let drawW = maxBox;
        let drawH = maxBox;
        if (imgAspect > 1) {
          drawH = maxBox / imgAspect;
        } else {
          drawW = maxBox * imgAspect;
        }

        ctx.save();
        ctx.beginPath();
        ctx.rect(512, 0, 512, 1024); // Strict Back Canvas Clipping Region
        ctx.clip();

        // Full Back (Back: x = 768)
        ctx.drawImage(activeBackImg, 768 - drawW / 2 + offX, 500 - drawH / 2 + offY, drawW, drawH);
        ctx.restore();
      }

      // --- DRAW CUSTOM TEXT OVERLAY ---
      const textEl = document.getElementById('studio-text-overlay');
      if (textEl && !textEl.classList.contains('hidden') && textEl.innerText.trim() !== '') {
        const textStr = textEl.innerText.trim();
        ctx.save();
        ctx.font = 'bold 36px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = textEl.style.color || '#00f2fe';
        ctx.shadowColor = 'rgba(0,0,0,0.8)';
        ctx.shadowBlur = 8;

        if (placement === 'full-back') {
          ctx.save();
          ctx.beginPath();
          ctx.rect(512, 0, 512, 1024);
          ctx.clip();
          ctx.fillText(textStr, 768, 650);
          ctx.restore();
        } else {
          ctx.save();
          ctx.beginPath();
          ctx.rect(0, 0, 500, 1024);
          ctx.clip();
          ctx.fillText(textStr, 256, 650);
          ctx.restore();
        }
        ctx.restore();
      }

      // Notify Three.js to update texture GPU buffer
      if (this.canvasTexture) {
        this.canvasTexture.needsUpdate = true;
      }
    },

    setPresetView: function (viewSide) {
      if (!this.camera || !this.controls) return;

      const duration = 800;
      const startTime = performance.now();

      const startAngle = this.controls.getAzimuthalAngle();
      const targetAngle = viewSide === 'back' ? Math.PI : 0;

      const startPolar = this.controls.getPolarAngle();
      const targetPolar = Math.PI * 0.5; // Eye-level horizontal view

      const self = this;

      function stepCamera(now) {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1.0);
        // Smooth Ease-Out Cubic
        const ease = 1 - Math.pow(1 - progress, 3);

        const currentAzimuth = startAngle + (targetAngle - startAngle) * ease;
        const currentPolar = startPolar + (targetPolar - startPolar) * ease;

        const radius = self.camera.position.distanceTo(self.controls.target);

        self.camera.position.x = radius * Math.sin(currentPolar) * Math.sin(currentAzimuth);
        self.camera.position.y = radius * Math.cos(currentPolar);
        self.camera.position.z = radius * Math.sin(currentPolar) * Math.cos(currentAzimuth);

        self.controls.update();

        if (progress < 1.0) {
          requestAnimationFrame(stepCamera);
        }
      }

      requestAnimationFrame(stepCamera);
    },

    onWindowResize: function () {
      const container = document.getElementById('studio-3d-wrapper');
      if (!container || !this.camera || !this.renderer) return;

      const rect = container.getBoundingClientRect();
      const width = rect.width || 400;
      const height = rect.height || 500;

      this.camera.aspect = width / height;
      this.camera.updateProjectionMatrix();

      this.renderer.setSize(width, height);
    },

    animate: function () {
      this.animFrameId = requestAnimationFrame(this.animate.bind(this));

      if (this.controls) {
        this.controls.update();
      }

      // Gentle subtle breathing float animation when not interacting
      if (this.tshirtGroup) {
        this.tshirtGroup.position.y = -0.1 + Math.sin(Date.now() * 0.0015) * 0.03;
      }

      if (this.renderer && this.scene && this.camera) {
        this.renderer.render(this.scene, this.camera);
      }
    }
  };
})();
