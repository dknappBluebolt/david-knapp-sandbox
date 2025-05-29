class ProductForm extends HTMLElement {
	constructor() {
		super();
		this.form = this.querySelector("form");
		this.form.querySelector("[name=id]").disabled = false;
		//this.form.addEventListener("submit", this.onSubmitHandler.bind(this));
		this.submitButton = this.querySelector('[type="submit"]');
	}

	onSubmitHandler(event) {
		event.preventDefault();
		if (this.submitButton.getAttribute("aria-disabled") === "true") return;

		var addObj = {
			items: this.generateLineItems(),
			sections: this.getSectionsToRender().map((section) => section.section),
			attributes: { createdInStorefront: 'true' }
		};
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
		var main_item = this.form.querySelector("[name=id]");

		if(!main_item) {
			console.log("generateLineItems: primary line item not found");
			return [];
		}

		var defaultQuantity = this.querySelector(
			`#Quantity-${this.dataset.sectionId}`
		)?.value;

		if (!defaultQuantity) {
			defaultQuantity = 1;
		}

		var line_items = [{
			id: main_item.value,
			quantity: defaultQuantity
		}];

		/// Section to look up and add additional line items if needed

		return line_items;
	}

	connectedCallback() {}
}

customElements.define("product-form", ProductForm);

class ProductOptions extends HTMLElement {
	constructor() {
		super();
	}

	connectedCallback() {
		this.addEventListener("change", this.onVariantChange);
		this.form = document.querySelector(`#${this.dataset.formId}`);
	}

	onVariantChange(event) {
		this.updateFormValues(event.target.value);
		this.renderVariantUpdates(event.target.value);
		this.updateURL(event.target.value);
		if(typeof coverConfigurator != "undefined"){
			coverConfigurator.updateInput(event.target);
		}
	}

	updateURL(variantId) {
		if (this.dataset.updateUrl === "false") return;
		window.history.replaceState(
			{},
			"",
			`${this.dataset.url}?variant=${variantId}`
		);
	}

	updateFormValues(variantId) {
		document.querySelectorAll(".js-variant-id").forEach((input) => input.value = variantId);
	}

	renderVariantUpdates(variantId) {
		fetch(
			`${this.dataset.url}?variant=${variantId}&section_id=${this.dataset.sectionId}`
		)
			.then((response) => response.text())
			.then((responseText) => {
				const html = new DOMParser().parseFromString(responseText, "text/html");
				this.reRenderSection(`#variant-price-${this.dataset.sectionId}`, html);
				this.reRenderSection(`#options-${this.dataset.sectionId}`, html);
				this.reRenderSection(`#submit-${this.dataset.sectionId}-desktop`, html);
				this.reRenderSection(`#submit-${this.dataset.sectionId}-mobile`, html);
				this.reRenderSection(`#swiper-section-${this.dataset.sectionId}`, html);
				this.reRenderSection(`#info-tabs-mobile-${this.dataset.sectionId}`, html);
				this.reRenderSection(`#info-tabs-desktop-${this.dataset.sectionId}`, html);
			});
	}

	reRenderSection(selector, html) {
		var existingElement = document.querySelector(selector);
		if (!existingElement) {
			return;
		}

		var newElement = html.querySelector(selector);
		if (!newElement) {
			return;
		}

		existingElement.innerHTML = newElement.innerHTML;
	}
}

customElements.define("product-options", ProductOptions);

class QuantityInput extends HTMLElement {
	constructor() {
		super();
		this.input = this.querySelector("input");
		this.changeEvent = new Event("change", { bubbles: true });
		this.input.addEventListener("change", this.onInputChange.bind(this));
		this.querySelectorAll("button").forEach((button) =>
			button.addEventListener("click", this.onButtonClick.bind(this))
		);
	}

	connectedCallback() {}

	disconnectedCallback() {}

	onInputChange(event) {
		this.validateQtyRules();
	}

	onButtonClick(event) {
		event.preventDefault();
		const previousValue = this.input.value;

		event.target.name === "plus" ? this.input.stepUp() : this.input.stepDown();
		if (previousValue !== this.input.value)
			this.input.dispatchEvent(this.changeEvent);
	}

	validateQtyRules() {
		const value = parseInt(this.input.value);

		Array.from(document.querySelectorAll('.js-quantity'))
			.filter((input) => input != this.input)
			.forEach((input) => {
				input.value = value;
			});

		if (this.input.min) {
			const min = parseInt(this.input.min);
			document.querySelectorAll(".quantity-button[name='minus']")
			.forEach((button) => {
				if (!button.disabled)
					button.classList.toggle("disabled", value <= min);
			});

		}
		if (this.input.max) {
			const max = parseInt(this.input.max);
			document.querySelector(".quantity-button[name='plus']")
			.forEach((button) => {
				if (!button.disabled)
					button.classList.toggle("disabled", value >= max);
			})
		}
	}
}

customElements.define("quantity-input", QuantityInput);

class ProductInfoTabs extends HTMLElement {
	constructor() {
		super();
		this._button_selector = '.js-tab-button';
		this._tab_selector = '.js-tab';
		this._active_class = 'active';
		this._hidden_class = 'd--none';
		this.querySelectorAll(this._button_selector).forEach((button) =>
		  button.addEventListener('click', this.onButtonClick.bind(this))
		);
	  }

	  connectedCallback() {

	  }

	  onButtonClick(event) {
		event.preventDefault();
		event.stopPropagation();
		this.clearActiveTabs();
		event.currentTarget.classList.add(this._active_class);
		this.showSelectedTab(event.currentTarget.dataset.id);
	  }

	  clearActiveTabs() {
		this.querySelectorAll(this._button_selector).forEach((button) => {
			button.classList.remove(this._active_class);
		});
		this.querySelectorAll(this._tab_selector).forEach((tab) => {
			tab.classList.add(this._hidden_class);
		});
	  }

	  showSelectedTab(id) {
		var html = document.querySelector(`#${id}`);
		if(!html) {
			console.error(`template-product.js showSelectedTab: tab not found ${id}`);
			return;
		}
		html.classList.remove(this._hidden_class);
	  }
}

customElements.define('product-info-tabs', ProductInfoTabs);

class SwiperSection extends HTMLElement {
	constructor() {
		super();
	  }

	  connectedCallback() {
		window.initProductSwipers();
	  }
}

customElements.define('swiper-section', SwiperSection);

class MobileViewAddToCart extends HTMLElement {
	constructor() {
		super();
	  }

	connectedCallback() {
		this.isVisible = false;
		this.productForm = this.querySelector('product-form');
		if(!this.productForm) {
			return;
		}

		this.desktopAddToCart = document.querySelector(`#submit-${this.productForm.dataset.sectionId}-desktop`);
		if(!this.desktopAddToCart) {
			return;
		}

		window.addEventListener('scroll', (event) => this.toggleScrollView())
		this.toggleScrollView();
	  }

	  toggleScrollView() {
		const visibilityPosition = document.documentElement.scrollTop + this.desktopAddToCart.getBoundingClientRect().top;
		if(window.scrollY > visibilityPosition && !this.isVisible) {
			this.classList.remove('hidden');
			this.isVisible = true;
			return;
		}

		if(window.scrollY < visibilityPosition && this.isVisible) {
			this.classList.add('hidden');
			this.isVisible = false;
			return;
		}
	  }
}

customElements.define('mobile-view-add-to-cart', MobileViewAddToCart);