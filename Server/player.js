PLAYER_ROTATION_SPEED = 420;
PLAYER_ACCELERATION_SPEED = 0.3;
PLAYER_ACCELERATION_CAP = 0.7;
PLAYER_RELOAD_TIME = 0.25;

module.exports.CreatePlayer = function () { return new Player() };

var laserfile = require('./laser');

function Player() {

	this.ID = null;
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
	this.shiptype = null;

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

	this.Init = function(/** int */shiptype, /** int */ id) {
		this.shiptype = shiptype;
		this.ID = id;
	};

	this.Spawn = function (/** int */ X, /** int */ Y, /** int */ rotation) {
		this.Pos.X = X;
		this.Pos.Y = Y;
		this.Rotation = rotation;
		this.Lives = 10;
		this.Alive = true;
	};

	this.Update = function (dt) {
		/*if (this.Accelerating === 0)
		{
			this.Acceleration.X = 0;
			this.Acceleration.Y = 0;
		}
		else
		{
			this.Acceleration.X += this.Accelerating * dt * PLAYER_ACCELERATION_SPEED * this.Forward.X;
			this.Acceleration.Y += this.Accelerating * dt * PLAYER_ACCELERATION_SPEED * this.Forward.Y;
		}

		if (this.Rotating !== 0) this.Rotation += this.Rotating * dt * PLAYER_ROTATION_SPEED;*/

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
		this.Forward.X = Math.sin(Math.PI + this.Rotation * Math.PI / 180);
		this.Forward.Y = Math.cos(Math.PI + this.Rotation * Math.PI / 180);

		/** acceleration cap */
		if (this.Acceleration.X >= PLAYER_ACCELERATION_CAP) this.Acceleration.X = PLAYER_ACCELERATION_CAP;
		if (this.Acceleration.X <= -PLAYER_ACCELERATION_CAP) this.Acceleration.X = -PLAYER_ACCELERATION_CAP;
		if (this.Acceleration.Y >= PLAYER_ACCELERATION_CAP) this.Acceleration.Y = PLAYER_ACCELERATION_CAP;
		if (this.Acceleration.Y <= -PLAYER_ACCELERATION_CAP) this.Acceleration.Y = -PLAYER_ACCELERATION_CAP;

		/** acceleration effect on speed */
		this.Speed.X += this.Acceleration.X;
		this.Speed.Y += this.Acceleration.Y;

		/** Deceleration */
		this.Speed.X -= dt * this.Speed.X / 2;
		this.Speed.Y -= dt * this.Speed.Y / 2;

		this.Pos.X += this.Speed.X;
		this.Pos.Y += this.Speed.Y * -1;
	};

	this.Destroy = function () {
	        this.Alive = false;
	};

	this.UpdateActions = function (/** client player obj */ playerdata) {
		rightKeyPressTime = playerdata.rightKeyPressTime;
		leftKeyPressTime = playerdata.leftKeyPressTime;
		upKeyPressTime = playerdata.upKeyPressTime;
		downKeyPressTime = playerdata.downKeyPressTime;
		console.log(downKeyPressTime);
		spaceKeyPressTime = playerdata.spaceKeyPressTime;

//		this.Acceleration.X += this.forwardKeyPressTime * PLAYER_ACCELERATION_SPEED * this.Forward.X - this.backwardKeyPressTime * PLAYER_ACCELERATION_SPEED * this.Forward.X;
		this.Acceleration.X = this.Forward.X * PLAYER_ACCELERATION_SPEED * (upKeyPressTime - downKeyPressTime);

		this.Acceleration.Y = this.Forward.Y * PLAYER_ACCELERATION_SPEED * (upKeyPressTime - downKeyPressTime);

		this.Rotation += (rightKeyPressTime - leftKeyPressTime) * PLAYER_ROTATION_SPEED;
		/*this.Accelerating = playerdata.Accelerating;
		this.Rotating = playerdata.Rotating;
		this.Shooting = playerdata.Shooting;*/
	};


	var rightKeyPressTime = 0;
	var leftKeyPressTime = 0;
	var upKeyPressTime = 0;
	var downKeyPressTime = 0;
	var spaceKeyPressTime = 0;

}
