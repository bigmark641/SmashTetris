"use strict";

/* 
 * The GameEngine is intended to contain logic relating to the shell of
 * the game, such as: menus, configuration, keyboard, mouse, and browser
 * interfaces.
 * 
 * It initializes the game and passes all of the user's actions down to the
 * PlayerEngine, which takes care of the rest.
*/


function GameEngine() {
    var self = this; 


    //////////////////////////////
    // PRIVATE MEMBER CONSTANTS //
    //////////////////////////////

    window.DIFFICULTY_EASY = 0;
    window.DIFFICULTY_MEDIUM = 1;
    window.DIFFICULTY_HARD = 2;


    //////////////////////////////
    // PRIVATE MEMBER VARIABLES //
    //////////////////////////////

    var playerEngine;
    var isInMouseMode = false;


    //////////////////////
    // CONSTRUCTOR CODE //
    //////////////////////

    (function () {       
        
        //Override config constants
        overrideConfigConstants()
            .then(function () {

                //Initialize canvas context                    
                canvasContext = initializeAndGetCanvasContext();  

                attachMouseListeners();

                //Get difficulty from user
                // getDifficultyFromUser()
                //     .then(function (result) {
                        var difficulty = DIFFICULTY_MEDIUM;
                        var drawMinimap = difficulty <= DIFFICULTY_MEDIUM;
                        var drawPlayerOnMinimap = difficulty <= DIFFICULTY_EASY;

                        //Initialize game variables
                        isGameInProgress = true;
                        playerX = PLAYER_STARTING_X;
                        playerY = PLAYER_STARTING_Y;
                        playerA = PLAYER_STARTING_ANGLE_DEGREES * 2 * Math.PI / 360;
                        playerVerticalA = 0;

                        //Start engine
                        var raycastingEngine = new RaycastingEngine(drawMinimap, drawPlayerOnMinimap);
                        var tetrisEngine = new TetrisEngine();
                        playerEngine = new PlayerEngine(raycastingEngine, tetrisEngine);
                        
                        //Initialize controls
                        if (isInMouseMode)
                            setupControlsForMouseMode();
                        else
                            setupControlsForKeyboardMode();
                        
                    // });
            });
    })();


    /////////////////////
    // PRIVATE METHODS //
    /////////////////////

    function overrideConfigConstants() {
        var callback;
        var callbackCalled = false;
        
        //Notify parent window that we're ready to receive config values
        parent.postMessage("ready", "*");

        //Get config values if posted
        window.addEventListener('message', function(event) {
            if (event.data !== "ready") {
                //Override
                for (var key in event.data) {
                    if (event.data.hasOwnProperty(key)) {
                        window[key] = event.data[key];
                    }
                }
                callbackCalled = true;
                callback();
            }
        });

        //After a while, give up on config values and start the game anyways
        setTimeout(function() {
            if (!callbackCalled) {
                callbackCalled = true;
                callback();
            }
        }, CONFIG_VALUE_WAIT_TIME_MILLISECONDS);  

        //Return promise
        return {then: function (promiseCallback) {
            callback = promiseCallback;
        }};
    }        

    function getDifficultyFromUser() {
        var callback;
        var selectedDifficulty = DIFFICULTY_EASY;
        
        //Draw prompt 
        drawDifficultyPrompt(selectedDifficulty);

        //Handle user selection
        document.onkeydown = function (keyboardEvent) {
            switch (keyboardEvent.keyCode) {
                case 38: //Up arrow
                case 87: //W
                    selectedDifficulty--;
                    if (selectedDifficulty < DIFFICULTY_EASY)
                        selectedDifficulty += 1 + DIFFICULTY_HARD - DIFFICULTY_EASY;
                    drawDifficultyPrompt(selectedDifficulty);
                    break;
                case 40: //Down arrow
                case 83: //S
                    selectedDifficulty++;
                    if (selectedDifficulty > DIFFICULTY_HARD)
                        selectedDifficulty-= 1 + DIFFICULTY_HARD - DIFFICULTY_EASY;
                    drawDifficultyPrompt(selectedDifficulty);
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
    }  

    function drawDifficultyPrompt(selectedDifficulty) {
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

    function attachMouseListeners(){
        var canvasElement = document.getElementById("canvas");
        canvasElement.onclick = function () {
        
            //Lock pointer and enter mouse mode
            if ('pointerLockElement' in document || 'mozPointerLockElement' in document || 'webkitPointerLockElement' in document) {
                canvasElement.requestPointerLock = canvasElement.requestPointerLock ||
                    canvasElement.mozRequestPointerLock ||
                    canvasElement.webkitRequestPointerLock;
                canvasElement.requestPointerLock();
                isInMouseMode = true;
                if (isGameInProgress)
                    setupControlsForMouseMode();

                //Allow unlocking out of mouse mode
                document.onpointerlockchange = function (e) {
                    if (document.pointerLockElement !== canvasElement
                            && document.mozPointerLockElement !== canvasElement
                            && document.webkitPointerLockElement !== canvasElement) {
                        isInMouseMode = false;
                        if (isGameInProgress)
                            setupControlsForKeyboardMode();
                    }
                }
                document.onmozpointerlockchange = document.onpointerlockchange;
                document.onwebkitpointerlockchange = document.onpointerlockchange;
            }
        }
    }

    function attachKeyboardListeners(isMouseMode) {

        //Key down
        document.onkeydown = function (keyboardEvent) {
            if (isGameInProgress) {
                switch (keyboardEvent.keyCode) {
                    // case 87: //W
                    //     playerEngine.tryStartMovingForward();
                    //     break;
                    // case 83: //S
                    //     playerEngine.tryStartMovingBackwards();
                    //     break;
                    // case 65: //A
                    //     if (isMouseMode)
                    //         playerEngine.tryStartSidesteppingLeft();
                    //     else
                    //         playerEngine.tryStartTurningLeft();
                    //     break;
                    // case 68: //D                                
                    //     if (isMouseMode)
                    //         playerEngine.tryStartSidesteppingRight();
                    //     else
                    //         playerEngine.tryStartTurningRight();
                    //     break;
                    // case 81: //Q
                    //     if (!isMouseMode)
                    //         playerEngine.tryStartSidesteppingLeft();
                    //     break;
                    // case 69: //E
                    //     if (!isMouseMode)
                    //         playerEngine.tryStartSidesteppingRight();
                    //     break;
                    // case 37: //Right arrow
                    //         if (!isMouseMode) {
                    //             playerEngine.tryMovePieceRight();
                    //         }
                    //     break;
                    // case 38: //Up arrow
                    //     if (!isMouseMode) {
                    //         playerEngine.tryRotatePieceClockwise();
                    //     }
                    //     break;
                    // case 39: //Left arrow
                    //     if (!isMouseMode) {
                    //         playerEngine.tryMovePieceLeft();
                    //     }
                    //     break;
                    // case 40: //Down arrow
                    //     if (!isMouseMode)
                    //         playerEngine.startDroppingPiece();
                    //     break;
                    // case 32: //Space
                    //     if (isMouseMode)
                    //         playerEngine.startDroppingPiece();
                case 37: //Right arrow
                    playerEngine.movePieceRight();
                    break;
                case 38: //Up arrow
                    playerEngine.rotatePieceClockwise();
                    break;
                case 39: //Left arrow
                    playerEngine.movePieceLeft();
                    break;
                case 40: //Down arrow
                    playerEngine.startDroppingPiece();
                    break;
                }
            }
        }

        //Key up
        document.onkeyup = function (keyboardEvent) {                    
            if (isGameInProgress) {
                switch (keyboardEvent.keyCode) {
                    // case 87: //W
                    //     playerEngine.tryStopMovingForward();
                    //     break;
                    // case 83: //S
                    //     playerEngine.tryStopMovingBackwards();
                    //     break;
                    // case 65: //A
                    //     if (isMouseMode)
                    //         playerEngine.tryStopSidesteppingLeft();
                    //     else
                    //         playerEngine.tryStopTurningLeft();
                    //     break;
                    // case 68: //D
                    //     if (isMouseMode)
                    //         playerEngine.tryStopSidesteppingRight();
                    //     else
                    //         playerEngine.tryStopTurningRight();
                    //     break;
                    // case 81: //Q
                    //     if (!isMouseMode)
                    //         playerEngine.tryStopSidesteppingLeft();
                    //     break;
                    // case 69: //E
                    //     if (!isMouseMode)
                    //         playerEngine.tryStopSidesteppingRight();
                    //     break;
                    case 40: //Down arrow
                        playerEngine.stopDroppingPiece();
                    //     break;
                    // case 32: //Space
                    //     if (isMouseMode)
                    //         playerEngine.stopDroppingPiece();
                }
            }                    
        }
    }

    function setupControlsForMouseMode() {

        //Bind keyboard controls for mouse mode
        attachKeyboardListeners(true);

        //Mouse look
        document.onmousemove = function (e) {
            if (isGameInProgress) {                    
                playerEngine.tryTurnLeft(MOUSE_SENSITIVITY * -e.movementX);
                playerEngine.tryLookUp(MOUSE_SENSITIVITY * -e.movementY);
            }
        };  

        //Mouse click
        document.onmousedown = function (e) {
            if (isGameInProgress) {
                switch (e.button) {
                    case 0: //Left click
                        if(e.ctrlKey)
                            playerEngine.tryRotatePieceCounterClockwise();
                        else
                            playerEngine.tryPullPiece();                            
                        break;
                    case 1: //Middle button
                        playerEngine.startDroppingPiece();
                        break;
                    case 2: //Right click
                        if(e.ctrlKey)
                            playerEngine.tryRotatePieceClockwise();
                        else
                            playerEngine.tryPushPiece();
                        break;
                }  
            }
        }

        //Mouse unclick
        document.onmouseup = function (e) {
            playerEngine.stopDroppingPiece();
        };

        //Disable browser context menu
        document.oncontextmenu = function (e) {
            e.preventDefault();
        };
    };

    function setupControlsForKeyboardMode() {

        //Bind keyboard for keyboard mode
        attachKeyboardListeners(false);
        
        //Unbind mouse listeners
        document.onmousemove = null;
        document.onmousedown = null;
        document.onmouseup = null;
        document.oncontextmenu = null;
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