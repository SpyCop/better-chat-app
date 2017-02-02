var socket = io();
var name = getName(socket) || "Anonymous";
var room = getQueryVariable('room');

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
	var momentTimestamp = moment.utc(message.timestamp);
	var $messages = jQuery('.messages');
	var $message = jQuery('<li class="list-group-item"></li>');

	console.log('New message:');
	console.log(moment.utc(message.timestamp).local().format('d/m/YY HH:mm') + ' - ' + message.text);

	$message.append('<p> <strong>' + message.user + ' @ ' + momentTimestamp.local().format('DD MMM HH:mm') + '</strong></p>');
	$message.append('<p>' + message.text + '</p>');
	$messages.append($message);
});

//read submitted form
var $form = jQuery('#message-form');

$form.on('submit', function(event) {
	event.preventDefault();

	var $message = $form.find('input[name=message]');

	socket.emit('message', {
		text: $message.val(),
		user: name,
		room: room
	});

	$message.val('');
});