/* JFRESH OS — Phase 5 screens (part 3): NP-02 Financial Health (FIN-001 … FIN-006, laid out after
   NV-02), the §89 section screens (EXEC-001, KPI-003, REFL-002 … REFL-006), KPI-004 Version History,
   XSCORE-002 Dimension Detail, DI-003 Alert Center, DI-004 Recommendation Center, APR-PERF-001
   approvals (§94) and AUD-PERF-001 audit trail (§81). Data freshness (§93) is shown where it matters. */
(function () {
  var A = window.JFAPP, P = window.JFPERF, H = A && A.P5;
  if (!A || !P || !H) return;
  var V = A.V, D = P.D, T = A.T, L = A.L, t = A.t, esc = A.esc, ic = A.ic, can = A.can, fmt = A.fmt, href = A.href;
  var cx = H.cx, open = H.open, lnk = H.lnk, by = H.by, sum = H.sum, sc1 = H.sc1, pct = H.pct, fv = H.fv, rpj = H.rpj, mon = H.mon, dt = H.dt, dtt = H.dtt, emp = H.emp;
  var stc = H.stc, bandc = H.bandc, sevc = H.sevc, lifec = H.lifec, delta = H.delta, ring = H.ring, spark = H.spark, qhref = H.qhref, tabs = H.tabs, after = H.after, fail = H.fail;
  var card = H.card, kv = H.kv, note = H.note, tile = H.tile, tiles = H.tiles, dlg = H.dlg, fld = H.fld, inp = H.inp, sel = H.sel, area = H.area, num = H.num, kpiList = H.kpiList, fresh = H.fresh, ago = H.ago, donut = H.donut, rpAx = H.rpAx;
  function dd(d) { var p = String(d).split('-'); return +p[2] + ' ' + mon(p[0] + '-' + p[1]); }
  function more(id, label, q) { return open(id) ? '<a class="more5" href="' + href(id, null, q) + '">' + t(label || L('Lihat detail', 'View detail')) + ic('chevr') + '</a>' : ''; }

  /* ================= NP-02 · FIN-001 Financial Health & Cash Position (NV-02) ================= */
  var FIN_TABS = [['ov', 'Overview', 'gauge'], ['cash', 'Cash Position', 'building'], ['flow', 'Cash Flow', 'refresh'], ['fc', 'Cash Forecast', 'trend'], ['rev', 'Revenue', 'chart'], ['pl', 'P&L', 'file'], ['exp', 'Expense', 'scale'], ['ar', 'AR', 'clock'], ['ap', 'AP', 'calendar'], ['ue', 'Unit Economics', 'percent'], ['score', L('Skor', 'Score'), 'target']];
  var SEG_DIMS = [['plant', 'Plant'], ['client', L('Klien', 'Client')], ['property', L('Properti', 'Property')], ['service', L('Layanan', 'Service')]];
  function flowBars(map, labels) { var rows = Object.keys(map).filter(function (k) { return map[k] > 0; }).map(function (k) { return { l: labels[k], v: map[k] }; }).sort(function (a, b) { return b.v - a.v; }); return rows.length ? A.hbars(rows, { fmt: rpj }) : A.empty(L('Belum ada transaksi kas pada periode ini.', 'No cash transactions in this period.')); }
  function cashParts(cash) { return [{ n: L('Saldo bank', 'Bank balance'), v: cash.bank - cash.restricted, cls: 'c-blue' }, { n: L('Kas di tangan', 'Cash on hand'), v: cash.onHand + cash.petty, cls: 'c-ok' }, { n: L('Kas dibatasi', 'Restricted cash'), v: cash.restricted, cls: 'c-orange' }, { n: 'Free cash', v: cash.free, cls: 'c-fresh' }]; }
  function acctTable(cash, compact) {
    if (!can('fin.cash.accounts')) return note(t(L('Saldo per rekening hanya untuk pengguna dengan izin Lihat saldo per rekening.', 'Per-account balances need the View balances per account permission.')), 'lock');
    return A.list(cash.accounts, [
      { h: L('Nama akun', 'Account'), v: function (a) { return '<b>' + esc(a.n) + '</b>' + (compact ? '' : '<small class="sub5">' + esc(a.id) + '</small>'); } },
      { h: L('Tipe', 'Type'), v: function (a) { return esc(a.type === 'bank' ? 'Bank' : 'Cash'); } },
      { h: L('Saldo', 'Balance'), cls: 'r num', v: function (a) { return '<b>' + (compact ? rpj(a.bal) : fmt.rp(a.bal)) + '</b>'; } },
      { h: L('Pergerakan', 'Movement'), cls: 'r num', v: function (a) { return a.mov ? delta(a.mov / a.bal * 100, { u: '%' }) : '—'; } },
      { h: L('Per waktu', 'As of'), v: function (a) { var x = P.acctAsOf(a); return '<span class="' + (x.stale ? 'fr5-old' : '') + '">' + dtt(x.at) + '</span>'; } },
      compact ? null : { h: L('Status', 'Status'), v: function (a) { return a.restricted ? A.chip('appr', L('Dibatasi', 'Restricted'), 'lock') + '<small class="sub5">' + t(a.why) + '</small>' : A.chip('ok', L('Tersedia', 'Available')); } }
    ].filter(Boolean), function (a) { var x = P.acctAsOf(a); return { t: esc(a.n), r: rpj(a.bal), s: t(L('Per ', 'As of ')) + dtt(x.at), chip: a.restricted ? A.chip('appr', L('Dibatasi', 'Restricted'), 'lock') : '' }; }, null, { dense: true });
  }
  function flowChart(days, o) {
    o = o || {}; var labels = days.map(function (d) { return dd(d.d); });
    var mn = Math.min.apply(null, days.map(function (d) { return d.net; }).concat([0]));
    return A.lineChart([{ n: L('Kas masuk', 'Cash in'), v: days.map(function (d) { return d.inn; }) }, { n: L('Kas keluar', 'Cash out'), v: days.map(function (d) { return d.out; }) }, { n: L('Arus kas bersih', 'Net cash flow'), v: days.map(function (d) { return d.net; }) }], labels, { h: o.h || 200, min: mn * 1.2, fmt: rpj, fmtAx: rpAx, label: T(L('Arus kas harian', 'Daily cash flow')) });
  }
  function fcChart(series, o) {
    o = o || {};
    return A.lineChart([{ n: L('Proyeksi kas', 'Projected cash'), v: series.map(function (d) { return d.proj; }) }, { n: L('Kas masuk', 'Inflow'), v: series.map(function (d) { return d.inn; }) }, { n: L('Kas keluar', 'Outflow'), v: series.map(function (d) { return d.out; }) }], series.map(function (d) { return dd(d.d); }), { h: o.h || 200, fmt: rpj, fmtAx: rpAx, target: P.cfg().cashBuffer, label: T(L('Proyeksi kas 30 hari', '30-day cash projection')) });
  }
  function revChart(o) { var r = P.fin.revDaily(); return A.barChart(r.map(function (x, i) { return { l: dd(x.d), v: x.v, hi: i === r.length - 1 }; }), { h: (o && o.h) || 180, fmt: rpj, fmtAx: rpAx, label: 'Revenue' }); }
  function plRows(pl) { return [['Revenue', pl.revenue, 1], ['COGS', -pl.cogs], ['Gross Profit', pl.gross, 1], ['Operating Expense', -pl.opex], ['Operating Profit', pl.op, 1], [L('Pendapatan / biaya lain', 'Other income / expense'), pl.other], [L('Laba sebelum pajak', 'Profit before tax'), pl.pretax, 1], [L('Pajak', 'Tax'), -pl.tax], ['Net Profit', pl.net, 2]]; }
  function plTable(pl, compact) {
    var g = P.fin.growth();
    var gm = { 'Revenue': null, 'Gross Profit': 'gross', 'Operating Profit': 'op', 'Net Profit': 'net' };
    return '<div class="tblw"><table class="tbl dense plt5"><thead><tr><th>' + t(L('Keterangan', 'Line')) + '</th><th class="r">' + t(L('Nilai', 'Value')) + '</th><th class="r">% Rev</th>' + (compact ? '<th class="r">MoM</th>' : '') + '</tr></thead><tbody>' + plRows(pl).map(function (r) {
      var k = T(r[0]), gk = gm[k];
      return '<tr class="' + (r[2] === 2 ? 'em5 big' : r[2] ? 'em5' : '') + '"><td>' + t(r[0]) + '</td><td class="r num">' + (r[1] < 0 ? '(' : '') + (compact ? rpj(Math.abs(r[1])) : fmt.rp(Math.abs(r[1]))) + (r[1] < 0 ? ')' : '') + '</td><td class="r num">' + pct(Math.abs(r[1]) / pl.revenue * 100) + '</td>' +
        (compact ? '<td class="r">' + (gk && g.mom[gk] != null ? delta(g.mom[gk], { u: '%' }) : k === 'Revenue' ? delta(P.fin.revenue().mom, { u: '%' }) : '') + '</td>' : '') + '</tr>';
    }).join('') + '</tbody></table></div>';
  }
  function finOv() {
    var fh = P.fin.health(), cash = P.fin.cash(), rev = P.fin.revenue(), pl = P.fin.pl(), ar = P.fin.ar(), ap = P.fin.ap(), fc = P.fin.forecast(), sla = P.kpi('OPS-01'), e = P.fin.expenses(), days = P.fin.daily(30), fs = P.fin.fcSeries(30);
    var f30 = { tin: sum(days.map(function (d) { return d.inn; })), tout: sum(days.map(function (d) { return d.out; })) };
    var strip = tiles([
      tile({ k: 'Total Cash Available', v: rpj(cash.available), s: t(L('Total kas ', 'Total cash ')) + rpj(cash.total), href: H.hubHref('FIN-001', 'cash', 'ov') }),
      tile({ k: 'Revenue MTD', v: rpj(rev.mtd), s: pct(rev.vsTarget) + t(L(' dari target', ' of target')), href: H.hubHref('FIN-001', 'rev', 'ov'), tone: rev.vsTarget < 95 ? 'warn' : '' }),
      tile({ k: 'Net Profit (Sep)', v: rpj(pl.net), s: 'MoM ' + delta(P.fin.growth().mom.net, { u: '%' }), href: H.hubHref('FIN-001', 'pl', 'ov') }),
      tile({ k: 'Gross Margin', v: pct(pl.gm), s: 'Net margin ' + pct(pl.nm), href: H.hubHref('FIN-001', 'pl', 'ov'), tone: pl.gm < 58 ? 'warn' : '' }),
      tile({ k: 'SLA', v: pct(P.actual(sla)), s: t(L('Target ', 'Target ')) + pct(sla.target), href: open('KPI-DTL-001') ? href('KPI-DTL-001', 'OPS-01') : null, tone: P.actual(sla) < sla.target ? 'warn' : '' }),
      tile({ k: 'DSO', v: fmt.num(ar.dso, 1) + t(L(' hari', ' days')), s: 'Collection ' + pct(ar.collection), href: H.hubHref('FIN-001', 'ar', 'ov') }),
      tile({ k: 'Outstanding AR', v: rpj(ar.total), s: t(L('Jatuh tempo ', 'Overdue ')) + rpj(ar.overdue), href: H.hubHref('FIN-001', 'ar', 'ov'), tone: ar.overdueRatio > 30 ? 'crit' : '' }),
      tile({ k: 'Financial Health Score', ring: fh.score, s: bandc(fh.band), href: H.hubHref('FIN-001', 'score', 'ov') })
    ], 'tls5-8');
    return strip +
      '<div class="fin5-g">' +
        card('Cash Position', donut(cashParts(cash), { center: rpj(cash.total), sub: L('Total kas', 'Total cash'), label: 'Cash Position' }), { icon: 'building', right: more('FIN-002') }) +
        card('Cash Flow', '<div class="fin5-k">' + kv([[L('Kas masuk 30 hari', 'Cash in, 30 days'), '<b>' + rpj(f30.tin) + '</b>'], [L('Kas keluar 30 hari', 'Cash out, 30 days'), '<b>' + rpj(f30.tout) + '</b>'], [L('Arus kas bersih', 'Net cash flow'), '<b>' + (f30.tin - f30.tout < 0 ? '−' : '+') + rpj(Math.abs(f30.tin - f30.tout)) + '</b>']]) + '</div>' + flowChart(days, { h: 170 }), { icon: 'refresh', right: more('FIN-003') }) +
        card(L('Cash Forecast (30 hari)', 'Cash Forecast (30 days)'), kv([[L('Perkiraan masuk', 'Expected inflow'), '+' + rpj(fc.in30)], [L('Perkiraan keluar', 'Expected outflow'), '−' + rpj(fc.out30)], [L('Proyeksi kas', 'Projected cash'), '<b>' + rpj(fc.proj30) + '</b>']]) + fcChart(fs, { h: 170 }), { icon: 'trend', right: more('FIN-001', null, { tab: 'fc' }) }) +
        card(L('Saldo per Rekening', 'Account Balance'), acctTable(cash, true), { icon: 'building', right: more('FIN-002', L('Lihat semua', 'View all')) }) +
        card('Revenue Trend', kv([['Revenue MTD', '<b>' + rpj(rev.mtd) + '</b>'], [L('Pencapaian target', 'Target achievement'), pct(rev.vsTarget)], [L('September vs Agustus', 'September vs August'), delta(rev.mom, { u: '%' })]]) + revChart({ h: 150 }), { icon: 'chart', right: more('FIN-001', null, { tab: 'rev' }) }) +
        card(L('Ringkasan P&L', 'P&L Summary') + ' · ' + mon(pl.m, true), plTable(pl, true), { icon: 'file', right: more('FIN-004') }) +
        card('Expense Health', A.list(e.rows.slice(0, 6), [
          { h: L('Kategori', 'Category'), v: function (r) { return '<b>' + t(r.n) + '</b>'; } }, { h: 'Budget', cls: 'r num', v: function (r) { return rpj(r.budget); } }, { h: L('Aktual', 'Actual'), cls: 'r num', v: function (r) { return rpj(r.actual); } },
          { h: '%', cls: 'r', v: function (r) { return delta(r.pct, { u: '%', dir: 'lower' }); } }, { h: L('Tren', 'Trend'), v: function (r) { return spark(r.trend, { w: 60, h: 20 }); } }
        ], function (r) { return { t: t(r.n), r: rpj(r.actual), s: 'Budget ' + rpj(r.budget) + ' · ' + (r.pct > 0 ? '+' : '') + fmt.num(r.pct, 1) + '%', chip: r.alert ? A.chip('crit', L('Over budget', 'Over budget'), 'alert') : '' }; }, null, { dense: true }), { icon: 'scale', right: more('FIN-001', null, { tab: 'exp' }) }) +
        card('AR Aging', '<div class="ag5">' + [['total', L('Total AR', 'Total AR'), ar.total]].concat(P.BUCKETS.map(function (b) { return [b[0], b[1], ar.buckets[b[0]]]; })).map(function (b) { return '<div class="ag5-c' + (b[0] !== 'total' && b[0] !== 'current' && b[2] > 0 ? ' ag5-w' : '') + '"><small>' + t(b[1]) + '</small><b class="num">' + rpj(b[2]) + '</b>' + (b[0] !== 'total' ? '<span>' + pct(b[2] / ar.total * 100, 0) + '</span>' : '') + '</div>'; }).join('') + '</div>' +
          kv([['DSO', fmt.num(ar.dso, 1) + t(L(' hari', ' days'))], ['Collection rate', pct(ar.collection)], ['Overdue ratio', pct(ar.overdueRatio)]]) +
          '<ol class="top5">' + ar.top.slice(0, 3).map(function (r) { return '<li><span>' + esc(P.clientName(r.cl)) + '</span><b class="num">' + rpj(r.amt) + '</b></li>'; }).join('') + '</ol>', { icon: 'clock', right: more('FIN-005') }) +
        card('AP & Obligations', '<div class="ag5">' + [[L('Hari ini', 'Today'), ap.dueToday], [L('7 hari', '7 days'), ap.due7], [L('30 hari', '30 days'), ap.due30], ['Total AP', sum(ap.items.map(function (x) { return x.amt; }))]].map(function (b) { return '<div class="ag5-c"><small>' + t(b[0]) + '</small><b class="num">' + rpj(b[1]) + '</b></div>'; }).join('') + '</div>' +
          A.hbars(Object.keys(P.AP_CATS).filter(function (k) { return ap.byCat[k]; }).map(function (k) { return { l: P.AP_CATS[k], v: ap.byCat[k] }; }), { fmt: rpj }), { icon: 'calendar', right: more('FIN-001', null, { tab: 'ap' }) }) +
      '</div>' +
      (fc.alerts.length ? card(L('Peringatan forecast kas', 'Cash forecast alerts'), '<ul class="al5">' + fc.alerts.map(function (a) { return '<li class="t-' + P.SEV[a.sev].tone + '">' + ic('alert') + '<span>' + t(a.t) + '</span></li>'; }).join('') + '</ul>', { icon: 'alert' }) : '') +
      card(L('Perlu perhatian keuangan', 'Financial items needing attention'), '<ol class="atts5">' + P.attention().filter(function (a) { return a.pillar === 'fin'; }).map(A.P5.attItem).join('') + '</ol>', { icon: 'bell' });
  }
  function finCashPos() {
    var cash = P.fin.cash();
    var pos = [[L('Total kas', 'Total cash'), cash.total], [L('Kas di tangan', 'Cash on hand'), cash.onHand], ['Petty cash', cash.petty], [L('Saldo bank', 'Bank balance'), cash.bank], [L('Kas operasional', 'Operating cash'), cash.operational], [L('Kas dibatasi', 'Restricted cash'), cash.restricted], [L('Kas tersedia', 'Available cash'), cash.available], [L('Kewajiban 30 hari', 'Committed (30 days)'), cash.committed], ['Free cash', cash.free]];
    var adj = P.state().finadj.filter(function (a) { return a.area === 'cash'; });
    return '<div class="grid2">' + card('Cash Position', donut(cashParts(cash), { center: rpj(cash.total), sub: L('Total kas', 'Total cash') }) +
        '<div class="tblw"><table class="tbl dense pos5"><tbody>' + pos.map(function (r, i) { return '<tr' + (i === 6 || i === 8 ? ' class="em5"' : '') + '><td>' + t(r[0]) + '</td><td class="r num">' + fmt.rp(r[1]) + '</td></tr>'; }).join('') + '</tbody></table></div>', { icon: 'building' }) +
      card(L('Saldo per rekening', 'Balance per account'), fresh('bank') + acctTable(cash) + note(t(L('Setiap saldo menampilkan waktu per data dari bank. Saldo yang lebih lama dari 3 jam ditandai.', 'Every balance shows its as-of time from the bank. Balances older than 3 hours are flagged.')), 'clock'), { icon: 'coins' }) + '</div>' +
      (adj.length ? card(L('Koreksi kas yang disetujui', 'Approved cash adjustments'), A.list(adj, [{ h: 'Ref', v: function (a) { return '<b>' + esc(a.ref) + '</b>'; } }, { h: L('Nilai', 'Amount'), cls: 'r num', v: function (a) { return (a.amount < 0 ? '−' : '+') + rpj(Math.abs(a.amount)); } }, { h: L('Alasan', 'Reason'), v: function (a) { return esc(a.reason); } }, { h: L('Disetujui', 'Approved'), v: function (a) { return dtt(a.at); } }], function (a) { return { t: esc(a.ref) + ' · ' + esc(a.reason), r: rpj(a.amount) }; }, null, { dense: true }), { icon: 'filecheck' }) : '');
  }
  function finFlow(q) {
    var fp = q.fp || 'mtd', f = P.fin.flow(fp), days = P.fin.daily(30);
    return card(L('Arus kas harian (30 hari)', 'Daily cash flow (30 days)'), flowChart(days), { icon: 'refresh' }) +
      card(L('Arus kas per periode', 'Cash flow by period'), tabs(P.FLOW_PERIODS, fp, 'fp', { seg: true, def: 'mtd', label: L('Periode', 'Period') }) +
        tiles([tile({ k: L('Kas masuk', 'Cash in'), v: rpj(f.tin) }), tile({ k: L('Kas keluar', 'Cash out'), v: rpj(f.tout) }), tile({ k: L('Arus kas bersih', 'Net cash flow'), v: (f.net < 0 ? '−' : '+') + rpj(Math.abs(f.net)), s: t(L('Kas masuk − kas keluar', 'Cash in − cash out')), tone: f.net < 0 ? 'crit' : 'ok' })], 'tls5-3') +
        '<div class="grid2"><div><h3 class="h5">' + t(L('Kas masuk', 'Cash in')) + '</h3>' + flowBars(f.inn, P.FLOW_IN) + '</div><div><h3 class="h5">' + t(L('Kas keluar', 'Cash out')) + '</h3>' + flowBars(f.out, P.FLOW_OUT) + '</div></div>', { icon: 'layers' });
  }
  function finFC() {
    var fc = P.fin.forecast(), fs = P.fin.fcSeries(30);
    return tiles([tile({ k: L('Kas tersedia', 'Available cash'), v: rpj(fc.available) }), tile({ k: L('Proyeksi 7 hari', 'Projected 7 days'), v: rpj(fc.proj7) }), tile({ k: L('Proyeksi 30 hari', 'Projected 30 days'), v: rpj(fc.proj30), tone: fc.proj30 < fc.buffer ? 'crit' : '' }), tile({ k: L('Buffer minimum', 'Minimum buffer'), v: rpj(fc.buffer) })], 'tls5-4') +
      card(L('Proyeksi kas 30 hari', '30-day cash projection'), fcChart(fs) + note(t(L('Garis target = buffer kas minimum. Kas keluar memakai jadwal AP; kas masuk memakai pola penagihan.', 'Target line = minimum cash buffer. Outflows use the AP schedule; inflows use the collection pattern.')), 'info'), { icon: 'trend' }) +
      '<div class="grid2">' + card(L('7 dan 30 hari', '7 and 30 days'), '<div class="fc5">' + [['7', fc.in7, fc.out7, fc.proj7], ['30', fc.in30, fc.out30, fc.proj30]].map(function (r) { return '<div class="fc5-c"><b>' + t(L(r[0] + ' hari', r[0] + ' days')) + '</b>' + kv([[L('Kas masuk', 'Cash in'), '+' + rpj(r[1])], [L('Kas keluar', 'Cash out'), '−' + rpj(r[2])], [L('Proyeksi kas', 'Projected cash'), '<b>' + rpj(r[3]) + '</b>']]) + '</div>'; }).join('') + '</div>', { icon: 'calendar' }) +
      card(L('Peringatan', 'Warnings'), fc.alerts.length ? '<ul class="al5">' + fc.alerts.map(function (a) { return '<li class="t-' + P.SEV[a.sev].tone + '">' + ic('alert') + '<span>' + t(a.t) + '</span></li>'; }).join('') + '</ul>' : A.empty(L('Tidak ada peringatan kas untuk 30 hari ke depan.', 'No cash warnings for the next 30 days.')), { icon: 'alert' }) + '</div>';
  }
  function finRev(q) {
    var rev = P.fin.revenue(), dim = q.seg || 'client', segs = P.fin.segments(dim), tot = sum(segs.map(function (s) { return s.rev; })), m = D.FIN.plMonths;
    return tiles([
      tile({ k: L('Hari ini', 'Today'), v: rpj(rev.today), s: t(L('vs kemarin ', 'vs yesterday ')) + delta(rev.dod, { u: '%' }) }),
      tile({ k: 'MTD', v: rpj(rev.mtd), s: t(L('Target ', 'Target ')) + rpj(rev.mtdTarget) + ' · ' + pct(rev.vsTarget), tone: rev.vsTarget < 95 ? 'warn' : '' }),
      tile({ k: 'YTD', v: rpj(rev.ytd), s: t(L('Target ', 'Target ')) + rpj(rev.ytdTarget) + ' · ' + pct(rev.ytdVs) }),
      tile({ k: L('September', 'September'), v: rpj(rev.sep), s: 'MoM ' + delta(rev.mom, { u: '%' }) + ' · YoY ' + delta(rev.yoy, { u: '%' }) })
    ], 'tls5-4') +
      '<div class="grid2">' + card(L('Revenue harian September', 'Daily revenue, September'), revChart(), { icon: 'chart' }) +
      card(L('Tren revenue bulanan', 'Monthly revenue trend'), A.barChart(m.slice(1).map(function (mm, i) { return { l: mon(mm), v: D.FIN.pl.revenue[i + 1] * 1e6, hi: i === m.length - 2 }; }), { h: 180, fmt: rpj, fmtAx: rpAx, label: 'Revenue' }), { icon: 'trend' }) + '</div>' +
      card(L('Drill-down revenue', 'Revenue drill-down'), tabs(SEG_DIMS, dim, 'seg', { seg: true, def: 'client', label: L('Dimensi', 'Dimension') }) +
        A.hbars(segs.map(function (s) { return { l: [s.n, s.n], v: s.rev }; }), { fmt: rpj }) +
        A.list(segs, [
          { h: L('Nama', 'Name'), v: function (s) { return '<b>' + esc(s.n) + '</b>'; } }, { h: 'Revenue', cls: 'r num', v: function (s) { return rpj(s.rev); } }, { h: L('Porsi', 'Share'), cls: 'r num', v: function (s) { return pct(s.rev / tot * 100); } },
          { h: 'kg', cls: 'r num', v: function (s) { return fmt.num(s.kg, 0); } }, { h: 'pcs', cls: 'r num', v: function (s) { return fmt.num(s.pcs, 0); } }, { h: 'Rp/kg', cls: 'r num', v: function (s) { return fmt.num(Math.round(s.rev / s.kg), 0); } }
        ], function (s) { return { t: esc(s.n), r: rpj(s.rev), s: fmt.num(s.kg, 0) + ' kg · ' + fmt.num(s.pcs, 0) + ' pcs · ' + pct(s.rev / tot * 100) }; }, null, { dense: true }), { icon: 'layers' });
  }
  function finPL(q) {
    var m = D.FIN.plMonths, i = q.m != null && m[+q.m] ? +q.m : m.length - 1, pl = P.fin.pl(i), g = P.fin.growth();
    var gr = [['Gross profit', 'gross', '%'], ['Operating profit', 'op', '%'], ['Net profit', 'net', '%'], ['Net margin', 'margin', ' pt'], [L('Total biaya', 'Total cost'), 'cost', '%']];
    return '<div class="mrow5"><span>' + t(L('Bulan', 'Month')) + '</span>' + tabs(m.map(function (mm, j) { return [String(j), mon(mm, j === 0)]; }), String(i), 'm', { seg: true, def: String(m.length - 1), label: L('Bulan', 'Month') }) + '</div>' +
      tiles([tile({ k: 'Gross margin', v: pct(pl.gm), tone: pl.gm < 58 ? 'warn' : '' }), tile({ k: 'Operating margin', v: pct(pl.om) }), tile({ k: 'Net margin', v: pct(pl.nm), tone: pl.nm < 20 ? 'warn' : '' }), tile({ k: 'Net profit', v: rpj(pl.net) })], 'tls5-4') +
      '<div class="grid2">' + card(T(L('Laba rugi ', 'Profit & loss ')) + mon(pl.m, true), plTable(pl), { icon: 'file' }) +
      card(L('Pertumbuhan laba', 'Profit growth'), '<div class="tblw"><table class="tbl dense"><thead><tr><th></th><th class="r">MoM</th><th class="r">QoQ</th><th class="r">YoY</th></tr></thead><tbody>' + gr.map(function (r) {
        var lower = r[1] === 'cost';
        return '<tr><td>' + t(r[0]) + '</td>' + ['mom', 'qoq', 'yoy'].map(function (k) { return '<td class="r">' + delta(g[k][r[1]], { u: r[2], dir: lower ? 'lower' : 'higher' }) + '</td>'; }).join('') + '</tr>';
      }).join('') + '</tbody></table></div>' + note(t(L('MoM: Sep vs Agu · QoQ: Q3 vs Q2 · YoY: Sep 2026 vs Sep 2025', 'MoM: Sep vs Aug · QoQ: Q3 vs Q2 · YoY: Sep 2026 vs Sep 2025')), 'calendar') +
        A.lineChart([{ n: 'Net profit', v: D.FIN.pl.revenue.slice(1).map(function (x, j) { return P.fin.pl(j + 1).net; }) }], m.slice(1).map(function (mm) { return mon(mm); }), { h: 170, fmt: rpj, fmtAx: rpAx, label: 'Net profit' }), { icon: 'trend' }) + '</div>' +
      '<div class="grid2">' + card('COGS (Sep)', A.hbars(D.FIN.cogsLines.map(function (x) { return { l: x[0], v: x[1] * 1e6 }; }), { fmt: rpj }), { icon: 'washer' }) + card('Operating Expense (Sep)', A.hbars(D.FIN.opexLines.map(function (x) { return { l: x[0], v: x[1] * 1e6 }; }), { fmt: rpj }), { icon: 'briefcase' }) + '</div>';
  }
  function finExp() {
    var e = P.fin.expenses();
    return card(L('Budget vs aktual (Sep)', 'Budget vs actual (Sep)'), A.list(e.rows, [
      { h: L('Kategori', 'Category'), v: function (r) { return '<b>' + t(r.n) + '</b>'; } },
      { h: 'Budget', cls: 'r num', v: function (r) { return rpj(r.budget); } }, { h: L('Aktual', 'Actual'), cls: 'r num', v: function (r) { return '<b>' + rpj(r.actual) + '</b>'; } },
      { h: L('Varian', 'Variance'), cls: 'r num', v: function (r) { return (r.var > 0 ? '+' : r.var < 0 ? '−' : '') + rpj(Math.abs(r.var)); } },
      { h: L('Varian %', 'Variance %'), cls: 'r', v: function (r) { return delta(r.pct, { u: '%', dir: 'lower' }); } },
      { h: L('Tren', 'Trend'), v: function (r) { return spark(r.trend, { w: 70, h: 22 }); } },
      { h: L('Status', 'Status'), v: function (r) { return r.alert ? A.chip('crit', L('Di atas batas ' + e.threshold + '%', 'Over the ' + e.threshold + '% limit'), 'alert') : A.chip('ok', L('Dalam budget', 'Within budget')); } }
    ], function (r) { return { t: t(r.n), r: rpj(r.actual), s: 'Budget ' + rpj(r.budget) + ' · ' + (r.pct > 0 ? '+' : '') + fmt.num(r.pct, 1) + '%', chip: r.alert ? A.chip('crit', L('Over budget', 'Over budget'), 'alert') : '' }; }, null, { dense: true }) +
      kv([[L('Total budget', 'Total budget'), rpj(e.budget)], [L('Total aktual', 'Total actual'), rpj(e.actual)], [L('Varian total', 'Total variance'), delta(e.varPct, { u: '%', dir: 'lower' })], [L('Batas alert', 'Alert threshold'), e.threshold + '%']]), { icon: 'scale' });
  }
  function finUE(q) {
    var dim = q.ue || 'plant', ue = P.fin.ue(dim), tt = ue.total;
    return tiles([
      tile({ k: L('Revenue / kg', 'Revenue / kg'), v: 'Rp ' + fmt.num(tt.revKg, 0) }), tile({ k: L('Biaya / kg', 'Cost / kg'), v: 'Rp ' + fmt.num(tt.costKg, 0) }), tile({ k: L('Profit / kg', 'Profit / kg'), v: 'Rp ' + fmt.num(tt.profitKg, 0) }),
      tile({ k: L('Revenue / pcs', 'Revenue / pcs'), v: 'Rp ' + fmt.num(tt.revPcs, 0) }), tile({ k: L('Biaya / pcs', 'Cost / pcs'), v: 'Rp ' + fmt.num(tt.costPcs, 0) }), tile({ k: L('Margin kontribusi', 'Contribution margin'), v: pct(tt.margin) })
    ], 'tls5-6') +
      card(L('Unit economics per dimensi', 'Unit economics by dimension'), tabs(SEG_DIMS, dim, 'ue', { seg: true, def: 'plant', label: L('Dimensi', 'Dimension') }) +
        A.list(ue.rows, [
          { h: L('Nama', 'Name'), v: function (r) { return '<b>' + esc(r.n) + '</b>'; } }, { h: 'Rev/kg', cls: 'r num', v: function (r) { return fmt.num(r.revKg, 0); } }, { h: L('Biaya/kg', 'Cost/kg'), cls: 'r num', v: function (r) { return fmt.num(r.costKg, 0); } },
          { h: 'Profit/kg', cls: 'r num', v: function (r) { return '<b>' + fmt.num(r.profitKg, 0) + '</b>'; } }, { h: 'Rev/pcs', cls: 'r num', v: function (r) { return fmt.num(r.revPcs, 0); } }, { h: 'Profit/pcs', cls: 'r num', v: function (r) { return fmt.num(r.profitPcs, 0); } },
          { h: 'Margin', cls: 'r num', v: function (r) { return pct(r.margin); } }
        ], function (r) { return { t: esc(r.n), r: pct(r.margin), s: 'Profit/kg Rp ' + fmt.num(r.profitKg, 0) + ' · Profit/pcs Rp ' + fmt.num(r.profitPcs, 0) }; }, null, { dense: true }), { icon: 'percent' });
  }
  function finAR() {
    var ar = P.fin.ar();
    return tiles([
      tile({ k: L('Total AR', 'Total AR'), v: rpj(ar.total) }), tile({ k: L('AR jatuh tempo', 'Overdue AR'), v: rpj(ar.overdue), s: pct(ar.overdueRatio) + t(L(' dari AR', ' of AR')), tone: ar.overdueRatio > 30 ? 'crit' : 'warn' }),
      tile({ k: 'DSO', v: fmt.num(ar.dso, 1) + t(L(' hari', ' days')) }), tile({ k: 'Collection rate', v: pct(ar.collection), tone: ar.collection < 95 ? 'warn' : '' }), tile({ k: L('AR > 60 hari', 'AR > 60 days'), v: pct(ar.over60Share), tone: ar.over60Share > 10 ? 'crit' : '' })
    ], 'tls5-5') + fresh('ar') +
      '<div class="grid2">' + card('AR aging', A.hbars(P.BUCKETS.map(function (b) { return { l: b[1], v: ar.buckets[b[0]], hi: b[0] !== 'current' && ar.buckets[b[0]] > 0 }; }), { fmt: rpj }), { icon: 'clock' }) +
      card(L('Klien jatuh tempo terbesar', 'Top overdue clients'), A.list(ar.top, [
        { h: L('Klien', 'Client'), v: function (r) { return '<b>' + esc(P.clientName(r.cl)) + '</b>'; } }, { h: L('Jatuh tempo', 'Overdue'), cls: 'r num', v: function (r) { return rpj(r.amt); } }, { h: L('Umur tertua', 'Oldest'), cls: 'r num', v: function (r) { return r.oldest + t(L(' hari', ' days')); } }
      ], function (r) { return { t: esc(P.clientName(r.cl)), r: rpj(r.amt), s: r.oldest + t(L(' hari', ' days')) }; }, null, { dense: true }), { icon: 'alert' }) + '</div>' +
      card(L('Semua invoice terbuka', 'All open invoices'), A.list(ar.items.slice().sort(function (a, b) { return b.age - a.age; }), [
        { h: 'Invoice', v: function (i) { return '<b>' + esc(i.inv) + '</b>'; } }, { h: L('Klien', 'Client'), v: function (i) { return esc(P.clientName(i.cl)); } }, { h: L('Terbit', 'Issued'), v: function (i) { return dt(i.issued); } },
        { h: L('Jatuh tempo', 'Due'), v: function (i) { return dt(i.due); } }, { h: L('Umur', 'Age'), cls: 'r num', v: function (i) { return i.age > 0 ? i.age + t(L(' hari', ' d')) : '—'; } },
        { h: 'Bucket', v: function (i) { return A.chip(i.bucket === 'current' ? 'info' : i.bucket === 'b30' ? 'warn' : 'crit', by(P.BUCKETS.map(function (b) { return { k: b[0], l: b[1] }; }), 'k', i.bucket).l); } }, { h: L('Nilai', 'Amount'), cls: 'r num', v: function (i) { return '<b>' + rpj(i.amt) + '</b>'; } }
      ], function (i) { return { t: esc(i.inv) + ' · ' + esc(P.clientName(i.cl)), r: rpj(i.amt), s: t(L('Jatuh tempo ', 'Due ')) + dt(i.due) + (i.age > 0 ? ' · ' + i.age + t(L(' hari', ' days')) : '') }; }, null, { dense: true }), { icon: 'file', count: ar.items.length });
  }
  function finAP() {
    var ap = P.fin.ap(), cash = P.fin.cash();
    return tiles([tile({ k: L('Jatuh tempo hari ini', 'Due today'), v: rpj(ap.dueToday), tone: ap.dueToday ? 'warn' : '' }), tile({ k: L('7 hari', '7 days'), v: rpj(ap.due7) }), tile({ k: L('30 hari', '30 days'), v: rpj(ap.due30) }), tile({ k: 'Free cash', v: rpj(cash.free), s: t(L('Kas tersedia ', 'Available ')) + rpj(cash.available) + ' − AP 30', tone: cash.free < P.cfg().cashBuffer ? 'warn' : 'ok' })], 'tls5-4') +
      '<div class="grid2">' + card(L('Kewajiban 30 hari per kategori', '30-day obligations by category'), A.hbars(Object.keys(P.AP_CATS).filter(function (k) { return ap.byCat[k]; }).map(function (k) { return { l: P.AP_CATS[k], v: ap.byCat[k] }; }), { fmt: rpj }), { icon: 'layers' }) +
      card(L('Daftar kewajiban', 'Obligations'), A.list(ap.items.slice().sort(function (a, b) { return a.days - b.days; }), [
        { h: L('Kewajiban', 'Obligation'), v: function (x) { return '<b>' + t(x.n) + '</b><small class="sub5">' + t(P.AP_CATS[x.cat]) + '</small>'; } }, { h: L('Jatuh tempo', 'Due'), v: function (x) { return dt(x.due); } },
        { h: L('Sisa hari', 'Days left'), cls: 'r num', v: function (x) { return x.days <= 0 ? A.chip('warn', L('Hari ini', 'Today')) : x.days; } }, { h: L('Nilai', 'Amount'), cls: 'r num', v: function (x) { return '<b>' + rpj(x.amt) + '</b>'; } }
      ], function (x) { return { t: t(x.n), r: rpj(x.amt), s: dt(x.due) + ' · ' + t(P.AP_CATS[x.cat]) }; }, null, { dense: true }), { icon: 'calendar', count: ap.items.length }) + '</div>';
  }
  function finScore() {
    var fh = P.fin.health(), check = P.validateWeights(fh.lines.map(function (l) { return l.k.weight; }));
    return '<div class="grid2 g5-hero">' + card('Financial Health Score', '<div class="hero5">' + ring(fh.score, { size: 116, label: 'Financial Health' }) + '<div>' + bandc(fh.band) + H.weightMsg(check) + '</div></div>' + A.lineChart([{ n: 'Financial Health', v: fh.hist.concat([fh.score]) }], H.months(6), { h: 160, min: 60, max: 100, label: 'Financial Health' }), { icon: 'gauge' }) +
      card(L('Definisi skor', 'Score definition'), note(t(L('Financial Health Score hanya mengukur keuangan: pertumbuhan revenue, net margin, arus kas, collection, AR > 60 hari, kontrol biaya dan quick ratio. Berbeda dari Business Health dan XScore, dan tidak digantikan oleh XScore.', 'The Financial Health Score measures finance only: revenue growth, net margin, cash flow, collection, AR > 60 days, cost control and quick ratio. It differs from Business Health and XScore, and XScore never replaces it.')), 'info') +
        kv(fh.lines.map(function (l) { return [l.k.n, pct(l.k.weight, 0)]; })), { icon: 'list' }) + '</div>' +
      card(L('Scorecard Financial Health', 'Financial Health scorecard'), kpiList(fh.lines), { icon: 'target' });
  }
  function finExport() {
    var cash = P.fin.cash(), pl = P.fin.pl(), ar = P.fin.ar();
    var rows = [['Item', 'Value']].concat([['Total cash', cash.total], ['Available cash', cash.available], ['Free cash', cash.free], ['Revenue MTD', P.fin.revenue().mtd], ['Net profit (Sep)', pl.net], ['Gross margin %', pl.gm], ['Outstanding AR', ar.total], ['DSO', ar.dso], ['Financial Health Score', P.fin.health().score]]).concat(can('fin.cash.accounts') ? cash.accounts.map(function (a) { return [a.n + ' (' + dtt(P.acctAsOf(a).at) + ')', a.bal]; }) : []);
    H.download('jfresh-financial-health-' + P.TODAY + '.csv', rows.map(function (r) { return r.map(function (x) { return '"' + String(x).replace(/"/g, '""') + '"'; }).join(','); }).join('\n'), 'text/csv');
    P.audit('REPORT.EXPORT', cx(), { target: 'FIN-001', to: 'csv' });
  }
  V['FIN-001'] = {
    render: function (c) {
      var tab = by(FIN_TABS.map(function (x) { return { k: x[0] }; }), 'k', c.q.tab) ? c.q.tab : 'ov';
      var body = { cash: finCashPos, flow: finFlow, fc: finFC, rev: finRev, pl: finPL, exp: finExp, ar: finAR, ap: finAP, ue: finUE, score: finScore }[tab] || finOv;
      return A.pageHead(null, t(L('Kesehatan keuangan dan posisi kas J\'Fresh · data per ', 'J\'Fresh financial health and cash position · data as of ')) + dt(P.TODAY), A.btn('ghost', 'Export', 'download', { act: 'export' }) + (can('fin.adjust') ? A.btn('ghost', L('Ajukan Koreksi', 'Request Adjustment'), 'edit', { act: 'adjust' }) : '')) +
        '<div class="fr5-row">' + fresh('gl', { label: 'P&L' }) + fresh('bank', { label: L('Saldo bank', 'Bank balances') }) + fresh('ar', { label: 'AR', btn: false }) + '</div>' +
        tabs(FIN_TABS.map(function (x) { return [x[0], x[1], x[2]]; }), tab, 'tab', { def: 'ov', label: L('Bagian keuangan', 'Finance sections'), hf: function (k) { return H.hubHref('FIN-001', k, 'ov'); } }) + body(c.q);
    },
    act: {
      att: A.P5.attAct, export: finExport,
      adjust: function () {
        var c = cx(), accts = P.fin.cash().accounts.map(function (a) { return [a.id, a.n]; }).concat([['AR', 'AR'], ['AP', 'AP'], ['EXP', L('Biaya', 'Expense')]]);
        dlg({ title: L('Ajukan koreksi keuangan', 'Request a financial adjustment'), sub: t(L('Koreksi keuangan selalu butuh persetujuan Owner sebelum diterapkan (§94).', 'Financial adjustments always need Owner approval before they apply (§94).')),
          body: '<div class="fg5">' + fld(L('Area', 'Area'), sel('area', P.FIN_ADJ_AREAS, 'cash'), { req: true }) + fld(L('Rekening / referensi', 'Account / reference'), sel('ref', accts, 'ACC-01'), { req: true }) + fld(L('Nilai koreksi (Rp, minus untuk mengurangi)', 'Adjustment (Rp, negative to reduce)'), inp('amt', '', { num: true }), { req: true }) + fld(L('Alasan', 'Reason'), area('reason', ''), { req: true, wide: true }) + '</div>',
          ok: L('Kirim untuk Persetujuan', 'Send for Approval'), icon: 'send',
          onOk: function (v) { var r = P.finAdjust(c, v.area, v.ref, num(v.amt), v.reason); if (!r.ok) return r.msg; after(L('Koreksi dikirim. Menunggu persetujuan Owner.', 'Adjustment sent. Waiting for Owner approval.')); return true; } });
      }
    }
  };

  /* ================= §89 section screens: own ID and route, same view with the section fixed ================= */
  P.SCREENS.filter(function (s) { return s.of; }).forEach(function (s) {
    var hub = V[s.of]; if (!hub) return;
    V[s.id] = {
      render: function (c) { var q = Object.assign({}, c.q); if (s.tab) q.tab = s.tab; return hub.render(Object.assign({}, c, { q: q })); },
      after: hub.after ? function (c) { var q = Object.assign({}, c.q); if (s.tab) q.tab = s.tab; return hub.after(Object.assign({}, c, { q: q })); } : null,
      act: hub.act, title: hub.title
    };
  });

  /* ================= NP-04 · KPI-004 KPI Version History ================= */
  V['KPI-004'] = {
    render: function (c) {
      var codes = P.codes(), code = c.rec && P.versions(c.rec).length ? c.rec : null;
      if (!code) {
        return A.pageHead(null, t(L('Pilih KPI untuk melihat semua versinya. Versi lama tidak pernah ditimpa.', 'Pick a KPI to see all its versions. Old versions are never overwritten.'))) +
          card(L('KPI dengan lebih dari satu versi', 'KPIs with more than one version'), (function () { var multi = codes.filter(function (k) { return P.versions(k).length > 1; }); return multi.length ? '<ul class="hr5">' + multi.map(function (k) { var v = P.versions(k); return '<li>' + ic('history') + '<span><b>' + lnk('KPI-004', k, esc(k) + ' · ' + t(v[0].n)) + '</b><small>' + v.length + t(L(' versi', ' versions')) + '</small></span></li>'; }).join('') + '</ul>' : A.empty(L('Belum ada KPI dengan versi baru.', 'No KPI has a new version yet.')); })(), { icon: 'history' }) +
          card(L('Semua KPI', 'All KPIs'), '<div class="chips5">' + codes.map(function (k) { return '<a class="chip5" href="' + href('KPI-004', k) + '">' + esc(k) + '</a>'; }).join('') + '</div>', { icon: 'list' });
      }
      var vs = P.versions(code).slice().sort(function (a, b) { return b.v - a.v; }), cur = P.kpi(code);
      var FIELDS = [['target', 'Target'], ['weight', L('Bobot', 'Weight')], ['formula', 'Formula'], ['floor', 'Floor'], ['cap', 'Cap'], ['stretch', 'Stretch'], ['owner', 'Owner'], ['agg', L('Agregasi', 'Aggregation')]];
      function val(k, f) { var x = k[f]; if (f === 'owner') return esc(emp(x)); if (f === 'formula') return t(x || '—'); if (f === 'weight') return pct(x, 0); if (f === 'target' || f === 'stretch') return fv(x, k.unit); return x == null ? '—' : esc(String(x)); }
      return A.pageHead(T(cur.n), esc(code) + ' · ' + t(L('Versi berlaku: v', 'Active version: v')) + cur.v, A.btn('ghost', L('Detail KPI', 'KPI Detail'), 'chart', { go: 'KPI-DTL-001', rec: code }) + (can('kpi.edit') ? A.btn('ghost', L('Ubah KPI', 'Edit KPI'), 'edit', { go: 'KPI-002', rec: code }) : '')) +
        note(t(L('Mengubah KPI aktif selalu membuat versi baru. Hasil periode yang sudah frozen tetap memakai versi saat itu.', 'Editing an active KPI always creates a new version. Frozen period results keep the version used at the time.')), 'shield') +
        '<ol class="ver5">' + vs.map(function (k, i) {
          var prev = vs[i + 1], ch = prev ? FIELDS.filter(function (f) { return JSON.stringify(k[f[0]]) !== JSON.stringify(prev[f[0]]); }) : [];
          return '<li class="ver5-i"><div class="ver5-h"><b>v' + k.v + '</b>' + lifec(k.status) + '<span>' + t(L('Berlaku ', 'Effective ')) + (k.eff ? dt(k.eff) : '—') + '</span></div><p>' + t(k.reason || '—') + '</p>' +
            (ch.length ? '<div class="tblw"><table class="tbl dense"><thead><tr><th>' + t(L('Field', 'Field')) + '</th><th>' + t(L('Sebelum', 'Before')) + ' (v' + prev.v + ')</th><th>' + t(L('Sesudah', 'After')) + ' (v' + k.v + ')</th></tr></thead><tbody>' + ch.map(function (f) { return '<tr><td>' + t(f[1]) + '</td><td>' + val(prev, f[0]) + '</td><td><b>' + val(k, f[0]) + '</b></td></tr>'; }).join('') + '</tbody></table></div>' : prev ? '<small class="sub5">' + t(L('Tidak ada perubahan field kontrak.', 'No contract field changed.')) + '</small>' : '<small class="sub5">' + t(L('Versi pertama.', 'First version.')) + '</small>') + '</li>';
        }).join('') + '</ol>';
    },
    title: function (rec) { var k = rec && P.kpi(rec); return k ? T(L('Versi ', 'Versions ')) + rec : null; }
  };

  /* ================= NP-05 · XSCORE-002 Dimension Detail ================= */
  V['XSCORE-002'] = {
    render: function (c) {
      var x = P.xscore(), d = by(x.dims, 'k', c.rec) || x.dims[0], lines = P.lines(d.sc), hist = P.dimHist ? P.dimHist(d.k) : null;
      return A.pageHead(T(d.n), t(L('Dimensi XScore · grup ', 'XScore dimension · group ')) + (d.g === 'exploit' ? t(L('Eksploitasi', 'Exploitation')) : t(L('Eksplorasi', 'Exploration'))), A.btn('ghost', 'XScore', 'gauge', { go: 'XSCORE-001' })) +
        tabs(x.dims.map(function (z) { return [z.k, z.n, z.icon]; }), d.k, 'rec', { label: L('Dimensi', 'Dimension'), hf: function (k) { return href('XSCORE-002', k); } }) +
        tiles([tile({ k: L('Skor dimensi', 'Dimension score'), ring: d.score }), tile({ k: L('Bobot dimensi', 'Dimension weight'), v: pct(d.w, 0) }), tile({ k: L('Bobot efektif', 'Effective weight'), v: pct(d.eff), s: t(L('Grup × bobot dimensi', 'Group × dimension weight')) }), tile({ k: L('Kontribusi ke XScore', 'Contribution to XScore'), v: sc1(d.score * d.eff / 100), s: 'XScore ' + sc1(x.now) })], 'tls5-4') +
        (hist && hist.length > 1 ? card(L('Tren dimensi', 'Dimension trend'), A.lineChart([{ n: T(d.n), v: hist }], H.months(hist.length), { h: 170, min: 50, max: 100 }), { icon: 'trend' }) : '') +
        card(L('KPI penyusun', 'Contributing KPIs'), lines.length ? kpiList(lines) : A.empty(L('Belum ada KPI pada scorecard ini.', 'No KPI on this scorecard yet.')), { icon: 'list' });
    },
    title: function (rec) { var d = rec && by(P.xscore().dims, 'k', rec); return d ? T(d.n) : null; }
  };

  /* ================= NP-10 · DI-003 Alert Center ================= */
  function alertTabs(cur) { var all = P.alertList(); return tabs([['open', L('Terbuka', 'Open'), 'bell', all.filter(function (a) { return a.st !== 'resolved'; }).length], ['resolved', L('Selesai', 'Resolved'), 'checkc', all.filter(function (a) { return a.st === 'resolved'; }).length], ['all', L('Semua', 'All'), 'list', all.length]], cur, 'f', { seg: true, def: 'open', label: 'Filter' }); }
  V['DI-003'] = {
    render: function (c) {
      var f = c.q.f || 'open', list = P.alertList().filter(function (a) { return f === 'all' || (f === 'resolved' ? a.st === 'resolved' : a.st !== 'resolved'); });
      return A.pageHead(null, t(L('Diurutkan: keparahan → dampak finansial → bobot KPI → dampak strategis → due date.', 'Sorted: severity → financial impact → KPI weight → strategic impact → due date.'))) + alertTabs(f) +
        (list.length ? '<ol class="alc5">' + list.map(function (a, i) {
          return '<li class="alc5-i s-' + (P.SEV[a.sev] || P.SEV.info).tone + '"><span class="alc5-n">' + (i + 1) + '</span><div class="alc5-b"><b>' + t(a.t) + '</b><small>' + sevc(a.sev) + ' ' + A.chip(a.st === 'resolved' ? 'ok' : a.st === 'new' ? 'info' : 'appr', P.ALERT_ST[a.st]) + ' · ' + t(L('Dampak ', 'Impact ')) + (a.fin ? rpj(a.fin) : '—') + ' · ' + t(L('Due ', 'Due ')) + dt(a.due) + ' · ' + esc(emp(a.stOwner)) + (a.kpi ? ' · ' + lnk('KPI-DTL-001', a.kpi, esc(a.kpi)) : '') + '</small>' + (a.stNote ? '<small>' + esc(a.stNote) + '</small>' : '') + '</div>' +
            '<div class="alc5-a">' + (a.src && open(a.src) ? A.btn('ghost', L('Sumber', 'Source'), 'database', { go: a.src }) : '') + (can('di.act') && a.st !== 'resolved' ? (a.st === 'new' ? A.btn('ghost', L('Terima', 'Acknowledge'), 'check', { act: 'al', val: a.id + '|ack' }) : '') + A.btn('ghost', 'Assign', 'usercheck', { act: 'al', val: a.id + '|assigned' }) + A.btn('blue', L('Selesai', 'Resolve'), 'checkc', { act: 'al', val: a.id + '|resolved' }) : '') + '</div></li>';
        }).join('') + '</ol>' : A.stateCard('empty', f === 'resolved' ? L('Belum ada alert yang selesai.', 'No resolved alerts yet.') : L('Tidak ada alert terbuka. Semua sudah ditangani.', 'No open alerts. Everything is handled.')));
    },
    act: {
      al: function (val) {
        var p = String(val).split('|'), id = p[0], st = p[1], c = cx();
        if (st === 'ack') { var r = P.alertAct(c, id, 'ack'); return r.ok ? after(L('Alert diterima.', 'Alert acknowledged.')) : fail(r); }
        dlg({ title: st === 'assigned' ? L('Tugaskan alert', 'Assign alert') : L('Selesaikan alert', 'Resolve alert'), body: st === 'assigned' ? fld('Owner', sel('owner', H.peopleOpts(), 'EMP-010'), { req: true }) + fld(L('Catatan', 'Note'), area('note', '')) : fld(L('Apa yang sudah dilakukan?', 'What was done?'), area('note', ''), { req: true }),
          onOk: function (v) { var r = P.alertAct(c, id, st, { owner: v.owner, note: v.note }); if (!r.ok) return r.msg; after(st === 'assigned' ? L('Alert ditugaskan.', 'Alert assigned.') : L('Alert ditutup.', 'Alert resolved.')); return true; } });
      }
    }
  };

  /* ================= NP-10 · DI-004 Recommendation Center ================= */
  V['DI-004'] = {
    render: function (c) {
      var f = c.q.f || 'active', all = P.recs(), list = all.filter(function (r) { return f === 'all' || (f === 'active' ? ['proposed', 'accepted', 'progress'].indexOf(r.st) >= 0 : r.st === f); });
      var counts = function (st) { return all.filter(function (r) { return r.st === st; }).length; };
      return A.pageHead(null, t(L('Setiap rekomendasi punya sumber (insight atau strategi), owner dan due date. Diterima bisa langsung jadi keputusan.', 'Every recommendation has a source (insight or strategy), an owner and a due date. Accepting can turn it into a decision straight away.'))) +
        tiles([tile({ k: L('Diusulkan', 'Proposed'), v: counts('proposed') }), tile({ k: L('Diterima / dikerjakan', 'Accepted / in progress'), v: counts('accepted') + counts('progress') }), tile({ k: L('Selesai', 'Done'), v: counts('done'), tone: 'ok' }), tile({ k: L('Ditolak', 'Rejected'), v: counts('rejected') })], 'tls5-4') +
        tabs([['active', L('Aktif', 'Active')], ['proposed', L('Diusulkan', 'Proposed')], ['done', L('Selesai', 'Done')], ['rejected', L('Ditolak', 'Rejected')], ['all', L('Semua', 'All')]], f, 'f', { seg: true, def: 'active', label: 'Filter' }) +
        (list.length ? '<div class="rcs5">' + list.map(function (r) {
          var nx = P.REC_FLOW[r.st] || [], srcHref = r.srcType === 'insight' ? (open('DI-002') ? href('DI-002', null, { id: r.src }) : null) : (open('REFL-005') ? href('REFL-005') : null);
          return '<article class="rc5r"><header>' + sevc(r.sev) + A.chip(r.st === 'done' ? 'ok' : r.st === 'rejected' ? 'mute' : r.st === 'proposed' ? 'info' : 'appr', P.REC_ST[r.st]) + (r.impact ? '<span class="sub5">' + t(L('Dampak ', 'Impact ')) + rpj(r.impact) + '</span>' : '') + '</header>' +
            '<b>' + t(r.t) + '</b>' + (r.why ? '<p>' + t(r.why) + '</p>' : '') +
            kv([[L('Sumber', 'Source'), srcHref ? '<a class="lnk5" href="' + srcHref + '">' + esc(r.src) + '</a>' : esc(r.src)], ['KPI', r.kpi ? lnk('KPI-DTL-001', r.kpi, esc(r.kpi)) : '—'], ['Owner', r.owner ? esc(emp(r.owner)) : '—'], ['Due', r.due ? dt(r.due) : '—'], r.decision ? [L('Keputusan', 'Decision'), lnk('DI-005', null, esc(r.decision))] : null]) +
            (can('di.act') && nx.length ? '<div class="ds-btnbar">' + nx.map(function (to) { return A.btn(to === 'rejected' ? 'ghost' : 'blue', to === 'accepted' ? L('Terima', 'Accept') : to === 'progress' ? L('Mulai Kerjakan', 'Start') : to === 'done' ? L('Tandai Selesai', 'Mark Done') : L('Tolak', 'Reject'), to === 'rejected' ? 'x' : 'check', { act: 'rec', val: r.id + '|' + to }); }).join('') + '</div>' : '') + '</article>';
        }).join('') + '</div>' : A.stateCard('empty', L('Belum ada rekomendasi pada filter ini.', 'No recommendations in this filter.')));
    },
    act: {
      rec: function (val) {
        var p = String(val).split('|'), id = p[0], to = p[1], c = cx();
        if (to === 'progress' || to === 'done') { var r = P.recSet(c, id, to); return r.ok ? after(L('Status rekomendasi diubah.', 'Recommendation status updated.')) : fail(r); }
        dlg({ title: to === 'accepted' ? L('Terima rekomendasi', 'Accept recommendation') : L('Tolak rekomendasi', 'Reject recommendation'),
          body: to === 'accepted' ? '<div class="fg5">' + fld('Owner', sel('owner', H.peopleOpts(), 'EMP-010'), { req: true }) + fld('Due date', inp('due', '2026-10-20', { type: 'date' }), { req: true }) + '<label class="ck5"><input type="checkbox" name="decision" checked> <span>' + t(L('Catat juga di Decision Log', 'Also record in the Decision Log')) + '</span></label></div>' : fld(L('Alasan', 'Reason'), area('note', ''), { req: true }),
          onOk: function (v) { var r = P.recSet(c, id, to, { owner: v.owner, due: v.due, note: v.note, decision: !!v.decision }); if (!r.ok) return r.msg; after(to === 'accepted' ? (r.decision ? L('Diterima dan dicatat sebagai ' + r.decision + '.', 'Accepted and recorded as ' + r.decision + '.') : L('Rekomendasi diterima.', 'Recommendation accepted.')) : L('Rekomendasi ditolak.', 'Recommendation rejected.')); return true; } });
      }
    }
  };

  /* ================= §94 · APR-PERF-001 Performance Approvals ================= */
  V['APR-PERF-001'] = {
    render: function (c) {
      var c0 = cx(), f = c.q.f || 'pending', all = P.approvalQueue(c0), list = all.filter(function (a) { return f === 'all' || (f === 'pending' ? a.st === 'pending' : a.st !== 'pending'); });
      return A.pageHead(null, t(L('Input manual KPI, koreksi keuangan, versi KPI, reflection dan STRACON yang menunggu keputusan. Semua keputusan masuk jejak audit.', 'Manual KPI actuals, financial adjustments, KPI versions, reflection and STRACON waiting for a decision. Every decision goes into the audit trail.'))) +
        tabs([['pending', L('Menunggu', 'Pending'), 'clock', all.filter(function (a) { return a.st === 'pending'; }).length], ['done', L('Sudah diputuskan', 'Decided'), 'checkc'], ['all', L('Semua', 'All'), 'list']], f, 'f', { seg: true, def: 'pending', label: 'Filter' }) +
        (list.length ? '<ul class="apr5">' + list.map(function (a) {
          var k = P.APPROVAL_KINDS[a.kind];
          return '<li class="apr5-i"><span class="apr5-ic">' + ic(k.icon) + '</span><div class="apr5-b"><b>' + t(k.n) + ' · ' + esc(a.target) + '</b><small>' + (a.from != null || a.to != null ? esc(a.from == null ? '—' : String(a.from)) + ' → <b>' + esc(a.to == null ? '—' : String(a.to)) + '</b> · ' : '') + esc(a.reason || '') + (a.byName ? ' · ' + esc(a.byName) : '') + (a.at ? ' · ' + dtt(a.at) : '') + '</small>' +
            (a.decided ? '<small>' + A.chip(a.st === 'approved' ? 'ok' : 'crit', a.st === 'approved' ? L('Disetujui', 'Approved') : L('Ditolak', 'Rejected')) + ' ' + esc(a.decided.name || a.decided.by) + ' · ' + dtt(a.decided.at) + (a.decided.note ? ' · ' + esc(a.decided.note) : '') + '</small>' : '') + '</div>' +
            '<div class="apr5-a">' + (a.st === 'pending' ? (a.src === 'req' ? (a.canAct ? A.btn('ghost', L('Tolak', 'Reject'), 'x', { act: 'dec', val: a.id + '|0' }) + A.btn('primary', L('Setujui', 'Approve'), 'check', { act: 'dec', val: a.id + '|1' }) : A.chip('mute', ctxIsReq(c0, a) ? L('Pengajuan Anda', 'Your request') : L('Menunggu approver', 'Waiting for approver'))) : open(a.go) ? A.btn('blue', L('Buka', 'Open'), 'arrow', { go: a.go, rec: a.rec || undefined }) : '') : '') + '</div></li>';
        }).join('') + '</ul>' : A.stateCard('empty', f === 'pending' ? L('Tidak ada yang menunggu persetujuan.', 'Nothing is waiting for approval.') : L('Belum ada keputusan persetujuan.', 'No approval decisions yet.')));
    },
    act: {
      dec: function (el) {
        var p = String(el.getAttribute('data-val')).split('|'), id = p[0], ok = p[1] === '1', c = cx();
        dlg({ title: ok ? L('Setujui permintaan', 'Approve request') : L('Tolak permintaan', 'Reject request'), body: fld(ok ? L('Catatan (opsional)', 'Note (optional)') : L('Alasan penolakan', 'Reason for rejecting'), area('note', ''), { req: !ok }), ok: ok ? L('Setujui', 'Approve') : L('Tolak', 'Reject'), icon: ok ? 'check' : 'x',
          onOk: function (v) { var r = P.approvalDecide(c, id, ok, v.note); if (!r.ok) return r.msg; after(ok ? L('Disetujui dan diterapkan.', 'Approved and applied.') : L('Permintaan ditolak.', 'Request rejected.')); return true; } });
      }
    }
  };
  function ctxIsReq(c0, a) { return c0 && a.by === c0.uid; }

  /* ================= §81 · AUD-PERF-001 Performance Audit Trail ================= */
  var EXPLAIN = [['health', 'Business Health'], ['fin', 'Financial Health'], ['xscore', 'XScore'], ['team:rcv', 'Teamwork · Receiving'], ['person:EMP-001', 'Personal · Made Wirana']];
  V['AUD-PERF-001'] = {
    render: function (c) {
      var tab = c.q.tab === 'calc' ? 'calc' : 'log';
      var head = A.pageHead(null, t(L('Perubahan goal, KPI, target, bobot, formula, koreksi aktual, scorecard, race, issue, reflection, strategi, keputusan dan persetujuan.', 'Changes to goals, KPIs, targets, weights, formulas, actual adjustments, scorecards, races, issues, reflection, strategy, decisions and approvals.'))) +
        tabs([['log', L('Perubahan', 'Changes'), 'history'], ['calc', L('Perhitungan skor', 'Score calculations'), 'percent']], tab, 'tab', { def: 'log' });
      if (tab === 'calc') {
        var k = c.q.k || 'health', e = P.explain(k);
        if (k.indexOf('person:') === 0 && !P.canSeePerson(cx(), k.split(':')[1])) e = null;
        return head + tabs(EXPLAIN.filter(function (x) { return x[0].indexOf('person:') < 0 || P.canSeePerson(cx(), x[0].split(':')[1]); }), k, 'k', { seg: true, def: 'health', label: L('Skor', 'Score') }) +
          (e ? card(L('Urai perhitungan', 'Calculation breakdown'), note(t(e.formula), 'percent') + '<div class="tblw"><table class="tbl dense"><thead><tr><th>' + t(L('Komponen', 'Component')) + '</th><th class="r">' + t(L('Skor', 'Score')) + '</th><th class="r">' + t(L('Bobot', 'Weight')) + '</th><th class="r">' + t(L('Tertimbang', 'Weighted')) + '</th><th>' + t(L('Sumber', 'Source')) + '</th></tr></thead><tbody>' +
            e.rows.map(function (r) { return '<tr><td>' + t(r.n) + (r.ver ? ' <small class="sub5">v' + r.ver + '</small>' : '') + '</td><td class="r num">' + sc1(r.v) + '</td><td class="r num">' + pct(r.w) + '</td><td class="r num"><b>' + sc1(r.wv) + '</b></td><td>' + (r.src && open(r.src) ? lnk(r.src, r.rec, esc(r.rec || r.src)) : esc(r.rec || '—')) + '</td></tr>'; }).join('') +
            '<tr class="em5"><td>' + t(L('Total', 'Total')) + '</td><td></td><td></td><td class="r num"><b>' + sc1(e.total) + '</b></td><td><small class="sub5">Σ ' + sc1(e.sum) + '</small></td></tr></tbody></table></div>', { icon: 'percent' }) : A.stateCard('noperm', L('Skor ini di luar cakupan Anda.', 'This score is outside your scope.')));
      }
      var obj = c.q.o || '', log = P.auditFilter(obj);
      return head + '<div class="aud5-f">' + tabs([['', L('Semua', 'All')]].concat(P.AUDIT_OBJECTS.map(function (o) { return [o[0], o[1]]; })), obj, 'o', { seg: true, def: '', label: L('Objek', 'Object') }) + '</div>' +
        card(L('Jejak audit', 'Audit trail'), log.length ? A.list(log.slice(0, 200), [
          { h: L('Waktu', 'When'), v: function (e) { return dtt(e.at); } }, { h: L('Siapa', 'Who'), v: function (e) { return esc(e.by); } },
          { h: L('Kejadian', 'Event'), v: function (e) { return '<b>' + t(P.EVENTS[e.ev] || e.ev) + '</b><small class="sub5">' + esc(e.target || '') + '</small>'; } },
          { h: L('Nilai lama → baru', 'Old → new'), v: function (e) { return e.from != null || e.to != null ? esc(e.from == null ? '—' : e.from) + ' → <b>' + esc(e.to == null ? '—' : e.to) + '</b>' : '—'; } },
          { h: L('Alasan', 'Reason'), v: function (e) { return esc(e.reason || '—'); } },
          { h: L('Persetujuan', 'Approval'), v: function (e) { return e.appr ? A.chip(e.appr.st === 'approved' ? 'ok' : e.appr.st === 'rejected' ? 'crit' : 'warn', e.appr.st === 'approved' ? L('Disetujui', 'Approved') : e.appr.st === 'rejected' ? L('Ditolak', 'Rejected') : L('Menunggu', 'Pending')) + (e.appr.name ? '<small class="sub5">' + esc(e.appr.name) + '</small>' : '') : '—'; } }
        ], function (e) { return { t: t(P.EVENTS[e.ev] || e.ev) + ' · ' + esc(e.target || ''), r: '', s: dtt(e.at) + ' · ' + esc(e.by) + (e.from != null || e.to != null ? ' · ' + esc(e.from == null ? '—' : e.from) + ' → ' + esc(e.to == null ? '—' : e.to) : '') + (e.reason ? ' · ' + esc(e.reason) : '') }; }, null, { dense: true })
          : A.empty(L('Belum ada perubahan tercatat untuk objek ini. Setiap simpan, setuju atau tolak akan muncul di sini.', 'No changes recorded for this object yet. Every save, approval or rejection appears here.')), { icon: 'history', count: log.length });
    }
  };

  /* §93 refresh button on every freshness chip */
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-fresh]'); if (!b) return;
    var r = P.refreshData(cx(), b.getAttribute('data-fresh')); if (r.ok) after(L('Data diperbarui.', 'Data refreshed.'));
  });
})();
