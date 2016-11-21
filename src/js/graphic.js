import fetchData from './fetch-data'
// import flock from './flock'
// import test from './test'
import made from './made'

const init = () => {
	console.time('fetch data')
	fetchData((err, data) => {
		console.timeEnd('fetch data')
		const venues = data[0]
		const bands = data[1].slice(0,2500)
		// flock.init({ venues, bands })
		made.init({ venues, bands })
		// test.init({ venues, bands })
	})
}

export default { init }

