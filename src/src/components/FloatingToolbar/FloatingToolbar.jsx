/**
 * FloatingToolbar - Bottom toolbar with product manipulation controls
 * Extracted from production bundle - provides item lock, stack, flip, duplicate, delete
 */

import React, { Component } from 'react';
import './FloatingToolbar.css';

const MORPH_ALIGN_DIRECTIONS = [
  { font: 'fas fa-arrow-up', value: 0, rotation: 0 },
  { font: 'fas fa-arrow-up', value: 1, rotation: 45 },
  { font: 'fas fa-arrow-up', value: 2, rotation: 90 },
  { font: 'fas fa-arrow-up', value: 3, rotation: 135 },
  { font: 'fas fa-arrow-up', value: 4, rotation: 180 },
  { font: 'fas fa-arrow-up', value: 5, rotation: 225 },
  { font: 'fas fa-arrow-up', value: 6, rotation: 270 },
  { font: 'fas fa-arrow-up', value: 7, rotation: 315 },
  { font: 'fas fa-arrow-up', value: 8, rotation: -45 }
];

class FloatingToolbar extends Component {
  constructor(props) {
    super(props);
    this.state = {
      unit: 'In',
      locked: false,
      showDimension: true,
      snap: true,
      xRay: false
    };
  }

  getButtons = () => {
    const item = this.props.info; // Selected item
    const morphAlign = item && item.morphAlign !== undefined ? item.morphAlign : 0;
    const direction = MORPH_ALIGN_DIRECTIONS[morphAlign] || MORPH_ALIGN_DIRECTIONS[0];

    const buttons = [
      // Stretch direction
      {
        font: direction.font,
        tooltip: 'Stretch Direction',
        fontStyle: {
          transform: `rotate(${direction.rotation}deg)`
        },
        callback: () => {
          if (item) {
            const nextAlign = (morphAlign + 1) % MORPH_ALIGN_DIRECTIONS.length;
            this.props.onMorphAlignChanged && this.props.onMorphAlignChanged(nextAlign);
          } else {
            console.warn('Product not selected');
          }
        }
      },
      // Lock in place
      {
        toggled: item && item.fixed,
        font: 'fas fa-thumbtack',
        tooltip: 'Lock in place',
        callback: () => {
          if (item) {
            this.props.onLockChanged && this.props.onLockChanged(!Boolean(item.fixed));
          } else {
            console.warn('Product not selected');
          }
        }
      },
      // Stackable
      {
        toggled: item && item.stackable,
        font: 'fas fa-layer-group',
        tooltip: 'Stackable',
        callback: () => {
          if (item) {
            this.props.onStackableChanged && this.props.onStackableChanged(!Boolean(item.stackable));
          } else {
            console.warn('Product not selected');
          }
        }
      },
      // Overlappable
      {
        toggled: item && item.overlappable,
        font: 'fas fa-clone',
        tooltip: 'Overlappable',
        callback: () => {
          if (item) {
            this.props.onOverlappableChanged && this.props.onOverlappableChanged(!Boolean(item.overlappable));
          } else {
            console.warn('Product not selected');
          }
        }
      }
    ];

    // Add flip button if item is flippable
    if (item && item.flippable) {
      buttons.push({
        font: 'fas fa-exchange-alt',
        tooltip: 'Flip',
        callback: () => {
          if (item) {
            this.props.onFlipHorizontal && this.props.onFlipHorizontal();
          } else {
            console.warn('Product not selected');
          }
        }
      });
    }

    // Add separator and action buttons
    return [
      ...buttons,
      null, // Separator (renders as <div className="hr" />)
      // Duplicate
      {
        font: 'far fa-copy',
        tooltip: 'Duplicate',
        callback: () => {
          if (item) {
            this.props.onDuplicateProduct && this.props.onDuplicateProduct();
          } else {
            console.warn('Product not selected');
          }
        }
      },
      // Delete
      {
        font: 'far fa-trash-alt',
        tooltip: 'Delete',
        callback: () => {
          if (item) {
            this.props.onDeleteActiveProduct && this.props.onDeleteActiveProduct();
          } else {
            console.warn('Product not selected');
          }
        }
      }
    ];
  };

  render() {
    const buttons = this.getButtons();

    return (
      <div className="float-toolbar">
        {buttons.map((button, index) => {
          if (!button) {
            // Separator
            return <div key={index} className="hr" />;
          }

          return (
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
          );
        })}
      </div>
    );
  }
}

export default FloatingToolbar;
