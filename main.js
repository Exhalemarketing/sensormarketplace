(function () {
  var f = document.getElementById('quoteForm');
  var err = document.getElementById('formErr');
  var btn = document.getElementById('submitBtn');
  var yr = document.getElementById('yr'); if (yr) yr.textContent = new Date().getFullYear();
  if (!f) return;
  var FORM_ID = f.getAttribute('action').split('/').pop();
  function v(id) { var e = document.getElementById(id); return e ? e.value.trim() : ''; }
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function makeId() {
    var d = new Date();
    return 'SM-' + d.getUTCFullYear() + pad(d.getUTCMonth() + 1) + pad(d.getUTCDate()) + '-' +
      pad(d.getUTCHours()) + pad(d.getUTCMinutes()) + pad(d.getUTCSeconds()) + '-' +
      Math.random().toString(36).slice(2, 6).toUpperCase();
  }
  function fail(msg, id) {
    err.textContent = msg; err.hidden = false;
    var el = id && document.getElementById(id);
    if (el) { el.setAttribute('aria-invalid', 'true'); el.focus(); }
  }
  f.addEventListener('input', function (e) { e.target.removeAttribute && e.target.removeAttribute('aria-invalid'); err.hidden = true; });
  f.addEventListener('submit', function (e) {
    e.preventDefault();
    err.hidden = true;
    var pn = v('pn'), mfr = v('mfr'), st = v('stype'), em = v('email');
    if (!pn && !(mfr && st)) return fail('Please enter the OEM part number, or both the manufacturer and the sensor type.', pn ? 'mfr' : 'pn');
    var q = parseInt(v('qty'), 10);
    if (!(q >= 1)) return fail('Quantity must be at least 1.', 'qty');
    if (!v('loc')) return fail('Please enter the delivery location (city, state/province, country).', 'loc');
    if (!v('cname')) return fail('Please enter a contact name.', 'cname');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(em)) return fail('Please enter a valid email address.', 'email');

    var id = makeId();
    document.getElementById('reqId').value = id;
    document.getElementById('reqTs').value = new Date().toISOString();
    var fd = new FormData(f);
    var certs = fd.getAll('Required certifications');
    fd.delete('Required certifications');
    fd.append('Required certifications', certs.length ? certs.join(', ') : '(none specified)');
    var subj = 'Quote request ' + id + ' – ' + (pn || (mfr + ' ' + st)) + ' x' + q;
    fd.set('_subject', subj + ' – ' + (document.title.split('|').pop().trim()));
    fd.delete('_next');
    btn.disabled = true; btn.textContent = 'Sending…';
    fetch('https://formsubmit.co/ajax/' + FORM_ID, { method: 'POST', headers: { 'Accept': 'application/json' }, body: fd })
      .then(function (r) { return r.json().catch(function () { return {}; }); })
      .then(function (j) {
        if (j && (j.success === true || j.success === 'true')) {
          f.hidden = true;
          document.getElementById('thanksId').textContent = id;
          var t = document.getElementById('thanks'); t.hidden = false; t.focus();
        } else {
          throw new Error((j && j.message) || 'Unknown error');
        }
      })
      .catch(function (x) {
        btn.disabled = false; btn.textContent = 'Submit quote request';
        fail('Sorry – the request could not be sent (' + x.message + '). Please try again in a minute.');
      });
  });
})();
