import * as d3 from 'd3'
// import './utils/find'

let history
let venues

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
	})
}

function test() {
	// console.log(ven)
	// history.forEach(band => {
	// 	const last = band.shows[band.shows.length - 1]
	// 	console.log(last.normalized_days)
	// })
	const visEl = d3.select('.ascent__vis')
	const svg = visEl.append('svg')

	svg
		.attr('width', 960)
		.attr('height', 540)
}

function init(data) {
	history = data.history
	venues = data.venues
	addVenueDetails()
	console.log(history)
}

export default { init }

