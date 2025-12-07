/**
 * HalfEdge - Represents one side (front or back) of a wall
 * Forms a circular linked list around rooms for geometry generation
 * Handles textures, transformations, and 3D plane generation
 */

import Utils from '../Utils';

class HalfEdge {
  /**
   * Create a half edge
   * @param {Room} room - Parent room
   * @param {Wall} wall - Associated wall
   * @param {boolean} front - True if this is the front side of the wall
   */
  constructor(room, wall, front = false) {
    this.room = room;
    this.wall = wall;
    this.front = front;

    // Geometry properties
    this.offset = wall.thickness / 2;
    this.height = wall.height;

    // 3D rendering
    this.plane = null; // Three.js mesh (will be created in generatePlane)

    // Transformation matrices for texture/item placement
    // Note: These use THREE.Matrix4 (will be initialized when Three.js is integrated)
    this.interiorTransform = null; // new THREE.Matrix4()
    this.invInteriorTransform = null;
    this.exteriorTransform = null;
    this.invExteriorTransform = null;

    // Circular linked list pointers
    this.next = null; // Next edge in room
    this.prev = null; // Previous edge in room

    // Event callbacks
    this.redrawCallbacks = [];

    // Set edge reference on wall
    if (this.front) {
      this.wall.frontEdge = this;
    } else {
      this.wall.backEdge = this;
    }
  }

  /**
   * Get texture for this edge
   * @returns {Object} Texture configuration
   */
  getTexture() {
    return this.front ? this.wall.frontTexture : this.wall.backTexture;
  }

  /**
   * Set texture for this edge
   * @param {string} url - Texture URL
   * @param {boolean} stretch - Whether to stretch texture
   * @param {number} scale - Texture scale
   * @param {number} width - Texture width
   * @param {number} height - Texture height
   */
  setTexture(url, stretch, scale, width, height) {
    const textureConfig = {
      url,
      stretch,
      scale,
      width,
      height
    };

    if (this.front) {
      this.wall.frontTexture = textureConfig;
    } else {
      this.wall.backTexture = textureConfig;
    }

    // Fire redraw callbacks
    this.redrawCallbacks.forEach((callback) => {
      if (typeof callback === 'function') {
        callback();
      }
    });
  }

  /**
   * Get interior distance (length of wall segment)
   * @returns {number} Distance in meters
   */
  interiorDistance() {
    const start = this.interiorStart();
    const end = this.interiorEnd();
    return Utils.distance(start.x, start.y, end.x, end.y);
  }

  /**
   * Compute transformation matrices for wall plane
   * @param {THREE.Matrix4} matrix - Output matrix
   * @param {THREE.Matrix4} inverse - Output inverse matrix
   * @param {Object} start - Start point {x, y}
   * @param {Object} end - End point {x, y}
   */
  computeTransforms(matrix, inverse, start, end) {
    const angle = Utils.angle(1, 0, end.x - start.x, end.y - start.y);

    // Note: This will use THREE.Matrix4 when Three.js is integrated
    // For now, the logic is preserved for future integration

    // Translation matrix: move to origin
    // const translation = new THREE.Matrix4().makeTranslation(-start.x, 0, -start.y);

    // Rotation matrix: rotate to align with X axis
    // const rotation = new THREE.Matrix4().makeRotationY(-angle);

    // Combined transformation
    // matrix.multiplyMatrices(rotation, translation);

    // Inverse transformation
    // inverse.copy(matrix).invert();
  }

  /**
   * Calculate distance from point to this edge
   * @param {number} x - Point X
   * @param {number} y - Point Y
   * @returns {number} Distance
   */
  distanceTo(x, y) {
    const start = this.interiorStart();
    const end = this.interiorEnd();
    return Utils.pointDistanceFromLine(x, y, start.x, start.y, end.x, end.y);
  }

  /**
   * Get start corner (depends on front/back)
   * @returns {Corner} Start corner
   */
  getStart() {
    return this.front ? this.wall.getStart() : this.wall.getEnd();
  }

  /**
   * Get end corner (depends on front/back)
   * @returns {Corner} End corner
   */
  getEnd() {
    return this.front ? this.wall.getEnd() : this.wall.getStart();
  }

  /**
   * Get the opposite edge (front <-> back)
   * @returns {HalfEdge} Opposite edge
   */
  getOppositeEdge() {
    return this.front ? this.wall.backEdge : this.wall.frontEdge;
  }

  /**
   * Get interior end point (adjusted for wall thickness and angles)
   * @returns {{x: number, y: number}} Interior end point
   */
  interiorEnd() {
    const vector = this.halfAngleVector(this, this.next);
    return {
      x: this.getEnd().x + vector.x,
      y: this.getEnd().y + vector.y
    };
  }

  /**
   * Get interior start point (adjusted for wall thickness and angles)
   * @returns {{x: number, y: number}} Interior start point
   */
  interiorStart() {
    const vector = this.halfAngleVector(this.prev, this);
    return {
      x: this.getStart().x + vector.x,
      y: this.getStart().y + vector.y
    };
  }

  /**
   * Get interior center point
   * @returns {{x: number, y: number}} Center point
   */
  interiorCenter() {
    const start = this.interiorStart();
    const end = this.interiorEnd();
    return {
      x: (start.x + end.x) / 2,
      y: (start.y + end.y) / 2
    };
  }

  /**
   * Get exterior end point (adjusted for wall thickness)
   * @returns {{x: number, y: number}} Exterior end point
   */
  exteriorEnd() {
    const vector = this.halfAngleVector(this, this.next);
    return {
      x: this.getEnd().x - vector.x,
      y: this.getEnd().y - vector.y
    };
  }

  /**
   * Get exterior start point (adjusted for wall thickness)
   * @returns {{x: number, y: number}} Exterior start point
   */
  exteriorStart() {
    const vector = this.halfAngleVector(this.prev, this);
    return {
      x: this.getStart().x - vector.x,
      y: this.getStart().y - vector.y
    };
  }

  /**
   * Get all corner points for this edge (for rendering)
   * @returns {Array<{x: number, y: number}>} Corner points [interiorStart, interiorEnd, exteriorEnd, exteriorStart]
   */
  corners() {
    return [
      this.interiorStart(),
      this.interiorEnd(),
      this.exteriorEnd(),
      this.exteriorStart()
    ];
  }

  /**
   * Calculate half-angle vector for wall thickness offset
   * Complex geometric calculation to handle wall corners properly
   * @param {HalfEdge} prevEdge - Previous edge
   * @param {HalfEdge} nextEdge - Next edge
   * @returns {{x: number, y: number}} Offset vector
   */
  halfAngleVector(prevEdge, nextEdge) {
    let prevStartX, prevStartY, prevEndX, prevEndY;
    let nextStartX, nextStartY, nextEndX, nextEndY;

    // Get previous edge coordinates
    if (prevEdge) {
      prevStartX = prevEdge.getStart().x;
      prevStartY = prevEdge.getStart().y;
      prevEndX = prevEdge.getEnd().x;
      prevEndY = prevEdge.getEnd().y;
    } else {
      // Extend line backwards
      prevStartX = nextEdge.getStart().x - (nextEdge.getEnd().x - nextEdge.getStart().x);
      prevStartY = nextEdge.getStart().y - (nextEdge.getEnd().y - nextEdge.getStart().y);
      prevEndX = nextEdge.getStart().x;
      prevEndY = nextEdge.getStart().y;
    }

    // Get next edge coordinates
    if (nextEdge) {
      nextStartX = nextEdge.getStart().x;
      nextStartY = nextEdge.getStart().y;
      nextEndX = nextEdge.getEnd().x;
      nextEndY = nextEdge.getEnd().y;
    } else {
      // Extend line forwards
      nextStartX = prevEdge.getEnd().x;
      nextStartY = prevEdge.getEnd().y;
      nextEndX = prevEdge.getEnd().x + (prevEdge.getEnd().x - prevEdge.getStart().x);
      nextEndY = prevEdge.getEnd().y + (prevEdge.getEnd().y - prevEdge.getStart().y);
    }

    // Calculate angle between edges
    const angle = Utils.angle2pi(
      prevStartX - prevEndX,
      prevStartY - prevEndY,
      nextEndX - nextStartX,
      nextEndY - nextStartY
    );

    const cosHalfAngle = Math.cos(angle / 2);
    const sinHalfAngle = Math.sin(angle / 2);

    // Direction vector of next edge
    const dx = nextEndX - nextStartX;
    const dy = nextEndY - nextStartY;

    // Rotate direction vector by half angle
    const rotatedX = dx * cosHalfAngle - dy * sinHalfAngle;
    const rotatedY = dx * sinHalfAngle + dy * cosHalfAngle;

    // Normalize and scale by offset
    const length = Utils.distance(0, 0, rotatedX, rotatedY);
    const scaleFactor = this.offset / sinHalfAngle / length;

    return {
      x: rotatedX * scaleFactor,
      y: rotatedY * scaleFactor
    };
  }

  /**
   * Generate 3D plane mesh for this wall edge
   * Creates a rectangular mesh from interior/exterior corners
   * Note: Requires Three.js integration
   */
  generatePlane() {
    // This method will create a Three.js mesh when integrated
    // Preserved for future Three.js integration

    /*
    const vec3 = (point) => new THREE.Vector3(point.x, 0, point.y);

    const v1 = vec3(this.interiorStart());
    const v2 = vec3(this.interiorEnd());
    const v3 = v2.clone();
    v3.y = this.wall.height;
    const v4 = v1.clone();
    v4.y = this.wall.height;

    const geometry = new THREE.Geometry();
    geometry.vertices = [v1, v2, v3, v4];
    geometry.faces.push(new THREE.Face3(0, 1, 2));
    geometry.faces.push(new THREE.Face3(0, 2, 3));
    geometry.computeFaceNormals();
    geometry.computeBoundingBox();

    this.plane = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial());
    this.plane.visible = false;
    this.plane.edge = this;

    this.computeTransforms(
      this.interiorTransform,
      this.invInteriorTransform,
      this.interiorStart(),
      this.interiorEnd()
    );

    this.computeTransforms(
      this.exteriorTransform,
      this.invExteriorTransform,
      this.exteriorStart(),
      this.exteriorEnd()
    );
    */
  }
}

export default HalfEdge;
