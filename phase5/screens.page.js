/* Phase 5 screen register: the 23 screens grouped by NP, with permission, roles, template, visual and states */
(function () {
  var DS = JFDS, D = JFPERF_DOCS, P = JFPERF, C = JFOS, L = DS.L, t = DS.t, ic = DS.ic, esc = DS.esc, B = DS.Button;
  P.install(C, window.JFACCESS);
  document.getElementById('herobtns').innerHTML = B.Primary({ label: L('Buka aplikasi', 'Open the app'), icon: 'arrow', href: '../app/login.html' }) + B.Ghost({ label: L('Ringkasan Fase 5', 'Phase 5 overview'), icon: 'grid', href: 'index.html' });
  function roles(perm) { return C.ROLE_ORDER.filter(function (k) { return C.ROLES[k] && C.ROLES[k].perms.indexOf(perm) >= 0; }); }
  function roleName(k) { return C.ROLES[k] ? t(C.ROLES[k].n || k) : esc(k); }
  function spec(s) {
    var rs = roles(s.p), v = P5.visual(s.nv), arch = C.ARCH[s.a];
    var open = rs.length ? D.go(rs.indexOf('owner') >= 0 ? 'owner' : rs[0], s.id + ({ 'GOL-DTL-001': '/BG-H2-01', 'KPI-DTL-001': '/OPS-01', 'KPI-EDT-001': '/OPS-01', 'TEAM-DTL-001': '/rcv', 'PERF-USR-001': '/EMP-001', 'R2RE-MTG-001': '/R2-REV' }[s.id] || '')) : null;
    var F = [[L('Tujuan', 'Purpose'), t(s.pur)], [L('Template', 'Template'), esc(s.a) + (arch ? ' · ' + t(arch.n) : '')], [L('Izin', 'Permission'), '<code class="p3-code">' + esc(s.p) + '</code> ' + (P.PERMS[s.p] ? t(P.PERMS[s.p]) : '')],
      [L('Peran yang boleh', 'Allowed roles'), rs.map(roleName).join(', ') || '—'], [L('NV / visual', 'NV / visual'), '<code class="p3-code">' + esc(s.nv) + '</code> ' + (v ? t(v.t) + (v.missing ? ' · <b>' + t(L('belum dikirim', 'not sent')) + '</b>' : '') : '')],
      [L('State kosong', 'Empty state'), t(s.emp)], [L('State error', 'Error state'), t(s.err)], [L('State peringatan', 'Warning state'), t(s.warn)], [L('Responsif', 'Responsive'), t(L('PC, iPad, mobile', 'PC, iPad, mobile'))], [L('Bahasa', 'Language'), 'ID | EN']];
    return '<article class="p4-spec" id="' + esc(s.id) + '"><div class="p4-spec__h"><code class="p3-code">' + esc(s.id) + '</code><h3>' + t(s.n) + '</h3>' + (open ? '<a href="' + esc(open) + '" style="margin-left:auto;display:inline-flex;align-items:center;gap:4px;min-height:var(--jf-touch);font-weight:600">' + t(L('Buka', 'Open')) + ic('arrow') + '</a>' : '') + '</div>' +
      '<dl>' + F.map(function (f) { return '<dt>' + t(f[0]) + '</dt><dd>' + f[1] + '</dd>'; }).join('') + '</dl></article>';
  }
  var h = P3.section({ id: 'toc', icon: 'list', title: L('Inventaris layar', 'Screen inventory'), desc: L(P.SCREENS.length + ' layar Fase 5. Klik ID untuk melompat.', P.SCREENS.length + ' Phase 5 screens. Click an ID to jump.'),
    body: '<div class="p4-toc">' + P.SCREENS.map(function (s) { return '<a href="#' + s.id + '">' + esc(s.id) + '</a>'; }).join('') + '</div>' });
  D.NP.forEach(function (n) {
    var list = P.SCREENS.filter(function (s) { return s.np === n.k; });
    h += P3.section({ id: n.id, icon: n.ic, title: L(n.k + ' · ' + n.t[0], n.k + ' · ' + n.t[1]), desc: L(list.length + ' layar', list.length + ' screens'), body: '<div class="p4-specs">' + list.map(spec).join('') + '</div>' });
  });
  P3.mount('#page', h);
  if (location.hash) { var el = document.getElementById(location.hash.slice(1)); if (el) setTimeout(function () { el.scrollIntoView(); }, 50); }
})();
