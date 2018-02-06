"use strict";

/* 
 * The TetrisEngine is intended to contain a standalone tetris game.
 * 
 * Even though we are using it in an FPS manner, it could just as easily be
 * used for a 2D style game as well.
*/


function TetrisEngine() {
    var self = this;


    ///////////////////////
    // PRIVATE CONSTANTS //
    ///////////////////////

    window.REJECT_PLUS = {
        name: "PLUS",
        initial: [
            [0, 2, 0],
            [2, 0, 2],
            [0, 2, 0]
        ],
        rotations: [
            [0, 2, 0],
            [2, 0, 2],
            [0, 2, 0]
        ]
    }

    window.REJECT_R = {
        name: "R",
        initial: [
            [0, 2, 2],
            [2, 0, 0],
            [2, 0, 0],
        ],
        rotations: [
            [[2, 2, 0],
            [0, 0, 2],
            [0, 0, 2]],
            [[0, 0, 2],
            [0, 0, 2],
            [2, 2, 0]],
            [[2, 0, 0],
            [2, 0, 0],
            [0, 2, 2]],
            [[0, 2, 2],
            [2, 0, 0],
            [2, 0, 0]]
        ]
    }

    window.REJECT_Y = {
        name: "Y",
        initial: [
            [0, 2, 0],
            [0, 2, 0],
            [2, 0, 2]
        ],
        rotations: [
            [
                [0, 2, 0],
                [0, 2, 0],
                [2, 0, 2]
            ],
            [
                [2, 0, 0],
                [0, 2, 2],
                [2, 0, 0]
            ],
            [
                [2, 0, 2],
                [0, 2, 0],
                [0, 2, 0]
            ],
            [
                [0, 0, 2],
                [2, 2, 0],
                [0, 0, 2]
            ]
        ]
    }

    window.REJECT_HOOK = {
        name: "HOOK",
        initial: [
            [0, 2, 0],
            [2, 0, 2],
            [2, 0, 0]
        ],
        rotations: [
            [
                [0, 2, 0],
                [2, 0, 2],
                [2, 0, 0]
            ],
            [
                [2, 2, 0],
                [0, 0, 2],
                [0, 2, 0]
            ],
            [
                [0, 0, 2],
                [2, 0, 2],
                [0, 2, 0]
            ],
            [
                [0, 2, 0],
                [2, 0, 0],
                [0, 2, 2]
            ]
        ]
    }

    window.REJECT_CROOK = {
        name: "CROOK",
        initial: [
            [0, 2, 0],
            [2, 0, 2],
            [0, 0, 2]
        ],
        rotations: [
            [
                [0, 2, 0],
                [2, 0, 2],
                [0, 0, 2]
            ],
            [
                [0, 2, 0],
                [0, 0, 2],
                [2, 2, 0]
            ],
            [
                [2, 0, 0],
                [2, 0, 2],
                [0, 2, 0]
            ],
            [
                [0, 2, 2],
                [2, 0, 0],
                [0, 2, 0]
            ]
        ]
    }

    window.REJECT_UPSTAIRS = {
        name: "UPSTAIRS",
        initial: [
            [0, 0, 2],
            [0, 2, 2],
            [2, 0, 0]
        ],
        rotations: [
            [
                [0, 0, 2],
                [0, 2, 2],
                [2, 0, 0]
            ],
            [
                [2, 0, 0],
                [0, 2, 0],
                [0, 2, 2]
            ],
            [
                [0, 0, 2],
                [2, 2, 0],
                [2, 0, 0]
            ],
            [
                [2, 2, 0],
                [0, 2, 0],
                [0, 0, 2]
            ]
        ]
    }

    window.REJECT_DOWNSTAIRS = {
        name: "DOWNSTAIRS",
        initial: [
            [2, 0, 0],
            [2, 2, 0],
            [0, 0, 2]
        ],
        rotations: [
            [
                [2, 0, 0],
                [2, 2, 0],
                [0, 0, 2]
            ],
            [
                [0, 2, 2],
                [0, 2, 0],
                [2, 0, 0]
            ],
            [
                [2, 0, 0],
                [0, 2, 2],
                [0, 0, 2]
            ],
            [
                [0, 0, 2],
                [0, 2, 0],
                [2, 2, 0]
            ]
        ]
    }

    window.REJECT_DIAGONALDOG = {
        name: "DIAGONALDOG",
        initial: [
            [2, 0, 2],
            [0, 2, 0],
            [0, 0, 2]
        ],
        rotations: [
            [
                [2, 0, 2],
                [0, 2, 0],
                [0, 0, 2]
            ],
            [
                [0, 0, 2],
                [0, 2, 0],
                [2, 0, 2]
            ],
            [
                [2, 0, 0],
                [0, 2, 0],
                [2, 0, 2]
            ],
            [
                [2, 0, 2],
                [0, 2, 0],
                [2, 0, 0]
            ]
        ]
    }

    window.REJECT_WHEELBARROW = {
        name: "WHEELBARROW",
        initial: [
            [0, 2, 0],
            [2, 2, 0],
            [0, 0, 2]
        ],
        rotations: [
            [
                [0, 2, 0],
                [2, 2, 0],
                [0, 0, 2]
            ],
            [
                [0, 2, 0],
                [0, 2, 2],
                [2, 0, 0]
            ],
            [
                [2, 0, 0],
                [0, 2, 2],
                [0, 2, 0]
            ],
            [
                [0, 0, 2],
                [2, 2, 0],
                [0, 2, 0]
            ]
        ]
    }

    window.REJECT_REVERSEWHEELBARROW = {
        name: "REVERSEWHEELBARROW",
        initial: [
            [0, 2, 0],
            [0, 2, 2],
            [2, 0, 0]
        ],
        rotations: [
            [
                [0, 2, 0],
                [0, 2, 2],
                [2, 0, 0]
            ],
            [
                [2, 0, 0],
                [0, 2, 2],
                [0, 2, 0]
            ],
            [
                [0, 0, 2],
                [2, 2, 0],
                [0, 2, 0]
            ],
            [
                [0, 2, 0],
                [2, 2, 0],
                [0, 0, 2]
            ]
        ]
    }

    window.REJECT_Q = {
        name: "Q",
        initial: [
            [2, 2, 0],
            [2, 0, 2]
        ],
        rotations: [
            [
                [2, 2, 0],
                [2, 0, 2],
                [0, 0, 0]]
            [
            [0, 2, 2],
            [0, 0, 2],
            [0, 2, 0]]
            [
            [2, 2, 0],
            [2, 0, 2],
            [0, 0, 0]]
            [
            [0, 2, 2],
            [0, 0, 2],
            [0, 2, 0]]
        ]
    }

    window.REJECT_REVERSEQ = {
        name: "REVERSEQ",
        initial: [
            [0, 2, 2],
            [2, 0, 2]
        ],
        rotations: [
            [
                [0, 2, 2],
                [2, 0, 2],
                [0, 0, 0]]
            [
            [0, 2, 0],
            [0, 0, 2],
            [0, 2, 2]]
            [
            [0, 2, 2],
            [2, 0, 2],
            [0, 0, 0]]
            [
            [0, 2, 0],
            [0, 0, 2],
            [0, 2, 2]]
        ]
    }

    window.REJECT_KING = {
        name: "KING",
        initial: [
            [2, 0, 0, 0],
            [0, 2, 0, 0],
            [0, 0, 2, 0],
            [0, 0, 0, 2]],
        rotations: [
            [[2, 0, 0, 0],
            [0, 2, 0, 0],
            [0, 0, 2, 0],
            [0, 0, 0, 2]],
            [[0, 0, 0, 2],
            [0, 0, 2, 0],
            [0, 2, 0, 0],
            [2, 0, 0, 0]],
            [[2, 0, 0, 0],
            [0, 2, 0, 0],
            [0, 0, 2, 0],
            [0, 0, 0, 2]],
            [[0, 0, 0, 2],
            [0, 0, 2, 0],
            [0, 2, 0, 0],
            [2, 0, 0, 0]]
        ]
    }



    window.TETRIS_PIECES = [
        window.REJECT_R,
        window.REJECT_PLUS,
        window.REJECT_Y,
        window.REJECT_HOOK,
        window.REJECT_CROOK,
        window.REJECT_REVERSEWHEELBARROW,
        window.REJECT_WHEELBARROW,
        window.REJECT_DIAGONALDOG,
        window.REJECT_DOWNSTAIRS,
        window.REJECT_UPSTAIRS,
        window.REJECT_Q,
        window.REJECT_REVERSEQ,
        window.REJECT_KING
    ];


    //////////////////////////////
    // PRIVATE MEMBER VARIABLES //
    //////////////////////////////

    var lastTickIndex = 0;
    var tickDelay = TETRIS_STARTING_TICK_SPEED_MILLISECONDS;
    var numberOfLines = 0;
    var currentLevel = TETRIS_STARTING_LEVEL;
    var currentRotation = 0; //goes from 0 - 3, which says where the blank line is it rotates around.
    var score = 0;
    var currentTetrisBlock;
    var nextTetrisBlock;
    var scoreBonus = 0;


    //////////////////////////
    // PUBLIC FUNCTIONALITY //
    //////////////////////////

    self.getNumberOfLines = function () {
        return numberOfLines;
    };

    self.getScore = function () {
        return score;
    };

    self.getLevel = function () {
        return currentLevel;
    };

    self.getNextPiece = function () {
        return nextTetrisBlock.initial;
    };

    self.moveLeft = function () {
        console.log("Move Tetris piece left.");
        var newWorld = createNewWorld();
        for (var rowIndex = 0; rowIndex < newWorld.length; rowIndex++) {
            for (var cellIndex = 0; cellIndex < newWorld[rowIndex].length; cellIndex++) {
                var currentCell = newWorld[rowIndex][cellIndex];

                if (currentCell == WALL_TYPE_PIECE_ACTIVE) {
                    newWorld[rowIndex][cellIndex - 1] = WALL_TYPE_PIECE_ACTIVE; //move it 'left'
                    newWorld[rowIndex][cellIndex] = WALL_TYPE_NONE; //displace the old cell
                }
            }
        }

        if (isNewWorldValid(newWorld)) {
            world = newWorld;
        }

    };

    self.moveRight = function () {
        console.log("Move Tetris piece right.");

        var newWorld = createNewWorld();
        for (var rowIndex = 0; rowIndex < newWorld.length; rowIndex++) {
            for (var cellIndex = newWorld[rowIndex].length; cellIndex >= 0; cellIndex--) { //starts from the right side of each array
                var currentCell = newWorld[rowIndex][cellIndex];
                if (currentCell == WALL_TYPE_PIECE_ACTIVE) {
                    newWorld[rowIndex][cellIndex + 1] = WALL_TYPE_PIECE_ACTIVE; //move it 'right'
                    newWorld[rowIndex][cellIndex] = WALL_TYPE_NONE; //displace the old cell
                }
            }
        }

        if (isNewWorldValid(newWorld)) {
            world = newWorld;
        }

    };

    self.rotate = function (angle) {
        console.log("Rotate Tetris piece.");

        if (currentTetrisBlock.name == "O") { //we don't spin O block
            return;
        }

        var pushFromTopBuffer = 0; //how many places to push it if the block is at the top.
        var isPieceAtTop = false;

        if (world[20].indexOf(2) >= 0) {
            isPieceAtTop = true;
            if (currentTetrisBlock.name == "I") {
                pushFromTopBuffer = 2;
            }
            else {
                pushFromTopBuffer = 1;
            }
        }
        else { //weird case where the I block has move 1 down, but still doesn't have room to rotate
            if (world[19].indexOf(2) >= 0 && currentTetrisBlock.name == "I" && currentRotation == 0) {
                pushFromTopBuffer = 1;
            }
        }


        //http://tetris.wikia.com/wiki/SRS
        //now using premade block rotation matrices
        //we'll find the center, and then throw on new rotation (kept track by the var currentRotation) 
        //and we'll remove the current peice, and put in the rotation
        var center = findCenter(); //the center which will be rotated around
        if (center.length == 0) {
            console.log("We don't have a center, so we won't rotate");
            //this is more error handling than anything, we SHOULD have a center, 
            //but I'm not certain all my matricies are well specified above (or in the original TETRIS_X objects)
            return;
        }

        //determine clockwise / anti clockwise rotation and matrix
        var rotationType = angle > 0 ? 1 : -1;
        if (currentRotation + rotationType < 0) {
            rotationType += 4;
        }
        var newRotation = (currentRotation + rotationType) % 4;
        var rotatedMatrix = currentTetrisBlock.rotations[newRotation];


        //create a new world without any active piece.
        var newWorld = createNewWorld();
        for (var r = 0; r < newWorld.length; r++) {
            for (var c = 0; c < newWorld[r].length; c++) {
                if (newWorld[r][c] == WALL_TYPE_PIECE_ACTIVE) {
                    newWorld[r][c] = WALL_TYPE_NONE;
                }
            }
        }

        //put in the new piece.
        //the 4x4 block (I) is so weird, I'm just going to hardcode the piece placement. -af
        if (currentTetrisBlock.name == "I") {
            var offsets = [2, 1, 0, -1];
            for (var i = 0; i < offsets.length; i++) {
                if (newRotation % 2 == 1) { //vertical
                    newWorld[center[0] + offsets[i] - pushFromTopBuffer][center[1]] = WALL_TYPE_PIECE_ACTIVE;
                }
                else { //horizontal
                    newWorld[center[0] - pushFromTopBuffer][center[1] + offsets[i]] = WALL_TYPE_PIECE_ACTIVE;
                }
            }
        }
        else { //for all other pieces we can use a 3x3 grid.
            for (var rowIndex = 0; rowIndex < rotatedMatrix.length; rowIndex++) {
                var offset = -1; //offset so in our 3x3 matrix [1,1] is now the center;
                for (var cellIndex = 0; cellIndex < rotatedMatrix[rowIndex].length; cellIndex++) {
                    if (rotatedMatrix[rowIndex][cellIndex] == WALL_TYPE_PIECE_ACTIVE) {
                        var y_coord = center[0] + rowIndex + offset;
                        var x_coord = center[1] + cellIndex + offset;
                        newWorld[y_coord - pushFromTopBuffer][x_coord] = WALL_TYPE_PIECE_ACTIVE;
                    }
                }
            }
        }

        if (isNewWorldValid(newWorld)) {
            world = newWorld;
            currentRotation = newRotation; //if we actually rotate it, then incrememnt the rotate counter.
        }

    };

    self.drop = function () {

        //Set speed
        if (tickDelay > TETRIS_DROP_TICK_SPEED_MILLISECONDS)
            tickDelay = TETRIS_DROP_TICK_SPEED_MILLISECONDS;

        //update the score for dropping
        scoreBonus++;
        //Immediately initiate tetris tick
        scheduleTick(0);
    };

    self.cancelDrop = function () {

        //Update the speed
        var oldTickDelay = tickDelay;
        updateSpeedIfNecessary();

        //Reset the tick if speed was updated
        if (tickDelay != oldTickDelay)
            scheduleTick(tickDelay);
    };

    self.pieceMovedDownCallback = null;

    self.playerLostCallback = null;


    //////////////////////
    // CONSTRUCTOR CODE //
    //////////////////////

    (function () {
        nextTetrisBlock = TETRIS_PIECES[Math.floor(Math.random() * (TETRIS_PIECES.length))];
        addBlock();
        scheduleTick(0);
    })();


    /////////////////////
    // PRIVATE METHODS //
    /////////////////////

    function executeAndScheduleTick(initiatingTickIndex) {
        if (isGameInProgress && initiatingTickIndex === lastTickIndex) {
            scheduleTick(tickDelay);

            if (isMovingDownACollision()) {
                setPiece();
                var linesCleared = clearLines();
                updateScoreFromLines(linesCleared);
                updateSpeedIfNecessary();
                addBlock();
                scheduleTick(tickDelay);
            }
            else {
                movePieceDown();
            }
        }
    }

    function scheduleTick(delay) {
        var currentTickIndex = lastTickIndex + 1;
        lastTickIndex = currentTickIndex;
        setTimeout(function () { executeAndScheduleTick(currentTickIndex); }, delay);
    }

    function findCenter() {
        var center = [];

        if (currentTetrisBlock.name == "Q" || currentTetrisBlock.name == "REVERSEQ") {
            return;
        }

        if (currentTetrisBlock.name == "KING") {
            return;
        }

        for (var rowIndex = 1; rowIndex < world.length - 1; rowIndex++) {
            for (var cellIndex = 1; cellIndex <= world[rowIndex].length - 1; cellIndex++) {

                let testRotation = [
                    [world[rowIndex + 1][cellIndex - 1], world[rowIndex + 1][cellIndex], world[rowIndex + 1][cellIndex + 1]],
                    [world[rowIndex][cellIndex - 1], world[rowIndex][cellIndex], world[rowIndex][cellIndex + 1]],
                    [world[rowIndex - 1][cellIndex - 1], world[rowIndex - 1][cellIndex], world[rowIndex - 1][cellIndex + 1]]
                ];

                for (let i = 0; i < currentTetrisBlock.rotations.length; i++) {
                    //array equals is weird, so we're testing JSON strings, wow.
                    if (JSON.stringify(testRotation) == JSON.stringify(currentTetrisBlock.rotations[i])) {
                        center = [rowIndex, cellIndex];
                        return center;
                    }
                }
            }
        }

        return center;
    }

    function addBlock() {
        currentTetrisBlock = nextTetrisBlock;
        nextTetrisBlock = TETRIS_PIECES[Math.floor(Math.random() * (TETRIS_PIECES.length))];
        var newBlock = currentTetrisBlock.initial;
        var length = newBlock[0].length;
        var startingCell = (10 / 2) - Math.floor(length / 2);
        for (var rowIndex = 0; rowIndex < newBlock.length; rowIndex++) {
            for (var cellIndex = 0; cellIndex < newBlock[rowIndex].length; cellIndex++) {
                //if the cell is already filled, game over.
                var yLocation = world.length - 2; // -2 for the 2 edge pieces in the world array
                yLocation = yLocation - rowIndex; //move down another row for each rowIndex

                var xLocation = startingCell + cellIndex; //the middle of the screen plus the index we're at on the new piece

                if (world[yLocation][xLocation] == WALL_TYPE_PIECE_INACTIVE) {
                    if (self.playerLostCallback !== null) {
                        console.log("LOST: all filled up");
                        self.playerLostCallback();
                    }
                } else { //place the new block;
                    world[yLocation][xLocation] = newBlock[rowIndex][cellIndex];
                }

            }
        }
        currentRotation = 0;

    }

    function movePieceDown() {
        //nothing colides, so we can move it down;
        for (var rowIndex = 0; rowIndex < world.length; rowIndex++) {
            for (var cellIndex = 0; cellIndex < world[rowIndex].length; cellIndex++) {
                var currentCell = world[rowIndex][cellIndex];
                if (currentCell == WALL_TYPE_PIECE_ACTIVE) {
                    world[rowIndex - 1][cellIndex] = WALL_TYPE_PIECE_ACTIVE; //move it 'down'
                    world[rowIndex][cellIndex] = WALL_TYPE_NONE; //displace the old cell
                }
            }
        }
        //execute possible callback
        if (self.pieceMovedDownCallback !== null)
            self.pieceMovedDownCallback();
    }

    function setPiece() {
        for (var rowIndex = 0; rowIndex < world.length; rowIndex++) {
            for (var cellIndex = 0; cellIndex < world[rowIndex].length; cellIndex++) {
                var currentCell = world[rowIndex][cellIndex];
                if (currentCell == WALL_TYPE_PIECE_ACTIVE) {
                    world[rowIndex][cellIndex] = WALL_TYPE_PIECE_INACTIVE;
                }
            }
        }
    }

    function clearLines() { //finds a line to clear, then calls itself again;
        //this returns the number of lines cleared;

        for (var rowIndex = 0; rowIndex < world.length; rowIndex++) {
            if (world[rowIndex].reduce((a, b) => a + b, 0) == 32) { //row is [1,3,3,3,3,3,3,3,3,3,3,1], sums to 32
                world.splice(rowIndex, 1);  //remove that row
                world.splice(20, 0, [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1]); //push a blank row at top

                return 1 + clearLines(); //call itself again, to see if multiple lines need to be cleared.
            }
        }
        return 0;
    }

    function updateScoreFromLines(numLinesToScore) {
        console.log("Updating score by " + numLinesToScore + " lines");
        var pointsPerLine = [0, 40, 100, 300, 1200]; //how many points per num lines (0 lines, 0 points, 0 crates.)
        //update score
        //	40 * (n + 1)	100 * (n + 1)	300 * (n + 1)	1200 * (n + 1) (this is how to calc score, which I never knew)
        score = score + (pointsPerLine[numLinesToScore] * (currentLevel + 1));
        score += scoreBonus;
        scoreBonus = 0;
        //add lines to total count, and maybe speed up
        numberOfLines += numLinesToScore;
        if (numberOfLines >= ((currentLevel * 10) + 10)) {
            currentLevel++;
        }
    }

    function isMovingDownACollision() {
        //find all the 2's and move them 'plus' one level in the array
        var collision = false;
        for (var rowIndex = world.length - 1; rowIndex > 0; rowIndex--) { //start at the last row and work up
            var currentRow = world[rowIndex];
            for (var cellIndex = 0; cellIndex < currentRow.length; cellIndex++) {
                //for each cell, see if it's an active piece, and if we can move it down.
                if (currentRow[cellIndex] == WALL_TYPE_PIECE_ACTIVE) {
                    var cellBelowCurrentCell = world[rowIndex - 1][cellIndex];
                    if (cellBelowCurrentCell == WALL_TYPE_ARENA ||
                        cellBelowCurrentCell == WALL_TYPE_PIECE_INACTIVE) {
                        collision = true;
                        return collision;
                    }
                }
            }
        }
        return collision;
    }

    function createNewWorld() {
        //creates a copy of the world and returns it.
        var newWorld = [
            [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
            [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
            [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
            [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
            [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
            [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
            [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
            [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
            [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
            [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
            [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
            [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
            [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
            [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
            [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
            [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
            [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
            [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
            [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
            [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
            [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
            [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
        ];

        for (var r = 0; r < newWorld.length; r++) {
            for (var c = 0; c < newWorld[r].length; c++) {
                newWorld[r][c] = world[r][c];
            }
        }
        return newWorld;
    }


    function isNewWorldValid(newWorld) {
        //see if newWorld conflicts with the old world.
        for (var rowIndex = 0; rowIndex < newWorld.length; rowIndex++) {
            for (var cellIndex = 0; cellIndex < newWorld[rowIndex].length; cellIndex++) {
                if (newWorld[rowIndex][cellIndex] == WALL_TYPE_PIECE_ACTIVE) {
                    if (world[rowIndex][cellIndex] == WALL_TYPE_ARENA
                        || world[rowIndex][cellIndex] == WALL_TYPE_PIECE_INACTIVE) {
                        return false;
                    }
                }
            }
        }
        return true;
    }

    function updateSpeedIfNecessary() {
        //updates the speed, used when dropping stops, and when the level goes up.
        tickDelay = TETRIS_STARTING_TICK_SPEED_MILLISECONDS - (currentLevel * TETRIS_SPEED_PER_LEVEL_MILLISECONDS);
    }
}