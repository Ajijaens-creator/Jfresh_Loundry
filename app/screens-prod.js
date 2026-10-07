/* JFRESH OS — Phase 8 screens (part 1): shared production helpers (A.P8), Team 1 workspace
   (HOM-T1-001, receiving PROD-RCV-001/002, discrepancy PROD-DIS-001, weighing PROD-WGT-001,
   sorting PROD-SORT-001/002, batch builder PROD-BATCH-001), the three plant handovers
   (PROD-HO-001/002/003), team issues (PROD-ISSUE-002) and team history (PROD-HIS-001).
   iPad first: one decision per screen, big buttons at the bottom. Every number comes from the
   production engine (assets/js/jfos-prod.js), which checks permission and team scope and writes
   the audit. */
(function () {
  var A = window.JFAPP, E = window.JFPROD, H = A && A.P5, G = A && A.P7;
  if (!A || !E || !H || !G) return;
  var V = A.V, T = A.T, L = A.L, t = A.t, esc = A.esc, ic = A.ic, can = A.can, href = A.href;
  var open = H.open, lnk = H.lnk, tabs = H.tabs, card = H.card, kv = H.kv, note = H.note, tile = H.tile, tiles = H.tiles, dlg = H.dlg, fld = H.fld, inp = H.inp, sel = H.sel, area = H.area, num = H.num;
  var after = G.after, fail = G.fail, vals = G.vals, opts = G.opts, choice = G.choice, stepper = G.stepper, photoIn = G.photoIn, photos = G.photos, resetPh = G.resetPh, img = G.img, when = G.when, minT = G.minT, av = G.av;
  A.addParents(E.PARENTS);
  function cx() { return A.ctx(); }
  function go(id, rec, q) { A.go(id, rec, q); }

  /* ================= Shared helpers (also used by screens-prod2.js / screens-prod3.js) ================= */
  function team() { return E.teamOf(cx()); }
  function me() { return E.empId(cx()); }
  function hm(s) { return s ? String(s).slice(11, 16) : '—'; }
  function kg(v) { return v == null ? '—' : A.fmt.num(v, v % 1 ? 1 : 0) + ' kg'; }
  function pcs(v) { return v == null ? '—' : A.fmt.num(v, 0) + ' pcs'; }
  function cname(id) { return esc(E.clientName(id)); }
  function pname(id) { return esc(E.propName(id)); }
  function emp(id) { return esc(E.empName(id)); }
  function first(id) { return esc(E.first(id)); }
  var PRI_CLS = { normal: 'n', important: 'high', express: 'express', urgent: 'urgent', superexpress: 'superexpress' };
  function priC(p, all) { var x = E.PRI[p] || E.PRI.normal; if (p === 'normal' && !all) return ''; return '<span class="pr7 pr7-' + PRI_CLS[p] + '">' + (E.priRank(p) >= 4 ? ic('zap') : '') + t(x[0]) + '</span>'; }
  function stgC(b) { var x = E.STAGE[b.stage] || ['', 'mute']; return A.chip(x[1], x[0]); }
  function slaC(b, big) {
    if (!b.sla) return '';
    var s = E.slaState(b), left = E.slaLeft(b), x = E.SLA_ST[s];
    if (['handed', 'merged'].indexOf(b.stage) >= 0) return '';
    var txt = s === 'late' ? L('Terlambat ' + minT(-left), minT(-left) + ' late') : L('Sisa ' + minT(left), minT(left) + ' left');
    if (['rtd', 'ho3l'].indexOf(b.stage) >= 0 && s === 'ok') txt = L('Batas ' + hm(b.sla), 'Due ' + hm(b.sla));
    return '<span class="sla8 sla8-' + s + (big ? ' sla8-b' : '') + '" title="' + esc(T(L('Batas SLA ', 'SLA deadline ')) + b.sla) + '">' + ic(s === 'ok' ? 'clock' : 'alert') + '<span>' + t(s === 'ok' ? txt : [T(x[0]) + ' · ' + T(txt), x[0][1] + ' · ' + (Array.isArray(txt) ? txt[1] : txt)]) + '</span></span>';
  }
  function rcvC(r) { var x = E.RCV_ST[r.st] || ['', 'mute']; if (r.st === 'received') { var m = { wgt: L('Menunggu timbang', 'Waiting for weighing'), sort: L('Menunggu sorting', 'Waiting for sorting'), batch: L('Siap batch', 'Ready for batch'), done: L('Masuk batch', 'In a batch') }; return A.chip(r.stage === 'done' ? 'ok' : 'info', m[r.stage] || x[0]); } return A.chip(x[1], x[0]); }
  function srcC(k) { var x = E.SRC[k] || E.SRC.manifest; return '<span class="src8">' + ic(x[1]) + '<span>' + t(x[0]) + '</span></span>'; }
  function catC(k) { var c = E.CATS[k]; return c ? '<span class="cat8 cat8-' + k + '">' + ic(c.icon) + '<span>' + t(c.n) + '</span></span>' : ''; }
  function machC(m) { var x = E.MACH_ST[m.st] || ['', 'mute']; return A.chip(x[1], x[0]); }
  function flagsC(list) { return (list || []).map(function (k) { var f = E.FLAGS[k]; return f ? A.chip(f[1], f[0], f[2]) : ''; }).join(' '); }
  function teamName(k) { var x = E.TEAMS[k]; return x ? t(x.short) : k === 'log' ? 'Logistics' : esc(k || '—'); }
  function stIcon(k) { return { t1: 'basket', t2: 'droplet', t3: 'shirt', log: 'truck', spv: 'user', mnt: 'wrench' }[k] || 'dot'; }
  function bLink(id, label) { return lnk('PROD-TRACE-001', id, label || '<span class="mono6">' + esc(id) + '</span>'); }
  function sevC(s) { var x = E.SEV[s] || E.SEV.med; return A.chip(x[1], x[0], s === 'crit' || s === 'high' ? 'alert' : 'bell'); }
  // Shared iPad: who is doing this step (defaults to the signed-in person).
  function whoPick(tm, label) {
    var list = E.onShift(tm); if (!list.length) return '';
    var mine = me(), def = list.indexOf(mine) >= 0 ? mine : list[0];
    return '<div class="who8"><span class="who8-k">' + t(label || L('Dikerjakan oleh', 'Done by')) + '</span>' + choice('op', list.map(function (e) { return [e, E.first(e), null]; }), def, { cls: 'ch8-who' }) + '</div>';
  }
  // A queue row: big tap target for gloved hands on the iPad.
  function qrow(b, link, o) {
    o = o || {};
    var tag = link ? 'a' : 'div';
    return '<' + tag + ' class="q8' + (o.cur ? ' is-cur' : '') + (E.slaState(b) !== 'ok' && b.sla && ['handed', 'merged'].indexOf(b.stage) < 0 ? ' q8-' + E.slaState(b) : '') + '"' + (link ? ' href="' + link + '"' : '') + '>' +
      '<span class="q8-i">' + ic(o.icon || (E.CATS[b.cat] || {}).icon || 'package') + '</span>' +
      '<span class="q8-b"><span class="q8-h"><b class="mono6">' + esc(b.id) + '</b>' + priC(b.pri) + (b.parent ? A.chip('appr', L('Rework', 'Rework'), 'refresh') : '') + (o.chip || '') + '</span>' +
      '<b class="q8-t">' + cname(b.cl) + '</b><span class="q8-s">' + pname(b.prop) + (b.mixed ? ' · ' + t(L('campuran', 'mixed')) : '') + '</span>' +
      '<span class="q8-m"><span>' + ic('scale') + '<b class="num">' + kg(b.kg) + '</b></span><span>' + ic('layers') + '<b class="num">' + pcs(b.finQty != null && b.stage !== 'finishing' ? b.finQty : b.pcs) + '</b></span>' + (o.meta || '') + '</span></span>' +
      '<span class="q8-r">' + slaC(b) + (o.right || '') + (link ? ic('chevr', 'q8-go') : '') + '</span></' + tag + '>';
  }
  function qlist(rows, empty) { return rows.length ? '<div class="q8l">' + rows.join('') + '</div>' : A.empty(empty); }
  // Hero card on a detail screen: who, what, how much, when.
  function hero(o) {
    return '<section class="card hr8' + (o.cls ? ' ' + o.cls : '') + '"><div class="hr8-h"><span class="hr8-ic">' + ic(o.icon || 'package') + '</span><div class="hr8-t"><span class="hr8-id mono6">' + esc(o.id) + '</span><h2>' + o.title + '</h2>' + (o.sub ? '<p>' + o.sub + '</p>' : '') + '</div><div class="hr8-c">' + (o.chips || '') + '</div></div>' +
      (o.facts ? '<div class="hr8-f">' + o.facts.filter(Boolean).map(function (f) { return '<div><span>' + t(f[0]) + '</span><b class="' + (f[2] || '') + '">' + f[1] + '</b></div>'; }).join('') + '</div>' : '') + (o.extra || '') + '</section>';
  }
  function abar(main, side) { return '<div class="abar abar8"><div class="abar-b">' + (side || '') + main + '</div></div>'; }
  function xl(kind, label, icon, o) { o = o || {}; o.cls = 'btn-xl' + (o.cls ? ' ' + o.cls : ''); return A.btn(kind, label, icon, o); }
  function step8(list, cur) {
    return '<ol class="sp8">' + list.map(function (x, i) { var c = i < cur ? 'done' : i === cur ? 'now' : ''; return '<li class="' + c + '"><span>' + (i < cur ? ic('check') : i + 1) + '</span><b>' + t(x) + '</b></li>'; }).join('') + '</ol>';
  }
  function bigCount(items) { return '<div class="bc8">' + items.map(function (x) { var tag = x.go ? 'a' : 'div'; return '<' + tag + ' class="bc8-i' + (x.tone ? ' bc8-' + x.tone : '') + '"' + (x.go ? ' href="' + href(x.go, x.rec, x.qs) + '"' : '') + '><span class="bc8-ic">' + ic(x.icon) + '</span><b class="num">' + esc(x.v) + '</b><span>' + t(x.k) + '</span></' + tag + '>'; }).join('') + '</div>'; }
  // Next step card for the team homes.
  function nextCard(o) {
    if (!o) return '';
    return '<section class="card nx8"><span class="nx8-k">' + t(o.k || L('Langkah berikutnya', 'Next step')) + '</span><div class="nx8-b"><span class="nx8-ic">' + ic(o.icon) + '</span><div><h2>' + o.title + '</h2>' + (o.sub ? '<p>' + o.sub + '</p>' : '') + '</div></div>' +
      '<div class="nx8-a">' + A.btn('primary', o.l, o.bi || 'arrow', { go: o.go, rec: o.rec, qs: o.qs, cls: 'btn-xl' }) + '</div></section>';
  }
  function hello(sub, right) { var c0 = cx(); return '<div class="hi8"><div><h1>' + t(L('Halo, ', 'Hello, ')) + esc(String(c0 && c0.name || A.R().person).split(' ')[0]) + '</h1><p>' + sub + '</p></div>' + (right || '') + '</div>'; }
  function shiftLine(tm) {
    var on = E.onShift(tm), need = E.TEAMS[tm].need, abs = E.teamMembers(tm).filter(function (e) { return E.D.STAFF[e] && E.D.STAFF[e].absent; });
    return '<div class="sh8' + (on.length < need ? ' sh8-warn' : '') + '">' + ic('users') + '<span>' + t(E.TEAMS[tm].short) + ' · ' + on.length + '/' + need + ' ' + t(L('hadir', 'on shift')) + '</span><span class="sh8-av">' + on.map(function (e) { return av(e, 'av8'); }).join('') + '</span>' +
      (abs.length ? '<small>' + t(L('Tidak hadir: ', 'Absent: ')) + abs.map(first).join(', ') + '</small>' : '') + '</div>';
  }
  function chkMini(tab) {
    var r = E.chkToday(cx(), tab); if (!r || !r.list.length) return '';
    var s = r.sum;
    return '<a class="ck8" href="' + href('CHK-001', null, { tab: tab }) + '"><span class="ck8-ic">' + ic('clipboard') + '</span><span class="ck8-b"><b>' + t(L('Checklist shift', 'Shift checklist')) + '</b><small>' + s.done + '/' + s.total + ' ' + t(L('selesai', 'done')) + (s.issue ? ' · ' + s.issue + ' ' + t(L('masalah', 'issue')) : '') + (s.overdue ? ' · ' + s.overdue + ' ' + t(L('terlambat', 'overdue')) : '') + '</small></span><span class="ck8-p"><i style="width:' + s.pct + '%"></i></span>' + ic('chevr') + '</a>';
  }

  /* ADA MASALAH (§81): type → severity → evidence → notes → action. One dialog for every team. */
  function issueDlg(o) {
    o = o || {};
    var stage = o.stage || 'master', reasons = E.REASONS[stage] || E.REASONS.master, tm = team();
    var acts = o.acts || ['continue', 'hold', 'reprocess', 'review', 'maint', 'escalate'].filter(function (k) { return (k !== 'hold' && k !== 'reprocess') || o.batch; });
    var machs = E.state().mach.filter(function (m) { return !o.types || o.types.indexOf(m.type) >= 0; });
    resetPh('iss8');
    dlg({ title: L('Laporkan Masalah', 'Report an Issue'), icon: 'alert', ok: L('KIRIM LAPORAN', 'SEND REPORT'),
      sub: o.batch ? '<b class="mono6">' + esc(o.batch) + '</b> · ' + cname(E.batch(o.batch).cl) : o.mach ? '<b>' + esc(o.mach) + '</b>' : t(L('Supervisor langsung menerima laporan ini.', 'The supervisor receives this report right away.')),
      body: (o.stages ? fld(L('Tahap', 'Stage'), choice('stage', o.stages.map(function (k) { return [k, { wash: L('Washing', 'Washing'), dry: L('Drying', 'Drying'), fin: L('Finishing', 'Finishing'), master: L('Umum', 'General') }[k]]; }), stage), { wide: true }) : '') +
        fld(L('Jenis masalah', 'Issue type'), '<div id="iss8-t">' + choice('type', Object.keys(reasons).map(function (k) { return [k, reasons[k]]; }), o.type || '', { cls: 'ch8-grid' }) + '</div>', { req: true, wide: true }) +
        fld(L('Tingkat keparahan', 'Severity'), choice('sev', Object.keys(E.SEV).map(function (k) { return [k, E.SEV[k][0], null, k === 'crit' || k === 'high' ? 'crit' : k === 'med' ? 'warn' : null]; }), o.sev || 'med'), { req: true, wide: true }) +
        (!o.batch && !o.mach && machs.length ? fld(L('Mesin (jika ada)', 'Machine (if any)'), sel('mach', [['', L('Tidak terkait mesin', 'Not machine related')]].concat(machs.map(function (m) { return [m.id, m.id + ' · ' + T(E.MACH_TYPES[m.type][0])]; })), ''), { wide: true }) : '') +
        fld(L('Bukti foto', 'Photo evidence'), photoIn('iss8', L('Ambil Foto', 'Take Photo')), { wide: true, hint: t(L('Wajib untuk keparahan Kritis.', 'Required for Critical severity.')) }) +
        fld(L('Catatan', 'Notes'), area('note', '', L('Apa yang terjadi?', 'What happened?')), { wide: true, hint: t(L('Wajib untuk Tinggi, Kritis dan Lainnya.', 'Required for High, Critical and Other.')) }) +
        fld(L('Tindakan', 'Action'), choice('action', acts.map(function (k) { return [k, E.ISSUE_ACT[k][0], E.ISSUE_ACT[k][1]]; }), o.action || (o.batch && o.run ? 'maint' : 'review'), { cls: 'ch8-grid' }), { req: true, wide: true }),
      after: function (el) {
        var st = el.querySelectorAll('[name=stage]');
        st.forEach(function (r) { r.addEventListener('change', function () { var rs = E.REASONS[this.value] || E.REASONS.master; el.querySelector('#iss8-t').innerHTML = choice('type', Object.keys(rs).map(function (k) { return [k, rs[k]]; }), '', { cls: 'ch8-grid' }); }); });
      },
      onOk: function (v, el) {
        v = vals(el);
        var r = E.reportIssue(cx(), { stage: v.stage || stage, type: v.type, sev: v.sev, action: v.action, note: v.note, photo: photos('iss8')[0] || null, batch: o.batch || null, mach: o.mach || v.mach || null });
        if (!r.ok) return r.msg;
        after(r.wo ? L('Masalah terkirim. Work order ' + r.wo.id + ' dibuat untuk maintenance.', 'Issue sent. Work order ' + r.wo.id + ' created for maintenance.') : L('Masalah terkirim ke supervisor.', 'Issue sent to the supervisor.'), r.wo ? 'warn' : 'ok');
        if (o.then) o.then(r);
        return true;
      } });
  }
  // Reason dialog for supervisor decisions and controlled overrides.
  function reasonDlg(o) {
    dlg({ title: o.title, icon: o.icon || 'user', sub: o.sub || '', ok: o.ok || L('Simpan', 'Save'),
      body: (o.body || '') + fld(o.label || L('Alasan', 'Reason'), area('reason', '', o.ph || L('Tulis alasan singkat', 'Write a short reason')), { req: true, wide: true }),
      onOk: function (v, el) { v = vals(el); var r = o.fn(v.reason, v); if (!r || !r.ok) return r ? r.msg : E.MSG.invalid; after(o.done || L('Tersimpan.', 'Saved.')); if (o.then) o.then(r); return true; } });
  }
  // Live clock containers redraw on their own; the screen never re-renders under the operator's hand.
  var LIVE = [];
  function live(id, fn, sec) {
    var iv = setInterval(function () { var el = document.getElementById(id); if (!el) { clearInterval(iv); return; } try { E.tick(); el.innerHTML = fn(); } catch (e) { console.error(e); } }, (sec || 5) * 1000);
    LIVE.push(iv);
  }
  window.addEventListener('hashchange', function () { LIVE.forEach(clearInterval); LIVE = []; });
  function runBox(b) {
    var r = b.run; if (!r) return '';
    var end = E.runEnd(b), now = E.now(), start = E.ms(r.start), dur = Math.max(1, end - start), p = Math.max(0, Math.min(100, Math.round((now - start) / dur * 100))), left = Math.round((end - now) / 60000);
    return '<div class="rn8' + (left < 0 ? ' rn8-over' : '') + '"><div class="rn8-r"><span>' + t(L('Mulai', 'Started')) + '</span><b class="num">' + hm(r.start) + '</b></div><div class="rn8-r"><span>' + t(L('Perkiraan selesai', 'Expected finish')) + '</span><b class="num">' + E.hm(end) + '</b></div>' +
      '<div class="rn8-r rn8-big"><span>' + t(left >= 0 ? L('Sisa waktu', 'Time left') : L('Lewat', 'Over')) + '</span><b class="num">' + esc(minT(Math.abs(left))) + '</b></div><div class="rn8-p"><i style="width:' + p + '%"></i></div></div>';
  }
  function utilBar(p, o) { o = o || {}; var tone = p > 100 ? 'crit' : p >= (o.warn || 85) ? 'warn' : p < (o.low || 0) ? 'low' : 'ok'; return '<span class="ub8 ub8-' + tone + '"><i style="width:' + Math.min(100, p) + '%"></i><b class="num">' + p + '%</b></span>'; }
  function freshTag(at) { var f = E.fresh(at); return '<span class="fr7 ' + (f.live ? 'fr7-live' : 'fr7-weak') + '">' + (f.live ? '<i></i>' + t(L('Live · diperbarui ', 'Live · updated ')) + esc(G.agoS(f.age)) : ic('wifioff') + t(L('Data terakhir ', 'Last data ')) + esc(G.agoS(f.age))) + '</span>'; }

  // §88: no offline queue in this build, so production actions pause while the device is offline.
  function net() {
    var off = !navigator.onLine, el = document.getElementById('net8');
    document.body.classList.toggle('off8', off);
    if (off && !el) { el = document.createElement('div'); el.id = 'net8'; el.className = 'net8'; el.setAttribute('role', 'alert'); document.body.appendChild(el); }
    if (el) { el.hidden = !off; el.innerHTML = ic('wifioff') + '<span><b>' + t(L('Tidak ada koneksi.', 'No connection.')) + '</b> ' + t(L('Data belum tersimpan. Tunggu sampai online, lalu ulangi.', 'Nothing is saved yet. Wait until you are online, then try again.')) + '</span>'; }
  }
  window.addEventListener('online', net); window.addEventListener('offline', net); net();

  var P = {
    cx: cx, team: team, me: me, hm: hm, kg: kg, pcs: pcs, cname: cname, pname: pname, emp: emp, first: first, priC: priC, stgC: stgC, slaC: slaC, rcvC: rcvC, srcC: srcC, catC: catC, machC: machC, flagsC: flagsC, teamName: teamName, stIcon: stIcon,
    bLink: bLink, sevC: sevC, whoPick: whoPick, qrow: qrow, qlist: qlist, hero: hero, abar: abar, xl: xl, step8: step8, bigCount: bigCount, nextCard: nextCard, hello: hello, shiftLine: shiftLine, chkMini: chkMini,
    issueDlg: issueDlg, reasonDlg: reasonDlg, live: live, runBox: runBox, utilBar: utilBar, freshTag: freshTag, go: go
  };
  A.P8 = P;

  /* ================= HOM-T1-001 Team 1 Home ================= */
  function t1Next() {
    var R = E.rcvList(cx()), h;
    var rcving = R.filter(function (r) { return ['receiving', 'verified'].indexOf(r.st) >= 0; })[0];
    if (rcving) return { icon: 'inbox', title: cname(rcving.cl) + ' · ' + pname(rcving.prop), sub: esc(rcving.id) + ' · ' + rcving.bags + ' bag · ' + t(E.RCV_ST[rcving.st][0]), l: L('LANJUTKAN RECEIVING', 'CONTINUE RECEIVING'), go: 'PROD-RCV-002', rec: rcving.id };
    var wait = R.filter(function (r) { return r.st === 'waiting'; })[0];
    if (wait) return { icon: 'inbox', title: cname(wait.cl) + ' · ' + pname(wait.prop), sub: esc(wait.id) + ' · ' + wait.bags + ' bag · ' + t(L('tiba ', 'arrived ')) + hm(wait.arrAt), l: L('MULAI RECEIVING', 'START RECEIVING'), go: 'PROD-RCV-002', rec: wait.id };
    var w = R.filter(function (r) { return r.stage === 'wgt'; })[0];
    if (w) return { icon: 'scale', title: cname(w.cl) + ' · ' + pname(w.prop), sub: esc(w.id) + ' · ' + t(L('estimasi ', 'estimate ')) + kg(w.estKg), l: L('TIMBANG SEKARANG', 'WEIGH NOW'), go: 'PROD-WGT-001', rec: w.id };
    var s = R.filter(function (r) { return r.stage === 'sort' && !(r.wdis && r.wdis.review === 'pending'); })[0];
    if (s) return { icon: 'layers', title: cname(s.cl) + ' · ' + pname(s.prop), sub: esc(s.id) + ' · ' + kg(s.weigh && s.weigh.net), l: L('SORTIR SEKARANG', 'SORT NOW'), go: 'PROD-SORT-002', rec: s.id };
    if (E.lotsOpen().length) return { icon: 'grid', title: t(L(E.lotsOpen().length + ' lot siap dibatch', E.lotsOpen().length + ' lots ready for a batch')), sub: t(L('Rekomendasi batch sudah dihitung.', 'Batch recommendations are ready.')), l: L('BUAT BATCH', 'BUILD BATCH'), go: 'PROD-BATCH-001' };
    h = E.batches(['ready'])[0];
    if (h) return { icon: 'swap', title: esc(h.id) + ' · ' + cname(h.cl), sub: kg(h.kg) + ' · ' + esc(h.mach) + ' · ' + t((E.WASH_PROGS[h.prog] || {}).n), l: L('KIRIM KE TEAM 2', 'SEND TO TEAM 2'), go: 'PROD-HO-001' };
    return null;
  }
  V['HOM-T1-001'] = {
    title: function () { return L('Beranda Team 1', 'Team 1 Home'); },
    render: function () {
      var h = E.home('t1'), inc = E.incoming();
      var counts = bigCount([
        { k: L('Manifest menunggu', 'Waiting manifests'), v: h.mfWait, icon: 'truck', go: 'PROD-RCV-001' }, { k: L('Sedang receiving', 'Receiving'), v: h.rcving, icon: 'inbox', go: 'PROD-RCV-001' },
        { k: L('Selisih', 'Differences'), v: h.diff, icon: 'alert', tone: h.diff ? 'crit' : '', go: 'PROD-RCV-001', qs: 'tab=diff' }, { k: L('Menunggu timbang', 'Waiting for weighing'), v: h.wgt, icon: 'scale', go: 'PROD-WGT-001' },
        { k: L('Menunggu sorting', 'Waiting for sorting'), v: h.sort, icon: 'layers', go: 'PROD-SORT-001' }, { k: L('Siap batch / kirim', 'Ready to batch / send'), v: h.ready, icon: 'grid', go: 'PROD-BATCH-001' }
      ]);
      var incList = inc.length ? card(L('Dalam perjalanan ke plant', 'On the way to the plant'), '<ul class="in8">' + inc.map(function (m) { return '<li>' + ic('truck') + '<span><b>' + pname(m.prop) + '</b><small>' + esc(m.mf) + ' · ' + m.bags + ' bag · ' + kg(m.kg) + (m.drv ? ' · ' + first(m.drv) : '') + '</small></span>' + A.chip(m.st === 'arrived' ? 'ok' : 'info', m.st === 'arrived' ? L('Tiba', 'Arrived') : L('Dalam perjalanan', 'In transit')) + '</li>'; }).join('') + '</ul>', { icon: 'route', count: inc.length }) : '';
      return hello(esc(G.day(E.TODAY)) + ' · ' + t(L('Inbound & Persiapan', 'Inbound & Preparation')), shiftLine('t1')) + nextCard(t1Next()) + counts + chkMini('t1') + incList +
        (h.hoOut ? note(t(L(h.hoOut + ' batch menunggu diterima Team 2.', h.hoOut + ' batch(es) waiting for Team 2 to accept.')) + ' ' + lnk('PROD-HO-001', null, t(L('Lihat handover', 'View handover'))), 'swap', 'info') : '');
    }
  };

  /* ================= NP-01 · PROD-RCV-001 Receiving Queue ================= */
  V['PROD-RCV-001'] = {
    render: function (c) {
      var tab = c.q.tab || '', all = E.rcvList(cx()).filter(function (r) { return r.stage === 'rcv' || r.st === 'difference' || (r.rcvAt && r.rcvAt.slice(0, 10) === E.TODAY); });
      var act = all.filter(function (r) { return r.stage === 'rcv'; }), diff = all.filter(function (r) { return r.st === 'difference'; }), done = all.filter(function (r) { return r.st === 'received'; });
      var list = tab === 'diff' ? diff : tab === 'done' ? done : act;
      var rows = list.map(function (r) {
        return '<a class="q8' + (r.st === 'difference' ? ' q8-late' : '') + '" href="' + href('PROD-RCV-002', r.id) + '"><span class="q8-i">' + ic(E.SRC[r.src][1]) + '</span><span class="q8-b"><span class="q8-h"><b class="mono6">' + esc(r.id) + '</b>' + priC(r.pri) + srcC(r.src) + '</span>' +
          '<b class="q8-t">' + cname(r.cl) + '</b><span class="q8-s">' + pname(r.prop) + (r.drv ? ' · ' + t(L('Driver ', 'Driver ')) + first(r.drv) : r.dropBy ? ' · ' + t(r.dropBy) : '') + (r.mf ? ' · <span class="mono6">' + esc(r.mf) + '</span>' : '') + '</span>' +
          '<span class="q8-m"><span>' + ic('package') + '<b class="num">' + r.bags + ' bag</b></span><span>' + ic('scale') + '<b class="num">± ' + kg(r.estKg) + '</b></span><span>' + ic('clock') + t(L('Tiba ', 'Arrived ')) + '<b class="num">' + hm(r.arrAt) + '</b></span></span></span>' +
          '<span class="q8-r">' + rcvC(r) + (r.dis && r.dis.review === 'pending' ? A.chip('appr', L('Review supervisor', 'Supervisor review'), 'user') : '') + ic('chevr', 'q8-go') + '</span></a>';
      });
      var inc = E.incoming();
      return A.pageHead(null, t(L('Cucian yang datang ke plant: manifest pickup, antar klien dan transfer.', 'Laundry arriving at the plant: pickup manifests, client drops and transfers.'))) +
        tabs([['', L('Datang', 'Arriving'), 'inbox', act.length], ['diff', L('Selisih', 'Differences'), 'alert', diff.length], ['done', L('Diterima hari ini', 'Received today'), 'checkc', done.length]], tab, 'tab', { def: '' }) +
        qlist(rows, tab === 'diff' ? L('Tidak ada selisih.', 'No differences.') : L('Belum ada cucian datang.', 'No laundry arriving yet.')) +
        (!tab && inc.length ? card(L('Masih dalam perjalanan (Fase 7)', 'Still on the way (Phase 7)'), '<ul class="in8">' + inc.map(function (m) { return '<li>' + ic('truck') + '<span><b>' + pname(m.prop) + '</b><small>' + esc(m.mf) + ' · ' + m.bags + ' bag · ' + kg(m.kg) + (m.drv ? ' · ' + first(m.drv) : '') + '</small></span>' + A.chip(m.st === 'arrived' ? 'ok' : 'info', m.st === 'arrived' ? L('Tiba, menunggu serah', 'Arrived, waiting for handover') : L('Dalam perjalanan', 'In transit')) + '</li>'; }).join('') + '</ul>', { icon: 'route' }) : '');
    }
  };

  /* ================= NP-01 · PROD-RCV-002 Receiving Detail ================= */
  function rcvHero(r) {
    var o = E.order(r.ord);
    return hero({ id: r.id, icon: E.SRC[r.src][1], title: cname(r.cl), sub: pname(r.prop) + (r.from ? ' · ' + t(r.from) : ''), chips: rcvC(r) + priC(r.pri) + srcC(r.src),
      facts: [[L('Bag dijadwalkan', 'Expected bags'), r.bags + (r.cont ? ' + ' + r.cont + ' ' + T(L('kontainer', 'containers')) : ''), 'num'], [L('Estimasi berat', 'Estimated weight'), kg(r.estKg), 'num'], [L('Tiba', 'Arrived'), hm(r.arrAt), 'num'],
        r.drv ? [L('Driver · kendaraan', 'Driver · vehicle'), first(r.drv) + (r.veh ? ' · ' + esc(r.veh) : '')] : r.dropBy ? [L('Diantar oleh', 'Dropped by'), t(r.dropBy)] : null,
        r.mf ? [L('Manifest · order', 'Manifest · order'), '<span class="mono6">' + esc(r.mf) + (r.ord ? ' · ' + esc(r.ord) : '') + '</span>'] : null, r.cat ? [L('Kategori', 'Category'), esc(r.cat)] : null, o ? [L('Layanan', 'Service'), esc(o.svc || r.svc || '—')] : null],
      extra: T(r.special) ? note(t(r.special), 'info', 'warn') : '' });
  }
  function rcvDecision(r) {
    if (!(r.dis && r.dis.review === 'pending') || !can('prod.spv')) return '';
    return card(L('Keputusan supervisor', 'Supervisor decision'), '<div class="bt8">' + A.btn('blue', L('Setujui Selisih', 'Approve Difference'), 'checkc', { act: 'rev', val: 'approve' }) + A.btn('danger', L('Minta Hitung Ulang', 'Ask for Recount'), 'refresh', { act: 'rev', val: 'reject' }) + '</div>', { icon: 'user', cls: 'card-crit7' });
  }
  function disBox(r) {
    if (!r.dis) return '';
    var d = r.dis;
    return card(L('Selisih tercatat', 'Recorded difference'), kv([[L('Alasan', 'Reason'), d.reasons.map(function (k) { return t(E.DIS_REASONS[k]); }).join(', ')], [L('Bag dihitung', 'Bags counted'), '<b class="num">' + r.act.bags + '</b> / ' + r.bags + ' (' + (d.gap > 0 ? '+' : '') + d.gap + ')'], [L('Catatan', 'Notes'), esc(d.note)], [L('Oleh', 'By'), emp(d.by) + ' · ' + hm(d.at)],
      [L('Review', 'Review'), d.review === 'pending' ? A.chip('appr', L('Menunggu supervisor', 'Waiting for supervisor'), 'hourglass') : d.review === 'approved' ? A.chip('ok', L('Disetujui ', 'Approved ') + E.first(d.revBy)) : d.review === 'rejected' ? A.chip('crit', L('Hitung ulang', 'Recount')) : A.chip('mute', L('Tidak perlu', 'Not needed'))], d.revNote ? [L('Catatan supervisor', 'Supervisor note'), esc(d.revNote)] : null]) + (d.photo ? '<div class="ev8">' + img(d.photo, 'bukti') + '</div>' : ''), { icon: 'alert' });
  }
  V['PROD-RCV-002'] = {
    title: function (rec) { return rec ? L('Receiving ' + rec, 'Receiving ' + rec) : null; },
    render: function (c) {
      var r = E.rcv(c.rec); if (!r) return A.stateCard('empty', L('Data receiving tidak ditemukan.', 'Receiving record not found.'), A.backBtn('blue'));
      var steps = step8([L('Mulai', 'Start'), L('Cek', 'Check'), L('Terima', 'Accept'), L('Timbang', 'Weigh')], r.st === 'waiting' ? 0 : ['receiving'].indexOf(r.st) >= 0 ? 1 : r.st !== 'received' ? 2 : 3);
      var body = '', bar = '';
      if (r.st === 'waiting') { body = whoPick('t1'); bar = abar(xl('primary', L('MULAI RECEIVING', 'START RECEIVING'), 'play', { act: 'start' })); }
      else if (r.st === 'receiving') {
        var a = r.act || { bags: r.bags, cont: r.cont || 0, cond: 'good' };
        resetPh('rcv8');
        body = card(L('Cek cucian', 'Check the laundry'),
          '<div class="cv8">' + '<label class="tg8"><input type="checkbox" name="client"' + (r.chk && r.chk.client ? ' checked' : '') + '><span>' + ic('check') + '<b>' + t(L('Klien sesuai', 'Client matches')) + '</b><small>' + cname(r.cl) + '</small></span></label>' +
          '<label class="tg8"><input type="checkbox" name="prop"' + (r.chk && r.chk.prop ? ' checked' : '') + '><span>' + ic('check') + '<b>' + t(L('Property sesuai', 'Property matches')) + '</b><small>' + pname(r.prop) + '</small></span></label></div>' +
          '<div class="g8-2">' + fld(L('Jumlah bag diterima', 'Bags received'), stepper('bags', a.bags, L('bag', 'bags'), { big: true, max: 99, label: L('Jumlah bag', 'Bag count') }), { hint: t(L('Dijadwalkan: ', 'Expected: ')) + r.bags }) +
          fld(L('Kontainer / troli', 'Containers / trolleys'), stepper('cont', a.cont || 0, null, { big: true, max: 20, label: L('Kontainer', 'Containers') })) + '</div>' +
          fld(L('Kondisi kemasan', 'Package condition'), choice('cond', Object.keys(E.COND).map(function (k) { return [k, E.COND[k][0], null, E.COND[k][1] === 'ok' ? null : E.COND[k][1]]; }), a.cond || 'good', { cls: 'ch8-grid' }), { wide: true }) +
          fld(L('Foto (opsional)', 'Photo (optional)'), photoIn('rcv8', L('Foto Cucian', 'Photo of Laundry')), { wide: true }) + fld(L('Catatan', 'Notes'), inp('notes', r.notes || ''), { wide: true }) + whoPick('t1'), { icon: 'clipboard' });
        bar = abar(xl('primary', L('SESUAI', 'MATCHES'), 'checkc', { act: 'verify' }), xl('danger', L('ADA SELISIH', 'DIFFERENCE'), 'alert', { go: 'PROD-DIS-001', rec: r.id }));
      } else if (r.st === 'verified' || (r.st === 'difference' && r.dis && r.dis.review !== 'pending' && r.dis.review !== 'rejected')) {
        body = (r.st === 'verified' ? A.stateCard('success', L('Jumlah bag dan kondisi sesuai. Terima cucian untuk mulai produksi.', 'Bag count and condition match. Accept the laundry to start production.'), null, L('Sesuai', 'Matches')) : disBox(r) + note(t(L('Selisih sudah tercatat. Cucian bisa diterima; selisih tetap tersimpan di handover.', 'The difference is recorded. The laundry can be accepted; the difference stays on the handover.')), 'info', 'info')) + whoPick('t1', L('Diterima oleh', 'Received by'));
        bar = abar(xl('primary', L('TERIMA CUCIAN', 'ACCEPT LAUNDRY'), 'inbox', { act: 'accept' }));
      } else if (r.st === 'difference') {
        body = disBox(r) + rcvDecision(r) + (r.dis.review === 'pending' ? note(t(E.MSG.review), 'hourglass', 'warn') : note(t(L('Supervisor meminta hitung ulang.', 'The supervisor asked for a recount.')), 'refresh', 'warn'));
      } else {
        var h0 = E.state().ho.filter(function (h) { return h.kind === 'log1' && h.rcv === r.id; })[0];
        body = A.stateCard('success', L('Cucian diterima ' + hm(r.rcvAt) + ' oleh ' + E.first(r.rcvBy) + '. Handover Logistics → Team 1 tercatat.', 'Laundry accepted at ' + hm(r.rcvAt) + ' by ' + E.first(r.rcvBy) + '. The Logistics → Team 1 handover is recorded.'),
          r.stage === 'wgt' ? A.btn('primary', L('Lanjut ke Timbang', 'Go to Weighing'), 'scale', { go: 'PROD-WGT-001', rec: r.id }) : r.stage === 'sort' ? A.btn('primary', L('Lanjut ke Sorting', 'Go to Sorting'), 'layers', { go: 'PROD-SORT-002', rec: r.id }) : '', L('Diterima', 'Received')) +
          (h0 ? card(L('Handover 1 · Logistics → Team 1', 'Handover 1 · Logistics → Team 1'), kv([[L('Pengirim', 'Sender'), h0.sender === 'client' ? t(L('Klien', 'Client')) : emp(h0.sender)], [L('Penerima', 'Receiver'), emp(h0.receiver)], [L('Bag', 'Bags'), h0.bags], [L('Status', 'Status'), A.chip(E.HO_ST[h0.st][1], E.HO_ST[h0.st][0])]]), { icon: 'swap' }) : '') + disBox(r);
      }
      return rcvHero(r) + steps + body + bar;
    },
    act: {
      start: function () { var v = vals(document.getElementById('view')), r = E.rcvStart(cx(), A.S.rec, { op: v.op }); if (!r.ok) return fail(r); after(L('Receiving dimulai.', 'Receiving started.')); },
      verify: function () {
        var v = vals(document.getElementById('view')), r = E.rcvVerify(cx(), A.S.rec, { client: v.client, prop: v.prop, bags: v.bags, cont: v.cont, cond: v.cond, notes: v.notes, photo: photos('rcv8')[0] || null, op: v.op });
        if (!r.ok && r.code === 'mismatch') { A.toast(r.msg, 'warn'); setTimeout(function () { go('PROD-DIS-001', A.S.rec); }, 600); return; }
        if (!r.ok) return fail(r); after(L('Sesuai. Terima cucian untuk mulai produksi.', 'Matches. Accept the laundry to start production.'));
      },
      accept: function () {
        var v = vals(document.getElementById('view')), r = E.rcvAccept(cx(), A.S.rec, { op: v.op }); if (!r.ok) return fail(r);
        go('PROD-WGT-001', A.S.rec); setTimeout(function () { A.toast(L('Cucian diterima. Lanjut timbang.', 'Laundry accepted. Weigh it next.')); }, 300);
      },
      rev: function (el) {
        var dec = el.getAttribute('data-val'), id = A.S.rec;
        reasonDlg({ title: dec === 'approve' ? L('Setujui selisih', 'Approve the difference') : L('Minta hitung ulang', 'Ask for a recount'), sub: '<b class="mono6">' + esc(id) + '</b>', label: L('Catatan keputusan', 'Decision note'), fn: function (note0) { return E.rcvReview(cx(), id, dec, note0); }, done: L('Keputusan tersimpan.', 'Decision saved.') });
      }
    }
  };

  /* ================= NP-02 · PROD-DIS-001 Discrepancy ================= */
  V['PROD-DIS-001'] = {
    title: function (rec) { return rec ? L('Selisih ' + rec, 'Difference ' + rec) : null; },
    render: function (c) {
      var r = E.rcv(c.rec);
      if (!r) {
        var list = E.rcvList(cx()).filter(function (x) { return x.st === 'difference' || (x.wdis && x.wdis.review === 'pending'); });
        return A.pageHead(null, t(L('Semua selisih receiving dan timbang yang belum selesai.', 'All open receiving and weighing differences.'))) + qlist(list.map(function (x) { return '<a class="q8 q8-late" href="' + href(x.st === 'difference' ? 'PROD-RCV-002' : 'PROD-SORT-002', x.id) + '"><span class="q8-i">' + ic('alert') + '</span><span class="q8-b"><span class="q8-h"><b class="mono6">' + esc(x.id) + '</b></span><b class="q8-t">' + cname(x.cl) + '</b><span class="q8-s">' + pname(x.prop) + '</span></span><span class="q8-r">' + rcvC(x) + ic('chevr', 'q8-go') + '</span></a>'; }), L('Tidak ada selisih.', 'No differences.'));
      }
      var cfg = E.cfg(), a = r.act || { bags: r.bags, cond: 'good' };
      resetPh('dis8');
      return rcvHero(r) +
        card(L('Catat selisih', 'Record the difference'),
          fld(L('Alasan selisih', 'Reason for the difference'), '<div class="ch7 ch8-grid">' + Object.keys(E.DIS_REASONS).map(function (k) { return '<label class="ch7-i"><input type="checkbox" data-multi="1" name="reasons" value="' + k + '"' + (k === 'missing' && a.bags < r.bags || k === 'extra' && a.bags > r.bags ? ' checked' : '') + '><span>' + t(E.DIS_REASONS[k]) + '</span></label>'; }).join('') + '</div>', { req: true, wide: true }) +
          '<div class="g8-2">' + fld(L('Bag dihitung', 'Bags counted'), stepper('bags', a.bags, L('bag', 'bags'), { big: true, max: 99, label: L('Bag dihitung', 'Bags counted') }), { hint: t(L('Dijadwalkan: ', 'Expected: ')) + r.bags }) +
          fld(L('Kondisi', 'Condition'), sel('cond', opts(E.COND), a.cond || 'good')) + '</div>' +
          fld(L('Foto bukti', 'Photo evidence'), photoIn('dis8', L('Foto Bukti', 'Photo Evidence'), { big: true }), { req: cfg.disPhoto, wide: true }) +
          fld(L('Catatan', 'Notes'), area('note', '', L('Contoh: bag ke-6 tidak ada di truk', 'Example: bag 6 is not on the truck')), { req: cfg.disNote, wide: true }) + whoPick('t1') +
          note(t(L('Selisih ' + cfg.bagReview + ' bag atau lebih, bag kurang, atau kemasan rusak menunggu keputusan supervisor.', 'A difference of ' + cfg.bagReview + ' bags or more, missing bags or damaged packages wait for the supervisor.')), 'info', 'info'), { icon: 'alert' }) +
        abar(xl('primary', L('SIMPAN SELISIH', 'SAVE DIFFERENCE'), 'check', { act: 'save' }), A.btn('ghost', L('Kembali', 'Back'), 'arrowl', { go: 'PROD-RCV-002', rec: r.id, cls: 'btn-xl' }));
    },
    act: {
      save: function () {
        var v = vals(document.getElementById('view')), id = A.S.rec;
        var r = E.rcvDifference(cx(), id, { reasons: v.reasons || [], bags: v.bags, cond: v.cond, note: v.note, photo: photos('dis8')[0] || null, op: v.op });
        if (!r.ok) return fail(r);
        go('PROD-RCV-002', id); setTimeout(function () { A.toast(r.review ? L('Selisih tersimpan. Menunggu keputusan supervisor.', 'Difference saved. Waiting for the supervisor.') : L('Selisih tersimpan. Cucian bisa diterima.', 'Difference saved. The laundry can be accepted.'), r.review ? 'warn' : 'ok'); }, 300);
      }
    }
  };

  /* ================= NP-02 · PROD-WGT-001 Weighing & Counting ================= */
  function itemGrid(r) {
    var cur = r.items || {};
    return '<div class="it8">' + E.ITEMS.map(function (x) { return '<div class="it8-i"><span class="it8-n">' + ic(x.icon) + '<b>' + t(x.n) + '</b></span>' + stepper('it_' + x.k, cur[x.k] || 0, null, { max: 999, label: x.n }) + '</div>'; }).join('') + '</div>';
  }
  function cmpBox(r, net) {
    var c = E.cfg(), gap = r.estKg ? Math.round((net - r.estKg) / r.estKg * 1000) / 10 : 0, st = Math.abs(gap) >= c.kgReview ? 'crit' : Math.abs(gap) >= c.kgWarn ? 'warn' : 'ok';
    return '<div class="cp8 cp8-' + st + '"><div><span>' + t(L('Estimasi', 'Estimate')) + '</span><b class="num">' + kg(r.estKg) + '</b></div><div><span>' + t(L('Aktual', 'Actual')) + '</span><b class="num">' + (net > 0 ? kg(net) : '—') + '</b></div><div><span>' + t(L('Selisih', 'Difference')) + '</span><b class="num">' + (net > 0 ? (gap > 0 ? '+' : '') + gap + '%' : '—') + '</b></div>' +
      (net > 0 && st !== 'ok' ? '<p>' + ic('alert') + t(st === 'crit' ? L('Selisih besar: isi alasan, supervisor akan mereview sebelum sorting.', 'Large difference: enter a reason, the supervisor reviews it before sorting.') : L('Selisih di atas ' + c.kgWarn + '%: isi alasan selisih.', 'Difference above ' + c.kgWarn + '%: enter the reason.')) + '</p>' : '') + '</div>';
  }
  V['PROD-WGT-001'] = {
    title: function (rec) { return rec ? L('Timbang ' + rec, 'Weigh ' + rec) : null; },
    render: function (c) {
      var r = E.rcv(c.rec);
      if (!r) {
        var list = E.rcvList(cx(), 'wgt');
        return A.pageHead(null, t(L('Cucian yang sudah diterima dan menunggu ditimbang.', 'Accepted laundry waiting to be weighed.'))) +
          qlist(list.map(function (x) { return '<a class="q8" href="' + href('PROD-WGT-001', x.id) + '"><span class="q8-i">' + ic('scale') + '</span><span class="q8-b"><span class="q8-h"><b class="mono6">' + esc(x.id) + '</b>' + priC(x.pri) + '</span><b class="q8-t">' + cname(x.cl) + '</b><span class="q8-s">' + pname(x.prop) + '</span><span class="q8-m"><span>' + ic('package') + '<b class="num">' + x.act.bags + ' bag</b></span><span>' + ic('scale') + '<b class="num">± ' + kg(x.estKg) + '</b></span><span>' + ic('clock') + t(L('Diterima ', 'Accepted ')) + '<b class="num">' + hm(x.rcvAt) + '</b></span></span></span><span class="q8-r">' + ic('chevr', 'q8-go') + '</span></a>'; }), L('Tidak ada cucian menunggu timbang.', 'No laundry waiting for weighing.'));
      }
      if (r.stage !== 'wgt' && !(r.stage === 'sort' && can('prod.weight.override'))) return rcvHero(r) + A.stateCard('success', L('Cucian ini sudah ditimbang: ' + kg(r.weigh && r.weigh.net) + ' bersih.', 'This laundry is weighed already: ' + kg(r.weigh && r.weigh.net) + ' net.'), A.btn('primary', L('Lanjut ke Sorting', 'Go to Sorting'), 'layers', { go: 'PROD-SORT-002', rec: r.id }));
      var w = r.weigh || {}, re = r.stage === 'sort', canOvr = can('prod.weight.override');
      return rcvHero(r) + step8([L('Terima', 'Accept'), L('Timbang', 'Weigh'), L('Sortir', 'Sort'), L('Batch', 'Batch')], 1) +
        card(L('Berat', 'Weight'),
          '<div class="sc8"><button type="button" class="btn btn-blue btn-xl sc8-read" data-act="read">' + ic('scale') + '<span>' + t(L('BACA TIMBANGAN', 'READ SCALE')) + '</span></button>' +
          '<div class="sc8-f">' + fld(L('Berat kotor (kg)', 'Gross weight (kg)'), inp('gross', w.gross || '', { num: true, ph: '0,0' })) + fld(L('Tara (kg)', 'Tare (kg)'), inp('tare', w.tare || '', { num: true, ph: '0,0' })) +
          '<div class="sc8-n"><span>' + t(L('Berat bersih', 'Net weight')) + '</span><b class="num" id="wg8-net">' + (w.net ? kg(w.net) : '—') + '</b></div></div>' +
          '<input type="hidden" name="auto" value=""><div class="g8-2">' + fld(L('Timbangan', 'Scale'), sel('scale', [['SC-01', 'SC-01 · 0–60 kg'], ['SC-02', 'SC-02 · 0–300 kg']], w.scale || (r.estKg > 60 ? 'SC-02' : 'SC-01'))) + fld(L('Satuan', 'Unit'), sel('unit', Object.keys(E.UNITS).map(function (k) { return [k, E.UNITS[k]]; }), 'kg')) + '</div></div>' +
          '<div id="wg8-cmp">' + cmpBox(r, w.net || 0) + '</div>' +
          '<div id="wg8-dis" hidden>' + fld(L('Alasan selisih berat', 'Reason for the weight difference'), inp('disNote', '', { ph: L('Contoh: linen basah', 'Example: wet linen') }), { req: true, wide: true }) + '</div>' +
          '<div id="wg8-man" hidden>' + (canOvr ? fld(L('Alasan ubah manual', 'Reason for the manual change'), inp('reason', '', { ph: L('Contoh: timbangan error, baca ulang', 'Example: scale error, re-read') }), { req: true, wide: true }) : note(t(L('Berat manual perlu izin supervisor. Tekan BACA TIMBANGAN.', 'A manual weight needs supervisor permission. Tap READ SCALE.')), 'lock', 'warn')) + '</div>' +
          (re ? note(t(L('Timbang ulang: berat lama ' + kg(w.net) + ' tetap tercatat di audit.', 'Re-weigh: the old weight ' + kg(w.net) + ' stays in the audit.')), 'history', 'info') : ''), { icon: 'scale' }) +
        card(L('Hitung item', 'Count items'), itemGrid(r) + '<p class="sub5" id="wg8-pcs">' + t(L('Total: ', 'Total: ')) + '<b class="num">' + (r.pcs || 0) + '</b> pcs' + (r.estPcs ? ' · ' + t(L('estimasi ', 'estimate ')) + r.estPcs : '') + '</p>', { icon: 'layers' }) + whoPick('t1') +
        abar(xl('primary', L('SIMPAN TIMBANGAN', 'SAVE WEIGHT'), 'check', { act: 'save' }));
    },
    after: function (c) {
      var r = E.rcv(c.rec), view = document.getElementById('view'); if (!r || !view.querySelector('[name=gross]')) return;
      var c0 = E.cfg();
      function upd() {
        var v = vals(view), g = num(v.gross), tr = num(v.tare) || 0, net = g > 0 ? Math.round((g - tr) * 10) / 10 : 0, rd = E.readScale(r.id);
        view.querySelector('#wg8-net').textContent = net > 0 ? kg(net) : '—';
        view.querySelector('#wg8-cmp').innerHTML = cmpBox(r, net);
        var gap = r.estKg && net > 0 ? Math.abs((net - r.estKg) / r.estKg * 100) : 0;
        view.querySelector('#wg8-dis').hidden = !(gap >= c0.kgWarn) || r.stage === 'sort';
        var manual = net > 0 && (v.auto !== '1' || Math.abs(g - rd.gross) > 0.05 || Math.abs(tr - rd.tare) > 0.05);
        view.querySelector('#wg8-man').hidden = !(manual || r.stage === 'sort');
        var tot = 0; E.ITEMS.forEach(function (x) { tot += +v['it_' + x.k] || 0; });
        view.querySelector('#wg8-pcs').innerHTML = t(L('Total: ', 'Total: ')) + '<b class="num">' + tot + '</b> pcs' + (r.estPcs ? ' · ' + t(L('estimasi ', 'estimate ')) + r.estPcs : '');
      }
      view.addEventListener('input', upd); upd();
    },
    act: {
      read: function () {
        var view = document.getElementById('view'), s = E.readScale(A.S.rec);
        view.querySelector('[name=gross]').value = s.gross; view.querySelector('[name=tare]').value = s.tare; view.querySelector('[name=auto]').value = '1'; view.querySelector('[name=scale]').value = s.scale;
        view.querySelector('[name=gross]').dispatchEvent(new Event('input', { bubbles: true }));
        A.toast(L('Timbangan ' + s.scale + ': ' + s.gross + ' kg', 'Scale ' + s.scale + ': ' + s.gross + ' kg'));
      },
      save: function () {
        var v = vals(document.getElementById('view')), items = {}; E.ITEMS.forEach(function (x) { if (+v['it_' + x.k]) items[x.k] = +v['it_' + x.k]; });
        var r = E.weigh(cx(), A.S.rec, { gross: num(v.gross), tare: num(v.tare) || 0, auto: v.auto === '1', scale: v.scale, unit: v.unit, items: items, disNote: v.disNote, reason: v.reason, op: v.op });
        if (!r.ok) return fail(r);
        var pend = r.rcv.wdis && r.rcv.wdis.review === 'pending';
        go('PROD-SORT-002', A.S.rec); setTimeout(function () { A.toast(pend ? L('Berat tersimpan. Selisih besar menunggu supervisor sebelum sorting.', 'Weight saved. The large difference waits for the supervisor before sorting.') : L('Berat tersimpan: ' + r.rcv.weigh.net + ' kg. Lanjut sortir.', 'Weight saved: ' + r.rcv.weigh.net + ' kg. Sort next.'), pend ? 'warn' : 'ok'); }, 300);
      }
    }
  };

  /* ================= NP-03 · PROD-SORT-001 / 002 Sorting ================= */
  V['PROD-SORT-001'] = {
    render: function () {
      var list = E.rcvList(cx(), 'sort');
      return A.pageHead(null, t(L('Cucian yang sudah ditimbang dan siap dipilah per kategori.', 'Weighed laundry ready to be sorted by category.'))) +
        qlist(list.map(function (x) { var p = x.wdis && x.wdis.review === 'pending'; return '<a class="q8' + (p ? ' q8-risk' : '') + '" href="' + href('PROD-SORT-002', x.id) + '"><span class="q8-i">' + ic('layers') + '</span><span class="q8-b"><span class="q8-h"><b class="mono6">' + esc(x.id) + '</b>' + priC(x.pri) + '</span><b class="q8-t">' + cname(x.cl) + '</b><span class="q8-s">' + pname(x.prop) + '</span><span class="q8-m"><span>' + ic('scale') + '<b class="num">' + kg(x.weigh.net) + '</b></span><span>' + ic('layers') + '<b class="num">' + pcs(x.pcs) + '</b></span></span></span><span class="q8-r">' + (p ? A.chip('appr', L('Review berat', 'Weight review'), 'hourglass') : '') + ic('chevr', 'q8-go') + '</span></a>'; }), L('Tidak ada cucian menunggu sorting.', 'No laundry waiting for sorting.'));
    }
  };
  V['PROD-SORT-002'] = {
    title: function (rec) { return rec ? L('Sortir ' + rec, 'Sort ' + rec) : null; },
    render: function (c) {
      var r = E.rcv(c.rec); if (!r) return A.stateCard('empty', L('Data tidak ditemukan.', 'Record not found.'), A.backBtn('blue'));
      if (r.stage === 'wgt') return rcvHero(r) + A.stateCard('warning', L('Timbang dulu sebelum sortir.', 'Weigh before sorting.'), A.btn('primary', L('Ke Timbang', 'Go to Weighing'), 'scale', { go: 'PROD-WGT-001', rec: r.id }));
      if (r.stage !== 'sort') {
        var lots = E.state().lots.filter(function (l) { return l.rcv === r.id; });
        return rcvHero(r) + A.stateCard('success', L('Sorting selesai: ' + lots.length + ' lot.', 'Sorting done: ' + lots.length + ' lots.'), A.btn('primary', L('Ke Batch Builder', 'Go to Batch Builder'), 'grid', { go: 'PROD-BATCH-001' })) +
          card(L('Lot', 'Lots'), '<ul class="lt8">' + lots.map(function (l) { return '<li>' + catC(l.cat) + '<b class="num">' + kg(l.kg) + '</b><span class="num">' + pcs(l.pcs) + '</span>' + (l.batch ? bLink(l.batch) : A.chip('info', L('Belum dibatch', 'Not batched'))) + '</li>'; }).join('') + '</ul>', { icon: 'layers' });
      }
      var sg = E.suggestSort(r), net = r.weigh.net, pend = r.wdis && r.wdis.review === 'pending';
      var wd = r.wdis ? card(L('Selisih berat', 'Weight difference'), kv([[L('Selisih', 'Difference'), '<b class="num">' + r.wdis.pct + '%</b>'], [L('Alasan', 'Reason'), esc(r.wdis.note)], [L('Review', 'Review'), r.wdis.review === 'pending' ? A.chip('appr', L('Menunggu supervisor', 'Waiting for supervisor'), 'hourglass') : A.chip('ok', E.RCV_ST.verified[0])]]) +
        (pend && can('prod.spv') ? '<div class="bt8">' + A.btn('blue', L('Setujui Berat', 'Approve Weight'), 'checkc', { act: 'wrev', val: 'approve' }) + A.btn('danger', L('Timbang Ulang', 'Re-weigh'), 'refresh', { act: 'wrev', val: 'reject' }) + '</div>' : ''), { icon: 'scale', cls: pend ? 'card-crit7' : '' }) : '';
      if (pend && !can('prod.spv')) return rcvHero(r) + wd + note(t(E.MSG.review), 'hourglass', 'warn');
      var cats = Object.keys(E.CATS).sort(function (a, b) { return (sg.cats[b] ? 1 : 0) - (sg.cats[a] ? 1 : 0); });
      return rcvHero(r) + step8([L('Terima', 'Accept'), L('Timbang', 'Weigh'), L('Sortir', 'Sort'), L('Batch', 'Batch')], 2) + wd +
        note(sg.src === 'client' ? t(L('Saran dari data klien ', 'Suggested from client data ')) + '<b>' + pname(r.prop) + '</b>' + (sg.note ? ' · ' + t(sg.note) : '') : t(L('Saran standar dari kategori layanan.', 'Standard suggestion from the service category.')), 'bulb', 'info') +
        (sg.sep ? note(t(L('Aturan klien: linen ini tidak dicampur dengan klien lain.', 'Client rule: this linen is never mixed with other clients.')), 'lock', 'warn') : '') +
        card(L('Kategori', 'Categories'), '<div class="ct8">' + cats.map(function (k) { var cc = E.CATS[k], v = sg.cats[k] || ''; return '<label class="ct8-i' + (v ? ' is-on' : '') + '"><span class="ct8-h">' + ic(cc.icon) + '<b>' + t(cc.n) + '</b></span><span class="ct8-v"><input name="cat_' + k + '" value="' + esc(v) + '" inputmode="decimal" placeholder="0" aria-label="' + esc(T(cc.n)) + ' kg"><em>kg</em></span><small>' + t((E.WASH_PROGS[cc.wash] || {}).n) + '</small></label>'; }).join('') + '</div>' +
          '<div class="tt8" id="st8-tot"></div>', { icon: 'layers' }) +
        card(L('Tandai', 'Flags'), '<div class="ch7 ch8-grid">' + Object.keys(E.FLAGS).map(function (k) { var f = E.FLAGS[k]; return '<label class="ch7-i ch7-' + (f[1] === 'crit' ? 'crit' : f[1] === 'warn' ? 'warn' : 'ok') + '"><input type="checkbox" data-multi="1" name="flags" value="' + k + '"' + (sg.flags.indexOf(k) >= 0 ? ' checked' : '') + '><span>' + ic(f[2]) + t(f[0]) + '</span></label>'; }).join('') + '</div>', { icon: 'flag' }) + whoPick('t1') +
        abar(xl('primary', L('SELESAI SORTIR', 'SORTING DONE'), 'checkc', { act: 'done' }));
    },
    after: function (c) {
      var r = E.rcv(c.rec), view = document.getElementById('view'), box = view.querySelector('#st8-tot'); if (!r || !box) return;
      var net = r.weigh.net, tol = Math.max(0.5, net * E.cfg().sortTol / 100);
      function upd() {
        var tot = 0; view.querySelectorAll('[name^=cat_]').forEach(function (f) { var n = num(f.value) || 0; tot += n; f.closest('.ct8-i').classList.toggle('is-on', n > 0); });
        tot = Math.round(tot * 10) / 10; var ok = Math.abs(tot - net) <= tol;
        box.className = 'tt8 ' + (ok ? 'tt8-ok' : 'tt8-bad'); box.innerHTML = ic(ok ? 'checkc' : 'alert') + '<span>' + t(L('Total ', 'Total ')) + '<b class="num">' + kg(tot) + '</b> / ' + kg(net) + (ok ? '' : ' · ' + t(L('harus sama dengan berat bersih', 'must equal the net weight'))) + '</span>';
      }
      view.addEventListener('input', upd); upd();
    },
    act: {
      done: function () {
        var v = vals(document.getElementById('view')), cats = {}; Object.keys(E.CATS).forEach(function (k) { var n = num(v['cat_' + k]); if (n > 0) cats[k] = n; });
        var r = E.sortDone(cx(), A.S.rec, { cats: cats, flags: v.flags || [], op: v.op }); if (!r.ok) return fail(r);
        go('PROD-BATCH-001'); setTimeout(function () { A.toast(L('Sorting selesai: ' + r.lots.length + ' lot siap dibatch.', 'Sorting done: ' + r.lots.length + ' lots ready for a batch.')); }, 300);
      },
      wrev: function (el) { var dec = el.getAttribute('data-val'), id = A.S.rec; reasonDlg({ title: dec === 'approve' ? L('Setujui berat', 'Approve the weight') : L('Minta timbang ulang', 'Ask for a re-weigh'), label: L('Catatan keputusan', 'Decision note'), fn: function (n0) { return E.wdisReview(cx(), id, dec, n0); }, then: function () { if (dec !== 'approve') go('PROD-WGT-001', id); } }); }
    }
  };

  /* ================= NP-04 · PROD-BATCH-001 Batch Builder ================= */
  function vBox(v) {
    return '<ul class="cv7">' + v.blocks.map(function (b) { return '<li class="cv7-b">' + ic('xc') + t(b[1]) + '</li>'; }).join('') + v.warns.map(function (w) { return '<li class="cv7-w">' + ic('alert') + t(w[1]) + '</li>'; }).join('') + (!v.blocks.length && !v.warns.length ? '<li class="cv7-ok">' + ic('checkc') + t(L('Kapasitas, kategori dan SLA aman.', 'Capacity, category and SLA are fine.')) + '</li>' : '') + '</ul>';
  }
  function recCard(g, i) {
    var m = E.machine(g.mach), cl = g.lots.map(function (id) { return E.lot(id); });
    return '<section class="card rc8' + (g.blocks.length ? ' rc8-b' : g.warns.length ? ' rc8-w' : '') + '"><div class="rc8-h">' + catC(g.cat) + '<b>' + cname(g.cl) + (cl.some(function (l) { return l.cl !== g.cl; }) ? ' + ' + t(L('klien lain', 'other clients')) : '') + '</b>' + (cl.some(function (l) { return l.sep; }) ? A.chip('appr', L('Dipisah', 'Separate'), 'lock') : '') + '</div>' +
      '<div class="rc8-f"><div><span>' + t(L('Berat', 'Weight')) + '</span><b class="num">' + kg(g.kg) + '</b></div><div><span>' + t(L('Mesin', 'Machine')) + '</span><b>' + esc(g.mach || '—') + (m ? ' · ' + m.cap + ' kg' : '') + '</b></div><div><span>' + t(L('Utilisasi', 'Utilisation')) + '</span>' + utilBar(g.util, { low: E.cfg().under }) + '</div>' +
      '<div><span>' + t(L('Program', 'Program')) + '</span><b>' + t((E.WASH_PROGS[g.prog] || {}).n) + '</b></div><div><span>' + t(L('Durasi · selesai', 'Duration · finish')) + '</span><b class="num">' + g.dur + ' ' + t(L('mnt', 'min')) + ' · ' + hm(g.finish) + '</b></div><div><span>SLA</span><b class="num">' + hm(g.sla) + '</b></div></div>' +
      '<p class="rc8-l">' + cl.map(function (l) { return '<span class="mono6">' + esc(l.id) + '</span> ' + pname(l.prop) + ' · ' + kg(l.kg); }).join('<br>') + '</p>' + vBox(g) +
      '<div class="rc8-a">' + A.btn('ghost', L('Ubah', 'Adjust'), 'edit', { act: 'manual', val: String(i) }) + (g.blocks.length ? '' : A.btn('primary', L('BUAT BATCH', 'CREATE BATCH'), 'check', { act: 'create', val: String(i) })) + '</div></section>';
  }
  function batchDlg(pre) {
    var lots = E.lotsOpen(), ws = E.washers();
    pre = pre || {};
    function check(el) { var v = vals(el), f = { lots: v.lots || [], mach: v.mach, prog: v.prog }; var r = E.validate(f); el.querySelector('#bt8-v').innerHTML = '<p class="sub5">' + kg(r.kg) + ' · ' + r.util + '%</p>' + vBox(r); el.querySelector('#bt8-r').hidden = !r.warns.length; }
    dlg({ title: L('Atur batch', 'Set up a batch'), icon: 'grid', ok: L('BUAT BATCH', 'CREATE BATCH'),
      body: fld(L('Lot', 'Lots'), '<div class="ch7 lt8-p">' + lots.map(function (l) { return '<label class="ch7-i"><input type="checkbox" data-multi="1" name="lots" value="' + l.id + '"' + ((pre.lots || []).indexOf(l.id) >= 0 ? ' checked' : '') + '><span>' + catC(l.cat) + ' <b class="num">' + kg(l.kg) + '</b> · ' + pname(l.prop) + (l.sep ? ' ' + ic('lock') : '') + '</span></label>'; }).join('') + '</div>', { req: true, wide: true }) +
        '<div class="f6-g">' + fld(L('Mesin cuci', 'Washer'), sel('mach', ws.map(function (m) { return [m.id, m.id + ' · ' + m.cap + ' kg · ' + T(E.MACH_ST[m.st][0]) + (m.batch ? ' (' + m.batch + ')' : '')]; }), pre.mach || ''), { req: true }) +
        fld(L('Program', 'Program'), sel('prog', Object.keys(E.WASH_PROGS).map(function (k) { return [k, T(E.WASH_PROGS[k].n) + ' · ' + E.WASH_PROGS[k].min + ' mnt']; }), pre.prog || ''), { req: true }) + '</div>' +
        '<div id="bt8-v" aria-live="polite"></div><div id="bt8-r" hidden>' + fld(can('prod.spv') ? L('Alasan / override supervisor', 'Reason / supervisor override') : L('Alasan (wajib bila ada peringatan)', 'Reason (required with warnings)'), inp('reason', ''), { req: true, wide: true }) + '</div>',
      after: function (el) { check(el); el.addEventListener('change', function () { check(el); }); },
      onOk: function (v, el) { v = vals(el); var r = E.createBatch(cx(), { lots: v.lots || [], mach: v.mach, prog: v.prog, reason: v.reason }); if (!r.ok) return r.msg; after(L('Batch ' + r.batch.id + ' dibuat. Kirim ke Team 2 saat siap.', 'Batch ' + r.batch.id + ' created. Send it to Team 2 when ready.')); return true; } });
  }
  V['PROD-BATCH-001'] = {
    render: function () {
      var rec = E.recommend(), ready = E.batches(['ready']), lots = E.lotsOpen();
      var head = A.pageHead(null, t(L('Rekomendasi batch dari lot yang sudah disortir: kategori cocok, mesin pas, SLA paling dekat dulu.', 'Batch recommendations from sorted lots: compatible categories, the best machine fit, nearest SLA first.')), lots.length ? A.btn('ghost', L('Atur Manual', 'Set Up Manually'), 'edit', { act: 'manual' }) : '');
      var machs = '<div class="mc8">' + E.washers().map(function (m) { var b = m.batch ? E.batch(m.batch) : null; return '<div class="mc8-i mc8-' + m.st + '"><b>' + esc(m.id) + '</b><span class="num">' + m.cap + ' kg</span>' + machC(m) + (b && b.run ? '<small>' + t(L('selesai ', 'done ')) + E.hm(E.runEnd(b)) + '</small>' : '') + '</div>'; }).join('') + '</div>';
      return head + card(L('Mesin cuci', 'Washers'), machs, { icon: 'washer' }) +
        (rec.length ? '<h2 class="h8">' + ic('bulb') + t(L('Rekomendasi', 'Recommendations')) + ' <span class="cnt num">' + rec.length + '</span></h2><div class="rc8l">' + rec.map(recCard).join('') + '</div>' : A.stateCard('empty', L('Belum ada lot siap dibatch. Selesaikan sorting dulu.', 'No lots ready for a batch. Finish sorting first.'), A.btn('ghost', L('Ke Sorting', 'Go to Sorting'), 'layers', { go: 'PROD-SORT-001' }))) +
        card(L('Batch siap · kirim ke Team 2', 'Ready batches · send to Team 2'), qlist(ready.map(function (b) { return qrow(b, null, { meta: '<span>' + ic('washer') + '<b>' + esc(b.mach) + '</b> · ' + t((E.WASH_PROGS[b.prog] || {}).n) + '</span>', right: A.pbtn('prod.ho12', 'primary', L('KIRIM KE TEAM 2', 'SEND TO TEAM 2'), 'swap', { act: 'send', val: b.id, cls: 'btn-sm' }) }); }), L('Belum ada batch siap.', 'No ready batch yet.')), { icon: 'swap', count: ready.length, link: ['PROD-HO-001', L('Handover', 'Handover')] });
    },
    act: {
      create: function (el) {
        var g = E.recommend()[+el.getAttribute('data-val')]; if (!g) return;
        if (g.warns.length) { batchDlg({ lots: g.lots, mach: g.mach, prog: g.prog }); return; }
        var r = E.createBatch(cx(), { lots: g.lots, mach: g.mach, prog: g.prog }); if (!r.ok) return fail(r);
        after(L('Batch ' + r.batch.id + ' dibuat di ' + r.batch.mach + '.', 'Batch ' + r.batch.id + ' created on ' + r.batch.mach + '.'));
      },
      manual: function (el) { var i = el.getAttribute('data-val'), g = i != null ? E.recommend()[+i] : null; batchDlg(g ? { lots: g.lots, mach: g.mach, prog: g.prog } : {}); },
      send: function (el) { var r = E.send(cx(), el.getAttribute('data-val')); if (!r.ok) return fail(r); after(L('Dikirim ke Team 2. Menunggu TERIMA HANDOVER.', 'Sent to Team 2. Waiting for TERIMA HANDOVER.')); }
    }
  };

  /* ================= Handover screens (§43): one pattern, three plant handovers ================= */
  function hoRow(h, o) {
    var b = E.batch(h.batch), k = E.HO_KIND[h.kind], x = E.HO_ST[h.st];
    return '<section class="card ho8 ho8-' + h.st + '"><div class="ho8-h"><span class="ho8-n">' + k.no + '</span><div><b class="mono6">' + esc(h.batch || h.rcv) + '</b> ' + priC(h.pri) + '<span class="sub5">' + cname(h.cl) + ' · ' + pname(h.prop) + '</span></div>' + A.chip(x[1], x[0]) + '</div>' +
      '<div class="ho8-f"><div><span>' + t(L('Berat', 'Weight')) + '</span><b class="num">' + kg(h.kg) + '</b></div><div><span>' + t(L('Jumlah', 'Quantity')) + '</span><b class="num">' + pcs(h.qty) + '</b></div>' + (h.bags ? '<div><span>' + t(L('Paket / bag', 'Packages / bags')) + '</span><b class="num">' + h.bags + '</b></div>' : '') +
      '<div><span>' + t(L('Dikirim', 'Sent')) + '</span><b>' + first(h.sender) + ' · ' + hm(h.at) + '</b></div>' + (h.recAt ? '<div><span>' + t(L('Diterima', 'Received')) + '</span><b>' + first(h.receiver) + ' · ' + hm(h.recAt) + '</b></div>' : '') + (b ? '<div><span>SLA</span>' + slaC(b) + '</div>' : '') + '</div>' +
      (h.note ? note(esc(h.note), 'message', 'info') : '') + ((h.issues || []).length ? note(t(L('Masalah terbuka: ', 'Open issues: ')) + h.issues.map(esc).join(', '), 'alert', 'warn') : '') +
      (h.diff ? note(t(L('Selisih: ', 'Difference: ')) + [h.diff.qty ? (h.diff.qty > 0 ? '+' : '') + h.diff.qty + ' pcs' : '', h.diff.kg ? (h.diff.kg > 0 ? '+' : '') + h.diff.kg + ' kg' : '', h.diff.bags ? (h.diff.bags > 0 ? '+' : '') + h.diff.bags + ' bag' : ''].filter(Boolean).join(' · ') + ' · ' + esc(h.diff.note), 'alert', 'crit') : '') +
      (o && o.actions ? '<div class="ho8-a">' + o.actions + '</div>' : '') + '</section>';
  }
  function hoScreen(kind) {
    var k = E.HO_KIND[kind], c0 = cx();
    return {
      render: function () {
        var send = E.canSend(c0, kind) ? E.batches([k.send]).filter(function (b) { return kind !== 't3log' || b.rtdAt; }) : [];
        var wait = E.hoList(c0, kind).filter(function (h) { return h.st === 'waiting'; }), diff = E.hoList(c0, kind).filter(function (h) { return h.st === 'difference'; });
        var done = E.hoList(c0, kind).filter(function (h) { return ['accepted', 'resolved', 'returned'].indexOf(h.st) >= 0 && h.recAt && h.recAt.slice(0, 10) === E.TODAY; }).slice(0, 8);
        var recv = wait.filter(function (h) { return E.canReceive(c0, h); });
        var flow = '<div class="hf8">' + [k.from, k.to].map(function (x, i) { return '<span class="hf8-t' + (E.teamOf(c0) === x ? ' is-me' : '') + '">' + ic(stIcon(x)) + '<b>' + teamName(x) + '</b></span>' + (i === 0 ? ic('arrow', 'hf8-a') : ''); }).join('') + '</div>';
        var out = send.length ? card(kind === 't3log' ? L('Siap diserahkan ke Logistics', 'Ready to hand over to Logistics') : L('Siap dikirim', 'Ready to send'), qlist(send.map(function (b) { return qrow(b, null, { right: A.btn('primary', kind === 't1t2' ? L('KIRIM KE TEAM 2', 'SEND TO TEAM 2') : kind === 't2t3' ? L('KIRIM KE TEAM 3', 'SEND TO TEAM 3') : L('SERAHKAN KE LOGISTICS', 'HAND OVER TO LOGISTICS'), 'swap', { act: 'send', val: b.id, cls: 'btn-sm' }), meta: kind === 't3log' && b.pack ? '<span>' + ic('package') + '<b class="num">' + b.pack.pkgs.length + '</b> ' + t(L('paket', 'packages')) + '</span>' : '' }); }), ''), { icon: 'arrow', count: send.length }) : '';
        var inc = card(L('Menunggu diterima', 'Waiting to be accepted'), wait.length ? wait.map(function (h) { var mine = E.canReceive(c0, h); return hoRow(h, { actions: mine ? A.btn('danger', L('ADA SELISIH', 'DIFFERENCE'), 'alert', { act: 'diff', val: h.id }) + A.btn('primary', kind === 't3log' ? L('TERIMA PAKET', 'ACCEPT PACKAGES') : L('TERIMA HANDOVER', 'ACCEPT HANDOVER'), 'checkc', { act: 'accept', val: h.id, cls: 'btn-xl' }) : '<span class="sub5">' + ic('hourglass') + t(L('Menunggu ', 'Waiting for ')) + teamName(k.to) + '</span>' }); }).join('') : A.empty(L('Tidak ada handover menunggu.', 'No handover waiting.')), { icon: 'inbox', count: wait.length });
        var dif = diff.length ? card(L('Selisih · keputusan supervisor', 'Differences · supervisor decision'), diff.map(function (h) { return hoRow(h, { actions: can('prod.spv') ? A.btn('danger', L('Kembalikan', 'Return'), 'arrowl', { act: 'resolve', val: h.id + '|return' }) + A.btn('blue', L('Terima Selisih', 'Accept Difference'), 'checkc', { act: 'resolve', val: h.id + '|accept' }) : note(t(E.MSG.review), 'hourglass', 'warn') }); }).join(''), { icon: 'alert', cls: 'card-crit7' }) : '';
        var hist = done.length ? card(L('Selesai hari ini', 'Completed today'), '<ul class="hh8">' + done.map(function (h) { return '<li>' + A.chip(E.HO_ST[h.st][1], E.HO_ST[h.st][0]) + '<b class="mono6">' + esc(h.batch) + '</b><span>' + cname(h.cl) + '</span><span class="num">' + kg(h.kg) + '</span><small>' + first(h.sender) + ' → ' + first(h.receiver) + ' · ' + hm(h.recAt) + '</small></li>'; }).join('') + '</ul>', { icon: 'history' }) : '';
        var order = recv.length ? inc + out : out + inc;
        return A.pageHead(null, flow) + order + dif + hist;
      },
      act: {
        send: function (el) {
          var id = el.getAttribute('data-val'), b = E.batch(id);
          resetPh('ho8');
          dlg({ title: kind === 't3log' ? L('Serahkan ke Logistics', 'Hand over to Logistics') : L('Kirim ke ' + T(E.TEAMS[k.to].short), 'Send to ' + E.TEAMS[k.to].short[1]), icon: 'swap', ok: kind === 't3log' ? L('SERAHKAN', 'HAND OVER') : L('KIRIM', 'SEND'),
            sub: '<b class="mono6">' + esc(id) + '</b> · ' + cname(b.cl) + ' · ' + kg(b.kg) + ' · ' + pcs(kind === 't3log' ? E.packedQty(b) : (b.finQty || b.pcs)),
            body: fld(L('Kondisi', 'Condition'), choice('cond', [['good', E.COND.good[0]], ['wet', E.COND.wet[0]], ['damaged', E.COND.damaged[0]]], 'good'), { wide: true }) + fld(L('Catatan (opsional)', 'Notes (optional)'), inp('note', ''), { wide: true }) + fld(L('Foto (opsional)', 'Photo (optional)'), photoIn('ho8'), { wide: true }) + whoPick(k.from === 'log' ? 't3' : k.from),
            onOk: function (v, el2) { v = vals(el2); var r = E.send(cx(), id, { cond: v.cond, note: v.note, photo: photos('ho8')[0] || null, op: v.op }); if (!r.ok) return r.msg; after(L('Dikirim. Menunggu ' + T(E.TEAMS[k.to] ? E.TEAMS[k.to].short : L('Logistics')) + ' menerima.', 'Sent. Waiting for ' + (E.TEAMS[k.to] ? E.TEAMS[k.to].short[1] : 'Logistics') + ' to accept.')); return true; } });
        },
        accept: function (el) {
          var r = E.accept(cx(), el.getAttribute('data-val'), {}); if (!r.ok) return fail(r);
          after(kind === 't3log' ? (r.delivery ? L('Paket diterima Logistics. Delivery ' + r.delivery.order.id + ' lanjut di Fase 7.', 'Packages accepted by Logistics. Delivery ' + r.delivery.order.id + ' continues in Phase 7.') : L('Paket diterima Logistics.', 'Packages accepted by Logistics.')) : L('Handover diterima. Batch masuk antrian tim Anda.', 'Handover accepted. The batch joins your team queue.'));
        },
        diff: function (el) {
          var h = E.ho(el.getAttribute('data-val'));
          resetPh('hod8');
          dlg({ title: L('Ada selisih di handover', 'Difference on the handover'), icon: 'alert', ok: L('KIRIM KE SUPERVISOR', 'SEND TO SUPERVISOR'), sub: '<b class="mono6">' + esc(h.batch) + '</b> · ' + kg(h.kg) + ' · ' + pcs(h.qty),
            body: '<div class="f6-g">' + fld(L('Jumlah dihitung (pcs)', 'Counted quantity (pcs)'), inp('qty', h.qty, { num: true })) + fld(L('Berat (kg)', 'Weight (kg)'), inp('kg', h.kg, { num: true })) + (h.bags ? fld(L('Paket / bag', 'Packages / bags'), inp('bags', h.bags, { num: true })) : '') + '</div>' +
              fld(L('Alasan', 'Reason'), choice('reason', [['count', L('Jumlah beda', 'Count differs')], ['weight', L('Berat beda', 'Weight differs')], ['cond', L('Kondisi', 'Condition')], ['wrong', L('Batch salah', 'Wrong batch')], ['other', L('Lainnya', 'Other')]], '', { cls: 'ch8-grid' }), { req: true, wide: true }) +
              fld(L('Catatan', 'Notes'), area('note', ''), { req: true, wide: true }) + fld(L('Foto', 'Photo'), photoIn('hod8'), { wide: true }),
            onOk: function (v, el2) { v = vals(el2); var r = E.hoDiff(cx(), h.id, { qty: v.qty, kg: v.kg, bags: v.bags, reason: v.reason, note: v.note, photo: photos('hod8')[0] || null }); if (!r.ok) return r.msg; after(L('Selisih dikirim ke supervisor.', 'Difference sent to the supervisor.'), 'warn'); return true; } });
        },
        resolve: function (el) {
          var p = el.getAttribute('data-val').split('|');
          reasonDlg({ title: p[1] === 'return' ? L('Kembalikan ke pengirim', 'Return to the sender') : L('Terima dengan selisih', 'Accept with the difference'), label: L('Catatan keputusan', 'Decision note'), fn: function (n0) { return E.hoResolve(cx(), p[0], p[1], n0); } });
        }
      }
    };
  }
  // The screen object is built per call so the signed-in context is always current.
  ['PROD-HO-001', 'PROD-HO-002', 'PROD-HO-003'].forEach(function (id, i) {
    var kind = ['t1t2', 't2t3', 't3log'][i], act = {};
    ['send', 'accept', 'diff', 'resolve'].forEach(function (k) { act[k] = function (el, e) { return hoScreen(kind).act[k](el, e); }; });
    V[id] = { render: function (c) { return hoScreen(kind).render(c); }, act: act };
  });

  /* ================= PROD-ISSUE-002 Team Issues (ADA MASALAH) ================= */
  function issueCard(i, o) {
    var x = E.ISSUE_ST[i.st] || E.ISSUE_ST.open, rs = (E.REASONS[i.stage] || {})[i.type] || E.REASONS.master[i.type] || L(i.type, i.type);
    return '<section class="card is8 is8-' + i.sev + (i.st === 'resolved' ? ' is-done' : '') + '"><div class="is8-h">' + sevC(i.sev) + '<b>' + t(rs) + '</b>' + A.chip(x[1], x[0]) + '<span class="sub5 num">' + esc(i.id) + ' · ' + G.when(i.at) + '</span></div>' +
      '<p>' + esc(i.note || '') + '</p><div class="is8-m">' + (i.batch ? '<span>' + ic('package') + bLink(i.batch) + '</span>' : '') + (i.rcv ? '<span>' + ic('inbox') + lnk('PROD-RCV-002', i.rcv, esc(i.rcv)) + '</span>' : '') + (i.mach ? '<span>' + ic('washer') + lnk('MNT-003', i.mach, esc(i.mach)) + '</span>' : '') + (i.wo ? '<span>' + ic('wrench') + lnk('MNT-006', i.wo, esc(i.wo)) + '</span>' : '') +
      '<span>' + ic('user') + first(i.by) + '</span>' + (i.team ? '<span>' + ic(stIcon(i.team)) + teamName(i.team) + '</span>' : '') + (i.action ? '<span>' + ic(E.ISSUE_ACT[i.action] ? E.ISSUE_ACT[i.action][1] : 'flag') + t(E.ISSUE_ACT[i.action] ? E.ISSUE_ACT[i.action][0] : i.action) + '</span>' : '') + '</div>' +
      (i.ev ? '<div class="ev8">' + img(i.ev, 'bukti') + '</div>' : '') + (i.res ? note(t(L('Selesai: ', 'Resolved: ')) + esc(i.res) + ' · ' + first(i.resBy), 'checkc', 'ok') : '') +
      (o && o.manage && i.st !== 'resolved' ? '<div class="ho8-a">' + A.btn('blue', L('Tandai Selesai', 'Mark Resolved'), 'checkc', { act: 'resolve', val: i.id, cls: 'btn-sm' }) + '</div>' : '') + '</section>';
  }
  var STAGES_OF = { t1: ['master'], t2: ['wash', 'dry', 'master'], t3: ['fin', 'master'], mnt: ['master'], log: ['master'], all: ['master', 'wash', 'dry', 'fin'] };
  V['PROD-ISSUE-002'] = {
    render: function (c) {
      var tm = team(), tab = c.q.tab || 'open', all = E.issueList(cx()), list = all.filter(function (i) { return tab === 'all' || i.st !== 'resolved'; });
      return A.pageHead(null, t(L('Laporkan masalah ke supervisor dengan satu tombol. Masalah tim Anda tampil di sini.', 'Report a problem to the supervisor with one button. Your team\'s issues show here.')), A.pbtn('prod.issue', 'primary', L('ADA MASALAH', 'REPORT ISSUE'), 'alert', { act: 'new' })) +
        tabs([['open', L('Terbuka', 'Open'), 'alert', all.filter(function (i) { return i.st !== 'resolved'; }).length], ['all', L('Semua', 'All'), 'list', all.length]], tab, 'tab', { def: 'open' }) +
        (list.length ? list.map(function (i) { return issueCard(i, { manage: can('prod.issue.manage') }); }).join('') : A.empty(L('Tidak ada masalah terbuka.', 'No open issue.'))) + (tm && tm !== 'all' ? '' : '');
    },
    act: {
      new: function () { var tm = team(); issueDlg({ stages: STAGES_OF[tm] || ['master'], stage: (STAGES_OF[tm] || ['master'])[0] }); },
      resolve: function (el) { var id = el.getAttribute('data-val'); reasonDlg({ title: L('Selesaikan masalah', 'Resolve the issue'), sub: esc(id), label: L('Penyelesaian', 'Resolution'), fn: function (n0) { return E.resolveIssue(cx(), id, n0); } }); }
    }
  };
  P.issueCard = issueCard; P.STAGES_OF = STAGES_OF;

  /* ================= PROD-HIS-001 Team History ================= */
  var EVN = { rcv: [L('Diterima', 'Received'), 'inbox'], wgt: [L('Ditimbang', 'Weighed'), 'scale'], sort: [L('Disortir', 'Sorted'), 'layers'], 'ho.t1t2': [L('Handover T1 → T2', 'Handover T1 → T2'), 'swap'], 'wash.end': [L('Cuci selesai', 'Wash done'), 'droplet'], 'dry.end': [L('Kering selesai', 'Dry done'), 'wind'],
    'ho.t2t3.sent': [L('Dikirim ke Team 3', 'Sent to Team 3'), 'swap'], 'fin.end': [L('Finishing selesai', 'Finishing done'), 'iron'], qc: [L('QC lulus', 'QC passed'), 'checkc'], 'qc.fail': [L('QC ada masalah', 'QC issue'), 'alert'], packed: [L('Packing selesai', 'Packed'), 'package'], rtd: [L('Siap kirim', 'Ready to deliver'), 'truck'], 'ho.t2t3': [L('Diterima dari Team 2', 'Accepted from Team 2'), 'swap'], 'ho.t3log.sent': [L('Diserahkan ke Logistics', 'Handed to Logistics'), 'truck'], batch: [L('Batch dibuat', 'Batch created'), 'grid'] };
  V['PROD-HIS-001'] = {
    render: function (c) {
      var tm = team(), sel0 = tm === 'all' ? (c.q.t || 't2') : tm, rows = E.teamHistory(sel0);
      return A.pageHead(null, t(L('Pekerjaan tim yang selesai hari ini, terbaru di atas.', 'The team\'s finished work today, newest first.'))) +
        (tm === 'all' ? tabs([['t1', L('Team 1', 'Team 1'), 'basket'], ['t2', L('Team 2', 'Team 2'), 'droplet'], ['t3', L('Team 3', 'Team 3'), 'shirt']], sel0, 't', { def: 't2' }) : '') +
        (rows.length ? card(L('Hari ini', 'Today'), '<ol class="tl8">' + rows.map(function (x) { var e = EVN[x.k] || [L(x.k, x.k), 'check'], ref = x.batch || x.rcv, o = x.b || x.r; return '<li><span class="tl8-t num">' + hm(x.at) + '</span><span class="tl8-ic">' + ic(e[1]) + '</span><span class="tl8-b"><b>' + t(e[0]) + '</b> · ' + (x.batch ? bLink(x.batch) : lnk('PROD-RCV-002', x.rcv, '<span class="mono6">' + esc(x.rcv) + '</span>')) + '<small>' + (o ? cname(o.cl) + ' · ' : '') + first(x.by) + '</small></span></li>'; }).join('') + '</ol>', { icon: 'history', count: rows.length }) : A.empty(L('Belum ada pekerjaan selesai hari ini.', 'No finished work today yet.')));
    }
  };
})();
