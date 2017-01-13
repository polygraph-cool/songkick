import loadCSS from './utils/load-css'
import { loadFontGroup } from './utils/load-font'

loadCSS('https://cloud.typography.com/7124072/6455372/css/fonts.css')

const whitney = [
	{
		family: 'Whitney',
		weight: 400,
		style: 'normal',
		parts: ['Whitney SSm A', 'Whitney SSm B'],
	},
	{
		family: 'Whitney',
		weight: 700,
		style: 'normal',
		parts: ['Whitney SSm A', 'Whitney SSm B'],
	},
	{
		family: 'Whitney',
		weight: 400,
		style: 'italic',
		parts: ['Whitney SSm A', 'Whitney SSm B'],
	},
	{
		family: 'Whitney',
		weight: 700,
		style: 'italic',
		parts: ['Whitney SSm A', 'Whitney SSm B'],
	},
]

const mercury = [
	{
		family: 'Mercury',
		weight: 400,
		style: 'normal',
		parts: ['Mercury SSm A', 'Mercury SSm B'],
	},
	{
		family: 'Mercury',
		weight: 700,
		style: 'normal',
		parts: ['Mercury SSm A', 'Mercury SSm B'],
	},
	{
		family: 'Mercury',
		weight: 400,
		style: 'italic',
		parts: ['Mercury SSm A', 'Mercury SSm B'],
	},
	{
		family: 'Mercury',
		weight: 700,
		style: 'italic',
		parts: ['Mercury SSm A', 'Mercury SSm B'],
	},
]

whitney.forEach(loadFontGroup)
mercury.forEach(loadFontGroup)
