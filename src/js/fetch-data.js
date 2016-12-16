import * as d3 from 'd3'

function cleanVenues(row) {
	return {
		...row,
		capacity: +row.capacity,
	}
}

function loadVenues(cb) {
	d3.csv('assets/data/web_venues2.csv', cleanVenues, cb)
}

function cleanData(row) {
	const order = row.order.split('|').map(d => +d)
	const venue = row.venue.split('|')
	const date = row.date.split('|')
	return {
		id: row.id,
		name: row.name,
		tier: +row.tier,
		pX: +row.pX,
		pY: +row.pY,
		pR: +row.pR,
		bX: +row.bX,
		bY: +row.bY,
		bR: +row.bR,
		shows: order.map((d, i) => ({
			order: order[i],
			venue: venue[i],
			date: date[i],
		}))
	}
}

function loadData(cb) {
	d3.csv('assets/data/web_data2.csv', cleanData, cb)
}

function cleanHistory(data) {
	const parseDate = d3.timeParse('%Y-%m-%d')

	const bands = data.filter(d => d.shows.length)

	return bands.map(band => {
		const startDate = parseDate(band.shows[0].date)

		const shows = band.shows.map(show => {
			const currentDate = parseDate(show.date)
			// TODO assumption is that first appearance is opener
			const diff = d3.timeDay.count(startDate, currentDate)
			return {
				...show,
				date_parsed: currentDate,
				normalized_days: diff,
			}
		})

		return {
			...band,
			shows,
		}
	})
}

function loadHistory(cb) {
	d3.json('assets/data/web_history2.json', (err, data) => {
		const clean = cleanHistory(data)
		cb(err, clean)
	})
}


function init(cb) {
	d3.queue()
		.defer(loadVenues)
    	.defer(loadData)
    	.defer(loadHistory)
    	.awaitAll(cb)
}

export default init