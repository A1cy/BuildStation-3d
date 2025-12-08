import * as THREE from 'three';

/**
 * ItemFactory - Factory for creating 3D furniture items
 * TODO: Implement actual Item classes when extracted from bundles
 */

/**
 * Base Item class (placeholder)
 * Will be replaced with actual Item implementations
 */
class BaseItem extends THREE.Group {
  constructor(model, metadata, meshes, position, rotation, options) {
    super();
    
    this.model = model;
    this.metadata = metadata || {};
    this.halfSize = new THREE.Vector3();
    this.options = options || {};
    
    // Add meshes to group
    if (meshes && Array.isArray(meshes)) {
      meshes.forEach((mesh) => this.add(mesh));
    }
    
    // Set position
    if (position) {
      this.position.copy(position);
    }
    
    // Set rotation
    if (rotation !== null && rotation !== undefined) {
      this.rotation.y = rotation;
    }
  }

  initObject(meshes, position, rotation, options) {
    // Placeholder - will be implemented by actual Item classes
    console.log('BaseItem.initObject called');
  }

  calculateHalfSize() {
    // Calculate bounding box
    const box = new THREE.Box3().setFromObject(this);
    const size = new THREE.Vector3();
    box.getSize(size);
    this.halfSize.copy(size).multiplyScalar(0.5);
  }

  removed() {
    // Cleanup when item is removed
    this.traverse((child) => {
      if (child.geometry) child.geometry.dispose();
      if (child.material) {
        if (Array.isArray(child.material)) {
          child.material.forEach((mat) => mat.dispose());
        } else {
          child.material.dispose();
        }
      }
    });
  }

  getOptions() {
    return this.options;
  }

  getSnapPoints() {
    // Return empty array for now
    return [];
  }

  getCorners() {
    // Return empty array for now
    return [];
  }
}

/**
 * Set/Group Item class (type 101)
 * Represents a group of linked items
 */
class SetItem extends BaseItem {
  constructor(model, metadata, meshes, position, rotation, options) {
    super(model, metadata, meshes, position, rotation, options);
    this.linkedItems = [];
    this.dimensionHelper = {
      update: () => {}, // Placeholder
    };
  }

  addLinkedItem(item) {
    this.linkedItems.push(item);
  }

  initObject() {
    // Placeholder
    console.log('SetItem.initObject called');
  }
}

/**
 * Item type registry
 */
const itemClasses = {
  1: BaseItem, // Generic furniture item
  101: SetItem, // Set/Group item
};

/**
 * Get Item class by type ID
 * @param {number} itemType - Item type ID
 * @returns {Class} Item class constructor
 */
export function getClass(itemType) {
  return itemClasses[itemType] || BaseItem;
}

/**
 * Register a new item type
 * @param {number} itemType - Item type ID
 * @param {Class} ItemClass - Item class constructor
 */
export function registerItemClass(itemType, ItemClass) {
  itemClasses[itemType] = ItemClass;
}

export default {
  getClass,
  registerItemClass,
};
