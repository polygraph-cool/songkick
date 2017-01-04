import * as d3 from 'd3'
import ScrollMagic from 'scrollmagic'
import smoothScroll from 'smooth-scroll'

let venues
let bands

const alphabet = 'abcdefghijklmnopqrstuvwxyz'.split('').reverse()
const containerEl = d3.select('#search')
const visEl = containerEl.select('.search__vis')
const popupEl = containerEl.select('.search__popup')
const popupNameEl = popupEl.select('.popup__name')
const popupTextEl = popupEl.select('.popup__text')
const popupShowsEl = popupEl.select('.popup__shows')
const popupVisEl = popupEl.select('.popup__vis')
const svg = popupVisEl.select('svg')
// const searchLaunchEl = containerEl.select('.search__launch')
const findEl = containerEl.select('.search__find')
const findInputEl = containerEl.select('.find__input input')
const resultsEl = containerEl.select('.find__results')


const popupFindEl = containerEl.select('.find__popup')
const popupFindNameEl = popupFindEl.select('.popup__name')
const popupFindTextEl = popupFindEl.select('.popup__text')
const popupFindShowsEl = popupFindEl.select('.popup__shows')
const popupFindVisEl = popupFindEl.select('.popup__vis')
const svgFind = popupFindVisEl.select('svg')

const POPUP_WIDTH = 360
const POPUP_MARGIN = 20
const MAX_RADIUS = 14
const MIN_RADIUS = 2
const MARGIN = { top: 20, bottom: 20, left: 20, right: 20 }

let timelineEl
let pathEl
let showsEl

let timelineFindEl
let pathFindEl
let showsFindEl

let scale = {}
let chartWidth
let chartHeight

let prevSelected

let mobile
let mobileDevice = d3.select('html').classed('is-mobile')
const BREAKPOINT = 768


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

	if (prevSelected) prevSelected.classed('is-selected', false)
}

function updatePopupFind(d) {
	popupFindEl
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
	popupFindNameEl.text(d.name)

	const html = `Played ${data.length} shows in the NYC area since 2013.
	They have <span>${headlined}</span> and have <span>${opened}</span>.
	Their biggest venue was at <span>${bigName}</span> with a capacity of <span>${bigCapacity}</span>.`

	popupFindTextEl.html(html)
	// popupBiggestEl.text(`Biggest capacity: ${biggestFormatted}`)

	const shows = showsFindEl.selectAll('circle').data(data)

	const showsEnter = shows.enter().append('circle')

	const showsMerge = shows.merge(showsEnter)

	showsMerge
		.attr('r', d => scale.size(d.capacity))
		.attr('cx', d => scale.date(d.date))
		.attr('cy', 0)

	shows.exit().remove()

	const recentData = data.reverse().slice(0, 5)

	const recent = popupFindShowsEl.selectAll('li').data(recentData)

	recent.exit().remove()

	recent.enter().append('li')
		.merge(recent)
		.html(d => {
			const capacity = d.capacity ? formatNumber(d.capacity) : 'N/A'
			return `${d.name} <span>(${capacity})</span>`
		})
}

function handleSearch() {
	popupFindEl.classed('is-visible', false)
	visEl.classed('is-disabled', false)
	const val = this.value.trim().toLowerCase()
	if (val.length > 1) {
		const re = new RegExp(`\\b${val}`)
		let results = bands.filter(d => d.name.toLowerCase().match(re))
			.slice(0, 5)
		
		if (!results.length) results.push({ name: 'No matches', empty: true })
		const li = resultsEl.selectAll('li').data(results)

		li.enter().append('li')
			.merge(li)
			.text(d => d.name)
			.on('click', d => {
				if(!d.empty) handleResult(d)
			})

		li.exit().remove()
		resultsEl.classed('is-visible', true)
	} else {
		resultsEl.classed('is-visible', false)
		resultsEl.html('')
	}
}

function handleResult(d, i) {
	updatePopupFind(d)
	resultsEl.classed('is-visible', false)
	resultsEl.html('')
	findInputEl.node().value = ''
	popupFindEl.classed('is-visible', true)
	visEl.classed('is-disabled', true)
	
	const id = `#sb-${d.id}`
	if (prevSelected) prevSelected.classed('is-selected', false)
	
	prevSelected = visEl.select(id)
	prevSelected.classed('is-selected', true)

	if (!mobile && !mobileDevice) scrollTo(id)
}

function scrollTo(el) {
	smoothScroll.animateScroll(
		d3.select(el).node(),
		null,
	    {
	    	speed: 500, // Integer. How fast to complete the scroll in milliseconds
	    	easing: 'easeInOutCubic', // Easing pattern to use
	    	offset: 75, // Integer. How far to offset the scrolling anchor location in pixels
	    	callback: function ( anchor, toggle ) {} // Function to run after scrolling
		}
	)
	return false
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

	if (!mobile && !mobileDevice) {
		const band = visEl.selectAll('.band')

		const bandEnter = band.data(bands)
			.enter()

		bandEnter.append('li')
			.attr('class', 'band')
			.attr('id', d => `sb-${d.id}`)
			.text(d => d.name)
			.classed('alphabet', d => d.first_letter)
			.on('mouseenter', updatePopup)

		visEl.on('mouseleave', () => {
			popupEl.classed('is-visible', false)
		})	
	}
	
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

function setupPopupFindVis() {
	svgFind.attr('width', chartWidth + MARGIN.left + MARGIN.right)
	svgFind.attr('height', chartHeight + MARGIN.top + MARGIN.bottom)

	svgFind.append('g')
      .attr('class', 'axis axis__x')
      .attr('transform', `translate(${MARGIN.left}, ${MARGIN.top})`)
      .call(d3.axisBottom(scale.date)
      		.tickFormat(d3.timeFormat('%b %Y'))
      		.ticks(5)
      )

	timelineFindEl = svgFind.append('g')
		.attr('class', 'timeline')
		.attr('transform', `translate(${MARGIN.left}, ${MARGIN.top})`)


	pathFindEl = timelineFindEl.append('path').attr('class', 'line')

	showsFindEl = timelineFindEl.append('g').attr('class', 'shows')
}

function setupScroll() {
	if (!mobile && !mobileDevice) {
		const visHeight = visEl.node().offsetHeight
	
		containerEl.style('height', `${visHeight}px`)
		
		const controller = new ScrollMagic.Controller()
		
		const scene = new ScrollMagic.Scene({
			triggerElement: '#search',
			triggerHook: 0,
			duration: visHeight - window.innerHeight / 2,
		})
		
		scene
			.on('enter', event => {
				findEl.classed('is-fixed', true)

			})
			.on('leave', event => {
				findEl.classed('is-fixed', false)
			})
			.addTo(controller)
	}
	
}

function handleClosePopup() {
	popupFindEl.classed('is-visible', false)
	visEl.classed('is-disabled', false)
}

function setupEvents() {
	findInputEl.on('keyup', handleSearch)
	popupFindEl.on('click', handleClosePopup)
}

function init(data) {
	venues = data.venues
	bands = data.bands

	const outerWidth = d3.select('body').node().offsetWidth
	mobile = outerWidth < BREAKPOINT

	addAlphabet()	
	setupChart()
	setupScales()
	setupPopupVis()	
	setupPopupFindVis()
	setupEvents()
	setupScroll()
}

export default { init }

