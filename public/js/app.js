var socket = io();
var name = getName() || "Anonymous";
var room = getQueryVariable('room');
var messages_amount = 30;

function getName() {
	var name = getQueryVariable('name');
	if (typeof name === 'undefined') {
		return "Anonymous";
	}
	return name;
};

function createMessage(user, message) {
	var momentTimestamp = moment.utc(message.timestamp);

	if (user == message.user) var $message = jQuery('<li class="list-group-item" style="text-align: right"></li>');
	else var $message = jQuery('<li class="list-group-item"></li>');
	$message.append('<p> <strong>' + message.user + ' @ ' + momentTimestamp.local().format('DD MMM HH:mm') + '</strong></p>');
	$message.append('<p style="margin: 0 0 0 5px">' + message.text + '</p>');

	return $message;
};

jQuery('.room-title').text(room);

socket.on('connect', function() {
	console.log(name + ' connected to Socket.io server in room ' + room);
	socket.emit('joinRoom', {
		name: name,
		room: room
	});
});

socket.on('message', function(message) {
	var $messages = jQuery('.messages');

	if (Array.isArray(message) == true) {
		$(".messages").html(''); //I remove the html of .messages because I load all last 60 messages instead of an extra 30, needs fixin'

		for (var j = 0; j < message.length; j++) {
			$messages.prepend(createMessage(getName(), message[j]));
		}
	} else {
		console.log('New message:');
		console.log(moment.utc(message.timestamp).local().format('DD MMM YYYY HH:mm') + ' - ' + message.text);

		$messages.append(createMessage(getName(), message));
	};
});

//read submitted form
var $form = jQuery('#message-form');

$form.on('submit', function(event) {
	event.preventDefault();

	var $message = $form.find('input[name=message]');

	socket.emit('message', {
		text: $message.val(),
		user: name,
		room: room,
		timestamp: moment().valueOf()
	});

	$message.val('');
});

//load more messages
var $loading = jQuery('#load-messages');

$loading.on('submit', function(event) {
	event.preventDefault();

	messages_amount += 30;
	socket.emit('load-messages', {
		amount: messages_amount
	});
});