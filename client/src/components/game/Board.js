import React from 'react';
import Status from './Status'
import Tile from './Tile';

class Board extends React.Component {
  renderTile(i) {
    return (
      <Tile 
        winningTile={(this.props.winningTiles ? this.props.winningTiles.includes(i) : false)}
        key = {i} 
        value = {this.props.moves[i]}
        onClick = {() => this.props.onClick(i)}
      />
    );
  }

  render() {
    const classes = 'board ' + this.props.extraClasses;
    return (
      <div className={classes}>
        <table className={(this.props.gameStarted ? 'bounce' : '')}>
          <tbody>
            <tr>
              {this.renderTile(0)}
              {this.renderTile(1)}
              {this.renderTile(2)}
            </tr>
            <tr>
              {this.renderTile(3)}
              {this.renderTile(4)}
              {this.renderTile(5)}
            </tr>
            <tr>
              {this.renderTile(6)}
              {this.renderTile(7)}
              {this.renderTile(8)}
            </tr>
          </tbody>
        </table>

        <Status gameOver={this.props.gameOver} heading={this.props.status.heading} body={this.props.status.body} />
      </div>
    );
  }
}

export default Board;