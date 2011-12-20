UPDATES_PER_SECOND = 60;
UPDATE_TIME_BETWEEN_SENDS = 1000 / UPDATES_PER_SECOND;


var spacegame = require('./subwebspacegame');

var io = require('socket.io').listen(8080);

var game = spacegame.MakeGame();
game.Init();
game.Start();
//game.Init();
//game.CreateNewPlayer();
//game.Players[0].Shoot();

var SocketList = [];

io.sockets.on('connection', function (socket) {
	SocketList.push(socket);
	console.log("connected a player to socket " + socket);

	/*socket.on('createplayer', function (data) {
		var playerid = game.CreateNewPlayer();
		socket.emit('playercreated', playerid);
	});*/

	/*socket.on('playerinput', function (data) {
		game.PlayerInput(data);
	});*/

	/** Send data */
//	setInterval(function() { socket.emit('playerdata', game.Players); }, UPDATE_TIME_BETWEEN_SENDS);
});


