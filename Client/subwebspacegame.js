FRAMES_PER_SECOND = 30;
PACKETS_PER_SECOND = 20;
MS_BETWEEN_FRAMES = 1000 / FRAMES_PER_SECOND;

CANVASWIDTH = 1024;
CANVASHEIGHT = 768;
CANVAS_BORDER_SPACE = 20;

ASTEROID_CREATION_TIME = 7;
MAX_ASTEROIDS_NUM = 10;

//SERVER_CONNECTION = "http://localhost:8080";
SERVER_CONNECTION = "http://10.0.0.4:8080";
//SERVER_CONNECTION = "http://spacegame.chickenkiller.com";

SEND_TIME = 1000 / PACKETS_PER_SECOND;
DRAWS_PER_RECEIVE = FRAMES_PER_SECOND / PACKETS_PER_SECOND;

PING_SEND_TIME = 1000;


var explosionsound = new Audio();
var lasersound = new Audio();
var evillasersound = new Audio();
var laserimage1 = new Image();
var laserimage2 = new Image();
var astimg = new Image();
var imgship1 = new Image();
var imgship2 = new Image();


var loadables = {"sndExplode" : {
	            loaded : false,
	            type : "sound",
	            src : "explosion.ogg",
	            obj : explosionsound },
	        "sndLaser1" : {
	            loaded : false,
	            type : "sound",
	            src : "Laser_s.ogg",
	            obj : lasersound },
	        "sndLaser2" : {
	            loaded : false,
	            type : "sound",
	            src : "evil_laser.ogg",
	            obj : evillasersound },
	        "imgLaser1" : {
	            loaded : false,
	            type : "image",
	            src : "greenLaserRay.png",
	            obj : laserimage1 },
	        "imgLaser2" : {
	            loaded : false,
	            type : "image",
	            src : "redLaserRay.png",
	            obj : laserimage2 },
	        "imgAsteroid" : {
	            loaded : false,
	            type : "image",
	            src : "asteroid.png",
	            obj : astimg },
		"imgShip1": {
			loaded : false,
			type : "image",
			src : "spaceship1.png",
			obj : imgship1 },
		"imgShip2": {
			loaded : false,
			type : "image",
			src : "spaceship2.png",
			obj : imgship2 }
};

function Game() {
	var that = this;

	this.canvas = null;
	this.context2D = null;
	this.backBuffer = null;
	this.backBufferContext2D = null;

	this.Players = [];
	this.myPlayer = null;
	this.Asteroids = [];
	this.AsteroidCreationTimer = 0;
	

	/** -1 = before game began, 1 = loading resources, 2 = ready to connect, 3 = connecting, 4 = dead, 5 = alive */
//maybe later add our team wins, their team wins
	this.GameState = -1;

	this.loaded = false;
	this.Connected = false;
	this.gameloop = null;
	this.pingLoop = null;

    this.lastFrame = new Date().getTime();
    this.lastSentData = new Date().getTime();
    this.lastDataReceiveTime;

	this.pingtime = 0;

	var socket;
	this.ShotList = [];

	/** load images and sound */
	var loadResources = function () {
	    for (var item in loadables)
		loadResource(item);
	};

	var loadResource = function (name) {
	    var toload = loadables[name];
	    if (!toload) {
	        alert('undefined loadable');
	        return;
	    }

	    if (toload.type == "sound") {
	        toload.obj.src = toload.src;
	        toload.obj.preload = "auto";
	        toload.obj.addEventListener('canplaythrough', function () { toload.loaded = true; checkAllLoaded(); }, false);
	    }

	    if (toload.type == "image") {
	        toload.obj.src = toload.src;
	        toload.obj.onload = function () { toload.loaded = true; checkAllLoaded(); };
	    }
	};

	var checkAllLoaded = function () {
	    var flag = true;
	    for (var item in loadables)
		if (loadables[item].loaded !== true)
		    flag = false;
	    
	    if (flag && !this.loaded)
	    {
		this.loaded = true;
		jQuery(that).trigger("ResourcesLoaded");
	    }
	};

	var initBackbuffer = function () {
		//FIX
		//add resolution options
		/** Set up the canvas and backbuffer */
		that.canvas = document.getElementById('gamecanvas');
		that.canvas.width = CANVASWIDTH;
		that.canvas.height = CANVASHEIGHT;
		that.context2D = that.canvas.getContext('2d');
		that.backBuffer = document.createElement('canvas');
		that.backBuffer.width = that.canvas.width;
		that.backBuffer.height = that.canvas.height;
		that.backBufferContext2D = that.backBuffer.getContext('2d');
	};

	/** Init -> Start -> Connect */
	/** init buffer, load resources */
	this.Init = function () {
		that.GameState = 1;
		initBackbuffer();
		jQuery(this).bind("ResourcesLoaded", Start);
		loadResources();
		
		return this;
	};

	/** bind keys of page, create empty player, start game loop */
	var Start = function () {
	    jQuery(document).keydown(that.onKeyDown);
	    jQuery(document).keyup(that.onKeyUp);
	    that.GameState = 2;

	    that.myPlayer = new Player();
	    that.myPlayer.isMyPlayer = true;

	    /** Game loop */
	    that.gameloop = setInterval(function () { that.GameLoop(); }, MS_BETWEEN_FRAMES);
	};
    //FIX
	var Connect = function () {
	    //connect
	    that.GameState = 3;
	    socket = io.connect(SERVER_CONNECTION);
	    //FIX name
	    socket.emit('playercreate', { N: name });
	    socket.on('playercreated', function (data) {
	        that.Connected = true;
	        that.myPlayer.Init(1, data.PlayerID);
	        that.GameState = 4;

	        /** Fill player list */
	        that.Players = [];
	        for (var i in data.P) {
	            var player = data.P[i];
	            var newplayer = new Player();
	            newplayer.Init(2, player.ID, player.N);
                if (player.L)
	                newplayer.Spawn(player.X, player.Y, player.R);
	            newplayer.Lives = player.L;
	            that.Players.push(newplayer);
	        }

	        socket.on("gamedata", that.ReceiveData);
	        socket.on("serverping", pingCallback);
	        socket.on('spawn', spawnCallback);
	        socket.on('addplayer', connectCallback);
	        socket.on('removeplayer', disconnectCallback);
	        socket.on('hit', hitCallback);

	        that.pingLoop = setInterval(Ping, PING_SEND_TIME);
	    });
	};

	var hitCallback = function (data) {
	    for (var i in that.Players)
	        if (that.Players[i].ID == data.ID)
	            that.Players[i].Hit();

	    if (that.myPlayer.ID == data.ID)
	        that.myPlayer.Hit();

	    for (var i in that.ShotList) {
	        var shot = that.ShotList[i];
	        if (shot.PID == data.PID && shot.guid == data.SID)
	            that.ShotList.splice(i, 1);
	    }
	};

	var spawnCallback = function (data) {
	    for (var i in that.Players)
            if (that.Players[i].ID == data.ID)
                that.Players[i].Spawn(data.X, data.Y, data.R);
	};

	var connectCallback = function (data) {
	    if (PlayerExists(data.ID)) return;

	    var enemyplayer = new Player();
	    enemyplayer.Init(2, data.ID, data.N);
	    that.Players.push(enemyplayer);
	};

	var PlayerExists = function (ID) {
	    for (var i in that.Players)
	        if (that.Players[i].ID == ID)
	            return true;
	    return false;
	};

	var disconnectCallback = function (data) {
	    for (var i in that.Players)
	        if (that.Players[i].ID == data.ID) {
	            that.Players.splice(i, 1);
	            break;
	        }
	};

	var pingCallback = function (data) {
	    var newtime = new Date().getTime();
	    that.pingtime = (newtime - data.clientping) / 2;
	};

	var Ping = function () {
	    socket.emit("clientping", { clientping: new Date().getTime() });
	};

	var Join = function () {
	    if (that.myPlayer.Lives <= 0 && that.Connected) {
	        that.myPlayer.Spawn(200, 200, -90);
	        socket.emit('spawn', { ID:that.myPlayer.ID, X: 200, Y: 200, R: -90 });
	        that.GameState = 5;
	    }
	};

	this.GameLoop = function () {
	    var thisFrame = new Date().getTime();
	    var dt = (thisFrame - this.lastFrame) / 1000;
	    this.lastFrame = thisFrame;

	    this.Update(dt);

	    if (socket) {
	        this.SendData(dt);
	    }
	    Draw();
	};

	this.ReceiveData = function (data, Shots, T) {
	    that.lastDataReceiveTime = new Date().getTime();

	    for (var j in Shots) {
	        var shot = Shots[j];
	        var newshot = new Laser();
	        newshot.Init(shot.P.X, shot.P.Y, shot.R, 2, shot.ID, /* T */null, shot.PID);
	        newshot.Fadeout = shot.F;
	        that.ShotList.push(newshot);
	    }

	    for (var j in data) {
	        var serverplayerdata = data[j];
	        for (var i in that.Players) {
	            var player = that.Players[i];

	            if (player.ID == serverplayerdata.ID) {
	                player.UpdateData(serverplayerdata, T);
	                break;
	            }
	        }
	    }
	};

	this.SendData = function (dt) {
	    var now = new Date().getTime();

	    if (now - this.lastSentData > SEND_TIME) {
	        this.lastSentData = new Date().getTime();

	        var d = {
	            P: this.myPlayer.Pos,
	            R: this.myPlayer.Rotation,
	            ID: that.myPlayer.ID
	        };

	        socket.emit("clientdata", d);
	    }
	};

	this.SendShot = function (shot) {
	    socket.emit("fire", { PID: that.myPlayer.ID, P: shot.Pos, R: shot.Rotation, ID: shot.guid, F:shot.Fadeout });
	};

	this.SendHit = function (player, shot) {
	    socket.emit('hit', { ID: player.ID, SID: shot.guid, PID: this.myPlayer.ID });
	};

	this.Update = function (/** time diff */dt) {
	    //FIX to a better check
	    /** player input */
	    if (p1rightKey && p1leftKey) this.myPlayer.Rotating = 0;
	    else if (p1rightKey) this.myPlayer.Rotating = 1;
	    else if (p1leftKey) this.myPlayer.Rotating = -1;
	    else this.myPlayer.Rotating = 0;

	    if (p1upKey && p1downKey) this.myPlayer.Accelerating = 0;
	    else if (p1upKey) this.myPlayer.Accelerating = 1;
	    else if (p1downKey) this.myPlayer.Accelerating = -1;
	    else this.myPlayer.Accelerating = 0;

	    if (p1spaceKey) this.myPlayer.Shooting = true;
	    else this.myPlayer.Shooting = false;

	    /** Update our player */
	    this.myPlayer.Update(dt);

	    /** Update our shots */
	    for (var i in this.myPlayer.Shots) {
	        var shot = this.myPlayer.Shots[i];
	        shot.Update(dt);
	        if (shot.Fadeout <= 0) this.myPlayer.Shots.splice(i, 1);
	    }

	    /** Update shot list */
	    for (var i in that.ShotList) {
	        var shot = that.ShotList[i];
	        //if (shot.PID != myPlayer.ID) {
	        shot.Update(dt);
	        if (shot.Fadeout <= 0) that.ShotList.splice(i, 1);
	        //}
	    }

	    for (var i in that.myPlayer.Shots) {
	        var shot = that.myPlayer.Shots[i];
	        /** Check collision */
	        for (var j in that.Players) {
	            player = that.Players[j];
	            if (player.ID != that.myPlayer.ID && CheckLaserCollision(player, shot)) {
	                this.SendHit(player, shot);
	                player.Hit();
	                that.myPlayer.Shots.splice(i, 1);
	            }
	        }
	    }

	    /** Update players */
	    for (var i in this.Players)
	        this.Players[i].Update(dt);

	    /** Update asteroids */
	    for (var i in this.Asteroids) {
	        var asteroid = this.Asteroids[i];
	        asteroid.Update(dt);
	    }
	};

    var CheckLaserCollision = function (/** player */ ship, /** shot */ shot) {
		if (shot.Pos.X <= ship.Pos.X + ship.collisionWidth &&
			shot.Pos.X >= ship.Pos.X - ship.collisionWidth &&
			shot.Pos.Y <= ship.Pos.Y + ship.collisionHeight &&
			shot.Pos.Y >= ship.Pos.Y - ship.collisionHeight)
			return true;

		return false;
	};

	var Draw = function () {
	    /** clear backbuffer */
	    that.backBufferContext2D.clearRect(0, 0, that.backBuffer.width, that.backBuffer.height);

	    /** Draw shot list */
	    for (var i in that.ShotList) {
	        var shot = that.ShotList[i];
	        if (shot.PID != that.myPlayer.ID) {
	            shot.Draw();
	        }
	    }

	    /** draw our shots */
	    for (var i in that.myPlayer.Shots)
	        that.myPlayer.Shots[i].Draw();

	    /** Draw asteroids */
	    for (var i in that.Asteroids)
	        that.Asteroids[i].Draw();

	    /** Draw other players */
	    for (var i in that.Players) {
            var player = that.Players[i];
            if (player.ID != that.myPlayer.ID)
	            player.Draw();
	    }

	    /** Draw our player */
	    that.myPlayer.Draw();

	    switch (that.GameState) {
	        /** loading resources */ 
	        case 1:
	            drawInstructions();
	            drawMessage("Loading Resources...");
	            break;
	        /** ready to connect */ 
	        case 2:
	            drawInstructions();
	            drawMessage("Press Enter to connect");
	            break;
	        /** ready to connect */ 
	        case 3:
	            drawInstructions();
	            drawMessage("Connecting....");
	            break;
	        /** in-game */ 
	        case 4:
	            drawHUD();
	            drawMessage("Press Enter to join");
	            break;
	        case 5:
	            drawHUD();
	            break;
	    }
	    drawBackbuffer();
	};

	var drawHUD = function () {
	    //health, allies, enemies, map, ping
	    /** health bar */
	    that.backBufferContext2D.fillStyle = "rgba(0,0,200, 0.4)";
	    that.backBufferContext2D.fillRect(CANVASWIDTH / 2 - 150, 30, 30 * that.myPlayer.Lives, 40);
	    that.backBufferContext2D.strokeStyle = "rgba(250,250,250, 1)";
	    that.backBufferContext2D.strokeRect(CANVASWIDTH / 2 - 150, 30, 300, 40);

	    /** Ping */
	    var color;
	    if (that.pingtime >= 200) color = "rgba(250, 0, 0, 1)";
	    else if (that.pingtime <= 200 && that.pingtime >= 100) color = "rgba(250, 250, 0, 1)";
	    else if (that.pingtime <= 100) color = "rgba(0, 250, 0, 1)";
	    drawMessage("Ping: " + that.pingtime, color, CANVASWIDTH - 130, 30);

	    /** Score */
	    drawMessage("Score: " + that.myPlayer.Score, "rgba(250, 250, 0, 1)", 30, 30);
	};

	var drawBackbuffer = function () {
		that.context2D.clearRect(0, 0, that.canvas.width, that.canvas.height);
		that.context2D.drawImage(that.backBuffer, 0, 0);
	};

    var drawMessage = function (/** string */text, /** string */color, /** int */posX, /** int */posY, /** string */font) {
        that.backBufferContext2D.font = font || "bold 30px sans-serif";
		that.backBufferContext2D.fillStyle = color || "White";
		that.backBufferContext2D.fillText(text, posX || (CANVASWIDTH / 2 - 150), posY || (CANVASHEIGHT - 100));
	};

	var drawInstructions = function () {
		that.backBufferContext2D.clearRect(0, 0, that.backBuffer.width, that.backBuffer.height);
		that.backBufferContext2D.font = "bold 30px sans-serif";
		that.backBufferContext2D.width = 3;

		that.backBufferContext2D.strokeStyle = "LightBlue";
		that.backBufferContext2D.strokeText("Controls: Arrow keys + Space", 200, CANVASHEIGHT / 2);

		that.backBufferContext2D.fillStyle = "White";
		that.backBufferContext2D.fillText("Instructions: kill the enemy. avoid the asteroids. duh.", CANVASWIDTH / 2 - 360, CANVASHEIGHT / 4);
	};

	var p1rightKey = false;
	var p1leftKey = false;
	var p1upKey = false;
	var p1downKey = false;
	var p1spaceKey = false;

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

	    if (evt.keyCode == 13) {
	        if (!that.Connected) {
	            Connect();
	        }
	        else if (that.GameState == 4) {
	            Join();
	        }
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
	};
};

var game = new Game();
game.Init();
