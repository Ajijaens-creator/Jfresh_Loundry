/* Phase 5 screen register: the 23 screens grouped by NP, with permission, roles, template, visual and states */
(function () {
  var DS = JFDS, D = JFPERF_DOCS, P = JFPERF, C = JFOS, L = DS.L, t = DS.t, ic = DS.ic, esc = DS.esc, B = DS.Button;
  P.install(C, window.JFACCESS);
  document.getElementById('herobtns').innerHTML = B.Primary({ label: L('Buka aplikasi', 'Open the app'), icon: 'arrow', href: '../app/login.html' }) + B.Ghost({ label: L('Ringkasan Fase 5', 'Phase 5 overview'), icon: 'grid', href: 'index.html' });
  function roles(perm) { return C.ROLE_ORDER.filter(function (k) { return C.ROLES[k] && C.ROLES[k].perms.indexOf(perm) >= 0; }); }
  function roleName(k) { return C.ROLES[k] ? t(C.ROLES[k].n || k) : esc(k); }
  function spec(s) {
    var rs = roles(s.p), v2 = P5.visual(s.nv), arch = C.ARCH[s.a];
    var open = rs.length ? D.go(rs.indexOf('owner') >= 0 ? 'owner' : rs[0], s.id + ({ 'GOAL-002': '/BG-H2-01', 'KPI-DTL-001': '/OPS-01', 'KPI-002': '/OPS-01', 'TEAM-002': '/rcv', 'PERSON-001': '/EMP-001', 'RACE-004': '/R2-REV', 'KPI-004': '/OPS-01' }[s.id] || '')) : null;
    var x = D.SPEC[s.id] || {}, dv = D.device(s.id), DV = { d: 'Desktop', t: 'iPad', m: 'Mobile' };
    function v(y) { return y == null ? '—' : Array.isArray(y) ? t(y) : esc(y); }
    var F = [[L('Tujuan', 'Purpose'), t(s.pur)], [L('Peran yang boleh', 'Allowed roles'), rs.map(roleName).join(', ') || '—'], [L('Pintu masuk', 'Entry point'), v(x.entry)],
      [L('KPI utama', 'Main KPIs'), v(x.kpi)], [L('Aksi utama', 'Primary actions'), v(x.act)], [L('Filter', 'Filters'), v(x.flt)], ['Drill-down', v(x.drill)],
      [L('Izin', 'Permission'), '<code class="p3-code">' + esc(s.p) + '</code> ' + (P.PERMS[s.p] ? t(P.PERMS[s.p]) : '')], [L('Sumber data', 'Data sources'), v(x.src) + ' · ' + t(L('kesegaran data ditampilkan', 'freshness shown'))],
      [L('State', 'States'), t(L('Loading, kosong: ', 'Loading, empty: ')) + t(s.emp) + ' · ' + t(L('error: ', 'error: ')) + t(s.err) + ' · ' + t(L('peringatan, tanpa akses, sukses', 'warning, no access, success'))],
      [L('Event audit', 'Audit events'), '<code class="p3-code">' + v(x.aud) + '</code>'], [L('Responsif', 'Responsive'), '<b>' + DV[dv] + '</b> · ' + t(D.DEV_TXT[dv])], [L('Bahasa', 'Language'), 'ID | EN (' + t(L('default Indonesia', 'Indonesian default')) + ')'],
      [L('NB', 'NB mapping'), v(x.nb) + ' · ' + esc(s.np)], [L('NV / visual', 'NV mapping'), '<code class="p3-code">' + esc(s.nv) + '</code> ' + (v2 ? t(v2.t) : '')], [L('Komponen desain', 'Design components'), v(x.cmp) + (arch ? ' · ' + esc(s.a) + ' ' + t(arch.n) : '')]];
    return '<article class="p4-spec" id="' + esc(s.id) + '"><div class="p4-spec__h"><code class="p3-code">' + esc(s.id) + '</code><h3>' + t(s.n) + '</h3>' + (open ? '<a href="' + esc(open) + '" style="margin-left:auto;display:inline-flex;align-items:center;gap:4px;min-height:var(--jf-touch);font-weight:600">' + t(L('Buka', 'Open')) + ic('arrow') + '</a>' : '') + '</div>' +
      '<dl>' + F.map(function (f) { return '<dt>' + t(f[0]) + '</dt><dd>' + f[1] + '</dd>'; }).join('') + '</dl></article>';
  }
  var h = P3.section({ id: 'toc', icon: 'list', title: L('Inventaris layar', 'Screen inventory'), desc: L(P.SCREENS.length + ' layar Fase 5 (inventaris §89 lengkap). Setiap layar memuat 18 field spesifikasi §90.', P.SCREENS.length + ' Phase 5 screens (full §89 inventory). Every screen carries the 18 §90 specification fields.'),
    body: '<div class="p4-toc">' + P.SCREENS.map(function (s) { return '<a href="#' + s.id + '">' + esc(s.id) + '</a>'; }).join('') + '</div>' });
  D.NP.forEach(function (n) {
    var list = P.SCREENS.filter(function (s) { return s.np === n.k; });
    h += P3.section({ id: n.id, icon: n.ic, title: L(n.k + ' · ' + n.t[0], n.k + ' · ' + n.t[1]), desc: L(list.length + ' layar', list.length + ' screens'), body: '<div class="p4-specs">' + list.map(spec).join('') + '</div>' });
  });
  P3.mount('#page', h);
  if (location.hash) { var el = document.getElementById(location.hash.slice(1)); if (el) setTimeout(function () { el.scrollIntoView(); }, 50); }
})();
