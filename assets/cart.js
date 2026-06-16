/**
 *  @class
 *  @function ThemeCart
 */
if (!customElements.get('theme-cart')) {
  class ThemeCart extends HTMLElement {
    connectedCallback() {
      this.setupEventListeners();
    }
    onChange(event) {
      if (event.target.type == 'number') {
        this.updateQuantity(event.target.dataset.index, event.target.value);
      } else if (event.target.getAttribute('id') == 'CartSpecialInstructions') {
        this.saveNotes();
      }
    }
    saveNotes() {
      fetch(`${theme.routes.cart_update_url}.js`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': `application/json`
        },
        body: JSON.stringify({
          'note': document.getElementById('CartSpecialInstructions').value
        })
      });
    }
    setupEventListeners() {
      document.addEventListener('cart:remove', (event) => {
        this.updateQuantity(event.detail.index, '0');
      });

      this.debouncedOnChange = debounce((event) => {
        this.onChange(event);
      }, 300);

      document.addEventListener('cart:refresh', () => {
        this.refresh();
      });

      this.addEventListener('change', this.debouncedOnChange.bind(this));
    }
    getSectionsToRender() {
      return [{
        id: 'Cart',
        section: 'main-cart',
        selector: '.thb-cart-form'
      },
      {
        id: 'cart-drawer-toggle',
        section: 'cart-bubble',
        selector: '.thb-item-count'
      }];
    }
    displayErrors(line, message) {
      const lineItemError =
        document.getElementById(`Line-item-error-${line}`) || document.getElementById(`CartDrawer-LineItemError-${line}`);
      if (lineItemError) {
        lineItemError.removeAttribute('hidden');
        lineItemError.querySelector('.cart-item__error-text').innerHTML = message;
        this.querySelector(`#CartItem-${line}`).classList.remove('loading');
      }
    }
    getSectionInnerHTML(html, selector) {
      return new DOMParser()
        .parseFromString(html, 'text/html')
        .querySelector(selector).innerHTML;
    }
    updateQuantity(line, quantity) {

      this.classList.add('cart-disabled');
      if (line) {
        this.querySelector(`#CartItem-${line}`).classList.add('loading');
      }

      const body = JSON.stringify({
        line,
        quantity,
        sections: this.getSectionsToRender().map((section) => section.section),
        sections_url: window.location.pathname
      });
      dispatchCustomEvent('line-item:change:start', {
        quantity: quantity
      });
      fetch(`${theme.routes.cart_change_url}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': `application/json`
        },
        ...{
          body
        }
      })
        .then((response) => {
          return response.text();
        })
        .then((state) => {
          const parsedState = JSON.parse(state);


          if (parsedState.errors) {
            this.displayErrors(line, parsedState.errors);
            this.classList.remove('cart-disabled');
            return;
          }

          this.renderContents(parsedState, line, false);

          this.classList.remove('cart-disabled');

          dispatchCustomEvent('line-item:change:end', {
            quantity: quantity,
            cart: parsedState
          });
        });
    }
    refresh() {
      this.classList.add('cart-disabled');

      let sections = 'main-cart';

      fetch(`${window.location.pathname}/?sections=${sections}`)
        .then((response) => {
          return response.text();
        })
        .then((state) => {
          const parsedState = JSON.parse(state);


          if (parsedState.errors) {
            this.displayErrors(line, parsedState.errors);
            this.classList.remove('cart-disabled');
            return;
          }

          this.renderContents(parsedState, false, true);

          this.classList.remove('cart-disabled');
        });
    }
    renderContents(parsedState, line, refresh) {
      this.getSectionsToRender().forEach((section => {
        const elementToReplace = document.getElementById(section.id).querySelector(section.selector) || document.getElementById(section.id);

        if (refresh) {
          if (parsedState[section.section]) {
            elementToReplace.innerHTML = this.getSectionInnerHTML(parsedState[section.section], section.selector);
          }
        } else {
          elementToReplace.innerHTML = this.getSectionInnerHTML(parsedState.sections[section.section], section.selector);
        }

        if (line && this.querySelector(`#CartItem-${line}`)) {
          this.querySelector(`#CartItem-${line}`).classList.remove('loading');
        }
      }));
    }
  }
  customElements.define('theme-cart', ThemeCart);
}
