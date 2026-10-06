/* Phase 5 tests: runs the engine test cases in this browser, plus the responsive checklist.
   The cases reset the performance store, so the visitor's own demo data is saved first and restored after. */
(function () {
  var DS = JFDS, D = JFPERF_DOCS, P = JFPERF, L = DS.L, t = DS.t, ic = DS.ic, esc = DS.esc, B = DS.Button;
  document.getElementById('herobtns').innerHTML = B.Primary({ label: L('Jalankan ulang', 'Run again'), icon: 'refresh', act: 'rerun' }) + B.Ghost({ label: L('Ringkasan Fase 5', 'Phase 5 overview'), icon: 'grid', href: 'index.html' });
  var KEY = 'jfos-perf-v1';
  function run() {
    var saved = null; try { saved = localStorage.getItem(KEY); } catch (e) {}
    var res = JFPERF_TESTS.run(P);
    try { if (saved == null) localStorage.removeItem(KEY); else localStorage.setItem(KEY, saved); } catch (e) {}
    return res;
  }
  function render() {
    var res = run(), pass = res.filter(function (r) { return r.ok; }).length;
    var G = D.NP.map(function (n) { return [n.id, L(n.k + ' · ' + n.t[0], n.k + ' · ' + n.t[1]), n.ic]; }).concat([['audit', L('§81 Audit', '§81 Audit'), 'history']]);
    var h = P3.section({ id: 'summary', icon: 'checkc', title: L('Hasil', 'Result'), desc: L('Dijalankan sekarang di browser ini. Hasil yang sama: node tools/test-perf.js', 'Run just now in this browser. Same result: node tools/test-perf.js'),
      body: '<div class="p4-sum"><b class="big">' + pass + ' / ' + res.length + '</b>' + DS.Feedback.Inline({ type: pass === res.length ? 'success' : 'error', text: pass === res.length ? L('Semua kasus uji lulus.', 'Every test case passed.') : L((res.length - pass) + ' kasus gagal.', (res.length - pass) + ' cases failed.') }) + '</div>' });
    G.forEach(function (g) {
      var list = res.filter(function (r) { return r.group === g[0]; }); if (!list.length) return;
      h += P3.section({ id: g[0], icon: g[2], title: g[1], desc: L(list.filter(function (r) { return r.ok; }).length + ' dari ' + list.length + ' lulus', list.filter(function (r) { return r.ok; }).length + ' of ' + list.length + ' passed'),
        body: '<ul class="p4-res">' + list.map(function (r) { return '<li class="' + (r.ok ? 'ok' : 'bad') + '">' + ic(r.ok ? 'checkc' : 'xc') + '<code>' + esc(r.id) + '</code><span>' + t(r.n) + (r.err ? '<small>' + esc(r.err) + '</small>' : '') + '</span></li>'; }).join('') + '</ul>' });
    });
    h += P3.section({ id: 'responsive', icon: 'monitor', title: L('Responsif & QA', 'Responsive & QA'), desc: L('Diperiksa dengan screenshot dan klik otomatis di 1440, 900 dan 390 px.', 'Checked with screenshots and automated clicks at 1440, 900 and 390 px.'),
      body: '<ul class="p4-res">' + D.RESPONSIVE.map(function (r) { return '<li class="ok">' + ic('checkc') + '<code>' + esc(r[0]) + '</code><span>' + t(r[1]) + '</span></li>'; }).join('') + '</ul>' });
    P3.mount('#page', h);
    if (window.JF && JF.lang) DS.lang(document.getElementById('page'));
  }
  render();
  document.addEventListener('click', function (e) { if (e.target.closest('[data-act="rerun"]')) render(); });
})();
