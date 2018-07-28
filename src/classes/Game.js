class Game {
  constructor () {
    for (let i = 0; i < getNumGames() + 1; i++) {
      if (games[i] == undefined) {
        this.id = i;
        games[i] = this;
        break;
      }
    }
    
    this.roomId = 'game_' + this.id;

    this.players = [];
    this.started = false;
    this.moves = Array(9).fill('_');
    this.xTurn = true;
    this.winner = null;
  }

  broadcastPlayerList() {
    const players = generatePlayerList(this.players);
    io.to(this.getRoomID()).emit('gameUpdatePlayers', players);
  }

  addPlayer(username, socket) {
    const isX = (this.getNumPlayers() == 0 ? true : false);
    this.players[username] = {isX: isX, socket: socket};
    
    socket.join(this.getRoomID());
    socket.emit('gameJoin', true, this.getID());

    socket.emit('gameSetup', 
    {
      status: getStatus('default'), 
      isX: isX,
    });

    console.log(getGamePrefix(this.getID()) + 'Player "' + username + '" has joined the game.');
    console.log(getGamePrefix(this.getID()) + this.getNumPlayers() + '/2 players have connected');

    if (this.getNumPlayers() == 2) {
      this.broadcastPlayerList();
      setTimeout(() => {
        this.start();
      }, 4000); 
    }
  }

  removePlayer(username) {
    if (this.getPlayers()[username]) {
      delete this.players[username];
      console.log(getGamePrefix(this.getID()) + username + ' disconnected (' + this.getNumPlayers() + '/2)');
  
      if (this.getNumPlayers() < 2 && this.isInProgress()) {
        console.log(getGamePrefix(this.getID()) + 'Ending game...');
        this.end();
      }

      if (this.getNumPlayers() == 0) {
        console.log(getGamePrefix(this.getID()) + 'Cleaning up...');
        this.end();
      }
   }
  }

  handleMove(moves) {
    this.setBoard(moves);
    this.xTurn = !this.isXTurn();

    io.to(this.getRoomID()).emit('gameEvent', 
    {
      moves: this.getBoard(), 
      xTurn: this.isXTurn(), 
      status: (
        this.isXTurn() ? 
        getStatus('xTurn', this.getPlayerBySide(true)) : 
        getStatus('oTurn', this.getPlayerBySide(false))
      ) 
    });
    
    const winner = calculateWinner(moves).winner;
    const tiles = calculateWinner(moves).tiles;
    if (winner) {
      const isX = (winner == 'X' ? true : false)
      console.log(getGamePrefix(this.getID()) + this.getPlayerBySide(isX) + ' has won the game!');

      this.winner = winner;
      io.to(this.getRoomID()).emit('gameWinner', this.getPlayerBySide(isX) + ' (' + winner + ')', tiles);

      setTimeout(() => {
        this.end();
      }, 5000);
    }
  }

  getID() {
    return this.id;
  }

  getRoomID() {
    return this.roomId;
  }

  getPlayers() {
    return this.players;
  }

  getPlayerBySide(isX) {
    if (isX) {
      return Object.keys(this.players)[0];
    } else {
      return Object.keys(this.players)[1];
    }
  }

  getNumPlayers() {
    const length = Object.keys(this.players).length;
    return length;
  }

  isInProgress() {
    return this.started;
  }

  getBoard() {
    return this.moves;
  }

  setBoard(moves) {
    this.moves = moves;
  }

  getWinner() {
    return this.winner;
  }

  isXTurn() {
    return this.xTurn;
  }

  start() {
    if (!this.isInProgress() && this.getNumPlayers() == 2) {
      this.broadcastPlayerList();

      console.log(getGamePrefix(this.getID()) + 'Game has been started (' + this.getNumPlayers() + '/2)');
      this.started = true;
      io.to(this.getRoomID()).emit('gameStart', true);
      io.to(this.getRoomID()).emit('gameEvent', 
      {
        moves: this.getBoard(), 
        xTurn: this.isXTurn(), 
        status: (
          this.isXTurn() ? 
          getStatus('xTurn', this.getPlayerBySide(true)) : 
          getStatus('oTurn', this.getPlayerBySide(false))
        ) 
      });
    }
  }

  end() {
      delete games[this.getID()];
      console.log(getGamePrefix(this.getID()) + 'Game has finished');
      Object.keys(this.getPlayers()).forEach((username, index) => {
        this.players[username].socket.disconnect(true);
      });
  }
}

// Add class to exports
module.exports = Game;