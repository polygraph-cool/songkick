import * as d3 from 'd3'

let venues
let bands

function test() {
	const visEl = d3.select('.search__vis')

	const band = visEl.selectAll('.band')

	const bandEnter = band.data(bands)
		.enter()

	bandEnter.append('p')
		.attr('class', 'band')
		.text(d => d.name)
}

function init(data) {
	venues = data.venues
	bands = data.bands
	test()
}

export default { init }

