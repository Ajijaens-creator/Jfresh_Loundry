/* Phase 11 tests: runs the client portal (JFCLP) and system (JFSYS) engine test cases in this browser, plus the responsive checklist.
   The cases reset the access store and every engine store, so the visitor's own demo data is saved first and restored after. */
(function () {
  var DS = JFDS, D = JFP11_DOCS, L = DS.L, t = DS.t, ic = DS.ic, esc = DS.esc, B = DS.Button;
  document.getElementById('herobtns').innerHTML = B.Primary({ label: L('Jalankan ulang', 'Run again'), icon: 'refresh', act: 'rerun' }) + B.Ghost({ label: L('Ringkasan Fase 11', 'Phase 11 overview'), icon: 'grid', href: 'index.html' });
  var KEYS = ['jfos-access-v1', 'jfos-perf-v1', 'jfos-comm-v1', 'jfos-logi-v1', 'jfos-prod-v1', 'jfos-dlv-v1', 'jfos-fin-v1', 'jfos-clp-v1', 'jfos-sys-v1', 'jfos-demo-v1'];
  var SUITES = [
    { k: 'clp', w: 'A', n: L('A · CLIENT — engine portal klien (JFCLP)', 'A · CLIENT — client portal engine (JFCLP)'), cmd: 'node tools/test-clp.js',
      run: function () { return JFCLP_TESTS.run({ C: JFOS, X: JFACCESS, P: JFPERF, CM: JFCOMM, LG: JFLOG, PR: JFPROD, DL: JFDLV, F: JFFIN, K: JFCLP }); },
      groups: { ISO: L('Isolasi data klien', 'Client data isolation'), KPI: L('KPI & notifikasi portal', 'Portal KPIs & notifications'), AUDIT: L('Audit portal', 'Portal audit') } },
    { k: 'sys', w: 'B', n: L('B · SYSTEM — engine admin sistem & governance (JFSYS)', 'B · SYSTEM — system admin & governance engine (JFSYS)'), cmd: 'node tools/test-sys.js',
      run: function () { return JFSYS_TESTS.run(JFSYS, JFOS, JFACCESS, JFFIN); },
      groups: { '§63': L('Batas Super Admin', 'Super Admin limitations'), INTEGRATION: L('Integrasi dengan aplikasi', 'Integration with the app'), AUDIT: L('Audit sistem', 'System audit') } }
  ];
  function gid(s, g) { return s.k + '-' + (g === '§63' ? 's63' : g); }
  function run() {
    var saved = KEYS.map(function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } });
    var out = SUITES.map(function (s) { try { return s.run(); } catch (e) { return [{ group: 'ERR', id: s.k.toUpperCase(), n: L('Runner gagal', 'Runner failed'), ok: false, err: e.message }]; } });
    KEYS.forEach(function (k, i) { try { if (saved[i] == null) localStorage.removeItem(k); else localStorage.setItem(k, saved[i]); } catch (e) {} });
    return out;
  }
  function title(s, g) { var n = D.NP.filter(function (x) { return x.k === g; })[0]; return n ? L(g + ' · ' + n.t[0], g + ' · ' + n.t[1]) : s.groups[g] ? L(g + ' · ' + s.groups[g][0], g + ' · ' + s.groups[g][1]) : L(g, g); }
  function icon(g) { var n = D.NP.filter(function (x) { return x.k === g; })[0]; return n ? n.ic : g === 'ISO' ? 'lock' : g === '§63' ? 'shield' : g === 'KPI' ? 'gauge' : g === 'AUDIT' ? 'history' : 'link'; }
  function render() {
    var all = run(), h = '';
    var tot = all.reduce(function (a, r) { return a + r.length; }, 0), pass = all.reduce(function (a, r) { return a + r.filter(function (x) { return x.ok; }).length; }, 0);
    h += P3.section({ id: 'summary', icon: 'checkc', title: L('Hasil', 'Result'), desc: L('Dijalankan sekarang di browser ini. Hasil yang sama: node tools/test-clp.js dan node tools/test-sys.js', 'Run just now in this browser. Same result: node tools/test-clp.js and node tools/test-sys.js'),
      body: '<div style="display:grid;gap:var(--jf-space-4)">' + SUITES.map(function (s, i) { var r = all[i], p = r.filter(function (x) { return x.ok; }).length;
        return '<div class="p4-sum" data-suite="' + s.k + '"><b class="big">' + p + ' / ' + r.length + '</b><div style="display:grid;gap:var(--jf-space-2);min-width:0"><b>' + t(s.n) + '</b>' + DS.Feedback.Inline({ type: p === r.length ? 'success' : 'error', text: p === r.length ? L('Semua kasus uji lulus.', 'Every test case passed.') : L((r.length - p) + ' kasus gagal.', (r.length - p) + ' cases failed.') }) + '<code class="p3-code">' + esc(s.cmd) + '</code></div></div>'; }).join('') +
        '<p class="hint">' + t(L('Total ' + pass + ' dari ' + tot + ' lulus.', 'Total ' + pass + ' of ' + tot + ' passed.')) + '</p></div>' });
    SUITES.forEach(function (s, i) {
      var res = all[i], groups = [];
      res.forEach(function (r) { if (groups.indexOf(r.group) < 0) groups.push(r.group); });
      groups.forEach(function (g, j) {
        var list = res.filter(function (r) { return r.group === g; }), ok = list.filter(function (r) { return r.ok; }).length;
        h += (j === 0 ? '<p class="p11-world-h" style="margin:var(--jf-space-6) 0 var(--jf-space-3)">' + ic(s.w === 'A' ? 'hotel' : 'shield') + t(s.n) + '</p>' : '') +
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
  render();
  document.addEventListener('click', function (e) { if (e.target.closest('[data-act="rerun"]')) render(); });
})();
