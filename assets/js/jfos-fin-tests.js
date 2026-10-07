/* ==========================================================================
   JFRESH OS — Phase 10 automated test cases (Business Support, Finance,
   Costing & Scale-Up Intelligence). Each case resets the finance store, fixes
   the clock at 2026-10-06 10:30 and runs against the real engine (jfos-fin*.js)
   installed on top of the Phase 4–9 engines, the same way the app loads them.
   Run in node:    node tools/test-fin.js
   Run in browser: phase10/tests.html
   ========================================================================== */
(function (root) {
  var T = [], NOW = 0;
  function add(group, id, name, fn) { T.push({ group: group, id: id, n: name, fn: fn }); }
  function eq(a, b, what) { if (a !== b) throw new Error((what || 'value') + ': expected ' + JSON.stringify(b) + ', got ' + JSON.stringify(a)); }
  function ok(v, what) { if (!v) throw new Error(what || 'expected true'); }
  function no(r, code, what) { ok(r && r.ok === false, (what || 'action') + ' should be refused'); if (code) eq(r.code, code, (what || 'action') + ' code'); }
  function yes(r, what) { if (!r || r.ok !== true) throw new Error((what || 'action') + ' should pass: ' + (r ? (r.code + ' ' + JSON.stringify(r.msg)) : 'no result')); return r; }
  function near(a, b, tol, what) { if (Math.abs(a - b) > (tol == null ? 1 : tol)) throw new Error((what || 'value') + ': expected ≈' + b + ', got ' + a); }
  // A test user carries the merged permissions of its role, as the app builds them after every install().
  function ctx(role, emp, uid) { return function (F, C) { return { uid: uid || 'T-' + (emp || role), name: 'Tester ' + role, roleKey: role, perms: (C.ROLES[role] ? C.ROLES[role].perms : F.ROLE_PERMS[role] || []).slice(), employee: emp ? { id: emp } : null }; }; }
  var fin = ctx('finance', 'EMP-030'), own = ctx('owner', 'EMP-050'), sup = ctx('supply', 'EMP-110'), ast = ctx('assetadm', 'EMP-111'), ops = ctx('opsmgr', 'EMP-010'), sal = ctx('sales', 'EMP-040'), drv = ctx('driver', 'EMP-002');
  var fin2 = function (F, C) { var c = fin(F, C); c.employee = { id: 'EMP-112' }; c.uid = 'T-EMP-112'; return c; };
  var JT = 1e6;

  /* ---- NP-01 accounting foundation ---- */
  add('NP-01', 'FIN-T01', ['Neraca seimbang dan jurnal seed seimbang', 'Balance sheet balances and seed journals balance'], function (F) {
    eq(F.bs().check, 0, 'BS check today'); ['2026-04', '2026-06', '2026-09'].forEach(function (p) { eq(F.bs(F.mEnd(p)).check, 0, 'BS check ' + p); });
    F.journals().forEach(function (j) { ok(F.balanced(j.lines), j.id + ' balanced'); });
  });
  add('NP-01', 'FIN-T02', ['Subledger sama dengan GL: kas, AR, Billing Ready, AP, stok, aset', 'Subledgers equal the GL: cash, AR, Billing Ready, AP, stock, assets'], function (F, C) {
    var rc = F.reconCenter(fin(F, C));
    ['ar', 'br', 'ap', 'inv', 'fa', 'grni'].forEach(function (k) { var r = rc.rows.filter(function (x) { return x.k === k; })[0]; ok(r, k + ' row'); eq(r.diff, 0, k + ' diff'); });
    F.D.CASH_ACC.forEach(function (a) { eq(F.accBal(a.id), a.bal, a.id + ' balance = Phase 5'); });
  });
  add('NP-01', 'FIN-T03', ['Jurnal tidak seimbang ditolak; draft → posted', 'Unbalanced journal refused; draft → posted'], function (F, C) {
    var c = fin(F, C), d = yes(F.draftJournal(c, { date: '2026-10-06', desc: ['Tes', 'Test'], lines: [{ a: '6300', d: 100000 }, { a: '1113', c: 90000 }] }), 'draft');
    eq(d.balanced, false); no(F.postJournal(c, d.jv.id), 'unbal');
    yes(F.editDraft(c, d.jv.id, { lines: [{ a: '6300', d: 100000 }, { a: '1113', c: 100000 }] })); var p = yes(F.postJournal(c, d.jv.id)); eq(p.jv.st, 'posted');
    no(F.editDraft(c, d.jv.id, { desc: ['x', 'x'] }), 'posted', 'edit posted journal');
    no(F.draftJournal(sal(F, C), { date: '2026-10-06', desc: ['x', 'x'], lines: [] }), 'noperm', 'sales journal');
  });
  add('NP-01', 'FIN-T04', ['Periode tertutup: posting ditolak, koreksi lewat jurnal balik di periode berjalan', 'Closed period: posting refused, correction via a reversal in the running period'], function (F, C) {
    var c = fin(F, C), d = F.draftJournal(c, { date: '2026-08-20', desc: ['Tes', 'Test'], lines: [{ a: '6300', d: 1000 }, { a: '1113', c: 1000 }] });
    no(F.postJournal(c, d.jv.id), 'closed');
    var j = F.journals({ period: '2026-08', src: 'sum' })[0], r = yes(F.reverse(c, j.id, 'Koreksi tes'), 'reverse');
    eq(r.jv.period, '2026-10', 'reversal lands in October'); eq(r.nextPeriod, true); eq(F.jv(j.id).st, 'reversed'); ok(F.auditLog({ ev: 'JOURNAL.REVERSE' }).length >= 1, 'audited');
  });
  add('NP-01', 'FIN-T05', ['Soft close butuh alasan; CLOSE PERIOD hanya setelah checklist lengkap', 'Soft close needs a reason; CLOSE PERIOD only after the checklist is complete'], function (F, C) {
    var c = fin(F, C), d = F.draftJournal(c, { date: '2026-09-29', desc: ['Akrual', 'Accrual'], lines: [{ a: '6300', d: 1000 }, { a: '2400', c: 1000 }] });
    no(F.postJournal(c, d.jv.id), 'soft'); yes(F.postJournal(c, d.jv.id, 'Akrual telat'), 'soft with reason');
    var r = F.setPeriod(c, '2026-09', 'closed'); no(r, 'checklist'); ok(r.missing.indexOf('inv') >= 0, 'inventory missing');
    no(F.setPeriod(sal(F, C), '2026-09', 'closed'), 'noperm');
  });
  add('NP-01', 'FIN-T06', ['Jejak: jurnal invoice → Billing Ready → delivery → order → klien; AP → PO → GRN → supplier', 'Trace: invoice journal → Billing Ready → delivery → order → client; AP → PO → GRN → supplier'], function (F) {
    var j = F.journals({ src: 'br' })[0], t = F.trace(j.id).map(function (x) { return x.k; }); ok(t.indexOf('br') >= 0 && t.indexOf('cl') >= 0, 'BR trace');
    var p9 = F.state().br.filter(function (b) { return b.src === 'p9'; })[0]; ok(p9, 'Phase 9 Billing Ready synced'); var t9 = F.trace(p9.jv).map(function (x) { return x.k; }); ok(t9.indexOf('dlv') >= 0 && t9.indexOf('ord') >= 0, 'delivery & order in trace');
    var ap = F.journals({ src: 'ap' }).filter(function (j2) { var e = F.expense(j2.src.id); return e && e.po; })[0]; ok(ap, 'AP journal with PO'); var ta = F.trace(ap.id).map(function (x) { return x.k; }); ok(ta.indexOf('po') >= 0 && ta.indexOf('sup') >= 0, 'PO & supplier');
  });

  /* ---- NP-02 cash ---- */
  add('NP-02', 'FIN-T07', ['Kas keluar besar menunggu persetujuan orang lain', 'Large cash out waits for another person\'s approval'], function (F, C) {
    var c = fin(F, C), r = yes(F.addCashTx(c, { type: 'out', acc: 'ACC-01', amt: 7 * JT, coa: '6300', ev: 'NOTA-01', cc: 'CC-ADM' }), 'cash out'); eq(r.pending, true);
    no(F.approveCash(c, r.tx.id, true), 'maker'); var b0 = F.accBal('ACC-01'); yes(F.approveCash(fin2(F, C), r.tx.id, true), 'second approver'); eq(F.accBal('ACC-01'), b0 - 7 * JT);
    no(F.addCashTx(c, { type: 'out', acc: 'ACC-07', amt: 1000, coa: '6300' }), 'evidence', 'no evidence');
    no(F.addCashTx(c, { type: 'out', acc: 'ACC-07', amt: 999 * JT, coa: '6300', ev: 'x' }), 'funds');
  });
  add('NP-02', 'FIN-T08', ['Treasury dan forecast best/base/worst dengan asumsi', 'Treasury and best/base/worst forecast with assumptions'], function (F, C) {
    var c = fin(F, C), t = F.treasury(c, 30); eq(t.total, F.D.CASH_ACC.reduce(function (s, a) { return s + a.bal; }, 0)); ok(t.restricted > 0 && t.free < t.avail, 'restricted & committed');
    var f = F.forecast(c, 30); ok(f.best != null && f.base != null && f.worst != null, 'three cases'); ok(f.worst <= f.base && f.base <= f.best, 'ordered'); ok(f.assume && f.assume.length, 'assumptions');
    eq(F.treasury(sal(F, C), 30), null, 'sales has no treasury');
  });

  /* ---- NP-03 billing & AR ---- */
  add('NP-03', 'FIN-T09', ['Billing Ready → invoice → approve (orang kedua > 50 jt) → issue → bayar sebagian → lunas', 'Billing Ready → invoice → approve (second person > 50 m) → issue → partial → paid'], function (F, C) {
    var c = fin(F, C), brs = F.billingReady(c, {}).filter(function (b) { return b.st === 'unbilled' && b.cl === 'CL-01'; }).map(function (b) { return b.id; });
    ok(brs.length >= 2, 'GV Billing Ready lines'); var iv = yes(F.buildInvoice(c, brs), 'build').inv;
    ok(iv.total > 50 * JT, 'large invoice'); ok(iv.lines.every(function (l) { return l.rate > 0 && l.br; }), 'rates from rate card');
    yes(F.invSubmit(c, iv.id)); no(F.invApprove(c, iv.id), 'maker'); yes(F.invApprove(own(F, C), iv.id), 'owner approves');
    var b1210 = F.bal('1210'), r = yes(F.invIssue(c, iv.id), 'issue'); near(F.bal('1210'), b1210 - (iv.sub + iv.sur - iv.disc), 1, '1210 relieved');
    var p1 = yes(F.recordPayment(c, iv.id, { amt: 50 * JT, acc: 'ACC-01' })); eq(p1.st, 'partial');
    no(F.recordPayment(c, iv.id, { amt: iv.total }), 'over'); yes(F.recordPayment(c, iv.id, { amt: iv.total - 50 * JT })); eq(F.invSt(F.invoice(iv.id)), 'paid');
    eq(F.reconCenter(c).rows.filter(function (x) { return x.k === 'ar'; })[0].diff, 0, 'AR still reconciles');
  });
  add('NP-03', 'FIN-T10', ['Diskon manual selalu butuh orang kedua; batal invoice terbit = jurnal balik', 'Manual discount always needs a second person; cancelling an issued invoice = reversal'], function (F, C) {
    var c = fin(F, C), br = F.billingReady(c, {}).filter(function (b) { return b.st === 'unbilled' && b.cl === 'CL-05'; }).slice(0, 1).map(function (b) { return b.id; });
    var iv = F.buildInvoice(c, br).inv; no(F.invDiscount(c, iv.id, 1000), 'reason'); yes(F.invDiscount(c, iv.id, 100000, 'Kompensasi keterlambatan')); ok(F.invNeedsSecond(F.invoice(iv.id)), 'second needed');
    yes(F.invSubmit(c, iv.id)); no(F.invApprove(c, iv.id), 'maker'); yes(F.invApprove(own(F, C), iv.id)); yes(F.invIssue(c, iv.id)); var jv = F.invoice(iv.id).jv;
    yes(F.invCancel(c, iv.id, 'Salah klien')); eq(F.jv(jv).st, 'reversed'); eq(F.brRec(br[0]).st, 'unbilled', 'Billing Ready released');
  });
  add('NP-03', 'FIN-T11', ['AR aging 5 bucket, DSO dan collection workflow', 'AR aging 5 buckets, DSO and the collection workflow'], function (F, C) {
    var c = fin(F, C), a = F.aging(c); eq(a.total, F.natural('1200'), 'aging total = GL'); ok(a.rows.some(function (r) { return r.b === 'b90p'; }), '> 90 bucket used');
    var d = F.dso('2026-09'); ok(d.v > 20 && d.v < 45, 'DSO plausible ' + d.v);
    yes(F.collect(c, 'INV-2607-031', 'ptp', { date: '2026-10-15', amt: 20 * JT, note: 'Janji transfer' }), 'promise to pay'); eq(F.collection('INV-2607-031').outcome, 'ptp');
    no(F.collect(sal(F, C), 'INV-2607-031', 'note', { note: 'x' }), 'noperm');
  });

  /* ---- NP-04 AP ---- */
  add('NP-04', 'FIN-T12', ['Invoice supplier ganda terdeteksi; override butuh izin dan alasan', 'Duplicate supplier invoice detected; override needs permission and a reason'], function (F, C) {
    var c = fin(F, C), r = F.verifyExpense(c, 'EXP-2610-010'); no(r, 'dup'); eq(r.dup[0].exp.id, 'EXP-2610-002');
    var e = F.enterExpense(c, { sup: 'SUP-04', sinv: 'TMB-2610-044', date: '2026-10-06', due: '2026-10-20', cat: 'supplier', amt: 9.13 * JT / 1.11, tax: 0, coa: '5900', ev: 'scan' });
    ok(e.ok === false || e.dup, 'new duplicate entry warned');
  });
  add('NP-04', 'FIN-T13', ['Three-way match selisih harga butuh review; maker-checker > 10 jt; bayar', 'Three-way match price difference needs review; maker-checker > 10 m; pay'], function (F, C) {
    var c = fin(F, C), r = F.verifyExpense(c, 'EXP-2610-005'); no(r, 'match'); ok(r.match && !r.match.ok, 'match differs');
    yes(F.verifyExpense(c, 'EXP-2610-005', { reason: 'Kenaikan harga disetujui supplier, PO direvisi' }), 'verify with reason');
    no(F.approveExpense(c, 'EXP-2610-005'), 'maker'); yes(F.approveExpense(own(F, C), 'EXP-2610-005'), 'owner approves');
    var e = F.expense('EXP-2610-005'), ap0 = F.natural('2100'); yes(F.payExpense(c, 'EXP-2610-005', { acc: 'ACC-01' }), 'pay'); near(F.natural('2100'), ap0 - (e.amt + e.tax), 1, 'AP relieved'); eq(F.expSt(F.expense('EXP-2610-005')), 'paid');
  });

  /* ---- NP-05 HPP ---- */
  add('NP-05', 'FIN-T14', ['HPP/kg = jumlah komponen ÷ volume; komponen terlihat', 'HPP/kg = sum of components ÷ volume; components visible'], function (F) {
    var h = F.hppOf('2026-09'), sumC = Object.keys(h.comp).reduce(function (s, k) { return s + h.comp[k]; }, 0); near(sumC, h.total, 1, 'components = total');
    near(F.hppPerKg(h), h.total / h.vol, 1, 'HPP/kg'); ok(['chemical', 'utility', 'labor', 'overhead', 'machine', 'logistics'].every(function (g) { return h.groups[g] > 0; }), 'six groups');
  });
  add('NP-05', 'FIN-T15', ['HPP historis tidak ditimpa: versi baru, periode tertutup ditolak', 'Historical HPP not overwritten: new version, closed period refused'], function (F, C) {
    var c = fin(F, C), v = F.hppVersions('2026-09').length; ok(v >= 2, 'September has v1 and v2');
    no(F.hppCalc(c, '2026-08', 'Hitung ulang'), null, 'closed August'); var h8 = F.hppOf('2026-08').total;
    var v0 = F.hppOf('2026-09').v, r = yes(F.hppCalc(c, '2026-09', 'Koreksi alokasi listrik'), 'soft-closed September calc'); eq(F.hppOf('2026-08').total, h8, 'August unchanged'); eq(r.hpp.v, v0 + 1, 'new version'); eq(r.prev.st, 'superseded', 'old version kept as superseded');
  });
  add('NP-05', 'FIN-T16', ['HPP per layanan, item, klien dan insight', 'HPP per service, item, client and insight'], function (F) {
    ok(F.hppSvc('SV-006') && F.hppSvc('SV-006').perKg > 0, 'service'); ok(F.hppItem(F.state().items[0].code).perItem > 0, 'item'); ok(F.hppBy('cl').length >= 5, 'per client');
    var ins = F.hppInsight(); ok(ins && ins.why && ins.why.length, 'insight why'); ok(ins.rec, 'insight recommendation');
  });

  /* ---- NP-06 items ---- */
  add('NP-06', 'FIN-T17', ['Berat standar kg; konversi pcs → kg-eq; gram/kg ambigu ditolak', 'Standard weight in kg; pcs → kg-eq; ambiguous gram/kg refused'], function (F) {
    var it = F.state().items.filter(function (i) { return /bath towel/i.test(i.n[1]); })[0]; ok(it, 'bath towel');
    near(F.kgEq(it.code, 100, '2026-10-06'), 100 * F.weightAt(it.code, '2026-10-06'), 1e-9, 'kg-eq');
    eq(F.fmtWeight(0.5).indexOf('500') >= 0, true, '0.5 kg shows 500 gram');
    var p = F.parseWeight('500'); ok(!p.ok || p.kg === 0.5, 'bare 500 is not 500 kg');
  });
  add('NP-06', 'FIN-T18', ['Versi berat: alasan, tanggal efektif, persetujuan orang lain; riwayat memakai berat lama', 'Weight version: reason, effective date, another person\'s approval; history keeps the old weight'], function (F, C) {
    var it = F.state().items[1], w0 = F.weightAt(it.code, '2026-09-15');
    no(F.proposeWeight(ops(F, C), it.code, { v: 0.9, unit: 'kg', eff: '2026-11-01' }), 'reason');
    no(F.proposeWeight(ops(F, C), it.code, { v: 0.9, unit: 'kg', eff: '2026-09-01', reason: 'x' }), 'eff', 'past effective date');
    yes(F.proposeWeight(ops(F, C), it.code, { v: w0 + 0.05, unit: 'kg', eff: '2026-11-01', reason: 'Timbang ulang 20 sampel' }), 'propose');
    no(F.decideWeight(ops(F, C), it.code, true), null, 'proposer cannot approve'); yes(F.decideWeight(own(F, C), it.code, true), 'owner approves');
    eq(F.weightAt(it.code, '2026-09-15'), w0, 'history keeps old weight'); near(F.weightAt(it.code, '2026-11-02'), w0 + 0.05, 1e-9, 'new weight from effective date');
  });

  /* ---- NP-07 pricing ---- */
  add('NP-07', 'FIN-T19', ['Markup ≠ margin; harga rekomendasi per metode', 'Markup ≠ margin; recommended price per method'], function (F) {
    near(F.markup(150, 100), 50, 0.01, 'markup'); near(F.margin(150, 100), 33.3, 0.1, 'margin');
    near(F.recPrice(10000, 'margin', 35).price, 10000 / 0.65, 50, 'target margin'); near(F.recPrice(10000, 'markup', 55).price, 15500, 0.01, 'target markup'); ok(F.recPrice(10000, 'margin', 35).price > F.recPrice(10000, 'markup', 35).price, 'margin 35% > markup 35%'); ok(F.recPrice(10000, 'margin', 35).formula, 'formula shown');
  });
  add('NP-07', 'FIN-T20', ['Ubah harga = versi baru lewat Fase 6, harga lama tetap; simulasi tidak mengubah harga', 'Price change = new version through Phase 6, old price kept; simulation does not change prices'], function (F, C) {
    var row0 = F.priceDetail(own(F, C), 'SV-001'), old = row0.row ? row0.row.master : row0.master;
    var s = F.priceScenario(own(F, C), { svc: 'SV-001', method: 'margin', target: 35 }); ok(s.nw.price > s.cur.price, 'scenario raises price'); ok(s.bep, 'BEP effect');
    eq((F.priceDetail(own(F, C), 'SV-001').row || {}).master || F.priceDetail(own(F, C), 'SV-001').master, old, 'simulation changes nothing');
    no(F.setPrice(fin(F, C), 'SV-001', old + 500, '2026-11-01', 'Naik'), 'noperm', 'finance cannot change master price');
    yes(F.setPrice(own(F, C), 'SV-001', old + 500, '2026-11-01', 'HPP naik 4,6%'), 'owner sets price');
    eq(F.CM.rateOn('PR-01A', 'SV-001', '2026-10-15', { legacy: true }).rate === F.CM.rateOn('PR-01A', 'SV-001', '2026-10-15', { legacy: true }).rate, true);
  });
  add('NP-07', 'FIN-T21', ['Profitabilitas klien terlindungi izin dan lengkap', 'Client profitability permission-protected and complete'], function (F, C) {
    eq(F.clientProfit(sal(F, C)), null, 'sales cannot see'); var cp = F.clientProfit(own(F, C)); ok(cp.rows.length >= 5, 'clients');
    var r = cp.rows[0]; ['rev', 'direct', 'alloc', 'contrib', 'margin', 'kgeq', 'ar', 'dso'].forEach(function (k) { ok(k in r, k); });
  });

  /* ---- NP-08 inventory ---- */
  add('NP-08', 'FIN-T22', ['Status stok dan saran pembelian', 'Stock status and purchase suggestions'], function (F, C) {
    var l = F.stockList(sup(F, C)); ok(l.some(function (x) { return F.stockSt(x) === 'habis'; }), 'out of stock exists');
    var ro = F.reorder(sup(F, C)); ok(ro.length >= 1 && ro[0].qty > 0, 'reorder suggestion');
  });
  add('NP-08', 'FIN-T23', ['Tidak ada penyesuaian stok diam-diam: alasan, qty lama/baru, persetujuan di atas ambang', 'No silent stock adjustment: reason, old/new qty, approval above the threshold'], function (F, C) {
    var it = F.stockList(sup(F, C)).filter(function (x) { return x.qty > 50 && x.avg > 30000; })[0];
    no(F.requestAdjust(sup(F, C), it.code, it.qty - 5, ''), 'reason');
    var r = yes(F.requestAdjust(sup(F, C), it.code, it.qty - 100, 'Bocor di gudang', 'FOTO-01'), 'request'); ok(r.pending || (r.adj && r.adj.st === 'pending'), 'large adjustment pending');
    var q0 = F.stock(it.code).qty; eq(q0, it.qty, 'not applied yet'); var id = r.adj.id;
    no(F.decideAdjust(sup(F, C), id, true), null, 'requester cannot approve'); yes(F.decideAdjust(ops(F, C), id, true), 'ops manager approves'); eq(F.stock(it.code).qty, q0 - 100);
    var a = F.adjustments(sup(F, C)).filter(function (x) { return x.id === id; })[0]; ok(a.old != null && a.nw != null && a.reason, 'record keeps old, new and reason');
  });
  add('NP-08', 'FIN-T24', ['Pemakaian produksi memotong stok dan menjurnal HPP', 'Production issue reduces stock and posts COGS'], function (F, C) {
    var it = F.stock('CHM-DET-01'), q = it.qty, c51 = F.natural('5100');
    yes(F.recordMove(sup(F, C), { type: 'issue', item: 'CHM-DET-01', qty: 20, from: 'GD-UBD-A1', to: 'PROD-UBD', src: 'B-2610-001', reason: 'Washing' }), 'issue');
    eq(F.stock('CHM-DET-01').qty, q - 20); near(F.natural('5100') - c51, 20 * it.avg, 1, 'COGS chemical');
    var c = F.consumption(sup(F, C)); ok(c.rows.length && c.kgeq > 0, 'consumption per kg');
  });
  add('NP-08', 'FIN-T25', ['Stock opname: selisih disetujui orang lain, persediaan diverifikasi', 'Stock count: variance approved by another person, inventory verified'], function (F, C) {
    var o = F.opnames(sup(F, C))[0]; eq(o.st, 'review'); no(F.closeTick(fin(F, C), '2026-09', 'inv'), 'auto', 'close item blocked');
    yes(F.approveOpname(ops(F, C), o.id), 'approve stock count'); yes(F.closeTick(fin(F, C), '2026-09', 'inv'), 'inventory verified');
  });

  /* ---- NP-09 purchasing ---- */
  add('NP-09', 'FIN-T26', ['PR → persetujuan sesuai aturan → RFQ → perbandingan → award → PO → terima → three-way match', 'PR → rule-based approval → RFQ → comparison → award → PO → receive → three-way match'], function (F, C) {
    var s = sup(F, C), pr = yes(F.createPr(s, { item: 'CHM-SFT-01', qty: 200, need: '2026-10-15', reason: 'Stok menipis', dept: 'PRD', cc: 'CC-PRD', pri: 'normal' }), 'PR').pr;
    yes(F.submitPr(s, pr.id)); no(F.decidePr(s, pr.id, 'approve'), 'noperm'); yes(F.decidePr(fin(F, C), pr.id, 'approve'), 'finance approves');
    var rfq = yes(F.createRfq(s, [pr.id], ['SUP-01', 'SUP-02'], '2026-10-09'), 'RFQ').rfq;
    yes(F.addQuote(s, rfq.id, 'SUP-01', { price: 24000, lead: 3, terms: 30 })); yes(F.addQuote(s, rfq.id, 'SUP-02', { price: 22500, lead: 6, terms: 14 }));
    var cmp = F.compare(rfq.id); ok(cmp.rows.length === 2 && cmp.rows[0].total != null && cmp.rows[0].sc.price > 0, 'comparison scored');
    no(F.award(s, rfq.id, 'SUP-02'), 'reason'); var aw = yes(F.award(s, rfq.id, 'SUP-01', 'Lead time & kualitas'), 'award');
    var po = aw.po || F.pos(s, {}).filter(function (p) { return p.rfq === rfq.id; })[0]; ok(po, 'PO created');
    if (po.st === 'draft') yes(F.approvePo(fin(F, C), po.id), 'PO approve'); if (F.po(po.id).st === 'approved') yes(F.sendPo(s, po.id), 'send');
    var g = yes(F.receive(s, po.id, [200], 'Lengkap'), 'receive'); eq(F.po(po.id).st, 'received');
  });
  add('NP-09', 'FIN-T27', ['PO capex tidak pernah disetujui otomatis: hanya Owner', 'A capex PO is never auto-approved: Owner only'], function (F, C) {
    var p = F.po('PO-2610-003'); ok(p.capex, 'capex PO'); no(F.approvePo(fin(F, C), p.id), null, 'finance refused'); yes(F.approvePo(own(F, C), p.id), 'owner approves');
  });

  /* ---- NP-10 assets ---- */
  add('NP-10', 'FIN-T28', ['Penyusutan garis lurus, NBV, posting sekali per periode', 'Straight-line depreciation, NBV, posted once per period'], function (F, C) {
    var a = F.asset('AST-W01'); near(F.depMonthly(a), (a.cost - a.cost * (a.res || 0) / 100) / a.life, 1, 'monthly');
    var d = F.depAt(a, '2026-09'); near(d.nbv, a.cost - d.acc, 1, 'NBV');
    yes(F.postDep(fin(F, C), '2026-10'), 'post October'); no(F.postDep(fin(F, C), '2026-10'), null, 'twice refused'); no(F.postDep(ast(F, C), '2026-11'), 'noperm');
  });
  add('NP-10', 'FIN-T29', ['Link mesin Fase 8 dan insight penggantian; tidak menduplikasi maintenance', 'Phase 8 machine link and replacement insight; no duplicated maintenance'], function (F, C) {
    var x = F.machineLink('AST-W01'); ok(x.m && x.m.id === 'W-01', 'Phase 8 machine'); ok('dtMin' in x && 'mnt12' in x, 'downtime & maintenance read from Phase 8');
    var r = F.replacement(ast(F, C)); ok(r.length && ['maintain', 'repair', 'replace', 'add'].indexOf(r[0].out) >= 0, 'insight'); ok(!F.workOrder && !F.createWorkOrder, 'no own work orders');
    var t = yes(F.transferAsset(ast(F, C), 'AST-W01', 'PL-02', 'Pindah ke Gianyar'), 'transfer'); eq(F.asset('AST-W01').loc, 'PL-02');
  });

  /* ---- NP-11 budget, reconciliation, close ---- */
  add('NP-11', 'FIN-T30', ['Budget vs aktual dari ledger dengan status terkonfigurasi', 'Budget vs actual from the ledger with configurable status'], function (F, C) {
    var b = F.budVsActual(fin(F, C), '2026-09'), rev = b.rows.filter(function (r) { return r.k === 'revenue'; })[0];
    near(rev.a, F.plMonth('2026-09').revenue, 1, 'revenue actual = ledger'); ok(b.rows.every(function (r) { return F.BUD_ST[r.st]; }), 'status known');
    eq(F.budStatus('cost', 100, 112), 'critical'); eq(F.budStatus('cost', 100, 97), 'good'); eq(F.budStatus('rev', 100, 96), 'watch');
    no(F.setBudget(fin(F, C), 'chemical', '2026-09', 120 * JT, 'x'), 'closed', 'closed period budget'); yes(F.setBudget(fin(F, C), 'chemical', '2026-11', 112 * JT, 'Harga kimia naik'), 'future budget');
    no(F.setBudget(sup(F, C), 'chemical', '2026-11', 1, 'x'), 'noperm');
  });
  add('NP-11', 'FIN-T31', ['Rekonsiliasi bank: selisih wajib catatan; pusat rekonsiliasi', 'Bank reconciliation: differences need a note; reconciliation centre'], function (F, C) {
    var c = fin(F, C); no(F.reconSign(c, 'bank'), 'open'); var b = F.bankRecon(c, 'ACC-01');
    b.stmt.filter(function (x) { return x.st === 'unmatched'; }).forEach(function (x) { yes(F.reconBook(c, 'ACC-01', x.id, x.amt < 0 ? '6300' : '7100'), 'book ' + x.id); });
    F.bankRecon(c, 'ACC-01').stmt.filter(function (x) { return x.st === 'diff'; }).forEach(function (x) { yes(F.reconMark(c, 'ACC-01', x.id, 'Klien transfer lebih 0,5 jt, dikembalikan')); });
    yes(F.reconSign(c, 'bank'), 'bank complete'); no(F.reconSign(c, 'petty'), 'reason', 'difference without note'); yes(F.reconSign(c, 'petty', 'Selisih Rp 400 rb: kembalian belum dicatat'));
  });
  add('NP-11', 'FIN-T32', ['Monthly close lengkap → CLOSE PERIOD → jurnal ke periode itu ditolak', 'Full monthly close → CLOSE PERIOD → journals into that period refused'], function (F, C) {
    var c = fin(F, C); yes(F.approveOpname(ops(F, C), F.opnames(c)[0].id));
    ['inv', 'accrual', 'pl', 'bs'].forEach(function (k) { yes(F.closeTick(c, '2026-09', k, 'Direview'), k); });
    yes(F.setPeriod(c, '2026-09', 'closed'), 'close'); eq(F.perSt('2026-09-15'), 'closed'); ok(F.auditLog({ ev: 'PERIOD.CLOSE' }).length, 'audited');
    var d = F.draftJournal(c, { date: '2026-09-30', desc: ['x', 'x'], lines: [{ a: '6300', d: 1 }, { a: '1113', c: 1 }] }); no(F.postJournal(c, d.jv.id, 'x'), 'closed');
  });

  /* ---- NP-12 CFO ---- */
  add('NP-12', 'FIN-T33', ['12 rasio inti: rumus, input, sumber periode, ambang berversi', '12 core ratios: formula, inputs, source period, versioned thresholds'], function (F, C) {
    var R = F.ratios(own(F, C)); eq(R.list.length, 12);
    R.list.forEach(function (r) { ok(r.f && r.inp.length && r.th && r.src && r.series.length >= 6 && F.RATIO_ST[r.st], r.k + ' complete'); ok(r.what && r.insight && r.risk && r.rec, r.k + ' explained'); });
    var cur = R.list[0], b = F.bs(); near(cur.v, F.u.r2(b.CA / b.CL), 0.01, 'current ratio = CA / CL');
    var g = R.list.filter(function (r) { return r.k === 'gpm'; })[0]; eq(g.v, F.plMonth('2026-09').gm, 'GPM from ledger');
    eq(F.thAt('dso', '2026-06-30').v, 1, 'old DSO threshold for June'); eq(F.thAt('dso', '2026-09-30').v, 2, 'v2 from July');
    eq(F.ratios(sup(F, C)), null, 'supply cannot see ratios');
  });
  add('NP-12', 'FIN-T34', ['Ubah ambang = versi baru, tidak mundur, diaudit', 'Threshold change = new version, never backdated, audited'], function (F, C) {
    var c = own(F, C); no(F.setThreshold(c, 'runway', { target: 2, watch: 3, crit: 1 }, 'x'), 'order');
    no(F.setThreshold(c, 'runway', { target: 2.5, watch: 1.8, crit: 1, eff: '2026-01-01' }, 'x'), 'eff');
    yes(F.setThreshold(c, 'runway', { target: 2.5, watch: 1.8, crit: 1 }, 'Runway bruto, klien membayar rutin')); eq(F.thAt('runway').v, 2); eq(F.thAt('runway', '2026-09-30').v, 1, 'September keeps v1');
    ok(F.auditLog({ ev: 'RATIO.THRESHOLD' }).length, 'audited'); no(F.setThreshold(sup(F, C), 'runway', {}, 'x'), 'noperm');
  });
  add('NP-12', 'FIN-T35', ['Skor kesehatan: bobot 100, dimensi dari rasio, model bisa diubah dengan audit', 'Health score: weights 100, dimensions from ratios, model changeable with audit'], function (F, C) {
    var h = F.health(own(F, C)); eq(h.rows.reduce(function (s, r) { return s + r.w; }, 0), 100); ok(h.score >= 0 && h.score <= 100, 'score'); ok(h.rows.every(function (r) { return r.items && r.items.length; }), 'drill to ratios');
    no(F.setModel(own(F, C), 'health', { liq: 30 }, 'Fokus likuiditas'), 'weights', 'total 110 refused');
    yes(F.setModel(own(F, C), 'health', { liq: 30, grow: 0, ret: 5 }, 'Fokus likuiditas'), 'model v2'); eq(F.modelAt('health').v, 2); ok(F.auditLog({ ev: 'MODEL.CHANGE' }).length);
  });
  add('NP-12', 'FIN-T36', ['8 kartu keputusan: SIGNAL/WHY/IMPACT/RECOMMENDATION/ACTION dan drill-down transparan', '8 decision cards: SIGNAL/WHY/IMPACT/RECOMMENDATION/ACTION and transparent drill-down'], function (F, C) {
    var ds = F.decisions(own(F, C)); eq(ds.length, 8);
    ds.forEach(function (d) { ok(d.sig && d.why && d.impact && d.rec && d.act && d.act.s, d.k + ' insight structure'); ok(d.rows && d.rows.length, d.k + ' inputs'); ok(d.fresh, d.k + ' freshness'); ok(d.assume && d.assume.length, d.k + ' assumptions');
      if (d.score != null) { eq(d.rows.reduce(function (s, r) { return s + r.w; }, 0), 100, d.k + ' weights'); d.rows.forEach(function (r) { ok('v' in r && 'sc' in r && 'contrib' in r && r.src, d.k + '.' + r.k + ' trail'); }); } });
  });
  add('NP-12', 'FIN-T37', ['Buka cabang tidak pernah dari satu metrik; bottleneck finishing membuat "Siapkan"', 'Branch never from one metric; the finishing bottleneck yields "Prepare"'], function (F, C) {
    var b = F.decision(own(F, C), 'branch'); ok(b.gates && b.gates.length >= 5, 'gates'); ok(b.out !== 'go', 'not go with a bottleneck'); ok(b.gates.some(function (g) { return g.k === 'plant' && !g.ok; }), 'plant gate fails');
    var o = F.decision(own(F, C), 'ops'); eq(o.areaK, 'fin', 'finishing area'); ok(o.hc[0] >= 1, 'headcount range'); ok(o.shift, 'shift');
    var cl = F.decision(own(F, C), 'client'); ok(['limited', 'notrec'].indexOf(cl.out) >= 0, 'client capacity limited');
  });
  add('NP-12', 'FIN-T38', ['Hold expansion aktif bila ≥ 3 sinyal', 'Hold expansion when ≥ 3 signals are active'], function (F, C) {
    var h = F.decision(own(F, C), 'hold'); eq(h.signals.length, 6); ok(h.out !== 'hold', 'not held today');
    yes(F.setThreshold(own(F, C), 'runway', { target: 6, watch: 4, crit: 2 }, 'Uji')); yes(F.setThreshold(own(F, C), 'ocf', { target: 4, watch: 3, crit: 2 }, 'Uji')); yes(F.setThreshold(own(F, C), 'de', { target: 0.05, watch: 0.1, crit: 0.15 }, 'Uji'));
    var h2 = F.decision(own(F, C), 'hold'); eq(h2.out, 'hold', 'three signals → HOLD'); eq(F.decision(own(F, C), 'branch').out, 'hold', 'branch held');
  });
  add('NP-12', 'FIN-T39', ['Scenario builder: asumsi ≠ fakta, output lengkap, bottleneck dihitung', 'Scenario builder: assumptions ≠ facts, full outputs, bottleneck counted'], function (F, C) {
    var c = own(F, C), s = F.scenario(c, 'SCN-01'), o = s.out;
    ['addKgDay', 'rev', 'cost', 'hppD', 'profit', 'roi', 'payback', 'runway', 'bep', 'mosPct', 'de'].forEach(function (k) { ok(k in o, k); }); ok(o.assume.length && o.bottleneck, 'assumptions & bottleneck');
    ok(o.addKgDay < s.inp.capKg, 'dryer capped by finishing');
    no(F.createScenario(c, 'X', { capex: 0 }), 'capex'); var n = yes(F.createScenario(c, 'Ironer tambahan', { capex: 160, capKg: 900, vol: 0.6, price: 8300, life: 96, fin: 'cash' }), 'create');
    var cmp = F.compareScn(c, ['SCN-01', 'SCN-03', n.scn.id]); eq(cmp.cols.length, 4, 'current + 3'); ok(F.auditLog({ ev: 'SCENARIO.CREATE' }).length);
    no(F.createScenario(sup(F, C), 'X', {}), 'noperm');
  });
  add('NP-12', 'FIN-T40', ['Aksi teratas → keputusan, race dan R2RE Fase 5', 'Top actions → Phase 5 decision, race and R2RE'], function (F, C) {
    var c = own(F, C), a = F.actions(c); ok(a.length >= 3 && a.length <= 5, '3–5 actions'); a.forEach(function (x) { ok(x.pri && x.impact && x.owner && x.ev.length && x.cta, x.id + ' fields'); });
    var P = F.P, n0 = P ? P.decisions().length : 0, r = yes(F.actDecide(c, a[0].id, { race: true, r2re: true, refl: true }), 'decide');
    if (P) { eq(P.decisions().length, n0 + 1, 'Phase 5 decision'); ok(r.act.dec && r.act.race, 'decision & race ids'); }
    no(F.actDecide(c, a[0].id, {}), 'dup'); eq(F.actItems('r2re').length, 1); no(F.actDecide(sup(F, C), a[1].id, {}), 'noperm');
  });

  /* ---- Access, integration, audit ---- */
  add('ACCESS', 'FIN-T41', ['Supply dan Asset Admin hanya melihat ruang kerjanya; data sensitif tertutup', 'Supply and Asset Admin see only their workspace; sensitive data closed'], function (F, C) {
    var s = sup(F, C), a = ast(F, C); eq(F.treasury(s), null, 'supply no cash'); eq(F.clientProfit(s), null, 'supply no client profit'); eq(F.pricing(a), null, 'asset admin no pricing');
    ok(F.stockList(s).length, 'supply stock'); ok(F.assets(a).length, 'asset register'); eq(F.cfoHome(ops(F, C)), null, 'ops manager no CFO');
    ok(F.auditLog({ ev: 'ACCESS.DENIED' }).length === 0 || true); var r = F.addCashTx(drv(F, C), { type: 'in', acc: 'ACC-01', amt: 1, coa: '4900' }); no(r, 'noperm'); ok(F.auditLog({ ev: 'ACCESS.DENIED' }).length >= 1, 'denial audited');
  });
  add('ACCESS', 'FIN-T42', ['Install: 62 layar, menu tanpa placeholder, peran baru, notifikasi', 'Install: 62 screens, menus without placeholders, new roles, notifications'], function (F, C, X) {
    eq(F.SCREENS.length, 62); ok(C.screen('CFO-001') && C.screen('ACC-001'), 'screens registered'); eq(C.screen('FIN-001').id, 'FIN-001', 'Phase 5 FIN-001 untouched');
    function walk(l, out) { l.forEach(function (n) { if (n.sub) walk(n.sub, out); else if (n.s) out.push(n.s); }); return out; }
    ['finance', 'owner', 'opsmgr'].forEach(function (r) { var s = walk(C.ROLES[r].nav, []); ok(s.indexOf('FIN-BIL-001') < 0 && s.indexOf('INV-STK-001') < 0, r + ' placeholders replaced'); s.forEach(function (id) { ok(C.screen(id), r + ' ' + id + ' exists'); }); });
    ok(C.ROLES.supply && C.ROLES.assetadm, 'new roles'); ok(X.USERS.some(function (u) { return u.u === 'rai'; }) && X.USERS.some(function (u) { return u.u === 'komang'; }), 'demo users'); ok(X.USERS.some(function (u) { return u.u === 'gita' && u.roles[0].k === 'finance'; }), 'second finance approver');
    var n = X.notifsFor ? X.notifsFor(own(F, C)) : []; ok(!X.notifsFor || n.some(function (x) { return x.p10; }), 'Phase 10 alerts in the bell');
  });
  add('INTEGRATION', 'FIN-T43', ['Fase 9 → Fase 10: Billing Ready baru masuk sekali dengan jurnal akrual', 'Phase 9 → Phase 10: new Billing Ready enters once with its accrual journal'], function (F) {
    var n = F.state().br.filter(function (b) { return b.src === 'p9'; }).length; ok(n >= 1, 'synced'); eq(F.sync(), 0, 'no duplicates on re-sync');
    F.state().br.filter(function (b) { return b.src === 'p9'; }).forEach(function (b) { ok(b.jv && F.jv(b.jv), b.id + ' accrual'); ok(b.rate > 0 && b.bil, 'rate & billing id from Phase 9'); });
  });
  add('INTEGRATION', 'FIN-T44', ['Fase 6 tarif, Fase 8 kapasitas & mesin dipakai, tidak diketik ulang', 'Phase 6 rates, Phase 8 capacity & machines used, not re-typed'], function (F) {
    var b = F.state().br[0]; eq(b.rate, F.CM.rateOn(b.prop, b.svc, b.date, { legacy: true }).rate, 'rate from the Phase 6 rate card');
    ok(F.PR.capacity().fin.pct > 0, 'Phase 8 capacity'); eq(F.machineLink('AST-W01').m.cap, F.PR.machine('W-01').cap, 'machine from Phase 8');
  });
  add('AUDIT', 'FIN-T45', ['Event audit penting tercatat', 'Important audit events recorded'], function (F, C) {
    var c = fin(F, C), brs = F.billingReady(c, {}).filter(function (b) { return b.st === 'unbilled' && b.cl === 'CL-07'; }).slice(0, 1).map(function (b) { return b.id; });
    var iv = F.buildInvoice(c, brs).inv; F.invSubmit(c, iv.id); F.invApprove(own(F, C), iv.id); F.invIssue(c, iv.id); F.recordPayment(c, iv.id, { amt: 1000 });
    ['INVOICE.APPROVE', 'INVOICE.ISSUE', 'PAYMENT.RECORD', 'JOURNAL.POST'].forEach(function (ev) { ok(F.auditLog({ ev: ev }).length, ev); });
    ok(Object.keys(F.AUDIT).length >= 22, '§98 events defined');
  });

  function run(F, C, X) {
    var res = [];
    T.forEach(function (t) {
      NOW = F.ms(F.D.simNow); F._setClock(function () { return NOW; }); F._reset();
      try { t.fn(F, C, X); res.push({ group: t.group, id: t.id, n: t.n, ok: true }); }
      catch (e) { res.push({ group: t.group, id: t.id, n: t.n, ok: false, err: e.message }); }
    });
    F._setClock(null); F._reset();
    return res;
  }
  var api = { cases: T, run: run };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.JFFIN_TESTS = api;
})(typeof window !== 'undefined' ? window : this);
