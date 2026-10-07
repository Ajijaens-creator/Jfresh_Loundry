/* JFRESH OS — Phase 12 NP-11 Go-Live Command Center, Hypercare, Incidents, Go/No-Go (LIVE-001..004) and
   NP-12 Post-Go-Live Review & Continuous Improvement (OPT-001..004). Prefix lv12-.
   Every number comes from JFGO (assets/js/jfos-go.js) which reads the owner engines (JFACCESS, JFLOG, JFPROD,
   JFDLV, JFFIN, JFCLP, JFSYS, JFIMP, JFHELP); every write is a JFGO action (permission, maker-checker, audit there).
   Desktop primary, iPad for monitoring / hypercare / approvals; phone: status, alerts and "Laporkan Masalah". */
(function () {
  var A = window.JFAPP, G = window.JFGO, P = A && A.P10, H = A && A.P5, P8 = A && A.P8;
  if (!A || !G || !P || !H || !P8) return;
  var V = A.V, T = A.T, L = A.L, t = A.t, esc = A.esc, ic = A.ic, can = A.can, href = A.href;
  var X = window.JFACCESS, C = window.JFOS;
  A.addParents(G.PARENTS || {});

  function cx() { return A.ctx(); }
  function phone() { return A.mode() === 'm'; }
  function dctx() { var c = cx(); return Object.assign({}, c, { device: phone() ? 'mobile' : A.mode() === 't' ? 'ipad' : 'desktop' }); }
  function tt(x) { return x == null ? '' : t(x); }
  function open(id) { return H.open(id); }
  function num(v, d) { return v == null || isNaN(v) ? '—' : A.fmt.num(v, d == null ? (v % 1 ? 1 : 0) : d); }
  function uname(uid) { var u = X.USERS.filter(function (x) { return x.id === uid; })[0]; return u ? esc(X.fullName ? X.fullName(u) : u.u) : esc(uid || '—'); }
  function srcChip(s) { return s ? '<span class="lv12-src" title="' + esc(T(L('Sumber data', 'Data source'))) + '">' + ic('database') + esc(s) + '</span>' : ''; }
  function err() { return A.stateCard('error', L('Data belum berhasil dimuat.', 'The data could not be loaded.'), A.btn('blue', L('Coba Lagi', 'Try Again'), 'refresh', { act: 'retry' })); }
  var HTONE = { healthy: 'ok', warning: 'warn', critical: 'crit', ok: 'ok', warn: 'warn', crit: 'crit', info: 'info' };
  var HLAB = { healthy: L('Sehat', 'Healthy'), warning: L('Peringatan', 'Warning'), critical: L('Kritis', 'Critical') };
  var GATE_S = { criticalBug: 'QA-002', openingBalance: 'MIG-003', security: 'SVL-003', permission: 'SVL-002', restore: 'RLB-005', uat: 'UAT-001', training: 'HELP-007' };
  var DIM_S = { build: 'BUILD-002', qa: 'QA-001', security: 'SVL-004', migration: 'MIG-001', integration: 'RLB-002', uat: 'UAT-001', training: 'HELP-007', ops: 'CUT-001' };
  var KPI_IC = { activeUsers: 'users', ordersToday: 'clipboard', okTx: 'checkc', failTx: 'xc', critical: 'alert', tickets: 'inbox', integErr: 'plug', availability: 'gauge' };
  var KPI_TONE = { ok: 'ok', warn: 'appr', crit: 'crit', info: 'info' };
  var DOM_IC = { auth: 'lock', order: 'clipboard', production: 'factory', delivery: 'truck', finance: 'coins', client: 'building', integration: 'plug' };
  var REC_T = { 'GO': 'ok', 'CONDITIONAL GO': 'warn', 'NO-GO': 'crit' };
  function failMsg(r) {
    if (!r) return L('Belum berhasil. Coba Lagi.', 'Not done. Try again.');
    var m = T(r.msg || L('Belum berhasil.', 'Not done.'));
    if (r.failed && r.failed.length) m += ' — ' + r.failed.map(gateName).join(', ');
    if (r.errors) m += ' ' + Object.keys(r.errors).map(function (k) { return T(r.errors[k]); }).join(' ');
    if (r.next) m += ' (' + T(L('langkah berikutnya: ', 'next step: ')) + (T(G.INC_FLOW_N[r.next] || G.RPL_STEP_N[r.next] || L(r.next, r.next))) + ')';
    return L(m, m);
  }
  var GATE_N = {};
  function gateName(k) { if (!GATE_N[k]) { try { (G.gates(cx()) || []).forEach(function (g) { GATE_N[g.k] = T(g.n); }); } catch (e) {} } return GATE_N[k] || k; }

  /* ---------- Shared pieces ---------- */
  function heroBox(h, o) {
    o = o || {};
    if (!h) return '';
    var live = h.st === 'LIVE';
    return '<section class="lv12-hero' + (live ? ' is-live' : '') + '"><div class="lv12-hero-b"><span class="lv12-brand">JFRESH OS</span><span class="lv12-st' + (live ? ' is-live' : '') + '">' + ic(live ? 'zap' : 'clock') + tt(h.stN) + '</span></div>' +
      '<div class="lv12-hero-f">' +
        '<div><span>' + t(live ? L('Production start', 'Production start') : L('Rencana production start', 'Planned production start')) + '</span><b>' + esc(live ? h.start : h.planned || '—') + ' WITA</b></div>' +
        '<div><span>' + t(L('Versi saat ini', 'Current version')) + '</span><b>' + esc(h.version || '—') + '</b>' + srcChip('JFIMP') + '</div>' +
        '<div><span>' + t(L('Kesehatan sistem', 'System health')) + '</span><b>' + (h.health ? A.chip(HTONE[h.health] || 'info', h.healthN || L(h.health, h.health)) : '—') + '</b>' + srcChip('JFSYS') + '</div>' +
        '<div><span>' + t(L('Keputusan Go/No-Go', 'Go/No-Go decision')) + '</span><b>' + (h.decision ? A.chip(REC_T[h.decision.decision] || 'info', L(h.decision.decision, h.decision.decision)) : t(L('Belum diputuskan', 'Not decided'))) + '</b></div>' +
      '</div>' + (o.extra || '') + '</section>';
  }
  function kpiTiles(list) {
    return P.kpis(list.map(function (k) {
      var v = k.v == null ? '—' : k.k === 'availability' ? num(k.v, 2) + '%' : num(k.v);
      return { k: k.n, v: v, icon: KPI_IC[k.k] || 'chart', tone: KPI_TONE[k.st] || null, s: srcChip(k.src), go: k.s && open(k.s) ? k.s : null };
    }), 'lv12-kp');
  }
  function domainList(ds) {
    return '<ul class="lv12-dom">' + ds.map(function (d) {
      return '<li><span class="lv12-dom-ic">' + ic(DOM_IC[d.k] || 'grid') + '</span><span class="lv12-dom-t"><b>' + tt(d.n) + '</b><small>' + esc(d.v || '—') + ' · ' + esc(d.src) + (d.incidents ? ' · ' + d.incidents + ' ' + t(L('insiden', 'incidents')) : '') + '</small></span>' + A.chip(HTONE[d.st] || 'info', HLAB[d.st] || L(d.st, d.st), d.st === 'healthy' ? 'checkc' : 'alert') + '</li>';
    }).join('') + '</ul>';
  }
  function hyperLine(hc) {
    if (!hc) return '';
    var tone = { done: 'done', active: 'now', upcoming: '', planned: '' };
    return '<ol class="lv12-hl">' + hc.days.map(function (d) {
      return '<li class="' + (tone[d.st] || '') + '"><span class="lv12-hl-d">' + (d.st === 'done' ? ic('check') : esc(d.day)) + '</span><b>' + t(L('Hari ', 'Day ')) + d.day + '</b><small>' + esc(d.date ? P.dt(d.date) : '—') + '</small><small class="num">' + d.done + '/' + d.total + '</small></li>';
    }).join('') + '</ol>';
  }
  function incRow(i) { return '<span class="mono6">' + esc(i.id) + '</span>'; }
  function incTable(list, o) {
    o = o || {};
    return P.table(list, [
      { h: L('Tiket', 'Ticket'), v: function (i) { return incRow(i) + (i.escalated ? ' ' + A.chip('crit', L('Eskalasi', 'Escalated'), 'alert') : ''); } },
      { h: L('Masalah', 'Problem'), v: function (i) { return '<b>' + tt(i.problem) + '</b><small class="sub5">' + tt(i.kindN || L(i.module, i.module)) + ' · ' + esc(i.screen || '—') + '</small>'; } },
      { h: L('Tingkat', 'Severity'), v: function (i) { return A.chip(i.tone, i.sevN); } },
      { h: L('Pelapor', 'Reporter'), v: function (i) { return esc(i.reporterName) + '<small class="sub5">' + esc(i.role || '') + '</small>'; } },
      { h: L('Owner', 'Owner'), v: function (i) { return i.ownerName ? esc(i.ownerName) : '<span class="sub5">' + t(L('Belum ditugaskan', 'Unassigned')) + '</span>'; } },
      { h: L('SLA', 'SLA'), v: function (i) { return i.open ? (i.overdue ? A.chip('crit', L('Lewat SLA', 'Past SLA'), 'clock') : A.chip('info', L('Batas ' + i.due.slice(5), 'Due ' + i.due.slice(5)), 'clock')) : '—'; } },
      { h: L('Status', 'Status'), v: function (i) { return A.chip(i.open ? 'info' : 'ok', i.stN); } }
    ], function (i) { return { t: esc(i.id) + ' · ' + tt(i.problem), r: '', s: tt(i.stN) + ' · ' + esc(i.reporterName) + (i.overdue ? ' · ' + T(L('Lewat SLA', 'Past SLA')) : ''), chip: A.chip(i.tone, i.sevN) + (i.escalated ? A.chip('crit', L('Eskalasi', 'Escalated')) : '') }; },
    function (i) { return href('LIVE-003', i.id); }, { empty: o.empty || L('Tidak ada insiden aktif.', 'No active incident.') });
  }
  function reportBtn(kind) { return A.btn(kind || 'primary', L('Laporkan Masalah', 'Report a Problem'), 'alert', { go: 'LIVE-003', rec: 'new', qs: 'from=' + (A.S.screen || ''), cls: 'btn-sm' }); }

  /* ================= LIVE-001 Go-Live Command Center ================= */
  V['LIVE-001'] = {
    render: function () {
      var c = cx(), g = G.goLive(c);
      if (!g) return err();
      var rd = g.readiness, inc = g.incidents || [];
      var readyCard = rd ? H.card(L('Kesiapan go-live', 'Go-live readiness'), '<div class="lv12-rd"><div class="lv12-rd-s"><b class="num">' + num(rd.score, 1) + '</b><small>/100</small></div><div>' + A.chip(REC_T[rd.rec] || 'info', L('Rekomendasi: ' + rd.rec, 'Recommendation: ' + rd.rec), rd.rec === 'GO' ? 'checkc' : 'alert') +
        '<p class="lv12-mute">' + (rd.failed.length ? t(L(rd.failed.length + ' hard gate gagal: ', rd.failed.length + ' hard gates fail: ')) + rd.failed.map(function (k) { return esc(gateName(k)); }).join(', ') : t(L('Semua hard gate lulus.', 'All hard gates pass.'))) + '</p></div></div>', { icon: 'gauge', link: open('LIVE-004') ? ['LIVE-004', L('Go / No-Go', 'Go / No-Go')] : null }) : '';
      return P.head(t(L('Pantau operasional setelah go-live · data langsung dari engine pemilik.', 'Monitor operations after go-live · live from the owner engines.')), reportBtn() + (open('LIVE-002') ? A.btn('ghost', L('Hypercare & Tiket', 'Hypercare & Tickets'), 'inbox', { go: 'LIVE-002', cls: 'btn-sm' }) : ''), P.fresh({ kind: 'live', src: L('JFGO · JFSYS · JFLOG · JFACCESS', 'JFGO · JFSYS · JFLOG · JFACCESS') })) +
        heroBox(g.hero) + kpiTiles(g.kpis) +
        '<div class="lv12-g2">' + H.card(L('Status sistem per domain', 'System status by domain'), domainList(g.domains), { icon: 'grid' }) +
          '<div class="lv12-col">' + readyCard + H.card(L('Timeline hypercare 30 hari', '30-day hypercare timeline'), hyperLine(g.hypercare) + (g.hypercare && !g.hypercare.live ? '<p class="lv12-mute">' + t(L('Hypercare dimulai setelah Production Start (Hari 1 = tanggal start).', 'Hypercare starts after Production Start (Day 1 = the start date).')) + '</p>' : ''), { icon: 'calendar', link: open('LIVE-002') ? ['LIVE-002', L('Checklist', 'Checklist')] : null }) + '</div></div>' +
        H.card(L('Tiket hypercare terbuka', 'Open hypercare tickets'), incTable(inc), { icon: 'inbox', count: inc.length, link: open('LIVE-002') ? ['LIVE-002', L('Semua tiket', 'All tickets')] : null });
    },
    act: {}
  };

  /* ================= LIVE-002 Hypercare (checklist + incident queue) ================= */
  V['LIVE-002'] = {
    render: function (cc) {
      var c = cx(), hc = G.hypercare(c);
      if (!hc) return err();
      var f = { st: cc.q.st || 'open', sev: cc.q.sev || '', module: cc.q.mod || '' };
      var list = G.incidents(c, { st: f.st === 'all' ? '' : f.st, sev: f.sev, module: f.module });
      var all = G.incidents(c, {}), canTick = hc.live && (can('go.incident.manage') || can('go.opt.manage'));
      var counts = {}; G.INC_FLOW.forEach(function (s) { counts[s] = 0; }); all.forEach(function (i) { counts[i.st]++; });
      var flow = '<ol class="lv12-flow">' + G.INC_FLOW.map(function (s) { return '<li class="' + (counts[s] ? 'has' : '') + '"><b class="num">' + counts[s] + '</b><span>' + tt(G.INC_FLOW_N[s]) + '</span></li>'; }).join('') + '</ol>';
      var days = '<div class="lv12-days">' + hc.days.map(function (d) {
        var tone = d.st === 'done' ? 'ok' : d.st === 'active' ? 'info' : 'mute', lab = { done: L('Selesai', 'Done'), active: L('Berjalan', 'Active'), upcoming: L('Akan datang', 'Upcoming'), planned: L('Direncanakan', 'Planned') }[d.st];
        return '<section class="card lv12-day"><div class="lv12-day-h"><b>' + t(L('Hari ', 'Day ')) + d.day + '</b><small>' + esc(d.date ? P.dt(d.date) : '—') + '</small>' + A.chip(tone, lab) + '</div><ul class="lv12-chk">' + d.items.map(function (it) {
          return '<li class="' + (it.st === 'done' ? 'done' : '') + '"><span class="lv12-ck">' + ic(it.st === 'done' ? 'checkc' : 'clock') + '</span><span class="lv12-chk-t">' + tt(it.n) + (it.by ? '<small>' + uname(it.by) + ' · ' + esc(it.at) + '</small>' : '') + '</span>' +
            (canTick ? A.btn(it.st === 'done' ? 'ghost' : 'blue', it.st === 'done' ? L('Batal', 'Undo') : L('Tandai', 'Tick'), it.st === 'done' ? 'refresh' : 'check', { act: 'tick', val: d.day + '|' + it.k + '|' + (it.st === 'done' ? 1 : 0), cls: 'btn-sm' }) : '') + '</li>';
        }).join('') + '</ul></section>';
      }).join('') + '</div>';
      var fdefs = [{ k: 'st', l: L('Status', 'Status'), opts: [['open', L('Terbuka', 'Open')], ['all', L('Semua', 'All')]].concat(G.INC_FLOW.map(function (s) { return [s, G.INC_FLOW_N[s]]; })) }, { k: 'sev', l: L('Tingkat', 'Severity'), opts: Object.keys(G.SEV).map(function (s) { return [s, G.SEV[s][0]]; }) }, { k: 'mod', l: L('Modul', 'Module'), opts: G.INC_MODULES.map(function (m) { return [m, (A.HP12 && A.HP12.INC_MOD[m]) || L(m, m)]; }) }];
      return P.head(t(L('Periode hypercare ', 'Hypercare period ')) + tt(hc.period) + (hc.live ? ' · ' + t(L('Hari ke-', 'Day ')) + hc.day : ' · ' + t(L('belum live', 'not live yet'))), reportBtn(), P.fresh({ kind: 'live', src: L('JFGO incidents', 'JFGO incidents') })) +
        (hc.live ? '' : H.note(t(L('Checklist hypercare aktif setelah Production Start. Sebelum itu, tiket dari pilot dan UAT tetap ditangani di sini.', 'The hypercare checklist activates after Production Start. Until then, pilot and UAT tickets are handled here.')), 'info', 'info')) +
        hyperLine(hc) + days +
        H.card(L('Alur insiden', 'Incident flow'), flow, { icon: 'route' }) +
        H.card(L('Tiket', 'Tickets'), A.filters(fdefs, { force: true }) + incTable(list, { empty: f.st === 'open' ? L('Tidak ada insiden aktif.', 'No active incident.') : L('Tidak ada tiket untuk filter ini.', 'No tickets for this filter.') }), { icon: 'inbox', count: list.length });
    },
    act: {
      tick: function (el) {
        var p = el.getAttribute('data-val').split('|'), r = G.tickHypercare(cx(), +p[0], p[1], { undo: p[2] === '1' });
        if (!r || !r.ok) { A.toast(failMsg(r), 'crit'); return; }
        P.after(p[2] === '1' ? L('Checklist dibuka lagi.', 'Item reopened.') : L('Checklist hypercare ditandai selesai.', 'Hypercare item ticked.'));
      }
    }
  };

  /* ================= LIVE-003 Incident Detail (rec 'new' = report form, any user, phone first) ================= */
  var STEP_ACT = {
    triage: L('TRIAGE', 'TRIAGE'), assign: L('TUGASKAN', 'ASSIGN'), investigate: L('MULAI INVESTIGASI', 'START INVESTIGATION'), fix: L('CATAT PERBAIKAN', 'RECORD FIX'),
    test: L('TES SELESAI', 'TEST DONE'), deploy: L('DEPLOY PERBAIKAN', 'DEPLOY FIX'), confirm: L('KONFIRMASI SUDAH BERES', 'CONFIRM RESOLVED'), closed: L('TUTUP TIKET', 'CLOSE TICKET')
  };
  function ownerOpts() {
    var tech = ['implead', 'superadmin', 'sysadmin', 'qalead', 'datalead', 'supervisor', 'opsmgr', 'finance', 'trainer'];
    return X.USERS.filter(function (u) { return !u.client && (u.roles || []).some(function (r) { return tech.indexOf(r.k) >= 0; }); })
      .map(function (u) { var r = (u.roles.filter(function (x) { return tech.indexOf(x.k) >= 0; })[0] || {}).k, rn = C.ROLES[r] ? C.ROLES[r].n : null; var n = (X.fullName ? X.fullName(u) : u.u); return [u.id, [n + (rn ? ' · ' + T(rn) : ''), n + (rn ? ' · ' + (rn[1] || rn[0]) : '')]]; });
  }
  function canStep(i, to) {
    var c = cx(), mgr = can('go.incident.manage'), own = i.owner === c.uid, rep = i.by === c.uid;
    return { triage: mgr, assign: mgr, investigate: mgr || own, fix: mgr || own, test: mgr || own, deploy: mgr || own, confirm: mgr || rep, closed: mgr }[to];
  }
  V['LIVE-003'] = {
    title: function (rec) { return rec === 'new' || !rec ? L('Laporkan Masalah', 'Report a Problem') : L('Insiden ' + rec, 'Incident ' + rec); },
    render: function (cc) {
      var c = cx(), rec = cc.rec;
      if (!rec || rec === 'new') {
        if (V['LIVE-003'].last) {
          var r0 = V['LIVE-003'].last; V['LIVE-003'].last = null;
          return A.pageHead(null, t(L('Terima kasih — tim go-live sudah menerima laporan Anda.', 'Thank you — the go-live team has your report.'))) + '<div class="card lv12-form">' + A.HP12.incDone(r0) + '</div>' +
            '<div class="lv12-row">' + A.btn('ghost', L('Laporkan masalah lain', 'Report another problem'), 'plus', { go: 'LIVE-003', rec: 'new' }) + '</div>';
        }
        var mine = G.incidents(c, {}).filter(function (i) { return i.by === c.uid; });
        return A.pageHead(null, t(L('Semua user bisa melapor, dari ponsel juga. Jenis kritis langsung dieskalasi (§93).', 'Every user can report, from a phone too. Critical types escalate immediately (§93).'))) +
          '<section class="card lv12-form">' + (A.HP12 ? A.HP12.incForm({ screen: cc.q.from || '', big: phone() }) : err()) + '</section>' +
          H.card(L('Laporan saya', 'My reports'), incTable(mine, { empty: L('Belum ada laporan dari Anda.', 'No reports from you yet.') }), { icon: 'inbox', count: mine.length });
      }
      var i = G.incident(c, rec);
      if (!i) return A.stateCard('noperm', L('Tiket tidak ditemukan atau di luar akses Anda.', 'The ticket was not found or is outside your access.'), A.btn('blue', L('Kembali', 'Back'), 'arrowl', { go: open('LIVE-002') ? 'LIVE-002' : 'LIVE-003', rec: open('LIVE-002') ? null : 'new' }));
      var step = '<ol class="lv12-stp">' + G.INC_FLOW.map(function (s, n) { var cl = n < i.stepIdx ? 'done' : n === i.stepIdx ? 'now' : ''; return '<li class="' + cl + '"><span>' + (n < i.stepIdx ? ic('check') : n + 1) + '</span><b>' + tt(G.INC_FLOW_N[s]) + '</b></li>'; }).join('') + '</ol>';
      var hero = P8.hero({ id: i.id, icon: 'alert', title: tt(i.problem), sub: tt(i.kindN || L('Masalah lain', 'Other problem')) + ' · ' + esc((A.HP12 && T(A.HP12.INC_MOD[i.module])) || i.module) + (i.screen ? ' · ' + esc(i.screen) : ''),
        chips: A.chip(i.tone, i.sevN) + A.chip(i.open ? 'info' : 'ok', i.stN) + (i.escalated ? A.chip('crit', L('Eskalasi segera', 'Immediate escalation'), 'alert') : '') + (i.overdue ? A.chip('crit', L('Lewat SLA', 'Past SLA'), 'clock') : ''),
        facts: [[L('Pelapor', 'Reporter'), esc(i.reporterName) + ' · ' + esc(i.role || '')], [L('Dilaporkan', 'Reported'), esc(i.at)], [L('Owner', 'Owner'), i.ownerName ? esc(i.ownerName) : t(L('Belum ditugaskan', 'Unassigned'))], [L('SLA', 'SLA'), esc(i.sla) + ' · ' + t(L('batas ', 'due ')) + esc(i.due)]] });
      var fields = H.card(L('Detail tiket (§91)', 'Ticket fields (§91)'), H.kv([
        [L('Ticket ID', 'Ticket ID'), '<span class="mono6">' + esc(i.id) + '</span>'], [L('Modul', 'Module'), esc((A.HP12 && T(A.HP12.INC_MOD[i.module])) || i.module)],
        [L('Layar', 'Screen'), i.screen ? (open(i.screen) ? '<a class="lnk5" href="' + href(i.screen) + '">' + esc(i.screen) + '</a>' : esc(i.screen)) : '—'],
        [L('Bukti', 'Evidence'), i.evidence && i.evidence.length ? i.evidence.map(function (e) { return '<span class="lv12-ev">' + ic('image') + esc(e) + '</span>'; }).join(' ') : '—'],
        [L('Root cause', 'Root cause'), i.rc ? tt(i.rc) : '—'], [L('Perbaikan', 'Fix'), i.fix ? tt(i.fix) : '—'],
        [L('Rilis', 'Release'), i.rel ? (open('OPT-004') ? '<a class="lnk5" href="' + href('OPT-004') + '">' + esc(i.rel) + '</a>' : esc(i.rel)) : '—'],
        [L('Dikonfirmasi pelapor', 'Confirmed by reporter'), i.conf ? A.chip('ok', L('Ya', 'Yes'), 'checkc') : t(L('Belum', 'Not yet'))]
      ]), { icon: 'file' });
      var log = H.card(L('Riwayat', 'History'), '<ol class="lv12-log">' + i.log.slice().reverse().map(function (l) { return '<li><b>' + tt(G.INC_FLOW_N[l[0]] || L(l[0], l[0])) + '</b><small>' + esc(l[1]) + ' · ' + (l[2] === 'system' ? 'system' : uname(l[2])) + (l[3] ? ' · ' + esc(l[3]) : '') + '</small></li>'; }).join('') + '</ol>', { icon: 'history' });
      var nx = i.next, act = '';
      if (nx && canStep(i, nx)) act = P8.xl(nx === 'closed' ? 'primary' : 'blue', STEP_ACT[nx], nx === 'closed' ? 'checkc' : 'arrow', { act: 'adv', val: nx });
      else if (nx) act = '<p class="lv12-mute">' + ic('lock') + t(L('Langkah berikutnya (' + T(G.INC_FLOW_N[nx]) + ') dikerjakan oleh ', 'Next step (' + G.INC_FLOW_N[nx][1] + ') is done by ')) + t(nx === 'confirm' ? L('pelapor atau Implementation Lead', 'the reporter or the Implementation Lead') : ['investigate', 'fix', 'test', 'deploy'].indexOf(nx) >= 0 ? L('owner tiket atau Implementation Lead', 'the ticket owner or the Implementation Lead') : L('Implementation Lead / Super Admin', 'Implementation Lead / Super Admin')) + '.</p>';
      return hero + H.card(L('Alur penanganan (§90)', 'Handling flow (§90)'), step, { icon: 'route' }) + '<div class="lv12-g2">' + fields + log + '</div>' + (act ? (phone() || A.mode() === 't' ? P8.abar(act) : '<div class="lv12-row">' + act + '</div>') : '');
    },
    act: {
      adv: function (el) {
        var to = el.getAttribute('data-val'), id = A.S.rec, i = G.incident(cx(), id); if (!i) return;
        var body = '', sub = '';
        if (to === 'triage') { body = H.fld(L('Tingkat setelah triage', 'Severity after triage'), H.sel('sev', Object.keys(G.SEV).map(function (s) { return [s, G.SEV[s][0]]; }), i.sev)); sub = G.CRITICAL_KINDS[i.kind] ? t(L('Jenis kritis: tingkat tetap Critical.', 'Critical type: severity stays Critical.')) : ''; }
        if (to === 'assign') body = H.fld(L('Penanggung jawab', 'Owner'), H.sel('owner', [['', L('Pilih', 'Choose')]].concat(ownerOpts()), i.owner || ''), { req: true });
        if (to === 'investigate') body = H.fld(L('Dugaan root cause (opsional)', 'Suspected root cause (optional)'), H.area('rc', i.rc ? T(i.rc) : ''), { wide: true });
        if (to === 'fix' || to === 'closed') body = H.fld(L('Root cause', 'Root cause'), H.area('rc', i.rc ? T(i.rc) : ''), { req: to === 'closed', wide: true }) + H.fld(L('Perbaikan', 'Fix'), H.area('fix', i.fix ? T(i.fix) : ''), { req: to === 'closed', wide: true });
        if (to === 'deploy') body = H.fld(L('Rilis', 'Release'), H.inp('release', i.rel || 'v1.0.1'));
        body += H.fld(L('Catatan', 'Note'), H.area('note', ''), { wide: true });
        H.dlg({ title: STEP_ACT[to], icon: 'arrow', ok: STEP_ACT[to], sub: (sub ? sub + ' ' : '') + t(L('Tiket ' + id + ' pindah dari ', 'Ticket ' + id + ' moves from ')) + tt(i.stN) + ' → ' + tt(G.INC_FLOW_N[to]) + '.', body: body,
          onOk: function (v, e2) { v = P.vals(e2); var r = G.advanceIncident(cx(), id, to, { sev: v.sev, owner: v.owner, rc: v.rc, fix: v.fix, release: v.release, note: v.note || null }); if (!r || !r.ok) return failMsg(r); P.after(to === 'closed' ? L('Tiket ditutup (INCIDENT_CLOSED).', 'Ticket closed (INCIDENT_CLOSED).') : L('Tiket diperbarui: ' + T(G.INC_FLOW_N[to]), 'Ticket updated: ' + G.INC_FLOW_N[to][1])); return true; } });
      }
    }
  };
  if (A.HP12) A.HP12.onInc = function (r) {
    if (A.S.screen !== 'LIVE-003') return;
    A.toast(L('Laporan ' + r.incident.id + ' terkirim.', 'Report ' + r.incident.id + ' sent.'));
    if (open('LIVE-003') && G.incident(cx(), r.incident.id)) { A.go('LIVE-003', r.incident.id); return; }
    V['LIVE-003'].last = r; A.rerender();
  };

  /* ================= LIVE-004 Go / No-Go ================= */
  V['LIVE-004'] = {
    render: function () {
      var c = cx(), rd = G.readiness(c);
      if (!rd) return err();
      var tone = REC_T[rd.rec] || 'info', decs = G.decisions(c), last = decs[0], live = G.isLive();
      var score = '<section class="card lv12-score"><div class="lv12-score-r">' + H.ring(rd.score, { size: 132, band: { tone: tone === 'crit' ? 'crit' : tone === 'warn' ? 'warn' : 'ok', n: rd.recN }, label: L('Skor kesiapan', 'Readiness score') }) + '</div>' +
        '<div class="lv12-score-t"><span class="lv12-mute">' + t(L('Rekomendasi sistem (§94–§95)', 'System recommendation (§94–§95)')) + '</span><b class="lv12-rec lv12-rec-' + tone + '">' + esc(rd.rec) + '</b>' +
        '<p>' + t(rd.failed.length ? L('NO-GO karena ' + rd.failed.length + ' hard gate gagal. Perbaiki dulu di layar sumbernya.', 'NO-GO because ' + rd.failed.length + ' hard gates fail. Fix them first on their source screens.') : rd.score >= 85 ? L('Semua gate lulus dan skor ≥ 85.', 'All gates pass and the score is ≥ 85.') : L('Gate lulus; skor 70–85 → CONDITIONAL GO dengan syarat.', 'Gates pass; score 70–85 → CONDITIONAL GO with conditions.')) + '</p>' +
        '<p class="lv12-mute">' + t(L('Keputusan akhir tetap keputusan manusia yang berwenang (Owner / Product Owner).', 'The final decision remains an authorised human decision (Owner / Product Owner).')) + '</p></div></section>';
      var dims = H.card(L('Dimensi berbobot (§94)', 'Weighted dimensions (§94)'), P.table(rd.dims, [
        { h: L('Dimensi', 'Dimension'), v: function (d) { return (open(DIM_S[d.k]) ? '<a class="lnk5" href="' + href(DIM_S[d.k]) + '">' + tt(d.n) + '</a>' : tt(d.n)); } },
        { h: L('Bobot', 'Weight'), cls: 'r num', v: function (d) { return d.w + '%'; } },
        { h: L('Nilai', 'Value'), cls: 'r num', v: function (d) { return d.missing ? A.chip('warn', L('Tidak ada data', 'No data')) : num(d.v, 1) + '%'; } },
        { h: L('Poin', 'Points'), cls: 'r num', v: function (d) { return '<b>' + num(d.pts, 2) + '</b>'; } },
        { h: L('Sumber', 'Source'), v: function (d) { return srcChip(d.src); } }
      ], function (d) { return { t: tt(d.n) + ' · ' + d.w + '%', r: d.missing ? '—' : num(d.v, 1) + '%', s: T(L('Poin ', 'Points ')) + num(d.pts, 2) + ' · ' + esc(d.src) }; }) + '<p class="lv12-tot">' + t(L('Total', 'Total')) + ' <b class="num">' + num(rd.score, 1) + '</b> / 100</p>', { icon: 'chart' });
      var gates = H.card(L('Hard gate (§95)', 'Hard gates (§95)'), '<ul class="lv12-gates">' + rd.gates.map(function (g) {
        var v = Array.isArray(g.v) ? g.v.map(esc).join(', ') : typeof g.v === 'object' && g.v ? tt(g.v) : esc(g.v);
        return '<li class="' + (g.ok ? 'ok' : 'fail') + '"><span class="lv12-gi">' + ic(g.ok ? 'checkc' : 'xc') + '</span><span class="lv12-gt"><b>' + tt(g.n) + '</b><small>' + (g.ok ? t(L('Lulus', 'Pass')) : t(L('GAGAL', 'FAIL')) + (v ? ' · ' + v : '')) + (g.unknown ? ' · ' + t(L('engine tidak tersedia = gagal', 'engine missing = fail')) : '') + ' · ' + esc(g.src) + '</small></span>' +
          (open(GATE_S[g.k]) ? '<a class="btn btn-ghost btn-sm" href="' + href(GATE_S[g.k]) + '">' + t(L('Buka', 'Open')) + '</a>' : '') + '</li>';
      }).join('') + '</ul>', { icon: 'shield', count: rd.failed.length ? rd.failed.length + ' ' + T(L('gagal', 'failed')) : null });
      var hist = H.card(L('Riwayat keputusan', 'Decision history'), decs.length ? '<ol class="lv12-log">' + decs.map(function (d) { return '<li><b>' + A.chip(REC_T[d.decision] || 'info', L(d.decision, d.decision)) + ' ' + esc(d.byName) + '</b><small>' + esc(d.at) + ' · ' + t(L('skor ', 'score ')) + num(d.score, 1) + ' · ' + t(L('rekomendasi ', 'recommendation ')) + esc(d.rec) + ' · ' + esc(d.reason) + (d.conditions ? ' · ' + t(L('syarat: ', 'conditions: ')) + esc(d.conditions) : '') + '</small></li>'; }).join('') + '</ol>' : A.empty(L('Belum ada keputusan Go/No-Go.', 'No Go/No-Go decision yet.')), { icon: 'history' });
      var actions = '';
      if (live) actions = H.note(t(L('Production sudah dimulai — keputusan terkunci.', 'Production has started — the decision is locked.')), 'lock', 'info');
      else if (can('go.golive.approve')) {
        actions = P.deskOnly(L('Keputusan Go/No-Go diambil di PC atau iPad.', 'The Go/No-Go decision is taken on a PC or iPad.')) +
          '<section class="card lv12-dec hide-m"><h2>' + t(L('Keputusan Go / No-Go', 'Go / No-Go decision')) + '</h2><p class="lv12-mute">' + t(L('Pilih keputusan Anda. Sistem menolak GO / CONDITIONAL GO selama ada hard gate gagal.', 'Choose your decision. The system refuses GO / CONDITIONAL GO while a hard gate fails.')) + '</p>' +
          '<div class="lv12-dec-b">' + P8.xl('primary', L('GO', 'GO'), 'checkc', { act: 'decide', val: 'GO' }) + P8.xl('blue', L('CONDITIONAL GO', 'CONDITIONAL GO'), 'alert', { act: 'decide', val: 'CONDITIONAL GO' }) + P8.xl('danger', L('NO-GO', 'NO-GO'), 'ban', { act: 'decide', val: 'NO-GO' }) + '</div></section>';
      } else actions = H.note(t(L('Keputusan akhir diambil oleh Owner / Product Owner. Anda melihat rekomendasi dan gate.', 'The final decision is taken by the Owner / Product Owner. You see the recommendation and the gates.')), 'lock', 'info');
      return P.head(last ? t(L('Keputusan terakhir: ', 'Last decision: ')) + esc(last.decision) + ' · ' + esc(last.byName) + ' · ' + esc(last.at) : t(L('Belum ada keputusan.', 'No decision yet.')), '', P.fresh({ kind: 'live', src: L('JFIMP · JFGO · JFHELP', 'JFIMP · JFGO · JFHELP') })) +
        score + actions + '<div class="lv12-g2">' + gates + dims + '</div>' + hist;
    },
    act: {
      decide: function (el) {
        var d = el.getAttribute('data-val'), rd = G.readiness(cx());
        var what = { 'GO': L('Anda menyatakan JFRESH OS SIAP go-live. Production Start (CUT-007) bisa dijalankan setelah ini.', 'You declare JFRESH OS READY to go live. Production Start (CUT-007) can run after this.'),
          'CONDITIONAL GO': L('Go-live boleh dengan syarat yang Anda tulis; syarat dicatat dan diaudit.', 'Go-live is allowed with the conditions you write; they are recorded and audited.'),
          'NO-GO': L('Go-live ditunda. Production Start tetap terkunci sampai ada keputusan GO.', 'Go-live is postponed. Production Start stays locked until a GO decision.') }[d];
        var warn = d !== 'NO-GO' && rd && rd.failed.length ? '<div class="note5 n-crit">' + ic('alert') + '<span><b>' + t(L('Akan ditolak — hard gate gagal:', 'Will be refused — hard gates fail:')) + '</b><ul>' + rd.failed.map(function (k) { return '<li>' + esc(gateName(k)) + '</li>'; }).join('') + '</ul></span></div>' : '';
        P.reasonDlg({ title: L('Konfirmasi keputusan: ' + d, 'Confirm decision: ' + d), icon: d === 'NO-GO' ? 'ban' : 'checkc', ok: L('Ya, putuskan ' + d, 'Yes, decide ' + d),
          sub: t(what) + ' ' + t(L('Skor saat ini ', 'Current score ')) + num(rd && rd.score, 1) + ' · ' + t(L('rekomendasi ', 'recommendation ')) + esc(rd && rd.rec) + '.',
          body: warn + (d === 'CONDITIONAL GO' ? H.fld(L('Syarat Conditional GO', 'Conditional GO conditions'), H.area('conditions', '', L('mis. UT-010 ditutup sebelum 31 Okt', 'e.g. UT-010 closed before 31 Oct')), { req: true, wide: true }) : ''),
          label: L('Alasan keputusan', 'Reason for the decision'),
          fn: function (reason, v) { var r = G.decide(cx(), d, reason, { conditions: v.conditions }); return r && r.ok ? r : { ok: false, msg: failMsg(r) }; },
          done: L('Keputusan ' + d + ' tercatat (GOLIVE).', 'Decision ' + d + ' recorded (GOLIVE).') });
      }
    }
  };

  /* ================= OPT-001 30/60/90 Review ================= */
  var RV_ST = { planned: ['info', L('Direncanakan', 'Planned')], in_progress: ['warn', L('Berjalan', 'In progress')], done: ['ok', L('Selesai', 'Done')] };
  V['OPT-001'] = {
    render: function () {
      var c = cx(), rv = G.reviews(c), mg = can('go.opt.manage') && !phone();
      if (!rv.length) return err();
      var cols = '<div class="lv12-rv">' + rv.map(function (r) {
        var st = RV_ST[r.st] || RV_ST.planned, done = r.topics.filter(function (x) { return x.st === 'done'; }).length;
        return '<section class="card lv12-rvc"><div class="lv12-rvc-h"><span class="lv12-rvd num">' + r.day + '</span><div><b>' + tt(r.focus) + '</b><small>' + t(L('Review ' + r.day + ' hari · ', r.day + '-day review · ')) + esc(P.dt(r.due)) + (r.planned ? ' · ' + t(L('tanggal rencana', 'planned date')) : '') + '</small></div>' + A.chip(st[0], st[1]) + '</div>' +
          P.prog(done, r.topics.length, done === r.topics.length ? 'healthy' : 'watch') +
          '<ul class="lv12-chk">' + r.topics.map(function (tp, n) { return '<li class="' + (tp.st === 'done' ? 'done' : '') + '"><span class="lv12-ck">' + ic(tp.st === 'done' ? 'checkc' : 'clock') + '</span><span class="lv12-chk-t">' + tt(tp.n) + (tp.note ? '<small>' + esc(tp.note) + '</small>' : '') + '</span>' + (mg && tp.st !== 'done' ? A.btn('ghost', L('Selesai', 'Done'), 'check', { act: 'topic', val: r.id + '|' + n, cls: 'btn-sm' }) : '') + '</li>'; }).join('') + '</ul>' +
          '<div class="lv12-find"><b>' + t(L('Temuan', 'Findings')) + '</b>' + (r.findings.length ? '<ul>' + r.findings.map(function (f) { return '<li>' + tt(f.t) + '<small>' + uname(f.by) + ' · ' + esc(f.at) + '</small></li>'; }).join('') + '</ul>' : '<p class="lv12-mute">' + t(L('Belum ada temuan.', 'No findings yet.')) + '</p>') + '</div>' +
          (mg ? '<div class="lv12-row">' + A.btn('ghost', L('Tambah temuan', 'Add finding'), 'plus', { act: 'finding', val: r.id, cls: 'btn-sm' }) + A.btn('blue', L('Ubah status', 'Change status'), 'edit', { act: 'rvst', val: r.id, cls: 'btn-sm' }) + '</div>' : '') + '</section>';
      }).join('') + '</div>';
      return P.head(t(L('30 hari STABILIZE · 60 hari OPTIMIZE · 90 hari SCALE (§98–§100).', '30 days STABILIZE · 60 days OPTIMIZE · 90 days SCALE (§98–§100).')), (open('OPT-002') ? A.btn('ghost', L('Adoption', 'Adoption'), 'chart', { go: 'OPT-002', cls: 'btn-sm' }) : '') + (open('OPT-003') ? A.btn('ghost', L('Backlog', 'Backlog'), 'list', { go: 'OPT-003', cls: 'btn-sm' }) : '') + (open('OPT-004') ? A.btn('ghost', L('Release Plan', 'Release Plan'), 'route', { go: 'OPT-004', cls: 'btn-sm' }) : ''), P.fresh({ kind: 'live', src: L('JFGO reviews', 'JFGO reviews') })) +
        P.deskOnly() + cols;
    },
    act: {
      topic: function (el) { var p = el.getAttribute('data-val').split('|'); P.reasonDlg({ title: L('Topik review selesai', 'Review topic done'), icon: 'check', ok: L('Tandai selesai', 'Mark done'), body: H.fld(L('Catatan', 'Note'), H.inp('note', '')), fn: function (reason, v) { return G.updateReview(cx(), p[0], { topic: +p[1], topicSt: 'done', note: v.note || null }, reason); }, done: L('Topik ditandai selesai.', 'Topic marked done.') }); },
      finding: function (el) { var id = el.getAttribute('data-val'); P.reasonDlg({ title: L('Temuan review ' + id, 'Review finding ' + id), icon: 'plus', ok: L('Simpan', 'Save'), body: H.fld(L('Temuan', 'Finding'), H.area('finding', ''), { req: true, wide: true }), fn: function (reason, v) { if (!v.finding) return { ok: false, msg: L('Tulis temuannya.', 'Write the finding.') }; return G.updateReview(cx(), id, { finding: v.finding }, reason); }, done: L('Temuan tersimpan.', 'Finding saved.') }); },
      rvst: function (el) { var id = el.getAttribute('data-val'); P.reasonDlg({ title: L('Status review ' + id, 'Review status ' + id), icon: 'edit', ok: L('Simpan', 'Save'), body: H.fld(L('Status', 'Status'), H.sel('st', Object.keys(RV_ST).map(function (k) { return [k, RV_ST[k][1]]; }), 'in_progress')), fn: function (reason, v) { return G.updateReview(cx(), id, { st: v.st }, reason); }, done: L('Status review diperbarui.', 'Review status updated.') }); }
    }
  };

  /* ================= OPT-002 Adoption Dashboard ================= */
  V['OPT-002'] = {
    render: function () {
      var c = cx(), ad = G.adoption(c), kr = G.kpiRefs(c), ins = G.helpInsight(c);
      if (!ad) return err();
      var HL = window.JFHELP;
      if ((!ins || !ins.length) && HL && can('help.analytics')) { var an = HL.analytics(c); ins = an ? an.topSearches.slice(0, 5).map(function (s) { return { term: s.term, n: s.count, src: 'JFHELP.analytics', top: s.top }; }) : []; }
      var HLk = HL ? (HL.kpis(c) || []) : [];
      ad = ad.map(function (k) { if (k.k === 'help' && k.v == null) { var hk = HLk.filter(function (x) { return x.k === 'helpUsage'; })[0]; if (hk) return Object.assign({}, k, { v: hk.v, u: T(hk.u), src: 'JFHELP.kpis' }); } return k; });
      var AD_IC = { dau: 'users', activePct: 'usercheck', feature: 'grid', portal: 'building', self: 'pointer', help: 'help', tutorial: 'target', tickets: 'inbox' };
      var tiles = P.kpis(ad.map(function (k) { return { k: k.n, v: k.v == null ? '—' : num(k.v) + (k.u === '%' ? '%' : ''), s: (k.u && k.u !== '%' ? esc(k.u) + ' · ' : '') + srcChip(k.src), icon: AD_IC[k.k] || 'chart' }; }), 'lv12-kp');
      function refRow(n, v, u, src) { return { n: n, v: v == null ? '—' : num(v, 1) + (u || ''), src: src }; }
      var pr = kr && kr.ops.prod ? kr.ops.prod.d30 || kr.ops.prod.today || {} : {}, lg = kr && kr.ops.logi || {}, dl = kr && kr.ops.dlv || {}, ag = kr && kr.finance.aging || {}, hp = kr && kr.finance.hpp || null, sk = kr && kr.system.kpis || [];
      function refTable(rows) { return '<ul class="lv12-refl">' + rows.map(function (r) { return '<li><span class="lv12-chk-t">' + t(r.n) + '<small>' + srcChip(r.src) + '</small></span><b class="num">' + r.v + '</b></li>'; }).join('') + '</ul>'; }
      var ops = refTable([refRow(L('Cycle time (jam)', 'Cycle time (h)'), pr.cycleH, '', 'JFPROD.kpi'), refRow(L('SLA on-time delivery', 'SLA on-time delivery'), dl.otd, '%', 'JFDLV.kpi'), refRow(L('Rewash', 'Rewash'), pr.rewash, '%', 'JFPROD.kpi'), refRow(L('QC lulus', 'QC pass'), pr.qcPass, '%', 'JFPROD.kpi'), refRow(L('Akurasi handover', 'Handover accuracy'), pr.hoAcc, '%', 'JFPROD.kpi'), refRow(L('Produktivitas (kg/jam)', 'Productivity (kg/h)'), pr.perHour, '', 'JFPROD.kpi'), refRow(L('Pickup tepat waktu', 'Pickup on time'), lg.pickOn, '%', 'JFLOG.kpi')]);
      var fin = refTable([refRow(L('AR total (Rp jt)', 'AR total (Rp m)'), ag.total != null ? ag.total / 1e6 : null, '', 'JFFIN.aging'), refRow(L('AR overdue', 'AR overdue'), ag.overduePct, '%', 'JFFIN.aging'), refRow(L('DSO (hari)', 'DSO (days)'), ag.dso, '', 'JFFIN.aging'), { n: L('HPP versi', 'HPP version'), v: hp ? 'v' + esc(hp.v) + ' · ' + esc(hp.p || '') : '—', src: 'JFFIN.hppLast' }]);
      var sys = refTable(sk.slice(0, 6).map(function (k) { return { n: k.n || L(k.k, k.k), v: k.v == null ? '—' : num(k.v, 1) + (k.u ? esc(typeof k.u === 'string' ? k.u : T(k.u)) : ''), src: 'JFSYS.kpis' }; }));
      var insight = H.card(L('Smart Help insight (§105)', 'Smart Help insight (§105)'), ins && ins.length ? '<ul class="lv12-ins">' + ins.map(function (s, n) { return '<li><span class="num lv12-insn">' + (n + 1) + '</span><span class="lv12-chk-t"><b>"' + esc(s.term) + '"</b><small>' + (s.note ? tt(s.note) : t(L('Dicari ' + s.n + '× — UI atau training mungkin perlu diperbaiki.', 'Searched ' + s.n + '× — the UI or training may need improvement.'))) + '</small></span><b class="num">' + esc(s.n) + '</b></li>'; }).join('') + '</ul>' : A.empty(L('Belum ada data pencarian bantuan.', 'No help search data yet.')), { icon: 'bulb', link: open('HELP-006') ? ['HELP-006', L('Analytics bantuan', 'Help analytics'), null] : null });
      return P.head(t(L('Adopsi, operasional, finance dan sistem — diambil dari fungsi KPI engine pemilik, tidak dihitung ulang (§101–§104).', 'Adoption, operations, finance and system — taken from the owner engines\' KPI functions, not recomputed (§101–§104).')), '', P.fresh({ kind: 'live', src: L('JFACCESS · JFCLP · JFLOG · JFHELP · JFPROD · JFDLV · JFFIN · JFSYS', 'JFACCESS · JFCLP · JFLOG · JFHELP · JFPROD · JFDLV · JFFIN · JFSYS') })) +
        P.deskOnly() + '<h2 class="lv12-h2">' + t(L('Adopsi sistem', 'System adoption')) + '</h2>' + tiles +
        '<div class="lv12-g3 hide-m">' + H.card(L('Operasional', 'Operations'), ops, { icon: 'factory' }) + H.card(L('Finance', 'Finance'), fin, { icon: 'coins' }) + H.card(L('Sistem', 'System'), sys || A.empty(L('Belum ada data.', 'No data yet.')), { icon: 'gauge' }) + '</div>' + insight;
    },
    act: {}
  };

  /* ================= OPT-003 Improvement Backlog ================= */
  var BKL_T = { P0: 'crit', P1: 'warn', P2: 'info', P3: 'mute' };
  var BKL_STN = { 'new': L('Baru', 'New'), planned: L('Direncanakan', 'Planned'), in_progress: L('Berjalan', 'In progress'), done: L('Selesai', 'Done'), rejected: L('Ditolak', 'Rejected') };
  var BKL_STT = { 'new': 'info', planned: 'info', in_progress: 'warn', done: 'ok', rejected: 'mute' };
  var BKL_MOD = ['production', 'logistics', 'delivery', 'finance', 'commercial', 'client', 'reporting', 'system', 'help'];
  function relOpts() { return [['', L('—', '—')]].concat(G.releasePlans(cx()).map(function (r) { return [r.version, L(r.version, r.version)]; })); }
  V['OPT-003'] = {
    render: function (cc) {
      var c = cx(), mg = can('go.opt.manage') && !phone();
      var rows = G.backlog(c, { pri: cc.q.pri || '', st: cc.q.st || '', module: cc.q.mod || '' }), all = G.backlog(c, {});
      var cnt = {}; Object.keys(G.BKL_PRI).forEach(function (k) { cnt[k] = all.filter(function (b) { return b.pri === k && b.st !== 'done' && b.st !== 'rejected'; }).length; });
      var fdefs = [{ k: 'pri', l: L('Prioritas', 'Priority'), opts: Object.keys(G.BKL_PRI).map(function (k) { return [k, G.BKL_PRI[k]]; }) }, { k: 'st', l: L('Status', 'Status'), opts: G.BKL_ST.map(function (s) { return [s, BKL_STN[s]]; }) }, { k: 'mod', l: L('Modul', 'Module'), opts: BKL_MOD.map(function (m) { return [m, L(m, m)]; }) }];
      return P.head(t(L('Request ID, masalah, modul, dampak bisnis, prioritas P0–P3, owner, effort, target rilis, status (§106).', 'Request ID, problem, module, business impact, priority P0–P3, owner, effort, target release, status (§106).')), mg ? A.btn('primary', L('Permintaan Baru', 'New Request'), 'plus', { act: 'bklNew', cls: 'btn-sm' }) : '', P.fresh({ kind: 'live', src: L('JFGO backlog · sumber: UAT, usability, insiden', 'JFGO backlog · sources: UAT, usability, incidents') })) +
        P.deskOnly() + P.kpis(Object.keys(G.BKL_PRI).map(function (k) { return { k: G.BKL_PRI[k], v: cnt[k], icon: k === 'P0' ? 'alert' : 'list', tone: k === 'P0' && cnt[k] ? 'crit' : k === 'P1' && cnt[k] ? 'appr' : null, go: 'OPT-003', q: { pri: k } }; })) +
        '<div class="card">' + A.filters(fdefs, { force: true }) + P.table(rows, [
          { h: L('ID', 'ID'), v: function (b) { return P.mono(b.id); } },
          { h: L('Masalah', 'Problem'), v: function (b) { return '<b>' + tt(b.problem) + '</b>' + (b.src ? '<small class="sub5">' + t(L('dari ', 'from ')) + (/^INC-/.test(b.src) && open('LIVE-003') ? '<a class="lnk5" href="' + href('LIVE-003', b.src) + '">' + esc(b.src) + '</a>' : /^UT-/.test(b.src) && open('UAT-002') ? '<a class="lnk5" href="' + href('UAT-002', b.src) + '">' + esc(b.src) + '</a>' : esc(b.src)) + '</small>' : ''); } },
          { h: L('Modul', 'Module'), v: function (b) { return esc(b.module); } },
          { h: L('Dampak bisnis', 'Business impact'), v: function (b) { return b.impact ? tt(b.impact) : '—'; } },
          { h: L('Prioritas', 'Priority'), v: function (b) { return A.chip(BKL_T[b.pri] || 'info', b.priN); } },
          { h: L('Owner', 'Owner'), v: function (b) { return b.ownerName ? esc(b.ownerName) : '—'; } },
          { h: L('Effort', 'Effort'), cls: 'c', v: function (b) { return esc(b.effort || '—'); } },
          { h: L('Target rilis', 'Target release'), v: function (b) { return b.rel ? esc(b.rel) : '—'; } },
          { h: L('Status', 'Status'), v: function (b) { return A.chip(BKL_STT[b.st] || 'info', BKL_STN[b.st] || L(b.st, b.st)); } },
          { h: '', v: function (b) { return mg ? A.btn('ghost', L('Ubah', 'Update'), 'edit', { act: 'bklEdit', val: b.id, cls: 'btn-sm' }) : ''; } }
        ], function (b) { return { t: esc(b.id) + ' · ' + tt(b.problem), r: esc(b.pri), s: esc(b.module) + ' · ' + (b.rel || '—'), chip: A.chip(BKL_STT[b.st] || 'info', BKL_STN[b.st]) }; }, null, { empty: L('Belum ada permintaan perbaikan.', 'No improvement request yet.') }) + '</div>';
    },
    act: {
      bklNew: function () {
        H.dlg({ title: L('Permintaan perbaikan baru', 'New improvement request'), icon: 'plus', ok: L('Simpan', 'Save'),
          body: H.fld(L('Masalah', 'Problem'), H.area('problem', ''), { req: true, wide: true }) + '<div class="fgrid f2">' + H.fld(L('Modul', 'Module'), H.sel('module', BKL_MOD.map(function (m) { return [m, L(m, m)]; }), 'production'), { req: true }) + H.fld(L('Prioritas', 'Priority'), H.sel('pri', Object.keys(G.BKL_PRI).map(function (k) { return [k, G.BKL_PRI[k]]; }), 'P2'), { req: true }) +
            H.fld(L('Owner', 'Owner'), H.sel('owner', [['', L('—', '—')]].concat(ownerOpts()), '')) + H.fld(L('Effort', 'Effort'), H.sel('effort', [['S', L('S', 'S')], ['M', L('M', 'M')], ['L', L('L', 'L')]], 'M')) + H.fld(L('Target rilis', 'Target release'), H.sel('rel', relOpts(), '')) + H.fld(L('Sumber (opsional)', 'Source (optional)'), H.inp('src', '', { ph: L('mis. INC-0002, UT-010', 'e.g. INC-0002, UT-010') })) + '</div>' +
            H.fld(L('Dampak bisnis', 'Business impact'), H.area('impact', ''), { wide: true }),
          onOk: function (v, el) { v = P.vals(el); if (!v.problem) return L('Tulis masalahnya.', 'Describe the problem.'); var r = G.addBacklog(cx(), { problem: v.problem, module: v.module, pri: v.pri, impact: v.impact || null, owner: v.owner || null, effort: v.effort, rel: v.rel || null, src: v.src || null }); if (!r || !r.ok) return failMsg(r); P.after(L('Permintaan ' + r.item.id + ' ditambahkan.', 'Request ' + r.item.id + ' added.')); return true; } });
      },
      bklEdit: function (el) {
        var id = el.getAttribute('data-val'), b = G.backlog(cx(), {}).filter(function (x) { return x.id === id; })[0]; if (!b) return;
        P.reasonDlg({ title: L('Ubah ' + id, 'Update ' + id), icon: 'edit', ok: L('Simpan', 'Save'), sub: tt(b.problem),
          body: '<div class="fgrid f2">' + H.fld(L('Status', 'Status'), H.sel('st', G.BKL_ST.map(function (s) { return [s, BKL_STN[s]]; }), b.st)) + H.fld(L('Prioritas', 'Priority'), H.sel('pri', Object.keys(G.BKL_PRI).map(function (k) { return [k, G.BKL_PRI[k]]; }), b.pri)) +
            H.fld(L('Owner', 'Owner'), H.sel('owner', [['', L('—', '—')]].concat(ownerOpts()), b.owner || '')) + H.fld(L('Effort', 'Effort'), H.sel('effort', [['S', L('S', 'S')], ['M', L('M', 'M')], ['L', L('L', 'L')]], b.effort || 'M')) + H.fld(L('Target rilis', 'Target release'), H.sel('rel', relOpts(), b.rel || '')) + '</div>',
          fn: function (reason, v) { return G.updateBacklog(cx(), id, { st: v.st, pri: v.pri, owner: v.owner || null, effort: v.effort, rel: v.rel || null }, reason); }, done: L(id + ' diperbarui.', id + ' updated.') });
      }
    }
  };

  /* ================= OPT-004 Release Plan + rollback plan ================= */
  var RS_T = { done: 'ok', skipped: 'mute', todo: 'info' };
  V['OPT-004'] = {
    render: function (cc) {
      var c = cx(), list = G.releasePlans(c), mg = can('go.opt.manage');
      if (!list.length) return A.stateCard('empty', L('Belum ada rencana rilis.', 'No release plan yet.'));
      var cur = cc.q.r && list.filter(function (r) { return r.id === cc.q.r; })[0] || list[0];
      var tabs = H.tabs(list.map(function (r) { return [r.id, L(r.version + ' · ' + T(r.n), r.version + ' · ' + (r.n[1] || r.n[0])), r.major ? 'star' : 'tag']; }), cur.id, 'r', { def: list[0].id });
      var steps = '<ol class="lv12-stp lv12-stp8">' + G.RPL_STEPS.map(function (k, n) { var s = cur.steps[k] || {}, cl = s.st === 'done' ? 'done' : s.st === 'skipped' ? 'skip' : k === cur.next ? 'now' : ''; return '<li class="' + cl + '"><span>' + (s.st === 'done' ? ic('check') : s.st === 'skipped' ? ic('minus') : n + 1) + '</span><b>' + tt(G.RPL_STEP_N[k]) + '</b>' + (s.at ? '<small>' + esc(s.at.slice(5)) + '</small>' : '') + '</li>'; }).join('') + '</ol>';
      var rb = cur.rb || {};
      var rbCard = H.card(L('Rollback plan (§108)', 'Rollback plan (§108)'), H.kv([[L('Kembali ke versi', 'Roll back to version'), esc(rb.version || '—')], [L('Database', 'Database'), rb.db ? tt(rb.db) : '—'], [L('Penanggung jawab', 'Owner'), rb.owner ? uname(rb.owner) : '—'], [L('Komunikasi', 'Communication'), rb.comm ? tt(rb.comm) : '—'], [L('Validasi', 'Validation'), rb.validation ? tt(rb.validation) : '—']]) +
        (cur.hasRollback ? H.note(t(L('Rollback plan lengkap — deploy diizinkan.', 'Rollback plan complete — deploy allowed.')), 'checkc', 'ok') : H.note(t(L('Rollback plan belum lengkap — deploy akan ditolak.', 'Rollback plan incomplete — deploy will be refused.')), 'alert', 'crit')), { icon: 'refresh' });
      var info = H.card(L('Rilis', 'Release'), H.kv([[L('Versi', 'Version'), '<b>' + esc(cur.version) + '</b> ' + (cur.major ? A.chip('appr', L('Mayor — UAT wajib', 'Major — UAT required'), 'star') : A.chip('info', L('Minor', 'Minor')))], [L('Target', 'Target'), esc(P.dt(cur.target))], [L('Progres', 'Progress'), P.prog(cur.progress, 100, 'watch') + ' <span class="num">' + cur.progress + '%</span>'], [L('Release pipeline JFIMP', 'JFIMP release pipeline'), cur.impRelease ? (open('IMP-003') ? '<a class="lnk5" href="' + href('IMP-003', typeof cur.impRelease === 'string' ? cur.impRelease : null) + '">' + esc(cur.impRelease) + '</a>' : esc(cur.impRelease)) : t(L('Belum terhubung', 'Not linked'))], [L('Langkah berikutnya', 'Next step'), cur.next ? '<b>' + tt(G.RPL_STEP_N[cur.next]) + '</b>' : A.chip('ok', L('Semua langkah selesai', 'All steps done'), 'checkc')]]), { icon: 'tag' });
      var act = '';
      if (mg && cur.next) {
        var isDeploy = cur.next === 'deploy';
        act = (isDeploy ? P.deskOnly(L('Deploy ke production hanya dari PC atau iPad.', 'Deploy to production only from a PC or iPad.')) : '') + '<div class="lv12-row' + (isDeploy ? ' hide-m' : '') + '">' + P8.xl(isDeploy ? 'primary' : 'blue', L('Selesaikan: ' + T(G.RPL_STEP_N[cur.next]), 'Complete: ' + G.RPL_STEP_N[cur.next][1]), isDeploy ? 'upload' : 'check', { act: 'rplStep', val: cur.id + '|' + cur.next }) +
          (cur.next === 'uat' && !cur.major ? A.btn('ghost', L('Lewati UAT (rilis minor)', 'Skip UAT (minor release)'), 'minus', { act: 'rplSkip', val: cur.id }) : '') + '</div>';
      } else if (!mg) act = H.note(t(L('Langkah rilis dijalankan oleh Implementation Lead.', 'Release steps are run by the Implementation Lead.')), 'lock', 'info');
      return P.head(t(L('Build → QA → Regression → UAT bila perlu → Backup → Deploy → Smoke Test → Monitor (§107).', 'Build → QA → Regression → UAT when needed → Backup → Deploy → Smoke Test → Monitor (§107).')), '', P.fresh({ kind: 'live', src: L('JFGO release plan · JFIMP · JFSYS backup', 'JFGO release plan · JFIMP · JFSYS backup') })) +
        tabs + H.card(L('Pipeline rilis ' + cur.version, 'Release pipeline ' + cur.version), steps, { icon: 'route' }) + act + '<div class="lv12-g2">' + info + rbCard + '</div>';
    },
    act: {
      rplStep: function (el) {
        var p = el.getAttribute('data-val').split('|'), pl = G.releasePlan(cx(), p[0]), step = p[1];
        var what = { build: L('Build rilis dinyatakan selesai.', 'The release build is declared complete.'), qa: L('QA lulus untuk rilis ini.', 'QA passed for this release.'), regression: L('Regression suite lulus.', 'The regression suite passed.'), uat: L('UAT rilis ini lulus.', 'UAT passed for this release.'), backup: L('Sistem memeriksa backup JFSYS yang sukses ≤ 24 jam.', 'The system checks for a successful JFSYS backup ≤ 24 h.'), deploy: L('Rilis ' + pl.version + ' di-deploy ke production (RELEASE_DEPLOYED). Rollback plan: kembali ke ' + (pl.rb && pl.rb.version) + '.', 'Release ' + pl.version + ' is deployed to production (RELEASE_DEPLOYED). Rollback plan: back to ' + (pl.rb && pl.rb.version) + '.'), smoke: L('Smoke test pasca deploy lulus.', 'The post-deploy smoke test passed.'), monitor: L('Monitoring pasca rilis selesai.', 'Post-release monitoring done.') }[step];
        if (step === 'deploy' && phone()) { A.toast(L('Deploy hanya dari PC atau iPad.', 'Deploy only from a PC or iPad.'), 'crit'); return; }
        P.reasonDlg({ title: L('Konfirmasi: ' + T(G.RPL_STEP_N[step]), 'Confirm: ' + G.RPL_STEP_N[step][1]), icon: step === 'deploy' ? 'upload' : 'check', ok: step === 'deploy' ? L('Ya, deploy ' + pl.version, 'Yes, deploy ' + pl.version) : L('Ya, selesai', 'Yes, done'), sub: t(what), label: L('Catatan', 'Note'), optional: true,
          fn: function (note) { var r = G.advanceRelease(cx(), p[0], step, { note: note || null }); return r && r.ok ? r : { ok: false, msg: failMsg(r) }; }, done: L(T(G.RPL_STEP_N[step]) + ' selesai.', G.RPL_STEP_N[step][1] + ' done.') });
      },
      rplSkip: function (el) { var id = el.getAttribute('data-val'); P.reasonDlg({ title: L('Lewati UAT', 'Skip UAT'), icon: 'minus', ok: L('Lewati', 'Skip'), sub: t(L('Hanya untuk rilis minor.', 'Only for minor releases.')), label: L('Catatan', 'Note'), optional: true, fn: function () { var r = G.advanceRelease(cx(), id, 'uat', { skip: true }); return r && r.ok ? r : { ok: false, msg: failMsg(r) }; }, done: L('UAT dilewati.', 'UAT skipped.') }); }
    }
  };
})();
