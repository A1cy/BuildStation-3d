/**
 * Configuration - Global configuration manager for Build-Station 3D
 * Handles application-wide settings and dispatches change events
 */

// Configuration keys (constants)
export const CONFIG_KEYS = {
  DIM_UNIT: 'dimUnit',
  DEFAULT_PATH_PREFIX: 'defaultPathPrefix',
  WALL_HEIGHT: 'wallHeight',
  WALL_THICKNESS: 'wallThickness',
  SCENE_LOCKED: 'scene-locked',
  X_RAY: 'xRay',
  SNAP: 'snap',
  DIMENSION_VISIBLE: 'dimensionVisible'
};

// Unit constants
export const UNITS = {
  INCH: 'inch',
  FOOT: 'ft',
  METER: 'm',
  CM: 'cm',
  MM: 'mm'
};

// Blueprint3D events
export const BP3D_EVENTS = {
  CONFIG_CHANGED: 'bp3d.config.changed',
  LINKED_ITEMS_CHANGED: 'bp3d.items.linked.changed',
  HIGHLIGHT_CHANGED: 'bp3d.highlight.changed'
};

// Default asset prefix (from environment or empty)
const ASSETS_PREFIX = import.meta.env.VITE_BLUEPRINT_ASSETS_PREFIX || '';

class Configuration {
  // Static configuration data
  static data = {
    defaultPathPrefix: `${ASSETS_PREFIX}Blueprint3D-assets/`,
    dimUnit: UNITS.INCH,
    wallHeight: 2.5,    // meters
    wallThickness: 0.1,  // meters
    sceneLocked: false,
    xRay: false,
    snap: true,
    dimensionVisible: true
  };

  /**
   * Set a configuration value and dispatch change event
   * @param {string} key - Configuration key
   * @param {*} value - New value
   */
  static setValue(key, value) {
    this.data[key] = value;

    // Dispatch custom event for config changes
    document.dispatchEvent(
      new CustomEvent(BP3D_EVENTS.CONFIG_CHANGED, {
        detail: { [key]: value }
      })
    );
  }

  /**
   * Get a string configuration value
   * @param {string} key - Configuration key
   * @returns {string} Configuration value
   */
  static getStringValue(key) {
    switch (key) {
      case CONFIG_KEYS.DIM_UNIT:
      case CONFIG_KEYS.DEFAULT_PATH_PREFIX:
        return this.data[key];
      default:
        throw new Error(`Invalid string configuration parameter: ${key}`);
    }
  }

  /**
   * Get a boolean configuration value
   * @param {string} key - Configuration key
   * @returns {boolean} Configuration value
   */
  static getBooleanValue(key) {
    switch (key) {
      case CONFIG_KEYS.SCENE_LOCKED:
      case CONFIG_KEYS.X_RAY:
      case CONFIG_KEYS.SNAP:
      case CONFIG_KEYS.DIMENSION_VISIBLE:
        return this.data[key];
      default:
        throw new Error(`Invalid boolean configuration parameter: ${key}`);
    }
  }

  /**
   * Get a numeric configuration value
   * @param {string} key - Configuration key
   * @returns {number} Configuration value
   */
  static getNumericValue(key) {
    switch (key) {
      case CONFIG_KEYS.WALL_HEIGHT:
      case CONFIG_KEYS.WALL_THICKNESS:
        return this.data[key];
      default:
        throw new Error(`Invalid numeric configuration parameter: ${key}`);
    }
  }
}

export default Configuration;
