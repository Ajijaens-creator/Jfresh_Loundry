/* Phase 12 tests: runs the implementation (JFIMP), go-live (JFGO) and Smart Help (JFHELP) engine test cases in this browser, plus the responsive checklist.
   The cases reset the access store and every engine store, so the visitor's own demo data is saved first and restored after.
   The Smart Help suite checks that help content points at screens with a real renderer: the app's screens-*.js files are read
   (as tools/test-help.js does); when they cannot be fetched (file://) the screen registry is used instead and the page says so. */
(function () {
  var DS = JFDS, D = JFP12_DOCS, L = DS.L, t = DS.t, ic = DS.ic, esc = DS.esc, B = DS.Button;
  document.getElementById('herobtns').innerHTML = B.Primary({ label: L('Jalankan ulang', 'Run again'), icon: 'refresh', act: 'rerun' }) + B.Ghost({ label: L('Ringkasan Fase 12', 'Phase 12 overview'), icon: 'grid', href: 'index.html' });
  var KEYS = ['jfos-access-v1', 'jfos-perf-v1', 'jfos-comm-v1', 'jfos-logi-v1', 'jfos-prod-v1', 'jfos-dlv-v1', 'jfos-fin-v1', 'jfos-clp-v1', 'jfos-sys-v1', 'jfos-help-v1', 'jfos-imp-v1', 'jfos-go-v1', 'jfos-go-snap-v1', 'jfos-demo-v1'];
  // The Phase 2–11 renderer files of the app (help content and walkthroughs point at these screens).
  var APP_FILES = ['screens-ops.js', 'screens-mgmt.js', 'screens-access.js', 'screens-perf.js', 'screens-perf2.js', 'screens-perf3.js', 'screens-comm.js', 'screens-comm2.js', 'screens-comm3.js', 'screens-logi.js', 'screens-logi2.js', 'screens-logi3.js',
    'screens-prod.js', 'screens-prod2.js', 'screens-prod3.js', 'screens-dlv.js', 'screens-dlv2.js', 'screens-dlv3.js', 'screens-fin.js', 'screens-fin-acc.js', 'screens-fin-ap.js', 'screens-fin-sup.js', 'screens-fin-cfo.js', 'screens-clp.js', 'screens-sys.js', 'screens-sys2.js'];
  var VIDS = null, VSRC = 'app';
  function eng() { return { C: JFOS, X: JFACCESS, P: JFPERF, CM: JFCOMM, LG: JFLOG, PR: JFPROD, DL: JFDLV, F: JFFIN, CLP: window.JFCLP, S: window.JFSYS }; }
  var SUITES = [
    { k: 'imp', n: L('NP-01–05, NP-07 · engine build, One Data, QA, keamanan & keandalan (JFIMP)', 'NP-01–05, NP-07 · build, One Data, QA, security & reliability engine (JFIMP)'), cmd: 'node tools/test-imp.js',
      // tools/test-imp.js installs JFIMP on the Phase 4–11 engines only (no JFHELP / JFGO): the cases run in a hidden frame with that chain.
      run: function () { if (FRAME_RES) return FRAME_RES; var E = eng(); E.I = JFIMP; E.counts = [['imp', JFIMP_TESTS.cases.length]]; return JFIMP_TESTS.run(E); },
      groups: { ROLES: L('Peran proyek & navigasi', 'Project roles & navigation'), READY: L('Input readiness', 'Readiness inputs') } },
    { k: 'go', n: L('NP-06, 08, 10–12 · engine migrasi, UAT, cutover, go-live & improvement (JFGO)', 'NP-06, 08, 10–12 · migration, UAT, cutover, go-live & improvement engine (JFGO)'), cmd: 'node tools/test-go.js',
      run: function () { var E = eng(); return JFGO_TESTS.run(JFGO, JFOS, JFACCESS, JFFIN, { CM: E.CM, LG: E.LG, PR: E.PR, DL: E.DL, CLP: E.CLP, S: E.S, H: window.JFHELP, I: window.JFIMP }); },
      groups: { SETUP: L('Instalasi, peran & izin', 'Install, roles & permissions'), AUDIT: L('Audit §111', 'Audit §111') } },
    { k: 'help', n: L('NP-09 · engine Smart Help & Guided Learning (JFHELP)', 'NP-09 · Smart Help & Guided Learning engine (JFHELP)'), cmd: 'node tools/test-help.js',
      // In tools/test-help.js JFGO is installed but not visible to JFHELP's lazy lookup; hide it the same way here.
      run: function () { var E = eng(); return alone(['JFGO'], function () { return JFHELP_TESTS.run(JFHELP, JFOS, JFACCESS, { SYS: E.S, PR: E.PR, FN: E.F, DL: E.DL, LG: E.LG, CM: E.CM, CLP: E.CLP, vids: VIDS || [] }); }); },
      groups: { INSTALL: L('Instalasi & izin', 'Install & permissions'), CONTENT: L('Konten bantuan', 'Help content'), CONTEXT: L('Bantuan kontekstual', 'Contextual help'), BUTTON: L('Bantuan tombol', 'Button help'), TOUR: L('Tur produk', 'Product tour'),
        WALK: 'PANDU SAYA', SEARCH: L('Pencarian', 'Search'), WHATIS: 'APA INI?', ASK: 'Tanya JFRESH', ROLE: L('Bantuan role-aware', 'Role-aware help'), TRAIN: L('Training', 'Training'), CMS: 'Tutorial Manager', ANALYTICS: L('Analitik & insight', 'Analytics & insight'), DATA: L('Data & readiness', 'Data & readiness'), AUDIT: L('Audit', 'Audit') } }
  ];
  function alone(names, fn) {
    var keep = names.map(function (n) { return window[n]; });
    names.forEach(function (n) { window[n] = undefined; });
    try { return fn(); } finally { names.forEach(function (n, i) { window[n] = keep[i]; }); }
  }
  function gid(s, g) { return s.k + '-' + String(g).replace(/[^A-Za-z0-9-]/g, ''); }
  // The JFIMP cases in a hidden same-origin frame that loads the tools/test-imp.js chain (Phase 4–11 engines + JFIMP).
  var CHAIN = ['jfos-config', 'jfos-ds', 'jfos-access', 'jfos-perf-data', 'jfos-perf', '!JFPERF.install(JFOS, JFACCESS)', 'jfos-comm-data', 'jfos-comm', '!JFCOMM.install(JFOS, JFACCESS, JFPERF)', 'jfos-logi-data', 'jfos-logi', '!JFLOG.install(JFOS, JFACCESS, JFPERF, JFCOMM)',
    'jfos-prod-data', 'jfos-prod', '!JFPROD.install(JFOS, JFACCESS, JFPERF, JFCOMM, JFLOG)', 'jfos-dlv-data', 'jfos-dlv', '!JFDLV.install(JFOS, JFACCESS, JFPERF, JFCOMM, JFLOG, JFPROD)',
    'jfos-fin-data', 'jfos-fin', 'jfos-fin-cost', 'jfos-fin-sup', 'jfos-fin-cfo', '!JFFIN.install(JFOS, JFACCESS, JFPERF, JFCOMM, JFLOG, JFPROD, JFDLV)', 'jfos-clp-data', 'jfos-clp', '!JFCLP.install(JFOS, JFACCESS, JFPERF, JFCOMM, JFLOG, JFPROD, JFDLV, JFFIN)',
    'jfos-sys-data', 'jfos-sys', '!JFSYS.install(JFOS, JFACCESS, JFPERF, JFCOMM, JFLOG, JFPROD, JFDLV, JFFIN, JFCLP)', 'jfos-imp-data', 'jfos-imp', '!JFIMP.install(JFOS, JFACCESS, JFPERF, JFCOMM, JFLOG, JFPROD, JFDLV, JFFIN, JFCLP, JFSYS)', 'jfos-imp-tests',
    '!try { window.__res = JFIMP_TESTS.run({ C: JFOS, X: JFACCESS, P: JFPERF, CM: JFCOMM, LG: JFLOG, PR: JFPROD, DL: JFDLV, F: JFFIN, CLP: JFCLP, S: JFSYS, I: JFIMP, counts: [[\'imp\', JFIMP_TESTS.cases.length]] }); } catch (e) { window.__err = e.message; }'];
  var FRAME_RES = null;
  function frameRun(done) {
    FRAME_RES = null;
    var f = document.createElement('iframe'), finished = false;
    function end() { if (finished) return; finished = true; try { FRAME_RES = f.contentWindow.__res || null; } catch (e) { FRAME_RES = null; } f.remove(); done(); }
    f.setAttribute('aria-hidden', 'true'); f.tabIndex = -1; f.style.cssText = 'position:absolute;width:1px;height:1px;border:0;left:-9999px;top:0';
    f.srcdoc = '<!doctype html><meta charset="utf-8"><body>' + CHAIN.map(function (x) { return x.charAt(0) === '!' ? '<script>' + x.slice(1) + '<\/script>' : '<script src="../assets/js/' + x + '.js"><\/script>'; }).join('') + '</body>';
    f.addEventListener('load', end); setTimeout(end, 20000);
    document.body.appendChild(f);
  }
  function run(cb) {
    var saved = KEYS.map(function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } });
    frameRun(function () {
      var out = SUITES.map(function (s) { try { return s.run(); } catch (e) { return [{ group: 'ERR', id: s.k.toUpperCase(), n: L('Runner gagal', 'Runner failed'), ok: false, err: e.message }]; } });
      KEYS.forEach(function (k, i) { try { if (saved[i] == null) localStorage.removeItem(k); else localStorage.setItem(k, saved[i]); } catch (e) {} });
      cb(out);
    });
  }
  function np(g) { return D.NP.filter(function (x) { return x.k === g; })[0]; }
  function title(s, g) { var n = np(g); return n ? L(g + ' · ' + n.t[0], g + ' · ' + n.t[1]) : s.groups[g] ? (Array.isArray(s.groups[g]) ? L(g + ' · ' + s.groups[g][0], g + ' · ' + s.groups[g][1]) : L(g + ' · ' + s.groups[g])) : L(g, g); }
  function icon(g) { var n = np(g); return n ? n.ic : ({ ROLES: 'users', READY: 'gauge', SETUP: 'cog', AUDIT: 'history', INSTALL: 'cog', CONTENT: 'file', CONTEXT: 'help', BUTTON: 'pointer', TOUR: 'route', WALK: 'route', SEARCH: 'search', WHATIS: 'help', ASK: 'message', ROLE: 'lock', TRAIN: 'target', CMS: 'edit', ANALYTICS: 'chart', DATA: 'database' })[g] || 'link'; }
  function render() { run(paint); }
  function paint(all) {
    var h = '';
    var tot = all.reduce(function (a, r) { return a + r.length; }, 0), pass = all.reduce(function (a, r) { return a + r.filter(function (x) { return x.ok; }).length; }, 0);
    h += P3.section({ id: 'summary', icon: 'checkc', title: L('Hasil', 'Result'), desc: L('Dijalankan sekarang di browser ini. Hasil yang sama: node tools/test-imp.js, node tools/test-go.js dan node tools/test-help.js', 'Run just now in this browser. Same result: node tools/test-imp.js, node tools/test-go.js and node tools/test-help.js'),
      body: '<div style="display:grid;gap:var(--jf-space-4)">' + SUITES.map(function (s, i) { var r = all[i], p = r.filter(function (x) { return x.ok; }).length;
        return '<div class="p4-sum" data-suite="' + s.k + '" data-pass="' + p + '" data-total="' + r.length + '"><b class="big">' + p + ' / ' + r.length + '</b><div style="display:grid;gap:var(--jf-space-2);min-width:0"><b>' + t(s.n) + '</b>' + DS.Feedback.Inline({ type: p === r.length ? 'success' : 'error', text: p === r.length ? L('Semua kasus uji lulus.', 'Every test case passed.') : L((r.length - p) + ' kasus gagal.', (r.length - p) + ' cases failed.') }) + '<code class="p3-code">' + esc(s.cmd) + '</code></div></div>'; }).join('') +
        '<p class="hint">' + t(L('Total ' + pass + ' dari ' + tot + ' lulus.', 'Total ' + pass + ' of ' + tot + ' passed.')) + (VSRC === 'registry' ? ' ' + t(L('Catatan: file layar aplikasi tidak bisa dibaca dari halaman ini (file://), jadi pemeriksaan renderer Smart Help memakai registry layar. Buka lewat server untuk pemeriksaan penuh.', 'Note: the app screen files cannot be read from this page (file://), so the Smart Help renderer check uses the screen registry. Open it through a server for the full check.')) : '') + '</p></div>' });
    SUITES.forEach(function (s, i) {
      var res = all[i], groups = [];
      res.forEach(function (r) { if (groups.indexOf(r.group) < 0) groups.push(r.group); });
      groups.forEach(function (g, j) {
        var list = res.filter(function (r) { return r.group === g; }), ok = list.filter(function (r) { return r.ok; }).length;
        h += (j === 0 ? '<p class="p11-world-h" style="margin:var(--jf-space-6) 0 var(--jf-space-3)">' + ic(s.k === 'imp' ? 'layers' : s.k === 'go' ? 'flag' : 'help') + t(s.n) + '</p>' : '') +
          P3.section({ id: gid(s, g), icon: icon(g), title: title(s, g), desc: L(ok + ' dari ' + list.length + ' lulus', ok + ' of ' + list.length + ' passed'),
          body: '<ul class="p4-res">' + list.map(function (r) { return '<li class="' + (r.ok ? 'ok' : 'bad') + '">' + ic(r.ok ? 'checkc' : 'xc') + '<code>' + esc(r.id) + '</code><span>' + t(r.n) + (r.err ? '<small>' + esc(r.err) + '</small>' : '') + '</span></li>'; }).join('') + '</ul>' });
      });
    });
    h += P3.section({ id: 'responsive', icon: 'monitor', title: L('Responsif & QA', 'Responsive & QA'), desc: L('Diperiksa dengan screenshot dan klik otomatis di 1440, 1024 dan 390 px.', 'Checked with screenshots and automated clicks at 1440, 1024 and 390 px.'),
      body: '<ul class="p4-res">' + D.RESPONSIVE.map(function (r) { return '<li class="ok">' + ic('checkc') + '<code>' + esc(r[0]) + '</code><span>' + t(r[1]) + '</span></li>'; }).join('') + '</ul>' });
    P3.mount('#page', h);
    if (window.JF && JF.lang) DS.lang(document.getElementById('page'));
    if (location.hash) { var el = document.getElementById(location.hash.slice(1)); if (el) setTimeout(function () { el.scrollIntoView(); }, 50); }
  }
  // Renderer ids from the registry (used only when the app files cannot be fetched).
  function registryVids() {
    var HD = window.JFHELP_DATA || {}, ids = [];
    (HD.CONTENT || []).concat(HD.WALKS || []).forEach(function (a) { var id = a && (a.s || a.screen); if (id && ids.indexOf(id) < 0 && JFOS.screen(id)) ids.push(id); });
    return ids;
  }
  function loadVids(done) {
    if (location.protocol === 'file:' || !window.fetch) { VIDS = registryVids(); VSRC = 'registry'; return done(); }
    Promise.all(APP_FILES.map(function (f) { return fetch('../app/' + f).then(function (r) { if (!r.ok) throw new Error(f); return r.text(); }); })).then(function (txt) {
      var ids = [], re = /V\['([A-Z0-9-]+)'\]\s*=/g, m; txt.join('\n').replace(re, function (_, id) { if (ids.indexOf(id) < 0) ids.push(id); return _; });
      VIDS = ids; VSRC = 'app'; done();
    }).catch(function () { VIDS = registryVids(); VSRC = 'registry'; done(); });
  }
  P3.mount('#page', P3.section({ id: 'summary', icon: 'clock', title: L('Menjalankan kasus uji…', 'Running the test cases…'), desc: L('Membaca file layar aplikasi, lalu menjalankan ketiga suite.', 'Reading the app screen files, then running the three suites.'), body: '' }));
  loadVids(render);
  document.addEventListener('click', function (e) { if (e.target.closest('[data-act="rerun"]')) render(); });
})();
