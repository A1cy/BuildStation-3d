import * as THREE from 'three';

/**
 * ItemFactory - Factory for creating 3D furniture items
 * Extracted from production bundle and modernized
 */

/**
 * Handle color constants (extracted from production bundle line 2212)
 */
const HANDLE_COLORS = {
  black: 0x121212,    // 1184274 in decimal
  silver: 0xEEEEEE,   // 15658734 in decimal
  nickel: 0xEEEE76    // 15658598 in decimal
};

/**
 * Base Item class
 * Main furniture item implementation with full 3D model support
 */
class BaseItem extends THREE.Group {
  constructor(model, metadata, meshes, position, rotation, options) {
    super();

    this.model = model;
    this.metadata = metadata || {};
    this.halfSize = new THREE.Vector3();
    this.options = options || {};

    // Scene reference (for adding dimension helpers, etc.)
    this.scene = model.scene;

    // Item properties (extracted from production bundle)
    this.fixed = false;           // Lock in place
    this.stackable = false;       // Can be stacked on other items
    this.stackontop = false;      // Can be stacked on top
    this.overlappable = false;    // Can overlap with other items
    this.morphAlign = 0;          // Morph alignment setting (0 = default)

    // State tracking
    this.position_set = false;    // Whether position has been explicitly set
    this.error = false;           // Error state flag

    // Collections
    this.linkedItems = [];        // Linked items (for sets/groups)
    this.childMeshes = [];        // Child mesh references
    this.morph = {};              // Morph target values
    this.textures = {};           // Applied textures
    this.styles = {};             // Style configurations

    // Shadow properties
    this.castShadow = true;
    this.receiveShadow = false;

    // Dimension helper (will be created in configDimensionLabels)
    this.dimensionHelper = null;

    // Center offset for positioning (extracted from bundle line 2683)
    this.centerOffset = new THREE.Vector3();

    // Note: meshes are NOT added here - they're added in prepareMeshes()
    // This allows proper material setup before adding to scene
  }

  /**
   * Initialize item object (extracted from bundle line 2430)
   * This method orchestrates the full initialization sequence
   */
  initObject(meshes, position, rotation, options) {
    console.log('init object');
    console.log('📦 Options received:', options);

    this.halfSize = this.objectHalfSize();
    this.prepareMeshes(meshes);
    this.configDimensionLabels();

    if (position) {
      this.position.copy(position);
      this.position_set = true;
    } else {
      this.position.set(0, 0, 0);
      this.position_set = false;
    }

    if (this.dimensionHelper) {
      this.dimensionHelper.position.copy(this.position);
    }

    if (rotation) {
      this.rotation.y = rotation;
      if (this.dimensionHelper) {
        this.dimensionHelper.rotation.y = rotation;
      }
    }

    this.castShadow = true;
    this.receiveShadow = true;

    this.moveChildMeshes();
    this.rotateChildMeshes();
    this.setOptions(options);
    this.placeInRoom();
  }

  /**
   * Prepare meshes for rendering (extracted from bundle lines 2686-2751)
   * Configures materials, shadows, opacity, and special effects (glass, handles, etc.)
   */
  prepareMeshes(meshes) {
    if (!Array.isArray(meshes)) return;

    // DIAGNOSTIC LOGGING
    console.log('🔍 prepareMeshes() received:', meshes.length, 'meshes');
    meshes.forEach((mesh, index) => {
      console.log(`  Mesh ${index}: ${mesh.name}`);
      console.log(`    Geometry: vertices=${mesh.geometry.attributes.position?.count || 0}`);
      console.log(`    Material: ${mesh.material?.type}, color=${mesh.material?.color?.getHexString()}`);
    });

    let hasBlockMorph = false;
    let hasHorizontalBlockMorph = false;

    meshes.forEach((mesh) => {
      try {
        // Detect morph capabilities from mesh names
        if (mesh.name.includes('(block)')) hasBlockMorph = true;
        if (mesh.name.includes('(block-hor')) hasHorizontalBlockMorph = true;

        // Enable shadows
        mesh.castShadow = true;
        mesh.receiveShadow = true;

        // Clone material for independent manipulation
        const originalMaterial = mesh.material;
        mesh.material = new THREE.MeshStandardMaterial();
        THREE.Material.prototype.copy.call(mesh.material, originalMaterial);

        // MATERIAL VERIFICATION LOGGING
        console.log(`  Material copy: ${originalMaterial.type} → ${mesh.material.type}`);
        if (originalMaterial.map) {
          console.log(`    Texture preserved: ${originalMaterial.map !== null}`);
        }
        if (originalMaterial.color) {
          console.log(`    Color preserved: ${originalMaterial.color.getHexString()}`);
        }

        // Backup original geometry for potential restoration
        const geometryBackup = new THREE.BufferGeometry().copy(mesh.geometry);
        mesh.geometryBackup = geometryBackup;

        // Handle opacity from mesh name (e.g., "(opacity75)" → 75% opacity)
        const opacityMatch = /\(opacity(\d+)\)/g.exec(mesh.name);
        if (opacityMatch && opacityMatch[1]) {
          const opacityValue = parseInt(opacityMatch[1]);
          mesh.material.transparent = true;
          mesh.material.opacity = opacityValue / 100;
        }

        // Apply handle colors
        if (mesh.name.includes('handle')) {
          for (const colorName in HANDLE_COLORS) {
            if (mesh.name.includes(colorName)) {
              const clonedMaterial = mesh.material.clone();
              mesh.material = clonedMaterial;
              mesh.material.color.setHex(HANDLE_COLORS[colorName]);
            }
          }
        }

        // Apply lock color
        if (mesh.name.includes('lock') && !mesh.name.includes('block')) {
          const clonedMaterial = mesh.material.clone();
          clonedMaterial.color.setHex(0x121212); // Black for locks
          mesh.material = clonedMaterial;
        }

        // Apply glass material (MeshPhysicalMaterial for transparency)
        if (mesh.name.includes('glass')) {
          const originalGlassMaterial = mesh.material;
          mesh.material = new THREE.MeshPhysicalMaterial();
          THREE.Material.prototype.copy.call(mesh.material, originalGlassMaterial);

          const glassMat = mesh.material;
          glassMat.transparent = true;
          glassMat.roughness = mesh.name.includes('acrylic') ? 0.5 : 0;
          glassMat.metalness = mesh.name.includes('acrylic') ? 0.5 : 0;
          glassMat.transmission = 0.8;
          glassMat.thickness = 1;
          glassMat.color.setHex(0x888888); // Light gray glass tint
          glassMat.envMap = this.scene.environment;
          glassMat.envMapIntensity = 2;
          glassMat.emissive.setHex(0x444444);
        }

        // Apply glide/slider material (metallic)
        if (mesh.name.includes('glide')) {
          const originalGlideMaterial = mesh.material;
          mesh.material = new THREE.MeshPhysicalMaterial();
          THREE.Material.prototype.copy.call(mesh.material, originalGlideMaterial);

          const glideMat = mesh.material;
          glideMat.roughness = 0;
          glideMat.metalness = 0.8;
          glideMat.color.setHex(0x000000); // Black metallic
          glideMat.envMap = this.scene.environment;
          glideMat.envMapIntensity = 2;
        }

        // Add mesh to item group
        this.add(mesh);

        // Create and store a child mesh reference (for transformations)
        const childMesh = new THREE.Mesh().copy(mesh);
        childMesh.material = mesh.material.clone();
        childMesh.material.transparent = true;
        childMesh.material.opacity = 0;
        this.childMeshes.push(childMesh);
        this.scene.add(childMesh);

      } catch (error) {
        console.error('Error processing mesh:', mesh.name, error);
      }
    });

    // Store morph indices if detected
    if (hasBlockMorph) {
      this.metadata.blockMorphIndex = 0;
    }
    if (hasHorizontalBlockMorph) {
      this.metadata.horizontalBlockMorphIndex = 1;
    }
  }

  /**
   * Set item options (extracted from bundle lines 2441-2449)
   * Applies morph, texture, and style configurations
   */
  setOptions(options) {
    if (!options) {
      console.log('⚠️ setOptions called with no options');
      return;
    }

    console.log('🎨 setOptions called:', options);

    // Set basic properties
    if (options.hasOwnProperty('fixed')) {
      this.fixed = options.fixed;
    }
    if (options.hasOwnProperty('stackable')) {
      this.stackable = options.stackable;
    }
    if (options.hasOwnProperty('stackontop')) {
      this.stackontop = options.stackontop;
    }
    if (options.hasOwnProperty('overlappable')) {
      this.overlappable = options.overlappable;
    }

    // Apply morph targets (dimension changes)
    if (options.morph) {
      for (const key in options.morph) {
        this.setMorph(key, options.morph[key]);
      }
    }

    // Apply textures
    if (options.textures) {
      for (const key in options.textures) {
        this.updateMaterial(key, options.textures[key].material, options.textures[key].size);
      }
    }

    // Apply styles (show/hide mesh parts)
    if (options.styles) {
      for (const key in options.styles) {
        this.updateStyle(key, options.styles[key]);
      }
    }
  }

  /**
   * Calculate item's half-size for bounding box (extracted from bundle lines 3083-3087)
   * @returns {THREE.Vector3} Half-size vector
   */
  objectHalfSize() {
    const bounds = this.getBounding(true);
    return bounds.max.clone().sub(bounds.min).divideScalar(2);
  }

  /**
   * Get bounding box for item with caching optimization (extracted from bundle lines 2768-2785)
   * Caches bounding box and only recalculates when position, rotation, or morph changes
   * @param {boolean} forceRecalculate - Force recalculation even if cached
   * @param {THREE.Object3D} target - Target object to calculate bounds for (defaults to this)
   * @param {Array} excludeMeshes - Meshes to exclude from calculation
   * @returns {Object} Bounding box with min/max vectors
   */
  getBounding(forceRecalculate = false, target = this, excludeMeshes = []) {
    try {
      // Current state for comparison
      const currentPosition = {
        x: target.position.x,
        y: target.position.y,
        z: target.position.z
      };
      const currentRotation = target.rotation.y;
      const currentMorph = JSON.parse(JSON.stringify(this.morph));

      // Check if recalculation needed
      const positionChanged = JSON.stringify(currentPosition) !== JSON.stringify(this.prevPosition);
      const morphChanged = JSON.stringify(currentMorph) !== JSON.stringify(this.prevMorph);
      const rotationChanged = currentRotation !== this.prevRotation;

      if (forceRecalculate || positionChanged || morphChanged || rotationChanged) {
        // Recalculate bounding box using the calculateBounds function
        this.boundingGizmo = this.calculateBounds(target, excludeMeshes);

        // Update cached state
        this.prevPosition = currentPosition;
        this.prevRotation = currentRotation;
        this.prevMorph = currentMorph;
      }

      return this.boundingGizmo;
    } catch (error) {
      console.error('Error in getBounding:', error);
      return null;
    }
  }

  /**
   * Calculate bounding box from object geometry (helper for getBounding)
   * @param {THREE.Object3D} object - Object to calculate bounds for
   * @param {Array} excludeMeshes - Meshes to exclude
   * @returns {Object} Bounding box { min, max }
   */
  calculateBounds(object, excludeMeshes = []) {
    let minX = Infinity, minY = Infinity, minZ = Infinity;
    let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;

    const meshes = excludeMeshes.length ? excludeMeshes : object.children;
    const corners = this.getCorners('x', 'y', 'z', object, meshes, false, true);

    corners.forEach(meshCorners => {
      meshCorners.forEach(corner => {
        if (corner.x < minX) minX = corner.x;
        if (corner.y < minY) minY = corner.y;
        if (corner.z < minZ) minZ = corner.z;
        if (corner.x > maxX) maxX = corner.x;
        if (corner.y > maxY) maxY = corner.y;
        if (corner.z > maxZ) maxZ = corner.z;
      });
    });

    return {
      min: new THREE.Vector3(minX, minY, minZ),
      max: new THREE.Vector3(maxX, maxY, maxZ)
    };
  }

  /**
   * Configure dimension labels (extracted from bundle lines 2753-2756)
   * Creates visual dimension helper for measurements
   */
  configDimensionLabels() {
    // For now, create a simple placeholder
    // TODO: Implement full DimensionHelper class
    this.dimensionHelper = {
      position: new THREE.Vector3(),
      rotation: new THREE.Euler(),
      update: () => {},
      setRotation: (y) => {
        if (this.dimensionHelper) {
          this.dimensionHelper.rotation.y = y;
        }
      }
    };
  }

  /**
   * Move child meshes to match item position (extracted from bundle lines 3006-3012)
   * Updates world positions of all child mesh references
   */
  moveChildMeshes() {
    for (const index in this.childMeshes) {
      const worldPosition = new THREE.Vector3();
      if (this.children[index]) {
        this.children[index].getWorldPosition(worldPosition);
        this.childMeshes[index].position.copy(worldPosition);
      }
    }
  }

  /**
   * Rotate child meshes to match item rotation (extracted from bundle lines 2976-2979)
   * Synchronizes rotation of all child meshes with parent
   */
  rotateChildMeshes() {
    for (const index in this.childMeshes) {
      this.childMeshes[index].rotation.y = this.rotation.y;
    }
  }

  /**
   * Get center point including linked items (extracted from bundle line 2496)
   * @returns {THREE.Vector3} Average center of item and all linked items
   */
  getCenterWithLinkedItems() {
    const positions = [];
    positions.push(new THREE.Vector3().copy(this.position));

    this.linkedItems.forEach(item => {
      positions.push(item.position);
    });

    // Average all positions
    const center = new THREE.Vector3();
    positions.forEach(pos => {
      center.add(pos);
    });
    center.multiplyScalar(1 / positions.length);

    return center;
  }

  /**
   * Set absolute rotation angle (extracted from bundle lines 3001-3004)
   * @param {number} angle - Rotation angle in radians
   */
  rotateByAngle(angle) {
    this.rotation.y = angle;
    this.rotateChildMeshes();
    if (this.dimensionHelper) {
      this.dimensionHelper.setRotation(angle);
    }
  }

  /**
   * Rotate linked items around a center point (extracted from bundle line 2523)
   * @param {number} angle - Rotation delta in radians
   * @param {THREE.Vector3} center - Center point to rotate around
   */
  rotateLinkedItems(angle, center) {
    const actualCenter = center || this.getCenterWithLinkedItems();

    this.linkedItems.forEach(item => {
      // Rotate item by angle
      item.rotateByAngle(item.rotation.y + angle);

      // Create rotation matrix
      const rotationMatrix = new THREE.Matrix4();
      rotationMatrix.makeRotationY(angle);

      // Calculate offset from center
      const offset = new THREE.Vector3().copy(item.position).sub(actualCenter);
      const originalOffset = new THREE.Vector3().copy(offset);

      // Apply rotation to offset
      offset.applyMatrix4(rotationMatrix);

      // Calculate position delta
      const delta = offset.sub(originalOffset);

      // Move item by delta
      item.relativeMove(delta.x, delta.z);
    });
  }

  /**
   * Interactive rotation with snap-to-angle (extracted from bundle lines 2981-2997)
   * @param {Object} event - Mouse event with point property
   * @param {number} angle - Optional explicit angle (if not provided, calculated from mouse position)
   */
  rotate(event, angle) {
    if (!event) return;

    const center = this.getCenterWithLinkedItems();
    const currentRotation = this.rotation.y;

    // Calculate angle from mouse position if not provided
    if (isNaN(angle)) {
      // Import Utils for angle calculation
      const Utils = require('../Utils').default;
      angle = Utils.angle(0, 1, event.point.x - center.x, event.point.z - center.z);
    }

    // Snap to 90° increments (within PI/16 tolerance)
    const snapTolerance = Math.PI / 16;
    for (let i = -4; i <= 4; i++) {
      if (Math.abs(angle - i * (Math.PI / 2)) < snapTolerance) {
        angle = i * (Math.PI / 2);
        break;
      }
    }

    const rotationDelta = angle - currentRotation;
    this.rotation.y = angle;

    if (this.dimensionHelper) {
      this.dimensionHelper.setRotation(angle);
    }

    // Apply rotation matrix to adjust position
    const rotationMatrix = new THREE.Matrix4();
    rotationMatrix.makeRotationY(rotationDelta);

    const offset = new THREE.Vector3().copy(this.position).sub(center);
    const originalOffset = new THREE.Vector3().copy(offset);
    offset.applyMatrix4(rotationMatrix);
    const delta = offset.sub(originalOffset);

    this.relativeMove(delta.x, delta.z);
    this.rotateChildMeshes();
    this.rotateLinkedItems(rotationDelta, center);
    this.changed();

    if (this.groupParent && this.groupParent.isSet) {
      this.groupParent.update();
    }
  }

  /**
   * Set rotation Y angle (extracted from bundle line 2522)
   * @param {number} angle - Rotation angle in radians
   */
  setRotationY(angle) {
    this.rotateByAngle(angle);
    this.changed();
  }

  /**
   * Get item height (extracted from bundle line 2516)
   * @returns {number} Item height
   */
  getHeight() {
    return 2 * this.halfSize.y;
  }

  /**
   * Get item width (extracted from bundle line 2518)
   * @returns {number} Item width
   */
  getWidth() {
    return 2 * this.halfSize.x;
  }

  /**
   * Get item depth (extracted from bundle line 2520)
   * @returns {number} Item depth
   */
  getDepth() {
    return 2 * this.halfSize.z;
  }

  /**
   * Show dimension helper/gizmo (extracted from bundle line 2759)
   */
  showDimensionHelper() {
    if (this.dimensionHelper) {
      this.dimensionHelper.visible = true;
    }
  }

  /**
   * Hide dimension helper/gizmo (extracted from bundle line 2764)
   */
  hideDimensionHelper() {
    if (this.dimensionHelper) {
      this.dimensionHelper.visible = false;
    }
  }

  /**
   * Set item as selected (extracted from bundle line 2957)
   */
  setSelected() {
    this.selected = true;
    this.updateHighlight();
  }

  /**
   * Set item as unselected (extracted from bundle line 2962)
   */
  setUnselected() {
    this.selected = false;
    this.updateHighlight();
  }

  /**
   * Update highlight state for outline effect (extracted from bundle lines 2923-2943)
   * Dispatches BP3D_EVENT_HIGHLIGHT_CHANGED event with meshes to highlight
   */
  updateHighlight() {
    const shouldHighlight = this.hover || this.selected;
    const meshesToHighlight = [];
    const allMeshes = [];

    // Collect meshes from this item
    allMeshes.push(...this.childMeshes);

    // Collect meshes from linked items
    this.linkedItems.forEach(item => {
      allMeshes.push(...item.childMeshes);
    });

    // Collect meshes from group parent
    if (this.groupParent) {
      allMeshes.push(...this.groupParent.childMeshes);
    }

    // Filter out excluded meshes (handles, helpers, etc.)
    const excludedNames = ['handle', 'helper', 'gizmo'];
    allMeshes.forEach(mesh => {
      let excluded = false;
      excludedNames.forEach(name => {
        if (mesh.name.toLowerCase().includes(name)) {
          excluded = true;
        }
      });
      if (!excluded) {
        meshesToHighlight.push(mesh);
      }
    });

    // Dispatch highlight event
    if (shouldHighlight) {
      document.dispatchEvent(
        new CustomEvent('bp3d_highlight_changed', {
          detail: {
            objects: meshesToHighlight,
          },
        })
      );
    } else {
      document.dispatchEvent(
        new CustomEvent('bp3d_highlight_changed', {
          detail: {
            objects: [],
          },
        })
      );
    }
  }

  /**
   * Mouse over handler (extracted from bundle line 2946)
   */
  mouseOver() {
    this.hover = true;
    this.updateHighlight();
  }

  /**
   * Mouse off handler (extracted from bundle line 2951)
   */
  mouseOff() {
    this.hover = false;
    this.updateHighlight();
  }

  /**
   * Handle mouse down on item (extracted from bundle line 2967)
   * Stores drag offset for smooth dragging
   * @param {Object} event - Mouse event with point property
   */
  clickPressed(event) {
    if (event && event.point) {
      this.dragOffset.copy(event.point).sub(this.position);
    }
  }

  /**
   * Handle mouse drag on item (extracted from bundle line 2971)
   * Moves item to follow mouse during drag
   * @param {Object} event - Mouse event with point property
   */
  clickDragged(event) {
    if (event && event.point) {
      this.moveToPosition(event.point, event);
    }
  }

  /**
   * Add linked item to group (extracted from bundle line 2467)
   * @param {BaseItem} item - Item to link
   */
  addLinkedItem(item) {
    // Don't link to self
    if (item === this) return;

    // Remove from any existing group
    if (!this.removeLinkedItem(item)) {
      // Set group parent and select
      item.groupParent = this;
      item.setSelected();
      this.linkedItems.push(item);

      // Dispatch linked items changed event
      document.dispatchEvent(new CustomEvent('bp3d_linked_items_changed', {}));
    }
  }

  /**
   * Remove linked item from group (extracted from bundle line 2469)
   * @param {BaseItem} item - Item to unlink
   * @returns {boolean} True if item was found and removed
   */
  removeLinkedItem(item) {
    let index = -1;

    // Find item index
    for (let i = 0; i < this.linkedItems.length; i++) {
      if (this.linkedItems[i] === item) {
        index = i;
        break;
      }
    }

    // Remove if found
    if (index >= 0) {
      item.groupParent = null;
      item.setUnselected();
      this.linkedItems.splice(index, 1);
      return true;
    }

    // Dispatch event even if not found
    document.dispatchEvent(new CustomEvent('bp3d_linked_items_changed', {}));
    return false;
  }

  /**
   * Check if mesh is linked (extracted from bundle line 2488)
   * @param {BaseItem} item - Item to check
   * @returns {boolean} True if item is linked
   */
  checkIsLinkedMesh(item) {
    let isLinked = false;
    this.linkedItems.forEach(linkedItem => {
      if (item === linkedItem) {
        isLinked = true;
      }
    });
    return isLinked;
  }

  /**
   * Clear all linked items (extracted from bundle line 2492)
   */
  clearLinkedItems() {
    // Unset group parent and deselect all linked items
    this.linkedItems.forEach(item => {
      item.groupParent = null;
      item.setUnselected();
    });

    // Clear array
    this.linkedItems = [];

    // Dispatch event
    document.dispatchEvent(new CustomEvent('bp3d_linked_items_changed', {}));
  }

  /**
   * Show error glow effect (extracted from bundle line 3073)
   * Visual feedback for invalid operations (collisions, etc.)
   * @param {THREE.Vector3} position - Optional position for error glow
   */
  showError(position) {
    const pos = position || this.position;

    if (!this.error) {
      this.error = true;

      // Create error glow if needed
      if (!this.errorGlow) {
        // Simplified glow: red semi-transparent mesh overlay
        const material = new THREE.MeshBasicMaterial({
          color: this.errorColor,
          blending: THREE.AdditiveBlending,
          opacity: 0.8,
          transparent: true,
          depthTest: false,
        });

        this.errorGlow = new THREE.Group();

        // Clone child meshes for glow effect
        this.children.forEach(child => {
          if (child.geometry) {
            const glowMesh = new THREE.Mesh(child.geometry.clone(), material);
            glowMesh.position.copy(child.position);
            glowMesh.rotation.copy(child.rotation);
            glowMesh.scale.copy(child.scale);
            this.errorGlow.add(glowMesh);
          }
        });

        this.scene.add(this.errorGlow);
      }

      this.errorGlow.position.copy(pos);
    }
  }

  /**
   * Hide error glow effect (extracted from bundle line 3078)
   */
  hideError() {
    if (this.error) {
      this.error = false;
      if (this.errorGlow) {
        this.scene.remove(this.errorGlow);
      }
    }
  }

  /**
   * Set absolute position (extracted from bundle line 2532)
   * @param {THREE.Vector3} position - New position
   */
  setPosition(position) {
    const oldPosition = new THREE.Vector3().copy(this.position);
    this.position.copy(position);

    if (this.dimensionHelper) {
      this.dimensionHelper.position.copy(position);
    }

    // Calculate delta for linked items
    const delta = position.clone().sub(oldPosition);
    this.moveChildMeshes();
    this.moveLinkedItems(delta);
    this.changed();
  }

  /**
   * Move linked items by delta (extracted from bundle line 2538)
   * @param {THREE.Vector3} delta - Movement delta
   */
  moveLinkedItems(delta) {
    this.linkedItems.forEach(item => {
      item.relativeMove(delta.x, delta.z);
    });
  }

  /**
   * Get snap points for item (extracted from bundle line 2541)
   * @param {boolean} flatten - If true, return flattened array of all points
   * @returns {Array} Array of snap points or hull points collection
   */
  getSnapPoints(flatten = false) {
    if (flatten) {
      const points = [];
      this.hullPointsCollection.forEach(hull => {
        points.push(...hull);
      });
      return points;
    }
    return this.hullPointsCollection;
  }

  /**
   * Validate if position is valid for item placement - FULL IMPLEMENTATION
   * Extracted from bundle lines 3189-3191
   * Checks room boundaries, snap-to-grid, and collision detection
   * @param {THREE.Vector3} position - Position to validate
   * @returns {string} Validation result: 'valid', 'overlap', or 'outofbounds'
   */
  isValidPosition(position) {
    // Get item corners at proposed position
    const corners = this.getCorners('x', 'z', position);
    const items = this.model.scene.items;
    const rooms = this.model.floorplan.getRooms();

    // Check if position is inside any room
    let insideRoom = false;
    for (let i = 0; i < rooms.length; i++) {
      const room = rooms[i];
      // Check if center point is inside room AND corners don't intersect room boundary
      if (Utils.pointInPolygon(position.x, position.z, room.interiorCorners) &&
          !Utils.polygonPolygonIntersect(corners, room.interiorCorners)) {
        insideRoom = true;
        break;
      }
    }

    // If not inside any room, return outofbounds
    if (!insideRoom) {
      return 'outofbounds';
    }

    // If inside room, apply snap-to-grid if enabled
    const Configuration = require('./Configuration').default;
    if (Configuration.getBooleanValue('snap')) {
      this.getSnapPosition(position);
    }

    // Check for overlaps if item is not overlappable
    if (this.overlappable) {
      return 'valid';
    } else {
      return this.isOverlapped(items, corners);
    }
  }

  /**
   * Get list of meshes used for collision detection (extracted from bundle line 2451)
   * Filters out handles, helpers, and other non-collidable meshes
   * @returns {Array<THREE.Mesh>} Array of collidable meshes
   */
  getCollidableMeshList() {
    const meshes = [];
    const excludedNames = ['handle', 'helper', 'gizmo'];

    this.children.forEach(child => {
      let excluded = false;
      excludedNames.forEach(name => {
        if (child.name.toLowerCase().includes(name)) {
          excluded = true;
        }
      });
      if (!excluded) {
        meshes.push(child);
      }
    });

    return meshes;
  }

  /**
   * Get items this can stack on (extracted from bundle line 3140)
   * @returns {Array} Array of items that can be stacked on
   */
  getBottomObjectsForStack() {
    const stackableItems = [];
    if (this.model && this.model.scene) {
      this.model.scene.items.forEach(item => {
        if (item.stackontop) {
          stackableItems.push(item);
        }
      });
    }
    return stackableItems;
  }

  /**
   * Get Y position for stacking on other items (extracted from bundle line 3145)
   * @param {THREE.Vector3} position - Position to check stacking at
   * @returns {number} Y coordinate to stack at
   */
  getStackingPosition(position) {
    let maxY = 0;
    const corners = this.getCorners('x', 'z', position);
    const items = this.model.scene.items;

    items.forEach(item => {
      if (item !== this && item.obstructFloorMoves) {
        if (item.stackontop &&
            (!Utils.polygonOutsidePolygon(corners, item.getCorners('x', 'z')) ||
             Utils.polygonPolygonIntersect(corners, item.getCorners('x', 'z')))) {
          const itemMaxY = item.getBounding().max.y;
          if (itemMaxY > maxY) {
            maxY = itemMaxY;
          }
        }
      }
    });

    return maxY + 0;
  }

  /**
   * Apply snap-to-grid positioning (extracted from bundle line 3161)
   * Snaps item position to nearby item edges/corners
   * @param {THREE.Vector3} position - Position to snap (modified in place)
   */
  getSnapPosition(position) {
    const snapTolerance = 0.3; // 30cm snap distance
    const corners = this.getCorners('x', 'z', position);
    let deltaX = Infinity;
    let deltaZ = Infinity;

    const minX = corners[0].x;
    const maxX = corners[1].x;
    const minZ = corners[0].y;
    const maxZ = corners[2].y;

    const items = this.model.scene.items;

    for (let i = 0; i < items.length; i++) {
      if (items[i] !== this && items[i].obstructFloorMoves && !this.checkIsLinkedMesh(items[i])) {
        const snapPoints = items[i].getSnapPoints(true);

        snapPoints.forEach(point => {
          // Snap to X coordinates
          if (Math.abs(minX - point.x) < snapTolerance && Math.abs(minX - point.x) < Math.abs(deltaX)) {
            deltaX = point.x - minX;
            deltaX -= (deltaX / Math.abs(deltaX)) * 0;
          }
          if (Math.abs(maxX - point.x) < snapTolerance && Math.abs(maxX - point.x) < Math.abs(deltaX)) {
            deltaX = point.x - maxX;
            deltaX -= (deltaX / Math.abs(deltaX)) * 0;
          }

          // Snap to Z coordinates
          if (Math.abs(minZ - point.y) < snapTolerance && Math.abs(minZ - point.y) < Math.abs(deltaZ)) {
            deltaZ = point.y - minZ;
            deltaZ -= (deltaZ / Math.abs(deltaZ)) * 0;
          }
          if (Math.abs(maxZ - point.y) < snapTolerance && Math.abs(maxZ - point.y) < Math.abs(deltaZ)) {
            deltaZ = point.y - maxZ;
            deltaZ -= (deltaZ / Math.abs(deltaZ)) * 0;
          }
        });
      }
    }

    // Apply snap offsets
    if (deltaX !== Infinity) {
      position.x += deltaX;
    }
    if (deltaZ !== Infinity) {
      position.z += deltaZ;
    }
  }

  /**
   * Check if item overlaps with other items (extracted from bundle line 3180)
   * @param {Array} items - Items to check against (defaults to scene items)
   * @param {Array} corners - Item corners (defaults to current corners)
   * @returns {string} 'overlap' if overlapping, 'valid' otherwise
   */
  isOverlapped(items = [], corners = null) {
    const checkCorners = corners || this.getCorners('x', 'z');
    const allItems = items.length > 0 ? items : (this.model.scene ? this.model.scene.items : []);
    const thisBounding = this.getBounding();

    for (let i = 0; i < allItems.length; i++) {
      const item = allItems[i];

      // Skip self, non-obstructing items, linked items, and sets
      if (item !== this && item.obstructFloorMoves && !this.checkIsLinkedMesh(item) && item.isSet !== true) {
        const itemBounding = item.getBounding();

        // Check Y overlap (height)
        if (!(itemBounding.min.y >= thisBounding.max.y) && !(thisBounding.min.y >= itemBounding.max.y)) {
          // Check XZ overlap (floor plan)
          const itemCorners = item.getCorners('x', 'z');
          if (Utils.polygonPolygonIntersect(checkCorners, itemCorners)) {
            return 'overlap';
          }
        }
      }
    }

    return 'valid';
  }

  /**
   * Move item relatively (extracted from bundle lines 3019-3025)
   * @param {number} dx - X offset
   * @param {number} dz - Z offset
   */
  relativeMove(dx, dz) {
    if (this.fixed) return;

    const newPosition = new THREE.Vector3().copy(this.position);
    newPosition.x += dx;
    newPosition.z += dz;

    this.position.copy(newPosition);
    this.moveChildMeshes();

    if (this.dimensionHelper) {
      this.dimensionHelper.position.copy(newPosition);
    }
  }

  /**
   * Place item in room with collision detection
   * Stub implementation - full version in production bundle lines 2915, 3195
   */
  placeInRoom() {
    // Simplified version - just ensure item is positioned
    // Full implementation would handle room boundaries and collision detection
    if (!this.position_set) {
      this.position.set(0, 0, 0);
    }
  }

  /**
   * Set morph target value (dimension changes) - FULL IMPLEMENTATION
   * Extracted from bundle line 2811
   * @param {number|string} index - Morph target index (0=height, 1=width, 2=depth)
   * @param {number} value - Morph value (0-1)
   */
  setMorph(index, value) {
    this.morph[index] = value;

    try {
      // Recalculate bounding box after morph
      const bounds = this.getBounding();
      const size = bounds.max.clone().sub(bounds.min);

      // Apply morph influences to all child meshes
      this.children.forEach(child => {
        try {
          if (Array.isArray(child.morphTargetInfluences) && child.morphTargetInfluences.length > index) {
            // Apply morph influence with normalization
            // The Fe function in bundle normalizes the morph value based on mesh properties
            child.morphTargetInfluences[index] = this.normalizeMorphInfluence(child, 0, value);
          }
        } catch (error) {
          console.error('Error applying morph to child:', error);
        }
      });

      // Update block duplicates based on morph changes
      if (index === 0 && this.metadata.blockMorphIndex === 0) {
        // Height morph - update vertical blocks
        const targetHeight = this.calculateMorphTargetValue(index, value);
        this.updateBlocksByHeight(targetHeight);
      }

      if (index === 1 && this.metadata.horizontalBlockMorphIndex === 1) {
        // Width morph - update horizontal blocks
        const targetWidth = this.calculateMorphTargetValue(index, value);
        this.updateBlocksByWidth(targetWidth);
      }

      // Update UV coordinates for morphed geometry
      this.updateUV();

      // Recalculate collision hull
      this.calculateHullPointsCollection();

      // Update dimension helper
      if (this.dimensionHelper && this.dimensionHelper.update) {
        this.dimensionHelper.update();
      }

      // Notify scene of change
      this.changed();
    } catch (error) {
      console.error('Error in setMorph:', error);
    }
  }

  /**
   * Normalize morph influence value (helper for setMorph)
   * Extracted from bundle lines 2217-2224 (function Fe)
   * Handles mesh-specific minimum value constraints
   * @param {THREE.Mesh} mesh - Mesh to normalize for
   * @param {number} baseValue - Base value (usually 0)
   * @param {number} morphValue - Morph value (0-1)
   * @returns {number} Normalized influence
   */
  normalizeMorphInfluence(mesh, baseValue, morphValue) {
    // Check for minimum value constraint in mesh name
    // Format: (min<value>) e.g., (min50) means minimum 50 inches
    const minMatch = /\(min(\d+)\)/g.exec(mesh.name);
    if (minMatch && minMatch[1]) {
      const minValue = parseInt(minMatch[1]);
      // Normalize: (5 + 295 * morphValue - minValue) / (300 - minValue)
      // This adjusts the morph range based on the mesh's minimum constraint
      morphValue = (5 + 295 * morphValue - minValue) / (300 - minValue);
    }
    return morphValue;
  }

  /**
   * Calculate actual dimension value from normalized morph value
   * Converts 0-1 morph value to actual dimension (e.g., 5-300 inches)
   * @param {number} index - Morph index
   * @param {number} normalizedValue - Normalized value (0-1)
   * @returns {number} Actual dimension value
   */
  calculateMorphTargetValue(index, normalizedValue) {
    // Default range: 5 to 300 units (from bundle: (value - 5) / 295)
    const minValue = 5;
    const maxValue = 300;
    return minValue + (normalizedValue * (maxValue - minValue));
  }

  /**
   * Update material/texture on specific mesh parts (extracted from bundle lines 2550-2598)
   * Loads textures and applies them to matching meshes
   * @param {string} name - Mesh name to target
   * @param {Object} material - Material configuration { texture, color }
   * @param {Object} size - Texture size for UV repeat { w, h }
   * @param {Function} callback - Optional callback when complete
   */
  /**
   * Calculate texture brightness (extracted from bundle lines 2393-2418)
   * Used for glass materials to set roughness/metalness based on texture
   * @param {string} textureUrl - URL of texture to analyze
   * @returns {Promise<number>} Brightness value (0-1, normalized red channel at center pixel)
   */
  async calculateTextureBrightness(textureUrl) {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      canvas.width = 100;
      canvas.height = 100;
      const ctx = canvas.getContext('2d');
      const img = new Image();
      img.src = textureUrl;
      img.onload = function() {
        ctx.drawImage(img, 0, 0, 100, 100);
        const pixelData = ctx.getImageData(50, 50, 1, 1).data;
        resolve(pixelData[0] / 255); // Red channel normalized to 0-1
      };
    });
  }

  async updateMaterial(name, material, size = { w: 0.5, h: 0.5 }, callback = null) {
    console.log(`🖼️ updateMaterial called for "${name}"`, { material, size });

    // Store texture configuration
    this.textures[name] = { material, size };

    // Apply to linked items
    this.linkedItems.forEach((item) => {
      if (item.updateMaterial) {
        item.updateMaterial(name, material, size, callback);
      }
    });

    // Apply to all matching meshes in this item
    const textureLoader = new THREE.TextureLoader();

    this.traverse(async (mesh) => {
      if (!mesh.isMesh) return;
      if (!mesh.name.toLowerCase().includes(name.toLowerCase())) return;

      // Clone material for independent modification
      const clonedMaterial = mesh.material.clone();
      clonedMaterial.map = null;

      // Load and apply texture if provided
      if (material.texture) {
        const texture = textureLoader.load(material.texture);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(1 / size.w, 1 / size.h);

        // Special handling for glass materials (from bundle lines 2575-2582)
        if (mesh.name.includes('glass')) {
          // Calculate texture brightness for glass materials
          const brightness = await this.calculateTextureBrightness(material.texture);
          clonedMaterial.roughness = brightness;
          clonedMaterial.metalness = brightness;
        } else {
          // Set color and texture for regular materials
          clonedMaterial.color.setHex(material.color ? material.color : 0xFFFFFF);
          clonedMaterial.map = texture;
        }

        // Execute callback if provided
        if (typeof callback === 'function') {
          callback();
        }
      }

      mesh.material = clonedMaterial;
    });
  }

  /**
   * Update style (show/hide mesh parts by name) (extracted from bundle lines 2599-2612)
   * @param {string} name - Style name to target (comma-separated list to hide)
   * @param {string} value - Style value (comma-separated list to show)
   * @param {Function} callback - Optional callback when complete
   */
  updateStyle(name, value, callback = null) {
    this.styles[name] = value;

    // Apply to linked items
    this.linkedItems.forEach((item) => {
      if (item.updateStyle) {
        item.updateStyle(name, value, callback);
      }
    });

    // Show/hide meshes based on name matching
    this.traverse((mesh) => {
      // Special case: don't hide lock meshes that include "block"
      if (name === 'lock' && mesh.name.includes('block')) return;

      try {
        // Hide meshes matching names in the 'name' list
        name.split(',').forEach((nameToHide) => {
          if (nameToHide.length && mesh.name.toLowerCase().includes(nameToHide.toLowerCase())) {
            mesh.visible = false;
          }
        });

        // Show meshes matching names in the 'value' list
        value.split(',').forEach((nameToShow) => {
          if (nameToShow.length && mesh.name.toLowerCase().includes(nameToShow.toLowerCase())) {
            mesh.visible = true;
          }
        });
      } catch (error) {
        console.log(error);
      }
    });

    // Execute callback if provided
    if (typeof callback === 'function') {
      callback();
    }
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

  /**
   * Get current item options (extracted from bundle lines 2431-2440)
   * @returns {Object} Current options configuration
   */
  getOptions() {
    return {
      morph: this.morph,
      textures: this.textures,
      styles: this.styles,
      fixed: this.fixed,
      stackable: this.stackable,
      stackontop: this.stackontop,
      overlappable: this.overlappable
    };
  }

  getSnapPoints() {
    // Return empty array for now
    return [];
  }

  /**
   * Get corner positions for collision detection (extracted from bundle lines 3037-3056)
   * @param {*} ignoreRotation - Unused parameter (kept for API compatibility)
   * @param {*} ignoreOffset - Unused parameter (kept for API compatibility)
   * @param {THREE.Vector3} position - Override position (defaults to this.position)
   * @returns {Array} Array of corner points {x, y}
   */
  getCorners(ignoreRotation, ignoreOffset, position) {
    position = position || this.position;

    const halfSize = this.halfSize.clone();

    // Calculate four corners in local space
    const corner1 = new THREE.Vector3(-halfSize.x, 0, -halfSize.z);
    const corner2 = new THREE.Vector3(halfSize.x, 0, -halfSize.z);
    const corner3 = new THREE.Vector3(halfSize.x, 0, halfSize.z);
    const corner4 = new THREE.Vector3(-halfSize.x, 0, halfSize.z);

    // Apply rotation
    const rotationMatrix = new THREE.Matrix4();
    rotationMatrix.makeRotationY(this.rotation.y);

    corner1.applyMatrix4(rotationMatrix);
    corner2.applyMatrix4(rotationMatrix);
    corner3.applyMatrix4(rotationMatrix);
    corner4.applyMatrix4(rotationMatrix);

    // Apply position offset
    corner1.add(position);
    corner2.add(position);
    corner3.add(position);
    corner4.add(position);

    // Apply center offset if exists
    const centerOffset = this.centerOffset.clone();
    centerOffset.applyMatrix4(rotationMatrix);
    corner1.add(centerOffset);
    corner2.add(centerOffset);
    corner3.add(centerOffset);
    corner4.add(centerOffset);

    // Return as 2D points (x, z becomes x, y for 2D floorplan)
    return [
      { x: corner1.x, y: corner1.z },
      { x: corner2.x, y: corner2.z },
      { x: corner3.x, y: corner3.z },
      { x: corner4.x, y: corner4.z }
    ];
  }

  /**
   * EXTRACTED FROM PRODUCTION BUNDLE (lines 2900-2920)
   * Lock/unlock item in place
   */
  setFixed(locked) {
    this.fixed = locked;
  }

  /**
   * EXTRACTED FROM PRODUCTION BUNDLE (lines 2507-2520)
   * Set whether item can be stacked on other items
   */
  setStackable(stackable) {
    this.stackable = stackable;
    return this;
  }

  /**
   * EXTRACTED FROM PRODUCTION BUNDLE (lines 2507-2520)
   * Set whether item can overlap with other items
   */
  setOverlappable(overlappable) {
    this.overlappable = overlappable;
    return this;
  }

  /**
   * EXTRACTED FROM PRODUCTION BUNDLE (lines 2507-2520)
   * Set morph alignment setting
   */
  setMorphAlign(align) {
    this.morphAlign = align;
    return this;
  }

  /**
   * EXTRACTED FROM PRODUCTION BUNDLE (lines 2507-2520)
   * Flip item horizontally (mirror along Y axis)
   */
  flipHorizontal() {
    // Flip the scale along X axis
    this.scale.x *= -1;
    // Update world matrix after scale change
    this.updateMatrixWorld(true);
  }

  /**
   * EXTRACTED FROM PRODUCTION BUNDLE - Phase 2A Priority 1
   * **ENHANCED Phase 2A Priority 2: Added collision detection**
   * **ENHANCED Phase 2B Priority 3: Added error visual feedback**
   * Move item to exact 3D coordinates with validation and visual feedback
   * @param {THREE.Vector3} position - Target position
   * @param {Object} event - Optional event data
   */
  moveToPosition(position, event) {
    if (isNaN(position.x) || isNaN(position.y) || isNaN(position.z)) {
      console.log('⚠️ NaN detected in moveToPosition');
      return;
    }

    // Validate position (inside room, no collision)
    const isValid = this.isValidPosition(position);

    if (!isValid) {
      // **Phase 2B Priority 3: Show error indicator (red highlight)**
      this.error = true;
      this.updateHighlight();

      // Clear error after 500ms
      setTimeout(() => {
        this.error = false;
        this.updateHighlight();
      }, 500);

      console.log('⚠️ Invalid position - outside room or collision detected');
      return;
    }

    // Position is valid - clear any error state and move item
    this.error = false;
    this.setPosition(position);
    this.changed();
  }

  /**
   * EXTRACTED FROM PRODUCTION BUNDLE - Phase 2A Priority 1
   * Set item position directly
   * @param {THREE.Vector3} position - New position
   */
  setPosition(position) {
    this.position.copy(position);
    this.moveChildMeshes();
    if (this.dimensionHelper && this.dimensionHelper.position) {
      this.dimensionHelper.position.copy(position);
    }
  }

  /**
   * EXTRACTED FROM PRODUCTION BUNDLE - Phase 2A Priority 1
   * Set item rotation angle
   * @param {number} angle - Rotation angle in radians (Y-axis)
   */
  setRotation(angle) {
    this.rotation.y = angle;
    this.rotateChildMeshes();
    if (this.dimensionHelper && this.dimensionHelper.rotation) {
      this.dimensionHelper.rotation.y = angle;
    }
  }

  /**
   * EXTRACTED FROM PRODUCTION BUNDLE - Phase 2A Priority 1
   * Mark item as selected and update highlighting
   */
  setSelected() {
    this.selected = true;
    this.updateHighlight();
  }

  /**
   * EXTRACTED FROM PRODUCTION BUNDLE - Phase 2A Priority 1
   * Mark item as unselected and clear highlighting
   */
  setUnselected() {
    this.selected = false;
    this.updateHighlight();
  }

  /**
   * EXTRACTED FROM PRODUCTION BUNDLE - Phase 2A Priority 1
   * **ENHANCED Phase 2B Priority 3: Added error state (red highlighting)**
   * Update visual highlighting: Blue = selected/hover, Red = error
   * Will be integrated with OutlinePass in Phase 2D
   */
  updateHighlight() {
    if (!this.childMeshes) return;

    // List of mesh names to exclude from highlighting (glass, transparent parts)
    const excludedNames = ['glass', 'transparent', 'handles'];

    // **Phase 2B Priority 3: Determine highlight state and color**
    let highlightColor = null;
    let highlightIntensity = 0;

    if (this.error) {
      // Red error highlight (invalid move)
      highlightColor = 0xff0000;
      highlightIntensity = 0.5;
    } else if (this.hover || this.selected) {
      // Blue selection/hover highlight
      highlightColor = 0x0000ff;
      highlightIntensity = 0.3;
    }

    this.childMeshes.forEach(mesh => {
      if (!mesh || !mesh.material) return;

      // Check if mesh should be excluded from highlighting
      let shouldExclude = false;
      excludedNames.forEach(excluded => {
        if (mesh.name && mesh.name.toLowerCase().includes(excluded)) {
          shouldExclude = true;
        }
      });

      if (!shouldExclude) {
        // Store original emissive if not already stored
        if (!mesh.userData.originalEmissive && mesh.material.emissive) {
          mesh.userData.originalEmissive = mesh.material.emissive.clone();
        }

        if (highlightColor !== null) {
          // Add colored emissive glow
          if (mesh.material.emissive) {
            mesh.material.emissive.setHex(highlightColor);
            mesh.material.emissiveIntensity = highlightIntensity;
          }
        } else {
          // Restore original emissive
          if (mesh.userData.originalEmissive && mesh.material.emissive) {
            mesh.material.emissive.copy(mesh.userData.originalEmissive);
            mesh.material.emissiveIntensity = 0;
          }
        }
      }
    });

    // Also handle linked items (for Sets/Groups)
    if (this.linkedItems && Array.isArray(this.linkedItems)) {
      this.linkedItems.forEach(linkedItem => {
        if (linkedItem && linkedItem.childMeshes) {
          linkedItem.childMeshes.forEach(mesh => {
            if (mesh && mesh.material && mesh.material.emissive) {
              if (highlightColor !== null) {
                mesh.material.emissive.setHex(highlightColor);
                mesh.material.emissiveIntensity = highlightIntensity;
              } else if (mesh.userData.originalEmissive) {
                mesh.material.emissive.copy(mesh.userData.originalEmissive);
                mesh.material.emissiveIntensity = 0;
              }
            }
          });
        }
      });
    }
  }

  /**
   * EXTRACTED FROM PRODUCTION BUNDLE - Phase 2A Priority 1
   * Get center point of item
   * @returns {THREE.Vector3} Center point
   */
  getCenter() {
    return this.getDimensions(true);
  }

  /**
   * EXTRACTED FROM PRODUCTION BUNDLE - Phase 2A Priority 1
   * Calculate bounding dimensions or center point from corners
   * @param {boolean} returnCenter - If true, return center point; if false, return size
   * @returns {THREE.Vector3} Either center point or size (width, 0, depth)
   */
  getDimensions(returnCenter = false) {
    if (!this.corners || this.corners.length === 0) {
      return new THREE.Vector3();
    }

    let minX = Infinity;
    let maxX = -Infinity;
    let minZ = Infinity;
    let maxZ = -Infinity;

    this.corners.forEach(corner => {
      if (corner.x < minX) minX = corner.x;
      if (corner.x > maxX) maxX = corner.x;
      if (corner.z < minZ) minZ = corner.z;
      if (corner.z > maxZ) maxZ = corner.z;
    });

    // Check for invalid bounds
    if (minX === Infinity || maxX === -Infinity || minZ === Infinity || maxZ === -Infinity) {
      return new THREE.Vector3();
    }

    if (returnCenter) {
      // Return center point
      return new THREE.Vector3(
        0.5 * (minX + maxX),
        0,
        0.5 * (minZ + maxZ)
      );
    } else {
      // Return size (width, 0, depth)
      return new THREE.Vector3(
        maxX - minX,
        0,
        maxZ - minZ
      );
    }
  }

  /**
   * **PHASE 2A Priority 2: Collision Detection**
   * Get item corner points for collision detection
   * @param {string} xKey - Key for X coordinate ('x')
   * @param {string} yKey - Key for Y/Z coordinate ('y' or 'z')
   * @param {THREE.Vector3} position - Optional position override (default: this.position)
   * @returns {Array<{x: number, y: number}>} Array of corner points
   */
  getCorners(xKey = 'x', yKey = 'z', position = null) {
    const pos = position || this.position;

    if (!this.corners || this.corners.length === 0) {
      // No corners available, return position as single point
      return [{ x: pos[xKey], y: pos[yKey] }];
    }

    // Return corners with specified coordinate keys
    return this.corners.map(corner => ({
      x: corner[xKey],
      y: corner[yKey]
    }));
  }

  /**
   * **PHASE 2A Priority 2: Collision Detection**
   * Get 3D bounding box for item
   * @returns {THREE.Box3} Bounding box
   */
  getBounding() {
    const box = new THREE.Box3();

    if (this.childMeshes && this.childMeshes.length > 0) {
      this.childMeshes.forEach(mesh => {
        if (mesh && mesh.geometry) {
          const meshBox = new THREE.Box3().setFromObject(mesh);
          box.union(meshBox);
        }
      });
    } else {
      // No meshes, use position
      box.setFromCenterAndSize(this.position, new THREE.Vector3(0.5, 0.5, 0.5));
    }

    return box;
  }

  /**
   * **PHASE 2A Priority 2: Collision Detection**
   * Get snap points for item (corners and edges)
   * @param {boolean} ignoreSelected - Whether to ignore if item is selected
   * @returns {Array<{x: number, y: number}>} Array of snap points
   */
  getSnapPoints(ignoreSelected = false) {
    if (ignoreSelected && this.selected) {
      return [];
    }

    const corners = this.getCorners('x', 'z');
    const snapPoints = [];

    // Add all corners as snap points
    corners.forEach(corner => {
      snapPoints.push({ x: corner.x, y: corner.y });
    });

    // Add edge midpoints as snap points
    for (let i = 0; i < corners.length; i++) {
      const current = corners[i];
      const next = corners[(i + 1) % corners.length];
      const midpoint = {
        x: (current.x + next.x) / 2,
        y: (current.y + next.y) / 2
      };
      snapPoints.push(midpoint);
    }

    return snapPoints;
  }

  /**
   * **PHASE 2A Priority 2: Collision Detection**
   * Check if item overlaps with other items
   * @param {Array<Item>} items - Array of items to check against (default: all scene items)
   * @param {Array<{x: number, y: number}>} corners - Item corners (default: this.getCorners())
   * @returns {boolean} True if overlapped
   */
  isOverlapped(items = [], corners = null) {
    const itemCorners = corners || this.getCorners('x', 'z');
    const itemBounds = this.getBounding();

    if (!items) {
      items = this.model && this.model.scene ? this.model.scene.items : [];
    }

    for (let i = 0; i < items.length; i++) {
      const otherItem = items[i];

      // Skip self, linked items, and non-obstructing items
      if (
        otherItem === this ||
        !otherItem.obstructFloorMoves ||
        this.checkIsLinkedMesh(otherItem) ||
        otherItem.isSet
      ) {
        continue;
      }

      // Check Y-axis overlap (height)
      const otherBounds = otherItem.getBounding();
      if (otherBounds.min.y >= itemBounds.max.y || itemBounds.min.y >= otherBounds.max.y) {
        continue; // No vertical overlap
      }

      // Check horizontal (XZ plane) overlap using polygon intersection
      const otherCorners = otherItem.getCorners('x', 'z');
      if (Utils.polygonPolygonIntersect(itemCorners, otherCorners)) {
        return true; // Collision detected
      }
    }

    return false; // No collision
  }

  /**
   * **PHASE 2A Priority 2: Collision Detection**
   * Check if position is valid (inside room, no collision)
   * @param {THREE.Vector3} position - Position to validate
   * @returns {boolean} True if valid, false if invalid
   */
  isValidPosition(position) {
    const corners = this.getCorners('x', 'z', position);
    const items = this.model && this.model.scene ? this.model.scene.items : [];
    const rooms = this.model && this.model.floorplan ? this.model.floorplan.getRooms() : [];

    let insideRoom = false;

    // Check if position is inside any room
    for (let i = 0; i < rooms.length; i++) {
      const room = rooms[i];
      if (
        Utils.pointInPolygon(position.x, position.z, room.interiorCorners) &&
        !Utils.polygonPolygonIntersect(corners, room.interiorCorners)
      ) {
        insideRoom = true;
        break;
      }
    }

    if (!insideRoom) {
      return false; // Outside all rooms
    }

    // If overlappable, allow overlaps
    if (this.overlappable) {
      return true;
    }

    // Check for collisions with other items
    return !this.isOverlapped(items, corners);
  }

  /**
   * **PHASE 2A Priority 2: Collision Detection**
   * Calculate snap-to-grid position
   * Snaps item to nearest grid points based on nearby items
   * @param {THREE.Vector3} position - Position to snap (modified in-place)
   */
  getSnapPosition(position) {
    const SNAP_TOLERANCE = 0.25; // 25cm snap tolerance
    const corners = this.getCorners('x', 'z', position);
    const items = this.model && this.model.scene ? this.model.scene.items : [];

    let snapX = Infinity;
    let snapZ = Infinity;

    const minX = corners[0].x;
    const maxX = corners[1].x;
    const minZ = corners[0].y;
    const maxZ = corners[2].y;

    // Find nearest snap points from other items
    for (let i = 0; i < items.length; i++) {
      const otherItem = items[i];

      if (
        otherItem === this ||
        !otherItem.obstructFloorMoves ||
        this.checkIsLinkedMesh(otherItem)
      ) {
        continue;
      }

      const snapPoints = otherItem.getSnapPoints(true);

      snapPoints.forEach(point => {
        // Check X-axis snapping
        if (Math.abs(minX - point.x) < SNAP_TOLERANCE && Math.abs(minX - point.x) < Math.abs(snapX)) {
          snapX = point.x - minX;
        }
        if (Math.abs(maxX - point.x) < SNAP_TOLERANCE && Math.abs(maxX - point.x) < Math.abs(snapX)) {
          snapX = point.x - maxX;
        }

        // Check Z-axis snapping
        if (Math.abs(minZ - point.y) < SNAP_TOLERANCE && Math.abs(minZ - point.y) < Math.abs(snapZ)) {
          snapZ = point.y - minZ;
        }
        if (Math.abs(maxZ - point.y) < SNAP_TOLERANCE && Math.abs(maxZ - point.y) < Math.abs(snapZ)) {
          snapZ = point.y - maxZ;
        }
      });
    }

    // Apply snapping
    if (snapX !== Infinity) {
      position.x += snapX;
    }
    if (snapZ !== Infinity) {
      position.z += snapZ;
    }
  }

  /**
   * Update repeating vertical blocks based on height (extracted from bundle line 2613)
   * Used for modular items with repeating vertical sections (e.g., shelving units)
   * @param {number} height - Target height for the item
   */
  updateBlocksByHeight(height) {
    const BLOCK_DUPLICATE_TAG = '(dup-v)';
    const BLOCK_NAME = '(block)';
    const BLOCK_TOP_NAME = '(block-top)';

    let baseBlock = null;
    let topBlock = null;

    // Find blocks and remove duplicates
    for (let i = this.children.length - 1; i >= 0; i--) {
      const child = this.children[i];
      if (child.name.includes(BLOCK_NAME)) {
        child.visible = true;
      }
      if (child.name.includes(BLOCK_DUPLICATE_TAG)) {
        this.scene.remove(child);
        this.children.splice(i, 1);
      }
      if (child.name.includes(BLOCK_NAME) && !child.name.includes(BLOCK_DUPLICATE_TAG)) {
        baseBlock = child;
      }
      if (child.name.includes(BLOCK_TOP_NAME)) {
        topBlock = child;
      }
    }

    if (!baseBlock) return;

    // Calculate block dimensions
    let topHeight = 0;
    if (topBlock) {
      const excludeList = [topBlock];
      const topBounds = this.getBoundingExcluding(excludeList);
      topHeight = topBounds.max.y - topBounds.min.y;
    }

    const blockList = [baseBlock];
    const blockBounds = this.getBoundingExcluding([baseBlock]);
    const blockHeight = blockBounds.max.y - blockBounds.min.y;
    const blockY = baseBlock.position.y;
    const blockCount = Math.floor((height - topHeight - blockY) / blockHeight) - 1;

    // Create duplicates
    let currentY = blockY;
    for (let i = 0; i < blockCount; i++) {
      const duplicate = new THREE.Mesh().copy(baseBlock);
      duplicate.geometryBackup = baseBlock.geometryBackup;
      duplicate.name += `${BLOCK_DUPLICATE_TAG}${i}`;
      duplicate.position.y = currentY + blockHeight;
      this.add(duplicate);
      currentY = duplicate.position.y;
      blockList.push(duplicate);
    }

    // Hide last block if too tall
    const lastBlock = blockList[blockList.length - 1];
    if (lastBlock.position.y > height - topHeight - 2 * blockHeight) {
      lastBlock.visible = false;
    }
  }

  /**
   * Update repeating horizontal blocks based on width (extracted from bundle line 2637)
   * Used for modular items with repeating horizontal sections (e.g., fence panels)
   * @param {number} width - Target width for the item
   */
  updateBlocksByWidth(width) {
    const BLOCK_DUPLICATE_TAG = '(dup-h)';
    const BLOCK_NAME = '(block-hor)';

    let baseBlock = null;

    // Find blocks and remove duplicates
    for (let i = this.children.length - 1; i >= 0; i--) {
      const child = this.children[i];
      if (child.name.includes(BLOCK_NAME)) {
        child.visible = true;
      }
      if (child.name.includes(BLOCK_DUPLICATE_TAG)) {
        this.scene.remove(child);
        this.children.splice(i, 1);
      }
      if (child.name.includes(BLOCK_NAME) && !child.name.includes(BLOCK_DUPLICATE_TAG)) {
        baseBlock = child;
      }
    }

    if (!baseBlock) return;

    // Parse sizing metadata from block name
    let baseWidth = 0;
    let marginLeft = 0;
    let marginRight = 0;
    let blockCount = 1;
    let actualWidth = 0;

    // Extract base width: (s<width>)
    const widthMatch = /\(s(\d+,?\d*)\)/g.exec(baseBlock.name);
    if (widthMatch && widthMatch[1]) {
      baseWidth = parseFloat(widthMatch[1].replace(',', '.'));
      baseWidth *= 0.0254; // Convert inches to meters
      actualWidth = marginLeft = width / (blockCount = Math.floor(width / baseWidth));
    }

    // Extract margins: (ml<left>,mr<right>)
    const marginMatch = /\(ml(\d+),mr(\d+)\)/g.exec(baseBlock.name);
    if (marginMatch && marginMatch[1] && marginMatch[2]) {
      marginLeft = (2.54 * parseFloat(marginMatch[1])) / 100;
      marginRight = (2.54 * parseFloat(marginMatch[2])) / 100;
    }

    // Extract array sizing: (a<size1>,<size2>,...)
    const arrayMatch = /\(a((?:\d+,)*\d+)\)/g.exec(baseBlock.name);
    if (arrayMatch && arrayMatch[1]) {
      const sizes = arrayMatch[1].split(',');
      for (let idx in sizes) {
        idx = parseInt(idx);
        const size = (2.54 * parseFloat(sizes[idx])) / 100;
        if (width < size && idx === 0) {
          blockCount = 0;
          break;
        }
        if (width >= size && idx === sizes.length - 1) {
          blockCount = sizes.length;
          break;
        }
        if (width >= size && width < (2.54 * parseFloat(sizes[idx + 1])) / 100) {
          blockCount = idx + 1;
          break;
        }
      }
      baseWidth = actualWidth = (width - marginLeft - marginRight) / blockCount;
      blockCount += 2; // Include edge blocks
    }

    // Hide or create blocks
    if (baseWidth === 0 || blockCount < 2) {
      baseBlock.visible = false;
      return;
    }

    baseBlock.visible = true;
    for (let i = 0; i < blockCount - 1; i++) {
      let block;
      if (i === 0) {
        block = baseBlock;
      } else {
        block = new THREE.Mesh().copy(baseBlock);
        block.geometryBackup = baseBlock.geometryBackup;
        block.name += `${BLOCK_DUPLICATE_TAG}${i}`;
        this.add(block);
      }
      block.position.x = -width / 2 + marginLeft + i * actualWidth;
    }
  }

  /**
   * Get bounding box excluding specified meshes
   * Helper for updateBlocksByHeight
   * @param {Array<THREE.Mesh>} excludeList - Meshes to exclude
   * @returns {THREE.Box3} Bounding box
   */
  getBoundingExcluding(excludeList) {
    const box = new THREE.Box3();
    const childrenToInclude = this.children.filter(child => !excludeList.includes(child));

    childrenToInclude.forEach(child => {
      if (child.geometry) {
        child.geometry.computeBoundingBox();
        const childBox = child.geometry.boundingBox.clone();
        childBox.applyMatrix4(child.matrixWorld);
        box.union(childBox);
      }
    });

    return box;
  }

  /**
   * Update UV coordinates based on morph targets (extracted from bundle line 2871)
   * Applies UV morphing for texture adjustments on resizable items
   */
  updateUV() {
    try {
      const morphUVs = this.metadata.morphUVs;
      if (!Array.isArray(morphUVs)) return;

      this.children.forEach(child => {
        if (!child.geometry || !child.geometry.attributes.uv) return;

        const uv = child.geometry.attributes.uv;
        uv.needsUpdate = true;

        // Copy original UV coordinates
        const uvArray = uv.array;
        const originalUV = child.geometryBackup.attributes.uv.array;
        for (let i = 0; i < originalUV.length; i++) {
          uvArray[i] = originalUV[i];
        }

        // Apply morph deltas
        for (const morphKey in this.morph) {
          if (!morphUVs[morphKey]) continue;

          let meshName = child.name;
          // Strip duplicate tags
          if (meshName.includes('(dup-v)')) {
            meshName = meshName.split('(dup-v)')[0];
          }
          if (meshName.includes('(dup-h)')) {
            meshName = meshName.split('(dup-h)')[0];
          }

          const morphUVArray = morphUVs[morphKey][meshName];
          if (!Array.isArray(morphUVArray) || morphUVArray.length !== uvArray.length) {
            continue;
          }

          // Calculate morph influence
          let influence = this.morph[morphKey];
          if (typeof influence === 'undefined') influence = 0;

          // Apply UV morph
          for (let i = 0; i < uvArray.length; i++) {
            uvArray[i] += (morphUVArray[i] - originalUV[i]) * influence;
          }
        }
      });
    } catch (error) {
      console.error('Failed updating UV:', error);
    }
  }

  /**
   * Set item scale (extracted from bundle line 2904)
   * @param {number} x - X scale
   * @param {number} y - Y scale
   * @param {number} z - Z scale
   */
  setScale(x, y, z) {
    if (typeof x === 'number' && !isNaN(x)) {
      this.scale.x = x;
    }
    if (typeof y === 'number' && !isNaN(y)) {
      this.scale.y = y;
    }
    if (typeof z === 'number' && !isNaN(z)) {
      this.scale.z = z;
    }
    this.changed();
  }

  /**
   * Called after item is resized (extracted from bundle line 2912)
   * Base implementation - override in subclasses for specific behavior
   */
  resized() {
    // Base implementation - can be overridden in subclasses
  }

  /**
   * Remove item from scene (extracted from bundle line 2787)
   * Cleans up child meshes, dimension helper, and removes from scene
   */
  remove() {
    // Remove all child meshes from scene
    this.childMeshes.forEach(mesh => {
      if (this.scene) {
        this.scene.remove(mesh);
      }
    });

    // Remove dimension helper
    if (this.dimensionHelper && this.scene) {
      this.scene.remove(this.dimensionHelper);
    }

    // Call removed() hook for cleanup
    this.removed();

    // Remove from scene's item list
    if (this.scene && this.scene.removeItem) {
      this.scene.removeItem(this);
    }
  }

  /**
   * Resize item (extracted from bundle line 2803)
   * @param {number} width - New width
   * @param {number} height - New height
   * @param {number} depth - New depth
   */
  resize(width, height, depth) {
    // Base implementation - override in subclasses for specific resize behavior
    // This is typically handled through morph targets or scale
    if (width !== undefined) {
      // Width resize logic
    }
    if (height !== undefined) {
      // Height resize logic
    }
    if (depth !== undefined) {
      // Depth resize logic
    }
    this.resized();
  }

  /**
   * Get morph value (extracted from bundle line 2806)
   * @param {string} key - Morph key
   * @returns {number} Morph value (0-1)
   */
  getMorph(key) {
    return this.morph[key] !== undefined ? this.morph[key] : 0;
  }

  /**
   * Calculate hull points collection for collision detection (extracted from bundle line 3063)
   * @param {THREE.Object3D} object - Object to calculate hull for (defaults to this)
   * @param {boolean} flatten - Whether to flatten the hull points
   */
  calculateHullPointsCollection(object = this, flatten = false) {
    // This calls the Utils.getHullPoints function which we need to implement in Utils
    // For now, use the existing getSnapPoints as a placeholder
    this.hullPointsCollection = this.getSnapPoints(flatten);
  }

  /**
   * Calculate half size of item bounding box (extracted from bundle line 3083)
   * @returns {THREE.Vector3} Half size vector
   */
  objectHalfSize() {
    const bounds = this.getBounding();
    return bounds.max.clone().sub(bounds.min).divideScalar(2);
  }

  /**
   * Create a glowing copy of this item (extracted from bundle line 3089)
   * Used for visual feedback (error states, highlights, etc.)
   * @param {number} color - Hex color for glow
   * @param {number} opacity - Glow opacity (default 0.2)
   * @param {boolean} ignoreDepth - Whether to ignore depth testing (default false)
   * @returns {THREE.Group} Glowing mesh group
   */
  createGlow(color, opacity = 0.2, ignoreDepth = false) {
    const material = new THREE.MeshBasicMaterial({
      color: color,
      blending: THREE.AdditiveBlending,
      opacity: opacity,
      transparent: true,
      depthTest: !ignoreDepth,
    });

    const glowGroup = new THREE.Group();

    // Clone all child meshes
    this.children.forEach(child => {
      if (child.geometry) {
        const glowMesh = new THREE.Mesh();
        glowMesh.copy(child);
        glowMesh.geometry = child.geometry.clone();
        glowMesh.material = material.clone();
        glowGroup.add(glowMesh);
      }
    });

    // Apply morph targets to glow meshes
    glowGroup.children.forEach(glowMesh => {
      if (!glowMesh.geometry || !glowMesh.geometry.attributes.position) return;

      glowMesh.geometry.attributes.position.needsUpdate = true;
      const posArray = glowMesh.geometry.attributes.position.array;

      try {
        if (this.morph) {
          for (const morphKey in this.morph) {
            const morphAttrs = glowMesh.geometry.morphAttributes;
            if (morphAttrs && morphAttrs.position && morphAttrs.position.length > morphKey) {
              const morphArray = morphAttrs.position[morphKey].array;
              const influence = this.morph[morphKey];
              for (let i = 0; i < posArray.length; i++) {
                posArray[i] += morphArray[i] * influence;
              }
            }
          }
        }
      } catch (error) {
        console.error('Error applying morph to glow:', error);
      }
    });

    glowGroup.material = material;
    glowGroup.position.copy(this.position);
    glowGroup.rotation.copy(this.rotation);
    glowGroup.scale.copy(this.scale);

    return glowGroup;
  }

  /**
   * EXTRACTED FROM PRODUCTION BUNDLE - Phase 2A Priority 1
   * Notify scene that item has changed (position, rotation, etc.)
   * Used to trigger scene updates and re-rendering
   */
  changed() {
    if (this.scene) {
      this.scene.needsUpdate = true;
    }
    // Will be enhanced in Phase 2B to notify Model/Scene for interaction updates
  }
}

/**
 * **PHASE 2C: Wall/Room Integration**
 * WallItem class (type 2) - Items attached to walls
 * Extracted from production bundle lines 3232-3350
 * Handles wall-mounted furniture (desks, shelves, etc.)
 */
class WallItem extends BaseItem {
  constructor(model, metadata, meshes, position, rotation, options) {
    super(model, metadata, meshes, position, rotation, options);

    // **Wall-specific properties** (bundle line 3232)
    this.currentWallEdge = null;      // Current wall edge item is attached to
    this.refVec = new THREE.Vector2(0, 1);  // Reference vector for rotation
    this.wallOffsetScalar = 0;        // Distance from wall surface
    this.sizeX = 0;                   // Item width
    this.sizeY = 0;                   // Item height
    this.addToWall = false;           // Whether to add to wall.items array
    this.boundToFloor = false;        // Whether item sits on floor
    this.frontVisible = false;        // Front side visibility
    this.backVisible = false;         // Back side visibility
    this.allowRotate = false;         // Allow manual rotation
    this.morphAlign = 3;              // Morph alignment mode
  }

  /**
   * Find closest wall edge to item position
   * @returns {HalfEdge} Closest wall edge
   */
  closestWallEdge() {
    const edges = this.model.floorplan.wallEdges();
    let closestEdge = null;
    let closestDistance = null;
    const x = this.position.x;
    const z = this.position.z;

    edges.forEach(edge => {
      const distance = edge.distanceTo(x, z);
      if (closestDistance === null || distance < closestDistance) {
        closestDistance = distance;
        closestEdge = edge;
      }
    });

    return closestEdge;
  }

  /**
   * Get wall offset (distance from wall surface)
   * @returns {number} Wall offset
   */
  getWallOffset() {
    return this.wallOffsetScalar;
  }

  /**
   * Update item size based on bounding box
   */
  updateSize() {
    const bounds = this.getBounding();
    this.wallOffsetScalar = (bounds.max.z - bounds.min.z) * this.scale.z / 2;
    this.sizeX = (bounds.max.x - bounds.min.x) * this.scale.x;
    this.sizeY = (bounds.max.y - bounds.min.y) * this.scale.y;
  }

  /**
   * Update edge visibility (front/back)
   * @param {boolean} visible - Visibility state
   * @param {boolean} front - Whether this is front edge
   */
  updateEdgeVisibility(visible, front) {
    if (front) {
      this.frontVisible = visible;
    } else {
      this.backVisible = visible;
    }
    this.visible = this.frontVisible || this.backVisible;
  }

  /**
   * Trigger wall redraw
   */
  redrawWall() {
    if (this.addToWall && this.currentWallEdge) {
      this.currentWallEdge.wall.fireRedraw();
    }
  }

  /**
   * Change which wall edge item is attached to
   * @param {HalfEdge} edge - New wall edge
   */
  changeWallEdge(edge) {
    // Remove from previous wall
    if (this.currentWallEdge) {
      if (this.addToWall) {
        Utils.removeValue(this.currentWallEdge.wall.items, this);
        this.redrawWall();
      } else {
        Utils.removeValue(this.currentWallEdge.wall.onItems, this);
      }
      this.currentWallEdge.wall.dontFireOnDelete(this.remove.bind(this));
    }

    // Add to new wall
    edge.wall.fireOnDelete(this.remove.bind(this));

    // Calculate rotation based on wall normal
    const normal = edge.plane.geometry.faces[0].normal;
    const normalVec = new THREE.Vector2(normal.x, normal.z);
    let angle = Utils.angle(this.refVec.x, this.refVec.y, normalVec.x, normalVec.y);

    if (this.flipped) {
      angle = (angle + Math.PI) % (2 * Math.PI);
    }

    this.rotation.y = angle;
    if (this.dimensionHelper) {
      this.dimensionHelper.rotation.y = angle;
    }
    this.rotateChildMeshes();

    // Set new wall edge
    this.currentWallEdge = edge;

    // Add to wall's item list
    if (this.addToWall) {
      edge.wall.items.push(this);
      this.redrawWall();
    } else {
      edge.wall.onItems.push(this);
    }
  }

  /**
   * Bound item movement to wall edge constraints
   * @param {THREE.Vector3} position - Position to bound
   */
  boundMove(position) {
    const tolerance = 0.02;
    const edge = this.currentWallEdge;

    // Transform to wall-local coordinates
    position.applyMatrix4(edge.interiorTransform);

    // Constrain X (along wall)
    if (position.x < this.sizeX / 2 + tolerance) {
      position.x = this.sizeX / 2 + tolerance;
    } else if (position.x > edge.interiorDistance() - this.sizeX / 2 - tolerance) {
      position.x = edge.interiorDistance() - this.sizeX / 2 - tolerance;
    }

    // Constrain Y (height)
    if (this.boundToFloor) {
      position.y = 0 * this.scale.y + 0.01;
    } else {
      if (position.y < tolerance) {
        position.y = tolerance;
      } else if (position.y > edge.height - this.sizeY - tolerance) {
        position.y = edge.height - this.sizeY - tolerance;
      }
    }

    // Set Z (distance from wall)
    position.z = this.getWallOffset();

    // Transform back to world coordinates
    position.applyMatrix4(edge.invInteriorTransform);
  }

  /**
   * **PHASE 2C: Override placeInRoom for wall items**
   * Place wall item on closest wall
   */
  placeInRoom() {
    const edge = this.closestWallEdge();
    this.changeWallEdge(edge);
    this.updateSize();

    if (!this.position_set) {
      const center = edge.interiorCenter();
      const wallHeight = edge.wall.height || 2.5;
      const newPos = new THREE.Vector3(center.x, wallHeight / 2, center.y);
      this.boundMove(newPos);
      this.position.copy(newPos);
      this.redrawWall();
    }

    this.moveChildMeshes();
    this.rotateChildMeshes();
    this.changed();
  }

  /**
   * **PHASE 2C: Override moveToPosition for wall items**
   * Move wall item with wall edge snapping
   * @param {THREE.Vector3} position - Target position
   * @param {Object} event - Event data with edge information
   */
  moveToPosition(position, event) {
    if (isNaN(position.x) || isNaN(position.y) || isNaN(position.z)) {
      console.log('⚠️ NaN detected in WallItem.moveToPosition');
      return;
    }

    // Change wall edge if provided in event
    if (event && event.object && event.object.edge) {
      console.log('WallItem: Changing to edge', event.object.edge);
      this.changeWallEdge(event.object.edge);
    }

    // Bound position to wall constraints
    this.boundMove(position);
    this.position.copy(position);

    // Update dimension helper
    const bounds = this.getBounding();
    const helperPos = position.clone();
    helperPos.y = (bounds.max.y + bounds.min.y) / 2;
    if (this.dimensionHelper) {
      this.dimensionHelper.position.copy(helperPos);
    }

    this.moveChildMeshes();
    this.redrawWall();
    this.changed();
  }

  /**
   * Get custom intersection planes for raycasting (wall edges)
   * @returns {Array<THREE.Plane>} Array of wall edge planes
   */
  customIntersectionPlanes() {
    return this.model.floorplan.wallEdgePlanes();
  }

  /**
   * **PHASE 2C: Override resized for wall items**
   * Handle item resize
   */
  resized() {
    this.updateSize();
    this.redrawWall();
  }

  /**
   * **PHASE 2C: Override removed for wall items**
   * Clean up when item is removed
   */
  removed() {
    if (this.currentWallEdge && this.addToWall) {
      Utils.removeValue(this.currentWallEdge.wall.items, this);
      this.redrawWall();
    }
    super.removed();
  }
}

/**
 * **PHASE 2C+**: InWallItem class (type 3)
 * Wall items that can be flipped (mirrors, artwork, shelves)
 * Extracted from production bundle lines 3324-3342
 */
class InWallItem extends WallItem {
  constructor(model, metadata, meshes, position, rotation, options) {
    super(model, metadata, meshes, position, rotation, options);

    // InWallItem-specific properties (bundle line 3324)
    this.addToWall = true;         // Add to wall.items array
    this.morphAlign = 0;           // Morph alignment mode
    this.flippable = true;         // Can be horizontally flipped
    this.flipped = false;          // Current flip state
  }

  /**
   * Override: Get wall offset (slightly recessed into wall)
   * Bundle line 3337
   */
  getWallOffset() {
    return 0.005 - this.currentWallEdge.offset;
  }

  /**
   * Flip item horizontally (mirror image)
   * Bundle line 3329
   */
  flipHorizontal() {
    this.flipped = !this.flipped;
    this.rotation.y = (this.rotation.y + Math.PI) % (2 * Math.PI);
    this.moveChildMeshes();
  }
}

/**
 * **PHASE 2C+**: InWallFloorItem class (type 7)
 * Wall items that are bound to floor (kitchen cabinets, base units)
 * Extracted from production bundle lines 3342-3350
 */
class InWallFloorItem extends InWallItem {
  constructor(model, metadata, meshes, position, rotation, options) {
    super(model, metadata, meshes, position, rotation, options);

    // InWallFloorItem-specific properties (bundle line 3346)
    this.boundToFloor = true;      // Item sits on floor
  }
}

/**
 * **PHASE 2C+**: FloorItem class (type 8)
 * Floor-only items that don't obstruct floor movement (rugs, mats)
 * Extracted from production bundle lines 3351-3360
 */
class FloorItem extends BaseItem {
  constructor(model, metadata, meshes, position, rotation, options) {
    super(model, metadata, meshes, position, rotation, options);

    // FloorItem-specific properties (bundle line 3355)
    this.obstructFloorMoves = false;  // Doesn't block floor items
    this.receiveShadow = true;        // Receives shadows from above
  }

  /**
   * Enhanced moveToPosition with stacking support (extracted from bundle lines 3201-3223)
   * Handles stackable items placement on top of other items
   * @param {THREE.Vector3} position - Target position
   * @param {Object} event - Event data
   */
  moveToPosition(position, event) {
    if (isNaN(position.x) || isNaN(position.y) || isNaN(position.z)) {
      console.log('⚠️ NaN detected in FloorItem.moveToPosition');
      return;
    }

    // Validate position
    const validationStatus = this.isValidPosition(position);

    // Constants from bundle lines 3128-3130
    const INVALID = -1;
    const VALID = 0;
    const OVERLAP = 1;

    if (validationStatus === VALID || validationStatus === OVERLAP) {
      this.hideError();

      const targetPosition = new THREE.Vector3().copy(position);
      let stackHeight = 0;

      // Handle stacking logic
      if (this.stackable) {
        const bottomObjects = this.getBottomObjectsForStack();
        if (bottomObjects.length === 0) {
          console.log('⚠️ No bottom objects for stacking');
          this.showError();
          return;
        }

        stackHeight = this.getStackingPosition(targetPosition);
        if (stackHeight === 0) {
          this.showError();
          return;
        }
      }

      const previousPosition = new THREE.Vector3().copy(this.position);
      targetPosition.y = stackHeight;

      // Check for overlap on non-overlappable items
      if (validationStatus === OVERLAP && !this.overlappable) {
        this.showError(position);
        return;
      }

      // Validate final position values
      if (isNaN(targetPosition.x) || isNaN(targetPosition.y) || isNaN(targetPosition.z)) {
        return;
      }

      // Apply position
      this.position.copy(targetPosition);
      this.dimensionHelper.position.copy(targetPosition);

      // Calculate delta for linked items
      const delta = new THREE.Vector3().copy(this.position).sub(previousPosition);

      // Update meshes and linked items
      this.moveChildMeshes();
      this.moveLinkedItems(delta);
      this.changed();

      // Update group parent if it's a set
      if (this.groupParent && this.groupParent.isSet) {
        this.groupParent.update();
      }
    } else {
      // Invalid position
      this.showError(position);
    }
  }
}

/**
 * **PHASE 2C+**: WallFloorItem class (type 9)
 * Wall items that sit on floor (desks against wall, floor-standing shelves)
 * Extracted from production bundle lines 3360-3369
 */
class WallFloorItem extends WallItem {
  constructor(model, metadata, meshes, position, rotation, options) {
    super(model, metadata, meshes, position, rotation, options);

    // WallFloorItem-specific properties (bundle line 3364)
    this.boundToFloor = true;      // Item sits on floor
  }
}

/**
 * Set/Group Item class (type 101)
 * Represents a group of linked items (extracted from bundle lines 3371-3460)
 */
class SetItem extends BaseItem {
  constructor(model, metadata, meshes, position, rotation, options) {
    super(model, metadata, meshes, position, rotation, options);
    this.isSet = true;           // Mark as set/group
    this.opened = false;         // Set opened state
    this.linkedItems = [];
  }

  /**
   * Initialize set item (enhanced from bundle line 3379)
   * @param {Array} meshes - Child meshes
   * @param {THREE.Vector3} position - Initial position
   * @param {number} rotation - Initial rotation
   * @param {Object} options - Item options
   */
  initObject(meshes, position, rotation, options) {
    this.halfSize = this.objectHalfSize();
    this.configDimensionLabels();

    if (position) {
      this.position.copy(position);
      this.dimensionHelper.position.copy(position);
      this.position_set = true;
    } else {
      this.position.set(0, 0, 0);
      this.position_set = false;
    }

    if (rotation) {
      this.rotation.y = rotation;
    }

    this.placeInRoom();
    this.scene.needsUpdate = true;
  }

  /**
   * Clear all linked items
   */
  clearLinkedItems() {
    this.linkedItems = [];
  }

  /**
   * Add linked item to set
   * @param {BaseItem} item - Item to link
   */
  addLinkedItem(item) {
    this.linkedItems.push(item);
    item.groupParent = this;
  }

  /**
   * Calculate half-size from bounding box (bundle line 3381)
   */
  calculateHalfSize() {
    this.halfSize = this.objectHalfSize();
  }

  /**
   * Override: Get bounding box from all linked items (bundle lines 3383-3396)
   * @returns {Object} Bounding box { min, max }
   */
  getBounding() {
    let minX = Infinity, minY = Infinity, minZ = Infinity;
    let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;

    this.linkedItems.forEach(item => {
      const bounds = item.getBounding();
      if (bounds.min.x < minX) minX = bounds.min.x;
      if (bounds.min.y < minY) minY = bounds.min.y;
      if (bounds.min.z < minZ) minZ = bounds.min.z;
      if (bounds.max.x > maxX) maxX = bounds.max.x;
      if (bounds.max.y > maxY) maxY = bounds.max.y;
      if (bounds.max.z > maxZ) maxZ = bounds.max.z;
    });

    return {
      min: new THREE.Vector3(minX, minY, minZ),
      max: new THREE.Vector3(maxX, maxY, maxZ)
    };
  }

  /**
   * Get center position with linked items (bundle line 3397)
   * @returns {THREE.Vector3} Center position
   */
  getCenterWithLinkedItems() {
    return this.position;
  }

  /**
   * Update set item after linked items change (bundle line 3399)
   * Recalculates center position and bounding box
   */
  update() {
    this.calculateHalfSize();
    if (this.dimensionHelper && this.dimensionHelper.update) {
      this.dimensionHelper.update();
    }
  }

  /**
   * Set opened state (bundle line 3401)
   * @param {boolean} opened - Whether set is opened
   */
  setOpened(opened) {
    this.opened = opened;
  }

  /**
   * Override: Move set and all linked items (bundle lines 3409-3418)
   * @param {THREE.Vector3} position - Target position
   * @param {Object} event - Event data
   */
  moveToPosition(position, event) {
    if (isNaN(position.x) || isNaN(position.y) || isNaN(position.z)) {
      console.log('⚠️ NaN detected in SetItem.moveToPosition');
      return;
    }

    const previousPosition = new THREE.Vector3().copy(this.position);
    this.position.copy(position);
    this.dimensionHelper.position.copy(position);

    // Calculate delta and move all linked items
    const delta = new THREE.Vector3().copy(position).sub(previousPosition);
    this.moveLinkedItems(delta);
  }

  /**
   * Override: Set item as selected (bundle lines 3420-3425)
   * Selects set and unselects linked items to show only set outline
   */
  setSelected() {
    this.selected = true;
    this.updateHighlight();
    // Unselect linked items so only set shows outline
    this.linkedItems.forEach(item => item.setUnselected());
  }

  /**
   * Override: Set item as unselected (bundle lines 3427-3432)
   * Unselects set and all linked items
   */
  setUnselected() {
    this.selected = false;
    this.linkedItems.forEach(item => item.setUnselected());
    this.updateHighlight();
  }

  /**
   * Override: Update highlight for all linked items (bundle lines 3434-3447)
   * Shows selection outline for all items in the set
   */
  updateHighlight() {
    const shouldHighlight = this.hover || this.selected;

    if (!this.opened) {
      const meshesToHighlight = [];
      const allMeshes = [];

      // Collect meshes from all linked items
      this.linkedItems.forEach(item => {
        allMeshes.push(...item.childMeshes);
      });

      // Filter out excluded mesh names (if any)
      allMeshes.forEach(mesh => {
        meshesToHighlight.push(mesh);
      });

      console.log('SetItem: update highlight', shouldHighlight, meshesToHighlight.length);

      // Dispatch highlight event
      if (shouldHighlight) {
        document.dispatchEvent(new CustomEvent('bp3d_highlight_changed', {
          detail: { objects: meshesToHighlight }
        }));
      } else {
        document.dispatchEvent(new CustomEvent('bp3d_highlight_changed', {
          detail: { objects: [] }
        }));
      }
    }
  }
}

/**
 * Item type registry
 */
const itemClasses = {
  1: BaseItem, // Generic furniture item
  2: WallItem, // Wall-mounted items (PHASE 2C)
  3: InWallItem, // Wall items that can be flipped (PHASE 2C+)
  7: InWallFloorItem, // Wall items bound to floor (PHASE 2C+)
  8: FloorItem, // Floor items that don't obstruct (PHASE 2C+)
  9: WallFloorItem, // Wall items sitting on floor (PHASE 2C+)
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
