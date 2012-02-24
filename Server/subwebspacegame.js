FRAMES_PER_SECOND = 30;
SECONDS_BETWEEN_FRAMES = 1000 / FRAMES_PER_SECOND;

CANVASWIDTH = 1024;
CANVASHEIGHT = 768;
CANVAS_BORDER_SPACE = 20;

ASTEROID_CREATION_TIME = 7;
MAX_ASTEROIDS_NUM = 10;

module.exports.MakeGame = function () { return new Game(); };

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
	this.ticktime = SECONDS_BETWEEN_FRAMES;
	this.HighScores = [];

	this.Init = function () {
	};

	this.Start = function () {
		this.tick = 0;
		that.GameState = 0;

		/** Init players / asteroids */
		this.Players = [];
		this.Asteroids = [];

		/** Game loop */
	        //this.gameloop = setInterval(function(){ that.GameLoop();}, SECONDS_BETWEEN_FRAMES);
		
		return this;
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

	this.CreatePlayer = function (/** int */ id, /** string */ name) {
		var player = playerfile.CreatePlayer();
		if (!name) name = "Guest" + id;
		player.Init(1, id, name);
		this.Players.push(player);
        teamTotals[0]++;
		return name;
	};
    
    /** Team total players. Starts from 1 */
    var teamTotals = [0, 0, 0];
    
	this.Spawn = function (data) {
        /** determine which team to place on */
        var min = 1;
        
        for (var i = 1; i < teamTotals.length; i++) {
            if (teamTotals[i] < teamTotals[min])
                min = i;
        }
        
        teamTotals[min]++;
        
		for (var i in this.Players) {
			if (this.Players[i].ID == data.ID)
				this.Players[i].Spawn(data.X, data.Y, data.R, min);
		}
                
        return min;
	};

	this.Hit = function (data) {
		for (var i in this.Players)
			if (this.Players[i].ID == data.ID) {
                var player = this.Players[i];
                player.Lives--;
                
                if (player.Lives <= 0) {
                    teamTotals[player.Team]--;
                    player.Team = 0;
                    player.Alive = false;
                }
			}
	};
    
	this.RemovePlayer = function (/** int */ id) {
		for (var i in this.Players) {
			if (this.Players[i].ID == id) {
                var player = this.Players[i];
                teamTotals[player.Team]--;
                if (player.Team != 0) teamTotals[0]--;
				this.Players.splice(i, 1);
			}
		}
	};

	this.UpdatePlayerActions = function (/** client player data */ playerdata) {
		for (var i in this.Players) {
			if (this.Players[i].ID == playerdata.ID)
				this.Players[i].UpdateData(playerdata);
		}
	};

	this.UpdatePlayerName = function (data) {
		for (var i in this.Players) {
			if (this.Players[i].ID == data.ID)
				this.Players[i].name = data.N;
		}
	};

	/** return true if high scores have changed, false otherwise */
	this.ReceiveHighScore = function (data) {
		var i = 0;
		for (; i < this.HighScores.length; i++) {
			if (data.S > this.HighScores[i].S)
				break;
		}

		if (i < 10) {
			this.HighScores.splice(i, 0, data);
			if (this.HighScores.length > 10)
				this.HighScores.pop();
		}
	};
}