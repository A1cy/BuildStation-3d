/**
 * PropertyPanel - Material and style configuration panel
 * Displays thumbnails for materials and styles that can be applied to selected product
 */

import React, { Component } from 'react';
import './PropertyPanel.css';

class PropertyPanel extends Component {
  /**
   * Handle material selection
   * @param {string} materialName - Material name in model
   * @param {Object} materialType - Material type object
   */
  handleMaterialChange = (materialName, materialType) => {
    this.props.onMaterialChange(materialName, materialType);
  };

  /**
   * Handle style selection
   * @param {string} styleName - Style name in model
   * @param {string} styleValue - Style value/variant
   */
  handleStyleChange = (styleName, styleValue) => {
    this.props.onStyleChange(styleName, styleValue);
  };

  /**
   * Render material selection section
   * @returns {JSX.Element|null} Material section
   */
  renderMaterialSection = () => {
    const { info } = this.props;

    if (!info || !info.metadata || !Array.isArray(info.metadata.materials)) {
      return null;
    }

    const materials = info.metadata.materials;

    return (
      <div>
        {materials.map((material, index) => (
          <div key={index}>
            <div className="section-header">{material.label}</div>
            <div className="textures-container">
              {material.types.map((type, typeIndex) => (
                <div
                  key={typeIndex}
                  className="texture-item"
                  onClick={() => {
                    const materialName = material.name_in_model;
                    this.handleMaterialChange(materialName, type);
                  }}
                >
                  <img
                    alt={type.label}
                    src={type.texture}
                    className="thumbnail"
                  />
                  <div className="label">{type.label}</div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  };

  /**
   * Render style selection section
   * @returns {JSX.Element|null} Style section
   */
  renderStyleSection = () => {
    const { info } = this.props;

    if (!info || !info.metadata || !Array.isArray(info.metadata.styles)) {
      return null;
    }

    const styles = info.metadata.styles;

    return (
      <div style={{ paddingTop: 10 }}>
        {styles.map((style, index) => (
          <div key={index}>
            <div className="section-header">{style.label}</div>
            <div className="styles-container">
              {style.types.map((type, typeIndex) => (
                <div
                  key={typeIndex}
                  className="style-item"
                  onClick={() => {
                    const styleName = style.name_in_model;
                    const styleValue = type.name_in_model;
                    this.handleStyleChange(styleName, styleValue);
                  }}
                >
                  {type.thumbnail && (
                    <img
                      alt={type.label}
                      src={type.thumbnail}
                      className="thumbnail"
                    />
                  )}
                  <div className="label">{type.label}</div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  };

  render() {
    const { info } = this.props;

    if (!info) {
      return null;
    }

    return (
      <div className="property-panel">
        {this.renderMaterialSection()}
        {this.renderStyleSection()}
      </div>
    );
  }
}

export default PropertyPanel;
