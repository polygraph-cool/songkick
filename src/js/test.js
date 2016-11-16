import * as d3 from 'd3'

let chartSize = 0

const madeEl = d3.select('#made')
const madeProseEl = d3.select('.made__prose')
const madeVisEl = d3.select('.made__vis')
const chartEl = d3.select('.made__chart') 
// const canvas = chartEl.select('canvas')
// const ctx = canvas.node().getContext('2d')

let venues = []
let bands = []


function setupDOM() {
	// chartSize = Math.min(window.innerHeight * 0.8, chartEl.node().offsetWidth)
	
	// chartEl
	// 	.style('width', `${chartSize}px`)
	// 	.style('height', `${chartSize}px`)
	
	// canvas
	// 	.attr('width', chartSize * 2)
	// 	.attr('height', chartSize * 2)
	// 	.style('width',`${chartSize}px`)
	// 	.style('height',`${chartSize}px`)	

	// ctx.scale(2, 2)
}

function setupChart() {
	//Create the renderer
	chartSize = Math.min(window.innerHeight * 0.8, chartEl.node().offsetWidth)
	
	const renderer = PIXI.autoDetectRenderer(chartSize, chartSize, { 
		// antialias: true,
		transparent: true,
	})

	//Add the canvas to the HTML document
	chartEl.node().appendChild(renderer.view)

	//Create a container object called the `stage`
	const stage = new PIXI.Container()
	
	var totalSprites = 6000

	var sprites = new PIXI.ParticleContainer(totalSprites, {
		position: true,
		alpha: true,
		scale: true,
	})

	stage.addChild(sprites)

	// // create an array to store all the sprites
	const circles = []

	for (var i = 0; i < totalSprites; i++) {
	    // create a new Sprite
	    // const circle = new PIXI.Graphics()
	    const circle = PIXI.Sprite.fromImage('assets/filled_circle.png')
	
		// circle.beginFill(0xFFFFFF)
		// circle.drawCircle(0, 0, 2)
		// circle.endFill()
		circle.scale.set(0.5, 0.5)
		circle.x = Math.random() * chartSize
		circle.y = Math.random() * chartSize

	    // finally we push the dude into the maggots array so it it can be easily accessed later
	    circles.push(circle)

	    sprites.addChild(circle)
	}
	

	// const graphics = new PIXI.Graphics()

	

		//Tell the `renderer` to `render` the `stage`
	

	function animate() {
		circles.forEach(c => {
			c.position.x += Math.random() * 4 - 2
	    	c.position.y += Math.random() * 4 - 2	
		})
	    
	    renderer.render(stage)
	    requestAnimationFrame( animate )
	}

	animate()
}


const init = (data) => {
	bands = data.bands
	venues = data.venues
	setupDOM()
	setupChart()
}

export default { init }
