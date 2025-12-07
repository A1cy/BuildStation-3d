/**
 * Room - Represents a room polygon in the floor plan
 * Manages floor geometry, textures, and HalfEdge circular linked list
 */

import Utils from '../Utils';
import HalfEdge from './HalfEdge';

// Default floor texture configuration
const DEFAULT_FLOOR_TEXTURE = {
  url: '',
  stretch: true,
  scale: 4
};

class Room {
  /**
   * Create a new room from a list of corners
   * @param {Floorplan} floorplan - Parent floor plan
   * @param {Array<Corner>} corners - Corners that form the room polygon (counterclockwise)
   */
  constructor(floorplan, corners) {
    // Floor plan reference
    this.floorplan = floorplan;
    this.corners = corners;

    // Geometry
    this.interiorCorners = []; // Interior points after wall thickness offset
    this.edgePointer = null; // Head of HalfEdge circular linked list
    this.floorPlane = null; // Three.js mesh for floor (will be created in generatePlane)

    // Textures
    this.customTexture = false;

    // Event callbacks
    this.floorChangeCallbacks = [];

    // Initialize room geometry
    this.updateWalls();
    this.updateInteriorCorners();
    this.generatePlane();
  }

  /**
   * Get unique ID for this room (sorted corner IDs joined)
   * @returns {string} Room UUID
   */
  getUuid() {
    const cornerIds = Utils.map(this.corners, (corner) => corner.id);
    cornerIds.sort();
    return cornerIds.join();
  }

  /**
   * Register callback for floor texture changes
   * @param {Function} callback - Callback function
   */
  fireOnFloorChange(callback) {
    this.floorChangeCallbacks.push(callback);
  }

  /**
   * Get floor texture configuration
   * @returns {Object} Texture config {url, stretch, scale, width, height}
   */
  getTexture() {
    const uuid = this.getUuid();
    return this.floorplan.getFloorTexture(uuid) || DEFAULT_FLOOR_TEXTURE;
  }

  /**
   * Set floor texture
   * @param {string} url - Texture URL
   * @param {boolean} stretch - Whether to stretch texture (default true)
   * @param {number} scale - Texture scale (default 1)
   * @param {number} width - Texture width (default 0.5)
   * @param {number} height - Texture height (default 0.5)
   */
  setTexture(url, stretch = true, scale = 1, width = 0.5, height = 0.5) {
    console.log('set texture of room', url, stretch, scale);

    const uuid = this.getUuid();
    this.floorplan.setFloorTexture(uuid, url, scale, width, height);

    // Fire floor change callbacks
    this.floorChangeCallbacks.forEach((callback) => {
      if (typeof callback === 'function') {
        callback();
      }
    });
  }

  /**
   * Generate 3D floor plane mesh
   * Creates a flat mesh from interior corner points
   * Note: Requires Three.js integration
   */
  generatePlane() {
    // This method will create a Three.js mesh when integrated
    // Preserved for future Three.js integration

    /*
    // Create shape from interior corners
    const points = [];
    this.interiorCorners.forEach((corner) => {
      points.push(new THREE.Vector2(corner.x, corner.y));
    });

    const shape = new THREE.Shape(points);
    const geometry = new THREE.ShapeGeometry(shape);

    this.floorPlane = new THREE.Mesh(
      geometry,
      new THREE.MeshBasicMaterial({ side: THREE.DoubleSide })
    );

    this.floorPlane.visible = false;
    this.floorPlane.rotation.set(Math.PI / 2, 0, 0); // Rotate to horizontal
    this.floorPlane.room = this; // Reference back to room
    */
  }

  /**
   * Handle circular array index (wraps around)
   * @param {number} index - Index to normalize
   * @returns {number} Normalized index (0 to corners.length-1)
   */
  cycleIndex(index) {
    if (index < 0) {
      return index + this.corners.length;
    }
    return index % this.corners.length;
  }

  /**
   * Update interior corners from HalfEdge linked list
   * Traverses the circular linked list and collects interior start points
   */
  updateInteriorCorners() {
    let edge = this.edgePointer;

    // Traverse circular linked list
    do {
      this.interiorCorners.push(edge.interiorStart());
      edge.generatePlane(); // Generate 3D plane for wall edge
      edge = edge.next;
    } while (edge !== this.edgePointer);
  }

  /**
   * Update walls by creating HalfEdge circular linked list
   * Connects corners with HalfEdges (front/back based on wall direction)
   */
  updateWalls() {
    let prevEdge = null;
    let firstEdge = null;

    for (let i = 0; i < this.corners.length; i++) {
      const corner = this.corners[i];
      const nextCorner = this.corners[(i + 1) % this.corners.length];

      // Find wall connecting these corners
      const wallTo = corner.wallTo(nextCorner);
      const wallFrom = corner.wallFrom(nextCorner);

      let edge;
      if (wallTo) {
        // Wall goes from corner to nextCorner (use front edge)
        edge = new HalfEdge(this, wallTo, true);
      } else if (wallFrom) {
        // Wall goes from nextCorner to corner (use back edge)
        edge = new HalfEdge(this, wallFrom, false);
      } else {
        console.log("corners arent connected by a wall, uh oh");
        continue;
      }

      // Build circular linked list
      if (i === 0) {
        firstEdge = edge;
      } else {
        edge.prev = prevEdge;
        prevEdge.next = edge;

        // Close the loop on last edge
        if (i + 1 === this.corners.length) {
          firstEdge.prev = edge;
          edge.next = firstEdge;
        }
      }

      prevEdge = edge;
    }

    this.edgePointer = firstEdge;
  }
}

export default Room;
