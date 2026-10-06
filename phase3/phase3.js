/* JFRESH OS — Phase 3 documentation helpers (layout only; components come from JFDS) */
(function () {
  var DS = window.JFDS, t = DS.t, ic = DS.ic, esc = DS.esc;
  var P3 = window.P3 = {};
  P3.mount = function (sel, html) { var el = document.querySelector(sel); if (el) el.innerHTML = html; return el; };
  // Section panel: n number, key id, icon, title pair, desc pair, body html
  P3.section = function (o) {
    return '<section class="panel p3-sec" id="' + esc(o.id) + '"><div class="panel-h">' + (o.n ? '<span class="p3-num">' + esc(o.n) + '</span>' : '<span class="ico">' + ic(o.icon || 'layers') + '</span>') +
      '<div class="ttl"><h2>' + t(o.title) + '</h2>' + (o.desc ? '<p class="desc">' + t(o.desc) + '</p>' : '') + '</div></div>' + o.body + '</section>';
  };
  P3.block = function (title, body, cls) { return '<div class="p3-block' + (cls ? ' ' + cls : '') + '">' + (title ? '<h3>' + t(title) + '</h3>' : '') + body + '</div>'; };
  P3.spec = function (name, cls) { return '<div class="p3-spec"><span class="p3-name">' + esc(name) + '</span>' + (cls ? '<code class="p3-code">' + esc(cls) + '</code>' : '') + '</div>'; };
  P3.rules = function (kind, items) { return '<ul class="p3-rules ' + kind + '">' + items.map(function (x) { return '<li>' + ic(kind === 'do' ? 'checkc' : 'xc') + '<span>' + t(x) + '</span></li>'; }).join('') + '</ul>'; };
  P3.dodont = function (doT, doItems, dontT, dontItems) {
    return '<div class="p3-dd"><div><h4 class="do-h">' + ic('checkc') + t(doT) + '</h4>' + P3.rules('do', doItems) + '</div><div><h4 class="dont-h">' + ic('xc') + t(dontT) + '</h4>' + P3.rules('dont', dontItems) + '</div></div>';
  };
  P3.ref = function (img, title) {
    return '<details class="p3-ref"><summary>' + ic('image') + '<span>' + t(title || DS.L('Visual acuan yang disetujui', 'Approved reference visual')) + '</span>' + ic('chevd') + '</summary><a href="../assets/brand/phase3/' + esc(img) + '" target="_blank" rel="noopener"><img src="../assets/brand/phase3/' + esc(img) + '" alt="" loading="lazy"></a></details>';
  };
  P3.table = function (head, rows) {
    return '<div class="p3-tw"><table class="p3-table"><thead><tr>' + head.map(function (h) { return '<th scope="col">' + t(h) + '</th>'; }).join('') + '</tr></thead><tbody>' +
      rows.map(function (r) { return '<tr>' + r.map(function (c) { return '<td' + (typeof c === 'string' && /^[\d.,\/ px–%-]+$/.test(c) ? ' class="n"' : '') + '>' + (typeof c === 'string' && c.charAt(0) === '<' ? c : t(c)) + '</td>'; }).join('') + '</tr>'; }).join('') + '</tbody></table></div>';
  };
  P3.phone = function (n, title, body) { return '<div class="p3-phone"><div class="p3-phone__h"><span class="p3-num">' + esc(n) + '</span>' + t(title) + '</div><div class="p3-phone__b ds">' + body + '</div></div>'; };
})();
