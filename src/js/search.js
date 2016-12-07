import * as d3 from 'd3'
import ScrollMagic from 'scrollmagic'

let venues
let bands
const containerEl = d3.select('#search')
const visEl = d3.select('.search__vis')

function setupChart() {
	const band = visEl.selectAll('.band')

	const bandEnter = band.data(bands)
		.enter()

	bandEnter.append('p')
		.attr('class', 'band')
		.text(d => d.name)
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
			visEl.classed('is-static', true)

		})
		.on('leave', event => {
			visEl.classed('is-static', false)
		})
		.addTo(controller)
}

function init(data) {
	venues = data.venues
	bands = data.bands
	setupChart()
	setupScroll()
}

export default { init }

