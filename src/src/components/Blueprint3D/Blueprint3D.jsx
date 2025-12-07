/**
 * Blueprint3D - Main wrapper component for 2D floor planning and 3D visualization
 * Integrates floor planner, Three.js 3D scene, model loading, and item management
 * Acts as the central coordinator between 2D and 3D views
 */

import React, { Component } from 'react';
import FloorPlanView from '../FloorPlanner/FloorPlanView';
import './Blueprint3D.css';

// import BP3DLib from './bp3d-lib'; // Will be integrated when BP3D library is extracted

// Default floor plan configuration
const DEFAULT_FLOORPLAN = {
  corners: {},
  walls: [],
  rooms: [],
  items: []
};

class Blueprint3D extends Component {
  constructor(props) {
    super(props);

    // Refs for DOM elements
    this.elFloorPlannerElement = null;
    this.elThreeElemContainer = null;

    // BP3D library instance (will be initialized)
    this.bp3d = null;

    this.state = {
      selectedItem: null
    };
  }

  /**
   * Initialize Blueprint3D library
   * Sets up floor planner and Three.js scene
   */
  initializeBP3D = () => {
    const config = {
      floorplannerElement: this.elFloorPlannerElement,
      threeElement: this.elThreeElemContainer,
      textureDir: 'models/textures/',
      widget: false
    };

    // Initialize BP3D library (placeholder until library is extracted)
    // this.bp3d = new BP3DLib(config);

    // Load serialized floor plan
    const defaultJson = this.props.defaultJson || JSON.stringify(DEFAULT_FLOORPLAN);
    // this.bp3d.model.loadSerialized(defaultJson);

    // Register callbacks
    // this.bp3d.three.itemSelectedCallbacks.push(this.handleItemSelected);
    // this.bp3d.three.itemUnselectedCallbacks.push(this.handleItemUnselected);
    // this.bp3d.floorplanner.itemSelectedCallbacks.push(this.handleItemSelected);
    // this.bp3d.floorplanner.itemUnselectedCallbacks.push(this.handleItemUnselected);

    console.log('BP3D initialized (placeholder)');
  };

  /**
   * Component lifecycle - initialize BP3D after mount
   */
  componentDidMount = () => {
    setTimeout(() => {
      this.initializeBP3D();
    }, 1000);
  };

  /**
   * Handle prop changes (unit, view mode)
   * @param {Object} nextProps - Next props
   */
  componentWillReceiveProps = (nextProps) => {
    // Handle measurement unit change
    if (nextProps.measureUnit !== this.props.measureUnit) {
      // this.bp3d.changeUnit(nextProps.measureUnit);
      console.log('Unit changed to:', nextProps.measureUnit);
    }

    // Handle view mode change (2D/3D)
    if (nextProps.viewMode !== this.props.viewMode) {
      setTimeout(() => {
        // this.bp3d.model.floorplan.update();
        window.dispatchEvent(new Event('resize'));
      }, 10);
    }
  };

  /**
   * Set floor plan from JSON
   * @param {string} json - Serialized floor plan JSON
   */
  setJSON = (json) => {
    // this.bp3d.model.loadSerialized(json);
    console.log('Loading JSON:', json);
  };

  /**
   * Get current floor plan as JSON
   * @returns {string} Serialized floor plan
   */
  getJSON = () => {
    // return this.bp3d.model.exportSerialized();
    return JSON.stringify(DEFAULT_FLOORPLAN);
  };

  /**
   * Take snapshot of 3D scene
   * @returns {string} Data URL of snapshot
   */
  takeSnapshot = () => {
    // return this.bp3d.three.dataUrl();
    console.log('Taking snapshot...');
    return '';
  };

  /**
   * Handle item selection in scene
   * @param {Object} item - Selected item
   */
  handleItemSelected = (item) => {
    this.setState({ selectedItem: item });

    if (typeof this.props.onItemSelected === 'function') {
      this.props.onItemSelected(item);
    }
  };

  /**
   * Handle item deselection
   */
  handleItemUnselected = () => {
    this.setState({ selectedItem: null });

    if (typeof this.props.onItemUnselected === 'function') {
      this.props.onItemUnselected();
    }
  };

  /**
   * Update window size (for responsive canvas)
   */
  update = () => {
    try {
      // this.bp3d.three.updateWindowSize();
      window.dispatchEvent(new Event('resize'));
    } catch (error) {
      console.error('Update error:', error);
    }
  };

  /**
   * Get default data for product
   * @param {Object} product - Product metadata
   * @returns {Object} Default morph, styles, metadata
   */
  getDefaultData = (product) => {
    const defaultMorph = {};
    const defaultStyles = {};

    // Set default morph values from product configuration
    if (Array.isArray(product.morph)) {
      product.morph.forEach((morph) => {
        defaultMorph[morph.index] = (morph.min - 5) / 295;
      });
    }

    // Set default style values
    if (Array.isArray(product.styles)) {
      product.styles.forEach((style) => {
        defaultStyles[style.name_in_model] = style.types[0].name_in_model;
      });
    }

    return {
      defaultMorph,
      defaultStyles,
      metadata: {
        ...product,
        itemName: product.name,
        modelUrl: product.model,
        itemType: product.type
      }
    };
  };

  /**
   * Add item to scene
   * @param {Object} product - Product configuration
   * @returns {Promise<Object>} Added item
   */
  addItem = async (product) => {
    try {
      const { defaultMorph, defaultStyles, metadata } = this.getDefaultData(product);

      // Add item via BP3D library
      // const item = await this.bp3d.model.scene.addItem(
      //   product.type,
      //   product.model,
      //   metadata,
      //   null,
      //   null,
      //   {
      //     styles: defaultStyles,
      //     morph: defaultMorph,
      //     stackable: product.stackable,
      //     stackontop: product.stackontop,
      //     overlappable: product.overlappable
      //   }
      // );

      console.log('Adding item:', product.name);
      // return item;
      return null;
    } catch (error) {
      console.error('Error adding item:', error);
      return null;
    }
  };

  /**
   * Duplicate currently selected item
   * @returns {Promise<Object>} Duplicated item
   */
  duplicateItem = async () => {
    const { selectedItem } = this.state;

    if (!selectedItem) {
      return null;
    }

    try {
      const metadata = selectedItem.metadata;
      const options = selectedItem.getOptions();
      const position = selectedItem.position;
      const rotation = selectedItem.rotation.y;

      // Duplicate via BP3D library
      // const item = await this.bp3d.model.scene.addItem(
      //   metadata.type,
      //   metadata.model,
      //   metadata,
      //   position,
      //   rotation,
      //   options
      // );

      console.log('Duplicating item');
      // return item;
      return null;
    } catch (error) {
      console.error('Error duplicating item:', error);
      return null;
    }
  };

  /**
   * Import set from external builder
   * @param {Object} setData - Set configuration
   */
  importSetFromBuilder = (setData) => {
    // this.bp3d.model.scene.importSetFromBuilder(
    //   { itemName: 'Imported Set', items: setData },
    //   setData
    // );
    console.log('Importing set from builder:', setData);
  };

  /**
   * Add set/group of items
   * @param {Object} set - Set configuration
   */
  addSet = (set) => {
    const setData = {
      ...set,
      itemName: set.name
    };

    // this.bp3d.model.scene.addSet(setData, set.items);
    console.log('Adding set:', set.name);
  };

  /**
   * Replace item in a set
   * @param {number} itemIndex - Item index in set
   * @param {Object} newProduct - New product configuration
   */
  replaceSetItem = async (itemIndex, newProduct) => {
    const { selectedItem } = this.state;

    if (!selectedItem || !selectedItem.isSet) {
      return null;
    }

    try {
      const oldItem = selectedItem.linkedItems[itemIndex];
      const position = oldItem.position;
      const rotation = oldItem.rotation.y;
      const options = oldItem.getOptions();

      // Remove old item
      selectedItem.linkedItems[itemIndex].remove();

      // Add new item
      const { metadata } = this.getDefaultData(newProduct);
      // const newItem = await this.bp3d.model.scene.addItem(
      //   newProduct.type,
      //   newProduct.model,
      //   metadata,
      //   position,
      //   rotation,
      //   options,
      //   false
      // );

      // Update set linkage
      // selectedItem.linkedItems[itemIndex] = newItem;
      // newItem.groupParent = selectedItem;

      console.log('Replacing set item');
      return null;
    } catch (error) {
      console.error('Error replacing set item:', error);
      return null;
    }
  };

  /**
   * Update material on selected item
   * @param {string} materialName - Material name in model
   * @param {Object} materialType - Material type object
   */
  updateMaterial = (materialName, materialType) => {
    const { selectedItem } = this.state;

    if (selectedItem) {
      // selectedItem.updateMaterial(materialName, materialType);
      console.log('Updating material:', materialName, materialType);
    }
  };

  /**
   * Update style on selected item
   * @param {string} styleName - Style name in model
   * @param {string} styleValue - Style value
   */
  updateStyle = (styleName, styleValue) => {
    const { selectedItem } = this.state;

    if (selectedItem) {
      // selectedItem.updateStyle(styleName, styleValue);
      console.log('Updating style:', styleName, styleValue);
    }
  };

  /**
   * Set morph target value
   * @param {number} morphIndex - Morph target index
   * @param {number} value - Morph value (0-1)
   */
  setMorph = (morphIndex, value) => {
    // Implementation would update morph targets
    console.log('Setting morph:', morphIndex, value);
  };

  /**
   * Set dimension visibility
   * @param {boolean} visible - Show/hide dimensions
   */
  setDimensionVisible = (visible) => {
    // this.bp3d.three.setDimensionVisible(visible);
    console.log('Dimension visibility:', visible);
  };

  /**
   * Set scene locked state
   * @param {boolean} locked - Lock/unlock scene
   */
  setLocked = (locked) => {
    // this.bp3d.three.setLocked(locked);
    console.log('Scene locked:', locked);
  };

  /**
   * Set snap to grid
   * @param {boolean} snap - Enable/disable snap
   */
  setSnap = (snap) => {
    // this.bp3d.floorplanner.setSnap(snap);
    console.log('Snap:', snap);
  };

  /**
   * Toggle X-Ray mode
   * @param {boolean} enabled - Enable/disable X-Ray
   */
  setToggleXRay = (enabled) => {
    // this.bp3d.three.setXRay(enabled);
    console.log('X-Ray:', enabled);
  };

  render() {
    const { viewMode } = this.props;

    return (
      <div className="blueprint3d-container">
        {/* Floor Planner (2D) */}
        <div
          ref={(el) => (this.elFloorPlannerElement = el)}
          className={`floorplanner-view ${viewMode === '2d' ? 'visible' : 'hidden'}`}
        >
          <FloorPlanView hidden={viewMode !== '2d'} />
        </div>

        {/* Three.js Viewer (3D) */}
        <div
          ref={(el) => (this.elThreeElemContainer = el)}
          className={`threejs-view ${viewMode === '3d' ? 'visible' : 'hidden'}`}
        >
          {/* Three.js canvas will be inserted here by BP3D library */}
        </div>
      </div>
    );
  }
}

export default Blueprint3D;
