class TCGFindYourTubProduct extends TCGFindYourTub {
	constructor() {
		super();
	}

	connectedCallback() {

		this.submit_buttons = document.querySelectorAll('.open-configurator-view.button');
		var urlParams = new URLSearchParams(window.location.search);
		if(urlParams.has('brand')) {
			this.selectedBrand = urlParams.get('brand');
		}
		if(urlParams.has('model')) {
			this.selectedModel = urlParams.get('model');
		}
		super.connectedCallback();
		this.model_select.addEventListener('change', (event) => { this.onModelChange() });
		this.enableSubmit();
	}

	filterByObject(values, filterObject) {
		const filterKeys = Object.keys(filterObject).filter(key => filterObject[key] !== null)
		return values.filter(value => {
			return filterKeys.every(key => filterObject[key] === value[key])
		})
	}

	onModelChange(){
		this.enableSubmit();

		const modelName = this.model_select.value;
		const brandName = this.brand_select.value;
		const matchingBrands = this.filterByObject(this.models,{_brand: brandName});
		const model = this.filterByObject(matchingBrands,{_model: modelName})[0];

		if(typeof coverConfigurator != 'undefined' && model){
			coverConfigurator.tryUpdateSelect(null,model);
		}
	}

	enableSubmit() {
		if(!this.model_select.value) {
			this.submit_buttons.forEach((button) => {
				button.setAttribute('disabled', true);
			});
			return;
		}

		this.submit_buttons.forEach((button) => {
			button.setAttribute('disabled', false);
			button.removeAttribute('disabled');
		});
	}

	getSelectedModelData(){
		return super.getSelectedModelData();
	}
}

customElements.define('tcg-find-your-tub-product', TCGFindYourTubProduct);

const coverConfigurator = {
	configuratorData: {},
	editKeys: [],
	step: 0,
	drawerContentByStep: [
		['_variant_title','_brand', '_model'],
		['_shape', '_dimension_a', '_dimension_b', '_dimension_c', '_dimension_d', '_fold_location', '_strap_location', '_skirt_length'],
		['color', 'handles', 'extra_handles'],
		['upgrade_addons']
	],
	dimensions: ['a', 'b', 'c', 'd'],
	cartTitles: {
		'_strap_location': 'Strap Location: ',
		'_skirt_length': 'Skirt Length: '
	},
	init() {
		const containingElement = document.querySelector('.configurator-view');
		if (!containingElement) {
			return;
		}
		coverConfigurator.toggleTextDisplay();
		coverConfigurator.openAndCloseConfiguratorView();
		coverConfigurator.stepPanelProgression();
		coverConfigurator.calculateTotalPrice();
		coverConfigurator.captureDisplayAndSubmitSelectedInputs();
		coverConfigurator.filterUpgrades();
		coverConfigurator.upsellPackageLogic();
		coverConfigurator.buildConfiguratorDisplayAndInputs();
		coverConfigurator.setupStep();
		coverConfigurator.resetAllOptionsOnRestart();
		coverConfigurator.displaySelectedOptions();
		coverConfigurator.tabletHoverNavigation();
		coverConfigurator.checkFirstOptionOptions1();
		window.addEventListener("popstate", (event) => {
			if (!this.validateCurrentStep()) {
				event.preventDefault();

				if(typeof event.state == "object" && event.state.obsolete !== true) {
					history.replaceState({ obsolete: true }, "");
					history.pushState(event.state, "");
				}

				if (typeof event.state == "object" && event.state.obsolete === true) {
					history.back();
				}
				return;
			}
			coverConfigurator.setupStep();
		});
	},
	setupStep() {
		const selectedVariant = document.querySelector(
			".configurator_variant:checked"
		);
		if(selectedVariant) {
			this.configuratorData._variant_title = {
				step: 1,
				value: selectedVariant.dataset.configuratorTitle
			};
		}

		const find_your_tub = document.querySelector('tcg-find-your-tub-product');
		if(find_your_tub) {
			this.configuratorData._configurator_type = find_your_tub.dataset.metaType;
		}

		var urlParams = new URLSearchParams(window.location.search);
		if(urlParams.has('key')) {
			this.populateStep(urlParams);
			this.populateBrandAndModel(urlParams);
			this.populateInfo(urlParams.get('key'));
			return;
		}

		var cachedData = this.fetchCachedConfiguratorData();

		if(cachedData && cachedData._configurator_type == this.configuratorData._configurator_type) {
			this.populateStep(urlParams);
			this.populateBrandAndModel(urlParams);
			this.populateInfoFromCache();
			return;
		}

		this.closeConfigurator();

		if(this.populateBrandAndModel(urlParams)) {
			return;
		}

		sessionStorage.removeItem('configuratorData');
		window.history.pushState(this.configuratorData, '', `${window.location.pathname}`);
	},
	populateBrandAndModel(urlParams) {
		if(!urlParams.has('brand') || !urlParams.has('model')) {
			return false;
		}

		this.configuratorData['_brand'] = {
			value: urlParams.get('brand'),
			id: null,
			step: 2
		}
		this.configuratorData['_model'] = {
			value: urlParams.get('model'),
			id: null,
			step: 2
		}
		return true;
	},
	populateStep(urlParams) {
		if(urlParams.has('step')) {
			var step = parseInt(urlParams.get('step')) ?? 1;
			this.setStep(step);
		} else {
			this.closeConfigurator();
		}
	},
	populateInfoFromCache() {
		const cachedData = this.fetchCachedConfiguratorData();
		this.populateStep2(cachedData);
		Object.keys(cachedData).filter((key) => {
			if(key == '_brand') {
				const find_your_tub = document.querySelector('tcg-find-your-tub-product');
				if(find_your_tub) {
					find_your_tub.dataset.selectedBrand = cachedData[key].value;
				}
				this.updateSelect(key, cachedData[key]);
			}
			if(key == '_model') {
				const find_your_tub = document.querySelector('tcg-find-your-tub-product');
				if(find_your_tub) {
					find_your_tub.dataset.selectedModel = cachedData[key].value;
				}
				this.updateSelect(key, cachedData[key]);
			}
			if(Array.isArray(cachedData[key])) {
				cachedData[key].forEach((item) => {
					this.populateInputFromCache(item);
				});
				return;
			}

			this.populateInputFromCache(cachedData[key]);
		});
	},
	populateInputFromCache(item) {
		if(!item.id) {
			return;
		}
		const input = document.querySelector(`input[data-configurator-id='${item.id}']`);
		const dropdownInput = document.querySelector(`input[data-configurator-all-variant-ids*="${item.id}"]`);
		if(!input && !dropdownInput) {
			this.tryUpdateSelect(item);
			return;
		}
		if(!input) {
			this.tryUpdateDropdownInput(dropdownInput, item.id);
			return;
		}
		input.checked = true;
		this.updateInput(input);
		var event = new Event('change',{bubbles: true});
		input.dispatchEvent(event);
	},
	populateInfo(key) {
		fetch(`${window.routes.cart_url}.json`)
		.then((res) => res.text())
		.then((result) => {
			const parsedState = JSON.parse(result);
			if(parsedState.error) {
				return;
			}
			var parent_variant = parsedState.items.filter((item) => item.key == key)[0];
			if(!parent_variant) {
				console.error("Populate Info: Variant Not Found");
				return;
			}
			this.editKeys.push(parent_variant.key);
			this.populateStep2(parent_variant.properties);
			var cover_id = parent_variant.properties._cover_id;
			if(parent_variant.properties._upsell_packages) {
				parent_variant.properties._upsell_packages.forEach((upsell) => {
					var input = document.querySelector(`input[data-configurator-id='${upsell}']`);
					const dropdownInput = document.querySelector(`input[data-configurator-all-variant-ids*="${upsell}"]`);
					if(!input && !dropdownInput) {
						this.tryUpdateSelect(item);
						return;
					}
					if(!input) {
						this.tryUpdateDropdownInput(dropdownInput, upsell);
						return;
					}
					input.checked = true;
					this.updateInput(input);
					var event = new Event('change');
					input.dispatchEvent(event);
				});
			}
			parsedState.items.filter((item) => {
				if(!item.properties._cover_id || item.properties._cover_id != cover_id) {
					return;
				}
				this.editKeys.push(item.key);
				const input = document.querySelector(`input[data-configurator-id='${item.id}']`);
				const dropdownInput = document.querySelector(`input[data-configurator-all-variant-ids*="${item.id}"]`);
				if(!input && !dropdownInput) {
					this.tryUpdateSelect(item);
					return;
				}
				if(!input) {
					this.tryUpdateDropdownInput(dropdownInput, item.id);
					return;
				}
				input.checked = true;
				this.updateInput(input);
				var event = new Event('change');
				input.dispatchEvent(event);
			})
		});
	},
	tryUpdateDropdownInput(input, upsell_id) {
		input.checked = true;
		var select = document.querySelector(`#promo_${input.id}_select`);
		if(!select) {
			return;
		}
		select.value = upsell_id;
		var event = new Event('change');
		select.dispatchEvent(event);
	},
	tryUpdateSelect(item, model) {
		const select = document.querySelector('#skirt-length');
		if(!select) {
			return;
		}
		var item_value = null;
		if(item){
			item_value = item.variant_title ? item.variant_title.replace('"', '') : item.value.replace('"', '');
		} else if(model) {
			if(model._skirt_length){
				item_value = model._skirt_length;
			}
		}
		if(item_value == null){
			return;
		}
		item_value = parseFloat(item_value.replace('"','')).toFixed(1).toString();

		var selected_option_value = "";
		select.querySelectorAll('option').forEach((option) => {
			const option_value = parseFloat(option.value.replace('"','')).toFixed(1).toString();
			if(option_value == item_value) {
				selected_option_value = option.value;
				return;
			}
		});
		select.value = selected_option_value;
		this.updateInput(select);
		var event = new Event('change');
		select.dispatchEvent(event);
	},
	resetAllOptionsOnRestart() {
		const restartButton = document.querySelector('.configurator-view__restart');
		restartButton.addEventListener('click', () => {
			sessionStorage.removeItem('configuratorData');
			location.href = location.href.replace(location.search, '');
		});
	},
	toggleTextDisplay() {
		const revealButton = document.querySelectorAll('.configurator-steps__toggle');
		const textToReveal = document.querySelectorAll('.configurator-steps__reveal');

		revealButton.forEach((button, index) => {
			button.addEventListener('click', () => {
				textToReveal[index].classList.toggle('is-open');
				revealButton[index].classList.toggle('is-open');
			});
		});
	},
	openAndCloseConfiguratorView() {
		const configuratorOpenButtons = document.querySelectorAll('.open-configurator-view');
		const configuratorCloseButton = document.querySelector('.configurator-view__restart');
		const configuratorView = document.querySelector('.configurator-view');

		const step1EditButtonDesk = document.querySelectorAll('.configurator-steps.is-desktop .configurator-steps__step.is-step-1 .configurator-steps__edit');
		const step1EditButtonMob = document.querySelectorAll('.configurator-mobile-menu-modal .configurator-steps__step.is-step-1 .configurator-steps__edit');

		const mainProductView = document.querySelector('.product-with-configurator-view');
		const productSection = document.querySelector('.page-section');

		const mobileModalTriggerBtn = document.querySelector('.mobile-configurator-menu-trigger');
		const mobileModal = document.querySelector('.configurator-mobile-menu-modal');
		const mobileModalCloseBtn = document.querySelector('.configurator-mobile-menu-modal__close');

		configuratorOpenButtons.forEach((button) => {
			button.addEventListener('click', () => {
				this.populateStep2();
				this.setStep(2);
				this.updateCartDrawers();
				this.updateHistory(2);
			});
		});
		configuratorCloseButton.addEventListener('click', () => {
			configuratorView.classList.remove('is-open');
			mainProductView.classList.remove('is-hidden');
			productSection.classList.remove('has-no-padding');
			window.scrollTo(0,0);
		});
		step1EditButtonDesk.forEach((button) => {
			button.addEventListener('click', () => {
				configuratorView.classList.remove('is-open');
				mainProductView.classList.remove('is-hidden');
				productSection.classList.remove('has-no-padding');
				mobileModal.classList.remove('is-open');
				window.scrollTo(0,0);
			});
		});
		step1EditButtonMob.forEach((button) => {
			button.addEventListener('click', () => {
				configuratorView.classList.remove('is-open');
				mainProductView.classList.remove('is-hidden');
				productSection.classList.remove('has-no-padding');
				mobileModal.classList.remove('is-open');
				window.scrollTo(0,0);
			});
		});
		document.addEventListener('keydown', (event) => {
			if (event.key === 'Escape') {
				configuratorView.classList.remove('is-open');
				mobileModal.classList.remove('is-open');
				mainProductView.classList.remove('is-hidden');
				productSection.classList.remove('has-no-padding');
				window.scrollTo(0,0);
			}
		});
		mobileModalTriggerBtn.addEventListener('click', () => {
			mobileModal.classList.add('is-open');
		});
		mobileModalCloseBtn.addEventListener('click', () => {
			mobileModal.classList.remove('is-open');
		});
	},
	validateCurrentStep() {
		switch(this.step) {
			case 2:
				return this.validateStep2();
			case 3:
				return this.validateStep3();
			default:
				return true;
		}
	},
	validateStep2() {
		// Shape error handling
		const configuratorShapeInputs = document.querySelectorAll('input[name="configurator_shape"]');

		function inputShapeSelected() {
			const errorMsgShape = document.querySelector('#error-msg-shape');
			const selectedShape = document.querySelector('input[name="configurator_shape"]:checked');

			if (!selectedShape) {
				errorMsgShape.innerHTML = configuratorErrors.shape_required;
				errorMsgShape.tabIndex = 0;
				errorMsgShape.focus();
				return false;
			} else {
				errorMsgShape.innerHTML = '';
				errorMsgShape.tabIndex = -1;
				return true;
			}
		}

		inputShapeSelected();

		configuratorShapeInputs.forEach(input => {
			input.addEventListener('change', () => {
				inputShapeSelected();
			});
		});

		function inputDimension(position) {
			const dimensionInput = document.querySelector(`#dimension-${position}`);
			const errorMsgDimension = document.querySelector(`#error-msg-dimension-${position}`);

			if(!dimensionInput) {
				return true;
			}

			if(!dimensionInput.offsetParent) {
				return true;
			}

			if(dimensionInput.style.display == 'hidden') {
				return true;
			}

			if (!dimensionInput.value || parseFloat(dimensionInput.value) == 0) {
				errorMsgDimension.innerHTML = `Dimension ${position.toUpperCase()} required.`;
				errorMsgDimension.tabIndex = 0;
				errorMsgDimension.focus();
				return false;
			}

			if (!dimensionInput.value || isNaN(dimensionInput.value) || !/^\d+(\.\d{1,4})?$/.test(dimensionInput.value)) {
				errorMsgDimension.innerHTML = configuratorErrors.dimension_invalid;
				errorMsgDimension.tabIndex = 0;
				errorMsgDimension.focus();
				return false;
			}

			return true;
		}

		this.dimensions.forEach((dimension) => {
			const dimensionInput = document.querySelector(`#dimension-${dimension}`);
			inputDimension(dimension);
			dimensionInput.addEventListener('change', () => {
				inputDimension(dimension);
			});
		})

		// Attestations error handling
		const errorMsgAttestation = document.querySelector('#error-msg-attestation');
		const dimensionsAttestationInput = document.querySelector('#dimensions-attestation');

		function inputAttestationSelected() {
			const dimensionsAttestationChecked = document.querySelector('#dimensions-attestation:checked');
			if (!dimensionsAttestationChecked) {
				errorMsgAttestation.innerHTML = configuratorErrors.dimensions_attestation_required;
				errorMsgAttestation.tabIndex = 0;
				errorMsgAttestation.focus();
				return false;
			} else {
				errorMsgAttestation.innerHTML = '';
				errorMsgAttestation.tabIndex = -1;
				return true;
			}
		}

		inputAttestationSelected();

		dimensionsAttestationInput.addEventListener('change', () => {
			inputAttestationSelected();
		});

		// Fold, straps, skirt error handling

		const errorMsgFold = document.querySelector('#error-msg-fold-direction');
		const errorMsgStrap = document.querySelector('#error-msg-strap-location');
		const errorMsgSkirt = document.querySelector('#error-msg-skirt-length');

		const foldDirectionInput = document.querySelector('#fold-location');
		const strapLocationInput = document.querySelector('#strap-location');
		const skirtLengthInput = document.querySelector('#skirt-length');

		function inputFoldSelected() {

			if(!foldDirectionInput.offsetParent) {
				return true;
			}

			const foldDirectionSelected = document.querySelector('#fold-location option:not(:first-child):checked');
			if (!foldDirectionSelected) {
				errorMsgFold.innerHTML = configuratorErrors.fold_direction_required;
				errorMsgFold.tabIndex = -1;
				errorMsgFold.focus();
				return false;
			} else {
				errorMsgFold.innerHTML = '';
				return true;
			}
		}

		function inputStrapSelected() {

			if(!strapLocationInput.offsetParent) {
				return true;
			}

			const strapLocationSelected = document.querySelector('#strap-location option:not(:first-child):checked');
			if (!strapLocationSelected) {
				errorMsgStrap.innerHTML = configuratorErrors.strap_location_required;
				errorMsgStrap.tabIndex = 0;
				errorMsgStrap.focus();
				return false;
			} else {
				errorMsgStrap.innerHTML = '';
				errorMsgStrap.tabIndex = -1;
				return true;
			}
		}

		function inputSkirtSelected() {

			if(!skirtLengthInput.offsetParent) {
				return true;
			}

			const skirtLengthSelected = document.querySelector('#skirt-length option:not(:first-child):checked');
			if (!skirtLengthSelected) {
				errorMsgSkirt.innerHTML = configuratorErrors.skirt_length_required;
				errorMsgSkirt.tabIndex = 0;
				errorMsgSkirt.focus();
				return false;
			} else {
				errorMsgSkirt.innerHTML = '';
				errorMsgSkirt.tabIndex = -1;
				return true;
			}
		}

		inputFoldSelected();
		inputStrapSelected();
		inputSkirtSelected();

		foldDirectionInput.addEventListener('change', () => {
			inputFoldSelected();
		});

		strapLocationInput.addEventListener('change', () => {
			inputStrapSelected();
		});

		skirtLengthInput.addEventListener('change', () => {
			inputSkirtSelected();
		});

		// Check each required input on Step 2 confirm they're true before proceeding
		if (!inputShapeSelected() || !inputAttestationSelected() || !inputFoldSelected() || !inputStrapSelected() || !inputSkirtSelected()) {
			return false;
		}

		if (!inputDimension('a') || !inputDimension('b') || !inputDimension('c') || !inputDimension('d')) {
			return false;
		}

		return true;
	},
	validateStep3() {
		// Color error handling
		const configuratorColorInputs = document.querySelectorAll('input[name="vinyl_color"]');

		function inputColorSelected() {
			const errorMsgColor = document.querySelector('#error-msg-color');
			const selectedColor = document.querySelector('input[name="vinyl_color"]:checked');

			if (!selectedColor) {
				errorMsgColor.innerHTML = configuratorErrors.color_required;
				errorMsgColor.tabIndex = -1;
				errorMsgColor.focus();
				return false;
			} else {
				errorMsgColor.innerHTML = '';
				errorMsgColor.tabIndex = -1;
				return true;
			}
		}

		inputColorSelected();

		configuratorColorInputs.forEach(input => {
			input.addEventListener('change', () => {
				inputColorSelected();
			});
		});

		// Handle error handling
		const configuratorOptions1Inputs = document.querySelectorAll('input[name="options_1"]');

		function inputOptions1Selected() {
			const errorMsgOptions1 = document.querySelector('#error-msg-options-1');
			const selectedOptions1 = document.querySelector('input[name="options_1"]:checked');

			if (!selectedOptions1) {
				errorMsgOptions1.innerHTML = configuratorErrors.options1_required;
				errorMsgOptions1.tabIndex = -1;
				errorMsgOptions1.focus();
				return false;
			} else {
				errorMsgOptions1.innerHTML = '';
				errorMsgOptions1.tabIndex = -1;
				return true;
			}
		}

		inputOptions1Selected();

		configuratorOptions1Inputs.forEach(input => {
			input.addEventListener('change', () => {
				inputOptions1Selected();
			});
		});

		// Check each required input on Step 2 confirm they're true before proceeding
		if (inputColorSelected() && inputOptions1Selected()) {
			return true;
		}
		return false;
	},
	toggleFaqAndFooter() {
		const faqSection = document.querySelector('.faq-section');
		const themeFooter = document.querySelector('.theme-footer');
		if (this.step === 1) {
			if (faqSection) faqSection.style.display = '';
			if (themeFooter) themeFooter.style.display = '';
		} else {
			if (faqSection) faqSection.style.display = 'none';
			if (themeFooter) themeFooter.style.display = 'none';
		}
	},
	// allow this to accept the step it should switch to
	stepPanelProgression() {
		const step2ContinueButtons = document.querySelectorAll('.configurator-content__continue--btn.is-step-2');
		const step3ContinueButtons = document.querySelectorAll('.configurator-content__continue--btn.is-step-3');

		const step1EditButtonDesk = document.querySelectorAll('.configurator-steps.is-desktop .configurator-steps__step.is-step-1 .configurator-steps__edit');
		const step2EditButtonDesk = document.querySelectorAll('.configurator-steps.is-desktop .configurator-steps__step.is-step-2 .configurator-steps__edit');
		const step3EditButtonDesk = document.querySelectorAll('.configurator-steps.is-desktop .configurator-steps__step.is-step-3 .configurator-steps__edit');

		const step1EditButtonMob = document.querySelectorAll('.configurator-mobile-menu-modal .configurator-steps__step.is-step-1 .configurator-steps__edit');
		const step2EditButtonMob = document.querySelectorAll('.configurator-mobile-menu-modal .configurator-steps__step.is-step-2 .configurator-steps__edit');
		const step3EditButtonMob = document.querySelectorAll('.configurator-mobile-menu-modal .configurator-steps__step.is-step-3 .configurator-steps__edit');

		step2ContinueButtons.forEach((button) => {
			button.addEventListener('click', () => { 
				if(this.validateStep2()) {
					this.setStep(3);
					this.updateHistory(3);
				} 
			});
		})

		step3ContinueButtons.forEach((button) => {
			button.addEventListener('click', () => {
				if(this.validateStep3()) {
					this.setStep(4);
					this.updateHistory(4);
				}
			});
		})

		step1EditButtonDesk.forEach((button) => {
			button.addEventListener('click', () => {
				this.setStep(1);
				this.editStep(1);
				this.updateHistory(1);
			});
		});

		step2EditButtonDesk.forEach((button) => {
			button.addEventListener('click', () => {
				this.editStep(2);
				this.updateHistory(2);
			});
		});

		step3EditButtonDesk.forEach((button) => {
			button.addEventListener('click', () => {
				this.editStep(3);
				this.updateHistory(3);
			});
		});

		step1EditButtonMob.forEach((button) => {
			button.addEventListener('click', () => {
				this.setStep(1);
				this.editStep(1);
				this.updateHistory(1);
			});
		});

		step2EditButtonMob.forEach((button) => {
			button.addEventListener('click', () => {
				this.editStep(2);
				this.updateHistory(2);
			});
		});

		step3EditButtonMob.forEach((button) => {
			button.addEventListener('click', () => {
				this.editStep(3);
				this.updateHistory(3);
			});
		});

	},
	editStep(step) {
		if(!this.validateCurrentStep()) {
			return;
		}
		const allPanels = document.querySelectorAll('.configurator-content__step');
		var stepPanel = document.querySelector(`.configurator-content__step.is-step-${step}`);
		allPanels.forEach((panel) => {
			panel.classList.remove('is-active');
		});
		document.querySelector('.configurator-mobile-menu-modal').classList.remove('is-open');
		if(stepPanel) {
			stepPanel.classList.add('is-active');
		}
		this.step = step;
		window.scrollTo(0,0);

		this.toggleFaqAndFooter();
	},
	setStep(step) {
		this.clearPreviousSteps(step);
		if(step > 1) {
			document.querySelector(`.configurator-content__step.is-step-${step}`).classList.add('is-active');
			this.openConfigurator();
		} else {
			this.closeConfigurator();
		}

		let stepsDesktopMenu = document.querySelectorAll(`.configurator-steps.is-desktop .configurator-steps__step.is-step-${step}`);
		stepsDesktopMenu.forEach((step) => {
			step.classList.add('is-active');
		});

		this.step = step;

		document.querySelector(`.configurator-steps.is-mobile .configurator-steps__step.is-step-${step}`).classList.add('is-active');
		document.querySelector(`.configurator-mobile-menu-modal .configurator-steps__step.is-step-${step}`).classList.add('is-active');
		window.scrollTo(0,0);

		this.toggleFaqAndFooter();
	},
	updateHistory(step) {
		const urlParams = new URLSearchParams(window.location.search);
		urlParams.set('step', step);
		if(this.configuratorData['_brand']) {
			urlParams.set('brand', this.configuratorData['_brand'].value);
		}
		if(this.configuratorData['_model']) {
			urlParams.set('model', this.configuratorData['_model'].value);
		}
		window.history.pushState(this.configuratorData, '', `${window.location.pathname}?${urlParams}`);
	},
	openConfigurator() {
		document.querySelector('.configurator-view').classList.add('is-open');
		document.querySelector('.product-with-configurator-view').classList.add('is-hidden');
		document.querySelector('.page-section').classList.add('has-no-padding');
	},
	closeConfigurator() {
		document.querySelector('.configurator-view').classList.remove('is-open');
		document.querySelector('.product-with-configurator-view').classList.remove('is-hidden');
		document.querySelector('.page-section').classList.remove('has-no-padding');
	},
	clearPreviousSteps(step) {
		const allPanels = document.querySelectorAll('.configurator-content__step');
		allPanels.forEach((panel) => {
			panel.classList.remove('is-active');
		});

		for(var i = step - 1; i > 0; i--) {
			var stepPanel = document.querySelector(`.configurator-content__step.is-step-${i}`);
			var stepDesktopMenu = document.querySelectorAll(`.configurator-steps.is-desktop .configurator-steps__step.is-step-${i}`);
			var stepMobileMenu = document.querySelector(`.configurator-steps.is-mobile .configurator-steps__step.is-step-${i}`);
			var stepModalMenu = document.querySelector(`.configurator-mobile-menu-modal .configurator-steps__step.is-step-${i}`);
			if(stepPanel) {
				stepPanel.classList.remove('is-active');
			}
			stepDesktopMenu.forEach((step) => {
				step.classList.remove('is-active');
				step.classList.add('is-complete');
			});
			stepMobileMenu.classList.remove('is-active');
			stepMobileMenu.classList.add('is-complete');
			stepModalMenu.classList.remove('is-active');
			stepModalMenu.classList.add('is-complete');
			document.querySelector('.configurator-mobile-menu-modal').classList.remove('is-open');
		}
	},
	lookupModel(brand, model) {
		const models = JSON.parse(sessionStorage.getItem(`${this.configuratorData._configurator_type}_models`));
		return models.filter((model_obj) => model_obj._model == model && model_obj._brand == brand)[0];
	},
	populateStep2(model) {
		var modelShape = model?._shape || null;
		if(modelShape == null) {
			var model_input = document.querySelector('select[name="models"]');
			var brand_input = document.querySelector('select[name="brands"]');
			if(!model_input || !model_input.value) {
				return;
			}

			var model = this.lookupModel(brand_input.value, model_input.value);
			modelShape = model._shape;
		}
		var shapes = document.querySelectorAll('.configurator-shapes__input');
		var shapeFound = false;
		shapes.forEach((shape) => {
			if(shape.dataset.untranslatedName == modelShape || shape.dataset.untranslatedName == model?._shape?.value) {
				shape.checked = true;
				this.updateInput(shape);
				var event = new Event('change');
				shape.dispatchEvent(event);
				shapeFound = true;
			}
		});

		if(!shapeFound) {
			return;
		}
		this.updateDimension('a', model);
		this.updateDimension('b', model);
		this.updateDimension('c', model);
		this.updateDimension('d', model);

		this.updateSelect('fold_location', model);
		this.updateSelect('strap_location', model);
	},
	updateDimension(dimension_letter, model) {
		var dimension_string = `_dimension_${dimension_letter}`;
		if(!model[dimension_string]) {
			return;
		}
		var dimension_input = document.querySelector(`#dimension-${dimension_letter}`);
		dimension_input.value = model[dimension_string]['value'] == null ? model[dimension_string] : model[dimension_string]['value'];
		this.updateInput(dimension_input);
	},
	updateSelect(select_name, model) {
		const property_name = `_${select_name}`;
		if(!model[property_name]) {
			return 0;
		}
		const select_input = document.querySelector(`#${select_name.replaceAll('_','-')}`);
		const new_value = model[property_name]['value'] == null ? model[property_name] : model[property_name]['value'];
		var selected_option = select_input.querySelector(`option[data-untranslated="${new_value.toLowerCase()}"]`);
		var selected_option_value = selected_option ? selected_option.value : "";
		select_input.value = selected_option_value;
		this.updateInput(select_input);
		var event = new Event('change');
		select_input.dispatchEvent(event);
		return 1;
	},
	recalculateTotalPrice() {
		const configuratorSelectedVariant = document.querySelector('input:checked[name="configurator_variant"]');

		var selectedVariantPrice = configuratorSelectedVariant.getAttribute('data-configurator-variant-price'); // set price on page load
		var checkedOptionPrice = document.querySelectorAll('input:checked[data-configurator-option-price]');

		var totalPrice = parseInt(selectedVariantPrice); // Reset total price to variant price
		const totalPriceDisplay = document.querySelectorAll('.configurator-total-price');

		checkedOptionPrice.forEach(input => {
			const inputType = input.getAttribute('data-configurator-type') || input.getAttribute('data-configurator-multi-type');
			if(inputType == 'upsell_packages') {
				return;
			}
			if(input.classList.contains('js-ignore-price')) {
				return;
			}
			const optionPrice = parseInt(input.getAttribute('data-configurator-option-price'));

			totalPrice += optionPrice;
		});

		// Add in values of selects
		let selectInput = document.querySelector('select[data-configurator-select-price]');
		if (selectInput) {
			const selectOptionPrice = selectInput.options[selectInput.selectedIndex].getAttribute('data-configurator-option-price');
			if (selectOptionPrice) {
				const selectPriceValue = parseInt(selectOptionPrice);
				totalPrice += selectPriceValue;
			}
		}

		let numberInputs = document.querySelectorAll('input[type=number][data-configurator-option-price]');
		let largest_price = 0;
		numberInputs.forEach((input) => {
			const numberOptionPrice = input.getAttribute('data-configurator-option-price');
			if (numberOptionPrice) {
				const numberPriceValue = parseInt(numberOptionPrice);
				if(largest_price < numberPriceValue) {
					largest_price = numberPriceValue;
				};
			}
		})

		totalPrice += largest_price;

		totalPriceDisplay.forEach((price) => {
			price.textContent = (totalPrice / 100).toFixed(2);
		});

		// If no options are checked, then calculate the total price without any options
		if (checkedOptionPrice.length === 0) {
			totalPriceDisplay.forEach((price) => {
				price.textContent = (totalPrice / 100).toFixed(2);
			});
		}
	},
	calculateTotalPrice() {

		// Calculate variant price on step 1
		let selectedVariantPrice;
		const configuratorSelectedVariant = document.querySelector('input:checked[name="configurator_variant"]');

		selectedVariantPrice = configuratorSelectedVariant.getAttribute('data-configurator-variant-price'); // set price on page load

		const configuratorVariantInputs = document.querySelectorAll('input[name="configurator_variant"]');
		configuratorVariantInputs.forEach(radio => {
			radio.addEventListener('change', () => {
				selectedVariantPrice = radio.getAttribute('data-configurator-variant-price'); // price if variant changes
				calculateTotalPrice(); // Recalculate total price when variant changes
			});
		});

		function calculateTotalPrice() {
			// Format the initial variant price, and display total price
			let totalPrice = parseInt(selectedVariantPrice);
			const totalPriceDisplay = document.querySelectorAll('.configurator-total-price');

			totalPriceDisplay.forEach((price) => {
				price.textContent = (totalPrice / 100).toFixed(2);
			});

			let selectWithPrice = document.querySelector('.configurator-field__skirt-length');
			selectWithPrice.removeEventListener('change', coverConfigurator.recalculateTotalPrice);
			selectWithPrice.addEventListener('change', coverConfigurator.recalculateTotalPrice);

			// Call the recalculateTotalPrice function initially to set the correct total price
			coverConfigurator.recalculateTotalPrice();
		}

		calculateTotalPrice();
	},
	captureDisplayAndSubmitSelectedInputs() {

		// Capture and generate JSON object for all multi select and single select inputs in the Configurator
		const configuratorInputs = document.querySelectorAll('[data-configurator-type], [data-configurator-multi-type]');
		configuratorInputs.forEach(input => {
			input.addEventListener('change', () => { this.updateInput(input) });
		});

		const removeOriginal = () => {
			var updates = {};
	
			this.editKeys.forEach((key) => {
				updates[`${key}`] = 0;
			})
	
			const body = JSON.stringify({
				updates
			});
	
			fetch(`${routes.cart_update_url}`, { ...fetchConfig(), ...{ body } })
			.then((response) => {
				return response.text();
			})
			.then((state) => {
				var parsedState = JSON.parse(state);
				if(parsedState.error) {
					console.error(parsedState.error);
					return;
				}
				addToCart();
			});
		}

		const addToCart = () => {
			const selectedVariant = document.querySelector(
				".configurator_variant:checked"
			);
			var cover_id = Date.now();
			var properties = { 
				_cover_id: cover_id, 
				_configurator_type: this.configuratorData._configurator_type 
			};
			var items = [];
			for (var key in this.configuratorData) {
				if (Array.isArray(this.configuratorData[key])) {
					this.configuratorData[key].forEach((element) => {
						if(key == "upsell_packages") {  
							if(!properties[`_${key}`]) {
								properties[`_${key}`] = [];
							}

							properties[`_${key}`].push(element.id);
							return;
						}

						items.push({
							id: element.id,
							quantity: 1,
							selling_plan: element.sellingPlan ?? null,
							properties: {
								_cover_id: cover_id,
								_step: element.step
							},
						});
					});
					continue;
				}

				if (this.configuratorData[key].id && this.configuratorData[key].value != this.configuratorData[key].id) {
					items.push({
						id: this.configuratorData[key].id,
						quantity: 1,
						selling_plan: this.configuratorData[key].sellingPlan ?? null,
						properties: {
							_cover_id: cover_id,
							_step: this.configuratorData[key].step
						},
					});
					continue;
				}

				if(key == '_brand' && !this.configuratorData['_model']) {
					continue;
				}

				if(key == '_model' && !this.configuratorData['_brand']) {
					continue;
				}

				if(typeof this.configuratorData[key] == 'string') {
					properties[key] = this.configuratorData[key];
					continue;
				}

				properties[key] = this.configuratorData[key].value 
			}

			items.push({
				id: selectedVariant.value,
				quantity: 1,
				selling_plan: selectedVariant.sellingPlan ?? null,
				properties: properties,
			});

			var addObj = { items: items, attributes: { createdInStorefront: 'true' } };

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
					if (parsedState.error) {
						//error handling
						return;
					}
					if(parsedState.message) {
						return;
					}
					sessionStorage.removeItem('configuratorData');
					window.location.href = window.routes.cart_url;
				})
				.catch((error) => {
					console.error(error);
				})
		};

		const step4ContinueButtons = document.querySelectorAll('.configurator-content__continue--btn.is-step-4');
		step4ContinueButtons.forEach((button) => {
			button.addEventListener('click', () => {
              if(button.classList.contains('protection-plan')){
                const protectionPlanModal = document.getElementById('protection_plan_modal');
              }else{
				if(this.editKeys.length > 1) {
					removeOriginal();
					return;
				}
				addToCart();
              }
			});	
		});

		document.querySelectorAll('.configurator-content__continue--btn.add-protection-plan').forEach((button) => {
			button.addEventListener('click', () => {
				var selectedPlan = document.querySelector('.js-protection-plan:checked');
				this.configuratorData["protection-plan"] = {
					id: selectedPlan.value,
					value: selectedPlan.dataset.configuratorTitle,
					step: "4",
					sellingPlan: selectedPlan.dataset.configuratorSellingPlan
				}
				addToCart();
			})
		});
	},
	updateCartDrawers() {
		for(var i = 1; i <= this.step; i++) {
			const cartDrawers = document.querySelectorAll(`.configurator-steps__reveal.is-step-${i}`);
			cartDrawers.forEach(drawer => {
				const list = this.createCartDrawerList(i);
				drawer.innerHTML = '';
				drawer.appendChild(list);
			});	
		}
	},
	createCartDrawerList(step) {
		const list = document.createElement('ul');
		var dimension_flag = false;
		for (const type in this.configuratorData) {
			if(!this.drawerContentByStep[step - 1].includes(type)) {
				continue;
			}

			if (type.includes('dimension')) {
				if(dimension_flag) {
					continue;
				}

				const listItem = this.generateCartDrawerInnerTextDimensions();
				list.appendChild(listItem);
				dimension_flag = true;
				continue;
			}
			
			if (Array.isArray(this.configuratorData[type])) {
				this.configuratorData[type].forEach(item => {
					const listItem = this.generateCartDrawerInnerText(item);
					list.appendChild(listItem);
				});
				continue;
			}

			const listItem = this.generateCartDrawerInnerText(this.configuratorData[type], this.cartTitles[type]);
			list.appendChild(listItem);
		}
		return list;
	},
	generateCartDrawerInnerTextDimensions() {
		const list_item = document.createElement('li');
		const span_item = document.createElement('span');
		var display_value = ''
		this.dimensions.forEach((dimension) => {
			const dimension_object = this.configuratorData[`_dimension_${dimension}`];
			if(!dimension_object || !dimension_object.value) {
				return;
			}

			display_value += `x${dimension_object.value}`;
		});

		display_value = display_value.replace('x', '');
		span_item.innerText = display_value;
		list_item.appendChild(span_item);

		if(!this.configuratorData.size) {
			return list_item;
		}

		const input = document.querySelector(`#${this.configuratorData.size.value}`);
		return this.getDisplayPriceForCartDrawer(input, list_item);
	},
	generateCartDrawerInnerText(item, title = '') {
		const list_item = document.createElement('li');
		const span_item = document.createElement('span');
		const display_value = `${title}${JSON.stringify(item.value).replace(/"/g, '')}`;
		span_item.innerText = display_value;
		list_item.appendChild(span_item);
		if(!item.id) {
			return list_item;
		}

		const input = document.querySelector(`input[data-configurator-id='${item.id}']`) 
		|| document.querySelector(`option[data-configurator-id="${item.id}"]`);
		return this.getDisplayPriceForCartDrawer(input, list_item);
	},
	getDisplayPriceForCartDrawer(input, list_item) {
		if(!input) {
			return list_item;
		}

		const display_price = input.dataset.configuratorOptionPrice;
		if(!display_price || display_price == "0.00") {
			return list_item;
		}

		const strong_item = document.createElement('strong');
		strong_item.innerText = `+${display_price}`;
		strong_item.classList.add('float-right');
		list_item.appendChild(strong_item);

		return list_item;
	},
	// an object in the format {[parent product]: [array of child products]}
	upgradeVariantCombinedProducts() {
		return Object.fromEntries(
			[
				...document.querySelectorAll(
					".configurator-content input[data-configurator-multi-type='upgrades_addons'][data-configurator-variants]"
				),
			].map((input) => [
				input.dataset.configuratorId,
				input.dataset.configuratorVariants
					.split(",")
					.map((variantId) => variantId.trim())
					.filter((variantId) => variantId),
			])
		);
	},
	updateInput(input) {
		const inputType = input.getAttribute('data-configurator-type') || input.getAttribute('data-configurator-multi-type');
		const inputId = input.getAttribute('data-configurator-id') || input.querySelector('option:checked')?.getAttribute('data-configurator-id');
		const inputStep = input.getAttribute('data-configurator-step') || 2;

		const upgradeVariantCombinedProducts = this.upgradeVariantCombinedProducts();

		var inputValue = input.value;
		var inputSellingPlan = input.dataset.configuratorSellingPlan ?? "";
		if (input.getAttribute('data-configurator-multi-type')) {
			if (!this.configuratorData[inputType]) {
				this.configuratorData[inputType] = [];
			}

			const affiliatedVariants = upgradeVariantCombinedProducts[input.dataset.configuratorId];
			// if this is a combo that combines other variants and the user selects it, then mark the child variants as disabled and unchecked
			if(affiliatedVariants && !input.disabled) {
				affiliatedVariants.forEach((variantId) => {
					document
						.querySelectorAll(`[data-package-all-variant-ids*='${variantId}']`)
						.forEach((affiliatedProduct) => {
							var alreadyInCart = this.configuratorData.upgrades_addons.findIndex((addon) => affiliatedProduct.dataset.packageAllVariantIds.includes(addon.id));
							if(alreadyInCart != -1) {
								this.configuratorData.upgrades_addons.splice(alreadyInCart, 1);
							}

							var affiliatedInput = affiliatedProduct.querySelector('input');
							affiliatedInput.checked = input.checked;
							if(input.checked) {
								affiliatedProduct.classList.add('is-disabled');
								affiliatedInput.setAttribute('disabled', true);
								affiliatedInput.classList.add('js-ignore-price');
							} else {
								affiliatedProduct.classList.remove('is-disabled');
								affiliatedInput.removeAttribute('disabled');
								affiliatedInput.classList.remove('js-ignore-price');
							}
					})
				})
			}

			// if there is any parent bundle where all the children are selected, select the parent and unselect and disable the children
			const variantsThatIncludeThisAsAChild = Object.entries(upgradeVariantCombinedProducts)
				.filter(([parentVariantId, children]) => children.includes(input.dataset.configuratorId))
				.map(([parentVariantId]) => parentVariantId);
			const variantsWithAllChildrenSelected = variantsThatIncludeThisAsAChild.filter(variantId => upgradeVariantCombinedProducts[variantId].every(
				childId => document.querySelector(`[data-configurator-id="${childId}"]`).checked
			));
			// don't run if all the parents are disabled (for example, another bundle that takes higher precedence already selected the child items and disabled the parent)
			if (variantsWithAllChildrenSelected.length && variantsWithAllChildrenSelected.some(parentId => !document.querySelector(`[data-configurator-id="${parentId}"]`).disabled)) {
				for (const parentVariantId of variantsWithAllChildrenSelected) {
					const parentInput = document.querySelector(`[data-configurator-id="${parentVariantId}"]`);
					if (parentInput.disabled) {
						continue;
					}

					parentInput.checked = true;
					const parentIndex = this.configuratorData.upgrades_addons.findIndex(item => item.id === inputId);
					if (parentIndex === -1) {
						this.configuratorData.upgrades_addons.push({
							id: parentVariantId,
							value: parentInput.value,
							step: inputStep
						});
					}
	
					for (const childVariantId of upgradeVariantCombinedProducts[parentVariantId]) {
						document
							.querySelectorAll(`[data-package-all-variant-ids*='${childVariantId}']`)
							.forEach((productContainer) => {
								const checkbox = productContainer.querySelector('input[type=checkbox]');
								checkbox.disabled = true;
								checkbox.checked = true;
								checkbox.classList.add('js-ignore-price');
	
								productContainer.classList.add('is-disabled');
								
	
								const index = this.configuratorData.upgrades_addons.findIndex(item => item.id === childVariantId);
								if (index !== -1) {
									this.configuratorData.upgrades_addons.splice(index, 1);
								}
							})
					}
				}

				this.cacheConfiguratorData();
				this.updateCartDrawers();
				this.recalculateTotalPrice();

				return;
			}

			if(!input.checked) {
				const index = this.configuratorData[inputType].findIndex(item => item.id === inputId);
				if (index !== -1) {
					this.configuratorData[inputType].splice(index, 1);
				}
				this.cacheConfiguratorData();
				this.updateCartDrawers();
				this.recalculateTotalPrice();
				return;
			}

			if(this.configuratorData[inputType].find((data) => data.id == inputId)) {
				this.cacheConfiguratorData();
				this.updateCartDrawers();
				this.recalculateTotalPrice();
				return;
			}

			if(input.dataset.configuratorAllVariantIds) {
				let alreadyInCart = this.configuratorData.upgrades_addons.findIndex((addon) => input.dataset.configuratorAllVariantIds.includes(addon.id));
				if(alreadyInCart != -1) {
					this.configuratorData.upgrades_addons.splice(alreadyInCart, 1);
				}
			}

			this.configuratorData[inputType].push({
				id: inputId,
				value: inputValue,
				step: inputStep,
				sellingPlan: inputSellingPlan
			});
		} else {
			if(inputType == "_shape") {
				this.configuratorData[inputType] = {
					value: inputValue,
					id: null,
					step: inputStep,
					sellingPlan: inputSellingPlan
				};
				this.updateDimensionMeta();
				this.updateCartDrawers();
				this.recalculateTotalPrice();
				return;
			}

			if(inputType.includes('dimension')) {
				if(input.value) {
					var value = parseFloat(input.value);
					if(value) {
						input.value = value.toFixed(2);
						inputValue = input.value;
					}
					if(!input.getAttribute('disabled') && !input.dataset.formula) {
						this.updateDimensionFormulas();
					}
				}
				this.updateDimensionSizePrice();
			}

			if (inputType === '_main_product') {
				  this.configuratorData._variant_title = {
				    step: 1, value: input.dataset.configuratorTitle
				  }
				}

			if(input.type == "checkbox" && !input.checked) {
				delete this.configuratorData[inputType];
			}
			else {
				this.configuratorData[inputType] = {
					value: inputValue,
					id: inputId,
					step: inputStep,
					sellingPlan: inputSellingPlan
				};
			}
		}
		this.cacheConfiguratorData();
		this.updateCartDrawers();
		this.recalculateTotalPrice();
	},
	updateDimensionFormulas() {
		var values = {
			a: 0,
			b: 0,
			c: 0,
			d: 0
		};
		this.dimensions.forEach((item) => {
			const value = document.querySelector(`#dimension-${item}`).value;
			if(value) {
				values[item] = value;
			}
		});
		this.dimensions.forEach((item) => {
			const input = document.querySelector(`#dimension-${item}`);
			if(input.dataset.formula) {
				var result = eval(
					input.dataset.formula
					.replace('A', values.a)
					.replace('B', values.b)
					.replace('C', values.c)
					.replace('D', values.d));
				input.value = result;
				this.updateInput(input);
			}
		});
	},
	updateDimensionSizePrice() {
		const shapeJson = document.querySelector('[data-shape-json-id="' + this.configuratorData._shape.value.replaceAll(' ', '_') + '"]');
		const shapeOptions = JSON.parse(shapeJson.textContent);
		var selected_dimension = '';
		var variant_id = null;
		var variant_price = 0;
		var disable_continuation = false;
		for(var i = 0; i < this.dimensions.length; i++) {
			const dimension = this.dimensions[i];
			const dimensionInput = document.querySelector(`#dimension-${dimension}`);
			const errorMsgDimension = document.querySelector(`#error-msg-dimension-${dimension}`);
			const step2ContinueButtons = document.querySelectorAll('.configurator-content__continue--btn.is-step-2');
			var dimensionValue = 0;
			if(parseFloat(dimensionInput.value)) {
				dimensionValue = parseFloat(dimensionInput.value);
			}

			const dimensionRange = shapeOptions[`shape_dimension_${dimension}_ranges`];
			dimensionRange.forEach((range) => {
				const range_low = parseFloat(range.low);
				const range_high = parseFloat(range.high);
				const range_price = parseFloat(range.price);
				var current_variant_price = parseFloat(variant_price);
				if(isNaN(range_low) || isNaN(range_high)) {
					return;
				}

				if(isNaN(current_variant_price)) {
					current_variant_price = 0;
				}

				if(disable_continuation) {
					return;
				}

				if (dimensionValue < range_low) {
					return;
				}

				if(dimensionValue > range_high) {
					return;
				}

				if(range.disable_continuation == "true") {
					console.log("value", dimensionValue);
					console.log("dimension", dimension);
					console.log("range", range);
					disable_continuation = true;
					errorMsgDimension.innerHTML = range.message;
					errorMsgDimension.tabIndex = -1;
					errorMsgDimension.focus();
					step2ContinueButtons.forEach((button) => button.setAttribute('disabled', true));
					step2ContinueButtons.forEach((button) => button.classList.add('disabled'));
					document.querySelectorAll('.configurator-steps__edit').forEach((button) => {
						button.setAttribute('disabled', true);
						button.classList.add('is-disabled');
					})
					return;
				} else {
					step2ContinueButtons.forEach((button) => button.removeAttribute('disabled', true));
					step2ContinueButtons.forEach((button) => button.classList.remove('disabled'));
					document.querySelectorAll('.configurator-steps__edit').forEach((button) => {
						button.removeAttribute('disabled');
						button.classList.remove('is-disabled');
					})
				}

				if(range.message) {
					errorMsgDimension.innerHTML = range.message;
					errorMsgDimension.tabIndex = -1;
				} else {
					errorMsgDimension.innerHTML = '';
					errorMsgDimension.tabIndex = 0;
				}

				if(isNaN(range_price) || parseFloat(variant_price) > range_price) {
					if(selected_dimension != dimension) {
						dimensionInput.setAttribute('data-configurator-option-price', "0");
					}
					return;
				}

				variant_price = range_price;
				variant_id = range.id;
				selected_dimension = dimension;
				dimensionInput.setAttribute('data-configurator-option-price', range.price);
			});
		}

		if(variant_id) {
			this.configuratorData['size'] = {
				value: `dimension-${selected_dimension}`,
				id: variant_id,
				step: 2
			};
		} else {
			delete this.configuratorData['size'];
		}
		coverConfigurator.recalculateTotalPrice();
	},
	updateDimensionMeta() {
		const shapeJson = document.querySelector('[data-shape-json-id="' + this.configuratorData._shape.value.replaceAll(' ', '_') + '"]');
		if(!shapeJson){return}
		const shapeOptions = JSON.parse(shapeJson.textContent);
		const brand = this.configuratorData['_brand'];
		const model = this.configuratorData['_model'];
		let modelObject = null;
		if(brand && brand.value && model && model.value) {
			modelObject = this.lookupModel(brand.value, model.value);
		}
		for(var i = 0; i < this.dimensions.length; i++) {
			const dimension = this.dimensions[i];
			const dimensionInput = document.querySelector(`#dimension-${dimension}`);
			const errorMsgDimension = document.querySelector(`#error-msg-dimension-${dimension}`);
			errorMsgDimension.innerHTML = '';
			dimensionInput.setAttribute('data-configurator-option-price', "0");
			if(modelObject && modelObject._shape == this.configuratorData._shape.value) {
				this.updateDimension(dimension, modelObject)
			} else {
				dimensionInput.value = 0;
			}
			// Set Min/Max
			var min = 1000;
			var max = -1;
			shapeOptions[`shape_dimension_${dimension}_ranges`].forEach((range) => {
				if(parseFloat(range.low) < min) {
					min = parseFloat(range.low);
				}
				if(parseFloat(range.high) > max) {
					max = parseFloat(range.high);
				}
			});
			if(min != 1000) {
				dimensionInput.setAttribute('min', min);
			}
			if(max != -1) {
				dimensionInput.setAttribute('data-max', max);
			}
			// Set Formula
			var formula = shapeOptions[`shape_dimension_${dimension}_formula`];
			dimensionInput.setAttribute('data-formula', formula);
			if(formula) {
				dimensionInput.setAttribute('disabled', true);
			} else {
				dimensionInput.removeAttribute('disabled');
			}
			this.updateInput(dimensionInput);
		}
	},
	cacheConfiguratorData() {
		sessionStorage.setItem('configuratorData', JSON.stringify(this.configuratorData));
	},
	fetchCachedConfiguratorData() {
		var dataString = sessionStorage.getItem('configuratorData');
		if(!dataString) {
			return null;
		}
		return JSON.parse(dataString);
	},
	filterUpgrades() {
		const filterTriggerButtons = document.querySelectorAll('.configurator-upgrade-filters .filter-trigger');
		const allUpgrades = document.querySelectorAll('.upgrade-promos__upgrade');

		filterTriggerButtons.forEach(button => {

			button.addEventListener('click', () => {
				filterTriggerButtons.forEach(btn => {
					btn.classList.remove('is-active');
				});
				const filterType = button.getAttribute('data-filter-type');
				button.classList.add('is-active');

				allUpgrades.forEach(upgrade => {
					if (upgrade.getAttribute('data-filter-type').includes(filterType)) {
						upgrade.classList.remove('is-hidden');
					} else {
						upgrade.classList.add('is-hidden');
					}
				});
			});

			const viewAllBtn = document.querySelector('[data-filter-type="view-all"]');
			viewAllBtn.addEventListener('click', () => {
				viewAllBtn.classList.add('is-active');
				allUpgrades.forEach(upgrade => {
					upgrade.classList.remove('is-hidden');
				});
			});
		});
	},
	upsellPackageLogic() {
		const upsellPackageInputs = document.querySelectorAll('[data-package-products]');

		upsellPackageInputs.forEach(package => {
			const availableUpgrades = document.querySelectorAll('[data-package-all-variant-ids]');
			const packageProducts = package.getAttribute('data-package-products').split(',');
			const availableUpgradesArray = Array.from(availableUpgrades).map(upgrade => upgrade.getAttribute('data-package-all-variant-ids'));
			const packageProductsArray = packageProducts.map(productId => productId.trim());

			if (packageProductsArray.every(productId => availableUpgradesArray.includes(productId))) {
				// Display the current upsell package
				package.closest('.promo-cards__card.is-upsell').style.display = 'flex';
			} else {
				// Hide the current upsell package
				// package.closest('.promo-cards__card.is-upsell').style.display = 'none';
			}

			package.addEventListener('change', () => {
				const packageProducts = package.getAttribute('data-package-products').split(',');
				const upgradeProducts = document.querySelectorAll('[data-package-all-variant-ids]');

				const upgradeVariantCombinedProducts = this.upgradeVariantCombinedProducts();
				const bundlesFullyContainedWithinThisUpgrade = Object.fromEntries(Object.entries(upgradeVariantCombinedProducts).filter(([parentId, childIds]) => childIds.length && childIds.every(childId => packageProducts.includes(childId))));

				if (package.checked) {
					// if there are any bundles where ALL of their child products are contained in the upgrade, disable them and deselect them
					Object.keys(bundlesFullyContainedWithinThisUpgrade).forEach((bundleId) => {
						const input = document.querySelector(`[data-configurator-id="${bundleId}"]`);
						input.disabled = true;
						input.checked = false;
						input.classList.add('js-ignore-price');

						const promoCard = input.closest('.upgrade-promos__upgrade');
						promoCard.classList.add('is-disabled');
					});

					upgradeProducts.forEach(upgrade => {
						const variantIds = upgrade.getAttribute('data-package-all-variant-ids').split(',');
						var productInput = upgrade.querySelector('input');
						var foundVariant = variantIds.find(variant => packageProducts.includes(variant));
						if (!foundVariant)
							return;

						upgrade.querySelector('.promo-cards__indicator').classList.add('is-active');
						productInput.checked = true;
						productInput.disabled = true;
						upgrade.classList.add('is-disabled');
						var productSelect = upgrade.querySelector('.promo-cards__select');
						if(productSelect) {
							productSelect.value = foundVariant;
							var event = new Event('change');
							productSelect.dispatchEvent(event);
						}
						var discount = package.dataset.configuratorDiscountAmount;
						if(package.dataset.configuratorDiscountType == "Percentage") {
							discount = productInput.dataset.configuratorOriginalOptionPrice * (package.dataset.configuratorDiscountAmount / 100);
						}
						productInput.dataset.configuratorOptionPrice = `${Math.ceil(productInput.dataset.configuratorOriginalOptionPrice - discount)}`;
						var event = new Event('change');
						productInput.dispatchEvent(event);
						productInput.classList.remove('js-ignore-price');
					});
				} else {
					upgradeProducts.forEach(upgrade => {
						const variantIds = upgrade.getAttribute('data-package-all-variant-ids').split(',');
						var productInput = upgrade.querySelector('input');
						var foundVariant = variantIds.find(variant => packageProducts.includes(variant));
						if (!foundVariant)
							return;
						upgrade.querySelector('.promo-cards__indicator').classList.remove('is-active');
						productInput.checked = false;
						productInput.disabled = false;
						upgrade.classList.remove('is-disabled');
						productInput.dataset.configuratorOptionPrice = `${productInput.dataset.configuratorOriginalOptionPrice}`;
						var event = new Event('change');
						productInput.dispatchEvent(event);
					});

					// if there are any bundles where ALL of their child products are contained in the upgrade, re-allow them to be selected
					Object.keys(bundlesFullyContainedWithinThisUpgrade).forEach((bundleId) => {
						const input = document.querySelector(`[data-configurator-id="${bundleId}"]`);
						input.disabled = false;
						input.checked = false;
						input.classList.remove('js-ignore-price');

						const promoCard = input.closest('.upgrade-promos__upgrade');
						promoCard.classList.remove('is-disabled');
					});
				}
			});
		});
	},
	buildConfiguratorDisplayAndInputs() {
		const configuratorShapeInputs = document.querySelectorAll('input[name="configurator_shape"]');

		// Shape
		configuratorShapeInputs.forEach(input => {
			input.addEventListener('change', () => {
				const selectedShape = input.getAttribute('data-shape-image');
				const shapeSlots = document.querySelectorAll('.configurator-display__shape');
				shapeSlots.forEach(shapeSlot => {
					shapeSlot.innerHTML = `<img src="${selectedShape}" alt="Cover Shape">`;
				});
			});
		});

		// Material/Color
		const configuratorMaterialInputs = document.querySelectorAll('input[name="vinyl_color"]');
		configuratorMaterialInputs.forEach(input => {
			input.addEventListener('change', () => {
				const selectedMaterial = input.getAttribute('data-material-image');
				const materialSlots = document.querySelectorAll('.configurator-display__material');
				materialSlots.forEach(materialSlot => {
					materialSlot.innerHTML = `<img src="${selectedMaterial}" alt="Cover Material">`;
				});
			});
		});

		// Parse JSON object for shape inputs
		configuratorShapeInputs.forEach(input => {
			input.addEventListener('change', () => {
				const strapOptionImageSlot = document.querySelector('#cover-strap-options-image');
				const currentShape = input.getAttribute('data-configurator-id');
				const shapeJson = document.querySelector('[data-shape-json-id="' + currentShape + '"]');
				const shapeOptions = JSON.parse(shapeJson.textContent);
				const foldImageSlots = document.querySelectorAll('.configurator-display__fold-direction');
				const strapLocationImageSlots = document.querySelectorAll('.configurator-display__strap-location');

				strapOptionImageSlot.innerHTML = `<img src="" alt="">`;

				// Conditionally show or hide dimensions fields based on the shape
				const dimensionA = document.querySelector('#cover-dimension-a');
				const dimensionB = document.querySelector('#cover-dimension-b');
				const dimensionC = document.querySelector('#cover-dimension-c');
				const dimensionD = document.querySelector('#cover-dimension-d');

				if (shapeOptions.shape_dimension_a != 'true') {
					dimensionA.style.display = 'none';
				} else {
					dimensionA.style.display = 'flex';
				}
				if (shapeOptions.shape_dimension_b != 'true') {
					dimensionB.style.display = 'none';
				} else {
					dimensionB.style.display = 'flex';
				}
				if (shapeOptions.shape_dimension_c != 'true') {
					dimensionC.style.display = 'none';
				} else {
					dimensionC.style.display = 'flex';
				}
				if (shapeOptions.shape_dimension_d != 'true') {
					dimensionD.style.display = 'none';
				} else {
					dimensionD.style.display = 'flex';
				}

				// Fold directions: populate fold directions select with an option for each based on the current shape
				const coverFoldSelect = document.querySelector('#fold-location');
				const coverStrapSelect = document.querySelector('#strap-location');
				function clearFoldDirections() {
					coverFoldSelect.innerHTML = `
					<option value="">${coverFoldSelect.dataset.selectText}</option>
					`;
				}
				clearFoldDirections();
				function clearStrapLocations() {
					coverStrapSelect.innerHTML = `
					<option value="">${coverStrapSelect.dataset.selectText}</option>
					`;
					var event = new Event('change');
					coverStrapSelect.dispatchEvent(event);
				}
				clearStrapLocations();

				const foldLocationLabel = document.querySelector('label[for="fold-location"]');
				const foldLocationSelect = document.querySelector('#fold-location');
				const foldErrorMsg = document.querySelector('#error-msg-fold-direction');
				const strapLocationLabel = document.querySelector('label[for="strap-location"]');
				const strapLocationSelect = document.querySelector('#strap-location');
				const strapErrorMsg = document.querySelector('#error-msg-strap-location');

				if (shapeOptions.fold_directions.length === 0) {
					foldLocationLabel.style.display = 'none';
					foldLocationSelect.style.display = 'none';
					foldErrorMsg.style.display = 'none';
					strapLocationLabel.style.display = 'none';
					strapLocationSelect.style.display = 'none';
					strapErrorMsg.style.display = 'none';
				} else {
					foldLocationLabel.style.display = 'block';
					foldLocationSelect.style.display = 'block';
					foldErrorMsg.style.display = 'block';
					strapLocationLabel.style.display = 'block';
					strapLocationSelect.style.display = 'block';
					strapErrorMsg.style.display = 'block';
					shapeOptions.fold_directions.forEach(direction => {
						const option = document.createElement('option');
						option.value = direction.option_select_name;
						option.textContent = direction.option_select_name;;
						option.dataset.untranslated = direction.untranslated_option_select_name;
						coverFoldSelect.appendChild(option);
					});
					foldImageSlots.forEach(imageSlot => {
						imageSlot.innerHTML = '';
					});
					strapLocationImageSlots.forEach(imageSlot => {
						imageSlot.innerHTML = '';
					});
				}

				// Fold directions: update the image rendering area based on the selected fold direction
				coverFoldSelect.addEventListener('change', () => {
					if(!coverFoldSelect.value) {
						foldImageSlots.forEach(imageSlot => {
							imageSlot.innerHTML = '';
						});
						return;
					}
					const selectedFoldDirection = coverFoldSelect.value;
					const selectedFoldDirectionImage = shapeOptions.fold_directions.find(direction => direction.option_select_name === selectedFoldDirection);
					if(!selectedFoldDirectionImage) {
						return;
					}
					foldImageSlots.forEach(foldImageSlot => {
						foldImageSlot.innerHTML = `<img src="${selectedFoldDirectionImage.image}" alt="Cover Fold Direction">`;
					});
				});

				// Strap location: populate the select for strap locations based on the currently selected Fold Direction
				coverFoldSelect.addEventListener('change', () => {
					clearStrapLocations();
					const selectedFoldDirection = coverFoldSelect.value;
					const selectedFoldDirectionData = shapeOptions.fold_directions.find(direction => direction.option_select_name === selectedFoldDirection);
					if(!selectedFoldDirectionData) {
						return;
					}
					const strapLocations = selectedFoldDirectionData.strap_locations;
					strapLocations.forEach(location => {
						const option = document.createElement('option');
						option.value = location.option_select_name;
						option.textContent = location.option_select_name;
						option.setAttribute('data-strap-location-img', location.image);
						option.setAttribute('data-untranslated', location.option_select_name.toLowerCase());
						coverStrapSelect.appendChild(option);
					});
				});

				// Strap location: update the image rendering area based on the selected fold direction
				coverStrapSelect.addEventListener('change', () => {
					if(!coverStrapSelect.value) {
						strapLocationImageSlots.forEach(imageSlot => {
							imageSlot.innerHTML = '';
						});
						return;
					}
					const selectedStrapLocationImg = coverStrapSelect.options[coverStrapSelect.selectedIndex].getAttribute('data-strap-location-img');
					strapLocationImageSlots.forEach(slot => {
						slot.innerHTML = `<img src="${selectedStrapLocationImg}" alt="Cover Strap Location">`;
					});
				});


				// Strap option image: update the image based on the selected Fold Direction and display it inside the container slot
				coverFoldSelect.addEventListener('change', () => {
					const selectedFoldDirection = coverFoldSelect.value;
					const selectedFoldDirectionData = shapeOptions.fold_directions.find(direction => direction.option_select_name === selectedFoldDirection);
					if(!selectedFoldDirectionData) {
						return;
					}
					const optionImage = selectedFoldDirectionData.strap_option_image;
					strapOptionImageSlot.innerHTML = `<img src="${optionImage}" alt="Cover Strap Option Reference">`;
				});

			});
		});

		// Detect shape change and modify displayed upgrades on step 4
		const shapeInputs = document.querySelectorAll('input[name="configurator_shape"]');
		shapeInputs.forEach(input => {
			input.addEventListener('change', () => {
				const selectedShape = input.value;

				let shapeUpgrades = document.querySelectorAll('[data-shape]');

				shapeUpgrades.forEach(upgrade => {
					if (selectedShape == upgrade.getAttribute('data-shape')) {
						upgrade.classList.remove('hidden');
					} else {
						upgrade.classList.add('hidden');
					}
				});
				checkVisibleAccessories();
			});
		});

		function checkVisibleAccessories() {
			const visibleAccessories = document.querySelectorAll('.js-accessory:not(.hidden)');
			if (visibleAccessories.length > 0) {
				document.querySelector('#accessories_heading')?.classList?.remove('hidden');
				return;
			}
			document.querySelector('#accessories_heading')?.classList?.add('hidden');
		}

		function updateStrapHelper() {
			const helper = document.getElementById('strap-location-helper');
			const shapeInput = document.querySelector('input[name="configurator_shape"]:checked');
			const select     = document.getElementById('strap-location');
			
			let text = '';
			if (shapeInput && select.value) {
				const shape = shapeInput.value;
				const loc   = select.value;
				const key   = loc === 'A' ? 'A' : (loc === 'B' || loc === 'C')	? 'B_C'	: null;		  

				if (key && window.strapLocationMessages[shape]?.[key]) {
					text = window.strapLocationMessages[shape][key];
				}
			}
			helper.textContent = text;

			if (text) {
				helper.style.display = 'block';
			} else {
				helper.style.display = 'none';
			}
		}
		
		document.getElementById('strap-location').addEventListener('change', updateStrapHelper);
		document.querySelectorAll('input[name="configurator_shape"]').forEach(radio => radio.addEventListener('change', updateStrapHelper));		  
		updateStrapHelper();

	},
	displaySelectedOptions() {

		// Shapes
		const shapeOptionDisplay = document.querySelector('.configurator-selected.is-shape');
		const shapeOptionSelectedDisplay = document.querySelector('.configurator-selected__selected.is-shape');
		const shapeInputs = document.querySelectorAll('input[name="configurator_shape"]');

		shapeInputs.forEach(input => {
			input.addEventListener('change', () => {
				shapeOptionDisplay.style.display = 'block';
				shapeOptionSelectedDisplay.textContent = input.value;
			});
		});

		// Material/Color
		const materialOption1Display = document.querySelector('.configurator-selected.is-color-1');
		const materialOption1SelectedDisplay = document.querySelector('.configurator-selected__selected.is-color-1');
		const material1Inputs = document.querySelectorAll('.vinyl-colors-1');

		const materialOption2Display = document.querySelector('.configurator-selected.is-color-2');
		const materialOption2SelectedDisplay = document.querySelector('.configurator-selected__selected.is-color-2');
		const material2Inputs = document.querySelectorAll('.vinyl-colors-2');

		material1Inputs.forEach(input => {
			input.addEventListener('change', () => {
				materialOption1Display && (materialOption1Display.style.display = 'block');
				materialOption2Display && (materialOption2Display.style.display = 'none');
				materialOption1SelectedDisplay && (materialOption1SelectedDisplay.textContent = input.value);
			});
		});

		material2Inputs.forEach(input => {
			input.addEventListener('change', () => {
				materialOption2Display && (materialOption2Display.style.display = 'block');
				materialOption1Display && (materialOption1Display.style.display = 'none');
				materialOption2SelectedDisplay && (materialOption2SelectedDisplay.textContent = input.value);
			});
		});

	},
	tabletHoverNavigation() {
		const tabletNavs = document.querySelectorAll('.configurator-steps.is-desktop.is-tablet');
		tabletNavs.forEach(tabletNav => {
			tabletNav.addEventListener('mouseover', () => {
				tabletNav.classList.remove('is-condensed');
			});
		});
		tabletNavs.forEach(tabletNav => {
			tabletNav.addEventListener('mouseout', () => {
				tabletNav.classList.add('is-condensed');
			});
		});
	},
	checkFirstOptionOptions1() {
		const options1Inputs = document.querySelectorAll('input[name="options_1"]');
		options1Inputs.forEach((input, index) => {
			if (index === 0) {
				input.checked = true;
				const event = new Event('change');
				input.dispatchEvent(event);
			} else {
				input.checked = false;
			}
		});
	}
};

document.addEventListener('DOMContentLoaded', function() {
	coverConfigurator.init();
 });

function preventArrowKeyChange(e) {
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        e.preventDefault();
    }
}