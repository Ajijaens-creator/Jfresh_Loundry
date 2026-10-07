/* Phase 12 screen register: every §112 screen (from the JFIMP, JFGO and JFHELP SCREENS specs) grouped by NP, with its specification fields and a link into the app as the right demo account */
(function () {
  var DS = JFDS, D = JFP12_DOCS, I = window.JFIMP || {}, G = window.JFGO || {}, H = window.JFHELP || {}, C = JFOS, L = DS.L, t = DS.t, ic = DS.ic, esc = DS.esc, B = DS.Button;
  document.getElementById('herobtns').innerHTML = B.Primary({ label: L('Buka aplikasi', 'Open the app'), icon: 'arrow', href: '../app/login.html' }) + B.Ghost({ label: L('Ringkasan Fase 12', 'Phase 12 overview'), icon: 'grid', href: 'index.html' });
  var ALL = (I.SCREENS || []).concat(G.SCREENS || [], H.SCREENS || []);
  var NPN = function (s) { return parseInt(String(s.np).slice(3), 10) || 0; };
  ALL.sort(function (a, b) { return NPN(a) - NPN(b); });
  var PERMS = {}; [I.PERMS, G.PERMS, H.PERMS].forEach(function (m) { Object.keys(m || {}).forEach(function (k) { PERMS[k] = m[k]; }); });
  var PARENTS = {}; [I.PARENTS, G.PARENTS, H.PARENTS].forEach(function (m) { Object.keys(m || {}).forEach(function (k) { PARENTS[k] = m[k]; }); });
  var ORDER = (C.ROLE_ORDER || Object.keys(C.ROLES)).slice();
  // Project roles first, then the approvers and technical roles, then everyone else.
  var FIRST = ['implead', 'qalead', 'datalead', 'trainer', 'owner', 'finance', 'superadmin', 'sysadmin'];
  ORDER = FIRST.concat(ORDER.filter(function (k) { return FIRST.indexOf(k) < 0; }));
  function rname(k) { var r = C.ROLES[k]; return r && r.n ? t(r.n) : esc(k); }
  function roles(s) {
    if (!s.p) return t(L('Semua peran, termasuk klien (sama seperti Bantuan Fase 4)', 'Every role, including clients (same as the Phase 4 Help)'));
    var list = ORDER.filter(function (k) { var r = C.ROLES[k]; return r && (r.perms || []).indexOf(s.p) >= 0; });
    if (list.length > 10) return list.slice(0, 8).map(rname).join(', ') + ' ' + t(L('dan ' + (list.length - 8) + ' peran lain', 'and ' + (list.length - 8) + ' more roles'));
    return list.map(rname).join(', ') || '—';
  }
  function exp(s) { return D.PREF[s.id] || D.EXP[s.id.split('-')[0]] || 'implead'; }
  var COMPS = { T03: 'Card.Detail, Data.KV, Timeline, Button', T04: 'Form, Dialog, Preview, Button', T05: 'Data.Table, Tabs, Filter, Search, Empty state', T06: 'Form, Stepper, Segment, Button.XL', T08: 'Card.KPI, Status hero, Stepper, Insight, Quick actions' };
  function devs(s) {
    var d = s.devs || {};
    return '<b>' + t(s.dev === 'm' ? L('Semua perangkat utama', 'Every device primary') : L('Desktop utama', 'Desktop first')) + '</b> · ' +
      [['m', L('HP', 'Mobile')], ['t', 'iPad Pro'], ['d', 'Desktop']].map(function (x) { return t(x[1]) + ': ' + (D.DEVS[d[x[0]]] ? t(D.DEVS[d[x[0]]]) : esc(d[x[0]] || '—')); }).join(' · ') +
      '<br><small class="hint">' + t(D.DEV_TXT[s.dev === 'm' ? 'm' : 'd']) + '</small>';
  }
  function spec(s) {
    var x = D.SPEC[s.id] || {}, ex = exp(s), who = D.WHO[ex];
    var route = D.go(ex, s.id + (D.SAMPLE[s.id] ? '/' + D.SAMPLE[s.id] : ''));
    var arch = C.ARCH && C.ARCH[s.a], par = PARENTS[s.id] && PARENTS[s.id][0];
    function v(y) { return y == null ? '—' : Array.isArray(y) ? t(y) : esc(y); }
    var F = [[L('Tujuan', 'Purpose'), s.pur ? t(s.pur) : '—'], [L('Peran yang boleh', 'Allowed roles'), roles(s)], [L('Pintu masuk', 'Entry point'), v(x.entry)],
      [L('Aksi utama', 'Primary action'), v(x.act)], [L('Aksi sekunder', 'Secondary action'), v(x.act2)],
      [L('Izin', 'Permission'), s.p ? '<code class="p3-code">' + esc(s.p) + '</code> ' + (PERMS[s.p] ? t(PERMS[s.p]) : '') : t(L('Tanpa izin khusus (layar layanan mandiri)', 'No specific permission (self-service screen)'))], [L('Validasi', 'Validation'), v(x.val)],
      [L('State', 'States'), t(L('Loading, kosong: ', 'Loading, empty: ')) + (s.emp ? t(s.emp) : '—') + ' · ' + t(L('error: ', 'error: ')) + (s.err ? t(s.err) : t(L('Data belum berhasil dimuat.', 'Data could not be loaded.'))) + ' · ' + t(L('tanpa akses, sukses', 'no access, success'))],
      [L('Event audit', 'Audit events'), '<code class="p3-code">' + v(x.aud) + '</code>'], [L('Perangkat (§113)', 'Devices (§113)'), devs(s)], [L('Bahasa', 'Language'), 'ID | EN (' + t(L('default Indonesia', 'Indonesian default')) + ')'],
      [L('NP / NV / engine', 'NP / NV / engine'), esc(s.np) + ' · <code class="p3-code">' + esc(s.nv) + '</code> · ' + esc(s.dom === 'imp12' ? 'JFIMP' : s.dom === 'go12' ? 'JFGO' : 'JFHELP')],
      [L('Arketipe Fase 3', 'Phase 3 archetype'), arch ? esc(s.a) + ' ' + t(arch.n) : esc(s.a || '—')], [L('Komponen', 'Design components'), esc(COMPS[s.a] || 'Card, Data.KV, Button')],
      [L('Demo', 'Demo'), P12.who(who) + (D.SAMPLE[s.id] ? ' · ' + t(L('contoh', 'sample')) + ' <code class="p3-code">' + esc(D.SAMPLE[s.id]) + '</code>' : '') + (par ? ' · ' + t(L('dibuka dari', 'opened from')) + ' <a href="#' + esc(par) + '"><code class="p3-code">' + esc(par) + '</code></a>' : '') + (!s.p ? ' · ' + t(L('juga klien: ', 'also clients: ')) + '<code class="p3-code">arya.jaens</code>' : '')]];
    return '<article class="p4-spec" id="' + esc(s.id) + '"><div class="p4-spec__h"><code class="p3-code">' + esc(s.id) + '</code><h3>' + t(s.n) + '</h3><a href="' + esc(route) + '" style="margin-left:auto;display:inline-flex;align-items:center;gap:4px;min-height:var(--jf-touch);font-weight:600">' + t(L('Buka', 'Open')) + ic('arrow') + '</a></div>' +
      '<dl>' + F.map(function (f) { return '<dt>' + t(f[0]) + '</dt><dd>' + f[1] + '</dd>'; }).join('') + '</dl></article>';
  }
  var nI = (I.SCREENS || []).length, nG = (G.SCREENS || []).length, nH = (H.SCREENS || []).length;
  var h = P3.section({ id: 'toc', icon: 'list', title: L('Inventaris layar', 'Screen inventory'),
    desc: L(ALL.length + ' layar Fase 12 dari inventaris §112: ' + nI + ' dari JFIMP (IMP, DATA, BUILD, QA, SVL, RLB), ' + nG + ' dari JFGO (MIG, UAT, CUT, LIVE, OPT) dan ' + nH + ' dari JFHELP (HELP). SEC-001…004 menjadi SVL-001…004 dan REL-001…005 menjadi RLB-001…005 karena ID itu sudah dipakai Fase 11 dan Fase 9; HELP-001 Bantuan Fase 4 menjadi Smart Help Home dan tetap terbuka untuk setiap peran.',
      ALL.length + ' Phase 12 screens from the §112 inventory: ' + nI + ' from JFIMP (IMP, DATA, BUILD, QA, SVL, RLB), ' + nG + ' from JFGO (MIG, UAT, CUT, LIVE, OPT) and ' + nH + ' from JFHELP (HELP). SEC-001…004 became SVL-001…004 and REL-001…005 became RLB-001…005 because Phase 11 and Phase 9 already use those IDs; the Phase 4 HELP-001 Help became the Smart Help Home and stays open to every role.'),
    body: D.NP.map(function (n) { var list = ALL.filter(function (s) { return s.np === n.k; }); if (!list.length) return ''; return '<p class="p11-world-h">' + ic(n.ic) + esc(n.k) + ' · ' + t(n.t) + ' · ' + list.length + '</p><div class="p4-toc">' + list.map(function (s) { return '<a href="#' + s.id + '">' + esc(s.id) + '</a>'; }).join('') + '</div>'; }).join('<div style="height:var(--jf-space-4)"></div>') });
  D.NP.forEach(function (n) {
    var list = ALL.filter(function (s) { return s.np === n.k; }); if (!list.length) return;
    h += P3.section({ id: n.id, icon: n.ic, title: L(n.k + ' · ' + n.t[0], n.k + ' · ' + n.t[1]), desc: L(n.e + ' · ' + list.length + ' layar', n.e + ' · ' + list.length + ' screens'), body: '<div class="p4-specs">' + list.map(spec).join('') + '</div>' });
  });
  if (!ALL.length) h += P3.section({ id: 'none', icon: 'alert', title: L('Engine belum dimuat', 'Engines not loaded'), desc: L('Data belum berhasil dimuat. Coba lagi.', 'The data could not be loaded. Try again.'), body: '' });
  P3.mount('#page', h);
  if (location.hash) { var el = document.getElementById(location.hash.slice(1)); if (el) setTimeout(function () { el.scrollIntoView(); }, 50); }
})();
