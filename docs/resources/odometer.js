const extend = (target, ...sources) => {
	target = typeof target !== "object" && typeof target !== "function" ?
		target :
		{};

	loopSources: for (const source of sources) {
		if (source === null || source === void 0) continue loopSources;
		loopProps: for (const prop in source) {
			let copy = source[prop], clone, isArray = Array.isArray(copy);

			if (prop === "__proto__" || copy === target) continue loopProps;

			if (copy && (isPlainObject(copy) || isArray)) {
				orig = target[prop];

				if (isArray && !Array.isArray(orig)) clone = [];
				else if (!isArray && !isPlainObject(orig)) clone = {};
				else clone = orig;

				isArray = false;

				target[prop] = extend(clone, copy);
			} else if (copy !== void 0) target[prop] = copy;
		}
	}

	return target;
};

const range = (a, b, step = 1) => {
	const min = Math.min(a, b), max = Math.max(a, b);
	const delta = max - min ;
	const result = [];

	console.log(delta, step, min, max, step);
	for (let i = min; i < max; i += step) result.push(i);
	return result;
}

const round = (value, precision = 0) => {
	if (!precision) return Math.round(value);
	value *= Math.pow(10, precision);
	value += 0.5;
	value = Math.floor(value);
	return value /= Math.pow(10, precision);
};

const now = () => window.performance ? window.performance.now() : Date.now();
const fpart = val => val - round(val);
const isPlainObject = obj => obj?.constructor === Object;
const getCharCode = ch => ch.charCodeAt(0);

class Odometer {
	static cache = new Map();

	formatParsers = Object.freeze({
		number: /^\(?([^)]*)\)?(?:(.)(d+))?$/
	});

	framerate = 30;
	duration = 2000;
	countFramerate = 20;
	framesPerValue = 2;
	digitSpeedboost = 0.5;

	msPerFrame = 1000 / this.framerate;
	countMsPerFrame = 1000 / this.countFramerate;

	defaults = Object.freeze({
		format: "",
		auto: false,
		duration: 3000,
		animation: "count",
		numberFormat: "(,ddd).dd",
		letterFormat: "normal",
		characterType: "digit"
	});

	characterTypes = Object.freeze({
		digit: /[0-9]/,
		uppercase: /[A-Z]/,
		lowercase: /[a-z]/,
		mixedCase: /[A-Z]/i
	});

	constructor(element, options) {
		this.element = element;
		this.options = extend({}, this.defaults, options);

		if (Odometer.cache.get(this.element)) return Odometer.cache.get(this.element);
		Odometer.cache.set(this.element, this);

		this.characterSet = [];
		this.characterType = this.getCharacterType();
		this.populateCharacters();
	}

	getCharacterType() {
		if (this.characterTypes.digit.test(this.options.value)) return "digit";
		if (this.characterTypes.mixedCase.test(this.options.value)) return "mixed";

		for (const prop in this.characterTypes) {
			if (this.characterTypes.hasOwnProperty(prop)) {
				if (this.characterTypes[prop].test(this.options.value)) return prop;
			}
		}

		return "digit";
	}

	populateCharacters() {
		switch (this.characterType) {
			case ("digit"):
			case ("number"): {
				this.characterSet = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
			}
			case ("upper"):
			case ("uppercase"): 
			case ("capital"): {
				const uppercase = this.getUppercaseCharacters();
				this.characterSet = uppercase;
			}
			case ("lower"):
			case ("lowercase"): {
				const lowercase = this.getLowercaseCharacters();
				this.characterSet = lowercase;
			}
			case ("letter"): {
				const letters = this.getLetters();
				this.characterSet = letters;
			}
			default: {
				this.characterSet = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
			}
		}

		return this;
	}

	getLowercaseCharacters() {
		const startingCharCode = getCharCode("a");
		return range(0, 26).map(v => {
			const charCode = startingCharCode + v;
			return String.fromCharCode(charCode);
		});
	}

	getUppercaseCharacters() {
		const startingCharCode = getCharCode("A");
		return range(0, 26).map(v => {
			const charCode = startingCharCode + v;
			return String.fromCharCode(charCode);
		});
	}

	getLetters() {
		return [...this.getLowercaseCharacters(), ...this.getUppercaseCharacters()];
	}
}

/*class Odometer {
	static cache = new Map();

	numberFormatParser = /^\(?([^)]*)\)?(?:(.)(d+))?$/;
	framerate = 30;
	duration = 2000;
	countFramerate = 20;
	framesPerValue = 2;
	digitSpeedboost = 0.5;

	msPerFrame = 1000 / this.framerate;
	countMsPerFrame = 1000 / this.countFramerate;

	defaults = Object.freeze({
		format: "",
		auto: false,
		duration: 3000,
		animation: "count",
		numberFormat: "(,ddd).dd",
		letterFormat: "normal",
		characterType: "digit"
	});

	characterTypes = Object.freeze({
		digit: /[0-9]/,
		letter: /[a-z]/i,
		letterWithAccents: /[A-Za-zÀ-ÖØ-öø-ÿ]/i
	});

	constructor(element, options) {
		this.element = element;
		this.options = extend({}, this.defaults, options);

		if (Odometer.cache.get(this.element)) return Odometer.cache.get(this.element);
		Odometer.cache.set(this.element, this);

		this.characterType = this.getCharacterType();
		this.maxValues = ((this.options.duration / this.msPerFrame) / this.framesPerValue) | 0;
		this.resetFormat();
		this.value = this.clean(this.options.value ?? "");
		this.renderInner();
		this.render();

		this.isWatchingForMutations = false;

		try {
			const props = ["innerHTML", "innerText", "textContent"];

			props.forEach(prop => {
				if (!this.element[prop]) return;
				Object.defineProperty(this.element, prop, {
					get: () => {
						if (prop === "innerHTML") this.inner.outerHTML;
						return this.inner.innerText ?? this.inner.textContent;
					},
					set: val => this.update(val)
				});
			});
		} catch {
			this.watchForMutations();
		}
	}

	clearElement() {
		return (this.element.innerHTML = ""), void 0;
	}

	getCharacterType() {
		if (this.options.characterType) return this.options.characterType;
	}

	renderInner() {
		this.inner = document.createElement("div");
		this.inner.classList.add("odometer--inner");
		this.clearElement();
		return this.element.appendChild(this.inner);
	}

	watchForMutations() {
		try {
			if (!this.observer) this.observer = new MutationObserver(() => {
				const newValue = this.element.innerText;
				this.renderInner();
				this.render(this.value);
				return this.update(newValue);
			});

			this.isWatchingForMutations = true;
			return this.startWatching();
		} catch (e) {
			console.error(e);
		}
	}

	startWatching() {
		if (this.isWatchingForMutations) return this.observer.observe(this.element, {
			childList: true
		});
	}

	stopWatching() {
		return this.observer ? this.observer.disconnect() : void 0;
	}

	clean(value) {
		switch (this.characterType) {
			case ("digit"): {
				value = value.replace(this.numberFormat.radix, "<radix>");
				value = value.replace(/[.,]/g, "");
				value = value.replace("<radix>", ".");
				value = parseFloat(value, 10) || 0;
				return round(value, this.numberFormat.precision);
			}
		}
	} 
}*/