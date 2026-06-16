/**
 *  @class
 *  @function CartRemove
 */
if (!customElements.get('cart-remove')) {
  class CartRemove extends HTMLElement {
    connectedCallback() {
      this.addEventListener('click', this.onClickHandler.bind(this));
    }
    onClickHandler(event) {
      event.preventDefault();
      const index = this.dataset.index;
      const cartDrawer = this.closest('cart-drawer');
      if (cartDrawer) {
        cartDrawer.updateQuantity(index, '0');
      } else {
        document.dispatchEvent(new CustomEvent('cart:remove', { detail: { index } }));
      }
    }
  }
  customElements.define('cart-remove', CartRemove);
}
