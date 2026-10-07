/* ==========================================================================
   JFRESH OS — Phase 9 automated test cases (Delivery, Client Completion &
   Service Closure). Each case resets the delivery, production and logistics
   stores, fixes the clock at 2026-10-06 10:30 and runs against the real
   engine (jfos-dlv.js) on top of the Phase 7 and Phase 8 engines.
   Run in node:    node tools/test-dlv.js
   Run in browser: phase9/tests.html
   ========================================================================== */
(function (root) {
  function L(a, b) { return [a, b === undefined ? a : b]; }
  var T = [], NOW = 0;
  function add(group, id, name, fn) { T.push({ group: group, id: id, n: name, fn: fn }); }
  function eq(a, b, what) { if (a !== b) throw new Error((what || 'value') + ': expected ' + JSON.stringify(b) + ', got ' + JSON.stringify(a)); }
  function ok(v, what) { if (!v) throw new Error(what || 'expected true'); }
  function no(r, code, what) { ok(r && r.ok === false, (what || 'action') + ' should be refused'); if (code) eq(r.code, code, (what || 'action') + ' code'); }
  function yes(r, what) { if (!r || r.ok !== true) throw new Error((what || 'action') + ' should pass: ' + (r ? (r.code + ' ' + JSON.stringify(r.msg)) : 'no result')); return r; }
  // A test user carries the Phase 9 permissions plus the Phase 7 and Phase 8 ones of the same role, as the app does.
  function perms(M, role) { var o = [].concat(M.ROLE_PERMS[role] || []); [M.LG, M.PR].forEach(function (E) { if (E && E.ROLE_PERMS && E.ROLE_PERMS[role]) o = o.concat(E.ROLE_PERMS[role]); }); return o; }
  function ctx(role, emp) { return function (M) { return { uid: 'T-' + (emp || role), name: 'Tester ' + role, roleKey: role, perms: perms(M, role), employee: emp ? { id: emp } : null }; }; }
  function cli(id, ct) { return function (M) { return { uid: 'T-' + id, name: 'Client ' + id, roleKey: 'client', client: id, contact: ct || null, perms: perms(M, 'client') }; }; }
  var spv = ctx('supervisor', 'EMP-021'), ops = ctx('opsmgr', 'EMP-030'), own = ctx('owner', 'EMP-050'), fin = ctx('finance', 'EMP-060'), sal = ctx('sales', 'EMP-040'), luh = ctx('prod3', 'EMP-077');
  var ketut = ctx('driver', 'EMP-002'), gede = ctx('driver', 'EMP-063'), wayan = ctx('driver', 'EMP-082');
  var nyoman = cli('CL-03', 'CT-034'), abc = cli('CL-05'), jaens = cli('CL-07'), gv = cli('CL-01');
  function adv(min) { NOW += min * 60000; }
  var PH = 'data:image/png;base64,x';
  function T0(x) { return Array.isArray(x) ? x[0] : x; }
  // Ketut finishes the running pickup ORD-103 so the next stop can start.
  function pick103(M) {
    var d = ketut(M), LG = M.LG;
    LG.arrive(d, 'ORD-2610-103'); LG.savePickup(d, 'ORD-2610-103', { bags: 10, cont: 0, kg: 80, cat: 'linen', cond: 'good' });
    return yes(LG.confirmPickup(d, 'ORD-2610-103', { pic: 'Agus Pratama', sign: PH }), 'pickup 103');
  }
  // Release B-2610-001 and drive ORD-2610-105 to the handover: on the way → arrived → handover started.
  function toSite(M) {
    var r = yes(M.release(spv(M), 'REL-2610-001', {}), 'release'), id = r.dlv.id, d = ketut(M);
    pick103(M); adv(5);
    yes(M.LG.startTrip(d, 'ORD-2610-105'), 'start trip'); adv(25);
    yes(M.LG.arrive(d, 'ORD-2610-105'), 'arrive');
    yes(M.hoStart(d, id), 'handover start');
    return id;
  }
  function deliver(M, pkgs, extra) {
    var id = toSite(M), d = ketut(M), dl = M.dlv(id);
    var v = yes(M.hoVerify(d, id, Object.assign({ prop: true, recv: 'Made Sudira', role: 'Housekeeping', pkgs: pkgs == null ? dl.pkgs : pkgs, cond: 'good' }, extra && extra.ho)), 'verify');
    var p = M.podConfirm(d, id, Object.assign({ sign: PH, photo: PH }, extra && extra.pod));
    return { id: id, v: v, p: p };
  }

  /* ----- NP-01 Ready to Deliver & Release ----- */
  add('np01', 'DL-01', L('Antrian release membaca Fase 8; RELEASE KE LOGISTICS membuat delivery dan membuka gerbang (§5–§7)', 'The release queue reads Phase 8; RELEASE KE LOGISTICS creates the delivery and opens the gate (§5–§7)'), function (M) {
    var s = spv(M), st = {}; M.releases(s, {}).forEach(function (r) { st[r.id] = M.relSt(r); });
    eq(st['REL-2610-001'], 'ready'); eq(st['REL-2610-003'], 'waiting'); eq(st['REL-2610-004'], 'hold'); eq(st['REL-2610-005'], 'issue');
    ok(M.gate('ORD-2610-105'), 'gate closed before release');
    var r = yes(M.release(s, 'REL-2610-001', {})); eq(r.rel.st, 'released'); eq(r.dlv.ord, 'ORD-2610-105'); eq(r.dlv.pkgs, 4); eq(r.dlv.batch, 'B-2610-001');
    eq(M.gate('ORD-2610-105'), null, 'gate open after release');
    eq(M.LG.order('ORD-2610-105').bags, 4, 'Phase 7 order takes the package count');
    ok(M.auditLog({ rec: 'REL-2610-001' }).some(function (e) { return e.ev === 'RELEASE.LOGISTICS'; }), 'audited');
    no(M.release(s, 'REL-2610-001', {}), 'done', 'second release');
  });
  add('np01', 'DL-02', L('Release ditolak: hold, masalah, label belum dikonfirmasi; hanya supervisor & manajer (§6, §85)', 'Release refused: hold, issue, label not confirmed; supervisor & manager only (§6, §85)'), function (M) {
    var s = spv(M);
    no(M.release(s, 'REL-2610-004', {}), 'hold', 'on hold'); no(M.release(s, 'REL-2610-005', {}), 'issue', 'open issue');
    var r = no(M.release(s, 'REL-2610-003', {}), 'check', 'label missing');
    no(M.release(fin(M), 'REL-2610-002', {}), 'noperm', 'finance'); no(M.release(own(M), 'REL-2610-002', {}), 'noperm', 'owner'); no(M.release(luh(M), 'REL-2610-002', {}), 'noperm', 'team 3');
    ok(M.releases(luh(M), {}).length > 0, 'team 3 still sees the queue');
    eq(M.releases(ketut(M), {}).length, 0, 'driver sees no release queue');
    yes(M.confirmLabel(s, 'REL-2610-003')); eq(M.relSt(M.rel('REL-2610-003')), 'ready');
    yes(M.release(s, 'REL-2610-003', {}), 'release after label');
  });
  add('np01', 'DL-03', L('Override QC sebagian: wajib izin override dan alasan, tercatat dengan nama dan peran (§8)', 'Partial-QC override: needs the override right and a reason, recorded with name and role (§8)'), function (M) {
    var s = spv(M);
    no(M.unholdRel(s, 'REL-2610-004', ''), 'reason', 'unhold without note');
    yes(M.unholdRel(s, 'REL-2610-004', 'Klien setuju kirim sebagian'));
    eq(M.relSt(M.rel('REL-2610-004')), 'waiting');
    no(M.release(s, 'REL-2610-004', {}), 'reason', 'override without reason');
    var r = yes(M.release(s, 'REL-2610-004', { reason: 'Klien butuh hari ini, re-check menyusul' }));
    eq(r.rel.ovr.role, 'supervisor'); eq(r.rel.ovr.gaps.join(), 'qc');
    ok(M.auditLog({ ev: 'OVERRIDE' }).length === 1, 'override audited');
  });
  add('np01', 'DL-04', L('Hold & masalah release butuh alasan; masalah kritis menahan release (§9)', 'Release hold & issues need a reason; a critical issue blocks release (§9)'), function (M) {
    var s = spv(M);
    no(M.holdRel(s, 'REL-2610-002', ''), 'reason'); yes(M.holdRel(s, 'REL-2610-002', 'Menunggu konfirmasi klien'));
    no(M.release(s, 'REL-2610-002', {}), 'hold');
    yes(M.unholdRel(s, 'REL-2610-002', 'Sudah konfirmasi'));
    no(M.relIssue(s, 'REL-2610-002', {}), 'note'); yes(M.relIssue(s, 'REL-2610-002', { note: 'Label sobek' }));
    no(M.release(s, 'REL-2610-002', {}), 'issue');
    yes(M.resolveRelIssue(s, 'REL-2610-002', 'Label dicetak ulang'));
    yes(M.release(s, 'REL-2610-002', {}), 'release after resolve');
  });
  add('np01', 'DL-05', L('Team 3 tidak bisa serahkan ke driver sebelum release; Fase 7 tidak bisa mulai pengiriman (§7)', 'Team 3 cannot hand to the driver before release; Phase 7 cannot start the delivery (§7)'), function (M) {
    var g = M.gate('ORD-2610-105'); ok(g && /release/i.test(T0(g)), 'gate names the release');
    yes(M.release(spv(M), 'REL-2610-001', {}));
    eq(M.gate('ORD-2610-105'), null);
    yes(M.holdDlv(spv(M), M.byOrd('ORD-2610-105').id, 'Klien minta tunda'));
    ok(M.gate('ORD-2610-105'), 'held delivery closes the gate again');
  });

  /* ----- NP-02 Delivery task & dispatch ----- */
  add('np02', 'DL-06', L('Delivery dari snapshot membuat order Fase 7 tanpa salin tracking; lane dispatch (§10–§11)', 'A snapshot delivery creates a Phase 7 order without copying tracking; dispatch lanes (§10–§11)'), function (M) {
    var s = spv(M), r = yes(M.release(s, 'REL-2610-002', {})), d = r.dlv;
    ok(d.ord, 'Phase 7 order linked'); var o = M.LG.order(d.ord); eq(o.kind, 'delivery'); eq(o.prop, 'PR-07A'); eq(o.d9, d.id);
    eq(M.status(d), 'waiting');
    var lanes = M.board(s); ok(lanes && Object.keys(lanes).length >= 3, 'board lanes'); ok(M.laneOf(d), 'lane');
    var w = yes(M.dispatchLink(s, 'DLV-2610-012')); ok(w.ord, 'dispatch creates the order on demand');
    no(M.dispatchLink(ketut(M), 'DLV-2610-012'), 'noperm', 'driver cannot dispatch');
  });
  add('np02', 'DL-07', L('Ubah jendela, hold, batal: alasan wajib; status berjalan tidak bisa ditahan (§11)', 'Change window, hold, cancel: reason required; a running delivery cannot be held (§11)'), function (M) {
    var s = spv(M);
    yes(M.dispatchLink(s, 'DLV-2610-013'));
    no(M.setWindow(s, 'DLV-2610-013', '2026-10-06', ['16:00', '17:00'], ''), 'reason');
    no(M.setWindow(s, 'DLV-2610-013', '2026-10-05', ['16:00', '17:00'], 'x'), 'win', 'past date');
    yes(M.setWindow(s, 'DLV-2610-013', '2026-10-06', ['16:00', '17:00'], 'Permintaan klien')); eq(M.dlv('DLV-2610-013').win.join(), '16:00,17:00');
    eq(M.LG.order(M.dlv('DLV-2610-013').ord).win.join(), '16:00,17:00', 'Phase 7 order rescheduled');
    no(M.holdDlv(s, 'DLV-2610-001', 'x'), 'jump', 'completed delivery');
    no(M.cancelDlv(s, 'DLV-2610-012', ''), 'reason'); yes(M.cancelDlv(s, 'DLV-2610-012', 'Order dibatalkan klien')); eq(M.status(M.dlv('DLV-2610-012')), 'cancelled');
  });
  add('np02', 'DL-08', L('Status delivery mengikuti Fase 7: berangkat, hampir tiba, tiba (§13)', 'Delivery status follows Phase 7: on the way, near, arrived (§13)'), function (M) {
    var id = yes(M.release(spv(M), 'REL-2610-001', {})).dlv.id, d = ketut(M);
    eq(M.status(M.dlv(id)), 'ready', 'loaded trip stop');
    pick103(M); yes(M.LG.startTrip(d, 'ORD-2610-105')); M.sync();
    ok(['ontheway', 'near'].indexOf(M.status(M.dlv(id))) >= 0, 'on the way');
    ok(M.eta(M.dlv(id)), 'ETA from Phase 7');
    adv(25); yes(M.LG.arrive(d, 'ORD-2610-105')); M.sync(); eq(M.status(M.dlv(id)), 'arrived');
    ok(M.dlv(id).ev.some(function (e) { return e[0] === 'arrived'; }), 'event copied, not the track');
  });
  add('np02', 'DL-09', L('Perhatian supervisor: selisih menunggu review, siap completed (§11)', 'Supervisor attention: differences waiting, ready to complete (§11)'), function (M) {
    var a = M.attention(spv(M));
    ok(a.some(function (x) { return x.kind === 'recdiff' && x.dlv === 'DLV-2610-009'; }), 'pending difference');
    ok(a.some(function (x) { return x.kind === 'complete'; }), 'ready to complete');
    eq(M.attention(ketut(M)).length, 0, 'driver has no supervisor attention');
  });

  /* ----- NP-03 Client tracking ----- */
  add('np03', 'DL-10', L('Klien hanya melihat deliverynya sendiri dengan 6 langkah sederhana (§12, §49)', 'A client only sees its own deliveries in 6 simple steps (§12, §49)'), function (M) {
    var j = jaens(M), list = M.clientDeliveries(j);
    ok(list.length >= 3, 'Jaens deliveries'); ok(list.every(function (d) { return d.cl === 'CL-07'; }), 'own only');
    eq(M.clientView(j, 'DLV-2610-009'), null, 'other client hidden');
    var v = M.clientView(j, 'DLV-2610-013'); ok(v, 'own delivery'); eq(typeof v.step, 'number');
    eq(M.clientView(abc(M), 'DLV-2610-013'), null);
    no(M.reportIssue(abc(M), 'DLV-2610-013', { type: 'late', note: 'x' }), 'noperm', 'other client issue');
  });
  add('np03', 'DL-11', L('Tracking klien memakai Fase 7: driver, plat, ETA saat dalam perjalanan (§13–§14)', 'Client tracking uses Phase 7: driver, plate, ETA while on the way (§13–§14)'), function (M) {
    var id = yes(M.release(spv(M), 'REL-2610-001', {})).dlv.id;
    pick103(M); yes(M.LG.startTrip(ketut(M), 'ORD-2610-105'));
    var v = M.clientView(nyoman(M), id); ok(v, 'Nyoman sees CL-03');
    ok(v.track, 'Phase 7 client track'); ok(v.driver, 'driver name'); ok(v.step >= 2, 'step on the way');
    ok(!v.canRate, 'cannot rate before completion');
  });

  /* ----- NP-04/05 Handover & POD ----- */
  add('np04', 'DL-12', L('Serah terima: SAYA SUDAH TIBA dulu; verifikasi property, penerima, jumlah paket (§15–§16)', 'Handover: SAYA SUDAH TIBA first; verify property, recipient, package count (§15–§16)'), function (M) {
    var id = yes(M.release(spv(M), 'REL-2610-001', {})).dlv.id, d = ketut(M);
    no(M.hoStart(d, id), 'jump', 'before arrival');
    pick103(M); yes(M.LG.startTrip(d, 'ORD-2610-105')); adv(20); yes(M.LG.arrive(d, 'ORD-2610-105'));
    no(M.hoStart(wayan(M), id), null, 'another driver');
    yes(M.hoStart(d, id));
    no(M.hoVerify(d, id, { recv: 'Made', pkgs: 4 }), 'prop'); no(M.hoVerify(d, id, { prop: true, pkgs: 4 }), 'recv'); no(M.hoVerify(d, id, { prop: true, recv: 'Made' }), 'pkgs');
    no(M.hoVerify(d, id, { prop: true, recv: 'Made', pkgs: 4, cond: 'damaged' }), 'notes', 'damaged without note');
    var v = yes(M.hoVerify(d, id, { prop: true, recv: 'Made', pkgs: 4, cond: 'good' })); ok(v.match, 'matched');
  });
  add('np05', 'DL-13', L('POD: tanda tangan dan foto wajib; POD tersimpan, rekonsiliasi SESUAI otomatis (§17–§21)', 'POD: signature and photo required; POD saved, reconciliation MATCHED automatically (§17–§21)'), function (M) {
    var id = toSite(M), d = ketut(M);
    no(M.podConfirm(d, id, { sign: PH, photo: PH }), 'jump', 'before verification');
    yes(M.hoVerify(d, id, { prop: true, recv: 'Made Sudira', pkgs: 4 }));
    no(M.podConfirm(d, id, { photo: PH }), 'sign'); no(M.podConfirm(d, id, { sign: PH }), 'photo');
    var r = yes(M.podConfirm(d, id, { sign: PH, photo: PH }));
    ok(/^POD-2610-/.test(r.pod.id), 'POD id'); eq(r.rec.res, 'ok'); eq(M.status(M.dlv(id)), 'delivered');
    eq(M.LG.order('ORD-2610-105').st, 'completed', 'Phase 7 stop completed');
    ok(M.dlv(id).sla && M.dlv(id).sla.st, 'SLA set'); ok(r.pod.ref.indexOf(id) > 0, 'QR reference');
    no(M.podConfirm(d, id, { sign: PH, photo: PH }), 'done', 'second POD');
    ok(['POD.CAPTURE', 'RECON.COMPLETE'].every(function (e) { return M.auditLog({ dlv: id, ev: e }).length; }), 'audited');
  });
  add('np05', 'DL-14', L('Koreksi POD lewat amandemen beralasan; aslinya tetap (§19)', 'POD corrections through a reasoned amendment; the original stays (§19)'), function (M) {
    var x = deliver(M); yes(x.p, 'pod');
    no(M.amendPod(ketut(M), x.id, { field: 'recv', value: 'Made S.', reason: 'x' }), 'noperm', 'driver');
    no(M.amendPod(spv(M), x.id, { field: 'recv', value: 'Made S.' }), 'reason');
    yes(M.amendPod(spv(M), x.id, { field: 'recv', value: 'Made Sudira Putra', reason: 'Ejaan nama' }));
    var p = M.dlv(x.id).pod; eq(p.recv, 'Made Sudira', 'original kept'); eq(M.podView(p).recv, 'Made Sudira Putra'); eq(p.ver, 2);
  });

  /* ----- NP-06 Reconciliation ----- */
  add('np06', 'DL-15', L('Selisih paket: jenis, alasan, foto, keputusan wajib; paket kurang menunggu supervisor (§20–§23)', 'Package difference: type, reason, photo, decision required; missing packages wait for the supervisor (§20–§23)'), function (M) {
    var id = toSite(M), d = ketut(M);
    var v = yes(M.hoVerify(d, id, { prop: true, recv: 'Made', pkgs: 3 })); ok(!v.match, 'not matched');
    no(M.podConfirm(d, id, { sign: PH, photo: PH }), 'type');
    no(M.podConfirm(d, id, { sign: PH, photo: PH, rec: { type: 'missing' } }), 'reason');
    no(M.podConfirm(d, id, { sign: PH, photo: PH, rec: { type: 'missing', reason: 'Satu paket tertinggal' } }), 'photo');
    no(M.podConfirm(d, id, { sign: PH, photo: PH, rec: { type: 'missing', reason: 'Satu paket tertinggal', photo: PH } }), 'acc');
    no(M.podConfirm(d, id, { sign: PH, photo: PH, rec: { type: 'missing', reason: 'x', photo: PH, acc: 'reject' } }), 'reject', 'reject goes through ADA MASALAH');
    var r = yes(M.podConfirm(d, id, { sign: PH, photo: PH, qty: 75, rec: { type: 'missing', reason: 'Satu paket tertinggal', photo: PH, acc: 'full' } }));
    eq(r.rec.res, 'diff'); eq(r.rec.review, 'pending'); eq(M.status(M.dlv(id)), 'issue');
    ok(M.recQueue(spv(M))[0].id === id, 'top of the review queue');
    no(M.complete(spv(M), id), 'check', 'cannot complete while pending');
  });
  add('np06', 'DL-16', L('Review supervisor: setujui atau kirim ulang yang kurang (redelivery terhubung) (§22, §27)', 'Supervisor review: approve, or redeliver what is missing (linked redelivery) (§22, §27)'), function (M) {
    var s = spv(M);
    no(M.recReview(ketut(M), 'DLV-2610-009', 'approve', { note: 'x' }), 'noperm');
    no(M.recReview(s, 'DLV-2610-009', 'approve', {}), 'reason');
    var r = yes(M.recReview(s, 'DLV-2610-009', 'redeliver', { note: 'Kirim 1 paket yang kurang', win: ['15:00', '16:00'] }));
    ok(r.redel, 'redelivery created'); eq(r.redel.orig, 'DLV-2610-009'); eq(r.redel.attempt, 2); ok(r.redel.ord, 'own Phase 7 order');
    eq(M.dlv('DLV-2610-009').rec.review, 'approved'); eq(M.status(M.dlv('DLV-2610-009')), 'delivered');
    no(M.recReview(s, 'DLV-2610-009', 'approve', { note: 'x' }), 'done', 'second review');
    ok(M.chain('DLV-2610-009').length >= 2, 'chain');
  });
  add('np06', 'DL-17', L('Selisih kecil diterima PIC klien tidak perlu review; terima sebagian membuat return (§21, §26)', 'A small difference accepted by the client PIC needs no review; partial accept creates a return (§21, §26)'), function (M) {
    var id = toSite(M), d = ketut(M);
    yes(M.hoVerify(d, id, { prop: true, recv: 'Made', pkgs: 4, cond: 'partial', notes: 'Satu item noda' }));
    var r = yes(M.podConfirm(d, id, { sign: PH, photo: PH, qty: 98, rec: { type: 'qty', reason: 'Dua item noda dikembalikan', photo: PH, acc: 'partial', accQty: 96, rejQty: 2, retReq: true } }));
    eq(r.rec.review, 'client'); eq(r.rec.acc, 'partial');
    var dl = M.dlv(id); ok(dl.ret, 'return created'); var rt = M.ret(dl.ret); eq(rt.qty, 2); eq(rt.need, 'reprocess');
  });

  /* ----- NP-07 Issues, returns, redelivery ----- */
  add('np07', 'DL-18', L('ADA MASALAH di lokasi · Klien Tidak Ada · BUAT RETURN: order Fase 7 batal, return dalam perjalanan (§24–§26)', 'ADA MASALAH at site · Client Unavailable · BUAT RETURN: Phase 7 order cancelled, return in transit (§24–§26)'), function (M) {
    var id = yes(M.release(spv(M), 'REL-2610-001', {})).dlv.id, d = ketut(M);
    pick103(M); yes(M.LG.startTrip(d, 'ORD-2610-105')); adv(20); yes(M.LG.arrive(d, 'ORD-2610-105'));
    no(M.reportIssue(d, id, {}), 'type');
    var r = yes(M.reportIssue(d, id, { type: 'unavail', note: 'Gudang tutup', action: 'return' }));
    var dl = M.dlv(id); eq(dl.st, 'returned'); eq(dl.sla.st, 'exception'); eq(dl.sla.cause, 'client');
    var rt = M.ret(dl.ret); eq(rt.st, 'intransit'); eq(rt.pkgs, 4);
    eq(M.LG.order('ORD-2610-105').st, 'cancelled', 'Phase 7 stop cancelled');
    eq(r.issue.st, 'resolved');
  });
  add('np07', 'DL-19', L('Alur return: terima di plant (Team 3), review, reprocess, siap, lalu redelivery (§26–§28)', 'Return flow: receive at the plant (Team 3), review, reprocess, ready, then redelivery (§26–§28)'), function (M) {
    var s = spv(M), l = luh(M);
    var id = 'RET-2610-02'; eq(M.ret(id).st, 'intransit', 'seeded in transit');
    no(M.retAdvance(s, id, 'review'), 'jump', 'cannot skip arrival');
    no(M.retAdvance(fin(M), id, 'arrived'), 'noperm', 'finance'); yes(M.retAdvance(l, id, 'arrived'), 'team 3 receives');
    yes(M.retAdvance(s, id, 'review'));
    no(M.retAdvance(s, id, 'reprocess', {}), 'note'); yes(M.retAdvance(s, id, 'reprocess', { note: 'Cuci ulang 2 pcs' })); yes(M.retAdvance(s, id, 'ready'));
    no(M.retAdvance(s, id, 'review'), 'jump', 'no step back');
    no(M.createRedelivery(s, id, { date: '2026-10-06' }), 'win');
    var nr = yes(M.createRedelivery(s, id, { date: '2026-10-07', win: ['09:00', '10:00'], reason: 'Kirim hasil cuci ulang' }));
    eq(nr.dlv.ret, id); eq(M.ret(id).redel, nr.dlv.id); ok(M.ret(id).hist.length >= 4, 'history appended');
    no(M.createRedelivery(s, id, { date: '2026-10-07', win: ['09:00', '10:00'] }), 'done');
  });
  add('np07', 'DL-20', L('Klien bisa lapor masalah hanya setelah diterima; keputusan komplain masuk ke Fase 6 (§29–§30, §50)', 'A client can report only after delivery; a complaint decision reaches Phase 6 (§29–§30, §50)'), function (M) {
    var j = jaens(M);
    no(M.reportIssue(j, 'DLV-2610-013', { type: 'late', note: 'Belum datang' }), 'jump', 'not yet delivered');
    no(M.reportIssue(j, 'DLV-2610-003', { type: 'quality' }), 'note', 'client needs a note');
    var r = yes(M.reportIssue(j, 'DLV-2610-003', { type: 'quality', note: 'Ada noda di 2 handuk', photo: PH }));
    eq(r.issue.src, 'client'); eq(r.issue.st, 'new');
    no(M.decideIssue(j, r.issue.id, 'complaint', { note: 'x' }), 'noperm');
    var dc = yes(M.decideIssue(spv(M), r.issue.id, 'complaint', { note: 'Buat kasus kualitas' }));
    ok(dc.cmp, 'complaint'); ok(M.CM.D.COMPLAINTS.some(function (c) { return c.id === dc.cmp.id; }), 'visible to Phase 6');
    no(M.decideIssue(spv(M), r.issue.id, 'complaint', { note: 'x' }), null, 'no duplicate complaint');
  });
  add('np07', 'DL-21', L('Driver hanya melihat dan melapor pada deliverynya sendiri (§85)', 'A driver only sees and reports on their own deliveries (§85)'), function (M) {
    var mine = M.driverDeliveries(ketut(M)); ok(mine.every(function (d) { return M.driverOf(d) === 'EMP-002'; }), 'own only');
    no(M.reportIssue(ketut(M), 'DLV-2610-009', { type: 'late' }), 'noperm', 'Gede\'s delivery');
    ok(!M.canSee(ketut(M), M.dlv('DLV-2610-009')), 'hidden');
    ok(M.canSee(gede(M), M.dlv('DLV-2610-009')), 'Gede sees it');
  });

  /* ----- NP-08 Completion & timeline ----- */
  add('np08', 'DL-22', L('SELESAI hanya bila delivery, POD, rekonsiliasi, tanpa masalah kritis, SLA final (§31–§33)', 'SELESAI only with delivery, POD, reconciliation, no critical issue, final SLA (§31–§33)'), function (M) {
    var x = deliver(M); yes(x.p);
    no(M.complete(ketut(M), x.id), 'noperm', 'driver'); no(M.complete(fin(M), x.id), 'noperm', 'finance');
    ok(M.compChecks(M.dlv(x.id)).every(function (c) { return c.ok; }), 'all checks pass');
    var r = yes(M.complete(spv(M), x.id)); eq(r.dlv.comp.ver, 1); ok(r.dlv.comp.frozen, 'frozen'); eq(r.dlv.bill.st, 'validation');
    no(M.complete(spv(M), x.id), 'done');
    no(M.amendPod(spv(M), x.id, { field: 'recv', value: 'X', reason: 'x' }), 'frozen', 'POD frozen after completion');
    ok(M.notifs(nyoman(M)).some(function (n) { return n.kind === 'done' && n.dlv === x.id; }), 'client notified');
  });
  add('np08', 'DL-23', L('Ready ≠ Delivered ≠ Completed ≠ Billing Ready (§2)', 'Ready ≠ Delivered ≠ Completed ≠ Billing Ready (§2)'), function (M) {
    var x = deliver(M); yes(x.p);
    eq(M.status(M.dlv(x.id)), 'delivered'); eq(M.billSt(M.dlv(x.id)), 'notready');
    no(M.markBillReady(fin(M), x.id), 'jump', 'billing before completion');
    yes(M.complete(spv(M), x.id)); eq(M.billSt(M.dlv(x.id)), 'validation');
    yes(M.markBillReady(fin(M), x.id)); eq(M.billSt(M.dlv(x.id)), 'ready');
  });
  add('np08', 'DL-24', L('Amandemen completion: versi baru dengan alasan; billing harus validasi ulang (§60)', 'Completion amendment: a new version with a reason; billing must revalidate (§60)'), function (M) {
    var s = spv(M), o = ops(M);
    no(M.amendComp(s, 'DLV-2610-002', { field: 'qty', value: 188, reason: 'x' }), 'noperm', 'supervisor cannot amend');
    no(M.amendComp(o, 'DLV-2610-002', { field: 'qty', value: 188 }), 'reason');
    var before = M.dlv('DLV-2610-002').comp.data.qty;
    yes(M.amendComp(o, 'DLV-2610-002', { field: 'qty', value: 188, reason: 'Hitung ulang dengan PIC' }));
    var d = M.dlv('DLV-2610-002'); eq(d.comp.ver, 2); eq(d.comp.hist[0].from, before); eq(d.bill.st, 'validation', 'ready → revalidation');
  });
  add('np08', 'DL-25', L('Timeline penuh untuk staf; timeline klien tanpa nama staf dan produksi diringkas (§34–§35)', 'Full timeline for staff; the client timeline hides staff and collapses production (§34–§35)'), function (M) {
    var x = deliver(M); yes(x.p);
    var f = M.timeline(spv(M), x.id); ok(f.full, 'full');
    var ks = f.rows.map(function (r) { return r.k; });
    ['qc', 'pack', 'rel', 'arr', 'pod'].forEach(function (k) { ok(ks.indexOf(k) >= 0, 'has ' + k); });
    var c = M.timeline(nyoman(M), x.id); ok(c && !c.full, 'client view');
    ok(c.rows.every(function (r) { return !r.by; }), 'no staff');
    ok(c.rows.some(function (r) { return r.k === 'proc'; }), 'production collapsed');
    ok(!c.rows.some(function (r) { return ['wash', 'dry', 'qc'].indexOf(r.k) >= 0; }), 'no internal steps');
    eq(M.timeline(abc(M), x.id), null, 'other client');
  });

  /* ----- NP-09 Billing Ready ----- */
  add('np09', 'DL-26', L('Kalkulasi billing memakai rate card per tanggal layanan, pajak, kontrak (§37–§39)', 'The billing calculation uses the rate card at the service date, tax, contract (§37–§39)'), function (M) {
    var c = M.billCalc(M.dlv('DLV-2610-004'));
    ok(c.rate > 0, 'rate'); eq(c.eff, '2026-10-05'); eq(c.unit, 'kg');
    eq(c.charge, Math.max(c.min || 0, Math.round(c.rate * c.qty)), 'charge'); eq(c.tax, Math.round(c.charge * c.taxPct / 100)); eq(c.total, c.charge + c.tax);
    var p = M.billCalc(M.dlv('DLV-2610-006')); eq(p.unit, 'pcs', 'per-piece service');
  });
  add('np09', 'DL-27', L('Billing Ready: hanya Finance, validasi lulus, snapshot terkunci; kirim ke Finance (§36, §40–§42)', 'Billing Ready: Finance only, validation passed, snapshot locked; send to Finance (§36, §40–§42)'), function (M) {
    var f = fin(M);
    no(M.markBillReady(spv(M), 'DLV-2610-004'), 'noperm', 'supervisor');
    var r = yes(M.markBillReady(f, 'DLV-2610-004')); ok(/^BIL-2610-/.test(r.dlv.bill.id), 'billing id'); ok(r.dlv.bill.calc.total > 0, 'snapshot');
    no(M.markBillReady(f, 'DLV-2610-004'), 'done');
    var n0 = M.outbox(f).length, s = yes(M.sendFinance(f, ['DLV-2610-004', 'DLV-2610-008']));
    eq(s.sent.join(), 'DLV-2610-004'); eq(s.skip.join(), 'DLV-2610-008', 'not ready skipped');
    eq(M.outbox(f).length, n0 + 1); var p = M.outbox(f)[0]; eq(p.dlv, 'DLV-2610-004'); ok(p.evidence.length >= 2, 'evidence refs');
    eq(M.outbox(ketut(M)).length, 0, 'driver sees no outbox');
  });
  add('np09', 'DL-28', L('Billing ditahan: alasan wajib; klien on hold dan masalah kritis memblokir (§41)', 'Billing hold: reason required; client on hold and critical issues block (§41)'), function (M) {
    var f = fin(M);
    no(M.markBillReady(f, 'DLV-2610-005'), 'hold', 'seeded hold');
    no(M.billUnhold(f, 'DLV-2610-005', ''), 'reason'); yes(M.billUnhold(f, 'DLV-2610-005', 'PO diterima'));
    yes(M.markBillReady(f, 'DLV-2610-005'));
    no(M.billHold(f, 'DLV-2610-008', ''), 'reason'); yes(M.billHold(f, 'DLV-2610-008', 'Menunggu PO')); eq(M.billSt(M.dlv('DLV-2610-008')), 'hold');
    var c = M.client('CL-01'), was = c.status; c.status = 'onhold';
    yes(M.billUnhold(f, 'DLV-2610-008', 'PO ok'));
    var r = M.markBillReady(f, 'DLV-2610-008'); no(r, 'check', 'client on hold'); ok(r.fail.some(function (x) { return x.k === 'block'; }), 'block row');
    c.status = was;
  });
  add('np09', 'DL-29', L('Amandemen setelah terkirim mengirim revisi ke Finance, bukan menimpa (§42, §60)', 'An amendment after sending sends a revision to Finance, never overwrites (§42, §60)'), function (M) {
    var f = fin(M), n0 = M.outbox(f).length;
    yes(M.amendComp(ops(M), 'DLV-2610-001', { field: 'kg', value: 95, reason: 'Timbang ulang' }));
    eq(M.outbox(f).length, n0 + 1); ok(M.outbox(f)[0].amend, 'amendment payload'); eq(M.dlv('DLV-2610-001').bill.st, 'sent');
  });

  /* ----- Feedback & NP-10 KPI ----- */
  add('np10', 'DL-30', L('Feedback klien 1–5 hanya setelah completed, satu kali (§51)', 'Client feedback 1–5 only after completion, once (§51)'), function (M) {
    var j = jaens(M);
    no(M.submitFeedback(j, 'DLV-2610-013', { dr: 5, qr: 5 }), 'jump', 'not completed');
    no(M.submitFeedback(j, 'DLV-2610-003', { dr: 5, qr: 5 }), 'done', 'seeded feedback');
    no(M.submitFeedback(abc(M), 'DLV-2610-003', { dr: 5, qr: 5 }), 'noperm', 'other client');
    no(M.submitFeedback(abc(M), 'DLV-2610-002', { dr: 0, qr: 5 }), 'rating');
    yes(M.submitFeedback(abc(M), 'DLV-2610-002', { dr: 5, qr: 4, c: 'Rapi' }));
    ok(M.clientView(abc(M), 'DLV-2610-002').fb, 'feedback linked');
  });
  add('np10', 'DL-31', L('KPI 30 hari: tepat waktu, POD, rekonsiliasi, return, rating dari histori (§43–§46)', 'KPI over 30 days: on-time, POD, reconciliation, returns, rating from history (§43–§46)'), function (M) {
    var k = M.kpi(30); ok(k.del > 1000, 'history'); ok(k.otd > 90 && k.otd <= 100, 'on-time'); ok(k.pod > 95, 'POD');
    ok(k.rateD >= 1 && k.rateD <= 5, 'rating'); eq(k.rateD, Math.round(k.rateD * 100) / 100, 'two decimals');
    ok(M.trend('week').length >= 4, 'weekly trend'); ok(M.driverPerf(spv(M)).length >= 3, 'driver ranking'); ok(M.topIssues(30).length, 'issues');
  });
  add('np10', 'DL-32', L('KPI tim delivery mengalir ke Fase 5 (T-DLV-01/02/04) (§47)', 'Delivery team KPIs flow into Phase 5 (T-DLV-01/02/04) (§47)'), function (M) {
    var P = { D: { TEAMS: [{ k: 'dlv', kpis: [{ code: 'T-DLV-01', actual: 0 }, { code: 'T-DLV-02', actual: 0 }, { code: 'T-DLV-03', actual: 6.2 }, { code: 'T-DLV-04', actual: 0 }] }] } };
    eq(M.perfFeed(P), 3, 'three KPIs fed'); var x = P.D.TEAMS[0].kpis, k = M.kpi(30);
    eq(x[0].actual, k.otd); eq(x[1].actual, k.pod); eq(x[2].actual, 6.2, 'route efficiency stays Phase 7'); ok(x[3].src9, 'client cases from Phase 9');
    eq(M.teamKpi().length, 6, 'team KPI rows');
  });
  add('np10', 'DL-33', L('Laporan: harian, SLA, return, billing; klien dan driver tidak bisa membuka (§48)', 'Reports: daily, SLA, returns, billing; clients and drivers cannot open them (§48)'), function (M) {
    M.REPORTS.forEach(function (r) { var x = M.report(ops(M), r[0]); ok(x && x.head.length && Array.isArray(x.rows), r[0]); });
    ok(M.report(fin(M), 'bill').rows.length >= 5, 'finance billing report');
    eq(M.report(ketut(M), 'daily'), null); eq(M.report(jaens(M), 'daily'), null);
  });

  /* ----- Notifications & audit ----- */
  add('np10', 'DL-34', L('Notifikasi per peran; audit setiap aksi dan penolakan akses (§58–§59)', 'Notifications per role; every action and access denial is audited (§58–§59)'), function (M) {
    var x = deliver(M, 3, { pod: { qty: 75, rec: { type: 'missing', reason: 'Tertinggal', photo: PH, acc: 'full' } } }); yes(x.p);
    ok(M.notifs(spv(M)).some(function (n) { return n.kind === 'recdiff' && n.dlv === x.id; }), 'supervisor told');
    eq(M.notifs(ketut(M)).filter(function (n) { return n.kind === 'recdiff'; }).length, 0, 'driver not told');
    no(M.release(fin(M), 'REL-2610-002', {})); ok(M.auditLog({ ev: 'ACCESS.DENIED' }).length >= 1, 'denial audited');
    ok(M.auditLog({ dlv: x.id }).length >= 4, 'trail');
  });

  function run(M) {
    return T.map(function (c) {
      NOW = M.ms('2026-10-06 10:30'); var clk = function () { return NOW; };
      [M, M.LG, M.PR].forEach(function (E) { if (E && E._setClock) E._setClock(clk); });
      if (M.LG) M.LG._reset(); if (M.PR) M.PR._reset(); M._reset();
      try { c.fn(M); return { group: c.group, id: c.id, n: c.n, ok: true }; } catch (e) { return { group: c.group, id: c.id, n: c.n, ok: false, err: e.message }; }
    });
  }
  var API = { cases: T, run: function (M) {
    var real = M.ms(M.D.simNow), t0 = Date.now(), r = run(M), clk = function () { return real + (Date.now() - t0); };
    [M, M.LG, M.PR].forEach(function (E) { if (E && E._setClock) E._setClock(clk); });
    if (M.LG) M.LG._reset(); if (M.PR) M.PR._reset(); M._reset(); return r;
  } };
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
  else root.JFDLV_TESTS = API;
})(typeof window !== 'undefined' ? window : this);
