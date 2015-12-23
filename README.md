# Angular arrow directive

This directive enables you to draw arrows for product onboardings, tutorials, etc. in a declarative way.

## Example

    <canvas-arrow width="2" segments="4" dampener="-0.6" color="#1fbffb"
	    from-element="#from" from-orientation="right" from-offset-x="15"
	    to-element="#to" to-orientation="top" to-offset-y="-15">
    </canvas-arrow>

## How does it work?

The directive is creating a fixed HTML canvas on top of the page to draw the arrows. On every window resize or scroll event the coordinates gets recalculated and the arrows redrawn.

