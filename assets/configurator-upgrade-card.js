class TCGConfigureUpgradeCard extends HTMLElement {
    constructor() {
		super();
	}
    
    connectedCallback() {
        this.input = this.querySelector(".promo-cards__input");
        this.image = this.querySelector(".promo-cards__image");
        this.description = this.querySelector(".promo-cards__desc");
        this.price = this.querySelector(".promo-cards__price");
        this.modalHeaders = this.querySelectorAll(".js-variant-modal-header");
        this.modalContent = this.querySelectorAll(".js-variant-modal-content");
        this.badge = this.querySelector(".promo-cards__badge");
        
        this.select = this.querySelector(".promo-cards__select");
        if(this.select) {
            this.select.addEventListener('change', (event) => this.updateCard(event.target.selectedOptions[0]));
        }
    }

    updateModalElement(element, selected_id) {
        if(element.dataset.id == selected_id) {
            element.classList.remove("hidden");
            return;
        }
        element.classList.add("hidden");
    }

    updateCard(option) {
        this.image.src = option.dataset.imageSrc;
        this.image.alt = option.dataset.imageAlt;
        this.description.innerHTML = option.dataset.blurb;
        var compareAtPrice = option.dataset.compareAtPrice ? ` <s class="color--gray-text">${option.dataset.compareAtPrice}</s>` : '';
        this.price.innerHTML = `+${option.dataset.price}${compareAtPrice}`;
        if(option.dataset.badge) {
            this.badge.classList.remove("hidden");
            this.badge.innerHTML = option.dataset.badge;
        } else {
            this.badge.classList.add("hidden");
            this.badge.innerHTML = "";
        }

        this.modalHeaders.forEach((element) => this.updateModalElement(element, option.value));
        this.modalContent.forEach((element) => this.updateModalElement(element, option.value));
        
        this.input.dataset.configuratorId = option.value;
        this.input.dataset.configuratorOptionPrice = option.dataset.unformattedPrice;
        this.input.dataset.configuratorOriginalOptionPrice = option.dataset.unformattedPrice;
        this.input.dataset.configuratorVariants = option.dataset.associatedVariants;

        if(this.input.checked) {
            var event = new Event('change');
            this.input.dispatchEvent(event);
        }
    }
}

customElements.define('tcg-configure-upgrade-card', TCGConfigureUpgradeCard);