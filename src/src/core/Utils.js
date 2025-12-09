/**
 * Utils - Geometric calculation utilities for Build-Station 3D
 * Provides helper methods for 2D geometry calculations
 */

class Utils {
  /**
   * Calculate distance from a point to a line segment
   * @param {number} x - Point X coordinate
   * @param {number} y - Point Y coordinate
   * @param {number} x1 - Line start X
   * @param {number} y1 - Line start Y
   * @param {number} x2 - Line end X
   * @param {number} y2 - Line end Y
   * @returns {number} Distance from point to line
   */
  static pointDistanceFromLine(x, y, x1, y1, x2, y2) {
    const closest = this.closestPointOnLine(x, y, x1, y1, x2, y2);
    const dx = x - closest.x;
    const dy = y - closest.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * Find closest point on a line segment to a given point
   * @param {number} x - Point X coordinate
   * @param {number} y - Point Y coordinate
   * @param {number} x1 - Line start X
   * @param {number} y1 - Line start Y
   * @param {number} x2 - Line end X
   * @param {number} y2 - Line end Y
   * @returns {{x: number, y: number}} Closest point on line
   */
  static closestPointOnLine(x, y, x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const t = ((x - x1) * dx + (y - y1) * dy) / (dx * dx + dy * dy);

    let closestX, closestY;

    if (t < 0 || (x1 === x2 && y1 === y2)) {
      // Before line start
      closestX = x1;
      closestY = y1;
    } else if (t > 1) {
      // After line end
      closestX = x2;
      closestY = y2;
    } else {
      // On the line
      closestX = x1 + t * dx;
      closestY = y1 + t * dy;
    }

    return { x: closestX, y: closestY };
  }

  /**
   * Calculate distance between two points
   * @param {number} x1 - First point X
   * @param {number} y1 - First point Y
   * @param {number} x2 - Second point X
   * @param {number} y2 - Second point Y
   * @returns {number} Distance between points
   */
  static distance(x1, y1, x2, y2) {
    return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
  }

  /**
   * Calculate angle between two vectors
   * @param {number} x1 - First vector X
   * @param {number} y1 - First vector Y
   * @param {number} x2 - Second vector X
   * @param {number} y2 - Second vector Y
   * @returns {number} Angle in radians
   */
  static angle(x1, y1, x2, y2) {
    const dot = x1 * x2 + y1 * y2;
    const det = x1 * y2 - y1 * x2;
    return -Math.atan2(det, dot);
  }

  /**
   * Calculate angle between two vectors, normalized to 0-2π
   * @param {number} x1 - First vector X
   * @param {number} y1 - First vector Y
   * @param {number} x2 - Second vector X
   * @param {number} y2 - Second vector Y
   * @returns {number} Angle in radians (0 to 2π)
   */
  static angle2pi(x1, y1, x2, y2) {
    let angle = this.angle(x1, y1, x2, y2);
    if (angle < 0) {
      angle += 2 * Math.PI;
    }
    return angle;
  }

  /**
   * Determine if polygon vertices are in clockwise order
   * @param {Array<{x: number, y: number}>} vertices - Array of vertex points
   * @returns {boolean} True if clockwise
   */
  static isClockwise(vertices) {
    const minX = Math.min(0, Math.min(...Utils.map(vertices, v => v.x)));
    const minY = Math.min(0, Math.min(...Utils.map(vertices, v => v.y)));

    // Translate polygon to ensure all coords are positive
    const translated = Utils.map(vertices, v => ({
      x: v.x - minX,
      y: v.y - minY
    }));

    // Calculate signed area
    let area = 0;
    for (let i = 0; i < translated.length; i++) {
      const current = translated[i];
      const next = i === translated.length - 1 ? translated[0] : translated[i + 1];
      area += (next.x - current.x) * (next.y + current.y);
    }

    return area >= 0;
  }

  /**
   * Generate a unique identifier (GUID)
   * @returns {string} Unique identifier
   */
  static guid() {
    const s4 = () => {
      return Math.floor((1 + Math.random()) * 0x10000)
        .toString(16)
        .slice(1);
    };

    return `${s4()}${s4()}-${s4()}-${s4()}-${s4()}-${s4()}${s4()}${s4()}`;
  }

  /**
   * Check if two polygons intersect
   * @param {Array<{x: number, y: number}>} polygon1 - First polygon
   * @param {Array<{x: number, y: number}>} polygon2 - Second polygon
   * @returns {boolean} True if polygons intersect
   */
  static polygonPolygonIntersect(polygon1, polygon2) {
    for (let i = 0; i < polygon1.length; i++) {
      const current = polygon1[i];
      const next = i === polygon1.length - 1 ? polygon1[0] : polygon1[i + 1];

      if (this.linePolygonIntersect(current.x, current.y, next.x, next.y, polygon2)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Check if a line segment intersects with a polygon
   * @param {number} x1 - Line start X
   * @param {number} y1 - Line start Y
   * @param {number} x2 - Line end X
   * @param {number} y2 - Line end Y
   * @param {Array<{x: number, y: number}>} polygon - Polygon vertices
   * @returns {boolean} True if line intersects polygon
   */
  static linePolygonIntersect(x1, y1, x2, y2, polygon) {
    for (let i = 0; i < polygon.length; i++) {
      const current = polygon[i];
      const next = i === polygon.length - 1 ? polygon[0] : polygon[i + 1];

      if (this.lineLineIntersect(x1, y1, x2, y2, current.x, current.y, next.x, next.y)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Check if two line segments intersect
   * @param {number} x1 - First line start X
   * @param {number} y1 - First line start Y
   * @param {number} x2 - First line end X
   * @param {number} y2 - First line end Y
   * @param {number} x3 - Second line start X
   * @param {number} y3 - Second line start Y
   * @param {number} x4 - Second line end X
   * @param {number} y4 - Second line end Y
   * @returns {boolean} True if lines intersect
   */
  static lineLineIntersect(x1, y1, x2, y2, x3, y3, x4, y4) {
    const denom = (y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1);
    if (denom === 0) {
      return false; // Parallel lines
    }

    const ua = ((x4 - x3) * (y1 - y3) - (y4 - y3) * (x1 - x3)) / denom;
    const ub = ((x2 - x1) * (y1 - y3) - (y2 - y1) * (x1 - x3)) / denom;

    return ua >= 0 && ua <= 1 && ub >= 0 && ub <= 1;
  }

  /**
   * Map array values using a function (functional helper)
   * @param {Array} array - Input array
   * @param {Function} fn - Mapping function
   * @returns {Array} Mapped array
   */
  static map(array, fn) {
    return array.map(fn);
  }

  /**
   * Remove a value from an array
   * @param {Array} array - Array to modify
   * @param {*} value - Value to remove
   */
  static removeValue(array, value) {
    const index = array.indexOf(value);
    if (index > -1) {
      array.splice(index, 1);
    }
  }

  /**
   * Check if array has a value
   * @param {Array} array - Array to check
   * @param {*} value - Value to find
   * @returns {boolean} True if value exists
   */
  static hasValue(array, value) {
    return array.indexOf(value) > -1;
  }

  /**
   * Cycle array elements (rotate)
   * @param {Array} array - Input array
   * @param {number} shift - Number of positions to shift
   * @returns {Array} Rotated array
   */
  static cycle(array, shift) {
    const result = [];
    for (let i = 0; i < array.length; i++) {
      result.push(array[(i + shift) % array.length]);
    }
    return result;
  }

  /**
   * Remove elements from array that match a predicate
   * @param {Array} array - Array to filter
   * @param {Function} predicate - Test function
   * @returns {Array} Filtered array
   */
  static removeIf(array, predicate) {
    return array.filter((element) => !predicate(element));
  }

  /**
   * Test if a point is inside a polygon
   * @param {number} x - Point X coordinate
   * @param {number} y - Point Y coordinate
   * @param {Array<{x: number, y: number}>} polygon - Polygon vertices
   * @returns {boolean} True if point is inside polygon
   */
  static pointInPolygon(x, y, polygon) {
    let inside = false;

    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const xi = polygon[i].x;
      const yi = polygon[i].y;
      const xj = polygon[j].x;
      const yj = polygon[j].y;

      const intersect =
        yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;

      if (intersect) inside = !inside;
    }

    return inside;
  }

  /**
   * **PHASE 2A Priority 2: Collision Detection**
   * Check if polygon1 is completely inside polygon2
   * @param {Array<{x: number, y: number}>} polygon1 - Inner polygon
   * @param {Array<{x: number, y: number}>} polygon2 - Outer polygon
   * @returns {boolean} True if polygon1 is completely inside polygon2
   */
  static polygonInsidePolygon(polygon1, polygon2) {
    // Check if all points of polygon1 are inside polygon2
    for (let i = 0; i < polygon1.length; i++) {
      const point = polygon1[i];
      if (!this.pointInPolygon(point.x, point.y, polygon2)) {
        return false;
      }
    }
    return true;
  }

  /**
   * **PHASE 2A Priority 2: Collision Detection**
   * Check if polygon1 is completely outside polygon2 (no overlap)
   * @param {Array<{x: number, y: number}>} polygon1 - First polygon
   * @param {Array<{x: number, y: number}>} polygon2 - Second polygon
   * @returns {boolean} True if polygon1 is completely outside polygon2
   */
  static polygonOutsidePolygon(polygon1, polygon2) {
    // Check if any point of polygon1 is inside polygon2
    for (let i = 0; i < polygon1.length; i++) {
      const point = polygon1[i];
      if (this.pointInPolygon(point.x, point.y, polygon2)) {
        return false; // At least one point is inside
      }
    }
    return true; // All points are outside
  }
}

export default Utils;
