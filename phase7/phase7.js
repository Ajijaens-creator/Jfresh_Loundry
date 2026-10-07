/* JFRESH OS — Phase 7 documentation helpers (layout only; components from JFDS, sections from P3, layout classes from phase4.css / phase5.css) */
(function () {
  var DS = window.JFDS, D = window.JFLOG_DOCS, t = DS.t, ic = DS.ic, esc = DS.esc, L = DS.L;
  var P7 = window.P7 = {};
  P7.visual = function (k) { return D.VISUALS.filter(function (v) { return v.k === k; })[0]; };
  // Approved reference visual, collapsed by default.
  P7.ref = function (k) {
    var v = P7.visual(k); if (!v) return '';
    return '<details class="p3-ref"><summary>' + ic('image') + '<span>' + t(L('Visual acuan', 'Reference visual')) + ' ' + esc(v.k) + ' · ' + t(v.t) + '</span>' + ic('chevd') + '</summary>' +
      '<a href="../assets/brand/phase7/' + esc(v.f) + '" target="_blank" rel="noopener"><img src="../assets/brand/phase7/' + esc(v.f) + '" alt="' + esc(v.k) + '" loading="lazy" style="display:block;width:100%;height:auto"></a></details>';
  };
  P7.links = function (list) { return '<div class="p4-links">' + list.map(function (l, i) { return (i ? DS.Button.Ghost : DS.Button.Secondary)({ label: l[0], icon: i ? 'link' : 'arrow', href: l[1] }); }).join('') + '</div>'; };
  P7.list = function (items) { return '<ul class="p3-rules do">' + items.map(function (x) { return '<li>' + ic('checkc') + '<span>' + t(x) + '</span></li>'; }).join('') + '</ul>'; };
})();
