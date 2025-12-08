import React, { Component } from 'react';
import * as THREE from 'three';
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

    // State
    this.state = {
      loading: false,
      floorplanMode: MODES.MOVE,
    };
  }

  componentDidMount() {
    this.initBlueprint3D();
  }

  componentWillUnmount() {
    this.cleanupBlueprint3D();
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

    // TODO: Initialize 3D renderer
    this.init3DRenderer();

    // Register floor plan update callbacks
    this.model.floorplan.fireOnUpdatedRooms(() => {
      if (this.canvas2d) {
        this.canvas2d.draw();
      }
    });

    console.log('Blueprint3D initialized', this.model);
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
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.appendChild(this.renderer.domElement);

    // Create camera
    this.camera = new THREE.PerspectiveCamera(45, width / height, 1, 10000);
    this.camera.position.set(0, 300, 300);
    this.camera.lookAt(0, 0, 0);

    // TODO: Add orbit controls
    // this.controls = new OrbitControls(this.camera, this.renderer.domElement);

    // Add basic lighting
    const ambientLight = new THREE.AmbientLight(0x404040);
    this.model.scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight.position.set(100, 100, 100);
    this.model.scene.add(directionalLight);

    // Start render loop
    this.animate();
  };

  /**
   * Animation loop
   */
  animate = () => {
    requestAnimationFrame(this.animate);

    if (this.renderer && this.camera && this.model) {
      this.renderer.render(this.model.scene.getScene(), this.camera);
    }
  };

  /**
   * Handle canvas DOM loaded from FloorPlanView
   * @param {HTMLCanvasElement} canvas - Canvas element
   */
  handleCanvasLoaded = (canvas) => {
    if (!canvas || this.canvas2d) return;

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

    // Redraw 2D canvas if switching to 2D
    if (viewMode === '2d' && this.canvas2d) {
      setTimeout(() => this.canvas2d.handleWindowResize(), 100);
    }
  };

  /**
   * Clean up Three.js resources
   */
  cleanupBlueprint3D = () => {
    if (this.renderer) {
      this.renderer.dispose();
      this.renderer.domElement.remove();
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
