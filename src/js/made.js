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

const PI = Math.PI
const TWO_PI = Math.PI * 2

const debug = false
let nextPoint

let chartSize = 0
let numBoids = 0

let currentSceneIndex = 0
let currentMode = null

const madeEl = d3.select('#made')
const madeProseEl = d3.select('.made__prose')
const madeVisEl = d3.select('.made__vis')
const chartEl = d3.select('.made__chart') 


let boids = []
let bigIds = []
let venues = []
let bands = []

let maxShows = 0

function setupDOM() {
	chartSize = Math.min(window.innerHeight * 0.8, chartEl.node().offsetWidth)
	renderer = PIXI.autoDetectRenderer(chartSize, chartSize, { 
		resolution: 2,
		transparent: true,
		// roundPixels: true,
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

	// Create a container object called the `stage`
	stage = new PIXI.Container()

	// debug
	nextPoint = new PIXI.Graphics()
	stage.addChild(nextPoint)
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
	// const incScale = d3.scalePow().exponent(0.5)

	// incScale.domain([1, maxShows])
	// incScale.range([0.005, 0.01])

	const texture = PIXI.Texture.fromImage('assets/circle-24.png')

	let count = bands.length
	let i = 0
	while(i < count) {
		const d = bands[i]
		const container = new PIXI.Container()
		const sprite = new PIXI.Sprite(texture)

		let text
		if (d.tier === 2) {
			text = new PIXI.Text(d.name)	
			container.addChild(text)
		}	
		
		container.addChild(sprite)
		
		stage.addChild(container)

		boids.push(Boid({
			// inc: incScale(d.shows.length),
			data: d,
			container,
			sprite,
			text,
			ringData,
			chartSize,
		}))

		if (d.tier === 2) bigIds.push(i)
		i++
	}
	
	texture.baseTexture.dispose()
	numBoids = boids.length
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
		.addTo(controller)

	const triggerScenes = $.selectAll('.made__prose .trigger').map((el, i) => {
		const scene = new ScrollMagic.Scene({
			triggerElement: el,
			duration: el.offsetHeight,
		})
		
		scene.on('enter', event => {
			currentSceneIndex = i
			updateScene()
		})
		.on('progress', event => {
			if (currentMode === 'big') {
				const { progress, scrollDirection } = event
				const total = bigIds.length
				const cur = Math.floor(progress * 1.1 * bigIds.length)
				let count = Math.min(cur, total)
				let i = 0
				while(i < total) {
					if (i < count) {
					// console.log(boids[bigIds[i]])
						const showText = i === count - 1
						boids[bigIds[i]].enterBig(showText)
					} else {
						boids[bigIds[i]].exitBig()
					}
					i++
				}
			}
		})
		.addTo(controller)
		
		return scene
	})
}

function updateScene() {
	currentMode = sceneData[currentSceneIndex].id
	console.log(currentMode)
	// toggle text labels
	const ring = d3.selectAll('.ring')
	if (sceneData[currentSceneIndex].id === 'explore') ring.classed('is-hidden', true)
	else ring.classed('is-hidden', (d, i) => i + 3 > currentSceneIndex)

	let i = numBoids
	while (i--) {
		if (currentMode === 'big') {
			// TODO yuck hack
			boids[i].setScene(sceneData[currentSceneIndex - 1])
		} else {
			boids[i].setScene(sceneData[currentSceneIndex])	
		}
	}
}
	
function render() {
	let i = numBoids
	
	while (i--) {
		boids[i].applyBehaviors()
		boids[i].update()
		
		// // debug
		// if (debug) {
		// 	const pp = boids[i].getPathPoint()
		// 	nextPoint.clear()
		// 	nextPoint.beginFill(0xFF0000)
		// 	nextPoint.drawCircle(pp[0],pp[1], 3)
		// 	nextPoint.endFill()
		// }
		
	}
	
	renderer.render(stage)
	requestAnimationFrame(render)
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
	let x = 0
	window.addEventListener('keyup', (e) => {
		e.preventDefault()
		currentSceneIndex++
		updateScene()

	})
	// setTimeout(() => {
	// 	updateScene(6)
	// }, 2000)
}


export default { init }
