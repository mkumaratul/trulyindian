if (!customElements.get('variant-selects')) {

  /**
   *  @class
   *  @function VariantSelects
   */
  class VariantSelects extends HTMLElement {
    constructor() {
      super();
      this.sticky = this.dataset.sticky;
      this.updateUrl = this.dataset.updateUrl === 'true';
      this.isDisabledFeature = this.dataset.isDisabled;
      this.addEventListener('change', this.onVariantChange);
      this.other = Array.from(document.querySelectorAll('variant-selects')).filter((selector) => {
        return selector != this;
      });
      this.productWrapper = this.closest('.thb-product-detail');
      if (this.productWrapper) {
        this.productSlider = this.productWrapper.querySelector('.product-images') ? this.productWrapper.querySelector('.product-images') : this.productWrapper.querySelector('.product-quick-images');
        this.thumbnails = this.productWrapper.querySelector('.product-thumbnail-container');
        this.hideVariants = this.productSlider.dataset.hideVariants === 'true';
      }

      this.addEventListener('mousedown', (e) => {
        if (e.target.tagName === 'LABEL') {
          const scrollY = window.scrollY;
          requestAnimationFrame(() => window.scrollTo({ top: scrollY, behavior: 'instant' }));
        }
      });
    }

    connectedCallback() {
      this.updateOptions();
      this.updateMasterId();
      this.setDisabled();
      this.setImageSet();
    }

    onVariantChange() {
      this.updateOptions();
      this.toggleAddButton(true, '', false);
      this.updatePickupAvailability();
      this.removeErrorMessage();
      this.updateVariantText();

      this.renderVariantInfo();

      this.updateOther();
      dispatchCustomEvent('product:variant-change', {
        variant: this.currentVariant,
        sectionId: this.dataset.section
      });
    }

    updateOptions() {
      this.fieldsets = Array.from(this.querySelectorAll('fieldset'));
      this.options = [];
      this.fieldsets.forEach((fieldset, i) => {
        if (fieldset.querySelector('select')) {
          this.options.push(fieldset.querySelector('select').value);
        } else if (fieldset.querySelectorAll('input').length) {
          this.options.push(fieldset.querySelector('input:checked').value);
        }
      });
    }
    updateVariantText() {
      const fieldsets = Array.from(this.querySelectorAll('fieldset'));
      fieldsets.forEach((item, i) => {
        let label = item.querySelector('.form__label__value');
        if (label) {
          label.innerHTML = this.options[i];
        }
      });
    }
    updateMasterId() {
      const span = this.querySelector(`#SelectedVariant-${this.dataset.section}`);
      if (!span) return;
      this.currentVariant = {
        id: parseInt(span.dataset.variantId, 10) || null,
        available: span.dataset.available === 'true',
        featured_media: span.dataset.featuredMediaId ? { id: parseInt(span.dataset.featuredMediaId, 10) } : null
      };
    }

    updateOther() {
      if (this.dataset.updateUrl === 'false') {
        return;
      }
      if (this.other.length) {
        let fieldsets = this.other[0].querySelectorAll('fieldset'),
          fieldsets_array = Array.from(fieldsets);
        this.options.forEach((option, i) => {
          if (fieldsets_array[i].querySelector('select')) {
            fieldsets_array[i].querySelector(`select`).value = option;
          } else if (fieldsets_array[i].querySelectorAll('input').length) {
            fieldsets_array[i].querySelector(`input[value="${option}"]`).checked = true;
          }
        });
        this.other[0].updateOptions();
        this.other[0].updateMasterId();
        this.other[0].updateVariantText();
        this.other[0].setDisabled();
      }
    }

    updateMedia() {
      if (!this.currentVariant) return;
      if (!this.currentVariant.featured_media) return;
      if (!this.productSlider) return;
      let mediaId = `#Slide-${this.dataset.section}-${this.currentVariant.featured_media.id}`;
      let activeMedia = this.productSlider.querySelector(mediaId);

      if (this.thumbnails) {
        this.setActiveMediaSlider(mediaId, `#Thumb-${this.dataset.section}-${this.currentVariant.featured_media.id}`, this.productSlider);
      } else {
        this.setActiveMedia(activeMedia);
      }

    }
    setActiveMedia(activeMedia) {

      this.productSlider.querySelectorAll('[data-media-id]').forEach((element) => {
        element.classList.remove('is-active');
      });

      this.setImageSetMedia();

      activeMedia.classList.add('is-active');

      activeMedia.parentElement.prepend(activeMedia);

      if (!this.sticky) {
        window.setTimeout(() => {
          if (window.innerWidth > 1068) {
            let header_h = activeMedia.parentElement.offsetTop - parseInt(getComputedStyle(document.documentElement).getPropertyValue('--header-height')),
              scroll_obj = {
                left: 0,
                behavior: 'instant'
              };

            if (header_h > 0) {
              scroll_obj.top = header_h;
            }
            window.scrollTo(scroll_obj);
          }
          activeMedia.parentElement.scrollTo({
            left: 0,
            behavior: 'instant'
          });
        });
      }
    }
    setActiveMediaSlider(mediaId, thumbId, productSlider) {
      let flkty = Flickity.data(productSlider),
        activeMedia = productSlider.querySelector(mediaId);

      if (flkty && this.hideVariants) {
        if (productSlider.querySelector('.product-images__slide.is-initial-selected')) {
          productSlider.querySelector('.product-images__slide.is-initial-selected').classList.remove('is-initial-selected');
        }
        [].forEach.call(productSlider.querySelectorAll('.product-images__slide-item--variant'), function (el) {
          el.classList.remove('is-active');
        });
        if (this.thumbnails) {
          if (this.thumbnails.querySelector('.product-thumbnail.is-initial-selected')) {
            this.thumbnails.querySelector('.product-thumbnail.is-initial-selected').classList.remove('is-initial-selected');
          }
          [].forEach.call(this.thumbnails.querySelectorAll('.product-images__slide-item--variant'), function (el) {
            el.classList.remove('is-active');
          });
        }

        activeMedia.classList.add('is-active');
        activeMedia.classList.add('is-initial-selected');

        this.setImageSetMedia();

        if (this.thumbnails) {
          let activeThumb = this.thumbnails.querySelector(thumbId);

          activeThumb.classList.add('is-active');
          activeThumb.classList.add('is-initial-selected');
        }

        productSlider.reInit(this.imageSetIndex);
        productSlider.selectCell(mediaId);

      } else if (flkty) {
        productSlider.selectCell(mediaId);
      }

    }

    updateURL() {
      if (!this.currentVariant || this.dataset.updateUrl === 'false') return;
      window.history.replaceState({}, '', `${this.dataset.url}?variant=${this.currentVariant.id}`);
    }

    updateShareUrl() {
      const shareButton = document.getElementById(`Share-${this.dataset.section}`);
      if (!shareButton) return;
      shareButton.updateUrl(`${window.shopUrl}${this.dataset.url}?variant=${this.currentVariant.id}`);
    }

    updateVariantInput() {
      const productForms = document.querySelectorAll(`#product-form-${this.dataset.section}, #product-form-installment`);
      productForms.forEach((productForm) => {
        const input = productForm.querySelector('input[name="id"]');
        input.value = this.currentVariant.id;
        input.dispatchEvent(new Event('change', {
          bubbles: true
        }));
      });
    }

    updatePickupAvailability() {
      const pickUpAvailability = document.querySelector('.pickup-availability-wrapper');

      if (!pickUpAvailability) return;

      if (this.currentVariant && this.currentVariant.available) {
        pickUpAvailability.fetchAvailability(this.currentVariant.id);
      } else {
        pickUpAvailability.removeAttribute('available');
        pickUpAvailability.innerHTML = '';
      }
    }

    removeErrorMessage() {
      const section = this.closest('section');
      if (!section) return;

      const productForm = section.querySelector('product-form');
      if (productForm) productForm.handleErrorMessage();
    }

    getSectionsToRender() {
      return [`price-${this.dataset.section}`, `price-${this.dataset.section}--sticky`, `product-image-${this.dataset.section}--sticky`, `inventory-${this.dataset.section}`, `sku-${this.dataset.section}`, `quantity-${this.dataset.section}`];
    }

    getSelectedValueIds() {
      return this.fieldsets.map((fieldset) => {
        if (fieldset.querySelector('select')) {
          return fieldset.querySelector('select').selectedOptions[0]?.dataset.valueId;
        }
        return fieldset.querySelector('input:checked')?.dataset.valueId;
      }).filter(Boolean);
    }

    renderVariantInfo() {
      const ids = this.getSelectedValueIds();
      if (!ids.length) return;

      const scrollY = window.scrollY;

      fetch(`${this.dataset.url}?option_values=${ids.join(',')}&section_id=${this.dataset.section}`)
        .then((response) => response.text())
        .then((responseText) => {
          const html = new DOMParser().parseFromString(responseText, 'text/html');

          // 1. Resolve variant from hidden span
          const span = html.getElementById(`SelectedVariant-${this.dataset.section}`);
          if (span && parseInt(span.dataset.variantId, 10)) {
            this.currentVariant = {
              id: parseInt(span.dataset.variantId, 10),
              available: span.dataset.available === 'true',
              featured_media: span.dataset.featuredMediaId ? { id: parseInt(span.dataset.featuredMediaId, 10) } : null
            };
          } else {
            this.currentVariant = null;
          }

          // 2. Sync data-available onto current DOM inputs (drives setDisabled)
          const sourceSelects = html.getElementById(`variant-selects-${this.dataset.section}`);
          if (sourceSelects) {
            sourceSelects.querySelectorAll('[data-value-id]').forEach((sourceEl) => {
              const vid = sourceEl.dataset.valueId;
              const avail = sourceEl.dataset.available;
              [this, ...this.other].forEach((el) => {
                const localEl = el.querySelector(`[data-value-id="${vid}"]`);
                if (localEl) localEl.dataset.available = avail;
              });
            });
          }

          // 3. Update price, inventory, sku sections
          this.getSectionsToRender().forEach((id) => {
            const destination = document.getElementById(id);
            const source = html.getElementById(id);
            if (source && destination) destination.innerHTML = source.innerHTML;
            if (id.includes('price') && destination) destination.classList.remove('visibility-hidden');
          });

          // 4. Apply updated state
          if (!this.currentVariant) {
            this.toggleAddButton(true, '', true);
            this.setUnavailable();
            window.scrollTo({ top: scrollY, behavior: 'instant' });
            return;
          }
          this.setDisabled();
          this.updateVariantInput();
          if (this.updateUrl) this.updateURL();
          this.toggleAddButton(!this.currentVariant.available, window.theme.variantStrings.soldOut);
          this.updateMedia();
          window.scrollTo({ top: scrollY, behavior: 'instant' });
        });
    }

    toggleAddButton(disable = true, text = false, modifyClass = true) {
      const productForm = document.getElementById(`product-form-${this.dataset.section}`);
      if (!productForm) return;

      const productTemplate = productForm.closest('.product-form').getAttribute('template');
      const submitButtons = document.querySelectorAll('.single-add-to-cart-button');

      if (!submitButtons) return;

      submitButtons.forEach((submitButton) => {
        const submitButtonText = submitButton.querySelector('.single-add-to-cart-button--text');

        if (!submitButtonText) return;

        if (disable) {
          submitButton.setAttribute('disabled', 'disabled');
          if (text) submitButtonText.textContent = text;
        } else {
          submitButton.removeAttribute('disabled');
          submitButton.classList.remove('loading');

          if (productTemplate?.includes('pre-order')) {
            submitButtonText.textContent = window.theme.variantStrings.preOrder;
          } else {
            submitButtonText.textContent = window.theme.variantStrings.addToCart;
          }
        }
      });

      if (!modifyClass) return;
    }

    setUnavailable() {
      const submitButtons = document.querySelectorAll('.single-add-to-cart-button');
      const price = document.getElementById(`price-${this.dataset.section}`);
      const price_fixed = document.getElementById(`price-${this.dataset.section}--sticky`);

      submitButtons.forEach((submitButton) => {
        const submitButtonText = submitButton.querySelector('.single-add-to-cart-button--text');
        if (!submitButton) return;
        submitButtonText.textContent = window.theme.variantStrings.unavailable;
        submitButton.classList.add('sold-out');
      });
      if (price) price.classList.add('visibility-hidden');
      if (price_fixed) price_fixed.classList.add('visibility-hidden');
    }

    setDisabled() {
      if (this.isDisabledFeature != 'true') return;

      this.fieldsets.forEach((fieldset) => {
        if (fieldset.querySelector('select')) {
          fieldset.querySelectorAll('option').forEach((opt) => {
            opt.disabled = opt.dataset.available === 'false';
          });
        } else {
          fieldset.querySelectorAll('input').forEach((input) => {
            input.classList.toggle('is-disabled', input.dataset.available === 'false');
          });
        }
      });
      return true;
    }

    getImageSetName(variant_name) {
      return variant_name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-$/, '').replace(/^-/, '');
    }

    setImageSet() {
      if (!this.productSlider) return;

      let dataSetEl = this.productSlider.querySelector('[data-set-name]');
      if (dataSetEl) {
        this.imageSetName = dataSetEl.dataset.setName;
        this.imageSetIndex = this.querySelector('.product-form__input[data-handle="' + this.imageSetName + '"]').dataset.index;
        this.dataset.imageSetIndex = this.imageSetIndex;
        this.setImageSetMedia();
      }
    }

    setImageSetMedia() {
      if (!this.imageSetIndex) {
        return;
      }

      const optionPosition = parseInt(this.imageSetIndex.replace('option', ''), 10) - 1;
      let setValue = this.getImageSetName(this.options[optionPosition]);
      let group = this.imageSetName + '_' + setValue;
      let selected_set_images = this.productWrapper.querySelectorAll(`.product-images__slide[data-set-name="${this.imageSetName}"]`),
        selected_set_thumbs = this.productWrapper.querySelectorAll(`.product-thumbnail[data-set-name="${this.imageSetName}"]`);
      if (this.hideVariants) {
        // Product images
        this.productWrapper.querySelectorAll('.product-images__slide').forEach(thumb => {
          if (thumb.dataset.group && thumb.dataset.group !== group) {
            thumb.classList.remove('is-active');
          }
        });
        selected_set_images.forEach(thumb => {
          thumb.classList.toggle('is-active', thumb.dataset.group === group);
        });

        // Product thumbnails
        this.productWrapper.querySelectorAll('.product-thumbnail').forEach(thumb => {
          if (thumb.dataset.group && thumb.dataset.group !== group) {
            thumb.classList.remove('is-active');
          }
        });
        selected_set_thumbs.forEach(thumb => {
          thumb.classList.toggle('is-active', thumb.dataset.group === group);
        });
      }

    }

  }
  customElements.define('variant-selects', VariantSelects);

  /**
   *  @class
   *  @function VariantRadios
   */
  class VariantRadios extends VariantSelects {
    constructor() {
      super();
    }

    updateOptions() {
      const fieldsets = Array.from(this.querySelectorAll('fieldset'));
      this.options = fieldsets.map((fieldset) => {
        return Array.from(fieldset.querySelectorAll('input')).find((radio) => radio.checked).value;
      });
    }
  }

  customElements.define('variant-radios', VariantRadios);
}

if (!customElements.get('product-slider')) {
  /**
   *  @class
   *  @function ProductSlider
   */
  class ProductSlider extends HTMLElement {
    constructor() {
      super();

    }
    connectedCallback() {
      this.pagination = this.parentElement.querySelector('.product-images-buttons');
      this.sliderItems = this.querySelectorAll('[id^="Slide-"]');
      this.video_containers = this.querySelectorAll('.product-single__media-external-video--play');

      // Start Gallery
      let observer = new MutationObserver(() => {
        this.setupProductGallery();
      });

      observer.observe(this, {
        attributes: true,
        attributeFilter: ['class'],
        childList: true,
        characterData: false
      });

      this.setupProductGallery();

      // Start Pagination
      if (this.pagination) {
        this.setupPagination();
        this.resizeObserver = new ResizeObserver(entries => this.onPaginationResize());
        this.resizeObserver.observe(this);
        this.addEventListener('scroll', this.updatePagination.bind(this));
      }
    }
    setupProductGallery() {
      if (!this.querySelectorAll('.product-single__media-zoom').length) {
        return;
      }

      this.setEventListeners();
    }
    buildItems(activeImages) {
      let images = activeImages.map((item) => {
        let activelink = item.querySelector('.product-single__media-zoom');
        return {
          src: activelink.getAttribute('href'),
          msrc: activelink.dataset.msrc,
          w: activelink.dataset.w,
          h: activelink.dataset.h,
          title: activelink.getAttribute('title')
        };
      });
      return images;
    }
    setEventListeners() {
      let activeImages = Array.from(this.querySelectorAll('.product-images__slide--image')).filter(element => element.clientWidth > 0),
        items = this.buildItems(activeImages),
        captionEl = this.dataset.captions,
        pswpElement = document.querySelectorAll('.pswp')[0],
        options = {
          maxSpreadZoom: 2,
          loop: false,
          allowPanToNext: false,
          closeOnScroll: false,
          showHideOpacity: false,
          arrowKeys: true,
          history: false,
          captionEl: captionEl,
          fullscreenEl: false,
          zoomEl: false,
          shareEl: false,
          counterEl: true,
          arrowEl: true,
          preloaderEl: true
        };

      let openPswp = function (e, link, options, pswpElement, items) {
        let parent = link.closest('.product-images__slide');
        let i = activeImages.indexOf(parent);
        options.index = parseInt(i, 10);
        options.getThumbBoundsFn = () => {
          const thumbnail = link.closest('.product-single__media'),
            pageYScroll = window.scrollY || document.documentElement.scrollTop,
            rect = thumbnail.getBoundingClientRect();
          return {
            x: rect.left,
            y: rect.top + pageYScroll,
            w: rect.width
          };
        };
        if (typeof PhotoSwipe !== 'undefined') {
          let pswp = new PhotoSwipe(pswpElement, PhotoSwipeUI_Default, items, options);

          pswp.listen('firstUpdate', () => {
            pswp.listen('parseVerticalMargin', function (item) {
              item.vGap = {
                top: 50,
                bottom: 50
              };
            });
          });
          pswp.init();
        }
        e.preventDefault();
      };
      this.querySelectorAll('.product-single__media-zoom').forEach(function (link) {
        let thumbnail = link.closest('.product-single__media');
        let clone = link.cloneNode(true);
        thumbnail.append(clone);
        link.remove();
        clone.addEventListener('click', (e) => openPswp(e, clone, options, pswpElement, items));
      });

      this.video_containers.forEach((container) => {
        container.querySelector('button').addEventListener('click', function () {
          container.setAttribute('hidden', '');
        });
      });
    }
    setupPagination() {
      this.sliderItemsToShow = Array.from(this.sliderItems).filter(element => element.clientWidth > 0);
      if (this.sliderItemsToShow.length < 2) return;

      this.sliderItemOffset = this.sliderItemsToShow[1].offsetLeft - this.sliderItemsToShow[0].offsetLeft;

      this.currentPageElement = this.pagination.querySelector('.slider-counter--current');
      this.pageTotalElement = this.pagination.querySelector('.slider-counter--total');

      this.prevButton = this.pagination.querySelector('button[name="previous"]');
      this.nextButton = this.pagination.querySelector('button[name="next"]');


      this.prevButton.addEventListener('click', this.onPaginationButtonClick.bind(this));
      this.nextButton.addEventListener('click', this.onPaginationButtonClick.bind(this));

      this.updatePagination();
    }
    onPaginationResize() {
      this.sliderItemsToShow = Array.from(this.sliderItems).filter(element => element.clientWidth > 0);

      if (this.sliderItemsToShow.length < 2) return;

      this.sliderItemOffset = this.sliderItemsToShow[1].offsetLeft - this.sliderItemsToShow[0].offsetLeft;
      this.updatePagination();
    }
    onPaginationButtonClick(event) {
      event.preventDefault();
      this.slideScrollPosition = event.currentTarget.name === 'next' ? this.scrollLeft + (1 * this.sliderItemOffset) : this.scrollLeft - (1 * this.sliderItemOffset);
      this.scrollTo({
        left: this.slideScrollPosition
      });
    }
    updatePagination() {
      if (!this.nextButton) return;

      const previousPage = this.currentPage;
      this.currentPage = Math.round(this.scrollLeft / this.sliderItemOffset) + 1;

      if (this.currentPageElement) {
        this.currentPageElement.textContent = this.currentPage;
      }
      if (this.pageTotalElement) {
        this.pageTotalElement.textContent = this.sliderItemsToShow.length;
      }

      if (this.currentPage != previousPage) {
        this.dispatchEvent(new CustomEvent('slideChanged', {
          detail: {
            currentPage: this.currentPage,
            currentElement: this.sliderItemsToShow[this.currentPage - 1]
          }
        }));
      }

      if (this.isSlideVisible(this.sliderItemsToShow[0]) && this.scrollLeft === 0) {
        this.prevButton.setAttribute('disabled', 'disabled');
      } else {
        this.prevButton.removeAttribute('disabled');
      }

      if (this.isSlideVisible(this.sliderItemsToShow[this.sliderItemsToShow.length - 1])) {
        this.nextButton.setAttribute('disabled', 'disabled');
      } else {
        this.nextButton.removeAttribute('disabled');
      }
    }
    isSlideVisible(element, offset = 0) {
      const lastVisibleSlide = this.clientWidth + this.scrollLeft - offset;
      return (element.offsetLeft + element.clientWidth) <= lastVisibleSlide && element.offsetLeft >= this.scrollLeft;
    }
  }
  customElements.define('product-slider', ProductSlider);
}

/**
 *  @class
 *  @function ProductForm
 */
if (!customElements.get('product-form')) {
  customElements.define('product-form', class ProductForm extends HTMLElement {
    constructor() {
      super();
    }
    connectedCallback() {
      this.sticky = this.dataset.sticky;
      this.form = document.getElementById(`product-form-${this.dataset.section}`);
      this.form.querySelector('[name=id]').disabled = false;
      if (!this.sticky) {
        this.form.addEventListener('submit', this.onSubmitHandler.bind(this));
      }
      this.cartNotification = document.querySelector('cart-notification');
      this.body = document.body;

      this.hideErrors = this.dataset.hideErrors === 'true';
    }
    onSubmitHandler(evt) {
      evt.preventDefault();
      if (!this.form.reportValidity()) {
        return;
      }
      const submitButtons = document.querySelectorAll('.single-add-to-cart-button');

      submitButtons.forEach((submitButton) => {
        if (submitButton.classList.contains('loading')) return;
        submitButton.setAttribute('aria-disabled', true);
        submitButton.classList.add('loading');
      });

      this.handleErrorMessage();


      const config = {
        method: 'POST',
        headers: {
          'X-Requested-With': 'XMLHttpRequest',
          'Accept': 'application/javascript'
        }
      };
      let formData = new FormData(this.form);

      formData.append('sections', this.getSectionsToRender().map((section) => section.section));
      formData.append('sections_url', window.location.pathname);
      config.body = formData;

      fetch(`${theme.routes.cart_add_url}`, config)
        .then((response) => response.json())
        .then((response) => {
          if (response.status) {
            dispatchCustomEvent('product:variant-error', {
              source: 'product-form',
              productVariantId: formData.get('id'),
              errors: response.description,
              message: response.message
            });
            if (response.status === 422) {
              document.documentElement.dispatchEvent(new CustomEvent('cart:refresh', {
                bubbles: true
              }));
            }
            this.handleErrorMessage(response.description);
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
          submitButtons.forEach((submitButton) => {
            submitButton.classList.remove('loading');
            submitButton.removeAttribute('aria-disabled');
          });
        });
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



      const productDrawer = document.getElementById('Product-Drawer');
      const cartDrawer = document.getElementById('Cart-Drawer');

      if (productDrawer && productDrawer.contains(this)) {
        OverlayManager.close(productDrawer);
        if (cartDrawer) {
          OverlayManager.open(cartDrawer);
          dispatchCustomEvent('cart-drawer:open');
        }
      } else if (cartDrawer) {
        OverlayManager.open(cartDrawer);
        dispatchCustomEvent('cart-drawer:open');
      }
    }
    getSectionInnerHTML(html, selector = '.shopify-section') {
      return new DOMParser()
        .parseFromString(html, 'text/html')
        .querySelector(selector).innerHTML;
    }
    handleErrorMessage(errorMessage = false) {
      if (this.hideErrors) return;
      this.errorMessageWrapper = this.errorMessageWrapper || this.querySelector('.product-form__error-message-wrapper');
      this.errorMessage = this.errorMessage || this.errorMessageWrapper.querySelector('.product-form__error-message');

      this.errorMessageWrapper.toggleAttribute('hidden', !errorMessage);

      if (errorMessage) {
        this.errorMessage.textContent = errorMessage;
      }
    }
  });
}

/**
 *  @class
 *  @function ProductAddToCartSticky
 */
if (!customElements.get('product-add-to-cart-sticky')) {
  class ProductAddToCartSticky extends HTMLElement {
    constructor() {
      super();

      this.animations_enabled = document.body.classList.contains('animations-true') && typeof gsap !== 'undefined';
    }
    connectedCallback() {
      this.setupObservers();
      this.setupToggle();
    }
    setupToggle() {
      const button = this.querySelector('.product-add-to-cart-sticky--inner'),
        content = this.querySelector('.product-add-to-cart-sticky--content');

      if (this.animations_enabled) {
        const tl = gsap.timeline({
          reversed: true,
          paused: true,
          onStart: () => {
            button.classList.add('sticky-open');
          },
          onReverseComplete: () => {
            button.classList.remove('sticky-open');
          }
        });

        tl
          .set(content, {
            display: 'block',
            height: 'auto'
          }, 'start')
          .from(content, {
            height: 0,
            duration: 0.25
          }, 'start+=0.001');

        button.addEventListener('click', function () {
          tl.reversed() ? tl.play() : tl.reverse();

          return false;
        });
      } else {
        button.addEventListener('click', function () {
          content.classList.toggle('active');
          return false;
        });
      }


    }
    disconnectedCallback() {
      if (this._observer) {
        this._observer.disconnect();
        this._observer = null;
      }
    }
    setupObservers() {
      let _this = this,
        observer = new IntersectionObserver(function (entries) {
          entries.forEach((entry) => {
            if (entry.target === footer) {
              if (entry.intersectionRatio > 0) {
                _this.classList.remove('sticky--visible');
              } else if (entry.intersectionRatio == 0 && _this.formPassed) {
                _this.classList.add('sticky--visible');
              }
            }
            if (entry.target === form) {
              let boundingRect = form.getBoundingClientRect();

              if (entry.intersectionRatio === 0 && window.scrollY > (boundingRect.top + boundingRect.height)) {
                _this.formPassed = true;
                _this.classList.add('sticky--visible');
              } else if (entry.intersectionRatio === 1) {
                _this.formPassed = false;
                _this.classList.remove('sticky--visible');
              }
            }
          });
        }, {
          threshold: [0, 1]
        }),
        form = document.getElementById(`product-form-${this.dataset.section}`),
        footer = document.getElementById('footer');
      _this.formPassed = false;
      this._observer = observer;
      observer.observe(form);
      observer.observe(footer);
    }
  }

  customElements.define('product-add-to-cart-sticky', ProductAddToCartSticky);
}

if (typeof addIdToRecentlyViewed !== "undefined") {
  addIdToRecentlyViewed();
}