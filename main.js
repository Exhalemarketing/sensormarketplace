(function () {
  'use strict';
  var yr = document.getElementById('yr'); if (yr) yr.textContent = new Date().getFullYear();
  var f = document.getElementById('quoteForm');
  if (!f) return;
  var $ = function (id) { return document.getElementById(id); };
  var err = $('formErr'), btn = $('submitBtn'), more = $('more'), card = $('quote');
  var BTN_TXT = btn.textContent;
  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  function v(id) { var e = $(id); return e ? e.value.trim() : ''; }
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function makeId() {
    var d = new Date();
    return 'SM-' + d.getUTCFullYear() + pad(d.getUTCMonth() + 1) + pad(d.getUTCDate()) + '-' +
      pad(d.getUTCHours()) + pad(d.getUTCMinutes()) + pad(d.getUTCSeconds()) + '-' +
      Math.random().toString(36).slice(2, 6).toUpperCase();
  }

  /* ---- conditional fields ---- */
  function toggle(wrapId, inputId, on) {
    $(wrapId).hidden = !on; $(inputId).required = on;
    if (!on) { $(inputId).value = ''; setErr(inputId, ''); }
  }
  $('mfr').addEventListener('change', function () { toggle('mfrOtherWrap', 'mfrOther', v('mfr') === 'Other'); if (v('mfr') === 'Other') $('mfrOther').focus(); });
  var stateSel = $('state');
  function syncStates() {
    var c = v('country'), groups = stateSel.querySelectorAll('optgroup'), na = stateSel.querySelector('[data-other]');
    groups.forEach(function (g) { var show = g.getAttribute('data-country') === c; g.hidden = !show; g.disabled = !show; });
    var other = c === 'Other';
    na.hidden = !other;
    stateSel.options[0].textContent = c ? (c === 'Canada' ? 'Select province' : 'Select state') : 'Country first';
    var cur = stateSel.selectedOptions[0];
    if (other) stateSel.value = na.value;
    else if (cur && cur.parentNode.tagName === 'OPTGROUP' && cur.parentNode.disabled || cur === na) stateSel.value = '';
    stateSel.disabled = !c || other;
    $('city').placeholder = c === 'Canada' ? 'e.g. Calgary T2P 1J9' : (c === 'Mexico' ? 'e.g. Monterrey 64000' : (c === 'Other' ? 'City, postal code' : 'e.g. Houston 77002'));
    toggle('countryOtherWrap', 'countryOther', other);
  }
  $('country').addEventListener('change', function () { syncStates(); if (v('country') === 'Other') $('countryOther').focus(); });
  if (v('country')) syncStates();   // initial state is set in the HTML (state select disabled)

  /* ---- smart defaults from well-known part-number prefixes (only fills empty fields) ---- */
  var PREFIX = [
    [/^XNXXS/i, 'Honeywell (XNX, Sensepoint, BW, Series 3000)', 'Replacement gas sensor cartridge'],
    [/^78[67][A-Z]/i, 'Wilcoxon (Amphenol)', 'Vibration sensor / transmitter'],
    [/^PC420/i, 'Wilcoxon (Amphenol)', 'Vibration sensor / transmitter'],
    [/^AC10\d/i, 'CTC (Connection Technology Center)', 'Vibration sensor / transmitter'],
    [/^6302-/, 'Bacharach', 'Refrigerant leak-detection module'],
    [/^65-26\d\dXL/i, 'RKI Instruments', 'Fixed gas transmitter']
  ];
  $('pn').addEventListener('change', function () {
    var pn = v('pn');
    for (var i = 0; i < PREFIX.length; i++) if (PREFIX[i][0].test(pn)) {
      if (!v('mfr')) { $('mfr').value = PREFIX[i][1]; setErr('mfr', ''); }
      if (!v('stype')) { $('stype').value = PREFIX[i][2]; setErr('stype', ''); }
      break;
    }
  });

  /* ---- validation ---- */
  function setErr(id, msg) {
    var el = $(id), m = $(id + '-err');
    if (!el || !m) return;
    if (msg) { el.setAttribute('aria-invalid', 'true'); m.textContent = msg; m.hidden = false; }
    else { el.removeAttribute('aria-invalid'); m.textContent = ''; m.hidden = true; }
  }
  var desc = false; // "No part number" mode
  var rules = {
    pn: function () { return !desc && !v('pn') ? 'Enter the part number from the label or nameplate – or choose “No part number”.' : ''; },
    mfr: function () { return desc && !v('mfr') ? 'Select the manufacturer (or Other).' : ''; },
    mfrOther: function () { return desc && v('mfr') === 'Other' && !v('mfrOther') ? 'Enter the manufacturer name.' : ''; },
    stype: function () { return desc && !v('stype') ? 'Select the sensor type.' : ''; },
    desc: function () { return desc && v('desc').length < 3 ? 'Add a short description, e.g. gas and range.' : ''; },
    qty: function () { return !v('qty') ? 'Select a quantity.' : ''; },
    country: function () { return !v('country') ? 'Select the ship-to country.' : ''; },
    countryOther: function () { return v('country') === 'Other' && !v('countryOther') ? 'Enter the country.' : ''; },
    state: function () { return !v('country') ? 'Select the country first.' : (v('country') !== 'Other' && !v('state') ? 'Select the state or province.' : ''); },
    city: function () { return v('city').length < 2 ? 'Enter the city or ZIP / postal code.' : ''; },
    cname: function () { return !v('cname') ? 'Enter your name.' : ''; },
    email: function () { var e = v('email'); return !e ? 'Enter your email so we can send the quote.' : (!EMAIL_RE.test(e) ? 'Check the email format, e.g. name@company.com.' : ''); }
  };
  var ORDER = ['pn', 'mfr', 'mfrOther', 'stype', 'desc', 'qty', 'country', 'countryOther', 'state', 'city', 'cname', 'email'];
  var LABELS = { pn: 'Part number', mfr: 'Manufacturer', mfrOther: 'Manufacturer name', stype: 'Sensor type', desc: 'Short description', qty: 'Quantity', country: 'Country', countryOther: 'Country name', state: 'State / province', city: 'City / ZIP', cname: 'Name', email: 'Email' };
  ORDER.forEach(function (id) {
    var el = $(id); if (!el) return;
    var check = function () { setErr(id, rules[id]()); };
    el.addEventListener('blur', function () { if (el.value || el.getAttribute('aria-invalid')) check(); });
    el.addEventListener(el.tagName === 'SELECT' ? 'change' : 'input', function () { if (el.getAttribute('aria-invalid')) check(); });
  });
  $('country').addEventListener('change', function () { if ($('state').getAttribute('aria-invalid')) setErr('state', rules.state()); });

  /* ---- mode: part number vs. description ---- */
  function setMode(d, focus) {
    desc = d;
    $('modePn').setAttribute('aria-pressed', String(!d)); $('modeDesc').setAttribute('aria-pressed', String(d));
    $('pnBox').hidden = d; $('descBox').hidden = !d;
    $('mode').value = d ? 'No part number (description)' : 'Part number';
    $('qf-title').textContent = d ? 'Get a quote – describe the sensor' : 'Get a quote by part number';
    ['pn', 'mfr', 'mfrOther', 'stype', 'desc'].forEach(function (k) { setErr(k, ''); });
    if (focus) $(d ? 'mfr' : 'pn').focus();
  }
  $('modePn').addEventListener('click', function () { setMode(false, true); });
  $('modeDesc').addEventListener('click', function () { setMode(true, true); });

  /* ---- contextual quote links (cards, nav, sticky) ---- */
  document.querySelectorAll('.js-quote').forEach(function (a) {
    a.addEventListener('click', function (e) {
      e.preventDefault();
      var t = a.getAttribute('data-type');
      if (t) { $('stype').value = t; setErr('stype', ''); }
      card.scrollIntoView({ behavior: 'smooth', block: 'start' });
      var target = desc ? $('mfr') : $('pn');
      setTimeout(function () { target.focus({ preventScroll: true }); }, 350);
      if (history.replaceState) history.replaceState(null, '', '#quote');
    });
  });

  /* ---- sticky mobile CTA: only when the form is off-screen ---- */
  var sticky = $('stickyCta');
  if (sticky && 'IntersectionObserver' in window) {
    sticky.hidden = false;
    new IntersectionObserver(function (es) {
      es.forEach(function (x) { sticky.classList.toggle('show', !x.isIntersecting); });
    }, { threshold: 0 }).observe(card);
  }

  /* ---- submit (native POST so FormSubmit can send the _autoresponse; it requires non-AJAX + reCAPTCHA) ---- */
  function showSummary(bad) {
    err.innerHTML = '<p><b>Please fix ' + (bad.length === 1 ? 'this field' : 'these ' + bad.length + ' fields') + ':</b></p><ul>' +
      bad.map(function (id) { return '<li><a href="#' + id + '">' + LABELS[id] + '</a></li>'; }).join('') + '</ul>';
    err.hidden = false;
    err.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function (e) { e.preventDefault(); $(a.getAttribute('href').slice(1)).focus(); });
    });
  }
  var sending = false;
  f.addEventListener('submit', function (e) {
    e.preventDefault();
    if (sending) return;
    err.hidden = true;
    var bad = [];
    ORDER.forEach(function (id) { var m = rules[id](); setErr(id, m); if (m) bad.push(id); });
    if (bad.length) { showSummary(bad); $(bad[0]).focus(); return; }
    var id = makeId(), pn = desc ? '' : v('pn'), q = v('qty');
    if (desc) $('pn').value = '';
    $('reqId').value = id;
    $('reqTs').value = new Date().toISOString();
    var certs = [].map.call(f.querySelectorAll('.chip input:checked'), function (c) { return c.value; });
    $('certs').value = certs.length ? certs.join(', ') : '(same as existing / not specified)';
    var mfr = v('mfr') === 'Other' ? v('mfrOther') : v('mfr').replace(/ \(.*\)$/, '');
    $('subj').value = 'Quote request ' + id + ' – ' + (pn || (mfr + ' ' + v('stype'))) + ' x' + q + ' – ' + (document.title.split('|').pop().trim());
    $('next').value = $('next').value.split('?')[0] + '?ref=' + encodeURIComponent(id);
    stateSel.disabled = false;                                   // include "N/A" for other countries
    ['mfrOther', 'countryOther', 'pn', 'desc'].forEach(function (k) { if (!v(k)) $(k).disabled = true; });  // omit empty
    if (!desc && !v('mfr')) $('mfr').disabled = true;
    if (!desc && !v('stype')) $('stype').disabled = true;
    sending = true; btn.disabled = true; btn.textContent = 'Opening verification…'; btn.setAttribute('aria-busy', 'true');
    f.setAttribute('action', f.getAttribute('data-endpoint'));   // real endpoint only set after validation
    HTMLFormElement.prototype.submit.call(f);
  });
  // If the user comes back with the browser Back button, re-enable everything.
  window.addEventListener('pageshow', function () {
    sending = false; btn.disabled = false; btn.textContent = BTN_TXT; btn.removeAttribute('aria-busy');
    f.querySelectorAll('[disabled]').forEach(function (el) { if (el !== stateSel) el.disabled = false; });
    if (v('country')) syncStates(); else stateSel.disabled = true;
  });
})();
