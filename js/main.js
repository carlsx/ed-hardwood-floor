/* ==========================================================================
   ED HARDWOOD FLOOR — main.js
   --------------------------------------------------------------------------
   Plain JavaScript, no libraries, no build step.
   You normally do NOT need to edit this file:
     • Words on the page ........ js/translations.js
     • Projects / reviews ....... js/site-data.js
     • Form address (Formspree) . index.html  (action="" on <form id="estimate-form">)

   Contents:
     1. Helpers                 5. Scroll-spy (highlight current nav link)
     2. Language (EN/PT/ES)     6. Projects + before/after slider
     3. Header + mobile menu    7. Reviews
     4. Mobile action bar       8. Estimate form
   ========================================================================== */
(function () {
  'use strict';

  /* 1. HELPERS ------------------------------------------------------------ */
  var T = window.EDHF_TRANSLATIONS || {};
  var SUPPORTED = ['en', 'pt', 'es'];
  var OG_LOCALE = { en: 'en_US', pt: 'pt_BR', es: 'es_US' };
  var lang = 'en';

  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function store(key, val) {
    try { if (val === undefined) return window.localStorage.getItem(key); window.localStorage.setItem(key, val); } catch (e) { /* storage blocked: ignore */ }
    return null;
  }

  /** Look up a translated string. {words} in braces are replaced from `vars`. */
  function t(key, vars) {
    var s = (T[lang] && T[lang][key] !== undefined) ? T[lang][key] : (T.en && T.en[key] !== undefined ? T.en[key] : key);
    if (vars) s = s.replace(/\{(\w+)\}/g, function (m, k) { return vars[k] !== undefined ? vars[k] : m; });
    return s;
  }

  /** Accepts plain text or { en, pt, es } and returns the current language. */
  function pick(v) {
    if (v === null || v === undefined) return '';
    if (typeof v === 'string') return v;
    return v[lang] || v.en || '';
  }

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]; });
  }

  /* 2. LANGUAGE ------------------------------------------------------------ */
  function setMeta(selector, attr, value) {
    var el = $(selector);
    if (el) el.setAttribute(attr, value);
  }

  function applyLanguage(code, persist) {
    if (SUPPORTED.indexOf(code) === -1) code = 'en';
    lang = code;
    document.documentElement.lang = code;

    $$('[data-i18n]').forEach(function (el) { el.textContent = t(el.getAttribute('data-i18n')); });

    // data-i18n-attr="placeholder:form.detailsPh; aria-label:nav.menuOpen"
    $$('[data-i18n-attr]').forEach(function (el) {
      el.getAttribute('data-i18n-attr').split(';').forEach(function (pair) {
        var p = pair.split(':');
        if (p.length === 2) el.setAttribute(p[0].trim(), t(p[1].trim()));
      });
    });

    // Page title + social tags
    if (T[code] && T[code]['meta.title']) {
      document.title = t('meta.title');
      setMeta('meta[name="description"]', 'content', t('meta.description'));
      setMeta('meta[property="og:title"]', 'content', t('meta.ogTitle'));
      setMeta('meta[property="og:description"]', 'content', t('meta.ogDescription'));
      setMeta('meta[property="og:locale"]', 'content', OG_LOCALE[code]);
      setMeta('meta[name="twitter:title"]', 'content', t('meta.ogTitle'));
      setMeta('meta[name="twitter:description"]', 'content', t('meta.ogDescription'));
    }

    $$('[data-lang]').forEach(function (btn) {
      btn.setAttribute('aria-pressed', btn.getAttribute('data-lang') === code ? 'true' : 'false');
    });

    var langField = $('#f-lang');
    if (langField) langField.value = code;

    syncMenuLabel();
    renderProjects();
    renderReviews();
    refreshFormErrors();
    var status = $('#form-status');
    if (status && status.dataset.key) status.textContent = t(status.dataset.key);

    if (persist) store('edhf-lang', code);
  }

  function initLanguage() {
    var wanted = null;
    try { wanted = new URLSearchParams(window.location.search).get('lang'); } catch (e) { /* old browser */ }
    if (!wanted || SUPPORTED.indexOf(wanted) === -1) wanted = store('edhf-lang') || 'en';
    $$('[data-lang]').forEach(function (btn) {
      btn.addEventListener('click', function () { applyLanguage(btn.getAttribute('data-lang'), true); });
    });
    applyLanguage(wanted, false);
  }

  /* 3. HEADER + MOBILE MENU ------------------------------------------------- */
  var header = $('#site-header');
  var menuBtn = $('#menu-toggle');
  var menuOpen = false;

  function syncMenuLabel() {
    if (menuBtn) menuBtn.setAttribute('aria-label', t(menuOpen ? 'nav.menuClose' : 'nav.menuOpen'));
  }

  function setMenu(open, returnFocus) {
    menuOpen = open;
    if (!header || !menuBtn) return;
    header.classList.toggle('menu-open', open);
    document.documentElement.classList.toggle('menu-lock', open);
    menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    syncMenuLabel();
    if (!open && returnFocus) menuBtn.focus();
  }

  function initHeader() {
    if (!header) return;
    var ticking = false;
    function onScroll() {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(function () {
        header.classList.toggle('is-scrolled', window.scrollY > 8);
        ticking = false;
      });
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    if (menuBtn) {
      menuBtn.addEventListener('click', function () { setMenu(!menuOpen); });
      $$('#mobile-menu a').forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });
      document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && menuOpen) setMenu(false, true); });
      window.addEventListener('resize', function () { if (menuOpen && window.innerWidth >= 1280) setMenu(false); });
    }
  }

  /* 4. MOBILE ACTION BAR (Call / Text / Free estimate) ----------------------
     Hidden while the estimate form is on screen or a field is focused, so it
     never covers what the visitor is typing.                                   */
  function initActionBar() {
    var bar = $('#action-bar');
    var form = $('#contact');
    if (!bar) return;
    var formVisible = false, typing = false;
    function update() { bar.classList.toggle('is-hidden', formVisible || typing); }

    if (form && 'IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        formVisible = entries[0].isIntersecting;
        update();
      }, { threshold: 0, rootMargin: '-35% 0px -15% 0px' }).observe(form);
    }
    document.addEventListener('focusin', function (e) {
      if (e.target.matches('input, textarea, select')) { typing = true; update(); }
    });
    document.addEventListener('focusout', function () { typing = false; update(); });
  }

  /* 5. SCROLL-SPY ----------------------------------------------------------- */
  function initScrollSpy() {
    if (!('IntersectionObserver' in window)) return;
    var ids = ['home', 'services', 'projects', 'about', 'contact', 'service-area', 'reviews'];
    var sections = $$('main section[id]');
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var id = entry.target.id;
        $$('.site-nav a, #mobile-menu nav a').forEach(function (a) {
          var on = ids.indexOf(id) !== -1 && a.getAttribute('href') === '#' + id;
          if (on) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current');
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px', threshold: 0 });
    sections.forEach(function (s) { io.observe(s); });
  }

  /* 6. PROJECTS + BEFORE/AFTER SLIDER --------------------------------------- */
  function projectCard(p) {
    var service = t('type.' + p.service);
    var city = p.city || '';
    var vars = { service: service.toLowerCase(), city: city };
    var altBefore = pick(p.altBefore) || t('projects.altBefore', vars);
    var altAfter = pick(p.altAfter) || t('projects.altAfter', vars);
    var wood = pick(p.wood);
    return '' +
      '<article class="project">' +
        '<div class="compare" style="--pos:50%">' +
          '<div class="compare__zoom">' +
            '<img class="compare__img" src="' + esc(p.before) + '" alt="' + esc(altBefore) + '" width="960" height="720" loading="lazy" decoding="async" draggable="false">' +
            '<img class="compare__img compare__img--after" src="' + esc(p.after) + '" alt="' + esc(altAfter) + '" width="960" height="720" loading="lazy" decoding="async" draggable="false">' +
            '<span class="compare__line"></span>' +
            '<span class="compare__knob" aria-hidden="true"><svg class="icon"><use href="#i-arrows"/></svg></span>' +
          '</div>' +
          '<span class="compare__tag compare__tag--before">' + esc(t('projects.before')) + '</span>' +
          '<span class="compare__tag compare__tag--after">' + esc(t('projects.after')) + '</span>' +
          (p.placeholder ? '<span class="compare__sample">' + esc(t('projects.sample')) + '</span>' : '') +
          '<span class="compare__hint">' + esc(t('projects.drag')) + '</span>' +
          '<input class="compare__range" type="range" min="0" max="100" value="50" aria-label="' + esc(t('projects.slider')) + '">' +
        '</div>' +
        '<div class="project__meta">' +
          '<div class="project__row">' +
            '<p class="project__city"><svg class="icon" aria-hidden="true"><use href="#i-pin"/></svg>' + esc(city) + '</p>' +
            '<p class="project__service">' + esc(service) + '</p>' +
          '</div>' +
          (wood ? '<p class="project__wood">' + esc(wood) + '</p>' : '') +
        '</div>' +
      '</article>';
  }

  function setPos(box, range, value) {
    box.style.setProperty('--pos', value + '%');
    if (range) range.value = value;
    box.dataset.edge = value < 10 ? 'left' : (value > 90 ? 'right' : '');
  }

  /** One-time gentle sweep so people notice the slider is interactive. */
  function sweep(box, range) {
    if (reduceMotion || box.dataset.swept) return;
    box.dataset.swept = '1';
    var keys = [50, 30, 70, 50], total = 2200, start = null, stopped = false;
    function stop() { stopped = true; }
    ['pointerdown', 'keydown', 'focus'].forEach(function (ev) { range.addEventListener(ev, stop, { once: true }); });
    function ease(x) { return 0.5 - Math.cos(Math.PI * x) / 2; }
    function frame(now) {
      if (stopped) return;
      if (start === null) start = now;
      var p = Math.min((now - start) / total, 1);
      var seg = Math.min(Math.floor(p * 3), 2);
      var local = ease(p * 3 - seg);
      setPos(box, range, keys[seg] + (keys[seg + 1] - keys[seg]) * local);
      if (p < 1) window.requestAnimationFrame(frame);
    }
    window.requestAnimationFrame(frame);
  }

  function initCompare(root) {
    $$('.compare', root).forEach(function (box) {
      var range = $('.compare__range', box);
      range.addEventListener('input', function () {
        box.classList.add('is-touched');
        setPos(box, null, Number(range.value));
      });
      if ('IntersectionObserver' in window) {
        var io = new IntersectionObserver(function (entries) {
          if (entries[0].isIntersecting) { io.disconnect(); sweep(box, range); }
        }, { threshold: 0.65 });
        io.observe(box);
      }
    });
  }

  function renderProjects() {
    var grid = $('#project-grid');
    var list = window.EDHF_PROJECTS || [];
    if (!grid) return;
    // Keep each slider's position if the language changes
    var positions = $$('.compare', grid).map(function (b) { return { pos: b.style.getPropertyValue('--pos'), touched: b.classList.contains('is-touched') }; });
    grid.innerHTML = list.map(projectCard).join('');
    initCompare(grid);
    $$('.compare', grid).forEach(function (box, i) {
      if (positions[i] && positions[i].pos) {
        var v = parseFloat(positions[i].pos);
        setPos(box, $('.compare__range', box), v);
        box.dataset.swept = '1';
        if (positions[i].touched) box.classList.add('is-touched');
      }
    });
  }

  /* 7. REVIEWS ---------------------------------------------------------------- */
  function renderReviews() {
    var wrap = $('#review-list');
    var list = window.EDHF_REVIEWS || [];
    if (wrap) {
      wrap.innerHTML = list.map(function (r) {
        var n = Math.max(1, Math.min(5, Number(r.rating) || 5));
        var stars = '';
        for (var i = 0; i < n; i++) stars += '<svg class="icon" aria-hidden="true"><use href="#i-star"/></svg>';
        return '<figure class="review">' +
          '<div class="review__stars" role="img" aria-label="' + esc(t('reviews.stars', { n: n })) + '">' + stars + '</div>' +
          '<blockquote>' + esc(pick(r.text)) + '</blockquote>' +
          '<figcaption>' + esc(r.name || '') + (r.city ? '<span>' + esc(r.city) + '</span>' : '') + '</figcaption>' +
          '</figure>';
      }).join('');
    }
    var empty = $('#reviews-empty');
    if (empty) empty.hidden = list.length > 0;

    var btn = $('#google-review-btn');
    var url = (window.EDHF_GOOGLE_REVIEW_URL || '').trim() || (btn ? (btn.getAttribute('href') || '').trim() : '');
    if (btn && url) { btn.setAttribute('href', url); btn.hidden = false; }
  }

  /* 8. ESTIMATE FORM ----------------------------------------------------------- */
  var form = $('#estimate-form');
  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  function digits(s) { return String(s).replace(/\D/g, ''); }

  function formatPhone(value) {
    var d = digits(value);
    if (d.length === 11 && d.charAt(0) === '1') d = d.slice(1);
    d = d.slice(0, 10);
    if (d.length < 4) return d;
    if (d.length < 7) return '(' + d.slice(0, 3) + ') ' + d.slice(3);
    return '(' + d.slice(0, 3) + ') ' + d.slice(3, 6) + '-' + d.slice(6);
  }

  function fieldOf(input) { return input.closest('.field'); }

  function setError(input, key) {
    var field = fieldOf(input);
    var msg = $('#e-' + input.id.replace('f-', ''));
    if (!field || !msg) return;
    if (key) {
      field.classList.add('has-error');
      input.setAttribute('aria-invalid', 'true');
      msg.dataset.key = key;
      msg.textContent = t(key);
      msg.hidden = false;
    } else {
      field.classList.remove('has-error');
      input.removeAttribute('aria-invalid');
      delete msg.dataset.key;
      msg.hidden = true;
      msg.textContent = '';
    }
  }

  function refreshFormErrors() {
    if (!form) return;
    $$('.field__error', form).forEach(function (m) { if (m.dataset.key) m.textContent = t(m.dataset.key); });
  }

  function contactMethod() {
    var c = $('input[name="preferred_contact"]:checked', form);
    return c ? c.value : 'Call';
  }

  /** Returns the translation key of the error, or '' when the field is fine. */
  function check(input) {
    var v = input.value.trim();
    switch (input.id) {
      case 'f-name':    return v.length < 2 ? 'form.err.name' : '';
      case 'f-phone':   var d = digits(v); return (d.length === 10 || (d.length === 11 && d.charAt(0) === '1')) ? '' : 'form.err.phone';
      case 'f-email':
        if (!v) return contactMethod() === 'Email' ? 'form.err.emailRequired' : '';
        return EMAIL_RE.test(v) ? '' : 'form.err.email';
      case 'f-city':    return v.length < 2 ? 'form.err.city' : '';
      case 'f-zip':     return v && !/^\d{5}$/.test(v) ? 'form.err.zip' : '';
      case 'f-service': return v ? '' : 'form.err.service';
    }
    return '';
  }

  function validate() {
    var first = null;
    ['f-name', 'f-phone', 'f-email', 'f-city', 'f-zip', 'f-service'].forEach(function (id) {
      var input = $('#' + id);
      var key = check(input);
      setError(input, key);
      if (key && !first) first = input;
    });
    return first;
  }

  function setStatus(key, kind) {
    var s = $('#form-status');
    if (!s) return;
    s.className = 'form__status' + (kind ? ' is-' + kind : '');
    if (key) { s.dataset.key = key; s.textContent = t(key); } else { delete s.dataset.key; s.textContent = ''; }
  }

  function setBusy(busy) {
    var b = $('#form-submit');
    if (!b) return;
    b.setAttribute('aria-busy', busy ? 'true' : 'false');
    $('span', b).textContent = t(busy ? 'form.sending' : 'form.submit');
    if (!busy) $('span', b).setAttribute('data-i18n', 'form.submit');
    else $('span', b).removeAttribute('data-i18n');
  }

  function showSuccess() {
    var done = $('#form-done');
    form.hidden = true;
    done.hidden = false;
    done.focus({ preventScroll: true });
    done.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' });
  }

  /** Used until a Formspree address is added: opens the visitor's email app. */
  function sendByEmailApp(fd) {
    var to = form.getAttribute('data-fallback-email') || '';
    var skip = { '_gotcha': 1, '_subject': 1, 'photos': 1 };
    var lines = [];
    fd.forEach(function (value, key) { if (!skip[key] && typeof value === 'string' && value) lines.push(key.replace(/_/g, ' ') + ': ' + value); });
    var subject = fd.get('_subject') || 'Free estimate request';
    window.location.href = 'mailto:' + to + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(lines.join('\n'));
    setStatus('form.mailto', 'info');
  }

  function submitForm(e) {
    e.preventDefault();
    var firstBad = validate();
    if (firstBad) { firstBad.focus(); setStatus('', ''); return; }

    var fd = new FormData(form);

    // Spam trap filled in → pretend it worked, send nothing.
    if (fd.get('_gotcha')) { showSuccess(); return; }

    // Photos: only sent when uploads are switched on (see note in index.html)
    var uploadsOn = form.getAttribute('data-photo-uploads') === 'true';
    var photoInput = $('#f-photos');
    if (!uploadsOn || !photoInput || !photoInput.files.length) {
      fd.delete('photos');
    } else if (photoInput.files.length > 5) {
      setStatus('form.tooManyPhotos', 'error');
      return;
    }

    var endpoint = (form.getAttribute('action') || '').trim();
    if (!endpoint || endpoint.indexOf('YOUR_FORM_ID') !== -1) { sendByEmailApp(fd); return; }

    setStatus('', '');
    setBusy(true);
    fetch(endpoint, { method: 'POST', body: fd, headers: { 'Accept': 'application/json' } })
      .then(function (res) {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        form.reset();
        $('#f-lang').value = lang;
        showSuccess();
      })
      .catch(function () { setStatus('form.error', 'error'); })
      .then(function () { setBusy(false); });
  }

  function initForm() {
    if (!form) return;
    var phone = $('#f-phone'), zip = $('#f-zip'), sqft = $('#f-sqft');

    if (form.getAttribute('data-photo-uploads') === 'true') $('#photo-field').hidden = false;

    phone.addEventListener('input', function () { phone.value = formatPhone(phone.value); });
    zip.addEventListener('input', function () { zip.value = digits(zip.value).slice(0, 5); });
    sqft.addEventListener('input', function () { sqft.value = sqft.value.replace(/[^\d,]/g, ''); });

    // Clear / re-check a field as soon as the visitor fixes it
    ['f-name', 'f-phone', 'f-email', 'f-city', 'f-zip', 'f-service'].forEach(function (id) {
      var input = $('#' + id);
      var evt = input.tagName === 'SELECT' ? 'change' : 'input';
      input.addEventListener(evt, function () { if (fieldOf(input).classList.contains('has-error')) setError(input, check(input)); });
      input.addEventListener('blur', function () { if (input.value.trim()) setError(input, check(input)); });
    });
    $$('input[name="preferred_contact"]', form).forEach(function (r) {
      r.addEventListener('change', function () { var em = $('#f-email'); if (fieldOf(em).classList.contains('has-error')) setError(em, check(em)); });
    });

    // "Request a quote" buttons on the service cards pre-select the service
    $$('a[data-service]').forEach(function (a) {
      a.addEventListener('click', function () {
        var sel = $('#f-service');
        sel.value = a.getAttribute('data-service');
        setError(sel, '');
      });
    });

    form.addEventListener('submit', submitForm);
  }

  /* START ------------------------------------------------------------------------ */
  var year = $('#year');
  if (year) year.textContent = new Date().getFullYear();

  initHeader();
  initLanguage();
  initActionBar();
  initScrollSpy();
  initForm();
})();
