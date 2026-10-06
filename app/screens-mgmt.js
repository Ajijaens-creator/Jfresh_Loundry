/* JFRESH OS — screens: management homes, approvals, finance, commercial, reports,
   system and the client portal. Same 9 archetypes, different content. */
(function () {
  var A = window.JFAPP, C = window.JFOS, DB = window.JFDB, V = A.V, O = window.JFOPS;
  var T = A.T, L = A.L, t = A.t, esc = A.esc, ic = A.ic, can = A.can, fmt = A.fmt, href = A.href;
  function d() { return A.db(); }
  var DAY = 864e5;

  /* ---------- helpers ---------- */
  function inv(i) { var bal = i.amt - i.paid; return { bal: bal, st: bal <= 0 ? 'paid' : i.due < A.now() ? 'late' : i.paid > 0 ? 'part' : 'open' }; }
  var INV_ST = { paid: ['ok', L('Lunas', 'Paid'), 'checkc'], part: ['appr', L('Sebagian', 'Partial'), 'percent'], open: ['info', L('Terbuka', 'Open'), 'clock'], late: ['crit', L('Terlambat', 'Overdue'), 'alert'] };
  function invChip(i) { var x = INV_ST[inv(i).st]; return A.chip(x[0], x[1], x[2]); }
  function readyToBill() { return d().orders.filter(function (o) { return o.stage === 'done' && !o.billed; }); }
  function orderValue(o) { return Math.round((o.kg || o.estKg) * DB.RATES[o.type]); }
  function arBuckets() {
    var b = [0, 0, 0, 0];
    d().invoices.forEach(function (i) { var x = inv(i); if (x.bal <= 0) return; var age = (A.now() - i.due) / DAY; b[age <= 0 ? 0 : age <= 30 ? 1 : age <= 60 ? 2 : 3] += x.bal; });
    return b;
  }
  function sum(a, f) { return a.reduce(function (s, x) { return s + f(x); }, 0); }
  var fld = A.fld, numIn = A.numIn, selIn = A.selIn, txtIn = A.txtIn, val = A.val, setErr = A.setErr, errSummary = A.errSummary, actionBar = A.actionBar, infoGrid = A.infoGrid;
  function clientOpts(own) { return [['', L('Pilih', 'Choose')]].concat(DB.CLIENTS.filter(function (c) { return !own || c.id === own; }).map(function (c) { return [c.id, [c.n, c.n]]; })); }

  /* Generic T06 form: fields → validate → save once → success */
  function form(id, o) {
    V[id] = {
      render: function (ctx) {
        var fs = o.fields(ctx);
        return A.pageHead(null, o.sub ? o.sub(ctx) : '') + (o.top ? o.top(ctx) : '') +
          '<section class="card"><div class="fgrid f2">' + fs.map(function (f) {
            var input = f.type === 'num' ? numIn(f.k, f.v, f.unit, { int: f.int, step: f.step }) : f.type === 'sel' ? selIn(f.k, f.opts, f.v) : f.type === 'area' ? txtIn(f.k, f.v, f.ph, true)
              : f.type === 'ro' ? '<span class="fld-in ro">' + f.v + '</span>' : '<span class="fld-in"><input id="f-' + f.k + '" type="' + (f.type || 'text') + '" value="' + esc(f.v || '') + '" placeholder="' + t(f.ph || L('', '')) + '"' + (f.type === 'date' || f.type === 'time' ? '' : ' autocomplete="off"') + '></span>';
            return fld(f.k, f.l, input, { req: f.req, from: f.from, cls: f.wide ? 'span2' : '' });
          }).join('') + '</div></section>' + (o.below ? o.below(ctx) : '') +
          actionBar(A.btn('primary', o.cta, o.icon || 'check', { act: 'ok' }), A.btn('ghost', L('Batal', 'Cancel'), 'x', { go: A.parentOf(id) || A.R().nav[0].s }));
      },
      act: Object.assign({}, A.COMMON_ACT, {
        ok: function (el) {
          var ctx = { rec: A.S.rec, q: A.S.q, s: C.screen(id) }, fs = o.fields(ctx), v = {}, errs = [];
          fs.forEach(function (f) { if (f.type !== 'ro') { v[f.k] = val('f-' + f.k); setErr(f.k); } });
          fs.forEach(function (f) { if (f.type === 'ro') return; var e = f.req && !v[f.k] ? (f.reqMsg || ctx.s.v[0]) : f.check ? f.check(v[f.k], v) : null; if (e) { setErr(f.k, e); errs.push(e); } });
          errSummary(errs); if (errs.length) return;
          A.submit(id + ':' + (o.key ? o.key(v) : JSON.stringify(v)), el, function () { var r = o.save(v, ctx); A.success(r.msg || ctx.s.ok, r.next || null, r.back || { l: L('Kembali', 'Back'), go: A.parentOf(id) || A.R().nav[0].s }, r.extra || ''); });
        }
      })
    };
  }

  /* ---------- Generic T08 report ---------- */
  function report(id, o) {
    V[id] = {
      render: function (ctx) {
        var per = A.S.q.per || 'm';
        var bar = '<div class="fb">' + '<label class="fb-f"><span class="sr">' + t(L('Periode', 'Period')) + '</span><select data-f="per">' + [['d', L('Hari ini', 'Today')], ['w', L('7 hari', '7 days')], ['m', L('Bulan ini', 'This month')], ['q', L('Kuartal ini', 'This quarter')]].map(function (p) { return '<option value="' + p[0] + '"' + (per === p[0] ? ' selected' : '') + '>' + t(p[1]) + '</option>'; }).join('') + '</select></label>' +
          (o.clientFilter ? '<label class="fb-f"><span class="sr">' + t(L('Klien', 'Client')) + '</span><select data-f="cl"><option value="">' + t(L('Klien: Semua', 'Client: All')) + '</option>' + DB.CLIENTS.map(function (c) { return '<option value="' + c.id + '"' + (A.S.q.cl === c.id ? ' selected' : '') + '>' + esc(c.n) + '</option>'; }).join('') + '</select></label>' : '') +
          (can('rpt.export') ? '<button type="button" class="btn btn-ghost btn-sm" data-act="export">' + ic('download') + '<span>' + t(L('Export', 'Export')) + '</span></button>' : '') + '</div>';
        return A.pageHead(null, o.sub ? o.sub() : '', o.actions ? o.actions() : '') + bar + A.attn(o.kpis()) + (o.body ? o.body() : '') +
          (o.chart ? A.section(o.chart.t, '<div class="lazy" data-lazy="' + id + '"><div class="sk sk-block"></div></div>', { icon: 'chart' }) : '') + (o.table ? o.table() : '');
      },
      after: function () { if (o.chart) A.lazy(id, o.chart.fn); }
    };
  }

  /* ================= T01 homes (management + client) ================= */
  V['HOM-FIN-001'] = {
    render: function () {
      var rb = readyToBill(), open = d().invoices.filter(function (i) { return inv(i).bal > 0; }), late = open.filter(function (i) { return inv(i).st === 'late'; });
      var dueWeek = open.filter(function (i) { return i.due >= A.now() && i.due < A.now() + 7 * DAY; });
      var b = arBuckets();
      var byCl = {}; rb.forEach(function (o) { byCl[o.cl] = (byCl[o.cl] || 0) + orderValue(o); });
      return A.pageHead(L('Finance', 'Finance'), esc(fmt.date(A.now())), A.pbtn('fin.bill', 'primary', L('Buat Tagihan', 'Create Bills'), 'file', { go: 'FIN-BIL-001' }) + A.pbtn('fin.payment', 'ghost', L('Catat Pembayaran', 'Record Payment'), 'card', { go: 'FIN-PAY-001' })) +
        A.attn([
          { v: rb.length, k: L('Siap Ditagih', 'Ready to Bill'), icon: 'file', tone: rb.length ? 'warn' : 'ok', d: fmt.rpShort(sum(rb, orderValue)), go: 'FIN-BIL-001' },
          { v: open.length, k: L('Invoice Terbuka', 'Open Invoices'), icon: 'invoice', tone: 'info', d: fmt.rpShort(sum(open, function (i) { return inv(i).bal; })), go: 'FIN-INV-001' },
          { v: dueWeek.length, k: L('Jatuh Tempo Minggu Ini', 'Due This Week'), icon: 'calendar', tone: dueWeek.length ? 'warn' : 'ok', go: 'FIN-INV-001', qs: { st: 'open' } },
          { v: late.length, k: L('Terlambat Bayar', 'Overdue'), icon: 'alert', tone: late.length ? 'crit' : 'ok', d: fmt.rpShort(sum(late, function (i) { return inv(i).bal; })), go: 'FIN-INV-001', qs: { st: 'late' } }
        ].map(function (x) { if (x.qs) { x.qs = x.qs; } return x; })) +
        '<div class="grid2">' +
        A.section(L('Siap Ditagih per Klien', 'Ready to Bill by Client'), Object.keys(byCl).length ? A.hbars(Object.keys(byCl).map(function (k) { return { l: [A.cname(k), A.cname(k)], v: byCl[k], go: 'FIN-BIL-001' }; }), { fmt: fmt.rpShort }) : A.empty(L('Tidak ada yang perlu ditagih.', 'Nothing to bill.')), { icon: 'file', link: ['FIN-BIL-001', L('Billing', 'Billing')] }) +
        A.section(L('Umur Piutang', 'Receivable Age'), A.hbars([{ l: L('Belum jatuh tempo', 'Not yet due'), v: b[0] }, { l: L('1–30 hari', '1–30 days'), v: b[1] }, { l: L('31–60 hari', '31–60 days'), v: b[2] }, { l: L('> 60 hari', '> 60 days'), v: b[3], hi: b[3] > 0 }].map(function (x) { x.go = 'FIN-AR-001'; return x; }), { fmt: fmt.rpShort }), { icon: 'coins', link: ['FIN-AR-001', L('Piutang', 'AR')] }) +
        '</div>' + A.section(L('Pembayaran Terbaru', 'Latest Payments'), '<div class="rls">' + d().payments.slice(0, 4).map(function (p) { return A.rowLink({ href: href('FIN-INV-002', p.inv), icon: 'card', t: esc(A.cname(p.cl)) + ' · ' + esc(fmt.rp(p.amt)), s: esc(p.inv + ' · ' + p.method + ' · ' + fmt.when(p.at)) }); }).join('') + '</div>', { icon: 'card', link: ['FIN-PAY-002', L('Semua', 'All')] });
    }
  };
  V['HOM-SAL-001'] = {
    render: function () {
      var soon = d().contracts.filter(function (c) { return c.end - A.now() <= 60 * DAY; }).sort(function (a, b) { return a.end - b.end; });
      var comp = d().issues.filter(function (i) { return i.src === 'client' && i.status !== 'closed'; });
      var pend = d().docs.filter(function (x) { return x.status === 'pending'; });
      return A.pageHead(L('Akun Saya', 'My Accounts'), esc(A.R().person), A.pbtn('com.renewal', 'primary', L('Lihat Renewal', 'View Renewals'), 'refresh', { go: 'COM-RNW-001' }) + A.pbtn('com.client.edit', 'ghost', L('Tambah Klien', 'Add Client'), 'plus', { go: 'COM-CLI-002' })) +
        A.attn([
          { v: DB.CLIENTS.length, k: L('Klien Aktif', 'Active Clients'), icon: 'users', tone: 'info', go: 'COM-CLI-001' },
          { v: soon.length, k: L('Kontrak Habis ≤ 60 Hari', 'Contracts Ending ≤ 60 Days'), icon: 'contract', tone: soon.length ? 'warn' : 'ok', go: 'COM-RNW-001' },
          { v: 1, k: L('Klien di Bawah Target SLA', 'Clients Below SLA'), icon: 'clock', tone: 'warn', go: 'COM-SLA-001' },
          { v: comp.length, k: L('Komplain Terbuka', 'Open Complaints'), icon: 'message', tone: comp.length ? 'warn' : 'ok' }
        ]) + '<div class="grid2">' +
        A.section(L('Renewal Mendatang', 'Upcoming Renewals'), '<div class="rls">' + soon.map(function (c) { var dl = Math.ceil((c.end - A.now()) / DAY); return A.rowLink({ href: href('COM-RNW-001'), icon: 'contract', t: esc(A.cname(c.cl)), s: esc(c.id) + ' · ' + fmt.rpShort(c.rev) + '/' + T(L('bln', 'mo')), chip: A.chip(dl <= 30 ? 'crit' : 'warn', L(dl + ' hari', dl + ' days'), 'calendar'), tone: dl <= 30 ? 'crit' : 'warn' }); }).join('') + '</div>', { icon: 'refresh' }) +
        A.section(L('Dokumen Menunggu', 'Pending Documents'), '<div class="rls">' + pend.map(function (x) { return A.rowLink({ href: href('COM-DOC-001'), icon: 'file', t: esc(x.n), s: esc(A.cname(x.cl)) + ' · ' + esc(fmt.date(x.at)) }); }).join('') + '</div>', { icon: 'file' }) + '</div>';
    }
  };
  var REV = [1.31, 1.36, 1.29, 1.42, 1.47, 1.44, 1.52, 1.58, 1.55, 1.61];
  var MONTHS = [['Jan', 'Jan'], ['Feb', 'Feb'], ['Mar', 'Mar'], ['Apr', 'Apr'], ['Mei', 'May'], ['Jun', 'Jun'], ['Jul', 'Jul'], ['Agu', 'Aug'], ['Sep', 'Sep'], ['Okt', 'Oct']];
  function clientPerf() {
    return DB.CLIENTS.map(function (c, i) {
      var os = d().orders.filter(function (o) { return o.cl === c.id; }), done = os.filter(function (o) { return o.stage === 'done'; });
      var ot = done.length ? done.filter(function (o) { return o.deliveredAt <= o.dueAt; }).length / done.length * 100 : 100;
      var ar = sum(d().invoices.filter(function (x) { return x.cl === c.id; }), function (x) { return inv(x).bal; });
      var ctr = d().contracts.filter(function (x) { return x.cl === c.id; })[0];
      return { c: c, kg: sum(os, function (o) { return o.kg || o.estKg; }) * 9, ot: ot, rew: [1.2, 2.8, 0.9, 3.6, 1.8, 0.5][i], ar: ar, rev: ctr ? ctr.rev : 0, comp: d().issues.filter(function (x) { return x.src === 'client' && DB.order(x.ord).cl === c.id; }).length };
    }).sort(function (a, b) { return b.rev - a.rev; });
  }
  V['HOM-EXE-001'] = {
    render: function () {
      var b = arBuckets(), ar = b[0] + b[1] + b[2] + b[3];
      return A.pageHead(L('Executive', 'Executive'), t(L('Bulan berjalan', 'Month to date')) + ' · ' + esc(fmt.date(A.now())), A.pbtn('apr.view', 'primary', L('Buka Persetujuan', 'Open Approvals'), 'filecheck', { go: 'APR-INB-001' }) + A.pbtn('rpt.exec', 'ghost', L('Lihat Laporan', 'View Reports'), 'chart', { go: 'RPT-LIB-001' })) +
        A.attn([
          { v: 'Rp 1,61', u: T(L('M', 'B')), k: L('Revenue', 'Revenue'), icon: 'coins', tone: 'info', d: '+3,9%', dt: 'up', go: 'RPT-COM-001' },
          { v: fmt.num(36.4, 1), u: T(L('ton', 'tons')), k: L('Volume', 'Volume'), icon: 'weight', tone: 'info', d: '+2,1%', dt: 'up', go: 'RPT-OPS-001' },
          { v: fmt.num(A.onTime(), 1) + '%', k: L('On-time SLA', 'On-time SLA'), icon: 'clock', tone: A.onTime() < 95 ? 'warn' : 'ok', go: 'RPT-OPS-001' },
          { v: '97,8%', k: L('Quality (QC lulus)', 'Quality (QC pass)'), icon: 'shield', tone: 'ok', go: 'QLT-DSH-001' },
          { v: fmt.rpShort(ar), k: L('Piutang', 'Outstanding AR'), icon: 'invoice', tone: b[3] ? 'warn' : 'info', d: b[3] ? T(L('> 60 hari: ', '> 60 days: ')) + fmt.rpShort(b[3]) : '', dt: 'dn', go: 'RPT-FIN-001' },
          { v: '18,6%', k: L('Profitabilitas', 'Profitability'), icon: 'percent', tone: 'info', d: '+0,8 pt', dt: 'up', go: 'RPT-FIN-001' }
        ]) +
        '<div class="grid2">' + A.section(L('Alert', 'Alerts'), A.alertList(A.alerts()), { icon: 'bell' }) +
        A.section(L('Tren Revenue (Rp miliar)', 'Revenue Trend (Rp billion)'), '<div class="lazy" data-lazy="rev"></div>', { icon: 'trend', link: ['RPT-COM-001', L('Detail', 'Detail')] }) + '</div>' +
        A.section(L('Performa Klien', 'Client Performance'), A.list(clientPerf().slice(0, 5), [
          { h: L('Klien', 'Client'), v: function (r) { return '<b>' + esc(r.c.n) + '</b>'; } },
          { h: L('Revenue/bln', 'Revenue/mo'), cls: 'r', v: function (r) { return '<span class="num">' + fmt.rpShort(r.rev) + '</span>'; } },
          { h: L('On-time', 'On-time'), cls: 'r', v: function (r) { return '<span class="num">' + fmt.num(r.ot, 0) + '%</span>'; } },
          { h: L('Rewash', 'Rewash'), cls: 'r', v: function (r) { return '<span class="num">' + fmt.num(r.rew, 1) + '%</span>'; } },
          { h: L('Piutang', 'AR'), cls: 'r', v: function (r) { return '<span class="num">' + fmt.rpShort(r.ar) + '</span>'; } }
        ], function (r) { return { t: esc(r.c.n), r: fmt.rpShort(r.rev), s: 'On-time ' + fmt.num(r.ot, 0) + '% · Rewash ' + fmt.num(r.rew, 1) + '%' }; }, function () { return href('RPT-CLI-001'); }), { icon: 'hotel', link: ['RPT-CLI-001', L('Semua klien', 'All clients')] });
    },
    after: function () { A.lazy('rev', function () { return A.lineChart([{ n: L('Revenue', 'Revenue'), v: REV }], MONTHS.map(function (m) { return T(m); }), { min: 1.2, max: 1.7, fmt: function (v) { return 'Rp ' + fmt.num(v, 2) + T(L(' M', ' B')); }, fmtAx: function (v) { return fmt.num(v, 1); }, label: 'Revenue' }); }); }
  };

  /* Client portal home: own data only, simplified stages */
  function cltOrders() { var me = A.R().clientId || 'CL-01'; return d().orders.filter(function (o) { return o.cl === me; }); }
  var CSTAGE = [{ k: ['pickup'], l: L('Dijemput', 'Collected'), i: 'truck' }, { k: ['receive', 'sort', 'wash', 'qc', 'pack'], l: L('Dicuci', 'Washing'), i: 'washer' }, { k: ['deliver'], l: L('Dikirim', 'Delivering'), i: 'package' }, { k: ['done'], l: L('Diterima', 'Received'), i: 'checkc' }];
  function cIdx(o) { for (var i = 0; i < CSTAGE.length; i++) if (CSTAGE[i].k.indexOf(o.stage) >= 0) return i; return 0; }
  function cTrack(o, compact) { var i0 = cIdx(o); return '<ol class="stp' + (compact ? ' stp-c' : '') + ' stp4">' + CSTAGE.map(function (s, i) { return '<li class="' + (i < i0 ? 'done' : i === i0 ? 'now' : '') + '"><span class="stp-n">' + (i < i0 ? ic('check') : ic(s.i)) + '</span><span class="stp-l">' + t(s.l) + '</span></li>'; }).join('') + '</ol>'; }
  function cChip(o) { var s = CSTAGE[cIdx(o)]; return A.chip(o.stage === 'done' ? 'ok' : 'info', s.l, s.i); }
  V['HOM-CLT-001'] = {
    render: function () {
      var os = cltOrders(), act = os.filter(function (o) { return o.stage !== 'done'; }).sort(function (a, b) { return a.dueAt - b.dueAt; });
      var nextD = act.filter(function (o) { return o.stage === 'deliver'; })[0] || act[0];
      var my = A.R().clientId, invs = d().invoices.filter(function (i) { return i.cl === my && inv(i).bal > 0; });
      return '<div class="hello"><h1>' + esc(DB.client(my).n) + '</h1><p>' + t(L('Status layanan laundry Anda hari ini', 'Your laundry service today')) + '</p></div>' +
        A.attn([
          { v: act.length, k: L('Pesanan Berjalan', 'Orders in Progress'), icon: 'washer', tone: 'info', go: 'CLT-ORD-001' },
          { v: nextD ? fmt.time(nextD.deliverAt) : '—', k: L('Pengiriman Berikutnya', 'Next Delivery'), icon: 'truck', tone: 'info', go: 'CLT-DLV-001' },
          { v: invs.length, k: L('Invoice Belum Dibayar', 'Unpaid Invoices'), icon: 'invoice', tone: invs.some(function (i) { return inv(i).st === 'late'; }) ? 'warn' : 'info', go: 'CLT-INV-001' },
          { v: '96%', k: L('SLA Bulan Ini', 'SLA This Month'), icon: 'clock', tone: 'ok' }
        ]) +
        '<a class="cta" href="' + href('CLT-PKP-001') + '"><span class="cta-ic">' + ic('truck') + '</span><span class="cta-t"><b>' + t(L('Minta Pickup', 'Request Pickup')) + '</b><small>' + t(L('Di luar jadwal rutin', 'Outside the regular schedule')) + '</small></span>' + ic('arrow') + '</a>' +
        A.section(L('Pesanan Aktif', 'Active Orders'), act.length ? '<div class="corders">' + act.slice(0, 4).map(function (o) {
          return '<a class="co" href="' + href('CLT-ORD-002', o.id) + '"><span class="co-h"><b>#' + esc(o.id) + '</b>' + cChip(o) + '</span><span class="co-m">' + esc(fmt.kg(o.kg || o.estKg)) + ' · ' + o.bags + ' bag · ' + t(A.typeL(o.type)) + '</span>' + cTrack(o, true) + '<span class="co-f">' + t(L('Perkiraan tiba', 'Estimated arrival')) + ' <b>' + esc(fmt.when(o.deliverAt)) + '</b></span></a>';
        }).join('') + '</div>' : A.empty(C.screen('HOM-CLT-001').emp), { icon: 'list', link: ['CLT-ORD-001', L('Semua', 'All')] });
    }
  };

  /* ================= T07 Approvals ================= */
  var APR_T = { weight: [L('Selisih berat', 'Weight difference'), 'scale'], rate: [L('Perubahan harga', 'Price change'), 'tag'], cn: [L('Credit note', 'Credit note'), 'filecheck'], claim: [L('Klaim', 'Claim'), 'alert'], stock: [L('Penyesuaian stok', 'Stock adjustment'), 'package'], invfix: [L('Koreksi invoice', 'Invoice correction'), 'invoice'] };
  V['APR-INB-001'] = {
    render: function () {
      var tab = A.S.q.tab || 'wait';
      var mine = d().approvals.filter(function (a) { return can(a.perm); });
      var rows = mine.filter(function (a) { return a.status === tab; });
      var n = function (s) { return mine.filter(function (a) { return a.status === s; }).length; };
      return A.pageHead(null, t(L(n('wait') + ' menunggu keputusan Anda', n('wait') + ' waiting for your decision'))) +
        '<div class="tabs">' + [['wait', L('Menunggu', 'Waiting')], ['ok', L('Disetujui', 'Approved')], ['no', L('Ditolak', 'Rejected')]].map(function (x) { return '<a href="' + href('APR-INB-001', null, { tab: x[0] }) + '" aria-selected="' + (tab === x[0]) + '">' + t(x[1]) + ' <b>' + n(x[0]) + '</b></a>'; }).join('') + '</div>' +
        (rows.length ? '<div class="aprs">' + rows.map(function (a) {
          var ty = APR_T[a.type], own = a.by === A.R().person;
          return '<article class="apr" id="apr-' + a.id + '"><div class="apr-h"><span class="apr-ic">' + ic(ty[1]) + '</span><span><b>' + t(ty[0]) + '</b><small>' + esc(a.ref) + '</small></span><span class="apr-w">' + esc(a.by) + ' · ' + esc(fmt.ago(a.at)) + '</span></div>' +
            '<div class="apr-v"><span class="old">' + esc(a.from) + '</span>' + ic('arrow') + '<span class="new">' + esc(a.to) + '</span></div><p class="apr-r">' + ic('message') + t(a.why) + '</p>' +
            (a.status === 'wait' ? (own ? '<p class="hint">' + ic('lock') + t(L('Pengajuan Anda sendiri. Harus disetujui orang lain.', 'Your own request. Someone else must approve it.')) + '</p>' :
              '<div class="apr-n" hidden>' + fld('n-' + a.id, L('Alasan penolakan', 'Rejection reason'), '<span class="fld-in"><textarea id="f-n-' + a.id + '" rows="2"></textarea></span>', { req: true }) + '</div>' +
              '<div class="apr-a">' + A.btn('primary', L('Setujui', 'Approve'), 'checkc', { act: 'ok', val: a.id }) + A.btn('outline', L('Tolak', 'Reject'), 'xc', { act: 'no', val: a.id }) + '</div>')
              : '<p class="hint">' + (a.status === 'ok' ? A.chip('ok', L('Disetujui', 'Approved'), 'checkc') : A.chip('crit', L('Ditolak', 'Rejected'), 'xc')) + ' ' + esc(a.dec || '') + (a.note ? ' · ' + esc(a.note) : '') + '</p>') + '</article>';
        }).join('') + '</div>' : A.empty(tab === 'wait' ? C.screen('APR-INB-001').emp : L('Belum ada.', 'None yet.')));
    },
    act: {
      ok: function (el) { decideApr(el, el.getAttribute('data-val'), true); },
      no: function (el) {
        var id = el.getAttribute('data-val'), box = document.querySelector('#apr-' + id + ' .apr-n');
        if (box.hidden) { box.hidden = false; document.getElementById('f-n-' + id).focus(); el.querySelector('span').textContent = T(L('Kirim Penolakan', 'Send Rejection')); return; }
        var note = val('f-n-' + id);
        if (!note) { setErr('n-' + id, C.screen('APR-INB-001').v[0]); return; }
        decideApr(el, id, false, note);
      }
    }
  };
  function decideApr(el, id, ok, note) {
    var a = d().approvals.filter(function (x) { return x.id === id; })[0];
    if (!a || !can(a.perm) || a.by === A.R().person) return;
    A.submit('apr:' + id, el, function () {
      a.status = ok ? 'ok' : 'no'; a.dec = A.R().person; a.note = note || '';
      A.audit('APR.DECISION', a.id + ' · ' + a.ref, 'Menunggu', ok ? 'Disetujui' : 'Ditolak: ' + note);
      if (ok) {
        if (a.type === 'rate') A.audit('PRICE.CHANGE', a.ref, a.from, a.to);
        if (a.type === 'stock') { var s = d().stock.filter(function (x) { return a.ref.indexOf(x.n.split(' ')[0]) === 0; })[0]; if (s) { var prev = s.qty; s.qty = parseInt(a.to, 10); A.audit('STK.ADJUST', s.n, prev, s.qty); } }
        if (a.type === 'cn') { var cn = d().cns.filter(function (x) { return a.ref.indexOf(x.id) === 0; })[0]; if (cn) cn.status = 'ok'; A.audit('BILL.CHANGE', a.ref, a.from, a.to); }
        if (a.type === 'invfix') { var iv = DB.invoice(a.ref.split(' ')[0]); if (iv) { var p = iv.amt; iv.amt = parseInt(a.to.replace(/\D/g, ''), 10); A.audit('BILL.CHANGE', iv.id, fmt.rp(p), fmt.rp(iv.amt)); } }
        if (a.type === 'weight') { var is = d().issues.filter(function (x) { return x.ord === a.ref && x.reason === 'qty'; })[0]; if (is) is.status = 'closed'; }
      } else if (a.type === 'cn') { var cn2 = d().cns.filter(function (x) { return a.ref.indexOf(x.id) === 0; })[0]; if (cn2) cn2.status = 'no'; }
      A.toast(ok ? L('Disetujui. Pengaju diberi tahu.', 'Approved. Requester notified.') : L('Ditolak. Pengaju diberi tahu.', 'Rejected. Requester notified.'));
      A.rerender();
    });
  }

  /* ================= Reports & monitors (T08) ================= */
  report('SLA-MON-001', {
    sub: function () { return t(L('Berisiko = sisa SLA ≤ 1 jam · Terlambat = lewat SLA', 'At risk = ≤ 1 h SLA left · Late = past SLA')); },
    kpis: function () {
      var act = O.active(), late = act.filter(function (o) { return o.dueAt < A.now(); }), risk = act.filter(function (o) { return o.dueAt >= A.now() && O.urgent(o); });
      return [{ v: fmt.num(A.onTime(), 1) + '%', k: L('On-time (selesai)', 'On-time (delivered)'), icon: 'checkc', tone: A.onTime() < 95 ? 'warn' : 'ok' }, { v: act.length - late.length - risk.length, k: L('Aman', 'Safe'), icon: 'clock', tone: 'ok' }, { v: risk.length, k: L('Berisiko', 'At Risk'), icon: 'clock', tone: risk.length ? 'warn' : 'ok' }, { v: late.length, k: L('Terlambat', 'Late'), icon: 'alert', tone: late.length ? 'crit' : 'ok' }];
    },
    body: function () {
      var rows = O.active().filter(O.urgent).sort(O.bySla);
      return A.section(L('Order Berisiko & Terlambat', 'At-risk & Late Orders'), rows.length ? '<div class="qcs">' + rows.map(function (o) { return A.qcard(o, 'OPS-TRK-001'); }).join('') + '</div>' : A.empty(C.screen('SLA-MON-001').emp), { icon: 'alert', count: rows.length });
    },
    chart: { t: L('On-time SLA 14 hari (%)', '14-day On-time SLA (%)'), fn: function () { var s = A.series14(95, 2.2, 1); return A.lineChart([{ n: L('On-time', 'On-time'), v: s.map(function (x) { return Math.min(100, x.v); }) }], s.map(function (x) { return x.l; }), { min: 88, max: 100, target: 95, fmt: function (v) { return fmt.num(v, 0) + '%'; }, label: 'SLA' }); } }
  });
  report('RPT-OPS-001', {
    clientFilter: true, sub: function () { return t(L('Volume, throughput, SLA dan rewash', 'Volume, throughput, SLA and rewash')); },
    kpis: function () { return [{ v: fmt.num(36.4, 1), u: 'ton', k: L('Volume', 'Volume'), icon: 'weight', tone: 'info', d: '+2,1%', dt: 'up' }, { v: fmt.num(A.onTime(), 1) + '%', k: L('On-time', 'On-time'), icon: 'clock', tone: 'ok' }, { v: '2,2%', k: L('Rewash', 'Rewash'), icon: 'refresh', tone: 'ok' }, { v: '86', u: 'kg/j', k: L('Throughput', 'Throughput'), icon: 'factory', tone: 'info' }]; },
    chart: { t: L('Volume harian (kg)', 'Daily volume (kg)'), fn: function () { var s = A.series14(1180, 120, 2); s[s.length - 1].hi = true; return A.barChart(s, { label: 'Volume', fmt: function (v) { return fmt.num(v, 0) + ' kg'; } }); } },
    table: function () { return A.section(L('Per Klien', 'By Client'), A.list(clientPerf(), [{ h: L('Klien', 'Client'), v: function (r) { return '<b>' + esc(r.c.n) + '</b>'; } }, { h: L('Volume', 'Volume'), cls: 'r', v: function (r) { return '<span class="num">' + fmt.kg(Math.round(r.kg)) + '</span>'; } }, { h: L('On-time', 'On-time'), cls: 'r', v: function (r) { return '<span class="num">' + fmt.num(r.ot, 0) + '%</span>'; } }, { h: L('Rewash', 'Rewash'), cls: 'r', v: function (r) { return '<span class="num">' + fmt.num(r.rew, 1) + '%</span>'; } }], function (r) { return { t: esc(r.c.n), r: fmt.kg(Math.round(r.kg)), s: 'On-time ' + fmt.num(r.ot, 0) + '% · Rewash ' + fmt.num(r.rew, 1) + '%' }; }), { icon: 'hotel' }); }
  });
  report('PRD-DSH-001', {
    sub: function () { return t(L('Kapasitas & mesin', 'Capacity & machines')); },
    kpis: function () { return [{ v: fmt.num(1240, 0), u: 'kg', k: L('Kg Hari Ini', 'Kg Today'), icon: 'weight', tone: 'info' }, { v: '78%', k: L('Utilisasi Mesin', 'Machine Utilisation'), icon: 'washer', tone: 'info' }, { v: O.orders('wash').length + O.orders('sort').length, k: L('Antrian Produksi', 'Production Queue'), icon: 'hourglass', tone: 'info' }, { v: O.orders('wash').filter(function (o) { return o.rewash; }).length, k: L('Rewash di Antrian', 'Rewash in Queue'), icon: 'refresh', tone: 'warn' }]; },
    body: function () { return A.section(L('Utilisasi per Mesin', 'Utilisation by Machine'), A.hbars([['Washer 1 (60 kg)', 82], ['Washer 2 (60 kg)', 91], ['Washer 3 (30 kg)', 64], ['Washer 4 (30 kg)', 73], ['Washer 5 (100 kg)', 58], ['Dryer 1', 88], ['Ironer', 79]].map(function (m) { return { l: [m[0], m[0]], v: m[1], hi: m[1] > 90 }; }), { fmt: function (v) { return v + '%'; } }), { icon: 'washer' }); },
    chart: { t: L('Throughput per jam (kg)', 'Throughput per hour (kg)'), fn: function () { return A.barChart(['06', '07', '08', '09', '10', '11', '12', '13', '14', '15'].map(function (h, i) { return { l: h + ':00', v: [40, 96, 128, 142, 150, 138, 90, 120, 146, 131][i] }; }), { label: 'Throughput', fmt: function (v) { return v + ' kg'; } }); } }
  });
  report('QLT-DSH-001', {
    clientFilter: true, sub: function () { return t(L('QC, rewash, komplain dan klaim', 'QC, rewash, complaints and claims')); },
    actions: function () { return A.pbtn('qlt.review', 'primary', L('Lihat Masalah', 'View Issues'), 'alert', { go: 'QLT-ISS-001' }); },
    kpis: function () { var op = d().issues.filter(function (i) { return i.status !== 'closed'; }); return [{ v: '97,8%', k: L('QC Lulus', 'QC Pass'), icon: 'checkc', tone: 'ok' }, { v: '2,2%', k: L('Rewash', 'Rewash'), icon: 'refresh', tone: 'ok' }, { v: d().issues.filter(function (i) { return i.src === 'client'; }).length, k: L('Komplain', 'Complaints'), icon: 'message', tone: 'warn' }, { v: d().approvals.filter(function (a) { return a.type === 'claim'; }).length, k: L('Klaim', 'Claims'), icon: 'filecheck', tone: 'info' }, { v: op.length, k: L('Masalah Terbuka', 'Open Issues'), icon: 'alert', tone: op.length ? 'warn' : 'ok', go: can('qlt.view') ? 'QLT-ISS-001' : null }]; },
    body: function () { var cnt = {}; d().issues.forEach(function (i) { cnt[i.reason] = (cnt[i.reason] || 0) + 1; }); return A.section(L('Alasan Terbanyak (30 hari)', 'Top Reasons (30 days)'), A.hbars(C.ISSUE_REASONS.map(function (r, i) { return { l: r.l, v: (cnt[r.k] || 0) + [6, 3, 2, 4, 1, 3, 1, 1][i] }; }).sort(function (a, b) { return b.v - a.v; })), { icon: 'alert' }); },
    chart: { t: L('Rewash rate 14 hari (%)', '14-day rewash rate (%)'), fn: function () { var s = A.series14(22, 6, 3); return A.lineChart([{ n: L('Rewash', 'Rewash'), v: s.map(function (x) { return x.v / 10; }) }], s.map(function (x) { return x.l; }), { min: 0, max: 4, target: 3, fmt: function (v) { return fmt.num(v, 1) + '%'; }, label: 'Rewash' }); } }
  });
  report('FIN-AR-001', {
    clientFilter: false, sub: function () { return t(L('Umur piutang per klien', 'Receivable age by client')); },
    kpis: function () { var b = arBuckets(); return [{ v: fmt.rpShort(b[0] + b[1] + b[2] + b[3]), k: L('Total Piutang', 'Total AR'), icon: 'coins', tone: 'info' }, { v: fmt.rpShort(b[0]), k: L('Belum Jatuh Tempo', 'Not Due'), icon: 'clock', tone: 'ok' }, { v: fmt.rpShort(b[1] + b[2]), k: L('1–60 Hari', '1–60 Days'), icon: 'hourglass', tone: 'warn' }, { v: fmt.rpShort(b[3]), k: L('> 60 Hari', '> 60 Days'), icon: 'alert', tone: b[3] ? 'crit' : 'ok' }]; },
    table: function () {
      var rows = DB.CLIENTS.map(function (c) { var is = d().invoices.filter(function (i) { return i.cl === c.id && inv(i).bal > 0; }); return { c: c, n: is.length, bal: sum(is, function (i) { return inv(i).bal; }), oldest: is.length ? Math.max.apply(null, is.map(function (i) { return (A.now() - i.due) / DAY; })) : null }; }).filter(function (r) { return r.bal > 0; }).sort(function (a, b) { return b.bal - a.bal; });
      return A.section(L('Saldo per Klien', 'Balance by Client'), A.list(rows, [{ h: L('Klien', 'Client'), v: function (r) { return '<b>' + esc(r.c.n) + '</b>'; } }, { h: L('Invoice', 'Invoices'), cls: 'r', v: function (r) { return '<span class="num">' + r.n + '</span>'; } }, { h: L('Saldo', 'Balance'), cls: 'r', v: function (r) { return '<span class="num">' + fmt.rp(r.bal) + '</span>'; } }, { h: L('Tertua', 'Oldest'), v: function (r) { return r.oldest > 0 ? A.chip(r.oldest > 60 ? 'crit' : 'warn', L(Math.round(r.oldest) + ' hari lewat', Math.round(r.oldest) + ' days overdue'), 'alert') : A.chip('ok', L('Belum jatuh tempo', 'Not due'), 'clock'); } }],
        function (r) { return { t: esc(r.c.n), r: fmt.rpShort(r.bal), s: r.n + ' invoice', chip: r.oldest > 0 ? A.chip(r.oldest > 60 ? 'crit' : 'warn', L(Math.round(r.oldest) + ' hari lewat', Math.round(r.oldest) + ' days overdue'), 'alert') : '' }; }, function (r) { return href('FIN-INV-001', null, { cl: r.c.id }); }), { icon: 'coins' });
    }
  });
  report('RPT-FIN-001', {
    clientFilter: true, sub: function () { return t(L('Revenue, penagihan, piutang dan margin', 'Revenue, collection, receivables and margin')); },
    kpis: function () { var b = arBuckets(); return [{ v: 'Rp 1,61', u: T(L('M', 'B')), k: L('Revenue', 'Revenue'), icon: 'coins', tone: 'info', d: '+3,9%', dt: 'up' }, { v: '92%', k: L('Tertagih', 'Collected'), icon: 'checkc', tone: 'ok' }, { v: fmt.rpShort(b[0] + b[1] + b[2] + b[3]), k: L('Piutang', 'AR'), icon: 'invoice', tone: 'info' }, { v: '18,6%', k: L('Margin', 'Margin'), icon: 'percent', tone: 'info' }]; },
    chart: { t: L('Revenue bulanan (Rp miliar)', 'Monthly revenue (Rp billion)'), fn: function () { return A.barChart(MONTHS.map(function (m, i) { return { l: T(m), v: REV[i], hi: i === MONTHS.length - 1 }; }), { label: 'Revenue', fmt: function (v) { return 'Rp ' + fmt.num(v, 2) + T(L(' M', ' B')); }, fmtAx: function (v) { return fmt.num(v, 1); } }); } }
  });
  report('RPT-COM-001', {
    sub: function () { return t(L('Revenue per klien & kontrak', 'Revenue by client & contract')); },
    kpis: function () { return [{ v: 'Rp 1,61', u: T(L('M', 'B')), k: L('Revenue', 'Revenue'), icon: 'coins', tone: 'info' }, { v: DB.CLIENTS.length, k: L('Klien Aktif', 'Active Clients'), icon: 'users', tone: 'info' }, { v: d().contracts.filter(function (c) { return c.end - A.now() <= 60 * DAY; }).length, k: L('Renewal ≤ 60 Hari', 'Renewals ≤ 60 Days'), icon: 'refresh', tone: 'warn' }, { v: 'Rp 15.100', k: L('Rata-rata / kg', 'Average / kg'), icon: 'tag', tone: 'info' }]; },
    body: function () { return A.section(L('Revenue per Klien (bulanan)', 'Revenue by Client (monthly)'), A.hbars(clientPerf().map(function (r) { return { l: [r.c.n, r.c.n], v: r.rev }; }), { fmt: fmt.rpShort }), { icon: 'hotel' }); },
    chart: { t: L('Tren revenue (Rp miliar)', 'Revenue trend (Rp billion)'), fn: function () { return A.lineChart([{ n: L('Revenue', 'Revenue'), v: REV }], MONTHS.map(function (m) { return T(m); }), { min: 1.2, max: 1.7, fmt: function (v) { return 'Rp ' + fmt.num(v, 2); }, fmtAx: function (v) { return fmt.num(v, 1); } }); } }
  });
  report('RPT-CLI-001', {
    sub: function () { return t(L('Volume, SLA, kualitas dan piutang per klien', 'Volume, SLA, quality and AR by client')); },
    kpis: function () { var cp = clientPerf(); return [{ v: cp.length, k: L('Klien Aktif', 'Active Clients'), icon: 'users', tone: 'info' }, { v: fmt.num(sum(cp, function (r) { return r.ot; }) / cp.length, 0) + '%', k: L('SLA Rata-rata', 'Avg SLA'), icon: 'clock', tone: 'ok' }, { v: sum(cp, function (r) { return r.comp; }), k: L('Komplain', 'Complaints'), icon: 'message', tone: 'warn' }]; },
    table: function () { return A.section(L('Semua Klien', 'All Clients'), A.list(clientPerf(), [{ h: L('Klien', 'Client'), v: function (r) { return '<b>' + esc(r.c.n) + '</b><small class="sub">' + esc(r.c.type) + '</small>'; } }, { h: L('Revenue/bln', 'Revenue/mo'), cls: 'r', v: function (r) { return '<span class="num">' + fmt.rpShort(r.rev) + '</span>'; } }, { h: L('On-time', 'On-time'), cls: 'r', v: function (r) { return '<span class="num">' + fmt.num(r.ot, 0) + '%</span>'; } }, { h: L('Rewash', 'Rewash'), cls: 'r', v: function (r) { return '<span class="num">' + fmt.num(r.rew, 1) + '%</span>'; } }, { h: L('Komplain', 'Complaints'), cls: 'r', v: function (r) { return '<span class="num">' + r.comp + '</span>'; } }, { h: L('Piutang', 'AR'), cls: 'r', v: function (r) { return '<span class="num">' + fmt.rpShort(r.ar) + '</span>'; } }],
      function (r) { return { t: esc(r.c.n), r: fmt.rpShort(r.rev), s: 'On-time ' + fmt.num(r.ot, 0) + '% · Rewash ' + fmt.num(r.rew, 1) + '% · AR ' + fmt.rpShort(r.ar) }; }), { icon: 'hotel' }); }
  });
  report('RPT-PPL-001', {
    sub: function () { return t(L('Produktivitas per stasiun & orang', 'Productivity by station & person')); },
    kpis: function () { var st = d().staff.filter(function (s) { return s.present && s.st !== 'driver'; }); return [{ v: st.length, k: L('Staf Hadir', 'Staff Present'), icon: 'users', tone: 'info' }, { v: '52', u: 'kg/j', k: L('Kg / orang / jam', 'Kg / person / hour'), icon: 'gauge', tone: 'info' }, { v: '6', u: T(L('jam', 'h')), k: L('Lembur Minggu Ini', 'Overtime This Week'), icon: 'clock', tone: 'ok' }]; },
    body: function () { return A.section(L('Kg per Orang Hari Ini', 'Kg per Person Today'), A.hbars(d().staff.filter(function (s) { return s.kg; }).map(function (s) { return { l: [s.n + ' · ' + T(A.stage(s.st).l), s.n + ' · ' + T(A.stage(s.st).l)], v: s.kg }; }).sort(function (a, b) { return b.v - a.v; }), { fmt: function (v) { return v + ' kg'; } }), { icon: 'users' }); }
  });

  /* ================= T05 management lists ================= */
  function listScreen(id, o) {
    V[id] = {
      render: function () {
        var defs = o.filters ? o.filters() : [];
        var rows = A.applyFilters(o.rows(), defs, o.search);
        return A.pageHead(null, o.sub ? o.sub(rows) : t(L(rows.length + ' data', rows.length + ' records')), o.add && can(o.add[1]) ? A.btn('primary', o.add[0], 'plus', { go: o.add[2] }) : '') + (o.top ? o.top() : '') +
          A.filters(defs, { search: o.search ? (o.ph || L('Cari…', 'Search…')) : null, export: o.export, force: o.force }) + A.list(rows, o.cols(), o.card, o.go);
      },
      act: o.act
    };
  }
  listScreen('LOG-FLT-001', {
    rows: function () { return d().vehicles; }, add: [L('Tambah Kendaraan', 'Add Vehicle'), 'sys.master', 'SYS-MD-001'], export: true,
    top: function () { var s = d().vehicles.filter(function (v) { return v.svc - A.now() < 7 * DAY; }); return s.length ? '<div class="bnr warn">' + ic('truck') + '<span>' + t(L(s.length + ' kendaraan jadwal servis minggu ini.', s.length + ' vehicles due for service this week.')) + '</span></div>' : ''; },
    cols: function () { return [{ h: L('Kendaraan', 'Vehicle'), v: function (v) { return '<b>' + esc(v.id) + '</b>'; } }, { h: L('Driver', 'Driver'), v: function (v) { return esc(v.drv); } }, { h: L('Rute', 'Route'), v: function (v) { return esc(v.route); } }, { h: L('Progress', 'Progress'), v: function (v) { return v.stops ? '<span class="prog"><i style="width:' + (v.done / v.stops * 100) + '%"></i></span><small class="sub num">' + v.done + '/' + v.stops + ' stop</small>' : '—'; } }, { h: L('Servis berikutnya', 'Next service'), v: function (v) { return esc(fmt.date(v.svc)); } }, { h: L('Status', 'Status'), v: function (v) { return v.status === 'active' ? A.chip('ok', L('Aktif', 'Active'), 'checkc') : A.chip('warn', L('Servis', 'Service'), 'cog'); } }]; },
    card: function (v) { return { t: esc(v.id), r: v.stops ? v.done + '/' + v.stops : '', s: esc(v.drv + ' · ' + v.route), chip: v.status === 'active' ? A.chip('ok', L('Aktif', 'Active'), 'checkc') : A.chip('warn', L('Servis', 'Service'), 'cog') }; }
  });
  var CAT = { chem: L('Chemical', 'Chemical'), cons: L('Consumable', 'Consumable') };
  listScreen('INV-STK-001', {
    rows: function () { return d().stock; }, export: true, add: [L('Sesuaikan Stok', 'Adjust Stock'), 'inv.adjust.request', 'INV-ADJ-001'],
    sub: function () { var low = d().stock.filter(function (s) { return s.qty < s.min; }).length; return t(L(d().stock.length + ' item · ' + low + ' di bawah minimum', d().stock.length + ' items · ' + low + ' below minimum')); },
    filters: function () { return [{ k: 'cat', l: L('Kategori', 'Category'), opts: [['chem', CAT.chem], ['cons', CAT.cons]], fn: function (r, v) { return r.cat === v; } }, { k: 'low', l: L('Status', 'Status'), opts: [['1', L('Di bawah minimum', 'Below minimum')]], fn: function (r) { return r.qty < r.min; } }]; },
    search: function (r) { return r.n; }, ph: L('Cari item…', 'Search items…'),
    cols: function () { return [{ h: L('Item', 'Item'), v: function (s) { return '<b>' + esc(s.n) + '</b>'; } }, { h: L('Kategori', 'Category'), v: function (s) { return t(CAT[s.cat]); } }, { h: L('Stok', 'Stock'), cls: 'r', v: function (s) { return '<span class="num">' + s.qty + ' ' + esc(s.unit) + '</span>'; } }, { h: L('Minimum', 'Minimum'), cls: 'r', v: function (s) { return '<span class="num">' + s.min + '</span>'; } }, { h: L('Pemakaian/hari', 'Use/day'), cls: 'r', v: function (s) { return '<span class="num">' + s.used + '</span>'; } }, { h: L('Status', 'Status'), v: function (s) { return s.qty < s.min ? A.chip('crit', L('Di bawah minimum', 'Below minimum'), 'alert') : A.chip('ok', L('Aman', 'OK'), 'checkc'); } }]; },
    card: function (s) { return { t: esc(s.n), r: s.qty + ' ' + esc(s.unit), s: t(CAT[s.cat]) + ' · min ' + s.min, chip: s.qty < s.min ? A.chip('crit', L('Di bawah minimum', 'Below minimum'), 'alert') : '' }; }
  });
  form('INV-ADJ-001', {
    cta: L('Ajukan', 'Submit'), icon: 'filecheck',
    sub: function () { return t(L('Stok berubah setelah disetujui.', 'Stock changes only after approval.')); },
    fields: function () { return [{ k: 'it', l: L('Item', 'Item'), type: 'sel', req: true, reqMsg: L('Pilih item.', 'Choose an item.'), opts: [['', L('Pilih', 'Choose')]].concat(d().stock.map(function (s) { return [s.id, [s.n + ' · ' + s.qty + ' ' + s.unit, s.n + ' · ' + s.qty + ' ' + s.unit]]; })), v: A.S.q.it || '' },
      { k: 'qty', l: L('Stok fisik', 'Physical count'), type: 'num', int: true, req: true, reqMsg: C.screen('INV-ADJ-001').v[0] },
      { k: 'rs', l: L('Alasan', 'Reason'), type: 'sel', req: true, reqMsg: C.screen('INV-ADJ-001').v[1], opts: [['', L('Pilih', 'Choose')], ['leak', L('Bocor / rusak', 'Leaking / damaged')], ['count', L('Hasil hitung fisik', 'Physical count result')], ['exp', L('Kedaluwarsa', 'Expired')]] }]; },
    save: function (v) { var s = d().stock.filter(function (x) { return x.id === v.it; })[0]; d().approvals.unshift({ id: 'APR-' + (400 + d().approvals.length), type: 'stock', perm: 'inv.adjust.approve', ref: s.n, by: A.R().person, at: A.now(), from: s.qty + ' ' + s.unit, to: v.qty + ' ' + s.unit, why: [v.rs, v.rs], status: 'wait' }); A.audit('STK.ADJUST', s.n, s.qty, v.qty + ' (menunggu)'); return { extra: esc(s.n) + ' · ' + s.qty + ' → ' + v.qty }; }
  });

  /* Finance lists */
  listScreen('FIN-BIL-001', {
    rows: function () { var g = {}; readyToBill().forEach(function (o) { (g[o.cl] = g[o.cl] || []).push(o); }); return Object.keys(g).map(function (k) { return { cl: k, os: g[k], kg: sum(g[k], function (o) { return o.kg; }), val: sum(g[k], orderValue), nopod: g[k].filter(function (o) { return !o.pod; }).length }; }); },
    sub: function (rows) { return t(L(sum(rows, function (r) { return r.os.length; }) + ' order siap ditagih · ', sum(rows, function (r) { return r.os.length; }) + ' orders ready · ')) + fmt.rp(sum(rows, function (r) { return r.val; })); },
    top: function () { return '<p class="hint">' + ic('lock') + t(L('Nilai dihitung otomatis dari kontrak + rate card. Harga tidak bisa diubah di sini.', 'Values come from contract + rate card. Prices cannot be changed here.')) + '</p>'; },
    cols: function () { return [{ h: L('Klien', 'Client'), v: function (r) { return '<b>' + esc(A.cname(r.cl)) + '</b>'; } }, { h: L('Order', 'Orders'), cls: 'r', v: function (r) { return '<span class="num">' + r.os.length + '</span>'; } }, { h: L('Berat', 'Weight'), cls: 'r', v: function (r) { return '<span class="num">' + fmt.kg(r.kg) + '</span>'; } }, { h: L('Nilai', 'Value'), cls: 'r', v: function (r) { return '<span class="num">' + fmt.rp(r.val) + '</span>'; } }, { h: '', v: function (r) { return A.pbtn('fin.bill', 'primary', L('Buat Invoice', 'Create Invoice'), 'file', { act: 'bill', val: r.cl, cls: 'btn-sm' }); } }]; },
    card: function (r) { return { t: esc(A.cname(r.cl)), r: fmt.rpShort(r.val), s: r.os.length + ' order · ' + fmt.kg(r.kg), chip: A.pbtn('fin.bill', 'primary', L('Buat Invoice', 'Create Invoice'), 'file', { act: 'bill', val: r.cl, cls: 'btn-sm' }) }; },
    act: { bill: function (el) {
      var cl = el.getAttribute('data-val'), os = readyToBill().filter(function (o) { return o.cl === cl; });
      A.submit('bill:' + cl + ':' + os.map(function (o) { return o.id; }).join(','), el, function () {
        var id = 'INV-2610-0' + (24 + d().invoices.length - 10), amt = sum(os, orderValue);
        d().invoices.unshift({ id: id, cl: cl, date: A.now(), due: A.now() + 14 * DAY, amt: amt, paid: 0 }); os.forEach(function (o) { o.billed = id; });
        A.audit('BILL.CHANGE', id, null, fmt.rp(amt) + ' · ' + os.length + ' order');
        A.success(L('Invoice dibuat.', 'Invoice created.'), { l: L('Buka invoice', 'Open invoice'), go: 'FIN-INV-002', rec: id, icon: 'invoice' }, { l: L('Kembali ke Billing', 'Back to Billing'), go: 'FIN-BIL-001' }, esc(id) + ' · ' + esc(A.cname(cl)) + ' · ' + fmt.rp(amt));
      });
    } }
  });
  listScreen('FIN-INV-001', {
    rows: function () { return d().invoices.slice().sort(function (a, b) { return b.date - a.date; }); }, export: true,
    filters: function () { return [{ k: 'st', l: L('Status', 'Status'), opts: Object.keys(INV_ST).map(function (k) { return [k, INV_ST[k][1]]; }), fn: function (r, v) { return inv(r).st === v || (v === 'open' && inv(r).st === 'part'); } }, { k: 'cl', l: L('Klien', 'Client'), opts: DB.CLIENTS.map(function (c) { return [c.id, [c.n, c.n]]; }), fn: function (r, v) { return r.cl === v; } }]; },
    search: function (r) { return r.id + ' ' + A.cname(r.cl); }, ph: L('Cari nomor invoice, klien…', 'Search invoice number, client…'),
    cols: function () { return [{ h: L('Nomor', 'Number'), v: function (i) { return '<b>' + esc(i.id) + '</b>'; } }, { h: L('Klien', 'Client'), v: function (i) { return esc(A.cname(i.cl)); } }, { h: L('Tanggal', 'Date'), v: function (i) { return esc(fmt.date(i.date)); } }, { h: L('Jatuh tempo', 'Due'), v: function (i) { return esc(fmt.date(i.due)); } }, { h: L('Nilai', 'Amount'), cls: 'r', v: function (i) { return '<span class="num">' + fmt.rp(i.amt) + '</span>'; } }, { h: L('Sisa', 'Balance'), cls: 'r', v: function (i) { return '<span class="num">' + fmt.rp(inv(i).bal) + '</span>'; } }, { h: L('Status', 'Status'), v: invChip }]; },
    card: function (i) { return { t: esc(A.cname(i.cl)), r: fmt.rpShort(inv(i).bal || i.amt), s: esc(i.id) + ' · ' + t(L('jatuh tempo', 'due')) + ' ' + esc(fmt.date(i.due)), chip: invChip(i) }; },
    go: function (i) { return href('FIN-INV-002', i.id); }
  });
  V['FIN-INV-002'] = {
    title: function (rec) { return rec ? [rec, rec] : null; },
    render: function (ctx) {
      var i = DB.invoice(ctx.rec) || d().invoices[0]; if (!i) return A.stateCard('empty', ctx.s.emp, A.backBtn());
      var x = inv(i), os = d().orders.filter(function (o) { return o.billed === i.id; }), ps = d().payments.filter(function (p) { return p.inv === i.id; });
      return A.pageHead([i.id, i.id], esc(A.cname(i.cl)) + ' · ' + esc(fmt.date(i.date)), invChip(i)) +
        A.attn([{ v: fmt.rpShort(i.amt), k: L('Nilai', 'Amount'), icon: 'invoice', tone: 'info' }, { v: fmt.rpShort(i.paid), k: L('Dibayar', 'Paid'), icon: 'checkc', tone: 'ok' }, { v: fmt.rpShort(x.bal), k: L('Sisa', 'Balance'), icon: 'coins', tone: x.st === 'late' ? 'crit' : x.bal ? 'warn' : 'ok' }, { v: fmt.date(i.due), k: L('Jatuh Tempo', 'Due'), icon: 'calendar', tone: x.st === 'late' ? 'crit' : 'info' }]) +
        '<div class="grid2">' + A.section(L('Rincian', 'Lines'), os.length ? A.list(os, [{ h: L('Order', 'Order'), v: function (o) { return '#' + esc(o.id); } }, { h: L('Jenis', 'Type'), v: function (o) { return t(A.typeL(o.type)); } }, { h: L('Berat', 'Weight'), cls: 'r', v: function (o) { return fmt.kg(o.kg); } }, { h: L('Harga/kg', 'Price/kg'), cls: 'r', v: function (o) { return ic('lock') + ' ' + fmt.rp(DB.RATES[o.type]); } }, { h: L('Jumlah', 'Amount'), cls: 'r', v: function (o) { return fmt.rp(orderValue(o)); } }], function (o) { return { t: '#' + esc(o.id), r: fmt.rp(orderValue(o)), s: fmt.kg(o.kg) + ' × ' + fmt.rp(DB.RATES[o.type]) }; }) : '<p class="hint">' + t(L('Invoice periode: rincian per order tersedia di file PDF.', 'Period invoice: per-order lines are in the PDF.')) + '</p>', { icon: 'list' }) +
        A.section(L('Pembayaran', 'Payments'), ps.length ? '<div class="rls">' + ps.map(function (p) { return A.rowLink({ href: '#', icon: 'card', t: fmt.rp(p.amt), s: esc(p.method + ' · ' + p.ref + ' · ' + fmt.when(p.at)) }); }).join('') + '</div>' : A.empty(L('Belum ada pembayaran.', 'No payments yet.')), { icon: 'card' }) + '</div>' +
        actionBar(x.bal > 0 ? A.pbtn('fin.payment', 'primary', L('Catat Pembayaran', 'Record Payment'), 'card', { go: 'FIN-PAY-001', qs: 'inv=' + i.id }) : '', A.pbtn('fin.cn.request', 'outline', L('Ajukan Credit Note', 'Request Credit Note'), 'filecheck', { go: 'FIN-CN-002', qs: 'inv=' + i.id }));
    }
  };
  listScreen('FIN-PAY-002', {
    rows: function () { return d().payments; }, export: true, add: [L('Catat Pembayaran', 'Record Payment'), 'fin.payment', 'FIN-PAY-001'],
    sub: function (rows) { return t(L('Diterima: ', 'Received: ')) + fmt.rp(sum(rows, function (p) { return p.amt; })); },
    search: function (p) { return p.id + ' ' + p.inv + ' ' + A.cname(p.cl) + ' ' + p.ref; }, ph: L('Cari referensi, invoice…', 'Search reference, invoice…'),
    cols: function () { return [{ h: L('Tanggal', 'Date'), v: function (p) { return esc(fmt.when(p.at)); } }, { h: L('Klien', 'Client'), v: function (p) { return '<b>' + esc(A.cname(p.cl)) + '</b>'; } }, { h: L('Invoice', 'Invoice'), v: function (p) { return esc(p.inv); } }, { h: L('Metode', 'Method'), v: function (p) { return esc(p.method) + '<small class="sub">' + esc(p.ref) + '</small>'; } }, { h: L('Nilai', 'Amount'), cls: 'r', v: function (p) { return '<span class="num">' + fmt.rp(p.amt) + '</span>'; } }]; },
    card: function (p) { return { t: esc(A.cname(p.cl)), r: fmt.rpShort(p.amt), s: esc(p.inv + ' · ' + p.method + ' · ' + fmt.when(p.at)) }; },
    go: function (p) { return href('FIN-INV-002', p.inv); }
  });
  form('FIN-PAY-001', {
    cta: L('Simpan Pembayaran', 'Save Payment'), icon: 'card',
    key: function (v) { return v.inv + ':' + (v.ref || v.amt); },
    top: function (ctx) { var i = DB.invoice(ctx.q.inv); return i ? '<div class="bnr info">' + ic('invoice') + '<span>' + esc(i.id) + ' · ' + esc(A.cname(i.cl)) + ' · ' + t(L('Sisa tagihan', 'Balance')) + ' <b>' + fmt.rp(inv(i).bal) + '</b></span></div>' : ''; },
    fields: function (ctx) {
      var s = C.screen('FIN-PAY-001');
      return [{ k: 'inv', l: L('Invoice', 'Invoice'), type: 'sel', req: true, reqMsg: L('Pilih invoice.', 'Choose an invoice.'), v: ctx.q.inv || '', from: ctx.q.inv ? L('dari invoice', 'from invoice') : null, opts: [['', L('Pilih', 'Choose')]].concat(d().invoices.filter(function (i) { return inv(i).bal > 0; }).map(function (i) { return [i.id, [i.id + ' · ' + A.cname(i.cl) + ' · ' + fmt.rp(inv(i).bal), i.id + ' · ' + A.cname(i.cl) + ' · ' + fmt.rp(inv(i).bal)]]; })) },
        { k: 'dt', l: L('Tanggal bayar', 'Payment date'), type: 'date', req: true, reqMsg: L('Isi tanggal bayar.', 'Enter the payment date.'), v: new Date().toISOString().slice(0, 10) },
        { k: 'm', l: L('Metode', 'Method'), type: 'sel', req: true, reqMsg: s.v[2], opts: [['', L('Pilih', 'Choose')], ['Transfer BCA', L('Transfer BCA', 'BCA transfer')], ['Transfer Mandiri', L('Transfer Mandiri', 'Mandiri transfer')], ['Transfer BNI', L('Transfer BNI', 'BNI transfer')], ['Giro', L('Giro', 'Giro')]] },
        { k: 'amt', l: L('Nilai (Rp)', 'Amount (Rp)'), type: 'num', int: true, req: true, reqMsg: s.v[0], check: function (v, all) { var i = DB.invoice(all.inv); var n = parseInt(String(v).replace(/\D/g, ''), 10); if (!(n > 0)) return s.v[0]; if (i && n > inv(i).bal) return s.v[1]; return null; } },
        { k: 'ref', l: L('Referensi', 'Reference'), ph: L('No. transaksi bank', 'Bank transaction no.') }];
    },
    save: function (v) {
      var i = DB.invoice(v.inv), n = parseInt(String(v.amt).replace(/\D/g, ''), 10), prev = T(INV_ST[inv(i).st][1]);
      i.paid += n; d().payments.unshift({ id: 'PAY-' + (1102 + d().payments.length), inv: i.id, cl: i.cl, at: A.now(), method: v.m, amt: n, ref: v.ref || '—' });
      A.audit('PAY.RECORD', i.id, null, fmt.rp(n)); A.audit('BILL.CHANGE', i.id, prev, T(INV_ST[inv(i).st][1]));
      return { msg: inv(i).bal > 0 ? L('Pembayaran sebagian tersimpan. Sisa tetap tercatat.', 'Partial payment saved. Balance stays open.') : L('Pembayaran tersimpan. Invoice lunas.', 'Payment saved. Invoice paid.'), back: { l: L('Kembali ke Pembayaran', 'Back to Payments'), go: 'FIN-PAY-002' }, next: { l: L('Buka invoice', 'Open invoice'), go: 'FIN-INV-002', rec: i.id, icon: 'invoice' }, extra: esc(i.id) + ' · ' + fmt.rp(n) };
    }
  });
  var CN_ST = { wait: ['warn', L('Menunggu persetujuan', 'Awaiting approval'), 'clock'], ok: ['ok', L('Disetujui', 'Approved'), 'checkc'], no: ['crit', L('Ditolak', 'Rejected'), 'xc'] };
  listScreen('FIN-CN-001', {
    rows: function () { return d().cns; }, add: [L('Ajukan Credit Note', 'Request Credit Note'), 'fin.cn.request', 'FIN-CN-002'],
    top: function () { return '<p class="hint">' + ic('users') + t(L('Finance mengajukan, owner menyetujui. Tombol setujui tidak tampil untuk pengaju.', 'Finance requests, the owner approves. Approve is not shown to the requester.')) + '</p>'; },
    cols: function () { return [{ h: L('Nomor', 'Number'), v: function (c) { return '<b>' + esc(c.id) + '</b>'; } }, { h: L('Invoice', 'Invoice'), v: function (c) { return esc(c.inv); } }, { h: L('Klien', 'Client'), v: function (c) { return esc(A.cname(c.cl)); } }, { h: L('Nilai', 'Amount'), cls: 'r', v: function (c) { return '<span class="num">' + fmt.rp(c.amt) + '</span>'; } }, { h: L('Alasan', 'Reason'), v: function (c) { return t(A.rsnL(c.reason)); } }, { h: L('Status', 'Status'), v: function (c) { var x = CN_ST[c.status]; return A.chip(x[0], x[1], x[2]); } }]; },
    card: function (c) { var x = CN_ST[c.status]; return { t: esc(c.id) + ' · ' + esc(A.cname(c.cl)), r: fmt.rpShort(c.amt), s: esc(c.inv) + ' · ' + t(A.rsnL(c.reason)), chip: A.chip(x[0], x[1], x[2]) }; },
    go: function (c) { return href('FIN-INV-002', c.inv); }
  });
  form('FIN-CN-002', {
    cta: L('Ajukan', 'Submit'), icon: 'filecheck',
    sub: function () { return t(L('Masuk antrian persetujuan owner.', 'Goes to owner approval.')); },
    fields: function (ctx) {
      var s = C.screen('FIN-CN-002');
      return [{ k: 'inv', l: L('Invoice', 'Invoice'), type: 'sel', req: true, reqMsg: L('Pilih invoice.', 'Choose an invoice.'), v: ctx.q.inv || '', opts: [['', L('Pilih', 'Choose')]].concat(d().invoices.map(function (i) { return [i.id, [i.id + ' · ' + A.cname(i.cl), i.id + ' · ' + A.cname(i.cl)]]; })) },
        { k: 'amt', l: L('Nilai (Rp)', 'Amount (Rp)'), type: 'num', int: true, req: true, reqMsg: s.v[0], check: function (v, all) { var i = DB.invoice(all.inv); var n = parseInt(String(v).replace(/\D/g, ''), 10); if (!(n > 0)) return s.v[0]; if (i && n > i.amt) return s.v[1]; return null; } },
        { k: 'rs', l: L('Alasan', 'Reason'), type: 'sel', req: true, reqMsg: L('Pilih alasan.', 'Choose a reason.'), opts: [['', L('Pilih', 'Choose')]].concat(C.ISSUE_REASONS.map(function (r) { return [r.k, r.l]; })) },
        { k: 'nt', l: L('Catatan', 'Note'), type: 'area' }];
    },
    save: function (v) {
      var i = DB.invoice(v.inv), n = parseInt(String(v.amt).replace(/\D/g, ''), 10), id = 'CN-00' + (32 + d().cns.length - 2);
      d().cns.unshift({ id: id, inv: i.id, cl: i.cl, amt: n, reason: v.rs, status: 'wait', by: A.R().person, at: A.now() });
      d().approvals.unshift({ id: 'APR-' + (400 + d().approvals.length), type: 'cn', perm: 'fin.cn.approve', ref: id + ' · ' + i.id, by: A.R().person, at: A.now(), from: fmt.rp(i.amt), to: fmt.rp(i.amt - n), why: [v.nt || T(A.rsnL(v.rs)), v.nt || T(A.rsnL(v.rs))], status: 'wait' });
      A.audit('BILL.CHANGE', i.id, null, id + ' ' + fmt.rp(n) + ' (diajukan)');
      return { back: { l: L('Kembali ke Credit Note', 'Back to Credit Notes'), go: 'FIN-CN-001' }, extra: esc(id) + ' · ' + fmt.rp(n) };
    }
  });

  /* Commercial */
  function ctrOf(cl) { return d().contracts.filter(function (c) { return c.cl === cl; })[0]; }
  listScreen('COM-CLI-001', {
    rows: function () { return DB.CLIENTS.concat(d().newClients || []); }, add: [L('Tambah Klien', 'Add Client'), 'com.client.edit', 'COM-CLI-002'],
    filters: function () { return [{ k: 'ty', l: L('Jenis', 'Type'), opts: [['Hotel', ['Hotel', 'Hotel']], ['Resort', ['Resort', 'Resort']], ['Villa', ['Villa', 'Villa']], ['Spa', ['Spa', 'Spa']]], fn: function (r, v) { return r.type === v; } }]; },
    search: function (c) { return c.n + ' ' + c.pic; }, ph: L('Cari klien…', 'Search clients…'),
    cols: function () { return [{ h: L('Nama Klien', 'Client Name'), v: function (c) { return '<b>' + esc(c.n) + '</b>'; } }, { h: L('Jenis', 'Type'), v: function (c) { return esc(c.type); } }, { h: L('Kontak', 'Contact'), v: function (c) { return esc(c.pic) + '<small class="sub">' + esc(c.phone) + '</small>'; } }, { h: L('Property', 'Properties'), cls: 'r', v: function (c) { return '<span class="num">' + DB.PROPS.filter(function (p) { return p.cl === c.id; }).length + '</span>'; } }, { h: L('Harga & kontrak', 'Price & contract'), perm: 'com.rate.view', v: function (c) { var k = ctrOf(c.id); return k ? esc(k.id) + '<small class="sub">' + fmt.rpShort(k.rev) + '/' + T(L('bln', 'mo')) + '</small>' : '—'; } }, { h: L('Status', 'Status'), v: function (c) { return c.status === 'draft' ? A.chip('mute', L('Baru', 'New'), 'plus') : A.chip('ok', L('Aktif', 'Active'), 'checkc'); } }]; },
    card: function (c) { return { t: esc(c.n), r: esc(c.type), s: esc(c.pic + ' · ' + c.phone), chip: A.chip('ok', L('Aktif', 'Active'), 'checkc') }; }
  });
  form('COM-CLI-002', {
    cta: L('Simpan', 'Save'), icon: 'check',
    fields: function () {
      var s = C.screen('COM-CLI-002');
      return [{ k: 'n', l: L('Nama klien', 'Client name'), req: true, reqMsg: s.v[0], ph: L('Masukkan nama klien', 'Enter the client name'), check: function (v) { return DB.CLIENTS.concat(d().newClients || []).some(function (c) { return c.n.toLowerCase() === v.toLowerCase(); }) ? s.v[2] : null; } },
        { k: 'ty', l: L('Jenis', 'Type'), type: 'sel', req: true, reqMsg: s.v[1], opts: [['', L('Pilih jenis usaha', 'Choose business type')], ['Hotel', ['Hotel', 'Hotel']], ['Resort', ['Resort', 'Resort']], ['Villa', ['Villa', 'Villa']], ['Spa', ['Spa', 'Spa']], ['Restoran', ['Restoran', 'Restaurant']]] },
        { k: 'pic', l: L('Kontak', 'Contact'), ph: L('Nama PIC', 'Contact person') }, { k: 'ph', l: L('Telepon / email', 'Phone / email'), ph: L('Nomor telepon / email', 'Phone number / email') },
        { k: 'ad', l: L('Alamat', 'Address'), type: 'area', ph: L('Masukkan alamat lengkap', 'Enter the full address'), wide: true }];
    },
    save: function (v) { d().newClients = d().newClients || []; var id = 'CL-' + (10 + d().newClients.length); d().newClients.push({ id: id, n: v.n, type: v.ty, pic: v.pic || '—', phone: v.ph || '—', status: 'draft' }); A.audit('MD.CHANGE', id, null, v.n); return { back: { l: L('Kembali ke Klien', 'Back to Clients'), go: 'COM-CLI-001' }, extra: esc(v.n) }; }
  });
  listScreen('COM-PRP-001', {
    rows: function () { return DB.PROPS; }, add: [L('Tambah Property', 'Add Property'), 'com.property', 'COM-PRP-001'],
    search: function (p) { return p.n; }, ph: L('Cari property…', 'Search properties…'),
    cols: function () { return [{ h: L('Property', 'Property'), v: function (p) { return '<b>' + esc(p.n) + '</b>'; } }, { h: L('Klien', 'Client'), v: function (p) { return esc(A.cname(p.cl)); } }, { h: L('Kamar', 'Rooms'), cls: 'r', v: function (p) { return '<span class="num">' + p.rooms + '</span>'; } }, { h: L('Jadwal pickup', 'Pickup schedule'), v: function (p) { return esc(p.sched); } }]; },
    card: function (p) { return { t: esc(p.n), r: p.rooms + ' ' + T(L('kamar', 'rooms')), s: esc(A.cname(p.cl) + ' · ' + p.sched) }; }
  });
  function ctrDays(c) { return Math.ceil((c.end - A.now()) / DAY); }
  listScreen('COM-CTR-001', {
    rows: function () { return d().contracts.concat(d().newContracts || []); }, add: [L('Buat Kontrak', 'Create Contract'), 'com.contract.edit', 'COM-CTR-002'],
    filters: function () { return [{ k: 'end', l: L('Berakhir', 'Ending'), opts: [['60', L('≤ 60 hari', '≤ 60 days')]], fn: function (r) { return ctrDays(r) <= 60; } }]; },
    cols: function () { return [{ h: L('Nomor', 'Number'), v: function (c) { return '<b>' + esc(c.id) + '</b>'; } }, { h: L('Klien', 'Client'), v: function (c) { return esc(A.cname(c.cl)); } }, { h: L('Mulai', 'Start'), v: function (c) { return esc(fmt.date(c.start)); } }, { h: L('Berakhir', 'End'), v: function (c) { return esc(fmt.date(c.end)); } }, { h: L('SLA', 'SLA'), cls: 'r', v: function (c) { return '<span class="num">' + c.sla + ' ' + T(L('jam', 'h')) + '</span>'; } }, { h: L('Nilai/bln', 'Value/mo'), perm: 'com.rate.view', cls: 'r', v: function (c) { return '<span class="num">' + fmt.rpShort(c.rev) + '</span>'; } }, { h: L('Status', 'Status'), v: function (c) { return c.status === 'draft' ? A.chip('mute', L('Draft', 'Draft'), 'edit') : ctrDays(c) <= 30 ? A.chip('crit', L(ctrDays(c) + ' hari lagi', ctrDays(c) + ' days left'), 'calendar') : ctrDays(c) <= 60 ? A.chip('warn', L(ctrDays(c) + ' hari lagi', ctrDays(c) + ' days left'), 'calendar') : A.chip('ok', L('Aktif', 'Active'), 'checkc'); } }]; },
    card: function (c) { return { t: esc(A.cname(c.cl)), r: esc(c.id), s: esc(fmt.date(c.start) + ' – ' + fmt.date(c.end)) + ' · SLA ' + c.sla + T(L(' jam', ' h')), chip: ctrDays(c) <= 60 ? A.chip(ctrDays(c) <= 30 ? 'crit' : 'warn', L(ctrDays(c) + ' hari lagi', ctrDays(c) + ' days left'), 'calendar') : '' }; }
  });
  form('COM-CTR-002', {
    cta: L('Simpan Draft', 'Save Draft'), icon: 'check',
    sub: function () { return t(L('Kontrak baru berstatus Draft sampai disetujui.', 'New contracts stay Draft until approved.')); },
    fields: function (ctx) {
      var s = C.screen('COM-CTR-002');
      return [{ k: 'cl', l: L('Klien', 'Client'), type: 'sel', req: true, reqMsg: s.v[0], opts: clientOpts(), v: ctx.q.cl || '' },
        { k: 'st', l: L('Mulai', 'Start'), type: 'date', req: true, reqMsg: L('Isi tanggal mulai.', 'Enter a start date.') },
        { k: 'en', l: L('Berakhir', 'End'), type: 'date', req: true, reqMsg: L('Isi tanggal berakhir.', 'Enter an end date.'), check: function (v, all) { return all.st && v <= all.st ? s.v[1] : null; } },
        { k: 'sla', l: L('SLA (jam)', 'SLA (hours)'), type: 'num', int: true, v: 24, req: true, reqMsg: s.v[2], check: function (v) { return parseInt(v, 10) > 0 ? null : s.v[2]; } },
        { k: 'rc', l: L('Rate card', 'Rate card'), type: 'sel', req: true, reqMsg: L('Pilih rate card.', 'Choose a rate card.'), opts: [['', L('Pilih', 'Choose')], ['std', L('Standar 2026', 'Standard 2026')], ['vol', L('Volume tinggi 2026', 'High volume 2026')]] }];
    },
    save: function (v) { d().newContracts = d().newContracts || []; var id = 'KTR-2026-0' + (10 + d().newContracts.length); d().newContracts.push({ id: id, cl: v.cl, start: new Date(v.st).getTime(), end: new Date(v.en).getTime(), sla: parseInt(v.sla, 10), rev: 0, status: 'draft' }); A.audit('MD.CHANGE', id, null, 'Draft · ' + A.cname(v.cl)); return { back: { l: L('Kembali ke Kontrak', 'Back to Contracts'), go: 'COM-CTR-001' }, extra: esc(id) + ' · ' + esc(A.cname(v.cl)) }; }
  });
  var RATE_ROWS = [];
  DB.CLIENTS.forEach(function (c, ci) { Object.keys(DB.RATES).forEach(function (k, ki) { if ((ci + ki) % 3 === 2) return; RATE_ROWS.push({ id: c.id + '-' + k, cl: c.id, type: k, price: DB.RATES[k] + [0, 500, -500, 800, 0, 1000][ci], from: A.now() - (120 + ci * 30) * DAY }); }); });
  listScreen('COM-RTC-001', {
    rows: function () { return RATE_ROWS; }, add: [L('Ajukan Perubahan Harga', 'Request Price Change'), 'com.rate.request', 'COM-RTC-002'],
    filters: function () { return [{ k: 'cl', l: L('Klien', 'Client'), opts: DB.CLIENTS.map(function (c) { return [c.id, [c.n, c.n]]; }), fn: function (r, v) { return r.cl === v; } }]; },
    top: function () { var w = d().approvals.filter(function (a) { return a.type === 'rate' && a.status === 'wait'; }).length; return (w ? '<div class="bnr warn">' + ic('clock') + '<span>' + t(L(w + ' perubahan harga menunggu persetujuan.', w + ' price changes awaiting approval.')) + '</span></div>' : '') + '<p class="hint">' + ic('lock') + t(L('Harga terkunci. Perubahan hanya lewat pengajuan dan persetujuan (Aturan 8).', 'Prices are locked. Changes only through a request and approval (Rule 8).')) + '</p>'; },
    cols: function () { return [{ h: L('Klien', 'Client'), v: function (r) { return '<b>' + esc(A.cname(r.cl)) + '</b>'; } }, { h: L('Layanan', 'Service'), v: function (r) { return t(A.typeL(r.type)); } }, { h: L('Satuan', 'Unit'), v: function () { return 'kg'; } }, { h: L('Harga', 'Price'), cls: 'r', v: function (r) { return '<span class="num">' + ic('lock') + ' ' + fmt.rp(r.price) + '</span>'; } }, { h: L('Berlaku sejak', 'Valid from'), v: function (r) { return esc(fmt.date(r.from)); } }]; },
    card: function (r) { return { t: esc(A.cname(r.cl)), r: fmt.rp(r.price) + '/kg', s: t(A.typeL(r.type)) + ' · ' + esc(fmt.date(r.from)) }; }
  });
  form('COM-RTC-002', {
    cta: L('Ajukan', 'Submit'), icon: 'filecheck',
    sub: function () { return t(L('Berlaku setelah disetujui owner. Nilai lama & baru tercatat.', 'Effective after owner approval. Old & new values are recorded.')); },
    fields: function () {
      var s = C.screen('COM-RTC-002');
      return [{ k: 'it', l: L('Item', 'Item'), type: 'sel', req: true, reqMsg: L('Pilih item.', 'Choose an item.'), opts: [['', L('Pilih', 'Choose')]].concat(RATE_ROWS.map(function (r) { return [r.id, [A.cname(r.cl) + ' · ' + T(A.typeL(r.type)) + ' · ' + fmt.rp(r.price), A.cname(r.cl) + ' · ' + DB.TYPES[r.type][1] + ' · ' + fmt.rp(r.price)]]; })) },
        { k: 'np', l: L('Harga baru (Rp/kg)', 'New price (Rp/kg)'), type: 'num', int: true, req: true, reqMsg: s.v[0] },
        { k: 'ef', l: L('Berlaku mulai', 'Effective from'), type: 'date', req: true, reqMsg: L('Isi tanggal berlaku.', 'Enter the effective date.') },
        { k: 'rs', l: L('Alasan', 'Reason'), type: 'area', req: true, reqMsg: s.v[1], wide: true }];
    },
    save: function (v) { var r = RATE_ROWS.filter(function (x) { return x.id === v.it; })[0]; d().approvals.unshift({ id: 'APR-' + (400 + d().approvals.length), type: 'rate', perm: 'com.rate.approve', ref: A.cname(r.cl) + ' · ' + DB.TYPES[r.type][0], by: A.R().person, at: A.now(), from: fmt.rp(r.price) + '/kg', to: fmt.rp(parseInt(v.np, 10)) + '/kg', why: [v.rs, v.rs], status: 'wait' }); A.audit('PRICE.CHANGE', A.cname(r.cl) + ' · ' + DB.TYPES[r.type][0], fmt.rp(r.price), fmt.rp(parseInt(v.np, 10)) + ' (diajukan)'); return { back: { l: L('Kembali ke Rate Card', 'Back to Rate Card'), go: 'COM-RTC-001' }, extra: fmt.rp(r.price) + ' → ' + fmt.rp(parseInt(v.np, 10)) }; }
  });
  listScreen('COM-SLA-001', {
    rows: function () { return clientPerf(); },
    cols: function () { return [{ h: L('Klien', 'Client'), v: function (r) { return '<b>' + esc(r.c.n) + '</b>'; } }, { h: L('Target', 'Target'), cls: 'r', v: function (r) { return '<span class="num">' + r.c.sla + ' ' + T(L('jam', 'h')) + '</span>'; } }, { h: L('On-time', 'On-time'), cls: 'r', v: function (r) { return '<span class="num">' + fmt.num(r.ot, 0) + '%</span>'; } }, { h: L('Status', 'Status'), v: function (r) { return r.ot < 95 ? A.chip('warn', L('Di bawah target', 'Below target'), 'alert') : A.chip('ok', L('Di atas target', 'Above target'), 'checkc'); } }]; },
    card: function (r) { return { t: esc(r.c.n), r: fmt.num(r.ot, 0) + '%', s: t(L('Target', 'Target')) + ' ' + r.c.sla + T(L(' jam', ' h')), chip: r.ot < 95 ? A.chip('warn', L('Di bawah target', 'Below target'), 'alert') : '' }; }
  });
  var DOC_ST = { signed: ['ok', L('Ditandatangani', 'Signed'), 'checkc'], pending: ['warn', L('Menunggu tanda tangan', 'Awaiting signature'), 'clock'] };
  var DOC_K = { contract: L('Kontrak', 'Contract'), sla: L('SLA', 'SLA'), sop: L('SOP', 'SOP'), offer: L('Penawaran', 'Offer'), rate: L('Rate card', 'Rate card') };
  listScreen('COM-DOC-001', {
    rows: function () { return d().docs; }, add: [L('Unggah Dokumen', 'Upload Document'), 'com.docs', 'COM-DOC-001'],
    search: function (x) { return x.n + ' ' + A.cname(x.cl); }, ph: L('Cari dokumen…', 'Search documents…'),
    cols: function () { return [{ h: L('Dokumen', 'Document'), v: function (x) { return '<b>' + esc(x.n) + '</b>'; } }, { h: L('Klien', 'Client'), v: function (x) { return esc(A.cname(x.cl)); } }, { h: L('Jenis', 'Type'), v: function (x) { return t(DOC_K[x.kind]); } }, { h: L('Tanggal', 'Date'), v: function (x) { return esc(fmt.date(x.at)); } }, { h: L('Status', 'Status'), v: function (x) { var s = DOC_ST[x.status]; return A.chip(s[0], s[1], s[2]); } }]; },
    card: function (x) { var s = DOC_ST[x.status]; return { t: esc(x.n), s: esc(A.cname(x.cl)) + ' · ' + t(DOC_K[x.kind]), chip: A.chip(s[0], s[1], s[2]) }; }
  });
  listScreen('COM-RNW-001', {
    rows: function () { return d().contracts.filter(function (c) { return ctrDays(c) <= 90; }).sort(function (a, b) { return a.end - b.end; }); },
    cols: function () { return [{ h: L('Klien', 'Client'), v: function (c) { return '<b>' + esc(A.cname(c.cl)) + '</b>'; } }, { h: L('Kontrak', 'Contract'), v: function (c) { return esc(c.id); } }, { h: L('Berakhir', 'Ends'), v: function (c) { return esc(fmt.date(c.end)); } }, { h: L('Sisa', 'Left'), v: function (c) { return A.chip(ctrDays(c) <= 30 ? 'crit' : 'warn', L(ctrDays(c) + ' hari', ctrDays(c) + ' days'), 'calendar'); } }, { h: L('Revenue/bln', 'Revenue/mo'), cls: 'r', v: function (c) { return '<span class="num">' + fmt.rpShort(c.rev) + '</span>'; } }, { h: '', v: function (c) { return A.pbtn('com.contract.edit', 'primary', L('Mulai Renewal', 'Start Renewal'), 'refresh', { go: 'COM-CTR-002', qs: 'cl=' + c.cl, cls: 'btn-sm' }); } }]; },
    card: function (c) { return { t: esc(A.cname(c.cl)), r: fmt.rpShort(c.rev), s: esc(c.id) + ' · ' + esc(fmt.date(c.end)), chip: A.chip(ctrDays(c) <= 30 ? 'crit' : 'warn', L(ctrDays(c) + ' hari', ctrDays(c) + ' days'), 'calendar') + A.pbtn('com.contract.edit', 'primary', L('Mulai Renewal', 'Start Renewal'), 'refresh', { go: 'COM-CTR-002', qs: 'cl=' + c.cl, cls: 'btn-sm' }) }; }
  });
  listScreen('RPT-LIB-001', {
    rows: function () { return ['RPT-OPS-001', 'SLA-MON-001', 'QLT-DSH-001', 'PRD-DSH-001', 'RPT-CLI-001', 'RPT-PPL-001', 'RPT-FIN-001', 'FIN-AR-001', 'RPT-COM-001', 'INV-STK-001', 'LOG-FLT-001', 'OPS-BRD-001'].filter(function (id) { return can(C.screen(id).p); }).map(function (id) { return C.screen(id); }); },
    sub: function (rows) { return t(L(rows.length + ' laporan · dimuat saat dibuka', rows.length + ' reports · loaded when opened')); },
    cols: function () { return [{ h: L('Laporan', 'Report'), v: function (s) { return '<b>' + t(s.n) + '</b><small class="sub">' + t(s.pur) + '</small>'; } }, { h: L('Domain', 'Domain'), v: function (s) { var dm = C.SITEMAP.filter(function (x) { return x.k === s.dom; })[0]; return dm ? t(dm.t) : '—'; } }, { h: L('ID', 'ID'), v: function (s) { return '<code>' + esc(s.id) + '</code>'; } }]; },
    card: function (s) { return { t: t(s.n), s: t(s.pur) }; }, go: function (s) { return href(s.id); }
  });

  /* ================= T09 System ================= */
  var SYS_ITEMS = [['SYS-USR-001', 'users'], ['SYS-ROL-001', 'key'], ['SYS-MD-001', 'database'], ['SYS-SET-001', 'cog'], ['SYS-AUD-001', 'history']];
  function sysNav(cur) { return '<nav class="subnav">' + SYS_ITEMS.filter(function (x) { return can(C.screen(x[0]).p); }).map(function (x) { return '<a href="' + href(x[0]) + '"' + (x[0] === cur ? ' aria-current="page"' : '') + '>' + ic(x[1]) + '<span>' + t(C.screen(x[0]).n) + '</span></a>'; }).join('') + '</nav>'; }
  V['SYS-HUB-001'] = {
    render: function () {
      var last = d().audit.filter(function (a) { return a.ev === 'SYS.CHANGE' || a.ev === 'MD.CHANGE'; })[0];
      return A.pageHead(null, last ? t(L('Perubahan terakhir', 'Last change')) + ': ' + esc(last.by + ' · ' + last.rec + ' · ' + fmt.when(last.at)) : '') +
        '<div class="tasks sys">' + SYS_ITEMS.filter(function (x) { return can(C.screen(x[0]).p); }).map(function (x) { var s = C.screen(x[0]); return '<a class="tk" href="' + href(s.id) + '"><span class="tk-ic">' + ic(x[1]) + '</span><span class="tk-t"><b>' + t(s.n) + '</b><small>' + t(s.pur) + '</small></span>' + ic('chevr') + '</a>'; }).join('') + '</div>';
    }
  };
  function sysPage(id, body) { return A.pageHead() + '<div class="syswrap">' + sysNav(id) + '<div class="sysmain">' + body + '</div></div>'; }
  V['SYS-USR-001'] = {
    render: function () {
      var users = C.ROLE_ORDER.map(function (k) { var r = C.ROLES[k]; return { n: r.person, role: k, site: r.site, email: r.person.toLowerCase().replace(/[^a-z]/g, '') + '@jfresh.id', on: true }; })
        .concat(d().staff.filter(function (s) { return s.n !== 'Made' && s.n !== 'Komang'; }).map(function (s) { return { n: s.n, role: 'operator', site: 'Plant Denpasar', email: s.n.toLowerCase() + '@jfresh.id', on: s.present }; }));
      return sysPage('SYS-USR-001', '<div class="ph-a">' + A.pbtn('sys.users', 'primary', L('Tambah User', 'Add User'), 'plus', { act: 'add' }) + '</div>' + A.list(users, [
        { h: L('Nama', 'Name'), v: function (u) { return '<span class="who"><span class="av sm">' + esc(u.n.charAt(0)) + '</span><b>' + esc(u.n) + '</b></span>'; } },
        { h: L('Peran', 'Role'), v: function (u) { return t(C.ROLES[u.role].n); } }, { h: L('Email', 'Email'), v: function (u) { return esc(u.email); } }, { h: L('Lokasi', 'Site'), v: function (u) { return esc(u.site); } },
        { h: L('Status', 'Status'), v: function (u) { return u.on ? A.chip('ok', L('Aktif', 'Active'), 'checkc') : A.chip('mute', L('Nonaktif', 'Inactive'), 'minus'); } }
      ], function (u) { return { t: esc(u.n), s: t(C.ROLES[u.role].n) + ' · ' + esc(u.site), chip: u.on ? A.chip('ok', L('Aktif', 'Active'), 'checkc') : A.chip('mute', L('Nonaktif', 'Inactive'), 'minus') }; }));
    },
    act: { add: function () { A.toast(L('Form tambah user dibuka di fase Build.', 'The add-user form arrives in the Build phase.'), 'warn'); } }
  };
  V['SYS-ROL-001'] = {
    render: function () {
      var groups = {}; Object.keys(C.PERMS).forEach(function (p) { var g = p.split('.')[0]; (groups[g] = groups[g] || []).push(p); });
      var GN = { home: L('Beranda', 'Home'), ops: L('Operasional', 'Operations'), log: L('Logistik', 'Logistics'), prd: L('Produksi', 'Production'), qlt: L('Quality', 'Quality'), sla: L('SLA', 'SLA'), inv: L('Inventory', 'Inventory'), fin: L('Finance', 'Finance'), com: L('Komersial', 'Commercial'), rpt: L('Laporan', 'Reports'), people: L('People', 'People'), apr: L('Persetujuan', 'Approvals'), sys: L('Sistem', 'System'), clt: L('Portal Klien', 'Client Portal') };
      var head = '<tr><th>' + t(L('Izin', 'Permission')) + '</th>' + C.ROLE_ORDER.map(function (k) { return '<th class="c" title="' + t(C.ROLES[k].n) + '">' + t(C.ROLES[k].n).split(/[ /]/)[0] + '</th>'; }).join('') + '</tr>';
      var body = Object.keys(groups).map(function (g) {
        return '<tr class="grp"><th colspan="' + (C.ROLE_ORDER.length + 1) + '">' + t(GN[g] || [g, g]) + '</th></tr>' + groups[g].map(function (p) {
          return '<tr><td>' + t(C.PERMS[p]) + '<small class="sub"><code>' + esc(p) + '</code></small></td>' + C.ROLE_ORDER.map(function (k) { return '<td class="c">' + (C.can(k, p) ? '<span class="yes" title="' + t(L('Ya', 'Yes')) + '">' + ic('check') + '<span class="sr">' + t(L('Ya', 'Yes')) + '</span></span>' : '<span class="no" aria-label="' + t(L('Tidak', 'No')) + '">–</span>'); }).join('') + '</tr>';
        }).join('');
      }).join('');
      return sysPage('SYS-ROL-001', '<p class="hint">' + ic('key') + t(L('Izin mengatur menu, halaman, tombol, data, persetujuan, edit dan export. Tanpa izin, item disembunyikan.', 'Permissions control menus, pages, buttons, data, approvals, editing and export. Without a permission the item is hidden.')) + '</p>' +
        '<div class="tblw mx"><table class="tbl dense matrix"><thead>' + head + '</thead><tbody>' + body + '</tbody></table></div>' +
        '<p class="hint">' + ic('history') + t(L('Setiap perubahan izin tercatat di Audit Log dengan nilai lama dan baru.', 'Every permission change is written to the Audit Log with old and new values.')) + ' <a href="../phase2/np03-role-navigation.html">' + t(L('Lihat NP-03', 'See NP-03')) + '</a></p>');
    }
  };
  V['SYS-AUD-001'] = {
    render: function () {
      var defs = [{ k: 'ev', l: L('Event', 'Event'), opts: Object.keys(C.AUDIT).map(function (k) { return [k, C.AUDIT[k]]; }), fn: function (r, v) { return r.ev === v; } }];
      var rows = A.applyFilters(d().audit, defs, function (r) { return r.by + ' ' + r.rec + ' ' + (r.to || ''); });
      return sysPage('SYS-AUD-001', '<p class="hint">' + ic('lock') + t(L('Audit tidak bisa diubah atau dihapus.', 'Audit cannot be edited or deleted.')) + '</p>' + A.filters(defs, { search: L('Cari user, record…', 'Search user, record…'), export: true, force: true }) + A.list(rows.slice(0, 60), [
        { h: L('Waktu', 'Time'), v: function (a) { return esc(fmt.when(a.at)); } }, { h: L('User', 'User'), v: function (a) { return '<b>' + esc(a.by) + '</b><small class="sub">' + t(C.ROLES[a.role] ? C.ROLES[a.role].n : ['', '']) + '</small>'; } },
        { h: L('Event', 'Event'), v: function (a) { return t(C.AUDIT[a.ev]) + '<small class="sub"><code>' + esc(a.ev) + '</code></small>'; } }, { h: L('Record', 'Record'), v: function (a) { return esc(a.rec); } },
        { h: L('Lama → Baru', 'Old → New'), v: function (a) { return a.from || a.to ? '<span class="old">' + esc(a.from || '—') + '</span> → <b>' + esc(a.to || '—') + '</b>' : '—'; } }
      ], function (a) { return { t: t(C.AUDIT[a.ev]) + ' · ' + esc(a.rec), s: esc(a.by + ' · ' + fmt.when(a.at)) + (a.from || a.to ? '<br>' + esc(a.from || '—') + ' → ' + esc(a.to || '—') : '') }; }, null, { dense: true }));
    }
  };
  V['SYS-MD-001'] = {
    render: function () {
      var cats = [[L('Jenis cucian', 'Laundry types'), Object.keys(DB.TYPES).length, 'shirt'], [L('Layanan & program cuci', 'Services & wash programs'), 4, 'washer'], [L('Mesin', 'Machines'), 7, 'factory'], [L('Kendaraan', 'Vehicles'), d().vehicles.length, 'truck'], [L('Supplier', 'Suppliers'), 5, 'building'], [L('Alasan masalah', 'Issue reasons'), C.ISSUE_REASONS.length, 'alert'], [L('Item stok', 'Stock items'), d().stock.length, 'package'], [L('Klien & property', 'Clients & properties'), DB.CLIENTS.length + DB.PROPS.length, 'hotel']];
      return sysPage('SYS-MD-001', '<p class="hint">' + ic('link') + t(L('Master data dipakai ulang di semua layar, jadi frontline tidak mengetik ulang.', 'Master data is reused on every screen, so frontline never retypes it.')) + '</p><div class="tiles2">' + cats.map(function (c) { return '<div class="tl2"><span class="tk-ic">' + ic(c[2]) + '</span><b>' + t(c[0]) + '</b><span class="num">' + c[1] + '</span></div>'; }).join('') + '</div>');
    }
  };
  V['SYS-SET-001'] = {
    render: function () {
      var st = d().settings || { lang: 'id', notif: true, push: true, wlim: 5 };
      return sysPage('SYS-SET-001', '<section class="card"><div class="card-h"><h2>' + ic('globe') + '<span>' + t(L('Bahasa', 'Language')) + '</span></h2></div>' + fld('lang', L('Bahasa default', 'Default language'), selIn('lang', [['id', L('Bahasa Indonesia', 'Bahasa Indonesia')], ['en', L('English', 'English')]], st.lang)) + '</section>' +
        '<section class="card"><div class="card-h"><h2>' + ic('bell') + '<span>' + t(L('Notifikasi', 'Notifications')) + '</span></h2></div>' +
        '<label class="tgl"><input type="checkbox" id="f-notif"' + (st.notif ? ' checked' : '') + '><span>' + t(L('Alert SLA ke supervisor', 'SLA alerts to supervisors')) + '</span></label>' +
        '<label class="tgl"><input type="checkbox" id="f-push"' + (st.push ? ' checked' : '') + '><span>' + t(L('Notifikasi pengiriman ke klien', 'Delivery notifications to clients')) + '</span></label></section>' +
        '<section class="card"><div class="card-h"><h2>' + ic('route') + '<span>' + t(L('Workflow', 'Workflow')) + '</span></h2></div>' + fld('wlim', L('Batas selisih berat sebelum butuh persetujuan (%)', 'Weight difference before approval is needed (%)'), numIn('wlim', st.wlim, '%', { int: true })) + '</section>' +
        actionBar(A.pbtn('sys.settings', 'primary', L('Simpan', 'Save'), 'check', { act: 'save' }), ''));
    },
    act: {
      save: function (el) {
        var w = parseInt(val('f-wlim'), 10), s = C.screen('SYS-SET-001');
        if (!(w >= 1 && w <= 20)) { setErr('wlim', s.v[0]); errSummary([s.v[0]]); return; }
        var prev = d().settings || { lang: 'id', notif: true, push: true, wlim: 5 };
        var next = { lang: val('f-lang'), notif: document.getElementById('f-notif').checked, push: document.getElementById('f-push').checked, wlim: w };
        A.submit('set:' + JSON.stringify(next) + ':' + Math.floor(A.now() / 1000), el, function () { d().settings = next; A.audit('SYS.CHANGE', 'Pengaturan', JSON.stringify(prev), JSON.stringify(next)); A.toast(s.ok); A.rerender(); });
      }
    }
  };

  /* ================= Client portal ================= */
  form('CLT-PKP-001', {
    cta: L('Kirim Permintaan', 'Send Request'), icon: 'truck',
    top: function () { var pr = DB.PROPS.filter(function (p) { return p.cl === A.R().clientId; })[0]; return '<div class="bnr info">' + ic('calendar') + '<span>' + t(L('Jadwal rutin', 'Regular schedule')) + ': <b>' + esc(pr.sched) + '</b></span></div>'; },
    fields: function () {
      var s = C.screen('CLT-PKP-001'), my = DB.PROPS.filter(function (p) { return p.cl === A.R().clientId; });
      return [{ k: 'pr', l: L('Property', 'Property'), type: 'sel', req: true, reqMsg: L('Pilih property.', 'Choose a property.'), v: my[0].id, from: L('akun Anda', 'your account'), opts: my.map(function (p) { return [p.id, [p.n, p.n]]; }) },
        { k: 'dt', l: L('Tanggal', 'Date'), type: 'date', req: true, reqMsg: s.v[0], v: new Date().toISOString().slice(0, 10), check: function (v) { return v < new Date().toISOString().slice(0, 10) ? s.v[1] : null; } },
        { k: 'tm', l: L('Jam', 'Time'), type: 'time', req: true, reqMsg: L('Pilih jam pickup.', 'Choose a pickup time.'), v: '14:00' },
        { k: 'bg', l: L('Perkiraan bag', 'Estimated bags'), type: 'num', int: true, step: true, v: 4 },
        { k: 'nt', l: L('Catatan', 'Note'), type: 'area', wide: true, ph: L('Contoh: lewat pintu servis', 'e.g. use the service entrance') }];
    },
    save: function (v) { d().pickupReqs.push({ at: A.now(), v: v }); A.audit('ORD.STATUS', 'PICKUP-REQ', null, A.cname(A.R().clientId) + ' · ' + v.dt + ' ' + v.tm); return { msg: C.screen('CLT-PKP-001').ok, back: { l: L('Kembali ke Beranda', 'Back to Home'), go: 'HOM-CLT-001' }, extra: esc(v.dt + ' · ' + v.tm) }; }
  });
  V['CLT-ORD-001'] = {
    render: function () {
      var tab = A.S.q.tab === 'done' ? 'done' : 'act', os = cltOrders(), act = os.filter(function (o) { return o.stage !== 'done'; }), done = os.filter(function (o) { return o.stage === 'done'; });
      var rows = (tab === 'done' ? done : act).sort(function (a, b) { return tab === 'done' ? b.deliveredAt - a.deliveredAt : a.dueAt - b.dueAt; });
      return A.pageHead() + '<div class="tabs"><a href="' + href('CLT-ORD-001') + '" aria-selected="' + (tab === 'act') + '">' + t(L('Berjalan', 'In progress')) + ' <b>' + act.length + '</b></a><a href="' + href('CLT-ORD-001', null, { tab: 'done' }) + '" aria-selected="' + (tab === 'done') + '">' + t(L('Selesai', 'Done')) + ' <b>' + done.length + '</b></a></div>' +
        (rows.length ? '<div class="corders">' + rows.map(function (o) { return '<a class="co" href="' + href('CLT-ORD-002', o.id) + '"><span class="co-h"><b>#' + esc(o.id) + '</b>' + cChip(o) + '</span><span class="co-m">' + esc(fmt.date(o.createdAt)) + ' · ' + esc(fmt.kg(o.kg || o.estKg)) + ' · ' + o.bags + ' bag · ' + t(A.typeL(o.type)) + '</span>' + (o.stage !== 'done' ? cTrack(o, true) : '') + '</a>'; }).join('') + '</div>' : A.empty(C.screen('CLT-ORD-001').emp));
    }
  };
  V['CLT-ORD-002'] = {
    title: function (rec) { return rec ? ['#' + rec, '#' + rec] : null; },
    render: function (ctx) {
      var o = DB.order(ctx.rec);
      if (!o || o.cl !== A.R().clientId) return A.stateCard('empty', ctx.s.emp, A.backBtn());
      return A.pageHead(['#' + o.id, '#' + o.id], esc(DB.prop(o.prop).n), cChip(o)) + cTrack(o) +
        A.section(L('Rincian', 'Details'), infoGrid([[L('Berat', 'Weight'), fmt.kg(o.kg || o.estKg)], [L('Bag', 'Bags'), o.bags], [L('Jenis', 'Type'), t(A.typeL(o.type))], [o.stage === 'done' ? L('Diterima', 'Received') : L('Perkiraan tiba', 'Estimated arrival'), esc(fmt.when(o.stage === 'done' ? o.deliveredAt : o.deliverAt))]]), { icon: 'file' }) +
        (o.pod ? A.section(L('Bukti Pengiriman', 'Proof of Delivery'), infoGrid([[L('Penerima', 'Receiver'), esc(o.pod.name)], [L('Waktu', 'Time'), esc(fmt.when(o.pod.at))]]) + '<div class="photo-ph">' + ic('camera') + '<span>' + t(L('Foto serah terima', 'Handover photo')) + '</span></div>', { icon: 'filecheck' }) : '') +
        actionBar(A.pbtn('clt.complaint', 'outline', L('Ada Masalah?', 'Something wrong?'), 'message', { go: 'CLT-CMP-001', qs: 'ord=' + o.id }), '');
    }
  };
  listScreen('CLT-DLV-001', {
    rows: function () { return cltOrders().filter(function (o) { return o.stage === 'deliver' || o.stage === 'done'; }).sort(function (a, b) { return (b.deliveredAt || b.deliverAt) - (a.deliveredAt || a.deliverAt); }); },
    cols: function () { return [{ h: L('Tanggal', 'Date'), v: function (o) { return esc(fmt.when(o.deliveredAt || o.deliverAt)); } }, { h: L('Order', 'Order'), v: function (o) { return '<b>#' + esc(o.id) + '</b>'; } }, { h: L('Bag', 'Bags'), cls: 'r', v: function (o) { return '<span class="num">' + (o.cleanBags || o.bags) + '</span>'; } }, { h: L('Penerima', 'Receiver'), v: function (o) { return o.pod ? esc(o.pod.name) : '—'; } }, { h: L('Status', 'Status'), v: function (o) { return o.pod ? A.chip('ok', L('Diterima', 'Received'), 'filecheck') : A.chip('info', L('Dijadwalkan', 'Scheduled'), 'truck'); } }]; },
    card: function (o) { return { t: '#' + esc(o.id), r: (o.cleanBags || o.bags) + ' bag', s: esc(fmt.when(o.deliveredAt || o.deliverAt)) + (o.pod ? ' · ' + esc(o.pod.name) : ''), chip: o.pod ? A.chip('ok', L('Diterima', 'Received'), 'filecheck') : A.chip('info', L('Dijadwalkan', 'Scheduled'), 'truck') }; },
    go: function (o) { return href('CLT-ORD-002', o.id); }
  });
  listScreen('CLT-INV-001', {
    rows: function () { return d().invoices.filter(function (i) { return i.cl === A.R().clientId; }); },
    top: function () { return '<div class="bnr info">' + ic('card') + '<span>' + t(L('Pembayaran: transfer ke BCA 123 456 7890 a.n. PT J\'Fresh Laundry. Cantumkan nomor invoice.', 'Payment: transfer to BCA 123 456 7890, PT J\'Fresh Laundry. Quote the invoice number.')) + '</span></div>'; },
    cols: function () { return [{ h: L('Nomor', 'Number'), v: function (i) { return '<b>' + esc(i.id) + '</b>'; } }, { h: L('Tanggal', 'Date'), v: function (i) { return esc(fmt.date(i.date)); } }, { h: L('Nilai', 'Amount'), cls: 'r', v: function (i) { return '<span class="num">' + fmt.rp(i.amt) + '</span>'; } }, { h: L('Jatuh tempo', 'Due'), v: function (i) { return esc(fmt.date(i.due)); } }, { h: L('Status', 'Status'), v: invChip }, { h: '', v: function (i) { return A.btn('ghost', L('Unduh PDF', 'Download PDF'), 'download', { act: 'pdf', val: i.id, cls: 'btn-sm' }); } }]; },
    card: function (i) { return { t: esc(i.id), r: fmt.rpShort(i.amt), s: t(L('Jatuh tempo', 'Due')) + ' ' + esc(fmt.date(i.due)), chip: invChip(i) + A.btn('ghost', L('Unduh PDF', 'Download PDF'), 'download', { act: 'pdf', val: i.id, cls: 'btn-sm' }) }; },
    act: { pdf: function (el) { A.toast(L('PDF ' + el.getAttribute('data-val') + ' disiapkan.', 'PDF ' + el.getAttribute('data-val') + ' prepared.')); } }
  });
  form('CLT-CMP-001', {
    cta: L('Kirim Komplain', 'Send Complaint'), icon: 'message',
    fields: function (ctx) {
      var s = C.screen('CLT-CMP-001');
      return [{ k: 'ord', l: L('Pesanan', 'Order'), type: 'sel', req: true, reqMsg: s.v[0], v: ctx.q.ord || '', opts: [['', L('Pilih pesanan', 'Choose an order')]].concat(cltOrders().map(function (o) { return [o.id, ['#' + o.id + ' · ' + fmt.date(o.createdAt), '#' + o.id + ' · ' + fmt.date(o.createdAt)]]; })) },
        { k: 'rs', l: L('Alasan', 'Reason'), type: 'sel', req: true, reqMsg: s.v[1], opts: [['', L('Pilih alasan', 'Choose a reason')]].concat(C.ISSUE_REASONS.filter(function (r) { return r.k !== 'process'; }).map(function (r) { return [r.k, r.l]; })) },
        { k: 'nt', l: L('Catatan', 'Note'), type: 'area', wide: true }];
    },
    below: function () {
      var mine = d().issues.filter(function (i) { return i.src === 'client' && DB.order(i.ord) && DB.order(i.ord).cl === A.R().clientId; });
      return mine.length ? A.section(L('Komplain Saya', 'My Complaints'), '<div class="rls">' + mine.map(function (i) { var x = i.status === 'closed' ? ['ok', L('Selesai', 'Resolved'), 'checkc'] : ['info', L('Diproses', 'In progress'), 'clock']; return A.rowLink({ href: href('CLT-ORD-002', i.ord), icon: 'message', t: t(A.rsnL(i.reason)) + ' · #' + esc(i.ord), s: esc(fmt.when(i.at)), chip: A.chip(x[0], x[1], x[2]) }); }).join('') + '</div>', { icon: 'message' }) : '';
    },
    save: function (v) { var id = 'ISS-0' + (416 + d().issues.length); d().issues.unshift({ id: id, ord: v.ord, reason: v.rs, src: 'client', by: A.cname(A.R().clientId), at: A.now(), status: 'open', note: v.nt }); A.audit('ISS.CREATE', id, null, 'Komplain klien · ' + v.ord); return { back: { l: L('Kembali ke Beranda', 'Back to Home'), go: 'HOM-CLT-001' }, extra: esc(id) }; }
  });
  listScreen('CLT-DOC-001', {
    rows: function () { return d().docs.filter(function (x) { return x.cl === A.R().clientId; }); },
    cols: function () { return [{ h: L('Dokumen', 'Document'), v: function (x) { return '<b>' + esc(x.n) + '</b>'; } }, { h: L('Jenis', 'Type'), v: function (x) { return t(DOC_K[x.kind]); } }, { h: L('Tanggal', 'Date'), v: function (x) { return esc(fmt.date(x.at)); } }, { h: '', v: function (x) { return A.btn('ghost', L('Unduh', 'Download'), 'download', { act: 'dl', val: x.n, cls: 'btn-sm' }); } }]; },
    card: function (x) { return { t: esc(x.n), s: t(DOC_K[x.kind]) + ' · ' + esc(fmt.date(x.at)), chip: A.btn('ghost', L('Unduh', 'Download'), 'download', { act: 'dl', val: x.n, cls: 'btn-sm' }) }; },
    act: { dl: function (el) { A.toast(L('Dokumen disiapkan.', 'Document prepared.')); } }
  });
})();
