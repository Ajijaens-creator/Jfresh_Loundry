/* ==========================================================================
   JFRESH OS — Phase 8 automated test cases (Laundry Production). Each case
   resets the production and logistics stores, fixes the clock at
   2026-10-06 10:30 and runs against the real engine (jfos-prod.js).
   Run in node:    node tools/test-prod.js
   Run in browser: phase8/tests.html
   ========================================================================== */
(function (root) {
  function L(a, b) { return [a, b === undefined ? a : b]; }
  var T = [], NOW = 0;
  function add(group, id, name, fn) { T.push({ group: group, id: id, n: name, fn: fn }); }
  function eq(a, b, what) { if (a !== b) throw new Error((what || 'value') + ': expected ' + JSON.stringify(b) + ', got ' + JSON.stringify(a)); }
  function ok(v, what) { if (!v) throw new Error(what || 'expected true'); }
  function no(r, code, what) { ok(r && r.ok === false, (what || 'action') + ' should be refused' + (r && r.ok ? '' : '')); if (code) eq(r.code, code, (what || 'action') + ' code'); }
  function yes(r, what) { if (!r || r.ok !== true) throw new Error((what || 'action') + ' should pass: ' + (r ? (r.code + ' ' + JSON.stringify(r.msg)) : 'no result')); return r; }
  function ctx(role, emp) { return function (M) { return { uid: 'T-' + (emp || role), name: 'Tester ' + role, roleKey: role, perms: (M.ROLE_PERMS[role] || []).slice(), employee: emp ? { id: emp } : null }; }; }
  var putu = ctx('prod1', 'EMP-101'), arta = ctx('prod2', 'EMP-071'), luh = ctx('prod3', 'EMP-077'), oka = ctx('maint', 'EMP-102');
  var spv = ctx('supervisor', 'EMP-021'), own = ctx('owner', 'EMP-050'), ketut = ctx('driver', 'EMP-002');
  function adv(min) { NOW += min * 60000; }
  var PH = 'data:image/png;base64,x';
  function tab(M, c) { return M.state().chk.filter(function (x) { return x.date === M.TODAY && x.tpl === c; })[0]; }
  // Takes the rework child B-012 through Team 2 and Team 3 until QC passes and it merges back.
  function reworkThrough(M) {
    var a = arta(M), l = luh(M);
    yes(M.startWash(a, 'B-2610-012', { mach: 'W-02' }), 'rework wash'); adv(60); yes(M.finishWash(a, 'B-2610-012'), 'finish wash');
    yes(M.startDry(a, 'B-2610-012', { mach: 'D-01' }), 'rework dry'); adv(35); yes(M.finishDry(a, 'B-2610-012'), 'finish dry');
    var s = yes(M.send(a, 'B-2610-012'), 'send to team 3'); yes(M.accept(l, s.ho.id), 'team 3 accepts');
    yes(M.startFin(l, 'B-2610-012', { line: 'FL-02' }), 'finishing'); adv(5); yes(M.finishFin(l, 'B-2610-012'), 'finish');
    return yes(M.qcPass(l, 'B-2610-012'), 'rework QC');
  }

  /* ----- NP-01 Receiving & Verification ----- */
  add('np01', 'PR-01', L('Receiving: SESUAI menolak jumlah bag beda; TERIMA CUCIAN membuat Handover 1 (§5–§7)', 'Receiving: SESUAI refuses a bag mismatch; TERIMA CUCIAN creates Handover 1 (§5–§7)'), function (M) {
    var p = putu(M);
    no(M.rcvVerify(p, 'RCV-2610-013', { client: true, prop: true, bags: 2 }), 'mismatch', 'wrong bag count');
    no(M.rcvVerify(p, 'RCV-2610-013', { client: true, bags: 3 }), 'check', 'property not checked');
    yes(M.rcvVerify(p, 'RCV-2610-013', { client: true, prop: true, bags: 3 }), 'verify'); eq(M.rcv('RCV-2610-013').st, 'verified');
    var r = yes(M.rcvAccept(p, 'RCV-2610-013'), 'accept'); eq(r.rcv.stage, 'wgt'); eq(r.ho.kind, 'log1'); eq(r.ho.st, 'accepted');
    ok(M.auditLog({ rec: 'RCV-2610-013' }).some(function (e) { return e.ev === 'RECEIVING.ACCEPTED'; }), 'audited');
  });
  add('np01', 'PR-02', L('ADA SELISIH: alasan, catatan, foto wajib; selisih besar menunggu supervisor (§11)', 'ADA SELISIH: reason, notes, photo required; large differences wait for the supervisor (§11)'), function (M) {
    var p = putu(M), s = spv(M), id = 'RCV-2610-013';
    no(M.rcvDifference(p, id, { bags: 2, note: 'x', photo: PH }), 'reason', 'no reason');
    no(M.rcvDifference(p, id, { bags: 2, reasons: ['missing'], photo: PH }), 'note', 'no note');
    no(M.rcvDifference(p, id, { bags: 2, reasons: ['missing'], note: 'Kurang 1 bag' }), 'photo', 'no photo');
    var r = yes(M.rcvDifference(p, id, { bags: 2, reasons: ['missing'], note: 'Kurang 1 bag', photo: PH })); ok(r.review, 'missing bag needs review');
    ok(M.state().issues.some(function (i) { return i.rcv === id && i.st !== 'resolved'; }), 'issue opened');
    no(M.rcvAccept(p, id), 'review', 'accept before decision');
    no(M.rcvReview(p, id, 'approve', 'ok'), 'noperm', 'operator decides');
    no(M.rcvReview(s, id, 'approve', ''), 'reason', 'decision without note');
    yes(M.rcvReview(s, id, 'approve', 'Klien konfirmasi 2 bag'));
    var a = yes(M.rcvAccept(p, id)); eq(a.ho.st, 'resolved'); eq(a.ho.diff.bags, -1);
  });
  add('np01', 'PR-03', L('Selisih seed RCV-009 menunggu review; tim lain tidak bisa receiving (§85)', 'Seed difference RCV-009 waits for review; other teams cannot receive (§85)'), function (M) {
    no(M.rcvAccept(putu(M), 'RCV-2610-009'), 'review', 'pending review');
    no(M.rcvVerify(arta(M), 'RCV-2610-013', { client: true, prop: true, bags: 3 }), 'noperm', 'team 2');
    no(M.rcvStart(own(M), 'RCV-2610-013'), 'noperm', 'owner');
    eq(M.rcvList(arta(M)).length, 0, 'team 2 sees no receiving queue');
    ok(M.auditLog({ ev: 'ACCESS.DENIED' }).length >= 2, 'denials audited');
  });
  add('np01', 'PR-04', L('Jembatan Fase 7: manifest masuk tampil, sinkron sekali saja (§5)', 'Phase 7 bridge: incoming manifests listed, synced only once (§5)'), function (M) {
    ok(Array.isArray(M.incoming()), 'incoming list'); M.sync(); eq(M.sync(), 0, 'second sync adds nothing');
    var ids = M.state().rcv.map(function (r) { return r.id; }); eq(ids.length, ids.filter(function (x, i) { return ids.indexOf(x) === i; }).length, 'no duplicate receiving ids');
    ok(M.state().ho.some(function (h) { return h.kind === 'log1' && h.mf; }), 'manifest handovers recorded');
  });

  /* ----- NP-02 Weighing & Discrepancy ----- */
  add('np02', 'PR-05', L('Timbang otomatis: bersih = kotor − tara, banding estimasi, lanjut ke sorting (§8–§10)', 'Auto weighing: net = gross − tare, compared with the estimate, on to sorting (§8–§10)'), function (M) {
    var p = putu(M), s = M.readScale('RCV-2610-011');
    var r = yes(M.weigh(p, 'RCV-2610-011', { gross: s.gross, tare: s.tare, auto: true, items: { bathtowel: 30, sheet: 34 } }));
    eq(r.rcv.weigh.net, M.r1(s.gross - s.tare), 'net'); eq(r.rcv.stage, 'sort'); eq(r.rcv.pcs, 64, 'item count');
    ok(r.cmp.filter(function (x) { return x.k === 'kg'; })[0].st === 'ok', 'within tolerance');
    ok(M.auditLog({ rec: 'RCV-2610-011' }).some(function (e) { return e.ev === 'WEIGHT.RECORDED'; }), 'audited');
  });
  add('np02', 'PR-06', L('Berat manual butuh izin override + alasan (§9)', 'A manual weight needs override permission + a reason (§9)'), function (M) {
    var s = M.readScale('RCV-2610-011');
    no(M.weigh(putu(M), 'RCV-2610-011', { gross: s.gross + 0.6, tare: s.tare }), 'noperm', 'operator manual weight');
    no(M.weigh(spv(M), 'RCV-2610-011', { gross: s.gross + 0.6, tare: s.tare }), 'reason', 'supervisor without reason');
    var r = yes(M.weigh(spv(M), 'RCV-2610-011', { gross: s.gross + 0.6, tare: s.tare, reason: 'Timbangan SC-01 kalibrasi' }));
    ok(r.rcv.weigh.manual && r.rcv.weigh.manual.reason, 'manual flagged');
    ok(M.auditLog({ ev: 'WEIGHT.CHANGED' }).length === 1, 'WEIGHT.CHANGED audited');
  });
  add('np02', 'PR-07', L('Selisih berat ≥5% butuh alasan; ≥10% menahan sorting sampai supervisor memutuskan (§11)', 'Weight gap ≥5% needs a reason; ≥10% blocks sorting until the supervisor decides (§11)'), function (M) {
    var p = putu(M), s = spv(M);
    no(M.weigh(s, 'RCV-2610-011', { gross: 27, tare: 1, reason: 'manual' }), 'weightgap', 'gap without reason');
    var r = yes(M.weigh(s, 'RCV-2610-011', { gross: 27, tare: 1, reason: 'manual', disNote: 'Bag basah' })); eq(r.rcv.wdis.review, 'pending');
    no(M.sortDone(p, 'RCV-2610-011', { cats: { white: 26 } }), 'review', 'sorting blocked');
    yes(M.wdisReview(s, 'RCV-2610-011', 'approve', 'Linen basah, berat wajar'));
    yes(M.sortDone(p, 'RCV-2610-011', { cats: { white: 26 } }), 'sorting after decision');
  });

  /* ----- NP-03 Sorting ----- */
  add('np03', 'PR-08', L('Sorting: saran dari data klien, total = berat bersih, lot dibuat (§12–§14)', 'Sorting: suggestion from client data, total = net weight, lots created (§12–§14)'), function (M) {
    var r = M.rcv('RCV-2610-010'), sg = M.suggestSort(r), tot = 0; Object.keys(sg.cats).forEach(function (k) { tot += sg.cats[k]; });
    eq(sg.src, 'client', 'client rule'); ok(Math.abs(tot - r.weigh.net) < 0.05, 'suggestion sums to the net weight');
    var x = yes(M.sortDone(putu(M), 'RCV-2610-010', { cats: sg.cats, flags: ['noda'] }));
    ok(x.lots.length === Object.keys(sg.cats).length, 'one lot per category'); eq(x.rcv.stage, 'batch'); ok(x.rcv.sort.pre, 'pre-suggest kept');
    eq(x.lots.reduce(function (s0, l) { return s0 + l.pcs; }, 0), r.pcs, 'pieces split without loss');
  });
  add('np03', 'PR-09', L('Sorting ditolak bila total tidak cocok atau kosong; klien spa dipisah (§13)', 'Sorting refused when totals mismatch or are empty; spa clients kept separate (§13)'), function (M) {
    no(M.sortDone(putu(M), 'RCV-2610-010', { cats: {} }), 'cats', 'no category');
    no(M.sortDone(putu(M), 'RCV-2610-010', { cats: { white: 40 } }), 'total', 'total mismatch');
    ok(M.suggestSort(M.rcv('RCV-2610-013')).sep, 'spa client separate');
  });

  /* ----- NP-04 Batch & Planning ----- */
  add('np04', 'PR-10', L('Validasi kapasitas: mesin maintenance diblok, overload >110% diblok, 101–110% butuh supervisor (§16)', 'Capacity validation: machine in maintenance blocked, overload >110% blocked, 101–110% needs a supervisor (§16)'), function (M) {
    var r = M.rcv('RCV-2610-010'); yes(M.sortDone(putu(M), r.id, { cats: { towel: 64, white: M.r1(r.weigh.net - 64) } }));
    var lot = M.lotsOpen().filter(function (l) { return l.cat === 'towel'; })[0];
    ok(M.validate({ lots: [lot.id], mach: 'W-04', prog: 'P-TW' }).blocks.some(function (b) { return b[0] === 'unavail'; }), 'W-04 in maintenance');
    ok(M.validate({ lots: [lot.id], mach: 'W-03', prog: 'P-TW' }).blocks.some(function (b) { return b[0] === 'overload'; }), '68.6 kg on 30 kg blocked');
    var v = M.validate({ lots: [lot.id], mach: 'W-02', prog: 'P-TW' }); ok(v.util > 100 && v.util <= 110, 'util ' + v.util); ok(v.warns.some(function (w) { return w[2]; }), 'override warning');
    no(M.createBatch(putu(M), { lots: [lot.id], mach: 'W-02', prog: 'P-TW', reason: 'x' }), 'overload', 'operator overload');
    no(M.createBatch(putu(M), { lots: [lot.id], mach: 'W-03', prog: 'P-TW' }), 'overload', 'hard overload');
    var b = yes(M.createBatch(spv(M), { lots: [lot.id], mach: 'W-02', prog: 'P-TW', reason: 'Kejar SLA, disetujui' })).batch; ok(b.ovr, 'override recorded');
    ok(M.auditLog({ batch: b.id }).some(function (e) { return e.ev === 'SUPERVISOR.OVERRIDE'; }), 'override audited');
  });
  add('np04', 'PR-11', L('Batch dibuat dari lot: peringatan butuh alasan, lot tertaut, receiving selesai (§17)', 'Batch from lots: warnings need a reason, lots linked, receiving done (§17)'), function (M) {
    var p = putu(M), r = M.rcv('RCV-2610-010'); yes(M.sortDone(p, r.id, { cats: { white: 25, color: 15, towel: M.r1(r.weigh.net - 40) } }));
    var lots = M.lotsOpen(), w = lots.filter(function (l) { return l.cat === 'white'; })[0], c = lots.filter(function (l) { return l.cat === 'color'; })[0], t = lots.filter(function (l) { return l.cat === 'towel'; })[0];
    no(M.createBatch(p, { lots: [w.id, t.id], mach: 'W-02', prog: 'P-WL' }), 'reason', 'mixed categories without reason');
    var b = yes(M.createBatch(p, { lots: [t.id], mach: 'W-03', prog: 'P-TW' })).batch;
    eq(b.stage, 'ready'); eq(t.batch, b.id); ok(b.rcvs.indexOf(r.id) >= 0, 'linked to receiving'); ok(b.sla, 'SLA set');
    no(M.createBatch(p, { lots: [t.id], mach: 'W-02' }), 'lots', 'lot reused'); eq(M.rcv(r.id).stage, 'batch', 'lots still open');
    yes(M.createBatch(p, { lots: [w.id, c.id], mach: 'W-02', prog: 'P-WL', reason: 'Warna muda, aman dicampur' })); eq(M.rcv(r.id).stage, 'done');
  });
  add('np04', 'PR-12', L('Rekomendasi batch tidak mencampur klien spa dengan klien lain (§15)', 'Batch recommendation never mixes a spa client with other clients (§15)'), function (M) {
    var p = putu(M);
    var r = M.rcv('RCV-2610-010'); yes(M.sortDone(p, r.id, { cats: { towel: r.weigh.net } }));
    yes(M.rcvVerify(p, 'RCV-2610-013', { client: true, prop: true, bags: 3 })); yes(M.rcvAccept(p, 'RCV-2610-013'));
    var s = M.readScale('RCV-2610-013'); yes(M.weigh(p, 'RCV-2610-013', { gross: s.gross, tare: s.tare, auto: true }));
    yes(M.sortDone(p, 'RCV-2610-013', { cats: M.suggestSort(M.rcv('RCV-2610-013')).cats }));
    var rec = M.recommend(); ok(rec.length >= 2, 'groups');
    rec.forEach(function (g) { var cls = g.lots.map(function (id) { return M.lot(id).cl; }); if (cls.indexOf('CL-06') >= 0) ok(cls.every(function (c) { return c === 'CL-06'; }), 'spa client alone'); });
  });
  add('np04', 'PR-13', L('Ubah batch butuh alasan dan tidak bisa setelah proses mulai (§17)', 'Changing a batch needs a reason and is impossible once processing starts (§17)'), function (M) {
    no(M.changeBatch(putu(M), 'B-2610-011', { mach: 'W-01' }), 'reason', 'no reason');
    no(M.changeBatch(putu(M), 'B-2610-011', { mach: 'W-04', reason: 'x' }), 'unavail', 'machine in maintenance');
    yes(M.changeBatch(putu(M), 'B-2610-011', { prog: 'P-SP', mach: 'W-02', reason: 'Program spa' })); eq(M.batch('B-2610-011').changes, 1);
    no(M.changeBatch(spv(M), 'B-2610-008', { mach: 'W-02', reason: 'x' }), 'jump', 'already washing');
  });

  /* ----- Handovers (§43–§44) ----- */
  add('ho', 'PR-14', L('Handover 2: Team 1 KIRIM, Team 2 TERIMA; tim lain ditolak (§18, §43)', 'Handover 2: Team 1 sends, Team 2 accepts; other teams refused (§18, §43)'), function (M) {
    var s = yes(M.send(putu(M), 'B-2610-011')); eq(s.ho.kind, 't1t2'); eq(M.batch('B-2610-011').stage, 'ho12');
    no(M.accept(luh(M), s.ho.id), 'noperm', 'team 3 accepts handover 2');
    no(M.send(arta(M), 'B-2610-010'), 'jump', 'already sent');
    yes(M.accept(arta(M), s.ho.id)); eq(M.batch('B-2610-011').stage, 'wash_q'); eq(M.batch('B-2610-011').team, 't2');
    no(M.accept(arta(M), s.ho.id), 'jump', 'twice');
  });
  add('ho', 'PR-15', L('ADA SELISIH di handover: alasan + catatan, supervisor kembalikan / terima (§43)', 'Handover difference: reason + notes, supervisor returns / accepts (§43)'), function (M) {
    var h = M.hoOpen('t1t2', 'B-2610-010');
    no(M.hoDiff(arta(M), h.id, { qty: 90, note: 'x' }), 'reason', 'no reason');
    no(M.hoDiff(arta(M), h.id, { qty: 90, reason: 'count' }), 'note', 'no note');
    yes(M.hoDiff(arta(M), h.id, { qty: 90, reason: 'count', note: 'Hitung ulang 90 pcs' })); eq(M.ho(h.id).diff.qty, -6);
    ok(M.state().issues.some(function (i) { return i.ho === h.id; }), 'issue opened');
    no(M.hoResolve(arta(M), h.id, 'accept', 'ok'), 'noperm', 'team 2 resolves');
    yes(M.hoResolve(spv(M), h.id, 'return', 'Team 1 hitung ulang')); eq(M.batch('B-2610-010').stage, 'ready', 'back to team 1');
    ok(M.state().issues.filter(function (i) { return i.ho === h.id; }).every(function (i) { return i.st === 'resolved'; }), 'issue closed');
  });
  add('ho', 'PR-16', L('Handover 4: driver menerima paket, alur delivery Fase 7 lanjut (§42)', 'Handover 4: the driver accepts the packages, the Phase 7 delivery flow resumes (§42)'), function (M) {
    var h = M.hoOpen('t3log', 'B-2610-001'); ok(h, 'waiting handover 4');
    no(M.accept(arta(M), h.id), 'noperm', 'team 2');
    var r = yes(M.accept(ketut(M), h.id)); eq(M.batch('B-2610-001').stage, 'handed'); ok(r.delivery && r.delivery.order.id === 'ORD-2610-105', 'linked to the Phase 7 delivery order');
  });
  add('ho', 'PR-17', L('Timeline handover lengkap: Logistics → T1 → T2 → T3 → Logistics (§44)', 'Full handover timeline: Logistics → T1 → T2 → T3 → Logistics (§44)'), function (M) {
    var tl = M.hoTimeline('B-2610-001'); eq(tl.length, 4);
    ok(tl[0].ho && tl[1].ho && tl[2].ho && tl[3].ho, 'all four handovers present');
    eq(tl[1].ho.st, 'accepted'); eq(tl[3].ho.st, 'waiting');
  });

  /* ----- NP-05 Washing ----- */
  add('np05', 'PR-18', L('MULAI CUCI hanya di mesin tersedia; mesin jadi berjalan dengan perkiraan selesai (§20–§21)', 'MULAI CUCI only on an available machine; it runs with an expected finish (§20–§21)'), function (M) {
    var a = arta(M);
    no(M.startWash(a, 'B-2610-012', { mach: 'W-03' }), 'mach', 'W-03 busy');
    no(M.startWash(a, 'B-2610-012', { mach: 'W-04' }), 'mach', 'W-04 maintenance');
    no(M.startWash(putu(M), 'B-2610-012', { mach: 'W-02' }), 'noperm', 'team 1');
    var r = yes(M.startWash(a, 'B-2610-012', { mach: 'W-02' })); eq(M.machine('W-02').st, 'running'); eq(M.machine('W-02').batch, 'B-2610-012');
    ok(r.end > M.isoT(M.now()), 'expected finish in the future');
  });
  add('np05', 'PR-19', L('SELESAI CUCI melepas mesin, menambah siklus dan lanjut ke dryer (§21)', 'SELESAI CUCI frees the machine, adds a cycle and moves to drying (§21)'), function (M) {
    var c0 = M.machine('W-01').cycles; yes(M.finishWash(arta(M), 'B-2610-008'));
    eq(M.batch('B-2610-008').stage, 'dry_q'); eq(M.machine('W-01').batch, null); eq(M.machine('W-01').st, 'normal'); eq(M.machine('W-01').cycles, c0 + 1);
    no(M.finishWash(arta(M), 'B-2610-008'), 'jump', 'twice');
  });
  add('np05', 'PR-20', L('ADA MASALAH mesin berat membuka work order dan menghentikan batch (§22)', 'A serious machine issue opens a work order and interrupts the batch (§22)'), function (M) {
    no(M.reportIssue(arta(M), { stage: 'wash', type: 'mstop', sev: 'high', action: 'maint', batch: 'B-2610-008' }), 'note', 'no note');
    no(M.reportIssue(arta(M), { stage: 'wash', type: 'mstop', sev: 'crit', action: 'maint', batch: 'B-2610-008', note: 'Pintu error' }), 'photo', 'critical without photo');
    var r = yes(M.reportIssue(arta(M), { stage: 'wash', type: 'mstop', sev: 'high', action: 'maint', batch: 'B-2610-008', note: 'Pintu error E-12' }));
    ok(r.wo && r.wo.mach === 'W-01', 'work order'); eq(M.machine('W-01').st, 'error'); eq(M.batch('B-2610-008').stage, 'wash_q', 'back to queue');
    ok(M.state().dt.some(function (d) { return d.mach === 'W-01' && !d.end && d.kind === 'breakdown'; }), 'downtime started');
  });

  /* ----- NP-06 Drying ----- */
  add('np06', 'PR-21', L('MULAI KERING: dryer rusak/offline ditolak, dryer tersedia jalan, SELESAI KERING → siap finalisasi (§23–§26)', 'MULAI KERING: broken/offline dryers refused, an available dryer runs, SELESAI KERING → ready for finalization (§23–§26)'), function (M) {
    var a = arta(M);
    no(M.startDry(a, 'B-2610-007', { mach: 'D-03' }), 'mach', 'D-03 repair'); no(M.startDry(a, 'B-2610-007', { mach: 'D-05' }), 'mach', 'D-05 offline');
    yes(M.startDry(a, 'B-2610-007', { mach: 'D-01', prog: 'P-DHI' })); eq(M.machine('D-01').batch, 'B-2610-007');
    adv(40); yes(M.finishDry(a, 'B-2610-007')); eq(M.batch('B-2610-007').stage, 'fin_ready'); eq(M.machine('D-01').batch, null);
  });
  add('np06', 'PR-22', L('Metode jemur tanpa mesin memakai durasi standar (§24)', 'Air drying without a machine uses the standard duration (§24)'), function (M) {
    var r = yes(M.startDry(arta(M), 'B-2610-007', { method: 'air' })); eq(r.batch.run.mach, null); eq(r.batch.run.dur, 120);
  });

  /* ----- NP-07 Finishing ----- */
  add('np07', 'PR-23', L('SELESAI FINISHING kurang qty butuh catatan dan membuka masalah (§29–§31)', 'SELESAI FINISHING short of qty needs a note and opens an issue (§29–§31)'), function (M) {
    var l = luh(M);
    no(M.finProgress(l, 'B-2610-004', 999), 'qty', 'progress over total');
    yes(M.finProgress(l, 'B-2610-004', 100));
    no(M.finishFin(l, 'B-2610-004', { qty: 130 }), 'short', 'short without note');
    yes(M.finishFin(l, 'B-2610-004', { qty: 130, note: '4 sarung bantal sobek' })); eq(M.batch('B-2610-004').stage, 'qc_q'); eq(M.batch('B-2610-004').finQty, 130);
    ok(M.state().issues.some(function (i) { return i.batch === 'B-2610-004' && i.stage === 'fin'; }), 'issue');
    eq(M.machine('FL-01').batch, null, 'line freed');
  });
  add('np07', 'PR-24', L('Handover 3 lalu MULAI FINISHING hanya di line tersedia (§27–§28)', 'Handover 3 then MULAI FINISHING only on an available line (§27–§28)'), function (M) {
    var l = luh(M), h = M.hoOpen('t2t3', 'B-2610-005'); yes(M.accept(l, h.id)); eq(M.batch('B-2610-005').stage, 'fin_q');
    no(M.startFin(l, 'B-2610-005', { line: 'FL-01' }), 'mach', 'FL-01 busy');
    yes(M.startFin(l, 'B-2610-005', { line: 'FL-02' })); eq(M.batch('B-2610-005').stage, 'finishing');
  });

  /* ----- NP-08 QC & Rewash ----- */
  add('np08', 'PR-25', L('QC LULUS mengirim batch ke packing (§33)', 'QC LULUS sends the batch to packing (§33)'), function (M) {
    var r = yes(M.qcPass(luh(M), 'B-2610-003', { checks: ['clean', 'stain'] })); eq(r.batch.stage, 'pack_q'); eq(r.batch.qc.pass, 182);
    no(M.qcPass(putu(M), 'B-2610-003'), 'noperm', 'team 1 QC');
  });
  add('np08', 'PR-26', L('QC ADA MASALAH sebagian: batch rework terpisah, akar masalah ke Washing (§34–§36)', 'Partial QC issue: a separate rework batch, root cause to Washing (§34–§36)'), function (M) {
    var l = luh(M);
    no(M.qcFail(l, 'B-2610-003', { action: 'rewash', qty: 5, photo: PH }), 'reason', 'no reason');
    no(M.qcFail(l, 'B-2610-003', { reason: 'noda', qty: 5, photo: PH }), 'action', 'no action');
    no(M.qcFail(l, 'B-2610-003', { reason: 'noda', action: 'rewash', qty: 0, photo: PH }), 'qty', 'zero qty');
    no(M.qcFail(l, 'B-2610-003', { reason: 'noda', action: 'rewash', qty: 5 }), 'photo', 'no photo');
    var r = yes(M.qcFail(l, 'B-2610-003', { reason: 'noda', action: 'rewash', qty: 5, photo: PH }));
    eq(r.batch.stage, 'pack_q', 'good part goes on'); eq(r.batch.qc.pass, 177); eq(r.child.stage, 'wash_q'); eq(r.child.prog, 'P-RW'); eq(r.child.parent, 'B-2610-003');
    eq(r.rework.resp, 'wash'); ok(r.rework.timeMin > 0, 'time impact');
  });
  add('np08', 'PR-27', L('Belum kering → rework mulai dari dryer, akar masalah Drying (§35)', 'Not dry → rework starts at the dryer, root cause Drying (§35)'), function (M) {
    var r = yes(M.qcFail(luh(M), 'B-2610-003', { reason: 'kering', action: 'rewash', qty: 10, photo: PH })); eq(r.child.stage, 'dry_q'); eq(r.rework.resp, 'dry');
  });
  add('np08', 'PR-28', L('Klaim kerusakan menahan rekonsiliasi sampai supervisor memutuskan (§35, §39)', 'A damage claim holds reconciliation until the supervisor decides (§35, §39)'), function (M) {
    var l = luh(M), r = yes(M.qcFail(l, 'B-2610-003', { reason: 'rusak', action: 'claim', qty: 2, photo: PH, note: 'Sobek' }));
    eq(r.rework.st, 'claim'); ok(M.state().issues.some(function (i) { return i.rw === r.rework.id; }), 'issue for the claim');
    yes(M.pack(l, 'B-2610-003', { pkgs: 6 })); var rc = M.reconcile(M.batch('B-2610-003')); ok(!rc.ok, 'gap while claim pending');
    no(M.ready(l, 'B-2610-003'), 'reconcile', 'ready blocked');
    yes(M.rwDecide(spv(M), r.rework.id, 'claim', 'Klaim disetujui, ganti rugi')); ok(M.reconcile(M.batch('B-2610-003')).ok, 'reconciled after decision');
    yes(M.ready(l, 'B-2610-003'));
  });
  add('np08', 'PR-29', L('Rework B-012 lewat Team 2 & 3, LULUS QC, digabung ke B-002, rekonsiliasi cocok (§36–§39)', 'Rework B-012 through Teams 2 & 3, passes QC, merges into B-002, reconciliation matches (§36–§39)'), function (M) {
    var l = luh(M);
    ok(!M.reconcile(M.batch('B-2610-002')).ok, 'gap while rework open');
    var r = reworkThrough(M); ok(r.merged, 'merged'); eq(M.batch('B-2610-012').stage, 'merged'); eq(M.rw('RW-2610-01').st, 'closed');
    eq(M.batch('B-2610-002').qc.pass, 72); eq(M.batch('B-2610-002').qc.res, 'pass');
    yes(M.pack(l, 'B-2610-002', { pkgs: 4 })); ok(M.reconcile(M.batch('B-2610-002')).ok, 'reconciled'); yes(M.ready(l, 'B-2610-002'));
  });
  add('np08', 'PR-30', L('Akar masalah rework per tahap; riwayat tetap tersimpan (§36)', 'Rework root cause per stage; history kept (§36)'), function (M) {
    var rc0 = M.rootCause(); yes(M.qcFail(luh(M), 'B-2610-003', { reason: 'finishing', action: 'refinish', qty: 3, photo: PH }));
    var rc = M.rootCause(); eq(rc.total, rc0.total + 3); eq(rc.stage.fin, (rc0.stage.fin || 0) + 3); ok(rc.stage.wash > 0, 'history counted');
  });

  /* ----- NP-09 Packing & Ready to Deliver ----- */
  add('np09', 'PR-31', L('Barang gagal QC tidak boleh dipacking kecuali supervisor + alasan (§37)', 'Items that failed QC cannot be packed except by a supervisor with a reason (§37)'), function (M) {
    var l = luh(M); yes(M.qcFail(l, 'B-2610-003', { reason: 'rusak', action: 'claim', qty: 182, photo: PH, note: 'Kena cat' }));
    eq(M.batch('B-2610-003').stage, 'pack_q');
    no(M.pack(l, 'B-2610-003', { pkgs: 4 }), 'qc', 'failed QC');
    no(M.pack(spv(M), 'B-2610-003', { pkgs: 4 }), 'reason', 'supervisor without reason');
    var r = yes(M.pack(spv(M), 'B-2610-003', { pkgs: 4, reason: 'Klien minta kirim apa adanya' })); ok(r.batch.pack.ovr, 'override kept');
  });
  add('np09', 'PR-32', L('Siap Kirim diblok selama rework terbuka; supervisor bisa override dengan alasan (§39)', 'Ready to Deliver blocked while rework is open; a supervisor can override with a reason (§39)'), function (M) {
    var l = luh(M); yes(M.pack(l, 'B-2610-002', { pkgs: 4 })); eq(M.packedQty(M.batch('B-2610-002')), 68);
    var x = M.ready(l, 'B-2610-002'); no(x, 'reconcile', 'team 3'); ok(x.rec.gaps.length > 0, 'gap listed');
    no(M.ready(spv(M), 'B-2610-002'), 'reason', 'no reason');
    yes(M.ready(spv(M), 'B-2610-002', { reason: 'Klien setuju kirim 68, 4 menyusul' })); ok(M.batch('B-2610-002').recOvr, 'override kept');
  });
  add('np09', 'PR-33', L('Label paket: klien, property, order, nomor paket, QR (§38)', 'Package label: client, property, order, package number, QR (§38)'), function (M) {
    var b = M.batch('B-2610-001'), lb = M.label(b, b.pack.pkgs[0]);
    eq(lb.n, 1); eq(lb.of, b.pack.pkgs.length); eq(lb.ord, 'ORD-2610-105'); ok(lb.qr.indexOf(b.pack.pkgs[0].id) > 0 && lb.qr.indexOf(b.id) > 0, 'QR carries package and batch');
    ok(lb.cl && lb.cl !== b.cl, 'client name resolved');
  });
  add('np09', 'PR-34', L('Siap Kirim → SERAHKAN KE LOGISTICS membuat Handover 4 (§40–§41)', 'Ready to Deliver → SERAHKAN KE LOGISTICS creates Handover 4 (§40–§41)'), function (M) {
    var l = luh(M); yes(M.qcPass(l, 'B-2610-003')); yes(M.pack(l, 'B-2610-003', { pkgs: 6 }));
    no(M.send(l, 'B-2610-003'), 'jump', 'send before Siap Kirim');
    yes(M.ready(l, 'B-2610-003')); var s = yes(M.send(l, 'B-2610-003')); eq(s.ho.kind, 't3log'); eq(s.ho.bags, 6); eq(M.batch('B-2610-003').stage, 'ho3l');
    var r = yes(M.accept(ketut(M), s.ho.id)); ok(r.delivery && r.delivery.order, 'Phase 7 delivery order');
  });

  /* ----- NP-10 Supervisor, Command Center, KPI ----- */
  add('np10', 'PR-35', L('Supervisor tahan & lanjutkan batch berjalan; operator tidak bisa (§51)', 'Supervisor holds & resumes a running batch; operators cannot (§51)'), function (M) {
    no(M.spvHold(arta(M), 'B-2610-006', 'x'), 'noperm', 'operator hold');
    no(M.spvHold(spv(M), 'B-2610-006', ''), 'reason', 'no reason');
    yes(M.spvHold(spv(M), 'B-2610-006', 'Cek suhu dryer')); var b = M.batch('B-2610-006'); eq(b.stage, 'hold'); eq(b.hold.prev, 'dry_q'); eq(M.machine('D-02').batch, null);
    no(M.startDry(arta(M), 'B-2610-006', { mach: 'D-01' }), 'hold', 'work on hold');
    yes(M.spvResume(spv(M), 'B-2610-006', 'Aman')); eq(M.batch('B-2610-006').stage, 'dry_q');
  });
  add('np10', 'PR-36', L('Prioritas, pindah staf dan eskalasi tercatat dengan alasan (§51)', 'Priority, staff moves and escalation are logged with a reason (§51)'), function (M) {
    var s = spv(M);
    no(M.spvPrioritize(s, 'B-2610-007', 'urgent', ''), 'reason', 'no reason'); yes(M.spvPrioritize(s, 'B-2610-007', 'urgent', 'Check-in rombongan'));
    var f0 = M.capacity().fin.cap; yes(M.spvStaff(s, 'EMP-001', 't3', 'Bantu finishing')); ok(M.onShift('t3').indexOf('EMP-001') >= 0, 'moved'); ok(M.capacity().fin.cap > f0, 'finishing capacity up');
    yes(M.spvEscalate(s, 'B-2610-002', 'SLA Jaens')); ok(M.state().notes.some(function (n) { return n.ref === 'B-2610-002'; }), 'ops manager notified');
    ['SPV.PRIORITIZE', 'SPV.ASSIGN_STAFF', 'SPV.ESCALATE'].forEach(function (e) { ok(M.auditLog({ ev: e }).length === 1, e); });
  });
  add('np10', 'PR-37', L('Daftar masalah sesuai tim; supervisor melihat semua (§85)', 'Issue list by team; the supervisor sees everything (§85)'), function (M) {
    ok(M.issueList(putu(M)).every(function (i) { return i.team === 't1'; }), 'team 1 only');
    ok(M.issueList(spv(M)).length >= M.issueList(luh(M)).length, 'supervisor sees all');
    no(M.resolveIssue(luh(M), 'PI-2610-02', 'ok'), 'noperm', 'operator resolves');
    yes(M.resolveIssue(spv(M), 'PI-2610-02', 'Staf tambahan datang')); eq(M.issue('PI-2610-02').st, 'resolved');
  });
  add('np10', 'PR-38', L('Command center: 8 lajur, kapasitas finishing kritis, bottleneck terdeteksi (§47–§50)', 'Command center: 8 lanes, finishing capacity critical, bottlenecks detected (§47–§50)'), function (M) {
    var bd = M.board(); eq(bd.length, 8); eq(bd[0].k, 'rcv'); eq(bd[7].k, 'rtd');
    var cap = M.capacity(); ok(cap.fin.pct >= 85, 'finishing ' + cap.fin.pct + '%');
    var ins = M.insights(), fin = ins.filter(function (x) { return x.k === 'util' && x.stage === 'fin'; })[0];
    ok(fin && fin.growth >= 20, 'finishing queue growth'); ok(ins.some(function (x) { return x.k === 'down' && x.mach === 'D-03'; }), 'D-03 down');
    ok(ins.some(function (x) { return x.k === 'staff' && x.team === 't3'; }), 'team 3 short'); ok(ins.some(function (x) { return x.k === 'sla'; }), 'SLA risk');
  });
  add('np10', 'PR-39', L('SLA: B-002 berisiko / terlambat dan tampil di KPI atas (§45)', 'SLA: B-002 at risk / late and shown in the top KPIs (§45)'), function (M) {
    ok(['risk', 'late'].indexOf(M.slaState(M.batch('B-2610-002'))) >= 0, 'B-002 SLA');
    var t = M.top(); ok(t.risk + t.late >= 1, 'top KPI'); ok(t.rework >= 1, 'open rework');
    eq(M.slaState(M.batch('B-2610-001')), 'ok', 'handover waiting, done in time');
  });
  add('np10', 'PR-40', L('Telusur batch: receiving → batch → mesin → QC → rework → packing + 4 handover (§83)', 'Batch trace: receiving → batch → machines → QC → rework → packing + 4 handovers (§83)'), function (M) {
    var t = M.trace('B-2610-002'), ks = t.rows.map(function (r) { return r.k; });
    ['rcv', 'batch', 'wash', 'dry', 'fin', 'qc', 'rework'].forEach(function (k) { ok(ks.indexOf(k) >= 0, 'has ' + k); });
    eq(t.kids[0].id, 'B-2610-012'); ok(t.machines.length >= 2, 'machines'); eq(t.ho.length, 4);
    for (var i = 1; i < t.rows.length; i++) ok(M.ms(t.rows[i].at) >= M.ms(t.rows[i - 1].at), 'chronological');
    eq(M.trace('NOPE'), null);
  });
  add('np10', 'PR-41', L('KPI produksi otomatis dan aliran ke Ambidex / Fase 5 (§52–§53)', 'Automatic production KPI and the feed into Ambidex / Phase 5 (§52–§53)'), function (M) {
    var k = M.kpi(); ['kg', 'perOp', 'perHour', 'machUtil', 'capUtil', 'qcPass', 'rewash', 'downMin', 'batchAcc', 'hoAcc'].forEach(function (x) { ok(typeof k.today[x] === 'number', 'today.' + x); });
    ok(k.d30.kg > 1000 && k.d30.qcPass > 90, '30-day baseline'); eq(M.ambidex().length, 9);
    var P = { D: { PEOPLE: [{ id: 'EMP-071', role: 'prod', ind: [0, 0, 0, 0, 0] }, { id: 'EMP-070', role: 'qc', ind: [0, 0, 0, 0, 0] }, { id: 'EMP-001', role: 'rcv', ind: [0, 0, 0, 0, 0] }], TEAMS: [{ kpis: [{ code: 'T-QC-02', actual: 0 }] }] } };
    eq(M.perfFeed(P), 3, 'three people fed'); ok(P.D.PEOPLE[0].ind[0] > 0 && P.D.PEOPLE[0].src8, 'personal line computed'); ok(P.D.TEAMS[0].kpis[0].src8, 'team KPI fed');
  });
  add('np10', 'PR-42', L('Data live hanya bila segar; data lama tidak ditampilkan sebagai real-time (§89)', 'Live only when fresh; stale data is never shown as real-time (§89)'), function (M) {
    var t = M.tick(); ok(M.fresh(t).live, 'fresh'); adv(2); ok(!M.fresh(t).live, 'stale after 2 minutes'); eq(M.fresh(t).age, 120);
  });

  /* ----- NP-11 Daily Checklist ----- */
  add('np11', 'PR-43', L('Tab checklist sesuai tim; tim lain tidak bisa membuka (§55, §85)', 'Checklist tabs by team; other teams cannot open them (§55, §85)'), function (M) {
    eq(M.chkTabsFor(putu(M)).join(','), 'opening,t1,closing'); eq(M.chkToday(putu(M), 't2'), null, 'team 2 tab hidden');
    eq(M.chkTabsFor(spv(M)).length, 6); var c = tab(M, 'TPL-T2');
    no(M.chkDo(putu(M), c.id, 'T2-03'), 'team', 'team 1 does team 2 item');
  });
  add('np11', 'PR-44', L('SELESAI per tipe input: angka di luar batas, pilihan buruk, foto wajib (§58–§60)', 'SELESAI per input type: number out of range, bad option, photo required (§58–§60)'), function (M) {
    var l = luh(M), c = tab(M, 'TPL-T3');
    no(M.chkDo(l, c.id, 'T3-01', { val: 205 }), 'range', 'out of range'); no(M.chkDo(l, c.id, 'T3-01', { val: '' }), 'val', 'empty');
    yes(M.chkDo(l, c.id, 'T3-01', { val: '172' })); eq(M.state().chk.filter(function (x) { return x.id === c.id; })[0].items[0].val, 172);
    no(M.chkDo(l, c.id, 'T3-03', { val: 'low' }), 'badopt', 'low stock must be an issue');
    var w = tab(M, 'TPL-T2W'); no(M.chkDo(arta(M), w.id, 'T2W-01'), 'photo', 'photo required'); yes(M.chkDo(arta(M), w.id, 'T2W-01', { photo: PH }));
  });
  add('np11', 'PR-45', L('ADA MASALAH di checklist: catatan + tindak lanjut; maintenance membuat work order (§61)', 'Checklist issue: note + follow-up; maintenance creates a work order (§61)'), function (M) {
    var l = luh(M), c = tab(M, 'TPL-T3');
    no(M.chkIssue(l, c.id, 'T3-01', { follow: 'maint' }), 'note', 'no note'); no(M.chkIssue(l, c.id, 'T3-01', { note: 'x' }), 'follow', 'no follow-up');
    var r = yes(M.chkIssue(l, c.id, 'T3-01', { note: 'Suhu hanya 130 °C', follow: 'maint', val: 130 })); ok(/^WO-/.test(r.follow), 'work order'); eq(M.wo(r.follow).mach, 'FL-01');
    var r2 = yes(M.chkIssue(l, c.id, 'T3-03', { note: 'Plastik tinggal 1 roll', follow: 'followup' })); ok(/^PI-/.test(r2.follow), 'issue');
  });
  add('np11', 'PR-46', L('Kirim checklist ditolak bila item wajib belum selesai (§60)', 'Submitting a checklist is refused while mandatory items are open (§60)'), function (M) {
    var p = putu(M), c = tab(M, 'TPL-T1'); yes(M.chkSubmit(p, c.id)); eq(M.chkInst(c.id).st, 'done', 'optional photo item skipped');
    var t2 = tab(M, 'TPL-T2'), r = M.chkSubmit(arta(M), t2.id); no(r, 'missing', 'two items open'); eq(r.missing.length, 2);
  });
  add('np11', 'PR-47', L('Opening/Closing: operator → team leader → supervisor approve (§62)', 'Opening/Closing: operator → team leader → supervisor approves (§62)'), function (M) {
    var o = tab(M, 'TPL-OPN'); eq(o.st, 'lead_ok');
    no(M.chkApprove(putu(M), o.id), 'noperm', 'team leader approves');
    yes(M.chkApprove(spv(M), o.id, 'Opening OK')); eq(M.chkInst(o.id).st, 'approved'); ok(M.chkInst(o.id).items.filter(function (i) { return i.code === 'OPN-10'; })[0].st === 'done', 'approval item');
    var c = tab(M, 'TPL-CLS'), p = putu(M);
    ['CLS-01', 'CLS-02', 'CLS-03', 'CLS-05'].forEach(function (k) { yes(M.chkDo(p, c.id, k), k); }); yes(M.chkDo(p, c.id, 'CLS-04', { photo: PH })); yes(M.chkDo(p, c.id, 'CLS-06', { note: 'Aman' }));
    yes(M.chkSubmit(p, c.id)); no(M.chkApprove(spv(M), c.id), 'jump', 'before team leader');
    yes(M.chkLead(p, c.id)); yes(M.chkApprove(spv(M), c.id)); eq(M.chkInst(c.id).st, 'approved');
  });
  add('np11', 'PR-48', L('RETURN ITEM: supervisor mengembalikan item dengan catatan; nilai lama tersimpan (§62)', 'RETURN ITEM: the supervisor returns an item with a note; the old value is kept (§62)'), function (M) {
    var o = tab(M, 'TPL-OPN'); no(M.chkReturn(spv(M), o.id, 'OPN-02', ''), 'reason', 'no note');
    yes(M.chkReturn(spv(M), o.id, 'OPN-02', 'Foto manometer kurang jelas')); var c = M.chkInst(o.id), it = c.items.filter(function (i) { return i.code === 'OPN-02'; })[0];
    eq(c.st, 'returned'); eq(it.st, 'pending'); eq(it.ret.prev, 2.4);
    yes(M.chkDo(putu(M), o.id, 'OPN-02', { val: 2.5 })); yes(M.chkSubmit(putu(M), o.id)); eq(M.chkInst(o.id).st, 'submitted');
  });
  add('np11', 'PR-49', L('Versi template: draft baru, terbit dengan tanggal berlaku, riwayat lama tetap di versi lama (§63)', 'Template versions: new draft, published with an effective date, old records stay on the old version (§63)'), function (M) {
    var t = M.tpl('TPL-T1'); eq(tab(M, 'TPL-T1').v, 1);
    no(M.tplSaveItem(putu(M), 'TPL-T1', { n: 'x', type: 'check' }), 'noperm', 'operator edits master');
    var r = yes(M.tplSaveItem(spv(M), 'TPL-T1', { n: 'Cek stok kantong laundry', type: 'check', cat: 'stock', area: 'rcv' })); eq(r.draft.v, 2); eq(M.tplLatest(t).v, 1, 'published unchanged');
    no(M.tplSaveItem(spv(M), 'TPL-T1', { n: 'Suhu', type: 'num', min: 5, max: 1 }), 'range', 'bad range');
    no(M.tplPublish(spv(M), 'TPL-T1', M.TODAY), 'eff', 'effective today');
    yes(M.tplPublish(spv(M), 'TPL-T1', M.addDays(M.TODAY, 1), 'Tambah cek kantong'));
    eq(t.versions[0].until, M.TODAY, 'v1 ends today'); eq(M.verAt(t, M.addDays(M.TODAY, 1)).v, 2); eq(tab(M, 'TPL-T1').v, 1, 'today keeps v1');
    eq(M.verAt(M.tpl('TPL-OPN'), '2026-11-01').v, 2, 'opening v2 from November');
  });
  add('np11', 'PR-50', L('Checklist mingguan / bulanan muncul di hari jadwalnya; template baru (§57)', 'Weekly / monthly checklists appear on their day; new template (§57)'), function (M) {
    ok(tab(M, 'TPL-T2W'), 'weekly on Tuesday'); ok(tab(M, 'TPL-T1M'), 'monthly on the 6th');
    M.genChecklists('2026-10-07'); ok(!M.state().chk.some(function (c) { return c.date === '2026-10-07' && c.tpl === 'TPL-T2W'; }), 'no weekly on Wednesday');
    var r = yes(M.tplNew(spv(M), { n: 'Cek APAR', kind: 'monthly', tab: 'opening' })); ok(r.tpl.versions[0].draft, 'starts as draft');
  });
  add('np11', 'PR-51', L('KPI checklist: opening, closing, tepat waktu, kepatuhan, peralatan (§64)', 'Checklist KPI: opening, closing, on time, compliance, equipment (§64)'), function (M) {
    var k = M.chkKpi(); ['opening30', 'closing30', 'ontime', 'equip', 'compliance'].forEach(function (x) { ok(k[x] > 0 && k[x] <= 100, x + ' ' + k[x]); });
    ok(k.today.issue >= 1, 'today issue counted');
  });

  /* ----- NP-12 Maintenance ----- */
  add('np12', 'PR-52', L('Status tugas & pengingat H-7/H-3/H-1/hari ini/terlambat (§67, §72)', 'Task status & reminders D-7/D-3/D-1/today/overdue (§67, §72)'), function (M) {
    var d = M.mntDash(); ok(d.dueToday >= 1 && d.overdue >= 1, 'due today and overdue');
    var t = M.tasks({ mach: 'D-02' }).filter(function (x) { return x.freq === 'monthly'; })[0]; eq(M.taskSt(t), 'overdue'); eq(M.remLevel(t), 'overdue');
    var lv = M.reminders().map(function (x) { return x.lv; }); ok(lv.indexOf('today') >= 0 && lv.indexOf('h1') >= 0, 'reminder levels');
  });
  add('np12', 'PR-53', L('Kerjakan maintenance: mesin berhenti, SOP dicek, selesai menjadwalkan berikutnya (§69–§71)', 'Do maintenance: the machine stops, SOP checked, completion schedules the next (§69–§71)'), function (M) {
    var o = oka(M), t = M.tasks({ mach: 'IR-02' }).filter(function (x) { return x.freq === 'weekly' && x.st === 'scheduled'; })[0];
    no(M.mntStart(arta(M), t.id), 'noperm', 'operator'); yes(M.mntStart(o, t.id)); eq(M.machine('IR-02').st, 'maintenance');
    no(M.mntComplete(o, t.id), 'open', 'steps unchecked');
    var items = {}; t.items.forEach(function (it) { items[it.code] = { ok: true }; });
    var r = yes(M.mntComplete(o, t.id, { items: items, notes: 'Bersih' })); eq(r.task.result, 'ok'); eq(M.machine('IR-02').st, 'normal');
    var nxt = M.tasks({ mach: 'IR-02' }).filter(function (x) { return x.freq === 'weekly' && x.st === 'scheduled'; })[0]; eq(nxt.date, M.addDays(M.TODAY, 7));
    ok(M.downtime({ mach: 'IR-02' }).every(function (d) { return d.end; }), 'planned downtime closed');
  });
  add('np12', 'PR-54', L('Riwayat maintenance tidak bisa ditimpa; langkah gagal membuka work order (§73)', 'Maintenance history cannot be overwritten; a failed step opens a work order (§73)'), function (M) {
    var o = oka(M), t = M.tasks({ mach: 'IR-02' }).filter(function (x) { return x.freq === 'weekly' && x.st === 'scheduled'; })[0]; yes(M.mntStart(o, t.id));
    var items = {}; t.items.forEach(function (it, i) { items[it.code] = { ok: i !== 0 }; });
    no(M.mntComplete(o, t.id, { items: items }), 'note', 'failed step without note');
    var r = yes(M.mntComplete(o, t.id, { items: items, notes: 'Elemen pemanas lemah' })); ok(r.wo, 'work order'); eq(r.task.result, 'issue');
    var h = M.history('IR-02')[0]; eq(h.task, t.id); t.notes = 'diubah'; t.items[0].ok = true; eq(M.history('IR-02')[0].notes, 'Elemen pemanas lemah', 'history unchanged'); eq(M.history('IR-02')[0].items[0].ok, false);
  });
  add('np12', 'PR-55', L('Work order: perbaikan → tes → verifikasi supervisor → siap pakai (§74–§75)', 'Work order: repair → test → supervisor verification → ready for service (§74–§75)'), function (M) {
    var o = oka(M), s = spv(M), id = 'WO-2610-01';
    no(M.woFinish(o, id, {}), 'note', 'no repair note'); yes(M.woFinish(o, id, { notes: 'Ganti sensor suhu', parts: 'Sensor NTC' }));
    yes(M.woTest(o, id, { result: 'fail', note: 'Masih panas' })); eq(M.wo(id).st, 'repair'); yes(M.woFinish(o, id, { notes: 'Kalibrasi ulang' })); yes(M.woTest(o, id, { result: 'pass' }));
    no(M.woVerify(o, id), 'noperm', 'technician verifies own work'); no(M.setMachine(s, 'D-03', 'normal', 'x'), 'wo', 'status before verification');
    yes(M.woVerify(s, id, 'Tes 1 siklus OK')); eq(M.machine('D-03').st, 'normal'); eq(M.issue('PI-2610-01').st, 'resolved');
    ok(M.downtime({ mach: 'D-03' }).every(function (d) { return d.end; }), 'downtime closed');
  });
  add('np12', 'PR-56', L('Jadwal ulang perlu alasan dan tidak ke masa lalu; status mesin dengan alasan (§68, §76)', 'Rescheduling needs a reason and no past dates; machine status with a reason (§68, §76)'), function (M) {
    var p = M.plan('PM-W-04-monthly'), o = oka(M);
    no(M.planSet(o, p.id, { next: M.addDays(M.TODAY, -1), reason: 'x' }), 'date', 'past'); no(M.planSet(o, p.id, { next: M.addDays(M.TODAY, 2) }), 'reason', 'no reason');
    yes(M.planSet(o, p.id, { next: M.addDays(M.TODAY, 2), reason: 'Tunggu sparepart' })); eq(M.plan(p.id).next, M.addDays(M.TODAY, 2));
    no(M.planSet(luh(M), p.id, { next: M.addDays(M.TODAY, 3), reason: 'x' }), 'noperm', 'operator');
    no(M.setMachine(o, 'W-01', 'offline', 'x'), 'busy', 'machine in use'); yes(M.setMachine(o, 'D-05', 'normal', 'Listrik kembali'));
  });
  add('np12', 'PR-57', L('Metrik maintenance, detail mesin dan kalender 30 hari (§68, §77–§78)', 'Maintenance metrics, machine detail and 30-day calendar (§68, §77–§78)'), function (M) {
    var m = M.mntMetrics(); ok(m.avail > 90 && m.avail <= 100, 'availability'); ok(m.completion > 0, 'PM completion'); ok(m.breakdown >= 1, 'breakdown counted');
    var d = M.machineDetail('W-01'); ok(d.sop.length >= 5 && d.plans.length >= 2 && d.hist.length > 0, 'detail'); eq(M.machineDetail('NOPE'), null);
    var cal = M.calendar(M.TODAY, 30); ok(cal.some(function (x) { return x.plan.freq === 'monthly'; }), 'monthly in calendar');
    ok(!cal.some(function (x) { return x.plan.freq === 'daily'; }), 'daily hidden in month view');
  });

  /* ----- Security, screens, install ----- */
  add('sec', 'PR-58', L('Isolasi tim: setiap tim hanya bisa langkahnya sendiri; owner hanya melihat (§3, §85)', 'Team isolation: each team only does its own steps; the owner only views (§3, §85)'), function (M) {
    no(M.startWash(luh(M), 'B-2610-012', { mach: 'W-02' }), 'noperm', 'team 3 washes');
    no(M.sortDone(arta(M), 'RCV-2610-010', { cats: { towel: 68.6 } }), 'noperm', 'team 2 sorts');
    no(M.createBatch(luh(M), { lots: [] }), 'noperm', 'team 3 batches');
    no(M.qcPass(own(M), 'B-2610-003'), 'noperm', 'owner QC'); no(M.pack(arta(M), 'B-2610-002', { pkgs: 1 }), 'noperm', 'team 2 packs');
    eq(M.teamOf(putu(M)), 't1'); eq(M.teamOf(spv(M)), 'all'); eq(M.teamOf(oka(M)), 'mnt'); eq(M.teamOf(ketut(M)), 'log');
  });
  add('sec', 'PR-59', L('Layar §86 lengkap dan home per tim berisi angka (§4, §86)', '§86 screens complete and team homes carry counts (§4, §86)'), function (M) {
    eq(M.SCREENS.length, 44);
    ['PROD-RCV-001', 'PROD-RCV-002', 'PROD-WGT-001', 'PROD-DIS-001', 'PROD-SORT-001', 'PROD-SORT-002', 'PROD-BATCH-001', 'PROD-HO-001', 'PROD-WASH-001', 'PROD-WASH-002', 'PROD-DRY-001', 'PROD-DRY-002', 'PROD-HO-002',
      'PROD-FIN-001', 'PROD-FIN-002', 'PROD-QC-001', 'PROD-QC-002', 'PROD-REWASH-001', 'PROD-PACK-001', 'PROD-PACK-002', 'PROD-READY-001', 'PROD-HO-003', 'PROD-CMD-001', 'PROD-CAP-001', 'PROD-MACH-001', 'PROD-ISSUE-001',
      'CHK-001', 'CHK-002', 'CHK-003', 'CHK-004', 'CHK-005', 'MNT-001', 'MNT-002', 'MNT-003', 'MNT-004', 'MNT-005', 'MNT-006'].forEach(function (id) { ok(M.screen(id), id); });
    var h1 = M.home('t1'), h2 = M.home('t2'), h3 = M.home('t3'); ok(h1.diff >= 1 && h1.sort >= 1, 'team 1'); ok(h2.washing >= 2 && h2.hoIn >= 1, 'team 2'); ok(h3.rework >= 1 && h3.hoIn >= 1, 'team 3');
  });
  add('sec', 'PR-60', L('install() menambah izin, 4 peran, menu dan layar; aman dipanggil dua kali', 'install() adds permissions, 4 roles, menus and screens; safe to call twice'), function (M) {
    var C = { PERMS: {}, ROLES: { supervisor: { perms: [], nav: [] }, owner: { perms: [], nav: [] }, driver: { perms: [], nav: [] } }, ROLE_ORDER: ['supervisor', 'owner'], screen: function () { return null; } };
    var X = { ROLES: {}, EMPLOYEES: [], USERS: [], DEMO: [], employee: function (id) { return X.EMPLOYEES.filter(function (e) { return e.id === id; })[0]; }, user: function (id) { return X.USERS.filter(function (u) { return u.id === id; })[0]; } };
    M.install(C, X); M.install(C, X);
    ok(C.PERMS['prod.t1'] && C.PERMS['mnt.verify'], 'perms'); ['prod1', 'prod2', 'prod3', 'maint'].forEach(function (r) { ok(C.ROLES[r] && X.ROLES[r], r); });
    eq(C.ROLE_ORDER.indexOf('owner'), C.ROLE_ORDER.length - 1, 'new roles before owner'); eq(X.USERS.length, 4); eq(C.screen('PROD-CMD-001').id, 'PROD-CMD-001');
    eq(C.ROLES.supervisor.nav.length, 2); ok(C.ROLES.driver.nav.some(function (n) { return n.s === 'PROD-HO-003'; }), 'driver pickup at plant');
    ok(C.ROLES.supervisor.perms.indexOf('prod.spv') >= 0 && C.ROLES.supervisor.perms.indexOf('mnt.do') < 0, 'supervisor perms');
  });

  function run(M) {
    return T.map(function (c) {
      NOW = M.ms('2026-10-06 10:30'); M._setClock(function () { return NOW; });
      if (M.LG && M.LG._setClock) { M.LG._setClock(function () { return NOW; }); M.LG._reset(); }
      M._reset();
      try { c.fn(M); return { group: c.group, id: c.id, n: c.n, ok: true }; } catch (e) { return { group: c.group, id: c.id, n: c.n, ok: false, err: e.message }; }
    });
  }
  var API = { cases: T, run: function (M) {
    var real = M.ms(M.D.simNow), t0 = Date.now(), r = run(M), clk = function () { return real + (Date.now() - t0); };
    M._setClock(clk); M._reset(); if (M.LG && M.LG._setClock) { M.LG._setClock(clk); M.LG._reset(); } return r;
  } };
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
  else root.JFPROD_TESTS = API;
})(typeof window !== 'undefined' ? window : this);
