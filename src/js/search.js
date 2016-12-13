import * as d3 from 'd3'
import ScrollMagic from 'scrollmagic'
import smoothScroll from 'smooth-scroll'

let venues
let bands

const alphabet = 'abcdefghijklmnopqrstuvwxyz'.split('').reverse()
const containerEl = d3.select('#search')
const visEl = d3.select('.search__vis')
const popupEl = d3.select('.search__popup')
const popupNameEl = d3.select('.popup__name')
const popupTextEl = d3.select('.popup__text')
const popupShowsEl = d3.select('.popup__shows')
const popupVisEl = d3.select('.popup__vis')
const svg = popupVisEl.select('svg')
const searchLaunchEl = d3.select('.search__launch')
const findCloseEl = d3.select('.find__close')
const findEl = d3.select('.search__find')

const POPUP_WIDTH = 360
const POPUP_MARGIN = 20
const MAX_RADIUS = 14
const MIN_RADIUS = 2
const MARGIN = { top: 20, bottom: 20, left: 20, right: 20 }

let timelineEl
let pathEl
let showsEl
let scale = {}
let chartWidth
let chartHeight

let viewportHeight = window.innerHeight
let viewportWidth = d3.select('body').node().offsetWidth



const parseDate = d3.timeParse('%Y-%m-%d')

const begin = parseDate('2013-01-01')
const end = parseDate('2016-12-31')

const formatNumber = d3.format(',')

const formatCapacity = d3.format(',')

function getVenue(id) {
	return venues[id]
}

function addAlphabet() {
	for (let i = 0; i < bands.length; i++) {
		const band = bands[i]
		const first = band.name.charAt(0)

		const letter = alphabet[alphabet.length - 1]

		if (first.match(/[a-zA-Z]/) && first.toLowerCase() === letter) {
			band.first_letter = alphabet.pop()
			if (!alphabet.length) break
		}
	}
}

function grammarize(num, text) {
	if (num === 0) {
		return `never ${text}`
	} else if (num === 1) {
		return `${text} once`
	} else {
		return `${text} ${num} times`
	}
}

function updatePopup(d) {
	const bb = this.getBoundingClientRect()
	const { top, right, left, bottom, width, height } = bb

	let posLeft = Math.floor((left + width / 2) - POPUP_WIDTH / 2)
	let posTop = Math.floor(top + height * 2)
	
	const fromLeftEdge = posLeft - POPUP_WIDTH / 2
	const fromRightEdge = posLeft + POPUP_WIDTH > window.innerWidth
	if (fromLeftEdge < 0) {
		posLeft = Math.floor(left + width / 2)
	} else if (fromRightEdge) {
		posLeft = Math.floor(left + width / 2) - POPUP_WIDTH
	}

	popupEl
		.style('left', `${posLeft}px`)
		.style('top', `${posTop}px`)
		.classed('is-visible', true)

	// find show capacities
	const data = d.shows.map(show => {
		const venue = getVenue(show.venue)
		return {
			capacity: venue.capacity,
			name: venue.venue,
			opener: show.order > 0,
			date: parseDate(show.date)
		}
	}).filter(d => d.date >= begin && d.date <= end)

	const bigIndex = d3.scan(data, (a,b) => b.capacity - a.capacity)
	const biggest = data[bigIndex]
	const bigCapacity = biggest.capacity ? formatNumber(biggest.capacity) : 'N/A'
	const bigName = biggest.name
	
	const openCount = data.filter(d => d.opener).length
	const opened = grammarize(openCount, 'opened')
	const headlined = grammarize(data.length - openCount, 'headlined')
	popupNameEl.text(d.name)

	const html = `Played ${data.length} shows in the NYC area since 2013.
	They have <span>${headlined}</span> and have <span>${opened}</span>.
	Their biggest venue was at <span>${bigName}</span> with a capacity of <span>${bigCapacity}</span>.`

	popupTextEl.html(html)
	// popupBiggestEl.text(`Biggest capacity: ${biggestFormatted}`)

	const shows = showsEl.selectAll('circle').data(data)

	const showsEnter = shows.enter().append('circle')

	const showsMerge = shows.merge(showsEnter)

	showsMerge
		.attr('r', d => scale.size(d.capacity))
		.attr('cx', d => scale.date(d.date))
		.attr('cy', 0)

	shows.exit().remove()

	const recentData = data.reverse().slice(0, 5)

	const recent = popupShowsEl.selectAll('li').data(recentData)

	recent.exit().remove()

	recent.enter().append('li')
		.merge(recent)
		.html(d => {
			const capacity = d.capacity ? formatNumber(d.capacity) : 'N/A'
			return `${d.name} <span>(${capacity})</span>`
		})
}

function setupScales() {
	const step = (MAX_RADIUS - MIN_RADIUS) / 5
	const sizeDomain = [200, 500, 1000, 3000] 
	const sizeRange = d3.range(MIN_RADIUS, MAX_RADIUS, step)
	scale.size = d3.scaleThreshold().domain(sizeDomain).range(sizeRange)

	scale.date = d3.scaleTime().domain([begin, end]).range([0, chartWidth]).nice()
}

function setupChart() {
	// GROSS MAGIC NUMBER
	chartWidth = ((POPUP_WIDTH - POPUP_MARGIN - 10) * 0.6) - MARGIN.left - MARGIN.right
	chartHeight = MAX_RADIUS * 2 - MARGIN.top

	const band = visEl.selectAll('.band')

	const bandEnter = band.data(bands)
		.enter()

	bandEnter.append('p')
		.attr('class', 'band')
		.text(d => d.name)
		.classed('alphabet', d => d.first_letter)
		.on('mouseenter', updatePopup)

	containerEl.on('mouseleave', () => {
		popupEl.classed('is-visible', false)
	})

	searchLaunchEl.on('mouseenter', () => {
		popupEl.classed('is-visible', false)
	})
}

function setupPopupVis() {
	svg.attr('width', chartWidth + MARGIN.left + MARGIN.right)
	svg.attr('height', chartHeight + MARGIN.top + MARGIN.bottom)

	svg.append('g')
      .attr('class', 'axis axis__x')
      .attr('transform', `translate(${MARGIN.left}, ${MARGIN.top})`)
      .call(d3.axisBottom(scale.date)
      		.tickFormat(d3.timeFormat('%b %Y'))
      		.ticks(5)
      )

	timelineEl = svg.append('g')
		.attr('class', 'timeline')
		.attr('transform', `translate(${MARGIN.left}, ${MARGIN.top})`)


	pathEl = timelineEl.append('path').attr('class', 'line')

	showsEl = timelineEl.append('g').attr('class', 'shows')
}

function setupScroll() {
	const visHeight = visEl.node().offsetHeight
	
	containerEl.style('height', `${visHeight}px`)
	
	const controller = new ScrollMagic.Controller()
	
	const scene = new ScrollMagic.Scene({
		triggerElement: '#search',
		triggerHook: 0,
		duration: visHeight,
	})
	
	scene
		.on('enter', event => {
			containerEl.classed('is-static', true)

		})
		.on('leave', event => {
			containerEl.classed('is-static', false)
		})
		.addTo(controller)
}

function launchSearch() {
	findEl.classed('is-visible', true)
	searchLaunchEl.classed('is-hidden', true)
}

function closeSearch() {
	findEl.classed('is-visible', false)
	searchLaunchEl.classed('is-hidden', false)
}

function scrollTo(e) {
	e.preventDefault()
	smoothScroll.animateScroll(
		d3.select('#search').node(),
		null,
	    {
	    	speed: 400,
	    	easing: 'easeInOutCubic',
	    	offset: 0,
		}
	)
	return false
}

function setupEvents() {
	searchLaunchEl.on('click', launchSearch)
	findCloseEl.on('click', closeSearch)
	d3.select('.jump-to-search').node().addEventListener('click', scrollTo)
}

function init(data) {
	venues = data.venues
	bands = data.bands
	addAlphabet()
	setupChart()
	setupScroll()
	setupScales()
	setupPopupVis()
	setupEvents()

}

export default { init }

