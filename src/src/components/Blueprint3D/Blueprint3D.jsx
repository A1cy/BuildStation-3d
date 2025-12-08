import React, { Component } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { Model, Canvas2D, MODES } from '../../core/Blueprint3D';
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

    // Initialize canvas if it was already loaded
    if (this.canvas2DRef && !this.canvas2d) {
      this.handleCanvasLoaded(this.canvas2DRef);
    }
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
      alpha: true 
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.setClearColor(0x87ceeb, 1); // Sky blue background

    // Add to DOM
    this.renderer.domElement.style.position = 'absolute';
    this.renderer.domElement.style.top = '0';
    this.renderer.domElement.style.left = '0';
    this.renderer.domElement.style.display = this.props.viewMode === '3d' ? 'block' : 'none';
    container.appendChild(this.renderer.domElement);

    // Create camera
    this.camera = new THREE.PerspectiveCamera(45, width / height, 1, 10000);
    this.camera.position.set(12, 10, 12);
    this.camera.lookAt(0, 1, 0);

    // Add OrbitControls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.screenSpacePanning = false;
    this.controls.minDistance = 5;
    this.controls.maxDistance = 50;
    this.controls.maxPolarAngle = Math.PI / 2; // Don't go below ground

    // Create enhanced lighting
    this.createLighting();

    // Create ground plane
    this.createGroundPlane();

    // Create skybox
    this.createSkybox();

    // Start render loop
    this.animate();
  };

  /**
   * Create enhanced lighting system
   */
  createLighting = () => {
    // Ambient light (soft overall illumination)
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    this.model.scene.add(ambientLight);

    // Main directional light (sun)
    const sunLight = new THREE.DirectionalLight(0xffffff, 1.0);
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
    
    this.model.scene.add(sunLight);

    // Hemisphere light (gradient from sky to ground)
    const hemiLight = new THREE.HemisphereLight(0x87ceeb, 0x545454, 0.3);
    hemiLight.position.set(0, 500, 0);
    this.model.scene.add(hemiLight);

    // Fill light (soften shadows)
    const fillLight = new THREE.DirectionalLight(0xffffff, 0.3);
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
   * Update 3D floor plan visualization (walls, rooms)
   */
  update3DFloorPlan = () => {
    if (!this.model || !this.model.floorplan) return;

    // Remove existing floor plan meshes
    if (this.floorPlanGroup) {
      this.model.scene.remove(this.floorPlanGroup);
    }

    // Create new group for floor plan meshes
    this.floorPlanGroup = new THREE.Group();

    // Create wall meshes
    const wallHeight = 2.5; // 2.5 meters tall
    const wallThickness = 0.1; // 10cm thick
    const wallMaterial = new THREE.MeshStandardMaterial({
      color: 0xeeeeee,
      roughness: 0.9,
      metalness: 0.1
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
    const floorMaterial = new THREE.MeshStandardMaterial({
      color: 0xcccccc,
      roughness: 0.8,
      metalness: 0.2
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

    console.log('Floor plan updated: walls created, rooms rendered');
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

    // Render scene
    if (this.renderer && this.camera && this.model) {
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

export default Blueprint3D;
