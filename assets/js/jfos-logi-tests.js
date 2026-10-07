/* ==========================================================================
   JFRESH OS — Phase 7 automated test cases (Order, Pickup, Delivery & Live
   Logistics). Each case resets the logistics store, fixes the clock at
   2026-10-06 10:30 and runs against the real engine (jfos-logi.js).
   Run in node:    node tools/test-logi.js
   Run in browser: phase7/tests.html
   ========================================================================== */
(function (root) {
  function L(a, b) { return [a, b === undefined ? a : b]; }
  var T = [], NOW = 0;
  function add(group, id, name, fn) { T.push({ group: group, id: id, n: name, fn: fn }); }
  function eq(a, b, what) { if (a !== b) throw new Error((what || 'value') + ': expected ' + JSON.stringify(b) + ', got ' + JSON.stringify(a)); }
  function ok(v, what) { if (!v) throw new Error(what || 'expected true'); }
  function no(r, code, what) { ok(r && r.ok === false, (what || 'action') + ' should be refused'); if (code) eq(r.code, code, (what || 'action') + ' code'); }
  function ctx(role, emp) { return function (M) { return { uid: 'T-' + (emp || role), name: 'Tester ' + role, roleKey: role, perms: (M.ROLE_PERMS[role] || []).slice(), employee: emp ? { id: emp } : null }; }; }
  function cli(id) { return function (M) { return { uid: 'T-' + id, name: 'Client ' + id, roleKey: 'client', client: id, perms: M.ROLE_PERMS.client.slice() }; }; }
  var spv = ctx('supervisor', 'EMP-021'), own = ctx('owner', 'EMP-050'), opr = ctx('operator', 'EMP-001'), sal = ctx('sales', 'EMP-040');
  var ketut = ctx('driver', 'EMP-002'), wayan = ctx('driver', 'EMP-082'), komang = ctx('driver', 'EMP-083'), gede = ctx('driver', 'EMP-063');
  var gv = cli('CL-01'), jaens = cli('CL-07'), abc = cli('CL-05');
  function T0(x) { return Array.isArray(x) ? x[0] : x; }
  function adv(min) { NOW += min * 60000; }
  // Ketut finishes ORD-103 (on the way → arrived → pickup → confirmed).
  function pick103(M, bags) { var d = ketut(M); M.arrive(d, 'ORD-2610-103'); M.savePickup(d, 'ORD-2610-103', { bags: bags || 10, cont: 0, kg: 80, cat: 'linen', cond: 'good' }); return M.confirmPickup(d, 'ORD-2610-103', { pic: 'Agus Pratama', sign: 'data:image/png;base64,x' }); }

  /* ----- NP-01 Order ----- */
  add('np01', 'LG-01', L('Order punya sumber, prioritas, SLA dan status sesuai alur (§6, §10)', 'Orders carry source, priority, SLA and a valid status flow (§6, §10)'), function (M) {
    var o = M.order('ORD-2610-103'); ok(M.SRC[o.src] && M.PRI[o.pri] && M.ST[o.st], 'labels'); ok(M.sla(o).tat > 0, 'SLA from Phase 6 rules');
    ok(M.canMove(o, 'arrived') && !M.canMove(o, 'received'), 'on the way can go to arrived, never jump to received');
  });
  add('np01', 'LG-02', L('Order ganda (property, tanggal, jam, jenis) terdeteksi dan butuh alasan (§11)', 'Duplicate orders (property, date, time, type) are detected and need a reason (§11)'), function (M) {
    var f = { prop: 'PR-01B', kind: 'pickup', date: '2026-10-06', win: ['10:30', '11:30'], svc: 'SV-006', bags: 4, pri: 'normal' };
    var r = M.createOrder(spv(M), f); no(r, 'dup', 'duplicate'); ok(r.dup.length >= 1 && r.dup[0].o.id === 'ORD-2610-103', 'points at ORD-103');
    no(M.createOrder(spv(M), f, { force: true }), 'reason', 'force without reason');
    var r2 = M.createOrder(spv(M), f, { force: true, reason: 'Tambahan dari GM' }); ok(r2.ok && r2.order.dupOf === 'ORD-2610-103', 'kept with link to the original');
  });
  add('np01', 'LG-03', L('Klien hanya bisa membuat pickup untuk property sendiri (§81)', 'A client can only request pickups for its own properties (§81)'), function (M) {
    var f = { prop: 'PR-05A', kind: 'pickup', date: '2026-10-07', win: ['09:00', '10:00'], svc: 'SV-006', bags: 3 };
    no(M.createOrder(gv(M), f), null, 'other client property');
    var r = M.createOrder(abc(M), f); ok(r.ok, 'own property'); eq(r.order.src, 'client'); eq(r.order.st, 'requested');
  });
  add('np01', 'LG-04', L('Reschedule dan batal butuh alasan, klien diberi tahu, audit tercatat', 'Reschedule and cancel need a reason, the client is notified, the audit is written'), function (M) {
    no(M.reschedule(spv(M), 'ORD-2610-142', '2026-10-07', ['09:00', '10:00'], ''), 'reason', 'no reason');
    ok(M.reschedule(spv(M), 'ORD-2610-142', '2026-10-07', ['09:00', '10:00'], 'Klien minta besok').ok, 'reschedule');
    ok(M.notifs(cli('CL-08')(M)).some(function (n) { return n.kind === 'resched'; }), 'client notified');
    ok(M.auditLog({ ord: 'ORD-2610-142' }).length > 0, 'audited');
  });

  /* ----- NP-02 Recurring schedule ----- */
  add('np02', 'LG-05', L('Jadwal rutin membuat order besok sekali saja (tanpa duplikat) (§8)', 'Recurring schedules generate tomorrow\'s orders once (no duplicates) (§8)'), function (M) {
    var d = M.addDays(M.TODAY, 1), r1 = M.generate(spv(M), d, { confirmed: true }), r2 = M.generate(spv(M), d, { confirmed: true });
    ok(r1.made.length > 0, 'orders made'); eq(r2.made.length, 0, 'second run makes none');
    ok(r1.made.every(function (o) { return o.src === 'scheduled' && o.sch; }), 'linked to the schedule');
  });
  add('np02', 'LG-06', L('Jadwal dijeda dan hari libur dilewati / dipindah sesuai aturan (§9)', 'Paused schedules and holidays are skipped / moved by rule (§9)'), function (M) {
    var paused = M.state().schedules.filter(function (s) { return !s.active; })[0]; ok(paused, 'a paused schedule exists');
    var d = M.addDays(M.TODAY, 1), r = M.generate(spv(M), d, { confirmed: true });
    ok(!r.made.some(function (o) { return o.sch === paused.id; }), 'paused schedule makes no order');
    var h = M.state().holidays[0]; ok(M.HOL_RULE[h.rule], 'holiday rule known');
  });
  add('np02', 'LG-07', L('Ubah jadwal membuat versi baru; jadwal lama tidak diubah (§8)', 'Editing a schedule creates a new version; the old one is not overwritten (§8)'), function (M) {
    var s = M.schedule('SCH-01'), old = s.pick;
    no(M.saveSchedule(spv(M), 'SCH-01', Object.assign({}, s, { pick: '10:00', eff: M.addDays(M.TODAY, 2) })), 'reason', 'no reason');
    var r = M.saveSchedule(spv(M), 'SCH-01', Object.assign({}, s, { pick: '10:00', eff: M.addDays(M.TODAY, 2), reason: 'Jam check-out berubah' }));
    ok(r.ok && r.schedule.id !== 'SCH-01', 'new id'); eq(M.schedule('SCH-01').pick, old, 'old version unchanged'); eq(M.schedule('SCH-01').next, r.schedule.id, 'linked');
  });

  /* ----- NP-03 Dispatch ----- */
  add('np03', 'LG-08', L('Dispatch board: 7 lajur dan panel perhatian terurut keparahan (§13–§16)', 'Dispatch board: 7 lanes and an attention panel sorted by severity (§13–§16)'), function (M) {
    var b = M.board(spv(M)); eq(Object.keys(b).length, 7, 'lanes');
    ok(b.unassigned.some(function (o) { return o.id === 'ORD-2610-141'; }), 'urgent order unassigned'); ok(b.ontheway.length >= 1, 'on the way');
    var a = M.attention(spv(M)); ok(a.length > 0, 'attention items'); eq(a[0].sev, 'crit', 'critical first');
  });
  add('np03', 'LG-09', L('Penugasan dicek kapasitas: kendaraan perawatan ditolak, peringatan butuh alasan (§21)', 'Assignment checks capacity: vehicle in maintenance blocked, warnings need a reason (§21)'), function (M) {
    var c = M.checkAssign('ORD-2610-141', 'EMP-063', 'JF-02'); ok(c.blocks.some(function (b) { return b[0] === 'maint'; }), 'JF-02 in maintenance');
    no(M.assign(spv(M), 'ORD-2610-141', 'EMP-063', 'JF-02', { force: true, reason: 'x' }), 'maint', 'blocked even with force');
    var r = M.assign(spv(M), 'ORD-2610-141', 'EMP-063', 'JF-05', { force: true, reason: 'Kendaraan cadangan' }); ok(r.ok, 'spare van'); eq(M.order('ORD-2610-141').st, 'assigned');
    ok(M.notifs(gede(M)).some(function (n) { return n.kind === 'task' && n.ord === 'ORD-2610-141'; }), 'driver gets the task');
  });
  add('np03', 'LG-10', L('Hanya dispatcher yang bisa menugaskan; driver dan klien ditolak dan dicatat', 'Only a dispatcher can assign; driver and client are refused and logged'), function (M) {
    no(M.assign(ketut(M), 'ORD-2610-141', 'EMP-002', 'JF-01', { force: true, reason: 'x' }), 'noperm', 'driver');
    no(M.assign(gv(M), 'ORD-2610-141', 'EMP-002', 'JF-01', { force: true, reason: 'x' }), 'noperm', 'client');
    ok(M.auditLog({ ev: 'ACCESS.DENIED' }).length >= 2, 'denials audited');
  });

  /* ----- NP-04 Route & fleet ----- */
  add('np04', 'LG-11', L('Ubah urutan stop butuh alasan, driver diberi tahu, ETA dihitung ulang (§22)', 'Reordering stops needs a reason, notifies the driver and recalculates ETA (§22)'), function (M) {
    no(M.moveStop(spv(M), 'TRP-2610-01', 'ORD-2610-105', 'up', ''), 'reason', 'no reason');
    var before = M.plan(M.trip('TRP-2610-01')).filter(function (r) { return r.ord === 'ORD-2610-105'; })[0].eta;
    ok(M.moveStop(spv(M), 'TRP-2610-01', 'ORD-2610-105', 'up', 'Delivery Kayana lebih mendesak').ok, 'moved');
    var after = M.plan(M.trip('TRP-2610-01')).filter(function (r) { return r.ord === 'ORD-2610-105'; })[0].eta; ok(after < before, 'ETA earlier after moving up');
    ok(M.notifs(ketut(M)).some(function (n) { return n.kind === 'routechange'; }), 'driver notified');
    no(M.moveStop(spv(M), 'TRP-2610-01', 'ORD-2610-103', 'up', 'x'), 'jump', 'running stop cannot move');
  });
  add('np04', 'LG-12', L('Kendaraan: muatan, kapasitas dan status perawatan dengan alasan (§19–§20)', 'Vehicles: load, capacity and maintenance status with a reason (§19–§20)'), function (M) {
    var v = M.vehicles().filter(function (x) { return x.v.id === 'JF-01'; })[0]; ok(v.plan.bags > 0 && v.plan.bags <= v.v.cap.bags, 'planned load within capacity');
    no(M.setVehicle(spv(M), 'JF-05', 'repair', ''), 'reason', 'no reason'); ok(M.setVehicle(spv(M), 'JF-05', 'repair', 'Ban bocor').ok, 'set');
    eq(M.vehicles().filter(function (x) { return x.v.id === 'JF-05'; })[0].cur, 'maint');
  });

  /* ----- NP-05 Driver mobile ----- */
  add('np05', 'LG-13', L('Driver hanya melihat dan mengerjakan tugasnya sendiri (§23, §90)', 'A driver only sees and works on own tasks (§23, §90)'), function (M) {
    var h = M.driverHome(ketut(M)); eq(h.trip.id, 'TRP-2610-01'); eq(h.cur.id, 'ORD-2610-103', 'current task');
    no(M.arrive(wayan(M), 'ORD-2610-103'), 'noperm', 'other driver arrive'); no(M.startTrip(ketut(M), 'ORD-2610-113'), 'noperm', 'other driver order');
  });
  add('np05', 'LG-14', L('MULAI PERJALANAN memulai pelacakan; satu stop aktif sekaligus (§25, §55)', 'MULAI PERJALANAN starts tracking; one active stop at a time (§25, §55)'), function (M) {
    no(M.startTrip(ketut(M), 'ORD-2610-104'), 'busy', 'while 103 is running');
    pick103(M); var r = M.startTrip(ketut(M), 'ORD-2610-104'); ok(r.ok && r.eta, 'started with ETA'); eq(M.order('ORD-2610-104').st, 'ontheway');
    ok(M.notifs(cli('CL-06')(M)).some(function (n) { return n.kind === 'tripstart' && n.ord === 'ORD-2610-104'; }) || M.notifs({ client: M.order('ORD-2610-104').cl, perms: [] }).some(function (n) { return n.kind === 'tripstart'; }), 'client told');
  });
  add('np05', 'LG-15', L('Tidak bisa lompat status: belum tiba tidak bisa selesai pickup (§24)', 'No status jumps: cannot complete a pickup before arriving (§24)'), function (M) {
    no(M.savePickup(ketut(M), 'ORD-2610-104', { bags: 4 }), 'jump', 'save before arrive');
    no(M.confirmPickup(ketut(M), 'ORD-2610-104', { pic: 'X', sign: 'x' }), 'manifest', 'confirm before arrive');
    no(M.arrive(ketut(M), 'ORD-2610-104'), 'jump', 'arrive before start');
  });
  add('np05', 'LG-16', L('Pickup tanpa hitung item; kondisi tidak normal butuh foto atau catatan (§28, §35)', 'Pickup without item count; abnormal condition needs a photo or note (§28, §35)'), function (M) {
    var d = ketut(M); M.arrive(d, 'ORD-2610-103');
    no(M.savePickup(d, 'ORD-2610-103', { bags: 0 }), 'bags', 'zero bags'); no(M.savePickup(d, 'ORD-2610-103', { bags: 10, cond: 'wet' }), 'cond', 'wet without evidence');
    var r = M.savePickup(d, 'ORD-2610-103', { bags: 10, cond: 'wet', notes: '1 bag basah' }); ok(r.ok, 'with a note'); ok(!('items' in M.order('ORD-2610-103').exec), 'no item count field');
  });

  /* ----- NP-06 Manifest & bags ----- */
  add('np06', 'LG-17', L('Konfirmasi pickup membuat manifest dan bag dengan kode scan (§30–§32)', 'Confirming a pickup creates a manifest and bags with scan codes (§30–§32)'), function (M) {
    var r = pick103(M, 11); ok(r.ok, 'confirmed'); var m = r.manifest; eq(m.bags, 11); eq(m.st, 'intransit');
    var bags = M.state().bags.filter(function (b) { return b.mf === m.id; }); eq(bags.length, 11, 'one record per bag'); ok(bags.every(function (b) { return /^JF\d+$/.test(b.code); }), 'scan codes');
    ok(M.auditLog({ ev: 'MANIFEST.CHANGE' }).some(function (a) { return a.rec === m.id; }), 'estimate vs actual difference logged');
  });
  add('np06', 'LG-18', L('Perubahan bag butuh alasan dan membuat versi manifest baru (§33–§34)', 'Bag changes need a reason and create a new manifest version (§33–§34)'), function (M) {
    var mf = 'MF-2610-01'; no(M.bagAction(spv(M), mf, 'add', {}), 'reason', 'add without reason');
    var r = M.bagAction(spv(M), mf, 'add', { reason: 'Bag tambahan dari spa' }); ok(r.ok, 'added'); eq(r.manifest.ver, 2); eq(r.manifest.bags, 9);
    no(M.bagAction(sal(M), mf, 'remove', { bag: 'BAG-2610-01-01', reason: 'x' }), 'noperm', 'sales cannot change bags');
  });
  add('np06', 'LG-19', L('Scan bag dari manifest lain ditolak; bag hilang membuat masalah (§33)', 'Scanning a bag of another manifest is refused; a missing bag opens an issue (§33)'), function (M) {
    var b2 = M.state().bags.filter(function (b) { return b.mf === 'MF-2610-02'; })[0];
    no(M.bagAction(spv(M), 'MF-2610-01', 'scan', { code: b2.code }), 'wrongmf', 'wrong manifest');
    var b1 = M.state().bags.filter(function (b) { return b.mf === 'MF-2610-01'; })[0]; ok(M.bagAction(spv(M), 'MF-2610-01', 'scan', { code: b1.code }).ok, 'scan own bag');
    var n = M.state().issues.length; ok(M.bagAction(spv(M), 'MF-2610-01', 'missing', { bag: b1.id, reason: 'Tidak ditemukan di mobil' }).ok, 'marked missing'); eq(M.state().issues.length, n + 1, 'issue created');
  });

  /* ----- NP-07 Evidence & POD ----- */
  add('np07', 'LG-20', L('Pickup butuh PIC + tanda tangan, atau alasan + foto (§38)', 'Pickup needs PIC + signature, or reason + photo (§38)'), function (M) {
    var d = ketut(M); M.arrive(d, 'ORD-2610-103'); M.savePickup(d, 'ORD-2610-103', { bags: 10 });
    no(M.confirmPickup(d, 'ORD-2610-103', { pic: '' , sign: 'x' }), 'pic', 'no PIC'); no(M.confirmPickup(d, 'ORD-2610-103', { pic: 'Agus' }), 'sign', 'no signature');
    no(M.confirmPickup(d, 'ORD-2610-103', { pic: 'Agus', nosignReason: 'PIC rapat' }), 'sign', 'reason without photo');
    ok(M.confirmPickup(d, 'ORD-2610-103', { pic: 'Agus', nosignReason: 'PIC rapat', photo: 'data:image/jpeg;base64,x' }).ok, 'reason + photo');
    ok(M.evidenceComplete(M.order('ORD-2610-103')).ok, 'evidence complete');
  });
  add('np07', 'LG-21', L('POD butuh penerima, tanda tangan, foto; selisih bag butuh alasan dan masuk ke supervisor (§39)', 'POD needs recipient, signature, photo; a bag difference needs a reason and reaches the supervisor (§39)'), function (M) {
    var d = ketut(M); pick103(M); M.startTrip(d, 'ORD-2610-104'); M.arrive(d, 'ORD-2610-104'); M.savePickup(d, 'ORD-2610-104', { bags: 4 }); M.confirmPickup(d, 'ORD-2610-104', { pic: 'X', sign: 'x' });
    M.startTrip(d, 'ORD-2610-105'); M.arrive(d, 'ORD-2610-105');
    var f = { recv: 'Dewi', bags: 6, sign: 'x', photo: 'x', cond: 'good' };
    no(M.confirmDelivery(d, 'ORD-2610-105', Object.assign({}, f, { sign: null })), 'sign', 'no signature'); no(M.confirmDelivery(d, 'ORD-2610-105', Object.assign({}, f, { photo: null })), 'photo', 'no photo');
    no(M.confirmDelivery(d, 'ORD-2610-105', Object.assign({}, f, { bags: 5 })), 'bagdiff', 'difference without reason');
    var n = M.state().issues.length; ok(M.confirmDelivery(d, 'ORD-2610-105', Object.assign({}, f, { bags: 5, issue: '1 bag tertinggal di plant' })).ok, 'with reason');
    eq(M.state().issues.length, n + 1, 'issue raised'); eq(M.order('ORD-2610-105').st, 'completed');
  });
  add('np07', 'LG-22', L('Bukti tidak bisa diedit; koreksi jadi catatan baru dengan alasan (§41)', 'Evidence cannot be edited; a correction is a new record with a reason (§41)'), function (M) {
    var e = M.evidence(spv(M), 'ORD-2610-102').filter(function (x) { return x.kind === 'pic'; })[0];
    no(M.amendEvidence(ketut(M), e.id, 'Y', 'x'), 'noperm', 'driver'); no(M.amendEvidence(spv(M), e.id, 'Y', ''), 'reason', 'no reason');
    var r = M.amendEvidence(spv(M), e.id, 'Ibu Sari W. · Exec HK', 'Ejaan nama'); ok(r.ok, 'amended');
    ok(e.superseded === r.ev.id && r.ev.amends === e.id, 'linked both ways'); ok(e.data.indexOf('Sari Wulandari') >= 0, 'original value kept');
  });
  add('np07', 'LG-23', L('Foto / pin di chat bisa dijadikan bukti, sekali saja (§68)', 'A chat photo / pin can become evidence, once (§68)'), function (M) {
    var m = M.state().chat.filter(function (x) { return x.kind === 'pin'; })[0]; var r = M.promote(spv(M), m.id); ok(r.ok, 'promoted');
    no(M.promote(spv(M), m.id), 'exists', 'second time'); no(M.promote(spv(M), M.state().chat.filter(function (x) { return x.kind === 'text'; })[0].id), null, 'text cannot be evidence');
  });

  /* ----- NP-08 Issues ----- */
  add('np08', 'LG-24', L('ADA MASALAH butuh jenis (bukan teks bebas saja); 15 jenis tersedia (§43–§45)', 'ADA MASALAH needs a type (not free text only); 15 types available (§43–§45)'), function (M) {
    eq(Object.keys(M.ISSUE_TYPES).length, 15); no(M.reportIssue(ketut(M), 'ORD-2610-103', { note: 'macet' }), 'type', 'free text only');
    no(M.reportIssue(ketut(M), 'ORD-2610-103', { type: 'other' }), 'note', 'other without note');
    no(M.reportIssue(ketut(M), 'ORD-2610-103', { type: 'contam' }), 'photo', 'contaminated without evidence');
  });
  add('np08', 'LG-25', L('Masalah kritis langsung ke supervisor; terlambat menambah ETA dan memberi tahu klien (§46, §61)', 'A critical issue escalates to the supervisor; a delay moves the ETA and tells the client (§46, §61)'), function (M) {
    var e0 = M.eta(M.order('ORD-2610-103')).at;
    var r = M.reportIssue(ketut(M), 'ORD-2610-103', { type: 'traffic', delay: 15, action: 'continue' }); ok(r.ok);
    ok(M.eta(M.order('ORD-2610-103')).at > e0, 'ETA later');
    M.tick(); ok(M.notifs(gv(M)).some(function (n) { return n.kind === 'delay'; }), 'client gets a delay notice');
    var r2 = M.reportIssue(ketut(M), 'ORD-2610-103', { type: 'vehicle', note: 'Ban bocor', action: 'review' }); eq(r2.issue.sev, 'crit');
    ok(M.notifs(spv(M)).some(function (n) { return n.kind === 'vehicle'; }), 'supervisor alerted'); ok(M.auditLog({ ev: 'ISSUE.ESCALATE' }).length > 0, 'escalation audited');
  });
  add('np08', 'LG-26', L('Keputusan supervisor butuh catatan dan memulihkan / memindah order (§47)', 'A supervisor decision needs a note and restores / moves the order (§47)'), function (M) {
    var r = M.reportIssue(ketut(M), 'ORD-2610-103', { type: 'notready', action: 'review' }); eq(M.order('ORD-2610-103').st, 'issue');
    no(M.decide(ketut(M), r.issue.id, 'continue', { note: 'x' }), 'noperm', 'driver cannot decide'); no(M.decide(spv(M), r.issue.id, 'continue', {}), 'reason', 'no note');
    ok(M.decide(spv(M), r.issue.id, 'reschedule', { note: 'Klien minta sore', date: '2026-10-06', win: ['15:00', '16:00'] }).ok, 'decided');
    eq(M.order('ORD-2610-103').st, 'scheduled'); eq(M.order('ORD-2610-103').trip, null, 'removed from the route'); eq(M.issue(r.issue.id).st, 'resolved');
  });

  /* ----- NP-09 Arrival & handover ----- */
  add('np09', 'LG-27', L('Tiba di plant menghentikan pelacakan; tiba ≠ diterima (§53, §55)', 'Arriving at the plant stops tracking; arrived ≠ received (§53, §55)'), function (M) {
    var d = ketut(M); pick103(M);
    ['ORD-2610-104', 'ORD-2610-105'].forEach(function (id) { M.setStatus(spv(M), id, 'cancelled', { reason: 'Uji' }); });
    ok(M.returnToPlant(d).ok, 'return'); ok(M.arriveAtPlant(d).ok, 'at plant'); eq(M.trip('TRP-2610-01').track.on, false, 'tracking off');
    eq(M.position(M.trip('TRP-2610-01')), null, 'no position'); var m = M.mfOf('ORD-2610-103'); eq(m.st, 'arrived'); eq(M.order('ORD-2610-103').st, 'completed', 'not received yet');
  });
  add('np09', 'LG-28', L('Handover dua pihak: driver dan receiving sama-sama konfirmasi (§89)', 'Two-sided handover: driver and receiving both confirm (§89)'), function (M) {
    var d = ketut(M); pick103(M); ['ORD-2610-104', 'ORD-2610-105'].forEach(function (id) { M.setStatus(spv(M), id, 'cancelled', { reason: 'Uji' }); }); M.returnToPlant(d); M.arriveAtPlant(d);
    var mf = M.mfOf('ORD-2610-103').id;
    no(M.hoConfirm(opr(M), mf), 'verify', 'receiving before verify'); ok(M.hoVerify(opr(M), mf, { count: 10, cond: 'good' }).match, 'count matches');
    var r1 = M.hoConfirm(opr(M), mf); ok(r1.ok && !r1.complete, 'one side only'); var r2 = M.hoConfirm(d, mf); ok(r2.complete, 'both sides');
    eq(M.order('ORD-2610-103').st, 'atplant'); ok(M.startReceiving(opr(M), mf).ok, 'receiving starts'); eq(M.order('ORD-2610-103').st, 'received');
    no(M.hoConfirm(wayan(M), 'MF-2610-01'), 'noperm', 'other driver');
  });
  add('np09', 'LG-29', L('Selisih jumlah bag tidak pernah diam: butuh alasan + foto, jadi Selisih Handover (§52)', 'A bag difference is never silent: reason + photo, becomes a Handover Difference (§52)'), function (M) {
    var d = ketut(M); pick103(M); ['ORD-2610-104', 'ORD-2610-105'].forEach(function (id) { M.setStatus(spv(M), id, 'cancelled', { reason: 'Uji' }); }); M.returnToPlant(d); M.arriveAtPlant(d);
    var mf = M.mfOf('ORD-2610-103').id; no(M.hoVerify(opr(M), mf, { count: 9 }), 'bagdiff', 'no reason');
    var r = M.hoVerify(opr(M), mf, { count: 9, reason: '1 bag tertinggal', photo: 'x' }); ok(r.ok && r.diff === -1, 'recorded'); eq(M.manifest(mf).st, 'discrepancy');
    ok(M.notifs(spv(M)).some(function (n) { return n.kind === 'bagdiff'; }), 'supervisor alerted');
    no(M.hoConfirm(opr(M), mf), 'pending', 'receiving cannot close before decision');
    ok(M.decide(spv(M), M.manifest(mf).ho.issue, 'found', { note: 'Ketemu di mobil' }).ok, 'decided'); eq(M.manifest(mf).st, 'arrived');
  });
  add('np09', 'LG-30', L('Arrival board: lajur diharapkan, segera tiba, tiba, masalah, selesai (§48–§50)', 'Arrival board: expected, arriving soon, arrived, issue, done lanes (§48–§50)'), function (M) {
    var a = M.arrivals(opr(M)); ['expected', 'soon', 'arrived', 'issue', 'done'].forEach(function (k) { ok(Array.isArray(a[k]), k); });
    ok(a.issue.some(function (c) { return c.trip.id === 'TRP-2610-04'; }), 'Gede\'s MF-05 difference'); eq(M.arrivals(sal(M)), null, 'sales has no arrival board');
  });

  /* ----- NP-10 Live tracking, ETA, chat ----- */
  add('np10', 'LG-31', L('Lokasi hanya saat trip aktif; tidak ada pelacakan di luar shift (§55)', 'Location only during an active trip; no tracking outside the shift (§55)'), function (M) {
    eq(M.position(M.trip('TRP-2610-04')), null, 'finished trip has no position'); ok(M.position(M.trip('TRP-2610-01')), 'active trip');
    ok(!M.canSeeLocation(spv(M), M.trip('TRP-2610-04')), 'supervisor cannot see a finished trip');
    var d = ketut(M); pick103(M); ['ORD-2610-104', 'ORD-2610-105'].forEach(function (id) { M.setStatus(spv(M), id, 'cancelled', { reason: 'Uji' }); }); M.returnToPlant(d); M.arriveAtPlant(d);
    M.state().manifests.filter(function (m) { return m.trip === 'TRP-2610-01' && m.st === 'arrived'; }).forEach(function (m) { ok(M.hoConfirm(d, m.id).ok, 'driver side ' + m.id); }); ok(M.endShift(d).ok, 'shift ends'); eq(M.liveStatus(M.trip('TRP-2610-01')), 'ended');
  });
  add('np10', 'LG-32', L('Lokasi lama tidak pernah tampil live: sinyal lemah → lokasi terakhir (§60, §72)', 'Stale location is never shown as live: weak signal → last known (§60, §72)'), function (M) {
    var p = M.position(M.trip('TRP-2610-03')); ok(p.fresh !== 'live', 'Komang is stale'); eq(M.liveStatus(M.trip('TRP-2610-03')), 'weak');
    var e = M.eta(M.order('ORD-2610-121')); ok(e.stale && !e.live, 'ETA flagged stale');
    adv(15); eq(M.position(M.trip('TRP-2610-03')).fresh, 'offline', 'offline after 15 min'); M.tick(); ok(M.notifs(spv(M)).some(function (n) { return n.kind === 'offline'; }), 'supervisor told');
    ok(M.signal(spv(M), 'TRP-2610-03', 'ok').ok); eq(M.position(M.trip('TRP-2610-03')).fresh, 'live', 'back live');
  });
  add('np10', 'LG-33', L('ETA: durasi, jam tiba, update terakhir; hampir tiba memberi tahu klien sekali (§59, §64)', 'ETA: duration, arrival time, last update; near arrival notifies the client once (§59, §64)'), function (M) {
    var e = M.eta(M.order('ORD-2610-103')); ok(e.min >= 0 && e.at && e.upd, 'fields'); ok(e.near, 'Ketut is near');
    M.tick(); M.tick(); eq(M.notifs(gv(M)).filter(function (n) { return n.kind === 'near'; }).length, 1, 'one near notice');
    ok(M.state().chat.some(function (m) { return m.ord === 'ORD-2610-103' && m.body === 'near'; }), 'system event in chat');
  });
  add('np10', 'LG-34', L('Klien hanya melihat driver saat menuju property-nya sendiri (§62, §81)', 'A client only sees the driver while heading to its own property (§62, §81)'), function (M) {
    var t1 = M.trip('TRP-2610-01'); ok(M.canSeeLocation(gv(M), t1, 'ORD-2610-103'), 'Grand Vista sees its own trip');
    ok(!M.canSeeLocation(abc(M), t1), 'Hotel ABC cannot'); ok(!M.canSeeLocation(gv(M), M.trip('TRP-2610-02')), 'not another trip');
    eq(M.clientTrack(gv(M), 'ORD-2610-121'), null, 'other client order'); var x = M.clientTrack(gv(M), 'ORD-2610-103'); ok(x.live && x.pos, 'live while on the way');
    var x2 = M.clientTrack(gv(M), 'ORD-2610-102'); ok(!x2.live && !x2.pos, 'finished stop: no location any more');
  });
  add('np10', 'LG-35', L('Owner perlu alasan untuk melihat lokasi; setiap akses tercatat (§79)', 'The owner needs a reason to view location; every access is logged (§79)'), function (M) {
    ok(M.needsReason(own(M)), 'owner'); ok(!M.needsReason(spv(M)), 'dispatcher does not');
    no(M.logView(own(M), 'TRP-2610-01', ''), 'reason', 'no reason'); var n = M.state().locLog.length;
    ok(M.logView(own(M), 'TRP-2610-01', 'Review keterlambatan').ok, 'logged'); eq(M.state().locLog.length, n + 1);
    ok(M.logView(spv(M), 'TRP-2610-01').ok && M.logView(spv(M), 'TRP-2610-01').dup, 'repeat view within 10 min counted once');
    no(M.logView(sal(M), 'TRP-2610-01', 'x'), 'noperm', 'sales');
  });
  add('np10', 'LG-36', L('Retensi: log akses dan lokasi terakhir dihapus setelah 30 hari (§80)', 'Retention: access log and last-known positions removed after 30 days (§80)'), function (M) {
    M.logView(spv(M), 'TRP-2610-01', 'x'); var n = M.state().locLog.length; ok(n > 0);
    M.purge(M.now() + 31 * 86400000); eq(M.state().locLog.length, 0, 'purged');
  });
  add('np10', 'LG-37', L('Chat selalu terikat ke order; peserta sesuai peran dan scope (§65–§67)', 'Chat is always tied to an order; participants by role and scope (§65–§67)'), function (M) {
    ok(M.send(gv(M), 'ORD-2610-103', 'text', 'Halo').ok, 'client in own room'); no(M.send(abc(M), 'ORD-2610-103', 'text', 'x'), 'noperm', 'other client');
    no(M.send(wayan(M), 'ORD-2610-103', 'text', 'x'), 'noperm', 'other driver'); no(M.send(ketut(M), 'ORD-2610-103', 'text', '  '), null, 'empty');
    no(M.send(gv(M), 'ORD-2610-103', 'ref', null, 'ORD-2610-121'), 'noperm', 'client cannot reference another client order');
    ok(M.rooms(ketut(M)).every(function (r) { return M.ownsOrder(ketut(M), r.o); }), 'driver rooms = own orders');
  });
  add('np10', 'LG-38', L('Driver berbagi lokasi di chat hanya saat trip aktif (§69)', 'A driver shares location in chat only during an active trip (§69)'), function (M) {
    var r = M.send(ketut(M), 'ORD-2610-103', 'loc'); ok(r.ok && r.msg.extra.fresh, 'live location with freshness');
    no(M.send(gede(M), 'ORD-2610-132', 'loc'), null, 'Gede\'s trip ended');
  });
  add('np10', 'LG-39', L('Timeline rute: shift, trip, berangkat, tiba, pickup, masalah berurutan (§71)', 'Route timeline: shift, trip, depart, arrive, pickup, issue in order (§71)'), function (M) {
    var rows = M.timeline(spv(M), 'TRP-2610-01'); ok(rows.length > 5); eq(rows[0].k, 'shift');
    for (var i = 1; i < rows.length; i++) ok(M.ms(rows[i].at) >= M.ms(rows[i - 1].at), 'sorted');
    eq(M.timeline(wayan(M), 'TRP-2610-01'), null, 'other driver'); ok(M.timeline(ketut(M), 'TRP-2610-01'), 'own driver');
  });

  /* ----- KPI and Phase 5 link ----- */
  add('kpi', 'LG-40', L('12 KPI logistik dihitung otomatis; KPI driver mengisi Personal Score Fase 5 (§76–§77)', '12 logistics KPIs calculated automatically; driver KPIs feed the Phase 5 Personal Score (§76–§77)'), function (M) {
    eq(M.KPIS.length, 12); var k = M.kpi().k; M.KPIS.forEach(function (d) { ok(k[d[0]] != null, d[0]); });
    var P = { D: { PEOPLE: [{ id: 'EMP-002', role: 'drv' }, { id: 'EMP-001', role: 'opr' }] } }; eq(M.perfFeed(P), 1); eq(P.D.PEOPLE[0].ind.length, 5, 'five driver indicators'); ok(!P.D.PEOPLE[1].ind, 'non-drivers untouched');
  });

  /* ----- Security & integration ----- */
  add('sec', 'LG-41', L('Izin dicek di mesin, bukan hanya di layar (§90)', 'Permissions are checked in the engine, not only in the screen (§90)'), function (M) {
    no(M.markReady(sal(M), 'ORD-2610-113'), 'noperm', 'sales mark ready'); no(M.setVehicle(opr(M), 'JF-01', 'repair', 'x'), 'noperm', 'operator vehicle');
    no(M.hoVerify(ketut(M), 'MF-2610-01', { count: 9 }), 'noperm', 'driver cannot verify own handover');
    no(M.saveRoute(ketut(M), 'R-01', { n: 'x', start: '08:00', end: '09:00' }), 'noperm', 'driver route edit');
    eq(M.evidence(abc(M), 'ORD-2610-102'), null, 'other client evidence');
  });
  add('sec', 'LG-42', L('recordOf memberi scope klien untuk otorisasi aplikasi (§81)', 'recordOf gives the client scope for app authorisation (§81)'), function (M) {
    eq(M.recordOf('ORD-2610-103').cl, 'CL-01'); eq(M.recordOf('MF-2610-05').cl, 'CL-07'); eq(M.recordOf('BAG-2610-01-01').cl, 'CL-07'); eq(M.recordOf('TRP-2610-01').plant, 'PL-01'); eq(M.recordOf('NOPE'), null);
  });
  add('sec', 'LG-43', L('Notifikasi logistik masuk ke lonceng header sesuai scope (§74–§75)', 'Logistics notifications join the header bell by scope (§74–§75)'), function (M) {
    var X = { notifsFor: function () { return [{ id: 'NT-01', at: 1, read: false }]; }, markRead: function () {}, canScreen: function () { return true; } };
    M.joinNotifs(X); var c = gv(M), list = X.notifsFor(c), mine = list.filter(function (n) { return n.p7; });
    ok(mine.length > 0, 'client gets logistics notices'); ok(mine.every(function (n) { return n.cta && n.cta.s; }), 'each has a CTA');
    X.markRead(c, [mine[0].id]); ok(X.notifsFor(c).filter(function (n) { return n.id === mine[0].id; })[0].read, 'read state kept');
    ok(X.notifsFor(abc(M)).filter(function (n) { return n.p7; }).every(function (n) { return !/Grand Vista/.test(T0(n.c)); }), 'no other client notices');
  });
  add('sec', 'LG-44', L('Rute Fase 2 lama diarahkan ke layar Fase 7 (satu sumber logistik)', 'Old Phase 2 logistics routes point at the Phase 7 screens (one logistics truth)'), function (M) {
    eq(M.ALIAS['HOM-DRV-001'], 'DRIVER-MOB-001'); eq(M.ALIAS['CLT-DLV-001'], 'TRACK-003'); eq(M.SCREENS.length, 27, '26 screens of §84 + KPI board');
    ['ORDER-001', 'DISPATCH-001', 'DRIVER-MOB-001', 'POD-001', 'HANDOVER-001', 'TRACK-003', 'CHAT-001', 'TIMELINE-001'].forEach(function (id) { ok(M.screen(id), id); });
  });

  function run(M) {
    return T.map(function (c) {
      NOW = M.ms('2026-10-06 10:30'); M._setClock(function () { return NOW; }); M._reset();
      try { c.fn(M); return { group: c.group, id: c.id, n: c.n, ok: true }; } catch (e) { return { group: c.group, id: c.id, n: c.n, ok: false, err: e.message }; }
    });
  }
  var API = { cases: T, run: function (M) { var real = M.ms(M.D.simNow), t0 = Date.now(), r = run(M); M._setClock(function () { return real + (Date.now() - t0); }); M._reset(); return r; } };
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
  else root.JFLOG_TESTS = API;
})(typeof window !== 'undefined' ? window : this);
