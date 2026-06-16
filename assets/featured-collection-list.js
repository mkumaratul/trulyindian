/**
 *  @class
 *  @function FeaturedCollectionList
 */

if (!customElements.get('featured-collection-list')) {
  class FeaturedCollectionList extends HTMLElement {
    connectedCallback() {
      this.images = this.querySelectorAll('.featured-collection-list--img');
      this.buttons = Array.from(this.querySelectorAll('.featured-collection-list--button'));
      this.activeImage = this.querySelector('.featured-collection-list--img.active');
      this.activeButton = this.querySelector('.featured-collection-list--button.active');

      this.addEventListener('mouseover', (e) => {
        const button = e.target.closest('.featured-collection-list--button');
        if (button) {
          this.onHover(button);
        }
      });

      if (Shopify.designMode) {
        this.addEventListener('shopify:block:select', (e) => {
          this.onHover(e.target);
        });
      }

      if (document.body.classList.contains('animations-true') && typeof gsap !== 'undefined') {
        this.prepareAnimations();
      }
    }
    prepareAnimations() {
      gsap.timeline({
        scrollTrigger: {
          trigger: this.querySelector('.featured-collection-list--inner--content'),
          start: "top 70%"
        }
      }).fromTo(this.buttons, {
        opacity: 0
      }, {
        opacity: 1,
        duration: 0.5 + this.buttons.length * 0.1,
        stagger: 0.1
      });
    }
    onHover(button) {
      const index = this.buttons.indexOf(button);
      if (index === -1) return;

      this.activeImage?.classList.remove('active');
      this.activeButton?.classList.remove('active');

      this.activeImage = this.images[index];
      this.activeButton = button;

      this.activeImage?.classList.add('active');
      button.classList.add('active');
    }
  }
  customElements.define('featured-collection-list', FeaturedCollectionList);
}
