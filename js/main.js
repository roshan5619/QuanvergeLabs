/* ==========================================================================
   QUANVERGE LABS — page behaviour
   --------------------------------------------------------------------------
   Six small independent features:
     1. Theme switch (light / dark)
     2. Mobile menu open/close
     3. ROI calculators
     4. Fade-in on scroll
     5. Footer year
     6. Typewriter headline
   Each one is wrapped in its own block so you can read (or delete) them
   one at a time without affecting the others.

   This same file is loaded by every page. Each block checks whether the
   elements it needs are present, so nothing breaks on pages that don't
   have (for example) an ROI calculator.
   ========================================================================== */

/* Quick helpers so we don't repeat document.querySelector everywhere.
     $  finds the first matching element
     $$ finds all matching elements, as a normal array            */
const $  = (selector, scope = document) => scope.querySelector(selector);
const $$ = (selector, scope = document) => Array.from(scope.querySelectorAll(selector));


/* 1. THEME SWITCH ==========================================================
   The chosen theme is stored under this key so it carries across pages and
   visits. The theme is actually *applied* by a few lines inlined in each
   page's <head> — that has to run before the page paints, or you'd see a
   flash of the wrong colours. This block only handles the button.        */

const THEME_KEY = 'quanverge-theme';

(function themeSwitch() {
  const button = $('#themeToggle');
  if (!button) return;

  const label = (theme) =>
    theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme';

  button.setAttribute('aria-label', label(document.documentElement.dataset.theme));

  button.addEventListener('click', () => {
    const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    button.setAttribute('aria-label', label(next));

    // Keep the browser UI (address bar on mobile) in step with the page
    const meta = $('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', next === 'dark' ? '#061820' : '#ffffff');

    // Private browsing can make localStorage throw, so never let it break the page
    try {
      localStorage.setItem(THEME_KEY, next);
    } catch (e) {
      /* the choice just won't be remembered */
    }
  });
})();


/* 2. MOBILE MENU ===========================================================
   The hamburger button toggles a CSS class on the link list. The CSS in
   section 13 of styles.css does the actual showing and hiding.            */

(function mobileMenu() {
  const toggle = $('#navToggle');
  const links  = $('#navLinks');
  if (!toggle || !links) return;

  toggle.addEventListener('click', () => {
    const isOpen = links.classList.toggle('is-open');
    // Tell screen readers whether the menu is currently open
    toggle.setAttribute('aria-expanded', String(isOpen));
    toggle.innerHTML = isOpen ? '&times;' : '&#9776;';
  });

  // Close the menu after tapping a link, so it doesn't cover the page
  $$('a', links).forEach((link) => {
    link.addEventListener('click', () => {
      links.classList.remove('is-open');
      toggle.setAttribute('aria-expanded', 'false');
      toggle.innerHTML = '&#9776;';
    });
  });
})();


/* 3. ROI CALCULATORS ======================================================
   One piece of code drives all four calculators. It reads its settings from
   data- attributes in the HTML, so you can change the sums without editing
   this file.

   On a slider:            data-roi-input, data-roi-unit="images"
   On a result <span>:     data-roi-source = id of the slider to read.
                                             Several ids, space separated,
                                             are multiplied together first —
                                             that's how the training-time
                                             estimate uses images AND epochs.
                           data-roi-op     = divide | multiply | errorDrop
                           data-roi-by     = the number to apply
                           data-roi-cap    = optional maximum result
                           data-roi-prefix = optional "≈" or "≤", for a
                                             figure that is an estimate or a
                                             bound rather than exact

   For a range instead of a single figure, give data-roi-by-min and
   data-roi-by-max instead of data-roi-by. The result then renders as
   "low – high". Use this when a benchmark is a band ("10-30% better")
   rather than one number.

   data-roi-money formats the result as Indian currency in crore.
   data-roi-duration formats a number of seconds as minutes, hours or
   days, whichever reads best.                                            */

(function roiCalculators() {

  // Turns 1000000 into "1,000,000"
  const format = (n) => Math.round(n).toLocaleString('en-US');

  // Turns 25000000 into "₹2.5 Cr" (1 crore = 10,000,000)
  const formatMoney = (n) => {
    const cr = n / 1e7;
    return `₹${cr < 10 ? cr.toFixed(1) : Math.round(cr).toLocaleString('en-IN')} Cr`;
  };

  // Turns 3289 seconds into "54.8 min", 248400 into "69.0 hours".
  // Hours are kept up to a week: a benchmark quoted in hours should still
  // read in hours on screen, rather than turning into "2.9 days".
  const formatDuration = (s) => {
    if (s < 90) return `${s.toFixed(0)} sec`;
    if (s < 5400) return `${(s / 60).toFixed(1)} min`;
    if (s < 604800) return `${(s / 3600).toFixed(1)} hours`;
    return `${(s / 86400).toFixed(1)} days`;
  };

  function calculate(value, operation, by, cap) {
    let result;

    if (operation === 'divide') {
      result = value / by;

    } else if (operation === 'multiply') {
      result = value * by;

    } else if (operation === 'errorDrop') {
      // Used for accuracy figures. "30% better" means we remove 30% of the
      // mistakes still being made, not that we add 30 percentage points.
      // An 80%-accurate model gets 20% wrong; removing 30% of that leaves
      // 14% wrong, so accuracy becomes 86%. This can never exceed 100%.
      const errorNow = 100 - value;
      result = 100 - errorNow * (1 - by);

    } else {
      result = value;
    }

    // Never go above the cap, if one was set (e.g. accuracy can't exceed 100%)
    if (cap !== undefined && result > cap) result = cap;

    return result;
  }

  /** Recompute one result element from whichever sliders it names. */
  function render(output) {
    const d = output.dataset;
    const cap = d.roiCap ? Number(d.roiCap) : undefined;

    // Multiply every named slider together. A single id is the common case;
    // two ids drive the training-time estimate (images x epochs).
    const value = d.roiSource.split(/\s+/).reduce((acc, id) => {
      const el = document.getElementById(id);
      return el ? acc * Number(el.value) : acc;
    }, 1);

    const show = d.roiDuration !== undefined ? formatDuration
               : d.roiMoney !== undefined ? formatMoney
               : format;
    const prefix = d.roiPrefix ? d.roiPrefix + ' ' : '';
    const run = (by) => calculate(value, d.roiOp, Number(by), cap);

    if (d.roiByMin !== undefined && d.roiByMax !== undefined) {
      // A benchmark band, e.g. "10-30% better" -> render "low – high"
      const a = run(d.roiByMin);
      const b = run(d.roiByMax);
      const [low, high] = a <= b ? [a, b] : [b, a];
      output.textContent = `${prefix}${show(low)} – ${show(high)}`;
    } else {
      output.textContent = prefix + show(run(d.roiBy));
    }
  }

  function refresh(slider) {
    // Update the number shown next to the slider's label
    const label = $(`output[for="${slider.id}"]`);
    if (label) {
      label.textContent = `${format(slider.value)} ${slider.dataset.roiUnit || ''}`.trim();
    }

    // Update every result that reads from this slider. The attribute may
    // list more than one id, so match on word boundaries rather than equality.
    $$('[data-roi-output]').forEach((output) => {
      if (output.dataset.roiSource.split(/\s+/).includes(slider.id)) render(output);
    });
  }

  // Wire up every slider, and fill in the starting numbers straight away
  $$('input[data-roi-input]').forEach((slider) => {
    slider.addEventListener('input', () => refresh(slider));
    refresh(slider);
  });

  // The card above each panel opens and closes it
  $$('.roi-open').forEach((button) => {
    button.addEventListener('click', () => {
      const panel = document.getElementById(button.getAttribute('aria-controls'));
      if (!panel) return;

      const isOpen = panel.classList.toggle('is-open');
      button.setAttribute('aria-expanded', String(isOpen));
    });
  });
})();


/* 4. FADE-IN ON SCROLL ====================================================
   Anything with class="reveal" starts invisible (see styles.css) and fades
   in when it scrolls into view. IntersectionObserver is the browser's
   built-in way of asking "is this element on screen yet?".                */

(function revealOnScroll() {
  const items = $$('.reveal');
  if (!items.length) return;

  // If the visitor prefers reduced motion, just show everything immediately
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (prefersReducedMotion || !('IntersectionObserver' in window)) {
    items.forEach((item) => item.classList.add('is-visible'));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        // Once shown, stop watching it — we only fade in once
        observer.unobserve(entry.target);
      });
    },
    { rootMargin: '-60px' }
  );

  items.forEach((item) => observer.observe(item));
})();


/* 5. FOOTER YEAR ==========================================================
   Keeps the copyright year current without anyone editing it each January. */

(function footerYear() {
  const slot = $('#year');
  if (slot) slot.textContent = new Date().getFullYear();
})();


/* 6. TYPEWRITER HEADLINE ==================================================
   Types the hero headline out one character at a time, with the caret
   sitting at the end of whichever line is being written.

   The full text stays written in the HTML and is only cleared once this
   runs, so search engines and screen readers always get the complete
   headline even though a visitor watches it appear.

   To use it, put data-typewriter on the heading. Each element inside it
   with class="text-gradient" is treated as one line.                     */

(function typewriterHeadline() {
  const heading = $('[data-typewriter]');
  if (!heading) return;

  const lines = $$('.text-gradient', heading);
  if (!lines.length) return;

  // Anyone who prefers reduced motion just gets the finished headline
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const caret = $('.caret', heading);
  const text = lines.map((line) => line.textContent);

  // Hold the finished height, or the rest of the page jumps upwards while
  // the headline is still short.
  heading.style.minHeight = heading.getBoundingClientRect().height + 'px';

  lines.forEach((line) => { line.textContent = ''; });
  if (caret) {
    caret.classList.add('is-typing');   // shows the cursor; removed when done
    lines[0].after(caret);
  }

  const CHAR_MS = 55;
  const LINE_PAUSE_MS = 260;
  const START_DELAY_MS = 350;
  let lineIndex = 0;
  let charIndex = 0;

  function step() {
    if (lineIndex >= text.length) {
      heading.style.minHeight = '';
      if (caret) caret.classList.remove('is-typing');
      return;
    }

    const line = text[lineIndex];

    if (charIndex < line.length) {
      charIndex += 1;
      lines[lineIndex].textContent = line.slice(0, charIndex);
      setTimeout(step, CHAR_MS);
      return;
    }

    // Line finished: move the caret down and carry on
    lineIndex += 1;
    charIndex = 0;
    if (lineIndex < text.length && caret) lines[lineIndex].after(caret);
    setTimeout(step, LINE_PAUSE_MS);
  }

  setTimeout(step, START_DELAY_MS);
})();
