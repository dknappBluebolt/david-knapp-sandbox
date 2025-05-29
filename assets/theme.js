function tcgDebounce(func, wait) {
	let timeout;
	return function (...args) {
		const context = this;
		clearTimeout(timeout);
		timeout = setTimeout(() => {
			func.apply(context, args);
		}, wait);
	};
}

function tcgInitValueClass(val, el) {
	tcgToggleValueClass(val, el);
	el.addEventListener("change", function (e) {
		tcgToggleValueClass(e.target.value, e.target);
	});
}

function tcgToggleValueClass(val, el) {
	if (val != "") {
		el.classList.add("has-value");
		el.parentElement.classList.add("has-value");
	} else {
		el.classList.remove("has-value");
		el.parentElement.classList.remove("has-value");
	}
}

(function () {
	// Manage footer details open/closed state
	const footerNavs = document.querySelectorAll(".footer-nav");
	const footerNavState = tcgDebounce(() => {
		if (window.matchMedia("(max-width: 767px)").matches) {
			footerNavs.forEach((el) => {
				el.removeAttribute("open");
			});
		} else {
			footerNavs.forEach((el) => {
				el.setAttribute("open", true);
			});
		}
	}, 300);

	footerNavState();
	window.addEventListener("resize", footerNavState);

	// Klaviyo
	var footerKlaviyo = document.querySelector(
		'.footer-main [class*="klaviyo-form"]'
	);
	if (footerKlaviyo) {
		var footerKlaviyoHandler = function (entries, observer) {
			if (footerKlaviyo.querySelector("input")) {
				var el = footerKlaviyo.querySelector("input");
				tcgInitValueClass(el.value, el);
				footerKlaviyoObserver.disconnect();
			}
		};
		var footerKlaviyoObserver = new MutationObserver(footerKlaviyoHandler);
		footerKlaviyoObserver.observe(footerKlaviyo, {
			attributes: true,
			childList: true,
			subtree: true,
		});
	}

	// Lazy load swiper
	var swipers = document.querySelectorAll("[data-swiper-init]");

	function addSwiper(el) {
		if (document.getElementById("swiper-js") == null) {
			var script = document.createElement("script");
			script.setAttribute("src", window.theme.assets.swiperJS);
			script.id = "swiper-js";
			document.head.appendChild(script);
			var styles = document.createElement("link");
			styles.setAttribute("href", window.theme.assets.swiperCSS);
			styles.setAttribute("rel", "stylesheet");
			document.head.appendChild(styles);
		}
		var timeout = setInterval(function () {
			if (typeof Swiper != "undefined") {
				clearInterval(timeout);
				initSwiper(el);
			}
		}, 100);
	}

	function initSwiper(el) {
		var optionsKey = el.dataset.swiperInit;
		if (!optionsKey) {
			return;
		}
		var options = window.swiperOptions[optionsKey];
		if (!options) {
			return;
		}
		var swiper = new Swiper(el, options);
		return swiper;
	}

	var swiperHandler = function (entries, observer) {
		entries.forEach(function (entry) {
			if (!entry.isIntersecting) return;
			var el = entry.target;
			swiperObserver.unobserve(el);
			addSwiper(el);
		});
	};
	var swiperObserver = new IntersectionObserver(swiperHandler, {
		rootMargin: "400px 0px 400px 0px",
	});
	swipers.forEach(function (el) {
		swiperObserver.observe(el);
	});

	// Lazy load background images
	var bgHandler = function (entries, observer) {
		entries.forEach(function (entry) {
			if (!entry.isIntersecting) return;
			var el = entry.target;
			bgObserver.unobserve(el);
			el.classList.remove("lazy-bg");
		});
	};
	var bgObserver = new IntersectionObserver(bgHandler, {
		rootMargin: "400px 0px 400px 0px",
	});
	var lazyBGs = document.querySelectorAll(".lazy-bg");
	lazyBGs.forEach(function (el) {
		bgObserver.observe(el);
	});

	if (Shopify.designMode) {
		window.addEventListener("shopify:section:load", function (e) {
			var editorLazyBGs = document.querySelectorAll(".lazy-bg");
			editorLazyBGs.forEach(function (el) {
				el.classList.remove("lazy-bg");
			});
		});
	}

	// Lazy load iframes
	var iframeHandler = function (entries, observer) {
		entries.forEach(function (entry) {
			if (!entry.isIntersecting) return;
			var el = entry.target;
			iframeObserver.unobserve(el);
			el.setAttribute("src", el.dataset.src);
		});
	};
	var iframeObserver = new IntersectionObserver(iframeHandler, {
		rootMargin: "400px 0px 400px 0px",
	});
	var lazyIframes = document.querySelectorAll(".lazy-iframe");
	lazyIframes.forEach(function (el) {
		iframeObserver.observe(el);
	});

	if (Shopify.designMode) {
		window.addEventListener("shopify:section:load", function (e) {
			var editorLazyIframes = document.querySelectorAll(".lazy-iframe");
			editorLazyIframes.forEach(function (el) {
				el.setAttribute("src", el.dataset.src);
			});
		});
	}

	//Lazy load videos
	var videos = document.querySelectorAll(".html-video");

	var videoAddHandler = function (entries, observer) {
		entries.forEach((entry) => {
			if (!entry.isIntersecting) return;
			var el = entry.target;
			addVideo(el);
			videoAddObserver.unobserve(el);
		});
	};
	var videoAddObserver = new IntersectionObserver(videoAddHandler, {
		rootMargin: "400px 0px 400px 0px",
	});
	videos.forEach((el) => {
		videoAddObserver.observe(el);
	});
	function addVideo(el,play) {
		var sources = el.querySelectorAll("source");
		sources.forEach((source) => {
			source.src = source.dataset.src;
		});
		el.load();
		if (el.autoplay || play) {
			el.play();
		}
  }

  var playButtons = document.querySelectorAll('.play-video');
  playButtons.forEach(function(playButton) {
    playButton.addEventListener('click', function() {
      var video = this.parentElement.querySelector('video');
      var videoImg = this.parentElement.querySelector('img');
      if (video) {
        addVideo(video,true);
        this.classList.add('hide');
        if (videoImg) {
          videoImg.classList.add('hide');
        }
      }
    });
  });
})();

function tcgScrollToElement(n, o) {
	var i,
		e = window.pageYOffset,
		t = n - e;
	window.requestAnimationFrame(function n(a) {
		i || (i = a);
		var r = a - i,
			w = Math.min(r / o, 1);
		window.scrollTo(0, e + t * w), r < o && window.requestAnimationFrame(n);
	});
}

function tcgAnimateAnchor(target) {
	if (target == "#") {
		var targetEl = document.body;
	} else {
		var targetEl = document.getElementById(target.replace("#", ""));
	}
	if (targetEl && targetEl.style.display != "none") {
		var animateTo = window.pageYOffset + targetEl.getBoundingClientRect().top;
		tcgScrollToElement(animateTo, 500);
	}
}

window.addEventListener("DOMContentLoaded", () => {
	document.querySelectorAll(".animate-anchor").forEach((anchor) => {
		anchor.addEventListener("click", (e) => {
			e.preventDefault();
			tcgAnimateAnchor(anchor.getAttribute("href"));
		});
	});

	const fieldSelects = document.querySelectorAll("select.field__input");
	fieldSelects.forEach(function (el) {
		tcgInitValueClass(el.value, el);
	});

	class TCGDynamicSelect extends HTMLElement {
		constructor(){
			super();
		}

		connectedCallback() {
			this.select = this.querySelector('select.field__input');
			this.select.addEventListener('change', this.onChange.bind(this));
		}

		onChange(event){
			const el = event.target;
			tcgToggleValueClass(el.value, el);
		}
	}

	customElements.define('dynamic-select', TCGDynamicSelect);
});

// Toggle Hamburger menu
const hamburgerButton = document.querySelector("button");
hamburgerButton.addEventListener("click", () => {
	const nav = document.getElementById("sidebar-menu");
	const isHidden = nav.getAttribute("aria-hidden") === "true";
	nav.setAttribute("aria-hidden", isHidden ? "false" : "true");
	hamburgerButton.setAttribute("aria-expanded", isHidden ? "true" : "false");
});

// Close Menu Mobile
const closeSidebarButton = document.getElementById("close-sidebar-button");
const sidebarMenu = document.getElementById("sidebar-menu");
closeSidebarButton.addEventListener("click", () => {
	sidebarMenu.setAttribute("aria-hidden", "true");
});

const openSubLinksButtons = document.querySelectorAll("button.open-sub-links");
openSubLinksButtons.forEach((button) => {
	button.addEventListener("click", () => {
		const menuID = button.getAttribute("aria-controls");
		const closestMenu = document.getElementById(menuID);
		if (closestMenu) {
			closestMenu.classList.add("megamenu--active");
		}
	});
});

const closeSubLinksButtons = document.querySelectorAll(
	"button.close-sub-links"
);

closeSubLinksButtons.forEach((button) => {
	button.addEventListener("click", () => {
		const closestMenu = button.closest(".mega-menu");
		if (closestMenu) {
			closestMenu.classList.remove("megamenu--active");
		}
	});
});

const tcgHeaderDetails = document.querySelectorAll(".theme-header details");
document.addEventListener("click", (event) => {
	tcgHeaderDetails.forEach((detailsElement) => {
		if (
			detailsElement.hasAttribute("open") &&
			!detailsElement.contains(event.target)
		) {
			detailsElement.removeAttribute("open");
		}
	});
});

const tcgSearchIcon = document.querySelector('.theme-header [data-search-toggle]');
const tcgSearchDetails = document.querySelector('.theme-header .search-details');
const tcgSearchInput = document.getElementById('Search');
if(tcgSearchDetails && tcgSearchIcon && tcgSearchInput){
	tcgSearchIcon.addEventListener('click',(e) => {
		setTimeout(function(){
			if(tcgSearchDetails.hasAttribute("open")){
				tcgSearchInput.focus();
			}
		},100);
	});
}

function tcgCloseSearch(el) {
	const detailsElement = el.closest("details");
	if (detailsElement.hasAttribute("open")) {
		detailsElement.removeAttribute("open");
	}
}

const tcgCloseSearchButton = document.querySelector(".close-search-mobile");
tcgCloseSearchButton.addEventListener("click", (e) => {
	tcgCloseSearch(e.target);
});


// Click to reveal text
class TCGClickToReveal extends HTMLElement {
	constructor(){
		super();
	}

	connectedCallback() {
		this.trigger = this.querySelector('.js-click-to-reveal-trigger');
		this.text = this.querySelector('.js-click-to-reveal-text');
		this.svg = this.querySelector('svg');
		this.trigger.addEventListener('click', (event) => {this.toggleTextArea()});
	}

	toggleTextArea() {
		var toggle_state = this.text.classList.toggle('is-active');
		if (this.svg) {
			this.svg.classList.toggle('is-active');
		}
		this.trigger.innerHTML = toggle_state ? this.trigger.dataset.less : this.trigger.dataset.more;
	}
}

customElements.define('tcg-click-to-reveal', TCGClickToReveal);
 
function fetchConfig(type = "json") {
	return {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Accept: `application/${type}`,
		},
	};
}

class VideoWithPoster extends HTMLElement {
	constructor() {
		super();
	}

	connectedCallback() {
	this.poster = this.querySelector('.js-video-poster');
	this.video = this.querySelector('.html-video');
	this.poster.addEventListener('click', this.swapPosterForVideo.bind(this));
	}

	swapPosterForVideo() {
	this.poster.classList.add('hide');
	this.video.classList.remove('hide');
	this.video.play();
	}
}

customElements.define('video-with-poster', VideoWithPoster);

class TCGModalButton extends HTMLElement {
	constructor() {
		super();
	}

	connectedCallback() {
		this._modal = document.querySelector(`#${this.dataset.modalId}`);
		this.addEventListener('click', this.toggleModal.bind(this));
	}

	toggleModal() {
		let is_hidden = this._modal.classList.contains('modal__toggle-close');
		if(is_hidden) {
			this._modal.classList.remove('modal__toggle-close');
			return;
		}
		this._modal.classList.add('modal__toggle-close');
	}
}

customElements.define('tcg-modal-button', TCGModalButton);

class TCGModal extends HTMLElement {
	constructor() {
		super();
	}

	connectedCallback() {
		this._close_buttons = this.querySelectorAll(".js-close");
		this._videos = this.querySelectorAll('video');
		if(this._close_buttons) {
			var self = this;
			this._close_buttons.forEach(function(btn) {
				btn.addEventListener('click', self.closeModal.bind(self));
			});
		}
		this.addEventListener('click', (event) => { this.clickOutside(event) });
	}

	clickOutside(event) {
		if(event.target == this) {
			this.closeModal();
		}
	}

	closeModal() {
		this._videos.forEach((video) => {
			video.pause();
			video.currentTime = 0;
		})
		this.classList.add('modal__toggle-close');
	}
}

customElements.define('tcg-modal', TCGModal);

class QuickAddToCart extends HTMLElement {
	constructor() {
		super();
		this.add_to_cart_button = this.querySelector('.js-quick-add-to-cart');
	  }

	  connectedCallback() {
		this.add_to_cart_button.addEventListener('click', this.addToCart.bind(this));
		this.start_text = this.querySelector('.js-start-text');
		this.loader = this.querySelector('.loader');
		this.finished_text = this.querySelector('.js-finished-text');
	  }

	  addToCart() {
		var addObj = {
			items: this.generateLineItems(),
			sections: this.getSectionsToRender().map((section) => section.section),
			attributes: { createdInStorefront: 'true' }
		};
		this.start_text.classList.add('hidden');
		this.finished_text.classList.add('hidden');
		this.loader.classList.remove('hidden');
		fetch(`${window.routes.cart_add_url}.js`, {
			body: JSON.stringify(addObj),
			credentials: "same-origin",
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				"X-Requested-With": "XMLHttpRequest",
			},
		})
			.then((response) => response.text())
			.then((responseText) => {
				var parsedState = JSON.parse(responseText);
				this.getSectionsToRender().forEach((section) => {
					const sectionElement = section.selector
						? document.querySelector(section.selector)
						: document.getElementById(section.id);
					sectionElement.innerHTML = this.getSectionInnerHTML(
						parsedState.sections[section.id],
						section.selector
					);
				});
				this.add_to_cart_button.classList.add('added');
				this.loader.classList.add('hidden');
				this.finished_text.classList.remove('hidden');
				this.add_to_cart_button.setAttribute('disabled', true);
			});
	  }

	  getSectionsToRender() {
		return [
			{
				id: "cart-icon-bubble",
				section: "cart-icon-bubble",
			},
		];
	}

	getSectionInnerHTML(html, selector = ".shopify-section") {
		return new DOMParser()
			.parseFromString(html, "text/html")
			.querySelector(selector).innerHTML;
	}

	generateLineItems() {
		if(!this.add_to_cart_button.dataset.variantIds) {
			console.error("QuickAddToCart->generateLineItems: data-variant-ids not set");
			return;
		}
		if(!this.add_to_cart_button.dataset.quantities) {
			console.error("QuickAddToCart->generateLineItems: data-quantities not set");
			return;
		}
		var variant_ids = this.add_to_cart_button.dataset.variantIds.split('|');
		var quantities = this.add_to_cart_button.dataset.quantities.split('|');
		var properties = [];
		if(this.add_to_cart_button.dataset.properties) {
			this.add_to_cart_button.dataset.properties.split('|').forEach((propertiesString) => {
				var line_item_properties = {};
				propertiesString.split(';').forEach((propertyString) => {
					var property_split = propertyString.split(':');
					line_item_properties[property_split[0]] = property_split[1];
				});
				properties.push(line_item_properties);
			});
		}

		var line_items = [];

		for(var i = 0; i < variant_ids.length; i++) {
			line_items.push({
				id: variant_ids[i],
				quantity: quantities[i] ?? 1,
				properties: properties[i]
			});
		}
		
		return line_items;
	}
}

customElements.define('quick-add-to-cart', QuickAddToCart);

class tcgTooltipToggle extends HTMLElement {
	constructor() {
		super();
	}

	connectedCallback() {
		this.tooltip_text = this.querySelector('.tooltip-text');
		this.addEventListener('click', this.toggleTooltip.bind(this));
	}

	toggleTooltip() {
		if(this.tooltip_text.classList.contains('visibility-hidden')) {
			this.tooltip_text.classList.remove('visibility-hidden');
			return;
		}

		this.tooltip_text.classList.add('visibility-hidden');
	}
}

customElements.define('tcg-tooltip-toggle', tcgTooltipToggle);

class TCGFindYourTub extends HTMLElement {
    constructor() {
        super();
    }

    connectedCallback() {
        this.models = this.fetchFromSession(`${this.dataset.metaType}_models`);
        this.brands = this.fetchFromSession(`${this.dataset.metaType}_brands`);
        this.brand_select = this.querySelector('select[name="brands"]');
        this.model_select = this.querySelector('select[name="models"]');

        this.max_models_per_fetch = 50;

        this.brand_select.addEventListener('change', (event) => { this.filterModels() });

        if(this.models.length <= 0 || this.brands.length <= 0) {
            this.fetchTubs(); //page index starts at 1
            return;
        }

		if(this.brand_select.options.length > 0) {
			return;
		}

        this.renderOptions();
    }

	clearSessionStorage() {
		sessionStorage.removeItem(`${this.dataset.metaType}_brands`);
		sessionStorage.removeItem(`${this.dataset.metaType}_models`);
	}

    fetchFromSession(id) {
        return sessionStorage.getItem(id) ? JSON.parse(sessionStorage.getItem(id)) : [];
    }

    fetchTubs() {
        if(!this.dataset.metaType) {
            return;
        }

		if(!this.dataset.pages) {
			return;
		}

		var promises = [];
		var pages = parseInt(this.dataset.pages);

		fetch(`${window.Shopify.routes.root}?view=${this.dataset.metaType}`)
		.then((resp) => resp.text())
		.then((response) => {
			var parsedPage = JSON.parse(response);

			for(var i = 1; i < pages + 1; i++) {
				promises.push(fetch(`${window.Shopify.routes.root}?view=${this.dataset.metaType}&${parsedPage.page_param}=${i}`));
			}
	
			Promise.all(promises).then((res) => {
				var text_promises = []
				for(var j = 0; j < res.length; j++) {
					text_promises.push(res[j].text());
				}
	
				Promise.all(text_promises).then((results) => {
					for(var x = 0; x < results.length; x++) {
						var parsedState = JSON.parse(results[x]);
						this.models = this.models.concat(parsedState.models);
			
						var filtered_brands = parsedState.brands.filter((brand) => !this.brands.includes(brand));
						this.brands = this.brands.concat(filtered_brands);
					}
					this.models = this.models.sort((a, b) => {
						return a._model.localeCompare(b._model);
					});
	
					this.brands = this.brands.sort((a, b) => {
						return a.localeCompare(b);
					})
	
					sessionStorage.setItem(`${this.dataset.metaType}_models`, JSON.stringify(this.models));
					sessionStorage.setItem(`${this.dataset.metaType}_brands`, JSON.stringify(this.brands));
					this.renderOptions();
					this.enableSubmit();
				});
	
			})
			.catch((error) => {
				console.error('fetchTubs Error: ' + error);
			});
		})
		.catch((errors) => console.error('fetchTubs Error: ' + errors));
    }

	enableSubmit() {}; // Interface

    renderOptions() {
        var brands_options = [];
		if(!this.dataset.selectedBrand && !this.selectedBrand) {
            brands_options.push(`<option value="" selected="selected">${this.brand_select.dataset.selectText}</option>`);
        } else {
            brands_options.push(`<option value="">${this.brand_select.dataset.selectText}</option>`);
        }
        this.brands.forEach((brand) => {
            if(this.dataset.selectedBrand == brand || this.selectedBrand == brand) {
                brands_options.push(`<option value="${brand}" selected="selected">${brand}</option>`);
                return;
            }
            brands_options.push(`<option value="${brand}">${brand}</option>`);
        });
        this.brand_select.innerHTML = brands_options;

        this.filterModels();
    }
    filterModels() {
        var model_options = [];
		if(!this.dataset.selectedModel && !this.selectedModel) {
            model_options.push(`<option value="" selected="selected">${this.model_select.dataset.selectText}</option>`);
        } else {
            model_options.push(`<option value="">${this.model_select.dataset.selectText}</option>`);
        }
        this.models.forEach((model) => {
			if (model._brand != this.brand_select.value) {
				return;
			}
            if(this.dataset.selectedModel == model._handle || this.selectedModel == model._model) {
            	model_options.push(`<option value="${model._model}" data-handle="${model._handle}" data-brand="${model._brand}" selected="selected">${model._model}</option>`);
				return;
			}	
			model_options.push(`<option value="${model._model}" data-handle="${model._handle}" data-brand="${model._brand}">${model._model}</option>`);
		});
		this.model_select.innerHTML = model_options;

		//on page load, don't clear the model select
		if(!this.selectedModel){
			this.model_select.value = "";
		} else {
			this.selectedModel = "";
		}

        this.toggleModelDisabled();
    }

    toggleModelDisabled() {
        if(this.brand_select.options[this.brand_select.selectedIndex].value) {
            this.model_select.setAttribute('disabled', false);
            this.model_select.removeAttribute('disabled');
            return;
        }

        this.model_select.setAttribute('disabled', true);
    }
}

customElements.define('tcg-find-your-tub', TCGFindYourTub);