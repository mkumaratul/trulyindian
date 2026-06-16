/**
 *  @class
 *  @function CountdownTimer
 */
if (!customElements.get('countdown-timer')) {
  class CountdownTimer extends HTMLElement {
    constructor() {
      super();

      this.io = new IntersectionObserver((entries, observer) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            this.init();
            observer.unobserve(entry.target);
          }
        });
      }, { rootMargin: `0px 0px 500px 0px` });

      this.io.observe(this);
    }
    init() {
      const timezone = this.dataset.timezone,
        date = this.dataset.date.split('-'),
        day = parseInt(date[0]),
        month = parseInt(date[1]),
        year = parseInt(date[2]);

      let time = this.dataset.time,
        tarhour = 0,
        tarmin = 0;

      if (time) {
        [tarhour, tarmin] = time.split(':').map(Number);
      }

      // Set the date we're counting down to
      let date_string = month + '/' + day + '/' + year + ' ' + tarhour + ':' + tarmin + ' GMT' + timezone;
      // Time without timezone
      this.countDownDate = new Date(year, month - 1, day, tarhour, tarmin, 0, 0).getTime();

      // Time with timezone
      this.countDownDate = new Date(date_string).getTime();
    }
    convertDateForIos(date) {
      var arr = date.split(/[- :]/);
      date = new Date(arr[0], arr[1] - 1, arr[2], arr[3], arr[4], arr[5]);
      return date;
    }
    connectedCallback() {
      // Inject vertical-only Gaussian blur SVG filter once
      if (!document.getElementById('countdown-blur-y')) {
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('width', '0');
        svg.setAttribute('height', '0');
        svg.style.position = 'absolute';
        svg.innerHTML = '<filter id="countdown-blur-y"><feGaussianBlur in="SourceGraphic" stdDeviation="0 3"/></filter>';
        document.body.appendChild(svg);
      }

      const daysEl = this.querySelector('.days .countdown-timer--column--number'),
        hoursEl = this.querySelector('.hours .countdown-timer--column--number'),
        minutesEl = this.querySelector('.minutes .countdown-timer--column--number'),
        secondsEl = this.querySelector('.seconds .countdown-timer--column--number');

      // Build per-digit clip containers for each number element.
      [daysEl, hoursEl, minutesEl, secondsEl].forEach(el => {
        el.textContent = '';
      });

      const updateTime = () => {
        // Wait until init() has set countDownDate via IntersectionObserver
        if (!this.countDownDate) {
          requestAnimationFrame(updateTime);
          return;
        }

        // Get todays date and time
        const now = Date.now();

        // Find the distance between now an the count down date
        const distance = this.countDownDate - now;

        if (distance < 0) {
          CountdownTimer.setNumber(daysEl, '00');
          CountdownTimer.setNumber(hoursEl, '00');
          CountdownTimer.setNumber(minutesEl, '00');
          CountdownTimer.setNumber(secondsEl, '00');
          return;
        }

        // Time calculations for days, hours, minutes and seconds
        const days = Math.floor(distance / (1000 * 60 * 60 * 24)),
          hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
          seconds = Math.floor((distance % (1000 * 60)) / 1000);

        requestAnimationFrame(updateTime);

        CountdownTimer.setNumber(daysEl, CountdownTimer.addZero(days));
        CountdownTimer.setNumber(hoursEl, CountdownTimer.addZero(hours));
        CountdownTimer.setNumber(minutesEl, CountdownTimer.addZero(minutes));
        CountdownTimer.setNumber(secondsEl, CountdownTimer.addZero(seconds));

      };
      requestAnimationFrame(updateTime);
    }
    static setNumber(el, newVal) {
      const digits = String(newVal).split('');
      let clips = el.querySelectorAll('.countdown-digit');

      // Add or remove digit containers when digit count changes
      while (clips.length < digits.length) {
        const d = CountdownTimer.createDigit('');
        el.appendChild(d);
        clips = el.querySelectorAll('.countdown-digit');
      }
      while (clips.length > digits.length) {
        el.removeChild(clips[clips.length - 1]);
        clips = el.querySelectorAll('.countdown-digit');
      }

      // Update each digit independently — only animate changed ones
      digits.forEach((digit, i) => {
        const clip = clips[i];
        const current = clip.querySelector('.countdown-num--current');
        const entering = clip.querySelector('.countdown-num--entering');

        if ((current && current.textContent === digit) ||
            (entering && entering.textContent === digit)) return;

        clip.querySelectorAll('.countdown-num--leaving').forEach(s => s.remove());
        if (entering) entering.remove();

        if (current) {
          current.className = 'countdown-num--leaving';
          current.addEventListener('animationend', () => current.remove(), { once: true });
          setTimeout(() => { if (current.parentNode) current.remove(); }, 500);
        }

        const sizer = clip.querySelector('.countdown-sizer');
        if (sizer) sizer.textContent = digit;

        const next = document.createElement('span');
        next.className = 'countdown-num--entering';
        next.textContent = digit;
        clip.appendChild(next);

        const promote = () => { next.className = 'countdown-num--current'; };
        next.addEventListener('animationend', promote, { once: true });
        setTimeout(() => {
          if (next.classList.contains('countdown-num--entering')) promote();
        }, 500);
      });
    }
    static createDigit(val) {
      const d = document.createElement('span');
      d.className = 'countdown-digit';
      const sizer = document.createElement('span');
      sizer.className = 'countdown-sizer';
      sizer.textContent = val;
      d.appendChild(sizer);
      return d;
    }
    static addZero(x) {
      return (x < 10 && x >= 0) ? "0" + x : x;
    }
  }
  customElements.define('countdown-timer', CountdownTimer);
}
