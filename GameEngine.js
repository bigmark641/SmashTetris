"use strict";


function GameEngine() {
    var self = this; 


    //-- PRIVATE MEMBER VARIABLES --//

    var playerEngine;
    var isMouseMode = false;


    //-- CONSTRUCTOR CODE --//

    (function () {        
        overrideConfigConstants()
            .then(function () {

                //Initialize canvas context                    
                canvasContext = initializeAndGetCanvasContext();  

                attachMouseListeners();

                //Get difficulty
                getDifficulty()
                    .then(function (result) {
                        var difficulty = result;
                        var drawMinimap = difficulty <= DIFFICULTY_MEDIUM;
                        var drawPlayerOnMinimap = difficulty <= DIFFICULTY_EASY;

                        //Set initial position
                        playerX = PLAYER_STARTING_X;
                        playerY = PLAYER_STARTING_Y;
                        playerA = PLAYER_STARTING_ANGLE_DEGREES * 2 * Math.PI / 360;

                        //Start engine
                        var raycastingEngine = new RaycastingEngine(drawMinimap, drawPlayerOnMinimap);
                        var tetrisEngine = new TetrisEngine();
                        playerEngine = new PlayerEngine(raycastingEngine, tetrisEngine);
                        
                        //Initialize controls
                        if (isMouseMode)
                            playerEngine.setupControlsForMouseMode();
                        else
                            playerEngine.setupControlsForKeyboardMode();
                    });
            });
    })();


    //-- PRIVATE FUNCTIONALITY --//

    function overrideConfigConstants() {
        var callback;
        
        //Notify parent window that we're ready to receive config values
        parent.postMessage("ready", "*");

        //Get config values if posted
        window.addEventListener('message', function(event) {
            if (event.data !== "ready") {
                isGameInProgress = true;
                //Override
                for (var key in event.data) {
                    if (event.data.hasOwnProperty(key)) {
                        window[key] = event.data[key];
                    }
                }
                callback();
            }
        });

        //After a while, give up on config values and start the game anyways
        setTimeout(function() {
            if (!isGameInProgress) {
                isGameInProgress = true;
                callback();
            }
        }, CONFIG_VALUE_WAIT_TIME_MILLISECONDS);  

        //Return promise
        return {then: function (promiseCallback) {
            callback = promiseCallback;
        }};
    }        

    function getDifficulty() {
        var callback;
        var selectedDifficulty = DIFFICULTY_EASY;
        
        //Draw prompt 
        drawDifficultyPrompt();

        //Handle user selection
        document.onkeydown = function (keyboardEvent) {
            switch (keyboardEvent.keyCode) {
                case 38: //Up arrow
                case 87: //W
                    selectedDifficulty--;
                    if (selectedDifficulty < DIFFICULTY_EASY)
                        selectedDifficulty += 1 + DIFFICULTY_HARD - DIFFICULTY_EASY;
                    drawDifficultyPrompt();
                    break;
                case 40: //Down arrow
                case 83: //S
                    selectedDifficulty++;
                    if (selectedDifficulty > DIFFICULTY_HARD)
                        selectedDifficulty-= 1 + DIFFICULTY_HARD - DIFFICULTY_EASY;
                    drawDifficultyPrompt();
                    break;
                case 13: //Enter
                    callback(selectedDifficulty);
                    break;
            }
        }

        //Return promise
        return {then: function (promiseCallback) {
            callback = promiseCallback;
        }};         

        function drawDifficultyPrompt() {
            var selectionHeight = 120;

            //Clear
            canvasContext.clearRect(0, 0, canvas.width, canvas.height);

            //Draw text
            canvasContext.fillStyle = "black";
            canvasContext.font = "bold 64px Arial";
            canvasContext.fillText("Choose difficulty:", (VIEWPORT_WIDTH_PIXELS / 2) - 300, (VIEWPORT_HEIGHT_PIXELS / 2) -230);
            canvasContext.fillText("Easy", (VIEWPORT_WIDTH_PIXELS / 2) - 150, (VIEWPORT_HEIGHT_PIXELS / 2) - 60 + DIFFICULTY_EASY * selectionHeight);
            canvasContext.fillText("Medium", (VIEWPORT_WIDTH_PIXELS / 2) - 150, (VIEWPORT_HEIGHT_PIXELS / 2) - 60 + DIFFICULTY_MEDIUM * selectionHeight);
            canvasContext.fillText("Hard", (VIEWPORT_WIDTH_PIXELS / 2) - 150, (VIEWPORT_HEIGHT_PIXELS / 2) - 60 + DIFFICULTY_HARD * selectionHeight);

            //Draw selection
            canvasContext.fillStyle = WALL_COLORS[WALL_TYPE_PIECE_ACTIVE - 1];
            canvasContext.fillRect((VIEWPORT_WIDTH_PIXELS / 2) - 173, (VIEWPORT_HEIGHT_PIXELS / 2) -135 + selectedDifficulty * selectionHeight, 60, 20);
            canvasContext.fillRect((VIEWPORT_WIDTH_PIXELS / 2) - 173, (VIEWPORT_HEIGHT_PIXELS / 2) -115 + selectedDifficulty * selectionHeight, 20, 20);
            canvasContext.fillRect((VIEWPORT_WIDTH_PIXELS / 2) - 173, (VIEWPORT_HEIGHT_PIXELS / 2) -50 + selectedDifficulty * selectionHeight, 60, 20);
            canvasContext.fillRect((VIEWPORT_WIDTH_PIXELS / 2) - 173, (VIEWPORT_HEIGHT_PIXELS / 2) -70 + selectedDifficulty * selectionHeight, 20, 20);
            canvasContext.fillRect((VIEWPORT_WIDTH_PIXELS / 2) + 57, (VIEWPORT_HEIGHT_PIXELS / 2) -135 + selectedDifficulty * selectionHeight, 60, 20);
            canvasContext.fillRect((VIEWPORT_WIDTH_PIXELS / 2) + 97, (VIEWPORT_HEIGHT_PIXELS / 2) -115 + selectedDifficulty * selectionHeight, 20, 20);
            canvasContext.fillRect((VIEWPORT_WIDTH_PIXELS / 2) + 57, (VIEWPORT_HEIGHT_PIXELS / 2) -50 + selectedDifficulty * selectionHeight, 60, 20);
            canvasContext.fillRect((VIEWPORT_WIDTH_PIXELS / 2) + 97, (VIEWPORT_HEIGHT_PIXELS / 2) -70 + selectedDifficulty * selectionHeight, 20, 20);
            canvasContext.stroke();
        }
    }

    function attachMouseListeners(){
        var canvasElement = document.getElementById("canvas");
        canvasElement.onclick = function () {
        
            //Lock pointer and enter mouse mode
            if ('pointerLockElement' in document || 'mozPointerLockElement' in document || 'webkitPointerLockElement' in document) {
                canvasElement.requestPointerLock = canvasElement.requestPointerLock ||
                    canvasElement.mozRequestPointerLock ||
                    canvasElement.webkitRequestPointerLock;
                canvasElement.requestPointerLock();

                isMouseMode = true;
                if (isGameInProgress)
                    playerEngine.setupControlsForMouseMode();

                //Allow unlocking out of mouse mode
                document.onpointerlockchange = function (e) {
                    if (document.pointerLockElement !== canvasElement
                            && document.mozPointerLockElement !== canvasElement
                            && document.webkitPointerLockElement !== canvasElement) {
                        isMouseMode = false;
                        playerEngine.setupControlsForKeyboardMode();
                    }
                }
                document.onmozpointerlockchange = document.onpointerlockchange;
                document.onwebkitpointerlockchange = document.onpointerlockchange;
            }
        }
    }
        
    function initializeAndGetCanvasContext() {
        var canvas = document.getElementById("canvas");
        canvas.setAttribute("width", VIEWPORT_WIDTH_PIXELS);
        canvas.setAttribute("height", VIEWPORT_HEIGHT_PIXELS);
        var context = canvas.getContext("2d");
        context.lineWidth = COLUMN_WIDTH_PIXELS;
        return context;
    }
}