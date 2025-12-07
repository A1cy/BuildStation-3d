/**
 * Wall - Represents a wall entity in the floor plan
 * Connects two corners and manages wall-mounted items
 */

import Utils from '../Utils';
import Configuration, { CONFIG_KEYS } from '../Configuration';

class Wall {
  /**
   * Create a new wall between two corners
   * @param {Corner} start - Starting corner
   * @param {Corner} end - Ending corner
   */
  constructor(start, end) {
    // Wall endpoints
    this.start = start;
    this.end = end;

    // Wall properties
    this.id = this.getUuid();
    this.thickness = Configuration.getNumericValue(CONFIG_KEYS.WALL_THICKNESS);
    this.height = Configuration.getNumericValue(CONFIG_KEYS.WALL_HEIGHT);
    this.locked = false;
    this.orphan = false;

    // Wall edges (front and back)
    this.frontEdge = null;
    this.backEdge = null;

    // Textures
    this.frontTexture = {
      url: `${Configuration.getStringValue(CONFIG_KEYS.DEFAULT_PATH_PREFIX)}/rooms/textures/blank.png`,
      stretch: true,
      scale: 0
    };
    this.backTexture = { ...this.frontTexture };

    // Wall-mounted items (doors, windows, etc.)
    this.items = [];
    this.onItems = [];

    // Event callbacks
    this.moved_callbacks = [];
    this.deleted_callbacks = [];
    this.action_callbacks = [];

    // Attach to corners
    this.start.attachStart(this);
    this.end.attachEnd(this);

    // Listen for corner movements
    this.start.moved_callbacks.push(this.handleStartMoved);
    this.end.moved_callbacks.push(this.handleEndMoved);
  }

  /**
   * Generate unique ID for this wall
   */
  getUuid() {
    return [this.start.id, this.end.id].join();
  }

  /**
   * Reset front/back edge references
   */
  resetFrontBack() {
    this.frontEdge = null;
    this.backEdge = null;
    this.orphan = false;
  }

  /**
   * Snap wall to axis (horizontal/vertical alignment)
   * @param {number} tolerance - Snap tolerance in meters (default 0.25)
   */
  snapToAxis(tolerance = 0.25) {
    this.start.snapToAxis(tolerance);
    this.end.snapToAxis(tolerance);
  }

  /**
   * Register callback for wall movement
   * @param {Function} callback - Callback function
   */
  fireOnMove(callback) {
    this.moved_callbacks.push(callback);
  }

  /**
   * Register callback for wall deletion
   * @param {Function} callback - Callback function
   */
  fireOnDelete(callback) {
    this.deleted_callbacks.push(callback);
  }

  /**
   * Unregister deletion callback
   * @param {Function} callback - Callback to remove
   */
  dontFireOnDelete(callback) {
    const index = this.deleted_callbacks.indexOf(callback);
    if (index > -1) {
      this.deleted_callbacks.splice(index, 1);
    }
  }

  /**
   * Register callback for wall actions
   * @param {Function} callback - Callback function
   */
  fireOnAction(callback) {
    this.action_callbacks.push(callback);
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
   * Handle start corner movement
   */
  handleStartMoved = (x, y, prevX, prevY) => {
    const moveData = {
      prev: {
        start: { x: prevX, y: prevY },
        end: { x: this.getEndX(), y: this.getEndY() }
      },
      current: {
        start: { x, y },
        end: { x: this.getEndX(), y: this.getEndY() }
      }
    };
    this.moveWallItems(moveData);
  };

  /**
   * Handle end corner movement
   */
  handleEndMoved = (x, y, prevX, prevY) => {
    const moveData = {
      prev: {
        start: { x: this.getStartX(), y: this.getStartY() },
        end: { x: prevX, y: prevY }
      },
      current: {
        start: { x: this.getStartX(), y: this.getStartY() },
        end: { x, y }
      }
    };
    this.moveWallItems(moveData);
  };

  /**
   * Move wall relatively
   * @param {number} dx - Delta X
   * @param {number} dy - Delta Y
   */
  relativeMove(dx, dy) {
    if (this.locked || this.start.locked || this.end.locked) {
      return;
    }

    // Move both corners
    this.start.move(this.getStartX() + dx, this.getStartY() + dy, false);
    this.end.move(this.getEndX() + dx, this.getEndY() + dy, false);

    const moveData = {
      prev: {
        start: { x: this.getStartX(), y: this.getStartY() },
        end: { x: this.getEndX(), y: this.getEndY() }
      }
    };

    // Snap to axis
    this.snapToAxis();

    moveData.current = {
      start: { x: this.getStartX(), y: this.getStartY() },
      end: { x: this.getEndX(), y: this.getEndY() }
    };

    this.moveWallItems(moveData);
  }

  /**
   * Move wall-mounted items with the wall
   * @param {Object} moveData - Movement data with prev and current positions
   */
  moveWallItems(moveData) {
    if (!this.items.length) return;

    const { prev, current } = moveData;

    this.items.forEach((item) => {
      const position = item.position;

      // Calculate item's position along the wall (0-1)
      const prevLength = Math.sqrt(
        Math.pow(prev.start.x - prev.end.x, 2) +
        Math.pow(prev.start.y - prev.end.y, 2)
      );

      const distFromStart = Math.sqrt(
        Math.pow(prev.start.x - position.x, 2) +
        Math.pow(prev.start.y - position.z, 2)
      );

      const ratio = distFromStart / prevLength;

      // Calculate new position
      const newX = current.start.x + (current.end.x - current.start.x) * ratio;
      const newZ = current.start.y + (current.end.y - current.start.y) * ratio;

      const dx = newX - position.x;
      const dz = newZ - position.z;

      item.relativeMove(dx, dz);

      // Rotate item if wall angle changed
      // (Using Three.js Vector3 - will be imported when Three.js integration is complete)
      // const prevVector = new THREE.Vector3(prev.end.x - prev.start.x, 0, prev.end.y - prev.start.y);
      // const currVector = new THREE.Vector3(current.end.x - current.start.x, 0, current.end.y - current.start.y);
      // const cross = new THREE.Vector3().copy(prevVector).cross(currVector);
      // let angle = prevVector.angleTo(currVector);
      // if (cross.y < 0) angle = -angle;
      // item.rotation.y += angle;
      // item.dimensionHelper.rotation.y += angle;
    });
  }

  /**
   * Fire moved event
   */
  fireMoved() {
    this.moved_callbacks.forEach((callback) => {
      if (typeof callback === 'function') {
        callback();
      }
    });
  }

  /**
   * Fire redraw event for edges
   */
  fireRedraw() {
    if (this.frontEdge) {
      this.frontEdge.redrawCallbacks.forEach((callback) => {
        if (typeof callback === 'function') {
          callback();
        }
      });
    }

    if (this.backEdge) {
      this.backEdge.redrawCallbacks.forEach((callback) => {
        if (typeof callback === 'function') {
          callback();
        }
      });
    }
  }

  // Getters
  getStart() { return this.start; }
  getEnd() { return this.end; }
  getStartX() { return this.start.getX(); }
  getEndX() { return this.end.getX(); }
  getStartY() { return this.start.getY(); }
  getEndY() { return this.end.getY(); }

  /**
   * Remove wall from floor plan
   */
  remove() {
    this.start.detachWall(this);
    this.end.detachWall(this);

    this.deleted_callbacks.forEach((callback) => {
      if (typeof callback === 'function') {
        callback(this);
      }
    });
  }

  /**
   * Change wall's start corner
   * @param {Corner} corner - New start corner
   */
  setStart(corner) {
    this.start.detachWall(this);
    corner.attachStart(this);
    this.start = corner;
    this.fireMoved();
  }

  /**
   * Change wall's end corner
   * @param {Corner} corner - New end corner
   */
  setEnd(corner) {
    this.end.detachWall(this);
    corner.attachEnd(this);
    this.end = corner;
    this.fireMoved();
  }

  /**
   * Calculate distance from point to wall
   * @param {number} x - Point X
   * @param {number} y - Point Y
   * @returns {number} Distance
   */
  distanceFrom(x, y) {
    return Utils.pointDistanceFromLine(
      x, y,
      this.getStartX(), this.getStartY(),
      this.getEndX(), this.getEndY()
    );
  }

  /**
   * Get the corner opposite to the given one
   * @param {Corner} corner - Reference corner
   * @returns {Corner} Opposite corner
   */
  oppositeCorner(corner) {
    if (this.start === corner) {
      return this.end;
    } else if (this.end === corner) {
      return this.start;
    } else {
      console.log('Wall does not connect to corner');
      return null;
    }
  }

  /**
   * Lock/unlock wall movement
   * @param {boolean} locked - Lock state
   */
  setLocked(locked) {
    this.locked = locked;
    this.start.setLocked(locked);
    this.end.setLocked(locked);
  }

  /**
   * Get wall center point
   * @returns {{x: number, y: number}} Center point
   */
  getWallCenter() {
    const x = this.start.x;
    const y = this.start.y;

    return {
      x: (x + this.end.x) / 2,
      y: (y + this.end.y) / 2
    };
  }

  /**
   * Get wall length in meters
   * @returns {number} Length
   */
  getWallLength() {
    const x1 = this.start.x;
    const y1 = this.start.y;
    const x2 = this.end.x;
    const y2 = this.end.y;

    return Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2));
  }

  /**
   * Set wall length (resize wall)
   * @param {number} length - New length in meters
   */
  setWallLength(length) {
    if (length <= 0) return;

    const ratio = length / this.getWallLength();
    let anchor = { x: 0, y: 0 };

    // Determine anchor point based on locked corners
    if (this.start.locked || this.end.locked) {
      if (this.start.locked && !this.end.locked) {
        anchor = { x: this.getStartX(), y: this.getStartY() };
      } else if (!this.start.locked && this.end.locked) {
        anchor = { x: this.getEndX(), y: this.getEndY() };
      } else {
        return; // Both locked, can't resize
      }
    } else {
      // Use wall center as anchor
      anchor = this.getWallCenter();
    }

    // Calculate new corner positions
    let newStartX = anchor.x + (this.start.x - anchor.x) * ratio;
    let newStartY = anchor.y + (this.start.y - anchor.y) * ratio;
    this.start.move(newStartX, newStartY, false);

    let newEndX = anchor.x + (this.end.x - anchor.x) * ratio;
    let newEndY = anchor.y + (this.end.y - anchor.y) * ratio;
    this.end.move(newEndX, newEndY, false);
  }
}

export default Wall;
