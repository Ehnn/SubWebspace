FRAMES_PER_SECOND = 30;
PACKETS_PER_SECOND = 20;
MS_BETWEEN_FRAMES = 1000 / FRAMES_PER_SECOND;

CANVASWIDTH = 1024;
CANVASHEIGHT = 768;
CANVAS_BORDER_SPACE = 20;

ASTEROID_CREATION_TIME = 7;
MAX_ASTEROIDS_NUM = 10;

SERVER_CONNECTION = "http://localhost:8080";
//SERVER_CONNECTION = "http://10.0.0.4:8080";
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
	this.PlayerScore = 0;

	var socket;
	var highScores = [];
	this.ShotList = [];
	this.hascookie = false;
	this.offeredsignup = false;

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

		jQuery("#game-wrap").addClass("game-wrap").css("margin-left", -CANVASWIDTH / 2);
		jQuery(this).bind("ResourcesLoaded", Start);
		loadResources();
		
		return this;
	};

	this.myPlayerDeath = function () {
	    game.GameState = 4;

	    /** save the score / Offer the player to sign up / offer the player to save the score */
		if (this.hascookie)
			game.saveScore();
		else /*if (!this.offeredsignup)*/ {
			this.offeredsignup = true;
			showSignup();
		}
//		else
//			showSaveScore();
	};

	this.saveScore = function (name) {
		socket.emit('highscore', { S: this.PlayerScore, N: name || this.myPlayer.name });
	};

	/** bind keys of page, create empty player, start game loop */
	var Start = function () {
	    jQuery(document).keydown(that.onKeyDown);
	    jQuery(document).keyup(that.onKeyUp);
	    that.GameState = 2;

	    that.myPlayer = new Player();
	    that.myPlayer.isMyPlayer = true;

		/** Get cookies player name */
		var splitcookies = document.cookie.split(';');
		for (var i in splitcookies) {
		    var pair = splitcookies[i].split('=');
			if (pair[0] == "name") {
				that.hascookie = true;
				that.myPlayer.name = pair[1];
			}
		}

	    /** Game loop */
	    that.gameloop = setInterval(function () { that.GameLoop(); }, MS_BETWEEN_FRAMES);
	};
    //FIX
	var Connect = function () {
	    //connect
	    that.GameState = 3;
	    socket = io.connect(SERVER_CONNECTION);
	    //FIX name
	    socket.emit('playercreate', { N: that.myPlayer.name });
	    socket.on('playercreated', function (data) {
	        that.Connected = true;
	        that.myPlayer.Init(1, data.PlayerID, data.N);
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
	        socket.on('namechange', namechangeCallback);
	        socket.on('highscores', highscoresCallback);

	        that.pingLoop = setInterval(Ping, PING_SEND_TIME);
	    });
	};

	var hitCallback = function (data) {
	    if (that.myPlayer.ID == data.ID)
	        that.myPlayer.Hit();

	    for (var i in that.ShotList) {
	        var shot = that.ShotList[i];
	        if (shot.PID == data.PID && shot.guid == data.SID)
	            that.ShotList.splice(i, 1);
	    }
	};

	var highscoresCallback = function (data) {
		highScores = data;
	};

	var spawnCallback = function (data) {
	    var index = GetPlayerIndex(data.ID);
	    if (index != -1)
	        that.Players[index].Spawn(data.X, data.Y, data.R);
	};

	var connectCallback = function (data) {
	    if (GetPlayerIndex(data.ID) != -1) return;

	    var enemyplayer = new Player();
	    enemyplayer.Init(2, data.ID, data.N);
	    that.Players.push(enemyplayer);
	};

	var namechangeCallback = function (data) {
		var index = GetPlayerIndex(data.ID);
		if (index != -1)
			that.Players[index].name = data.N;
	}

	/** index or -1 on not finding */
	var GetPlayerIndex = function (ID) {
	    for (var i in that.Players)
	        if (that.Players[i].ID == ID)
	            return i;
	    return -1;
	};

	var disconnectCallback = function (data) {
	    var index = GetPlayerIndex(data.ID);
		if (index != -1) that.Players.splice(index, 1);
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
		that.PlayerScore = 0;
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

/*		for (var i in that.Players) {
			var player = that.Players[i];
			player.updated = false;
		}*/
	
	    for (var j in data) {
	        var serverplayerdata = data[j];
		var index = GetPlayerIndex(serverplayerdata.ID);
		/** create a player */
		if (index == -1) {
			var enemyplayer = new Player();
			enemyplayer.Init(2, serverplayerdata.ID, serverplayerdata.N);
			that.Players.push(enemyplayer);
		//	enemyplayer.updated = true;
		}
		else {
		//	that.Players[index].updated = true;
			that.Players[index].UpdateData(serverplayerdata, T);
		}
	    }

		/*for (var i in that.Players) {
			var player = that.Players[i];
			if (!player.updated) that.Players.splice(i, 1);
		}*/
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

	this.nameChange = function (name) {
		this.myPlayer.name = name;
		socket.emit('playernamechange', { N:this.myPlayer.name });
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
	            if (player.Alive && player.ID != that.myPlayer.ID && CheckLaserCollision(player, shot)) {
			player.Hit();
	                this.SendHit(player, shot);
			this.PlayerScore += 10;
			if (!player.Alive)
				this.PlayerScore += 100;
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
	            drawHighScores();
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
	    that.backBufferContext2D.fillStyle = "rgba(0,250,0, 0.4)";
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
	    drawMessage("Score: " + that.PlayerScore, "rgba(250, 250, 0, 1)", 30, 30);

        /** player list */
	    drawPlayersList();
	};

	var drawBackbuffer = function () {
		that.context2D.clearRect(0, 0, that.canvas.width, that.canvas.height);
		that.context2D.drawImage(that.backBuffer, 0, 0);
	};

    var drawMessage = function (/** string */text, /** string */color, /** int */posX, /** int */posY, /** string */font) {
        that.backBufferContext2D.font = font || "bold 30px sans-serif";
		that.backBufferContext2D.fillStyle = color || "White";
		that.backBufferContext2D.fillText(text, posX || (CANVASWIDTH / 2 - text.length * 7.5), posY || (CANVASHEIGHT - 100));
	};

	var drawInstructions = function () {
		that.backBufferContext2D.clearRect(0, 0, that.backBuffer.width, that.backBuffer.height);
		that.backBufferContext2D.font = "bold 30px sans-serif";
		that.backBufferContext2D.width = 3;

//		that.backBufferContext2D.strokeStyle = "LightBlue";
//		that.backBufferContext2D.strokeText("Controls: Arrow keys + Space", 200, CANVASHEIGHT / 2);

		that.backBufferContext2D.fillStyle = "Orange";
		that.backBufferContext2D.fillText("Instructions:", 100, CANVASHEIGHT / 4);
		that.backBufferContext2D.fillText("Multiplayer game. Kill the enemies.", 160, CANVASHEIGHT / 4 + 50);
		that.backBufferContext2D.fillText("Lasers pass through edges.", 160, CANVASHEIGHT / 4 + 100);
		that.backBufferContext2D.fillText("Use the Arrow Keys to move, Space to shoot.", 160, CANVASHEIGHT / 4 + 180);
    };

    var drawPlayersList = function () {
        var xBase = 10, yBase = 50, xOffset = 10, yOffset = 20;
        var width = 40;
        var textheight = 20;

        that.backBufferContext2D.font = "normal 10px sans-serif";
        that.backBufferContext2D.fillStyle = "rgba(0, 255, 0, 0.9)";
        that.backBufferContext2D.fillText("Players Connected (" + that.Players.length + ")", xBase, yBase);
        that.backBufferContext2D.fillStyle = "rgba(255, 255, 255, 0.7)";
        for (var i in that.Players) {
            var player = that.Players[i];
            that.backBufferContext2D.fillText("-" + player.name, xBase + xOffset, yBase + (parseInt(i) + 1) * textheight);
        }
    };

    var drawHighScores = function () {
        var leftEdge = 3 * CANVASWIDTH / 8, width = CANVASWIDTH / 4, nameOffset = 10, scoreOffset = CANVASWIDTH / 4 - 75;
        var topEdge = CANVASHEIGHT / 8, height = 6 * CANVASHEIGHT / 8, yOffset = 30;
        var textheight = 40;

        drawUIBox(3 * CANVASWIDTH / 8, CANVASHEIGHT / 8, CANVASWIDTH / 4, 6 * CANVASHEIGHT / 8, "rgba(0, 0, 200, 0.6)");

        that.backBufferContext2D.font = "normal " + textheight + "px sans-serif";
        that.backBufferContext2D.fillStyle = "rgba(252, 194, 0, 0.9)";
        that.backBufferContext2D.fillText("High Scores", CANVASWIDTH / 2 - 105, topEdge);

        for (var i in highScores) {
            var player = highScores[i];
            that.backBufferContext2D.fillText(player.N, leftEdge + nameOffset, topEdge + yOffset + textheight * (parseInt(i) + 1));
            that.backBufferContext2D.fillText(player.S, leftEdge + scoreOffset, topEdge + yOffset + textheight * (parseInt(i) + 1));
        }
    };

    var drawUIBox = function (PosX, PosY, width, height, fill) {
        that.backBufferContext2D.fillStyle = fill;
        that.backBufferContext2D.strokeStyle = "White";
        that.backBufferContext2D.fillRect(PosX, PosY, width, height);
        that.backBufferContext2D.strokeRect(PosX, PosY, width, height);
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
