/**
 *  @class
 *  @function BackToTop
 */
if (!customElements.get('back-to-top')) {
	class BackToTop extends HTMLElement {

		connectedCallback() {
			this.ticking = false;
			this._onScroll = this.checkVisible.bind(this);
			this._onResize = () => { this.pageHeight = window.innerHeight; };

			this.pageHeight = window.innerHeight;

			this.addEventListener('click', this.onClick);
			this.addEventListener('touchstart', this.onClick, { passive: true });
			window.addEventListener('scroll', this._onScroll, { passive: true });
			window.addEventListener('resize', this._onResize, { passive: true });
		}

		disconnectedCallback() {
			window.removeEventListener('scroll', this._onScroll);
			window.removeEventListener('resize', this._onResize);
		}

		checkVisible() {
			if (this.ticking) return;
			this.ticking = true;
			window.requestAnimationFrame(() => {
				this.classList.toggle('back-to-top--active', window.scrollY > this.pageHeight);
				this.ticking = false;
			});
		}

		onClick() {
			window.scrollTo({
				top: 0,
				left: 0,
				behavior: "smooth"
			});
		}
	}
	customElements.define('back-to-top', BackToTop);
}
