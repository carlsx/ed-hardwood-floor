/* ==========================================================================
   ED HARDWOOD FLOOR — page.js
   --------------------------------------------------------------------------
   A tiny script for the simple pages (privacy.html, terms.html, 404.html and
   the location pages). It only does three things:
     1. Applies EN / PT / ES text from js/translations.js (same switcher as the home page)
     2. Remembers the visitor's language choice
     3. Fills in the current year in the footer
   The home page uses js/main.js instead. You normally do NOT need to edit this file.

   Optional: put  data-title-key="legal.privacy.title"  on <body> to translate the
   browser tab title (the key must exist in js/translations.js).
   ========================================================================== */
(function () {
  'use strict';

  var T = window.EDHF_TRANSLATIONS || {};
  var SUPPORTED = ['en', 'pt', 'es'];
  var lang = 'en';

  function $$(sel) { return Array.prototype.slice.call(document.querySelectorAll(sel)); }

  function store(key, val) {
    try { if (val === undefined) return window.localStorage.getItem(key); window.localStorage.setItem(key, val); } catch (e) { /* storage blocked: ignore */ }
    return null;
  }

  function t(key) {
    if (T[lang] && T[lang][key] !== undefined) return T[lang][key];
    if (T.en && T.en[key] !== undefined) return T.en[key];
    return key;
  }

  function apply(code, persist) {
    if (SUPPORTED.indexOf(code) === -1) code = 'en';
    lang = code;
    document.documentElement.lang = code;

    $$('[data-i18n]').forEach(function (el) { el.textContent = t(el.getAttribute('data-i18n')); });

    // data-i18n-attr="aria-label:nav.language; alt:some.key"
    $$('[data-i18n-attr]').forEach(function (el) {
      el.getAttribute('data-i18n-attr').split(';').forEach(function (pair) {
        var p = pair.split(':');
        if (p.length === 2) el.setAttribute(p[0].trim(), t(p[1].trim()));
      });
    });

    var titleKey = document.body.getAttribute('data-title-key');
    if (titleKey) document.title = t(titleKey) + ' | ED Hardwood Floor';

    $$('[data-lang]').forEach(function (btn) {
      btn.setAttribute('aria-pressed', btn.getAttribute('data-lang') === code ? 'true' : 'false');
    });

    if (persist) store('edhf-lang', code);
  }

  var wanted = null;
  try { wanted = new URLSearchParams(window.location.search).get('lang'); } catch (e) { /* old browser */ }
  if (!wanted || SUPPORTED.indexOf(wanted) === -1) wanted = store('edhf-lang') || 'en';

  $$('[data-lang]').forEach(function (btn) {
    btn.addEventListener('click', function () { apply(btn.getAttribute('data-lang'), true); });
  });
  apply(wanted, false);

  var year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();
})();
