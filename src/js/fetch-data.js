import * as d3 from 'd3'

function cleanVenues(row) {
	return {
		...row,
		capacity: +row.capacity,
	}
}

function loadVenues(cb) {
	d3.csv('assets/data/web_venues.csv', cleanVenues, cb)
}

function cleanData(row) {
	const order = row.order.split('|').map(d => +d)
	const venue = row.venue.split('|')
	const date = row.date.split('|')
	return {
		id: row.id,
		name: row.name,
		tier: +row.tier,
		shows: order.map((d, i) => ({
			order: order[i],
			venue: venue[i],
			date: date[i],
		}))
	}
}

function loadData(cb) {
	d3.csv('assets/data/web_data.csv', cleanData, cb)
}

function init(cb) {
	d3.queue()
		.defer(loadVenues)
    	.defer(loadData)
    	.awaitAll(cb)
}

export default init