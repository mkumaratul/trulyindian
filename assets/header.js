if (typeof debounce === 'undefined') {
  var debounce = function(fn, wait) {
    let t;
    return (...args) => {
      clearTimeout(t);
      t = setTimeout(() => fn.apply(this, args), wait);
    };
  };
}
/**
 *  @class
 *  @function ThemeHeader
 */
if (!customElements.get('theme-header')) {
  class ThemeHeader extends HTMLElement {
    connectedCallback() {
      this.header_section = document.querySelector('.header-section');
      this.menu = this.querySelector('#mobile-menu');
      this.toggle = document.querySelector('.mobile-toggle-wrapper');
      this._scrollTicking = false;
      this._stickyOffset = 0;

      document.addEventListener('keyup', (e) => {
        if (e.code?.toUpperCase() === 'ESCAPE') {
          this.toggle.removeAttribute('open');
          this.toggle.classList.remove('active');
        }
      });
      this.toggle.querySelector('.mobile-toggle').addEventListener('click', (e) => {
        if (this.toggle.classList.contains('active')) {
          e.preventDefault();
          document.body.classList.remove('overflow-hidden');
          this.toggle.classList.remove('active');
          this.closeAnimation(this.toggle);
        } else {
          document.body.classList.add('overflow-hidden');
          setTimeout(() => {
            this.toggle.classList.add('active');
          });
        }
        window.dispatchEvent(new Event('resize.resize-select'));
      });

      // Cache sticky offset and recalculate on resize
      this._cacheStickyOffset();
      window.addEventListener('resize', debounce(() => {
        this._cacheStickyOffset();
      }, 100));

      // Single scroll listener with rAF throttle
      window.addEventListener('scroll', () => {
        if (!this._scrollTicking) {
          this._scrollTicking = true;
          requestAnimationFrame(() => {
            this.setStickyClass();
            this.setHeaderOffset();
            this.setHeaderHeight();
            this._scrollTicking = false;
          });
        }
      }, { passive: true });

      window.dispatchEvent(new Event('scroll'));

      if (document.querySelector('.announcement-bar-section')) {
        window.addEventListener('scroll', () => this.setAnnouncementHeight(), {
          passive: true
        });
        window.dispatchEvent(new Event('resize'));
      }

      // Buttons.
      this.menu.querySelectorAll('summary').forEach(summary => summary.addEventListener('click', this.onSummaryClick.bind(this)));
      this.menu.querySelectorAll('.parent-link-back--button').forEach(button => button.addEventListener('click', this.onCloseButtonClick.bind(this)));
    }

    _cacheStickyOffset() {
      if (this.classList.contains('header-sticky--active')) {
        // Skip recalculation while sticky — the header is position:sticky at top:0,
        // so getBoundingClientRect().top would return 0 and corrupt the offset.
        if (this.classList.contains('is-sticky')) {
          return;
        }
        this._stickyOffset = parseInt(this.header_section.getBoundingClientRect().top, 10) + document.documentElement.scrollTop;
      }
    }
    setStickyClass() {
      if (this.classList.contains('header-sticky--active')) {
        this.classList.toggle('is-sticky', window.scrollY >= this._stickyOffset && window.scrollY > 0);
      }
    }
    setAnnouncementHeight() {
      const a_bar = document.getElementById('shopify-section-announcement-bar');
      if (a_bar) {
        let h = a_bar.clientHeight;
        document.documentElement.style.setProperty('--announcement-height', h + 'px');
      }
    }
    setHeaderOffset() {
      let h = this.header_section.getBoundingClientRect().top;
      document.documentElement.style.setProperty('--header-offset', h + 'px');
    }
    setHeaderHeight() {
      let h = this.clientHeight;
      document.documentElement.style.setProperty('--header-height', h + 'px');
    }
    onSummaryClick(event) {
      const summaryElement = event.currentTarget;
      const detailsElement = summaryElement.parentNode;
      const parentMenuElement = detailsElement.closest('.link-container');

      // Stamp deferred template content on first open
      const tpl = detailsElement.querySelector(':scope > template.mobile-menu-deferred');
      if (tpl) {
        tpl.replaceWith(tpl.content.cloneNode(true));
        // Re-bind back buttons for the newly stamped content
        detailsElement.querySelectorAll('.parent-link-back--button').forEach(button => button.addEventListener('click', this.onCloseButtonClick.bind(this)));
        detailsElement.querySelectorAll('details.link-container summary').forEach(summary => summary.addEventListener('click', this.onSummaryClick.bind(this)));
      }

      if (this.querySelector('.parent-link-back--button')) {
        this.menu.scrollTop = 0;
      }

      setTimeout(() => {
        detailsElement.classList.add('menu-opening');
        parentMenuElement && parentMenuElement.classList.add('submenu-open');
      }, 100);
    }
    onCloseButtonClick(event) {
      event.preventDefault();
      const detailsElement = event.currentTarget.closest('details');
      this.closeSubmenu(detailsElement);
    }
    closeSubmenu(detailsElement) {
      detailsElement.classList.remove('menu-opening');
      this.closeAnimation(detailsElement);
    }
    closeAnimation(detailsElement) {
      let animationStart;

      const handleAnimation = (time) => {
        if (animationStart === undefined) {
          animationStart = time;
        }

        const elapsedTime = time - animationStart;

        if (elapsedTime < 400) {
          window.requestAnimationFrame(handleAnimation);
        } else {
          detailsElement.removeAttribute('open');
        }
      };

      window.requestAnimationFrame(handleAnimation);
    }
  }
  customElements.define('theme-header', ThemeHeader);
}
/**
 *  @class
 *  @function FullMenu
 */
if (!customElements.get('full-menu')) {
  class FullMenu extends HTMLElement {
    connectedCallback() {
      this.submenus = this.querySelectorAll('.thb-full-menu>.menu-item-has-children:not(.menu-item-has-megamenu)>.sub-menu');

      if (!this.submenus.length) {
        return;
      }
      // resize on initial load
      window.addEventListener('resize', debounce(() => {
        this.resizeSubMenus();
      }, 100));

      window.dispatchEvent(new Event('resize'));

      document.fonts.ready.then(() => {
        this.resizeSubMenus();
      });
    }
    resizeSubMenus() {
      this.submenus.forEach((submenu) => {
        let sub_submenus = submenu.querySelectorAll(':scope >.menu-item-has-children>.sub-menu');

        sub_submenus.forEach((sub_submenu) => {
          let w = sub_submenu.offsetWidth,
            l = sub_submenu.parentElement.parentElement.getBoundingClientRect().left + sub_submenu.parentElement.parentElement.clientWidth + 10,
            total = w + l;
          if (total > document.body.clientWidth) {
            sub_submenu.parentElement.classList.add('left-submenu');
          } else if (sub_submenu.parentElement.classList.contains('left-submenu')) {
            sub_submenu.parentElement.classList.remove('left-submenu');
          }
        });
      });
    }
  }
  customElements.define('full-menu', FullMenu);
}
