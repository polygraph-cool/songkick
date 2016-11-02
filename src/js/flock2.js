import vec2 from 'gl-matrix-vec2'
import Path from './path'
import Boid from './boid'

let clickCount = 0
let time0 = Date.now()
let time1 = null
const fps = d3.select('.fps')

/** Init scene */
const canvas = document.querySelector('.flock2 canvas')
const ctx = canvas.getContext('2d')

let WIDTH = window.innerHeight * 0.8
let HEIGHT = window.innerHeight * 0.8

canvas.style.width = `${WIDTH}px`
canvas.style.height = `${HEIGHT}px`

canvas.width = WIDTH * 2
canvas.height = HEIGHT * 2

ctx.scale(2, 2)

const setupText = () => {
	const svg = d3.select('.flock2 svg')
	//Create the SVG
	svg
		.attr("width", WIDTH)
		.attr("height", HEIGHT)

	const f = 0.9				
	const startY = HEIGHT / 2
	const rad = HEIGHT / 2 * f
	const endY = HEIGHT / 2

	const startX = WIDTH * (1 - f) + 13
	const endX = WIDTH * f - 13

	const startX2 = WIDTH * (1 - 0.5) + 13
	const endX2 = WIDTH * 0.5 - 13

	const startX3 = WIDTH * (1 - 0.1) + 13
	const endX3 = WIDTH * 0.1 - 13

	// svg.append('path')
	// 	.attr('id', 'text-1')
	// 	.attr('d', `M${startX},${startY} A${1},${1} 0 0,1 ${endX},${endY}`)
	// 	.style('fill', 'none')
	// 	.style('stroke', '#AAAAAA')
	// 	.style('stroke-dasharray', '5,5')

	// svg.append('text')
	// 	.style('text-anchor','middle')
	//   .append('textPath')
	// 	.attr('xlink:href', '#text-1')
	// 	.attr('startOffset', '50%')
	// 	.text('Openers')

	// svg.append('path')
	// 	.attr('id', 'text-2')
	// 	.attr('d', `M${startX2},${startY} A${1},${1} 0 0,1 ${endX2},${endY}`)
	// 	.style('fill', 'none')
	// 	.style('stroke', '#AAAAAA')
	// 	.style('stroke-dasharray', '5,5')

	// svg.append('text')
	// 	.style('text-anchor','middle')
	//   .append('textPath')
	// 	.attr('xlink:href', '#text-2')
	// 	.attr('startOffset', '50%')
	// 	.text('Mid')

	// svg.append('path')
	// 	.attr('id', 'text-3')
	// 	.attr('d', `M${startX3},${startY} A${1},${1} 0 0,1 ${endX3},${endY}`)
	// 	.style('fill', 'none')
	// 	.style('stroke', '#AAAAAA')
	// 	.style('stroke-dasharray', '5,5')

	// svg.append('text')
	// 	.style('text-anchor','middle')
	//   .append('textPath')
	// 	.attr('xlink:href', '#text-3')
	// 	.attr('startOffset', '50%')
	// 	.text('Make it')

}

const setupPath = (path, factor) => {
	/** Set path radius */
	path.radius = 20

	/** Define path points */
	const setPoints = () => {
	  const num = 10
	  d3.range(num).forEach(d => {
	  	const angle = d / num * Math.PI * 2
	  	const x = Math.cos(angle) * WIDTH / 2 * factor
	  	const y = Math.sin(angle) * HEIGHT / 2 * factor
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
	setupPath(path2, 0.5)

	const path3 = new Path(ctx)
	setupPath(path3, 0.1)


	const NUM_BOIDS = 400

	const boids = d3.range(NUM_BOIDS).map(i => {
		const mass = 2
		const angle = Math.random() * Math.PI * 2
		const x = Math.cos(angle) * WIDTH * 0.9 / 2 + WIDTH / 2
	  	const y = Math.sin(angle) * HEIGHT * 0.9 / 2 + HEIGHT / 2
	  	const location = vec2.fromValues(x, y)
		return Boid({
			location,
			mass,
			path,
		})
	})

	/** Specify what to draw */
	function draw() {

	  /** Clear canvas */
		// ctx.fillStyle = 'rgba(255,255,255,0.3)'
		// ctx.fillRect(0, 0, WIDTH, HEIGHT)
		ctx.clearRect(0, 0, WIDTH, HEIGHT)

		/** Render the path */
		// path.display()
		// path2.display()
		// path3.display()

		let i = NUM_BOIDS
		while (i--) {
		    boids[i].applyBehaviors(boids)
		    boids[i].run()
		    
		    // draw boid
		    const loc = boids[i].getLocation()
		    const r = boids[i].getRadius()
			ctx.fillStyle = 'rgba(0,0,0,0.2)'
			// ctx.strokeStyle = 'rgba(0,0,0,0.2)'
			ctx.beginPath()
			ctx.arc(loc[0], loc[1], r, 0, Math.PI * 2, false)
			ctx.closePath()
			ctx.fill()
			// ctx.stroke()
		}
		  	
		time1 = Date.now()
		const fpsVal = Math.round(1000 / (time1 - time0))
		time0 = time1
		fps.text(fpsVal)

		requestAnimationFrame(draw)
	}

	/** Start simulation */
	draw();


	const tick = () => {
		clickCount++
		if (clickCount < 10) {
			boids[clickCount].setPath(path2)
			boids[clickCount].setMass(4)
			setTimeout(tick, 1000)
		} else {
			boids[1].setPath(path3)
			boids[1].setMass(7)
		}
	}

	setTimeout(tick, 4000)
	// window.addEventListener('click', () => {
	// 	clickCount++
	// })

	setupText()
}


export default { init }
