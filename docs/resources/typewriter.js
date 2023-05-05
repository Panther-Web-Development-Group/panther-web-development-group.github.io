class Typewriter {
	defaults = Object.freeze({
		strings: [],
		typeSpeed: 0,
		startDelay: 0,
		backSpeed: 0,
		shuffle: !0,
		backDelay: 500,
		loop: !1,
		loopCount: !1,
		showCursor: !0,
		attr: null,
		contentType: "html",
		cursorChar: "|",
		reset(){},
		callback(){},
		preStringTyped(){},
		onStringTyped(){}
	});

	constructor(element, options) {
		this.element = element;
		this.options = this.extend({}, this.defaults, options);
		this.isInput = this.element.matches("input");
		this.sequence = [];
		this.setOptions();
		this.build()
	}

	setOptions() {
		this.attr = this.options.attr;
		this.showCursor = this.isInput ? !1 : this.options.showCursor;
		this.elementContent = this.attr ? this.element.getAttribute(this.attr) : this.element.textContent;
		this.contentType = this.options.contentType;
		this.typeSpeed = this.options.typeSpeed;
		this.backSpeed = this.options.backSpeed;
		this.startDelay = this.options.startDelay;
		this.backDelay = this.options.backDelay;
		this.cursorChar = this.options.cursorChar;
		this.strings = this.options.strings;
		this.startPos = 0;
		this.arrayPos = 0;
		this.stopNum = 0;
		this.loop = this.options.loop;
		this.loopCount = this.options.loopCount;
		this.currentLoop = 0;
		this.stop = !1;
		this.shuffle = this.options.shuffle;
	}
}