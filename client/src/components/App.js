import React from 'react';
import Login from './game/Login';
import Players from './game/Players';
import Dialog from './game/Dialog';
import Board from './game/Board';

import io from 'socket.io-client';

let username = null;
let socket = null;

class App extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      username: '',
      hideBoard: true,

      connected: false,
      gameId: null,
      gameStarted: false,
      gamePlayers: null,

      winner: null,
      winningTiles: null,

      showDialog: false,
      dialogText: 'Join a new game?',
      dialogActions: [{action: 'Yes', onClick: () => this.doReplay()}, {action: 'No', onClick: () => this.reset(true)}],

      status: {heading: 'Tic Tac React', body: 'Looking for game...'},
      
      xTurn: null,
      ixX: null,

      moves: Array(9).fill('_'),
    }
  }
  
  componentDidMount() {
    /*
      setTimeout(() => {
        this.handleSocket(this.state.username);
      }, 2000);
    */
  }

  reset(wipeUser = false) {
    if (!wipeUser) {
      this.setState({
        hideBoard: false,
        
        gameId: null,
        status: {heading: 'Tic Tac React', body: 'Looking for game...'},
        gameStarted: false,
        gamePlayers: null,

        winner: null,
        winningTiles: null,

        showDialog: false,

        connected: false,
        xTurn: null,
        isX: null,
        moves: Array(9).fill('_'),
      });
    } else {
      this.setState({
        username: '',
        hideBoard: true,

        connected: false,
        gameId: null,
        gameStarted: false,
        gamePlayers: null,

        winner: null,
        winningTiles: null,

        showDialog: false,

        status: {heading: 'Tic Tac React', body: 'Looking for game...'},
        
        xTurn: null,
        ixX: null,

        moves: Array(9).fill('_'),
      });
    }
  }

  showDialog() {
    this.setState({
      showDialog: true,
    });
  }

  doReplay() {
    this.reset();

    setTimeout(() => {
      socket.connect();
    }, 2000);
  }

  handleSocket(username) {
    socket = io(process.env.REACT_APP_SOCKET_URL);

    socket.on('connect', () => {
      socket.emit('login', {user: username});
      socket.on('gameJoin', (resp, id) => {
        this.setState({
          connected: resp,
          gameId: id,
        });
      });
    });

    socket.on('disconnect', (reason) => {
      this.showDialog();
    });

    socket.on('gameStart', (status, players) => {
      this.setState({
        gameStarted: status,
      });
    });

    socket.on('gameEvent', (data) => {
      this.setState({
        moves: data.moves,
        xTurn: data.xTurn,
        status: data.status,
      });
    });

    socket.on('gameUpdatePlayers', (players) => {
      this.setState({
        gamePlayers: players,
      })
    });

    socket.on('gameWinner', (data, tiles) => {
      this.setState({
        winner: data,
        winningTiles: tiles,
        status: {heading: data, body: 'has won!'},
      });
    });

    socket.on('gameSetup', (data) => {
      this.setState({
        status: data.status,
        isX: data.isX,
      })
    });
  }

  handleEnter(event) {
    if (username && username.match('^[A-Za-z0-9 _]*[A-Za-z0-9][A-Za-z0-9 _]*$')) {
      if (event.key === 'Enter'){
        this.setState({
          username: username,
          hideBoard: false,
        });

        setTimeout(() => {
          this.handleSocket(this.state.username);
        }, 3000);
      }
    }
  }

  handleUsernameChange(event) {
    username = event.target.value;
  }

  handleMove(i) {
    if (this.state.connected && this.state.gameStarted && !this.state.winner) {
      if (this.state.xTurn === this.state.isX || !this.state.xTurn === !this.state.isX) {
        const moves = this.state.moves;
        if (moves[i] === '_') {
          moves[i] = this.state.xTurn ? 'X' : 'O';

          this.setState({
            moves: moves,
          });

          socket.emit('doMove', moves);
        }
      }
    }
  }

  render() {
    if (!this.state.username) {
      return (
        <Login handleEnter={(event) => {this.handleEnter(event)}} handleUsernameChange={(event) => {this.handleUsernameChange(event)}} />
      );
    } else {
      return (
        <div className="game">
          <Board
            winningTiles={this.state.winningTiles}
            gameOver={(this.state.winner != null ? true : false)}
            extraClasses={this.state.hideBoard ? 'hidden' : 'visible'}
            moves={this.state.moves} 
            onClick={(i) => this.handleMove(i)}
            gameStarted={this.state.gameStarted} 
            status={
              {
              heading: this.state.status.heading, 
              body: (this.state.gameStarted && !this.state.winner ? 
                (this.state.isX === this.state.xTurn ? 
                this.state.status.body[0] : 
                this.state.status.body[1]) : 
                this.state.status.body)
              }
            }
          />
          <Players players={this.state.gamePlayers} />
          <Dialog text={this.state.dialogText} showDialog={this.state.showDialog} actions={this.state.dialogActions}/>
        </div>
      );
    }
  }
}

export default App;