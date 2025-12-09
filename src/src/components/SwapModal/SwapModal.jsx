import React from 'react';
import './SwapModal.css';

/**
 * SwapModal Component
 *
 * EXTRACTED FROM PRODUCTION BUNDLE (lines 5065-5085)
 * Function name in bundle: Bt
 *
 * Displays a confirmation modal asking if user wants to swap current product.
 * Used when trying to add a product while another is selected.
 *
 * Props:
 * - onConfirm: Function called when "Yes" is clicked
 * - onCancel: Function called when "No" is clicked
 */
function SwapModal({ onConfirm, onCancel }) {
  return (
    <div className="modal-container">
      <div className="modal-dialog">
        <p>Do you want to swap current product?</p>
        <div className="buttons">
          <button onClick={onConfirm}>Yes</button>
          <button onClick={onCancel}>No</button>
        </div>
      </div>
    </div>
  );
}

export default SwapModal;
