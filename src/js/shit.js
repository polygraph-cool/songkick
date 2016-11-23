var c=document.getElementById("canvas-test");
	var ctx=c.getContext("2d");
	
	function draw(width,height,unit,matrix){
		ctx.clearRect (0, 0, width, height)

		let radius = unit / 2
		let i
		let j
		
		let count = 0
		for (i = 0; i < matrix.length; ++i) {
			for (j = 0; j < matrix[i].length; ++j) {
				const size = radius * (matrix[i][j]) //scale down
				count++
				if (size >= 1) {
					var x = 0 + ( j * unit) + radius
					var y = 0 + ( i * unit ) + radius
					ctx.beginPath();
					ctx.arc(x, y, size, 0, Math.PI * 2, true)
					ctx.fill()
				}
			}
		}
		console.log(count)
	}
	
	const funTime = () => {
		console.log(JSON.stringify(result))
	}

	let a = 0
	const result = []
	const awesome = () => {
		console.log(a)
		// ctx.drawImage(images[a], 0, 0)
		window.$('#canvas-test').halftone({
			'sample' : 8,
			'background': 'rgba(255,255,255,0)'
		}, (r) => {
			result.push(r)
			a++
			if (a < images.length) awesome()
			else funTime()
		})
	}

	let i = 0
	const images = []
	const loadNext = () => {
		loadImage(`assets/frames/${i + 1}.png`, (err, img) => {
			images.push(img)
			i++
			if (i < 74) loadNext()
			else awesome()
		})
		
	}
	loadNext()
	

	// vid.addEventListener('play', function() {
	// 	console.log(this)
	// 	// var c=document.getElementById("canvas-test");
	// 	// var ctx=c.getContext("2d");
	// 	setTimeout(() => {
	// 		ctx.drawImage(this, 0, 0)

	// 		window.$('#canvas-test').halftone({
	// 			'sample' : 8,
	// 			'background': 'rgba(255,255,255,0)'
	// 		});
	// 	}, 2000)
		
	// })



	
	// loadImage('assets/lake-street-dive.png', (err, img) => {
		
	// 		//write a gradient into the canvas so we have some image data to process...
	// 		window.$('#canvas-test').halftone({
 //             'sample' : 5,
 //             'background': 'rgba(255,255,255,0)'
 //          });
	// })