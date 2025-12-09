/**
 * DimensionHelper - Wireframe bounding box with dimension labels
 * Extracted from production bundle lines 2055-2203
 * Shows width, height, depth measurements on selected items
 */

import * as THREE from 'three';
import Configuration, { configDimensionVisible, BP3D_EVENT_CONFIG_CHANGED } from '../Configuration';
import Dimensioning from '../Dimensioning';

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

export default DimensionHelper;
