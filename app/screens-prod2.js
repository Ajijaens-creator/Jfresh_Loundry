/* JFRESH OS — Phase 8 screens (part 2): Team 2 workspace (HOM-T2-001, washing PROD-WASH-001/002,
   drying PROD-DRY-001/002) and Team 3 workspace (HOM-T3-001, finishing PROD-FIN-001/002, QC
   PROD-QC-001/002, rewash PROD-REWASH-001, packing PROD-PACK-001/002, Ready to Deliver
   PROD-READY-001). Uses the shared helpers from screens-prod.js (A.P8). */
(function () {
  var A = window.JFAPP, E = window.JFPROD, H = A && A.P5, G = A && A.P7, P = A && A.P8;
  if (!A || !E || !H || !G || !P) return;
  var V = A.V, T = A.T, L = A.L, t = A.t, esc = A.esc, ic = A.ic, can = A.can, href = A.href;
  var lnk = H.lnk, tabs = H.tabs, card = H.card, kv = H.kv, note = H.note, dlg = H.dlg, fld = H.fld, inp = H.inp, sel = H.sel, area = H.area, num = H.num;
  var after = G.after, fail = G.fail, vals = G.vals, choice = G.choice, stepper = G.stepper, photoIn = G.photoIn, photos = G.photos, resetPh = G.resetPh, img = G.img, minT = G.minT;
  var cx = P.cx, hm = P.hm, kg = P.kg, pcs = P.pcs, cname = P.cname, pname = P.pname, first = P.first, priC = P.priC, stgC = P.stgC, slaC = P.slaC, catC = P.catC, machC = P.machC, flagsC = P.flagsC, bLink = P.bLink;
  var whoPick = P.whoPick, qrow = P.qrow, qlist = P.qlist, hero = P.hero, abar = P.abar, xl = P.xl, step8 = P.step8, bigCount = P.bigCount, nextCard = P.nextCard, hello = P.hello, shiftLine = P.shiftLine, chkMini = P.chkMini;
  var issueDlg = P.issueDlg, reasonDlg = P.reasonDlg, live = P.live, runBox = P.runBox, utilBar = P.utilBar, go = P.go;

  function bHero(b, o) {
    o = o || {};
    var r = E.rcv(b.rcvs[0]), sp = r && T(r.special);
    return hero({ id: b.id, icon: (E.CATS[b.cat] || {}).icon, title: cname(b.cl), sub: pname(b.prop) + (b.mixed ? ' · ' + t(L('campuran klien', 'mixed clients')) : ''),
      chips: stgC(b) + priC(b.pri) + (b.parent ? A.chip('appr', L('Rework dari ', 'Rework of ') + b.parent, 'refresh') : '') + slaC(b, true),
      facts: [[L('Kategori', 'Category'), catC(b.cat)], [L('Berat', 'Weight'), kg(b.kg), 'num'], [L('Jumlah', 'Quantity'), pcs(b.finQty != null && b.stage !== 'finishing' ? b.finQty : b.pcs), 'num'],
        o.mach !== false ? [L('Mesin · program', 'Machine · program'), esc(b.mach || '—') + ' · ' + t((E.WASH_PROGS[b.prog] || {}).n)] : null, b.sla ? [L('Batas SLA', 'SLA deadline'), hm(b.sla) + (b.sla.slice(0, 10) !== E.TODAY ? ' · ' + G.dts(b.sla) : ''), 'num'] : null,
        b.dlv ? [L('Delivery', 'Delivery'), '<span class="mono6">' + esc(b.dlv) + '</span>'] : null].concat(o.facts || []),
      extra: (b.flags && b.flags.length ? '<div class="hr8-x">' + flagsC(b.flags) + '</div>' : '') + (sp ? note(esc(sp), 'info', 'warn') : '') + (b.hold ? note(t(L('Ditahan supervisor: ', 'On hold by the supervisor: ')) + esc(b.hold.reason), 'pause', 'crit') : '') + (o.extra || '') });
  }
  function holdGate(b) { return b.stage === 'hold' ? note(t(L('Batch ini ditahan supervisor. Tunggu instruksi sebelum lanjut.', 'This batch is on hold by the supervisor. Wait for instructions before continuing.')), 'pause', 'crit') + (can('prod.spv') ? '<div class="bt8">' + A.btn('blue', L('Lanjutkan Batch', 'Resume Batch'), 'play', { act: 'resume' }) + '</div>' : '') : ''; }
  var RESUME = function () { var id = A.S.rec; reasonDlg({ title: L('Lanjutkan batch', 'Resume the batch'), sub: esc(id), label: L('Catatan', 'Note'), fn: function (n0) { return E.spvResume(cx(), id, n0); } }); };
  function machPick(name, list, cur, b) {
    return '<div class="mp8" role="radiogroup">' + list.map(function (m) {
      var free = E.machAvail(m), fit = !b || b.kg <= m.cap || (b.ovr && b.mach === m.id), on = String(cur) === m.id, busy = m.batch ? E.batch(m.batch) : null;
      return '<label class="mp8-i' + (!free || !fit ? ' is-off' : '') + '"><input type="radio" name="' + name + '" value="' + m.id + '"' + (on ? ' checked' : '') + (!free || !fit ? ' disabled' : '') + '><span class="mp8-b"><b>' + esc(m.id) + '</b><span class="num">' + (m.cap ? m.cap + ' kg' : t(E.MACH_TYPES[m.type][0])) + '</span>' + machC(m) +
        (b && m.cap ? utilBar(Math.round(b.kg / m.cap * 100), { low: E.cfg().under }) : '') + (busy && busy.run ? '<small>' + esc(busy.id) + ' · ' + t(L('selesai ', 'done ')) + E.hm(E.runEnd(busy)) + '</small>' : !fit && free ? '<small>' + t(L('Kapasitas kurang', 'Not enough capacity')) + '</small>' : '') + '</span></label>';
    }).join('') + '</div>';
  }
  function pickFree(list, b, pref) { var m = E.machine(pref); if (m && E.machAvail(m) && b.kg <= m.cap) return m.id; var f = list.filter(function (x) { return E.machAvail(x) && b.kg <= x.cap; }).sort(function (a, c) { return a.cap - c.cap; })[0]; return f ? f.id : ''; }
  function machStrip(types) {
    return '<div class="ms8" id="ms8">' + E.machinesLive(types).map(function (x) {
      var m = x.m, b = x.b, left = b && x.end ? Math.round((E.ms(x.end) - E.now()) / 60000) : null;
      return '<div class="ms8-i ms8-' + m.st + '"><span class="ms8-h"><b>' + esc(m.id) + '</b>' + machC(m) + '</span>' + (b ? '<span class="ms8-b">' + bLink(b.id) + '<small>' + cname(b.cl) + '</small></span><span class="ms8-t num">' + (left >= 0 ? esc(minT(left)) : '<em>' + t(L('Lewat ', 'Over ')) + esc(minT(-left)) + '</em>') + '</span>' : '<span class="ms8-b sub5">' + (m.cap ? m.cap + ' kg' : '') + (x.wo ? ' · ' + esc(x.wo.id) : '') + '</span>') + '</div>';
    }).join('') + '</div>';
  }

  /* ================= HOM-T2-001 Team 2 Home ================= */
  function t2Next() {
    var over = E.batches(['washing', 'drying']).filter(function (b) { return E.runEnd(b) <= E.now(); })[0];
    if (over) return { k: L('Mesin selesai', 'Machine finished'), icon: over.stage === 'washing' ? 'droplet' : 'wind', title: esc(over.id) + ' · ' + esc(over.run.mach || T(E.DRY_METHODS[over.run.method] || '')), sub: cname(over.cl) + ' · ' + kg(over.kg), l: over.stage === 'washing' ? L('SELESAI CUCI', 'WASH DONE') : L('SELESAI KERING', 'DRY DONE'), bi: 'checkc', go: over.stage === 'washing' ? 'PROD-WASH-002' : 'PROD-DRY-002', rec: over.id };
    var hoIn = E.state().ho.filter(function (h) { return h.kind === 't1t2' && h.st === 'waiting'; })[0];
    if (hoIn) return { k: L('Handover masuk', 'Incoming handover'), icon: 'swap', title: esc(hoIn.batch) + ' · ' + cname(hoIn.cl), sub: kg(hoIn.kg) + ' · ' + pcs(hoIn.qty) + ' · ' + t(L('dari ', 'from ')) + first(hoIn.sender), l: L('TERIMA HANDOVER', 'ACCEPT HANDOVER'), bi: 'checkc', go: 'PROD-HO-001' };
    var d = E.batches(['dry_q'])[0], w = E.batches(['wash_q'])[0], f = E.batches(['fin_ready'])[0];
    if (d && E.dryers().some(function (m) { return E.machAvail(m) && d.kg <= m.cap; })) return { icon: 'wind', title: esc(d.id) + ' · ' + cname(d.cl), sub: kg(d.kg) + ' · ' + t(L('menunggu dryer', 'waiting for a dryer')), l: L('MULAI KERING', 'START DRYING'), bi: 'play', go: 'PROD-DRY-002', rec: d.id };
    if (w) return { icon: 'droplet', title: esc(w.id) + ' · ' + cname(w.cl), sub: kg(w.kg) + ' · ' + esc(w.mach) + ' · ' + t((E.WASH_PROGS[w.prog] || {}).n), l: L('MULAI CUCI', 'START WASH'), bi: 'play', go: 'PROD-WASH-002', rec: w.id };
    if (f) return { icon: 'swap', title: esc(f.id) + ' · ' + cname(f.cl), sub: t(L('Siap finalisasi', 'Ready for finalization')), l: L('KIRIM KE TEAM 3', 'SEND TO TEAM 3'), go: 'PROD-HO-002' };
    if (d) return { icon: 'wind', title: esc(d.id) + ' · ' + cname(d.cl), sub: t(L('Semua dryer terpakai. Cek perkiraan selesai.', 'All dryers busy. Check the expected finish.')), l: L('LIHAT DRYER', 'VIEW DRYERS'), go: 'PROD-DRY-001' };
    return null;
  }
  V['HOM-T2-001'] = {
    title: function () { return L('Beranda Team 2', 'Team 2 Home'); },
    render: function () {
      var h = E.home('t2');
      return hello(esc(G.day(E.TODAY)) + ' · ' + t(L('Washing & Drying', 'Washing & Drying')), shiftLine('t2')) + nextCard(t2Next()) +
        bigCount([{ k: L('Siap cuci', 'Ready to wash'), v: h.washQ, icon: 'droplet', go: 'PROD-WASH-001' }, { k: L('Sedang dicuci', 'Washing'), v: h.washing, icon: 'washer', go: 'PROD-WASH-001' }, { k: L('Menunggu dryer', 'Waiting for dryer'), v: h.dryQ, icon: 'wind', go: 'PROD-DRY-001' },
          { k: L('Sedang dikeringkan', 'Drying'), v: h.drying, icon: 'wind', go: 'PROD-DRY-001' }, { k: L('Siap finalisasi', 'Ready for finalization'), v: h.finReady, icon: 'swap', go: 'PROD-HO-002', tone: h.finReady ? 'ok' : '' }, { k: L('Mesin bermasalah', 'Machine problems'), v: h.machBad, icon: 'alert', go: 'PROD-MACH-001', tone: h.machBad ? 'crit' : '' },
          { k: L('Risiko SLA', 'SLA risk'), v: h.risk, icon: 'clock', tone: h.risk ? 'warn' : '', go: 'PROD-WASH-001' }, { k: L('Handover masuk', 'Incoming handover'), v: h.hoIn, icon: 'inbox', go: 'PROD-HO-001', tone: h.hoIn ? 'info' : '' }]) +
        chkMini('t2') + card(L('Mesin', 'Machines'), machStrip(['washer', 'dryer']), { icon: 'washer', link: ['PROD-MACH-001', L('Semua mesin', 'All machines')] });
    },
    after: function () { live('ms8', function () { return machStrip(['washer', 'dryer']).replace(/^<div class="ms8" id="ms8">|<\/div>$/g, ''); }, 15); }
  };

  /* ================= NP-05 · PROD-WASH-001 / 002 Washing ================= */
  V['PROD-WASH-001'] = {
    render: function () {
      var q = E.batches(['wash_q']), run = E.batches(['washing']), hoIn = E.state().ho.filter(function (h) { return h.kind === 't1t2' && h.st === 'waiting'; });
      return A.pageHead(null, t(L('Batch siap dicuci, urut risiko SLA dan prioritas.', 'Batches ready to wash, ordered by SLA risk and priority.'))) +
        (hoIn.length ? note(t(L(hoIn.length + ' batch dari Team 1 menunggu diterima. ', hoIn.length + ' batch(es) from Team 1 waiting to be accepted. ')) + lnk('PROD-HO-001', null, t(L('Terima handover', 'Accept handover'))), 'inbox', 'info') : '') +
        card(L('Siap cuci', 'Ready to wash'), qlist(q.map(function (b) { var m = E.machine(b.mach); return qrow(b, href('PROD-WASH-002', b.id), { meta: '<span>' + ic('washer') + '<b>' + esc(b.mach) + '</b>' + (m && !E.machAvail(m) ? ' ' + machC(m) : '') + '</span><span>' + t((E.WASH_PROGS[b.prog] || {}).n) + '</span>' }); }), L('Tidak ada batch siap cuci.', 'No batch ready to wash.')), { icon: 'droplet', count: q.length }) +
        card(L('Sedang dicuci', 'Washing'), qlist(run.map(function (b) { var end = E.runEnd(b), left = Math.round((end - E.now()) / 60000); return qrow(b, href('PROD-WASH-002', b.id), { icon: 'washer', meta: '<span>' + ic('washer') + '<b>' + esc(b.run.mach) + '</b></span><span>' + ic('clock') + t(L('selesai ', 'done ')) + '<b class="num">' + E.hm(end) + '</b></span>', chip: left < 0 ? A.chip('warn', L('Selesai, angkat', 'Done, unload'), 'checkc') : '' }); }), L('Tidak ada mesin cuci berjalan.', 'No washer running.')), { icon: 'washer', count: run.length });
    }
  };
  V['PROD-WASH-002'] = {
    title: function (rec) { return rec ? L('Cuci ' + rec, 'Wash ' + rec) : null; },
    render: function (c) {
      var b = E.batch(c.rec); if (!b) return A.stateCard('empty', L('Batch tidak ditemukan.', 'Batch not found.'), A.backBtn('blue'));
      var steps = step8([L('Terima', 'Accept'), L('Cuci', 'Wash'), L('Kering', 'Dry'), L('Kirim T3', 'Send T3')], b.stage === 'wash_q' ? 1 : b.stage === 'washing' ? 1 : E.stageIdx(b.stage) <= E.stageIdx('drying') ? 2 : 3);
      if (b.stage === 'hold') return bHero(b) + holdGate(b);
      if (b.stage === 'wash_q') {
        var ws = E.washers(), cur = pickFree(ws, b, b.mach), p = E.WASH_PROGS[b.prog];
        return bHero(b) + steps + card(L('Pilih mesin cuci', 'Choose the washer'), machPick('mach', ws, cur, b) + (cur && cur !== b.mach ? note(t(L('Mesin rekomendasi ' + b.mach + ' tidak tersedia. ' + cur + ' dipilih; perubahan tercatat.', 'The recommended machine ' + b.mach + ' is not available. ' + cur + ' is selected; the change is logged.')), 'swap', 'info') : !cur ? note(t(L('Belum ada mesin tersedia. Tunggu mesin selesai atau minta supervisor.', 'No machine available yet. Wait for one to finish or ask the supervisor.')), 'hourglass', 'warn') : ''), { icon: 'washer' }) +
          card(L('Program', 'Program'), fld(L('Program cuci', 'Wash program'), sel('prog', Object.keys(E.WASH_PROGS).map(function (k) { var x = E.WASH_PROGS[k]; return [k, T(x.n) + ' · ' + x.min + ' mnt · ' + x.temp + '°C']; }), b.prog), { wide: true }) +
            '<div class="pg8" id="pg8">' + progInfo(b.prog) + '</div>', { icon: 'cog' }) + whoPick('t2') +
          abar(xl('primary', L('MULAI CUCI', 'START WASH'), 'play', { act: 'start' }), xl('danger', L('ADA MASALAH', 'REPORT ISSUE'), 'alert', { act: 'issue' }));
      }
      if (b.stage === 'washing') {
        return bHero(b, { facts: [[L('Kimia', 'Chemicals'), esc(b.run.chem || T((E.WASH_PROGS[b.run.prog] || {}).chem))], [L('Operator', 'Operator'), first(b.run.op)]] }) + steps +
          card(L('Sedang dicuci di ' + b.run.mach, 'Washing on ' + b.run.mach), '<div id="rn8">' + runBox(b) + '</div>', { icon: 'washer' }) + whoPick('t2', L('Diselesaikan oleh', 'Finished by')) +
          abar(xl('primary', L('SELESAI CUCI', 'WASH DONE'), 'checkc', { act: 'finish' }), xl('danger', L('ADA MASALAH', 'REPORT ISSUE'), 'alert', { act: 'issue' }));
      }
      return bHero(b) + steps + A.stateCard('success', L('Cuci selesai. Status sekarang: ' + T(E.STAGE[b.stage][0]) + '.', 'Wash done. Current status: ' + E.STAGE[b.stage][0][1] + '.'), b.stage === 'dry_q' ? A.btn('primary', L('Ke Drying', 'Go to Drying'), 'wind', { go: 'PROD-DRY-002', rec: b.id }) : A.backBtn('ghost'), L('Selesai dicuci', 'Washed'));
    },
    after: function (c) {
      var b = E.batch(c.rec), view = document.getElementById('view'); if (!b) return;
      if (b.stage === 'washing') live('rn8', function () { return runBox(E.batch(c.rec)); }, 5);
      var s = view.querySelector('[name=prog]'); if (s) s.addEventListener('change', function () { view.querySelector('#pg8').innerHTML = progInfo(this.value); });
    },
    act: {
      start: function () { var v = vals(document.getElementById('view')), r = E.startWash(cx(), A.S.rec, { mach: v.mach, prog: v.prog, op: v.op }); if (!r.ok) return fail(r); after(L('Cuci dimulai. Perkiraan selesai ' + r.end.slice(11) + '.', 'Wash started. Expected finish ' + r.end.slice(11) + '.')); },
      finish: function () { var v = vals(document.getElementById('view')), id = A.S.rec, r = E.finishWash(cx(), id, { op: v.op }); if (!r.ok) return fail(r); go('PROD-DRY-002', id); setTimeout(function () { A.toast(L('Cuci selesai. Pilih dryer.', 'Wash done. Choose a dryer.')); }, 300); },
      issue: function () { var b = E.batch(A.S.rec); issueDlg({ stage: 'wash', batch: b.id, run: !!b.run, mach: b.run ? b.run.mach : null }); },
      resume: RESUME
    }
  };
  function progInfo(k) { var p = E.WASH_PROGS[k]; if (!p) return ''; return '<span>' + ic('clock') + '<b class="num">' + p.min + '</b> ' + t(L('menit', 'min')) + '</span><span>' + ic('zap') + '<b class="num">' + p.temp + '°C</b></span><span>' + ic('flask') + t(p.chem) + '</span>'; }

  /* ================= NP-06 · PROD-DRY-001 / 002 Drying ================= */
  V['PROD-DRY-001'] = {
    render: function () {
      var q = E.batches(['dry_q']), run = E.batches(['drying']), fr = E.batches(['fin_ready']);
      return A.pageHead(null, t(L('Batch menunggu dryer dan yang sedang dikeringkan.', 'Batches waiting for a dryer and drying now.'))) +
        card(L('Dryer', 'Dryers'), machStrip(['dryer']), { icon: 'wind' }) +
        card(L('Menunggu dryer', 'Waiting for dryer'), qlist(q.map(function (b) { var c0 = E.CATS[b.cat] || {}; return qrow(b, href('PROD-DRY-002', b.id), { meta: '<span>' + ic('wind') + t(E.DRY_PROGS[c0.dry] ? E.DRY_PROGS[c0.dry].n : E.DRY_METHODS[c0.dry] || '') + '</span>' }); }), L('Tidak ada batch menunggu dryer.', 'No batch waiting for a dryer.')), { icon: 'wind', count: q.length }) +
        card(L('Sedang dikeringkan', 'Drying'), qlist(run.map(function (b) { var end = E.runEnd(b); return qrow(b, href('PROD-DRY-002', b.id), { icon: 'wind', meta: '<span>' + ic('wind') + '<b>' + esc(b.run.mach || T(E.DRY_METHODS[b.run.method])) + '</b></span><span>' + ic('clock') + t(L('selesai ', 'done ')) + '<b class="num">' + E.hm(end) + '</b></span>', chip: end <= E.now() ? A.chip('warn', L('Selesai, angkat', 'Done, unload'), 'checkc') : '' }); }), L('Tidak ada yang sedang dikeringkan.', 'Nothing drying.')), { icon: 'clock', count: run.length }) +
        (fr.length ? card(L('Siap finalisasi · kirim ke Team 3', 'Ready for finalization · send to Team 3'), qlist(fr.map(function (b) { return qrow(b, null, { right: A.pbtn('prod.ho23', 'primary', L('KIRIM KE TEAM 3', 'SEND TO TEAM 3'), 'swap', { act: 'send', val: b.id, cls: 'btn-sm' }) }); }), ''), { icon: 'swap', count: fr.length, link: ['PROD-HO-002', L('Handover', 'Handover')] }) : '');
    },
    act: { send: function (el) { var r = E.send(cx(), el.getAttribute('data-val')); if (!r.ok) return fail(r); after(L('Dikirim ke Team 3. Menunggu TERIMA HANDOVER.', 'Sent to Team 3. Waiting for TERIMA HANDOVER.')); } }
  };
  V['PROD-DRY-002'] = {
    title: function (rec) { return rec ? L('Kering ' + rec, 'Dry ' + rec) : null; },
    render: function (c) {
      var b = E.batch(c.rec); if (!b) return A.stateCard('empty', L('Batch tidak ditemukan.', 'Batch not found.'), A.backBtn('blue'));
      var steps = step8([L('Terima', 'Accept'), L('Cuci', 'Wash'), L('Kering', 'Dry'), L('Kirim T3', 'Send T3')], E.stageIdx(b.stage) <= E.stageIdx('drying') ? 2 : 3);
      if (b.stage === 'hold') return bHero(b) + holdGate(b);
      if (E.stageIdx(b.stage) < E.stageIdx('dry_q')) return bHero(b) + A.stateCard('warning', L('Batch belum selesai dicuci.', 'The batch is not washed yet.'), A.btn('primary', L('Ke Washing', 'Go to Washing'), 'droplet', { go: 'PROD-WASH-002', rec: b.id }));
      if (b.stage === 'dry_q') {
        var c0 = E.CATS[b.cat] || E.CATS.white, method = E.DRY_METHODS[c0.dry] ? c0.dry : 'machine', prog = E.DRY_PROGS[c0.dry] ? c0.dry : 'P-DMD', ds = E.dryers(), cur = pickFree(ds, b), dp = E.DRY_PROGS[prog];
        return bHero(b, { mach: false }) + steps +
          card(L('Metode', 'Method'), choice('method', Object.keys(E.DRY_METHODS).map(function (k) { return [k, E.DRY_METHODS[k], k === 'machine' ? 'wind' : k === 'air' ? 'sparkles' : k === 'hang' ? 'shirt' : 'star']; }), method, { cls: 'ch8-grid' }), { icon: 'wind' }) +
          '<div id="dr8-m"' + (method === 'machine' ? '' : ' hidden') + '>' + card(L('Pilih dryer', 'Choose the dryer'), machPick('mach', ds, cur, b) + (!cur ? note(t(L('Semua dryer terpakai atau rusak. Lihat perkiraan selesai di atas.', 'All dryers are busy or down. See the expected finish above.')), 'hourglass', 'warn') : ''), { icon: 'wind' }) +
          card(L('Program', 'Program'), '<div class="f6-g">' + fld(L('Program', 'Program'), sel('prog', Object.keys(E.DRY_PROGS).map(function (k) { return [k, E.DRY_PROGS[k].n]; }), prog)) + fld(L('Suhu (°C)', 'Temperature (°C)'), inp('temp', dp.temp, { num: true })) + fld(L('Durasi (menit)', 'Duration (min)'), inp('dur', dp.min, { num: true })) + '</div>', { icon: 'cog' }) + '</div>' +
          fld(L('Catatan', 'Notes'), inp('note', ''), { wide: true }) + whoPick('t2') +
          abar(xl('primary', L('MULAI KERING', 'START DRYING'), 'play', { act: 'start' }), xl('danger', L('ADA MASALAH', 'REPORT ISSUE'), 'alert', { act: 'issue' }));
      }
      if (b.stage === 'drying') {
        return bHero(b, { mach: false, facts: [[L('Dryer · program', 'Dryer · program'), esc(b.run.mach || '—') + ' · ' + t(E.DRY_PROGS[b.run.prog] ? E.DRY_PROGS[b.run.prog].n : E.DRY_METHODS[b.run.method])], b.run.temp ? [L('Suhu', 'Temperature'), b.run.temp + '°C', 'num'] : null, [L('Operator', 'Operator'), first(b.run.op)]] }) + steps +
          card(L('Sedang dikeringkan', 'Drying'), '<div id="rn8">' + runBox(b) + '</div>', { icon: 'wind' }) +
          fld(L('Hasil', 'Result'), choice('cond', [['ok', L('Kering sempurna', 'Fully dry')], ['damp', L('Sedikit lembap, lanjut', 'Slightly damp, continue')]], 'ok'), { wide: true }) + whoPick('t2', L('Diselesaikan oleh', 'Finished by')) +
          abar(xl('primary', L('SELESAI KERING', 'DRY DONE'), 'checkc', { act: 'finish' }), xl('danger', L('ADA MASALAH', 'REPORT ISSUE'), 'alert', { act: 'issue' }));
      }
      if (b.stage === 'fin_ready') return bHero(b, { mach: false }) + steps + A.stateCard('success', L('Kering. Siap finalisasi oleh Team 3.', 'Dry. Ready for finalization by Team 3.'), null, L('Siap finalisasi', 'Ready for finalization')) + (can('prod.ho23') ? abar(xl('primary', L('KIRIM KE TEAM 3', 'SEND TO TEAM 3'), 'swap', { act: 'send' })) : '');
      return bHero(b, { mach: false }) + steps + A.stateCard('success', L('Status sekarang: ' + T(E.STAGE[b.stage][0]) + '.', 'Current status: ' + E.STAGE[b.stage][0][1] + '.'), A.backBtn('ghost'));
    },
    after: function (c) {
      var b = E.batch(c.rec), view = document.getElementById('view'); if (!b) return;
      if (b.stage === 'drying') live('rn8', function () { return runBox(E.batch(c.rec)); }, 5);
      view.querySelectorAll('[name=method]').forEach(function (r) { r.addEventListener('change', function () { view.querySelector('#dr8-m').hidden = this.value !== 'machine'; }); });
      var ps = view.querySelector('[name=prog]'); if (ps) ps.addEventListener('change', function () { var d = E.DRY_PROGS[this.value]; view.querySelector('[name=temp]').value = d.temp; view.querySelector('[name=dur]').value = d.min; });
    },
    act: {
      start: function () { var v = vals(document.getElementById('view')), r = E.startDry(cx(), A.S.rec, { method: v.method, mach: v.mach, prog: v.prog, temp: num(v.temp), dur: num(v.dur), note: v.note, op: v.op }); if (!r.ok) return fail(r); after(L('Pengeringan dimulai. Perkiraan selesai ' + r.end.slice(11) + '.', 'Drying started. Expected finish ' + r.end.slice(11) + '.')); },
      finish: function () { var v = vals(document.getElementById('view')), r = E.finishDry(cx(), A.S.rec, { cond: v.cond, op: v.op }); if (!r.ok) return fail(r); after(L('Kering. Kirim ke Team 3 untuk finalisasi.', 'Dry. Send it to Team 3 for finalization.')); },
      send: function () { var r = E.send(cx(), A.S.rec, { op: vals(document.getElementById('view')).op }); if (!r.ok) return fail(r); go('PROD-DRY-001'); setTimeout(function () { A.toast(L('Dikirim ke Team 3.', 'Sent to Team 3.')); }, 300); },
      issue: function () { var b = E.batch(A.S.rec); issueDlg({ stage: 'dry', batch: b.id, run: !!b.run, mach: b.run ? b.run.mach : null }); },
      resume: RESUME
    }
  };

  /* ================= HOM-T3-001 Team 3 Home ================= */
  function t3Next() {
    var hoIn = E.state().ho.filter(function (h) { return h.kind === 't2t3' && h.st === 'waiting'; })[0];
    if (hoIn) return { k: L('Handover masuk', 'Incoming handover'), icon: 'swap', title: esc(hoIn.batch) + ' · ' + cname(hoIn.cl), sub: kg(hoIn.kg) + ' · ' + pcs(hoIn.qty) + ' · ' + t(L('dari ', 'from ')) + first(hoIn.sender), l: L('TERIMA HANDOVER', 'ACCEPT HANDOVER'), bi: 'checkc', go: 'PROD-HO-002' };
    var qc = E.batches(['qc_q'])[0], pk = E.batches(['pack_q'])[0], pd = E.batches(['packed'])[0], fq = E.batches(['fin_q'])[0], rt = E.batches(['rtd'])[0];
    var risk = [qc, pk, pd, fq].filter(Boolean).sort(function (a, b) { var r = { late: 0, risk: 1, ok: 2 }; return r[E.slaState(a)] - r[E.slaState(b)]; })[0];
    if (risk && risk === qc) return { icon: 'search', title: esc(qc.id) + ' · ' + cname(qc.cl), sub: pcs(qc.finQty || qc.pcs) + ' · ' + t(L('menunggu QC', 'waiting for QC')), l: L('MULAI QC', 'START QC'), bi: 'search', go: 'PROD-QC-002', rec: qc.id };
    if (risk && (risk === pk || risk === pd)) return { icon: 'package', title: esc(risk.id) + ' · ' + cname(risk.cl), sub: t(risk.stage === 'packed' ? L('Packing selesai, cek rekonsiliasi', 'Packed, check reconciliation') : L('Menunggu packing', 'Waiting for packing')), l: risk.stage === 'packed' ? L('SIAP DIKIRIM', 'READY TO DELIVER') : L('MULAI PACKING', 'START PACKING'), bi: 'package', go: 'PROD-PACK-002', rec: risk.id };
    if (fq && E.finLines().some(E.machAvail)) return { icon: 'iron', title: esc(fq.id) + ' · ' + cname(fq.cl), sub: kg(fq.kg) + ' · ' + t(E.FIN_METHODS[(E.CATS[fq.cat] || {}).fin] || ''), l: L('MULAI FINISHING', 'START FINISHING'), bi: 'play', go: 'PROD-FIN-002', rec: fq.id };
    if (rt) return { icon: 'truck', title: esc(rt.id) + ' · ' + cname(rt.cl), sub: rt.pack.pkgs.length + ' ' + t(L('paket siap', 'packages ready')), l: L('SERAHKAN KE LOGISTICS', 'HAND OVER TO LOGISTICS'), go: 'PROD-READY-001' };
    var fn = E.batches(['finishing'])[0];
    if (fn) return { icon: 'iron', title: esc(fn.id) + ' · ' + cname(fn.cl), sub: (fn.finDone || 0) + '/' + fn.pcs + ' pcs · ' + esc(fn.run.mach), l: L('LANJUTKAN FINISHING', 'CONTINUE FINISHING'), go: 'PROD-FIN-002', rec: fn.id };
    return null;
  }
  V['HOM-T3-001'] = {
    title: function () { return L('Beranda Team 3', 'Team 3 Home'); },
    render: function () {
      var h = E.home('t3');
      return hello(esc(G.day(E.TODAY)) + ' · ' + t(L('Finishing, QC & Packing', 'Finishing, QC & Packing')), shiftLine('t3')) + nextCard(t3Next()) +
        bigCount([{ k: L('Menunggu finishing', 'Waiting for finishing'), v: h.finQ, icon: 'iron', go: 'PROD-FIN-001' }, { k: L('Sedang finishing', 'Finishing'), v: h.finishing, icon: 'iron', go: 'PROD-FIN-001' }, { k: L('Menunggu QC', 'Waiting for QC'), v: h.qcQ, icon: 'search', go: 'PROD-QC-001' },
          { k: L('Rework terbuka', 'Open rework'), v: h.rework, icon: 'refresh', go: 'PROD-REWASH-001', tone: h.rework ? 'warn' : '' }, { k: L('Packing', 'Packing'), v: h.packQ, icon: 'package', go: 'PROD-PACK-001' }, { k: L('Siap kirim', 'Ready to deliver'), v: h.rtd, icon: 'truck', go: 'PROD-READY-001', tone: h.rtd ? 'ok' : '' },
          { k: L('Risiko SLA', 'SLA risk'), v: h.risk, icon: 'clock', tone: h.risk ? 'warn' : '', go: 'PROD-QC-001' }, { k: L('Handover masuk', 'Incoming handover'), v: h.hoIn, icon: 'inbox', go: 'PROD-HO-002', tone: h.hoIn ? 'info' : '' }]) +
        chkMini('t3') + card(L('Line finishing', 'Finishing lines'), machStrip(['ironer', 'fold', 'iron']), { icon: 'iron' });
    }
  };

  /* ================= NP-07 · PROD-FIN-001 / 002 Finishing ================= */
  V['PROD-FIN-001'] = {
    render: function () {
      var q = E.batches(['fin_q']), run = E.batches(['finishing']), hoIn = E.state().ho.filter(function (h) { return h.kind === 't2t3' && h.st === 'waiting'; });
      return A.pageHead(null, t(L('Batch menunggu setrika, press, lipat atau gantung.', 'Batches waiting for ironing, pressing, folding or hanging.'))) +
        (hoIn.length ? note(t(L(hoIn.length + ' batch dari Team 2 menunggu diterima. ', hoIn.length + ' batch(es) from Team 2 waiting to be accepted. ')) + lnk('PROD-HO-002', null, t(L('Terima handover', 'Accept handover'))), 'inbox', 'info') : '') +
        card(L('Menunggu finishing', 'Waiting for finishing'), qlist(q.map(function (b) { return qrow(b, href('PROD-FIN-002', b.id), { meta: '<span>' + ic('iron') + t(E.FIN_METHODS[(E.CATS[b.cat] || {}).fin] || '') + '</span>' }); }), L('Tidak ada batch menunggu finishing.', 'No batch waiting for finishing.')), { icon: 'iron', count: q.length }) +
        card(L('Sedang finishing', 'Finishing'), qlist(run.map(function (b) { return qrow(b, href('PROD-FIN-002', b.id), { meta: '<span>' + ic('iron') + '<b>' + esc(b.run.mach) + '</b></span><span><b class="num">' + (b.finDone || 0) + '/' + b.pcs + '</b> pcs</span>' }); }), L('Tidak ada yang sedang finishing.', 'Nothing in finishing.')), { icon: 'clock', count: run.length });
    }
  };
  V['PROD-FIN-002'] = {
    title: function (rec) { return rec ? L('Finishing ' + rec, 'Finishing ' + rec) : null; },
    render: function (c) {
      var b = E.batch(c.rec); if (!b) return A.stateCard('empty', L('Batch tidak ditemukan.', 'Batch not found.'), A.backBtn('blue'));
      var steps = step8([L('Finishing', 'Finishing'), L('QC', 'QC'), L('Packing', 'Packing'), L('Siap Kirim', 'Ready')], 0);
      if (b.stage === 'hold') return bHero(b, { mach: false }) + holdGate(b);
      if (b.stage === 'fin_q') {
        var c0 = E.CATS[b.cat] || E.CATS.white, ls = E.finLines(), cur = ls.filter(E.machAvail)[0];
        return bHero(b, { mach: false }) + steps +
          card(L('Metode', 'Method'), choice('method', Object.keys(E.FIN_METHODS).map(function (k) { return [k, E.FIN_METHODS[k], k === 'iron' || k === 'press' || k === 'steam' ? 'iron' : k === 'fold' ? 'layers' : 'shirt']; }), c0.fin, { cls: 'ch8-grid' }), { icon: 'iron' }) +
          card(L('Workstation / line', 'Workstation / line'), machPick('line', ls, cur ? cur.id : '', null), { icon: 'grid' }) + whoPick('t3') +
          abar(xl('primary', L('MULAI FINISHING', 'START FINISHING'), 'play', { act: 'start' }), xl('danger', L('ADA MASALAH', 'REPORT ISSUE'), 'alert', { act: 'issue' }));
      }
      if (b.stage === 'finishing') {
        return bHero(b, { mach: false, facts: [[L('Line · metode', 'Line · method'), esc(b.run.mach) + ' · ' + t(E.FIN_METHODS[b.run.prog] || b.run.prog)], [L('Operator', 'Operator'), first(b.run.op)], [L('Mulai', 'Started'), hm(b.run.start), 'num']] }) + steps +
          card(L('Progres', 'Progress'), '<div class="fp8"><div class="fp8-b"><i style="width:' + Math.round((b.finDone || 0) / b.pcs * 100) + '%"></i></div><p><b class="num">' + (b.finDone || 0) + '</b> / ' + b.pcs + ' pcs</p></div>' +
            '<div class="g8-2">' + fld(L('Sudah selesai (pcs)', 'Done so far (pcs)'), stepper('done', b.finDone || 0, 'pcs', { big: true, max: b.pcs, label: L('Selesai', 'Done') })) + '<div class="fp8-a">' + A.btn('ghost', L('Simpan Progres', 'Save Progress'), 'check', { act: 'progress' }) + '</div></div>', { icon: 'chart' }) +
          card(L('Selesaikan', 'Complete'), fld(L('Jumlah selesai (pcs)', 'Completed quantity (pcs)'), inp('qty', b.pcs, { num: true }), { hint: t(L('Jika kurang dari ' + b.pcs + ' pcs, tulis catatan.', 'If fewer than ' + b.pcs + ' pcs, write a note.')) }) + '<div id="fn8-n" hidden>' + fld(L('Catatan kekurangan', 'Shortfall note'), inp('note', ''), { req: true, wide: true }) + '</div>' + whoPick('t3', L('Diselesaikan oleh', 'Finished by')), { icon: 'checkc' }) +
          abar(xl('primary', L('SELESAI FINISHING', 'FINISHING DONE'), 'checkc', { act: 'finish' }), xl('danger', L('ADA MASALAH', 'REPORT ISSUE'), 'alert', { act: 'issue' }));
      }
      return bHero(b, { mach: false }) + steps + A.stateCard('success', L('Finishing selesai. Status: ' + T(E.STAGE[b.stage][0]) + '.', 'Finishing done. Status: ' + E.STAGE[b.stage][0][1] + '.'), b.stage === 'qc_q' ? A.btn('primary', L('Ke QC', 'Go to QC'), 'search', { go: 'PROD-QC-002', rec: b.id }) : A.backBtn('ghost'));
    },
    after: function (c) {
      var b = E.batch(c.rec), view = document.getElementById('view'), q = view.querySelector('[name=qty]'); if (!b || !q) return;
      q.addEventListener('input', function () { view.querySelector('#fn8-n').hidden = !((num(this.value) || 0) < b.pcs); });
    },
    act: {
      start: function () { var v = vals(document.getElementById('view')), r = E.startFin(cx(), A.S.rec, { method: v.method, line: v.line, op: v.op }); if (!r.ok) return fail(r); after(L('Finishing dimulai.', 'Finishing started.')); },
      progress: function () { var v = vals(document.getElementById('view')), r = E.finProgress(cx(), A.S.rec, v.done); if (!r.ok) return fail(r); after(L('Progres tersimpan.', 'Progress saved.')); },
      finish: function () { var v = vals(document.getElementById('view')), id = A.S.rec, r = E.finishFin(cx(), id, { qty: num(v.qty), note: v.note, op: v.op }); if (!r.ok) { if (r.code === 'short') document.getElementById('fn8-n').hidden = false; return fail(r); } go('PROD-QC-002', id); setTimeout(function () { A.toast(L('Finishing selesai. Lanjut QC.', 'Finishing done. QC next.')); }, 300); },
      issue: function () { var b = E.batch(A.S.rec); issueDlg({ stage: 'fin', batch: b.id, run: !!b.run, mach: b.run ? b.run.mach : null }); },
      resume: RESUME
    }
  };

  /* ================= NP-08 · PROD-QC-001 / 002 Quality Control ================= */
  V['PROD-QC-001'] = {
    render: function () {
      var q = E.batches(['qc_q']);
      return A.pageHead(null, t(L('Batch menunggu QC. Rework yang kembali ditandai.', 'Batches waiting for QC. Returning rework is marked.'))) +
        qlist(q.map(function (b) { var r = E.rcv(b.rcvs[0]); return qrow(b, href('PROD-QC-002', b.id), { meta: (r && T(r.special) ? '<span>' + ic('info') + esc(T(r.special)) + '</span>' : '') + (b.flags.length ? '<span>' + flagsC(b.flags) + '</span>' : '') }); }), L('Tidak ada batch menunggu QC.', 'No batch waiting for QC.'));
    }
  };
  var ACT_FOR = { noda: 'rewash', bau: 'rewash', kontaminasi: 'rewash', kering: 'rewash', finishing: 'refinish', hitung: 'review', rusak: 'claim', other: 'review' };
  function qcFailDlg(b) {
    var total = b.finQty != null ? b.finQty : b.pcs;
    resetPh('qc8');
    dlg({ title: L('QC: ada masalah', 'QC: issue found'), icon: 'alert', ok: L('SIMPAN', 'SAVE'), sub: '<b class="mono6">' + esc(b.id) + '</b> · ' + cname(b.cl) + ' · ' + pcs(total),
      body: fld(L('Alasan', 'Reason'), choice('reason', Object.keys(E.QC_FAIL).map(function (k) { return [k, E.QC_FAIL[k]]; }), '', { cls: 'ch8-grid' }), { req: true, wide: true }) +
        fld(L('Tindakan', 'Action'), choice('action', Object.keys(E.QC_ACT).map(function (k) { return [k, E.QC_ACT[k][0], E.QC_ACT[k][1]]; }), '', { cls: 'ch8-grid' }), { req: true, wide: true }) +
        '<div class="g8-2">' + fld(L('Jumlah bermasalah', 'Problem quantity'), stepper('qty', 1, 'pcs', { big: true, max: total, label: L('Jumlah', 'Quantity') }), { req: true, hint: t(L('Sisanya lanjut ke packing.', 'The rest goes on to packing.')) }) +
        fld(L('Item', 'Item'), sel('item', [['', L('Pilih item', 'Choose item')]].concat(E.ITEMS.map(function (x) { return [x.k, x.n]; })), '')) + '</div>' +
        fld(L('Foto bukti', 'Photo evidence'), photoIn('qc8', L('Foto Masalah', 'Photo of the Issue'), { big: true }), { req: E.cfg().qcPhoto, wide: true }) + fld(L('Catatan', 'Notes'), area('note', ''), { wide: true }) +
        '<div id="qc8-r" class="sub5"></div>',
      after: function (el) {
        function upd() { var v = vals(el), resp = E.QC_RESP[v.reason]; el.querySelector('#qc8-r').innerHTML = resp ? ic('target') + t(L('Akar masalah: ', 'Root cause: ')) + '<b>' + t(E.RESP[v.action === 'refinish' ? 'fin' : v.action === 'rewash' ? (resp === 'dry' ? 'dry' : 'wash') : resp]) + '</b>' : ''; }
        el.querySelectorAll('[name=reason]').forEach(function (r) { r.addEventListener('change', function () { var a = el.querySelector('[name=action][value="' + ACT_FOR[this.value] + '"]'); if (a) a.checked = true; upd(); }); });
        el.addEventListener('change', upd);
      },
      onOk: function (v, el) {
        v = vals(el); var r = E.qcFail(cx(), b.id, { reason: v.reason, action: v.action, qty: v.qty, item: v.item || null, photo: photos('qc8')[0] || null, note: v.note });
        if (!r.ok) return r.msg;
        var msg = r.child ? L(r.rework.qty + ' pcs ke ' + T(E.STAGE[r.child.stage][0]) + ' (' + r.child.id + '). ', r.rework.qty + ' pcs to ' + E.STAGE[r.child.stage][0][1] + ' (' + r.child.id + '). ') : L('', '');
        go('PROD-QC-001'); setTimeout(function () { A.toast([T(msg) + T(L('Rework ' + r.rework.id + ' tercatat.', 'Rework ' + r.rework.id + ' recorded.')), (Array.isArray(msg) ? msg[1] : '') + 'Rework ' + r.rework.id + ' recorded.'], 'warn'); }, 300);
        return true;
      } });
  }
  V['PROD-QC-002'] = {
    title: function (rec) { return rec ? L('QC ' + rec, 'QC ' + rec) : null; },
    render: function (c) {
      var b = E.batch(c.rec); if (!b) return A.stateCard('empty', L('Batch tidak ditemukan.', 'Batch not found.'), A.backBtn('blue'));
      var steps = step8([L('Finishing', 'Finishing'), L('QC', 'QC'), L('Packing', 'Packing'), L('Siap Kirim', 'Ready')], 1), total = b.finQty != null ? b.finQty : b.pcs;
      if (b.stage === 'hold') return bHero(b, { mach: false }) + holdGate(b);
      if (b.stage !== 'qc_q') return bHero(b, { mach: false }) + steps + (b.qc ? A.stateCard(b.qc.res === 'pass' ? 'success' : 'warning', b.qc.res === 'pass' ? L('QC lulus ' + b.qc.pass + ' pcs oleh ' + E.first(b.qc.by) + '.', 'QC passed ' + b.qc.pass + ' pcs by ' + E.first(b.qc.by) + '.') : L('QC: ' + b.qc.pass + ' lulus, ' + b.qc.fail + ' bermasalah.', 'QC: ' + b.qc.pass + ' passed, ' + b.qc.fail + ' with issues.'), ['pack_q', 'packed'].indexOf(b.stage) >= 0 ? A.btn('primary', L('Ke Packing', 'Go to Packing'), 'package', { go: 'PROD-PACK-002', rec: b.id }) : A.backBtn('ghost')) : A.stateCard('warning', L('Batch belum siap QC.', 'The batch is not ready for QC.'), A.backBtn('ghost')));
      return bHero(b, { mach: false, facts: [[L('Dicek', 'To check'), pcs(total), 'num'], b.runs.length ? [L('Operator finishing', 'Finishing operator'), first(b.runs[b.runs.length - 1].op)] : null] }) + steps +
        card(L('Cek kualitas (opsional)', 'Quality checks (optional)'), '<div class="ch7 ch8-grid">' + Object.keys(E.QC_CHECKS).map(function (k) { return '<label class="ch7-i ch7-ok"><input type="checkbox" data-multi="1" name="checks" value="' + k + '"><span>' + ic('check') + t(E.QC_CHECKS[k]) + '</span></label>'; }).join('') + '</div>', { icon: 'clipboard' }) + whoPick('t3', L('Diperiksa oleh', 'Checked by')) +
        '<div class="qc8">' + xl('blue', L('LULUS', 'PASS'), 'checkc', { act: 'pass', cls: 'qc8-ok' }) + xl('danger', L('ADA MASALAH', 'ISSUE FOUND'), 'alert', { act: 'fail' }) + '</div>';
    },
    act: {
      pass: function () { var v = vals(document.getElementById('view')), id = A.S.rec, r = E.qcPass(cx(), id, { checks: v.checks || [], op: v.op }); if (!r.ok) return fail(r); if (r.merged) { go('PROD-PACK-002', r.batch.parent); setTimeout(function () { A.toast(L('Rework lulus dan digabung ke ' + r.batch.parent + '.', 'Rework passed and merged into ' + r.batch.parent + '.')); }, 300); return; } go('PROD-PACK-002', id); setTimeout(function () { A.toast(L('QC lulus. Lanjut packing.', 'QC passed. Packing next.')); }, 300); },
      fail: function () { qcFailDlg(E.batch(A.S.rec)); },
      resume: RESUME
    }
  };

  /* ================= NP-08 · PROD-REWASH-001 Rewash / Reprocess ================= */
  function rwCard(r) {
    var x = E.RW_ST[r.st] || E.RW_ST.open, ch = r.child ? E.batch(r.child) : null, spv = can('prod.spv');
    return '<section class="card rw8 rw8-' + r.st + '"><div class="rw8-h"><b class="mono6">' + esc(r.id) + '</b>' + A.chip(x[1], x[0]) + '<span class="sub5">' + G.when(r.at) + '</span></div>' +
      '<div class="rw8-g"><div class="rw8-f"><div><span>' + t(L('Alasan', 'Reason')) + '</span><b>' + t(E.QC_FAIL[r.reason] || L(r.reason, r.reason)) + '</b></div><div><span>' + t(L('Tahap penyebab', 'Responsible stage')) + '</span><b>' + t(E.RESP[r.resp] || L(r.resp, r.resp)) + '</b></div>' +
      '<div><span>' + t(L('Jumlah', 'Quantity')) + '</span><b class="num">' + pcs(r.qty) + ' · ' + kg(r.kg) + '</b></div><div><span>' + t(L('Batch asal', 'Original batch')) + '</span><b>' + bLink(r.batch) + '</b></div>' +
      '<div><span>' + t(L('Klien', 'Client')) + '</span><b>' + cname(r.cl || (E.batch(r.batch) || {}).cl) + '</b></div><div><span>' + t(L('Dampak waktu', 'Time impact')) + '</span><b class="num">+' + esc(minT(r.timeMin || 0)) + '</b></div>' +
      '<div><span>' + t(L('Dampak SLA', 'SLA impact')) + '</span><b class="num' + (r.slaMin ? ' t-crit' : '') + '">' + (r.slaMin ? '+' + esc(minT(r.slaMin)) + ' ' + t(L('lewat', 'over')) : t(L('Aman', 'On track'))) + '</b></div>' + (ch ? '<div><span>' + t(L('Posisi sekarang', 'Where it is now')) + '</span><b>' + bLink(ch.id) + ' ' + stgC(ch) + '</b></div>' : '') + '</div>' + (r.ev ? '<div class="ev8">' + img(r.ev, 'bukti') + '</div>' : '') + '</div>' +
      (r.note ? note(esc(r.note), 'message', 'info') : '') + (r.dec ? note(t(L('Keputusan supervisor: ', 'Supervisor decision: ')) + esc(r.dec.note) + ' · ' + first(r.dec.by), 'user', 'ok') : '') +
      (spv && r.st === 'claim' ? '<div class="ho8-a">' + A.btn('blue', L('Setujui Klaim', 'Approve Claim'), 'checkc', { act: 'dec', val: r.id + '|claim', cls: 'btn-sm' }) + '</div>' : '') +
      (spv && r.st === 'review' ? '<div class="ho8-a">' + A.btn('ghost', L('Rewash', 'Rewash'), 'refresh', { act: 'dec', val: r.id + '|rewash', cls: 'btn-sm' }) + A.btn('ghost', L('Refinish', 'Refinish'), 'iron', { act: 'dec', val: r.id + '|refinish', cls: 'btn-sm' }) + A.btn('ghost', L('Klaim', 'Claim'), 'file', { act: 'dec', val: r.id + '|claimset', cls: 'btn-sm' }) + A.btn('blue', L('Lulus', 'Pass'), 'checkc', { act: 'dec', val: r.id + '|pass', cls: 'btn-sm' }) + '</div>' : '') + '</section>';
  }
  V['PROD-REWASH-001'] = {
    render: function (c) {
      var tab = c.q.tab || 'open', all = E.reworks(), list = tab === 'open' ? E.reworks({ open: true }) : all, rc = E.rootCause();
      var rows = Object.keys(rc.stage).map(function (k) { return { l: E.RESP[k] || L(k, k), v: rc.stage[k] }; }).sort(function (a, b) { return b.v - a.v; });
      var rs = Object.keys(rc.reason).map(function (k) { return { l: E.QC_FAIL[k] || L(k, k), v: rc.reason[k] }; }).sort(function (a, b) { return b.v - a.v; });
      return A.pageHead(null, t(L('Setiap rework menyimpan alasan, tahap penyebab, jumlah, bukti dan dampaknya. Riwayat tidak dihapus.', 'Every rework keeps its reason, responsible stage, quantity, evidence and impact. History is never deleted.'))) +
        tabs([['open', L('Terbuka', 'Open'), 'refresh', E.reworks({ open: true }).length], ['all', L('Semua', 'All'), 'list', all.length]], tab, 'tab', { def: 'open' }) +
        (list.length ? list.map(rwCard).join('') : A.empty(L('Tidak ada rework terbuka.', 'No open rework.'))) +
        '<div class="g8-2">' + card(L('Akar masalah per tahap', 'Root cause by stage'), A.hbars(rows, { fmt: function (v) { return v + ' pcs'; } }), { icon: 'target' }) + card(L('Alasan rework', 'Rework reasons'), A.hbars(rs, { fmt: function (v) { return v + ' pcs'; } }), { icon: 'chart' }) + '</div>';
    },
    act: {
      dec: function (el) {
        var p = el.getAttribute('data-val').split('|'), dec = p[1] === 'claimset' ? 'claim' : p[1];
        reasonDlg({ title: L('Keputusan rework ' + p[0], 'Rework decision ' + p[0]), label: L('Catatan keputusan', 'Decision note'), fn: function (n0) { return E.rwDecide(cx(), p[0], dec, n0); } });
      }
    }
  };

  /* ================= NP-09 · PROD-PACK-001 / 002 Packing, Labeling & Ready ================= */
  function qcChip(b) { if (!b.qc) return A.chip('mute', L('Belum QC', 'No QC yet')); return b.qc.res === 'pass' ? A.chip('ok', L('QC lulus', 'QC passed'), 'checkc') : b.qc.res === 'partial' ? A.chip('warn', L('QC sebagian ' + b.qc.pass + '/' + b.qc.qty, 'QC partial ' + b.qc.pass + '/' + b.qc.qty)) : A.chip('crit', L('QC gagal', 'QC failed')); }
  function dlvLine(b) { var o = E.order(b.dlv); return o ? '<span>' + ic('truck') + G.day(o.date) + ' · <b class="num">' + esc(o.win.join('–')) + '</b></span>' : ''; }
  V['PROD-PACK-001'] = {
    render: function () {
      var q = E.batches(['pack_q']), pd = E.batches(['packed']);
      return A.pageHead(null, t(L('Hanya barang lulus QC yang dipacking. Rekonsiliasi dicek sebelum Siap Kirim.', 'Only QC-passed items are packed. Reconciliation is checked before Ready to Deliver.'))) +
        card(L('Menunggu packing', 'Waiting for packing'), qlist(q.map(function (b) { return qrow(b, href('PROD-PACK-002', b.id), { chip: qcChip(b), meta: dlvLine(b) }); }), L('Tidak ada batch menunggu packing.', 'No batch waiting for packing.')), { icon: 'package', count: q.length }) +
        card(L('Packing selesai · cek Siap Kirim', 'Packed · check Ready to Deliver'), qlist(pd.map(function (b) { var rc = E.reconcile(b); return qrow(b, href('PROD-PACK-002', b.id), { chip: rc.ok ? A.chip('ok', L('Rekonsiliasi sesuai', 'Reconciled'), 'checkc') : A.chip('crit', L('Ada selisih', 'Gap'), 'alert'), meta: '<span>' + ic('package') + '<b class="num">' + b.pack.pkgs.length + '</b> ' + t(L('paket', 'packages')) + '</span>' + dlvLine(b) }); }), L('Belum ada.', 'None yet.')), { icon: 'checkc', count: pd.length });
    }
  };
  // A drawn QR-style code for the prototype label (deterministic from the payload).
  function qr(s) {
    var n = 21, h = 2166136261, cells = '', i, x, y;
    for (i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; }
    function fin(px, py) { return '<rect x="' + px + '" y="' + py + '" width="7" height="7" fill="none" stroke="#0B3D78" stroke-width="1"/><rect x="' + (px + 2) + '" y="' + (py + 2) + '" width="3" height="3" fill="#0B3D78"/>'; }
    for (y = 0; y < n; y++) for (x = 0; x < n; x++) {
      if ((x < 8 && y < 8) || (x > n - 9 && y < 8) || (x < 8 && y > n - 9)) continue;
      h ^= (x * 31 + y * 17); h = Math.imul(h, 16777619) >>> 0; if (h & 1) cells += '<rect x="' + x + '" y="' + y + '" width="1" height="1"/>';
    }
    return '<svg class="qr8" viewBox="-1 -1 23 23" role="img" aria-label="QR ' + esc(s) + '"><rect x="-1" y="-1" width="23" height="23" fill="#fff"/>' + fin(0.5, 0.5) + fin(n - 7.5, 0.5) + fin(0.5, n - 7.5) + '<g fill="#0B3D78">' + cells + '</g></svg>';
  }
  function labelBox(b, pkg) {
    var l = E.label(b, pkg);
    return '<div class="lb8"><div class="lb8-h"><img src="../assets/brand/jfresh-logo.png" alt="J\'Fresh Laundry" width="605" height="373"><span class="lb8-n"><b class="num">' + l.n + '</b>/' + l.of + '</span></div>' +
      '<div class="lb8-b"><div><b>' + esc(l.cl) + '</b><span>' + esc(l.prop) + '</span><dl><dt>' + t(L('Order', 'Order')) + '</dt><dd class="mono6">' + esc(l.ord) + '</dd><dt>' + t(L('Batch', 'Batch')) + '</dt><dd class="mono6">' + esc(l.batch) + '</dd><dt>' + t(L('Isi', 'Contents')) + '</dt><dd>' + l.qty + ' pcs · ' + l.kg + ' kg</dd><dt>' + t(L('Kirim', 'Deliver')) + '</dt><dd>' + esc(l.date) + '</dd></dl></div>' + qr(l.qr) + '</div><span class="lb8-id mono6">' + esc(l.pkg) + '</span></div>';
  }
  function recBox(b) {
    var rc = E.reconcile(b), steps = [[L('Diterima', 'Received'), rc.rcv], [L('Diproses', 'Processed'), rc.proc], [L('Lulus QC', 'QC passed'), rc.qc], [L('Dipacking', 'Packed'), rc.packed]];
    return '<div class="rec8 rec8-' + (rc.ok ? 'ok' : 'bad') + '"><ol>' + steps.map(function (s, i) { return '<li><span>' + t(s[0]) + '</span><b class="num">' + (s[1] == null ? '—' : s[1]) + '</b></li>' + (i < 3 ? '<li class="rec8-a" aria-hidden="true">' + ic('arrow') + '</li>' : ''); }).join('') + '</ol>' +
      (rc.claims ? '<p class="sub5">' + t(L('Klaim kerusakan disetujui: ', 'Approved damage claims: ')) + rc.claims + ' pcs</p>' : '') +
      (rc.ok ? '<p class="rec8-m">' + ic('checkc') + t(L('Rekonsiliasi sesuai.', 'Reconciliation matches.')) + '</p>' : '<ul class="rec8-g">' + rc.gaps.map(function (g) { return '<li>' + ic('alert') + t(g) + '</li>'; }).join('') + '</ul>') + '</div>';
  }
  V['PROD-PACK-002'] = {
    title: function (rec) { return rec ? L('Packing ' + rec, 'Packing ' + rec) : null; },
    render: function (c) {
      var b = E.batch(c.rec); if (!b) return A.stateCard('empty', L('Batch tidak ditemukan.', 'Batch not found.'), A.backBtn('blue'));
      var steps = step8([L('Finishing', 'Finishing'), L('QC', 'QC'), L('Packing', 'Packing'), L('Siap Kirim', 'Ready')], b.stage === 'pack_q' ? 2 : 3), o = E.order(b.dlv);
      var h0 = bHero(b, { mach: false, facts: [[L('Status QC', 'QC status'), qcChip(b)], o ? [L('Jadwal kirim', 'Delivery schedule'), G.day(o.date) + ' · ' + esc(o.win.join('–')), 'num'] : null] });
      if (b.stage === 'pack_q') {
        var qcOk = b.qc && b.qc.pass > 0, avail = (qcOk ? b.qc.pass : (b.finQty || b.pcs)) - E.packedQty(b), sug = Math.max(1, Math.ceil(avail / ((E.CATS[b.cat] || {}).kgPc > 0.45 ? 20 : 25)));
        resetPh('pk8');
        return h0 + steps + card(L('Rekonsiliasi', 'Reconciliation'), recBox(b), { icon: 'scale' }) +
          (!qcOk ? (can('prod.spv') ? note(t(L('Batch ini belum lulus QC. Packing hanya dengan override supervisor dan alasan.', 'This batch has not passed QC. Packing only with a supervisor override and a reason.')), 'lock', 'crit') + fld(L('Alasan override', 'Override reason'), inp('reason', ''), { req: true, wide: true }) : A.stateCard('noperm', L('Hanya barang yang lulus QC yang boleh dipacking.', 'Only items that passed QC can be packed.'), A.btn('primary', L('Ke QC', 'Go to QC'), 'search', { go: 'PROD-QC-001' }), L('Belum lulus QC', 'Not QC passed'))) : '') +
          (qcOk || can('prod.spv') ? card(L('Paket', 'Packages'), '<p class="sub5">' + t(L('Dikemas sekarang: ', 'Packing now: ')) + '<b class="num">' + avail + ' pcs</b></p><div class="g8-2">' + fld(L('Jumlah paket', 'Package count'), stepper('pkgs', sug, L('paket', 'packages'), { big: true, max: 60, label: L('Paket', 'Packages') })) +
            fld(L('Label', 'Label'), choice('label', Object.keys(E.LABELS).map(function (k) { return [k, E.LABELS[k]]; }), 'qr')) + '</div>' + fld(L('Foto packing (opsional)', 'Packing photo (optional)'), photoIn('pk8'), { wide: true }) + fld(L('Catatan', 'Notes'), inp('note', ''), { wide: true }) + whoPick('t3', L('Dikemas oleh', 'Packed by')), { icon: 'package' }) +
            abar(xl('primary', L('PACKING SELESAI', 'PACKING DONE'), 'checkc', { act: 'pack' })) : '');
      }
      if (b.stage === 'packed') {
        var rc = E.reconcile(b);
        return h0 + steps + card(L('Rekonsiliasi', 'Reconciliation'), recBox(b), { icon: 'scale', cls: rc.ok ? '' : 'card-crit7' }) +
          card(L('Label', 'Labels'), '<div class="lb8l">' + b.pack.pkgs.slice(0, 2).map(function (p) { return labelBox(b, p); }).join('') + '</div>' + (b.pack.pkgs.length > 2 ? '<p class="sub5">+ ' + (b.pack.pkgs.length - 2) + ' ' + t(L('label lain', 'more labels')) + '</p>' : '') + '<div class="bt8">' + A.btn('ghost', L('Cetak Label', 'Print Labels'), 'print', { act: 'print' }) + '</div>', { icon: 'tag', count: b.pack.pkgs.length }) +
          (!rc.ok && !can('prod.spv') ? note(t(L('Rekonsiliasi belum sesuai. Selesaikan selisih atau minta persetujuan supervisor.', 'Reconciliation does not match. Resolve it or ask for supervisor approval.')), 'lock', 'crit') : '') + whoPick('t3') +
          abar(rc.ok || can('prod.spv') ? xl('primary', L('SIAP DIKIRIM', 'READY TO DELIVER'), 'truck', { act: 'ready' }) : '', b.qc && b.qc.pass > E.packedQty(b) ? A.btn('ghost', L('Tambah Paket', 'Add Packages'), 'plus', { act: 'more', cls: 'btn-xl' }) : '');
      }
      if (b.stage === 'rtd' || b.stage === 'ho3l' || b.stage === 'handed') return h0 + steps + A.stateCard('success', b.stage === 'rtd' ? L('Siap Kirim. Serahkan paket ke Logistics.', 'Ready to Deliver. Hand the packages to Logistics.') : b.stage === 'ho3l' ? L('Menunggu Logistics mengambil paket.', 'Waiting for Logistics to collect the packages.') : L('Sudah diterima Logistics.', 'Already accepted by Logistics.'), b.stage === 'rtd' ? A.btn('primary', L('SERAHKAN KE LOGISTICS', 'HAND OVER TO LOGISTICS'), 'truck', { go: 'PROD-READY-001' }) : '') + card(L('Label', 'Labels'), '<div class="lb8l">' + b.pack.pkgs.slice(0, 2).map(function (p) { return labelBox(b, p); }).join('') + '</div>', { icon: 'tag', count: b.pack.pkgs.length });
      return h0 + steps + A.stateCard('warning', L('Batch belum siap packing. Status: ' + T((E.STAGE[b.stage] || [L('—')])[0]) + '.', 'The batch is not ready for packing. Status: ' + (E.STAGE[b.stage] || [['', '—']])[0][1] + '.'), A.backBtn('ghost'));
    },
    act: {
      pack: function () { var v = vals(document.getElementById('view')), r = E.pack(cx(), A.S.rec, { pkgs: v.pkgs, label: v.label, note: v.note, photo: photos('pk8')[0] || null, reason: v.reason, op: v.op }); if (!r.ok) return fail(r); after(L('Packing selesai: ' + r.batch.pack.pkgs.length + ' paket. Cek rekonsiliasi lalu SIAP DIKIRIM.', 'Packed: ' + r.batch.pack.pkgs.length + ' packages. Check reconciliation, then READY TO DELIVER.')); },
      more: function () { var b = E.batch(A.S.rec); b.stage = 'pack_q'; A.rerender(); },
      print: function () { window.print(); },
      ready: function () {
        var id = A.S.rec, b = E.batch(id), rc = E.reconcile(b), v = vals(document.getElementById('view'));
        if (!rc.ok) { reasonDlg({ title: L('Siap kirim dengan selisih', 'Ready with a gap'), sub: rc.gaps.map(function (g) { return t(g); }).join('<br>'), label: L('Alasan persetujuan supervisor', 'Supervisor approval reason'), icon: 'lock', fn: function (n0) { return E.ready(cx(), id, { reason: n0, op: v.op }); }, done: L('Siap Kirim dengan persetujuan supervisor.', 'Ready to Deliver with supervisor approval.') }); return; }
        var r = E.ready(cx(), id, { op: v.op }); if (!r.ok) return fail(r); go('PROD-READY-001'); setTimeout(function () { A.toast(L('Siap Kirim. Serahkan ke Logistics.', 'Ready to Deliver. Hand over to Logistics.')); }, 300);
      }
    }
  };
  P.labelBox = labelBox; P.recBox = recBox; P.qcChip = qcChip; P.qr = qr; P.machStrip = machStrip; P.bHero = bHero;

  /* ================= NP-09 · PROD-READY-001 Ready to Deliver ================= */
  V['PROD-READY-001'] = {
    render: function () {
      var rt = E.batches(['rtd']), wt = E.batches(['ho3l']), gone = E.batches(['handed']).filter(function (b) { return b.dlvAt && b.dlvAt.slice(0, 10) === E.TODAY; });
      function row(b, right) { var o = E.order(b.dlv), tr = o && E.LG && E.LG.tripOf ? E.LG.tripOf(o) : null; return qrow(b, href('PROD-PACK-002', b.id), { icon: 'package', meta: '<span>' + ic('package') + '<b class="num">' + b.pack.pkgs.length + '</b> ' + t(L('paket', 'packages')) + ' · ' + E.packedQty(b) + ' pcs</span>' + dlvLine(b) + (tr ? '<span>' + ic('user') + first(tr.drv) + '</span>' : ''), right: right }); }
      return A.pageHead(null, t(L('Paket siap kirim. Serahkan ke Logistics untuk melanjutkan delivery Fase 7.', 'Packages ready to deliver. Hand them to Logistics to continue the Phase 7 delivery.'))) +
        card(L('Siap kirim', 'Ready to deliver'), qlist(rt.map(function (b) { return row(b, A.pbtn('prod.ho3l', 'primary', L('SERAHKAN KE LOGISTICS', 'HAND OVER TO LOGISTICS'), 'truck', { act: 'send', val: b.id, cls: 'btn-sm' })); }), L('Belum ada paket siap kirim.', 'No package ready to deliver yet.')), { icon: 'truck', count: rt.length }) +
        card(L('Menunggu diambil Logistics', 'Waiting for Logistics pickup'), qlist(wt.map(function (b) { return row(b, A.chip('appr', L('Menunggu driver', 'Waiting for driver'), 'hourglass')); }), L('Tidak ada paket menunggu diambil.', 'No packages waiting for pickup.')), { icon: 'hourglass', count: wt.length, link: ['PROD-HO-003', L('Handover', 'Handover')] }) +
        (gone.length ? card(L('Sudah diambil hari ini', 'Collected today'), qlist(gone.map(function (b) { return row(b, A.chip('ok', L('Diterima Logistics', 'With Logistics'), 'checkc')); }), ''), { icon: 'checkc', count: gone.length }) : '');
    },
    act: { send: function (el) { var r = E.send(cx(), el.getAttribute('data-val')); if (!r.ok) return fail(r); after(L('Diserahkan. Menunggu Logistics menerima paket.', 'Handed over. Waiting for Logistics to accept the packages.')); } }
  };
})();
