/* JFRESH OS — Phase 6 screens (part 3): NP-08 Renewal & Approval (RENEW-001, 002, APPROVAL-001,
   COM-ALERT-001), NP-09 Health, Profitability & Growth (HEALTH-001, OPP-001, 002) and the client
   portal (CLT-COM-001). Phase 2 commercial routes open their Phase 6 screen (one commercial truth). */
(function () {
  var A = window.JFAPP, M = window.JFCOMM, H = A && A.P5, P = A && A.P6;
  if (!A || !M || !H || !P) return;
  var V = A.V, T = A.T, L = A.L, t = A.t, esc = A.esc, ic = A.ic, can = A.can, fmt = A.fmt, href = A.href;
  var open = H.open, lnk = H.lnk, pct = H.pct, rpj = H.rpj, tabs = H.tabs, card = H.card, kv = H.kv, note = H.note, tile = H.tile, tiles = H.tiles, dlg = H.dlg, fld = H.fld, inp = H.inp, sel = H.sel, area = H.area, num = H.num, ring = H.ring, delta = H.delta, spark = H.spark;
  var cx = P.cx, dt = P.dt, dts = P.dts, ctrSt = P.ctrSt, hSt = P.hSt, aprSt = P.aprSt, riskC = P.riskC, sevC = P.sevC, slaC = P.slaC, tone = P.tone, hRing = P.hRing, hMini = P.hMini, left = P.left, lock = P.lock, rpFull = P.rpFull, n0 = P.n0, emp = P.emp, cname = P.cname, pname = P.pname, sname = P.sname;
  var clLink = P.clLink, prLink = P.prLink, ctrLink = P.ctrLink, rcLink = P.rcLink, after = P.after, fail = P.fail, opts = P.opts, clientOpts = P.clientOpts, propOpts = P.propOpts, amOpts = P.amOpts, more = P.more, mob = P.mob, reach = P.reach, timeline = P.timeline;

  function stageName(k) { var s = M.STAGES.filter(function (x) { return x[0] === k; })[0]; return s ? t(s[1]) : '—'; }
  function oppStage(k) { var s = M.OPP_STAGES.filter(function (x) { return x[0] === k; })[0]; return s ? s[1] : [k, k]; }
  function oppChip(k) { return A.chip(k === 'won' ? 'ok' : k === 'lost' ? 'crit' : k === 'negotiation' ? 'appr' : 'info', oppStage(k)); }
  function val(v) { return v == null ? '—' : typeof v === 'number' ? (v >= 1e5 ? rpFull(v) : fmt.num(v, 0)) : esc(String(T(v))); }

  /* ================= NP-08 · RENEW-001 Renewal Dashboard ================= */
  function rnwRow(x) {
    return { t: esc(x.no) + ' · ' + cname(x.cl), r: x.left < 0 ? Math.abs(x.left) + 'd ↺' : x.left + 'd', s: (x.stage ? stageName(x.stage) : t(L('Belum dimulai', 'Not started'))) + ' · ' + esc(T(x.next)), chip: riskC(x.risk) + (x.stalled ? ' ' + A.chip('warn', L('Macet', 'Stalled'), 'hourglass') : '') };
  }
  V['RENEW-001'] = {
    render: function (c) {
      var c0 = cx(), b = M.renewalBuckets(c0), view = c.q.view || (mob() ? 'list' : 'board'), bk = c.q.b || '', list = M.renewals(c0, { bucket: bk || null, stage: c.q.stage || null });
      var rev = function (arr) { return arr.reduce(function (s, x) { return s + x.props.reduce(function (a, p) { var m = M.billing(p, 12); return a + (m ? m.rev : 0); }, 0); }, 0); };
      var strip = '<div class="tls5 tls6-6">' + M.BUCKETS.map(function (k) {
        var arr = b[k[0]], tn = k[0] === 'd30' || k[0] === 'expired' ? 'crit' : k[0] === 'd60' ? 'warn' : k[0] === 'appr' ? 'info' : '';
        return tile({ k: k[1], v: arr.length, s: rpj(rev(arr)) + t(L('/bln', '/mo')), tone: arr.length ? tn : '', href: H.qhref({ b: bk === k[0] ? null : k[0] }) }).replace('class="tl5', 'class="tl5' + (bk === k[0] ? ' tl6-on' : ''));
      }).join('') + '</div>';
      var board = '<div class="kb6" role="list">' + M.STAGES.map(function (s) {
        var col = list.filter(function (x) { return x.stage === s[0]; });
        return '<section class="kb6-c" role="listitem" aria-label="' + esc(T(s[1])) + '"><h3>' + t(s[1]) + ' <span class="cnt num">' + col.length + '</span></h3>' + (col.length ? col.map(function (x) {
          return '<a class="kb6-i' + (x.stalled ? ' kb6-w' : '') + '" href="' + href('RENEW-002', x.no) + '"><b>' + cname(x.cl) + '</b><small class="mono6">' + esc(x.no) + '</small>' + left(x.left) +
            '<small>' + esc(T(x.next)) + '</small><span class="kb6-f">' + riskC(x.risk) + '<small>' + emp(x.am) + ' · ' + dts(x.follow) + '</small></span></a>';
        }).join('') : '<p class="kb6-e">—</p>') + '</section>';
      }).join('') + '</div>';
      var tbl = A.list(list, [
        { h: L('Kontrak', 'Contract'), v: function (x) { return '<b class="mono6">' + esc(x.no) + '</b><small class="sub5">' + cname(x.cl) + '</small>'; } },
        { h: 'Property', v: function (x) { return x.props.length > 2 ? x.props.length + ' property' : x.props.map(function (p) { return pname(p); }).join(', '); } },
        { h: L('Berakhir', 'Ends'), v: function (x) { return dt(x.end) + '<br>' + left(x.left); } },
        { h: L('Tahap', 'Stage'), v: function (x) { return (x.stage ? stageName(x.stage) : '—') + (x.stalled ? ' ' + A.chip('warn', L('Macet', 'Stalled'), 'hourglass') : ''); } },
        { h: L('Risiko', 'Risk'), v: function (x) { return riskC(x.risk); } },
        { h: 'Next action', v: function (x) { return esc(T(x.next)) + '<small class="sub5">' + dt(x.follow) + '</small>'; } },
        { h: 'AM', v: function (x) { return emp(x.am); } }
      ], rnwRow, function (x) { return href('RENEW-002', x.no); }, { dense: true, empty: L('Tidak ada kontrak yang perlu diperpanjang dalam 90 hari.', 'No contract needs renewal within 90 days.') });
      return A.pageHead(null, t(L('Peringatan otomatis 90, 60, 30, 15 dan 7 hari sebelum kontrak berakhir.', 'Automatic warnings 90, 60, 30, 15 and 7 days before a contract ends.'))) + strip +
        (mob() ? '' : tabs([['board', 'Pipeline', 'columns'], ['list', L('Daftar', 'List'), 'list']], view, 'view', { seg: true, def: mob() ? 'list' : 'board' })) +
        card(bk ? M.BUCKETS.filter(function (x) { return x[0] === bk; })[0][1] : L('Renewal pipeline', 'Renewal pipeline'), view === 'board' && !mob() ? board : tbl, { icon: 'refresh', count: list.length, right: bk ? '<a class="more5" href="' + H.qhref({ b: null }) + '">' + t(L('Semua', 'All')) + ic('x') + '</a>' : '' });
    }
  };

  /* ================= NP-08 · RENEW-002 Renewal Detail ================= */
  V['RENEW-002'] = {
    title: function (rec) { return L('Renewal · ' + (rec || ''), 'Renewal · ' + (rec || '')); },
    render: function (c) {
      var no = c.rec || 'CTR-2025-020', x = M.renewalCard(no);
      if (!x) return A.stateCard('empty', L('Kontrak tidak ditemukan.', 'Contract not found.'), A.backBtn());
      if (!M.canSeeClient(cx(), x.cl)) return A.stateCard('noperm', M.MSG.scope, A.backBtn());
      var h = M.health(x.cl), g = M.growth(x.cl), fin = can('com.finance.view') ? M.finance(x.cl) : null, cp = M.complaints(x.cl), sla = M.slaPerf(x.cl), rk = M.risks(x.cl).slice(0, 3);
      var who = M.recommend(x.cl, x.props[0], 'renewal'), c1 = who && who.primary[0];
      var i0 = M.STAGES.map(function (s) { return s[0]; }).indexOf(x.stage);
      var stp = '<ol class="stp6">' + M.STAGES.map(function (s, i) { var cls = i < i0 ? 'done' : i === i0 ? 'now' : ''; return '<li class="' + cls + '"' + (i === i0 ? ' aria-current="step"' : '') + '><span class="stp6-n">' + (cls === 'done' ? ic('check') : i + 1) + '</span><span>' + t(s[1]) + '</span></li>'; }).join('') + '</ol>';
      var acts = [];
      if (can('com.renewal.manage')) {
        if (!x.r) acts.push(A.btn('primary', L('Mulai renewal', 'Start renewal'), 'refresh', { act: 'rnwStart', val: no, cls: 'btn-sm' }));
        else if (x.stage !== 'renewed') acts.push(A.btn('primary', L('Pindah tahap', 'Move stage'), 'arrow', { act: 'move', cls: 'btn-sm' }));
        if (x.r && !x.newCtr && can('com.contract.create') && !mob() && ['proposal', 'negotiation', 'approval'].indexOf(x.stage) >= 0) acts.push(A.btn('ghost', L('Buat kontrak baru', 'Create new contract'), 'contract', { act: 'newCtr', cls: 'btn-sm' }));
      }
      if (can('com.opp.manage')) acts.push(A.btn('ghost', L('Follow-up', 'Follow-up'), 'phone', { act: 'task', val: x.cl + '|followup|' + (x.props.length === 1 ? x.props[0] : ''), cls: 'btn-sm' }), A.btn('ghost', 'Meeting', 'calendar', { act: 'task', val: x.cl + '|meeting|', cls: 'btn-sm' }));
      var head = '<section class="card c6-hd"><div class="c6-hd-m"><span class="av6 av6-l" aria-hidden="true">' + ic('refresh') + '</span><div class="c6-hd-t"><h1>' + cname(x.cl) + ' ' + riskC(x.risk) + (x.stalled ? ' ' + A.chip('warn', L('Negosiasi macet', 'Negotiation stalled'), 'hourglass') : '') + '</h1>' +
        '<p>' + ctrLink(no) + ' <span class="tg6">' + t(M.RENEW[x.c.renew]) + '</span><span class="sub5">' + x.props.map(function (p) { return pname(p); }).join(', ') + '</span></p></div><div class="c6-hd-h">' + left(x.left) + '<small>' + t(L('Berakhir ', 'Ends ')) + dt(x.end) + '</small></div></div>' + stp +
        kv([['Account Manager', emp(x.am)], ['Next action', '<b>' + esc(T(x.next)) + '</b>'], [L('Follow-up', 'Follow-up'), dt(x.follow)], [L('Sejak tahap ini', 'In this stage since'), x.since ? dt(x.since) + ' · ' + M.days(x.since, M.TODAY) + t(L(' hari', ' days')) : '—'], [L('Kontrak baru', 'New contract'), x.newCtr ? ctrLink(x.newCtr) + ' ' + ctrSt(M.contract(x.newCtr)) : '—'], ['Opportunity', esc(T(x.opp)) || '—']]) +
        (acts.length ? '<div class="c6-hd-a">' + acts.join('') + '</div>' : '') + '</section>';
      var snap = card(L('Kondisi akun', 'Account snapshot'), tiles([
        tile({ k: 'Client Health', v: h && h.score != null ? fmt.num(h.score, 0) : '—', s: h ? t(M.HEALTH_ST[h.st][0]) : '', tone: h ? tone(h.st) : '', href: open('HEALTH-001') ? href('HEALTH-001', null, { cl: x.cl }) : null }),
        tile({ k: L('Revenue YoY', 'Revenue YoY'), v: g.yoy == null ? '—' : (g.yoy > 0 ? '+' : '') + fmt.num(g.yoy, 1) + '%', s: rpj(g.rev) + t(L('/bln', '/mo')) }),
        tile({ k: 'SLA', v: pct(sla.ot), s: sla.late + ' late', tone: sla.ot != null && sla.ot < 97 ? 'warn' : '' }),
        tile({ k: L('Komplain terbuka', 'Open complaints'), v: cp.open, tone: cp.open >= 2 ? 'warn' : '' }),
        tile({ k: 'AR', v: fin ? rpj(fin.total) : lock(), s: fin && fin.overdue ? t(L('Jatuh tempo ', 'Overdue ')) + rpj(fin.overdue) : '', tone: fin && fin.overdueShare > 50 ? 'warn' : '' })
      ], 'tls5-5'), { icon: 'gauge' });
      var riskCard = card(L('Risiko renewal', 'Renewal risks'), rk.length ? '<ul class="rk6">' + rk.map(function (r) { return '<li>' + sevC(r.sev) + '<span>' + t(r.t) + '</span>' + (r.src && open(r.src) ? '<a class="more5" href="' + href(r.src, r.rec || (r.src === 'CLIENT-002' ? x.cl : null), r.src === 'HEALTH-001' ? { cl: x.cl } : null) + '">' + ic('chevr') + '</a>' : '') + '</li>'; }).join('') + '</ul>' : A.empty(L('Tidak ada risiko besar.', 'No major risk.')), { icon: 'alert' });
      var contact = c1 ? card(L('Kontak renewal', 'Renewal contact'), '<div class="rec6"><li>' + P.avatar(c1.n) + '<div><b>' + P.ctLink(c1.id) + '</b><small>' + esc(T(c1.pos)) + '</small></div>' + reach(c1) + '</li></div>', { icon: 'idcard' }) : '';
      var hist = can('com.history.view') ? card(L('Riwayat renewal', 'Renewal history'), timeline(M.timeline(x.cl).filter(function (e) { return e.rec === no || e.rec === x.newCtr || /^RENEWAL|^PROPOSAL/.test(e.ev); }), 8), { icon: 'history' }) : '';
      return head + '<div class="grid2"><div>' + snap + riskCard + '</div><div>' + contact + hist + '</div></div>';
    },
    act: P.acts({
      move: function () {
        var no = A.S.rec, x = M.renewalCard(no), i0 = M.STAGES.map(function (s) { return s[0]; }).indexOf(x.stage);
        dlg({ title: L('Pindah tahap renewal', 'Move renewal stage'), sub: esc(no) + ' · ' + cname(x.cl), icon: 'arrow',
          body: fld(L('Tahap baru', 'New stage'), sel('stage', M.STAGES.filter(function (s, i) { return i !== i0 && s[0] !== 'upcoming'; }), M.STAGES[Math.min(i0 + 1, M.STAGES.length - 1)][0]), { req: true }) + fld('Next action', inp('next', T(x.next))) + fld(L('Follow-up', 'Follow-up'), inp('follow', M.addDays(M.TODAY, 7), { type: 'date' })) +
            fld(L('Risiko', 'Risk'), sel('risk', Object.keys(M.RISK).map(function (k) { return [k, M.RISK[k][0]]; }), x.risk)) + fld(L('Catatan', 'Note'), area('note', '')) + note(t(L('Renewed hanya bisa dipilih setelah kontrak baru disetujui.', 'Renewed can only be chosen after the new contract is approved.')), 'info'),
          onOk: function (v) { var r = M.moveRenewal(cx(), no, v.stage, { next: v.next, follow: v.follow, risk: v.risk, note: v.note }); if (!r.ok) return r.msg; after(L('Renewal pindah ke ' + T(M.STAGES.filter(function (s) { return s[0] === v.stage; })[0][1]) + '.', 'Renewal moved to ' + M.STAGES.filter(function (s) { return s[0] === v.stage; })[0][1][1] + '.')); return true; } });
      },
      newCtr: function () {
        var no = A.S.rec, old = M.contract(no);
        var start = M.addDays(old.end, 1), end = M.addDays(start, 364);
        dlg({ title: L('Buat kontrak renewal', 'Create renewal contract'), sub: esc(no) + ' → ' + t(L('kontrak baru', 'new contract')), icon: 'contract',
          body: fld(L('Mulai', 'Start'), inp('start', start, { type: 'date' }), { req: true }) + fld(L('Berakhir', 'End'), inp('end', end, { type: 'date' }), { req: true }) + fld(L('Termin (hari)', 'Terms (days)'), inp('terms', old.terms, { num: true })) + fld(L('Alasan', 'Reason'), inp('reason', T(L('Renewal ' + no, 'Renewal ' + no)))) +
            note(t(L('Isi kontrak lama disalin sebagai draft. Rate Card dan SLA bisa diubah di editor kontrak.', 'The old terms are copied as a draft. The Rate Card and SLA can be changed in the contract editor.')), 'copy'),
          onOk: function (v) {
            var r = M.createContract(cx(), { cl: old.cl, props: old.props.slice(), start: v.start, end: v.end, renew: old.renew, terms: num(v.terms), scope: old.scope.slice(), sla: old.sla, rc: old.rc, minVol: old.minVol, pickup: old.pickup, cycle: old.cycle, tax: old.tax, special: old.special, renewalOf: no, reason: L(v.reason, v.reason) });
            if (!r.ok) return r.msg;
            var r2 = M.setContractStatus(cx(), r.contract.no, 1, 'review'); if (r2.ok && M.renewalOf(no).stage !== 'approval') M.moveRenewal(cx(), no, 'approval', { next: L('Persetujuan kontrak ' + r.contract.no, 'Approve contract ' + r.contract.no) });
            A.go('CONTRACT-002', r.contract.no); setTimeout(function () { A.toast(L('Kontrak ' + r.contract.no + ' dibuat dan dikirim untuk persetujuan.', 'Contract ' + r.contract.no + ' created and sent for approval.')); }, 300); return true;
          } });
      }
    })
  };

  /* ================= NP-08 · APPROVAL-001 Commercial Approval Inbox ================= */
  function imp(a) { return a.kind === 'credit' || a.kind === 'terms' ? 0 : a.impact || 0; }
  function aprRows(a) {
    var k = M.APR_KINDS[a.kind], money = ['rate', 'credit', 'creditnote'].indexOf(a.kind) >= 0, unit = a.kind === 'discount' ? '%' : a.kind === 'slaexc' ? ' ' + T(L('jam', 'h')) : a.kind === 'terms' ? T(L(' hari', ' days')) : '';
    var pf = function (v) { return v == null ? '—' : money ? rpFull(+v) : esc(String(T(v))) + unit; };
    var rows = [[L('Jenis', 'Type'), ic(k.icon) + ' ' + t(k.n)], [L('Klien', 'Client'), clLink(a.cl) + (a.prop ? ' · ' + pname(a.prop) : '')], [L('Data', 'Record'), a.kind === 'rate' || a.kind === 'discount' ? (can('com.rate.view') ? rcLink(a.rec) : esc(a.rec)) + (a.svc ? ' · ' + sname(a.svc) : '') : a.kind === 'contract' || a.kind === 'special' ? ctrLink(a.rec) : a.kind === 'slaexc' ? lnk('SLA-002', a.rec, esc(a.rec)) : esc(a.rec)],
      [L('Nilai lama', 'Old value'), pf(a.from)], [L('Nilai baru', 'New value'), '<b>' + pf(a.to) + '</b>' + (a.diff != null ? ' ' + delta(a.diff, { u: a.kind === 'discount' ? ' pt' : '%' }) : '')], [L('Alasan', 'Reason'), esc(T(a.reason))],
      [L('Dampak revenue / bulan', 'Revenue impact / month'), imp(a) ? delta(imp(a) / 1e6, { u: ' jt', fmt: function (d) { return fmt.num(d, 1); } }) : '—'], [L('Tanggal berlaku', 'Effective date'), dt(a.eff)], [L('Lampiran', 'Attachment'), a.attach ? ic('file') + esc(a.attach) : '—'],
      [L('Diajukan', 'Requested'), emp(a.by) + ' · ' + dt(a.at)], ['Approver', a.revBy ? emp(a.revBy) + ' · ' + dt(a.revAt) : t(L('Pemegang izin ', 'Holder of ')) + '<span class="mono6">' + esc(k.p) + '</span>']];
    if (a.note) rows.push([L('Catatan approver', 'Approver note'), esc(T(a.note))]);
    return rows;
  }
  V['APPROVAL-001'] = {
    render: function (c) {
      var c0 = cx(), q = c.q, view = q.view || 'pending', list = M.approvals(c0, { st: view === 'pending' ? 'pending' : view === 'done' ? 'done' : null, kind: q.kind, mine: true }).filter(function (a) { return view !== 'mine' || a.mine; });
      var pendAll = M.approvals(c0, { st: 'pending', mine: true }), mineAct = pendAll.filter(function (a) { return a.canAct; });
      var sel0 = q.id ? M.approvals(c0, { mine: true }).filter(function (a) { return a.id === q.id; })[0] : null;
      var fb = A.filters([{ k: 'kind', l: L('Jenis', 'Type'), opts: Object.keys(M.APR_KINDS).map(function (k) { return [k, M.APR_KINDS[k].n]; }) }], { force: true });
      var narrow = sel0 && !mob();
      var listHtml = A.list(list, [
        { h: 'ID', v: function (a) { return '<b class="mono6">' + esc(a.id) + '</b>' + (narrow ? '<small class="sub5">' + t(M.APR_KINDS[a.kind].n) + '</small>' : ''); } },
        narrow ? null : { h: L('Jenis', 'Type'), v: function (a) { return ic(M.APR_KINDS[a.kind].icon) + ' ' + t(M.APR_KINDS[a.kind].n); } },
        { h: L('Klien', 'Client'), v: function (a) { return cname(a.cl) + (a.prop ? '<small class="sub5">' + pname(a.prop) + '</small>' : ''); } },
        { h: L('Perubahan', 'Change'), v: function (a) { var money = ['rate', 'credit', 'creditnote'].indexOf(a.kind) >= 0; return esc(String(T(a.from == null ? '—' : money ? rpj(+a.from) : a.from))) + ' → <b>' + esc(String(T(money ? rpj(+a.to) : a.to))) + '</b>'; } },
        narrow ? null : { h: L('Dampak', 'Impact'), cls: 'r', v: function (a) { return imp(a) ? delta(imp(a) / 1e6, { u: ' jt', fmt: function (d) { return fmt.num(d, 1); } }) : '—'; } },
        narrow ? null : { h: L('Diajukan', 'Requested'), v: function (a) { return emp(a.by) + '<small class="sub5">' + dt(a.at) + '</small>'; } },
        { h: 'Status', v: function (a) { return aprSt(a.st) + (a.canAct ? ' ' + A.chip('appr', L('Giliran Anda', 'Your turn'), 'pointer') : ''); } }
      ].filter(Boolean), function (a) { return { t: esc(a.id) + ' · ' + t(M.APR_KINDS[a.kind].n), s: cname(a.cl) + ' · ' + esc(T(a.reason)), chip: aprSt(a.st) + (a.canAct ? ' ' + A.chip('appr', L('Giliran Anda', 'Your turn')) : '') }; }, function (a) { return H.qhref({ id: a.id }); }, { dense: true, empty: view === 'pending' ? L('Tidak ada yang menunggu persetujuan.', 'Nothing is waiting for approval.') : L('Belum ada permintaan.', 'No requests yet.') });
      var detail = '';
      if (sel0) {
        var b = [];
        if (sel0.canAct) b.push(A.btn('primary', L('Setujui', 'Approve'), 'check', { act: 'dec', val: sel0.id + '|approve' }), A.btn('ghost', L('Kembalikan', 'Return'), 'arrowl', { act: 'dec', val: sel0.id + '|return' }), A.btn('ghost', L('Tolak', 'Reject'), 'xc', { act: 'dec', val: sel0.id + '|reject', cls: 'btn6-crit' }));
        else if (sel0.st === 'pending' && sel0.mine) b.push('<span class="sub5">' + ic('lock') + t(L('Pengaju tidak dapat menyetujui permintaannya sendiri.', 'A requester cannot approve their own request.')) + '</span>');
        if (sel0.mine && ['returned', 'draft'].indexOf(sel0.st) >= 0) b.push(A.btn('primary', L('Ajukan ulang', 'Resubmit'), 'refresh', { act: 'resub', val: sel0.id }));
        detail = card(esc(sel0.id) + ' · ' + T(M.APR_KINDS[sel0.kind].n), '<p>' + aprSt(sel0.st) + '</p>' + kv(aprRows(sel0)) + (b.length ? '<div class="f6-a">' + b.join('') + '</div>' : ''), { icon: M.APR_KINDS[sel0.kind].icon, cls: 'apr6-d', right: '<a class="more5" href="' + H.qhref({ id: null }) + '" aria-label="' + t(L('Tutup detail', 'Close detail')) + '">' + ic('x') + '</a>' });
      }
      var reqBtn = (can('com.credit.edit') || can('com.rate.edit')) && !mob() ? A.btn('ghost', L('Ajukan credit note', 'Request credit note'), 'file', { act: 'cn' }) : '';
      return A.pageHead(null, t(L('Pengaju tidak boleh menyetujui sendiri. Setiap keputusan mencatat alasan, approver dan waktu.', 'A requester cannot approve their own request. Every decision records the reason, approver and time.')), reqBtn + (can('com.credit.edit') && !mob() ? A.btn('ghost', L('Ajukan limit kredit', 'Request credit limit'), 'coins', { act: 'credit' }) : '')) +
        tiles([tile({ k: L('Menunggu', 'Pending'), v: pendAll.length, href: H.qhref({ view: null, id: null }) }), tile({ k: L('Giliran Anda', 'Your turn'), v: mineAct.length, tone: mineAct.length ? 'warn' : '' }), tile({ k: L('Dampak revenue tertunda', 'Pending revenue impact'), v: rpj(pendAll.reduce(function (s, a) { return s + imp(a); }, 0)), s: t(L('per bulan', 'per month')) })], 'tls5-3') +
        tabs([['pending', L('Menunggu', 'Pending'), 'hourglass', pendAll.length], ['done', L('Selesai', 'Decided'), 'checkc'], ['mine', L('Pengajuan saya', 'My requests'), 'user'], ['all', L('Semua', 'All'), 'list']], view, 'view', { def: 'pending' }) +
        (sel0 && mob() ? detail : '') + '<div class="' + (sel0 && !mob() ? 'apr6' : '') + '">' + card(L('Permintaan', 'Requests'), fb + listHtml, { icon: 'filecheck', count: list.length }) + (sel0 && !mob() ? detail : '') + '</div>';
    },
    act: {
      dec: function (el) {
        var p = el.getAttribute('data-val').split('|'), id = p[0], d = p[1], a = M.approval(id);
        var title = { approve: L('Setujui permintaan', 'Approve request'), reject: L('Tolak permintaan', 'Reject request'), return: L('Kembalikan untuk revisi', 'Return for revision') }[d];
        dlg({ title: title, sub: esc(id) + ' · ' + t(M.APR_KINDS[a.kind].n) + ' · ' + cname(a.cl), icon: d === 'approve' ? 'check' : d === 'reject' ? 'xc' : 'arrowl', ok: title,
          body: fld(d === 'approve' ? L('Catatan (opsional)', 'Note (optional)') : L('Alasan', 'Reason'), area('note', '', d === 'approve' ? L('Contoh: disetujui selama volume ≥ 1.500 kg', 'Example: approved while volume ≥ 1,500 kg') : L('Wajib diisi', 'Required')), { req: d !== 'approve' }) +
            (d === 'approve' ? note(t(L('Perubahan berlaku lewat versi baru. Data lama dan invoice lama tidak berubah.', 'The change takes effect as a new version. Old data and old invoices do not change.')), 'history') : ''),
          onOk: function (v) { var r = M.decide(cx(), id, d, v.note); if (!r.ok) return r.msg; after(d === 'approve' ? L(id + ' disetujui.', id + ' approved.') : d === 'reject' ? L(id + ' ditolak.', id + ' rejected.') : L(id + ' dikembalikan ke pengaju.', id + ' returned to the requester.'), d === 'approve' ? 'ok' : 'warn'); return true; } });
      },
      resub: function (el) {
        var id = el.getAttribute('data-val'), a = M.approval(id);
        dlg({ title: L('Ajukan ulang', 'Resubmit'), sub: esc(id), icon: 'refresh',
          body: (a.note ? note(t(L('Catatan approver: ', 'Approver note: ')) + esc(T(a.note)), 'message', 'warn') : '') + (['contract', 'special'].indexOf(a.kind) < 0 ? fld(L('Nilai baru', 'New value'), inp('to', T(a.to), { num: typeof a.to === 'number' })) : '') + fld(L('Alasan (diperbarui)', 'Reason (updated)'), area('reason', T(a.reason)), { req: true }),
          onOk: function (v) { var ch = { reason: L(v.reason, v.reason) }; if (v.to !== undefined && v.to !== '') ch.to = typeof a.to === 'number' ? num(v.to) : v.to; var r = M.resubmit(cx(), id, ch); if (!r.ok) return r.msg; after(L(id + ' diajukan ulang.', id + ' resubmitted.')); return true; } });
      },
      cn: function () {
        var cls = M.visibleClients(cx()).filter(function (c) { var f = M.finance(c.id); return f && f.items.length; });
        var inv = []; cls.forEach(function (c) { M.finance(c.id).items.forEach(function (i) { inv.push([i.inv + '|' + c.id, [c.n + ' · ' + i.inv + ' · ' + rpj(i.amt), c.n + ' · ' + i.inv + ' · ' + rpj(i.amt)]]); }); });
        dlg({ title: L('Ajukan credit note komersial', 'Request commercial credit note'), icon: 'file',
          body: fld('Invoice', sel('inv', inv, (inv[0] || [''])[0]), { req: true, wide: true }) + fld(L('Nilai credit note (Rp)', 'Credit note amount (Rp)'), inp('amt', '', { num: true }), { req: true }) + fld(L('Alasan', 'Reason'), area('reason', '', L('Contoh: klaim item rusak terverifikasi QC', 'Example: damaged-item claim verified by QC')), { req: true }) + fld(L('Lampiran', 'Attachment'), inp('attach', '')),
          onOk: function (v) { var p = v.inv.split('|'), amt = num(v.amt); if (!amt || amt <= 0) return L('Nilai harus lebih dari 0.', 'The amount must be above 0.'); var r = M.request(cx(), 'creditnote', { cl: p[1], rec: p[0], from: 0, to: amt, reason: L(v.reason, v.reason), eff: M.TODAY, impact: -amt, attach: v.attach }); if (!r.ok) return r.msg; after(L('Credit note diajukan (' + r.approval.id + ').', 'Credit note requested (' + r.approval.id + ').')); return true; } });
      },
      credit: function () {
        dlg({ title: L('Ajukan limit kredit', 'Request credit limit'), icon: 'coins',
          body: fld(L('Klien', 'Client'), sel('cl', clientOpts(), 'CL-07'), { req: true }) + fld(L('Limit baru (Rp)', 'New limit (Rp)'), inp('to', '', { num: true }), { req: true }) + fld(L('Alasan', 'Reason'), area('reason', ''), { req: true }),
          onOk: function (v) { var r = M.requestCredit(cx(), v.cl, num(v.to), v.reason); if (!r.ok) return r.msg; after(L('Limit kredit diajukan.', 'Credit limit requested.')); return true; } });
      }
    }
  };

  /* ================= NP-08 · COM-ALERT-001 Commercial Alerts ================= */
  V['COM-ALERT-001'] = {
    render: function (c) {
      var c0 = cx(), all = M.alerts(c0), list = M.alerts(c0, { sev: c.q.sev, k: c.q.k, cl: c.q.cl }).filter(function (a) { return c.q.ack === '1' || !a.ack; });
      var n = function (s) { return all.filter(function (a) { return a.sev === s && !a.ack; }).length; };
      var kinds = Object.keys(M.ALERT_KINDS).filter(function (k) { return all.some(function (a) { return a.k === k; }); });
      return A.pageHead(null, t(L('Hanya alert yang bisa Anda tindak lanjuti. Urutan: keparahan, dampak revenue, profit, jatuh tempo, nilai klien, SLA.', 'Only alerts you can act on. Order: severity, revenue impact, profit, due date, client value, SLA.'))) +
        tiles([tile({ k: L('Kritis', 'Critical'), v: n('crit'), tone: n('crit') ? 'crit' : '', href: H.qhref({ sev: 'crit' }) }), tile({ k: L('Peringatan', 'Warning'), v: n('warn'), tone: n('warn') ? 'warn' : '', href: H.qhref({ sev: 'warn' }) }), tile({ k: 'Info', v: n('info'), href: H.qhref({ sev: 'info' }) })], 'tls5-3') +
        card(L('Alert komersial', 'Commercial alerts'), A.filters([{ k: 'sev', l: L('Keparahan', 'Severity'), opts: Object.keys(M.SEV).map(function (k) { return [k, M.SEV[k][0]]; }) }, { k: 'k', l: L('Jenis', 'Type'), opts: kinds.map(function (k) { return [k, M.ALERT_KINDS[k]]; }) }, { k: 'cl', l: L('Klien', 'Client'), opts: clientOpts() }], { force: true }) +
          '<div class="fb"><a class="btn btn-ghost btn-sm" href="' + H.qhref({ ack: c.q.ack === '1' ? null : '1' }) + '" aria-pressed="' + (c.q.ack === '1') + '">' + ic('eye') + '<span>' + t(c.q.ack === '1' ? L('Sembunyikan yang sudah dibaca', 'Hide acknowledged') : L('Tampilkan yang sudah dibaca', 'Show acknowledged')) + '</span></a></div>' +
          (list.length ? '<ul class="al6">' + list.map(function (a) {
            return '<li class="al6-i t6b-' + a.sev + (a.ack ? ' al6-ack' : '') + '"><span class="al6-ic">' + ic(a.sev === 'crit' ? 'alert' : a.sev === 'warn' ? 'bell' : 'info') + '</span><div><b>' + t(M.ALERT_KINDS[a.k]) + '</b> ' + sevC(a.sev) + '<p>' + t(a.t) + '</p>' +
              '<small class="sub5">' + (a.rev ? t(L('Dampak ', 'Impact ')) + rpj(a.rev) + ' · ' : '') + (a.days < 999 ? (a.days >= 0 ? a.days + t(L(' hari lagi', ' days left')) : Math.abs(a.days) + t(L(' hari lalu', ' days ago'))) + ' · ' : '') + cname(a.cl) + '</small></div>' +
              '<div class="al6-a">' + (open(a.go) ? '<a class="btn btn-blue btn-sm" href="' + href(a.go, a.go === 'HEALTH-001' ? null : a.rec, a.go === 'HEALTH-001' ? { cl: a.cl } : null) + '">' + ic('arrow') + '<span>' + t(L('Tindak lanjut', 'Follow up')) + '</span></a>' : '') + (a.ack ? '' : A.btn('ghost', L('Tandai dibaca', 'Acknowledge'), 'check', { act: 'ack', val: a.id, cls: 'btn-sm' })) + '</div></li>';
          }).join('') + '</ul>' : A.empty(L('Tidak ada alert komersial.', 'No commercial alerts.'))), { icon: 'bell', count: list.length });
    },
    act: { ack: function (el) { var r = M.ackAlert(cx(), el.getAttribute('data-val')); if (!r.ok) return fail(r); after(L('Alert ditandai dibaca.', 'Alert acknowledged.')); } }
  };

  /* ================= NP-09 · HEALTH-001 Client Health Dashboard ================= */
  function fresh() {
    return '<ul class="fr6" aria-label="' + t(L('Kesegaran data', 'Data freshness')) + '">' + Object.keys(M.SOURCES).map(function (k) { var s = M.sourceAge(k); return '<li class="' + (s.stale ? 't6-crit' : '') + '">' + ic(s.stale ? 'alert' : s.live ? 'zap' : 'refresh') + '<span>' + t(s.n) + '</span><small>' + (s.live ? t(L('langsung', 'live')) : s.min < 60 ? s.min + t(L(' mnt lalu', ' min ago')) : s.min < 1440 ? Math.round(s.min / 60) + t(L(' jam lalu', ' h ago')) : Math.round(s.min / 1440) + t(L(' hari lalu', ' d ago'))) + '</small></li>'; }).join('') + '</ul>';
  }
  function explainView(cl, k) {
    var e = M.explain(cl, k); if (!e) return A.stateCard('empty', L('Dimensi tidak ditemukan.', 'Dimension not found.'), A.backBtn());
    var d = e.d, fmtV = function (v, u) { return v == null ? '—' : u === 'Rp' ? rpj(v) : fmt.num(v, 1) + (u || ''); };
    if (k === 'profit' && !can('com.margin.view')) return note(t(L('Biaya dan margin hanya untuk Owner dan Finance.', 'Cost and margin are for the Owner and Finance only.')), 'lock');
    var steps = H.drill([{ l: 'Client Health', i: 'gauge', go: 'HEALTH-001', q: { cl: cl }, s: M.clientName(cl) }, { l: d.n, i: d.icon }, { l: L('Property', 'Property'), i: 'hotel' }, { l: L('Layanan', 'Service'), i: 'washer' }, { l: L('Sumber data', 'Source data'), i: 'database' }]);
    var head = '<section class="card c6-hd"><div class="c6-hd-m"><span class="av6 av6-l" aria-hidden="true">' + ic(d.icon) + '</span><div class="c6-hd-t"><h1>' + t(d.n) + ' ' + hSt(d.st) + '</h1><p>' + clLink(cl) + (d.note ? ' <span class="sub5">' + t(d.note) + '</span>' : '') + '</p></div>' +
      '<div class="c6-hd-h">' + (d.s == null ? '<span class="hr6-na">' + ic('alert') + '<small>' + t(L('Data belum ada', 'No data')) + '</small></span>' : ring(d.s, { size: 72, band: { tone: tone(d.st), n: M.HEALTH_ST[d.st][0] }, label: d.n })) + '</div></div>' +
      kv([[L('Metrik', 'Metric'), d.v == null ? '—' : fmt.num(d.v, 1) + t(d.unit || '')], [L('Skor', 'Score'), d.s == null ? '—' : fmt.num(d.s, 0)], [L('Bobot', 'Weight'), d.w + '%' + (d.ew != null && d.ew !== d.w ? ' → ' + pct(d.ew, 0) + ' ' + t(L('(dinormalisasi)', '(normalised)')) : '')], [L('Kontribusi ke skor', 'Contribution to score'), d.ws != null ? fmt.num(d.ws, 1) + ' pt' : '—'], [L('Tren', 'Trend'), d.trend == null ? '—' : delta(d.trend, { u: ' pt' })], [L('Sumber', 'Source'), t(M.SOURCES[d.src] ? M.SOURCES[d.src].n : d.src)]]) + '</section>';
    var body = '';
    if (e.props.length) {
      body = e.props.map(function (p) {
        return card(p.n, '<p class="hh6"><b class="num">' + fmtV(p.v, p.unit) + '</b> <small class="sub5">' + t(d.n) + '</small></p>' + (p.svcs.length ? '<ul class="ln6">' + p.svcs.map(function (s) { return '<li>' + ic(s.svc ? 'washer' : 'message') + '<div><b>' + (s.svc ? sname(s.svc) : esc(s.rec || '')) + '</b>' + (s.v != null ? ' · <span class="num">' + fmtV(s.v, s.unit) + '</span>' : '') + '<small>' + ic('database') + esc(s.src) + '</small></div></li>'; }).join('') + '</ul>' : A.empty(L('Belum ada data layanan.', 'No service data yet.'))), { icon: 'hotel', right: open('PROPERTY-002') ? more('PROPERTY-002', p.prop, null, L('Property', 'Property')) : '' });
      }).join('');
    } else if (e.fin) {
      body = can('com.finance.view') ? card(L('Sumber: AR ledger', 'Source: AR ledger'), P.finBlock(cl), { icon: 'coins' }) : note(t(L('Data AR hanya untuk Finance, Sales dan Owner.', 'AR data is for Finance, Sales and the Owner only.')), 'lock');
    } else if (k === 'contract') {
      body = card(L('Kontrak', 'Contracts'), A.list(M.contracts(cx(), { cl: cl }), [{ h: L('Kontrak', 'Contract'), v: function (x) { return ctrLink(x.no); } }, { h: L('Periode', 'Period'), v: function (x) { return dts(x.start) + ' – ' + dts(x.end); } }, { h: 'Status', v: function (x) { return ctrSt(x); } }, { h: L('Sisa', 'Left'), v: function (x) { return left(M.days(M.TODAY, x.end)); } }], function (x) { return { t: esc(x.no), s: dts(x.end), chip: ctrSt(x) }; }, function (x) { return href('CONTRACT-002', x.no); }, { dense: true }), { icon: 'contract' });
    } else if (k === 'retention') {
      body = card('Renewal', A.list(M.renewals(cx()).filter(function (x) { return x.cl === cl; }), [{ h: L('Kontrak', 'Contract'), v: function (x) { return esc(x.no); } }, { h: L('Tahap', 'Stage'), v: function (x) { return stageName(x.stage); } }, { h: L('Risiko', 'Risk'), v: function (x) { return riskC(x.risk); } }, { h: L('Sisa', 'Left'), v: function (x) { return left(x.left); } }], rnwRow, function (x) { return href('RENEW-002', x.no); }, { dense: true, empty: L('Tidak ada renewal berjalan.', 'No renewal running.') }), { icon: 'refresh' });
    }
    return steps + head + body;
  }
  function clientHealth(cl) {
    var h = M.health(cl), c = M.client(cl);
    if (!h) return A.stateCard('empty', L('Klien tidak ditemukan.', 'Client not found.'), A.backBtn());
    var series = [6, 7, 8, 9, 10, 11, 12].map(function (i) { var x = M.health(cl, i); return x ? x.score : null; });
    var adj = can('com.health.adjust') ? A.btn('ghost', L('Koreksi manual', 'Manual adjustment'), 'edit', { act: 'adj', val: cl, cls: 'btn-sm' }) : '';
    return '<section class="card c6-hd"><div class="c6-hd-m">' + hRing(h, mob() ? 72 : 96) + '<div class="c6-hd-t"><h1>' + esc(c.n) + ' ' + (h.score != null ? hSt(h.st) : '') + '</h1><p>' + lnk('CLIENT-002', cl, 'Client 360') + ' <span class="sub5">' + t(L('Dihitung ', 'Calculated ')) + H.dtt(h.at) + '</span></p>' +
      (h.trend != null ? '<p>' + delta(h.trend, { u: ' pt' }) + ' <small class="sub5">' + t(L('vs bulan lalu', 'vs last month')) + '</small> ' + spark(series, { w: 120, h: 28 }) + '</p>' : '') + (h.adj ? '<p class="sub5">' + t(L('Termasuk koreksi manual ', 'Includes manual adjustment ')) + (h.adj > 0 ? '+' : '') + h.adj + ' pt</p>' : '') + '</div>' +
      (adj ? '<div class="c6-hd-a">' + adj + '</div>' : '') + '</div></section>' +
      (h.incomplete ? note(t(L('Data belum lengkap: ', 'Incomplete data: ')) + h.gaps.map(function (k) { return t(M.HEALTH_DIMS.filter(function (d) { return d.k === k; })[0].n); }).join(', ') + t(L('. Skor memakai bobot yang tersedia dan bukan angka final.', '. The score uses the available weights and is not final.')), 'alert', 'warn') : '') +
      (h.excluded.length ? note(t(L('Tidak berlaku untuk klien ini: ', 'Not applicable to this client: ')) + h.excluded.map(function (k) { return t(M.HEALTH_DIMS.filter(function (d) { return d.k === k; })[0].n); }).join(', '), 'info') : '') +
      '<div class="grid2"><div>' + P.insightCard(M.insight(cl)) + '</div><div>' + card(L('Risiko', 'Risks'), (function () { var r = M.risks(cl); return r.length ? '<ul class="rk6">' + r.map(function (x) { return '<li>' + sevC(x.sev) + '<span>' + t(x.t) + '</span></li>'; }).join('') + '</ul>' : A.empty(L('Tidak ada risiko besar.', 'No major risk.')); })(), { icon: 'alert' }) + '</div></div>' + card(L('Dimensi · klik untuk drill-down', 'Dimensions · open one to drill down'), P.dimTable(cl, h), { icon: 'gauge' });
  }
  V['HEALTH-001'] = {
    render: function (c) {
      var q = c.q, c0 = cx();
      if (q.cl && !M.canSeeClient(c0, q.cl)) return A.stateCard('noperm', M.MSG.scope, A.backBtn());
      if (q.cl && q.dim) return A.pageHead(null, '') + explainView(q.cl, q.dim);
      if (q.cl && q.tab !== 'profit') return A.pageHead(null, '') + clientHealth(q.cl);
      var tab = q.tab || 'health', cls = M.visibleClients(c0).filter(function (x) { return x.status !== 'prospect'; });
      var rows = cls.map(function (x) { var h = M.health(x.id), p = M.profit(x.id), g = M.growth(x.id), r = M.risks(x.id); return { c: x, h: h, p: p, g: g, r: r }; });
      var band = function (s) { return rows.filter(function (x) { return x.h && x.h.st === s; }); }, revRisk = band('risk').concat(band('critical')).reduce(function (s, x) { return s + x.p.rev; }, 0);
      var strip = tiles([
        tile({ k: 'Healthy', v: band('healthy').length, tone: '', href: H.qhref({ hb: 'healthy' }) }), tile({ k: 'Need Attention', v: band('attention').length, tone: band('attention').length ? 'warn' : '', href: H.qhref({ hb: 'attention' }) }),
        tile({ k: 'At Risk', v: band('risk').length, tone: band('risk').length ? 'warn' : '', href: H.qhref({ hb: 'risk' }) }), tile({ k: 'Critical', v: band('critical').length, tone: band('critical').length ? 'crit' : '', href: H.qhref({ hb: 'critical' }) }),
        tile({ k: L('Revenue berisiko', 'Revenue at risk'), v: rpj(revRisk), s: t(L('At Risk + Critical / bulan', 'At Risk + Critical / month')), tone: revRisk ? 'crit' : '' })
      ], 'tls5-5');
      var shown = q.hb ? rows.filter(function (x) { return x.h && x.h.st === q.hb; }) : rows;
      var body = '';
      if (tab === 'health') body = card(L('Portofolio klien', 'Client portfolio'), A.list(shown.slice().sort(function (a, b) { return (a.h.score == null ? 999 : a.h.score) - (b.h.score == null ? 999 : b.h.score); }), [
        { h: L('Klien', 'Client'), v: function (x) { return '<b>' + esc(x.c.n) + '</b><small class="sub5">' + t(M.CLIENT_TYPES[x.c.type]) + ' · ' + emp(x.c.am) + '</small>'; } },
        { h: 'Health', v: function (x) { return hMini(x.h); } },
        { h: L('Tren', 'Trend'), v: function (x) { return x.h.trend == null ? '—' : delta(x.h.trend, { u: ' pt' }); } },
        { h: 'Revenue', cls: 'r num', v: function (x) { return x.p.rev ? rpj(x.p.rev) : '—'; } },
        { h: 'YoY', cls: 'r', v: function (x) { return x.g.yoy == null ? '—' : delta(x.g.yoy, { u: '%' }); } },
        { h: 'Margin', cls: 'r num', perm: 'com.margin.view', v: function (x) { return x.p.rev ? pct(x.p.margin) : '—'; } },
        { h: L('Risiko utama', 'Top risk'), v: function (x) { return x.r[0] ? sevC(x.r[0].sev) + ' <small>' + t(x.r[0].t) + '</small>' : '—'; } }
      ], function (x) { return { t: esc(x.c.n), r: x.h.score != null ? fmt.num(x.h.score, 0) : '—', s: (x.p.rev ? rpj(x.p.rev) + ' · ' : '') + (x.r[0] ? t(x.r[0].t) : t(L('Tidak ada risiko besar', 'No major risk'))), chip: hSt(x.h.st) }; }, function (x) { return H.qhref({ cl: x.c.id, hb: null }); }, { dense: true }), { icon: 'gauge', count: shown.length, right: q.hb ? '<a class="more5" href="' + H.qhref({ hb: null }) + '">' + t(L('Semua', 'All')) + ic('x') + '</a>' : '' });
      else if (tab === 'profit') {
        if (!can('com.margin.view')) body = note(t(L('Biaya dan margin hanya untuk Owner dan Finance.', 'Cost and margin are for the Owner and Finance only.')), 'lock');
        else if (q.cl) {
          var pf = M.profit(q.cl), pr = q.prop ? pf.props.filter(function (x) { return x.prop === q.prop; })[0] : null;
          body = card(L('Profitabilitas ', 'Profitability ') + M.clientName(q.cl), P.profitBlock(q.cl), { icon: 'percent' }) + (pr ? card(pr.n + ' · ' + T(L('per layanan', 'by service')), A.list(pr.svcs, [{ h: L('Layanan', 'Service'), v: function (s) { return '<b>' + sname(s.svc) + '</b>'; } }, { h: 'Revenue', cls: 'r num', v: function (s) { return rpj(s.rev); } }, { h: L('Biaya', 'Cost'), cls: 'r num', v: function (s) { return rpj(s.cost); } }, { h: 'Margin', cls: 'r num', v: function (s) { return pct(s.margin); } }, { h: L('Biaya/kg', 'Cost/kg'), cls: 'r num', v: function (s) { return 'Rp ' + n0(s.costKg); } }, { h: 'Profit/kg', cls: 'r num', v: function (s) { return 'Rp ' + n0(s.profitKg); } }, { h: 'Profit/pcs', cls: 'r num', v: function (s) { return s.profitPcs != null ? 'Rp ' + n0(s.profitPcs) : '—'; } }], function (s) { return { t: sname(s.svc), r: pct(s.margin), s: rpj(s.rev) + ' · Rp ' + n0(s.profitKg) + '/kg' }; }, null, { dense: true }), { icon: 'washer' }) : '');
        } else {
          var pfl = M.portfolio(c0);
          body = card(L('Profitabilitas per klien', 'Profitability by client'), A.list(pfl, [{ h: L('Klien', 'Client'), v: function (x) { return '<b>' + esc(x.n) + '</b>'; } }, { h: 'Revenue', cls: 'r num', v: function (x) { return rpj(x.rev); } }, { h: L('Biaya langsung', 'Direct cost'), cls: 'r num', v: function (x) { return rpj(x.cost); } }, { h: L('Kontribusi', 'Contribution'), cls: 'r num', v: function (x) { return rpj(x.contrib); } }, { h: 'Margin', cls: 'r num', v: function (x) { return '<b class="' + (x.margin < 20 ? 't6-crit' : '') + '">' + pct(x.margin) + '</b>'; } }, { h: 'kg', cls: 'r num', v: function (x) { return n0(x.kg); } }, { h: 'Profit/kg', cls: 'r num', v: function (x) { return 'Rp ' + n0(x.profitKg); } }],
            function (x) { return { t: esc(x.n), r: pct(x.margin), s: rpj(x.rev) + ' · Rp ' + n0(x.profitKg) + '/kg' }; }, function (x) { return H.qhref({ cl: x.cl }); }, { dense: true }), { icon: 'percent', count: pfl.length }) + note(t(L('Biaya langsung = chemical, energi, tenaga kerja dan transport per kg layanan. Margin < 20% ditandai.', 'Direct cost = chemicals, energy, labour and transport per kg of service. Margin < 20% is flagged.')), 'info');
        }
      } else if (tab === 'growth') body = card(L('Pertumbuhan', 'Growth'), A.list(rows.filter(function (x) { return x.p.rev; }).sort(function (a, b) { return (b.g.yoy || -999) - (a.g.yoy || -999); }), [
        { h: L('Klien', 'Client'), v: function (x) { return '<b>' + esc(x.c.n) + '</b>'; } }, { h: 'MoM', cls: 'r', v: function (x) { return delta(x.g.mom, { u: '%' }) || '—'; } }, { h: 'YoY', cls: 'r', v: function (x) { return delta(x.g.yoy, { u: '%' }) || '—'; } }, { h: L('Volume YoY', 'Volume YoY'), cls: 'r', v: function (x) { return delta(x.g.vol, { u: '%' }) || '—'; } },
        { h: L('Layanan baru', 'New services'), v: function (x) { return x.g.svcAdded.length ? x.g.svcAdded.map(function (k) { return sname(k.split('|')[1]); }).filter(function (v, i, a) { return a.indexOf(v) === i; }).join(', ') : '—'; } }, { h: L('Property baru', 'New properties'), v: function (x) { return x.g.newProps.map(function (p) { return pname(p); }).join(', ') || '—'; } },
        { h: 'Cross-sell', cls: 'r num', v: function (x) { return x.g.cross ? rpj(x.g.cross) + ' <small class="sub5">' + pct(x.g.crossShare, 0) + '</small>' : '—'; } }, { h: L('Tren 12 bln', '12-mo trend'), v: function (x) { return spark(M.series(x.c.id), { w: 90, h: 24 }); } }
      ], function (x) { return { t: esc(x.c.n), r: x.g.yoy == null ? '—' : (x.g.yoy > 0 ? '+' : '') + fmt.num(x.g.yoy, 1) + '%', s: 'MoM ' + (x.g.mom == null ? '—' : fmt.num(x.g.mom, 1) + '%') }; }, function (x) { return H.qhref({ cl: x.c.id, tab: null }); }, { dense: true }), { icon: 'trend' });
      else {
        var all = []; rows.forEach(function (x) { x.r.forEach(function (r) { all.push(Object.assign({ cl: x.c.id, n: x.c.n }, r)); }); });
        var rank = { crit: 0, warn: 1, info: 2 }; all.sort(function (a, b) { return rank[a.sev] - rank[b.sev]; });
        body = card(L('Risiko portofolio', 'Portfolio risks'), all.length ? '<ul class="rk6">' + all.map(function (r) { return '<li>' + sevC(r.sev) + '<span><b>' + esc(r.n) + '</b> · ' + t(r.t) + '</span><a class="more5" href="' + H.qhref({ cl: r.cl, tab: null }) + '">' + ic('chevr') + '</a></li>'; }).join('') + '</ul>' : A.empty(L('Tidak ada risiko besar.', 'No major risk.')), { icon: 'alert', count: all.length });
      }
      var wBtn = can('com.health.adjust') && !mob() ? A.btn('ghost', L('Bobot skor', 'Score weights'), 'cog', { act: 'weights' }) : '';
      return A.pageHead(null, t(L('Skor 0–100 dari 10 dimensi. Klik klien untuk melihat dimensi → property → layanan → sumber data.', 'Score 0–100 from 10 dimensions. Open a client to see dimension → property → service → source data.')), wBtn) + strip +
        tabs([['health', 'Health', 'gauge'], ['profit', L('Profitabilitas', 'Profitability'), 'percent', null, 'com.margin.view'], ['growth', 'Growth', 'trend'], ['risk', L('Risiko', 'Risk'), 'alert']].filter(function (x) { return !x[4] || can(x[4]); }), tab, 'tab', { def: 'health' }) + body +
        card(L('Kesegaran data', 'Data freshness'), fresh(), { icon: 'refresh' });
    },
    act: {
      adj: function (el) {
        var cl = el.getAttribute('data-val');
        dlg({ title: L('Koreksi manual Client Health', 'Client Health manual adjustment'), sub: cname(cl) + ' · ' + t(L('skor ', 'score ')) + M.health(cl).score, icon: 'edit',
          body: fld(L('Koreksi (−10 s/d +10 poin)', 'Adjustment (−10 to +10 points)'), inp('d', '', { num: true }), { req: true }) + fld(L('Alasan', 'Reason'), area('reason', '', L('Contoh: GM baru, hubungan sangat baik setelah meeting', 'Example: new GM, very good relationship after the meeting')), { req: true }) + note(t(L('Koreksi tercatat di audit trail dan terlihat di skor.', 'The adjustment is audited and visible on the score.')), 'shield'),
          onOk: function (v) { var r = M.adjustHealth(cx(), cl, num(v.d), v.reason); if (!r.ok) return r.msg; after(L('Skor sekarang ' + r.score + '.', 'Score is now ' + r.score + '.')); return true; } });
      },
      weights: function () {
        var w = M.cfg().hw;
        dlg({ title: L('Bobot Client Health', 'Client Health weights'), sub: t(L('Total harus 100%.', 'Must total 100%.')), icon: 'cog',
          body: '<div class="f6-g">' + M.HEALTH_DIMS.map(function (d) { return fld(d.n, inp('w_' + d.k, w[d.k], { num: true })); }).join('') + '</div>' + '<p class="hh6" id="wt6"></p>' + fld(L('Alasan', 'Reason'), area('reason', ''), { req: true, wide: true }),
          after: function (el) { function upd() { var s = 0; el.querySelectorAll('[name^=w_]').forEach(function (f) { s += +f.value || 0; }); var o = el.querySelector('#wt6'); o.innerHTML = t(L('Total: ', 'Total: ')) + '<b class="' + (Math.abs(s - 100) > 0.01 ? 't6-crit' : 't6-ok') + '">' + s + '%</b>'; } el.addEventListener('input', upd); upd(); },
          onOk: function (v) { var nw = {}; M.HEALTH_DIMS.forEach(function (d) { nw[d.k] = num(v['w_' + d.k]); }); var r = M.setHealthWeights(cx(), nw, v.reason); if (!r.ok) return r.msg; after(L('Bobot disimpan. Skor dihitung ulang.', 'Weights saved. Scores recalculated.')); return true; } });
      }
    }
  };

  /* ================= NP-09 · OPP-001 Opportunity List ================= */
  V['OPP-001'] = {
    render: function (c) {
      var q = c.q, c0 = cx(), all = M.opps(c0), list = M.opps(c0, { cl: q.cl, stage: q.stage, type: q.type, owner: q.owner });
      var open0 = all.filter(function (o) { return ['won', 'lost'].indexOf(o.stage) < 0; }), won = all.filter(function (o) { return o.stage === 'won'; });
      var view = q.view || (mob() ? 'list' : 'board');
      var board = '<div class="kb6" role="list">' + M.OPP_STAGES.map(function (s) {
        var col = list.filter(function (o) { return o.stage === s[0]; });
        return '<section class="kb6-c" role="listitem"><h3>' + t(s[1]) + ' <span class="cnt num">' + col.length + '</span></h3><small class="sub5">' + rpj(col.reduce(function (a, o) { return a + o.weighted; }, 0)) + ' ' + t(L('tertimbang', 'weighted')) + '</small>' + (col.length ? col.map(function (o) {
          return '<a class="kb6-i" href="' + href('OPP-002', o.id) + '"><b>' + esc(T(o.n)) + '</b><small>' + cname(o.cl) + '</small><span class="kb6-f"><span class="num">' + rpj(o.rev) + '</span><small>' + pct(o.prob, 0) + ' · ' + dts(o.due) + '</small></span></a>';
        }).join('') : '<p class="kb6-e">—</p>') + '</section>';
      }).join('') + '</div>';
      var tbl = P.oppList ? A.list(list, [
        { h: 'Opportunity', v: function (o) { return '<b>' + esc(T(o.n)) + '</b><small class="sub5">' + esc(o.id) + ' · ' + t(M.OPP_TYPES[o.type]) + '</small>'; } },
        { h: L('Klien', 'Client'), v: function (o) { return cname(o.cl) + (o.prop ? '<small class="sub5">' + pname(o.prop) + '</small>' : ''); } },
        { h: L('Potensi/bln', 'Potential/mo'), cls: 'r num', v: function (o) { return rpj(o.rev); } },
        { h: 'Margin', cls: 'r num', perm: 'com.margin.view', v: function (o) { return o.margin != null ? pct(o.margin, 0) : '—'; } },
        { h: L('Prob.', 'Prob.'), cls: 'r num', v: function (o) { return pct(o.prob, 0); } },
        { h: L('Tertimbang', 'Weighted'), cls: 'r num', v: function (o) { return rpj(o.weighted); } },
        { h: L('Tahap', 'Stage'), v: function (o) { return oppChip(o.stage); } },
        { h: 'Next action', v: function (o) { return esc(T(o.next)) + '<small class="sub5">' + dt(o.due) + ' · ' + emp(o.owner) + '</small>'; } }
      ], function (o) { return { t: esc(T(o.n)), r: rpj(o.rev), s: cname(o.cl) + ' · ' + pct(o.prob, 0) + ' · ' + esc(T(o.next)), chip: oppChip(o.stage) }; }, function (o) { return href('OPP-002', o.id); }, { dense: true, empty: L('Belum ada opportunity.', 'No opportunity yet.') }) : '';
      return A.pageHead(null, t(L('Peluang dari data layanan, renewal dan property baru. Potensi tertimbang = potensi × probabilitas.', 'Opportunities from service data, renewals and new properties. Weighted = potential × probability.')), A.pbtn('com.opp.manage', 'primary', L('Opportunity baru', 'New opportunity'), 'plus', { act: 'oppNew', val: (q.cl || '') + '|' })) +
        tiles([tile({ k: L('Terbuka', 'Open'), v: open0.length, s: rpj(open0.reduce(function (a, o) { return a + o.rev; }, 0)) + t(L('/bln potensi', '/mo potential')) }), tile({ k: L('Tertimbang', 'Weighted'), v: rpj(open0.reduce(function (a, o) { return a + o.weighted; }, 0)), s: t(L('per bulan', 'per month')) }), tile({ k: L('Menang', 'Won'), v: won.length, s: rpj(won.reduce(function (a, o) { return a + o.rev; }, 0)) + t(L('/bln', '/mo')), tone: '' }), tile({ k: L('Jatuh tempo ≤ 7 hari', 'Due ≤ 7 days'), v: open0.filter(function (o) { return M.days(M.TODAY, o.due) <= 7; }).length, tone: open0.some(function (o) { return M.days(M.TODAY, o.due) < 0; }) ? 'warn' : '' })], 'tls5-4') +
        (mob() ? '' : tabs([['board', 'Pipeline', 'columns'], ['list', L('Daftar', 'List'), 'list']], view, 'view', { seg: true, def: 'board' })) +
        card('Opportunity', A.filters([{ k: 'cl', l: L('Klien', 'Client'), opts: clientOpts() }, { k: 'type', l: L('Tipe', 'Type'), opts: opts(M.OPP_TYPES) }, { k: 'owner', l: 'Owner', opts: amOpts() }].concat(view === 'list' || mob() ? [{ k: 'stage', l: L('Tahap', 'Stage'), opts: M.OPP_STAGES }] : []), { force: true }) + (view === 'board' && !mob() ? board : tbl), { icon: 'sparkles', count: list.length });
    },
    act: P.acts()
  };

  /* ================= NP-09 · OPP-002 Opportunity Detail ================= */
  V['OPP-002'] = {
    title: function (rec) { var o = M.opp(rec); return o ? o.n : 'Opportunity'; },
    render: function (c) {
      var o = M.opp(c.rec || 'OPP-001');
      if (!o || !M.canSeeClient(cx(), o.cl)) return A.stateCard('empty', L('Opportunity tidak ditemukan.', 'Opportunity not found.'), A.backBtn());
      var i0 = M.OPP_STAGES.map(function (s) { return s[0]; }).indexOf(o.stage), mg = can('com.opp.manage'), w = Math.round(o.rev * o.prob / 100);
      var stp = '<ol class="stp6">' + M.OPP_STAGES.filter(function (s) { return s[0] !== 'lost' || o.stage === 'lost'; }).map(function (s, i) { var j = M.OPP_STAGES.map(function (z) { return z[0]; }).indexOf(s[0]), cls = o.stage === 'lost' ? (s[0] === 'lost' ? 'now' : '') : j < i0 ? 'done' : j === i0 ? 'now' : ''; return '<li class="' + cls + '"><span class="stp6-n">' + (cls === 'done' ? ic('check') : i + 1) + '</span><span>' + t(s[1]) + '</span></li>'; }).join('') + '</ol>';
      var acts = mg && ['won', 'lost'].indexOf(o.stage) < 0 ? A.btn('primary', L('Pindah tahap', 'Move stage'), 'arrow', { act: 'stage', cls: 'btn-sm' }) + A.btn('ghost', 'Edit', 'edit', { act: 'edit', cls: 'btn-sm' }) + A.btn('ghost', L('Follow-up', 'Follow-up'), 'phone', { act: 'task', val: o.cl + '|followup|' + (o.prop || ''), cls: 'btn-sm' }) : '';
      var who = M.recommend(o.cl, o.prop || (o.props || [])[0], 'contract'), c1 = who && who.primary[0];
      return '<section class="card c6-hd"><div class="c6-hd-m"><span class="av6 av6-l" aria-hidden="true">' + ic('sparkles') + '</span><div class="c6-hd-t"><h1>' + esc(T(o.n)) + ' ' + oppChip(o.stage) + '</h1><p><span class="tg6">' + esc(o.id) + '</span><span class="tg6">' + t(M.OPP_TYPES[o.type]) + '</span>' + clLink(o.cl) + '</p></div></div>' + stp +
        kv([[L('Potensi revenue / bulan', 'Potential revenue / month'), '<b>' + rpFull(o.rev) + '</b>'], [L('Probabilitas', 'Probability'), pct(o.prob, 0)], [L('Tertimbang', 'Weighted'), rpj(w)], can('com.margin.view') ? [L('Potensi margin', 'Potential margin'), o.margin != null ? pct(o.margin, 0) : '—'] : null,
          ['Property', o.prop ? prLink(o.prop) : (o.props || []).map(function (p) { return prLink(p); }).join(', ') || t(L('Semua property', 'All properties'))], ['Owner', emp(o.owner)], ['Next action', '<b>' + esc(T(o.next)) + '</b>'], [L('Jatuh tempo', 'Due'), dt(o.due) + (M.days(M.TODAY, o.due) < 0 && ['won', 'lost'].indexOf(o.stage) < 0 ? ' ' + A.chip('warn', L('Lewat', 'Overdue')) : '')]]) +
        (acts ? '<div class="c6-hd-a">' + acts + '</div>' : '') + '</section>' +
        '<div class="grid2"><div>' + (o.notes ? card(L('Catatan', 'Notes'), '<p>' + esc(T(o.notes)) + '</p>', { icon: 'edit' }) : '') + (c1 ? card(L('Kontak', 'Contact'), '<ul class="rec6"><li>' + P.avatar(c1.n) + '<div><b>' + P.ctLink(c1.id) + '</b><small>' + esc(T(c1.pos)) + '</small></div>' + reach(c1) + '</li></ul>', { icon: 'idcard' }) : '') + '</div>' +
        '<div>' + (can('com.history.view') ? card(L('Riwayat', 'History'), timeline(M.timeline(o.cl).filter(function (e) { return e.rec === o.id; }), 10), { icon: 'history' }) : '') + '</div></div>';
    },
    act: P.acts({
      stage: function () {
        var o = M.opp(A.S.rec);
        dlg({ title: L('Pindah tahap', 'Move stage'), sub: esc(T(o.n)), icon: 'arrow', body: fld(L('Tahap', 'Stage'), sel('stage', M.OPP_STAGES.filter(function (s) { return s[0] !== o.stage; }), 'won')) + fld(L('Catatan / alasan', 'Note / reason'), area('note', '', L('Wajib bila kalah', 'Required when lost'))),
          onOk: function (v) { var r = M.moveOpp(cx(), o.id, v.stage, v.note); if (!r.ok) return r.msg; after(L('Tahap diperbarui.', 'Stage updated.')); return true; } });
      },
      edit: function () {
        var o = M.opp(A.S.rec);
        dlg({ title: L('Ubah opportunity', 'Edit opportunity'), sub: esc(o.id), icon: 'edit',
          body: fld(L('Nama', 'Name'), inp('n', T(o.n)), { req: true, wide: true }) + fld(L('Tipe', 'Type'), sel('type', opts(M.OPP_TYPES), o.type)) + fld(L('Potensi revenue / bulan (Rp)', 'Potential revenue / month (Rp)'), inp('rev', o.rev, { num: true })) + fld(L('Probabilitas (%)', 'Probability (%)'), inp('prob', o.prob, { num: true })) +
            (can('com.margin.view') ? fld(L('Potensi margin (%)', 'Potential margin (%)'), inp('margin', o.margin == null ? '' : o.margin, { num: true })) : '') + fld('Next action', inp('next', T(o.next))) + fld(L('Jatuh tempo', 'Due'), inp('due', o.due, { type: 'date' })) + fld(L('Catatan', 'Notes'), area('notes', T(o.notes))),
          onOk: function (v) { var r = M.saveOpp(cx(), { id: o.id, n: v.n === T(o.n) ? o.n : v.n, cl: o.cl, prop: o.prop, type: v.type, rev: num(v.rev), prob: num(v.prob), margin: v.margin === undefined ? o.margin : v.margin, next: v.next === T(o.next) ? o.next : v.next, due: v.due, owner: o.owner, notes: v.notes }); if (!r.ok) return r.msg; after(L('Opportunity diperbarui.', 'Opportunity updated.')); return true; } });
      }
    })
  };

  /* ================= CLT-COM-001 Client portal: My Services & Contract ================= */
  V['CLT-COM-001'] = {
    render: function (c) {
      var pt = M.portal(cx());
      if (!pt) return A.stateCard('noperm', M.MSG.scope);
      var tab = c.q.tab || 'svc';
      var body = '';
      if (tab === 'svc') body = pt.props.map(function (x) {
        return card(x.p.n, '<p class="sub5">' + ic('pin') + esc(x.p.addr || x.p.city) + ' · ' + ic('truck') + esc(T(x.p.pickup)) + '</p>' + (x.svcs.length ? A.list(x.svcs, [
          { h: L('Layanan', 'Service'), v: function (l) { return '<b>' + esc(l.sv.n) + '</b>'; } }, { h: L('Unit', 'Unit'), v: function (l) { return esc(l.sv.unit); } },
          { h: L('Harga kontrak', 'Contract price'), cls: 'r num', v: function (l) { return rpFull(l.rate); } }, { h: 'SLA', cls: 'r', v: function (l) { return l.sla + ' ' + t(L('jam', 'h')); } },
          { h: L('Instruksi', 'Instruction'), v: function (l) { return l.cfg && T(l.cfg.instr) ? esc(T(l.cfg.instr)) : '—'; } }
        ], function (l) { return { t: esc(l.sv.n), r: rpFull(l.rate), s: l.sla + ' ' + t(L('jam', 'h')) + ' · ' + esc(l.sv.unit) }; }, null, { dense: true }) : A.empty(L('Belum ada layanan aktif.', 'No active service yet.'))) +
          '<div class="pt6">' + (x.op ? '<div><small>' + t(L('PIC Anda', 'Your PIC')) + '</small><b>' + esc(x.op.n) + '</b></div>' : '') + '</div>', { icon: 'hotel' });
      }).join('');
      else if (tab === 'ctr') body = pt.contracts.length ? pt.contracts.map(function (x) {
        return card(x.no, kv([[L('Periode', 'Period'), dt(x.start) + ' – ' + dt(x.end)], [L('Sisa', 'Left'), left(M.days(M.TODAY, x.end))], ['Status', ctrSt(x)], [L('Termin', 'Terms'), 'Net ' + x.terms], [L('Siklus tagihan', 'Billing cycle'), t(M.CYCLE[x.cycle])], [L('Jadwal pickup', 'Pickup schedule'), esc(T(x.pickup))], ['Property', x.props.map(function (p) { return pname(p); }).join(', ')], [L('Syarat khusus', 'Special terms'), esc(T(x.special)) || '—']]), { icon: 'contract' });
      }).join('') : A.stateCard('empty', L('Belum ada kontrak aktif.', 'No active contract yet.'));
      else if (tab === 'sla') body = tiles([tile({ k: L('Tepat waktu bulan ini', 'On time this month'), v: pct(pt.sla.ot), s: pt.sla.n + ' order' }), tile({ k: L('Rata-rata waktu proses', 'Average turnaround'), v: (pt.sla.avgTat == null ? '—' : fmt.num(pt.sla.avgTat, 1)) + ' ' + t(L('jam', 'h')) })], 'tls5-3') +
        card(L('Order berjalan', 'Orders in progress'), pt.sla.live.filter(function (k) { return !k.done; }).length ? '<ul class="ck6l">' + pt.sla.live.filter(function (k) { return !k.done; }).map(function (k) { return '<li class="ck6l-i"><div class="ck6l-h"><b class="mono6">' + esc(k.id) + '</b> ' + (k.paused ? A.chip('info', L('Dijeda', 'Paused')) : k.lvl === 'crit' ? A.chip('warn', L('Sedikit terlambat', 'Slightly late')) : A.chip('ok', L('Sesuai jadwal', 'On schedule'))) + '<span class="sub5">' + pname(k.o.prop) + ' · ' + sname(k.o.svc) + '</span></div><small>' + t(L('Perkiraan selesai ', 'Expected ')) + H.dtt(k.due) + '</small></li>'; }).join('') + '</ul>' : A.empty(L('Tidak ada order berjalan.', 'No order in progress.')), { icon: 'clock' });
      else body = card(L('Dokumen', 'Documents'), pt.docs.length ? '<ul class="ln6">' + pt.docs.map(function (d) { return '<li>' + ic('file') + '<div><b>' + esc(d.n) + '</b> <span class="tg6">v' + d.v + '</span><small>' + t(M.DOC_TYPES[d.type]) + ' · ' + dt(d.date) + ' · ' + esc(d.file) + '</small></div></li>'; }).join('') + '</ul>' : A.empty(L('Belum ada dokumen yang dibagikan.', 'No shared document yet.')), { icon: 'file' });
      return A.pageHead(null, esc(pt.c.n) + ' · Account Manager: ' + esc(pt.am)) +
        tabs([['svc', L('Layanan', 'Services'), 'washer'], ['ctr', L('Kontrak', 'Contract'), 'contract'], ['sla', 'SLA', 'clock'], ['doc', L('Dokumen', 'Documents'), 'file']], tab, 'tab', { def: 'svc' }) + body +
        note(t(L('Hanya data akun Anda yang ditampilkan. Untuk perubahan harga atau kontrak, hubungi Account Manager.', 'Only your account data is shown. For price or contract changes, contact your Account Manager.')), 'lock');
    }
  };

  /* Phase 2 commercial routes → the Phase 6 screen (no duplicate commercial screens). */
  Object.keys(M.ALIAS).forEach(function (old) {
    var to = M.ALIAS[old];
    V[old] = { render: function (c) { setTimeout(function () { if (location.hash.indexOf('/' + old) >= 0) location.replace(href(to, c.rec, c.q)); }, 0); return A.stateCard('empty', L('Layar ini sudah digabung ke modul Klien & Komersial.', 'This screen is now part of the Clients & Commercial module.'), A.btn('blue', L('Buka', 'Open'), 'arrow', { go: to, rec: c.rec }), L('Membuka layar baru…', 'Opening the new screen…')); } };
  });
})();
