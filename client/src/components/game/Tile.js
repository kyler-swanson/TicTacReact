import React from 'react';

class Tile extends React.Component {
  render() {
    const tileClasses = 'tile-container ' + (this.props.winningTile ? 'highlight' : '');
    return (
      <td className={tileClasses} onClick={this.props.onClick}><span className="tile">{this.props.value}</span></td>
    );
  }
}

export default Tile;