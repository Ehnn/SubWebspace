ASTEROID_SIZE_MULTIPLIER = 0.5;
ASTEROID_IMAGE_HEIGHT = 128;

module.exports.MakeAsteroid = function () { return new Asteroid(); }

function Asteroid(){
    this.size = null;
	this.Pos = {};
	this.Speed = 5;
	this.Direction = {};
	this.Alive = true;
	this.size = null;
	this.Radius = null;
	
	this.Init = function (/** float */X,/** float */Y, /** float */ dirX, /** float */ dirY,/** string */ imgsrc,/** int 1-3*/ s) {
		this.Pos.X = X;
		this.Pos.Y = Y;
		this.Direction.X = dirX;
		this.Direction.Y = dirY;
		this.size = s;
		this.Radius = ASTEROID_IMAGE_HEIGHT * this.size * ASTEROID_SIZE_MULTIPLIER / 2;
	};

	this.Update = function (dt) {
		this.Pos.X += Math.sin(Math.PI + this.Direction.X * Math.PI / 180) * this.Speed;
		this.Pos.Y -= Math.cos(Math.PI + this.Direction.Y * Math.PI / 180) * this.Speed;

		if (this.Pos.X >= CANVASWIDTH + CANVAS_BORDER_SPACE) this.Pos.X -= CANVASWIDTH;
		if (this.Pos.X <= - CANVAS_BORDER_SPACE) this.Pos.X += CANVASWIDTH;
		if (this.Pos.Y >= CANVASHEIGHT + CANVAS_BORDER_SPACE) this.Pos.Y -= CANVASHEIGHT;
		if (this.Pos.Y <= - CANVAS_BORDER_SPACE) this.Pos.Y += CANVASHEIGHT;
	};
}
