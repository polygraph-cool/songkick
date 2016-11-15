import fetchData from './fetch-data'
import flock from './flock'

const init = () => {
	fetchData((err, data) => {
		const venues = data[0]
		const bands = data[1]
		flock.init({ venues, bands })
	})
}

export default { init }

