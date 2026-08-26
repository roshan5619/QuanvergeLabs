/* ==========================================================================
   QUANVERGE LABS — page behaviour
   --------------------------------------------------------------------------
   Four small independent features:
     1. Mobile menu open/close
     2. ROI calculators
     3. Fade-in on scroll
     4. Footer year
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


/* 1. MOBILE MENU ===========================================================
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


/* 2. ROI CALCULATORS =======================================================
   One piece of code drives all four calculators. It reads its settings from
   data- attributes in the HTML, so you can change the sums without editing
   this file.

   On a slider:            data-roi-input, data-roi-unit="images"
   On a result <span>:     data-roi-source = id of the slider to read
                           data-roi-op     = divide | multiply | errorDrop
                           data-roi-by     = the number to apply
                           data-roi-cap    = optional maximum result       */

(function roiCalculators() {

  // Turns 1000000 into "1,000,000"
  const format = (n) => Math.round(n).toLocaleString('en-US');

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

  function refresh(slider) {
    // Update the number shown next to the slider's label
    const label = $(`output[for="${slider.id}"]`);
    if (label) {
      label.textContent = `${format(slider.value)} ${slider.dataset.roiUnit || ''}`.trim();
    }

    // Update every result that reads from this slider
    $$(`[data-roi-output][data-roi-source="${slider.id}"]`).forEach((output) => {
      const cap = output.dataset.roiCap ? Number(output.dataset.roiCap) : undefined;

      output.textContent = format(
        calculate(
          Number(slider.value),
          output.dataset.roiOp,
          Number(output.dataset.roiBy),
          cap
        )
      );
    });
  }

  // Wire up every slider, and fill in the starting numbers straight away
  $$('input[data-roi-input]').forEach((slider) => {
    slider.addEventListener('input', () => refresh(slider));
    refresh(slider);
  });

  // The "+ Calculate ... ROI" buttons open and close their panel
  $$('.roi-toggle').forEach((button) => {
    button.addEventListener('click', () => {
      const panel = document.getElementById(button.getAttribute('aria-controls'));
      if (!panel) return;

      const isOpen = panel.classList.toggle('is-open');
      button.setAttribute('aria-expanded', String(isOpen));
    });
  });
})();


/* 3. FADE-IN ON SCROLL =====================================================
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


/* 4. FOOTER YEAR ===========================================================
   Keeps the copyright year current without anyone editing it each January. */

(function footerYear() {
  const slot = $('#year');
  if (slot) slot.textContent = new Date().getFullYear();
})();
