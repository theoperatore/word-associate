/********************************
 * Word Association Game Server *
 *      Version: 0.5.1          *
 *******************************/

var express = require('express'),
	path    = require('path'),
	port    = 8080;

var app = express();

	app.configure(function() {
		//modify logging activity
		//app.use(express.logger('dev')); 

		app.use(express.static(path.join(__dirname, 'public')));
	});

var server = require('http').createServer(app).listen(port),
	io     = require('socket.io').listen(server),
	ag     = require('./assocgame');

//use to turn down the logging of Socket.IO
io.set('log level',1);

io.sockets.on('connection', function(socket) {
	console.log('client connected', socket.id);

	ag.initialize(io,socket);
});