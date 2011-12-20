UPDATES_PER_SECOND = 1;
UPDATE_TIME_BETWEEN_SENDS = 1000 / UPDATES_PER_SECOND;


var spacegame = require('./subwebspacegame');

var io = require('socket.io').listen(8080);

var game = spacegame.MakeGame();
//game.Init();
//game.CreateNewPlayer();
//game.Players[0].Shoot();

var SocketList = [];

io.sockets.on('connection', function (socket) {
	SocketList.push(socket);
	console.log("connected a player to socket " + socket);
    
    game.Init();
    game.Start();
    console.log("game started");

	/*socket.on('createplayer', function (data) {
		var playerid = game.CreateNewPlayer();
		socket.emit('playercreated', playerid);
	});*/

	socket.on('playerinput', function (data) {
        console.log('player input received: ' + data);
		//game.PlayerInput(data);
	});

	/** Send data */
	setInterval(function() { socket.emit('playerdata', 5/*game.Players*/); }, UPDATE_TIME_BETWEEN_SENDS);
});