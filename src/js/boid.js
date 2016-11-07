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

	const setMass = (m) => {
		mass = m
		radius = m
		maxspeed = Math.random() + 0.5
		maxforce = m * 0.1
	}

	const setPath = (p) => {
		path = p
		pathPoints = path.points.length
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

	const getSpecial = () => {
		return special
	}

	const getRadius = () => {
		return radius
	}

  	const applyBehaviors = (boids) => {
		// follow force
		// console.log(velocity)
		let f = special ? followSpecial() : follow2()
		// const separate force
		// const s = separate(boids)
		const s = separate2()

		/* Scale up forces to produce stronger impact */
		vec2.scale(f, f, 2)
		vec2.scale(s, s, 1)

		/* Calculate the average force */
		const forces = vec2.add(vec2.create(), f, s)

		vec2.scale(forces, forces, 1 / mass)

		if (special) {
			const diff = location[0] - specialCenter + location[1] - specialCenter
			if ( diff > 3) {
				applyForce(f)
			} else {
				location[0] = specialCenter
				location[1] = specialCenter
			}
		} else {
			// /* Apply force */
			applyForce(forces)	
		}
	}
	
	const applyForce = (force) => {
		vec2.add(acceleration, acceleration, force)
  	}

	const run = () => {
		update()
	}

	const update = () => {
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
		// TODO tons of stuff...
		const rad = Math.atan2(location[0] - center[0], location[1] - center[1])

		const scaled = pathScale(rad)
		const quarter = pathPoints / 4
		const half = pathPoints / 2
		let final = null
		if (scaled < 0) {
			final = quarter - scaled
		} else {
			if (scaled > quarter) final = (pathPoints - quarter) + (half - scaled)
			else final = quarter - scaled
		}
		const target = vec2.fromValues(path.points[final][0], path.points[final][1])
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
		let i = path.points.length
		while(i--) {
		  /** Get current and next point of the path */
		  a.set(path.points[i]);
		  b.set(path.points[(i + 1) % path.points.length]);

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

			a.set(path.points[(i + 1) % path.points.length]);
			b.set(path.points[(i + 2) % path.points.length]);

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
		wanderTheta += Math.random() * 0.1 * dir
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
		location = opts.location
		velocity = vec2.fromValues(1, 1)
		center = opts.center

		setMass(opts.mass)
		setPath(opts.path)

		return {
			setMass,
			setPath,
			setSpecial,
			getLocation,
			getRadius,
			getSpecial,
			applyBehaviors,
			run,
			index: opts.index,
		}
	}

	return init()
}

export default Boid
