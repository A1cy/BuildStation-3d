/**
 * Configuration - Global settings management system
 * **PHASE 2E: Configuration System**
 * Extracted from production bundle lines 155-230
 */

// Configuration keys
export const configDimUnit = 'dimUnit';
export const configDefaultPathPrefix = 'defaultPathPrefix';
export const configWallHeight = 'wallHeight';
export const configWallThickness = 'wallThickness';
export const configSceneLocked = 'scene-locked';
export const configXRayMode = 'xRay';
export const configSnapMode = 'snap';
export const configDimensionVisible = 'dimensionVisible';

// Dimension units
export const dimInch = 'in';
export const dimFeet = 'ft';
export const dimMeter = 'm';
export const dimCentimeter = 'cm';

// Configuration keys object (for compatibility with existing code)
export const CONFIG_KEYS = {
  DIM_UNIT: 'dimUnit',
  DEFAULT_PATH_PREFIX: 'defaultPathPrefix',
  WALL_HEIGHT: 'wallHeight',
  WALL_THICKNESS: 'wallThickness',
  SCENE_LOCKED: 'scene-locked',
  XRAY_MODE: 'xRay',
  SNAP_MODE: 'snap',
  DIMENSION_VISIBLE: 'dimensionVisible',
};

// Units object (for compatibility with existing code)
export const UNITS = {
  INCH: dimInch,
  FOOT: dimFeet,
  METER: dimMeter,
  CM: dimCentimeter,
  MM: 'mm',
};

// Event dispatched when configuration changes
export const BP3D_EVENT_CONFIG_CHANGED = 'bp3d_config_changed';

// Events object (for compatibility with existing code)
export const BP3D_EVENTS = {
  CONFIG_CHANGED: BP3D_EVENT_CONFIG_CHANGED,
  HIGHLIGHT_CHANGED: 'bp3d_highlight_changed',
};

class Configuration {
  static data = {
    defaultPathPrefix: '/Blueprint3D-assets/',
    dimUnit: dimInch,
    wallHeight: 2.5,
    wallThickness: 0.1,
    sceneLocked: false,
    xRay: false,
    snap: true,
    dimensionVisible: true,
  };

  static setValue(key, value) {
    this.data[key] = value;
    document.dispatchEvent(
      new CustomEvent(BP3D_EVENT_CONFIG_CHANGED, {
        detail: { [key]: value },
      })
    );
  }

  static getStringValue(key) {
    switch (key) {
      case configDimUnit:
      case configDefaultPathPrefix:
        return this.data[key];
      default:
        throw new Error(`Invalid string configuration parameter: ${key}`);
    }
  }

  static getBooleanValue(key) {
    switch (key) {
      case configSceneLocked:
      case configXRayMode:
      case configSnapMode:
      case configDimensionVisible:
        return this.data[key];
      default:
        throw new Error(`Invalid boolean configuration parameter: ${key}`);
    }
  }

  static getNumericValue(key) {
    switch (key) {
      case configWallHeight:
      case configWallThickness:
        return this.data[key];
      default:
        throw new Error(`Invalid numeric configuration parameter: ${key}`);
    }
  }

  static save() {
    try {
      localStorage.setItem('bp3d_config', JSON.stringify(this.data));
    } catch (error) {
      console.error('Failed to save configuration:', error);
    }
  }

  static load() {
    try {
      const saved = localStorage.getItem('bp3d_config');
      if (saved) {
        const parsed = JSON.parse(saved);
        this.data = { ...this.data, ...parsed };
      }
    } catch (error) {
      console.error('Failed to load configuration:', error);
    }
  }

  static reset() {
    this.data = {
      defaultPathPrefix: '/Blueprint3D-assets/',
      dimUnit: dimInch,
      wallHeight: 2.5,
      wallThickness: 0.1,
      sceneLocked: false,
      xRay: false,
      snap: true,
      dimensionVisible: true,
    };
    this.save();
    document.dispatchEvent(
      new CustomEvent(BP3D_EVENT_CONFIG_CHANGED, {
        detail: this.data,
      })
    );
  }
}

export default Configuration;
