class HeroSlideshow {
	constructor({ element }) {
		this.element = element;

		this.element.childNodes.forEach(child => {
			if (child.nodeType !== Node.ELEMENT_NODE) return child.remove();
 			if (!child.classList.contains("slide")) return child.remove();
		});

		this.buildContainer();

		/* this.autoSeek = this.element.dataset.autoSeek !== "false"; */
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
		this.buildNavigation();
		this.load();
		this.setHeight();
		this.setActive();
		window.addEventListener("resize", () => this.setHeight());
	}

	start() {
		/* this.addPointerEvents();
		this.addWheelEvent(); */
		this.inner.addEventListener("transitionend", () => {
			this.element.classList.add("loaded");
		}, { once: true });
	}

	load() {
		this.element.classList.add("ready");
		this.currentSlide.addEventListener("transitionend", () => this.start(), {
			once: true
		});
	}

	setHeight() {
		const slideImage = this.element.querySelector(".slide-image");
		const slideImageHeight = slideImage.getBoundingClientRect().height;
		this.inner.style.setProperty("height", `${slideImageHeight - 4}px`);
	}

	/* initAutoSeek(initial = this.autoSeek) {
		const loop = () => this.next();
		initial && requestAnimationFrame(loop);
		this.autoSeekInterval = requestInterval(loop, this.seekInterval);
		console.log(this.autoSeekInterval);
	}

	resetAutoSeek(delta) {
		if (!this.idle) return;
		this.stopAutoSeek();
		if (delta < 0) return this.next();
		return this.prev();
	} */

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

	buildNavigation() {
		this.controls = document.createElement("div");
		this.controls.classList.add("controls");
		this.prevButton = this.buildButton(button => {
			button.classList.add("prev-button");
			
			button.addEventListener("click", e => {
				e.preventDefault();
				console.log("prev");
				this.prev();
			});

			button.innerHTML = "<i class='fa fa-chevron-left'></i>";

			return button;
		}, document.createElement("div"));

		this.prevButton.classList.add("button-container");

		this.navigation = document.createElement("div");
		this.navigation.classList.add("slide-navigation");

		this.nextButton = this.buildButton(button => {
			button.classList.add("next-button");
			
			button.addEventListener("click", e => {
				e.preventDefault();
				console.log("next");
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

	seek(index, direction = null) {
		this.idle = false;
		const finalIndex = this.getIndex(index);
		if (this.currentIndex === finalIndex) return false;
		const navItems = this.navigation.querySelectorAll(".slide-nav-item");
		const currentNavItem = navItems[this.currentIndex];

		this.prevSlide.classList.remove("prev-slide");
		this.currentSlide.classList.remove("active");
		this.nextSlide.classList.remove("next-slide");
		currentNavItem.classList.remove("active");

		this.element.classList.remove("prev", "next");
		this.currentIndex = finalIndex;
		
		this.element.classList.toggle("prev", direction === "prev");
		this.element.classList.toggle("next", direction === "next");

		this.slides.forEach(slide => slide.classList.remove("prev", "next"));
		this.setActive(direction);

		this.currentSlide.addEventListener("transitionend", () => {
			const lastSlide = this.inner.querySelectorAll(".last-slide");
			lastSlide.forEach(slide => slide.classList.remove("last-slide"));
			this.idle = true;
		}, { once: true });
	}

	/* addPointerEvents() {
		const touch = {};

		this.inner.addEventListener("pointerdown", e => {
			touch.start = parseInt(e.clientX);
		});

		this.inner.addEventListener("pointermove", e => {
			touch.move = parseInt(e.clientX);

			const delta = touch.move - touch.start;
			return this.resetAutoSeek(delta);
		});
	}

	addWheelEvent() {
		this.inner.addEventListener("wheel", e => {
			return this.resetAutoSeek(e.deltaY);
		});
	}

	stopAutoSeek() {
		if (!this.autoSeekInterval) return;
		this.autoSeek = false;
		clearRequestInterval(this.autoSeekInterval);
	} */

	setActive(direction) {
		this.prevSlide.classList.add("prev-slide");
		this.prevSlide.classList.toggle("last-slide", direction !== "prev");
		this.currentSlide.classList.add("active");
		this.nextSlide.classList.add("next-slide");
		this.nextSlide.classList.toggle("last-slide", direction === "prev");

		const navItems = this.navigation.querySelectorAll(".slide-nav-item");
		const currentNavItem = navItems[this.currentIndex];

		if (!currentNavItem) return;
		currentNavItem.classList.add("active");
	}

	getIndex(index) {
		index = index % this.slides.length;
		if (index < 0) index = this.loop ? this.slides.length + index : 0;
		if (index >= this.slides.length) index = this.loop ? 0 : this.lastIndex;
		return index % this.slides.length;
	}

	prev() { return this.seek(this.currentIndex - 1, "prev") }
	next() { return this.seek(this.currentIndex + 1, "next") }

	getSlideAtIndex(index) { return this.slides[this.getIndex(index)] }
}