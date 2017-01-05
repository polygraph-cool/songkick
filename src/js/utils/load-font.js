import 'promis'
import FontFaceObserver from 'fontfaceobserver'
import { addClass } from './dom'

const htmlEl = document.documentElement
const TIMEOUT = 5000

// function addFont({ family, weight, style }) {
// 	console.log(family, weight, style)
// 	// const name = family.toLowerCase().replace(/ /g, '-')
// 	// const className = `loaded-${name}-${weight}`
// 	// addClass(htmlEl, className)
// }

function handleError(err) {
	console.error(err)
}

function addFont(family) {
	const name = family.toLowerCase().replace(/ /g, '-')
	const className = `loaded-${name}`
	addClass(htmlEl, className)
}

function createObserver(font) {
	const { family, name, variations } = font
	const promises = variations.map(v => {
		const { weight, style, part } = v
		const fontObserver = new FontFaceObserver(`${name} ${part}`, { weight, style })
		return fontObserver
			.load(null, TIMEOUT)
			// .then(() => addFont(font))
			// .catch(handleError)
	})

	Promise.all(promises)
		.then(addFont(family))
		.catch(handleError)
}

function loadFont(fonts) {
	fonts.forEach(createObserver)
}

export default loadFont
