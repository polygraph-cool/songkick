import * as d3 from 'd3'
import vec2 from 'gl-matrix-vec2'
const PI = Math.PI
const TWO_PI = Math.PI * 2

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
	let mass
	let maxspeed
	let maxforce
	let radius
	let velocity
	let path
	let pathPoints
	let pathScale
	let center
	let special
	let specialCenter
	let wanderTheta = Math.random() * TWO_PI

	let xPos
	let yPos
	let counter
	let inc
	let r
	let circle
	let sprite
	let targs

	const setMass = (m) => {
		mass = m
		radius = m
		maxspeed = inc * 500
		maxforce = m * 0.1
	}

	const setScale = (s) => {
		sprite.scale.set(s, s)
	}

	const setPath = (factor, chartSize) => {
		const NUM_PATH_POINTS = 64
		path = d3.range(NUM_PATH_POINTS).map(d => {
			const angle = d / NUM_PATH_POINTS * Math.PI * 2
			const x = Math.cos(angle) * chartSize / 2 * factor
			const y = Math.sin(angle) * chartSize / 2 * factor
			return { x: chartSize / 2 + x, y: chartSize / 2 + y }
		})

		pathPoints = path.length
		pathScale = d3.scaleQuantile().domain([-PI, PI]).range(d3.range(-pathPoints / 2, pathPoints / 2, 1))
	}

	const setSpecial = (mass, center) => {
		special = !!mass
		if (special) {
			setMass(mass)
			specialCenter = center
		}
	}

	const getLocation = () => {
		return location
	}

	const getPos = () => {
		return [xPos, yPos]
	}

	const getSpecial = () => {
		return special
	}

	const getRadius = () => {
		return radius
	}

	const getSprite = () => {
		return sprite
	}

	const getPathPoint = () => {
		return targs
		// return path[debugPathPoint]
	}

  	const applyBehaviors = (boids) => {
		// follow force
		// console.log(velocity)
		// let f = special ? followSpecial() : follow2()
		let f = follow2()
		// const separate force
		// const s = separate(boids)
		// const s = separate2()
		/* Scale up forces to produce stronger impact */
		vec2.scale(f, f, 1 / mass)
		// vec2.scale(s, s, 1)

		/* Calculate the average force */
		// const forces = vec2.add(vec2.create(), f, s)

		// vec2.scale(forces, forces, 1 / mass)

		// if (special) {
		// 	const diff = location[0] - specialCenter + location[1] - specialCenter
		// 	if ( diff > 3) {
		// 		applyForce(f)
		// 	} else {
		// 		location[0] = specialCenter
		// 		location[1] = specialCenter
		// 	}
		// } else {
		// 	// /* Apply force */
			// applyForce(forces)	
		// }
		applyForce(f)
	}
	
	const applyForce = (force) => {
		vec2.add(acceleration, acceleration, force)
  	}

	const update = (override) => {
		if (override) {
			counter += inc
			const tX = center[0] + Math.cos(counter) * circle
			const tY = center[1] + Math.sin(counter) * circle
			
			const dir = Math.random() < 0.5 ? 1 : -1
			wanderTheta += Math.random() * 0.05
			const x = Math.cos(wanderTheta) * 10
			const y = Math.sin(wanderTheta) * 10
			// console.log(x)
			// const x = 0
			// const y = 0

			xPos = tX + x
			yPos = tY + y
		}
		
		/**
		* New location = current location + (velocity + acceleration) limited by maximum speed
		* Reset acceleration to avoid permanent increasing
		*/
		vec2.add(velocity, velocity, acceleration);
		vec2.limit(velocity, velocity, maxspeed);
		vec2.add(location, location, velocity);

		accelerationVec.set([0, 0]);

		acceleration = accelerationVec;
	}

	const followSpecial = () => {
		const target = vec2.fromValues(specialCenter, specialCenter)
		return seek(target)
	}

	const follow2 = () => {
		const rad = Math.atan2(location[0] - center[0], location[1] - center[1])

		const scaled = pathScale(rad)
		const quarter = pathPoints / 4
		const half = pathPoints / 2
		let final = 0
		if (scaled < 0) {
			final = quarter - scaled
		} else {
			if (scaled > quarter) final = (pathPoints - quarter) + (half - scaled)
			else final = quarter - scaled
		}

		targs = path[final]	
		final = final < pathPoints - 2 ? final + 1 : 0
		
		const tX = path[final + 1].x - sprite.width / 2
		const tY = path[final + 1].y - sprite.height / 2
		// const target = vec2.fromValues(path[final][0], path[final][1])
		

		// counter += inc
		// const tX = center[0] + Math.cos(rad + 1) * circle
		// const tY = center[1] + Math.sin(rad + 1) * circle
		
		// const dir = Math.random() < 0.5 ? 1 : -1
		// wanderTheta += Math.random() * 0.05
		// const x = Math.cos(wanderTheta) * 5
		// const y = Math.sin(wanderTheta) * 5
		const x = 0
		const y = 0

		targs = [tX + x, tY + y] 
		const target = vec2.fromValues(targs[0], targs[1])
		return seek(target)
	}
	/*
	* @param {Object} path Instance of Path object including path points
	*
	* @returns {Array} Path following behavior
	*/
	const follow = () => {
		// console.log(velocity)
		/** Predict future location */
		predict.set(velocity);

		vec2.normalize(predict, predict);
		vec2.scale(predict, predict, 25);

		predictLoc.set([0, 0]);

		vec2.add(predictLoc, predictLoc, location);
		vec2.add(predictLoc, predictLoc, predict);

		/** Define things */
		var target = null;
		var worldRecord = 1000000; // Will be updated with shortest distance to path. Start with a very high value.

		/** Loop through each point of the path */
		let i = path.length
		while(i--) {
		  /** Get current and next point of the path */
		  a.set(path[i]);
		  b.set(path[(i + 1) % path.length]);

		  /** Calculate a normal point */
		  var normalPoint = getNormalPoint(predictLoc, a, b);
		  /** Calculate direction towards the next point */
		  dir.set(b);

		  vec2.sub(dir, dir, a);

		  /**
		   * Set a normal point to the end of the current path segment and
		   * recalculate direction if the vehicle is not within it
		   */
		  if (normalPoint[0] < Math.min(a[0], b[0]) || normalPoint[0] > Math.max(a[0], b[0]) ||
			  normalPoint[1] < Math.min(a[1], b[1]) || normalPoint[1] > Math.max(a[1], b[1])) {

			normalPoint.set(b);

			a.set(path[(i + 1) % path.length]);
			b.set(path[(i + 2) % path.length]);

			dir.set(b);
			vec2.sub(dir, dir, a);
		  }

		  /** Get a distance between future location and normal point */
		  var d = vec2.dist(predictLoc, normalPoint);

		  /** Calculate steering target for current path segment if the vehicle is going in segment direction */
		  if (d < worldRecord) {
			worldRecord = d;
			target = normalPoint;

			vec2.normalize(dir, dir);
			vec2.scale(dir, dir, 25);
			vec2.add(target, target, dir);
		  }
		}

		/**
		 * Steer if the vehicle is out of the 1/5 of the path's radius
		 * Do not steer otherwise
		 *
		 * Using a part of path's radius creates kind of non-straightforward movement
		 * Instead of "in tube" movement when object bounces from path edges
		 */
		if (worldRecord > path.radius / 5) {
		  return seek(target);
		} else {
		  followVec.set([0, 0]);

		  return followVec;
		}
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
  const seek = (target) => {
	vec2.sub(target, target, location)
	return steer(target)
  }

  /**
   * Check for nearby vehicles and produce steering away behavior
   *
   * @function
   * @memberOf Boid
   *
   * @param {Array} boids A list of vehicles
   *
   * @returns {Array} Steering away/bouncing off behavior
   */
	const separate = (boids) => {
		let desiredSeparation = radius * 2.25
		let count = 0

		steerVec.set([0, 0])

		/** Loop through each vehicle */
		let i = boids.length
		while (i--) {
			let other = boids[i]
			let d = location

			  /** Get distance between current and other vehicle */
			  d = vec2.dist(d, other.getLocation());

			  /** Do stuff if the vehicle is not current one and the other one is within specified distance */
			  if ((d > 0) && (d < desiredSeparation)) {
				var diff

				diffVec.set([0, 0])

				diff = vec2.sub(diffVec, location, other.getLocation()) // Point away from the vehicle

				vec2.normalize(diff, diff)
				vec2.scale(diff, diff, 1 / d) // The closer the other vehicle is, the more current one will flee and vice versa
				vec2.add(steerVec, steerVec, diff)

				count++
			}
		}

		/** Get average steering vector */
		if (count > 0) {
		  vec2.scale(steerVec, steerVec, 1 / count)
		}

		/** Bounce! Steer away */
		if (vec2.len(steerVec) > 0) {
		  steer(steerVec)
		}

		return steerVec
	}

	const separate2 = () => {
		const dir = Math.random() < 0.5 ? 1 : -1
		wanderTheta += Math.random() * 0.01 * dir
		const x = Math.cos(wanderTheta)
		const y = Math.sin(wanderTheta)
		const target = vec2.fromValues(x, y)
		// russ
		const norm = vec2.create()
		vec2.normalize(norm, velocity)
		vec2.add(target, target, norm)

		const scaleVec = vec2.fromValues(radius, radius)
		vec2.multiply(target, target, scaleVec)
		return steer(target)
	}
  /**
   * Implement Craig Reynolds' steering algorithm
   *
   * @function
   * @memberOf Boid
   *
   * @param {Array} target Point on the path or vector where vehicle is steering to
   *
   * @returns {Array} Steering behavior
   */
	const steer = (target) => {
		var steer;

		vec2.normalize(target, target);
		vec2.scale(target, target, maxspeed);

		steer = target;

		vec2.sub(steer, steer, velocity);
		vec2.limit(steer, steer, maxforce);

		return steer;
	}

	const init = () => {
		xPos = 0
		yPos = 0
		counter = -PI / 2 + Math.random() * TWO_PI
		inc = opts.inc
		// circle = opts.circle

		location = opts.location
		velocity = vec2.fromValues(1, 1)
		center = opts.center
		sprite = opts.sprite

		setMass(opts.mass)

		return {
			setMass,
			setScale,
			setPath,
			setSpecial,
			getLocation,
			getRadius,
			getSpecial,
			applyBehaviors,
			update,
			index: opts.index,
			getPos,
			getSprite,
			getPathPoint,
		}
	}

	return init()
}

export default Boid
