/* Phase 4 screen specifications: §72 inventory with every §73 field */
(function () {
  var DS = JFDS, D = JFACCESS_DOCS, C = JFOS, L = DS.L, t = DS.t, ic = DS.ic, esc = DS.esc, B = DS.Button;
  document.getElementById('herobtns').innerHTML = B.Primary({ label: L('Buka aplikasi', 'Open the app'), icon: 'arrow', href: '../app/login.html' }) + B.Ghost({ label: L('Ringkasan Fase 4', 'Phase 4 overview'), icon: 'grid', href: 'index.html' });
  var G = [['AUTH', L('Autentikasi & Pemulihan', 'Authentication & Recovery'), 'lock'], ['SHELL', L('App Shell', 'App Shell'), 'sidebar'], ['USER', L('Profil & Akun', 'Profile & Account'), 'user'], ['NOTIF', L('Notifikasi', 'Notifications'), 'bell'], ['LAND', L('Landing per Peran', 'Role Landing Pages'), 'home']];
  function nb(list) { return (list || []).map(function (k) { var x = C.NB[k] || C.NV && C.NV[k]; var v = (D.VISUALS.filter(function (v) { return v.k === k; })[0] || {}).t; return '<code class="p3-code">' + esc(k) + '</code> ' + (x ? t(x) : v ? t(v) : ''); }).join(' · '); }
  function spec(s) {
    var F = [[L('Tujuan', 'Purpose'), t(s.purpose)], [L('Peran yang boleh', 'Allowed roles'), t(s.roles)], [L('Titik masuk', 'Entry point'), t(s.entry)], [L('Konten utama', 'Main content'), t(s.main)],
      [L('Aksi utama', 'Primary action'), t(s.primary)], [L('Aksi kedua', 'Secondary action'), t(s.secondary)], [L('Validasi', 'Validation'), t(s.valid)], [L('Izin', 'Permission'), t(s.perm)],
      [L('State', 'States'), t(s.states)], [L('Audit', 'Audit requirement'), esc(s.audit)], [L('Responsif', 'Responsive'), t(s.resp)], [L('Bahasa', 'Language'), t(s.lang)],
      [L('NB', 'NB mapping'), nb(s.nb)], [L('NV / visual', 'NV / visual'), nb(s.nv)], [L('Komponen Fase 3', 'Phase 3 components'), esc(s.comps)]];
    return '<article class="p4-spec" id="' + esc(s.id) + '"><div class="p4-spec__h"><code class="p3-code">' + esc(s.id) + '</code><h3>' + t(s.n) + '</h3>' + (s.link ? '<a href="' + esc(s.link) + '" style="margin-left:auto;display:inline-flex;align-items:center;gap:4px;min-height:var(--jf-touch);font-weight:600">' + t(L('Buka', 'Open')) + ic('arrow') + '</a>' : '') + '</div>' +
      '<dl>' + F.map(function (f) { return '<dt>' + t(f[0]) + '</dt><dd>' + f[1] + '</dd>'; }).join('') + '</dl></article>';
  }
  var h = P3.section({ id: 'toc', icon: 'list', title: L('Inventaris layar', 'Screen inventory'), desc: L(D.SCREENS.length + ' layar. Klik ID untuk melompat.', D.SCREENS.length + ' screens. Click an ID to jump.'),
    body: '<div class="p4-toc">' + D.SCREENS.map(function (s) { return '<a href="#' + s.id + '">' + esc(s.id) + '</a>'; }).join('') + '</div>' });
  G.forEach(function (g) {
    var list = D.SCREENS.filter(function (s) { return s.g === g[0]; });
    h += P3.section({ id: 'g-' + g[0].toLowerCase(), icon: g[2], title: L(g[0] + ' · ' + g[1][0], g[0] + ' · ' + g[1][1]), desc: L(list.length + ' layar', list.length + ' screens'), body: '<div class="p4-specs">' + list.map(spec).join('') + '</div>' });
  });
  P3.mount('#page', h);
  if (location.hash) { var el = document.getElementById(location.hash.slice(1)); if (el) setTimeout(function () { el.scrollIntoView(); }, 50); }
})();
