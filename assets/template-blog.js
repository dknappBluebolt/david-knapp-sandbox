class TagFilter extends HTMLElement {
	constructor() {
		super();
	  }

	  connectedCallback() {
        this.querySelectorAll('button')
            .forEach((button) => button.addEventListener('click', (event) => { this.updateTagFilter(event) }));
	  }

      updateTagFilter(event) {
        var tag = event.target.dataset.tag;
        if(!tag) {
            return;
        }

        if(tag == "all") {
            
        }

      }
}

customElements.define('tag-filter', TagFilter);