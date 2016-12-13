import * as d3 from 'd3'
const audioButtonEl = d3.selectAll('.btn__audio')

let audioPlayer
let playingAudio

function pause() {
	if (playingAudio) {
		audioPlayer.pause()
		audioButtonEl.classed('is-playing', false)
		playingAudio = false	
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
		audioPlayer.play()
	}
}

function setup() {
	audioPlayer = document.createElement('audio')
	audioPlayer.addEventListener('play', () => {
		playingAudio = true
	})	

	audioButtonEl.on('click', handle)
}

export default { setup, pause }
