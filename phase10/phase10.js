/* JFRESH OS — Phase 10 documentation helpers (layout only; components from JFDS, sections from P3, layout classes from phase4–phase9 css) */
(function () {
  var DS = window.JFDS, D = window.JFFIN_DOCS, t = DS.t, ic = DS.ic, esc = DS.esc, L = DS.L;
  var P10 = window.P10 = {};
  P10.visual = function (k) { return D.VISUALS.filter(function (v) { return v.k === k; })[0]; };
  P10.sheet = function (v) { return '../assets/brand/phase10/' + D.SHEETS[v.s]; };
  // The approved reference sheet that holds this NV, collapsed by default.
  P10.ref = function (k) {
    var v = P10.visual(k); if (!v) return '';
    return '<details class="p3-ref"><summary>' + ic('image') + '<span>' + t(L('Visual acuan', 'Reference visual')) + ' ' + esc(v.k) + ' · ' + t(v.t) + '</span>' + ic('chevd') + '</summary>' +
      '<a href="' + P10.sheet(v) + '" target="_blank" rel="noopener"><img src="' + P10.sheet(v) + '" alt="' + esc(v.k) + '" loading="lazy" style="display:block;width:100%;height:auto"></a></details>';
  };
  P10.links = function (list) { return '<div class="p4-links">' + list.map(function (l, i) { return (i ? DS.Button.Ghost : DS.Button.Secondary)({ label: l[0], icon: i ? 'link' : 'arrow', href: l[1] }); }).join('') + '</div>'; };
  P10.list = function (items) { return '<ul class="p3-rules do">' + items.map(function (x) { return '<li>' + ic('checkc') + '<span>' + t(x) + '</span></li>'; }).join('') + '</ul>'; };
})();
