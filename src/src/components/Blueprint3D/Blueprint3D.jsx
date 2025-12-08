import React, { Component } from 'react';
import * as THREE from 'three';
import { Model } from '../../core/Blueprint3D';
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
    this.canvasRef = React.createRef();

    // Blueprint3D Model
    this.model = null;

    // Three.js components
    this.renderer = null;
    this.camera = null;
    this.controls = null;

    // State
    this.state = {
      loading: false,
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

    // TODO: Initialize 3D renderer
    this.init3DRenderer();

    // TODO: Initialize 2D canvas
    // this.init2DCanvas();

    // TODO: Set up event listeners
    // this.setupEventListeners();

    console.log('Blueprint3D initialized', this.model);
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
   * Handle view mode change (2D ↔ 3D)
   */
  handleViewModeChange = () => {
    const { viewMode } = this.props;
    console.log('View mode changed to:', viewMode);

    // TODO: Show/hide appropriate view
    // For now, just log
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
    const { loading } = this.state;

    return (
      <div className="blueprint3d-container" ref={this.containerRef}>
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
