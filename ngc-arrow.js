/* global angular */
(function () {
    'use strict';

    /**
     * Directive for "canvas-arrow"
     * 
     * This directive adds an absolute positioned canvas to the parent element
     * and draws the arrows within this canvas. The size of the canvas is
     * dynamically calculated so it is always big enough to draw all arrows.
     *
     * Attributes:
     * color - set color of for all arrows, default = lightgrey
     * width - set line width for all arrows, default = 2
     * segments - set segments for dashed line, default = 0 (solid)
     * from-element - identifier for the start element
     * from-orientation - border of the element from which the arrow should start
     * from-offset-x - vertical offset of the starting point, default = 0
     * from-offset-y - horizontal offset of the starting point, default = 0
     * to-element - identifier for the pointing element
     * to-orientation - border of the element to which the arrow points
     * to-offset-x - vertical offset of the end point, default = 0
     * to-offset-y - horizontal offset of the end point, default = 0
     * damper - damper for calculating the quadratic curve angle, default = 1
     */
    angular
        .module('ngc.arrow', [])
        .directive('canvasArrow', CanvasArrow);

    CanvasArrow.$inject = ["$window"];

    function CanvasArrow ($window) {
        return {
            restrict: 'AE',
            replace: true,
            template: '<canvas style="position: fixed; top: 0px; left: 0px; z-index: 2147483646; pointer-events: none;"></canvas>',
            link: linkFn
        };
        
        function linkFn (scope, element, attrs) {
            var canvas = angular.element(element);
    
            // Define arrow config
            var segmentLength = parseInt(attrs.segments) || 0;
            var arrowConfig = {
                lineDash: [segmentLength, segmentLength],
                lineWidth: parseInt(attrs.width) || 2,
                lineColor: attrs.color || 'lightgrey'
            };
    
            // Resize and draw once and then on every window.resize event
            resizeCanvas(canvas);
            drawAllArrows(canvas, arrowConfig, getArrowsCoordinates);
            angular.element($window).resize(function () {
                resizeCanvas(canvas);
                drawAllArrows(canvas, arrowConfig, getArrowsCoordinates);
            });
            angular.element($window).scroll(function () {
                resizeCanvas(canvas);
                drawAllArrows(canvas, arrowConfig, getArrowsCoordinates);
            });
            
            // Define function to get coordinates for all arrows
            function getArrowsCoordinates () {
                var fromCoordinages = getCoordinates(
                    angular.element(attrs.fromElement),
                    attrs.fromOrientation,
                    parseInt(attrs.fromOffsetX) || 0,
                    parseInt(attrs.fromOffsetY) || 0);
                            
                var toCoordinates = getCoordinates(
                    angular.element(attrs.toElement),
                    attrs.toOrientation,
                    parseInt(attrs.toOffsetX) || 0,
                    parseInt(attrs.toOffsetY) || 0);
                            
                var curveAngleCoordinates = getQuadraticCurveAngle(
                    fromCoordinages,
                    toCoordinates,
                    parseFloat(attrs.dampener) || 1);
                            
                var arrowCoordinates = {
                    from: fromCoordinages,
                    to: toCoordinates,
                    angle: curveAngleCoordinates
                };

                return [arrowCoordinates];
            };
        }
            
        /**
        * Resize the canvas.
        */
        function resizeCanvas (canvas) {
            canvas.attr("width", $window.innerWidth);
            canvas.attr("height", $window.innerHeight);
        }
    
        /**
        * Redraw the canvas.
        */
        function drawAllArrows (canvas, config, getArrowCoordinates) {
            var ctx = canvas.get(0).getContext("2d");
            getArrowCoordinates().forEach(function (arrowCoordinates) {
                drawArrow(
                    ctx,
                    arrowCoordinates.from,
                    arrowCoordinates.to,
                    arrowCoordinates.angle,
                    config
                );
            });
        }
    
        function drawArrow (ctx, from, to, quadraticCurveAngle, config) {
            ctx.strokeStyle = config.lineColor;
    
            // Draw line
            ctx.save();
            ctx.setLineDash(config.lineDash);
            ctx.lineWidth = config.lineWidth;
            ctx.beginPath();
            ctx.moveTo(from.x, from.y);
            ctx.quadraticCurveTo(quadraticCurveAngle.x, quadraticCurveAngle.y, to.x, to.y);
            ctx.stroke();
            ctx.closePath();
            ctx.restore();
    
            // Draw head
            ctx.save();
            ctx.lineWidth = config.lineWidth + 1;
            ctx.beginPath();
            var unitVector = buildUnitVector({
                x: to.x - quadraticCurveAngle.x,
                y: to.y - quadraticCurveAngle.y
            });
            var fixPoint = {
                x: to.x + unitVector.x * 8,
                y: to.y + unitVector.y * 8
            };
            ctx.translate(fixPoint.x, fixPoint.y);
            ctx.moveTo(0, 0);
            ctx.rotate(45 * Math.PI / 180);
            ctx.lineTo((to.x - fixPoint.x) * 1.4, (to.y - fixPoint.y) * 1.4);
            ctx.stroke();
            ctx.closePath();
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.rotate(-90 * Math.PI / 180);
            ctx.lineTo((to.x - fixPoint.x) * 1.4, (to.y - fixPoint.y) * 1.4);
            ctx.stroke();
            ctx.closePath();
            ctx.restore();
        }
    
        // ***** Helper functions for coordinate calculation *****
    
        /**
        * This method calculates coordinates based on a element and some
        * additional instructions within a specified container element
        */
        function getCoordinates (element, orientation, offsetX, offsetY) {    
            var x = element.offset().left;
            if (orientation === "right") {
                x += element.outerWidth(true);
            } else if (orientation !== "left") {
                x += element.outerWidth() / 2;
            }
            x += offsetX;
    
            var y = element.offset().top - $window.scrollY;
            if (orientation === "bottom") {
                y += element.outerHeight(true);
            } else if (orientation !== "top") {
                y += element.outerHeight() / 2;
            }
            y += offsetY;
    
            return { x: x, y: y };
        }
    
        /**
        * This method calculates an angle for the quadratic curve calculation
        * for a given vector specified by two points.
        *
        * @param {float} damper - manipulate the curve shape. The value 1 results in a
        * round curve. A lower value flatens the curve and a higher value creates
        * a more elliptic shape. A negative value inverts the curve.
        */
        function getQuadraticCurveAngle (from, to, damper) {
            var halfArrowVector = {
                x: 0.5 * (to.x - from.x),
                y: 0.5 * (to.y - from.y)
            };
            
            var rotatedHalfArrowVector = {
                x: damper * -halfArrowVector.y,
                y: damper * halfArrowVector.x
            };
            
            return {
                x: from.x + halfArrowVector.x + rotatedHalfArrowVector.x,
                y: from.y + halfArrowVector.y + rotatedHalfArrowVector.y
            };
        }
        
    }

    // ***** Helper functions for mathematical calculations *****

    /**
     * Returns the unit vector of a given vector
     */
    function buildUnitVector (vector) {
        var vNorm = vectorNorm(vector);
        var unitVector = {
            x: vector.x /= vNorm,
            y: vector.y /= vNorm
        };
        return unitVector;
    }

    /**
     * Returns the norm of a given vector
     */
    function vectorNorm (vector) {
        return Math.sqrt(sq(vector.x) + sq(vector.y));
    }

    /**
     * Returns the square of a given value
     */
    function sq (x) {
        return x * x;
    }

})();