FRAMES_PER_SECOND = 30;
SECONDS_BETWEEN_FRAMES = 1000 / FRAMES_PER_SECOND;

CANVASWIDTH = 1024;
CANVASHEIGHT = 768;
CANVAS_BORDER_SPACE = 20;

ASTEROID_CREATION_TIME = 7;
MAX_ASTEROIDS_NUM = 10;

module.exports.MakeGame = function () { return new Game(); };

var asteroidfile = require('./asteroid');
var playerfile = require('./player');

function Game() {
	var that = this;
	this.Players = null;
	this.Asteroids = null;
	this.AsteroidCreationTimer = 0;

	/** 0 = game going, 1 = player1 won, 2 = player2 won, -1 = before game began */
	this.GameState = -1;

	this.gameloop = null;

	this.lastFrame = new Date().getTime();
	this.tick = 0;
	this.gamestarttime = 0;

	this.Init = function () {
	};

	this.Start = function () {
		this.gamestarttime = new Date().getTime();
		this.tick = 0;
		that.GameState = 0;

		/** Init players / asteroids */
		this.Players = [];
		this.Asteroids = [];

		/** Game loop */
	        this.gameloop = setInterval(function(){ that.GameLoop();}, SECONDS_BETWEEN_FRAMES);
		
		return this;
	};

	this.GameLoop = function () {
		this.tick++;
		var thisFrame = new Date().getTime();
		var dt = (thisFrame - this.lastFrame)/1000;
	        this.lastFrame = thisFrame;

		this.Update(dt);
	};

	this.Update = function (/** time diff */ dt) {
/*		this.AsteroidCreationTimer -= dt;
		if (this.AsteroidCreationTimer <= 0 && this.Asteroids.length <=MAX_ASTEROIDS_NUM)
		{
			this.AsteroidCreationTimer = ASTEROID_CREATION_TIME;
			CreateAsteroid(3);
		}*/

		for (var i in this.Players)
		{
			var player = this.Players[i];

			player.Update(dt);
			for (var j in player.Shots)
			{
				var shot = player.Shots[j];

				shot.Update(dt);

				//FIX when teams are in, only check on enemies
				for (var k in this.Players)
				{
					var otherplayer = this.Players[k];
					if (otherplayer.ID != player.ID && CheckLaserCollision(otherplayer, shot))
					{
						otherplayer.Lives--;
						if (otherplayer.Lives <= 0)
						{
							otherplayer.Destroy();
						}
						
						DestroyShot(player, j);
					}
				}

				if (shot.Fadeout <= 0) DestroyShot(player, i);
			}
		}

/*
		for (var i in this.Asteroids) {
			asteroid = this.Asteroids[i];
			asteroid.Update(dt);

			if (CheckAsteroidCollision(that.goodPlayer, asteroid))
			{
				that.goodPlayer.Destroy();
				if (that.GameState != 1)
					that.GameState = 2;
			}

			if (CheckAsteroidCollision(that.evilPlayer, asteroid))
			{
				that.evilPlayer.Destroy();
				if (that.GameState != 2)
					that.GameState = 1;
			}
		}*/
	};

	var DestroyShot = function (player, i) {
		player.Shots.splice(i, 1);
	};

	var DestroyAsteroid = function (asteroid, index) {
		if (asteroid.size > 1)
		{
			CreateAsteroid(asteroid.size - 1, asteroid.Pos.X, asteroid.Pos.Y);
			CreateAsteroid(asteroid.size - 1, asteroid.Pos.X, asteroid.Pos.Y);
		}
		that.Asteroids.splice(index, 1);
	};

	var CreateAsteroid = function (size, X, Y) {
		var asteroid = new asteroidfile.MakeAsteroid();
		var x = X || CANVASWIDTH + Math.random() * 10;
		var y = Y || CANVASHEIGHT + Math.random() * 10;
		asteroid.Init(x, y, Math.random() * 50 - 25, Math.random() * 50 - 25, "asteroid.png", size);
		that.Asteroids.push(asteroid);
	};

	var CheckAsteroidCollision = function (ship, asteroid) {
		var xdiff = ship.Pos.X - asteroid.Pos.X;
		var ydiff = ship.Pos.Y - asteroid.Pos.Y;
		var total = xdiff * xdiff + ydiff * ydiff;
		if (total < asteroid.Radius * asteroid.Radius)
			return true;
		return false;
	};

	var CheckLaserCollision = function (/** player or asteroid */ ship, /** shot */ shot) {
		if (shot.Pos.X <= ship.Pos.X + ship.img.width / 3 &&
			shot.Pos.X >= ship.Pos.X - ship.img.width / 3 &&
			shot.Pos.Y <= ship.Pos.Y + ship.img.height / 3 &&
			shot.Pos.Y >= ship.Pos.Y - ship.img.height / 3)
			return true;

		return false;
	};

	this.CreatePlayer = function (/** int */ id) {
		var player = playerfile.CreatePlayer();
		player.Init(1, id);
		player.Spawn(200, 200, -90);
		this.Players.push(player);
	};
	
	this.RemovePlayer = function (/** int */ id) {
		for (var i in this.Players)
			if (this.Players[i].ID == id)
				this.Players.splice(i, 1);
	};

	this.UpdatePlayerActions = function (/** client player data */ playerdata) {
		for (var i in this.Players) {
			if (this.Players[i].ID == playerdata.ID)
				this.Players[i].UpdateActions(playerdata);
		}
	};
}
