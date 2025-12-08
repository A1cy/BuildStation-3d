/**
 * App - Main application component
 * Manages overall application state and coordinates between 2D/3D views, sidebar, and property panels
 */

import React, { Component } from 'react';
import './App.css';

// Component imports
import Sidebar from './components/Sidebar';
import Blueprint3D from './components/Blueprint3D';
import ProductList from './components/ProductList';
import PropertyPanel from './components/PropertyPanel';
import ProductControls from './components/ProductControls';
import ImportModal from './components/ImportModal';

// Data imports
import PRODUCT_CATALOG from './data/productCatalog';

class App extends Component {
  constructor(props) {
    super(props);

    // Refs
    this.refBp3d = null; // Reference to Blueprint3D component

    // State
    this.state = {
      viewMode: '3d', // '2d' or '3d'
      showProducts: false, // Show/hide product list panel
      activeCategory: 0, // Currently selected product category
      selectedItem: null, // Currently selected 3D item
      measureUnit: 'in', // Measurement unit (in/ft/m/cm/mm)
      showImportSetModal: false, // Show/hide import modal
      showLoadingScreen: false // Show/hide loading overlay
    };
  }

  /**
   * Handle item selection in 3D scene
   * @param {Object} item - Selected item
   */
  handleItemSelected = (item) => {
    this.setState({ selectedItem: item });
    window.dispatchEvent(new Event('resize')); // Trigger window resize for responsive layout
  };

  /**
   * Handle item deselection
   */
  handleItemUnselected = () => {
    this.setState({ selectedItem: null });
    window.dispatchEvent(new Event('resize'));
  };

  /**
   * Switch between 2D floor plan and 3D view
   */
  handleSwitchMode = () => {
    return this.setState({
      viewMode: this.state.viewMode === '3d' ? '2d' : '3d'
    });
  };

  /**
   * Add product to scene (async)
   * @param {Object} product - Product configuration
   */
  handleProductClicked = async (product) => {
    this.setState({ showLoadingScreen: true });
    console.log('item', product);

    // Add item via Blueprint3D reference
    await this.refBp3d.addItem(product);

    this.setState({ showLoadingScreen: false });
  };

  /**
   * Duplicate currently selected product
   */
  handleDuplicateProduct = () => {
    if (this.state.selectedItem) {
      this.refBp3d.duplicateItem();
    }
  };

  /**
   * Add set/group of products
   * @param {Object} set - Set configuration
   */
  handleSetClicked = (set) => {
    if (this.refBp3d) {
      this.refBp3d.addSet(set);
    }
  };

  /**
   * Save floor plan to localStorage
   */
  handleSaveJson = () => {
    console.log('save');
    const json = this.refBp3d.getJSON();
    window.localStorage.setItem('bp3dJson', json);
  };

  /**
   * Load floor plan from localStorage
   */
  handleLoadJson = () => {
    console.log('load');
    const json = window.localStorage.getItem('bp3dJson');
    if (json && json.length) {
      this.refBp3d.setJSON(json);
    }
  };

  /**
   * Take snapshot of current scene
   */
  handleSnapshot = () => {
    console.log('snapshot');
    const snapshot = this.refBp3d.takeSnapshot();
    console.log(snapshot);
  };

  /**
   * Import set from external configurator
   * @param {Object} setData - Imported set data
   */
  handleImportFromSetBuilder = (setData) => {
    this.refBp3d.importSetFromBuilder(setData);
  };

  render() {
    const {
      viewMode,
      selectedItem,
      showImportSetModal,
      showProducts,
      showLoadingScreen
    } = this.state;

    return (
      <div className="App">
        <div className="bp3d">
          <div className="container">
            {/* Left Sidebar - Toolbar and Controls */}
            <div className="left-container">
              <Sidebar
                viewMode={viewMode}
                onShow3DViewClicked={() => this.setState({ viewMode: '3d' })}
                onShow2DPlanner={() => this.setState({ viewMode: '2d' })}
                onShowDimensionsToggled={(enabled) => {
                  console.log('Dimensions toggled:', enabled);
                  // TODO: Wire to Blueprint3D when integrated
                }}
                onLockSceneToggled={(locked) => {
                  console.log('Lock toggled:', locked);
                  // TODO: Wire to Blueprint3D when integrated
                }}
                onSnapToggled={(enabled) => {
                  console.log('Snap toggled:', enabled);
                  // TODO: Wire to Blueprint3D when integrated
                }}
                onXRayToggled={(enabled) => {
                  console.log('X-Ray toggled:', enabled);
                  // TODO: Wire to Blueprint3D when integrated
                }}
                onAddProductClicked={() => this.setState({ showProducts: !showProducts })}
                onSaveClicked={this.handleSaveJson}
                onLoadClicked={this.handleLoadJson}
                onSnapshotClicked={this.handleSnapshot}
                onUnitChanged={(unit) => this.setState({ measureUnit: unit })}
              />
            </div>

            {/* Main Content - 2D/3D Scene + Product List */}
            <div className={`main-container ${selectedItem ? '' : 'wide'}`}>
              {/* Blueprint3D Scene Container */}
              <div className="scenes-container">
                <Blueprint3D
                  ref={(ref) => (this.refBp3d = ref)}
                  viewMode={viewMode}
                  measureUnit={this.state.measureUnit}
                  onItemSelected={this.handleItemSelected}
                  onItemUnselected={this.handleItemUnselected}
                  onSwitchMode={this.handleSwitchMode}
                />
              </div>

              {/* Product List Panel (slides in from left) */}
              <div
                hidden={!showProducts}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: 400,
                  height: '100vh',
                  overflow: 'auto',
                  background: 'white',
                  borderRight: '1px solid #ccc'
                }}
              >
                <ProductList
                  items={PRODUCT_CATALOG}
                  onClose={() => this.setState({ showProducts: false })}
                  onProductClicked={(product) => {
                    console.log(product);
                    this.handleProductClicked(product);
                  }}
                />
              </div>

              {/* Loading Overlay */}
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  background: '#00000088',
                  color: 'white',
                  display: showLoadingScreen ? 'flex' : 'none',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <span>loading...</span>
              </div>
            </div>

            {/* Right Panel - Property Panel + Product Controls */}
            <div className={`right-container ${selectedItem ? 'opened' : ''}`}>
              {/* Product Info and Configuration */}
              <div className="product-info-container">
                {/* Dimension Controls */}
                {/* <DimensionControls
                  info={selectedItem}
                  onMorphChanged={(morphIndex, value) => {
                    this.refBp3d.setMorph(morphIndex, value);
                    this.refBp3d.update();
                    this.forceUpdate();
                  }}
                  onOpenedChanged={(opened) => {
                    if (typeof selectedItem.setOpened === 'function') {
                      selectedItem.setOpened(opened);
                    }
                    if (selectedItem.groupParent && typeof selectedItem.groupParent.setOpened === 'function') {
                      selectedItem.groupParent.setOpened(opened);
                    }
                    this.forceUpdate();
                  }}
                  onGroupItemChanged={(oldItem, newItem) => {
                    this.refBp3d.replaceSetItem(oldItem, newItem);
                  }}
                /> */}

                {/* Material and Style Configuration */}
                <PropertyPanel
                  info={selectedItem}
                  onMaterialChange={(materialName, materialType) => {
                    console.log('Material changed:', materialName, materialType);
                    // TODO: Wire to Blueprint3D when integrated
                    // if (this.refBp3d && typeof this.refBp3d.updateMaterial === 'function') {
                    //   this.refBp3d.updateMaterial(materialName, materialType);
                    // }
                  }}
                  onStyleChange={(styleName, styleType) => {
                    console.log('Style changed:', styleName, styleType);
                    // TODO: Wire to Blueprint3D when integrated
                    // if (this.refBp3d && typeof this.refBp3d.updateStyle === 'function') {
                    //   this.refBp3d.updateStyle(styleName, styleType);
                    // }
                  }}
                  onBlockCountChanged={(count) => {
                    console.log('Block count changed:', count);
                    // TODO: Wire to Blueprint3D when integrated
                  }}
                />
              </div>

              {/* Product Action Controls */}
              {/* <ProductControls
                info={selectedItem}
                onDuplicateProduct={this.handleDuplicateProduct}
                onDeleteActiveProduct={() => {
                  if (selectedItem) {
                    selectedItem.remove();
                  }
                  this.setState({ selectedItem: null });
                }}
                onMorphAlignChanged={(align) => {
                  selectedItem.setMorphAlign(align);
                  this.forceUpdate();
                }}
                onLockChanged={(locked) => {
                  console.log('lock changed', locked);
                  if (selectedItem) {
                    selectedItem.setFixed(locked);
                  }
                  this.forceUpdate();
                }}
                onStackableChanged=(stackable) => {
                  if (selectedItem) {
                    selectedItem.setStackable(stackable);
                  }
                  this.forceUpdate();
                }}
                onOverlappableChanged={(overlappable) => {
                  if (selectedItem) {
                    selectedItem.setOverlappable(overlappable);
                  }
                  this.forceUpdate();
                }}
                onFlipHorizontal={() => {
                  if (selectedItem) {
                    selectedItem.flipHorizontal();
                  }
                }}
              /> */}
            </div>

            {/* Import Modal */}
            {showImportSetModal && (
              /* <ImportModal
                onImported={this.handleImportFromSetBuilder}
                onClose={() => this.setState({ showImportSetModal: false })}
              /> */
              null
            )}
          </div>
        </div>
      </div>
    );
  }
}

export default App;
