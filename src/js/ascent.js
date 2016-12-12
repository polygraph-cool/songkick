import * as d3 from 'd3'
import ScrollMagic from 'scrollmagic'
import './utils/find'

import { legendSize } from 'd3-svg-legend'

let history
let venues

const BAND_NAMES = {'2575': 'Wade Bowen','4409368': 'Bad Suns','6325384': 'Misterwives','189890': 'The Boys','1077331': 'Lake Street Dive','423511': 'Emmanuel','3909026': 'Courtney Barnett','5767534': 'Torres','2337283': 'Great Caesar','6018139': 'ODESZA','5183683': 'Houndmouth','6664009': 'X Ambassadors','457177': 'Bob Moses','6140284': 'Sturgill Simpson'}

const visEl = d3.select('.ascent__vis')

const formatNumber = d3.format('.1f')
const formatDate = d3.timeFormat('%B %d, %Y')
const formatCapacity = d3.format(',')

let line
let scale = {}
let chart
let svg
let chartW
let chartH

const MARGIN = { top: 48, bottom: 24, left: 24, right: 24 }
const itemHeight = 64

let currentHoverEl

function getVenue(id) {
	// return venues.find(d => d.id === id) || {}
	return venues[id]
}

function addVenueDetails() {
	history.forEach(band => {
		// TODO not all venues are there
		const shows = band.shows.filter(show => !isNaN(show.venue)).map(show => {
			const venue = getVenue(show.venue)
			
			return {
				...show,
				capacity: venue.capacity,
				name: venue.venue,
			}
		})
		// overwrite shows with new data
		band.shows = shows
		
		// proper algorithm
		// find small
		// band.small = shows.find(show => show.opener && show.capacity < 700)
		// // find medium
		// band.medium = shows.find(show => !show.opener && show.capacity >= 700 && show.capacity < 3000)
		// // find big
		// band.big = shows.find(show => !show.opener && show.capacity >= 3000)

		// fudged
		band.small = shows.find(show => show.capacity < 700)
		// find medium
		band.medium = shows.find(show => show.capacity >= 700 && show.capacity < 3000)
		// find big
		band.big = shows.find(show => !show.opener && show.capacity >= 3000)

		const start = band.small.normalized_days
		// band.days_until_medium = band.medium ? band.medium.normalized_days - start : null 
		band.days_until_big = band.big ? band.big.normalized_days - start : null
		band.years_until_big = band.big ? (band.big.normalized_days - start) / 365 : null

		// filter out shows that are after big perf and before start
		band.shows = band.shows.filter(show => {
			return (show.normalized_days - start) <= band.days_until_big
		})

		// yuck! find days since start
		band.shows.forEach(show => {
			show.days_since_start = show.normalized_days - start
			show.years_since_start = (show.normalized_days - start) / 365
		})
		// band.data = [{days: 0, h: 0}, {days: band.days_until_big, h: 1}]
		// console.log(band.id, band.days_until_medium, band.days_until_big)
	})

	history = history.filter(d => d.shows.length)

	history.sort((a, b) => d3.descending(a.days_until_big, b.days_until_big))
}


// straight lines with bubbles for venues

function createLegend() {
	// legend
	const legendGroup = svg.append('g')
		.attr('class', 'legend__size')
	
	const legend = legendSize()
		.scale(scale.size)
		.shape('circle')
		.shapePadding(10)
		.labelOffset(20)
		.title('Venue capacity')
		.orient('horizontal')
		.labels(['Small', '', '', '', 'Big'])

	legendGroup.call(legend)

	const bb = svg.select('.legend__size').node().getBoundingClientRect()
	const textBB = svg.select('.legendTitle').node().getBoundingClientRect()

	const legendX = MARGIN.left - bb.width / 2 + chartW / 2
	legendGroup.attr('transform', `translate(${legendX},${MARGIN.top / 4})`)

	// center text
	const offsetText = Math.floor((bb.width - textBB.width))
	svg.select('.legendTitle').attr('x', offsetText)

}

function hidePreviousHover(id) {
	
}

function handleMouse(d, i) {
	const [x, y] = d3.mouse(this)
	const time = scale.x.invert(x)
	// find nearest
	// const bisectYear = d3.bisector(d => d.years_since_start).left
	// const index = bisectYear(d.shows, time, 1)
	
	const index = d3.scan(d.shows, (a, b) => {
		const diffA = Math.abs(a.years_since_start - time)
		const diffB = Math.abs(b.years_since_start - time)
		return diffA - diffB
	})
	
	const selection = d3.select(this.parentNode).selectAll('.band__show')

	const el = selection.filter((d, i) => i === index)
	
	// hide old
	if (currentHoverEl) currentHoverEl.classed('is-visible', false)

	currentHoverEl = el
	currentHoverEl.classed('is-visible', true)

}

function setupChart() {
	const daysMax = d3.max(history, d => d.days_until_big)
	const yearsMax = d3.max(history, d => d.years_until_big)

	const capacityMax = d3.max(history, d => d.big.capacity)
	const capacityMin = d3.min(history, d => d3.min(d.shows, e => e.capacity))
	

	chartW = visEl.node().offsetWidth - MARGIN.left - MARGIN.right
	// const h = window.innerHeight * 0.8 - MARGIN * 2
	chartH = itemHeight * (history.length + 1) - MARGIN.top - MARGIN.bottom
	
	scale.x = d3.scaleLinear().domain([0, yearsMax]).range([0, chartW])

	// size scale
	const maxRadius = itemHeight / 6
	const minRadius = 3
	const step = (maxRadius - minRadius) / 5
	const sizeDomain = [200, 500, 1000, 3000] 
	const sizeRange = d3.range(minRadius, maxRadius, step)
	
	scale.size = d3.scaleThreshold().domain(sizeDomain).range(sizeRange)


	// create line function
	line = d3.line()
		.x(d => scale.x(d))
		.y(d => 0)


	
	svg = visEl.append('svg')

	svg
		.attr('width', chartW + MARGIN.left + MARGIN.right)
		.attr('height', chartH + MARGIN.top + MARGIN.bottom)

	

	createLegend()

	

	
	chart = svg.append('g')
	
	chart.attr('transform', `translate(${MARGIN.left},${MARGIN.top})`)


	const band = chart.selectAll('.band')

	const bandEnter = band.data(history)
		.enter()
	.append('g').attr('class', 'band')
		.attr('transform', (d, i) => `translate(0,${(i + 1) * itemHeight})`)
		.classed('is-transparent', true)
	
	bandEnter.append('rect')
		.style('opacity', 0)
		.classed('interaction', true)
		.attr('x', 0)
		.attr('y', -itemHeight / 4)
		.attr('width', d => scale.x(d.years_until_big))
		.attr('height', itemHeight / 2)
		.on('mousemove', handleMouse)
		.on('mouseleave', () => {
			if (currentHoverEl) currentHoverEl.classed('is-visible', false)
		})

	bandEnter.append('text')
		.html((d, i) => {
			const years = formatNumber(d.years_until_big)
			const extra =  i === 0 ? 'until they made it big' : ''
			return `${BAND_NAMES[d.id]} <tspan dx='5'>${years} years ${extra}</tspan>`
		})
		.attr('y', -12)
		
	bandEnter.append('path')
		.attr('class', 'band__path')
		.attr('d', d => line([0, 0]))

	// const show = bandEnter.selectAll('circle')

	const showEnter = bandEnter.selectAll('circle').data(d => d.shows)
		.enter()
			.append('g')
			.attr('class', 'band__show')
			.attr('transform', d => `translate(${scale.x(d.years_since_start)}, 0)`)
		
	showEnter.append('circle')
		.attr('class', 'band__circle')
		.attr('cx', 0)
		.attr('cy', 0)
		.attr('r', 0)
	
	const infoEnter = showEnter.append('g')
		.attr('class', 'band__info')
		// .attr('transform', `translate(0, ${itemHeight / 2})`)
	
	infoEnter.append('text')
		.attr('alignment-baseline', 'hanging')
		.attr('y', itemHeight / 4)
		.attr('text-anchor', d => {
			return d.years_since_start > 2.3 ? 'end' : 'start'
		})
		.html((d, i) => {
			const date = formatDate(d.date_parsed)
			const capacity = formatCapacity(d.capacity)
			const name = d.name
			return `${date} <tspan alignment-baseline='hanging' dx='5'>${name} (${capacity})</tspan>`
		})
	

	// const showMerge = showEnter.merge(show)
		
	// showMerge.transition(t)
	
}

function setupScroll() {
	const controller = new ScrollMagic.Controller()
	
	const triggerScenes = chart.selectAll('.band').each(function(d, i) {
		const el = this
		const sel = d3.select(this)
		const scene = new ScrollMagic.Scene({
			triggerElement: el,
			triggerHook: 0.7,
		})
		
		scene.on('enter', event => {
			animateChart(sel)
		})
		.addTo(controller)
		
		return scene
	})

	// const scene = new ScrollMagic.Scene({
	// 	triggerElement: '.ascent__vis',
	// 	// triggerHook: 0,
	// 	// duration: proseHeight - visHeight,
	// })
	
	// scene
	// 	.on('enter', event => {
	// 		animateChart()
	// 	})
	// 	.addTo(controller)
}

function animateChart(sel) {
	const total = 2000
	const data = sel.data()
	const count = data[0].shows.length

	sel.classed('is-transparent', false)
	// chart.selectAll('.band__circle')
	sel.selectAll('.band__circle')
		.transition()
		.duration(500)
		.ease(d3.easeCubicInOut)
		.delay((d, i) => i / count * total + 250)
		.attr('r', d => scale.size(d.capacity))

	// chart.selectAll('.band__path')
	sel.select('.band__path')
		.transition()
		.duration(500)
		.delay(250)
		.ease(d3.easeCubicOut)
		.attr('d', d => line([0, d.years_until_big]))
}

function init(data) {
	history = data.history
	venues = data.venues
	addVenueDetails()
	setupChart()
	setupScroll()
	// console.log(history)
}

export default { init }

