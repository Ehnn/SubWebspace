function Game() {
    var that = this;

	this.canvas = null;
	this.context2D = null;
	this.backBuffer = null;
	this.backBufferContext2D = null;

	this.goodPlayer = null;
	this.evilPlayer = null;
	this.Asteroids = [];
	this.AsteroidCreationTimer = 0;

	/** 0 = game going, 1 = player1 won, 2 = player2 won, -1 = before game began */
	this.GameState = -1;

	this.gameloop = null;

        this.lastFrame = new Date().getTime();

	this.Init = function () {
		/** Set up the canvas and backbuffer */
		this.canvas = document.getElementById('gamecanvas');
		this.canvas.width = CANVASWIDTH;
		this.canvas.height = CANVASHEIGHT;
		this.context2D = this.canvas.getContext('2d');
		this.backBuffer = document.createElement('canvas');
		this.backBuffer.width = this.canvas.width;
		this.backBuffer.height = this.canvas.height;
		this.backBufferContext2D = this.backBuffer.getContext('2d');

			
		this.backBufferContext2D.font = "bold 30px sans-serif";
		this.backBufferContext2D.width = 3;

		this.backBufferContext2D.strokeStyle = "LightBlue";
		this.backBufferContext2D.strokeText("Player 1 Controls: Arrow keys + Space", 200, CANVASHEIGHT / 2);

		this.backBufferContext2D.fillStyle = "White";
		this.backBufferContext2D.fillText("Instructions: kill the enemy. avoid the asteroids. duh.", CANVASWIDTH / 2 - 360, CANVASHEIGHT / 4);

		this.backBufferContext2D.strokeStyle = "Orange";
		this.backBufferContext2D.strokeText("Player 2 Controls: WASD keys + Shift", 200, CANVASHEIGHT / 2 + 50);

		this.backBufferContext2D.fillStyle = "White";
		this.backBufferContext2D.fillText("Press Enter to Start", CANVASWIDTH / 2 - 150, CANVASHEIGHT - 100);

		this.context2D.drawImage(this.backBuffer, 0, 0);
	};

	this.Start = function () {
		that.GameState = 0;

		/** Init player(s) */
		this.goodPlayer = new Player();
		this.goodPlayer.Init("spaceship1.png", 200, 200, -90, 1);

		this.evilPlayer = new Player();
		this.evilPlayer.Init("spaceship2.png", CANVASWIDTH - 200, CANVASHEIGHT - 200, 90, 2);

		/** Game loop */
	        this.gameloop = setInterval(function(){game.GameLoop();}, SECONDS_BETWEEN_FRAMES);
		
		return this;
	};

	this.GameLoop = function () {
		var thisFrame = new Date().getTime();
		var dt = (thisFrame - this.lastFrame)/1000;
	        this.lastFrame = thisFrame;

		this.Update(dt);
		this.Draw();
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

		jQuery(this.goodPlayer.Shots).each(function (i) {
            var shot = this;
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

			jQuery(that.Asteroids).each(function (j) {
				if (CheckAsteroidCollision(shot, this))
				{
					DestroyShot(that.goodPlayer, i);
					DestroyAsteroid(this, j);
				}
			});
		});

		jQuery(this.evilPlayer.Shots).each(function (i) {
			var shot = this;
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

			jQuery(that.Asteroids).each(function (j) {
				if (CheckAsteroidCollision(shot, this))
				{
					DestroyShot(that.evilPlayer, i);
					DestroyAsteroid(this, j);
				}
			});
		});


		jQuery(this.Asteroids).each(function() {
			this.Update(dt);

			if (CheckAsteroidCollision(that.goodPlayer, this))
			{
				that.goodPlayer.Destroy();
				if (that.GameState != 1)
					that.GameState = 2;
			}

			if (CheckAsteroidCollision(that.evilPlayer, this))
			{
				that.evilPlayer.Destroy();
				if (that.GameState != 2)
					that.GameState = 1;
			}
		});
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
		var asteroid = new Asteroid();
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

	this.Draw = function () {
		this.backBufferContext2D.clearRect(0, 0, this.backBuffer.width, this.backBuffer.height);
		this.context2D.clearRect(0, 0, this.canvas.width, this.canvas.height);

		jQuery(this.goodPlayer.Shots).each(function () { this.Draw(); });
		jQuery(this.evilPlayer.Shots).each(function () { this.Draw(); });

		jQuery(this.Asteroids).each(function() { this.Draw(); });

		this.goodPlayer.Draw();
		this.evilPlayer.Draw();

		this.backBufferContext2D.fillStyle = "rgba(0,0,200, 0.4)";
		this.backBufferContext2D.fillRect (40, CANVASHEIGHT - 50 , 30 * this.goodPlayer.Lives, 40);
		this.backBufferContext2D.strokeStyle = "rgba(250,250,250, 1)";
		this.backBufferContext2D.strokeRect(40, CANVASHEIGHT - 50 , 300, 40);

		this.backBufferContext2D.fillStyle = "rgba(200,0,0, 0.4)";
		this.backBufferContext2D.fillRect (CANVASWIDTH - 340, CANVASHEIGHT - 50 , 30 * this.evilPlayer.Lives, 40);

		this.backBufferContext2D.strokeStyle = "rgba(250,250,250, 1)";
		this.backBufferContext2D.strokeRect(CANVASWIDTH - 340, CANVASHEIGHT - 50 , 300, 40);

		if (this.GameState !== 0)
		{
			this.backBufferContext2D.font = "bold 50px sans-serif";
			this.backBufferContext2D.strokeStyle = "White";
			this.backBufferContext2D.width = 3;
			this.backBufferContext2D.strokeText("Player "+ this.GameState + " Wins!", CANVASWIDTH / 2 - 160, CANVASHEIGHT / 4);

			this.backBufferContext2D.font = "bold 25px sans-serif";
			this.backBufferContext2D.fillStyle = "White";
			this.backBufferContext2D.fillText("Press Enter to Restart", CANVASWIDTH / 2 - 120, CANVASHEIGHT - 100);
		}

		this.context2D.drawImage(this.backBuffer, 0, 0);
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
    

	this.onKeyDown = function (evt) {
		if (evt.keyCode == 39) p1rightKey = true;
		else if (evt.keyCode == 37) p1leftKey = true;
		if (evt.keyCode == 38) p1upKey = true;
		else if (evt.keyCode == 40) p1downKey = true;
		if (evt.keyCode == 32) p1spaceKey = true;

		if (evt.keyCode == 68) p2rightKey = true;
		else if (evt.keyCode == 65) p2leftKey = true;
		if (evt.keyCode == 87) p2upKey = true;
		else if (evt.keyCode == 83) p2downKey = true;
		if (evt.keyCode == 16) p2spaceKey = true;

		if (evt.keyCode == 13)
		{
			if (that.GameState != 0)
			{
				if (that.gameloop)
					clearInterval(that.gameloop);
				that.Start();
			}
			enter = true;
		}
	}

	this.onKeyUp = function (evt) {
		if (evt.keyCode == 39) p1rightKey = false;
		else if (evt.keyCode == 37) p1leftKey = false;
		if (evt.keyCode == 38) p1upKey = false;
		else if (evt.keyCode == 40) p1downKey = false;
		if (evt.keyCode == 32) p1spaceKey = false;

		if (evt.keyCode == 68) p2rightKey = false;
		else if (evt.keyCode == 65) p2leftKey = false;
		if (evt.keyCode == 87) p2upKey = false;
		else if (evt.keyCode == 83) p2downKey = false;
		if (evt.keyCode == 16) p2spaceKey = false;

		if (evt.keyCode == 13) enter = false;
	}
}