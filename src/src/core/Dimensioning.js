/**
 * Dimensioning - Unit conversion system for Build-Station 3D
 * Converts centimeters to human-readable measurement units
 */

import Configuration, { CONFIG_KEYS, UNITS } from './Configuration';

class Dimensioning {
  /**
   * Convert centimeters to human-readable measurement string
   * @param {number} cm - Value in centimeters
   * @returns {string} Formatted measurement string with unit
   */
  static cmToMeasure(cm) {
    const unit = Configuration.getStringValue(CONFIG_KEYS.DIM_UNIT);

    switch (unit) {
      case UNITS.INCH: {
        const inches = Math.round(cm / 2.54);
        return `${inches}"`;
      }

      case UNITS.FOOT: {
        const totalInches = (0.3937 * cm) / 12;
        const feet = Math.floor(totalInches);
        const inches = Math.round(12 * (totalInches - feet));
        return `${feet}'${inches}"`;
      }

      case UNITS.MM: {
        const mm = Math.round(10 * cm);
        return `${mm} mm`;
      }

      case UNITS.CM: {
        const centimeters = Math.round(10 * cm) / 10;
        return `${centimeters} cm`;
      }

      case UNITS.METER:
      default: {
        const meters = Math.round(10 * cm) / 1000;
        return `${meters} m`;
      }
    }
  }

  /**
   * Convert inches to centimeters
   * @param {number} inches - Value in inches
   * @returns {number} Value in centimeters
   */
  static inchesToCm(inches) {
    return inches * 2.54;
  }

  /**
   * Convert feet to centimeters
   * @param {number} feet - Value in feet
   * @returns {number} Value in centimeters
   */
  static feetToCm(feet) {
    return feet * 30.48;
  }

  /**
   * Convert meters to centimeters
   * @param {number} meters - Value in meters
   * @returns {number} Value in centimeters
   */
  static metersToCm(meters) {
    return meters * 100;
  }

  /**
   * Convert millimeters to centimeters
   * @param {number} mm - Value in millimeters
   * @returns {number} Value in centimeters
   */
  static mmToCm(mm) {
    return mm / 10;
  }
}

export default Dimensioning;
