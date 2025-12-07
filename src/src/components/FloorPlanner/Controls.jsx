/**
 * Controls - Pan and Zoom controls for floor plan editor
 * Provides directional pan, zoom in/out, and home button
 */

import React, { Component } from 'react';
import './Controls.css';

class Controls extends Component {
  render() {
    const { onPan, onZoomIn, onZoomOut, onHomeClicked } = this.props;

    return (
      <div className="controls-section">
        {/* Pan Left */}
        <span
          className="control-button"
          onClick={() => {
            if (typeof onPan === 'function') {
              onPan('LEFT');
            }
          }}
        >
          <i className="fa fa-arrow-left"></i>
        </span>

        {/* Pan Up/Down (vertical stack) */}
        <span
          style={{
            display: 'inline-block',
            position: 'relative',
            verticalAlign: 'middle'
          }}
        >
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
            <i className="fa fa-arrow-up"></i>
          </span>
          <br />
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
            <i className="fa fa-arrow-down"></i>
          </span>
        </span>

        {/* Pan Right */}
        <span
          className="control-button"
          onClick={() => {
            if (typeof onPan === 'function') {
              onPan('RIGHT');
            }
          }}
        >
          <i className="fa fa-arrow-right"></i>
        </span>

        {/* Zoom Out */}
        <span
          className="control-button"
          onClick={() => {
            if (typeof onZoomOut === 'function') {
              onZoomOut();
            }
          }}
        >
          <i className="fa fa-search-minus"></i>
        </span>

        {/* Home (Center View) */}
        <span
          className="control-button"
          onClick={() => {
            if (typeof onHomeClicked === 'function') {
              onHomeClicked();
            }
          }}
        >
          <i className="fa fa-home"></i>
        </span>

        {/* Zoom In */}
        <span
          className="control-button"
          onClick={() => {
            if (typeof onZoomIn === 'function') {
              onZoomIn();
            }
          }}
        >
          <i className="fa fa-search-plus"></i>
        </span>
      </div>
    );
  }
}

export default Controls;
