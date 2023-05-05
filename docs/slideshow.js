class HeroSlideshow {
	constructor({ element, counterType = "default" }) {
		this.element = element;
		this.counterType = counterType;

		this.element.childNodes.forEach(child => {
			if (child.nodeType !== Node.ELEMENT_NODE) return child.remove();
 			if (!child.classList.contains("slide")) return child.remove();
		});

		this.buildContainer();

		this.autoSeek = this.element.dataset.autoSeek !== "false";
		this.loop = this.element.dataset.loop !== "false";
		this.seekInterval = 4000;
		this.currentIndex = 0;
		this.idle = true;

		this.setup();
	}

	get slides() { return this.inner.childNodes }
	get currentSlide() { return this.slides[this.currentIndex] }
	get lastIndex() { return this.slides.length - 1 }
	get prevSlide() { return this.slides[this.getIndex(this.currentIndex - 1)]}
	get currentSlide() { return this.slides[this.currentIndex]}
	get nextSlide() { return this.slides[this.getIndex(this.currentIndex + 1)]}
	
	setup() {
		this.setHeight();
		this.load();

		this.buildCounter();
		this.buildNavigation();
		this.setActive();
	}

	start() {
		this.initAutoSeek();
		this.addPointerEvents();
		this.addWheelEvent();
		this.inner.addEventListener("transitionend", () => {
			this.element.classList.add("loaded");
		}, {
			once: true
		});
	}

	load() {
		this.element.classList.add("ready");
		this.currentSlide.addEventListener("transitionend", () => this.start(), {
			once: true
		});
	}

	setHeight() {
		const maxHeight = calcMaxHeight(this.slides);
		this.inner.style.setProperty("height", `${maxHeight}px`);
	}

	initAutoSeek(initial = this.autoSeek) {
		const loop = () => this.next();
		initial && requestAnimationFrame(loop);
		this.autoSeekInterval = requestInterval(loop, this.seekInterval);
	}

	buildContainer() {
		const fragment = document.createDocumentFragment();
		fragment.append(...this.element.childNodes);

		this.container = document.createElement("div");
		this.container.classList.add("slideshow");

		this.wrapper = document.createElement("nav");
		this.wrapper.classList.add("slides");

		this.inner = document.createElement("div");
		this.inner.classList.add("slides-inner");
		this.inner.append(fragment);

		this.wrapper.append(this.inner);
		this.container.append(this.wrapper);
		this.element.replaceChildren(this.container);
	}

	buildCounter() {
		this.counter = document.createElement("div");
		this.counter.classList.add("slide-counter");

		this.counterInner = this.counter.appendChild(document.createElement("div"));
		this.counterInner.classList.add("slide-counter-inner");

		this.count = this.getCounter();
		this.counterInner.appendChild(this.count);

		this.counter.append(this.counterInner);
		this.wrapper.append(this.counter);
	}

	getCounter() {
		const counterTypes = new Map([
			["progress", () => {
				const progress = document.createElement("div");
				const progressInner = document.createElement("div");

				progress.append(progressInner);
				progressInner.classList.add("progress-inner");
				progress.classList.add("progress-bar");

				return progress;
			}],
			["default", () => {
				const count = document.createElement("div");
				const input = document.createElement("input");
				const indicator = document.createElement("span");

				count.append(input, indicator);
				input.classList.add("slide-count-input");

				input.addEventListener("keypress", e => {
					if (e.key !== "Enter") return;
					const index = parseInt(e.target.value) - 1;
					this.seek(index);
				});

				indicator.classList.add("slide-count-indicator");
				count.classList.add("slide-count");
				indicator.innerText = this.slides.length;

				return count;
			}]
		]);

		if (counterTypes.has(this.counterType)) return counterTypes.get(this.counterType)();
		return counterTypes.get("default")();
	}

	buildNavigation() {
		this.controls = document.createElement("div");
		this.controls.classList.add("controls");
		this.prevButton = this.buildButton(button => {
			button.classList.add("prev");
			
			button.addEventListener("click", e => {
				e.preventDefault();
				this.prev();
			});

			button.innerHTML = "<i class='fa fa-chevron-left'></i>";

			return button;
		}, document.createElement("div"));

		this.prevButton.classList.add("button-container");

		this.navigation = document.createElement("div");
		this.navigation.classList.add("slide-navigation");

		this.nextButton = this.buildButton(button => {
			button.classList.add("next");
			
			button.addEventListener("click", e => {
				e.preventDefault();
				this.next();
			});

			button.innerHTML = "<i class='fa fa-chevron-right'></i>";

			return button;
		}, document.createElement("div"));

		this.nextButton.classList.add("button-container");

		this.controls.append(this.prevButton, this.navigation, this.nextButton);
		this.container.append(this.controls);
		this.buildNavigationItems();
	}

	buildButton(handler = button => button, wrapper = null) {
		const button = handler(document.createElement("button"));
		if (!button) return null;
		button.classList.add("control-button");
		
		if (!wrapper) return button;
		wrapper.append(button);
		return wrapper;
	}
	
	buildNavigationItems() {
		this.navigationInner = document.createElement("ul");
		this.navigationInner.classList.add("slide-nav");

		const items = this.buildItemsFromSlides();
		this.navigationInner.append(...items);
		this.navigation.appendChild(this.navigationInner);
	}

	buildItemsFromSlides() {
		return Array.from(this.slides).map((slide, index) => {
			const item = document.createElement("li");
			item.classList.add("slide-nav-item");

			const button = item.appendChild(document.createElement("button"));
			button.classList.add("slide-nav-button");
			button.addEventListener("click", e => {
				e.preventDefault();
				this.seek(index);
			});

			const image = slide.querySelector(".slide-image").cloneNode(true);
			image.classList.add("slide-nav-image");
			const title = slide.querySelector(".slide-title").cloneNode(true);

			const finalTitle = document.createElement("em");
			finalTitle.classList.add("slide-nav-title");
			finalTitle.innerHTML = title.innerHTML;

			button.append(image, finalTitle);
			item.append(button);

			return item;
		});
	}

	seek(index) {
		this.idle = false;
		const finalIndex = this.getIndex(index);
		if (this.currentIndex === finalIndex) return false;
		this.prevSlide.classList.remove("prev-slide");
		this.currentSlide.classList.remove("active");
		this.nextSlide.classList.remove("next-slide");

		this.inner.classList.remove("prev", "next");
		this.currentIndex = index;
		
		this.inner.classList.toggle("prev", this.currentIndex < index);
		this.inner.classList.toggle("next", this.currentIndex > index);

		this.slides.forEach(slide => slide.classList.remove("prev", "next"));
		this.setActive();
	}

	addPointerEvents() {
		const touch = {};

		this.inner.addEventListener("pointerdown", e => {
			touch.start = parseInt(e.clientX);
		});

		this.inner.addEventListener("pointermove", e => {
			touch.move = parseInt(e.clientX);

			const delta = touch.move - touch.start;
			return this.initAutoSeek(delta);
		});
	}

	addWheelEvent() {
		this.inner.addEventListener("wheel", e => {
			return this.initAutoSeek(e.deltaY);
		});
	}

	initAutoSeek(delta) {
		if (!this.idle) return;
		this.stopAutoSeek();
		if (delta < 0) return this.next();
		return this.prev();
	}

	stopAutoSeek() {
		this.autoSeek = false;
		clearRequestInterval(this.handler);
	}

	setActive() {
		this.setCounter();
		this.prevSlide.classList.add("prev-slide");
		this.currentSlide.classList.add("active");
		this.nextSlide.classList.add("next-slide");
	}

	setCounter() {
		const counterTypes = new Map([
			["progress", () => {
				const percent = Math.min(0, Math.max((this.currentIndex + 1) / this.slides.length, 100));
				const width = `${round(percent * 100, 2)}%`;
				this.count.firstElementChild.style.setProperty('width', width);
				return;
			}],
			["default", () => {
				this.count.firstElementChild.value = this.currentIndex + 1;
				return;
			}]
		]);

		if (counterTypes.has(this.counterType)) return counterTypes.get(this.counterType)();
		return counterTypes.get("default")();
	}

	getIndex(index) {
		index = index % this.slides.length;
		if (index < 0) index = this.loop ? this.slides.length + index : 0;
		if (index >= this.slides.length) index = this.loop ? 0 : this.lastIndex;
		return index % this.slides.length;
	}

	prev() { return this.seek(this.currentIndex - 1) }
	next() { return this.seek(this.currentIndex + 1) }

	getSlideAtIndex(index) { return this.slides[this.getIndex(index)] }
}

/* class HeroSlideshow {
	/**
	 * @typedef {Object} SlideshowOptions
	 * @property {HTMLElement} element
	 * @property {string} counterType
	 */

	/** @param {SlideshowOptions} options
	constructor({ element, counterType = "default" }) {
		this.element = element;
		this.counterType = counterType;
		this.element.childNodes.forEach(child => {
			if (child.nodeType !== Node.ELEMENT_NODE) return child.remove();
 			if (!child.classList.contains("slide")) return child.remove();
		});

		this.buildContainer();

		this.loop = this.element.dataset.loop !== "false";
		this.autoSeek = this.element.dataset.autoSeek !== "false";
		this.animateSlides = this.element.dataset.animateSlides !== "false";

		this.startIndex = 0;
		this.currentIndex = this.startIndex;
		this.setup();
	}

	setup() {
		this.buildCounter();
		this.buildNavigation();
		this.setActive();
	}

	seek(index) {
		const finalIndex = this.getIndex(index);

		return this.animateSlides ?
			this.animateSeek(finalIndex) :
			this.initSeek(finalIndex);
	}

	initSeek(index) {
		if (this.currentIndex === index) return false;
		this.currentSlide.classList.remove("show");
		this.currentIndex = index;
		this.setActive();
		return true;
	}

	animateSeek(index) {
		if (this.currentIndex === index) return false;
		this.setActive();
		return true;
	}

	setActive() {
		this.setCounter();
		this.currentSlide.classList.add("show");
	}

} */