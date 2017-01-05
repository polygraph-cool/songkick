import clonedeep from 'lodash.clonedeep'
import fetchData from './fetch-data'
import made from './made'
import search from './search'
import ascent from './ascent'
import { select } from './utils/dom'

function init() {
	// console.time('fetch data')
	fetchData((err, data) => {
		// console.timeEnd('fetch data')
		const venues = data[0]
		const bands = data[1]
		const history = data[2]
		const madeIt = data[3]

		made.init({ venues, bands: clonedeep(bands) }, () => {
			search.init({ venues, bands: clonedeep(bands) })
			ascent.init({ venues, history, made: madeIt })
			// insert video
			const html = `<iframe class='youtube-embed' width='100%' height='198px' src='https://www.youtube.com/embed/qftu7ZQieuw?enablejsapi=1&amp;enablejsapi=true&amp;playsinline=1&autoplay=0&controls=0&rel=0&showinfo=0&start=45' frameborder='0'></iframe>`
			const el = select('.inline-video')
			el.innerHTML = html
		})
		
		
	})
}

function resize() {
	made.resize()
	ascent.resize()
}

export default { init, resize }

