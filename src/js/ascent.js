import * as d3 from 'd3'
import './utils/find'

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
		// find small
		band.small = shows.find(show => show.opener && show.capacity < 700)
		// find medium
		band.medium = shows.find(show => !show.opener && show.capacity >= 700 && show.capacity < 3000)
		// find big
		band.big = shows.find(show => !show.opener && show.capacity >= 3000)

		const start = band.small.normalized_days
		band.days_until_medium = band.medium ? band.medium.normalized_days - start : null 
		band.days_until_big = band.big ? band.big.normalized_days - start : null

		band.data = [{days: 0, h: 0}, {days: band.days_until_big, h: 1}]
		console.log(band.id, band.days_until_big)
	})
}

// function setupChart() {
// 	const maxDays = d3.max(history, d => {
// 		const last = d.shows.slice(-1)[0]
// 		return last.normalized_days
// 	})
// 	const maxCapacity = d3.max(history, d => {
// 		return d3.max(d.shows, s => s.capacity)
// 	})

// 	const w = 800
// 	const h = 500

// 	const margin = 40
// 	const scaleX = d3.scaleLinear().domain([0, maxDays]).range([0, w])
// 	const scaleY = d3.scaleLinear().domain([0, maxCapacity]).range([h, 0])
	
// 	const visEl = d3.select('.ascent__vis')
// 	const svg = visEl.append('svg')

// 	svg
// 		.attr('width', w + margin * 2)
// 		.attr('height', h + margin * 2)

// 	const chart = svg.append('g')
	
// 	chart.attr('transform', `translate(${margin},${margin})`)

// 	chart.append('g')
//       .attr('class', 'axis axis__x')
//       .attr('transform', `translate(0,${h})`)
//       .call(d3.axisBottom(scaleX))

//      chart.append('g')
//       .attr('class', 'axis axis__y')
//       .attr('transform', `translate(0,0)`)
//       .call(d3.axisLeft(scaleY))

// 	const line = d3.line()
// 		.x(d => scaleX(d.normalized_days))
// 		.y(d => scaleY(d.capacity))


// 	const band = chart.selectAll('.band')

// 	const bandEnter = band.data(history).enter()
	
// 	bandEnter.append('g').attr('class', 'band')
// 		.append('path')
//   			.attr('class', 'line')
//   			.attr('d', d => line(d.shows))
// }

function setupChart() {
	const maxDays = d3.max(history, d => d.days_until_big)
	
	// const maxCapacity = d3.max(history, d => {
	// 	return d3.max(d.shows, s => s.capacity)
	// })

	const w = 800
	const h = 500

	const margin = 40
	const scaleX = d3.scaleLinear().domain([0, maxDays]).range([0, w])
	const scaleY = d3.scaleLinear().domain([0, 1]).range([h, 0])
	
	const visEl = d3.select('.ascent__vis')
	const svg = visEl.append('svg')

	svg
		.attr('width', w + margin * 2)
		.attr('height', h + margin * 2)

	const chart = svg.append('g')
	
	chart.attr('transform', `translate(${margin},${margin})`)

	chart.append('g')
      .attr('class', 'axis axis__x')
      .attr('transform', `translate(0,${h})`)
      .call(d3.axisBottom(scaleX))

     chart.append('g')
      .attr('class', 'axis axis__y')
      .attr('transform', `translate(0,0)`)
      .call(d3.axisLeft(scaleY))

	const line = d3.line()
		.x(d => scaleX(d.days))
		.y(d => scaleY(d.h))
		.curve(d3.curveMonotoneY)


	const band = chart.selectAll('.band')

	const bandEnter = band.data(history).enter()
	
	bandEnter.append('g').attr('class', 'band')
		.append('path')
  			.attr('class', 'line')
  			.attr('d', d => line(d.data))
}

function init(data) {
	history = data.history
	venues = data.venues
	addVenueDetails()
	setupChart()
	console.log(history)
}

export default { init }

