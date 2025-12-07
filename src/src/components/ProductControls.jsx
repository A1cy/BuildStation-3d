/**
 * ProductControls - Floating toolbar for product manipulation
 * Provides buttons for duplicate, delete, lock, flip, stretch direction, stackable, overlappable
 */

import React, { Component } from 'react';
import './ProductControls.css';

// Stretch direction configurations (for morph align)
const STRETCH_DIRECTIONS = [
  { rotation: 0, font: 'fas fa-arrows-alt-h' }, // Horizontal
  { rotation: 90, font: 'fas fa-arrows-alt-v' }, // Vertical
  { rotation: 45, font: 'fas fa-expand' } // Diagonal
];

class ProductControls extends Component {
  /**
   * Get button configurations based on selected item
   * @returns {Array} Button configurations
   */
  getButtons = () => {
    const { info } = this.props;

    const buttons = [
      // Stretch Direction (Morph Align)
      {
        font: STRETCH_DIRECTIONS[info && info.morphAlign ? info.morphAlign : 0].font,
        tooltip: 'Stretch Direction',
        fontStyle: {
          transform: `rotate(${STRETCH_DIRECTIONS[info && info.morphAlign ? info.morphAlign : 0].rotation}deg)`
        },
        callback: () => {
          if (info) {
            const nextAlign = (info.morphAlign + 1) % STRETCH_DIRECTIONS.length;
            this.props.onMorphAlignChanged(nextAlign);
          } else {
            this.showError('Product not selected');
          }
        }
      },
      // Lock in Place
      {
        toggled: info && info.fixed,
        font: 'fas fa-thumbtack',
        tooltip: 'Lock in place',
        callback: () => {
          if (info) {
            this.props.onLockChanged(!Boolean(info.fixed));
          } else {
            this.showError('Product not selected');
          }
        }
      },
      // Stackable
      {
        toggled: info && info.stackable,
        font: 'fas fa-layer-group',
        tooltip: 'Stackable',
        callback: () => {
          if (info) {
            this.props.onStackableChanged(!Boolean(info.stackable));
          } else {
            this.showError('Product not selected');
          }
        }
      },
      // Overlappable
      {
        toggled: info && info.overlappable,
        font: 'fas fa-clone',
        tooltip: 'Overlappable',
        callback: () => {
          if (info) {
            this.props.onOverlappableChanged(!Boolean(info.overlappable));
          } else {
            this.showError('Product not selected');
          }
        }
      }
    ];

    // Add flip button if item is flippable
    if (info && info.flippable) {
      buttons.push({
        font: 'fas fa-exchange-alt',
        tooltip: 'Flip',
        callback: () => {
          if (info) {
            this.props.onFlipHorizonal();
          } else {
            this.showError('Product not selected');
          }
        }
      });
    }

    // Add separator and action buttons
    return [
      ...buttons,
      null, // Separator
      // Duplicate
      {
        font: 'far fa-copy',
        tooltip: 'Duplicate',
        callback: () => {
          if (info) {
            this.props.onDuplicateProduct();
          } else {
            this.showError('Product not selected');
          }
        }
      },
      // Delete
      {
        font: 'far fa-trash-alt',
        tooltip: 'Delete',
        callback: () => {
          if (info) {
            this.props.onDeleteActiveProduct();
          } else {
            this.showError('Product not selected');
          }
        }
      }
    ];
  };

  /**
   * Show error notification
   * @param {string} message - Error message
   */
  showError = (message) => {
    console.error(message);
    // Toast notification would go here if library is available
  };

  render() {
    const buttons = this.getButtons();

    return (
      <div className="float-toolbar">
        {buttons.map((button, index) =>
          button ? (
            <div
              key={index}
              className={`float-toolbar-button ${button.toggled ? 'toggled' : ''}`}
              data-tip={button.tooltip}
              onClick={() => {
                if (typeof button.callback === 'function') {
                  button.callback();
                }
              }}
            >
              <span className={button.font} style={button.fontStyle}>
                {button.label}
              </span>
            </div>
          ) : (
            <div key={index} className="hr" />
          )
        )}
      </div>
    );
  }
}

export default ProductControls;
