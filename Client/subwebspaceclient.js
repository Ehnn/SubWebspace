/** GAME */
FRAMES_PER_SECOND = 30;
SECONDS_BETWEEN_FRAMES = 1000 / FRAMES_PER_SECOND;

CANVASWIDTH = 1024;
CANVASHEIGHT = 768;
CANVAS_BORDER_SPACE = 20;

ASTEROID_CREATION_TIME = 7;
MAX_ASTEROIDS_NUM = 10;

/** PLAYER */
PLAYER_SPEED = 6;
PLAYER_ROTATION_SPEED = 420;
PLAYER_ACCELERATION_SPEED = 8;
PLAYER_ACCELERATION_CAP = 20;
PLAYER_RELOAD_TIME = 0.25;


/** LASER */
LASERSPEED = 20;
LASER_FADEOUT = 2;
LASER_FADEOUT_POINT = 0.5;

/** ASTEROID */
ASTEROID_SIZE_MULTIPLIER = 0.5;


var game;

var explosionsound = new Audio();
var lasersound = new Audio();
var evillasersound = new Audio();
var laserimage1 = new Image();
var laserimage2 = new Image();
var astimg = new Image();

var loadables = {"sndExplode" : {
                    loaded : false,
                    type : "sound",
                    src : "explosion.ogg",
                    obj : explosionsound },//"explosionsound" },
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
    
        jQuery(document).keydown(game.onKeyDown);
        jQuery(document).keyup(game.onKeyUp);
    }
};

var loadAllResources = function () {
    for (var item in loadables)
        loadResource(item);
};

var loadAllResources = function () {
    for (var item in loadables)
        loadResource(item);
};

jQuery(function () {
    //var socket = io.connect('http://spacegame-adamzeira.dotcloud.com:8080');
    //var socket = io.connect('http://growing-autumn-5999.herokuapp.com:8090');
    var socket = io.connect('http://spacegame.chickenkiller.com');
    //var socket = io.connect('http://localhost:8080');
    socket.emit('createplayer', {});
    socket.on('playerdata', function (data) {
        game.PlayerData = data;
    });
    socket.on('playercreated', function (id) {
        alert(id);
        game.myplayerguid = id;
    });
    
    if (!socket) {
        //change to retry later
        alert('unable to connect to server');
        return;
    }
    
    loadAllResources();
});