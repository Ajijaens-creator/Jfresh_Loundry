/* JFRESH OS — Phase 11 screens (part 2, writer S2): NP-10 Audit Trail, Security & Governance (SEC-001…005)
   and NP-11 Integration, API, Data Import/Export & System Health (INT-001…007).
   Desktop is primary (detailed, filterable tables); iPad reviews and runs quick actions (test, retry, review);
   the phone shows only alerts and the critical summary with a designed-for-PC note (§2, §57, §74).
   Every figure and every action goes through the system engine (assets/js/jfos-sys.js): permissions,
   reasons, masking and the audit trail are enforced there (§47). Audit history is read-only (no edit or
   delete anywhere), secrets are always masked, imports are validated before anything is staged (§54) and
   every export is logged (§79). The actionable access-review campaign lives on ADM-005 (writer S1). */
(function () {
  var A = window.JFAPP, P = A && A.P10, H = A && A.P5, P8 = A && A.P8, Y = window.JFSYS; if (!A || !P || !H || !P8 || !Y) return;
  var V = A.V, T = A.T, L = A.L, t = A.t, esc = A.esc, ic = A.ic, can = A.can, href = A.href;
  var lnk = H.lnk, card = H.card, kv = H.kv, note = H.note, dlg = H.dlg, fld = H.fld, inp = H.inp, sel = H.sel, area = H.area;
  var mono = P.mono, dt = H.dt;

  /* ================= Local helpers ================= */
  function cx() { return A.ctx(); }
  function kp(items) { return P.kpis(items, 'sg11-kp'); }
  function fresh(src) { return P.fresh({ src: src, at: Y.nowS(), kind: 'live' }); }
  function n0(v) { return v == null || isNaN(v) ? '—' : A.fmt.num(v, 0); }
  function pc(v) { return v == null || isNaN(v) ? '—' : A.fmt.num(v, 1) + '%'; }
  var ST_IC = { healthy: 'checkc', warning: 'alert', critical: 'xc', disconnected: 'wifioff' };
  function hChip(st) { var x = Y.INT_ST[st] || Y.INT_ST.warning; return A.chip(x[1], x[0], ST_IC[st]); }
  function intChip(i) { if (i.future) return A.chip('mute', L('Rencana', 'Planned'), 'clock'); return hChip(i.st); }
  var RES = { ok: ['ok', L('Berhasil', 'OK'), 'checkc'], failed: ['crit', L('Gagal', 'Failed'), 'xc'], denied: ['warn', L('Ditolak', 'Denied'), 'ban'] };
  function resChip(r) { var x = RES[r] || RES.ok; return A.chip(x[0], x[1], x[2]); }
  function sevChip(s) { return s === 'crit' ? A.chip('crit', L('Kritis', 'Critical'), 'alert') : A.chip('warn', L('Peringatan', 'Warning'), 'alert'); }
  var AST = { open: ['crit', L('Terbuka', 'Open')], ack: ['info', L('Diakui', 'Acknowledged')], resolved: ['ok', L('Selesai', 'Resolved')] };
  function alStChip(st) { var x = AST[st] || AST.open; return A.chip(x[0], x[1]); }
  function modN(k) { var m = Y.AUDIT_MODULES.filter(function (x) { return x[0] === k; })[0]; return m ? t(m[1]) : esc(k || '—'); }
  function errState(msg) { return A.stateCard('error', msg || Y.MSG.load, A.btn('blue', L('Coba Lagi', 'Try Again'), 'refresh', { act: 'retry' }) + A.backBtn('ghost')); }
  function nfState() { return A.stateCard('empty', Y.MSG.notfound, A.backBtn()); }
  function uLink(uid, name) { return uid ? lnk('ADM-002', uid, esc(name || uid)) : esc(name || '—'); }
  // A record id opens its own screen when this role can open it; everything else stays plain text.
  var REC_SCR = [[/^USR-/, 'ADM-002'], [/^INT-/, 'INT-002'], [/^IMP-/, 'INT-005'], [/^XPT-/, 'INT-006'], [/^SA-/, 'SYS-004'], [/^TPL-/, 'NTF-003'], [/^ARV-/, 'ADM-005'], [/^BKP-/, 'SYS-006']];
  function recLink(rec) {
    if (!rec) return '—';
    var s = REC_SCR.filter(function (x) { return x[0].test(rec); })[0];
    return s ? lnk(s[1], rec, mono(rec)) : mono(rec);
  }
  function short(v, n) { if (v == null || v === '') return '—'; var s = typeof v === 'string' ? v : JSON.stringify(v); n = n || 48; return s.length > n ? s.slice(0, n - 1) + '…' : s; }
  function alertHref(a) { return a.s === 'SYS-004' || !a.s ? href('SYS-004', a.id) : href(a.s, a.rec); }
  function alertOpen(a) { return H.open(a.s === 'SYS-004' || !a.s ? 'SYS-004' : a.s); }
  // Phone / iPad hint for desktop-primary admin screens.
  function deskNote(msg) { return P.deskOnly(msg || L('Layar ini dirancang untuk PC. Di ponsel hanya alert dan ringkasan kritis yang ditampilkan.', 'This screen is designed for PC. On a phone only alerts and the critical summary are shown.')); }
  function mOnly(html) { return '<div class="hide-d hide-t">' + html + '</div>'; }
  function noM(html) { return '<div class="hide-m">' + html + '</div>'; }
  function downloadCsv(name, csv) { H.download(name, '﻿' + csv, 'text/csv;charset=utf-8'); }

  // Export with its audit line (§55, §79): the engine checks both permissions, logs user, module, filters and count.
  function exportNow(type, f, label) {
    var e = Y.exportTypes(cx()).filter(function (x) { return x.k === type; })[0];
    if (!e || !e.allowed) { A.toast(Y.MSG.noperm, 'crit'); return; }
    var fl = Object.keys(f || {}).filter(function (k) { return f[k]; }).map(function (k) { return k + '=' + f[k]; }).join(', ');
    dlg({ title: L('Export ' + T(e.n), 'Export ' + e.n[1]), icon: 'download', ok: L('Export CSV', 'Export CSV'),
      sub: t(L('Export ini dicatat di audit: user, modul, filter, jumlah record dan waktu.', 'This export is logged in the audit: user, module, filters, record count and time.')),
      body: kv([[L('Modul', 'Module'), t(e.n) + (e.sens ? ' ' + A.chip('warn', L('Sensitif', 'Sensitive'), 'lock') : '')], [L('Filter', 'Filters'), fl ? esc(fl) : t(L('Tanpa filter', 'No filters'))]]) + (label ? note(t(label), 'info', 'info') : ''),
      onOk: function () {
        var r = Y.exportData(cx(), type, f || {});
        if (!r || !r.ok) return r ? r.msg : Y.MSG.invalid;
        downloadCsv(r.file, r.csv);
        P.after(L('Export selesai: ' + r.count + ' record · ' + r.log.id + ' tercatat.', 'Export done: ' + r.count + ' records · ' + r.log.id + ' logged.'));
        return true;
      } });
  }

  /* ---------- Security alerts (§48): shared row with acknowledge / resolve ---------- */
  function alertRows(list, o) {
    o = o || {};
    if (!list.length) return A.empty(L('Tidak ada alert terbuka.', 'No open alerts.'));
    var mng = can('sys11.security.manage');
    return '<ul class="sg11-al">' + list.map(function (a) {
      var acts = mng && a.st !== 'resolved' ? '<span class="sg11-al-a">' + (a.st === 'open' ? A.btn('ghost', L('Akui', 'Acknowledge'), 'eye', { act: 'ack', val: a.id, cls: 'btn-sm' }) : '') + A.btn('blue', L('Selesaikan', 'Resolve'), 'checkc', { act: 'resolve', val: a.id, cls: 'btn-sm' }) + '</span>' : '';
      var title = alertOpen(a) ? '<a href="' + alertHref(a) + '">' + t(a.t) + '</a>' : t(a.t);
      return '<li class="sg11-al-i sg11-sev-' + (a.sev === 'crit' ? 'crit' : 'warn') + '"><span class="sg11-al-ic">' + ic(a.sev === 'crit' ? 'alert' : 'bell') + '</span><div class="sg11-al-b"><b>' + title + '</b><span>' + t(a.c) + '</span>' +
        '<small>' + t(a.kindN) + ' · ' + esc(dt(a.at)) + (a.note ? ' · ' + t(L('Catatan: ', 'Note: ')) + esc(T(a.note)) : '') + '</small></div><span class="sg11-al-c">' + sevChip(a.sev) + alStChip(a.st) + '</span>' + (o.noAct ? '' : acts) + '</li>';
    }).join('') + '</ul>';
  }
  var alertActs = {
    ack: function (el) {
      var id = el.getAttribute('data-val');
      P.reasonDlg({ title: L('Akui alert', 'Acknowledge alert'), icon: 'eye', ok: L('Akui', 'Acknowledge'), optional: true, label: L('Catatan (opsional)', 'Note (optional)'),
        sub: t(L('Alert tetap terbuka sampai diselesaikan. Tindakan ini tercatat di audit.', 'The alert stays open until resolved. This action is audited.')),
        fn: function (n) { return Y.ackAlert(cx(), id, n || null); }, done: L('Alert diakui.', 'Alert acknowledged.') });
    },
    resolve: function (el) {
      var id = el.getAttribute('data-val');
      P.reasonDlg({ title: L('Selesaikan alert', 'Resolve alert'), icon: 'checkc', ok: L('Selesaikan', 'Resolve'), label: L('Catatan penyelesaian', 'Resolution note'), ph: L('Apa yang sudah diperiksa / dilakukan?', 'What was checked / done?'),
        sub: t(L('Catatan wajib. Alert yang selesai tetap tersimpan di riwayat dan audit.', 'A note is required. Resolved alerts stay in the history and the audit.')),
        fn: function (n) { return Y.resolveAlert(cx(), id, n); }, done: L('Alert diselesaikan.', 'Alert resolved.') });
    }
  };

  /* ================= SEC-001 Security Dashboard + Governance Center (§48) ================= */
  V['SEC-001'] = {
    title: function () { return L('Security Dashboard', 'Security Dashboard'); },
    render: function () {
      var c = cx(), g = Y.governance(c); if (!g) return errState();
      var sec = Y.security(c), as = can('sys11.audit.view') ? Y.auditSummary(c) : null;
      var tiles = kp([
        { k: L('User Privileged', 'Privileged Users'), v: g.privileged, s: t(L('owner, finance, admin', 'owner, finance, admin')), icon: 'key', tone: 'info', go: 'ADM-001', q: { flag: 'priv' } },
        { k: L('Perlu Review Akses', 'Access Review Due'), v: g.reviewDue, s: g.campaignsOpen + ' ' + t(L('kampanye terbuka', 'open campaigns')) + (g.campaignsOverdue ? ' · ' + g.campaignsOverdue + ' ' + t(L('terlambat', 'overdue')) : ''), icon: 'usercheck', tone: g.campaignsOverdue ? 'crit' : g.reviewDue ? 'warn' : 'ok', go: 'SEC-004' },
        { k: L('Akses Berakhir', 'Expired Access'), v: g.expired, s: g.temporary + ' ' + t(L('akses sementara', 'temporary access')), icon: 'calendar', tone: g.expired ? 'warn' : 'ok', go: 'SEC-004' },
        { k: L('Security Alert', 'Security Alerts'), v: g.alerts.open, s: g.alerts.crit + ' ' + t(L('kritis', 'critical')), icon: 'alert', tone: g.alerts.crit ? 'crit' : g.alerts.open ? 'warn' : 'ok', go: 'SYS-004' },
        { k: L('Perubahan Izin (7 hari)', 'Permission Changes (7d)'), v: g.permChanges, s: t(L('role, izin, cakupan', 'roles, permissions, scope')), icon: 'columns', tone: 'info', go: 'SEC-002', q: { kind: 'perm', per: '7' } },
        { k: L('Login Gagal (24 jam)', 'Failed Logins (24h)'), v: g.failedLogins, s: g.locked + ' ' + t(L('user terkunci', 'locked users')), icon: 'lock', tone: g.failedLogins >= 5 || g.locked ? 'warn' : 'ok', go: 'SEC-002', q: { kind: 'failed', per: '1' } }
      ].map(function (x) { if (!H.open(x.go)) delete x.go; return x; }));
      var alerts = card(L('Security alert terbuka', 'Open security alerts'), alertRows(g.lists.alerts), { icon: 'alert', count: g.alerts.open, link: H.open('SYS-004') ? ['SYS-004', L('Semua alert', 'All alerts')] : null });
      var permCh = card(L('Perubahan izin & role terbaru', 'Recent permission & role changes'), g.lists.permChanges.length ? '<div class="rls">' + g.lists.permChanges.map(function (r) {
        return A.rowLink({ href: href('SEC-003', r.id), icon: 'columns', t: t(r.actionN) + ' · ' + esc(r.rec || '—'), s: esc(r.user) + ' · ' + esc(dt(r.atS)) + (r.reason ? ' · ' + esc(short(r.reason, 60)) : '') });
      }).join('') + '</div>' : A.empty(L('Tidak ada perubahan izin dalam 7 hari.', 'No permission changes in 7 days.')), { icon: 'columns', count: g.permChanges });
      var failed = card(L('Login gagal 24 jam', 'Failed logins, 24 hours'), g.lists.failed.length ? '<div class="rls">' + g.lists.failed.map(function (r) {
        return A.rowLink({ href: href('SEC-003', r.id), icon: 'lock', t: esc(r.user), s: esc(dt(r.atS)) + ' · ' + esc(r.device || '—'), tone: 'warn' });
      }).join('') + '</div>' : A.empty(L('Tidak ada login gagal dalam 24 jam.', 'No failed logins in 24 hours.')), { icon: 'lock', count: g.failedLogins });
      var review = card(L('Perlu review akses', 'Needs access review'), (g.lists.review.length ? '<ul class="sg11-rv">' + g.lists.review.map(function (x) {
        return '<li><span>' + uLink(x.user.id, x.user.name) + '<small class="sub5">' + esc(x.user.roleNames.map(T).join(', ') || '—') + '</small></span><span class="sg11-why">' + x.why.map(function (w) { return A.chip('warn', w); }).join('') + '</span></li>';
      }).join('') + '</ul>' : A.empty(L('Tidak ada user yang perlu review.', 'No users need a review.'))) +
        '<div class="sg11-ra">' + (H.open('ADM-005') ? A.btn('primary', L('Buka Kampanye Review', 'Open Review Campaign'), 'usercheck', { go: 'ADM-005', cls: 'btn-sm' }) : '') + (H.open('SEC-004') ? A.btn('ghost', L('Governance review', 'Governance review'), 'shield', { go: 'SEC-004', cls: 'btn-sm' }) : '') + '</div>', { icon: 'usercheck', count: g.reviewDue });
      var pol = sec ? card(L('Kebijakan keamanan aktif', 'Active security policy'), kv([
        [L('Versi', 'Version'), 'v' + sec.v + ' · ' + t(L('berlaku ', 'effective ')) + esc(dt(sec.eff))],
        [L('Password', 'Password'), t(L('min. ' + sec.cur.minPassword + ' karakter', 'min. ' + sec.cur.minPassword + ' characters'))],
        [L('Kunci login', 'Login lock'), t(L(sec.cur.maxFailed + 'x gagal → ' + sec.cur.lockMinutes + ' menit', sec.cur.maxFailed + ' failures → ' + sec.cur.lockMinutes + ' min'))],
        [L('Session timeout', 'Session timeout'), t(L(sec.cur.idleMin + ' menit idle', sec.cur.idleMin + ' min idle'))],
        [L('Penegakan izin', 'Permission enforcement'), A.chip('ok', L('Server (engine)', 'Server (engine)'), 'shield')]
      ]), { icon: 'lock', link: H.open('SEC-005') ? ['SEC-005', L('Pengaturan', 'Settings')] : null }) : '';
      var byMod = as ? card(L('Audit trail per modul', 'Audit trail by module'), A.hbars(as.byModule.filter(function (m) { return m.count; }).map(function (m) { return { l: m.n, v: m.count, go: H.open('SEC-002') ? 'SEC-002' : null, qs: 'module=' + m.k }; })) +
        '<p class="sub5 sg11-p">' + t(L(n0(as.total) + ' event · ' + as.today + ' hari ini · ' + as.denied + ' ditolak · ' + as.failed + ' gagal. Read-only.', n0(as.total) + ' events · ' + as.today + ' today · ' + as.denied + ' denied · ' + as.failed + ' failed. Read-only.')) + '</p>', { icon: 'history', link: ['SEC-002', L('Audit log', 'Audit log')] }) : '';
      var priv = card(L('User privileged', 'Privileged users'), A.list(g.lists.privileged, [
        { h: L('User', 'User'), v: function (u) { return uLink(u.id, u.name) + '<small class="sub5">' + esc(u.u) + '</small>'; } },
        { h: L('Role', 'Roles'), v: function (u) { return esc(u.roleNames.map(T).join(', ')); } },
        { h: L('Status', 'Status'), v: function (u) { return A.chip(u.tone, u.stN); } },
        { h: L('Login terakhir', 'Last login'), v: function (u) { return esc(u.lastLogin ? dt(u.lastLogin) : '—'); } },
        { h: L('Masa akses', 'Access window'), v: function (u) { return u.end ? (u.expired ? A.chip('crit', L('Berakhir ' + u.end, 'Ended ' + u.end), 'alert') : A.chip('info', L('s/d ' + u.end, 'until ' + u.end), 'clock')) : '<span class="sub5">' + t(L('Permanen', 'Permanent')) + '</span>'; } }
      ], function (u) { return { t: esc(u.name), r: '', s: esc(u.roleNames.map(T).join(', ')), chip: A.chip(u.tone, u.stN) }; }, function (u) { return H.open('ADM-002') ? href('ADM-002', u.id) : null; }, { dense: true }), { icon: 'key', count: g.privileged });
      var mobile = mOnly(P8.bigCount([
        { k: L('Alert terbuka', 'Open alerts'), v: g.alerts.open, icon: 'alert', tone: g.alerts.crit ? 'crit' : g.alerts.open ? 'warn' : 'ok', go: H.open('SYS-004') ? 'SYS-004' : null },
        { k: L('Login gagal 24j', 'Failed logins 24h'), v: g.failedLogins, icon: 'lock', tone: g.failedLogins >= 5 ? 'warn' : 'ok' },
        { k: L('Akses berakhir', 'Expired access'), v: g.expired, icon: 'calendar', tone: g.expired ? 'warn' : 'ok' },
        { k: L('Perlu review', 'Needs review'), v: g.reviewDue, icon: 'usercheck', tone: g.reviewDue ? 'warn' : 'ok' }
      ]));
      return P.head(esc(dt(Y.today())) + ' · ' + t(L('Governance center: akses, alert, perubahan izin', 'Governance center: access, alerts, permission changes')),
        (H.open('SEC-002') ? A.btn('ghost', L('Audit Log', 'Audit Log'), 'history', { go: 'SEC-002' }) : '') + (H.open('SEC-005') ? A.btn('ghost', L('Pengaturan Keamanan', 'Security Settings'), 'lock', { go: 'SEC-005' }) : '') + (H.open('SYS-004') ? A.btn('primary', L('Review Security Alert', 'Review Security Alerts'), 'alert', { go: 'SYS-004' }) : ''),
        fresh(L('governance live dari engine sistem', 'live governance from the system engine'))) + deskNote() + mobile +
        noM(tiles) + '<div class="g21-10 sg11-gap"><div class="col10">' + alerts + noM(permCh) + noM(failed) + '</div><div class="col10 hide-m">' + review + pol + byMod + '</div></div>' + noM(priv);
    },
    act: alertActs
  };

  /* ================= SEC-002 Audit Log (§43–§45): one read-only trail from every module ================= */
  var PER = [['1', L('Hari ini', 'Today')], ['7', L('7 hari', '7 days')], ['30', L('30 hari', '30 days')], ['90', L('90 hari', '90 days')]];
  function auditFilter(q) {
    var f = { module: q.module || null, kind: q.kind || null, result: q.result || null, q: q.q || null, uid: q.uid || null, rec: q.rec || null, action: q.action || null };
    if (q.per) f.from = Y.u.addDays(Y.today(), -(+q.per - 1));
    return f;
  }
  function auditCols() {
    return [
      { h: L('Waktu', 'Time'), cls: 'nw', v: function (r) { return '<span class="num">' + esc(r.atS) + '</span>'; } },
      { h: L('User', 'User'), v: function (r) { return '<b>' + esc(r.user) + '</b>' + (r.role ? '<small class="sub5">' + esc(r.role) + '</small>' : ''); } },
      { h: L('Aksi', 'Action'), v: function (r) { return t(r.actionN) + '<small class="sub5 mono6">' + esc(r.action) + '</small>'; } },
      { h: L('Modul', 'Module'), v: function (r) { return modN(r.module) + (r.sub && r.sub !== r.module ? '<small class="sub5">' + esc(r.sub) + '</small>' : ''); } },
      { h: L('Record', 'Record'), v: function (r) { return recLink(r.rec); } },
      { h: L('Sebelum → Sesudah', 'Before → After'), cls: 'sg11-ba', v: function (r) { return r.before == null && r.after == null ? '<span class="sub5">—</span>' : '<span class="sub5">' + esc(short(r.before, 30)) + '</span> → ' + esc(short(r.after, 40)); } },
      { h: L('Hasil', 'Result'), v: function (r) { return resChip(r.result); } }
    ];
  }
  V['SEC-002'] = {
    title: function () { return L('Audit Log', 'Audit Log'); },
    render: function (c0) {
      var c = cx(), q = c0.q || {}, f = auditFilter(q), all = Y.auditAll(c, f), sm = Y.auditSummary(c); if (!sm) return errState();
      var lim = +q.n || 100, rows = all.slice(0, lim);
      var defs = [
        { k: 'module', l: L('Modul', 'Module'), opts: Y.AUDIT_MODULES.map(function (m) { return [m[0], m[1]]; }) },
        { k: 'kind', l: L('Event', 'Event'), opts: Y.AUDIT_KINDS.map(function (k) { return [k[0], k[1]]; }) },
        { k: 'result', l: L('Hasil', 'Result'), opts: [['ok', RES.ok[1]], ['failed', RES.failed[1]], ['denied', RES.denied[1]]] },
        { k: 'per', l: L('Periode', 'Period'), opts: PER }
      ];
      var chips = ['uid', 'rec', 'action'].filter(function (k) { return q[k]; }).map(function (k) { var o = Object.assign({}, q); delete o[k]; return '<a class="sg11-fc" href="' + href('SEC-002', null, o) + '">' + esc(k + ': ' + q[k]) + ic('x') + '</a>'; }).join('');
      var xp = Y.exportTypes(c).filter(function (x) { return x.k === 'audit'; })[0];
      var tiles = kp([
        { k: L('Total event', 'Total events'), v: n0(sm.total), icon: 'history', tone: 'info' },
        { k: L('Hari ini', 'Today'), v: n0(sm.today), icon: 'clock' },
        { k: L('Akses ditolak', 'Access denied'), v: n0(sm.denied), icon: 'ban', tone: sm.denied ? 'warn' : 'ok', go: 'SEC-002', q: { result: 'denied' } },
        { k: L('Gagal', 'Failed'), v: n0(sm.failed), icon: 'xc', tone: sm.failed ? 'warn' : 'ok', go: 'SEC-002', q: { result: 'failed' } },
        { k: L('Hasil filter', 'Filtered'), v: n0(all.length), icon: 'filter' }
      ]);
      var list = A.list(rows, auditCols(), function (r) { return { t: t(r.actionN), r: esc(r.atS.slice(5)), s: esc(r.user) + ' · ' + esc(r.rec || '—'), chip: resChip(r.result) }; }, function (r) { return href('SEC-003', r.id); },
        { dense: true, empty: L('Tidak ada event audit untuk filter ini.', 'No audit events for this filter.') });
      var more = all.length > lim ? '<p class="sg11-more"><a class="btn btn-ghost btn-sm" href="' + href('SEC-002', null, Object.assign({}, q, { n: lim + 100 })) + '">' + ic('chevd') + '<span>' + t(L('Tampilkan 100 lagi', 'Show 100 more')) + ' (' + n0(all.length - lim) + ')</span></a></p>' : '';
      var crit = all.filter(function (r) { return r.result !== 'ok'; }).slice(0, 8);
      var mobile = mOnly(card(L('Ditolak & gagal terbaru', 'Latest denied & failed'), crit.length ? '<div class="rls">' + crit.map(function (r) { return A.rowLink({ href: href('SEC-003', r.id), icon: r.result === 'denied' ? 'ban' : 'xc', t: t(r.actionN), s: esc(r.user) + ' · ' + esc(r.atS), tone: 'warn' }); }).join('') + '</div>' : A.empty(L('Tidak ada event gagal.', 'No failed events.')), { icon: 'alert', count: crit.length }));
      return P.head(t(L('Satu audit trail dari Akses, Sistem, Kinerja, Komersial, Logistik, Produksi, Delivery, Finance dan Portal Klien.', 'One audit trail from Access, System, Performance, Commercial, Logistics, Production, Delivery, Finance and the Client Portal.')),
        (xp && xp.allowed ? A.btn('ghost', L('Export (tercatat)', 'Export (logged)'), 'download', { act: 'exp', cls: 'hide-m' }) : '') + (H.open('SEC-001') ? A.btn('ghost', L('Security Dashboard', 'Security Dashboard'), 'shield', { go: 'SEC-001' }) : ''),
        fresh(L('gabungan 9 sumber audit', 'merged from 9 audit sources'))) + deskNote() + mobile +
        noM(tiles + note(t(L('Audit bersifat read-only: tidak ada tombol ubah atau hapus. IP disamarkan kecuali untuk pemegang izin security.manage.', 'The audit is read-only: there is no edit or delete. IP addresses are masked unless you hold security.manage.')), 'lock', 'info') +
          A.filters(defs, { search: L('Cari aksi, user, record, alasan', 'Search action, user, record, reason'), force: true }) + (chips ? '<div class="sg11-fcs">' + chips + '</div>' : '') +
          card(L('Event audit', 'Audit events'), list + more, { icon: 'history', count: n0(all.length) }));
    },
    act: {
      exp: function () { var f = auditFilter(A.S.q || {}); exportNow('audit', { module: f.module || undefined, from: f.from || undefined, to: f.from ? Y.today() : undefined }, L('Export audit memakai filter modul dan periode saat ini.', 'The audit export uses the current module and period filters.')); }
    }
  };

  /* ================= SEC-003 Audit Detail (§77): who, what, before, after, reason, time — read-only ================= */
  function parseV(v) { if (v == null) return null; if (typeof v !== 'string') return v; var s = v.trim(); if (/^[\[{]/.test(s)) { try { return JSON.parse(s); } catch (e) {} } return v; }
  function isObj(v) { return v && typeof v === 'object' && !Array.isArray(v); }
  function fmtV(v) {
    if (v == null || v === '') return '<span class="sub5">—</span>';
    if (Array.isArray(v)) return v.length === 2 && typeof v[0] === 'string' && typeof v[1] === 'string' && v[0] !== v[1] && /\s/.test(v[0]) ? t(v) : esc(v.map(function (x) { return typeof x === 'object' ? JSON.stringify(x) : String(x); }).join(', '));
    if (typeof v === 'object') return '<code class="sg11-code">' + esc(JSON.stringify(v, null, 1)) + '</code>';
    if (typeof v === 'boolean') return t(v ? L('Ya', 'Yes') : L('Tidak', 'No'));
    return esc(String(v));
  }
  function diffTable(b0, a0) {
    var b = parseV(b0), a = parseV(a0), rows;
    if (b == null && a == null) return A.empty(L('Event ini tidak mengubah data (tanpa nilai sebelum/sesudah).', 'This event changed no data (no before/after values).'));
    if (isObj(b) || isObj(a)) {
      b = isObj(b) ? b : {}; a = isObj(a) ? a : {};
      var keys = Object.keys(b).concat(Object.keys(a).filter(function (k) { return !(k in b); }));
      rows = keys.map(function (k) { return { k: k, b: b[k], a: a[k], ch: JSON.stringify(b[k]) !== JSON.stringify(a[k]) }; });
    } else rows = [{ k: T(L('Nilai', 'Value')), b: b, a: a, ch: JSON.stringify(b) !== JSON.stringify(a) }];
    return '<div class="tblw"><table class="tbl dense sg11-diff"><thead><tr><th>' + t(L('Field', 'Field')) + '</th><th>' + t(L('Sebelum', 'Before')) + '</th><th>' + t(L('Sesudah', 'After')) + '</th></tr></thead><tbody>' +
      rows.map(function (r) { return '<tr class="' + (r.ch ? 'sg11-chg' : '') + '"><th>' + esc(r.k) + (r.ch ? ' <span class="sg11-dot" title="' + t(L('Berubah', 'Changed')) + '"></span>' : '') + '</th><td class="sg11-b">' + fmtV(r.b) + '</td><td class="sg11-a">' + fmtV(r.a) + '</td></tr>'; }).join('') + '</tbody></table></div>';
  }
  V['SEC-003'] = {
    title: function () { return L('Detail Audit', 'Audit Detail'); },
    render: function (c0) {
      if (!c0.rec) return A.stateCard('empty', L('Pilih event dari Audit Log.', 'Pick an event from the Audit Log.'), A.btn('blue', L('Buka Audit Log', 'Open Audit Log'), 'history', { go: 'SEC-002' }));
      var r = Y.auditDetail(cx(), c0.rec); if (!r) return nfState();
      var hero = P8.hero({ id: r.id, icon: r.result === 'ok' ? 'filecheck' : 'alert', title: t(r.actionN), sub: '<span class="mono6">' + esc(r.action) + '</span> · ' + modN(r.module) + (r.sub && r.sub !== r.module ? ' · ' + esc(r.sub) : ''),
        chips: resChip(r.result) + A.chip('mute', L('Read-only', 'Read-only'), 'lock'),
        facts: [[L('Siapa', 'Who'), esc(r.user) + (r.role ? ' · ' + esc(r.role) : '')], [L('Waktu', 'Time'), esc(r.atS)], [L('Record', 'Record'), recLink(r.rec)], [L('Perangkat', 'Device'), esc(r.device || '—')], [L('IP', 'IP'), '<span class="mono6">' + esc(r.ip) + '</span>'], [L('Karyawan', 'Employee'), esc(r.emp || r.uid || '—')]] });
      var reason = card(L('Alasan', 'Reason'), r.reason ? '<p class="sg11-reason">' + esc(r.reason) + '</p>' : A.empty(L('Tidak ada alasan tercatat untuk event ini.', 'No reason was recorded for this event.')), { icon: 'message' });
      var diff = card(L('Sebelum & sesudah', 'Before & after'), diffTable(r.before, r.after) + '<p class="sub5 sg11-p">' + t(L('Baris berwarna = field yang berubah.', 'Highlighted rows = changed fields.')) + '</p>', { icon: 'swap' });
      var rel = card(L('Event lain pada record ini', 'Other events on this record'), r.related.length ? '<div class="rls">' + r.related.map(function (x) {
        return A.rowLink({ href: href('SEC-003', x.id), icon: x.result === 'ok' ? 'history' : 'alert', t: t(x.actionN), s: esc(x.user) + ' · ' + esc(x.atS), chip: resChip(x.result) });
      }).join('') + '</div>' : A.empty(L('Belum ada event lain.', 'No other events yet.')), { icon: 'history', count: r.related.length, link: r.rec ? ['SEC-002', L('Semua', 'All')] : null });
      return P.head(t(L('Audit tidak bisa diubah atau dihapus (§65).', 'Audit entries can never be edited or deleted (§65).')), A.btn('ghost', L('Audit Log', 'Audit Log'), 'history', { go: 'SEC-002', qs: r.rec ? 'rec=' + encodeURIComponent(r.rec) : '' })) +
        hero + '<div class="g21-10 sg11-gap"><div class="col10">' + diff + reason + '</div><div class="col10">' + rel + '</div></div>';
    }
  };

  /* ================= SEC-004 Access Review (Governance view, §34/§48) — the campaign itself runs on ADM-005 ================= */
  var SCOPE_N = { privileged: L('User privileged', 'Privileged users'), temporary: L('Akses sementara', 'Temporary access'), inactive: L('User tidak aktif', 'Inactive users'), all: L('Semua user', 'All users') };
  var DEC = { keep: ['ok', L('Tetap', 'Keep')], revoke: ['crit', L('Cabut', 'Revoke')], adjust: ['warn', L('Sesuaikan', 'Adjust')] };
  V['SEC-004'] = {
    title: function () { return L('Review Akses (Governance)', 'Access Review (Governance)'); },
    render: function () {
      var c = cx(), rv = Y.accessReview(c); if (!rv) return errState();
      var camps = Y.campaigns(c), cnt = rv.counts, openC = camps.filter(function (x) { return x.st === 'open'; }), over = openC.filter(function (x) { return x.overdue; });
      var cyc = Y.cfgGet('wf.reviewDays') || 90, adm = H.open('ADM-005');
      var tiles = kp([
        { k: L('User privileged', 'Privileged users'), v: cnt.privileged, icon: 'key', tone: 'info' },
        { k: L('Perlu review', 'Needs review'), v: cnt.review, icon: 'usercheck', tone: cnt.review ? 'warn' : 'ok' },
        { k: L('Akses berakhir', 'Expired access'), v: cnt.expired, icon: 'calendar', tone: cnt.expired ? 'crit' : 'ok' },
        { k: L('Akses sementara', 'Temporary access'), v: cnt.temporary, icon: 'clock', tone: 'info' },
        { k: L('Tidak aktif (login)', 'Inactive (login)'), v: cnt.inactive, icon: 'user', tone: cnt.inactive ? 'warn' : 'ok' },
        { k: L('Kampanye terbuka', 'Open campaigns'), v: openC.length, s: over.length ? '<b class="sg11-crit">' + over.length + ' ' + t(L('terlambat', 'overdue')) + '</b>' : t(L('sesuai jadwal', 'on schedule')), icon: 'flag', tone: over.length ? 'crit' : 'ok' }
      ]);
      var campTbl = A.list(camps, [
        { h: L('Kampanye', 'Campaign'), v: function (x) { return (adm ? lnk('ADM-005', x.id, '<b>' + t(x.n) + '</b>') : '<b>' + t(x.n) + '</b>') + '<small class="sub5 mono6">' + esc(x.id) + '</small>'; } },
        { h: L('Cakupan', 'Scope'), v: function (x) { return t(SCOPE_N[x.scope] || L(x.scope)); } },
        { h: L('Jatuh tempo', 'Due'), v: function (x) { return esc(dt(x.due)) + (x.overdue ? ' ' + A.chip('crit', L('Terlambat', 'Overdue'), 'alert') : ''); } },
        { h: L('Progres', 'Progress'), cls: 'sg11-pgc', v: function (x) { return '<span class="sg11-pg">' + P.bar(x.progress.pct, 100, x.progress.pct >= 100 ? 'ok' : x.overdue ? 'crit' : 'info') + '<b class="num">' + x.progress.done + '/' + x.progress.total + '</b></span>'; } },
        { h: L('Status', 'Status'), v: function (x) { return x.st === 'open' ? A.chip('info', L('Berjalan', 'Open'), 'clock') : A.chip('ok', L('Selesai', 'Completed'), 'checkc'); } }
      ], function (x) { return { t: t(x.n), r: x.progress.done + '/' + x.progress.total, s: t(L('Jatuh tempo ', 'Due ')) + esc(dt(x.due)), chip: x.overdue ? A.chip('crit', L('Terlambat', 'Overdue')) : '' }; }, function (x) { return adm ? href('ADM-005', x.id) : null; }, { empty: L('Belum ada kampanye review akses.', 'No access review campaigns yet.') });
      // Why users need a review: grouped reasons.
      var why = {}; rv.review.forEach(function (x) { x.why.forEach(function (w) { var k = T(w); why[k] = why[k] || { l: w, v: 0 }; why[k].v++; }); });
      var whyL = Object.keys(why).map(function (k) { return why[k]; }).sort(function (a, b) { return b.v - a.v; });
      var reasons = card(L('Alasan perlu review', 'Why a review is needed'), whyL.length ? A.hbars(whyL) : A.empty(L('Tidak ada user yang perlu review.', 'No users need a review.')), { icon: 'filter', count: cnt.review });
      // Last decisions: who decided what (from the audit when visible, else from the campaigns).
      var decs = []; camps.forEach(function (x) { x.items.forEach(function (i) { if (i.dec) decs.push({ camp: x, i: i }); }); });
      decs.sort(function (a, b) { return a.i.at < b.i.at ? 1 : -1; });
      var decCard = card(L('Keputusan review terbaru', 'Latest review decisions'), decs.length ? '<ul class="sg11-dec">' + decs.slice(0, 8).map(function (d) {
        var x = DEC[d.i.dec] || DEC.keep;
        return '<li>' + A.chip(x[0], x[1]) + '<span>' + uLink(d.i.uid, d.i.name) + '<small class="sub5">' + esc(d.i.note ? T(d.i.note) : '—') + ' · ' + esc(d.i.by || '') + ' · ' + esc(dt(d.i.at)) + '</small></span></li>';
      }).join('') + '</ul>' : A.empty(L('Belum ada keputusan review.', 'No review decisions yet.')), { icon: 'checkc', count: decs.length });
      function uTbl(list, extra) {
        return A.list(list, [
          { h: L('User', 'User'), v: function (u) { return uLink(u.id, u.name) + '<small class="sub5">' + esc(u.u) + '</small>'; } },
          { h: L('Role', 'Roles'), v: function (u) { return esc(u.roleNames.map(T).join(', ') || '—'); } },
          { h: L('Status', 'Status'), v: function (u) { return A.chip(u.tone, u.stN); } },
          { h: L('Login terakhir', 'Last login'), v: function (u) { return esc(u.lastLogin ? dt(u.lastLogin) : '—'); } },
          extra
        ].filter(Boolean), function (u) { return { t: esc(u.name), s: esc(u.roleNames.map(T).join(', ')), chip: A.chip(u.tone, u.stN) }; }, function (u) { return H.open('ADM-002') ? href('ADM-002', u.id) : null; }, { dense: true, empty: L('Tidak ada user.', 'No users.') });
      }
      var tab = (A.S.q || {}).tab || 'review';
      var tabs = H.tabs([['review', L('Perlu review', 'Needs review'), 'usercheck', cnt.review], ['priv', L('Privileged', 'Privileged'), 'key', cnt.privileged], ['expired', L('Akses berakhir', 'Expired'), 'calendar', cnt.expired], ['temp', L('Sementara', 'Temporary'), 'clock', cnt.temporary], ['inactive', L('Tidak aktif', 'Inactive'), 'user', cnt.inactive]], tab, 'tab', { def: 'review' });
      var body = tab === 'priv' ? uTbl(rv.privileged) : tab === 'expired' ? uTbl(rv.expired, { h: L('Berakhir', 'Ended'), v: function (u) { return A.chip('crit', L(u.end || '—', u.end || '—'), 'alert'); } }) :
        tab === 'temp' ? uTbl(rv.temporary, { h: L('Sampai', 'Until'), v: function (u) { return esc(dt(u.end)) + (u.daysLeft != null ? ' <small class="sub5">' + t(L(u.daysLeft + ' hari lagi', u.daysLeft + ' days left')) + '</small>' : ''); } }) :
        tab === 'inactive' ? uTbl(rv.inactive) :
        A.list(rv.review, [
          { h: L('User', 'User'), v: function (x) { return uLink(x.user.id, x.user.name) + '<small class="sub5">' + esc(x.user.roleNames.map(T).join(', ') || '—') + '</small>'; } },
          { h: L('Status', 'Status'), v: function (x) { return A.chip(x.user.tone, x.user.stN); } },
          { h: L('Alasan', 'Why'), v: function (x) { return '<span class="sg11-why">' + x.why.map(function (w) { return A.chip('warn', w); }).join('') + '</span>'; } }
        ], function (x) { return { t: esc(x.user.name), s: x.why.map(t).join(' · ') }; }, function (x) { return H.open('ADM-002') ? href('ADM-002', x.user.id) : null; }, { dense: true, empty: L('Tidak ada user yang perlu review.', 'No users need a review.') });
      var mobile = mOnly(P8.bigCount([
        { k: L('Perlu review', 'Needs review'), v: cnt.review, icon: 'usercheck', tone: cnt.review ? 'warn' : 'ok' },
        { k: L('Akses berakhir', 'Expired access'), v: cnt.expired, icon: 'calendar', tone: cnt.expired ? 'crit' : 'ok' },
        { k: L('Kampanye terlambat', 'Overdue campaigns'), v: over.length, icon: 'flag', tone: over.length ? 'crit' : 'ok' },
        { k: L('Privileged', 'Privileged'), v: cnt.privileged, icon: 'key' }
      ]));
      var cta = adm ? A.btn('primary', can('sys11.access.review') ? L('Jalankan Review di ADM-005', 'Run the Review on ADM-005') : L('Lihat Kampanye (ADM-005)', 'View Campaigns (ADM-005)'), 'usercheck', { go: 'ADM-005' }) : '';
      return P.head(t(L('Review akses periodik setiap ' + cyc + ' hari. Keputusan keep / revoke / adjust dibuat di Review Akses (ADM-005); halaman ini untuk pengawasan governance.', 'Periodic access review every ' + cyc + ' days. Keep / revoke / adjust decisions are made on Access Review (ADM-005); this page is the governance view.')), cta,
        fresh(L('user, role & kampanye live', 'live users, roles & campaigns'))) + deskNote() + mobile +
        noM(tiles + '<div class="g21-10 sg11-gap"><div class="col10">' + card(L('Kampanye review akses', 'Access review campaigns'), campTbl, { icon: 'flag', count: camps.length }) + card(L('User untuk diawasi', 'Users to watch'), tabs + body, { icon: 'users' }) + '</div><div class="col10">' + reasons + decCard + '</div></div>') +
        (cta ? '<div class="hide-d hide-m">' + P8.abar(P8.xl('primary', L('Buka Review Akses', 'Open Access Review'), 'usercheck', { go: 'ADM-005' })) + '</div>' : '');
    }
  };

  /* ================= SEC-005 Security Settings (§46): versioned, reason required, applied to the login layer ================= */
  var SEC_G = [
    { k: 'pw', n: L('Kebijakan Password', 'Password Policy'), icon: 'key', f: [['minPassword', L('Panjang minimal password', 'Minimum password length'), L('karakter', 'characters')], ['resetMin', L('Link reset password berlaku', 'Password reset link valid for'), L('menit', 'minutes')]] },
    { k: 'sess', n: L('Session Timeout', 'Session Timeout'), icon: 'clock', f: [['idleMin', L('Logout otomatis saat idle', 'Auto logout when idle'), L('menit', 'minutes')], ['rememberH', L('Remember Me paling lama', 'Remember Me at most'), L('jam', 'hours')]] },
    { k: 'lock', n: L('Kunci Login Gagal', 'Failed Login Lock'), icon: 'lock', f: [['maxFailed', L('Kunci akun setelah', 'Lock the account after'), L('kali gagal', 'failed attempts')], ['lockMinutes', L('Lama akun terkunci', 'Lock duration'), L('menit', 'minutes')]] },
    { k: 'mask', n: L('Masking Field Sensitif', 'Sensitive Field Masking'), icon: 'eyeoff', b: [['maskPhone', L('Nomor telepon', 'Phone numbers')], ['maskEmail', L('Alamat email', 'Email addresses')], ['maskBank', L('Nomor rekening bank', 'Bank account numbers')], ['maskIp', L('Alamat IP di audit', 'IP addresses in the audit')]] },
    { k: 'exp', n: L('Masa Akses', 'Access Expiry'), icon: 'calendar', f: [['expiryDays', L('Review akses sementara setiap', 'Review temporary access every'), L('hari', 'days')]] },
    { k: 'sus', n: L('Suspensi User', 'User Suspension'), icon: 'ban', f: [['suspendDays', L('Tangguhkan jika tidak login selama', 'Suspend after no login for'), L('hari', 'days')]] }
  ];
  var SEC_N = {}; SEC_G.forEach(function (g) { (g.f || []).concat(g.b || []).forEach(function (x) { SEC_N[x[0]] = x[1]; }); });
  function secVal(k, v) { return typeof v === 'boolean' ? (v ? A.chip('ok', L('Disamarkan', 'Masked'), 'eyeoff') : A.chip('mute', L('Terlihat', 'Visible'), 'eye')) : esc(v == null ? '—' : String(v)); }
  function verDiff(cur, prev) {
    if (!prev) return t(L('Kebijakan awal', 'Initial policy'));
    var ks = Object.keys(cur.data).filter(function (k) { return cur.data[k] !== prev.data[k]; });
    return ks.length ? ks.map(function (k) { return '<span class="sg11-vd">' + t(SEC_N[k] || L(k)) + ': <s>' + esc(String(prev.data[k])) + '</s> → <b>' + esc(String(cur.data[k])) + '</b></span>'; }).join('') : '—';
  }
  V['SEC-005'] = {
    title: function () { return L('Pengaturan Keamanan', 'Security Settings'); },
    render: function () {
      var s = Y.security(cx()); if (!s) return errState();
      var mng = can('sys11.security.manage'), ap = s.applied || {};
      var cards = SEC_G.map(function (g) {
        var body;
        if (g.f) body = '<ul class="sg11-set">' + g.f.map(function (x) {
          var rg = s.rules[x[0]], v = s.cur[x[0]], applied = ap[x[0]] == null || ap[x[0]] === v;
          return '<li><span>' + t(x[1]) + '<small class="sub5">' + t(L('rentang ', 'range ')) + rg[0] + '–' + rg[1] + ' ' + t(x[2]) + '</small></span><b class="num">' + esc(String(v)) + ' <small>' + t(x[2]) + '</small></b>' + (ap[x[0]] != null ? (applied ? A.chip('ok', L('Diterapkan', 'Applied'), 'checkc') : A.chip('warn', L('Belum diterapkan', 'Not applied'), 'alert')) : '') + '</li>';
        }).join('') + '</ul>';
        else body = '<ul class="sg11-set">' + g.b.map(function (x) { return '<li><span>' + t(x[1]) + '</span>' + secVal(x[0], s.cur[x[0]]) + '</li>'; }).join('') + '</ul>';
        return card(g.n, body + (mng ? '<div class="sg11-ra">' + A.btn('ghost', L('Ubah', 'Change'), 'edit', { act: 'edit', val: g.k, cls: 'btn-sm' }) + '</div>' : ''), { icon: g.icon });
      });
      var enf = card(L('Penegakan Izin', 'Permission Enforcement'), '<ul class="sg11-set"><li><span>' + t(L('Semua izin dicek di engine (server), bukan hanya disembunyikan di menu (§47).', 'Every permission is checked in the engine (server side), not just hidden in the menu (§47).')) + '</span>' + A.chip('ok', L('Server · terkunci', 'Server · locked'), 'lock') + '</li>' +
        '<li><span>' + t(L('OTP login', 'Login OTP')) + '<small class="sub5">' + t(L('Tidak dipakai kecuali dikonfigurasi kemudian (§3).', 'Not used unless configured later (§3).')) + '</small></span>' + (ap.otp ? A.chip('ok', L('Aktif', 'On')) : A.chip('mute', L('Tidak aktif', 'Off'))) + '</li></ul>', { icon: 'shield' });
      var vers = card(L('Riwayat versi kebijakan', 'Policy version history'), A.list(s.versions, [
        { h: L('Versi', 'Version'), v: function (x) { return '<b>v' + x.v + '</b>' + (x.v === s.v ? ' ' + A.chip('ok', L('Aktif', 'Active')) : ''); } },
        { h: L('Berlaku', 'Effective'), v: function (x) { return esc(dt(x.eff)); } },
        { h: L('Oleh', 'By'), v: function (x) { return esc(x.byName || x.by) + '<small class="sub5">' + esc(x.at) + '</small>'; } },
        { h: L('Perubahan', 'Changes'), v: function (x) { var i = s.versions.indexOf(x); return verDiff(x, s.versions[i + 1]); } },
        { h: L('Alasan', 'Reason'), v: function (x) { return esc(T(x.reason)); } }
      ], function (x) { return { t: 'v' + x.v + ' · ' + esc(dt(x.eff)), s: esc(T(x.reason)) }; }, null, { dense: true }), { icon: 'history', count: s.versions.length });
      var mobile = mOnly(card(L('Ringkasan kebijakan', 'Policy summary'), kv([[L('Versi', 'Version'), 'v' + s.v], [L('Password', 'Password'), s.cur.minPassword + '+'], [L('Kunci login', 'Login lock'), s.cur.maxFailed + 'x / ' + s.cur.lockMinutes + 'm'], [L('Idle', 'Idle'), s.cur.idleMin + 'm']]), { icon: 'lock' }));
      return P.head(t(L('Kebijakan v' + s.v + ' berlaku sejak ' + dt(s.eff) + '. Setiap perubahan butuh alasan, membuat versi baru dan tercatat di audit.', 'Policy v' + s.v + ' effective since ' + dt(s.eff) + '. Every change needs a reason, creates a new version and is audited.')),
        H.open('SEC-002') ? A.btn('ghost', L('Audit perubahan', 'Change audit'), 'history', { go: 'SEC-002', qs: 'action=SECURITY' }) : '', fresh(L('kebijakan aktif di layer login', 'policy active in the login layer'))) +
        deskNote(L('Pengaturan keamanan hanya bisa diubah di PC.', 'Security settings can only be changed on a PC.')) + mobile +
        noM((mng ? '' : note(t(L('Anda hanya bisa melihat. Perubahan butuh izin security.manage.', 'View only. Changes need security.manage.')), 'eye', 'info')) + '<div class="g3-10 sg11-gap">' + cards.join('') + enf + '</div>' + vers);
    },
    act: {
      edit: function (el) {
        var g = SEC_G.filter(function (x) { return x.k === el.getAttribute('data-val'); })[0], s = Y.security(cx()); if (!g || !s) return;
        var body = g.f ? g.f.map(function (x) { var rg = s.rules[x[0]]; return fld(x[1], '<input name="' + x[0] + '" type="number" min="' + rg[0] + '" max="' + rg[1] + '" step="1" value="' + esc(s.cur[x[0]]) + '" inputmode="numeric">', { hint: t(L('Rentang ', 'Range ')) + rg[0] + '–' + rg[1] + ' ' + t(x[2]) }); }).join('')
          : g.b.map(function (x) { return '<label class="sg11-ck"><input type="checkbox" name="' + x[0] + '"' + (s.cur[x[0]] ? ' checked' : '') + '><span>' + t(L('Samarkan ', 'Mask ')) + t(x[1]) + '</span></label>'; }).join('');
        P.reasonDlg({ title: L('Ubah ' + T(g.n), 'Change ' + g.n[1]), icon: g.icon, ok: L('Simpan versi v' + (s.v + 1), 'Save version v' + (s.v + 1)),
          sub: t(L('Versi lama tetap tersimpan. Nilai sebelum/sesudah dan alasan tercatat di audit.', 'The old version is kept. Before/after values and the reason are audited.')), body: '<div class="sg11-dg">' + body + '</div>',
          fn: function (reason, v) {
            var patch = {};
            (g.f || []).forEach(function (x) { var n = v[x[0]] === '' ? NaN : Number(v[x[0]]); if (n !== s.cur[x[0]]) patch[x[0]] = n; });
            (g.b || []).forEach(function (x) { if (!!v[x[0]] !== s.cur[x[0]]) patch[x[0]] = !!v[x[0]]; });
            var r = Y.setSecurity(cx(), patch, reason);
            if (r && !r.ok && r.errs) r = Object.assign({}, r, { msg: L(Object.keys(r.errs).map(function (k) { return T(SEC_N[k] || L(k)) + ': ' + T(r.errs[k]); }).join(' · '), Object.keys(r.errs).map(function (k) { return (SEC_N[k] || L(k))[1] + ': ' + r.errs[k][1]; }).join(' · ')) });
            return r;
          }, done: L('Kebijakan keamanan disimpan sebagai versi baru.', 'Security policy saved as a new version.') });
      }
    }
  };

  /* ================= INT-001 Integration Center (§49–§51) ================= */
  var DIR = { out: ['arrow', L('Keluar', 'Outbound')], 'in': ['arrowl', L('Masuk', 'Inbound')], both: ['swap', L('Dua arah', 'Two-way')] };
  function credChip(cr) {
    if (!cr || cr.st === 'none') return '<span class="sub5">' + t(L('Tanpa kredensial', 'No credential')) + '</span>';
    var tone = cr.st === 'expired' ? 'crit' : cr.st === 'expiring' ? 'warn' : 'ok', lab = cr.st === 'expired' ? L('Kedaluwarsa', 'Expired') : cr.st === 'expiring' ? L(cr.days + ' hari lagi', cr.days + ' days left') : L('Valid', 'Valid');
    return '<span class="sg11-cred"><span class="mono6">' + esc(cr.type) + ' ' + esc(cr.mask) + '</span>' + A.chip(tone, lab, tone === 'ok' ? 'key' : 'alert') + '</span>';
  }
  // §50: what an integration problem means for the business, and what to do.
  var IMPACT = {
    wa: [L('Notifikasi WhatsApp ke klien & driver bisa tertunda; In-App & email tetap jalan.', 'WhatsApp notifications to clients & drivers may be delayed; In-App & email still work.'), L('Cek template yang belum disetujui, lalu Retry. Perpanjang API key sebelum kedaluwarsa.', 'Check unapproved templates, then Retry. Renew the API key before it expires.')],
    email: [L('Invoice, statement & reset password lewat email tertunda.', 'Invoices, statements & password resets by email are delayed.'), L('Tes koneksi SMTP, cek kuota pengirim.', 'Test the SMTP connection, check the sender quota.')],
    maps: [L('Rute & ETA memakai perkiraan terakhir.', 'Routes & ETA fall back to the last estimate.'), L('Tes koneksi; cek kuota API.', 'Test the connection; check the API quota.')],
    pay: [L('Pembayaran online klien tidak masuk otomatis; finance mencatat manual dari mutasi bank.', 'Client online payments do not arrive automatically; finance records them manually from bank statements.'), L('Pasang kredensial baru dari kontrak penyedia, lalu aktifkan dan tes koneksi.', 'Install the new credentials from the provider contract, then enable and test the connection.')],
    bank: [L('Rekonsiliasi bank menunggu mutasi.', 'Bank reconciliation waits for statements.'), L('Tes koneksi; cek sertifikat.', 'Test the connection; check the certificate.')],
    acc: [L('Faktur pajak keluaran belum terkirim ke e-Faktur.', 'Output tax invoices are not sent to e-Faktur.'), L('Perpanjang sertifikat sebelum kedaluwarsa; tes koneksi.', 'Renew the certificate before it expires; test the connection.')],
    scale: [L('Berat penerimaan dimasukkan manual (lebih lambat, risiko salah ketik).', 'Receiving weights are entered manually (slower, typo risk).'), L('Periksa timbangan yang offline, lalu Retry.', 'Check the offline scale, then Retry.')],
    qr: [L('Scan bag/batch harus manual.', 'Bag/batch scans must be typed in.'), L('Tes koneksi scanner.', 'Test the scanner connection.')],
    iot: [L('Belum aktif: integrasi masa depan.', 'Not active yet: future integration.'), L('Tidak ada tindakan.', 'No action.')],
    erp: [L('Jurnal ringkasan bulanan tidak terkirim ke ERP Grup.', 'Monthly summary journals are not sent to the Group ERP.'), L('Minta konfigurasi endpoint baru dari vendor, lalu aktifkan dan tes.', 'Get the new endpoint configuration from the vendor, then enable and test.')]
  };
  function intProblems(list) { return list.filter(function (i) { return !i.future && i.st !== 'healthy'; }); }
  function intCard(i, o) {
    o = o || {}; var mng = can('sys11.integration.manage') && !i.future, im = IMPACT[i.k] || [L('—'), L('—')];
    return '<article class="sg11-ic sg11-ic-' + i.tone + '"><div class="sg11-ic-h"><span class="sg11-ic-i">' + ic('plug') + '</span><div><a href="' + href('INT-002', i.id) + '"><b>' + esc(i.n) + '</b></a><small class="sub5">' + esc(i.id) + ' · ' + t(i.owner) + '</small></div>' + intChip(i) + '</div>' +
      '<p class="sg11-ic-e">' + ic('alert') + '<span>' + (i.err ? t(i.err) : t(Y.MSG.integ)) + '</span></p>' +
      (o.full ? '<p class="sg11-ic-m"><b>' + t(L('Dampak: ', 'Impact: ')) + '</b>' + t(im[0]) + '</p>' : '') +
      '<p class="sub5">' + t(L('Error terakhir ', 'Last error ')) + esc(dt(i.errAt)) + ' · ' + t(L('sukses terakhir ', 'last success ')) + esc(dt(i.ok)) + '</p>' +
      (mng && !o.noAct ? '<div class="sg11-ic-a">' + A.btn('ghost', L('Tes Koneksi', 'Test Connection'), 'zap', { act: 'test', val: i.id, cls: 'btn-sm' }) + (i.st === 'warning' || i.st === 'critical' ? A.btn('blue', L('Retry Sync', 'Retry Sync'), 'refresh', { act: 'rsync', val: i.id, cls: 'btn-sm' }) : '') + A.btn('ghost', L('Detail', 'Detail'), 'arrow', { go: 'INT-002', rec: i.id, cls: 'btn-sm' }) + '</div>' : '') + '</article>';
  }
  var intActs = {
    test: function (el) {
      var id = el.getAttribute('data-val'), r = Y.testConnection(cx(), id);
      if (r && r.res) { A.rerender(); setTimeout(function () { A.toast(r.msg, r.res === 'success' ? 'ok' : r.res === 'warning' ? 'warn' : 'crit'); }, 280); }
      else P.fail(r);
    },
    rsync: function (el) {
      var id = el.getAttribute('data-val'), i = Y.integration(cx(), id); if (!i) return;
      // A failed retry is still a recorded attempt (history + audit): close, refresh and explain the problem.
      dlg({ title: L('Retry sync ' + i.n, 'Retry sync ' + i.n), icon: 'refresh', ok: L('Retry', 'Retry'), sub: t(i.err || Y.MSG.integ),
        body: fld(L('Catatan (opsional)', 'Note (optional)'), area('reason', '', L('Tulis catatan singkat', 'Write a short note')), { wide: true }),
        onOk: function (v) {
          var r = Y.retrySync(cx(), id, v.reason || null);
          if (r && r.ok) { P.after(L('Sinkron ulang berhasil.', 'Re-sync succeeded.')); return true; }
          if (r && r.integration) { A.rerender(); setTimeout(function () { A.toast(L(T(r.msg) + ' ' + T(r.detail || ''), r.msg[1] + ' ' + (r.detail ? r.detail[1] : '')), 'crit'); }, 280); return true; }
          return r ? r.msg : Y.MSG.invalid;
        } });
    }
  };
  V['INT-001'] = {
    title: function () { return L('Integration Center', 'Integration Center'); },
    render: function () {
      var c = cx(), list = Y.integrations(c), sm = Y.integSummary(c); if (!sm) return errState();
      var prob = intProblems(list), crit = prob.filter(function (i) { return i.st !== 'warning'; }).length;
      var tiles = kp([
        { k: L('Integrasi aktif', 'Live integrations'), v: sm.total, s: sm.future + ' ' + t(L('rencana', 'planned')), icon: 'plug', tone: 'info' },
        { k: L('Healthy', 'Healthy'), v: sm.label, icon: 'checkc', tone: 'ok' },
        { k: L('Warning', 'Warning'), v: sm.warning, icon: 'alert', tone: sm.warning ? 'warn' : 'ok' },
        { k: L('Critical', 'Critical'), v: sm.critical, icon: 'xc', tone: sm.critical ? 'crit' : 'ok' },
        { k: L('Disconnected', 'Disconnected'), v: sm.disconnected, icon: 'wifioff', tone: sm.disconnected ? 'crit' : 'ok' }
      ]);
      var probs = card(L('Perlu perhatian', 'Needs attention'), prob.length ? note(t(Y.MSG.integ), 'alert', 'warn') + '<div class="sg11-ics">' + prob.map(function (i) { return intCard(i, { full: true }); }).join('') + '</div>' : A.empty(L('Belum ada integration error.', 'No integration errors yet.')), { icon: 'alert', count: prob.length });
      var tbl = A.list(list, [
        { h: L('Integrasi', 'Integration'), v: function (i) { return '<b>' + esc(i.n) + '</b><small class="sub5 mono6">' + esc(i.id) + '</small>'; } },
        { h: L('Status', 'Status'), v: intChip },
        { h: L('Sinkron terakhir', 'Last sync'), cls: 'nw', v: function (i) { return esc(i.last ? dt(i.last) : '—'); } },
        { h: L('Sukses terakhir', 'Last success'), cls: 'nw', v: function (i) { return esc(i.ok ? dt(i.ok) : '—'); } },
        { h: L('Error terakhir', 'Last error'), v: function (i) { return i.err && i.st !== 'healthy' ? '<span class="sg11-err">' + t(i.err) + '</span>' : '<span class="sub5">—</span>'; } },
        { h: L('Alur data', 'Data flow'), v: function (i) { var d = DIR[i.dir] || DIR.out; return '<span class="sg11-flow">' + ic(d[0]) + '<span>' + t(i.flow) + '</span></span>'; } },
        { h: L('Pemilik', 'Owner'), v: function (i) { return t(i.owner); } },
        { h: L('Kredensial', 'Credential'), v: function (i) { return credChip(i.cred); } }
      ], function (i) { return { t: esc(i.n), s: t(i.flow), chip: intChip(i) }; }, function (i) { return href('INT-002', i.id); }, { dense: true });
      var mobile = mOnly(P8.bigCount([{ k: L('Bermasalah', 'With problems'), v: prob.length, icon: 'alert', tone: crit ? 'crit' : prob.length ? 'warn' : 'ok' }, { k: L('Healthy', 'Healthy'), v: sm.label, icon: 'checkc', tone: 'ok' }]) +
        (prob.length ? '<div class="sg11-ics">' + prob.map(function (i) { return intCard(i, { noAct: true }); }).join('') + '</div>' : A.empty(L('Belum ada integration error.', 'No integration errors yet.'))));
      return P.head(t(L('Integrasi ' + sm.label + ' Healthy · kredensial selalu disamarkan, secret tidak pernah ditampilkan.', 'Integrations ' + sm.label + ' Healthy · credentials always masked, secrets never shown.')),
        (H.open('INT-003') ? A.btn('ghost', L('API Management', 'API Management'), 'component', { go: 'INT-003' }) : '') + (H.open('INT-007') ? A.btn('ghost', L('System Health', 'System Health'), 'gauge', { go: 'INT-007' }) : ''),
        fresh(L('status integrasi live', 'live integration status'))) + deskNote() + mobile +
        noM(tiles + '<div class="sg11-gap">' + probs + '</div>' + card(L('Semua integrasi', 'All integrations'), tbl, { icon: 'plug', count: list.length }));
    },
    act: intActs
  };

  /* ================= INT-002 Integration Detail ================= */
  var LOGK = { test: L('Tes koneksi', 'Connection test'), retry: L('Retry sync', 'Retry sync'), enable: L('Diaktifkan', 'Enabled'), disable: L('Dinonaktifkan', 'Disabled') };
  var LOGR = { success: ['ok', L('Berhasil', 'Success')], warning: ['warn', L('Warning', 'Warning')], failed: ['crit', L('Gagal', 'Failed')], future: ['mute', L('Rencana', 'Planned')] };
  V['INT-002'] = {
    title: function () { return L('Detail Integrasi', 'Integration Detail'); },
    render: function (c0) {
      var c = cx();
      if (!c0.rec) return A.stateCard('empty', L('Pilih integrasi dari Integration Center.', 'Pick an integration from the Integration Center.'), A.btn('blue', L('Integration Center', 'Integration Center'), 'plug', { go: 'INT-001' }));
      var i = Y.integration(c, c0.rec); if (!i) return nfState();
      var mng = can('sys11.integration.manage') && !i.future, d = DIR[i.dir] || DIR.out, im = IMPACT[i.k] || [L('—'), L('—')];
      var hero = P8.hero({ id: i.id, icon: 'plug', title: esc(i.n), sub: t(i.flow), chips: intChip(i) + (i.disabled ? A.chip('mute', L('Dinonaktifkan', 'Disabled'), 'ban') : ''),
        facts: [[L('Sinkron terakhir', 'Last sync'), esc(dt(i.last))], [L('Sukses terakhir', 'Last success'), esc(dt(i.ok))], [L('Error terakhir', 'Last error'), esc(dt(i.errAt))], [L('Tingkat sukses', 'Success rate'), pc(i.rate)], [L('Arah data', 'Direction'), ic(d[0]) + ' ' + t(d[1])], [L('Pemilik', 'Owner'), t(i.owner)]] });
      var problem = i.st !== 'healthy' || i.future ? P.rec({ title: i.future ? L('Integrasi masa depan', 'Future integration') : L('Penjelasan masalah', 'Problem explanation'), icon: 'alert', tone: i.future ? 'info' : i.st === 'warning' ? 'warn' : 'crit',
        sig: i.future ? L('Belum diaktifkan.', 'Not enabled yet.') : Y.MSG.integ, why: i.err || L('—'), impact: im[0], rec: im[1] }) : '';
      var cred = card(L('Kredensial', 'Credential'), kv([[L('Jenis', 'Type'), esc(i.cred.type || '—')], [L('Kunci', 'Key'), '<span class="mono6">' + esc(i.cred.mask || '—') + '</span>'], [L('Berlaku s/d', 'Valid until'), esc(i.cred.exp ? dt(i.cred.exp) : '—')], [L('Status', 'Status'), credChip(i.cred)]]) +
        note(t(L('Secret / API key tidak pernah ditampilkan di UI (§50, §52). Perpanjangan kredensial dilakukan pemilik integrasi di penyedia.', 'Secrets / API keys are never shown in the UI (§50, §52). Credential renewal is done by the integration owner at the provider.')), 'lock', 'info'), { icon: 'key' });
      var apis = card(L('API terkait', 'Related APIs'), i.apis.length ? A.list(i.apis, [
        { h: L('API', 'API'), v: function (a) { return '<b>' + esc(a.n) + '</b><small class="sub5">' + t(a.pur) + '</small>'; } },
        { h: L('Status', 'Status'), v: function (a) { return hChip(a.st); } },
        { h: L('Error rate', 'Error rate'), cls: 'r num', v: function (a) { return pc(a.err); } },
        { h: L('Auth', 'Auth'), v: function (a) { return esc(a.auth); } }
      ], function (a) { return { t: esc(a.n), r: pc(a.err), chip: hChip(a.st) }; }, null, { dense: true }) : A.empty(L('Tidak ada API terkait.', 'No related APIs.')), { icon: 'component', count: i.apis.length, link: H.open('INT-003') ? ['INT-003', L('Semua API', 'All APIs')] : null });
      var log = card(L('Riwayat tindakan', 'Action history'), A.list(i.log, [
        { h: L('Waktu', 'Time'), cls: 'nw', v: function (l) { return esc(l.at); } },
        { h: L('Tindakan', 'Action'), v: function (l) { return t(LOGK[l.kind] || L(l.kind)); } },
        { h: L('Hasil', 'Result'), v: function (l) { var x = LOGR[l.res] || LOGR.success; return A.chip(x[0], x[1]); } },
        { h: L('Pesan', 'Message'), v: function (l) { return t(l.msg); } },
        { h: L('Oleh', 'By'), v: function (l) { return esc(l.by); } }
      ], function (l) { var x = LOGR[l.res] || LOGR.success; return { t: t(LOGK[l.kind] || L(l.kind)), r: esc(l.at.slice(5)), s: t(l.msg), chip: A.chip(x[0], x[1]) }; }, null, { dense: true, empty: L('Belum ada tes, retry atau perubahan status di sesi ini.', 'No tests, retries or status changes yet.') }), { icon: 'history', count: i.log.length });
      var aud = can('sys11.audit.view') ? Y.auditAll(c, { rec: i.id, limit: 6 }) : [];
      var audC = aud.length ? card(L('Audit integrasi', 'Integration audit'), '<div class="rls">' + aud.map(function (r) { return A.rowLink({ href: href('SEC-003', r.id), icon: 'history', t: t(r.actionN), s: esc(r.user) + ' · ' + esc(r.atS), chip: resChip(r.result) }); }).join('') + '</div>', { icon: 'filecheck', link: ['SEC-002', L('Semua', 'All'), null] }) : '';
      var acts = mng ? A.btn('primary', L('Tes Koneksi', 'Test Connection'), 'zap', { act: 'test', val: i.id }) + (i.st === 'warning' || i.st === 'critical' ? A.btn('blue', L('Retry Sync', 'Retry Sync'), 'refresh', { act: 'rsync', val: i.id }) : '') +
        '<span class="hide-m">' + (i.disabled ? A.btn('ghost', L('Aktifkan', 'Enable'), 'play', { act: 'onoff', val: '1' }) : A.btn('danger', L('Nonaktifkan', 'Disable'), 'ban', { act: 'onoff', val: '0' })) + '</span>' : '';
      var bar = mng ? '<div class="hide-d hide-m">' + P8.abar(P8.xl('primary', L('Tes Koneksi', 'Test Connection'), 'zap', { act: 'test', val: i.id }) + (i.st === 'warning' || i.st === 'critical' ? P8.xl('blue', L('Retry Sync', 'Retry Sync'), 'refresh', { act: 'rsync', val: i.id }) : '')) + '</div>' : '';
      return P.head(esc(i.id) + ' · ' + t(i.owner), '<span class="hide-t">' + acts + '</span>', fresh(L('status integrasi live', 'live integration status'))) + deskNote(L('Di ponsel hanya status dan masalah integrasi yang ditampilkan.', 'On a phone only the integration status and problem are shown.')) +
        hero + (problem ? '<div class="sg11-gap">' + problem + '</div>' : '') + noM('<div class="g2-10 sg11-gap"><div class="col10">' + cred + apis + '</div><div class="col10">' + log + audC + '</div></div>') + bar;
    },
    act: Object.assign({
      onoff: function (el) {
        var id = A.S.rec, on = el.getAttribute('data-val') === '1', i = Y.integration(cx(), id); if (!i) return;
        P.reasonDlg({ title: on ? L('Aktifkan ' + i.n, 'Enable ' + i.n) : L('Nonaktifkan ' + i.n, 'Disable ' + i.n), icon: on ? 'play' : 'ban', ok: on ? L('Aktifkan', 'Enable') : L('Nonaktifkan', 'Disable'),
          sub: t(on ? L('Setelah aktif, jalankan tes koneksi.', 'After enabling, run a connection test.') : L('Data berhenti mengalir: ', 'Data stops flowing: ')) + (on ? '' : t(i.flow)),
          fn: function (reason) { return Y.setIntegrationActive(cx(), id, on, reason); }, done: on ? L('Integrasi diaktifkan. Jalankan tes koneksi.', 'Integration enabled. Run a connection test.') : L('Integrasi dinonaktifkan.', 'Integration disabled.') });
      }
    }, intActs)
  };

  /* ================= INT-003 API Management (§52) ================= */
  V['INT-003'] = {
    title: function () { return L('API Management', 'API Management'); },
    render: function () {
      var list = Y.apis(cx()), n = function (s) { return list.filter(function (a) { return a.st === s; }).length; };
      var avg = list.length ? list.reduce(function (s, a) { return s + a.err; }, 0) / list.length : null;
      var tiles = kp([
        { k: L('API', 'APIs'), v: list.length, icon: 'component', tone: 'info' },
        { k: L('Healthy', 'Healthy'), v: n('healthy'), icon: 'checkc', tone: 'ok' },
        { k: L('Warning', 'Warning'), v: n('warning'), icon: 'alert', tone: n('warning') ? 'warn' : 'ok' },
        { k: L('Critical', 'Critical'), v: n('critical'), icon: 'xc', tone: n('critical') ? 'crit' : 'ok' },
        { k: L('Rata-rata error rate', 'Average error rate'), v: pc(avg), icon: 'percent', tone: avg > 5 ? 'warn' : 'ok' }
      ]);
      var tbl = A.list(list, [
        { h: L('API', 'API'), v: function (a) { return '<b>' + esc(a.n) + '</b><small class="sub5 mono6">' + esc(a.id) + '</small>'; } },
        { h: L('Tujuan', 'Purpose'), v: function (a) { return t(a.pur); } },
        { h: L('Status', 'Status'), v: function (a) { return hChip(a.st); } },
        { h: L('Request terakhir', 'Last request'), cls: 'nw', v: function (a) { return esc(dt(a.last)); } },
        { h: L('Error rate', 'Error rate'), cls: 'sg11-pgc', v: function (a) { return '<span class="sg11-pg">' + P.bar(a.err, 100, a.err >= 50 ? 'crit' : a.err > 2 ? 'warn' : 'ok') + '<b class="num">' + pc(a.err) + '</b></span>'; } },
        { h: L('Autentikasi', 'Authentication'), v: function (a) { return esc(a.auth) + ' <span class="sub5">' + ic('lock') + '</span>'; } },
        { h: L('Pemilik', 'Owner'), v: function (a) { return esc(a.owner); } },
        { h: L('Integrasi', 'Integration'), v: function (a) { return a.int ? lnk('INT-002', a.int, mono(a.int)) : '<span class="sub5">' + t(L('Internal', 'Internal')) + '</span>'; } }
      ], function (a) { return { t: esc(a.n), r: pc(a.err), s: t(a.pur), chip: hChip(a.st) }; }, function (a) { return a.int ? href('INT-002', a.int) : null; }, { dense: true });
      var bad = list.filter(function (a) { return a.st !== 'healthy'; });
      var chart = card(L('Error rate per API', 'Error rate per API'), A.hbars(list.slice().sort(function (a, b) { return b.err - a.err; }).map(function (a) { return { l: L(a.n, a.n), v: a.err, hi: a.st !== 'healthy' }; }), { fmt: pc }), { icon: 'chart' });
      var mobile = mOnly(card(L('API bermasalah', 'APIs with problems'), bad.length ? '<div class="rls">' + bad.map(function (a) { return A.rowLink({ href: a.int ? href('INT-002', a.int) : '#', icon: 'component', t: esc(a.n), s: t(L('error rate ', 'error rate ')) + pc(a.err), chip: hChip(a.st), tone: a.st === 'critical' ? 'crit' : 'warn' }); }).join('') + '</div>' : A.empty(L('Semua API sehat.', 'All APIs healthy.')), { icon: 'alert', count: bad.length }));
      return P.head(t(L('Status, request terakhir, error rate, autentikasi dan pemilik setiap API. Tidak ada secret di UI.', 'Status, last request, error rate, authentication and owner of every API. No secrets in the UI.')),
        H.open('INT-001') ? A.btn('ghost', L('Integration Center', 'Integration Center'), 'plug', { go: 'INT-001' }) : '', fresh(L('monitor API live', 'live API monitor'))) + deskNote() + mobile +
        noM(tiles + '<div class="g21-10 sg11-gap"><div class="col10">' + card(L('Daftar API', 'API list'), tbl, { icon: 'component', count: list.length }) + '</div><div class="col10">' + chart +
          note(t(L('API key, token dan secret hanya disimpan di server penyedia. UI hanya menampilkan jenis autentikasi.', 'API keys, tokens and secrets live only with the provider. The UI shows the authentication type only.')), 'lock', 'info') + '</div></div>');
    }
  };

  /* ================= INT-004 Import Center (§53): Upload → Validate → Preview → Errors → Confirm → Import → Audit ================= */
  var FLOW = [L('Upload', 'Upload'), L('Validasi', 'Validate'), L('Preview', 'Preview'), L('Lihat Error', 'Show Errors'), L('Konfirmasi', 'Confirm'), L('Import', 'Import'), L('Audit', 'Audit')];
  var IMP_ST = { validated: ['warn', L('Menunggu konfirmasi', 'Awaiting confirmation'), 'hourglass'], imported: ['ok', L('Diimport (staging)', 'Imported (staging)'), 'checkc'], cancelled: ['mute', L('Dibatalkan', 'Cancelled'), 'ban'] };
  function impChip(st) { var x = IMP_ST[st] || IMP_ST.validated; return A.chip(x[0], x[1], x[2]); }
  function counts(b) { return '<span class="sg11-cnt"><b class="num">' + b.total + '</b><span class="ok">' + b.valid + '</span><span class="warn">' + b.warning + '</span><span class="crit">' + b.error + '</span></span>'; }
  function impTable(list) {
    return A.list(list, [
      { h: L('Batch', 'Batch'), v: function (b) { return '<b class="mono6">' + esc(b.id) + '</b><small class="sub5">' + esc(b.file) + '</small>'; } },
      { h: L('Jenis', 'Type'), v: function (b) { return t(b.typeN); } },
      { h: L('User', 'User'), v: function (b) { return esc(b.byName || b.by); } },
      { h: L('Tanggal', 'Date'), cls: 'nw', v: function (b) { return esc(b.at); } },
      { h: L('Baris · valid · warning · error', 'Rows · valid · warning · error'), v: counts },
      { h: L('Diimport', 'Imported'), cls: 'r num', v: function (b) { return b.st === 'imported' ? n0(b.imported) : '—'; } },
      { h: L('Ditolak', 'Rejected'), cls: 'r num', v: function (b) { return b.st === 'validated' ? '—' : n0(b.rejected); } },
      { h: L('Status', 'Status'), v: function (b) { return impChip(b.st); } }
    ], function (b) { return { t: esc(b.id) + ' · ' + t(b.typeN), r: b.total + ' ' + t(L('baris', 'rows')), s: esc(b.file) + ' · ' + esc(b.at), chip: impChip(b.st) }; }, function (b) { return href('INT-005', b.id); }, { dense: true, empty: L('Belum ada import.', 'No imports yet.') });
  }
  V['INT-004'] = {
    title: function () { return L('Import Center', 'Import Center'); },
    render: function (c0) {
      var c = cx(), q = c0.q || {}, types = Object.keys(Y.IMPORT_TYPES), type = Y.IMPORT_TYPES[q.type] ? q.type : 'client', def = Y.IMPORT_TYPES[type], list = Y.imports(c);
      var pend = list.filter(function (b) { return b.st === 'validated'; });
      var tcards = '<div class="sg11-types">' + types.map(function (k) {
        var d = Y.IMPORT_TYPES[k], st = Y.staged(c, k).length;
        return '<a class="sg11-type' + (k === type ? ' on' : '') + '" href="' + href('INT-004', null, { type: k }) + '" aria-current="' + (k === type) + '"><b>' + t(d.n) + '</b><small>' + d.cols.length + ' ' + t(L('kolom', 'columns')) + (st ? ' · ' + st + ' ' + t(L('di staging', 'staged')) : '') + '</small></a>';
      }).join('') + '</div>';
      var cols = '<ul class="sg11-cols">' + def.cols.map(function (x) { return '<li' + (x[2] ? ' class="req"' : '') + '><span class="mono6">' + esc(x[0]) + '</span><small>' + esc(x[1].replace(/^enum:/, '').replace(/^ref:/, '→ ')) + (x[2] ? ' · ' + t(L('wajib', 'required')) : '') + '</small></li>'; }).join('') + '</ul>';
      var up = card(L('1 · Upload file ' + T(def.n), '1 · Upload a ' + def.n[1] + ' file'), '<div class="sg11-up" id="sg11-up">' +
        fld(L('Jenis data', 'Data type'), sel('type', types.map(function (k) { return [k, Y.IMPORT_TYPES[k].n]; }), type), { req: true }) +
        fld(L('File CSV', 'CSV file'), '<input type="file" id="sg11-file" accept=".csv,text/csv">', { hint: t(L('Baris pertama = nama kolom. Maks. ' + (Y.cfgGet('th.importMaxRows') || 500) + ' baris.', 'First row = column names. Max ' + (Y.cfgGet('th.importMaxRows') || 500) + ' rows.')) }) +
        fld(L('…atau tempel isi CSV', '…or paste CSV content'), '<textarea name="csv" id="sg11-csv" rows="6" spellcheck="false" class="mono6" placeholder="' + esc(def.cols.map(function (x) { return x[0]; }).join(',')) + '"></textarea>', { wide: true }) +
        '<p class="dlg5-e sg11-uperr" id="sg11-uperr" role="alert"></p>' +
        '<div class="sg11-ra">' + A.btn('ghost', L('Pakai data contoh', 'Use sample data'), 'file', { act: 'sample' }) + A.btn('ghost', L('Unduh template', 'Download template'), 'download', { act: 'tpl' }) + A.btn('primary', L('Validasi', 'Validate'), 'filecheck', { act: 'validate' }) + '</div></div>' +
        note(t(L('Tidak ada yang diimport sebelum validasi dan konfirmasi. Data yang sudah ada di sistem tidak pernah ditimpa.', 'Nothing is imported before validation and confirmation. Existing records are never overwritten.')), 'shield', 'info'), { icon: 'upload' });
      var colsC = card(L('Kolom ' + T(def.n), def.n[1] + ' columns'), cols, { icon: 'columns', count: def.cols.length });
      var hist = card(L('Riwayat import (audit §78)', 'Import history (audit §78)'), impTable(list), { icon: 'history', count: list.length });
      var pendC = pend.length ? note(t(L(pend.length + ' batch menunggu konfirmasi.', pend.length + ' batches await confirmation.')) + ' ' + pend.map(function (b) { return lnk('INT-005', b.id, mono(b.id)); }).join(', '), 'hourglass', 'warn') : '';
      return P.head(t(L('Import klien, item, supplier, harga, stok awal dan aset — selalu divalidasi dulu (§54).', 'Import clients, items, suppliers, prices, opening inventory and assets — always validated first (§54).')),
        H.open('INT-006') ? A.btn('ghost', L('Export Center', 'Export Center'), 'download', { go: 'INT-006' }) : '', fresh(L('batch import & staging', 'import batches & staging'))) +
        deskNote(L('Import hanya bisa dilakukan di PC.', 'Imports can only be done on a PC.')) + mOnly(pendC) +
        noM(P8.step8(FLOW, 0) + pendC + tcards + '<div class="g21-10 sg11-gap"><div class="col10">' + up + '</div><div class="col10">' + colsC + '</div></div>' + hist);
    },
    act: {
      sample: function () { var ty = document.querySelector('#sg11-up [name=type]').value, ta = document.getElementById('sg11-csv'); if (ta) ta.value = Y.importSample(ty) || ''; var f = document.getElementById('sg11-file'); if (f) f.value = ''; },
      tpl: function () { var ty = document.querySelector('#sg11-up [name=type]').value; downloadCsv(ty + '-template.csv', Y.importSample(ty) || Y.IMPORT_TYPES[ty].cols.map(function (x) { return x[0]; }).join(',')); },
      validate: function (el) {
        var box = document.getElementById('sg11-up'), ty = box.querySelector('[name=type]').value, fi = document.getElementById('sg11-file'), file = fi && fi.files && fi.files[0], er = document.getElementById('sg11-uperr');
        function run(text, name) {
          var r = Y.importValidate(cx(), ty, text, name);
          if (!r || !r.ok) { if (er) er.textContent = T(r ? r.msg : Y.MSG.invalid); return P.fail(r); }
          A.go('INT-005', r.batch.id);
          setTimeout(function () { A.toast(r.batch.error ? Y.MSG.importErr : L('Validasi selesai: ' + r.batch.valid + ' baris valid.', 'Validation done: ' + r.batch.valid + ' valid rows.'), r.batch.error ? 'warn' : 'ok'); }, 400);
        }
        if (file) { var rd = new FileReader(); rd.onload = function () { run(String(rd.result || ''), file.name); }; rd.onerror = function () { A.toast(Y.MSG.load, 'crit'); }; rd.readAsText(file); return; }
        var text = (document.getElementById('sg11-csv') || {}).value || '';
        if (!text.trim()) { if (er) er.textContent = T(L('Pilih file CSV atau tempel isi CSV.', 'Choose a CSV file or paste CSV content.')); return; }
        run(text, ty + '-tempel.csv');
      }
    }
  };
  // The type select reloads the page with that type (column list, placeholder, sample).
  document.addEventListener('change', function (e) { var s = e.target; if (s && s.name === 'type' && s.closest && s.closest('#sg11-up')) A.go('INT-004', null, { type: s.value }); });

  /* ================= INT-005 Import Validation (§54): total / valid / warning / error, then confirm ================= */
  var ROW_ST = { valid: ['ok', L('Valid', 'Valid'), 'checkc'], warning: ['warn', L('Warning', 'Warning'), 'alert'], error: ['crit', L('Error', 'Error'), 'xc'] };
  function rowChip(st) { var x = ROW_ST[st]; return A.chip(x[0], x[1], x[2]); }
  V['INT-005'] = {
    title: function (rec) { return rec ? L('Validasi Import ' + rec, 'Import Validation ' + rec) : L('Validasi Import', 'Import Validation'); },
    render: function (c0) {
      var c = cx(), q = c0.q || {};
      if (!c0.rec) {
        var pend = Y.imports(c);
        return P.head(t(L('Pilih batch untuk dilihat, atau upload file baru di Import Center.', 'Pick a batch to review, or upload a new file in the Import Center.')), A.btn('primary', L('Upload File', 'Upload File'), 'upload', { go: 'INT-004' })) + card(L('Batch import', 'Import batches'), impTable(pend), { icon: 'history' });
      }
      var b = Y.importBatch(c, c0.rec); if (!b) return nfState();
      var def = Y.IMPORT_TYPES[b.type], good = b.valid + b.warning, mng = can('sys11.import') && b.st === 'validated';
      var step = b.st === 'imported' ? 7 : b.st === 'cancelled' ? 4 : b.error ? 3 : 4;
      var big = P8.bigCount([
        { k: L('Total baris', 'Total rows'), v: b.total, icon: 'list' },
        { k: L('Valid', 'Valid'), v: b.valid, icon: 'checkc', tone: 'ok' },
        { k: L('Warning', 'Warning'), v: b.warning, icon: 'alert', tone: b.warning ? 'warn' : 'ok' },
        { k: L('Error', 'Error'), v: b.error, icon: 'xc', tone: b.error ? 'crit' : 'ok' }
      ]);
      var fk = ROW_ST[q.f] ? q.f : '', rows = b.rows.filter(function (r) { return !fk || r.st === fk; });
      var tabs = H.tabs([['', L('Semua', 'All'), 'list', b.total], ['error', L('Error', 'Error'), 'xc', b.error], ['warning', L('Warning', 'Warning'), 'alert', b.warning], ['valid', L('Valid', 'Valid'), 'checkc', b.valid]], fk, 'f', { def: '' });
      var cols = [{ h: L('Baris', 'Row'), cls: 'r num', v: function (r) { return '<b>' + r.n + '</b>'; } }, { h: L('Status', 'Status'), v: function (r) { return rowChip(r.st); } }]
        .concat(def.cols.map(function (x) { return { h: L(x[0], x[0]), cls: 'nw', v: function (r) { var v = r.data[x[0]]; return v === '' || v == null ? '<span class="sub5">—</span>' : esc(v); } }; }))
        .concat([{ h: L('Masalah', 'Issues'), v: function (r) { return r.errs.concat(r.warns).length ? '<ul class="sg11-iss">' + r.errs.map(function (e) { return '<li class="crit">' + t(e) + '</li>'; }).join('') + r.warns.map(function (w) { return '<li class="warn">' + t(w) + '</li>'; }).join('') + '</ul>' : '<span class="sub5">—</span>'; } }]);
      var prev = card(L('Preview & error per baris', 'Preview & errors per row'), tabs + A.list(rows, cols, function (r) { return { t: t(L('Baris ', 'Row ')) + r.n + ' · ' + esc(r.data[def.key] || '—'), s: r.errs.concat(r.warns).map(t).join(' · '), chip: rowChip(r.st) }; }, null, { dense: true, empty: L('Tidak ada baris dengan status ini.', 'No rows with this status.') }), { icon: 'list', count: rows.length });
      var audit = card(L('Audit import (§78)', 'Import audit (§78)'), kv([
        [L('File', 'File'), esc(b.file)], [L('Jenis', 'Type'), t(b.typeN)], [L('User', 'User'), esc(b.byName || b.by)], [L('Tanggal', 'Date'), esc(b.at)],
        [L('Baris', 'Rows'), n0(b.total)], [L('Valid', 'Valid'), n0(b.valid)], [L('Warning', 'Warning'), n0(b.warning)], [L('Error', 'Error'), n0(b.error)],
        [L('Diimport', 'Imported'), b.st === 'imported' ? '<b>' + n0(b.imported) + '</b> → ' + t(L('staging', 'staging')) : '—'], [L('Ditolak', 'Rejected'), b.st === 'validated' ? '—' : n0(b.rejected)],
        b.confAt ? [L('Dikonfirmasi', 'Confirmed'), esc(b.confAt) + ' · ' + esc(b.confBy || '')] : null
      ]) + (can('sys11.audit.view') && H.open('SEC-002') ? '<div class="sg11-ra">' + A.btn('ghost', L('Lihat di Audit Log', 'View in the Audit Log'), 'history', { go: 'SEC-002', qs: 'rec=' + b.id, cls: 'btn-sm' }) + '</div>' : ''), { icon: 'filecheck' });
      var state = b.st === 'imported' ? note(t(L(b.imported + ' baris diimport ke staging, ' + b.rejected + ' ditolak. Data staging ditinjau pemilik master data sebelum dipakai transaksi.', b.imported + ' rows imported to staging, ' + b.rejected + ' rejected. Staged data is reviewed by the master data owner before transactions use it.')), 'checkc', 'ok')
        : b.st === 'cancelled' ? note(t(L('Batch dibatalkan. Tidak ada data yang diimport.', 'Batch cancelled. No data was imported.')), 'ban', 'info')
        : b.error ? note('<b>' + t(Y.MSG.importErr) + '</b> ' + t(L(b.error + ' baris error akan ditolak; hanya ' + good + ' baris tanpa error yang diimport. Perbaiki file lalu upload ulang bila semua baris harus masuk.', b.error + ' error rows will be rejected; only the ' + good + ' rows without errors are imported. Fix the file and upload again if every row must go in.')), 'alert', 'crit')
        : note(t(L('Semua baris lolos validasi' + (b.warning ? ' (' + b.warning + ' dengan warning — periksa dulu)' : '') + '.', 'All rows passed validation' + (b.warning ? ' (' + b.warning + ' with warnings — check them first)' : '') + '.')), 'checkc', b.warning ? 'warn' : 'ok');
      var acts = mng ? (good ? A.btn('primary', L('Konfirmasi Import ' + good + ' baris', 'Confirm Import of ' + good + ' rows'), 'checkc', { act: 'confirm' }) : '') + A.btn('ghost', L('Batalkan', 'Cancel'), 'x', { act: 'cancel' }) : '';
      var errDl = b.error ? A.btn('ghost', L('Unduh baris error', 'Download error rows'), 'download', { act: 'errs' }) : '';
      return P.head(esc(b.file) + ' · ' + t(b.typeN) + ' · ' + impChip(b.st), '<span class="hide-m sg11-ha">' + acts + errDl + '</span>' + A.btn('ghost', L('Import Center', 'Import Center'), 'upload', { go: 'INT-004' })) + deskNote(L('Validasi & konfirmasi import dilakukan di PC.', 'Import validation & confirmation are done on a PC.')) +
        noM(P8.step8(FLOW, step)) + big + state + noM('<div class="sg11-gap">' + prev + '</div><div class="sg11-gap">' + audit + '</div>');
    },
    act: {
      confirm: function () {
        var b = Y.importBatch(cx(), A.S.rec); if (!b) return; var good = b.valid + b.warning;
        P.reasonDlg({ title: L('Konfirmasi import ' + b.id, 'Confirm import ' + b.id), icon: 'checkc', ok: L('Import ' + good + ' baris', 'Import ' + good + ' rows'), optional: true, label: L('Catatan (opsional)', 'Note (optional)'),
          sub: t(L(good + ' baris (termasuk ' + b.warning + ' warning) masuk ke staging. ' + b.error + ' baris error ditolak. Tercatat di audit.', good + ' rows (incl. ' + b.warning + ' warnings) go to staging. ' + b.error + ' error rows are rejected. Audited.')),
          fn: function (n) { return Y.importConfirm(cx(), b.id, n || null); }, done: L('Import selesai: ' + good + ' baris diimport, ' + b.error + ' ditolak.', 'Import done: ' + good + ' rows imported, ' + b.error + ' rejected.') });
      },
      cancel: function () {
        var id = A.S.rec;
        P.reasonDlg({ title: L('Batalkan batch ' + id, 'Cancel batch ' + id), icon: 'x', ok: L('Batalkan batch', 'Cancel batch'), optional: true, label: L('Alasan (opsional)', 'Reason (optional)'),
          fn: function (n) { return Y.importCancel(cx(), id, n || null); }, done: L('Batch dibatalkan. Tidak ada data yang diimport.', 'Batch cancelled. No data was imported.') });
      },
      errs: function () {
        var b = Y.importBatch(cx(), A.S.rec); if (!b) return; var cols = Y.IMPORT_TYPES[b.type].cols.map(function (x) { return x[0]; });
        var esc2 = function (v) { v = String(v == null ? '' : v); return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; };
        var csv = [['row'].concat(cols).concat(['errors']).join(',')].concat(b.rows.filter(function (r) { return r.st === 'error'; }).map(function (r) { return [r.n].concat(cols.map(function (k) { return r.data[k]; })).concat([r.errs.map(T).join('; ')]).map(esc2).join(','); })).join('\n');
        downloadCsv(b.id + '-errors.csv', csv);
      }
    }
  };

  /* ================= INT-006 Export Center (§55, §79) ================= */
  var XF = { client: ['cl'], orders: ['cl', 'from', 'to'], invoices: ['cl', 'from', 'to'], audit: ['module', 'from', 'to'] };
  V['INT-006'] = {
    title: function () { return L('Export Center', 'Export Center'); },
    render: function (c0) {
      var c = cx(), q = c0.q || {}, types = Y.exportTypes(c), ok = types.filter(function (x) { return x.allowed; }), type = ok.filter(function (x) { return x.k === q.type; })[0] ? q.type : (ok[0] || {}).k;
      var log = Y.exports(c), cls = Y.CM && Y.CM.state ? (Y.CM.state().clients || []) : [], fx = XF[type] || [];
      var tcards = '<div class="sg11-types">' + types.map(function (x) {
        var inner = '<b>' + t(x.n) + '</b><small>' + (x.allowed ? (x.sens ? A.chip('warn', L('Sensitif', 'Sensitive'), 'lock') : A.chip('ok', L('Diizinkan', 'Allowed'), 'checkc')) : A.chip('mute', L('Tanpa izin', 'No permission'), 'lock') + '<span class="sg11-perm mono6">' + esc(x.perm) + '</span>') + '</small>';
        return x.allowed ? '<a class="sg11-type' + (x.k === type ? ' on' : '') + '" href="' + href('INT-006', null, { type: x.k }) + '" aria-current="' + (x.k === type) + '">' + inner + '</a>' : '<div class="sg11-type off" aria-disabled="true">' + inner + '</div>';
      }).join('') + '</div>';
      var form = type ? card(L('Export ' + T(types.filter(function (x) { return x.k === type; })[0].n), 'Export ' + types.filter(function (x) { return x.k === type; })[0].n[1]), '<div class="sg11-up" id="sg11-xf">' +
        (fx.indexOf('cl') >= 0 ? fld(L('Klien', 'Client'), sel('cl', [['', L('Semua klien', 'All clients')]].concat(cls.map(function (x) { return [x.id, Array.isArray(x.n) ? x.n : L(x.id + ' · ' + x.n, x.id + ' · ' + x.n)]; })), '')) : '') +
        (fx.indexOf('module') >= 0 ? fld(L('Modul audit', 'Audit module'), sel('module', [['', L('Semua modul', 'All modules')]].concat(Y.AUDIT_MODULES.map(function (m) { return [m[0], m[1]]; })), '')) : '') +
        (fx.indexOf('from') >= 0 ? fld(L('Dari tanggal', 'From'), inp('from', '', { type: 'date' })) + fld(L('Sampai tanggal', 'To'), inp('to', '', { type: 'date' })) : '') +
        (fx.length ? '' : '<p class="sub5">' + t(L('Export lengkap, tanpa filter.', 'Full export, no filters.')) + '</p>') +
        '<div class="sg11-ra">' + A.btn('primary', L('Export CSV', 'Export CSV'), 'download', { act: 'exp' }) + '</div></div>' +
        note(t(L('Setiap export dicatat: user, modul, filter, jumlah record, waktu (§79). Data mengikuti izin modul Anda.', 'Every export is logged: user, module, filters, record count, time (§79). Data follows your module permissions.')), 'shield', 'info'), { icon: 'download' })
        : card(L('Export', 'Export'), A.stateCard('noperm', L('Anda belum memiliki izin export untuk modul mana pun.', 'You do not have export permission for any module.')), { icon: 'lock' });
      var logT = card(L('Log export (§79)', 'Export log (§79)'), A.list(log, [
        { h: L('ID', 'ID'), v: function (x) { return '<b class="mono6">' + esc(x.id) + '</b><small class="sub5">' + esc(x.file) + '</small>'; } },
        { h: L('User', 'User'), v: function (x) { return esc(x.byName || x.by); } },
        { h: L('Modul', 'Module'), v: function (x) { return esc(x.module) + (x.sens ? ' ' + A.chip('warn', L('Sensitif', 'Sensitive'), 'lock') : ''); } },
        { h: L('Filter', 'Filters'), v: function (x) { var f = x.filters || {}, s = Object.keys(f).filter(function (k) { return f[k]; }).map(function (k) { return k + '=' + f[k]; }).join(', '); return s ? '<span class="mono6">' + esc(s) + '</span>' : '<span class="sub5">' + t(L('Tanpa filter', 'No filters')) + '</span>'; } },
        { h: L('Record', 'Records'), cls: 'r num', v: function (x) { return n0(x.count); } },
        { h: L('Waktu', 'Time'), cls: 'nw', v: function (x) { return esc(x.at); } }
      ], function (x) { return { t: esc(x.module) + ' · ' + n0(x.count), r: esc(x.at.slice(5)), s: esc(x.byName || x.by) + ' · ' + esc(x.id) }; }, null, { dense: true, empty: L('Belum ada export.', 'No exports yet.') }), { icon: 'history', count: log.length });
      return P.head(t(L('Export klien, order, invoice, stok, supplier, aset, audit dan user sesuai izin.', 'Export clients, orders, invoices, inventory, suppliers, assets, audit and users per permission.')),
        H.open('INT-004') && can('sys11.import') ? A.btn('ghost', L('Import Center', 'Import Center'), 'upload', { go: 'INT-004' }) : '', fresh(L('izin export per modul', 'export permission per module'))) +
        deskNote(L('Export dilakukan di PC.', 'Exports are done on a PC.')) + noM(tcards + '<div class="g21-10 sg11-gap"><div class="col10">' + form + '</div><div class="col10">' + logT + '</div></div>');
    },
    act: {
      exp: function () {
        var q = A.S.q || {}, types = Y.exportTypes(cx()).filter(function (x) { return x.allowed; }), type = types.filter(function (x) { return x.k === q.type; })[0] ? q.type : (types[0] || {}).k;
        var v = P.vals(document.getElementById('sg11-xf')), f = {};
        ['cl', 'module', 'from', 'to'].forEach(function (k) { if (v[k]) f[k] = v[k]; });
        if (f.from && f.to && f.from > f.to) { A.toast(L('Tanggal awal setelah tanggal akhir.', 'The start date is after the end date.'), 'crit'); return; }
        exportNow(type, f);
      }
    }
  };

  /* ================= INT-007 System Health (§56, §57, §71) ================= */
  var H_IC = { app: 'grid', db: 'database', api: 'component', jobs: 'loop', notif: 'bell', storage: 'layers', integ: 'plug' };
  V['INT-007'] = {
    title: function () { return L('System Health', 'System Health'); },
    render: function () {
      var c = cx(), h = Y.health(c); if (!h) return errState();
      var ig = Y.integSummary(c), bk = can('sys11.backup.view') ? Y.backups(c) : null, kp = Y.kpis(c), ints = Y.integrations(c), prob = intProblems(ints);
      var tone = { healthy: 'ok', warning: 'warn', critical: 'crit' }[h.overall];
      var hero = '<section class="card sg11-hero sg11-hero-' + tone + '"><div class="sg11-hero-m"><span class="sg11-hero-ic">' + ic(h.overall === 'healthy' ? 'checkc' : 'alert') + '</span><div><span class="sg11-hero-k">JFRESH OS</span><b>' + t(h.overallN).toUpperCase() + '</b></div></div>' +
        '<ul class="sg11-hero-f"><li><span>' + t(L('Uptime', 'Uptime')) + '</span><b class="num">' + A.fmt.num(h.uptime, 1) + '%</b></li>' +
        (bk ? '<li><span>' + t(L('Backup terakhir', 'Last backup')) + '</span><b>' + t(bk.label) + '</b></li>' : '') +
        (ig ? '<li><span>' + t(L('Integrasi', 'Integrations')) + '</span><b class="num">' + esc(ig.label) + ' Healthy</b></li>' : '') +
        '<li><span>' + t(L('Storage', 'Storage')) + '</span><b class="num">' + esc(h.storage.kb) + ' KB · ' + A.fmt.num(h.storage.pct, 1) + '%</b></li></ul></section>';
      var items = '<div class="sg11-hg">' + h.items.map(function (x) {
        var tag = x.s && H.open(x.s) ? 'a' : 'div';
        return '<' + tag + ' class="sg11-h sg11-h-' + x.tone + '"' + (tag === 'a' ? ' href="' + href(x.s) + '"' : '') + '><span class="sg11-h-ic">' + ic(H_IC[x.k] || 'gauge') + '</span><span class="sg11-h-n">' + t(x.n) + '</span>' + hChip(x.st) +
          '<b class="sg11-h-v num">' + esc(x.v) + '</b>' + (x.note ? '<small>' + t(x.note) + '</small>' : '') + '</' + tag + '>';
      }).join('') + '</div>';
      var jobs = card(L('Background jobs', 'Background jobs'), A.list(h.jobs, [
        { h: L('Job', 'Job'), v: function (j) { return '<b>' + t(j.n) + '</b><small class="sub5 mono6">' + esc(j.id) + '</small>'; } },
        { h: L('Jadwal', 'Schedule'), v: function (j) { return '<span class="mono6">' + esc(j.sched) + '</span>'; } },
        { h: L('Jalan terakhir', 'Last run'), cls: 'nw', v: function (j) { return esc(dt(j.last)); } },
        { h: L('Status', 'Status'), v: function (j) { return hChip(j.st); } },
        { h: L('Catatan', 'Note'), v: function (j) { return j.note ? t(j.note) : '<span class="sub5">—</span>'; } }
      ], function (j) { return { t: t(j.n), r: esc(j.sched), s: j.note ? t(j.note) : '', chip: hChip(j.st) }; }, null, { dense: true }), { icon: 'loop', count: h.jobs.length });
      var kpiC = card(L('KPI administrasi sistem (§71)', 'System admin KPIs (§71)'), A.list(kp, [
        { h: L('KPI', 'KPI'), v: function (k) { return '<b>' + t(k.n) + '</b>'; } },
        { h: L('Nilai', 'Value'), cls: 'r num', v: function (k) { return '<b>' + (k.v == null ? '—' : esc(A.fmt.num(k.v, k.u === '%' ? 1 : 0)) + esc(k.u)) + '</b>'; } },
        { h: L('Target', 'Target'), cls: 'r', v: function (k) { return esc(k.target); } },
        { h: L('Status', 'Status'), v: function (k) { return k.st === 'ok' ? A.chip('ok', L('Sesuai target', 'On target'), 'checkc') : k.st === 'warn' ? A.chip('warn', L('Di luar target', 'Off target'), 'alert') : A.chip('info', L('Belum ada data', 'No data')); } }
      ], function (k) { return { t: t(k.n), r: k.v == null ? '—' : esc(A.fmt.num(k.v, 1)) + esc(k.u), chip: k.st === 'ok' ? A.chip('ok', L('OK', 'OK')) : A.chip('warn', L('Cek', 'Check')) }; }, null, { dense: true }), { icon: 'target', count: kp.length });
      var mngI = can('sys11.integration.manage');
      var integ = card(L('Status integrasi', 'Integration status'), (prob.length ? '<div class="sg11-ics">' + prob.map(function (i) { return intCard(i, { noAct: !mngI }); }).join('') + '</div>' : A.empty(L('Belum ada integration error.', 'No integration errors yet.'))), { icon: 'plug', count: prob.length, link: H.open('INT-001') ? ['INT-001', L('Integration Center', 'Integration Center')] : null });
      var stor = card(L('Storage', 'Storage'), '<div class="sg11-stor">' + P.bar(h.storage.pct, 100, h.storage.pct >= 90 ? 'crit' : h.storage.pct >= 70 ? 'warn' : 'ok') + '<p><b class="num">' + esc(h.storage.kb) + ' KB</b> ' + t(L('dari', 'of')) + ' ' + esc(h.storage.quotaKb) + ' KB · ' + A.fmt.num(h.storage.pct, 1) + '%</p></div>' +
        (bk ? kv([[L('Backup terakhir', 'Last backup'), t(bk.label) + ' ' + (bk.st === 'healthy' ? A.chip('ok', L('OK', 'OK'), 'checkc') : A.chip('warn', L('Cek', 'Check'), 'alert'))], [L('Jadwal', 'Schedule'), esc(bk.schedule)]]) + (H.open('SYS-006') ? '<div class="sg11-ra">' + A.btn('ghost', L('Backup & Retensi', 'Backup & Retention'), 'database', { go: 'SYS-006', cls: 'btn-sm' }) + '</div>' : '') : ''), { icon: 'layers' });
      var crit = h.items.filter(function (x) { return x.st !== 'healthy'; });
      var mobile = mOnly(card(L('Perlu perhatian', 'Needs attention'), crit.length ? '<div class="rls">' + crit.map(function (x) { return A.rowLink({ href: x.s && H.open(x.s) ? href(x.s) : '#', icon: H_IC[x.k] || 'gauge', t: t(x.n), s: x.note ? t(x.note) : esc(x.v), chip: hChip(x.st), tone: x.tone }); }).join('') + '</div>' : A.empty(L('Semua komponen sehat.', 'All components healthy.')), { icon: 'alert', count: crit.length }));
      return P.head(t(L('Aplikasi, database, API, background jobs, notifikasi, storage dan integrasi.', 'Application, database, API, background jobs, notifications, storage and integrations.')),
        (H.open('INT-001') ? A.btn('ghost', L('Integrasi', 'Integrations'), 'plug', { go: 'INT-001' }) : '') + (H.open('SYS-001') ? A.btn('ghost', L('Control Center', 'Control Center'), 'grid', { go: 'SYS-001' }) : ''), fresh(L('health check live', 'live health check'))) +
        hero + deskNote() + mobile + noM(items + '<div class="g21-10 sg11-gap"><div class="col10">' + jobs + kpiC + '</div><div class="col10">' + integ + stor + '</div></div>');
    },
    act: intActs
  };
})();
