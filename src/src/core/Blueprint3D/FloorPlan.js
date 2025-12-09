import * as THREE from 'three';
import Wall from './Wall';
import Corner from './Corner';
import HalfEdge from './HalfEdge';
import Room from './Room';
import Utils from '../Utils';

/**
 * FloorPlan Class
 * 
 * Manages the floor plan structure including walls, corners, and rooms.
 * Handles serialization/deserialization and room detection algorithms.
 * 
 * This is the core floor planning engine that:
 * - Creates and manages walls and corners
 * - Automatically detects and generates rooms
 * - Handles collision detection
 * - Serializes/deserializes floor plans to/from JSON
 * - Manages floor textures
 */

// Conversion factor (appears to be cm to some unit)
const O = 1; // TODO: Determine actual conversion factor

class FloorPlan {
  constructor() {
    // Core collections
    this.scene = null; // Reference to Scene object (set externally)
    this.walls = []; // Array of Wall objects
    this.corners = []; // Array of Corner objects
    this.rooms = []; // Array of Room objects

    // Callbacks
    this.new_wall_callbacks = [];
    this.new_corner_callbacks = [];
    this.redraw_callbacks = [];
    this.updated_rooms = [];
    this.roomLoadedCallbacks = [];

    // Floor textures mapping { roomUuid: { url, scale, width, height } }
    this.floorTextures = {};

    // Bind removeCorner method for use in callbacks
    this.removeCorner = (corner) => {
      Utils.removeValue(this.corners, corner);
    };
  }

  /**
   * Get all wall edges (front and back)
   * @returns {HalfEdge[]} Array of all wall edges
   */
  wallEdges() {
    const edges = [];
    this.walls.forEach((wall) => {
      if (wall.frontEdge) edges.push(wall.frontEdge);
      if (wall.backEdge) edges.push(wall.backEdge);
    });
    return edges;
  }

  /**
   * Get all wall edge planes
   * @returns {THREE.Plane[]} Array of wall planes
   */
  wallEdgePlanes() {
    const planes = [];
    this.walls.forEach((wall) => {
      if (wall.frontEdge) planes.push(wall.frontEdge.plane);
      if (wall.backEdge) planes.push(wall.backEdge.plane);
    });
    return planes;
  }

  /**
   * Get all floor planes from rooms
   * @returns {THREE.Plane[]} Array of floor planes
   */
  floorPlanes() {
    return Utils.map(this.rooms, (room) => room.floorPlane);
  }

  /**
   * Register callback for new wall events
   * @param {Function} callback - Callback function
   */
  fireOnNewWall(callback) {
    this.new_wall_callbacks.push(callback);
  }

  /**
   * Register callback for new corner events
   * @param {Function} callback - Callback function
   */
  fireOnNewCorner(callback) {
    this.new_corner_callbacks.push(callback);
  }

  /**
   * Register callback for redraw events
   * @param {Function} callback - Callback function
   */
  fireOnRedraw(callback) {
    this.redraw_callbacks.push(callback);
  }

  /**
   * Register callback for room update events
   * @param {Function} callback - Callback function
   */
  fireOnUpdatedRooms(callback) {
    this.updated_rooms.push(callback);
  }

  /**
   * Create a new wall between two corners
   * @param {Corner} corner1 - Start corner
   * @param {Corner} corner2 - End corner
   * @returns {Wall} The new wall
   */
  newWall(corner1, corner2) {
    const wall = new Wall(corner1, corner2);
    this.walls.push(wall);

    // Register wall deletion callback
    wall.fireOnDelete(() => {
      this.removeWall(wall);
    });

    // Fire callbacks
    this.new_wall_callbacks.forEach((callback) => {
      if (typeof callback === 'function') {
        callback(wall);
      }
    });

    this.update();
    return wall;
  }

  /**
   * Remove a wall from the floor plan
   * @param {Wall} wall - Wall to remove
   */
  removeWall(wall) {
    Utils.removeValue(this.walls, wall);
    this.update();
  }

  /**
   * Create a new corner at given coordinates
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate (actually Z in 3D)
   * @param {string} id - Optional corner ID
   * @returns {Corner} The new corner
   */
  newCorner(x, y, id) {
    const corner = new Corner(this, x, y, id);
    this.corners.push(corner);

    corner.fireOnDelete(this.removeCorner);

    // Fire callbacks
    this.new_corner_callbacks.forEach((callback) => {
      if (typeof callback === 'function') {
        callback(corner);
      }
    });

    return corner;
  }

  /**
   * Get all walls
   * @returns {Wall[]}
   */
  getWalls() {
    return this.walls;
  }

  /**
   * Get all items from the scene
   * @returns {Item[]}
   */
  getItems() {
    return this.scene.items;
  }

  /**
   * Get all corners
   * @returns {Corner[]}
   */
  getCorners() {
    return this.corners;
  }

  /**
   * Get all rooms
   * @returns {Room[]}
   */
  getRooms() {
    return this.rooms;
  }

  /**
   * Find corner overlapping with given coordinates
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate (actually Z)
   * @param {number} tolerance - Distance tolerance (default 0.05)
   * @returns {Corner|null} Overlapped corner or null
   */
  overlappedCorner(x, y, tolerance = 0.05) {
    for (let i = 0; i < this.corners.length; i++) {
      if (this.corners[i].distanceFrom(x, y) < tolerance) {
        return this.corners[i];
      }
    }
    return null;
  }

  /**
   * Find wall overlapping with given coordinates
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate (actually Z)
   * @param {number} tolerance - Distance tolerance (default 0.05)
   * @returns {Wall|null} Overlapped wall or null
   */
  overlappedWall(x, y, tolerance = 0.05) {
    for (let i = 0; i < this.walls.length; i++) {
      if (this.walls[i].distanceFrom(x, y) < tolerance) {
        return this.walls[i];
      }
    }
    return null;
  }

  /**
   * Find item overlapping with given coordinates
   * Uses point-in-polygon testing with item snap points
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate (actually Z)
   * @returns {Item|null} Overlapped item or null
   */
  overlappedItem(x, y) {
    const items = this.getItems();
    let result = null;

    for (const item of items) {
      const snapPoints = item.getSnapPoints();
      let overlaps = false;

      for (const snapPoint of snapPoints) {
        if (Utils.pointInPolygon(x, y, snapPoint)) {
          overlaps = true;
          break;
        }
      }

      if (overlaps) {
        result = item;
        break;
      }
    }

    return result;
  }

  /**
   * Calculate ruler/dimension data for measurements
   * Generates horizontal and vertical dimension lines
   * @returns {Object} { x: [...], y: [...] } dimension data
   */
  calculateRulerData() {
    // Collect all corner points
    const points = this.getCorners().map((corner) => ({
      x: corner.x,
      y: corner.y,
    }));

    // Add item corner points
    this.getItems().forEach((item) => {
      points.push(...item.getCorners());
    });

    // Find unique X and Y coordinates
    const xPoints = [];
    const yPoints = [];

    for (let i = 0; i < points.length; i++) {
      // Check if X already exists
      let xExists = false;
      for (const xPoint of xPoints) {
        if (xPoint.x === points[i].x) {
          xExists = true;
          break;
        }
      }
      if (!xExists) xPoints.push(points[i]);

      // Check if Y already exists
      let yExists = false;
      for (const yPoint of yPoints) {
        if (yPoint.y === points[i].y) {
          yExists = true;
          break;
        }
      }
      if (!yExists) yPoints.push(points[i]);
    }

    // Sort by coordinate
    xPoints.sort((a, b) => a.x - b.x);
    yPoints.sort((a, b) => a.y - b.y);

    // Generate dimension segments
    const rulerData = { x: [], y: [] };

    for (let i = 0; i < xPoints.length - 1; i++) {
      rulerData.x.push({
        start: xPoints[i],
        end: xPoints[i + 1],
        length: Math.abs(xPoints[i].x - xPoints[i + 1].x),
      });
    }

    for (let i = 0; i < yPoints.length - 1; i++) {
      rulerData.y.push({
        start: yPoints[i],
        end: yPoints[i + 1],
        length: Math.abs(yPoints[i].y - yPoints[i + 1].y),
      });
    }

    return rulerData;
  }

  /**
   * Serialize floor plan to JSON
   * @returns {Object} Floor plan data { corners, walls, floorTextures }
   */
  saveFloorplan() {
    const data = {
      corners: {},
      walls: [],
      wallTextures: [],
      floorTextures: {},
      newFloorTextures: {},
    };

    // Save corners
    this.corners.forEach((corner) => {
      data.corners[corner.id] = {
        x: corner.x,
        y: corner.y,
      };
    });

    // Save walls
    this.walls.forEach((wall) => {
      data.walls.push({
        corner1: wall.getStart().id,
        corner2: wall.getEnd().id,
        frontTexture: wall.frontTexture,
        backTexture: wall.backTexture,
      });
    });

    // Save floor textures
    data.newFloorTextures = this.floorTextures;

    return data;
  }

  /**
   * Load floor plan from JSON data
   * @param {Object} data - Floor plan data from saveFloorplan()
   */
  loadFloorplan(data) {
    this.reset();

    const cornerMap = {};

    if (data === null || !('corners' in data) || !('walls' in data)) {
      return;
    }

    // Recreate corners
    for (const id in data.corners) {
      const cornerData = data.corners[id];
      cornerMap[id] = this.newCorner(cornerData.x / O, cornerData.y / O, id);
    }

    // Recreate walls
    data.walls.forEach((wallData) => {
      const wall = this.newWall(
        cornerMap[wallData.corner1],
        cornerMap[wallData.corner2]
      );

      if (wallData.frontTexture) {
        wall.frontTexture = wallData.frontTexture;
      }
      if (wallData.backTexture) {
        wall.backTexture = wallData.backTexture;
      }
    });

    // Load floor textures
    if ('newFloorTextures' in data) {
      this.floorTextures = data.newFloorTextures;
    }

    this.update();

    // Fire loaded callbacks
    this.roomLoadedCallbacks.forEach((callback) => {
      if (typeof callback === 'function') {
        callback();
      }
    });
  }

  /**
   * Get floor texture for a room
   * @param {string} roomUuid - Room UUID
   * @returns {Object|null} Texture data or null
   */
  getFloorTexture(roomUuid) {
    return roomUuid in this.floorTextures ? this.floorTextures[roomUuid] : null;
  }

  /**
   * Set floor texture for a room
   * @param {string} roomUuid - Room UUID
   * @param {string} url - Texture URL
   * @param {number} scale - Texture scale
   * @param {number} width - Texture width
   * @param {number} height - Texture height
   */
  setFloorTexture(roomUuid, url, scale, width, height) {
    this.floorTextures[roomUuid] = {
      url,
      scale,
      width,
      height,
    };
  }

  /**
   * Clean up floor textures for deleted rooms
   */
  updateFloorTextures() {
    const roomUuids = Utils.map(this.rooms, (room) => room.getUuid());

    for (const uuid in this.floorTextures) {
      if (!Utils.hasValue(roomUuids, uuid)) {
        delete this.floorTextures[uuid];
      }
    }
  }

  /**
   * Reset floor plan - remove all walls and corners
   */
  reset() {
    const corners = this.corners.slice(0);
    const walls = this.walls.slice(0);

    corners.forEach((corner) => corner.remove());
    walls.forEach((wall) => wall.remove());

    this.corners = [];
    this.walls = [];
  }

  /**
   * Update floor plan - recalculate rooms and edges
   * This is the core update method called after any structural change
   */
  update() {
    // Reset wall front/back orientation
    this.walls.forEach((wall) => wall.resetFrontBack());

    // Find and create rooms
    const cornerSets = this.findRooms(this.corners);
    this.rooms = [];

    cornerSets.forEach((cornerSet) => {
      this.rooms.push(new Room(this, cornerSet));
    });

    // Assign orphan edges (walls not part of any room)
    this.assignOrphanEdges();

    // Clean up floor textures
    this.updateFloorTextures();

    // Fire update callbacks
    this.updated_rooms.forEach((callback) => {
      if (typeof callback === 'function') {
        callback();
      }
    });
  }

  /**
   * Get center point of floor plan
   * @returns {THREE.Vector3} Center point
   */
  getCenter() {
    return this.getDimensions(true);
  }

  /**
   * Get size of floor plan
   * @returns {THREE.Vector3} Size vector
   */
  getSize() {
    return this.getDimensions(false);
  }

  /**
   * Get dimensions of floor plan (bounding box)
   * @param {boolean} center - If true, return center point; if false, return size
   * @returns {THREE.Vector3}
   */
  getDimensions(center = false) {
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;

    this.corners.forEach((corner) => {
      if (corner.x < minX) minX = corner.x;
      if (corner.x > maxX) maxX = corner.x;
      if (corner.y < minY) minY = corner.y;
      if (corner.y > maxY) maxY = corner.y;
    });

    // No corners found
    if (minX === Infinity || maxX === -Infinity || minY === Infinity || maxY === -Infinity) {
      return new THREE.Vector3();
    }

    if (center) {
      // Return center point
      return new THREE.Vector3((minX + maxX) * 0.5, 0, (minY + maxY) * 0.5);
    } else {
      // Return size
      return new THREE.Vector3(maxX - minX, 0, maxY - minY);
    }
  }

  /**
   * Assign orphan edges to walls not part of rooms
   * Orphan walls get edges created for both sides
   */
  assignOrphanEdges() {
    const orphanWalls = [];

    this.walls.forEach((wall) => {
      if (!wall.backEdge && !wall.frontEdge) {
        wall.orphan = true;

        // Create edges for both sides
        new HalfEdge(null, wall, false).generatePlane();
        new HalfEdge(null, wall, true).generatePlane();

        orphanWalls.push(wall);
      }
    });

    return orphanWalls;
  }

  /**
   * Find all rooms in the floor plan
   * Uses cycle-finding algorithm to detect closed loops of corners
   * @param {Corner[]} corners - Array of corners to analyze
   * @returns {Corner[][]} Array of corner arrays, each representing a room
   */
  findRooms(corners) {
    /**
     * Calculate angle between two vectors
     * @param {Corner} startCorner
     * @param {Corner} centerCorner
     * @param {Corner} endCorner
     * @returns {number} Angle in radians (0 to 2π)
     */
    function angleFrom(startCorner, centerCorner, endCorner) {
      return Utils.angle2pi(
        startCorner.x - centerCorner.x,
        startCorner.y - centerCorner.y,
        endCorner.x - centerCorner.x,
        endCorner.y - centerCorner.y
      );
    }

    /**
     * Find a cycle/loop starting from startCorner to endCorner
     * Uses depth-first search with right-hand rule (smallest angle)
     * @param {Corner} startCorner - Starting corner
     * @param {Corner} endCorner - Target corner
     * @returns {Corner[]} Array of corners forming the cycle
     */
    function findCycle(startCorner, endCorner) {
      const stack = [];
      let currentNode = {
        corner: endCorner,
        previousCorners: [startCorner],
      };
      const visited = {};
      visited[startCorner.id] = true;

      while (currentNode) {
        const currentCorner = currentNode.corner;
        visited[currentCorner.id] = true;

        // Found cycle back to start
        if (currentNode.corner === startCorner && currentCorner !== endCorner) {
          return currentNode.previousCorners;
        }

        // Get adjacent corners
        const adjacent = currentNode.corner.adjacentCorners();
        const nextCorners = [];

        for (let i = 0; i < adjacent.length; i++) {
          const adjCorner = adjacent[i];
          const adjId = adjCorner.id;

          // Add if not visited, or if it's the start corner (completing cycle)
          if (!(adjId in visited) || (adjCorner === startCorner && currentCorner !== endCorner)) {
            nextCorners.push(adjCorner);
          }
        }

        // Build path with current corner
        const path = currentNode.previousCorners.slice(0);
        path.push(currentCorner);

        if (nextCorners.length > 1) {
          // Multiple choices - sort by angle (right-hand rule)
          const prevCorner = currentNode.previousCorners[currentNode.previousCorners.length - 1];

          nextCorners.sort((a, b) => {
            return angleFrom(prevCorner, currentCorner, b) - angleFrom(prevCorner, currentCorner, a);
          });
        }

        if (nextCorners.length > 0) {
          // Add all next corners to stack
          nextCorners.forEach((nextCorner) => {
            stack.push({
              corner: nextCorner,
              previousCorners: path,
            });
          });
        }

        // Pop next node from stack
        currentNode = stack.pop();
      }

      return [];
    }

    // Find all cycles
    const cycles = [];

    corners.forEach((corner) => {
      corner.adjacentCorners().forEach((adjCorner) => {
        cycles.push(findCycle(corner, adjCorner));
      });
    });

    // Remove duplicate cycles (same corners in different orders)
    function removeDuplicates(cycles) {
      const uniqueCycles = [];
      const seen = {};

      const cornerId = (corner) => corner.id;

      for (let i = 0; i < cycles.length; i++) {
        const cycle = cycles[i];
        let isDuplicate = false;

        // Check all rotations of the cycle
        for (let j = 0; j < cycle.length; j++) {
          const rotated = Utils.cycle(cycle, j);
          const key = Utils.map(rotated, cornerId).join('-');

          if (seen.hasOwnProperty(key)) {
            isDuplicate = true;
            break;
          }
        }

        if (!isDuplicate) {
          uniqueCycles.push(cycle);
          // Store this cycle's key
          const key = Utils.map(cycle, cornerId).join('-');
          seen[key] = true;
        }
      }

      return uniqueCycles;
    }

    const uniqueCycles = removeDuplicates(cycles);

    // Filter out empty cycles before checking clockwise orientation
    const validCycles = uniqueCycles.filter(cycle => cycle && cycle.length >= 3);

    // Remove clockwise cycles (keep only counter-clockwise = rooms)
    return Utils.removeIf(validCycles, Utils.isClockwise);
  }

  /**
   * Dimension Methods (extracted from bundle lines 1960-1980)
   */

  /**
   * Get center point of floorplan (extracted from bundle lines 1960-1962)
   * @returns {THREE.Vector3} Center point (average of min/max X and Z)
   */
  getCenter() {
    return this.getDimensions(true);
  }

  /**
   * Get size of floorplan (extracted from bundle lines 1965-1967)
   * @returns {THREE.Vector3} Size (width on X, 0 on Y, depth on Z)
   */
  getSize() {
    return this.getDimensions(false);
  }

  /**
   * Get dimensions of floorplan (extracted from bundle lines 1970-1980)
   * @param {boolean} center - If true, return center point; if false, return size
   * @returns {THREE.Vector3} Either center point or size
   */
  getDimensions(center = false) {
    // Initialize min/max values
    let minX = Infinity;
    let maxX = -Infinity;
    let minZ = Infinity;
    let maxZ = -Infinity;

    // Find bounding box from all corners
    this.corners.forEach((corner) => {
      if (corner.x < minX) minX = corner.x;
      if (corner.x > maxX) maxX = corner.x;
      if (corner.y < minZ) minZ = corner.y;  // Note: corner.y is Z in 3D space
      if (corner.y > maxZ) maxZ = corner.y;
    });

    // Check for invalid bounds (no corners or all at same point)
    if (minX === Infinity || maxX === -Infinity || minZ === Infinity || maxZ === -Infinity) {
      return new THREE.Vector3(0, 0, 0);
    }

    // Return center or size based on parameter
    if (center) {
      // Return center point (average of min/max)
      return new THREE.Vector3(
        0.5 * (minX + maxX),
        0,
        0.5 * (minZ + maxZ)
      );
    } else {
      // Return size (max - min for width and depth)
      return new THREE.Vector3(
        maxX - minX,
        0,
        maxZ - minZ
      );
    }
  }
}

export default FloorPlan;
