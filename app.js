#!/usr/bin/env nodejs
var express = require('express');
var app = express();
const io = require('socket.io')();

//const Game = require('./src/classes/Game.js');

// Initialize web + socket server \\
init();

function init() {

  // Set server ports \\
  const WEB_PORT = 3000;
  const SOCKET_PORT = 2096;

  /* 
    Set client directory (relative to this file)
    Set route (in url, eg. http://example.com/app)
  */

  const CLIENT_DIR = '/client/build';
  const URL_ROUTE = '/app';

  /*
    EXPRESS
  */

    /*
  app.get(URL_ROUTE, function(req, res){
    res.sendFile(__dirname + CLIENT_DIR + '/index.html');
  });

  app.use(express.static(__dirname + CLIENT_DIR));
  */

  app.get(URL_ROUTE, function(req, res){
    res.sendFile(__dirname + CLIENT_DIR + '/index.html');
  });

  console.log(__dirname + CLIENT_DIR + '/static');
  app.use(express.static(__dirname + CLIENT_DIR));

  app.listen(WEB_PORT, function() {
    console.log('[TIC TAC REACT] Web server live on port ' + WEB_PORT);
  });

  /*
    SOCKET.IO
  */

 io.listen(SOCKET_PORT);
 console.log('[TIC TAC REACT] Socket server live on port ' + SOCKET_PORT);
 console.log('[TIC TAC REACT] Waiting for players...');

 initListeners();
}

let games = {};

/*
  Helper
  Functions
*/

function getStatus(type, player = '') {
  const status = {
    default: {heading: 'Tic Tac React', body: 'Waiting for game to start...'},
    xTurn: {heading: "X's turn", body: ['Make your move!', 'Waiting for ' + player + '...']},
    oTurn: {heading: "O's turn", body: ['Make your move!', 'Waiting for ' + player + '...']},
  };

  return status[type];
}

function getNumGames() {
  const length = Object.keys(games).length;
  return length;
}

function getUserGame(username) {
  const numGames = getNumGames();
  if (numGames > 0) {
    for (let i = 0; i < numGames; i++) {
      if (games[i]) {
        if (games[i].getPlayers()[username]) {
          return games[i];
        }
      }
    }
  }
  return false;
}

function generatePlayerList(plyList) {
  let players = [];
  for (let i = 0; i < 2; i++) {
    players[i] = 
    {
      name: (
        plyList[Object.keys(plyList)[i]] ? 
        Object.keys(plyList)[i] : 
        'Searching..'
      ), 
      isX: (
        plyList[Object.keys(plyList)[i]] ? 
        plyList[Object.keys(plyList)[i]].isX : 
        true
      ),
    };
  }

  return players;
}

function placeUser(username, socket) {
  const numGames = getNumGames();
  if (numGames > 0) {
    for (let i = 0; i < numGames; i++) {
      if (games[i]) {
        if (!games[i].isInProgress() && games[i].getNumPlayers() < 2) {
          if (!games[i].getPlayers()[username]) {
            games[i].addPlayer(username, socket);
            return true;
          }
        }
      }
    }
  }
  var game = new Game();
  game.addPlayer(username, socket);
  return true;
}

function getGamePrefix(id) {
  return '[GAME #' + id + '] ';
}

function calculateWinner(moves) {
  const lines = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6],
  ];
  for (let i = 0; i < lines.length; i++) {
    const [a, b, c] = lines[i];
    if (moves[a] != '_' && moves[a] === moves[b] && moves[a] === moves[c]) {
      return {winner: moves[a], tiles: lines[i]};
    }
  }
  return {winner: null, tiles: null};
}

/*
  Socket server + game logic
*/

function initListeners() {
  io.on('connection', (client) => {
    let username = '';
  
    client.on('login', (data) => {
      if (!getUserGame(data.user)) {
        username = data.user;
        placeUser(username, client);
      } else {
        client.disconnect(true);
      }
    });
  
    client.on('disconnect', (reason) => {
      console.log(reason);
      const numGames = getNumGames();
      if (numGames > 0) {
        for (let i = 0; i < numGames; i++) {
          if (games[i]) {
            if (games[i].getPlayers()[username]) {
              games[i].removePlayer(username);
            }
          }
        }
      }
    });
  
    client.on('doMove', (moves) => {
      let game = getUserGame(username);
      if (!game.getWinner()) {
        game.handleMove(moves);
      }
    });
  });
}

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