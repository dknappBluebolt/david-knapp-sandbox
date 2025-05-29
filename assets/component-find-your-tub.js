class TCGFindYourTubSection extends TCGFindYourTub {
    constructor() {
        super();
    }

    connectedCallback() {
        this.submit_button = this.querySelector('button');
        this.submit_button.addEventListener('click', (event) => { this.submitModel() });
        super.connectedCallback();
        this.model_select.addEventListener('change', (event) => { this.enableSubmit() });
    }

    submitModel() {
        window.location = this.submit_button.dataset.url + `?step=1&brand=${this.brand_select.value}&model=${this.model_select.value}`;
    }

    enableSubmit() {
        if(this.model_select.value) {
            this.submit_button.setAttribute('disabled', false);
            this.submit_button.removeAttribute('disabled');
            return;
        }
        this.submit_button.setAttribute('disabled', true);
    }
}

customElements.define('tcg-find-your-tub-section', TCGFindYourTubSection);