/* JFRESH OS — Phase 5 documentation helpers (layout only; components from JFDS, sections from P3, layout classes from phase4.css) */
(function () {
  var DS = window.JFDS, D = window.JFPERF_DOCS, t = DS.t, ic = DS.ic, esc = DS.esc, L = DS.L;
  var P5 = window.P5 = {};
  P5.visual = function (k) { return D.VISUALS.filter(function (v) { return v.k === k; })[0]; };
  // Approved reference visual, collapsed by default. A visual that was never sent says so instead.
  P5.ref = function (k) {
    var v = P5.visual(k); if (!v) return '';
    if (v.missing) return '<div class="p4-note">' + ic('image') + '<p><b>' + esc(v.k) + ' · ' + t(v.t) + '</b><br>' + t(L('Visual acuan belum dikirim.', 'Reference visual not sent yet.')) + '</p></div>';
    return '<details class="p3-ref"><summary>' + ic('image') + '<span>' + t(L('Visual acuan', 'Reference visual')) + ' ' + esc(v.k) + ' · ' + t(v.t) + '</span>' + ic('chevd') + '</summary>' +
      '<a href="../assets/brand/phase5/' + esc(v.f) + '" target="_blank" rel="noopener"><img src="../assets/brand/phase5/' + esc(v.f) + '" alt="' + esc(v.k) + '" loading="lazy" style="display:block;width:100%;height:auto"></a></details>';
  };
  P5.links = function (list) { return '<div class="p4-links">' + list.map(function (l, i) { return (i ? DS.Button.Ghost : DS.Button.Secondary)({ label: l[0], icon: i ? 'link' : 'arrow', href: l[1] }); }).join('') + '</div>'; };
  P5.list = function (items) { return '<ul class="p3-rules do">' + items.map(function (x) { return '<li>' + ic('checkc') + '<span>' + t(x) + '</span></li>'; }).join('') + '</ul>'; };
})();
