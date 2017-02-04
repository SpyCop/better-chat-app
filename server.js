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

	// console.log(socket);
	// console.log("/\Socket\/")
	// console.log(io.sockets.connected);

	socket.emit('message', {
		user: "System",
		text: "Current users: " + users.join(', '),
		timestamp: moment().valueOf()
	});
};

function loadMessages(socket, amount) {
	var userInfo = clientInfo[socket.id];

	if (typeof userInfo != 'undefined') {
		db.message.count({
			where: {
				room: userInfo.room
			}
		}).then(function (count) {
			if (count < amount) count = amount;
			db.message.findAll({
				where: {
					room: userInfo.room
				},
				//offset: count-amount,
				limit: amount,
				order: 'timestamp DESC'
			}).then(function (messages) {
				socket.emit('message', messages);
			});
		});
	};
};

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
				text: userData.name + ' has left'
			});
			delete clientInfo[socket.id];
		}
	});

	socket.on('joinRoom', function(req) {
		clientInfo[socket.id] = req;
		socket.join(req.room);
		socket.broadcast.to(req.room).emit('message', {
			user: "System",
			text: req.name + ' has joined'
		});
		
		loadMessages(socket, 30);
		//load in 30 msgs, what about unread messages?
		//should we adjust styling? 30 is a long way scrolling, autofocus on last and maybe put own messages on the right (#cloneWhatsapp?)
	});

	socket.on('message', function(message) {
		console.log('Message received: ' + message.user + ' in ' + message.room + ' @ ' + moment.utc(message.timestamp).local().format('D/M/YYYY HH:mm') + ': ' + message.text);
		var receiverName;

		if (message.text === '@currentUsers') {
			sendCurrentUsers(socket);
		} else {
			io.to(clientInfo[socket.id].room).emit('message', message);
			db.message.create(message);
		};
	});

	socket.on('load-messages', function (inf) {
		loadMessages(socket, inf.amount);
	});
});

db.sequelize.sync().then(function () {
	http.listen(PORT, function() {
	console.log('Server started');
	});
});

