var express = require('express');
var bodyParser = require('body-parser');
var moment = require('moment');
var _ = require('underscore');
var db = require('./db.js');

var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var PORT = process.env.PORT || 3000;
var data = {}; //what is this for? or is this just me leaving code around?
var clientInfo = {};

app.use(express.static(__dirname + '/public'));
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());

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

// //POST registration
// app.post('/success_register.html', function(req, res) {
// 	var body = _.pick(req.body, 'email', 'name', 'password');
// 	console.log(body);

// 	db.user.create(body).then(function(user) {
// 		res.json(user.toPublicJSON());
// 	}, function(e) {
// 		res.status(400).json(e);
// 	});
// })

//socket stuff
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
		};
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
		//autofocus on last
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

	socket.on('register', function (details) {

		db.user.create(details)
		.then( function(user) {
			socket.emit('register-success', {});
		}, function(error) {
			socket.emit('register-failure', error);
		});
	});
});

db.sequelize.sync({force: true}).then(function () {
	http.listen(PORT, function() {
		console.log('Server started');
	});
});

