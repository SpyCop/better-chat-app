var PORT = process.env.PORT || 3000;
var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var moment = require('moment');
var db = require('./db.js');
var data = {};

app.use(express.static(__dirname + '/public'));

var clientInfo = {};

//@currentUsers send all room's users to socket
function sendCurrentUsers(socket) {
	var info = clientInfo[socket.id];
	var users = [];

	if (typeof info === 'undefined') {
		return;
	}

	Object.keys(clientInfo).forEach(function(socketID) {
		var userInfo = clientInfo[socketID];
		if (info.room === userInfo.room) {
			users.push(userInfo.name);
		}
	});

	console.log(socket);
	console.log("/\Socket\/")
	console.log(io.sockets.connected);

	socket.emit('message', {
		user: "System",
		text: "Current users: " + users.join(', '),
		timestamp: moment().valueOf()
	});
}

/*
function checkWords(words) {
	words.forEach(function(word) {
		if (word === '@private') {
			return true;
		}
	});
	return false;
}
*/

io.on('connection', function(socket) {
	console.log('User connected via Socket.io');

	socket.on('disconnect', function() {
		var userData = clientInfo[socket.id];

		if (typeof userData !== 'undefined') {
			socket.leave(userData.room);
			io.to(userData.room).emit('message', {
				user: "System",
				text: userData.name + ' has left',
				timestamp: moment().valueOf()
			});
			delete clientInfo[socket.id];
		}
	});

	socket.on('joinRoom', function(req) {
		clientInfo[socket.id] = req;
		socket.join(req.room);
		socket.broadcast.to(req.room).emit('message', {
			user: "System",
			text: req.name + ' has joined',
			timestamp: moment().valueOf()
		});

		// find last 30 messages from this room and load them in?  (what about unread messages)
	});

	socket.on('message', function(message) {
		console.log('Message received: ' + message.user + ' in ' + message.room + ' @ ' + moment.utc(message.timestamp).local().format('D/M/YYYY HH:mm') + ': ' + message.text);
		var receiverName;

		if (message.text === '@currentUsers') {
			sendCurrentUsers(socket);
		} else {
			message.timestamp = moment().valueOf();
			io.to(clientInfo[socket.id].room).emit('message', message);
		};
		db.message.create(message);
	});

	socket.emit('message', {
		text: "Welcome to the chat app!",
		timestamp: moment().valueOf(),
		user: "The System"
	});
});

db.sequelize.sync().then(function () {
	http.listen(PORT, function() {
	console.log('Server started');
	});
});

