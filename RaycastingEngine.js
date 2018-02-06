"use strict";

/* 
 * The RaycastingEngine is intended to contain logic used to draw the virtual
 * world.
 * 
 * It also exposes an interface to "cast a ray" which is also used for wall
 * hit detection.
*/


function RaycastingEngine(drawMinimapParam, drawPlayerOnMinimapParam) {
    var self = this;


    //////////////////////////////
    // PRIVATE MEMBER CONSTANTS //   
    //////////////////////////////

    var TICK_DELAY = 1000 / MAX_FRAMERATE;  
    var VERTICAL_WALL_COLORS = WALL_COLORS.map(function (color) { return shadeColor(color, WALL_SHADING_PERCENT); });   
    var VERTICAL_WALL_COLORS_FACING = WALL_COLORS_FACING.map(function (color) { return shadeColor(color, WALL_SHADING_PERCENT); });   
    var WORLD_LENGTH_X = world[0].length;
    var WORLD_LENGTH_Y = world.length;
    var HALF_VIEWPORT_ANGLE_RADIANS = (VIEWPORT_WIDTH_DEGREES - 180) * Math.PI / -360;
    var VIEWPORT_DIST = Math.tan(HALF_VIEWPORT_ANGLE_RADIANS) * .5;


    //////////////////////////////
    // PRIVATE MEMBER VARIABLES //
    //////////////////////////////

    var drawMinimap = drawMinimapParam;
    var drawPlayerOnMinimap = drawPlayerOnMinimapParam;


    //////////////////////////
    // PUBLIC FUNCTIONALITY //
    //////////////////////////

    self.getWallType = function (horizontalA, verticalA) {

        //Get drawing values at angle
        var columnDrawingValues = getColumnDrawingValues(horizontalA - playerA, verticalA);

        //Is "straight ahead" above or below wall?
        if (columnDrawingValues.wallTopOnViewport > VIEWPORT_HEIGHT_PIXELS / 2 || columnDrawingValues.wallBottomOnViewport < VIEWPORT_HEIGHT_PIXELS / 2)
            columnDrawingValues.firstHitWallType = WALL_TYPE_NONE;

        return columnDrawingValues.firstHitWallType;
    };

    self.getFirstHitForDirection = function (angle, onHorizontalWalls) {

        //configure direction
        if (onHorizontalWalls) {
            var divisorToGetDist = Math.sin(angle);
            var primaryCoordinate = playerY;
            var secondaryCoordinate = playerX;
            var multiplierToGetSecondary = 1 / Math.tan(angle);
            var primaryMaxLength = WORLD_LENGTH_Y;
            var secondaryMaxLength = WORLD_LENGTH_X;
            var getWallTypeAtIntLocation = function () { return world[primaryInt + primaryWorldOffset][secondaryInt]; };
        }
        else {
            var divisorToGetDist = Math.cos(angle);
            var primaryCoordinate = playerX;
            var secondaryCoordinate = playerY;
            var multiplierToGetSecondary = Math.tan(angle);
            var primaryMaxLength = WORLD_LENGTH_X;
            var secondaryMaxLength = WORLD_LENGTH_Y;
            var getWallTypeAtIntLocation = function () { return world[secondaryInt][primaryInt + primaryWorldOffset]; };
        }

        //Look for first hit
        if (divisorToGetDist != 0) {
            var angleIsPositive = divisorToGetDist >= 0;
            var firstPrimaryInt = angleIsPositive ? Math.ceil(primaryCoordinate) : Math.floor(primaryCoordinate);
            var intStep = angleIsPositive ? 1 : -1;
            var primaryWorldOffset = angleIsPositive ? 0 : -1;

            //Test each grid intercept
            for (var primaryInt = firstPrimaryInt ; primaryInt < primaryMaxLength; primaryInt += intStep) {
                var primaryDist = primaryInt - primaryCoordinate;
                var secondaryInt = Math.floor(secondaryCoordinate + primaryDist * multiplierToGetSecondary);

                //If a hit
                if (secondaryInt <= 0 || secondaryInt >= secondaryMaxLength || primaryInt <= 0 || primaryInt >= primaryMaxLength) {
                    break;
                }
                else if (getWallTypeAtIntLocation() !== WALL_TYPE_NONE) {
                    var distHit = primaryDist / divisorToGetDist;

                    //Return hit object
                    return { 
                        dist: distHit, 
                        wallType: getWallTypeAtIntLocation(), 
                        isHorizontalWall: onHorizontalWalls
                    };
                }
            }
        }

        //No hit found
        return { 
            dist: Infinity,
            wallType: null,
            horizontalWall: onHorizontalWalls
        };
    };
    
    self.drawLine = function (x1, y1, x2, y2, color) {
        canvasContext.beginPath();
        canvasContext.strokeStyle = color;
        canvasContext.moveTo(x1, y1);
        canvasContext.lineTo(x2, y2);
        canvasContext.stroke();
    };

    self.worldDrawnCallback = null;


    //////////////////////
    // CONSTRUCTOR CODE //
    //////////////////////

    (function () {
        executeAndScheduleTick(new Date().valueOf());
    })();


    /////////////////////
    // PRIVATE METHODS //
    /////////////////////
    
    function executeAndScheduleTick(lastTickTime) {
        
        //Schedule next tick
        var currentTickTime = new Date().valueOf();
        setTimeout(function () {
            executeAndScheduleTick(currentTickTime); 
        }, TICK_DELAY);

        //Draw
        drawScreen();
    }


    function getColumnDrawingValues(horizontalAngleRelativeToPlayer, verticalA) {

        //Get angle relative to world
        var horizontalAngleRelativeToWorld = playerA + horizontalAngleRelativeToPlayer;

        //Get wall hit
        var firstHit = getFirstHit(horizontalAngleRelativeToWorld)
        var firstHitDist = firstHit.dist;
        var firstHitWallType = firstHit.wallType;
        var isFirstHitHorizontalWall = firstHit.isHorizontalWall;

        //Correct distortion due to flat viewport
        var distFromViewport = firstHitDist * Math.cos(horizontalAngleRelativeToPlayer);

        //Get wall height on viewport
        var wallHeightOnViewport;
        if (distFromViewport != 0)
            wallHeightOnViewport = WALL_HEIGHT * VIEWPORT_HEIGHT_PIXELS / distFromViewport;
        else
            wallHeightOnViewport = VIEWPORT_HEIGHT_PIXELS;

        //Get wall position on viewport
        var wallTopOnViewport = (VIEWPORT_HEIGHT_PIXELS - wallHeightOnViewport) / 2;
        var wallBottomOnViewport = VIEWPORT_HEIGHT_PIXELS - wallTopOnViewport;
        wallTopOnViewport += playerVerticalA * VIEWPORT_HEIGHT_PIXELS;
        wallBottomOnViewport += playerVerticalA * VIEWPORT_HEIGHT_PIXELS;

        //Fix overflow
        if (wallTopOnViewport > VIEWPORT_HEIGHT_PIXELS)
            wallTopOnViewport = VIEWPORT_HEIGHT_PIXELS;
        if (wallBottomOnViewport > VIEWPORT_HEIGHT_PIXELS)
            wallBottomOnViewport = VIEWPORT_HEIGHT_PIXELS;
        if (wallTopOnViewport < 0)
            wallTopOnViewport = 0;
        if (wallBottomOnViewport < 0)
            wallBottomOnViewport = 0;

        //Return object
        return {
            firstHitWallType: firstHitWallType,
            isFirstHitHorizontalWall: isFirstHitHorizontalWall,
            distFromViewport: distFromViewport,
            wallTopOnViewport: wallTopOnViewport,
            wallBottomOnViewport: wallBottomOnViewport
        };
    }

    function drawScreen() {
        var facingWallType = self.getWallType(playerA, playerVerticalA);

        //For each viewport column
        for (var col = 0; col < VIEWPORT_WIDTH_PIXELS; col += COLUMN_WIDTH_PIXELS) {

            //Get coordinates for column
            var angleRelativeToPlayer = Math.atan((.5 - col / VIEWPORT_WIDTH_PIXELS) / VIEWPORT_DIST);
            var columnDrawingValues = getColumnDrawingValues(angleRelativeToPlayer, playerVerticalA);

            //Draw column
            drawColumn(col, columnDrawingValues.wallTopOnViewport, columnDrawingValues.wallBottomOnViewport, columnDrawingValues.firstHitWallType, columnDrawingValues.isFirstHitHorizontalWall, columnDrawingValues.distFromViewport * WALL_DISTANCE_SHADE, facingWallType);
        }                    

        //Draw overhead map
        if (drawMinimap) {
            let blockPixelsX = VIEWPORT_WIDTH_PIXELS / 12;
            let blockPixelxY = VIEWPORT_HEIGHT_PIXELS / 22;
            for (var row = 0; row < world.length; row++) {
                for (var col = 0; col < world[0].length; col++) {
                    var color = world[row][col] === 0 ? "#FFFFFF" : WALL_COLORS[world[row][col] - 1];
                    canvasContext.fillStyle = color;
                    canvasContext.fillRect(col * blockPixelsX, VIEWPORT_HEIGHT_PIXELS - row * blockPixelxY - blockPixelxY, blockPixelsX, blockPixelxY);
                    canvasContext.stroke();
                }
            }
            if (drawPlayerOnMinimap) {
                canvasContext.fillStyle = "#000000";
                canvasContext.fillRect(playerX * 10 - 1, VIEWPORT_HEIGHT_PIXELS - playerY * 10 - 1, 3, 3);
                canvasContext.stroke();
                var leftRayA = playerA + Math.atan(.5 / VIEWPORT_DIST);
                var leftRayX = playerX + 3 * Math.cos(leftRayA);
                var leftRayY = playerY + 3 * Math.sin(leftRayA);
                self.drawLine(playerX * 10, VIEWPORT_HEIGHT_PIXELS - playerY * 10, leftRayX * 10, VIEWPORT_HEIGHT_PIXELS - leftRayY * 10, "#BBBBBB");
                var rightRayA = playerA + Math.atan(-.5 / VIEWPORT_DIST);
                var rightRayX = playerX + 3 * Math.cos(rightRayA);
                var rightRayY = playerY + 3 * Math.sin(rightRayA);
                self.drawLine(playerX * 10, VIEWPORT_HEIGHT_PIXELS - playerY * 10, rightRayX * 10, VIEWPORT_HEIGHT_PIXELS - rightRayY * 10, "#BBBBBB");
            }
        }
        
        if (self.worldDrawnCallback !== null)
            self.worldDrawnCallback();
    }

    function getFirstHit(angle) {
        var hitX = self.getFirstHitForDirection(angle, false);
        var hitY = self.getFirstHitForDirection(angle, true);
        var isFirstHitHorizontalWall = hitY.dist < hitX.dist;
        return isFirstHitHorizontalWall ? hitY : hitX;
    }

    function drawColumn(col, wallTop, wallBottom, wallType, isHorizontalWall, wallShade, facingWallType) {

        //Get wall color
        var wallColor;
        if (wallType === facingWallType)
            wallColor = isHorizontalWall ? WALL_COLORS_FACING[wallType - 1] : VERTICAL_WALL_COLORS_FACING[wallType - 1];
        else
            wallColor = isHorizontalWall ? WALL_COLORS[wallType - 1] : VERTICAL_WALL_COLORS[wallType - 1];

        //Draw column
        self.drawLine(col, 0, col, wallTop, SKY_COLOR);
        self.drawLine(col, wallTop, col, wallBottom, shadeColor(wallColor, wallShade));
        self.drawLine(col, wallBottom, col, VIEWPORT_HEIGHT_PIXELS, GROUND_COLOR);
    }
    
    function shadeColor(color, percent) {
        
        //There is a bug where these are sometimes undefined when the player gets smashed
        //This is a hacky fix, that will hopefully be temporary
        if (!color)
            color = "#000000";
        if (!percent)
            percent = 1;

        //From: http://stackoverflow.com/questions/5560248/programmatically-lighten-or-darken-a-hex-color-or-rgb-and-blend-colors
        var num = parseInt(color.slice(1), 16), amt = Math.round(2.55 * percent), R = (num >> 16) + amt, G = (num >> 8 & 0x00FF) + amt, B = (num & 0x0000FF) + amt;
        return "#" + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 + (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 + (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
    }
};