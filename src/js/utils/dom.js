// DOM helper functions

// private
const selectionToArray = (selection) => {
	const len = selection.length
	const result = []
	for (var i = 0; i < len; i++) {
		result.push(selection[i])
	}
	return result
}

// public
const select = (selector) =>
	document.querySelector(selector)

const selectAll = (selector, parent = document) =>
	selectionToArray(parent.querySelectorAll(selector))

const find = (el, selector) =>
	selectionToArray(el.querySelectorAll(selector))

const removeClass = (el, className) =>
	el.classList ? el.classList.remove(className)
	: el.className = el.className.replace(new RegExp('(^|\\b)' + className.split(' ').join('|') + '(\\b|$)', 'gi'), ' ')

const addClass = (el, className) =>
	el.classList ? el.classList.add(className)
	: el.className += ' ' + className

const hasClass = (el, className) =>
	el.classList ? el.classList.contains(className)
	: new RegExp('(^| )' + className + '( |$)', 'gi').test(el.className)


const jumpTo = (el) => {
	if (document.body.scrollTop) document.body.scrollTop = el.offsetTop + 1
	else document.documentElement.scrollTop = el.offsetTop + 1
}

export {
	select,
	selectAll,
	find,
	removeClass,
	addClass,
	hasClass,
	jumpTo,
}
