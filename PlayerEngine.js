"use strict";

/* 
 * The PlayerEngine is intended to contain logic relating to the things that
 * the character can do, such as: walking, turning, pushing/rotating tetris
 * pieces, viewing their overlay, and getting smashed.
 * 
 * Its public interface includes all the actions the user can do and interacts
 * with the TetrisEngine as necessary.
 */


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

    self.tryTurnLeft = function (radians) {
        playerA += radians;
        normalizePlayerA();
    };

    self.tryLookUp = function (radians) {
        playerVerticalA += radians;
        normalizePlayerVerticalA();
    };

    self.tryPullPiece = function () {
        if (raycastingEngine.getWallType(playerA, playerVerticalA) === WALL_TYPE_PIECE_ACTIVE) {
            if (isFacingRight()) {
                tetrisEngine.moveLeft();
                pushPlayerRightIfNecessary();
            } else {
                tetrisEngine.moveRight();
                pushPlayerLeftIfNecessary();
            }
        }
    };

    self.tryPushPiece = function () {
        if (raycastingEngine.getWallType(playerA, playerVerticalA) === WALL_TYPE_PIECE_ACTIVE) {
            if (isFacingRight()) {
                tetrisEngine.moveRight();
                pushPlayerRightIfNecessary();
            } else {
                tetrisEngine.moveLeft();
                pushPlayerLeftIfNecessary();
            }
        }
    };

    self.tryRotatePieceClockwise = function () {
        if (raycastingEngine.getWallType(playerA, playerVerticalA) === WALL_TYPE_PIECE_ACTIVE) {
            self.rotatePieceClockwise();
        }
    };

    self.tryRotatePieceCounterClockwise = function () {
        if (raycastingEngine.getWallType(playerA, playerVerticalA) === WALL_TYPE_PIECE_ACTIVE) {
            self.rotatePieceClockwise();
        }
    };

    self.startDroppingPiece = function () {
        if (!isDropping)
            tetrisEngine.drop();
        isDropping = true;
    };

    self.stopDroppingPiece = function () {
        isDropping = false;
    };

    self.rotatePieceClockwise = function () {
        tetrisEngine.rotate(-1);
        pushPlayerToClosestAdjacentIfNecessary();
    };

    self.rotatePieceCounterClockwise = function () {
        tetrisEngine.rotate(1);
        pushPlayerToClosestAdjacentIfNecessary();
    };

    self.tryStartMovingForward = function () {
        isMovingForward = true;
    };

    self.tryStopMovingForward = function () {
        isMovingForward = false;
    };

    self.tryStartMovingBackwards = function () {
        isMovingBackward = true;
    };

    self.tryStopMovingBackwards = function () {
        isMovingBackward = false;
    };

    self.tryStartSidesteppingLeft = function () {
        isSidesteppingLeft = true;
    };

    self.tryStopSidesteppingLeft = function () {
        isSidesteppingLeft = false;
    };

    self.tryStartSidesteppingRight = function () {
        isSidesteppingRight = true;
    };

    self.tryStopSidesteppingRight = function () {
        isSidesteppingRight = false;
    };

    self.tryStartTurningLeft = function () {
        isTurningLeft = true;
    };

    self.tryStopTurningLeft = function () {
        isTurningLeft = false;
    };

    self.tryStartTurningRight = function () {
        isTurningRight = true;
    };

    self.tryStopTurningRight = function () {
        isTurningRight = false;
    };

    self.tryMovePieceLeft = function () {
        if (raycastingEngine.getWallType(playerA, playerVerticalA) === WALL_TYPE_PIECE_ACTIVE) {
            self.movePieceLeft();
        }
    };

    self.tryMovePieceRight = function () {
        if (raycastingEngine.getWallType(playerA, playerVerticalA) === WALL_TYPE_PIECE_ACTIVE) {
            self.movePieceRight();
        }
    };

    self.movePieceLeft = function () {
        if (isFacingUp()) {
            tetrisEngine.moveLeft();
            pushPlayerLeftIfNecessary();
        } else {
            tetrisEngine.moveRight();
            pushPlayerRightIfNecessary();
        }
    };

    self.movePieceRight = function () {
        if (isFacingUp()) {
            tetrisEngine.moveRight();
            pushPlayerRightIfNecessary();
        } else {
            tetrisEngine.moveLeft();
            pushPlayerLeftIfNecessary();
        }
    };


    //////////////////////
    // CONSTRUCTOR CODE //
    //////////////////////

    (function () {
        tetrisEngine.pieceMovedDownCallback = pushPlayerDownIfNecessary;
        tetrisEngine.playerLostCallback = playerLostTetris;
        raycastingEngine.worldDrawnCallback = drawPlayerOverlay;
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
        if (!isDropping /*&& raycastingEngine.getWallType(playerA, playerVerticalA) === WALL_TYPE_PIECE_ACTIVE*/)
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
        } else {
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
        } else if (hitX.dist > hitY.dist) {
            if (distX > 0)
                tryMove(0, distX);
            else if (distX < 0)
                tryMove(Math.PI, -distX);
        }
    }

    function pushPlayerDownIfNecessary() {
        if (Math.floor(playerX) !== playerX) {
            if (world[Math.floor(playerY)][Math.floor(playerX)] === WALL_TYPE_PIECE_ACTIVE ||
                world[Math.floor(playerY - PLAYER_PUSHED_BUFFER)][Math.floor(playerX)] === WALL_TYPE_PIECE_ACTIVE)
                playerY = Math.floor(playerY - PLAYER_PUSHED_BUFFER) - PLAYER_PUSHED_BUFFER;
        } else if (Math.floor(playerX) === playerX) {
            if (world[Math.floor(playerY)][Math.floor(playerX)] === WALL_TYPE_PIECE_ACTIVE ||
                world[Math.floor(playerY)][Math.floor(playerX) - 1] === WALL_TYPE_PIECE_ACTIVE ||
                world[Math.floor(playerY - PLAYER_PUSHED_BUFFER)][Math.floor(playerX)] === WALL_TYPE_PIECE_ACTIVE ||
                world[Math.floor(playerY - PLAYER_PUSHED_BUFFER)][Math.floor(playerX) - 1] === WALL_TYPE_PIECE_ACTIVE)
                playerY = Math.floor(playerY - PLAYER_PUSHED_BUFFER) - PLAYER_PUSHED_BUFFER;
        }
        handleSmashIfNecessary();
    }

    function pushPlayerLeftIfNecessary() {
        if (Math.floor(playerY) !== playerY) {
            if (world[Math.floor(playerY)][Math.floor(playerX)] === WALL_TYPE_PIECE_ACTIVE ||
                world[Math.floor(playerY)][Math.floor(playerX - PLAYER_PUSHED_BUFFER)] === WALL_TYPE_PIECE_ACTIVE)
                playerX = Math.floor(playerX - PLAYER_PUSHED_BUFFER) - PLAYER_PUSHED_BUFFER;
        } else if (Math.floor(playerY) === playerY) {
            if (world[Math.floor(playerY)][Math.floor(playerX)] === WALL_TYPE_PIECE_ACTIVE ||
                world[Math.floor(playerY) - 1][Math.floor(playerX)] === WALL_TYPE_PIECE_ACTIVE ||
                world[Math.floor(playerY)][Math.floor(playerX - PLAYER_PUSHED_BUFFER)] === WALL_TYPE_PIECE_ACTIVE ||
                world[Math.floor(playerY) - 1][Math.floor(playerX - PLAYER_PUSHED_BUFFER)] === WALL_TYPE_PIECE_ACTIVE)
                playerX = Math.floor(playerX - PLAYER_PUSHED_BUFFER) - PLAYER_PUSHED_BUFFER;
        }
        handleSmashIfNecessary();
    }

    function pushPlayerRightIfNecessary() {
        if (Math.floor(playerY) !== playerY) {
            if (world[Math.floor(playerY)][Math.floor(playerX)] === WALL_TYPE_PIECE_ACTIVE ||
                world[Math.floor(playerY)][Math.floor(playerX - PLAYER_PUSHED_BUFFER)] === WALL_TYPE_PIECE_ACTIVE)
                playerX = Math.ceil(playerX + PLAYER_PUSHED_BUFFER) + PLAYER_PUSHED_BUFFER;
        } else if (Math.floor(playerY) === playerY) {
            if (world[Math.floor(playerY)][Math.floor(playerX)] === WALL_TYPE_PIECE_ACTIVE ||
                world[Math.floor(playerY) - 1][Math.floor(playerX)] === WALL_TYPE_PIECE_ACTIVE ||
                world[Math.floor(playerY)][Math.floor(playerX - PLAYER_PUSHED_BUFFER)] === WALL_TYPE_PIECE_ACTIVE ||
                world[Math.floor(playerY) - 1][Math.floor(playerX - PLAYER_PUSHED_BUFFER)] === WALL_TYPE_PIECE_ACTIVE)
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
            pushOptions.sort(function (a, b) {
                return a.getDistanceToPlayer() - b.getDistanceToPlayer();
            });

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
            this.getDistanceToPlayer = function () {
                return Math.sqrt(Math.pow(this.x - x, 2) + Math.pow(this.y - y, 2));
            };
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
            } else if (playerYFloor === playerY) {
                isSmashed = world[playerYFloor][playerXFloor] !== WALL_TYPE_NONE &&
                    world[playerYFloor - 1][playerXFloor] !== WALL_TYPE_NONE;
            }
        } else if (playerXFloor === playerX) {
            if (playerYFloor !== playerY) {
                isSmashed = world[playerYFloor][playerXFloor] !== WALL_TYPE_NONE &&
                    world[playerYFloor][playerXFloor - 1] !== WALL_TYPE_NONE;
            } else if (playerYFloor === playerY) {
                isSmashed = world[playerYFloor][playerXFloor] !== WALL_TYPE_NONE &&
                    world[playerYFloor][playerXFloor - 1] !== WALL_TYPE_NONE &&
                    world[playerYFloor - 1][playerXFloor] !== WALL_TYPE_NONE &&
                    world[playerYFloor - 1][playerXFloor - 1] !== WALL_TYPE_NONE;
            }
        }

        //Handle smash
        // if (isSmashed) {
        //     playerLostTetris();
        // }
    }

    function playerLostTetris() {
        isGameInProgress = false;
    }

    function drawPlayerOverlay() {

        //Draw crosshairs
        // raycastingEngine.drawLine(VIEWPORT_WIDTH_PIXELS / 2, VIEWPORT_HEIGHT_PIXELS / 2 - VIEWPORT_CROSSHAIR_SIZE_PIXELS / 2, VIEWPORT_WIDTH_PIXELS / 2, VIEWPORT_HEIGHT_PIXELS / 2 + VIEWPORT_CROSSHAIR_SIZE_PIXELS / 2, VIEWPORT_CROSSHAIR_COLOR);
        // raycastingEngine.drawLine(VIEWPORT_WIDTH_PIXELS / 2 - VIEWPORT_CROSSHAIR_SIZE_PIXELS / 2, VIEWPORT_HEIGHT_PIXELS / 2, VIEWPORT_WIDTH_PIXELS / 2 + VIEWPORT_CROSSHAIR_SIZE_PIXELS / 2, VIEWPORT_HEIGHT_PIXELS / 2, VIEWPORT_CROSSHAIR_COLOR);

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
        canvasContext.font = "bold 20px Arial";
        canvasContext.fillText("Next: ", VIEWPORT_WIDTH_PIXELS - 160, 20);

        //Draw lines and score
        canvasContext.fillText("Lines: " + tetrisEngine.getNumberOfLines(), (VIEWPORT_WIDTH_PIXELS / 2) - 67, 20);
        canvasContext.fillText("Score: " + tetrisEngine.getScore(), 20, 20);

        //Draw game over screen
        if (!isGameInProgress) {
            canvasContext.fillStyle = "black";
            canvasContext.font = "bold 64px Arial";
            canvasContext.fillText("Game over!", (VIEWPORT_WIDTH_PIXELS / 2) - 150, (VIEWPORT_HEIGHT_PIXELS / 2) + 8);
        }
    }

    function isFacingRight() {
        return (playerA > (3 / 2) * Math.PI) ||
            (playerA < (1 / 2) * Math.PI);
    };

    function isFacingUp() {
        return playerA > Math.PI;
    };

    function normalizePlayerA() {
        if (playerA < 0)
            playerA += 2 * Math.PI;
        playerA %= 2 * Math.PI;
    }

    function normalizePlayerVerticalA() {
        if (playerVerticalA < -Math.PI)
            playerVerticalA = -Math.PI;
        else if (playerVerticalA > Math.PI)
            playerVerticalA = Math.PI;
    }
}