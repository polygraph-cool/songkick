import * as d3 from 'd3'
import ScrollMagic from 'scrollmagic'
import smoothScroll from 'smooth-scroll'
import './utils/find'

let venues
let venuesWhitelist
let bands
let bandSel

const blacklist = ['6','19','27','64','75','88','119','180','190','197','228','238','241','242','251','254','255','256','262','265','266','269','278','282','284','286','287','292','293','294','295','303','304','306','310','315','316','317','326','346','347','351','356','358','362','363','366','367','368','369','370','372','376','377','378','379','382','383','384','385','388','391','393','394','395','396','397','398','399','400','401','402','403','405','406','407','408','411','412','413','414','415','417','418','419','420','421','422','423','425','426','427','428','429','431','432','433','434','435','436','437','438','439','440','441','442','443','444','445','446']
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

const venueEl = containerEl.select('.search__venue')
const venueNameEl = venueEl.select('.venue__info-name')
const venueCapacityEl = venueEl.select('.venue__info-capacity')
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
		
		const bandResults = bands.filter(d => d.name.toLowerCase().match(re))
			.slice(0, 5)
		
		const venueResults = venuesWhitelist.filter(d => d.venue.toLowerCase().match(re))
			.slice(0, 3)

		let results
		if (!mobile && !mobileDevice)  results = bandResults
		else results = bandResults.concat(venueResults)
		
		if (!results.length) results.push({ name: 'No matches', empty: true })
		const li = resultsEl.selectAll('li').data(results)

		li.enter().append('li')
			.merge(li)
			.attr('class', d => d.name ? 'result-band' : 'result-venue')
			.text(d => d.name ? d.name : d.venue)
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
	if (d.name) {
		handleCloseVenue()
		updatePopupFind(d)
		popupFindEl.classed('is-visible', true)
		visEl.classed('is-disabled', true)
		
		const id = `#sb-${d.id}`
		if (prevSelected) prevSelected.classed('is-selected', false)
		
		prevSelected = visEl.select(id)
		prevSelected.classed('is-selected', true)

		if (!mobile && !mobileDevice) scrollTo(id)	
	} else {
		handleClosePopup()
		filterVenues(d)
	}
	findInputEl.node().value = ''
	resultsEl.classed('is-visible', false)
	resultsEl.html('')
}

function filterVenues(d) {
	const { venue, capacity, id } = d
	bandSel
		.classed('is-not-venue', true)
		.classed('is-venue', b => b.shows.find(s => s.venue === id))

	const formatted = capacity ? formatCapacity(capacity) : 'N/A'
	venueNameEl.text(venue)
	venueCapacityEl.text(`Capacity: ${formatted}`)
	venueEl.classed('is-visible', true)
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
		bandSel = visEl.selectAll('.band')
			.data(bands)

		const bandEnter = bandSel.enter().append('li')
		
		bandEnter
			.attr('class', 'band')
			.attr('id', d => `sb-${d.id}`)
			.html(d => `&nbsp;${d.name}&nbsp;`)
			.classed('alphabet', d => d.first_letter)
			.on('mouseenter', updatePopup)

		bandSel = bandSel.merge(bandEnter)

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

function handleCloseVenue() {
	venueEl.classed('is-visible', false)
	bandSel
		.classed('is-venue', false)
		.classed('is-not-venue', false)

}

function setupEvents() {
	findInputEl.on('keyup', handleSearch)
	popupFindEl.on('click', handleClosePopup)
	venueEl.on('click', handleCloseVenue)
}

function init(data) {
	venues = data.venues
	venuesWhitelist = venues.filter(v => blacklist.indexOf(v.id) === -1)
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


	// const filtered = venues.filter(v => {
	// 	return !bands.filter(b => {
	// 		return b.shows.find(s => s.venue === v.id)
	// 	}).length
	// })

	// console.log(filtered.map(f => `'${f.id}'`).join(','))
	// const csvOut = d3.csvFormat(filtered)
	// console.log(csvOut)
}

export default { init }

