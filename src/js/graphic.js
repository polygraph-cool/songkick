import flock from './flock'
let ready = true
const t = d3.select('.test')
const test = () => {
	t.text(window.scrollY)
	ready = true
}

const init = () => {
	flock.init()
	window.addEventListener('scroll', () => {	
		if (ready) {
			ready = false
			requestAnimationFrame(test)
		}
	})
}

export default { init }
