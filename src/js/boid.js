import * as d3 from 'd3'
import vec2 from 'gl-matrix-vec2'
// import sceneData from './data-scene'

const PI = Math.PI
const TWO_PI = Math.PI * 2
const NUM_PATH_POINTS = 48
const HALF_PP = NUM_PATH_POINTS / 2
const QUARTER_PP = NUM_PATH_POINTS / 4

// const TINT = 0XF2929D
// const TINT2 = 0Xf8bfc6
// const TINT_SPECIAL = 0XFFFFFF

const TINT = 0XBCBCBC
const TINT2 = 0X87B323
const TINT_SPECIAL = 0XE85C86

const debugId = '2575'

const MED_ALPHA = 0.5
const BIG_ALPHA = 0.7
const SMALL_ALPHA = 0.8


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
	let textContainer
	let text
	let data

	let sizeBig
	let sizeMedium
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

	let minSize
	let mobile
	let ringData

	const getPathPoint = () => currentTargetVec

	// SETTERS
	const setSize = (s, transition) => {
		if (transition && !mobile) {
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
		maxspeed = mode !== 'default' ? 3 : maxspeedOrig
		maxforce = maxspeed * 0.1
	}
		
	const setScene = (id) => {
		// console.log(id, minSize)
		let size = minSize
		stable = false
		mode = 'default'
		setMaxspeed(size)
		switch (id) {
			case 'medium':
				mode = 'default'
				if (isMedium) {
					currentPath = 1
					setSize(sizeMedium, true)
					toggleText(false)
					sprite.tint = TINT2
					sprite.alpha = 0.65

					if (isBig) text.anchor.set(0.5, 1.25)
					// if (isSpecial) {
					// 	// sprite.tint = TINT
					// 	sprite.alpha = 0.5
					// }
				} else {
					setSize(size)
				}
				break
			case 'big':
				if (isBig) {
					text.anchor.set(0.5, 0.75)
					mode = 'big'
						
					// x, y, size
					size = Math.min(Math.floor(data.bR * sizeBig * 2), 14)
					size -= 2
					sprite.tint = TINT_SPECIAL
					sprite.alpha = BIG_ALPHA
					setSize(size, true)
				} else {
					setSize(size)
				}
				break
			default:
				sprite.tint = TINT
				if (isSpecial) {
					sprite.tint = TINT_SPECIAL
					sprite.alpha = 1
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
			sprite.alpha = 1
			text.y = sizeTransitionGoal ? -sizeTransitionGoal : -currentSize
			text.visible = true
		} else {
			sprite.alpha = BIG_ALPHA
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

	const createPaths = () => {
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

	const resetLocation = () => {
		const halfSize = chartSize / 2
		// hard code hard news
	 	const diff = (ringData[0].factor - ringData[1].factor) / 2
		const factor = Math.random() * diff + ringData[1].factor + diff
		const ranPathPoint = Math.random() * NUM_PATH_POINTS
		// console.log(diff, factor, ranPathPoint)

		const angle = ranPathPoint / NUM_PATH_POINTS * 360
		const rad = toRadians(angle)
		const x = Math.cos(rad) * halfSize * factor
		const y = Math.sin(rad) * halfSize * factor
		
		if (isMedium) vec2.set(locationVec, x + halfSize , y + halfSize)
		else vec2.set(locationVec, x, y)

		vec2.set(accelerationVec, 0, 0)
		vec2.set(velocityVec, 0, 0)
		vec2.set(centerVec, halfSize, halfSize)

		if (isBig) {
			packBig = [sizeBig * data.bX, sizeBig * data.bY, sizeBig / 2]
			packBigX = centerVec[0] + packBig[0] - packBig[2]
			packBigY = centerVec[1] + packBig[1] - packBig[2]	
			// sprite.interactive = true
			// sprite.on('mousedown', () => console.log(data.name))
		}
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
			vec2.add(locationVec, locationVec, velocityVec)

			vec2.set(accelerationVec, 0, 0)

			container.position.set(locationVec[0], locationVec[1])
			if (isBig) textContainer.position.set(locationVec[0], locationVec[1])
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

	const resize = (newSize, m) => {
		mobile = m
		chartSize = newSize
		minSize = chartSize < 480 ? 1 : 2
	  	minSize = isSpecial ? minSize * 2 : minSize
	  	sizeMedium = 4
	  	sizeBig = isBig ? ringData[2].factor * chartSize : null
	  	maxspeedOrig = Math.random() * (mobile ? 0.15 : 0.3) + 0.4
	  	createPaths()
	  	resetLocation()

	}

	const init = () => {
		container = opts.container
		textContainer = opts.textContainer
		sprite = opts.sprite
		text = opts.text
		data = opts.data
		chartSize = opts.chartSize
		mobile = opts.mobile
		ringData = opts.ringData
		
		isSpecial = data.name === 'Sylvan Esso'
		isBig = data.tier === 2
		isMedium = data.tier > 0

		// hide text
		if (text) {
			text.anchor.set(0.5, 1.25)
			text.visible = false
			text.style = {
				align: 'center',
				fontFamily: 'Helvetica',
				fontSize: '11px',
				fill: '#efefef',
				stroke: '#333',
				// fill: '#333',
				// stroke: '#fff',
				strokeThickness: 2,
			}
		}
		
		resize(chartSize, mobile)
		
		sprite.tint = TINT
		sprite.alpha = isMedium ? MED_ALPHA : SMALL_ALPHA
		
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
			resize,
		}
	}

	return init()
}

export default Boid
