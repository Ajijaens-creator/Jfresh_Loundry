/* JFRESH OS — Phase 9 screens (part 3): returns (RETURN-001), redelivery chain (REDEL-001), service
   completion (COMP-001), the full service timeline (DLV-TIMELINE-001), Billing Ready and the Finance
   handoff (BILL-001, BILL-002), and delivery performance & client experience (DLV-KPI-001).
   Desktop first for the manager, finance and owner; the return flow also works on the plant iPad.
   Ready ≠ Delivered ≠ Completed ≠ Billing Ready: every step has its own gate in the engine. */
(function () {
  var A = window.JFAPP, E = window.JFDLV, H = A && A.P5, G = A && A.P7, P8 = A && A.P8, P = A && A.P9;
  if (!A || !E || !H || !G || !P8 || !P) return;
  var V = A.V, T = A.T, L = A.L, t = A.t, esc = A.esc, ic = A.ic, can = A.can, href = A.href;
  var lnk = H.lnk, tabs = H.tabs, card = H.card, kv = H.kv, note = H.note, dlg = H.dlg, fld = H.fld, inp = H.inp, sel = H.sel, area = H.area, tile = H.tile, tiles = H.tiles;
  var after = G.after, fail = G.fail, vals = G.vals, choice = G.choice, img = G.img, when = G.when;
  var cx = P.cx, go = P.go, kg = P.kg, pcs = P.pcs, rp = P.rp, cname = P.cname, pname = P.pname, first = P.first, win = P.win, stC = P.stC, billC = P.billC, retC = P.retC, slaC = P.slaC, recC = P.recC, dLink = P.dLink, oLink = P.oLink, checks = P.checks;
  var hero = P8.hero, abar = P8.abar, xl = P8.xl, bigCount = P8.bigCount, reasonDlg = P8.reasonDlg;

  /* ================= NP-07 · RETURN-001 Return Detail ================= */
  var RET_NEXT = { intransit: ['arrived', L('TERIMA DI PLANT', 'RECEIVE AT PLANT'), 'inbox'], arrived: ['review', L('MULAI REVIEW', 'START REVIEW'), 'search'], reprocess: ['ready', L('SIAP KIRIM ULANG', 'READY FOR REDELIVERY'), 'checkc'], repack: ['ready', L('SIAP KIRIM ULANG', 'READY FOR REDELIVERY'), 'checkc'] };
  function retRow(r) {
    return '<a class="q8' + (['arrived', 'review'].indexOf(r.st) >= 0 ? ' q8-risk' : '') + '" href="' + href('RETURN-001', r.id) + '"><span class="q8-i">' + ic('arrowl') + '</span><span class="q8-b"><span class="q8-h"><b class="mono6">' + esc(r.id) + '</b><span class="sub5 mono6">' + esc(r.dlv) + '</span></span>' +
      '<b class="q8-t">' + cname(r.cl) + '</b><span class="q8-s">' + pname(r.prop) + ' · ' + t(E.ISSUE_TYPES[r.reason] ? E.ISSUE_TYPES[r.reason][0] : L(r.reason, r.reason)) + '</span>' +
      '<span class="q8-m"><span>' + ic('package') + '<b class="num">' + r.pkgs + '</b></span><span>' + ic('layers') + '<b class="num">' + pcs(r.qty) + '</b></span><span>' + ic('clock') + '<b>' + esc(when(r.at)) + '</b></span>' + (r.redel ? '<span>' + ic('refresh') + '<b class="mono6">' + esc(r.redel) + '</b></span>' : '') + '</span></span>' +
      '<span class="q8-r">' + retC(r) + ic('chevr', 'q8-go') + '</span></a>';
  }
  function redelDlg(r) {
    dlg({ title: L('Buat pengiriman ulang', 'Create the redelivery'), icon: 'refresh', sub: '<b>' + esc(r.id) + '</b> · ' + pname(r.prop) + ' · ' + r.pkgs + ' ' + t(L('paket', 'pkg')) + ' · ' + pcs(r.qty),
      body: '<div class="f6-g">' + fld(L('Tanggal', 'Date'), inp('date', E.addDays(E.TODAY, 1), { type: 'date' }), { req: true }) + fld(L('Jam mulai', 'From'), inp('w0', '09:00', { type: 'time' }), { req: true }) + fld(L('Jam selesai', 'To'), inp('w1', '10:00', { type: 'time' }), { req: true }) + '</div>' + fld(L('Alasan / catatan', 'Reason / note'), area('reason', ''), { wide: true, hint: t(L('Klien menerima jadwal pengiriman ulang.', 'The client receives the redelivery schedule.')) }),
      onOk: function (x) { var res = E.createRedelivery(cx(), r.id, { date: x.date, win: [x.w0, x.w1], reason: x.reason }); if (!res.ok) return res.msg; after(L('Pengiriman ulang ' + res.dlv.id + ' dibuat. Delivery asli tidak diubah.', 'Redelivery ' + res.dlv.id + ' created. The original delivery is unchanged.')); return true; } });
  }
  V['RETURN-001'] = {
    title: function (rec) { return rec ? L('Return ' + rec, 'Return ' + rec) : L('Return & Redelivery', 'Returns & Redelivery'); },
    render: function (c) {
      var c0 = cx(), all = E.returns(c0, {});
      if (!c.rec) {
        var tab = c.q.tab || 'open', open = all.filter(function (r) { return r.st !== 'closed'; }), list = tab === 'open' ? open : tab === 'closed' ? all.filter(function (r) { return r.st === 'closed'; }) : all;
        var cnt = function (s) { return all.filter(function (r) { return s.indexOf(r.st) >= 0; }).length; };
        return A.pageHead(null, t(L('Barang yang dibawa kembali ke plant: diterima Team 3, direview, diproses ulang, lalu dikirim ulang. Riwayat tidak pernah dihapus.', 'Goods brought back to the plant: received by Team 3, reviewed, reprocessed, then redelivered. History is never deleted.')), can('dlv.view') ? A.btn('ghost', L('Rantai Redelivery', 'Redelivery Chains'), 'refresh', { go: 'REDEL-001' }) : '') +
          bigCount([{ k: L('Dalam perjalanan', 'In transit'), v: cnt(['created', 'intransit']), icon: 'truck' }, { k: L('Tiba / review', 'Arrived / review'), v: cnt(['arrived', 'review']), icon: 'search', tone: cnt(['arrived', 'review']) ? 'warn' : '' }, { k: L('Proses / kemas ulang', 'Reprocess / repack'), v: cnt(['reprocess', 'repack']), icon: 'washer' }, { k: L('Siap kirim ulang', 'Ready for redelivery'), v: cnt(['ready']), icon: 'checkc', tone: cnt(['ready']) ? 'ok' : '' }, { k: L('Ditutup', 'Closed'), v: cnt(['closed']), icon: 'lock' }]) +
          tabs([['open', L('Terbuka', 'Open'), 'arrowl', open.length], ['closed', L('Ditutup', 'Closed'), 'lock', all.length - open.length], ['all', L('Semua', 'All'), 'list', all.length]], tab, 'tab', { def: 'open' }) +
          P.dlist(list.map(retRow), c.s.emp);
      }
      var r = E.ret(c.rec); if (!r) return A.stateCard('empty', L('Return tidak ditemukan.', 'Return not found.'), A.backBtn());
      var d = E.dlv(r.dlv), steps = ['created', 'intransit', 'arrived', 'review', 'reprocess', 'ready', 'closed'], cur = Math.max(0, steps.indexOf(r.st === 'repack' ? 'reprocess' : r.st));
      var h = hero({ id: r.id + ' · ' + r.dlv, icon: 'arrowl', title: pname(r.prop), sub: cname(r.cl) + ' · ' + t(E.ISSUE_TYPES[r.reason] ? E.ISSUE_TYPES[r.reason][0] : L(r.reason, r.reason)) + ' · ' + esc(when(r.at)), chips: retC(r),
        facts: [[L('Paket', 'Packages'), r.pkgs, 'num'], [L('Jumlah', 'Quantity'), pcs(r.qty), 'num'], [L('Berat', 'Weight'), kg(r.kg), 'num'], [L('Driver', 'Driver'), first(r.drv)], [L('Tindakan', 'Action'), t(E.RET_NEED[r.need] || L(r.need, r.need))]],
        extra: P8.step8([L('Dibuat', 'Created'), L('Perjalanan', 'In transit'), L('Tiba', 'Arrived'), L('Review', 'Review'), L('Proses ulang', 'Reprocess'), L('Siap', 'Ready'), L('Ditutup', 'Closed')], r.st === 'closed' ? 7 : cur) });
      var det = card(L('Detail return', 'Return detail'), kv([[L('Delivery asli', 'Original delivery'), dLink(r.dlv)], [L('Order', 'Order'), (r.ord ? oLink(r.ord) : P.dOrd(E.dlv(r.dlv) || {}))], [L('Alasan', 'Reason'), t(E.ISSUE_TYPES[r.reason] ? E.ISSUE_TYPES[r.reason][0] : L(r.reason, r.reason))], [L('Catatan', 'Notes'), esc(T(r.note))], [L('Masalah', 'Issue'), r.issue ? lnk('DLV-ISSUE-001', r.dlv, esc(r.issue), { list: '1' }) : '—'], [L('Penanggung jawab', 'Owner'), first(r.owner)], [L('Pengiriman ulang', 'Redelivery'), r.redel ? dLink(r.redel) : '—']]) + P.evPh(r.photo, 'return'), { icon: 'file' });
      var hist = card(L('Riwayat', 'History'), '<ol class="tl9">' + r.hist.map(function (x) { var s = E.RET_ST[x[0]], lab = s ? s[0] : x[0] === 'redel' ? L('Redelivery dibuat', 'Redelivery created') : L(x[0], x[0]); return '<li><span class="tl9-t num">' + esc(when(x[1])) + '</span><span class="tl9-ic">' + ic(x[0] === 'redel' ? 'refresh' : 'dot') + '</span><b>' + t(lab) + '</b><small>' + first(x[2]) + (x[3] ? ' · ' + esc(T(x[3])) : '') + '</small></li>'; }).join('') + '</ol>' + note(t(L('Setiap langkah ditambahkan; riwayat return tidak pernah dihapus.', 'Every step is appended; return history is never deleted.')), 'lock'), { icon: 'history', count: r.hist.length });
      var main = '', side = '', nx = RET_NEXT[r.st];
      if (nx && can(nx[0] === 'arrived' ? 'dlv.return.receive' : 'dlv.return')) main = xl('primary', nx[1], nx[2], { act: 'adv', val: r.id + '|' + nx[0] });
      if (r.st === 'review' && can('dlv.return')) { main = xl('primary', L('SIAP KIRIM ULANG', 'READY FOR REDELIVERY'), 'checkc', { act: 'adv', val: r.id + '|ready' }); side = A.btn('blue', L('Proses Ulang', 'Reprocess'), 'washer', { act: 'adv', val: r.id + '|reprocess' }) + A.btn('blue', L('Kemas Ulang', 'Repack'), 'package', { act: 'adv', val: r.id + '|repack' }) + A.btn('ghost', L('Tutup Return', 'Close Return'), 'lock', { act: 'adv', val: r.id + '|closed' }); }
      if (r.st === 'ready' && (can('dlv.return') || can('dlv.dispatch'))) { if (!r.redel) main = xl('primary', L('BUAT PENGIRIMAN ULANG', 'CREATE REDELIVERY'), 'refresh', { act: 'redel', val: r.id }); side = A.btn('ghost', L('Tutup Return', 'Close Return'), 'lock', { act: 'adv', val: r.id + '|closed' }); }
      side += A.btn('ghost', P.DOCS.ret, 'print', { act: 'doc', val: 'ret|' + r.dlv });
      return h + '<div class="g2-9">' + det + hist + '</div>' + abar(main, side);
    },
    act: Object.assign({
      adv: function (el) {
        var p = el.getAttribute('data-val').split('|'), id = p[0], to = p[1], r = E.ret(id);
        if (to === 'arrived' || to === 'review' || (to === 'ready' && r.st !== 'review')) { var res = E.retAdvance(cx(), id, to, {}); if (!res.ok) return fail(res); return after(L('Status return: ' + T(E.RET_ST[to][0]) + '.', 'Return status: ' + E.RET_ST[to][0][1] + '.')); }
        var needOpts = Object.keys(E.RET_NEED).map(function (k) { return [k, E.RET_NEED[k]]; });
        dlg({ title: E.RET_ST[to][0], icon: to === 'closed' ? 'lock' : 'edit', sub: '<b>' + esc(id) + '</b>',
          body: (to === 'closed' || to === 'ready' ? fld(L('Tindakan berikutnya', 'Next action'), sel('need', needOpts, to === 'closed' ? 'claim' : 'redelivery'), { wide: true }) : '') + fld(to === 'reprocess' || to === 'repack' ? L('Instruksi untuk tim produksi', 'Instruction for the production team') : L('Catatan', 'Note'), area('note', ''), { req: to !== 'ready', wide: true }),
          onOk: function (x) { var res = E.retAdvance(cx(), id, to, { note: x.note, need: x.need }); if (!res.ok) return res.msg; after(L('Status return: ' + T(E.RET_ST[to][0]) + '.', 'Return status: ' + E.RET_ST[to][0][1] + '.')); return true; } });
      },
      redel: function (el) { redelDlg(E.ret(el.getAttribute('data-val'))); }
    }, P.DOC_ACT)
  };

  /* ================= NP-07 · REDEL-001 Redelivery Detail (chain) ================= */
  V['REDEL-001'] = {
    title: function (rec) { return rec ? L('Rantai Pengiriman', 'Delivery Chain') : null; },
    render: function (c) {
      var c0 = cx();
      if (!c.rec) {
        var list = E.deliveries(c0, {}).filter(function (d) { return d.orig; });
        return A.pageHead(null, t(L('Setiap pengiriman ulang adalah delivery baru yang terhubung ke delivery asli dan return-nya. Delivery asli tidak pernah ditimpa.', 'Every redelivery is a new delivery linked to the original and its return. The original is never overwritten.'))) +
          P.dlist(list.map(function (d) { return P.drow(d, { go: 'REDEL-001', icon: 'refresh', meta: '<span>' + ic('arrowl') + '<b class="mono6">' + esc(d.orig) + '</b></span>' + (d.ret ? '<span>' + ic('package') + '<b class="mono6">' + esc(d.ret) + '</b></span>' : '') }); }), c.s.emp);
      }
      var d = E.dlv(c.rec); if (!d || !E.canSee(c0, d)) return A.stateCard('noperm', L('Anda tidak memiliki akses.', 'You do not have access.'), A.backBtn());
      var chain = E.chain(d.id);
      var nodes = chain.map(function (x, i) {
        var y = x.dlv, r = x.ret && x.ret.dlv === y.id ? x.ret : (y.ret && E.ret(y.ret) && E.ret(y.ret).dlv === y.id ? E.ret(y.ret) : null);
        return '<section class="card ch9' + (y.id === d.id ? ' is-cur' : '') + '"><div class="ch9-h"><span class="ch9-n">' + (i + 1) + '</span><b>' + t(i === 0 ? L('Delivery asli', 'Original delivery') : L('Pengiriman ulang ke-' + y.attempt, 'Redelivery #' + y.attempt)) + '</b>' + stC(y) + '</div>' +
          kv([[L('Delivery', 'Delivery'), dLink(y.id)], [L('Order', 'Order'), P.dOrd(y)], [L('Jadwal', 'Window'), win(y)], [L('Paket / jumlah', 'Packages / qty'), y.pkgs + ' · ' + pcs(y.qty)], [L('Driver', 'Driver'), first(E.driverOf(y))], [L('POD', 'POD'), y.pod ? lnk('DLV-POD-002', y.id, esc(y.pod.id)) : '—'], [L('Rekonsiliasi', 'Reconciliation'), recC(y.rec)]]) +
          (r ? '<div class="ch9-r">' + ic('arrowl') + '<span>' + t(L('Return ', 'Return ')) + lnk('RETURN-001', r.id, '<b class="mono6">' + esc(r.id) + '</b>') + ' · ' + t(E.ISSUE_TYPES[r.reason] ? E.ISSUE_TYPES[r.reason][0] : L(r.reason, r.reason)) + ' · ' + retC(r) + '</span></div>' : '') + '</section>';
      });
      return A.pageHead(L('Rantai pengiriman ' + chain[0].dlv.id, 'Delivery chain ' + chain[0].dlv.id), cname(d.cl) + ' · ' + pname(d.prop)) + '<div class="chs9">' + nodes.join('<span class="chs9-a">' + ic('arrow') + '</span>') + '</div>' +
        note(t(L('Delivery asli tetap tersimpan dengan POD dan statusnya; pengiriman ulang punya order, driver dan POD sendiri.', 'The original delivery keeps its POD and status; each redelivery has its own order, driver and POD.')), 'lock', 'info') + abar('', P.docBtns(d));
    },
    act: P.DOC_ACT
  };

  /* ================= NP-08 · COMP-001 Service Completion ================= */
  function compRow(d) {
    var ck = E.compChecks(d), ok = ck.filter(function (x) { return x.ok; }).length;
    return P.drow(d, { go: 'COMP-001', icon: 'checkc', right: d.comp ? A.chip('ok', L('Completed v' + d.comp.ver, 'Completed v' + d.comp.ver), 'checkc') : ok === ck.length ? A.chip('info', L('Siap ditetapkan', 'Ready to complete')) : A.chip('appr', ok + '/' + ck.length + ' ' + T(L('cek', 'checks'))), meta: '<span>' + ic('sign') + '<b>' + esc(d.pod ? d.pod.id : '—') + '</b></span>' });
  }
  function compDetail(d) {
    var ck = E.compChecks(d), all = ck.every(function (x) { return x.ok; }), cd = d.comp ? d.comp.data : null, p = d.pod ? E.podView(d.pod) : null, sla = d.sla;
    var h = P.dhero(d, { icon: 'checkc', chips: d.comp ? A.chip('ok', L('SERVICE COMPLETED', 'SERVICE COMPLETED'), 'checkc') + A.chip('mute', 'v' + d.comp.ver, 'lock') : '' });
    var ckc = card(L('Checklist penyelesaian', 'Completion checklist'), checks(ck, { plain: true }) + (d.comp ? note(t(L('Data penyelesaian dibekukan ', 'Completion data frozen ')) + esc(when(d.comp.at)) + ' · ' + first(d.comp.by) + '. ' + t(L('Perubahan hanya lewat amandemen.', 'Changes only through an amendment.')), 'lock', 'ok') : all ? note(t(L('Semua cek lulus. Tetapkan Service Completed untuk membuka Billing Ready.', 'All checks pass. Set Service Completed to open Billing Ready.')), 'checkc', 'ok') : ''), { icon: 'checkc', count: ck.filter(function (x) { return x.ok; }).length + '/' + ck.length });
    var data = cd || (p ? { date: E.TODAY, time: E.hm(E.now()), qty: d.rec && d.rec.acc === 'partial' ? d.rec.accQty : p.qty, kg: p.kg, pkgs: p.pkgs, tat: null, slaDel: sla ? sla.st : 'pending', overall: null, delRes: d.rec ? d.rec.acc : '—' } : null);
    var det = data ? card(L('Detail penyelesaian', 'Completion detail'), kv([[L('Waktu selesai', 'Completed at'), cd ? esc(cd.date + ' ' + cd.time) : t(L('Belum ditetapkan', 'Not set yet'))], [L('Total waktu proses', 'Total turnaround'), data.tat != null ? esc(G.minT(data.tat)) : '—'], [L('Jumlah akhir', 'Final quantity'), pcs(data.qty)], [L('Berat akhir', 'Final weight'), kg(data.kg)], [L('Paket', 'Packages'), data.pkgs],
      [L('SLA delivery', 'Delivery SLA'), slaC(sla) + (sla && sla.cause ? ' · ' + t(E.SLA_CAUSE[sla.cause] || L(sla.cause, sla.cause)) : '')], cd ? [L('SLA pickup / produksi', 'Pickup / production SLA'), A.chip(E.SLA_ST[cd.slaPick][1], E.SLA_ST[cd.slaPick][0]) + ' ' + A.chip(E.SLA_ST[cd.slaProd][1], E.SLA_ST[cd.slaProd][0])] : null, cd ? [L('SLA keseluruhan', 'Overall SLA'), A.chip(E.SLA_ST[cd.overall][1], E.SLA_ST[cd.overall][0])] : null,
      [L('Hasil penerimaan', 'Acceptance'), E.ACC[data.delRes] ? A.chip(E.ACC[data.delRes][1], E.ACC[data.delRes][0]) : '—'], cd ? [L('Masalah selesai', 'Issues resolved'), esc(cd.issRes)] : null, [L('Billing', 'Billing'), billC(d)]]), { icon: 'file' }) : '';
    var hist = d.comp && d.comp.hist.length ? card(L('Amandemen', 'Amendments'), '<div class="tblw"><table class="tbl dense"><thead><tr><th>' + t(L('Versi', 'Version')) + '</th><th>' + t(L('Data', 'Field')) + '</th><th>' + t(L('Dari', 'From')) + '</th><th>' + t(L('Menjadi', 'To')) + '</th><th>' + t(L('Alasan', 'Reason')) + '</th><th>' + t(L('Oleh', 'By')) + '</th><th>' + t(L('Waktu', 'Time')) + '</th></tr></thead><tbody>' +
      d.comp.hist.map(function (x) { return '<tr><td>v' + x.ver + ' → v' + (x.ver + 1) + '</td><td>' + t(E.COMP_FIELDS[x.field]) + '</td><td>' + esc(String(x.from)) + '</td><td><b>' + esc(String(x.to)) + '</b></td><td>' + esc(x.reason) + '</td><td>' + first(x.by) + '</td><td class="num">' + esc(when(x.at)) + '</td></tr>'; }).join('') + '</tbody></table></div>', { icon: 'edit', count: d.comp.hist.length }) : '';
    var main = !d.comp && can('dlv.complete') ? xl(all ? 'ok' : 'primary', L('SERVICE COMPLETED', 'SERVICE COMPLETED'), 'checkc', { act: 'complete', val: d.id, cls: 'btn-ok9' + (all ? '' : ' is-off') }) : '';
    var side = (d.pod ? A.btn('ghost', L('Lihat POD', 'View POD'), 'sign', { go: 'DLV-POD-002', rec: d.id }) : '') + (H.open('DLV-TIMELINE-001') ? A.btn('ghost', L('Lihat Timeline', 'View Timeline'), 'history', { go: 'DLV-TIMELINE-001', rec: d.id }) : '') +
      (d.comp && can('dlv.comp.amend') ? A.btn('blue', L('Amandemen', 'Amend'), 'edit', { act: 'amend', val: d.id }) : '') + (d.comp && H.open('BILL-002') ? A.btn('ghost', 'Billing', 'invoice', { go: 'BILL-002', rec: d.id }) : '') + (d.comp ? A.btn('ghost', P.DOCS.comp, 'print', { act: 'doc', val: 'comp|' + d.id }) : '');
    return h + '<div class="g2-9">' + ckc + det + '</div>' + hist + abar(main, side);
  }
  V['COMP-001'] = {
    title: function (rec) { return rec ? L('Service Completion', 'Service Completion') : null; },
    render: function (c) {
      var c0 = cx();
      if (c.rec) { var d = E.dlv(c.rec); if (!d || !E.canSee(c0, d)) return A.stateCard('noperm', L('Anda tidak memiliki akses.', 'You do not have access.'), A.backBtn()); if (!d.pod) return A.stateCard('warning', L('Belum bisa diselesaikan: barang belum diterima (belum ada POD).', 'Cannot complete yet: the goods are not delivered (no POD).'), A.btn('blue', L('Buka Delivery', 'Open Delivery'), 'truck', { go: 'DISP-002', rec: d.id })); return compDetail(d); }
      var tab = c.q.tab || 'todo', todo = E.completions(c0, { st: 'todo' }), done = E.completions(c0, { st: 'done' }), list = tab === 'todo' ? todo : done;
      var ready = todo.filter(function (d) { return E.compChecks(d).every(function (x) { return x.ok; }); });
      return A.pageHead(null, t(L('Terkirim belum tentu selesai. Service Completed hanya bila POD valid, rekonsiliasi jelas, tidak ada masalah kritis dan SLA final dihitung.', 'Delivered is not yet completed. Service Completed only with a valid POD, a clear reconciliation, no critical issue and a final SLA.'))) +
        bigCount([{ k: L('Siap ditetapkan', 'Ready to complete'), v: ready.length, icon: 'checkc', tone: ready.length ? 'ok' : '', go: 'COMP-001' }, { k: L('Tertahan', 'Blocked'), v: todo.length - ready.length, icon: 'alert', tone: todo.length - ready.length ? 'warn' : '', go: 'COMP-001' }, { k: L('Completed', 'Completed'), v: done.length, icon: 'lock', go: 'COMP-001', qs: 'tab=done' }]) +
        tabs([['todo', L('Belum completed', 'Not completed'), 'clock', todo.length], ['done', L('Completed', 'Completed'), 'checkc', done.length]], tab, 'tab', { def: 'todo' }) + P.dlist(list.map(compRow), c.s.emp);
    },
    act: Object.assign({
      complete: function (el) {
        var id = el.getAttribute('data-val'), r = E.complete(cx(), id); if (!r.ok) return fail(r);
        A.success(L('SERVICE COMPLETED', 'SERVICE COMPLETED'), H.open('BILL-002') ? { l: L('Validasi Billing', 'Billing Validation'), go: 'BILL-002', rec: id, icon: 'invoice' } : { l: L('Antrian Completion', 'Completion Queue'), go: 'COMP-001', icon: 'list' }, { l: L('Antrian Completion', 'Completion Queue'), go: 'COMP-001' },
          esc(id) + ' · v1 · ' + t(L('Data dibekukan. Klien melihat ORDER COMPLETE. Billing menunggu validasi Finance.', 'Data frozen. The client sees ORDER COMPLETE. Billing waits for Finance validation.')));
      },
      amend: function (el) {
        var id = el.getAttribute('data-val'), d = E.dlv(id);
        dlg({ title: L('Amandemen completion', 'Completion amendment'), icon: 'edit', sub: '<b>' + esc(id) + '</b> · v' + d.comp.ver + ' → v' + (d.comp.ver + 1) + (d.bill && d.bill.st === 'sent' ? ' · ' + t(L('revisi dikirim ke Finance', 'a revision goes to Finance')) : ''),
          body: fld(L('Data', 'Field'), sel('field', Object.keys(E.COMP_FIELDS).map(function (k) { return [k, E.COMP_FIELDS[k]]; }), 'qty'), { req: true, wide: true }) + fld(L('Nilai baru', 'New value'), inp('value', ''), { req: true, wide: true, hint: t(L('SLA delivery: ontime / late / exception', 'Delivery SLA: ontime / late / exception')) }) + fld(L('Alasan', 'Reason'), area('reason', ''), { req: true, wide: true }),
          onOk: function (x) { var r = E.amendComp(cx(), id, x); if (!r.ok) return r.msg; after(L('Amandemen tersimpan · v' + r.dlv.comp.ver + '.', 'Amendment saved · v' + r.dlv.comp.ver + '.')); return true; } });
      }
    }, P.DOC_ACT)
  };

  /* ================= NP-08 · DLV-TIMELINE-001 Full Service Timeline ================= */
  var SRC = { P7: ['Fase 7', 'info'], P8: ['Fase 8', 'appr'], P9: ['Fase 9', 'ok'], arsip: [L('Arsip produksi', 'Production archive'), 'mute'] };
  V['DLV-TIMELINE-001'] = {
    title: function () { return L('Timeline Layanan Lengkap', 'Full Service Timeline'); },
    render: function (c) {
      var c0 = cx();
      if (!c.rec) return A.pageHead(null, t(L('Pilih delivery untuk melihat perjalanan layanan dari order sampai Billing Ready.', 'Choose a delivery to see the service journey from order to Billing Ready.'))) + P.dlist(E.deliveries(c0, {}).slice().reverse().map(function (d) { return P.drow(d, { go: 'DLV-TIMELINE-001', icon: 'history' }); }), c.s.emp);
      var d = E.dlv(c.rec), tl = d && E.timeline(c0, d.id); if (!tl) return A.stateCard('noperm', L('Anda tidak memiliki akses.', 'You do not have access.'), A.backBtn());
      var rows = tl.rows.map(function (r) { var x = E.TL[r.k], s = SRC[r.src] || SRC.P9; return '<li class="tlf9-' + r.src + '"><span class="tl9-t num">' + esc(when(r.at)) + '</span><span class="tl9-ic">' + ic(x[1]) + '</span><span class="tl9-b"><b>' + t(x[0]) + '</b>' + (r.note ? ' <span class="mono6 sub5">' + esc(r.note) + '</span>' : '') + '<small>' + (r.by ? first(r.by) + ' · ' : '') + '</small></span>' + A.chip(s[1], s[0]) + '</li>'; }).join('');
      return P.dhero(d, { icon: 'history', chips: billC(d) }) + card(L('Perjalanan layanan', 'Service journey'), '<ol class="tl9 tlf9">' + rows + '</ol>', { icon: 'history', count: tl.rows.length }) +
        note(t(L('Pickup dan perjalanan dibaca dari Fase 7, produksi dari Fase 8, release sampai billing dari Fase 9. Klien melihat versi sederhana tanpa nama staf.', 'Pickup and trips are read from Phase 7, production from Phase 8, release to billing from Phase 9. The client sees a simple version without staff names.')), 'info', 'info');
    }
  };

  /* ================= NP-09 · BILL-001 Billing Ready Queue ================= */
  var BTABS = ['validation', 'ready', 'sent', 'hold', 'issue', 'notready'];
  V['BILL-001'] = {
    render: function (c) {
      var c0 = cx(), all = E.billing(c0, {}), tab = c.q.tab || 'validation', by = {};
      BTABS.forEach(function (k) { by[k] = []; }); all.forEach(function (d) { by[E.billSt(d)].push(d); });
      var list = by[tab] || [], canB = can('dlv.bill'), sel0 = tab === 'ready' && canB;
      var rows = A.list(list, [
        sel0 ? { h: L('Pilih', 'Select'), v: function (d) { return '<input type="checkbox" class="bl9" value="' + esc(d.id) + '" checked aria-label="' + esc(d.id) + '">'; } } : null,
        { h: L('Order', 'Order'), v: function (d) { return '<b class="mono6">' + esc(d.ord || d.oref || d.id) + '</b>'; } }, { h: L('Klien', 'Client'), v: function (d) { return cname(d.cl) + '<br><small>' + pname(d.prop) + '</small>'; } }, { h: L('Layanan', 'Service'), v: function (d) { return esc(E.svcName(d.svc)); } },
        { h: L('Qty', 'Qty'), cls: 'num', v: function (d) { var x = d.bill && d.bill.calc || E.billCalc(d); return esc(x.qty == null ? '—' : x.qty) + ' ' + esc(x.unit); } }, { h: L('Tarif', 'Rate'), cls: 'num', v: function (d) { var x = d.bill && d.bill.calc || E.billCalc(d); return rp(x.rate); } },
        { h: L('Total', 'Total'), cls: 'num', v: function (d) { var x = d.bill && d.bill.calc || E.billCalc(d); return '<b>' + rp(x.total) + '</b>'; } }, { h: L('Status', 'Status'), v: billC }
      ].filter(Boolean), function (d) { var x = d.bill && d.bill.calc || E.billCalc(d); return { t: esc(d.ord || d.oref || d.id) + ' · ' + cname(d.cl), r: rp(x.total), s: esc(E.svcName(d.svc)) + ' · ' + x.qty + ' ' + x.unit, chip: billC(d) }; }, function (d) { return href('BILL-002', d.id); }, { empty: c.s.emp });
      var sum = list.reduce(function (s, d) { var x = d.bill && d.bill.calc || E.billCalc(d); return s + (x.total || 0); }, 0);
      return A.pageHead(null, t(L('Transaksi yang sudah Service Completed. Finance memvalidasi kontrak, tarif per tanggal layanan dan jumlah sebelum Billing Ready. Invoice dibuat di Fase 10.', 'Transactions that are Service Completed. Finance validates the contract, the rate at the service date and the quantity before Billing Ready. Invoices are made in Phase 10.')), A.btn('ghost', L('Outbox Finance', 'Finance Outbox'), 'upload', { go: 'BILL-001', qs: 'tab=sent' })) +
        bigCount([{ k: L('Perlu validasi', 'Validation required'), v: by.validation.length, icon: 'search', tone: by.validation.length ? 'warn' : '', go: 'BILL-001' }, { k: 'Billing Ready', v: by.ready.length, icon: 'checkc', tone: by.ready.length ? 'ok' : '', go: 'BILL-001', qs: 'tab=ready' }, { k: L('Terkirim ke Finance', 'Sent to Finance'), v: by.sent.length, icon: 'upload', go: 'BILL-001', qs: 'tab=sent' }, { k: L('Ditahan', 'Hold'), v: by.hold.length, icon: 'pause', tone: by.hold.length ? 'warn' : '', go: 'BILL-001', qs: 'tab=hold' }, { k: L('Ada masalah', 'Issue'), v: by.issue.length, icon: 'alert', tone: by.issue.length ? 'crit' : '', go: 'BILL-001', qs: 'tab=issue' }, { k: L('Belum siap', 'Not ready'), v: by.notready.length, icon: 'clock', go: 'BILL-001', qs: 'tab=notready' }]) +
        tabs([['validation', L('Perlu Validasi', 'Validation'), 'search', by.validation.length], ['ready', 'Billing Ready', 'checkc', by.ready.length], ['sent', L('Terkirim', 'Sent'), 'upload', by.sent.length], ['hold', L('Ditahan', 'Hold'), 'pause', by.hold.length], ['issue', L('Masalah', 'Issue'), 'alert', by.issue.length], ['notready', L('Belum Siap', 'Not Ready'), 'clock', by.notready.length]], tab, 'tab', { def: 'validation' }) +
        rows + (list.length ? '<p class="sum9">' + t(L('Total di tab ini: ', 'Total in this tab: ')) + '<b class="num">' + rp(sum) + '</b></p>' : '') + (tab === 'sent' ? outbox(c0) : '') +
        (sel0 && list.length ? abar(xl('primary', L('KIRIM KE FINANCE', 'SEND TO FINANCE'), 'upload', { act: 'send' }), '') : '');
    },
    act: {
      send: function () {
        var ids = [].slice.call(document.querySelectorAll('.bl9:checked')).map(function (x) { return x.value; }).filter(function (v, i, a) { return a.indexOf(v) === i; });
        var r = E.sendFinance(cx(), ids); if (!r.ok) return fail(r);
        after(L(r.sent.length + ' transaksi terkirim ke Finance (outbox Fase 10).', r.sent.length + ' transaction(s) sent to Finance (Phase 10 outbox).'));
      }
    }
  };
  function outbox(c0) {
    var ob = E.outbox(c0);
    return ob.length ? card(L('Outbox Finance (untuk Fase 10)', 'Finance outbox (for Phase 10)'), '<div class="tblw"><table class="tbl dense"><thead><tr><th>Billing</th><th>' + t(L('Delivery', 'Delivery')) + '</th><th>' + t(L('Klien', 'Client')) + '</th><th>Qty</th><th>' + t(L('Tarif', 'Rate')) + '</th><th>' + t(L('Pajak', 'Tax')) + '</th><th>Total</th><th>' + t(L('Versi', 'Version')) + '</th><th>' + t(L('Bukti', 'Evidence')) + '</th><th>' + t(L('Waktu', 'Time')) + '</th></tr></thead><tbody>' +
      ob.map(function (x) { return '<tr><td class="mono6">' + esc(x.id || '—') + (x.amend ? ' ' + A.chip('appr', L('Revisi', 'Revision')) : '') + '</td><td>' + dLink(x.dlv) + '</td><td>' + cname(x.cl) + '</td><td class="num">' + esc(x.qty) + ' ' + esc(x.unit) + '</td><td class="num">' + rp(x.rate) + '</td><td class="num">' + rp(x.tax) + '</td><td class="num"><b>' + rp(x.total) + '</b></td><td>v' + esc(x.compVer) + '</td><td class="mono6"><small>' + esc(x.evidence.join(' · ')) + '</small></td><td class="num">' + esc(when(x.at)) + '</td></tr>'; }).join('') + '</tbody></table></div>', { icon: 'upload', count: ob.length }) : '';
  }

  /* ================= NP-09 · BILL-002 Billing Validation ================= */
  V['BILL-002'] = {
    title: function (rec) { return rec ? L('Validasi Billing', 'Billing Validation') : null; },
    render: function (c) {
      var c0 = cx(), d = c.rec && E.dlv(c.rec);
      if (!d) return A.stateCard('empty', L('Pilih transaksi dari antrian Billing Ready.', 'Choose a transaction from the Billing Ready queue.'), A.btn('blue', 'Billing Ready', 'invoice', { go: 'BILL-001' }));
      if (!E.canSee(c0, d)) return A.stateCard('noperm', L('Anda tidak memiliki akses.', 'You do not have access.'), A.backBtn());
      var s0 = E.billSt(d), snap = d.bill && d.bill.calc && ['ready', 'sent'].indexOf(s0) >= 0, x = snap ? d.bill.calc : E.billCalc(d), ck = E.billChecks(d), fail0 = ck.filter(function (k) { return !k.ok; });
      var h = P.dhero(d, { icon: 'invoice', chips: billC(d) + (snap ? A.chip('mute', L('Snapshot terkunci', 'Locked snapshot'), 'lock') : ''), facts: [[L('Qty tagih', 'Billable qty'), esc(x.qty) + ' ' + esc(x.unit), 'num'], [L('Tarif', 'Rate'), rp(x.rate) + '/' + esc(x.unit), 'num'], [L('Pajak', 'Tax'), x.taxPct + '%', 'num'], [L('Total', 'Total'), rp(x.total), 'num'], [L('Completion', 'Completion'), d.comp ? 'v' + d.comp.ver : '—']] });
      var det = card(L('Detail billing', 'Billing detail'), kv([[L('Order', 'Order'), P.dOrd(d)], [L('Klien', 'Client'), cname(d.cl)], [L('Property', 'Property'), pname(d.prop)], [L('Layanan', 'Service'), esc(E.svcName(d.svc))], [L('Tanggal layanan', 'Service date'), esc(d.date)], [L('Kontrak', 'Contract'), esc(x.ctr ? x.ctr + (x.ctrV ? ' v' + x.ctrV : '') : '—') + (x.ctrSt ? ' · ' + esc(x.ctrSt) : '')], [L('Rate card', 'Rate card'), esc(x.rc ? x.rc + ' v' + x.v : T(L('Harga master', 'Master price')))], [L('Billing ID', 'Billing ID'), esc(d.bill && d.bill.id || '—')]]), { icon: 'file' });
      var calc = card(L('Perhitungan', 'Calculation'), '<table class="tbl dense calc9"><tbody>' +
        '<tr><th>' + t(L('Tarif dasar klien', 'Client base rate')) + '</th><td class="num">' + rp(x.base) + ' / ' + esc(x.unit) + '</td></tr>' + (x.discPct ? '<tr><th>' + t(L('Diskon rate card', 'Rate card discount')) + ' (' + x.discPct + '%)</th><td class="num">− ' + rp(x.disc) + '</td></tr>' : '') + (x.sur ? '<tr><th>' + t(L('Surcharge', 'Surcharge')) + '</th><td class="num">+ ' + rp(x.sur) + '</td></tr>' : '') +
        '<tr><th>' + t(L('Tarif berlaku', 'Effective rate')) + ' × ' + esc(x.qty) + ' ' + esc(x.unit) + '</th><td class="num">' + rp(x.rate) + ' × ' + esc(x.qty) + '</td></tr>' + (x.minApplied ? '<tr><th>' + t(L('Minimum charge diterapkan', 'Minimum charge applied')) + '</th><td class="num">' + rp(x.min) + '</td></tr>' : '') +
        '<tr><th>' + t(L('Subtotal', 'Subtotal')) + '</th><td class="num">' + rp(x.charge) + '</td></tr><tr><th>' + t(L('Pajak', 'Tax')) + ' ' + x.taxPct + '%</th><td class="num">' + rp(x.tax) + '</td></tr><tr class="calc9-t"><th>Total</th><td class="num">' + rp(x.total) + '</td></tr></tbody></table>' +
        (x.today != null && x.today !== x.rate ? note(t(L('Tarif hari ini ' + A.fmt.rp(x.today) + ' (' + (x.todayRc || '') + ') berbeda. Billing tetap memakai tarif per tanggal layanan ' + d.date + '.', 'Today\'s rate ' + A.fmt.rp(x.today) + ' (' + (x.todayRc || '') + ') differs. Billing keeps the rate as of the service date ' + d.date + '.')), 'info', 'info') : '') +
        (snap ? note(t(L('Snapshot dikunci saat Billing Ready ', 'Snapshot locked at Billing Ready ')) + esc(when(d.bill.at)) + ' · ' + first(d.bill.by) + ' · completion v' + d.bill.ver, 'lock', 'ok') : ''), { icon: 'coins' });
      var ckc = card(L('Validasi', 'Validation'), checks(ck, { plain: true }) + (d.bill && d.bill.reval ? note(esc(d.bill.reval), 'refresh', 'warn') : '') + (d.bill && d.bill.st === 'hold' ? note('<b>' + t(L('Ditahan: ', 'On hold: ')) + '</b>' + esc(T(d.bill.note)), 'pause', 'warn') : ''), { icon: 'checkc', count: (ck.length - fail0.length) + '/' + ck.length });
      var main = '', side = '';
      if (can('dlv.bill')) {
        if (s0 === 'validation' || s0 === 'issue') { main = xl('primary', L('MARK AS BILLING READY', 'MARK AS BILLING READY'), 'checkc', { act: 'ready', val: d.id, cls: fail0.length ? 'is-off' : '' }); side = A.btn('ghost', 'Hold', 'pause', { act: 'hold', val: d.id }); }
        else if (s0 === 'hold') main = xl('blue', L('LEPAS HOLD', 'RELEASE HOLD'), 'play', { act: 'unhold', val: d.id });
        else if (s0 === 'ready') { main = xl('primary', L('KIRIM KE FINANCE', 'SEND TO FINANCE'), 'upload', { act: 'send', val: d.id }); side = A.btn('ghost', 'Hold', 'pause', { act: 'hold', val: d.id }); }
      }
      side += A.btn('ghost', L('Completion', 'Completion'), 'checkc', { go: 'COMP-001', rec: d.id }) + (d.pod ? A.btn('ghost', 'POD', 'sign', { go: 'DLV-POD-002', rec: d.id }) : '');
      return h + (s0 === 'notready' ? note(t(L('Belum Service Completed. Billing Ready hanya setelah completion.', 'Not Service Completed yet. Billing Ready only after completion.')), 'lock', 'warn') : '') + '<div class="g2-9">' + det + calc + '</div>' + ckc + abar(main, side);
    },
    act: {
      ready: function (el) { var id = el.getAttribute('data-val'), r = E.markBillReady(cx(), id); if (!r.ok) return fail(r); after(L('Billing Ready ' + r.dlv.bill.id + ' · ' + A.fmt.rp(r.dlv.bill.calc.total) + '. Snapshot dikunci.', 'Billing Ready ' + r.dlv.bill.id + ' · ' + A.fmt.rp(r.dlv.bill.calc.total) + '. Snapshot locked.')); },
      send: function (el) { var r = E.sendFinance(cx(), [el.getAttribute('data-val')]); if (!r.ok) return fail(r); after(L('Terkirim ke Finance (outbox Fase 10).', 'Sent to Finance (Phase 10 outbox).')); },
      hold: function (el) { var id = el.getAttribute('data-val'); reasonDlg({ title: L('Tahan billing', 'Hold billing'), icon: 'pause', label: L('Alasan', 'Reason'), fn: function (x) { return E.billHold(cx(), id, x); }, done: L('Billing ditahan.', 'Billing on hold.') }); },
      unhold: function (el) { var id = el.getAttribute('data-val'); reasonDlg({ title: L('Lepas hold billing', 'Release the billing hold'), icon: 'play', label: L('Catatan', 'Note'), fn: function (x) { return E.billUnhold(cx(), id, x); }, done: L('Hold dilepas. Validasi ulang lalu Billing Ready.', 'Hold released. Revalidate, then Billing Ready.') }); }
    }
  };

  /* ================= NP-10 · DLV-KPI-001 Delivery Performance Dashboard ================= */
  function kTile(def, v, prev) {
    var val = v == null ? '—' : v, good = v == null ? null : def[3] === 'higher' ? v >= def[4] : v <= def[4];
    var unit = Array.isArray(def[2]) ? T(def[2]) : def[2];
    return tile({ k: def[1], v: esc(val) + '<small>' + esc(unit) + '</small>', tone: good == null ? null : good ? 'ok' : 'warn', s: t(L('Target ', 'Target ')) + (def[3] === 'higher' ? '≥ ' : '≤ ') + esc(def[4]) + esc(unit) + (prev != null && v != null ? ' · ' + (v >= prev ? '▲' : '▼') + ' ' + esc(Math.abs(Math.round((v - prev) * 10) / 10)) : '') });
  }
  V['DLV-KPI-001'] = {
    render: function (c) {
      var c0 = cx(), days = +(c.q.d || 30), k = E.kpi(days), kp = E.kpi(days * 2), gran = c.q.g || 'week', tr = E.trend(gran);
      var prev = {}; Object.keys(k).forEach(function (x) { if (typeof k[x] === 'number' && typeof kp[x] === 'number') prev[x] = Math.round((kp[x] * 2 - k[x]) * 10) / 10; });
      var head = A.pageHead(null, t(L('Performa delivery dan pengalaman klien dari histori dan transaksi hari ini. Angka dihitung, tidak diketik ulang.', 'Delivery performance and client experience from history and today\'s transactions. Numbers are computed, never retyped.'))) +
        tabs([['7', L('7 hari', '7 days'), 'calendar'], ['30', L('30 hari', '30 days'), 'calendar'], ['90', L('90 hari', '90 days'), 'calendar']], String(days), 'd', { def: '30', seg: true });
      var kpis = card(L('Delivery & service', 'Delivery & service'), tiles(E.KPIS.map(function (d0) { return kTile(d0, k[d0[0]], prev[d0[0]]); }), 'tls9'), { icon: 'gauge', right: '<span class="sub5">' + A.fmt.num(k.del, 0) + ' ' + t(L('delivery', 'deliveries')) + '</span>' });
      var cxT = card(L('Pengalaman klien', 'Client experience'), tiles(E.CX.map(function (d0) { return kTile(d0, k[d0[0]], prev[d0[0]]); }), 'tls9'), { icon: 'star', right: '<span class="sub5">' + A.fmt.num(k.n.ratings, 0) + ' ' + t(L('rating', 'ratings')) + '</span>' });
      var trend = card(L('Tren tepat waktu', 'On-time trend'), tabs(Object.keys(E.GRAN).map(function (g) { return [g, E.GRAN[g]]; }), gran, 'g', { def: 'week', seg: true }) +
        A.lineChart([{ n: E.TREND_M.otd, v: tr.map(function (x) { return x.otd || 0; }) }], tr.map(function (x) { return gran === 'day' || gran === 'week' ? x.k.slice(5) : x.k; }), { min: 90, max: 100, target: 96, fmt: function (v) { return v + '%'; }, label: T(L('Tren tepat waktu', 'On-time trend')) }) +
        '<div class="tblw"><table class="tbl dense"><thead><tr><th></th>' + tr.map(function (x) { return '<th class="num">' + esc(gran === 'day' || gran === 'week' ? x.k.slice(5) : x.k) + (x.partial ? '*' : '') + '</th>'; }).join('') + '</tr></thead><tbody>' +
        ['late', 'ret', 'redel', 'cmp', 'rateD'].map(function (m) { return '<tr><th>' + t(E.TREND_M[m]) + '</th>' + tr.map(function (x) { return '<td class="num">' + esc(x[m] == null ? '—' : x[m]) + '</td>'; }).join('') + '</tr>'; }).join('') + '</tbody></table></div>', { icon: 'trend' });
      var dp = E.driverPerf(c0), drv = card(L('Performa driver', 'Driver performance'), '<div class="tblw"><table class="tbl dense"><thead><tr><th>Driver</th><th class="num">' + t(L('Delivery', 'Deliveries')) + '</th><th class="num">' + t(L('Tepat waktu', 'On-time')) + '</th><th class="num">POD</th><th class="num">' + t(L('Percobaan 1', '1st attempt')) + '</th><th class="num">' + t(L('Masalah', 'Issues')) + '</th><th class="num">Rating</th></tr></thead><tbody>' +
        dp.map(function (x) { return '<tr><td>' + G.av(x.id, 'av9') + ' ' + esc(x.n) + '</td><td class="num">' + x.del + '</td><td class="num' + (x.on < 96 ? ' t-warn' : '') + '">' + x.on + '%</td><td class="num">' + x.pod + '%</td><td class="num">' + x.first + '%</td><td class="num">' + x.iss + '%</td><td class="num">★ ' + (x.rating == null ? '—' : x.rating) + '</td></tr>'; }).join('') + '</tbody></table></div>', { icon: 'users' });
      var team = card(L('KPI tim Delivery (Fase 5)', 'Delivery team KPI (Phase 5)'), '<ul class="tk9">' + E.teamKpi().map(function (x) { var good = x[0] === 'ret' ? x[2] <= x[4] : x[2] >= x[4]; return '<li><span>' + t(x[1]) + '</span><b class="num ' + (good ? '' : 't-warn') + '">' + (x[2] == null ? '—' : x[2]) + x[3] + '</b><small>' + t(L('target ', 'target ')) + x[4] + x[3] + '</small></li>'; }).join('') + '</ul>', { icon: 'target' });
      var props = E.propPerf().slice(0, 8), pp = card(L('Performa property (terendah dulu)', 'Property performance (lowest first)'), '<div class="tblw"><table class="tbl dense"><thead><tr><th>' + t(L('Property', 'Property')) + '</th><th class="num">' + t(L('Delivery', 'Deliveries')) + '</th><th class="num">' + t(L('Tepat waktu', 'On-time')) + '</th><th class="num">' + t(L('Rata telat', 'Avg delay')) + '</th><th class="num">' + t(L('Masalah', 'Issues')) + '</th><th class="num">Return</th><th class="num">Rating</th></tr></thead><tbody>' +
        props.map(function (x) { return '<tr><td>' + pname(x.prop) + '<br><small>' + cname(x.cl) + '</small></td><td class="num">' + x.n + '</td><td class="num' + (x.on < 96 ? ' t-warn' : '') + '">' + x.on + '%</td><td class="num">' + x.delay + ' ' + t(L('mnt', 'min')) + '</td><td class="num">' + x.iss + '%</td><td class="num">' + x.ret + '%</td><td class="num">★ ' + (x.rating == null ? '—' : x.rating) + '</td></tr>'; }).join('') + '</tbody></table></div>', { icon: 'building' });
      var ti = E.topIssues(), iss = card(L('Jenis masalah teratas', 'Top issue types'), A.hbars(ti.slice(0, 6).map(function (x, i) { return { l: E.ISSUE_TYPES[x.type] ? E.ISSUE_TYPES[x.type][0] : L(x.type, x.type), v: x.n, hi: i === 0, icon: E.ISSUE_TYPES[x.type] ? E.ISSUE_TYPES[x.type][2] : null }; })), { icon: 'alert' });
      var amb = card(L('Masuk ke Ambidex (Fase 5)', 'Into Ambidex (Phase 5)'), '<ul class="tk9">' + E.ambidex().map(function (x) { return '<li><span><b>' + t(x.to) + '</b> · ' + t(x.line) + '</span><b class="num">' + esc(x.v) + '</b></li>'; }).join('') + '</ul>', { icon: 'link' });
      var hl = ['CL-01', 'CL-03', 'CL-05', 'CL-07'].map(function (id) { return E.healthFeed(id); }), health = card(L('Masuk ke Client Health (Fase 6)', 'Into Client Health (Phase 6)'), '<div class="tblw"><table class="tbl dense"><thead><tr><th>' + t(L('Klien', 'Client')) + '</th><th class="num">SLA</th><th class="num">' + t(L('Penerimaan', 'Acceptance')) + '</th><th class="num">' + t(L('Komplain', 'Complaints')) + '</th><th class="num">Return</th><th class="num">Rating</th></tr></thead><tbody>' +
        hl.map(function (x) { return '<tr><td>' + cname(x.cl) + '</td><td class="num">' + (x.sla == null ? '—' : x.sla + '%') + '</td><td class="num">' + (x.acc == null ? '—' : x.acc + '%') + '</td><td class="num">' + x.cmp + '</td><td class="num">' + x.ret + '</td><td class="num">★ ' + (x.rating == null ? '—' : x.rating) + '</td></tr>'; }).join('') + '</tbody></table></div>', { icon: 'users' });
      var reps = card(L('Laporan', 'Reports'), '<div class="doc9-l">' + E.REPORTS.map(function (r) { return A.btn('ghost', r[1], 'download', { act: 'csv', val: r[0], cls: 'btn-sm' }); }).join('') + '</div>', { icon: 'file' });
      return head + kpis + cxT + trend + '<div class="g2-9">' + drv + team + '</div><div class="g2-9">' + pp + iss + '</div><div class="g2-9">' + amb + health + '</div>' + reps;
    },
    act: {
      csv: function (el) {
        var k = el.getAttribute('data-val'), r = E.report(cx(), k); if (!r) return A.toast(E.MSG.noperm, 'crit');
        var name = (E.REPORTS.filter(function (x) { return x[0] === k; })[0] || [k])[0];
        H.download('jfresh-delivery-' + name + '-' + E.TODAY + '.csv', '﻿' + [r.head].concat(r.rows).map(function (row) { return row.map(function (x) { return '"' + String(x == null ? '' : x).replace(/"/g, '""') + '"'; }).join(','); }).join('\n'), 'text/csv;charset=utf-8');
        E.audit('REPORT.EXPORT', cx(), { rec: 'DLV-KPI-001', to: k });
        A.toast(L('Laporan diunduh.', 'Report downloaded.'));
      }
    }
  };
})();
