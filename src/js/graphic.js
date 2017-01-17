import clonedeep from 'lodash.clonedeep'
import fetchData from './fetch-data'
import made from './made'
import search from './search'
import ascent from './ascent'

function init() {
	// console.time('fetch data')
	fetchData((err, data) => {
		// console.timeEnd('fetch data')
		const venues = data[0]
		const bands = data[1]
		const history = data[2]
		const madeIt = data[3]

		made.init({ venues, bands: clonedeep(bands) }, () => {
			ascent.init({ venues, history, made: madeIt })
			search.init({ venues, bands: clonedeep(bands) })
		})
		
		
	})
}

function resize() {
	made.resize()
	ascent.resize()
	search.resize()
}

export default { init, resize }

