import * as d3 from 'd3'
import ScrollMagic from 'scrollmagic'
import Boid from './boid'
import loadImage from './utils/load-image'
import * as $ from './utils/dom'
import isMobile from './utils/is-mobile'
import './utils/find-index'
import Audio from './audio'
PIXI.utils.skipHello()

import sceneData from './data-scenes'
import ringData from './data-rings'

const texture = PIXI.Texture.fromImage('assets/circle-24.png')
let renderer
let stage

const PI = Math.PI
const TWO_PI = Math.PI * 2
const NUM_SMALL_CONTAINERS = 10
const BREAKPOINT = 768

const debug = false
let nextPoint

let chartSize = 0
let numBoidsBig = 0
let numBoidsSmall = 0
let currentSceneIndex = 0

let currentSceneId = null
let currentSceneBand = null
let currentBandEl = null
let currentMode = null

let inView = true

const madeEl = d3.select('#made')
const madeProseEl = d3.select('.made__prose')
const madeVisEl = d3.select('.made__vis')
const chartEl = d3.select('.made__chart') 
const bandTriggerEl = d3.selectAll('.trigger.band') 

const INTRO_GRAFS = madeProseEl.selectAll('.lead').size()

let boidsSmall = []
let boidsBig = []

let bigBandIndexes = {}
let venues = []
let bands = []

let bigBandIds = []

let notSmallList = []
let smalls
let otherContainer
let rightOffset
let mobile


function setupDOM() {
	const outerWidth = d3.select('body').node().offsetWidth
	const total = d3.select('#made').node().offsetWidth
	const prose = madeProseEl.node().offsetWidth


	mobile = outerWidth < BREAKPOINT

	const w = mobile ? total : total - prose
	chartSize = Math.floor(Math.min(window.innerHeight * 0.8, w))	
	rightOffset = Math.floor((outerWidth - total) / 2)
	
	madeVisEl.style('width', `${w}px`)
	
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

	// Create a container object called the `stage`
	stage = new PIXI.Container()
	
	smalls = d3.range(NUM_SMALL_CONTAINERS).map(d => ({
		container: new PIXI.Container(),
		speed: d * 0.0002 + 0.001,
	}))
	smalls.forEach(d => stage.addChild(d.container))
	
	otherContainer = new PIXI.Container()
	stage.addChild(otherContainer)
		
	setAlpha(1, 0.5)
	// debug
	// nextPoint = new PIXI.Graphics()
	// stage.addChild(nextPoint)
}

function setupHeightHack() {
	if (isMobile.any()) {
		madeProseEl.selectAll('.trigger')
			.style('height', 'auto')
		
		madeProseEl.selectAll('.trigger:not(.lead):not(.band):not(.big)')
			.style('margin-bottom', `${window.innerHeight}px`)
		
		const numBands = bandTriggerEl.size()
		bandTriggerEl.filter((d, i) => i === numBands - 1)
			.style('margin-bottom', `${window.innerHeight / 2}px`)
		
		madeVisEl
			.style('height', `${window.innerHeight}px`)
	}
}

function setAlpha(otherVal, smallVal) {
	// console.log(otherVal, smallVal)
	otherContainer.alpha = otherVal
	smalls.forEach(d => {
		d.container.alpha = smallVal
	})
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

function setupImages() {
	d3.selectAll('.trigger.band').each(function() {
		const sel = d3.select(this)
		sel.select('p').append('img')
			.attr('src', 'http://placehold.it/100x100.jpg')
	})
}

function setupBigBoids() {
	bands.filter(d => d.tier > 0).forEach((d, i) => {
		const container = new PIXI.Container()
		const sprite = new PIXI.Sprite(texture)

		let text
		if (d.tier === 2) {
			text = new PIXI.Text(d.name)
			container.addChild(text)
		}

		container.addChild(sprite)

		// don't add to container since not small
		const containerIndex = null
		otherContainer.addChild(container)
		
		boidsBig.push(Boid({
			data: d,
			container,
			containerIndex,
			sprite,
			text,
			ringData,
			chartSize,
			mobile,
		}))

		if (d.tier === 2) bigBandIndexes[`id-${d.id}`] = i
	})

	numBoidsBig = boidsBig.length
}

function setupBoidsSmall() {

	bands.filter(d => d.tier === 0).forEach((d, i) => {
		const container = new PIXI.Container()
		const sprite = new PIXI.Sprite(texture)

		// no text
		let text = null
		
		container.addChild(sprite)

		// add to container for groupings
		const containerIndex = Math.floor(Math.random() * NUM_SMALL_CONTAINERS)
		
		smalls[containerIndex].container.addChild(container)

		boidsSmall.push(Boid({
			data: d,
			container,
			containerIndex,
			sprite,
			text,
			ringData,
			chartSize,
			mobile,
		}))
	})

	texture.baseTexture.dispose()
	numBoidsSmall = boidsSmall.length
	setupSmallContainers()
}

function setupSmallContainers() {
	smalls.forEach(d => {
		const bounds = d.container.getLocalBounds()

		const offX = chartSize / 2
		const offY = chartSize / 2
		
		d.container.position.set(offX, offY)
	})
}

function setupScroll() {
	const proseHeight = madeProseEl.node().offsetHeight
	const visHeight = madeVisEl.node().offsetHeight
	
	// madeEl.style('height', `${proseHeight}px`)
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
			madeVisEl.style('right', `${rightOffset}px`)

		})
		.on('leave', event => {
			madeVisEl.classed('is-fixed', false)
			madeVisEl.classed('is-bottom', event.scrollDirection === 'FORWARD')
			madeVisEl.style('right', `0`)
		})
		.addTo(controller)

	// to start/stop rendering for full view
	const madeScene2 = new ScrollMagic.Scene({
		triggerElement: '#made',
		triggerHook: 0,
		duration: proseHeight,
	})

	madeScene2
		.on('enter', event => {
			inView = true
			render()

		})
		.on('leave', event => {
			inView = false
		})
		.addTo(controller)


	const triggerScenes = d3.selectAll('.made__prose .trigger').each(function(d, i) {
		const el = this
		const sel = d3.select(this)
		let triggerHook = 0.5
		if (mobile && sel.classed('band')) triggerHook = 0.05
		
		const scene = new ScrollMagic.Scene({
			triggerElement: el,
			duration: el.offsetHeight,
			triggerHook,
		})
		
		scene.on('enter', event => {
			currentSceneIndex = i
			currentSceneId = sel.attr('data-id')
			currentSceneBand = sel.attr('data-band')
			
			// focus if band
			if (sel.classed('band')) {
				bandTriggerEl.classed('is-focus', false)
				sel.classed('is-focus', true)
				currentBandEl = sel
			}

			if (currentSceneId === 'big' || currentSceneId === 'remainder') bandTriggerEl.classed('is-focus', false)
			// hack
			// if (i > 3) setAlpha(0.75, 0.25)
			// else setAlpha(1, 0.5)
			updateScene()
		})
		.addTo(controller)
		
		return scene
	})
}

function updateScene() {
	// toggle text labels
	const ring = d3.selectAll('.ring')
	if (currentSceneId === 'explore') ring.classed('is-hidden', true)
	else ring.classed('is-hidden', (d, i) => i + INTRO_GRAFS > currentSceneIndex)

	const toMedium = ['big', 'band', 'remainder']
	const scene = toMedium.indexOf(currentSceneId) > -1 ? 'medium': currentSceneId
	
	
	boidsBig.forEach(d => d.setScene(scene))

	// pause audio
	if (currentSceneId !== 'band') Audio.pause()


	// special case
	if (currentSceneId === 'band') {
		Audio.play(currentBandEl.select('.btn__audio').node())

		const foundIndex = bigBandIds.findIndex(d => d === currentSceneBand)
		let remove
		let add
		if (foundIndex > -1) {
			const notSame = bigBandIds[bigBandIds.length - 1] !== currentSceneBand
			if (notSame) remove = bigBandIds.pop()
		} else {
			add = currentSceneBand
			bigBandIds.push(currentSceneBand)
		}
		// loop through big bands and update
		bigBandIds.forEach(d => {
			const index = bigBandIndexes[`id-${d}`]
			boidsBig[index].enterBig()
		})
		
		if (add) boidsBig[bigBandIndexes[`id-${add}`]].enterBig(true)
		
		if (remove) {
			boidsBig[bigBandIndexes[`id-${remove}`]].exitBig()
			if (bigBandIds.length) {
				const id = bigBandIds[bigBandIds.length - 1]
				boidsBig[bigBandIndexes[`id-${id}`]].toggleText(true)
			}
		}
	} else if (currentSceneId === 'remainder') {
		for (let d in bigBandIndexes) {
			const index = bigBandIndexes[d]
			boidsBig[index].enterBig()
		}
	} else if (currentSceneId === 'big') {
		bigBandIds = []
	} else if (currentSceneId === 'medium') {
		setAlpha(1, 0.5)
	} else if (currentSceneId === 'small') {
		setAlpha(1, 0.5)
	} else {
		setAlpha(1, 0.5)
	}
}
	
function render() {
	let indexBig = numBoidsBig
	while (indexBig--) {
		boidsBig[indexBig].applyBehaviors()
		boidsBig[indexBig].update()	
	}

	// rotate smalls
	smalls.forEach(d => {
		d.container.rotation += d.speed
	})
	
	renderer.render(stage)
	if (inView) requestAnimationFrame(render)
}

function init(data, cb) {
	// TODO on resize too
	// const proseHeight = madeProseEl.node().offsetHeight
	// const visHeight = madeVisEl.node().offsetHeight
	// madeEl.style('height', `${proseHeight}px`)

	venues = data.venues
	bands = data.bands

	// put special street on top
	// const specialIndex = bands.findIndex(d => d.id === '1077331')
	const specialIndex = bands.findIndex(d => d.id === '6775814')
	const special = bands.splice(specialIndex, 1)
	bands.push(special[0])

	

	setupDOM()
	setupHeightHack()
	setupText()
	render()
	setupBigBoids()
	setupBoidsSmall()
	setupScroll()
	Audio.setup()

	cb()
	
}


export default { init }
