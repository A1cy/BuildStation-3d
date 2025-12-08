import React, { Component } from 'react';
import './PropertyPanel.css';
import Accordion from '../Accordion/Accordion';

/**
 * PropertyPanel Component
 *
 * Right sidebar panel that displays properties and options for selected items.
 * Shows materials, styles, dimensions, and morphing controls.
 */
class PropertyPanel extends Component {
  handleMaterialChange = (materialName, materialData) => {
    if (typeof this.props.onMaterialChange === 'function') {
      this.props.onMaterialChange(materialName, materialData);
    }
  };

  handleStyleChange = (styleName, styleData) => {
    if (typeof this.props.onStyleChange === 'function') {
      this.props.onStyleChange(styleName, styleData);
    }
  };

  renderMaterialSection = () => {
    const { info } = this.props;
    if (!info || !info.metadata || !Array.isArray(info.metadata.materials)) return null;

    return (
      <div>
        {info.metadata.materials.map((material, index) => (
          <div key={index}>
            <Accordion label={material.label}>
              <div className="textures-container">
                {material.types.map((type, typeIndex) => (
                  <div
                    key={typeIndex}
                    className="texture-item"
                    onClick={() => this.handleMaterialChange(material.name_in_model, type)}
                  >
                    <img alt={type.label} src={type.texture} className="thumbnail" />
                    <div className="label">{type.label}</div>
                  </div>
                ))}
              </div>
            </Accordion>
          </div>
        ))}
      </div>
    );
  };

  renderStyleSection = () => {
    const { info } = this.props;
    if (!info || !info.metadata || !Array.isArray(info.metadata.styles)) return null;

    return (
      <div style={{ paddingTop: 10 }}>
        {info.metadata.styles.map((style, index) => (
          <div key={index}>
            <Accordion label={style.label}>
              <div className="styles-container">
                {style.types.map((type, typeIndex) => (
                  <div
                    key={typeIndex}
                    className="style-item"
                    onClick={() => this.handleStyleChange(style.name_in_model, type.name_in_model)}
                  >
                    {type.thumbnail && <img alt={type.label} src={type.thumbnail} className="thumbnail" />}
                    <div className="label">{type.label}</div>
                  </div>
                ))}
              </div>
            </Accordion>
          </div>
        ))}
      </div>
    );
  };

  render() {
    const { info } = this.props;

    return (
      <div className="property-panel-container">
        <div className="property-section">
          {info && <h3>{info.metadata ? info.metadata.itemName : ''}</h3>}
          {!info && <p>No item selected</p>}
        </div>
        <div className="option-section">
          {!info && <p>No item selected</p>}
          {info && this.renderMaterialSection()}
          {info && this.renderStyleSection()}
        </div>
      </div>
    );
  }
}

export default PropertyPanel;
