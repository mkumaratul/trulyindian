function debounce(fn, wait) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn.apply(this, args), wait);
  };
}
var dispatchCustomEvent = function dispatchCustomEvent(eventName) {
  var data = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
  var detail = {
    detail: data
  };
  var event = new CustomEvent(eventName, data ? detail : null);
  document.dispatchEvent(event);
};
window.recentlyViewedIds = [];

const OverlayManager = {
  stack: [],
  beforeCloseHandlers: new Map(),

  open(panel) {
    if (!panel || this.stack.includes(panel)) return;
    this.stack.push(panel);
    panel.classList.add('active');
    panel.inert = false;
    document.body.classList.add('open-cc');
    panel.querySelector('.side-panel-close')?.focus();
    dispatchCustomEvent('panel:open', { panel });
  },

  close(panel) {
    if (!panel) return;
    const handler = this.beforeCloseHandlers.get(panel);
    if (handler) {
      handler(() => this._close(panel));
    } else {
      this._close(panel);
    }
  },

  _close(panel) {
    const index = this.stack.indexOf(panel);
    if (index > -1) this.stack.splice(index, 1);
    panel.classList.remove('active');
    panel.inert = true;
    if (!this.stack.length) {
      document.body.classList.remove('open-cc');
    }
    dispatchCustomEvent('panel:closed', { panel });
  },

  closeLast() {
    const panel = this.stack[this.stack.length - 1];
    if (panel) this.close(panel);
  },

  registerBeforeClose(panel, handler) {
    this.beforeCloseHandlers.set(panel, handler);
  },

  isOpen(panel) {
    return this.stack.includes(panel);
  },

  hasOpen() {
    return this.stack.length > 0;
  }
};

/**
 *  @class
 *  @function Quantity
 */
if (!customElements.get('quantity-selector')) {
  class QuantityInput extends HTMLElement {
    constructor() {
      super();
      this.input = this.querySelector('.qty');
      this.step = this.input.getAttribute('step');
      this.changeEvent = new Event('change', {
        bubbles: true
      });
      // Create buttons
      this.subtract = this.querySelector('.minus');
      this.add = this.querySelector('.plus');

      // Add functionality to buttons
      this.subtract.addEventListener('click', () => this.change_quantity(-1 * this.step));
      this.add.addEventListener('click', () => this.change_quantity(1 * this.step));

    }
    connectedCallback() {
      this.classList.add('buttons_added');
      this.validateQtyRules();
    }
    change_quantity(change) {
      // Get current value
      let quantity = Number(this.input.value);

      // Ensure quantity is a valid number
      if (isNaN(quantity)) quantity = 1;

      // Check for min & max
      if (this.input.getAttribute('min') > (quantity + change)) {
        return;
      }
      if (this.input.getAttribute('max')) {
        if (this.input.getAttribute('max') < (quantity + change)) {
          return;
        }
      }
      // Change quantity
      quantity += change;

      // Ensure quantity is always a number
      quantity = Math.max(quantity, 1);

      // Output number
      this.input.value = quantity;

      this.input.dispatchEvent(this.changeEvent);

      this.validateQtyRules();
    }
    validateQtyRules() {
      const value = parseInt(this.input.value);
      if (this.input.min) {
        const min = parseInt(this.input.min);
        this.subtract.classList.toggle('disabled', value <= min);
      }
      if (this.input.max) {
        const max = parseInt(this.input.max);
        this.add.classList.toggle('disabled', value >= max);
      }
    }
  }
  customElements.define('quantity-selector', QuantityInput);
}

/**
 *  @class
 *  @function ProductCard
 */
if (!customElements.get('product-card')) {
  class ProductCard extends HTMLElement {
    constructor() {
      super();
    }
    connectedCallback() {
      this.swatches = this.querySelector('.product-card-swatches');
      this.image = this.querySelector('.product-card--featured-image-link .product-primary-image');
      this.additional_images = this.querySelectorAll('.product-secondary-image');
      this.additional_images_nav = this.querySelectorAll('.product-secondary-images-nav li');
      this.quick_add = this.querySelector('.product-card--add-to-cart-button-simple');
      this.size_options = this.querySelector('.product-card-sizes');

      if (this.swatches) {
        this.enableSwatches(this.swatches, this.image);
      }
      if (this.additional_images) {
        this.enableAdditionalImages();
      }
      if (this.quick_add) {
        this.quick_add.addEventListener('click', this.quickAdd.bind(this));
      }
      if (this.size_options) {
        this.enableSizeOptions();
      }
    }
    enableAdditionalImages() {
      let image_length = this.additional_images.length;
      let images = this.additional_images;
      let nav = this.additional_images_nav;
      let hasNav = nav.length > 0;
      let image_container = this.querySelector('.product-card--featured-image-link');
      let lastIndex = -1;

      const mousemove = function (e) {
        let l = e.offsetX;
        let w = this.getBoundingClientRect().width;
        let sel = Math.floor((l / w) * image_length);

        if (sel === lastIndex || !images[sel]) {
          return;
        }
        if (lastIndex >= 0 && images[lastIndex]) {
          images[lastIndex].classList.remove('hover');
          if (hasNav) {
            nav[lastIndex].classList.remove('active');
          }
        }
        images[sel].classList.add('hover');
        if (hasNav) {
          nav[sel].classList.add('active');
        }
        lastIndex = sel;
      };

      const mouseleave = function () {
        if (lastIndex >= 0 && images[lastIndex]) {
          images[lastIndex].classList.remove('hover');
          if (hasNav) {
            nav[lastIndex].classList.remove('active');
          }
        }
        lastIndex = -1;
      };

      if (image_container) {
        image_container.addEventListener('touchstart', mousemove, {
          passive: true
        });
        image_container.addEventListener('touchmove', mousemove, {
          passive: true
        });
        image_container.addEventListener('touchend', mouseleave, {
          passive: true
        });
        image_container.addEventListener('mouseenter', mousemove, {
          passive: true
        });
        image_container.addEventListener('mousemove', mousemove, {
          passive: true
        });
        image_container.addEventListener('mouseleave', mouseleave, {
          passive: true
        });
      }

      window.addEventListener('load', () => {
        images.forEach((image) => {
          lazySizes.loader.unveil(image);
        });
      });

    }
    enableSwatches(swatches, image) {
      let swatch_list = swatches.querySelectorAll('.product-card-swatch'),
        org_srcset = image ? image.dataset.srcset : '';
      this.color_index = this.swatches.dataset.index;

      window.addEventListener('load', () => {
        swatch_list.forEach((swatch) => {
          let img = new Image();
          img.srcset = swatch.dataset.srcset;
          lazySizes.loader.unveil(img);
        });
      });

      swatch_list.forEach((swatch, index) => {
        swatch.addEventListener('mouseover', () => {
          swatch_list.forEach((el) => {
            el.classList.remove('active');
          });
          if (image) {
            if (swatch.dataset.srcset) {
              image.setAttribute('srcset', swatch.dataset.srcset);
            } else {
              image.setAttribute('srcset', org_srcset);
            }
          }
          if (this.size_options) {
            this.current_options[this.color_index] = swatch.querySelector('span').innerText;
            this.updateMasterId();
          }
          swatch.classList.add('active');
        });
        swatch.addEventListener('click', function (evt) {
          window.location.href = this.dataset.href;
          evt.preventDefault();
        });
      });
    }
    enableSizeOptions() {
      let size_list = this.size_options.querySelectorAll('.product-card-sizes--size'),
        featured_image = this.querySelector('.product-card--featured-image'),
        has_hover = featured_image.classList.contains('thb-hover'),
        size_parent = this.size_options.parentElement;

      this.size_index = this.size_options.dataset.index;

      this.current_options = this.size_options.dataset.options.split(',');

      this.updateMasterId();

      size_parent.addEventListener('mouseenter', () => {
        if (has_hover) {
          featured_image.classList.remove('thb-hover');
        }
      }, {
        passive: true
      });
      size_parent.addEventListener('mouseleave', () => {
        if (has_hover) {
          featured_image.classList.add('thb-hover');
        }
      }, {
        passive: true
      });
      size_list.forEach((size) => {
        size.addEventListener('click', (evt) => {
          evt.preventDefault();
          if (size.classList.contains('is-disabled')) {
            return;
          }
          this.current_options[this.size_index] = size.querySelector('span').innerText;
          this.updateMasterId();
          this.addToCart(this.currentVariant.id, size);
        });
      });
    }
    updateMasterId() {
      this.currentVariant = this.getVariantData().find((variant) => {
        return !variant.options.map((option, index) => {
          return this.current_options[index] === option;
        }).includes(false);
      });
      setTimeout(() => {
        this.setDisabled();
      }, 100);
    }
    getVariantData() {
      this.variantData = this.variantData || JSON.parse(this.querySelector('[type="application/json"]').textContent);
      return this.variantData;
    }
    setDisabled() {
      const variant_data = this.getVariantData();
      if (!variant_data) {
        return true;
      }
      const size_buttons = this.size_options.querySelectorAll('.product-card-sizes--size');

      if (this.currentVariant) {
        const selected_options = this.currentVariant.options.map((value, index) => ({
          value,
          index: `option${index + 1}`
        }));
        const available_options = this.createAvailableOptionsTree(variant_data, selected_options);
        const fieldset_options = Object.values(available_options)[this.size_index];
        if (fieldset_options) {
          size_buttons.forEach((input, input_i) => {
            input.classList.toggle('is-disabled', fieldset_options[input_i].isUnavailable);
          });
        }
      } else {
        size_buttons.forEach((input) => {
          input.classList.add('is-disabled');
        });
      }
      return true;
    }
    createAvailableOptionsTree(variant_data, selected_options) {
      // Reduce variant array into option availability tree
      return variant_data.reduce((options, variant) => {

        // Check each option group (e.g. option1, option2, option3) of the variant
        Object.keys(options).forEach(index => {

          if (variant[index] === null) return;

          let entry = options[index].find(option => option.value === variant[index]);

          if (typeof entry === 'undefined') {
            // If option has yet to be added to the options tree, add it
            entry = {
              value: variant[index],
              isUnavailable: true
            };
            options[index].push(entry);
          }

          // Check how many selected option values match a variant
          const countVariantOptionsThatMatchCurrent = selected_options.reduce((count, {
            value,
            index
          }) => {
            return variant[index] === value ? count + 1 : count;
          }, 0);

          // Only enable an option if an available variant matches all but one current selected value
          if (countVariantOptionsThatMatchCurrent >= selected_options.length - 1) {
            entry.isUnavailable = entry.isUnavailable && variant.available ? false : entry.isUnavailable;
          }

          // Make sure if a variant is unavailable, disable currently selected option
          if ((!this.currentVariant || !this.currentVariant.available) && selected_options.find((option) => option.value === entry.value && index === option.index)) {
            entry.isUnavailable = true;
          }

          // First option is always enabled
          if (index === 'option1') {
            entry.isUnavailable = entry.isUnavailable && variant.available ? false : entry.isUnavailable;
          }
        });

        return options;
      }, {
        option1: [],
        option2: [],
        option3: []
      });
    }
    addToCart(variantId, button) {
      button.classList.add('loading');
      button.setAttribute('aria-disabled', true);

      const formData = new FormData();
      formData.append('id', variantId);
      formData.append('quantity', 1);
      formData.append('sections', this.getSectionsToRender().map((section) => section.section));
      formData.append('sections_url', window.location.pathname);

      fetch(`${theme.routes.cart_add_url}`, {
        method: 'POST',
        headers: {
          'X-Requested-With': 'XMLHttpRequest',
          'Accept': 'application/javascript'
        },
        body: formData
      })
        .then((response) => response.json())
        .then((response) => {
          if (response.status) {
            return;
          }
          this.renderContents(response);
          dispatchCustomEvent('cart:item-added', {
            product: response.hasOwnProperty('items') ? response.items[0] : response
          });
        })
        .catch((e) => {
          console.error(e);
        })
        .finally(() => {
          button.classList.remove('loading');
          button.removeAttribute('aria-disabled');
        });
    }
    quickAdd(evt) {
      evt.preventDefault();
      if (this.quick_add.disabled) {
        return;
      }
      this.addToCart(this.quick_add.dataset.productId, this.quick_add);
    }
    getSectionsToRender() {
      return [{
        id: 'Cart',
        section: 'main-cart',
        selector: '.thb-cart-form'
      },
      {
        id: 'Cart-Drawer',
        section: 'cart-drawer',
        selector: '.cart-drawer'
      },
      {
        id: 'cart-drawer-toggle',
        section: 'cart-bubble',
        selector: '.thb-item-count'
      }];
    }
    renderContents(parsedState) {
      this.getSectionsToRender().forEach((section => {
        if (!document.getElementById(section.id)) {
          return;
        }
        const elementToReplace = document.getElementById(section.id).querySelector(section.selector) || document.getElementById(section.id);
        elementToReplace.innerHTML = this.getSectionInnerHTML(parsedState.sections[section.section], section.selector);

      }));


      const cartDrawer = document.getElementById('Cart-Drawer');
      if (cartDrawer) {
        OverlayManager.open(cartDrawer);
        dispatchCustomEvent('cart-drawer:open');
      }
    }
    getSectionInnerHTML(html, selector = '.shopify-section') {
      return new DOMParser()
        .parseFromString(html, 'text/html')
        .querySelector(selector).innerHTML;
    }
  }
  customElements.define('product-card', ProductCard);
}


/**
 *  @class
 *  @function PanelClose
 */
if (!customElements.get('side-panel-close')) {
  class PanelClose extends HTMLElement {
    connectedCallback() {
      this.cc = document.querySelector('.click-capture');

      this.onClick = () => {
        OverlayManager.closeLast();
      };

      this.addEventListener('click', this.onClick);
      document.addEventListener('panel:close', this.onClick);

      if (!this.cc.hasAttribute('initialized')) {
        this.cc.addEventListener('click', this.onClick);
        this.cc.setAttribute('initialized', '');
      }
    }
  }
  customElements.define('side-panel-close', PanelClose);

  // Product drawer: close images container first, then drawer
  const productDrawer = document.getElementById('Product-Drawer');
  if (productDrawer) {
    OverlayManager.registerBeforeClose(productDrawer, (done) => {
      const container = productDrawer.querySelector('.product-quick-images--container');
      if (container && container.classList.contains('active') && window.innerWidth >= 1069) {
        container.classList.remove('active');
        container.addEventListener('transitionend', () => {
          productDrawer.querySelector('#Product-Drawer-Content').innerHTML = '';
          done();
        }, { once: true });
      } else {
        container?.classList.remove('active');
        productDrawer.querySelector('#Product-Drawer-Content').innerHTML = '';
        done();
      }
    });

    document.addEventListener('panel:open', (e) => {
      if (e.detail.panel === productDrawer) {
        setTimeout(() => {
          productDrawer.querySelector('.product-quick-images--container')?.classList.add('active');
        });
      }
    });
  }

  document.addEventListener('keyup', (e) => {
    if (e.code?.toUpperCase() === 'ESCAPE') {
      OverlayManager.closeLast();
    }
  });
}
/**
 *  @class
 *  @function CartDrawer
 */
if (!customElements.get('cart-drawer')) {
  class CartDrawer extends HTMLElement {

    constructor() {
      super();
    }

    connectedCallback() {
      let button = document.getElementById('cart-drawer-toggle');

      // Add functionality to buttons
      button.addEventListener('click', (e) => {
        e.preventDefault();
        OverlayManager.open(this);
        dispatchCustomEvent('cart-drawer:open');
      });

      document.addEventListener('panel:open', (e) => {
        if (e.detail.panel === this) {
          setTimeout(() => {
            this.querySelector('.product-recommendations--full')?.classList.add('active');
          });
        }
      });

      this.debouncedOnChange = debounce((event) => {
        this.onChange(event);
      }, 300);

      document.addEventListener('cart:refresh', (event) => {
        this.refresh();
      });

      this.addEventListener('change', this.debouncedOnChange.bind(this));

      OverlayManager.registerBeforeClose(this, (done) => {
        const recs = this.querySelector('.product-recommendations--full');
        if (recs && recs.classList.contains('active') && window.innerWidth >= 1069) {
          recs.classList.remove('active');
          recs.addEventListener('transitionend', () => done(), { once: true });
        } else {
          recs?.classList.remove('active');
          done();
        }
      });

    }
    onChange(event) {
      if (event.target.classList.contains('qty')) {
        this.updateQuantity(event.target.dataset.index, event.target.value);
      }
    }
    getSectionsToRender() {
      return [{
        id: 'Cart-Drawer',
        section: 'cart-drawer',
        selector: '.cart-drawer'
      },
      {
        id: 'cart-drawer-toggle',
        section: 'cart-bubble',
        selector: '.thb-item-count'
      }];
    }
    getSectionInnerHTML(html, selector) {
      return new DOMParser()
        .parseFromString(html, 'text/html')
        .querySelector(selector).innerHTML;
    }
    updateQuantity(line, quantity) {
      this.querySelector(`#CartDrawerItem-${line}`)?.classList.add('thb-loading');
      const body = JSON.stringify({
        line,
        quantity,
        sections: this.getSectionsToRender().map((section) => section.section),
        sections_url: window.location.pathname
      });

      dispatchCustomEvent('line-item:change:start', {
        quantity: quantity
      });
      this.querySelector('.product-recommendations--full')?.classList.remove('active');

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

          this.getSectionsToRender().forEach((section => {
            const elementToReplace = document.getElementById(section.id).querySelector(section.selector) || document.getElementById(section.id);

            if (parsedState.sections) {
              elementToReplace.innerHTML = this.getSectionInnerHTML(parsedState.sections[section.section], section.selector);
            }
          }));

          dispatchCustomEvent('line-item:change:end', {
            quantity: quantity,
            cart: parsedState
          });

          this.querySelector(`#CartDrawerItem-${line}`)?.classList.remove('thb-loading');
        });
    }
    refresh() {
      this.querySelector('.product-recommendations--full')?.classList.remove('active');
      let sections = 'cart-drawer,cart-bubble';
      fetch(`${window.location.pathname}?sections=${sections}`)
        .then((response) => {
          return response.text();
        })
        .then((state) => {
          const parsedState = JSON.parse(state);

          this.getSectionsToRender().forEach((section => {
            const elementToReplace = document.getElementById(section.id).querySelector(section.selector) || document.getElementById(section.id);

            elementToReplace.innerHTML = this.getSectionInnerHTML(parsedState[section.section], section.selector);
          }));

        });
    }
  }
  customElements.define('cart-drawer', CartDrawer);
}

/**
 *  @class
 *  @function ResizeSelect
 */
if (!customElements.get('resize-select')) {
  class ResizeSelect extends HTMLElement {
    constructor() {
      super();
    }

    connectedCallback() {
      this.select = this.querySelector('select');
      this.addEventListeners();
    }
    addEventListeners() {
      this.addEventListener('change', this.resizeSelect.bind(this));
      window.addEventListener('load', this.resizeSelect.bind(this));
      const details = this.closest('details');
      if (details) {
        details.addEventListener('toggle', () => {
          if (details.open) this.resizeSelect();
        });
      }
      this.resizeSelect();
    }
    resizeSelect() {
      let tempOption = document.createElement('option');
      tempOption.textContent = this.select.selectedOptions[0].textContent;

      let tempSelect = document.createElement('select');
      tempSelect.style.cssText = 'visibility:hidden;position:fixed;pointer-events:none';
      tempSelect.appendChild(tempOption);
      this.after(tempSelect);

      requestAnimationFrame(() => {
        if (tempSelect.clientWidth > 0) {
          this.select.style.width = `${tempSelect.clientWidth + 10}px`;
        }
        tempSelect.remove();
      });
    }
  }
  customElements.define('resize-select', ResizeSelect);
}



/**
 *  @class
 *  @function QuickView
 */
if (!customElements.get('quick-view')) {
  const quickViewCache = new Map();

  class QuickView extends HTMLElement {
    constructor() {
      super();
    }
    connectedCallback() {
      this.drawer = document.getElementById('Product-Drawer');
      this.addEventListener('click', this.handleClick.bind(this));
    }
    handleClick(e) {
      e.preventDefault();
      let productHandle = this.dataset.productHandle;
      if (!productHandle) {
        return;
      }
      let rootUrl = theme.routes.root_url.replace(/\/+$/, '');
      let href = `${rootUrl}/products/${productHandle}?view=quick-view`;

      if (this.classList.contains('loading')) {
        return;
      }
      this.classList.add('loading');

      // Abort any in-flight quick-view fetch
      if (QuickView.activeController) {
        QuickView.activeController.abort();
      }
      let controller = new AbortController();
      QuickView.activeController = controller;

      // Serve from cache if available
      if (quickViewCache.has(productHandle)) {
        this.classList.remove('loading');
        this.renderQuickView(quickViewCache.get(productHandle), href, productHandle);
        return;
      }

      fetch(href, {
        method: 'GET',
        signal: controller.signal
      })
        .then((response) => {
          if (!response.ok) {
            throw new Error(`Quick view fetch failed: ${response.status}`);
          }
          return response.text();
        })
        .then(text => {
          let parsed = new DOMParser()
            .parseFromString(text, 'text/html')
            .querySelector('#Product-Drawer-Content');

          if (!parsed) {
            throw new Error('Quick view content not found in response');
          }
          let sectionInnerHTML = parsed.innerHTML;
          quickViewCache.set(productHandle, sectionInnerHTML);
          this.renderQuickView(sectionInnerHTML, href, productHandle);
        })
        .catch((error) => {
          if (error.name !== 'AbortError') {
            console.error(error);
          }
        })
        .finally(() => {
          this.classList.remove('loading');
        });
    }
    _reloadScripts(container) {
      let scripts = container.querySelectorAll('script');
      let head = document.head;
      scripts.forEach((oldScript) => {
        let newScript = document.createElement('script');
        Array.from(oldScript.attributes).forEach((attr) => {
          newScript.setAttribute(attr.name, attr.value);
        });
        if (oldScript.src) {
          if (document.querySelector(`script[src="${oldScript.src}"]`)) {
            return;
          }
        } else {
          newScript.textContent = oldScript.textContent;
        }
        if (oldScript.parentNode) {
          oldScript.parentNode.replaceChild(newScript, oldScript);
        } else {
          head.appendChild(newScript);
        }
      });
    }
    renderQuickView(sectionInnerHTML, href, productHandle) {
      if (!sectionInnerHTML) {
        return;
      }
      let drawerContent = this.drawer.querySelector('#Product-Drawer-Content');
      drawerContent.innerHTML = sectionInnerHTML;

      this._reloadScripts(drawerContent);

      requestAnimationFrame(() => {
        if (typeof Shopify !== 'undefined' && Shopify.PaymentButton) {
          Shopify.PaymentButton.init();
        }
        if (window.ProductModel) {
          window.ProductModel.loadShopifyXR();
        }
      });

      OverlayManager.open(this.drawer);

      dispatchCustomEvent('quick-view:open', {
        productUrl: href,
        productHandle: productHandle
      });
      addIdToRecentlyViewed(productHandle);
    }
  }
  QuickView.activeController = null;
  customElements.define('quick-view', QuickView);
}

/**
 *  @class
 *  @function SidePanelContentTabs
 */
if (!customElements.get('side-panel-content-tabs')) {
  class SidePanelContentTabs extends HTMLElement {
    constructor() {
      super();
      this.buttons = this.querySelectorAll('button');
      this.panels = this.parentElement.querySelectorAll('.side-panel-content--tab-panel');
    }
    connectedCallback() {
      this.setupButtonObservers();
    }
    disconnectedCallback() {

    }
    setupButtonObservers() {
      this.buttons.forEach((item, i) => {
        item.addEventListener('click', (e) => {
          this.toggleActiveClass(i);
        });
      });
    }
    toggleActiveClass(i) {
      this.buttons.forEach((button) => {
        button.classList.remove('tab-active');
      });
      this.buttons[i].classList.add('tab-active');

      this.panels.forEach((panel) => {
        panel.classList.remove('tab-active');
      });
      this.panels[i].classList.add('tab-active');
    }
  }

  customElements.define('side-panel-content-tabs', SidePanelContentTabs);
}

/**
 *  @class
 *  @function CollapsibleRow
 */
if (!customElements.get('collapsible-row')) {
  // https://css-tricks.com/how-to-animate-the-details-element/
  class CollapsibleRow extends HTMLElement {
    constructor() {
      super();

      this.details = this.querySelector('details');
      this.summary = this.querySelector('summary');
      this.content = this.querySelector('.collapsible__content');

      // Store the animation object (so we can cancel it if needed)
      this.animation = null;
      // Store if the element is closing
      this.isClosing = false;
      // Store if the element is expanding
      this.isExpanding = false;
    }
    connectedCallback() {
      this.setListeners();
    }
    setListeners() {
      this.querySelector('summary').addEventListener('click', (e) => this.onClick(e));
    }
    instantClose() {
      this.tl.timeScale(10).reverse();
    }
    animateClose() {
      this.tl.timeScale(3).reverse();
    }
    animateOpen() {
      this.tl.timeScale(1).play();
    }
    onClick(e) {
      // Stop default behaviour from the browser
      e.preventDefault();
      // Add an overflow on the <details> to avoid content overflowing
      this.details.style.overflow = 'hidden';
      // Check if the element is being closed or is already closed
      if (this.isClosing || !this.details.open) {
        this.open();
        // Check if the element is being openned or is already open
      } else if (this.isExpanding || this.details.open) {
        this.shrink();
      }
    }
    shrink() {
      // Set the element as "being closed"
      this.isClosing = true;

      // Store the current height of the element
      const startHeight = `${this.details.offsetHeight}px`;
      // Calculate the height of the summary
      const endHeight = `${this.summary.offsetHeight}px`;

      // If there is already an animation running
      if (this.animation) {
        // Cancel the current animation
        this.animation.cancel();
      }

      // Start a WAAPI animation
      this.animation = this.details.animate({
        // Set the keyframes from the startHeight to endHeight
        height: [startHeight, endHeight]
      }, {
        duration: 250,
        easing: 'ease'
      });

      // When the animation is complete, call onAnimationFinish()
      this.animation.onfinish = () => this.onAnimationFinish(false);
      // If the animation is cancelled, isClosing variable is set to false
      this.animation.oncancel = () => this.isClosing = false;
    }

    open() {
      // Apply a fixed height on the element
      this.details.style.height = `${this.details.offsetHeight}px`;
      // Force the [open] attribute on the details element
      this.details.open = true;
      // Wait for the next frame to call the expand function
      window.requestAnimationFrame(() => this.expand());
    }

    expand() {
      // Set the element as "being expanding"
      this.isExpanding = true;
      // Get the current fixed height of the element
      const startHeight = `${this.details.offsetHeight}px`;
      // Calculate the open height of the element (summary height + content height)
      const endHeight = `${this.summary.offsetHeight + this.content.offsetHeight}px`;

      // If there is already an animation running
      if (this.animation) {
        // Cancel the current animation
        this.animation.cancel();
      }

      // Start a WAAPI animation
      this.animation = this.details.animate({
        // Set the keyframes from the startHeight to endHeight
        height: [startHeight, endHeight]
      }, {
        duration: 400,
        easing: 'ease-out'
      });
      // When the animation is complete, call onAnimationFinish()
      this.animation.onfinish = () => this.onAnimationFinish(true);
      // If the animation is cancelled, isExpanding variable is set to false
      this.animation.oncancel = () => this.isExpanding = false;
    }

    onAnimationFinish(open) {
      // Set the open attribute based on the parameter
      this.details.open = open;
      // Clear the stored animation
      this.animation = null;
      // Reset isClosing & isExpanding
      this.isClosing = false;
      this.isExpanding = false;
      // Remove the overflow hidden and the fixed height
      this.details.style.height = this.details.style.overflow = '';
    }
  }
  customElements.define('collapsible-row', CollapsibleRow);
}

/**
 *  @function addIdToRecentlyViewed
 */
function addIdToRecentlyViewed(handle) {

  if (!handle) {
    let product = document.querySelector('.thb-product-detail');

    if (product) {
      handle = product.dataset.handle;
    }
  }
  if (!handle) {
    return;
  }
  if (window.localStorage) {
    let recentIds = window.localStorage.getItem('recently-viewed');
    if (recentIds != 'undefined' && recentIds != null) {
      window.recentlyViewedIds = JSON.parse(recentIds);
    }
  }
  // Remove current product if already in recently viewed array
  var i = window.recentlyViewedIds.indexOf(handle);

  if (i > -1) {
    window.recentlyViewedIds.splice(i, 1);
  }

  // Add id to array
  window.recentlyViewedIds.unshift(handle);

  if (window.localStorage) {
    window.localStorage.setItem('recently-viewed', JSON.stringify(window.recentlyViewedIds));
  }
}

