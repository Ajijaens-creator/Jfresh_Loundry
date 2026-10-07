/* JFRESH OS — shared page behaviour
   - Top bar (official logo, visual menu, ID | EN switch) and pager
   - Language switch: elements carry Indonesian text by default and English in data-en
   - Responsive accordions: data-acc="m" (collapsible on mobile) or "tm" (iPad + mobile)
   - Small SVG builder for diagrams that re-render on language change */
(function () {
  var body = document.body;
  var ROOT = body.getAttribute('data-root') || '';
  var CURRENT = parseInt(body.getAttribute('data-visual') || '0', 10);
  var PHASE = parseInt(body.getAttribute('data-phase') || '1', 10) || 1;

  var VISUALS = [
    { n: 1, f: '01-business-model.html', t: 'Business Model Overview', id: 'Siapa dilayani, nilai, alur & pendapatan', en: 'Who we serve, value, flow & revenue', ic: 'briefcase' },
    { n: 2, f: '02-system-scope.html', t: 'System Scope Architecture', id: 'Apa yang masuk ke dalam sistem', en: 'What is inside the system', ic: 'layers' },
    { n: 3, f: '03-user-role-map.html', t: 'User & Role Map', id: 'Siapa memakai sistem & aksesnya', en: 'Who uses the system & their access', ic: 'users' },
    { n: 4, f: '04-golden-workflow.html', t: 'End-to-End Operational Flow', id: 'Dari permintaan hingga pembayaran', en: 'From request to payment', ic: 'route' },
    { n: 5, f: '05-business-rules.html', t: 'Business Rules & Control', id: 'Kontrol yang menjaga transaksi', en: 'Controls that protect transactions', ic: 'shield' },
    { n: 6, f: '06-kpi-sla.html', t: 'Performance & SLA Architecture', id: 'Dari aktivitas menjadi KPI & alert', en: 'From activity to KPI & alerts', ic: 'gauge' },
    { n: 7, f: '07-master-data.html', t: 'Master Data Relationship Diagram', id: 'Hubungan antar master data', en: 'How master data connects', ic: 'database' }
  ];
  // Phase 2 pages (NP-01 … NP-06) come from the shared config in jfos-config.js
  var NP = (window.JFOS && window.JFOS.NP || []).map(function (p, i) { return { n: i + 1, f: p.f, t: p.t[1], code: p.k, id: p.d[0], en: p.d[1], ic: p.ic }; });
  // Phase 3 pages (NP-01 … NP-07 Design System) come from assets/js/jfos-ds-docs.js
  var DSP = (window.JFDS && window.JFDS.PAGES || []).map(function (p, i) { return { n: i + 1, f: p.f, t: p.t[1], code: p.k, id: p.d[0], en: p.d[1], ic: p.ic }; });
  // Phase 4 pages (Access & App Shell): overview + screen specs + tests
  var P4 = [
    { n: 1, f: 'screens.html', t: 'Screen Specifications', code: 'SPEC', id: 'Spesifikasi layar AUTH, SHELL, USER, NOTIF, LAND', en: 'AUTH, SHELL, USER, NOTIF, LAND screen specs', ic: 'file' },
    { n: 2, f: 'tests.html', t: 'Test Cases & Results', code: 'TEST', id: 'Kasus uji login, akses, landing, responsif', en: 'Login, access, landing and responsive test cases', ic: 'checkc' }
  ];
  // Phase 5 pages (Executive & Performance OS): overview + screen specs + tests
  var P5 = [
    { n: 1, f: 'screens.html', t: 'Screen Specifications', code: 'SPEC', id: 'Spesifikasi 41 layar inventaris §89', en: 'Specs for the 41 §89 inventory screens', ic: 'file' },
    { n: 2, f: 'tests.html', t: 'Test Cases & Results', code: 'TEST', id: 'Kasus uji engine skor dan checklist responsif', en: 'Score engine test cases and responsive checklist', ic: 'checkc' }
  ];
  // Phase 6 pages (Client & Commercial): overview + screen specs + tests
  var P6 = [
    { n: 1, f: 'screens.html', t: 'Screen Specifications', code: 'SPEC', id: 'Spesifikasi 29 layar inventaris §64', en: 'Specs for the 29 §64 inventory screens', ic: 'file' },
    { n: 2, f: 'tests.html', t: 'Test Cases & Results', code: 'TEST', id: 'Kasus uji engine komersial dan checklist responsif', en: 'Commercial engine test cases and responsive checklist', ic: 'checkc' }
  ];
  // Phase 7 pages (Order, Pickup, Delivery & Live Logistics): overview + screen specs + tests
  var P7 = [
    { n: 1, f: 'screens.html', t: 'Screen Specifications', code: 'SPEC', id: 'Spesifikasi 27 layar inventaris §84', en: 'Specs for the 27 §84 inventory screens', ic: 'file' },
    { n: 2, f: 'tests.html', t: 'Test Cases & Results', code: 'TEST', id: 'Kasus uji engine logistik dan checklist responsif', en: 'Logistics engine test cases and responsive checklist', ic: 'checkc' }
  ];
  // Phase 8 pages (Laundry Production): overview + screen specs + tests
  var P8 = [
    { n: 1, f: 'screens.html', t: 'Screen Specifications', code: 'SPEC', id: 'Spesifikasi 45 layar inventaris §86', en: 'Specs for the 45 §86 inventory screens', ic: 'file' },
    { n: 2, f: 'tests.html', t: 'Test Cases & Results', code: 'TEST', id: 'Kasus uji engine produksi dan checklist responsif', en: 'Production engine test cases and responsive checklist', ic: 'checkc' }
  ];
  var PAGES = PHASE === 8 ? P8 : PHASE === 7 ? P7 : PHASE === 6 ? P6 : PHASE === 5 ? P5 : PHASE === 4 ? P4 : PHASE === 3 ? DSP : (PHASE === 2 ? NP : VISUALS);
  var CH = PHASE === 8 ? {
    dir: 'phase8/', home: 'phase8/index.html', sub: ['Fase 8 · Produksi Laundry', 'Phase 8 · Laundry Production'], ov: ['Ringkasan Fase 8', 'Phase 8 overview'],
    menu: ['Fase 8', 'Phase 8'], all: ['Ringkasan Fase 8', 'Phase 8 overview'], foot: ['Fase 8 Produksi Laundry · NP Versi 1.0', 'Phase 8 Laundry Production · NP Version 1.0'], num: function (v) { return v.n === 1 ? 'S' : 'T'; }
  } : PHASE === 7 ? {
    dir: 'phase7/', home: 'phase7/index.html', sub: ['Fase 7 · Order, Pickup, Delivery & Live Logistics', 'Phase 7 · Order, Pickup, Delivery & Live Logistics'], ov: ['Ringkasan Fase 7', 'Phase 7 overview'],
    menu: ['Fase 7', 'Phase 7'], all: ['Ringkasan Fase 7', 'Phase 7 overview'], foot: ['Fase 7 Order, Pickup, Delivery & Live Logistics · NP Versi 1.0', 'Phase 7 Order, Pickup, Delivery & Live Logistics · NP Version 1.0'], num: function (v) { return v.n === 1 ? 'S' : 'T'; }
  } : PHASE === 6 ? {
    dir: 'phase6/', home: 'phase6/index.html', sub: ['Fase 6 · Client & Commercial', 'Phase 6 · Client & Commercial'], ov: ['Ringkasan Fase 6', 'Phase 6 overview'],
    menu: ['Fase 6', 'Phase 6'], all: ['Ringkasan Fase 6', 'Phase 6 overview'], foot: ['Fase 6 Client & Commercial · NP Versi 1.0', 'Phase 6 Client & Commercial · NP Version 1.0'], num: function (v) { return v.n === 1 ? 'S' : 'T'; }
  } : PHASE === 5 ? {
    dir: 'phase5/', home: 'phase5/index.html', sub: ['Fase 5 · Executive & Performance OS', 'Phase 5 · Executive & Performance OS'], ov: ['Ringkasan Fase 5', 'Phase 5 overview'],
    menu: ['Fase 5', 'Phase 5'], all: ['Ringkasan Fase 5', 'Phase 5 overview'], foot: ['Fase 5 Executive, Financial & Ambidex Performance OS · NP Versi 1.0', 'Phase 5 Executive, Financial & Ambidex Performance OS · NP Version 1.0'], num: function (v) { return v.n === 1 ? 'S' : 'T'; }
  } : PHASE === 4 ? {
    dir: 'phase4/', home: 'phase4/index.html', sub: ['Fase 4 · Akses & App Shell', 'Phase 4 · Access & App Shell'], ov: ['Ringkasan Fase 4', 'Phase 4 overview'],
    menu: ['Fase 4', 'Phase 4'], all: ['Ringkasan Fase 4', 'Phase 4 overview'], foot: ['Fase 4 Akses & App Shell · NP Versi 1.0', 'Phase 4 Access & App Shell · NP Version 1.0'], num: function (v) { return v.n === 1 ? 'S' : 'T'; }
  } : PHASE === 3 ? {
    dir: 'phase3/', home: 'phase3/index.html', sub: ['Fase 3 · Design System', 'Phase 3 · Design System'], ov: ['Ringkasan Fase 3', 'Phase 3 overview'],
    menu: ['7 Dokumen NP', '7 NP Docs'], all: ['Semua dokumen Fase 3', 'All Phase 3 docs'], foot: ['Fase 3 Design System · NP Versi 1.0', 'Phase 3 Design System · NP Version 1.0'], num: function (v) { return v.code.replace('NP-', ''); }
  } : PHASE === 2 ? {
    dir: 'phase2/', home: 'phase2/index.html', sub: ['Fase 2 · Struktur & Navigasi', 'Phase 2 · Structure & Navigation'], ov: ['Ringkasan Fase 2', 'Phase 2 overview'],
    menu: ['6 Dokumen NP', '6 NP Docs'], all: ['Semua dokumen Fase 2', 'All Phase 2 docs'], foot: ['Fase 2 Struktur & Navigasi · NP Versi 1.0', 'Phase 2 Structure & Navigation · NP Version 1.0'], num: function (v) { return v.code.replace('NP-', ''); }
  } : {
    dir: 'visuals/', home: 'index.html', sub: ['Fase 1 · Fondasi Bisnis', 'Phase 1 · Business Foundation'], ov: ['Ringkasan Fase 1', 'Phase 1 overview'],
    menu: ['7 Visual', '7 Visuals'], all: ['Semua visual Fase 1', 'All Phase 1 visuals'], foot: ['Fase 1 Fondasi Bisnis · Versi 1.0', 'Phase 1 Business Foundation · Version 1.0'], num: function (v) { return '0' + v.n; }
  };
  function href(v) { return ROOT + CH.dir + v.f; }
  function tx(p) { return '<span data-en="' + esc(p[1]) + '">' + esc(p[0]) + '</span>'; }
  function ic(name, cls) { return '<svg class="i' + (cls ? ' ' + cls : '') + '" aria-hidden="true"><use href="#i-' + name + '"/></svg>'; }
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }

  /* ---------- Language ---------- */
  var lang = 'id';
  try { lang = localStorage.getItem('jfresh-lang') === 'en' ? 'en' : 'id'; } catch (e) {}
  var langListeners = [];

  function applyLang() {
    document.documentElement.lang = lang;
    var els = document.querySelectorAll('[data-en]');
    for (var i = 0; i < els.length; i++) {
      var el = els[i];
      if (el.__id === undefined) el.__id = el.innerHTML;
      el.innerHTML = lang === 'en' ? el.getAttribute('data-en') : el.__id;
    }
    var b = document.querySelectorAll('.lang button');
    for (var j = 0; j < b.length; j++) b[j].setAttribute('aria-pressed', b[j].getAttribute('data-l') === lang ? 'true' : 'false');
    for (var k = 0; k < langListeners.length; k++) langListeners[k](lang);
  }
  function setLang(l) {
    lang = l;
    try { localStorage.setItem('jfresh-lang', l); } catch (e) {}
    applyLang();
  }

  /* ---------- Chrome: top bar + pager ---------- */
  function topbar() {
    var items = '<a class="home" href="' + ROOT + CH.home + '"' + (CURRENT === 0 ? ' aria-current="page"' : '') + '>' + ic('grid') + tx(CH.ov) + '</a>' +
      (PHASE === 3 ? '<a class="home" href="' + ROOT + 'phase3/docs.html">' + ic('component') + '<span data-en="Component documentation">Dokumentasi komponen</span></a>' +
        '<a class="home" href="' + ROOT + 'phase3/traceability.html">' + ic('link') + '<span data-en="Design traceability">Traceability desain</span></a>' : '') +
      (PHASE >= 2 ? '<a class="home" href="' + ROOT + 'app/login.html">' + ic('phone') + '<span data-en="Open JFRESH OS app">Buka aplikasi JFRESH OS</span></a>' : '') +
      (PHASE === 2 ? '<a class="home" href="' + ROOT + 'phase2/traceability.html">' + ic('link') + '<span data-en="Traceability matrix">Matriks traceability</span></a>' : '') +
      '<a class="home" href="' + ROOT + 'preview.html">' + ic('monitor') + '<span data-en="Device preview">Pratinjau perangkat</span></a>' +
      (PHASE !== 1 ? '<a class="home" href="' + ROOT + 'index.html">' + ic('layers') + '<span data-en="Phase 1 Business Foundation">Fase 1 Fondasi Bisnis</span></a>' : '') +
      (PHASE !== 2 ? '<a class="home" href="' + ROOT + 'phase2/index.html">' + ic('layers') + '<span data-en="Phase 2 Structure &amp; Navigation">Fase 2 Struktur &amp; Navigasi</span></a>' : '') +
      (PHASE !== 3 ? '<a class="home" href="' + ROOT + 'phase3/index.html">' + ic('palette') + '<span data-en="Phase 3 Design System">Fase 3 Design System</span></a>' : '') +
      (PHASE !== 4 ? '<a class="home" href="' + ROOT + 'phase4/index.html">' + ic('lock') + '<span data-en="Phase 4 Access &amp; App Shell">Fase 4 Akses &amp; App Shell</span></a>' : '') +
      (PHASE !== 5 ? '<a class="home" href="' + ROOT + 'phase5/index.html">' + ic('gauge') + '<span data-en="Phase 5 Executive &amp; Performance OS">Fase 5 Executive &amp; Performance OS</span></a>' : '') +
      (PHASE !== 6 ? '<a class="home" href="' + ROOT + 'phase6/index.html">' + ic('users') + '<span data-en="Phase 6 Client &amp; Commercial">Fase 6 Client &amp; Commercial</span></a>' : '') +
      (PHASE !== 7 ? '<a class="home" href="' + ROOT + 'phase7/index.html">' + ic('truck') + '<span data-en="Phase 7 Order, Pickup, Delivery &amp; Live Logistics">Fase 7 Order, Pickup, Delivery &amp; Live Logistics</span></a>' : '') +
      (PHASE !== 8 ? '<a class="home" href="' + ROOT + 'phase8/index.html">' + ic('factory') + '<span data-en="Phase 8 Laundry Production">Fase 8 Produksi Laundry</span></a>' : '');
    PAGES.forEach(function (v) {
      items += '<a href="' + href(v) + '"' + (v.n === CURRENT ? ' aria-current="page"' : '') + '><span class="vn">' + CH.num(v) + '</span><span>' + esc(v.t) + '</span></a>';
    });
    var h = '<header class="topbar"><div class="wrap">' +
      '<a class="brand" href="' + ROOT + 'index.html" aria-label="J\'Fresh Laundry — JFRESH OS">' +
      '<img class="brand-logo" src="' + ROOT + 'assets/brand/jfresh-logo.png" alt="J\'Fresh Laundry" width="605" height="373">' +
      '<span class="brand-txt"><span class="wordmark">JFRESH <b>OS</b></span><span class="brand-sub" data-en="' + esc(CH.sub[1]) + '">' + esc(CH.sub[0]) + '</span></span></a>' +
      '<span class="topbar-sp"></span>' +
      '<details class="vmenu"><summary aria-label="Menu visual">' + ic('menu') + '<span class="vlabel" data-en="' + CH.menu[1] + '">' + CH.menu[0] + '</span></summary><nav class="vmenu-list">' + items + '</nav></details>' +
      '<div class="lang" role="group" aria-label="Bahasa / Language"><button type="button" data-l="id">ID</button><button type="button" data-l="en">EN</button></div>' +
      '</div></header>';
    body.insertAdjacentHTML('afterbegin', h);
    var bs = document.querySelectorAll('.lang button');
    for (var i = 0; i < bs.length; i++) bs[i].addEventListener('click', function () { setLang(this.getAttribute('data-l')); });
    document.addEventListener('click', function (e) {
      var m = document.querySelector('.vmenu[open]');
      if (m && !m.contains(e.target)) m.removeAttribute('open');
    });
  }

  function pager() {
    if (!CURRENT) return;
    var prev = PAGES[CURRENT - 2], next = PAGES[CURRENT];
    var h = '<nav class="wrap pager" aria-label="Navigasi visual">';
    h += prev ? '<a href="' + href(prev) + '">' + ic('arrowl') + '<span><small data-en="Previous">Sebelumnya</small>' + CH.num(prev) + ' ' + esc(prev.t) + '</span></a>' : '<span></span>';
    h += '<a class="home" href="' + ROOT + CH.home + '">' + ic('grid') + tx(CH.all) + '</a>';
    h += next ? '<a class="nx" href="' + href(next) + '"><span><small data-en="Next">Berikutnya</small>' + CH.num(next) + ' ' + esc(next.t) + '</span>' + ic('arrow') + '</a>' : '<span></span>';
    h += '</nav>';
    var main = document.querySelector('main');
    if (main) main.insertAdjacentHTML('afterend', h);
  }

  function footer() {
    body.insertAdjacentHTML('beforeend', '<footer class="foot"><div class="wrap"><span><b>JFRESH OS</b> · ' + tx(CH.foot) + '</span>' +
      '<span data-en="Simple Frontline. Powerful Management. One Connected JFRESH OS.">Simple Frontline. Powerful Management. One Connected JFRESH OS.</span></div></footer>');
  }

  /* Form-factor indicator in the hero */
  function formFactor() {
    var el = document.querySelector('[data-ff]');
    if (!el) return;
    el.innerHTML =
      '<span class="ff hide-t hide-m">' + ic('monitor') + '<span data-en="View: PC Report">Tampilan: PC Report</span></span>' +
      '<span class="ff hide-d hide-m">' + ic('tablet') + '<span data-en="View: Operational iPad">Tampilan: Operational iPad</span></span>' +
      '<span class="ff hide-d hide-t">' + ic('phone') + '<span data-en="View: Mobile">Tampilan: Mobile</span></span>';
  }

  /* Bubble DNA in the hero, subtle and fixed */
  function bubbles() {
    var b = document.querySelector('.hero .bubbles');
    if (!b) return;
    var spots = [[1, 8, 18], [52, 6, 10], [74, 9, 14], [88, 4, 22], [96, 34, 12]];
    b.innerHTML = spots.map(function (s) { return '<i style="left:' + s[0] + '%;top:' + s[1] + '%;width:' + s[2] + 'px;height:' + s[2] + 'px"></i>'; }).join('');
  }

  /* ---------- Responsive accordions ---------- */
  var mqM = window.matchMedia('(max-width: 699px)');
  var mqT = window.matchMedia('(min-width: 700px) and (max-width: 1239px)');
  function mode() { return mqM.matches ? 'm' : (mqT.matches ? 't' : 'd'); }

  function setupAcc() {
    var accs = document.querySelectorAll('.acc');
    var m = mode();
    for (var i = 0; i < accs.length; i++) {
      var a = accs[i];
      var head = a.querySelector(':scope > .panel-h, :scope > .acc-h');
      if (!head) continue;
      if (!head.querySelector('.chev')) head.insertAdjacentHTML('beforeend', '<span class="chev" aria-hidden="true">' + ic('chevd') + '</span>');
      var rule = a.getAttribute('data-acc') || 'm';
      var coll = rule.indexOf(m) !== -1;
      a.classList.toggle('is-collapsible', coll);
      if (coll) {
        head.setAttribute('role', 'button');
        head.setAttribute('tabindex', '0');
        if (a.__mode !== m) {
          var openAttr = a.getAttribute('data-open') || '';
          a.classList.toggle('is-open', openAttr.indexOf(m) !== -1);
        }
        head.setAttribute('aria-expanded', a.classList.contains('is-open') ? 'true' : 'false');
      } else {
        head.removeAttribute('role'); head.removeAttribute('tabindex'); head.removeAttribute('aria-expanded');
        a.classList.add('is-open');
      }
      a.__mode = m;
      if (!head.__bound) {
        head.__bound = true;
        head.addEventListener('click', toggle);
        head.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle.call(this); } });
      }
    }
  }
  function toggle() {
    var a = this.parentNode;
    if (!a.classList.contains('is-collapsible')) return;
    a.classList.toggle('is-open');
    this.setAttribute('aria-expanded', a.classList.contains('is-open') ? 'true' : 'false');
  }

  /* ---------- SVG diagram builder ---------- */
  var TONES = {
    blue: { f: '#FFFFFF', s: '#9DBDE3', t: '#0B3D78', a: '#0754A6' },
    solid: { f: '#0754A6', s: '#0754A6', t: '#FFFFFF', a: '#0754A6' },
    fresh: { f: '#E6F7FD', s: '#7FD3F2', t: '#0B3D78', a: '#0090C8' },
    orange: { f: '#FFF4E6', s: '#F7B568', t: '#7A3F00', a: '#E07F0A' },
    warn: { f: '#FFF3DF', s: '#E9A23B', t: '#7A4600', a: '#B86A00' },
    crit: { f: '#FDECEA', s: '#E0574C', t: '#A41F15', a: '#C8281C' },
    ok: { f: '#E7F6EE', s: '#6CC497', t: '#0D6B3A', a: '#138A4B' },
    mute: { f: '#F6F9FC', s: '#C6D6EA', t: '#4F6A88', a: '#7F95AE' },
    teal: { f: '#E5F6F3', s: '#7CCBBF', t: '#0A5C53', a: '#0E9384' },
    violet: { f: '#F0ECFB', s: '#B4A3E6', t: '#4A2F99', a: '#6A4BC4' }
  };
  function T(v) { return Array.isArray(v) ? (lang === 'en' ? v[1] : v[0]) : v; }
  var S = {
    tones: TONES,
    T: T,
    open: function (w, h, title) {
      var d = '<defs>';
      for (var k in TONES) d += '<marker id="ar-' + k + '" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="' + TONES[k].a + '"/></marker>';
      d += '</defs>';
      return '<svg viewBox="0 0 ' + w + ' ' + h + '" role="img" aria-label="' + esc(T(title || '')) + '" xmlns="http://www.w3.org/2000/svg">' + d;
    },
    close: function () { return '</svg>'; },
    rect: function (x, y, w, h, o) {
      o = o || {};
      return '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="' + (o.r == null ? 10 : o.r) + '" fill="' + (o.fill || '#fff') + '" stroke="' + (o.stroke || 'none') + '" stroke-width="' + (o.sw || 1.5) + '"' + (o.dash ? ' stroke-dasharray="' + o.dash + '"' : '') + '/>';
    },
    text: function (x, y, str, o) {
      o = o || {};
      var lines = String(T(str)).split('\n'), size = o.size || 13, lh = o.lh || size * 1.25;
      var y0 = y - (lines.length - 1) * lh / 2;
      var out = '<text x="' + x + '" y="' + y0 + '" font-size="' + size + '" font-weight="' + (o.weight || 600) + '" fill="' + (o.fill || '#12304F') + '" text-anchor="' + (o.anchor || 'middle') + '" dominant-baseline="middle"' + (o.ls ? ' letter-spacing="' + o.ls + '"' : '') + '>';
      lines.forEach(function (l, i) { out += '<tspan x="' + x + '" y="' + (y0 + i * lh) + '">' + esc(l) + '</tspan>'; });
      return out + '</text>';
    },
    icon: function (name, x, y, size, color) {
      var paths = (window.JF_ICONS || {})[name] || '';
      return '<g transform="translate(' + x + ' ' + y + ') scale(' + (size / 24) + ')" fill="none" stroke="' + color + '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + paths + '</g>';
    },
    /* node: rounded box with optional icon on the left and 1–2 line label */
    node: function (x, y, w, h, label, o) {
      o = o || {};
      var t = TONES[o.tone || 'blue'];
      var out = S.rect(x, y, w, h, { fill: t.f, stroke: t.s, r: o.r || 10, dash: o.dash, sw: o.sw });
      if (o.icon) {
        var is = o.is || 18;
        if (o.stack) {
          out += S.icon(o.icon, x + w / 2 - is / 2, y + 8, is, t.a);
          out += S.text(x + w / 2, y + h / 2 + is / 2 + 2, label, { size: o.size || 12.5, weight: 700, fill: t.t });
        } else {
          out += S.icon(o.icon, x + 10, y + h / 2 - is / 2, is, t.a);
          out += S.text(x + 10 + is + 8, y + h / 2, label, { size: o.size || 12.5, weight: 700, fill: t.t, anchor: 'start' });
        }
      } else {
        out += S.text(x + w / 2, y + h / 2, label, { size: o.size || 12.5, weight: 700, fill: t.t });
      }
      return out;
    },
    /* polyline with arrow head; pts = [[x,y],...] */
    line: function (pts, o) {
      o = o || {};
      var t = TONES[o.tone || 'mute'];
      var d = 'M' + pts.map(function (p) { return p[0] + ' ' + p[1]; }).join('L');
      return '<path d="' + d + '" fill="none" stroke="' + t.a + '" stroke-width="' + (o.sw || 1.6) + '"' + (o.dash ? ' stroke-dasharray="' + o.dash + '"' : '') +
        (o.noArrow ? '' : ' marker-end="url(#ar-' + (o.tone || 'mute') + ')"') + (o.both ? ' marker-start="url(#ar-' + (o.tone || 'mute') + ')"' : '') + ' stroke-linejoin="round"/>';
    },
    pill: function (x, y, label, o) {
      o = o || {};
      var t = TONES[o.tone || 'mute'], s = o.size || 11.5;
      var w = o.w || (String(T(label)).length * s * 0.58 + 18);
      return S.rect(x - w / 2, y - 10, w, 20, { fill: t.f, stroke: t.s, r: 10, sw: 1 }) + S.text(x, y + 0.5, label, { size: s, weight: 700, fill: t.t });
    }
  };

  var diagrams = [];
  function diagram(el, render) {
    if (typeof el === 'string') el = document.querySelector(el);
    if (!el) return;
    diagrams.push({ el: el, render: render });
    el.innerHTML = render(lang, S);
  }
  langListeners.push(function () { diagrams.forEach(function (d) { d.el.innerHTML = d.render(lang, S); }); });

  /* ---------- Boot ---------- */
  window.JF = { ic: ic, diagram: diagram, svg: S, onLang: function (f) { langListeners.push(f); }, lang: function () { return lang; }, VISUALS: VISUALS, PAGES: PAGES, esc: esc, tx: tx, apply: function () { var ph = document.querySelectorAll("[data-icon]"); for (var i = 0; i < ph.length; i++) ph[i].outerHTML = ic(ph[i].getAttribute("data-icon"), ph[i].className); applyLang(); setupAcc(); } };

  topbar();
  formFactor();
  bubbles();
  pager();
  footer();

  // Expand [data-icon] placeholders: <span data-icon="truck"></span>
  var ph = document.querySelectorAll('[data-icon]');
  for (var i = 0; i < ph.length; i++) ph[i].outerHTML = ic(ph[i].getAttribute('data-icon'), ph[i].className);

  applyLang();
  setupAcc();
  (mqM.addEventListener ? mqM.addEventListener('change', setupAcc) : mqM.addListener(setupAcc));
  (mqT.addEventListener ? mqT.addEventListener('change', setupAcc) : mqT.addListener(setupAcc));
})();
