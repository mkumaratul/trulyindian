/**
 *  @class
 *  @function CollectionTabs
 */

if (!customElements.get('collection-tabs')) {
  class CollectionTabs extends HTMLElement {
    constructor() {
      super();
      this._onResize = null;
      this._onBlockSelect = null;
      this._fetchCache = new Map();
      this._fetchPromises = new Map();
    }

    connectedCallback() {
      requestAnimationFrame(() => {
        this.buttons = Array.from(this.querySelectorAll('button'));
        let sectionHeader = this.closest('.section-header');
        this.links = sectionHeader ? Array.from(sectionHeader.querySelectorAll('.linked-to-tab')) : [];
        this.target = this.dataset.target;
        this.slider = document.getElementById(this.target);

        if (!this.slider) return;

        this.productLimit = parseInt(this.slider.dataset.productLimit, 10) || 6;
        this.columnsDesktop = parseInt(this.slider.dataset.columnsDesktop, 10) || 4;
        this.columnsClass = this.getColumnsClass(this.columnsDesktop);

        // Cache items grouped by collection handle
        this.collectionMap = new Map();
        this.allItems = this.slider.querySelectorAll('[data-collection]');
        this.allItems.forEach((item) => {
          let handle = item.dataset.collection;
          if (!this.collectionMap.has(handle)) {
            this.collectionMap.set(handle, []);
          }
          this.collectionMap.get(handle).push(item);
        });

        // Event delegation instead of per-button listeners
        this.addEventListener('click', (event) => {
          let button = event.target.closest('button');
          if (!button) return;
          event.preventDefault();
          let index = this.buttons.indexOf(button);
          if (index === -1) return;
          this.toggleButtons(index);
          this.toggleLinks(index);
          if (button.dataset.collection) {
            this.handleTabClick(button);
          }
        });

        // Debounce resize to avoid excessive Flickity recalculations
        this._onResize = debounce(() => {
          let flkty = this.getFlickity();
          if (flkty) {
            flkty.resize();
          }
        }, 150);
        window.addEventListener('resize', this._onResize);

        if (Shopify.designMode) {
          this._onBlockSelect = (event) => {
            const index = this.buttons.indexOf(event.target);
            if (index !== -1) {
              this.buttons[index].dispatchEvent(new Event('click'));
            }
          };
          this.addEventListener('shopify:block:select', this._onBlockSelect);
        }

        // Lazy-load inactive tabs after page load
        if (!Shopify.designMode) {
          this.prefetchInactiveTabs();
        }
      });
    }

    disconnectedCallback() {
      if (this._onResize) {
        window.removeEventListener('resize', this._onResize);
      }
      if (this._onBlockSelect) {
        this.removeEventListener('shopify:block:select', this._onBlockSelect);
      }
    }

    getFlickity() {
      if (!this.slider) return null;
      return Flickity.data(this.slider) || null;
    }

    toggleButtons(index) {
      this.buttons.forEach((button) => button.classList.remove('active'));
      this.buttons[index].classList.add('active');
    }

    toggleLinks(index) {
      if (this.links.length && this.links[index]) {
        this.links.forEach((link) => link.classList.remove('active'));
        this.links[index].classList.add('active');
      }
    }

    getColumnsClass(columns) {
      switch (columns) {
        case 2: return 'medium-6';
        case 3: return 'medium-4';
        case 4: return 'medium-6 large-3';
        case 5: return 'small-6 medium-4 large-1/5';
        default: return 'medium-6 large-4';
      }
    }

    toggleCollection(handle) {
      if (!this.slider) return;
      let flkty = this.getFlickity();
      let activeItems = this.collectionMap.get(handle);

      // Remove carousel__slide from all, add to active — single pass each
      this.allItems.forEach((item) => item.classList.remove('carousel__slide'));
      if (activeItems) {
        activeItems.forEach((item) => item.classList.add('carousel__slide'));
      }

      if (flkty) {
        flkty.reloadCells();
        flkty.select(0, false, true);
        flkty.resize();
      }
    }

    handleTabClick(button) {
      let handle = button.dataset.collection;
      if (this.collectionMap.has(handle)) {
        this.toggleCollection(handle);
        return;
      }
      // Products not loaded yet — fetch on demand
      let url = button.dataset.collectionUrl;
      if (!url) {
        this.toggleCollection(handle);
        return;
      }
      this.fetchCollection(handle, url).then(() => {
        this.toggleCollection(handle);
      });
    }

    prefetchInactiveTabs() {
      let loadTabs = () => {
        this.buttons.forEach((button, index) => {
          if (index === 0) return;
          let handle = button.dataset.collection;
          let url = button.dataset.collectionUrl;
          if (!handle || !url || this.collectionMap.has(handle)) return;
          this.fetchCollection(handle, url);
        });
      };

      if (document.readyState === 'complete') {
        loadTabs();
      } else {
        window.addEventListener('load', loadTabs, { once: true });
      }
    }

    fetchCollection(handle, collectionUrl) {
      if (this._fetchCache.has(handle)) {
        return Promise.resolve();
      }
      if (this._fetchPromises.has(handle)) {
        return this._fetchPromises.get(handle);
      }

      let fetchUrl = collectionUrl + '?section_id=collection-tabs-ajax';
      let promise = fetch(fetchUrl)
        .then((response) => response.text())
        .then((html) => {
          let parser = new DOMParser();
          let doc = parser.parseFromString(html, 'text/html');
          let items = Array.from(doc.querySelectorAll('[data-collection]')).slice(0, this.productLimit);

          // Insert into the Flickity slider container (or slider root if Flickity not initialized)
          let flickitySlider = this.slider.querySelector('.flickity-slider');
          let container = flickitySlider || this.slider;
          items.forEach((item) => {
            this.columnsClass.split(' ').forEach((cls) => item.classList.add(cls));
            container.appendChild(item);
          });

          // Initialize lazy-loaded images
          container.querySelectorAll('.lazyload').forEach((img) => {
            lazySizes.loader.unveil(img);
          });

          // Update collectionMap and allItems
          if (!this.collectionMap.has(handle)) {
            this.collectionMap.set(handle, []);
          }
          items.forEach((item) => {
            this.collectionMap.get(handle).push(item);
          });
          this.allItems = this.slider.querySelectorAll('[data-collection]');
          this._fetchCache.set(handle, true);
          this._fetchPromises.delete(handle);
        })
        .catch(() => {
          this._fetchPromises.delete(handle);
        });

      this._fetchPromises.set(handle, promise);
      return promise;
    }
  }
  customElements.define('collection-tabs', CollectionTabs);
}
