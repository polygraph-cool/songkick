import fetchData from './fetch-data'
import made from './made'
import search from './search'
import ascent from './ascent'

const init = () => {
	console.time('fetch data')
	fetchData((err, data) => {
		console.timeEnd('fetch data')
		const venues = data[0]
		const bands = data[1]
		const history = data[2]
		// const bands = data[1].filter(d => d.name === 'Lake Street Dive')

		// flock.init({ venues, bands })
		made.init({ venues, bands })
		search.init({ venues, bands })
		// ascent.init({ venues, history })
	})
}

export default { init }

