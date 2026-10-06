/* JFRESH OS — Phase 2 documentation helpers (loaded after jfresh.js).
   Every page renders its content from window.JFOS (assets/js/jfos-config.js),
   so the documentation and the working app never drift. */
(function () {
  var C = window.JFOS, JF = window.JF;
  if (!C || !JF) return;

  /* Short role labels for chips and matrix headers */
  var RS = {
    operator: { s: ['Operator', 'Operator'], i: 'pointer' },
    driver: { s: ['Driver', 'Driver'], i: 'truck' },
    supervisor: { s: ['Supervisor', 'Supervisor'], i: 'clipboard' },
    opsmgr: { s: ['Ops Manager', 'Ops Manager'], i: 'usercheck' },
    finance: { s: ['Finance', 'Finance'], i: 'card' },
    sales: { s: ['Sales', 'Sales'], i: 'building' },
    owner: { s: ['Owner', 'Owner'], i: 'briefcase' },
    client: { s: ['Klien', 'Client'], i: 'hotel' }
  };
  var DEV = { mobile: ['Mobile', 'Mobile', 'phone'], ipad: ['iPad', 'iPad', 'tablet'], desktop: ['PC / Desktop', 'PC / Desktop', 'monitor'] };

  function esc(s) { return JF.esc(s == null ? '' : s); }
  function t(p) { if (p == null) return ''; return Array.isArray(p) ? JF.tx(p) : esc(p); }
  function T(p) { if (p == null) return ''; return Array.isArray(p) ? (JF.lang() === 'en' ? p[1] : p[0]) : String(p); }
  /* Static pair rendered in both languages side by side (for "language labels") */
  function both(p) { return Array.isArray(p) ? (p[0] === p[1] ? esc(p[0]) : esc(p[0]) + ' <span class="note">· ' + esc(p[1]) + '</span>') : esc(p); }
  function ic(n, c) { return JF.ic(n, c); }

  function grp(k) { var g = C.ROLES[k].group; return g === 'frontline' ? 'f' : (g === 'client' ? 'c' : 'm'); }
  function rc(k, full) {
    var r = RS[k];
    return '<span class="rc ' + grp(k) + '" title="' + esc(C.ROLES[k].n[1]) + '">' + ic(r.i) + (full ? t(C.ROLES[k].n) : t(r.s)) + '</span>';
  }
  function rcs(list, full) { return '<span class="rcs">' + list.map(function (k) { return rc(k, full); }).join('') + '</span>'; }
  function rshort(k) { return t(RS[k].s); }

  var ON_NP06 = /np06-screen-framework\.html/.test(location.pathname);
  function specHref(id) { return (ON_NP06 ? '' : 'np06-screen-framework.html') + '#' + id; }
  function sid(id, plain) { return plain ? '<span class="sid">' + esc(id) + '</span>' : '<a class="sid" href="' + specHref(id) + '">' + esc(id) + '</a>'; }
  function appHref(role, id) { return '../app/index.html#/' + role + '/' + id; }
  function home(k) { return C.ROLES[k].nav[0].s; }
  function firstRole(s) { return C.rolesFor(s)[0]; }
  function screenApp(s) { if (typeof s === 'string') s = C.screen(s); return appHref(firstRole(s), s.id); }

  function arch(a, short) { var A = C.ARCH[a]; return '<span class="mini">' + ic(A.i) + a + (short ? '' : ' · ' + t(A.n)) + '</span>'; }
  function lvl(n) { return '<span class="mini lv">L' + n + '</span>'; }
  function isProv(code) { return C.NB_PROVISIONAL.indexOf(code) !== -1; }
  function provChip() { return '<span class="pv" title="Provisional"><span data-en="provisional">sementara</span></span>'; }
  function nb(code, withName) { return '<span class="mini"><span class="cd">' + esc(code) + '</span>' + (withName ? ' ' + t(C.NB[code]) : '') + (isProv(code) ? provChip() : '') + '</span>'; }
  function nv(code, withName) { return '<span class="mini nv"><span class="cd">' + esc(code) + '</span>' + (withName ? ' ' + t(C.NV[code]) : '') + '</span>'; }
  function bf(code, withName) { return '<span class="mini bf"><span class="cd">' + esc(code) + '</span>' + (withName ? ' ' + t(C.BF[code]) : '') + '</span>'; }
  function flowChip(f) { return '<span class="mini fl">' + ic('route') + esc(f.code) + ' ' + t(f.t) + '</span>'; }
  function dom(k) { for (var i = 0; i < C.SITEMAP.length; i++) if (C.SITEMAP[i].k === k) return C.SITEMAP[i]; return null; }

  function yes() { return '<span class="yn y">' + ic('check') + '<span class="sr" data-en="Yes">Ya</span></span>'; }
  function no() { return '<span class="yn n">' + ic('minus') + '<span class="sr" data-en="No">Tidak</span></span>'; }
  function yn(b) { return b ? yes() : no(); }

  function mount(el, html) { if (typeof el === 'string') el = document.querySelector(el); if (!el) return; el.innerHTML = html; JF.apply(); }

  /* Translatable attributes: data-ph-id / data-ph-en (placeholder) */
  function attrs() {
    var en = JF.lang() === 'en';
    var els = document.querySelectorAll('[data-ph-en]');
    for (var i = 0; i < els.length; i++) els[i].setAttribute('placeholder', en ? els[i].getAttribute('data-ph-en') : els[i].getAttribute('data-ph-id'));
    var al = document.querySelectorAll('[data-al-en]');
    for (var j = 0; j < al.length; j++) al[j].setAttribute('aria-label', en ? al[j].getAttribute('data-al-en') : al[j].getAttribute('data-al-id'));
  }
  JF.onLang(attrs);

  /* <option> lists: [[value, pair|string], …] */
  function options(list) {
    return list.map(function (o) {
      var p = o[1];
      return Array.isArray(p) ? '<option value="' + esc(o[0]) + '" data-en="' + esc(p[1]) + '">' + esc(p[0]) + '</option>' : '<option value="' + esc(o[0]) + '">' + esc(p) + '</option>';
    }).join('');
  }
  function allOpt(p) { return '<option value="" data-en="' + esc(p[1]) + '">' + esc(p[0]) + '</option>'; }
  function roleOptions() { return C.ROLE_ORDER.map(function (k) { return [k, C.ROLES[k].n]; }); }
  function archOptions() { return Object.keys(C.ARCH).map(function (a) { return [a, [a + ' · ' + C.ARCH[a].n[0], a + ' · ' + C.ARCH[a].n[1]]]; }); }
  function domOptions() { return C.SITEMAP.map(function (d) { return [d.k, [d.n + '. ' + d.t[0], d.n + '. ' + d.t[1]]]; }); }

  /* Plain-text search haystack for a screen (both languages) */
  function hay(s) {
    var parts = [s.id, s.n[0], s.n[1], s.a, C.ARCH[s.a].n[1], s.p, (s.pri ? s.pri[1] : '')].concat(s.nb, s.bf);
    return parts.join(' ').toLowerCase();
  }

  /* Open a <details> (or scroll to an element) named by the URL hash */
  function hashOpen(cb) {
    function go() {
      var id = decodeURIComponent(location.hash.slice(1));
      if (!id) return;
      var el = document.getElementById(id);
      if (cb) { cb(el, id); el = document.getElementById(id); }
      if (!el) return;
      if (el.tagName === 'DETAILS') el.open = true;
      el.classList.add('is-target');
      setTimeout(function () { el.scrollIntoView({ block: 'start' }); }, 30);
    }
    window.addEventListener('hashchange', go);
    go();
  }

  window.P2 = {
    C: C, RS: RS, DEV: DEV, esc: esc, t: t, T: T, both: both, ic: ic, rc: rc, rcs: rcs, rshort: rshort, grp: grp,
    specHref: specHref, sid: sid, appHref: appHref, home: home, firstRole: firstRole, screenApp: screenApp,
    arch: arch, lvl: lvl, nb: nb, nv: nv, bf: bf, isProv: isProv, provChip: provChip, flowChip: flowChip, dom: dom,
    yes: yes, no: no, yn: yn, mount: mount, attrs: attrs, options: options, allOpt: allOpt,
    roleOptions: roleOptions, archOptions: archOptions, domOptions: domOptions, hay: hay, hashOpen: hashOpen
  };
})();
