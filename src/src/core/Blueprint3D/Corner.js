/**
 * Corner - Represents a corner/vertex in the floor plan
 * Connects walls and handles wall intersection logic
 */

import Utils from '../Utils';

class Corner {
  /**
   * Create a new corner
   * @param {Floorplan} floorplan - Parent floor plan
   * @param {number} x - X coordinate in meters
   * @param {number} y - Y coordinate in meters
   * @param {string} id - Optional corner ID
   */
  constructor(floorplan, x, y, id) {
    this.floorplan = floorplan;
    this.x = x;
    this.y = y;
    this.id = id || Utils.guid();

    // Walls connected to this corner
    this.wallStarts = []; // Walls that start from this corner
    this.wallEnds = [];   // Walls that end at this corner

    // Event callbacks
    this.moved_callbacks = [];
    this.deleted_callbacks = [];
    this.action_callbacks = [];

    // Lock state
    this.locked = false;
  }

  /**
   * Register callback for corner movement
   * @param {Function} callback - Callback function
   */
  fireOnMove(callback) {
    this.moved_callbacks.push(callback);
  }

  /**
   * Register callback for corner deletion
   * @param {Function} callback - Callback function
   */
  fireOnDelete(callback) {
    this.deleted_callbacks.push(callback);
  }

  /**
   * Register callback for corner actions
   * @param {Function} callback - Callback function
   */
  fireOnAction(callback) {
    this.action_callbacks.push(callback);
  }

  // Getters
  getX() { return this.x; }
  getY() { return this.y; }

  /**
   * Snap corner to adjacent corner axes (horizontal/vertical alignment)
   * @param {number} tolerance - Snap tolerance in meters (default 0.25)
   * @returns {{x: boolean, y: boolean}} Snap status
   */
  snapToAxis(tolerance = 0.25) {
    const snapped = { x: false, y: false };
    const adjacentCorners = this.adjacentCorners();

    adjacentCorners.forEach((corner) => {
      if (Math.abs(corner.x - this.x) < tolerance) {
        this.x = corner.x;
        snapped.x = true;
      }
      if (Math.abs(corner.y - this.y) < tolerance) {
        this.y = corner.y;
        snapped.y = true;
      }
    });

    return snapped;
  }

  /**
   * Move corner relatively
   * @param {number} dx - Delta X
   * @param {number} dy - Delta Y
   */
  relativeMove(dx, dy) {
    if (!this.locked) {
      this.move(this.x + dx, this.y + dy);
    }
  }

  /**
   * Fire action event
   * @param {string} action - Action name
   */
  fireAction(action) {
    this.action_callbacks.forEach((callback) => {
      if (typeof callback === 'function') {
        callback(action);
      }
    });
  }

  /**
   * Remove corner from floor plan
   */
  remove() {
    this.deleted_callbacks.forEach((callback) => {
      if (typeof callback === 'function') {
        callback(this);
      }
    });
  }

  /**
   * Remove corner and all connected walls
   */
  removeAll() {
    // Remove all walls starting from this corner
    for (let i = 0; i < this.wallStarts.length; i++) {
      this.wallStarts[i].remove();
    }

    // Remove all walls ending at this corner
    for (let i = 0; i < this.wallEnds.length; i++) {
      this.wallEnds[i].remove();
    }

    this.remove();
  }

  /**
   * Move corner to new position
   * @param {number} x - New X coordinate
   * @param {number} y - New Y coordinate
   * @param {boolean} snapToAxis - Whether to snap to axis (default true)
   */
  move(x, y, snapToAxis = true) {
    if (this.locked) return;

    const prevX = this.x;
    const prevY = this.y;

    this.x = x;
    this.y = y;

    // Try to merge with intersected corners/walls
    this.mergeWithIntersected();

    // Snap to adjacent corner axes
    if (snapToAxis) {
      this.snapToAxis();
    }

    // Fire moved callbacks
    this.moved_callbacks.forEach((callback) => {
      if (typeof callback === 'function') {
        callback(this.x, this.y, prevX, prevY);
      }
    });

    // Notify connected walls
    this.wallStarts.forEach((wall) => {
      wall.fireMoved();
    });

    this.wallEnds.forEach((wall) => {
      wall.fireMoved();
    });
  }

  /**
   * Get all corners adjacent to this one (connected by walls)
   * @returns {Array<Corner>} Adjacent corners
   */
  adjacentCorners() {
    const corners = [];

    // Add end corners of walls starting from this corner
    for (let i = 0; i < this.wallStarts.length; i++) {
      corners.push(this.wallStarts[i].getEnd());
    }

    // Add start corners of walls ending at this corner
    for (let i = 0; i < this.wallEnds.length; i++) {
      corners.push(this.wallEnds[i].getStart());
    }

    return corners;
  }

  /**
   * Check if a wall is connected to this corner
   * @param {Wall} wall - Wall to check
   * @returns {boolean} True if connected
   */
  isWallConnected(wall) {
    for (let i = 0; i < this.wallStarts.length; i++) {
      if (this.wallStarts[i] === wall) return true;
    }

    for (let i = 0; i < this.wallEnds.length; i++) {
      if (this.wallEnds[i] === wall) return true;
    }

    return false;
  }

  /**
   * Calculate distance from this corner to a point
   * @param {number} x - Point X
   * @param {number} y - Point Y
   * @returns {number} Distance
   */
  distanceFrom(x, y) {
    return Utils.distance(x, y, this.x, this.y);
  }

  /**
   * Calculate distance from this corner to a wall
   * @param {Wall} wall - Wall
   * @returns {number} Distance
   */
  distanceFromWall(wall) {
    return wall.distanceFrom(this.x, this.y);
  }

  /**
   * Calculate distance from this corner to another corner
   * @param {Corner} corner - Other corner
   * @returns {number} Distance
   */
  distanceFromCorner(corner) {
    return this.distanceFrom(corner.x, corner.y);
  }

  /**
   * Detach wall from this corner
   * @param {Wall} wall - Wall to detach
   */
  detachWall(wall) {
    Utils.removeValue(this.wallStarts, wall);
    Utils.removeValue(this.wallEnds, wall);

    // Remove corner if no walls connected
    if (this.wallStarts.length === 0 && this.wallEnds.length === 0) {
      this.remove();
    }
  }

  /**
   * Attach wall that starts from this corner
   * @param {Wall} wall - Wall to attach
   */
  attachStart(wall) {
    this.wallStarts.push(wall);
  }

  /**
   * Attach wall that ends at this corner
   * @param {Wall} wall - Wall to attach
   */
  attachEnd(wall) {
    this.wallEnds.push(wall);
  }

  /**
   * Get wall from this corner to another corner
   * @param {Corner} corner - Target corner
   * @returns {Wall|null} Wall or null if not found
   */
  wallTo(corner) {
    for (let i = 0; i < this.wallStarts.length; i++) {
      if (this.wallStarts[i].getEnd() === corner) {
        return this.wallStarts[i];
      }
    }
    return null;
  }

  /**
   * Get wall from another corner to this corner
   * @param {Corner} corner - Source corner
   * @returns {Wall|null} Wall or null if not found
   */
  wallFrom(corner) {
    for (let i = 0; i < this.wallEnds.length; i++) {
      if (this.wallEnds[i].getStart() === corner) {
        return this.wallEnds[i];
      }
    }
    return null;
  }

  /**
   * Get wall connecting this corner to another (either direction)
   * @param {Corner} corner - Other corner
   * @returns {Wall|null} Wall or null if not found
   */
  wallToOrFrom(corner) {
    return this.wallTo(corner) || this.wallFrom(corner);
  }

  /**
   * Combine this corner with another (merge)
   * @param {Corner} corner - Corner to merge with
   */
  combineWithCorner(corner) {
    // Move to corner's position
    this.x = corner.x;
    this.y = corner.y;

    // Transfer all walls from corner to this corner
    for (let i = corner.wallStarts.length - 1; i >= 0; i--) {
      corner.wallStarts[i].setStart(this);
    }

    for (let i = corner.wallEnds.length - 1; i >= 0; i--) {
      corner.wallEnds[i].setEnd(this);
    }

    // Remove merged corner
    corner.removeAll();

    // Clean up duplicate walls
    this.removeDuplicateWalls();

    // Update floor plan
    this.floorplan.update();
  }

  /**
   * Try to merge with intersected corners or walls
   * @returns {boolean} True if merged
   */
  mergeWithIntersected() {
    const corners = this.floorplan.getCorners();
    const walls = this.floorplan.getWalls();

    // Check for corner intersection
    for (let i = 0; i < corners.length; i++) {
      const corner = corners[i];
      if (this.distanceFromCorner(corner) < 0.2 && corner !== this) {
        this.combineWithCorner(corner);
        return true;
      }
    }

    // Check for wall intersection
    for (let i = 0; i < walls.length; i++) {
      const wall = walls[i];
      if (this.distanceFromWall(wall) < 0.2 && !this.isWallConnected(wall)) {
        // Snap to nearest point on wall
        const closestPoint = Utils.closestPointOnLine(
          this.x, this.y,
          wall.getStart().x, wall.getStart().y,
          wall.getEnd().x, wall.getEnd().y
        );

        this.x = closestPoint.x;
        this.y = closestPoint.y;

        // Split wall at this corner
        this.floorplan.newWall(this, wall.getEnd());
        wall.setEnd(this);

        this.floorplan.update();
        return true;
      }
    }

    return false;
  }

  /**
   * Remove duplicate walls (walls connecting to the same corners)
   */
  removeDuplicateWalls() {
    const startedWalls = {};
    const endedWalls = {};

    // Remove duplicate walls that start from this corner
    for (let i = this.wallStarts.length - 1; i >= 0; i--) {
      const wall = this.wallStarts[i];
      const endCorner = wall.getEnd();

      if (endCorner === this || endCorner.id in startedWalls) {
        wall.remove();
      } else {
        startedWalls[endCorner.id] = true;
      }
    }

    // Remove duplicate walls that end at this corner
    for (let i = this.wallEnds.length - 1; i >= 0; i--) {
      const wall = this.wallEnds[i];
      const startCorner = wall.getStart();

      if (startCorner === this || startCorner.id in endedWalls) {
        wall.remove();
      } else {
        endedWalls[startCorner.id] = true;
      }
    }
  }

  /**
   * Lock/unlock corner movement
   * @param {boolean} locked - Lock state
   */
  setLocked(locked) {
    this.locked = locked;
  }
}

// Add removeValue utility method to Utils if not already present
if (!Utils.removeValue) {
  Utils.removeValue = (array, value) => {
    const index = array.indexOf(value);
    if (index > -1) {
      array.splice(index, 1);
    }
  };
}

export default Corner;
