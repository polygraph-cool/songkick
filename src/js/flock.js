import vec2 from 'gl-matrix-vec2'
import Path from './path'
import Boid from './boid'
import loadImage from './utils/load-image'

const debug = false
const NUM_BOIDS = 2600
const PATH_POINTS = 16
const GRID_RES = 30

let chartSize = 0

const chartEl = d3.select('.made__chart') 
const canvas = chartEl.select('canvas')
const ctx = canvas.node().getContext('2d')

const ringData = [{
	capacity: '500 person capacity',
	factor: 0.9,
},{
	capacity: '1,000',
	factor: 0.6,
},{
	capacity: '10,000',
	factor: 0.3,
}]

let paths = []
let boids = []
let circleImg = null
let redImg = null

function setupDOM() {
	chartSize = Math.min(window.innerHeight * 0.8, chartEl.node().offsetWidth)
	
	chartEl
		.style('width', `${chartSize}px`)
		.style('height', `${chartSize}px`)
	
	canvas
		.attr('width', chartSize * 2)
		.attr('height', chartSize * 2)
		.style('width',`${chartSize}px`)
		.style('height',`${chartSize}px`)	

	ctx.scale(2, 2)
}

function setupText() {
	const svg = chartEl.select('svg')
	//Create the SVG
	svg
		.attr('width', chartSize)
		.attr('height', chartSize)
	
	const TEXT_chartSize = 12
	
	const outerRadius = chartSize / 2
	const startY = chartSize / 2
	const endY = startY

	const arc = d3.arc()
		.startAngle(Math.PI)
		.endAngle(Math.PI * 3)

	const ring = svg.selectAll('.ring').data(ringData)

	const ringEnter = ring.enter()
		.append('g')
			.attr('class', (d, i) => `ring ring-${i}`)
			.classed('is-hidden', (d, i) => i)

	ringEnter.append('path')
		.attr('id', (d, i) => `text-${i}`)
		.attr('transform', `translate(${outerRadius}, ${outerRadius})`)
		// .attr('d', `M${d.startX},${startY} A${1},${1} 0 0,1 ${d.endX},${endY}`)
		.attr('d', d => arc({ innerRadius: 0, outerRadius: outerRadius * d.factor + TEXT_chartSize }))
		// .style('fill', 'none')
		// .style('stroke', '#ccc')
		// .style('stroke-dasharray', '5,5')

	ringEnter.append('text')
		.style('text-anchor','middle')
		// .attr('y', TEXT_chartSize)
		.attr('transform', `translate(0,-${TEXT_chartSize * 0.25})`)
	  .append('textPath')
		.attr('xlink:href', (d, i) => `#text-${i}`)
		.attr('startOffset', '50%')
		.text(d => `${d.capacity}`)
}

function setupPath(path, factor) {
	path.radius = 20
	d3.range(PATH_POINTS).forEach(d => {
		const angle = d / PATH_POINTS * Math.PI * 2
		const x = Math.cos(angle) * chartSize / 2 * factor
		const y = Math.sin(angle) * chartSize / 2 * factor
		// console.log(x, y)
		path.addPoint(chartSize / 2 + x, chartSize / 2 + y)
	})
}

function setupPaths() {
	paths = ringData.map(d => {
		const p = new Path(ctx)
		setupPath(p, d.factor)
		return p
	})
}

function setupBoids() {
	boids = d3.range(NUM_BOIDS).map(i => {
		const mass = 2
		const angle = Math.random() * Math.PI * 2

		const x = Math.cos(angle) * chartSize * ringData[0].factor / 2 + chartSize / 2
	  	const y = Math.sin(angle) * chartSize * ringData[0].factor / 2 + chartSize / 2
	  	const location = vec2.fromValues(x, y)
		return Boid({
			index: i,
			location,
			mass,
			path: paths[0],
			center: [chartSize / 2, chartSize / 2],
		})
	})
}

function setupAudio() {
	const el = d3.select('.audio') 
	const ca = el.select('canvas')
	const ct = ca.node().getContext('2d')
	
	ca
		.attr('width', 200)
		.attr('height', 200)
		.style('width', '200px')
		.style('height', '200px')

	var context = new (window.AudioContext || window.webkitAudioContext)();
	var analyser = context.createAnalyser();
	var audioElement = document.createElement('audio')

	audioElement.src = 'assets/potus.mp3'
	audioElement.addEventListener("canplay", function() {
		var source = context.createMediaElementSource(audioElement);
		// Connect the output of the source to the input of the analyser
		source.connect(analyser);

		// Connect the output of the analyser to the destination
		analyser.connect(context.destination);

		// console.log(analyser.fftSize); // 2048 by default
		// console.log(analyser.frequencyBinCount); // will give us 1024 data points

		analyser.fftSize = 64;
		var frequencyData = new Uint8Array(analyser.frequencyBinCount);
		var objectsCount = frequencyData.length

		function update() {
			// Get the new frequency data
			analyser.getByteFrequencyData(frequencyData);

			ct.clearRect(0, 0, 200, 200)
			for (var i = 0; i < objectsCount; i++) {
				var factor = frequencyData[i] / 256 * 100
				// factor = 50
				var change = i / objectsCount * Math.PI * 2
			  	var x = Math.cos(change) * factor
			  	x = i * 2
			  	var y = Math.sin(change) * factor
			  	y = factor
			  	ct.fillStyle = 'blue'
			  	ct.fillRect(100 + x, 100+ y, 2, 2)
			  	// console.log(i, change)
			}

			// Schedule the next update
			requestAnimationFrame(update)
		}

		update()
		audioElement.play()
	});

}

function recolor(img, {r, b, g, t}) {
	const imgCanvas = document.createElement('canvas')
	const imgCtx = imgCanvas.getContext('2d')
	imgCanvas.width = img.width
	imgCanvas.height = img.height

	imgCtx.drawImage(img, 0, 0)
	const imgData = imgCtx.getImageData(0, 0, imgCanvas.width, imgCanvas.height)
	const data = imgData.data
	const len = data.length

	for (let i = 0; i < len;) {
    	data[i] = data[i++] * (1 - t) + (r * t)
    	data[i] = data[i++] * (1 - t) + (g * t)
    	data[i] = data[i++] * (1 - t) + (b * t)
    	i++
	}
	imgCtx.putImageData(imgData, 0, 0)

	// imgCtx.drawImage(img, 0, 0)
	// imgCtx.globalCompositeOperation = 'source-in'
	// imgCtx.fillStyle = color
	// imgCtx.rect(0, 0, canvas.width, canvas.height);
	// imgCtx.fill()
	
	const output = new Image()
	output.src = imgCanvas.toDataURL()
	return output
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
	    const img = b.index === 0 ? redImg : circleImg
		ctx.drawImage(img, loc[0] - r, loc[1] - r, r * 2, r * 2)
	}
}

function render() {
	ctx.clearRect(0, 0, chartSize, chartSize)

	let i = NUM_BOIDS
	
	const grid = d3.range(GRID_RES).map(d => d3.range(GRID_RES).map(d => []))
	while (i--) {
		const b = boids[i]
		const loc = b.getLocation()
		const x = Math.floor(loc[0] / chartSize * GRID_RES)
		const y = Math.floor(loc[1] / chartSize * GRID_RES)
		grid[x][y].push(b)
	}

	let x = GRID_RES
	while(x--) {
		let y = GRID_RES
		while(y--) {
			if (debug) {
				ctx.strokeStyle = '#ccc'
				ctx.strokeRect(x / GRID_RES * chartSize, y / GRID_RES * chartSize, chartSize / GRID_RES, chartSize / GRID_RES)	
			}
			
			renderGrid(grid[x][y])
		}
	}
	if (debug) {
		d3.range(PATH_POINTS).forEach(d => {
			const angle = d / PATH_POINTS * Math.PI * 2
			const x = Math.cos(angle) * chartSize / 2 * 0.9
			const y = Math.sin(angle) * chartSize / 2 * 0.9
			ctx.fillStyle = 'red'
			ctx.fillRect(
				chartSize / 2 + x,
				chartSize / 2 + y,
				4,
				4,
			)
		})
	}
	
	requestAnimationFrame(render)
	// setTimeout(render, 500)
}

function getBoidX(d) {
	return d.getLocation()[0]
}

function getBoidY(d) {
	return d.getLocation()[1]
}

function init() {
	setupDOM()
	setupPaths()
	setupText()
	setupBoids()
	setTimeout(setupAudio, 1000)

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
		redImg = recolor(img, { r: 250, g: 0, b: 0, t: 1 })
		render()
	})
}


export default { init }
