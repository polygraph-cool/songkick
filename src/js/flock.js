// http://glmatrix.net/docs/vec2.html
import Vic from 'victor'

let time0 = Date.now()
let time1 = null
const fps = d3.select('.fps')

let boids = []
let canvas = null
let context = null
const width = 720
const height = 480



const targetMouse = new Vic(width / 2, height / 2)
let timer = null

let count = 0


const setupCanvas = () => {
	const test = d3.select('.test')
	canvas = test.append('canvas')
	context = canvas.node().getContext('2d')
	
	canvas.style('width', `${width}px`)
	canvas.style('height', `${height}px`)
	canvas.attr('width', width)
	canvas.attr('height', height)
}

const update = () => {
  
	count++
	// console.log(target.toString())
	context.clearRect(0, 0, width, height)

	boids.forEach(v => {
		v.update(targetMouse.clone())
		const {x, y} = v.getLocation()
		context.fillRect(x, y, 2, 2)
		
	})
	time1 = Date.now()
	fps.text(Math.round(1000 / (time1 - time0)))
	time0 = time1
	// if (count > 10) timer.stop()
}

const limit = (vector, max) => {
	const clone = vector.clone()
	const mag = clone.magnitude()
	if (mag < max) {
		return clone
	} else {
		const factor = 1 / (mag / max)
		return clone.multiply(new Vic(factor, factor))
	}
}

const createBoid = () => {
	let location = new Vic(Math.random() * width, Math.random() * height)
	let velocity = new Vic(0, 0)
	let acceleration = new Vic(0, 0)
	
	const maxSpeed = 2 + Math.random() * 4
	let speed = new Vic(maxSpeed, maxSpeed)
	const maxForce = Math.random() * 0.05 + 0.01
	const dist = 50
	const scale = d3.scaleLinear().domain([0, dist]).range([0, maxSpeed])

	
	const update = (target) => {
		seek(target)
		move()
	}

	const applyForce = (force) => {
		acceleration.add(force)
	}

	const seek = (target) => {
		const desired = target
			.subtract(location)
		
		const mag = desired.magnitude()
		const norm = desired.normalize()

		const factor = mag < dist ? scale(mag) : maxSpeed
		// console.log(factor)
		const actual = norm.multiply(new Vic(factor, factor)) 

		const steer = actual.subtract(velocity)
		const limited = limit(steer, maxForce)

		applyForce(limited)
	}

	const move = () => {
		// console.log(acceleration.x)
		velocity.add(acceleration)
		velocity = limit(velocity, maxSpeed)
		location.add(velocity)
		// why?
		acceleration.x = 0 
		acceleration.y = 0
	}

	const getLocation = () => {
		return location
	}

	return { update, getLocation }
}


const init = () => {
	setupCanvas()
	boids = d3.range(1000).map(d => {
		return createBoid(d)
	})
	// console.log(boids)

	canvas.on('mousemove', function() {
		const pos = d3.mouse(this)
		targetMouse.x = pos[0]
		targetMouse.y = pos[1]
		// console.log(targetMouse.x)
	})

	timer = d3.timer(update)
}

export default { init }