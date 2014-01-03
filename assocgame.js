/********************************************************
 *    TODO LIST                                         *
 *                                                      *
 *  1. account for different modes: CAH or COF          *
 *  2. implement player leaving events                  *
 *  3. clean up variables                               *
 ********************************************************/

//Create new data structure to handle players?
var Player = function(name,socket) {
	this.name   = name;
	this.socket = socket;
	this.id     = socket.id;
	this.submittedWord = '';
}

var io, currSocket, currWord;
var playerWords   = {}, //playerName => suggested word
	playerSockets = {}, //index is playerName, value is matching socket
	players       = [], //holds connected player names
	socketToName  = {}, //index is socket.id, value is playerName
	submissionCount = 0,
	options = {
		host : 'undefined',
		room : '',
		mode : ''
	},
	pastLeaders = [], //index is numerical, value is socket id
	leaderIDX   = -1,
	clients,
	gameStarted = false,
	playerObjs = [];

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

	currSocket.on('disconnect', function() {
		var playerName;

		playerName = socketToName[currSocket.id] || 'undefined';

		console.log('client disconnected', playerName, currSocket.id);

		for (var i = 0; i < players.length; i++) {
			if (players[i] === playerName) {
				console.log('found match', players[i], playerName);

				var p = players.splice(i,1);
				console.log('removing player:',p);
				break;
			}
		}

		if (options.room !== '') {

			//TODO: Update client 'playerListUpdate' or 'playerLeft'
			//currSocket.broadcast.in(options.room).emit('playerLeft', { players : players });
		}

		console.log(players);
	});
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
	options.mode = data.mode;
	players = [];
	socketToName[this.id] = data.playerName;


	playerSockets[data.playerName] = this;
	players.push(data.playerName);

	playerObjs.push(new Player(data.playerName, this));
	console.log(playerObjs);

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
	clients[randClientIdx].emit('leaderSelected', { gameStarted : gameStarted });
	console.log('leader: ', clients[randClientIdx].id );

	//tell the other players
	//io.sockets.in(options.room).emit('waitingForLeader');
	clients[randClientIdx].broadcast.in(options.room).emit('waitingForLeader', { gameStarted : gameStarted });

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
		socketToName[this.id] = data.playerName;

		playerObjs.push(new Player(data.playerName, this));
		console.log(playerObjs);

		this.join(options.room);
		console.log('player joined: ', data.playerName);
		console.log('connected players: ', players);

		//emit event playerJoined to all in room
		this.emit('playerJoined', { playerList : players , roomName : options.room, playerName : data.playerName, gameStarted : gameStarted });
		this.broadcast.in(options.room).emit('playerListUpdate', { player : data.playerName, gameStarted : gameStarted });
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

	for (var i = 0; i < playerObjs.length; i++) {
		if (playerObjs[i].name === data.playerName) {
			playerObjs[i].submittedWord = data.word;

			console.log(playerObjs[i].name, ' submitted: ', playerObjs[i].submittedWord);
		}
	}

	this.emit('pendingOthers');
	clients[leaderIDX].emit('receivedWord', { playerName : data.playerName, word : data.word });

	//if every player has submitted a word,
	if (submissionCount === (players.length - 1)) {

		//if cof mode, compare answers and send word/players to entire room and score updates to scoring players
		if (options.mode === 'useCOFMode') {
			console.log('Scoring Circle of Friends Mode...');

			//loop through all players

				//add player word to countingObject, indexed by word.


			//new var for currWinningWord
			//new var for timesEntered
			//loop through counted words 

				//if (counted words times > timeEntered) 

					//currWinningWord = curr counted word index
					//timesEntered = curr counted word times

			
				//handle a tie

			//end loop

			//loop through playerObjs

				//if (playerObjs submittedWord === currWinningWord) 

					//emit to that player score change

			//end loop
		}

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

//called when a leader selects a player's score
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
	leaderIDX = (leaderIDX + 1) % players.length;
	newLeader = clients[leaderIDX];

	//log new leader
	pastLeaders.push(newLeader.id);

	//reinitialize game variables
	submissionCount = 0;
	playerWords = {};

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
	}

	options.room = '';
	options.mode = '';
}