"use strict";


function TetrisEngine() {
    var self = this;


    ///////////////////////
    // PRIVATE CONSTANTS //
    ///////////////////////
    
    window.TETRIS_S = {name:"S", 
                    initial: [[0,2,2],
                                [2,2,0]],
                    rotations: [
                        [[2,2,0],
                            [0,2,2],
                            [0,0,0]],
                        [[0,0,2],
                            [0,2,2],
                            [0,2,0]],
                        [[2,2,0],
                            [0,2,2],
                            [0,0,0]],
                        [[0,0,2],
                            [0,2,2],
                            [0,2,0]]
                    ]};
    window.TETRIS_Z = {name:"Z", 
                    initial: [[2,2,0],
                                [0,2,2]],
                    rotations: [
                        [[0,2,2],
                            [2,2,0],
                            [0,0,0]],
                        [[0,2,0],
                            [0,2,2],
                            [0,0,2]],
                        [[0,2,2],
                            [2,2,0],
                            [0,0,0]],
                        [[0,2,0],
                            [0,2,2],
                            [0,0,2]]
                    ]};
    window.TETRIS_O = {name:"O", 
                    initial: [[2,2],
                                [2,2]],
                    rotations: []};
    window.TETRIS_L = {name:"L", 
                    initial: [[2,2,2],
                                [2,0,0]],
                    rotations: [
                        [[2,0,0],
                            [2,2,2],
                            [0,0,0]],
                        [[0,2,2],
                            [0,2,0],
                            [0,2,0]],
                        [[0,0,0],
                            [2,2,2],
                            [0,0,2]],
                        [[0,2,0],
                            [0,2,0],
                            [2,2,0]]
                    ]};
    window.TETRIS_J = {name:"J", 
                    initial: [[2,2,2],
                                [0,0,2]],
                    rotations: [
                        [[0,0,2],
                            [2,2,2],
                            [0,0,0]],
                        [[0,2,0],
                            [0,2,0],
                            [0,2,2]],
                        [[0,0,0],
                            [2,2,2],
                            [2,0,0]],
                        [[2,2,0],
                            [0,2,0],
                            [0,2,0]]
                    ]};
    window.TETRIS_T = {name:"T", 
                    initial: [[2,2,2],
                                [0,2,0]],
                    rotations: [
                        [[0,2,0],
                            [2,2,2],
                            [0,0,0]],
                        [[0,2,0],
                            [0,2,2],
                            [0,2,0]],
                        [[0,0,0],
                            [2,2,2],
                            [0,2,0]],
                        [[0,2,0],
                            [2,2,0],
                            [0,2,0]]
                    ]};
    window.TETRIS_I = {name:"I", 
                    initial: [[2,2,2,2]],
                    rotations: [
                        [[2,2,2,2],
                            [0,0,0,0],
                            [0,0,0,0],
                            [0,0,0,0]],
                        [[2,0,0,0],
                            [2,0,0,0],
                            [2,0,0,0],
                            [2,0,0,0]],
                        [[2,2,2,2],
                            [0,0,0,0],
                            [0,0,0,0],
                            [0,0,0,0]],
                        [[2,0,0,0],
                            [2,0,0,0],
                            [2,0,0,0],
                            [2,0,0,0]]
                    ]};
    window.TETRIS_PIECES = [
                    window.TETRIS_S,
                    window.TETRIS_Z,
                    window.TETRIS_I,                            
                    window.TETRIS_O,
                    window.TETRIS_L,
                    window.TETRIS_J,
                    window.TETRIS_T
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
        for(var rowIndex = 0; rowIndex < newWorld.length; rowIndex++){
            for(var cellIndex =0; cellIndex < newWorld[rowIndex].length; cellIndex++){
                var currentCell = newWorld[rowIndex][cellIndex];

                if(currentCell == WALL_TYPE_PIECE_ACTIVE){
                    newWorld[rowIndex][cellIndex-1] = WALL_TYPE_PIECE_ACTIVE; //move it 'left'
                    newWorld[rowIndex][cellIndex] = WALL_TYPE_NONE; //displace the old cell
                }
            }
        }

        if(isNewWorldValid(newWorld)){
            world = newWorld;
        }

    };

    self.moveRight = function () {
        console.log("Move Tetris piece right.");

        var newWorld = createNewWorld();
        for(var rowIndex = 0; rowIndex < newWorld.length; rowIndex++){
            for(var cellIndex = newWorld[rowIndex].length; cellIndex >= 0; cellIndex--){ //starts from the right side of each array
                var currentCell = newWorld[rowIndex][cellIndex];
                if(currentCell == WALL_TYPE_PIECE_ACTIVE){
                    newWorld[rowIndex][cellIndex+1] = WALL_TYPE_PIECE_ACTIVE; //move it 'right'
                    newWorld[rowIndex][cellIndex] = WALL_TYPE_NONE; //displace the old cell
                }
            }
        }

        if(isNewWorldValid(newWorld)){
            world = newWorld;
        }

    };

    self.rotate = function (angle) {
        console.log("Rotate Tetris piece.");

        if(currentTetrisBlock.name == "O"){ //we don't spin O block
            return;
        }
        
        var pushFromTopBuffer = 0; //how many places to push it if the block is at the top.
        var isPieceAtTop = false;

        if(world[20].indexOf(2) >= 0){
            isPieceAtTop = true;
            if(currentTetrisBlock.name == "I"){
                pushFromTopBuffer = 2;
            }
            else{
                pushFromTopBuffer = 1;
            }
        }
        else{ //weird case where the I block has move 1 down, but still doesn't have room to rotate
            if(world[19].indexOf(2) >= 0 && currentTetrisBlock.name == "I" && currentRotation == 0){
                pushFromTopBuffer = 1;
            }
        }
        

        //http://tetris.wikia.com/wiki/SRS
        //now using premade block rotation matrices
        //we'll find the center, and then throw on new rotation (kept track by the var currentRotation) 
        //and we'll remove the current peice, and put in the rotation
        var center = findCenter(); //the center which will be rotated around
        if(center.length == 0){
            console.log("We don't have a center, so we won't rotate");
            //this is more error handling than anything, we SHOULD have a center, 
            //but I'm not certain all my matricies are well specified above (or in the original TETRIS_X objects)
            return;
        }

        //determine clockwise / anti clockwise rotation and matrix
        var rotationType = angle > 0 ? 1 : -1;
        if(currentRotation+rotationType < 0){
            rotationType+= 4;
        }
        var newRotation = (currentRotation+rotationType)%4;
        var rotatedMatrix = currentTetrisBlock.rotations[newRotation];


        //create a new world without any active piece.
        var newWorld = createNewWorld();
        for(var r = 0; r<newWorld.length; r++){
            for(var c=0; c<newWorld[r].length; c++){
                if(newWorld[r][c]==WALL_TYPE_PIECE_ACTIVE){
                    newWorld[r][c] = WALL_TYPE_NONE;
                }
            }
        }

        //put in the new piece.
        //the 4x4 block (I) is so weird, I'm just going to hardcode the piece placement. -af
        if(currentTetrisBlock.name == "I"){
            var offsets = [2,1,0,-1];
            for(var i = 0; i < offsets.length; i++){
                if(newRotation%2 == 1){ //vertical
                    newWorld[center[0]+offsets[i] - pushFromTopBuffer]  [center[1]] = WALL_TYPE_PIECE_ACTIVE;
                }
                else{ //horizontal
                    newWorld[center[0] - pushFromTopBuffer][center[1]+offsets[i]] = WALL_TYPE_PIECE_ACTIVE;
                }
            }
        }
        else{ //for all other pieces we can use a 3x3 grid.
            for(var rowIndex = 0; rowIndex < rotatedMatrix.length; rowIndex++){
                var offset = -1; //offset so in our 3x3 matrix [1,1] is now the center;
                for(var cellIndex = 0; cellIndex < rotatedMatrix[rowIndex].length; cellIndex++){
                    if(rotatedMatrix[rowIndex][cellIndex] == WALL_TYPE_PIECE_ACTIVE){
                        var y_coord = center[0] + rowIndex + offset; 
                        var x_coord = center[1] + cellIndex + offset; 
                        newWorld[y_coord - pushFromTopBuffer][x_coord] = WALL_TYPE_PIECE_ACTIVE;
                    }
                }
            }
        }

        if(isNewWorldValid(newWorld)){
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
        nextTetrisBlock = TETRIS_PIECES[Math.floor(Math.random()*(TETRIS_PIECES.length))];
        addBlock();
        scheduleTick(0);
    })();


    /////////////////////
    // PRIVATE METHODS //
    /////////////////////

    function executeAndScheduleTick(initiatingTickIndex) {
        if (isGameInProgress && initiatingTickIndex === lastTickIndex) {
            scheduleTick(tickDelay);
            
            if(isMovingDownACollision()){
                setPiece();
                var linesCleared = clearLines();
                updateScoreFromLines(linesCleared);
                updateSpeedIfNecessary();
                addBlock();
                scheduleTick(tickDelay);
            }
            else{
                movePieceDown();
            }
        }
    }

    function scheduleTick(delay) {            
        var currentTickIndex = lastTickIndex + 1;
        lastTickIndex = currentTickIndex;            
        setTimeout(function () { executeAndScheduleTick(currentTickIndex); }, delay);
    }

    function findCenter(){
        var center = [];
        if("TLJI".indexOf(currentTetrisBlock.name) >= 0)  //the following finds the center of the current piece in the world for TLJI pieces
        for(var rowIndex = 0; rowIndex < world.length; rowIndex++){
            for(var cellIndex = 0; cellIndex <= world[rowIndex].length; cellIndex++){
                if(world[rowIndex][cellIndex] == 2){
                    if((world[rowIndex-1][cellIndex] == WALL_TYPE_PIECE_ACTIVE 
                        && world[rowIndex+1][cellIndex] == WALL_TYPE_PIECE_ACTIVE) //left-right are 2's
                    || (world[rowIndex][cellIndex-1] == WALL_TYPE_PIECE_ACTIVE 
                        && world[rowIndex][cellIndex+1] == WALL_TYPE_PIECE_ACTIVE)){ //up-down are 2's
                        center = [rowIndex, cellIndex];
                    }
                }
            }
        }
        if("SZ".indexOf(currentTetrisBlock.name) >= 0) { //piece is either S or Z (which we have to find all of the piece, and the rotation we're in, to make sure it's the right center.)
            for(var y = 0; y < world.length; y++){
                for(var x = 0; x <= world[y].length; x++){
                    if(world[y][x] == WALL_TYPE_PIECE_ACTIVE){
                        //basically, we're gonna spin around different squares, given the currentRotation we're on
                        // so we gotta find the 'center' for each piece/rotation.
                        if(currentTetrisBlock.name == "S"){
                            if(currentRotation == 0
                            && world[y][x+1]==WALL_TYPE_PIECE_ACTIVE 
                            && world[y-1][x]==WALL_TYPE_PIECE_ACTIVE 
                            && world[y-1][x-1]==WALL_TYPE_PIECE_ACTIVE)
                                {center = [y,x];}
                            if(currentRotation == 1
                            && world[y+1][x]==WALL_TYPE_PIECE_ACTIVE 
                            && world[y][x+1]==WALL_TYPE_PIECE_ACTIVE 
                            && world[y-1][x+1]==WALL_TYPE_PIECE_ACTIVE)
                                {center = [y,x];}
                            if(currentRotation == 2 
                            && world[y][x+1]==WALL_TYPE_PIECE_ACTIVE 
                            && world[y-1][x]==WALL_TYPE_PIECE_ACTIVE 
                            && world[y-1][x-1]==WALL_TYPE_PIECE_ACTIVE)
                                {center = [y,x];}
                            if(currentRotation == 3 
                            && world[y+1][x]==WALL_TYPE_PIECE_ACTIVE 
                            && world[y][x+1]==WALL_TYPE_PIECE_ACTIVE 
                            && world[y-1][x+1]==WALL_TYPE_PIECE_ACTIVE)
                                {center = [y,x];}
                        }
                        if(currentTetrisBlock.name == "Z"){
                            if(currentRotation == 0
                            && world[y][x-1]==WALL_TYPE_PIECE_ACTIVE 
                            && world[y-1][x]==WALL_TYPE_PIECE_ACTIVE 
                            && world[y-1][x+1]==WALL_TYPE_PIECE_ACTIVE)
                                {center = [y,x];}
                            if(currentRotation == 1 
                            && world[y-1][x]==WALL_TYPE_PIECE_ACTIVE 
                            && world[y][x+1]==WALL_TYPE_PIECE_ACTIVE 
                            && world[y+1][x+1]==WALL_TYPE_PIECE_ACTIVE)
                                {center = [y,x];}
                            if(currentRotation == 2 
                            && world[y][x-1]==WALL_TYPE_PIECE_ACTIVE 
                            && world[y-1][x]==WALL_TYPE_PIECE_ACTIVE 
                            && world[y-1][x+1]==WALL_TYPE_PIECE_ACTIVE)
                                {center = [y,x];}
                            if(currentRotation == 3 
                            && world[y-1][x]==WALL_TYPE_PIECE_ACTIVE 
                            && world[y][x+1]==WALL_TYPE_PIECE_ACTIVE 
                            && world[y+1][x+1]==WALL_TYPE_PIECE_ACTIVE)
                                {center = [y,x];}
                        }
                    }
                }
            }
        }

        if(currentTetrisBlock.name == "I") {
                for(var y = 0; y < world.length; y++){
                for(var x = 0; x <= world[y].length; x++){
                    if(world[y][x] == WALL_TYPE_PIECE_ACTIVE){
                        if(currentRotation%2 == 0
                            && world[y][x-1]==WALL_TYPE_PIECE_ACTIVE 
                            && world[y][x+1]==WALL_TYPE_PIECE_ACTIVE 
                            && world[y][x+2]==WALL_TYPE_PIECE_ACTIVE)
                                {center = [y,x];}
                        if(currentRotation%2 == 1
                            && world[y-1][x]==WALL_TYPE_PIECE_ACTIVE 
                            && world[y+1][x]==WALL_TYPE_PIECE_ACTIVE 
                            && world[y+2][x]==WALL_TYPE_PIECE_ACTIVE)
                                {center = [y,x];}
                    }
                }
                }
        }

        return center;
    }

    function addBlock(){
        currentTetrisBlock = nextTetrisBlock;
        nextTetrisBlock = TETRIS_PIECES[Math.floor(Math.random()*(TETRIS_PIECES.length))];                
        var newBlock = currentTetrisBlock.initial; 
        var length = newBlock[0].length;
        var startingCell = (10/2)-Math.floor(length/2);
        for(var rowIndex = 0; rowIndex < newBlock.length; rowIndex++){
            for(var cellIndex = 0; cellIndex < newBlock[rowIndex].length; cellIndex++){
                //if the cell is already filled, game over.
                var yLocation = world.length-2; // -2 for the 2 edge pieces in the world array
                yLocation = yLocation-rowIndex; //move down another row for each rowIndex

                var xLocation = startingCell+cellIndex; //the middle of the screen plus the index we're at on the new piece

                if(world[yLocation][xLocation] == WALL_TYPE_PIECE_INACTIVE){ 
                    if (self.playerLostCallback !== null){
                        console.log("LOST: all filled up");
                        self.playerLostCallback();
                    }
                }else{ //place the new block;
                    world[yLocation][xLocation] = newBlock[rowIndex][cellIndex];
                }
                
            }                    
        }
        currentRotation = 0;
        
    }

    function movePieceDown(){
        //nothing colides, so we can move it down;
        for(var rowIndex = 0; rowIndex < world.length; rowIndex++){
            for(var cellIndex =0; cellIndex < world[rowIndex].length; cellIndex++){
                var currentCell = world[rowIndex][cellIndex];
                if(currentCell == WALL_TYPE_PIECE_ACTIVE){
                    world[rowIndex-1][cellIndex] = WALL_TYPE_PIECE_ACTIVE; //move it 'down'
                    world[rowIndex][cellIndex] = WALL_TYPE_NONE; //displace the old cell
                }
            }
        }
        //execute possible callback
        if (self.pieceMovedDownCallback !== null)
            self.pieceMovedDownCallback();
    }

    function setPiece(){
        for(var rowIndex = 0; rowIndex < world.length; rowIndex++){
            for(var cellIndex = 0; cellIndex < world[rowIndex].length; cellIndex++){
                var currentCell = world[rowIndex][cellIndex];
                if(currentCell == WALL_TYPE_PIECE_ACTIVE){
                    world[rowIndex][cellIndex] = WALL_TYPE_PIECE_INACTIVE;
                }
            }
        }
    }           

    function clearLines(){ //finds a line to clear, then calls itself again;
        //this returns the number of lines cleared;

        for(var rowIndex = 0; rowIndex < world.length; rowIndex++){
            if(world[rowIndex].reduce((a,b)=>a+b,0)== 32){ //row is [1,3,3,3,3,3,3,3,3,3,3,1], sums to 32
                world.splice(rowIndex,1);  //remove that row
                world.splice(20,0,[1,0,0,0,0,0,0,0,0,0,0,1]); //push a blank row at top
                
                return 1 + clearLines(); //call itself again, to see if multiple lines need to be cleared.
            }
        }
        return 0;
    }
    
    function updateScoreFromLines(numLinesToScore){
        console.log("Updating score by "+numLinesToScore+" lines");
        var pointsPerLine = [0, 40, 100, 300, 1200]; //how many points per num lines (0 lines, 0 points, 0 crates.)
        //update score
        //	40 * (n + 1)	100 * (n + 1)	300 * (n + 1)	1200 * (n + 1) (this is how to calc score, which I never knew)
        score = score + (pointsPerLine[numLinesToScore] * (currentLevel+1));
        score += scoreBonus;
        scoreBonus = 0;
        //add lines to total count, and maybe speed up
        numberOfLines += numLinesToScore;
        if(numberOfLines >= ((currentLevel*10)+10)){    
            currentLevel++;
        }
    }

    function isMovingDownACollision(){
        //find all the 2's and move them 'plus' one level in the array
        var collision = false;
        for(var rowIndex = world.length-1; rowIndex > 0; rowIndex--){ //start at the last row and work up
            var currentRow = world[rowIndex];
            for(var cellIndex = 0; cellIndex < currentRow.length; cellIndex++){
                //for each cell, see if it's an active piece, and if we can move it down.
                if(currentRow[cellIndex] == WALL_TYPE_PIECE_ACTIVE){
                    var cellBelowCurrentCell = world[rowIndex-1][cellIndex];
                    if(cellBelowCurrentCell == WALL_TYPE_ARENA ||
                        cellBelowCurrentCell == WALL_TYPE_PIECE_INACTIVE ){
                            collision = true;
                            return collision;
                        }
                }
            }
        }
        return collision;
    }

    function createNewWorld(){
        //creates a copy of the world and returns it.
        var newWorld =[
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

        for(var r = 0; r < newWorld.length; r++){
            for(var c=0; c < newWorld[r].length; c++){
                newWorld[r][c] = world[r][c];
            }
        }
        return newWorld;
    }


    function isNewWorldValid (newWorld){
        //see if newWorld conflicts with the old world.
        for(var rowIndex = 0; rowIndex < newWorld.length; rowIndex++){
            for(var cellIndex = 0; cellIndex < newWorld[rowIndex].length; cellIndex++){
                if(newWorld[rowIndex][cellIndex] == WALL_TYPE_PIECE_ACTIVE){
                    if(world[rowIndex][cellIndex] == WALL_TYPE_ARENA 
                    || world[rowIndex][cellIndex] == WALL_TYPE_PIECE_INACTIVE){
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