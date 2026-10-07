/* JFRESH OS — Phase 8 screens (part 3): supervisor layer (Production Command Center PROD-CMD-001,
   capacity PROD-CAP-001, machine live status PROD-MACH-001, production issue center PROD-ISSUE-001,
   batch traceability PROD-TRACE-001, production KPI PROD-KPI-001), the daily operational checklist
   (CHK-001..005) and preventive maintenance (MNT-001..006). Uses A.P8 from screens-prod.js. */
(function () {
  var A = window.JFAPP, E = window.JFPROD, H = A && A.P5, G = A && A.P7, P = A && A.P8;
  if (!A || !E || !H || !G || !P) return;
  var V = A.V, T = A.T, L = A.L, t = A.t, esc = A.esc, ic = A.ic, can = A.can, href = A.href;
  var lnk = H.lnk, tabs = H.tabs, card = H.card, kv = H.kv, note = H.note, tile = H.tile, tiles = H.tiles, dlg = H.dlg, fld = H.fld, inp = H.inp, sel = H.sel, area = H.area;
  var after = G.after, fail = G.fail, vals = G.vals, choice = G.choice, photoIn = G.photoIn, photos = G.photos, resetPh = G.resetPh, img = G.img, when = G.when, minT = G.minT;
  var cx = P.cx, hm = P.hm, kg = P.kg, pcs = P.pcs, cname = P.cname, pname = P.pname, first = P.first, emp = P.emp, priC = P.priC, stgC = P.stgC, slaC = P.slaC, machC = P.machC, bLink = P.bLink, sevC = P.sevC, teamName = P.teamName, stIcon = P.stIcon;
  var qrow = P.qrow, qlist = P.qlist, hero = P.hero, abar = P.abar, xl = P.xl, step8 = P.step8, bigCount = P.bigCount, issueDlg = P.issueDlg, reasonDlg = P.reasonDlg, live = P.live, utilBar = P.utilBar, freshTag = P.freshTag, go = P.go, issueCard = P.issueCard;
  function D() { return E.D || {}; }
  function staffName(id) { return E.empName(id); }
  function mType(m) { return E.MACH_TYPES[m.type] || ['', 'washer']; }

  /* ================= NP-10 · PROD-CMD-001 Production Command Center ================= */
  var BOARD_GO = { rcv: 'PROD-RCV-001', sort: 'PROD-SORT-001', wash: 'PROD-WASH-001', dry: 'PROD-DRY-001', fin: 'PROD-FIN-001', qc: 'PROD-QC-001', pack: 'PROD-PACK-001', rtd: 'PROD-READY-001' };
  var BOARD_IC = { rcv: 'inbox', sort: 'layers', wash: 'droplet', dry: 'wind', fin: 'iron', qc: 'search', pack: 'package', rtd: 'truck' };
  function board() {
    return '<div class="bd8">' + E.board().map(function (s) {
      var tone = s.late ? 'crit' : s.capSt === 'crit' ? 'crit' : s.risk || s.capSt === 'warn' ? 'warn' : 'ok';
      return '<a class="bd8-i bd8-' + tone + '" href="' + href(BOARD_GO[s.k]) + '"><span class="bd8-h">' + ic(BOARD_IC[s.k]) + '<b>' + t(s.n) + '</b></span>' +
        '<span class="bd8-n"><span><b class="num">' + s.queue + '</b><small>' + t(L('antri', 'queue')) + '</small></span><span><b class="num">' + s.proc + '</b><small>' + t(L('proses', 'in process')) + '</small></span></span>' +
        '<span class="bd8-kg num">' + kg(s.kg) + '</span>' + (s.cap != null ? utilBar(s.cap) : '<span class="bd8-nc">—</span>') +
        '<span class="bd8-f">' + (s.late ? A.chip('crit', L(s.late + ' telat', s.late + ' late'), 'alert') : '') + (s.risk ? A.chip('warn', L(s.risk + ' risiko', s.risk + ' at risk'), 'clock') : '') + (s.issues ? A.chip('crit', L(s.issues + ' masalah', s.issues + ' issues'), 'bell') : '') + (!s.late && !s.risk && !s.issues ? A.chip('ok', L('Lancar', 'Smooth'), 'checkc') : '') + '</span></a>';
    }).join('') + '</div>';
  }
  function topTiles() {
    var x = E.top();
    return tiles([
      tile({ k: L('Antrian', 'Queue'), v: x.queue, s: t(L('semua tahap', 'all stages')) }), tile({ k: L('Diproses', 'In process'), v: x.proc, s: t(L('mesin & meja kerja', 'machines & stations')) }),
      tile({ k: L('Risiko SLA', 'SLA risk'), v: x.risk, tone: x.risk ? 'warn' : '', s: t(L('batch', 'batches')) }), tile({ k: L('Terlambat', 'Late'), v: x.late, tone: x.late ? 'crit' : '', s: t(L('batch', 'batches')) }),
      tile({ k: L('Rework terbuka', 'Open rework'), v: x.rework, tone: x.rework ? 'warn' : '', href: href('PROD-REWASH-001'), s: t(L('QC → proses ulang', 'QC → reprocess')) }), tile({ k: L('Siap kirim', 'Ready to deliver'), v: x.rtd, tone: 'ok', href: href('PROD-READY-001'), s: t(L('menunggu Logistics', 'waiting for Logistics')) })
    ], 'tls8');
  }
  var INS_IC = { util: 'gauge', growth: 'arrowup', down: 'wrench', staff: 'users', slow: 'clock', sla: 'alert' };
  function insights() {
    var list = E.insights();
    if (!list.length) return A.empty(L('Tidak ada bottleneck. Semua tahap berjalan normal.', 'No bottleneck. All stages are running normally.'));
    return '<ul class="ins8">' + list.map(function (x) {
      var link = x.batch ? bLink(x.batch, t(L('Telusur', 'Trace'))) : x.mach ? (can('mnt.view') ? lnk('MNT-003', x.mach, t(L('Lihat mesin', 'View machine'))) : '') : x.stage && BOARD_GO[x.stage] ? lnk(BOARD_GO[x.stage], null, t(L('Buka antrian', 'Open queue'))) : x.k === 'staff' && can('prod.spv') ? '<button class="lnk5" data-act="staff">' + t(L('Pindah staf', 'Move staff')) + '</button>' : '';
      return '<li class="ins8-' + x.sev + '"><span class="ins8-ic">' + ic(INS_IC[x.k] || 'info') + '</span><span>' + t(x.txt) + '</span>' + (link ? '<span class="ins8-a">' + link + '</span>' : '') + '</li>';
    }).join('') + '</ul>';
  }
  function watchRows() {
    var B = E.state().batches.filter(function (b) { return ['handed', 'merged'].indexOf(b.stage) < 0 && (E.slaState(b) !== 'ok' || b.stage === 'hold' || b.esc || E.priRank(b.pri) >= 4); }).sort(function (a, b) { var r = { late: 0, risk: 1, ok: 2 }; return r[E.slaState(a)] - r[E.slaState(b)] || E.priRank(b.pri) - E.priRank(a.pri); });
    if (!B.length) return A.empty(L('Tidak ada batch berisiko.', 'No batch at risk.'));
    return '<div class="q8l">' + B.map(function (b) {
      var acts = can('prod.spv') ? '<span class="wt8-a">' + A.btn('ghost', L('Prioritas', 'Priority'), 'zap', { act: 'pri', val: b.id, cls: 'btn-sm' }) +
        (b.stage === 'hold' ? A.btn('blue', L('Lanjutkan', 'Resume'), 'play', { act: 'resume', val: b.id, cls: 'btn-sm' }) : A.btn('ghost', L('Tahan', 'Hold'), 'pause', { act: 'hold', val: b.id, cls: 'btn-sm' })) +
        (['ready', 'ho12', 'wash_q'].indexOf(b.stage) >= 0 ? A.btn('ghost', L('Ganti mesin', 'Change machine'), 'washer', { act: 'mach', val: b.id, cls: 'btn-sm' }) : '') +
        A.btn('ghost', L('Tugaskan', 'Assign'), 'user', { act: 'assign', val: b.id, cls: 'btn-sm' }) + (b.esc ? A.chip('crit', L('Dieskalasi', 'Escalated'), 'arrowup') : A.btn('ghost', L('Eskalasi', 'Escalate'), 'arrowup', { act: 'esc', val: b.id, cls: 'btn-sm' })) + '</span>' : '';
      return '<div class="wt8">' + qrow(b, href('PROD-TRACE-001', b.id), { chip: stgC(b), meta: b.assignee ? '<span>' + ic('user') + first(b.assignee) + '</span>' : '' }) + acts + '</div>';
    }).join('') + '</div>';
  }
  function teamOf(b) { var s = b.stage === 'hold' && b.hold ? b.hold.prev : b.stage; return ['ready', 'ho12'].indexOf(s) >= 0 ? 't1' : ['wash_q', 'washing', 'dry_q', 'drying', 'fin_ready'].indexOf(s) >= 0 ? 't2' : 't3'; }
  var SPV = {
    pri: function (el) {
      var id = el.getAttribute('data-val'), b = E.batch(id);
      dlg({ title: L('Ubah prioritas', 'Change priority'), icon: 'zap', sub: '<b class="mono6">' + esc(id) + '</b> · ' + cname(b.cl), ok: L('Simpan', 'Save'),
        body: fld(L('Prioritas', 'Priority'), choice('pri', Object.keys(E.PRI).map(function (k) { return [k, E.PRI[k][0], null, E.priRank(k) >= 4 ? 'crit' : null]; }), b.pri), { req: true, wide: true }) + fld(L('Alasan', 'Reason'), area('reason', '', L('Mengapa prioritas diubah?', 'Why is the priority changed?')), { req: true, wide: true }),
        onOk: function (v, e2) { v = vals(e2); var r = E.spvPrioritize(cx(), id, v.pri, v.reason); if (!r.ok) return r.msg; after(L('Prioritas diubah dan tercatat di audit.', 'Priority changed and recorded in the audit.')); return true; } });
    },
    hold: function (el) { var id = el.getAttribute('data-val'); reasonDlg({ title: L('Tahan batch', 'Hold the batch'), icon: 'pause', sub: '<b class="mono6">' + esc(id) + '</b>', done: L('Batch ditahan. Tim melihat status tahan.', 'Batch on hold. The team sees the hold status.'), fn: function (n0) { return E.spvHold(cx(), id, n0); } }); },
    resume: function (el) { var id = el.getAttribute('data-val'); reasonDlg({ title: L('Lanjutkan batch', 'Resume the batch'), icon: 'play', sub: '<b class="mono6">' + esc(id) + '</b>', label: L('Catatan', 'Note'), done: L('Batch dilanjutkan.', 'Batch resumed.'), fn: function (n0) { return E.spvResume(cx(), id, n0); } }); },
    mach: function (el) {
      var id = el.getAttribute('data-val'), b = E.batch(id), list = E.washers().filter(function (m) { return E.machAvail(m) || m.id === b.mach; });
      dlg({ title: L('Ganti mesin', 'Change machine'), icon: 'washer', sub: '<b class="mono6">' + esc(id) + '</b> · ' + kg(b.kg) + ' · ' + t(L('sekarang ', 'now ')) + esc(b.mach || '—'), ok: L('Simpan', 'Save'),
        body: fld(L('Mesin', 'Machine'), sel('mach', list.map(function (m) { return [m.id, m.id + ' · ' + m.cap + ' kg · ' + Math.round(b.kg / m.cap * 100) + '%']; }), b.mach), { req: true, wide: true }) + fld(L('Alasan', 'Reason'), area('reason', '', L('Mengapa mesin diganti?', 'Why change the machine?')), { req: true, wide: true }),
        onOk: function (v, e2) { v = vals(e2); var r = E.spvMachine(cx(), id, v.mach, v.reason); if (!r.ok) return r.msg; after(L('Mesin batch diganti.', 'Batch machine changed.')); return true; } });
    },
    assign: function (el) {
      var id = el.getAttribute('data-val'), b = E.batch(id), tm = teamOf(b), list = E.onShift(tm);
      dlg({ title: L('Tugaskan operator', 'Assign an operator'), icon: 'user', sub: '<b class="mono6">' + esc(id) + '</b> · ' + teamName(tm), ok: L('Simpan', 'Save'),
        body: fld(L('Operator', 'Operator'), choice('emp', list.map(function (e) { return [e, E.first(e)]; }), b.assignee || list[0], { cls: 'ch8-who' }), { req: true, wide: true }) + fld(L('Catatan', 'Note'), area('reason', '', L('Opsional', 'Optional')), { wide: true }),
        onOk: function (v, e2) { v = vals(e2); var r = E.spvAssign(cx(), id, v.emp, v.reason); if (!r.ok) return r.msg; after(L('Operator ditugaskan.', 'Operator assigned.')); return true; } });
    },
    esc: function (el) { var id = el.getAttribute('data-val'); reasonDlg({ title: L('Eskalasi ke Operations Manager', 'Escalate to the Operations Manager'), icon: 'arrowup', sub: '<b class="mono6">' + esc(id) + '</b>', done: L('Dieskalasi. Operations Manager menerima notifikasi.', 'Escalated. The Operations Manager is notified.'), fn: function (n0) { return E.spvEscalate(cx(), id, n0); } }); },
    staff: function () {
      var all = []; ['t1', 't2', 't3'].forEach(function (tm) { E.onShift(tm).forEach(function (e) { if (all.indexOf(e) < 0) all.push(e); }); });
      dlg({ title: L('Pindahkan staf antar tim', 'Move staff between teams'), icon: 'users', sub: t(L('Untuk menutup kekurangan orang di tahap yang padat.', 'To cover a short-staffed, busy stage.')), ok: L('Pindahkan', 'Move'),
        body: fld(L('Staf', 'Staff'), sel('emp', all.map(function (e) { return [e, staffName(e) + ' · ' + T(E.TEAMS[(D().STAFF[e] || {}).team] ? E.TEAMS[D().STAFF[e].team].short : '')]; }), all[0]), { req: true, wide: true }) +
          fld(L('Ke tim', 'To team'), choice('team', ['t1', 't2', 't3'].map(function (k) { return [k, E.TEAMS[k].short, stIcon(k)]; }), 't3'), { req: true, wide: true }) + fld(L('Alasan', 'Reason'), area('reason', '', L('Mengapa dipindah?', 'Why move?')), { req: true, wide: true }),
        onOk: function (v, e2) { v = vals(e2); var r = E.spvStaff(cx(), v.emp, v.team, v.reason); if (!r.ok) return r.msg; after(L('Staf dipindahkan. Kapasitas dihitung ulang.', 'Staff moved. Capacity recalculated.')); return true; } });
    },
    maint: function () {
      var ms = E.state().mach;
      dlg({ title: L('Minta maintenance', 'Request maintenance'), icon: 'wrench', ok: L('Buat Work Order', 'Create Work Order'),
        body: fld(L('Mesin', 'Machine'), sel('mach', ms.map(function (m) { return [m.id, m.id + ' · ' + T(m.n)]; }), ms[0].id), { req: true, wide: true }) +
          fld(L('Tingkat keparahan', 'Severity'), choice('sev', Object.keys(E.SEV).map(function (k) { return [k, E.SEV[k][0], null, k === 'crit' || k === 'high' ? 'crit' : null]; }), 'med'), { req: true, wide: true }) +
          fld(L('Masalah', 'Issue'), area('issue', '', L('Apa yang terjadi pada mesin?', 'What is wrong with the machine?')), { req: true, wide: true }) + fld(L('Dampak', 'Impact'), inp('impact', '', { ph: L('mis. kapasitas drying turun', 'e.g. drying capacity down') }), { wide: true }),
        onOk: function (v, e2) { v = vals(e2); var r = E.spvMaint(cx(), v.mach, v); if (!r.ok) return r.msg; after(L('Work order ' + r.wo.id + ' dibuat.', 'Work order ' + r.wo.id + ' created.')); return true; } });
    }
  };
  V['PROD-CMD-001'] = {
    render: function () {
      return A.pageHead(null, '<span id="cmd8-f">' + freshTag() + '</span> · ' + esc(E.state().cfg ? T(L('Main Plant — Ubud', 'Main Plant — Ubud')) : ''),
        (can('prod.spv') ? A.btn('ghost', L('Pindah Staf', 'Move Staff'), 'users', { act: 'staff' }) + A.btn('ghost', L('Minta Maintenance', 'Request Maintenance'), 'wrench', { act: 'maint' }) : '') + A.btn('blue', L('Kapasitas', 'Capacity'), 'chart', { go: 'PROD-CAP-001' })) +
        '<div id="cmd8-top">' + topTiles() + '</div>' +
        card(L('Live board produksi', 'Live production board'), '<div id="cmd8-bd">' + board() + '</div>', { icon: 'factory' }) +
        '<div class="g8-2">' + card(L('Bottleneck & peringatan', 'Bottlenecks & alerts'), insights(), { icon: 'alert' }) +
        card(L('Mesin', 'Machines'), '<div id="cmd8-ms">' + P.machStrip(['washer', 'dryer', 'ironer']) + '</div>', { icon: 'washer', link: ['PROD-MACH-001', L('Semua mesin', 'All machines')] }) + '</div>' +
        card(L('Batch perlu perhatian', 'Batches needing attention'), watchRows(), { icon: 'flag' });
    },
    after: function () {
      live('cmd8-f', function () { return freshTag(); }, 15);
      live('cmd8-bd', board, 15); live('cmd8-top', topTiles, 15); live('cmd8-ms', function () { return P.machStrip(['washer', 'dryer', 'ironer']); }, 15);
    },
    act: SPV
  };

  /* ================= PROD-CAP-001 Capacity ================= */
  V['PROD-CAP-001'] = {
    render: function () {
      var cap = E.capacity(), c0 = E.cfg(), names = { rcv: L('Receiving', 'Receiving'), sort: L('Sorting', 'Sorting'), wash: L('Washing', 'Washing'), dry: L('Drying', 'Drying'), fin: L('Finishing', 'Finishing'), qc: L('QC', 'QC'), pack: L('Packing', 'Packing') };
      var rows = Object.keys(cap).map(function (k) {
        var x = cap[k];
        return '<div class="cp8 cp8-' + x.st + '"><span class="cp8-h">' + ic(BOARD_IC[k]) + '<b>' + t(names[k]) + '</b>' + A.chip(x.st === 'crit' ? 'crit' : x.st === 'warn' ? 'warn' : 'ok', x.st === 'crit' ? L('Penuh', 'Full') : x.st === 'warn' ? L('Hampir penuh', 'Near full') : L('Normal', 'Normal')) + '</span>' +
          utilBar(x.pct, { warn: c0.capWarn }) + '<span class="cp8-f num">' + kg(x.load) + ' / ' + kg(x.cap) + ' · ' + t(L('2 jam ke depan', 'next 2 hours')) + '</span></div>';
      }).join('');
      var staff = ['t1', 't2', 't3'].map(function (tm) { var on = E.onShift(tm).length, need = E.TEAMS[tm].need; return '<li class="' + (on < need ? 'sh8-warn' : '') + '">' + ic(stIcon(tm)) + '<b>' + teamName(tm) + '</b><span class="num">' + on + '/' + need + '</span>' + (on < need ? A.chip('warn', L('Kurang ' + (need - on), (need - on) + ' short')) : A.chip('ok', L('Cukup', 'Enough'))) + '</li>'; }).join('');
      var ms = E.state().mach.filter(function (m) { return ['washer', 'dryer'].indexOf(m.type) >= 0; });
      var mline = ['washer', 'dryer'].map(function (ty) { var l = ms.filter(function (m) { return m.type === ty; }), ok = l.filter(function (m) { return ['normal', 'idle', 'running'].indexOf(m.st) >= 0; }); return [mType({ type: ty })[0], ok.length + '/' + l.length + ' · ' + ok.reduce(function (s, m) { return s + m.cap; }, 0) + ' kg'] ; });
      return A.pageHead(null, t(L('Beban (antrian + proses) dibanding kapasitas tiap tahap untuk dua jam ke depan. Peringatan di ' + c0.capWarn + '%, kritis di ' + c0.capCrit + '%.', 'Load (queue + in process) against each stage\'s capacity for the next two hours. Warning at ' + c0.capWarn + '%, critical at ' + c0.capCrit + '%.'))) +
        '<div class="cp8l">' + rows + '</div>' +
        '<div class="g8-2">' + card(L('Staf per tim', 'Staff per team'), '<ul class="st8">' + staff + '</ul>' + (can('prod.spv') ? '<div class="bt8">' + A.btn('ghost', L('Pindah Staf', 'Move Staff'), 'users', { act: 'staff' }) + '</div>' : ''), { icon: 'users' }) +
        card(L('Mesin tersedia', 'Available machines'), kv(mline) + note(t(L('Mesin perbaikan, error dan offline tidak dihitung.', 'Machines in repair, error or offline are not counted.')), 'info'), { icon: 'washer', link: ['PROD-MACH-001', L('Status mesin', 'Machine status')] }) + '</div>' +
        card(L('Bottleneck', 'Bottlenecks'), insights(), { icon: 'alert' });
    },
    act: SPV
  };

  /* ================= PROD-MACH-001 Machine Live Status ================= */
  var MGROUP = { '': null, wash: ['washer'], dry: ['dryer'], fin: ['ironer', 'fold', 'iron'], util: ['boiler', 'filter', 'ipal'] };
  function machCards(types) {
    return '<div class="mc8l">' + E.machinesLive(types).map(function (x) {
      var m = x.m, b = x.b, left = b && x.end ? Math.round((E.ms(x.end) - E.now()) / 60000) : null, tag = can('mnt.view') ? 'a' : 'div';
      return '<' + tag + ' class="card mc8c mc8-' + m.st + '"' + (tag === 'a' ? ' href="' + href('MNT-003', m.id) + '"' : '') + '><span class="mc8c-h"><span class="mc8c-ic">' + ic(mType(m)[1]) + '</span><span><b>' + esc(m.id) + '</b><small>' + t(m.n) + '</small></span>' + machC(m) + '</span>' +
        (b ? '<span class="mc8c-b"><span class="mono6">' + esc(b.id) + '</span> · ' + cname(b.cl) + '</span><span class="mc8c-r"><span>' + t(L('Mulai', 'Start')) + ' <b class="num">' + hm(x.start) + '</b></span><span>' + t(L('Selesai', 'Finish')) + ' <b class="num">' + hm(x.end) + '</b></span><span class="' + (left < 0 ? 't-crit' : '') + '"><b class="num">' + esc(left >= 0 ? minT(left) : '+' + minT(-left)) + '</b></span></span>' :
          '<span class="mc8c-b sub5">' + (m.st === 'offline' && m.why ? t(m.why) : x.wo ? esc(x.wo.id) + ' · ' + t(E.WO_ST[x.wo.st][0]) : t(L('Tidak ada batch', 'No batch'))) + '</span>') +
        '<span class="mc8c-f">' + (x.util != null ? '<span>' + t(L('Utilisasi hari ini', 'Utilisation today')) + utilBar(x.util, { warn: 95 }) + '</span>' : '') + (x.load != null ? '<span>' + t(L('Muatan', 'Load')) + ' <b class="num">' + x.load + '%</b></span>' : '') +
        (x.pm ? '<span>' + ic('wrench') + t(L('PM ', 'PM ')) + '<b>' + esc(G.day(x.pm.next)) + '</b></span>' : '') + '</span></' + tag + '>';
    }).join('') + '</div>';
  }
  V['PROD-MACH-001'] = {
    render: function (c) {
      var g = c.q.g || '', all = E.state().mach;
      function n(k) { return MGROUP[k] ? all.filter(function (m) { return MGROUP[k].indexOf(m.type) >= 0; }).length : all.length; }
      var bad = all.filter(function (m) { return ['error', 'repair'].indexOf(m.st) >= 0; });
      return A.pageHead(null, '<span id="mc8-f">' + freshTag() + '</span>', can('prod.issue') ? A.btn('danger', L('ADA MASALAH MESIN', 'MACHINE ISSUE'), 'alert', { act: 'issue' }) : '') +
        (bad.length ? note(t(L(bad.length + ' mesin bermasalah: ', bad.length + ' machines with a problem: ')) + bad.map(function (m) { return esc(m.id); }).join(', '), 'wrench', 'crit') : '') +
        tabs([['', L('Semua', 'All'), 'grid', n('')], ['wash', L('Washer', 'Washers'), 'washer', n('wash')], ['dry', L('Dryer', 'Dryers'), 'wind', n('dry')], ['fin', L('Finishing', 'Finishing'), 'iron', n('fin')], ['util', L('Utilitas', 'Utilities'), 'zap', n('util')]], g, 'g', { def: '' }) +
        '<div id="mc8-l">' + machCards(MGROUP[g]) + '</div>';
    },
    after: function (c) { var g = c.q.g || ''; live('mc8-l', function () { return machCards(MGROUP[g]); }, 15); live('mc8-f', function () { return freshTag(); }, 15); },
    act: { issue: function () { issueDlg({ stage: 'master', type: 'mach', action: 'maint' }); } }
  };

  /* ================= PROD-ISSUE-001 Production Issue Center ================= */
  V['PROD-ISSUE-001'] = {
    render: function (c) {
      var tab = c.q.tab || '', S0 = E.state();
      var iss = E.issueList(cx(), { open: true }), hos = S0.ho.filter(function (h) { return h.st === 'difference'; }), rws = E.reworks({ open: true });
      var revs = S0.rcv.filter(function (r) { return (r.dis && r.dis.review === 'pending') || (r.wdis && r.wdis.review === 'pending'); });
      var body;
      if (tab === 'ho') body = hos.length ? hos.map(function (h) {
        var k = E.HO_KIND[h.kind], scr = { t1t2: 'PROD-HO-001', t2t3: 'PROD-HO-002', t3log: 'PROD-HO-003' }[h.kind];
        return '<section class="card is8 is8-high"><div class="is8-h">' + A.chip('crit', L('Selisih handover', 'Handover difference'), 'swap') + '<b>' + t(k.n) + '</b><span class="sub5 num">' + esc(h.id) + ' · ' + when(h.recAt) + '</span></div>' +
          '<p>' + esc(h.diff ? h.diff.note : '') + '</p><div class="is8-m"><span>' + ic('package') + bLink(h.batch) + '</span><span>' + ic('user') + first(h.sender) + ' → ' + first(h.receiver) + '</span>' + (h.diff && h.diff.qty ? '<span>' + ic('layers') + '<b class="num">' + (h.diff.qty > 0 ? '+' : '') + h.diff.qty + ' pcs</b></span>' : '') + (h.diff && h.diff.kg ? '<span>' + ic('scale') + '<b class="num">' + (h.diff.kg > 0 ? '+' : '') + h.diff.kg + ' kg</b></span>' : '') + '</div>' +
          '<div class="ho8-a">' + A.btn('blue', L('Putuskan', 'Decide'), 'arrow', { go: scr, qs: 'ho=' + h.id, cls: 'btn-sm' }) + '</div></section>';
      }).join('') : A.empty(L('Tidak ada selisih handover.', 'No handover differences.'));
      else if (tab === 'rw') body = rws.length ? '<div class="q8l">' + rws.map(function (r) {
        var b = E.batch(r.batch), x = E.RW_ST[r.st];
        return '<a class="q8" href="' + href('PROD-REWASH-001') + '"><span class="q8-i">' + ic('refresh') + '</span><span class="q8-b"><span class="q8-h"><b class="mono6">' + esc(r.id) + '</b>' + A.chip(x[1], x[0]) + '</span><b class="q8-t">' + t(E.QC_FAIL[r.reason] || r.reason) + ' · ' + r.qty + ' pcs</b><span class="q8-s">' + esc(r.batch) + (b ? ' · ' + cname(b.cl) : '') + ' · ' + t(E.RESP[r.resp] || r.resp) + '</span></span><span class="q8-r">' + ic('chevr', 'q8-go') + '</span></a>';
      }).join('') + '</div>' : A.empty(L('Tidak ada rework terbuka.', 'No open rework.'));
      else if (tab === 'rev') body = revs.length ? '<div class="q8l">' + revs.map(function (r) {
        var w = r.wdis && r.wdis.review === 'pending';
        return '<a class="q8 q8-risk" href="' + href(w ? 'PROD-SORT-002' : 'PROD-RCV-002', r.id) + '"><span class="q8-i">' + ic(w ? 'scale' : 'inbox') + '</span><span class="q8-b"><span class="q8-h"><b class="mono6">' + esc(r.id) + '</b>' + A.chip('appr', w ? L('Review berat', 'Weight review') : L('Review selisih receiving', 'Receiving difference review'), 'user') + '</span><b class="q8-t">' + cname(r.cl) + '</b><span class="q8-s">' + pname(r.prop) + '</span></span><span class="q8-r">' + ic('chevr', 'q8-go') + '</span></a>';
      }).join('') + '</div>' : A.empty(L('Tidak ada review menunggu.', 'No review waiting.'));
      else body = iss.length ? iss.map(function (i) { return issueCard(i, { manage: can('prod.issue.manage') }); }).join('') : A.empty(L('Tidak ada masalah terbuka.', 'No open issue.'));
      return A.pageHead(null, t(L('Semua yang perlu keputusan supervisor, diurutkan menurut keparahan.', 'Everything that needs a supervisor decision, sorted by severity.')), A.pbtn('prod.issue', 'primary', L('ADA MASALAH', 'REPORT ISSUE'), 'alert', { act: 'new' })) +
        tabs([['', L('Masalah', 'Issues'), 'alert', iss.length], ['ho', L('Selisih handover', 'Handover differences'), 'swap', hos.length], ['rw', L('Rework', 'Rework'), 'refresh', rws.length], ['rev', L('Review', 'Reviews'), 'user', revs.length]], tab, 'tab', { def: '' }) + body;
    },
    act: {
      new: function () { issueDlg({ stages: P.STAGES_OF.all, stage: 'master' }); },
      resolve: function (el) { var id = el.getAttribute('data-val'); reasonDlg({ title: L('Selesaikan masalah', 'Resolve the issue'), sub: esc(id), label: L('Penyelesaian', 'Resolution'), fn: function (n0) { return E.resolveIssue(cx(), id, n0); } }); }
    }
  };

  /* ================= PROD-TRACE-001 Batch Traceability ================= */
  var TL_IC = { arrive: 'truck', rcv: 'inbox', wgt: 'scale', sort: 'layers', batch: 'grid', ho: 'swap', wash: 'droplet', dry: 'wind', fin: 'iron', qc: 'search', rework: 'refresh', pack: 'package', rtd: 'checkc', hold: 'pause', issue: 'alert' };
  V['PROD-TRACE-001'] = {
    title: function (rec) { return rec ? L('Telusur ' + rec, 'Trace ' + rec) : L('Telusur Batch', 'Batch Traceability'); },
    render: function (c) {
      var x = c.rec ? E.trace(c.rec) : null;
      if (!x) {
        var qs = String(c.q.s || '').toLowerCase(), B = E.state().batches.filter(function (b) { return !qs || (b.id + ' ' + E.clientName(b.cl) + ' ' + E.propName(b.prop) + ' ' + (b.dlv || '')).toLowerCase().indexOf(qs) >= 0; }).slice().reverse();
        return A.pageHead(null, t(L('Cari batch, klien, property atau order untuk melihat perjalanannya dari manifest sampai Logistics.', 'Search a batch, client, property or order to see its journey from manifest to Logistics.'))) +
          '<form class="sr8" data-act="search" onsubmit="return false"><input type="search" name="s" value="' + esc(c.q.s || '') + '" placeholder="' + esc(T(L('mis. B-2610-004 atau nama hotel', 'e.g. B-2610-004 or a hotel name'))) + '" aria-label="' + esc(T(L('Cari batch', 'Search batch'))) + '">' + A.btn('blue', L('Cari', 'Search'), 'search', { act: 'search' }) + '</form>' +
          qlist(B.map(function (b) { return qrow(b, href('PROD-TRACE-001', b.id), { chip: stgC(b) }); }), L('Batch tidak ditemukan.', 'No batch found.'));
      }
      var b = x.b, o = x.dlv;
      var flow = '<ol class="tr8">' + x.ho.map(function (h) { var k = E.HO_KIND[h.kind], st = h.ho ? E.HO_ST[h.ho.st] : null; return '<li class="' + (h.ho ? 'ho8-' + h.ho.st : '') + '"><span class="hf8-t">' + t(k.n) + '</span>' + (st ? A.chip(st[1], st[0]) + '<small class="num">' + when(h.ho.recAt || h.ho.at) + '</small>' : '<small>' + t(L('Belum', 'Not yet')) + '</small>') + '</li>'; }).join('') + '</ol>';
      var rows = x.rows.map(function (r) { return '<li class="tl8-' + r.k + '"><span class="tl8-t num">' + when(r.at) + '</span><span class="tl8-ic">' + ic(TL_IC[r.k] || 'dot') + '</span><span class="tl8-b"><b>' + t(r.txt) + '</b><small>' + (r.by ? emp(r.by) + ' · ' : '') + teamName(r.team) + (r.ref ? ' · <span class="mono6">' + esc(r.ref) + '</span>' : '') + '</small></span></li>'; }).join('');
      var uniq = function (a) { return a.filter(function (v, i) { return a.indexOf(v) === i; }); };
      return hero({ id: b.id, icon: (E.CATS[b.cat] || {}).icon, title: cname(b.cl), sub: pname(b.prop), chips: stgC(b) + priC(b.pri) + slaC(b, true),
          facts: [[L('Order', 'Orders'), x.ords.length ? x.ords.map(esc).join(', ') : '—'], [L('Manifest', 'Manifests'), x.mfs.length ? x.mfs.map(esc).join(', ') : '—'], [L('Receiving', 'Receiving'), x.rcvs.map(function (r) { return lnk('PROD-RCV-002', r.id, esc(r.id)); }).join(', ')],
            [L('Berat · jumlah', 'Weight · quantity'), kg(b.kg) + ' · ' + pcs(b.finQty || b.pcs), 'num'], [L('Mesin', 'Machines'), uniq(x.machines).map(esc).join(' → ') || '—'], [L('Operator', 'Operators'), uniq(x.ops || []).map(first).join(', ') || '—'],
            [L('Delivery', 'Delivery'), o ? '<span class="mono6">' + esc(o.id) + '</span>' : (b.dlv ? esc(b.dlv) : '—')]],
          extra: (x.kids.length ? note(t(L('Batch rework: ', 'Rework batches: ')) + x.kids.map(function (k) { return bLink(k.id); }).join(', '), 'refresh', 'warn') : '') + (b.parent ? note(t(L('Rework dari ', 'Rework of ')) + bLink(b.parent), 'refresh', 'warn') : '') }) +
        card(L('Empat handover', 'Four handovers'), flow, { icon: 'swap' }) +
        card(L('Perjalanan batch', 'Batch journey'), rows ? '<ol class="tl8">' + rows + '</ol>' : A.empty(L('Belum ada kejadian.', 'No events yet.')), { icon: 'route', count: x.rows.length });
    },
    act: { search: function () { var el = document.querySelector('.sr8 input'); go('PROD-TRACE-001', null, el && el.value ? { s: el.value } : {}); } }
  };

  /* ================= PROD-KPI-001 Production KPI ================= */
  var KPIS = [
    ['kg', L('Kg diproses', 'Kg processed'), 'kg', 1, 'scale'], ['pcs', L('Pcs diproses', 'Pcs processed'), 'pcs', 1, 'layers'], ['perOp', L('Kg per operator', 'Kg per operator'), 'kg', 1, 'user'], ['perHour', L('Kg per jam', 'Kg per hour'), 'kg', 1, 'clock'],
    ['machUtil', L('Utilisasi mesin', 'Machine utilisation'), '%', 1, 'washer'], ['capUtil', L('Utilisasi kapasitas', 'Capacity utilisation'), '%', 0, 'gauge'], ['cycleH', L('Waktu siklus', 'Cycle time'), 'h', -1, 'loop'], ['qcPass', L('QC lulus', 'QC pass rate'), '%', 1, 'checkc'],
    ['rewash', L('Rewash rate', 'Rewash rate'), '%', -1, 'refresh'], ['delay', L('Batch terlambat', 'Late batches'), '', -1, 'alert'], ['downMin', L('Downtime mesin', 'Machine downtime'), 'min', -1, 'wrench'], ['batchAcc', L('Akurasi batch', 'Batch accuracy'), '%', 1, 'grid'],
    ['slaRisk', L('Batch risiko SLA', 'Batches at SLA risk'), '', -1, 'clock'], ['hoAcc', L('Akurasi handover', 'Handover accuracy'), '%', 1, 'swap']
  ];
  function fmtK(v, u) { if (v == null) return '—'; return A.fmt.num(v, v % 1 ? 1 : 0) + (u === '%' ? '%' : u === 'kg' ? ' kg' : u === 'pcs' ? ' pcs' : u === 'h' ? ' ' + T(L('jam', 'h')) : u === 'min' ? ' ' + T(L('mnt', 'min')) : ''); }
  V['PROD-KPI-001'] = {
    render: function () {
      var k = E.kpi(), ck = E.chkKpi(), mm = E.mntMetrics();
      var list = KPIS.map(function (d) {
        var v = k.today[d[0]], b = k.d30[d[0]], tone = '', dl = '';
        if (v != null && b != null && d[3] && ['kg', 'pcs', 'downMin', 'delay'].indexOf(d[0]) < 0) { var better = d[3] > 0 ? v >= b : v <= b; tone = better ? 'ok' : 'warn'; dl = '<span class="dl8 dl8-' + tone + '">' + ic(v >= b ? 'arrowup' : 'arrowdown') + fmtK(Math.round(Math.abs(v - b) * 10) / 10, d[2]) + '</span>'; }
        return '<div class="kp8' + (tone ? ' kp8-' + tone : '') + '"><span class="kp8-h">' + ic(d[4]) + '<span>' + t(d[1]) + '</span></span><b class="num">' + fmtK(v, d[2]) + '</b><span class="kp8-s">' + (b != null ? t(L('Rata-rata 30 hari ', '30-day average ')) + '<b class="num">' + fmtK(b, d[2]) + '</b>' : t(L('Hari ini saja', 'Today only'))) + dl + '</span></div>';
      }).join('');
      var amb = E.ambidex().map(function (x) { return '<tr><td><b>' + t(x.to) + '</b></td><td>' + t(x.line) + '</td><td class="num">' + esc(x.v) + '</td><td><span class="mono6">' + esc(x.src) + '</span></td></tr>'; }).join('');
      return A.pageHead(null, t(L('14 KPI dihitung otomatis dari kerja tim hari ini (sejak 06:00, ' + k.today.hours + ' jam) dan dibandingkan dengan 30 hari terakhir.', '14 KPIs computed from today\'s team work (since 06:00, ' + k.today.hours + ' h) and compared with the last 30 days.'))) +
        '<div class="kp8l">' + list + '</div>' +
        '<div class="g8-2">' + card(L('Checklist', 'Checklist'), kv([[L('Opening hari ini', 'Opening today'), (ck.opening == null ? '—' : ck.opening + '%')], [L('Kepatuhan (30 hari + hari ini)', 'Compliance (30 days + today)'), ck.compliance + '%'], [L('Tepat waktu', 'On time'), ck.ontime + '%'], [L('Peralatan OK', 'Equipment OK'), ck.equip + '%'], [L('Temuan kritis', 'Critical findings'), ck.crit]]), { icon: 'clipboard', link: ['CHK-001', L('Checklist', 'Checklist')] }) +
        card(L('Maintenance', 'Maintenance'), kv([[L('Uptime mesin (30 hari)', 'Machine uptime (30 days)'), mm.avail + '%'], [L('PM selesai tepat waktu', 'PM completed on time'), mm.completion + '%'], [L('Breakdown (30 hari)', 'Breakdowns (30 days)'), mm.breakdown], [L('Rata-rata perbaikan (MTTR)', 'Mean time to repair (MTTR)'), mm.mttr != null ? minT(mm.mttr) : '—']]), { icon: 'wrench', link: can('mnt.view') ? ['MNT-001', L('Maintenance', 'Maintenance')] : null }) + '</div>' +
        card(L('Aliran ke Ambidex (Fase 5)', 'Flow into the Ambidex (Phase 5)'), '<div class="tblw"><table class="tbl dense"><thead><tr><th>' + t(L('Tujuan', 'Target')) + '</th><th>' + t(L('Angka', 'Figure')) + '</th><th class="num">' + t(L('Nilai', 'Value')) + '</th><th>' + t(L('Sumber', 'Source')) + '</th></tr></thead><tbody>' + amb + '</tbody></table></div>' +
          note(t(L('Angka produksi tidak diketik ulang di Fase 5. Personal Score dan KPI tim membaca langsung dari sini.', 'Production figures are never retyped in Phase 5. Personal Score and team KPIs read straight from here.')), 'link'), { icon: 'trophy' });
    }
  };

  /* ================= NP-11 · CHK-001 Checklist Today ================= */
  var CHK_IC = { check: 'checkc', num: 'hash', text: 'edit', select: 'list', photo_opt: 'camera', photo_req: 'camera', notes_req: 'edit', approval: 'lock' };
  function chkTab(c) { var tabs0 = E.chkTabsFor(cx()), want = c.q.tab; if (want && tabs0.indexOf(want) >= 0) return want; var tm = E.teamOf(cx()); return tabs0.indexOf(tm) >= 0 ? tm : tabs0[0]; }
  function itemVal(d, it) {
    if (it.st === 'pending') return '';
    if (d.type === 'num') return '<b class="num">' + esc(it.val) + ' ' + esc(d.unit || '') + '</b>';
    if (d.type === 'select') { var o = (d.opts || []).filter(function (x) { return x[0] === it.val; })[0]; return o ? '<b>' + t(o[1]) + '</b>' : ''; }
    if (d.type === 'text' || d.type === 'notes_req') return '<span>' + esc(it.val || it.note) + '</span>';
    return '';
  }
  function chkInstCard(c0, inline) {
    var tp = E.tpl(c0.tpl), st = E.CHK_ST[c0.st], sm = E.chkSum([c0]);
    var items = c0.items.map(function (it) {
      var d = E.itemDef(c0, it.code), over = E.itemOverdue(c0, it), cls = it.st === 'done' ? 'ok' : it.st === 'issue' ? 'crit' : over ? 'late' : '';
      return '<a class="ci8' + (cls ? ' ci8-' + cls : '') + '" href="' + href('CHK-002', c0.id, { code: it.code }) + '"><span class="ci8-s">' + ic(it.st === 'done' ? 'check' : it.st === 'issue' ? 'alert' : d.type === 'approval' ? 'lock' : 'dot') + '</span>' +
        '<span class="ci8-b"><b>' + t(d.n) + (d.mand ? '' : ' <small>' + t(L('(opsional)', '(optional)')) + '</small>') + '</b><small>' + ic(CHK_IC[d.type]) + t(E.CHK_INPUT[d.type]) + (d.unit ? ' · ' + esc(d.min + '–' + d.max + ' ' + d.unit) : '') + (it.by ? ' · ' + first(it.by) + ' ' + hm(it.at) : '') + (it.late ? ' · ' + t(L('terlambat', 'late')) : '') + '</small>' + (it.ret ? '<small class="t-warn">' + ic('undo') + t(L('Dikembalikan: ', 'Returned: ')) + esc(it.ret.note) + '</small>' : '') + (it.issue ? '<small class="t-crit">' + esc(it.issue) + ' · ' + esc(it.note) + '</small>' : '') + '</span>' +
        '<span class="ci8-v">' + itemVal(d, it) + (over ? A.chip('crit', L('Terlambat', 'Overdue'), 'clock') : '') + ic('chevr', 'q8-go') + '</span></a>';
    }).join('');
    var actions = '';
    if ((c0.st === 'open' || c0.st === 'returned') && can('chk.do')) actions = A.btn('primary', L('KIRIM CHECKLIST', 'SUBMIT CHECKLIST'), 'send', { act: 'submit', val: c0.id, cls: 'btn-xl' });
    else if (c0.st === 'submitted' && can('chk.lead')) actions = A.btn('primary', L('REVIEW OK (TEAM LEADER)', 'REVIEW OK (TEAM LEADER)'), 'checkc', { act: 'lead', val: c0.id, cls: 'btn-xl' });
    else if (c0.st === 'lead_ok' && can('chk.approve')) actions = A.btn('primary', L('BUKA APPROVAL', 'OPEN APPROVAL'), 'filecheck', { go: 'CHK-005', cls: 'btn-xl' });
    return '<section class="card ck8c"><div class="card-h"><h2>' + ic('clipboard') + '<span>' + t(tp.n) + '</span></h2><span class="ck8c-m"><span class="num">' + esc(c0.win[0] + '–' + c0.win[1]) + '</span> · v' + c0.v + ' ' + A.chip(st[1], st[0]) + '</span></div>' +
      '<div class="ck8c-p"><span class="ub8 ub8-' + (sm.issue ? 'warn' : 'ok') + '"><i style="width:' + sm.pct + '%"></i><b class="num">' + sm.done + '/' + sm.total + '</b></span></div><div class="ci8l">' + items + '</div>' +
      (c0.st === 'returned' ? note(t(L('Supervisor mengembalikan item. Perbaiki lalu kirim lagi.', 'The supervisor returned an item. Fix it and submit again.')), 'undo', 'warn') : '') + (actions ? '<div class="bt8">' + actions + '</div>' : '') + '</section>';
  }
  V['CHK-001'] = {
    render: function (c) {
      var tabs0 = E.chkTabsFor(cx()); if (!tabs0.length) return A.stateCard('perm', L('Anda tidak punya akses checklist.', 'You have no checklist access.'));
      var tab = chkTab(c), r = E.chkToday(cx(), tab), all = E.chkToday(cx()), s = r.sum;
      var counts = {}; all.list.forEach(function (x) { counts[x.tab] = (counts[x.tab] || 0) + 1; });
      return A.pageHead(null, esc(G.day(E.TODAY)) + ' · ' + t(L('Checklist digital pengganti Excel bulanan. Setiap item tercatat siapa dan jam berapa.', 'Digital checklists replacing the monthly Excel. Every item records who and when.')), can('chk.approve') ? A.btn('ghost', L('Approval', 'Approval'), 'filecheck', { go: 'CHK-005' }) : '') +
        tabs(tabs0.map(function (k) { return [k, E.CHK_TABS[k], { opening: 'sun', closing: 'moon', t1: 'basket', t2: 'droplet', t3: 'shirt', log: 'truck' }[k], counts[k] || 0]; }), tab, 'tab', { def: tabs0.indexOf(E.teamOf(cx())) >= 0 ? E.teamOf(cx()) : tabs0[0] }) +
        bigCount([{ k: L('Total item', 'Total items'), v: s.total, icon: 'list' }, { k: L('Selesai', 'Done'), v: s.done, icon: 'checkc', tone: 'ok' }, { k: L('Pending', 'Pending'), v: s.pending, icon: 'hourglass' }, { k: L('Ada masalah', 'Issues'), v: s.issue, icon: 'alert', tone: s.issue ? 'crit' : '' }, { k: L('Terlambat', 'Overdue'), v: s.overdue, icon: 'clock', tone: s.overdue ? 'crit' : '' }, { k: L('Progres', 'Progress'), v: s.pct + '%', icon: 'gauge' }]) +
        (r.list.length ? r.list.map(function (x) { return chkInstCard(x); }).join('') : A.empty(L('Belum ada checklist untuk tab ini hari ini.', 'No checklist for this tab today.')));
    },
    act: {
      submit: function (el) { var id = el.getAttribute('data-val'), r = E.chkSubmit(cx(), id, {}); if (!r.ok) return fail(r); after(r.inst.st === 'done' ? L('Checklist selesai.', 'Checklist completed.') : L('Checklist dikirim ke team leader.', 'Checklist sent to the team leader.')); },
      lead: function (el) { var id = el.getAttribute('data-val'), r = E.chkLead(cx(), id); if (!r.ok) return fail(r); after(L('Review team leader OK. Menunggu supervisor.', 'Team leader review OK. Waiting for the supervisor.')); }
    }
  };

  /* ================= CHK-002 Checklist Item ================= */
  function nextPending(c0, code) { var i = c0.items.map(function (x) { return x.code; }).indexOf(code); for (var k = i + 1; k < c0.items.length; k++) { var d = E.itemDef(c0, c0.items[k].code); if (c0.items[k].st === 'pending' && d.type !== 'approval') return c0.items[k].code; } return null; }
  V['CHK-002'] = {
    title: function (rec) { return L('Item Checklist', 'Checklist Item'); },
    render: function (c) {
      var c0 = E.chkInst(c.rec); if (!c0) return A.stateCard('empty', L('Checklist tidak ditemukan.', 'Checklist not found.'), A.btn('blue', L('Checklist Hari Ini', 'Checklist Today'), 'clipboard', { go: 'CHK-001' }));
      var code = c.q.code || c0.items[0].code, it = c0.items.filter(function (x) { return x.code === code; })[0]; if (!it) return A.stateCard('empty', L('Item tidak ditemukan.', 'Item not found.'));
      var d = E.itemDef(c0, code), tp = E.tpl(c0.tpl), idx = c0.items.indexOf(it), editable = (c0.st === 'open' || c0.st === 'returned') && it.st === 'pending' && can('chk.do') && d.type !== 'approval';
      var input = '';
      if (editable) {
        if (d.type === 'num') input = fld(L('Nilai', 'Value') + ' (' + d.unit + ')', '<input class="in8-big num" type="number" inputmode="decimal" step="any" name="val" placeholder="' + esc(d.min + '–' + d.max) + '">', { req: true, wide: true, hint: t(L('Batas normal ', 'Normal range ')) + esc(d.min + '–' + d.max + ' ' + d.unit) });
        else if (d.type === 'select') input = fld(L('Pilih status', 'Choose a status'), choice('val', d.opts.map(function (o) { return [o[0], o[1], null, o[0] === d.bad ? 'warn' : null]; }), ''), { req: true, wide: true });
        else if (d.type === 'text') input = fld(L('Jawaban', 'Answer'), area('val', '', ''), { req: true, wide: true });
        else if (d.type === 'notes_req') input = fld(L('Catatan', 'Notes'), area('note', '', ''), { req: true, wide: true });
        if (d.type === 'photo_req' || d.type === 'photo_opt') input += fld(L('Foto', 'Photo'), photoIn('chk8', L('Ambil Foto', 'Take Photo'), { big: true }), { req: d.type === 'photo_req', wide: true });
        if (d.type !== 'notes_req') input += fld(L('Catatan (opsional)', 'Notes (optional)'), inp('note', '', { ph: L('Opsional', 'Optional') }), { wide: true });
        if (['t1', 't2', 't3'].indexOf(c0.tab) >= 0) input += P.whoPick(c0.tab);
      }
      var res = it.st !== 'pending' ? note((it.st === 'done' ? t(L('Selesai', 'Done')) : t(L('Ada masalah', 'Issue'))) + ' · ' + first(it.by) + ' ' + hm(it.at) + (itemVal(d, it) ? ' · ' + itemVal(d, it) : '') + (it.note ? ' · ' + esc(it.note) : '') + (it.issue ? ' · ' + (/^WO-/.test(it.issue) ? lnk('MNT-006', it.issue, esc(it.issue)) : esc(it.issue)) : ''), it.st === 'done' ? 'checkc' : 'alert', it.st === 'done' ? 'ok' : 'crit') + (it.photo ? '<div class="ev8">' + img(it.photo, 'foto') + '</div>' : '') : '';
      return '<p class="crumb8">' + lnk('CHK-001', null, t(tp.n), { tab: c0.tab }) + ' · ' + (idx + 1) + '/' + c0.items.length + '</p>' +
        '<section class="card hr8"><div class="hr8-h"><span class="hr8-ic">' + ic(CHK_IC[d.type]) + '</span><div class="hr8-t"><span class="hr8-id mono6">' + esc(code) + '</span><h2>' + t(d.n) + '</h2><p>' + t(d.ins) + '</p></div><div class="hr8-c">' + A.chip('info', E.CHK_CAT[d.cat]) + A.chip('mute', E.CHK_AREA[d.area]) + (d.mand ? A.chip('appr', L('Wajib', 'Mandatory')) : '') + '</div></div>' +
        (it.ret ? note(t(L('Dikembalikan supervisor: ', 'Returned by the supervisor: ')) + esc(it.ret.note), 'undo', 'warn') : '') + (d.type === 'approval' ? note(t(L('Item ini disetujui supervisor saat APPROVE.', 'This item is approved by the supervisor at APPROVE.')), 'lock', 'info') : '') + res +
        (editable ? '<form class="frm5 f8" onsubmit="return false">' + input + '</form>' : '') + '</section>' +
        (editable ? abar(xl('primary', L('SELESAI', 'DONE'), 'check', { act: 'done' }), xl('danger', L('ADA MASALAH', 'ISSUE'), 'alert', { act: 'issue' })) :
          '<div class="bt8">' + (nextPending(c0, code) ? A.btn('primary', L('Item berikutnya', 'Next item'), 'arrow', { go: 'CHK-002', rec: c0.id, qs: 'code=' + nextPending(c0, code) }) : '') + A.btn('ghost', L('Kembali ke checklist', 'Back to checklist'), 'clipboard', { go: 'CHK-001', qs: 'tab=' + c0.tab }) + '</div>');
    },
    act: {
      done: function () {
        var id = A.S.rec, code = A.S.q.code, c0 = E.chkInst(id), v = vals(document.querySelector('.f8') || document.body);
        var r = E.chkDo(cx(), id, code || c0.items[0].code, { val: v.val, note: v.note, photo: photos('chk8')[0] || null, op: v.op }); if (!r.ok) return fail(r);
        resetPh('chk8'); var nx = nextPending(c0, r.item.code);
        if (nx) go('CHK-002', id, { code: nx }); else go('CHK-001', null, { tab: c0.tab });
        setTimeout(function () { A.toast(nx ? L('Tersimpan. Lanjut item berikutnya.', 'Saved. On to the next item.') : L('Semua item terisi. Kirim checklist.', 'All items filled. Submit the checklist.')); }, 300);
      },
      issue: function () {
        var id = A.S.rec, c0 = E.chkInst(id), code = A.S.q.code || c0.items[0].code, d = E.itemDef(c0, code), v0 = vals(document.querySelector('.f8') || document.body);
        resetPh('chki8');
        dlg({ title: L('Ada masalah', 'Report a problem'), icon: 'alert', sub: t(d.n), ok: L('KIRIM', 'SEND'),
          body: fld(L('Apa masalahnya?', 'What is wrong?'), area('note', v0.note || '', L('Tulis singkat', 'Write briefly')), { req: true, wide: true }) +
            fld(L('Tindak lanjut', 'Follow-up'), choice('follow', Object.keys(E.CHK_FOLLOW).map(function (k) { return [k, E.CHK_FOLLOW[k][0], E.CHK_FOLLOW[k][1]]; }), d.cat === 'equip' && d.mach ? 'maint' : 'followup', { cls: 'ch8-grid' }), { req: true, wide: true }) +
            fld(L('Mesin', 'Machine'), sel('mach', [['', L('Tidak terkait mesin', 'Not machine related')]].concat(E.state().mach.map(function (m) { return [m.id, m.id + ' · ' + T(m.n)]; })), d.mach || ''), { wide: true, hint: t(L('Wajib jika tindak lanjut maintenance.', 'Required for a maintenance follow-up.')) }) +
            fld(L('Tingkat keparahan', 'Severity'), choice('sev', Object.keys(E.SEV).map(function (k) { return [k, E.SEV[k][0], null, k === 'crit' || k === 'high' ? 'crit' : null]; }), d.cat === 'safety' ? 'high' : 'med'), { wide: true }) +
            fld(L('Foto', 'Photo'), photoIn('chki8', L('Ambil Foto', 'Take Photo')), { wide: true }),
          onOk: function (v, e2) { v = vals(e2); var r = E.chkIssue(cx(), id, code, { note: v.note, follow: v.follow, mach: v.mach || null, sev: v.sev, photo: photos('chki8')[0] || null, val: v0.val, op: v0.op }); if (!r.ok) return r.msg; var nx = nextPending(c0, code); if (nx) go('CHK-002', id, { code: nx }); else go('CHK-001', null, { tab: c0.tab }); setTimeout(function () { A.toast(L('Masalah tercatat: ' + r.follow, 'Issue recorded: ' + r.follow), 'warn'); }, 300); return true; } });
      }
    }
  };

  /* ================= CHK-003 Checklist Master ================= */
  V['CHK-003'] = {
    render: function () {
      var rows = E.templates().map(function (tp) {
        var cur = E.verAt(tp, E.TODAY), nxt = tp.versions.filter(function (v) { return !v.draft && v.eff > E.TODAY; })[0], dr = tp.versions.filter(function (v) { return v.draft; })[0];
        return '<a class="q8" href="' + href('CHK-004', tp.id) + '"><span class="q8-i">' + ic('clipboard') + '</span><span class="q8-b"><span class="q8-h"><b class="mono6">' + esc(tp.id) + '</b>' + A.chip('info', E.CHK_TYPES[tp.kind]) + (tp.approve ? A.chip('appr', L('Perlu approval', 'Needs approval'), 'lock') : '') + '</span>' +
          '<b class="q8-t">' + t(tp.n) + '</b><span class="q8-s">' + t(E.CHK_TABS[tp.tab] || tp.tab) + ' · ' + t((D().FREQ[tp.freq] || [L(tp.freq === 'shift' ? 'Per shift' : tp.freq, tp.freq === 'shift' ? 'Per shift' : tp.freq)])[0]) + ' · <span class="num">' + esc(tp.win[0] + '–' + tp.win[1]) + '</span></span>' +
          '<span class="q8-m"><span>' + ic('file') + (cur ? 'v' + cur.v + ' · ' + t(L('berlaku ', 'effective ')) + esc(G.dts(cur.eff)) + ' · ' + cur.items.length + ' item' : t(L('Belum terbit', 'Not published'))) + '</span>' + (nxt ? '<span>' + ic('calendar') + 'v' + nxt.v + ' ' + t(L('mulai ', 'from ')) + esc(G.dts(nxt.eff)) + '</span>' : '') + (dr ? '<span class="t-warn">' + ic('edit') + t(L('Draft v', 'Draft v')) + dr.v + '</span>' : '') + '</span></span><span class="q8-r">' + ic('chevr', 'q8-go') + '</span></a>';
      });
      return A.pageHead(null, t(L('Template checklist. Perubahan selalu masuk versi baru dengan tanggal berlaku, riwayat lama tidak berubah.', 'Checklist templates. Changes always go into a new version with an effective date; past records never change.')), A.pbtn('chk.master', 'primary', L('Template Baru', 'New Template'), 'plus', { act: 'new' })) + qlist(rows, L('Belum ada template.', 'No templates yet.'));
    },
    act: {
      new: function () {
        dlg({ title: L('Template checklist baru', 'New checklist template'), icon: 'plus', ok: L('Buat', 'Create'),
          body: fld(L('Nama', 'Name'), inp('n', '', { ph: L('mis. Checklist Kebersihan Sorting', 'e.g. Sorting Cleanliness Checklist') }), { req: true, wide: true }) +
            fld(L('Jenis', 'Type'), sel('kind', Object.keys(E.CHK_TYPES).map(function (k) { return [k, E.CHK_TYPES[k]]; }), 'shift'), { req: true }) + fld(L('Tab', 'Tab'), sel('tab', Object.keys(E.CHK_TABS).map(function (k) { return [k, E.CHK_TABS[k]]; }), 't1'), { req: true }) +
            fld(L('Jam mulai', 'Start time'), inp('w0', '07:00', { type: 'time' })) + fld(L('Jam selesai', 'End time'), inp('w1', '09:00', { type: 'time' })) +
            fld(L('Perlu approval supervisor', 'Needs supervisor approval'), choice('approve', [['', L('Tidak', 'No')], ['1', L('Ya', 'Yes')]], ''), { wide: true }),
          onOk: function (v, e2) { v = vals(e2); var r = E.tplNew(cx(), { n: v.n, kind: v.kind, tab: v.tab, w0: v.w0, w1: v.w1, approve: !!v.approve }); if (!r.ok) return r.msg; go('CHK-004', r.tpl.id); setTimeout(function () { A.toast(L('Draft v1 dibuat. Tambahkan item lalu terbitkan.', 'Draft v1 created. Add items, then publish.')); }, 300); return true; } });
      }
    }
  };

  /* ================= CHK-004 Template Editor ================= */
  function itemDlg(tp, it) {
    var types = Object.keys(E.CHK_INPUT);
    dlg({ title: it ? L('Ubah item', 'Edit item') : L('Tambah item', 'Add item'), icon: 'edit', sub: esc(tp.id) + (it ? ' · ' + esc(it.code) : ''), ok: L('Simpan ke draft', 'Save to draft'),
      body: fld(L('Nama item', 'Item name'), inp('n', it ? T(it.n) : ''), { req: true, wide: true }) + fld(L('Instruksi singkat', 'Short instruction'), inp('ins', it ? T(it.ins) : ''), { wide: true }) +
        fld(L('Kategori', 'Category'), sel('cat', Object.keys(E.CHK_CAT).map(function (k) { return [k, E.CHK_CAT[k]]; }), it ? it.cat : 'ops')) + fld(L('Area', 'Area'), sel('area', Object.keys(E.CHK_AREA).map(function (k) { return [k, E.CHK_AREA[k]]; }), it ? it.area : 'all')) +
        fld(L('Tipe input', 'Input type'), sel('type', types.map(function (k) { return [k, E.CHK_INPUT[k]]; }), it ? it.type : 'check'), { req: true }) + fld(L('Wajib', 'Mandatory'), sel('mand', [['true', L('Ya', 'Yes')], ['false', L('Tidak', 'No')]], it && it.mand === false ? 'false' : 'true')) +
        '<div class="frm5-g" id="ti8-num"' + (it && it.type === 'num' ? '' : ' hidden') + '>' + fld(L('Satuan', 'Unit'), inp('unit', it && it.unit || '')) + fld(L('Batas bawah', 'Low limit'), inp('min', it && it.min != null ? it.min : '', { type: 'number' })) + fld(L('Batas atas', 'High limit'), inp('max', it && it.max != null ? it.max : '', { type: 'number' })) + '</div>' +
        '<div id="ti8-sel"' + (it && it.type === 'select' ? '' : ' hidden') + '>' + fld(L('Pilihan (pisah koma, pilihan ke-2 = perlu dilaporkan)', 'Options (comma-separated, 2nd option = needs reporting)'), inp('opts', it && it.opts ? it.opts.map(function (o) { return T(o[1]); }).join(', ') : ''), { wide: true }) + '</div>' +
        fld(L('Mesin terkait', 'Related machine'), sel('mach', [['', '—']].concat(E.state().mach.map(function (m) { return [m.id, m.id]; })), it && it.mach || ''), { wide: true }),
      after: function (el) { var s0 = el.querySelector('[name=type]'); s0.addEventListener('change', function () { el.querySelector('#ti8-num').hidden = this.value !== 'num'; el.querySelector('#ti8-sel').hidden = this.value !== 'select'; }); },
      onOk: function (v, e2) { v = vals(e2); if (it) v.code = it.code; var r = E.tplSaveItem(cx(), tp.id, v); if (!r.ok) return r.msg; after(L('Tersimpan di draft v' + r.draft.v + '.', 'Saved in draft v' + r.draft.v + '.')); return true; } });
  }
  V['CHK-004'] = {
    title: function (rec) { var tp = rec && E.tpl(rec); return tp ? tp.n : L('Editor Template', 'Template Editor'); },
    render: function (c) {
      var tp = E.tpl(c.rec); if (!tp) return A.stateCard('empty', L('Pilih template di Master Checklist.', 'Choose a template in the Checklist Master.'), A.btn('blue', L('Master Checklist', 'Checklist Master'), 'list', { go: 'CHK-003' }));
      var dr = E.tplDraft(cx(), tp.id, false), cur = E.verAt(tp, E.TODAY), latest = E.tplLatest(tp), show = dr || latest, edit = !!dr && can('chk.master'), cfg = show && show.cfg || tp;
      var items = show ? show.items.map(function (it, i) {
        return '<div class="ti8' + (it.active === false ? ' is-off' : '') + '"><span class="ti8-n num">' + (i + 1) + '</span><span class="ti8-b"><b>' + t(it.n) + '</b><small>' + ic(CHK_IC[it.type]) + t(E.CHK_INPUT[it.type]) + ' · ' + t(E.CHK_CAT[it.cat]) + ' · ' + t(E.CHK_AREA[it.area]) + (it.unit ? ' · ' + esc(it.min + '–' + it.max + ' ' + it.unit) : '') + (it.mand ? '' : ' · ' + t(L('opsional', 'optional'))) + (it.active === false ? ' · ' + t(L('nonaktif', 'inactive')) : '') + '</small></span>' +
          (edit ? '<span class="ti8-a">' + A.btn('ghost', '', 'arrowup', { act: 'up', val: it.code, cls: 'btn-sm btn-ic' }) + A.btn('ghost', '', 'arrowdown', { act: 'down', val: it.code, cls: 'btn-sm btn-ic' }) + (it.type !== 'approval' ? A.btn('ghost', L('Ubah', 'Edit'), 'edit', { act: 'edit', val: it.code, cls: 'btn-sm' }) : '') + A.btn('ghost', it.active === false ? L('Aktifkan', 'Activate') : L('Nonaktifkan', 'Deactivate'), it.active === false ? 'eye' : 'eyeoff', { act: 'toggle', val: it.code, cls: 'btn-sm' }) + '</span>' : '') + '</div>';
      }).join('') : '';
      var hist = tp.versions.slice().sort(function (a, b) { return b.v - a.v; }).map(function (v) { var st = v.draft ? A.chip('warn', L('Draft', 'Draft')) : v.eff > E.TODAY ? A.chip('info', L('Terjadwal', 'Scheduled')) : cur && cur.v === v.v ? A.chip('ok', L('Berlaku', 'Effective')) : A.chip('mute', L('Arsip', 'Archived')); return '<li><b>v' + v.v + '</b>' + st + '<span class="num">' + (v.eff ? esc(G.dts(v.eff)) + (v.until ? ' – ' + esc(G.dts(v.until)) : '') : '—') + '</span><small>' + v.items.length + ' item · ' + first(v.by) + (v.note ? ' · ' + t(v.note) : '') + '</small></li>'; }).join('');
      return A.pageHead(null, esc(tp.id) + ' · ' + t(E.CHK_TYPES[tp.kind]) + ' · ' + t(E.CHK_TABS[cfg.tab] || cfg.tab) + ' · <span class="num">' + esc(cfg.win[0] + '–' + cfg.win[1]) + '</span>' + (cfg.approve ? ' · ' + t(L('perlu approval', 'needs approval')) : ''),
        can('chk.master') ? (dr ? A.btn('ghost', L('Pengaturan', 'Settings'), 'settings', { act: 'settings' }) + A.btn('ghost', L('Tambah Item', 'Add Item'), 'plus', { act: 'add' }) + A.btn('primary', L('Terbitkan Versi', 'Publish Version'), 'send', { act: 'publish' }) : A.btn('primary', L('Buat Versi Baru', 'Create New Version'), 'edit', { act: 'draft' })) : '') +
        (dr ? note(t(L('Anda mengedit draft v' + dr.v + '. Checklist yang sedang berjalan tetap memakai versi lama sampai tanggal berlaku.', 'You are editing draft v' + dr.v + '. Running checklists keep the old version until the effective date.')), 'edit', 'warn') : note(t(L('Versi terbit tidak bisa diubah. Buat versi baru untuk mengubah item.', 'Published versions cannot be changed. Create a new version to change items.')), 'lock', 'info')) +
        card(dr ? L('Item draft v' + dr.v, 'Draft v' + dr.v + ' items') : L('Item versi terbaru', 'Latest version items'), items ? '<div class="ti8l">' + items + '</div>' : A.empty(L('Belum ada item. Tambah item pertama.', 'No items yet. Add the first item.')), { icon: 'list', count: show ? show.items.length : 0 }) +
        card(L('Riwayat versi', 'Version history'), '<ul class="vh8">' + hist + '</ul>', { icon: 'history' });
    },
    act: {
      draft: function () { var d = E.tplDraft(cx(), A.S.rec, true); if (!d) return fail({ msg: E.MSG.noperm }); after(L('Draft v' + d.v + ' dibuat dari versi terbaru.', 'Draft v' + d.v + ' created from the latest version.')); },
      add: function () { itemDlg(E.tpl(A.S.rec), null); },
      edit: function (el) { var tp = E.tpl(A.S.rec), d = E.tplDraft(cx(), tp.id, false), code = el.getAttribute('data-val'); itemDlg(tp, d.items.filter(function (x) { return x.code === code; })[0]); },
      up: function (el) { var r = E.tplMove(cx(), A.S.rec, el.getAttribute('data-val'), -1); if (!r.ok) return fail(r); A.rerender(); },
      down: function (el) { var r = E.tplMove(cx(), A.S.rec, el.getAttribute('data-val'), 1); if (!r.ok) return fail(r); A.rerender(); },
      toggle: function (el) { var r = E.tplToggle(cx(), A.S.rec, el.getAttribute('data-val')); if (!r.ok) return fail(r); after(r.item.active ? L('Item diaktifkan.', 'Item activated.') : L('Item dinonaktifkan.', 'Item deactivated.')); },
      settings: function () {
        var tp = E.tpl(A.S.rec), d = E.tplDraft(cx(), tp.id, false), cf = d.cfg || tp;
        dlg({ title: L('Pengaturan versi', 'Version settings'), icon: 'settings', sub: 'v' + d.v, ok: L('Simpan', 'Save'),
          body: fld(L('Tab', 'Tab'), sel('tab', Object.keys(E.CHK_TABS).map(function (k) { return [k, E.CHK_TABS[k]]; }), cf.tab)) + fld(L('PIC', 'PIC'), sel('pic', Object.keys(E.CHK_PIC).map(function (k) { return [k, E.CHK_PIC[k]]; }), cf.pic || 'op')) +
            fld(L('Jam mulai', 'Start time'), inp('w0', cf.win[0], { type: 'time' })) + fld(L('Jam selesai', 'End time'), inp('w1', cf.win[1], { type: 'time' })) + fld(L('Perlu approval supervisor', 'Needs supervisor approval'), choice('approve', [['0', L('Tidak', 'No')], ['1', L('Ya', 'Yes')]], cf.approve ? '1' : '0'), { wide: true }),
          onOk: function (v, e2) { v = vals(e2); var r = E.tplSettings(cx(), tp.id, { tab: v.tab, pic: v.pic, win: [v.w0, v.w1], approve: v.approve === '1' }); if (!r.ok) return r.msg; after(L('Pengaturan draft disimpan.', 'Draft settings saved.')); return true; } });
      },
      publish: function () {
        var tp = E.tpl(A.S.rec), d = E.tplDraft(cx(), tp.id, false);
        dlg({ title: L('Terbitkan versi ' + d.v, 'Publish version ' + d.v), icon: 'send', sub: t(tp.n), ok: L('Terbitkan', 'Publish'),
          body: fld(L('Tanggal berlaku', 'Effective date'), inp('eff', E.addDays(E.TODAY, 1), { type: 'date' }), { req: true, wide: true, hint: t(L('Minimal besok. Checklist hari ini tidak berubah.', 'Tomorrow at the earliest. Today\'s checklists do not change.')) }) + fld(L('Catatan perubahan', 'Change note'), area('note', '', L('Apa yang berubah?', 'What changed?')), { wide: true }),
          onOk: function (v, e2) { v = vals(e2); var r = E.tplPublish(cx(), tp.id, v.eff, v.note); if (!r.ok) return r.msg; after(L('Versi ' + r.version.v + ' terbit, berlaku ' + G.dts(r.version.eff) + '.', 'Version ' + r.version.v + ' published, effective ' + G.dts(r.version.eff) + '.')); return true; } });
      }
    }
  };

  /* ================= CHK-005 Checklist Approval ================= */
  V['CHK-005'] = {
    render: function () {
      var list = E.chkPending(cx());
      return A.pageHead(null, t(L('Operator selesai → team leader review → supervisor approve. Kembalikan item yang perlu diperbaiki.', 'Operator done → team leader review → supervisor approves. Return items that need fixing.'))) +
        (list.length ? list.map(function (c0) {
          var tp = E.tpl(c0.tpl), st = E.CHK_ST[c0.st], sm = E.chkSum([c0]), issues = c0.items.filter(function (it) { return it.st === 'issue'; });
          var rows = c0.items.map(function (it) { var d = E.itemDef(c0, it.code); if (d.type === 'approval') return ''; return '<div class="ci8' + (it.st === 'done' ? ' ci8-ok' : it.st === 'issue' ? ' ci8-crit' : '') + '"><span class="ci8-s">' + ic(it.st === 'done' ? 'check' : it.st === 'issue' ? 'alert' : 'dot') + '</span><span class="ci8-b"><b>' + t(d.n) + '</b><small>' + (it.by ? first(it.by) + ' ' + hm(it.at) : t(L('belum diisi', 'not filled'))) + (it.note ? ' · ' + esc(it.note) : '') + (it.issue ? ' · ' + esc(it.issue) : '') + '</small></span><span class="ci8-v">' + itemVal(d, it) + (it.photo ? img(it.photo, 'foto') : '') + (can('chk.approve') || can('chk.lead') ? A.btn('ghost', L('Kembalikan', 'Return'), 'undo', { act: 'ret', val: c0.id + '|' + it.code, cls: 'btn-sm' }) : '') + '</span></div>'; }).join('');
          var main = c0.st === 'lead_ok' && can('chk.approve') ? A.btn('primary', L('APPROVE ' + T(E.CHK_TYPES[tp.kind]).toUpperCase(), 'APPROVE ' + E.CHK_TYPES[tp.kind][1].toUpperCase()), 'filecheck', { act: 'approve', val: c0.id, cls: 'btn-xl' }) :
            c0.st === 'submitted' && can('chk.lead') ? A.btn('primary', L('REVIEW OK (TEAM LEADER)', 'REVIEW OK (TEAM LEADER)'), 'checkc', { act: 'lead', val: c0.id, cls: 'btn-xl' }) : A.chip('appr', L('Menunggu team leader', 'Waiting for the team leader'), 'hourglass');
          return '<section class="card ck8c"><div class="card-h"><h2>' + ic('filecheck') + '<span>' + t(tp.n) + '</span></h2><span class="ck8c-m">' + A.chip(st[1], st[0]) + '</span></div>' +
            step8([L('Operator', 'Operator'), L('Team Leader', 'Team Leader'), L('Supervisor', 'Supervisor')], c0.st === 'submitted' ? 1 : 2) +
            kv([[L('Selesai', 'Done'), sm.done + '/' + sm.total], [L('Masalah', 'Issues'), issues.length], [L('Dikirim', 'Submitted'), (c0.log.filter(function (l) { return l[0] === 'submitted'; }).pop() || [])[1] ? when(c0.log.filter(function (l) { return l[0] === 'submitted'; }).pop()[1]) + ' · ' + first(c0.log.filter(function (l) { return l[0] === 'submitted'; }).pop()[2]) : '—']]) +
            (issues.length ? note(t(L(issues.length + ' item ada masalah dan sudah punya tindak lanjut.', issues.length + ' items have issues with a follow-up.')), 'alert', 'warn') : '') + '<div class="ci8l">' + rows + '</div><div class="bt8">' + main + '</div></section>';
        }).join('') : A.empty(L('Tidak ada checklist menunggu persetujuan.', 'No checklist waiting for approval.')));
    },
    act: {
      approve: function (el) { var id = el.getAttribute('data-val'); dlg({ title: L('Approve checklist', 'Approve checklist'), icon: 'filecheck', sub: esc(id), ok: L('APPROVE', 'APPROVE'), body: fld(L('Catatan (opsional)', 'Note (optional)'), area('note', '', ''), { wide: true }), onOk: function (v, e2) { v = vals(e2); var r = E.chkApprove(cx(), id, v.note); if (!r.ok) return r.msg; after(L('Checklist disetujui.', 'Checklist approved.')); return true; } }); },
      lead: function (el) { var r = E.chkLead(cx(), el.getAttribute('data-val')); if (!r.ok) return fail(r); after(L('Review team leader OK.', 'Team leader review OK.')); },
      ret: function (el) { var p = el.getAttribute('data-val').split('|'); reasonDlg({ title: L('Kembalikan item', 'Return the item'), icon: 'undo', sub: esc(p[1]), label: L('Apa yang perlu diperbaiki?', 'What needs fixing?'), done: L('Item dikembalikan ke tim.', 'Item returned to the team.'), fn: function (n0) { return E.chkReturn(cx(), p[0], p[1], n0); } }); }
    }
  };

  /* ================= NP-12 · MNT-001 Maintenance Dashboard ================= */
  function taskSt(tk) { var s = E.taskSt(tk), x = E.TASK_ST[s]; return A.chip(x[1], x[0]); }
  function planName(tk) { var p = E.plan(tk.plan); return p ? t(p.n) : esc(tk.plan); }
  function taskRow(tk, o) {
    o = o || {}; var m = E.machine(tk.mach), lv = o.lv;
    return '<a class="q8' + (E.taskSt(tk) === 'overdue' ? ' q8-late' : E.taskSt(tk) === 'duetoday' ? ' q8-risk' : '') + '" href="' + href('MNT-004', tk.id) + '"><span class="q8-i">' + ic(mType(m)[1]) + '</span><span class="q8-b"><span class="q8-h"><b>' + esc(tk.mach) + '</b>' + taskSt(tk) + (lv ? A.chip(lv === 'overdue' ? 'crit' : lv === 'today' ? 'appr' : 'info', E.REM[lv], 'bell') : '') + ((E.plan(tk.plan) || {}).danger ? A.chip('warn', L('Butuh teknisi', 'Technician only'), 'lock') : '') + '</span>' +
      '<b class="q8-t">' + planName(tk) + '</b><span class="q8-s">' + t(m.n) + '</span><span class="q8-m"><span>' + ic('calendar') + '<b>' + esc(G.day(tk.date)) + '</b></span><span>' + ic('user') + first(tk.pic) + '</span><span>' + ic('list') + tk.items.length + ' ' + t(L('langkah', 'steps')) + '</span>' + (tk.at ? '<span>' + ic('checkc') + hm(tk.at) + '</span>' : '') + '</span></span><span class="q8-r">' + ic('chevr', 'q8-go') + '</span></a>';
  }
  function woDlg(mach) {
    resetPh('wo8');
    dlg({ title: L('Laporkan masalah mesin', 'Report a machine issue'), icon: 'wrench', ok: L('Buat Work Order', 'Create Work Order'),
      body: fld(L('Mesin', 'Machine'), sel('mach', E.state().mach.map(function (m) { return [m.id, m.id + ' · ' + T(m.n)]; }), mach || E.state().mach[0].id), { req: true, wide: true }) +
        fld(L('Tingkat keparahan', 'Severity'), choice('sev', Object.keys(E.SEV).map(function (k) { return [k, E.SEV[k][0], null, k === 'crit' || k === 'high' ? 'crit' : null]; }), 'med'), { req: true, wide: true, hint: t(L('Tinggi/Kritis menghentikan mesin dan mencatat downtime.', 'High/Critical stops the machine and records downtime.')) }) +
        fld(L('Masalah', 'Issue'), area('issue', '', L('Apa yang terjadi?', 'What happened?')), { req: true, wide: true }) + fld(L('Dampak ke produksi', 'Production impact'), inp('impact', ''), { wide: true }) + fld(L('Foto', 'Photo'), photoIn('wo8', L('Ambil Foto', 'Take Photo')), { wide: true }),
      onOk: function (v, e2) { v = vals(e2); v.photo = photos('wo8')[0] || null; var r = E.woCreate(cx(), v); if (!r.ok) return r.msg; go('MNT-006', r.wo.id); setTimeout(function () { A.toast(L('Work order ' + r.wo.id + ' dibuat.', 'Work order ' + r.wo.id + ' created.')); }, 300); return true; } });
  }
  V['MNT-001'] = {
    render: function () {
      var d = E.mntDash(), rem = E.reminders(), mm = E.mntMetrics(), today = E.tasks({ open: true }).filter(function (tk) { return ['duetoday', 'overdue', 'inprogress'].indexOf(E.taskSt(tk)) >= 0; }), wos = E.workOrders({ open: true });
      var safety = note('<b>' + t(L('Keselamatan', 'Safety')) + ':</b> ' + t(E.SAFETY), 'lock', 'warn');
      return A.pageHead(null, esc(G.day(E.TODAY)) + ' · ' + t(L('Perawatan preventif dari SOP mesin. Pengingat H-7, H-3, H-1, hari ini dan terlambat.', 'Preventive maintenance from the machine SOPs. Reminders at D-7, D-3, D-1, due today and overdue.')), A.pbtn('prod.issue', 'danger', L('Masalah Mesin', 'Machine Issue'), 'alert', { act: 'wo' })) +
        bigCount([{ k: L('Jatuh tempo hari ini', 'Due today'), v: d.dueToday, icon: 'calendar', tone: d.dueToday ? 'warn' : '', go: 'MNT-002' }, { k: L('Segera', 'Due soon'), v: d.dueSoon, icon: 'clock', go: 'MNT-002', qs: 'v=week' }, { k: L('Terlambat', 'Overdue'), v: d.overdue, icon: 'alert', tone: d.overdue ? 'crit' : '', go: 'MNT-002' },
          { k: L('Selesai hari ini', 'Completed today'), v: d.completed, icon: 'checkc', tone: 'ok', go: 'MNT-005' }, { k: L('Work order terbuka', 'Open work orders'), v: d.issue, icon: 'wrench', tone: d.issue ? 'crit' : '', go: 'MNT-006' }, { k: L('Dalam perawatan', 'Under maintenance'), v: d.under, icon: 'pause', go: 'PROD-MACH-001' }]) + safety +
        '<div class="g8-2">' + card(L('Tugas hari ini', 'Today\'s tasks'), qlist(today.map(function (tk) { return taskRow(tk); }), L('Tidak ada tugas hari ini.', 'No tasks today.')), { icon: 'clipboard', count: today.length }) +
        card(L('Pengingat', 'Reminders'), qlist(rem.filter(function (x) { return ['overdue', 'today'].indexOf(x.lv) < 0; }).slice(0, 8).map(function (x) { return taskRow(x.t, { lv: x.lv }); }), L('Tidak ada pengingat.', 'No reminders.')), { icon: 'bell', link: ['MNT-002', L('Kalender', 'Calendar')] }) + '</div>' +
        '<div class="g8-2">' + card(L('Work order terbuka', 'Open work orders'), qlist(wos.map(woRow), L('Tidak ada work order terbuka.', 'No open work order.')), { icon: 'wrench', link: ['MNT-006', L('Semua', 'All')] }) +
        card(L('Kinerja mesin (30 hari)', 'Machine performance (30 days)'), kv([[L('Uptime', 'Uptime'), mm.avail + '%'], [L('PM tepat waktu', 'PM on time'), mm.completion + '%'], [L('Breakdown', 'Breakdowns'), mm.breakdown], [L('Downtime terencana', 'Planned downtime'), mm.planned], [L('Total downtime', 'Total downtime'), minT(mm.total)], [L('MTTR', 'MTTR'), mm.mttr != null ? minT(mm.mttr) : '—']]), { icon: 'chart' }) + '</div>';
    },
    act: { wo: function () { woDlg(); } }
  };

  /* ================= MNT-002 Maintenance Calendar ================= */
  var DOW = [L('Sen', 'Mon'), L('Sel', 'Tue'), L('Rab', 'Wed'), L('Kam', 'Thu'), L('Jum', 'Fri'), L('Sab', 'Sat'), L('Min', 'Sun')];
  function calRow(x) {
    var p = x.plan, tk = x.task, m = E.machine(p.mach), st = tk ? E.taskSt(tk) : 'scheduled', s = E.TASK_ST[st];
    var inner = '<span class="cl8-m"><b>' + esc(p.mach) + '</b> ' + t(p.n) + '</span><span class="cl8-s">' + t(D().FREQ[p.freq][0]) + ' · ' + first(p.pic) + ' ' + A.chip(s[1], s[0]) + '</span>';
    return tk ? '<a class="cl8-r cl8-' + st + '" href="' + href('MNT-004', tk.id) + '">' + ic(mType(m)[1]) + inner + '</a>' : '<div class="cl8-r">' + ic(mType(m)[1]) + inner + '</div>';
  }
  V['MNT-002'] = {
    render: function (c) {
      var v = c.q.v || 'today', body;
      if (v === 'week') {
        var from = E.TODAY, list = E.calendar(from, 7).filter(function (x) { return x.plan.freq !== 'daily' || x.date === E.TODAY; });
        body = '<div class="wk8">' + [0, 1, 2, 3, 4, 5, 6].map(function (i) { var d = E.addDays(from, i), dl = list.filter(function (x) { return x.date === d; }); return '<div class="wk8-d' + (d === E.TODAY ? ' is-today' : '') + '"><span class="wk8-h"><b>' + t(DOW[(new Date(E.ms(d)).getUTCDay() + 6) % 7]) + '</b> ' + esc(G.dts(d)) + '<span class="num">' + dl.length + '</span></span>' + (dl.length ? dl.map(calRow).join('') : '<small class="sub5">—</small>') + '</div>'; }).join('') + '</div>' + note(t(L('Tugas harian tidak ditampilkan di minggu dan bulan agar kalender tetap terbaca.', 'Daily tasks are hidden in week and month views to keep the calendar readable.')), 'info');
      } else if (v === 'month') {
        var y = +E.TODAY.slice(0, 4), mo = +E.TODAY.slice(5, 7), first0 = E.TODAY.slice(0, 8) + '01', n = new Date(Date.UTC(y, mo, 0)).getUTCDate(), cal = E.calendar(first0, n), off = (new Date(E.ms(first0)).getUTCDay() + 6) % 7, sd = c.q.d || E.TODAY;
        var cells = ''; for (var k = 0; k < off; k++) cells += '<span class="mo8-c is-pad"></span>';
        for (var i = 0; i < n; i++) { var d = E.addDays(first0, i), cnt = cal.filter(function (x) { return x.date === d; }), over = cnt.some(function (x) { return x.task && E.taskSt(x.task) === 'overdue'; }); cells += '<a class="mo8-c' + (d === E.TODAY ? ' is-today' : '') + (d === sd ? ' is-sel' : '') + (over ? ' is-over' : '') + '" href="' + href('MNT-002', null, { v: 'month', d: d }) + '"><b class="num">' + (i + 1) + '</b>' + (cnt.length ? '<span class="num">' + cnt.length + '</span>' : '') + '</a>'; }
        var sel0 = cal.filter(function (x) { return x.date === sd; });
        body = '<div class="mo8"><div class="mo8-h">' + DOW.map(function (x) { return '<span>' + t(x) + '</span>'; }).join('') + '</div><div class="mo8-g">' + cells + '</div></div>' + card(esc(G.day(sd)), sel0.length ? sel0.map(calRow).join('') : A.empty(L('Tidak ada jadwal.', 'Nothing scheduled.')), { icon: 'calendar', count: sel0.length });
      } else {
        var tk = E.tasks({ open: true }).filter(function (x) { return ['duetoday', 'overdue', 'inprogress'].indexOf(E.taskSt(x)) >= 0; }), done = E.tasks({ st: 'completed' }).filter(function (x) { return x.at && x.at.slice(0, 10) === E.TODAY; });
        body = card(L('Harus dikerjakan', 'To do'), qlist(tk.map(function (x) { return taskRow(x); }), L('Tidak ada tugas hari ini.', 'No tasks today.')), { icon: 'clipboard', count: tk.length }) + card(L('Selesai hari ini', 'Completed today'), qlist(done.map(function (x) { return taskRow(x); }), L('Belum ada yang selesai.', 'Nothing completed yet.')), { icon: 'checkc', count: done.length });
      }
      return A.pageHead(null, t(L('Jadwal perawatan semua mesin: harian, mingguan, bulanan, 3/6 bulanan, tahunan, jam operasi dan siklus.', 'Maintenance schedule for every machine: daily, weekly, monthly, quarterly/6-monthly, annual, operating hours and cycles.'))) +
        tabs([['today', L('Hari ini', 'Today'), 'calendar'], ['week', L('Minggu ini', 'This week'), 'list'], ['month', L('Bulan', 'Month'), 'grid']], v, 'v', { def: 'today' }) + body;
    }
  };

  /* ================= MNT-003 Machine Detail ================= */
  V['MNT-003'] = {
    title: function (rec) { var m = rec && E.machine(rec); return m ? L(m.id + ' · ' + T(m.n), m.id + ' · ' + m.n[1]) : L('Detail Mesin', 'Machine Detail'); },
    render: function (c) {
      var x = c.rec ? E.machineDetail(c.rec) : null;
      if (!x) return A.pageHead(null, t(L('Pilih mesin untuk melihat jadwal, riwayat, masalah dan downtime.', 'Choose a machine to see its schedule, history, issues and downtime.'))) + '<div class="mc8l">' + E.state().mach.map(function (m) { return '<a class="card mc8c mc8-' + m.st + '" href="' + href('MNT-003', m.id) + '"><span class="mc8c-h"><span class="mc8c-ic">' + ic(mType(m)[1]) + '</span><span><b>' + esc(m.id) + '</b><small>' + t(m.n) + '</small></span>' + machC(m) + '</span></a>'; }).join('') + '</div>';
      var m = x.m, tab = c.q.tab || '', lv = x.live || {};
      var body;
      if (tab === 'plan') body = qlist(x.plans.map(function (p) { return '<div class="q8"><span class="q8-i">' + ic('calendar') + '</span><span class="q8-b"><span class="q8-h"><b>' + t(D().FREQ[p.freq][0]) + '</b>' + (p.danger ? A.chip('warn', L('Butuh teknisi', 'Technician only'), 'lock') : '') + (p.active ? '' : A.chip('mute', L('Nonaktif', 'Inactive'))) + '</span><b class="q8-t">' + t(p.n) + '</b><span class="q8-m"><span>' + ic('calendar') + t(L('Berikutnya ', 'Next ')) + '<b>' + esc(G.day(p.next)) + '</b></span><span>' + ic('history') + t(L('Terakhir ', 'Last ')) + esc(p.last ? G.dts(p.last) : '—') + '</span><span>' + ic('user') + first(p.pic) + '</span>' + (p.freq === 'hours' || p.freq === 'cycles' ? '<span>' + ic('gauge') + t(L('setiap ', 'every ')) + A.fmt.num(p.every, 0) + ' ' + t(p.freq === 'hours' ? L('jam', 'h') : L('siklus', 'cycles')) + '</span>' : '') + '</span></span><span class="q8-r">' + (can('mnt.manage') ? A.btn('ghost', L('Atur', 'Adjust'), 'edit', { act: 'plan', val: p.id, cls: 'btn-sm' }) : '') + '</span></div>'; }), '');
      else if (tab === 'chk') body = qlist(x.tasks.map(function (tk) { return taskRow(tk); }), L('Tidak ada tugas.', 'No tasks.'));
      else if (tab === 'his') body = qlist(x.hist.slice(0, 30).map(histRow), L('Belum ada riwayat.', 'No history yet.'));
      else if (tab === 'iss') body = (x.wo.length ? card(L('Work order', 'Work orders'), qlist(x.wo.map(woRow), ''), { icon: 'wrench' }) : '') + (x.issues.length ? x.issues.map(function (i) { return issueCard(i, {}); }).join('') : '') + (!x.wo.length && !x.issues.length ? A.empty(L('Tidak ada masalah.', 'No issues.')) : '');
      else if (tab === 'dt') body = x.dt.length ? '<div class="tblw"><table class="tbl dense"><thead><tr><th>' + t(L('Mulai', 'Start')) + '</th><th>' + t(L('Selesai', 'End')) + '</th><th class="num">' + t(L('Durasi', 'Duration')) + '</th><th>' + t(L('Jenis', 'Type')) + '</th><th>' + t(L('Alasan', 'Reason')) + '</th></tr></thead><tbody>' + x.dt.map(function (d) { return '<tr><td class="num">' + when(d.start) + '</td><td class="num">' + (d.end ? when(d.end) : A.chip('crit', L('Berjalan', 'Ongoing'))) + '</td><td class="num">' + esc(minT(d.dur)) + '</td><td>' + A.chip(d.kind === 'breakdown' ? 'crit' : 'info', d.kind === 'breakdown' ? L('Breakdown', 'Breakdown') : L('Terencana', 'Planned')) + '</td><td>' + t(d.reason) + (d.wo ? ' · ' + lnk('MNT-006', d.wo, esc(d.wo)) : '') + '</td></tr>'; }).join('') + '</tbody></table></div>' : A.empty(L('Tidak ada downtime.', 'No downtime.'));
      else if (tab === 'doc') body = '<ul class="dc8">' + x.docs.map(function (d) { return '<li>' + ic('file') + '<span>' + t(d) + '</span>' + A.chip('mute', L('Dokumen fisik di ruang teknisi', 'Paper copy in the technician room')) + '</li>'; }).join('') + '</ul>' + card(L('Langkah SOP', 'SOP steps'), '<ul class="dc8">' + x.sop.map(function (s0) { return '<li>' + ic(s0.danger ? 'lock' : 'check') + '<span><b>' + esc(s0.code) + '</b> ' + t(s0.n) + '</span>' + A.chip('info', D().FREQ[s0.freq][0]) + '</li>'; }).join('') + '</ul>', { icon: 'list' });
      else body = kv([[L('Merek', 'Brand'), esc(m.brand)], [L('No. seri', 'Serial no.'), '<span class="mono6">' + esc(m.serial) + '</span>'], [L('Lokasi', 'Location'), t(m.loc)], [L('Kapasitas', 'Capacity'), m.cap ? m.cap + (m.type === 'boiler' ? ' kg/' + T(L('jam', 'h')) : ' kg') : '—'], [L('Jam operasi', 'Operating hours'), A.fmt.num(m.hours, 0)], [L('Siklus', 'Cycles'), A.fmt.num(m.cycles, 0)], [L('Dipasang', 'Installed'), m.installed ? esc(G.dts(m.installed)) + ' ' + m.installed.slice(0, 4) : '—']]) +
        (lv.b ? note(t(L('Sedang menjalankan ', 'Running ')) + bLink(lv.b.id) + ' · ' + t(L('selesai ', 'finishes ')) + hm(lv.end), 'play', 'info') : '') + (m.why ? note(t(m.why), 'pause', 'mute') : '') +
        (x.plans.length ? card(L('Jadwal berikutnya', 'Next schedule'), qlist(x.tasks.filter(function (tk) { return tk.st !== 'completed'; }).slice(0, 4).map(function (tk) { return taskRow(tk); }), ''), { icon: 'calendar' }) : '');
      return hero({ id: m.id, icon: mType(m)[1], title: t(m.n), sub: t(mType(m)[0]) + ' · ' + t(m.loc), chips: machC(m), facts: [[L('Utilisasi hari ini', 'Utilisation today'), lv.util != null ? lv.util + '%' : '—', 'num'], [L('PM berikutnya', 'Next PM'), lv.pm ? esc(G.day(lv.pm.next)) : '—'], [L('Work order', 'Work order'), lv.wo ? lnk('MNT-006', lv.wo.id, esc(lv.wo.id)) : '—']] }) +
        '<div class="bt8">' + (can('prod.issue') ? A.btn('danger', L('Masalah Mesin', 'Machine Issue'), 'alert', { act: 'wo' }) : '') + (can('mnt.manage') || can('prod.spv') ? A.btn('ghost', L('Ubah status', 'Change status'), 'power', { act: 'status' }) : '') + '</div>' +
        tabs([['', L('Ringkasan', 'Overview'), 'info'], ['plan', L('Jadwal', 'Schedule'), 'calendar', x.plans.length], ['chk', L('Checklist', 'Checklist'), 'clipboard', x.tasks.filter(function (tk) { return tk.st !== 'completed'; }).length], ['his', L('Riwayat', 'History'), 'history', x.hist.length], ['iss', L('Masalah', 'Issues'), 'alert', x.wo.filter(function (w) { return w.st !== 'ready'; }).length + x.issues.filter(function (i) { return i.st !== 'resolved'; }).length], ['dt', L('Downtime', 'Downtime'), 'pause', x.dt.length], ['doc', L('Dokumen', 'Documents'), 'file']], tab, 'tab', { def: '' }) + body;
    },
    act: {
      wo: function () { woDlg(A.S.rec); },
      status: function () {
        var m = E.machine(A.S.rec);
        dlg({ title: L('Ubah status mesin', 'Change machine status'), icon: 'power', sub: esc(m.id) + ' · ' + t(E.MACH_ST[m.st][0]), ok: L('Simpan', 'Save'),
          body: fld(L('Status', 'Status'), choice('st', [['normal', E.MACH_ST.normal[0]], ['idle', E.MACH_ST.idle[0]], ['offline', E.MACH_ST.offline[0]]], m.st === 'offline' ? 'normal' : 'offline'), { req: true, wide: true }) + fld(L('Alasan', 'Reason'), area('reason', '', ''), { req: true, wide: true }) + note(t(L('Mesin perbaikan/error kembali normal hanya lewat verifikasi work order.', 'Machines in repair/error return to normal only through work order verification.')), 'info'),
          onOk: function (v, e2) { v = vals(e2); var r = E.setMachine(cx(), m.id, v.st, v.reason); if (!r.ok) return r.msg; after(L('Status mesin diubah.', 'Machine status changed.')); return true; } });
      },
      plan: function (el) {
        var p = E.plan(el.getAttribute('data-val')), techs = Object.keys(D().STAFF || {}).filter(function (e) { return ['EMP-102', 'EMP-074', 'EMP-075', 'EMP-077', 'EMP-078'].indexOf(e) >= 0; });
        dlg({ title: L('Atur jadwal', 'Adjust schedule'), icon: 'calendar', sub: t(p.n), ok: L('Simpan', 'Save'),
          body: fld(L('Tanggal berikutnya', 'Next date'), inp('next', p.next, { type: 'date' }), { wide: true }) + fld(L('Alasan ubah tanggal', 'Reason for the date change'), inp('reason', ''), { wide: true, hint: t(L('Wajib jika tanggal diubah.', 'Required when the date changes.')) }) +
            fld(L('PIC', 'PIC'), sel('pic', techs.map(function (e) { return [e, staffName(e)]; }), p.pic), { wide: true }) +
            fld(L('Pengingat', 'Reminders'), '<div class="ch7" data-multi="rem">' + [7, 3, 1].map(function (n) { var on = (p.rem || E.cfg().rem || []).indexOf(n) >= 0; return '<label class="ch7-i"><input type="checkbox" name="rem" value="' + n + '"' + (on ? ' checked' : '') + '><span>H-' + n + '</span></label>'; }).join('') + '</div>', { wide: true }),
          onOk: function (v, e2) { v = vals(e2); var f = { pic: v.pic, rem: [].concat(v.rem || []) }; if (v.next && v.next !== p.next) { f.next = v.next; f.reason = v.reason; } var r = E.planSet(cx(), p.id, f); if (!r.ok) return r.msg; after(L('Jadwal disimpan.', 'Schedule saved.')); return true; } });
      }
    }
  };

  /* ================= MNT-004 Maintenance Checklist ================= */
  V['MNT-004'] = {
    title: function (rec) { var tk = rec && E.task(rec); return tk ? L('Maintenance ' + tk.mach, tk.mach + ' maintenance') : L('Checklist Maintenance', 'Maintenance Checklist'); },
    render: function (c) {
      var tk = c.rec ? E.task(c.rec) : null;
      if (!tk) { var open = E.tasks({ open: true }).filter(function (x) { return ['duetoday', 'overdue', 'inprogress', 'duesoon'].indexOf(E.taskSt(x)) >= 0; }); return A.pageHead(null, t(L('Pilih tugas maintenance untuk dikerjakan.', 'Choose a maintenance task to work on.'))) + qlist(open.map(function (x) { return taskRow(x); }), L('Tidak ada tugas terbuka.', 'No open tasks.')); }
      var m = E.machine(tk.mach), p = E.plan(tk.plan), st = E.taskSt(tk), working = tk.st === 'inprogress' && can('mnt.do');
      var danger = (p && p.danger) || tk.items.some(function (it) { var s0 = E.sopItem(tk.mach, it.code); return s0 && s0.danger; });
      var steps = tk.items.map(function (it) {
        var s0 = E.sopItem(tk.mach, it.code) || { n: L(it.code, it.code) }, val = it.ok === true ? 'ok' : it.ok === false ? 'bad' : '';
        return '<div class="sop8' + (it.ok === true ? ' sop8-ok' : it.ok === false ? ' sop8-bad' : '') + '"><span class="sop8-h"><b class="mono6">' + esc(it.code) + '</b><b>' + t(s0.n) + '</b>' + (s0.danger ? A.chip('warn', L('Bahaya', 'Hazard'), 'lock') : '') + '</span>' +
          (working ? '<span class="sop8-a">' + choice('ok_' + it.code, [['ok', L('OK', 'OK'), 'check', 'ok'], ['bad', L('Masalah', 'Problem'), 'alert', 'crit']], val) + (s0.num ? '<input class="in8 num" type="number" step="any" name="val_' + it.code + '" value="' + esc(it.val == null ? '' : it.val) + '" placeholder="' + esc(s0.num[1] + '–' + s0.num[2] + ' ' + s0.num[0]) + '" aria-label="' + esc(T(s0.n)) + '">' : '') + '<input class="in8" name="note_' + it.code + '" value="' + esc(it.note || '') + '" placeholder="' + esc(T(L('Catatan', 'Note'))) + '"></span>' :
            '<span class="sop8-r">' + (it.ok === true ? A.chip('ok', L('OK', 'OK'), 'check') : it.ok === false ? A.chip('crit', L('Masalah', 'Problem'), 'alert') : A.chip('mute', L('Belum', 'Not yet'))) + (it.val != null ? '<b class="num">' + esc(it.val) + '</b>' : '') + (it.note ? '<small>' + esc(it.note) + '</small>' : '') + '</span>') + '</div>';
      }).join('');
      var done = tk.items.filter(function (it) { return it.ok != null; }).length;
      return hero({ id: tk.id, icon: mType(m)[1], title: esc(m.id) + ' · ' + t(m.n), sub: p ? t(p.n) : '', chips: taskSt(tk), facts: [[L('Frekuensi', 'Frequency'), t(D().FREQ[tk.freq][0])], [L('Jadwal', 'Due'), esc(G.day(tk.date))], [L('PIC', 'PIC'), first(tk.pic)], [L('Progres', 'Progress'), done + '/' + tk.items.length, 'num'], tk.start ? [L('Mulai', 'Started'), when(tk.start) + ' · ' + first(tk.by), 'num'] : null, tk.at ? [L('Selesai', 'Completed'), when(tk.at), 'num'] : null] }) +
        '<p class="note5 n-' + (danger ? 'crit' : 'warn') + ' sf8">' + ic('lock') + '<span><b>' + t(L('Keselamatan', 'Safety')) + ':</b> ' + t(E.SAFETY) + (danger ? ' ' + t(L('Tugas ini termasuk langkah berbahaya: matikan & kunci sumber listrik/gas sebelum mulai.', 'This task includes hazardous steps: switch off and lock out power/gas before starting.')) : '') + '</span></p>' +
        card(L('Langkah SOP', 'SOP steps'), '<form class="f8" onsubmit="return false"><div class="sop8l">' + steps + '</div>' +
          (working ? fld(L('Part yang diganti', 'Parts replaced'), inp('parts', tk.parts || '', { ph: L('mis. filter lint 1 pcs', 'e.g. lint filter 1 pc') }), { wide: true }) + fld(L('Catatan', 'Notes'), area('notes', tk.notes || '', ''), { wide: true }) + fld(L('Foto', 'Photo'), photoIn('mnt8', L('Ambil Foto', 'Take Photo')), { wide: true }) :
            (tk.parts || tk.notes ? kv([[L('Part', 'Parts'), esc(tk.parts || '—')], [L('Catatan', 'Notes'), esc(tk.notes || '—')]]) : '')) + '</form>' +
          (tk.wo ? note(t(L('Masalah ditemukan → work order ', 'Issue found → work order ')) + lnk('MNT-006', tk.wo, esc(tk.wo)), 'wrench', 'crit') : ''), { icon: 'list', count: tk.items.length }) +
        (tk.st === 'scheduled' && can('mnt.do') ? abar(xl('primary', L('MULAI MAINTENANCE', 'START MAINTENANCE'), 'play', { act: 'start' })) : '') +
        (working ? abar(xl('primary', L('SELESAI', 'COMPLETE'), 'checkc', { act: 'complete' }), xl('ghost', L('Simpan', 'Save'), 'save', { act: 'save' })) : '') +
        (st === 'completed' ? '<div class="bt8">' + A.btn('ghost', L('Riwayat mesin', 'Machine history'), 'history', { go: 'MNT-003', rec: tk.mach, qs: 'tab=his' }) + '</div>' : '');
    },
    act: {
      start: function () { var r = E.mntStart(cx(), A.S.rec, {}); if (!r.ok) return fail(r); after(L('Maintenance dimulai. Mesin ditandai maintenance.', 'Maintenance started. The machine is marked under maintenance.')); },
      save: function () { var r = E.mntSave(cx(), A.S.rec, mntForm()); if (!r.ok) return fail(r); after(L('Progres disimpan.', 'Progress saved.')); },
      complete: function () {
        var f = mntForm(), r = E.mntComplete(cx(), A.S.rec, f); if (!r.ok) return fail(r); resetPh('mnt8');
        after(r.wo ? L('Selesai dengan temuan. Work order ' + r.wo.id + ' dibuat.', 'Completed with findings. Work order ' + r.wo.id + ' created.') : L('Maintenance selesai dan tercatat di riwayat.', 'Maintenance completed and recorded in history.'), r.wo ? 'warn' : 'ok');
      }
    }
  };
  function mntForm() {
    var el = document.querySelector('.f8'), v = vals(el), tk = E.task(A.S.rec), items = {};
    tk.items.forEach(function (it) { var o = {}; if (v['ok_' + it.code]) o.ok = v['ok_' + it.code] === 'ok'; if (v['note_' + it.code] != null) o.note = v['note_' + it.code]; if (v['val_' + it.code] != null && v['val_' + it.code] !== '') o.val = +v['val_' + it.code]; items[it.code] = o; });
    return { items: items, parts: v.parts, notes: v.notes, photo: photos('mnt8')[0] || null };
  }

  /* ================= MNT-005 Maintenance History ================= */
  function histRow(h) {
    var m = E.machine(h.mach);
    return '<div class="q8"><span class="q8-i">' + ic(mType(m)[1]) + '</span><span class="q8-b"><span class="q8-h"><b>' + esc(h.mach) + '</b>' + A.chip('info', D().FREQ[h.freq] ? D().FREQ[h.freq][0] : h.freq) + A.chip(h.result === 'ok' ? 'ok' : 'crit', h.result === 'ok' ? L('OK', 'OK') : L('Ada temuan', 'Findings')) + '</span>' +
      '<b class="q8-t">' + (E.plan(h.plan) ? t(E.plan(h.plan).n) : esc(h.plan)) + '</b><span class="q8-m"><span>' + ic('calendar') + '<b class="num">' + when(h.at) + '</b></span><span>' + ic('user') + first(h.by) + '</span><span>' + ic('list') + (h.items || []).length + ' ' + t(L('langkah', 'steps')) + '</span>' + (h.parts ? '<span>' + ic('package') + esc(h.parts) + '</span>' : '') + (h.wo ? '<span>' + ic('wrench') + lnk('MNT-006', h.wo, esc(h.wo)) + '</span>' : '') + '</span>' + (h.notes ? '<span class="q8-s">' + esc(h.notes) + '</span>' : '') + '</span></div>';
  }
  V['MNT-005'] = {
    render: function (c) {
      var mf = c.q.m || '', list = E.history(mf || null);
      return A.pageHead(null, t(L('Semua maintenance yang selesai. Catatan tidak pernah ditimpa.', 'All completed maintenance. Records are never overwritten.'))) +
        '<form class="sr8" onsubmit="return false">' + sel('m', [['', L('Semua mesin', 'All machines')]].concat(E.state().mach.map(function (m) { return [m.id, m.id + ' · ' + T(m.n)]; })), mf) + '</form>' +
        qlist(list.slice(0, 80).map(histRow), L('Belum ada riwayat.', 'No history yet.')) + (list.length > 80 ? note(t(L('Menampilkan 80 terbaru dari ' + list.length + '.', 'Showing the latest 80 of ' + list.length + '.')), 'info') : '');
    },
    after: function () { var s0 = document.querySelector('.sr8 [name=m]'); if (s0) s0.addEventListener('change', function () { go('MNT-005', null, this.value ? { m: this.value } : {}); }); }
  };

  /* ================= MNT-006 Machine Issue / Work Order ================= */
  function woRow(w) {
    var x = E.WO_ST[w.st], m = E.machine(w.mach);
    return '<a class="q8' + (w.st !== 'ready' && (w.sev === 'high' || w.sev === 'crit') ? ' q8-late' : '') + '" href="' + href('MNT-006', w.id) + '"><span class="q8-i">' + ic(mType(m)[1]) + '</span><span class="q8-b"><span class="q8-h"><b class="mono6">' + esc(w.id) + '</b>' + A.chip(x[1], x[0]) + sevC(w.sev) + '</span><b class="q8-t">' + esc(w.mach) + ' · ' + t(w.issue) + '</b><span class="q8-m"><span>' + ic('clock') + '<b class="num">' + when(w.at) + '</b></span><span>' + ic('user') + first(w.by) + '</span>' + (w.tech ? '<span>' + ic('wrench') + first(w.tech) + '</span>' : '') + '</span></span><span class="q8-r">' + ic('chevr', 'q8-go') + '</span></a>';
  }
  V['MNT-006'] = {
    title: function (rec) { return rec ? L('Work Order ' + rec, 'Work Order ' + rec) : L('Masalah Mesin / Work Order', 'Machine Issue / Work Order'); },
    render: function (c) {
      var w = c.rec ? E.wo(c.rec) : null;
      if (!w) {
        var tab = c.q.tab || '', all = E.workOrders(), list = tab === 'all' ? all : all.filter(function (x) { return x.st !== 'ready'; });
        return A.pageHead(null, t(L('Masalah → work order → perbaikan → tes → verifikasi supervisor → siap pakai.', 'Issue → work order → repair → test → supervisor verification → ready for service.')), A.pbtn('prod.issue', 'primary', L('Laporkan Masalah', 'Report Issue'), 'alert', { act: 'new' })) +
          tabs([['', L('Terbuka', 'Open'), 'wrench', all.filter(function (x) { return x.st !== 'ready'; }).length], ['all', L('Semua', 'All'), 'list', all.length]], tab, 'tab', { def: '' }) + qlist(list.map(woRow), L('Tidak ada work order terbuka.', 'No open work order.'));
      }
      var m = E.machine(w.mach), idx = E.WO_FLOW.indexOf(w.st), act = '';
      if (w.st === 'open' && can('mnt.manage')) act = xl('primary', L('TUGASKAN TEKNISI', 'ASSIGN TECHNICIAN'), 'user', { act: 'assign' });
      else if (w.st === 'assigned' && can('mnt.do')) act = xl('primary', L('MULAI PERBAIKAN', 'START REPAIR'), 'wrench', { act: 'start' });
      else if (w.st === 'repair' && can('mnt.do')) act = xl('primary', L('SELESAI PERBAIKAN', 'REPAIR DONE'), 'checkc', { act: 'finish' });
      else if (w.st === 'test' && can('mnt.do')) act = xl('primary', L('HASIL TES', 'TEST RESULT'), 'play', { act: 'test' });
      else if (w.st === 'verify' && can('mnt.verify')) act = xl('primary', L('VERIFIKASI · SIAP DIPAKAI', 'VERIFY · READY FOR SERVICE'), 'filecheck', { act: 'verify' });
      var log = '<ol class="tl8">' + w.log.map(function (l) { var x = E.WO_ST[l[0]]; return '<li><span class="tl8-t num">' + when(l[1]) + '</span><span class="tl8-ic">' + ic('dot') + '</span><span class="tl8-b"><b>' + t(x[0]) + '</b><small>' + emp(l[2]) + '</small></span></li>'; }).join('') + '</ol>';
      return hero({ id: w.id, icon: mType(m)[1], title: esc(m.id) + ' · ' + t(m.n), sub: t(w.issue), chips: A.chip(E.WO_ST[w.st][1], E.WO_ST[w.st][0]) + sevC(w.sev) + machC(m),
          facts: [[L('Dilaporkan', 'Reported'), when(w.at) + ' · ' + first(w.by), 'num'], [L('Teknisi', 'Technician'), w.tech ? emp(w.tech) : '—'], [L('Dampak', 'Impact'), w.impact ? t(w.impact) : '—'], w.batch ? [L('Batch', 'Batch'), bLink(w.batch)] : null, w.src ? [L('Sumber', 'Source'), '<span class="mono6">' + esc(w.src) + '</span>'] : null, w.repStart ? [L('Perbaikan', 'Repair'), hm(w.repStart) + (w.repEnd ? ' – ' + hm(w.repEnd) : ''), 'num'] : null] }) +
        step8(E.WO_FLOW.map(function (k) { return E.WO_ST[k][0]; }), w.st === 'ready' ? E.WO_FLOW.length : idx) +
        (w.parts || w.notes || w.verNote ? card(L('Perbaikan', 'Repair'), kv([[L('Part', 'Parts'), w.parts ? t(w.parts) : '—'], [L('Catatan', 'Notes'), w.notes ? t(w.notes) : '—'], w.testNote ? [L('Tes', 'Test'), esc(w.testNote)] : null, w.verNote ? [L('Verifikasi', 'Verification'), esc(w.verNote) + ' · ' + first(w.verBy)] : null]), { icon: 'wrench' }) : '') +
        (w.ev && w.ev.length ? '<div class="ev8">' + w.ev.map(function (e) { return img(e, 'bukti'); }).join('') + '</div>' : '') +
        card(L('Riwayat status', 'Status history'), log, { icon: 'history' }) + (act ? abar(act) : '');
    },
    act: {
      new: function () { woDlg(); },
      assign: function () {
        var techs = ['EMP-102'].concat(Object.keys(D().STAFF || {}).filter(function (e) { return e !== 'EMP-102' && /teknisi|technician|maint/i.test(JSON.stringify(D().STAFF[e])); }));
        dlg({ title: L('Tugaskan teknisi', 'Assign a technician'), icon: 'user', sub: esc(A.S.rec), ok: L('Tugaskan', 'Assign'), body: fld(L('Teknisi', 'Technician'), choice('tech', techs.map(function (e) { return [e, E.first(e)]; }), techs[0], { cls: 'ch8-who' }), { req: true, wide: true }),
          onOk: function (v, e2) { v = vals(e2); var r = E.woAssign(cx(), A.S.rec, v.tech); if (!r.ok) return r.msg; after(L('Teknisi ditugaskan.', 'Technician assigned.')); return true; } });
      },
      start: function () { var r = E.woStart(cx(), A.S.rec); if (!r.ok) return fail(r); after(L('Perbaikan dimulai. Mesin ditandai perbaikan.', 'Repair started. The machine is marked under repair.')); },
      finish: function () {
        resetPh('wof8');
        dlg({ title: L('Selesai perbaikan', 'Repair done'), icon: 'checkc', sub: esc(A.S.rec), ok: L('Lanjut ke tes', 'Continue to test'),
          body: fld(L('Apa yang diperbaiki?', 'What was repaired?'), area('notes', '', ''), { req: true, wide: true }) + fld(L('Part yang diganti', 'Parts replaced'), inp('parts', ''), { wide: true }) + fld(L('Foto', 'Photo'), photoIn('wof8', L('Ambil Foto', 'Take Photo')), { wide: true }),
          onOk: function (v, e2) { v = vals(e2); v.photo = photos('wof8')[0] || null; var r = E.woFinish(cx(), A.S.rec, v); if (!r.ok) return r.msg; after(L('Perbaikan selesai. Jalankan tes.', 'Repair done. Run the test.')); return true; } });
      },
      test: function () {
        dlg({ title: L('Hasil tes', 'Test result'), icon: 'play', sub: esc(A.S.rec), ok: L('Simpan', 'Save'),
          body: fld(L('Hasil', 'Result'), choice('result', [['pass', L('Lulus', 'Pass'), 'checkc', 'ok'], ['fail', L('Gagal', 'Fail'), 'alert', 'crit']], 'pass'), { req: true, wide: true }) + fld(L('Catatan tes', 'Test note'), area('note', '', L('mis. 1 siklus kosong normal', 'e.g. 1 empty cycle normal')), { wide: true }),
          onOk: function (v, e2) { v = vals(e2); var r = E.woTest(cx(), A.S.rec, v); if (!r.ok) return r.msg; after(v.result === 'fail' ? L('Tes gagal. Kembali ke perbaikan.', 'Test failed. Back to repair.') : L('Tes lulus. Menunggu verifikasi supervisor.', 'Test passed. Waiting for supervisor verification.'), v.result === 'fail' ? 'warn' : 'ok'); return true; } });
      },
      verify: function () { reasonDlg({ title: L('Verifikasi supervisor', 'Supervisor verification'), icon: 'filecheck', sub: esc(A.S.rec), label: L('Catatan verifikasi', 'Verification note'), done: L('Mesin siap dipakai lagi.', 'Machine ready for service again.'), fn: function (n0) { return E.woVerify(cx(), A.S.rec, n0); } }); }
    }
  };
})();
