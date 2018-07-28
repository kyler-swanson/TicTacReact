import React from 'react';
import Confetti from 'react-dom-confetti';

class Status extends React.Component {
  render() {
    const config = {
      angle: 90,
      spread: 85,
      startVelocity: 55,
      elementCount: 97,
      decay: 0.9
    };

    return (
      <div className="status">
        <h2 className="heading">{this.props.heading}</h2>
        <div style={{width: '20px', margin: 'auto'}}>
          <Confetti active={ this.props.gameOver } config={config}/>
        </div>
        <p className="body">{this.props.body}</p>
      </div>
    );
  }
}

export default Status;