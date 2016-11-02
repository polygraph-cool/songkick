import vec2 from 'gl-matrix-vec2'
import Path from './path'
import Vehicle from './vehicle'

let clickCount = 0
let time0 = Date.now()
let time1 = null
const fps = d3.select('.fps')

/** Init scene */
const canvas = document.querySelector('.flock2')
const ctx = canvas.getContext('2d')

let WIDTH = 500
let HEIGHT = 500

canvas.width = WIDTH
canvas.height = HEIGHT

const setupPath = (path, factor) => {
	/** Set path radius */
	path.radius = 20

	/** Define path points */
	const setPoints = () => {
	  const num = 10
	  d3.range(num).forEach(d => {
	  	const angle = d / num * Math.PI * 2
	  	const x = Math.cos(angle) * WIDTH * factor / 2
	  	const y = Math.sin(angle) * HEIGHT * factor / 2
	  	// console.log(x, y)
	  	path.addPoint(WIDTH / 2 + x, HEIGHT / 2 + y)
	  })
	}

	/** Add points to the path */
	setPoints()
}

const init = () => {

	/** Create an instance of Path object */
	const path = new Path(ctx)
	setupPath(path, 0.9)

	const path2 = new Path(ctx)
	setupPath(path2, 0.6)

	const path3 = new Path(ctx)
	setupPath(path3, 0.3)

	/** Define vehicles list and push number of Vehicle object instances passing random location and mass */
	var vehicles = [];

	for (var i = 0; i < 500; i++) {
	  var mass = 2

		var vehicle = new Vehicle(
			vec2.fromValues(WIDTH / 2, HEIGHT / 2),
			mass,
			WIDTH,
			HEIGHT,
			ctx,
		)

	  vehicles.push(vehicle);
	}

	/** Specify what to draw */
	function draw() {
	  'use strict';

	  /** Clear canvas */
	  ctx.fillStyle = '#fff'
	  ctx.fillRect(0, 0, WIDTH, HEIGHT)

	  /** Render the path */
	  // path.display();
	  // path2.display();
	  // path3.display();

	  /**
	   * Loop through each vehicle passing vehicles list and path to calculate things
	   * Update and render vehicle
	   */
	  for (var i = 0; i < vehicles.length; i++) {
	  	var p = path
	  	if (i < clickCount) {
	  		p = path2
	  	} 
	  	if (clickCount > 20 && i === 0) {
	  		p = path3
	  	}
	    vehicles[i].applyBehaviors(vehicles, p);
	    vehicles[i].run();
	  }
	  	
		time1 = Date.now()
		const fpsVal = Math.round(1000 / (time1 - time0))
		time0 = time1
		fps.text(fpsVal)
		
	  requestAnimationFrame(draw);
	}

	/** Start simulation */
	draw();

	// /** Handle things appropriately onresize */
	// function onResize() {
	//   'use strict';

	//   WIDTH = window.innerWidth;
	//   HEIGHT = window.innerHeight;

	//   canvas.width = WIDTH;
	//   canvas.height = HEIGHT;

	//   path.points = [];
	//   setPoints();
	// }

	// window.addEventListener('resize', onResize, false);

	window.addEventListener('click', () => {
		clickCount++
	})
}


export default { init }
