var io, currSocket, currWord;
var playerWords   = {}, //playerName => suggested word
	playerSockets = [], //index is playerName, value is matching socket
	players       = [], //holds connected player names
	submissionCount = 0,
	options = {
		host : 'undefined',
		room : ''
	},
	pastLeaders = [], //index is numerical, value is socket id
	leaderIDX   = -1,
	clients;

exports.initialize = function(sio, socket) {
	io         = sio;
	currSocket = socket;
	currWord   = '';


	currSocket.emit('connected', { message: 'You are connected!' });

	//Host events
	currSocket.on('createNewGame',        onCreateNewGame);
	currSocket.on('startNewGame',         onStartNewGame);

	//Player Events
	currSocket.on('playerJoin',           onPlayerJoin);
	currSocket.on('playerSubmitWord',     onPlayerSubmitWord);

	//Leader Events
	currSocket.on('leaderSubmitWord',     onLeaderSubmitWord);
	currSocket.on('leaderTypeWord',       onLeaderTypeWord);
	currSocket.on('leaderUpdatePlayer',   onLeaderUpdatePlayer);
	currSocket.on('leaderStartNextRound', onLeaderStartNextRound);
	currSocket.on('leaderEndGame',        onLeaderEndGame);

}

/****************************
 *     Host Functions       *
 ****************************/

//when a user selects 'Create New Game' on Create Page
function onCreateNewGame(data) {

	//extract the game room or default to 1337
	var gameRoom = data.roomName || '1337';

	//set the client as the host
	if (options.host === 'undefined') { options.host = this; }

	//setup the options
	options.room = gameRoom;

	playerSockets[data.playerName] = this;
	players.push(data.playerName);

	//host joins this room
	this.join(gameRoom);

	//emits that the room is created and listening for players to join if using host
	this.emit('roomCreated', { roomName : gameRoom , roll : 'host', playerList : players });
}

//when the host selects 'Start Game' on waiting screen
function onStartNewGame() {

	var randClientIdx;

	//reinitialize some stuff
	playerWords = {};
	pastLeaders = [];
	leaderIDX   = -1;
	submissionCount = 0;

	//get a list of all clients in this room
	clients = io.sockets.clients(options.room);

	//grab a random client to be the first leader
	randClientIdx = Math.round(Math.random() * (clients.length - 1));

	//keep track of the leader
	pastLeaders.push(clients[randClientIdx].id);
	leaderIDX = randClientIdx;
	//console.log(clients[randClientIdx].id);

	//tell the leader to pick a word
	clients[randClientIdx].emit('leaderSelected');
	console.log('leader: ', clients[randClientIdx].id );

	//tell the other players
	//io.sockets.in(options.room).emit('waitingForLeader');
	clients[randClientIdx].broadcast.in(options.room).emit('waitingForLeader');

	console.log('starting new game for players:', players);
}

/****************************
 *     Player Functions     *
 ****************************/
function onPlayerJoin(data) {
	var roomName = data.roomName || undefined;

	//try to find the given room

	//if exists, join room
	if (roomName === options.room) {

		//add player name to array
		playerSockets[data.playerName] = this;
		players.push(data.playerName);

		this.join(options.room);
		console.log('player joined: ', data.playerName);
		console.log('connected players: ', players);

		//emit event playerJoined to all in room
		this.emit('playerJoined', { playerList : players , roomName : options.room, playerName : data.playerName });
		this.broadcast.in(options.room).emit('playerListUpdate', { player : data.playerName });
	}
	else {

		//emit the error back to the client
		this.emit('error', { message : "This room doesn't exist: " + roomName});
	}


}

//called when any player submits a word
function onPlayerSubmitWord(data) {

	//add word to player words
	playerWords[data.playerName] = data.word;
	submissionCount++;

	this.emit('pendingOthers');
	clients[leaderIDX].emit('receivedWord', { playerName : data.playerName, word : data.word });

	//if every player has submitted a word,
	if (submissionCount === (players.length - 1)) {

		//emit to players 'roundEnd' and the new score additions
		io.sockets.in(options.room).emit('roundEnd', { words : playerWords, playerList : players });
	}
}

/****************************
 *     Leader Functions     *
 ****************************/

//called when the designated leader submits a word for the round
function onLeaderSubmitWord(data) {
	currWord = data.word || "Brains...";

	//emit roundStart to room
	io.sockets.in(options.room).emit('roundStart', { word : currWord, playerList : players });
}

//cool effect for others to see the leader typing the new word
function onLeaderTypeWord(data) {

	//emit 'leaderTypeWord' and newest version of word to clients
	this.broadcast.in(options.room).emit('leaderTypeWord', { word : data.word });

}

//called between rounds when there needs to be a score adjustment
function onLeaderUpdatePlayer(data) {
	var currPlayer;

	//grab socket from playerSockets[data.playerName]
	currPlayer = playerSockets[data.playerName];

	//emit 'leaderUpdateScore' with score addition
	currPlayer.emit('leaderUpdateScore', { score : 1 });
}

//called when leader is finished updating scores
function onLeaderStartNextRound() {
	var newLeader;

	//select a new leader
	leaderIDX = (leaderIDX + 1) % playerName.length;
	newLeader = clients[leaderIDX];

	//log new leader
	pastLeaders.push(newLeader.id);

	//emit to leader 'leaderSelected'
	newLeader.emit('leaderSelected');
	console.log('new leader: ', newLeader.id );

	//emit to players 'waitingForLeader'
	newLeader.broadcast.emit('waitingForLeader');
}

//called when a leader decides to end the game
function onLeaderEndGame() {
	io.sockets.in(options.room).emit('endGame');

	for (var i = 0; i < players.length; i++) {
		playerSockets[players[i]].leave(options.room);
		console.log('player: ', players[i], ' leaving room: ', options.room);
		options.room = '';
	}
}



