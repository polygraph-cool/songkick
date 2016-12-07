import * as d3 from 'd3'
import vec2 from 'gl-matrix-vec2'
// import sceneData from './data-scene'

const PI = Math.PI
const TWO_PI = Math.PI * 2
const NUM_PATH_POINTS = 64
const HALF_PP = NUM_PATH_POINTS / 2
const QUARTER_PP = NUM_PATH_POINTS / 4
let MIN_SIZE

const TINT = 0XF2929D
const TINT_SPECIAL = 0XFFFFFF
const debugId = '2575'


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

// const diamondLookup = (() => {
// 	return d3.range(360).map(i => {
// 		const dia = i / 360 * 4
// 		const dir = dia <= 2 ? 1 : -1
// 		const ab = Math.abs(2 - dia)

// 		return 180 - 180 * ab * dir
// 	})
// })()

// console.log(diamondLookup)

const Boid = (opts) => {
	let locationVec = vec2.create()
	let velocityVec = vec2.create()
	let accelerationVec = vec2.create()
	let currentTargetVec = vec2.create()
	let centerVec = vec2.create()	

	let maxspeedOrig
	let maxspeed
	let maxforce
	
	let currentPath
	let paths
	let pathScale
	
	let inc
	
	let sprite
	let container
	let text
	let data

	let sizeBig
	let sizeExplore
	let packBig
	let packBigX
	let packBigY
	let packExplore
	let packExploreX
	let packExploreY
	let isBig
	let isMedium
	let isSpecial
	let mode

	// let wanderTheta = Math.random() * TWO_PI

	let chartSize
	let currentSize
	let currentRadius
	let stable

	let sizeTransitionState
	let sizeTransitionGoal
	let sizeTransitionRate

	const getPathPoint = () => currentTargetVec

	// SETTERS
	const setSize = (s, transition) => {
		if (transition) {
			sizeTransitionState = true
			sizeTransitionGoal = s
			sizeTransitionRate = Math.abs((s - currentSize) * 0.05)
		} else {
			sizeTransitionState = false
			currentSize = s
			currentRadius = s / 2
			sprite.width = s
			sprite.height = s
			sprite.position.set(-currentRadius, -currentRadius)

		}
		setMaxspeed(s)
	}

	const setMaxspeed = (size) => {
		// maxspeed = mode !== 'default' ? 10 : inc * 100 * (Math.log(size) / 2 + 1)
		maxspeed = mode !== 'default' ? 5 : maxspeedOrig
		maxforce = maxspeed * 0.25
	}
		
	const setScene = (id) => {
		let size = MIN_SIZE
		stable = false
		mode = 'default'
		setMaxspeed(size)
		
		switch (id) {
			case 'medium':
				mode = 'default'
				if (isMedium) {
					currentPath = 1
					setSize(6, true)
					toggleText(false)
					if (isSpecial) sprite.tint = TINT
				} else {
					setSize(size)
				}
				break
			case 'big':
				if (isBig) {
					mode = 'big'
						
					// x, y, size
					size = Math.min(Math.floor(data.bR * sizeBig * 2), 14)
					size -= 2
					
					setSize(size, true)
				} else {
					setSize(size)
				}
				break
			default:
				if (isSpecial) {
					sprite.tint = TINT_SPECIAL
					toggleText(true)	
				} 
				currentPath = 0
				// only reset size if different
				if (currentSize !== size) setSize(size, false)
		}
	}

	const enterBig = (recent) => {
		if (mode !== 'big') setScene('big')
		if (recent) {
			text.y = sizeTransitionGoal ? -sizeTransitionGoal : -currentSize
			text.visible = true
		} else {
			text.visible = false
		}
	}

	const exitBig = () => {
		if (mode === 'big') setScene('medium')
		text.visible = false
	}

	const toggleText = (val) => {
		if (text) text.visible = val
	}

	const transitionSize = () => {
		const diff = sizeTransitionGoal - currentSize
		// if (data.id === debugId) console.log(diff)
		// is it done?
		if (Math.abs(diff) <= sizeTransitionRate * 2) {
			// if (data.id === debugId) console.log(sizeTransitionGoal)
			currentSize = sizeTransitionGoal
			sizeTransitionState = false
			sizeTransitionGoal = null
			sizeTransitionRate = null
		} else {
			const dir = diff > 0 ? 1 : -1
			currentSize += sizeTransitionRate * dir
		}
		
		sprite.width = currentSize
		sprite.height = currentSize
		currentRadius = currentSize / 2
		sprite.position.set(-currentRadius, -currentRadius)
	}

	const radToDeg = (r) => { 
		return (r > 0 ? r : ( 2* PI + r)) * 360 / (2 * PI)
	}

	const toRadians = (angle) => angle * (Math.PI / 180)

	const toDegrees = (angle) => angle * (180 / Math.PI)

	// http://stackoverflow.com/questions/1427422/cheap-algorithm-to-find-measure-of-angle-between-vectors
	const diamondAngle = (y, x) => {
		if (y >= 0) return (x >= 0 ? y/(x+y) : 1-x/(-x+y))
		else return (x < 0 ? 2-y/(-x-y) : 3+x/(x-y))
	}

	const createPaths = (ringData, chartSize) => {
		// TODO create lookup table
		// const tempScale = d3.scaleQuantile().domain([-PI, PI]).range(d3.range(-NUM_PATH_POINTS / 2, NUM_PATH_POINTS / 2, 1))

		// pathScale = d3.scaleQuantile().domain([-PI, PI]).range(d3.range(-NUM_PATH_POINTS / 2, NUM_PATH_POINTS / 2, 1))
		// console.log(pathScale.range())

		paths = []

		ringData.forEach((datum, i) => {
			let nextFactor = datum.factor
			if (i < ringData.length - 1) nextFactor = ringData[i + 1].factor

			const diff = (datum.factor - nextFactor) / 2
			const ran = isSpecial ? 0.4 : 0.2 + Math.random() * 0.8
			const factor = ran * diff + nextFactor + diff

			// add point to path
			d3.range(NUM_PATH_POINTS).map(d => {
				// const angle = d / NUM_PATH_POINTS * Math.PI * 2
				const angle = d / NUM_PATH_POINTS * 360
				const rad = toRadians(angle)
				const x = Math.cos(rad) * chartSize / 2 * factor
				const y = Math.sin(rad) * chartSize / 2 * factor
				// console.log(d, angle)
				paths.push(chartSize / 2 + x)
				paths.push(chartSize / 2 + y)
			})
		})

	}

	const setCurrent = (tX, tY) => {
		vec2.set(currentTargetVec, tX, tY)
	}

  	const applyBehaviors = () => {
		// update currentTargetVec
		if (!stable) {
			let tempTarget
			
			switch(mode) {
				case 'default':
					tempTarget = follow()
					break
				case 'big': 
					tempTarget = followBig()
					break
				default:
					tempTarget = follow()
			}
			
			setCurrent(tempTarget[0], tempTarget[1])
			const f = seek()
			applyForce(f)
		}
	}
	
	const applyForce = (force) => {
		vec2.add(accelerationVec, accelerationVec, force)
  	}

	const update = () => {
		// transition size
		if (sizeTransitionState) transitionSize()
		
		if (!stable) {
			vec2.add(velocityVec, velocityVec, accelerationVec)
			// vec2.limit(velocityVec, velocityVec, maxspeed)
			vec2.add(locationVec, locationVec, velocityVec)

			vec2.set(accelerationVec, 0, 0)

			container.position.set(locationVec[0], locationVec[1])
		}
	}
	
	// follow
	const getDiamondDegree = () => {
		const dia = diamondAngle(locationVec[1] - centerVec[1], locationVec[0] - centerVec[0])
		return dia / 4 * 360	
	}
	// const getRad = () => {
		// TODO DIAMNND
		// const rad = Math.atan2(locationVec[1] - centerVec[1], locationVec[0] - centerVec[0])
		// return rad
	// }

	const getScale = (deg) => {
		// pathScale(rad)

		let index = Math.ceil(deg / 360 * NUM_PATH_POINTS)
		let off = currentPath + 2
		// console.log(deg, index)
		// console.log(deg, index, off)
		const scale = index >= NUM_PATH_POINTS - off
		? index - (NUM_PATH_POINTS - off)
		: index + off

		return scale
	}
	// const getFinal = (scaled) => {
	// 	let final = 0
	// 	if (scaled < 0) {
	// 		final = QUARTER_PP - scaled
	// 	} else {
	// 		if (scaled > QUARTER_PP) final = (NUM_PATH_POINTS - QUARTER_PP) + (HALF_PP - scaled)
	// 		else final = QUARTER_PP - scaled
	// 	}

	// 	final = final < NUM_PATH_POINTS - 2 ? final + 1 : 0
	// 	return final 
	// }
	const getTarget = (i) => {
		const index = (currentPath * NUM_PATH_POINTS + i) * 2
		const tX = paths[index]
		const tY = paths[index + 1]
		return [tX, tY]
	}
	
	const follow = () => {
		// const deg = radToDeg(rad)
		const deg = getDiamondDegree()
		const scaled = getScale(deg)
		const target = getTarget(scaled)

		return target
	}

	const followBig = () => {
		return [packBigX, packBigY]
	}

	const followExplore = () => {
		return [packExploreX, packExploreY]
	}

	const seek = () => {

		let scaleVec = vec2.create()
		let desiredVec = vec2.create()	
		let steerVec = vec2.create()
		
		// let dist
		// const seekDist = () => {
		// 	dist = vec2.dist(locationVec, currentTargetVec)
		// 	// slowdown
		// 	const s = dist < currentSize * 3 ? dist / 20 : maxspeed
		// 	vec2.set(scaleVec, s, s)
		// }

		// const seekDesired = () => vec2.sub(desiredVec, currentTargetVec, locationVec)

		// const seekNormalized = () => vec2.normalize(desiredVec, desiredVec)

		// const seekMultiply = () => vec2.multiply(desiredVec, desiredVec, scaleVec)

		// const seekSub = () => vec2.sub(steerVec, desiredVec, velocityVec)

		//  // vec2.limit(steerVec, steerVec, tempForce)

		//  seekDist()
		//  seekDesired()
		//  seekNormalized()
		//  seekMultiply()
		//  seekSub()

		let dist = vec2.dist(locationVec, currentTargetVec)
		
		// slowdown
		const s = dist < currentSize * 3 ? dist / 20 : maxspeed
		
		vec2.set(scaleVec, s, s)

		vec2.sub(desiredVec, currentTargetVec, locationVec)

		vec2.normalize(desiredVec, desiredVec)

		vec2.multiply(desiredVec, desiredVec, scaleVec)

		vec2.sub(steerVec, desiredVec, velocityVec)

	    stable = dist < 0.5
    
		return steerVec
	} 

	const init = () => {
		container = opts.container
		sprite = opts.sprite
		text = opts.text
		data = opts.data
		chartSize = opts.chartSize
		
		isSpecial = data.name === 'Lake Street Dive'
		isBig = data.tier === 2
		isMedium = data.tier > 0

		const halfSize = chartSize / 2
	  	
	  	MIN_SIZE = chartSize < 480 ? 1 : 2
	  	MIN_SIZE = isSpecial ? MIN_SIZE * 2 : MIN_SIZE
	  		  	

		// hide text
		if (text) {
			text.anchor.set(0.5, 1.25)
			text.visible = false
			text.style = {
				align: 'center',
				fontFamily: 'Helvetica',
				fontSize: '11px',
				// fontWeight: 'bold',
				fill: '#efefef',
			}
		}

		maxspeedOrig = Math.random() * 0.5 + 0.75

		vec2.set(centerVec, halfSize, halfSize)

		sizeBig = data.bR ? opts.ringData[2].factor * chartSize : null

		if (isBig) {
			packBig = [sizeBig * data.bX, sizeBig * data.bY, sizeBig / 2]
			packBigX = centerVec[0] + packBig[0] - packBig[2]
			packBigY = centerVec[1] + packBig[1] - packBig[2]	
		}

		vec2.set(velocityVec, 0, 0)

		createPaths(opts.ringData, opts.chartSize)

		// hard code hard news
	 	const diff = (opts.ringData[0].factor - opts.ringData[1].factor) / 2
		const factor = Math.random() * diff + opts.ringData[1].factor + diff
		const ranPathPoint = Math.random() * NUM_PATH_POINTS
		// console.log(diff, factor, ranPathPoint)

		const angle = ranPathPoint / NUM_PATH_POINTS * 360
		const rad = toRadians(angle)
		const x = Math.cos(rad) * halfSize * factor
		const y = Math.sin(rad) * halfSize * factor
		
		if (isMedium) vec2.set(locationVec, x + halfSize , y + halfSize)
		else vec2.set(locationVec, x, y)
		
		sprite.tint = TINT
		sprite.alpha = isMedium ? 0.3 : 0.6
		
		if (isSpecial) {
			sprite.alpha = 1
			sprite.tint = TINT_SPECIAL
			toggleText(true)
		}
		
		
		update()
		setScene('intro-1')
		return {
			setScene,
			getPathPoint,
			applyBehaviors,
			update,
			enterBig,
			exitBig,
			toggleText,
			
		}
	}

	return init()
}

export default Boid
