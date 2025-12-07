/**
 * FloorPlanView - 2D floor plan editor component
 * Renders canvas with mode switcher (Move, Draw, Delete)
 */

import React, { Component } from 'react';
import { MODES } from '@core/Blueprint3D/Canvas2D';
import './FloorPlanView.css';

class FloorPlanView extends Component {
  render() {
    const { hidden, onDomLoaded, onModeChanged } = this.props;

    return (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'block',
          position: 'absolute',
          top: 0,
          left: 0,
          opacity: hidden ? 0 : 100,
          pointerEvents: hidden ? 'none' : 'inherit'
        }}
      >
        <canvas
          className="canvas-floor-plan"
          ref={(canvas) => {
            if (typeof onDomLoaded === 'function') {
              onDomLoaded(canvas);
            }
          }}
        >
          Floor plan viewer
        </canvas>

        <div className="floorplan-modes-container">
          <span
            onClick={() => onModeChanged(MODES.MOVE)}
            className="mode-button"
          >
            Move
          </span>
          <span
            onClick={() => onModeChanged(MODES.DRAW)}
            className="mode-button"
          >
            Draw
          </span>
          <span
            onClick={() => onModeChanged(MODES.DELETE)}
            className="mode-button"
          >
            Delete
          </span>
        </div>
      </div>
    );
  }
}

export default FloorPlanView;
