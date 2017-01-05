import loadFont from './utils/load-font'

loadFont([
	{ family: 'Whitney subset', name:'Whitney SSm subset', variations: [
		{ weight: 400, style: 'normal', part: 'A' },
		{ weight: 400, style: 'normal', part: 'B'  },
	]}
])

loadFont([
		{ family: 'Whitney', name:'Whitney SSm', variations: [
		{ weight: 400, style: 'normal', part: 'A' },
		{ weight: 400, style: 'italic', part: 'A'  },
		{ weight: 700, style: 'normal', part: 'A'  },
		{ weight: 700, style: 'italic', part: 'A'  },
		{ weight: 400, style: 'normal', part: 'B'  },
		{ weight: 400, style: 'italic', part: 'B'  },
		{ weight: 700, style: 'normal', part: 'B'  },
		{ weight: 700, style: 'italic', part: 'B'  },
	]},

	{ family: 'Mercury', name:'Mercury SSm', variations: [
		{ weight: 400, style: 'normal', part: 'A' },
		{ weight: 400, style: 'italic', part: 'A'  },
		{ weight: 700, style: 'normal', part: 'A'  },
		{ weight: 700, style: 'italic', part: 'A'  },
		{ weight: 400, style: 'normal', part: 'B'  },
		{ weight: 400, style: 'italic', part: 'B'  },
		{ weight: 700, style: 'normal', part: 'B'  },
		{ weight: 700, style: 'italic', part: 'B'  },
	]},
])
	