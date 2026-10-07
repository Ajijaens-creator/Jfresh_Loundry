/* JFRESH OS — Phase 11 documentation helpers (layout only; components from JFDS, sections from P3, layout classes from phase4–phase11 css) */
(function () {
  var DS = window.JFDS, D = window.JFP11_DOCS, t = DS.t, ic = DS.ic, esc = DS.esc, L = DS.L;
  var P11 = window.P11 = {};
  P11.visual = function (f) { return D.VISUALS.filter(function (v) { return v.f === f; })[0]; };
  P11.src = function (v) { return D.DIR + v.f; };
  // The approved reference sheet for an NP part, collapsed by default.
  P11.ref = function (f) {
    var v = P11.visual(f);
    if (!v) return '<div class="p11-nov">' + t(L('Tidak ada lembar acuan khusus untuk bagian ini. Layar mengikuti pola admin NV-07 (User & Access Management) dan Design System Fase 3.', 'No dedicated reference sheet for this part. Screens follow the NV-07 admin pattern (User & Access Management) and the Phase 3 Design System.')) + '</div>';
    return '<details class="p3-ref"><summary>' + ic('image') + '<span>' + t(L('Visual acuan', 'Reference visual')) + ' ' + esc(v.k) + ' · ' + t(v.t) + '</span>' + ic('chevd') + '</summary>' +
      '<a href="' + P11.src(v) + '" target="_blank" rel="noopener"><img src="' + P11.src(v) + '" alt="' + esc(v.k + ' · ' + v.t[1]) + '" loading="lazy" style="display:block;width:100%;height:auto"></a></details>';
  };
  P11.who = function (u) { return u ? '<span class="p11-who">' + ic('user') + t(L('masuk sebagai', 'sign in as')) + ' <code class="p3-code">' + esc(u) + '</code></span>' : ''; };
  // [label, href, demo user]: the first is the primary button, the rest ghost buttons; each shows its demo account.
  P11.links = function (list) {
    return '<div class="p11-linkrow">' + list.map(function (l, i) { return '<div>' + (i ? DS.Button.Ghost : DS.Button.Secondary)({ label: l[0], icon: i ? 'link' : 'arrow', href: l[1] }) + P11.who(l[2]) + '</div>'; }).join('') + '</div>';
  };
  P11.list = function (items) { return '<ul class="p3-rules do">' + items.map(function (x) { return '<li>' + ic('checkc') + '<span>' + t(x) + '</span></li>'; }).join('') + '</ul>'; };
  P11.chain = function (list) { return '<div class="p4-flow">' + list.map(function (x, i) { var id = D.FLOW_LINKS[x]; return (i ? ic('arrow') : '') + (id ? '<a href="screens.html#' + id + '"><span>' + esc(x) + '</span></a>' : '<span>' + esc(x) + '</span>'); }).join('') + '</div>'; };
  P11.tag = function (k, dev) { return (dev ? '<span class="dl">' + t(dev) + '</span>' : '') + '<span class="tag ' + k + '">' + t(D.DEV_LBL[k]) + '</span>'; };
})();
