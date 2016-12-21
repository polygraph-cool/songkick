import * as d3 from 'd3'
const audioButtonEl = d3.selectAll('.btn__audio')

let audioPlayer
let playingAudio
let timer
let currentVolume = 0
let targetVolume
let inc
let onDeck

function pause() {
	if (playingAudio) fade('out')
}

function fade(direction) {
	if (direction === 'in') {
		inc = 1
		targetVolume = 1
	} else {
		inc = -1
		targetVolume = 0
	}
	if (timer) timer.stop()
	timer = d3.timer(updateTimer)
}

function play(el) {
	if (playingAudio) {
		onDeck = el
		fade('out')
	}
}

// function pause(cb) {
// 	if (playingAudio) {
// 		let v = 1
// 		const t = d3.timer(elapsed => {
// 			v -= elapsed / 1000
// 			audioPlayer.volume = Math.max(0, v)
// 			if (v < 0) {
// 				t.stop()
// 				audioPlayer.pause()
// 				audioButtonEl.classed('is-playing', false)
// 				playingAudio = false
// 			}
// 		})
// 	}
// }

function handle() {
	if (playingAudio) {
		fade('out')
	} else {
		onDeck = false
		const src = this.getAttribute('data-src')
		const url = `https://p.scdn.co/mp3-preview/${src}`
		d3.select(this).classed('is-playing', true)
		audioPlayer.src = url
		audioPlayer.load()
		audioPlayer.play()
		playingAudio = true
		fade('in')
	}
}

function updateTimer(elapsed) {
	currentVolume += elapsed / 1000 * inc
	currentVolume = Math.min(Math.max(0, currentVolume), 1)
	audioPlayer.volume = currentVolume
	if (targetVolume === 0 && currentVolume === 0) {
		timer.stop()
		audioPlayer.pause()
		audioButtonEl.classed('is-playing', false)
		playingAudio = false
		if (onDeck) handle.call(onDeck)
	} else if (targetVolume === 1 && currentVolume === 1) {
		timer.stop()
	}
}

function setup() {
	audioPlayer = document.createElement('audio')
	audioPlayer.volume = 0
	audioButtonEl.on('click', handle)
}

export default { setup, pause, play }
