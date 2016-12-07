import * as d3 from 'd3'
import './utils/find'

let history
let venues

const BAND_NAMES = {'2575': 'Wade Bowen','4409368': 'Bad Suns','6325384': 'Misterwives','189890': 'The Boys','1077331': 'Lake Street Dive','423511': 'Emmanuel','3909026': 'Courtney Barnett','5767534': 'Torres','2337283': 'Great Caesar','6018139': 'ODESZA','5183683': 'Houndmouth','6664009': 'X Ambassadors','457177': 'Bob Moses','6140284': 'Sturgill Simpson'}

const visEl = d3.select('.ascent__vis')

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
		
		// proper algorithm
		// find small
		// band.small = shows.find(show => show.opener && show.capacity < 700)
		// // find medium
		// band.medium = shows.find(show => !show.opener && show.capacity >= 700 && show.capacity < 3000)
		// // find big
		// band.big = shows.find(show => !show.opener && show.capacity >= 3000)

		// fudged
		band.small = shows.find(show => show.capacity < 700)
		// find medium
		band.medium = shows.find(show => show.capacity >= 700 && show.capacity < 3000)
		// find big
		band.big = shows.find(show => !show.opener && show.capacity >= 3000)

		const start = band.small.normalized_days
		// band.days_until_medium = band.medium ? band.medium.normalized_days - start : null 
		band.days_until_big = band.big ? band.big.normalized_days - start : null

		// filter out shows that are after big perf and before start
		band.shows = band.shows.filter(show => {
			return (show.normalized_days - start) <= band.days_until_big
		})

		// yuck! find days since start
		band.shows.forEach(show => {
			show.days_since_start = show.normalized_days - start
		})
		// band.data = [{days: 0, h: 0}, {days: band.days_until_big, h: 1}]
		// console.log(band.id, band.days_until_medium, band.days_until_big)
	})

	history = history.filter(d => d.shows.length)

	history.sort((a, b) => d3.descending(a.days_until_big, b.days_until_big))
}

// function setupChart() {
// 	const daysMax = d3.max(history, d => {
// 		const last = d.shows.slice(-1)[0]
// 		return last.normalized_days
// 	})
// 	const maxCapacity = d3.max(history, d => {
// 		return d3.max(d.shows, s => s.capacity)
// 	})

// 	const w = 800
// 	const h = 500

// 	const margin = 40
// 	const scaleX = d3.scaleLinear().domain([0, daysMax]).range([0, w])
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

// function setupChart() {
// 	const daysMax = d3.max(history, d => d.days_until_big)
	
// 	// const maxCapacity = d3.max(history, d => {
// 	// 	return d3.max(d.shows, s => s.capacity)
// 	// })

// 	const w = 800
// 	const h = 500

// 	const margin = 40
// 	const scaleX = d3.scaleLinear().domain([0, daysMax]).range([0, w])
// 	const scaleY = d3.scaleLinear().domain([0, 1]).range([h, 0])
	
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
// 		.x(d => scaleX(d.days))
// 		.y(d => scaleY(d.h))
// 		.curve(d3.curveMonotoneY)


// 	const band = chart.selectAll('.band')

// 	const bandEnter = band.data(history).enter()
	
// 	bandEnter.append('g').attr('class', 'band')
// 		.append('path')
//   			.attr('class', 'line')
//   			.attr('d', d => line(d.data))
// }


// straight lines with bubbles for venues

function setupChart() {
	const daysMax = d3.max(history, d => d.days_until_big)

	const capacityMax = d3.max(history, d => d.big.capacity)
	const capacityMin = d3.min(history, d => d3.min(d.shows, e => e.capacity))
	
	// const maxCapacity = d3.max(history, d => {
	// 	return d3.max(d.shows, s => s.capacity)
	// })
	const margin = 24
	const itemHeight = 40

	const w = visEl.node().offsetWidth - margin * 2
	// const h = window.innerHeight * 0.8 - margin * 2
	const h = itemHeight * (history.length + 1) - (margin * 2)
	
	const scaleX = d3.scaleLinear().domain([0, daysMax]).range([0, w])
	
	// const bandDomain = d3.range(history.length)
	// const scaleY = d3.scaleBand()
	// scaleY
	// 	.domain(bandDomain)
	// 	.range([0, h])
	// 	.paddingOuter(1)
	// 	.paddingInner(0.2)
	// 	.round()

	// const bandwidth = Math.floor(scaleY.bandwidth())

	// size scale
	const maxRadius = itemHeight / 4
	const minRadius = 3
	const step = (maxRadius - minRadius) / 5
	const sizeDomain = [200, 500, 1000, 3000] 
	const sizeRange = d3.range(minRadius, maxRadius, step)
	const scaleSize = d3.scaleThreshold().domain(sizeDomain).range(sizeRange)

	
	const svg = visEl.append('svg')

	svg
		.attr('width', w + margin * 2)
		.attr('height', h + margin * 2)

	const chart = svg.append('g')
	
	chart.attr('transform', `translate(${margin},${margin})`)


	svg.append('g')
      .attr('class', 'axis axis__x')
      .attr('transform', `translate(${margin}, ${margin})`)
      .call(d3.axisTop(scaleX))

	const line = d3.line()
		.x(d => scaleX(d))
		.y(d => 0)

	const band = chart.selectAll('.band')

	const bandEnter = band.data(history)
		.enter()
	.append('g').attr('class', 'band')
		.attr('transform', (d, i) => `translate(0,${(i + 1) * itemHeight})`)
	
	bandEnter.append('text')
		.text(d => BAND_NAMES[d.id])
		.attr('y', -12)

	bandEnter.append('path')
		.attr('class', 'line')
		.attr('d', d => line([0, d.days_until_big]))

	const show = bandEnter.selectAll('circle')

	const showEnter = show.data(d => d.shows)
		.enter()
	.append('circle')
		.attr('cx', d => scaleX(d.days_since_start))
		.attr('cy', 0)
		.attr('r', d => scaleSize(d.capacity))

}

function init(data) {
	history = data.history
	venues = data.venues
	addVenueDetails()
	setupChart()
	console.log(history)
}

export default { init }

