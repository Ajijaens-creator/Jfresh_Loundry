/* ==========================================================================
   JFRESH OS — Phase 12 automated test cases (NP-09 Smart Help & Guided Learning, JFHELP).
   Each case resets the access store and the HELP store, fixes the clock at
   2026-10-06 10:30 and runs against the real engine (jfos-help.js) installed on
   top of the Phase 4–11 engines, the same way the app loads them.
   Run in node:    node tools/test-help.js
   ========================================================================== */
(function (root) {
  var T = [], NOW = 0;
  function add(group, id, name, fn) { T.push({ group: group, id: id, n: name, fn: fn }); }
  function eq(a, b, what) { if (a !== b) throw new Error((what || 'value') + ': expected ' + JSON.stringify(b) + ', got ' + JSON.stringify(a)); }
  function ok(v, what) { if (!v) throw new Error(what || 'expected true'); }
  function no(r, code, what) { ok(r && r.ok === false, (what || 'action') + ' should be refused'); if (code) eq(r.code, code, (what || 'action') + ' code'); }
  function yes(r, what) { if (!r || r.ok !== true) throw new Error((what || 'action') + ' should pass: ' + (r ? (r.code + ' ' + JSON.stringify(r.msg)) : 'no result')); return r; }
  function as(X, uid) { var c = X.resolve(uid); if (!c || !c.ok) throw new Error('resolve ' + uid + ' failed: ' + (c && c.code)); return c; }
  function byU(X, u) { var x = X.USERS.filter(function (z) { return z.u === u; })[0]; if (!x) throw new Error('no user ' + u); return as(X, x.id); }
  function txt(pair) { return (pair[0] + ' ' + pair[1]).toLowerCase(); }
  var AJI = 'USR-050', BUDI = 'USR-030', SARAS = 'USR-021', PUTU = 'USR-101', LUH = 'USR-103', MADE = 'USR-001', KETUT = 'USR-002', SARI = 'USR-090', RAMA = 'USR-120', ADIT = 'USR-121', MILA = 'USR-702', PUTUJ = 'USR-703';
  function trainer(H, X) {
    var u = X.USERS.filter(function (z) { return z.u === 'ratih'; })[0];
    if (u) { var c = X.resolve(u.id); if (c && c.ok) return c; }
    var b = as(X, AJI); return Object.assign({}, b, { uid: 'USR-TRN', user: { id: 'USR-TRN', u: 'ratih' }, employee: null, roleKey: 'trainer', exp: 'trainer', name: 'Ratih', fullName: 'Ratih Kusuma', perms: H.ROLE_PERMS.trainer.slice(), acc: { deny: [] } });
  }
  function demoCtxs(X) { return X.DEMO.map(function (d) { var u = X.USERS.filter(function (z) { return z.u === d.u; })[0]; var c = u && X.resolve(u.id); return c && c.ok ? c : null; }).filter(Boolean); }

  /* ---- Install, roles & screens ---- */
  add('INSTALL', 'HLP-T01', ['Izin Smart Help terdaftar; help.view untuk semua peran demo', 'Smart Help permissions registered; help.view for every demo role'], function (H, C, X) {
    Object.keys(H.PERMS).forEach(function (p) { ok(C.PERMS[p], 'C.PERMS ' + p); });
    var cs = demoCtxs(X); ok(cs.length >= 20, 'demo users resolved: ' + cs.length);
    cs.forEach(function (c) { ok(c.perms.indexOf('help.view') >= 0, c.user.u + ' has help.view'); });
    ok(as(X, AJI).perms.indexOf('help.manage') >= 0, 'owner help.manage'); ok(as(X, AJI).perms.indexOf('help.edit') < 0, 'owner has no help.edit (trainer only)');
    ok(as(X, SARAS).perms.indexOf('help.team') >= 0, 'supervisor help.team'); ok(as(X, BUDI).perms.indexOf('help.manage') < 0, 'finance no help.manage');
  });
  add('INSTALL', 'HLP-T02', ['HELP-001 tetap terbuka untuk SEMUA peran demo termasuk klien', 'HELP-001 still allowed for EVERY demo role incl. clients'], function (H, C, X) {
    var s = C.screen('HELP-001'); ok(s && s.p4 === true && s.dom === 'help12', 'HELP-001 is the Smart Help spec, still p4'); ok(X.SCREENS.filter(function (x) { return x.id === 'HELP-001'; })[0] === s, 'same object as the Phase 4 spec');
    var cs = demoCtxs(X), clients = cs.filter(function (c) { return c.client; }); ok(clients.length >= 3, 'client demo users: ' + clients.length);
    cs.forEach(function (c) {
      ['HELP-001', 'HELP-002', 'HELP-003', 'HELP-004', 'HELP-005', 'HELP-007'].forEach(function (id) { ok(X.canScreen(c, id), c.user.u + ' → ' + id); eq(X.authorize(c, id, null).ok, true, c.user.u + ' authorize ' + id); });
    });
    ok(X.canScreen(as(X, AJI), 'HELP-006'), 'owner opens the Tutorial Manager'); ok(X.canScreen(as(X, RAMA), 'HELP-006'), 'superadmin opens HELP-006');
    ok(!X.canScreen(as(X, BUDI), 'HELP-006'), 'finance cannot'); ok(!X.canScreen(as(X, SARI), 'HELP-006'), 'client cannot');
  });
  add('INSTALL', 'HLP-T03', ['Peran baru (trainer) & reset izin diterapkan ulang secara lazy', 'Roles added later (trainer) & a permission reset are re-applied lazily'], function (H, C, X) {
    var made = false;
    if (!X.ROLES.trainer) {
      made = true;
      C.ROLES.trainer = Object.assign({}, C.ROLES.hr, { perms: ['perf.self'], nav: [{ k: 'home', l: ['Beranda', 'Home'], i: 'home', s: 'PERF-001' }], mnav: [] }); C.ROLE_ORDER.splice(C.ROLE_ORDER.indexOf('owner'), 0, 'trainer');
      X.ROLES.trainer = { exp: 'trainer', n: ['Training Lead', 'Training Lead'], landing: 'HELP-006', land: 'LAND-003', group: 'management', perms: ['perf.self'] };
      X.EMPLOYEES.push({ id: 'EMP-T99', n: 'Ratih Uji', short: 'Ratih', dept: ['Training', 'Training'], status: 'active' }); X.USERS.push({ id: 'USR-T99', u: 'ratih.test', email: 'r@t', emp: 'EMP-T99', status: 'active', roles: [{ k: 'trainer', def: true }], plants: ['*'], lang: 'id' });
    }
    try {
      var u = X.USERS.filter(function (z) { return X.account(z.id).roles.some(function (r) { return r.k === 'trainer'; }); })[0], c = as(X, u.id);
      ok(c.perms.indexOf('help.edit') >= 0 && c.perms.indexOf('help.manage') >= 0, 'trainer got help.edit/help.manage on resolve');
      ok(X.canScreen(c, 'HELP-006'), 'trainer opens HELP-006'); eq(c.landing, X.ROLES.trainer.landing === 'HELP-006' ? 'HELP-006' : c.landing, 'landing');
      ok(JSON.stringify(C.ROLES.trainer.nav).indexOf('HELP-006') >= 0, 'trainer nav reaches HELP-006');
      // A JFSYS-style demo reset wipes the role arrays in place → re-applied on the next resolve; an admin removal of one perm is respected.
      var arr = C.ROLES.owner.perms; ['help.view', 'help.team', 'help.analytics', 'help.manage', 'help.assess'].forEach(function (p) { var i = arr.indexOf(p); if (i >= 0) arr.splice(i, 1); });
      ok(as(X, AJI).perms.indexOf('help.manage') >= 0, 'owner perms re-applied after reset');
      arr.splice(arr.indexOf('help.assess'), 1); ok(as(X, AJI).perms.indexOf('help.assess') < 0, 'single admin removal respected');
      eq(typeof H.ROLE_PERMS.trainer.length, 'number', 'ROLE_PERMS exposed');
    } finally {
      if (made) { delete C.ROLES.trainer; C.ROLE_ORDER.splice(C.ROLE_ORDER.indexOf('trainer'), 1); delete X.ROLES.trainer; X.USERS.pop(); X.EMPLOYEES.pop(); }
      if (C.ROLES.owner.perms.indexOf('help.assess') < 0) C.ROLES.owner.perms.push('help.assess');
    }
  });
  add('CONTENT', 'HLP-T04', ['50–70 konten terbit, dwibahasa, video 30–90 dtk, layar ASLI', '50–70 published items, bilingual, 30–90 s video, REAL screens'], function (H, C, X, E) {
    var all = H.state().content, pub = all.filter(function (a) { return a.status === 'published'; });
    ok(pub.length >= 50 && pub.length <= 70, 'published: ' + pub.length);
    ok(all.some(function (a) { return a.status === 'draft'; }) && all.some(function (a) { return a.status === 'archived'; }), 'a draft and an archived item exist');
    all.forEach(function (a) {
      ok(a.title[0] && a.title[1] && a.description[0] && a.description[1], a.id + ' bilingual'); ok(a.steps.length && a.steps.every(function (s) { return s[0] && s[1]; }), a.id + ' steps');
      ok(!a.video || (a.video.len >= 30 && a.video.len <= 90), a.id + ' video length'); ok(C.screen(a.screen), a.id + ' screen in C.screen: ' + a.screen);
      if (a.screen.indexOf('HELP-') !== 0) ok(E.vids.indexOf(a.screen) >= 0, a.id + ' screen has a V renderer: ' + a.screen);
      if (a.perm) ok(C.PERMS[a.perm], a.id + ' perm known: ' + a.perm);
      ok(a.keywords.length >= 3, a.id + ' keywords');
    });
    var mods = {}; pub.forEach(function (a) { mods[a.module] = 1; }); ['production', 'logistics', 'delivery', 'finance', 'purchasing', 'commercial', 'client', 'system'].forEach(function (m) { ok(mods[m], 'module covered: ' + m); });
    ['receiving', 'weighing', 'sorting', 'batch', 'handover', 'washing', 'drying', 'finishing', 'qc', 'packing', 'release', 'pickup', 'pod', 'invoice', 'payment', 'cash', 'pr', 'complaint', 'users'].forEach(function (f) { ok(pub.some(function (a) { return a.feature === f; }), 'feature covered: ' + f); });
  });

  /* ---- Search ---- */
  add('SEARCH', 'HLP-T05', ['"cara buat invoice" → tiga artikel invoice', '"cara buat invoice" → the three invoice articles'], function (H, C, X) {
    [BUDI, AJI, PUTU].forEach(function (uid) {
      var r = H.search(as(X, uid), 'cara buat invoice'), top = r.results.slice(0, 3).map(function (x) { return x.title[0]; });
      eq(JSON.stringify(top), JSON.stringify(['Cara Membuat Invoice', 'Kenapa Invoice Belum Bisa Dibuat?', 'Cara Koreksi Invoice']), uid + ' top 3');
    });
    eq(H.search(as(X, BUDI), 'how to create invoice').results[0].id, 'HLP-070', 'English query');
    eq(H.search(as(X, BUDI), 'gimana bikin invoice').results[0].id, 'HLP-070', 'slang + synonym');
  });
  add('SEARCH', 'HLP-T06', ['Normalisasi Indonesia: stemming me-/di-/pe-/-kan/-an & sinonim', 'Indonesian normalisation: me-/di-/pe-/-kan/-an stemming & synonyms'], function (H) {
    eq(JSON.stringify(H.normalize('Bagaimana cara bikin invoice?')), JSON.stringify(['buat', 'invoice']), 'normalize');
    [['membuat', 'buat'], ['dibuat', 'buat'], ['pembuatan', 'buat'], ['menerbitkan', 'terbit'], ['penerimaan', 'terima'], ['pembayaran', 'bayar'], ['disetujui', 'setuju'], ['persetujuan', 'setuju'], ['pengiriman', 'kirim'],
      ['menimbang', 'timbang'], ['timbangan', 'timbang'], ['pengeringan', 'kering'], ['tagihan', 'invoice'], ['laporan', 'lapor'], ['bikin', 'buat'], ['packing', 'packing'], ['kemas', 'packing']].forEach(function (p) { eq(H.stem(p[0]), p[1], 'stem ' + p[0]); });
    eq(H.search(as0(), 'cara bikin batch').results[0].id, 'HLP-015', 'cara bikin batch');
    eq(H.search(as0(), 'penimbangan berat').results[0].id, 'HLP-013', 'penimbangan');
    function as0() { return { ok: true, uid: 'USR-101', roleKey: 'prod1', perms: ['help.view', 'prod.t1'], user: { u: 'putu' } }; }
  });
  add('SEARCH', 'HLP-T07', ['Setiap pencarian dicatat; tanpa hasil = unanswered', 'Every search is logged; zero results = unanswered'], function (H, C, X) {
    var c = as(X, PUTU), r = H.search(c, 'slip gaji bulan ini');
    eq(r.total, 0, 'no result'); ok(r.unanswered, 'unanswered flag'); ok(r.suggest.length > 0, 'suggestions offered'); ok(r.contact && r.contact.msg, 'contact supervisor');
    H.search(c, 'cara buat batch');
    var log = H.state().searches; eq(log.length, 2, 'logged'); eq(log[0].u, 'putu'); eq(log[0].role, 'prod1'); eq(log[0].n, 0); ok(log[1].n > 0, 'results count');
    var a = H.analytics(as(X, AJI)); ok(a.unanswered.some(function (u) { return /slip gaji/.test(u.term); }), 'unanswered in analytics');
    eq(H.search(as(X, SARI), 'xyzzy').contact.s, 'CLP-010', 'client contact route');
  });

  /* ---- Role-aware help ---- */
  add('ROLE', 'HLP-T08', ['Role-aware: TIDAK PERNAH ada langkah untuk izin yang tidak dimiliki', 'Role-aware: NEVER steps for a missing permission'], function (H, C, X) {
    var n = 0;
    demoCtxs(X).forEach(function (c) {
      H.articles(c, {}).forEach(function (a) {
        var lacks = a.perm && c.perms.indexOf(a.perm) < 0;
        if (lacks) { n++; eq(a.steps, null, c.user.u + ' ' + a.id + ' steps'); eq(a.video, null, c.user.u + ' ' + a.id + ' video'); eq(a.faq.length, 0, 'faq'); eq(a.walk, null, 'walk'); ok(a.need && a.need.perm === a.perm, 'need perm'); eq(a.canDo, false); }
        else if (!a.perm || c.perms.indexOf(a.perm) >= 0) ok(a.steps === null ? !a.canDo : a.steps.length > 0, 'steps for allowed');
      });
      H.search(c, 'cara buat invoice', { log: false }).results.forEach(function (r) { if (r.need) eq(r.canDo, false); });
      H.walkthroughs(c).forEach(function (w) { if (c.perms.indexOf(w.perm) < 0) { eq(w.steps, null, c.user.u + ' walk ' + w.id); ok(w.need, 'walk need'); } });
    });
    ok(n > 200, 'role-aware refusals checked: ' + n);
    var v = H.article(as(X, PUTU), 'HLP-070'); eq(v.steps, null); eq(v.need.perm, 'ar.build'); ok(v.need.roles.some(function (r) { return r.k === 'finance'; }), 'finance named as who can'); ok(/ar\.build/.test(v.need.msg[0]), 'message names the permission');
    ok(H.article(as(X, BUDI), 'HLP-070').steps.length === 4, 'finance sees the steps');
  });
  add('ROLE', 'HLP-T09', ['Klien dengan izin terbatas: tanpa langkah untuk aksi yang tidak diizinkan', 'Restricted client contact: no steps for actions not allowed'], function (H, C, X) {
    var pj = as(X, PUTUJ), mila = as(X, MILA);
    eq(H.article(pj, 'HLP-100').steps, null, 'putu.jaens (no pickup) gets no pickup steps'); ok(H.article(pj, 'HLP-102').steps, 'putu.jaens sees invoice steps');
    eq(H.article(mila, 'HLP-102').steps, null, 'mila (no invoice) gets no invoice steps'); ok(H.article(mila, 'HLP-100').steps, 'mila sees pickup steps');
    ok(H.forMe(pj).every(function (a) { return a.canDo; }), 'help for me only lists what I can do');
  });

  /* ---- Contextual help ---- */
  add('CONTEXT', 'HLP-T10', ['Bantuan kontekstual Receiving: apa, cara, bagaimana jika, video, masalah umum', 'Contextual help on Receiving: what, how, what if, video, common issues'], function (H, C, X) {
    var h = H.helpFor(as(X, PUTU), 'PROD-RCV-002');
    eq(h.screen.id, 'PROD-RCV-002'); eq(h.screen.module, 'production'); eq(h.role.k, 'prod1'); eq(h.fallback, false);
    eq(h.whatIs.id, 'HLP-010', 'What is Receiving?'); ok(h.howTo.some(function (a) { return a.id === 'HLP-011' && a.steps.length; }), 'How to receive');
    ok(h.whatIf.some(function (a) { return a.id === 'HLP-012'; }), 'What if quantity differs'); ok(h.video && h.video.len >= 30 && h.video.len <= 90, 'video'); ok(h.issues.length >= 2, 'common issues');
    ok(h.buttons.some(function (b) { return b.key === 'rcv.start' && b.allowed; }), 'button help on the screen'); ok(h.walkthroughs.some(function (w) { return w.id === 'WLK-02' && w.canDo; }), 'PANDU SAYA offered');
    ok(h.howTo.every(function (a) { return a.forYou || a.screen === 'PROD-RCV-002'; }), 'no other-role clutter');
  });
  add('CONTEXT', 'HLP-T11', ['Tanpa konten: fallback ke tujuan layar (C.screen.pur)', 'No content: falls back to the screen purpose (C.screen.pur)'], function (H, C, X) {
    var h = H.helpFor(as(X, BUDI), 'CFO-005'); ok(h && h.fallback, 'fallback'); eq(JSON.stringify(h.whatIs.description), JSON.stringify(C.screen('CFO-005').pur), 'purpose');
    eq(H.helpFor(as(X, BUDI), 'NOPE-404'), null, 'unknown screen');
    eq(H.helpFor(null, 'PROD-RCV-002'), null, 'no session');
  });
  add('CONTEXT', 'HLP-T12', ['Status batch dibaca live: tombol Packing diblokir karena QC', 'Batch status read live: the Packing button is blocked by QC'], function (H, C, X, E) {
    eq(E.PR.batch('B-2610-003').stage, 'qc_q', 'seed batch waits for QC');
    var h = H.helpFor(as(X, LUH), 'PROD-PACK-002', { rec: 'B-2610-003' });
    eq(h.status, 'qc_q'); eq(h.rec.id, 'B-2610-003');
    var b = h.blocked.filter(function (x) { return x.key === 'pack'; })[0]; ok(b && b.rules.indexOf('pack.qc') >= 0, 'pack blocked by QC'); ok(/qc/i.test(h.issues[0].a[0]), 'issue explains QC first');
  });

  /* ---- Tanya JFRESH ---- */
  add('ASK', 'HLP-T13', ['Tanya JFRESH: "Kenapa tombol Packing belum aktif?" pada batch yang belum lulus QC', 'Ask JFRESH: "Why is the Packing button not active?" on a batch whose QC has not passed'], function (H, C, X) {
    var r = H.ask(as(X, LUH), 'Kenapa tombol Packing belum aktif?', { screen: 'PROD-PACK-002', rec: 'B-2610-003' });
    eq(r.intent, 'why'); eq(r.button.key, 'pack'); ok(r.rules.indexOf('pack.qc') >= 0, 'QC rule'); eq(r.context.status, 'qc_q'); eq(r.context.rec, 'B-2610-003'); eq(r.context.role, 'prod3');
    ok(/QC/.test(r.answer[0]) && /lulus QC/.test(r.answer[0]) && /B-2610-003/.test(r.answer[0]), 'answer explains QC must pass: ' + r.answer[0]);
    ok(/QC/.test(r.answer[1]) && /pass/i.test(r.answer[1]), 'English answer');
    ok(r.who.some(function (w) { return w.k === 'prod3'; }) && r.who.some(function (w) { return w.k === 'supervisor'; }), 'who can do QC: Team 3 & supervisor');
    ok(/Team 3/.test(r.answer[0]), 'names who can do it'); ok(r.links.some(function (l) { return l.s === 'PROD-QC-002' && l.rec === 'B-2610-003'; }), 'link to QC decision');
    eq(r.need, null, 'Team 3 has the permission'); eq(r.fallback, false);
    ok(H.state().asks.length === 1 && H.state().asks[0].answered, 'ask logged');
  });
  add('ASK', 'HLP-T14', ['Tanpa izin: jawaban menyebut izin yang dibutuhkan, bukan langkah', 'Without permission: the answer names the permission, never the steps'], function (H, C, X) {
    var r = H.ask(as(X, MADE), 'kenapa packing tidak bisa?', { screen: 'PROD-PACK-002', rec: 'B-2610-003' });
    ok(r.rules.indexOf('pack.qc') >= 0 && r.rules.indexOf('perm') >= 0, 'QC + permission rules'); eq(r.need.perm, 'prod.t3'); eq(r.steps, null, 'no steps'); ok(/prod\.t3/.test(r.answer[0]), 'permission in the answer');
    var p = H.ask(as(X, PUTU), 'Bolehkah saya membuat invoice?'); eq(p.intent, 'perm'); eq(p.need.perm, 'ar.build'); eq(p.steps, null); ok(p.who.some(function (w) { return w.k === 'finance'; }), 'finance can');
    var q = H.ask(as(X, BUDI), 'Bolehkah saya membuat invoice?'); eq(q.intent, 'perm'); eq(q.need, null); ok(q.steps && q.steps.length, 'finance gets the steps');
    var w = H.ask(as(X, PUTUJ), 'cara minta pickup'); eq(w.steps, null, 'client contact without pickup perm'); eq(w.need.perm, 'clp.pickup.create');
    ok(H.ask(as(X, SARI), 'cara minta pickup').steps.length >= 4, 'client with pickup perm gets the steps');
  });
  add('ASK', 'HLP-T15', ['Tanya JFRESH memakai aturan bisnis live: packing siap, invoice, release', 'Ask JFRESH uses live business rules: packing ready, invoice, release'], function (H, C, X) {
    var a = H.ask(as(X, LUH), 'kenapa packing belum aktif', { rec: 'B-2610-002' }); ok(a.rules.indexOf('pack.ready') >= 0, 'B-2610-002 passed QC: button active');
    var b = H.ask(as(X, BUDI), 'Kenapa invoice belum bisa dibuat?', { rec: 'CL-09' }); ok(b.rules.indexOf('inv.nobr') >= 0, 'no billing ready for CL-09'); ok(/Billing Ready/.test(b.answer[0]));
    var c = H.ask(as(X, BUDI), 'Kenapa invoice belum bisa dibuat?', { rec: 'CL-01' }); ok(c.rules.indexOf('inv.ready') >= 0, 'CL-01 has unbilled Billing Ready'); ok(c.links.some(function (l) { return l.s === 'AR-001'; }));
    var d = H.ask(as(X, SARAS), 'kenapa release ditolak?', { rec: 'REL-2610-003' }); ok(d.rules.indexOf('release.checks') >= 0, 'failing checks listed: ' + d.rules); ok(/Cek yang belum lolos/.test(d.answer[0]));
    var e = H.ask(as(X, SARAS), 'kenapa release ditolak?', { rec: 'REL-2610-004' }); ok(e.rules.indexOf('release.hold') >= 0, 'hold');
    var f = H.ask(as(X, BUDI), 'kenapa tidak bisa catat pembayaran?', { rec: 'INV-2609-012' }); ok(f.rules.indexOf('pay.state') >= 0, 'paid invoice: no payment');
  });
  add('ASK', 'HLP-T16', ['Tanya JFRESH: apa itu, cara, status, fallback jujur, cakupan klien', 'Ask JFRESH: what is, how to, status, honest fallback, client scope'], function (H, C, X) {
    var w = H.ask(as(X, KETUT), 'apa itu POD?'); eq(w.intent, 'whatis'); ok(/Proof of Delivery/.test(w.answer[0]));
    var h = H.ask(as(X, PUTU), 'bagaimana cara membuat batch?'); eq(h.intent, 'howto'); eq(h.article.id, 'HLP-015'); ok(h.steps.length === 4);
    var s = H.ask(as(X, SARAS), 'status data ini', { rec: 'B-2610-004' }); eq(s.intent, 'status'); ok(/B-2610-004/.test(s.answer[0]));
    var u = H.ask(as(X, PUTU), 'berapa harga saham hari ini'); eq(u.intent, 'unknown'); ok(u.fallback); ok(u.links.some(function (l) { return l.s === 'HELP-004'; }), 'link to search'); ok(/supervisor/.test(u.answer[0]), 'contact supervisor');
    var sc = H.ask(as(X, SARI), 'kenapa packing belum aktif', { rec: 'B-2610-002' }); eq(sc.intent, 'scope'); eq(sc.context.status, null, 'no status leaked to another client');
    eq(H.recordInfo(as(X, SARI), 'B-2610-002').scope, false); eq(H.ask(null, 'x'), null, 'no session');
  });

  /* ---- APA INI? & button help ---- */
  add('WHATIS', 'HLP-T17', ['APA INI?: istilah KPI, status & chip', 'WHAT IS THIS?: KPI names, statuses & chips'], function (H, C) {
    ['HPP', 'pod', 'SLA', 'Billing Ready', 'Rewash', 'batch', 'handover', 'qc', 'overdue', 'maker-checker', 'Hypercare'].forEach(function (k) { var w = H.whatIs(k); ok(w && w.def[0] && w.def[1], 'defined: ' + k); });
    eq(H.whatIs('bukti pengiriman').key, 'pod', 'alias'); eq(H.whatIs('zzz'), null);
    eq(H.whatIs('RELEASE KE LOGISTICS').kind, 'button'); eq(H.whatIs('AR-002').kind, 'screen');
    H.glossary().forEach(function (g) { ok(C.screen(g.screen), 'glossary screen ' + g.screen); });
  });
  add('BUTTON', 'HLP-T18', ['Bantuan tombol: tujuan, syarat, setelah klik — seed aksi penting', 'Button help: purpose, conditions, after — key actions seeded'], function (H, C, X) {
    ['RELEASE KE LOGISTICS', 'KIRIM', 'BUAT INVOICE', 'SETUJUI', 'START PRODUCTION', 'PACKING SELESAI', 'KONFIRMASI PENERIMAAN'].forEach(function (l) { var b = H.buttonHelp(l); ok(b && b.purpose[0] && b.conditions.length && b.after[0], 'button ' + l); });
    var r = H.buttonHelp('release', as(X, SARAS)); eq(r.screen, 'REL-002'); eq(r.perm, 'dlv.release'); eq(r.allowed, true);
    var p = H.buttonHelp('RELEASE KE LOGISTICS', as(X, PUTU)); eq(p.allowed, false); ok(p.need && p.need.perm === 'dlv.release');
    eq(H.buttonHelp('start.production', as(X, AJI)).allowed, true, 'owner'); eq(H.buttonHelp('start.production', as(X, RAMA)).allowed, false, 'superadmin never');
    H.buttons().forEach(function (b) { ok(C.screen(b.screen) || b.p12, 'button screen ' + b.key + ' ' + b.screen); });
  });

  /* ---- Tour & walkthroughs ---- */
  add('TOUR', 'HLP-T19', ['Product tour per peran: Next / Skip / Jangan Tampilkan Lagi', 'Product tour per role: Next / Skip / Don\'t Show Again'], function (H, C, X) {
    var c = as(X, PUTU), t = H.tour(c); ok(t.show, 'first time'); ['.sb-nav', '#hd', '.hd-bell', '#hd-me'].forEach(function (s) { ok(t.steps.some(function (x) { return x.sel === s; }), 'selector ' + s); });
    ok(/Team 1/.test(t.steps.filter(function (x) { return x.k === 'home'; })[0].b[0]), 'role-specific home step');
    ok(!t.steps.some(function (x) { return x.k === 'plant'; }), 'single-plant user has no plant step'); ok(H.tour(as(X, AJI)).steps.some(function (x) { return x.k === 'plant'; }), 'owner has the plant step');
    yes(H.tourAction(c, 'next', 0)); eq(H.tour(c).step, 1);
    yes(H.tourAction(c, 'skip')); eq(H.tour(c).show, false, 'skipped today'); NOW += 864e5; eq(H.tour(c).show, true, 'offered again another day');
    yes(H.tourAction(c, 'dontShow')); NOW += 864e5 * 3; eq(H.tour(c).show, false, 'never again'); eq(H.tour(c).state, 'dontShow');
    yes(H.tourAction(as(X, BUDI), 'done')); eq(H.tour(as(X, BUDI)).state, 'seen'); no(H.tourAction(c, 'fly'), 'invalid');
  });
  add('WALK', 'HLP-T20', ['PANDU SAYA: pickup klien di CLP-003 (property → layanan → qty → kirim)', 'GUIDE ME: client pickup on CLP-003 (property → service → qty → submit)'], function (H, C, X, E) {
    var c = as(X, SARI), w = H.walkthrough(c, 'WLK-01');
    eq(w.screen, 'CLP-003'); eq(w.steps.length, 5); eq(w.steps[0].sel, '#cp11-pk [name="prop"]'); eq(w.steps[1].sel, '#cp11-pk [name="svc"]'); eq(w.steps[2].sel, '#cp11-pk [name="bags"]'); eq(w.steps[3].sel, '#cp11-pk [data-act="pkNext"]'); eq(w.steps[4].sel, '#cp11-pk [data-act="pkSend"]');
    var s = yes(H.walkStart(c, 'WLK-01')); eq(s.step.n, 1); yes(H.walkStep(c, 'WLK-01', 2)); var d = yes(H.walkDone(c, 'WLK-01')); ok(d.paths.indexOf('TRN-CLT') >= 0, 'counts toward TRN-CLT');
    eq(H.walkthrough(c, 'WLK-01').progress.st, 'done'); no(H.walkStep(c, 'WLK-01', 1), 'jump', 'not started');
    var r = H.walkStart(as(X, PUTU), 'WLK-01'); no(r, 'noperm'); ok(r.need && r.need.perm === 'clp.pickup.create', 'permission explained');
    eq(H.walkthrough(as(X, PUTU), 'WLK-02').steps[0].sel, '[data-act="start"]', 'Team 1 receiving walkthrough');
    H.walkthroughs(as(X, AJI)).forEach(function (x) { ok(C.screen(x.screen) && E.vids.indexOf(x.screen) >= 0, 'walk screen ' + x.screen); });
  });

  /* ---- Training ---- */
  add('TRAIN', 'HLP-T21', ['Jalur training per peran & progres sendiri', 'Training path per role & own progress'], function (H, C, X) {
    var t = H.training(as(X, PUTU)); eq(t.u, 'putu'); eq(t.role, 'prod1'); ok(t.key, 'putu is a key user'); ok(t.trained, 'putu passed'); eq(t.pct, 100);
    var p = t.paths.filter(function (x) { return x.id === 'TRN-T1'; })[0]; ok(p, 'Team 1 path'); eq(JSON.stringify(p.items.map(function (i) { return i.hlp; }).slice(0, 5)), JSON.stringify(['HLP-011', 'HLP-013', 'HLP-014', 'HLP-015', 'HLP-016']), 'Receiving, Weighing, Sorting, Batch, Handover');
    eq(JSON.stringify(H.PROGRESS), JSON.stringify(['assigned', 'started', 'completed', 'practiced', 'passed']));
    var k = H.training(as(X, KETUT)); eq(k.trained, false); ok(k.pct > 0 && k.pct < 100, 'ketut in progress: ' + k.pct); eq(k.st, 'started');
    ok(H.pathsFor('client').indexOf('TRN-ALL') < 0 && H.pathsFor('client').indexOf('TRN-CLT') >= 0, 'client path');
    eq(H.training(as(X, PUTU), 'USR-021'), null, 'no team perm → cannot see others');
  });
  add('TRAIN', 'HLP-T22', ['Tampilan tim: supervisor = tim operasional; owner = semua', 'Team view: supervisor = operations team; owner = everyone'], function (H, C, X) {
    var s = H.trainingTeam(as(X, SARAS)); ok(s.length >= 6, 'supervisor rows'); ok(s.every(function (r) { return H.OPS_ROLES.indexOf(r.role) >= 0; }), 'only operations roles'); ok(!s.some(function (r) { return r.u === 'budi'; }), 'no finance');
    var o = H.trainingTeam(as(X, AJI)); ok(o.some(function (r) { return r.u === 'budi'; }) && o.length > s.length, 'owner sees all'); ok(!o.some(function (r) { return r.client; }), 'clients excluded by default');
    eq(H.trainingTeam(as(X, PUTU)).length, 0, 'frontline has no team view');
    var sum = H.trainingSummary(as(X, AJI)); ok(sum.overall > 0 && sum.overall < 100, 'overall ' + sum.overall); ok(sum.byRole.length >= 8, 'per role');
    ok(H.training(as(X, SARAS), 'USR-101'), 'supervisor sees putu'); eq(H.training(as(X, SARAS), 'USR-030'), null, 'supervisor cannot see finance');
  });
  add('TRAIN', 'HLP-T23', ['Progres: tandai materi → selesai → praktik → lulus (penilai ≠ peserta)', 'Progress: mark items → completed → practiced → passed (assessor ≠ trainee)'], function (H, C, X) {
    var k = as(X, KETUT), sp = as(X, SARAS);
    no(H.assess(sp, 'ketut', 'TRN-DRV', 'passed', { score: 90 }), 'jump', 'not completed yet');
    ['HLP-050', 'HLP-051', 'HLP-053', 'HLP-052', 'HLP-054'].forEach(function (h) { yes(H.markItem(k, 'TRN-DRV', h)); });
    eq(H.training(k).paths.filter(function (p) { return p.id === 'TRN-DRV'; })[0].st, 'completed');
    no(H.markItem(k, 'TRN-FIN', 'HLP-070'), 'scope', 'not my path');
    yes(H.assess(sp, 'ketut', 'TRN-DRV', 'practiced'));
    no(H.assess(sp, 'ketut', 'TRN-DRV', 'passed', { score: 60 }), 'invalid', 'below pass mark');
    var r = yes(H.assess(sp, 'USR-002', 'TRN-DRV', 'passed', { score: 88, note: 'Praktik POD lancar' })); eq(r.path.st, 'passed'); eq(r.path.score, 88);
    ok(H.auditLog({ ev: 'HELP.TRAINING_PASSED' }).some(function (e) { return e.rec === 'ketut/TRN-DRV' && e.uid === SARAS; }), 'audited');
    no(H.assess(sp, 'saras', 'TRN-SPV', 'passed', { score: 99 }), 'maker', 'self assessment');
    no(H.assess(as(X, PUTU), 'ketut', 'TRN-DRV', 'passed', { score: 90 }), 'noperm');
    no(H.assess(sp, 'budi', 'TRN-FIN', 'passed', { score: 90 }), 'scope', 'supervisor outside operations');
  });
  add('TRAIN', 'HLP-T24', ['Readiness untuk JFGO: % training & key user belum terlatih (§95)', 'Readiness for JFGO: training % & untrained key users (§95)'], function (H, C, X) {
    var r = H.readiness(); ok(r.training > 0 && r.training < 100, 'training ' + r.training);
    var un = r.keyUsersUntrained.map(function (u) { return u.u; }); ok(un.indexOf('luh') >= 0 && un.indexOf('ketut') >= 0, 'luh & ketut untrained: ' + un); ok(un.indexOf('putu') < 0, 'putu trained');
    eq(r.gate.ok, false); ok(r.keyUsersTotal >= 10, 'key users ' + r.keyUsersTotal); ok(r.content.published >= 50);
    yes(H.assess(as(X, SARAS), 'luh', 'TRN-T3', 'passed', { score: 85 }));
    ok(H.readiness().keyUsersUntrained.every(function (u) { return u.u !== 'luh'; }), 'luh trained after passing');
    var a = yes(H.assign(as(X, SARAS), 'luh', 'TRN-MNT', 'Cadangan teknisi shift malam')); eq(a.path.st, 'assigned');
    no(H.assign(as(X, SARAS), 'luh', 'TRN-MNT', 'lagi'), 'dup'); no(H.assign(as(X, SARAS), 'arta', 'TRN-MNT', ''), 'reason'); no(H.assign(as(X, PUTU), 'arta', 'TRN-MNT', 'x'), 'noperm');
    ok(H.readiness().keyUsersUntrained.some(function (u) { return u.u === 'luh'; }), 'a newly assigned required path makes the key user untrained again');
  });

  /* ---- Content manager ---- */
  add('CMS', 'HLP-T25', ['Content manager: buat draft → terbit → ubah (versi) → arsip, trainer saja', 'Content manager: draft → publish → edit (version) → archive, trainer only'], function (H, C, X) {
    var tr = trainer(H, X), f = { module: 'production', screen: 'PROD-WGT-001', feature: 'weighing', perm: 'prod.t1', roles: ['prod1'], title: ['Cara Kalibrasi Timbangan Harian', 'How to Do the Daily Scale Check'],
      description: ['Cek timbangan dengan beban standar sebelum shift.', 'Check the scale with a standard weight before the shift.'], steps: [['Letakkan beban 10 kg.', 'Put the 10 kg weight.'], ['Bandingkan bacaan.', 'Compare the reading.']], video: { len: 45 }, keywords: 'kalibrasi timbangan cek' };
    var r = yes(H.createArticle(tr, f, 'Permintaan QA')); var id = r.article.id; eq(r.article.status, 'draft'); ok(/^HLP-2\d\d$/.test(id), id);
    ok(!H.search(as(X, PUTU), 'kalibrasi timbangan', { log: false }).results.some(function (x) { return x.id === id; }), 'draft not visible to users');
    no(H.publish(tr, id, ''), 'reason'); yes(H.publish(tr, id, 'Disetujui QA lead'));
    eq(H.search(as(X, PUTU), 'kalibrasi timbangan', { log: false }).results[0].id, id, 'published → searchable');
    var e = yes(H.editArticle(tr, id, { title: ['Cara Cek Kalibrasi Timbangan', 'How to Check Scale Calibration'] }, 'Judul lebih jelas')); ok(e.pending, 'pending draft');
    eq(H.article(as(X, PUTU), id).title[0], 'Cara Kalibrasi Timbangan Harian', 'live content unchanged until publish');
    yes(H.publish(tr, id, 'Terbitkan v2')); eq(H.article(as(X, PUTU), id).title[0], 'Cara Cek Kalibrasi Timbangan'); eq(H.article(as(X, PUTU), id).v, 2);
    ok(H.versions(tr, id).length >= 2, 'version history');
    no(H.archive(tr, id, ''), 'reason'); yes(H.archive(tr, id, 'Digabung ke HLP-013')); eq(H.article(as(X, PUTU), id), null, 'archived hidden from users'); ok(H.article(as(X, AJI), id), 'manager still sees it');
    ['HELP.CONTENT_CREATE', 'HELP.CONTENT_PUBLISH', 'HELP.CONTENT_EDIT', 'HELP.CONTENT_ARCHIVE'].forEach(function (ev) { ok(H.auditLog({ ev: ev, rec: id }).length, ev); });
    var bad = H.createArticle(tr, Object.assign({}, f, { video: { len: 120 }, screen: 'NOPE-001' }), 'x'); no(bad, 'invalid'); ok(bad.errors.video && bad.errors.screen, 'video 30–90 & real screen enforced');
  });
  add('CMS', 'HLP-T26', ['Hanya trainer yang mengubah konten; owner melihat Tutorial Manager', 'Only the trainer edits content; the owner views the Tutorial Manager'], function (H, C, X) {
    var f = { module: 'general', screen: 'HELP-001', title: ['X', 'X'], steps: [['a', 'a']] };
    no(H.createArticle(as(X, BUDI), f, 'x'), 'noperm'); no(H.createArticle(as(X, AJI), f, 'x'), 'noperm', 'owner cannot edit'); no(H.publish(as(X, RAMA), 'HLP-140', 'x'), 'noperm');
    ok(H.auditLog({ ev: 'ACCESS.DENIED' }).length >= 3, 'denials audited');
    eq(H.manager(as(X, BUDI)), null); var m = H.manager(as(X, AJI)); ok(m.rows.length > 60 && m.counts.draft >= 1 && m.counts.archived >= 1, 'manager rows'); eq(m.canEdit, false); ok(m.rows.every(function (r) { return r.screenOk; }), 'all screens valid');
    eq(H.articles(as(X, PUTU), {}).some(function (a) { return a.status !== 'published'; }), false, 'users never see drafts');
  });

  /* ---- Analytics ---- */
  add('ANALYTICS', 'HLP-T27', ['Analitik: paling dicari, dibuka, walkthrough, gagal, unanswered, feedback', 'Analytics: most searched, opened, walkthrough, failed, unanswered, feedback'], function (H, C, X) {
    var a = H.analytics(as(X, AJI)); eq(a.topSearches[0].term, 'cara buat batch'); eq(a.topSearches[0].count, 128); eq(a.topSearches[0].top.id, 'HLP-015');
    eq(a.topOpened[0].id, 'HLP-015'); eq(a.topWalkthroughs[0].id, 'WLK-02'); ok(a.failedTasks.length && a.failedTasks[0].screen, 'failed tasks');
    ok(a.unanswered.some(function (u) { return u.term === 'slip gaji'; }) && a.unanswered.every(function (u) { return u.results === 0; }), 'unanswered');
    ok(a.feedback.length >= 5 && a.feedback[0].pct <= a.feedback[a.feedback.length - 1].pct, 'feedback sorted worst first');
    eq(H.analytics(as(X, PUTU)), null, 'frontline has no analytics'); ok(H.analytics(trainer(H, X)), 'trainer analytics');
    H.search(as(X, PUTU), 'cara bikin batch'); eq(H.analytics(as(X, AJI)).topSearches[0].count, 129, 'live search joins the same normalised term');
  });
  add('ANALYTICS', 'HLP-T28', ['Insight §105: "cara buat batch" 128 pencarian → UI/training perlu perbaikan', 'Insight §105: "cara buat batch" 128 searches → UI/training may need improvement'], function (H, C, X) {
    var ins = H.insights(as(X, AJI)), u = ins.filter(function (i) { return i.kind === 'ui' && i.term === 'cara buat batch'; })[0];
    ok(u, 'UI insight'); eq(u.count, 128); eq(u.screen, 'PROD-BATCH-001'); ok(/128/.test(u.msg[0]) && /UI atau training/.test(u.msg[0]), u.msg[0]); ok(/may need improvement/.test(u.msg[1]));
    ok(ins.some(function (i) { return i.kind === 'content'; }), 'content insight'); ok(ins.some(function (i) { return i.kind === 'training'; }), 'training insight');
  });
  add('ANALYTICS', 'HLP-T29', ['Feedback membantu ya/tidak per konten (sekali per user)', 'Helpful yes/no feedback per item (once per user)'], function (H, C, X) {
    var c = as(X, PUTU), before = H.article(c, 'HLP-015').feedback;
    var r = yes(H.feedback(c, 'HLP-015', true, 'jelas')); eq(r.feedback.yes, before.yes + 1); eq(r.updated, false);
    var r2 = yes(H.feedback(c, 'HLP-015', false)); eq(r2.updated, true); eq(r2.feedback.yes, before.yes); eq(r2.feedback.no, before.no + 1);
    no(H.feedback(c, 'HLP-140', true), 'notfound', 'draft');
    var opens = H.state().opens.length; H.article(c, 'HLP-011'); eq(H.state().opens.length, opens + 1, 'open logged');
  });
  add('ANALYTICS', 'HLP-T30', ['KPI Smart Help & beranda bantuan untuk setiap peran demo', 'Smart Help KPIs & help home for every demo role'], function (H, C, X) {
    var k = H.kpis(as(X, AJI)); eq(k.length, 8); ok(k.filter(function (x) { return x.k === 'helpUsage'; })[0].v > 500, 'usage'); ok(k.filter(function (x) { return x.k === 'tutorialCompletion'; })[0].v > 0);
    demoCtxs(X).forEach(function (c) { var h = H.home(c); ok(h && h.forMe.length > 0, c.user.u + ' home'); ok(h.forMe.every(function (a) { return a.canDo; }), c.user.u + ' only doable'); ok(h.tour && h.tour.steps.length >= 5); });
  });

  /* ---- Audit & one data ---- */
  add('AUDIT', 'HLP-T31', ['Audit Smart Help tampil di JFSYS.auditAll (modul help)', 'Smart Help audit shows in JFSYS.auditAll (module help)'], function (H, C, X, E) {
    if (!E.SYS) return;
    var tr = trainer(H, X); yes(H.publish(tr, 'HLP-140', 'Siap untuk driver'));
    var rows = E.SYS.auditAll(as(X, RAMA), { module: 'help' }); ok(rows.length >= 1 && rows.every(function (r) { return r.module === 'help'; }), 'help rows');
    var p = rows.filter(function (r) { return r.action === 'HELP.CONTENT_PUBLISH'; })[0]; ok(p && p.rec === 'HLP-140' && p.reason === 'Siap untuk driver' && p.before && p.after, 'before/after/reason');
    ok(E.SYS.auditAll(as(X, RAMA), {}).some(function (r) { return r.module === 'help'; }), 'merged into the full trail'); ok(E.SYS.auditAll(as(X, RAMA), { module: 'finance' }).every(function (r) { return r.module === 'finance'; }), 'other module filter untouched');
    ok(E.SYS.AUDIT_MODULES.some(function (m) { return m[0] === 'help'; }), 'module listed'); eq(E.SYS.auditAll(as(X, PUTU), {}).length, 0, 'no audit view → nothing');
    eq(E.SYS.auditAll(as(X, RAMA), { limit: 1 }).length, 1, 'limit');
  });
  add('DATA', 'HLP-T32', ['ONE DATA: user, peran, batch & invoice dibaca dari engine pemilik', 'ONE DATA: users, roles, batches & invoices read from the owner engines'], function (H, C, X, E) {
    var s = H.state(); ['users', 'roles', 'batches', 'invoices', 'orders', 'clients'].forEach(function (k) { ok(s[k] === undefined, 'no copy of ' + k); });
    ok(Object.keys(s.progress).every(function (u) { return u.indexOf('USR-') !== 0; }), 'progress keyed by username');
    var iv = E.FN.state().inv[0]; eq(H.recordInfo(as(X, BUDI), iv.id).st, E.FN.invSt(iv), 'live invoice status');
    var who = H.whoCan('prod.t3').map(function (r) { return r.k; }); ok(who.indexOf('prod3') >= 0 && who.indexOf('supervisor') >= 0 && who.indexOf('finance') < 0, 'who can from live role perms');
  });
  add('DATA', 'HLP-T33', ['Spesifikasi layar HELP-001..007 & perangkat (mobile utama)', 'Screen specs HELP-001..007 & devices (mobile primary)'], function (H, C, X) {
    ['HELP-001', 'HELP-002', 'HELP-003', 'HELP-004', 'HELP-005', 'HELP-006', 'HELP-007'].forEach(function (id) { var s = C.screen(id); ok(s && s.p12 && s.dom === 'help12' && s.n[0] && s.pur[0], id); });
    eq(C.screen('HELP-006').p, 'help.manage'); ok(!C.screen('HELP-006').p4, 'HELP-006 not public'); eq(C.screen('HELP-001').devs.m, 'primary', 'mobile primary §113'); eq(C.screen('HELP-006').devs.m, 'no');
    ok(H.NAV.group.sub.length === 3 && H.NAV.home.s === 'HELP-001', 'nav items exposed');
  });
  add('DATA', 'HLP-T34', ['State persisten & reset demo', 'Persistent state & demo reset'], function (H, C, X) {
    H.search(as(X, PUTU), 'timbang'); ok(H.state().searches.length === 1); H._reset(); eq(H.state().searches.length, 0, 'reset');
    eq(H.state().content.length, H.D.CONTENT.length); eq(H.today(), '2026-10-06');
  });
  add('DATA', 'HLP-T35', ['Getter tanpa sesi/izin mengembalikan null/[]', 'Getters without a session/permission return null/[]'], function (H, C, X) {
    var nobody = { ok: true, uid: 'USR-X', roleKey: 'ghost', perms: [], acc: { deny: [] } };
    eq(H.search(nobody, 'invoice'), null); eq(H.articles(nobody).length, 0); eq(H.helpFor(nobody, 'AR-001'), null); eq(H.ask(nobody, 'x'), null); eq(H.training(nobody), null); eq(H.trainingTeam(nobody).length, 0);
    var denied = Object.assign({}, as(X, PUTU)); denied.perms = denied.perms.filter(function (p) { return p !== 'help.view'; }); denied.acc = { deny: ['help.view'] };
    eq(H.search(denied, 'invoice'), null, 'explicit deny respected');
  });

  function run(H, C, X, E) {
    var res = [];
    T.forEach(function (t) {
      NOW = Date.parse('2026-10-06T10:30:00Z'); H._setClock(function () { return NOW; });
      if (X && X._resetStore) X._resetStore(); H._reset();
      try { t.fn(H, C, X, E || {}); res.push({ group: t.group, id: t.id, n: t.n, ok: true }); }
      catch (e) { res.push({ group: t.group, id: t.id, n: t.n, ok: false, err: e.message }); }
    });
    H._setClock(null); if (X && X._resetStore) X._resetStore(); H._reset();
    return res;
  }
  var api = { cases: T, run: run };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.JFHELP_TESTS = api;
})(typeof window !== 'undefined' ? window : this);
