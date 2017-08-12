"use strict";


function PlayerEngine(raycastingEngine, tetrisEngine) {
    var self = this;  


    //////////////////////////////
    // PRIVATE MEMBER CONSTANTS //
    //////////////////////////////  

    var TICK_DELAY = 1000 / MAX_FRAMERATE;
    

    //////////////////////////////
    // PRIVATE MEMBER VARIABLES //
    //////////////////////////////
    
    var isMovingForward = false;
    var isMovingBackward = false;
    var isSidesteppingLeft = false;
    var isSidesteppingRight = false;
    var isTurningLeft = false;
    var isTurningRight = false;
    var isDropping = false;
    var velocityX = 0;
    var velocityY = 0;


    //////////////////////////
    // PUBLIC FUNCTIONALITY //            
    //////////////////////////

    self.turnLeft = function (radians) {
        playerA += radians;
        normalizePlayerA();
    };

    self.setupControlsForKeyboardMode = function () {

        //Bind keyboard for keyboard mode
        attachKeyboardListeners(false);
        
        //Unbind mouse listeners
        document.onmousemove = null;
        document.onmousedown = null;
        document.onmouseup = null;
        document.oncontextmenu = null;
    };

    self.setupControlsForMouseMode = function () {

        //Bind keyboard controls for mouse mode
        attachKeyboardListeners(true);

        //Mouse look
        document.onmousemove = function (e) {
            if (isGameInProgress) {                    
                self.turnLeft(MOUSE_SENSITIVITY * -e.movementX);
            }
        };  

        //Mouse click
        document.onmousedown = function (e) {
            if (isGameInProgress) {
                if (raycastingEngine.getWallType(playerA) === WALL_TYPE_PIECE_ACTIVE){
                    switch (e.button) {
                        case 0: //Left click
                            if(e.ctrlKey){ //Holding ctrl
                                tetrisEngine.rotate(1);
                                pushPlayerToClosestAdjacentIfNecessary();
                            }
                            else{
                                if (raycastingEngine.getWallType(playerA) === WALL_TYPE_PIECE_ACTIVE) {
                                    if (isFacingRight()) {
                                        tetrisEngine.moveLeft();
                                        pushPlayerRightIfNecessary();
                                    }
                                    else {
                                        tetrisEngine.moveRight();
                                        pushPlayerLeftIfNecessary();
                                    }
                                }
                            }
                            
                            break;
                        case 1: //Middle button
                            isDropping = true;
                            break;
                        case 2: //Right click
                            if(e.ctrlKey){ //Holding ctrl
                                tetrisEngine.rotate(-1);
                                pushPlayerToClosestAdjacentIfNecessary();
                            }
                            else{
                                if (raycastingEngine.getWallType(playerA) === WALL_TYPE_PIECE_ACTIVE) {
                                    if (isFacingRight()) {
                                        tetrisEngine.moveRight();
                                        pushPlayerRightIfNecessary();
                                    }
                                    else {
                                        tetrisEngine.moveLeft();
                                        pushPlayerLeftIfNecessary();
                                    }
                                }
                            }
                            break;
                    }                            
                }
            }
        };

        //Mouse unclick
        document.onmouseup = function (e) {
            isDropping = false;
        };

        //Disable browser context menu
        document.oncontextmenu = function (e) {
            e.preventDefault();
        };
    };
    

    //////////////////////
    // CONSTRUCTOR CODE //
    //////////////////////
    
    (function () {
        tetrisEngine.pieceMovedDownCallback = pushPlayerDownIfNecessary;
        tetrisEngine.playerLostCallback = playerLostTetris;
        raycastingEngine.worldDrawnCallback = drawPlayerOverlay; 
        attachGamepadListeners();
        executeAndScheduleTick(new Date().valueOf());
    })();


    /////////////////////
    // PRIVATE METHODS //
    /////////////////////
    
    function executeAndScheduleTick(lastTickTime) {
        if (isGameInProgress) {

            //Schedule next tick
            var currentTickTime = new Date().valueOf();
            setTimeout(function () {
                executeAndScheduleTick(currentTickTime); 
            }, TICK_DELAY);
            var elapsedTime = currentTickTime - lastTickTime;

            //Do player actions
            dropPieceIfNecessary();
            movePlayer(elapsedTime);
        }
    }

    function dropPieceIfNecessary() {
        if (isDropping && raycastingEngine.getWallType(playerA) === WALL_TYPE_PIECE_ACTIVE)
            tetrisEngine.drop();
        else
            tetrisEngine.cancelDrop();
    }

    function movePlayer(elapsedTime) {

        //Turning
        if (isTurningLeft)
            playerA += KEYBOARD_TURNING_SPEED * elapsedTime;
        if (isTurningRight)
            playerA -= KEYBOARD_TURNING_SPEED * elapsedTime;
        normalizePlayerA();

        //Decelerate
        var ratioToDecelerate = 1 - PLAYER_ACCELERATION / Math.sqrt(velocityX * velocityX + velocityY * velocityY);
        if (ratioToDecelerate > 0) {
            velocityX *= ratioToDecelerate;
            velocityY *= ratioToDecelerate;
        }
        else {
            velocityX = 0;
            velocityY = 0;
        }

        //Accelerating
        if (isMovingForward) {
            velocityY += 2 * PLAYER_ACCELERATION * Math.sin(playerA);
            velocityX += 2 * PLAYER_ACCELERATION * Math.cos(playerA);
        }
        if (isMovingBackward) {
            velocityY -= 2 * PLAYER_ACCELERATION * Math.sin(playerA);
            velocityX -= 2 * PLAYER_ACCELERATION * Math.cos(playerA);
        }
        if (isSidesteppingLeft) {
            velocityY += 2 * PLAYER_ACCELERATION * Math.sin(playerA + Math.PI / 2);
            velocityX += 2 * PLAYER_ACCELERATION * Math.cos(playerA + Math.PI / 2);
        }
        if (isSidesteppingRight) {
            velocityY -= 2 * PLAYER_ACCELERATION * Math.sin(playerA + Math.PI / 2);
            velocityX -= 2 * PLAYER_ACCELERATION * Math.cos(playerA + Math.PI / 2);
        }
        
        //Calculate speed (with capping)
        var movementV = Math.sqrt(velocityX * velocityX + velocityY * velocityY);
        if (movementV > PLAYER_WALKING_SPEED) {
            var ratioToCapSpeed = PLAYER_WALKING_SPEED / movementV;
            velocityX *= ratioToCapSpeed;
            velocityY *= ratioToCapSpeed;
            movementV = Math.sqrt(velocityX * velocityX + velocityY * velocityY);
        }

        //Calculate angle
        if (velocityX === 0 && velocityY >= 0)
            var movementA = Math.PI / 2;
        else if (velocityX === 0 && velocityY < 0)
            var movementA = 3 * Math.PI / 2;
        else if (velocityX >= 0)
            var movementA = Math.atan(velocityY / velocityX);
        else
            var movementA = Math.atan(velocityY / velocityX) + Math.PI;
            
        //Move
        tryMove(movementA, movementV * elapsedTime);
    }

    function tryMove(angle, walkDistance) {

        //Get distances
        var distX = Math.cos(angle) * walkDistance;
        var distY = Math.sin(angle) * walkDistance;

        //Get hits
        var hitX = raycastingEngine.getFirstHitForDirection(angle, false);
        var hitY = raycastingEngine.getFirstHitForDirection(angle, true);

        //Try move straight
        if (hitX.dist > walkDistance && hitY.dist > walkDistance) {
            playerX += distX;
            playerY += distY;
        }
        //Try move along wall
        else if (hitX.dist < hitY.dist) {
            if (distY > 0)
                tryMove(Math.PI / 2, distY);
            else if (distY < 0)
                tryMove(3 * Math.PI / 2, -distY);
        }
        else if (hitX.dist > hitY.dist) {
            if (distX > 0)
                tryMove(0, distX);
            else if (distX < 0)
                tryMove(Math.PI, -distX);
        }
    }

    function pushPlayerDownIfNecessary() {                    
        if (Math.floor(playerX) !== playerX) {
            if (       world[Math.floor(playerY)][Math.floor(playerX)] === WALL_TYPE_PIECE_ACTIVE
                    || world[Math.floor(playerY - PLAYER_PUSHED_BUFFER)][Math.floor(playerX)] === WALL_TYPE_PIECE_ACTIVE)
                playerY = Math.floor(playerY - PLAYER_PUSHED_BUFFER) - PLAYER_PUSHED_BUFFER;
        }
        else if (Math.floor(playerX) === playerX) {
            if (       world[Math.floor(playerY)][Math.floor(playerX)] === WALL_TYPE_PIECE_ACTIVE
                    || world[Math.floor(playerY)][Math.floor(playerX) - 1] === WALL_TYPE_PIECE_ACTIVE
                    || world[Math.floor(playerY - PLAYER_PUSHED_BUFFER)][Math.floor(playerX)] === WALL_TYPE_PIECE_ACTIVE
                    || world[Math.floor(playerY - PLAYER_PUSHED_BUFFER)][Math.floor(playerX) - 1] === WALL_TYPE_PIECE_ACTIVE)
                playerY = Math.floor(playerY - PLAYER_PUSHED_BUFFER) - PLAYER_PUSHED_BUFFER;
        }
        handleSmashIfNecessary();
    }

    function pushPlayerLeftIfNecessary() {                    
        if (Math.floor(playerY) !== playerY) {
            if (       world[Math.floor(playerY)][Math.floor(playerX)] === WALL_TYPE_PIECE_ACTIVE
                    || world[Math.floor(playerY)][Math.floor(playerX - PLAYER_PUSHED_BUFFER)] === WALL_TYPE_PIECE_ACTIVE)
                playerX = Math.floor(playerX - PLAYER_PUSHED_BUFFER) - PLAYER_PUSHED_BUFFER;
        }
        else if (Math.floor(playerY) === playerY) {
            if (       world[Math.floor(playerY)][Math.floor(playerX)] === WALL_TYPE_PIECE_ACTIVE
                    || world[Math.floor(playerY) - 1][Math.floor(playerX)] === WALL_TYPE_PIECE_ACTIVE
                    || world[Math.floor(playerY)][Math.floor(playerX - PLAYER_PUSHED_BUFFER)] === WALL_TYPE_PIECE_ACTIVE
                    || world[Math.floor(playerY) - 1][Math.floor(playerX - PLAYER_PUSHED_BUFFER)] === WALL_TYPE_PIECE_ACTIVE)
                playerX = Math.floor(playerX - PLAYER_PUSHED_BUFFER) - PLAYER_PUSHED_BUFFER;
        }
        handleSmashIfNecessary();
    }

    function pushPlayerRightIfNecessary() {             
        if (Math.floor(playerY) !== playerY) {
            if (       world[Math.floor(playerY)][Math.floor(playerX)] === WALL_TYPE_PIECE_ACTIVE
                    || world[Math.floor(playerY)][Math.floor(playerX - PLAYER_PUSHED_BUFFER)] === WALL_TYPE_PIECE_ACTIVE)
                playerX = Math.ceil(playerX + PLAYER_PUSHED_BUFFER) + PLAYER_PUSHED_BUFFER;
        }
        else if (Math.floor(playerY) === playerY) {
            if (       world[Math.floor(playerY)][Math.floor(playerX)] === WALL_TYPE_PIECE_ACTIVE
                    || world[Math.floor(playerY) - 1][Math.floor(playerX)] === WALL_TYPE_PIECE_ACTIVE
                    || world[Math.floor(playerY)][Math.floor(playerX - PLAYER_PUSHED_BUFFER)] === WALL_TYPE_PIECE_ACTIVE
                    || world[Math.floor(playerY) - 1][Math.floor(playerX - PLAYER_PUSHED_BUFFER)] === WALL_TYPE_PIECE_ACTIVE)
                playerX = Math.ceil(playerX + PLAYER_PUSHED_BUFFER) + PLAYER_PUSHED_BUFFER;
        }
        handleSmashIfNecessary();
    }

    function pushPlayerToClosestAdjacentIfNecessary() {
        if (world[Math.floor(playerY)][Math.floor(playerX)] === WALL_TYPE_PIECE_ACTIVE) {
            var pushOptions = [];

            //Add side directions
            var pushOption = new PushOption(Math.floor(playerX) + 1 + PLAYER_PUSHED_BUFFER, playerY);
            if (pushOption.wallType === WALL_TYPE_NONE)
                pushOptions[pushOptions.length] = pushOption;
            pushOption = new PushOption(Math.floor(playerX) - 1 - PLAYER_PUSHED_BUFFER, playerY);
            if (pushOption.wallType === WALL_TYPE_NONE)
                pushOptions[pushOptions.length] = pushOption;
            pushOption = new PushOption(playerX, Math.floor(playerY) + 1 + PLAYER_PUSHED_BUFFER);
            if (pushOption.wallType === WALL_TYPE_NONE)
                pushOptions[pushOptions.length] = pushOption;
            pushOption = new PushOption(playerX, Math.floor(playerY) - 1 - PLAYER_PUSHED_BUFFER);
            if (pushOption.wallType === WALL_TYPE_NONE)
                pushOptions[pushOptions.length] = pushOption;

            //Add diagonal directions
            pushOption = new PushOption(Math.floor(playerX) + 1 + PLAYER_PUSHED_BUFFER, Math.floor(playerY) + 1 + PLAYER_PUSHED_BUFFER);
            if (pushOption.wallType === WALL_TYPE_NONE)
                pushOptions[pushOptions.length] = pushOption;
            pushOption = new PushOption(Math.floor(playerX) + 1 + PLAYER_PUSHED_BUFFER, Math.floor(playerY) - 1 - PLAYER_PUSHED_BUFFER);
            if (pushOption.wallType === WALL_TYPE_NONE)
                pushOptions[pushOptions.length] = pushOption;
            pushOption = new PushOption(Math.floor(playerX) - 1 - PLAYER_PUSHED_BUFFER, Math.floor(playerY) + 1 + PLAYER_PUSHED_BUFFER);
            if (pushOption.wallType === WALL_TYPE_NONE)
                pushOptions[pushOptions.length] = pushOption;
            pushOption = new PushOption(Math.floor(playerX) - 1 - PLAYER_PUSHED_BUFFER, Math.floor(playerY) - 1 - PLAYER_PUSHED_BUFFER);
            if (pushOption.wallType === WALL_TYPE_NONE)
                pushOptions[pushOptions.length] = pushOption;

            //Sort
            pushOptions.sort(function (a, b) { return a.getDistanceToPlayer() - b.getDistanceToPlayer(); } );

            //Move player
            if (pushOptions.length > 0) {
                playerX = pushOptions[0].x;
                playerY = pushOptions[0].y;
            }
        }

        function PushOption(x, y) {

            //Set coordinates
            this.x = x;                    
            this.y = y;

            //Ensure bounds
            if (this.x < 0)
                this.x = PLAYER_PUSHED_BUFFER;
            if (this.x >= world[0].length)
                this.x = world[0].length - PLAYER_PUSHED_BUFFER;
            if (this.y < 0)
                this.y = PLAYER_PUSHED_BUFFER;
            if (this.y >= world.length)
                this.y = world.length - PLAYER_PUSHED_BUFFER;

            this.wallType = world[Math.floor(this.y)][Math.floor(this.x)];
            this.getDistanceToPlayer = function () { return Math.sqrt(Math.pow(this.x - x, 2) + Math.pow(this.y - y, 2)); };
        }
    }

    function handleSmashIfNecessary() {

        //Is player smashed?
        var isSmashed;
        var playerXFloor = Math.floor(playerX);
        var playerYFloor = Math.floor(playerY);
        if (playerXFloor !== playerX) {
            if (playerYFloor !== playerY) {
                isSmashed = world[playerYFloor][playerXFloor] !== WALL_TYPE_NONE;
            }
            else if (playerYFloor === playerY) {
                isSmashed = world[playerYFloor][playerXFloor] !== WALL_TYPE_NONE
                    && world[playerYFloor - 1][playerXFloor] !== WALL_TYPE_NONE;
            }
        }
        else if (playerXFloor === playerX) {
            if (playerYFloor !== playerY) {
                isSmashed = world[playerYFloor][playerXFloor] !== WALL_TYPE_NONE
                    && world[playerYFloor][playerXFloor - 1] !== WALL_TYPE_NONE;
            }
            else if (playerYFloor === playerY) {
                isSmashed = world[playerYFloor][playerXFloor] !== WALL_TYPE_NONE
                    && world[playerYFloor][playerXFloor - 1] !== WALL_TYPE_NONE
                    && world[playerYFloor - 1][playerXFloor] !== WALL_TYPE_NONE
                    && world[playerYFloor - 1][playerXFloor - 1] !== WALL_TYPE_NONE;
            }
        }

        //Handle smash
        if (isSmashed) {
            playerLostTetris();
        }
    }

    function playerLostTetris() {
        isGameInProgress = false;            
    }

    function drawPlayerOverlay() {

        //Draw crosshairs
        raycastingEngine.drawLine(VIEWPORT_WIDTH_PIXELS / 2, VIEWPORT_HEIGHT_PIXELS / 2 - VIEWPORT_CROSSHAIR_SIZE_PIXELS / 2, VIEWPORT_WIDTH_PIXELS / 2, VIEWPORT_HEIGHT_PIXELS / 2 + VIEWPORT_CROSSHAIR_SIZE_PIXELS / 2, VIEWPORT_CROSSHAIR_COLOR);
        raycastingEngine.drawLine(VIEWPORT_WIDTH_PIXELS / 2 - VIEWPORT_CROSSHAIR_SIZE_PIXELS / 2, VIEWPORT_HEIGHT_PIXELS / 2, VIEWPORT_WIDTH_PIXELS / 2 + VIEWPORT_CROSSHAIR_SIZE_PIXELS / 2, VIEWPORT_HEIGHT_PIXELS / 2, VIEWPORT_CROSSHAIR_COLOR);
        
        //Draw next piece
        var nextPiece = tetrisEngine.getNextPiece();
        for (var row = 0; row < nextPiece.length; row++) {
            for (var col = 0; col < nextPiece[0].length; col++) {
                if (nextPiece[row][col] !== 0) {
                    var color = WALL_COLORS[nextPiece[row][col] - 1];
                    var heightOffset = nextPiece.length === 1 ? 20 : 10;
                    canvasContext.fillStyle = color;
                    canvasContext.fillRect(VIEWPORT_WIDTH_PIXELS + col * 20 - 100, heightOffset + row * 20, 20, 20);
                    canvasContext.stroke();
                }
            }
        }
        canvasContext.fillStyle = "black";
        canvasContext.font = "bold 32px Arial";
        canvasContext.fillText("Next: ", VIEWPORT_WIDTH_PIXELS - 200, 40);
        
        //Draw lines and score
        canvasContext.fillText("Lines: " + tetrisEngine.getNumberOfLines(), (VIEWPORT_WIDTH_PIXELS / 2) - 70, 40);
        canvasContext.fillText("Score: " + tetrisEngine.getScore(), 50, 40);

        //Draw game over screen
        if (!isGameInProgress) {
            canvasContext.fillStyle = "white";
            canvasContext.font = "bold 64px Arial";
            canvasContext.fillText("Game over!", (VIEWPORT_WIDTH_PIXELS / 2) - 150, (VIEWPORT_HEIGHT_PIXELS / 2) + 8);
        }
    }

    function isFacingRight () {
        return (playerA > (3/2)*Math.PI)
            || (playerA < (1/2)*Math.PI);
    };

    function isFacingUp () {
        return playerA > Math.PI;
    };

    function normalizePlayerA () {
        if (playerA < 0)
            playerA += 2 * Math.PI;
        playerA %= 2 * Math.PI;
    }

    function attachKeyboardListeners(isMouseMode) {

        //Key down
        document.onkeydown = function (keyboardEvent) {
            if (isGameInProgress) {
                switch (keyboardEvent.keyCode) {
                    case 87: //W
                        isMovingForward = true;
                        break;
                    case 83: //S
                        isMovingBackward = true;
                        break;
                    case 65: //A
                        if (isMouseMode)
                            isSidesteppingLeft = true;
                        else
                            isTurningLeft = true;
                        break;
                    case 68: //D                                
                        if (isMouseMode)
                            isSidesteppingRight = true;
                        else
                            isTurningRight = true;
                        break;
                    case 81: //Q
                        if (!isMouseMode)
                            isSidesteppingLeft = true;
                        break;
                    case 69: //E
                        if (!isMouseMode)
                            isSidesteppingRight = true;
                        break;
                    case 37: //Right arrow
                            if (!isMouseMode) {
                                if (raycastingEngine.getWallType(playerA) === WALL_TYPE_PIECE_ACTIVE) {
                                    if (isFacingUp()) {
                                        tetrisEngine.moveRight();
                                        pushPlayerRightIfNecessary();
                                    }
                                    else {
                                        tetrisEngine.moveLeft();
                                        pushPlayerLeftIfNecessary();
                                    }
                                }
                            }
                        break;
                    case 38: //Up arrow
                        if (!isMouseMode) {
                            if (raycastingEngine.getWallType(playerA) === WALL_TYPE_PIECE_ACTIVE) {
                                tetrisEngine.rotate(-1);
                                pushPlayerToClosestAdjacentIfNecessary();
                            }
                        }
                        break;
                    case 39: //Left arrow
                        if (!isMouseMode) {
                            if (raycastingEngine.getWallType(playerA) === WALL_TYPE_PIECE_ACTIVE) {
                                if (isFacingUp()) {
                                    tetrisEngine.moveLeft();
                                    pushPlayerLeftIfNecessary();
                                }
                                else {
                                    tetrisEngine.moveRight();
                                    pushPlayerRightIfNecessary();
                                }
                            }
                        }
                        break;
                    case 40: //Down arrow
                        if (!isMouseMode)
                            isDropping = true;
                        break;
                    case 32: //Space
                        if (isMouseMode)
                            isDropping = true;
                }
            }
        }

        //Key up
        document.onkeyup = function (keyboardEvent) {                    
            if (isGameInProgress) {
                switch (keyboardEvent.keyCode) {
                    case 87: //W
                        isMovingForward = false;
                        break;
                    case 83: //S
                        isMovingBackward = false;
                        break;
                    case 65: //A
                        if (isMouseMode)
                            isSidesteppingLeft = false;
                        else
                            isTurningLeft = false;
                        break;
                    case 68: //D
                        if (isMouseMode)
                            isSidesteppingRight = false;
                        else
                            isTurningRight = false;
                        break;
                    case 81: //Q
                        if (!isMouseMode)
                            isSidesteppingLeft = false;
                        break;
                    case 69: //E
                        if (!isMouseMode)
                            isSidesteppingRight = false;
                        break;
                    case 40: //Down arrow
                        if (!isMouseMode)
                            isDropping = false;
                        break;
                    case 32: //Space
                        if (isMouseMode)
                            isDropping = false;
                }
            }                    
        }
    }

        function attachGamepadListeners(){
        window.addEventListener("gamepadconnected", function(e){
            console.log('connectedGamepad');

            var gamepadButtonCheckerInterval = setInterval(function(){
                var gamepad = navigator.getGamepads()[0]; 

                var horizontalMovement = gamepad.axes[0];
                var forwardMovement = gamepad.axes[1];
                var horizontalView = gamepad.axes[2];
                var verticalView = gamepad.axes[3];

                if(forwardMovement > 0.5){
                    isMovingBackward = true;
                }
                if(forwardMovement < -0.5){
                    isMovingForward = true;
                }
                if(forwardMovement > -0.5 && forwardMovement < 0.5){
                    isMovingForward = false;
                    isMovingBackward = false;
                }

                if(horizontalMovement > 0.5){
                    isSidesteppingRight = true;
                }
                if(horizontalMovement < -0.5){
                    isSidesteppingLeft = true;
                }
                if(horizontalMovement > -0.5 && horizontalMovement < 0.5){
                    isSidesteppingLeft = false;
                    isSidesteppingRight = false;
                }

                if(horizontalView > 0.5){
                    isTurningRight = true;
                }
                if(horizontalView < -0.5){
                    isTurningLeft = true;
                }
                if(horizontalView > -0.5 && horizontalView < 0.5){
                    isTurningLeft = false;
                    isTurningRight = false;
                }


                if(gamepad.buttons[0].pressed){
                        if (raycastingEngine.getWallType(playerA) === WALL_TYPE_PIECE_ACTIVE) {
                        if (isFacingRight()) {
                            tetrisEngine.moveLeft();
                            pushPlayerRightIfNecessary();
                        }
                        else {
                            tetrisEngine.moveRight();
                            pushPlayerLeftIfNecessary();
                        }
                    }
                    //button 1
                    console.log('button 1');
                }
                if(gamepad.buttons[1].pressed){
                    //button 1
                    console.log('button 2');
                }

            }, 30); //millisecond interval for listener

        })
    }
}