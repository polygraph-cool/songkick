import fetchData from './fetch-data'
// import flock from './flock'
// import test from './test'
import made from './made'

const init = () => {
	fetchData((err, data) => {
		const venues = data[0]
		const bands = data[1].slice(0, 3000)
		// flock.init({ venues, bands })
		made.init({ venues, bands })
		// test.init({ venues, bands })
	})
}

export default { init }

