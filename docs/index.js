class PantherWeb {
	static BREAKPOINTS = Object.freeze({
		MOBILE: "(width < 540px)",
		TABLET: "(width >= 540px) and (width < 768px)",
		DESKTOP: "(width >= 768px) and (width < 1200px)",
		XL: "(width >= 1200px)"
	});

	static get isMobile() {
		return window.matchMedia(PantherWeb.BREAKPOINTS.MOBILE).matches;
	}

	static get isTablet() {
		return window.matchMedia(PantherWeb.BREAKPOINTS.TABLET).matches;
	}

	static get isDesktop() {
		return window.matchMedia(PantherWeb.BREAKPOINTS.DESKTOP).matches;
	}

	static createSlideshow() {
		this.slideshow = new HeroSlideshow({
			element: document.querySelector("#hero-slideshow")
		})
	}
}

PantherWeb.createSlideshow();

console.log(PantherWeb.slideshow);