var FRAMES_PER_SECOND = 30;
var PACKETS_PER_SECOND = 10;
var MS_BETWEEN_FRAMES = 1000 / FRAMES_PER_SECOND;

var SPACE_WIDTH = 2500;
var SPACE_HEIGHT = 1800;

var CANVAS_WIDTH = 1024;
var CANVAS_HEIGHT = 768;
var CANVAS_BORDER_SPACE = 20;

//var SERVER_CONNECTION = "http://localhost:8080";
//var SERVER_CONNECTION = "http://10.0.0.4:8080";
//var SERVER_CONNECTION = "http://spacegame.chickenkiller.com";
var SERVER_CONNECTION = null;

var SEND_TIME = 1000 / PACKETS_PER_SECOND;

var PING_SEND_TIME = 1000;

var loadables = {
    "sndExplode" : {
        loaded : false,
        type : "sound",
        src : "explosion.ogg"},
    "sndLaser1" : {
        loaded : false,
        type : "sound",
        src : "Laser_s.ogg"},
    "sndLaser2" : {
        loaded : false,
        type : "sound",
        src : "evil_laser.ogg"},
    "imgLaser1" : {
        loaded : false,
        type : "image",
        src : "greenLaserRay.png"},
    "imgLaser2" : {
        loaded : false,
        type : "image",
        src : "redLaserRay.png"},
    "imgAsteroid" : {
        loaded : false,
        type : "image",
        src : "asteroid.png"},
    "imgShip1": {
        loaded : false,
        type : "image",
        src : "spaceship1.png"},
    "imgShip2": {
        loaded : false,
        type : "image",
        src : "spaceship2.png"},
    "imgSpace": {
        loaded: false,
        type : "image",
        src : "bigspace.jpg"},
    "imgSoundOff" : {
        loaded : false,
        type : "image",
        src : "SoundOff.png"}
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
	var joined = false;
	this.ShotList = [];
	this.hascookie = false;
	this.offeredsignup = false;

	/** load images and sound */
    var resourcesloaded = false;
    this.Resources = {};
    
    var sound = true;
    var cameraLocationX, cameraLocationY;
    var mapleftedge = 4 * CANVAS_WIDTH / 5, mapwidth = 1 * CANVAS_WIDTH / 6;
    var maptopedge = 4 * CANVAS_HEIGHT / 5, mapheight = 1 * CANVAS_HEIGHT / 6;
    var displayInstructions = false;
    
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
            that.Resources[name] = new Audio();
            that.Resources[name].src = toload.src;
            that.Resources[name].preload = "auto";
            that.Resources[name].addEventListener('canplaythrough', function () { toload.loaded = true; checkAllLoaded(); }, false);
	    }

	    if (toload.type == "image") {
            that.Resources[name] = new Image();
            that.Resources[name].src = toload.src;
            that.Resources[name].onload = function () { toload.loaded = true; checkAllLoaded(); };
	    }
	};

	var checkAllLoaded = function () {
	    var flag = true;
	    for (var item in loadables)
		if (loadables[item].loaded !== true)
		    flag = false;
	    
	    if (flag && !resourcesloaded) {
            resourcesloaded = true;
            jQuery(that).trigger("ResourcesLoaded");
	    }
	};

	var initBackbuffer = function () {
		//FIX
		//add resolution options
		/** Set up the canvas and backbuffer */
		that.canvas = document.getElementById('gamecanvas');
		that.canvas.width = CANVAS_WIDTH;
		that.canvas.height = CANVAS_HEIGHT;
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

		jQuery("#game-wrap").addClass("game-wrap").css("margin-left", -CANVAS_WIDTH / 2);
		jQuery(this).bind("ResourcesLoaded", Start);
		loadResources();
        
        that.myPlayer = new Player();
        that.myPlayer.isMyPlayer = true;

        /** Game loop */
        that.gameloop = setInterval(function () { that.GameLoop(); }, MS_BETWEEN_FRAMES);
		
		return this;
	};

	this.myPlayerDeath = function () {
	    game.GameState = 4;

	    /** save the score / Offer the player to sign up / offer the player to save the score */
        if (FBName === null)
            showSignup();
        else if (FBName != that.myPlayer.name)
            nameChange(FBName);
        else
            this.saveScore(FBID);
	};
    
	this.saveScore = function (id) {
        scoreupdating = true;
		socket.emit('highscore', { S: this.PlayerScore, FBID: id, N:this.myPlayer.name });
	};

	/** bind keys of page, create empty player, start game loop */
	var Start = function () {
	    jQuery(document).keydown(that.onKeyDown);
	    jQuery(document).keyup(that.onKeyUp);
	    that.GameState = 2;
	};
    //FIX
	var Connect = function () {
	    //connect
	    that.GameState = 3;
	    socket = io.connect(SERVER_CONNECTION);
        
        socket.socket.on('error', function (error) {
            alert('connection failed');
            that.GameState = 2;
        });

        socket.emit('playercreate', { N: FBName });
            
        socket.on('playercreated', function (data) {
	        that.Connected = true;
	        that.myPlayer.Init(data.PlayerID, data.N);
	        that.GameState = 4;

	        socket.on("gamedata", that.ReceiveData);
	        socket.on("serverping", pingCallback);
	        socket.on('spawned', spawnCallback);
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

    var scoreupdating = false;
	var highscoresCallback = function (data) {
		highScores = data;
        
        if (scoreupdating) {
            scoreupdating = false;
            displayHighScores(highScores);
        }
	};

	var spawnCallback = function (data) {
        if (data.ID == that.myPlayer.ID) {
            joined = true;
            that.myPlayer.Spawn(data.X, data.Y, data.R, data.T);
            that.PlayerScore = 0;
            that.GameState = 5;
            attemptingjoin = false;
        }
        
	    /*var index = GetPlayerIndex(data.ID);
	    if (index != -1)
	        that.Players[index].Spawn(data.X, data.Y, data.R, data.T);*/
	};

	var connectCallback = function (data) {
	    /*if (GetPlayerIndex(data.ID) != -1) return;

	    var enemyplayer = new Player();
	    enemyplayer.Init(data.ID, data.N);
	    that.Players.push(enemyplayer);*/
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
	        socket.emit('spawn', { ID:that.myPlayer.ID, X: SPACE_WIDTH / 2, Y: SPACE_HEIGHT / 2, R: -90 });
	    }
	};

	this.GameLoop = function () {
	    var thisFrame = new Date().getTime();
	    var dt = (thisFrame - this.lastFrame) / 1000;
	    this.lastFrame = thisFrame;

	    this.Update(dt);

	    if (socket)
	        this.SendData(dt);
	    Draw();
	};

	this.ReceiveData = function (data, Shots, T) {
	    that.lastDataReceiveTime = new Date().getTime();

	    for (var j in Shots) {
	        var shot = Shots[j];
	        var newshot = new Laser();
	        newshot.Init(shot.P.X, shot.P.Y, shot.R, shot.T, shot.ID, /* T */null, shot.PID);
	        newshot.Fadeout = shot.F;
	        that.ShotList.push(newshot);
	    }

		for (var i in that.Players) {
			that.Players[i].updated = false;
		}
	
	    for (var j in data) {
	        var serverplayerdata = data[j];
            var index = GetPlayerIndex(serverplayerdata.ID);
            
            if (index == -1) {
                /** create a player */
                var enemyplayer = new Player();
                enemyplayer.Init(serverplayerdata.ID, serverplayerdata.N);
                if (serverplayerdata.L > 0)
                    enemyplayer.Spawn(serverplayerdata.P.X, serverplayerdata.P.Y, serverplayerdata.R, serverplayerdata.T);
                enemyplayer.updated = true;
                that.Players.push(enemyplayer);
                }
            else {
                that.Players[index].UpdateData(serverplayerdata, T);
                that.Players[index].updated = true;
            }
	    }

        for (var i in that.Players)
			if (!that.Players[i].updated) that.Players.splice(i, 1);
	};

	this.SendData = function (dt) {
	    var now = new Date().getTime();

	    if (now - this.lastSentData > SEND_TIME) {
	        this.lastSentData = new Date().getTime();

	        var d = {
	            P: this.myPlayer.Pos,
	            R: this.myPlayer.Rotation,
	            ID: that.myPlayer.ID,
                T: this.myPlayer.Team
	        };

	        socket.emit("clientdata", d);
	    }
	};

	this.Shoot = function (shot) {
        if (sound)
            game.Resources['sndLaser' + this.myPlayer.Team].play();
	    socket.emit("fire", { PID: that.myPlayer.ID, P: shot.Pos, R: shot.Rotation, T:shot.Team, ID: shot.guid, F:shot.Fadeout });
	};

	this.SendHit = function (player, shot) {
	    socket.emit('hit', { ID: player.ID, SID: shot.guid, PID: this.myPlayer.ID });
	};

	this.nameChange = function (name) {
        if (this.myPlayer) {
    		this.myPlayer.name = name;
            if (socket)
                socket.emit('playernamechange', { N:this.myPlayer.name });
        }
	};

    var LKeyDelayPress = false;
    var attemptingjoin = false;

	this.Update = function (/** time diff */dt) {
        if (enter) {
            if (!this.Connected && this.GameState == 2) {
                Connect();
            }
            else if (this.GameState == 4 && !attemptingjoin) {
                attemptingjoin = true;
	            Join();
	        }
	    }
        
        displayInstructions = OKey;
            
        if (LKey && !LKeyDelayPress) {
            LKeyDelayPress = true;
            setTimeout(function () { LKeyDelayPress = false; }, 500);
            
            sound = !sound;
        }
        
	    //FIX to a better check
	    /** player input */
	    if (rightKey && leftKey) this.myPlayer.Rotating = 0;
	    else if (rightKey) this.myPlayer.Rotating = 1;
	    else if (leftKey) this.myPlayer.Rotating = -1;
	    else this.myPlayer.Rotating = 0;

	    if (upKey && downKey) this.myPlayer.Accelerating = 0;
	    else if (upKey) this.myPlayer.Accelerating = 1;
	    else if (downKey) this.myPlayer.Accelerating = -1;
	    else this.myPlayer.Accelerating = 0;

	    if (ctrlKey) this.myPlayer.Shooting = true;
	    else this.myPlayer.Shooting = false;

	    /** Update our player */
	    this.myPlayer.Update(dt);
        
        if (this.myPlayer.Pos.X >= SPACE_WIDTH) {
            this.myPlayer.Pos.X = SPACE_WIDTH;
            this.myPlayer.Speed.X *= -1;
        }
        if (this.myPlayer.Pos.X <= 0) {
            this.myPlayer.Pos.X = 0;
            this.myPlayer.Speed.X *= -1;
        }
        if (this.myPlayer.Pos.Y >= SPACE_HEIGHT) {
            this.myPlayer.Pos.Y = SPACE_HEIGHT;
            this.myPlayer.Speed.Y *= -1;
        }
	    if (this.myPlayer.Pos.Y <= 0) {
            this.myPlayer.Pos.Y = 0;
            this.myPlayer.Speed.Y *= -1;
	    }

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
	            var player = that.Players[j];
	            if (player.Alive && player.Team != that.myPlayer.Team && CheckLaserCollision(player, shot)) {
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
    
    this.CreateExplosion = function (X, Y) {
        if (sound) game.Resources['sndExplode'].play();
        
        var explosion = jQuery("#explosiondiv1").clone();
        explosion.addClass("ExplodingExplosion");
        explosion[0].X = X;
        explosion[0].Y = Y;
        
        jQuery(explosion).css('left', 400).css('top', 400).removeClass("invis");
        
        setTimeout(function () {
            jQuery(explosion).remove();
        }, 750);
        
        var diffX = X - cameraLocationX, diffY = Y - cameraLocationY;
        
        if (diffX >= -CANVAS_WIDTH / 2 && diffX <= CANVAS_WIDTH / 2 &&
            diffY >= -CANVAS_HEIGHT / 2 && diffY <= CANVAS_HEIGHT / 2)
        {
            jQuery(explosion).css('left', diffX + CANVAS_WIDTH / 2 - 50).css('top', diffY + CANVAS_HEIGHT / 2 - 60).removeClass("invis");
        }
    };

	var Draw = function () {
	    /** clear backbuffer */
	    that.backBufferContext2D.clearRect(0, 0, that.backBuffer.width, that.backBuffer.height);
        
        jQuery(".ExplodingExplosion").each(function () {
            var diffX = this.X - cameraLocationX, diffY = this.Y - cameraLocationY;
        
            if (diffX >= -CANVAS_WIDTH / 2 && diffX <= CANVAS_WIDTH / 2 &&
                diffY >= -CANVAS_HEIGHT / 2 && diffY <= CANVAS_HEIGHT / 2)
            {
                jQuery(this).css('left', diffX + CANVAS_WIDTH / 2 - 50).css('top', diffY + CANVAS_HEIGHT / 2 - 60).removeClass("invis");
            }
        });
        

        /** camera set up */
        cameraLocationX = joined ? that.myPlayer.Pos.X : SPACE_WIDTH / 2;
        cameraLocationY = joined ? that.myPlayer.Pos.Y : SPACE_HEIGHT / 2;
        
        /** deal with borders */
        if (cameraLocationX - CANVAS_WIDTH / 2 <= 0)
            cameraLocationX = CANVAS_WIDTH / 2;
        if (cameraLocationX + CANVAS_WIDTH / 2 >= SPACE_WIDTH)
            cameraLocationX = SPACE_WIDTH - CANVAS_WIDTH / 2;
        if (cameraLocationY - CANVAS_HEIGHT / 2 <= 0)
            cameraLocationY = CANVAS_HEIGHT / 2;
        if (cameraLocationY + CANVAS_HEIGHT / 2 >= SPACE_HEIGHT)
            cameraLocationY = SPACE_HEIGHT - CANVAS_HEIGHT / 2;
            
        /** Draw background on camera */
        that.backBufferContext2D.drawImage(that.Resources.imgSpace, 
            cameraLocationX - CANVAS_WIDTH / 2, cameraLocationY - CANVAS_HEIGHT / 2,
            CANVAS_WIDTH, CANVAS_HEIGHT,
            0, 0,
            CANVAS_WIDTH, CANVAS_HEIGHT);

	    /** Draw shot list */
	    for (var i in that.ShotList) {
	        var shot = that.ShotList[i];
            var diffX = shot.Pos.X - cameraLocationX, diffY = shot.Pos.Y - cameraLocationY;
	        if (shot.PID != that.myPlayer.ID && 
                diffX >= - CANVAS_WIDTH && diffX <= CANVAS_WIDTH &&
                diffY >= - CANVAS_HEIGHT && diffY <= CANVAS_HEIGHT)
                shot.Draw(diffX + CANVAS_WIDTH / 2, diffY + CANVAS_HEIGHT / 2);
	    }

	    /** draw our shots */
	    for (var i in that.myPlayer.Shots) {
            var shot = that.myPlayer.Shots[i];
            var diffX = shot.Pos.X - cameraLocationX, diffY = shot.Pos.Y - cameraLocationY;
            if (diffX >= - CANVAS_WIDTH && diffX <= CANVAS_WIDTH &&
                diffY >= - CANVAS_HEIGHT && diffY <= CANVAS_HEIGHT)
                shot.Draw(diffX + CANVAS_WIDTH / 2, diffY + CANVAS_HEIGHT / 2);
	    }

	    /** Draw asteroids */
	    for (var i in that.Asteroids)
	        that.Asteroids[i].Draw();

	    /** Draw other players */
	    for (var i in that.Players) {
	        var player = that.Players[i];
            var diffX = player.Pos.X - cameraLocationX, diffY = player.Pos.Y - cameraLocationY;
            if (player.ID != that.myPlayer.ID &&
                diffX >= - CANVAS_WIDTH / 2 && diffX <= CANVAS_WIDTH / 2 &&
                diffY >= - CANVAS_HEIGHT / 2 && diffY <= CANVAS_HEIGHT / 2)
                player.Draw(diffX + CANVAS_WIDTH / 2, diffY + CANVAS_HEIGHT / 2);
	    }

	    /** Draw our player */
	    that.myPlayer.Draw(that.myPlayer.Pos.X - cameraLocationX + CANVAS_WIDTH / 2, that.myPlayer.Pos.Y - cameraLocationY + CANVAS_HEIGHT / 2);

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
                if (displayInstructions)
                    drawInstructions();
			    
	            drawHUD();
	            drawMessage("Press Enter to join");
	            break;
	        case 5:
                if (displayInstructions)
                    drawInstructions();
	            
	            drawHUD();
	            break;
	    }

	    drawBackbuffer();
	};

	var drawHUD = function () {
	    //health, allies, enemies, map, ping
	    /** health bar */
	    that.backBufferContext2D.fillStyle = "rgba(0,250,0, 0.4)";
	    that.backBufferContext2D.fillRect(CANVAS_WIDTH / 2 - 150, 30, 30 * that.myPlayer.Lives, 40);
	    that.backBufferContext2D.strokeStyle = "rgba(250,250,250, 1)";
	    that.backBufferContext2D.strokeRect(CANVAS_WIDTH / 2 - 150, 30, 300, 40);

	    /** Ping */
	    var color;
	    if (that.pingtime >= 200) color = "rgba(250, 0, 0, 1)";
	    else if (that.pingtime <= 200 && that.pingtime >= 100) color = "rgba(250, 250, 0, 1)";
	    else if (that.pingtime <= 100) color = "rgba(0, 250, 0, 1)";
	    drawMessage("Ping: " + that.pingtime, color, CANVAS_WIDTH - 130, 30);

	    /** Score */
	    drawMessage("Score: " + that.PlayerScore, "rgba(250, 250, 0, 1)", 30, 30);

        /** player list */
	    drawPlayersList();
        
        /** map */
        /** outer square */
        that.backBufferContext2D.strokeStyle = "White";
        that.backBufferContext2D.strokeRect(mapleftedge, maptopedge, mapwidth, mapheight);
        /** background */
        that.backBufferContext2D.fillStyle = "rgba(0, 0, 0, 0.7)";
        that.backBufferContext2D.fillRect(mapleftedge, maptopedge, mapwidth, mapheight);
        
        /** my player triangle */
        if (that.myPlayer.Alive)
            drawMapPlayer(that.myPlayer);
        
        for (var i in that.Players) {
            if (that.Players[i].Alive && that.Players[i].ID != that.myPlayer.ID)
                drawMapPlayer(that.Players[i]);
        }
        
        /** sound indicator */
        if (!sound) {
            var img = that.Resources['imgSoundOff'];
            that.backBufferContext2D.drawImage(img, CANVAS_WIDTH - 250, 10);
        }
        
	};
    
    var drawMapPlayer = function (player) {
        game.backBufferContext2D.save();
        
        if (player.isMyPlayer)
            that.backBufferContext2D.fillStyle = "rgba(0, 255, 0, 0.8)";
        else if (player.Team == that.myPlayer.Team)
            that.backBufferContext2D.fillStyle = "rgba(0, 0, 255, 0.8)";
        else
            that.backBufferContext2D.fillStyle = "rgba(255, 0, 0, 0.8)";
        
        game.backBufferContext2D.translate(mapleftedge + player.Pos.X * mapwidth / SPACE_WIDTH, maptopedge + player.Pos.Y * mapheight / SPACE_HEIGHT);
        game.backBufferContext2D.rotate(Math.PI + player.Rotation * Math.PI / 180);
        
        that.backBufferContext2D.beginPath();
        that.backBufferContext2D.moveTo(0, -5);
        that.backBufferContext2D.lineTo(3, 5);
        that.backBufferContext2D.lineTo(-3, 5);
        that.backBufferContext2D.fill();
        game.backBufferContext2D.restore();
    };

	var drawBackbuffer = function () {
		that.context2D.clearRect(0, 0, that.canvas.width, that.canvas.height);
		that.context2D.drawImage(that.backBuffer, 0, 0);
	};

    var drawMessage = function (/** string */text, /** string */color, /** int */posX, /** int */posY, /** string */font) {
        that.backBufferContext2D.font = font || "bold 30px sans-serif";
		that.backBufferContext2D.fillStyle = color || "White";
		that.backBufferContext2D.fillText(text, posX || (CANVAS_WIDTH / 2 - text.length * 7.5), posY || (CANVAS_HEIGHT - 100));
	};

	var drawInstructions = function () {
        that.backBufferContext2D.font = "bold 30px sans-serif";
        that.backBufferContext2D.fillStyle = "Red";
    	that.backBufferContext2D.fillText("If the game is stuck at connecting, you need to turn off your firewall", 20, 100);

		that.backBufferContext2D.fillStyle = "Orange";
		that.backBufferContext2D.fillText("Instructions:", 100, CANVAS_HEIGHT / 4);
		that.backBufferContext2D.fillText("Multiplayer game. Kill the enemies. ", 160, CANVAS_HEIGHT / 4 + 50);
		that.backBufferContext2D.fillText("Use the Arrow Keys to move, Ctrl to shoot.", 160, CANVAS_HEIGHT / 4 + 100);
        that.backBufferContext2D.fillText("Hold O to bring up the instructions menu", 160, CANVAS_HEIGHT / 4 + 150);
        that.backBufferContext2D.fillText("Press L to turn off sound", 160, CANVAS_HEIGHT / 4 + 200);
    };

    var drawPlayersList = function () {
        var xBase = 10, yBase = 50, xOffset = 10, yOffset = 20;
        var width = 40;
        var textheight = 10;

        that.backBufferContext2D.font = "normal 10px sans-serif";
        that.backBufferContext2D.fillStyle = "rgba(0, 255, 0, 0.9)";
        that.backBufferContext2D.fillText("Players Connected (" + that.Players.length + ")", xBase, yBase);
        
        var extraoffset;
        
        if (that.myPlayer.Team == 1) {
            that.backBufferContext2D.fillStyle = "rgba(0, 0, 255, 0.9)";
            extraoffset = drawTeamList(1, xBase + xOffset, yBase + yOffset, textheight);
            that.backBufferContext2D.fillStyle = "rgba(255, 0, 0, 0.9)";
            drawTeamList(2, xBase + xOffset, yBase + yOffset * 2 + extraoffset, textheight);
        }
        else {
            that.backBufferContext2D.fillStyle = "rgba(0, 0, 255, 0.9)";
            extraoffset = drawTeamList(2, xBase + xOffset, yBase + yOffset, textheight);
            that.backBufferContext2D.fillStyle = "rgba(255, 0, 0, 0.9)";
            drawTeamList(1, xBase + xOffset, yBase + yOffset * 2 + extraoffset, textheight);
        }
        
        that.backBufferContext2D.fillStyle = "rgba(255, 0, 255, 0.9)";
        drawTeamList(0, xBase + xOffset, yBase + yOffset * 3 + extraoffset, textheight);
    };
    
    var drawTeamList = function (team, x, y, linespace) {
        var i;
        for (i in that.Players) {
            var player = that.Players[i];
            if (player.Team == team)
                that.backBufferContext2D.fillText("-" + player.name,x, y + (parseInt(i) + 1) * linespace);
        }
        
        return (parseInt(i) + 1) * linespace;
    };

	var rightKey = false;
	var leftKey = false;
	var upKey = false;
	var downKey = false;
	var ctrlKey = false;

    var OKey = false;
    var LKey = false;
	var enter = false;

	this.onKeyDown = function (evt) {
	    if (evt.keyCode == 39) rightKey = true;
	    else if (evt.keyCode == 37) leftKey = true;
	    if (evt.keyCode == 38) upKey = true;
	    else if (evt.keyCode == 40) downKey = true;
	    if (evt.keyCode == 17) ctrlKey = true;
        
        if (evt.keyCode == 79) OKey = true;
        if (evt.keyCode == 76) LKey = true;

	    if (evt.keyCode == 13) enter = true;
	}

    this.onKeyUp = function (evt) {
		if (evt.keyCode == 39) rightKey = false;
		else if (evt.keyCode == 37) leftKey = false;
		if (evt.keyCode == 38) upKey = false;
		else if (evt.keyCode == 40) downKey = false;
		if (evt.keyCode == 17) ctrlKey = false;

        if (evt.keyCode == 79) OKey = false;
        if (evt.keyCode == 76) LKey = false;

		if (evt.keyCode == 13) enter = false;
	};
};

var game = new Game();
game.Init();