/* JFRESH OS — Phase 4 documentation helpers (layout only; components come from JFDS, sections from P3) */
(function () {
  var DS = window.JFDS, D = window.JFACCESS_DOCS, t = DS.t, ic = DS.ic, esc = DS.esc, L = DS.L;
  var P4 = window.P4 = {};
  P4.visual = function (k) { return D.VISUALS.filter(function (v) { return v.k === k; })[0]; };
  // Approved reference visual, collapsed by default so the page stays light.
  P4.ref = function (k) {
    var v = P4.visual(k); if (!v) return '';
    return '<details class="p3-ref"><summary>' + ic('image') + '<span>' + t(L('Visual acuan', 'Reference visual')) + ' ' + esc(v.k) + ' · ' + t(v.t) + '</span>' + ic('chevd') + '</summary>' +
      '<a href="../assets/brand/phase4/' + esc(v.f) + '" target="_blank" rel="noopener"><img src="../assets/brand/phase4/' + esc(v.f) + '" alt="" loading="lazy" style="display:block;width:100%;height:auto"></a></details>';
  };
  P4.links = function (list) { return '<div class="p4-links">' + list.map(function (l, i) { return (i ? DS.Button.Ghost : DS.Button.Secondary)({ label: l[0], icon: i ? 'link' : 'arrow', href: l[1] }); }).join('') + '</div>'; };
  P4.list = function (items) { return '<ul class="p3-rules do">' + items.map(function (x) { return '<li>' + ic('checkc') + '<span>' + t(x) + '</span></li>'; }).join('') + '</ul>'; };
})();
