ASTEROID_SIZE_MULTIPLIER = 0.5;
ASTEROID_SPEED_MULTIPLIER = 20;

function Asteroid(){
    this.size = null;
	this.Pos = {};
	this.Speed = 5;
	this.Direction = {};
	this.Alive = true;
	this.img = null;
	this.size = null;
	this.Radius = null;
	
	this.Init = function (/** float */X,/** float */Y, /** float */ dirX, /** float */ dirY,/** string */ imgsrc,/** int 1-3*/ s) {
		this.Pos.X = X;
		this.Pos.Y = Y;
		this.Direction.X = dirX;
		this.Direction.Y = dirY;
		this.img = new Image();
		this.img.src = imgsrc;
		this.size = s;
		this.Radius = this.img.height * this.size * ASTEROID_SIZE_MULTIPLIER / 2;
	};

	this.Update = function (dt) {
		this.Pos.X += Math.sin(Math.PI + this.Direction.X * Math.PI / 180) * this.Speed * dt * ASTEROID_SPEED_MULTIPLIER;
		this.Pos.Y -= Math.cos(Math.PI + this.Direction.Y * Math.PI / 180) * this.Speed * dt * ASTEROID_SPEED_MULTIPLIER;

		if (this.Pos.X >= CANVASWIDTH + CANVAS_BORDER_SPACE) this.Pos.X -= CANVASWIDTH;
		if (this.Pos.X <= - CANVAS_BORDER_SPACE) this.Pos.X += CANVASWIDTH;
		if (this.Pos.Y >= CANVASHEIGHT + CANVAS_BORDER_SPACE) this.Pos.Y -= CANVASHEIGHT;
		if (this.Pos.Y <= - CANVAS_BORDER_SPACE) this.Pos.Y += CANVASHEIGHT;
	};
	
	this.Draw = function () {
		if(this.Alive){
			game.backBufferContext2D.save();
			game.backBufferContext2D.translate(this.Pos.X, this.Pos.Y);
			game.backBufferContext2D.drawImage(this.img, - this.img.width * this.size * 0.25, - this.img.width * this.size * 0.25, this.img.width * this.size * ASTEROID_SIZE_MULTIPLIER, this.img.height * this.size * ASTEROID_SIZE_MULTIPLIER);
			game.backBufferContext2D.restore();
		}
	};
}
