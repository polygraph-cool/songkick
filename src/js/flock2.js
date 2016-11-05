import vec2 from 'gl-matrix-vec2'
import Path from './path'
import Boid from './boid'
import loadImage from './utils/load-image'

const debug = true
const NUM_BOIDS = 1000
const PATH_POINTS = 16
const GRID_RES = 20

let clickCount = 0
let time0 = Date.now()
let time1 = null
const fps = d3.select('.fps')

const canvas = document.querySelector('.flock2 canvas')
const ctx = canvas.getContext('2d')

// let WIDTH = window.innerHeight * 0.5
// let HEIGHT = window.innerHeight * 0.5
let WIDTH = 600
let HEIGHT = 600

canvas.style.width = `${WIDTH}px`
canvas.style.height = `${HEIGHT}px`

canvas.width = WIDTH * 2
canvas.height = HEIGHT * 2

ctx.scale(2, 2)

const ringData = [{
	capacity: '500 person capacity',
	factor: 0.9,
},{
	capacity: '1,000',
	factor: 0.5,
},{
	capacity: '10,000',
	factor: 0.1,
}]

let paths = []
let boids = []
let quadtree = null
let circleImg = null

function setupText() {
	const svg = d3.select('.flock2 svg')
	//Create the SVG
	svg
		.attr("width", WIDTH)
		.attr("height", HEIGHT)
	
	const TEXT_SIZE = 12
	
	const outerRadius = WIDTH / 2
	const startY = HEIGHT / 2
	const endY = startY

	const arc = d3.arc()
		.startAngle(Math.PI)
		.endAngle(Math.PI * 3)

	const ring = svg.selectAll('.ring').data(ringData)

	const ringEnter = ring.enter()
		.append('g')
			.attr('class', 'ring')

	ringEnter.append('path')
		.attr('id', (d, i) => `text-${i}`)
		.attr('transform', `translate(${outerRadius}, ${outerRadius})`)
		// .attr('d', `M${d.startX},${startY} A${1},${1} 0 0,1 ${d.endX},${endY}`)
		.attr('d', d => arc({ innerRadius: 0, outerRadius: outerRadius * d.factor + TEXT_SIZE }))
		// .style('fill', 'none')
		// .style('stroke', '#ccc')
		// .style('stroke-dasharray', '5,5')

	ringEnter.append('text')
		.style('text-anchor','middle')
		// .attr('y', TEXT_SIZE)
		.attr('transform', `translate(0,-${TEXT_SIZE * 0.25})`)
	  .append('textPath')
		.attr('xlink:href', (d, i) => `#text-${i}`)
		.attr('startOffset', '50%')
		.text(d => `${d.capacity}`)
}

function setupPath(path, factor) {
	path.radius = 20
	d3.range(PATH_POINTS).forEach(d => {
		const angle = d / PATH_POINTS * Math.PI * 2
		const x = Math.cos(angle) * WIDTH / 2 * factor
		const y = Math.sin(angle) * HEIGHT / 2 * factor
		// console.log(x, y)
		path.addPoint(WIDTH / 2 + x, HEIGHT / 2 + y)
	})
}

function setupPaths() {
	paths = ringData.map(d => {
		const p = new Path(ctx)
		setupPath(p, d.factor)
		return p
	})
}

function renderGrid(grid) {
	let len = grid.length

	for(let i = 0; i < len; i++) {
		const b = grid[i]
		const loc = b.getLocation()
	    b.applyBehaviors(grid)
	    b.run()
	    
	    // render boid
	    const r = b.getRadius()
		// ctx.fillStyle = '#ccc'
		// ctx.beginPath()
		// ctx.arc(loc[0], loc[1], r, 0, Math.PI * 2, false)
		// ctx.closePath()
		// ctx.fill()
		ctx.drawImage(circleImg, loc[0] - r, loc[1] - r, r * 2, r * 2)
	}
}

function render() {
	ctx.clearRect(0, 0, WIDTH, HEIGHT)
	
	// quadtree = d3.quadtree(boids, getBoidX, getBoidY)
	// quadtree.extent([[0, 0], [WIDTH, HEIGHT]])
	// quadtree.visit((node, x0, y0, x1, y1) => {
	// 	ctx.strokeStyle = '#000'
	// 	ctx.strokeRect(x0, y0, x1 - x0, y1 - y0)
	// })

	let i = NUM_BOIDS
	

	// quadtree.visit((node, x0, y0, x1, y1) => {
	// 	if (node.length) console.log(node, x1-x0, y1-y0)
	// })
	const grid = d3.range(GRID_RES).map(d => d3.range(GRID_RES).map(d => []))
	while (i--) {
		const b = boids[i]
		const loc = b.getLocation()
		const x = Math.floor(loc[0] / WIDTH * GRID_RES)
		const y = Math.floor(loc[1] / WIDTH * GRID_RES)
		grid[x][y].push(b)
	}

	let x = GRID_RES
	while(x--) {
		let y = GRID_RES
		while(y--) {
			if (debug) {
				ctx.strokeStyle = '#ccc'
				ctx.strokeRect(x / GRID_RES * WIDTH, y / GRID_RES * HEIGHT, WIDTH / GRID_RES, HEIGHT / GRID_RES)	
			}
			
			renderGrid(grid[x][y])
		}
	}
	
	if (debug) {
		d3.range(PATH_POINTS).forEach(d => {
			const angle = d / PATH_POINTS * Math.PI * 2
			const x = Math.cos(angle) * WIDTH / 2 * 0.9
			const y = Math.sin(angle) * HEIGHT / 2 * 0.9
			ctx.fillStyle = 'red'
			ctx.fillRect(
				WIDTH / 2 + x,
				HEIGHT / 2 + y,
				4,
				4,
			)
		})
	}
	
	requestAnimationFrame(render)
	// setTimeout(render, 500)

}

function test(pX, pY) {
	const cX = WIDTH / 2
	const cY = HEIGHT / 2
	const r = WIDTH / 2 * 0.9
	
	const vX = pX - cX
	const vY = pY - cY

	const magV = Math.sqrt(vX * vX + vY * vY)
	const aX = cX + vX / magV * r
	const aY = cY + vY / magV * r
	return {x: aX, y: aY}
}
function setupBoids() {
	boids = d3.range(NUM_BOIDS).map(i => {
		const mass = 2
		const angle = Math.random() * Math.PI * 2

		const x = Math.cos(angle) * WIDTH * ringData[0].factor / 2 + WIDTH / 2
	  	const y = Math.sin(angle) * HEIGHT * ringData[0].factor / 2 + HEIGHT / 2
	  	const location = vec2.fromValues(x, y)
		return Boid({
			index: i,
			location,
			mass,
			path: paths[0],
		})
	})
}

function getBoidX(d) {
	return d.getLocation()[0]
}

function getBoidY(d) {
	return d.getLocation()[1]
}

function init() {

	setupPaths()
	setupText()
	setupBoids()

	const tick = () => {
		clickCount++
		if (clickCount < 10) {
			boids[clickCount].setPath(paths[1])
			boids[clickCount].setMass(7)
			setTimeout(tick, 1000)
		} else {
			boids[1].setPath(paths[2])
			boids[1].setMass(18)
		}
	}


	loadImage('assets/filled_circle.png', (err, img) => {
		circleImg = img
		render()
	})

	// setTimeout(tick, 4000)
	
	d3.select('.flock2 svg').on('click', function() {
		const m = d3.mouse(this)
		ctx.fillStyle = 'blue'
		ctx.fillRect(m[0], m[1], 3, 3)
		const near = test(m[0], m[1])
		ctx.fillStyle = 'green'
		ctx.fillRect(near.x, near.y, 6, 6)
	})
}


export default { init }
