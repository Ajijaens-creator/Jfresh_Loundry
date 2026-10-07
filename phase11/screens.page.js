/* Phase 11 screen register: every §73 screen grouped by world and NP, with its specification fields and a link into the app as the right demo account */
(function () {
  var DS = JFDS, D = JFP11_DOCS, K = window.JFCLP || {}, S = window.JFSYS || {}, C = JFOS, L = DS.L, t = DS.t, ic = DS.ic, esc = DS.esc, B = DS.Button;
  document.getElementById('herobtns').innerHTML = B.Primary({ label: L('Buka aplikasi', 'Open the app'), icon: 'arrow', href: '../app/login.html' }) + B.Ghost({ label: L('Ringkasan Fase 11', 'Phase 11 overview'), icon: 'grid', href: 'index.html' });
  var ALL = (K.SCREENS || []).concat(S.SCREENS || []);
  var PERMS = {}; [K.PERMS, S.PERMS].forEach(function (m) { Object.keys(m || {}).forEach(function (k) { PERMS[k] = m[k]; }); });
  var CP = K.CP || {}, CPK = {}; Object.keys(CP).forEach(function (k) { CPK[CP[k]] = k; });
  var CROLES = K.roleMatrix ? K.roleMatrix() : [];
  var ORDER = ['superadmin', 'sysadmin', 'owner', 'hr', 'finance', 'opsmgr', 'supervisor', 'sales'];
  function rname(k) { var r = C.ROLES[k]; return r && r.n ? t(r.n) : esc(k); }
  function roles(s) {
    if (/^CLP-/.test(s.id)) {
      var key = CPK[s.p], list = CROLES.filter(function (r) { return s.p === 'clp.portal' || (key && r.perms[key]); });
      return t(L('Klien (per user): ', 'Client (per user): ')) + list.map(function (r) { return t(r.n); }).join(', ');
    }
    return ORDER.filter(function (k) { var r = C.ROLES[k]; return r && (r.perms || []).indexOf(s.p) >= 0; }).map(rname).join(', ') || '—';
  }
  function exp(s) { return /^CLP-/.test(s.id) ? 'client' : /^SYS-/.test(s.id) ? 'superadmin' : 'sysadmin'; }
  var COMPS = { T03: 'Card.Detail, Data.KV, Timeline, Button', T04: 'Form, Dialog, Preview, Button', T05: 'Data.Table, Tabs, Filter, Search, Empty state', T06: 'Form, Stepper, Segment, Button.XL', T08: 'Card.KPI, Status hero, Insight, Quick actions' };
  function devs(s) {
    var d = s.devs || {};
    return '<b>' + t(s.dev === 'm' ? L('HP utama', 'Mobile first') : L('Desktop utama', 'Desktop first')) + '</b> · ' +
      [['m', L('HP', 'Mobile')], ['t', 'iPad Pro'], ['d', 'Desktop']].map(function (x) { return t(x[1]) + ': ' + (D.DEVS[d[x[0]]] ? t(D.DEVS[d[x[0]]]) : esc(d[x[0]] || '—')); }).join(' · ') +
      '<br><small class="hint">' + t(D.DEV_TXT[/^CLP-/.test(s.id) && s.dev === 'm' ? 'm' : 'd']) + '</small>';
  }
  function spec(s) {
    var x = D.SPEC[s.id] || {}, ex = exp(s), who = D.PREF[s.id] || D.WHO[ex];
    var par = !D.SAMPLE[s.id] && S.PARENTS && /^(CFG-002|SEC-003|INT-005)$/.test(s.id) ? S.PARENTS[s.id][0] : null;
    var route = s.id === 'CLP-002' ? '../app/login.html' : D.go(ex, (par || s.id) + (D.SAMPLE[s.id] ? '/' + D.SAMPLE[s.id] : ''));
    var arch = C.ARCH && C.ARCH[s.a];
    function v(y) { return y == null ? '—' : Array.isArray(y) ? t(y) : esc(y); }
    var F = [[L('Tujuan', 'Purpose'), t(s.pur)], [L('Peran yang boleh', 'Allowed roles'), roles(s)], [L('Pintu masuk', 'Entry point'), v(x.entry)],
      [L('Aksi utama', 'Primary action'), v(x.act)], [L('Aksi sekunder', 'Secondary action'), v(x.act2)],
      [L('Izin', 'Permission'), '<code class="p3-code">' + esc(s.p) + '</code> ' + (PERMS[s.p] ? t(PERMS[s.p]) : '')], [L('Validasi', 'Validation'), v(x.val)],
      [L('State', 'States'), t(L('Loading, kosong: ', 'Loading, empty: ')) + t(s.emp) + ' · ' + t(L('error: ', 'error: ')) + (s.err ? t(s.err) : t(L('Data belum berhasil dimuat.', 'Data could not be loaded.'))) + ' · ' + t(L('tanpa akses, sukses', 'no access, success'))],
      [L('Event audit', 'Audit events'), '<code class="p3-code">' + v(x.aud) + '</code>'], [L('Perangkat (§2)', 'Devices (§2)'), devs(s)], [L('Bahasa', 'Language'), 'ID | EN (' + t(L('default Indonesia', 'Indonesian default')) + ')'],
      [L('NP / NV', 'NP / NV'), esc(s.np) + ' · <code class="p3-code">' + esc(s.nv) + '</code>'], [L('Arketipe Fase 3', 'Phase 3 archetype'), arch ? esc(s.a) + ' ' + t(arch.n) : esc(s.a || '—')], [L('Komponen', 'Design components'), esc(COMPS[s.a] || 'Card, Data.KV, Button')],
      [L('Demo', 'Demo'), s.id === 'CLP-002' ? t(L('Semua akun klien; password jfresh123', 'Every client account; password jfresh123')) : P11.who(who) + (par ? ' · ' + t(L('dibuka dari', 'opened from')) + ' <code class="p3-code">' + esc(par) + '</code>' : '')]];
    return '<article class="p4-spec" id="' + esc(s.id) + '"><div class="p4-spec__h"><code class="p3-code">' + esc(s.id) + '</code><h3>' + t(s.n) + '</h3><a href="' + esc(route) + '" style="margin-left:auto;display:inline-flex;align-items:center;gap:4px;min-height:var(--jf-touch);font-weight:600">' + t(L('Buka', 'Open')) + ic('arrow') + '</a></div>' +
      '<dl>' + F.map(function (f) { return '<dt>' + t(f[0]) + '</dt><dd>' + f[1] + '</dd>'; }).join('') + '</dl></article>';
  }
  var nA = (K.SCREENS || []).length, nB = (S.SCREENS || []).length;
  var h = P3.section({ id: 'toc', icon: 'list', title: L('Inventaris layar', 'Screen inventory'), desc: L(ALL.length + ' layar Fase 11 dari inventaris §73: ' + nA + ' layar klien (CLP) dan ' + nB + ' layar sistem (ADM, CFG, NTF, SEC, INT, SYS).', ALL.length + ' Phase 11 screens from the §73 inventory: ' + nA + ' client screens (CLP) and ' + nB + ' system screens (ADM, CFG, NTF, SEC, INT, SYS).'),
    body: D.WORLDS.map(function (w) { var list = ALL.filter(function (s) { return w.np.indexOf(s.np) >= 0; }); return '<p class="p11-world-h">' + ic(w.ic) + t(w.t) + ' · ' + list.length + '</p><div class="p4-toc">' + list.map(function (s) { return '<a href="#' + s.id + '">' + esc(s.id) + '</a>'; }).join('') + '</div>'; }).join('<div style="height:var(--jf-space-4)"></div>') });
  D.NP.forEach(function (n) {
    var list = ALL.filter(function (s) { return s.np === n.k; }); if (!list.length) return;
    h += P3.section({ id: n.id, icon: n.ic, title: L(n.k + ' · ' + n.t[0], n.k + ' · ' + n.t[1]), desc: L((n.w === 'A' ? 'CLIENT · ' : 'SYSTEM · ') + list.length + ' layar', (n.w === 'A' ? 'CLIENT · ' : 'SYSTEM · ') + list.length + ' screens'), body: '<div class="p4-specs">' + list.map(spec).join('') + '</div>' });
  });
  P3.mount('#page', h);
  if (location.hash) { var el = document.getElementById(location.hash.slice(1)); if (el) setTimeout(function () { el.scrollIntoView(); }, 50); }
})();
