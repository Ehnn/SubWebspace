function Laser() {
    this.Rotation = null;
	this.Speed = null;
	this.Pos = {};
	this.Direction = {};
	this.Fadeout = LASER_FADEOUT;
	this.img = null;

	this.Init = function (/** float */X,/** float */Y, /** float */ dirX, dirY, /** float */ rotation, /** int */ lasertype) {
		this.Pos.X = X;
		this.Pos.Y = Y;
		this.Rotation = rotation;
		this.Direction.X = dirX;
		this.Direction.Y = dirY;
		if (lasertype == 1)
			this.img = laserimage1;
		else if (lasertype == 2)
			this.img = laserimage2;
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
	
	this.Draw = function () {
		game.backBufferContext2D.save();
		if (this.Fadeout < LASER_FADEOUT_POINT)
			game.backBufferContext2D.globalAlpha = this.Fadeout / LASER_FADEOUT_POINT;
		game.backBufferContext2D.translate(this.Pos.X, this.Pos.Y);
		game.backBufferContext2D.rotate(this.Rotation * Math.PI / 180);
		game.backBufferContext2D.drawImage(this.img, - this.img.width / 2, - this.img.height / 2);
		game.backBufferContext2D.restore();
	};
}