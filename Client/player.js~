PLAYER_ROTATION_SPEED = 420;
PLAYER_ACCELERATION_SPEED = 10;
PLAYER_SPEED_CAP = 20;
PLAYER_RELOAD_TIME = 0.25;
SPACE_FRICTION = 2;


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

	this.state1 = null;
	this.state2 = null;
    /** 0 = state1 is base state, 1 = state2 is base state */
	this.State1IsBase = 0;

	this.Rotation = 0;
	this.Reload = 0;

	this.shiptype = null;

	this.Accelerating = 0;
	this.Rotating = 0;
	this.Shooting = false;
	this.shotguid = 0;

	this.Lives = 0;
	this.Alive = false;

	this.isMyPlayer = false;
	this.name = null;

	this.collisionWidth = 20;
	this.collisionHeight = 20;

	this.Shoot = function () {
	    if (this.Lives > 0 && this.Reload === 0) {
	        if (jQuery("input:checked").length) {
	            if (this.shiptype == 1)
	                lasersound.play();
	            else
	                evillasersound.play();
	        }

	        var shot = new Laser();
	        shot.Init(this.Pos.X, this.Pos.Y, this.Rotation, this.shiptype, this.shotguid++);
	        this.Shots.push(shot);
	        game.SendShot(shot);
	        this.Reload = PLAYER_RELOAD_TIME;
	    }
	};

	this.Init = function (/** int */shiptype, /** int */id, name) {
	    this.shiptype = shiptype;
	    this.ID = id;
	    this.name = name;
	    this.Lives = 0;
	};

	this.Spawn = function (/** int */X, /** int */Y, /** int */rotation) {
	    this.Pos.X = X;
	    this.Pos.Y = Y;
	    this.Rotation = rotation;

	    this.Lives = 10;
	    this.Alive = true;
	};

	this.Update = function (dt) {
	    var SMOOTHING_THRESHOLD = 600;
	    /** Different calculation for enemy client */
	    if (!this.isMyPlayer) {
	        /** Animation smoothing */
	        if (this.state1 && this.state2) {
	            var basestate = this.State1IsBase ? this.state1 : this.state2;
	            var movestate = this.State1IsBase ? this.state2 : this.state1;

	            var timeSinceLastData = new Date().getTime() - game.lastDataReceiveTime;
	            var timestampdiff = movestate.timestamp - basestate.timestamp;

	            var rotdiff = movestate.Rot - basestate.Rot;
	            var posdiffX = movestate.Pos.X - basestate.Pos.X;
	            var posdiffY = movestate.Pos.Y - basestate.Pos.Y;

	            if (posdiffX >= SMOOTHING_THRESHOLD || posdiffX <= -SMOOTHING_THRESHOLD || posdiffY >= SMOOTHING_THRESHOLD || posdiffY <= -SMOOTHING_THRESHOLD) {
	                basestate = movestate;
	                timestampdiff = 0;
	            }

	            if (timestampdiff == 0) timestampdiff = timeSinceLastData;

	            this.Rotation = basestate.Rot + rotdiff * (timeSinceLastData / timestampdiff);
	            this.Pos.X = basestate.Pos.X + posdiffX * (timeSinceLastData / timestampdiff);
	            this.Pos.Y = basestate.Pos.Y + posdiffY * (timeSinceLastData / timestampdiff);
	        }
	        return;
	    }

	    if (this.Rotating !== 0) this.Rotation += this.Rotating * dt * PLAYER_ROTATION_SPEED;

	    if (this.Shooting === true)
	        this.Shoot();

	    if (this.Reload !== 0) {
	        this.Reload -= dt;
	        if (this.Reload <= 0) this.Reload = 0;
	    }

	    if (this.Pos.X >= CANVASWIDTH + CANVAS_BORDER_SPACE) this.Pos.X -= CANVASWIDTH;
	    if (this.Pos.X <= -CANVAS_BORDER_SPACE) this.Pos.X += CANVASWIDTH;
	    if (this.Pos.Y >= CANVASHEIGHT + CANVAS_BORDER_SPACE) this.Pos.Y -= CANVASHEIGHT;
	    if (this.Pos.Y <= -CANVAS_BORDER_SPACE) this.Pos.Y += CANVASHEIGHT;


	    /** calculate forward */
	    this.Forward.X = Math.sin(Math.PI + this.Rotation * Math.PI / 180);
	    this.Forward.Y = Math.cos(Math.PI + this.Rotation * Math.PI / 180);

	    /** acceleration effect on speed */
	    if (this.Accelerating) {
	        this.Speed.X += dt * PLAYER_ACCELERATION_SPEED * this.Forward.X * this.Accelerating;
	        this.Speed.Y += dt * PLAYER_ACCELERATION_SPEED * this.Forward.Y * this.Accelerating;
	    }

	    /** speed cap */
	    if (this.Speed.X >= PLAYER_SPEED_CAP) this.Speed.X = PLAYER_SPEED_CAP;
	    if (this.Speed.X <= -PLAYER_SPEED_CAP) this.Speed.X = -PLAYER_SPEED_CAP;
	    if (this.Speed.Y >= PLAYER_SPEED_CAP) this.Speed.Y = PLAYER_SPEED_CAP;
	    if (this.Speed.Y <= -PLAYER_SPEED_CAP) this.Speed.Y = -PLAYER_SPEED_CAP;

	    /** Deceleration */
	    if (this.Speed.X >= 0) {
	        this.Speed.X += -dt * SPACE_FRICTION;
	        if (this.Speed.X <= 0)
	            this.Speed.X = 0;
	    }

	    var frictiondir;
	    frictiondir = this.Speed.X >= 0 ? -1 : 1;
	    this.Speed.X += frictiondir * dt * SPACE_FRICTION;
	    if ((frictiondir <= 0 && this.Speed.X <= 0) || (frictiondir >= 0 && this.Speed.X >= 0)) this.Speed.X = 0;

	    frictiondir = this.Speed.Y >= 0 ? -1 : 1;
	    this.Speed.Y += frictiondir * dt * SPACE_FRICTION;
	    if ((frictiondir <= 0 && this.Speed.Y <= 0) || (frictiondir >= 0 && this.Speed.Y >= 0)) this.Speed.Y = 0;

	    this.Pos.X += this.Speed.X;
	    this.Pos.Y += this.Speed.Y * -1;
	};

	this.Hit = function () {
		if (this.Alive)
		{
			this.Lives--;
			if (this.Lives <= 0)
			    this.Destroy();
		}
	};

	this.Destroy = function () {
	    //FIX. badly
	    this.Lives = 0;
	    this.Alive = false;
	    if (jQuery("input:checked").length) explosionsound.play();
	    var explosion = jQuery("#explosiondiv" + this.shiptype).css('left', this.Pos.X - 50).css('top', this.Pos.Y - 60).removeClass("invis");
	    setTimeout(function () {
	        explosion.addClass("invis");
	    }, 750);

		if (this.isMyPlayer) game.myPlayerDeath();
	};

	this.Draw = function () {
	    if (this.Lives > 0) {
	        var img = this.shiptype == 1 ? imgship1 : imgship2;
	        game.backBufferContext2D.save();
	        game.backBufferContext2D.translate(this.Pos.X, this.Pos.Y);

		game.backBufferContext2D.font = "bold 10px sans-serif";
		game.backBufferContext2D.fillStyle = "White";
		game.backBufferContext2D.fillText(this.name || "No Name", -img.width / 2, -img.height / 2 - 10);

		game.backBufferContext2D.fillStyle = this.isMyPlayer ? "rgba(0, 255, 0, 0.8)" : "rgba(255, 0, 0, 0.8)";
		game.backBufferContext2D.fillRect(-img.width / 2, -img.height / 2, 5 * this.Lives, 5);
		game.backBufferContext2D.strokeStyle = "rgba(250,250,250, 1)";
		game.backBufferContext2D.strokeRect(-img.width / 2, -img.height / 2, 50, 5);

	        game.backBufferContext2D.rotate(this.Rotation * Math.PI / 180);
	        game.backBufferContext2D.drawImage(img, -img.width / 2, -img.height / 2);
	        game.backBufferContext2D.restore();
	    }
	};

	this.UpdateData = function (/** server player obj */playerdata, T) {
	    if (this.State1IsBase) {
	        this.state1 = {
	            Pos: playerdata.P,
	            Rot: playerdata.R,
	            timestamp: T
	        };
	        this.State1IsBase = false;
	    }
	    else {
	        this.state2 = {
	            Pos: playerdata.P,
	            Rot: playerdata.R,
	            timestamp: T
	        };
	        this.State1IsBase = true;
	    }

		if (playerdata.L < this.Lives)
			this.Lives = playerdata.L
	    if (this.Lives == 0 && this.Alive)
	        this.Destroy();
	};
};
