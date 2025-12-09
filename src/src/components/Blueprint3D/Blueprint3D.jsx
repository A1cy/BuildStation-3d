import React, { Component } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { OutlinePass } from 'three/examples/jsm/postprocessing/OutlinePass';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass';
import { FXAAShader } from 'three/examples/jsm/shaders/FXAAShader';
import { Model, Canvas2D, MODES } from '../../core/Blueprint3D';
import Configuration, { configDimensionVisible, BP3D_EVENT_CONFIG_CHANGED } from '../../core/Configuration';
import Dimensioning from '../../core/Dimensioning';
import FloorPlanView from '../FloorPlanner/FloorPlanView';
import './Blueprint3D.css';

/**
 * Blueprint3D React Component
 * 
 * React wrapper for the Blueprint3D floor planning system.
 * Manages the 2D floor planner and 3D viewer, coordinates between views.
 * 
 * Props:
 * - viewMode: '2d' | '3d' - Current view mode
 * - measureUnit: string - Measurement unit (in/cm/m)
 * - onItemSelected: (item) => void - Called when item is selected
 * - onItemUnselected: () => void - Called when item is deselected
 * - onSwitchMode: () => void - Called when view mode should switch
 */

class Blueprint3D extends Component {
  constructor(props) {
    super(props);

    // Refs
    this.containerRef = React.createRef();
    this.canvas2DRef = null;

    // Blueprint3D components
    this.model = null;
    this.canvas2d = null;
    this.viewmodel = null;

    // Three.js components
    this.renderer = null;
    this.camera = null;
    this.controls = null;
    this.groundPlane = null;
    this.skybox = null;

    // **PHASE 2B: 3D Interaction System**
    this.raycaster = null;  // For picking 3D objects with mouse
    this.mouse = new THREE.Vector2();  // Normalized mouse coordinates (-1 to +1)
    this.selectedItem = null;  // Currently selected 3D item
    this.rotationGizmo = null;  // **NEW: Rotation gizmo visual indicator**
    this.hoveredItem = null;  // Item under mouse cursor

    // **PHASE 2B Priority 2: Drag & Drop State**
    this.isDragging = false;  // Whether user is currently dragging an item
    this.dragStartPosition = null;  // Item position when drag started (THREE.Vector3)
    this.dragOffset = null;  // Offset from item center to click point (THREE.Vector3)
    this.dragPlane = null;  // Invisible plane for raycasting during drag (THREE.Plane)

    // **PHASE 2B Priority 3: Visual Feedback State**
    this.currentCursor = 'default';  // Current cursor style

    // **PHASE 2D: Post-Processing Effects**
    this.composer = null;  // EffectComposer for post-processing
    this.outlinePass = null;  // OutlinePass for selection highlighting

    // State
    this.state = {
      loading: false,
      floorplanMode: MODES.MOVE,
    };
  }

  componentDidMount() {
    this.initBlueprint3D();
    window.addEventListener('resize', this.handleWindowResize);
  }

  componentWillUnmount() {
    this.cleanupBlueprint3D();
    window.removeEventListener('resize', this.handleWindowResize);
    document.removeEventListener('bp3d_highlight_changed', this.handleHighlightChanged);

    // **NEW: Cleanup keyboard shortcuts**
    if (this.keyboardHandler) {
      document.removeEventListener('keydown', this.keyboardHandler);
    }
  }

  componentDidUpdate(prevProps) {
    // Handle view mode changes
    if (prevProps.viewMode !== this.props.viewMode) {
      this.handleViewModeChange();
    }
  }

  /**
   * Initialize Blueprint3D system
   */
  initBlueprint3D = () => {
    console.log('Initializing Blueprint3D...');

    // Create Blueprint3D Model
    this.model = new Model('/Blueprint3D-assets');

    // Create ViewModel for 2D canvas
    this.createViewModel();

    // Initialize 3D renderer
    this.init3DRenderer();

    // Register floor plan update callbacks
    this.model.floorplan.fireOnUpdatedRooms(() => {
      if (this.canvas2d) {
        this.canvas2d.draw();
      }
      // Update 3D scene when floor plan changes
      this.update3DFloorPlan();
    });

    console.log('Blueprint3D initialized', this.model);
    console.log('Floorplan walls:', this.model.floorplan.walls.length);
    console.log('Floorplan rooms:', this.model.floorplan.rooms.length);

    // Initialize canvas if it was already loaded
    if (this.canvas2DRef && !this.canvas2d) {
      this.handleCanvasLoaded(this.canvas2DRef);
    }

    // CRITICAL FIX: Force initial 3D update after Model creates default room
    // The callback above may not fire for the initial room creation
    setTimeout(() => {
      console.log('🔄 Forcing initial 3D floor plan update...');
      this.update3DFloorPlan();
    }, 100);
  };

  /**
   * Create ViewModel for 2D canvas camera and interaction
   */
  createViewModel = () => {
    this.viewmodel = {
      mode: MODES.MOVE,
      targetX: 0,
      targetY: 0,
      lastNode: null,
      
      // Camera properties
      centerX: 0,
      centerY: 0,
      scale: 1.0,

      /**
       * Convert world X coordinate to screen coordinate
       * @param {number} x - World X coordinate
       * @returns {number} Screen X coordinate
       */
      convertX: (x) => {
        if (!this.canvas2DRef) return 0;
        return (x - this.viewmodel.centerX) * this.viewmodel.scale + 
               this.canvas2DRef.width / 2;
      },

      /**
       * Convert world Y coordinate to screen coordinate  
       * @param {number} y - World Y coordinate (Z in 3D)
       * @returns {number} Screen Y coordinate
       */
      convertY: (y) => {
        if (!this.canvas2DRef) return 0;
        return (y - this.viewmodel.centerY) * this.viewmodel.scale + 
               this.canvas2DRef.height / 2;
      },

      /**
       * Convert screen X coordinate to world coordinate
       * @param {number} x - Screen X coordinate
       * @returns {number} World X coordinate
       */
      convertScreenX: (x) => {
        if (!this.canvas2DRef) return 0;
        return (x - this.canvas2DRef.width / 2) / this.viewmodel.scale + 
               this.viewmodel.centerX;
      },

      /**
       * Convert screen Y coordinate to world coordinate
       * @param {number} y - Screen Y coordinate
       * @returns {number} World Y coordinate (Z in 3D)
       */
      convertScreenY: (y) => {
        if (!this.canvas2DRef) return 0;
        return (y - this.canvas2DRef.height / 2) / this.viewmodel.scale + 
               this.viewmodel.centerY;
      }
    };
  };

  /**
   * Initialize Three.js 3D renderer
   */
  init3DRenderer = () => {
    if (!this.containerRef.current) return;

    const container = this.containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // Create renderer
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true  // Enable transparency
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // PRODUCTION MATCH: Transparent background
    this.renderer.setClearColor(0x000000, 0); // Transparent (alpha = 0)

    // PRODUCTION QUALITY: Better tone mapping and encoding
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.0;
    this.renderer.outputEncoding = THREE.sRGBEncoding;

    // Add to DOM
    this.renderer.domElement.style.position = 'absolute';
    this.renderer.domElement.style.top = '0';
    this.renderer.domElement.style.left = '0';
    this.renderer.domElement.style.display = this.props.viewMode === '3d' ? 'block' : 'none';
    container.appendChild(this.renderer.domElement);

    // Create camera
    this.camera = new THREE.PerspectiveCamera(45, width / height, 1, 10000);
    // Camera position adjusted for better 6m x 4m room view
    // (8, 8, 8) gives ~14m distance = 3.8x room half-diagonal (ideal 2-4x range)
    this.camera.position.set(8, 8, 8);
    this.camera.lookAt(0, 1, 0);

    console.log('📷 Camera position:', this.camera.position);
    console.log('📷 Camera distance from origin:', Math.sqrt(8*8 + 8*8 + 8*8).toFixed(1), 'meters');

    // Add OrbitControls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.screenSpacePanning = false;
    this.controls.minDistance = 5;
    this.controls.maxDistance = 50;
    this.controls.maxPolarAngle = Math.PI / 2; // Don't go below ground

    // **PHASE 2B: Initialize Raycaster for 3D object picking**
    this.raycaster = new THREE.Raycaster();
    console.log('✅ Raycaster initialized for 3D object picking');

    // **PHASE 2B Priority 2: Initialize drag plane (horizontal at Y=0)**
    this.dragPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    console.log('✅ Drag plane initialized for item dragging');

    // **PHASE 2B: Setup mouse event handlers for item selection and dragging**
    this.setup3DInteractionHandlers();

    // **NEW: Setup keyboard shortcuts (from bundle lines 4915-4916 + custom)**
    this.setupKeyboardShortcuts();

    // **NEW: Initialize rotation gizmo (from bundle lines 4031-4094)**
    this.rotationGizmo = new RotationGizmo(this.model.scene.scene);
    console.log('✅ Rotation gizmo initialized');

    // Create enhanced lighting
    this.createLighting();

    // Create environment map for PBR materials (glass, metal)
    const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
    pmremGenerator.compileEquirectangularShader();

    // Create simple gradient environment for reflections
    const envScene = new THREE.Scene();
    envScene.background = new THREE.Color(0xe0e0e0);

    const envMap = pmremGenerator.fromScene(envScene).texture;
    this.model.scene.environment = envMap;

    pmremGenerator.dispose();

    console.log('✅ Environment map created for PBR materials');

    // Create ground plane
    this.createGroundPlane();

    // Create skybox
    this.createSkybox();

    // **PHASE 2D: Setup post-processing effects**
    this.setupPostProcessing();

    // **Setup highlight event listener**
    document.addEventListener('bp3d_highlight_changed', this.handleHighlightChanged);

    // Start render loop
    this.animate();
  };

  /**
   * Create enhanced lighting system
   */
  createLighting = () => {
    // PRODUCTION QUALITY: Brighter ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7); // Increased from 0.5
    this.model.scene.add(ambientLight);

    // Main directional light (sun) - slightly dimmer for softer shadows
    const sunLight = new THREE.DirectionalLight(0xffffff, 0.8); // Reduced from 1.0
    sunLight.position.set(500, 1000, 500);
    sunLight.castShadow = true;

    // Configure shadow properties
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 0.5;
    sunLight.shadow.camera.far = 2000;
    sunLight.shadow.camera.left = -500;
    sunLight.shadow.camera.right = 500;
    sunLight.shadow.camera.top = 500;
    sunLight.shadow.camera.bottom = -500;
    sunLight.shadow.radius = 4; // Softer shadow edges
    sunLight.shadow.bias = -0.0001; // Better shadow quality

    this.model.scene.add(sunLight);

    // PRODUCTION QUALITY: Brighter hemisphere light
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.5); // Increased from 0.3
    hemiLight.position.set(0, 500, 0);
    this.model.scene.add(hemiLight);

    // PRODUCTION QUALITY: Brighter fill light
    const fillLight = new THREE.DirectionalLight(0xffffff, 0.4); // Increased from 0.3
    fillLight.position.set(-500, 300, -500);
    this.model.scene.add(fillLight);
  };

  /**
   * Create ground plane
   */
  createGroundPlane = () => {
    const groundGeometry = new THREE.PlaneGeometry(2000, 2000);
    const groundMaterial = new THREE.MeshStandardMaterial({ 
      color: 0xcccccc,
      roughness: 0.8,
      metalness: 0.2
    });
    
    this.groundPlane = new THREE.Mesh(groundGeometry, groundMaterial);
    this.groundPlane.rotation.x = -Math.PI / 2;
    this.groundPlane.position.y = 0;
    this.groundPlane.receiveShadow = true;
    
    this.model.scene.add(this.groundPlane);
  };

  /**
   * Create skybox (gradient background)
   */
  createSkybox = () => {
    // Create sky hemisphere
    const skyGeometry = new THREE.SphereGeometry(5000, 32, 15);
    const skyMaterial = new THREE.ShaderMaterial({
      uniforms: {
        topColor: { value: new THREE.Color(0x0077ff) },
        bottomColor: { value: new THREE.Color(0xffffff) },
        offset: { value: 500 },
        exponent: { value: 0.6 }
      },
      vertexShader: `
        varying vec3 vWorldPosition;
        void main() {
          vec4 worldPosition = modelMatrix * vec4(position, 1.0);
          vWorldPosition = worldPosition.xyz;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 topColor;
        uniform vec3 bottomColor;
        uniform float offset;
        uniform float exponent;
        varying vec3 vWorldPosition;
        void main() {
          float h = normalize(vWorldPosition + offset).y;
          gl_FragColor = vec4(mix(bottomColor, topColor, max(pow(max(h, 0.0), exponent), 0.0)), 1.0);
        }
      `,
      side: THREE.BackSide
    });
    
    this.skybox = new THREE.Mesh(skyGeometry, skyMaterial);
    this.model.scene.add(this.skybox);
  };

  /**
   * **PHASE 2D: Setup post-processing effects (OutlinePass + FXAA)**
   * Extracted from production bundle lines 4797-4813
   */
  setupPostProcessing = () => {
    if (!this.renderer || !this.camera || !this.model) return;

    const width = this.containerRef.current.clientWidth;
    const height = this.containerRef.current.clientHeight;

    // Create EffectComposer
    this.composer = new EffectComposer(this.renderer);

    // Add RenderPass (basic scene rendering)
    const renderPass = new RenderPass(this.model.scene.getScene(), this.camera);
    this.composer.addPass(renderPass);

    // Add OutlinePass (selection highlighting)
    this.outlinePass = new OutlinePass(
      new THREE.Vector2(width, height),
      this.model.scene.getScene(),
      this.camera
    );

    // Configure OutlinePass properties (bundle lines 4803-4809)
    this.outlinePass.renderToScreen = false;  // Will be overridden by FXAA pass
    this.outlinePass.edgeStrength = 20;  // Outline thickness
    this.outlinePass.edgeGlow = 0.3;  // Glow intensity
    this.outlinePass.edgeThickness = 0.5;  // Edge thickness
    this.outlinePass.pulsePeriod = 2;  // Pulse animation speed
    this.outlinePass.visibleEdgeColor = new THREE.Color(0, 0, 1);  // Blue outline
    this.outlinePass.hiddenEdgeColor = new THREE.Color(0, 0, 1);  // Blue outline (hidden)

    // Enable morph targets for outline rendering
    if (this.outlinePass.depthMaterial) {
      this.outlinePass.depthMaterial.morphTargets = true;
    }
    if (this.outlinePass.prepareMaskMaterial) {
      this.outlinePass.prepareMaskMaterial.morphTargets = true;
    }

    this.composer.addPass(this.outlinePass);

    // Add FXAA antialiasing pass (bundle lines 4810-4811)
    const fxaaPass = new ShaderPass(FXAAShader);
    fxaaPass.uniforms['resolution'].value.set(1 / width, 1 / height);
    fxaaPass.renderToScreen = true;  // Final pass renders to screen
    this.composer.addPass(fxaaPass);

    console.log('✅ Post-processing setup complete (OutlinePass + FXAA)');
  };

  /**
   * **PHASE 2D: Update outline effect for selected objects**
   * Called when selection changes
   * @param {Array<THREE.Mesh>} meshes - Array of meshes to outline
   */
  updateOutline = (meshes) => {
    if (!this.outlinePass) return;

    // Clear previous selection
    this.outlinePass.selectedObjects = [];

    // Add new selection
    if (meshes && meshes.length > 0) {
      this.outlinePass.selectedObjects = meshes;
      console.log('✅ Outline updated:', meshes.length, 'objects');
    }
  };

  /**
   * Handle highlight changed event from items
   * Updates outline pass with highlighted objects
   */
  handleHighlightChanged = (event) => {
    if (!this.outlinePass) return;

    const objects = event.detail?.objects || [];
    this.updateOutline(objects);
  };

  /**
   * Update 3D floor plan visualization (walls, rooms)
   */
  update3DFloorPlan = () => {
    if (!this.model || !this.model.floorplan) return;

    console.log('🎨 update3DFloorPlan called');
    console.log('  Walls to render:', this.model.floorplan.walls.length);
    console.log('  Rooms to render:', this.model.floorplan.rooms.length);

    // Remove existing floor plan meshes
    if (this.floorPlanGroup) {
      this.model.scene.remove(this.floorPlanGroup);
    }

    // Create new group for floor plan meshes
    this.floorPlanGroup = new THREE.Group();

    // Create wall meshes
    const wallHeight = 2.5; // 2.5 meters tall
    const wallThickness = 0.1; // 10cm thick
    // PRODUCTION QUALITY: Brighter, cleaner walls
    const wallMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff,  // Pure white (brighter than 0xeeeeee)
      roughness: 0.7,   // Less rough (slightly shinier)
      metalness: 0.0,   // No metalness (matte finish)
      envMapIntensity: 0.5
    });

    this.model.floorplan.walls.forEach((wall) => {
      const start = wall.getStart();
      const end = wall.getEnd();

      // Calculate wall position and dimensions
      const dx = end.x - start.x;
      const dy = end.y - start.y;
      const length = Math.sqrt(dx * dx + dy * dy);
      const angle = Math.atan2(dy, dx);

      // Create wall mesh
      const wallGeometry = new THREE.BoxGeometry(length, wallHeight, wallThickness);
      const wallMesh = new THREE.Mesh(wallGeometry, wallMaterial);

      // Position wall
      wallMesh.position.set(
        (start.x + end.x) / 2,
        wallHeight / 2,
        (start.y + end.y) / 2
      );

      // Rotate wall to match wall direction
      wallMesh.rotation.y = angle;

      // Enable shadows
      wallMesh.castShadow = true;
      wallMesh.receiveShadow = true;

      this.floorPlanGroup.add(wallMesh);
    });

    // Create floor meshes for rooms
    // PRODUCTION QUALITY: Lighter, smoother floor
    const floorMaterial = new THREE.MeshStandardMaterial({
      color: 0xe0e0e0,  // Lighter gray (brighter than 0xcccccc)
      roughness: 0.6,   // Smoother finish
      metalness: 0.1,   // Less metallic
      envMapIntensity: 0.3
    });

    this.model.floorplan.rooms.forEach((room) => {
      // Get room corners
      const corners = room.corners;
      if (corners.length < 3) return; // Need at least 3 corners for a polygon

      // Create floor shape from corners
      const shape = new THREE.Shape();
      shape.moveTo(corners[0].x, corners[0].y);
      for (let i = 1; i < corners.length; i++) {
        shape.lineTo(corners[i].x, corners[i].y);
      }
      shape.lineTo(corners[0].x, corners[0].y); // Close the shape

      // Extrude shape to create floor mesh
      const floorGeometry = new THREE.ShapeGeometry(shape);
      const floorMesh = new THREE.Mesh(floorGeometry, floorMaterial);

      // Position floor (rotate to horizontal plane)
      floorMesh.rotation.x = -Math.PI / 2;
      floorMesh.position.y = 0.01; // Slightly above ground plane to prevent z-fighting

      // Enable shadows
      floorMesh.receiveShadow = true;

      this.floorPlanGroup.add(floorMesh);
    });

    // Add floor plan group to scene
    this.model.scene.add(this.floorPlanGroup);

    console.log('✅ Floor plan updated: walls created, rooms rendered');
    console.log('  FloorPlanGroup children:', this.floorPlanGroup.children.length);
    console.log('  Total scene objects:', this.model.scene.getScene().children.length);
  };

  /**
   * Handle window resize
   */
  handleWindowResize = () => {
    if (!this.containerRef.current || !this.renderer || !this.camera) return;

    const width = this.containerRef.current.clientWidth;
    const height = this.containerRef.current.clientHeight;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(width, height);

    // **PHASE 2D: Update composer size**
    if (this.composer) {
      this.composer.setSize(width, height);
    }
  };

  /**
   * Animation loop
   */
  animate = () => {
    requestAnimationFrame(this.animate);

    // Update controls
    if (this.controls) {
      this.controls.update();
    }

    // Render scene with post-processing
    if (this.composer) {
      this.composer.render();
    } else if (this.renderer && this.camera && this.model) {
      // Fallback to direct render if composer not ready
      this.renderer.render(this.model.scene.getScene(), this.camera);
    }
  };

  /**
   * Handle canvas DOM loaded from FloorPlanView
   * @param {HTMLCanvasElement} canvas - Canvas element
   */
  handleCanvasLoaded = (canvas) => {
    if (!canvas || this.canvas2d || !this.model) return;

    console.log('Canvas loaded, creating Canvas2D...');
    this.canvas2DRef = canvas;

    // Create Canvas2D renderer
    this.canvas2d = new Canvas2D(
      this.model.floorplan,
      this.viewmodel,
      canvas
    );

    // Draw initial state
    this.canvas2d.draw();

    // Set up mouse interaction
    this.setupCanvasInteraction(canvas);
  };

  /**
   * Set up mouse interaction for 2D canvas
   * @param {HTMLCanvasElement} canvas - Canvas element
   */
  setupCanvasInteraction = (canvas) => {
    let isDragging = false;
    let dragStartX = 0;
    let dragStartY = 0;
    let lastMouseX = 0;
    let lastMouseY = 0;

    const getMousePos = (e) => {
      const rect = canvas.getBoundingClientRect();
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      };
    };

    canvas.addEventListener('mousedown', (e) => {
      const pos = getMousePos(e);
      isDragging = true;
      dragStartX = pos.x;
      dragStartY = pos.y;
      lastMouseX = pos.x;
      lastMouseY = pos.y;

      const worldX = this.viewmodel.convertScreenX(pos.x);
      const worldY = this.viewmodel.convertScreenY(pos.y);

      if (this.viewmodel.mode === MODES.DRAW) {
        // Wall drawing mode
        this.handleDrawClick(worldX, worldY);
      } else if (this.viewmodel.mode === MODES.DELETE) {
        // Delete mode
        this.handleDeleteClick(worldX, worldY);
      }
    });

    canvas.addEventListener('mousemove', (e) => {
      const pos = getMousePos(e);
      const worldX = this.viewmodel.convertScreenX(pos.x);
      const worldY = this.viewmodel.convertScreenY(pos.y);

      if (isDragging && this.viewmodel.mode === MODES.MOVE) {
        // Pan the view
        const dx = pos.x - lastMouseX;
        const dy = pos.y - lastMouseY;
        this.viewmodel.centerX -= dx / this.viewmodel.scale;
        this.viewmodel.centerY -= dy / this.viewmodel.scale;
        this.canvas2d.draw();
      } else if (this.viewmodel.mode === MODES.DRAW) {
        // Update target position
        this.viewmodel.targetX = worldX;
        this.viewmodel.targetY = worldY;
        this.canvas2d.draw();
      }

      lastMouseX = pos.x;
      lastMouseY = pos.y;
    });

    canvas.addEventListener('mouseup', () => {
      isDragging = false;
    });

    canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      this.viewmodel.scale *= delta;
      this.viewmodel.scale = Math.max(0.1, Math.min(10, this.viewmodel.scale));
      this.canvas2d.draw();
    });
  };

  /**
   * Handle draw mode click (create walls)
   * @param {number} x - World X coordinate
   * @param {number} y - World Y coordinate
   */
  handleDrawClick = (x, y) => {
    if (!this.model) return;

    // Snap to nearby corner
    const snapTolerance = 0.25;
    let corner = this.model.floorplan.overlappedCorner(x, y, snapTolerance);

    if (!corner) {
      // Create new corner
      corner = this.model.floorplan.newCorner(x, y);
    }

    if (this.viewmodel.lastNode) {
      // Create wall between last node and this corner
      if (this.viewmodel.lastNode !== corner) {
        this.model.floorplan.newWall(this.viewmodel.lastNode, corner);
      }
    }

    this.viewmodel.lastNode = corner;
    this.canvas2d.draw();
  };

  /**
   * Handle delete mode click
   * @param {number} x - World X coordinate
   * @param {number} y - World Y coordinate
   */
  handleDeleteClick = (x, y) => {
    if (!this.model) return;

    // Check for corner
    const corner = this.model.floorplan.overlappedCorner(x, y, 0.25);
    if (corner) {
      corner.remove();
      this.canvas2d.draw();
      return;
    }

    // Check for wall
    const wall = this.model.floorplan.overlappedWall(x, y, 0.25);
    if (wall) {
      wall.remove();
      this.canvas2d.draw();
    }
  };

  /**
   * Handle floor plan mode change (Move/Draw/Delete)
   * @param {number} mode - MODES constant
   */
  handleModeChanged = (mode) => {
    this.setState({ floorplanMode: mode });
    this.viewmodel.mode = mode;

    // Reset last node when leaving draw mode
    if (mode !== MODES.DRAW) {
      this.viewmodel.lastNode = null;
    }

    if (this.canvas2d) {
      this.canvas2d.draw();
    }
  };

  /**
   * Handle view mode change (2D ↔ 3D)
   */
  handleViewModeChange = () => {
    const { viewMode } = this.props;
    console.log('View mode changed to:', viewMode);

    // Show/hide appropriate renderer
    if (this.renderer && this.renderer.domElement) {
      this.renderer.domElement.style.display = viewMode === '3d' ? 'block' : 'none';
    }

    // Redraw 2D canvas if switching to 2D
    if (viewMode === '2d' && this.canvas2d) {
      setTimeout(() => this.canvas2d.handleWindowResize(), 100);
    }
  };

  /**
   * Clean up Three.js resources
   */
  cleanupBlueprint3D = () => {
    if (this.controls) {
      this.controls.dispose();
    }

    if (this.renderer) {
      this.renderer.dispose();
      if (this.renderer.domElement && this.renderer.domElement.parentNode) {
        this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
      }
    }

    if (this.model) {
      this.model.scene.clearItems();
    }
  };

  /**
   * Public API methods (called via ref from parent)
   */

  /**
   * Add an item to the scene
   * @param {Object} product - Product data
   * @returns {Promise<Item>}
   */
  addItem = async (product) => {
    if (!this.model) return null;

    console.log('Adding item:', product);

    const position = new THREE.Vector3(0, 0, 0); // Default position
    const rotation = 0; // Default rotation

    try {
      const item = await this.model.scene.addItem(
        product.type || 1,
        product.model,
        product,
        position,
        rotation,
        {}
      );

      console.log('Item added:', item);

      // Fire selection callback
      if (this.props.onItemSelected) {
        this.props.onItemSelected(item);
      }

      // Redraw 2D canvas
      if (this.canvas2d) {
        this.canvas2d.draw();
      }

      return item;
    } catch (error) {
      console.error('Error adding item:', error);
      return null;
    }
  };

  /**
   * Duplicate currently selected item
   */
  duplicateItem = () => {
    console.log('Duplicate item - not yet implemented');
    // TODO: Implement duplication
  };

  /**
   * Add a set/group of items
   * @param {Object} setData - Set configuration
   */
  addSet = async (setData) => {
    if (!this.model) return;

    console.log('Adding set:', setData);
    // TODO: Implement set addition
  };

  /**
   * Get current design as JSON
   * @returns {string} JSON string
   */
  getJSON = () => {
    if (!this.model) return '{}';
    return this.model.exportSerialized();
  };

  /**
   * Load design from JSON
   * @param {string} json - JSON string from getJSON()
   */
  setJSON = (json) => {
    if (!this.model) return;
    this.model.loadSerialized(json);

    // Redraw 2D canvas
    if (this.canvas2d) {
      this.canvas2d.draw();
    }
  };

  /**
   * Take a snapshot of the current scene
   * @returns {string} Data URL of snapshot
   */
  takeSnapshot = () => {
    if (!this.renderer) return null;

    this.renderer.render(this.model.scene.getScene(), this.camera);
    return this.renderer.domElement.toDataURL('image/png');
  };

  /**
   * PHASE 2B: Setup 3D interaction handlers (raycasting, selection, drag-and-drop)
   * Extracted from production bundle lines 4100-4300
   */
  setup3DInteractionHandlers = () => {
    if (!this.renderer || !this.renderer.domElement) return;

    const canvas = this.renderer.domElement;

    // **Mouse down handler** - Start drag or selection
    canvas.addEventListener('mousedown', (e) => {
      this.handle3DMouseDown(e);
    });

    // **Mouse move handler** - Drag item or hover
    canvas.addEventListener('mousemove', (e) => {
      this.handle3DMouseMove(e);
    });

    // **Mouse up handler** - End drag
    canvas.addEventListener('mouseup', (e) => {
      this.handle3DMouseUp(e);
    });

    console.log('✅ 3D interaction handlers setup complete (selection + drag & drop)');
  };

  /**
   * **NEW: Setup keyboard shortcuts (from bundle lines 4915-4916 + additional shortcuts)**
   * Supports:
   * - Delete/Backspace: Delete selected item
   * - Escape: Deselect all items
   */
  setupKeyboardShortcuts = () => {
    // Store keyboard handler reference for cleanup
    this.keyboardHandler = (event) => {
      // Only handle keyboard shortcuts in 3D view mode
      if (this.props.viewMode !== '3d') return;

      // Prevent shortcuts when typing in input fields
      const activeElement = document.activeElement;
      if (activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA')) {
        return;
      }

      switch (event.key) {
        case 'Delete':
        case 'Backspace':
          // Delete selected item (from bundle line 3548-3553)
          if (this.selectedItem) {
            console.log('🗑️ Deleting selected item:', this.selectedItem.metadata?.itemName);
            this.deleteSelectedItem();
            event.preventDefault(); // Prevent browser back navigation on Backspace
          }
          break;

        case 'Escape':
          // Deselect all items (from bundle line 4916)
          if (this.selectedItem) {
            console.log('⎋ Escape - Deselecting all items');
            this.deselectAllItems();
          }
          break;

        default:
          // Other keys - no action
          break;
      }
    };

    // Add keyboard event listener
    document.addEventListener('keydown', this.keyboardHandler);
    console.log('✅ Keyboard shortcuts enabled (Delete, Backspace, Escape)');
  };

  /**
   * **NEW: Delete selected item (from bundle lines 3548-3553)**
   * Removes the currently selected item from the scene
   */
  deleteSelectedItem = () => {
    if (!this.selectedItem) return;

    const item = this.selectedItem;

    // Deselect first
    this.deselectAllItems();

    // Remove dimension helper if it exists
    if (item.dimensionHelper) {
      this.model.scene.scene.remove(item.dimensionHelper);
    }

    // Call removed() method on item (cleanup)
    if (item.removed && typeof item.removed === 'function') {
      item.removed();
    }

    // Remove from scene
    this.model.scene.scene.remove(item);

    // Remove from items array
    const index = this.model.scene.items.indexOf(item);
    if (index > -1) {
      this.model.scene.items.splice(index, 1);
    }

    console.log('✅ Item deleted successfully');
  };

  /**
   * PHASE 2B Priority 2: Handle mouse down in 3D view (start drag or select)
   * Extracted from production bundle function H (mousedown handler) lines 4100-4150
   */
  handle3DMouseDown = (event) => {
    if (this.props.viewMode !== '3d') return;

    // Disable OrbitControls while dragging to prevent camera movement
    if (this.controls) {
      this.controls.enabled = false;
    }

    // Update mouse position
    this.updateMousePosition(event);

    // **NEW: Initialize last mouse position for rotation tracking**
    this.lastMouseX = event.clientX;
    this.lastMouseY = event.clientY;

    // Raycast to find item under cursor
    const clickedItem = this.getItemAtMouse();

    if (clickedItem) {
      // Item clicked - select and start drag
      console.log('🖱️ Item mousedown:', clickedItem);

      // Select item if not already selected
      if (this.selectedItem !== clickedItem) {
        this.selectItem(clickedItem);
      }

      // Start drag operation
      this.isDragging = true;
      this.dragStartPosition = clickedItem.position.clone();

      // Calculate drag offset (distance from item center to click point)
      const intersectPoint = this.getIntersectionPoint();
      if (intersectPoint) {
        this.dragOffset = new THREE.Vector3().subVectors(
          clickedItem.position,
          intersectPoint
        );
      } else {
        this.dragOffset = new THREE.Vector3(0, 0, 0);
      }

      console.log('🎯 Drag started at:', this.dragStartPosition);
    } else {
      // Empty space clicked - deselect all
      console.log('🖱️ Empty space clicked - deselecting');
      this.deselectAllItems();

      // Re-enable OrbitControls for camera movement
      if (this.controls) {
        this.controls.enabled = true;
      }
    }
  };

  /**
   * PHASE 2B: Update normalized mouse coordinates from screen coordinates
   * @param {MouseEvent} event - Mouse event
   */
  updateMousePosition = (event) => {
    if (!this.renderer) return;

    const canvas = this.renderer.domElement;
    const rect = canvas.getBoundingClientRect();

    // Convert to normalized device coordinates (-1 to +1)
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  };

  /**
   * PHASE 2B: Raycast to find item under mouse cursor
   * Extracted from production bundle getIntersections + itemIntersection methods
   * @returns {Object|null} Item under cursor or null
   */
  getItemAtMouse = () => {
    if (!this.raycaster || !this.camera || !this.model) return null;

    // Update raycaster with camera and mouse position
    this.raycaster.setFromCamera(this.mouse, this.camera);

    // Get all items from scene
    const items = this.model.scene.items || [];
    if (items.length === 0) return null;

    // Collect all meshes from all items
    const meshes = [];
    items.forEach(item => {
      if (item.childMeshes && Array.isArray(item.childMeshes)) {
        item.childMeshes.forEach(mesh => {
          if (mesh && mesh.isMesh) {
            meshes.push(mesh);
          }
        });
      }
    });

    if (meshes.length === 0) return null;

    // Perform raycasting
    const intersects = this.raycaster.intersectObjects(meshes, false);

    if (intersects.length > 0) {
      // Find the item that owns the intersected mesh
      const intersectedMesh = intersects[0].object;

      for (let item of items) {
        if (item.childMeshes && item.childMeshes.includes(intersectedMesh)) {
          return item;
        }
        // Also check if mesh is a child of an item's child (nested groups)
        if (item.childMeshes) {
          for (let childMesh of item.childMeshes) {
            if (childMesh === intersectedMesh || childMesh.children.includes(intersectedMesh)) {
              return item;
            }
          }
        }
      }
    }

    return null;
  };

  /**
   * PHASE 2B: Select an item (extracted from production setSelectedObject)
   * @param {Object} item - Item to select
   */
  selectItem = (item) => {
    if (!item) return;

    // Already selected?
    if (this.selectedItem === item) return;

    // Deselect previous item
    if (this.selectedItem) {
      this.selectedItem.setUnselected();
    }

    // Select new item
    this.selectedItem = item;
    item.setSelected();

    // **PHASE 2D: Update outline for selected item**
    if (item.childMeshes && item.childMeshes.length > 0) {
      this.updateOutline(item.childMeshes);
    }

    // **NEW: Set dimension helper to selected state (red color) (from bundle line 2755)**
    if (item.dimensionHelper && item.dimensionHelper.setSelected) {
      item.dimensionHelper.setSelected();
    }

    // **NEW: Create rotation gizmo for selected item (from bundle line 4094)**
    if (this.rotationGizmo) {
      this.rotationGizmo.createGizmo(item);
    }

    // Notify parent component (App.jsx)
    if (typeof this.props.onItemSelected === 'function') {
      this.props.onItemSelected(item);
    }

    console.log('✅ Item selected:', item.metadata?.itemName || 'Unknown');
  };

  /**
   * PHASE 2B: Deselect all items (extracted from production setSelectedObject(null))
   */
  deselectAllItems = () => {
    if (this.selectedItem) {
      this.selectedItem.setUnselected();

      // **NEW: Set dimension helper to unselected state (light blue-purple) (from bundle line 2755)**
      if (this.selectedItem.dimensionHelper && this.selectedItem.dimensionHelper.setUnselected) {
        this.selectedItem.dimensionHelper.setUnselected();
      }

      this.selectedItem = null;

      // **PHASE 2D: Clear outline**
      this.updateOutline([]);

      // **NEW: Remove rotation gizmo (from bundle line 4094)**
      if (this.rotationGizmo) {
        this.rotationGizmo.removeGizmo();
      }

      // Notify parent component (App.jsx)
      if (typeof this.props.onItemUnselected === 'function') {
        this.props.onItemUnselected();
      }

      console.log('✅ All items deselected');
    }
  };

  /**
   * PHASE 2B Priority 2: Handle mouse move in 3D view (drag item)
   * **ENHANCED Phase 2B Priority 3: Added hover detection and cursor changes**
   * Extracted from production bundle function S (mousemove handler) lines 4150-4200
   */
  handle3DMouseMove = (event) => {
    if (this.props.viewMode !== '3d') return;

    // Update mouse position
    this.updateMousePosition(event);

    // **NEW: Rotation support with middle mouse button (from bundle lines 4969-4972)**
    // If middle mouse button (button 4) is held and item is selected, rotate instead of move
    if (this.isDragging && this.selectedItem && event.buttons === 4) {
      // Middle mouse button - rotate item
      const deltaX = event.clientX - this.lastMouseX;
      const currentRotation = this.selectedItem.rotation.y;
      const newRotation = currentRotation + (0.05 * deltaX); // 0.05 = rotation sensitivity

      // Call item's rotate method (matches production behavior)
      this.selectedItem.rotate({}, newRotation);

      // **NEW: Update gizmo during rotation (from bundle lines 4088-4093)**
      if (this.rotationGizmo) {
        this.rotationGizmo.setRotating(true);
        this.rotationGizmo.update();
      }

      console.log('🔄 Rotating to:', newRotation);

      // Store last mouse position for next frame
      this.lastMouseX = event.clientX;
      this.lastMouseY = event.clientY;
      return;
    }

    // If dragging, move the selected item (left mouse button = 1)
    if (this.isDragging && this.selectedItem && event.buttons === 1) {
      // Set grabbing cursor
      this.setCursor('grabbing');

      // Get intersection point with drag plane
      const intersectPoint = this.getIntersectionPoint();

      if (intersectPoint) {
        // Apply drag offset to maintain click position relative to item center
        const newPosition = new THREE.Vector3().addVectors(
          intersectPoint,
          this.dragOffset
        );

        // Move item to new position
        this.selectedItem.moveToPosition(newPosition);

        // **NEW: Update gizmo position during drag**
        if (this.rotationGizmo) {
          this.rotationGizmo.update();
        }

        // console.log('🎯 Dragging to:', newPosition);
      }

      // Store last mouse position for rotation tracking
      this.lastMouseX = event.clientX;
      this.lastMouseY = event.clientY;
    } else {
      // **Phase 2B Priority 3: Hover detection**
      const hoveredItem = this.getItemAtMouse();

      if (hoveredItem !== this.hoveredItem) {
        // Hover state changed
        if (this.hoveredItem && this.hoveredItem !== this.selectedItem) {
          // Clear previous hover
          this.hoveredItem.hover = false;
          this.hoveredItem.updateHighlight();
        }

        this.hoveredItem = hoveredItem;

        if (this.hoveredItem) {
          // Set new hover
          this.hoveredItem.hover = true;
          this.hoveredItem.updateHighlight();

          // Set grab cursor on hover
          this.setCursor('grab');
        } else {
          // No hover - default cursor
          this.setCursor('default');
        }
      }
    }
  };

  /**
   * PHASE 2B Priority 2: Handle mouse up in 3D view (end drag)
   * **ENHANCED Phase 2A Priority 2: Added snap-to-grid**
   * **ENHANCED Phase 2B Priority 3: Added cursor reset**
   * Extracted from production bundle function C (mouseup handler) lines 4200-4250
   */
  handle3DMouseUp = (event) => {
    if (this.props.viewMode !== '3d') return;

    // End drag operation
    if (this.isDragging && this.selectedItem) {
      this.isDragging = false;

      // **Phase 2A Priority 2: Apply snap-to-grid**
      const position = this.selectedItem.position.clone();
      this.selectedItem.getSnapPosition(position);

      // Move to snapped position (includes collision check)
      this.selectedItem.moveToPosition(position);

      // **NEW: Reset rotating state after rotation ends**
      if (this.rotationGizmo) {
        this.rotationGizmo.setRotating(false);
      }

      console.log('🎯 Drag ended at:', this.selectedItem.position);

      // **Phase 2B Priority 3: Reset cursor to grab (still hovering item)**
      this.setCursor('grab');
    }

    // Re-enable OrbitControls
    if (this.controls) {
      this.controls.enabled = true;
    }
  };

  /**
   * PHASE 2B Priority 2: Get intersection point with drag plane
   * **ENHANCED Phase 2C: Support for wall items with custom intersection planes**
   * Raycast from mouse to find where ray intersects horizontal plane at Y=0
   * @returns {THREE.Vector3|null} Intersection point or null
   */
  getIntersectionPoint = () => {
    if (!this.raycaster || !this.camera) return null;

    // Update raycaster with current mouse position
    this.raycaster.setFromCamera(this.mouse, this.camera);

    // **PHASE 2C: Check if selected item has custom intersection planes (wall items)**
    if (this.selectedItem && typeof this.selectedItem.customIntersectionPlanes === 'function') {
      const customPlanes = this.selectedItem.customIntersectionPlanes();

      if (customPlanes && customPlanes.length > 0) {
        // Raycast against wall planes
        const intersects = this.raycaster.intersectObjects(customPlanes, true);

        if (intersects.length > 0) {
          const intersectPoint = intersects[0].point.clone();

          // Apply boundMove to constrain to wall surface
          if (typeof this.selectedItem.boundMove === 'function') {
            this.selectedItem.boundMove(intersectPoint);
          }

          return intersectPoint;
        }
      }
    }

    // Fall back to default floor plane for non-wall items
    if (!this.dragPlane) return null;

    const intersectPoint = new THREE.Vector3();
    const didIntersect = this.raycaster.ray.intersectPlane(
      this.dragPlane,
      intersectPoint
    );

    if (didIntersect) {
      return intersectPoint;
    }

    return null;
  };

  /**
   * **PHASE 2B Priority 3: Visual Feedback**
   * Set cursor style for 3D canvas
   * @param {string} cursor - Cursor style ('default', 'pointer', 'grab', 'grabbing')
   */
  setCursor = (cursor) => {
    if (this.currentCursor === cursor) return; // Already set

    if (!this.renderer || !this.renderer.domElement) return;

    const canvas = this.renderer.domElement;

    // Map cursor names to CSS cursor values
    const cursorMap = {
      'default': 'default',
      'pointer': 'pointer',
      'grab': 'grab',
      'grabbing': 'grabbing'
    };

    const cursorStyle = cursorMap[cursor] || 'default';
    canvas.style.cursor = cursorStyle;
    this.currentCursor = cursor;
  };

  /**
   * Import set from external builder
   * @param {Object} setData - Set data from builder
   */
  importSetFromBuilder = (setData) => {
    console.log('Import set from builder:', setData);
    // TODO: Implement import
  };

  render() {
    const { viewMode } = this.props;
    const { loading } = this.state;

    return (
      <div className="blueprint3d-container" ref={this.containerRef}>
        {/* 2D Floor Planner */}
        <FloorPlanView
          hidden={viewMode !== '2d'}
          onDomLoaded={this.handleCanvasLoaded}
          onModeChanged={this.handleModeChanged}
        />

        {/* Loading Overlay */}
        {loading && (
          <div className="blueprint3d-loading">
            <span>Loading...</span>
          </div>
        )}
      </div>
    );
  }
}

/**
 * **NEW: Rotation Gizmo Class**
 * Visual rotation indicator extracted from production bundle lines 4031-4094
 * Shows a line + cone + sphere to indicate rotation handle
 */
class RotationGizmo {
  constructor(scene) {
    this.scene = scene;
    this.gizmoGroup = null;
    this.currentItem = null;
    this.isHovering = false;
    this.isRotating = false;
  }

  /**
   * Create rotation gizmo for an item (from bundle lines 4031-4058)
   * @param {Object} item - Item to create gizmo for
   */
  createGizmo(item) {
    if (!item || !item.allowRotate || item.fixed) {
      return;
    }

    // Remove existing gizmo
    this.removeGizmo();

    // Create group to hold gizmo parts
    this.gizmoGroup = new THREE.Group();

    // Calculate gizmo radius (from bundle line 4076)
    const radius = Math.max(item.halfSize.x, item.halfSize.z) + 0.2;

    // Create line from center to edge (bundle lines 4033-4040)
    const lineGeometry = new THREE.BufferGeometry();
    const linePositions = new Float32Array([
      0, 0, 0,  // Start at center
      0, 0, radius  // End at radius
    ]);
    lineGeometry.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));

    const lineMaterial = new THREE.LineBasicMaterial({
      color: this.getGizmoColor(),
      linewidth: 3,
      depthTest: false
    });
    const line = new THREE.Line(lineGeometry, lineMaterial);
    line.renderOrder = 999;

    // Create cone at end of line (bundle lines 4041-4048)
    const coneGeometry = new THREE.ConeGeometry(0.05, 0.1, 16);
    const coneMaterial = new THREE.MeshBasicMaterial({
      color: this.getGizmoColor()
    });
    const cone = new THREE.Mesh(coneGeometry, coneMaterial);
    cone.position.set(0, 0, radius);
    cone.rotation.x = -Math.PI / 2;  // Point upward
    cone.renderOrder = 999;

    // Create sphere at base (bundle lines 4049-4056)
    const sphereGeometry = new THREE.SphereGeometry(0.04, 16, 16);
    const sphereMaterial = new THREE.MeshBasicMaterial({
      color: this.getGizmoColor(),
      depthTest: false
    });
    const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
    sphere.renderOrder = 999;

    // Add parts to group (bundle line 4057)
    this.gizmoGroup.add(line);
    this.gizmoGroup.add(cone);
    this.gizmoGroup.add(sphere);

    // Position gizmo at item location (bundle line 4057)
    this.gizmoGroup.rotation.y = item.rotation.y;
    this.gizmoGroup.position.x = item.position.x;
    this.gizmoGroup.position.z = item.position.z;
    this.gizmoGroup.position.y = 0.05;  // Slightly above ground

    // Add to scene (bundle line 4058)
    this.scene.add(this.gizmoGroup);
    this.currentItem = item;
  }

  /**
   * Remove gizmo from scene (from bundle lines 4026-4028)
   */
  removeGizmo() {
    if (this.gizmoGroup) {
      this.scene.remove(this.gizmoGroup);
      this.gizmoGroup = null;
      this.currentItem = null;
    }
  }

  /**
   * Update gizmo position/rotation to match item (from bundle lines 4088-4093)
   */
  update() {
    if (this.gizmoGroup && this.currentItem) {
      this.gizmoGroup.rotation.y = this.currentItem.rotation.y;

      // If item has linked items, use center of group (bundle line 4091)
      const center = this.currentItem.getCenterWithLinkedItems
        ? this.currentItem.getCenterWithLinkedItems()
        : this.currentItem.position;

      this.gizmoGroup.position.x = center.x;
      this.gizmoGroup.position.z = center.z;
    }
  }

  /**
   * Set hovering state (from bundle lines 4086-4087)
   */
  setHovering(hovering) {
    this.isHovering = hovering;
    this.updateColors();
  }

  /**
   * Set rotating state (from bundle lines 4084-4085)
   */
  setRotating(rotating) {
    this.isRotating = rotating;
    this.updateColors();
  }

  /**
   * Update gizmo colors (from bundle lines 4065-4069)
   */
  updateColors() {
    if (this.gizmoGroup) {
      const color = this.getGizmoColor();
      this.gizmoGroup.children.forEach(child => {
        if (child.material) {
          child.material.color.set(color);
        }
      });
    }
  }

  /**
   * Get gizmo color based on state (from bundle lines 4071-4073)
   * @returns {string} Hex color
   */
  getGizmoColor() {
    // Yellow when rotating or hovering (bundle line 4072)
    if (this.isRotating || this.isHovering) {
      return '#f1c40f';  // Yellow
    }
    // White otherwise (bundle line 4072)
    return '#ffffff';  // White
  }
}

/**
 * **NEW: DimensionHelper Class**
 * Wireframe bounding box with dimension labels extracted from production bundle lines 2055-2203
 * Shows width, height, depth measurements on selected items
 */
class DimensionHelper extends THREE.Group {
  constructor(scene, item) {
    super();

    this.scene = scene;
    this.item = item;

    // Frame material (light blue-purple when unselected, red when selected)
    this.frameMaterial = new THREE.MeshBasicMaterial({
      color: 0xddd7dd  // Light blue-purple (#ddd7dd = 14540253 decimal)
    });

    this.offsetCenter = new THREE.Vector3();

    // Canvas elements for text labels
    this.canvasDepth = document.createElement('canvas');
    this.canvasWidth = document.createElement('canvas');
    this.canvasHeight = document.createElement('canvas');

    // Store original size for scaling
    this.sizeOrigin = { ...item.halfSize };

    // Create the wireframe box and labels
    this.configFrames();
    this.configLabels();
    this.drawLabels(this.item.halfSize);

    // Check if dimensions should be visible (from Configuration)
    try {
      const dimensionVisible = Configuration.getBooleanValue(configDimensionVisible);
      if (!dimensionVisible) {
        this.visible = false;
      }
    } catch (error) {
      // If configuration not available, show by default
      console.log('DimensionHelper: Configuration not available, showing by default');
    }

    // Listen for configuration changes (from bundle line 2063)
    document.addEventListener(BP3D_EVENT_CONFIG_CHANGED, (event) => {
      const detail = event.detail;
      if (detail) {
        // Update labels if unit changes
        if (detail.dimUnit) {
          this.update();
        }
        // Toggle visibility if dimension visibility setting changes
        if (detail.hasOwnProperty(configDimensionVisible)) {
          this.visible = detail[configDimensionVisible];
        }
      }
    });
  }

  /**
   * Update dimension helper to match item's current size (from bundle lines 2069-2080)
   */
  update() {
    const halfSize = this.item.halfSize;
    this.drawLabels(halfSize);

    // Calculate center offset from bounding box (from bundle lines 2073-2075)
    const bounds = this.item.getBounding();
    const center = new THREE.Vector3(
      (bounds.max.x + bounds.min.x) / 2,
      (bounds.max.y + bounds.min.y) / 2,
      (bounds.max.z + bounds.min.z) / 2
    );
    this.offsetCenter = center.sub(this.item.position);

    // Update all 24 children (12 frames + 12 labels) - from bundle lines 2076-2079
    for (let i = 0; i < this.children.length; i++) {
      const child = this.children[i];

      // First 4 children: vertical edges along Z axis (from bundle line 2078)
      if (i >= 0 && i < 4) {
        child.scale.z = halfSize.z / this.sizeOrigin.z;
        if (i % 4 === 0) child.position.set(-halfSize.x + this.offsetCenter.x, halfSize.y + this.offsetCenter.y, this.offsetCenter.z);
        if (i % 4 === 1) child.position.set(halfSize.x + this.offsetCenter.x, halfSize.y + this.offsetCenter.y, this.offsetCenter.z);
        if (i % 4 === 2) child.position.set(halfSize.x + this.offsetCenter.x, -halfSize.y + this.offsetCenter.y, this.offsetCenter.z);
        if (i % 4 === 3) child.position.set(-halfSize.x + this.offsetCenter.x, -halfSize.y + this.offsetCenter.y, this.offsetCenter.z);
      }
      // Next 4 children: horizontal edges along X axis (from bundle line 2078)
      else if (i >= 4 && i < 8) {
        child.scale.x = halfSize.x / this.sizeOrigin.x;
        if (i % 4 === 0) child.position.set(this.offsetCenter.x, -halfSize.y + this.offsetCenter.y, halfSize.z + this.offsetCenter.z);
        if (i % 4 === 1) child.position.set(this.offsetCenter.x, halfSize.y + this.offsetCenter.y, halfSize.z + this.offsetCenter.z);
        if (i % 4 === 2) child.position.set(this.offsetCenter.x, halfSize.y + this.offsetCenter.y, -halfSize.z + this.offsetCenter.z);
        if (i % 4 === 3) child.position.set(this.offsetCenter.x, -halfSize.y + this.offsetCenter.y, -halfSize.z + this.offsetCenter.z);
      }
      // Next 4 children: vertical edges along Y axis (from bundle line 2078)
      else if (i >= 8 && i < 12) {
        child.scale.y = halfSize.y / this.sizeOrigin.y;
        if (i % 4 === 0) child.position.set(-halfSize.x + this.offsetCenter.x, this.offsetCenter.y, halfSize.z + this.offsetCenter.z);
        if (i % 4 === 1) child.position.set(halfSize.x + this.offsetCenter.x, this.offsetCenter.y, halfSize.z + this.offsetCenter.z);
        if (i % 4 === 2) child.position.set(halfSize.x + this.offsetCenter.x, this.offsetCenter.y, -halfSize.z + this.offsetCenter.z);
        if (i % 4 === 3) child.position.set(-halfSize.x + this.offsetCenter.x, this.offsetCenter.y, -halfSize.z + this.offsetCenter.z);
      }
      // Next 4 children: depth labels (from bundle line 2078)
      else if (i >= 12 && i < 16) {
        child.material.map.needsUpdate = true;
        if (i % 4 === 0) child.position.set(-halfSize.x + this.offsetCenter.x, halfSize.y + this.offsetCenter.y, this.offsetCenter.z);
        if (i % 4 === 1) child.position.set(halfSize.x + this.offsetCenter.x, halfSize.y + this.offsetCenter.y, this.offsetCenter.z);
        if (i % 4 === 2) child.position.set(halfSize.x + this.offsetCenter.x, -halfSize.y + this.offsetCenter.y, this.offsetCenter.z);
        if (i % 4 === 3) child.position.set(-halfSize.x + this.offsetCenter.x, -halfSize.y + this.offsetCenter.y, this.offsetCenter.z);
      }
      // Next 4 children: width labels (from bundle line 2078)
      else if (i >= 16 && i < 20) {
        child.material.map.needsUpdate = true;
        if (i % 4 === 0) child.position.set(this.offsetCenter.x, halfSize.y + this.offsetCenter.y, halfSize.z + this.offsetCenter.z);
        if (i % 4 === 1) child.position.set(this.offsetCenter.x, -halfSize.y + this.offsetCenter.y, halfSize.z + this.offsetCenter.z);
        if (i % 4 === 2) child.position.set(this.offsetCenter.x, halfSize.y + this.offsetCenter.y, -halfSize.z + this.offsetCenter.z);
        if (i % 4 === 3) child.position.set(this.offsetCenter.x, -halfSize.y + this.offsetCenter.y, -halfSize.z + this.offsetCenter.z);
      }
      // Last 4 children: height labels (from bundle line 2078)
      else if (i >= 20 && i < 24) {
        child.material.map.needsUpdate = true;
        if (i % 4 === 0) child.position.set(-halfSize.x + this.offsetCenter.x, this.offsetCenter.y, halfSize.z + this.offsetCenter.z);
        if (i % 4 === 1) child.position.set(halfSize.x + this.offsetCenter.x, this.offsetCenter.y, halfSize.z + this.offsetCenter.z);
        if (i % 4 === 2) child.position.set(halfSize.x + this.offsetCenter.x, this.offsetCenter.y, -halfSize.z + this.offsetCenter.z);
        if (i % 4 === 3) child.position.set(-halfSize.x + this.offsetCenter.x, this.offsetCenter.y, -halfSize.z + this.offsetCenter.z);
      }
    }
  }

  /**
   * Create wireframe box edges (from bundle lines 2082-2104)
   */
  configFrames() {
    const halfSize = this.item.halfSize;
    const thickness = 0.002;

    // Create 4 vertical edges along Z axis (from bundle lines 2084-2091)
    const zEdgeGeometry = new THREE.BoxGeometry(thickness, thickness, 2 * halfSize.z);
    const zEdge1 = new THREE.Mesh(zEdgeGeometry, this.frameMaterial);
    const zEdge2 = new THREE.Mesh(zEdgeGeometry, this.frameMaterial);
    const zEdge3 = new THREE.Mesh(zEdgeGeometry, this.frameMaterial);
    const zEdge4 = new THREE.Mesh(zEdgeGeometry, this.frameMaterial);

    zEdge1.position.set(-halfSize.x, halfSize.y, 0);
    zEdge2.position.set(halfSize.x, halfSize.y, 0);
    zEdge3.position.set(halfSize.x, -halfSize.y, 0);
    zEdge4.position.set(-halfSize.x, -halfSize.y, 0);

    this.add(zEdge1);
    this.add(zEdge2);
    this.add(zEdge3);
    this.add(zEdge4);

    // Create 4 horizontal edges along X axis (from bundle lines 2092-2097)
    const xEdgeGeometry = new THREE.BoxGeometry(2 * halfSize.x, thickness, thickness);
    const xEdge1 = new THREE.Mesh(xEdgeGeometry, this.frameMaterial);
    const xEdge2 = new THREE.Mesh(xEdgeGeometry, this.frameMaterial);
    const xEdge3 = new THREE.Mesh(xEdgeGeometry, this.frameMaterial);
    const xEdge4 = new THREE.Mesh(xEdgeGeometry, this.frameMaterial);

    xEdge1.position.set(0, -halfSize.y, halfSize.z);
    xEdge2.position.set(0, halfSize.y, halfSize.z);
    xEdge3.position.set(0, halfSize.y, -halfSize.z);
    xEdge4.position.set(0, -halfSize.y, -halfSize.z);

    this.add(xEdge1);
    this.add(xEdge2);
    this.add(xEdge3);
    this.add(xEdge4);

    // Create 4 vertical edges along Y axis (from bundle lines 2098-2103)
    const yEdgeGeometry = new THREE.BoxGeometry(thickness, 2 * halfSize.y, thickness);
    const yEdge1 = new THREE.Mesh(yEdgeGeometry, this.frameMaterial);
    const yEdge2 = new THREE.Mesh(yEdgeGeometry, this.frameMaterial);
    const yEdge3 = new THREE.Mesh(yEdgeGeometry, this.frameMaterial);
    const yEdge4 = new THREE.Mesh(yEdgeGeometry, this.frameMaterial);

    yEdge1.position.set(-halfSize.x, 0, halfSize.z);
    yEdge2.position.set(halfSize.x, 0, halfSize.z);
    yEdge3.position.set(halfSize.x, 0, -halfSize.z);
    yEdge4.position.set(-halfSize.x, 0, -halfSize.z);

    this.add(yEdge1);
    this.add(yEdge2);
    this.add(yEdge3);
    this.add(yEdge4);
  }

  /**
   * Create dimension label sprites (from bundle lines 2106-2124)
   */
  configLabels() {
    const halfSize = this.item.halfSize;

    // Create 4 depth labels (Z axis) - only first one visible (from bundle lines 2108-2113)
    const depthLabel1 = this.makeTextSprite(this.canvasDepth);
    const depthLabel2 = this.makeTextSprite(this.canvasDepth);
    const depthLabel3 = this.makeTextSprite(this.canvasDepth);
    const depthLabel4 = this.makeTextSprite(this.canvasDepth);

    depthLabel1.position.set(-halfSize.x, halfSize.y, 0);
    depthLabel2.position.set(halfSize.x, halfSize.y, 0);
    depthLabel3.position.set(halfSize.x, -halfSize.y, 0);
    depthLabel4.position.set(-halfSize.x, -halfSize.y, 0);

    depthLabel2.visible = false;
    depthLabel3.visible = false;
    depthLabel4.visible = false;

    this.add(depthLabel1);
    this.add(depthLabel2);
    this.add(depthLabel3);
    this.add(depthLabel4);

    // Create 4 width labels (X axis) - only first one visible (from bundle lines 2114-2118)
    const widthLabel1 = this.makeTextSprite(this.canvasWidth);
    const widthLabel2 = this.makeTextSprite(this.canvasWidth);
    const widthLabel3 = this.makeTextSprite(this.canvasWidth);
    const widthLabel4 = this.makeTextSprite(this.canvasWidth);

    widthLabel1.position.set(0, halfSize.y, halfSize.z);
    widthLabel2.position.set(0, -halfSize.y, halfSize.z);
    widthLabel3.position.set(0, halfSize.y, -halfSize.z);
    widthLabel4.position.set(0, -halfSize.y, -halfSize.z);

    widthLabel2.visible = false;
    widthLabel3.visible = false;
    widthLabel4.visible = false;

    this.add(widthLabel1);
    this.add(widthLabel2);
    this.add(widthLabel3);
    this.add(widthLabel4);

    // Create 4 height labels (Y axis) - only first one visible (from bundle lines 2119-2123)
    const heightLabel1 = this.makeTextSprite(this.canvasHeight);
    const heightLabel2 = this.makeTextSprite(this.canvasHeight);
    const heightLabel3 = this.makeTextSprite(this.canvasHeight);
    const heightLabel4 = this.makeTextSprite(this.canvasHeight);

    heightLabel1.position.set(-halfSize.x, 0, halfSize.z);
    heightLabel2.position.set(halfSize.x, 0, halfSize.z);
    heightLabel3.position.set(halfSize.x, 0, -halfSize.z);
    heightLabel4.position.set(-halfSize.x, 0, -halfSize.z);

    heightLabel2.visible = false;
    heightLabel3.visible = false;
    heightLabel4.visible = false;

    this.add(heightLabel1);
    this.add(heightLabel2);
    this.add(heightLabel3);
    this.add(heightLabel4);
  }

  /**
   * Set selected state (red color) (from bundle lines 2126-2129)
   */
  setSelected() {
    this.frameMaterial.color.setHex(0xff0000);  // Red
  }

  /**
   * Set unselected state (light blue-purple color) (from bundle lines 2131-2134)
   */
  setUnselected() {
    this.frameMaterial.color.setHex(0xddd7dd);  // Light blue-purple
  }

  /**
   * Draw dimension labels with current measurements (from bundle lines 2136-2163)
   */
  drawLabels(halfSize) {
    // Draw depth label (Z axis) in blue (from bundle lines 2138-2145)
    this.drawCanvas(this.canvasDepth, Dimensioning.cmToMeasure(2 * halfSize.z * 100), {
      fontsize: 24,
      color: { r: 0, g: 0, b: 255, a: 1 }
    });

    // Draw width label (X axis) in red (from bundle lines 2146-2153)
    this.drawCanvas(this.canvasWidth, Dimensioning.cmToMeasure(2 * halfSize.x * 100), {
      fontsize: 24,
      color: { r: 255, g: 0, b: 0, a: 1 }
    });

    // Draw height label (Y axis) in green (from bundle lines 2154-2162)
    this.drawCanvas(this.canvasHeight, Dimensioning.cmToMeasure(2 * halfSize.y * 100), {
      fontsize: 24,
      color: { r: 0, g: 255, b: 0, a: 1 }
    });
  }

  /**
   * Draw text on canvas (from bundle lines 2165-2178)
   */
  drawCanvas(canvas, text, options = {}) {
    const fontface = options.fontface || 'Arial';
    const fontsize = options.fontsize || 18;
    const color = options.color || { r: 0, g: 0, b: 0, a: 1 };

    const context = canvas.getContext('2d');

    // Set canvas size if not set
    if (canvas.width === 0) {
      canvas.width = 256;
      canvas.height = 128;
    }

    context.clearRect(0, 0, canvas.width, canvas.height);
    context.font = `Bold ${fontsize}px ${fontface}`;
    context.textBaseline = 'middle';
    context.textAlign = 'center';
    context.fillStyle = `rgba(${color.r},${color.g},${color.b},${color.a})`;
    context.fillText(text, canvas.width / 2, canvas.height / 2);

    // Add white outline (from bundle line 2177)
    context.strokeStyle = '#ffffff';
    context.lineWidth = 0.1;
    context.strokeText(text, canvas.width / 2, canvas.height / 2);
  }

  /**
   * Create text sprite from canvas (from bundle lines 2180-2191)
   */
  makeTextSprite(canvas) {
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;

    const material = new THREE.SpriteMaterial({
      map: texture,
      depthTest: false,
      transparent: true
    });

    const sprite = new THREE.Sprite(material);
    sprite.renderOrder = 100;  // Render on top
    sprite.scale.set(1, 0.75, 1);

    return sprite;
  }

  /**
   * Set position (from bundle lines 2193-2196)
   */
  setPosition(position) {
    this.position.copy(position);
  }

  /**
   * Set rotation (from bundle lines 2198-2201)
   */
  setRotation(angle) {
    this.rotation.y = angle;
  }
}

export default Blueprint3D;
