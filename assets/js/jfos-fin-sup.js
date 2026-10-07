/* ==========================================================================
   JFRESH OS — Phase 10 engine · part 3 of 4: supply & assets.
   NP-08 inventory (master, stock status, movements with a full record, no
   silent adjustment, stock count with approval above a threshold, production
   consumption that feeds HPP, reorder suggestions), NP-09 purchasing (PR with
   configurable approval rules, RFQ, supplier comparison, PO, receiving,
   three-way match, supplier master and price history) and NP-10 assets
   (register, straight-line depreciation per period, NBV, transfer and status
   history, the machine link to Phase 8 and the replacement insight).
   Phase 8 keeps operational maintenance; this part only reads it (§52, §101).
   ========================================================================== */
(function (root) {
  var M = root.JFFIN || (typeof require !== 'undefined' ? require('./jfos-fin.js') : null);
  if (!M || M._ext.sup) return; M._ext.sup = true;
  var D = M.D, U = M.u, L = U.L, T = U.T, sum = U.sum, r0 = U.r0, r1 = U.r1, pct = U.pct, by = U.by, can = M.can, bad = M.bad, deny = M.deny, str = U.str, num = U.num, JT = M.JT;
  function S() { return M.state(); }
  function save() { M.save(); }
  function nowS() { return M.nowS(); }

  /* ---------- NP-08 inventory (§39–§44) ---------- */
  M.STOCK_ST = { aman: [L('Aman', 'Safe'), 'ok'], menipis: [L('Menipis', 'Low'), 'warn'], critical: [L('Kritis', 'Critical'), 'crit'], habis: [L('Habis', 'Out of Stock'), 'crit'] };
  M.MV_TYPES = { receipt: [L('Penerimaan Pembelian', 'Purchase Receipt'), 'ok', 'download'], issue: [L('Pemakaian Produksi', 'Issue to Production'), 'info', 'upload'], transfer: [L('Transfer', 'Transfer'), 'info', 'swap'], return: [L('Retur', 'Return'), 'info', 'arrowl'],
    adjust: [L('Penyesuaian', 'Adjustment'), 'appr', 'edit'], waste: [L('Waste', 'Waste'), 'crit', 'trash'], opname: [L('Stock Opname', 'Stock Count'), 'appr', 'clipboard'] };
  M.ADJ_ST = { pending: [L('Menunggu Persetujuan', 'Pending Approval'), 'appr'], applied: [L('Diterapkan', 'Applied'), 'ok'], rejected: [L('Ditolak', 'Rejected'), 'crit'] };
  M._seed.push(function (s) {
    s.stock = D.STOCK.map(function (x) { return { code: x[0], n: L(x[1], x[2]), cat: x[3], unit: x[4], min: x[5], rop: x[6], max: x[7], sup: x[8], avg: x[9], loc: x[10], qty: x[11], cons: x[12], gl: x[13], status: 'active' }; });
    s.moves = D.MOVES.map(function (x) { var it = by(s.stock, 'code', x[3]); return { id: x[0], at: x[1], type: x[2], item: x[3], qty: x[4], unit: it ? it.unit : '', from: x[5], to: x[6], src: x[7], reason: x[8], by: x[9], ev: x[7], cost: it ? it.avg : 0, jv: null }; });
    s.adj = []; s.opname = [JSON.parse(JSON.stringify(D.OPNAME))]; s.opname[0].lines = s.opname[0].lines.map(function (l) { return { item: l[0], sys: l[1], phys: l[2], reason: l[3] }; });
    s.scfg = Object.assign({}, D.STOCK_CFG);
  });
  // Movement numbers continue after the seeded movements (the core seq has no 'mv' counter).
  function mvNid(pre, pad) { var s = S(); if (s.seq.mv == null || isNaN(s.seq.mv)) s.seq.mv = s.moves.length + 1; return M.nid('mv', pre, pad); }
  M.stock = function (code) { return by(S().stock, 'code', code); };
  M.stockName = function (code) { var x = M.stock(code); return x ? x.n : L(code, code); };
  M.stockSt = function (x) { return x.qty <= 0 ? 'habis' : x.qty <= x.min ? 'critical' : x.qty <= x.rop ? 'menipis' : 'aman'; };
  M.stockList = function (ctx, f) {
    if (!can(ctx, 'inv.view')) return [];
    f = f || {};
    return S().stock.filter(function (x) { return (!f.cat || x.cat === f.cat) && (!f.st || M.stockSt(x) === f.st) && (!f.q || (x.code + ' ' + T(x.n)).toLowerCase().indexOf(String(f.q).toLowerCase()) >= 0); });
  };
  M.stockValue = function (x) { return Math.round(x.qty * x.avg); };
  M.stockValueByGl = function (s) { var o = {}; (s || S()).stock.forEach(function (x) { o[x.gl] = (o[x.gl] || 0) + Math.round(x.qty * x.avg); }); return o; };
  M.move = function (id) { return by(S().moves, 'id', id); };
  M.moves = function (ctx, f) { if (!can(ctx, 'inv.view')) return []; f = f || {}; return S().moves.filter(function (m) { return (!f.item || m.item === f.item) && (!f.type || m.type === f.type); }).sort(function (a, b) { return a.at < b.at ? 1 : -1; }); };
  var ISSUE_GL = { '1310': '5100', '1320': '5200', '1330': '5900' };
  function mvJournal(m, it) {
    var val = Math.round(Math.abs(m.qty) * m.cost), date = m.at.slice(0, 10), gl = it.gl;
    var cost = it.cat === 'sparepart' ? '6400' : it.cat === 'office' ? '6300' : ISSUE_GL[gl];
    var desc = L(T(M.MV_TYPES[m.type][0]) + ' ' + it.code + ' · ' + Math.abs(m.qty) + ' ' + it.unit, M.MV_TYPES[m.type][0][1] + ' ' + it.code + ' · ' + Math.abs(m.qty) + ' ' + it.unit);
    if (!val) return null;
    if (m.type === 'issue' || m.type === 'waste') return { date: date, desc: desc, src: { t: 'mv', id: m.id }, ref: m.src, lines: [{ a: m.type === 'waste' ? '5900' : cost, d: val, cc: 'CC-PRD' }, { a: gl, c: val }] };
    if (m.type === 'return') return { date: date, desc: desc, src: { t: 'mv', id: m.id }, ref: m.src, lines: [{ a: gl, d: val }, { a: cost, c: val, cc: 'CC-PRD' }] };
    if (m.type === 'adjust' || m.type === 'opname') return { date: date, desc: desc, src: { t: 'mv', id: m.id }, ref: m.src, lines: m.qty > 0 ? [{ a: gl, d: val }, { a: '5900', c: val }] : [{ a: '5900', d: val }, { a: gl, c: val }] };
    return null;   // receipts post through the goods receipt; transfers stay in the same account
  }
  // Seed: goods receipts and stock movements of October get their journals (called from the ledger build).
  M.seedOps = function (s, J) {
    s.grns.forEach(function (g) { var o = grnJournal(g, s); if (o && g.at >= '2026-09-30') g.jv = J(o).id; });
    s.moves.forEach(function (m) { var it = by(s.stock, 'code', m.item); var o = it && mvJournal(m, it); if (o && m.at >= '2026-10-01') m.jv = J(o).id; });
  };
  function lowCheck(ctx, it) {
    var stx = M.stockSt(it);
    if ((stx === 'critical' || stx === 'habis') && !S().notifs.some(function (n) { return n.kind === 'stock' && n.rec === it.code && n.at.slice(0, 10) === M.today(); })) M.notify('inv.view', 'stock', it.code, { qty: it.qty, unit: it.unit });
  }
  // Record a movement (§41): item, qty, unit, from, to, source, reason, user, time, evidence. Receipts only through receiving.
  M.recordMove = function (ctx, o) {
    if (!can(ctx, 'inv.move')) return deny(ctx, 'move');
    o = o || {};
    var it = M.stock(o.item), q = num(o.qty); if (!it || q == null || isNaN(q) || q <= 0) return bad(M.MSG.invalid);
    if (['issue', 'transfer', 'return', 'waste'].indexOf(o.type) < 0) return bad(L('Penerimaan lewat receiving PO; penyesuaian lewat pengajuan.', 'Receipts go through PO receiving; adjustments through a request.'), 'type');
    if (!str(o.src)) return bad(L('Sumber wajib (batch, work order, dokumen).', 'A source is required (batch, work order, document).'), 'src');
    if (o.type === 'waste' && !str(o.reason)) return bad(M.MSG.reason, 'reason');
    if (o.type !== 'return' && q > it.qty) return bad(L('Qty melebihi stok tersedia (' + it.qty + ' ' + it.unit + ').', 'Qty exceeds available stock (' + it.qty + ' ' + it.unit + ').'), 'qty');
    var to = o.type === 'transfer' ? (o.to || null) : o.type === 'issue' ? (o.to || (it.loc.indexOf('GNY') >= 0 ? 'PROD-GNY' : 'PROD-UBD')) : o.type === 'return' ? it.loc : null;
    if (o.type === 'transfer' && !D.LOCS[to]) return bad(L('Pilih lokasi tujuan.', 'Choose the destination.'));
    var m = { id: mvNid('MV-' + M.today().slice(2, 4) + M.today().slice(5, 7) + '-', 3), at: nowS(), type: o.type, item: it.code, qty: o.type === 'return' ? q : -q, unit: it.unit, from: o.type === 'return' ? (o.from || 'PROD-UBD') : it.loc, to: to, src: str(o.src), reason: str(o.reason) ? L(str(o.reason), str(o.reason)) : M.MV_TYPES[o.type][0], by: M.empId(ctx), ev: str(o.ev) || str(o.src), cost: it.avg, jv: null };
    var jo = mvJournal(m, it); if (jo) { jo.by = M.empId(ctx); var r = M._postJ(jo, ctx); if (!r.ok) return r; m.jv = r.jv.id; }
    if (o.type !== 'transfer') it.qty += m.qty; else it.loc = it.loc;   // a transfer moves the location record, the company quantity stays
    S().moves.push(m); lowCheck(ctx, it); M.audit('STOCK.MOVE', ctx, { rec: m.id, to: it.code + ' ' + m.qty }); save();
    return { ok: true, move: m, item: it, st: M.stockSt(it) };
  };
  // §44: no silent adjustment. Old, new, variance, reason, user, time; approval above the threshold.
  M.requestAdjust = function (ctx, code, newQty, reason, ev) {
    if (!can(ctx, 'inv.adjust')) return deny(ctx, code);
    var it = M.stock(code), n = num(newQty); if (!it || n == null || isNaN(n) || n < 0) return bad(M.MSG.invalid);
    if (!str(reason)) return bad(M.MSG.reason, 'reason');
    var a = { id: M.nid('ex', 'ADJ-' + M.today().slice(2, 4) + M.today().slice(5, 7) + '-', 3), item: code, old: it.qty, nw: n, varQ: n - it.qty, varV: Math.round((n - it.qty) * it.avg), reason: str(reason), ev: str(ev) || null, by: M.empId(ctx), at: nowS(), st: 'pending', appr: null, src: 'manual' };
    if (!a.varQ) return bad(L('Tidak ada selisih.', 'There is no difference.'));
    S().adj.unshift(a);
    if (Math.abs(a.varV) > S().scfg.adjApproval) { M.audit('STOCK.ADJUST.REQUEST', ctx, { rec: a.id, from: a.old, to: a.nw, reason: reason }); M.notify('inv.approve', 'adjappr', a.id, { v: a.varV }); save(); return { ok: true, adj: a, pending: true }; }
    return applyAdj(ctx, a);
  };
  function applyAdj(ctx, a) {
    var it = M.stock(a.item), m = { id: mvNid('MV-' + M.today().slice(2, 4) + M.today().slice(5, 7) + '-', 3), at: nowS(), type: a.src === 'opname' ? 'opname' : 'adjust', item: it.code, qty: a.nw - it.qty, unit: it.unit, from: it.loc, to: it.loc, src: a.ref || a.id, reason: L(a.reason, a.reason), by: a.by, ev: a.ev || a.id, cost: it.avg, jv: null };
    if (m.qty) { var jo = mvJournal(m, it); if (jo) { var r = M._postJ(jo, ctx); if (!r.ok) return r; m.jv = r.jv.id; } S().moves.push(m); it.qty = a.nw; }
    a.st = 'applied'; a.appr = a.appr || M.empId(ctx); a.mv = m.id;
    M.audit('STOCK.ADJUST', ctx, { rec: a.id, from: a.old, to: a.nw, reason: a.reason }); lowCheck(ctx, it); save();
    return { ok: true, adj: a, move: m };
  }
  M.decideAdjust = function (ctx, id, ok, reason) {
    if (!can(ctx, 'inv.approve')) return deny(ctx, id);
    var a = by(S().adj, 'id', id); if (!a || a.st !== 'pending') return bad(M.MSG.jump, 'jump');
    if (a.by === M.empId(ctx)) return bad(M.MSG.maker, 'maker');
    if (!ok) { if (!str(reason)) return bad(M.MSG.reason, 'reason'); a.st = 'rejected'; a.rej = reason; M.audit('STOCK.ADJUST.REJECT', ctx, { rec: id, reason: reason }); save(); return { ok: true, adj: a }; }
    a.appr = M.empId(ctx); return applyAdj(ctx, a);
  };
  M.adjustments = function (ctx) { return can(ctx, 'inv.view') ? S().adj : []; };
  // Stock opname (INV-005): count, submit, approve → adjustments for every variance.
  M.opnames = function (ctx) { return can(ctx, 'inv.view') ? S().opname : []; };
  M.opname = function (id) { return by(S().opname, 'id', id); };
  M.startOpname = function (ctx, codes) {
    if (!can(ctx, 'inv.adjust')) return deny(ctx, 'opname');
    if (S().opname.some(function (o) { return o.st === 'count'; })) return bad(L('Masih ada stock opname yang berjalan.', 'A stock count is already running.'), 'running');
    var list = (codes && codes.length ? codes : S().stock.map(function (x) { return x.code; })).map(M.stock).filter(Boolean);
    var o = { id: 'SO-' + M.today().slice(2, 4) + M.today().slice(5, 7) + '-' + String(S().opname.length + 1).padStart(2, '0'), at: nowS(), by: M.empId(ctx), st: 'count', lines: list.map(function (x) { return { item: x.code, sys: x.qty, phys: null, reason: '' }; }) };
    S().opname.unshift(o); M.audit('OPNAME.START', ctx, { rec: o.id }); save(); return { ok: true, op: o };
  };
  M.countOpname = function (ctx, id, code, phys, reason) {
    if (!can(ctx, 'inv.adjust')) return deny(ctx, id);
    var o = M.opname(id); if (!o || o.st !== 'count') return bad(M.MSG.jump, 'jump');
    var l = by(o.lines, 'item', code), n = num(phys); if (!l || n == null || isNaN(n) || n < 0) return bad(M.MSG.invalid);
    l.phys = n; l.reason = str(reason); save(); return { ok: true, line: l };
  };
  M.submitOpname = function (ctx, id) {
    if (!can(ctx, 'inv.adjust')) return deny(ctx, id);
    var o = M.opname(id); if (!o || o.st !== 'count') return bad(M.MSG.jump, 'jump');
    if (o.lines.some(function (l) { return l.phys == null; })) return bad(L('Semua item harus dihitung.', 'Every item must be counted.'), 'incomplete');
    if (o.lines.some(function (l) { return l.phys !== l.sys && !l.reason; })) return bad(L('Isi alasan untuk setiap selisih.', 'Enter a reason for every difference.'), 'reason');
    o.st = 'review'; o.sub = nowS(); M.audit('OPNAME.SUBMIT', ctx, { rec: id }); M.notify('inv.approve', 'adjappr', id, {}); save(); return { ok: true, op: o };
  };
  M.opnameVar = function (o) { return o.lines.map(function (l) { var it = M.stock(l.item); return Object.assign({}, l, { it: it, varQ: l.phys == null ? null : l.phys - l.sys, varV: l.phys == null ? null : Math.round((l.phys - l.sys) * (it ? it.avg : 0)) }); }); };
  M.approveOpname = function (ctx, id) {
    if (!can(ctx, 'inv.approve')) return deny(ctx, id);
    var o = M.opname(id); if (!o || o.st !== 'review') return bad(M.MSG.jump, 'jump');
    if (o.by === M.empId(ctx)) return bad(M.MSG.maker, 'maker');
    var n = 0;
    o.lines.forEach(function (l) {
      if (l.phys === l.sys) return; var it = M.stock(l.item), nw = it.qty + (l.phys - l.sys);
      var a = { id: M.nid('ex', 'ADJ-' + M.today().slice(2, 4) + M.today().slice(5, 7) + '-', 3), item: l.item, old: it.qty, nw: nw, varQ: l.phys - l.sys, varV: Math.round((l.phys - l.sys) * it.avg), reason: (l.reason ? T(l.reason) : 'Stock opname') + ' (' + o.id + ')', ev: o.id, by: o.by, at: nowS(), st: 'pending', appr: M.empId(ctx), src: 'opname', ref: o.id };
      S().adj.unshift(a); applyAdj(ctx, a); n++;
    });
    o.st = 'approved'; o.appr = M.empId(ctx); o.apprAt = nowS(); M.audit('OPNAME.APPROVE', ctx, { rec: id, to: n + ' adj' }); save();
    return { ok: true, op: o, n: n };
  };
  // §43 consumption: chemical per kg equivalent this month vs standard, packaging per order, waste %, material variance.
  M.consumption = function (ctx) {
    if (!can(ctx, 'inv.view') && !can(ctx, 'hpp.view')) return null;
    var p = M.curPeriod(), kgeq = sum(S().br.filter(function (b) { return U.ym(b.date) === p; }).map(function (b) { return b.unit === 'pcs' ? b.qty * M.pcsWeight(b.svc) : b.qty; }));
    var rows = S().stock.filter(function (x) { return x.cons > 0; }).map(function (x) {
      var used = -sum(S().moves.filter(function (m) { return m.item === x.code && m.type === 'issue' && U.ym(m.at) === p; }).map(function (m) { return m.qty; }));
      var waste = -sum(S().moves.filter(function (m) { return m.item === x.code && m.type === 'waste' && U.ym(m.at) === p; }).map(function (m) { return m.qty; }));
      var std = x.cons * kgeq / 1000, act = used;
      return { it: x, used: used, waste: waste, std: r1(std), perK: kgeq ? r1(used / kgeq * 1000 * 100) / 100 : null, stdPerK: x.cons, varPct: std ? r1((act - std) / std * 100) : null, wastePct: used + waste ? r1(waste / (used + waste) * 100) : 0, val: Math.round(used * x.avg) };
    });
    var chem = rows.filter(function (r) { return r.it.gl === '1310'; }), chemVal = sum(chem.map(function (r) { return r.val; }));
    var pkgUsed = -sum(S().moves.filter(function (m) { return /^PKG-PLS/.test(m.item) && m.type === 'issue' && U.ym(m.at) === p; }).map(function (m) { return m.qty; }));
    var orders = M.DL && M.DL.state ? M.DL.state().dlv.filter(function (d) { return U.ym(d.date) === p; }).length + S().br.filter(function (b) { return b.src === 'seed'; }).length * 4 : 1;
    return { p: p, kgeq: kgeq, rows: rows, chemVal: chemVal, chemPerKg: kgeq ? chemVal / kgeq : null, pkgPerOrder: orders ? r1(pkgUsed / orders) : null, wastePct: r1(sum(rows.map(function (r) { return r.waste * r.it.avg; })) / Math.max(1, sum(rows.map(function (r) { return (r.used + r.waste) * r.it.avg; }))) * 100) };
  };
  // §42 reorder suggestions: below the reorder point and no open PR / PO for the item.
  M.reorder = function (ctx) {
    if (!can(ctx, 'inv.view')) return [];
    return S().stock.filter(function (x) { return x.qty <= x.rop; }).map(function (x) {
      var openPr = S().prs.filter(function (p) { return p.item === x.code && ['draft', 'submitted', 'review', 'approved'].indexOf(p.st) >= 0; })[0] || null;
      var openPo = S().pos.filter(function (p) { return ['approved', 'sent', 'partial'].indexOf(p.st) >= 0 && p.lines.some(function (l, i) { return l[0] === x.code && (p.rcv[i] || 0) < l[1]; }); })[0] || null;
      return { it: x, st: M.stockSt(x), qty: Math.max(0, x.max - x.qty), sup: x.sup, pr: openPr, po: openPo };
    }).sort(function (a, b) { var o = { habis: 0, critical: 1, menipis: 2, aman: 3 }; return o[a.st] - o[b.st]; });
  };

  /* ---------- NP-09 purchasing & suppliers (§45–§51) ---------- */
  M.PR_ST = { draft: [L('Draft', 'Draft'), 'mute'], submitted: [L('Diajukan', 'Submitted'), 'appr'], review: [L('Review', 'Review'), 'appr'], approved: [L('Disetujui', 'Approved'), 'ok'], rejected: [L('Ditolak', 'Rejected'), 'crit'], converted: [L('Jadi RFQ / PO', 'Converted to RFQ / PO'), 'info'] };
  M.PO_ST = { draft: [L('Draft', 'Draft'), 'mute'], approved: [L('Disetujui', 'Approved'), 'info'], sent: [L('Terkirim', 'Sent'), 'info'], partial: [L('Diterima Sebagian', 'Partial Receipt'), 'warn'], received: [L('Diterima', 'Received'), 'ok'], closed: [L('Ditutup', 'Closed'), 'mute'], cancelled: [L('Dibatalkan', 'Cancelled'), 'mute'] };
  M.RFQ_ST = { open: [L('Menunggu Penawaran', 'Waiting for Quotes'), 'appr'], quoted: [L('Penawaran Masuk', 'Quotes In'), 'info'], awarded: [L('Supplier Dipilih', 'Supplier Selected'), 'ok'], cancelled: [L('Dibatalkan', 'Cancelled'), 'mute'] };
  M.PRIO = { urgent: [L('Mendesak', 'Urgent'), 'crit'], high: [L('Tinggi', 'High'), 'warn'], normal: [L('Normal', 'Normal'), 'mute'] };
  M._seed.push(function (s) {
    s.sups = D.SUPPLIERS.map(function (x) { return { id: x[0], n: x[1], cat: x[2], contact: x[3], phone: x[4], city: x[5], term: x[6], lead: x[7], q: x[8], dr: x[9], st: x[10] }; });
    s.prs = D.PRS.map(function (x) { return { id: x[0], at: x[1], item: x[2], qty: x[3], need: x[4], reason: x[5], dept: x[6], cc: x[7], pic: x[8], pri: x[9], bud: x[10], st: x[11], est: x[12], appr: x[11] === 'approved' || x[11] === 'converted' ? 'EMP-030' : null, log: [] }; });
    s.rfqs = JSON.parse(JSON.stringify(D.RFQS));
    s.pos = D.POS.map(function (p) { return Object.assign({ log: [] }, JSON.parse(JSON.stringify(p))); });
    s.grns = D.GRNS.map(function (x) { return { id: x[0], at: x[1], po: x[2], qty: x[3], by: x[4], note: x[5], jv: null }; });
    s.plogSup = D.PRICE_LOG.map(function (x) { return { sup: x[0], item: x[1], date: x[2], price: x[3] }; });
  });
  M.supName = function (id) { var s = by(S().sups, 'id', id); return s ? s.n : id || '—'; };
  M.supplier = function (id) { return by(S().sups, 'id', id); };
  M.suppliers = function (ctx, f) { if (!can(ctx, 'sup.view')) return []; f = f || {}; return S().sups.filter(function (s) { return !f.cat || s.cat === f.cat; }); };
  M.supPerf = function (id) {
    var p = D.SUP_PERF[id] || [0, 0, 0], s = M.supplier(id);
    var spend = sum(S().exp.filter(function (e) { return e.sup === id && e.st !== 'rejected'; }).map(function (e) { return e.amt + e.tax; })) + sum(S().pos.filter(function (o) { return o.sup === id && ['approved', 'sent', 'partial', 'received'].indexOf(o.st) >= 0; }).map(M.poTotal));
    var openAp = sum(S().exp.filter(function (e) { return e.sup === id && ['approved', 'scheduled', 'partial'].indexOf(e.st) >= 0; }).map(function (e) { return e.amt + e.tax - e.paid; }));
    return { orders: p[0], onTime: p[1], otd: p[0] ? r1(p[1] / p[0] * 100) : null, issues: p[2], spend: spend, openAp: openAp, q: s ? s.q : null, dr: s ? s.dr : null, prices: S().plogSup.filter(function (x) { return x.sup === id; }).sort(function (a, b) { return a.date < b.date ? 1 : -1; }) };
  };
  M.prAmount = function (p) { return Math.round(p.qty * p.est); };
  // §47 approval rules: amount, department, category, requester.
  M.prRule = function (p) {
    var it = M.stock(p.item), amt = M.prAmount(p), cat = it ? it.cat : 'machine';
    var lvl = (cat === 'machine' || /^CAPEX/.test(p.item) || amt > D.PR_RULES[0].lim) ? 'owner' : 'finance';
    return { lvl: lvl, amt: amt, why: lvl === 'owner' ? (amt > D.PR_RULES[0].lim ? D.PR_RULES[1].l : D.PR_RULES[2].l) : D.PR_RULES[0].l };
  };
  M.pr = function (id) { return by(S().prs, 'id', id); };
  M.prs = function (ctx, f) { if (!can(ctx, 'pur.view') && !can(ctx, 'pur.pr')) return []; f = f || {}; return S().prs.filter(function (p) { return !f.st || p.st === f.st; }).sort(function (a, b) { return a.at < b.at ? 1 : -1; }); };
  M.createPr = function (ctx, o) {
    if (!can(ctx, 'pur.pr')) return deny(ctx, 'pr');
    o = o || {}; var it = M.stock(o.item), q = num(o.qty);
    if (!it || q == null || isNaN(q) || q <= 0 || !o.need || !str(o.reason)) return bad(M.MSG.invalid);
    var p = { id: M.nid('ex', 'PR-' + M.today().slice(2, 4) + M.today().slice(5, 7) + '-1', 2), at: nowS(), item: it.code, qty: q, need: o.need, reason: str(o.reason), dept: o.dept || 'OPS', cc: o.cc || 'CC-PRD', pic: M.empId(ctx), pri: o.pri || 'normal', bud: o.bud || null, st: o.submit ? 'submitted' : 'draft', est: it.avg, appr: null, log: [{ at: nowS(), by: M.empId(ctx), to: o.submit ? 'submitted' : 'draft' }] };
    S().prs.unshift(p); M.audit('PR.CREATE', ctx, { rec: p.id, to: it.code + ' ' + q }); if (p.st === 'submitted') M.notify('pur.approve', 'prappr', p.id, { amt: M.prAmount(p) }); save();
    return { ok: true, pr: p };
  };
  M.submitPr = function (ctx, id) { if (!can(ctx, 'pur.pr')) return deny(ctx, id); var p = M.pr(id); if (!p || p.st !== 'draft') return bad(M.MSG.jump, 'jump'); p.st = 'submitted'; p.log.push({ at: nowS(), by: M.empId(ctx), to: 'submitted' }); M.audit('PR.SUBMIT', ctx, { rec: id }); M.notify('pur.approve', 'prappr', id, { amt: M.prAmount(p) }); save(); return { ok: true, pr: p }; };
  M.decidePr = function (ctx, id, act, reason) {
    if (!can(ctx, 'pur.approve')) return deny(ctx, id);
    var p = M.pr(id); if (!p || ['submitted', 'review'].indexOf(p.st) < 0) return bad(M.MSG.jump, 'jump');
    if (p.pic === M.empId(ctx)) return bad(M.MSG.maker, 'maker');
    var rule = M.prRule(p);
    if (act === 'approve' && rule.lvl === 'owner' && ctx.roleKey !== 'owner') return bad(L('PR ini butuh persetujuan Owner: ' + rule.why[0], 'This PR needs Owner approval: ' + rule.why[1]), 'level', { rule: rule });
    if ((act === 'reject' || act === 'review') && !str(reason)) return bad(M.MSG.reason, 'reason');
    var to = act === 'approve' ? 'approved' : act === 'reject' ? 'rejected' : 'review';
    p.st = to; if (to === 'approved') { p.appr = M.empId(ctx); p.apprAt = nowS(); } p.log.push({ at: nowS(), by: M.empId(ctx), to: to, reason: reason || null });
    M.audit(to === 'approved' ? 'PR.APPROVE' : 'PR.' + to.toUpperCase(), ctx, { rec: id, to: to, reason: reason }); save();
    return { ok: true, pr: p };
  };
  M.rfq = function (id) { return by(S().rfqs, 'id', id); };
  M.rfqs = function (ctx) { return can(ctx, 'pur.view') || can(ctx, 'pur.rfq') ? S().rfqs.slice().sort(function (a, b) { return a.at < b.at ? 1 : -1; }) : []; };
  M.createRfq = function (ctx, prIds, sups, due) {
    if (!can(ctx, 'pur.rfq')) return deny(ctx, 'rfq');
    var prs = (prIds || []).map(M.pr).filter(Boolean); if (!prs.length || prs.some(function (p) { return p.st !== 'approved'; })) return bad(L('Pilih PR yang sudah disetujui.', 'Choose approved PRs.'), 'jump');
    if (!sups || sups.length < 2) return bad(L('RFQ minimal ke 2 supplier.', 'An RFQ goes to at least 2 suppliers.'), 'sups');
    var r = { id: M.nid('ex', 'RFQ-' + M.today().slice(2, 4) + M.today().slice(5, 7) + '-1', 2), at: nowS(), prs: prs.map(function (p) { return p.id; }), items: prs.map(function (p) { return [p.item, p.qty]; }), sups: sups, due: due || U.addDays(M.today(), 2), terms: L('Franco Gudang Ubud, termasuk PPN', 'Delivered to the Ubud store, VAT included'), st: 'open', quotes: {} };
    prs.forEach(function (p) { p.st = 'converted'; p.conv = r.id; });
    S().rfqs.unshift(r); M.audit('RFQ.CREATE', ctx, { rec: r.id, to: sups.join(',') }); save(); return { ok: true, rfq: r };
  };
  M.addQuote = function (ctx, id, sup, o) {
    if (!can(ctx, 'pur.rfq')) return deny(ctx, id);
    var r = M.rfq(id); if (!r || ['open', 'quoted'].indexOf(r.st) < 0 || r.sups.indexOf(sup) < 0) return bad(M.MSG.jump, 'jump');
    var pz = num(o.price), ld = num(o.lead), tm = num(o.term != null ? o.term : o.terms); if (!pz || isNaN(pz) || pz <= 0 || ld == null || isNaN(ld) || tm == null || isNaN(tm)) return bad(M.MSG.invalid);
    r.quotes[sup] = [pz, ld, tm, str(o.note)]; r.st = 'quoted'; M.audit('RFQ.QUOTE', ctx, { rec: id, to: sup + ' ' + pz }); save(); return { ok: true, rfq: r };
  };
  // §48 supplier comparison: price, lead time, payment terms, quality, delivery rating, history. Weights shown, never a mystery.
  M.CMP_W = [['price', L('Harga', 'Price'), 40], ['lead', L('Lead time', 'Lead time'), 15], ['term', L('Termin bayar', 'Payment terms'), 10], ['q', L('Kualitas', 'Quality'), 15], ['dr', L('Rating delivery', 'Delivery rating'), 10], ['hist', L('Riwayat performa', 'Historical performance'), 10]];
  M.compare = function (id) {
    var r = M.rfq(id); if (!r) return null;
    var ks = Object.keys(r.quotes); if (!ks.length) return { rfq: r, rows: [] };
    var qs = ks.map(function (k) { var q = r.quotes[k], s = M.supplier(k), perf = M.supPerf(k); return { sup: k, s: s, price: q[0], lead: q[1], term: q[2], note: q[3], q: s ? s.q : 3, dr: s ? s.dr : 3, hist: perf.orders ? perf.otd - perf.issues * 5 : 60, orders: perf.orders }; });
    var minP = Math.min.apply(null, qs.map(function (x) { return x.price; })), minL = Math.min.apply(null, qs.map(function (x) { return x.lead; })), maxT = Math.max.apply(null, qs.map(function (x) { return x.term; }));
    qs.forEach(function (x) {
      x.sc = { price: minP / x.price * 100, lead: (minL + 1) / (x.lead + 1) * 100, term: maxT ? x.term / maxT * 100 : 100, q: x.q / 5 * 100, dr: x.dr / 5 * 100, hist: Math.max(0, Math.min(100, x.hist)) };
      x.total = r1(sum(M.CMP_W.map(function (w) { return x.sc[w[0]] * w[2] / 100; })));
      x.qty = sum(r.items.map(function (i) { return i[1]; })); x.value = Math.round(x.price * x.qty);
    });
    qs.sort(function (a, b) { return b.total - a.total; });
    return { rfq: r, rows: qs, best: qs[0], cheapest: qs.slice().sort(function (a, b) { return a.price - b.price; })[0] };
  };
  M.award = function (ctx, id, sup, reason) {
    if (!can(ctx, 'pur.rfq')) return deny(ctx, id);
    var c = M.compare(id); if (!c || !c.rows.length) return bad(M.MSG.jump, 'jump');
    var row = by(c.rows, 'sup', sup); if (!row) return bad(M.MSG.invalid);
    if (row !== c.best && !str(reason)) return bad(L('Supplier bukan skor tertinggi: alasan wajib.', 'Not the highest-scoring supplier: a reason is required.'), 'reason');
    var r = c.rfq; r.st = 'awarded'; r.award = sup; r.awardWhy = str(reason) || L('Skor perbandingan tertinggi', 'Highest comparison score'); r.awardBy = M.empId(ctx);
    M.audit('SUPPLIER.SELECT', ctx, { rec: id, to: sup, reason: reason }); save();
    var po = M.createPo(ctx, { sup: sup, lines: r.items.map(function (i) { return [i[0], i[1], r.quotes[sup][0]]; }), rfq: id, pr: r.prs[0], dlv: U.addDays(M.today(), r.quotes[sup][1]), terms: r.quotes[sup][2] });
    return { ok: true, rfq: r, po: po.po };
  };
  M.po = function (id) { return by(S().pos, 'id', id); };
  M.pos = function (ctx, f) { if (!can(ctx, 'pur.view') && !can(ctx, 'pur.po')) return []; f = f || {}; return S().pos.filter(function (p) { return !f.st || p.st === f.st; }).sort(function (a, b) { return a.at < b.at ? 1 : -1; }); };
  M.poSub = function (p) { return sum(p.lines.map(function (l) { return l[1] * l[2]; })); };
  M.poTotal = function (p) { return Math.round(M.poSub(p) * (1 + p.tax / 100)); };
  M.createPo = function (ctx, o) {
    if (!can(ctx, 'pur.po')) return deny(ctx, 'po');
    o = o || {}; if (!o.sup || !o.lines || !o.lines.length) return bad(M.MSG.invalid);
    if (!o.rfq && !o.pr && !str(o.reason)) return bad(L('PO tanpa PR / RFQ butuh alasan (diaudit).', 'A PO without a PR / RFQ needs a reason (audited).'), 'reason');
    var p = { id: M.nid('ex', 'PO-' + M.today().slice(2, 4) + M.today().slice(5, 7) + '-1', 2), at: nowS(), sup: o.sup, lines: o.lines, tax: 11, dlv: o.dlv || U.addDays(M.today(), 7), terms: o.terms || (M.supplier(o.sup) || {}).term || 30, cc: o.cc || 'CC-PRD', appr: null, st: 'draft', rcv: o.lines.map(function () { return 0; }), rfq: o.rfq || null, pr: o.pr || null, capex: !!o.capex, by: M.empId(ctx), log: [{ at: nowS(), by: M.empId(ctx), to: 'draft' }], bypass: !o.rfq && !o.pr ? o.reason : null };
    S().pos.unshift(p); M.audit(p.bypass ? 'PO.CREATE.DIRECT' : 'PO.CREATE', ctx, { rec: p.id, to: M.poTotal(p), reason: p.bypass }); M.notify('pur.po.approve', 'poappr', p.id, { amt: M.poTotal(p) }); save();
    return { ok: true, po: p };
  };
  // §49: capex is never auto-authorised; the Owner approves it after a scenario (§101).
  M.approvePo = function (ctx, id) {
    if (!can(ctx, 'pur.po.approve')) return deny(ctx, id);
    var p = M.po(id); if (!p || p.st !== 'draft') return bad(M.MSG.jump, 'jump');
    if (p.by === M.empId(ctx)) return bad(M.MSG.maker, 'maker');
    if (p.capex && ctx.roleKey !== 'owner') return bad(L('PO capex hanya disetujui Owner.', 'A capex PO is approved by the Owner only.'), 'level');
    p.st = 'approved'; p.appr = M.empId(ctx); p.apprAt = nowS(); p.log.push({ at: nowS(), by: M.empId(ctx), to: 'approved' });
    M.audit('PO.APPROVE', ctx, { rec: id, to: M.poTotal(p) }); save(); return { ok: true, po: p };
  };
  M.sendPo = function (ctx, id) { if (!can(ctx, 'pur.po')) return deny(ctx, id); var p = M.po(id); if (!p || p.st !== 'approved') return bad(M.MSG.jump, 'jump'); p.st = 'sent'; p.sent = nowS(); p.log.push({ at: nowS(), by: M.empId(ctx), to: 'sent' }); M.audit('PO.SEND', ctx, { rec: id }); save(); return { ok: true, po: p }; };
  M.cancelPo = function (ctx, id, reason) { if (!can(ctx, 'pur.po')) return deny(ctx, id); var p = M.po(id); if (!p || ['draft', 'approved', 'sent'].indexOf(p.st) < 0 || p.rcv.some(function (q) { return q > 0; })) return bad(M.MSG.jump, 'jump'); if (!str(reason)) return bad(M.MSG.reason, 'reason'); p.st = 'cancelled'; p.log.push({ at: nowS(), by: M.empId(ctx), to: 'cancelled', reason: reason }); M.audit('PO.CANCEL', ctx, { rec: id, reason: reason }); save(); return { ok: true, po: p }; };
  M.grn = function (id) { return by(S().grns, 'id', id); };
  M.grnsOf = function (po) { return S().grns.filter(function (g) { return g.po === po; }); };
  function grnValue(g, s) { var p = by((s || S()).pos, 'id', g.po); if (!p || !g.qty) return 0; return sum(p.lines.map(function (l, i) { return (g.qty[i] || 0) * l[2]; })); }
  M.grnValue = grnValue;
  function grnJournal(g, s) {
    var p = by((s || S()).pos, 'id', g.po); if (!p || !g.qty) return null;
    var byGl = {}; p.lines.forEach(function (l, i) { var it = by((s || S()).stock, 'code', l[0]); var gl = it ? it.gl : '1510'; byGl[gl] = (byGl[gl] || 0) + (g.qty[i] || 0) * l[2]; });
    var lines = Object.keys(byGl).filter(function (k) { return byGl[k]; }).map(function (k) { return { a: k, d: Math.round(byGl[k]) }; }), tot = sum(lines.map(function (l) { return l.d; }));
    if (!tot) return null;
    return { date: g.at.slice(0, 10), desc: L('Penerimaan ' + g.id + ' · ' + g.po, 'Receipt ' + g.id + ' · ' + g.po), src: { t: 'grn', id: g.id }, ref: g.po, by: g.by, lines: lines.concat([{ a: '2150', c: tot }]) };
  }
  // Receiving (§45): partial or full, stock and GRNI posted, average cost updated.
  M.receive = function (ctx, id, qty, note) {
    if (!can(ctx, 'pur.rcv')) return deny(ctx, id);
    var p = M.po(id); if (!p || ['sent', 'partial', 'approved'].indexOf(p.st) < 0) return bad(M.MSG.jump, 'jump');
    if (!qty || qty.length !== p.lines.length) return bad(M.MSG.invalid);
    var q = qty.map(function (x) { var n = num(x); return n == null || isNaN(n) ? 0 : n; });
    if (q.some(function (n, i) { return n < 0 || n + p.rcv[i] > p.lines[i][1]; })) return bad(L('Qty diterima melebihi PO.', 'Received qty exceeds the PO.'), 'qty');
    if (!q.some(function (n) { return n > 0; })) return bad(M.MSG.invalid);
    var g = { id: M.nid('ex', 'GRN-' + M.today().slice(2, 4) + M.today().slice(5, 7) + '-1', 2), at: nowS(), po: id, qty: q, by: M.empId(ctx), note: str(note), jv: null };
    var jo = grnJournal(g); if (jo) { var r = M._postJ(jo, ctx); if (!r.ok) return r; g.jv = r.jv.id; }
    p.lines.forEach(function (l, i) {
      if (!q[i]) return; p.rcv[i] += q[i]; var it = M.stock(l[0]); if (!it) return;
      it.avg = Math.round((it.qty * it.avg + q[i] * l[2]) / (it.qty + q[i])); it.qty += q[i];
      S().moves.push({ id: mvNid('MV-' + M.today().slice(2, 4) + M.today().slice(5, 7) + '-', 3), at: nowS(), type: 'receipt', item: it.code, qty: q[i], unit: it.unit, from: p.sup, to: it.loc, src: g.id, reason: L('Penerimaan ' + id, 'Receipt ' + id), by: M.empId(ctx), ev: g.id, cost: l[2], jv: g.jv });
      S().plogSup.push({ sup: p.sup, item: it.code, date: M.today(), price: l[2] });
    });
    p.st = p.rcv.every(function (n, i) { return n >= p.lines[i][1]; }) ? 'received' : 'partial'; p.log.push({ at: nowS(), by: M.empId(ctx), to: p.st });
    S().grns.push(g); M.audit('PO.RECEIVE', ctx, { rec: id, to: g.id }); save();
    return { ok: true, grn: g, po: p };
  };
  // §51 three-way match: PO price × received qty vs goods receipt vs supplier invoice.
  M.match3 = function (e) {
    var p = M.po(e.po); if (!p) return { ok: false, why: L('PO tidak ditemukan', 'PO not found'), po: 0, grn: 0, inv: e.amt };
    var gs = e.grn ? [M.grn(e.grn)].filter(Boolean) : M.grnsOf(p.id), grni = sum(gs.map(function (g) { return grnValue(g); }));
    var poVal = M.poSub(p), recv = sum(p.lines.map(function (l, i) { return (p.rcv[i] || 0) * l[2]; })), tol = Math.max(1000, Math.round(grni * 0.005));
    var lines = p.lines.map(function (l, i) { var gq = sum(gs.map(function (g) { return g.qty ? g.qty[i] || 0 : 0; })); return { item: l[0], poQty: l[1], poPrice: l[2], rcvQty: gq, value: gq * l[2] }; });
    var diff = e.amt - grni;
    return { ok: Math.abs(diff) <= tol, po: poVal, recv: recv, grni: grni, inv: e.amt, diffAmt: Math.abs(diff) <= tol ? 0 : diff, tol: tol, lines: lines, grns: gs.map(function (g) { return g.id; }) };
  };
  M.grniTarget = function (s) {
    s = s || S(); var matched = {};
    s.exp.forEach(function (e) { if (e.grn && ['approved', 'scheduled', 'paid', 'partial'].indexOf(e.st) >= 0) matched[e.grn] = 1; });
    return sum(s.grns.filter(function (g) { return g.qty && !matched[g.id] && g.at >= '2026-09-30'; }).map(function (g) { return grnValue(g, s); }));
  };
  M.poCommitments = function () {
    return S().pos.filter(function (p) { return ['approved', 'sent', 'partial'].indexOf(p.st) >= 0; }).map(function (p) {
      var billed = sum(S().exp.filter(function (e) { return e.po === p.id && e.st !== 'rejected'; }).map(function (e) { return e.amt + e.tax; }));
      return { k: 'po', id: p.id, n: L('PO ' + p.id + ' · ' + M.supName(p.sup), 'PO ' + p.id + ' · ' + M.supName(p.sup)), amt: Math.max(0, M.poTotal(p) - billed), date: U.addDays(p.dlv, p.terms) };
    }).filter(function (c) { return c.amt > 0; });
  };
  M.purDash = function (ctx) {
    if (!can(ctx, 'pur.view') && !can(ctx, 'pur.pr')) return null;
    var prs = S().prs, pos = S().pos;
    return { prOpen: prs.filter(function (p) { return ['submitted', 'review'].indexOf(p.st) >= 0; }), prApproved: prs.filter(function (p) { return p.st === 'approved'; }), rfqOpen: S().rfqs.filter(function (r) { return ['open', 'quoted'].indexOf(r.st) >= 0; }),
      poOpen: pos.filter(function (p) { return ['draft', 'approved', 'sent', 'partial'].indexOf(p.st) >= 0; }), poDraft: pos.filter(function (p) { return p.st === 'draft'; }), late: pos.filter(function (p) { return ['sent', 'partial', 'approved'].indexOf(p.st) >= 0 && p.dlv < M.today(); }),
      spendMtd: sum(pos.filter(function (p) { return U.ym(p.at) === M.curPeriod() && ['approved', 'sent', 'partial', 'received', 'closed'].indexOf(p.st) >= 0; }).map(M.poTotal)), reorder: M.reorder(ctx), matchIssues: S().exp.filter(function (e) { return e.po && e.st === 'verify'; }) };
  };

  /* ---------- NP-10 assets & depreciation (§52–§57) ---------- */
  M.AST_ST = { active: [L('Aktif', 'Active'), 'ok'], idle: [L('Idle', 'Idle'), 'warn'], maint: [L('Dalam Maintenance', 'Under Maintenance'), 'info'], repair: [L('Perbaikan', 'Repair'), 'crit'], transferred: [L('Dipindahkan', 'Transferred'), 'info'], retired: [L('Pensiun', 'Retired'), 'mute'], disposed: [L('Dilepas', 'Disposed'), 'mute'] };
  M.AST_CATS = D.AST_CATS;
  M._seed.push(function (s) {
    s.assets = D.ASSETS.map(function (x) { return { code: x[0], n: L(x[1], x[2]), cat: x[3], brand: x[4], serial: x[5], acq: x[6], cost: Math.round(x[7] * JT), life: x[8], res: x[9], loc: x[10], user: x[11], vendor: x[12], warranty: x[13], st: x[14], link: x[15], energy: x[16], method: 'SL', docs: [L('Faktur pembelian', 'Purchase invoice'), x[13] ? L('Kartu garansi', 'Warranty card') : null].filter(Boolean) }; });
    s.astEv = D.AST_EVENTS.map(function (x) { return { code: x[0], at: x[1], kind: x[2], from: x[3], to: x[4], by: x[5], reason: x[6] }; });
    s.depPosted = {};
  });
  M.asset = function (code) { return by(S().assets, 'code', code) || by(S().assets, 'link', code); };
  M.assets = function (ctx, f) { if (!can(ctx, 'ast.view')) return []; f = f || {}; return S().assets.filter(function (a) { return (!f.cat || a.cat === f.cat) && (!f.st || a.st === f.st) && (!f.loc || a.loc === f.loc); }); };
  function monthIdx(d) { var p = String(d).split('-'); return (+p[0]) * 12 + (+p[1] - 1); }
  M.depMonthly = function (a) { return Math.round(a.cost * (1 - a.res / 100) / a.life); };
  // Months of depreciation through period p (straight line, starts the month after acquisition, stops at the useful life).
  M.depMonths = function (a, p) { var used = monthIdx(p + '-01') - monthIdx(a.acq) ; return Math.max(0, Math.min(a.life, used)); };
  M.depAt = function (a, p) {
    var n = a.st === 'disposed' && a.disp && a.disp < p ? M.depMonths(a, U.ym(a.disp)) : M.depMonths(a, p), mon = M.depMonthly(a);
    var acc = n >= a.life ? Math.round(a.cost * (1 - a.res / 100)) : mon * n;
    return { months: n, monthly: mon, acc: acc, nbv: a.cost - acc, full: n >= a.life };
  };
  // A period's depreciation run: every asset with depreciation left in that period.
  M.depRun = function (p) {
    var rows = S().assets.filter(function (a) { return a.st !== 'disposed' && a.acq.slice(0, 7) < p; }).map(function (a) { var x = M.depAt(a, p), y = M.depAt(a, U.mAdd(p, -1)); return { a: a, dep: x.acc - y.acc, acc: x.acc, nbv: x.nbv }; }).filter(function (r) { return r.dep > 0; });
    var tot = sum(rows.map(function (r) { return r.dep; }));
    return { p: p, rows: rows, total: tot, lines: [{ a: '6700', d: tot, cc: 'CC-ADM' }].concat(rows.map(function (r) { return { a: '1590', c: r.dep, memo: r.a.code }; })), posted: !!(S().depPosted || {})[p] };
  };
  M.postDep = function (ctx, p) {
    if (!can(ctx, 'ast.dep')) return deny(ctx, p);
    if (S().depPosted[p]) return bad(L('Penyusutan periode ini sudah diposting.', 'Depreciation for this period is already posted.'), 'posted');
    var ps = M.perSt(U.mEnd(p)); if (ps === 'closed' || ps === 'locked') return bad(M.MSG.closed, 'closed');
    if (p > M.curPeriod()) return bad(L('Periode belum berjalan.', 'The period has not started.'), 'future');
    var d = M.depRun(p);
    var r = M._postJ({ date: U.mEnd(p) > M.today() ? M.today() : U.mEnd(p), desc: L('Penyusutan aset ' + p, 'Asset depreciation ' + p), src: { t: 'dep', id: p }, by: M.empId(ctx), lines: d.lines, reason: ps === 'soft' ? L('Penyusutan periode soft close', 'Soft-close period depreciation') : null }, Object.assign({}, ctx, { perms: (ctx.perms || []).concat(ps === 'soft' ? ['fin.period'] : []) }));
    if (!r.ok) return r;
    S().depPosted[p] = r.jv.id; M.audit('DEPRECIATION.POST', ctx, { rec: p, to: d.total }); save();
    return { ok: true, jv: r.jv, run: d };
  };
  M.faTargets = function (s) {
    s = s || S(); var o = { '1510': 0, '1520': 0, '1530': 0, '1590': 0 };
    s.assets.forEach(function (a) { var gl = D.AST_CATS[a.cat][1]; o[gl] += a.cost; o['1590'] -= M.depAt(a, '2026-09').acc; });
    return o;
  };
  M.astEvents = function (code) { return S().astEv.filter(function (e) { return e.code === code; }).sort(function (a, b) { return a.at < b.at ? 1 : -1; }); };
  M.addAsset = function (ctx, o) {
    if (!can(ctx, 'ast.edit')) return deny(ctx, 'asset');
    o = o || {}; var cost = num(o.cost), life = num(o.life);
    if (!str(o.n) || !D.AST_CATS[o.cat] || !cost || isNaN(cost) || cost <= 0 || !life || life <= 0 || !o.acq) return bad(M.MSG.invalid);
    var n = S().assets.length + 1, a = { code: 'AST-N' + String(n).padStart(2, '0'), n: L(str(o.n), str(o.n)), cat: o.cat, brand: str(o.brand) || '—', serial: str(o.serial) || '—', acq: o.acq, cost: Math.round(cost), life: Math.round(life), res: num(o.res) || 0, loc: o.loc || 'PL-01', user: o.user || M.empId(ctx), vendor: o.vendor || null, warranty: o.warranty || null, st: 'active', link: o.link || null, energy: null, method: 'SL', docs: [str(o.doc) || L('Faktur pembelian', 'Purchase invoice')] };
    var r = M._postJ({ date: M.perSt(o.acq) === 'open' ? o.acq : M.today(), desc: L('Aset baru ' + a.code + ' · ' + T(a.n), 'New asset ' + a.code + ' · ' + T(a.n)), src: { t: 'ast', id: a.code }, by: M.empId(ctx), lines: [{ a: D.AST_CATS[o.cat][1], d: a.cost }, { a: '2100', c: a.cost, memo: o.vendor || null }] }, ctx);
    if (!r.ok) return r;
    a.jv = r.jv.id; S().assets.push(a); S().astEv.push({ code: a.code, at: M.today(), kind: 'add', from: null, to: a.loc, by: M.empId(ctx), reason: L('Aset ditambahkan', 'Asset added') });
    M.audit('ASSET.ADD', ctx, { rec: a.code, to: a.cost }); save(); return { ok: true, asset: a };
  };
  M.transferAsset = function (ctx, code, to, reason) {
    if (!can(ctx, 'ast.edit')) return deny(ctx, code);
    var a = M.asset(code); if (!a || ['disposed', 'retired'].indexOf(a.st) >= 0) return bad(M.MSG.jump, 'jump');
    if (!D.PLANTS.some(function (p) { return p[0] === to; }) || to === a.loc) return bad(M.MSG.invalid); if (!str(reason)) return bad(M.MSG.reason, 'reason');
    S().astEv.push({ code: a.code, at: M.today(), kind: 'transfer', from: a.loc, to: to, by: M.empId(ctx), reason: str(reason) }); var from = a.loc; a.loc = to;
    M.audit('ASSET.TRANSFER', ctx, { rec: a.code, from: from, to: to, reason: reason }); save(); return { ok: true, asset: a };
  };
  M.setAssetStatus = function (ctx, code, to, reason) {
    if (!can(ctx, 'ast.edit')) return deny(ctx, code);
    var a = M.asset(code); if (!a || !M.AST_ST[to] || a.st === 'disposed') return bad(M.MSG.invalid); if (!str(reason)) return bad(M.MSG.reason, 'reason');
    if (to === 'disposed') {
      var d = M.depAt(a, M.lastClosed()), loss = d.nbv;
      var r = M._postJ({ date: M.today(), desc: L('Pelepasan aset ' + a.code, 'Asset disposal ' + a.code), src: { t: 'ast', id: a.code }, by: M.empId(ctx), reason: reason, lines: [{ a: '1590', d: d.acc }, { a: '7200', d: loss, memo: 'loss on disposal' }, { a: D.AST_CATS[a.cat][1], c: a.cost }] }, ctx);
      if (!r.ok) return r; a.disp = M.today();
    }
    S().astEv.push({ code: a.code, at: M.today(), kind: 'status', from: a.st, to: to, by: M.empId(ctx), reason: str(reason) }); var from = a.st; a.st = to;
    M.audit('ASSET.STATUS', ctx, { rec: a.code, from: from, to: to, reason: reason }); save(); return { ok: true, asset: a };
  };
  // §56 machine ↔ asset: operational from Phase 8, financial from Phase 10.
  M.machineLink = function (code) {
    var a = M.asset(code); if (!a || !a.link) return null;
    var PR = M.PR, m = PR && PR.machine ? PR.machine(a.link) : null, dts = PR && PR.downtime ? PR.downtime({ mach: a.link }) : [], wos = PR && PR.workOrders ? PR.workOrders({ mach: a.link }) : [];
    var d30 = dts.filter(function (x) { return U.dayDiff(x.start, M.today()) <= 30; }), dtMin = sum(d30.map(function (x) { return x.dur || 0; }));
    var use = D.AST_USE[a.link] || [null, m ? m.cycles : null];
    return { a: a, m: m, live: m ? m.st : null, util: use[0], cycles30: use[1], cyclesLife: m ? m.cycles : null, hours: m ? m.hours : null, downtime: d30, dtMin: dtMin, breakdowns: d30.filter(function (x) { return x.kind === 'breakdown'; }).length, wos: wos, mnt12: Math.round((D.AST_MNT[a.link] || 0) * JT), repl: Math.round((D.AST_REPL[a.link] || 0) * JT), dep: M.depAt(a, M.lastClosed()) };
  };
  M.REPL_OUT = { maintain: [L('Pertahankan', 'Maintain'), 'ok'], repair: [L('Perbaiki', 'Repair'), 'warn'], replace: [L('Ganti', 'Replace'), 'crit'], add: [L('Tambah Kapasitas', 'Add Capacity'), 'info'] };
  // §57 replacement insight: age, NBV, downtime, maintenance cost, utilisation, capacity, energy → maintain / repair / replace / add capacity.
  M.replacement = function (ctx, code) {
    if (!can(ctx, 'ast.view')) return null;
    var list = S().assets.filter(function (a) { return a.link && D.AST_REPL[a.link] && (!code || a.code === code); });
    var cap = M.PR && M.PR.capacity ? M.PR.capacity() : {};
    var out = list.map(function (a) {
      var x = M.machineLink(a.code), d = x.dep, age = U.dayDiff(a.acq, M.today()) / 365, ageP = Math.min(150, Math.round(d.months / a.life * 100)), nbvP = Math.round(d.nbv / a.cost * 100), mntP = x.repl ? r1(x.mnt12 / x.repl * 100) : 0;
      var same = S().assets.filter(function (b) { return b.cat === a.cat && b.energy && b.link && b.link[0] === a.link[0]; }), best = same.length ? Math.min.apply(null, same.map(function (b) { return b.energy / (M.PR && M.PR.machine && M.PR.machine(b.link) ? M.PR.machine(b.link).cap || 1 : 1); })) : null;
      var perKg = a.energy && x.m && x.m.cap ? a.energy / x.m.cap : null, effGap = best && perKg ? r1((perKg - best) / best * 100) : null;
      var stage = a.link[0] === 'W' ? cap.wash : a.link[0] === 'D' ? cap.dry : a.link.indexOf('FL') === 0 || a.link.indexOf('IR') === 0 ? cap.fin : null, capPct = stage ? stage.pct : null;
      var sig = [], out0;
      if (ageP >= 100 || (mntP >= 6 && nbvP <= 25) || (x.breakdowns >= 1 && ageP >= 90)) out0 = 'replace';
      else if (x.breakdowns >= 1 || x.live === 'repair' || mntP >= 4) out0 = 'repair';
      else if ((x.util || 0) >= 85 || (capPct || 0) >= 90) out0 = 'add';
      else out0 = 'maintain';
      sig.push(L('Umur ' + r1(age) + ' th (' + ageP + '% masa manfaat)', 'Age ' + r1(age) + ' yrs (' + ageP + '% of useful life)'));
      sig.push(L('NBV ' + nbvP + '% dari harga perolehan', 'NBV ' + nbvP + '% of cost'));
      sig.push(L('Biaya maintenance 12 bln = ' + mntP + '% harga ganti baru', '12-month maintenance = ' + mntP + '% of replacement price'));
      if (x.dtMin) sig.push(L('Downtime 30 hari: ' + Math.round(x.dtMin / 60 * 10) / 10 + ' jam, ' + x.breakdowns + ' breakdown', '30-day downtime: ' + Math.round(x.dtMin / 60 * 10) / 10 + ' h, ' + x.breakdowns + ' breakdowns'));
      if (x.util != null) sig.push(L('Utilisasi 30 hari ' + x.util + '%', '30-day utilisation ' + x.util + '%'));
      if (capPct != null) sig.push(L('Beban tahap produksi ' + capPct + '% (Fase 8)', 'Production stage load ' + capPct + '% (Phase 8)'));
      if (effGap != null && effGap > 15) sig.push(L('Energi per kg ' + effGap + '% di atas mesin terbaik sejenis', 'Energy per kg ' + effGap + '% above the best machine of its type'));
      return { a: a, x: x, out: out0, ageP: ageP, nbvP: nbvP, mntP: mntP, util: x.util, capPct: capPct, effGap: effGap, sig: sig };
    });
    var o = { replace: 0, repair: 1, add: 2, maintain: 3 };
    return out.sort(function (a, b) { return o[a.out] - o[b.out] || b.ageP - a.ageP; });
  };
  M.astDash = function (ctx) {
    if (!can(ctx, 'ast.view')) return null;
    var p = M.lastClosed(), list = S().assets.filter(function (a) { return a.st !== 'disposed'; });
    var cost = sum(list.map(function (a) { return a.cost; })), acc = sum(list.map(function (a) { return M.depAt(a, p).acc; }));
    var warrantySoon = list.filter(function (a) { return a.warranty && a.warranty >= M.today() && U.dayDiff(M.today(), a.warranty) <= 240; });
    var byCat = {}; list.forEach(function (a) { var x = byCat[a.cat] = byCat[a.cat] || { cat: a.cat, n: 0, cost: 0, nbv: 0 }; x.n++; x.cost += a.cost; x.nbv += M.depAt(a, p).nbv; });
    var bySt = {}; list.forEach(function (a) { bySt[a.st] = (bySt[a.st] || 0) + 1; });
    return { n: list.length, cost: cost, acc: acc, nbv: cost - acc, monthly: M.depRun(M.curPeriod()).total, byCat: Object.keys(byCat).map(function (k) { return byCat[k]; }), bySt: bySt, warrantySoon: warrantySoon, full: list.filter(function (a) { return M.depAt(a, p).full; }), p: p };
  };
})(typeof window !== 'undefined' ? window : this);
