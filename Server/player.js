PLAYER_SPEED = 6;
PLAYER_ROTATION_SPEED = 420;
PLAYER_ACCELERATION_SPEED = 8;
PLAYER_ACCELERATION_CAP = 20;
PLAYER_RELOAD_TIME = 0.25;

module.exports.MakePlayer = function () { return new Player() };

var laserfile = require('./laser');

function Player() {
	this.Pos = {};
	this.Pos.X = 0;
	this.Pos.Y = 0;
	this.Forward = {};
	this.Forward.X = 0;
	this.Forward.Y = -1;

	this.Speed = {};
	this.Speed.X = 0;
	this.Speed.Y = 0;
	this.Acceleration = {};
	this.Acceleration.X = 0;
	this.Acceleration.Y = 0;

	this.Shots = [];

	this.Rotation = 0;
	this.Reload = 0;
	this.Alive = false;

	this.img = null;
	this.PlayerNumber = null;

	this.Accelerating = 0;
	this.Rotating = 0;
	this.Shooting = false;

	this.Lives = null;

	this.Shoot = function () {
	    if (this.Alive && this.Reload === 0) {
	        var shot = new laserfile.MakeLaser();
	        shot.Init(this.Pos.X, this.Pos.Y, this.Forward.X, this.Forward.Y, this.Rotation, this.PlayerNumber);
	        this.Shots.push(shot);
	        this.Reload = PLAYER_RELOAD_TIME;
	    }
	};

	this.Init = function(/** string */ imgsrc, /** int */ X, /** int */ Y, /** int */ rotation, /** int */ playernumber) {
		this.Pos.X = X;
		this.Pos.Y = Y;
		this.Alive = true;
		this.PlayerNumber = playernumber;
		this.Rotation = rotation;
		this.Lives = 10;
	};

	this.Update = function (dt) {
		if (this.Accelerating === 0)
		{
			this.Acceleration.X = 0;
			this.Acceleration.Y = 0;
		}
		else
		{
			this.Acceleration.X += this.Accelerating * dt * PLAYER_ACCELERATION_SPEED * this.Forward.X;
			this.Acceleration.Y += this.Accelerating * dt * PLAYER_ACCELERATION_SPEED * this.Forward.Y;
		}

		if (this.Rotating !== 0) this.Rotation += this.Rotating * dt * PLAYER_ROTATION_SPEED;

		if (this.Shooting === true)
			this.Shoot();

		if (this.Reload !== 0)
		{
			this.Reload -= dt;
			if (this.Reload <= 0) this.Reload = 0;
		}
		if (this.Pos.X >= CANVASWIDTH + CANVAS_BORDER_SPACE) this.Pos.X -= CANVASWIDTH;
		if (this.Pos.X <= - CANVAS_BORDER_SPACE) this.Pos.X += CANVASWIDTH;
		if (this.Pos.Y >= CANVASHEIGHT + CANVAS_BORDER_SPACE) this.Pos.Y -= CANVASHEIGHT;
		if (this.Pos.Y <= - CANVAS_BORDER_SPACE) this.Pos.Y += CANVASHEIGHT;


		/** calculate forward */
		this.Forward.X = Math.sin(Math.PI + this.Rotation * Math.PI / 180) * PLAYER_SPEED;
		this.Forward.Y = Math.cos(Math.PI + this.Rotation * Math.PI / 180) * PLAYER_SPEED;

		/** acceleration cap */
		if (this.Acceleration.X >= PLAYER_ACCELERATION_CAP) this.Acceleration.X = PLAYER_ACCELERATION_CAP;
		if (this.Acceleration.X <= -PLAYER_ACCELERATION_CAP) this.Acceleration.X = -PLAYER_ACCELERATION_CAP;
		if (this.Acceleration.Y >= PLAYER_ACCELERATION_CAP) this.Acceleration.Y = PLAYER_ACCELERATION_CAP;
		if (this.Acceleration.Y <= -PLAYER_ACCELERATION_CAP) this.Acceleration.Y = -PLAYER_ACCELERATION_CAP;

		/** acceleration effect on speed */
		this.Speed.X += this.Acceleration.X * dt;
		this.Speed.Y += this.Acceleration.Y * dt;

		/** Deceleration */
		this.Speed.X -= dt * this.Speed.X / 2;
		this.Speed.Y -= dt * this.Speed.Y / 2;

		this.Pos.X += this.Speed.X;
		this.Pos.Y += this.Speed.Y * -1;
	};

	this.Destroy = function () {
        this.Alive = false;
	};

	this.Draw = function () {
		if (this.Alive)
		{
			game.backBufferContext2D.save();
			game.backBufferContext2D.translate(this.Pos.X, this.Pos.Y);
			game.backBufferContext2D.rotate(this.Rotation * Math.PI / 180);
			game.backBufferContext2D.drawImage(this.img, - this.img.width / 2, - this.img.height / 2);
			game.backBufferContext2D.restore();
		}
	};
}
