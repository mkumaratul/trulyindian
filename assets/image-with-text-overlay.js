/**
 *  @class
 *  @function ImageTextOverlay
 */

if (!customElements.get('image-with-text-overlay')) {
  class ImageTextOverlay extends HTMLElement {
    constructor() {
      super();

      this.tl = false;
      this.splittext = false;
    }
    connectedCallback() {
      if (document.body.classList.contains('animations-true') && typeof gsap !== 'undefined') {
        this.prepareAnimations();
      }
    }
    disconnectedCallback() {
      if (document.body.classList.contains('animations-true') && typeof gsap !== 'undefined') {
        if (this.tl) {
          this.tl.kill();
        }
        if (this.splittext) {
          this.splittext.revert();
        }
      }
    }
    prepareAnimations() {
      let section = this,
        button_offset = 0,
        property = (gsap.getProperty("html", "--header-height") + gsap.getProperty("html", "--header-offset")) + 'px';

      section.tl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: "top center"
        }
      });

      document.fonts.ready.then(function () {
        section.splittext = new SplitText(section.querySelectorAll('.image-with-text-overlay--heading, p:not(.subheading)'), {
          type: 'lines, words',
          linesClass: 'line-child'
        });

        let subheading = section.querySelector('.subheading');
        if (subheading) {
          section.tl
            .fromTo(subheading, {
              opacity: 0
            }, {
              duration: 0.75,
              opacity: 0.6
            }, 0);

          button_offset += 0.5;
        }

        let heading = section.querySelector('.image-with-text-overlay--heading');
        if (heading) {
          let headingLines = section.querySelectorAll('.image-with-text-overlay--heading .line-child div');
          let h3_duration = 0.8 + ((headingLines.length - 1) * 0.08);
          section.tl
            .set(heading, {
              visibility: 'visible'
            }, 0)
            .from(headingLines, {
              duration: h3_duration,
              yPercent: '100',
              stagger: 0.08
            }, 0);
          button_offset += h3_duration;
        }

        let rteParagraphs = section.querySelectorAll('.rte p');
        if (rteParagraphs.length) {
          let rteLines = section.querySelectorAll('.rte p .line-child div');
          let p_duration = 0.8 + ((rteLines.length - 1) * 0.02);
          section.tl
            .set(rteParagraphs, {
              visibility: 'visible'
            }, 0)
            .from(rteLines, {
              duration: p_duration,
              yPercent: '100',
              stagger: 0.02
            }, 0);
          button_offset += p_duration;
        }

        let buttons = section.querySelectorAll('.button');
        if (buttons.length) {
          buttons.forEach((item, index) => {
            section.tl.fromTo(item, {
              autoAlpha: 0
            }, {
              duration: 0.5,
              autoAlpha: 1
            }, ((button_offset * 0.4) + index * 0.1));
          });
        }

      });

      let parallaxImage = section.querySelector('.thb-parallax-image');
      if (parallaxImage) {
        gsap.fromTo(parallaxImage, {
          y: '-8%'
        }, {
          y: '8%',
          ease: 'none',
          scrollTrigger: {
            trigger: section,
            scrub: 1,
            start: () => `top bottom`,
            end: () => `bottom top+=${property}`,
            onUpdate: () => {
              property = (gsap.getProperty("html", "--header-height") + gsap.getProperty("html", "--header-offset")) + 'px';
            }
          }
        });
      }
    }
  }
  customElements.define('image-with-text-overlay', ImageTextOverlay);
}
