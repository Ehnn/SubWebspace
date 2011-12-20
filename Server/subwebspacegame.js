FRAMES_PER_SECOND = 1;
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

	this.goodPlayer = null;
	this.evilPlayer = null;
	this.Asteroids = [];
	this.AsteroidCreationTimer = 0;

	/** 0 = game going, 1 = player1 won, 2 = player2 won, -1 = before game began */
	this.GameState = -1;

	this.gameloop = null;

    this.lastFrame = new Date().getTime();

	this.Init = function () {
	};

	this.Start = function () {
		that.GameState = 0;

		/** Init player(s) */
		this.goodPlayer = new playerfile.MakePlayer();
		this.goodPlayer.Init("spaceship1.png", 200, 200, -90, 1);

		this.evilPlayer = new playerfile.MakePlayer();
		this.evilPlayer.Init("spaceship2.png", CANVASWIDTH - 200, CANVASHEIGHT - 200, 90, 2);

		/** Game loop */
        this.gameloop = setInterval(function(){ that.GameLoop();}, SECONDS_BETWEEN_FRAMES);
		
		return this;
	};

	this.GameLoop = function () {
		var thisFrame = new Date().getTime();
		var dt = (thisFrame - this.lastFrame)/1000;
        this.lastFrame = thisFrame;

		this.Update(dt);
	};

	this.Update = function (/** time diff */ dt) {
		/** good player input */
		if (p1rightKey) this.goodPlayer.Rotating = 1;
		else if (p1leftKey) this.goodPlayer.Rotating = -1;
		else this.goodPlayer.Rotating = 0;

		if (p1upKey) this.goodPlayer.Accelerating = 1;
		else if (p1downKey) this.goodPlayer.Accelerating = -1;
		else this.goodPlayer.Accelerating = 0;

		if (p1spaceKey) this.goodPlayer.Shooting = true;
		else this.goodPlayer.Shooting = false;

		/** evil player input */
		if (p2rightKey) this.evilPlayer.Rotating = 1;
		else if (p2leftKey) this.evilPlayer.Rotating = -1;
		else this.evilPlayer.Rotating = 0;

		if (p2upKey) this.evilPlayer.Accelerating = 1;
		else if (p2downKey) this.evilPlayer.Accelerating = -1;
		else this.evilPlayer.Accelerating = 0;

		if (p2spaceKey) this.evilPlayer.Shooting = true;
		else this.evilPlayer.Shooting = false;


		this.AsteroidCreationTimer -= dt;
		if (this.AsteroidCreationTimer <= 0 && this.Asteroids.length <=MAX_ASTEROIDS_NUM)
		{
			this.AsteroidCreationTimer = ASTEROID_CREATION_TIME;
			CreateAsteroid(3);
		}

		this.goodPlayer.Update(dt);
		this.evilPlayer.Update(dt);

		for (var i in this.goodPlayer.Shots) {
			var shot = this.goodPlayer.Shots[i];
			shot.Update(dt);
			
			/** Check collision with spaceships  */
			if (that.evilPlayer.Alive && CheckLaserCollision(that.evilPlayer, shot))
			{
				that.evilPlayer.Lives--;
				if (that.evilPlayer.Lives <= 0)
				{
					that.evilPlayer.Destroy();
					if (that.GameState != 2)
						that.GameState = 1;
				}
				DestroyShot(that.goodPlayer, i);
			}

			if (shot.Fadeout <= 0) DestroyShot(that.goodPlayer, i);

            for (var j in this.Asteroids)
            {
                var asteroid = this.Asteroids[j];
				if (CheckAsteroidCollision(shot, asteroid))
				{
					DestroyShot(that.goodPlayer, i);
					DestroyAsteroid(asteroid, j);
				}
			}
		}

		for (var i in this.evilPlayer.Shots) {
			var shot = this.evilPlayer.Shots[i];
			shot.Update(dt);

			/** Check collision with spaceships  */
			if (that.goodPlayer.Alive && CheckLaserCollision(that.goodPlayer, shot))
			{
				that.goodPlayer.Lives--;
				if (that.goodPlayer.Lives <= 0)
				{
					that.goodPlayer.Destroy();
					if (that.GameState != 1)
						that.GameState = 2;
				}
				DestroyShot(that.evilPlayer, i);
				
			}

			if (shot.Fadeout <= 0) DestroyShot(that.evilPlayer, i);

			for (var j in this.Asteroids)
            {
                var asteroid = this.Asteroids[j];
				if (CheckAsteroidCollision(shot, asteroid))
				{
					DestroyShot(that.evilPlayer, i);
					DestroyAsteroid(asteroid, j);
				}
			}
		}


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
		}
	};

	var DestroyShot = function (player, index) {
		player.Shots.splice(index, 1);
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
        var p1rightKey = false;
	var p1leftKey = false;
	var p1upKey = false;
	var p1downKey = false;
	var p1spaceKey = false;

	var p2rightKey = false;
	var p2leftKey = false;
	var p2upKey = false;
	var p2downKey = false;
	var p2spaceKey = false;

	var enter = false;
}
