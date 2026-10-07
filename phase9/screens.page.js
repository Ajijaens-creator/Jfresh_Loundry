/* Phase 9 screen register: the screens grouped by NP, with the §77 specification fields */
(function () {
  var DS = JFDS, D = JFDLV_DOCS, M = JFDLV, C = JFOS, L = DS.L, t = DS.t, ic = DS.ic, esc = DS.esc, B = DS.Button;
  document.getElementById('herobtns').innerHTML = B.Primary({ label: L('Buka aplikasi', 'Open the app'), icon: 'arrow', href: '../app/login.html' }) + B.Ghost({ label: L('Ringkasan Fase 9', 'Phase 9 overview'), icon: 'grid', href: 'index.html' });
  var ORDER = ['driver', 'client', 'supervisor', 'opsmgr', 'finance', 'owner', 'sales', 'prod3'];
  var NAMES = { driver: 'Driver', client: L('Klien', 'Client'), supervisor: 'Supervisor', opsmgr: L('Manajer Operasional', 'Operations Manager'), finance: 'Finance', owner: L('Owner / CEO', 'Owner / CEO'), sales: L('Sales / Account', 'Sales / Account'), prod3: 'Team 3' };
  function roles(perm) { return ORDER.filter(function (k) { return (M.ROLE_PERMS[k] || []).indexOf(perm) >= 0; }); }
  var SAMPLE = { 'REL-002': 'REL-2610-002', 'DISP-002': 'DLV-2610-009', 'DLV-POD-002': 'DLV-2610-001', 'REC-001': 'DLV-2610-010', 'RETURN-001': 'RET-2610-01', 'REDEL-001': 'DLV-2610-011', 'COMP-001': 'DLV-2610-010', 'BILL-002': 'DLV-2610-004', 'DLV-TIMELINE-001': 'DLV-2610-001', 'CLIENT-DEL-001': 'DLV-2610-004' };
  var PREF = { 'COMP-001': 'opsmgr', 'BILL-001': 'finance', 'BILL-002': 'finance', 'DLV-KPI-001': 'owner', 'FEEDBACK-001': 'client', 'DLV-ISSUE-001': 'supervisor' };
  var COMPS = { T02: 'Data.List, Tabs, Card.Task', T03: 'Card.Detail, Data.KV, Stepper', T04: 'Form, Button.XL, Checklist', T05: 'Data.Table, Tabs, Dialog', T06: 'Form, Rating, Data.List', T08: 'Card.KPI, Chart.Line, Data.Table' };
  function spec(s) {
    var rs = roles(s.p), v2 = P9.visual(s.nv), arch = C.ARCH && C.ARCH[s.a];
    var who = PREF[s.id] && rs.indexOf(PREF[s.id]) >= 0 ? PREF[s.id] : rs[0];
    var open = who ? D.go(who, s.id + (SAMPLE[s.id] ? '/' + SAMPLE[s.id] : '')) : null;
    var x = D.SPEC[s.id] || {}, dv = s.dev || 'd', DV = { d: 'Desktop', t: 'iPad', m: 'Mobile' };
    function v(y) { return y == null ? '—' : Array.isArray(y) ? t(y) : esc(y); }
    var F = [[L('Tujuan', 'Purpose'), t(s.pur)], [L('Peran yang boleh', 'Allowed roles'), rs.map(function (k) { return t(NAMES[k]); }).join(', ') || '—'], [L('Pintu masuk', 'Entry point'), v(x.entry)],
      [L('Aksi utama', 'Primary action'), v(x.act)], [L('Aksi sekunder', 'Secondary action'), v(x.act2)],
      [L('Izin', 'Permission'), '<code class="p3-code">' + esc(s.p) + '</code> ' + (M.PERMS[s.p] ? t(M.PERMS[s.p]) : '')], [L('Validasi', 'Validation'), v(x.val)],
      [L('State', 'States'), t(L('Loading, kosong: ', 'Loading, empty: ')) + t(s.emp) + ' · ' + t(L('error: ', 'error: ')) + t(s.err) + ' · ' + t(L('offline ("Tidak ada koneksi"), tanpa akses, sukses', 'offline ("Tidak ada koneksi"), no access, success'))],
      [L('Event audit', 'Audit events'), '<code class="p3-code">' + v(x.aud) + '</code>'], [L('Responsif', 'Responsive'), '<b>' + DV[dv] + '</b> · ' + t(D.DEV_TXT[dv])], [L('Bahasa', 'Language'), 'ID | EN (' + t(L('default Indonesia', 'Indonesian default')) + ')'],
      [L('NP / NV', 'NP / NV'), esc(s.np) + ' · <code class="p3-code">' + esc(s.nv) + '</code>' + (v2 ? ' ' + t(v2.t) : '')], [L('Arketipe Fase 3', 'Phase 3 archetype'), arch ? esc(s.a) + ' ' + t(arch.n) : esc(s.a || '—')], [L('Komponen', 'Design components'), esc(COMPS[s.a] || 'Card, Data.KV, Button')]];
    return '<article class="p4-spec" id="' + esc(s.id) + '"><div class="p4-spec__h"><code class="p3-code">' + esc(s.id) + '</code><h3>' + t(s.n) + '</h3>' + (open ? '<a href="' + esc(open) + '" style="margin-left:auto;display:inline-flex;align-items:center;gap:4px;min-height:var(--jf-touch);font-weight:600">' + t(L('Buka', 'Open')) + ic('arrow') + '</a>' : '') + '</div>' +
      '<dl>' + F.map(function (f) { return '<dt>' + t(f[0]) + '</dt><dd>' + f[1] + '</dd>'; }).join('') + '</dl></article>';
  }
  var h = P3.section({ id: 'toc', icon: 'list', title: L('Inventaris layar', 'Screen inventory'), desc: L(M.SCREENS.length + ' layar Fase 9 dari inventaris §76. POD-001, POD-002, ISSUE-001, TIMELINE-001 dan KPI-001 memakai awalan DLV- agar tidak bentrok dengan layar Fase 7 dan Fase 5.', M.SCREENS.length + ' Phase 9 screens from the §76 inventory. POD-001, POD-002, ISSUE-001, TIMELINE-001 and KPI-001 carry a DLV- prefix so they do not clash with Phase 7 and Phase 5 screens.'),
    body: '<div class="p4-toc">' + M.SCREENS.map(function (s) { return '<a href="#' + s.id + '">' + esc(s.id) + '</a>'; }).join('') + '</div>' });
  D.NP.forEach(function (n) {
    var list = M.SCREENS.filter(function (s) { return s.np === n.k; }); if (!list.length) return;
    h += P3.section({ id: n.id, icon: n.ic, title: L(n.k + ' · ' + n.t[0], n.k + ' · ' + n.t[1]), desc: L(list.length + ' layar', list.length + ' screens'), body: '<div class="p4-specs">' + list.map(spec).join('') + '</div>' });
  });
  P3.mount('#page', h);
  if (location.hash) { var el = document.getElementById(location.hash.slice(1)); if (el) setTimeout(function () { el.scrollIntoView(); }, 50); }
})();
