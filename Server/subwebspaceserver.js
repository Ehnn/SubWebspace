UPDATES_PER_SECOND = 20;
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
	var players = [];

	var T = new Date().getTime();

	for (var i in game.Players) {
		var player = game.Players[i];
		var obj = {
			R: player.Rotation,
			P: player.Pos,
			ID: player.ID,
			L: player.Lives,
			N: player.name
};

/*		for (var j in player.Shots) {
			var shot = player.Shots[j];
			obj.S.push({ P:shot.Pos, R:shot.Rot});
		}*/

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

var ShotsFired = [];

setInterval(SendData, UPDATE_TIME_BETWEEN_SENDS);


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
	});

	socket.on("clientping", function (data) {
		data.servertime = new Date().getTime();
		socket.emit("serverping", data);
	});

	socket.on('clientdata', function (data) {
		game.UpdatePlayerActions(data);
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
});
