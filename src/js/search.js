import * as d3 from 'd3'
import ScrollMagic from 'scrollmagic'

let venues
let bands

const alphabet = 'abcdefghijklmnopqrstuvwxyz'.split('').reverse()
const containerEl = d3.select('#search')
const visEl = d3.select('.search__vis')
const popupEl = d3.select('.search__popup')
const popupNameEl = d3.select('.popup__name')
const popupShowsEl = d3.select('.popup__shows')
const popupVisEl = d3.select('.popup__vis')
const svg = popupVisEl.select('svg')

const POPUP_WIDTH = 200

let timelineEl
let pathEl
let showsEl
let scale = {}

const parseDate = d3.timeParse('%Y-%m-%d')

const begin = parseDate('2013-01-01')
const end = parseDate('2016-12-31')

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

function updatePopup(d) {
	const bb = this.getBoundingClientRect()
	const { top, right, left, bottom, width, height } = bb

	const posLeft = Math.floor(left - POPUP_WIDTH / 2)
	const posTop = Math.floor(top + height * 2)
	
	popupEl
		.style('left', `${posLeft}px`)
		.style('top', `${posTop}px`)

	popupNameEl.text(d.name)
	popupShowsEl.text(`NYC shows: ${d.shows.length}`)

	// find show capacities
	const data = d.shows.map(show => {
		const venue = getVenue(show.venue)
		return {
			capacity: venue.capacity,
			opener: show.order > 0,
			date: parseDate(show.date)
		}
	}).filter(d => d.date >= begin && d.date <= end)
	
	const shows = showsEl.selectAll('circle').data(data)

	const showsEnter = shows.enter().append('circle')

	const showsMerge = shows.merge(showsEnter)

	showsMerge
		.attr('r', d => scale.size(d.capacity))
		.attr('cx', d => scale.date(d.date))
		.attr('cy', 0)

	shows.exit().remove()

}

function setupScales() {
	const maxRadius = 8
	const minRadius = 1
	const step = (maxRadius - minRadius) / 5
	const sizeDomain = [200, 500, 1000, 3000] 
	const sizeRange = d3.range(minRadius, maxRadius, step)
	scale.size = d3.scaleThreshold().domain(sizeDomain).range(sizeRange)

	scale.date = d3.scaleTime().domain([begin, end]).range([0, 187])
}

function setupChart() {
	const band = visEl.selectAll('.band')

	const bandEnter = band.data(bands)
		.enter()

	bandEnter.append('p')
		.attr('class', 'band')
		.text(d => d.name)
		.classed('alphabet', d => d.first_letter)
		.on('mouseenter', updatePopup)
}

function setupPopupVis() {
	// TODO fix
	const margin = { top: 20, bottom: 10, left: 10, right: 10 }
	const w = 187 - margin.left - margin.right
	const h = 60 - margin.top - margin.bottom
	svg.attr('width', w)
	svg.attr('height', h)

	svg.append('g')
      .attr('class', 'axis axis__x')
      .attr('transform', `translate(${margin.left}, ${margin.top})`)
      .call(d3.axisTop(scale.date))

	timelineEl = svg.append('g')
		.attr('class', 'timeline')
		.attr('transform', `translate(${margin.left}, ${margin.top})`)


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

function init(data) {
	venues = data.venues
	bands = data.bands
	addAlphabet()
	setupChart()
	setupScroll()
	setupScales()
	setupPopupVis()

}

export default { init }

