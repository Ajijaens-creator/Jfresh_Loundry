/* Phase 6 screen register: the 29 screens grouped by NP, with the 18 §65 specification fields */
(function () {
  var DS = JFDS, D = JFCOMM_DOCS, M = JFCOMM, C = JFOS, L = DS.L, t = DS.t, ic = DS.ic, esc = DS.esc, B = DS.Button;
  document.getElementById('herobtns').innerHTML = B.Primary({ label: L('Buka aplikasi', 'Open the app'), icon: 'arrow', href: '../app/login.html' }) + B.Ghost({ label: L('Ringkasan Fase 6', 'Phase 6 overview'), icon: 'grid', href: 'index.html' });
  var ORDER = ['owner', 'sales', 'finance', 'opsmgr', 'supervisor', 'client'];
  var NAMES = { owner: L('Owner / CEO', 'Owner / CEO'), sales: L('Sales / Account', 'Sales / Account'), finance: 'Finance', opsmgr: L('Manajer Operasional', 'Operations Manager'), supervisor: 'Supervisor', client: L('Klien', 'Client') };
  function roles(perm) { return ORDER.filter(function (k) { return (M.ROLE_PERMS[k] || []).indexOf(perm) >= 0; }); }
  var SAMPLE = { 'CLIENT-002': '/CL-07', 'PROPERTY-002': '/PR-07A', 'CONTACT-002': '/CT-071', 'CONTRACT-002': '/CTR-2025-022', 'CONTRACT-003': '/CTR-2025-022', 'CONTRACT-004': '/CTR-2025-022', 'RATE-002': '/RC-07', 'RATE-003': '/RC-07', 'SLA-002': '/ORD-2610-04123', 'RENEW-002': '/CTR-2025-020', 'OPP-002': '/OPP-001' };
  function spec(s) {
    var rs = roles(s.p), v2 = P6.visual(s.nv), arch = C.ARCH && C.ARCH[s.a];
    var open = rs.length ? D.go(rs[0], s.id + (SAMPLE[s.id] || '')) : null;
    var x = D.SPEC[s.id] || {}, dv = D.device(s.id), DV = { d: 'Desktop', t: 'iPad', m: 'Mobile' };
    function v(y) { return y == null ? '—' : Array.isArray(y) ? t(y) : esc(y); }
    var F = [[L('Tujuan', 'Purpose'), t(s.pur)], [L('Peran yang boleh', 'Allowed roles'), rs.map(function (k) { return t(NAMES[k]); }).join(', ') || '—'], [L('Pintu masuk', 'Entry point'), v(x.entry)],
      [L('Data utama', 'Primary data'), v(x.data)], [L('Aksi utama', 'Primary action'), v(x.act)], [L('Aksi lain', 'Secondary actions'), v(x.sec)], [L('Filter', 'Filters'), v(x.flt)],
      [L('Izin', 'Permission'), '<code class="p3-code">' + esc(s.p) + '</code> ' + (M.PERMS[s.p] ? t(M.PERMS[s.p]) : '')], [L('Validasi', 'Validation'), v(x.val)],
      [L('State', 'States'), t(L('Loading, kosong: ', 'Loading, empty: ')) + t(s.emp) + ' · ' + t(L('error: ', 'error: ')) + t(s.err) + ' · ' + t(L('peringatan, tanpa akses, sukses', 'warning, no access, success'))],
      [L('Event audit', 'Audit events'), '<code class="p3-code">' + v(x.aud) + '</code>'], [L('Responsif', 'Responsive'), '<b>' + DV[dv] + '</b> · ' + t(D.DEV_TXT[dv])], [L('Bahasa', 'Language'), 'ID | EN (' + t(L('default Indonesia', 'Indonesian default')) + ')'],
      [L('NB', 'NB mapping'), v(x.nb) + ' · ' + esc(s.np)], [L('NV / visual', 'NV mapping'), '<code class="p3-code">' + esc(s.nv) + '</code> ' + (v2 ? t(v2.t) : '')], [L('Komponen Fase 3', 'Phase 3 components'), v(x.cmp) + (arch ? ' · ' + esc(s.a) + ' ' + t(arch.n) : '')]];
    return '<article class="p4-spec" id="' + esc(s.id) + '"><div class="p4-spec__h"><code class="p3-code">' + esc(s.id) + '</code><h3>' + t(s.n) + '</h3>' + (open ? '<a href="' + esc(open) + '" style="margin-left:auto;display:inline-flex;align-items:center;gap:4px;min-height:var(--jf-touch);font-weight:600">' + t(L('Buka', 'Open')) + ic('arrow') + '</a>' : '') + '</div>' +
      '<dl>' + F.map(function (f) { return '<dt>' + t(f[0]) + '</dt><dd>' + f[1] + '</dd>'; }).join('') + '</dl></article>';
  }
  var h = P3.section({ id: 'toc', icon: 'list', title: L('Inventaris layar', 'Screen inventory'), desc: L(M.SCREENS.length + ' layar Fase 6: 27 layar inventaris §64, portal klien dan alert komersial. Setiap layar memuat 18 field spesifikasi §65.', M.SCREENS.length + ' Phase 6 screens: the 27 §64 inventory screens, the client portal and commercial alerts. Every screen carries the 18 §65 specification fields.'),
    body: '<div class="p4-toc">' + M.SCREENS.map(function (s) { return '<a href="#' + s.id + '">' + esc(s.id) + '</a>'; }).join('') + '</div>' });
  D.NP.forEach(function (n) {
    var list = M.SCREENS.filter(function (s) { return s.np === n.k; });
    h += P3.section({ id: n.id, icon: n.ic, title: L(n.k + ' · ' + n.t[0], n.k + ' · ' + n.t[1]), desc: L(list.length + ' layar', list.length + ' screens'), body: '<div class="p4-specs">' + list.map(spec).join('') + '</div>' });
  });
  P3.mount('#page', h);
  if (location.hash) { var el = document.getElementById(location.hash.slice(1)); if (el) setTimeout(function () { el.scrollIntoView(); }, 50); }
})();
