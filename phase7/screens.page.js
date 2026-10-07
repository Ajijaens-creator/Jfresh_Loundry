/* Phase 7 screen register: the 27 screens grouped by NP, with the §85 specification fields */
(function () {
  var DS = JFDS, D = JFLOG_DOCS, M = JFLOG, C = JFOS, L = DS.L, t = DS.t, ic = DS.ic, esc = DS.esc, B = DS.Button;
  document.getElementById('herobtns').innerHTML = B.Primary({ label: L('Buka aplikasi', 'Open the app'), icon: 'arrow', href: '../app/login.html' }) + B.Ghost({ label: L('Ringkasan Fase 7', 'Phase 7 overview'), icon: 'grid', href: 'index.html' });
  var ORDER = ['driver', 'supervisor', 'opsmgr', 'operator', 'owner', 'sales', 'client'];
  var NAMES = { driver: 'Driver', supervisor: L('Supervisor / Dispatcher', 'Supervisor / Dispatcher'), opsmgr: L('Manajer Operasional', 'Operations Manager'), operator: L('Operator receiving', 'Receiving operator'), owner: L('Owner / CEO', 'Owner / CEO'), sales: L('Sales / Account', 'Sales / Account'), client: L('Klien', 'Client') };
  function roles(perm) { return ORDER.filter(function (k) { return (M.ROLE_PERMS[k] || []).indexOf(perm) >= 0; }); }
  var SAMPLE = { 'ORDER-003': '/ORD-2610-103', 'SCHEDULE-002': '/SCH-01', 'ROUTE-002': '/TRP-2610-01', 'DRIVER-MOB-002': '/ORD-2610-103', 'DRIVER-MOB-003': '/ORD-2610-103', 'MANIFEST-001': '/MF-2610-05', 'EVIDENCE-001': '/ORD-2610-102', 'ISSUE-001': '/ORD-2610-103', 'TRACK-002': '/TRP-2610-01', 'TRACK-003': '/ORD-2610-103', 'CHAT-001': '/ORD-2610-103', 'TIMELINE-001': '/TRP-2610-01' };
  // Open each screen as the role that uses it most.
  var PREF = { 'DRIVER-MOB-003': 'driver', 'POD-001': 'driver', 'ISSUE-001': 'driver', 'ARRIVAL-001': 'operator', 'HANDOVER-001': 'operator', 'LOG-KPI-001': 'owner' };
  function spec(s) {
    var rs = roles(s.p), v2 = P7.visual(s.nv), arch = C.ARCH && C.ARCH[s.a];
    var who = PREF[s.id] && rs.indexOf(PREF[s.id]) >= 0 ? PREF[s.id] : rs.filter(function (k) { return k !== 'opsmgr'; })[0] || rs[0];
    var open = who && !(s.id === 'POD-001') ? D.go(who, s.id + (SAMPLE[s.id] || '')) : who ? D.go(who, 'DRIVER-MOB-001') : null;
    var x = D.SPEC[s.id] || {}, dv = D.device(s.id), DV = { d: 'Desktop', t: 'iPad', m: 'Mobile' };
    function v(y) { return y == null ? '—' : Array.isArray(y) ? t(y) : esc(y); }
    var F = [[L('Tujuan', 'Purpose'), t(s.pur)], [L('Peran yang boleh', 'Allowed roles'), rs.map(function (k) { return t(NAMES[k]); }).join(', ') || '—'], [L('Pintu masuk', 'Entry point'), v(x.entry)],
      [L('Data utama', 'Primary data'), v(x.data)], [L('Aksi utama', 'Primary action'), v(x.act)], [L('Aksi lain', 'Secondary actions'), v(x.sec)], [L('Filter', 'Filters'), v(x.flt)],
      [L('Izin', 'Permission'), '<code class="p3-code">' + esc(s.p) + '</code> ' + (M.PERMS[s.p] ? t(M.PERMS[s.p]) : '')], [L('Validasi', 'Validation'), v(x.val)],
      [L('State', 'States'), t(L('Loading, kosong: ', 'Loading, empty: ')) + t(s.emp) + ' · ' + t(L('error: ', 'error: ')) + t(s.err) + ' · ' + t(L('offline, sinyal lemah, tanpa akses, sukses', 'offline, weak signal, no access, success'))],
      [L('Event audit', 'Audit events'), '<code class="p3-code">' + v(x.aud) + '</code>'], [L('Responsif', 'Responsive'), '<b>' + DV[dv] + '</b> · ' + t(D.DEV_TXT[dv])], [L('Bahasa', 'Language'), 'ID | EN (' + t(L('default Indonesia', 'Indonesian default')) + ')'],
      [L('NB', 'NB mapping'), v(x.nb) + ' · ' + esc(s.np)], [L('NV / visual', 'NV mapping'), '<code class="p3-code">' + esc(s.nv) + '</code> ' + (v2 ? t(v2.t) : '')], [L('Komponen Fase 3', 'Phase 3 components'), v(x.cmp) + (arch ? ' · ' + esc(s.a) + ' ' + t(arch.n) : '')]];
    return '<article class="p4-spec" id="' + esc(s.id) + '"><div class="p4-spec__h"><code class="p3-code">' + esc(s.id) + '</code><h3>' + t(s.n) + '</h3>' + (open ? '<a href="' + esc(open) + '" style="margin-left:auto;display:inline-flex;align-items:center;gap:4px;min-height:var(--jf-touch);font-weight:600">' + t(L('Buka', 'Open')) + ic('arrow') + '</a>' : '') + '</div>' +
      '<dl>' + F.map(function (f) { return '<dt>' + t(f[0]) + '</dt><dd>' + f[1] + '</dd>'; }).join('') + '</dl></article>';
  }
  var h = P3.section({ id: 'toc', icon: 'list', title: L('Inventaris layar', 'Screen inventory'), desc: L(M.SCREENS.length + ' layar Fase 7 dari inventaris §84. Setiap layar memuat field spesifikasi §85 dan state §86.', M.SCREENS.length + ' Phase 7 screens from the §84 inventory. Every screen carries the §85 specification fields and the §86 states.'),
    body: '<div class="p4-toc">' + M.SCREENS.map(function (s) { return '<a href="#' + s.id + '">' + esc(s.id) + '</a>'; }).join('') + '</div>' });
  D.NP.forEach(function (n) {
    var list = M.SCREENS.filter(function (s) { return s.np === n.k; });
    h += P3.section({ id: n.id, icon: n.ic, title: L(n.k + ' · ' + n.t[0], n.k + ' · ' + n.t[1]), desc: L(list.length + ' layar', list.length + ' screens'), body: '<div class="p4-specs">' + list.map(spec).join('') + '</div>' });
  });
  P3.mount('#page', h);
  if (location.hash) { var el = document.getElementById(location.hash.slice(1)); if (el) setTimeout(function () { el.scrollIntoView(); }, 50); }
})();
