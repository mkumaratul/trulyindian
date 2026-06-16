if (!customElements.get('cart-notes')) {
  class CartNotes extends HTMLElement {
    connectedCallback() {
      this.toggle = this.querySelector('.order-note-toggle');
      this.content = this.querySelector('.order-note-toggle__content');
      this.notes = this.querySelector('#mini-cart__notes');

      if (!this.toggle || !this.content) return;

      this.toggle.addEventListener('click', () => {
        this.content.classList.add('active');
      });

      this.content.addEventListener('click', (e) => {
        if (e.target.closest('.button, .order-note-toggle__content-overlay')) {
          this.content.classList.remove('active');
          this.saveNotes();
        }
      });
    }

    saveNotes() {
      fetch(`${theme.routes.cart_update_url}.js`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          note: this.notes.value
        })
      });
    }
  }
  customElements.define('cart-notes', CartNotes);
}
