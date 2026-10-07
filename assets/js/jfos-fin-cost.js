/* ==========================================================================
   JFRESH OS — Phase 10 engine · part 2 of 4: costing.
   NP-05 HPP engine (components, cost behaviour, allocation by driver,
   HPP per kg, pcs, item, service, client and property, frozen versions per
   period, the HPP insight), NP-06 item master (one official weight master,
   always in kg, pcs → kg equivalent, versioned weights with approval, item
   economics) and NP-07 pricing intelligence (price levels, markup vs gross
   margin never mixed, recommended price by the chosen method, status,
   scenarios, client / service / item profitability).
   Extends the JFFIN object of jfos-fin.js. Prices come from the Phase 6 rate
   cards and master prices; volumes from the September sales ledger.
   ========================================================================== */
(function (root) {
  var M = root.JFFIN || (typeof require !== 'undefined' ? require('./jfos-fin.js') : null);
  if (!M || M._ext.cost) return; M._ext.cost = true;
  var D = M.D, U = M.u, L = U.L, T = U.T, sum = U.sum, r0 = U.r0, r1 = U.r1, r2 = U.r2, pct = U.pct, by = U.by, can = M.can, bad = M.bad, deny = M.deny, str = U.str, num = U.num, JT = M.JT;
  function S() { return M.state(); }
  function save() { M.save(); }

  /* ---------- NP-06 item master (§27–§31) ---------- */
  M.ITEM_ST = { active: [L('Berlaku', 'Active'), 'ok'], pending: [L('Menunggu Persetujuan', 'Pending Approval'), 'appr'], superseded: [L('Diganti', 'Superseded'), 'mute'], rejected: [L('Ditolak', 'Rejected'), 'crit'], scheduled: [L('Terjadwal', 'Scheduled'), 'info'] };
  M._seed.push(function (s) {
    s.items = D.ITEMS.map(function (x) { return { code: x[0], n: L(x[1], x[2]), cat: x[3], billUnit: x[5], proc: x[6], svc: x[7], special: !!x[8], p8: x[9], vol: x[10], price: x[11], active: true }; });
    s.wver = [];
    D.ITEMS.forEach(function (x) {
      var hist = D.ITEM_VERS.filter(function (v) { return v[0] === x[0]; });
      if (!hist.length) s.wver.push({ code: x[0], v: 1, kg: x[4], eff: '2026-01-01', reason: L('Berat Item Laundry Update 2026', 'Laundry Item Weight Update 2026'), by: 'EMP-030', appr: 'EMP-050', st: 'active', at: '2025-12-20 10:00' });
      hist.forEach(function (v) { s.wver.push({ code: v[0], v: v[1], kg: v[2], eff: v[3], reason: v[4], by: v[5], appr: v[6], st: v[7], at: v[7] === 'pending' || v[3] > D.today ? '2026-10-05 14:20' : v[3] + ' 09:00' }); });
    });
    s.cost = { weightApproval: true };
  });
  M.items = function (ctx, f) { if (!can(ctx, 'item.view') && !can(ctx, 'hpp.view')) return []; f = f || {}; return S().items.filter(function (i) { return (!f.cat || i.cat === f.cat) && (!f.q || (i.code + ' ' + T(i.n) + ' ' + i.n[1]).toLowerCase().indexOf(String(f.q).toLowerCase()) >= 0); }); };
  M.item = function (code) { return by(S().items, 'code', code); };
  M.itemName = function (code) { var i = M.item(code); return i ? i.n : L(code, code); };
  M.weightVersions = function (code) { return S().wver.filter(function (v) { return v.code === code; }).sort(function (a, b) { return b.v - a.v; }); };
  // The standard weight in force on a date: the latest approved version effective on or before that date.
  M.weightAt = function (code, date) {
    date = date || M.today();
    var v = S().wver.filter(function (x) { return x.code === code && (x.st === 'active' || x.st === 'superseded' || x.st === 'scheduled') && x.eff <= date; }).sort(function (a, b) { return a.eff < b.eff ? 1 : a.eff > b.eff ? -1 : b.v - a.v; })[0];
    return v ? v.kg : null;
  };
  M.weightVer = function (code, date) { date = date || M.today(); return S().wver.filter(function (x) { return x.code === code && ['active', 'superseded', 'scheduled'].indexOf(x.st) >= 0 && x.eff <= date; }).sort(function (a, b) { return a.eff < b.eff ? 1 : -1; })[0] || null; };
  // §28: one canonical unit (kg). The UI may show grams; a value is never stored without its unit.
  M.fmtWeight = function (kg) { if (kg == null) return '—'; return kg < 1 ? Math.round(kg * 1000) + ' g' : (Math.round(kg * 100) / 100) + ' kg'; };
  M.parseWeight = function (v, unit) {
    var n = num(v); if (n == null || isNaN(n) || n <= 0) return { ok: false, msg: L('Isi berat lebih dari 0.', 'Enter a weight above 0.') };
    if (unit !== 'kg' && unit !== 'g') return { ok: false, msg: L('Pilih satuan: kg atau gram.', 'Choose a unit: kg or gram.') };
    var kg = unit === 'g' ? n / 1000 : n;
    if (unit === 'kg' && n >= 20) return { ok: false, code: 'ambiguous', msg: L('Berat ' + n + ' kg tidak wajar untuk satu item. Maksud Anda ' + n + ' gram?', 'A weight of ' + n + ' kg is not realistic for one item. Did you mean ' + n + ' grams?') };
    if (unit === 'g' && n < 5) return { ok: false, code: 'ambiguous', msg: L('Berat ' + n + ' gram terlalu kecil. Maksud Anda ' + n + ' kg?', 'A weight of ' + n + ' grams is too small. Did you mean ' + n + ' kg?') };
    return { ok: true, kg: Math.round(kg * 1000) / 1000 };
  };
  // §29 pcs → kg equivalent.
  M.kgEq = function (code, qty, date) { var w = M.weightAt(code, date); return w == null ? null : Math.round(qty * w * 100) / 100; };
  M.pcsWeight = function (svc, date) { var code = D.SVC_PCS_ITEM[svc]; return code ? (M.weightAt(code, date || '2026-09-15') || 1) : 1; };
  // §31 propose a new weight: new value, effective date, reason, user; approval when configured. History is never edited.
  M.proposeWeight = function (ctx, code, o) {
    if (!can(ctx, 'item.edit')) return deny(ctx, code);
    var it = M.item(code); if (!it) return bad(M.MSG.notfound, 'notfound');
    o = o || {}; var w = M.parseWeight(o.v, o.unit); if (!w.ok) return bad(w.msg, w.code || 'invalid');
    if (!o.eff || o.eff < M.today()) return bad(L('Tanggal berlaku tidak boleh lewat. Riwayat tidak diubah.', 'The effective date cannot be in the past. History is not changed.'), 'eff');
    if (!str(o.reason)) return bad(M.MSG.reason, 'reason');
    if (S().wver.some(function (x) { return x.code === code && x.st === 'pending'; })) return bad(L('Masih ada perubahan berat yang menunggu persetujuan.', 'A weight change is already waiting for approval.'), 'pending');
    var v = { code: code, v: Math.max.apply(null, M.weightVersions(code).map(function (x) { return x.v; })) + 1, kg: w.kg, eff: o.eff, reason: str(o.reason), by: M.empId(ctx), appr: null, st: S().cost.weightApproval ? 'pending' : 'scheduled', at: M.nowS() };
    S().wver.push(v); M.audit('ITEM.WEIGHT.PROPOSE', ctx, { rec: code, from: M.weightAt(code), to: w.kg + ' kg · ' + o.eff, reason: o.reason });
    if (v.st === 'pending') M.notify('item.approve', 'wtappr', code, { kg: w.kg });
    save(); return { ok: true, ver: v };
  };
  M.decideWeight = function (ctx, code, ok, reason) {
    if (!can(ctx, 'item.approve')) return deny(ctx, code);
    var v = S().wver.filter(function (x) { return x.code === code && x.st === 'pending'; })[0]; if (!v) return bad(M.MSG.jump, 'jump');
    if (v.by === M.empId(ctx)) return bad(M.MSG.maker, 'maker');
    if (!ok) { if (!str(reason)) return bad(M.MSG.reason, 'reason'); v.st = 'rejected'; v.rej = reason; }
    else { v.st = v.eff <= M.today() ? 'active' : 'scheduled'; v.appr = M.empId(ctx); v.apprAt = M.nowS(); if (v.st === 'active') S().wver.forEach(function (x) { if (x.code === code && x !== v && x.st === 'active') x.st = 'superseded'; }); }
    M.audit(ok ? 'ITEM.WEIGHT.APPROVE' : 'ITEM.WEIGHT.REJECT', ctx, { rec: code, to: v.kg, reason: reason }); save();
    return { ok: true, ver: v };
  };
  M.weightPending = function () { return S().wver.filter(function (x) { return x.st === 'pending'; }); };

  /* ---------- NP-05 HPP (§21–§26) ---------- */
  M.HPP_GROUPS = D.HPP_GROUPS; M.HPP_LINES = D.HPP_LINES;
  function lineKeys(g) { return Object.keys(D.HPP_COMP[g]); }
  // Production machine depreciation of a period, from the asset register (part 3).
  function machDep(p) { return M.depRun ? sum(M.depRun(p).rows.filter(function (r) { return r.a.cat === 'machine'; }).map(function (r) { return r.dep; })) : 0; }
  // Compute a period from its sources: component amounts, the register, the volume of that period. Never the current cost.
  M.hppCompute = function (p, over) {
    var i = D.HPP_MONTHS.indexOf(p); if (i < 0) return null;
    var comp = {}, gt = {};
    D.HPP_GROUPS.forEach(function (g) {
      gt[g[0]] = 0;
      lineKeys(g[0]).forEach(function (k) { var v = g[0] === 'machine' ? machDep(p) : Math.round(D.HPP_COMP[g[0]][k][i] * JT); if (over && over[k] != null) v = Math.round(over[k] * JT); comp[k] = v; gt[g[0]] += v; });
    });
    var vol = D.HPP_VOL[i] || Math.round(M.salesSep().kgeq), total = sum(Object.keys(comp).map(function (k) { return comp[k]; }));
    return { p: p, vol: vol, comp: comp, groups: gt, total: total, hpp: r0(total / vol) };
  };
  M._post.push(function (s) {
    s.hpp = [];
    D.HPP_MONTHS.forEach(function (p) {
      var stored = D.HPP_VERSIONS.filter(function (v) { return v[0] === p; });
      if (!stored.length) { var c = M.hppCompute(p); s.hpp.push(Object.assign({ v: 1, at: U.addDays(U.mEnd(p), 5) + ' 10:00', by: 'EMP-030', reason: L('HPP periode ' + p + ' (migrasi HPP 2026, dihitung ulang dari komponen)', 'HPP period ' + p + ' (HPP 2026 migration, recalculated from components)'), st: 'current' }, c)); return; }
      stored.forEach(function (v, k) { var c = M.hppCompute(p, v[5]); s.hpp.push(Object.assign({ v: v[1], at: v[2], by: v[3], reason: v[4], st: k === stored.length - 1 ? 'current' : 'superseded' }, c)); });
    });
  });
  M.hppVersions = function (p) { return S().hpp.filter(function (h) { return !p || h.p === p; }).sort(function (a, b) { return a.p < b.p ? 1 : a.p > b.p ? -1 : b.v - a.v; }); };
  M.hppOf = function (p) { return S().hpp.filter(function (h) { return h.p === p && h.st === 'current'; })[0] || null; };
  M.hppPeriods = function () { return D.HPP_MONTHS.slice(); };
  M.hppLast = function () { return M.hppOf(D.HPP_MONTHS[D.HPP_MONTHS.length - 1]); };
  // Store a new version (§25): only for a period that is still open or soft-closed; history is never recalculated.
  M.hppCalc = function (ctx, p, reason) {
    if (!can(ctx, 'hpp.calc')) return deny(ctx, p);
    if (!str(reason)) return bad(M.MSG.reason, 'reason');
    var per = M.period(p); if (!per || D.HPP_MONTHS.indexOf(p) < 0) return bad(M.MSG.notfound, 'notfound');
    if (per.st === 'closed' || per.st === 'locked') return bad(L('Periode sudah ditutup. HPP historis tidak dihitung ulang.', 'The period is closed. Historical HPP is not recalculated.'), 'closed');
    var cur = M.hppOf(p), c = M.hppCompute(p);
    var v = Object.assign({ v: (cur ? cur.v : 0) + 1, at: M.nowS(), by: M.empId(ctx), reason: str(reason), st: 'current' }, c);
    if (cur) cur.st = 'superseded';
    S().hpp.push(v); M.audit('HPP.VERSION', ctx, { rec: p, from: cur ? cur.hpp : null, to: v.hpp, reason: reason }); save();
    return { ok: true, hpp: v, prev: cur };
  };
  M.hppPerKg = function (h) { var o = {}; D.HPP_GROUPS.forEach(function (g) { o[g[0]] = h.groups[g[0]] / h.vol; }); return o; };
  M.hppBehavior = function (h) { var o = { var: 0, semi: 0, fixed: 0 }; Object.keys(h.comp).forEach(function (k) { o[D.HPP_BEH[k] || 'fixed'] += h.comp[k]; }); return o; };
  // Allocation (HPP-003): each group spread to services by its driver (§23).
  M.DRIVERS = { kgeq: L('kg ekuivalen', 'kg equivalent'), labor: L('menit kerja (standar per kg ek.)', 'labour minutes (standard per kg eq.)'), chem: L('indeks pemakaian kimia', 'chemical usage index'), dlv: L('stop delivery per 100 kg ek.', 'delivery stops per 100 kg eq.') };
  M.allocation = function (p) {
    p = p || D.HPP_MONTHS[D.HPP_MONTHS.length - 1];
    var h = M.hppOf(p); if (!h) return null;
    var sales = M.salesSep(), svc = {};
    sales.rows.forEach(function (r) { var x = svc[r.svc] = svc[r.svc] || { svc: r.svc, kgeq: 0, qty: 0, rev: 0, unit: r.unit }; x.kgeq += r.kgeq; x.qty += r.qty; x.rev += r.rev; });
    var list = Object.keys(svc).map(function (k) { return svc[k]; });
    // Scale the September mix to the period volume so every period allocates its own volume.
    var scale = h.vol / sum(list.map(function (x) { return x.kgeq; }));
    list.forEach(function (x) { var d = D.SVC_DRIVER[x.svc] || [1, 1, 1]; x.v = x.kgeq * scale; x.d = { kgeq: x.v, labor: x.v * d[0], chem: x.v * d[1], dlv: x.v * d[2] / 100 }; });
    var tot = { kgeq: 0, labor: 0, chem: 0, dlv: 0 }; list.forEach(function (x) { Object.keys(tot).forEach(function (k) { tot[k] += x.d[k]; }); });
    list.forEach(function (x) {
      x.alloc = {}; x.cost = 0;
      D.HPP_GROUPS.forEach(function (g) { var drv = D.HPP_ALLOC[g[0]], sh = x.d[drv] / tot[drv]; x.alloc[g[0]] = h.groups[g[0]] * sh; x.cost += x.alloc[g[0]]; });
      x.perKg = x.cost / x.v; x.perUnit = x.unit === 'pcs' ? x.perKg * M.pcsWeight(x.svc) : x.perKg;
    });
    return { p: p, h: h, rows: list.sort(function (a, b) { return b.v - a.v; }), tot: tot };
  };
  M.hppSvc = function (svc, p) { var a = M.allocation(p); var x = a && by(a.rows, 'svc', svc); return x || null; };
  M.hppItem = function (code, p) { var it = M.item(code); if (!it) return null; var s = M.hppSvc(it.svc, p), w = M.weightAt(code, U.mEnd(p || D.HPP_MONTHS[D.HPP_MONTHS.length - 1])); return s ? { item: it, w: w, perKg: s.perKg, perItem: s.perKg * w, svc: it.svc } : null; };
  // HPP per client / property: their own service mix at service HPP (§21).
  M.hppBy = function (key, p) {
    var a = M.allocation(p); if (!a) return [];
    var per = {}; a.rows.forEach(function (x) { per[x.svc] = x.perKg; });
    var g = {};
    M.salesSep().rows.forEach(function (r) { var k = r[key]; var x = g[k] = g[k] || { k: k, cl: r.cl, kgeq: 0, rev: 0, cost: 0, svcs: {} }; x.kgeq += r.kgeq; x.rev += r.rev; x.cost += r.kgeq * per[r.svc]; x.svcs[r.svc] = (x.svcs[r.svc] || 0) + r.kgeq; });
    return Object.keys(g).map(function (k) { var x = g[k]; x.perKg = x.cost / x.kgeq; x.margin = pct(x.rev - x.cost, x.rev); return x; }).sort(function (a, b) { return b.rev - a.rev; });
  };
  // §26 insight: what changed, why, impact, recommendation, action.
  M.hppInsight = function (p) {
    var ps = D.HPP_MONTHS, i = ps.indexOf(p || ps[ps.length - 1]); if (i < 1) return null;
    var a = M.hppOf(ps[i]), b = M.hppOf(ps[i - 1]);
    var dH = pct(a.hpp - b.hpp, b.hpp), dV = pct(a.vol - b.vol, b.vol);
    var drivers = D.HPP_GROUPS.map(function (g) { var x = a.groups[g[0]], y = b.groups[g[0]]; return { g: g[0], n: g[1], d: pct(x - y, y), abs: x - y, perKg: x / a.vol - y / b.vol }; }).sort(function (x, y) { return Math.abs(y.perKg) - Math.abs(x.perKg); });
    var rev = M.salesSep().rev / M.salesSep().kgeq, gmA = pct(rev - a.hpp, rev), gmB = pct(rev - b.hpp, rev);
    var top = drivers.filter(function (d) { return d.perKg > 0; }).slice(0, 2);
    var chem = by(drivers, 'g', 'chemical');
    return { p: ps[i], prev: ps[i - 1], a: a, b: b, dH: dH, dV: dV, drivers: drivers, gmA: gmA, gmB: gmB, dGm: r1(gmA - gmB),
      signal: L('HPP ' + (dH >= 0 ? 'naik ' : 'turun ') + Math.abs(dH) + '% MoM (' + ps[i - 1] + ' → ' + ps[i] + ').', 'HPP ' + (dH >= 0 ? 'rose ' : 'fell ') + Math.abs(dH) + '% MoM (' + ps[i - 1] + ' → ' + ps[i] + ').'),
      why: drivers.slice(0, 3).map(function (d) { return L(T(d.n) + ' ' + (d.d >= 0 ? '+' : '') + d.d + '%', d.n[1] + ' ' + (d.d >= 0 ? '+' : '') + d.d + '%'); }).concat([L('Volume ' + (dV >= 0 ? '+' : '') + dV + '%', 'Volume ' + (dV >= 0 ? '+' : '') + dV + '%')]),
      impact: L('Gross margin berbasis HPP ' + (gmA - gmB >= 0 ? '+' : '') + r1(gmA - gmB) + ' poin persentase (' + gmB + '% → ' + gmA + '%).', 'HPP-based gross margin ' + (gmA - gmB >= 0 ? '+' : '') + r1(gmA - gmB) + ' percentage points (' + gmB + '% → ' + gmA + '%).'),
      rec: chem && chem.d > 3 ? L('Review pemakaian bahan kimia (harga Ecolab naik) dan tinjau harga layanan Regular.', 'Review chemical consumption (Ecolab prices rose) and review the Regular service price.') : L('Jaga volume; biaya tetap per kg naik saat volume turun.', 'Protect volume; fixed cost per kg rises when volume falls.'),
      action: L('Buka konsumsi bahan kimia per kg (INV-001) dan Price Review (PRICE-003).', 'Open chemical consumption per kg (INV-001) and the Price Review (PRICE-003).'), top: top };
  };
  M.hppSeries = function () { return D.HPP_MONTHS.map(function (p) { var h = M.hppOf(p); return { p: p, hpp: h.hpp, vol: h.vol, total: h.total }; }); };

  /* ---------- NP-07 pricing (§32–§38) ---------- */
  M.PRICE_ST = { excellent: [L('Excellent', 'Excellent'), 'ok'], healthy: [L('Sehat', 'Healthy'), 'ok'], low: [L('Margin Rendah', 'Low Margin'), 'warn'], below: [L('Di Bawah HPP', 'Below HPP'), 'crit'], review: [L('Perlu Review', 'Review Required'), 'appr'] };
  M._seed.push(function (s) { s.pcfg = Object.assign({}, D.PRICE_CFG); s.pcfgHist = [Object.assign({ at: '2026-01-02 09:00', by: 'EMP-050' }, D.PRICE_CFG)]; s.plog = D.PRICE_HIST.map(function (x) { return { svc: x[0], price: x[1], eff: x[2], by: 'EMP-050', reason: L('Price List', 'Price List') }; }); s.pscn = []; });
  M.priceCfg = function () { return S().pcfg; };
  // §34: the two formulas, never swapped.
  M.markup = function (price, hpp) { return hpp ? r1((price - hpp) / hpp * 100) : null; };
  M.margin = function (price, hpp) { return price ? r1((price - hpp) / price * 100) : null; };
  // §35: the recommended price by the selected method.
  M.recPrice = function (hpp, method, target) {
    var c = S().pcfg; method = method || c.method; target = target == null ? (method === 'margin' ? c.targetMargin : c.targetMarkup) : target;
    if (method === 'margin') return { method: 'margin', target: target, price: target >= 100 ? null : Math.ceil(hpp / (1 - target / 100) / 50) * 50, formula: L('HPP ÷ (1 − Target Margin)', 'HPP ÷ (1 − Target Margin)') };
    return { method: 'markup', target: target, price: Math.ceil(hpp * (1 + target / 100) / 50) * 50, formula: L('HPP × (1 + Target Markup)', 'HPP × (1 + Target Markup)') };
  };
  M.priceStatus = function (price, hpp, lastChange) {
    var c = S().pcfg, m = M.margin(price, hpp);
    if (m == null) return 'review';
    if (price < hpp) return 'below';
    if (lastChange && U.dayDiff(lastChange, M.today()) > c.staleDays && m < c.healthy) return 'review';
    return m >= c.excellent ? 'excellent' : m >= c.healthy ? 'healthy' : m >= c.low ? 'low' : 'below';
  };
  M.lastPriceChange = function (svc) { var l = S().plog.filter(function (x) { return x.svc === svc; }).sort(function (a, b) { return a.eff < b.eff ? 1 : -1; }); return l[0] || null; };
  // Pricing overview per service (§33): HPP, selling price (master and realised contract average), profit, markup, margin, volume, revenue, contribution.
  M.pricing = function (ctx, p) {
    if (!can(ctx, 'price.view') && !can(ctx, 'hpp.view')) return null;
    var a = M.allocation(p); if (!a) return null;
    var rows = a.rows.map(function (x) {
      var s = M.svc(x.svc), master = s ? s.price : 0, realized = x.qty ? x.rev / x.qty : master, hpp = x.perUnit, lc = M.lastPriceChange(x.svc);
      return { svc: x.svc, n: s ? s.n : x.svc, unit: x.unit, tier: D.SVC_TIER[x.svc], hpp: hpp, master: master, price: realized, profit: realized - hpp, profitKg: (realized - hpp) / (x.unit === 'pcs' ? M.pcsWeight(x.svc) : 1),
        markup: M.markup(realized, hpp), margin: M.margin(realized, hpp), mMarkup: M.markup(master, hpp), mMargin: M.margin(master, hpp), vol: x.qty, kgeq: x.kgeq, rev: x.rev, contrib: x.rev - hpp * x.qty, st: M.priceStatus(realized, hpp, lc && lc.eff), last: lc };
    });
    return { p: a.p, rows: rows, rev: sum(rows.map(function (r) { return r.rev; })), contrib: sum(rows.map(function (r) { return r.contrib; })), cfg: S().pcfg };
  };
  M.priceDetail = function (ctx, svc, p) {
    var pr = M.pricing(ctx, p); if (!pr) return null; var row = by(pr.rows, 'svc', svc); if (!row) return null;
    var clients = {};
    M.salesSep().rows.filter(function (r) { return r.svc === svc; }).forEach(function (r) { var x = clients[r.prop] = clients[r.prop] || { prop: r.prop, cl: r.cl, qty: 0, rev: 0, rate: r.rate, rc: r.rc }; x.qty += r.qty; x.rev += r.rev; });
    var list = Object.keys(clients).map(function (k) { var x = clients[k]; x.margin = M.margin(x.rate, row.hpp); x.markup = M.markup(x.rate, row.hpp); x.st = M.priceStatus(x.rate, row.hpp); return x; }).sort(function (a, b) { return a.margin - b.margin; });
    return { row: row, clients: list, hist: S().plog.filter(function (x) { return x.svc === svc; }).sort(function (a, b) { return a.eff < b.eff ? 1 : -1; }), rec: { margin: M.recPrice(row.hpp, 'margin'), markup: M.recPrice(row.hpp, 'markup') } };
  };
  // §36 thresholds configurable and versioned.
  M.setPriceCfg = function (ctx, o, reason) {
    if (!can(ctx, 'price.edit') && !can(ctx, 'cfo.th')) return deny(ctx, 'price-cfg');
    if (!str(reason)) return bad(M.MSG.reason, 'reason');
    var c = Object.assign({}, S().pcfg), from = JSON.stringify(S().pcfg);
    ['targetMargin', 'targetMarkup', 'excellent', 'healthy', 'low'].forEach(function (k) { if (o[k] != null && o[k] !== '') { var n = num(o[k]); if (!isNaN(n)) c[k] = n; } });
    if (o.method === 'margin' || o.method === 'markup') c.method = o.method;
    if (!(c.excellent > c.healthy && c.healthy > c.low && c.low >= 0) || c.targetMargin >= 100) return bad(L('Urutan ambang harus Excellent > Sehat > Rendah ≥ 0.', 'Thresholds must be Excellent > Healthy > Low ≥ 0.'));
    c.v = (S().pcfg.v || 1) + 1; c.eff = M.today(); S().pcfg = c; S().pcfgHist.push(Object.assign({ at: M.nowS(), by: M.empId(ctx), reason: reason }, c));
    M.audit('PRICE.CONFIG', ctx, { rec: 'PRICE', from: from, to: JSON.stringify(c), reason: reason }); save();
    return { ok: true, cfg: c };
  };
  // A master price change goes through Phase 6 (one price master) and keeps history (§101: never overwrite historical price).
  M.setPrice = function (ctx, svc, price, eff, reason) {
    if (!can(ctx, 'price.edit')) return deny(ctx, svc);
    var n = num(price); if (!n || isNaN(n) || n <= 0) return bad(M.MSG.invalid);
    if (!str(reason)) return bad(M.MSG.reason, 'reason');
    eff = eff || M.today(); if (eff < M.today()) return bad(L('Harga baru tidak boleh berlaku mundur.', 'A new price cannot be backdated.'), 'eff');
    var from = (M.svc(svc) || {}).price;
    if (eff === M.today() && M.CM && M.CM.setMasterPrice) { var r = M.CM.setMasterPrice(ctx, svc, n, reason); if (!r.ok) return r; }
    S().plog.push({ svc: svc, price: n, eff: eff, by: M.empId(ctx), reason: str(reason), at: M.nowS(), from: from });
    M.audit('PRICE.CHANGE', ctx, { rec: svc, from: from, to: n + ' · ' + eff, reason: reason }); save();
    return { ok: true };
  };
  // §37 scenario: change HPP, target margin or markup, price, volume → revenue, profit, margin, contribution, BEP effect.
  M.priceScenario = function (ctx, o) {
    if (!can(ctx, 'price.scn') && !can(ctx, 'price.view')) return null;
    o = o || {};
    var pr = M.pricing(ctx), row = by(pr.rows, 'svc', o.svc || 'SV-001'); if (!row) return null;
    var hpp = o.hpp != null && o.hpp !== '' ? +o.hpp : row.hpp, vol = o.vol != null && o.vol !== '' ? +o.vol : row.vol, price;
    var method = o.method || 'price';
    if (method === 'margin') price = M.recPrice(hpp, 'margin', +o.target).price; else if (method === 'markup') price = M.recPrice(hpp, 'markup', +o.target).price; else price = o.price != null && o.price !== '' ? +o.price : row.price;
    var cur = { price: row.price, hpp: row.hpp, vol: row.vol, rev: row.price * row.vol, profit: (row.price - row.hpp) * row.vol };
    var nw = { price: price, hpp: hpp, vol: vol, rev: price * vol, profit: (price - hpp) * vol };
    cur.margin = M.margin(cur.price, cur.hpp); nw.margin = M.margin(price, hpp); cur.markup = M.markup(cur.price, cur.hpp); nw.markup = M.markup(price, hpp);
    // BEP effect at company level: fixed cost ÷ contribution margin ratio with this service's change.
    var bep = M.bepCalc ? M.bepCalc() : null, effect = null;
    if (bep) {
      var vShare = M.hppBehavior(M.hppLast()), vRatio = vShare.var / (vShare.var + vShare.semi + vShare.fixed) + vShare.semi / (vShare.var + vShare.semi + vShare.fixed) * D.SEMI_VAR;
      var dRev = nw.rev - cur.rev, dVar = (nw.hpp * nw.vol - cur.hpp * cur.vol) * vRatio, rev2 = bep.revenue + dRev, cm2 = (bep.revenue - bep.variable + dRev - dVar) / rev2;
      effect = { bep0: bep.bep, bep1: cm2 > 0 ? bep.fixed / cm2 : null, rev0: bep.revenue, rev1: rev2 };
    }
    return { svc: row.svc, row: row, method: method, cur: cur, nw: nw, dProfit: nw.profit - cur.profit, dRev: nw.rev - cur.rev, contrib0: cur.profit, contrib1: nw.profit, bep: effect,
      assume: [L('HPP per unit = alokasi HPP periode ' + pr.p + (o.hpp ? ' (diganti asumsi)' : ''), 'HPP per unit = HPP allocation of period ' + pr.p + (o.hpp ? ' (overridden by assumption)' : '')), L('Volume = volume ' + pr.p + (o.vol ? ' (diganti asumsi)' : ''), 'Volume = ' + pr.p + ' volume' + (o.vol ? ' (overridden by assumption)' : '')), L('Ini simulasi. Harga tidak berubah sampai disetujui.', 'This is a simulation. Prices do not change until approved.')] };
  };
  M.saveScenarioPrice = function (ctx, o, name) {
    if (!can(ctx, 'price.scn')) return deny(ctx, 'price-scn');
    var r = M.priceScenario(ctx, o); if (!r) return bad(M.MSG.invalid);
    var s = { id: 'PSC-' + String(S().pscn.length + 1).padStart(2, '0'), n: str(name) || M.svcName(r.svc), at: M.nowS(), by: M.empId(ctx), inp: o, out: { price: r.nw.price, margin: r.nw.margin, dProfit: r.dProfit } };
    S().pscn.unshift(s); M.audit('SCENARIO.CREATE', ctx, { rec: s.id, to: 'price ' + r.svc }); save();
    return { ok: true, scn: s };
  };
  // Price review list (PRICE-003): every service with its recommended price by the configured method.
  M.priceReview = function (ctx) {
    var pr = M.pricing(ctx); if (!pr) return null; var c = S().pcfg;
    return pr.rows.map(function (r) { var rec = M.recPrice(r.hpp, c.method), alt = M.recPrice(r.hpp, c.method === 'margin' ? 'markup' : 'margin'); return Object.assign({}, r, { rec: rec, alt: alt, gap: rec.price ? rec.price - r.price : null, gapPct: rec.price ? pct(rec.price - r.price, r.price) : null }); })
      .sort(function (a, b) { return (a.margin || 0) - (b.margin || 0); });
  };

  /* ---------- Profitability (§38, §85–§87) ---------- */
  // Direct cost = variable and semi-variable share of service HPP; allocated = the fixed share.
  M.clientProfit = function (ctx, key) {
    if (!can(ctx, 'prof.client')) return null;
    key = key || 'cl';
    var h = M.hppLast(), beh = M.hppBehavior(h), tot = beh.var + beh.semi + beh.fixed, dirShare = (beh.var + beh.semi) / tot;
    var rows = M.hppBy(key).map(function (x) {
      var direct = x.cost * dirShare, alloc = x.cost - direct, cl = x.cl, ar = sum(S().inv.filter(function (iv) { return iv.cl === cl && ['issued', 'partial', 'overdue'].indexOf(M.invSt(iv)) >= 0 && (key === 'cl' || iv.prop === x.k); }).map(M.openOf));
      var hf = M.DL && M.DL.healthFeed ? M.DL.healthFeed(cl) : null, he = M.CM && M.CM.health ? M.CM.health(cl) : null;
      return { k: x.k, cl: cl, rev: x.rev, direct: direct, alloc: alloc, cost: x.cost, contrib: x.rev - direct, profit: x.rev - x.cost, margin: pct(x.rev - x.cost, x.rev), cm: pct(x.rev - direct, x.rev), kgeq: x.kgeq, perKg: x.perKg, ar: ar, dso: x.rev ? r1(ar / (x.rev * 1.11) * 30) : null,
        sla: hf ? hf.sla : null, health: he ? he.score : null, healthSt: he ? he.st : null };
    });
    return { rows: rows, p: h.p, avgMargin: pct(sum(rows.map(function (r) { return r.profit; })), sum(rows.map(function (r) { return r.rev; }))),
      note: L('Revenue tinggi tidak otomatis berarti klien sehat: lihat margin, AR, DSO dan SLA bersama.', 'High revenue does not automatically mean a healthy client: read margin, AR, DSO and SLA together.') };
  };
  M.serviceProfit = function (ctx) {
    var pr = M.pricing(ctx); if (!pr) return null;
    var t = {}; pr.rows.forEach(function (r) { var x = t[r.tier] = t[r.tier] || { tier: r.tier, vol: 0, rev: 0, cost: 0, svcs: [] }; x.vol += r.kgeq; x.rev += r.rev; x.cost += r.hpp * r.vol; x.svcs.push(r.svc); });
    var growth = { regular: 1.8, oneday: 2.6, express: 6.4, superx: 9.1, special: 3.2 };
    return D.TIERS.map(function (k) { var x = t[k[0]] || { tier: k[0], vol: 0, rev: 0, cost: 0, svcs: [] }; return Object.assign(x, { n: k[1], hpp: x.vol ? x.cost / x.vol : 0, contrib: x.rev - x.cost, margin: pct(x.rev - x.cost, x.rev), growth: growth[k[0]] }); });
  };
  M.ITEM_SORTS = { low: L('Margin Terendah', 'Lowest Margin'), high: L('Margin Tertinggi', 'Highest Margin'), vol: L('Volume Tertinggi', 'Highest Volume'), rev: L('Revenue Tertinggi', 'Highest Revenue'), contrib: L('Kontribusi Tertinggi', 'Highest Contribution'), review: L('Perlu Review', 'Review Required') };
  M.itemMatrix = function (ctx, sort) {
    if (!can(ctx, 'price.view') && !can(ctx, 'hpp.view')) return null;
    var a = M.allocation(); if (!a) return null; var per = {}; a.rows.forEach(function (x) { per[x.svc] = x; });
    var rows = S().items.filter(function (i) { return i.active; }).map(function (it) {
      var w = M.weightAt(it.code, '2026-09-15'), s = per[it.svc] || per['SV-001'], hppKg = s ? s.perKg : 0, hppItem = hppKg * w;
      var price = it.price != null ? it.price : (s && s.qty ? s.rev / s.qty : (M.svc(it.svc) || {}).price) * w;
      var profit = price - hppItem, m = M.margin(price, hppItem);
      return { code: it.code, n: it.n, cat: it.cat, svc: it.svc, w: w, hppItem: hppItem, hppKg: hppKg, price: price, profit: profit, profitKg: w ? profit / w : null, margin: m, markup: M.markup(price, hppItem), vol: it.vol, rev: price * it.vol, contrib: profit * it.vol, st: M.priceStatus(price, hppItem), unit: it.billUnit };
    });
    var f = { low: function (a, b) { return a.margin - b.margin; }, high: function (a, b) { return b.margin - a.margin; }, vol: function (a, b) { return b.vol - a.vol; }, rev: function (a, b) { return b.rev - a.rev; }, contrib: function (a, b) { return b.contrib - a.contrib; }, review: function (a, b) { var o = { below: 0, review: 1, low: 2, healthy: 3, excellent: 4 }; return o[a.st] - o[b.st] || a.margin - b.margin; } }[sort || 'low'] || null;
    return f ? rows.sort(f) : rows;
  };
  M.itemEcon = function (ctx, code) { var m = M.itemMatrix(ctx); return m ? by(m, 'code', code) : null; };
})(typeof window !== 'undefined' ? window : this);
