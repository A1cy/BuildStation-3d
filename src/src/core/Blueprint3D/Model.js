import * as THREE from 'three';
import FloorPlan from './FloorPlan';
import Scene from './Scene';

/**
 * Model Class (Blueprint3D Main Class)
 * 
 * Main orchestrator for the Blueprint3D system.
 * Coordinates between the FloorPlan (2D floor planning) and Scene (3D rendering).
 * 
 * This is the entry point for:
 * - Creating new floor plans
 * - Loading/saving designs
 * - Managing the complete state
 * - Coordinating 2D/3D views
 */

class Model {
  /**
   * Create a new Blueprint3D Model
   * @param {string} textureDir - Base directory for textures
   */
  constructor(textureDir = '') {
    // Callbacks
    this.roomLoadingCallbacks = [];
    this.roomLoadedCallbacks = [];
    this.roomSavedCallbacks = [];
    this.roomDeletedCallbacks = [];

    // Create core components
    this.floorplan = new FloorPlan();
    this.scene = new Scene(this, textureDir);
    
    // Link scene to floorplan
    this.floorplan.scene = this.scene;
  }

  /**
   * Load a serialized design from JSON
   * @param {string} json - JSON string from exportSerialized()
   */
  loadSerialized = (json) => {
    // Fire loading callbacks
    this.roomLoadingCallbacks.forEach((callback) => {
      if (typeof callback === 'function') {
        callback();
      }
    });

    const data = JSON.parse(json);
    this.newRoom(data.floorplan, data.items);

    // Fire loaded callbacks
    this.roomLoadedCallbacks.forEach((callback) => {
      if (typeof callback === 'function') {
        callback();
      }
    });
  };

  /**
   * Export current design to JSON
   * @returns {string} JSON string with floorplan and items
   */
  exportSerialized = () => {
    const itemsData = [];
    const items = this.scene.getItems();

    // Serialize all items
    for (const [index, item] of items.entries()) {
      itemsData[index] = {
        uuid: item.uuid,
        item_name: item.metadata.itemName,
        item_type: item.metadata.itemType,
        model_url: item.metadata.modelUrl || item.metadata.threeModel,
        xpos: item.position.x,
        ypos: item.position.y,
        zpos: item.position.z,
        rotation: item.rotation.y,
        metadata: item.metadata,
        options: item.getOptions(),
      };
    }

    const design = {
      floorplan: this.floorplan.saveFloorplan(),
      items: itemsData,
    };

    return JSON.stringify(design);
  };

  /**
   * Create a new room from floorplan and items data
   * @param {Object} floorplanData - Floorplan data (corners, walls)
   * @param {Array} itemsData - Array of item data
   */
  newRoom = (floorplanData, itemsData) => {
    // Clear existing scene
    this.scene.clearItems();

    // Load floorplan
    this.floorplan.loadFloorplan(floorplanData);

    // Add items
    itemsData.forEach((itemData) => {
      const position = new THREE.Vector3(
        itemData.xpos,
        itemData.ypos,
        itemData.zpos
      );
      const metadata = itemData.metadata;

      this.scene.addItem(
        itemData.item_type,
        itemData.model_url,
        metadata,
        position,
        itemData.rotation,
        itemData.options
      );
    });
  };
}

export default Model;
