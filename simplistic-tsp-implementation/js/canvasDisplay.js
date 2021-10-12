// Basic explanation of lat/long -> https://laulima.hawaii.edu/access/content/group/dbd544e4-dcdd-4631-b8ad-3304985e1be2/book/chapter_1/longitude.htm
function vizualizeDataPoints() {
    let points = [];
    data.forEach(e => {
        points.push(e.from);
        points.push(e.to);
    });
    points = points.filter((v, i) => points.findIndex(o => o.name === v.name) === i);  //filter out duplicates

    // Defining the minimum and maximum in the map
    minLat = points.reduce((prev, curr) => prev.lat < curr.lat ? prev : curr).lat;
    minLong = points.reduce((prev, curr) => prev.long < curr.long ? prev : curr).long;
    maxLat = points.reduce((prev, curr) => prev.lat > curr.lat ? prev : curr).lat;
    maxLong = points.reduce((prev, curr) => prev.long > curr.long ? prev : curr).long;

    /**
     * Quick mapping explanation:
     *
     * Canvas x-axis -> longitude
     *  -> Value of the longitude is directly proportional to the x value on the canvas, which means:
     *      -> The higher the longitude: the further right in the canvas, the point has to be drawn
     * Canvas y-axis -> latitude
     *  -> Value of the latitude is indirectly proportional to the y value on the canvas, which means:
     *      -> The higher the latitude: the further up in the canvas, the point has to be drawn
     *
     * Min/Max definitions:
     * -> The minimum value of lat AND long is mapped to the bottom left corner of the canvas.
     * -> The maximum value of lat AND long is on the top right of the canvas.
     *
     * ###################################
     * #                               * #  <-- Maximum lat and long
     * #                                 #
     * #                                 #
     * #                                 #
     * #                                 #
     * # * <-- Minimum lat and long      #
     * ###################################
     */

    // console.log('minLat', minLat);       // @Debug
    // console.log('minLong', minLong);     // @Debug
    // console.log('maxLat', maxLat);       // @Debug
    // console.log('maxLong', maxLong);     // @Debug

    //Set up canvas:

    for (const p of points) {
        drawDataPoint(p, dpContext);
    }

}

/**
 * Draws a line between to provided x and y coordinates in a also provided context.
 * @param fromX The x-coordinate of the origin point.
 * @param fromY The y-coordinate of the origin point.
 * @param toX The x-coordinate of the destination point.
 * @param toY The y-coordinate of the destination point.
 * @param ctx The drawing context.
 * @param color Optional: The color of the stroke to be drawn.
 */
function drawLine(fromX, fromY, toX, toY, ctx, color) {
    ctx.beginPath();
    ctx.moveTo(fromX, fromY);
    ctx.lineTo(toX, toY);
    ctx.lineWidth = POINT_STROKE_WIDTH;
    ctx.strokeStyle = (color) ? color : POINT_STROKE_COLOR;
    ctx.fillStyle = "green";
    ctx.stroke();
}

/**
 * Draws a circle, of which the center is defined by x and y coordinates.
 * @param x X-coordinate of the circle center.
 * @param y Y-coordinate of the circle center.
 * @param context A 2D context of a html canvas object.
 * @param radius Optional: The circle radius in pixels.
 * @param color Optional: The circle fill color. (hex color: #FFFFFF)
 * @param stroke_color Optional: Stroke color.
 * @param line_width Optional: Stroke line width.
 */
function drawPoint(x, y, context, radius, color, stroke_color, line_width) {
    context.beginPath();
    context.arc(x, y, (radius) ? radius : POINT_RADIUS, 0, 2 * Math.PI, false);
    context.fillStyle = (color) ? color : POINT_COLOR;
    context.fill();
    context.lineWidth = (line_width) ? line_width : POINT_STROKE_WIDTH;
    context.strokeStyle = (stroke_color) ? stroke_color : POINT_STROKE_COLOR;
    context.stroke();
}

/**
 * Draws a data point based on it's lat and long coordinates which are mapped to the available canvas space.
 * @param point The point to be drawn.
 * @param context The context to be drawn in.
 */
function drawDataPoint(point, context) {
    const pointX = Math.floor(map(point.long, minLong, maxLong, CANVAS_PADDING, context.canvas.width - CANVAS_PADDING)); //x axis calculation
    const pointY = Math.floor(map(point.lat, maxLat, minLat, CANVAS_PADDING, context.canvas.height - CANVAS_PADDING)); //y axis calculation

    dataPoints.push({
        name: point.name,
        x: pointX,
        y: pointY
    })

    // Debug
    // console.log("-----------Point-------------")
    // console.log("# City Name: ", point.name);
    // console.log("# Canvas Width: ", context.canvas.width);
    // console.log("# Canvas Height: ", context.canvas.height);
    // console.log("# minLong: ", minLong);
    // console.log("# maxLong: ", maxLong);
    // console.log("# minLat: ", minLat);
    // console.log("# maxLat: ", maxLat);
    // console.log("# point.long: ", point.long);
    // console.log("# point.lat: ", point.lat);
    // console.log("# Long -> X: ", map(point.long, minLong, maxLong, 0, (context.canvas.width - CANVAS_PADDING)));
    // console.log("# Lat -> Y: ", map(point.lat, maxLat, minLat, 0, (context.canvas.height - CANVAS_PADDING)));

    drawPoint(
        pointX,
        pointY,
        context
    );

    context.fillText(
        point.name,
        pointX - Math.floor(context.measureText(point.name).width / 2),
        pointY + (POINT_RADIUS / 2) + (POINT_STROKE_WIDTH * 2) + 20
    );
}

let drawingCounter = 0;

/**
 * Draws a complete path on the canvas.
 * @param path A string array with the data point names.
 * @param ctx The canvas context to be drawn in.
 * @param color The path draw color.
 */
function drawPaths(path, ctx, color) {
    drawingCounter++;

    ctx.canvas.width = ctx.canvas.width;
    for (let i = 0; i < path.length - 1; i++) {
        drawPath(path[i], path[i+1], ctx, color);

        setTimeout(() => {
            drawingCounter--;
        }, DRAW_TIMEOUT * drawingCounter);
    }
}

/**
 * Draws a path from a given city to a given city, defined by their name.
 * @param nameFrom City name from.
 * @param nameTo City name to.
 * @param ctx The canvas context to be drawn in.
 * @param color The path draw color.
 */
function drawPath(nameFrom, nameTo, ctx, color) {
    let from = dataPoints.find(o => o.name === nameFrom);
    let to = dataPoints.find(o => o.name === nameTo);

    drawLine(from.x, from.y, to.x, to.y, ctx, color);
}