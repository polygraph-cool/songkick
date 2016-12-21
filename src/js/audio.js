import * as d3 from 'd3'
const audioButtonEl = d3.selectAll('.btn__audio')

let audioPlayer
let playingAudio

function pause() {
	if (playingAudio) {
		let v = 1
		const t = d3.timer(elapsed => {
			v -= elapsed / 1000
			audioPlayer.volume = Math.max(0, v)
			if (v < 0) {
				t.stop()
				audioPlayer.pause()
				audioButtonEl.classed('is-playing', false)
				playingAudio = false
			}
		})
	}
}

function handle() {
	if (playingAudio) {
		pause()
	} else {
		const src = this.getAttribute('data-src')
		const url = `https://p.scdn.co/mp3-preview/${src}`
		d3.select(this).classed('is-playing', true)
		audioPlayer.src = url
		audioPlayer.load()
		audioPlayer.volume = 0
		audioPlayer.play()
	}
}

function setup() {
	audioPlayer = document.createElement('audio')
	audioPlayer.addEventListener('play', () => {
		playingAudio = true
		let v = 0
		const t = d3.timer(elapsed => {
			v += elapsed / 1000
			audioPlayer.volume = Math.min(1, v)
			if (v > 1) {
				t.stop()
			}
		})
	})	

	audioButtonEl.on('click', handle)
}

export default { setup, pause }
