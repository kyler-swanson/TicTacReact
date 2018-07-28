import React from 'react';

class Players extends React.Component {
  
  render() {
    const players = this.props.players;
    if (players) {
      return (
        <div className="players">
          <div className="player1">
            <h3>{(players[0].name.substring(0, 20) !== players[0].name ? players[0].name.substring(0, 20) + '..' : players[0].name)}</h3>
            <span>{(players[0].isX ? 'X' : 'O')}</span>
          </div>
          <div className="player2">
            <h3>{(players[1].name.substring(0, 20) !== players[1].name ? players[1].name.substring(0, 20) + '..' : players[1].name)}</h3>
            <span>{(players[1].isX ? 'X' : 'O')}</span>
          </div>
        </div>
      );
    } else { return false; }
  }
}

export default Players;