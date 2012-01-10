FRAMES_PER_SECOND = 30;
SECONDS_BETWEEN_FRAMES = 1000 / FRAMES_PER_SECOND;

CANVASWIDTH = 1024;
CANVASHEIGHT = 768;
CANVAS_BORDER_SPACE = 20;

ASTEROID_CREATION_TIME = 7;
MAX_ASTEROIDS_NUM = 10;

SERVER_CONNECTION = "http://localhost:8080";
//SERVER_CONNECTION = "http://spacegame.chickenkiller.com";
SEND_TIME = 1000;


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

	/** -1 = before game began, 1 = loading resources, 2 = ready to connect, 3 = connecting, 4 = in-game */
//maybe later add our team wins, their team wins
	this.GameState = -1;

	this.loaded = false;
	this.Connected = false;
	this.gameloop = null;

        this.lastFrame = new Date().getTime();
	this.lastSentData = new Date().getTime();
	this.lastReceivedData = new Date().getTime();

	this.pingtime = 0;

	var socket;

	/** load images and sound */
	var loadResources = function () {
	    for (var item in loadables)
		loadResource(item);
	};

	var loadResource = function (name) {
	    var toload = loadables[name];
	    if (!toload)
	    {
		alert('undefined loadable');
		return;
	    }
	    
	    if (toload.type == "sound")
	    {
		toload.obj.src = toload.src;
		toload.obj.preload = "auto";
		toload.obj.addEventListener('canplaythrough', function () { toload.loaded = true; checkAllLoaded(); }, false);
	    }
	    
	    if (toload.type == "image")
	    {
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

	/** Init -> Start -> Connect -> Join */
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

		/** Game loop */
	        that.gameloop = setInterval(function() { that.GameLoop(); }, SECONDS_BETWEEN_FRAMES);
	};

	var Connect = function () {
		//connect
		that.GameState = 3;
		socket = io.connect(SERVER_CONNECTION);
		socket.on("clientaccepted", function (data) {
			Ping(10, function () {
				that.Connected = true;
				that.myPlayer.Init(1, data.PlayerID);
				that.GameState = 4;
				socket.on("gamedata", that.ReceiveData);
				Join();	
			});
		});
	};

	var Ping = function (totalPings, callback) {
		var pingtimes = [];
		socket.emit("clientping", { clientping:new Date().getTime() });
		socket.on("serverping", function (data) {
			var newtime = new Date().getTime();
			pingtimes.push((newtime - data.clientping) / 2);
			if (totalPings > 0)
			{
				socket.emit("clientping", { clientping:new Date().getTime() });
				totalPings--;
			}
			else
			{
				var lowest = pingtimes[0], highest = pingtimes[0], avg = 0;
				for (var i in pingtimes) {
					var time = pingtimes[i];
					if (time > highest) highest = time;
					if (time < lowest) lowest = time;
					avg += time;
				}
				that.pingtime = (avg - highest - lowest) / (pingtimes.length - 2);
				if (callback) callback();
			}
		});
	};

	var Join = function () {
		//join yourself to the running game
		if (!that.myPlayer.Alive && that.Connected)
		{
			that.myPlayer.Spawn(200, 200, -90);
		}
	};

	this.GameLoop = function () {
		var thisFrame = new Date().getTime();
		var dt = (thisFrame - this.lastFrame)/1000;
	        this.lastFrame = thisFrame;

		this.Update(dt);

		if (socket)
			this.SendData(dt);
		Draw();
	};

	this.ReceiveData = function (data) {
		this.lastReceivedData = new Date().getTime();

		for (var i in this.Players)
		{
			var player = this.Players[i];
			player.updated = false;
		}

		for (var i in data) {
			playerdata = data[i];
/*			if (that.myPlayer.ID == playerdata.ID)
			{
//				that.myPlayer.UpdateData(playerdata);
				break;
			}*/
		}

		for (var j in data) {
			var found = false;
			var serverplayerdata = data[j];
			for (var i in that.Players) {
				var player = that.Players[i];

				if (player.ID == serverplayerdata.ID) {
					player.updated = true;
					player.UpdateData(serverplayerdata);
					found = true;
					break;
				}
			}
			
			if (!found) {
				var enemyplayer = new Player();
				enemyplayer.Init(2, serverplayerdata.ID);
				enemyplayer.UpdateData(serverplayerdata);
				that.Players.push(enemyplayer);
			}
		}

		for (var i in this.Players)
			if (!this.Players[i].updated)
				this.Players.splice(i, 1);
	};

	var debugobj = function (text) {
		var test = jQuery("<div />").text(text).appendTo(jQuery(document.body));
	};

	this.SendData = function (dt) {
		var now = new Date().getTime();

		if (now - this.lastSentData > SEND_TIME)
		{
			this.lastSentData = new Date().getTime();
			var actions = {
				rightKeyPressTime : rightKeyPressTime,
				leftKeyPressTime : leftKeyPressTime,
				upKeyPressTime : upKeyPressTime,
				downKeyPressTime : downKeyPressTime,
				spaceKeyPressTime : spaceKeyPressTime,
				ID: that.myPlayer.ID
			};

			socket.emit("clientdata", actions);//{ rightKeyPressTime:rightKeyPressTime, that.myPlayer);

			rightKeyPressTime = 0;
			leftKeyPressTime = 0;
			upKeyPressTime = 0;
			downKeyPressTime = 0;
			spaceKeyPressTime = 0;
		}
	};

	this.Update = function (/** time diff */ dt) {
		//FIX to a better check
		/** player input */
		if (p1rightKey) {
			this.myPlayer.Rotating = 1;
			rightKeyPressTime += dt;			
		}
		else if (p1leftKey) {
			this.myPlayer.Rotating = -1;
			leftKeyPressTime += dt;
		}
		else this.myPlayer.Rotating = 0;

		if (p1upKey) {
			upKeyPressTime += dt;
			this.myPlayer.Accelerating = 1;
		}
		else if (p1downKey) {
			downKeyPressTime += dt;
			this.myPlayer.Accelerating = -1;
		}
		else this.myPlayer.Accelerating = 0;

		if (p1spaceKey) {
			spaceKeyPressTime += dt;
			this.myPlayer.Shooting = true;
		}
		else this.myPlayer.Shooting = false;

		/** Update our player */
		this.myPlayer.Update(dt);

		/** Update our shots */
		for (var i in this.myPlayer.Shots)
		{
			var shot = this.myPlayer.Shots[i];
			shot.Update(dt);
			if (shot.Fadeout <= 0) this.myPlayer.Shots.splice(i, 1);
		}

		/** Update players */
		for (var i in this.Players)
		{
			var player = this.Players[i];

//			if (player.ID != this.myPlayer.ID)
			{
				player.Update(dt);
				for (var shot in player.shots)
					shot.Update(dt);
			}
		}

		/** Update asteroids */
		for (var i in this.Asteroids)
		{
			var asteroid = this.Asteroids[i];
			asteroid.Update(dt);
		}
	};

	var Draw = function () {
		/** clear backbuffer */
		that.backBufferContext2D.clearRect(0, 0, that.backBuffer.width, that.backBuffer.height);

		/** Draw shots */
		for (var i in that.Players)
		{
			var player = that.Players[i];

			for (var j in that.Players[i].Shots)
			{
				var shot = that.Players[i].Shots[j];
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
		for (var i in that.Players)
			that.Players[i].Draw();

		/** Draw our player */
		that.myPlayer.Draw();

		switch (that.GameState)
		{
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
				//for debugging
				if (that.myPlayer.Alive)				
					drawMessage("Alive");
				else
					drawMessage("Dead");
				drawHUD();
				break;
			break;
		}
		drawBackbuffer();
	};

	var drawHUD = function () {
		//health, allies, enemies, map, ping
		that.backBufferContext2D.fillStyle = "rgba(0,0,200, 0.4)";
		that.backBufferContext2D.fillRect (CANVASWIDTH / 2 - 150, CANVASHEIGHT - 50 , 30 * that.myPlayer.Lives, 40);
		that.backBufferContext2D.strokeStyle = "rgba(250,250,250, 1)";
		that.backBufferContext2D.strokeRect(CANVASWIDTH / 2 - 150, CANVASHEIGHT - 50 , 300, 40);
	};

	var drawBackbuffer = function () {
		that.context2D.clearRect(0, 0, that.canvas.width, that.canvas.height);
		that.context2D.drawImage(that.backBuffer, 0, 0);
	};

	var drawMessage = function (/** string */ text, /** string */ color, /** int */ posX, /** int */ posY) {
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
	var rightKeyPressTime = 0;
	var p1leftKey = false;
	var leftKeyPressTime = 0;
	var p1upKey = false;
	var upKeyPressTime = 0;
	var p1downKey = false;
	var downKeyPressTime = 0;
	var p1spaceKey = false;
	var spaceKeyPressTime = 0;

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

		if (evt.keyCode == 13)
		{
			if (!that.Connected)
				Connect();
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
