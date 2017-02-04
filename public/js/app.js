var socket = io();
var name = getName(socket) || "Anonymous";
var room = getQueryVariable('room');
var messages_amount = 30;

function getName(socket) {
	var name = getQueryVariable('name');
	if (typeof name === 'undefined') {
		return "Anonymous";
	}
	//users.[name] = socket;
	return name;
}

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
		var $message;
		for (var j = 0; j < message.length; j++) {
			var momentTimestamp = moment.utc(message[j].timestamp);

			$message = jQuery('<li class="list-group-item"></li>');
			$message.append('<p> <strong>' + message[j].user + ' @ ' + momentTimestamp.local().format('DD MMM HH:mm') + '</strong></p>');
			$message.append('<p>' + message[j].text + '</p>');

			$messages.prepend($message);
		}
	} else {
		var momentTimestamp = moment.utc(message.timestamp);
		var $message = jQuery('<li class="list-group-item"></li>');

		console.log('New message:');
		console.log(moment.utc(message.timestamp).local().format('DD MMM YYYY HH:mm') + ' - ' + message.text + message.timestamp + ' -- ' + momentTimestamp);

		$message.append('<p> <strong>' + message.user + ' @ ' + momentTimestamp.local().format('DD MMM HH:mm') + '</strong></p>');
		$message.append('<p>' + message.text + '</p>');

		$messages.append($message);	
	}
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