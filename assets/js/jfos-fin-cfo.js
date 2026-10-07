/* ==========================================================================
   JFRESH OS — Phase 10 engine · part 4 of 4: control & CFO intelligence.
   NP-11 budget vs actual with configurable status thresholds, the
   reconciliation centre (bank, cash, AR, AP, inventory, assets against their
   subledgers or physical counts) and the monthly close checklist that gates
   CLOSE PERIOD. NP-12 the 12 core ratios (formula, inputs, source period,
   versioned effective-dated thresholds), BEP and margin of safety, the
   financial health score (weights total 100, Phase 5 rule), the combined
   decision engine (branch, sales team, operations team, machine, new client
   capacity, investment capacity, pricing review, hold expansion), the
   investment scenario builder and comparison, top recommended actions that
   become Phase 5 decisions, races, R2RE and reflection items, mobile alerts,
   and finally the screens, menus, roles and install() for the app.
   Every score drills down to inputs, weights, values, targets, contribution,
   assumptions and data freshness (§82). No score ever authorises capex.
   ========================================================================== */
(function (root) {
  var M = root.JFFIN || (typeof require !== 'undefined' ? require('./jfos-fin.js') : null);
  if (!M || M._ext.cfo) return; M._ext.cfo = true;
  var D = M.D, U = M.u, L = U.L, T = U.T, sum = U.sum, r0 = U.r0, r1 = U.r1, r2 = U.r2, pct = U.pct, by = U.by, can = M.can, bad = M.bad, deny = M.deny, str = U.str, num = U.num, JT = M.JT;
  var mEnd = U.mEnd, mAdd = U.mAdd, ym = U.ym, clone = U.clone;
  function S() { return M.state(); }
  function save() { M.save(); }
  function nowS() { return M.nowS(); }
  function empId(ctx) { return M.empId(ctx); }
  function clamp(x, a, b) { return Math.max(a, Math.min(b, x)); }
  function avg(a) { a = a.filter(function (x) { return x != null && !isNaN(x); }); return a.length ? sum(a) / a.length : null; }
  var MONTHS = ['2026-04', '2026-05', '2026-06', '2026-07', '2026-08', '2026-09'];
  function monthsTo(p) { var out = []; for (var m = '2026-04'; m <= p; m = mAdd(m, 1)) out.push(m); return out; }
  function daysIn(p) { return +mEnd(p).slice(8); }

  /* ---------- Seed: budget, close checklists, thresholds, models, scenarios ---------- */
  var MODEL_DEF = {
    ops: [['util', 25], ['ot', 20], ['queue', 10], ['sla', 15], ['rewash', 10], ['payroll', 10], ['demand', 10]],
    client: [['wash', 20], ['dry', 20], ['fin', 25], ['labor', 15], ['sla', 10], ['mgn', 10]],
    invest: [['free', 20], ['ocf', 20], ['runway', 20], ['debt', 15], ['npm', 10], ['roi', 10], ['mos', 5]],
    pricing: [['hpp', 20], ['mgn', 25], ['cost', 15], ['client', 15], ['age', 10], ['quality', 10], ['comp', 5]]
  };
  M._seed.push(function (s) {
    s.bud = D.BUDGET.map(function (x) { var m = {}; D.BUD_MONTHS.forEach(function (p, i) { m[p] = Math.round(x[5][i] * JT); }); return { k: x[0], n: x[1], kind: x[2], cc: x[3], accs: x[4], m: m }; });
    s.budCfg = Object.assign({}, D.BUD_CFG); s.budCfgHist = [];
    s.budHist = D.BUD_HIST.map(function (h) { return { at: h[0], by: h[1], k: h[2], p: h[3], from: h[4] * JT, to: h[5] * JT, reason: h[6] }; });
    s.close = { '2026-09': {}, '2026-10': {} };
    Object.keys(D.CLOSE_SEP).forEach(function (k) { var x = D.CLOSE_SEP[k]; s.close['2026-09'][k] = { st: x[0], by: x[1] || null, at: x[2] || null, note: null }; });
    M.CLOSE_ITEMS.forEach(function (c) { s.close['2026-10'][c[0]] = { st: 'open', by: null, at: null, note: null }; });
    s.rth = D.RATIO_TH.map(function (x) { return { k: x[0], v: x[1], eff: x[2], target: x[3], watch: x[4], crit: x[5], dir: x[6], note: x[7] || null, by: 'EMP-050', at: x[2] }; });
    s.models = D.MODELS.map(function (m) { return { k: m.k, v: m.v, eff: m.eff, w: m.w.map(function (x) { return x.slice(); }), by: 'EMP-050', at: m.eff, reason: null }; });
    Object.keys(MODEL_DEF).forEach(function (k) { s.models.push({ k: k, v: 1, eff: '2026-01-01', w: MODEL_DEF[k].map(function (x) { return x.slice(); }), by: 'EMP-050', at: '2026-01-01', reason: null }); });
    s.scn = clone(D.SCENARIOS); s.acts = {}; s.recSign = {};
  });

  /* ---------- NP-11 budget vs actual (§58–§60) ---------- */
  M.BUD_ST = { good: [L('Good', 'Good'), 'ok'], ontrack: [L('On Track', 'On Track'), 'ok'], watch: [L('Watch', 'Watch'), 'warn'], over: [L('Over Budget', 'Over Budget'), 'crit'], critical: [L('Critical', 'Critical'), 'crit'] };
  M.BUD_KIND = { rev: L('Pendapatan', 'Revenue'), cost: L('Biaya', 'Cost'), profit: L('Laba', 'Profit'), capex: L('Capex', 'Capex') };
  M.budLines = function () { return S().bud; };
  M.budLine = function (k) { return by(S().bud, 'k', k); };
  M.budCfg = function () { return S().budCfg; };
  // Actual for a budget line in [from, to], from the posted ledger only (never re-entered).
  M.budActual = function (b, from, to) {
    if (b.kind === 'profit') return M.pl(from, to).net;
    var bal = M.balances({ from: from, to: to });
    if (b.kind === 'capex') return sum(S().jv.filter(function (j) { return (j.st === 'posted' || j.st === 'adjust') && j.kind !== 'open' && j.date >= from && j.date <= to; })
      .map(function (j) { return sum(j.lines.filter(function (l) { return b.accs.indexOf(l.a) >= 0; }).map(function (l) { return l.d; })); }));
    var v = sum(b.accs.map(function (a) { return bal[a] || 0; }));
    return b.kind === 'rev' ? -v : v;
  };
  // Adverse variance %: cost above budget or revenue / profit below budget is positive (bad).
  M.budStatus = function (kind, b, a) {
    var c = S().budCfg; if (!b) return a ? 'over' : 'ontrack';
    var v = (kind === 'rev' || kind === 'profit') ? (b - a) / b * 100 : (a - b) / b * 100;
    if (kind === 'capex' && v < 0) return 'ontrack';
    return v <= c.good ? 'good' : v <= c.ontrack ? 'ontrack' : v <= c.watch ? 'watch' : v <= c.over ? 'over' : 'critical';
  };
  // Budget vs actual for one month (pro-rated to today in the running month) or year-to-date.
  M.budVsActual = function (ctx, p, o) {
    if (!can(ctx, 'bud.view')) return null;
    o = o || {}; p = p || M.lastClosed();
    var cur = M.curPeriod(), ps = o.ytd ? monthsTo(p) : [p], frac = 1, to = mEnd(p);
    if (p === cur) { frac = (+M.today().slice(8)) / daysIn(p); to = M.today(); }
    var from = ps[0] + '-01';
    var rows = S().bud.map(function (b) {
      var bud = sum(ps.map(function (m) { return (b.m[m] || 0) * (m === cur ? frac : 1); })), act = M.budActual(b, from, to);
      var adverse = bud ? r1(((b.kind === 'rev' || b.kind === 'profit') ? (bud - act) : (act - bud)) / bud * 100) : null;
      return { k: b.k, n: b.n, kind: b.kind, cc: b.cc, accs: b.accs, b: Math.round(bud), a: Math.round(act), v: Math.round(act - bud), vp: bud ? r1((act - bud) / bud * 100) : null, adverse: adverse, st: M.budStatus(b.kind, bud, act) };
    });
    var cnt = {}; rows.forEach(function (r) { cnt[r.st] = (cnt[r.st] || 0) + 1; });
    return { p: p, ytd: !!o.ytd, from: from, to: to, pro: p === cur ? r2(frac) : null, rows: rows, cnt: cnt, cfg: S().budCfg, perSt: M.perSt(p + '-01') };
  };
  M.budSeries = function (k) {
    var b = M.budLine(k); if (!b) return [];
    return monthsTo(M.curPeriod()).map(function (m) { var cur = m === M.curPeriod(), to = cur ? M.today() : mEnd(m); return { p: m, b: b.m[m] || 0, a: Math.round(M.budActual(b, m + '-01', to)), mtd: cur }; });
  };
  M.budDash = function (ctx) {
    if (!can(ctx, 'bud.view')) return null;
    var p = M.lastClosed(), mo = M.budVsActual(ctx, p), ytd = M.budVsActual(ctx, p, { ytd: true }), mtd = M.budVsActual(ctx, M.curPeriod());
    var worst = mo.rows.filter(function (r) { return r.adverse != null && r.kind !== 'capex'; }).sort(function (a, b) { return b.adverse - a.adverse; }).slice(0, 3);
    return { p: p, month: mo, ytd: ytd, mtd: mtd, worst: worst, rev: M.budSeries('revenue'), np: M.budSeries('netprofit'), hist: S().budHist.slice().reverse() };
  };
  M.setBudget = function (ctx, k, p, amt, reason) {
    if (!can(ctx, 'bud.edit')) return deny(ctx, 'budget ' + k);
    var b = M.budLine(k); if (!b || !(p in b.m)) return bad(M.MSG.notfound, 'notfound');
    if (!str(T(reason))) return bad(M.MSG.reason, 'reason');
    var v = num(amt); if (v == null || isNaN(v) || v < 0) return bad(M.MSG.invalid, 'amount');
    if (M.perSt(p + '-01') !== 'open') return bad(L('Budget periode yang sudah ditutup tidak diubah. Catat di periode berjalan.', 'A closed period\'s budget is not changed. Record it in the running period.'), 'closed');
    var from = b.m[p]; b.m[p] = Math.round(v);
    S().budHist.push({ at: nowS(), by: empId(ctx), k: k, p: p, from: from, to: b.m[p], reason: reason });
    M.audit('BUDGET.CHANGE', ctx, { rec: k + ' ' + p, from: from, to: b.m[p], reason: reason }); save();
    return { ok: true, line: b };
  };
  M.setBudCfg = function (ctx, o, reason) {
    if (!can(ctx, 'bud.edit')) return deny(ctx, 'budget cfg');
    if (!str(T(reason))) return bad(M.MSG.reason, 'reason');
    var c = S().budCfg, n = { good: num(o.good), ontrack: num(o.ontrack), watch: num(o.watch), over: num(o.over) };
    if ([n.good, n.ontrack, n.watch, n.over].some(function (x) { return x == null || isNaN(x); }) || !(n.good < n.ontrack && n.ontrack < n.watch && n.watch < n.over)) return bad(L('Ambang harus naik: Good < On Track < Watch < Over.', 'Thresholds must rise: Good < On Track < Watch < Over.'), 'order');
    S().budCfgHist.push(Object.assign({}, c, { until: M.today() }));
    S().budCfg = Object.assign(n, { v: c.v + 1, eff: M.today(), by: empId(ctx), reason: reason });
    M.audit('BUDGET.CHANGE', ctx, { rec: 'thresholds', from: 'v' + c.v, to: 'v' + (c.v + 1), reason: reason }); save();
    return { ok: true, cfg: S().budCfg };
  };

  /* ---------- Reconciliation centre (§61–§62): book vs external / physical, with evidence and reviewer ---------- */
  M.RECON_ST = { matched: [L('Cocok', 'Matched'), 'ok'], diff: [L('Selisih', 'Difference'), 'crit'], review: [L('Review', 'Review'), 'appr'], unmatched: [L('Belum Cocok', 'Unmatched'), 'warn'] };
  M.reconCenter = function (ctx) {
    if (!can(ctx, 'rec.do') && !can(ctx, 'fin.gl.view')) return null;
    var s = S(), out = [], sign = s.recSign;
    function row(k, n, book, ext, extN, ev, scr, o) {
      var diff = Math.round(ext - book), sg = sign[k], st = Math.abs(diff) < 1 ? (o && o.review ? 'review' : 'matched') : (sg && sg.note ? 'review' : 'diff');
      if (o && o.st) st = o.st;
      out.push(Object.assign({ k: k, n: n, book: Math.round(book), ext: Math.round(ext), extN: extN, diff: diff, st: st, ev: ev, by: sg ? sg.by : null, at: sg ? sg.at : null, note: sg ? sg.note : null, scr: scr }, o || {}));
    }
    var b = M.bankRecon(Object.assign({}, ctx, { perms: (ctx.perms || []).concat(['cash.view']) }), 'ACC-01');
    if (b) {
      var bst = b.done && b.done.at ? 'matched' : b.counts.diff ? 'diff' : b.counts.unmatched ? 'unmatched' : 'review';
      out.push({ k: 'bank', n: L('Bank BCA Operasional vs rekening koran', 'BCA Operating bank vs statement'), book: b.book, ext: b.stmtEnd, extN: L('Rekening koran 1–5 Okt', 'Statement 1–5 Oct'), diff: b.diff, st: bst,
        ev: L(b.counts.matched + ' cocok · ' + b.counts.unmatched + ' belum cocok · ' + b.counts.diff + ' selisih', b.counts.matched + ' matched · ' + b.counts.unmatched + ' unmatched · ' + b.counts.diff + ' difference'), by: b.done && b.done.by || null, at: b.done && b.done.at || null, scr: 'CASH-005' });
    }
    D.RECON_OTHER.forEach(function (x) {
      var acc = M.cashAcc(x[1]); row(x[0], x[2], M.accBal(x[1]), x[3], L('Hitung fisik ' + x[4], 'Physical count ' + x[4]), L('Berita acara hitung kas · ' + M.empName(x[5]), 'Cash count record · ' + M.empName(x[5])), 'CASH-002', { rec: x[1], counter: x[5], countAt: x[4], acc: acc && acc.n });
    });
    var arSub = sum(s.inv.filter(function (i) { return ['issued', 'partial', 'overdue', 'paid'].indexOf(M.invSt(i)) >= 0; }).map(M.openOf));
    row('ar', L('Piutang usaha (1200) vs subledger invoice', 'Accounts receivable (1200) vs invoice subledger'), M.natural('1200'), arSub, L('Subledger invoice terbuka', 'Open invoice subledger'), L(s.inv.length + ' invoice', s.inv.length + ' invoices'), 'AR-004');
    var brSub = sum(s.br.filter(function (x) { return x.st !== 'invoiced'; }).map(M.brAmount));
    row('br', L('Pendapatan belum ditagih (1210) vs Billing Ready', 'Unbilled revenue (1210) vs Billing Ready'), M.natural('1210'), brSub, L('Billing Ready belum diinvoice', 'Billing Ready not yet invoiced'), L(s.br.filter(function (x) { return x.st !== 'invoiced'; }).length + ' baris Billing Ready', s.br.filter(function (x) { return x.st !== 'invoiced'; }).length + ' Billing Ready lines'), 'AR-001');
    var apSub = sum(s.exp.filter(function (e) { return ['approved', 'scheduled', 'partial'].indexOf(e.st) >= 0 && !M.isLiabCoa(e.coa); }).map(function (e) { return e.amt + e.tax - e.paid; }));
    row('ap', L('Utang usaha (2100) vs subledger AP', 'Accounts payable (2100) vs AP subledger'), M.natural('2100'), apSub, L('Invoice supplier disetujui belum dibayar', 'Approved unpaid supplier invoices'), L('Hanya invoice yang sudah disetujui yang dijurnal', 'Only approved invoices are journalised'), 'AP-003');
    if (M.grniTarget) row('grni', L('Barang diterima belum ditagih (2150) vs GRN', 'Goods received not invoiced (2150) vs GRN'), M.natural('2150'), M.grniTarget(s), L('GRN tanpa invoice supplier', 'GRNs without a supplier invoice'), L('Three-way match', 'Three-way match'), 'PUR-006');
    if (M.stockValueByGl) {
      var sv = M.stockValueByGl(s), sub = sum(Object.keys(sv).map(function (g) { return sv[g]; })), gl = M.natural('1310') + M.natural('1320') + M.natural('1330');
      row('inv', L('Persediaan (1310–1330) vs subledger stok', 'Inventory (1310–1330) vs stock subledger'), gl, sub, L('Qty × harga rata-rata', 'Qty × average cost'), L(s.stock.length + ' item stok', s.stock.length + ' stock items'), 'INV-002');
      var on = (s.opname || []).filter(function (o) { return o.st === 'review' || o.st === 'counting'; })[0];
      if (on) { var vv = M.opnameVar(on), varV = sum(vv.map(function (l) { return l.varV || 0; })), sysV = sum(vv.map(function (l) { return Math.round(l.sys * (l.it ? l.it.avg : 0)); }));
        out.push({ k: 'opname', n: L('Stok sistem vs hitung fisik ' + on.id, 'System stock vs physical count ' + on.id), book: sysV, ext: sysV + varV, extN: L('Stock opname ' + on.date, 'Stock count ' + on.date), diff: varV, st: 'review', ev: L(vv.length + ' item dihitung · menunggu persetujuan', vv.length + ' items counted · waiting for approval'), by: on.by || null, at: null, scr: 'INV-005', rec: on.id }); }
    }
    if (M.faTargets) { var fa = M.faTargets(s); row('fa', L('Aset tetap (15xx) vs register aset', 'Fixed assets (15xx) vs asset register'), M.natural('1510') + M.natural('1520') + M.natural('1530') + M.bal('1590'), sum(Object.keys(fa).map(function (g) { return fa[g]; })), L('NBV register', 'Register NBV'), L(s.assets.length + ' aset', s.assets.length + ' assets'), 'AST-002'); }
    var cnt = {}; out.forEach(function (r) { cnt[r.st] = (cnt[r.st] || 0) + 1; });
    return { rows: out, cnt: cnt, at: nowS() };
  };
  // Sign off one reconciliation; a remaining difference needs an explanation (it is never silently cleared).
  M.reconSign = function (ctx, k, note) {
    if (!can(ctx, 'rec.do')) return deny(ctx, 'recon ' + k);
    if (k === 'bank') return M.reconComplete(ctx, 'ACC-01');
    var rc = M.reconCenter(ctx), r = by(rc.rows, 'k', k); if (!r) return bad(M.MSG.notfound, 'notfound');
    if (r.k === 'opname') return bad(L('Selisih stock opname diselesaikan lewat persetujuan opname.', 'A stock count difference is settled through the stock count approval.'), 'opname');
    if (r.diff && !str(note)) return bad(L('Ada selisih. Tulis penjelasan dan bukti sebelum sign-off.', 'There is a difference. Write an explanation and evidence before signing off.'), 'reason');
    S().recSign[k] = { by: empId(ctx), at: nowS(), note: str(note) || null, diff: r.diff };
    M.audit('RECON.COMPLETE', ctx, { rec: k, to: r.diff ? 'diff ' + r.diff : 'matched', reason: note || null }); save();
    return { ok: true };
  };

  /* ---------- Monthly close (§63): checklist gates CLOSE PERIOD ---------- */
  M.CLOSE_ITEMS = [['bank', L('Bank direkonsiliasi', 'Bank Reconciled'), 'CASH-005'], ['ar', L('AR direview', 'AR Reviewed'), 'AR-004'], ['ap', L('AP direview', 'AP Reviewed'), 'AP-003'], ['inv', L('Persediaan diverifikasi', 'Inventory Verified'), 'INV-005'],
    ['dep', L('Penyusutan diposting', 'Depreciation Posted'), 'AST-004'], ['accrual', L('Review akrual', 'Accrual Review'), 'ACC-003'], ['pl', L('Review laba rugi', 'P&L Review'), 'ACC-001'], ['bs', L('Review neraca', 'Balance Sheet Review'), 'ACC-001']];
  function closeAuto(p, k) {
    var s = S();
    if (k === 'dep') return (s.depPosted || {})[p] ? { ok: true } : { ok: false, why: L('Penyusutan ' + p + ' belum diposting.', 'Depreciation for ' + p + ' is not posted yet.') };
    if (k === 'inv') { var o = (s.opname || []).filter(function (x) { return ym(x.date || x.at) === p && x.st !== 'approved' && x.st !== 'cancelled'; })[0]; return o ? { ok: false, why: L('Stock opname ' + o.id + ' belum disetujui.', 'Stock count ' + o.id + ' is not approved yet.'), rec: o.id } : { ok: true }; }
    if (k === 'bs') { var b = M.bs(mEnd(p)); return b.check === 0 ? { ok: true } : { ok: false, why: L('Neraca tidak seimbang.', 'The balance sheet does not balance.') }; }
    if (k === 'bank' && p === M.curPeriod()) { var r = (s.recon || {})['ACC-01']; return r && r.at ? { ok: true } : { ok: false, why: L('Rekonsiliasi bank bulan ini belum selesai.', 'This month\'s bank reconciliation is not complete.') }; }
    if (k === 'ar') { var d = s.inv.filter(function (i) { return ['draft', 'review', 'approved'].indexOf(i.st) >= 0 && ym(i.period ? i.period + '-01' : i.issued || '') <= p; }); return d.length ? { ok: false, why: L(d.length + ' invoice periode ini belum terbit.', d.length + ' invoices of this period are not issued yet.') } : { ok: true }; }
    if (k === 'ap') { var v = s.exp.filter(function (e) { return ym(e.date) <= p && ['received', 'verify'].indexOf(e.st) >= 0; }); return v.length ? { ok: true, warn: L(v.length + ' invoice supplier masih verifikasi: akrualkan bila perlu.', v.length + ' supplier invoices still in verification: accrue if needed.') } : { ok: true }; }
    return { ok: true };
  }
  M.closeStatus = function (p) {
    var c = S().close[p] = S().close[p] || {};
    var items = M.CLOSE_ITEMS.map(function (x) { var it = c[x[0]] || { st: 'open' }, a = closeAuto(p, x[0]); return { k: x[0], n: x[1], scr: x[2], st: it.st, by: it.by || null, at: it.at || null, note: it.note || null, auto: a }; });
    var done = items.filter(function (i) { return i.st === 'done'; }).length;
    return { p: p, perSt: M.perSt(p + '-01'), items: items, done: done, total: items.length, ready: done === items.length };
  };
  M.closeCheck = function (p) { var cs = M.closeStatus(p); return { ok: cs.ready, missing: cs.items.filter(function (i) { return i.st !== 'done'; }).map(function (i) { return i.k; }) }; };
  M.closeTick = function (ctx, p, k, note) {
    if (!can(ctx, 'rec.do') && !can(ctx, 'fin.close')) return deny(ctx, 'close ' + p);
    var ps = M.perSt(p + '-01'); if (ps === 'closed' || ps === 'locked') return bad(M.MSG.closed, 'closed');
    if (!by(M.CLOSE_ITEMS.map(function (x) { return { k: x[0] }; }), 'k', k)) return bad(M.MSG.notfound, 'notfound');
    var a = closeAuto(p, k); if (!a.ok) return bad(a.why, 'auto', { rec: a.rec || null });
    var c = S().close[p] = S().close[p] || {}; c[k] = { st: 'done', by: empId(ctx), at: nowS(), note: str(note) || null };
    M.audit('CLOSE.ITEM', ctx, { rec: p + ' ' + k, to: 'done', reason: note || null }); save();
    return { ok: true, status: M.closeStatus(p) };
  };
  M.closeUntick = function (ctx, p, k, reason) {
    if (!can(ctx, 'fin.close')) return deny(ctx, 'close ' + p);
    var ps = M.perSt(p + '-01'); if (ps === 'closed' || ps === 'locked') return bad(M.MSG.closed, 'closed');
    if (!str(reason)) return bad(M.MSG.reason, 'reason');
    var c = S().close[p] || {}; if (!c[k]) return bad(M.MSG.notfound, 'notfound');
    c[k] = { st: 'open', by: null, at: null, note: null }; M.audit('CLOSE.ITEM', ctx, { rec: p + ' ' + k, to: 'open', reason: reason }); save();
    return { ok: true };
  };

  /* ---------- Cash flow by activity (direct method from the ledger) ---------- */
  var CASH_COA = D.CASH_ACC.map(function (a) { return a.coa; });
  M.cashFlow = function (from, to) {
    var o = { op: 0, inv: 0, fin: 0, opIn: 0, opOut: 0 };
    S().jv.forEach(function (j) {
      if (!(j.st === 'posted' || j.st === 'reversed' || j.st === 'adjust') || j.kind === 'open' || j.date < from || j.date > to) return;
      var c = sum(j.lines.filter(function (l) { return CASH_COA.indexOf(l.a) >= 0; }).map(function (l) { return l.d - l.c; }));
      if (!c) return;
      var k = j.lines.some(function (l) { return /^15/.test(l.a); }) ? 'inv' : j.lines.some(function (l) { return l.a === '2500' || /^3/.test(l.a); }) ? 'fin' : 'op';
      o[k] += c; if (k === 'op') { if (c > 0) o.opIn += c; else o.opOut += -c; }
    });
    return o;
  };
  function cashBank(asOf) { return sum(CASH_COA.map(function (c) { return M.natural(c, asOf); })); }
  function restricted(asOf) { return sum(D.CASH_ACC.filter(function (a) { return a.restricted; }).map(function (a) { return M.natural(a.coa, asOf); })); }

  /* ---------- BEP and margin of safety (§68) ---------- */
  // Fixed cost ÷ contribution margin ratio; semi-variable costs split by D.SEMI_VAR (cost behaviour §23).
  M.bepCalc = function (p) {
    p = p || M.lastClosed();
    var pl = M.pl(p + '-01', p === M.curPeriod() ? M.today() : mEnd(p)), lines = [], fixed = 0, variable = 0;
    pl.cogs.concat(pl.opex).forEach(function (x) { var b = D.BEHAVIOR[x.c] || 'fixed', vv = b === 'var' ? x.v : b === 'semi' ? x.v * D.SEMI_VAR : 0; variable += vv; fixed += x.v - vv; lines.push({ c: x.c, n: x.n, v: x.v, beh: b, var: vv, fix: x.v - vv }); });
    var oth = -pl.other; if (oth > 0) { fixed += oth; lines.push({ c: '7200', n: M.accName('7200'), v: oth, beh: 'fixed', var: 0, fix: oth }); }
    var rev = pl.revenue, cmr = rev ? (rev - variable) / rev : 0, bep = cmr > 0 ? fixed / cmr : null;
    return { p: p, revenue: rev, variable: variable, fixed: fixed, cm: rev - variable, cmr: r1(cmr * 100), bep: bep, mos: bep == null ? null : rev - bep, mosPct: bep == null || !rev ? null : r1((rev - bep) / rev * 100), lines: lines, semi: D.SEMI_VAR };
  };

  /* ---------- NP-12 the 12 core ratios (§66–§69) ---------- */
  M.RATIO_ST = { healthy: [L('Healthy', 'Healthy'), 'ok'], watch: [L('Watch', 'Watch'), 'warn'], critical: [L('Critical', 'Critical'), 'crit'], info: [L('Information', 'Information'), 'info'] };
  M.RATIOS = [
    { k: 'current', n: L('Current Ratio', 'Current Ratio'), u: 'x', live: true, f: L('Aset lancar ÷ liabilitas lancar', 'Current assets ÷ current liabilities') },
    { k: 'quick', n: L('Quick Ratio', 'Quick Ratio'), u: 'x', live: true, f: L('(Kas + bank + piutang + pendapatan belum ditagih) ÷ liabilitas lancar', '(Cash + bank + AR + unbilled revenue) ÷ current liabilities') },
    { k: 'cash', n: L('Cash Ratio', 'Cash Ratio'), u: 'x', live: true, f: L('(Kas + bank) ÷ liabilitas lancar', '(Cash + bank) ÷ current liabilities') },
    { k: 'ocf', n: L('Operating Cash Flow Ratio', 'Operating Cash Flow Ratio'), u: 'x', f: L('Arus kas operasi 3 bulan terakhir ÷ liabilitas lancar akhir periode', 'Operating cash flow of the last 3 months ÷ current liabilities at period end') },
    { k: 'runway', n: L('Cash Runway', 'Cash Runway'), u: 'mo', f: L('Kas tersedia (tanpa rekening dibatasi) ÷ rata-rata kas keluar operasi bruto per bulan (3 bulan)', 'Available cash (excluding restricted accounts) ÷ average gross operating cash out per month (3 months)') },
    { k: 'gpm', n: L('Gross Profit Margin', 'Gross Profit Margin'), u: '%', f: L('Laba kotor ÷ pendapatan × 100%', 'Gross profit ÷ revenue × 100%') },
    { k: 'npm', n: L('Net Profit Margin', 'Net Profit Margin'), u: '%', f: L('Laba bersih ÷ pendapatan × 100%', 'Net profit ÷ revenue × 100%') },
    { k: 'dso', n: L('DSO', 'DSO'), u: 'd', f: L('Rata-rata piutang ÷ pendapatan kredit × hari (3 bulan)', 'Average AR ÷ credit revenue × days (3 months)') },
    { k: 'ccc', n: L('Cash Conversion Cycle', 'Cash Conversion Cycle'), u: 'd', f: L('DSO + DIO − DPO', 'DSO + DIO − DPO') },
    { k: 'de', n: L('Debt-to-Equity', 'Debt-to-Equity'), u: 'x', live: true, f: L('Total liabilitas ÷ ekuitas (definisi terkonfigurasi: total liabilitas)', 'Total liabilities ÷ equity (configured definition: total liabilities)') },
    { k: 'roi', n: L('ROI', 'ROI'), u: '%', f: L('Laba bersih disetahunkan ÷ nilai perolehan aset produktif × 100%', 'Annualised net profit ÷ acquisition cost of productive assets × 100%') },
    { k: 'mos', n: L('BEP + Margin of Safety', 'BEP + Margin of Safety'), u: '%', f: L('BEP = biaya tetap ÷ rasio margin kontribusi · MoS % = (pendapatan − BEP) ÷ pendapatan × 100%', 'BEP = fixed cost ÷ contribution margin ratio · MoS % = (revenue − BEP) ÷ revenue × 100%') }
  ];
  M.ratioDef = function (k) { return by(M.RATIOS, 'k', k); };
  M.thAt = function (k, date) { var l = S().rth.filter(function (t) { return t.k === k && t.eff <= (date || M.today()); }).sort(function (a, b) { return b.v - a.v; }); return l[0] || null; };
  M.thHist = function (k) { return S().rth.filter(function (t) { return t.k === k; }).sort(function (a, b) { return b.v - a.v; }); };
  M.ratioStatus = function (v, th) {
    if (v == null || isNaN(v) || !th) return 'info';
    if (th.dir === 'lower') return v <= th.target ? 'healthy' : v <= th.crit ? 'watch' : 'critical';
    return v >= th.target ? 'healthy' : v >= th.crit ? 'watch' : 'critical';
  };
  // 0–100 score of a ratio against its threshold (feeds the health score).
  M.ratioScore = function (v, th) {
    if (v == null || isNaN(v) || !th) return null;
    var t = th.target, w = th.watch, c = th.crit, x;
    if (th.dir === 'lower') { if (v <= t) return 100; if (v <= w) return r0(75 + 25 * (w - v) / (w - t)); if (v <= c) return r0(40 + 35 * (c - v) / (c - w)); x = 40 - 40 * (v - c) / c; return r0(clamp(x, 0, 40)); }
    if (v >= t) return 100; if (v >= w) return r0(75 + 25 * (v - w) / (t - w)); if (v >= c) return r0(40 + 35 * (v - c) / (w - c)); return r0(clamp(40 * v / c, 0, 40));
  };
  function ratioVal(k, p, asOf) {
    var b, pl, x = {}, inp = [];
    function I(n, v, src, u) { inp.push({ n: n, v: v, src: src, u: u || 'Rp' }); }
    var SRC_BS = L('Neraca (ledger) per ' + asOf, 'Balance sheet (ledger) at ' + asOf), SRC_PL = L('Laba rugi (ledger) ' + p, 'P&L (ledger) ' + p);
    if (k === 'current' || k === 'quick' || k === 'cash' || k === 'de') {
      b = M.bs(asOf); var cb = cashBank(asOf), ar = M.natural('1200', asOf), br = M.natural('1210', asOf);
      if (k === 'current') { I(L('Aset lancar', 'Current assets'), b.CA, SRC_BS); I(L('Liabilitas lancar', 'Current liabilities'), b.CL, SRC_BS); x.v = b.CL ? b.CA / b.CL : null; }
      if (k === 'quick') { I(L('Kas + bank', 'Cash + bank'), cb, SRC_BS); I(L('Piutang usaha', 'Accounts receivable'), ar, L('Subledger invoice = GL 1200', 'Invoice subledger = GL 1200')); I(L('Pendapatan belum ditagih', 'Unbilled revenue'), br, L('Billing Ready Fase 9 = GL 1210', 'Phase 9 Billing Ready = GL 1210')); I(L('Liabilitas lancar', 'Current liabilities'), b.CL, SRC_BS); x.v = b.CL ? (cb + ar + br) / b.CL : null; }
      if (k === 'cash') { I(L('Kas + bank', 'Cash + bank'), cb, L('7 rekening kas & bank', '7 cash & bank accounts')); I(L('Liabilitas lancar', 'Current liabilities'), b.CL, SRC_BS); x.v = b.CL ? cb / b.CL : null; }
      if (k === 'de') { I(L('Total liabilitas', 'Total liabilities'), b.L, SRC_BS); I(L('Ekuitas (termasuk laba berjalan)', 'Equity (incl. current-year profit)'), b.EQ, SRC_BS); x.v = b.EQ ? b.L / b.EQ : null; }
      return { v: x.v, inp: inp };
    }
    if (k === 'ocf') { var f3 = mAdd(p, -2) + '-01', cf = M.cashFlow(f3, mEnd(p)), cl = M.bs(mEnd(p)).CL; I(L('Arus kas operasi ' + mAdd(p, -2) + '…' + p, 'Operating cash flow ' + mAdd(p, -2) + '…' + p), cf.op, L('Jurnal kas, diklasifikasi per aktivitas', 'Cash journals, classified by activity')); I(L('Liabilitas lancar ' + mEnd(p), 'Current liabilities ' + mEnd(p)), cl, SRC_BS); return { v: cl ? cf.op / cl : null, inp: inp }; }
    if (k === 'runway') {
      var f = mAdd(p, -2) + '-01', c3 = M.cashFlow(f, mEnd(p)), burn = c3.opOut / 3, av = cashBank(asOf) - restricted(asOf);
      I(L('Kas tersedia', 'Available cash'), av, L('Kas + bank − rekening dibatasi (payroll, deposito jaminan)', 'Cash + bank − restricted accounts (payroll, guarantee deposit)')); I(L('Kas keluar operasi bruto / bulan', 'Gross operating cash out / month'), burn, L('Rata-rata ' + mAdd(p, -2) + '…' + p, 'Average ' + mAdd(p, -2) + '…' + p));
      return { v: burn ? av / burn : null, inp: inp };
    }
    if (k === 'gpm' || k === 'npm') { pl = M.plMonth(p); I(L('Pendapatan', 'Revenue'), pl.revenue, SRC_PL); if (k === 'gpm') { I(L('HPP (COGS)', 'COGS'), pl.cogsT, SRC_PL); I(L('Laba kotor', 'Gross profit'), pl.gross, SRC_PL); return { v: pl.gm, inp: inp }; } I(L('Laba bersih', 'Net profit'), pl.net, SRC_PL); return { v: pl.nm, inp: inp }; }
    if (k === 'dso') { var d = M.dso(p); I(L('Rata-rata piutang', 'Average AR'), d.avgAr, L('GL 1200 akhir bulan ' + d.periods.join(', '), 'GL 1200 month ends ' + d.periods.join(', '))); I(L('Pendapatan kredit', 'Credit revenue'), d.rev, L('Laba rugi ' + d.periods.join(', '), 'P&L ' + d.periods.join(', '))); I(L('Hari', 'Days'), d.days, '—', 'd'); return { v: d.v, inp: inp }; }
    if (k === 'ccc') {
      var dso = M.dso(p).v, dpo = M.dpo(p), invV = M.natural('1310', mEnd(p)) + M.natural('1320', mEnd(p)) + M.natural('1330', mEnd(p)), mat = M.natural('5100', mEnd(p), p + '-01') + M.natural('5200', mEnd(p), p + '-01'), dio = mat ? r1(invV / mat * daysIn(p)) : null;
      I('DSO', dso, L('Rasio DSO', 'DSO ratio'), 'd'); I(L('DIO (persediaan ÷ pemakaian bahan × hari)', 'DIO (inventory ÷ material usage × days)'), dio, L('GL 1310–1330 dan 5100–5200', 'GL 1310–1330 and 5100–5200'), 'd'); I(L('DPO (utang ÷ pembelian non-gaji × hari)', 'DPO (AP ÷ non-payroll purchases × days)'), dpo, L('GL 2100 dan HPP non-gaji', 'GL 2100 and non-payroll COGS'), 'd');
      return { v: dso == null || dio == null || dpo == null ? null : r1(dso + dio - dpo), inp: inp };
    }
    if (k === 'roi') {
      var ms = monthsTo(p), net = M.pl(ms[0] + '-01', mEnd(p)).net, ann = net / ms.length * 12, cost = sum(S().assets.filter(function (a) { return a.st !== 'disposed' && a.acq <= mEnd(p); }).map(function (a) { return a.cost; }));
      I(L('Laba bersih ' + ms[0] + '…' + p, 'Net profit ' + ms[0] + '…' + p), net, SRC_PL); I(L('Laba bersih disetahunkan', 'Annualised net profit'), ann, L('× 12 ÷ ' + ms.length + ' bulan', '× 12 ÷ ' + ms.length + ' months')); I(L('Nilai perolehan aset', 'Asset acquisition cost'), cost, L('Register aset', 'Asset register'));
      return { v: cost ? ann / cost * 100 : null, inp: inp };
    }
    if (k === 'mos') { var be = M.bepCalc(p); I(L('Pendapatan', 'Revenue'), be.revenue, SRC_PL); I(L('Biaya tetap', 'Fixed cost'), be.fixed, L('Perilaku biaya per akun (§23)', 'Cost behaviour per account (§23)')); I(L('Rasio margin kontribusi', 'Contribution margin ratio'), be.cmr, L('(Pendapatan − biaya variabel) ÷ pendapatan', '(Revenue − variable cost) ÷ revenue'), '%'); I(L('BEP pendapatan', 'BEP revenue'), be.bep, L('Biaya tetap ÷ CMR', 'Fixed cost ÷ CMR')); I(L('Margin of safety', 'Margin of safety'), be.mos, L('Pendapatan − BEP', 'Revenue − BEP')); return { v: be.mosPct, inp: inp, bep: be }; }
    return { v: null, inp: inp };
  }
  var TXT = {
    current: [L('Likuiditas jangka pendek', 'Short-term liquidity'), L('Aset lancar turun di bawah kewajiban jatuh tempo', 'Current assets fall below obligations due'), L('Jaga kas dan percepat penagihan', 'Protect cash and speed up collection')],
    quick: [L('Likuiditas tanpa persediaan', 'Liquidity without inventory'), L('Kewajiban tidak tertutup aset paling likuid', 'Obligations not covered by the most liquid assets'), L('Kurangi piutang lama, tunda belanja non-kritis', 'Reduce old receivables, defer non-critical spending')],
    cash: [L('Kas tunai menutup kewajiban lancar', 'Cash covers current liabilities'), L('Tergantung penagihan untuk membayar kewajiban', 'Dependent on collections to pay obligations'), L('Bangun cadangan kas', 'Build a cash reserve')],
    ocf: [L('Kemampuan operasi menghasilkan kas', 'Ability of operations to generate cash'), L('Laba tidak berubah menjadi kas', 'Profit is not turning into cash'), L('Periksa piutang, persediaan dan jadwal bayar supplier', 'Review receivables, inventory and supplier payment timing')],
    runway: [L('Berapa bulan kas menutup pengeluaran operasi bruto', 'How many months cash covers gross operating spending'), L('Gangguan penagihan cepat menekan kas', 'A collection disruption quickly squeezes cash'), L('Jangan memakai kas untuk capex besar tanpa pembiayaan', 'Do not spend cash on large capex without financing')],
    gpm: [L('Margin setelah HPP penuh termasuk delivery', 'Margin after full COGS including delivery'), L('Kenaikan HPP tidak diteruskan ke harga', 'HPP increases are not passed on to prices'), L('Review HPP dan harga layanan dengan margin rendah', 'Review HPP and the prices of low-margin services')],
    npm: [L('Laba bersih per rupiah pendapatan', 'Net profit per rupiah of revenue'), L('Biaya operasional tumbuh lebih cepat dari pendapatan', 'Operating cost grows faster than revenue'), L('Kendalikan overhead dan payroll ratio', 'Control overhead and the payroll ratio')],
    dso: [L('Kecepatan penagihan', 'Collection speed'), L('Kas tertahan di piutang', 'Cash is tied up in receivables'), L('Follow up AR > 60 hari dan janji bayar', 'Follow up AR > 60 days and promises to pay')],
    ccc: [L('Hari kas terikat di modal kerja', 'Days cash is tied up in working capital'), L('Modal kerja menyerap kas', 'Working capital absorbs cash'), L('Seimbangkan DSO, stok dan termin supplier', 'Balance DSO, stock and supplier terms')],
    de: [L('Struktur pendanaan', 'Funding structure'), L('Beban bunga dan risiko refinancing', 'Interest burden and refinancing risk'), L('Jaga utang tetap dalam batas sebelum ekspansi', 'Keep debt within limits before expansion')],
    roi: [L('Imbal hasil atas aset produktif', 'Return on productive assets'), L('Aset tidak menghasilkan laba sepadan', 'Assets do not earn a matching profit'), L('Naikkan utilisasi aset sebelum beli aset baru', 'Raise asset utilisation before buying new assets')],
    mos: [L('Jarak pendapatan dari titik impas', 'Distance of revenue from break-even'), L('Penurunan volume cepat menjadi rugi', 'A volume drop quickly turns into a loss'), L('Jaga biaya tetap; tambah volume bermargin', 'Hold fixed costs; add margin-positive volume')]
  };
  function fmtV(v, u) { if (v == null) return '—'; return u === '%' ? r1(v) + '%' : u === 'd' ? r1(v) + ' ' + T(L('hari', 'days')) : u === 'mo' ? r1(v) + ' ' + T(L('bulan', 'months')) : r2(v) + '×'; }
  M.fmtRatio = fmtV;
  function buildRatio(k, p) {
    var def = M.ratioDef(k), live = def.live, today = M.today(), asOf = live ? today : mEnd(p), prevP = mAdd(p, -1);
    var cur = ratioVal(k, p, asOf), prev = ratioVal(k, live ? p : prevP, live ? mEnd(p) : mEnd(prevP));
    // The latest closed period is judged against the thresholds in force today; older periods keep the threshold that applied then.
    var th = M.thAt(k, live || p === M.lastClosed() ? today : asOf), st = M.ratioStatus(cur.v, th), series = monthsTo(p).map(function (m) { return { p: m, v: ratioVal(k, m, mEnd(m)).v }; });
    if (live) series.push({ p: today, v: cur.v, live: true });
    var v = cur.v == null ? null : (def.u === 'x' ? r2(cur.v) : r1(cur.v)), pv = prev.v == null ? null : (def.u === 'x' ? r2(prev.v) : r1(prev.v));
    var dir = th ? th.dir : 'higher', delta = v != null && pv != null ? v - pv : null, better = delta == null || Math.abs(delta) < 1e-9 ? null : (dir === 'higher' ? delta > 0 : delta < 0);
    var t = TXT[k], gap = v != null && th ? (def.u === 'x' ? r2(v - th.target) : r1(v - th.target)) : null;
    var ins = st === 'healthy' ? L(T(def.n) + ' ' + fmtV(v, def.u) + ' memenuhi target ' + fmtV(th.target, def.u) + '.', T(def.n, 1) + ' ' + fmtV(v, def.u) + ' meets the ' + fmtV(th.target, def.u) + ' target.')
      : L(T(def.n) + ' ' + fmtV(v, def.u) + ' belum mencapai target ' + fmtV(th.target, def.u) + (better === false ? ' dan memburuk dari ' + fmtV(pv, def.u) : '') + '.', def.n[1] + ' ' + fmtV(v, def.u) + ' is short of the ' + fmtV(th.target, def.u) + ' target' + (better === false ? ' and worsened from ' + fmtV(pv, def.u) : '') + '.');
    return { k: k, n: def.n, u: def.u, f: def.f, live: !!live, v: v, prev: pv, delta: delta == null ? null : (def.u === 'x' ? r2(delta) : r1(delta)), better: better, trend: delta == null || Math.abs(delta) < 1e-9 ? 'flat' : delta > 0 ? 'up' : 'down',
      th: th, st: st, score: M.ratioScore(v, th), gap: gap, series: series, inp: cur.inp, bep: cur.bep || null,
      src: live ? L('Live dari ledger per ' + today + ' (pembanding: ' + mEnd(p) + ')', 'Live from the ledger at ' + today + ' (compared with ' + mEnd(p) + ')') : L('Periode ' + p + ' · status ' + T(M.PER_ST[M.perSt(p + '-01')][0]), 'Period ' + p + ' · status ' + M.PER_ST[M.perSt(p + '-01')][0][1]),
      fresh: live ? 'live' : (M.perSt(p + '-01') === 'open' ? 'today' : 'closed'), asOf: asOf, p: p, what: t[0], insight: ins, risk: st === 'healthy' ? L('Risiko rendah saat ini.', 'Low risk for now.') : t[1], rec: st === 'healthy' ? L('Pertahankan dan pantau tren.', 'Maintain and watch the trend.') : t[2] };
  }
  var rcache = { v: -1, key: '', val: null };
  M.ratios = function (ctx, p) {
    if (!can(ctx, 'cfo.view')) return null;
    p = p || M.lastClosed(); var key = p + '|' + M.today();
    if (rcache.v === M.ver() && rcache.key === key) return rcache.val;
    var list = M.RATIOS.map(function (d) { return buildRatio(d.k, p); });
    var val = { p: p, perSt: M.perSt(p + '-01'), live: M.today(), at: nowS(), list: list, cnt: { healthy: list.filter(function (r) { return r.st === 'healthy'; }).length, watch: list.filter(function (r) { return r.st === 'watch'; }).length, critical: list.filter(function (r) { return r.st === 'critical'; }).length } };
    rcache = { v: M.ver(), key: key, val: val }; return val;
  };
  M.ratio = function (ctx, k, p) { var r = M.ratios(ctx, p); return r ? by(r.list, 'k', k) : null; };
  M.ratioVal = function (k, p) { var x = M.ratios({ perms: ['cfo.view'] }, p); return x ? (by(x.list, 'k', k) || {}).v : null; };
  // §69 thresholds: a change is a new version with an effective date; past periods keep the version that applied.
  M.setThreshold = function (ctx, k, o, reason) {
    if (!can(ctx, 'cfo.th')) return deny(ctx, 'threshold ' + k);
    if (!M.ratioDef(k)) return bad(M.MSG.notfound, 'notfound');
    if (!str(T(reason))) return bad(M.MSG.reason, 'reason');
    var cur = M.thAt(k), n = { target: num(o.target), watch: num(o.watch), crit: num(o.crit) };
    if ([n.target, n.watch, n.crit].some(function (x) { return x == null || isNaN(x); })) return bad(M.MSG.invalid, 'invalid');
    var okOrder = cur.dir === 'lower' ? (n.target < n.watch && n.watch < n.crit) : (n.target > n.watch && n.watch > n.crit);
    if (!okOrder) return bad(cur.dir === 'lower' ? L('Untuk rasio "lebih rendah lebih baik": target < watch < critical.', 'For "lower is better" ratios: target < watch < critical.') : L('Untuk rasio "lebih tinggi lebih baik": target > watch > critical.', 'For "higher is better" ratios: target > watch > critical.'), 'order');
    var eff = o.eff || M.today(); if (eff < M.today()) return bad(L('Tanggal efektif tidak boleh mundur: periode lalu memakai ambang yang berlaku saat itu.', 'The effective date cannot be in the past: past periods keep the threshold that applied then.'), 'eff');
    var v = Math.max.apply(null, M.thHist(k).map(function (t) { return t.v; })) + 1;
    var rec = { k: k, v: v, eff: eff, target: n.target, watch: n.watch, crit: n.crit, dir: cur.dir, note: o.note || null, by: empId(ctx), at: nowS(), reason: reason };
    S().rth.push(rec); M.audit('RATIO.THRESHOLD', ctx, { rec: k, from: 'v' + cur.v + ' ' + cur.target, to: 'v' + v + ' ' + n.target + ' @' + eff, reason: reason }); save();
    return { ok: true, th: rec };
  };

  /* ---------- Decision models (§70–§79): versioned weights, total 100 ---------- */
  M.MODEL_N = { health: L('Skor Kesehatan Keuangan', 'Financial Health Score'), branch: L('Skor Buka Cabang', 'Branch Expansion Score'), sales: L('Skor Tambah Tim Sales', 'Sales Hiring Score'), machine: L('Skor Investasi Mesin', 'Machine Investment Score'),
    ops: L('Skor Tambah Tim Operasional', 'Operations Hiring Score'), client: L('Skor Kapasitas Klien Baru', 'New Client Capacity Score'), invest: L('Kapasitas Investasi', 'Investment Capacity'), pricing: L('Skor Review Harga', 'Pricing Review Score') };
  M.DIM_N = { liq: L('Likuiditas', 'Liquidity'), prof: L('Profitabilitas', 'Profitability'), cf: L('Arus Kas', 'Cash Flow'), wc: L('Modal Kerja', 'Working Capital'), solv: L('Solvabilitas', 'Solvency'), ret: L('Return / Efisiensi', 'Return / Efficiency'), grow: L('Pertumbuhan & BEP', 'Growth & BEP Safety'),
    fin: L('Kesehatan keuangan', 'Financial health'), mkt: L('Peluang pasar', 'Market opportunity'), cap: L('Kapasitas', 'Capacity'), ops: L('Operasional', 'Operations'), risk: L('Risiko', 'Risk'),
    pipe: L('Pipeline', 'Pipeline'), fu: L('Kapasitas follow-up', 'Follow-up capacity'), conv: L('Konversi', 'Conversion'), revp: L('Potensi revenue', 'Revenue potential'), mgn: L('Margin', 'Margin'),
    dem: L('Permintaan', 'Demand'), roi: 'ROI', sla: 'SLA', dt: L('Downtime', 'Downtime'),
    util: L('Utilisasi tenaga kerja', 'Labour utilisation'), ot: L('Lembur', 'Overtime'), queue: L('Antrian', 'Queue'), rewash: L('Rewash', 'Rewash'), payroll: L('Payroll ratio', 'Payroll ratio'), demand: L('Pertumbuhan permintaan', 'Demand growth'),
    wash: L('Kapasitas washing', 'Washing capacity'), dry: L('Kapasitas drying', 'Drying capacity'), labor: L('Kapasitas tenaga kerja', 'Labour capacity'),
    free: L('Free cash', 'Free cash'), ocf: L('Arus kas operasi', 'Operating cash flow'), runway: L('Cash runway', 'Cash runway'), debt: L('Kapasitas utang', 'Debt capacity'), npm: L('Net margin', 'Net margin'), mos: L('Margin of safety', 'Margin of safety'),
    hpp: L('Tren HPP', 'HPP trend'), cost: L('Biaya kimia, utilitas, tenaga kerja', 'Chemical, utility, labour cost'), client: L('Profitabilitas klien', 'Client profitability'), age: L('Waktu sejak ubah harga', 'Time since last price change'), quality: L('Kualitas & SLA', 'Quality & SLA'), comp: L('Harga pesaing', 'Competitor price') };
  M.modelAt = function (k) { var l = S().models.filter(function (m) { return m.k === k; }).sort(function (a, b) { return b.v - a.v; }); return l[0] || null; };
  M.modelHist = function (k) { return S().models.filter(function (m) { return m.k === k; }).sort(function (a, b) { return b.v - a.v; }); };
  M.validateWeights = function (ws) { var P = M.P; if (P && P.validateWeights) return P.validateWeights(ws); var t = r2(sum(ws)); return { ok: Math.abs(t - 100) < 0.005, total: t }; };
  M.setModel = function (ctx, k, weights, reason) {
    if (!can(ctx, 'cfo.model')) return deny(ctx, 'model ' + k);
    var cur = M.modelAt(k); if (!cur) return bad(M.MSG.notfound, 'notfound');
    if (!str(T(reason))) return bad(M.MSG.reason, 'reason');
    var w = cur.w.map(function (x) { var v = weights && weights[x[0]] != null ? num(weights[x[0]]) : x[1]; return [x[0], v]; });
    if (w.some(function (x) { return x[1] == null || isNaN(x[1]) || x[1] < 0; })) return bad(M.MSG.invalid, 'invalid');
    var vw = M.validateWeights(w.map(function (x) { return x[1]; })); if (!vw.ok) return bad(vw.msg || L('Total bobot harus 100%.', 'Weights must total 100%.'), 'weights', { total: vw.total });
    var rec = { k: k, v: cur.v + 1, eff: M.today(), w: w, by: empId(ctx), at: nowS(), reason: reason };
    S().models.push(rec); M.audit('MODEL.CHANGE', ctx, { rec: k, from: 'v' + cur.v, to: 'v' + rec.v + ' ' + w.map(function (x) { return x[0] + ' ' + x[1]; }).join(', '), reason: reason }); save();
    return { ok: true, model: rec };
  };
  // Weighted score with the full trail: input value, target, 0–100 score, weight, contribution.
  function weighted(k, parts) {
    var m = M.modelAt(k), rows = m.w.map(function (x) { var p = parts[x[0]] || { sc: null }; var sc = p.sc == null ? null : r0(clamp(p.sc, 0, 100)); return Object.assign({ k: x[0], n: M.DIM_N[x[0]] || L(x[0], x[0]), w: x[1], sc: sc, contrib: sc == null ? 0 : r1(sc * x[1] / 100) }, p, { sc: sc }); });
    var known = rows.filter(function (r) { return r.sc != null; }), wk = sum(known.map(function (r) { return r.w; }));
    var score = wk ? r0(sum(known.map(function (r) { return r.sc * r.w; })) / wk) : null;
    return { k: k, n: M.MODEL_N[k], v: m.v, eff: m.eff, rows: rows, score: score, missing: rows.filter(function (r) { return r.sc == null; }).map(function (r) { return r.k; }) };
  }
  function lin(v, bad0, good) { if (v == null || isNaN(v)) return null; return clamp((v - bad0) / (good - bad0) * 100, 0, 100); }

  /* ---------- Financial health score (§70) ---------- */
  M.HEALTH_BAND = [[80, 'healthy', L('Sehat', 'Healthy'), 'ok'], [65, 'watch', L('Perlu Perhatian', 'Watch'), 'warn'], [0, 'critical', L('Kritis', 'Critical'), 'crit']];
  M.band = function (s) { for (var i = 0; i < M.HEALTH_BAND.length; i++) if (s >= M.HEALTH_BAND[i][0]) return M.HEALTH_BAND[i]; return M.HEALTH_BAND[2]; };
  var DIMS = { liq: ['current', 'quick', 'cash'], prof: ['gpm', 'npm'], cf: ['ocf', 'runway'], wc: ['dso', 'ccc'], solv: ['de'], ret: ['roi'], grow: ['mos', 'growth'] };
  M.revGrowth = function (p) { p = p || M.lastClosed(); var a = M.plMonth(p).revenue, b = M.plMonth(mAdd(p, -1)).revenue; return b ? r1((a - b) / b * 100) : null; };
  M.health = function (ctx, p) {
    var R = M.ratios(ctx, p); if (!R) return null;
    var g = M.revGrowth(R.p), parts = {};
    Object.keys(DIMS).forEach(function (d) {
      var items = DIMS[d].map(function (k) { if (k === 'growth') return { k: 'growth', n: L('Pertumbuhan revenue MoM', 'Revenue growth MoM'), v: g, u: '%', sc: r0(lin(g, -3, 3)), st: g >= 3 ? 'healthy' : g >= 0 ? 'watch' : 'critical' }; var r = by(R.list, 'k', k); return { k: k, n: r.n, v: r.v, u: r.u, sc: r.score, st: r.st, th: r.th }; });
      parts[d] = { sc: avg(items.map(function (i) { return i.sc; })), items: items, v: null };
    });
    var w = weighted('health', parts), b = M.band(w.score);
    var weak = w.rows.slice().sort(function (a, b2) { return a.sc - b2.sc; }).slice(0, 2);
    return Object.assign(w, { p: R.p, band: b[1], bandN: b[2], tone: b[3], fresh: R.at, weak: weak, valid: M.validateWeights(w.rows.map(function (r) { return r.w; })),
      sum: L('Skor ' + w.score + ' (' + T(b[2]) + '). Terlemah: ' + weak.map(function (x) { return T(x.n) + ' ' + x.sc; }).join(', ') + '.', 'Score ' + w.score + ' (' + b[2][1] + '). Weakest: ' + weak.map(function (x) { return x.n[1] + ' ' + x.sc; }).join(', ') + '.') });
  };

  /* ---------- Combined decision engine (§71–§82) ---------- */
  M.DEC_OUT = {
    go: [L('Layak Dipertimbangkan', 'Worth Considering'), 'ok'], prepare: [L('Siapkan, Belum Sekarang', 'Prepare, Not Yet'), 'warn'], nogo: [L('Belum Layak', 'Not Yet Viable'), 'crit'], hold: [L('HOLD EXPANSION', 'HOLD EXPANSION'), 'crit'],
    add: [L('Tambah', 'Add'), 'ok'], keep: [L('Tahan', 'Hold'), 'info'], redistribute: [L('Redistribusi', 'Redistribute'), 'warn'], review: [L('Review', 'Review'), 'warn'],
    high: [L('Kebutuhan Tinggi', 'High Need'), 'crit'], medium: [L('Kebutuhan Sedang', 'Medium Need'), 'warn'], low: [L('Kebutuhan Rendah', 'Low Need'), 'ok'],
    invest: [L('Investasi Layak', 'Invest'), 'ok'], evaluate: [L('Evaluasi', 'Evaluate'), 'warn'], notneeded: [L('Belum Perlu', 'Not Needed'), 'info'],
    strongcap: [L('Kapasitas Kuat', 'Strong Capacity'), 'ok'], available: [L('Tersedia', 'Available'), 'ok'], limited: [L('Kapasitas Terbatas', 'Capacity Limited'), 'warn'], notrec: [L('Tidak Disarankan', 'Not Recommended'), 'crit'],
    strong: [L('Kuat', 'Strong'), 'ok'], moderate: [L('Moderat', 'Moderate'), 'warn'], weak: [L('Lemah', 'Weak'), 'crit'],
    maintain: [L('Pertahankan', 'Maintain'), 'ok'], increase: [L('Naikkan', 'Increase'), 'crit'], renegotiate: [L('Negosiasi Ulang', 'Renegotiate'), 'warn'],
    clear: [L('Tidak Ada Sinyal Hold', 'No Hold Signal'), 'ok'], caution: [L('Hati-hati', 'Caution'), 'warn']
  };
  var CARDS = [['branch', 'building'], ['sales', 'briefcase'], ['ops', 'users'], ['machine', 'washer'], ['client', 'hotel'], ['invest', 'coins'], ['pricing', 'tag'], ['hold', 'ban']];
  function opsCtx() { return { uid: 'cfo-engine', roleKey: 'owner', perms: ['com.client.view', 'com.opp.view', 'com.health.view', 'ast.view', 'price.view', 'prof.client', 'inv.view', 'hpp.view', 'ar.view', 'cash.view', 'cfo.view', 'bud.view', 'ap.view'] }; }
  function inp(n, v, u, src, o) { return Object.assign({ n: n, v: v, u: u || '', src: src }, o || {}); }
  function fresh(src, at, kind) { return { src: src, at: at, kind: kind || 'live' }; }
  function capacity() { return M.PR && M.PR.capacity ? M.PR.capacity() : {}; }
  function oppsAll() { var CM = M.CM; if (!CM || !CM.opps) return []; var c = opsCtx(); c.perms = c.perms.concat(Object.keys(CM.PERMS || {})); return CM.opps(c, {}) || []; }
  function dlvKpi() { return M.DL && M.DL.kpi ? M.DL.kpi(30) : null; }
  function pkpi(code) { var P = M.P; if (!P || !P.kpi) return null; var k = P.kpi(code); return k ? { v: P.actual(k), t: k.target, n: k.n } : null; }
  function stageInfo() {
    var cap = capacity(), hc = D.MARKET.opsHeadcount, ot = D.MARKET.overtime, out = [];
    [['wash', L('Washing', 'Washing')], ['dry', L('Drying', 'Drying')], ['fin', L('Finishing', 'Finishing')], ['pack', L('Packing', 'Packing')]].forEach(function (x) { var c = cap[x[0]] || {}; out.push({ k: x[0], n: x[1], pct: c.pct, load: c.load, cap: c.cap, hc: hc[x[0]], ot: ot[x[0]] }); });
    return out;
  }
  M.decision = function (ctx, k, p) {
    if (!can(ctx, 'cfo.view')) return null;
    var R = M.ratios(ctx, p), H = M.health(ctx, p), pp = R.p, rv = function (x) { return by(R.list, 'k', x); }, card = null, oc = opsCtx();
    var FR = fresh(L('Ledger ' + pp + ' + live ' + M.today(), 'Ledger ' + pp + ' + live ' + M.today()), R.at, 'mixed'), dk = dlvKpi(), stages = stageInfo();
    var trea = M.treasury(Object.assign({}, oc, { perms: ['cash.view'] }), 30), free = trea ? trea.free : null;
    if (k === 'hold') {
      var cr = rv('cash'), ds = rv('dso'), oc2 = rv('ocf'), gp = rv('npm'), de = rv('de'), ru = rv('runway');
      var sig = [
        { k: 'cash', n: L('Cash ratio turun', 'Cash ratio falling'), on: cr.better === false && cr.st !== 'healthy', v: fmtV(cr.v, 'x') + ' ← ' + fmtV(cr.prev, 'x') },
        { k: 'dso', n: L('DSO naik', 'DSO rising'), on: ds.better === false && ds.st !== 'healthy', v: fmtV(ds.v, 'd') + ' ← ' + fmtV(ds.prev, 'd') },
        { k: 'ocf', n: L('Arus kas operasi lemah', 'Operating cash flow weak'), on: oc2.st === 'critical', v: fmtV(oc2.v, 'x') },
        { k: 'npm', n: L('Margin menurun', 'Margin declining'), on: gp.better === false && gp.st !== 'healthy', v: fmtV(gp.v, '%') + ' ← ' + fmtV(gp.prev, '%') },
        { k: 'de', n: L('Utang tinggi', 'Debt high'), on: de.st === 'critical', v: fmtV(de.v, 'x') },
        { k: 'runway', n: L('Cash runway pendek', 'Cash runway short'), on: ru.st === 'critical', v: fmtV(ru.v, 'mo') }];
      var nOn = sig.filter(function (s) { return s.on; }).length, out = nOn >= 3 ? 'hold' : nOn === 2 ? 'caution' : 'clear';
      card = { score: null, out: out, signals: sig, n_on: nOn,
        sig: L(nOn + ' dari 6 sinyal hold aktif.', nOn + ' of 6 hold signals active.'), why: sig.filter(function (s) { return s.on; }).map(function (s) { return L(T(s.n) + ' (' + s.v + ')', s.n[1] + ' (' + s.v + ')'); }),
        impact: out === 'hold' ? L('Ekspansi sekarang menekan kas dan modal kerja yang sudah melemah.', 'Expanding now squeezes cash and working capital that are already weakening.') : L('Ekspansi bisa dievaluasi bila skor lain mendukung.', 'Expansion can be evaluated when other scores support it.'),
        rec: out === 'hold' ? L('HOLD EXPANSION. Perbaiki penagihan, margin, kas dan modal kerja dulu.', 'HOLD EXPANSION. Improve collection, margin, cash and working capital first.') : out === 'caution' ? L('Lanjutkan evaluasi dengan hati-hati; pantau dua sinyal aktif tiap minggu.', 'Continue evaluating carefully; watch the two active signals weekly.') : L('Tidak ada sinyal hold. Keputusan ekspansi tetap memakai skor gabungan.', 'No hold signal. Expansion decisions still use the combined scores.'),
        act: { n: out === 'clear' ? L('Lihat skor buka cabang', 'See the branch score') : L('Buka ratio detail', 'Open the ratio detail'), s: out === 'clear' ? 'CFO-004' : 'CFO-002', rec: out === 'clear' ? 'branch' : (sig.filter(function (s) { return s.on; })[0] || { k: 'cash' }).k },
        rows: sig.map(function (s) { return { k: s.k, n: s.n, v: s.v, sc: s.on ? 0 : 100, w: null, contrib: null, on: s.on, src: L('Rasio ' + s.k + ' · ' + pp, 'Ratio ' + s.k + ' · ' + pp) }; }), assume: [L('Hold bila ≥ 3 dari 6 sinyal aktif; hati-hati bila 2.', 'Hold when ≥ 3 of 6 signals are active; caution at 2.')] };
    }
    if (k === 'invest') {
      var cap = M.D.LOAN, deR = rv('de'), roiR = rv('roi'), mosR = rv('mos'), ocfR = rv('ocf'), ruR = rv('runway'), npmR = rv('npm');
      var debtRoom = deR.th ? Math.max(0, (deR.th.target - deR.v)) * M.bs().EQ : null;
      var w = weighted('invest', {
        free: inp(L('Free cash (30 hari)', 'Free cash (30 days)'), free, 'Rp', L('Treasury: kas tersedia − komitmen 30 hari', 'Treasury: available cash − 30-day commitments'), { sc: lin(free, 0, 1500 * JT), target: 1500 * JT }),
        ocf: inp(L('OCF ratio', 'OCF ratio'), ocfR.v, 'x', ocfR.src, { sc: ocfR.score, target: ocfR.th.target }),
        runway: inp(L('Cash runway', 'Cash runway'), ruR.v, 'mo', ruR.src, { sc: ruR.score, target: ruR.th.target }),
        debt: inp(L('Ruang utang sampai D/E target', 'Debt room up to the D/E target'), debtRoom, 'Rp', L('(target D/E − D/E) × ekuitas', '(target D/E − D/E) × equity'), { sc: deR.score, target: deR.th.target }),
        npm: inp(L('Net margin', 'Net margin'), npmR.v, '%', npmR.src, { sc: npmR.score, target: npmR.th.target }),
        roi: inp('ROI', roiR.v, '%', roiR.src, { sc: roiR.score, target: roiR.th.target }),
        mos: inp(L('Margin of safety', 'Margin of safety'), mosR.v, '%', mosR.src, { sc: mosR.score, target: mosR.th.target }) });
      var o2 = w.score >= 75 ? 'strong' : w.score >= 50 ? 'moderate' : 'weak';
      card = Object.assign(w, { out: o2, sig: L('Kapasitas investasi ' + T(M.DEC_OUT[o2][0]).toLowerCase() + ' (skor ' + w.score + ').', 'Investment capacity ' + M.DEC_OUT[o2][0][1].toLowerCase() + ' (score ' + w.score + ').'),
        why: w.rows.slice().sort(function (a, b) { return a.sc - b.sc; }).slice(0, 3).map(function (r) { return L(T(r.n) + ': skor ' + r.sc, r.n[1] + ': score ' + r.sc); }),
        impact: L('Capex di atas free cash akan memakai cadangan kas operasi atau utang baru.', 'Capex above free cash will use the operating cash reserve or new debt.'),
        rec: o2 === 'strong' ? L('Investasi dari kas dapat dipertimbangkan sampai batas free cash.', 'Cash-funded investment can be considered up to free cash.') : o2 === 'moderate' ? L('Investasi kecil–sedang dari kas; investasi besar butuh pembiayaan dan skenario.', 'Small–medium investment from cash; large investment needs financing and a scenario.') : L('Tunda capex besar; perkuat kas dulu.', 'Defer large capex; strengthen cash first.'),
        act: { n: L('Buka scenario builder', 'Open the scenario builder'), s: 'CFO-005' }, assume: [L('Free cash memakai komitmen 30 hari dari treasury.', 'Free cash uses the 30-day commitments from treasury.'), L('Ruang utang dihitung sampai target D/E, bukan batas bank.', 'Debt room is measured up to the D/E target, not the bank limit.')] });
    }
    if (k === 'branch') {
      var inv = M.decision(ctx, 'invest', p), hold = M.decision(ctx, 'hold', p), sd = D.MARKET.sanurDemand, util = pkpi('OPS-03'), qc = pkpi('QLT-01');
      var riskSc = avg([rv('de').score, rv('dso').score, rv('runway').score]);
      var w2 = weighted('branch', {
        fin: inp(L('Skor kesehatan keuangan', 'Financial health score'), H.score, '', L('Skor kesehatan ' + pp, 'Health score ' + pp), { sc: H.score, target: 80 }),
        mkt: inp(L('Permintaan Sanur (survei)', 'Sanur demand (survey)'), sd[0], '', L('Survei ' + sd[1] + ' · ' + M.empName(sd[2]), 'Survey ' + sd[1] + ' · ' + M.empName(sd[2])), { sc: sd[0], target: 75, assume: true, note: sd[3] }),
        cap: inp(L('Utilisasi kapasitas plant (tekanan kapasitas)', 'Plant capacity utilisation (capacity pressure)'), util ? util.v : null, '%', L('KPI OPS-03 Fase 5', 'Phase 5 KPI OPS-03'), { sc: lin(util ? util.v : null, 60, 95), target: 85 }),
        ops: inp(L('Kesiapan operasional (OTD & QC)', 'Operational readiness (OTD & QC)'), dk ? dk.otd : null, '%', L('Delivery 30 hari Fase 9 + QC Fase 5', 'Phase 9 30-day delivery + Phase 5 QC'), { sc: avg([lin(dk ? dk.otd : null, 90, 98), lin(qc ? qc.v : null, 94, 98)]), target: 97 }),
        risk: inp(L('Risiko (D/E, DSO, runway)', 'Risk (D/E, DSO, runway)'), riskSc == null ? null : r0(riskSc), '', L('Rasio ' + pp, 'Ratios ' + pp), { sc: riskSc, target: 80 }) });
      var strongN = w2.rows.filter(function (r) { return r.sc >= 60; }).length, scn = by(S().scn, 'id', 'SCN-03'), sc3 = scn ? M.scnCalc(scn.inp) : null;
      var finSt = by(stages, 'k', 'fin'), gates = [
        { k: 'dims', n: L('≥ 4 dari 5 dimensi ≥ 60', '≥ 4 of 5 dimensions ≥ 60'), ok: strongN >= 4 },
        { k: 'invest', n: L('Kapasitas investasi bukan Lemah', 'Investment capacity not Weak'), ok: inv.out !== 'weak' },
        { k: 'cash', n: L('Free cash ≥ porsi kas capex', 'Free cash ≥ cash share of capex'), ok: !!sc3 && free >= sc3.capexCash },
        { k: 'runway', n: L('Cash runway Healthy', 'Cash runway Healthy'), ok: rv('runway').st === 'healthy' },
        { k: 'plant', n: L('Plant Ubud tanpa bottleneck (semua tahap < 90%)', 'Ubud plant without a bottleneck (all stages < 90%)'), ok: !stages.some(function (s) { return s.pct >= 90; }) },
        { k: 'hold', n: L('Tidak ada HOLD EXPANSION', 'No HOLD EXPANSION'), ok: hold.out !== 'hold' }];
      var o3 = hold.out === 'hold' ? 'hold' : (w2.score >= 75 && gates.every(function (g) { return g.ok; })) ? 'go' : w2.score >= 60 ? 'prepare' : 'nogo';
      card = Object.assign(w2, { out: o3, strongN: strongN, gates: gates, sub: { invest: inv.out, hold: hold.out, scn: sc3 },
        sig: L('Skor cabang ' + w2.score + '; ' + strongN + ' dari 5 dimensi ≥ 60; kapasitas investasi ' + T(M.DEC_OUT[inv.out][0]).toLowerCase() + '.', 'Branch score ' + w2.score + '; ' + strongN + ' of 5 dimensions ≥ 60; investment capacity ' + M.DEC_OUT[inv.out][0][1].toLowerCase() + '.'),
        why: [L('Kesehatan keuangan ' + H.score + ' (bobot 40%)', 'Financial health ' + H.score + ' (weight 40%)'), L('Utilisasi plant ' + (util ? util.v : '—') + '% mendorong kebutuhan kapasitas', 'Plant utilisation ' + (util ? util.v : '—') + '% drives the need for capacity'),
          gates.filter(function (g) { return !g.ok; }).length ? L('Syarat belum terpenuhi: ' + gates.filter(function (g) { return !g.ok; }).map(function (g) { return T(g.n); }).join('; '), 'Conditions not met: ' + gates.filter(function (g) { return !g.ok; }).map(function (g) { return g.n[1]; }).join('; ')) : null,
          sc3 ? L('Capex Sanur ' + U.r0(sc3.capex / JT) + ' jt vs free cash ' + U.r0((free || 0) / JT) + ' jt; payback ' + (sc3.payback == null ? '—' : sc3.payback + ' bln'), 'Sanur capex ' + U.r0(sc3.capex / JT) + ' m vs free cash ' + U.r0((free || 0) / JT) + ' m; payback ' + (sc3.payback == null ? '—' : sc3.payback + ' months')) : null].filter(Boolean),
        impact: L('Membuka cabang terlalu cepat menekan runway; terlalu lambat membuat permintaan Sanur diambil pesaing.', 'Opening too early squeezes runway; too late lets competitors take Sanur demand.'),
        rec: o3 === 'go' ? L('Siapkan business case final dan pembiayaan; keputusan tetap di Owner.', 'Prepare the final business case and financing; the decision stays with the Owner.') : o3 === 'prepare' ? L('Belum buka sekarang. Siapkan: pembiayaan, validasi permintaan, dan atasi bottleneck finishing di Ubud dulu.', 'Do not open now. Prepare: financing, demand validation, and fix the Ubud finishing bottleneck first.') : o3 === 'hold' ? L('HOLD EXPANSION sampai sinyal hold hilang.', 'HOLD EXPANSION until the hold signals clear.') : L('Belum layak. Perkuat dimensi terlemah.', 'Not viable yet. Strengthen the weakest dimensions.'),
        act: { n: L('Bandingkan skenario Sanur', 'Compare the Sanur scenario'), s: 'CFO-006' }, assume: [L('Permintaan Sanur dari survei sales, bukan fakta transaksi.', 'Sanur demand comes from a sales survey, not transaction facts.'), L('Rekomendasi buka cabang butuh skor ≥ 75 dan semua 6 syarat terpenuhi: tidak pernah dari satu metrik.', 'A branch recommendation needs a score ≥ 75 and all 6 conditions met: never from one metric.')] });
    }
    if (k === 'sales') {
      var ops = oppsAll().filter(function (o) { return ['won', 'lost'].indexOf(o.stage) < 0; }), won = oppsAll().filter(function (o) { return o.stage === 'won'; }).length, lost = oppsAll().filter(function (o) { return o.stage === 'lost'; }).length;
      var rev = M.plMonth(pp).revenue, wp = sum(ops.map(function (o) { return o.weighted || o.rev * o.prob / 100; })), pot = sum(ops.map(function (o) { return o.rev; })), team = D.MARKET.salesTeam, capFu = D.MARKET.salesCapacity[0] * team, load = r0(ops.length / capFu * 100);
      var conv = won + lost ? r0(won / (won + lost) * 100) : null, mg = avg(ops.map(function (o) { return o.margin; }));
      var w3 = weighted('sales', {
        pipe: inp(L('Pipeline tertimbang / revenue bulanan', 'Weighted pipeline / monthly revenue'), r1(wp / rev * 100), '%', L('Peluang Fase 6 (' + ops.length + ' terbuka)', 'Phase 6 opportunities (' + ops.length + ' open)'), { sc: lin(wp / rev * 100, 0, 5), target: 5 }),
        fu: inp(L('Beban follow-up per sales', 'Follow-up load per salesperson'), load, '%', L(ops.length + ' peluang ÷ (' + D.MARKET.salesCapacity[0] + ' × ' + team + ' sales)', ops.length + ' opportunities ÷ (' + D.MARKET.salesCapacity[0] + ' × ' + team + ' sales)'), { sc: lin(load, 40, 100), target: 80, assume: true }),
        conv: inp(L('Konversi menang', 'Win conversion'), conv, '%', L('Peluang menang ÷ (menang + kalah)', 'Won ÷ (won + lost) opportunities'), { sc: lin(conv, 20, 50), target: 40 }),
        revp: inp(L('Potensi revenue pipeline / revenue', 'Pipeline revenue potential / revenue'), r1(pot / rev * 100), '%', L('Nilai bulanan peluang terbuka', 'Monthly value of open opportunities'), { sc: lin(pot / rev * 100, 0, 8), target: 8 }),
        mgn: inp(L('Margin rata-rata peluang', 'Average opportunity margin'), mg == null ? null : r1(mg), '%', L('Peluang Fase 6', 'Phase 6 opportunities'), { sc: lin(mg, 25, 40), target: 35 }) });
      var fuR = by(w3.rows, 'k', 'fu'), o4 = w3.score >= 70 && fuR.sc >= 80 ? 'add' : fuR.sc >= 80 && (by(w3.rows, 'k', 'conv').sc || 0) < 50 ? 'redistribute' : w3.score < 40 ? 'review' : 'keep';
      card = Object.assign(w3, { out: o4, sig: L(ops.length + ' peluang terbuka untuk ' + team + ' sales (beban ' + load + '%).', ops.length + ' open opportunities for ' + team + ' salesperson (load ' + load + '%).'),
        why: [L('Pipeline tertimbang ' + U.r1(wp / JT) + ' jt (' + r1(wp / rev * 100) + '% revenue)', 'Weighted pipeline ' + U.r1(wp / JT) + ' m (' + r1(wp / rev * 100) + '% of revenue)'), L('Beban follow-up ' + load + '% dari kapasitas', 'Follow-up load ' + load + '% of capacity')],
        impact: o4 === 'add' ? L('Peluang tidak ter-follow-up dan hilang.', 'Opportunities go unfollowed and are lost.') : L('Menambah sales sekarang menambah biaya tetap tanpa pipeline yang cukup.', 'Adding sales now adds fixed cost without enough pipeline.'),
        rec: o4 === 'add' ? L('Tambah 1 account executive.', 'Add one account executive.') : o4 === 'redistribute' ? L('Redistribusi akun dan latih closing sebelum menambah orang.', 'Redistribute accounts and coach closing before adding people.') : o4 === 'review' ? L('Review strategi pipeline; belum tambah tim.', 'Review the pipeline strategy; do not add to the team yet.') : L('Tahan. Kapasitas sales saat ini masih cukup; fokus konversi peluang besar.', 'Hold. Current sales capacity is still enough; focus on converting the large opportunities.'),
        act: { n: L('Lihat pipeline Fase 6', 'See the Phase 6 pipeline'), s: 'OPP-001' }, assume: [L('Kapasitas follow-up ' + D.MARKET.salesCapacity[0] + ' per sales per bulan (input sales ' + D.MARKET.salesCapacity[1] + ').', 'Follow-up capacity ' + D.MARKET.salesCapacity[0] + ' per salesperson per month (sales input ' + D.MARKET.salesCapacity[1] + ').')] });
    }
    if (k === 'ops') {
      var top = stages.slice().sort(function (a, b) { return (b.pct || 0) - (a.pct || 0); })[0], ots = avg(stages.map(function (s) { return s.ot; })), rw = pkpi('QLT-02'), payroll = M.plMonth(pp), pr = payroll.revenue ? r1((M.natural('5300', mEnd(pp), pp + '-01') + M.natural('6100', mEnd(pp), pp + '-01')) / payroll.revenue * 100) : null;
      var vg = M.revGrowth(pp), sla = dk ? dk.otd : null, qd = top.load && top.cap ? r1(Math.max(0, top.load - top.cap * 0.85) / (top.cap / 60)) : null;
      var w4 = weighted('ops', {
        util: inp(L('Beban tahap tertinggi (' + T(top.n) + ')', 'Highest stage load (' + top.n[1] + ')'), top.pct, '%', L('Kapasitas live Fase 8', 'Phase 8 live capacity'), { sc: lin(top.pct, 70, 98), target: 85 }),
        ot: inp(L('Lembur ' + T(top.n) + ' / bulan', top.n[1] + ' overtime / month'), top.ot, L('jam', 'h'), L('Rekap lembur HR (' + D.MARKET.salesCapacity[1] + ')', 'HR overtime summary (' + D.MARKET.salesCapacity[1] + ')'), { sc: lin(top.ot, 10, 60), target: 20, assume: true }),
        queue: inp(L('Antrian di atas 85% kapasitas', 'Queue above 85% capacity'), qd, L('mnt', 'min'), L('Beban − 85% kapasitas', 'Load − 85% of capacity'), { sc: lin(qd, 0, 10), target: 0 }),
        sla: inp(L('Delivery tepat waktu', 'On-time delivery'), sla, '%', L('Fase 9 · 30 hari', 'Phase 9 · 30 days'), { sc: lin(sla == null ? null : 100 - sla, 1, 6), target: 98 }),
        rewash: inp(L('Rewash', 'Rewash'), rw ? rw.v : null, '%', L('KPI QLT-02 Fase 5', 'Phase 5 KPI QLT-02'), { sc: lin(rw ? rw.v : null, 1, 4), target: rw ? rw.t : null }),
        payroll: inp(L('Payroll ratio', 'Payroll ratio'), pr, '%', L('(5300 + 6100) ÷ pendapatan ' + pp, '(5300 + 6100) ÷ revenue ' + pp), { sc: lin(pr == null ? null : 40 - pr, 0, 10), target: 34 }),
        demand: inp(L('Pertumbuhan revenue MoM', 'Revenue growth MoM'), vg, '%', L('Ledger ' + pp, 'Ledger ' + pp), { sc: lin(vg, 0, 5), target: 3 }) });
      var perOp = top.cap && top.hc ? top.cap / top.hc : null, need = perOp ? Math.max(0, Math.ceil((top.load / 0.85 - top.cap) / perOp)) : 0, o5 = w4.score >= 65 ? 'high' : w4.score >= 45 ? 'medium' : 'low';
      card = Object.assign(w4, { out: o5, area: top.n, areaK: top.k, shift: L('Shift siang 12:00–20:00 (puncak finishing)', 'Day shift 12:00–20:00 (finishing peak)'), hc: need ? [need, need + 1] : [0, 0],
        sig: L(T(top.n) + ' di ' + top.pct + '% kapasitas dengan ' + top.ot + ' jam lembur.', top.n[1] + ' at ' + top.pct + '% capacity with ' + top.ot + ' overtime hours.'),
        why: [L('Beban ' + T(top.n) + ' ' + top.pct + '% (target ≤ 85%)', top.n[1] + ' load ' + top.pct + '% (target ≤ 85%)'), L('Lembur ' + top.ot + ' jam/bulan', 'Overtime ' + top.ot + ' h/month'), L('Payroll ratio ' + pr + '%', 'Payroll ratio ' + pr + '%')],
        impact: L('Antrian finishing menunda packing dan delivery; SLA dan rewash memburuk.', 'The finishing queue delays packing and delivery; SLA and rewash worsen.'),
        rec: need ? L('Tambah ' + need + '–' + (need + 1) + ' operator ' + T(top.n).toLowerCase() + ' di shift siang.', 'Add ' + need + '–' + (need + 1) + ' ' + top.n[1].toLowerCase() + ' operators on the day shift.') : L('Belum perlu tambah orang; pantau beban mingguan.', 'No extra people needed yet; watch the weekly load.'),
        act: { n: L('Lihat kapasitas Fase 8', 'See Phase 8 capacity'), s: 'PROD-CAP-001' }, assume: [L('Produktivitas per operator = kapasitas ÷ headcount saat ini (' + (perOp ? r1(perOp) : '—') + ' kg/jam).', 'Productivity per operator = capacity ÷ current headcount (' + (perOp ? r1(perOp) : '—') + ' kg/h).'), L('Lembur dari rekap HR, bukan sistem absensi.', 'Overtime from the HR summary, not the attendance system.')] });
    }
    if (k === 'machine') {
      var dry = ['D-01', 'D-02', 'D-04'].map(function (m) { return (D.AST_USE[m] || [])[0]; }), peak = Math.max.apply(null, dry), dtl = M.PR && M.PR.downtime ? M.PR.downtime({}).filter(function (x) { return /^D-/.test(x.mach) && U.dayDiff(x.start, M.today()) <= 30; }) : [], dth = r1(sum(dtl.map(function (x) { return x.dur || 0; })) / 60);
      var s1 = by(S().scn, 'id', 'SCN-01'), c1 = s1 ? M.scnCalc(s1.inp) : null, vg2 = M.revGrowth(pp), fin = by(stages, 'k', 'fin');
      var w5 = weighted('machine', {
        cap: inp(L('Utilisasi puncak dryer aktif', 'Peak utilisation of active dryers'), peak, '%', L('Utilisasi 30 hari per mesin (Fase 8)', '30-day utilisation per machine (Phase 8)'), { sc: lin(peak, 60, 95), target: 80 }),
        dem: inp(L('Pertumbuhan volume', 'Volume growth'), vg2, '%', L('Revenue MoM ' + pp, 'Revenue MoM ' + pp), { sc: lin(vg2, 0, 5), target: 3 }),
        roi: inp(L('ROI skenario dryer (SCN-01)', 'Dryer scenario ROI (SCN-01)'), c1 ? c1.roi : null, '%', L('Scenario builder · asumsi', 'Scenario builder · assumptions'), { sc: lin(c1 ? c1.roi : null, 5, 40), target: 25, assume: true }),
        sla: inp(L('Delivery tepat waktu', 'On-time delivery'), dk ? dk.otd : null, '%', L('Fase 9 · 30 hari', 'Phase 9 · 30 days'), { sc: lin(dk ? 100 - dk.otd : null, 1, 6), target: 98 }),
        dt: inp(L('Downtime dryer 30 hari', 'Dryer downtime 30 days'), dth, L('jam', 'h'), L('Downtime Fase 8 (D-03 sedang repair)', 'Phase 8 downtime (D-03 under repair)'), { sc: lin(dth, 0, 40), target: 8 }) });
      var o6 = w5.score >= 70 ? 'invest' : w5.score >= 50 ? 'evaluate' : 'notneeded';
      card = Object.assign(w5, { out: o6, scn: c1, sig: L('Dryer aktif sampai ' + peak + '% utilisasi; D-03 sedang repair.', 'Active dryers up to ' + peak + '% utilisation; D-03 under repair.'),
        why: [L('Utilisasi puncak ' + peak + '%', 'Peak utilisation ' + peak + '%'), c1 ? L('ROI dryer ' + c1.roi + '%, payback ' + c1.payback + ' bln (asumsi)', 'Dryer ROI ' + c1.roi + '%, payback ' + c1.payback + ' months (assumption)') : null, fin ? L('Finishing ' + fin.pct + '%: tambahan dryer tidak menaikkan throughput sebelum finishing ditambah', 'Finishing ' + fin.pct + '%: an extra dryer does not raise throughput before finishing is expanded') : null].filter(Boolean),
        impact: L('Tanpa cadangan dryer, breakdown berikutnya menunda batch dan SLA.', 'Without a spare dryer, the next breakdown delays batches and SLA.'),
        rec: o6 === 'invest' ? L('Ajukan capex dryer lewat PR/PO dengan persetujuan Owner.', 'Request dryer capex through PR/PO with Owner approval.') : L('Evaluasi dryer tambahan setelah D-03 kembali dan finishing ditambah orang; bandingkan dryer cash vs leasing.', 'Evaluate an extra dryer after D-03 returns and finishing gets more people; compare cash vs lease.'),
        act: { n: L('Bandingkan skenario dryer', 'Compare the dryer scenarios'), s: 'CFO-006' }, assume: [L('Capex tidak pernah disetujui otomatis: PO capex wajib persetujuan Owner.', 'Capex is never auto-approved: a capex PO needs Owner approval.')] });
    }
    if (k === 'client') {
      var ws = by(stages, 'k', 'wash'), dr = by(stages, 'k', 'dry'), fn = by(stages, 'k', 'fin'), big = oppsAll().filter(function (o) { return ['won', 'lost'].indexOf(o.stage) < 0; }).sort(function (a, b) { return b.rev - a.rev; })[0];
      var price = M.rateOn('PR-01A', 'SV-006', M.today()).rate || 8500, addKg = big ? Math.round(big.rev / price / 26) : 0, addH = addKg / 10;
      function after(st) { return st && st.cap ? r0((st.load + addH) / st.cap * 100) : null; }
      var labor = avg(stages.map(function (s) { return s.pct; }));
      var w6 = weighted('client', {
        wash: inp(L('Washing setelah klien baru', 'Washing after the new client'), after(ws), '%', L('Fase 8 + volume peluang terbesar', 'Phase 8 + largest opportunity volume'), { sc: lin(after(ws) == null ? null : 100 - after(ws), 5, 40), target: 80 }),
        dry: inp(L('Drying setelah klien baru', 'Drying after the new client'), after(dr), '%', L('Fase 8', 'Phase 8'), { sc: lin(after(dr) == null ? null : 100 - after(dr), 5, 40), target: 80 }),
        fin: inp(L('Finishing setelah klien baru', 'Finishing after the new client'), after(fn), '%', L('Fase 8', 'Phase 8'), { sc: lin(after(fn) == null ? null : 100 - after(fn), 5, 40), target: 80 }),
        labor: inp(L('Rata-rata beban tenaga kerja', 'Average labour load'), labor == null ? null : r0(labor), '%', L('Fase 8 per tahap', 'Phase 8 per stage'), { sc: lin(labor == null ? null : 100 - labor, 5, 40), target: 75 }),
        sla: inp(L('Delivery tepat waktu', 'On-time delivery'), dk ? dk.otd : null, '%', L('Fase 9', 'Phase 9'), { sc: lin(dk ? dk.otd : null, 92, 98), target: 98 }),
        mgn: inp(L('Margin peluang', 'Opportunity margin'), big ? big.margin : null, '%', big ? L(big.id + ' · ' + M.clientName(big.cl), big.id + ' · ' + M.clientName(big.cl)) : '—', { sc: lin(big ? big.margin : null, 20, 40), target: 35 }) });
      var worst = Math.max(after(ws) || 0, after(dr) || 0, after(fn) || 0), o7 = worst > 100 ? 'notrec' : worst > 90 ? 'limited' : w6.score >= 70 ? 'strongcap' : 'available';
      card = Object.assign(w6, { out: o7, opp: big ? big.id : null, addKg: addKg, sig: L('Klien baru ' + (big ? big.id : '') + ' menambah ±' + addKg + ' kg/hari; tahap terberat ' + worst + '%.', 'New client ' + (big ? big.id : '') + ' adds ±' + addKg + ' kg/day; heaviest stage ' + worst + '%.'),
        why: [L('Finishing ' + (fn ? fn.pct : '—') + '% → ' + after(fn) + '%', 'Finishing ' + (fn ? fn.pct : '—') + '% → ' + after(fn) + '%'), L('Washing ' + (ws ? ws.pct : '—') + '% → ' + after(ws) + '%', 'Washing ' + (ws ? ws.pct : '—') + '% → ' + after(ws) + '%')],
        impact: L('Menerima klien di atas kapasitas finishing menurunkan SLA klien yang sudah ada.', 'Taking a client beyond finishing capacity lowers SLA for existing clients.'),
        rec: o7 === 'notrec' || o7 === 'limited' ? L('Terima klien baru setelah kapasitas finishing ditambah, atau jadwalkan volumenya di luar puncak.', 'Take the new client after finishing capacity is added, or schedule its volume off-peak.') : L('Kapasitas cukup untuk klien baru.', 'Capacity is enough for the new client.'),
        act: { n: L('Lihat kapasitas Fase 8', 'See Phase 8 capacity'), s: 'PROD-CAP-001' }, assume: [L('Volume klien baru = nilai bulanan peluang ÷ tarif linen ÷ 26 hari.', 'New client volume = monthly opportunity value ÷ linen rate ÷ 26 days.'), L('Penambahan merata 10 jam operasi per hari.', 'Added evenly over 10 operating hours per day.')] });
    }
    if (k === 'pricing') {
      var prv = M.priceReview(Object.assign({}, oc, { perms: ['price.view', 'hpp.view'] })) || [], ser = M.hppSeries(), h1 = ser[ser.length - 1], h0 = ser[ser.length - 2], ht = h0 ? r1((h1.hpp - h0.hpp) / h0.hpp * 100) : null;
      var low = prv.filter(function (r) { return r.st === 'review' || r.st === 'low' || r.st === 'below'; }), cpf = M.clientProfit(Object.assign({}, oc, { perms: ['prof.client', 'hpp.view'] })), minC = cpf ? cpf.rows.slice().sort(function (a, b) { return a.margin - b.margin; })[0] : null;
      var lc = M.lastPriceChange ? M.lastPriceChange('SV-006') : null, ageM = lc && lc.date ? r1(U.dayDiff(lc.date, M.today()) / 30) : 12, comp = D.MARKET.compRate, mine = by(prv, 'svc', 'SV-006');
      var vm = avg(prv.map(function (r) { return r.margin; })), ins = M.hppInsight(), qc2 = pkpi('QLT-01');
      var w7 = weighted('pricing', {
        hpp: inp(L('HPP/kg MoM', 'HPP/kg MoM'), ht, '%', L('HPP ' + h1.p + ' vs ' + h0.p, 'HPP ' + h1.p + ' vs ' + h0.p), { sc: lin(ht, 0, 8), target: 0 }),
        mgn: inp(L('Layanan di bawah target margin', 'Services below target margin'), low.length, '', L(low.map(function (r) { return r.svc; }).join(', ') || '—', low.map(function (r) { return r.svc; }).join(', ') || '—'), { sc: lin(low.length, 0, 3), target: 0 }),
        cost: inp(L('Komponen naik terbesar', 'Largest rising component'), ins && ins.why && ins.why[0] ? ins.why[0].pct : null, '%', L('HPP insight', 'HPP insight'), { sc: lin(ins && ins.why && ins.why[0] ? ins.why[0].pct : null, 0, 15), target: 0 }),
        client: inp(L('Margin klien terendah', 'Lowest client margin'), minC ? minC.margin : null, '%', minC ? L(M.clientName(minC.cl), M.clientName(minC.cl)) : '—', { sc: lin(minC ? 40 - minC.margin : null, 0, 15), target: 35 }),
        age: inp(L('Bulan sejak ubah harga linen', 'Months since the last linen price change'), ageM, L('bln', 'mo'), L('Riwayat harga master', 'Master price history'), { sc: lin(ageM, 3, 15), target: 12 }),
        quality: inp(L('QC lulus pertama', 'QC first pass'), qc2 ? qc2.v : null, '%', L('KPI QLT-01 Fase 5', 'Phase 5 KPI QLT-01'), { sc: lin(qc2 ? qc2.v : null, 94, 98), target: 97.5 }),
        comp: inp(L('Harga pesaing vs harga linen kita', 'Competitor price vs our linen price'), mine ? r1((comp[0] - mine.price) / mine.price * 100) : null, '%', L('Survei sales ' + comp[1], 'Sales survey ' + comp[1]), { sc: lin(mine ? (comp[0] - mine.price) / mine.price * 100 : null, -8, 5), target: 0, assume: true }) });
      var o8 = low.some(function (r) { return r.margin != null && r.margin < 15; }) ? 'increase' : low.length ? 'review' : minC && minC.margin < 30 ? 'renegotiate' : 'maintain';
      card = Object.assign(w7, { out: o8, low: low.map(function (r) { return r.svc; }), sig: L(low.length + ' layanan di bawah target margin; HPP/kg ' + (ht > 0 ? '+' : '') + ht + '% MoM.', low.length + ' services below target margin; HPP/kg ' + (ht > 0 ? '+' : '') + ht + '% MoM.'),
        why: low.slice(0, 3).map(function (r) { return L(M.svcName(r.svc) + ': margin ' + r.margin + '% (rekomendasi ' + U.r0(r.rec.price) + ')', M.svcName(r.svc) + ': margin ' + r.margin + '% (recommended ' + U.r0(r.rec.price) + ')'); }),
        impact: L('Margin layanan rendah terus tergerus kenaikan HPP.', 'Low-margin services keep eroding as HPP rises.'),
        rec: o8 === 'increase' ? L('Naikkan harga layanan di bawah 15% margin pada versi harga berikutnya.', 'Raise the price of services under 15% margin in the next price version.') : o8 === 'review' ? L('Review harga ' + low.map(function (r) { return M.svcName(r.svc); }).join(', ') + '; harga pesaing ' + comp[0] + '/kg membatasi kenaikan linen.', 'Review the price of ' + low.map(function (r) { return M.svcName(r.svc); }).join(', ') + '; competitor price ' + comp[0] + '/kg limits linen increases.') : o8 === 'renegotiate' ? L('Negosiasi ulang kontrak klien bermargin rendah.', 'Renegotiate low-margin client contracts.') : L('Pertahankan harga.', 'Maintain prices.'),
        act: { n: L('Buka rekomendasi harga', 'Open the price recommendation'), s: 'PRICE-003' }, assume: [L('Harga pesaing dari survei sales, bukan data transaksi.', 'Competitor price from a sales survey, not transaction data.')] });
    }
    if (!card) return null;
    var dn = by(CARDS.map(function (c) { return { k: c[0], i: c[1] }; }), 'k', k);
    return Object.assign({ k: k, n: k === 'hold' ? L('Hold Expansion', 'Hold Expansion') : M.MODEL_N[k], icon: dn.i, p: pp, fresh: FR, outN: M.DEC_OUT[card.out][0], tone: M.DEC_OUT[card.out][1] }, card);
  };
  M.decisions = function (ctx, p) { if (!can(ctx, 'cfo.view')) return null; return CARDS.map(function (c) { return M.decision(ctx, c[0], p); }); };

  /* ---------- Investment scenario builder (§83–§84): inputs are assumptions, outputs computed ---------- */
  M.SCN_FIN = { cash: L('Kas sendiri', 'Own cash'), lease: L('Leasing', 'Lease'), loan: L('Pinjaman bank', 'Bank loan') };
  M.scnBase = function () {
    var p = M.lastClosed(), be = M.bepCalc(p), kg = (M.hppOf && M.hppOf(p) ? M.hppOf(p).vol : 186000), oc = opsCtx();
    var tre = M.treasury(Object.assign({}, oc, { perms: ['cash.view'] }), 30), cf = M.cashFlow(mAdd(p, -2) + '-01', mEnd(p)), bs = M.bs();
    return { p: p, rev: be.revenue, varCost: be.variable, fixed: be.fixed, net: M.plMonth(p).net, kg: kg, varKg: be.variable / kg, cash: tre ? tre.avail : 0, free: tre ? tre.free : 0, burn: cf.opOut / 3, L: bs.L, EQ: bs.EQ, bep: be.bep, mosPct: be.mosPct, cmr: be.cmr };
  };
  M.scnCalc = function (inp, base) {
    base = base || M.scnBase();
    var x = {}; ['capex', 'capKg', 'labor', 'maint', 'vol', 'price', 'life', 'rate', 'energy', 'ovh'].forEach(function (k) { x[k] = +inp[k] || 0; });
    var capex = x.capex * JT, days = 26, effKg = x.capKg, cap = capacity(), fin = cap.fin, bottleneck = null;
    // An extra dryer or washer cannot move more kilos than finishing can absorb (Phase 8 bottleneck).
    // Assumes the recommended finishing hires happen first; the rest of the machine is spare capacity / breakdown cover.
    if (fin && fin.pct >= 90 && x.capKg <= 2500) {
      var hc = D.MARKET.opsHeadcount.fin, perOp = fin.cap / hc, need = Math.max(0, Math.ceil((fin.load / 0.85 - fin.cap) / perOp)), headKg = Math.max(0, ((fin.cap + need * perOp) * 0.95 - fin.load) * 10);
      effKg = Math.min(x.capKg, headKg);
      bottleneck = L('Finishing ' + fin.pct + '%: tambahan efektif ' + r0(effKg) + ' kg/hari (setelah tambah ' + need + ' operator finishing); sisanya cadangan saat breakdown.', 'Finishing ' + fin.pct + '%: effective addition ' + r0(effKg) + ' kg/day (after adding ' + need + ' finishing operators); the rest is breakdown cover.');
    }
    var kgM = effKg * x.vol * days, rev = kgM * x.price, varC = kgM * base.varKg, dep = x.life ? capex / x.life : 0, interest = x.fin === 'cash' || inp.fin === 'cash' ? 0 : capex * (x.rate / 100) / 12;
    var fixAdd = (x.labor + x.maint + x.energy + x.ovh) * JT + dep + interest, profit = rev - varC - fixAdd, cashGain = profit + dep;
    var finType = inp.fin || 'cash', capexCash = finType === 'cash' ? capex : finType === 'lease' ? 0 : capex * 0.3;
    var rev2 = base.rev + rev, var2 = base.varCost + varC, fix2 = base.fixed + fixAdd, cmr2 = rev2 ? (rev2 - var2) / rev2 : 0, bep2 = cmr2 > 0 ? fix2 / cmr2 : null;
    var cash2 = base.cash - capexCash, burn2 = base.burn + varC + fixAdd - dep, debt2 = base.L + (finType === 'cash' ? 0 : capex - capexCash);
    var hpp0 = (base.varCost + base.fixed) / base.kg, hpp1 = (base.varCost + base.fixed + varC + fixAdd) / (base.kg + kgM);
    var risk = [];
    if (bottleneck) risk.push(bottleneck);
    if (x.vol > 0.6) risk.push(L('Asumsi utilisasi ' + r0(x.vol * 100) + '% tinggi untuk tahun pertama.', 'Utilisation assumption ' + r0(x.vol * 100) + '% is high for the first year.'));
    if (cash2 < base.burn * 1.5) risk.push(L('Kas setelah investasi di bawah 1,5 bulan pengeluaran operasi.', 'Cash after the investment is below 1.5 months of operating spending.'));
    if (finType !== 'cash') risk.push(L('Pembiayaan menambah bunga ' + r1(interest / JT) + ' jt/bulan.', 'Financing adds interest of ' + r1(interest / JT) + ' m/month.'));
    if (profit <= 0) risk.push(L('Tambahan laba negatif dengan asumsi ini.', 'Added profit is negative under these assumptions.'));
    return { capex: capex, capexCash: capexCash, fin: finType, addKgDay: r0(effKg), addKgM: r0(kgM), capPct: r1(effKg * days / base.kg * 100), rev: rev, varC: varC, fixAdd: fixAdd, dep: dep, interest: interest, profit: profit, cost: varC + fixAdd,
      hpp0: r0(hpp0), hpp1: r0(hpp1), hppD: r1((hpp1 - hpp0) / hpp0 * 100), roi: capex ? r1(profit * 12 / capex * 100) : null, payback: cashGain > 0 ? r1(capex / cashGain) : null,
      runway: burn2 ? r1(Math.max(0, cash2) / burn2) : null, cash: cash2, bep: bep2, mosPct: bep2 == null ? null : r1((rev2 - bep2) / rev2 * 100), de: base.EQ ? r2(debt2 / base.EQ) : null, de0: base.EQ ? r2(base.L / base.EQ) : null, risk: risk, bottleneck: bottleneck, base: base,
      assume: [L('Semua input skenario adalah asumsi, bukan fakta.', 'All scenario inputs are assumptions, not facts.'), L('Biaya variabel/kg = biaya variabel ' + base.p + ' ÷ volume (' + r0(base.varKg) + ' per kg).', 'Variable cost/kg = ' + base.p + ' variable cost ÷ volume (' + r0(base.varKg) + ' per kg).'), L('26 hari operasi per bulan.', '26 operating days per month.')] };
  };
  M.scenarios = function (ctx) { if (!can(ctx, 'cfo.view') && !can(ctx, 'cfo.scn')) return null; var base = M.scnBase(); return S().scn.map(function (s) { return Object.assign({}, s, { out: M.scnCalc(s.inp, base) }); }); };
  M.scenario = function (ctx, id) { var l = M.scenarios(ctx); return l ? by(l, 'id', id) : null; };
  M.createScenario = function (ctx, name, inp) {
    if (!can(ctx, 'cfo.scn')) return deny(ctx, 'scenario');
    if (!str(T(name))) return bad(L('Nama skenario wajib diisi.', 'A scenario name is required.'), 'name');
    var need = ['capex', 'capKg', 'vol', 'price', 'life'], x = {};
    for (var i = 0; i < need.length; i++) { var v = num(inp[need[i]]); if (v == null || isNaN(v) || v <= 0) return bad(L('Isi ' + need[i] + ' dengan angka > 0.', 'Fill ' + need[i] + ' with a number > 0.'), need[i]); x[need[i]] = v; }
    if (x.vol > 1) return bad(L('Utilisasi diisi 0–1 (misal 0,55).', 'Utilisation is 0–1 (e.g. 0.55).'), 'vol');
    ['labor', 'maint', 'rate', 'energy', 'ovh'].forEach(function (k) { var v = num(inp[k]); x[k] = v == null || isNaN(v) ? 0 : v; });
    x.fin = M.SCN_FIN[inp.fin] ? inp.fin : 'cash'; x.start = inp.start || U.addDays(M.today(), 60);
    var id = 'SCN-' + String(S().scn.length + 1).padStart(2, '0'), rec = { id: id, n: [str(T(name)), str(T(name))], by: empId(ctx), at: nowS(), inp: x };
    S().scn.push(rec); M.audit('SCENARIO.CREATE', ctx, { rec: id, to: T(rec.n) + ' · capex ' + x.capex }); save();
    return { ok: true, scn: rec, out: M.scnCalc(x) };
  };
  M.compareScn = function (ctx, ids) {
    var all = M.scenarios(ctx); if (!all) return null;
    var base = M.scnBase(), pick = (ids && ids.length ? ids : all.slice(0, 3).map(function (s) { return s.id; })).slice(0, 3).map(function (id) { return by(all, 'id', id); }).filter(Boolean);
    var cur = { id: 'CUR', n: L('Saat ini', 'Current'), out: { capex: 0, rev: 0, profit: 0, cash: base.cash, roi: null, payback: null, bep: base.bep, runway: base.burn ? r1(base.cash / base.burn) : null, addKgDay: 0, capPct: 0, de: base.EQ ? r2(base.L / base.EQ) : null, risk: [], mosPct: base.mosPct } };
    return { base: base, cols: [cur].concat(pick) };
  };

  /* ---------- Top recommended actions (§88–§89) ---------- */
  M.actions = function (ctx, p) {
    if (!can(ctx, 'cfo.view')) return null;
    var out = [], acts = S().acts, oc = opsCtx();
    function A(id, pri, n, why, impact, owner, ev, cta, kpi, src) { var a = acts[id] || null; out.push({ id: id, pri: pri, n: n, why: why, impact: impact, owner: owner, ev: ev, cta: cta, kpi: kpi, src: src, done: a }); }
    var ops = M.decision(ctx, 'ops', p), pr = M.decision(ctx, 'pricing', p), mc = M.decision(ctx, 'machine', p), cl = M.decision(ctx, 'client', p);
    if (ops && ops.hc[0] > 0) A('ACT-OPS', 1, L('Tambah ' + ops.hc[0] + '–' + ops.hc[1] + ' operator ' + T(ops.area).toLowerCase(), 'Add ' + ops.hc[0] + '–' + ops.hc[1] + ' ' + ops.area[1].toLowerCase() + ' operators'), ops.sig, L('Membuka kapasitas finishing untuk klien baru ±' + (cl ? cl.addKg : 0) + ' kg/hari', 'Opens finishing capacity for a new client of ±' + (cl ? cl.addKg : 0) + ' kg/day'), 'EMP-010',
      [{ n: L('Kapasitas Fase 8', 'Phase 8 capacity'), s: 'PROD-CAP-001' }, { n: L('Skor tim operasional', 'Operations team score'), s: 'CFO-004', rec: 'ops' }], { l: L('Jadikan keputusan', 'Make it a decision'), s: 'CFO-007', rec: 'ACT-OPS' }, 'OPS-03', 'ops');
    if (pr && pr.low.length) { var lw = pr.low.map(function (s) { return M.svcName(s); }).join(', '), gain = sum((M.priceReview(Object.assign({}, oc, { perms: ['price.view', 'hpp.view'] })) || []).filter(function (r) { return pr.low.indexOf(r.svc) >= 0; }).map(function (r) { return Math.max(0, r.gap || 0) * r.vol; }));
      A('ACT-PRICE', 1, L('Review harga ' + lw, 'Review the price of ' + lw), pr.sig, L('±' + U.r1(gain / JT) + ' jt/bulan bila harga rekomendasi diterapkan', '±' + U.r1(gain / JT) + ' m/month if the recommended prices are applied'), 'EMP-030',
        [{ n: L('Rekomendasi harga', 'Price recommendation'), s: 'PRICE-003' }, { n: L('Skor review harga', 'Pricing review score'), s: 'CFO-004', rec: 'pricing' }], { l: L('Jadikan keputusan', 'Make it a decision'), s: 'CFO-007', rec: 'ACT-PRICE' }, 'FIN-02', 'pricing'); }
    var ag = M.aging(Object.assign({}, oc, { perms: ['ar.view'] })), old = ag ? ag.rows.filter(function (r) { return r.b === 'b90' || r.b === 'b90p' || r.days > 60; }) : [], oldAmt = sum(old.map(function (r) { return r.open; }));
    if (old.length) A('ACT-AR', 1, L('Follow up AR > 60 hari (' + old.length + ' invoice)', 'Follow up AR > 60 days (' + old.length + ' invoices)'), L('Rp ' + U.r1(oldAmt / JT) + ' jt tertahan > 60 hari: ' + old.map(function (r) { return M.clientName(r.inv.cl); }).filter(function (v, i, a) { return a.indexOf(v) === i; }).join(', '), 'Rp ' + U.r1(oldAmt / JT) + ' m held > 60 days: ' + old.map(function (r) { return M.clientName(r.inv.cl); }).filter(function (v, i, a) { return a.indexOf(v) === i; }).join(', ')),
      L('Menurunkan DSO dan menambah kas Rp ' + U.r1(oldAmt / JT) + ' jt', 'Lowers DSO and adds Rp ' + U.r1(oldAmt / JT) + ' m of cash'), 'EMP-030', [{ n: L('AR aging', 'AR aging'), s: 'AR-004' }, { n: L('Collection', 'Collection'), s: 'AR-005' }], { l: L('Buka collection', 'Open collection'), s: 'AR-005' }, 'FIN-04', 'ar');
    if (mc && mc.out !== 'notneeded') A('ACT-DRYER', 2, L('Evaluasi dryer tambahan', 'Evaluate an additional dryer'), mc.sig, mc.scn ? L('ROI ' + mc.scn.roi + '%, payback ' + mc.scn.payback + ' bln (asumsi); capex butuh persetujuan Owner', 'ROI ' + mc.scn.roi + '%, payback ' + mc.scn.payback + ' months (assumption); capex needs Owner approval') : L('Lihat skenario', 'See the scenario'), 'EMP-050',
      [{ n: L('Skor investasi mesin', 'Machine investment score'), s: 'CFO-004', rec: 'machine' }, { n: L('Perbandingan skenario', 'Scenario comparison'), s: 'CFO-006' }, { n: L('Insight penggantian aset', 'Asset replacement insight'), s: 'AST-005' }], { l: L('Bandingkan skenario', 'Compare scenarios'), s: 'CFO-006' }, 'OPS-03', 'machine');
    var cs = M.closeStatus(M.lastClosed()); if (!cs.ready && cs.perSt === 'soft') A('ACT-CLOSE', 2, L('Selesaikan closing ' + cs.p + ' (' + cs.done + '/' + cs.total + ')', 'Finish the ' + cs.p + ' close (' + cs.done + '/' + cs.total + ')'), L('Rasio periode ' + cs.p + ' masih soft close: ' + cs.items.filter(function (i) { return i.st !== 'done'; }).map(function (i) { return T(i.n); }).join(', '), 'Period ' + cs.p + ' ratios are still soft-closed: ' + cs.items.filter(function (i) { return i.st !== 'done'; }).map(function (i) { return i.n[1]; }).join(', ')),
      L('Angka ' + cs.p + ' menjadi final untuk rasio dan R2RE', cs.p + ' figures become final for ratios and R2RE'), 'EMP-030', [{ n: L('Monthly close', 'Monthly close'), s: 'BUD-004' }], { l: L('Buka monthly close', 'Open the monthly close'), s: 'BUD-004' }, null, 'close');
    var dup = S().exp.filter(function (e) { return e.st !== 'rejected' && e.st !== 'paid' && M.dupCheck(e, e.id).length; });
    if (dup.length) A('ACT-DUP', 2, L('Periksa ' + dup.length + ' invoice supplier ganda', 'Check ' + dup.length + ' duplicate supplier invoices'), L(dup.map(function (e) { return e.id + ' (' + e.sinv + ')'; }).join(', '), dup.map(function (e) { return e.id + ' (' + e.sinv + ')'; }).join(', ')), L('Mencegah bayar ganda Rp ' + U.r1(sum(dup.map(function (e) { return e.amt + e.tax; })) / JT / 2) + ' jt', 'Prevents paying Rp ' + U.r1(sum(dup.map(function (e) { return e.amt + e.tax; })) / JT / 2) + ' m twice'), 'EMP-030', [{ n: L('Daftar biaya', 'Expense list'), s: 'AP-001' }], { l: L('Buka invoice', 'Open the invoice'), s: 'AP-002', rec: dup[0].id }, null, 'ap');
    return out.sort(function (a, b) { return a.pri - b.pri; }).slice(0, 5);
  };
  // §89 insight → decision → action → race → result → reflection.
  M.actDecide = function (ctx, id, o) {
    if (!can(ctx, 'cfo.act')) return deny(ctx, id);
    o = o || {}; var a = by(M.actions(ctx) || [], 'id', id); if (!a) return bad(M.MSG.notfound, 'notfound');
    if (S().acts[id]) return bad(L('Rekomendasi ini sudah menjadi keputusan.', 'This recommendation is already a decision.'), 'dup');
    var owner = o.owner || a.owner, due = o.due || U.addDays(M.today(), 14), P = M.P, dec = null, race = null;
    if (P && P.decisionAdd) {
      var r = P.decisionAdd(ctx, { d: a.n, owner: owner, due: due, src: 'CFO-007 · ' + id, exp: a.impact, kpi: o.kpi || a.kpi || null, ev: (a.ev || []).map(function (e) { return e.s; }).join(', ') });
      if (!r.ok) return r; dec = r.d.id;
      if (o.race && P.raceAdd) { var rr = P.raceAdd(ctx, { n: a.n, pic: owner, goal: o.goal || 'BG-H2-01', kpi: o.kpi || a.kpi || 'FIN-01', target: o.target || 1 }); if (rr && rr.ok) race = rr.r.id; }
    }
    var rec = { id: id, n: a.n, dec: dec, race: race, r2re: !!o.r2re, refl: !!o.refl, owner: owner, due: due, kpi: o.kpi || a.kpi || null, by: empId(ctx), at: nowS() };
    S().acts[id] = rec; M.audit('ACTION.DECISION', ctx, { rec: id, to: [dec, race, rec.r2re ? 'R2RE' : null, rec.refl ? 'Reflection' : null].filter(Boolean).join(' · ') }); save();
    return { ok: true, act: rec };
  };
  M.actItems = function (kind) { return Object.keys(S().acts).map(function (k) { return S().acts[k]; }).filter(function (a) { return !kind || a[kind]; }); };

  /* ---------- Mobile alerts (§96): critical approvals, financial, AR, stock alerts, decision notifications ---------- */
  M.alerts = function (ctx) {
    var out = [], s = S();
    function A(sev, kind, t, c, scr, rec) { out.push({ sev: sev, kind: kind, t: t, c: c, s: scr, rec: rec || null }); }
    if (can(ctx, 'ar.approve')) s.inv.filter(function (i) { return i.st === 'review' && i.by !== empId(ctx); }).forEach(function (i) { A('appr', 'invappr', L('Invoice menunggu persetujuan', 'Invoice waiting for approval'), L(i.id + ' · ' + M.clientName(i.cl) + ' · Rp ' + U.r1(i.total / JT) + ' jt', i.id + ' · ' + M.clientName(i.cl) + ' · Rp ' + U.r1(i.total / JT) + ' m'), 'AR-003', i.id); });
    if (can(ctx, 'ap.approve')) s.exp.filter(function (e) { return e.st === 'verify' && e.match && e.match.ok && e.by !== empId(ctx); }).forEach(function (e) { A('appr', 'apappr', L('Biaya menunggu persetujuan', 'Expense waiting for approval'), L(e.id + ' · Rp ' + U.r1((e.amt + e.tax) / JT) + ' jt', e.id + ' · Rp ' + U.r1((e.amt + e.tax) / JT) + ' m'), 'AP-002', e.id); });
    if (can(ctx, 'cash.approve')) s.cashTx.filter(function (t) { return t.st === 'pending' && t.pic !== empId(ctx); }).forEach(function (t) { A('appr', 'cashappr', L('Kas keluar menunggu persetujuan', 'Cash out waiting for approval'), L(t.id + ' · Rp ' + U.r1(t.amt / JT) + ' jt', t.id + ' · Rp ' + U.r1(t.amt / JT) + ' m'), 'CASH-003', t.id); });
    if (can(ctx, 'pur.approve') && s.prs) s.prs.filter(function (p) { return (p.st === 'submitted' || p.st === 'review') && M.prRule(p).lvl === (ctx.roleKey === 'owner' ? 'owner' : 'finance'); }).forEach(function (p) { A('appr', 'prappr', L('PR menunggu persetujuan', 'PR waiting for approval'), L(p.id + ' · Rp ' + U.r1(M.prAmount(p) / JT) + ' jt', p.id + ' · Rp ' + U.r1(M.prAmount(p) / JT) + ' m'), 'PUR-003', p.id); });
    if (can(ctx, 'pur.po.approve') && s.pos) s.pos.filter(function (p) { return p.st === 'draft' && p.capex; }).forEach(function (p) { A('appr', 'capex', L('PO capex menunggu Owner', 'Capex PO waiting for the Owner'), L(p.id + ' · Rp ' + U.r1(M.poTotal(p) / JT) + ' jt', p.id + ' · Rp ' + U.r1(M.poTotal(p) / JT) + ' m'), 'PUR-006', p.id); });
    if (can(ctx, 'ar.view')) { var ag = M.aging(ctx); (ag ? ag.rows : []).filter(function (r) { return r.days > 60; }).slice(0, 4).forEach(function (r) { A('crit', 'ar', L('AR > 60 hari', 'AR > 60 days'), L(r.inv.id + ' · ' + M.clientName(r.inv.cl) + ' · ' + r.days + ' hari', r.inv.id + ' · ' + M.clientName(r.inv.cl) + ' · ' + r.days + ' days'), 'AR-005', r.inv.id); }); }
    if (can(ctx, 'inv.view') && s.stock) s.stock.filter(function (x) { var st = M.stockSt(x); return st === 'critical' || st === 'habis'; }).forEach(function (x) { A('crit', 'stock', L('Stok ' + T(M.STOCK_ST[M.stockSt(x)][0]).toLowerCase(), 'Stock ' + M.STOCK_ST[M.stockSt(x)][0][1].toLowerCase()), L(T(x.n) + ' · ' + x.qty + ' ' + x.unit, x.n[1] + ' · ' + x.qty + ' ' + x.unit), 'INV-003', x.code); });
    if (can(ctx, 'cfo.view')) { var R = M.ratios(ctx); R.list.filter(function (r) { return r.st === 'critical'; }).forEach(function (r) { A('crit', 'ratio', L('Rasio kritis', 'Critical ratio'), L(T(r.n) + ' ' + fmtV(r.v, r.u), r.n[1] + ' ' + fmtV(r.v, r.u)), 'CFO-002', r.k); });
      var hd = M.decision(ctx, 'hold'); if (hd.out === 'hold') A('crit', 'hold', L('HOLD EXPANSION', 'HOLD EXPANSION'), hd.sig, 'CFO-004', 'hold');
      M.actItems().forEach(function (a) { A('info', 'decision', L('Keputusan dari rekomendasi CFO', 'Decision from a CFO recommendation'), a.n, 'CFO-007', a.id); }); }
    var o = { crit: 0, appr: 1, info: 2 };
    return out.sort(function (a, b) { return o[a.sev] - o[b.sev]; });
  };

  /* ---------- CFO first screen (§65) ---------- */
  M.cfoHome = function (ctx) {
    if (!can(ctx, 'cfo.view')) return null;
    var oc = Object.assign({}, ctx, { perms: (ctx.perms || []).concat(['cash.view', 'ar.view']) }), tre = M.treasury(oc, 30), fc = M.forecast(oc, 30), mtd = M.plMonth(M.curPeriod()), ag = M.aging(oc);
    return { at: nowS(), cash: tre ? tre.avail : null, free: tre ? tre.free : null, revMtd: mtd.revenue, netMtd: mtd.net, ar: ag ? ag.total : null, arOver: ag ? ag.overdue : null, fc: fc ? fc.base : null, fcEnd: fc ? fc.to : null,
      ratios: M.ratios(ctx), health: M.health(ctx), cards: M.decisions(ctx), actions: M.actions(ctx), p: M.lastClosed() };
  };

  /* ---------- Phase 5 feed (§91): health, decisions and actions reach the Performance OS ---------- */
  M.perfFeed = function (P) {
    if (!P) return 0; M.P = P;
    P.fin10 = { health: function (ctx) { return M.health(ctx || { perms: ['cfo.view'] }); }, ratios: function (ctx) { return M.ratios(ctx || { perms: ['cfo.view'] }); }, actions: function () { return M.actItems(); }, r2re: function () { return M.actItems('r2re'); }, refl: function () { return M.actItems('refl'); } };
    return 1;
  };

  /* ---------- Notifications: Phase 10 alerts join the shared bell (mobile alerts, §96) ---------- */
  var NCAT10 = { crit: 'crit', appr: 'warn', info: 'ops' };
  M.joinNotifs = function (X) {
    if (!X || !X.notifsFor || X.__p10n) return; X.__p10n = true;
    var orig = X.notifsFor, origRead = X.markRead;
    function rk(ctx) { return ctx.uid || empId(ctx); }
    X.notifsFor = function (ctx) {
      var base = orig.call(X, ctx), seen = (S().reads || {})[rk(ctx)] || [], t0 = Date.now();
      var mine = M.alerts(ctx).slice(0, 12).map(function (a, i) { var id = 'FN-' + a.kind + '-' + (a.rec || i); return { id: id, cat: NCAT10[a.sev] || 'ops', to: [], t: a.t, c: a.c, at: t0 - (i + 1) * 6e5, read: seen.indexOf(id) >= 0, cta: X.canScreen && !X.canScreen(ctx, a.s) ? null : { l: L('Buka', 'Open'), s: a.s, rec: a.rec }, p10: true }; });
      return base.concat(mine).sort(function (a, b) { return b.at - a.at; });
    };
    X.markRead = function (ctx, ids) {
      var all = ids === 'all' ? X.notifsFor(ctx).map(function (n) { return n.id; }) : ids || [];
      var r = S().reads = S().reads || {}, k = rk(ctx), list = r[k] = r[k] || [];
      all.forEach(function (id) { if (/^FN-/.test(id) && list.indexOf(id) < 0) list.push(id); });
      save();
      return origRead.call(X, ctx, all.filter(function (id) { return !/^FN-/.test(id); }));
    };
  };

  /* ---------- Screens (§95), navigation (§92–§94), roles, install ---------- */
  // Phase 10's FIN-001…FIN-005 collide with the Phase 5 finance screens, so they are ACC-001…ACC-005 (same content, mapping kept here).
  M.ID_MAP = { 'FIN-001': 'ACC-001', 'FIN-002': 'ACC-002', 'FIN-003': 'ACC-003', 'FIN-004': 'ACC-004', 'FIN-005': 'ACC-005' };
  function sc(id, n, a, p, np, icon, pur, emp, o) {
    var k = +np.slice(3);
    return Object.assign({ id: id, n: n, a: a, p: p, np: np, nv: 'NV-' + String(k).padStart(2, '0'), icon: icon, pur: pur, dom: 'fin10', lvl: 3, p10: true, nb: [], bf: [], aud: [], dev: 'd',
      emp: emp || L('Belum ada data.', 'No data yet.'), err: M.MSG.sync, warn: L('Ada angka yang perlu perhatian.', 'Some figures need attention.'), ok: L('Tersimpan.', 'Saved.') }, o || {});
  }
  M.SCREENS = [
    sc('ACC-001', L('Dashboard Finance', 'Finance Dashboard'), 'T08', 'fin.gl.view', 'NP-01', 'grid', L('Laba rugi, neraca, arus kas, periode dan jurnal terbaru; setiap angka bisa ditelusuri ke sumbernya.', 'P&L, balance sheet, cash flow, periods and latest journals; every figure traces to its source.'), null, { lvl: 4 }),
    sc('ACC-002', L('Chart of Accounts', 'Chart of Accounts'), 'T05', 'fin.gl.view', 'NP-01', 'list', L('Akun aset, liabilitas, ekuitas, pendapatan, HPP dan opex dengan saldo dan buku besar.', 'Asset, liability, equity, revenue, COGS and opex accounts with balances and ledgers.')),
    sc('ACC-003', L('Daftar Jurnal', 'Journal List'), 'T05', 'fin.gl.view', 'NP-01', 'file', L('Semua jurnal: sumber, referensi, status Draft / Posted / Reversed / Adjustment.', 'All journals: source, reference, status Draft / Posted / Reversed / Adjustment.'), L('Belum ada jurnal.', 'No journal yet.')),
    sc('ACC-004', L('Detail Jurnal', 'Journal Detail'), 'T03', 'fin.gl.view', 'NP-01', 'filecheck', L('Baris debit/kredit, cost center, pembuat, penyetuju, dan jejak ke invoice, order, PO atau batch.', 'Debit/credit lines, cost centre, maker, approver, and the trail to invoice, order, PO or batch.')),
    sc('ACC-005', L('Kontrol Periode', 'Period Control'), 'T05', 'fin.gl.view', 'NP-01', 'lock', L('Open, Soft Close, Closed, Locked; perubahan periode tertutup hanya lewat penyesuaian atau koreksi.', 'Open, Soft Close, Closed, Locked; closed periods change only through adjustments or corrections.')),
    sc('CASH-001', L('Kas & Treasury', 'Cash & Treasury Dashboard'), 'T08', 'cash.view', 'NP-02', 'coins', L('Total kas, tersedia, dibatasi, komitmen, free cash, proyeksi hari ini / 7 / 30 / 90 hari.', 'Total cash, available, restricted, committed, free cash, projection today / 7 / 30 / 90 days.'), null, { lvl: 4 }),
    sc('CASH-002', L('Detail Rekening', 'Account Detail'), 'T03', 'cash.view', 'NP-02', 'building', L('Saldo awal, saldo kini, saldo rekonsiliasi, mutasi dan PIC per rekening.', 'Opening, current and reconciled balance, movements and PIC per account.')),
    sc('CASH-003', L('Transaksi Kas', 'Cash Transaction'), 'T04', 'cash.view', 'NP-02', 'swap', L('Kas masuk/keluar, transfer, setoran, penarikan, penyesuaian dengan bukti dan persetujuan.', 'Cash in/out, transfer, deposit, withdrawal, adjustment with evidence and approval.')),
    sc('CASH-004', L('Forecast Kas', 'Cash Forecast'), 'T08', 'cash.view', 'NP-02', 'trend', L('Best / base / worst dari AR, AP, payroll, pajak, utilitas, capex dan biaya rutin; asumsi terlihat.', 'Best / base / worst from AR, AP, payroll, tax, utilities, capex and recurring cost; assumptions visible.')),
    sc('CASH-005', L('Rekonsiliasi Bank', 'Bank Reconciliation'), 'T05', 'cash.view', 'NP-02', 'scale', L('Rekening koran vs transaksi sistem: Cocok, Belum Cocok, Selisih, Review.', 'Bank statement vs system transactions: Matched, Unmatched, Difference, Review.')),
    sc('AR-001', L('Antrian Billing Ready', 'Billing Ready Queue'), 'T05', 'ar.view', 'NP-03', 'inbox', L('Transaksi Billing Ready dari Fase 9 siap dijadikan invoice; tidak diketik ulang.', 'Phase 9 Billing Ready transactions ready to invoice; never re-typed.'), L('Belum ada Billing Ready.', 'No Billing Ready yet.')),
    sc('AR-002', L('Invoice Builder', 'Invoice Builder'), 'T04', 'ar.build', 'NP-03', 'invoice', L('Pilih Billing Ready → draft invoice dengan kontrak, rate card, PPN, PO dan dokumen pendukung.', 'Pick Billing Ready → draft invoice with contract, rate card, VAT, PO and supporting documents.')),
    sc('AR-003', L('Detail Invoice', 'Invoice Detail'), 'T03', 'ar.view', 'NP-03', 'file', L('Status Draft → Review → Approved → Issued → Partial / Paid / Overdue; pembayaran dan jurnal.', 'Status Draft → Review → Approved → Issued → Partial / Paid / Overdue; payments and journals.')),
    sc('AR-004', L('AR Aging', 'AR Aging'), 'T08', 'ar.view', 'NP-03', 'clock', L('Current, 1–30, 31–60, 61–90, > 90 hari; DSO, collection rate, ekspektasi penagihan.', 'Current, 1–30, 31–60, 61–90, > 90 days; DSO, collection rate, expected collection.'), null, { dev: 't' }),
    sc('AR-005', L('Collection Workspace', 'Collection Workspace'), 'T05', 'ar.view', 'NP-03', 'headset', L('PIC, follow-up, janji bayar, reminder, pembayaran sebagian, eskalasi dan catatan.', 'PIC, follow-up, promise to pay, reminder, partial payment, escalation and notes.'), null, { dev: 't' }),
    sc('AP-001', L('Daftar Biaya', 'Expense List'), 'T05', 'ap.view', 'NP-04', 'list', L('Invoice supplier, utilitas, sewa, maintenance, reimbursement: Received → Verification → Approved → Scheduled → Paid.', 'Supplier invoices, utilities, rent, maintenance, reimbursements: Received → Verification → Approved → Scheduled → Paid.')),
    sc('AP-002', L('Invoice Supplier', 'Supplier Invoice'), 'T04', 'ap.view', 'NP-04', 'filecheck', L('Three-way match PO vs receiving vs invoice, cek pembayaran ganda, persetujuan dengan maker-checker.', 'Three-way match PO vs receiving vs invoice, duplicate payment check, maker-checker approval.'), null, { dev: 't' }),
    sc('AP-003', L('AP Aging', 'AP Aging'), 'T08', 'ap.view', 'NP-04', 'clock', L('Utang per umur dan supplier, DPO.', 'Payables by age and supplier, DPO.')),
    sc('AP-004', L('Jadwal Pembayaran', 'Payment Schedule'), 'T05', 'ap.view', 'NP-04', 'calendar', L('Pembayaran terjadwal 30 hari dengan dampak ke kas.', 'Scheduled payments for 30 days with the cash impact.')),
    sc('AP-005', L('Detail Pembayaran', 'Payment Detail'), 'T03', 'ap.view', 'NP-04', 'card', L('Pembayaran AP: invoice, rekening, jurnal, rekonsiliasi.', 'AP payment: invoice, account, journal, reconciliation.')),
    sc('HPP-001', L('Dashboard HPP', 'HPP Dashboard'), 'T08', 'hpp.view', 'NP-05', 'gauge', L('HPP/kg per komponen, tren, per layanan, item, klien dan properti.', 'HPP/kg per component, trend, per service, item, client and property.'), null, { lvl: 4 }),
    sc('HPP-002', L('Rincian HPP', 'HPP Breakdown'), 'T03', 'hpp.view', 'NP-05', 'layers', L('Kimia + utilitas + tenaga kerja + mesin + overhead + delivery = HPP/kg; perilaku biaya.', 'Chemical + utility + labour + machine + overhead + delivery = HPP/kg; cost behaviour.')),
    sc('HPP-003', L('Alokasi HPP', 'Allocation'), 'T05', 'hpp.view', 'NP-05', 'sort', L('Driver alokasi per layanan: indeks kimia, kg-eq, menit kerja, stop delivery.', 'Allocation drivers per service: chemical index, kg-eq, labour minutes, delivery stops.')),
    sc('HPP-004', L('HPP Historis', 'Historical HPP'), 'T05', 'hpp.view', 'NP-05', 'history', L('HPP per periode dan versi; periode lama tidak dihitung ulang dengan biaya baru.', 'HPP per period and version; old periods are never recalculated with new costs.')),
    sc('HPP-005', L('HPP Insight', 'HPP Insight'), 'T08', 'hpp.view', 'NP-05', 'bulb', L('Kenapa HPP naik/turun, dampak ke margin, rekomendasi.', 'Why HPP rose or fell, the margin impact, the recommendation.')),
    sc('ITEM-001', L('Item Master', 'Item Master'), 'T05', 'item.view', 'NP-06', 'towel', L('Satu master berat item: kode, kategori, berat standar (kg), unit tagih, versi berlaku.', 'One item-weight master: code, category, standard weight (kg), billing unit, active version.'), null, { dev: 't' }),
    sc('ITEM-002', L('Detail Item', 'Item Detail'), 'T03', 'item.view', 'NP-06', 'shirt', L('Berat standar dan tampilan, konversi pcs → kg-eq, HPP dan harga per item.', 'Standard and display weight, pcs → kg-eq conversion, HPP and price per item.'), null, { dev: 't' }),
    sc('ITEM-003', L('Versi Berat', 'Weight Version'), 'T04', 'item.view', 'NP-06', 'weight', L('Nilai baru, tanggal efektif, alasan, user, persetujuan; riwayat tetap memakai berat lama.', 'New value, effective date, reason, user, approval; history keeps the old weight.'), null, { dev: 't' }),
    sc('ITEM-004', L('Unit Economics', 'Unit Economics'), 'T08', 'item.view', 'NP-06', 'percent', L('Matriks profitabilitas item: HPP/item, profit/item, profit/kg, margin, volume, kontribusi.', 'Item profitability matrix: HPP/item, profit/item, profit/kg, margin, volume, contribution.')),
    sc('PRICE-001', L('Ringkasan Harga', 'Pricing Overview'), 'T08', 'price.view', 'NP-07', 'tag', L('HPP, harga, profit, markup dan gross margin per layanan dan tier; status harga.', 'HPP, price, profit, markup and gross margin per service and tier; pricing status.'), null, { lvl: 4 }),
    sc('PRICE-002', L('Detail Harga', 'Pricing Detail'), 'T03', 'price.view', 'NP-07', 'tag', L('Master, service dan contract price; riwayat harga berversi.', 'Master, service and contract price; versioned price history.')),
    sc('PRICE-003', L('Rekomendasi Harga', 'Recommendation'), 'T05', 'price.view', 'NP-07', 'bulb', L('Harga rekomendasi dengan metode target margin atau target markup yang ditampilkan.', 'Recommended price with the target margin or target markup method shown.')),
    sc('PRICE-004', L('Simulasi Harga', 'Price Scenario'), 'T04', 'price.view', 'NP-07', 'zap', L('Ubah HPP, target margin/markup, harga, volume → revenue, profit, margin, kontribusi, efek BEP.', 'Change HPP, target margin/markup, price, volume → revenue, profit, margin, contribution, BEP effect.')),
    sc('PRICE-005', L('Profitabilitas Klien', 'Client Profitability'), 'T08', 'prof.client', 'NP-07', 'hotel', L('Revenue, biaya langsung & alokasi, kontribusi, margin, AR, DSO, SLA dan health per klien.', 'Revenue, direct & allocated cost, contribution, margin, AR, DSO, SLA and health per client.'), null, { lvl: 4 }),
    sc('INV-001', L('Dashboard Persediaan', 'Inventory Dashboard'), 'T08', 'inv.view', 'NP-08', 'package', L('Nilai stok, status Aman / Menipis / Kritis / Habis, konsumsi per kg, saran pembelian.', 'Stock value, Safe / Low / Critical / Out status, consumption per kg, purchase suggestions.'), null, { dev: 't' }),
    sc('INV-002', L('Daftar Stok', 'Stock List'), 'T05', 'inv.view', 'NP-08', 'list', L('Item stok: min, reorder, max, supplier, harga rata-rata, lokasi.', 'Stock items: min, reorder point, max, supplier, average cost, location.'), null, { dev: 't' }),
    sc('INV-003', L('Detail Stok', 'Stock Detail'), 'T03', 'inv.view', 'NP-08', 'flask', L('Mutasi, konsumsi, penyesuaian dan PR terkait per item.', 'Movements, consumption, adjustments and related PRs per item.'), null, { dev: 't' }),
    sc('INV-004', L('Mutasi Stok', 'Stock Movement'), 'T05', 'inv.view', 'NP-08', 'swap', L('Penerimaan, pemakaian produksi, transfer, retur, penyesuaian, waste, opname dengan bukti.', 'Receipt, production issue, transfer, return, adjustment, waste, stock count with evidence.'), null, { dev: 't' }),
    sc('INV-005', L('Stock Opname', 'Stock Opname'), 'T04', 'inv.view', 'NP-08', 'clipboard', L('Hitung fisik vs sistem, selisih, alasan, persetujuan di atas ambang.', 'Physical vs system count, variance, reason, approval above the threshold.'), null, { dev: 't' }),
    sc('PUR-001', L('Dashboard Purchasing', 'Purchasing Dashboard'), 'T08', 'pur.view', 'NP-09', 'grid', L('PR terbuka, RFQ, PO, penerimaan, komitmen dan kinerja supplier.', 'Open PRs, RFQs, POs, receipts, commitments and supplier performance.'), null, { dev: 't' }),
    sc('PUR-002', L('Purchase Request', 'Purchase Request'), 'T04', 'pur.view', 'NP-09', 'file', L('Item, qty, tanggal butuh, alasan, departemen, cost center, prioritas, referensi budget.', 'Item, qty, needed date, reason, department, cost centre, priority, budget reference.'), null, { dev: 't' }),
    sc('PUR-003', L('Persetujuan PR', 'PR Approval'), 'T05', 'pur.view', 'NP-09', 'filecheck', L('Aturan persetujuan per nilai, departemen, kategori, pemohon.', 'Approval rules by amount, department, category, requester.'), L('Tidak ada PR menunggu.', 'No PR waiting.'), { dev: 't' }),
    sc('PUR-004', L('RFQ', 'RFQ'), 'T05', 'pur.view', 'NP-09', 'message', L('Permintaan penawaran ke beberapa supplier dengan item, qty, jatuh tempo dan termin.', 'Requests for quotation to several suppliers with items, qty, due date and terms.'), null, { dev: 't' }),
    sc('PUR-005', L('Perbandingan Supplier', 'Supplier Comparison'), 'T05', 'pur.view', 'NP-09', 'columns', L('Harga, lead time, termin, kualitas, delivery rating, kinerja historis → pilih supplier dengan alasan.', 'Price, lead time, terms, quality, delivery rating, history → pick a supplier with a reason.'), null, { dev: 't' }),
    sc('PUR-006', L('Purchase Order', 'Purchase Order'), 'T03', 'pur.view', 'NP-09', 'invoice', L('PO, persetujuan, kirim, penerimaan sebagian / penuh, three-way match.', 'PO, approval, send, partial / full receipt, three-way match.'), null, { dev: 't' }),
    sc('PUR-007', L('Detail Supplier', 'Supplier Detail'), 'T03', 'sup.view', 'NP-09', 'briefcase', L('Kontak, termin, lead time, riwayat harga, rating kualitas dan delivery.', 'Contact, terms, lead time, price history, quality and delivery rating.'), null, { dev: 't' }),
    sc('AST-001', L('Dashboard Aset', 'Asset Dashboard'), 'T08', 'ast.view', 'NP-10', 'building', L('Nilai perolehan, akumulasi penyusutan, NBV, status, garansi segera habis.', 'Acquisition cost, accumulated depreciation, NBV, status, warranties ending soon.'), null, { dev: 't' }),
    sc('AST-002', L('Register Aset', 'Asset Register'), 'T05', 'ast.view', 'NP-10', 'list', L('Kode, kategori, merek, serial, perolehan, masa manfaat, NBV, lokasi, PIC, vendor, garansi, status.', 'Code, category, brand, serial, acquisition, useful life, NBV, location, PIC, vendor, warranty, status.'), null, { dev: 't' }),
    sc('AST-003', L('Detail Aset', 'Asset Detail'), 'T03', 'ast.view', 'NP-10', 'washer', L('Data keuangan + data operasional mesin Fase 8, transfer, status dan dokumen.', 'Financial data + Phase 8 machine operations, transfers, status and documents.'), null, { dev: 't' }),
    sc('AST-004', L('Penyusutan', 'Depreciation'), 'T05', 'ast.view', 'NP-10', 'trend', L('Garis lurus per periode: nilai, akumulasi, NBV, status posting.', 'Straight line per period: amount, accumulated, NBV, posted status.')),
    sc('AST-005', L('Insight Penggantian', 'Replacement Insight'), 'T08', 'ast.view', 'NP-10', 'refresh', L('Umur, NBV, downtime, biaya maintenance, utilisasi, kapasitas, energi → pertahankan / perbaiki / ganti / tambah.', 'Age, NBV, downtime, maintenance cost, utilisation, capacity, energy → maintain / repair / replace / add.'), null, { dev: 't' }),
    sc('BUD-001', L('Dashboard Budget', 'Budget Dashboard'), 'T08', 'bud.view', 'NP-11', 'target', L('Budget vs aktual bulan, YTD dan MTD; status On Track / Good / Watch / Over / Critical.', 'Budget vs actual month, YTD and MTD; status On Track / Good / Watch / Over / Critical.'), null, { lvl: 4 }),
    sc('BUD-002', L('Budget vs Aktual', 'Budget vs Actual'), 'T05', 'bud.view', 'NP-11', 'chart', L('Budget, aktual, varian, varian %, status per kategori; ambang terkonfigurasi.', 'Budget, actual, variance, variance %, status per category; configurable thresholds.')),
    sc('BUD-003', L('Pusat Rekonsiliasi', 'Reconciliation Center'), 'T05', 'fin.gl.view', 'NP-11', 'scale', L('Bank, kas, AR, AP, persediaan, aset: saldo buku vs eksternal/fisik, selisih, bukti, reviewer.', 'Bank, cash, AR, AP, inventory, assets: book vs external/physical, difference, evidence, reviewer.')),
    sc('BUD-004', L('Monthly Close', 'Monthly Close'), 'T05', 'fin.gl.view', 'NP-11', 'lock', L('8 checklist closing; hanya user berwenang yang bisa CLOSE PERIOD.', '8 close checklist items; only authorised users can CLOSE PERIOD.')),
    sc('CFO-001', L('CFO Financial Health', 'CFO Financial Health'), 'T08', 'cfo.view', 'NP-12', 'gauge', L('Posisi keuangan, 12 rasio inti, skor kesehatan, kartu keputusan scale-up, aksi teratas.', 'Financial position, 12 core ratios, health score, scale-up decision cards, top actions.'), null, { lvl: 4 }),
    sc('CFO-002', L('Detail Rasio', 'Ratio Detail'), 'T03', 'cfo.view', 'NP-12', 'percent', L('Aktual, target, sebelumnya, tren, gap, status, rumus, sumber, insight, risiko, rekomendasi.', 'Actual, target, previous, trend, gap, status, formula, source, insight, risk, recommendation.'), null, { lvl: 4 }),
    sc('CFO-003', L('Pusat Keputusan Scale-Up', 'Scale-Up Decision Center'), 'T08', 'cfo.view', 'NP-12', 'flag', L('Buka cabang, tim sales, tim operasional, mesin, klien baru, investasi, review harga, hold expansion.', 'Branch, sales team, operations team, machine, new client, investment, pricing review, hold expansion.'), null, { lvl: 4 }),
    sc('CFO-004', L('Detail Keputusan', 'Decision Detail'), 'T03', 'cfo.view', 'NP-12', 'target', L('SIGNAL, WHY, IMPACT, RECOMMENDATION, ACTION; input, bobot, nilai, target, kontribusi, asumsi.', 'SIGNAL, WHY, IMPACT, RECOMMENDATION, ACTION; inputs, weights, values, targets, contribution, assumptions.'), null, { lvl: 4 }),
    sc('CFO-005', L('Scenario Builder', 'Scenario Builder'), 'T04', 'cfo.view', 'NP-12', 'zap', L('Capex, kapasitas, tenaga kerja, maintenance, volume, harga, umur, pembiayaan → ROI, payback, runway, BEP.', 'Capex, capacity, labour, maintenance, volume, price, life, financing → ROI, payback, runway, BEP.'), null, { lvl: 4 }),
    sc('CFO-006', L('Perbandingan Skenario', 'Scenario Comparison'), 'T05', 'cfo.view', 'NP-12', 'columns', L('Saat ini vs skenario A, B, C: investasi, revenue, profit, kas, ROI, payback, BEP, runway, kapasitas, risiko.', 'Current vs scenario A, B, C: investment, revenue, profit, cash, ROI, payback, BEP, runway, capacity, risk.'), null, { lvl: 4 }),
    sc('CFO-007', L('Rekomendasi Aksi', 'Recommended Actions'), 'T05', 'cfo.view', 'NP-12', 'star', L('3–5 aksi teratas dengan prioritas, dampak, owner, bukti → keputusan, race, R2RE, refleksi Fase 5.', 'Top 3–5 actions with priority, impact, owner, evidence → Phase 5 decision, race, R2RE, reflection.'), null, { lvl: 4, dev: 't' })
  ];
  M.screen = function (id) { return by(M.SCREENS, 'id', id); };
  M.PARENTS = { 'ACC-002': ['ACC-001'], 'ACC-003': ['ACC-001'], 'ACC-004': ['ACC-003'], 'ACC-005': ['ACC-001'], 'CASH-002': ['CASH-001'], 'CASH-003': ['CASH-001'], 'CASH-004': ['CASH-001'], 'CASH-005': ['CASH-001'],
    'AR-002': ['AR-001'], 'AR-003': ['AR-004'], 'AR-005': ['AR-004'], 'AP-002': ['AP-001'], 'AP-003': ['AP-001'], 'AP-004': ['AP-001'], 'AP-005': ['AP-004'], 'HPP-002': ['HPP-001'], 'HPP-003': ['HPP-001'], 'HPP-004': ['HPP-001'], 'HPP-005': ['HPP-001'],
    'ITEM-002': ['ITEM-001'], 'ITEM-003': ['ITEM-002'], 'ITEM-004': ['ITEM-001'], 'PRICE-002': ['PRICE-001'], 'PRICE-003': ['PRICE-001'], 'PRICE-004': ['PRICE-001'], 'PRICE-005': ['PRICE-001'],
    'INV-002': ['INV-001'], 'INV-003': ['INV-002'], 'INV-004': ['INV-001'], 'INV-005': ['INV-001'], 'PUR-002': ['PUR-001'], 'PUR-003': ['PUR-001'], 'PUR-004': ['PUR-001'], 'PUR-005': ['PUR-004'], 'PUR-006': ['PUR-001'], 'PUR-007': ['PUR-001'],
    'AST-002': ['AST-001'], 'AST-003': ['AST-002'], 'AST-004': ['AST-001'], 'AST-005': ['AST-001'], 'BUD-002': ['BUD-001'], 'BUD-003': ['BUD-001'], 'BUD-004': ['BUD-001'],
    'CFO-002': ['CFO-001'], 'CFO-003': ['CFO-001'], 'CFO-004': ['CFO-003'], 'CFO-005': ['CFO-003'], 'CFO-006': ['CFO-005'], 'CFO-007': ['CFO-001'] };
  function N(k, l, i, s, x) { return Object.assign({ k: k, l: l, i: i, s: s }, x || {}); }
  function G(k, l, i, sub) { return { k: k, l: l, i: i, sub: sub }; }
  var MENU = { k: 'menu', l: L('Menu', 'Menu'), i: 'menu' };
  var F10 = {
    cfo: N('cfo10', L('CFO Dashboard', 'CFO Dashboard'), 'gauge', 'CFO-001', { also: ['CFO-002'] }), dec: N('dec10', L('Keputusan Scale-Up', 'Scale-Up Decisions'), 'flag', 'CFO-003', { also: ['CFO-004'] }), scn: N('scn10', L('Skenario Investasi', 'Investment Scenarios'), 'zap', 'CFO-005', { also: ['CFO-006'] }), act: N('act10', L('Rekomendasi Aksi', 'Recommended Actions'), 'star', 'CFO-007'),
    acc: N('acc10', L('Finance & Jurnal', 'Finance & Journals'), 'grid', 'ACC-001', { also: ['ACC-002', 'ACC-003', 'ACC-004'] }), per: N('per10', L('Kontrol Periode', 'Period Control'), 'lock', 'ACC-005'),
    cash: N('cash10', L('Kas & Bank', 'Cash & Bank'), 'coins', 'CASH-001', { also: ['CASH-002', 'CASH-003'] }), fc: N('fc10', L('Forecast Kas', 'Cash Forecast'), 'trend', 'CASH-004'), brec: N('brec10', L('Rekonsiliasi Bank', 'Bank Reconciliation'), 'scale', 'CASH-005'),
    bill: N('bill10', L('Billing', 'Billing'), 'inbox', 'AR-001', { also: ['AR-002'] }), ar: N('ar10', L('Piutang (AR)', 'Receivables (AR)'), 'clock', 'AR-004', { also: ['AR-003'] }), coll: N('coll10', L('Collection', 'Collection'), 'headset', 'AR-005'),
    exp: N('exp10', L('Biaya', 'Expenses'), 'list', 'AP-001', { also: ['AP-002'] }), ap: N('ap10', L('Utang (AP)', 'Payables (AP)'), 'clock', 'AP-003'), pay: N('pay10', L('Jadwal Bayar', 'Payment Schedule'), 'calendar', 'AP-004', { also: ['AP-005'] }),
    hpp: N('hpp10', L('Costing & HPP', 'Costing & HPP'), 'gauge', 'HPP-001', { also: ['HPP-002', 'HPP-003', 'HPP-004', 'HPP-005'] }), item: N('item10', L('Item & Berat', 'Items & Weights'), 'towel', 'ITEM-001', { also: ['ITEM-002', 'ITEM-003'] }), ue: N('ue10', L('Unit Economics', 'Unit Economics'), 'percent', 'ITEM-004'),
    price: N('price10', L('Pricing', 'Pricing'), 'tag', 'PRICE-001', { also: ['PRICE-002', 'PRICE-003', 'PRICE-004'] }), prof: N('prof10', L('Profitabilitas Klien', 'Client Profitability'), 'hotel', 'PRICE-005'),
    bud: N('bud10', L('Budget', 'Budget'), 'target', 'BUD-001', { also: ['BUD-002'] }), rec: N('rec10', L('Rekonsiliasi', 'Reconciliation'), 'scale', 'BUD-003'), close: N('close10', L('Monthly Close', 'Monthly Close'), 'lock', 'BUD-004'),
    inv: N('inv10', L('Persediaan', 'Inventory'), 'package', 'INV-001', { also: ['INV-002', 'INV-003'] }), mv: N('mv10', L('Mutasi Stok', 'Stock Movement'), 'swap', 'INV-004'), so: N('so10', L('Stock Opname', 'Stock Opname'), 'clipboard', 'INV-005'),
    pur: N('pur10', L('Purchasing', 'Purchasing'), 'grid', 'PUR-001'), pr: N('pr10', L('Purchase Request', 'Purchase Request'), 'file', 'PUR-002'), prA: N('pra10', L('Persetujuan PR', 'PR Approval'), 'filecheck', 'PUR-003'), rfq: N('rfq10', 'RFQ', 'message', 'PUR-004', { also: ['PUR-005'] }),
    po: N('po10', L('Purchase Order', 'Purchase Order'), 'invoice', 'PUR-006'), sup: N('sup10', L('Supplier', 'Supplier'), 'briefcase', 'PUR-007'),
    ast: N('ast10', L('Aset', 'Assets'), 'building', 'AST-001'), reg: N('reg10', L('Register Aset', 'Asset Register'), 'list', 'AST-002', { also: ['AST-003'] }), dep: N('dep10', L('Penyusutan', 'Depreciation'), 'trend', 'AST-004'), repl: N('repl10', L('Insight Penggantian', 'Replacement Insight'), 'refresh', 'AST-005')
  };
  M.F10NAV = F10;
  var FIN_GROUPS = [G('g-cfo10', L('CFO & Keputusan', 'CFO & Decisions'), 'gauge', [F10.cfo, F10.dec, F10.scn, F10.act]), G('g-acc10', L('Akuntansi', 'Accounting'), 'grid', [F10.acc, F10.per]),
    G('g-cash10', L('Kas & Bank', 'Cash & Bank'), 'coins', [F10.cash, F10.fc, F10.brec]), G('g-ar10', L('Billing & AR', 'Billing & AR'), 'invoice', [F10.bill, F10.ar, F10.coll]), G('g-ap10', L('Biaya & AP', 'Expenses & AP'), 'card', [F10.exp, F10.ap, F10.pay]),
    G('g-cost10', L('Costing & Pricing', 'Costing & Pricing'), 'tag', [F10.hpp, F10.item, F10.ue, F10.price, F10.prof]), G('g-bud10', L('Budget & Kontrol', 'Budget & Control'), 'target', [F10.bud, F10.rec, F10.close]),
    G('g-sup10', L('Persediaan & Pembelian', 'Inventory & Purchasing'), 'package', [F10.inv, F10.pur, F10.prA, F10.po, F10.sup]), G('g-ast10', L('Aset', 'Assets'), 'building', [F10.ast, F10.reg, F10.dep, F10.repl])];
  M.FIN_GROUPS = FIN_GROUPS;
  var NAV_SUP = [N('home', L('Dashboard', 'Dashboard'), 'grid', 'PUR-001'), F10.inv, F10.mv, F10.so, F10.pr, F10.prA, F10.rfq, F10.po, N('rcv10', L('Receiving', 'Receiving'), 'download', 'PUR-006', { q: 'rcv' }), F10.sup];
  var NAV_AST = [N('home', L('Dashboard Aset', 'Asset Dashboard'), 'grid', 'AST-001'), F10.reg, N('link10', L('Machine Link', 'Machine Link'), 'washer', 'AST-003', { q: 'link' }), F10.dep, N('war10', L('Garansi', 'Warranty'), 'shield', 'AST-002', { q: 'war' }),
    N('trf10', L('Transfer', 'Transfer'), 'swap', 'AST-002', { q: 'trf' }), N('doc10', L('Dokumen', 'Documents'), 'file', 'AST-002', { q: 'doc' }), N('life10', L('Lifecycle', 'Lifecycle'), 'refresh', 'AST-005')];
  function role(n, person, title, device, nav, mnav, q, feel, hide) { return { n: n, person: person, title: title, group: 'management', device: device, site: 'Main Plant — Ubud', q: q, feel: feel, nav: nav, mnav: mnav, extra: [], hide: hide, levels: [1, 2, 3, 4] }; }
  M.NEW_ROLES = {
    supply: {
      x: { exp: 'supply', n: L('Supply / Purchasing', 'Supply / Purchasing'), landing: 'PUR-001', land: 'LAND-003', group: 'management' },
      c: role(L('Supply / Purchasing', 'Supply / Purchasing'), 'Rai', L('Supply & Purchasing Officer', 'Supply & Purchasing Officer'), 'ipad', NAV_SUP, [NAV_SUP[0], F10.inv, F10.prA, F10.po, MENU],
        L('Barang apa yang harus saya beli, terima dan jaga stoknya hari ini?', 'What do I buy, receive and keep in stock today?'), L('Stok aman, pembelian terkendali, supplier terukur.', 'Stock safe, purchasing controlled, suppliers measured.'), [L('CFO Dashboard', 'CFO Dashboard'), L('Profitabilitas', 'Profitability'), L('Kas & bank', 'Cash & bank'), L('HR', 'HR')]),
      emp: { id: 'EMP-110', n: 'Rai Suardana', short: 'Rai', dept: L('Supply', 'Supply'), status: 'active' },
      user: { id: 'USR-110', u: 'rai', email: 'rai@jfreshlaundry.app', emp: 'EMP-110', status: 'active', roles: [{ k: 'supply', def: true }], plants: ['*'], lang: 'id' },
      demo: { u: 'rai', d: L('Supply / Purchasing · iPad', 'Supply / Purchasing · iPad') }
    },
    assetadm: {
      x: { exp: 'assetadm', n: L('Asset Admin', 'Asset Admin'), landing: 'AST-001', land: 'LAND-003', group: 'management' },
      c: role(L('Asset Admin', 'Asset Admin'), 'Komang', L('Asset Administrator', 'Asset Administrator'), 'ipad', NAV_AST, [NAV_AST[0], F10.reg, F10.dep, F10.repl, MENU],
        L('Aset mana yang perlu dicatat, dipindah, dirawat atau diganti?', 'Which assets need recording, moving, servicing or replacing?'), L('Setiap aset tercatat, bernilai jelas dan terlacak.', 'Every asset recorded, clearly valued and traceable.'), [L('CFO Dashboard', 'CFO Dashboard'), L('Harga', 'Pricing'), L('Kas & bank', 'Cash & bank'), L('HR', 'HR')]),
      emp: { id: 'EMP-111', n: 'Komang Ariawan', short: 'Komang', dept: L('Finance · Aset', 'Finance · Assets'), status: 'active' },
      user: { id: 'USR-111', u: 'komang', email: 'komang@jfreshlaundry.app', emp: 'EMP-111', status: 'active', roles: [{ k: 'assetadm', def: true }], plants: ['*'], lang: 'id' },
      demo: { u: 'komang', d: L('Asset Admin · register & penyusutan', 'Asset Admin · register & depreciation') }
    }
  };
  var PLACEHOLDER = ['FIN-BIL-001', 'FIN-INV-001', 'FIN-PAY-002', 'FIN-AR-001', 'FIN-CN-001', 'INV-STK-001'];
  /* install(): joins the Phase 10 permissions, screens, menus and the two new roles to the shared config and access
     roles, replaces the Phase 2 finance and stock placeholders in the menus, feeds Phase 5. Safe to call more than once. */
  M.install = function (C, X, P, CM2, LG2, PR2, DL2) {
    if (!C || C.__p10) return; C.__p10 = true;
    if (CM2) M.CM = CM2; if (LG2) M.LG = LG2; if (PR2) M.PR = PR2; if (DL2) M.DL = DL2; if (X) M.X = X;
    Object.keys(M.PERMS).forEach(function (k) { C.PERMS[k] = M.PERMS[k]; });
    function addP(list, extra) { extra.forEach(function (p) { if (list.indexOf(p) < 0) list.push(p); }); }
    Object.keys(M.NEW_ROLES).forEach(function (r) {
      var d = M.NEW_ROLES[r];
      if (!C.ROLES[r]) { C.ROLES[r] = Object.assign({ perms: M.ROLE_PERMS[r].slice() }, d.c); if (C.ROLE_ORDER.indexOf(r) < 0) C.ROLE_ORDER.splice(C.ROLE_ORDER.indexOf('owner'), 0, r); }
      if (X) {
        if (!X.ROLES[r]) X.ROLES[r] = Object.assign({ perms: M.ROLE_PERMS[r].slice() }, d.x);
        if (!X.employee(d.emp.id)) X.EMPLOYEES.push(d.emp);
        if (!X.USERS.some(function (u) { return u.u === d.user.u; })) X.USERS.push(Object.assign({}, d.user));
        if (!X.DEMO.some(function (x) { return x.u === d.demo.u; })) X.DEMO.push(d.demo);
      }
    });
    Object.keys(M.ROLE_PERMS).forEach(function (r) { var rl = C.ROLES[r], xr = X && X.ROLES[r]; if (rl) addP(rl.perms, M.ROLE_PERMS[r]); if (xr && xr.perms) addP(xr.perms, M.ROLE_PERMS[r]); });
    function strip(list) { return list.filter(function (n) { return PLACEHOLDER.indexOf(n.s) < 0; }).map(function (n) { return n.sub ? Object.assign({}, n, { sub: n.sub.map(function (x) { return x.s === 'INV-STK-001' ? Object.assign({}, x, { s: 'INV-001' }) : x; }) }) : n; }); }
    var fin = C.ROLES.finance;
    if (fin) { var fi = Math.max(1, fin.nav.map(function (n) { return n.k; }).indexOf('home') + 1); fin.nav = strip(fin.nav); fin.nav.splice(fi, 0, FIN_GROUPS[0], FIN_GROUPS[1], FIN_GROUPS[2], FIN_GROUPS[3], FIN_GROUPS[4], FIN_GROUPS[5], FIN_GROUPS[6], FIN_GROUPS[7], FIN_GROUPS[8]);
      fin.mnav = [fin.mnav[0], N('ar10', L('Piutang', 'AR'), 'clock', 'AR-004', { also: ['AR-003', 'AR-005'] }), N('cash10', L('Kas', 'Cash'), 'coins', 'CASH-001'), N('act10', L('Aksi', 'Actions'), 'star', 'CFO-007'), MENU]; }
    var own = C.ROLES.owner;
    if (own) { own.nav = strip(own.nav); var oi = own.nav.map(function (n) { return n.k; }).indexOf('brief'); oi = oi < 0 ? 1 : oi + 1;
      own.nav.splice(oi, 0, G('g-cfo10', L('CFO & Scale-Up', 'CFO & Scale-Up'), 'gauge', [F10.cfo, F10.dec, F10.act, F10.scn, F10.prof, F10.hpp, F10.price, F10.cash, F10.ar, F10.bud]));
      own.nav.push(G('g-sup10', L('Persetujuan Pembelian & Aset', 'Purchasing & Asset Approvals'), 'filecheck', [F10.prA, F10.po, F10.inv, F10.ast, F10.repl]));
      own.mnav = own.mnav.map(function (n) { return n.k === 'fhlt' ? N('cfo10', 'CFO', 'gauge', 'CFO-001', { also: ['CFO-002', 'CFO-004', 'CFO-007'] }) : n; }); }
    var ops = C.ROLES.opsmgr;
    if (ops) { var ii = ops.nav.map(function (n) { return n.s; }).indexOf('INV-STK-001'); ops.nav = strip(ops.nav);
      ops.nav.splice(ii < 0 ? ops.nav.length : ii, 0, G('g-cost10', L('Biaya, Stok & Mesin', 'Cost, Stock & Machines'), 'gauge', [F10.hpp, F10.ue, F10.inv, F10.mv, F10.pr, F10.repl])); }
    var orig = C.screen, extra = {};
    M.SCREENS.forEach(function (s) { extra[s.id] = s; });
    C.screen = function (id) { return extra[id] || orig(id); };
    C.SCREENS_P10 = M.SCREENS;
    if (P) M.perfFeed(P);
    if (X) M.joinNotifs(X);
    M.sync();
  };
})(typeof window !== 'undefined' ? window : this);
