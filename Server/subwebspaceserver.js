UPDATES_PER_SECOND = 10;
UPDATE_TIME_BETWEEN_SENDS = 1000 / UPDATES_PER_SECOND;

SOCKETS_CLEANUP_INTERVAL = 10000;
SOCKET_MIN_SEND_TIME = 10000;

var spacegame = require('./subwebspacegame');
var email = require('mailer');

var io = require('socket.io').listen(8080);

var game = spacegame.MakeGame();

console.log("Starting game");
game.Init();
game.Start();

var PlayerCount = 1;
var Sockets = [];
var ShotsFired = [];
var HighScores = [];

console.log("Starting senddata interval");

var SendData = function () {
	var players = [];

	var T = new Date().getTime();

	for (var i in game.Players) {
		var player = game.Players[i];
		var obj = {
			R: player.Rotation,
			P: player.Pos,
			ID: player.ID,
			L: player.Lives,
			N: player.name };

		players.push(obj);
	}

	broadcast('gamedata', players, ShotsFired, T);

	ShotsFired = [];
};

var broadcast = function (event, data1, data2, data3) {
	for (var i in Sockets)
	{
		var socket = Sockets[i];
		socket.emit(event, data1, data2, data3);
	}
};

var ClearSockets = function () {
	var time = new Date().getTime();
	for (var i in Sockets) {
		var socket = Sockets[i];
		if (time - socket.LastReceive > SOCKET_MIN_SEND_TIME)
		/** hopefully socket.io will close the actual connection himself.. */
			Sockets.splice(i, 1);
	}
};

setInterval(SendData, UPDATE_TIME_BETWEEN_SENDS);
setInterval(ClearSockets, SOCKETS_CLEANUP_INTERVAL);

io.sockets.on('connection', function (socket) {
	socket.PlayerID = PlayerCount++;
	console.log("Player given ID of " +  socket.PlayerID);

	Sockets.push(socket);
	console.log("connected a player to socket " + socket);

	socket.on('playercreate', function (data) {
		var name = game.CreatePlayer(socket.PlayerID, data.N);

		var players = [];
		for (var i in game.Players) {
			var player = game.Players[i];
			players.push({ 
				ID:player.ID,
				X:player.Pos.X,
				Y:player.Pos.Y,
				R:player.Rotation,
				L:player.Lives,
				N:player.name
				});
		}

		socket.emit('playercreated', { PlayerID:socket.PlayerID, tick:game.tick, ticktime:game.ticktime, P: players, N:name });
		broadcast('addplayer', { ID: socket.PlayerID, N:name });
		socket.LastReceive = new Date().getTime();
	});

	socket.on("clientping", function (data) {
		data.servertime = new Date().getTime();
		socket.emit("serverping", data);
	});

	socket.on('clientdata', function (data) {
		game.UpdatePlayerActions(data);
		socket.LastReceive = new Date().getTime();
	});

	socket.on('disconnect', function (data) {
		game.RemovePlayer(socket.PlayerID);
		broadcast('removeplayer', { ID: socket.PlayerID });
		for (var i in Sockets)
			if (Sockets[i].PlayerID == socket.PlayerID)
				Sockets.splice(i, 1);
	});

	socket.on('fire', function (data) {
		ShotsFired.push(data);
	});

	socket.on('spawn', function (data) {
		game.Spawn(data);
		broadcast('spawn', data);
	});

	socket.on('hit', function (data) {
		broadcast('hit', data);
		game.Hit(data);
	});

	socket.on('playernamechange', function (data) {
		data.ID = socket.PlayerID;
		game.UpdatePlayerName(data);
		broadcast('namechange', data);
	});

	socket.on('highscore', function (data) {
		var changed = game.ReceiveHighScore(data);
		if (changed) broadcast('highscores', game.HighScores);
	});
});
