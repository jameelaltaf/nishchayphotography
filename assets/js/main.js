/* =========================================================================
   Nishchay Photography - site behaviour
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

    function collect() {
      slides = Array.prototype.filter.call(
        document.querySelectorAll('[data-lightbox-item]'),
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

  /* ---------------------------------------------------------- misc details */
  (function misc() {
    var year = document.querySelector('[data-year]');
    if (year) year.textContent = new Date().getFullYear();
  })();
})();
