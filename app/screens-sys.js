/* JFRESH OS — Phase 11 screens (writer S1): internal users, roles, permission matrix and access review
   (ADM-001…005), master data and system configuration (CFG-001…003), notification log, templates and
   channels (NTF-001…004), Super Admin control center, user and integration health, security alerts,
   system settings, backup and retention (SYS-001…006), plus the Phase 2 SYS-* aliases.
   Desktop first; iPad for monitoring, review and quick actions (big buttons); phone shows only alerts and
   the critical summary (§2, §57, §74). Every number and every write goes through the system engine
   (assets/js/jfos-sys.js): permission, reason, maker-checker, versioning and audit live there, never only
   here (§47). Secrets are always masked, audit history is read-only, and Super Admin is not a business
   approver (§63). */
(function () {
  var A = window.JFAPP, P = A && A.P10, H = A && A.P5, P8 = A && A.P8, S = window.JFSYS, X = window.JFACCESS;
  if (!A || !P || !H || !P8 || !S || !X) return;
  var V = A.V, T = A.T, L = A.L, t = A.t, esc = A.esc, ic = A.ic, can = A.can, href = A.href;
  var card = H.card, kv = H.kv, note = H.note, dlg = H.dlg, fld = H.fld, inp = H.inp, sel = H.sel, area = H.area, lnk = H.lnk, open = H.open;
  var n0 = P.n0, pct = P.pct, mono = P.mono;
  A.addParents(S.PARENTS);

  /* ================= Shared helpers ================= */
  function cx() { return A.ctx(); }
  function isM() { return A.mode() === 'm'; }
  function isT() { return A.mode() === 't'; }
  function dt(s) { return s ? esc(H.dt(s)) : '—'; }
  function Lx(a, s) { return [a[0] + s, (a[1] || a[0]) + s]; }
  function qx(over) { var o = Object.assign({}, A.S.q, over || {}); delete o.state; Object.keys(o).forEach(function (k) { if (o[k] == null || o[k] === '') delete o[k]; }); return o; }
  var ST_ICON = { active: 'checkc', invited: 'message', suspended: 'pause', locked: 'lock', inactive: 'ban' };
  function uChip(r) { return A.chip(r.tone, r.stN, ST_ICON[r.status]); }
  function intChip(st) { var x = S.INT_ST[st]; return x ? A.chip(x[1], x[0], { healthy: 'checkc', warning: 'alert', critical: 'xc', disconnected: 'wifioff' }[st]) : A.chip('info', L('Masa depan', 'Future'), 'clock'); }
  function sevChip(sev) { return sev === 'crit' ? A.chip('crit', L('Kritis', 'Critical'), 'alert') : sev === 'warn' ? A.chip('warn', L('Warning', 'Warning'), 'alert') : A.chip('info', L('Info', 'Info'), 'bell'); }
  function av(r, cls) { return '<span class="av sa11-av' + (cls ? ' ' + cls : '') + '" aria-hidden="true">' + esc(r.initials || String(r.name || '?').charAt(0)) + '</span>'; }
  function who(r, link, on) { var nm = '<b>' + esc(r.name) + '</b>'; return '<span class="sa11-who' + (on ? ' sa11-on' : '') + '">' + av(r) + '<span class="sa11-who-t">' + (link ? lnk('ADM-002', r.id, nm) : nm) + '<small>' + esc(r.email || r.u) + '</small></span></span>'; }
  function scopeN(k) { var s = S.SCOPES.filter(function (x) { return x[0] === k; })[0]; return s ? s[1] : L(k || '—'); }
  function permN(p) { return (S.C && S.C.PERMS[p]) || S.PERMS[p] || L(p); }
  function modN(k) { var m = S.MODULES.filter(function (x) { return x.k === k; })[0]; return m ? m.n : L(k); }
  function chips(list, tone, icon) { return list && list.length ? '<span class="sa11-chips">' + list.map(function (x) { return A.chip(tone || 'info', Array.isArray(x) ? x : L(String(x)), icon); }).join('') + '</span>' : '<span class="sub5">—</span>'; }
  function plantN(p) { return X.plantName(p); }
  function empN(id) { if (!id) return '—'; var e = X.employee && X.employee(id); return esc(e ? e.n : id); }
  function boolN(v) { return v ? L('Ya', 'Yes') : L('Tidak', 'No'); }
  function freshLive(src) { return P.fresh({ kind: 'live', src: src, at: S.nowS() }); }

  // Engine refusal → readable text (field errors, unknown/sod permissions, privacy variables, usage count).
  function emsg(r) {
    if (!r) return T(S.MSG.load);
    var m = T(r.msg || S.MSG.invalid), ex = [];
    if (r.errs) Object.keys(r.errs).forEach(function (k) { ex.push(T(r.errs[k])); });
    if (r.unknown && r.unknown.length) ex.push(T(L('Tidak dikenal: ', 'Unknown: ')) + r.unknown.join(', '));
    if (r.sod && r.sod.length) ex.push(r.sod.join(', '));
    if (r.privacy && r.privacy.length) ex.push(T(L('Variabel internal: ', 'Internal variables: ')) + r.privacy.join(', '));
    if (r.inUse) ex.push(T(L('Dipakai ' + r.inUse + ' transaksi/data.', 'Used by ' + r.inUse + ' transactions/records.')));
    if (r.left) ex.push(T(L(r.left + ' user belum diputuskan.', r.left + ' users not decided yet.')));
    return ex.length ? m + ' ' + ex.join(' · ') : m;
  }
  function failT(r) { A.toast(emsg(r), 'crit'); return false; }
  // Reason dialog: every sensitive change goes to the engine with a reason; the engine refuses an empty one.
  function rdlg(o) {
    dlg({ title: o.title, icon: o.icon || 'check', sub: o.sub || '', ok: o.ok || L('Simpan', 'Save'),
      body: (o.body || '') + (o.noReason ? '' : fld(o.label || L('Alasan', 'Reason'), area('reason', '', o.ph || L('Tulis alasan singkat (tercatat di audit)', 'Write a short reason (recorded in the audit)')), { req: !o.optional, wide: true })),
      onOk: function (v, el) {
        v = P.vals(el); var r = o.fn(v.reason, v);
        if (!r || !r.ok) return emsg(r);
        var msg = typeof o.done === 'function' ? o.done(r) : (o.done || L('Tersimpan.', 'Saved.')), tone = r.pending ? 'warn' : null;
        if (o.go) { var g = o.go(r); A.go(g[0], g[1], g[2]); setTimeout(function () { A.toast(msg, tone); }, 450); } else P.after(msg, tone);
        return true;
      }, after: o.after });
  }
  // Checkbox group (multi values) and a non-label field wrapper for it.
  function cks(name, list, on) { return '<div class="ck6 sa11-ck">' + list.map(function (o) { return '<label class="ck6-i"><input type="checkbox" name="' + name + '" data-multi="1" value="' + esc(o[0]) + '"' + ((on || []).indexOf(o[0]) >= 0 ? ' checked' : '') + (o[2] ? ' disabled' : '') + '><span>' + t(o[1]) + '</span></label>'; }).join('') + '</div>'; }
  function grp(label, body, o) { return '<div class="f5 f5-w"><span>' + t(label) + (o && o.req ? ' <i>*</i>' : '') + '</span>' + body + (o && o.hint ? '<small>' + o.hint + '</small>' : '') + '</div>'; }
  // A filter select whose blank option carries its own meaning (A.filters always says "All").
  function fsel(k, label, list) { var cur = A.S.q[k] || ''; return '<label class="fb-f"><span class="sr">' + t(label) + '</span><select data-f="' + k + '" aria-label="' + t(label) + '">' + list.map(function (o) { return '<option value="' + esc(o[0]) + '"' + (o[0] === cur ? ' selected' : '') + '>' + t(label) + ': ' + t(o[1]) + '</option>'; }).join('') + '</select></label>'; }
  function fg(body) { return '<div class="fg5">' + body + '</div>'; }
  function mOpts(cat, blank) { var o = S.masterList(cx(), cat, { st: 'active' }).map(function (r) { return [r.code, r.n]; }); return blank ? [['', blank]].concat(o) : o; }
  function roleOpts() { return S.roles(cx()).filter(function (r) { return r.access && r.group !== 'client'; }).map(function (r) { return [r.k, r.privileged ? Lx(r.n, ' · privileged') : r.n]; }); }
  function plantOpts() { return [[X.ALL, X.plantName(X.ALL)]].concat(X.PLANTS.map(function (p) { return [p.id, p.n]; })); }
  function cast(orig, s) { if (s == null || s === '') return typeof orig === 'number' ? null : orig === null ? null : ''; if (typeof orig === 'number') { var n = Number(String(s).replace(',', '.')); return isNaN(n) ? s : n; } if (typeof orig === 'boolean') return s === 'true' || s === true; if (Array.isArray(orig)) return [s, s]; return s; }
  function sv(v, k) { if (k === 'map' && Array.isArray(v)) return esc(v.join(', ')); return v == null || v === '' ? '—' : Array.isArray(v) ? t(v) : typeof v === 'boolean' ? t(boolN(v)) : esc(String(v)); }

  // Phone: alerts and the critical summary only (§57, §74).
  function mobile(sub, items, rows, empty) {
    return P.head(sub) + (items && items.length ? P8.bigCount(items) : '') +
      card(L('Alert & ringkasan kritis', 'Alerts & critical summary'), rows && rows.length ? '<div class="rls sa11-mrl">' + rows.join('') + '</div>' : A.empty(empty || L('Tidak ada alert.', 'No alerts.')), { icon: 'bell', count: rows ? rows.length : 0 }) + P.deskOnly();
  }
  function alertRow(a) {
    var go = a.s && open(a.s) ? href(a.s, a.rec) : open('SYS-004') ? href('SYS-004', null, { id: a.id }) : '#';
    return A.rowLink({ href: go, icon: a.sev === 'crit' ? 'alert' : 'bell', tone: a.sev === 'crit' ? 'crit' : 'warn', t: t(a.t), s: t(a.c), chip: sevChip(a.sev) });
  }
  function userAlerts(ctx) {
    var out = [];
    S.users(ctx, { status: 'locked' }).forEach(function (u) { out.push(A.rowLink({ href: href('ADM-002', u.id), icon: 'lock', tone: 'crit', t: esc(u.name), s: t(L('Akun terkunci setelah login gagal', 'Account locked after failed sign-ins')), chip: uChip(u) })); });
    S.users(ctx).filter(function (u) { return u.expired && u.status === 'active'; }).forEach(function (u) { out.push(A.rowLink({ href: href('ADM-002', u.id), icon: 'clock', tone: 'crit', t: esc(u.name), s: t(L('Masa akses berakhir ' + u.end + ', akun masih aktif', 'Access ended ' + u.end + ', account still active')), chip: A.chip('crit', L('Akses berakhir', 'Access ended')) })); });
    S.requests(ctx, { st: 'pending' }).forEach(function (r) { var u = X.user(r.uid); out.push(A.rowLink({ href: href('ADM-002', r.uid), icon: 'usercheck', tone: 'warn', t: esc(u ? X.fullName(u) : r.uid) + ' · ' + esc(r.add.join(', ')), s: esc(r.id) + ' · ' + t(L('menunggu persetujuan', 'waiting for approval')), chip: A.chip('appr', L('Menunggu persetujuan', 'Pending approval'), 'hourglass') })); });
    return out;
  }
  function errState() { return A.stateCard('error', S.MSG.load, A.btn('blue', L('Coba Lagi', 'Try Again'), 'refresh', { act: 'retry' })); }

  /* ---------- Section tabs (match the NV-07 / NV-09 sheets) ---------- */
  function navTabs(list, cur) { var items = list.filter(function (x) { return open(x[0]); }); return items.length > 1 ? H.tabs(items, cur, '_s', { hf: function (k) { return href(k); } }) : ''; }
  function admTabs(cur) { return navTabs([['ADM-001', L('Pengguna', 'Users'), 'users'], ['ADM-003', L('Role', 'Roles'), 'idcard'], ['ADM-004', L('Permissions', 'Permissions'), 'columns'], ['ADM-005', L('Access Review', 'Access Review'), 'usercheck']], cur); }
  function ntfTabs(cur) { return navTabs([['NTF-001', L('Log Komunikasi', 'Communication Log'), 'message'], ['NTF-002', L('Template', 'Templates'), 'file'], ['NTF-004', L('Channel', 'Channels'), 'bell']], cur); }
  function cfgTabs(cur) { return navTabs([['CFG-001', L('Master Data', 'Master Data'), 'database'], ['CFG-003', L('Konfigurasi', 'Configuration'), 'cog'], ['SYS-005', L('System Settings', 'System Settings'), 'grid']], cur); }

  // Summary cards like the NV-07 sheet: icon circle, big number, label, sub line.
  function sumCards(items) {
    return '<div class="sa11-sum">' + items.map(function (x) {
      var tag = x.go ? 'a' : 'div';
      return '<' + tag + ' class="sa11-sum-i sa11-t-' + (x.tone || 'info') + '"' + (x.go ? ' href="' + href(x.go, x.rec, x.q) + '"' : '') + '><span class="sa11-sum-ic">' + ic(x.icon) + '</span><span class="sa11-sum-b"><b class="num">' + esc(x.v) + '</b><span>' + t(x.k) + '</span>' + (x.s ? '<small>' + t(x.s) + '</small>' : '') + '</span></' + tag + '>';
    }).join('') + '</div>';
  }

  /* ---------- User status actions (reason + engine guard: never on yourself, superadmin only by priv.approve) ---------- */
  var UACT = { suspend: [L('Tangguhkan', 'Suspend'), 'pause', 'ghost', 'suspended'], deactivate: [L('Nonaktifkan', 'Deactivate'), 'ban', 'danger', 'inactive'], reactivate: [L('Aktifkan Kembali', 'Reactivate'), 'refresh', 'blue', 'active'],
    unlock: [L('Buka Kunci', 'Unlock'), 'key', 'blue', 'active'], activate: [L('Aktifkan', 'Activate'), 'checkc', 'blue', 'active'], forceLogout: [L('Paksa Logout', 'Force Logout'), 'logout', 'ghost', null] };
  var ST_ACTS = { active: ['suspend', 'deactivate', 'forceLogout'], locked: ['unlock', 'deactivate'], suspended: ['reactivate', 'deactivate'], inactive: ['reactivate'], invited: ['activate', 'suspend', 'deactivate'] };
  function stBtns(u, o) {
    if (!can('sys11.users.manage') || (cx() && cx().uid === u.id)) return '';
    return (ST_ACTS[u.status] || []).filter(function (k) { return !o || !o.only || o.only.indexOf(k) >= 0; }).map(function (k) { var a = UACT[k]; return A.btn(o && o.kind ? o.kind : a[2], a[0], a[1], { act: 'ust', val: k + '|' + u.id, cls: o && o.cls }); }).join('');
  }
  function statusDlg(kind, uid) {
    var u = S.user(cx(), uid), a = UACT[kind]; if (!u || !a) return;
    rdlg({ title: Lx(a[0], ' · ' + u.name), icon: a[1], ok: a[0], sub: esc(u.name) + ' · ' + t(u.stN) + (a[3] ? ' → <b>' + t(S.STATUS[a[3]][0]) + '</b>' : '') + '<br>' + t(kind === 'forceLogout' ? L('Semua sesi user ini langsung berakhir.', 'All sessions of this user end immediately.') : L('Perubahan status memaksa logout dan tercatat di audit (sebelum/sesudah/alasan).', 'A status change forces a logout and is audited (before/after/reason).')),
      fn: function (reason) { return S[kind](cx(), uid, reason); }, done: kind === 'forceLogout' ? L('Sesi user diakhiri.', 'User sessions ended.') : L('Status user diperbarui.', 'User status updated.') });
  }
  function reqDlg(id, ok) {
    var r = S.request(cx(), id); if (!r) return;
    var u = X.user(r.uid);
    rdlg({ title: ok ? L('Setujui role privileged', 'Approve privileged role') : L('Tolak permintaan role', 'Reject role request'), icon: ok ? 'checkc' : 'xc', ok: ok ? L('Setujui', 'Approve') : L('Tolak', 'Reject'), optional: ok,
      sub: '<b>' + esc(r.id) + '</b> · ' + esc(u ? X.fullName(u) : r.uid) + ' · +' + esc(r.add.join(', ')) + '<br>' + t(L('Diminta oleh ', 'Requested by ')) + esc(r.byName || r.by) + ' · ' + dt(r.at) + '<br>' + t(L('Maker-checker: pembuat permintaan tidak boleh menyetujui permintaannya sendiri.', 'Maker-checker: the requester cannot approve their own request.')),
      fn: function (reason) { return ok ? S.approveRequest(cx(), id, reason) : S.rejectRequest(cx(), id, reason); }, done: ok ? L('Role disetujui dan diterapkan.', 'Role approved and applied.') : L('Permintaan ditolak.', 'Request rejected.') });
  }
  var UA = {
    ust: function (el) { var p = el.getAttribute('data-val').split('|'); statusDlg(p[0], p[1]); },
    rqok: function (el) { reqDlg(el.getAttribute('data-val'), true); },
    rqno: function (el) { reqDlg(el.getAttribute('data-val'), false); }
  };
  function acts(o) { return Object.assign({}, UA, o || {}); }
  function reqRows(list) {
    return list.length ? '<div class="sa11-rq">' + list.map(function (r) {
      var u = X.user(r.uid), st = { pending: ['appr', L('Menunggu persetujuan', 'Pending approval'), 'hourglass'], approved: ['ok', L('Disetujui', 'Approved'), 'checkc'], rejected: ['crit', L('Ditolak', 'Rejected'), 'xc'] }[r.st] || ['mute', L(r.st), null];
      return '<div class="sa11-rq-i"><div class="sa11-rq-b"><b>' + esc(r.id) + '</b> ' + A.chip(st[0], st[1], st[2]) + '<span>' + lnk('ADM-002', r.uid, esc(u ? X.fullName(u) : r.uid)) + ' · ' + t(L('tambah ', 'add ')) + '<b>' + esc(r.add.join(', ')) + '</b> → ' + esc(r.roles.join(', ')) + '</span>' +
        '<small>' + t(L('Pembuat: ', 'Maker: ')) + esc(r.byName || r.by) + ' · ' + dt(r.at) + ' · ' + t(r.reason) + (r.apprName ? ' · ' + t(L('Checker: ', 'Checker: ')) + esc(r.apprName) + ' ' + dt(r.apprAt) : '') + '</small></div>' +
        (r.st === 'pending' && can('sys11.priv.approve') ? '<div class="sa11-rq-a">' + A.btn('primary', L('Setujui', 'Approve'), 'checkc', { act: 'rqok', val: r.id, cls: 'btn-sm' }) + A.btn('ghost', L('Tolak', 'Reject'), 'xc', { act: 'rqno', val: r.id, cls: 'btn-sm' }) + '</div>' : '') + '</div>';
    }).join('') + '</div>' : A.empty(L('Tidak ada permintaan role.', 'No role requests.'));
  }

  /* ================= ADM-001 Internal User List (§31) ================= */
  function userFilterDefs() {
    return [
      { k: 'dept', l: L('Departemen', 'Department'), opts: mOpts('department') },
      { k: 'status', l: L('Status', 'Status'), opts: Object.keys(S.STATUS).map(function (k) { return [k, S.STATUS[k][0]]; }) },
      { k: 'branch', l: L('Branch', 'Branch'), opts: mOpts('branch') },
      { k: 'role', l: L('Role', 'Role'), opts: roleOpts() },
      { k: 'flag', l: L('Penanda', 'Flag'), opts: [['priv', L('Privileged', 'Privileged')], ['temp', L('Akses sementara', 'Temporary access')], ['expired', L('Akses berakhir', 'Access ended')], ['pending', L('Menunggu persetujuan', 'Pending approval')]] }
    ];
  }
  function userPanel(id, Q) {
    var u = S.user(cx(), id); if (!u) return '';
    var pt = Q.pt || 'detail', self = cx().uid === u.id, body;
    var tabs = H.tabs([['detail', L('Detail', 'Detail')], ['akses', L('Akses', 'Access')], ['aktivitas', L('Aktivitas', 'Activity')]], pt, 'pt', { def: 'detail', label: L('Bagian detail user', 'User detail sections') });
    if (pt === 'akses') {
      body = '<h3 class="sa11-h">' + t(L('Cakupan per modul', 'Scope per module')) + '</h3><ul class="sa11-kl">' + u.scope.map(function (s) { return '<li><span>' + t(modN(s.k)) + '</span><b>' + t(scopeN(s.scope)) + '</b></li>'; }).join('') + '</ul>' +
        '<h3 class="sa11-h">' + t(L('Masa akses', 'Access window')) + '</h3>' + kv([[L('Mulai', 'Start'), dt(u.start)], [L('Berakhir', 'End'), u.end ? dt(u.end) + (u.daysLeft != null ? ' · ' + t(L(u.daysLeft + ' hari lagi', u.daysLeft + ' days left')) : '') : t(L('Permanen', 'Permanent'))]]) +
        '<h3 class="sa11-h">' + t(L('Izin langsung', 'Direct permissions')) + '</h3>' + kv([[L('Tambahan', 'Granted'), chips(u.grant, 'warn')], [L('Dicabut', 'Denied'), chips(u.deny, 'mute')]]);
    } else if (pt === 'aktivitas') {
      body = u.activity.length ? '<ul class="sa11-act">' + u.activity.slice(0, 10).map(function (a) { return '<li><b>' + lnk('SEC-003', a.id, t(a.actionN)) + '</b><small>' + esc(a.atS) + ' · ' + esc(a.user) + (a.result !== 'ok' ? ' · ' + esc(a.result) : '') + '</small></li>'; }).join('') + '</ul>' : A.empty(can('sys11.audit.view') ? L('Belum ada aktivitas tercatat.', 'No recorded activity yet.') : L('Butuh izin audit untuk melihat aktivitas.', 'Audit permission needed to see activity.'));
    } else {
      body = '<h3 class="sa11-h">' + t(L('Informasi Pengguna', 'User Information')) + '</h3><ul class="sa11-inf">' +
        '<li>' + ic('message') + '<span>' + esc(u.email) + '</span></li><li>' + ic('phone') + '<span>' + esc(u.phone || '—') + '</span></li><li>' + ic('idcard') + '<span>' + esc(u.id) + (u.emp ? ' · ' + esc(u.emp) : '') + '</span></li>' +
        '<li>' + ic('calendar') + '<span>' + t(L('Bergabung ', 'Joined ')) + dt(u.joined) + '</span></li><li>' + ic('globe') + '<span>' + t(L('Bahasa: ', 'Language: ')) + (u.lang === 'en' ? 'English' : 'Bahasa Indonesia') + '</span></li></ul>' +
        '<h3 class="sa11-h">' + t(L('Role & Akses', 'Role & Access')) + '</h3><div class="sa11-roles">' + u.roleNames.map(function (n, i) { return '<span class="sa11-role">' + ic('shield') + t(n) + (u.roles[i] === u.defRole && u.roles.length > 1 ? ' <small>' + t(L('utama', 'default')) + '</small>' : '') + '</span>'; }).join('') + '</div>' +
        '<ul class="sa11-pl">' + u.byModule.slice(0, 6).map(function (m) { return '<li>' + ic('checkc') + '<span>' + t(modN(m.k)) + ' <small>' + m.n2 + ' ' + t(L('izin', 'perms')) + ' · ' + m.actions.map(function (a) { return T(S.ACTIONS.filter(function (x) { return x[0] === a; })[0][1]); }).join(', ') + '</small></span></li>'; }).join('') + '</ul>' +
        '<a class="sa11-more" href="' + href('ADM-002', u.id) + '">' + t(L('Lihat semua hak akses', 'See all access rights')) + ' ' + ic('arrow') + '</a>' +
        '<h3 class="sa11-h">' + t(L('Akses Plant', 'Plant Access')) + '</h3>' + chips(u.plants.map(plantN), 'info', 'building') +
        '<h3 class="sa11-h">' + t(L('Status Akun', 'Account Status')) + '</h3>' + uChip(u) + (u.pending.length ? ' ' + A.chip('appr', L('Menunggu persetujuan', 'Pending approval'), 'hourglass') : '') +
        '<ul class="sa11-inf"><li>' + ic('calendar') + '<span>' + t(L('Terakhir login ', 'Last login ')) + dt(u.lastLogin) + '</span></li><li>' + ic('monitor') + '<span>' + esc(u.lastDevice || '—') + '</span></li></ul>';
    }
    var foot = '<div class="sa11-side-f">' + A.btn('ghost', L('Edit Pengguna', 'Edit User'), 'edit', { go: 'ADM-002', rec: u.id }) +
      (can('sys11.users.manage') && !self ? (u.status === 'inactive' ? A.btn('blue', UACT.reactivate[0], 'refresh', { act: 'ust', val: 'reactivate|' + u.id }) : A.btn('danger', UACT.deactivate[0], 'ban', { act: 'ust', val: 'deactivate|' + u.id })) : '') + '</div>';
    return '<aside class="card sa11-side" aria-label="' + t(L('Detail pengguna', 'User detail')) + '"><div class="sa11-ph">' + av(u, 'lg') + '<div class="sa11-ph-t"><b>' + esc(u.name) + '</b>' + uChip(u) + '<small>' + t(u.posN) + ' · ' + t(u.branchN) + '</small></div></div>' + tabs + '<div class="sa11-side-b">' + body + '</div>' + foot + '</aside>';
  }
  V['ADM-001'] = {
    render: function (c) {
      var ctx = cx(), Q = c.q, sm = S.userSummary(ctx); if (!sm) return errState();
      if (isM()) return mobile(t(L('Ringkasan akun internal. Kelola user di PC.', 'Internal account summary. Manage users on a PC.')), [
        { k: L('Aktif', 'Active'), v: sm.active, icon: 'usercheck', tone: 'ok' }, { k: L('Terkunci', 'Locked'), v: sm.locked, icon: 'lock', tone: sm.locked ? 'crit' : 'ok' },
        { k: L('Akses berakhir', 'Access ended'), v: sm.expired, icon: 'clock', tone: sm.expired ? 'crit' : 'ok' }, { k: L('Menunggu persetujuan', 'Pending approval'), v: S.requests(ctx, { st: 'pending' }).length, icon: 'hourglass', tone: 'warn' }
      ], userAlerts(ctx));
      var rows = S.users(ctx, { q: Q.q, dept: Q.dept, status: Q.status, branch: Q.branch, role: Q.role, privileged: Q.flag === 'priv' ? true : null, temp: Q.flag === 'temp' ? true : null });
      if (Q.flag === 'expired') rows = rows.filter(function (r) { return r.expired; });
      if (Q.flag === 'pending') rows = rows.filter(function (r) { return r.pending.length; });
      var side = !isT(), selId = Q.u && rows.some(function (r) { return r.id === Q.u; }) ? Q.u : rows[0] && rows[0].id;
      var head = P.head(t(L('Kelola pengguna, role, dan hak akses sistem JFRESH OS.', 'Manage users, roles and access rights of JFRESH OS.')), A.pbtn('sys11.users.manage', 'primary', L('Tambah Pengguna', 'Add User'), 'plus', { go: 'ADM-002', rec: 'new' }), freshLive(L('akun & sesi JFACCESS + master Fase 11', 'JFACCESS accounts & sessions + Phase 11 master')));
      var sum = sumCards([
        { v: n0(sm.total), k: L('Total Pengguna', 'Total Users'), s: L('+' + sm.newMonth + ' bulan ini', '+' + sm.newMonth + ' this month'), icon: 'user', tone: 'info', go: 'ADM-001' },
        { v: n0(sm.active), k: L('Aktif', 'Active'), s: L(pct(sm.pctActive, 0) + ' dari total', pct(sm.pctActive, 0) + ' of total'), icon: 'users', tone: 'ok', go: 'ADM-001', q: { status: 'active' } },
        { v: n0(sm.notActive), k: L('Nonaktif', 'Inactive'), s: L(pct(sm.pctNotActive, 0) + ' dari total · ' + sm.suspended + ' ditangguhkan', pct(sm.pctNotActive, 0) + ' of total · ' + sm.suspended + ' suspended'), icon: 'pause', tone: 'warn', go: 'ADM-001', q: { status: 'inactive' } },
        { v: n0(sm.locked), k: L('Terkunci', 'Locked'), s: L(pct(sm.pctLocked, 0) + ' dari total', pct(sm.pctLocked, 0) + ' of total'), icon: 'lock', tone: 'crit', go: 'ADM-001', q: { status: 'locked' } }
      ]);
      var pend = S.requests(ctx, { st: 'pending' });
      var bn = pend.length ? note(t(L(pend.length + ' permintaan role privileged menunggu persetujuan admin kedua (maker-checker).', pend.length + ' privileged role request(s) waiting for a second admin (maker-checker).')) + ' ' + lnk('ADM-002', pend[0].uid, t(L('Buka', 'Open'))), 'hourglass', 'warn') : '';
      var fb = A.filters(userFilterDefs(), { search: L('Cari nama, email, atau posisi…', 'Search name, email or position…') });
      var cols = [
        { h: L('Nama', 'Name'), v: function (r) { return who(r, false, side && r.id === selId); } },
        { h: L('Posisi', 'Position'), v: function (r) { return t(r.posN) + '<small class="sub5">' + t(r.deptN) + '</small>'; } },
        { h: L('Branch', 'Branch'), v: function (r) { return t(r.branchN); } },
        { h: L('Role', 'Role'), v: function (r) { return r.roleNames.map(function (n) { return t(n); }).join(', ') + (r.privileged ? '<small class="sub5 sa11-pvt">' + ic('shield') + t(L('Privileged', 'Privileged')) + '</small>' : ''); } },
        { h: L('Status', 'Status'), v: function (r) { return uChip(r) + (r.pending.length ? ' ' + A.chip('appr', L('Menunggu', 'Pending'), 'hourglass') : '') + (r.expired ? ' ' + A.chip('crit', L('Akses berakhir', 'Access ended'), 'clock') : r.temp ? ' ' + A.chip('info', L('Sementara', 'Temporary'), 'clock') : ''); } },
        side ? null : { h: L('Login terakhir', 'Last login'), v: function (r) { return dt(r.lastLogin) + '<small class="sub5">' + esc(r.lastDevice || '') + '</small>'; } }
      ].filter(Boolean);
      var tbl = P.table(rows, cols, function (r) { return { t: esc(r.name), r: '', s: t(r.posN), chip: uChip(r) }; }, function (r) { return side ? href('ADM-001', null, qx({ u: r.id })) : href('ADM-002', r.id); }, { empty: L('Belum ada user tambahan.', 'No additional users yet.') });
      var foot = '<p class="sa11-cnt">' + t(L('Menampilkan ' + rows.length + ' dari ' + sm.total + ' pengguna', 'Showing ' + rows.length + ' of ' + sm.total + ' users')) + '</p>';
      return head + sum + admTabs('ADM-001') + bn + fb + (side ? '<div class="sa11-split"><div class="sa11-main">' + tbl + foot + '</div>' + (selId ? userPanel(selId, Q) : '') + '</div>' : tbl + foot);
    },
    act: acts()
  };

  /* ================= ADM-002 User Detail (§29–§31, §77) ================= */
  function addForm() {
    return '<form class="card" id="sa11-uf" onsubmit="return false"><div class="card-h"><h2>' + ic('user') + '<span>' + t(L('Data pengguna baru', 'New user details')) + '</span></h2></div>' + fg(
      fld(L('Nama lengkap', 'Full name'), inp('name', '', { ph: L('mis. Ni Luh Eka', 'e.g. Ni Luh Eka') }), { req: true }) + fld(L('Username', 'Username'), inp('u', '', { ph: L('huruf kecil, mis. eka', 'lowercase, e.g. eka') }), { req: true }) +
      fld(L('Email', 'Email'), inp('email', '', { type: 'email', ph: L('nama@jfreshlaundry.app', 'name@jfreshlaundry.app') }), { req: true }) + fld(L('Telepon', 'Phone'), inp('phone', '', { ph: L('+62 …', '+62 …') })) +
      fld(L('Departemen', 'Department'), sel('dept', mOpts('department', L('Pilih', 'Choose')), '')) + fld(L('Posisi', 'Position'), sel('pos', mOpts('position', L('Pilih', 'Choose')), '')) +
      fld(L('Branch', 'Branch'), sel('branch', mOpts('branch', L('Pilih', 'Choose')), '')) + fld(L('Akses plant', 'Plant access'), sel('plant', [['', L('Ikuti branch', 'Follow the branch')]].concat(plantOpts()), '')) +
      fld(L('Akses mulai', 'Access start'), inp('start', S.today(), { type: 'date' })) + fld(L('Akses berakhir (akses sementara)', 'Access end (temporary access)'), inp('end', '', { type: 'date' }), { hint: t(L('Kosongkan untuk akses permanen.', 'Leave empty for permanent access.')) }) +
      fld(L('Bahasa', 'Language'), sel('lang', [['id', L('Bahasa Indonesia', 'Bahasa Indonesia')], ['en', L('English', 'English')]], 'id')) +
      grp(L('Role', 'Role'), cks('roles', roleOpts(), []), { req: true, hint: t(L('Role menentukan workspace; izin menentukan aksi. Role privileged (Owner, Finance, Super Admin, System Admin) menunggu persetujuan admin kedua.', 'The role decides the workspace; permissions decide the actions. Privileged roles (Owner, Finance, Super Admin, System Admin) wait for a second admin.')) }) +
      fld(L('Alasan', 'Reason'), area('reason', '', L('mis. karyawan baru tim produksi', 'e.g. new production team member')), { req: true, wide: true })) +
      '<p class="dlg5-e sa11-err" id="sa11-err" role="alert"></p></form>';
  }
  function editDlg(u) {
    rdlg({ title: L('Edit Pengguna', 'Edit User'), icon: 'edit', sub: esc(u.name) + ' · ' + esc(u.id),
      body: fg(fld(L('Nama lengkap', 'Full name'), inp('name', u.name)) + fld(L('Email', 'Email'), inp('email', u.email, { type: 'email' })) + fld(L('Telepon', 'Phone'), inp('phone', u.phone || '')) +
        fld(L('Bahasa', 'Language'), sel('lang', [['id', L('Bahasa Indonesia', 'Bahasa Indonesia')], ['en', L('English', 'English')]], u.lang)) + fld(L('Departemen', 'Department'), sel('dept', mOpts('department', L('—', '—')), u.dept)) +
        fld(L('Posisi', 'Position'), sel('pos', mOpts('position', L('—', '—')), u.pos)) + fld(L('Branch', 'Branch'), sel('branch', mOpts('branch', L('—', '—')), u.branch))),
      fn: function (reason, v) { var f = {}; ['name', 'email', 'phone', 'dept', 'pos', 'branch', 'lang'].forEach(function (k) { if (v[k]) f[k] = v[k]; }); return S.editUser(cx(), u.id, f, reason); }, done: L('Data user diperbarui.', 'User details updated.') });
  }
  function rolesDlg(u) {
    var o = roleOpts();
    rdlg({ title: L('Ubah Role', 'Change Roles'), icon: 'shield', sub: esc(u.name) + ' · ' + t(L('Melepas role langsung berlaku. Menambah role privileged menjadi permintaan untuk admin kedua.', 'Removing a role applies immediately. Adding a privileged role becomes a request for a second admin.')),
      body: grp(L('Role', 'Roles'), cks('roles', o, u.roles), { req: true }) + fld(L('Role utama (workspace)', 'Default role (workspace)'), sel('def', o, u.defRole)),
      fn: function (reason, v) { return S.setRoles(cx(), u.id, v.roles, reason, { def: v.def }); },
      done: function (r) { return r.pending ? L('Permintaan ' + r.pending.id + ' menunggu persetujuan admin kedua.', 'Request ' + r.pending.id + ' is waiting for a second admin.') : L('Role diperbarui.', 'Roles updated.'); } });
  }
  function plantsDlg(u) {
    rdlg({ title: L('Akses Plant', 'Plant Access'), icon: 'building', sub: esc(u.name), body: grp(L('Plant', 'Plants'), cks('plants', plantOpts(), u.plants), { req: true, hint: t(L('Semua Plant = akses lintas plant.', 'All Plants = cross-plant access.')) }),
      fn: function (reason, v) { return S.setPlants(cx(), u.id, v.plants, reason); }, done: L('Akses plant diperbarui.', 'Plant access updated.') });
  }
  function accessDlg(u) {
    rdlg({ title: L('Masa Akses', 'Access Window'), icon: 'calendar', sub: esc(u.name) + ' · ' + t(L('Login ditolak di luar masa akses. Akhir harus ≥ hari ini.', 'Sign-in is refused outside the window. The end must be ≥ today.')),
      body: fg(fld(L('Mulai', 'Start'), inp('start', u.start || S.today(), { type: 'date' })) + fld(L('Berakhir', 'End'), inp('end', u.end || '', { type: 'date' }), { hint: t(L('Kosongkan = permanen.', 'Empty = permanent.')) })),
      fn: function (reason, v) { return S.setAccess(cx(), u.id, { start: v.start || null, end: v.end || null }, reason); }, done: L('Masa akses diperbarui.', 'Access window updated.') });
  }
  function permsDlg(u) {
    rdlg({ title: L('Izin Langsung', 'Direct Permissions'), icon: 'key', sub: esc(u.name) + ' · ' + t(L('Kode izin satu per satu, pisahkan dengan koma. Wildcard (*) ditolak. Admin tidak boleh menerima hak persetujuan bisnis (§63).', 'Permission codes one by one, comma separated. Wildcards (*) are refused. Admins cannot receive business approval rights (§63).')),
      body: fld(L('Tambahan (grant)', 'Granted'), area('grant', u.grant.join(', '), L('mis. rpt.ops', 'e.g. rpt.ops')), { wide: true }) + fld(L('Dicabut (deny)', 'Denied'), area('deny', u.deny.join(', '), L('mis. fin.invoice.fix.approve', 'e.g. fin.invoice.fix.approve')), { wide: true }),
      fn: function (reason, v) { var sp = function (s) { return String(s || '').split(/[\s,]+/).filter(Boolean); }; return S.setUserPerms(cx(), u.id, sp(v.grant), sp(v.deny), reason); }, done: L('Izin user diperbarui.', 'User permissions updated.') });
  }
  V['ADM-002'] = {
    title: function (rec) { if (rec === 'new') return L('Tambah Pengguna', 'Add User'); var u = rec && S.user(cx(), rec); return u ? L(u.name, u.name) : L('Detail User', 'User Detail'); },
    render: function (c) {
      var ctx = cx();
      if (c.rec === 'new') {
        if (!can('sys11.users.manage')) return A.stateCard('noperm', L('Anda tidak memiliki izin untuk menambah user.', 'You do not have permission to add users.'), A.backBtn());
        if (isM()) return mobile(t(L('Tambah user dilakukan di PC.', 'Adding users is done on a PC.')), [], userAlerts(ctx));
        return P.head(t(L('User baru berstatus Diundang dan menjadi Aktif saat login pertama. Semua isian tercatat di audit.', 'A new user starts as Invited and becomes Active on the first sign-in. Everything is recorded in the audit.'))) + addForm() +
          P8.abar(A.btn('primary', L('Simpan & Undang', 'Save & Invite'), 'check', { act: 'add' }), A.btn('ghost', L('Batal', 'Cancel'), 'x', { go: 'ADM-001' }));
      }
      var u = c.rec && S.user(ctx, c.rec);
      if (!u) return A.stateCard('empty', S.MSG.notfound, A.backBtn());
      if (u.client) return A.stateCard('empty', L('User klien dikelola di Portal Klien (Pengguna & Akses).', 'Client users are managed in the Client Portal (Users & Access).'), open('CLP-013') ? A.btn('blue', L('Buka', 'Open'), 'arrow', { go: 'CLP-013' }) : A.backBtn());
      if (isM()) {
        var rows = userAlerts(ctx).filter(function (h) { return h.indexOf(esc(u.name)) >= 0 || h.indexOf('/' + u.id) >= 0; });
        return mobile(esc(u.name) + ' · ' + t(u.posN), [{ k: L('Status', 'Status'), v: T(u.stN), icon: ST_ICON[u.status], tone: u.tone === 'mute' ? 'info' : u.tone }, { k: L('Izin', 'Permissions'), v: u.permCount, icon: 'key' }], rows, L('Tidak ada alert untuk user ini.', 'No alerts for this user.'));
      }
      var self = ctx.uid === u.id, mng = can('sys11.users.manage'), sup = u.roles.indexOf('superadmin') >= 0 && !can('sys11.priv.approve');
      var hero = P8.hero({ icon: 'user', id: u.id + ' · ' + u.u, title: esc(u.name), sub: t(u.posN) + ' · ' + t(u.deptN) + ' · ' + t(u.branchN),
        chips: uChip(u) + (u.privileged ? A.chip('appr', L('Privileged', 'Privileged'), 'shield') : '') + (u.admin ? A.chip('info', L('Admin sistem', 'System admin'), 'cog') : '') + (u.expired ? A.chip('crit', L('Akses berakhir', 'Access ended'), 'clock') : u.temp ? A.chip('info', L('Akses sementara', 'Temporary access'), 'clock') : '') + (u.pending.length ? A.chip('appr', L('Menunggu persetujuan', 'Pending approval'), 'hourglass') : ''),
        facts: [[L('Email', 'Email'), esc(u.email)], [L('Telepon', 'Phone'), esc(u.phone || '—')], [L('Karyawan', 'Employee'), esc(u.emp || '—')], [L('Bergabung', 'Joined'), dt(u.joined)], [L('Login terakhir', 'Last login'), dt(u.lastLogin)], [L('Perangkat', 'Device'), esc(u.lastDevice || '—')], [L('Bahasa', 'Language'), u.lang === 'en' ? 'English' : 'Bahasa Indonesia']] });
      var bar = mng && !self && !sup ? '<div class="sa11-bar">' + A.btn('blue', L('Edit', 'Edit'), 'edit', { act: 'edit' }) + A.btn('ghost', L('Ubah Role', 'Change Roles'), 'shield', { act: 'roles' }) + A.btn('ghost', L('Akses Plant', 'Plant Access'), 'building', { act: 'plants' }) + A.btn('ghost', L('Masa Akses', 'Access Window'), 'calendar', { act: 'access' }) +
        A.pbtn('sys11.perm.manage', 'ghost', L('Izin Langsung', 'Direct Permissions'), 'key', { act: 'perms' }) + '<span class="sa11-sp"></span>' + stBtns(u) + '</div>' : '';
      var guard = self ? note(t(S.MSG.self), 'lock', 'info') : sup ? note(t(L('Akun Super Admin hanya bisa diubah oleh pemegang izin persetujuan privileged.', 'Super Admin accounts can only be changed by holders of the privileged-approval permission.')), 'lock', 'info') : '';
      var roleC = card(L('Role & izin efektif', 'Role & effective permissions'), '<div class="sa11-roles">' + u.roleNames.map(function (n, i) { return '<span class="sa11-role">' + ic('shield') + t(n) + (u.roles[i] === u.defRole ? ' <small>' + t(L('utama', 'default')) + '</small>' : '') + '</span>'; }).join('') + '</div>' +
        P.table(u.byModule, [
          { h: L('Modul', 'Module'), v: function (m) { return open('ADM-004') ? lnk('ADM-004', null, t(m.n), { r: u.defRole, mod: m.k }) : t(m.n); } },
          { h: L('Izin', 'Perms'), cls: 'r num', v: function (m) { return n0(m.n2); } },
          { h: L('Aksi', 'Actions'), v: function (m) { return chips(m.actions.map(function (a) { return S.ACTIONS.filter(function (x) { return x[0] === a; })[0][1]; }), a2tone()); } }
        ], null, null, { empty: L('User ini tidak punya izin.', 'This user has no permissions.') }) + '<p class="sa11-cnt">' + t(L(u.permCount + ' izin efektif (role utama + tambahan − dicabut).', u.permCount + ' effective permissions (default role + granted − denied).')) + '</p>', { icon: 'shield', count: u.permCount });
      function a2tone() { return 'info'; }
      var scopeC = card(L('Cakupan & masa akses', 'Scope & access window'), kv([[L('Mulai', 'Start'), dt(u.start)], [L('Berakhir', 'End'), u.end ? dt(u.end) + (u.daysLeft != null ? ' · ' + t(L(u.daysLeft + ' hari lagi', u.daysLeft + ' days left')) : '') + (u.expired ? ' ' + A.chip('crit', L('Berakhir', 'Ended')) : '') : t(L('Permanen', 'Permanent'))], [L('Plant', 'Plants'), chips(u.plants.map(plantN), 'info', 'building')]]) +
        '<ul class="sa11-kl">' + u.scope.map(function (s) { return '<li><span>' + t(modN(s.k)) + '</span><b>' + t(scopeN(s.scope)) + '</b></li>'; }).join('') + '</ul>', { icon: 'layers' });
      var directC = card(L('Izin langsung di luar role', 'Direct permissions outside the role'), kv([[L('Tambahan', 'Granted'), u.grant.length ? '<span class="sa11-chips">' + u.grant.map(function (p) { return A.chip(S.isBusinessApproval(p) ? 'crit' : 'warn', L(p), 'key'); }).join('') + '</span>' : '—'], [L('Dicabut', 'Denied'), chips(u.deny, 'mute')]]) + (u.grant.length ? note(t(L('Izin langsung selalu muncul di review akses.', 'Direct grants always show up in the access review.')), 'info', 'info') : ''), { icon: 'key' });
      var reqC = card(L('Permintaan role (maker-checker)', 'Role requests (maker-checker)'), reqRows(u.requests), { icon: 'usercheck', count: u.requests.length });
      var actC = card(L('Aktivitas & riwayat akses', 'Activity & access history'), u.activity.length ? P.table(u.activity.slice(0, 12), [
        { h: L('Waktu', 'Time'), v: function (a) { return esc(a.atS); } },
        { h: L('Aksi', 'Action'), v: function (a) { return lnk('SEC-003', a.id, t(a.actionN)); } },
        { h: L('Oleh', 'By'), v: function (a) { return esc(a.user); } },
        { h: L('Alasan', 'Reason'), v: function (a) { return esc(a.reason || '—'); } },
        { h: L('Hasil', 'Result'), v: function (a) { return A.chip(a.result === 'ok' ? 'ok' : a.result === 'denied' ? 'crit' : 'warn', L(a.result)); } }
      ]) : A.empty(can('sys11.audit.view') ? L('Belum ada aktivitas.', 'No activity yet.') : L('Butuh izin audit.', 'Audit permission needed.')), { icon: 'history', link: open('SEC-002') ? ['SEC-002', L('Audit Log', 'Audit Log')] : null });
      return hero + bar + guard + '<div class="g2-10">' + roleC + '<div class="col10">' + scopeC + directC + '</div></div>' + reqC + actC;
    },
    act: acts({
      add: function () {
        var f = document.getElementById('sa11-uf'), v = P.vals(f), e = document.getElementById('sa11-err');
        var r = S.addUser(cx(), { name: v.name, u: v.u, email: v.email, phone: v.phone, dept: v.dept || null, pos: v.pos || null, branch: v.branch || null, roles: v.roles, plants: v.plant ? [v.plant] : null, start: v.start || null, end: v.end || null, lang: v.lang }, v.reason);
        if (!r.ok) { if (e) e.textContent = emsg(r); failT(r); return; }
        A.go('ADM-002', r.user.id);
        setTimeout(function () { A.toast(r.pending ? L('User diundang. Role privileged menunggu persetujuan (' + r.pending.id + ').', 'User invited. The privileged role waits for approval (' + r.pending.id + ').') : L('User diundang. Aktif setelah login pertama.', 'User invited. Active after the first sign-in.'), r.pending ? 'warn' : null); }, 450);
      },
      edit: function () { editDlg(S.user(cx(), A.S.rec)); },
      roles: function () { rolesDlg(S.user(cx(), A.S.rec)); },
      plants: function () { plantsDlg(S.user(cx(), A.S.rec)); },
      access: function () { accessDlg(S.user(cx(), A.S.rec)); },
      perms: function () { permsDlg(S.user(cx(), A.S.rec)); }
    })
  };

  /* ================= ADM-003 Role Master (§30, §32) ================= */
  function rolePanel(k) {
    var r = S.role(cx(), k); if (!r) return '';
    var byMod = {}; r.permList.forEach(function (p) { (byMod[p.module] = byMod[p.module] || []).push(p); });
    var mods = Object.keys(byMod).map(function (m) { var l = byMod[m]; return '<li><span>' + (open('ADM-004') ? lnk('ADM-004', null, t(modN(m)), { r: k, mod: m }) : t(modN(m))) + '</span><b>' + l.length + '</b>' + (l.some(function (p) { return p.business; }) ? A.chip('warn', L('Persetujuan bisnis', 'Business approval'), 'scale') : '') + '</li>'; }).join('');
    var vers = r.versions.slice(0, 6).map(function (v) { var ch = v.change; var d = !ch ? '' : ch.add || ch.rm ? '+' + (ch.add || []).length + ' / −' + (ch.rm || []).length : ch.scope ? esc(ch.scope.join(' · ')) : ch.from ? T(L('clone dari ', 'cloned from ')) + esc(ch.from) : ch.meta ? T(L('nama/deskripsi', 'name/description')) : ''; return '<li><b>v' + v.v + '</b><span>' + t(v.reason) + (d ? ' <small>(' + d + ')</small>' : '') + '<small>' + esc(v.at) + ' · ' + esc(v.byName || v.by) + '</small></span></li>'; }).join('');
    return '<aside class="card sa11-side"><div class="sa11-ph"><span class="sa11-ph-ic">' + ic('idcard') + '</span><div class="sa11-ph-t"><b>' + t(r.n) + '</b>' + (r.privileged ? A.chip('appr', L('Privileged', 'Privileged'), 'shield') : A.chip('info', L('Standar', 'Standard'))) + '<small>' + esc(k) + ' · v' + r.v + (r.custom ? ' · ' + t(L('turunan ', 'derived from ')) + esc(r.from) : '') + '</small></div></div>' +
      '<div class="sa11-side-b">' + (r.desc ? '<p class="sa11-desc">' + t(r.desc) + '</p>' : '') + kv([[L('Workspace', 'Workspace'), t(r.workspace.n) + ' · ' + esc(r.workspace.landing || '—')], [L('Perangkat utama', 'Primary device'), esc(r.device || '—')], [L('User', 'Users'), r.active + ' ' + t(L('aktif dari ', 'active of ')) + r.users], [L('Izin', 'Permissions'), r.perms + ' · ' + r.modules + ' ' + t(L('modul', 'modules'))]]) +
      '<h3 class="sa11-h">' + t(L('Izin per modul', 'Permissions per module')) + '</h3><ul class="sa11-kl">' + (mods || '<li>—</li>') + '</ul>' +
      '<h3 class="sa11-h">' + t(L('Pemegang role', 'Role holders')) + '</h3>' + (r.userList.length ? '<ul class="sa11-act">' + r.userList.slice(0, 8).map(function (u) { return '<li>' + lnk('ADM-002', u.id, '<b>' + esc(u.name) + '</b>') + ' <small>' + t(S.STATUS[u.status] ? S.STATUS[u.status][0] : L(u.status)) + '</small></li>'; }).join('') + '</ul>' : A.empty(L('Belum ada user dengan role ini.', 'No users hold this role.'))) +
      '<h3 class="sa11-h">' + t(L('Riwayat versi', 'Version history')) + '</h3><ul class="sa11-ver">' + vers + '</ul></div>' +
      '<div class="sa11-side-f">' + (open('ADM-004') ? A.btn('ghost', L('Matriks Izin', 'Permission Matrix'), 'columns', { go: 'ADM-004', qs: 'r=' + k }) : '') + A.pbtn('sys11.roles.manage', 'blue', L('Edit Role', 'Edit Role'), 'edit', { act: 'redit', val: k }) + '</div></aside>';
  }
  V['ADM-003'] = {
    render: function (c) {
      var ctx = cx(), Q = c.q, all = S.roles(ctx); if (!all.length) return errState();
      if (isM()) return mobile(t(L('Role & izin dikelola di PC.', 'Roles & permissions are managed on a PC.')), [{ k: L('Role', 'Roles'), v: all.length, icon: 'idcard' }, { k: L('Privileged', 'Privileged'), v: all.filter(function (r) { return r.privileged; }).length, icon: 'shield', tone: 'warn' }], S.permIssues(ctx).map(function (i) { return A.rowLink({ href: href('ADM-002', i.uid), icon: 'alert', tone: 'warn', t: esc(i.name), s: t(i.n) }); }));
      var groups = []; all.forEach(function (r) { if (r.group && groups.indexOf(r.group) < 0) groups.push(r.group); });
      var qq = String(Q.q || '').toLowerCase(), rows = all.filter(function (r) { return (!Q.g || r.group === Q.g) && (!Q.f || (Q.f === 'priv' ? r.privileged : Q.f === 'custom' ? r.custom : r.admin)) && (!qq || (T(r.n) + ' ' + r.k + ' ' + T(r.desc || '')).toLowerCase().indexOf(qq) >= 0); });
      var sel0 = Q.r && all.some(function (r) { return r.k === Q.r; }) ? Q.r : rows[0] && rows[0].k;
      var head = P.head(t(L('Role menentukan workspace, izin menentukan aksi. Role tidak otomatis memberi akses tak terbatas (§30, §32).', 'The role decides the workspace, permissions decide the actions. A role never grants unlimited access by itself (§30, §32).')), A.pbtn('sys11.roles.manage', 'primary', L('Clone Role Baru', 'Clone New Role'), 'copy', { act: 'clone' }), freshLive(L('JFACCESS + konfigurasi peran', 'JFACCESS + role configuration')));
      var sum = sumCards([{ v: all.length, k: L('Role', 'Roles'), icon: 'idcard', tone: 'info' }, { v: all.filter(function (r) { return r.privileged; }).length, k: L('Privileged', 'Privileged'), s: L('maker-checker', 'maker-checker'), icon: 'shield', tone: 'warn', go: 'ADM-003', q: { f: 'priv' } },
        { v: all.filter(function (r) { return r.custom; }).length, k: L('Role turunan', 'Custom roles'), icon: 'copy', tone: 'info', go: 'ADM-003', q: { f: 'custom' } }, { v: all.reduce(function (s, r) { return s + r.users; }, 0), k: L('Penugasan role', 'Role assignments'), icon: 'users', tone: 'ok' }]);
      var fb = A.filters([{ k: 'g', l: L('Grup', 'Group'), opts: groups.map(function (g) { return [g, L(g)]; }) }, { k: 'f', l: L('Penanda', 'Flag'), opts: [['priv', L('Privileged', 'Privileged')], ['admin', L('Admin sistem', 'System admin')], ['custom', L('Turunan', 'Custom')]] }], { search: L('Cari role…', 'Search roles…') });
      var tbl = P.table(rows, [
        { h: L('Role', 'Role'), v: function (r) { return '<span class="sa11-who' + (r.k === sel0 ? ' sa11-on' : '') + '"><span class="sa11-who-t"><b>' + t(r.n) + '</b><small>' + esc(r.k) + (r.desc ? ' · ' + t(r.desc) : '') + '</small></span></span>'; } },
        { h: L('Workspace', 'Workspace'), v: function (r) { return t(r.workspace.n) + '<small class="sub5">' + esc(r.device || '—') + '</small>'; } },
        { h: L('User', 'Users'), cls: 'r num', v: function (r) { return r.active + '/' + r.users; } },
        { h: L('Izin', 'Perms'), cls: 'r num', v: function (r) { return r.perms + '<small class="sub5">' + r.modules + ' ' + t(L('modul', 'modules')) + '</small>'; } },
        { h: L('Penanda', 'Flags'), v: function (r) { return (r.privileged ? A.chip('appr', L('Privileged', 'Privileged'), 'shield') : '') + (r.admin ? A.chip('info', L('Admin', 'Admin'), 'cog') : '') + (r.custom ? A.chip('mute', L('Turunan', 'Custom'), 'copy') : '') || '—'; } },
        { h: L('Versi', 'Version'), cls: 'r num', v: function (r) { return 'v' + r.v; } }
      ], function (r) { return { t: t(r.n), r: r.perms, s: t(r.workspace.n) }; }, function (r) { return href('ADM-003', null, qx({ r: r.k })); });
      return head + sum + admTabs('ADM-003') + fb + '<div class="sa11-split"><div class="sa11-main">' + tbl + '</div>' + (sel0 ? rolePanel(sel0) : '') + '</div>';
    },
    act: acts({
      clone: function () {
        rdlg({ title: L('Clone Role Baru', 'Clone New Role'), icon: 'copy', sub: t(L('Role baru menyalin izin role sumber (berversi). Status privileged ikut role sumber.', 'The new role copies the source role permissions (versioned). Privileged status follows the source.')),
          body: fg(fld(L('Role sumber', 'Source role'), sel('from', roleOpts(), 'supervisor')) + fld(L('Nama role baru', 'New role name'), inp('n', '', { ph: L('mis. Supervisor Malam', 'e.g. Night Supervisor') })) + fld(L('Deskripsi', 'Description'), inp('desc', ''), { wide: true })),
          fn: function (reason, v) { return S.cloneRole(cx(), v.from, { n: v.n, desc: v.desc }, reason); }, done: L('Role baru dibuat (v1).', 'New role created (v1).'), go: function (r) { return ['ADM-003', null, { r: r.role.k }]; } });
      },
      redit: function (el) {
        var r = S.role(cx(), el.getAttribute('data-val')); if (!r) return;
        rdlg({ title: L('Edit Role', 'Edit Role'), icon: 'edit', sub: t(r.n) + ' · v' + r.v + (r.custom ? '' : ' · ' + t(L('Nama role bawaan tetap; ubah deskripsi saja.', 'Built-in role names stay; edit the description only.'))),
          body: (r.custom ? fld(L('Nama', 'Name'), inp('n', T(r.n))) : '') + fld(L('Deskripsi', 'Description'), inp('desc', r.desc ? T(r.desc) : ''), { wide: true }),
          fn: function (reason, v) { var f = { desc: v.desc }; if (r.custom && v.n && v.n !== T(r.n)) f.n = v.n; return S.editRole(cx(), r.k, f, reason); }, done: L('Role diperbarui (versi baru).', 'Role updated (new version).') });
      }
    })
  };

  /* ================= ADM-004 Permission Matrix (§33) ================= */
  var SC_SHORT = { own: L('Own', 'Own'), team: L('Tim', 'Team'), branch: L('Branch', 'Branch'), selbranch: L('Sel. Br', 'Sel. Br'), all: L('All', 'All') };
  function cellDots(cell, actions) {
    return '<span class="sa11-dots">' + actions.map(function (a) { var x = cell[a[0]], k = !x.of ? 'x' : x.has === x.of ? 'f' : x.has ? 'p' : 'n'; return '<i class="sa11-d-' + k + '" title="' + esc(T(a[1]) + ': ' + x.has + '/' + x.of) + '"></i>'; }).join('') + '</span>';
  }
  V['ADM-004'] = {
    render: function (c) {
      var ctx = cx(), Q = c.q, mx = S.matrix(ctx); if (!mx) return errState();
      if (isM()) return mobile(t(L('Matriks izin hanya di PC / iPad.', 'The permission matrix is on PC / iPad only.')), [], S.permIssues(ctx).map(function (i) { return A.rowLink({ href: href('ADM-002', i.uid), icon: 'alert', tone: 'warn', t: esc(i.name), s: t(i.n) }); }));
      var roles = mx.roles.filter(function (r) { return !Q.f || (Q.f === 'priv' ? r.privileged : Q.f === 'admin' ? r.admin : true); });
      var rk = Q.r && mx.cells[Q.r] ? Q.r : null, mk = Q.mod && mx.modules.some(function (m) { return m.k === Q.mod; }) ? Q.mod : null;
      var head = P.head(t(L('Modul × aksi (Lihat, Buat, Ubah, Setujui, Export, Admin) × role, dengan cakupan Own – All Company. Setiap perubahan berversi dan wajib alasan.', 'Module × action (View, Create, Edit, Approve, Export, Admin) × role, with scope Own – All Company. Every change is versioned and needs a reason.')), '', freshLive(L('izin role JFACCESS', 'JFACCESS role permissions')));
      var fb = A.filters([{ k: 'r', l: L('Role', 'Role'), opts: mx.roles.map(function (r) { return [r.k, r.n]; }) }, { k: 'mod', l: L('Modul', 'Module'), opts: mx.modules.map(function (m) { return [m.k, m.n]; }) }, { k: 'f', l: L('Penanda', 'Flag'), opts: [['priv', L('Privileged', 'Privileged')], ['admin', L('Admin sistem', 'System admin')]] }]);
      var legend = '<div class="sa11-lgd"><span>' + t(L('Urutan titik:', 'Dot order:')) + ' ' + mx.actions.map(function (a) { return t(a[1]); }).join(' · ') + '</span><span><i class="sa11-d-f"></i>' + t(L('Penuh', 'Full')) + '</span><span><i class="sa11-d-p"></i>' + t(L('Sebagian', 'Partial')) + '</span><span><i class="sa11-d-n"></i>' + t(L('Tidak ada', 'None')) + '</span><span><i class="sa11-d-x"></i>' + t(L('Tidak berlaku', 'N/A')) + '</span></div>';
      var grid = '<div class="tblw sa11-mxw"><table class="tbl dense sa11-mx"><thead><tr><th class="sa11-mx-r">' + t(L('Role', 'Role')) + '</th>' + mx.modules.map(function (m) { return '<th' + (m.k === mk ? ' class="on"' : '') + '><a href="' + href('ADM-004', null, qx({ mod: m.k })) + '">' + t(m.n) + '</a></th>'; }).join('') + '</tr></thead><tbody>' +
        roles.map(function (r) {
          return '<tr' + (r.k === rk ? ' class="on"' : '') + '><th class="sa11-mx-r"><a href="' + href('ADM-004', null, qx({ r: r.k })) + '">' + t(r.n) + '</a>' + (r.privileged ? ' ' + ic('shield', 'sa11-pvi') : '') + '</th>' + mx.modules.map(function (m) {
            var cell = mx.cells[r.k][m.k], any = mx.actions.some(function (a) { return cell[a[0]].has; });
            return '<td class="' + (r.k === rk && m.k === mk ? 'sel' : '') + (any ? '' : ' none') + '"><a href="' + href('ADM-004', null, qx({ r: r.k, mod: m.k })) + '" aria-label="' + esc(T(r.n) + ' · ' + T(m.n)) + '">' + cellDots(cell, mx.actions) + '<small>' + (any ? t(SC_SHORT[cell.scope] || L(cell.scope)) : '—') + '</small></a></td>';
          }).join('') + '</tr>';
        }).join('') + '</tbody></table></div>';
      var det = '';
      if (rk && mk) {
        var cell = mx.cells[rk][mk], role = mx.roles.filter(function (r) { return r.k === rk; })[0], md = mx.modules.filter(function (m) { return m.k === mk; })[0], pm = can('sys11.perm.manage');
        var blocks = mx.actions.filter(function (a) { return md.byAction[a[0]].length; }).map(function (a) {
          return '<div class="sa11-pa"><h3>' + t(a[1]) + ' <small>' + cell[a[0]].has + '/' + cell[a[0]].of + '</small></h3><ul>' + md.byAction[a[0]].map(function (p) {
            var has = cell[a[0]].perms.indexOf(p) >= 0, biz = S.isBusinessApproval(p), lock = biz && role.admin;
            return '<li class="' + (has ? 'on' : '') + '">' + ic(has ? 'checkc' : 'minus') + '<span><b>' + t(permN(p)) + '</b><small>' + esc(p) + (biz ? ' · ' + t(L('persetujuan bisnis', 'business approval')) : '') + '</small></span>' +
              (lock ? A.chip('crit', L('§63: tidak untuk admin', '§63: not for admins'), 'lock') : pm ? A.btn(has ? 'ghost' : 'blue', has ? L('Cabut', 'Revoke') : L('Beri', 'Grant'), has ? 'minus' : 'plus', { act: 'perm', val: rk + '|' + p + '|' + (has ? 0 : 1), cls: 'btn-sm' }) : '') + '</li>';
          }).join('') + '</ul></div>';
        }).join('');
        det = card(Lx(role.n, ' × ' + T(md.n)), '<div class="sa11-scope"><span>' + t(L('Cakupan data', 'Data scope')) + '</span>' + (pm ? '<select id="sa11-sc">' + S.SCOPES.map(function (s) { return '<option value="' + s[0] + '"' + (s[0] === cell.scope ? ' selected' : '') + '>' + t(s[1]) + '</option>'; }).join('') + '</select>' + A.btn('ghost', L('Simpan cakupan', 'Save scope'), 'check', { act: 'scope', val: rk + '|' + mk, cls: 'btn-sm' }) : '<b>' + t(scopeN(cell.scope)) + '</b>') + '</div>' +
          (role.admin ? note(t(L('Role admin tidak pernah menerima hak persetujuan bisnis (pembayaran, harga, HPP, tutup periode) — §63.', 'Admin roles never receive business approval rights (payment, price, HPP, period close) — §63.')), 'lock', 'info') : '') +
          (blocks || A.empty(L('Modul ini tidak punya izin.', 'This module has no permissions.'))), { icon: 'key', right: A.btn('ghost', L('Tutup', 'Close'), 'x', { go: 'ADM-004', qs: '' , cls: 'btn-sm' }) });
      } else det = note(t(L('Pilih sel (role × modul) untuk melihat izin per aksi dan mengubahnya.', 'Pick a cell (role × module) to see and change permissions per action.')), 'pointer', 'info');
      return head + admTabs('ADM-004') + fb + (rk && mk ? det + legend + grid : legend + grid + det);
    },
    act: acts({
      perm: function (el) {
        var p = el.getAttribute('data-val').split('|'), on = p[2] === '1';
        rdlg({ title: on ? L('Beri izin', 'Grant permission') : L('Cabut izin', 'Revoke permission'), icon: on ? 'plus' : 'minus', ok: on ? L('Beri', 'Grant') : L('Cabut', 'Revoke'),
          sub: '<b>' + t(S.roleName(p[0])) + '</b> · ' + t(permN(p[1])) + ' <small>(' + esc(p[1]) + ')</small><br>' + t(L('Berlaku untuk semua pemegang role; sesi mereka diperiksa ulang. Versi role naik.', 'Applies to every holder of the role; their sessions re-check. The role version goes up.')),
          fn: function (reason) { return S.setPerm(cx(), p[0], p[1], on, reason); }, done: on ? L('Izin diberikan (versi baru).', 'Permission granted (new version).') : L('Izin dicabut (versi baru).', 'Permission revoked (new version).') });
      },
      scope: function (el) {
        var p = el.getAttribute('data-val').split('|'), s = document.getElementById('sa11-sc'), v = s ? s.value : null;
        rdlg({ title: L('Ubah cakupan', 'Change scope'), icon: 'layers', sub: '<b>' + t(S.roleName(p[0])) + '</b> · ' + t(modN(p[1])) + ': ' + t(scopeN(S.scopeOf(p[0], p[1]))) + ' → <b>' + t(scopeN(v)) + '</b>',
          fn: function (reason) { return S.setScope(cx(), p[0], p[1], v, reason); }, done: L('Cakupan diperbarui.', 'Scope updated.') });
      }
    })
  };

  /* ================= ADM-005 Access Review (§34) ================= */
  var DEC = { keep: ['ok', L('Tetap', 'Keep'), 'checkc'], revoke: ['crit', L('Cabut', 'Revoke'), 'ban'], adjust: ['warn', L('Sesuaikan', 'Adjust'), 'edit'] };
  V['ADM-005'] = {
    render: function (c) {
      var ctx = cx(), Q = c.q, rv = S.accessReview(ctx); if (!rv) return errState();
      var camps = S.campaigns(ctx), cp = Q.c ? S.campaign(ctx, Q.c) : camps.filter(function (x) { return x.st === 'open'; })[0] || camps[0];
      if (isM()) return mobile(t(L('Review akses dilakukan di PC / iPad.', 'Access reviews are done on PC / iPad.')), [{ k: L('Perlu review', 'Needs review'), v: rv.counts.review, icon: 'usercheck', tone: rv.counts.review ? 'warn' : 'ok' }, { k: L('Akses berakhir', 'Access ended'), v: rv.counts.expired, icon: 'clock', tone: rv.counts.expired ? 'crit' : 'ok' }],
        rv.review.map(function (x) { return A.rowLink({ href: href('ADM-002', x.user.id), icon: 'usercheck', tone: 'warn', t: esc(x.user.name), s: x.why.map(function (w) { return t(w); }).join(' · ') }); }));
      var v = Q.v || 'review';
      var head = P.head(t(L('Review periodik: privileged, akses berakhir, akses sementara, user tidak aktif, dan user yang perlu direview.', 'Periodic review: privileged, expired access, temporary access, inactive users and users needing review.')), A.pbtn('sys11.access.review', 'primary', L('Mulai Kampanye Review', 'Start Review Campaign'), 'play', { act: 'start' }), freshLive(L('akun, login terakhir & keputusan review', 'accounts, last sign-in & review decisions')));
      var sum = sumCards([
        { v: rv.counts.privileged, k: L('Privileged', 'Privileged'), icon: 'shield', tone: 'info', go: 'ADM-005', q: { v: 'privileged' } },
        { v: rv.counts.expired, k: L('Akses berakhir', 'Expired access'), icon: 'clock', tone: rv.counts.expired ? 'crit' : 'ok', go: 'ADM-005', q: { v: 'expired' } },
        { v: rv.counts.temporary, k: L('Akses sementara', 'Temporary access'), icon: 'hourglass', tone: 'info', go: 'ADM-005', q: { v: 'temporary' } },
        { v: rv.counts.inactive, k: L('Tidak aktif', 'Inactive users'), s: L('> ' + S.cfgGet('th.inactiveDays') + ' hari tanpa login', '> ' + S.cfgGet('th.inactiveDays') + ' days without sign-in'), icon: 'pause', tone: 'warn', go: 'ADM-005', q: { v: 'inactive' } },
        { v: rv.counts.review, k: L('Perlu review', 'Needs review'), icon: 'usercheck', tone: rv.counts.review ? 'warn' : 'ok', go: 'ADM-005', q: { v: 'review' } }
      ]);
      var tabs = H.tabs([['review', L('Perlu review', 'Needs review'), 'usercheck', rv.counts.review], ['privileged', L('Privileged', 'Privileged'), 'shield', rv.counts.privileged], ['expired', L('Akses berakhir', 'Expired'), 'clock', rv.counts.expired], ['temporary', L('Sementara', 'Temporary'), 'hourglass', rv.counts.temporary], ['inactive', L('Tidak aktif', 'Inactive'), 'pause', rv.counts.inactive]], v, 'v', { def: 'review' });
      var list = v === 'review' ? rv.review : (rv[v] || []).map(function (u) { return { user: u, why: [] }; });
      var tbl = P.table(list, [
        { h: L('User', 'User'), v: function (x) { return who(x.user, true); } },
        { h: L('Role', 'Role'), v: function (x) { return x.user.roleNames.map(function (n) { return t(n); }).join(', ') || '—'; } },
        { h: L('Status', 'Status'), v: function (x) { return uChip(x.user); } },
        { h: L('Login terakhir', 'Last login'), v: function (x) { return dt(x.user.lastLogin); } },
        { h: L('Masa akses', 'Access window'), v: function (x) { return x.user.end ? dt(x.user.end) + (x.user.expired ? ' ' + A.chip('crit', L('Berakhir', 'Ended')) : '') : t(L('Permanen', 'Permanent')); } },
        { h: L('Alasan review', 'Why review'), v: function (x) { return x.why.length ? x.why.map(function (w) { return A.chip('warn', w); }).join(' ') : '—'; } }
      ], function (x) { return { t: esc(x.user.name), s: x.why.map(function (w) { return t(w); }).join(' · ') }; }, function (x) { return href('ADM-002', x.user.id); }, { empty: L('Tidak ada user di daftar ini.', 'No users in this list.') });
      var campC = '';
      if (cp) {
        var mayDec = can('sys11.access.review') && cp.st === 'open';
        campC = card(Lx(cp.n, ' · ' + cp.id), '<div class="sa11-camp"><div>' + kv([[L('Cakupan', 'Scope'), esc(cp.scope)], [L('Jatuh tempo', 'Due'), dt(cp.due) + (cp.overdue ? ' ' + A.chip('crit', L('Terlambat', 'Overdue')) : '')], [L('Status', 'Status'), cp.st === 'open' ? A.chip('info', L('Berjalan', 'Open'), 'play') : A.chip('ok', L('Selesai', 'Done'), 'checkc')], [L('Progres', 'Progress'), cp.progress.done + '/' + cp.progress.total]]) + '</div><div class="sa11-prog">' + P.prog(cp.progress.done, cp.progress.total || 1, cp.progress.done === cp.progress.total ? 'healthy' : 'watch') + '<b class="num">' + pct(cp.progress.pct, 0) + '</b></div></div>' +
          P.table(cp.items, [
            { h: L('User', 'User'), v: function (i) { return lnk('ADM-002', i.uid, '<b>' + esc(i.name) + '</b>') + '<small class="sub5">' + esc(i.roles.join(', ')) + '</small>'; } },
            { h: L('Keputusan', 'Decision'), v: function (i) { var d = DEC[i.dec]; return d ? A.chip(d[0], d[1], d[2]) + '<small class="sub5">' + t(i.note) + ' · ' + esc(i.at || '') + '</small>' : A.chip('mute', L('Belum diputuskan', 'Not decided')); } },
            { h: '', cls: 'r', v: function (i) { return mayDec && !i.dec && i.uid !== cx().uid ? '<span class="sa11-btns">' + A.btn('ghost', DEC.keep[1], 'checkc', { act: 'dec', val: cp.id + '|' + i.uid + '|keep', cls: 'btn-sm' }) + A.btn('ghost', DEC.adjust[1], 'edit', { act: 'dec', val: cp.id + '|' + i.uid + '|adjust', cls: 'btn-sm' }) + A.btn('danger', DEC.revoke[1], 'ban', { act: 'dec', val: cp.id + '|' + i.uid + '|revoke', cls: 'btn-sm' }) + '</span>' : ''; } }
          ]) + (mayDec ? '<div class="sa11-bar">' + A.btn('primary', L('Selesaikan Kampanye', 'Complete Campaign'), 'checkc', { act: 'done', val: cp.id }) + '</div>' : ''),
          { icon: 'usercheck', right: camps.length > 1 ? '<span class="sa11-chips">' + camps.map(function (x) { return '<a class="chip ' + (x.id === cp.id ? 'info' : 'mute') + '" href="' + href('ADM-005', null, qx({ c: x.id })) + '">' + esc(x.id) + '</a>'; }).join('') + '</span>' : '' });
      } else campC = card(L('Kampanye review', 'Review campaigns'), A.empty(L('Belum ada kampanye review.', 'No review campaigns yet.')), { icon: 'usercheck' });
      return head + sum + admTabs('ADM-005') + campC + card(L('Daftar review', 'Review lists'), tabs + tbl, { icon: 'list' });
    },
    act: acts({
      start: function () {
        rdlg({ title: L('Mulai Kampanye Review', 'Start Review Campaign'), icon: 'play', ok: L('Mulai', 'Start'),
          body: fg(fld(L('Nama kampanye', 'Campaign name'), inp('n', T(L('Review Akses ', 'Access Review ')) + S.today().slice(0, 7))) + fld(L('Cakupan', 'Scope'), sel('scope', [['privileged', L('User privileged', 'Privileged users')], ['temporary', L('Akses sementara', 'Temporary access')], ['inactive', L('User tidak aktif', 'Inactive users')], ['all', L('Semua user', 'All users')]], 'privileged')) +
            fld(L('Jatuh tempo', 'Due'), inp('due', '', { type: 'date' }), { hint: t(L('Kosong = 14 hari.', 'Empty = 14 days.')) })),
          fn: function (reason, v) { return S.startCampaign(cx(), { n: v.n, scope: v.scope, due: v.due || null }, reason); }, done: L('Kampanye review dimulai.', 'Review campaign started.'), go: function (r) { return ['ADM-005', null, { c: r.campaign.id }]; } });
      },
      dec: function (el) {
        var p = el.getAttribute('data-val').split('|'), d = p[2], u = S.user(cx(), p[1]);
        rdlg({ title: Lx(DEC[d][1], ' · ' + (u ? u.name : p[1])), icon: DEC[d][2], ok: DEC[d][1], noReason: true,
          sub: t(d === 'revoke' ? L('Akun dinonaktifkan dan semua sesi berakhir.', 'The account is deactivated and every session ends.') : d === 'adjust' ? L('Pilih role yang tetap dimiliki. Menambah role privileged menjadi permintaan.', 'Pick the roles to keep. Adding a privileged role becomes a request.') : L('Akses tetap seperti sekarang.', 'Access stays as it is.')),
          body: (d === 'adjust' && u ? grp(L('Role', 'Roles'), cks('roles', roleOpts(), u.roles), { req: true }) : '') + fld(L('Catatan', 'Note'), area('note', '', L('wajib untuk cabut / sesuaikan', 'required for revoke / adjust')), { req: d !== 'keep', wide: true }),
          fn: function (r0, v) { return S.decide(cx(), p[0], p[1], d, { note: v.note, roles: d === 'adjust' ? v.roles : undefined }); }, done: L('Keputusan review tersimpan.', 'Review decision saved.') });
      },
      done: function (el) {
        rdlg({ title: L('Selesaikan Kampanye', 'Complete Campaign'), icon: 'checkc', optional: true, ok: L('Selesaikan', 'Complete'), sub: t(L('Semua user harus sudah diputuskan.', 'Every user must be decided first.')),
          fn: function (reason) { return S.completeCampaign(cx(), el.getAttribute('data-val'), reason); }, done: L('Kampanye review selesai.', 'Review campaign completed.') });
      }
    })
  };

  /* ================= CFG-001 Master Data (§35–§37, §64) ================= */
  function mdRec(cat, id) { return cat + '~' + id; }
  function parseRec(rec, q) { var s = String(rec || ''), i = s.indexOf('~'); if (i > 0) return { cat: s.slice(0, i), id: s.slice(i + 1) }; return { cat: q.cat || null, id: s }; }
  function dataKeys(rows) { var ks = []; rows.forEach(function (r) { Object.keys(r.data || {}).forEach(function (k) { if (k !== 'n' && k !== 'map' && ks.indexOf(k) < 0) ks.push(k); }); }); return ks; }
  function dataTxt(d, ks) { return ks.filter(function (k) { return d && d[k] != null && d[k] !== ''; }).slice(0, 4).map(function (k) { return '<span class="sa11-dk"><small>' + esc(k) + '</small> ' + sv(d[k], k) + '</span>'; }).join(' ') || '—'; }
  function mdStChip(st) { return st === 'active' ? A.chip('ok', L('Aktif', 'Active'), 'checkc') : st === 'inactive' ? A.chip('mute', L('Nonaktif', 'Inactive'), 'ban') : A.chip('warn', L(st)); }
  function dataFields(data, ks) { return ks.map(function (k) { var v = data ? data[k] : null; return typeof v === 'boolean' ? fld(L(k), sel('d_' + k, [['true', L('Ya', 'Yes')], ['false', L('Tidak', 'No')]], String(v))) : fld(L(k), inp('d_' + k, Array.isArray(v) ? v[0] : v == null ? '' : v, { num: typeof v === 'number' })); }).join(''); }
  function readData(v, data, ks) { var o = {}; ks.forEach(function (k) { if (('d_' + k) in v) o[k] = cast(data ? data[k] : '', v['d_' + k]); }); return o; }
  V['CFG-001'] = {
    render: function (c) {
      var ctx = cx(), Q = c.q, cats = S.masterCats(ctx); if (!cats.length) return errState();
      if (isM()) return mobile(t(L('Master data hanya dikelola di PC.', 'Master data is managed on a PC only.')), [{ k: L('Kategori', 'Categories'), v: cats.length, icon: 'database' }, { k: L('Menunggu persetujuan', 'Pending approval'), v: cats.reduce(function (s, k) { return s + S.masterList(ctx, k.k).filter(function (r) { return r.pending; }).length; }, 0), icon: 'hourglass', tone: 'warn' }], []);
      var ck = Q.cat && cats.some(function (k) { return k.k === Q.cat; }) ? Q.cat : 'branch', cat = cats.filter(function (k) { return k.k === ck; })[0];
      var rows = S.masterList(ctx, ck, { q: Q.q, st: Q.st }), ks = dataKeys(rows), mng = can('sys11.master.manage') && !cat.readOnly;
      var head = P.head(t(L('20 kategori master. Kategori milik modul lain tampil read-through dengan pemiliknya (§64). Tidak ada hapus permanen untuk data yang sudah dipakai (§36).', '20 master categories. Categories owned by other modules are shown read-through with their owner (§64). No hard delete for used data (§36).')), mng ? A.btn('primary', Lx(L('Tambah ', 'Add '), T(cat.n)), 'plus', { act: 'madd', val: ck }) : '', freshLive(L('master Fase 11 + modul pemilik', 'Phase 11 master + owning modules')));
      var nav = '<nav class="card sa11-cats" aria-label="' + t(L('Kategori master', 'Master categories')) + '">' + cats.map(function (k) {
        return '<a class="sa11-cat' + (k.k === ck ? ' on' : '') + '" href="' + href('CFG-001', null, { cat: k.k }) + '"' + (k.k === ck ? ' aria-current="page"' : '') + '><span>' + t(k.n) + (k.readOnly ? ' ' + ic('link', 'sa11-ro') : '') + '</span><b class="num">' + k.active + '/' + k.count + '</b></a>';
      }).join('') + '</nav>';
      var own = cat.readOnly ? note(t(L('Dikelola oleh ', 'Owned by ')) + t(cat.owner) + '. ' + t(L('Ubah di modul tersebut — di sini hanya dibaca.', 'Change it there — read-only here.')) + (cat.s && open(cat.s) ? ' ' + lnk(cat.s, null, t(L('Buka modul pemilik', 'Open the owning module'))) : ''), 'link', 'info') : note(t(L('Pemilik: ', 'Owner: ')) + t(cat.owner) + (String(S.cfgGet('wf.masterApproval') || '').split(',').indexOf(ck) >= 0 ? ' · ' + t(L('perubahan butuh persetujuan (maker-checker)', 'changes need approval (maker-checker)')) : ''), 'shield', 'info');
      var fb = A.filters([{ k: 'st', l: L('Status', 'Status'), opts: [['active', L('Aktif', 'Active')], ['inactive', L('Nonaktif', 'Inactive')]] }], { search: L('Cari kode atau nama…', 'Search code or name…') });
      var tbl = P.table(rows, [
        { h: L('Kode', 'Code'), v: function (r) { return '<b class="mono6">' + esc(r.code) + '</b>'; } },
        { h: L('Nama', 'Name'), v: function (r) { return t(r.n); } },
        { h: L('Data', 'Data'), v: function (r) { return dataTxt(r.data, ks); } },
        { h: L('Status', 'Status'), v: function (r) { return mdStChip(r.st) + (r.pending ? ' ' + A.chip('appr', L('Menunggu persetujuan', 'Pending approval'), 'hourglass') : '') + (r.scheduled ? ' ' + A.chip('info', L('Terjadwal', 'Scheduled'), 'calendar') : ''); } },
        { h: L('Versi', 'Version'), v: function (r) { return r.v ? 'v' + r.v + '<small class="sub5">' + t(L('efektif ', 'effective ')) + dt(r.eff) + '</small>' : '<small class="sub5">' + t(L('di modul pemilik', 'in owning module')) + '</small>'; } },
        { h: L('Dipakai', 'Used by'), cls: 'r num', v: function (r) { return n0(r.inUse); } }
      ], function (r) { return { t: esc(r.code) + ' · ' + t(r.n), r: r.inUse, chip: mdStChip(r.st) }; }, function (r) { return r.readOnly ? (r.link && open(r.link.s) ? href(r.link.s, r.link.rec) : null) : href('CFG-002', mdRec(ck, r.id)); }, { empty: L('Belum ada data di kategori ini.', 'No records in this category yet.') });
      return head + cfgTabs('CFG-001') + '<div class="sa11-md">' + nav + '<div class="sa11-main">' + card(cat.n, own + fb + tbl, { icon: 'database', count: rows.length }) + '</div></div>';
    },
    act: {
      madd: function (el) {
        var ck = el.getAttribute('data-val'), cat = S.masterCats(cx()).filter(function (k) { return k.k === ck; })[0], rows = S.masterList(cx(), ck), ks = dataKeys(rows), smp = rows[0] ? rows[0].data : {};
        rdlg({ title: Lx(L('Tambah ', 'Add '), T(cat.n)), icon: 'plus', sub: t(L('Versi 1 berlaku mulai tanggal efektif. Kode tidak bisa diubah.', 'Version 1 applies from the effective date. The code cannot be changed.')),
          body: fg(fld(L('Kode', 'Code'), inp('code', ''), { req: true }) + fld(L('Tanggal efektif', 'Effective date'), inp('eff', S.today(), { type: 'date' }), { req: true }) + fld(L('Nama (ID)', 'Name (ID)'), inp('nid', ''), { req: true }) + fld(L('Nama (EN)', 'Name (EN)'), inp('nen', '')) + dataFields(smp, ks)),
          fn: function (reason, v) { var d = readData(v, smp, ks); return S.masterAdd(cx(), ck, { code: v.code, n: [v.nid, v.nen || v.nid], data: d }, { eff: v.eff, reason: reason }); }, done: L('Master data ditambahkan (v1).', 'Master record added (v1).'), go: function (r) { return ['CFG-002', mdRec(ck, r.rec.id)]; } });
      }
    }
  };

  /* ================= CFG-002 Master Detail (§36, §37) ================= */
  var VST = { active: ['ok', L('Berlaku', 'Active')], pending: ['appr', L('Menunggu persetujuan', 'Pending approval')], rejected: ['crit', L('Ditolak', 'Rejected')] };
  V['CFG-002'] = {
    title: function (rec) { var p = parseRec(rec, A.S.q), r = p.cat && S.masterRecord(cx(), p.cat, p.id); return r ? L(r.code + ' · ' + T(r.n), r.code + ' · ' + (r.n[1] || r.n[0])) : L('Detail Master', 'Master Detail'); },
    render: function (c) {
      var ctx = cx(), p = parseRec(c.rec, c.q), r = p.cat && S.masterRecord(ctx, p.cat, p.id);
      if (!r) return A.stateCard('empty', S.MSG.notfound, A.btn('blue', L('Master Data', 'Master Data'), 'arrowl', { go: 'CFG-001' }));
      var cat = S.masterCats(ctx).filter(function (k) { return k.k === p.cat; })[0];
      if (isM()) return mobile(esc(r.code) + ' · ' + t(r.n), [{ k: L('Versi', 'Version'), v: r.v ? 'v' + r.v : '—', icon: 'layers' }, { k: L('Dipakai', 'Used by'), v: r.inUse, icon: 'link' }], r.pending ? [A.rowLink({ href: '#', icon: 'hourglass', tone: 'warn', t: t(L('Versi menunggu persetujuan', 'Version waiting for approval')), s: esc(r.code) })] : []);
      var mng = can('sys11.master.manage') && !r.readOnly, appr = can('sys11.master.approve'), ks = Object.keys(r.data || {}).filter(function (k) { return k !== 'n'; });
      var hero = P8.hero({ icon: 'layers', id: t(cat.n) + ' · ' + r.code, title: t(r.n), sub: t(L('Pemilik: ', 'Owner: ')) + t(r.owner),
        chips: mdStChip(r.st) + (r.pending ? A.chip('appr', L('Menunggu persetujuan', 'Pending approval'), 'hourglass') : '') + (r.readOnly ? A.chip('info', L('Read-through', 'Read-through'), 'link') : ''),
        facts: [[L('Versi berlaku', 'Current version'), r.v ? 'v' + r.v : '—'], [L('Efektif sejak', 'Effective since'), dt(r.eff)], [L('Dipakai', 'Used by'), n0(r.inUse) + ' ' + t(L('data', 'records'))], [L('Hapus', 'Delete'), r.canDelete ? t(L('Boleh (belum dipakai)', 'Allowed (unused)')) : t(L('Tidak — hanya nonaktifkan', 'No — deactivate only'))]] });
      if (r.readOnly) return hero + note(t(L('Data ini dikelola modul lain (§64). Ubah di modul pemiliknya.', 'This record is owned by another module (§64). Change it there.')) + (r.link && open(r.link.s) ? ' ' + lnk(r.link.s, r.link.rec, t(L('Buka', 'Open'))) : ''), 'link', 'info') + card(L('Data', 'Data'), kv(Object.keys(r.data || {}).map(function (k) { return [L(k), sv(r.data[k], k)]; })), { icon: 'list' });
      var bar = mng ? '<div class="sa11-bar">' + A.btn('blue', L('Ubah (versi baru)', 'Edit (new version)'), 'edit', { act: 'medit' }) + (r.st === 'active' ? A.btn('ghost', L('Nonaktifkan', 'Deactivate'), 'ban', { act: 'mact', val: '0' }) : A.btn('ghost', L('Aktifkan', 'Activate'), 'checkc', { act: 'mact', val: '1' })) +
        '<span class="sa11-sp"></span>' + (r.canDelete ? A.btn('danger', L('Hapus', 'Delete'), 'trash', { act: 'mdel' }) : '<span class="sa11-nodel">' + ic('lock') + t(L('Dipakai ' + r.inUse + ' data: tidak bisa dihapus, hanya dinonaktifkan.', 'Used by ' + r.inUse + ' records: cannot be deleted, only deactivated.')) + '</span>') + '</div>' : '';
      var cur = card(L('Data berlaku', 'Current data'), kv([[L('Nama', 'Name'), t(r.n)]].concat(ks.map(function (k) { return [L(k), sv(r.data[k], k)]; }))), { icon: 'list' });
      var at = card(L('Nilai pada tanggal (§37)', 'Value on a date (§37)'), '<p class="sub5">' + t(L('Transaksi lama tetap memakai versi yang berlaku pada tanggalnya.', 'Old transactions keep the version valid on their date.')) + '</p><div class="sa11-at"><input type="date" id="sa11-atd" value="' + esc(S.today()) + '" aria-label="' + t(L('Tanggal', 'Date')) + '">' + A.btn('ghost', L('Lihat', 'Look up'), 'search', { act: 'mat', cls: 'btn-sm' }) + '</div><div id="sa11-ato" class="sa11-ato"></div>', { icon: 'calendar' });
      var vers = card(L('Riwayat versi', 'Version history'), P.table(r.versions, [
        { h: L('Versi', 'Version'), v: function (v) { return '<b>v' + v.v + '</b>'; } },
        { h: L('Efektif', 'Effective'), v: function (v) { return dt(v.eff) + (v.st === 'active' && v.eff > S.today() ? ' ' + A.chip('info', L('Terjadwal', 'Scheduled'), 'calendar') : ''); } },
        { h: L('Status', 'Status'), v: function (v) { var s = VST[v.st] || ['mute', L(v.st)]; return A.chip(s[0], s[1]); } },
        { h: L('Data', 'Data'), v: function (v) { return dataTxt(v.data, ['n'].concat(ks)); } },
        { h: L('Alasan', 'Reason'), v: function (v) { return t(v.reason); } },
        { h: L('Oleh', 'By'), v: function (v) { return empN(v.by) + '<small class="sub5">' + esc(v.at) + '</small>'; } },
        { h: L('Persetujuan', 'Approval'), v: function (v) { return v.st === 'pending' ? (appr ? '<span class="sa11-btns">' + A.btn('primary', L('Setujui', 'Approve'), 'checkc', { act: 'mappr', val: v.v + '|1', cls: 'btn-sm' }) + A.btn('ghost', L('Tolak', 'Reject'), 'xc', { act: 'mappr', val: v.v + '|0', cls: 'btn-sm' }) + '</span>' : A.chip('appr', L('Menunggu checker', 'Waiting for checker'), 'hourglass')) : v.appr ? empN(v.appr) + '<small class="sub5">' + esc(v.apprAt || '') + '</small>' : '—'; } }
      ]), { icon: 'history', count: r.versions.length });
      return hero + bar + '<div class="g2-10">' + cur + at + '</div>' + vers;
    },
    act: {
      medit: function () {
        var p = parseRec(A.S.rec, A.S.q), r = S.masterRecord(cx(), p.cat, p.id), ks = Object.keys(r.data || {}).filter(function (k) { return k !== 'n' && k !== 'map'; });
        rdlg({ title: L('Ubah master (versi baru)', 'Edit master (new version)'), icon: 'edit', sub: esc(r.code) + ' · v' + r.v + ' → v' + (r.versions[0].v + 1) + '<br>' + t(L('Tanggal efektif tidak boleh mundur. Pajak & mata uang menunggu persetujuan.', 'The effective date cannot be in the past. Tax & currency wait for approval.')),
          body: fg(fld(L('Nama (ID)', 'Name (ID)'), inp('nid', r.n[0])) + fld(L('Nama (EN)', 'Name (EN)'), inp('nen', r.n[1] || r.n[0])) + dataFields(r.data, ks) + fld(L('Tanggal efektif', 'Effective date'), inp('eff', S.today(), { type: 'date' }), { req: true })),
          fn: function (reason, v) { var d = readData(v, r.data, ks); d.n = [v.nid, v.nen || v.nid]; return S.masterEdit(cx(), p.cat, p.id, d, { eff: v.eff, reason: reason }); },
          done: function (x) { return x.pending ? L('Versi v' + x.version.v + ' menunggu persetujuan.', 'Version v' + x.version.v + ' waits for approval.') : L('Versi v' + x.version.v + ' tersimpan.', 'Version v' + x.version.v + ' saved.'); } });
      },
      mact: function (el) {
        var p = parseRec(A.S.rec, A.S.q), on = el.getAttribute('data-val') === '1';
        rdlg({ title: on ? L('Aktifkan master', 'Activate master') : L('Nonaktifkan master', 'Deactivate master'), icon: on ? 'checkc' : 'ban', ok: on ? L('Aktifkan', 'Activate') : L('Nonaktifkan', 'Deactivate'), sub: esc(p.id) + ' · ' + t(L('Data nonaktif tidak bisa dipilih di transaksi baru; riwayat tetap.', 'Inactive data cannot be picked for new transactions; history stays.')),
          fn: function (reason) { return S.masterSetActive(cx(), p.cat, p.id, on, reason); }, done: L('Status master diperbarui.', 'Master status updated.') });
      },
      mdel: function () {
        var p = parseRec(A.S.rec, A.S.q);
        rdlg({ title: L('Hapus master', 'Delete master'), icon: 'trash', ok: L('Hapus', 'Delete'), sub: esc(p.id) + ' · ' + t(L('Hanya untuk data yang belum pernah dipakai. Riwayat & audit tetap tersimpan.', 'Only for data never used. History & audit are kept.')),
          fn: function (reason) { return S.masterDelete(cx(), p.cat, p.id, reason); }, done: L('Master data dihapus (soft delete).', 'Master record deleted (soft delete).'), go: function () { return ['CFG-001', null, { cat: p.cat }]; } });
      },
      mappr: function (el) {
        var p = parseRec(A.S.rec, A.S.q), x = el.getAttribute('data-val').split('|'), ok = x[1] === '1';
        rdlg({ title: ok ? L('Setujui versi', 'Approve version') : L('Tolak versi', 'Reject version'), icon: ok ? 'checkc' : 'xc', ok: ok ? L('Setujui', 'Approve') : L('Tolak', 'Reject'), optional: ok, sub: esc(p.id) + ' · v' + esc(x[0]) + ' · ' + t(S.MSG.maker),
          fn: function (reason) { return S.masterApprove(cx(), p.cat, p.id, +x[0], ok, reason); }, done: ok ? L('Versi disetujui dan berlaku sesuai tanggal efektif.', 'Version approved; applies from its effective date.') : L('Versi ditolak.', 'Version rejected.') });
      },
      mat: function () {
        var p = parseRec(A.S.rec, A.S.q), d = (document.getElementById('sa11-atd') || {}).value, o = document.getElementById('sa11-ato'), r = S.masterAt(p.cat, p.id, d);
        if (o) o.innerHTML = r ? '<b>v' + r.v + '</b> · ' + t(L('efektif ', 'effective ')) + dt(r.eff) + '<div>' + Object.keys(r).filter(function (k) { return k !== 'v' && k !== 'eff'; }).map(function (k) { return '<span class="sa11-dk"><small>' + esc(k) + '</small> ' + sv(r[k]) + '</span>'; }).join(' ') + '</div>' : t(L('Belum ada versi yang berlaku pada tanggal itu.', 'No version was valid on that date.'));
      }
    }
  };

  /* ================= CFG-003 System Configuration (§38) ================= */
  function cfgVal(i) { var v = i.v; if (i.type === 'bool') return t(boolN(v)); if (i.type === 'roles') return chips(String(v).split(',').map(function (k) { return S.roleName(k.trim()); }), 'info'); if (i.type === 'cats') return v ? chips(String(v).split(',').map(function (k) { var c2 = S.MASTER_CATS.filter(function (x) { return x.k === k.trim(); })[0]; return c2 ? c2.n : L(k); }), 'info') : '—'; return '<b class="mono6">' + esc(typeof v === 'number' ? n0(v) : String(v)) + '</b>'; }
  function cfgInput(i) {
    var ty = i.type || '', v = i.v;
    if (ty === 'bool') return fld(L('Nilai', 'Value'), sel('val', [['true', L('Ya', 'Yes')], ['false', L('Tidak', 'No')]], String(v)));
    if (/^enum:/.test(ty)) return fld(L('Nilai', 'Value'), sel('val', ty.slice(5).split(',').map(function (x) { return [x, L(x)]; }), v));
    if (/^int:/.test(ty)) { var rg = ty.slice(4).split(','); return fld(L('Nilai', 'Value'), inp('val', v, { num: true, type: 'number' }), { hint: esc(rg[0] + '–' + rg[1]) }); }
    if (ty === 'currency') return fld(L('Nilai', 'Value'), sel('val', mOpts('currency'), v));
    if (ty === 'roles') return grp(L('Role privileged', 'Privileged roles'), cks('vals', roleOpts(), String(v).split(',').map(function (x) { return x.trim(); })), { hint: t(L('Super Admin dan System Admin wajib tetap privileged.', 'Super Admin and System Admin must stay privileged.')) });
    if (ty === 'cats') return grp(L('Kategori', 'Categories'), cks('vals', S.MASTER_CATS.filter(function (c2) { return c2.own === 'sys'; }).map(function (c2) { return [c2.k, c2.n]; }), String(v || '').split(',').map(function (x) { return x.trim(); })));
    return fld(L('Nilai', 'Value'), inp('val', v), { hint: t(L('Pola wajib memuat n (nomor urut), mis. INV-YYMM-nnn.', 'The pattern must contain n (sequence), e.g. INV-YYMM-nnn.')) });
  }
  function cfgRead(i, v) { var ty = i.type || ''; if (ty === 'bool') return v.val === 'true'; if (/^int:/.test(ty)) return v.val === '' ? null : Number(v.val); if (ty === 'roles' || ty === 'cats') return (v.vals || []).join(','); return v.val; }
  V['CFG-003'] = {
    render: function (c) {
      var ctx = cx(), cf = S.config(ctx); if (!cf) return errState();
      if (isM()) return mobile(t(L('Konfigurasi sistem hanya di PC.', 'System configuration is on a PC only.')), [{ k: L('Pengaturan', 'Settings'), v: cf.items.length, icon: 'cog' }], []);
      var mng = can('sys11.config.manage');
      var head = P.head(t(L('Penomoran, bahasa, format, mata uang, zona waktu, aturan status & workflow, ambang batas dan persetujuan. Setiap perubahan berversi dengan tanggal efektif.', 'Numbering, language, formats, currency, time zone, status & workflow rules, thresholds and approvals. Every change is versioned with an effective date.')), '', freshLive(L('konfigurasi Fase 11 + modul pemilik', 'Phase 11 configuration + owning modules')));
      var groups = cf.groups.map(function (g) {
        return card(g.n, g.items.length ? P.table(g.items, [
          { h: L('Pengaturan', 'Setting'), v: function (i) { return '<b>' + t(i.n) + '</b><small class="sub5 mono6">' + esc(i.k) + '</small>'; } },
          { h: L('Nilai', 'Value'), v: function (i) { return cfgVal(i) + (i.next ? '<small class="sub5">' + t(L('Mulai ', 'From ')) + dt(i.next.eff) + ': ' + esc(String(i.next.v)) + '</small>' : ''); } },
          { h: L('Versi', 'Version'), v: function (i) { return i.src === 'sys' ? 'v' + i.ver + '<small class="sub5">' + dt(i.eff) + '</small>' : '—'; } },
          { h: L('Pemilik', 'Owner'), v: function (i) { return t(i.owner); } },
          { h: '', cls: 'r', v: function (i) { return i.editable ? (mng ? A.btn('ghost', L('Ubah', 'Change'), 'edit', { act: 'cset', val: i.k, cls: 'btn-sm' }) : '') : i.s && open(i.s) ? A.btn('ghost', L('Buka pemilik', 'Open owner'), 'link', { go: i.s, cls: 'btn-sm' }) : A.chip('mute', L('Read-only', 'Read-only'), 'lock'); } }
        ]) : A.empty(L('Belum ada pengaturan.', 'No settings yet.')), { icon: { numbering: 'hash', locale: 'globe', status: 'status', workflow: 'loop', threshold: 'gauge', approval: 'usercheck' }[g.k] || 'cog', count: g.items.length });
      }).join('');
      return head + cfgTabs('CFG-003') + groups;
    },
    act: {
      cset: function (el) {
        var k = el.getAttribute('data-val'), i = S.config(cx()).items.filter(function (x) { return x.k === k; })[0]; if (!i) return;
        var vers = (i.versions || []).slice(0, 4).map(function (v) { return '<li><b>v' + v.v + '</b> · ' + esc(String(v.val)) + ' <small>' + dt(v.eff) + ' · ' + t(v.reason) + '</small></li>'; }).join('');
        rdlg({ title: Lx(L('Ubah: ', 'Change: '), T(i.n)), icon: 'cog', sub: '<span class="mono6">' + esc(k) + '</span> · v' + i.ver + '<ul class="sa11-ver">' + vers + '</ul>',
          body: cfgInput(i) + fld(L('Tanggal efektif', 'Effective date'), inp('eff', S.today(), { type: 'date' }), { req: true, hint: t(L('Tanggal masa depan = perubahan terjadwal.', 'A future date = a scheduled change.')) }),
          fn: function (reason, v) { return S.setConfig(cx(), k, cfgRead(i, v), { eff: v.eff, reason: reason }); }, done: L('Konfigurasi tersimpan (versi baru).', 'Configuration saved (new version).') });
      }
    }
  };

  /* ================= NTF-001 Notification Log (§42) ================= */
  var CH_IC = { app: 'bell', email: 'message', wa: 'phone', push: 'tablet', sms: 'message' };
  function chN(k) { var c2 = S.CHANNELS.filter(function (x) { return x[0] === k; })[0]; return c2 ? c2[1] : L(k); }
  function commChip(st) { return st === 'delivered' ? A.chip('ok', L('Terkirim', 'Delivered'), 'checkc') : st === 'failed' ? A.chip('crit', L('Gagal', 'Failed'), 'xc') : A.chip('warn', L('Menunggu', 'Pending'), 'clock'); }
  V['NTF-001'] = {
    render: function (c) {
      var ctx = cx(), Q = c.q, sm = S.commSummary(ctx); if (!sm) return errState();
      var failed = S.commLog(ctx, { st: 'failed' });
      if (isM()) return mobile(t(L('Notifikasi gagal & tertunda.', 'Failed & pending notifications.')), [{ k: L('Gagal', 'Failed'), v: sm.failed, icon: 'xc', tone: sm.failed ? 'crit' : 'ok' }, { k: L('Terkirim', 'Delivered'), v: pct(sm.rate, 1), icon: 'checkc', tone: 'ok' }],
        failed.map(function (r) { return A.rowLink({ href: '#', icon: CH_IC[r.ch] || 'bell', tone: 'crit', t: esc(r.to) + ' · ' + t(chN(r.ch)), s: t(r.evN) + (r.err ? ' · ' + t(r.err) : ''), chip: commChip(r.st) }); }), L('Tidak ada notifikasi gagal.', 'No failed notifications.'));
      var rows = S.commLog(ctx, { st: Q.st, ch: Q.ch, ev: Q.ev, toType: Q.to, q: Q.q }), mng = can('sys11.notif.manage');
      var head = P.head(t(L('Semua notifikasi yang dibuat modul (logistik, delivery, finance, akses) + email/WhatsApp keluar, dengan hasil pengiriman. Klien hanya menerima data miliknya (§67).', 'Every notification the modules produced (logistics, delivery, finance, access) + outbound email/WhatsApp, with delivery results. Clients only receive their own data (§67).')), '', freshLive(L('log komunikasi', 'communication log')));
      var k = P.kpis([{ k: L('Total', 'Total'), v: n0(sm.total), icon: 'message' }, { k: L('Terkirim', 'Delivered'), v: n0(sm.delivered), icon: 'checkc', tone: 'ok', go: 'NTF-001', q: { st: 'delivered' } }, { k: L('Gagal', 'Failed'), v: n0(sm.failed), icon: 'xc', tone: sm.failed ? 'crit' : 'ok', go: 'NTF-001', q: { st: 'failed' } }, { k: L('Menunggu', 'Pending'), v: n0(sm.pending), icon: 'clock', tone: sm.pending ? 'warn' : 'ok', go: 'NTF-001', q: { st: 'pending' } }, { k: L('Delivery rate', 'Delivery rate'), v: pct(sm.rate, 1), icon: 'gauge', tone: sm.rate >= 95 ? 'ok' : 'warn', s: t(L('target ≥ 95%', 'target ≥ 95%')) }]);
      var fb = A.filters([{ k: 'st', l: L('Status', 'Status'), opts: [['delivered', L('Terkirim', 'Delivered')], ['failed', L('Gagal', 'Failed')], ['pending', L('Menunggu', 'Pending')]] }, { k: 'ch', l: L('Channel', 'Channel'), opts: S.CHANNELS.map(function (x) { return [x[0], x[1]]; }) },
        { k: 'ev', l: L('Event', 'Event'), opts: S.EVENTS.map(function (e) { return [e.k, e.n]; }) }, { k: 'to', l: L('Penerima', 'Recipient'), opts: [['client', L('Klien', 'Client')], ['internal', L('Internal', 'Internal')]] }], { search: L('Cari ID, penerima, record…', 'Search ID, recipient, record…') });
      var tbl = P.table(rows, [
        { h: L('Waktu', 'Time'), v: function (r) { return dt(r.at) + '<small class="sub5 mono6">' + esc(r.id) + '</small>'; } },
        { h: L('Penerima', 'Recipient'), v: function (r) { return '<b>' + esc(r.to) + '</b>' + (r.cl ? '<small class="sub5">' + esc(r.cl) + ' · ' + t(L('klien', 'client')) + '</small>' : '<small class="sub5">' + t(L('internal', 'internal')) + '</small>'); } },
        { h: L('Channel', 'Channel'), v: function (r) { return '<span class="sa11-ich">' + ic(CH_IC[r.ch] || 'bell') + t(chN(r.ch)) + '</span>'; } },
        { h: L('Event / Template', 'Event / Template'), v: function (r) { return t(r.evN) + (r.tpl ? '<small class="sub5">' + lnk('NTF-003', r.tpl, esc(r.tpl)) + '</small>' : ''); } },
        { h: L('Record', 'Record'), v: function (r) { return r.rec ? '<span class="mono6">' + esc(r.rec) + '</span>' : '—'; } },
        { h: L('Status', 'Status'), v: function (r) { return commChip(r.st) + (r.tries > 1 ? '<small class="sub5">' + t(L(r.tries + '× dicoba', r.tries + ' tries')) + '</small>' : ''); } },
        { h: L('Hasil / Error', 'Result / Error'), v: function (r) { return r.err ? '<span class="sa11-err-t">' + t(r.err) + '</span>' : t(r.res); } },
        { h: '', cls: 'r', v: function (r) { return r.st === 'failed' && mng ? A.btn('ghost', L('Kirim Ulang', 'Retry'), 'refresh', { act: 'retry1', val: r.id, cls: 'btn-sm' }) : ''; } }
      ], function (r) { return { t: esc(r.to), r: '', s: t(r.evN), chip: commChip(r.st) }; }, null, { empty: L('Belum ada notifikasi.', 'No notifications yet.') });
      return head + ntfTabs('NTF-001') + k + fb + tbl;
    },
    act: {
      retry1: function (el) {
        var id = el.getAttribute('data-val'), r = S.retry(cx(), id);
        if (r.ok) P.after(L('Notifikasi ' + id + ' terkirim ulang.', 'Notification ' + id + ' re-sent.')); else { A.rerender(); setTimeout(function () { A.toast(emsg(r), 'crit'); }, 300); }
      }
    }
  };

  /* ================= NTF-002 Template List (§41) ================= */
  V['NTF-002'] = {
    render: function (c) {
      var ctx = cx(), Q = c.q, all = S.templates(ctx);
      if (isM()) return mobile(t(L('Template dikelola di PC / iPad.', 'Templates are managed on PC / iPad.')), [{ k: L('Template', 'Templates'), v: all.length, icon: 'file' }, { k: L('Nonaktif', 'Inactive'), v: all.filter(function (x) { return !x.active; }).length, icon: 'ban' }], []);
      var rows = S.templates(ctx, { ev: Q.ev, ch: Q.ch, aud: Q.aud }).filter(function (x) { return !Q.st || (Q.st === 'on' ? x.active : !x.active); });
      var head = P.head(t(L('Template per event, channel dan bahasa. Variabel divalidasi; template untuk klien tidak boleh memuat data internal (§41, §67).', 'Templates per event, channel and language. Variables are validated; client templates cannot carry internal data (§41, §67).')), A.pbtn('sys11.notif.manage', 'primary', L('Template Baru', 'New Template'), 'plus', { go: 'NTF-003', rec: 'new' }), '');
      var fb = A.filters([{ k: 'ev', l: L('Event', 'Event'), opts: S.EVENTS.map(function (e) { return [e.k, e.n]; }) }, { k: 'ch', l: L('Channel', 'Channel'), opts: S.CHANNELS.map(function (x) { return [x[0], x[1]]; }) }, { k: 'aud', l: L('Penerima', 'Audience'), opts: [['client', L('Klien', 'Client')], ['internal', L('Internal', 'Internal')]] }, { k: 'st', l: L('Status', 'Status'), opts: [['on', L('Aktif', 'Active')], ['off', L('Nonaktif', 'Inactive')]] }]);
      var tbl = P.table(rows, [
        { h: L('Template', 'Template'), v: function (x) { return '<b>' + esc(x.name) + '</b><small class="sub5 mono6">' + esc(x.id) + '</small>'; } },
        { h: L('Trigger', 'Trigger'), v: function (x) { return t(x.evN); } },
        { h: L('Penerima', 'Audience'), v: function (x) { return x.aud === 'client' ? A.chip('info', L('Klien', 'Client'), 'building') : A.chip('mute', L('Internal', 'Internal'), 'users'); } },
        { h: L('Channel', 'Channel'), v: function (x) { return '<span class="sa11-chips">' + x.ch.map(function (k) { return '<span class="sa11-ich">' + ic(CH_IC[k] || 'bell') + t(chN(k)) + '</span>'; }).join('') + '</span>'; } },
        { h: L('Bahasa', 'Language'), v: function () { return 'ID · EN'; } },
        { h: L('Variabel', 'Variables'), cls: 'r num', v: function (x) { return x.vars.length; } },
        { h: L('Versi', 'Version'), cls: 'r num', v: function (x) { return 'v' + x.v; } },
        { h: L('Status', 'Status'), v: function (x) { return x.active ? A.chip('ok', L('Aktif', 'Active'), 'checkc') : A.chip('mute', L('Nonaktif', 'Inactive'), 'ban'); } }
      ], function (x) { return { t: esc(x.name), s: t(x.evN) }; }, function (x) { return href('NTF-003', x.id); }, { empty: L('Belum ada template.', 'No templates yet.') });
      var evC = card(L('Katalog event (§40)', 'Event catalog (§40)'), '<ul class="sa11-kl sa11-ev">' + S.EVENTS.map(function (e) { var n = all.filter(function (x) { return x.ev === e.k; }); return '<li><span>' + lnk('NTF-002', null, t(e.n), { ev: e.k }) + ' <small>' + (e.aud === 'client' ? t(L('klien', 'client')) : t(L('internal', 'internal'))) + '</small></span><b>' + n.length + '</b></li>'; }).join('') + '</ul>', { icon: 'zap' });
      return head + ntfTabs('NTF-002') + fb + '<div class="g21-10">' + tbl + evC + '</div>';
    }
  };

  /* ================= NTF-003 Template Editor (§41, §67) ================= */
  function tplForm(el) {
    var v = P.vals(el);
    return { ev: v.ev, aud: v.aud, ch: v.ch || [], lang: { id: { subj: v.sid || '', body: v.bid || '' }, en: { subj: v.sen || '', body: v.ben || '' } } };
  }
  function tplLive() {
    var el = document.getElementById('sa11-tf'); if (!el) return;
    var f = tplForm(el), chk = S.validateTemplate(f), lang = (document.querySelector('[name="pvl"]:checked') || {}).value || 'id', pv = S.preview(cx(), f, lang);
    var o = document.getElementById('sa11-chk');
    if (o) o.innerHTML = (chk.unknown.length ? note(t(L('Variabel tidak dikenal: ', 'Unknown variables: ')) + esc(chk.unknown.join(', ')), 'alert', 'crit') : '') +
      (chk.privacy.length ? note(t(S.MSG.privacy) + ' <b>' + esc(chk.privacy.join(', ')) + '</b>', 'lock', 'crit') : '') +
      (!chk.unknown.length && !chk.privacy.length ? note(t(L('Variabel valid', 'Variables valid')) + (chk.vars.length ? ': ' + esc(chk.vars.join(', ')) : ''), 'checkc', 'ok') : '') +
      Object.keys(chk.errs).filter(function (k) { return k !== 'vars'; }).map(function (k) { return note(t(chk.errs[k]), 'info', 'warn'); }).join('');
    var p = document.getElementById('sa11-pv');
    if (p && pv) p.innerHTML = '<span class="sa11-pv-h">' + ic(CH_IC[f.ch[0]] || 'bell') + t(f.ch.length ? chN(f.ch[0]) : L('Pilih channel', 'Pick a channel')) + '</span><b>' + esc(pv.subj) + '</b><p>' + esc(pv.body) + '</p>';
  }
  V['NTF-003'] = {
    title: function (rec) { if (rec === 'new') return L('Template Baru', 'New Template'); var x = rec && S.template(cx(), rec); return x ? L(x.id + ' · ' + x.name, x.id + ' · ' + x.lang.en.subj) : L('Editor Template', 'Template Editor'); },
    render: function (c) {
      var ctx = cx(), isNew = c.rec === 'new', x = isNew ? null : S.template(ctx, c.rec), mng = can('sys11.notif.manage');
      if (!isNew && !x) return A.stateCard('empty', S.MSG.notfound, A.btn('blue', L('Template', 'Templates'), 'arrowl', { go: 'NTF-002' }));
      if (isNew && !mng) return A.stateCard('noperm', S.MSG.noperm, A.backBtn());
      if (isM()) return mobile(x ? esc(x.id) + ' · ' + esc(x.name) : '', [], [], L('Edit template di PC / iPad.', 'Edit templates on PC / iPad.'));
      var d = x || { ev: S.EVENTS[0].k, aud: 'client', ch: ['app'], lang: { id: { subj: '', body: '' }, en: { subj: '', body: '' } }, active: true, v: 0, versions: [] };
      var ro = !mng, dis = ro ? ' readonly' : '';
      var head = P.head(x ? t(x.evN) + ' · v' + x.v + ' · ' + (x.active ? t(L('aktif', 'active')) : t(L('nonaktif', 'inactive'))) : t(L('Template baru tersimpan sebagai v1.', 'A new template is saved as v1.')),
        (x && mng ? A.btn('ghost', L('Kirim Uji', 'Send Test'), 'zap', { act: 'test' }) + A.btn('ghost', x.active ? L('Nonaktifkan', 'Deactivate') : L('Aktifkan', 'Activate'), x.active ? 'ban' : 'checkc', { act: 'tact' }) : ''));
      var form = '<form class="card" id="sa11-tf" onsubmit="return false"><div class="card-h"><h2>' + ic('edit') + '<span>' + t(L('Isi template', 'Template content')) + '</span></h2></div>' + fg(
        fld(L('Trigger (event)', 'Trigger (event)'), sel('ev', S.EVENTS.map(function (e) { return [e.k, e.n]; }), d.ev), { req: true }) + fld(L('Penerima', 'Audience'), sel('aud', [['client', L('Klien', 'Client')], ['internal', L('Internal', 'Internal')]], d.aud), { req: true }) +
        grp(L('Channel', 'Channels'), cks('ch', S.CHANNELS.map(function (k) { return [k[0], k[1], k[0] === 'sms']; }), d.ch), { req: true, hint: t(L('SMS disiapkan untuk masa depan.', 'SMS is prepared for the future.')) }) +
        fld(L('Subjek (ID)', 'Subject (ID)'), '<input name="sid" value="' + esc(d.lang.id.subj) + '"' + dis + '>', { wide: true }) + fld(L('Pesan (ID)', 'Message (ID)'), '<textarea name="bid" rows="4"' + dis + '>' + esc(d.lang.id.body) + '</textarea>', { req: true, wide: true }) +
        fld(L('Subjek (EN)', 'Subject (EN)'), '<input name="sen" value="' + esc(d.lang.en.subj) + '"' + dis + '>', { wide: true }) + fld(L('Pesan (EN)', 'Message (EN)'), '<textarea name="ben" rows="4"' + dis + '>' + esc(d.lang.en.body) + '</textarea>', { wide: true })) + '</form>';
      var vars = card(L('Variabel', 'Variables'), '<p class="sub5">' + t(L('Klik untuk menyisipkan di kolom yang aktif. ', 'Click to insert into the active field. ')) + ic('lock', 'sa11-ii') + ' ' + t(L('= internal, tidak boleh untuk klien.', '= internal, not allowed for clients.')) + '</p><div class="sa11-vars">' + Object.keys(S.VARS).map(function (k) { var vv = S.VARS[k]; return '<button type="button" class="sa11-var' + (vv[1] ? '' : ' int') + '" data-act="var" data-val="' + esc(k) + '" title="' + esc(T(vv[0]) + ' · ' + vv[2]) + '"' + (ro ? ' disabled' : '') + '>' + (vv[1] ? '' : ic('lock')) + '{{' + esc(k) + '}}</button>'; }).join('') + '</div>', { icon: 'hash' });
      var pv = card(L('Preview', 'Preview'), '<div class="sa11-pvl" role="radiogroup"><label><input type="radio" name="pvl" value="id" checked> ID</label><label><input type="radio" name="pvl" value="en"> EN</label></div><div class="sa11-pv" id="sa11-pv"></div><div id="sa11-chk"></div>', { icon: 'eye' });
      var hist = x ? card(L('Riwayat versi', 'Version history'), '<ul class="sa11-ver">' + x.versions.map(function (v) { return '<li><b>v' + v.v + '</b><span>' + t(v.reason) + '<small>' + esc(v.at) + ' · ' + esc(v.byName || v.by) + ' · ' + esc(v.ch.join(', ')) + '</small></span></li>'; }).join('') + '</ul>', { icon: 'history', count: x.versions.length }) : '';
      return head + ntfTabs('NTF-002') + (ro ? note(t(L('Mode baca: butuh izin kelola notifikasi untuk mengubah.', 'Read mode: the notification-manage permission is needed to edit.')), 'lock', 'info') : '') + '<div class="g21-10"><div class="col10">' + form + vars + '</div><div class="col10">' + pv + hist + '</div></div>' +
        (mng ? P8.abar(A.btn('primary', isNew ? L('Simpan Template', 'Save Template') : L('Simpan Versi Baru', 'Save New Version'), 'check', { act: 'tsave' }), A.btn('ghost', L('Kembali', 'Back'), 'arrowl', { go: 'NTF-002' })) : '');
    },
    after: function () {
      var el = document.getElementById('sa11-tf'); if (!el) return;
      el.addEventListener('input', tplLive); el.addEventListener('change', tplLive);
      el.addEventListener('focusin', function (e) { if (e.target.matches('input[name],textarea')) V['NTF-003']._f = e.target; });
      document.querySelectorAll('[name="pvl"]').forEach(function (r) { r.addEventListener('change', tplLive); });
      tplLive();
    },
    act: {
      var: function (el) {
        var f = V['NTF-003']._f && document.body.contains(V['NTF-003']._f) ? V['NTF-003']._f : document.querySelector('#sa11-tf [name="bid"]'); if (!f || f.readOnly) return;
        var ins = '{{' + el.getAttribute('data-val') + '}}', s = f.selectionStart == null ? f.value.length : f.selectionStart, e = f.selectionEnd == null ? s : f.selectionEnd;
        f.value = f.value.slice(0, s) + ins + f.value.slice(e); f.focus(); try { f.setSelectionRange(s + ins.length, s + ins.length); } catch (x) {} tplLive();
      },
      tsave: function () {
        var el = document.getElementById('sa11-tf'), f = tplForm(el), id = A.S.rec === 'new' ? null : A.S.rec, chk = S.validateTemplate(f);
        rdlg({ title: id ? L('Simpan versi baru', 'Save new version') : L('Simpan template', 'Save template'), icon: 'check', sub: (chk.privacy.length ? '<b class="sa11-err-t">' + t(S.MSG.privacy) + '</b><br>' : '') + t(L('Variabel: ', 'Variables: ')) + esc(chk.vars.join(', ') || '—'),
          fn: function (reason) { return S.saveTemplate(cx(), id, f, reason); }, done: function (r) { return L('Template ' + r.template.id + ' v' + r.template.v + ' tersimpan.', 'Template ' + r.template.id + ' v' + r.template.v + ' saved.'); }, go: function (r) { return ['NTF-003', r.template.id]; } });
      },
      tact: function () {
        var x = S.template(cx(), A.S.rec); if (!x) return;
        rdlg({ title: x.active ? L('Nonaktifkan template', 'Deactivate template') : L('Aktifkan template', 'Activate template'), icon: x.active ? 'ban' : 'checkc', ok: x.active ? L('Nonaktifkan', 'Deactivate') : L('Aktifkan', 'Activate'), sub: esc(x.id) + ' · ' + esc(x.name),
          fn: function (reason) { return S.setTemplateActive(cx(), x.id, !x.active, reason); }, done: L('Status template diperbarui.', 'Template status updated.') });
      },
      test: function () {
        var x = S.template(cx(), A.S.rec); if (!x) return;
        var cls = S.masterList(cx(), 'client', { st: 'active' });
        rdlg({ title: L('Kirim notifikasi uji', 'Send a test notification'), icon: 'zap', ok: L('Kirim', 'Send'), noReason: true, sub: t(x.aud === 'client' ? L('Pesan uji klien hanya memuat data klien yang dipilih (§67).', 'A client test message only carries the chosen client\'s data (§67).') : L('Template internal hanya dikirim ke tim internal (Anda).', 'Internal templates only go to the internal team (you).')),
          body: fg((x.aud === 'client' ? fld(L('Klien', 'Client'), sel('cl', cls.map(function (r) { return [r.code, r.n]; }), 'CL-07')) : '') + fld(L('Channel', 'Channel'), sel('ch', x.ch.map(function (k) { return [k, chN(k)]; }), x.ch.filter(function (k) { return k !== 'app'; })[0] || x.ch[0]))),
          fn: function (r0, v) { return S.sendTest(cx(), x.id, { cl: v.cl || null, ch: v.ch }); }, done: function (r) { return L('Pesan uji ' + r.msg.id + ' masuk antrean (lihat Log Komunikasi).', 'Test message ' + r.msg.id + ' queued (see the Communication Log).'); } });
      }
    }
  };

  /* ================= NTF-004 Channel Settings (§39) ================= */
  V['NTF-004'] = {
    render: function () {
      var ctx = cx(), chs = S.channels(ctx); if (!chs.length) return errState();
      if (isM()) return mobile(t(L('Status channel.', 'Channel status.')), [], chs.filter(function (x) { return x.st === 'warning' || x.st === 'unavailable'; }).map(function (x) { return A.rowLink({ href: '#', icon: CH_IC[x.k], tone: 'warn', t: t(x.n), s: x.note ? t(x.note) : '' }); }));
      var mng = can('sys11.notif.manage');
      var STN = { healthy: ['ok', L('Sehat', 'Healthy'), 'checkc'], warning: ['warn', L('Warning', 'Warning'), 'alert'], unavailable: ['crit', L('Tidak tersedia', 'Unavailable'), 'xc'], disabled: ['mute', L('Dimatikan', 'Turned off'), 'ban'], future: ['info', L('Masa depan', 'Future'), 'clock'] };
      var head = P.head(t(L('In-App, Email, WhatsApp (butuh integrasi sehat), Push, SMS (disiapkan). In-App selalu aktif untuk pesan sistem & keamanan.', 'In-App, Email, WhatsApp (needs a healthy integration), Push, SMS (prepared). In-App always stays on for system & security messages.')), '', freshLive(L('channel + integrasi + log 24 jam', 'channels + integrations + 24 h log')));
      var cards = '<div class="sa11-chs">' + chs.map(function (x) {
        var s = STN[x.st] || STN.healthy;
        var btn = !mng || x.k === 'sms' ? '' : x.k === 'app' ? '<small class="sub5">' + t(L('Wajib aktif', 'Always on')) + '</small>' : A.btn(x.on ? 'ghost' : 'blue', x.on ? L('Matikan', 'Turn off') : L('Nyalakan', 'Turn on'), x.on ? 'ban' : 'checkc', { act: 'chs', val: x.k + '|' + (x.on ? 0 : 1), cls: 'btn-sm' });
        return '<section class="card sa11-ch sa11-t-' + s[0] + '"><div class="sa11-ch-h"><span class="sa11-sum-ic">' + ic(CH_IC[x.k] || 'bell') + '</span><b>' + t(x.n) + '</b>' + A.chip(s[0], s[1], s[2]) + '</div>' +
          kv([[L('Status', 'Status'), x.on ? t(L('Aktif', 'On')) : t(L('Mati', 'Off'))], [L('Integrasi', 'Integration'), x.integ ? (open('INT-002') ? lnk('INT-002', x.integ, esc(x.integ)) : esc(x.integ)) + (x.integSt ? ' · ' + t(S.INT_ST[x.integSt][0]) : '') : '—'], [L('Kirim 24 jam', 'Sent 24 h'), n0(x.sent24 || 0)], [L('Gagal 24 jam', 'Failed 24 h'), n0(x.failed24 || 0)], [L('Delivery rate', 'Delivery rate'), x.rate == null ? '—' : pct(x.rate, 1)]]) +
          (x.note ? note(t(x.note), 'info', x.st === 'warning' ? 'warn' : 'info') : '') + '<div class="sa11-ch-f">' + btn + '</div></section>';
      }).join('') + '</div>';
      return head + ntfTabs('NTF-004') + cards;
    },
    act: {
      chs: function (el) {
        var p = el.getAttribute('data-val').split('|'), on = p[1] === '1';
        rdlg({ title: on ? L('Nyalakan channel', 'Turn channel on') : L('Matikan channel', 'Turn channel off'), icon: on ? 'checkc' : 'ban', ok: on ? L('Nyalakan', 'Turn on') : L('Matikan', 'Turn off'), sub: t(chN(p[0])) + ' · ' + t(on ? L('Hanya bisa jika integrasinya sehat.', 'Only possible when its integration is healthy.') : L('Notifikasi lewat channel ini akan gagal sampai dinyalakan lagi.', 'Notifications through this channel fail until it is turned on again.')),
          fn: function (reason) { return S.setChannel(cx(), p[0], on, reason); }, done: L('Channel diperbarui.', 'Channel updated.') });
      }
    }
  };

  /* ================= SYS-001 System Control Center (§58–§63) ================= */
  var SEC_IC = { users: 'users', master: 'database', settings: 'cog', workflow: 'loop', notif: 'bell', integ: 'plug', security: 'shield', audit: 'history', retention: 'database', health: 'gauge' };
  var QA_IC = { addUser: 'plus', review: 'usercheck', integ: 'plug', audit: 'history', alert: 'alert', backup: 'database' };
  var BIZ = [[L('Menyetujui pembayaran', 'Approve payments'), ['ap.pay', 'ap.approve', 'cash.approve', 'ar.approve', 'fin.approve']], [L('Mengubah harga', 'Change prices'), ['price.edit', 'com.rate.edit', 'com.rate.approve']], [L('Mengubah HPP', 'Change HPP'), ['hpp.calc']], [L('Menutup periode', 'Close a period'), ['fin.close', 'fin.period']], [L('Mengubah data historis', 'Modify historical data'), ['fin.gl.reverse', 'dlv.pod.amend', 'dlv.comp.amend', 'lg.evidence.amend']]];
  function limitsCard(ctl) {
    var mine = S.effPerms(cx().uid), biz = mine.filter(S.isBusinessApproval);
    var rows = BIZ.map(function (b) { var has = b[1].some(function (p) { return mine.indexOf(p) >= 0; }); return '<li class="' + (has ? 'has' : '') + '">' + ic(has ? 'checkc' : 'ban') + '<span>' + t(b[0]) + '</span><b>' + (has ? t(L('dari peran bisnis Anda', 'from your business role')) : t(L('Tidak', 'No'))) + '</b></li>'; }).join('');
    return '<section class="card sa11-lim"><div class="card-h"><h2>' + ic('lock') + '<span>' + t(L('Batas Super Admin (§63)', 'Super Admin limits (§63)')) + '</span></h2></div>' +
      '<p class="sa11-lim-t"><b>' + t(L('Super Admin tidak otomatis bisa menyetujui pembayaran, mengubah harga/HPP, menutup periode.', 'Super Admin cannot automatically approve payments, change prices/HPP or close periods.')) + '</b> ' + t(ctl.limits) + '</p><ul class="sa11-biz">' + rows + '</ul>' +
      '<p class="sub5">' + t(L('Hak persetujuan bisnis yang Anda pegang: ', 'Business approval rights you hold: ')) + '<b>' + biz.length + '</b>' + (biz.length ? ' · ' + esc(biz.slice(0, 6).join(', ')) + (biz.length > 6 ? '…' : '') : ' · ' + t(L('admin sistem tidak pernah mendapatkannya.', 'system admins never get them.'))) + '</p></section>';
  }
  function frangipani() {
    return '<svg class="sa11-bali" viewBox="0 0 120 120" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="2.2">' + [0, 72, 144, 216, 288].map(function (r) { return '<path d="M60 60 C 50 38, 54 18, 66 12 C 78 18, 74 40, 60 60Z" transform="rotate(' + r + ' 60 60)"/>'; }).join('') + '<circle cx="60" cy="60" r="6"/></g></svg>';
  }
  V['SYS-001'] = {
    render: function () {
      var ctx = cx(), ctl = S.control(ctx); if (!ctl) return errState();
      var h = ctl.hero, tone = h.st === 'healthy' ? 'ok' : h.st === 'warning' ? 'warn' : 'crit';
      var hero = '<section class="sa11-hero sa11-t-' + tone + '">' + frangipani() + '<div class="sa11-hero-m"><span class="sa11-hero-k">' + ic('gauge') + esc(h.brand) + '</span><b class="sa11-hero-s">' + esc(String(T(h.stN)).toUpperCase()) + '</b>' + A.chip(tone, h.stN, tone === 'ok' ? 'checkc' : 'alert') + '</div>' +
        '<div class="sa11-hero-f"><span>' + ic('zap') + t(L('Uptime ', 'Uptime ')) + '<b>' + esc(h.uptime) + '</b></span><span>' + ic('database') + t(L('Backup terakhir ', 'Last backup ')) + '<b>' + t(h.lastBackup) + '</b></span><span>' + ic('plug') + '<b>' + t(h.integLabel) + '</b></span>' + (ctl.pendingRequests ? '<span>' + ic('hourglass') + '<b>' + ctl.pendingRequests + '</b> ' + t(L('permintaan menunggu', 'requests pending')) + '</span>' : '') + '</div></section>';
      var alerts = card(L('Alert terbuka', 'Open alerts'), ctl.alerts.length ? '<div class="rls sa11-mrl">' + ctl.alerts.map(alertRow).join('') + '</div>' : A.empty(L('Tidak ada alert terbuka.', 'No open alerts.')), { icon: 'bell', count: ctl.alerts.length, link: open('SYS-004') ? ['SYS-004', L('Semua alert', 'All alerts')] : null });
      if (isM()) return P.head(t(L('Status sistem & alert kritis.', 'System status & critical alerts.'))) + hero + alerts + P.deskOnly();
      var kp = P.kpis(ctl.kpis.map(function (k) { return { k: k.n, v: esc(Array.isArray(k.v) ? T(k.v) : String(k.v)), s: k.d ? esc(k.d) : '', tone: k.st === 'info' ? 'info' : k.st, go: open(k.s) ? k.s : null, icon: { users: 'users', active: 'usercheck', locked: 'lock', roles: 'idcard', permIssues: 'key', failed: 'xc', integErr: 'plug', notifFail: 'message', auditAlerts: 'shield', health: 'gauge', storage: 'database', backup: 'history' }[k.k] }; }), 'sa11-kp');
      var secs = '<div class="sa11-secs">' + ctl.sections.map(function (s) { var tag = open(s.s) ? 'a' : 'div'; return '<' + tag + ' class="sa11-sec"' + (tag === 'a' ? ' href="' + href(s.s) + '"' : '') + '><span class="sa11-sum-ic">' + ic(SEC_IC[s.k] || 'grid') + '</span><span><b>' + t(s.n) + '</b><small>' + (s.d ? esc(s.d) : esc(s.s)) + '</small></span>' + ic('chevr', 'sa11-go') + '</' + tag + '>'; }).join('') + '</div>';
      var quick = ctl.quick.filter(function (x) { return open(x.s) && (x.k !== 'addUser' || can('sys11.users.manage')); });
      var qa = '<div class="sa11-qa">' + quick.map(function (x) { return A.btn(x.k === 'addUser' ? 'primary' : 'ghost', x.n, QA_IC[x.k] || 'arrow', { go: x.s, rec: x.rec }); }).join('') + '</div>';
      var hl = card(L('Kesehatan sistem', 'System health'), '<ul class="sa11-hl">' + ctl.health.items.map(function (i) { var body = '<span>' + t(i.n) + '</span><b>' + esc(i.v) + '</b>' + intChip(i.st); return '<li>' + (i.s && open(i.s) ? '<a href="' + href(i.s) + '">' + body + '</a>' : body) + '</li>'; }).join('') + '</ul>', { icon: 'gauge', link: open('INT-007') ? ['INT-007', L('System Health', 'System Health')] : null });
      var head = P.head(t(L('Satu sistem kendali: user, akses, master data, notifikasi, integrasi, keamanan, audit dan backup.', 'One system of control: users, access, master data, notifications, integrations, security, audit and backups.')), '', freshLive(L('engine sistem Fase 11', 'Phase 11 system engine')));
      return head + hero + kp + card(L('Aksi cepat', 'Quick actions'), qa, { icon: 'zap' }) + '<div class="g21-10"><div class="col10">' + card(L('Seksi sistem', 'System sections'), secs, { icon: 'grid' }) + alerts + '</div><div class="col10">' + limitsCard(ctl) + hl + '</div></div>' +
        (isT() ? P8.abar(quick.slice(0, 3).map(function (x) { return P8.xl(x.k === 'addUser' ? 'primary' : 'blue', x.n, QA_IC[x.k] || 'arrow', { go: x.s, rec: x.rec }); }).join('')) : '');
    }
  };

  /* ================= SYS-002 User Health ================= */
  V['SYS-002'] = {
    render: function () {
      var ctx = cx(), uh = S.userHealth(ctx); if (!uh) return errState();
      var s = uh.summary, alerts = userAlerts(ctx);
      var counts = [{ k: L('Aktif', 'Active'), v: s.active, icon: 'usercheck', tone: 'ok', go: 'ADM-001', qs: { status: 'active' } }, { k: L('Terkunci', 'Locked'), v: s.locked, icon: 'lock', tone: s.locked ? 'crit' : 'ok', go: 'ADM-001', qs: { status: 'locked' } }, { k: L('Diundang', 'Invited'), v: s.invited, icon: 'message', tone: 'info', go: 'ADM-001', qs: { status: 'invited' } },
        { k: L('Ditangguhkan', 'Suspended'), v: s.suspended, icon: 'pause', tone: s.suspended ? 'warn' : 'ok' }, { k: L('Masalah izin', 'Permission issues'), v: uh.issues.length, icon: 'key', tone: uh.issues.length ? 'warn' : 'ok' }, { k: L('Menunggu persetujuan', 'Pending approval'), v: uh.requests.length, icon: 'hourglass', tone: uh.requests.length ? 'warn' : 'ok' }];
      if (isM()) return mobile(t(L('Kesehatan akun internal.', 'Internal account health.')), counts.slice(0, 4), alerts);
      var mng = can('sys11.users.manage');
      var head = P.head(t(L('User aktif/terkunci, masalah izin, akses berakhir dan permintaan role yang menunggu.', 'Active/locked users, permission issues, expired access and pending role requests.')), '', freshLive(L('akun & sesi JFACCESS', 'JFACCESS accounts & sessions')));
      var issues = card(L('Masalah izin', 'Permission issues'), uh.issues.length ? '<div class="rls sa11-mrl">' + uh.issues.map(function (i) { return A.rowLink({ href: href('ADM-002', i.uid), icon: i.k === 'sod' ? 'scale' : i.k === 'expired' ? 'clock' : 'key', tone: i.k === 'sod' || i.k === 'expired' ? 'crit' : 'warn', t: esc(i.name), s: t(i.n) }); }).join('') + '</div>' : A.empty(L('Tidak ada masalah izin.', 'No permission issues.')), { icon: 'key', count: uh.issues.length });
      var locked = card(L('User terkunci', 'Locked users'), uh.locked.length ? '<div class="sa11-ul">' + uh.locked.map(function (u) { return '<div class="sa11-ul-i">' + who(u, true) + uChip(u) + '<span class="sa11-btns">' + stBtns(u, { only: ['unlock'], cls: isT() ? 'btn-xl' : 'btn-sm' }) + '</span></div>'; }).join('') + '</div>' : A.empty(L('Tidak ada user terkunci.', 'No locked users.')), { icon: 'lock', count: uh.locked.length });
      var exp = card(L('Akses berakhir', 'Expired access'), uh.expired.length ? '<div class="sa11-ul">' + uh.expired.map(function (u) { return '<div class="sa11-ul-i">' + who(u, true) + A.chip('crit', L('Berakhir ' + u.end, 'Ended ' + u.end), 'clock') + uChip(u) + '<span class="sa11-btns">' + (mng && u.status !== 'inactive' ? stBtns(u, { only: ['deactivate'], cls: isT() ? 'btn-xl' : 'btn-sm' }) : '') + '</span></div>'; }).join('') + '</div>' : A.empty(L('Tidak ada akses berakhir.', 'No expired access.')), { icon: 'clock', count: uh.expired.length });
      var reqs = card(L('Permintaan role menunggu', 'Pending role requests'), reqRows(uh.requests), { icon: 'hourglass', count: uh.requests.length });
      var rv = card(L('Review akses', 'Access review'), kv([[L('Privileged', 'Privileged'), n0(uh.review.privileged)], [L('Perlu review', 'Needs review'), n0(uh.review.review)], [L('Akses sementara', 'Temporary access'), n0(uh.review.temporary)], [L('Tidak aktif', 'Inactive'), n0(uh.review.inactive)]]) + (open('ADM-005') ? A.btn('ghost', L('Buka Review Akses', 'Open Access Review'), 'usercheck', { go: 'ADM-005' }) : ''), { icon: 'usercheck' });
      return head + P8.bigCount(counts) + '<div class="g2-10">' + locked + exp + '</div><div class="g2-10">' + issues + '<div class="col10">' + reqs + rv + '</div></div>';
    },
    act: acts()
  };

  /* ================= SYS-003 Integration Health (§49–§52, §57) ================= */
  function credChip(c) { return !c || c.st === 'none' ? '—' : A.chip(c.st === 'expired' ? 'crit' : c.st === 'expiring' ? 'warn' : 'ok', L(c.type + ' ' + c.mask + ' · ' + (c.days < 0 ? 'berakhir ' + (-c.days) + ' hari lalu' : c.days + ' hari'), c.type + ' ' + c.mask + ' · ' + (c.days < 0 ? 'expired ' + (-c.days) + ' days ago' : c.days + ' days')), 'key'); }
  V['SYS-003'] = {
    render: function () {
      var ctx = cx(), list = S.integrations(ctx), sm = S.integSummary(ctx); if (!sm) return errState();
      var bad = list.filter(function (i) { return !i.future && i.st !== 'healthy'; });
      var counts = [{ k: L('Healthy', 'Healthy'), v: sm.healthy + '/' + sm.total, icon: 'checkc', tone: 'ok' }, { k: L('Warning', 'Warning'), v: sm.warning, icon: 'alert', tone: sm.warning ? 'warn' : 'ok' }, { k: L('Critical', 'Critical'), v: sm.critical, icon: 'xc', tone: sm.critical ? 'crit' : 'ok' }, { k: L('Disconnected', 'Disconnected'), v: sm.disconnected, icon: 'wifioff', tone: sm.disconnected ? 'crit' : 'ok' }];
      var rowsBad = bad.map(function (i) { return A.rowLink({ href: open('INT-002') ? href('INT-002', i.id) : '#', icon: 'plug', tone: i.tone === 'mute' ? 'crit' : i.tone, t: esc(i.n), s: i.err ? t(i.err) : t(S.MSG.integ), chip: intChip(i.st) }); });
      if (isM()) return mobile(t(L('Integrasi yang bermasalah.', 'Integrations with problems.')), counts, rowsBad, L('Belum ada integration error.', 'No integration errors yet.'));
      var mng = can('sys11.integration.manage');
      var head = P.head(t(L('Status integrasi & API ringkas dengan tes dan retry cepat. Kredensial selalu disamarkan (§50, §52).', 'Integration & API status at a glance with quick test and retry. Credentials are always masked (§50, §52).')), open('INT-001') ? A.btn('ghost', L('Integration Center', 'Integration Center'), 'plug', { go: 'INT-001' }) : '', freshLive(L('status integrasi', 'integration status')));
      var cards = '<div class="sa11-igs">' + list.map(function (i) {
        var b = mng && !i.future ? A.btn('ghost', L('Tes Koneksi', 'Test Connection'), 'zap', { act: 'itest', val: i.id, cls: isT() ? 'btn-xl' : 'btn-sm' }) + (i.st !== 'healthy' ? A.btn('blue', L('Retry Sinkron', 'Retry Sync'), 'refresh', { act: 'iretry', val: i.id, cls: isT() ? 'btn-xl' : 'btn-sm' }) : '') : '';
        return '<section class="card sa11-ig sa11-t-' + (i.future ? 'info' : i.tone === 'mute' ? 'crit' : i.tone) + '"><div class="sa11-ch-h"><span class="sa11-sum-ic">' + ic('plug') + '</span><b>' + (open('INT-002') ? lnk('INT-002', i.id, esc(i.n)) : esc(i.n)) + '</b>' + intChip(i.future ? null : i.st) + '</div>' +
          kv([[L('Sinkron terakhir', 'Last sync'), dt(i.last)], [L('Sukses terakhir', 'Last success'), dt(i.ok)], [L('Kredensial', 'Credentials'), credChip(i.cred)], [L('Sukses rate', 'Success rate'), i.rate == null ? '—' : pct(i.rate, 1)]]) +
          (i.err && i.st !== 'healthy' ? note(t(i.err), 'alert', i.st === 'warning' ? 'warn' : 'crit') : '') + (b ? '<div class="sa11-ch-f">' + b + '</div>' : '') + '</section>';
      }).join('') + '</div>';
      var apis = S.apis(ctx), apiC = card(L('API', 'APIs'), P.table(apis, [
        { h: L('API', 'API'), v: function (a) { return '<b>' + esc(a.n) + '</b><small class="sub5">' + t(a.pur) + '</small>'; } },
        { h: L('Status', 'Status'), v: function (a) { return intChip(a.st); } },
        { h: L('Request terakhir', 'Last request'), v: function (a) { return dt(a.last); } },
        { h: L('Error rate', 'Error rate'), cls: 'r num', v: function (a) { return pct(a.err, 1); } },
        { h: L('Autentikasi', 'Auth'), v: function (a) { return esc(a.auth); } }
      ]), { icon: 'component', link: open('INT-003') ? ['INT-003', L('API Management', 'API Management')] : null });
      return head + P8.bigCount(counts) + cards + apiC;
    },
    act: {
      itest: function (el) {
        var id = el.getAttribute('data-val'), r = S.testConnection(cx(), id);
        A.rerender(); setTimeout(function () { A.toast(r.msg ? r.msg : emsg(r), r.res === 'success' ? null : r.res === 'warning' ? 'warn' : 'crit'); }, 300);
      },
      iretry: function (el) {
        var id = el.getAttribute('data-val');
        rdlg({ title: L('Retry sinkron', 'Retry sync'), icon: 'refresh', ok: L('Retry', 'Retry'), optional: true, sub: esc(id) + ' · ' + t(L('Hasil retry tercatat di log integrasi dan audit.', 'The retry result is recorded in the integration log and audit.')),
          fn: function (reason) { var r = S.retrySync(cx(), id, reason); if (!r.ok) { r = Object.assign({}, r, { msg: L(T(r.msg) + (r.detail ? ' ' + T(r.detail) : ''), (r.msg[1] || '') + (r.detail ? ' ' + r.detail[1] : '')) }); } return r; }, done: L('Sinkron ulang berhasil.', 'Re-sync succeeded.') });
      }
    }
  };

  /* ================= SYS-004 Security Alerts (§48) ================= */
  var AST = { open: ['crit', L('Terbuka', 'Open'), 'alert'], ack: ['warn', L('Diakui', 'Acknowledged'), 'eye'], resolved: ['ok', L('Selesai', 'Resolved'), 'checkc'] };
  V['SYS-004'] = {
    render: function (c) {
      var ctx = cx(), Q = c.q, all = S.secAlerts(ctx), mng = can('sys11.security.manage');
      var list = S.secAlerts(ctx, { st: Q.st === 'all' ? null : Q.st || 'open', sev: Q.sev, kind: Q.kind });
      var head = P.head(t(L('Alert keamanan: akui, lalu selesaikan dengan catatan. Setiap langkah tercatat di audit.', 'Security alerts: acknowledge, then resolve with a note. Every step is audited.')), '', freshLive(L('deteksi keamanan', 'security detection')));
      var openN = all.filter(function (a) { return a.st !== 'resolved'; });
      var cnt = [{ k: L('Terbuka', 'Open'), v: openN.length, icon: 'bell', tone: openN.length ? 'warn' : 'ok', go: 'SYS-004' }, { k: L('Kritis', 'Critical'), v: openN.filter(function (a) { return a.sev === 'crit'; }).length, icon: 'alert', tone: 'crit', go: 'SYS-004', qs: { sev: 'crit' } }, { k: L('Diakui', 'Acknowledged'), v: all.filter(function (a) { return a.st === 'ack'; }).length, icon: 'eye', tone: 'info', go: 'SYS-004', qs: { st: 'ack' } }, { k: L('Selesai', 'Resolved'), v: all.filter(function (a) { return a.st === 'resolved'; }).length, icon: 'checkc', tone: 'ok', go: 'SYS-004', qs: { st: 'resolved' } }];
      var fb = '<div class="fb">' + fsel('st', L('Status', 'Status'), [['', L('Terbuka & diakui', 'Open & acknowledged')], ['ack', L('Diakui', 'Acknowledged')], ['resolved', L('Selesai', 'Resolved')], ['all', L('Semua status', 'All statuses')]]) +
        fsel('sev', L('Tingkat', 'Severity'), [['', L('Semua tingkat', 'All severities')], ['crit', L('Kritis', 'Critical')], ['warn', L('Warning', 'Warning')]]) + fsel('kind', L('Jenis', 'Kind'), [['', L('Semua jenis', 'All kinds')]].concat(Object.keys(S.ALERT_KINDS).map(function (k) { return [k, S.ALERT_KINDS[k]]; }))) + '</div>';
      var big = isM() || isT();
      var items = list.length ? '<div class="sa11-als">' + list.map(function (a) {
        var s = AST[a.st] || AST.open, go = a.s && open(a.s) && a.s !== 'SYS-004' ? A.btn('ghost', L('Buka sumber', 'Open source'), 'arrow', { go: a.s, rec: a.rec, cls: big ? '' : 'btn-sm' }) : '';
        var b = mng && a.st !== 'resolved' ? (a.st === 'open' ? A.btn('ghost', L('Akui', 'Acknowledge'), 'eye', { act: 'aack', val: a.id, cls: big ? '' : 'btn-sm' }) : '') + A.btn('primary', L('Selesaikan', 'Resolve'), 'checkc', { act: 'ares', val: a.id, cls: big ? '' : 'btn-sm' }) : '';
        return '<article class="card sa11-al sa11-t-' + (a.st === 'resolved' ? 'ok' : a.sev) + (Q.id === a.id ? ' sa11-hit' : '') + '" id="al-' + esc(a.id) + '"><div class="sa11-al-h">' + sevChip(a.sev) + A.chip(s[0], s[1], s[2]) + '<small class="mono6">' + esc(a.id) + '</small><span class="sa11-sp"></span><small>' + dt(a.at) + '</small></div>' +
          '<h3>' + t(a.t) + '</h3><p>' + t(a.c) + '</p><small class="sub5">' + t(a.kindN) + (a.rec ? ' · ' + esc(a.rec) : '') + (a.note ? ' · ' + t(L('Catatan: ', 'Note: ')) + t(a.note) : '') + (a.by ? ' · ' + empN(a.by) : '') + '</small>' +
          (go || b ? '<div class="sa11-al-f">' + go + b + '</div>' : '') + '</article>';
      }).join('') + '</div>' : A.stateCard('success', L('Tidak ada alert terbuka.', 'No open alerts.'), '', L('Aman', 'All clear'));
      return head + P8.bigCount(cnt) + (isM() ? '' : fb) + items;
    },
    act: {
      aack: function (el) {
        var id = el.getAttribute('data-val');
        rdlg({ title: L('Akui alert', 'Acknowledge alert'), icon: 'eye', ok: L('Akui', 'Acknowledge'), optional: true, label: L('Catatan', 'Note'), sub: esc(id), fn: function (note2) { return S.ackAlert(cx(), id, note2); }, done: L('Alert diakui.', 'Alert acknowledged.') });
      },
      ares: function (el) {
        var id = el.getAttribute('data-val');
        rdlg({ title: L('Selesaikan alert', 'Resolve alert'), icon: 'checkc', ok: L('Selesaikan', 'Resolve'), label: L('Catatan penyelesaian', 'Resolution note'), sub: esc(id) + ' · ' + t(L('Catatan wajib.', 'A note is required.')), fn: function (note2) { return S.resolveAlert(cx(), id, note2); }, done: L('Alert diselesaikan.', 'Alert resolved.') });
      }
    }
  };

  /* ================= SYS-005 System Settings ================= */
  var OWN64 = [[L('Service Master', 'Service Master'), L('Komersial / System Admin', 'Commercial / System Admin')], [L('Rate Card', 'Rate Card'), L('Komersial + Finance berwenang', 'Commercial + authorised Finance')], [L('Berat Item', 'Item Weight'), L('Operasional / Costing', 'Operations / Costing')], [L('COA', 'COA'), L('Finance Admin', 'Finance Admin')],
    [L('User / Role', 'User / Role'), L('System Admin + HR berwenang', 'System Admin + authorised HR')], [L('Supplier', 'Supplier'), L('Supply', 'Supply')], [L('Aset', 'Asset'), L('Asset Admin', 'Asset Admin')], [L('Keamanan', 'Security'), L('System Admin / Security', 'System Admin / Security')]];
  V['SYS-005'] = {
    render: function () {
      var ctx = cx(), cf = S.config(ctx); if (!cf) return errState();
      if (isM()) return mobile(t(L('Pengaturan sistem hanya di PC.', 'System settings are on a PC only.')), [], []);
      var get = function (k) { return cf.items.filter(function (i) { return i.k === k; })[0]; }, sec = S.security(ctx);
      var head = P.head(t(L('Ringkasan pengaturan sistem & keamanan dengan pemilik dan versi. Ubah di layar pemiliknya.', 'System & security settings summary with owner and version. Change them on the owning screen.')), (open('CFG-003') ? A.btn('blue', L('Konfigurasi Sistem', 'System Configuration'), 'cog', { go: 'CFG-003' }) : '') + (open('SEC-005') ? A.btn('ghost', L('Pengaturan Keamanan', 'Security Settings'), 'lock', { go: 'SEC-005' }) : ''), freshLive(L('konfigurasi berversi', 'versioned configuration')));
      function row(k) { var i = get(k); return i ? [i.n, cfgVal(i) + ' <small class="sub5">v' + (i.ver || '—') + (i.eff ? ' · ' + dt(i.eff) : '') + '</small>'] : null; }
      var loc = card(L('Bahasa, format & zona waktu', 'Language, format & time zone'), kv(['lang.default', 'fmt.date', 'fmt.time', 'cur.default', 'tz'].map(row)), { icon: 'globe', link: open('CFG-003') ? ['CFG-003', L('Ubah', 'Change')] : null });
      var wf = card(L('Persetujuan & workflow', 'Approvals & workflow'), kv(['wf.makerChecker', 'wf.privRoles', 'wf.masterApproval', 'wf.reviewDays'].map(row)), { icon: 'usercheck' });
      var num = card(L('Penomoran', 'Numbering'), kv(['num.order', 'num.delivery', 'num.invoice', 'num.request', 'num.case', 'num.user', 'num.import'].map(row)), { icon: 'hash' });
      var th = card(L('Ambang batas', 'Thresholds'), kv(['th.inactiveDays', 'th.tempMaxDays', 'th.importMaxRows', 'th.notifFailWarn', 'th.storageWarnPct'].map(row)), { icon: 'gauge' });
      var sc = sec ? card(L('Kebijakan keamanan', 'Security policy'), kv([[L('Versi', 'Version'), 'v' + sec.v + ' · ' + dt(sec.eff)], [L('Password minimal', 'Minimum password'), sec.cur.minPassword + ' ' + t(L('karakter', 'characters'))], [L('Kunci setelah gagal', 'Lock after failures'), sec.cur.maxFailed + '× · ' + sec.cur.lockMinutes + ' ' + t(L('menit', 'min'))], [L('Timeout sesi', 'Session timeout'), sec.cur.idleMin + ' ' + t(L('menit', 'min'))],
        [L('Masking', 'Masking'), chips([sec.cur.maskPhone && L('Telepon', 'Phone'), sec.cur.maskEmail && L('Email', 'Email'), sec.cur.maskBank && L('Bank', 'Bank'), sec.cur.maskIp && L('IP', 'IP')].filter(Boolean), 'info', 'eyeoff')], [L('Penegakan izin', 'Permission enforcement'), A.chip('ok', L('Server-side (tetap)', 'Server-side (fixed)'), 'lock')]]), { icon: 'lock', link: open('SEC-005') ? ['SEC-005', L('Buka', 'Open')] : null }) : '';
      var own = card(L('Kepemilikan data (§64)', 'Data ownership (§64)'), '<ul class="sa11-kl">' + OWN64.map(function (o) { return '<li><span>' + t(o[0]) + '</span><b>' + t(o[1]) + '</b></li>'; }).join('') + '</ul>', { icon: 'briefcase' });
      return head + cfgTabs('SYS-005') + '<div class="g2-10">' + loc + wf + '</div><div class="g2-10">' + num + th + '</div><div class="g2-10">' + sc + own + '</div>';
    }
  };

  /* ================= SYS-006 Backup / Retention (§65) ================= */
  V['SYS-006'] = {
    render: function () {
      var ctx = cx(), bk = S.backups(ctx), rt = S.retention(ctx); if (!bk || !rt) return errState();
      var mng = can('sys11.retention.manage'), tone = bk.st === 'healthy' ? 'ok' : bk.st === 'warning' ? 'warn' : 'crit';
      var counts = [{ k: L('Backup terakhir', 'Last backup'), v: T(bk.label), icon: 'database', tone: tone }, { k: L('Jadwal', 'Schedule'), v: bk.schedule, icon: 'clock' }, { k: L('Ukuran', 'Size'), v: bk.last ? bk.last.size + ' MB' : '—', icon: 'layers' }, { k: L('Tidak pernah dihapus', 'Never deleted'), v: rt.never.length, icon: 'lock', tone: 'info' }];
      var failed = bk.list.filter(function (b) { return b.st !== 'success'; });
      if (isM()) return mobile(t(L('Status backup.', 'Backup status.')), counts.slice(0, 2), failed.map(function (b) { return A.rowLink({ href: '#', icon: 'database', tone: 'crit', t: esc(b.id), s: dt(b.at) + (b.note ? ' · ' + t(b.note) : ''), chip: A.chip('crit', L('Gagal', 'Failed')) }); }), L('Backup berjalan normal.', 'Backups run normally.'));
      var head = P.head(t(L('Backup harian 02:00 WITA, retensi per jenis data. Invoice, POD, jurnal, pembayaran, versi HPP & harga, audit log, service completion dan riwayat akses tidak pernah dihapus permanen (§65).', 'Daily backup at 02:00 WITA, retention per record type. Invoices, POD, journals, payments, HPP & price versions, audit log, service completion and access history are never hard-deleted (§65).')),
        mng ? A.btn('primary', L('Jalankan Backup', 'Run Backup'), 'database', { act: 'bkp', cls: isT() ? 'btn-xl' : '' }) : '', freshLive(L('job backup', 'backup job')));
      var list = card(L('Riwayat backup', 'Backup history'), P.table(bk.list.slice(0, 14), [
        { h: L('Backup', 'Backup'), v: function (b) { return '<b class="mono6">' + esc(b.id) + '</b>'; } },
        { h: L('Waktu', 'Time'), v: function (b) { return dt(b.at); } },
        { h: L('Jenis', 'Kind'), v: function (b) { return b.kind === 'manual' ? A.chip('info', L('Manual', 'Manual'), 'user') : A.chip('mute', L('Otomatis', 'Automatic'), 'clock'); } },
        { h: L('Status', 'Status'), v: function (b) { return b.st === 'success' ? A.chip('ok', L('Berhasil', 'Success'), 'checkc') : A.chip('crit', L('Gagal', 'Failed'), 'xc'); } },
        { h: L('Ukuran', 'Size'), cls: 'r num', v: function (b) { return b.size != null ? n0(b.size, 1) + ' MB' : '—'; } },
        { h: L('Durasi', 'Duration'), cls: 'r num', v: function (b) { return b.dur != null ? b.dur + ' ' + t(L('mnt', 'min')) : '—'; } },
        { h: L('Catatan', 'Note'), v: function (b) { return b.note ? t(b.note) : (b.by ? empN(b.by) : '—'); } }
      ]), { icon: 'database', count: bk.list.length });
      var ret = card(L('Kebijakan retensi', 'Retention policy'), P.table(rt.policies, [
        { h: L('Jenis data', 'Record type'), v: function (p) { return '<b>' + t(p.n) + '</b>'; } },
        { h: t(rt.statuses.active), cls: 'r num', v: function (p) { return p.active + ' ' + t(L('bln', 'mo')); } },
        { h: t(rt.statuses.archived), cls: 'r num', v: function (p) { return p.archive + ' ' + t(L('bln', 'mo')); } },
        { h: t(rt.statuses.historical), v: function (p) { return p.never ? A.chip('info', L('Disimpan selamanya', 'Kept forever'), 'lock') : p.hardDelete ? A.chip('warn', L('Boleh dihapus', 'May be deleted'), 'trash') : A.chip('mute', L('Historis', 'Historical'), 'history'); } },
        { h: L('Versi', 'Version'), cls: 'r num', v: function (p) { return 'v' + p.v; } },
        { h: '', cls: 'r', v: function (p) { return mng ? A.btn('ghost', L('Ubah', 'Change'), 'edit', { act: 'ret', val: p.k, cls: 'btn-sm' }) : ''; } }
      ]) + '<p class="sub5">' + t(L('Status data: Aktif → Diarsipkan → Historis. Contoh: invoice tanggal 2024-03-01 sekarang ', 'Record status: Active → Archived → Historical. Example: an invoice dated 2024-03-01 is now ')) + '<b>' + t(rt.statuses[S.recordStatus('invoice', '2024-03-01')] || L('—')) + '</b>.</p>', { icon: 'history' });
      var never = card(L('Tidak pernah dihapus permanen (§65)', 'Never hard-deleted (§65)'), chips(rt.policies.filter(function (p) { return p.never; }).map(function (p) { return p.n; }), 'info', 'lock'), { icon: 'lock' });
      return head + P8.bigCount(counts) + (failed.length ? note(t(L(failed.length + ' backup gagal dalam riwayat — cek catatan.', failed.length + ' failed backup(s) in the history — check the notes.')), 'alert', 'warn') : '') + list + '<div class="g21-10">' + ret + never + '</div>';
    },
    act: {
      bkp: function () {
        rdlg({ title: L('Jalankan backup manual', 'Run a manual backup'), icon: 'database', ok: L('Jalankan', 'Run'), optional: true, sub: t(L('Backup penuh semua modul. Tercatat di audit.', 'Full backup of every module. Recorded in the audit.')), fn: function (reason) { return S.runBackup(cx(), reason); }, done: function (r) { return L('Backup ' + r.backup.id + ' berhasil (' + r.backup.size + ' MB).', 'Backup ' + r.backup.id + ' succeeded (' + r.backup.size + ' MB).'); } });
      },
      ret: function (el) {
        var k = el.getAttribute('data-val'), p = S.retention(cx()).policies.filter(function (x) { return x.k === k; })[0]; if (!p) return;
        rdlg({ title: Lx(L('Retensi: ', 'Retention: '), T(p.n)), icon: 'history', sub: p.never ? t(L('Jenis ini wajib disimpan: tidak bisa dihapus permanen, aktif minimal 12 bulan.', 'This type is mandatory: never hard-deleted, active at least 12 months.')) : '',
          body: fg(fld(L('Aktif (bulan)', 'Active (months)'), inp('active', p.active, { type: 'number', num: true })) + fld(L('Arsip (bulan)', 'Archive (months)'), inp('archive', p.archive, { type: 'number', num: true }))) + (p.never ? '' : '<label class="ck5"><input type="checkbox" name="hd"' + (p.hardDelete ? ' checked' : '') + '><span>' + t(L('Boleh dihapus setelah masa historis', 'May be deleted after the historical period')) + '</span></label>'),
          fn: function (reason, v) { var patch = { active: Number(v.active), archive: Number(v.archive) }; if (!p.never) patch.hardDelete = !!v.hd; return S.setRetention(cx(), k, patch, reason); }, done: L('Retensi diperbarui.', 'Retention updated.') });
      }
    }
  };

  /* ================= Phase 2 SYS-* routes → Phase 11 screens (S1 owns all six aliases) ================= */
  Object.keys(S.ALIAS).forEach(function (old) {
    var to = S.ALIAS[old];
    V[old] = { render: function (c) { setTimeout(function () { if (location.hash.indexOf('/' + old) >= 0) location.replace(href(to, c.rec, c.q)); }, 0); return A.stateCard('empty', L('Layar ini sudah digabung ke modul Sistem & Governance Fase 11.', 'This screen is now part of the Phase 11 System & Governance module.'), A.btn('blue', L('Buka', 'Open'), 'arrow', { go: to, rec: c.rec }), L('Membuka layar baru…', 'Opening the new screen…')); } };
  });
})();
