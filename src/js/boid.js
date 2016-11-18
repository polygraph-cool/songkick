import * as d3 from 'd3'
import vec2 from 'gl-matrix-vec2'
// import sceneData from './data-scene'

const PI = Math.PI
const TWO_PI = Math.PI * 2
const NUM_PATH_POINTS = 64


// add limit function to vec library
vec2.limit = function(out, v, high) {
	let x = v[0]
	let y = v[1]

	let len = x * x + y * y

	if (len > high * high && len > 0) {
		out[0] = x
		out[1] = y
		vec2.normalize(out, out)
		vec2.scale(out, out, high)
	}

	return out
}

const Boid = (opts) => {
	let accelerationVec = vec2.create()
	let acceleration = vec2.create()

	let location
	let maxspeed
	let maxforce
	let velocity
	
	let currentPath
	let paths
	let pathScale
	
	let center
	let currentTarget = vec2.create()
	
	let counter
	let inc
	
	let sprite
	let text
	let data

	let pack
	let isBig
	let isMedium
	let mode

	// let wanderTheta = Math.random() * TWO_PI

	let chartSize
	let currentSize
	let sizeAnimationRequest
	let stable


	// GETTERS
	const getLocation = () => location

	// const getRadius = () => radius

	const getSprite = () => sprite

	const getPathPoint = () => currentTarget

	const getData = () => data


	// SETTERS
	const setSize = (s, transition) => {
		if (transition) {
			cancelAnimationFrame(sizeAnimationRequest)
			transitionSize(s, Math.abs((s - currentSize) * 0.05))
		} else {
			currentSize = s
			sprite.width = s
			sprite.height = s
		}
		
		setMaxspeed(s)
	}

	const setMaxspeed = (size) => {
		maxspeed = mode !== 'default' ? 10 : inc * 300 * (Math.log(size) / 2 + 1)
		maxforce = maxspeed * 0.1
	}
		
	const setScene = ({ id, tier = 0, size = 2 }) => {
		switch (id) {
			case 'explore':
				mode = 'explore'
				stable = false
				const sz = Math.max(2, Math.floor(data.pR * pack.sizeAll * 2) - 2)
				pack.x = pack.sizeAll * data.pX
				pack.y = pack.sizeAll * data.pY
				pack.size = pack.sizeAll
				setSize(sz, true)
				break
			case 'medium':
				mode = 'default'
				stable = false
				if (isMedium) {
					currentPath = 1
					setSize(size, true)
				} else {

				}
				break
			case 'big':
				mode = 'default'
				stable = false
				if (isBig) {
					mode = 'big'
					const sz = Math.floor(data.bR * pack.sizeBig * 2) - 4
					pack.x = pack.sizeBig * data.bX
					pack.y = pack.sizeBig * data.bY
					pack.size = pack.sizeBig
					setSize(sz, true)
				} else {
					// yuck
					setMaxspeed(2)
				}
				break
			default:
				mode = 'default'
				currentPath = 0
				// only reset size if different
				if (currentSize !== size) setSize(size, true)
		}
	}


	const transitionSize = (goal, rate) => {
		const diff = goal - currentSize
		if (Math.abs(diff) <= rate * 2) {
			// done
			currentSize = goal
			sprite.width = currentSize
			sprite.height = currentSize
		} else {
			const dir = diff > 0 ? 1 : -1
			currentSize += rate * dir
			sprite.width = currentSize
			sprite.height = currentSize
			sizeAnimationRequest = requestAnimationFrame(() => transitionSize(goal, rate))
		}
	}

	const createPaths = (ringData, chartSize) => {
		pathScale = d3.scaleQuantile().domain([-PI, PI]).range(d3.range(-NUM_PATH_POINTS / 2, NUM_PATH_POINTS / 2, 1))

		paths = ringData.map((datum, i) => {
			let nextFactor = datum.factor
			if (i < ringData.length - 1) nextFactor = ringData[i + 1].factor

			const diff = (datum.factor - nextFactor) / 2
			const factor = Math.random() * diff + nextFactor + diff

			return d3.range(NUM_PATH_POINTS).map(d => {
				const angle = d / NUM_PATH_POINTS * Math.PI * 2
				const x = Math.cos(angle) * chartSize / 2 * factor
				const y = Math.sin(angle) * chartSize / 2 * factor
				return { x: chartSize / 2 + x, y: chartSize / 2 + y }
			})
		})
	}

  	const applyBehaviors = () => {
		// update currentTarget
		if (!stable) {
			if (mode === 'explore') followExplore()
			else if (mode === 'big') followBig()
			else follow()

			const f = seek(currentTarget)
			applyForce(f)	
		}
	}
	
	const applyForce = (force) => {
		vec2.add(acceleration, acceleration, force)
  	}

	const update = () => {
		if (!stable) {
			vec2.add(velocity, velocity, acceleration)
			vec2.limit(velocity, velocity, maxspeed)
			vec2.add(location, location, velocity)

			accelerationVec.set([0, 0])

			acceleration = accelerationVec	
		}
	}
	
	const follow = () => {
		const rad = Math.atan2(location[0] - center[0], location[1] - center[1])

		const scaled = pathScale(rad)
		const quarter = NUM_PATH_POINTS / 4
		const half = NUM_PATH_POINTS / 2
		let final = 0
		if (scaled < 0) {
			final = quarter - scaled
		} else {
			if (scaled > quarter) final = (NUM_PATH_POINTS - quarter) + (half - scaled)
			else final = quarter - scaled
		}

		final = final < NUM_PATH_POINTS - 2 ? final + 1 : 0
		
		const tX = paths[currentPath][final + 1].x - sprite.width / 2
		const tY = paths[currentPath][final + 1].y - sprite.height / 2
		
		const x = 0
		const y = 0
		vec2.set(currentTarget, tX + x, tY + y)
		// vec2.set(currentTarget, center[0], center[1])		
	}

	const followBig = () => {
		const x = center[0] + pack.x - pack.size / 2 - sprite.width / 2
		const y = center[1] + pack.y - pack.size / 2 - sprite.height / 2
		vec2.set(currentTarget, x, y)
	}

	const followExplore = () => {
		const x = center[0] + pack.x - pack.size / 2 - sprite.width / 2
		const y = center[1] + pack.y - pack.size / 2 - sprite.height / 2
		vec2.set(currentTarget, x, y)
	}

	const seek = (t) => {
	  	const tempTarget = vec2.clone(t)
	  	const desired = vec2.create()
		
		// mag
		const dist = vec2.dist(location, tempTarget)

		let scaleVec = vec2.create()

		let tempForce = maxforce
		if (dist < 50) {
			// get new force vector
			const s = dist / 4
			vec2.set(scaleVec, s, s)
			tempForce = maxforce * 100
		} else {
			vec2.set(scaleVec, maxspeed, maxspeed)
		}

		// console.log(scaleVec[0])


		// set desired
		vec2.sub(desired, tempTarget, location)

		// normalize desired
		vec2.normalize(desired, desired)

		
		vec2.multiply(desired, desired, scaleVec)

		// Steering = Desired minus Velocity
		const steer = vec2.create()
		vec2.sub(steer, desired, velocity)
	    
	    vec2.limit(steer, steer, tempForce)

	    if (dist < 0.5) {
	    	stable = true
	    }
    
		return steer
	}  

	const init = () => {
		counter = -PI / 2 + Math.random() * TWO_PI
		inc = opts.inc

		chartSize = opts.chartSize

		// init location
		const angle = Math.random() * Math.PI * 2
		const x = Math.cos(angle) * chartSize * opts.ringData[0].factor / 2 + chartSize / 2
	  	const y = Math.sin(angle) * chartSize * opts.ringData[0].factor / 2 + chartSize / 2
	  	
	  	location = vec2.fromValues(x, y)
		velocity = vec2.fromValues(0, 0)
		center = opts.center
		sprite = opts.sprite
		text = opts.text
		data = opts.data

		// pack

		pack = {
			sizeBig: data.bR ? opts.ringData[2].factor * chartSize : null,
			sizeAll: chartSize,
		}

		sprite.tint = 0XF2929D
		// sprite.tint = 0X47462F
		sprite.alpha = 0.5
		mode = 'default'
		setSize(2)

		currentPath = 0
		createPaths(opts.ringData, opts.chartSize)

		isBig = data.tier === 2
		isMedium = data.tier > 0
		mode = 'default'

		return {
			setScene,
			setSize,
			// setPath,

			getLocation,
			// getRadius,
			getData,
			getSprite,
			getPathPoint,

			applyBehaviors,
			update
			
		}
	}

	return init()
}

export default Boid
