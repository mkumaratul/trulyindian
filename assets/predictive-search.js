/**
 *  @class
 *  @function PredictiveSearch
 */
class PredictiveSearch {
  constructor() {
    this.container = document.getElementById('Search-Drawer');
    this.form = this.container.querySelector('form.searchform');
    this.button = document.querySelectorAll('.thb-quick-search');
    this.input = this.container.querySelector('input[type="search"]');
    this.defaultTab = this.container.querySelector('.side-panel-content--initial');
    this.predictiveSearchResults = this.container.querySelector('.side-panel-content--has-tabs');
    this.cache = new Map();
    this.controller = null;

    this.setupEventListeners();
  }

  setupEventListeners() {
    this.form.addEventListener('submit', this.onFormSubmit.bind(this));

    this.input.addEventListener('input', debounce((event) => {
      this.onChange(event);
    }, 300).bind(this));

    this.button.forEach((item) => {
      item.addEventListener('click', (event) => {
        event.preventDefault();
        if (OverlayManager.isOpen(this.container)) {
          OverlayManager.close(this.container);
        } else {
          this.stampPromotionTemplate();
          OverlayManager.open(this.container);
          setTimeout(() => {
            this.input.focus({
              preventScroll: true
            });
          }, 100);
          dispatchCustomEvent('search:open');
        }
      });
    });

    this.predictiveSearchResults.addEventListener('click', (event) => {
      const submitButton = event.target.closest('#search-results-submit');
      if (submitButton) {
        this.form.submit();
      }
    });
  }

  getQuery() {
    return this.input.value.trim();
  }

  onChange() {
    const searchTerm = this.getQuery();

    if (!searchTerm.length) {
      this.predictiveSearchResults.classList.remove('active');
      return;
    }
    this.predictiveSearchResults.classList.add('active');
    this.getSearchResults(searchTerm);
  }

  onFormSubmit(event) {
    if (!this.getQuery().length) {
      event.preventDefault();
    }
  }

  getSearchResults(searchTerm) {
    if (this.controller) {
      this.controller.abort();
    }
    this.controller = new AbortController();

    // Serve from cache if available
    if (this.cache.has(searchTerm)) {
      this.renderSearchResults(this.cache.get(searchTerm));
      return;
    }

    this.predictiveSearchResults.classList.add('loading');

    const params = new URLSearchParams({
      q: searchTerm,
      'resources[type]': 'product,article,query',
      'resources[limit]': '10',
      'resources[options][fields]': 'title,product_type,vendor,variants.title,variants.sku',
      section_id: 'predictive-search'
    });

    fetch(`${theme.routes.predictive_search_url}?${params.toString()}`, { signal: this.controller.signal })
      .then((response) => {
        this.predictiveSearchResults.classList.remove('loading');
        if (!response.ok) {
          throw new Error(response.status);
        }
        return response.text();
      })
      .then((text) => {
        const resultsMarkup = new DOMParser().parseFromString(text, 'text/html').querySelector('#shopify-section-predictive-search').innerHTML;

        // Cap cache size
        if (this.cache.size >= 50) {
          const firstKey = this.cache.keys().next().value;
          this.cache.delete(firstKey);
        }
        this.cache.set(searchTerm, resultsMarkup);

        this.renderSearchResults(resultsMarkup);
      })
      .catch((error) => {
        if (error.name === 'AbortError') {
          return;
        }
        this.predictiveSearchResults.classList.remove('loading');
        this.predictiveSearchResults.classList.remove('active');
      });
  }

  renderSearchResults(resultsMarkup) {
    this.predictiveSearchResults.innerHTML = resultsMarkup;
  }

  stampPromotionTemplate() {
    const tpl = this.container.querySelector('.thb-predictive-search--promotion-template');
    if (tpl) {
      tpl.replaceWith(tpl.content.cloneNode(true));
    }
  }
}
window.addEventListener('load', () => {
  if (typeof PredictiveSearch !== 'undefined') {
    new PredictiveSearch();
  }
});
