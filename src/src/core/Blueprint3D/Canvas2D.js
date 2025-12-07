/**
 * Canvas2D - 2D drawing engine for floor plan visualization
 * Handles all canvas rendering: grid, rooms, walls, corners, items, rulers
 */

import Configuration, { CONFIG_KEYS, BP3D_EVENTS } from '../Configuration';
import Dimensioning from '../Dimensioning';
import Utils from '../Utils';

// Drawing modes
export const MODES = {
  MOVE: 0,
  DRAW: 1,
  DELETE: 2
};

// Color constants
const COLORS = {
  GRID: '#f1f1f1',
  TARGET_LINE: '#008cba',
  ACTIVE: '#008cba',
  DELETE: '#ff0000',
  ACTIVE_CORNER: '#00ff00',
  BLACK: '#000',
  WALL: '#888888',
  WALL_FILL: '#888',
  ROOM_FILL: '#f9f9f9',
  CORNER_DEFAULT: '#cccccc'
};

class Canvas2D {
  /**
   * Initialize Canvas2D renderer
   * @param {Object} floorplan - Floor plan model
   * @param {Object} viewmodel - View model with camera/interaction state
   * @param {HTMLCanvasElement} canvas - Canvas DOM element
   */
  constructor(floorplan, viewmodel, canvas) {
    this.floorplan = floorplan;
    this.viewmodel = viewmodel;
    this.canvas = canvas;
    this.canvasElement = canvas;
    this.context = this.canvasElement.getContext('2d');

    // Bind window resize handler
    window.addEventListener('resize', () => {
      this.handleWindowResize();
    });

    this.handleWindowResize();

    // Listen for configuration changes
    document.addEventListener(BP3D_EVENTS.CONFIG_CHANGED, (e) => {
      const detail = e.detail;
      if (detail && detail.hasOwnProperty(CONFIG_KEYS.DIMENSION_VISIBLE)) {
        this.draw();
      }
    });
  }

  /**
   * Handle window resize - update canvas dimensions
   */
  handleWindowResize = () => {
    const canvas = this.canvas;
    const parent = canvas.parentNode;

    canvas.height = parent.clientHeight;
    canvas.width = parent.clientWidth;
    this.canvasElement.height = parent.clientHeight;
    this.canvasElement.width = parent.clientWidth;

    this.draw();
  };

  /**
   * Main draw function - render entire floor plan
   */
  draw = () => {
    // Clear canvas
    this.context.clearRect(0, 0, this.canvasElement.width, this.canvasElement.height);

    // Draw in layer order
    this.drawGrid();

    // Draw rooms
    this.floorplan.getRooms().forEach((room) => {
      this.drawRoom(room);
    });

    // Draw walls
    this.floorplan.getWalls().forEach((wall) => {
      this.drawWall(wall);
    });

    // Draw corners
    this.floorplan.getCorners().forEach((corner) => {
      this.drawCorner(corner);
    });

    // Draw items (furniture)
    this.floorplan.getItems().forEach((item) => {
      this.drawItem(item);
      this.drawItemLabel(
        { x: item.position.x, y: item.position.z },
        item.metadata.name
      );
    });

    // Draw target in draw mode
    if (this.viewmodel.mode === MODES.DRAW) {
      this.drawTarget(
        this.viewmodel.targetX,
        this.viewmodel.targetY,
        this.viewmodel.lastNode
      );
    }

    // Draw wall labels
    this.floorplan.getWalls().forEach((wall) => {
      this.drawWallLabels(wall);
    });

    // Draw dimension rulers if enabled
    if (Configuration.getBooleanValue(CONFIG_KEYS.DIMENSION_VISIBLE)) {
      this.drawDimensionRulers();
    }
  };

  /**
   * Draw dimension rulers for the floor plan
   */
  drawDimensionRulers() {
    let minX = Infinity;
    let minY = Infinity;

    this.floorplan.getCorners().forEach((corner) => {
      if (corner.getX() < minX) minX = corner.getX();
      if (corner.getY() < minY) minY = corner.getY();
    });

    minX = this.viewmodel.convertX(minX) - 50;
    minY = this.viewmodel.convertY(minY) - 50;

    const rulerData = this.floorplan.calculateRulerData();

    rulerData.x.forEach((ruler) => {
      this.drawRuler(ruler.start, ruler.end, ruler.length, 'x', minY);
    });

    rulerData.y.forEach((ruler) => {
      this.drawRuler(ruler.start, ruler.end, ruler.length, 'y', minX);
    });
  }

  /**
   * Draw a dimension ruler line
   * @param {Object} start - Start point {x, y}
   * @param {Object} end - End point {x, y}
   * @param {number} length - Length value
   * @param {string} axis - 'x' or 'y'
   * @param {number} offset - Offset from edge
   */
  drawRuler(start, end, length, axis, offset) {
    if (length < 0.01) return;

    // Convert to screen coordinates
    start = {
      x: this.viewmodel.convertX(start.x),
      y: this.viewmodel.convertY(start.y)
    };
    end = {
      x: this.viewmodel.convertX(end.x),
      y: this.viewmodel.convertY(end.y)
    };

    // Create offset points
    const offsetStart = { ...start };
    const offsetEnd = { ...end };

    if (axis === 'x') {
      offsetStart.y = offset;
      offsetEnd.y = offset;
    } else {
      offsetStart.x = offset;
      offsetEnd.x = offset;
    }

    // Draw ruler lines
    const color = axis === 'x' ? '#f00' : '#00f';

    // Main ruler line
    this.drawLine(offsetStart.x, offsetStart.y, offsetEnd.x, offsetEnd.y, 1, color, false);

    // Connector lines (dashed)
    this.drawLine(offsetStart.x, offsetStart.y, start.x, start.y, 1, color, true);
    this.drawLine(end.x, end.y, offsetEnd.x, offsetEnd.y, 1, color, true);

    // Draw arrow heads
    this.drawRulerArrows(offsetStart, offsetEnd, axis, color);

    // Draw measurement label
    this.drawItemLabel(
      {
        x: (offsetStart.x + offsetEnd.x) / 2,
        y: (offsetStart.y + offsetEnd.y) / 2
      },
      Dimensioning.cmToMeasure(100 * length),
      20,
      false,
      axis === 'y' ? -Math.PI / 2 : 0
    );
  }

  /**
   * Draw arrow heads for rulers
   */
  drawRulerArrows(start, end, axis, color) {
    const arrowSize = 15;

    // Start arrow
    const startArrow = [start];
    startArrow.push({
      x: axis === 'x' ? start.x + arrowSize : start.x - 3.75,
      y: axis === 'x' ? start.y - 3.75 : start.y + arrowSize
    });
    startArrow.push({
      x: axis === 'x' ? start.x + arrowSize : start.x + 3.75,
      y: axis === 'x' ? start.y + 3.75 : start.y + arrowSize
    });

    // End arrow
    const endArrow = [end];
    endArrow.push({
      x: axis === 'x' ? end.x - arrowSize : end.x - 3.75,
      y: axis === 'x' ? end.y - 3.75 : end.y - arrowSize
    });
    endArrow.push({
      x: axis === 'x' ? end.x - arrowSize : end.x + 3.75,
      y: axis === 'x' ? end.y + 3.75 : end.y - arrowSize
    });

    [startArrow, endArrow].forEach((arrow) => {
      const xCoords = arrow.map(p => p.x);
      const yCoords = arrow.map(p => p.y);
      this.drawPolygon(xCoords, yCoords, true, color, true, color, 1);
    });
  }

  /**
   * Draw a furniture item
   */
  drawItem(item) {
    item.getSnapPoints().forEach((snapGroup) => {
      const xCoords = [];
      const yCoords = [];

      snapGroup.forEach((point) => {
        xCoords.push(this.viewmodel.convertX(point.x));
        yCoords.push(this.viewmodel.convertY(point.y));
      });

      const fillColor = item === this.viewmodel.activeItem ? '#0000ff22' : '#33333311';
      this.drawPolygon(xCoords, yCoords, true, fillColor, true, '#444', 1);
    });
  }

  /**
   * Draw text label for item or measurement
   */
  drawItemLabel(position, text, fontSize = 12, convertCoords = true, rotation = 0) {
    this.context.font = `normal ${fontSize}px Arial`;
    this.context.fillStyle = COLORS.BLACK;
    this.context.textBaseline = 'middle';
    this.context.textAlign = 'center';
    this.context.strokeStyle = '#ffffff';
    this.context.lineWidth = 4;

    const x = convertCoords ? this.viewmodel.convertX(position.x) : position.x;
    const y = convertCoords ? this.viewmodel.convertY(position.y) : position.y;

    if (rotation) {
      this.context.save();
      this.context.translate(x, y);
      this.context.rotate(rotation);
      this.context.fillText(text, 0, 0);
      this.context.restore();
    } else {
      this.context.fillText(text, x, y);
    }
  }

  /**
   * Draw wall dimension labels
   */
  drawWallLabels(wall) {
    const start = { x: wall.start.x, y: wall.start.y };
    const end = { x: wall.end.x, y: wall.end.y };
    const midpoint = {
      x: (start.x + end.x) / 2,
      y: (start.y + end.y) / 2
    };

    const length = Math.sqrt(
      Math.pow(start.x - end.x, 2) + Math.pow(start.y - end.y, 2)
    );

    this.drawEdgeLabel(midpoint, length);
  }

  /**
   * Draw a wall with edges and items
   */
  drawWall(wall) {
    const isActive = wall === this.viewmodel.activeWall && !this.viewmodel.activeCorner;

    if (wall.frontEdge) {
      this.drawEdge(wall.frontEdge, isActive);
    }
    if (wall.backEdge) {
      this.drawEdge(wall.backEdge, isActive);
    }

    // Draw wall-mounted items
    if (Array.isArray(wall.items)) {
      wall.items.forEach((item) => {
        this.drawWallItem(item, wall);
      });
    }
  }

  /**
   * Draw a wall-mounted item (door, window, etc.)
   */
  drawWallItem(item, wall) {
    const corners = item.getCorners();
    const xCoords = [];
    const yCoords = [];

    corners.forEach((corner) => {
      xCoords.push(this.viewmodel.convertX(corner.x));
      yCoords.push(this.viewmodel.convertY(corner.y));
    });

    this.drawPolygon(xCoords, yCoords, true, '#fff', true, '#888', 1);
  }

  /**
   * Draw edge dimension label
   */
  drawEdgeLabel(position, length) {
    length *= 100; // Convert to cm

    if (length < 60) return; // Don't draw labels for very small edges

    this.context.font = 'normal 12px Arial';
    this.context.fillStyle = '#000000';
    this.context.textBaseline = 'middle';
    this.context.textAlign = 'center';
    this.context.strokeStyle = '#ffffff';
    this.context.lineWidth = 4;

    const text = Dimensioning.cmToMeasure(length);
    const x = this.viewmodel.convertX(position.x);
    const y = this.viewmodel.convertY(position.y);

    this.context.strokeText(text, x, y);
    this.context.fillText(text, x, y);
  }

  /**
   * Draw wall edge
   */
  drawEdge(edge, isActive) {
    let color = COLORS.WALL;

    if (isActive && this.viewmodel.mode === MODES.DELETE) {
      color = COLORS.DELETE;
    } else if (isActive) {
      color = COLORS.ACTIVE;
    }

    const corners = edge.corners();
    const xCoords = Utils.map(corners, (c) => this.viewmodel.convertX(c.x));
    const yCoords = Utils.map(corners, (c) => this.viewmodel.convertY(c.y));

    this.drawPolygon(
      xCoords,
      yCoords,
      true,
      isActive ? COLORS.ACTIVE : COLORS.WALL_FILL,
      true,
      color,
      1
    );
  }

  /**
   * Draw a room (filled polygon)
   */
  drawRoom(room) {
    const xCoords = Utils.map(room.corners, (c) => this.viewmodel.convertX(c.x));
    const yCoords = Utils.map(room.corners, (c) => this.viewmodel.convertY(c.y));

    this.drawPolygon(xCoords, yCoords, true, COLORS.ROOM_FILL);
  }

  /**
   * Draw a corner point
   */
  drawCorner(corner) {
    const isActive = corner === this.viewmodel.activeCorner;
    let color = COLORS.CORNER_DEFAULT;

    if (isActive && this.viewmodel.mode === MODES.DELETE) {
      color = COLORS.DELETE;
    } else if (isActive) {
      color = COLORS.ACTIVE_CORNER;
    }

    this.drawCircle(
      this.viewmodel.convertX(corner.x),
      this.viewmodel.convertY(corner.y),
      isActive ? 7 : 0,
      color
    );
  }

  /**
   * Draw target point in draw mode
   */
  drawTarget(x, y, lastNode) {
    this.drawCircle(
      this.viewmodel.convertX(x),
      this.viewmodel.convertY(y),
      7,
      COLORS.ACTIVE_CORNER
    );

    if (this.viewmodel.lastNode) {
      this.drawLine(
        this.viewmodel.convertX(lastNode.x),
        this.viewmodel.convertY(lastNode.y),
        this.viewmodel.convertX(x),
        this.viewmodel.convertY(y),
        7,
        COLORS.TARGET_LINE
      );
    }
  }

  /**
   * Draw a line
   */
  drawLine(x1, y1, x2, y2, lineWidth = 1, color = '#000', dashed = false) {
    this.context.beginPath();
    this.context.setLineDash([]);

    if (dashed) {
      this.context.setLineDash([3, 6]);
    }

    this.context.moveTo(x1, y1);
    this.context.lineTo(x2, y2);
    this.context.lineWidth = lineWidth;
    this.context.strokeStyle = color;
    this.context.stroke();
  }

  /**
   * Draw a filled/stroked polygon
   */
  drawPolygon(xCoords, yCoords, fill = false, fillColor = '#000', stroke = false, strokeColor = '#000', lineWidth = 1) {
    this.context.beginPath();
    this.context.moveTo(xCoords[0], yCoords[0]);

    for (let i = 1; i < xCoords.length; i++) {
      this.context.lineTo(xCoords[i], yCoords[i]);
    }

    this.context.closePath();

    if (fill) {
      this.context.fillStyle = fillColor;
      this.context.fill();
    }

    if (stroke) {
      this.context.lineWidth = lineWidth;
      this.context.strokeStyle = strokeColor;
      this.context.stroke();
    }
  }

  /**
   * Draw a filled circle
   */
  drawCircle(x, y, radius, color) {
    this.context.beginPath();
    this.context.arc(x, y, radius, 0, 2 * Math.PI, false);
    this.context.fillStyle = color;
    this.context.fill();
  }

  /**
   * Calculate grid spacing based on zoom level
   */
  calculateGridSpacing() {
    let cmPerGrid = 100;
    const pixelsPerCm = this.viewmodel.pixelsPerCm;

    if (pixelsPerCm < 0.5) {
      cmPerGrid = 100;
    } else if (pixelsPerCm < 1) {
      cmPerGrid = 50;
    } else if (pixelsPerCm < 2) {
      cmPerGrid = 25;
    } else if (pixelsPerCm < 4) {
      cmPerGrid = 12.5;
    }

    return (pixelsPerCm || 0.5) * cmPerGrid;
  }

  /**
   * Calculate grid offset for panning
   */
  calculateGridOffset(coordinate) {
    const spacing = this.calculateGridSpacing();

    if (coordinate >= 0) {
      return (coordinate + spacing / 2) % spacing - spacing / 2;
    } else {
      return (coordinate - spacing / 2) % spacing + spacing / 2;
    }
  }

  /**
   * Draw background grid
   */
  drawGrid() {
    const offsetX = this.calculateGridOffset(-this.viewmodel.originX);
    const offsetY = this.calculateGridOffset(-this.viewmodel.originY);
    const width = this.canvasElement.width;
    const height = this.canvasElement.height;
    const spacing = this.calculateGridSpacing();

    // Vertical lines
    for (let i = 0; i <= width / spacing; i++) {
      this.drawLine(spacing * i + offsetX, 0, spacing * i + offsetX, height, 1, COLORS.GRID);
    }

    // Horizontal lines
    for (let i = 0; i <= height / spacing; i++) {
      this.drawLine(0, spacing * i + offsetY, width, spacing * i + offsetY, 1, COLORS.GRID);
    }
  }
}

export default Canvas2D;
