import React, { Component } from 'react';
import './Accordion.css';

/**
 * Accordion Component
 *
 * Simple collapsible accordion section.
 * Used by PropertyPanel for material/style sections.
 *
 * Props:
 * - label: string - Accordion header text
 * - children: ReactNode - Accordion content (shown when opened)
 */
class Accordion extends Component {
  constructor(props) {
    super(props);

    this.state = {
      opened: false
    };
  }

  toggleOpened = () => {
    this.setState({ opened: !this.state.opened });
  };

  render() {
    const { label, children } = this.props;
    const { opened } = this.state;

    return (
      <div className="custom-accordion">
        <div className="title" onClick={this.toggleOpened}>
          {label}
        </div>
        {opened && children}
      </div>
    );
  }
}

export default Accordion;
