class TCGCartForm extends HTMLElement {
	constructor() {
		super();
	}

	connectedCallback() {}
}

customElements.define("tcg-cart-form", TCGCartForm);

class TCGQuantityInput extends HTMLElement {
	constructor() {
		super();
	}

	connectedCallback() {
		this.input = this.querySelector("input");
		this.changeEvent = new Event("change", { bubbles: true });
		this.input.addEventListener("change", (event) => {
			this.onInputChange(event);
		});
		this.querySelectorAll("button").forEach((button) =>
			button.addEventListener("click", this.onButtonClick.bind(this))
		);
	}

	disconnectedCallback() {}

	onInputChange(event) {
		this.validateQtyRules();
		tcgChangeCartQuantity(this.dataset.index, parseInt(this.input.value));
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
		if (this.input.min) {
			const min = parseInt(this.input.min);
			const buttonMinus = this.querySelector(".quantity-button[name='minus']");
			if (!buttonMinus.disabled)
				buttonMinus.classList.toggle("disabled", value <= min);
		}
		if (this.input.max) {
			const max = parseInt(this.input.max);
			const buttonPlus = this.querySelector(".quantity-button[name='plus']");
			if (!buttonPlus.disabled)
				buttonPlus.classList.toggle("disabled", value >= max);
		}
	}
}

customElements.define("quantity-input", TCGQuantityInput);

class TCGRemoveButton extends HTMLElement {
	constructor() {
		super();
	}

	connectedCallback() {
		this.button = this.querySelector("button");
		this.button.addEventListener("click", (event) => {
			this.onClick(event);
		});
	}

	onClick(event) {
		event.preventDefault();
		if (this.dataset.keys) {
			var updates = {};
			var keySplit = this.dataset.keys.split("|");
			keySplit.forEach((key) => {
				updates[`${key}`] = 0;
			});
			tcgUpdateLineItems(updates, this.dataset.index);
			return;
		}
		tcgChangeCartQuantity(this.dataset.index, 0);
	}
}

customElements.define("tcg-remove-button", TCGRemoveButton);

function tcgChangeCartQuantity(line_index, quantity) {
	var line = parseInt(line_index);
	const body = JSON.stringify({
		line,
		quantity,
		sections: tcgGetCartSectionsToRender().map((section) => section.section),
		sections_url: window.location.pathname,
	});

	fetch(`${routes.cart_change_url}`, { ...fetchConfig(), ...{ body } })
		.then((response) => {
			return response.text();
		})
		.then((state) => {
			tcgUpdateCartVisuals(line, state);
		});
}

function tcgUpdateLineItems(updates, line) {
	const body = JSON.stringify({
		updates,
		sections: tcgGetCartSectionsToRender().map((section) => section.section),
		sections_url: window.location.pathname,
	});

	fetch(`${routes.cart_update_url}`, { ...fetchConfig(), ...{ body } })
		.then((response) => {
			return response.text();
		})
		.then((state) => {
			tcgUpdateCartVisuals(line, state);
		});
}

function tcgUpdateCartVisuals(line, state) {
	const parsedState = JSON.parse(state);
	if (parsedState.error) {
		console.error(`tcgUpdateVisuals: errors from state: ${parsedState.error}`);
		tcgUpdateLiveRegions(line, parsedState.error);
		return;
	}
	if (parsedState.errors) {
		console.error(`tcgUpdateVisuals: errors from state: ${parsedState.errors}`);
		tcgUpdateLiveRegions(line, parsedState.errors);
		return;
	}
	const quantityElement = document.getElementById(`quantity-${line}`);

	tcgGetCartSectionsToRender().forEach((section) => {
		const elementToReplace =
			document.getElementById(section.id).querySelector(section.selector) ||
			document.getElementById(section.id);
		elementToReplace.innerHTML = tcgGetSectionInnerHTML(
			parsedState.sections[section.section],
			section.selector
		);
	});

	const updatedValue = parsedState.items[line - 1] ? parsedState.items[line - 1].quantity : undefined;

	let message = "";
	if (updatedValue !== parseInt(quantityElement.value)) {
		if (typeof updatedValue === "undefined") {
			message = window.cartStrings.error;
		} else {
			message = window.cartStrings.quantityError.replace(
				"[quantity]",
				updatedValue
			);
		}
	}
	tcgUpdateLiveRegions(line, message);
}

function tcgGetSectionInnerHTML(html, selector) {
	return new DOMParser()
		.parseFromString(html, "text/html")
		.querySelector(selector).innerHTML;
}

function tcgGetCartSectionsToRender() {
	return [
		{
			id: "cart-section",
			section: document.getElementById("cart-section").dataset.id,
			selector: ".js-content",
		},
		{
			id: "cart-icon-bubble",
			section: "cart-icon-bubble",
			selector: "#cart-icon-bubble"
		},
	];
}

function tcgUpdateLiveRegions(line, message) {
	const lineItemError = document.getElementById(`line-item-error-${line}`);
	if (lineItemError)
		lineItemError.querySelector(".cart-item__error-text").innerHTML = message;

	this.lineItemStatusElement.setAttribute("aria-hidden", true);

	setTimeout(() => {
		cartStatus.setAttribute("aria-hidden", true);
	}, 1000);
}
