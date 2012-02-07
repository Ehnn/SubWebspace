PLAYER_ROTATION_SPEED = 420;
PLAYER_ACCELERATION_SPEED = 10;
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

	this.img = null;
	this.shiptype = null;

	this.Accelerating = 0;
	this.Rotating = 0;
	this.Shooting = false;

	this.Lives = 0;
	this.name = null;
    this.Team = 0;

	this.Shoot = function () {
	    if (this.Lives > 0 && this.Reload === 0) {
	        var shot = new laserfile.MakeLaser();
	        shot.Init(this.Pos.X, this.Pos.Y, this.Forward.X, this.Forward.Y, this.Rotation, this.PlayerNumber);
	        this.Shots.push(shot);
	        this.Reload = PLAYER_RELOAD_TIME;
	    }
	};

	this.Init = function(/** int */shiptype, /** int */ id, /** name */ name) {
		this.shiptype = shiptype;
		this.ID = id;
		this.name = name;
		this.Lives = 0;
	};

	this.Spawn = function (/** int */ X, /** int */ Y, /** int */ rotation, /** int */ team) {
		this.Pos.X = X;
		this.Pos.Y = Y;
        this.Team = team;
		this.Rotation = rotation;
		this.Lives = 10;
	};

	this.Update = function (dt) {
	};

	this.Destroy = function () {
		this.Lives = 0;
	};

	this.UpdateData = function (/** client player obj */ playerdata) {
		this.Pos = playerdata.P;
		this.Rotation = playerdata.R;
		this.Team = playerdata.T;
	};
}
