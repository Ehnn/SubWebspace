MAX_SEND_DELAY = 3000;
MIN_SEND_DELAY = 200;

var game;

var explosionsound = new Audio();
var lasersound = new Audio();
var evillasersound = new Audio();
var laserimage1 = new Image();
var laserimage2 = new Image();
var astimg = new Image();

var lastSendData;

jQuery(function () {
	/** load images and sound */
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
		            obj : astimg }
	}

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
	    
	    if (flag && !game)
	    {
		game = new Game();
		game.Init();
		game.Start();

		lastSendData = new Date().getTime();
		jQuery(document).keydown(game.onKeyDown);
		jQuery(document).keyup(game.onKeyUp);

		setInterval(periodicSendData, MAX_SEND_DELAY);
	    }
	};

	var periodicSendData = function () {
		var now = new Date().getTime();
		if (now - lastSendData > MAX_SEND_DELAY)
			sendData();
	};

	var sendData = function () {
		var now = new Date().getTime();
		if (now - lastSendData > MIN_SEND_DELAY)
		{
			socket.emit('playerinput', game.goodPlayer.GetSendData());
			lastSendData = new Date().getTime();
		}
	};

	var loadAllResources = function () {
	    for (var item in loadables)
		loadResource(item);
	};

    //var socket = io.connect('http://spacegame-adamzeira.dotcloud.com:8080');
    //var socket = io.connect('http://growing-autumn-5999.herokuapp.com:8090');
//    var socket = io.connect('http://spacegame.chickenkiller.com');
    var socket = io.connect('http://localhost:8080');
    socket.emit('createplayer', {});
    var debug = jQuery("<div />").css("position", "absolute").css("top", "100px").css("left", "1100px").appendTo(document.body);
    socket.on('playerdata', function (data) {
        debug.append(jQuery("<div />").text("input received:" + data));
        //game.PlayerData = data;
    });
    /*socket.on('playercreated', function (id) {
        alert(id);
        game.myplayerguid = id;
    });*/
    
    if (!socket) {
        //change to retry later
        alert('unable to connect to server');
        return;
    }
    
    loadAllResources();
});
