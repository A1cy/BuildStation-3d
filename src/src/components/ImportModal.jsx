/**
 * ImportModal - Modal for importing sets from external configurator
 * Allows user to paste JSON configuration and import it
 */

import React, { Component } from 'react';
import './ImportModal.css';

class ImportModal extends Component {
  constructor(props) {
    super(props);

    this.state = {
      jsonInput: '', // User input for JSON configuration
      error: null // Error message if invalid JSON
    };
  }

  /**
   * Handle JSON input change
   * @param {Event} event - Change event
   */
  handleInputChange = (event) => {
    this.setState({
      jsonInput: event.target.value,
      error: null
    });
  };

  /**
   * Handle import button click
   * Validates JSON and calls onImported callback
   */
  handleImport = () => {
    const { jsonInput } = this.state;

    if (!jsonInput.trim()) {
      this.setState({ error: 'Please enter a configuration' });
      return;
    }

    try {
      const data = JSON.parse(jsonInput);
      this.props.onImported(data);
      this.props.onClose();
    } catch (error) {
      this.setState({ error: 'Invalid JSON format: ' + error.message });
    }
  };

  /**
   * Handle close button click
   */
  handleClose = () => {
    this.props.onClose();
  };

  render() {
    const { jsonInput, error } = this.state;

    return (
      <div className="modal-overlay" onClick={this.handleClose}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h2>Import from Set Builder</h2>
            <button className="close-button" onClick={this.handleClose}>
              ×
            </button>
          </div>

          <div className="modal-body">
            <label htmlFor="json-input">
              Paste your configuration JSON below:
            </label>
            <textarea
              id="json-input"
              className="json-input"
              value={jsonInput}
              onChange={this.handleInputChange}
              placeholder='{"items": [...], "walls": [...], "config": {...}}'
              rows={15}
            />

            {error && <div className="error-message">{error}</div>}
          </div>

          <div className="modal-footer">
            <button className="button button-secondary" onClick={this.handleClose}>
              Cancel
            </button>
            <button className="button button-primary" onClick={this.handleImport}>
              Import
            </button>
          </div>
        </div>
      </div>
    );
  }
}

export default ImportModal;
