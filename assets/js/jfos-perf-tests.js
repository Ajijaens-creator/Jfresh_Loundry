/* ==========================================================================
   JFRESH OS — Phase 5 automated test cases. Each case resets the
   performance store and runs against the real engine (jfos-perf.js).
   Run in node:    node tools/test-perf.js
   Run in browser: phase5/tests.html
   ========================================================================== */
(function (root) {
  function L(a, b) { return [a, b === undefined ? a : b]; }
  var T = [];
  function add(group, id, name, fn) { T.push({ group: group, id: id, n: name, fn: fn }); }
  function eq(a, b, what) { if (a !== b) throw new Error((what || 'value') + ': expected ' + JSON.stringify(b) + ', got ' + JSON.stringify(a)); }
  function ok(v, what) { if (!v) throw new Error(what || 'expected true'); }
  function near(a, b, tol, what) { if (Math.abs(a - b) > (tol || 0.05)) throw new Error((what || 'value') + ': expected ≈' + b + ', got ' + a); }
  var OWNER = { uid: 'USR-050', name: 'Aji Jaens', roleKey: 'owner', employee: { id: 'EMP-050' } };
  function ctx(role, emp, extra) {
    return function (P) { var perms = (P.ROLE_PERMS[role] || []).concat(['apr.view', 'rpt.export', 'rpt.exec', 'rpt.ops']).concat(extra || []); return { uid: 'T-' + role, name: 'Tester ' + role, roleKey: role, perms: perms, employee: emp ? { id: emp } : null }; };
  }
  var hrc = ctx('hr', 'EMP-090'), rl = ctx('raceleader', 'EMP-075'), fin0 = function (P) { var c = ctx('finance', 'EMP-030')(P); c.perms = P.ROLE_PERMS.finance.slice(); return c; };
  var own = ctx('owner', 'EMP-050'), spv = ctx('supervisor', 'EMP-021'), opsm = ctx('opsmgr', 'EMP-010'), fin = ctx('finance', 'EMP-030'), opr = ctx('operator', 'EMP-001'), none = function () { return { uid: 'T-none', name: 'No perms', perms: [] }; };
  function kOf(P, code) { return P.kpi(code); }

  /* ----- NP-01 Executive Business Health ----- */
  add('np01', 'BH-01', L('Business Health = rata-rata tertimbang 6 pilar (bobot 100%)', 'Business Health = weighted six pillars (weights 100%)'), function (P) {
    var h = P.health(); eq(h.pillars.length, 6, 'pillars'); ok(h.check.ok, 'pillar weights 100');
    var s = 0; h.pillars.forEach(function (p) { s += p.score * p.w; }); near(h.score, Math.round(s / 100 * 10) / 10, 0.05, 'score');
  });
  add('np01', 'BH-02', L('Setiap pilar punya skor, status, tren, KPI, issue utama, drill-down', 'Every pillar has score, status, trend, KPIs, top issue, drill-down'), function (P) {
    P.health().pillars.forEach(function (p) {
      ok(typeof p.score === 'number' && p.band && p.band.n, p.k + ' score/status'); ok(p.trend.length === 6, p.k + ' trend'); ok(p.kpis.length >= 4, p.k + ' kpis');
      ok(p.top, p.k + ' top issue'); p.inds.forEach(function (i) { ok(P.kpi(i.kpi), p.k + ' indicator drills to KPI ' + i.kpi); });
    });
  });
  add('np01', 'BH-03', L('Tidak ada KPI buntu: KPI → tim → user → race → bukti', 'No dead-end KPIs: KPI → team → user → race → evidence'), function (P) {
    P.D.XDIMS.forEach(function (d) {
      P.kpis(d.sc).forEach(function (k) {
        ok((k.teams && k.teams.length) || k.owner, k.code + ' has a team or owner');
        (k.teams || []).forEach(function (t) { var tm = P.team(t); ok(tm && tm.members.length, k.code + ' team ' + t + ' has members'); tm.members.forEach(function (m) { ok(P.person(m), 'member ' + m + ' has a profile'); }); });
      });
    });
    P.state().daily.forEach(function (r) { ok(r.ev && (r.ev.sys.length || r.ev.files), r.id + ' has evidence'); ok(P.goalRaw(r.goal), r.id + ' links to a goal'); });
  });
  add('np01', 'BH-04', L('Perlu Perhatian diurutkan: severity, dampak finansial, bobot KPI, due, strategis (§6)', 'Attention sorted: severity, financial impact, KPI weight, due, strategic (§6)'), function (P) {
    var a = [{ id: 'a', sev: 'medium', fin: 9, w: 9, due: '2026-10-01', str: 3 }, { id: 'b', sev: 'crit', fin: 1, w: 1, due: '2026-10-30', str: 1 }, { id: 'c', sev: 'high', fin: 5, w: 10, due: '2026-10-20', str: 1 }, { id: 'd', sev: 'high', fin: 5, w: 10, due: '2026-10-10', str: 1 }, { id: 'e', sev: 'high', fin: 5, w: 20, due: '2026-10-30', str: 1 }, { id: 'f', sev: 'high', fin: 8, w: 1, due: '2026-10-30', str: 1 }];
    eq(P.sortAttention(a).map(function (x) { return x.id; }).join(''), 'bfedca', 'order');
    eq(P.attention()[0].sev, 'crit', 'live list starts with critical');
  });
  add('np01', 'BH-05', L('Prioritas alert: strategis sebelum due (§73)', 'Alert priority: strategic before due (§73)'), function (P) {
    var a = [{ id: 'x', sev: 'high', fin: 5, w: 10, due: '2026-10-07', str: 1 }, { id: 'y', sev: 'high', fin: 5, w: 10, due: '2026-10-30', str: 3 }];
    eq(P.sortAlerts(a)[0].id, 'y', '§73 strategic first'); eq(P.sortAttention(a)[0].id, 'x', '§6 due first');
  });
  add('np01', 'BH-06', L('Strip KPI atas lengkap (8 angka)', 'Top KPI strip complete (8 figures)'), function (P) {
    var s = P.strip(); ['health', 'fin', 'xscore', 'revMtd', 'net', 'cash', 'sla', 'ar'].forEach(function (k) { ok(typeof s[k] === 'number', k); });
  });

  /* ----- NP-02 Financial Health & Cash ----- */
  add('np02', 'FIN-01', L('Arus kas bersih = kas masuk − kas keluar (semua periode)', 'Net cash flow = cash in − cash out (all periods)'), function (P) {
    P.FLOW_PERIODS.forEach(function (p) { var f = P.fin.flow(p[0]); near(f.net, f.tin - f.tout, 0.5, p[0]); ok(f.tin > 0, p[0] + ' has cash in'); });
  });
  add('np02', 'FIN-02', L('Posisi kas: total = kas + petty + bank; free = tersedia − komitmen', 'Cash position: total = cash + petty + bank; free = available − committed'), function (P) {
    var c = P.fin.cash(); eq(c.total, c.onHand + c.petty + c.bank, 'total'); eq(c.available, c.total - c.restricted, 'available'); eq(c.free, c.available - c.committed, 'free'); eq(c.committed, P.fin.ap().due30, 'committed = AP 30 days');
  });
  add('np02', 'FIN-03', L('Struktur P&L dan margin', 'P&L structure and margins'), function (P) {
    var p = P.fin.pl(); eq(p.gross, p.revenue - p.cogs, 'gross'); eq(p.op, p.gross - p.opex, 'operating'); eq(p.net, p.op + p.other - p.tax, 'net');
    near(p.gm, p.gross / p.revenue * 100, 0.06, 'GM'); near(p.nm, p.net / p.revenue * 100, 0.06, 'NM');
    var g = P.fin.growth(); ok(g.mom && g.qoq && g.yoy, 'MoM / QoQ / YoY');
  });
  add('np02', 'FIN-04', L('Aging AR: bucket benar dan total cocok', 'AR aging: right buckets and totals'), function (P) {
    var a = P.fin.ar(), s = 0; Object.keys(a.buckets).forEach(function (k) { s += a.buckets[k]; }); eq(s, a.total, 'buckets sum');
    var x = a.items.filter(function (i) { return i.inv === 'INV-2606-031'; })[0]; eq(x.age, 103, 'age'); eq(x.bucket, 'b90p', '90+');
    eq(a.items.filter(function (i) { return i.inv === 'INV-2609-052'; })[0].bucket, 'current', 'not due yet');
    ok(a.dso > 0 && a.collection > 0 && a.top.length, 'DSO, collection, top overdue');
  });
  add('np02', 'FIN-05', L('Alert varian biaya di atas ambang', 'Expense variance alert above threshold'), function (P) {
    var e = P.fin.expenses(); e.rows.forEach(function (r) { eq(r.alert, r.pct > e.threshold, r.k); }); ok(e.rows.some(function (r) { return r.alert; }), 'at least one alert');
  });
  add('np02', 'FIN-06', L('Unit economics: profit/kg = revenue/kg − cost/kg', 'Unit economics: profit/kg = revenue/kg − cost/kg'), function (P) {
    ['plant', 'client', 'property', 'service'].forEach(function (d) { P.fin.ue(d).rows.forEach(function (r) { near(r.profitKg, r.revKg - r.costKg, 1.01, d + ' ' + r.id); }); });
  });
  add('np02', 'FIN-07', L('Saldo per rekening hanya untuk izin fin.cash.accounts', 'Per-account balances need fin.cash.accounts'), function (P) {
    ok(P.can(fin(P), 'fin.cash.accounts'), 'finance sees accounts'); ok(!P.can(opsm(P), 'fin.cash.accounts'), 'ops manager does not'); ok(!P.can(spv(P), 'fin.health'), 'supervisor has no financial health');
  });
  add('np02', 'FIN-08', L('Financial Health Score: 7 KPI, bobot 20/20/20/15/10/10/5', 'Financial Health Score: 7 KPIs, weights 20/20/20/15/10/10/5'), function (P) {
    var l = P.fin.health().lines; eq(l.map(function (x) { return x.k.weight; }).join('/'), '20/20/20/15/10/10/5', 'weights'); ok(P.score(l).valid, '100%');
  });
  add('np02', 'FIN-09', L('Forecast kas: alert kewajiban besar', 'Cash forecast: large obligation alert'), function (P) {
    var f = P.fin.forecast(); eq(f.proj30, f.available + f.in30 - f.out30, 'projected'); ok(f.alerts.some(function (a) { return a.k === 'big'; }), 'payroll flagged');
  });

  /* ----- NP-03 Goal cascade ----- */
  add('np03', 'GOL-01', L('Semua goal terhubung ke level tepat di atasnya', 'Every goal links to the level directly above'), function (P) { eq(P.validateCascade().length, 0, 'problems'); eq(P.LEVELS.length, 7, 'levels'); });
  add('np03', 'GOL-02', L('Induk yang melompati level ditolak', 'A parent that skips a level is refused'), function (P) {
    var r = P.goalCreate(own(P), { id: 'X-1', lvl: 'daily', parent: 'BG-H2-01', n: L('x') }); eq(r.ok, false, 'refused');
    eq(P.goalCreate(own(P), { id: 'X-2', lvl: 'daily', parent: 'WR-41-01', n: L('x') }).ok, true, 'valid parent');
  });
  add('np03', 'GOL-03', L('Koreksi progres manual butuh izin dan alasan', 'Manual progress adjustment needs permission and reason'), function (P) {
    eq(P.goalAdjust(spv(P), 'ST-2610-01', 60, 'x').code, 'noperm', 'supervisor'); eq(P.goalAdjust(own(P), 'ST-2610-01', 60, ' ').code, 'reason', 'no reason');
    eq(P.goalAdjust(own(P), 'ST-2610-01', 60, 'Kontrak ditandatangani offline').ok, true); eq(P.goal('ST-2610-01').progress, 60); eq(P.goal('ST-2610-01').progSrc, 'manual');
    eq(P.auditLog()[0].ev, 'GOAL.ADJUST', 'audited');
  });
  add('np03', 'GOL-04', L('Progres dari sumber sistem; status lima pilihan', 'Progress from system sources; five statuses'), function (P) {
    var g = P.goal('BG-H2-02'); ok(/kpi/.test(g.progSrc), 'from KPI'); eq(P.goal('ST-2610-99').status, 'cancelled');
    ['on', 'risk', 'off', 'completed', 'cancelled'].forEach(function (s) { ok(P.ST[s], s); });
  });

  /* ----- NP-04 KPI master, contract & weighting ----- */
  add('np04', 'KPI-01', L('Bobot < 100%: "Bobot belum lengkap — tersisa 5%."', 'Weights < 100%: "Bobot belum lengkap — tersisa 5%."'), function (P) { var v = P.validateWeights([30, 25, 20, 20]); eq(v.ok, false); eq(v.msg[0], 'Bobot belum lengkap — tersisa 5%.'); });
  add('np04', 'KPI-02', L('Bobot > 100%: "Bobot melebihi 100% sebesar 5%."', 'Weights > 100%: "Bobot melebihi 100% sebesar 5%."'), function (P) { var v = P.validateWeights([30, 30, 25, 20]); eq(v.ok, false); eq(v.msg[0], 'Bobot melebihi 100% sebesar 5%.'); });
  add('np04', 'KPI-03', L('Bobot = 100%: "Bobot valid."', 'Weights = 100%: "Bobot valid."'), function (P) { var v = P.validateWeights([33.33, 33.33, 33.34]); eq(v.ok, true); eq(v.msg[0], 'Bobot valid.'); });
  add('np04', 'KPI-04', L('Scorecard tidak bisa aktif bila bobot ≠ 100%', 'Scorecard cannot activate unless weights = 100%'), function (P) {
    eq(P.kpiSave(own(P), 'OPS-03', { weight: 20 }, 'Fokus kapasitas').ok, true);
    var r = P.activateScorecard(own(P), 'XS-OPS'); eq(r.ok, false); eq(r.code, 'weights'); eq(r.msg[0], 'Bobot melebihi 100% sebesar 5%.');
    eq(P.kpiSave(own(P), 'OPS-04', { weight: 15 }, 'Seimbangkan').ok, true);
    P.codes('XS-OPS').map(P.proposed).filter(function (k) { return k.status === 'draft'; }).forEach(function (k) { P.kpiTransition(own(P), k.code, k.v, 'review'); P.kpiTransition(own(P), k.code, k.v, 'approved'); });
    eq(P.activateScorecard(own(P), 'XS-OPS').ok, true, 'activates at 100%'); eq(P.kpi('OPS-03').weight, 20, 'new weight in force');
  });
  add('np04', 'KPI-05', L('Urutan default: kategori, prioritas, bobot', 'Default order: category, priority, weight'), function (P) {
    var s = P.sortKpis(P.kpis('XS-FIN').concat(P.kpis('XS-OPS'))).map(function (k) { return k.code; });
    eq(s[0], 'FIN-01'); ok(s.indexOf('FIN-05') < s.indexOf('OPS-01'), 'financial before operations'); ok(s.indexOf('FIN-02') < s.indexOf('FIN-05'), 'high before medium');
  });
  add('np04', 'KPI-06', L('Urutan race: kategori, bobot, kritis / at risk, achievement naik', 'Race order: category, weight, critical / at risk, achievement ascending'), function (P) {
    var b = P.r2Board('W40'), cats = b.lines.map(function (l) { return P.CAT_ORDER.indexOf(l.k.cat); });
    for (var i = 1; i < cats.length; i++) ok(cats[i] >= cats[i - 1], 'grouped by category');
    var ops = b.lines.filter(function (l) { return l.k.cat === 'operations'; }); eq(ops.length, 3); ok(ops[0].st !== 'on' || ops[1].st === 'on', 'at risk before on track within equal weight');
  });
  add('np04', 'KPI-07', L('Ubah target KPI aktif → versi baru, versi berlaku tetap', 'Changing an active KPI target → new version, version in force unchanged'), function (P) {
    var before = P.kpi('OPS-01'); var r = P.kpiSave(own(P), 'OPS-01', { target: 97 }, 'Target Q4');
    eq(r.ok, true); eq(r.newVersion, true); eq(P.kpi('OPS-01').target, before.target, 'in force unchanged'); eq(P.proposed('OPS-01').target, 97, 'proposed'); eq(P.proposed('OPS-01').status, 'draft');
    var evs = P.auditLog().slice(0, 2).map(function (e) { return e.ev; }); ok(evs.indexOf('TARGET.CHANGE') >= 0 && evs.indexOf('KPI.VERSION') >= 0, 'audited');
  });
  add('np04', 'KPI-08', L('Perubahan terlindungi wajib alasan', 'Protected change requires a reason'), function (P) { eq(P.kpiSave(own(P), 'OPS-01', { formula: L('baru') }, '').code, 'reason'); });
  add('np04', 'KPI-09', L('Skor historis tidak dihitung ulang dengan versi baru', 'Historical scores never recalculate on a new version'), function (P) {
    var snap = P.snapshot(own(P), 'XS-OPS', '2026-09'), s0 = snap.score;
    P.kpiSave(own(P), 'OPS-01', { target: 99 }, 'Naikkan'); var k = P.proposed('OPS-01'); P.kpiTransition(own(P), 'OPS-01', k.v, 'review'); P.kpiTransition(own(P), 'OPS-01', k.v, 'approved'); eq(P.activateScorecard(own(P), 'XS-OPS').ok, true);
    ok(P.scScore('XS-OPS') !== s0, 'live score moved'); eq(P.recompute(snap), s0, 'snapshot reproducible'); ok(/OPS-01@v1/.test(snap.formulaV), 'stores version'); ok(snap.period && snap.at, 'period & time');
  });
  add('np04', 'KPI-10', L('Lifecycle Draft → Review → Approved → Active → Frozen → Archived', 'Lifecycle Draft → Review → Approved → Active → Frozen → Archived'), function (P) {
    P.kpiSave(own(P), 'OPS-02', { target: 43 }, 'x'); var v = P.proposed('OPS-02').v;
    eq(P.kpiTransition(own(P), 'OPS-02', v, 'approved').code, 'transition', 'no skip'); eq(P.kpiTransition(opsm(P), 'OPS-02', v, 'review').ok, true);
    eq(P.kpiTransition(opsm(P), 'OPS-02', v, 'approved').code, 'noperm', 'approval needs kpi.approve'); eq(P.kpiTransition(own(P), 'OPS-02', v, 'approved').ok, true);
    eq(P.LIFE_ORDER.join(','), 'draft,review,approved,active,frozen,archived');
    var cur = P.kpi('OPS-05'); eq(P.kpiTransition(own(P), 'OPS-05', cur.v, 'frozen').ok, true); eq(P.kpi('OPS-05').status, 'frozen');
  });
  add('np04', 'KPI-11', L('Arah KPI, floor, cap dan stretch', 'KPI direction, floor, cap and stretch'), function (P) {
    eq(P.ach({ dir: 'higher', target: 100 }, 90), 90, 'higher'); eq(P.ach({ dir: 'lower', target: 2 }, 2.5), 80, 'lower');
    eq(P.ach({ dir: 'range', target: 82, lo: 75, hi: 90 }, 85), 100, 'range in'); eq(P.ach({ dir: 'range', target: 82, lo: 75, hi: 90 }, 99), 90.9, 'range above');
    eq(P.ach({ dir: 'binary', target: 0, zero: true }, 0), 100, 'binary zero'); eq(P.ach({ dir: 'binary', target: 0, zero: true }, 1), 0, 'binary miss');
    eq(P.ach({ dir: 'higher', target: 100, stretch: 120, cap: 110 }, 110), 105, 'stretch'); eq(P.ach({ dir: 'higher', target: 100 }, 150), 100, 'cap 100');
    eq(P.pts({ dir: 'higher', floor: 80 }, 90), 50, 'floor scaling'); eq(P.pts({ dir: 'higher', floor: 80 }, 79), 0, 'below floor'); eq(P.pts({ dir: 'higher', floor: null }, 90), 90, 'no floor');
    var l = P.line({ dir: 'higher', target: 100, weight: 25, floor: null }, 98); eq(l.ws, 24.5, 'achievement score × weight');
  });
  add('np04', 'KPI-12', L('Ubah bobot butuh izin kpi.weight', 'Weight change needs kpi.weight'), function (P) { eq(P.kpiSave(opsm(P), 'OPS-01', { weight: 25 }, 'x').code, 'noperm'); eq(P.kpiSave(opsm(P), 'OPS-01', { evid: L('Foto POD') }).ok, true, 'non-protected field'); });
  add('np04', 'KPI-13', L('Input manual: wajib alasan / bukti, ditandai Manual', 'Manual input: reason / evidence required, marked Manual'), function (P) {
    eq(P.manualInput(own(P), 'INV-01', 4, '', '').code, 'evidence'); var r = P.manualInput(own(P), 'INV-01', 4, 'Proyek dosing selesai', 'IMP-2610.pdf');
    eq(r.ok, true); eq(P.kpi('INV-01').src, 'manual'); eq(P.auditLog()[0].ev, 'MANUAL.INPUT'); eq(P.manualInput(spv(P), 'INV-01', 5, 'x').code, 'noperm', 'not owner, no kpi.edit');
  });

  /* ----- NP-05 XScore ----- */
  add('np05', 'XS-01', L('Bobot dimensi 100% dan Ambidex 80/20', 'Dimension weights 100% and Ambidex 80/20'), function (P) { var x = P.xscore(); ok(x.dimCheck.ok, 'dims'); ok(x.ambiCheck.ok, 'ambidex'); eq(x.groups.exploit.w, 80); eq(x.groups.explore.w, 20); });
  add('np05', 'XS-02', L('Bobot efektif = 100%, eksplorasi = 20%', 'Effective weights = 100%, exploration = 20%'), function (P) {
    var x = P.xscore(), s = 0, e = 0; x.dims.forEach(function (d) { s += d.eff; if (d.g === 'explore') e += d.eff; }); near(s, 100, 0.05, 'total'); near(e, 20, 0.01, 'exploration');
    var calc = 0; x.dims.forEach(function (d) { calc += d.score * d.eff / 100; }); near(x.now, Math.round(calc * 10) / 10, 0.05, 'XScore');
  });
  add('np05', 'XS-03', L('Band status default dan bisa diatur', 'Default status bands, configurable'), function (P) {
    eq(P.band(96).k, 'excellent'); eq(P.band(85).k, 'healthy'); eq(P.band(80).k, 'attention'); eq(P.band(60).k, 'warning'); eq(P.band(59.9).k, 'critical');
    eq(P.setBands(spv(P), []).code, 'noperm'); eq(P.setBands(own(P), [{ min: 50 }, { min: 60 }]).ok, false, 'invalid order');
    var b = P.BANDS_DEFAULT.map(function (x) { return Object.assign({}, x); }); b[1].min = 88; eq(P.setBands(own(P), b).ok, true); eq(P.band(86).k, 'attention');
  });
  add('np05', 'XS-04', L('Ambidex ≠ 100% ditolak', 'Ambidex ≠ 100% is refused'), function (P) { eq(P.setAmbidex(own(P), 70, 20).code, 'sum100'); eq(P.setAmbidex(own(P), 70, 30).ok, true); eq(P.xscore().groups.explore.w, 30); });
  add('np05', 'XS-05', L('Drill-down XScore → dimensi → KPI → tim → personal', 'XScore drill-down → dimension → KPI → team → personal'), function (P) {
    var d = P.xscore().dims[0], k = P.kpis(d.sc)[0]; ok(k, 'kpi'); var t = P.team(k.teams[0]); ok(t.members.length, 'team members'); ok(P.person(t.members[0]).score >= 0, 'personal');
  });

  /* ----- NP-06 Teamwork Score ----- */
  add('np06', 'TW-01', L('Teamwork Score bukan rata-rata Personal Score', 'Teamwork Score is not the average of Personal Scores'), function (P) {
    var diff = P.teams().filter(function (t) { return Math.abs(t.score - P.memberAvg(t.k)) > 1; }); ok(diff.length >= 3, 'scores differ from member averages');
    var before = P.teamScore('wsh'); var p = P.D.PEOPLE.filter(function (x) { return x.id === 'EMP-074'; })[0], keep = p.ind.slice(); p.ind = [120, 99, 99, 99, 99];
    var after = P.teamScore('wsh'); p.ind = keep; eq(after, before, 'member KPIs do not move the team score');
  });
  add('np06', 'TW-02', L('Setiap scorecard tim berbobot 100%', 'Every team scorecard totals 100%'), function (P) { eq(P.D.TEAMS.length, 11, 'teams'); P.teams().forEach(function (t) { ok(t.valid, t.k); }); });

  /* ----- NP-07 Personal Score & HR ----- */
  add('np07', 'PS-01', L('Personal Score = 70% KPI individu + 30% kontribusi tim', 'Personal Score = 70% individual KPI + 30% team contribution'), function (P) {
    var p = P.person('EMP-001'); eq(p.f.ind, 70); eq(p.f.team, 30); near(p.score, Math.round((p.ind * 70 + p.teamPart * 30) / 10) / 10, 0.06, 'formula');
  });
  add('np07', 'PS-02', L('Formula berbeda per peran dan bisa diatur', 'Formula differs by role and is configurable'), function (P) {
    eq(P.person('EMP-002').f.ind, 80, 'driver 80/20'); eq(P.setFormula(spv(P), 'rcv', 60, 40).code, 'noperm'); eq(P.setFormula(own(P), 'rcv', 60, 30).code, 'sum100');
    eq(P.setFormula(own(P), 'rcv', 60, 40).ok, true); eq(P.person('EMP-001').f.ind, 60);
  });
  add('np07', 'PS-03', L('KPI berbeda per peran (Receiving, QC, Driver, Finance, Supervisor)', 'Different KPI sets by role (Receiving, QC, Driver, Finance, Supervisor)'), function (P) {
    var r = P.D.ROLE_KPIS; ['rcv', 'qc', 'drv', 'fin', 'spv'].forEach(function (k) { eq(r[k].kpis.length, 5, k); var w = 0; r[k].kpis.forEach(function (x) { w += x[5]; }); eq(w, 100, k + ' weights'); });
    eq(r.qc.kpis[4][1][1], 'Evidence completeness'); eq(r.drv.kpis[2][1][1], 'POD accuracy');
  });
  add('np07', 'PS-04', L('Skor tidak pernah memicu tindakan HR otomatis', 'Scores never trigger automatic HR actions'), function (P) {
    var all = []; P.D.PEOPLE.forEach(function (p) { all = all.concat(P.hrSignals(p.id)); }); ok(all.length > 0, 'signals exist');
    all.forEach(function (s) { eq(s.human, true); eq(s.auto, false); }); ['terminate', 'discipline', 'promote', 'autoTerminate'].forEach(function (f) { ok(!P[f], 'no ' + f + ' function'); });
  });
  add('np07', 'PS-05', L('Profil: skor kini, rata-rata 3/6 bulan, tren 12 bulan', 'Profile: current, 3/6-month average, 12-month trend'), function (P) { var p = P.person('EMP-021'); eq(p.hist.length, 12); ok(p.avg3 && p.avg6 && p.strength && p.attention, 'profile fields'); });

  add('np07', 'PS-06', L('Catatan HR hanya oleh pemegang hr.manage dan tercatat di audit', 'HR notes only by hr.manage holders and audited'), function (P) {
    eq(P.hrNote(spv(P), 'EMP-074', 'coaching', 'Coaching mingguan').code, 'noperm'); eq(P.hrNote(opsm(P), 'EMP-074', 'coaching', ' ').code, 'invalid');
    eq(P.hrNote(opsm(P), 'EMP-074', 'coaching', 'Coaching mingguan').ok, true); eq(P.hrNotes('EMP-074').length, 1); eq(P.auditLog()[0].ev, 'HR.NOTE');
  });

  /* ----- NP-08 Race & R2RE ----- */
  add('np08', 'RC-01', L('Race Leader bisa review, root cause dan keputusan', 'Race Leader can review, add root cause and decide'), function (P) {
    var r = P.r2Review(spv(P), 'W40', 'R2-GM', { why: 'Kimia', rootCause: 'Dosing', recovery: 'Kalibrasi', pic: 'EMP-071', due: '2026-10-09', decision: 'Lanjut' }); eq(r.ok, true); eq(r.rec.reviewed, true);
    eq(P.r2Board('W40').reviewed, 1); eq(P.auditLog()[0].ev, 'R2RE.REVIEW'); eq(P.r2Next('W40', P.r2Order('W40')[0].k.code), P.r2Order('W40')[1].k.code, 'next KPI');
  });
  add('np08', 'RC-02', L('Race Leader tidak bisa ubah target, formula, bobot, struktur', 'Race Leader cannot change target, formula, weight, structure'), function (P) {
    ['target', 'weight', 'formula'].forEach(function (f) { var o = {}; o[f] = 1; eq(P.r2Review(spv(P), 'W40', 'R2-GM', o).code, 'protected', f); });
    ok(!P.racePerm(spv(P), 'structure') && !P.racePerm(spv(P), 'target'), 'racePerm'); ok(P.racePerm(own(P), 'target'), 'owner with kpi.edit may');
  });
  add('np08', 'RC-03', L('Board R2RE: bobot 100%, per kategori, off track / at risk lebih dulu (§86)', 'R2RE board: weights 100%, by category, off track / at risk first (§86)'), function (P) {
    var b = P.r2Board('W40'); ok(b.check.ok, '100%'); eq(b.counts.total, 8); eq(b.counts.on + b.counts.risk + b.counts.off, 8);
    var rank = function (l) { return l.st === 'off' ? 0 : l.st === 'risk' ? 1 : 2; };
    P.CAT_ORDER.forEach(function (c) { var g = b.lines.filter(function (l) { return l.k.cat === c; }); for (var i = 1; i < g.length; i++) ok(rank(g[i - 1]) < rank(g[i]) || (rank(g[i - 1]) === rank(g[i]) && g[i - 1].k.weight >= g[i].k.weight), 'off / at risk first, then weight, within ' + c); });
  });
  add('np08', 'RC-04', L('Bukti sistem: tidak perlu upload manual', 'System evidence: no manual upload needed'), function (P) {
    var d = P.state().daily; eq(P.needsUpload(d.filter(function (r) { return r.id === 'DR-07'; })[0]), false, 'POD auto'); eq(P.needsUpload(d.filter(function (r) { return r.id === 'DR-04'; })[0]), true, 'briefing needs upload');
  });
  add('np08', 'RC-05', L('Race wajib terhubung ke goal', 'A race must link to a goal'), function (P) {
    eq(P.raceAdd(spv(P), { n: 'x', pic: 'EMP-001', goal: 'NOPE', kpi: 'R2-REV', target: 1 }).ok, false); eq(P.raceAdd(spv(P), { n: L('Cek mesin'), pic: 'EMP-001', goal: 'WR-41-01', kpi: 'R2-UPT', target: 1 }).ok, true);
    eq(P.raceAdd(opr(P), { n: 'x', pic: 'EMP-001', goal: 'WR-41-01', kpi: 'R2-UPT', target: 1 }).code, 'noperm', 'operator cannot create');
  });
  add('np08', 'RC-06', L('PIC boleh update race miliknya', 'The PIC may update their own race'), function (P) {
    eq(P.raceUpdate(opr(P), 'DR-08', { actual: 1200 }).ok, true); eq(P.state().daily.filter(function (r) { return r.id === 'DR-08'; })[0].status, 'done');
    eq(P.raceUpdate(opr(P), 'DR-02', { actual: 3 }).code, 'noperm', 'not own race'); eq(P.raceUpdate(opr(P), 'DR-08', { target: 900 }).code, 'noperm', 'target is protected');
  });
  add('np08', 'RC-07', L('Weekly Race: achievement, varian, status pace', 'Weekly Race: achievement, variance, pace status'), function (P) { var w = P.weekly(); eq(w.length, 6); w.forEach(function (x) { ok(x.ach != null && x.variance != null && x.st, x.id); }); ok(w[0].pace > 100, 'running total judged on pace'); });

  /* ----- NP-09 Monthly Reflection ----- */
  add('np09', 'RF-01', L('Bobot bulanan dinormalisasi 100% (bukan 400%)', 'Monthly weights normalised to 100% (not 400%)'), function (P) {
    eq(P.reflection().total, 100, 'all weeks'); eq(P.reflection(['W38', 'W40']).total, 100, 'two weeks'); eq(P.reflection(['W39']).total, 100, 'one week');
  });
  add('np09', 'RF-02', L('Metode agregasi: sum, average, weighted, ratio, latest', 'Aggregation: sum, average, weighted, ratio, latest'), function (P) {
    eq(P.aggregate('sum', [1, 2, 3]), 6); eq(P.aggregate('avg', [2, 4]), 3); eq(P.aggregate('wavg', [[4, 1], [5, 3]]), 4.75); eq(P.aggregate('ratio', [[95, 100], [190, 200]]), 95); eq(P.aggregate('latest', [1, 7]), 7);
  });
  add('np09', 'RF-03', L('SLA bulanan = total tepat waktu ÷ total pengiriman', 'Monthly SLA = total on time ÷ total deliveries'), function (P) {
    var l = P.reflection().lines.filter(function (x) { return x.k.code === 'R2-SLA'; })[0]; near(l.monthly, (386 + 378 + 382 + 384) / (402 + 398 + 410 + 405) * 100, 0.01, 'ratio');
    var rev = P.reflection().lines.filter(function (x) { return x.k.code === 'R2-REV'; })[0]; eq(rev.monthly, 977e6, 'revenue sum'); eq(rev.target, 980e6, 'monthly target = weekly × weeks');
  });
  add('np09', 'RF-04', L('Tren minggu ke minggu: membaik, menurun, stabil, fluktuatif', 'Week-over-week trend: improving, declining, stable, volatile'), function (P) {
    eq(P.trendOf([90, 92, 94, 96], 'higher'), 'improving'); eq(P.trendOf([2.4, 2.2, 2.0, 1.9], 'lower'), 'improving'); eq(P.trendOf([96, 94, 92, 90], 'higher'), 'declining');
    eq(P.trendOf([95, 95.2, 95.1, 95], 'higher'), 'stable'); eq(P.trendOf([90, 96, 89, 97], 'higher'), 'volatile');
  });
  add('np09', 'RF-05', L('Alur persetujuan reflection dan amandemen', 'Reflection approval flow and amendment'), function (P) {
    eq(P.reflTransition(fin(P), 'leader').code, 'noperm', 'finance cannot submit'); eq(P.reflTransition(spv(P), 'manager').code, 'transition', 'no skipping');
    eq(P.reflTransition(spv(P), 'leader').ok, true); eq(P.reflTransition(spv(P), 'manager').ok, true); eq(P.reflTransition(spv(P), 'owner').code, 'noperm', 'manager review');
    eq(P.reflTransition(opsm(P), 'owner').ok, true); eq(P.reflTransition(opsm(P), 'frozen').code, 'noperm', 'owner approval'); eq(P.reflTransition(own(P), 'frozen').ok, true);
    eq(P.reflTransition(own(P), 'draft').code, 'frozen', 'frozen is locked');
    eq(P.reflAmend(own(P), '', own(P)).code, 'reason'); eq(P.reflAmend(own(P), 'Koreksi data SLA', spv(P)).code, 'approver');
    var r = P.reflAmend(own(P), 'Koreksi data SLA', own(P)); eq(r.ok, true); eq(r.v, 2); eq(P.auditLog()[0].ev, 'REFL.AMEND');
  });
  add('np09', 'RF-06', L('Carry forward menyimpan minggu, umur, owner, KPI, riwayat', 'Carry forward keeps week, age, owner, KPI, history'), function (P) {
    var r = P.carryForward(spv(P), 'ISS-0907'); eq(r.ok, true); eq(r.i.week, 'W37'); eq(r.i.owner, 'EMP-071'); eq(r.i.kpi, 'R2-UPT'); ok(r.i.carried.age >= 29, 'age'); ok(r.i.hist.length >= 2, 'history');
    eq(P.carryForward(spv(P), 'ISS-0929').ok, false, 'resolved not carried');
  });
  add('np09', 'RF-07', L('Draft STRACON terisi otomatis, aktif hanya setelah review', 'STRACON draft prefilled, active only after review'), function (P) {
    P.carryForward(spv(P), 'ISS-0921'); eq(P.straconDraft(spv(P)).code, 'noperm', 'needs stracon.create');
    var d = P.straconDraft(opsm(P)); eq(d.ok, true); eq(d.d.status, 'draft'); ok(d.d.items.some(function (i) { return i.src === 'carry'; }) && d.d.items.some(function (i) { return i.src === 'gap'; }) && d.d.items.some(function (i) { return i.src === 'insight'; }), 'sources');
    eq(P.straconTransition(own(P), 'active').code, 'review', 'review first'); eq(P.straconTransition(opsm(P), 'review').ok, true); eq(P.straconTransition(own(P), 'active').ok, true);
  });
  add('np09', 'RF-08', L('Ringkasan: well, attention, win, risk, opportunity', 'Summary: well, attention, win, risk, opportunity'), function (P) { var s = P.reflection().summary; ok(s.win && s.risk && s.opp && s.well && s.attention, 'sections'); });

  /* ----- NP-10 Decision intelligence ----- */
  add('np10', 'DI-01', L('Setiap insight: WHAT, WHY, RISK, RECOMMENDATION, ACTION + tipe', 'Every insight: WHAT, WHY, RISK, RECOMMENDATION, ACTION + type'), function (P) {
    eq(P.insights().length >= 4, true); P.insights().forEach(function (i) { ok(i.what && i.why && i.risk && i.rec && i.acts.length && P.INS_TYPE[i.type], i.id); });
    ['descriptive', 'diagnostic', 'predictive', 'prescriptive'].forEach(function (t) { ok(P.insights().some(function (i) { return i.type === t; }), t); });
  });
  add('np10', 'DI-02', L('Aksi manajemen dikontrol izin', 'Management actions are permission-controlled'), function (P) {
    eq(P.insightAct(none(P), 'INS-02', 'assign', { owner: 'EMP-030' }).code, 'noperm'); var r = P.insightAct(own(P), 'INS-02', 'assign', { owner: 'EMP-030' }); eq(r.ok, true); eq(P.tasksFor('INS-02').length, 1);
  });
  add('np10', 'DI-03', L('Decision log menyimpan field lengkap', 'Decision log stores the full record'), function (P) {
    eq(P.decisionAdd(own(P), { d: L('x') }).code, 'invalid'); var r = P.decisionAdd(own(P), { d: L('Review dosing'), owner: 'EMP-071', due: '2026-10-12', src: 'INS-02', exp: L('GM +1 pt') });
    eq(r.ok, true); ['id', 'src', 'd', 'owner', 'due', 'exp', 'fu', 'act', 'status', 'note', 'ev'].forEach(function (f) { ok(f in r.d, f); });
    eq(P.decisionUpdate(own(P), r.d.id, { status: 'done', act: L('GM 33,9%') }).ok, true);
  });
  add('np10', 'DI-04', L('Export laporan sesuai izin', 'Report export follows permissions'), function (P) {
    eq(P.exportReport(opr(P), 'fin', 'csv').code, 'noperm'); var r = P.exportReport(own(P), 'fin', 'csv'); eq(r.ok, true); ok(/^Baris,Rp/.test(r.content), 'csv'); eq(P.auditLog()[0].ev, 'REPORT.EXPORT');
    eq(P.reports(fin(P)).filter(function (x) { return x.k === 'fin'; })[0].allowed, true);
  });
  add('np10', 'DI-05', L('Lima skor punya definisi dan hitungan terpisah (§77)', 'Five scores have separate definitions and calculations (§77)'), function (P) {
    var v = [P.health().score, P.fin.health().score, P.xscore().now, P.teamScore('ops'), P.person('EMP-001').score]; ok(v.every(function (x) { return typeof x === 'number'; }), 'numbers');
    var uniq = v.filter(function (x, i) { return v.indexOf(x) === i; }); ok(uniq.length >= 4, 'distinct values');
  });

  /* ----- §78 / §81 Determinism & audit ----- */
  add('audit', 'AUD-01', L('Perubahan goal, KPI, target, bobot, formula tercatat di audit', 'Goal, KPI, target, weight, formula changes are audited'), function (P) {
    P.goalAdjust(own(P), 'QG-Q4-01', 50, 'x'); P.kpiSave(own(P), 'CLI-04', { target: 4.7, weight: 25, formula: L('baru') }, 'Q4');
    var evs = P.auditLog().map(function (e) { return e.ev; }); ['GOAL.ADJUST', 'TARGET.CHANGE', 'WEIGHT.CHANGE', 'FORMULA.CHANGE', 'KPI.VERSION'].forEach(function (e) { ok(evs.indexOf(e) >= 0, e); });
    var e = P.auditLog().filter(function (x) { return x.ev === 'TARGET.CHANGE'; })[0]; eq(e.from, '4.6'); eq(e.to, '4.7'); ok(e.reason && e.by && e.at, 'who / when / why');
  });
  add('audit', 'AUD-02', L('Hitungan deterministik: hasil sama setiap dijalankan', 'Deterministic: same result on every run'), function (P) { var a = JSON.stringify([P.health().score, P.xscore().now, P.fin.health().score, P.r2Board().score, P.reflection().score]); P._reset(); eq(JSON.stringify([P.health().score, P.xscore().now, P.fin.health().score, P.r2Board().score, P.reflection().score]), a); });
  add('audit', 'AUD-03', L('Tindakan tanpa izin ditolak dan dicatat', 'Actions without permission are refused and logged'), function (P) { eq(P.kpiSave(none(P), 'OPS-01', { target: 1 }, 'x').code, 'noperm'); eq(P.auditLog()[0].ev, 'ACCESS.DENIED'); });

  /* ---------- §81–§94 governance ---------- */
  add('audit', 'AUD-04', L('Audit menyimpan siapa, kapan, nilai lama, nilai baru, alasan dan persetujuan', 'Audit stores who, when, old value, new value, reason and approval'), function (P) {
    P.manualInput(opsm(P), 'OPS-01', 95.9, 'Koreksi data kurir'); var e = P.auditLog()[0];
    eq(e.ev, 'APPROVAL.REQUEST'); ok(e.by && e.at && e.reason, 'who / when / why'); eq(e.to, '95.9'); ok(e.from != null, 'old value'); eq(e.appr.st, 'pending');
    ['goal', 'kpi', 'target', 'weight', 'formula', 'actual', 'scorecard', 'race', 'issue', 'refl', 'strategy', 'decision', 'approval'].forEach(function (o) { ok(P.AUDIT_OBJECTS.some(function (x) { return x[0] === o; }), '§81 object ' + o); });
  });
  add('gov', 'APR-01', L('Input manual dari non-approver menunggu persetujuan; pengaju tidak bisa menyetujui sendiri', 'Manual input by a non-approver waits for approval; requesters cannot approve themselves'), function (P) {
    var before = P.kpi('OPS-01').actual, r = P.manualInput(opsm(P), 'OPS-01', 95.9, 'Koreksi data kurir');
    eq(r.pending, true); eq(P.kpi('OPS-01').actual, before, 'not applied yet');
    var q = P.approvalQueue(own(P)).filter(function (a) { return a.kind === 'manual'; })[0]; ok(q && q.canAct, 'owner can act');
    eq(P.approvalDecide(opsm(P), r.a.id, true).code, 'noperm'); eq(P.approvalDecide(own(P), r.a.id, false, '').code, 'reason', 'reject needs a reason');
    eq(P.approvalDecide(own(P), r.a.id, true, 'OK').ok, true); eq(P.kpi('OPS-01').actual, 95.9); eq(P.kpi('OPS-01').src, 'manual');
    ok(P.auditLog().some(function (e) { return e.ev === 'MANUAL.INPUT' && e.appr && e.appr.st === 'approved'; }), 'applied entry carries the approval');
    var self = P.requestApproval(own(P), 'manual', 'OPS-01', { value: 1 }, 'x'); eq(P.approvalDecide(own(P), self.a.id, true).code, 'self');
  });
  add('gov', 'APR-02', L('Koreksi keuangan diajukan Finance dan disetujui Owner', 'Financial adjustments are requested by Finance and approved by the Owner'), function (P) {
    eq(P.finAdjust(spv(P), 'cash', 'ACC-02', 1e6, 'x').code, 'noperm'); eq(P.finAdjust(fin0(P), 'cash', 'ACC-02', 1e6, '').code, 'reason');
    var r = P.finAdjust(fin0(P), 'cash', 'ACC-02', -2500000, 'Biaya admin bank belum tercatat'); eq(r.pending, true);
    eq(P.approvalDecide(fin0(P), r.a.id, true).code, 'noperm'); eq(P.approvalDecide(own(P), r.a.id, true, 'OK').ok, true);
    eq(P.state().finadj.length, 1); ok(P.auditLog().some(function (e) { return e.ev === 'FIN.ADJUST' && e.appr.by; }), 'audited with approver');
  });
  add('gov', 'PRV-01', L('Personal Score terlindungi: peran, hierarki, HR, tim dan akses eksplisit', 'Personal Scores protected: role, hierarchy, HR, team scope and explicit access'), function (P) {
    ok(P.canSeePerson(spv(P), 'EMP-071'), 'supervisor → ops team member'); ok(!P.canSeePerson(spv(P), 'EMP-040'), 'supervisor ↛ sales'); ok(!P.canSeePerson(spv(P), 'EMP-030'), 'supervisor ↛ finance');
    ok(!P.canSeePerson(opr(P), 'EMP-061'), 'operator ↛ colleague'); ok(P.canSeePerson(opr(P), 'EMP-001'), 'operator → self');
    ok(!P.canSeePerson(fin0(P), 'EMP-079'), 'finance without perf.view ↛ team'); ok(P.canSeePerson(hrc(P), 'EMP-040'), 'HR → everyone'); ok(P.canSeePerson(own(P), 'EMP-040'), 'owner → everyone');
    ok(P.canSeePerson(opsm(P), 'EMP-002'), 'ops manager → delivery (department)'); ok(!P.canSeePerson(opsm(P), 'EMP-080'), 'ops manager ↛ sales');
    eq(P.grantAccess(spv(P), 'EMP-021', 'EMP-040', 'x').code, 'noperm'); var g = P.grantAccess(hrc(P), 'EMP-021', 'EMP-040', 'Proyek lintas tim Q4'); eq(g.ok, true); ok(P.canSeePerson(spv(P), 'EMP-040'), 'explicit grant');
    P.revokeAccess(hrc(P), g.g.id, 'Selesai'); ok(!P.canSeePerson(spv(P), 'EMP-040'), 'revoked');
  });
  add('gov', 'RL-01', L('Race Leader hanya pada cakupan yang ditugaskan', 'Race Leader limited to the assigned scope'), function (P) {
    eq(P.r2Review(rl(P), 'W40', 'R2-UPT', { why: 'Bearing', decision: 'Ganti' }).ok, true, 'own KPI line'); eq(P.r2Review(rl(P), 'W40', 'R2-REV', { why: 'x' }).code, 'scope', 'other line');
    eq(P.r2Review(rl(P), 'W40', 'R2-UPT', { target: 99 }).code, 'protected', 'no target change'); eq(P.r2Review(rl(P), 'W40', 'R2-UPT', { weight: 30 }).code, 'protected', 'no weight change');
    ok(P.r2Scoped(rl(P)), 'board is scoped'); ok(!P.r2Scoped(spv(P)), 'board leader sees all'); ok(!P.r2Scoped(own(P)), 'race.all sees all');
  });
  add('gov', 'R2-PRI', L('Meeting Mode mulai dari KPI off track, at risk, lalu bobot terbesar (§86)', 'Meeting Mode starts with off track, at risk, then the heaviest KPIs (§86)'), function (P) {
    var pr = P.r2Priority(P.r2Board('W40').lines), rank = function (l) { return l.st === 'off' ? 0 : l.st === 'risk' ? 1 : 2; };
    for (var i = 1; i < pr.length; i++) ok(rank(pr[i - 1]) < rank(pr[i]) || (rank(pr[i - 1]) === rank(pr[i]) && pr[i - 1].k.weight >= pr[i].k.weight), 'order at ' + i);
    eq(P.r2Next('W40', pr[0].k.code), pr[1].k.code, 'next follows priority');
  });
  add('gov', 'FR-01', L('Kesegaran data: waktu update, peringatan data lama, saldo dengan waktu per rekening', 'Data freshness: update time, stale warning, balances with per-account as-of time'), function (P) {
    eq(P.fresh('pos').stale, false); eq(P.fresh('hr').stale, true, 'HRIS sync older than 24 h');
    P.refreshData(own(P), 'hr'); eq(P.fresh('hr').stale, false); eq(P.auditLog()[0].ev, 'DATA.REFRESH');
    P.fin.cash().accounts.forEach(function (a) { var x = P.acctAsOf(a); ok(x.at <= P.now() && x.min >= 0, 'as-of for ' + a.id); });
  });
  add('gov', 'ISS-01', L('Issue Register: wajib KPI, tutup wajib hasil, tercatat di audit', 'Issue Register: KPI required, closing needs a resolution, audited'), function (P) {
    eq(P.issueAdd(spv(P), { n: L('x', 'x'), kpi: 'NOPE', owner: 'EMP-071', due: '2026-10-10' }).code, 'invalid');
    var r = P.issueAdd(spv(P), { n: L('Dryer 2 bocor', 'Dryer 2 leaking'), kpi: 'R2-UPT', owner: 'EMP-075', due: '2026-10-10' }); eq(r.ok, true); eq(P.auditLog()[0].ev, 'ISSUE.CREATE');
    eq(P.issueUpdate(spv(P), r.i.id, { status: 'resolved' }).code, 'reason'); eq(P.issueUpdate(spv(P), r.i.id, { status: 'resolved', resolution: 'Seal diganti' }).ok, true); eq(P.auditLog()[0].ev, 'ISSUE.CLOSE');
    eq(P.issueAdd(opr(P), { n: L('x', 'x'), kpi: 'R2-UPT', owner: 'EMP-075', due: '2026-10-10' }).code, 'noperm');
  });
  add('gov', 'STR-01', L('Strategi wajib terhubung ke goal', 'Strategies must link to a goal'), function (P) {
    eq(P.strategyUpdate(own(P), 'STR-01', { goal: 'NOPE' }).code, 'invalid'); eq(P.strategyUpdate(own(P), 'STR-01', { status: 'risk', reason: 'Pipeline lambat' }).ok, true); eq(P.auditLog()[0].ev, 'STRATEGY.CHANGE');
  });
  add('gov', 'AL-01', L('Alert Center: prioritas, assign wajib owner, selesai wajib catatan', 'Alert Center: prioritised, assign needs an owner, resolve needs a note'), function (P) {
    var a = P.alertList(); ok(P.SEV[a[0].sev].rank >= P.SEV[a[a.length - 1].sev].rank, 'severity first');
    eq(P.alertAct(own(P), a[0].id, 'assigned', {}).code, 'invalid'); eq(P.alertAct(own(P), a[0].id, 'assigned', { owner: 'EMP-075' }).ok, true);
    eq(P.alertAct(own(P), a[0].id, 'resolved', {}).code, 'reason'); eq(P.alertAct(own(P), a[0].id, 'resolved', { note: 'Dryer jalan lagi' }).ok, true); eq(P.alertList()[0].st, 'resolved');
    eq(P.alertAct(opr(P), a[1].id, 'ack').code, 'noperm');
  });
  add('gov', 'REC-01', L('Rekomendasi: sumber jelas, diterima wajib owner & due, bisa jadi keputusan', 'Recommendations: clear source, accepting needs owner & due, can become a decision'), function (P) {
    var r = P.recs(); ok(r.every(function (x) { return x.src; }), 'every recommendation has a source');
    eq(P.recSet(own(P), r[0].id, 'accepted', {}).code, 'invalid'); eq(P.recSet(own(P), r[0].id, 'done').code, 'transition');
    var n = P.decisions().length, ok1 = P.recSet(own(P), r[0].id, 'accepted', { owner: 'EMP-010', due: '2026-10-20', decision: true }); eq(ok1.ok, true); eq(P.decisions().length, n + 1); ok(ok1.decision, 'linked decision');
    eq(P.recSet(own(P), r[1].id, 'rejected', {}).code, 'reason');
  });
  add('gov', 'EXP-01', L('Setiap skor bisa diurai ke komponen, bobot dan sumber', 'Every score breaks down into components, weights and sources'), function (P) {
    ['health', 'fin', 'xscore', 'team:rcv', 'person:EMP-001'].forEach(function (k) { var e = P.explain(k); ok(e && e.rows.length, k); near(e.sum, e.total, 0.15, k + ' components add up'); });
  });

  function run(P) {
    return T.map(function (c) {
      P._reset(); P._setClock(function () { return Date.parse('2026-10-06T09:00:00Z'); });
      try { c.fn(P); return { group: c.group, id: c.id, n: c.n, ok: true }; } catch (e) { return { group: c.group, id: c.id, n: c.n, ok: false, err: e.message }; }
    }).concat([]).map(function (r) { return r; });
  }
  var API = { cases: T, run: function (P) { var r = run(P); P._reset(); P._setClock(function () { return Date.now(); }); return r; } };
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
  else root.JFPERF_TESTS = API;
})(typeof window !== 'undefined' ? window : this);
