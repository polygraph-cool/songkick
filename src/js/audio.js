function setupAudio() {
	const el = d3.select('.audio') 
	const ca = el.select('canvas')
	const ct = ca.node().getContext('2d')
	const size = 480
	
	ca
		.attr('width', size)
		.attr('height', size)
		.style('width', `${size}px`)
		.style('height', `${size}px`)

	const context = new (window.AudioContext || window.webkitAudioContext)()
	const analyser = context.createAnalyser()
	const audioElement = document.createElement('audio')

	audioElement.src = 'assets/potus-b.mp3'
	
	audioElement.addEventListener('canplay', function() {
		if (!audioReady) listen()
		audioReady = true
	})

	const listen = () => {
		const source = context.createMediaElementSource(audioElement);
		
		// Connect the output of the source to the input of the analyser
		source.connect(analyser);

		analyser.smoothingTimeConstant = 0.5

		// Connect the output of the analyser to the destination
		analyser.connect(context.destination);

		analyser.fftSize = 128
		const frequencyData = new Uint8Array(analyser.frequencyBinCount)

		const update = () => {
			// Get the new frequency data
			analyser.getByteFrequencyData(frequencyData);

			// ct.clearRect(0, 0, size, size)
			// ct.fillStyle = 'black'
			
			const mostBins = Math.floor(frequencyData.length * 0.7)
			factors = frequencyData.slice(0, mostBins).map(d => d / 256 * 100)
			avg = d3.mean(factors)
			
			// const radius = size / 2
			// const base = avg * radius / 4 / 100
			// const tempBands = bands.slice(0,2000)
			// tempBands.forEach((d, i) => {
			// 	const index = i % len
			// 	const radians = index / len * TWO_PI
			// 	const f = factors[index] * radius / 4 / 100
			// 	const travel = Math.floor(i / len) * (f * .02 + avg * 0.02)
			// 	const x = radius + Math.cos(radians) * (radius / 6 + travel)
			// 	const y = radius + Math.sin(radians) * (radius / 6 + travel)
			// 	ct.fillRect(x, y, 1,1)
			// })

			// Schedule the next update
			requestAnimationFrame(update)
		}

		update()
		render()
		audioElement.volume = 0.1
		audioElement.play()
		audioElement.loop = true
		audioElement.addEventListener('ended', () => {
			console.log('end')
		})
	}
}