/* =========================================================================
   Nish Impressions Studio - site behaviour
   Vanilla ES2019. Every feature degrades gracefully without JS.
   ========================================================================= */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------------------------------------------------------------- header */
  (function header() {
    var el = document.querySelector('[data-header]');
    if (!el) return;
    var last = 0;
    var ticking = false;

    function update() {
      var y = window.pageYOffset;
      el.classList.toggle('is-stuck', y > 40);
      // Hide on downward scroll once past the fold, reveal on the way back up.
      el.classList.toggle('is-hidden', y > 480 && y > last && !document.body.classList.contains('nav-open'));
      last = y;
      ticking = false;
    }

    window.addEventListener('scroll', function () {
      if (!ticking) { window.requestAnimationFrame(update); ticking = true; }
    }, { passive: true });
    update();
  })();

  /* ------------------------------------------------------------ mobile nav */
  (function nav() {
    var toggle = document.querySelector('[data-nav-toggle]');
    var menu = document.getElementById('primary-nav');
    if (!toggle || !menu) return;

    function setOpen(open) {
      toggle.setAttribute('aria-expanded', String(open));
      menu.classList.toggle('is-open', open);
      document.body.classList.toggle('nav-open', open);
      toggle.querySelector('.nav-toggle__label').textContent = open ? 'Close' : 'Menu';
      if (open) {
        var first = menu.querySelector('a');
        if (first) first.focus();
      }
    }

    toggle.addEventListener('click', function () {
      setOpen(toggle.getAttribute('aria-expanded') !== 'true');
    });

    menu.addEventListener('click', function (e) {
      if (e.target.closest('a')) setOpen(false);
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
        setOpen(false);
        toggle.focus();
      }
    });

    // Reset when the layout returns to desktop width.
    window.matchMedia('(min-width: 1081px)').addEventListener('change', function (e) {
      if (e.matches) setOpen(false);
    });
  })();

  /* --------------------------------------------------------- scroll reveal */
  (function reveal() {
    var items = document.querySelectorAll('.reveal');
    if (!items.length) return;
    if (reduceMotion || !('IntersectionObserver' in window)) {
      Array.prototype.forEach.call(items, function (el) { el.classList.add('is-visible'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        // Stagger siblings slightly so grids cascade instead of popping.
        var delay = parseInt(entry.target.getAttribute('data-reveal-delay') || '0', 10);
        setTimeout(function () { entry.target.classList.add('is-visible'); }, delay);
        io.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.08 });
    Array.prototype.forEach.call(items, function (el) { io.observe(el); });
  })();

  /* ------------------------------------------------------ portfolio filter */
  (function filters() {
    var bar = document.querySelector('[data-filters]');
    var gallery = document.querySelector('[data-gallery]');
    if (!bar || !gallery) return;

    var items = gallery.querySelectorAll('[data-category]');
    var status = document.querySelector('[data-filter-status]');

    function apply(value) {
      var shown = 0;
      Array.prototype.forEach.call(items, function (item) {
        var match = value === 'all' || item.getAttribute('data-category') === value;
        item.hidden = !match;
        if (match) shown++;
      });
      Array.prototype.forEach.call(bar.querySelectorAll('button'), function (btn) {
        btn.setAttribute('aria-pressed', String(btn.getAttribute('data-filter') === value));
      });
      if (status) {
        status.textContent = shown + (shown === 1 ? ' image' : ' images') +
          (value === 'all' ? '' : ' in ' + value);
      }
      // Keep the lightbox sequence in step with what is visible.
      document.dispatchEvent(new CustomEvent('gallery:filtered'));
    }

    bar.addEventListener('click', function (e) {
      var btn = e.target.closest('button[data-filter]');
      if (!btn) return;
      var value = btn.getAttribute('data-filter');
      apply(value);
      history.replaceState(null, '', value === 'all' ? location.pathname : '#' + value);
    });

    var initial = (location.hash || '').replace('#', '');
    apply(initial && bar.querySelector('[data-filter="' + initial + '"]') ? initial : 'all');
  })();

  /* -------------------------------------------------------------- lightbox */
  (function lightbox() {
    var dialog = document.querySelector('[data-lightbox]');
    if (!dialog || typeof dialog.showModal !== 'function') return;

    var img = dialog.querySelector('[data-lightbox-img]');
    var caption = dialog.querySelector('[data-lightbox-caption]');
    var count = dialog.querySelector('[data-lightbox-count]');
    var opener = null;
    var slides = [];
    var index = 0;

    var scope = document;

    // Sequence only within the group the opened image belongs to. Several
    // galleries can share a page - the portfolio grid and the depth gallery
    // both sit on /portfolio/ - and mixing them means the arrow keys walk out
    // of the set the visitor is actually looking at.
    function collect() {
      slides = Array.prototype.filter.call(
        scope.querySelectorAll('[data-lightbox-item]'),
        function (btn) { return !btn.closest('[hidden]'); }
      );
    }

    function show(i) {
      if (!slides.length) return;
      index = (i + slides.length) % slides.length;
      var btn = slides[index];
      var source = btn.querySelector('img');
      img.src = btn.getAttribute('data-full') || (source && source.currentSrc) || source.src;
      img.alt = source ? source.alt : '';
      caption.textContent = btn.getAttribute('data-caption') || '';
      count.textContent = (index + 1) + ' / ' + slides.length;
    }

    document.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-lightbox-item]');
      if (!btn) return;
      scope = btn.closest('[data-lightbox-group]') || document;
      collect();
      opener = btn;
      show(slides.indexOf(btn));
      dialog.showModal();
    });

    dialog.addEventListener('click', function (e) {
      var action = e.target.closest('[data-lightbox-action]');
      if (action) {
        var kind = action.getAttribute('data-lightbox-action');
        if (kind === 'close') dialog.close();
        if (kind === 'prev') show(index - 1);
        if (kind === 'next') show(index + 1);
        return;
      }
      // Click on the surrounding backdrop closes.
      if (e.target === dialog) dialog.close();
    });

    dialog.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft') { e.preventDefault(); show(index - 1); }
      if (e.key === 'ArrowRight') { e.preventDefault(); show(index + 1); }
    });

    dialog.addEventListener('close', function () {
      img.removeAttribute('src');
      if (opener) opener.focus();
    });

    document.addEventListener('gallery:filtered', collect);
  })();

  /* ---------------------------------------------------------- testimonials */
  (function quotes() {
    var root = document.querySelector('[data-quotes]');
    if (!root) return;
    var slides = root.querySelectorAll('.quote');
    var dots = root.querySelectorAll('[data-quote-dot]');
    if (slides.length < 2) return;
    var current = 0;
    var timer = null;

    function go(i) {
      current = (i + slides.length) % slides.length;
      Array.prototype.forEach.call(slides, function (s, n) { s.classList.toggle('is-active', n === current); });
      Array.prototype.forEach.call(dots, function (d, n) { d.setAttribute('aria-pressed', String(n === current)); });
    }

    function start() {
      if (reduceMotion) return;
      stop();
      timer = setInterval(function () { go(current + 1); }, 7000);
    }
    function stop() { if (timer) clearInterval(timer); }

    Array.prototype.forEach.call(dots, function (dot, n) {
      dot.addEventListener('click', function () { go(n); start(); });
    });
    root.addEventListener('mouseenter', stop);
    root.addEventListener('mouseleave', start);
    root.addEventListener('focusin', stop);

    go(0);
    start();
  })();

  /* ------------------------------------------------- google reviews slider */
  (function reviews() {
    var root = document.querySelector('[data-reviews]');
    if (!root) return;
    var track = root.querySelector('[data-reviews-track]');
    var slides = root.querySelectorAll('[data-review-slide]');
    var dots = root.querySelectorAll('[data-review-dot]');
    var status = root.querySelector('[data-reviews-status]');
    var prev = root.querySelector('[data-reviews-prev]');
    var next = root.querySelector('[data-reviews-next]');
    if (!track || slides.length < 2) return;

    var current = 0;
    var timer = null;

    function go(i) {
      current = (i + slides.length) % slides.length;
      track.style.transform = 'translateX(' + (-current * 100) + '%)';
      Array.prototype.forEach.call(slides, function (s, n) {
        // Hide the off-screen slides from assistive tech and from tab order.
        s.setAttribute('aria-hidden', String(n !== current));
      });
      Array.prototype.forEach.call(dots, function (d, n) {
        d.setAttribute('aria-pressed', String(n === current));
      });
      if (status) status.textContent = 'Review ' + (current + 1) + ' of ' + slides.length;
    }

    function start() {
      if (reduceMotion) return;
      stop();
      timer = setInterval(function () { go(current + 1); }, 7000);
    }
    function stop() { if (timer) { clearInterval(timer); timer = null; } }

    Array.prototype.forEach.call(dots, function (dot, n) {
      dot.addEventListener('click', function () { go(n); start(); });
    });
    if (prev) prev.addEventListener('click', function () { go(current - 1); start(); });
    if (next) next.addEventListener('click', function () { go(current + 1); start(); });

    root.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft') { go(current - 1); start(); }
      else if (e.key === 'ArrowRight') { go(current + 1); start(); }
    });

    root.addEventListener('mouseenter', stop);
    root.addEventListener('mouseleave', start);
    root.addEventListener('focusin', stop);
    root.addEventListener('focusout', function (e) {
      if (!root.contains(e.relatedTarget)) start();
    });
    // Autoplay while the section is off-screen is wasted work.
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) stop(); else start();
    });

    // Horizontal drag advances the slider; vertical drag must still scroll the
    // page, so the gesture is axis-locked before it takes over.
    var x0 = 0, y0 = 0, axis = null;
    root.addEventListener('pointerdown', function (e) {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      x0 = e.clientX; y0 = e.clientY; axis = null; stop();
    });
    root.addEventListener('pointermove', function (e) {
      if (!x0 && !y0) return;
      var dx = e.clientX - x0, dy = e.clientY - y0;
      if (!axis && (Math.abs(dx) > 6 || Math.abs(dy) > 6)) {
        axis = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
      }
    });
    root.addEventListener('pointerup', function (e) {
      var dx = e.clientX - x0;
      if (axis === 'x' && Math.abs(dx) > 40) go(current + (dx < 0 ? 1 : -1));
      x0 = 0; y0 = 0; axis = null; start();
    });

    go(0);
    start();
  })();

  /* ------------------------------------------------------------- accordion */
  (function accordion() {
    var triggers = document.querySelectorAll('.accordion__trigger');
    if (!triggers.length) return;

    Array.prototype.forEach.call(triggers, function (trigger) {
      var panel = document.getElementById(trigger.getAttribute('aria-controls'));
      if (!panel) return;
      if (trigger.getAttribute('aria-expanded') === 'true') {
        panel.style.height = 'auto';
      }

      trigger.addEventListener('click', function () {
        var open = trigger.getAttribute('aria-expanded') === 'true';
        trigger.setAttribute('aria-expanded', String(!open));

        if (open) {
          panel.style.height = panel.scrollHeight + 'px';
          requestAnimationFrame(function () { panel.style.height = '0px'; });
        } else {
          panel.style.height = panel.scrollHeight + 'px';
          panel.addEventListener('transitionend', function once() {
            panel.style.height = 'auto';
            panel.removeEventListener('transitionend', once);
          });
        }
      });
    });
  })();

  /* ------------------------------------------------------------------ form */
  (function enquiryForm() {
    var form = document.querySelector('[data-enquiry-form]');
    if (!form) return;
    var status = form.querySelector('[data-form-status]');

    function fieldOf(input) { return input.closest('.field'); }

    function validate(input) {
      var wrap = fieldOf(input);
      if (!wrap) return true;
      var ok = input.checkValidity();
      wrap.classList.toggle('is-invalid', !ok);
      var error = wrap.querySelector('.error');
      if (error && !ok) {
        error.textContent = input.validationMessage;
      }
      return ok;
    }

    Array.prototype.forEach.call(form.querySelectorAll('input, select, textarea'), function (input) {
      input.addEventListener('blur', function () { validate(input); });
      input.addEventListener('input', function () {
        if (fieldOf(input) && fieldOf(input).classList.contains('is-invalid')) validate(input);
      });
    });

    form.addEventListener('submit', function (e) {
      var fields = form.querySelectorAll('input, select, textarea');
      var valid = true;
      var firstBad = null;

      Array.prototype.forEach.call(fields, function (input) {
        if (input.type === 'hidden' || input.name === 'company') return;
        if (!validate(input)) {
          valid = false;
          if (!firstBad) firstBad = input;
        }
      });

      if (!valid) {
        e.preventDefault();
        if (firstBad) firstBad.focus();
        if (status) {
          status.hidden = false;
          status.textContent = 'Please check the highlighted fields and try again.';
        }
        return;
      }

      // Honeypot: bots fill hidden fields, humans never see them.
      var trap = form.querySelector('input[name="company"]');
      if (trap && trap.value) {
        e.preventDefault();
        return;
      }

      // No endpoint wired up yet - keep the visitor informed instead of
      // silently posting into the void. See README for wiring options.
      if (!form.getAttribute('action')) {
        e.preventDefault();
        if (status) {
          status.hidden = false;
          status.textContent = 'This form is not connected to a mail service yet. ' +
            'Add a form endpoint to the form\'s action attribute, or email hello@nishchayphotography.ca directly.';
        }
        return;
      }

      var submit = form.querySelector('button[type="submit"]');
      if (submit) {
        submit.disabled = true;
        submit.textContent = 'Sending…';
      }
    });
  })();

  /* -------------------------------------------------- enquiry pre-filling */
  (function prefill() {
    var form = document.querySelector('[data-enquiry-form]');
    if (!form || !window.URLSearchParams) return;

    var params = new URLSearchParams(window.location.search);
    var pack = params.get('package');
    var service = params.get('service');

    // "Check availability" buttons on the services page carry the collection
    // the visitor was reading, so the enquiry arrives with context attached.
    var packages = {
      'intimate': { service: 'elopement', label: 'The Intimate collection' },
      'full-day': { service: 'wedding', label: 'The Full Day collection' },
      'multi-event': { service: 'multi-event', label: 'The Multi-Event collection' }
    };

    var select = form.querySelector('#service');
    var message = form.querySelector('#message');
    var chosen = pack && packages[pack];

    if (chosen && select) select.value = chosen.service;
    if (service && select && select.querySelector('option[value="' + service + '"]')) {
      select.value = service;
    }
    if (chosen && message && !message.value) {
      message.value = 'I was reading about ' + chosen.label + '. ';
    }

    if (chosen) {
      var hidden = document.createElement('input');
      hidden.type = 'hidden';
      hidden.name = 'interested_in';
      hidden.value = chosen.label;
      form.appendChild(hidden);
    }
  })();

  /* ---------------------------------------------------- depth gallery ---- */
  (function depthGallery() {
    var root = document.querySelector('[data-depth]');
    if (!root) return;

    var stage = root.querySelector('[data-depth-stage]');
    var field = root.querySelector('[data-depth-field]');
    var source = root.querySelector('[data-depth-source]');
    var tabs = root.querySelector('[data-depth-tabs]');
    var status = root.querySelector('[data-depth-status]');
    var prevBtn = root.querySelector('[data-depth-prev]');
    var nextBtn = root.querySelector('[data-depth-next]');
    if (!stage || !field || !source) return;

    var DEPTH = 2200;          // px from the far wall to the camera plane
    var NEAR = 300;            // how far past the camera a frame travels
    var MIN_SLOTS = 9;         // repeat a short set so the corridor stays full
    var MAX_SLOTS = 12;        // more than this and the corridor reads as a pile
    var STEP = 0;              // spacing between frames, set per category

    var items = Array.prototype.map.call(source.querySelectorAll('li'), function (li) {
      var img = li.querySelector('img');
      return {
        category: li.getAttribute('data-category'),
        caption: li.getAttribute('data-caption') || '',
        src: img.getAttribute('src'),
        alt: img.getAttribute('alt') || ''
      };
    });
    if (!items.length) return;

    var planes = [];
    var pos = 0;               // travel along the corridor, px
    var velocity = 0;
    var dragging = false;
    var paused = false;
    var visible = false;
    var frame = null;
    var current = '';

    // A deterministic scatter keeps frames off the centre line without
    // overlapping; Math.random would reshuffle on every category switch.
    function scatter(i) {
      var a = i * 2.399963;                  // golden angle, even distribution
      var r = 0.34 + 0.66 * ((i * 0.618033) % 1);
      return { x: Math.cos(a) * r * 250, y: Math.sin(a) * r * 155 };
    }

    function build(category) {
      var pool = items.filter(function (it) {
        return category === 'all' || it.category === category;
      });
      if (!pool.length) return;

      var slots = Math.min(MAX_SLOTS, Math.max(MIN_SLOTS, pool.length));
      STEP = DEPTH / slots;

      field.innerHTML = '';
      planes = [];

      for (var i = 0; i < slots; i++) {
        var it = pool[i % pool.length];
        var off = scatter(i);

        var fig = document.createElement('figure');
        fig.className = 'depth__plane';

        var btn = document.createElement('button');
        btn.type = 'button';
        btn.setAttribute('data-lightbox-item', '');
        btn.setAttribute('data-full', it.src);
        btn.setAttribute('data-caption', it.caption);

        var img = document.createElement('img');
        img.src = it.src;
        img.alt = it.alt;
        img.loading = 'lazy';
        img.decoding = 'async';

        btn.appendChild(img);
        fig.appendChild(btn);
        field.appendChild(fig);

        planes.push({ el: fig, base: i * STEP, x: off.x, y: off.y, caption: it.caption, blur: -1 });
      }

      pos = 0;
      // The field is decorative duplication of the source list, which stays in
      // the DOM for assistive tech and for the no-JS case.
      field.removeAttribute('aria-hidden');
      field.setAttribute('aria-hidden', 'true');
      layout();
      announce();
      document.dispatchEvent(new CustomEvent('gallery:filtered'));
    }

    function layout() {
      for (var i = 0; i < planes.length; i++) {
        var p = planes[i];
        // Wrap into [0, DEPTH): 0 is at the camera, DEPTH is the far wall.
        var d = (p.base - pos) % DEPTH;
        if (d < 0) d += DEPTH;
        var z = NEAR - d;                      // +NEAR (past viewer) .. -(DEPTH-NEAR)
        var t = d / DEPTH;                     // 0 near, 1 far

        // Fade in from the far wall, fade out as it passes the camera.
        var opacity = 0.35 + 0.65 * (1 - t);        // recede into the dark
        if (t > 0.80) opacity *= Math.max(0, (1 - t) / 0.20);
        else if (d < 120) opacity *= Math.max(0, d / 120);

        // Blur far frames; quantised so the filter is not rebuilt every frame.
        var blur = t > 0.62 ? Math.round(((t - 0.62) / 0.38) * 4 * 2) / 2 : 0;

        var el = p.el;
        el.style.transform = 'translate3d(calc(-50% + ' + p.x.toFixed(0) + 'px), calc(-50% + ' +
          p.y.toFixed(0) + 'px), ' + z.toFixed(0) + 'px)';
        el.style.opacity = opacity.toFixed(2);
        if (blur !== p.blur) {
          el.style.filter = blur > 0 ? 'blur(' + blur + 'px)' : '';
          p.blur = blur;
        }
        // Only the frames in the readable band should be clickable.
        el.style.pointerEvents = (t < 0.42 && d > 140) ? 'auto' : 'none';
      }
    }

    function announce() {
      if (!status || !planes.length) return;
      var best = null, bestD = Infinity;
      for (var i = 0; i < planes.length; i++) {
        var d = (planes[i].base - pos) % DEPTH;
        if (d < 0) d += DEPTH;
        if (d < bestD && d > 100) { bestD = d; best = planes[i]; }
      }
      if (best) status.innerHTML = best.caption;
    }

    function tick() {
      frame = null;
      if (!dragging) {
        if (Math.abs(velocity) > 0.05) {
          pos += velocity;
          velocity *= 0.94;
          if (Math.abs(velocity) <= 0.05) announce();
        } else if (visible && !paused && !reduceMotion) {
          pos += 0.55;                          // slow drift toward the viewer
        }
      }
      layout();
      schedule();
    }

    function schedule() {
      var resting = Math.abs(velocity) <= 0.05 &&
        (dragging || paused || !visible || reduceMotion);
      if (resting || frame) return;
      frame = window.requestAnimationFrame(tick);
    }

    function nudge(by) {
      pos += by;
      layout();
      announce();
      schedule();
    }

    /* --- input ---------------------------------------------------------- */
    // Drag is horizontal, not vertical. The stage sets touch-action: pan-y so
    // the page still scrolls under a vertical swipe; a vertical drag here would
    // fight that, moving the corridor and scrolling the page at the same time.
    var startX = 0, startY = 0, startPos = 0, lastX = 0, moved = false, axis = null;

    stage.addEventListener('pointerdown', function (e) {
      if (e.button !== undefined && e.button !== 0) return;
      dragging = true; moved = false; axis = null;
      startX = lastX = e.clientX;
      startY = e.clientY;
      startPos = pos; velocity = 0;
    });
    stage.addEventListener('pointermove', function (e) {
      if (!dragging) return;
      var dx = e.clientX - startX;
      var dy = e.clientY - startY;
      // Lock the axis on the first real movement. A mostly-vertical swipe
      // belongs to the page, not to this gallery, and must not drag it.
      if (!axis && (Math.abs(dx) > 6 || Math.abs(dy) > 6)) {
        axis = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
        if (axis === 'x') {
          moved = true;
          stage.setPointerCapture(e.pointerId);
        }
      }
      if (axis !== 'x') return;
      pos = startPos + dx * 2.2;
      velocity = (e.clientX - lastX) * 2.2;
      lastX = e.clientX;
      layout();
    });
    function endDrag(e) {
      if (!dragging) return;
      dragging = false;
      if (e && e.pointerId !== undefined && stage.hasPointerCapture(e.pointerId)) {
        stage.releasePointerCapture(e.pointerId);
      }
      if (reduceMotion) velocity = 0;
      announce();
      schedule();
    }
    stage.addEventListener('pointerup', endDrag);
    stage.addEventListener('pointercancel', endDrag);
    stage.addEventListener('click', function (e) {
      if (moved) { e.preventDefault(); e.stopPropagation(); moved = false; }
    }, true);

    // Arrow keys are handled on the stage only, never on document: hijacking
    // them globally would break ordinary keyboard scrolling of the page.
    stage.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') { e.preventDefault(); nudge(-STEP); }
      if (e.key === 'ArrowDown' || e.key === 'ArrowRight') { e.preventDefault(); nudge(STEP); }
    });
    if (prevBtn) prevBtn.addEventListener('click', function () { nudge(-STEP); });
    if (nextBtn) nextBtn.addEventListener('click', function () { nudge(STEP); });

    if (tabs) {
      tabs.addEventListener('click', function (e) {
        var btn = e.target.closest('button[data-depth-cat]');
        if (!btn) return;
        var cat = btn.getAttribute('data-depth-cat');
        if (cat === current) return;
        current = cat;
        Array.prototype.forEach.call(tabs.querySelectorAll('button'), function (b) {
          b.setAttribute('aria-pressed', String(b === btn));
        });
        build(cat);
        schedule();
      });
    }

    ['pointerenter', 'focusin'].forEach(function (evt) {
      stage.addEventListener(evt, function () { paused = true; announce(); });
    });
    ['pointerleave', 'focusout'].forEach(function (evt) {
      stage.addEventListener(evt, function () { paused = false; schedule(); });
    });

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        visible = entries[0].isIntersecting;
        schedule();
      }, { threshold: 0.1 }).observe(stage);
    } else {
      visible = true;
    }

    window.addEventListener('resize', layout);

    current = 'all';
    build('all');
    source.hidden = true;      // the 3D field replaces the fallback grid
    schedule();
  })();

  /* ------------------------------------------------- interactive hero --- */
  (function heroStage() {
    var stage = document.querySelector('[data-hero]');
    if (!stage) return;

    var video = stage.querySelector('[data-hero-video]');
    var slides = Array.prototype.slice.call(stage.querySelectorAll('.hero__slide'));
    var dots = Array.prototype.slice.call(document.querySelectorAll('[data-hero-dots] button'));
    var index = 0, timer = null;

    /* --- video, only if one has actually been supplied ------------------- */
    // Opt-in by attribute rather than probing for a file: an empty value means
    // no request at all, instead of a 404 on every page load.
    var videoSrc = video && video.getAttribute('data-hero-src');
    if (video && videoSrc && !reduceMotion) {
      video.src = videoSrc;
      var attempt = video.play();
      if (attempt && attempt.then) {
        attempt.then(function () {
          video.classList.add('is-playing');
          stop();
        }).catch(function () {
          // Autoplay refused, or the file is missing - the stills carry on.
        });
      }
    }

    /* --- crossfading stills ---------------------------------------------- */
    function show(i) {
      if (!slides.length) return;
      index = (i + slides.length) % slides.length;
      slides.forEach(function (el, n) { el.classList.toggle('is-active', n === index); });
      dots.forEach(function (d, n) { d.setAttribute('aria-pressed', String(n === index)); });
      // Restart the push so each frame gets its own slow move.
      var active = slides[index];
      if (!reduceMotion) {
        active.style.animation = 'none';
        void active.offsetWidth;
        active.style.animation = '';
      }
    }
    function start() {
      if (reduceMotion || slides.length < 2) return;
      stop();
      timer = setInterval(function () { show(index + 1); }, 7000);
    }
    function stop() { if (timer) { clearInterval(timer); timer = null; } }

    dots.forEach(function (dot, n) {
      dot.addEventListener('click', function () { show(n); start(); });
    });

    // Pause while the tab is hidden; nothing to animate for nobody.
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) stop(); else start();
    });

    show(0);
    start();
  })();

  /* ------------------------------------------------- pointer tilt -------- */
  (function tilt3d() {
    // Tilt is a pointer affordance: pointless on touch, unwanted with reduced
    // motion, and expensive on low-end devices driving a large grid.
    if (reduceMotion) return;
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

    var MAX = 5;                       // degrees; past ~6 it reads as a gimmick
    var targets = document.querySelectorAll('.card.reveal, .package.reveal');
    if (!targets.length) return;

    var pending = null;

    function apply(el, e) {
      var r = el.getBoundingClientRect();
      var px = (e.clientX - r.left) / r.width - 0.5;
      var py = (e.clientY - r.top) / r.height - 0.5;
      el.style.setProperty('--tilt-x', (px * MAX * 2).toFixed(2) + 'deg');
      el.style.setProperty('--tilt-y', (-py * MAX * 2).toFixed(2) + 'deg');
    }

    Array.prototype.forEach.call(targets, function (el) {
      el.addEventListener('pointerenter', function () { el.classList.add('is-tilting'); });
      el.addEventListener('pointermove', function (e) {
        if (pending) return;                       // one update per frame
        pending = window.requestAnimationFrame(function () {
          pending = null;
          apply(el, e);
        });
      });
      el.addEventListener('pointerleave', function () {
        el.classList.remove('is-tilting');
        el.style.setProperty('--tilt-x', '0deg');
        el.style.setProperty('--tilt-y', '0deg');
      });
    });
  })();

  /* ------------------------------------------------- hero parallax ------- */
  (function heroDepth() {
    if (reduceMotion) return;
    var media = document.querySelector('.hero .hero__media');
    if (!media) return;

    var fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    var px = 0, py = 0, scrollY = 0, queued = false;

    function paint() {
      queued = false;
      media.style.setProperty('--hero-px', px.toFixed(1) + 'px');
      media.style.setProperty('--hero-py', (py + scrollY).toFixed(1) + 'px');
    }
    function queue() {
      if (queued) return;
      queued = true;
      window.requestAnimationFrame(paint);
    }

    if (fine) {
      window.addEventListener('pointermove', function (e) {
        px = (e.clientX / window.innerWidth - 0.5) * -24;
        py = (e.clientY / window.innerHeight - 0.5) * -18;
        queue();
      }, { passive: true });
    }

    window.addEventListener('scroll', function () {
      // Stop once the hero is off screen - no point animating what nobody sees.
      var y = window.pageYOffset;
      if (y > window.innerHeight) return;
      scrollY = y * 0.18;
      queue();
    }, { passive: true });
  })();

  /* ---------------------------------------------------- 3D carousel ------ */
  (function carousel3d() {
    var root = document.querySelector('[data-carousel3d]');
    if (!root) return;

    var ring = root.querySelector('[data-carousel3d-ring]');
    var faces = Array.prototype.slice.call(root.querySelectorAll('.carousel3d__face'));
    var status = root.querySelector('[data-carousel3d-status]');
    var prev = root.querySelector('[data-carousel3d-prev]');
    var next = root.querySelector('[data-carousel3d-next]');
    if (!ring || faces.length < 3) return;

    var count = faces.length;
    var step = 360 / count;
    var angle = 0;             // current ring rotation, degrees
    var velocity = 0;          // degrees per frame, from a drag throw
    var target = null;         // set when stepping to a specific face
    var dragging = false;
    var paused = false;
    var visible = false;
    var frame = null;
    var lastDim = 0;

    // Radius that seats `count` faces of `faceWidth` edge-to-edge around a ring.
    function layout() {
      var faceWidth = ring.getBoundingClientRect().width;
      // The bare trig seats faces edge-to-edge, which reads as one continuous
      // wall; pushing the ring out leaves air between the photographs.
      var radius = ((faceWidth / 2) / Math.tan(Math.PI / count)) * 1.42;
      faces.forEach(function (face, i) {
        face.style.transform = 'rotateY(' + (i * step) + 'deg) translateZ(' + radius + 'px)';
      });
    }

    function frontIndex() {
      return ((Math.round(-angle / step) % count) + count) % count;
    }

    function describe() {
      if (!status) return;
      var btn = faces[frontIndex()].querySelector('[data-caption]');
      var caption = btn ? btn.getAttribute('data-caption') : '';
      status.innerHTML = (frontIndex() + 1) + ' / ' + count +
        (caption ? ' &mdash; ' + caption : '');
    }

    function render(now) {
      ring.style.setProperty('--angle', angle.toFixed(2) + 'deg');
      // Dim faces by how far they have turned from the front. Throttled, since
      // filter recalculation on every face every frame is wasteful.
      if (!now || now - lastDim > 80) {
        lastDim = now || 0;
        faces.forEach(function (face, i) {
          var world = (i * step + angle) * Math.PI / 180;
          var facing = (Math.cos(world) + 1) / 2;          // 1 at front, 0 at back
          face.style.setProperty('--face-dim', (0.4 + facing * 0.6).toFixed(3));
        });
      }
    }

    function tick(now) {
      frame = null;
      if (target !== null) {
        var delta = target - angle;
        if (Math.abs(delta) < 0.05) { angle = target; target = null; describe(); }
        else angle += delta * 0.14;
      } else if (Math.abs(velocity) > 0.02) {
        angle += velocity;
        velocity *= 0.94;
        if (Math.abs(velocity) <= 0.02) describe();
      } else if (!paused && !dragging && visible && !reduceMotion) {
        angle -= 0.08;                                     // idle drift
      }
      render(now);
      schedule();
    }

    function schedule() {
      var idle = target === null && Math.abs(velocity) <= 0.02;
      var resting = idle && (paused || dragging || !visible || reduceMotion);
      if (resting || frame) return;
      frame = window.requestAnimationFrame(tick);
    }

    function goTo(index) {
      target = -index * step;
      velocity = 0;
      if (reduceMotion) { angle = target; target = null; render(); describe(); return; }
      schedule();
    }

    function stepBy(n) { goTo(frontIndex() + n); }

    /* --- pointer drag ------------------------------------------------- */
    var startX = 0, startY = 0, startAngle = 0, lastX = 0, moved = false, axis = null;

    ring.addEventListener('pointerdown', function (e) {
      if (e.button !== undefined && e.button !== 0) return;
      dragging = true; moved = false; axis = null;
      startX = lastX = e.clientX;
      startY = e.clientY;
      startAngle = angle;
      target = null; velocity = 0;
      // Capture is deferred until the pointer actually moves: capturing on
      // pointerdown retargets the click and swallows taps on a face.
    });

    ring.addEventListener('pointermove', function (e) {
      if (!dragging) return;
      var dx = e.clientX - startX;
      var dy = e.clientY - startY;
      // Same axis lock as the depth gallery: a vertical swipe scrolls the page
      // and must not nudge the ring on the way past.
      if (!axis && (Math.abs(dx) > 6 || Math.abs(dy) > 6)) {
        axis = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
        if (axis === 'x') {
          moved = true;
          ring.setPointerCapture(e.pointerId);
        }
      }
      if (axis !== 'x') return;
      angle = startAngle + dx * 0.25;
      velocity = (e.clientX - lastX) * 0.25;
      lastX = e.clientX;
      render();
    });

    function endDrag(e) {
      if (!dragging) return;
      dragging = false;
      if (e && e.pointerId !== undefined && ring.hasPointerCapture(e.pointerId)) {
        ring.releasePointerCapture(e.pointerId);
      }
      if (reduceMotion) { velocity = 0; goTo(frontIndex()); }
      else schedule();
    }
    ring.addEventListener('pointerup', endDrag);
    ring.addEventListener('pointercancel', endDrag);

    // A drag that moved should not also open the lightbox on release.
    ring.addEventListener('click', function (e) {
      if (moved) { e.preventDefault(); e.stopPropagation(); moved = false; }
    }, true);

    /* --- keyboard, buttons, pausing ------------------------------------ */
    ring.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft') { e.preventDefault(); stepBy(-1); }
      if (e.key === 'ArrowRight') { e.preventDefault(); stepBy(1); }
    });
    if (prev) prev.addEventListener('click', function () { stepBy(-1); });
    if (next) next.addEventListener('click', function () { stepBy(1); });

    ['pointerenter', 'focusin'].forEach(function (evt) {
      root.addEventListener(evt, function () { paused = true; });
    });
    ['pointerleave', 'focusout'].forEach(function (evt) {
      root.addEventListener(evt, function () { paused = false; schedule(); });
    });

    // Only animate while the carousel is actually on screen.
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        visible = entries[0].isIntersecting;
        schedule();
      }, { threshold: 0.15 }).observe(root);
    } else {
      visible = true;
    }

    var resizeTimer = null;
    window.addEventListener('resize', function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(layout, 150);
    });

    layout();
    render();
    describe();
    schedule();
  })();

  /* ------------------------------------------------- studio assistant ---- */
  (function assistant() {
    var toggle = document.querySelector('[data-chat-toggle]');
    var panel = document.querySelector('[data-chat-panel]');
    if (!toggle || !panel) return;

    var log = panel.querySelector('[data-chat-log]');
    var replies = panel.querySelector('[data-chat-replies]');
    var closeBtn = panel.querySelector('[data-chat-close]');
    var label = toggle.querySelector('[data-chat-label]');

    var WHATSAPP = 'https://wa.me/14165550142';

    // Answers mirror the FAQ and pricing already published on the site. This
    // is a lookup, not a live chat - nothing is sent anywhere, and every
    // branch ends by handing off to a human rather than leaving a question
    // sitting in a queue nobody is watching at a weekend wedding.
    var TOPICS = {
      start: {
        reply: '<p>Hello. I can answer the common questions straight away &mdash; pricing, availability, turnaround and what is included.</p><p>What would be useful?</p>',
        next: ['pricing', 'availability', 'turnaround', 'travel', 'human']
      },
      pricing: {
        label: 'What does it cost?',
        reply: '<p>Wedding collections start at <strong>$4,200 CAD</strong> (6 hours, one photographer) and run to <strong>$9,800</strong> for multi-day, multi-event coverage. The most-booked collection is <strong>$6,400</strong> for a full 10-hour day with a second shooter.</p><p>Portrait sessions start at $450, family at $520, and commercial at $1,850 a day. All prices exclude HST.</p><p><a href="/services/">See the full breakdown &rarr;</a></p>',
        next: ['included', 'availability', 'human']
      },
      availability: {
        label: 'Is my date free?',
        reply: '<p>I cannot see the live calendar, but the studio answers every enquiry within two business days with real availability.</p><p>Peak Saturdays (June, September, October) usually book 12&ndash;18 months out. Off-season and weekday dates are often open at three to six months.</p><p>Fastest route is to send the date directly.</p>',
        next: ['human', 'pricing']
      },
      turnaround: {
        label: 'When do we get photos?',
        reply: '<p>A sneak peek of 20&ndash;30 images lands within <strong>48 hours</strong>. The complete wedding gallery arrives within <strong>six weeks</strong> &mdash; that is contractual, not aspirational.</p><p>Portrait and family sessions are delivered within two weeks. Albums take a further four to six weeks after you approve the layout.</p>',
        next: ['included', 'human']
      },
      travel: {
        label: 'Do you travel?',
        reply: '<p>Travel within <strong>60 km of downtown Toronto</strong> is included in every wedding collection. Beyond that, mileage is charged at cost, plus accommodation if the day starts before 9am or ends after 10pm.</p><p>The studio regularly shoots Niagara, Muskoka, Prince Edward County and Ottawa, and takes on a few destination weddings a year.</p>',
        next: ['pricing', 'human']
      },
      included: {
        label: "What's included?",
        reply: '<p>Every collection includes edited high-resolution images, a private online gallery with print ordering, and a personal print release so you can print and share freely.</p><p>The full-day and multi-event collections add a second photographer, a complimentary engagement session and a timeline planning call.</p><p>Raw files are not included &mdash; the edit is a substantial part of the work.</p>',
        next: ['pricing', 'turnaround', 'human']
      },
      human: {
        label: 'Talk to a person',
        reply: '<p>Best move. Two options:</p><p><a href="' + WHATSAPP + '" target="_blank" rel="noopener">Message on WhatsApp</a> &mdash; usually the quickest reply.</p><p><a href="/contact/">Send a full enquiry</a> &mdash; include your date, venue and rough guest count and you will get availability plus a starting figure back within two business days.</p>',
        next: ['pricing', 'turnaround']
      }
    };

    function bubble(html, who) {
      var el = document.createElement('div');
      el.className = 'chat__msg chat__msg--' + who;
      el.innerHTML = html;
      log.appendChild(el);
      // Wait for layout, then park a long answer at its first line rather
      // than its last - scrolling to the bottom would open mid-sentence.
      requestAnimationFrame(function () {
        log.scrollTop = who === 'bot'
          ? Math.max(0, el.offsetTop - 12)
          : log.scrollHeight;
      });
    }

    function offer(ids) {
      replies.innerHTML = '';
      (ids || []).forEach(function (id) {
        var topic = TOPICS[id];
        if (!topic || !topic.label) return;
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.textContent = topic.label;
        btn.addEventListener('click', function () { ask(id); });
        replies.appendChild(btn);
      });
    }

    function ask(id) {
      var topic = TOPICS[id];
      if (!topic) return;
      if (topic.label) bubble('<p>' + topic.label + '</p>', 'user');
      replies.innerHTML = '';
      // A beat before the reply, so the log reads as a conversation.
      setTimeout(function () {
        bubble(topic.reply, 'bot');
        offer(topic.next);
      }, reduceMotion ? 0 : 380);
    }

    var started = false;
    function setOpen(open) {
      toggle.setAttribute('aria-expanded', String(open));
      panel.hidden = !open;
      if (label) label.textContent = open ? 'Close' : 'Ask a question';
      if (open && !started) {
        started = true;
        bubble(TOPICS.start.reply, 'bot');
        offer(TOPICS.start.next);
      }
      if (open) panel.querySelector('[data-chat-close]').focus();
    }

    toggle.addEventListener('click', function () {
      setOpen(toggle.getAttribute('aria-expanded') !== 'true');
    });
    closeBtn.addEventListener('click', function () {
      setOpen(false);
      toggle.focus();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
        setOpen(false);
        toggle.focus();
      }
    });
  })();

  /* --------------------------------------------- floating stack tucking -- */
  (function tuckWidgets() {
    var stack = document.querySelector('[data-widgets]');
    if (!stack) return;

    var panel = stack.querySelector('[data-chat-panel]');
    var launcher = stack.querySelector('[data-widgets-toggle]');

    // Mobile launcher: expands the two action buttons.
    if (launcher) {
      launcher.addEventListener('click', function () {
        var open = stack.classList.toggle('is-open');
        launcher.setAttribute('aria-expanded', String(open));
      });
      document.addEventListener('click', function (e) {
        if (!stack.contains(e.target) && stack.classList.contains('is-open')) {
          stack.classList.remove('is-open');
          launcher.setAttribute('aria-expanded', 'false');
        }
      });
      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && stack.classList.contains('is-open')) {
          stack.classList.remove('is-open');
          launcher.setAttribute('aria-expanded', 'false');
          launcher.focus();
        }
      });
    }
    var lastY = window.pageYOffset;
    var idle = null;

    function tucked(on) {
      // Never hide it while the assistant is open - that would pull the panel
      // the reader is using off the screen.
      if (on && panel && !panel.hidden) return;
      stack.classList.toggle('is-tucked', on);
    }

    window.addEventListener('scroll', function () {
      var y = window.pageYOffset;
      if (y > lastY + 4) tucked(true);        // moving down: get out of the way
      else if (y < lastY - 4) tucked(false);  // moving back up: return
      lastY = y;
      clearTimeout(idle);
      idle = setTimeout(function () { tucked(false); }, 550);
    }, { passive: true });


    // A form field must never sit under the stack while it is being filled in.
    document.addEventListener('focusin', function (e) {
      if (e.target.closest('input, textarea, select') && !stack.contains(e.target)) tucked(true);
    });
    document.addEventListener('focusout', function (e) {
      if (e.target.closest('input, textarea, select')) {
        setTimeout(function () {
          var a = document.activeElement;
          if (!a || !a.closest || !a.closest('input, textarea, select')) tucked(false);
        }, 60);
      }
    });
  })();

  /* ---------------------------------------------------------- misc details */
  (function misc() {
    var year = document.querySelector('[data-year]');
    if (year) year.textContent = new Date().getFullYear();
  })();
})();
