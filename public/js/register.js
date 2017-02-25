var socket = io();

var $form = jQuery('#register-form');

$form.on('submit', function(event) {
	event.preventDefault();

	var $email = $form.find('input[name=email]');
	var $name = $form.find('input[name=name]');
	var $password = $form.find('input[name=password]');

	socket.emit('register', {
		email: $email.val(),
		name: $name.val(),
		password: $password.val()
	});
});

socket.on('register-failure', function (error) {
	console.log(error);
	if (error.message === 'Validation error: Validation isEmail failed') {
		$('#email-input').attr("class", "form-group has-error has-danger");
	} else if (error.name === 'SequelizeUniqueConstraintError') {
		$('#error').text('There is already an account with this email address, try using another or log in on the login page'); //add link here in future
	} else {
		$('#error').text(error.name + ':<br>' + error.message);
	}
});

socket.on('register-success', function () {
	window.location.href = "../index.html"
});

//for random names in the name field :P
var names = ["Jill", "Ben", "Bob", "Colt", "Andrew", "Liam", "Zoey", "Alice"];
var surnames = ["Lloyd", "Steele", "Mead", "Graham", "Davis", "Freeman", "Maron", "Red"];
var name = names[Math.floor((Math.random() * 8))] + " " + surnames[Math.floor((Math.random() * 8))];
$('#name').attr("placeholder", name);