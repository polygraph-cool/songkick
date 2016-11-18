import * as d3 from 'd3'
import vec2 from 'gl-matrix-vec2'
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
	let debugPathPoint
	let normalPoint
	let predict = vec2.create()
	let dir = vec2.create()

	let a = vec2.create()
	let b = vec2.create()
	let ap = vec2.create()
	let ab = vec2.create()
	let clonea = vec2.create()
	let predictLoc = vec2.create()
	let followVec = vec2.create()

	let accelerationVec = vec2.create()
	let steerVec = vec2.create()
	let diffVec = vec2.create()
	let acceleration = vec2.create()

	let location
	let maxspeed
	let maxforce
	let radius // TODO sync up with sprite size
	let velocity
	
	let currentPath = 0
	let paths
	let pathScale
	
	let center
	let currentTarget = vec2.create()
	
	let counter
	let inc
	let sprite
	let data

	let pack
	let special

	let wanderTheta = Math.random() * TWO_PI

	let chartSize

	const setSize = (s) => {
		sprite.width = s
		sprite.height = s
		radius = s / 2
		maxspeed = inc * 300 * (Math.log(s) / 2 + 1)
		maxforce = maxspeed * 0.1
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
	
	const setPath = (index) => {
		currentPath = index
		if (index === 2) {
			special = true	
			const sz = Math.floor(pack.r * 2) - 4
			setSize(sz)
			// const texture = PIXI.Texture.fromImage('assets/lake-street-dive.png')
			// sprite.texture = texture
			// sprite.interactive = true
			// sprite.on('mousemove', () => {
			// 	console.log('mousemove')
			// })
		} else {
			special = false
		}
	}

	const getLocation = () => location

	const getRadius = () => radius

	const getSprite = () => sprite

	const getPathPoint = () => currentTarget

	const getData = () => data

  	const applyBehaviors = (boids) => {
		// update currentTarget
		if (special) followSpecial()
		else follow()

		const f = seek(currentTarget)

		applyForce(f)
	}
	
	const applyForce = (force) => {
		vec2.add(acceleration, acceleration, force)
  	}

	const update = () => {
		/**
		* New location = current location + (velocity + acceleration) limited by maximum speed
		* Reset acceleration to avoid permanent increasing
		*/
		vec2.add(velocity, velocity, acceleration)
		vec2.limit(velocity, velocity, maxspeed)
		vec2.add(location, location, velocity)

		accelerationVec.set([0, 0])

		acceleration = accelerationVec
	}
	
	const followSpecial = () => {
		const x = center[0] + pack.x - pack.size / 2 - sprite.width / 2
		const y = center[1] + pack.y - pack.size / 2 - sprite.height / 2
		vec2.set(currentTarget, x, y)
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


  /**
   * Find normal point of the future location on current path segment
   *
   * @function
   * @memberOf Boid
   *
   * @param {Array} p Future location of the vehicle
   * @param {Array} a Start point of the path segment
   * @param {Array} b End point of the path segment
   *
   * @returns {Array} Normal point vec2
   */
	const getNormalPoint = (p, a, b) => {
		ap.set(p);
		ab.set(b);

		/** Perform scalar projection calculations */
		vec2.sub(ap, ap, a);
		vec2.sub(ab, ab, a);
		vec2.normalize(ab, ab);
		vec2.scale(ab, ab, vec2.dot(ap, ab));

		clonea.set(a)
		return vec2.add(vec2.create(), clonea, ab);
	}

  /**
   * Produce path following behavior
   *
   * @function
   * @memberOf Boid
   *
   * @param {Array} target Point on the path where vehicle is steering to
   *
   * @returns {Array} Path following behavior
   */
  const seek = (t) => {
  	const tempTarget = vec2.clone(t)
  	const desired = vec2.create()
	
	// mag
	const dist = vec2.dist(location, tempTarget)

	let scaleVec = vec2.create()

	let tempForce = maxforce
	if (dist < radius * 2) {
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
		data = opts.data

		// pack
		const size = opts.ringData[2].factor * chartSize

		if (data.bR) {
			pack = {
				size: size,
				x: size * data.bX,
				y: size * data.bY,
				r: size * data.bR,
			}
		}

		// sprite.tint = 0XF2929D
		// sprite.tint = 0X47462F
		// sprite.alpha = 0.5
		setSize(2)

		createPaths(opts.ringData, opts.chartSize)

		return {
			setSize,
			setPath,

			getLocation,
			getRadius,
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
