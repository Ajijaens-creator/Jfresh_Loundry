/* JFRESH OS — screens: role homes, frontline flows, supervisor & manager operations.
   Every screen reuses one of the 9 archetypes (T01–T09); IDs match jfos-config.js. */
(function () {
  var A = window.JFAPP, C = window.JFOS, DB = window.JFDB, V = A.V;
  var T = A.T, L = A.L, t = A.t, esc = A.esc, ic = A.ic, can = A.can, fmt = A.fmt, href = A.href;
  function S() { return A.S; }
  function orders(stage) { return A.db().orders.filter(function (o) { return !stage || o.stage === stage; }); }
  function bySla(a, b) { return (b.sub === 'running') - (a.sub === 'running') || a.dueAt - b.dueAt; }
  function urgent(o) { return o.dueAt - A.now() <= 36e5; }
  function active() { return A.db().orders.filter(function (o) { return o.stage !== 'done'; }); }
  function val(id) { var el = document.getElementById(id); return el ? el.value.trim() : ''; }
  function setErr(k, msg) { var e = document.getElementById('e-' + k); if (e) e.textContent = msg ? T(msg) : ''; var f = document.getElementById('f-' + k); if (f) { f.setAttribute('aria-invalid', msg ? 'true' : 'false'); if (msg) f.closest('.fld').classList.add('bad'); else f.closest('.fld').classList.remove('bad'); } }
  function errSummary(list) {
    var box = document.getElementById('errs'); if (!box) return;
    box.innerHTML = list.length ? '<div class="bnr crit" role="alert">' + ic('alert') + '<span>' + list.map(function (x) { return t(x); }).join(' ') + '</span></div>' : '';
  }

  /* ---------- Shared pieces for frontline ---------- */
  var STAGE_SCREENS = {
    pickup: { q: 'OPS-PKP-002', a: 'OPS-PKP-001', p: 'ops.pickup' },
    receive: { q: 'OPS-RCV-002', a: 'OPS-RCV-001', p: 'ops.receive' },
    sort: { q: 'OPS-SRT-002', a: 'OPS-SRT-001', p: 'ops.sort' },
    wash: { q: 'OPS-WSH-002', a: 'OPS-WSH-001', p: 'ops.wash' },
    qc: { q: 'OPS-QC-002', a: 'OPS-QC-001', p: 'ops.qc' },
    pack: { q: 'OPS-PAC-002', a: 'OPS-PAC-001', p: 'ops.pack' },
    deliver: { q: 'OPS-DLV-002', a: 'OPS-DLV-001', p: 'ops.deliver' }
  };
  A.STAGE_SCREENS = STAGE_SCREENS;
  function statusLabel(o) {
    if (o.hold) return L('Review Supervisor', 'Supervisor Review');
    if (o.stage === 'wash' && o.sub === 'running') return L('Sedang Dicuci', 'Washing');
    if (o.stage === 'pickup' && o.sub === 'started') return L('Sedang Pickup', 'Picking Up');
    if (o.stage === 'deliver' && o.sub === 'onway') return L('Dalam Perjalanan', 'On the Way');
    if (o.stage === 'deliver' && o.sub === 'handed') return L('Diserahkan', 'Handed Over');
    return A.stage(o.stage).wait;
  }
  function statusTone(o) { return o.hold ? 'crit' : o.sub ? 'appr' : o.stage === 'done' ? 'ok' : 'warn'; }
  A.statusLabel = statusLabel; A.statusTone = statusTone;
  function qcard(o, target) {
    var go = o.hold ? href('OPS-TRK-001', o.id) : href(target, o.id);
    var meta = ['#' + o.id, o.kg != null ? fmt.kg(o.kg) : '± ' + fmt.kg(o.estKg), o.bags + ' bag', T(A.typeL(o.type))];
    return '<a class="qc' + (urgent(o) ? ' qc-u' : '') + '" href="' + go + '"><span class="qc-ic st-' + o.stage + '">' + ic(A.stage(o.stage).i) + '</span>' +
      '<span class="qc-b"><b>' + esc(A.cname(o.cl)) + '</b><span class="qc-m">' + esc(meta.join(' · ')) + '</span>' +
      '<span class="qc-c">' + A.chip(statusTone(o), statusLabel(o), o.hold ? 'alert' : o.sub ? 'play' : 'clock') + (o.rewash ? A.chip('crit', L('Rewash ' + o.rewash + 'x', 'Rewash ' + o.rewash + 'x'), 'refresh') : '') + A.slaChip(o.dueAt) + '</span></span>' + ic('chevr', 'qc-go') + '</a>';
  }
  A.qcard = qcard;
  function statusBar(o, extra) {
    var sl = A.slaInfo(o.dueAt);
    return '<div class="sbar"><div class="sbar-s ' + statusTone(o) + '">' + ic(o.sub ? 'play' : 'clock') + '<span><b>' + t(statusLabel(o)) + '</b><small>' + t(L('Dibuat', 'Created')) + ': ' + esc(fmt.when(o.createdAt)) + '</small></span></div>' +
      '<div class="sbar-l ' + sl.tone + '" data-sla>' + ic(sl.icon) + '<span><b>SLA</b><small data-due-t>' + esc(sl.txt) + '</small></span></div>' + (extra || '') + '</div>';
  }
  function notFound() { return A.stateCard('empty', L('Data tidak ditemukan. Kembali ke daftar.', 'Record not found. Back to the list.'), A.backBtn()); }
  function alreadyDone(s, o) {
    var next = o && STAGE_SCREENS[o.stage] && can(STAGE_SCREENS[o.stage].p) ? A.btn('primary', L('Buka tahap berikutnya', 'Open next step'), 'arrow', { go: STAGE_SCREENS[o.stage].a, rec: o.id }) : '';
    return A.stateCard('empty', s.emp, next + A.backBtn('ghost'), L('Sudah selesai', 'Already done'));
  }
  function fld(k, label, input, o) {
    o = o || {};
    return '<label class="fld' + (o.big ? ' fld-big' : '') + (o.cls ? ' ' + o.cls : '') + '"><span class="fld-l">' + t(label) + (o.req ? ' <i>*</i>' : '') + (o.from ? ' <small class="from">' + ic('link') + t(o.from) + '</small>' : '') + '</span>' + input + '<span class="fld-e" id="e-' + k + '" aria-live="polite"></span></label>';
  }
  function numIn(k, v, unit, o) {
    o = o || {};
    return '<span class="fld-in' + (o.step ? ' has-step' : '') + '">' + (o.step ? '<button type="button" class="stepb" data-act="step" data-val="' + k + '|-1" aria-label="−">' + ic('minus') + '</button>' : '') +
      '<input id="f-' + k + '" inputmode="' + (o.int ? 'numeric' : 'decimal') + '" value="' + esc(v == null ? '' : v) + '" placeholder="' + esc(o.ph || '0') + '" autocomplete="off">' +
      (unit ? '<em>' + esc(unit) + '</em>' : '') + (o.step ? '<button type="button" class="stepb" data-act="step" data-val="' + k + '|1" aria-label="+">' + ic('plus') + '</button>' : '') + '</span>';
  }
  function selIn(k, opts, v) { return '<span class="fld-in"><select id="f-' + k + '">' + opts.map(function (op) { return '<option value="' + esc(op[0]) + '"' + (op[0] === v ? ' selected' : '') + '>' + t(op[1]) + '</option>'; }).join('') + '</select></span>'; }
  function txtIn(k, v, ph, area) { return '<span class="fld-in">' + (area ? '<textarea id="f-' + k + '" rows="2" placeholder="' + t(ph || L('', '')) + '">' + esc(v || '') + '</textarea>' : '<input id="f-' + k + '" value="' + esc(v || '') + '" placeholder="' + t(ph || L('', '')) + '">') + '</span>'; }
  A.fld = fld; A.numIn = numIn; A.selIn = selIn; A.txtIn = txtIn; A.val = val; A.setErr = setErr; A.errSummary = errSummary;
  function photo(k, label) { return '<button type="button" class="photo" data-act="photo" id="ph-' + k + '"><span class="photo-im">' + ic('camera') + '</span><span>' + t(label || L('Tambah Foto (opsional)', 'Add Photo (optional)')) + '</span></button>'; }
  A.photo = photo;
  function actionBar(pri, sec) { return '<div class="abar"><div id="errs"></div><div class="abar-b">' + pri + (sec || '') + '</div></div>'; }
  A.actionBar = actionBar;
  var TYPE_OPTS = Object.keys(DB.TYPES).map(function (k) { return [k, DB.TYPES[k]]; });
  function stepNum(el) {
    var p = el.getAttribute('data-val').split('|'), f = document.getElementById('f-' + p[0]);
    var v = parseInt(f.value || '0', 10) + parseInt(p[1], 10); f.value = Math.max(0, v);
  }
  function togglePhoto(el) { el.classList.toggle('on'); el.querySelector('span:last-child').textContent = el.classList.contains('on') ? T(L('Foto ditambahkan ✓', 'Photo added ✓')) : T(L('Tambah Foto (opsional)', 'Add Photo (optional)')); }
  var COMMON_ACT = { step: stepNum, photo: togglePhoto };
  A.COMMON_ACT = COMMON_ACT;
  function acts(o) { return Object.assign({}, COMMON_ACT, o); }
  function actionHead(s, o, title) {
    return A.pageHead(title || s.n, esc(A.cname(o.cl)) + ' · ' + t(L('Order', 'Order')) + ' #' + esc(o.id)) + '<div class="hide-m">' + A.stepper(o.stage) + '</div>' + statusBar(o);
  }
  function infoGrid(items) { return '<div class="ig">' + items.map(function (x) { return '<div class="ig-i"><small>' + t(x[0]) + '</small><b>' + x[1] + '</b></div>'; }).join('') + '</div>'; }
  A.infoGrid = infoGrid;
  function noteBox(o) { return o.note ? '<div class="note-b">' + ic('message') + '<span><small>' + t(L('Catatan dari klien', 'Note from client')) + '</small>' + esc(o.note) + '</span></div>' : ''; }

  /* ================= T01 ROLE HOMES ================= */
  V['HOM-OPR-001'] = {
    render: function () {
      var r = A.R(), wait = orders('receive'), proc = active().filter(function (o) { return ['sort', 'wash', 'qc', 'pack'].indexOf(o.stage) >= 0; });
      var iss = A.db().issues.filter(function (i) { return i.status === 'open'; }), late = active().filter(function (o) { return o.dueAt < A.now(); });
      var queues = ['receive', 'sort', 'wash', 'qc', 'pack'].filter(function (k) { return can(STAGE_SCREENS[k].p); });
      return '<div class="hello"><h1>' + t(A.greet()) + ', ' + esc(r.person) + '</h1><p>' + t(r.title) + ' · ' + esc(r.site) + '</p></div>' +
        A.attn([
          { v: wait.length, k: L('Cucian Menunggu', 'Loads Waiting'), icon: 'basket', tone: 'info', go: 'OPS-RCV-002' },
          { v: proc.length, k: L('Sedang Diproses', 'In Process'), icon: 'washer', tone: 'info', go: 'OPS-TSK-001' },
          { v: iss.length, k: L('Ada Masalah', 'Issues'), icon: 'alert', tone: iss.length ? 'warn' : 'ok', go: 'OPS-ISS-001' },
          { v: late.length, k: L('Terlambat', 'Late'), icon: 'clock', tone: late.length ? 'crit' : 'ok', go: 'OPS-TSK-001' }
        ]) +
        (can('ops.receive') ? '<a class="cta" href="' + href('OPS-RCV-002') + '"><span class="cta-ic">' + ic('scale') + '</span><span class="cta-t"><b>' + t(L('Terima Cucian', 'Receive Laundry')) + '</b><small>' + t(L(wait.length + ' cucian menunggu · pilih lalu timbang', wait.length + ' loads waiting · pick, then weigh')) + '</small></span>' + ic('arrow') + '</a>' : '') +
        A.section(L('Tugas Saya Hari Ini', 'My Tasks Today'), '<div class="rls">' + queues.map(function (k) {
          var n = orders(k).length, u = orders(k).filter(urgent).length;
          return A.rowLink({ href: href(STAGE_SCREENS[k].q), icon: A.stage(k).i, t: t(C.screen(STAGE_SCREENS[k].q).n), s: u ? t(L(u + ' mendesak', u + ' urgent')) : t(L('Tidak ada yang mendesak', 'Nothing urgent')), n: n, tone: u ? 'warn' : '' });
        }).join('') + '</div>', { icon: 'clipboard', link: ['OPS-TSK-001', L('Lihat Tugas', 'View Tasks')] });
    }
  };
  V['HOM-DRV-001'] = {
    render: function () {
      var r = A.R(), pk = orders('pickup').sort(function (a, b) { return a.pickupAt - b.pickupAt; }), dl = orders('deliver').sort(bySla);
      var next = pk[0] ? { o: pk[0], kind: 'pickup' } : dl[0] ? { o: dl[0], kind: 'deliver' } : null;
      var nx = '';
      if (next) {
        var o = next.o, pr = DB.prop(o.prop), isP = next.kind === 'pickup';
        nx = '<section class="next"><span class="next-k">' + ic(isP ? 'package' : 'truck') + t(isP ? L('Stop berikutnya · Pickup', 'Next stop · Pickup') : L('Stop berikutnya · Pengiriman', 'Next stop · Delivery')) + '</span>' +
          '<h2>' + esc(A.cname(o.cl)) + '</h2><p>' + ic('pin') + esc(pr.n) + '</p>' +
          '<div class="next-m"><span><small>' + t(L('Jadwal', 'Scheduled')) + '</small><b class="num">' + fmt.time(isP ? o.pickupAt : o.deliverAt) + '</b></span><span><small>' + t(L('Bag', 'Bags')) + '</small><b class="num">' + o.bags + '</b></span>' + (isP && o.pickupAt < A.now() ? A.chip('warn', L('Terlambat ' + fmt.dur(A.now() - o.pickupAt).s, 'Late ' + fmt.dur(A.now() - o.pickupAt).s), 'clock') : '') + '</div>' +
          A.btn('primary', isP ? L('Mulai Pickup', 'Start Pickup') : L('Mulai Pengiriman', 'Start Delivery'), 'play', { go: isP ? 'OPS-PKP-001' : 'OPS-DLV-001', rec: o.id, cls: 'w100' }) + '</section>';
      }
      return '<div class="hello"><h1>' + t(L('Halo', 'Hello')) + ', ' + esc(r.person) + '</h1><p>' + t(L('Armada', 'Vehicle')) + ' ' + esc(r.site.replace('Armada ', '')) + ' · ' + esc(fmt.date(A.now())) + '</p></div>' +
        A.attn([
          { v: pk.length, k: L('Pickup Tersisa', 'Pickups Left'), icon: 'package', tone: 'info', go: 'OPS-PKP-002' },
          { v: dl.length, k: L('Pengiriman Tersisa', 'Deliveries Left'), icon: 'truck', tone: 'info', go: 'OPS-DLV-002' },
          { v: pk.filter(function (o) { return o.pickupAt < A.now(); }).length, k: L('Terlambat', 'Late'), icon: 'clock', tone: pk.some(function (o) { return o.pickupAt < A.now(); }) ? 'crit' : 'ok', go: 'LOG-RTE-001' }
        ]) + (nx || A.empty(C.screen('HOM-DRV-001').emp)) +
        '<div class="row2">' + A.btn('ghost', L('Lihat Rute', 'View Route'), 'route', { go: 'LOG-RTE-001' }) + A.btn('ghost', L('Ada Masalah', 'Report Issue'), 'alert', { go: 'OPS-ISS-001' }) + '</div>';
    }
  };
  function stageCounts() {
    return C.STAGES.filter(function (s) { return s.k !== 'done'; }).map(function (s) { return { k: s.k, l: s.l, v: orders(s.k).length, icon: s.i }; });
  }
  V['HOM-SPV-001'] = {
    render: function () {
      var act = active(), wait = act.filter(function (o) { return o.stage === 'receive' || o.stage === 'sort'; }), risk = act.filter(urgent).sort(bySla);
      var rew = act.filter(function (o) { return o.rewash; }), iss = A.db().issues.filter(function (i) { return i.status === 'open' || i.status === 'review'; });
      var sc = stageCounts().filter(function (x) { return x.k !== 'pickup' && x.k !== 'deliver'; }), mx = Math.max.apply(null, sc.map(function (x) { return x.v; }));
      sc.forEach(function (x) { x.hi = x.v === mx; x.go = STAGE_SCREENS[x.k].q; });
      var team = A.db().staff.filter(function (s) { return s.present && s.st !== 'driver'; });
      return A.pageHead(L('Hari Ini', 'Today'), esc(fmt.date(A.now())) + ' · Plant Denpasar', A.pbtn('qlt.review', 'primary', L('Tinjau Masalah', 'Review Issues'), 'alert', { go: 'QLT-ISS-001' }) + A.pbtn('ops.board', 'ghost', L('Lihat Papan', 'Open Board'), 'grid', { go: 'OPS-BRD-001' })) +
        A.attn([
          { v: act.length, k: L('Total Beban Kerja', 'Total Workload'), icon: 'layers', tone: 'info', go: 'OPS-BRD-001' },
          { v: wait.length, k: L('Menunggu', 'Waiting'), icon: 'hourglass', tone: 'info', go: 'OPS-RCV-002' },
          { v: risk.length, k: L('Risiko SLA', 'SLA Risk'), icon: 'clock', tone: risk.length ? 'crit' : 'ok', go: 'SLA-MON-001' },
          { v: rew.length, k: L('Rewash', 'Rewash'), icon: 'refresh', tone: rew.length ? 'warn' : 'ok', go: 'QLT-ISS-001' }
        ].concat(A.aprCount() ? [{ v: A.aprCount(), k: L('Menunggu Persetujuan', 'Awaiting Approval'), icon: 'filecheck', tone: 'warn', go: 'APR-INB-001' }] : [])) +
        '<div class="grid2">' +
        A.section(L('Bottleneck', 'Bottleneck'), '<p class="hint">' + t(L('Tahap dengan antrian terbesar disorot.', 'The stage with the longest queue is highlighted.')) + '</p>' + A.hbars(sc), { icon: 'factory' }) +
        A.section(L('SLA Berisiko', 'SLA at Risk'), risk.length ? '<div class="qcs">' + risk.slice(0, 4).map(function (o) { return qcard(o, 'OPS-TRK-001'); }).join('') + '</div>' : A.empty(L('Semua order on-time.', 'All orders on time.')), { icon: 'clock', count: risk.length, link: ['SLA-MON-001', L('Semua', 'All')] }) +
        A.section(L('Masalah Terbuka', 'Open Issues'), iss.length ? '<div class="rls">' + iss.slice(0, 4).map(function (i) {
          var rs = C.ISSUE_REASONS.filter(function (x) { return x.k === i.reason; })[0];
          return A.rowLink({ href: href('QLT-ISS-002', i.id), icon: 'alert', t: t(rs.l) + ' · ' + esc(A.cname(DB.order(i.ord).cl)), s: esc(i.by + ' · ' + fmt.ago(i.at)), tone: i.reason === 'lost' || i.reason === 'damage' ? 'crit' : 'warn', chip: i.status === 'review' ? A.chip('crit', L('Review', 'Review'), 'alert') : '' });
        }).join('') + '</div>' : A.empty(L('Tidak ada masalah terbuka.', 'No open issues.')), { icon: 'alert', count: iss.length, link: ['QLT-ISS-001', L('Semua', 'All')] }) +
        A.section(L('Tugas Tim', 'Team Tasks'), '<div class="team">' + team.map(function (s) { return '<span class="tm"><span class="av sm">' + esc(s.n.charAt(0)) + '</span><b>' + esc(s.n) + '</b><small>' + t(A.stage(s.st).l) + '</small></span>'; }).join('') + '</div>', { icon: 'users', count: team.length, link: ['OPS-TEAM-001', L('Atur', 'Manage')] }) +
        '</div>';
    }
  };
  function series14(base, amp, seed) { var out = []; for (var i = 13; i >= 0; i--) { var d = new Date(A.now() - i * 864e5); out.push({ l: d.getDate() + '/' + (d.getMonth() + 1), v: Math.round(base + amp * Math.sin((i + seed) * 1.3) + amp * 0.5 * Math.cos(i * 0.7)) }); } return out; }
  A.series14 = series14;
  function onTime() { var done = orders('done'); var ok = done.filter(function (o) { return o.deliveredAt <= o.dueAt; }).length; return done.length ? ok / done.length * 100 : 100; }
  A.onTime = onTime;
  function alerts() {
    var out = [], act = active(), late = act.filter(function (o) { return o.dueAt < A.now(); }), risk = act.filter(function (o) { return o.dueAt >= A.now() && urgent(o); });
    if (late.length) out.push({ tone: 'crit', icon: 'alert', t: L(late.length + ' order terlambat', late.length + ' orders late'), go: 'SLA-MON-001' });
    if (risk.length) out.push({ tone: 'warn', icon: 'clock', t: L(risk.length + ' order SLA tersisa ≤ 1 jam', risk.length + ' orders with ≤ 1 h SLA left'), go: 'SLA-MON-001' });
    var low = A.db().stock.filter(function (s) { return s.qty < s.min; });
    if (low.length && can('inv.view')) out.push({ tone: 'warn', icon: 'package', t: L(low.length + ' item stok di bawah minimum', low.length + ' stock items below minimum'), go: 'INV-STK-001' });
    var apr = A.aprCount(); if (apr) out.push({ tone: 'info', icon: 'filecheck', t: L(apr + ' permintaan menunggu persetujuan Anda', apr + ' requests awaiting your approval'), go: 'APR-INB-001' });
    var q = orders('qc').length; if (q >= 4) out.push({ tone: 'info', icon: 'shield', t: L(q + ' cucian menunggu QC', q + ' loads waiting for QC'), go: 'OPS-BRD-001' });
    return out;
  }
  A.alerts = alerts;
  function alertList(list) {
    return list.length ? '<div class="alerts">' + list.map(function (a) { return '<a class="al al-' + a.tone + '" href="' + href(a.go) + '">' + ic(a.icon) + '<span>' + t(a.t) + '</span><em>' + t(a.tone === 'crit' ? L('Kritis', 'Critical') : a.tone === 'warn' ? L('Peringatan', 'Warning') : L('Info', 'Info')) + '</em>' + ic('chevr') + '</a>'; }).join('') + '</div>' : A.empty(L('Tidak ada alert.', 'No alerts.'));
  }
  A.alertList = alertList;
  V['HOM-MGR-001'] = {
    render: function () {
      var vol = series14(1180, 120, 2), today = vol[vol.length - 1].v, ot = onTime(), act = active();
      var rew = A.db().orders.filter(function (o) { return o.rewash; }).length / A.db().orders.length * 100;
      var veh = A.db().vehicles.filter(function (v) { return v.status === 'active'; }).length;
      return A.pageHead(L('Operasional', 'Operations'), t(L('Semua plant', 'All plants')) + ' · ' + esc(fmt.date(A.now())), A.pbtn('apr.view', 'primary', L('Buka Persetujuan', 'Open Approvals'), 'filecheck', { go: 'APR-INB-001' }) + A.pbtn('sla.view', 'ghost', L('Lihat SLA', 'View SLA'), 'clock', { go: 'SLA-MON-001' })) +
        A.attn([
          { v: fmt.num(today, 0), u: 'kg', k: L('Volume Hari Ini', 'Volume Today'), icon: 'weight', tone: 'info', d: '+4%', dt: 'up', go: 'RPT-OPS-001' },
          { v: fmt.num(ot, 1) + '%', k: L('On-time SLA', 'On-time SLA'), icon: 'clock', tone: ot < 95 ? 'warn' : 'ok', d: T(L('target 95%', 'target 95%')), go: 'SLA-MON-001' },
          { v: fmt.num(rew, 1) + '%', k: L('Rewash Rate', 'Rewash Rate'), icon: 'refresh', tone: rew > 3 ? 'warn' : 'ok', go: 'QLT-DSH-001' },
          { v: veh + '/' + A.db().vehicles.length, k: L('Armada Aktif', 'Active Fleet'), icon: 'truck', tone: 'info', go: 'LOG-FLT-001' }
        ]) +
        '<div class="grid2">' +
        A.section(L('Alert', 'Alerts'), alertList(alerts()), { icon: 'bell' }) +
        A.section(L('Order Aktif per Tahap', 'Active Orders by Stage'), A.hbars(stageCounts().map(function (x) { x.go = 'OPS-BRD-001'; x.qs = 'stage=' + x.k; return x; })), { icon: 'factory', count: act.length, link: ['OPS-BRD-001', L('Papan', 'Board')] }) +
        '</div>' +
        A.section(L('Volume 14 Hari (kg)', '14-day Volume (kg)'), '<div class="lazy" data-lazy="vol"></div>', { icon: 'chart', link: ['RPT-OPS-001', L('Laporan', 'Report')] });
    },
    after: function () { lazy('vol', function () { var d = series14(1180, 120, 2); d[d.length - 1].hi = true; return A.barChart(d, { label: 'Volume', fmt: function (v) { return fmt.num(v, 0) + ' kg'; } }); }); }
  };
  function lazy(k, fn) { setTimeout(function () { var el = document.querySelector('[data-lazy="' + k + '"]'); if (el) el.innerHTML = fn(); }, 350); }
  A.lazy = lazy;

  /* ================= T02 WORK QUEUES ================= */
  function queueScreen(id, stageKey, target, o) {
    o = o || {};
    V[id] = {
      render: function () {
        var rows = (o.rows ? o.rows() : orders(stageKey)).slice().sort(o.sort || bySla);
        var tab = S().q.tab === 'u' ? 'u' : 'all', urg = rows.filter(urgent);
        var shown = tab === 'u' ? urg : rows;
        var tabs = '<div class="tabs" role="tablist"><a role="tab" href="' + href(id, null, {}) + '" aria-selected="' + (tab === 'all') + '">' + t(L('Semua', 'All')) + ' <b>' + rows.length + '</b></a>' +
          '<a role="tab" href="' + href(id, null, { tab: 'u' }) + '" aria-selected="' + (tab === 'u') + '">' + t(L('Mendesak', 'Urgent')) + ' <b>' + urg.length + '</b></a></div>';
        var first = rows.filter(function (r) { return !r.hold; })[0];
        var aside = first ? '<aside class="qa hide-m hide-t"><div class="card"><div class="card-h"><h2>' + ic('target') + '<span>' + t(L('Prioritas Berikutnya', 'Next Priority')) + '</span></h2></div>' +
          '<b class="qa-n">' + esc(A.cname(first.cl)) + '</b><p class="qa-m">#' + esc(first.id) + '</p>' + infoGrid([[L('Berat', 'Weight'), first.kg != null ? fmt.kg(first.kg) : '± ' + fmt.kg(first.estKg)], [L('Bag', 'Bags'), first.bags], [L('Jenis', 'Type'), t(A.typeL(first.type))], [L('SLA', 'SLA'), A.slaChip(first.dueAt)]]) +
          A.btn('primary', o.cta || C.screen(target).n, 'arrow', { go: target, rec: first.id, cls: 'w100' }) + '</div></aside>' : '';
        return A.pageHead(null, t(L(rows.length + ' antrian', rows.length + ' in queue')) + (urg.length ? ' · ' + t(L(urg.length + ' mendesak', urg.length + ' urgent')) : '')) +
          '<div class="qwrap"><div class="qmain">' + tabs + (shown.length ? '<div class="qcs">' + shown.map(function (r) { return qcard(r, target); }).join('') + '</div>' : A.empty(C.screen(id).emp)) + '</div>' + aside + '</div>';
      }
    };
  }
  queueScreen('OPS-RCV-002', 'receive', 'OPS-RCV-001', { cta: L('Terima Cucian', 'Receive Laundry') });
  queueScreen('OPS-SRT-002', 'sort', 'OPS-SRT-001', { cta: L('Mulai Sorting', 'Start Sorting') });
  queueScreen('OPS-WSH-002', 'wash', 'OPS-WSH-001', { cta: L('Buka Batch', 'Open Batch') });
  queueScreen('OPS-QC-002', 'qc', 'OPS-QC-001', { cta: L('Cek QC', 'Check QC') });
  queueScreen('OPS-PAC-002', 'pack', 'OPS-PAC-001', { cta: L('Packing', 'Pack') });
  queueScreen('OPS-PKP-002', 'pickup', 'OPS-PKP-001', { cta: L('Mulai Pickup', 'Start Pickup'), sort: function (a, b) { return a.pickupAt - b.pickupAt; } });
  queueScreen('OPS-DLV-002', 'deliver', 'OPS-DLV-001', { cta: L('Mulai Pengiriman', 'Start Delivery') });

  V['OPS-TSK-001'] = {
    render: function () {
      var ks = ['receive', 'sort', 'wash', 'qc', 'pack'].filter(function (k) { return can(STAGE_SCREENS[k].p); });
      return A.pageHead(null, t(L('Pilih antrian untuk mulai bekerja.', 'Pick a queue to start working.'))) + '<div class="tasks">' + ks.map(function (k) {
        var rows = orders(k), u = rows.filter(urgent).length, sc = C.screen(STAGE_SCREENS[k].q);
        return '<a class="tk' + (u ? ' tk-u' : '') + '" href="' + href(sc.id) + '"><span class="tk-ic st-' + k + '">' + ic(A.stage(k).i) + '</span><span class="tk-n num">' + rows.length + '</span><span class="tk-t"><b>' + t(sc.n) + '</b><small>' + (u ? t(L(u + ' mendesak', u + ' urgent')) : t(L('Tidak ada yang mendesak', 'Nothing urgent'))) + '</small></span>' + ic('chevr') + '</a>';
      }).join('') + '</div>';
    }
  };

  /* ================= T04 QUICK ACTIONS ================= */
  function guard(ctx, stageKey) {
    var o = DB.order(ctx.rec);
    if (!o && !ctx.rec) { var first = orders(stageKey).sort(bySla)[0]; if (first) { A.S.rec = first.id; o = first; } }
    if (!o) return { html: notFound() };
    if (o.stage !== stageKey) return { html: alreadyDone(ctx.s, o) };
    return { o: o };
  }
  var pendingDiff = null;
  V['OPS-RCV-001'] = {
    render: function (ctx) {
      var g = guard(ctx, 'receive'); if (g.html) return g.html; var o = g.o, s = ctx.s;
      pendingDiff = null;
      return actionHead(s, o) +
        '<section class="card"><div class="card-h"><h2>' + ic('scale') + '<span>' + t(L('Informasi Cucian', 'Laundry Information')) + '</span></h2></div>' +
        '<div class="fgrid f3">' +
        fld('kg', L('Berat Total', 'Total Weight'), numIn('kg', '', 'kg', { ph: '0,0' }), { big: true, req: true }) +
        fld('bags', L('Jumlah Bag', 'Bag Count'), numIn('bags', o.bags, '', { int: true, step: true }), { big: true, req: true, from: L('dari pickup', 'from pickup') }) +
        fld('type', L('Jenis Cucian', 'Laundry Type'), selIn('type', TYPE_OPTS, o.type), { big: true, from: L('dari pickup', 'from pickup') }) +
        '</div><p class="hint">' + ic('scale') + t(L('Perkiraan saat pickup', 'Estimate at pickup')) + ': <b>' + fmt.kg(o.estKg) + '</b></p>' +
        '<div class="fgrid f2">' + noteBox(o) + photo('rcv') + '</div><div id="diffbox"></div></section>' +
        actionBar(A.btn('primary', L('Terima Cucian', 'Receive Laundry'), 'check', { act: 'ok', id: 'cta' }), A.pbtn('ops.issue', 'outline', L('Ada Masalah', 'Report Issue'), 'alert', { go: 'OPS-ISS-001', qs: 'ord=' + o.id }));
    },
    after: function () { var f = document.getElementById('f-kg'); if (f && A.mode() !== 'm') f.focus(); },
    act: acts({
      ok: function (el) {
        var o = DB.order(A.S.rec), s = C.screen('OPS-RCV-001'), raw = val('f-kg').replace(',', '.'), kg = parseFloat(raw), bags = parseInt(val('f-bags'), 10), errs = [];
        setErr('kg'); setErr('bags');
        if (!raw) { setErr('kg', s.v[0]); errs.push(s.v[0]); } else if (!(kg > 0)) { setErr('kg', s.v[1]); errs.push(s.v[1]); }
        if (!(bags > 0)) { setErr('bags', s.v[2]); errs.push(s.v[2]); }
        errSummary(errs); if (errs.length) { document.getElementById(raw && kg > 0 ? 'f-bags' : 'f-kg').focus(); return; }
        var diff = Math.abs(kg - o.estKg) / o.estKg;
        if (diff > 0.05 && pendingDiff !== kg) {
          pendingDiff = kg;
          document.getElementById('diffbox').innerHTML = '<div class="bnr warn" role="alert">' + ic('alert') + '<span><b>' + t(L('Berat berbeda ' + fmt.num(diff * 100, 1) + '% dari pickup (' + fmt.kg(o.estKg) + ').', 'Weight differs ' + fmt.num(diff * 100, 1) + '% from pickup (' + fmt.kg(o.estKg) + ').')) + '</b> ' +
            t(L('Perlu persetujuan supervisor. Timbang ulang, atau tekan Terima Cucian sekali lagi untuk mengirim ke supervisor.', 'Supervisor approval needed. Weigh again, or press Receive Laundry once more to send it to the supervisor.')) + '</span></div>';
          return;
        }
        var type = val('f-type');
        A.submit('receive:' + o.id, el, function () {
          var prev = T(A.stage('receive').wait);
          o.kg = kg; o.bags = bags; o.type = type; o.stage = 'sort'; o.receivedAt = A.now();
          A.audit('ORD.RECEIVE', o.id, fmt.kg(o.estKg) + ' (pickup)', fmt.kg(kg));
          A.audit('ORD.STATUS', o.id, prev, T(A.stage('sort').wait));
          if (diff > 0.05) {
            A.db().approvals.unshift({ id: 'APR-' + (400 + A.db().approvals.length), type: 'weight', perm: 'ops.weight.override', ref: o.id, by: A.R().person, at: A.now(), from: fmt.kg(o.estKg) + ' (pickup)', to: fmt.kg(kg) + ' (timbang)', why: ['Selisih timbang ' + fmt.num(diff * 100, 1) + '%', 'Weight difference ' + fmt.num(diff * 100, 1) + '%'], status: 'wait' });
          }
          A.success(L('Cucian berhasil diterima.', 'Laundry received.'),
            can('ops.sort') ? { l: L('Lanjut ke Sorting', 'Next: Sorting'), go: 'OPS-SRT-001', rec: o.id } : null,
            { l: L('Kembali ke antrian', 'Back to queue'), go: 'OPS-RCV-002' },
            esc(A.cname(o.cl)) + ' · #' + esc(o.id) + ' · <b>' + fmt.kg(kg) + '</b> · ' + bags + ' bag' + (diff > 0.05 ? '<br>' + t(L('Selisih berat dikirim ke supervisor untuk disetujui.', 'Weight difference sent to the supervisor for approval.')) : ''));
        });
      }
    })
  };
  var SORT_CATS = { bed: [L('Sprei', 'Sheets'), L('Sarung bantal', 'Pillowcases'), L('Duvet cover', 'Duvet covers')], towel: [L('Handuk mandi', 'Bath towels'), L('Handuk tangan', 'Hand towels'), L('Bath mat', 'Bath mats')], fnb: [L('Taplak', 'Tablecloths'), L('Napkin', 'Napkins')], uniform: [L('Kemeja', 'Shirts'), L('Celana', 'Trousers'), L('Apron', 'Aprons')] };
  V['OPS-SRT-001'] = {
    render: function (ctx) {
      var g = guard(ctx, 'sort'); if (g.html) return g.html; var o = g.o, cats = SORT_CATS[o.type];
      var per = Math.round(o.kg * 3.2 / cats.length);
      return actionHead(ctx.s, o) + '<section class="card"><div class="card-h"><h2>' + ic('basket') + '<span>' + t(L('Pilah per Kategori', 'Sort by Category')) + '</span></h2><span class="cnt">' + fmt.kg(o.kg) + ' · ' + o.bags + ' bag</span></div>' +
        '<p class="hint">' + ic('link') + t(L('Jumlah diisi dari penerimaan. Ubah hanya jika berbeda.', 'Counts come from receiving. Change only if different.')) + '</p>' +
        '<div class="fgrid f3">' + cats.map(function (c, i) { return fld('c' + i, c, numIn('c' + i, per, 'pcs', { int: true, step: true }), { big: true }); }).join('') + '</div>' +
        '<div class="fgrid f2">' + fld('stain', L('Catatan noda (opsional)', 'Stain note (optional)'), txtIn('stain', '', L('Contoh: 2 sprei noda kopi', 'e.g. 2 sheets with coffee stain'))) + photo('srt') + '</div></section>' +
        actionBar(A.btn('primary', L('Selesai Sorting', 'Sorting Done'), 'check', { act: 'ok' }), A.pbtn('ops.issue', 'outline', L('Ada Masalah', 'Report Issue'), 'alert', { go: 'OPS-ISS-001', qs: 'ord=' + o.id }));
    },
    act: acts({
      ok: function (el) {
        var o = DB.order(A.S.rec), n = SORT_CATS[o.type].reduce(function (s, c, i) { return s + (parseInt(val('f-c' + i), 10) || 0); }, 0);
        if (!n) { errSummary([C.screen('OPS-SRT-001').v[0]]); return; }
        A.submit('sort:' + o.id, el, function () {
          o.stage = 'wash'; o.pcs = n; A.audit('PRC.COMPLETE', o.id, 'Sorting', n + ' pcs'); A.audit('ORD.STATUS', o.id, T(A.stage('sort').wait), T(A.stage('wash').wait));
          A.success(L('Sorting selesai.', 'Sorting done.'), can('ops.wash') ? { l: L('Lanjut ke Proses Cuci', 'Next: Washing'), go: 'OPS-WSH-001', rec: o.id } : null, { l: L('Kembali ke antrian', 'Back to queue'), go: 'OPS-SRT-002' }, esc(A.cname(o.cl)) + ' · ' + n + ' pcs');
        });
      }
    })
  };
  var MACHINES = [['Washer 1 (60 kg)', 60], ['Washer 2 (60 kg)', 60], ['Washer 3 (30 kg)', 30], ['Washer 4 (30 kg)', 30], ['Washer 5 (100 kg)', 100]];
  var PROGRAMS = { bed: L('Linen putih · 60°C · 42 menit', 'White linen · 60°C · 42 min'), towel: L('Handuk · 70°C · 48 menit', 'Towels · 70°C · 48 min'), fnb: L('F&B noda berat · 75°C · 55 menit', 'Heavy-soil F&B · 75°C · 55 min'), uniform: L('Seragam warna · 40°C · 35 menit', 'Coloured uniforms · 40°C · 35 min') };
  V['OPS-WSH-001'] = {
    render: function (ctx) {
      var g = guard(ctx, 'wash'); if (g.html) return g.html; var o = g.o, run = o.sub === 'running';
      var rec = MACHINES.filter(function (m) { return m[1] >= o.kg; })[0] || MACHINES[4];
      var body = run ? infoGrid([[L('Mesin', 'Machine'), esc(o.machine)], [L('Program', 'Program'), t(PROGRAMS[o.type])], [L('Mulai', 'Started'), fmt.time(o.washStart)], [L('Berjalan', 'Running'), esc(fmt.dur(A.now() - o.washStart).s)]])
        : '<div class="fgrid f2">' + fld('mc', L('Mesin', 'Machine'), selIn('mc', [['', L('Pilih mesin', 'Choose a machine')]].concat(MACHINES.map(function (m) { return [m[0], [m[0] + (m === rec ? ' · disarankan' : ''), m[0] + (m === rec ? ' · suggested' : '')]]; })), rec[0]), { big: true, req: true }) +
          fld('pg', L('Program Cuci', 'Wash Program'), '<span class="fld-in ro">' + t(PROGRAMS[o.type]) + '</span>', { big: true, from: L('otomatis dari jenis cucian', 'auto from laundry type') }) + '</div>';
      return actionHead(ctx.s, o, run ? L('Selesai Cuci', 'Finish Wash') : L('Mulai Cuci', 'Start Wash')) + '<section class="card"><div class="card-h"><h2>' + ic('washer') + '<span>' + t(L('Batch', 'Batch')) + ' · ' + fmt.kg(o.kg) + '</span></h2>' + (o.rewash ? A.chip('crit', L('Rewash', 'Rewash'), 'refresh') : '') + '</div>' + body + '</section>' +
        actionBar(run ? A.btn('primary', L('Selesai Cuci', 'Finish Wash'), 'checkc', { act: 'finish' }) : A.btn('primary', L('Mulai Cuci', 'Start Wash'), 'play', { act: 'start' }), A.pbtn('ops.issue', 'outline', L('Ada Masalah', 'Report Issue'), 'alert', { go: 'OPS-ISS-001', qs: 'ord=' + o.id }));
    },
    act: acts({
      start: function (el) {
        var o = DB.order(A.S.rec), mc = val('f-mc');
        if (!mc) { setErr('mc', C.screen('OPS-WSH-001').v[0]); errSummary([C.screen('OPS-WSH-001').v[0]]); return; }
        A.submit('washstart:' + o.id + ':' + (o.rewash || 0), el, function () {
          o.sub = 'running'; o.machine = mc; o.washStart = A.now(); A.audit('PRC.START', o.id, null, mc);
          A.toast(L('Cuci dimulai.', 'Wash started.')); A.rerender();
        });
      },
      finish: function (el) {
        var o = DB.order(A.S.rec);
        A.submit('washdone:' + o.id + ':' + (o.rewash || 0), el, function () {
          o.sub = null; o.stage = 'qc'; A.audit('PRC.COMPLETE', o.id, o.machine, T(A.stage('qc').wait)); A.audit('ORD.STATUS', o.id, T(L('Sedang Dicuci', 'Washing')), T(A.stage('qc').wait));
          A.success(L('Cuci selesai.', 'Wash done.'), can('ops.qc') ? { l: L('Lanjut ke QC', 'Next: QC'), go: 'OPS-QC-001', rec: o.id } : null, { l: L('Kembali ke antrian', 'Back to queue'), go: 'OPS-WSH-002' }, esc(A.cname(o.cl)) + ' · ' + esc(o.machine));
        });
      }
    })
  };
  V['OPS-QC-001'] = {
    render: function (ctx) {
      var g = guard(ctx, 'qc'); if (g.html) return g.html; var o = g.o;
      if (o.hold) return A.stateCard('warning', L('Cucian ini sedang ditinjau supervisor.', 'This load is being reviewed by a supervisor.'), A.btn('blue', L('Lihat detail', 'View detail'), 'file', { go: 'OPS-TRK-001', rec: o.id }) + A.backBtn('ghost'));
      var checks = [L('Bersih, tanpa noda', 'Clean, no stains'), L('Kering sempurna', 'Fully dry'), L('Rapi & terlipat', 'Neat & folded'), L('Jumlah sesuai', 'Count matches')];
      return actionHead(ctx.s, o) + (o.rewash ? '<div class="bnr warn">' + ic('refresh') + '<span>' + t(L('Cucian ini sudah ' + o.rewash + 'x rewash.', 'This load has been rewashed ' + o.rewash + 'x.')) + '</span></div>' : '') +
        '<section class="card"><div class="card-h"><h2>' + ic('search') + '<span>' + t(L('Periksa', 'Check')) + '</span></h2><span class="cnt">' + fmt.kg(o.kg) + ' · ' + t(A.typeL(o.type)) + '</span></div>' +
        '<ul class="qcl">' + checks.map(function (c) { return '<li>' + ic('checkc') + t(c) + '</li>'; }).join('') + '</ul>' + noteBox(o) + '</section>' +
        actionBar(A.btn('primary', L('LULUS', 'PASS'), 'checkc', { act: 'pass', cls: 'btn-xl' }), A.btn('danger', L('ADA MASALAH', 'ISSUE'), 'xc', { go: 'OPS-QC-003', rec: o.id, cls: 'btn-xl' }));
    },
    act: acts({
      pass: function (el) {
        var o = DB.order(A.S.rec);
        A.submit('qc:' + o.id + ':' + (o.rewash || 0), el, function () {
          o.stage = 'pack'; A.audit('QC.RESULT', o.id, T(A.stage('qc').wait), 'LULUS'); A.audit('ORD.STATUS', o.id, T(A.stage('qc').wait), T(A.stage('pack').wait));
          A.success(L('QC lulus.', 'QC passed.'), can('ops.pack') ? { l: L('Lanjut ke Packing', 'Next: Packing'), go: 'OPS-PAC-001', rec: o.id } : null, { l: L('Kembali ke antrian', 'Back to queue'), go: 'OPS-QC-002' }, esc(A.cname(o.cl)) + ' · #' + esc(o.id));
        });
      }
    })
  };
  V['OPS-QC-003'] = {
    render: function (ctx) {
      var g = guard(ctx, 'qc'); if (g.html) return g.html; var o = g.o;
      var rs = C.ISSUE_REASONS.filter(function (r) { return r.k !== 'late'; });
      return A.pageHead(L('Ada Masalah', 'Issue'), esc(A.cname(o.cl)) + ' · #' + esc(o.id)) +
        '<section class="card"><div class="card-h"><h2>' + ic('alert') + '<span>' + t(L('Pilih alasan', 'Choose a reason')) + ' <i class="req">*</i></span></h2></div>' +
        '<div class="reasons" role="radiogroup">' + rs.map(function (r) { return '<button type="button" class="rsn" role="radio" aria-checked="false" data-act="rsn" data-val="' + r.k + '">' + t(r.l) + '</button>'; }).join('') + '</div>' +
        '<span class="fld-e" id="e-rsn" aria-live="polite"></span>' +
        '<div class="fgrid f2">' + fld('qty', L('Jumlah item bermasalah', 'Items affected'), numIn('qty', 1, 'pcs', { int: true, step: true })) + photo('qc') + '</div>' +
        fld('note', L('Catatan (opsional)', 'Note (optional)'), txtIn('note', '', L('Singkat saja', 'Keep it short'))) + '<div id="rulebox"></div></section>' +
        actionBar(A.btn('primary', L('Kirim ke Rewash', 'Send to Rewash'), 'refresh', { act: 'rewash', id: 'b-rew' }), A.btn('outline', L('Minta Review Supervisor', 'Ask Supervisor Review'), 'users', { act: 'review' }));
    },
    act: acts({
      rsn: function (el) {
        document.querySelectorAll('.rsn').forEach(function (b) { b.setAttribute('aria-checked', b === el ? 'true' : 'false'); });
        var k = el.getAttribute('data-val'), hard = k === 'damage' || k === 'lost';
        document.getElementById('b-rew').hidden = hard;
        document.getElementById('rulebox').innerHTML = hard ? '<div class="bnr warn">' + ic('alert') + '<span>' + t(C.screen('OPS-QC-003').warn) + '</span></div>' : '';
        setErr('rsn');
      },
      rewash: function (el) { decide(el, 'rewash'); },
      review: function (el) { decide(el, 'review'); }
    })
  };
  function decide(el, how) {
    var sel = document.querySelector('.rsn[aria-checked="true"]'), s = C.screen('OPS-QC-003');
    if (!sel) { var e = document.getElementById('e-rsn'); e.textContent = T(s.v[0]); errSummary([s.v[0]]); return; }
    var o = DB.order(A.S.rec), k = sel.getAttribute('data-val');
    A.submit('qcx:' + o.id + ':' + (o.rewash || 0), el, function () {
      var id = 'ISS-0' + (416 + A.db().issues.length);
      A.db().issues.unshift({ id: id, ord: o.id, reason: k, src: 'qc', by: A.R().person, at: A.now(), status: how === 'rewash' ? 'closed' : 'review', note: val('f-note') || (val('f-qty') + ' pcs'), dec: how === 'rewash' ? 'rewash' : null });
      A.audit('QC.RESULT', o.id, T(A.stage('qc').wait), 'ADA MASALAH · ' + T(C.ISSUE_REASONS.filter(function (r) { return r.k === k; })[0].l));
      A.audit('ISS.CREATE', id, null, how === 'rewash' ? 'Rewash' : 'Review');
      if (how === 'rewash') { o.stage = 'wash'; o.rewash = (o.rewash || 0) + 1; A.audit('ORD.STATUS', o.id, 'QC', T(A.stage('wash').wait) + ' (rewash)'); }
      else o.hold = true;
      A.success(how === 'rewash' ? L('Masalah tercatat. Cucian dikirim ke Rewash.', 'Issue recorded. Load sent to Rewash.') : L('Masalah tercatat. Supervisor sudah diberi tahu.', 'Issue recorded. Supervisor notified.'),
        null, { l: L('Kembali ke antrian QC', 'Back to QC queue'), go: 'OPS-QC-002' }, esc(id) + ' · ' + esc(A.cname(o.cl)));
    });
  }
  V['OPS-PAC-001'] = {
    render: function (ctx) {
      var g = guard(ctx, 'pack'); if (g.html) return g.html; var o = g.o;
      return actionHead(ctx.s, o) + '<section class="card"><div class="card-h"><h2>' + ic('package') + '<span>' + t(L('Packing', 'Packing')) + '</span></h2><span class="cnt">' + t(L('Jadwal kirim', 'Delivery')) + ' ' + fmt.time(o.deliverAt) + '</span></div>' +
        '<div class="fgrid f2">' + fld('cb', L('Jumlah bag bersih', 'Clean bag count'), numIn('cb', o.bags, 'bag', { int: true, step: true }), { big: true, req: true, from: L('dari penerimaan', 'from receiving') }) +
        fld('lbl', L('Label', 'Label'), '<span class="fld-in ro">' + esc(A.cname(o.cl)) + ' · #' + esc(o.id) + '</span>', { big: true, from: L('otomatis', 'automatic') }) + '</div></section>' +
        actionBar(A.btn('primary', L('Siap Dikirim', 'Ready to Ship'), 'truck', { act: 'ok' }), A.pbtn('ops.issue', 'outline', L('Ada Masalah', 'Report Issue'), 'alert', { go: 'OPS-ISS-001', qs: 'ord=' + o.id }));
    },
    act: acts({
      ok: function (el) {
        var o = DB.order(A.S.rec), cb = parseInt(val('f-cb'), 10), s = C.screen('OPS-PAC-001');
        if (!(cb > 0)) { setErr('cb', s.v[0]); errSummary([s.v[0]]); return; }
        A.submit('pack:' + o.id, el, function () {
          o.cleanBags = cb; o.stage = 'deliver'; A.audit('PRC.COMPLETE', o.id, 'Packing', cb + ' bag'); A.audit('ORD.STATUS', o.id, T(A.stage('pack').wait), T(A.stage('deliver').wait));
          A.success(L('Siap dikirim.', 'Ready to ship.'), null, { l: L('Kembali ke antrian', 'Back to queue'), go: 'OPS-PAC-002' }, t(L('Masuk ke manifest pengiriman', 'Added to the delivery manifest')) + ' · ' + cb + ' bag' + (cb !== o.bags ? '<br>' + t(s.warn) : ''));
        });
      }
    })
  };
  V['OPS-PKP-001'] = {
    render: function (ctx) {
      var g = guard(ctx, 'pickup'); if (g.html) return g.html; var o = g.o, pr = DB.prop(o.prop), cl = DB.client(o.cl), started = o.sub === 'started';
      var head = A.pageHead(started ? L('Konfirmasi Barang', 'Confirm Items') : L('Mulai Pickup', 'Start Pickup'), esc(cl.n) + ' · #' + esc(o.id)) + statusBar(o);
      var info = infoGrid([[L('Alamat', 'Address'), esc(pr.n)], [L('Kontak', 'Contact'), esc(cl.pic) + ' · ' + esc(cl.phone)], [L('Jadwal', 'Scheduled'), fmt.time(o.pickupAt)], [L('Perkiraan', 'Estimate'), o.bags + ' bag · ± ' + fmt.kg(o.estKg)]]);
      if (!started) return head + '<section class="card">' + info + '</section>' + actionBar(A.btn('primary', L('Mulai Pickup', 'Start Pickup'), 'play', { act: 'start' }), A.pbtn('ops.issue', 'outline', L('Ada Masalah', 'Report Issue'), 'alert', { go: 'OPS-ISS-001', qs: 'ord=' + o.id }));
      return head + '<section class="card"><div class="card-h"><h2>' + ic('clipboard') + '<span>' + t(L('Barang yang diambil', 'Items collected')) + '</span></h2></div><div class="fgrid f2">' +
        fld('bags', L('Jumlah bag', 'Bag count'), numIn('bags', o.bags, 'bag', { int: true, step: true }), { big: true, req: true, from: L('dari jadwal', 'from schedule') }) +
        fld('type', L('Jenis cucian', 'Laundry type'), selIn('type', TYPE_OPTS, o.type), { big: true }) + '</div>' + photo('pkp', L('Foto jika perlu', 'Photo if needed')) + '</section>' +
        actionBar(A.btn('primary', L('Pickup Selesai', 'Pickup Done'), 'checkc', { act: 'done' }), A.pbtn('ops.issue', 'outline', L('Ada Masalah', 'Report Issue'), 'alert', { go: 'OPS-ISS-001', qs: 'ord=' + o.id }));
    },
    act: acts({
      start: function (el) { var o = DB.order(A.S.rec); A.submit('pkstart:' + o.id, el, function () { o.sub = 'started'; A.audit('ORD.STATUS', o.id, T(A.stage('pickup').wait), T(L('Sedang Pickup', 'Picking Up'))); A.rerender(); }); },
      done: function (el) {
        var o = DB.order(A.S.rec), b = parseInt(val('f-bags'), 10), s = C.screen('OPS-PKP-001');
        if (!(b > 0)) { setErr('bags', s.v[0]); errSummary([s.v[0]]); return; }
        A.submit('pickup:' + o.id, el, function () {
          var est = o.bags; o.bags = b; o.type = val('f-type'); o.sub = null; o.stage = 'receive'; o.pickedAt = A.now();
          A.audit('ORD.PICKUP', o.id, est + ' bag (jadwal)', b + ' bag'); A.audit('ORD.STATUS', o.id, T(L('Sedang Pickup', 'Picking Up')), T(A.stage('receive').wait));
          var nx = orders('pickup').sort(function (a, c) { return a.pickupAt - c.pickupAt; })[0];
          A.success(L('Pickup selesai.', 'Pickup done.'), nx ? { l: L('Stop berikutnya: ' + A.cname(nx.cl), 'Next stop: ' + A.cname(nx.cl)), go: 'OPS-PKP-001', rec: nx.id } : null, { l: L('Kembali ke daftar pickup', 'Back to pickups'), go: 'OPS-PKP-002' }, esc(A.cname(o.cl)) + ' · ' + b + ' bag' + (b !== est ? '<br>' + t(s.warn) : ''));
        });
      }
    })
  };
  V['OPS-DLV-001'] = {
    render: function (ctx) {
      var g = guard(ctx, 'deliver'); if (g.html) return g.html; var o = g.o, pr = DB.prop(o.prop), cl = DB.client(o.cl);
      var onway = o.sub === 'onway', handed = o.sub === 'handed';
      if (handed) { A.go('OPS-DLV-003', o.id); return ''; }
      return A.pageHead(onway ? L('Serahkan', 'Hand Over') : L('Mulai Pengiriman', 'Start Delivery'), esc(cl.n) + ' · #' + esc(o.id)) + statusBar(o) +
        '<section class="card">' + infoGrid([[L('Alamat', 'Address'), esc(pr.n)], [L('Penerima', 'Receiver'), esc(cl.pic) + ' · ' + esc(cl.phone)], [L('Jumlah', 'Count'), (o.cleanBags || o.bags) + ' bag'], [L('Janji kirim', 'Promised'), fmt.time(o.deliverAt)]]) + '</section>' +
        actionBar(onway ? A.btn('primary', L('Serahkan', 'Hand Over'), 'package', { act: 'hand' }) : A.btn('primary', L('Mulai Pengiriman', 'Start Delivery'), 'play', { act: 'start' }), A.pbtn('ops.issue', 'outline', L('Ada Masalah', 'Report Issue'), 'alert', { go: 'OPS-ISS-001', qs: 'ord=' + o.id }));
    },
    act: acts({
      start: function (el) { var o = DB.order(A.S.rec); A.submit('dlvstart:' + o.id, el, function () { o.sub = 'onway'; A.audit('ORD.STATUS', o.id, T(A.stage('deliver').wait), T(L('Dalam Perjalanan', 'On the Way'))); A.rerender(); }); },
      hand: function (el) { var o = DB.order(A.S.rec); A.submit('dlvhand:' + o.id, el, function () { o.sub = 'handed'; A.audit('ORD.STATUS', o.id, T(L('Dalam Perjalanan', 'On the Way')), T(L('Diserahkan', 'Handed Over'))); A.go('OPS-DLV-003', o.id); }); }
    })
  };
  V['OPS-DLV-003'] = {
    render: function (ctx) {
      var o = DB.order(ctx.rec); if (!o) return notFound();
      if (o.stage === 'done') return A.stateCard('empty', ctx.s.emp, A.btn('blue', L('Kembali ke pengiriman', 'Back to deliveries'), 'list', { go: 'OPS-DLV-002' }), L('Sudah selesai', 'Already done'));
      if (o.stage !== 'deliver' || o.sub !== 'handed') return A.stateCard('warning', L('Tekan Serahkan dulu sebelum mengambil bukti.', 'Press Hand Over first before taking proof.'), A.btn('blue', L('Buka pengiriman', 'Open delivery'), 'truck', { go: 'OPS-DLV-001', rec: o.id }));
      var cl = DB.client(o.cl);
      return A.pageHead(null, esc(cl.n) + ' · #' + esc(o.id)) + statusBar(o) +
        '<section class="card"><div class="fgrid f2">' + fld('rn', L('Nama penerima', 'Receiver name'), txtIn('rn', cl.pic), { big: true, req: true, from: L('kontak klien', 'client contact') }) +
        fld('rb', L('Jumlah bag diterima', 'Bags received'), numIn('rb', o.cleanBags || o.bags, 'bag', { int: true, step: true }), { big: true }) + '</div>' +
        '<div class="fgrid f2"><button type="button" class="photo" data-act="photo" id="ph-pod"><span class="photo-im">' + ic('camera') + '</span><span>' + t(L('Ambil Foto Serah Terima', 'Take Handover Photo')) + '</span></button>' +
        '<button type="button" class="photo sign" data-act="sign" id="sg"><span class="photo-im">' + ic('sign') + '</span><span>' + t(L('Ketuk untuk tanda tangan', 'Tap to sign')) + '</span></button></div><span class="fld-e" id="e-pod" aria-live="polite"></span></section>' +
        actionBar(A.btn('primary', L('Selesai', 'Done'), 'checkc', { act: 'ok' }), A.pbtn('ops.issue', 'outline', L('Ada Masalah', 'Report Issue'), 'alert', { go: 'OPS-ISS-001', qs: 'ord=' + o.id }));
    },
    act: acts({
      sign: function (el) { el.classList.toggle('on'); el.querySelector('span:last-child').textContent = el.classList.contains('on') ? T(L('Ditandatangani ✓', 'Signed ✓')) : T(L('Ketuk untuk tanda tangan', 'Tap to sign')); },
      photo: function (el) { el.classList.toggle('on'); el.querySelector('span:last-child').textContent = el.classList.contains('on') ? T(L('Foto ditambahkan ✓', 'Photo added ✓')) : T(L('Ambil Foto Serah Terima', 'Take Handover Photo')); },
      ok: function (el) {
        var o = DB.order(A.S.rec), s = C.screen('OPS-DLV-003'), errs = [], rn = val('f-rn');
        setErr('rn'); document.getElementById('e-pod').textContent = '';
        if (!rn) { setErr('rn', s.v[0]); errs.push(s.v[0]); }
        if (!document.querySelector('#ph-pod.on, #sg.on')) { document.getElementById('e-pod').textContent = T(s.v[1]); errs.push(s.v[1]); }
        errSummary(errs); if (errs.length) return;
        A.submit('pod:' + o.id, el, function () {
          o.stage = 'done'; o.sub = null; o.deliveredAt = A.now(); o.pod = { name: rn, at: A.now(), photo: !!document.querySelector('#ph-pod.on'), bags: parseInt(val('f-rb'), 10) };
          A.audit('DLV.POD', o.id, null, rn); A.audit('ORD.STATUS', o.id, T(L('Diserahkan', 'Handed Over')), T(A.stage('done').wait));
          var nx = orders('deliver').sort(bySla)[0];
          A.success(L('Pengiriman selesai. Bukti tersimpan.', 'Delivery done. Proof saved.'), nx ? { l: L('Tujuan berikutnya: ' + A.cname(nx.cl), 'Next: ' + A.cname(nx.cl)), go: 'OPS-DLV-001', rec: nx.id } : null, { l: L('Kembali ke daftar', 'Back to list'), go: 'OPS-DLV-002' }, esc(A.cname(o.cl)) + ' · ' + esc(rn));
        });
      }
    })
  };

  /* ================= T06 Ada Masalah (frontline form) ================= */
  V['OPS-ISS-001'] = {
    render: function (ctx) {
      var pre = ctx.q.ord, os = active().sort(bySla).slice(0, 30);
      return A.pageHead(null, t(L('Satu tombol, lalu pilih alasan. Supervisor langsung diberi tahu.', 'One button, then choose a reason. The supervisor is told at once.'))) +
        '<section class="card"><div class="card-h"><h2>' + ic('alert') + '<span>' + t(L('Apa masalahnya?', 'What is wrong?')) + ' <i class="req">*</i></span></h2></div>' +
        '<div class="reasons" role="radiogroup">' + C.ISSUE_REASONS.map(function (r) { return '<button type="button" class="rsn" role="radio" aria-checked="false" data-act="rsn" data-val="' + r.k + '">' + t(r.l) + '</button>'; }).join('') + '</div><span class="fld-e" id="e-rsn" aria-live="polite"></span>' +
        '<div class="fgrid f2">' + fld('ord', L('Order terkait', 'Related order'), selIn('ord', [['', L('Pilih order', 'Choose an order')]].concat(os.map(function (o) { return [o.id, ['#' + o.id + ' · ' + A.cname(o.cl), '#' + o.id + ' · ' + A.cname(o.cl)]]; })), pre), { req: true, from: pre ? L('otomatis dari tugas', 'from the task') : null }) + photo('iss') + '</div>' +
        fld('note', L('Catatan singkat (opsional)', 'Short note (optional)'), txtIn('note', '', L('Contoh: 3 sprei noda kuning', 'e.g. 3 sheets with yellow stains'))) + '</section>' +
        actionBar(A.btn('primary', L('Kirim Laporan', 'Send Report'), 'message', { act: 'ok' }), A.btn('ghost', L('Batal', 'Cancel'), 'x', { go: A.parentOf('OPS-ISS-001') || A.R().nav[0].s }));
    },
    act: acts({
      rsn: function (el) { document.querySelectorAll('.rsn').forEach(function (b) { b.setAttribute('aria-checked', b === el ? 'true' : 'false'); }); document.getElementById('e-rsn').textContent = ''; },
      ok: function (el) {
        var s = C.screen('OPS-ISS-001'), sel = document.querySelector('.rsn[aria-checked="true"]'), ord = val('f-ord'), errs = [];
        setErr('ord');
        if (!sel) { document.getElementById('e-rsn').textContent = T(s.v[0]); errs.push(s.v[0]); }
        if (!ord) { setErr('ord', s.v[1]); errs.push(s.v[1]); }
        errSummary(errs); if (errs.length) return;
        A.submit('iss:' + ord + ':' + sel.getAttribute('data-val') + ':' + Math.floor(A.now() / 6e4), el, function () {
          var id = 'ISS-0' + (416 + A.db().issues.length);
          A.db().issues.unshift({ id: id, ord: ord, reason: sel.getAttribute('data-val'), src: A.S.role === 'driver' ? 'driver' : 'floor', by: A.R().person, at: A.now(), status: 'open', note: val('f-note') });
          A.audit('ISS.CREATE', id, null, T(C.ISSUE_REASONS.filter(function (r) { return r.k === sel.getAttribute('data-val'); })[0].l) + ' · ' + ord);
          A.success(L('Laporan terkirim. Supervisor sudah diberi tahu.', 'Report sent. Supervisor notified.'), { l: L('Kembali ke tugas', 'Back to task'), go: A.R().nav[0].s, icon: 'home' }, null, esc(id) + ' · #' + esc(ord));
        });
      }
    })
  };

  /* ================= T02 History, route ================= */
  V['OPS-HIS-001'] = {
    render: function () {
      var me = A.R().person, mine = A.S.role === 'operator' || A.S.role === 'driver';
      var rows = A.db().audit.filter(function (a) { return (!mine || a.by === me) && a.ev !== 'AUTH.LOGIN'; }).slice(0, 40);
      var tab = A.S.q.tab === '7' ? '7' : 'd', td = new Date(); td.setHours(0, 0, 0, 0);
      var shown = rows.filter(function (a) { return tab === '7' || a.at >= td.getTime(); });
      return A.pageHead(null, mine ? t(L('Aktivitas Anda', 'Your activity')) : t(L('Aktivitas tim', 'Team activity'))) +
        '<div class="tabs"><a href="' + href('OPS-HIS-001') + '" aria-selected="' + (tab === 'd') + '">' + t(L('Hari ini', 'Today')) + '</a><a href="' + href('OPS-HIS-001', null, { tab: '7' }) + '" aria-selected="' + (tab === '7') + '">' + t(L('7 hari', '7 days')) + '</a></div>' +
        (shown.length ? '<div class="rls">' + shown.map(function (a) {
          var o = DB.order(a.rec);
          return A.rowLink({ href: o ? href('OPS-TRK-001', o.id) : '#', icon: a.ev === 'ISS.CREATE' ? 'alert' : a.ev === 'DLV.POD' ? 'filecheck' : 'checkc', t: t(C.AUDIT[a.ev]) + (o ? ' · ' + esc(A.cname(o.cl)) : ''), s: esc(a.rec) + (a.to ? ' · ' + esc(a.to) : '') + ' · ' + esc(fmt.when(a.at)), tone: a.ev === 'ISS.CREATE' ? 'warn' : '' });
        }).join('') + '</div>' : A.empty(C.screen('OPS-HIS-001').emp));
    }
  };
  V['LOG-RTE-001'] = {
    render: function () {
      var stops = orders('pickup').map(function (o) { return { o: o, k: 'pickup', at: o.pickupAt }; }).concat(orders('deliver').map(function (o) { return { o: o, k: 'deliver', at: o.deliverAt }; }))
        .concat(orders('done').filter(function (o) { return o.deliveredAt > A.now() - 8 * 36e5; }).map(function (o) { return { o: o, k: 'done', at: o.deliveredAt }; })).sort(function (a, b) { return a.at - b.at; });
      var doneN = stops.filter(function (s) { return s.k === 'done'; }).length;
      return A.pageHead(null, 'B 1234 XY · ' + t(L(doneN + ' dari ' + stops.length + ' stop selesai', doneN + ' of ' + stops.length + ' stops done'))) +
        '<ol class="route">' + stops.map(function (s, i) {
          var o = s.o, done = s.k === 'done', target = s.k === 'pickup' ? 'OPS-PKP-001' : s.k === 'deliver' ? 'OPS-DLV-001' : 'OPS-TRK-001';
          return '<li class="' + (done ? 'done' : '') + '"><span class="route-n">' + (done ? ic('check') : i + 1) + '</span><a href="' + href(target, o.id) + '" class="route-c"><b>' + esc(A.cname(o.cl)) + '</b><span>' + t(s.k === 'pickup' ? L('Pickup', 'Pickup') : L('Pengiriman', 'Delivery')) + ' · ' + fmt.time(s.at) + ' · ' + (o.cleanBags || o.bags) + ' bag</span>' +
            (done ? A.chip('ok', L('Selesai', 'Done'), 'checkc') : s.at < A.now() ? A.chip('crit', L('Terlambat', 'Late'), 'alert') : A.chip('info', L('Terjadwal', 'Scheduled'), 'clock')) + '</a></li>';
        }).join('') + '</ol>';
    }
  };

  /* ================= T03 Task detail ================= */
  V['OPS-TRK-001'] = {
    title: function (rec) { return rec ? ['#' + rec, '#' + rec] : null; },
    render: function (ctx) {
      var o = DB.order(ctx.rec) || active().sort(bySla)[0];
      if (!o) return notFound();
      var cl = DB.client(o.cl), st = STAGE_SCREENS[o.stage], nextBtn = st && can(st.p) && !o.hold ? A.btn('primary', C.screen(st.a).n, 'arrow', { go: st.a, rec: o.id }) : '';
      var hist = o.history.slice().sort(function (a, b) { return b.at - a.at; });
      return A.pageHead(['#' + o.id, '#' + o.id], esc(cl.n) + ' · ' + t(A.typeL(o.type)), A.chip(statusTone(o), statusLabel(o), 'status')) +
        A.stepper(o.stage) + (o.stage !== 'done' ? statusBar(o) : '') +
        '<div class="grid2 g-detail"><div>' + A.section(L('Rincian', 'Details'), infoGrid([[L('Klien', 'Client'), esc(cl.n)], [L('Property', 'Property'), esc(DB.prop(o.prop).n)], [L('Berat', 'Weight'), o.kg != null ? fmt.kg(o.kg) : '± ' + fmt.kg(o.estKg)], [L('Bag', 'Bags'), o.bags], [L('Jenis', 'Type'), t(A.typeL(o.type))], [L('Rewash', 'Rewash'), o.rewash || 0], [L('Dibuat', 'Created'), fmt.when(o.createdAt)], [L('Batas SLA', 'SLA due'), fmt.when(o.dueAt)]]) + noteBox(o), { icon: 'file' }) +
        (o.pod ? A.section(L('Bukti Pengiriman', 'Proof of Delivery'), infoGrid([[L('Penerima', 'Receiver'), esc(o.pod.name)], [L('Waktu', 'Time'), fmt.when(o.pod.at)], [L('Foto', 'Photo'), o.pod.photo ? t(L('Ada', 'Yes')) : t(L('Tanda tangan', 'Signature'))]]), { icon: 'filecheck' }) : '') + '</div>' +
        A.section(L('Riwayat (audit)', 'History (audit)'), '<ol class="tl">' + hist.map(function (h) { return '<li><b>' + t(C.AUDIT[h.ev] || [h.ev, h.ev]) + '</b><span>' + esc(h.by) + ' · ' + esc(fmt.when(h.at)) + '</span>' + (h.from || h.to ? '<small>' + esc(h.from || '—') + ' → ' + esc(h.to || '—') + '</small>' : '') + '</li>'; }).join('') + '</ol>', { icon: 'history' }) + '</div>' +
        (nextBtn || can('ops.issue') ? actionBar(nextBtn, A.pbtn('ops.issue', 'outline', L('Ada Masalah', 'Report Issue'), 'alert', { go: 'OPS-ISS-001', qs: 'ord=' + o.id })) : '');
    }
  };

  /* ================= Supervisor & manager ops ================= */
  V['OPS-BRD-001'] = {
    render: function () {
      var cols = C.STAGES.filter(function (s) { return s.k !== 'done'; }), m = A.mode(), sel = A.S.q.stage || 'receive';
      var col = function (s) {
        var rows = orders(s.k).sort(bySla);
        return '<section class="bcol"><div class="bcol-h">' + ic(s.i) + '<b>' + t(s.wait) + '</b><span class="cnt num">' + rows.length + '</span></div><div class="qcs">' + (rows.length ? rows.map(function (o) { return qcard(o, 'OPS-TRK-001'); }).join('') : A.empty(L('Kosong', 'Empty'))) + '</div></section>';
      };
      var risk = active().filter(urgent).length;
      var head = A.pageHead(null, t(L(active().length + ' order aktif', active().length + ' active orders')) + (risk ? ' · ' + t(L(risk + ' berisiko SLA', risk + ' at SLA risk')) : ''));
      if (m === 'd') return head + '<div class="board">' + cols.map(col).join('') + '</div>';
      return head + '<div class="tabs scroll">' + cols.map(function (s) { return '<a href="' + href('OPS-BRD-001', null, { stage: s.k }) + '" aria-selected="' + (sel === s.k) + '">' + t(s.l) + ' <b>' + orders(s.k).length + '</b></a>'; }).join('') + '</div>' + col(A.stage(sel));
    }
  };
  V['OPS-TEAM-001'] = {
    render: function () {
      var staff = A.db().staff.filter(function (s) { return s.st !== 'driver'; });
      var opts = ['receive', 'sort', 'wash', 'qc', 'pack'];
      var load = opts.map(function (k) { return { k: k, staff: staff.filter(function (s) { return s.present && s.st === k; }).length, q: orders(k).length }; });
      var short = load.filter(function (x) { return x.q > 0 && x.q / Math.max(1, x.staff) >= 4; });
      return A.pageHead(null, t(L(staff.filter(function (s) { return s.present; }).length + ' hadir · shift pagi', staff.filter(function (s) { return s.present; }).length + ' present · morning shift'))) +
        (short.length ? '<div class="bnr warn">' + ic('alert') + '<span>' + t(L('Kekurangan orang di: ', 'Understaffed: ')) + short.map(function (x) { return t(A.stage(x.k).l); }).join(', ') + '</span></div>' : '') +
        A.list(staff, [
          { h: L('Nama', 'Name'), v: function (s) { return '<span class="who"><span class="av sm">' + esc(s.n.charAt(0)) + '</span><b>' + esc(s.n) + '</b></span>'; } },
          { h: L('Status', 'Status'), v: function (s) { return s.present ? A.chip('ok', L('Hadir', 'Present'), 'checkc') : A.chip('mute', L('Tidak hadir', 'Absent'), 'minus'); } },
          { h: L('Stasiun', 'Station'), v: function (s) { return can('ops.team') && s.present ? '<select class="sel-sm" data-staff="' + s.id + '" aria-label="' + t(L('Stasiun', 'Station')) + '">' + opts.map(function (k) { return '<option value="' + k + '"' + (k === s.st ? ' selected' : '') + '>' + t(A.stage(k).l) + '</option>'; }).join('') + '</select>' : t(A.stage(s.st).l); } },
          { h: L('Antrian stasiun', 'Station queue'), cls: 'r', v: function (s) { return '<span class="num">' + orders(s.st).length + '</span>'; } },
          { h: L('Selesai hari ini', 'Done today'), cls: 'r', v: function (s) { return '<span class="num">' + s.done + ' · ' + fmt.kg(s.kg) + '</span>'; } }
        ], function (s) { return { t: esc(s.n), r: s.done + ' ' + T(L('selesai', 'done')), s: t(A.stage(s.st).l) + ' · ' + orders(s.st).length + ' ' + T(L('antrian', 'queued')), chip: s.present ? A.chip('ok', L('Hadir', 'Present'), 'checkc') : A.chip('mute', L('Tidak hadir', 'Absent'), 'minus') }; });
    },
    after: function () {
      document.querySelectorAll('[data-staff]').forEach(function (el) {
        el.onchange = function () { var s = A.db().staff.filter(function (x) { return x.id === el.getAttribute('data-staff'); })[0]; var prev = s.st; s.st = el.value; A.audit('SYS.CHANGE', s.n, T(A.stage(prev).l), T(A.stage(s.st).l)); DB.save(); A.toast(L('Stasiun diperbarui.', 'Station updated.')); A.rerender(); };
      });
    }
  };
  function issueRows() { return A.db().issues.slice().sort(function (a, b) { return (a.status === 'closed') - (b.status === 'closed') || b.at - a.at; }); }
  function rsnL(k) { return C.ISSUE_REASONS.filter(function (x) { return x.k === k; })[0].l; }
  var ISS_ST = { open: ['warn', L('Terbuka', 'Open'), 'alert'], review: ['crit', L('Menunggu review', 'Waiting review'), 'users'], closed: ['ok', L('Selesai', 'Closed'), 'checkc'], claim: ['appr', L('Klaim diajukan', 'Claim raised'), 'filecheck'] };
  var SRC = { qc: L('QC', 'QC'), receive: L('Penerimaan', 'Receiving'), client: L('Komplain klien', 'Client complaint'), floor: L('Lantai produksi', 'Floor'), driver: L('Driver', 'Driver') };
  A.rsnL = rsnL; A.ISS_ST = ISS_ST;
  V['QLT-ISS-001'] = {
    render: function () {
      var defs = [{ k: 'st', l: L('Status', 'Status'), opts: [['open', ISS_ST.open[1]], ['review', ISS_ST.review[1]], ['closed', ISS_ST.closed[1]]], fn: function (r, v) { return r.status === v; } },
        { k: 'rs', l: L('Alasan', 'Reason'), opts: C.ISSUE_REASONS.map(function (r) { return [r.k, r.l]; }), fn: function (r, v) { return r.reason === v; } }];
      var rows = A.applyFilters(issueRows(), defs, function (r) { return r.id + ' ' + A.cname(DB.order(r.ord).cl) + ' ' + r.note; });
      var open = A.db().issues.filter(function (i) { return i.status !== 'closed'; }).length;
      return A.pageHead(null, t(L(open + ' terbuka', open + ' open'))) + A.filters(defs, { search: L('Cari masalah, klien…', 'Search issues, clients…'), force: true }) +
        A.list(rows, [
          { h: L('ID', 'ID'), v: function (r) { return '<b>' + esc(r.id) + '</b>'; } },
          { h: L('Alasan', 'Reason'), v: function (r) { return t(rsnL(r.reason)); } },
          { h: L('Klien · Order', 'Client · Order'), v: function (r) { var o = DB.order(r.ord); return esc(A.cname(o.cl)) + '<small class="sub">#' + esc(o.id) + '</small>'; } },
          { h: L('Sumber', 'Source'), v: function (r) { return t(SRC[r.src]) + '<small class="sub">' + esc(r.by) + '</small>'; } },
          { h: L('Umur', 'Age'), v: function (r) { return esc(fmt.ago(r.at)); } },
          { h: L('Status', 'Status'), v: function (r) { var x = ISS_ST[r.status]; return A.chip(x[0], x[1], x[2]); } }
        ], function (r) { var o = DB.order(r.ord), x = ISS_ST[r.status]; return { t: t(rsnL(r.reason)) + ' · ' + esc(A.cname(o.cl)), r: esc(r.id), s: esc(r.note || '') + ' · ' + esc(fmt.ago(r.at)), chip: A.chip(x[0], x[1], x[2]) }; },
        function (r) { return can('qlt.review') ? href('QLT-ISS-002', r.id) : href('OPS-TRK-001', r.ord); });
    }
  };
  V['QLT-ISS-002'] = {
    title: function (rec) { return rec ? [rec, rec] : null; },
    render: function (ctx) {
      var i = DB.issue(ctx.rec) || A.db().issues.filter(function (x) { return x.status !== 'closed'; })[0];
      if (!i) return notFound();
      var o = DB.order(i.ord), x = ISS_ST[i.status];
      var decided = i.status === 'closed' || i.status === 'claim';
      return A.pageHead([i.id + ' · ' + T(rsnL(i.reason)), i.id + ' · ' + T(rsnL(i.reason))], esc(A.cname(o.cl)) + ' · #' + esc(o.id), A.chip(x[0], x[1], x[2])) +
        '<div class="grid2">' + A.section(L('Masalah', 'Issue'), infoGrid([[L('Alasan', 'Reason'), t(rsnL(i.reason))], [L('Sumber', 'Source'), t(SRC[i.src]) + ' · ' + esc(i.by)], [L('Dilaporkan', 'Reported'), fmt.when(i.at)], [L('Rewash sebelumnya', 'Previous rewash'), o.rewash || 0]]) +
          (i.note ? '<div class="note-b">' + ic('message') + '<span><small>' + t(L('Catatan', 'Note')) + '</small>' + esc(i.note) + '</span></div>' : '') + '<div class="photo-ph">' + ic('camera') + '<span>' + t(L('Foto bukti', 'Photo proof')) + '</span></div>', { icon: 'alert' }) +
        A.section(L('Order', 'Order'), infoGrid([[L('Tahap', 'Stage'), t(statusLabel(o))], [L('Berat', 'Weight'), fmt.kg(o.kg || o.estKg)], [L('Bag', 'Bags'), o.bags], [L('SLA', 'SLA'), A.slaChip(o.dueAt)]]) + '<a class="lnk-b" href="' + href('OPS-TRK-001', o.id) + '">' + t(L('Lihat detail order', 'View order detail')) + ic('chevr') + '</a>', { icon: 'file' }) + '</div>' +
        (decided ? A.stateCard('empty', C.screen('QLT-ISS-002').emp, A.backBtn(), L('Sudah diputuskan', 'Already decided')) :
          (o.rewash >= 2 ? '<div class="bnr warn">' + ic('alert') + '<span>' + t(C.screen('QLT-ISS-002').warn) + '</span></div>' : '') +
          '<section class="card">' + fld('dn', L('Catatan keputusan', 'Decision note'), txtIn('dn', '', L('Wajib untuk klaim', 'Required for a claim'), true)) + '</section>' +
          actionBar(A.pbtn('qlt.review', 'primary', L('Rewash', 'Rewash'), 'refresh', { act: 'rewash' }), A.pbtn('qlt.review', 'outline', L('Ajukan Klaim', 'Raise Claim'), 'filecheck', { act: 'claim' }) + A.pbtn('qlt.review', 'ghost', L('Tutup', 'Close'), 'checkc', { act: 'close' })));
    },
    act: {
      rewash: function (el) { issueDecide(el, 'rewash'); }, claim: function (el) { issueDecide(el, 'claim'); }, close: function (el) { issueDecide(el, 'close'); }
    }
  };
  function issueDecide(el, how) {
    var i = DB.issue(A.S.rec) || A.db().issues.filter(function (x) { return x.status !== 'closed'; })[0], o = DB.order(i.ord), note = val('f-dn'), s = C.screen('QLT-ISS-002');
    if (how === 'claim' && !note) { setErr('dn', s.v[0]); errSummary([s.v[0]]); return; }
    A.submit('issue:' + i.id, el, function () {
      var prev = i.status;
      i.status = how === 'claim' ? 'claim' : 'closed'; i.dec = how; o.hold = false;
      if (how === 'rewash' && o.stage !== 'wash') { o.stage = 'wash'; o.rewash = (o.rewash || 0) + 1; A.audit('ORD.STATUS', o.id, 'QC', T(A.stage('wash').wait) + ' (rewash)'); }
      if (how === 'claim') A.db().approvals.unshift({ id: 'APR-' + (400 + A.db().approvals.length), type: 'claim', perm: 'qlt.claim.approve', ref: i.id + ' · ' + A.cname(o.cl), by: A.R().person, at: A.now(), from: '—', to: T(L('Klaim', 'Claim')), why: [note, note], status: 'wait' });
      A.audit('APR.DECISION', i.id, prev, how + (note ? ' · ' + note : ''));
      A.success(s.ok, null, { l: L('Kembali ke Masalah', 'Back to Issues'), go: 'QLT-ISS-001' }, esc(i.id) + ' · ' + t(how === 'rewash' ? L('Rewash', 'Rewash') : how === 'claim' ? L('Klaim diajukan ke manager/owner', 'Claim sent to manager/owner') : L('Ditutup', 'Closed')));
    });
  }
  window.JFOPS = { orders: orders, active: active, bySla: bySla, urgent: urgent, stageCounts: stageCounts, issueRows: issueRows, SRC: SRC };
})();
