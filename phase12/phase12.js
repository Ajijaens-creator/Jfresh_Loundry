/* JFRESH OS — Phase 12 documentation helpers (layout only; components from JFDS, sections from P3, layout classes from phase4–phase12 css) */
(function () {
  var DS = window.JFDS, D = window.JFP12_DOCS, t = DS.t, ic = DS.ic, esc = DS.esc, L = DS.L;
  var P12 = window.P12 = {};
  P12.src = function (v) { return D.DIR + v.f; };
  // The single Phase 12 reference sheet, collapsed by default, pointing at the panel of this NP.
  P12.ref = function (np) {
    var v = D.VISUALS[0], nv = 'NV-' + np.slice(3);
    return '<details class="p3-ref"><summary>' + ic('image') + '<span>' + t(L('Visual acuan', 'Reference visual')) + ' ' + esc(nv) + ' · ' + t(L('panel di lembar Fase 12', 'panel on the Phase 12 sheet')) + '</span>' + ic('chevd') + '</summary>' +
      '<a href="' + P12.src(v) + '" target="_blank" rel="noopener"><img src="' + P12.src(v) + '" alt="' + esc(v.k + ' · ' + v.t[1]) + '" loading="lazy" style="display:block;width:100%;height:auto"></a></details>';
  };
  P12.who = function (u) { return u ? '<span class="p11-who">' + ic('user') + t(L('masuk sebagai', 'sign in as')) + ' <code class="p3-code">' + esc(u) + '</code></span>' : ''; };
  // [label, href, demo user]: the first is the secondary button, the rest ghost buttons; each shows its demo account.
  P12.links = function (list) {
    return '<div class="p11-linkrow">' + list.map(function (l, i) { return '<div>' + (i ? DS.Button.Ghost : DS.Button.Secondary)({ label: l[0], icon: i ? 'link' : 'arrow', href: l[1] }) + P12.who(l[2]) + '</div>'; }).join('') + '</div>';
  };
  P12.list = function (items) { return '<ul class="p3-rules do">' + items.map(function (x) { return '<li>' + ic('checkc') + '<span>' + t(x) + '</span></li>'; }).join('') + '</ul>'; };
  P12.chain = function (list) { return '<div class="p4-flow">' + list.map(function (x, i) { var id = D.FLOW_LINKS[x]; return (i ? ic('arrow') : '') + (id ? '<a href="screens.html#' + id + '"><span>' + esc(x) + '</span></a>' : '<span>' + esc(x) + '</span>'); }).join('') + '</div>'; };
  P12.tag = function (k, dev) { return (dev ? '<span class="dl">' + t(dev) + '</span>' : '') + '<span class="tag ' + k + '">' + t(D.DEV_LBL[k]) + '</span>'; };
  // Engine values can be a number, a list of ids or an [id, en] label.
  P12.val = function (v) {
    if (v == null || v === '') return '';
    if (typeof v === 'number' || typeof v === 'string') return esc(v);
    if (Array.isArray(v)) { if (v.length === 2 && typeof v[0] === 'string' && typeof v[1] === 'string' && / /.test(v[0] + v[1])) return t(v); return v.map(function (x) { return Array.isArray(x) ? t(x) : esc(x); }).join(', '); }
    return '';
  };
  // A signed-in context for a demo username (read-only engine getters need one).
  P12.ctx = function (u) { var X = window.JFACCESS, usr = X && X.USERS.filter(function (x) { return x.u === u; })[0], r = usr && X.resolve(usr.id); return r && r.ok ? r : null; };
})();
