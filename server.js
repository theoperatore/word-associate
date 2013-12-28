var express = require('express'),
	path    = require('path');

var app = express();

	app.configure(function() {
		//modify logging activity
		//app.use(express.logger('dev')); 

		app.use(express.static(path.join(__dirname, 'public')));
	});

var server = require('http').createServer(app).listen(8080),
	io     = require('socket.io').listen(server),
	ag     = require('./assocgame');

//use to turn down the logging of Socket.IO
io.set('log level',1);

io.sockets.on('connection', function(socket) {
	console.log('client connected', socket.id);

	ag.initialize(io,socket);

	socket.on('disconnect', function() {
		ag.disconnect(socket);

		console.log('client disconnect', socket.id);
	});
});