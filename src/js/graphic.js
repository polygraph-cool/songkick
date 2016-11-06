import flock from './flock'
import ScrollMagic from 'scrollmagic'

let ready = true
const t = d3.select('.test')
const m = d3.select('.magic')
const test = () => {
	t.text(window.scrollY)
	ready = true
}

const init = () => {
	flock.init()
	// window.addEventListener('scroll', () => {	
	// 	if (ready) {
	// 		ready = false
	// 		requestAnimationFrame(test)
	// 	}
	// })
	// const controller = new ScrollMagic.Controller()
	// const scene = new ScrollMagic.Scene({
	// 		triggerElement: '#trigger1',
	// 		duration: 1000,
	// 	})
	// 	.on('enter', event => {
	// 		m.text(event.type)
	// 	})
	// 	.on('leave', event => {
	// 		m.text(event.type)
	// 	})
	// 	.addTo(controller)
}

export default { init }
