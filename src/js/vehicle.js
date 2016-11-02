import vec2 from 'gl-matrix-vec2'

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

const Vehicle = function(opts) {
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

  this.location = opts.location
  this.mass = opts.mass
  this.maxspeed = Math.random() * this.mass / 2 + this.mass / 2
  this.maxforce = 1 / (this.mass * this.mass)
  this.radius = this.mass
  this.acceleration = vec2.create()
  this.velocity = vec2.fromValues(1, 1)

  /**
   * Manage behaviors
   *
   * @function
   * @memberOf Vehicle
   *
   * @param {Array} vehicles A list of vehicles
   * @param {Object} path Instance of Path object including path points
   */
  this.applyBehaviors = function (vehicles, path, col, m) {
	this.style = col
	this.mass = m
	this.radius = m
	var f = this.follow(path)
	var s = this.separate(vehicles)

	/** Scale up forces to produce stronger impact */
	vec2.scale(f, f, 1)
	vec2.scale(s, s, 1.2)

	/** Calculate the average force */
	var forces = vec2.add(vec2.create(), f, s)
	// var forces = f

	vec2.scale(forces, forces, 1/this.mass)

	/** Apply force */
	this.applyForce(forces)
  }

  /**
   * Apply force on the vehicle
   *
   * @function
   * @memberOf Vehicle
   *
   * @param {Array} force A force or an average force to apply on the vehicle
   */
  this.applyForce = function (force) {
	vec2.add(this.acceleration, this.acceleration, force);
  };

  /**
   * Run Vehicle loop
   *
   * @function
   * @memberOf Vehicle
   */
  this.run = function() {
	this.update();
	this.borders();
	this.render();
  }

  /**
   * Implement Craig Reynolds' path following algorithm
   * http://www.red3d.com/cwr/steer/PathFollow.html
   *
   * @function
   * @memberOf Vehicle
   *
   * @param {Object} path Instance of Path object including path points
   *
   * @returns {Array} Path following behavior
   */
  this.follow = function (path) {

	/** Predict future location */
	predict.set(this.velocity);

	vec2.normalize(predict, predict);
	vec2.scale(predict, predict, 25);

	predictLoc.set([0, 0]);

	vec2.add(predictLoc, predictLoc, this.location);
	vec2.add(predictLoc, predictLoc, predict);

	/** Define things */
	var target = null;
	var worldRecord = 1000000; // Will be updated with shortest distance to path. Start with a very high value.

	/** Loop through each point of the path */
	for (var i = 0, len = path.points.length; i < len; i++) {

	  /** Get current and next point of the path */
	  a.set(path.points[i]);
	  b.set(path.points[(i + 1) % path.points.length]);

	  /** Calculate a normal point */
	  var normalPoint = this.getNormalPoint(predictLoc, a, b);

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
	  return this.seek(target);
	} else {
	  followVec.set([0, 0]);

	  return followVec;
	}
  }

  /**
   * Find normal point of the future location on current path segment
   *
   * @function
   * @memberOf Vehicle
   *
   * @param {Array} p Future location of the vehicle
   * @param {Array} a Start point of the path segment
   * @param {Array} b End point of the path segment
   *
   * @returns {Array} Normal point vec2
   */
  this.getNormalPoint = function (p, a, b) {
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
   * Update vehicle's location
   *
   * @function
   * @memberOf Vehicle
   */
  this.update = function() {

	/**
	 * New location = current location + (velocity + acceleration) limited by maximum speed
	 * Reset acceleration to avoid permanent increasing
	 */
	vec2.add(this.velocity, this.velocity, this.acceleration);
	vec2.limit(this.velocity, this.velocity, this.maxspeed);
	vec2.add(this.location, this.location, this.velocity);

	accelerationVec.set([0, 0]);

	this.acceleration = accelerationVec;
  }

  /**
   * Produce path following behavior
   *
   * @function
   * @memberOf Vehicle
   *
   * @param {Array} target Point on the path where vehicle is steering to
   *
   * @returns {Array} Path following behavior
   */
  this.seek = function (target) {
	vec2.sub(target, target, this.location);

	return this.steer(target);
  };

  /**
   * Check for nearby vehicles and produce steering away behavior
   *
   * @function
   * @memberOf Vehicle
   *
   * @param {Array} boids A list of vehicles
   *
   * @returns {Array} Steering away/bouncing off behavior
   */
  this.separate = function (boids) {
	var desiredSeparation = this.radius * 2 + 2,
		count = 0,
		steer;

	steerVec.set([0, 0]);
	steer = steerVec;

	/** Loop through each vehicle */
	for (var i = 0, len = boids.length; i < len; i++) {
	  var other = boids[i],
		  d = this.location;

	  /** Get distance between current and other vehicle */
	  d = vec2.dist(d, other.location);

	  /** Do stuff if the vehicle is not current one and the other one is within specified distance */
	  if ((d > 0) && (d < desiredSeparation)) {
		var diff;

		diffVec.set([0, 0]);

		diff = vec2.sub(diffVec, this.location, other.location); // Point away from the vehicle

		vec2.normalize(diff, diff);
		vec2.scale(diff, diff, 1 / d); // The closer the other vehicle is, the more current one will flee and vice versa
		vec2.add(steer, steer, diff);

		count++;
	  }
	}

	/** Get average steering vector */
	if (count > 0) {
	  vec2.scale(steer, steer, 1 / count);
	}

	/** Bounce! Steer away */
	if (vec2.len(steer) > 0) {
	  this.steer(steer)
	}

	return steer
  }

  /**
   * Implement Craig Reynolds' steering algorithm
   *
   * @function
   * @memberOf Vehicle
   *
   * @param {Array} target Point on the path or vector where vehicle is steering to
   *
   * @returns {Array} Steering behavior
   */
  this.steer = function (target) {
	var steer;

	vec2.normalize(target, target);
	vec2.scale(target, target, this.maxspeed);

	steer = target;

	vec2.sub(steer, steer, this.velocity);
	vec2.limit(steer, steer, this.maxforce);

	return steer;
  }

  /**
   * Check if vehicle is going out of the scene
   *
   * @function
   * @memberOf Vehicle
   */
  this.borders = function() {
	if (this.location[0] < -this.radius) {
	  this.location[0] = opts.width + this.radius;
	}
	if (this.location[0] > opts.width + this.radius) {
	  this.location[0] = -this.radius;
	}
  }

  /**
   * Render vehicle to the scene
   *
   * @function
   * @memberOf Vehicle
   */
  this.render = function() {
	opts.ctx.fillStyle = this.style
	opts.ctx.beginPath()
	opts.ctx.arc(this.location[0], this.location[1], this.radius, 0, Math.PI * 2, false)
	opts.ctx.closePath()
	opts.ctx.fill()
  }

	// return {
	// 	location,
	// 	applyBehaviors,
	// 	run,
	// }
}

export default Vehicle
