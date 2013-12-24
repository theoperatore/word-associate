window.addEventListener('load', function(ev) {
	
  /************************************ 
   *   IO Module to handle IO Events  *
   ************************************/
	var IO = {

		//setup socket connections
		initialize : function() {

			//connect to server
			IO.socket = io.connect();

			//events emitted from server
			IO.socket.on('connected',         IO.onConnected);
			IO.socket.on('playerJoined',      IO.onPlayerJoined);
			IO.socket.on('playerLeft',        IO.onPlayerLeft);
			IO.socket.on('playerListUpdate',  IO.onPlayerListUpdate);
			IO.socket.on('roomCreated',       IO.onRoomCreated);
			IO.socket.on('leaderSelected',    IO.onLeaderSelected);
			IO.socket.on('leaderUpdateScore', IO.onLeaderUpdateScore);
			IO.socket.on('waitingForLeader',  IO.onWaitingForLeader);
			IO.socket.on('leaderTypeWord',    IO.onLeaderTypeWord);
			IO.socket.on('receivedWord',      IO.onReceivedWord);
			IO.socket.on('pendingOthers',     IO.onPendingOthers);
			IO.socket.on('roundStart',        IO.onRoundStart);
			IO.socket.on('roundEnd',          IO.onRoundEnd);
			IO.socket.on('startGame',         IO.onStartGame);
			IO.socket.on('endGame',           IO.onEndGame);
			IO.socket.on('error',             IO.onError);
		},

		onConnected : function() {
			console.log('connected to server');
		},

		onPlayerJoined : function(data) {
			//switch view to player waiting room
			console.log('Joined: ', data);
			App.switchTemplate(App.templates.waitingPlayerPage);

			for (var i = 0; i < data.playerList.length; i++) {
				var tmp = document.createElement('li');
				tmp.innerHTML = data.playerList[i];
				App.lists.waitingPlayerList.appendChild(tmp);
			}

			App.role = 'player';
			App.playerName = data.playerName;
			App.playerScore = 0;

			document.getElementById('waitingPlayerRoomName').innerHTML = data.roomName;
		},

		onPlayerLeft : function() {

		},

		onPlayerListUpdate : function(data) {
			console.log('player list updated:', data, App.role);

			var tmp = document.createElement('li');
			tmp.innerHTML = data.player;

			if (App.role === 'host') {
				App.lists.waitingHostPlayerList.appendChild(tmp);
			}
			else {
				App.lists.waitingPlayerList.appendChild(tmp);
			}
		},

		onRoomCreated : function(data) {
			console.log('room created:', data);
			App.role = 'host';
			App.playerName = data.playerList[0];
			App.switchTemplate(App.templates.waitingHostPage);

			for (var i = 0; i < data.playerList.length; i++) {
				var tmp = document.createElement('li');
				tmp.innerHTML = data.playerList[i];
				App.lists.waitingHostPlayerList.appendChild(tmp);		
			}

			document.getElementById('waitingHostRoomName').innerHTML = data.roomName;
		},

		onLeaderSelected : function() {
			console.log('you are the leader');
			App.switchTemplate(App.templates.leaderPage);
			App.isLeader = true;
		},

		onLeaderUpdateScore : function() {
			App.playerScore += 1;
			console.log('leaderUpdateScore', App.playerScore);

			document.getElementById('resultsPlayerScore').innerHTML = App.playerScore;

			alert('Your word was selected! ' + ' -- ' + App.suggestedWord);
		},

		onWaitingForLeader : function() {
			console.log('waiting for leader');
			App.switchTemplate(App.templates.waitingForLeaderPage);

			//populate info
			document.getElementById('waitingLeaderPlayerName').innerHTML = App.playerName;
			document.getElementById('waitingLeaderPlayerScore').innerHTML = App.playerScore;
		},

		onLeaderTypeWord : function(data) {
			document.getElementById('waitingLeaderWord').innerHTML = data.word;
		},

		onRoundStart : function(data) {
			console.log('roundStart',data);

			App.currWord = data.word;

			if (App.isLeader) {
				App.switchTemplate(App.templates.leaderUpdatePage);

				//set the submitted word
				document.getElementById('lastRoundWord').innerHTML = data.word;

				for(var i = 0; i < data.playerList.length; i++) {
					
					//if the leader isn't the current player...add to list
					if (data.playerList[i] !== App.playerName) {
						var tmp = document.createElement('li');
						tmp.innerHTML = data.playerList[i];
						tmp.classList.add('pending');
						tmp.id = data.playerList[i];
						App.lists.leaderUpdatePlayerList.appendChild(tmp);
						console.log('adding player', tmp);
					}
				}

			}
			else {
				App.switchTemplate(App.templates.playerPage);

				//set ui
				document.getElementById('currWord').innerHTML = data.word;
				document.getElementById('playerName').innerHTML = App.playerName;
				document.getElementById('playerScore').innerHTML = App.playerScore;
			}
		},

		onReceivedWord : function(data) {
			console.log('receivedWord', data);
			var player = document.getElementById(data.playerName);

			player.classList.remove('pending');
			player.classList.add('submitted');
		},

		//received after player submits a word
		onPendingOthers : function() {
			console.log('pendingOthers');

			App.switchTemplate(App.templates.resultsPage);

			document.getElementById('resultsLastRoundWord').innerHTML = App.currWord;
			document.getElementById('resultsYourWord').innerHTML = App.suggestedWord;
			document.getElementById('resultsPlayerName').innerHTML = App.playerName;
			document.getElementById('resultsPlayerScore').innerHTML = App.playerScore;

		},

		onRoundEnd : function(data) {
			console.log('roundEnd', data);
			var words = data.words,
				players = data.playerList,
				word,
				player,
				i,
				tmp;

			App.roundOver = true;

			if (App.isLeader) {
				//empty out playerList
				while (App.lists.leaderUpdatePlayerList.firstChild) {
					App.lists.leaderUpdatePlayerList.removeChild(App.lists.leaderUpdatePlayerList.firstChild);
				}

				while (players.length > 0) {
					i = Math.round(Math.random() * (players.length - 1));
					player = players.splice(i,1);

					console.log(player,App.playerName);

					if (player[0] !== App.playerName) {
						tmp = document.createElement('li');
						tmp.id = player;
						tmp.innerHTML = words[player];

						tmp.addEventListener('click', function(ev) {
							this.classList.add('selected');
							IO.socket.emit('leaderUpdatePlayer', { playerName : this.id });
						});

						App.lists.leaderUpdatePlayerList.appendChild(tmp);
					}
				}
			}
		},

		onStartGame : function() {

		},

		onEndGame : function() {
			App.switchTemplate(App.templates.startPage);
		},

		onError : function(err) {
			alert(err.message);
		}
	};
	
  /************************************ 
   * APP Module to handle Game Events *
   ************************************/
	var App = {

		role          : '',
		isLeader      : false,
		playerName    : '',
		playerScore   : 0,
		roundOver     : false,
		currWord      : '',
		suggestedWord : '',

		initialize : function() {
			App.templates  = {};
			App.inputs     = {};
			App.lists      = {};

			//reference mainView
			App.mainView = document.getElementById('mainView');

			//cacheTemplates && set start template as default
			App.templates.startPage            = document.getElementById('start-template');
			App.templates.createPage           = document.getElementById('create-template');
			App.templates.joinPage             = document.getElementById('join-template');
			App.templates.playerPage           = document.getElementById('player-template');
			App.templates.leaderPage           = document.getElementById('leader-template');
			App.templates.waitingPlayerPage    = document.getElementById('waiting-player-template');
			App.templates.waitingHostPage      = document.getElementById('waiting-host-template');
			App.templates.waitingForLeaderPage = document.getElementById('waiting-leader-template');
			App.templates.leaderUpdatePage     = document.getElementById('leader-update-template');
			App.templates.resultsPage          = document.getElementById('game-results-template');
			App.templates.currTemplate         = '';

			//bind event buttons to functions
			document.getElementById('create-new-room').addEventListener('click',  App.onCreateNewRoom);
			document.getElementById('join-new-room').addEventListener('click',    App.onJoinNewRoom);
			document.getElementById('create-room').addEventListener('click',      App.onCreateRoom);
			document.getElementById('join-room').addEventListener('click',        App.onJoinRoom);
			document.getElementById('suggest-button').addEventListener('click',   App.onPlayerSuggestWord);
			document.getElementById('submit-button').addEventListener('click',    App.onLeaderSubmitWord);
			document.getElementById('start-game').addEventListener('click',       App.onStartGame);
			document.getElementById('word-input').addEventListener('input',       App.onLeaderWordChange);
			document.getElementById('start-next-round').addEventListener('click', App.onStartNextRound);
			document.getElementById('end-game').addEventListener('click',         App.onEndGame);

			//cache text inputs
			App.inputs['create roomName'] = document.getElementById('createRoomName');
			App.inputs['create userName'] = document.getElementById('createUserName');
			App.inputs['join roomName']   = document.getElementById('joinRoomName');
			App.inputs['join userName']   = document.getElementById('joinUserName');
			App.inputs['suggested word']  = document.getElementById('suggest-word-input');
			App.inputs['leader word']     = document.getElementById('word-input');

			//cache player lists
			App.lists.leaderUpdatePlayerList = document.getElementById('leaderUpdatePlayerList');
			App.lists.waitingHostPlayerList  = document.getElementById('waitingHostPlayerList');
			App.lists.waitingPlayerList      = document.getElementById('waitingPlayerList');
		},

		onCreateNewRoom : function(ev) {
			App.switchTemplate(App.templates.createPage);
		},

		onJoinNewRoom : function(ev) {
			App.switchTemplate(App.templates.joinPage);
		},

		onCreateRoom : function(ev) {
			var room     = App.inputs['create roomName'].value,
				username = App.inputs['create userName'].value;

			if (room === '') {
				alert('Enter a Room Name!');
			}
			else if (username === '') {
				alert('Enter a Player Name!');
			}
			else {
				IO.socket.emit('createNewGame', { roomName : room, playerName : username });
			}
		},

		onJoinRoom : function(ev) {
			//do some error checking
			if (App.inputs['join roomName'].value === '') { 
				alert('Enter a Room Name!'); 
			}
			else if (App.inputs['join userName'].value === '') { 
				alert('Enter a Player Name!'); 
			}
			else {
				IO.socket.emit('playerJoin', {roomName : App.inputs['join roomName'].value, playerName : App.inputs['join userName'].value});
			}
		},

		onPlayerSuggestWord : function(ev) {
			var playerWord = App.inputs['suggested word'].value;

			if (playerWord !== '') {
				IO.socket.emit('playerSubmitWord', {word : playerWord, playerName: App.playerName});
				App.suggestedWord = playerWord;
			}
			else {
				alert('You should suggest a word!');
			}
		},

		onLeaderSubmitWord : function(ev) {
			var leaderWord = App.inputs['leader word'].value;

			if (leaderWord === '') {
				alert('Suggest a word leader!');
			}
			else {
				IO.socket.emit('leaderSubmitWord', { word : leaderWord });
			}
		},

		// called when player selects 'start game!' button after all players have joined
		onStartGame : function(ev) {
			IO.socket.emit('startNewGame');
		},

		onEndGame : function(ev) {
			IO.socket.emit('leaderEndGame');
		},

		onLeaderWordChange : function(ev) {
			IO.socket.emit('leaderTypeWord', { word : App.inputs['leader word'].value });
		},

		onStartNextRound : function(ev) {

		},

		setTemplate : function(template) {
			this.templates.currTemplate = template;
			template.classList.remove('hide');
		},

		switchTemplate : function(template) {
			this.templates.currTemplate.classList.add('hide');
			this.templates.currTemplate = template;
			template.classList.remove('hide');

		}
	};

	//initialize everything
	IO.initialize();
	App.initialize();

	//set the starting page
	App.setTemplate(App.templates.startPage);
});