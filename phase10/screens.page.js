/* Phase 10 screen register: the 62 screens grouped by NP, with their specification fields */
(function () {
  var DS = JFDS, D = JFFIN_DOCS, M = JFFIN, C = JFOS, L = DS.L, t = DS.t, ic = DS.ic, esc = DS.esc, B = DS.Button;
  document.getElementById('herobtns').innerHTML = B.Primary({ label: L('Buka aplikasi', 'Open the app'), icon: 'arrow', href: '../app/login.html' }) + B.Ghost({ label: L('Ringkasan Fase 10', 'Phase 10 overview'), icon: 'grid', href: 'index.html' });
  var ORDER = ['owner', 'finance', 'supply', 'assetadm', 'opsmgr'];
  var NAMES = { owner: L('Owner / CEO', 'Owner / CEO'), finance: L('Finance / CFO admin', 'Finance / CFO admin'), supply: L('Supply / Purchasing', 'Supply / Purchasing'), assetadm: L('Asset Admin', 'Asset Admin'), opsmgr: L('Manajer Operasional', 'Operations Manager') };
  function roles(perm) { return ORDER.filter(function (k) { var r = C.ROLES[k]; return r && (r.perms || []).indexOf(perm) >= 0; }); }
  var SAMPLE = { 'ACC-004': 'JV-2610-0131', 'CASH-002': 'ACC-01', 'AR-002': 'INV-2610-005', 'AR-003': 'INV-2610-001', 'AP-002': 'EXP-2610-005', 'AP-005': 'APAY-2609-002', 'ITEM-002': 'IT-BTW-01', 'PRICE-002': 'SV-001', 'INV-003': 'CHM-DET-01', 'PUR-002': 'PR-2610-002', 'PUR-004': 'RFQ-2610-001', 'PUR-005': 'RFQ-2610-001', 'PUR-006': 'PO-2609-014', 'PUR-007': 'SUP-01', 'AST-003': 'AST-W01', 'CFO-002': 'runway', 'CFO-004': 'branch' };
  var PREF = { 'CFO-001': 'owner', 'CFO-002': 'owner', 'CFO-003': 'owner', 'CFO-004': 'owner', 'CFO-005': 'owner', 'CFO-006': 'owner', 'CFO-007': 'owner', 'PRICE-005': 'owner', 'AST-001': 'assetadm', 'AST-002': 'assetadm', 'AST-003': 'assetadm' };
  var COMPS = { T03: 'Card.Detail, Data.KV, Drill', T04: 'Form, Dialog, Button.XL', T05: 'Data.Table, Tabs, Filter', T08: 'Card.KPI, Chart, Data.Table, Insight' };
  function spec(s) {
    var rs = roles(s.p), v2 = P10.visual(s.nv), arch = C.ARCH && C.ARCH[s.a];
    var who = PREF[s.id] && rs.indexOf(PREF[s.id]) >= 0 ? PREF[s.id] : rs[0];
    var open = who ? D.go(who, s.id + (SAMPLE[s.id] ? '/' + SAMPLE[s.id] : '')) : null;
    var x = D.SPEC[s.id] || {}, dv = s.dev || 'd', DV = { d: 'Desktop', t: 'iPad Pro', m: 'Mobile' };
    function v(y) { return y == null ? '—' : Array.isArray(y) ? t(y) : esc(y); }
    var F = [[L('Tujuan', 'Purpose'), t(s.pur)], [L('Peran yang boleh', 'Allowed roles'), rs.map(function (k) { return t(NAMES[k]); }).join(', ') || '—'], [L('Pintu masuk', 'Entry point'), v(x.entry)],
      [L('Aksi utama', 'Primary action'), v(x.act)], [L('Aksi sekunder', 'Secondary action'), v(x.act2)],
      [L('Izin', 'Permission'), '<code class="p3-code">' + esc(s.p) + '</code> ' + (M.PERMS[s.p] ? t(M.PERMS[s.p]) : '')], [L('Validasi', 'Validation'), v(x.val)],
      [L('State', 'States'), t(L('Loading, kosong: ', 'Loading, empty: ')) + t(s.emp) + ' · ' + t(L('error, tanpa akses, sukses; kesegaran data di setiap dashboard', 'error, no access, success; data freshness on every dashboard'))],
      [L('Event audit', 'Audit events'), '<code class="p3-code">' + v(x.aud) + '</code>'], [L('Responsif', 'Responsive'), '<b>' + DV[dv] + '</b> · ' + t(D.DEV_TXT[dv])], [L('Bahasa', 'Language'), 'ID | EN (' + t(L('default Indonesia', 'Indonesian default')) + ')'],
      [L('NP / NV', 'NP / NV'), esc(s.np) + ' · <code class="p3-code">' + esc(s.nv) + '</code>' + (v2 ? ' ' + t(v2.t) : '')], [L('Arketipe Fase 3', 'Phase 3 archetype'), arch ? esc(s.a) + ' ' + t(arch.n) : esc(s.a || '—')], [L('Komponen', 'Design components'), esc(COMPS[s.a] || 'Card, Data.KV, Button')]];
    return '<article class="p4-spec" id="' + esc(s.id) + '"><div class="p4-spec__h"><code class="p3-code">' + esc(s.id) + '</code><h3>' + t(s.n) + '</h3>' + (open ? '<a href="' + esc(open) + '" style="margin-left:auto;display:inline-flex;align-items:center;gap:4px;min-height:var(--jf-touch);font-weight:600">' + t(L('Buka', 'Open')) + ic('arrow') + '</a>' : '') + '</div>' +
      '<dl>' + F.map(function (f) { return '<dt>' + t(f[0]) + '</dt><dd>' + f[1] + '</dd>'; }).join('') + '</dl></article>';
  }
  var h = P3.section({ id: 'toc', icon: 'list', title: L('Inventaris layar', 'Screen inventory'), desc: L(M.SCREENS.length + ' layar Fase 10 dari inventaris §95. FIN-001 sampai FIN-005 memakai awalan ACC- agar tidak bentrok dengan layar finance Fase 5.', M.SCREENS.length + ' Phase 10 screens from the §95 inventory. FIN-001 to FIN-005 carry an ACC- prefix so they do not clash with the Phase 5 finance screens.'),
    body: '<div class="p4-toc">' + M.SCREENS.map(function (s) { return '<a href="#' + s.id + '">' + esc(s.id) + '</a>'; }).join('') + '</div>' });
  D.NP.forEach(function (n) {
    var list = M.SCREENS.filter(function (s) { return s.np === n.k; }); if (!list.length) return;
    h += P3.section({ id: n.id, icon: n.ic, title: L(n.k + ' · ' + n.t[0], n.k + ' · ' + n.t[1]), desc: L(list.length + ' layar', list.length + ' screens'), body: '<div class="p4-specs">' + list.map(spec).join('') + '</div>' });
  });
  P3.mount('#page', h);
  if (location.hash) { var el = document.getElementById(location.hash.slice(1)); if (el) setTimeout(function () { el.scrollIntoView(); }, 50); }
})();
