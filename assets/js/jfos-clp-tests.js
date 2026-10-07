/* ==========================================================================
   JFRESH OS — Phase 11 automated test cases (Client Portal & Digital Client
   Experience). Each case resets every store (access, Phase 4–10 engines and
   the client portal), fixes the clock at 2026-10-06 10:30 and runs against the
   real engine (jfos-clp.js) installed on top of the earlier engines, the same
   way the app loads them. Client contexts are built by the access engine
   itself (X.resolve), never by hand, so the tests cover the real login path.
   Run in node:    node tools/test-clp.js
   ========================================================================== */
(function (root) {
  var T = [], NOW = 0;
  function add(group, id, name, fn) { T.push({ group: group, id: id, n: name, fn: fn }); }
  function eq(a, b, what) { if (a !== b) throw new Error((what || 'value') + ': expected ' + JSON.stringify(b) + ', got ' + JSON.stringify(a)); }
  function ok(v, what) { if (!v) throw new Error(what || 'expected true'); }
  function no(r, code, what) { ok(r && r.ok === false, (what || 'action') + ' should be refused'); if (code) eq(r.code, code, (what || 'action') + ' code'); }
  function yes(r, what) { if (!r || r.ok !== true) throw new Error((what || 'action') + ' should pass: ' + (r ? (r.code + ' ' + JSON.stringify(r.msg)) : 'no result')); return r; }
  function ids(list) { return (list || []).map(function (x) { return x.id; }); }
  function staff(role, emp) { return function (E) { return { uid: 'T-' + (emp || role), name: 'Tester ' + role, roleKey: role, perms: E.C.ROLES[role].perms.slice(), employee: emp ? { id: emp } : null }; }; }
  function who(uid) { return function (E) { var c = E.X.resolve(uid, {}); if (!c || !c.ok) throw new Error(uid + ' context refused: ' + (c && c.code)); return c; }; }
  var arya = who('USR-701'), mila = who('USR-702'), putu = who('USR-703'), kadek = who('USR-704'), komang = who('USR-706'), sari = who('USR-090');
  var ops = staff('opsmgr', 'EMP-010'), fin = staff('finance', 'EMP-030'), sal = staff('sales', 'EMP-040'), drv = staff('driver', 'EMP-002');
  var PICK = { prop: 'PR-07A', svc: 'SV-007', bags: 4, kg: 40, pic: 'Arya Wijaya', phone: '+62 811 3800 100', date: '2026-10-07', win: ['09:00', '11:00'] };
  function pick(o) { var f = {}; Object.keys(PICK).forEach(function (k) { f[k] = PICK[k]; }); Object.keys(o || {}).forEach(function (k) { f[k] = o[k]; }); return f; }
  function denials(K, uid) { return K.auditLog({ ev: 'ACCESS.DENIED' }).filter(function (a) { return !uid || a.uid === uid; }).length; }

  /* ---- NP-01 portal foundation: access, landing, home ---- */
  add('NP-01', 'CLP-T01', ['15 layar CLP terdaftar (pN 11, device hint) dan HOM-CLT-001 menjadi alias CLP-001', '15 CLP screens registered (pN 11, device hint) and HOM-CLT-001 aliases CLP-001'], function (E) {
    for (var i = 1; i <= 15; i++) { var id = 'CLP-' + String(i).padStart(3, '0'), s = E.C.screen(id); ok(s && s.id === id, id + ' registered'); eq(s.pN, 11, id + ' pN'); ok(s.devs && s.dev, id + ' device hints'); ok(s.n && s.n.length === 2, id + ' bilingual name'); }
    eq(E.K.ALIAS['HOM-CLT-001'], 'CLP-001', 'landing alias'); eq(E.K.ALIAS['CLT-INV-001'], 'CLP-008');
    ok(E.C.ROLES.client.perms.indexOf('clp.portal') >= 0, 'client role carries the portal permission');
  });
  add('NP-01', 'CLP-T02', ['arya.jaens login: landing HOM-CLT-001, nav klien baru (desktop & mobile)', 'arya.jaens login: landing HOM-CLT-001, new client nav (desktop & mobile)'], function (E) {
    var r = yes(E.X.login('arya.jaens', 'jfresh123'), 'login'); eq(r.landing, 'HOM-CLT-001', 'landing');
    var c = arya(E); ok(c.clp && c.clp.cl === 'CL-07', 'ctx.clp'); var d = []; c.nav.forEach(function (n) { d.push(n.s); d = d.concat(n.also || []); });
    ['CLP-001', 'CLP-006', 'CLP-005', 'CLP-008'].forEach(function (s) { ok(d.indexOf(s) >= 0, s + ' in desktop nav'); });
    eq(c.mnav.length, 5, 'mobile nav items'); eq(c.mnav[0].s, 'HOM-CLT-001', 'home = landing'); ok(c.mnav[0].also.indexOf('CLP-001') >= 0, 'home also CLP-001'); ok(c.nav.some(function (n) { return n.s === c.landing; }), 'landing in nav (no extra shell entry)'); eq(c.mnav[4].k, 'menu', 'Akun / menu item');
    ok(E.X.canScreen(c, 'HOM-CLT-001') && E.X.canScreen(c, 'CLP-013'), 'GM opens landing and users');
  });
  add('NP-01', 'CLP-T03', ['Beranda: sapaan, kartu ringkasan, aksi cepat, aktivitas', 'Home: greeting, summary cards, quick actions, activity'], function (E) {
    var K = E.K, h = K.home(arya(E));
    eq(h.part, 'pagi', 'morning at 10:30'); eq(h.name, 'Jaens Spa Group'); eq(h.props.length, 4, 'four properties'); eq(h.sel, 'all');
    ok(h.cards.pickupToday.n >= 1, 'pickups today'); ok(h.cards.openIssues.n >= 1, 'open issues');
    var b = K.billing(arya(E)); eq(h.cards.outstandingInvoice.amt, b.summary.outstanding.amt, 'outstanding card = billing summary');
    ok(h.quick.length >= 4 && h.quick.every(function (q) { return q.l.length === 2 && q.s; }), 'quick actions');
    ok(Array.isArray(h.activity), 'activity list');
  });
  add('NP-01', 'CLP-T04', ['Sapaan mengikuti jam: pagi, siang, sore, malam', 'Greeting follows the hour: morning, midday, afternoon, evening'], function (E) {
    var K = E.K, at = function (hm) { return K.greeting(Date.parse('2026-10-06T' + hm + ':00Z')).k; };
    eq(at('08:00'), 'pagi'); eq(at('12:30'), 'siang'); eq(at('16:00'), 'sore'); eq(at('20:00'), 'malam');
  });
  add('NP-01', 'CLP-T05', ['Pemilih property: GM memilih satu property, FO ditolak di luar akses (diaudit)', 'Property selector: GM picks one property, FO refused outside access (audited)'], function (E) {
    var K = E.K, a = arya(E); yes(K.setProp(a, 'PR-07B'), 'select PR-07B'); eq(K.selProp(a), 'PR-07B');
    ok(K.active(a).every(function (r) { return r.prop === 'PR-07B'; }), 'active filtered to PR-07B');
    yes(K.setProp(a, 'all')); eq(K.selProp(a), 'all');
    var m = mila(E), d0 = denials(K, 'USR-702'); no(K.setProp(m, 'PR-07B'), 'scope', 'mila selects PR-07B'); eq(denials(K, 'USR-702'), d0 + 1, 'denial audited');
    eq(K.props(m).length, 1, 'mila sees one property');
  });
  add('NP-01', 'CLP-T06', ['User suspended, nonaktif, undangan, dan masa akses habis ditolak saat login', 'Suspended, inactive, invited and expired users refused at login'], function (E) {
    no(E.X.login('wayan.jaens', 'jfresh123'), 'suspended', 'wayan'); no(E.X.login('gede.jaens', 'jfresh123'), 'inactive', 'gede');
    no(E.X.login('sinta.jaens', 'jfresh123'), null, 'sinta (invited)');
    var K = E.K; K.state().users['USR-706'].end = '2026-10-01'; K.save();
    var r = E.X.resolve('USR-706', {}); no(r, null, 'expired access'); ok(K.accessCheck('USR-706').ok === false, 'accessCheck refuses');
  });
  add('NP-01', 'CLP-T07', ['Ditangguhkan saat sesi berjalan: konteks berikutnya ditolak', 'Suspended mid-session: the next context is refused'], function (E) {
    var K = E.K; yes(E.X.login('kadek.jaens', 'jfresh123'), 'kadek login'); var v = E.X.validate(); ok(v.ok, 'session valid');
    yes(K.suspend(arya(E), 'USR-704', 'Cuti panjang'), 'suspend');
    var v2 = E.X.validate(); no(v2, null, 'session after suspension'); no(E.X.resolve('USR-704', {}), null, 'resolve after suspension');
  });

  /* ---- NP-02 self-service pickup & requests ---- */
  add('NP-02', 'CLP-T08', ['Validasi form pickup per langkah: wajib isi, tanggal lampau, jam lewat', 'Pickup form validation per step: required fields, past date, passed time'], function (E) {
    var K = E.K, a = arya(E), v = K.validatePickup(a, 2, {});
    ['prop', 'svc', 'bags', 'pic', 'phone', 'date', 'win'].forEach(function (k) { ok(v.errors[k], k + ' error'); });
    eq(K.validatePickup(a, 1, pick()).ok, true, 'step 1 ok');
    ok(K.validatePickup(a, 2, pick({ date: '2026-10-05' })).errors.date, 'past date');
    ok(K.validatePickup(a, 2, pick({ date: '2026-10-06', win: ['08:00', '10:00'] })).errors.win, 'window already passed');
    ok(K.validatePickup(a, 2, pick({ win: ['11:00', '09:00'] })).errors.win, 'reversed window');
    var o = K.pickupOptions(a, 'PR-07A'); ok(o.svcs.length >= 1 && o.windows.length >= 3, 'services & windows'); eq(o.defaults.prop, 'PR-07A');
  });
  add('NP-02', 'CLP-T09', ['Buat pickup: order Phase 7 sumber klien + Request ID, audit, notifikasi', 'Create pickup: Phase 7 order from the client + Request ID, audit, notification'], function (E) {
    var K = E.K, r = yes(K.requestPickup(arya(E), pick()), 'pickup');
    ok(/^REQ-2610-\d{3}$/.test(r.request.id), 'request id'); var o = E.LG.order(r.order.id); ok(o, 'order exists in Phase 7'); eq(o.cl, 'CL-07'); eq(o.prop, 'PR-07A'); eq(o.req, r.request.id, 'order carries the request');
    eq(o.src, 'client', 'source client');
    ok(K.auditLog({ ev: 'REQUEST.CREATE' }).some(function (x) { return x.rec === r.request.id; }), 'audited');
    ok(K.requests(arya(E)).some(function (x) { return x.id === r.request.id; }), 'in request list');
    ok(K.job(arya(E), r.order.id), 'visible as a job');
  });
  add('NP-02', 'CLP-T10', ['Pickup ganda terdeteksi; lanjut hanya dengan konfirmasi + alasan', 'Duplicate pickup detected; continues only with confirmation + reason'], function (E) {
    var K = E.K; yes(K.requestPickup(arya(E), pick()));
    var d = K.requestPickup(arya(E), pick()); no(d, 'dup', 'second pickup'); ok(d.dup.length >= 1, 'dup list');
    var f = yes(K.requestPickup(arya(E), pick(), { force: true, reason: 'Linen tambahan dari event' }), 'forced'); eq(f.dupConfirmed, true);
  });
  add('NP-02', 'CLP-T11', ['Isolasi: putu (finance) tidak bisa membuat pickup', 'Isolation: putu (finance) cannot create a pickup'], function (E) {
    var K = E.K, p = putu(E), d0 = denials(K, 'USR-703');
    no(K.requestPickup(p, pick()), 'noperm', 'putu pickup'); eq(denials(K, 'USR-703'), d0 + 1, 'denial audited');
    eq(K.pickupOptions(p, 'PR-07A'), null, 'no pickup form'); ok(!E.X.canScreen(p, 'CLP-003'), 'no pickup screen');
    no(K.requestReschedule(p, 'ORD-2610-143', { date: '2026-10-08', win: ['09:00', '11:00'], reason: 'x' }), 'noperm', 'putu reschedule');
  });
  add('NP-02', 'CLP-T12', ['Isolasi: mila tidak bisa pickup / reschedule untuk PR-07B', 'Isolation: mila cannot pick up / reschedule for PR-07B'], function (E) {
    var K = E.K, m = mila(E);
    no(K.requestPickup(m, pick({ prop: 'PR-07B' })), 'scope', 'pickup PR-07B'); yes(K.requestPickup(m, pick()), 'pickup PR-07A');
    no(K.requestCancel(m, 'ORD-2610-111', { reason: 'x' }), 'scope', 'cancel a PR-07B order');
    var other = E.LG.state().schedules.filter(function (x) { return x.cl === 'CL-07' && x.prop !== 'PR-07A'; })[0]; ok(other, 'schedule of another property');
    no(K.requestScheduleChange(m, other.id, { act: 'skip', date: '2026-10-09', reason: 'x' }), 'scope', 'schedule of another property');
    ok(K.schedules(m).every(function (x) { return x.prop === 'PR-07A'; }), 'mila schedules PR-07A only');
  });
  add('NP-02', 'CLP-T13', ['Reschedule & batal pickup yang belum berjalan langsung diterapkan; pickup berjalan ditolak', 'Reschedule & cancel of a not-started pickup applied at once; running pickup refused'], function (E) {
    var K = E.K, a = arya(E), r = yes(K.requestPickup(a, pick()));
    no(K.requestReschedule(a, r.order.id, { date: '2026-10-08', win: ['13:00', '15:00'] }), 'reason', 'no reason');
    var x = yes(K.requestReschedule(a, r.order.id, { date: '2026-10-08', win: ['13:00', '15:00'], reason: 'Hari raya' }), 'reschedule'); eq(x.applied, true);
    var o = E.LG.order(r.order.id); eq(o.date, '2026-10-08'); eq(o.win[0], '13:00');
    var c = yes(K.requestCancel(a, r.order.id, { reason: 'Tidak jadi' }), 'cancel'); eq(c.applied, true); eq(E.LG.order(r.order.id).st, 'cancelled');
    no(K.requestCancel(a, 'ORD-2610-121', { reason: 'x' }), 'jump', 'pickup on the way');
  });
  add('NP-02', 'CLP-T14', ['Reschedule jadwal kontrak menunggu operasional; hanya lg.dispatch yang menyetujui', 'Reschedule of a contracted pickup waits for operations; only lg.dispatch approves'], function (E) {
    var K = E.K, a = arya(E);
    no(K.requestReschedule(a, 'ORD-2610-143', { date: '2026-10-07', win: ['10:00', '12:00'], reason: 'x' }), 'dup', 'pending request exists');
    var q = K.request(a, 'REQ-2610-002'); eq(q.stLive, 'submitted');
    no(K.approveRequest(a, 'REQ-2610-002'), 'noperm', 'client approves'); no(K.approveRequest(sal(E), 'REQ-2610-002'), 'noperm', 'sales approves');
    ok(ids(K.pendingRequests(ops(E))).indexOf('REQ-2610-002') >= 0, 'in the ops queue');
    yes(K.approveRequest(ops(E), 'REQ-2610-002', 'OK'), 'ops approves');
    var o = E.LG.order('ORD-2610-143'); eq(o.win[0], '17:30', 'order moved'); eq(K.request(a, 'REQ-2610-002').st, 'done');
    no(K.approveRequest(ops(E), 'REQ-2610-002'), 'jump', 'approve twice');
  });
  add('NP-02', 'CLP-T15', ['Perubahan jadwal rutin selalu menunggu; tolak butuh alasan', 'Recurring schedule change always waits; rejection needs a reason'], function (E) {
    var K = E.K, a = arya(E), sc = K.schedules(a); ok(sc.length >= 1, 'schedules listed');
    no(K.requestScheduleChange(a, 'SCH-01', { act: 'skip', date: '2026-10-09' }), 'reason');
    var r = yes(K.requestScheduleChange(a, 'SCH-01', { act: 'skip', date: '2026-10-09', reason: 'Properti tutup' })); eq(r.pending, true);
    no(K.rejectRequest(ops(E), r.request.id, ''), 'reason'); yes(K.rejectRequest(ops(E), r.request.id, 'Kontrak minimum'));
    eq(K.request(a, r.request.id).stLive, 'rejected');
  });

  /* ---- NP-03 tracking & documents ---- */
  add('NP-03', 'CLP-T16', ['Pesanan aktif: semua property CL-07 untuk GM, hanya PR-07A untuk mila', 'Active orders: all CL-07 properties for the GM, only PR-07A for mila'], function (E) {
    var K = E.K, a = K.active(arya(E)), m = K.active(mila(E));
    ok(a.length >= 5, 'GM active jobs'); ok(a.every(function (r) { return r.cl === 'CL-07'; }), 'all CL-07');
    ['PR-07A', 'PR-07B', 'PR-07C', 'PR-07D'].forEach(function (p) { ok(a.some(function (r) { return r.prop === p; }), p + ' present'); });
    ok(m.length >= 1 && m.every(function (r) { return r.prop === 'PR-07A'; }), 'mila only PR-07A');
    ok(a.every(function (r) { return r.label.length === 2 && r.steps.length === 5 && r.link && r.link.s; }), 'row shape');
  });
  add('NP-03', 'CLP-T17', ['Tracking: timeline, ETA, driver; tidak terlihat dari property lain', 'Tracking: timeline, ETA, driver; not visible from another property'], function (E) {
    var K = E.K, t = K.track(arya(E), 'ORD-2610-121'); ok(t && t.row, 'track view');
    eq(t.row.st, 'otw'); ok(t.eta && t.eta.at, 'ETA'); ok(t.driver, 'driver'); ok(t.row.steps.some(function (s) { return s.st === 'cur'; }), 'current step');
    var d0 = denials(K, 'USR-702'); eq(K.track(mila(E), 'ORD-2610-121'), null, 'mila tracks PR-07C'); ok(denials(K, 'USR-702') > d0, 'denial audited');
    var s = K.trackStats(arya(E)); ok(s.active >= 1 && s.ontime >= 0, 'stats');
  });
  add('NP-03', 'CLP-T18', ['Riwayat & pencarian mengikuti cakupan property', 'History & search follow the property scope'], function (E) {
    var K = E.K; ok(K.history(arya(E), { all: true }).length >= 1, 'history');
    ok(K.search(arya(E), '111').orders.length >= 1, 'GM finds ORD-2610-111');
    eq(K.search(mila(E), '111').orders.length, 0, 'mila does not find a PR-07B order');
  });
  add('NP-03', 'CLP-T19', ['Pusat dokumen: POD dibuka tercatat; dokumen klien lain ditolak', 'Document center: POD opening is logged; another client\'s document refused'], function (E) {
    var K = E.K, a = arya(E), d = K.docs(a); ok(d.length >= 5, 'documents'); ok(d.some(function (x) { return x.type === 'pod'; }) && d.some(function (x) { return x.type === 'inv'; }), 'POD & invoice');
    var v0 = K.views({ kind: 'pod', rec: 'POD-2610-010' }).length, r = yes(K.viewDoc(a, 'POD-2610-010'), 'view POD'); ok(r.rows.length >= 4 && r.html, 'printable');
    eq(K.views({ kind: 'pod', rec: 'POD-2610-010' }).length, v0 + 1, 'view logged');
    var dl = yes(K.downloadDoc(a, 'INV-2610-071'), 'download'); ok(dl.name && dl.mime && dl.body, 'file');
    no(K.viewDoc(mila(E), 'POD-2610-010'), 'scope', 'mila opens PR-07B POD');
    ok(K.docs(mila(E)).every(function (x) { return !x.prop || x.prop === 'PR-07A'; }), 'mila docs PR-07A only');
  });
  add('NP-03', 'CLP-T20', ['Bagikan dokumen: tautan berbatas waktu; viewonly / FO tidak membagikan invoice', 'Share a document: time-limited link; view-only / FO cannot share an invoice'], function (E) {
    var K = E.K, r = yes(K.shareDoc(arya(E), 'POD-2610-010', { to: 'ops@jaensspa.com' }), 'share'); ok(r.share.exp > r.share.at, 'expiry');
    no(K.shareDoc(arya(E), 'POD-2610-010', { to: 'bukan-email' }), 'invalid');
    no(K.shareDoc(mila(E), 'INV-2610-071', { to: 'x@y.com' }), null, 'FO shares an invoice');
    ok(K.auditLog({ ev: 'DOC.SHARE' }).length >= 1, 'audited');
  });

  /* ---- NP-04 billing (read only) ---- */
  add('NP-04', 'CLP-T21', ['Ringkasan billing = sisa invoice di Phase 10', 'Billing summary = open invoice amounts in Phase 10'], function (E) {
    var K = E.K, F = E.F, b = K.billing(arya(E)), sum = 0;
    b.list.forEach(function (r) { eq(r.open, F.openOf(F.invoice(r.id)), r.id + ' open'); sum += r.open; });
    eq(b.summary.outstanding.amt, sum, 'outstanding'); ok(b.summary.overdue.amt > 0, 'INV-2609-074 overdue');
    eq(b.list.filter(function (r) { return r.id === 'INV-2609-074'; })[0].st, 'overdue');
    ok(b.list.every(function (r) { return r.cl === 'CL-07'; }), 'only CL-07');
  });
  add('NP-04', 'CLP-T22', ['Detail invoice dengan bukti pendukung; FO tanpa izin invoice ditolak', 'Invoice detail with supporting evidence; FO without invoice permission refused'], function (E) {
    var K = E.K, d = K.invoice(arya(E), 'INV-2610-071'); ok(d && d.lines.length === 2, 'lines'); ok(d.support, 'support section'); eq(d.total, E.F.invoice('INV-2610-071').total, 'total = Phase 10');
    ok(K.invoice(putu(E), 'INV-2610-071'), 'finance user reads');
    eq(K.invoice(mila(E), 'INV-2610-071'), null, 'FO has no invoice access'); eq(K.billing(mila(E)), null, 'no billing for FO');
    ok(!E.X.canScreen(mila(E), 'CLP-008'), 'no billing screen for FO');
  });
  add('NP-04', 'CLP-T23', ['Statement: saldo berjalan berakhir di total outstanding; butuh izin pembayaran', 'Statement: running balance ends at the outstanding total; needs payment permission'], function (E) {
    var K = E.K, s = yes(K.statement(arya(E), { from: '2026-01-01', to: '2026-10-06' }), 'statement'), last = s.rows[s.rows.length - 1];
    eq(last.bal, K.billing(arya(E)).summary.outstanding.amt, 'closing balance');
    no(K.statement(mila(E), {}), 'noperm');
  });
  add('NP-04', 'CLP-T24', ['Isolasi: klien tidak bisa mengubah data keuangan apa pun', 'Isolation: a client cannot change any financial data'], function (E) {
    var F = E.F, a = arya(E), before = JSON.stringify(F.invoice('INV-2610-071'));
    ok(!a.perms.some(function (p) { return /^fin\./.test(p); }), 'no finance permission');
    no(F.recordPayment(a, 'INV-2610-071', { amt: 1000 }), null, 'record payment');
    no(F.draftJournal(a, { date: '2026-10-06', desc: ['x', 'x'], lines: [{ a: '6300', d: 1 }, { a: '1113', c: 1 }] }), null, 'journal');
    eq(JSON.stringify(F.invoice('INV-2610-071')), before, 'invoice unchanged');
    ['editInvoice', 'payInvoice', 'setInvoice', 'updateInvoice'].forEach(function (k) { eq(typeof E.K[k], 'undefined', 'no ' + k + ' in the portal'); });
  });
  add('NP-04', 'CLP-T25', ['Invoice Jaens masuk seed Phase 10: AR subledger = GL', 'Jaens invoices join the Phase 10 seed: AR subledger = GL'], function (E) {
    var F = E.F, rc = F.reconCenter(fin(E)); ['ar', 'br'].forEach(function (k) { eq(rc.rows.filter(function (x) { return x.k === k; })[0].diff, 0, k + ' diff'); });
    eq(F.bs().check, 0, 'balance sheet'); ['INV-2610-071', 'INV-2610-072', 'INV-2609-073', 'INV-2609-074'].forEach(function (id) { ok(F.invoice(id), id); });
  });
  add('NP-04', 'CLP-T26', ['Hubungi finance: kasus invoice dibuat, pemilik finance', 'Contact finance: an invoice case is created, owned by finance'], function (E) {
    var K = E.K, r = yes(K.contactFinance(putu(E), { inv: 'INV-2610-071', msg: 'Mohon cantumkan nomor PO' }), 'contact finance');
    eq(r.case.cat, 'invoice'); eq(r.case.ref, 'INV-2610-071'); eq(K.state().cases.filter(function (c) { return c.id === r.case.id; })[0].owner, 'EMP-030');
    no(K.contactFinance(mila(E), { inv: 'INV-2610-071', msg: 'x' }), null, 'FO');
  });

  /* ---- NP-05 cases ---- */
  add('NP-05', 'CLP-T27', ['Kirim laporan: validasi, prioritas dari kategori, target SLA', 'Submit report: validation, priority from category, SLA target'], function (E) {
    var K = E.K, m = mila(E);
    no(K.createCase(m, { prop: 'PR-07A', cat: 'nope', desc: 'abcdef' }), 'invalid'); no(K.createCase(m, { prop: 'PR-07A', cat: 'stain', desc: 'ab' }), 'invalid');
    no(K.createCase(m, { prop: 'PR-07A', cat: 'stain', desc: 'Noda di handuk', ref: 'ORD-9999-999' }), 'invalid', 'unknown ref');
    var r = yes(K.createCase(m, { prop: 'PR-07A', cat: 'missing', desc: '2 handuk kurang', ref: 'ORD-2610-101' })); eq(r.case.pri, 'high'); eq(r.case.st, 'new');
    eq(r.case.target, '2026-10-07 10:30', '24h target'); ok(K.auditLog({ ev: 'CASE.CREATE' }).length >= 1);
    no(K.createCase(m, { prop: 'PR-07B', cat: 'stain', desc: 'Noda di handuk' }), 'scope', 'mila PR-07B');
    no(K.createCase(m, { prop: 'PR-07A', cat: 'stain', desc: 'Noda di handuk', ref: 'ORD-2610-111' }), 'scope', 'mila references a PR-07B order');
  });
  add('NP-05', 'CLP-T28', ['Alur kasus: assign → tanya klien → balasan → selesai → feedback', 'Case flow: assign → ask client → reply → resolved → feedback'], function (E) {
    var K = E.K, m = mila(E), c = yes(K.createCase(m, { prop: 'PR-07A', cat: 'stain', desc: 'Noda kuning di 3 handuk' })).case.id;
    no(K.caseAct(m, c, 'resolve', { note: 'x' }), 'noperm', 'client resolves'); no(K.caseAct(drv(E), c, 'assign'), 'noperm', 'driver');
    no(K.caseFeedback(m, c, { rating: 5 }), 'jump', 'feedback before resolved');
    yes(K.caseAct(ops(E), c, 'assign', { emp: 'EMP-010' })); no(K.caseAct(ops(E), c, 'ask', {}), 'reason');
    yes(K.caseAct(ops(E), c, 'ask', { note: 'Mohon kirim foto' })); var v = K.case(m, c); eq(v.st, 'waiting'); eq(v.canReply, true); ok(v.question, 'question shown');
    yes(K.replyCase(m, c, { msg: 'Foto terlampir' })); eq(K.case(m, c).st, 'review');
    yes(K.caseNote(ops(E), c, 'Cek ulang mesin W-03')); ok(K.case(m, c).timeline.every(function (l) { return !l.internal; }), 'internal note hidden from the client');
    yes(K.caseAct(ops(E), c, 'resolve', { note: 'Dicuci ulang gratis' })); eq(K.case(m, c).canFeedback, true);
    no(K.caseFeedback(m, c, { rating: 9 }), 'invalid'); yes(K.caseFeedback(m, c, { rating: 5, comment: 'Cepat' })); no(K.caseFeedback(m, c, { rating: 4 }), null, 'feedback twice');
  });
  add('NP-05', 'CLP-T29', ['Keluhan Phase 6/9 tampil sebagai kasus portal; ringkasan status', 'Phase 6/9 complaints appear as portal cases; status summary'], function (E) {
    var K = E.K, all = K.cases(arya(E)); ok(all.some(function (c) { return c.src !== 'portal'; }), 'linked cases');
    ok(all.some(function (c) { return c.id === 'CASE-00210'; }), 'seed case'); var s = K.caseSummary(arya(E)); eq(s.total, all.length, 'summary total');
    eq(s.new + s.progress + s.done + s.waiting, s.total, 'buckets add up');
    ok(K.cases(mila(E)).every(function (c) { return c.prop === 'PR-07A'; }), 'mila cases PR-07A only'); eq(K.case(mila(E), 'CASE-00210'), null, 'mila opens a PR-07B case');
  });

  /* ---- NP-06 client users & access ---- */
  add('NP-06', 'CLP-T30', ['Daftar user klien & ringkasan; hanya pengelola user', 'Client user list & summary; user managers only'], function (E) {
    var K = E.K, u = K.clientUsers(arya(E)); eq(u.summary.total, 8); eq(u.summary.suspended, 1); eq(u.summary.invited, 1); eq(u.summary.inactive, 1);
    ok(u.list.every(function (x) { return x.cl === 'CL-07'; }), 'only CL-07 users');
    eq(K.clientUsers(mila(E)).list.length, 0, 'FO sees no users'); ok(!E.X.canScreen(mila(E), 'CLP-013'), 'no users screen');
    var d = K.clientUser(arya(E), 'USR-702'); ok(d && d.perms && d.propNames, 'user detail');
  });
  add('NP-06', 'CLP-T31', ['Tambah user: diundang, email ganda ditolak, terima undangan → bisa login', 'Add user: invited, duplicate email refused, invitation accepted → can sign in'], function (E) {
    var K = E.K, a = arya(E), f = { name: 'Dewi Lestari', email: 'dewi@jaensspa.com', phone: '+62 811 222 333', pos: 'Front Office', role: 'fo', scope: 'single', props: ['PR-07B'] };
    no(K.addClientUser(a, { name: 'X', email: 'x@y.com', role: 'fo', scope: 'single', props: [] }), 'invalid', 'single without property');
    var r = yes(K.addClientUser(a, f)); eq(r.user.st, 'invited'); no(E.X.login(r.user.u, 'jfresh123'), null, 'invited cannot sign in');
    no(K.addClientUser(a, f), 'dup', 'same email');
    yes(K.acceptInvite(r.user.uid)); yes(E.X.login(r.user.u, 'jfresh123'), 'sign in after accepting');
    var c = E.X.resolve(r.user.uid, {}); eq(K.props(c).length, 1); eq(K.props(c)[0].id, 'PR-07B');
    ok(K.auditLog({ ev: 'CLIENT.USER_ADD' }).length >= 1, 'audited');
  });
  add('NP-06', 'CLP-T32', ['Ubah akses: alasan wajib, before/after di audit, cakupan langsung berlaku', 'Edit access: reason required, before/after audited, scope applies at once'], function (E) {
    var K = E.K, a = arya(E); no(K.editAccess(a, 'USR-702', { scope: 'sel', props: ['PR-07A', 'PR-07B'] }), 'reason');
    yes(K.editAccess(a, 'USR-702', { scope: 'sel', props: ['PR-07A', 'PR-07B'] }, 'Rotasi FO'));
    var au = K.auditLog({ ev: 'CLIENT.ACCESS_EDIT' })[0]; eq(au.rec, 'USR-702'); eq(au.before.scope, 'single'); eq(au.after.scope, 'sel'); eq(au.reason, 'Rotasi FO');
    eq(K.props(mila(E)).length, 2, 'mila now sees two properties');
    no(K.editAccess(a, 'USR-702', { props: ['PR-01A'], scope: 'single' }, 'x'), null, 'another client\'s property');
  });
  add('NP-06', 'CLP-T33', ['Batas pengelola: tidak di atas akses sendiri, tidak mengubah diri sendiri, finance ditolak', 'Manager limits: not above own access, not self, finance refused'], function (E) {
    var K = E.K; no(K.editAccess(putu(E), 'USR-702', { role: 'gm' }, 'x'), 'noperm', 'finance');
    no(K.suspend(arya(E), 'USR-701', 'x'), 'invalid', 'self');
    no(K.editAccess(arya(E), 'USR-706', { scope: 'single', props: ['PR-07A'] }, 'x'), 'noperm', 'GM edits the director');
    no(K.addClientUser(arya(E), { name: 'Big Boss', email: 'boss@jaensspa.com', role: 'owner', scope: 'all' }), 'noperm', 'GM creates an owner');
  });
  add('NP-06', 'CLP-T34', ['Suspend → login ditolak; aktifkan kembali → login lagi', 'Suspend → login refused; reactivate → login again'], function (E) {
    var K = E.K, a = arya(E); no(K.suspend(a, 'USR-702'), 'reason');
    yes(K.suspend(a, 'USR-702', 'Investigasi')); no(E.X.login('mila.jaens', 'jfresh123'), 'suspended');
    yes(K.reactivate(a, 'USR-702', 'Selesai')); yes(E.X.login('mila.jaens', 'jfresh123'), 'login again');
    no(K.reactivate(a, 'USR-708', 'x'), 'jump', 'invited cannot be activated by hand');
  });
  add('NP-06', 'CLP-T35', ['Matriks role & akses property', 'Role matrix & property access'], function (E) {
    var K = E.K, m = K.roleMatrix(); eq(m.length, 8, 'eight client roles');
    var fn = m.filter(function (r) { return r.k === 'finance'; })[0]; eq(fn.perms.pickup, false); eq(fn.perms.invoice, true);
    var vo = m.filter(function (r) { return r.k === 'viewonly'; })[0]; eq(vo.perms.complaint, false);
    var pa = K.propertyAccess(arya(E)); eq(pa.props.length, 4); ok(pa.props.every(function (p) { return p.users.length >= 1; }), 'users per property');
    eq(K.propertyAccess(mila(E)), null, 'FO');
  });

  /* ---- ISO isolation between clients & properties ---- */
  add('ISO', 'CLP-T36', ['Isolasi: user CL-01 tidak menjangkau order, invoice, POD, dokumen, user, kasus, tracking CL-07', 'Isolation: a CL-01 user cannot reach CL-07 orders, invoices, POD, docs, users, cases, tracking'], function (E) {
    var K = E.K, s = sari(E), d0 = denials(K, 'USR-090');
    eq(K.scope(s).cl, 'CL-01');
    ok(K.active(s).every(function (r) { return r.cl === 'CL-01'; }), 'active orders CL-01 only');
    eq(K.job(s, 'ORD-2610-121'), null, 'order'); eq(K.track(s, 'ORD-2610-121'), null, 'tracking');
    eq(K.invoice(s, 'INV-2610-071'), null, 'invoice'); ok(K.invoices(s, {}).every(function (r) { return r.cl === 'CL-01'; }), 'invoice list');
    no(K.viewDoc(s, 'POD-2610-010'), 'scope', 'POD'); no(K.downloadDoc(s, 'INV-2610-071'), null, 'download');
    ok(K.docs(s).every(function (d) { return ['PR-07A', 'PR-07B', 'PR-07C', 'PR-07D'].indexOf(d.prop) < 0 && !/^DOC-071/.test(d.id); }), 'docs');
    eq(K.clientUser(s, 'USR-701'), null, 'user'); no(K.suspend(s, 'USR-702', 'x'), null, 'suspend another client\'s user');
    eq(K.case(s, 'CASE-00210'), null, 'case'); ok(K.cases(s).every(function (c) { return c.cl === 'CL-01'; }), 'case list');
    eq(K.search(s, 'ORD-2610-121').orders.length, 0, 'search');
    no(K.requestCancel(s, 'ORD-2610-143', { reason: 'x' }), 'scope', 'cancel');
    ok(denials(K, 'USR-090') >= d0 + 5, 'denials audited');
  });
  add('ISO', 'CLP-T37', ['Isolasi mila: PR-07B tidak terlihat di mana pun (order, dokumen, notifikasi, X.inScope)', 'mila isolation: PR-07B invisible everywhere (orders, docs, notifications, X.inScope)'], function (E) {
    var K = E.K, m = mila(E);
    eq(K.job(m, 'ORD-2610-111'), null, 'order'); eq(K.job(m, 'DLV-2610-010'), null, 'delivery');
    ok(K.docs(m).every(function (d) { return d.prop !== 'PR-07B'; }), 'docs');
    ok(!E.X.inScope(m, { cl: 'CL-07', prop: 'PR-07B' }), 'X.inScope PR-07B'); ok(E.X.inScope(m, { cl: 'CL-07', prop: 'PR-07A' }), 'X.inScope PR-07A');
    var ns = E.X.notifsFor(m); ok(ns.every(function (n) { var t = JSON.stringify([n.t, n.c]); return t.indexOf('Shanti') < 0 && t.indexOf('PR-07B') < 0 && t.indexOf('Triloka') < 0; }), 'notifications');
    ok(K.requests(m).every(function (r) { return r.prop === 'PR-07A'; }), 'requests');
  });
  add('ISO', 'CLP-T38', ['Staf internal tanpa izin portal tidak membaca data portal', 'Internal staff without portal permission cannot read portal data'], function (E) {
    var K = E.K; eq(K.cases(drv(E)).length, 0, 'driver cases'); eq(K.clientUsers(drv(E)).list.length, 0, 'driver users');
    ok(K.cases(ops(E)).length >= 1, 'ops manager sees cases'); eq(K.scope(ops(E)).client, false);
    no(K.requestPickup(ops(E), pick()), 'noperm', 'staff creates a client pickup through the portal');
  });

  /* ---- KPI, notifications, audit ---- */
  add('KPI', 'CLP-T39', ['KPI portal: 8 indikator dengan pembilang/penyebut', 'Portal KPIs: 8 indicators with numerator/denominator'], function (E) {
    var K = E.K, k = K.kpis(ops(E), 'CL-07'); eq(k.length, 8);
    ['adoption', 'selfPickup', 'tracking', 'podView', 'invoiceView', 'complaintDigital', 'resolutionTime', 'engagement'].forEach(function (x) { ok(k.some(function (r) { return r.k === x; }), x); });
    var sp0 = k.filter(function (r) { return r.k === 'selfPickup'; })[0].num; yes(K.requestPickup(arya(E), pick()));
    eq(K.kpis(ops(E), 'CL-07').filter(function (r) { return r.k === 'selfPickup'; })[0].num, sp0 + 1, 'self-service pickup counted');
    eq(K.kpis(drv(E), 'CL-07').length, 0, 'driver has no KPI access');
  });
  add('KPI', 'CLP-T40', ['Notifikasi klien: invoice overdue, permintaan, kasus; tandai dibaca', 'Client notifications: overdue invoice, request, case; mark read'], function (E) {
    var K = E.K, a = arya(E), n = K.notifs(a); ok(n.some(function (x) { return x.kind === 'inv.overdue' && x.rec === 'INV-2609-074'; }), 'overdue invoice');
    var r = yes(K.requestPickup(a, pick())); ok(K.notifs(a).some(function (x) { return x.rec === r.request.id; }), 'request notification');
    var all = E.X.notifsFor(a), cl = all.filter(function (x) { return /^CL-/.test(x.id) && !x.read; })[0]; ok(cl, 'joined into X.notifsFor');
    E.X.markRead(a, [cl.id]); ok(E.X.notifsFor(a).filter(function (x) { return x.id === cl.id; })[0].read, 'marked read');
    ok(K.notifs(mila(E)).every(function (x) { return !/^inv\./.test(x.kind); }), 'FO gets no invoice notifications');
    ok(K.notifs(mila(E)).every(function (x) { return x.prop !== 'PR-07B'; }), 'FO gets no PR-07B notifications');
  });
  add('AUDIT', 'CLP-T41', ['Event audit portal tercatat dengan who/before/after/reason/device', 'Portal audit events recorded with who/before/after/reason/device'], function (E) {
    var K = E.K, a = arya(E); K.requestPickup(putu(E), pick()); K.editAccess(a, 'USR-702', { pos: 'Senior FO' }, 'Promosi'); K.viewDoc(a, 'POD-2610-010');
    var d = K.auditLog({ ev: 'ACCESS.DENIED' })[0]; ok(d.uid === 'USR-703' && d.result === 'denied', 'denial row'); ok(d.device, 'device');
    var e = K.auditLog({ ev: 'CLIENT.ACCESS_EDIT' })[0]; ok(e.before && e.after && e.reason === 'Promosi' && e.cl === 'CL-07', 'edit row');
    ok(K.auditLog({ ev: 'DOC.VIEW' }).length >= 1, 'doc view');
    ok(Object.keys(K.AUDIT).length >= 18, 'events defined');
  });
  add('AUDIT', 'CLP-T42', ['Owner pemilik record: ORD, DLV, INV, POD, CASE, REQ, USR', 'Record owner: ORD, DLV, INV, POD, CASE, REQ, USR'], function (E) {
    var K = E.K; [['ORD-2610-121', 'PR-07C'], ['DLV-2610-010', 'PR-07B'], ['INV-2610-071', 'PR-07A'], ['CASE-00210', 'PR-07B'], ['REQ-2610-002', 'PR-07A']].forEach(function (x) { var r = K.recordOf(x[0]); ok(r, x[0]); eq(r.cl, 'CL-07', x[0] + ' client'); eq(r.prop, x[1], x[0] + ' property'); });
    eq(K.ownerOf('USR-702'), 'CL-07'); eq(K.recordOf('ORD-9999-999'), null);
  });

  function run(E) {
    var res = [], ENG = [E.P, E.CM, E.LG, E.PR, E.DL, E.F, E.K];
    T.forEach(function (t) {
      NOW = E.F.ms(E.F.D.simNow); var clk = function () { return NOW; };
      E.X._resetStore(); E.X._setClock(clk);
      ENG.forEach(function (M) { if (M && M._setClock) M._setClock(clk); });
      ENG.forEach(function (M) { if (M && M._reset) M._reset(); });
      try { t.fn(E); res.push({ group: t.group, id: t.id, n: t.n, ok: true }); }
      catch (e) { res.push({ group: t.group, id: t.id, n: t.n, ok: false, err: e.message }); }
    });
    var sim = E.F.ms(E.F.D.simNow), t0 = Date.now(), live = function () { return sim + (Date.now() - t0); };
    ENG.forEach(function (M) { if (M && M._setClock) M._setClock(live); }); E.X._setClock(function () { return Date.now(); });
    E.X._resetStore(); ENG.forEach(function (M) { if (M && M._reset) M._reset(); });
    return res;
  }
  var api = { cases: T, run: run };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.JFCLP_TESTS = api;
})(typeof window !== 'undefined' ? window : this);
