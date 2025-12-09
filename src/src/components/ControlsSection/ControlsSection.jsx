/**
 * ControlsSection - 2D navigation controls with arrows, zoom, and home
 * Extracted from production bundle - provides pan and zoom controls for 2D floor planner
 */

import React, { Component } from 'react';
import './ControlsSection.css';

class ControlsSection extends Component {
  render() {
    const { onPan, onZoomIn, onZoomOut, onHomeClicked } = this.props;

    return (
      <div className="controls-section">
        {/* Left arrow */}
        <span
          className="control-button"
          onClick={() => {
            if (typeof onPan === 'function') {
              onPan('LEFT');
            }
          }}
        >
          <i className="fa fa-arrow-left" />
        </span>

        {/* Up and Down arrows (stacked vertically) */}
        <span
          style={{
            display: 'inline-block',
            position: 'relative',
            verticalAlign: 'middle'
          }}
        >
          {/* Up arrow */}
          <span
            className="control-button"
            style={{
              display: 'block',
              float: 'none'
            }}
            onClick={() => {
              if (typeof onPan === 'function') {
                onPan('UP');
              }
            }}
          >
            <i className="fa fa-arrow-up" />
          </span>
          <br />
          {/* Down arrow */}
          <span
            className="control-button"
            style={{
              display: 'block',
              float: 'none'
            }}
            onClick={() => {
              if (typeof onPan === 'function') {
                onPan('DOWN');
              }
            }}
          >
            <i className="fa fa-arrow-down" />
          </span>
        </span>

        {/* Right arrow */}
        <span
          className="control-button"
          onClick={() => {
            if (typeof onPan === 'function') {
              onPan('RIGHT');
            }
          }}
        >
          <i className="fa fa-arrow-right" />
        </span>

        {/* Zoom out */}
        <span
          className="control-button"
          onClick={() => {
            if (typeof onZoomOut === 'function') {
              onZoomOut();
            }
          }}
        >
          <i className="fa fa-search-minus" />
        </span>

        {/* Home / Reset view */}
        <span
          className="control-button"
          onClick={() => {
            if (typeof onHomeClicked === 'function') {
              onHomeClicked();
            }
          }}
        >
          <i className="fa fa-home" />
        </span>

        {/* Zoom in */}
        <span
          className="control-button"
          onClick={() => {
            if (typeof onZoomIn === 'function') {
              onZoomIn();
            }
          }}
        >
          <i className="fa fa-search-plus" />
        </span>
      </div>
    );
  }
}

export default ControlsSection;
