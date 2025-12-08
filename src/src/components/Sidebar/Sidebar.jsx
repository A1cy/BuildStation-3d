import React, { Component } from 'react';
import './Sidebar.css';

/**
 * Sidebar Component
 *
 * Left toolbar with icon buttons for view controls, scene settings, and actions.
 * Displays vertically stacked buttons with toggle states and tooltips.
 *
 * Props:
 * - viewMode: '2d' | '3d' - Current view mode
 * - onShow3DViewClicked: () => {} - Switch to 3D view
 * - onShow2DPlanner: () => {} - Switch to 2D floor planner
 * - onShowDimensionsToggled: (enabled) => {} - Toggle dimension display
 * - onLockSceneToggled: (locked) => {} - Toggle scene lock
 * - onSnapToggled: (enabled) => {} - Toggle object snapping
 * - onXRayToggled: (enabled) => {} - Toggle X-ray wall view
 * - onAddProductClicked: () => {} - Open product list
 * - onSaveClicked: () => {} - Save floor plan
 * - onLoadClicked: () => {} - Load floor plan
 * - onSnapshotClicked: () => {} - Take screenshot
 * - onUnitChanged: (unit) => {} - Change measurement unit
 */
class Sidebar extends Component {
  constructor(props) {
    super(props);

    this.state = {
      unit: 'In',          // Current measurement unit: 'In', 'Cm', 'M'
      locked: false,       // Scene lock state
      showDimension: true, // Show/hide dimensions
      snap: true,          // Object snapping enabled
      xRay: false         // X-ray wall view
    };

    this.units = ['In', 'Cm', 'M'];
  }

  /**
   * Cycle through measurement units
   */
  handleUnitChanged = () => {
    const { unit } = this.state;
    const currentIndex = this.units.indexOf(unit);
    const nextIndex = (currentIndex + 1) % this.units.length;
    const newUnit = this.units[nextIndex];

    this.setState({ unit: newUnit });
    this.props.onUnitChanged(newUnit.toLowerCase());
  };

  /**
   * Toggle scene lock (prevents editing)
   */
  handleToggleLock = () => {
    const newLocked = !this.state.locked;
    this.props.onLockSceneToggled(newLocked);
    this.setState({ locked: newLocked });
  };

  /**
   * Toggle dimension display
   */
  handleToggleDimensions = () => {
    const newShowDimension = !this.state.showDimension;
    this.props.onShowDimensionsToggled(newShowDimension);
    this.setState({ showDimension: newShowDimension });
  };

  /**
   * Toggle object snapping
   */
  handleToggleSnap = () => {
    const newSnap = !this.state.snap;
    this.props.onSnapToggled(newSnap);
    this.setState({ snap: newSnap });
  };

  /**
   * Toggle X-ray wall view (see through walls)
   */
  handleToggleXRay = () => {
    const newXRay = !this.state.xRay;
    this.props.onXRayToggled(newXRay);
    this.setState({ xRay: newXRay });
  };

  /**
   * Get button configuration array
   * @returns {Array} Button objects with font, tooltip, callback
   */
  getButtons = () => {
    const { locked, snap, showDimension, xRay } = this.state;
    const { viewMode } = this.props;

    return [
      // View Mode Toggle (2D/3D)
      viewMode === '3d'
        ? {
            font: 'fa-solid fa-border-all',
            tooltip: 'Show 2D Floor Planner',
            callback: this.props.onShow2DPlanner
          }
        : {
            font: 'fa-solid fa-cube',
            tooltip: 'Show 3D View',
            callback: this.props.onShow3DViewClicked
          },

      // Separator
      null,

      // Scene Lock
      {
        toggled: locked,
        font: locked ? 'fa-solid fa-unlock' : 'fa-solid fa-lock',
        tooltip: locked ? 'Unlock Scene' : 'Lock Scene',
        callback: this.handleToggleLock
      },

      // Dimensions Toggle
      {
        toggled: showDimension,
        font: 'fa-solid fa-ruler-combined',
        tooltip: `${showDimension ? 'Hide' : 'Show'} Dimensions`,
        callback: this.handleToggleDimensions
      },

      // Snap Toggle
      {
        toggled: snap,
        font: 'fa-solid fa-magnet',
        tooltip: 'Snap Objects',
        callback: this.handleToggleSnap
      },

      // X-Ray Toggle
      {
        toggled: xRay,
        font: 'fa-solid fa-square',
        tooltip: 'X-Ray Wall',
        callback: this.handleToggleXRay
      },

      // Separator
      null,

      // Add Product
      {
        font: 'fa-solid fa-cart-plus',
        tooltip: 'Add Product',
        callback: this.props.onAddProductClicked
      },

      // Separator
      null,

      // Save
      {
        font: 'fa-solid fa-save',
        tooltip: 'Save',
        callback: this.props.onSaveClicked
      },

      // Load
      {
        font: 'fa-solid fa-upload',
        tooltip: 'Load',
        callback: this.props.onLoadClicked
      },

      // Screenshot
      {
        font: 'fa-solid fa-image',
        tooltip: 'Screenshot',
        callback: this.props.onSnapshotClicked
      },

      // Separator
      null,

      // Unit Toggle
      {
        font: '',
        label: this.state.unit,
        tooltip: 'Change Unit',
        callback: this.handleUnitChanged
      }
    ];
  };

  render() {
    const buttons = this.getButtons();

    return (
      <div className="left-toolbar">
        {buttons.map((button, index) => {
          // Separator (horizontal line)
          if (!button) {
            return <div key={index} className="hr"></div>;
          }

          // Button
          return (
            <div
              key={index}
              className={`left-toolbar-button ${button.toggled ? 'toggled' : ''}`}
              data-tip={button.tooltip}
              title={button.tooltip}
              onClick={() => {
                if (typeof button.callback === 'function') {
                  button.callback();
                }
              }}
            >
              <span className={button.font} style={button.fontStyle}>
                {button.label || ''}
              </span>
            </div>
          );
        })}
      </div>
    );
  }
}

export default Sidebar;
