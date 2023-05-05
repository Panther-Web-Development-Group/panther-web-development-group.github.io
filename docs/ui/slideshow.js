class Slideshow {
	/**
	 * @typedef {Object} SlideshowOptions
	 * @property {HTMLElement} element The base element for the slideshow
	 * @property {boolean} loop Option to loop through the slideshow
	 * @property {number} startIndex The beginning index for the slideshow
	 */

	defaults = Object.freeze({
		autoSeek: false,
		animateSlides: false,
		loop: false,
		showDescription: true,
		seekDelay: 5000,
		seekDuration: 1000,
		startIndex: 0,
		controlType: "default",
		controlPosition: "inside",
		counterType: "interactive",
		navigationPosition: "inside",
		navigationType: "dots",
		slideshowType: "default"
	});

	propTypes = new Map([
		["animateSlides", val => val !== void 0 && val !== "false"],
		["autoSeek", val => val !== void 0 && val !== "false"],
		["loop", val => val !== void 0 && val !== "false"],
		["showCounter", val => val !== void 0 && val !== "false"],
		["showDescription", val => val !== void 0 && val !== "false"],
		["startIndex", val => parseInt(val)]
	]);

	controlPositions = new Map([
		[["inside", "outside"], () => {
			this.controls.classList.add(this.controlPosition);
			this.controls.dataset.position = this.controlPosition;
			this.slidesContainer.after(this.controls);
			return this.placeNavigation(this.navigation);
		}],
		["navigation", () => {
			if (this.navigationType === "side") {
				const def = this.controlPositions.get("default");
				return def();
			}

			this.controls.classList.add("has-navigation");
			this.controls.append(this.prevButton, this.navigation, this.nextButton);
			return this.placeNavigation(this.controls);
		}],
		["counter", () => {
			if (this.counterType === "progress") {
				const def = this.controlPositions.get("default");
				return def();
			} else this.counter.append(this.prevButton, this.count, this.nextButton);
			this.controls.classList.add(`controls-in-${this.controlPosition}`);
			return this.placeNavigation(this.navigation);
		}],
		["default", () => {
			this.controls.classList.add("inside");
			this.controls.append(this.prevButton, this.nextButton);
			this.slidesContainer.after(this.controls);
			return this.placeNavigation(this.navigation);
		}]
	]);

	navigationPositions = new Map([
		[["inside", "outside"], target => {
			this.navigation.classList.toggle(`navigation-${this.navigationPosition}`, this.controlPosition !== "navigation");
			this.slidesContainer.after(target);
		}],
		["side", target => {
			this.container.classList.add("w-side-nav");
			this.navigation.classList.add("navigation-side");
			this.slidesContainer.after(target);
		}],
		["default", target => {
			this.navigation.classList.add("navigation-outside");
			this.slidesContainer.after(target);
		}]
	]);

	navigationTypes = new Map([
		["dots", ({item, index}) => {
			item.classList.add("slide-dot");

			const button = item.appendChild(document.createElement("button"));
			button.classList.add("slide-dot-inner");
			button.addEventListener("click", e => {
				e.preventDefault();
				this.seek(index);
			});
			
			return item;
		}],
		["dots-count", ({item, index}) => {
			item.classList.add("slide-dot");
			
			const button = item.appendChild(document.createElement("button"));
			button.classList.add("slide-dot-inner");
			button.addEventListener("click", e => {
				e.preventDefault();
				this.seek(index);
			});
			button.textContent = index + 1;
			
			return item;
		}],
		["count", ({item, index}) => {
			item.classList.add("slide-number");

			const button = item.appendChild(document.createElement("button"));
			button.classList.add("slide-number-inner");
			button.addEventListener("click", e => {
				e.preventDefault();
				this.seek(index);
			});
			button.textContent = index + 1;
			
			return item;
		}],
		["image", ({item, slide, index}) => {
			item.classList.add("slide-nav-image");

			const button = item.appendChild(document.createElement("button"));
			button.classList.add("slide-nav-image-button");
			button.addEventListener("click", e => {
				e.preventDefault();
				this.seek(index);
			});

			const image = slide.querySelector(".slide-image");
			button.append(image.cloneNode(true));
			return item;
		}],
		["image-count", ({item, slide, index}) => {
			item.classList.add("slide-nav-image");

			const button = item.appendChild(document.createElement("button"));
			button.classList.add("slide-nav-image-button", "with-count");
			button.addEventListener("click", e => {
				e.preventDefault();
				this.seek(index);
			});

			const count = document.createElement("em");
			count.classList.add("slide-count");
			count.innerHTML = index + 1;

			const image = slide.querySelector(".slide-image");
			button.append(image.cloneNode(true), count);
			return item;
		}]
	]);

	counterTypes = new Map([
		["interactive", () => {
			const input = document.createElement("input");
			input.classList.add("slide-count-input");

			input.addEventListener("keypress", e => {
				if (e.key !== "Enter") return;
				const index = parseInt(e.target.value) - 1;
				this.seek(index);
			});

			return input;
		}],
		["progress", () => {
			const progress = document.createElement("div");
			progress.classList.add("progress-bar");

			const progressInner = document.createElement("div");
			progressInner.classList.add("progress-inner");

			progress.append(progressInner);
			return progress;
		}],
		["default", () => {
			const count = document.createElement("em");
			count.classList.add("slide-count");
			return count;
		}]
	])

	/**
	 * Creates the Slideshow class
	 * @param {SlideshowOptions} options 
	 */
	constructor({ element, ...options }) {
		this.element = element;
		this.setup(options);
		this.initialize();
	}

	get slides() { return this.slidesInner.childNodes }
	get lastIndex() { return this.slides.length - 1 }

	get currentSlide() { return this.slides[this.currentIndex] }

	setup(options) {
		this.element.childNodes.forEach(child => {
			if (child.nodeType !== Node.ELEMENT_NODE) return child.remove();
 			if (!child.classList.contains("slide")) return child.remove();
		});

		this.buildContainer();
		this.getOptions(options);
	}

	getOptions(options) {
		const dataset = this.getDataObject();
		this.options = extend({}, this.defaults, options, dataset);

		this.animateSlides = this.options.animateSlides;
		this.loop = this.options.loop;
		this.autoSeek = this.options.autoSeek;
		this.counterType = this.options.counterType;
		this.controlType = this.options.controlType;
		this.controlPosition = this.options.controlPosition;
		this.framesPerSecond = this.options.framesPerSecond;
		this.navigationType = this.options.navigationType;
		this.navigationPosition = this.options.navigationPosition;
		this.slideshowType = this.options.slideshowType;
		this.seekDelay = this.options.seekDelay;
		this.seekDuration = this.options.seekDuration;
		this.showCounter = this.options.showCounter;
		this.showDescription = this.options.showDescription;
		this.startIndex = this.getIndex(this.options.startIndex);

		this.currentIndex = this.startIndex;
		this.animating = false;
		this.framesPerSecond = 60;
		
		this.navigationPosition = this.controlPosition.toLowerCase() === "navigation" ?
			this.defaults.navigationPosition :
			this.navigationPosition;

		this.controlPosition = this.controlPosition.toLowerCase() === "navigation" ?
			this.controlPosition :
			this.defaults.controlPosition;

		this.showControls = this.controlType.toLowerCase() !== "none";
		this.showCounter = this.counterType.toLowerCase() !== "none";
		this.showNavigation = this.navigationType.toLowerCase() !== "none";
	}

	getDataObject() {
		return Array
			.from(this.propTypes.keys())
			.reduce((object, key) => {
				if (!object.hasOwnProperty(key)) return object;
				const parse = this.propTypes.get(key);
				object[key] = parse(object[key], key);
				return object;
			}, {...this.element.dataset});
	}

	initialize() {
		this.buildCounter();
		this.buildNavigation();
		this.buildControls();
		this.setActive();
	}

	buildContainer() {
		const fragment = document.createDocumentFragment();
		fragment.append(...this.element.childNodes);

		this.container = document.createElement("div");
		this.container.classList.add("slideshow-container");

		this.slidesContainer = document.createElement("nav");
		this.slidesContainer.classList.add("slides");

		this.slidesInner = document.createElement("div");
		this.slidesInner.classList.add("slides-inner");
		this.slidesInner.append(fragment);

		this.slidesContainer.append(this.slidesInner);
		this.container.append(this.slidesContainer);
		this.element.replaceChildren(this.container);
	}

	buildCounter() {
		if (!this.showCounter) return;
		this.counter = document.createElement("div");
		this.counter.classList.add("slide-counter");
		this.counterInner = this.counter.appendChild(document.createElement("div"));
		this.counterInner.classList.add("slide-counter-inner");
		this.count = this.getCounter();
		this.counterInner.append(this.count);
		this.counter.append(this.counterInner);
		this.slidesContainer.append(this.counter);
		this.setCounter();
	}

	getCounter() {
		if (!this.showCounter) return null;
		const counterType = this.counterTypes.has(this.counterType) ?
			this.counterType :
			"default";

		const generateCounter = this.counterTypes.get(counterType);
		return generateCounter();
	}

	buildControls() {
		if (!this.showControls || this.controlType === "none" || !this.controlType) return;
		this.controls = document.createElement("div");
		this.controls.classList.add("controls");
		this.buildButtons();
		this.placeControls();
	}

	buildButtons() {
		if (!this.showControls) return;
		this.prevButton = this.buildControl(e => {
			e.preventDefault();
			this.prev();
		});

		this.prevButton.classList.add("prev");
		this.prevButton.firstElementChild.innerHTML = '<i class="fa fa-chevron-left"></i>';

		this.nextButton = this.buildControl(e => {
			e.preventDefault();
			this.next();
		});

		this.nextButton.classList.add("next");
		this.nextButton.firstElementChild.innerHTML = '<i class="fa fa-chevron-right"></i>';

		this.controls.append(this.prevButton, this.nextButton);
		this.validateButtons();
	}

	buildControl(handler) {
		const wrapper = document.createElement("div");
		wrapper.classList.add("control-wrapper");
		wrapper.append(document.createElement("button"));
		wrapper.firstElementChild.classList.add("control-button");
		wrapper.firstElementChild.addEventListener("click", handler);
		return wrapper;
	}

	validateButtons() {
		if (this.loop) return;
		this.prevButton.firstElementChild.disabled = this.currentIndex === 0;
		this.nextButton.firstElementChild.disabled = this.currentIndex === this.lastIndex;
	}

	buildNavigation() {
		if (this.navigationType === "none" || !this.navigationType) return;
		this.navigation = document.createElement("nav");
		this.navigation.classList.add("slide-navigation");
		this.buildNavigationItems();
	}

	buildNavigationItems() {
		if (this.navigationType === "none" || !this.navigationType) return;
		const navigationInner = document.createElement("ul");
		const navigationType = this.navigationTypes.has(this.navigationType) ? 
			this.navigationType :
			"dots";

		const parse = this.navigationTypes.get(navigationType);

		navigationInner.classList.add("slide-nav");

		this.navigationInner = Array.from(this.slides).reduce((element, slide, index) => {
			const item = document.createElement("li");
			element.append(parse({item, slide, index}));
			return element;
		}, navigationInner);

		this.navigation.appendChild(this.navigationInner);
	}

	placeControls() {
		if (!this.showControls) return;
		const execDef = this.controlPositions.get("default");
		const clone = new Map(this.controlPositions.entries());
		clone.delete("default");

		for (const [keyOrKeys, exec] of clone.entries()) {
			const check = Array.isArray(keyOrKeys) && keyOrKeys.includes(this.controlPosition) ||
				this.controlPosition === keyOrKeys;

			if (!check) continue;
			return exec();
		}

		return execDef();
	}

	placeNavigation(target) {
		if (!this.showNavigation) return;
		const execDef = this.navigationPositions.get("default");
		const clone = new Map(this.navigationPositions.entries());
		clone.delete("default");

		for (const [keyOrKeys, exec] of clone.entries()) {
			const check = Array.isArray(keyOrKeys) && keyOrKeys.includes(this.navigationPosition) ||
				this.navigationPosition === keyOrKeys;

			if (!check) continue;
			return exec(target);
		}

		return execDef(target);
	}

	seek(index) {
		const finalIndex = this.getIndex(index);

		return this.animateSlides ?
			this.animateSeek(finalIndex) :
			this.initSeek(finalIndex);
	}

	getIndex(index) {
		if (index < 0) index = this.loop ? this.slides.length + index : 0;
		if (index >= this.slides.length) index = this.loop ? 0 : this.lastIndex;
		return index;
	}

	initSeek(index) {
		if (this.currentIndex === index) return false;
		this.currentSlide.classList.remove("show");
		this.currentIndex = index;
		this.setActive();
		this.validateButtons();
	}

	animateSeek(index) {
		this.currentIndex = index;
		this.validateButtons();
	}

	setActive() {
		this.setCounter();
		this.currentSlide.classList.add("show");
	}

	setCounter() {
		if (!this.showCounter) return;

		const isInteractive = this.count.nodeName.toLowerCase() == "input";
		const isProgress = this.count.classList.contains("slide-progress");

		if (isProgress) {
			const percent = Math.min(0, Math.max((this.currentIndex + 1) / this.slides.length, 100));
			const width = `${round(percent * 100, 2)}%`;

			const progress = this.count.querySelector(".progress-inner");
			progress.style.setProperty("width", width);
			return;
		}

		if (isInteractive) {
			this.count.value = this.currentIndex + 1;
			return;
		}

		this.count.innerText = this.currentIndex + 1;
	}

	prev() { return this.seek(this.currentIndex - 1) }
	next() { return this.seek(this.currentIndex + 1) }
}

// class Slideshow {
// 	static props = new Map([
// 		["number", val => Number(val)],
// 		["string", val => String(val)],
// 		["boolean", val => val !== void 0 && val !== "false"],
// 		["integer", val => parseInt(val)],
// 		["float", val => parseFloat(val)]
// 	]);

// 	static dataTypes = new Map([
// 		["autoSeek", "boolean"],
// 		["showCounter", "boolean"],
// 		["startIndex", "number"],
// 		["loop", "boolean"]
// 	]);

// 	constructor({ element, ...options }) {
// 		this.element = element;
// 		this.setup(options);
// 	}

// 	get slides() { return this.slidesElement.childNodes }
// 	get currentSlide() { return this.slides[this.currentIndex] }
// 	get lastIndex() { return this.slides.length - 1 }
// 	get msPerFrame() { return 1000 / this.framesPerSecond }

// 	get previousSlide() { 
// 		let prevIndex = this.currentIndex - 1;
// 		if (prevIndex < 0) prevIndex = this.loop ? this.slides.length + prevIndex : 0;
// 		return this.slides[prevIndex];
// 	}

// 	get nextSlide() { 
// 		let nextIndex = this.currentIndex + 1;
// 		if (nextIndex >= this.slides.length) nextIndex = this.loop ? 0 : this.lastIndex;
// 		return this.slides[nextIndex];
// 	}

// 	navigationTypes = new Map([
// 		["dots", {
// 			classNames: ["slide-dots"],
// 			parse: ({item, index}) => {
// 				item.classList.add("slide-dot");
// 				const button = document.createElement("button");
// 				button.classList.add("slide-dot-button");
// 				button.addEventListener("click", e => {
// 					e.preventDefault();
// 					this.seek(index);
// 				});
// 				item.appendChild(button);
// 				return item;
// 			}
// 		}],
// 		["dots-count", {
// 			classNames: ["slide-dots", "with-counter"],
// 			parse: ({item, index}) => {
// 				item.classList.add("slide-dot");
// 				const button = document.createElement("button");
// 				button.classList.add("slide-dot-button");
// 				button.addEventListener("click", e => {
// 					e.preventDefault();
// 					this.seek(index);
// 				});
// 				button.textContent = index + 1;
// 				item.appendChild(button);
// 				return item;
// 			}
// 		}],
// 		["count", {
// 			classNames: ["count-navigation"],
// 			parse: ({item, index}) => {
// 				item.classList.add("slide-number");
// 				const button = document.createElement("button");
// 				button.classList.add("slide-number-inner");
// 				button.addEventListener("click", e => {
// 					e.preventDefault();
// 					this.seek(index);
// 				});
// 				button.textContent = index + 1;
// 				item.appendChild(button);
// 				return item;
// 			}
// 		}],
// 		["image", {
// 			classNames: ["slide-nav-images"],
// 			parse: ({item, slide, index}) => {
// 				item.classList.add("slide-navigation");
// 				const button = document.createElement("button");
// 				button.classList.add("slide-image-button");
// 				button.addEventListener("click", e => {
// 					e.preventDefault();
// 					this.seek(index);
// 				});

// 				const slideImage = slide.querySelector(".slide-image");
// 				button.appendChild(slideImage.cloneNode(true));
// 				item.appendChild(button);
// 				return item;
// 			}
// 		}],
// 		["image-count", {
// 			classNames: ["slide-nav-images", "with-count"],
// 			parse: ({item, slide, index}) => {
// 				item.classList.add("slide-navigation");
// 				const button = document.createElement("button");
// 				button.classList.add("slide-image-button", "with-count");
// 				button.addEventListener("click", e => {
// 					e.preventDefault();
// 					this.seek(index);
// 				});

// 				const slideCount = document.createElement("span");
// 				slideCount.classList.add("slide-count");
// 				slideCount.innerHTML = index + 1;

// 				const slideImage = slide.querySelector(".slide-image");
// 				if (slideImage) button.appendChild(slideImage.cloneNode(true));
// 				button.appendChild(slideCount);
// 				item.appendChild(button);
// 				return item;
// 			}
// 		}],
// 		["image-title", {
// 			classNames: ["slide-nav-images", "with-title"],
// 			parse: ({item, slide, index}) => {
// 				item.classList.add("slide-navigation");
// 				const button = document.createElement("button");
// 				button.classList.add("slide-image-button", "with-count");
// 				button.addEventListener("click", e => {
// 					e.preventDefault();
// 					this.seek(index);
// 				});

// 				const title = slide.querySelector(".slide-title");
// 				const slideTitle = document.createElement("span");
// 				slideTitle.classList.add("slide-image-title");
// 				slideTitle.textContent = title.textContent;

// 				const slideImage = slide.querySelector(".slide-image");
// 				if (slideImage) button.appendChild(slideImage.cloneNode(true));
// 				button.appendChild(slideTitle);
// 				item.appendChild(button);
// 				return item;
// 			}
// 		}]
// 	]);

// 	setup(options) {
// 		this.element.childNodes.forEach(child => {
// 			if (child.nodeType !== Node.ELEMENT_NODE) return child.remove();
// 			if (!child.classList.contains("slide")) return child.remove();
// 		});

// 		const fragment = document.createDocumentFragment();
// 		fragment.append(...this.element.childNodes);

// 		this.slidesElement = document.createElement("nav");
// 		this.slidesElement.classList.add("slides");
// 		this.slidesElement.append(fragment);

// 		this.slideContainer = document.createElement("div");
// 		this.slideContainer.classList.add("slide-container");
// 		this.slideContainer.appendChild(this.slidesElement);

// 		this.element.replaceChildren(this.slideContainer);
// 		this.getOptionsFromElement(options);
// 		this.initialize();
// 	}

// 	getOptionsFromElement(options) {
// 		const dataset = {...this.element.dataset};

// 		for (const prop in dataset) {
// 			const propType = Slideshow.dataTypes.get(prop);
// 			if (!Slideshow.props.has(propType)) continue;
			
// 			const parser = Slideshow.props.get(propType);
// 			dataset[prop] = typeof parser === "function" ?
// 				parser(dataset[prop]) :
// 				parser;
// 		}

// 		this.options = extend({}, (this.defaults = Object.freeze({
// 			slideshowType: "default",
// 			controlPosition: "inside",
// 			navigationType: "dots",
// 			navigationPosition: "inside",
// 			counterType: "interactive",
// 			loop: false,
// 			autoSeek: false,
// 			showCounter: true,
// 			seekDelay: 1000,
// 			seekDuration: 1000,
// 			startIndex: 0,
// 			framesPerSecond: 60
// 		})), options, dataset);

// 		this.slideshowType = this.options.slideshowType;
// 		this.navigationPosition = this.options.navigationPosition;
// 		this.navigationType = this.options.navigationType;
// 		this.controlPosition = this.options.controlPosition;
// 		this.counterType = this.options.counterType;
// 		this.loop = this.options.loop;
// 		this.autoSeek = this.options.autoSeek;
// 		this.showCounter = this.options.showCounter;
// 		this.seekDelay = this.options.seekDelay;
// 		this.seekDuration = this.options.seekDuration;
// 		this.startIndex = this.options.startIndex;
// 		this.framesPerSecond = this.options.framesPerSecond;

// 		this.currentIndex = this.startIndex;
// 	}

// 	initialize() {
// 		this.controls = document.createElement("div");
// 		this.controls.classList.add("controls");

// 		this.prevButton = document.createElement("button");
// 		this.prevButton.classList.add("control-button", "prev");
// 		this.prevButton.addEventListener("click", e => {
// 			e.preventDefault();
// 			this.prev();
// 		});
// 		this.prevButton.innerHTML = '<i class="fa fa-chevron-left"></i>';

// 		this.nextButton = document.createElement("button");
// 		this.nextButton.classList.add("control-button", "next");
// 		this.nextButton.addEventListener("click", e => {
// 			e.preventDefault();
// 			this.next();
// 		});
// 		this.nextButton.innerHTML = '<i class="fa fa-chevron-right"></i>';

// 		this.buildNavigation();
// 	}

// 	buildNavigation() {
// 		if (this.navigationTypes.has(this.navigationType)) {
// 			this.navigation = document.createElement("nav");
// 			this.navigation.classList.add("slide-navigation");
// 			this.navigation.dataset.type = this.navigationType;

// 			const { parse, classNames } = this.navigationTypes.get(this.navigationType);

// 			const navigation = Array.from(this.slides).reduce((element, slide, index) => {
// 				const item = parse({item: document.createElement("li"), index, slide});
// 				element.appendChild(item);
// 				return element;
// 			}, document.createElement("ul"));

// 			navigation.classList.add("slide-navigation-inner", ...classNames);
			
// 			this.navigation.appendChild(navigation);
// 			this.placeControls();
// 			this.setActive();
// 		} else {
// 			this.navigation = null;
// 			this.placeControls();
// 		}
// 	}

// 	placeNavigation(target) {
// 		this.navigationPosition = this.controlPosition !== "navigation" ?
// 			this.navigationPosition :
// 			this.defaults.navigationPosition;

// 		switch (this.navigationPosition) {
// 			case "inside":
// 			case "outside": {
// 				this.navigation.classList.toggle(`navigation-${this.navigationPosition}`, this.controlPosition !== "navigation");
// 				this.slidesElement.after(target);
// 				break;
// 			}

// 			case "side": {
// 				this.slidesElement.classList.add("with-side-nav");
// 				this.navigation.classList.toggle("navigation-side");
// 				this.slidesElement.after(target);
// 				break;
// 			}

// 			default: {
// 				this.navigation.classList.add("navigation-outside");
// 				this.slidesElement.after(target);
// 				break;
// 			}
// 		}
// 	}

// 	placeControls() {
// 		this.controlPosition = this.navigation && this.controlPosition === "navigation" ? 
// 			this.controlPosition :
// 			this.defaults.controlPosition;

// 		switch (this.controlPosition) {
// 			case "inside":
// 			case "outside": {
// 				this.controls.classList.add(this.controlPosition);
// 				this.controls.append(this.prevButton, this.nextButton);
// 				this.slidesElement.after(this.controls);
// 				return this.placeNavigation(this.navigation);
// 			}
// 			case "navigation": {
// 				this.controls.classList.add("has-navigation");
// 				this.controls.append(this.prevButton, this.navigation, this.nextButton);
// 				return this.placeNavigation(this.controls);
// 			}

// 			default: {
// 				this.controls.classList.add("inside");
// 				this.controls.append(this.prevButton, this.nextButton);
// 				this.slidesElement.after(this.controls);
// 				return this.placeNavigation(this.navigation);
// 			}
// 		}
// 	}

// 	seek(index) {
// 		if (index < 0) index = this.loop ? this.slides.length + index : 0;
// 		if (index >= this.slides.length) index = this.loop ? 0 : this.slides.length - 1;
// 		return this.animateSeek(index);
// 	}

// 	animateSeek(index) {
// 		if (this.currentIndex === index) return false;
// 		const prevSlide = this.slides[this.currentIndex];
// 		prevSlide.classList.remove("show");
// 		this.currentIndex = index;
// 		this.setActive();
// 	}

// 	_animateSeek(index) {
// 		if (this.currentIndex === index) return false;
// 		let start = window.performance.now(), tick;
// 		let last = start, timeout = null;

// 		const msPerFrame = 1000 / this.framesPerSecond;
		
// 		const boundingBox = this.currentSlide.parentElement.getBoundingClientRect();
// 		const { width } = boundingBox;

// 		return (tick = () => {
// 			if ((window.performance.now() - start) > this.seekDuration) {
// 				clearTimeout(timeout);
// 				timeout = null;
// 				return;
// 			}

// 			let delta = window.performance.now() - last;

// 			if (delta > msPerFrame) {
// 				last = window.performance.now();
// 				let fraction = delta / this.seekDuration;
// 				let dist = '';
// 			}

// 			return (timeout = setTimeout(tick, msPerFrame));
// 		})();
// 	}

// 	prev() { return this.seek(this.currentIndex - 1); }
// 	next() { return this.seek(this.currentIndex + 1); }

// 	setActive() {

// 	}
// }
/*
class Slideshow {
	static defaults = Object.freeze({
		slideshowType: "default",
		controlPosition: "inside",
		navigationType: "dots",
		navigationPosition: "inside",
		counterType: "interactive",
		loop: false,
		autoSeek: false,
		showCounter: true,
		seekDelay: 1000,
		startIndex: 0,
		framesPerSecond: 60
	});

	static propTypes = new Map([
		["number", val => Number(val)],
		["string", val => String(val)],
		["boolean", val => val !== void 0 && val !== "false"],
		["integer", val => parseInt(val)],
		["float", val => parseFloat(val)],
	]);

	static dataTypes = new Map([
		["autoSeek", "boolean"],
		["showCounter", "boolean"],
		["startIndex", "number"],
		["loop", "boolean"]
	]);

	constructor({ element, ...options }) {
		this.element = element;
		this.setup(options);
		this.initialize();
	}

	get slides() { return this.slidesElement.childNodes }

	navigationTypes = new Map([
		["dots", {
			classNames: ["slide-dots"],
			parse: ({item, index}) => {
				item.classList.add("slide-dot");
				const button = document.createElement("button");
				button.classList.add("slide-dot-button");
				button.addEventListener("click", e => {
					e.preventDefault();
					this.seek(index);
				});
				item.appendChild(button);
				return item;
			}
		}],
		["dots-count", {
			classNames: ["slide-dots", "with-counter"],
			parse: ({item, index}) => {
				item.classList.add("slide-dot");
				const button = document.createElement("button");
				button.classList.add("slide-dot-button");
				button.addEventListener("click", e => {
					e.preventDefault();
					this.seek(index);
				});
				button.textContent = index + 1;
				item.appendChild(button);
				return item;
			}
		}],
		["count", {
			classNames: ["count-navigation"],
			parse: ({item, index}) => {
				item.classList.add("slide-number");
				const button = document.createElement("button");
				button.classList.add("slide-number-inner");
				button.addEventListener("click", e => {
					e.preventDefault();
					this.seek(index);
				});
				button.textContent = index + 1;
				item.appendChild(button);
				return item;
			}
		}],
		["image", {
			classNames: ["slide-nav-images"],
			parse: ({item, slide, index}) => {
				item.classList.add("slide-navigation");
				const button = document.createElement("button");
				button.classList.add("slide-image-button");
				button.addEventListener("click", e => {
					e.preventDefault();
					this.seek(index);
				});

				const slideImage = slide.querySelector(".slide-image");
				button.appendChild(slideImage.cloneNode(true));
				item.appendChild(button);
				return item;
			}
		}],
		["image-count", {
			classNames: ["slide-nav-images", "with-count"],
			parse: ({item, slide, index}) => {
				item.classList.add("slide-navigation");
				const button = document.createElement("button");
				button.classList.add("slide-image-button", "with-count");
				button.addEventListener("click", e => {
					e.preventDefault();
					this.seek(index);
				});

				const slideCount = document.createElement("span");
				slideCount.classList.add("slide-count");
				slideCount.innerHTML = index + 1;

				const slideImage = slide.querySelector(".slide-image");
				if (slideImage) button.appendChild(slideImage.cloneNode(true));
				button.appendChild(slideCount);
				item.appendChild(button);
				return item;
			}
		}],
		["image-title", {
			classNames: ["slide-nav-images", "with-title"],
			parse: ({item, slide, index}) => {
				item.classList.add("slide-navigation");
				const button = document.createElement("button");
				button.classList.add("slide-image-button", "with-count");
				button.addEventListener("click", e => {
					e.preventDefault();
					this.seek(index);
				});

				const title = slide.querySelector(".slide-title");
				const slideTitle = document.createElement("span");
				slideTitle.classList.add("slide-image-title");
				slideTitle.textContent = title.textContent;

				const slideImage = slide.querySelector(".slide-image");
				if (slideImage) button.appendChild(slideImage.cloneNode(true));
				button.appendChild(slideTitle);
				item.appendChild(button);
				return item;
			}
		}]
	]);

	setup(options) {
		this.element.childNodes.forEach(child => {
			if (child.nodeType !== Node.ELEMENT_NODE) return child.remove();
			if (!child.classList.contains("slide")) return child.remove();
		});

		const fragment = document.createDocumentFragment();
		fragment.append(...this.element.childNodes);

		this.slidesElement = document.createElement("nav");
		this.slidesElement.classList.add("slides");
		this.slidesElement.append(fragment);

		this.slideContainer = document.createElement("div");
		this.slideContainer.classList.add("slide-container");
		this.slideContainer.appendChild(this.slidesElement);

		this.element.replaceChildren(this.slideContainer);
		this.getOptionsFromElement(options);
	}

	getOptionsFromElement(options) {
		const dataset = {...this.element.dataset};

		for (const prop in dataset) {
			const propType = Slideshow.dataTypes.get(prop);
			if (!Slideshow.propTypes.has(propType)) continue;
			
			const parser = Slideshow.propTypes.get(propType);
			dataset[prop] = typeof parser === "function" ?
				parser(dataset[prop]) :
				parser;
		}

		this.options = extend({}, Slideshow.defaults, options, dataset);
		this.slideshowType = this.options.slideshowType;
		this.navigationPosition = this.options.navigationPosition;
		this.navigationType = this.options.navigationType;
		this.controlPosition = this.options.controlPosition;
		this.counterType = this.options.counterType;
		this.loop = this.options.loop;
		this.autoSeek = this.options.autoSeek;
		this.showCounter = this.options.showCounter;
		this.seekDelay = this.options.seekDelay;
		this.startIndex = this.options.startIndex;
		this.framesPerSecond = this.options.framesPerSecond;

		this.currentIndex = this.startIndex;
	}

	initialize() {
		this.controls = document.createElement("div");
		this.controls.classList.add("controls");

		this.prevButton = document.createElement("button");
		this.prevButton.classList.add("control-button", "prev");
		this.prevButton.addEventListener("click", e => {
			e.preventDefault();
			this.prev();
		});
		this.prevButton.innerHTML = '<i class="fa fa-chevron-left"></i>';

		this.nextButton = document.createElement("button");
		this.nextButton.classList.add("control-button", "next");
		this.nextButton.addEventListener("click", e => {
			e.preventDefault();
			this.next();
		});
		this.nextButton.innerHTML = '<i class="fa fa-chevron-right"></i>';

		this.buildNavigation();
	}

	buildNavigation() {
		if (!this.navigationTypes.has(this.navigationType)) {
			this.navigation = null;
			return this.placeControls();
		}

		this.navigation = document.createElement("nav");
		this.navigation.classList.add("slide-navigation-container");
		this.navigation.dataset.type = this.navigationType;

		const { parse, classNames } = this.navigationTypes.get(this.navigationType);
		const navigation = Array.from(this.slides).reduce((element, slide, index) => {
			const item = parse({item: document.createElement("li"), index, slide});
			element.appendChild(item);
			return element;
		}, document.createElement("ul"));
		navigation.classList.add("slide-navigation", ...classNames);
		
		this.navigation.appendChild(navigation);
		this.placeControls();
		this.setActive();
	}

	placeNavigation(target) {
		this.navigationPosition = this.controlPosition !== "navigation" ?
			this.navigationPosition :
			Slideshow.defaults.navigationPosition;

		switch (this.navigationPosition) {
			case "inside":
			case "outside": {
				this.navigation.classList.toggle(`navigation-${this.navigationPosition}`, this.controlPosition !== "navigation");
				this.slidesElement.after(target);
				break;
			}

			case "side": {
				this.slidesElement.classList.add("with-side-nav");
				this.navigation.classList.toggle("navigation-side");
				this.slidesElement.after(target);
				break;
			}

			default: {
				this.navigation.classList.add("navigation-outside");
				this.slidesElement.after(target);
				break;
			}
		}
	}

	placeControls() {
		this.controlPosition = this.navigation && this.controlPosition === "navigation" ? 
			this.controlPosition : 
			Slideshow.defaults.controlPosition;

		switch (this.controlPosition) {
			case "inside":
			case "outside": {
				this.controls.classList.add(this.controlPosition);
				this.controls.append(this.prevButton, this.nextButton);
				this.slidesElement.after(this.controls);
				return this.placeNavigation(this.navigation);
			}
			case "navigation": {
				this.controls.classList.add("has-navigation");
				this.controls.append(this.prevButton, this.navigation, this.nextButton);
				return this.placeNavigation(this.controls);
			}

			default: {
				this.controls.classList.add("inside");
				this.controls.append(this.prevButton, this.nextButton);
				this.slidesElement.after(this.controls);
				return this.placeNavigation(this.navigation);
			}
		}
	}

	seek(index) {
		let newIndex = index;
		if (newIndex < 0) newIndex = this.loop ? this.slides.length + newIndex : 0;
		if (newIndex >= this.slides.length) newIndex = this.loop ? 0 : this.slides.length - 1;
		console.log(newIndex)
		return this.animateSeekNew(newIndex);
	}

	animateSeek(newIndex) {
		if (this.currentIndex === newIndex) return false;
		const oldSlide = this.slides[this.currentIndex];
		oldSlide.classList.remove("show");
		this.currentIndex = newIndex;
		this.setActive();
	}

	animateSeekNew(newIndex) {
		let start = window.performance.now(), last = start, tick, timeout = null;
		const msPerFrame = 1000 / this.framesPerSecond;
		const boundingBox = this.slidesElement.getBoundingClientRect();
		console.log(boundingBox);
		return (tick = () => {
			
		})();
	}

	prev() { return this.seek(this.currentIndex - 1); }
	next() { return this.seek(this.currentIndex + 1); }

	setActive() {
		const currentSlide = this.slides[this.currentIndex];
		currentSlide.classList.add("active", "show");
	}
}

/*
class Slideshow {
	defaults = Object.freeze({
		showCounter: true,
		slideshowType: "default",
		navigationType: "dots",
		captionPosition: "inside",
		loop: false,
		autoSeek: false,
		seekDelay: 1000,
		startIndex: 0,
		framesPerSecond: 60
	});
	constructor({ element, ...options }) {
		this.element = element;
		
		Array.from(this.element.children).forEach(child => {
			if (child.nodeType !== Node.ELEMENT_NODE) child.remove();
			if (!child.classList.contains("slide")) child.remove();
		});

		const fragment = document.createDocumentFragment();
		fragment.append(...Array.from(this.element.children));

		this.slidesElement = document.createElement("div");
		this.slidesElement.classList.add("slides");
		this.slidesElement.appendChild(fragment);

		this.element.innerHTML = "";
		this.element.appendChild(this.slidesElement);

		this.getOptionsFromSlideshow(options);

		this.animationType = this.options.animationType;
		this.showCounter = this.options.showCounter;
		this.navigationType = this.options.navigationType;
		this.captionPosition = this.options.captionPosition;
		this.loop = this.options.loop;
		this.autoSeek = this.options.autoSeek;
		this.seekDelay = this.options.seekDelay;
		this.startIndex = this.options.startIndex;
		this.framesPerSecond = this.options.framesPerSecond;

		this.currentIndex = this.startIndex;

		this.initialize();
	}

	get slides() { return Array.from(this.slidesElement.children); }

	getOptionsFromSlideshow(options) {
		this.options = extend({}, options, this.defaults);
	}

	initialize() {

	}

	seek(index) {
		let newIndex = index;
		if (newIndex < 0) newIndex = this.loop ? this.slides.length + newIndex : 0;
		if (newIndex > this.slides.length) newIndex = this.loop ? 0 : this.slides.length - 1;
		return this.animateSeek(newIndex);
	}

	animateSeek(index) {
		const oldIndex = this.currentIndex;
		if (oldIndex === index) return false;

		const currentSlide = this.slides[oldIndex];
		const newSlide = this.slides[index];

		switch (this.animationType) {
			case ("fade"): {}

			case ("slide"): {
				const delta = newIndex - oldIndex;
				const delay = (this.seekDelay / delta) / 60;

				const boundedBox = this.slidesElement.getBoundingClientRect();
				
				let animation = setInterval(() => {
					currentSlide.animate()
				}, delay);
			}

			default: {
				currentSlide.classList.remove("active");
				newSlide.classList.add("active");
				this.currentIndex = index;
			}
		}
	}

	prev() { return this.seek(this.currentIndex - 1); }
	next() { return this.seek(this.currentIndex + 1); }
}*/