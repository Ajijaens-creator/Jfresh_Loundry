/* Phase 8 screen register: the screens grouped by NP, with the §86 specification fields */
(function () {
  var DS = JFDS, D = JFPROD_DOCS, M = JFPROD, C = JFOS, L = DS.L, t = DS.t, ic = DS.ic, esc = DS.esc, B = DS.Button;
  document.getElementById('herobtns').innerHTML = B.Primary({ label: L('Buka aplikasi', 'Open the app'), icon: 'arrow', href: '../app/login.html' }) + B.Ghost({ label: L('Ringkasan Fase 8', 'Phase 8 overview'), icon: 'grid', href: 'index.html' });
  var ORDER = ['prod1', 'prod2', 'prod3', 'maint', 'supervisor', 'opsmgr', 'owner', 'driver'];
  var NAMES = { prod1: 'Team 1', prod2: 'Team 2', prod3: 'Team 3', maint: L('Teknisi maintenance', 'Maintenance technician'), supervisor: L('Supervisor produksi', 'Production supervisor'), opsmgr: L('Manajer Operasional', 'Operations Manager'), owner: L('Owner / CEO', 'Owner / CEO'), driver: 'Driver' };
  function roles(perm) { return ORDER.filter(function (k) { return (M.ROLE_PERMS[k] || []).indexOf(perm) >= 0; }); }
  var SAMPLE = { 'PROD-RCV-002': 'RCV-2610-012', 'PROD-DIS-001': 'RCV-2610-009', 'PROD-WGT-001': 'RCV-2610-011', 'PROD-SORT-002': 'RCV-2610-010', 'PROD-WASH-002': 'B-2610-008', 'PROD-DRY-002': 'B-2610-006', 'PROD-FIN-002': 'B-2610-004', 'PROD-QC-002': 'B-2610-003', 'PROD-PACK-002': 'B-2610-002', 'PROD-TRACE-001': 'B-2610-002', 'CHK-002': 'CL-20261006-OPN', 'CHK-004': 'TPL-OPN', 'MNT-003': 'W-04', 'MNT-004': 'MT-2610-013', 'MNT-006': 'WO-2610-01' };
  // Open each screen as the role that uses it most.
  var PREF = { 'PROD-HO-003': 'driver', 'PROD-MACH-001': 'supervisor', 'PROD-ISSUE-002': 'prod2', 'PROD-HIS-001': 'prod1', 'CHK-001': 'prod1', 'CHK-002': 'prod1' };
  function spec(s) {
    var rs = roles(s.p), v2 = P8.visual(s.nv), arch = C.ARCH && C.ARCH[s.a];
    var who = PREF[s.id] && rs.indexOf(PREF[s.id]) >= 0 ? PREF[s.id] : rs.filter(function (k) { return k !== 'opsmgr'; })[0] || rs[0];
    var open = who ? D.go(who, s.id + (SAMPLE[s.id] ? '/' + SAMPLE[s.id] : '')) : null;
    var x = D.SPEC[s.id] || {}, dv = D.device(s.id), DV = { d: 'Desktop', t: 'iPad', m: 'Mobile' };
    function v(y) { return y == null ? '—' : Array.isArray(y) ? t(y) : esc(y); }
    var F = [[L('Tujuan', 'Purpose'), t(s.pur)], [L('Peran yang boleh', 'Allowed roles'), rs.map(function (k) { return t(NAMES[k]); }).join(', ') || '—'], [L('Pintu masuk', 'Entry point'), v(x.entry)],
      [L('Aksi utama', 'Primary action'), v(x.act)],
      [L('Izin', 'Permission'), '<code class="p3-code">' + esc(s.p) + '</code> ' + (M.PERMS[s.p] ? t(M.PERMS[s.p]) : '')], [L('Validasi', 'Validation'), v(x.val)],
      [L('State', 'States'), t(L('Loading, kosong: ', 'Loading, empty: ')) + t(s.emp) + ' · ' + t(L('error: ', 'error: ')) + t(s.err) + ' · ' + t(L('offline ("Tidak ada koneksi"), tanpa akses, sukses', 'offline ("Tidak ada koneksi"), no access, success'))],
      [L('Event audit', 'Audit events'), '<code class="p3-code">' + v(x.aud) + '</code>'], [L('Responsif', 'Responsive'), '<b>' + DV[dv] + '</b> · ' + t(D.DEV_TXT[dv])], [L('Bahasa', 'Language'), 'ID | EN (' + t(L('default Indonesia', 'Indonesian default')) + ')'],
      [L('NP / NV', 'NP / NV'), esc(s.np) + ' · <code class="p3-code">' + esc(s.nv) + '</code>' + (v2 ? ' ' + t(v2.t) : '')], [L('Arketipe Fase 3', 'Phase 3 archetype'), arch ? esc(s.a) + ' ' + t(arch.n) : esc(s.a || '—')]];
    return '<article class="p4-spec" id="' + esc(s.id) + '"><div class="p4-spec__h"><code class="p3-code">' + esc(s.id) + '</code><h3>' + t(s.n) + '</h3>' + (open ? '<a href="' + esc(open) + '" style="margin-left:auto;display:inline-flex;align-items:center;gap:4px;min-height:var(--jf-touch);font-weight:600">' + t(L('Buka', 'Open')) + ic('arrow') + '</a>' : '') + '</div>' +
      '<dl>' + F.map(function (f) { return '<dt>' + t(f[0]) + '</dt><dd>' + f[1] + '</dd>'; }).join('') + '</dl></article>';
  }
  var h = P3.section({ id: 'toc', icon: 'list', title: L('Inventaris layar', 'Screen inventory'), desc: L(M.SCREENS.length + ' layar Fase 8 dari inventaris §86. Setiap layar memuat tujuan, peran, pintu masuk, aksi, validasi, state, audit dan perilaku responsif.', M.SCREENS.length + ' Phase 8 screens from the §86 inventory. Every screen carries its purpose, roles, entry point, action, validation, states, audit and responsive behaviour.'),
    body: '<div class="p4-toc">' + M.SCREENS.map(function (s) { return '<a href="#' + s.id + '">' + esc(s.id) + '</a>'; }).join('') + '</div>' });
  D.NP.forEach(function (n) {
    var list = M.SCREENS.filter(function (s) { return s.np === n.k; }); if (!list.length) return;
    h += P3.section({ id: n.id, icon: n.ic, title: L(n.k + ' · ' + n.t[0], n.k + ' · ' + n.t[1]), desc: L(list.length + ' layar', list.length + ' screens'), body: '<div class="p4-specs">' + list.map(spec).join('') + '</div>' });
  });
  var rest = M.SCREENS.filter(function (s) { return !D.NP.some(function (n) { return n.k === s.np; }); });
  if (rest.length) h += P3.section({ id: 'other', icon: 'grid', title: L('Layar bersama', 'Shared screens'), desc: L(rest.length + ' layar', rest.length + ' screens'), body: '<div class="p4-specs">' + rest.map(spec).join('') + '</div>' });
  P3.mount('#page', h);
  if (location.hash) { var el = document.getElementById(location.hash.slice(1)); if (el) setTimeout(function () { el.scrollIntoView(); }, 50); }
})();
