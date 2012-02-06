var LASERSPEED = 600;
var LASER_FADEOUT = 2;
var LASER_FADEOUT_POINT = 0.5;


function Laser() {
    this.Rotation = null;
	this.Speed = null;
	this.Pos = {};
	this.Fadeout = LASER_FADEOUT;
	this.img = null;
	this.guid = null;
	this.PID = null;
    this.Team = null;

	this.Init = function (/** float */X, /** float */Y, /** float */rotation, /** int */team, /** int */guid, /** optional extra time diff */extradt, /** optional player ID */PID) {
	    this.Pos.X = X;
	    this.Pos.Y = Y;
	    this.Rotation = rotation;
        this.Team = team;
        this.img = game.Resources['imgLaser' + team];
	    this.guid = guid;

	    if (PID) this.PID = PID;

	    if (extradt) this.Update(extradt);
	};

	this.Update = function (/** float */ dt) {
		this.Pos.X += Math.sin(Math.PI + this.Rotation * Math.PI / 180) * LASERSPEED * dt;
		this.Pos.Y -= Math.cos(Math.PI + this.Rotation * Math.PI / 180) * LASERSPEED * dt;

		this.Fadeout -= dt;
	};
	
	this.Draw = function (translateX, translateY) {
		game.backBufferContext2D.save();
		if (this.Fadeout < LASER_FADEOUT_POINT)
			game.backBufferContext2D.globalAlpha = this.Fadeout / LASER_FADEOUT_POINT;
		game.backBufferContext2D.translate(translateX, translateY);
		game.backBufferContext2D.rotate(this.Rotation * Math.PI / 180);
		game.backBufferContext2D.drawImage(this.img, - this.img.width / 2, - this.img.height / 2);
		game.backBufferContext2D.restore();
	};
}
