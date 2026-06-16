/**
 *  @class
 *  @function SlideShow
 */
if (!customElements.get('slide-show')) {
  class SlideShow extends HTMLElement {
    constructor() {
      super();
      const slideshow = this,
        dataset = slideshow.dataset;

      const slideshow_slides = Array.from(slideshow.querySelectorAll('.carousel__slide'));

      // Single early-return guard
      if (slideshow_slides.length < 1) return;

      const dots_enabled = dataset.dots === 'true',
        autoplay = dataset.autoplay == 'false' ? false : parseInt(dataset.autoplay, 10),
        align = dataset.align == 'center' ? 'center' : 'left',
        fade = dataset.fade == 'true',
        prev_button = slideshow.querySelector('.flickity-prev'),
        next_button = slideshow.querySelector('.flickity-next'),
        custom_dots = slideshow.querySelector('.flickity-page-dots'),
        progress_bar = slideshow.parentNode.querySelector('.flickity-progress--bar'),
        animations = [],
        rightToLeft = document.dir === 'rtl',
        animations_enabled = document.body.classList.contains('animations-true') && typeof gsap !== 'undefined';

      // Cache classList checks — avoids repeated DOM reads throughout constructor
      const isImageTextImage = slideshow.classList.contains('image-with-text-slideshow__image');
      const isImageTextContent = slideshow.classList.contains('image-with-text-slideshow__content');
      const isTestimonials = slideshow.classList.contains('testimonials__carousel');
      const isCustomerReviewsContent = slideshow.classList.contains('customer-reviews__content');
      const isCustomerReviewsImage = slideshow.classList.contains('customer-reviews__image');
      const isCustomDots = slideshow.classList.contains('custom-dots');
      const isMainSlideshow = slideshow.classList.contains('main-slideshow');
      const isShoppableReels = slideshow.classList.contains('shoppable-video-reels--carousel');
      const isProducts = slideshow.classList.contains('products');
      const isCollectionGrid = slideshow.classList.contains('collection-grid__carousel');

      const args = {
        wrapAround: true,
        cellAlign: align,
        pageDots: isCustomDots ? false : dots_enabled,
        contain: true,
        fade,
        autoPlay: autoplay,
        rightToLeft,
        prevNextButtons: false,
        cellSelector: '.carousel__slide',
        on: {}
      };

      if (isImageTextImage) {
        const image_slideshow_slides = slideshow.querySelectorAll('.image-with-text-slideshow__image-media');
        args.draggable = false;
        args.asNavFor = slideshow.parentNode.querySelector('.image-with-text-slideshow__content');
        if (image_slideshow_slides.length && image_slideshow_slides[0].classList.contains('desktop-height-auto')) {
          args.adaptiveHeight = true;
        }
      }
      if (isCustomerReviewsImage) {
        args.draggable = false;
        args.asNavFor = slideshow.parentNode.querySelector('.customer-reviews__content');
      }
      if (isImageTextContent || isTestimonials || isCustomerReviewsContent || isCustomerReviewsImage) {
        args.adaptiveHeight = true;
      }

      // Cache dot elements once — prevents querySelectorAll on every slide change
      const cached_dot_list = custom_dots ? Array.from(custom_dots.querySelectorAll('li')) : null;

      if (isCustomDots) {
        if (animations_enabled && isMainSlideshow) {
          this.prepareAnimations(slideshow, animations);
        }
        args.pauseAutoPlayOnHover = false;

        args.on = {
          staticClick: function () {
            this.unpausePlayer();
          },
          ready: function () {
            let flkty = this;

            if (animations_enabled && isMainSlideshow) {
              slideshow.animateSlides(0, animations);
              gsap.set(slideshow.querySelectorAll('.subheading,.split-text,.button'), { visibility: 'visible' });
            }

            if (dots_enabled && cached_dot_list) {
              cached_dot_list.forEach((dot, i) => {
                dot.addEventListener('click', () => flkty.select(i));
              });
              cached_dot_list[this.selectedIndex].classList.add('is-selected');
            }

            document.fonts.ready.then(() => requestAnimationFrame(() => flkty.resize()));

            // Video Support.
            const video_container = flkty.cells[0].element.querySelector('.slideshow__slide-video-bg');
            if (video_container) {
              const iframe = video_container.querySelector('iframe');
              const video = video_container.querySelector('video');
              if (iframe) {
                iframe.onload = () => slideshow.videoPlay(video_container);
              } else if (video) {
                video.onloadstart = () => slideshow.videoPlay(video_container);
              }
            }
          },
          change: function (index) {
            const firstCell = flkty.cells[0].element;
            if (firstCell.classList.contains('is-initial-selected')) {
              firstCell.classList.remove('is-initial-selected');
            }
            const previousIndex = fizzyUIUtils.modulo(this.selectedIndex - 1, this.slides.length),
              nextIndex = fizzyUIUtils.modulo(this.selectedIndex + 1, this.slides.length);

            // Animations.
            if (animations_enabled && isMainSlideshow) {
              gsap.delayedCall(0.3, () => slideshow.animateReverse(previousIndex, animations));
              slideshow.animateSlides(index, animations);
            }

            // Color changes — deferred to avoid forced reflow during change callback
            const selectedElement = this.selectedElement;
            requestAnimationFrame(() => {
              const cs = getComputedStyle(selectedElement);
              slideshow.style.setProperty('--color-body', cs.getPropertyValue('--color-body'));
              slideshow.style.setProperty('--color-body-rgb', cs.getPropertyValue('--color-body-rgb'));
            });

            // Custom Dots.
            if (dots_enabled && cached_dot_list) {
              cached_dot_list.forEach((dot) => dot.classList.remove('is-selected'));
              cached_dot_list[this.selectedIndex].classList.add('is-selected');
            }

            // AutoPlay
            if (autoplay) {
              this.stopPlayer();
              this.playPlayer();
            }

            // Video Support.
            // previous slide
            const video_container_prev = flkty.cells[previousIndex].element.querySelector('.slideshow__slide-video-bg');
            if (video_container_prev) {
              slideshow.videoPause(video_container_prev);
            }
            // next slide
            const video_container_next = flkty.cells[nextIndex].element.querySelector('.slideshow__slide-video-bg');
            if (video_container_next) {
              slideshow.videoPause(video_container_next);
            }
            // current slide
            const video_container = flkty.cells[index].element.querySelector('.slideshow__slide-video-bg');
            if (video_container) {
              const iframe = video_container.querySelector('iframe');
              if (iframe) {
                if (iframe.classList.contains('lazyload')) {
                  iframe.addEventListener('lazybeforeunveil', () => slideshow.videoPlay(video_container));
                  lazySizes.loader.checkElems();
                } else {
                  slideshow.videoPlay(video_container);
                }
              } else if (video_container.querySelector('video')) {
                slideshow.videoPlay(video_container);
              }
            }
          }
        };
      }
      if (isShoppableReels) {
        args.on.staticClick = function (event, pointer, cellElement, cellIndex) {
          if (typeof cellIndex == 'number') {
            flkty.select(cellIndex);
          }
        };
      }
      if (isMainSlideshow) {
        if (slideshow.classList.contains('desktop-height-image') || slideshow.classList.contains('mobile-height-image')) {
          args.adaptiveHeight = true;
        }
      }
      if (isProducts || isCollectionGrid) {
        args.wrapAround = false;
        args.on.ready = function () {
          if (next_button && isProducts) {
            let resizeRaf = 0;
            slideshow._resizeHandler = function () {
              cancelAnimationFrame(resizeRaf);
              resizeRaf = requestAnimationFrame(() => {
                slideshow.centerArrows(slideshow._flkty, prev_button, next_button);
              });
            };
            window.addEventListener('resize', slideshow._resizeHandler);
          }
          window.dispatchEvent(new Event('resize'));
        };
      }
      if (progress_bar) {
        let scrollRaf = 0;
        args.wrapAround = false;
        args.on.scroll = function (progress) {
          cancelAnimationFrame(scrollRaf);
          scrollRaf = requestAnimationFrame(() => {
            progress = Math.max(0, Math.min(1, progress));
            progress_bar.style.width = progress * 100 + '%';
          });
        };
      }
      const flkty = new Flickity(slideshow, args);

      // Store references for cleanup in disconnectedCallback
      this._flkty = flkty;
      this._animations = animations;
      this._animations_enabled = animations_enabled && isMainSlideshow;

      dataset.initiated = true;

      if (prev_button) {
        prev_button.addEventListener('click', () => flkty.previous());
        prev_button.addEventListener('keyup', () => flkty.previous());
        next_button.addEventListener('click', () => flkty.next());
        next_button.addEventListener('keyup', () => flkty.next());
      }

      if (Shopify.designMode) {
        slideshow.addEventListener('shopify:block:select', (event) => {
          const index = slideshow_slides.indexOf(event.target);
          flkty.select(index);
        });
      }
    }
    disconnectedCallback() {
      // Destroy Flickity instance
      if (this._flkty) {
        this._flkty.destroy();
        this._flkty = null;
      }

      // Kill all GSAP animation timelines
      if (this._animations_enabled && this._animations) {
        this._animations.forEach((tl) => tl.kill());
        this._animations = null;
      }

      // Remove resize listener
      if (this._resizeHandler) {
        window.removeEventListener('resize', this._resizeHandler);
        this._resizeHandler = null;
      }

      // Reset animation state so prepareAnimations can re-run
      delete this.dataset.animationsReady;
      this.dataset.initiated = false;
    }
    videoPause(video_container) {
      setTimeout(() => {
        if (video_container.dataset.provider === 'hosted') {
          video_container.querySelector('video').pause();
        } else {
          const iframe = video_container.querySelector('iframe');
          const message = iframe.dataset.provider === 'youtube' ? { event: "command", func: "pauseVideo", args: "" } : { method: "pause" };
          iframe.contentWindow.postMessage(JSON.stringify(message), "*");
        }
      }, 10);
    }
    videoPlay(video_container) {
      setTimeout(() => {
        if (video_container.dataset.provider === 'hosted') {
          video_container.querySelector('video').play();
        } else {
          const iframe = video_container.querySelector('iframe');
          const message = iframe.dataset.provider === 'youtube' ? { event: "command", func: "playVideo", args: "" } : { method: "play" };
          iframe.contentWindow.postMessage(JSON.stringify(message), "*");
        }
      }, 10);
    }
    prepareAnimations(slideshow, animations) {
      if (!slideshow.dataset.animationsReady) {
        const split_text_els = slideshow.querySelectorAll('.split-text');
        new SplitText(split_text_els, { type: 'lines, words', linesClass: 'line-child' });

        slideshow.querySelectorAll('.slideshow__slide').forEach((item, i) => {
          // Cache all element refs per slide — avoids repeated querySelector in timeline definitions
          const bg = item.querySelector('.slideshow__slide-bg');
          const subheading = item.querySelector('.subheading');
          const headingLines = item.querySelectorAll('.slideshow__slide-content--heading .line-child div');
          const bodyLines = item.querySelectorAll('p:not(.subheading) .line-child div');
          const buttons = item.querySelectorAll('.button');

          const tl = gsap.timeline({ paused: true });
          let button_offset = 0;

          animations[i] = tl;

          if (slideshow.dataset.transition == 'swipe') {
            tl.fromTo(item, {
              clipPath: 'polygon(0 0, 0 0, 0 100%, 0 100%)'
            }, {
              duration: 0.7,
              clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%)'
            }, "start");
          }

          tl.to(bg, { duration: 1.5, scale: 1 }, "start");

          if (subheading) {
            tl.to(subheading, { duration: 0.5, autoAlpha: 1 }, 0);
            button_offset += 0.5;
          }
          if (headingLines.length) {
            const h1_duration = 0.5 + ((headingLines.length - 1) * 0.05);
            tl.from(headingLines, { duration: h1_duration, yPercent: '100', stagger: 0.05 }, 0);
            button_offset += h1_duration;
          }
          if (bodyLines.length) {
            const p_duration = 0.5 + ((bodyLines.length - 1) * 0.02);
            tl.from(bodyLines, { duration: p_duration, yPercent: '100', stagger: 0.02 }, 0);
            button_offset += p_duration;
          }
          if (buttons.length) {
            tl.fromTo(buttons, { y: '100%' }, { duration: 0.5, y: '0%', stagger: 0.1 }, button_offset * 0.2);
          }
          item.dataset.timeline = tl;
        });
        slideshow.dataset.animationsReady = true;
      }
    }
    animateSlides(i, animations) {
      animations[i].timeScale(1).restart();
    }
    animateReverse(i, animations) {
      animations[i].timeScale(3).reverse();
    }
    centerArrows(flickity, prev_button, next_button) {
      const first_cell = flickity.cells[0],
        image_height = first_cell.element.querySelector('.product-card--featured-image')?.clientHeight || 0;
      let max_height = 0;

      flickity.cells.forEach((item) => {
        if (item.size.height > max_height) {
          max_height = item.size.height;
        }
      });

      if (max_height > image_height) {
        const difference = (max_height - image_height) / -2;
        prev_button.style.transform = 'translateY(' + difference + 'px)';
        next_button.style.transform = 'translateY(' + difference + 'px)';
      }
    }
  }
  customElements.define('slide-show', SlideShow);
}
