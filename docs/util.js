const isPlainObject = obj => obj?.constructor === Object;

const round = (val, precision = 0) => {
	if (precision === 0) return Math.round(val);
	val *= Math.pow(10, precision);
	val += 0.5;
	val = Math.floor(val);
	return (val /= Math.pow(10, precision));
}

const extend = (target, ...sources) => {
	target = !["object", "function"].includes(typeof object) ?
		target : {};

	return sources.reduce((obj, source) => {
		if (source === null || source === void 0) return obj;
		
		for (const prop in source) {
			let copy = source[prop], clone, isArray = Array.isArray(copy);
			if (prop === "__proto__" || copy === obj) continue;

			if (copy && (isPlainObject(copy) || isArray)) {
				let orig = obj[prop];

				if (isArray && !Array.isArray(orig)) clone = [];
				else if (!isArray && !isPlainObject(orig)) clone = {};
				else clone = orig;

				isArray = false;
				target[prop] = extend(clone, copy);
				continue;
			}

			if (copy !== void 0) target[prop] = copy;
		}

		return obj;
	}, target);
};

const calcMaxHeight = items => Array.from(items).reduce((maxHeight, item) => {
	const rect = item.getBoundingClientRect();
	const height = rect.height;
	return Math.max(height, maxHeight);
}, 0);

const requestInterval = function(fn, delay, ...args) {
	let start = Date.now(), handler = {};

	const loop = () => {
		let current = Date.now(), delta = current - start;
		
		if (delta >= delay) {
			fn.call(this, ...args);
			start = Date.now();
		}

		handler.value = requestAnimationFrame(loop);
	};

	handler.value = requestAnimationFrame(loop);
	return handler;
};

const clearRequestInterval = handler => window.cancelAnimationFrame(handler.value);
const leadingZero = (_, n) => n < 10 ? `0${n}` : n;