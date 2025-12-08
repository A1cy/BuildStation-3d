import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import Utils from '../Utils';
import * as ItemFactory from '../items/ItemFactory';

/**
 * Scene Class
 * 
 * Manages the 3D scene including furniture items, lighting, and rendering.
 * Handles GLTF model loading and item lifecycle management.
 * 
 * This is the 3D scene manager that:
 * - Creates and manages Three.js scene
 * - Loads 3D furniture models via GLTF
 * - Handles item addition/removal
 * - Manages item options (materials, morphs, etc.)
 * - Fires callbacks for scene events
 */

class Scene {
  /**
   * Create a new Scene
   * @param {Model} model - Reference to Blueprint3D Model
   * @param {string} textureDir - Base directory for textures
   */
  constructor(model, textureDir) {
    this.model = model;
    this.textureDir = textureDir;
    
    // Collections
    this.items = []; // Array of 3D Item objects
    
    // Three.js setup
    this.scene = new THREE.Scene();
    this.GLTFLoader = new GLTFLoader();
    this.GLTFLoader.crossOrigin = '';
    
    // State
    this.needsUpdate = false;
    
    // Callbacks
    this.itemLoadingCallbacks = [];
    this.itemLoadedCallbacks = [];
    this.itemRemovedCallbacks = [];
  }

  /**
   * Add an object to the Three.js scene
   * @param {THREE.Object3D} object - Object to add
   */
  add(object) {
    this.scene.add(object);
  }

  /**
   * Remove an object from the scene
   * @param {THREE.Object3D} object - Object to remove
   */
  remove(object) {
    this.scene.remove(object);
    Utils.removeValue(this.items, object);
  }

  /**
   * Get the Three.js scene
   * @returns {THREE.Scene}
   */
  getScene() {
    return this.scene;
  }

  /**
   * Get all items in the scene
   * @returns {Item[]}
   */
  getItems() {
    return this.items;
  }

  /**
   * Get number of items in scene
   * @returns {number}
   */
  itemCount() {
    return this.items.length;
  }

  /**
   * Clear all items from the scene
   */
  clearItems() {
    this.items.forEach((item) => {
      // Remove dimension helper if it exists
      if (item.dimensionHelper) {
        this.remove(item.dimensionHelper);
      }
      this.removeItem(item, true);
    });
    this.items = [];
  }

  /**
   * Remove a specific item from the scene
   * @param {Item} item - Item to remove
   * @param {boolean} skipArrayRemoval - If true, don't remove from items array
   */
  removeItem(item, skipArrayRemoval = false) {
    // Fire callbacks
    this.itemRemovedCallbacks.forEach((callback) => {
      if (typeof callback === 'function') {
        callback(item);
      }
    });

    // Call item's removed method
    item.removed();

    // Remove from scene
    this.scene.remove(item);

    // Remove from items array unless skipping
    if (!skipArrayRemoval) {
      Utils.removeValue(this.items, item);
    }
  }

  /**
   * Extract default options from item metadata
   * Used to set up initial item configuration
   * @param {Object} itemMetadata - Item metadata from product catalog
   * @returns {Object} { morph, styles, textures }
   */
  collectOptionsFromItem(itemMetadata) {
    const styles = {};
    const morph = {};
    const textures = {};

    // Collect style options (select dropdowns)
    for (const key in itemMetadata.builderOptions) {
      const option = itemMetadata.builderOptions[key];
      if (option.propertyType === 'select' && option.options.length) {
        styles[option.nameInModel] = option.options[0].nameInModel;
      }
    }

    // Collect option groups
    if (Array.isArray(itemMetadata.optionGroups)) {
      itemMetadata.optionGroups.forEach((group) => {
        // Hide/show options
        if (group.mode === 'hide' && group.options.length) {
          styles[group.nameInModel] = group.options[0].nameInModel;
        }

        // Texture options
        if (group.mode === 'texture' && group.options.length) {
          textures[group.nameInModel] = {
            material: {
              texture: group.options[0].image,
            },
            size: {
              w: group.options[0].textureWidth / 100,
              h: group.options[0].textureHeight / 100,
            },
          };
        }
      });
    }

    // Collect morph options (dimensions)
    const morphDefaults = {};
    
    const heightMin = itemMetadata.builderOptions?.height?.minValue;
    const widthMin = itemMetadata.builderOptions?.width?.minValue;
    const depthMin = itemMetadata.builderOptions?.depth?.minValue;

    if (heightMin) {
      morphDefaults[0] = itemMetadata.builderOptions.height.minValue;
      if (itemMetadata.modelDescription?.height) {
        morphDefaults[0] = itemMetadata.modelDescription.height;
      }
    }

    if (widthMin) {
      morphDefaults[1] = itemMetadata.builderOptions.width.minValue;
      if (itemMetadata.modelDescription?.width) {
        morphDefaults[1] = itemMetadata.modelDescription.width;
      }
    }

    if (depthMin) {
      morphDefaults[2] = itemMetadata.builderOptions.depth.minValue;
      if (itemMetadata.modelDescription?.depth) {
        morphDefaults[2] = itemMetadata.modelDescription.depth;
      }
    }

    // Normalize morph values (0-1 range)
    for (const index in morphDefaults) {
      morph[index] = (morphDefaults[index] - 5) / 295;
    }

    return {
      morph,
      styles,
      textures,
    };
  }

  /**
   * Add an item to the scene
   * @param {number} itemType - Item type ID
   * @param {string} modelUrl - URL to GLTF model
   * @param {Object} metadata - Item metadata
   * @param {THREE.Vector3} position - Item position
   * @param {number} rotation - Item Y rotation (radians)
   * @param {Object} options - Item options { morph, styles, textures, stackable, overlappable }
   * @param {boolean} fireCallbacks - Whether to fire itemLoaded callbacks (default true)
   * @returns {Promise<Item>} Promise resolving to created Item
   */
  async addItem(
    itemType,
    modelUrl,
    metadata,
    position,
    rotation,
    options,
    fireCallbacks = true
  ) {
    console.log('adding item');

    return new Promise((resolve) => {
      itemType = itemType || 1;

      // Fire loading callbacks
      this.itemLoadingCallbacks.forEach((callback) => {
        if (typeof callback === 'function') {
          callback();
        }
      });

      // Load GLTF model
      this.GLTFLoader.load(
        modelUrl,
        (gltf) => {
          console.log(gltf);

          const meshes = [];
          const morphUVsHeight = {};
          const morphUVsWidth = {};
          const morphUVsDepth = {};

          // Extract meshes and morph UVs
          gltf.scene.traverse((child) => {
            if (child.isMesh) {
              // Collect non-morph meshes
              if (!child.name.includes('morph-')) {
                meshes.push(child);
              }

              // Extract morph UV data
              if (child.name.includes('morph-height')) {
                const meshName = child.name.replace('-morph-height', '');
                const uvArray = [];
                child.geometry.attributes.uv.array.forEach((val) => uvArray.push(val));
                morphUVsHeight[meshName] = uvArray;
              } else if (child.name.includes('morph-width')) {
                const meshName = child.name.replace('-morph-width', '');
                const uvArray = [];
                child.geometry.attributes.uv.array.forEach((val) => uvArray.push(val));
                morphUVsWidth[meshName] = uvArray;
              } else if (child.name.includes('morph-depth')) {
                const meshName = child.name.replace('-morph-depth', '');
                const uvArray = [];
                child.geometry.attributes.uv.array.forEach((val) => uvArray.push(val));
                morphUVsDepth[meshName] = uvArray;
              }
            }
          });

          const morphUVs = [morphUVsHeight, morphUVsWidth, morphUVsDepth];

          // Create item using factory
          const ItemClass = ItemFactory.getClass(itemType);
          const item = new ItemClass(
            this.model,
            {
              ...metadata,
              morphUVs,
            },
            meshes,
            position,
            rotation,
            options
          );

          console.log('item line 185', item);

          // Initialize item
          item.initObject(meshes, position, rotation, options);

          console.log('item 187', item);

          // Add to scene
          this.items.push(item);
          this.add(item);

          // Fire loaded callbacks
          if (fireCallbacks) {
            this.itemLoadedCallbacks.forEach((callback) => {
              if (typeof callback === 'function') {
                callback(item);
              }
            });
          }

          resolve(item);
        },
        undefined,
        () => {
          // Error callback
          resolve(null);
        }
      );
    });
  }

  /**
   * Import a set from external builder/configurator
   * @param {Object} setMetadata - Set metadata
   * @param {Array} setItems - Array of item data
   * @param {THREE.Vector3} position - Set position
   * @param {number} rotation - Set rotation
   * @param {Object} options - Set options
   * @returns {Promise<void>}
   */
  async importSetFromBuilder(setMetadata, setItems, position, rotation, options) {
    if (!Array.isArray(setItems) || !setItems.length) {
      return;
    }

    console.log('import set from builder');

    // Fire loading callbacks
    this.itemLoadingCallbacks.forEach((callback) => {
      if (typeof callback === 'function') {
        callback();
      }
    });

    // Create parent group item (type 101 = set/group)
    const SetItemClass = ItemFactory.getClass(101);
    const setItem = new SetItemClass(
      this.model,
      { ...setMetadata },
      [],
      position,
      rotation,
      options
    );

    // Add child items to set
    for (const itemData of setItems) {
      const childItem = await this.addItem(
        itemData.type || itemData.item_type,
        itemData.model || itemData.modelUrl || itemData.model_url,
        itemData.metadata,
        new THREE.Vector3().copy(setItem.position).add(
          new THREE.Vector3(itemData.xpos, itemData.ypos, itemData.zpos)
        ),
        itemData.rotation,
        itemData.options
      );

      setItem.addLinkedItem(childItem);
    }

    // Add set to scene
    this.items.push(setItem);
    this.add(setItem);
    setItem.initObject();
    setItem.calculateHalfSize();
    setItem.dimensionHelper.update();

    // Fire loaded callbacks
    this.itemLoadedCallbacks.forEach((callback) => {
      if (typeof callback === 'function') {
        callback(setItem);
      }
    });
  }

  /**
   * Add a predefined set to the scene
   * @param {Object} setMetadata - Set metadata
   * @param {Array} setProducts - Array of product configurations with offsets
   * @param {THREE.Vector3} position - Set position
   * @param {number} rotation - Set rotation
   * @param {Object} options - Set options
   * @returns {Promise<void>}
   */
  async addSet(setMetadata, setProducts, position, rotation, options) {
    console.log('add set to scene', setMetadata, setProducts);

    // Fire loading callbacks
    this.itemLoadingCallbacks.forEach((callback) => {
      if (typeof callback === 'function') {
        callback();
      }
    });

    // Create parent group item (type 101 = set/group)
    const SetItemClass = ItemFactory.getClass(101);
    const setItem = new SetItemClass(
      this.model,
      { ...setMetadata },
      [],
      position,
      rotation,
      options
    );

    // Add products to set
    for (const productData of setProducts) {
      const product = productData.product;
      const offset = new THREE.Vector3(
        productData.offset.x,
        productData.offset.y,
        productData.offset.z
      );

      // Collect morph options
      const morph = {};
      if (Array.isArray(product.morph)) {
        product.morph.forEach((morphData) => {
          morph[morphData.index] = (morphData.min - 5) / 295;
        });
      }

      // Collect style options
      const styles = {};
      if (Array.isArray(product.styles)) {
        product.styles.forEach((style) => {
          styles[style.name_in_model] = style.types[0].name_in_model;
        });
      }

      // Add child item
      const childItem = await this.addItem(
        product.type,
        product.model,
        product.metadata,
        new THREE.Vector3().copy(setItem.position).add(offset),
        product.rotation || null,
        {
          styles,
          morph,
          stackable: product.stackable,
          stackontop: product.stackontop,
          overlappable: product.overlappable,
        }
      );

      setItem.addLinkedItem(childItem);
    }

    // Add set to scene
    this.items.push(setItem);
    this.add(setItem);
    setItem.initObject();
    setItem.calculateHalfSize();
    setItem.dimensionHelper.update();

    console.log(setItem);

    // Fire loaded callbacks
    this.itemLoadedCallbacks.forEach((callback) => {
      if (typeof callback === 'function') {
        callback(setItem);
      }
    });
  }
}

export default Scene;
