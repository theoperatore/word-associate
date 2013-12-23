var app = require('http').createServer(handler),
	io  = require('socket.io').listen(app),
	fs  = require('fs'),
	count = 0;

app.listen(8080);

function handler(req, res) {
	fs.readFile(__dirname + '/public/index-http.html', function(err, data) {
		if (err) {
			res.writeHead(500);
			res.end("Error Loading Landing Page");
		}
		else {
			res.writeHead(200);
			res.end(data);
		}
	});
}

io.sockets.on('connection', function(socket) {
	count++;
	var vector = { 
		x: 0, 
		y: 0,
		message : "",
		magnitude : function() { return Math.sqrt(((this.x * this.x) + (this.y * this.y))); },
		currMag : 0 
		};

	socket.broadcast.emit('new user', count);
	socket.emit('new user', count);
	
/*
	setInterval(function() {
		vector.x += 1;
		vector.y += 1;
		vector.currMag = vector.magnitude();
		

		socket.emit('xmit', vector);
	}, 1000);
*/
	socket.on('disconnect', function() {
		count--;

		io.sockets.emit('new user', count);		
		console.log('User Disconnected');
	});

	socket.on('vecUpdate', function(v) {
		if (vector.currMag !== v.currMag) {
			vector.message = "Not the Same Magnitudes! -- " + vector.currMag + " : " + v.currMag;
			socket.emit('not same', vector);
		}
		else {
			vector.message = "Same magnitudes";
			socket.emit('same',vector);
		}
	});

	socket.on('set user name', function(name) {
		socket.set('nickname', name, function() {
			socket.emit('ready');
		});
	});

	socket.on('get user name', function() {
		socket.get('nickname', function(err, name) {
			if (err) { console.log(err); return ;}

			console.log(name);
		});
	})
});