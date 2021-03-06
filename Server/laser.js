LASERSPEED = 20;
LASER_FADEOUT = 2;
LASER_FADEOUT_POINT = 0.5;

module.exports.MakeLaser = function () { return new Laser(); }

function Laser() {
    this.Rotation = null;
	this.Speed = null;
	this.Pos = {};
	this.Direction = {};
	this.Fadeout = LASER_FADEOUT;

	this.Init = function (/** float */X,/** float */Y, /** float */ dirX, dirY, /** float */ rotation, /** int */ lasertype) {
		this.Pos.X = X;
		this.Pos.Y = Y;
		this.Rotation = rotation;
		this.Direction.X = dirX;
		this.Direction.Y = dirY;
	};

	this.Update = function (/** float */ dt) {
		this.Pos.X += Math.sin(Math.PI + this.Rotation * Math.PI / 180) * LASERSPEED;
		this.Pos.Y -= Math.cos(Math.PI + this.Rotation * Math.PI / 180) * LASERSPEED;

		if (this.Pos.X >= CANVASWIDTH + CANVAS_BORDER_SPACE) this.Pos.X -= CANVASWIDTH;
		if (this.Pos.X <= - CANVAS_BORDER_SPACE) this.Pos.X += CANVASWIDTH;
		if (this.Pos.Y >= CANVASHEIGHT + CANVAS_BORDER_SPACE) this.Pos.Y -= CANVASHEIGHT;
		if (this.Pos.Y <= - CANVAS_BORDER_SPACE) this.Pos.Y += CANVASHEIGHT;

		this.Fadeout -= dt;
	};
}
