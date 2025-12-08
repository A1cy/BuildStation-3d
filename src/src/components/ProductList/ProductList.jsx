import React, { Component } from 'react';
import './ProductList.css';

/**
 * ProductList Component
 *
 * Displays product categories and items with search functionality.
 * Users can filter products by category and search term, then click or drag items.
 *
 * Props:
 * - items: Array of category objects with format:
 *   [{ category: "Furniture", styles: [{ name: "Chair", image: "url" }] }]
 * - onProductClicked: Function called when product is clicked
 * - onClose: Function called when close button is clicked
 */
class ProductList extends Component {
  constructor(props) {
    super(props);

    this.state = {
      activeCategory: -1,  // Index of expanded category (-1 = none)
      searchKey: ''        // Current search term
    };
  }

  /**
   * Filter categories and products based on search term
   * @param {Array} categories - Array of category objects
   * @returns {Array} Filtered categories with matching products
   */
  filterCategories = (categories) => {
    const { searchKey } = this.state;
    const filtered = [];

    categories.forEach((category) => {
      const matchingProducts = [];

      category.styles.forEach((product) => {
        // If search term exists, filter by product name
        if (searchKey && searchKey.length > 0) {
          if (product.name.toLowerCase().includes(searchKey.toLowerCase())) {
            matchingProducts.push(product);
          }
        } else {
          // No search term, include all products
          matchingProducts.push(product);
        }
      });

      filtered.push({
        category: category.category,
        styles: matchingProducts
      });
    });

    return filtered;
  };

  /**
   * Render product grid for a category
   * @param {Array} products - Array of product objects
   * @returns {JSX} Product grid
   */
  renderProducts = (products) => {
    return (
      <div className="styles-section">
        {products && Array.isArray(products) && products.map((product, index) => (
          <div
            key={index}
            className="styles-item"
            draggable
            onClick={() => {
              if (typeof this.props.onProductClicked === 'function') {
                this.props.onProductClicked(product);
              }
            }}
            onDragStart={(e) => {
              e.dataTransfer.setData('info', JSON.stringify(product));
            }}
          >
            <img
              alt="thumbnail"
              src={product.image}
            />
            <div className="tip">
              {product.name}
            </div>
          </div>
        ))}
      </div>
    );
  };

  /**
   * Toggle category expansion
   * @param {number} categoryIndex - Index of category to toggle
   */
  toggleCategory = (categoryIndex) => {
    const { activeCategory } = this.state;
    this.setState({
      activeCategory: categoryIndex === activeCategory ? -1 : categoryIndex
    });
  };

  /**
   * Handle search input change
   * @param {Event} e - Input change event
   */
  handleSearchChange = (e) => {
    this.setState({
      searchKey: e.target.value
    });
  };

  render() {
    const { items, onClose } = this.props;
    const { activeCategory } = this.state;
    const filteredCategories = this.filterCategories(items);

    return (
      <div className="category-section">
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <h4 style={{ flex: 1, margin: 0 }}>
            Categories
          </h4>
          <div onClick={onClose}>
            <i className="fa fa-close"></i>
          </div>
        </div>

        {/* Search Box */}
        <div>
          <input
            className="search-box"
            placeholder="search"
            value={this.state.searchKey}
            onChange={this.handleSearchChange}
          />
        </div>

        {/* Category List */}
        {Array.isArray(filteredCategories) && filteredCategories.map((category, index) => (
          <div key={index}>
            {/* Category Header */}
            <div
              className={`category-item ${index === activeCategory ? 'active' : ''}`}
              onClick={() => this.toggleCategory(index)}
            >
              {category.category}{' '}
              <span style={{ color: '#aaa' }}>
                ({category.styles.length})
              </span>
            </div>

            {/* Product Grid (shown when category is active) */}
            {index === activeCategory && this.renderProducts(category.styles)}
          </div>
        ))}
      </div>
    );
  }
}

export default ProductList;
