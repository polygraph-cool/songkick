import * as d3 from 'd3'
import ScrollMagic from 'scrollmagic'
import './utils/find'

import { legendSize } from 'd3-svg-legend'

let history
let venues
let made

const visEl = d3.select('.ascent__vis')

const formatNumber = d3.format('.1f')
const formatDate = d3.timeFormat('%b %d, %Y')
const formatCapacity = d3.format(',')

let line
let scale = {}
let chart
let svg
let chartW
let chartH

let mobile
const MARGIN = { top: 48, bottom: 24, left: 24, right: 24 }
const itemHeight = 64
const BREAKPOINT = 768

let currentHoverEl
let firstHover = true

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
		// their first small venue in NYC
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
			return show.normalized_days - start <= band.days_until_big &&
			show.normalized_days - start >= 0
		})

		// yuck! find days since start
		band.shows.forEach((show, i) => {
			show.days_since_start = show.normalized_days - start
			show.years_since_start = (show.normalized_days - start) / 365
			show.show_index = i
		})

		band.shows[band.shows.length - 1].made = true

	})

	history = history.filter(d => d.shows.length)

	history.sort((a, b) => d3.descending(a.days_until_big, b.days_until_big))
	// history.sort((a,b) => d3.ascending(a.shows[a.shows.length - 1].date_parsed, b.shows[b.shows.length - 1].date_parsed))
}

function createLegend() {
	const legend = legendSize()
		.scale(scale.size)
		.shape('circle')
		.shapePadding(10)
		.labelOffset(20)
		.title('Venue capacity')
		.orient('horizontal')
		.labels(['Small', '', '', '', 'Big'])

	const legendGroup = svg.select('.legend__size')

	legendGroup.call(legend)

	const bb = svg.select('.legend__size').node().getBoundingClientRect()
	const textBB = svg.select('.legendTitle').node().getBoundingClientRect()

	const legendX = MARGIN.left - bb.width / 2 + chartW / 2
	legendGroup.attr('transform', `translate(${legendX},${MARGIN.top / 4})`)

	// center text
	const offsetText = Math.floor((bb.width - textBB.width) / 1.5)
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

	const el = selection.filter((d, i) => d.show_index === index)

	el.raise()
	// hide old
	if (currentHoverEl) currentHoverEl.classed('is-visible', false)
	if (firstHover) {
		firstHover = false
		chart.select('.band__show').classed('is-visible', false)
	}
	currentHoverEl = el
	currentHoverEl.classed('is-visible', true)
}

function setupChart() {
	const daysMax = d3.max(history, d => d.days_until_big)
	const yearsMax = d3.max(history, d => d.years_until_big)

	const capacityMax = d3.max(history, d => d.big.capacity)
	const capacityMin = d3.min(history, d => d3.min(d.shows, e => e.capacity))

	// date min/,ax
	const dateMin = d3.min(history, d => d.shows[0].date_parsed)
	const dateMax = d3.max(history, d => d.shows[d.shows.length - 1].date_parsed)
	

	scale.x = d3.scaleLinear().domain([0, yearsMax])
	// scale.x = d3.scaleTime().domain([dateMin, dateMax]).range([0, chartW])

	// size scale
	const sizeDomain = [200, 500, 1000, 3000] 
	const maxRadius = itemHeight / 7
	const minRadius = 3
	const step = (maxRadius - minRadius) / 5
	const sizeRange = d3.range(minRadius, maxRadius, step)
	
	scale.size = d3.scaleThreshold().domain(sizeDomain).range(sizeRange)

	// create line function
	line = d3.line()
		.x(d => scale.x(d))
		.y(d => 0)

	svg = visEl.append('svg')

	setupImages()

	svg.append('g')
		.attr('class', 'legend__size')

	chart = svg.append('g')
	
	chart.attr('transform', `translate(${MARGIN.left},${MARGIN.top})`)

	const band = chart.selectAll('.band')

	const bandEnter = band.data(history)
		.enter()
	.append('g').attr('class', 'band')
		.attr('transform', (d, i) => `translate(0,${(i + 1) * itemHeight})`)

	bandEnter.append('g')
		.attr('class', 'band__img')
		.append('circle')
			.attr('cx', 0)
			.attr('cy', 0)
			.attr('r', itemHeight / 2 - (maxRadius))
			.attr('fill', d => `url(#pattern${d.id})`)

	const bandGraph = bandEnter.append('g').attr('class', 'band__graph')

	bandGraph.append('rect')
		.style('opacity', 0)
		.classed('interaction', true)
		.attr('x', 0)
		.attr('y', -itemHeight / 4)
		// .attr('width', d => scale.x(d.shows[d.shows.length - 1].date_parsed))
		.attr('height', itemHeight / 2)
		.on('mousemove', handleMouse)
		.on('mouseleave', () => {
			if (currentHoverEl) currentHoverEl.classed('is-visible', false)
		})

	bandGraph.append('text')
		.html((d, i) => {
			const years = formatNumber(d.years_until_big)
			const desktop = mobile ? '' : 'from their first small show in NYC'
			const extra =  i === 0 ? `${desktop} until they made it big` : ''
			return `${d.name} <tspan dx='5'>${years} years ${extra}</tspan>`
		})
		// .attr('transform', d => `translate(${scale.x(d.shows[0].date_parsed)}, 0)`)
		.attr('y', -scale.size(3000) - 5)
		
	bandGraph.append('path')
		.attr('class', 'band__path')
		// .attr('d', d => line([d.shows[0].date_parsed, d.shows[d.shows.length - 1].date_parsed]))


	const showEnter = bandGraph.selectAll('.band__show').data(d => d.shows)
		.enter()
			.append('g')
			.attr('class', d => `band__show billing-${d.opener ? 'opener' : 'headline'}`)
			// .attr('transform', d => `translate(${scale.x(d.date_parsed)}, 0)`)
			.classed('show__made', d => d.made)
		
	showEnter.append('circle')
		.attr('class', 'band__circle')
		.attr('cx', 0)
		.attr('cy', 0)
		.attr('r', d => scale.size(d.capacity))
	
	const infoEnter = showEnter.append('g')
		.attr('class', 'band__info')
	
	infoEnter.append('text')
		.attr('alignment-baseline', 'hanging')
		.attr('y', itemHeight / 4)
		.attr('text-anchor', d => {
			return d.years_since_start > 2.6 ? 'end' : 'start'
		})
		.html((d, i) => {
			const date = formatDate(d.date_parsed)
			const capacity = d.capacity ? formatCapacity(d.capacity) : 'N/A'
			const name = d.name
			return `${date} <tspan alignment-baseline='hanging' dx='5'>${name} (${capacity})</tspan>`
		})
	
	currentHoverEl = chart.select('.show__made')
	currentHoverEl.classed('is-visible', true)

	// first time hack
	const outerWidth = d3.select('body').node().offsetWidth
	mobile = outerWidth < BREAKPOINT
	if (!mobile) chart.select('.band__show').classed('is-visible', true)
}

function resize() {
	const outerWidth = d3.select('body').node().offsetWidth
	mobile = outerWidth < BREAKPOINT

	chartW = visEl.node().offsetWidth - MARGIN.left - MARGIN.right
	chartH = itemHeight * (history.length + 2) - MARGIN.top - MARGIN.bottom

	svg
		.attr('width', chartW + MARGIN.left + MARGIN.right)
		.attr('height', chartH + MARGIN.top + MARGIN.bottom)
	
	const graphOffset = mobile ? 0 : itemHeight / 1.5

	scale.x.range([0, chartW - graphOffset])

	const bandGraph = chart.selectAll('.band__graph')
	const bandImg = chart.selectAll('.band__img')
	
	bandImg.classed('is-hidden', mobile)
	bandGraph.attr('transform', `translate(${graphOffset},0)`)
		

	const band = chart.selectAll('.band')

	band.selectAll('.interaction')
		.attr('width', d => scale.x(d.years_until_big))

	band.selectAll('.band__path')
		.attr('d', d => line([0, d.years_until_big]))

	band.selectAll('.band__show')
		.attr('transform', d => `translate(${scale.x(d.years_since_start)}, 0)`)

	createLegend()
}

function setupImages() {
	const defs = svg.append('defs')
	const pattern = defs.selectAll('pattern').data(made)
		.enter()
		.append('pattern')
			.attr('id', d => `pattern${d.id}`)
			.attr('width', '100%')
			.attr('height', '100%')
			.attr('patternContentsUnit', 'objectBoundingBox')
			.attr('viewBox', '0 0 1 1')
			.attr('preserveAspectRatio', 'xMidYMid slice')

	pattern.append('image')
		.attr('width', '1')
		.attr('height', '1')
		.attr('preserveAspectRatio', 'xMidYMid slice')
		.attr('xlink:href', d => `${d.img}`)
}

function init(data) {
	history = data.history
	venues = data.venues
	made = data.made
	
	addVenueDetails()
	setupChart()
	resize()
	
}

export default { init, resize }

