UPDATES_PER_SECOND = 2;
UPDATE_TIME_BETWEEN_SENDS = 1000 / UPDATES_PER_SECOND;


var spacegame = require('./subwebspacegame');

var io = require('socket.io').listen(8080);

var game = spacegame.MakeGame();

console.log("Starting game");
game.Init();
game.Start();
//game.Init();
//game.CreateNewPlayer();
//game.Players[0].Shoot();


var PlayerCount = 0;
var Sockets = [];

console.log("Starting senddata interval");

var SendData = function () {
	var data = game.Players;

	for (var i in Sockets)
	{
		var socket = Sockets[i];
		socket.emit('gamedata', data);
	}
};

setInterval(SendData, UPDATE_TIME_BETWEEN_SENDS);


io.sockets.on('connection', function (socket) {
	socket.PlayerID = PlayerCount++;
	Sockets.push(socket);
	console.log("connected a player to socket " + socket);

	console.log("Player given ID of " +  socket.PlayerID);//PlayerID);

	game.CreatePlayer(socket.PlayerID);

	socket.emit("clientaccepted", { PlayerID:socket.PlayerID });
	/*socket.on('createplayer', function (data) {
		var playerid = game.CreateNewPlayer();
		socket.emit('playercreated', playerid);
	});*/

	socket.on('clientdata', function (data) {
		game.UpdatePlayerActions(data);
	});

	socket.on('disconnect', function (data) {
		game.RemovePlayer(socket.PlayerID);
		for (var i in Sockets)
			if (Sockets[i].PlayerID == socket.PlayerID)
				Sockets.splice(i, 1);
	});
	/*socket.on('playerinput', function (data) {
        console.log('player input received: ' + data);
		//game.PlayerInput(data);
	});*/
});
