import * as d3 from 'd3'
import ScrollMagic from 'scrollmagic'
import Boid from './boid'
import loadImage from './utils/load-image'
import * as $ from './utils/dom'
PIXI.utils.skipHello()

import sceneData from './data-scenes'
import ringData from './data-rings'

let renderer
let stage

// let nextPoint

const PI = Math.PI
const TWO_PI = Math.PI * 2

const debug = false
const GRID_RESOLUTION = 30

let chartSize = 0

const madeEl = d3.select('#made')
const madeProseEl = d3.select('.made__prose')
const madeVisEl = d3.select('.made__vis')
const chartEl = d3.select('.made__chart') 


let boids = []
let venues = []
let bands = []

let maxShows = 0

function setupDOM() {
	chartSize = Math.min(window.innerHeight * 0.8, chartEl.node().offsetWidth)
	renderer = PIXI.autoDetectRenderer(chartSize, chartSize, { 
		resolution: 2,
		transparent: true,
	})

	chartEl
		.style('width', `${chartSize}px`)
		.style('height', `${chartSize}px`)
	//Add the canvas to the HTML document
	chartEl.node().appendChild(renderer.view)

	//add svg
	chartEl.append('svg')

	renderer.view.style.width = `${chartSize}px`
	renderer.view.style.height = `${chartSize}px`

	//Create a container object called the `stage`
	stage = new PIXI.Container()

	// debug
	// nextPoint = new PIXI.Graphics()
	// stage.addChild(nextPoint)
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
			.attr('class', (d, i) => `ring ring-${i} ring-${d.term}`)
			.classed('is-hidden', (d, i) => true)

	ringEnter.append('path')
		.attr('id', (d, i) => `text-${i}`)
		.attr('transform', `translate(${outerRadius}, ${outerRadius})`)
		.attr('d', d => arc({ innerRadius: 0, outerRadius: outerRadius * d.factor + TEXT_chartSize }))

	ringEnter.append('text')
		.style('text-anchor','middle')
		.attr('transform', `translate(0,-${TEXT_chartSize * 0.25})`)
	  .append('textPath')
		.attr('xlink:href', (d, i) => `#text-${i}`)
		.attr('startOffset', '50%')
		.text(d => `${d.capacity}`)
}

function setupBoids() {
	const incScale = d3.scalePow().exponent(0.5)

	incScale.domain([1, maxShows])
	incScale.range([.002, .008])

	boids = bands.map((d, i) => {
		const sprite = PIXI.Sprite.fromImage('assets/circle-32.png')
		
		stage.addChild(sprite)

		const b = Boid({
			center: [chartSize / 2, chartSize / 2],
			inc: incScale(d.shows.length),
			data: d,
			sprite,
			ringData,
			chartSize,
		})

		return b
	})
}

function setupScroll() {
	const proseHeight = madeProseEl.node().offsetHeight
	const visHeight = madeVisEl.node().offsetHeight
	
	madeEl.style('height', `${proseHeight}px`)

	const controller = new ScrollMagic.Controller()
	const madeScene = new ScrollMagic.Scene({
		triggerElement: '#made',
		triggerHook: 0,
		duration: proseHeight - visHeight,
	})
	
	madeScene
		.on('enter', event => {
			madeVisEl.classed('is-fixed', true)
			madeVisEl.classed('is-bottom', false)

		})
		.on('leave', event => {
			madeVisEl.classed('is-fixed', false)
			madeVisEl.classed('is-bottom', event.scrollDirection === 'FORWARD')
		})
		.on('progress', event => {
			// console.log(event)
			// render()
		})
		.addTo(controller)

	const triggerScenes = $.selectAll('.made__prose .trigger').map((el, i) => {
		const scene = new ScrollMagic.Scene({
			triggerElement: el,
		})
		
		scene.on('enter', event => {
			updateScene(i)
		})
		.on('leave', event => {
			updateScene(Math.max(0, i - 1))
		})
		.addTo(controller)
		
		return scene
	})
}

function updateScene(index) {
	const scene = sceneData[index]
	// const { id, tier, size } = scene

	// toggle text labels
	const ring = d3.selectAll('.ring')
	if (scene === 'explore') ring.classed('is-hidden', true)
	else ring.classed('is-hidden', (d, i) => i + 3 > index)

	let i = boids.length
	while (i--) {
		const b = boids[i]
		b.setScene(scene)
	}
}
	
	// if (tier) {
	// 	if (tier > 0) {
	// 		const filtered = boids.filter(b => {
	// 			const data = b.getData()
	// 			return data.tier >= tier
	// 		})

	// 		filtered.forEach(b => {
	// 			b.setSize(size)
	// 			b.setPath(tier)
	// 		})
	// 	} else {
	// 		// reset?
	// 		const filtered = boids.filter(b => {
	// 			const data = b.getData()
	// 			return data.tier > 0
	// 		})

	// 		filtered.forEach(b => {
	// 			b.setSize(size)
	// 			b.setPath(tier)
	// 		})
	// 	}
	// }

	// if (id === 'explore') {
	// 	boids.forEach(b => {
	// 		// TODO come on man
	// 		b.setPath(3)
	// 	})
	// }

function render() {
	// let i = 1
	let i = boids.length
	// const grid = d3.range(GRID_RESOLUTION).map(d => d3.range(GRID_RESOLUTION).map(d => []))
	while (i--) {
		const b = boids[i]
		
		// const loc = b.getLocation()
		// const x = Math.floor(loc[0] / chartSize * GRID_RESOLUTION)
		// const y = Math.floor(loc[1] / chartSize * GRID_RESOLUTION)
		// grid[x][y].push(b)

		b.applyBehaviors()
		b.update()
		
		const pos = b.getLocation()
		const x = pos[0]
		const y = pos[1]
		
		const sprite = b.getSprite()
		sprite.position.set(x, y)
		// debug
		// const pp = b.getPathPoint()
		// nextPoint.clear()
		// nextPoint.beginFill(0xFF0000)
		// nextPoint.drawCircle(pp[0],pp[1], 3)
		// nextPoint.endFill()	
	}
	
	// let x = GRID_RESOLUTION
	// while(x--) {
	// 	let y = GRID_RESOLUTION
	// 	while(y--) {
	// 		// if (debug) {
	// 		// 	ctx.strokeStyle = '#ccc'
	// 		// 	ctx.strokeRect(x / GRID_RESOLUTION * chartSize, y / GRID_RESOLUTION * chartSize, chartSize / GRID_RESOLUTION, chartSize / GRID_RESOLUTION)
	// 		// }
	// 		renderGrid(grid[x][y])
	// 	}
	// }

	renderer.render(stage)
	
	requestAnimationFrame(render)
	// setTimeout(render, 1000)
}


function init(data) {
	venues = data.venues
	bands = data.bands
		
	maxShows = d3.max(bands, d => d.shows.length)

	setupDOM()
	setupText()
	setupBoids()
	setupScroll()
	render()
}


export default { init }
