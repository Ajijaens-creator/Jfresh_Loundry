/* ==========================================================================
   JFRESH OS — System Administration & Governance engine (Phase 11 · NP 1.0)
   NP-07 internal users, roles, permission matrix, access scope and access
   review (maker-checker for privileged roles) · NP-08 master data with
   versions and effective dates, system configuration · NP-09 notification
   event catalog, templates, channels, communication log · NP-10 unified
   audit trail, security settings, governance and security alerts · NP-11
   integrations, APIs, import (validate → preview → confirm), export,
   system health · NP-12 Super Admin control center, backup and retention.

   This engine is the "server" of the static prototype: every permission and
   every rule is checked here, never only in the UI (§47). Users, roles and
   permissions are the Phase 4 access layer (JFACCESS): changes go through
   X.admin.* so login and every open session obey them. Clients, properties,
   services, items, machines, vehicles, cost centres, COA and suppliers stay
   owned by their Phase 6–10 engines and are shown read-through (§64).
   Super Admin and System Admin never receive business approval rights
   (§63). Audit history has no delete function at all. Prototype only: a
   production backend must repeat these rules on the server.
   ========================================================================== */
(function (root) {
  function req(p) { try { return typeof require !== 'undefined' ? require(p) : null; } catch (e) { return null; } }
  var D = root.JFSYS_DATA || req('./jfos-sys-data.js');
  function L(a, b) { return [a, b === undefined ? a : b]; }
  var M = { version: 'NP 1.0', D: D, C: null, X: null, P: null, CM: null, LG: null, PR: null, DL: null, FN: null, CLP: null };
  var DAY = 864e5, MIN = 6e4;
  function clone(o) { return o == null ? o : JSON.parse(JSON.stringify(o)); }
  function by(arr, k, v) { for (var i = 0; i < (arr || []).length; i++) if (arr[i][k] === v) return arr[i]; return null; }
  function T(x) { return Array.isArray(x) ? x[0] : (x == null ? '' : String(x)); }
  function Ln(x) { return Array.isArray(x) ? x : L(String(x == null ? '' : x)); }
  function str(x) { return String(x == null ? '' : x).trim(); }
  function ms(s) { if (typeof s === 'number') return s; if (!s) return 0; var p = String(s).split(/[-: T]/); return Date.UTC(+p[0], +p[1] - 1, +(p[2] || 1), +(p[3] || 0), +(p[4] || 0), +(p[5] || 0)); }
  function iso(t) { return new Date(t).toISOString().slice(0, 10); }
  function isoT(t) { return new Date(t).toISOString().slice(0, 16).replace('T', ' '); }
  function addDays(d, n) { return iso(ms(d) + n * DAY); }
  function dayDiff(a, b) { return Math.round((ms(String(b).slice(0, 10)) - ms(String(a).slice(0, 10))) / DAY); }
  function pct(a, b) { return b ? Math.round(a / b * 1000) / 10 : null; }
  function uniq(a) { return a.filter(function (x, i) { return x != null && a.indexOf(x) === i; }); }
  function isDate(s) { return /^\d{4}-\d{2}-\d{2}$/.test(String(s || '')) && !isNaN(ms(s)); }
  function hash(s) { s = String(s); var h = 2166136261; for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  function tryf(fn, dflt) { try { var v = fn(); return v == null ? dflt : v; } catch (e) { return dflt; } }
  M.u = { L: L, T: T, ms: ms, iso: iso, isoT: isoT, addDays: addDays, dayDiff: dayDiff, pct: pct, clone: clone };

  M.MSG = {
    noperm: L('Anda tidak memiliki izin untuk tindakan ini.', 'You do not have permission for this action.'),
    notfound: L('Data tidak ditemukan.', 'Record not found.'),
    invalid: L('Periksa data dan coba lagi.', 'Check the data and try again.'),
    reason: L('Alasan wajib diisi.', 'A reason is required.'),
    jump: L('Langkah ini belum bisa dilakukan. Ikuti urutan proses.', 'This step is not possible yet. Follow the process order.'),
    dup: L('Data sudah ada.', 'This record already exists.'),
    scope: L('Data ini dikelola modul lain atau di luar cakupan Anda.', 'This record is owned by another module or outside your scope.'),
    maker: L('Pembuat permintaan tidak boleh menyetujui permintaannya sendiri.', 'The requester cannot approve their own request.'),
    self: L('Anda tidak bisa mengubah status atau peran akun Anda sendiri.', 'You cannot change the status or role of your own account.'),
    sod: L('Super Admin / System Admin tidak boleh memiliki hak persetujuan bisnis (§63).', 'Super Admin / System Admin cannot hold business approval rights (§63).'),
    wildcard: L('Hak akses wildcard tidak diizinkan. Pilih izin satu per satu.', 'Wildcard permissions are not allowed. Pick permissions one by one.'),
    inuse: L('Data sudah dipakai transaksi: hanya bisa dinonaktifkan, tidak bisa dihapus.', 'This record is used by transactions: it can only be deactivated, never deleted.'),
    privacy: L('Template untuk klien tidak boleh memuat data internal, keuangan sensitif atau data klien lain.', 'A client template cannot contain internal, sensitive finance or other-client data.'),
    integ: L('Integration sedang bermasalah.', 'The integration is having a problem.'),
    importErr: L('Import memiliki data error.', 'The import has rows with errors.'),
    load: L('Data belum berhasil dimuat.', 'The data could not be loaded.')
  };

  /* ---------- Permissions (§30–§33): role decides the workspace, permission decides the action ---------- */
  M.PERMS = {
    'sys11.users.view': L('Lihat user internal', 'View internal users'), 'sys11.users.manage': L('Tambah, ubah, tangguhkan & nonaktifkan user', 'Add, edit, suspend & deactivate users'),
    'sys11.roles.view': L('Lihat role & matriks izin', 'View roles & the permission matrix'), 'sys11.roles.manage': L('Buat & ubah role (berversi)', 'Create & edit roles (versioned)'),
    'sys11.perm.manage': L('Ubah izin & cakupan akses', 'Change permissions & access scope'), 'sys11.access.review': L('Jalankan review akses', 'Run access reviews'),
    'sys11.priv.approve': L('Setujui pemberian role privileged (maker-checker)', 'Approve privileged role grants (maker-checker)'),
    'sys11.master.view': L('Lihat master data', 'View master data'), 'sys11.master.manage': L('Kelola master data sistem', 'Manage system master data'), 'sys11.master.approve': L('Setujui perubahan master data terkontrol', 'Approve controlled master data changes'),
    'sys11.config.view': L('Lihat konfigurasi sistem', 'View system configuration'), 'sys11.config.manage': L('Ubah konfigurasi sistem', 'Change system configuration'),
    'sys11.notif.view': L('Lihat template & log komunikasi', 'View templates & communication log'), 'sys11.notif.manage': L('Kelola template, channel & kirim ulang', 'Manage templates, channels & retries'),
    'sys11.audit.view': L('Lihat audit trail terpadu', 'View the unified audit trail'), 'sys11.security.view': L('Lihat governance & security alert', 'View governance & security alerts'),
    'sys11.security.manage': L('Ubah pengaturan keamanan & tangani alert', 'Change security settings & handle alerts'),
    'sys11.integration.view': L('Lihat integrasi & API', 'View integrations & APIs'), 'sys11.integration.manage': L('Tes, retry & nonaktifkan integrasi', 'Test, retry & disable integrations'),
    'sys11.import': L('Import data (validasi dulu)', 'Import data (validated first)'), 'sys11.export': L('Export data sesuai izin modul', 'Export data per module permission'),
    'sys11.health.view': L('Lihat kesehatan sistem & KPI', 'View system health & KPIs'), 'sys11.backup.view': L('Lihat backup & retensi', 'View backups & retention'),
    'sys11.retention.manage': L('Jalankan backup & ubah retensi', 'Run backups & change retention'), 'sys11.super.view': L('System Control Center (Super Admin)', 'System Control Center (Super Admin)')
  };
  var LEGACY = ['sys.users', 'sys.roles', 'sys.audit', 'sys.settings', 'sys.master'];
  var ALL11 = Object.keys(M.PERMS);
  M.ROLE_PERMS = {
    superadmin: ALL11.concat(LEGACY).concat(['perf.self']),
    sysadmin: ALL11.filter(function (p) { return ['sys11.priv.approve', 'sys11.master.approve', 'sys11.retention.manage', 'sys11.super.view'].indexOf(p) < 0; }).concat(LEGACY).concat(['perf.self']),
    owner: ['sys11.users.view', 'sys11.roles.view', 'sys11.access.review', 'sys11.priv.approve', 'sys11.master.view', 'sys11.master.approve', 'sys11.config.view', 'sys11.notif.view', 'sys11.audit.view',
      'sys11.security.view', 'sys11.integration.view', 'sys11.health.view', 'sys11.backup.view', 'sys11.super.view', 'sys11.export'],
    hr: ['sys11.users.view']
  };
  M.ADMIN_ROLES = ['superadmin', 'sysadmin'];
  function can(ctx, p) { return !p || !!(ctx && ctx.perms && ctx.perms.indexOf(p) >= 0); }
  M.can = can;
  function empId(ctx) { return ctx && (ctx.employee ? ctx.employee.id : ctx.emp || ctx.uid) || 'system'; }
  function ctxName(ctx) { return ctx && (ctx.fullName || ctx.name) || 'Sistem JFRESH'; }
  M.empId = empId;

  /* ---------- State ---------- */
  var KEY = 'jfos-sys-v1', mem = {}, st = null, SIM = ms(D.simNow), T0 = Date.now(), fixed = null, ver = 0;
  var ls = null;
  try { ls = root.localStorage || null; if (ls) { ls.setItem('__jfs', '1'); ls.removeItem('__jfs'); } } catch (e) { ls = null; }
  function clock() { if (fixed) return fixed(); if (M.LG && M.LG.now) return M.LG.now(); return SIM + (Date.now() - T0); }
  function S() {
    if (st) return st;
    try { var raw = ls ? ls.getItem(KEY) : mem[KEY]; if (raw) { var o = JSON.parse(raw); if (o && o.v === 1) { st = o; return st; } } } catch (e) {}
    seed(); save(); return st;
  }
  function save() { if (!st) return; ver++; st.upd = clock(); try { var s = JSON.stringify(st); if (ls) ls.setItem(KEY, s); else mem[KEY] = s; } catch (e) {} }
  M._setClock = function (fn) { fixed = fn; };
  M.now = function () { return clock(); };
  M.today = function () { return iso(M.now()); };
  function nowS() { return isoT(M.now()); }
  M.nowS = nowS;
  M.state = function () { return S(); };
  M.save = save;
  M.ver = function () { return ver; };
  function nid(k, pre, pad) { var s = S(); var n = s.seq[k]++; return pre + (pad ? String(n).padStart(pad, '0') : n); }
  function ym() { return M.today().slice(2, 4) + M.today().slice(5, 7); }

  function verRec(v, eff, reason, by, at, data, extra) { return Object.assign({ v: v, eff: eff, reason: reason, by: by, at: at, appr: null, st: 'active', data: data }, extra || {}); }
  function seed() {
    st = { v: 1, upd: null, seq: { usr: 123, emp: 123, arq: 2, arv: 2, imp: 1, xpt: 1, cr: 1, bkp: 1, ob: 11, tpl: 13, aud: 1, il: 1 },
      audit: [], meta: {}, added: [], reqs: clone(D.REQUESTS), roleVer: {}, roleMeta: {}, custom: {}, rolePerms: {}, scopes: {}, camps: clone(D.CAMPAIGNS),
      master: {}, cfg: {}, tpl: [], chan: { app: true, email: true, wa: true, push: true, sms: false }, comm: {}, out: [], sec: [], alerts: clone(D.ALERTS), alertSt: {},
      integ: clone(D.INTEGRATIONS), intLog: [], imports: [], staged: {}, exports: [], backups: clone(D.BACKUPS), retention: {}, reads: {} };
    D.USER_META.forEach(function (r) { st.meta[r[0]] = { phone: r[1], dept: r[2], pos: r[3], branch: r[4], joined: r[5], start: r[6], end: r[7], last: r[8], dev: r[9] }; });
    Object.keys(D.MASTER).forEach(function (cat) {
      st.master[cat] = D.MASTER[cat].map(function (x) {
        var base = Object.assign({ n: x.n }, x.d || {});
        var vers = x.ver ? x.ver.map(function (v) { return verRec(v[0], v[1], L(v[2], v[3]), v[4], v[1] + ' 09:00', Object.assign({ n: x.n }, v[5])); })
          : [verRec(1, '2026-01-01', L('Data awal migrasi Fase 11', 'Phase 11 migration baseline'), 'EMP-120', '2026-01-01 09:00', base)];
        return { id: x.code, code: x.code, cat: cat, st: x.st || 'active', vers: vers };
      });
    });
    Object.keys(D.CONFIG).forEach(function (k) { st.cfg[k] = [{ v: 1, eff: '2026-01-01', val: D.CONFIG[k], by: 'EMP-120', at: '2026-01-01 09:00', reason: L('Konfigurasi awal', 'Initial configuration') }]; });
    st.tpl = D.TEMPLATES.map(function (t) {
      var lang = { id: { subj: t[4], body: t[5] }, en: { subj: t[6], body: t[7] } };
      return { id: t[0], ev: t[1], aud: t[2], ch: t[3].slice(), active: true, v: 1, lang: lang, vers: [{ v: 1, at: '2026-01-05 09:00', by: 'EMP-120', reason: L('Template awal', 'Initial template'), lang: clone(lang), ch: t[3].slice() }] };
    });
    st.sec = [{ v: 1, eff: '2026-01-01', by: 'EMP-120', at: '2026-01-01 09:00', reason: L('Kebijakan awal Fase 4', 'Phase 4 initial policy'),
      data: { minPassword: 8, maxFailed: 5, lockMinutes: 15, idleMin: 30, rememberH: 8, resetMin: 30, maskPhone: true, maskEmail: false, maskBank: true, maskIp: true, expiryDays: 90, suspendDays: 60, enforce: 'server' } }];
    D.RETENTION.forEach(function (r) { st.retention[r[0]] = { k: r[0], n: L(r[1], r[2]), active: r[3], archive: r[4], never: r[5], hardDelete: false, v: 1 }; });
    st.out = D.OUTBOX.map(function (o) { return { id: o[0], at: o[1], ev: o[2], ch: o[3], cl: o[4], to: o[5], rec: o[6], st: o[7], err: o[8], tries: 1 }; });
    return st;
  }

  /* ---------- Audit (§43–§45, §77): SYS's own trail; read-only for everyone ---------- */
  M.AUDIT = {
    'USER.CREATE': L('User dibuat', 'User created'), 'USER.EDIT': L('User diubah', 'User edited'), 'USER.ACTIVATE': L('User diaktifkan', 'User activated'), 'USER.SUSPEND': L('User ditangguhkan', 'User suspended'),
    'USER.DEACTIVATE': L('User dinonaktifkan', 'User deactivated'), 'USER.UNLOCK': L('User dibuka kuncinya', 'User unlocked'), 'USER.LOGOUT': L('Logout paksa', 'Forced logout'), 'USER.ACCESS': L('Masa akses diubah', 'Access window changed'),
    'USER.PLANT': L('Akses plant diubah', 'Plant access changed'), 'ROLE.ASSIGN': L('Role user diubah', 'User role changed'), 'ROLE.REQUEST': L('Permintaan role privileged', 'Privileged role requested'),
    'ROLE.APPROVE': L('Role privileged disetujui', 'Privileged role approved'), 'ROLE.REJECT': L('Role privileged ditolak', 'Privileged role rejected'), 'ROLE.CREATE': L('Role dibuat', 'Role created'), 'ROLE.EDIT': L('Role diubah', 'Role edited'),
    'PERM.CHANGE': L('Izin role diubah', 'Role permission changed'), 'PERM.USER': L('Izin user diubah', 'User permission changed'), 'SCOPE.CHANGE': L('Cakupan akses diubah', 'Access scope changed'),
    'REVIEW.START': L('Review akses dimulai', 'Access review started'), 'REVIEW.DECIDE': L('Keputusan review akses', 'Access review decision'), 'REVIEW.COMPLETE': L('Review akses selesai', 'Access review completed'),
    'MASTER.CREATE': L('Master data dibuat', 'Master data created'), 'MASTER.CHANGE': L('Master data diubah', 'Master data changed'), 'MASTER.APPROVE': L('Perubahan master disetujui', 'Master change approved'),
    'MASTER.STATUS': L('Status master diubah', 'Master status changed'), 'MASTER.DELETE': L('Master data dihapus', 'Master data deleted'), 'CONFIG.CHANGE': L('Konfigurasi diubah', 'Configuration changed'),
    'TEMPLATE.SAVE': L('Template disimpan', 'Template saved'), 'TEMPLATE.STATUS': L('Status template diubah', 'Template status changed'), 'CHANNEL.CHANGE': L('Channel diubah', 'Channel changed'),
    'NOTIF.RETRY': L('Notifikasi dikirim ulang', 'Notification retried'), 'NOTIF.TEST': L('Notifikasi uji dikirim', 'Test notification sent'), 'SECURITY.CHANGE': L('Pengaturan keamanan diubah', 'Security settings changed'),
    'ALERT.ACK': L('Alert diakui', 'Alert acknowledged'), 'ALERT.RESOLVE': L('Alert diselesaikan', 'Alert resolved'), 'INTEGRATION.TEST': L('Tes koneksi integrasi', 'Integration connection test'),
    'INTEGRATION.RETRY': L('Retry sinkron integrasi', 'Integration sync retry'), 'INTEGRATION.STATUS': L('Integrasi diaktifkan/dinonaktifkan', 'Integration enabled/disabled'), 'IMPORT.VALIDATE': L('Import divalidasi', 'Import validated'),
    'IMPORT.CONFIRM': L('Import dikonfirmasi', 'Import confirmed'), 'IMPORT.CANCEL': L('Import dibatalkan', 'Import cancelled'), 'EXPORT': L('Data diexport', 'Data exported'), 'BACKUP.RUN': L('Backup manual', 'Manual backup'),
    'RETENTION.CHANGE': L('Retensi diubah', 'Retention changed'), 'ACCESS.DENIED': L('Akses ditolak', 'Access denied')
  };
  function device() { var ua = root.navigator && root.navigator.userAgent || 'node'; return /iPad|Tablet/i.test(ua) ? 'Tablet' : /Mobi|Android|iPhone/i.test(ua) ? 'Mobile' : (ua === 'node' ? 'Test' : 'Desktop'); }
  function J(x) { return x == null ? null : typeof x === 'string' ? x : JSON.stringify(x); }
  M.audit = function (ev, ctx, o) {
    o = o || {};
    var e = { id: 'SAU-' + String(S().seq.aud++).padStart(5, '0'), at: nowS(), ev: ev, uid: ctx && ctx.uid || null, emp: empId(ctx), actor: ctxName(ctx), role: ctx && ctx.roleKey || null, module: o.module || 'system',
      rec: o.rec || null, before: J(o.before), after: J(o.after), reason: o.reason == null ? null : T(o.reason), result: o.result || 'ok', device: device() };
    S().audit.unshift(e); if (S().audit.length > 2000) S().audit.length = 2000; save();
    return e;
  };
  function deny(ctx, perm, rec) { M.audit('ACCESS.DENIED', ctx, { rec: rec || perm, after: perm, result: 'denied' }); return { ok: false, code: 'noperm', msg: M.MSG.noperm }; }
  function bad(code, msg, x) { return Object.assign({ ok: false, code: code || 'invalid', msg: msg || M.MSG[code] || M.MSG.invalid }, x || {}); }
  M.deny = deny; M.bad = bad;
  function needReason(r) { return str(T(r)) ? null : bad('reason'); }

  /* ---------- Users (§31) ---------- */
  M.STATUS = { invited: [L('Diundang', 'Invited'), 'info'], active: [L('Aktif', 'Active'), 'ok'], suspended: [L('Ditangguhkan', 'Suspended'), 'warn'], locked: [L('Terkunci', 'Locked'), 'crit'], inactive: [L('Nonaktif', 'Inactive'), 'mute'] };
  function X() { return M.X; }
  function privRoles() { return String(M.cfgGet('wf.privRoles') || '').split(',').map(str).filter(Boolean); }
  M.privRoles = privRoles;
  function isPrivRole(k) { var c = S().custom[k]; return privRoles().indexOf(k) >= 0 || !!(c && c.priv); }
  M.isPrivRole = isPrivRole;
  function isAdminRole(k) { var c = S().custom[k]; return M.ADMIN_ROLES.indexOf(k) >= 0 || !!(c && M.ADMIN_ROLES.indexOf(c.from) >= 0); }
  function internalUsers() { return X() ? X().USERS.filter(function (u) { return !u.client; }) : []; }
  function meta(uid) { var s = S(); return s.meta[uid] || (s.meta[uid] = { phone: null, dept: null, pos: null, branch: null, joined: null, start: null, end: null, last: null, dev: null }); }
  function acctStatus(u) {
    var a = X().account(u.id); if (!a) return 'inactive';
    if (a.status === 'locked' && a.lockUntil && a.lockUntil <= X().now()) return 'active';
    return M.STATUS[a.status] ? a.status : 'inactive';
  }
  // Last login: the access audit trail (live) or the migrated value; X runs on wall-clock time, mapped onto the sim clock.
  function lastLogin(uid) {
    var x = X(), best = null;
    if (x) { var r = x.auditLog().filter(function (e) { return e.ev === 'AUTH.LOGIN_OK' && e.uid === uid; })[0]; if (r) best = { at: isoT(M.now() - Math.max(0, x.now() - r.at)), dev: r.device || null }; }
    var m = S().meta[uid];
    if (!best && m && m.last) best = { at: m.last, dev: m.dev };
    return best;
  }
  M.lastLogin = lastLogin;
  function masterName(cat, code) { var r = code && by(S().master[cat] || [], 'code', code); return r ? cur(r).data.n : (code ? L(code) : L('—')); }
  function initials(n) { return String(n || '?').split(/\s+/).filter(Boolean).slice(0, 2).map(function (w) { return w[0].toUpperCase(); }).join(''); }
  M.maskPhone = function (p) { if (!p) return null; var d = String(p); return d.slice(0, 8) + ' •••• ' + d.slice(-4); };
  M.maskEmail = function (e) { if (!e) return null; var p = String(e).split('@'); return p[0].slice(0, 1) + '•••@' + (p[1] || ''); };
  function secCur() { var s = S().sec; return s[s.length - 1].data; }
  function windowOf(uid) {
    var m = S().meta[uid], t = M.today();
    if (!m) return { code: null };
    if (m.end && m.end < t) return { code: 'expired_access', end: m.end };
    if (m.start && m.start > t) return { code: 'not_started', start: m.start };
    return { code: null, temp: !!m.end, end: m.end || null, daysLeft: m.end ? dayDiff(t, m.end) : null };
  }
  M.accessWindow = windowOf;
  function rowOf(u, ctx) {
    var x = X(), a = x.account(u.id), m = meta(u.id), e = u.emp ? x.employee(u.emp) : null, ll = lastLogin(u.id), w = windowOf(u.id), status = acctStatus(u);
    var full = x.fullName(u), roles = (a.roles || []).map(function (r) { return r.k; }), mng = can(ctx, 'sys11.users.manage'), sec = secCur();
    return { id: u.id, u: u.u, email: (sec.maskEmail && !mng) ? M.maskEmail(u.email) : u.email, name: full, short: x.displayName(u), initials: initials(full), emp: u.emp || null, empN: e ? e.n : null,
      client: u.client || null, dept: m.dept, deptN: m.dept ? masterName('department', m.dept) : (e ? e.dept : L('—')), pos: m.pos, posN: masterName('position', m.pos), phone: (sec.maskPhone && !mng) ? M.maskPhone(m.phone) : m.phone,
      branch: m.branch, branchN: masterName('branch', m.branch), plants: (a.plants || []).slice(), roles: roles, defRole: ((a.roles || []).filter(function (r) { return r.def; })[0] || (a.roles || [])[0] || {}).k || null,
      roleNames: roles.map(function (k) { return x.ROLES[k] ? x.ROLES[k].n : L(k); }), status: status, stN: M.STATUS[status][0], tone: M.STATUS[status][1],
      lastLogin: ll ? ll.at : null, lastDevice: ll ? ll.dev : null, joined: m.joined, start: m.start, end: m.end, temp: !!m.end, expired: w.code === 'expired_access', daysLeft: w.daysLeft == null ? null : w.daysLeft,
      privileged: roles.some(isPrivRole), admin: roles.some(isAdminRole), grant: (a.grant || []).slice(), deny: (a.deny || []).slice(), lang: a.lang, activatedAt: m.activatedAt || null, invitedAt: m.invitedAt || null,
      pending: S().reqs.filter(function (r) { return r.uid === u.id && r.st === 'pending'; }).map(function (r) { return r.id; }) };
  }
  M.users = function (ctx, f) {
    if (!can(ctx, 'sys11.users.view')) return [];
    f = f || {}; var q = str(f.q).toLowerCase();
    return (f.client ? X().USERS : internalUsers()).map(function (u) { return rowOf(u, ctx); }).filter(function (r) {
      return (!q || [r.name, r.u, r.email, T(r.posN), r.id].join(' ').toLowerCase().indexOf(q) >= 0) && (!f.dept || r.dept === f.dept) && (!f.status || r.status === f.status) &&
        (!f.branch || r.branch === f.branch) && (!f.role || r.roles.indexOf(f.role) >= 0) && (f.privileged == null || r.privileged === !!f.privileged) && (f.temp == null || r.temp === !!f.temp);
    }).sort(function (a, b) { return a.name < b.name ? -1 : 1; });
  };
  M.userSummary = function (ctx) {
    if (!can(ctx, 'sys11.users.view')) return null;
    var rows = M.users(ctx), mth = M.today().slice(0, 7), n = function (s) { return rows.filter(function (r) { return r.status === s; }).length; };
    var r = { total: rows.length, active: n('active'), invited: n('invited'), suspended: n('suspended'), locked: n('locked'), inactive: n('inactive'), newMonth: rows.filter(function (x) { return x.joined && x.joined.slice(0, 7) === mth; }).length,
      privileged: rows.filter(function (x) { return x.privileged; }).length, temp: rows.filter(function (x) { return x.temp; }).length, expired: rows.filter(function (x) { return x.expired; }).length };
    r.notActive = r.inactive + r.suspended; r.pctActive = pct(r.active, r.total); r.pctNotActive = pct(r.notActive, r.total); r.pctLocked = pct(r.locked, r.total);
    return r;
  };
  function effPerms(uid) {
    var x = X(), a = x.account(uid); if (!a) return [];
    var def = (a.roles.filter(function (r) { return r.def; })[0] || a.roles[0] || {}).k;
    return uniq((def ? x.rolePerms(def) : []).concat(a.grant || [])).filter(function (p) { return (a.deny || []).indexOf(p) < 0; });
  }
  M.effPerms = effPerms;
  M.user = function (ctx, uid) {
    if (!can(ctx, 'sys11.users.view')) return null;
    var u = X().user(uid); if (!u) return null;
    var r = rowOf(u, ctx), perms = effPerms(uid);
    r.perms = perms; r.permCount = perms.length;
    r.byModule = M.MODULES.map(function (md) { var ps = perms.filter(function (p) { return M.permModule(p) === md.k; }); return { k: md.k, n: md.n, n2: ps.length, actions: M.ACTIONS.filter(function (ac) { return ps.some(function (p) { return M.permAction(p) === ac[0]; }); }).map(function (ac) { return ac[0]; }) }; }).filter(function (x2) { return x2.n2; });
    r.scope = r.defRole ? M.MODULES.map(function (md) { return { k: md.k, scope: M.userScope(uid, md.k) }; }) : [];
    r.window = windowOf(uid);
    r.activity = can(ctx, 'sys11.audit.view') ? M.auditAll(ctx, { uid: uid, limit: 20 }) : [];
    r.requests = S().reqs.filter(function (q) { return q.uid === uid; });
    return r;
  };
  function findByLogin(id) { var k = str(id).toLowerCase(); return X().USERS.filter(function (u) { return u.u === k || u.email.toLowerCase() === k; })[0]; }
  function validRoles(keys) { return Array.isArray(keys) && keys.every(function (k) { return X().ROLES[k] && X().ROLES[k].group !== 'client'; }); }
  function validPlants(pl) { return Array.isArray(pl) && pl.length > 0 && pl.every(function (p) { return p === X().ALL || X().plant(p); }); }
  function activeMaster(cat, code) { var r = by(S().master[cat] || [], 'code', code); return r && r.st === 'active'; }
  function plantOfBranch(b) { var r = by(S().master.branch || [], 'code', b); return r && cur(r).data.plant || null; }
  function targetGuard(ctx, uid) {
    if (ctx && ctx.uid === uid) return bad('invalid', M.MSG.self);
    var a = X().account(uid); if (!a) return bad('notfound');
    if (a.roles.some(function (r) { return r.k === 'superadmin'; }) && !can(ctx, 'sys11.priv.approve')) return deny(ctx, 'sys11.priv.approve', uid);
    return null;
  }
  // Add user (§29/§31): invited → active on first login. Privileged roles wait for a second admin (maker-checker).
  M.addUser = function (ctx, f, reason) {
    if (!can(ctx, 'sys11.users.manage')) return deny(ctx, 'sys11.users.manage', 'USER.CREATE');
    f = f || {}; var r0 = needReason(reason); if (r0) return r0;
    var x = X(), name = str(f.name), login = str(f.u).toLowerCase(), email = str(f.email).toLowerCase(), roles = (f.roles || []).slice(), errs = {};
    if (name.length < 3) errs.name = L('Nama minimal 3 huruf.', 'Name needs at least 3 letters.');
    if (!/^[a-z0-9._-]{3,30}$/.test(login)) errs.u = L('Username 3–30 huruf kecil, angka, titik, - atau _.', 'Username: 3–30 lowercase letters, digits, dot, - or _.');
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) errs.email = L('Format email belum benar.', 'The email format is not valid.');
    if (!roles.length || !validRoles(roles)) errs.roles = L('Pilih minimal satu role internal yang valid.', 'Pick at least one valid internal role.');
    if (f.dept && !activeMaster('department', f.dept)) errs.dept = L('Departemen tidak aktif / tidak dikenal.', 'Unknown or inactive department.');
    if (f.pos && !activeMaster('position', f.pos)) errs.pos = L('Posisi tidak aktif / tidak dikenal.', 'Unknown or inactive position.');
    if (f.branch && !activeMaster('branch', f.branch)) errs.branch = L('Branch tidak aktif / tidak dikenal.', 'Unknown or inactive branch.');
    var plants = f.plants && f.plants.length ? f.plants.slice() : [plantOfBranch(f.branch) || x.ALL];
    if (!validPlants(plants)) errs.plants = L('Plant tidak dikenal.', 'Unknown plant.');
    var start = f.start || M.today();
    if (!isDate(start) || (f.end && (!isDate(f.end) || f.end < start))) errs.end = L('Tanggal akses tidak valid (akhir ≥ mulai).', 'Invalid access dates (end ≥ start).');
    if (f.emp && (!x.employee(f.emp) || x.USERS.some(function (u) { return u.emp === f.emp; }))) errs.emp = L('Karyawan tidak ada atau sudah punya akun.', 'Employee not found or already has an account.');
    if (Object.keys(errs).length) return bad('invalid', null, { errs: errs });
    if (x.USERS.some(function (u) { return u.u === login || u.email.toLowerCase() === email; })) return bad('dup', L('Username atau email sudah dipakai.', 'Username or email is already in use.'));
    var s = S(), empRec = null, empKey = f.emp;
    if (!empKey) { empKey = 'EMP-' + s.seq.emp++; empRec = { id: empKey, n: name, short: name.split(/\s+/)[0], dept: f.dept ? masterName('department', f.dept) : L('—'), status: 'active' }; x.EMPLOYEES.push(empRec); }
    var plain = roles.filter(function (k) { return !isPrivRole(k); }), priv = roles.filter(isPrivRole);
    var uid = 'USR-' + s.seq.usr++;
    var user = { id: uid, u: login, email: email, emp: empKey, status: 'invited', roles: plain.map(function (k, i) { return { k: k, def: i === 0 }; }), plants: plants, lang: f.lang === 'en' ? 'en' : 'id' };
    x.USERS.push(user); s.added.push({ user: clone(user), emp: empRec ? clone(empRec) : null });
    s.meta[uid] = { phone: str(f.phone) || null, dept: f.dept || null, pos: f.pos || null, branch: f.branch || null, joined: M.today(), start: start, end: f.end || null, last: null, dev: null, invitedAt: nowS() };
    M.audit('USER.CREATE', ctx, { module: 'users', rec: uid, after: { u: login, email: email, roles: plain, plants: plants, start: start, end: f.end || null, status: 'invited' }, reason: reason });
    var pend = priv.length ? makeRequest(ctx, uid, priv, roles, reason) : null;
    save();
    return { ok: true, user: rowOf(user, ctx), pending: pend };
  };
  M.editUser = function (ctx, uid, f, reason) {
    if (!can(ctx, 'sys11.users.manage')) return deny(ctx, 'sys11.users.manage', uid);
    var x = X(), u = x.user(uid); if (!u || u.client) return bad('notfound');
    var r0 = needReason(reason); if (r0) return r0;
    f = f || {}; var m = meta(uid), before = {}, after = {}, errs = {};
    if (f.email != null) { var em = str(f.email).toLowerCase(); if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(em)) errs.email = L('Format email belum benar.', 'The email format is not valid.'); else if (x.USERS.some(function (o) { return o.id !== uid && o.email.toLowerCase() === em; })) return bad('dup'); }
    ['dept', 'pos', 'branch'].forEach(function (k) { var cat = { dept: 'department', pos: 'position', branch: 'branch' }[k]; if (f[k] != null && !activeMaster(cat, f[k])) errs[k] = L('Tidak aktif / tidak dikenal.', 'Unknown or inactive.'); });
    if (f.name != null && str(f.name).length < 3) errs.name = L('Nama minimal 3 huruf.', 'Name needs at least 3 letters.');
    if (Object.keys(errs).length) return bad('invalid', null, { errs: errs });
    ['phone', 'dept', 'pos', 'branch'].forEach(function (k) { if (f[k] != null && f[k] !== m[k]) { before[k] = m[k]; after[k] = f[k]; m[k] = f[k]; } });
    if (f.email != null && str(f.email).toLowerCase() !== u.email) { before.email = u.email; u.email = after.email = str(f.email).toLowerCase(); m.ov = Object.assign(m.ov || {}, { email: u.email }); }
    if (f.name != null && str(f.name) !== x.fullName(u)) { before.name = x.fullName(u); u.name = after.name = str(f.name); m.ov = Object.assign(m.ov || {}, { name: u.name }); }
    if (f.lang && f.lang !== x.account(uid).lang) { before.lang = x.account(uid).lang; x.account(uid).lang = after.lang = f.lang === 'en' ? 'en' : 'id'; x.admin.setPlants(uid, x.account(uid).plants.slice(), ctxName(ctx)); }
    if (!Object.keys(after).length) return bad('invalid', L('Tidak ada perubahan.', 'Nothing changed.'));
    M.audit('USER.EDIT', ctx, { module: 'users', rec: uid, before: before, after: after, reason: reason }); save();
    return { ok: true, user: rowOf(u, ctx) };
  };
  function setStatusX(ctx, uid, to, ev, reason, from) {
    var x = X(); x.admin.setStatus(uid, to, ctxName(ctx));
    if (to !== 'active') x.admin.forceLogout(uid, ctxName(ctx));
    M.audit(ev, ctx, { module: 'users', rec: uid, before: { status: from }, after: { status: to }, reason: reason }); save();
    return { ok: true, user: rowOf(x.user(uid), ctx) };
  }
  function statusAct(to, ev, allowed) {
    return function (ctx, uid, reason) {
      if (!can(ctx, 'sys11.users.manage')) return deny(ctx, 'sys11.users.manage', uid);
      var u = X().user(uid); if (!u || u.client) return bad('notfound');
      var g = targetGuard(ctx, uid); if (g) return g;
      var r0 = needReason(reason); if (r0) return r0;
      var from = acctStatus(u); if (allowed.indexOf(from) < 0) return bad('jump');
      return setStatusX(ctx, uid, to, ev, reason, from);
    };
  }
  M.suspend = statusAct('suspended', 'USER.SUSPEND', ['active', 'locked', 'invited']);
  M.deactivate = statusAct('inactive', 'USER.DEACTIVATE', ['active', 'locked', 'suspended', 'invited']);
  M.reactivate = statusAct('active', 'USER.ACTIVATE', ['suspended', 'inactive']);
  M.unlock = statusAct('active', 'USER.UNLOCK', ['locked']);
  M.activate = function (ctx, uid, reason) { var r = statusAct('active', 'USER.ACTIVATE', ['invited'])(ctx, uid, reason); if (r.ok) { meta(uid).activatedAt = nowS(); save(); } return r; };
  M.forceLogout = function (ctx, uid, reason) {
    if (!can(ctx, 'sys11.users.manage')) return deny(ctx, 'sys11.users.manage', uid);
    if (!X().user(uid)) return bad('notfound');
    var g = targetGuard(ctx, uid); if (g) return g;
    var r0 = needReason(reason); if (r0) return r0;
    X().admin.forceLogout(uid, ctxName(ctx)); M.audit('USER.LOGOUT', ctx, { module: 'users', rec: uid, reason: reason });
    return { ok: true };
  };
  M.setPlants = function (ctx, uid, plants, reason) {
    if (!can(ctx, 'sys11.users.manage')) return deny(ctx, 'sys11.users.manage', uid);
    var x = X(), u = x.user(uid); if (!u || u.client) return bad('notfound');
    var g = targetGuard(ctx, uid); if (g) return g;
    var r0 = needReason(reason); if (r0) return r0;
    if (!validPlants(plants)) return bad('invalid');
    var from = x.account(uid).plants.slice(); x.admin.setPlants(uid, plants.slice(), ctxName(ctx));
    M.audit('USER.PLANT', ctx, { module: 'users', rec: uid, before: from, after: plants, reason: reason }); save();
    return { ok: true, user: rowOf(u, ctx) };
  };
  // Temporary access (§31, §34): start/end live here and login refuses outside the window.
  M.setAccess = function (ctx, uid, w, reason) {
    if (!can(ctx, 'sys11.users.manage')) return deny(ctx, 'sys11.users.manage', uid);
    var u = X().user(uid); if (!u || u.client) return bad('notfound');
    var g = targetGuard(ctx, uid); if (g) return g;
    var r0 = needReason(reason); if (r0) return r0;
    w = w || {}; var m = meta(uid), start = w.start || m.start || M.today(), end = w.end === undefined ? m.end : w.end;
    if (!isDate(start) || (end && (!isDate(end) || end < start || end < M.today()))) return bad('invalid', L('Tanggal akses tidak valid: akhir ≥ mulai dan ≥ hari ini.', 'Invalid access dates: end ≥ start and ≥ today.'));
    var before = { start: m.start, end: m.end }; m.start = start; m.end = end || null;
    X().admin.setPlants(uid, X().account(uid).plants.slice(), ctxName(ctx));   // bump the account version so open sessions re-check
    M.audit('USER.ACCESS', ctx, { module: 'users', rec: uid, before: before, after: { start: m.start, end: m.end }, reason: reason }); save();
    return { ok: true, user: rowOf(u, ctx) };
  };
  function makeRequest(ctx, uid, add, roles, reason, def) {
    var r = { id: nid('arq', 'ARQ-' + ym() + '-', 3), type: 'role', uid: uid, add: add.slice(), roles: roles.slice(), def: def || null, by: empId(ctx), byName: ctxName(ctx), at: nowS(), reason: Ln(T(reason)), st: 'pending' };
    S().reqs.unshift(r);
    M.audit('ROLE.REQUEST', ctx, { module: 'users', rec: uid, before: X().account(uid) ? X().account(uid).roles.map(function (x2) { return x2.k; }) : [], after: roles, reason: reason });
    return r;
  }
  function applyRoles(ctx, uid, keys, def) {
    var d = def && keys.indexOf(def) >= 0 ? def : keys[0];
    X().admin.setRoles(uid, keys.map(function (k) { return { k: k, def: k === d }; }), ctxName(ctx));
  }
  // Role assignment (§30, §32): removing is immediate; adding a privileged role becomes a request for a second admin.
  M.setRoles = function (ctx, uid, keys, reason, o) {
    if (!can(ctx, 'sys11.users.manage')) return deny(ctx, 'sys11.users.manage', uid);
    o = o || {}; var x = X(), u = x.user(uid); if (!u || u.client) return bad('notfound');
    var g = targetGuard(ctx, uid); if (g) return g;
    var r0 = needReason(reason); if (r0) return r0;
    keys = uniq(keys || []); if (!keys.length || !validRoles(keys)) return bad('invalid', L('Pilih minimal satu role internal yang valid.', 'Pick at least one valid internal role.'));
    var cur0 = x.account(uid).roles.map(function (r) { return r.k; }), add = keys.filter(function (k) { return cur0.indexOf(k) < 0; }), priv = add.filter(isPrivRole);
    if (priv.length && M.cfgGet('wf.makerChecker') !== false) { var rq = makeRequest(ctx, uid, priv, keys, reason, o.def); save(); return { ok: true, pending: rq, user: rowOf(u, ctx) }; }
    applyRoles(ctx, uid, keys, o.def);
    M.audit('ROLE.ASSIGN', ctx, { module: 'users', rec: uid, before: cur0, after: keys, reason: reason }); save();
    return { ok: true, pending: null, user: rowOf(u, ctx) };
  };
  M.requests = function (ctx, f) { if (!can(ctx, 'sys11.users.view')) return []; f = f || {}; return S().reqs.filter(function (r) { return (!f.st || r.st === f.st) && (!f.uid || r.uid === f.uid); }); };
  M.request = function (ctx, id) { return can(ctx, 'sys11.users.view') ? by(S().reqs, 'id', id) : null; };
  M.approveRequest = function (ctx, id, reason) {
    if (!can(ctx, 'sys11.priv.approve')) return deny(ctx, 'sys11.priv.approve', id);
    var r = by(S().reqs, 'id', id); if (!r) return bad('notfound');
    if (r.st !== 'pending') return bad('jump');
    if (r.by === empId(ctx)) { M.audit('ROLE.APPROVE', ctx, { module: 'users', rec: r.uid, result: 'denied', reason: 'maker = checker' }); return bad('maker'); }
    if (ctx.uid === r.uid) return bad('invalid', M.MSG.self);
    var u = X().user(r.uid); if (!u) return bad('notfound');
    var before = X().account(r.uid).roles.map(function (x2) { return x2.k; });
    applyRoles(ctx, r.uid, r.roles, r.def);
    r.st = 'approved'; r.appr = empId(ctx); r.apprName = ctxName(ctx); r.apprAt = nowS(); r.apprNote = reason ? Ln(T(reason)) : null;
    M.audit('ROLE.APPROVE', ctx, { module: 'users', rec: r.uid, before: before, after: r.roles, reason: reason || ('approve ' + id) }); save();
    return { ok: true, req: r, user: rowOf(u, ctx) };
  };
  M.rejectRequest = function (ctx, id, reason) {
    if (!can(ctx, 'sys11.priv.approve')) return deny(ctx, 'sys11.priv.approve', id);
    var r = by(S().reqs, 'id', id); if (!r) return bad('notfound');
    if (r.st !== 'pending') return bad('jump');
    var r0 = needReason(reason); if (r0) return r0;
    r.st = 'rejected'; r.appr = empId(ctx); r.apprName = ctxName(ctx); r.apprAt = nowS(); r.apprNote = Ln(T(reason));
    M.audit('ROLE.REJECT', ctx, { module: 'users', rec: r.uid, after: r.add, reason: reason }); save();
    return { ok: true, req: r };
  };
  // Direct user grants/denies (§33). Business approval perms never go to a user who only holds admin roles (§63).
  M.setUserPerms = function (ctx, uid, grant, denyList, reason) {
    if (!can(ctx, 'sys11.perm.manage')) return deny(ctx, 'sys11.perm.manage', uid);
    var x = X(), u = x.user(uid); if (!u || u.client) return bad('notfound');
    var g = targetGuard(ctx, uid); if (g) return g;
    var r0 = needReason(reason); if (r0) return r0;
    grant = uniq(grant || []); denyList = uniq(denyList || []);
    var all = grant.concat(denyList);
    if (all.some(function (p) { return /\*/.test(p); })) return bad('invalid', M.MSG.wildcard);
    var unknown = all.filter(function (p) { return !M.C.PERMS[p]; }); if (unknown.length) return bad('invalid', null, { unknown: unknown });
    var roles = x.account(uid).roles.map(function (r) { return r.k; });
    if (roles.length && roles.every(isAdminRole) && grant.some(M.isBusinessApproval)) return bad('invalid', M.MSG.sod, { sod: grant.filter(M.isBusinessApproval) });
    var a = x.account(uid), before = { grant: a.grant.slice(), deny: a.deny.slice() };
    x.admin.setPerms(uid, grant, denyList, ctxName(ctx));
    M.audit('PERM.USER', ctx, { module: 'permissions', rec: uid, before: before, after: { grant: grant, deny: denyList }, reason: reason }); save();
    return { ok: true, user: rowOf(u, ctx) };
  };

  /* ---------- Roles (§32) ---------- */
  function roleKeys() { var x = X(), C = M.C; return uniq((C ? C.ROLE_ORDER : []).concat(x ? Object.keys(x.ROLES) : [])); }
  function permsOf(k) { var x = X(); if (x && x.ROLES[k]) return x.rolePerms(k); var r = M.C && M.C.ROLES[k]; return r ? r.perms.slice() : []; }
  M.permsOf = permsOf;
  function roleName(k) { var x = X(), mt = S().roleMeta[k]; return mt && mt.n ? mt.n : (x && x.ROLES[k] ? x.ROLES[k].n : M.C && M.C.ROLES[k] ? M.C.ROLES[k].n : L(k)); }
  M.roleName = roleName;
  function roleVers(k) { var s = S(); if (!s.roleVer[k]) s.roleVer[k] = [{ v: 1, at: '2026-01-05 09:00', by: 'EMP-120', reason: L('Baseline peran Fase 4–10', 'Phase 4–10 role baseline'), perms: permsOf(k).length, change: null }]; return s.roleVer[k]; }
  function roleRow(k) {
    var x = X(), xr = x && x.ROLES[k], C = M.C, exp = xr ? xr.exp : k, cr = C && C.ROLES[exp], vs = roleVers(k), mt = S().roleMeta[k] || {}, custom = S().custom[k];
    var users = x ? x.USERS.filter(function (u) { return x.account(u.id).roles.some(function (r) { return r.k === k; }); }) : [];
    var perms = permsOf(k);
    return { k: k, n: roleName(k), exp: exp, group: xr ? xr.group : cr ? cr.group : null, landing: xr ? xr.landing : null, device: cr ? cr.device : null,
      workspace: { exp: exp, n: cr ? cr.n : L(exp), landing: xr ? xr.landing : null, nav: cr ? cr.nav.length : 0, device: cr ? cr.device : null },
      users: users.length, active: users.filter(function (u) { return acctStatus(u) === 'active'; }).length, perms: perms.length, modules: uniq(perms.map(function (p) { return M.permModule(p); })).length,
      privileged: isPrivRole(k), admin: isAdminRole(k), custom: !!custom, from: custom ? custom.from : null, v: vs[vs.length - 1].v, desc: mt.desc || (custom ? custom.desc : null) || (cr ? cr.title || null : null), access: !!xr };
  }
  M.roles = function (ctx) { if (!can(ctx, 'sys11.roles.view')) return []; return roleKeys().map(roleRow); };
  M.role = function (ctx, k) {
    if (!can(ctx, 'sys11.roles.view') || roleKeys().indexOf(k) < 0) return null;
    var r = roleRow(k), x = X();
    r.permList = permsOf(k).map(function (p) { return { p: p, n: M.C.PERMS[p] || L(p), module: M.permModule(p), action: M.permAction(p), business: M.isBusinessApproval(p) }; });
    r.versions = roleVers(k).slice().reverse();
    r.userList = x.USERS.filter(function (u) { return x.account(u.id).roles.some(function (q) { return q.k === k; }); }).map(function (u) { return { id: u.id, name: x.fullName(u), status: acctStatus(u) }; });
    r.scopes = M.MODULES.map(function (md) { return { k: md.k, n: md.n, scope: M.scopeOf(k, md.k) }; });
    return r;
  };
  function permArrays(k) {
    var x = X(), C = M.C, out = [];
    if (x && x.ROLES[k] && x.ROLES[k].perms) out.push(x.ROLES[k].perms);
    if (C && C.ROLES[k] && (!x || !x.ROLES[k] || x.ROLES[k].exp === k)) out.push(C.ROLES[k].perms);
    return out;
  }
  function writePerms(k, list) { permArrays(k).forEach(function (arr) { arr.length = 0; list.forEach(function (p) { arr.push(p); }); }); }
  function checkPermList(k, list) {
    if (!Array.isArray(list)) return bad('invalid');
    if (list.some(function (p) { return /\*/.test(p); })) return bad('invalid', M.MSG.wildcard);
    var unknown = list.filter(function (p) { return !M.C.PERMS[p]; }); if (unknown.length) return bad('invalid', null, { unknown: unknown });
    if (isAdminRole(k)) { var sod = list.filter(M.isBusinessApproval); if (sod.length) return bad('invalid', M.MSG.sod, { sod: sod }); }
    return null;
  }
  M.setRolePerms = function (ctx, k, list, reason) {
    if (!can(ctx, 'sys11.perm.manage')) return deny(ctx, 'sys11.perm.manage', k);
    if (roleKeys().indexOf(k) < 0) return bad('notfound');
    var r0 = needReason(reason); if (r0) return r0;
    list = uniq(list || []); var e = checkPermList(k, list); if (e) return e;
    var before = permsOf(k), add = list.filter(function (p) { return before.indexOf(p) < 0; }), rm = before.filter(function (p) { return list.indexOf(p) < 0; });
    if (!add.length && !rm.length) return bad('invalid', L('Tidak ada perubahan.', 'Nothing changed.'));
    if (!permArrays(k).length) return bad('scope');
    writePerms(k, list); S().rolePerms[k] = list.slice();
    var vs = roleVers(k); vs.push({ v: vs[vs.length - 1].v + 1, at: nowS(), by: empId(ctx), byName: ctxName(ctx), reason: Ln(T(reason)), perms: list.length, change: { add: add, rm: rm } });
    bumpRoleUsers(k, ctx);
    M.audit('PERM.CHANGE', ctx, { module: 'permissions', rec: k, before: { count: before.length, rm: rm }, after: { count: list.length, add: add }, reason: reason }); save();
    return { ok: true, role: roleRow(k), add: add, rm: rm };
  };
  M.setPerm = function (ctx, k, p, on, reason) {
    var cur0 = permsOf(k); return M.setRolePerms(ctx, k, on ? cur0.concat([p]) : cur0.filter(function (x2) { return x2 !== p; }), reason);
  };
  // Open sessions of the role's users re-check on their next request (account version bump).
  function bumpRoleUsers(k, ctx) { var x = X(); x.USERS.forEach(function (u) { var a = x.account(u.id); if (a && a.roles.some(function (r) { return r.k === k; })) x.admin.setPlants(u.id, a.plants.slice(), ctxName(ctx)); }); }
  M.cloneRole = function (ctx, from, f, reason) {
    if (!can(ctx, 'sys11.roles.manage')) return deny(ctx, 'sys11.roles.manage', from);
    var x = X(), src = x.ROLES[from]; if (!src || src.group === 'client') return bad('notfound');
    var r0 = needReason(reason); if (r0) return r0;
    f = f || {}; var n = str(f.n); if (n.length < 3) return bad('invalid', L('Nama role minimal 3 huruf.', 'Role name needs at least 3 letters.'));
    if (roleKeys().some(function (k) { return T(roleName(k)).toLowerCase() === n.toLowerCase(); })) return bad('dup');
    var k = 'custom' + String(S().seq.cr++).padStart(2, '0'), perms = permsOf(from);
    var def = { k: k, exp: src.exp, n: L(n, n), landing: src.landing, land: src.land, group: src.group, perms: perms.slice(), from: from, desc: str(f.desc) || null, priv: isPrivRole(from), at: nowS(), by: empId(ctx) };
    S().custom[k] = def; x.ROLES[k] = { exp: def.exp, n: def.n, landing: def.landing, land: def.land, group: def.group, perms: perms.slice(), custom: true };
    S().roleVer[k] = [{ v: 1, at: nowS(), by: empId(ctx), byName: ctxName(ctx), reason: Ln(T(reason)), perms: perms.length, change: { from: from } }];
    M.audit('ROLE.CREATE', ctx, { module: 'roles', rec: k, after: { n: n, from: from, perms: perms.length }, reason: reason }); save();
    return { ok: true, role: roleRow(k) };
  };
  M.editRole = function (ctx, k, f, reason) {
    if (!can(ctx, 'sys11.roles.manage')) return deny(ctx, 'sys11.roles.manage', k);
    if (roleKeys().indexOf(k) < 0) return bad('notfound');
    var r0 = needReason(reason); if (r0) return r0;
    f = f || {}; var mt = S().roleMeta[k] = S().roleMeta[k] || {}, before = { n: T(roleName(k)), desc: roleRow(k).desc }, after = {};
    if (f.n != null) { if (!S().custom[k]) return bad('scope', L('Nama role bawaan tidak diubah; clone untuk membuat role baru.', 'Built-in role names stay; clone to create a new role.')); if (str(f.n).length < 3) return bad('invalid'); mt.n = L(str(f.n), str(f.n)); X().ROLES[k].n = mt.n; after.n = str(f.n); }
    if (f.desc != null) { mt.desc = str(f.desc); after.desc = mt.desc; }
    if (!Object.keys(after).length) return bad('invalid');
    var vs = roleVers(k); vs.push({ v: vs[vs.length - 1].v + 1, at: nowS(), by: empId(ctx), byName: ctxName(ctx), reason: Ln(T(reason)), perms: permsOf(k).length, change: { meta: after } });
    M.audit('ROLE.EDIT', ctx, { module: 'roles', rec: k, before: before, after: after, reason: reason }); save();
    return { ok: true, role: roleRow(k) };
  };

  /* ---------- Permission matrix (§33): every permission → module × action, scope per role ---------- */
  M.ACTIONS = [['view', L('Lihat', 'View')], ['create', L('Buat', 'Create')], ['edit', L('Ubah', 'Edit')], ['approve', L('Setujui', 'Approve')], ['export', L('Export', 'Export')], ['admin', L('Admin', 'Admin')]];
  M.SCOPES = [['own', L('Milik Sendiri', 'Own')], ['team', L('Tim', 'Team')], ['branch', L('Branch', 'Branch')], ['selbranch', L('Branch Terpilih', 'Selected Branch')], ['all', L('Seluruh Perusahaan', 'All Company')]];
  M.MODULES = [
    { k: 'home', n: L('Beranda', 'Home'), pre: ['home'] }, { k: 'ops', n: L('Operasional', 'Operations'), pre: ['ops'] }, { k: 'logi', n: L('Logistik', 'Logistics'), pre: ['lg', 'log'] },
    { k: 'prod', n: L('Produksi & Maintenance', 'Production & Maintenance'), pre: ['prod', 'prd', 'chk', 'mnt'] }, { k: 'dlv', n: L('Delivery & POD', 'Delivery & POD'), pre: ['dlv'] },
    { k: 'qlt', n: L('Quality & SLA', 'Quality & SLA'), pre: ['qlt', 'sla'] }, { k: 'com', n: L('Komersial', 'Commercial'), pre: ['com'] },
    { k: 'fin', n: L('Finance & Akuntansi', 'Finance & Accounting'), pre: ['fin', 'cash', 'ar', 'ap', 'bud', 'rec', 'cfo'] }, { k: 'cost', n: L('Costing & Pricing', 'Costing & Pricing'), pre: ['hpp', 'item', 'price', 'prof'] },
    { k: 'supply', n: L('Persediaan & Pembelian', 'Inventory & Purchasing'), pre: ['inv', 'pur', 'sup'] }, { k: 'asset', n: L('Aset', 'Assets'), pre: ['ast'] },
    { k: 'perf', n: L('Kinerja & People', 'Performance & People'), pre: ['goal', 'kpi', 'xscore', 'team', 'perf', 'hr', 'race', 'refl', 'stracon', 'di', 'exe', 'people', 'audit'] },
    { k: 'rpt', n: L('Laporan & Persetujuan', 'Reports & Approvals'), pre: ['rpt', 'apr'] }, { k: 'clt', n: L('Portal Klien', 'Client Portal'), pre: ['clt', 'clp'] },
    { k: 'sys', n: L('Sistem & Governance', 'System & Governance'), pre: ['sys', 'sys11'] }
  ];
  M.ACTION_MAP = { 'ops.board': 'view', 'ops.history': 'view', 'ops.detail': 'view', 'log.route': 'view', 'perf.self': 'view', 'perf.all': 'view', 'race.all': 'view', 'rpt.ops': 'view', 'rpt.fin': 'view', 'rpt.exec': 'view',
    'rpt.ambidex': 'view', 'rpt.hr': 'view', 'di.view': 'view', 'exe.health': 'view', 'fin.health': 'view', 'fin.cash.accounts': 'view', 'prof.client': 'view', 'clt.portal': 'view', 'clt.invoice': 'view', 'com.portal': 'view',
    'lg.track.own': 'view', 'lg.track.fleet': 'view', 'lg.timeline': 'view', 'lg.kpi': 'view', 'lg.audit': 'view', 'prod.kpi': 'view', 'prod.trace': 'view', 'prod.history': 'view', 'dlv.kpi': 'view', 'dlv.timeline': 'view',
    'dlv.track.own': 'view', 'cfo.view': 'view', 'xscore.view': 'view', 'apr.view': 'view', 'apr.perf': 'approve', 'race.lead': 'admin', 'prod.cmd': 'admin', 'prod.spv': 'admin', 'lg.dispatch': 'admin', 'dlv.dispatch': 'admin',
    'dlv.override': 'approve', 'dlv.release': 'approve', 'dlv.rec.review': 'approve', 'ops.weight.override': 'approve', 'prod.weight.override': 'approve', 'ap.verify': 'approve', 'ap.override': 'approve', 'mnt.verify': 'approve',
    'fin.close': 'approve', 'fin.period': 'approve', 'fin.gl.post': 'approve', 'fin.gl.reverse': 'approve', 'ap.pay': 'approve', 'price.edit': 'approve', 'hpp.calc': 'approve', 'kpi.weight': 'admin', 'xscore.config': 'admin',
    'hr.config': 'admin', 'cfo.th': 'admin', 'cfo.model': 'admin', 'com.health.adjust': 'approve', 'com.sla.clock': 'edit', 'sys11.export': 'export', 'sys11.import': 'admin', 'rec.do': 'edit', 'cfo.act': 'create', 'cfo.scn': 'create',
    'price.scn': 'create', 'mnt.do': 'create', 'chk.do': 'create', 'chk.lead': 'edit', 'lg.arrival': 'create', 'lg.handover': 'create', 'lg.chat': 'create', 'dlv.drv': 'create', 'dlv.feedback': 'create', 'dlv.complete': 'create',
    'dlv.return.receive': 'create', 'dlv.return': 'create', 'dlv.bill': 'create', 'lg.drv.task': 'create', 'stracon.create': 'create', 'team.view': 'view', 'people.view': 'view', 'audit.view': 'view' };
  M.permModule = function (p) { var pre = String(p).split('.')[0]; for (var i = 0; i < M.MODULES.length; i++) if (M.MODULES[i].pre.indexOf(pre) >= 0) return M.MODULES[i].k; return 'sys'; };
  M.permAction = function (p) {
    if (M.ACTION_MAP[p]) return M.ACTION_MAP[p];
    if (/^home\./.test(p) || /\.view$/.test(p) || /\.(own|board|history|detail|kpi|trace|health)$/.test(p)) return 'view';
    if (/(^|\.)approve$|\.appr$|\.close$|\.verify$|\.override$|\.amend$/.test(p)) return 'approve';
    if (/export$/.test(p)) return 'export';
    if (/\.(manage|settings|config|master|roles|users|audit|admin)$|^sys11\.(priv|super|retention|security|integration|perm)/.test(p)) return 'admin';
    if (/\.(edit|adjust|move|th|model|weight)$/.test(p)) return 'edit';
    return 'create';
  };
  // §63: business approval rights (payment, price, HPP, period close, journal posting, historical edits, other approvals).
  M.isBusinessApproval = function (p) {
    if (/^sys/.test(p)) return false;
    return /(^|\.)approve$/.test(p) || /^(ar\.approve|ap\.approve|ap\.pay|ap\.override|cash\.approve|fin\.close|fin\.period|fin\.gl\.post|fin\.gl\.reverse|fin\.adjust|fin\.approve|price\.edit|hpp\.calc|com\.rate\.edit|com\.credit\.approve|com\.cn\.approve|kpi\.approve|refl\.approve|apr\.perf|dlv\.pod\.amend|dlv\.comp\.amend|lg\.evidence\.amend|ops\.weight\.override|prod\.weight\.override|dlv\.override|inv\.adjust\.approve|qlt\.claim\.approve|fin\.invoice\.fix\.approve|fin\.cn\.approve|com\.rate\.approve|cfo\.act|cfo\.th|cfo\.model|bud\.edit|ast\.dep|pur\.po\.approve|pur\.approve|item\.approve|inv\.approve|mnt\.verify|chk\.approve)$/.test(p);
  };
  M.businessPerms = function () { return Object.keys(M.C ? M.C.PERMS : {}).filter(M.isBusinessApproval); };
  M.permMap = function () { var P = M.C ? M.C.PERMS : {}; return Object.keys(P).map(function (p) { return { p: p, n: P[p], module: M.permModule(p), action: M.permAction(p), business: M.isBusinessApproval(p) }; }); };
  function defaultScope(k) {
    var x = X(), r = x && x.ROLES[k], cr = S().custom[k], g = r ? r.group : null, base = cr ? cr.from : k;
    if (g === 'client') return 'own';
    if (['operator', 'qc', 'driver'].indexOf(base) >= 0) return 'own';
    if (['raceleader', 'prod1', 'prod2', 'prod3', 'maint'].indexOf(base) >= 0) return 'team';
    if (base === 'supervisor') return 'branch';
    return 'all';
  }
  M.scopeOf = function (k, mod) { var s = S().scopes[k]; return s && s[mod] || defaultScope(k); };
  M.userScope = function (uid, mod) {
    var a = X().account(uid); if (!a) return null;
    var def = (a.roles.filter(function (r) { return r.def; })[0] || a.roles[0] || {}).k; if (!def) return null;
    var sc = M.scopeOf(def, mod), pl = a.plants || [];
    if ((sc === 'all' || sc === 'branch') && pl.indexOf('*') < 0 && pl.length > 1) return 'selbranch';
    if (sc === 'all' && pl.indexOf('*') < 0 && pl.length === 1) return 'branch';
    return sc;
  };
  M.setScope = function (ctx, k, mod, scope, reason) {
    if (!can(ctx, 'sys11.perm.manage')) return deny(ctx, 'sys11.perm.manage', k);
    if (roleKeys().indexOf(k) < 0 || !by(M.MODULES, 'k', mod)) return bad('notfound');
    if (!M.SCOPES.some(function (s) { return s[0] === scope; })) return bad('invalid');
    var r0 = needReason(reason); if (r0) return r0;
    var before = M.scopeOf(k, mod); if (before === scope) return bad('invalid', L('Tidak ada perubahan.', 'Nothing changed.'));
    (S().scopes[k] = S().scopes[k] || {})[mod] = scope;
    var vs = roleVers(k); vs.push({ v: vs[vs.length - 1].v + 1, at: nowS(), by: empId(ctx), byName: ctxName(ctx), reason: Ln(T(reason)), perms: permsOf(k).length, change: { scope: [mod, before, scope] } });
    M.audit('SCOPE.CHANGE', ctx, { module: 'permissions', rec: k + ' · ' + mod, before: before, after: scope, reason: reason }); save();
    return { ok: true, scope: scope };
  };
  M.matrix = function (ctx, f) {
    if (!can(ctx, 'sys11.roles.view')) return null;
    f = f || {}; var keys = f.roles || roleKeys(), map = M.permMap();
    var mods = M.MODULES.map(function (md) { var ps = map.filter(function (r) { return r.module === md.k; }); return { k: md.k, n: md.n, count: ps.length, byAction: M.ACTIONS.reduce(function (o, ac) { o[ac[0]] = ps.filter(function (r) { return r.action === ac[0]; }).map(function (r) { return r.p; }); return o; }, {}) }; });
    var cells = {};
    keys.forEach(function (k) {
      var ps = permsOf(k); cells[k] = {};
      mods.forEach(function (md) {
        var c = { scope: M.scopeOf(k, md.k) };
        M.ACTIONS.forEach(function (ac) { var all = md.byAction[ac[0]], has = all.filter(function (p) { return ps.indexOf(p) >= 0; }); c[ac[0]] = { has: has.length, of: all.length, perms: has }; });
        cells[k][md.k] = c;
      });
    });
    return { actions: M.ACTIONS, scopes: M.SCOPES, modules: mods, roles: keys.map(function (k) { return { k: k, n: roleName(k), privileged: isPrivRole(k), admin: isAdminRole(k) }; }), cells: cells };
  };

  /* ---------- Access review (§34) ---------- */
  function decOf(uid) { var best = null; S().camps.forEach(function (c) { var d = c.dec[uid]; if (d && (!best || d[3] > best[3])) best = d; }); return best; }
  M.accessReview = function (ctx) {
    if (!can(ctx, 'sys11.users.view')) return null;
    var rows = M.users(ctx), t = M.today(), days = +M.cfgGet('th.inactiveDays') || 30, cyc = +M.cfgGet('wf.reviewDays') || 90;
    var privileged = rows.filter(function (r) { return r.privileged; }), expired = rows.filter(function (r) { return r.expired; }), temporary = rows.filter(function (r) { return r.temp && !r.expired; });
    var inactive = rows.filter(function (r) { return r.status !== 'inactive' && (!r.lastLogin || dayDiff(r.lastLogin, t) > days); });
    var review = [];
    rows.forEach(function (r) {
      var why = [], d = decOf(r.id);
      if (r.privileged && (!d || dayDiff(d[3], t) > cyc)) why.push(L('Privileged belum direview', 'Privileged, not reviewed'));
      if (r.expired && r.status === 'active') why.push(L('Akses berakhir tapi akun aktif', 'Access ended but account active'));
      if (r.status === 'active' && (!r.lastLogin || dayDiff(r.lastLogin, t) > days)) why.push(L('Tidak login > ' + days + ' hari', 'No login > ' + days + ' days'));
      if (r.grant.length) why.push(L('Izin langsung di luar role', 'Direct grants outside the role'));
      if (r.status === 'locked') why.push(L('Akun terkunci', 'Account locked'));
      if (r.admin && effPerms(r.id).some(M.isBusinessApproval)) why.push(L('Admin memiliki hak persetujuan bisnis', 'Admin holds business approval rights'));
      if (why.length) review.push({ user: r, why: why });
    });
    return { privileged: privileged, expired: expired, temporary: temporary, inactive: inactive, review: review,
      counts: { privileged: privileged.length, expired: expired.length, temporary: temporary.length, inactive: inactive.length, review: review.length } };
  };
  function campItems(c) {
    if (!c.items) {
      var rows = M.users({ perms: ['sys11.users.view'] });
      c.items = rows.filter(function (r) { return c.scope === 'all' || (c.scope === 'privileged' && r.privileged) || (c.scope === 'temporary' && r.temp) || (c.scope === 'inactive' && (!r.lastLogin || dayDiff(r.lastLogin, M.today()) > 30)); }).map(function (r) { return r.id; });
    }
    return c.items;
  }
  function campView(c) {
    var x = X(), items = campItems(c).map(function (uid) { var u = x.user(uid), d = c.dec[uid]; return { uid: uid, name: u ? x.fullName(u) : uid, roles: u ? x.account(uid).roles.map(function (r) { return r.k; }) : [], dec: d ? d[0] : null, note: d ? d[1] : null, by: d ? d[2] : null, at: d ? d[3] : null }; });
    var done = items.filter(function (i) { return i.dec; }).length;
    return Object.assign({}, c, { items: items, progress: { done: done, total: items.length, pct: pct(done, items.length) || 0 }, overdue: c.st === 'open' && c.due < M.today() });
  }
  M.campaigns = function (ctx) { if (!can(ctx, 'sys11.users.view')) return []; var out = S().camps.map(campView); save(); return out; };
  M.campaign = function (ctx, id) { if (!can(ctx, 'sys11.users.view')) return null; var c = by(S().camps, 'id', id); return c ? campView(c) : null; };
  M.startCampaign = function (ctx, f, reason) {
    if (!can(ctx, 'sys11.access.review')) return deny(ctx, 'sys11.access.review', 'REVIEW');
    f = f || {}; var n = str(T(f.n));
    if (n.length < 3 || ['privileged', 'temporary', 'inactive', 'all'].indexOf(f.scope || 'privileged') < 0 || (f.due && (!isDate(f.due) || f.due < M.today()))) return bad('invalid');
    var c = { id: nid('arv', 'ARV-' + ym() + '-', 2), n: L(n, n), scope: f.scope || 'privileged', due: f.due || addDays(M.today(), 14), at: nowS(), by: empId(ctx), st: 'open', dec: {}, items: null };
    campItems(c); if (!c.items.length) return bad('invalid', L('Tidak ada user untuk direview.', 'No users to review.'));
    S().camps.unshift(c); M.audit('REVIEW.START', ctx, { module: 'access-review', rec: c.id, after: { scope: c.scope, users: c.items.length, due: c.due }, reason: reason }); save();
    return { ok: true, campaign: campView(c) };
  };
  M.decide = function (ctx, id, uid, dec, o) {
    if (!can(ctx, 'sys11.access.review')) return deny(ctx, 'sys11.access.review', id);
    o = o || {}; var c = by(S().camps, 'id', id); if (!c) return bad('notfound');
    if (c.st !== 'open') return bad('jump');
    if (campItems(c).indexOf(uid) < 0) return bad('notfound');
    if (['keep', 'revoke', 'adjust'].indexOf(dec) < 0) return bad('invalid');
    var note = str(T(o.note));
    if (dec !== 'keep' && !note) return bad('reason');
    if (ctx.uid === uid) return bad('invalid', M.MSG.self);
    var res = null;
    if (dec === 'revoke') {
      // The reviewer's revoke is the decision itself (access.review); superadmin accounts stay protected.
      var g = targetGuard(ctx, uid); if (g) return g;
      var u = X().user(uid), from = acctStatus(u);
      if (from !== 'inactive') { X().admin.setStatus(uid, 'inactive', ctxName(ctx)); X().admin.forceLogout(uid, ctxName(ctx)); }
    }
    if (dec === 'adjust' && o.roles) { res = M.setRoles(ctx, uid, o.roles, note); if (!res.ok) return res; }
    c.dec[uid] = [dec, L(note || T(L('Tetap', 'Keep')), note || 'Keep'), empId(ctx), nowS()];
    M.audit('REVIEW.DECIDE', ctx, { module: 'access-review', rec: id + ' · ' + uid, after: dec, reason: note || null }); save();
    return { ok: true, campaign: campView(c), pending: res && res.pending || null };
  };
  M.completeCampaign = function (ctx, id, reason) {
    if (!can(ctx, 'sys11.access.review')) return deny(ctx, 'sys11.access.review', id);
    var c = by(S().camps, 'id', id); if (!c) return bad('notfound');
    if (c.st !== 'open') return bad('jump');
    var v = campView(c); if (v.progress.done < v.progress.total) return bad('jump', L('Semua user harus diputuskan dulu.', 'Decide every user first.'), { left: v.progress.total - v.progress.done });
    c.st = 'done'; c.doneAt = nowS(); c.doneBy = empId(ctx);
    var tally = {}; v.items.forEach(function (i) { tally[i.dec] = (tally[i.dec] || 0) + 1; });
    M.audit('REVIEW.COMPLETE', ctx, { module: 'access-review', rec: id, after: tally, reason: reason || null }); save();
    return { ok: true, campaign: campView(c) };
  };

  /* ---------- Master data (§35–§37, §64) ---------- */
  function own(k, n, owner, s) { return { k: k, n: n, own: owner[0], owner: owner[1], s: s || null }; }
  var O_SYS = ['sys', L('System Admin', 'System Admin')], O_COM = ['comm', L('Komersial · Fase 6 (Service Master: Commercial / System Admin)', 'Commercial · Phase 6 (Service Master: Commercial / System Admin)')],
    O_COST = ['fin', L('Operasional / Costing · Fase 10', 'Operations / Costing · Phase 10')], O_PRD = ['prod', L('Produksi & Maintenance · Fase 8 (aset: Asset Admin)', 'Production & Maintenance · Phase 8 (asset: Asset Admin)')],
    O_LOG = ['logi', L('Logistik · Fase 7', 'Logistics · Phase 7')], O_FIN = ['fin', L('Finance Admin · Fase 10', 'Finance Admin · Phase 10')], O_SUP = ['fin', L('Supply · Fase 10', 'Supply · Phase 10')];
  M.MASTER_CATS = [
    own('company', L('Perusahaan', 'Company'), O_SYS), own('branch', L('Branch', 'Branch'), O_SYS), own('plant', L('Plant', 'Plant'), O_SYS),
    own('client', L('Klien', 'Client'), O_COM, 'CLIENT-002'), own('property', L('Property', 'Property'), O_COM, 'PROPERTY-001'), own('service', L('Layanan', 'Service'), O_COM, 'SERVICE-001'),
    own('item', L('Item', 'Item'), O_COST, 'ITEM-002'), own('unit', L('Satuan', 'Unit'), O_SYS), own('machine', L('Mesin', 'Machine'), O_PRD, 'PROD-MACH-001'), own('vehicle', L('Kendaraan', 'Vehicle'), O_LOG, 'TRACK-001'),
    own('department', L('Departemen', 'Department'), O_SYS), own('position', L('Posisi', 'Position'), O_SYS), own('costcenter', L('Cost Center', 'Cost Center'), O_FIN, 'BUD-002'),
    own('supcat', L('Kategori Supplier', 'Supplier Category'), O_SUP, 'PUR-007'), own('expense', L('Kategori Biaya', 'Expense Category'), O_SYS), own('issue', L('Kategori Masalah', 'Issue Category'), O_SYS),
    own('checklist', L('Kategori Checklist', 'Checklist Category'), O_SYS), own('maint', L('Jenis Maintenance', 'Maintenance Type'), O_SYS), own('tax', L('Pajak', 'Tax'), O_SYS), own('currency', L('Mata Uang', 'Currency'), O_SYS)
  ];
  M.COA = { k: 'coa', n: L('Chart of Accounts', 'Chart of Accounts'), own: 'fin', owner: L('Finance Admin · Fase 10', 'Finance Admin · Phase 10'), s: 'ACC-002' };
  function cat(k) { return k === 'coa' ? M.COA : by(M.MASTER_CATS, 'k', k); }
  function cur(r) { var t = M.today(), act = r.vers.filter(function (v) { return v.st === 'active' && v.eff <= t; }); return act.length ? act.sort(function (a, b) { return a.eff < b.eff ? -1 : a.eff > b.eff ? 1 : a.v - b.v; })[act.length - 1] : r.vers[0]; }
  function readThrough(k) {
    var CM = M.CM, FN = M.FN, PR = M.PR, LG = M.LG;
    var R = function (code, n, st, d) { return { id: code, code: code, n: Ln(n), st: st || 'active', d: d || {} }; };
    switch (k) {
      case 'client': return tryf(function () { return CM.state().clients.map(function (c) { return R(c.id, c.n, c.status === 'active' ? 'active' : c.status, { city: c.city, type: c.type, group: !!c.group }); }); }, []);
      case 'property': return tryf(function () { return CM.state().props.map(function (p) { return R(p.id, p.n, p.status || 'active', { cl: p.cl, city: p.city, type: p.type }); }); }, []);
      case 'service': return tryf(function () { return CM.state().services.map(function (s) { return R(s.id, s.n, s.active === false ? 'inactive' : 'active', { unit: s.unit, price: s.price, sla: s.sla }); }); }, []);
      case 'item': return tryf(function () { return FN.state().items.map(function (i) { return R(i.code, i.n, i.active === false ? 'inactive' : 'active', { cat: i.cat, unit: i.billUnit, svc: i.svc }); }); }, []);
      case 'machine': return tryf(function () { return PR.state().mach.map(function (m) { return R(m.id, m.n, m.st === 'retired' ? 'inactive' : 'active', { type: m.type, cap: m.cap, st: m.st }); }); }, []);
      case 'vehicle': return tryf(function () { return LG.state().vehicles.map(function (v) { return R(v.id, v.plate + ' · ' + v.type, v.maint === 'retired' ? 'inactive' : 'active', { plate: v.plate, type: v.type, maint: v.maint }); }); }, []);
      case 'costcenter': return tryf(function () { return FN.D.CC.map(function (c) { return R(c[0], c[1], 'active', { plant: c[2] }); }); }, []);
      case 'coa': return tryf(function () { return FN.D.COA.map(function (c) { return R(c[0], L(c[1], c[2]), c[5] === 0 ? 'inactive' : 'active', { type: c[3], group: c[4] }); }); }, []);
      case 'supcat': return tryf(function () { var m = {}; FN.state().sups.forEach(function (s) { m[s.cat] = (m[s.cat] || 0) + 1; }); return Object.keys(m).map(function (c) { return R(c, c.charAt(0).toUpperCase() + c.slice(1), 'active', { suppliers: m[c] }); }); }, []);
    }
    return [];
  }
  // In-use detection (§36): count references in users and the other engines' transactions.
  function inUse(k, code) {
    var x = X(), s = S(), n = 0;
    var metaCount = function (f) { return Object.keys(s.meta).filter(function (u) { return s.meta[u][f] === code; }).length; };
    switch (k) {
      case 'company': return x ? x.USERS.length : 1;
      case 'branch': return metaCount('branch');
      case 'plant': return (x ? x.USERS.filter(function (u) { return x.account(u.id).plants.indexOf(code) >= 0; }).length : 0) + (x ? Object.keys(x.CLIENT_PLANT).filter(function (c) { return x.CLIENT_PLANT[c] === code; }).length : 0);
      case 'department': return metaCount('dept');
      case 'position': return metaCount('pos');
      case 'unit': return tryf(function () { return M.CM.state().services.filter(function (v) { return v.unit === code; }).length; }, 0) + tryf(function () { return M.FN.state().items.filter(function (v) { return v.billUnit === code; }).length; }, 0) + tryf(function () { return M.FN.state().stock.filter(function (v) { return v.unit === code; }).length; }, 0);
      case 'expense': return tryf(function () { return M.FN.state().exp.filter(function (e) { return e.cat === code; }).length; }, 0);
      case 'issue': var rec = by(s.master.issue, 'code', code), map = rec ? cur(rec).data.map || [] : [];
        [tryf(function () { return M.DL.state().issues; }, []), tryf(function () { return M.LG.state().issues; }, []), tryf(function () { return M.PR.state().issues; }, [])].forEach(function (a) { n += a.filter(function (i) { return map.indexOf(i.type) >= 0; }).length; });
        return n;
      case 'checklist': return tryf(function () { return M.PR.state().tpl.filter(function (t) { return t.kind === code; }).length; }, 0);
      case 'maint': return code === 'MT-PM' ? tryf(function () { return M.PR.state().plans.length; }, 0) : code === 'MT-CM' ? tryf(function () { return M.PR.state().wo.length; }, 0) : 0;
      case 'tax': return code === 'PPN' ? tryf(function () { return M.FN.state().inv.filter(function (i) { return i.tax > 0; }).length; }, 0) : 0;
      case 'currency': return code === 'IDR' ? tryf(function () { return M.FN.state().inv.length + M.FN.state().jv.length; }, 1) : 0;
      case 'client': return tryf(function () { return M.LG.state().orders.filter(function (o) { return o.cl === code; }).length + M.FN.state().inv.filter(function (i) { return i.cl === code; }).length; }, 0);
      case 'property': return tryf(function () { return M.LG.state().orders.filter(function (o) { return o.prop === code; }).length; }, 0);
      case 'service': return tryf(function () { return M.CM.state().cs.filter(function (c) { return c.svc === code; }).length; }, 0);
      case 'item': return tryf(function () { return M.FN.state().items.filter(function (i) { return i.code === code; }).length; }, 0);
      case 'supcat': return tryf(function () { return M.FN.state().sups.filter(function (v) { return v.cat === code; }).length; }, 0);
    }
    return 0;
  }
  M.inUse = inUse;
  function sysRow(k, r) { var c = cur(r); return { id: r.id, code: r.code, cat: k, n: c.data.n, data: c.data, st: r.st, v: c.v, eff: c.eff, pending: r.vers.filter(function (v) { return v.st === 'pending'; }).length, scheduled: r.vers.filter(function (v) { return v.st === 'active' && v.eff > M.today(); }).length, inUse: inUse(k, r.code), readOnly: false, owner: cat(k).owner }; }
  M.masterCats = function (ctx) {
    if (!can(ctx, 'sys11.master.view')) return [];
    return M.MASTER_CATS.concat([M.COA]).map(function (c) { var list = M.masterList(ctx, c.k); return Object.assign({}, c, { count: list.length, active: list.filter(function (r) { return r.st === 'active'; }).length, readOnly: c.own !== 'sys' }); });
  };
  M.masterList = function (ctx, k, f) {
    if (!can(ctx, 'sys11.master.view')) return [];
    var c = cat(k); if (!c) return [];
    f = f || {}; var q = str(f.q).toLowerCase();
    var rows = c.own === 'sys' ? (S().master[k] || []).filter(function (r) { return r.st !== 'deleted'; }).map(function (r) { return sysRow(k, r); })
      : readThrough(k).map(function (r) { return { id: r.id, code: r.code, cat: k, n: r.n, data: r.d, st: r.st, v: null, eff: null, inUse: inUse(k, r.code), readOnly: true, owner: c.owner, link: c.s ? { s: c.s, rec: r.id } : null }; });
    return rows.filter(function (r) { return (!q || (r.code + ' ' + T(r.n) + ' ' + (r.n[1] || '')).toLowerCase().indexOf(q) >= 0) && (!f.st || r.st === f.st); });
  };
  M.masterRecord = function (ctx, k, id) {
    if (!can(ctx, 'sys11.master.view')) return null;
    var c = cat(k); if (!c) return null;
    if (c.own !== 'sys') { var r0 = by(M.masterList(ctx, k), 'id', id); return r0 ? Object.assign({ versions: [], ownerNote: c.owner }, r0) : null; }
    var r = by(S().master[k] || [], 'id', id); if (!r || r.st === 'deleted') return null;
    return Object.assign(sysRow(k, r), { versions: r.vers.slice().reverse(), canDelete: inUse(k, r.code) === 0 });
  };
  // Effective-dated read (§37): history keeps the version that was valid on that date.
  M.masterAt = function (k, id, date) {
    var r = by(S().master[k] || [], 'id', id); if (!r) return null;
    var d = String(date || M.today()).slice(0, 10), vs = r.vers.filter(function (v) { return v.st === 'active' && v.eff <= d; }).sort(function (a, b) { return a.eff < b.eff ? -1 : a.eff > b.eff ? 1 : a.v - b.v; });
    var v = vs[vs.length - 1]; return v ? Object.assign({ v: v.v, eff: v.eff }, v.data) : null;
  };
  function sysCat(ctx, k, perm) {
    var c = cat(k); if (!c) return bad('notfound');
    if (!can(ctx, perm)) return deny(ctx, perm, 'MASTER ' + k);
    if (c.own !== 'sys') return bad('scope', L('Kategori ini dikelola oleh ' + T(c.owner) + '. Ubah di modul tersebut.', 'This category is owned by ' + c.owner[1] + '. Change it there.'), { owner: c.owner, s: c.s });
    return null;
  }
  function needsApproval(k) { return String(M.cfgGet('wf.masterApproval') || '').split(',').map(str).indexOf(k) >= 0; }
  function nameOf(n) { return Array.isArray(n) ? L(str(n[0]), str(n[1] || n[0])) : L(str(n), str(n)); }
  M.masterAdd = function (ctx, k, f, o) {
    var g = sysCat(ctx, k, 'sys11.master.manage'); if (g) return g;
    o = o || {}; f = f || {}; var r0 = needReason(o.reason); if (r0) return r0;
    var code = str(f.code), n = nameOf(f.n), eff = o.eff || M.today();
    if (!/^[A-Za-z0-9._-]{1,20}$/.test(code) || !T(n) || !isDate(eff) || eff < M.today()) return bad('invalid');
    if (by(S().master[k], 'code', code)) return bad('dup');
    var r = { id: code, code: code, cat: k, st: 'active', vers: [verRec(1, eff, Ln(T(o.reason)), empId(ctx), nowS(), Object.assign({ n: n }, f.data || {}))] };
    S().master[k].push(r); M.audit('MASTER.CREATE', ctx, { module: 'master:' + k, rec: code, after: Object.assign({ n: T(n), eff: eff }, f.data || {}), reason: o.reason }); save();
    return { ok: true, rec: M.masterRecord(ctx, k, code) };
  };
  M.masterEdit = function (ctx, k, id, data, o) {
    var g = sysCat(ctx, k, 'sys11.master.manage'); if (g) return g;
    o = o || {}; var r = by(S().master[k] || [], 'id', id); if (!r || r.st === 'deleted') return bad('notfound');
    var r0 = needReason(o.reason); if (r0) return r0;
    var eff = o.eff || M.today(); if (!isDate(eff) || eff < M.today()) return bad('invalid', L('Tanggal efektif tidak boleh mundur: transaksi lama tetap memakai versi lama.', 'The effective date cannot be in the past: old transactions keep the old version.'));
    if (r.vers.some(function (v) { return v.st === 'pending'; })) return bad('jump', L('Masih ada versi menunggu persetujuan.', 'A version is still waiting for approval.'));
    var c0 = cur(r), d = Object.assign({}, c0.data, data || {}); if (data && data.n) d.n = nameOf(data.n);
    if (JSON.stringify(d) === JSON.stringify(c0.data)) return bad('invalid', L('Tidak ada perubahan.', 'Nothing changed.'));
    if (k === 'tax' && (typeof d.rate !== 'number' || d.rate < 0 || d.rate > 100)) return bad('invalid');
    var appr = needsApproval(k);
    var v = verRec(Math.max.apply(null, r.vers.map(function (x2) { return x2.v; })) + 1, eff, Ln(T(o.reason)), empId(ctx), nowS(), d, { st: appr ? 'pending' : 'active' });
    r.vers.push(v);
    M.audit('MASTER.CHANGE', ctx, { module: 'master:' + k, rec: r.code, before: c0.data, after: Object.assign({ v: v.v, eff: eff, st: v.st }, d), reason: o.reason }); save();
    return { ok: true, version: v, pending: appr, rec: M.masterRecord(ctx, k, id) };
  };
  M.masterApprove = function (ctx, k, id, v, ok, reason) {
    var c = cat(k); if (!c || c.own !== 'sys') return bad('notfound');
    if (!can(ctx, 'sys11.master.approve')) return deny(ctx, 'sys11.master.approve', k + ' ' + id);
    var r = by(S().master[k] || [], 'id', id), x = r && r.vers.filter(function (y) { return y.v === +v; })[0]; if (!x) return bad('notfound');
    if (x.st !== 'pending') return bad('jump');
    if (x.by === empId(ctx)) return bad('maker');
    if (!ok) { var r0 = needReason(reason); if (r0) return r0; }
    x.st = ok ? 'active' : 'rejected'; x.appr = empId(ctx); x.apprAt = nowS(); x.apprNote = reason ? Ln(T(reason)) : null;
    M.audit('MASTER.APPROVE', ctx, { module: 'master:' + k, rec: r.code, after: { v: x.v, st: x.st }, reason: reason || null }); save();
    return { ok: true, version: x };
  };
  M.masterSetActive = function (ctx, k, id, on, reason) {
    var g = sysCat(ctx, k, 'sys11.master.manage'); if (g) return g;
    var r = by(S().master[k] || [], 'id', id); if (!r || r.st === 'deleted') return bad('notfound');
    var r0 = needReason(reason); if (r0) return r0;
    var to = on ? 'active' : 'inactive'; if (r.st === to) return bad('jump');
    var from = r.st; r.st = to;
    M.audit('MASTER.STATUS', ctx, { module: 'master:' + k, rec: r.code, before: from, after: to, reason: reason }); save();
    return { ok: true, rec: M.masterRecord(ctx, k, id) };
  };
  // No hard delete (§36, §65): a used record is refused; an unused one is only marked deleted and stays in history.
  M.masterDelete = function (ctx, k, id, reason) {
    var g = sysCat(ctx, k, 'sys11.master.manage'); if (g) return g;
    var r = by(S().master[k] || [], 'id', id); if (!r || r.st === 'deleted') return bad('notfound');
    var r0 = needReason(reason); if (r0) return r0;
    var n = inUse(k, r.code); if (n > 0) return bad('inuse', null, { inUse: n });
    var from = r.st; r.st = 'deleted'; r.delAt = nowS(); r.delBy = empId(ctx);
    M.audit('MASTER.DELETE', ctx, { module: 'master:' + k, rec: r.code, before: from, after: 'deleted', reason: reason }); save();
    return { ok: true };
  };

  /* ---------- System configuration (§38) ---------- */
  M.CFG_META = {
    'num.order': ['numbering', L('Nomor order', 'Order number'), 'pattern', 'logi'], 'num.delivery': ['numbering', L('Nomor delivery', 'Delivery number'), 'pattern', 'dlv'], 'num.invoice': ['numbering', L('Nomor invoice', 'Invoice number'), 'pattern', 'fin'],
    'num.request': ['numbering', L('Nomor request klien', 'Client request number'), 'pattern', 'clp'], 'num.case': ['numbering', L('Nomor kasus komplain', 'Complaint case number'), 'pattern', 'clp'], 'num.user': ['numbering', L('ID user', 'User ID'), 'pattern', 'sys'],
    'num.import': ['numbering', L('Nomor import', 'Import number'), 'pattern', 'sys'], 'lang.default': ['locale', L('Bahasa default', 'Default language'), 'enum:id,en'], 'fmt.date': ['locale', L('Format tanggal', 'Date format'), 'enum:DD MMM YYYY,DD/MM/YYYY,YYYY-MM-DD'],
    'fmt.time': ['locale', L('Format jam', 'Time format'), 'enum:HH:mm,hh:mm A'], 'cur.default': ['locale', L('Mata uang', 'Currency'), 'currency'], 'tz': ['locale', L('Zona waktu', 'Time zone'), 'enum:Asia/Makassar,Asia/Jakarta,Asia/Jayapura'],
    'wf.makerChecker': ['approval', L('Maker-checker role privileged', 'Maker-checker for privileged roles'), 'bool'], 'wf.privRoles': ['approval', L('Role privileged', 'Privileged roles'), 'roles'],
    'wf.masterApproval': ['approval', L('Master data perlu persetujuan', 'Master data needing approval'), 'cats'], 'wf.reviewDays': ['workflow', L('Siklus review akses (hari)', 'Access review cycle (days)'), 'int:30,365'],
    'th.inactiveDays': ['threshold', L('User tidak aktif setelah (hari)', 'User inactive after (days)'), 'int:7,180'], 'th.tempMaxDays': ['threshold', L('Maks. akses sementara (hari)', 'Max temporary access (days)'), 'int:1,365'],
    'th.importMaxRows': ['threshold', L('Maks. baris per import', 'Max rows per import'), 'int:10,5000'], 'th.notifFailWarn': ['threshold', L('Ambang gagal notifikasi (%)', 'Notification failure threshold (%)'), 'int:1,50'],
    'th.storageWarnPct': ['threshold', L('Ambang peringatan storage (%)', 'Storage warning threshold (%)'), 'int:30,95']
  };
  M.CFG_GROUPS = [['numbering', L('Penomoran', 'Numbering')], ['locale', L('Bahasa, Format & Zona Waktu', 'Language, Format & Time Zone')], ['status', L('Aturan Status', 'Status Rules')], ['workflow', L('Aturan Workflow', 'Workflow Rules')],
    ['threshold', L('Ambang Batas', 'Thresholds')], ['approval', L('Pengaturan Persetujuan', 'Approval Settings')]];
  M.cfgGet = function (k, date) {
    var vs = S().cfg[k]; if (!vs) return undefined;
    var d = String(date || M.today()).slice(0, 10), ok = vs.filter(function (v) { return v.eff <= d; });
    return (ok.length ? ok[ok.length - 1] : vs[0]).val;
  };
  function extCfg() {
    var out = [], FN = M.FN, LG = M.LG, DL = M.DL, x = X();
    var E = function (g, k, n, v, owner, s) { out.push({ k: k, g: g, n: n, v: v, owner: owner, src: 'ext', editable: false, s: s || null }); };
    tryf(function () { E('status', 'st.order', L('Alur status order', 'Order status flow'), LG.FLOW.join(' → '), L('Logistik · Fase 7', 'Logistics · Phase 7'), 'TIMELINE-001'); });
    tryf(function () { E('status', 'st.invoice', L('Status invoice', 'Invoice statuses'), Object.keys(FN.INV_ST).join(' → '), L('Finance · Fase 10', 'Finance · Phase 10'), 'AR-003'); });
    tryf(function () { E('status', 'st.delivery', L('Status delivery', 'Delivery statuses'), Object.keys(DL.DLV_ST || {}).join(' → '), L('Delivery · Fase 9', 'Delivery · Phase 9'), 'DISP-001'); });
    tryf(function () { var c = FN.cfg(); E('approval', 'fin.arApprove', L('Invoice ≥ nilai ini perlu Owner', 'Invoices ≥ this need the Owner'), c.arApprove, L('Finance · Fase 10', 'Finance · Phase 10'), 'AR-003');
      E('approval', 'fin.apMaker', L('Biaya ≥ nilai ini perlu maker-checker', 'Expenses ≥ this need maker-checker'), c.apMaker, L('Finance · Fase 10', 'Finance · Phase 10'), 'AP-002');
      E('approval', 'fin.cashApprove', L('Kas keluar ≥ nilai ini perlu persetujuan', 'Cash out ≥ this needs approval'), c.cashApprove, L('Finance · Fase 10', 'Finance · Phase 10'), 'CASH-003');
      E('threshold', 'fin.ppn', L('Tarif PPN invoice (%)', 'Invoice VAT rate (%)'), c.ppn, L('Finance · Fase 10 (master Pajak)', 'Finance · Phase 10 (Tax master)'), 'CFG-002'); });
    if (x) { E('threshold', 'sec.maxFailed', L('Gagal login sebelum dikunci', 'Failed sign-ins before lock'), x.POLICY.maxFailed, L('Keamanan · SEC-005', 'Security · SEC-005'), 'SEC-005');
      E('threshold', 'sec.idle', L('Timeout sesi (menit)', 'Session timeout (minutes)'), Math.round(x.POLICY.idle / MIN), L('Keamanan · SEC-005', 'Security · SEC-005'), 'SEC-005'); }
    return out;
  }
  M.config = function (ctx) {
    if (!can(ctx, 'sys11.config.view')) return null;
    var items = Object.keys(M.CFG_META).map(function (k) { var m = M.CFG_META[k], vs = S().cfg[k], last = vs[vs.length - 1];
      return { k: k, g: m[0], n: m[1], type: m[2], v: M.cfgGet(k), next: last.eff > M.today() ? { v: last.val, eff: last.eff } : null, ver: last.v, eff: last.eff, owner: m[3] && m[3] !== 'sys' ? L('Dipakai modul ' + m[3], 'Used by ' + m[3]) : L('System Admin', 'System Admin'), src: 'sys', editable: true, versions: vs.slice().reverse() }; }).concat(extCfg());
    return { groups: M.CFG_GROUPS.map(function (g) { return { k: g[0], n: g[1], items: items.filter(function (i) { return i.g === g[0]; }) }; }), items: items };
  };
  function cfgValid(k, val) {
    var t = M.CFG_META[k][2];
    if (t === 'pattern') return typeof val === 'string' && /n|N/.test(val) && val.length <= 30;
    if (t === 'bool') return typeof val === 'boolean';
    if (/^enum:/.test(t)) return t.slice(5).split(',').indexOf(val) >= 0;
    if (/^int:/.test(t)) { var r = t.slice(4).split(','); return typeof val === 'number' && Math.round(val) === val && val >= +r[0] && val <= +r[1]; }
    if (t === 'currency') return activeMaster('currency', val);
    if (t === 'roles') return typeof val === 'string' && val.split(',').map(str).every(function (k2) { return X().ROLES[k2] || S().custom[k2]; }) && val.indexOf('superadmin') >= 0 && val.indexOf('sysadmin') >= 0;
    if (t === 'cats') return typeof val === 'string' && (val === '' || val.split(',').map(str).every(function (c) { return cat(c) && cat(c).own === 'sys'; }));
    return false;
  }
  M.setConfig = function (ctx, k, val, o) {
    if (!can(ctx, 'sys11.config.manage')) return deny(ctx, 'sys11.config.manage', k);
    o = o || {};
    if (!M.CFG_META[k]) { var ext = by(extCfg(), 'k', k); return ext ? bad('scope', L('Pengaturan ini milik ' + T(ext.owner) + '.', 'This setting belongs to ' + ext.owner[1] + '.'), { owner: ext.owner, s: ext.s }) : bad('notfound'); }
    var r0 = needReason(o.reason); if (r0) return r0;
    var eff = o.eff || M.today(); if (!isDate(eff) || eff < M.today()) return bad('invalid');
    if (!cfgValid(k, val)) return bad('invalid');
    var vs = S().cfg[k], before = M.cfgGet(k); if (before === val && eff <= M.today()) return bad('invalid', L('Tidak ada perubahan.', 'Nothing changed.'));
    vs.push({ v: vs[vs.length - 1].v + 1, eff: eff, val: val, by: empId(ctx), at: nowS(), reason: Ln(T(o.reason)) });
    M.audit('CONFIG.CHANGE', ctx, { module: 'config', rec: k, before: before, after: { v: val, eff: eff }, reason: o.reason }); save();
    return { ok: true, v: M.cfgGet(k), eff: eff };
  };

  /* ---------- NP-09 notifications (§39–§42, §67) ---------- */
  M.CHANNELS = [['app', L('In-App', 'In-App'), null], ['email', L('Email', 'Email'), 'INT-EMAIL'], ['wa', L('WhatsApp', 'WhatsApp'), 'INT-WA'], ['push', L('Push', 'Push'), null], ['sms', L('SMS (segera)', 'SMS (future)'), null]];
  M.EVENTS = [
    { k: 'pickup_scheduled', n: L('Pickup Dijadwalkan', 'Pickup Scheduled'), src: ['DL:sched', 'LG:resched', 'X:NT-15'], aud: 'client' },
    { k: 'driver_assigned', n: L('Driver Ditugaskan', 'Driver Assigned'), src: ['LG:assigned', 'LG:task', 'LG:tripstart'], aud: 'client' },
    { k: 'near_arrival', n: L('Hampir Tiba', 'Near Arrival'), src: ['LG:near', 'LG:arrived'], aud: 'client' },
    { k: 'delivery_completed', n: L('Pengiriman Selesai', 'Delivery Completed'), src: ['LG:deldone', 'LG:pickdone', 'DL:done', 'X:NT-14'], aud: 'client' },
    { k: 'invoice_issued', n: L('Invoice Terbit', 'Invoice Issued'), src: ['FN:INVOICE.ISSUE'], aud: 'client' },
    { k: 'payment_due', n: L('Jatuh Tempo Pembayaran', 'Payment Due'), src: ['FN:due'], aud: 'client' },
    { k: 'ar_overdue', n: L('AR Lewat Jatuh Tempo', 'AR Overdue'), src: ['X:NT-09', 'FN:aresc'], aud: 'internal' },
    { k: 'complaint_update', n: L('Update Komplain', 'Complaint Update'), src: ['DL:issue', 'DL:clientiss', 'DL:redel', 'CLP:case'], aud: 'client' },
    { k: 'maintenance_due', n: L('Maintenance Jatuh Tempo', 'Maintenance Due'), src: ['PR:plan', 'X:NT-16'], aud: 'internal' },
    { k: 'approval_required', n: L('Persetujuan Dibutuhkan', 'Approval Required'), src: ['FN:invappr', 'FN:cashappr', 'FN:prappr', 'FN:poappr', 'FN:adjappr', 'FN:wtappr', 'X:NT-08'], aud: 'internal' },
    { k: 'stock_critical', n: L('Stok Kritis', 'Stock Critical'), src: ['FN:stock', 'X:NT-03'], aud: 'internal' },
    { k: 'sla_risk', n: L('Risiko SLA', 'SLA Risk'), src: ['LG:slarisk', 'LG:delay', 'LG:routedelay', 'X:NT-01', 'X:NT-02', 'DL:crit', 'DL:recdiff'], aud: 'internal' }
  ];
  // Variables (§41): client-safe ones may go to a client; the rest are internal (sensitive finance, other clients, security).
  M.VARS = {
    client_name: [L('Nama klien', 'Client name'), true, 'Jaens Spa Group'], property_name: [L('Nama property', 'Property name'), true, 'Jaens Spa Center'], order_number: [L('No. order', 'Order number'), true, 'ORD-2610-143'],
    eta: [L('Perkiraan tiba', 'ETA'), true, '14:25'], invoice_number: [L('No. invoice', 'Invoice number'), true, 'INV-2609-071'], due_date: [L('Jatuh tempo', 'Due date'), true, '31 Okt 2026'], amount: [L('Nilai tagihan', 'Amount'), true, 'Rp 12.400.000'],
    driver_name: [L('Nama depan driver', 'Driver first name'), true, 'Ketut'], plate: [L('Plat kendaraan', 'Plate'), true, 'DK 1234 AB'], pickup_date: [L('Tanggal pickup', 'Pickup date'), true, '7 Okt 2026'], pickup_window: [L('Jam pickup', 'Pickup window'), true, '09:00–10:00'],
    case_number: [L('No. kasus', 'Case number'), true, 'CASE-00214'], status: [L('Status', 'Status'), true, 'Dalam Proses'], user_name: [L('Nama penerima', 'Recipient name'), true, 'Arya'],
    days_overdue: [L('Hari lewat jatuh tempo', 'Days overdue'), false, '18'], machine_name: [L('Nama mesin', 'Machine name'), false, 'Dryer D-03'], maintenance_type: [L('Jenis maintenance', 'Maintenance type'), false, 'Preventive'],
    approval_type: [L('Jenis persetujuan', 'Approval type'), false, 'PR'], record: [L('Nomor dokumen', 'Record'), false, 'PR-2610-004'], item_name: [L('Nama item', 'Item name'), false, 'Detergen Cair'], qty: [L('Jumlah', 'Quantity'), false, '120 L'],
    delay_min: [L('Menit terlambat', 'Minutes late'), false, '25'], hpp: [L('HPP/kg', 'HPP/kg'), false, 'Rp 4.820'], margin: [L('Margin', 'Margin'), false, '38%'], internal_note: [L('Catatan internal', 'Internal note'), false, '—'],
    other_client: [L('Klien lain', 'Other client'), false, 'Grand Vista Hotel'], ip_address: [L('Alamat IP', 'IP address'), false, '10.20.•••.•••']
  };
  function varsIn(s) { var out = [], re = /\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, m; while ((m = re.exec(String(s || '')))) if (out.indexOf(m[1]) < 0) out.push(m[1]); return out; }
  M.validateTemplate = function (f) {
    f = f || {}; var lang = f.lang || {}, txt = ['id', 'en'].map(function (l) { return (lang[l] ? (lang[l].subj || '') + ' ' + (lang[l].body || '') : ''); }).join(' ');
    var vars = varsIn(txt), unknown = vars.filter(function (v) { return !M.VARS[v]; }), privacy = f.aud === 'client' ? vars.filter(function (v) { return M.VARS[v] && !M.VARS[v][1]; }) : [];
    var errs = {};
    if (!by(M.EVENTS, 'k', f.ev)) errs.ev = L('Pilih event.', 'Pick an event.');
    if (['client', 'internal'].indexOf(f.aud) < 0) errs.aud = L('Pilih penerima.', 'Pick the audience.');
    if (!Array.isArray(f.ch) || !f.ch.length || f.ch.some(function (c) { return !by(M.CHANNELS.map(function (x2) { return { k: x2[0] }; }), 'k', c); })) errs.ch = L('Pilih channel.', 'Pick channels.');
    else if (f.ch.indexOf('sms') >= 0) errs.ch = L('SMS belum tersedia (future-ready).', 'SMS is not available yet (future-ready).');
    if (!lang.id || !str(lang.id.body)) errs.body = L('Pesan Bahasa Indonesia wajib diisi.', 'The Indonesian message is required.');
    if (unknown.length) errs.vars = L('Variabel tidak dikenal: ' + unknown.join(', '), 'Unknown variables: ' + unknown.join(', '));
    return { ok: !Object.keys(errs).length && !privacy.length, vars: vars, unknown: unknown, privacy: privacy, errs: errs };
  };
  function tplView(t) { var e = by(M.EVENTS, 'k', t.ev); return Object.assign({}, t, { evN: e ? e.n : L(t.ev), vars: varsIn(JSON.stringify(t.lang)), name: t.lang.id.subj }); }
  M.templates = function (ctx, f) { if (!can(ctx, 'sys11.notif.view')) return []; f = f || {}; return S().tpl.filter(function (t) { return (!f.ev || t.ev === f.ev) && (!f.ch || t.ch.indexOf(f.ch) >= 0) && (!f.aud || t.aud === f.aud); }).map(tplView); };
  M.template = function (ctx, id) { if (!can(ctx, 'sys11.notif.view')) return null; var t = by(S().tpl, 'id', id); return t ? Object.assign(tplView(t), { versions: t.vers.slice().reverse() }) : null; };
  M.saveTemplate = function (ctx, id, f, reason) {
    if (!can(ctx, 'sys11.notif.manage')) return deny(ctx, 'sys11.notif.manage', id || 'TEMPLATE');
    var t = id ? by(S().tpl, 'id', id) : null; if (id && !t) return bad('notfound');
    var r0 = needReason(reason); if (r0) return r0;
    f = Object.assign({ ev: t && t.ev, aud: t && t.aud, ch: t && t.ch, lang: t && t.lang }, f || {});
    var v = M.validateTemplate(f);
    if (v.privacy.length) { M.audit('TEMPLATE.SAVE', ctx, { module: 'notification', rec: id || 'new', after: { privacy: v.privacy }, result: 'denied', reason: 'privacy §67' }); return bad('scope', M.MSG.privacy, { privacy: v.privacy }); }
    if (!v.ok) return bad('invalid', null, { errs: v.errs, unknown: v.unknown });
    var lang = { id: { subj: str(f.lang.id.subj), body: str(f.lang.id.body) }, en: { subj: str(f.lang.en && f.lang.en.subj || f.lang.id.subj), body: str(f.lang.en && f.lang.en.body || f.lang.id.body) } };
    var before = t ? { v: t.v, lang: t.lang, ch: t.ch } : null;
    if (!t) { t = { id: nid('tpl', 'TPL-', 2), ev: f.ev, aud: f.aud, ch: f.ch.slice(), active: true, v: 0, lang: lang, vers: [] }; S().tpl.push(t); }
    t.ev = f.ev; t.aud = f.aud; t.ch = f.ch.slice(); t.lang = lang; t.v += 1; t.vers.push({ v: t.v, at: nowS(), by: empId(ctx), byName: ctxName(ctx), reason: Ln(T(reason)), lang: clone(lang), ch: t.ch.slice() });
    M.audit('TEMPLATE.SAVE', ctx, { module: 'notification', rec: t.id, before: before, after: { v: t.v, ch: t.ch, vars: v.vars }, reason: reason }); save();
    return { ok: true, template: tplView(t) };
  };
  M.setTemplateActive = function (ctx, id, on, reason) {
    if (!can(ctx, 'sys11.notif.manage')) return deny(ctx, 'sys11.notif.manage', id);
    var t = by(S().tpl, 'id', id); if (!t) return bad('notfound');
    var r0 = needReason(reason); if (r0) return r0;
    if (t.active === !!on) return bad('jump');
    t.active = !!on; M.audit('TEMPLATE.STATUS', ctx, { module: 'notification', rec: id, before: !on, after: !!on, reason: reason }); save();
    return { ok: true, template: tplView(t) };
  };
  function render(s, sample) { return String(s || '').replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, function (m0, k) { return sample[k] != null ? sample[k] : M.VARS[k] ? M.VARS[k][2] : m0; }); }
  M.preview = function (ctx, idOrF, lang, sample) {
    if (!can(ctx, 'sys11.notif.view')) return null;
    var t = typeof idOrF === 'string' ? by(S().tpl, 'id', idOrF) : idOrF; if (!t || !t.lang) return null;
    var l = t.lang[lang === 'en' ? 'en' : 'id'] || t.lang.id, smp = sample || {};
    var v = M.validateTemplate(t);
    return { subj: render(l.subj, smp), body: render(l.body, smp), vars: v.vars, unknown: v.unknown, privacy: v.privacy, ch: t.ch };
  };
  function integ(id) { return by(S().integ, 'id', id); }
  function chanState(k) {
    var c = by(M.CHANNELS.map(function (x2) { return { k: x2[0], n: x2[1], i: x2[2] }; }), 'k', k), on = !!S().chan[k];
    if (k === 'sms') return { k: k, n: c.n, on: false, avail: false, st: 'future', note: L('Disiapkan untuk masa depan.', 'Prepared for the future.') };
    var ig = c.i ? integ(c.i) : null, st = !on ? 'disabled' : ig ? (ig.disabled ? 'unavailable' : ig.st === 'healthy' ? 'healthy' : ig.st === 'warning' ? 'warning' : 'unavailable') : 'healthy';
    return { k: k, n: c.n, on: on, avail: !ig || (ig.st !== 'disconnected' && ig.st !== 'critical' && !ig.disabled), st: st, integ: c.i, integSt: ig ? ig.st : null, note: ig && ig.err ? ig.err : null };
  }
  M.channels = function (ctx) {
    if (!can(ctx, 'sys11.notif.view')) return [];
    var log = commRows(), t = M.now();
    return M.CHANNELS.map(function (c) { var s = chanState(c[0]), rs = log.filter(function (r) { return r.ch === c[0] && t - ms(r.at) <= DAY; });
      return Object.assign(s, { sent24: rs.length, failed24: rs.filter(function (r) { return r.st === 'failed'; }).length, rate: pct(rs.filter(function (r) { return r.st === 'delivered'; }).length, rs.filter(function (r) { return r.st !== 'pending'; }).length) }); });
  };
  M.setChannel = function (ctx, k, on, reason) {
    if (!can(ctx, 'sys11.notif.manage')) return deny(ctx, 'sys11.notif.manage', 'CHANNEL ' + k);
    if (!by(M.CHANNELS.map(function (x2) { return { k: x2[0] }; }), 'k', k)) return bad('notfound');
    var r0 = needReason(reason); if (r0) return r0;
    if (k === 'sms') return bad('invalid', L('SMS belum tersedia (future-ready).', 'SMS is not available yet (future-ready).'));
    if (k === 'app' && !on) return bad('invalid', L('In-App wajib aktif untuk pesan sistem & keamanan.', 'In-App must stay on for system & security messages.'));
    if (S().chan[k] === !!on) return bad('jump');
    if (on && !chanState(k).avail) return bad('invalid', M.MSG.integ, { integ: chanState(k).integ });
    S().chan[k] = !!on; M.audit('CHANNEL.CHANGE', ctx, { module: 'notification', rec: k, before: !on, after: !!on, reason: reason }); save();
    return { ok: true, channel: chanState(k) };
  };
  // Communication log (§42): the notifications the engines really produced + outbound email/WhatsApp, with simulated delivery results.
  var FAIL_TXT = [L('Nomor tujuan tidak terdaftar di WhatsApp.', 'The recipient number is not registered on WhatsApp.'), L('Batas kirim WhatsApp per menit tercapai (rate limit).', 'WhatsApp per-minute send limit reached (rate limit).'), L('Template WhatsApp belum disetujui Meta.', 'The WhatsApp template is not approved by Meta yet.')];
  function evOf(src) { var e = M.EVENTS.filter(function (x2) { return x2.src.indexOf(src) >= 0; })[0]; return e ? e.k : null; }
  function simSt(id, ch, at) {
    var cs = chanState(ch);
    if (!cs.on) return ['failed', L('Channel dinonaktifkan.', 'The channel is disabled.')];
    if (cs.st === 'unavailable') return ['failed', M.MSG.integ];
    if (M.now() - ms(at) < 3 * MIN) return ['pending', null];
    if (cs.st === 'warning' && hash(id) % 4 === 0) return ['failed', FAIL_TXT[hash(id + 'e') % 3]];
    return ['delivered', null];
  }
  function commRows() {
    var s = S(), out = [], x = X();
    var tplFor = function (ev) { return ev ? s.tpl.filter(function (t) { return t.ev === ev && t.active; })[0] : null; };
    var add = function (id, at, ev, ch, cl, to, rec, srcK, stv, err, tries) {
      var ov = s.comm[id], tp = tplFor(ev), st0 = stv ? [stv, err] : simSt(id, ch, at);
      out.push({ id: id, at: at, ev: ev, evN: ev ? by(M.EVENTS, 'k', ev).n : L('Lainnya', 'Other'), ch: ch, cl: cl || null, toType: cl ? 'client' : 'internal', to: to, rec: rec || null, tpl: tp ? tp.id : null, src: srcK,
        st: ov ? ov.st : st0[0], err: ov ? ov.err : st0[1], tries: ov ? ov.tries : (tries || 1), res: (ov ? ov.st : st0[0]) === 'delivered' ? L('Terkirim', 'Delivered') : (ov ? ov.st : st0[0]) === 'pending' ? L('Menunggu', 'Pending') : L('Gagal', 'Failed') });
    };
    var clName = function (cl) { return tryf(function () { return M.CM.clientName(cl); }, cl); };
    tryf(function () { M.LG.state().notifs.forEach(function (n) { var cl = /^CL-/.test(n.to) ? n.to : null, ev = evOf('LG:' + n.kind); add('LG-' + n.id, n.at, ev, cl ? 'wa' : 'push', cl, cl ? clName(cl) : (n.to === 'sup' ? 'Supervisor' : n.to), n.ord, 'logistics'); }); });
    tryf(function () { M.DL.state().notifs.forEach(function (n) { var cl = /^CL-/.test(n.to) ? n.to : null, ev = evOf('DL:' + n.kind); add('DL-' + n.id, n.at, ev, cl ? 'wa' : 'app', cl, cl ? clName(cl) : (n.to === 'sup' ? 'Supervisor' : n.to), n.dlv, 'delivery'); }); });
    tryf(function () { M.FN.state().notifs.forEach(function (n) { add('FN-' + n.id, n.at, evOf('FN:' + n.kind), 'app', null, M.C.PERMS[n.to] ? T(M.C.PERMS[n.to]) : n.to, n.rec, 'finance'); }); });
    if (x) { var seed0 = M.now(); x.NOTIFS.forEach(function (n) { var cl = n.client || null; add('AX-' + n.id, isoT(seed0 - (n.ago || 0)), evOf('X:' + n.id), 'app', cl, cl ? clName(cl) : n.to.join(', '), null, 'access'); }); }
    s.out.forEach(function (o) { add(o.id, o.at, o.ev, o.ch, o.cl, o.to, o.rec, 'outbox', o.st === 'pending' && M.now() - ms(o.at) >= 3 * MIN ? null : o.st, o.err ? Ln(o.err) : null, o.tries); });
    return out.sort(function (a, b) { return a.at < b.at ? 1 : a.at > b.at ? -1 : 0; });
  }
  M.commLog = function (ctx, f) {
    if (!can(ctx, 'sys11.notif.view')) return [];
    f = f || {}; var q = str(f.q).toLowerCase();
    return commRows().filter(function (r) { return (!f.st || r.st === f.st) && (!f.ch || r.ch === f.ch) && (!f.ev || r.ev === f.ev) && (!f.cl || r.cl === f.cl) && (!f.toType || r.toType === f.toType) && (!q || (r.id + ' ' + r.to + ' ' + (r.rec || '')).toLowerCase().indexOf(q) >= 0); });
  };
  M.commSummary = function (ctx) {
    if (!can(ctx, 'sys11.notif.view')) return null;
    var rows = commRows(), n = function (s) { return rows.filter(function (r) { return r.st === s; }).length; };
    return { total: rows.length, delivered: n('delivered'), failed: n('failed'), pending: n('pending'), rate: pct(n('delivered'), n('delivered') + n('failed')) };
  };
  M.retry = function (ctx, id) {
    if (!can(ctx, 'sys11.notif.manage')) return deny(ctx, 'sys11.notif.manage', id);
    var r = by(commRows(), 'id', id); if (!r) return bad('notfound');
    if (r.st !== 'failed') return bad('jump');
    var cs = chanState(r.ch), ok = cs.on && cs.st !== 'unavailable';
    var ov = S().comm[id] = { st: ok ? 'delivered' : 'failed', err: ok ? null : M.MSG.integ, tries: (r.tries || 1) + 1, at: nowS(), by: empId(ctx) };
    M.audit('NOTIF.RETRY', ctx, { module: 'notification', rec: id, before: 'failed', after: ov.st, result: ok ? 'ok' : 'failed' }); save();
    return ok ? { ok: true, row: by(commRows(), 'id', id) } : bad('invalid', M.MSG.integ, { row: by(commRows(), 'id', id) });
  };
  // Test send (§67): an internal template never goes to a client; a client message carries only that client's data.
  M.sendTest = function (ctx, id, to) {
    if (!can(ctx, 'sys11.notif.manage')) return deny(ctx, 'sys11.notif.manage', id);
    var t = by(S().tpl, 'id', id); if (!t) return bad('notfound');
    to = to || {};
    if (to.cl && t.aud !== 'client') { M.audit('NOTIF.TEST', ctx, { module: 'notification', rec: id, after: to.cl, result: 'denied', reason: 'privacy §67' }); return bad('scope', M.MSG.privacy); }
    if (!t.active) return bad('jump');
    var ch = to.ch || t.ch.filter(function (c) { return c !== 'app'; })[0] || 'app'; if (t.ch.indexOf(ch) < 0) return bad('invalid');
    var smp = {}; if (to.cl) { var c = tryf(function () { return M.CM.client(to.cl); }, null); if (!c) return bad('notfound'); smp.client_name = c.n; var p = tryf(function () { return M.CM.propsOf(to.cl)[0]; }, null); if (p) smp.property_name = p.n; }
    var pv = M.preview(ctx, t, 'id', smp), o = { id: nid('ob', 'OB-' + ym() + '-', 3), at: nowS(), ev: t.ev, ch: ch, cl: to.cl || null, to: to.label || (to.cl ? T(smp.client_name) : ctxName(ctx)), rec: id, st: 'pending', err: null, tries: 1, body: pv.body };
    S().out.unshift(o); M.audit('NOTIF.TEST', ctx, { module: 'notification', rec: id, after: { ch: ch, to: o.to } }); save();
    return { ok: true, msg: o, preview: pv };
  };

  /* ---------- NP-10 unified audit (§43–§45, §77) ---------- */
  M.AUDIT_KINDS = [['login', L('Login', 'Login'), /^AUTH\.LOGIN_OK$/], ['failed', L('Login Gagal', 'Failed Login'), /^AUTH\.LOGIN_FAIL$/], ['user', L('User Dibuat', 'User Created'), /^USER\.CREATE$/],
    ['role', L('Role Diubah', 'Role Changed'), /ROLE_CHANGED|^ROLE\./], ['perm', L('Izin Diubah', 'Permission Changed'), /PERM_CHANGED|^PERM\.|^SCOPE\./], ['price', L('Harga Diubah', 'Price Changed'), /^PRICE\.|RATE/],
    ['hpp', L('HPP Diubah', 'HPP Changed'), /^HPP\./], ['invoice', L('Invoice Diubah', 'Invoice Edited'), /^INVOICE\./], ['payment', L('Pembayaran Disetujui', 'Payment Approved'), /^PAYMENT\.APPROVE|^EXPENSE\.APPROVE|^CASH\.APPROVE/],
    ['stock', L('Stok Disesuaikan', 'Stock Adjusted'), /^STOCK\.ADJUST|^OPNAME\./], ['asset', L('Aset Diperbarui', 'Asset Updated'), /^ASSET\.|^DEPRECIATION\./], ['journal', L('Jurnal Diposting', 'Journal Posted'), /^JOURNAL\.POST/],
    ['period', L('Periode Ditutup', 'Period Closed'), /^PERIOD\./], ['master', L('Master Data Diubah', 'Master Data Changed'), /^MASTER\.|^CONFIG\./], ['denied', L('Akses Ditolak', 'Access Denied'), /DENIED/]];
  M.AUDIT_MODULES = [['access', L('Akses & Login', 'Access & Login')], ['system', L('Sistem (Fase 11)', 'System (Phase 11)')], ['performance', L('Kinerja', 'Performance')], ['commercial', L('Komersial', 'Commercial')],
    ['logistics', L('Logistik', 'Logistics')], ['production', L('Produksi', 'Production')], ['delivery', L('Delivery', 'Delivery')], ['finance', L('Finance', 'Finance')], ['client', L('Portal Klien', 'Client Portal')]];
  function ipOf(uid, full) { var h = hash(uid || 'anon'); return full ? '10.20.' + (h % 200 + 10) + '.' + ((h >> 8) % 240 + 10) : '10.20.•••.•••'; }
  function labelOf(ev) {
    var x = X(), m = M.AUDIT[ev] || (x && x.EVENTS[ev]) || (M.FN && M.FN.AUDIT && M.FN.AUDIT[ev]); if (m) return m;
    return L(String(ev).replace(/[._]/g, ' ').toLowerCase().replace(/^\w/, function (c) { return c.toUpperCase(); }));
  }
  function resultOf(e) { return e.result || (/DENIED/.test(e.ev) ? 'denied' : /FAIL|REJECT/.test(e.ev) ? 'failed' : 'ok'); }
  function norm(mod, e, i, fullIp) {
    var at = typeof e.at === 'number' ? e.at : ms(e.at);
    if (mod === 'access') at = M.now() - Math.max(0, X().now() - e.at);
    var uid = e.uid || null, user = e.actor || e.name || e.by || 'system';
    // The id hashes the stored timestamp (access times are re-mapped onto the sim clock per page load).
    var row = { id: mod.slice(0, 3).toUpperCase() + '-' + (hash(mod + e.ev + (mod === 'access' ? e.at : at) + (e.rec || e.target || e.ord || e.batch || e.dlv || '') + (e.from || e.before || '') + (e.to || e.after || '') + user + i)).toString(36).toUpperCase(),
      at: at, atS: isoT(at), user: user, uid: uid, emp: e.emp || (mod === 'finance' || mod === 'production' ? e.by : null), role: e.role || null, action: e.ev, actionN: labelOf(e.ev), module: mod, sub: e.module || null,
      rec: e.rec || e.target || e.ord || e.batch || e.dlv || e.cl || null, before: e.before != null ? e.before : e.from != null ? e.from : null, after: e.after != null ? e.after : e.to != null ? e.to : null,
      device: e.device || (mod === 'access' ? null : 'Desktop'), ip: ipOf(uid || e.emp || e.by, fullIp), reason: e.reason == null ? null : T(e.reason), result: resultOf(e) };
    return row;
  }
  function sources() {
    var out = [];
    var take = function (mod, fn) { var list = tryf(fn, []); if (Array.isArray(list)) out.push([mod, list]); };
    if (X()) take('access', function () { return X().auditLog(); });
    take('system', function () { return S().audit; });
    take('performance', function () { return M.P && M.P.auditLog ? M.P.auditLog() : []; });
    take('commercial', function () { return M.CM.auditLog(); });
    take('logistics', function () { return M.LG.auditLog(); });
    take('production', function () { return M.PR.auditLog(); });
    take('delivery', function () { return M.DL.auditLog(); });
    take('finance', function () { return M.FN.auditLog(); });
    take('client', function () { return M.CLP && typeof M.CLP.auditLog === 'function' ? M.CLP.auditLog() : []; });
    // Phase 12 hook: later engines register [module, fn → entries] here from their own install (guarded, read-only).
    (M.AUDIT_SOURCES || []).forEach(function (s) { if (s && typeof s[1] === 'function') take(s[0], s[1]); });
    return out;
  }
  M.AUDIT_SOURCES = M.AUDIT_SOURCES || [];
  // Read-only: there is no function that deletes or edits audit history.
  M.auditAll = function (ctx, f) {
    if (!can(ctx, 'sys11.audit.view')) return [];
    f = f || {}; var full = can(ctx, 'sys11.security.manage'), rows = [], q = str(f.q).toLowerCase(), kind = f.kind ? by(M.AUDIT_KINDS.map(function (k) { return { k: k[0], re: k[2] }; }), 'k', f.kind) : null;
    // Stable ids: every engine stores its trail newest-first (unshift), so the ordinal counts from the oldest entry and ids survive new events.
    sources().forEach(function (s) { if (f.module && s[0] !== f.module) return; var n = s[1].length; s[1].forEach(function (e, i) { rows.push(norm(s[0], e, n - 1 - i, full)); }); });
    var from = f.from ? ms(f.from) : null, to = f.to ? ms(f.to) + DAY : null;
    rows = rows.filter(function (r) {
      return (!f.uid || r.uid === f.uid || r.rec === f.uid) && (!f.user || String(r.user).toLowerCase().indexOf(String(f.user).toLowerCase()) >= 0) && (!f.action || r.action.indexOf(f.action) === 0) && (!kind || kind.re.test(r.action)) &&
        (!f.result || r.result === f.result) && (from == null || r.at >= from) && (to == null || r.at < to) && (!f.rec || r.rec === f.rec) && (!q || (r.action + ' ' + r.user + ' ' + (r.rec || '') + ' ' + (r.reason || '')).toLowerCase().indexOf(q) >= 0);
    }).sort(function (a, b) { return b.at - a.at; });
    return f.limit ? rows.slice(0, f.limit) : rows;
  };
  M.auditDetail = function (ctx, id) {
    if (!can(ctx, 'sys11.audit.view')) return null;
    var r = by(M.auditAll(ctx), 'id', id); if (!r) return null;
    return Object.assign({ related: M.auditAll(ctx, { rec: r.rec }).filter(function (x2) { return x2.id !== id; }).slice(0, 10) }, r);
  };
  M.auditSummary = function (ctx) {
    if (!can(ctx, 'sys11.audit.view')) return null;
    var rows = M.auditAll(ctx), t = M.now();
    return { total: rows.length, today: rows.filter(function (r) { return t - r.at < DAY; }).length, denied: rows.filter(function (r) { return r.result === 'denied'; }).length, failed: rows.filter(function (r) { return r.result === 'failed'; }).length,
      byModule: M.AUDIT_MODULES.map(function (m) { return { k: m[0], n: m[1], count: rows.filter(function (r) { return r.module === m[0]; }).length }; }) };
  };

  /* ---------- Security settings (§46) ---------- */
  M.SEC_RULES = { minPassword: [8, 32], maxFailed: [3, 10], lockMinutes: [5, 1440], idleMin: [5, 240], rememberH: [1, 24], resetMin: [10, 120], expiryDays: [7, 365], suspendDays: [7, 365] };
  function applyPolicy() {
    var x = X(); if (!x) return; var d = secCur();
    x.POLICY.minPassword = d.minPassword; x.POLICY.maxFailed = d.maxFailed; x.POLICY.lockMinutes = d.lockMinutes; x.POLICY.idle = d.idleMin * MIN; x.POLICY.idleRemember = d.rememberH * 60 * MIN; x.POLICY.resetTtl = d.resetMin * MIN;
    x.MSG.pw_short = L('Password minimal ' + d.minPassword + ' karakter.', 'Password must be at least ' + d.minPassword + ' characters.');
  }
  M.applyPolicy = applyPolicy;
  M.security = function (ctx) {
    if (!can(ctx, 'sys11.security.view')) return null;
    var s = S().sec, x = X();
    return { cur: clone(secCur()), v: s[s.length - 1].v, eff: s[s.length - 1].eff, versions: s.slice().reverse(), rules: M.SEC_RULES,
      applied: x ? { minPassword: x.POLICY.minPassword, maxFailed: x.POLICY.maxFailed, lockMinutes: x.POLICY.lockMinutes, idleMin: Math.round(x.POLICY.idle / MIN), rememberH: Math.round(x.POLICY.idleRemember / 36e5), resetMin: Math.round(x.POLICY.resetTtl / MIN), otp: x.POLICY.otp } : null };
  };
  M.setSecurity = function (ctx, patch, reason) {
    if (!can(ctx, 'sys11.security.manage')) return deny(ctx, 'sys11.security.manage', 'SECURITY');
    var r0 = needReason(reason); if (r0) return r0;
    patch = patch || {}; var c0 = secCur(), d = Object.assign({}, c0), errs = {};
    if (patch.enforce != null && patch.enforce !== 'server') return bad('invalid', L('Penegakan izin di server tidak bisa dimatikan (§47).', 'Server-side permission enforcement cannot be turned off (§47).'));
    Object.keys(patch).forEach(function (k) {
      if (M.SEC_RULES[k]) { var v = patch[k], rg = M.SEC_RULES[k]; if (typeof v !== 'number' || Math.round(v) !== v || v < rg[0] || v > rg[1]) errs[k] = L(rg[0] + '–' + rg[1], rg[0] + '–' + rg[1]); else d[k] = v; }
      else if (/^mask/.test(k) && k in c0) { if (typeof patch[k] !== 'boolean') errs[k] = L('Ya/Tidak', 'Yes/No'); else d[k] = patch[k]; }
      else if (k !== 'enforce') errs[k] = L('Tidak dikenal', 'Unknown');
    });
    if (Object.keys(errs).length) return bad('invalid', null, { errs: errs });
    var diff = Object.keys(d).filter(function (k) { return d[k] !== c0[k]; }); if (!diff.length) return bad('invalid', L('Tidak ada perubahan.', 'Nothing changed.'));
    var s = S().sec; s.push({ v: s[s.length - 1].v + 1, eff: M.today(), by: empId(ctx), byName: ctxName(ctx), at: nowS(), reason: Ln(T(reason)), data: d });
    applyPolicy();
    var before = {}, after = {}; diff.forEach(function (k) { before[k] = c0[k]; after[k] = d[k]; });
    M.audit('SECURITY.CHANGE', ctx, { module: 'security', rec: 'policy v' + s[s.length - 1].v, before: before, after: after, reason: reason }); save();
    return { ok: true, sec: M.security(ctx) };
  };

  /* ---------- Security alerts & governance (§48) ---------- */
  M.ALERT_KINDS = { failed: L('Login gagal beruntun', 'Failed login burst'), locked: L('User terkunci', 'Locked user'), priv: L('Perubahan privileged', 'Privileged change'), expired: L('Akses kedaluwarsa masih aktif', 'Expired access still active'),
    cred: L('Kredensial integrasi', 'Integration credential'), sod: L('Pemisahan tugas (§63)', 'Segregation of duties (§63)') };
  function detect() {
    var x = X(), out = [], t = M.today(), s = S();
    if (!x) return out;
    internalUsers().forEach(function (u) {
      var stt = acctStatus(u), w = windowOf(u.id), n = x.fullName(u);
      if (stt === 'locked') out.push({ id: 'SA-LOCK-' + u.id, kind: 'locked', sev: 'warn', at: (lastLogin(u.id) || {}).at || nowS(), t: L('User terkunci', 'Locked user'), c: L(n + ' terkunci setelah login gagal berulang.', n + ' is locked after repeated failed sign-ins.'), rec: u.id, s: 'ADM-002' });
      if (w.code === 'expired_access' && x.account(u.id).status === 'active') out.push({ id: 'SA-EXP-' + u.id, kind: 'expired', sev: 'crit', at: w.end + ' 23:59', t: L('Akses kedaluwarsa masih aktif', 'Expired access still active'), c: L(n + ' · akses berakhir ' + w.end + ', akun masih aktif.', n + ' · access ended ' + w.end + ', account still active.'), rec: u.id, s: 'ADM-002' });
      var roles = x.account(u.id).roles.map(function (r) { return r.k; });
      if (roles.length && roles.every(isAdminRole) && effPerms(u.id).some(M.isBusinessApproval)) out.push({ id: 'SA-SOD-' + u.id, kind: 'sod', sev: 'crit', at: nowS(), t: L('Admin memegang hak persetujuan bisnis', 'Admin holds business approval rights'), c: L(n + ' · ' + effPerms(u.id).filter(M.isBusinessApproval).join(', '), n + ' · ' + effPerms(u.id).filter(M.isBusinessApproval).join(', ')), rec: u.id, s: 'ADM-002' });
    });
    var fails = {};
    x.auditLog().filter(function (e) { return e.ev === 'AUTH.LOGIN_FAIL' && x.now() - e.at < DAY; }).forEach(function (e) { var k = e.uid || ('?' + e.actor); (fails[k] = fails[k] || []).push(e); });
    Object.keys(fails).forEach(function (k) { var l = fails[k]; if (l.length >= 3) { var u = x.user(k), n = u ? x.fullName(u) : k.slice(1); out.push({ id: 'SA-FAIL-' + k.replace(/[^A-Za-z0-9]/g, '') + '-' + iso(M.now()).replace(/-/g, ''), kind: 'failed', sev: l.length >= x.POLICY.maxFailed ? 'crit' : 'warn', at: isoT(M.now() - Math.max(0, x.now() - l[0].at)), t: L('Percobaan login gagal beruntun', 'Repeated failed sign-ins'), c: L(l.length + ' percobaan gagal · ' + n, l.length + ' failed attempts · ' + n), rec: u ? u.id : null, s: 'SEC-002' }); } });
    s.integ.forEach(function (ig) { if (!ig.cred || ig.future) return; var d = dayDiff(t, ig.cred.exp); if (d <= 30) out.push({ id: 'SA-CRED-' + ig.id + '-' + ig.cred.exp, kind: 'cred', sev: d <= 14 ? 'crit' : 'warn', at: nowS(), t: L('Kredensial integrasi segera berakhir', 'Integration credential expiring'), c: L(ig.n + ' · ' + (d < 0 ? 'berakhir ' + (-d) + ' hari lalu' : d + ' hari lagi') + ' (••••' + ig.cred.last4 + ')', ig.n + ' · ' + (d < 0 ? 'expired ' + (-d) + ' days ago' : d + ' days left') + ' (••••' + ig.cred.last4 + ')'), rec: ig.id, s: 'INT-002' }); });
    s.audit.filter(function (e) { return (e.ev === 'ROLE.APPROVE' || e.ev === 'ROLE.ASSIGN') && e.result === 'ok' && /owner|finance|superadmin|sysadmin/.test(e.after || ''); }).slice(0, 10).forEach(function (e) {
      out.push({ id: 'SA-PRIV-' + e.id, kind: 'priv', sev: 'warn', at: e.at, t: L('Perubahan role privileged', 'Privileged role change'), c: L(e.rec + ' · ' + (e.after || '') + ' oleh ' + e.actor, e.rec + ' · ' + (e.after || '') + ' by ' + e.actor), rec: e.rec, s: 'SEC-003' });
    });
    return out;
  }
  M.secAlerts = function (ctx, f) {
    if (!can(ctx, 'sys11.security.view')) return [];
    f = f || {}; var s = S();
    var all = detect().concat(s.alerts.map(function (a) { return Object.assign({ s: 'SYS-004' }, a); })).map(function (a) {
      var o = s.alertSt[a.id], stt = o ? o.st : (a.st || 'open');
      return Object.assign({}, a, { st: stt, note: o ? o.note : a.note || null, by: o ? o.by : a.by || null, stAt: o ? o.at : null, kindN: M.ALERT_KINDS[a.kind] || L(a.kind) });
    });
    return all.filter(function (a) { return (!f.st || (f.st === 'open' ? a.st !== 'resolved' : a.st === f.st)) && (!f.sev || a.sev === f.sev) && (!f.kind || a.kind === f.kind); })
      .sort(function (a, b) { return (a.st === 'resolved') - (b.st === 'resolved') || (a.sev === 'crit' ? 0 : 1) - (b.sev === 'crit' ? 0 : 1) || (a.at < b.at ? 1 : -1); });
  };
  function alertAct(to, ev) {
    return function (ctx, id, note) {
      if (!can(ctx, 'sys11.security.manage')) return deny(ctx, 'sys11.security.manage', id);
      var a = by(M.secAlerts(ctx), 'id', id); if (!a) return bad('notfound');
      if (to === 'resolved') { var r0 = needReason(note); if (r0) return r0; }
      if (a.st === 'resolved' || a.st === to) return bad('jump');
      S().alertSt[id] = { st: to, note: note ? Ln(T(note)) : null, by: empId(ctx), at: nowS() };
      M.audit(ev, ctx, { module: 'security', rec: id, before: a.st, after: to, reason: note || null }); save();
      return { ok: true, alert: by(M.secAlerts(ctx), 'id', id) };
    };
  }
  M.ackAlert = alertAct('ack', 'ALERT.ACK');
  M.resolveAlert = alertAct('resolved', 'ALERT.RESOLVE');
  M.governance = function (ctx) {
    if (!can(ctx, 'sys11.security.view')) return null;
    var x = X(), rv = M.accessReview(Object.assign({}, ctx, { perms: (ctx.perms || []).concat(['sys11.users.view']) })), al = M.secAlerts(ctx, { st: 'open' }), t = M.now();
    var aud = M.auditAll(Object.assign({}, ctx, { perms: (ctx.perms || []).concat(['sys11.audit.view']) }));
    var permCh = aud.filter(function (r) { return /PERM|ROLE|SCOPE/.test(r.action) && r.result === 'ok' && t - r.at < 7 * DAY; });
    var failed = aud.filter(function (r) { return r.action === 'AUTH.LOGIN_FAIL' && t - r.at < DAY; });
    var camps = S().camps.filter(function (c) { return c.st === 'open'; });
    return { privileged: rv.counts.privileged, reviewDue: rv.counts.review, campaignsOpen: camps.length, campaignsOverdue: camps.filter(function (c) { return c.due < M.today(); }).length, expired: rv.counts.expired, temporary: rv.counts.temporary,
      alerts: { open: al.length, crit: al.filter(function (a) { return a.sev === 'crit'; }).length }, permChanges: permCh.length, failedLogins: failed.length,
      locked: internalUsers().filter(function (u) { return acctStatus(u) === 'locked'; }).length,
      lists: { alerts: al.slice(0, 5), permChanges: permCh.slice(0, 5), failed: failed.slice(0, 5), privileged: rv.privileged, review: rv.review.slice(0, 8) } };
  };

  /* ---------- NP-11 integrations & APIs (§49–§52) ---------- */
  M.INT_ST = { healthy: [L('Healthy', 'Healthy'), 'ok'], warning: [L('Warning', 'Warning'), 'warn'], critical: [L('Critical', 'Critical'), 'crit'], disconnected: [L('Disconnected', 'Disconnected'), 'mute'] };
  function credView(c) {
    if (!c) return { type: null, mask: null, exp: null, st: 'none', days: null };
    var d = dayDiff(M.today(), c.exp);
    return { type: c.type, mask: '••••' + c.last4, exp: c.exp, days: d, st: d < 0 ? 'expired' : d <= 30 ? 'expiring' : 'valid' };   // never the secret itself (§50, §52)
  }
  function intView(ig) { return { id: ig.id, n: ig.n, k: ig.k, st: ig.st, stN: M.INT_ST[ig.st][0], tone: M.INT_ST[ig.st][1], future: !!ig.future, disabled: !!ig.disabled, last: ig.last, ok: ig.ok, errAt: ig.errAt, err: ig.err, flow: ig.flow, dir: ig.dir, owner: ig.owner, cred: credView(ig.cred), rate: ig.rate }; }
  M.integrations = function (ctx) { if (!can(ctx, 'sys11.integration.view')) return []; return S().integ.map(intView); };
  M.integration = function (ctx, id) { if (!can(ctx, 'sys11.integration.view')) return null; var ig = integ(id); if (!ig) return null; return Object.assign(intView(ig), { log: S().intLog.filter(function (l) { return l.int === id; }), apis: M.apis(ctx).filter(function (a) { return a.int === id; }) }); };
  M.integSummary = function (ctx) {
    if (!can(ctx, 'sys11.integration.view')) return null;
    var l = S().integ.filter(function (i) { return !i.future; }), n = function (s) { return l.filter(function (i) { return i.st === s; }).length; };
    return { total: l.length, healthy: n('healthy'), warning: n('warning'), critical: n('critical'), disconnected: n('disconnected'), future: S().integ.length - l.length, label: n('healthy') + '/' + l.length };
  };
  function intLog(id, kind, res, msg, ctx) { S().intLog.unshift({ id: 'IL-' + S().seq.il++, int: id, at: nowS(), kind: kind, res: res, msg: msg, by: empId(ctx) }); }
  M.testConnection = function (ctx, id) {
    if (!can(ctx, 'sys11.integration.manage')) return deny(ctx, 'sys11.integration.manage', id);
    var ig = integ(id); if (!ig) return bad('notfound');
    var res, msg, lat = 80 + hash(id + nowS()) % 400;
    if (ig.future) { res = 'future'; msg = L('Integrasi masa depan: belum bisa dites.', 'Future integration: cannot be tested yet.'); }
    else if (ig.disabled || ig.st === 'disconnected' || ig.st === 'critical') { res = 'failed'; msg = ig.err || M.MSG.integ; ig.errAt = nowS(); }
    else if (credView(ig.cred).st === 'expired') { res = 'failed'; msg = L('Kredensial kedaluwarsa.', 'Credentials expired.'); ig.st = 'critical'; ig.errAt = nowS(); ig.err = msg; }
    else if (ig.st === 'warning') { res = 'warning'; msg = L('Terhubung, tetapi ada error terbaru: ' + T(ig.err), 'Connected, but with recent errors: ' + (ig.err ? ig.err[1] : '')); ig.last = nowS(); }
    else { res = 'success'; msg = L('Koneksi berhasil (' + lat + ' ms).', 'Connection OK (' + lat + ' ms).'); ig.last = ig.ok = nowS(); }
    intLog(id, 'test', res, msg, ctx);
    M.audit('INTEGRATION.TEST', ctx, { module: 'integration', rec: id, after: res, result: res === 'failed' ? 'failed' : 'ok' }); save();
    return { ok: res === 'success' || res === 'warning', res: res, msg: msg, latency: res === 'success' || res === 'warning' ? lat : null, integration: intView(ig), code: res === 'failed' || res === 'future' ? 'invalid' : undefined };
  };
  M.retrySync = function (ctx, id, reason) {
    if (!can(ctx, 'sys11.integration.manage')) return deny(ctx, 'sys11.integration.manage', id);
    var ig = integ(id); if (!ig) return bad('notfound');
    if (ig.future) return bad('invalid', L('Integrasi masa depan belum aktif.', 'Future integration is not active yet.'));
    if (ig.st === 'healthy') return bad('jump');
    var before = ig.st, ok = !ig.disabled && ig.st === 'warning' && credView(ig.cred).st !== 'expired';
    if (ok) { ig.st = 'healthy'; ig.last = ig.ok = nowS(); ig.err = null; ig.rate = Math.max(ig.rate || 0, 98.5); }
    else { ig.errAt = nowS(); ig.last = nowS(); }
    var msg = ok ? L('Sinkron ulang berhasil.', 'Re-sync succeeded.') : Ln(T(ig.err || M.MSG.integ));
    intLog(id, 'retry', ok ? 'success' : 'failed', msg, ctx);
    M.audit('INTEGRATION.RETRY', ctx, { module: 'integration', rec: id, before: before, after: ig.st, reason: reason || null, result: ok ? 'ok' : 'failed' }); save();
    return ok ? { ok: true, integration: intView(ig), msg: msg } : bad('invalid', M.MSG.integ, { integration: intView(ig), detail: ig.err });
  };
  M.setIntegrationActive = function (ctx, id, on, reason) {
    if (!can(ctx, 'sys11.integration.manage')) return deny(ctx, 'sys11.integration.manage', id);
    var ig = integ(id); if (!ig) return bad('notfound');
    var r0 = needReason(reason); if (r0) return r0;
    if (ig.future) return bad('invalid');
    if (!!ig.disabled === !on) return bad('jump');
    var before = ig.st;
    if (!on) { ig.disabled = true; ig.prevSt = ig.st; ig.st = 'disconnected'; ig.err = L('Dinonaktifkan oleh admin.', 'Disabled by an admin.'); }
    else { ig.disabled = false; ig.st = ig.prevSt === 'healthy' ? 'warning' : (ig.prevSt || 'warning'); ig.err = L('Diaktifkan kembali: jalankan tes koneksi.', 'Re-enabled: run a connection test.'); }
    intLog(id, on ? 'enable' : 'disable', 'success', Ln(T(reason)), ctx);
    M.audit('INTEGRATION.STATUS', ctx, { module: 'integration', rec: id, before: before, after: ig.st, reason: reason }); save();
    return { ok: true, integration: intView(ig) };
  };
  var API_INT = { 'Payment Webhook': 'INT-PAY', 'WhatsApp Send': 'INT-WA', 'Email SMTP': 'INT-EMAIL', 'Maps Geocoding': 'INT-MAPS', 'Scale Reader': 'INT-SCALE' };
  M.apis = function (ctx) {
    if (!can(ctx, 'sys11.integration.view')) return [];
    return D.APIS.map(function (a, i) { var ig = API_INT[a[0]] ? integ(API_INT[a[0]]) : null, stv = ig ? (ig.st === 'disconnected' ? 'critical' : ig.st) : a[3];
      return { id: 'API-' + String(i + 1).padStart(2, '0'), n: a[0], pur: L(a[1], a[2]), st: stv, stN: M.INT_ST[stv][0], tone: M.INT_ST[stv][1], last: ig && ig.last > a[4] ? ig.last : a[4], err: ig && ig.st === 'healthy' && a[5] > 1 ? 0.5 : a[5], auth: a[6], owner: a[7], int: ig ? ig.id : null }; });
  };

  /* ---------- Import (§53–§54, §78) and export (§55, §79) ---------- */
  M.IMPORT_TYPES = {
    client: { n: L('Klien', 'Client'), key: 'id', cols: [['id', 'code', 1], ['name', 'str', 1], ['type', 'enum:hotel,villa,resort,spa,restaurant,other', 1], ['city', 'str', 0], ['terms', 'int', 0], ['email', 'email', 0]] },
    item: { n: L('Item', 'Item'), key: 'code', cols: [['code', 'code', 1], ['name', 'str', 1], ['category', 'enum:towel,white,flat,uniform,spa,fnb,guest,other', 1], ['weight_kg', 'num', 1], ['unit', 'ref:unit', 1], ['service', 'ref:service', 0]] },
    supplier: { n: L('Supplier', 'Supplier'), key: 'id', cols: [['id', 'code', 1], ['name', 'str', 1], ['category', 'str', 1], ['phone', 'str', 0], ['city', 'str', 0], ['term_days', 'int', 0]] },
    price: { n: L('Harga', 'Price'), key: 'service', cols: [['service', 'ref:service', 1], ['price', 'num', 1], ['effective', 'date', 1], ['reason', 'str', 1]] },
    opening: { n: L('Stok Awal', 'Opening Inventory'), key: 'code', cols: [['code', 'ref:stock', 1], ['qty', 'num', 1], ['unit_cost', 'num', 1], ['location', 'str', 0]] },
    asset: { n: L('Aset', 'Assets'), key: 'code', cols: [['code', 'code', 1], ['name', 'str', 1], ['category', 'enum:machine,vehicle,it,furniture,building,other', 1], ['acquired', 'date', 1], ['cost', 'num', 1], ['life_months', 'int', 1], ['plant', 'ref:plant', 1]] }
  };
  M.importSample = function (type) {
    var S0 = {
      client: 'id,name,type,city,terms,email\nCL-21,Villa Lumbung Sari,villa,Ubud,30,finance@lumbungsari.id\nCL-22,Taman Spa Seminyak,spa,Seminyak,,\nCL-01,Grand Vista Hotel,hotel,Nusa Dua,30,ap@grandvista.id\nCL-23,,resort,Sanur,abc,not-an-email',
      item: 'code,name,category,weight_kg,unit,service\nIT-RBE-01,Bathrobe Premium,spa,1.10,pcs,SV-007\nIT-NPK-02,Napkin Restoran,fnb,0.05,pcs,\nIT-DUV-03,Duvet King,white,6.5,pcs,SV-006\nIT-BTW-01,Handuk Mandi,towel,0.60,kg,SV-008\nIT-XXX-09,Item Tanpa Satuan,other,-1,box9,SV-999',
      supplier: 'id,name,category,phone,city,term_days\nSUP-21,CV Linen Dewata,linen,+62 361 455 120,Denpasar,30\nSUP-22,PT Kimia Bersih,chemical,,,\nSUP-01,PT Ecolab Indonesia,chemical,+62 361 470 221,Denpasar,30',
      price: 'service,price,effective,reason\nSV-001,7800,2026-11-01,Penyesuaian tarif listrik\nSV-002,15000,2026-11-01,Kenaikan biaya express\nSV-404,9000,2026-11-01,Layanan tidak ada\nSV-005,30000,2026-01-01,Tanggal mundur',
      opening: 'code,qty,unit_cost,location\nCHM-DET-01,420,36500,GD-UBD-A1\nCHM-XXX-99,10,1000,GD-UBD-A1\nCHM-DET-01,5,36500,GD-GNY-B1',
      asset: 'code,name,category,acquired,cost,life_months,plant\nAST-D09,Dryer 35 kg Gianyar,machine,2026-09-15,185000000,96,PL-02\nAST-IT01,Laptop Admin Sistem,it,2026-08-01,14500000,36,PL-01\nAST-W01,Washer Extractor 60 kg,machine,2021-03-15,420000000,120,PL-01\nAST-V09,Van Baru,vehicle,2026-13-01,0,60,PL-09'
    };
    return S0[type] || null;
  };
  function parseCsv(text) {
    return String(text || '').replace(/\r/g, '').split('\n').filter(function (l) { return str(l); }).map(function (l) {
      var out = [], cur0 = '', q = false;
      for (var i = 0; i < l.length; i++) { var ch = l[i]; if (ch === '"') { if (q && l[i + 1] === '"') { cur0 += '"'; i++; } else q = !q; } else if (ch === ',' && !q) { out.push(cur0); cur0 = ''; } else cur0 += ch; }
      out.push(cur0); return out.map(str);
    });
  }
  function refExists(ref, v) {
    if (ref === 'unit') return activeMaster('unit', v);
    if (ref === 'plant') return activeMaster('plant', v);
    if (ref === 'service') return !!tryf(function () { return M.CM.service(v); }, null);
    if (ref === 'stock') return !!tryf(function () { return by(M.FN.state().stock, 'code', v); }, null);
    return false;
  }
  function existsInSystem(type, v) {
    if (type === 'client') return !!tryf(function () { return M.CM.client(v); }, null);
    if (type === 'item') return !!tryf(function () { return M.FN.item(v); }, null);
    if (type === 'supplier') return !!tryf(function () { return M.FN.supplier(v); }, null);
    if (type === 'asset') return !!tryf(function () { return by(M.FN.state().assets, 'code', v); }, null);
    return false;
  }
  function validateRows(type, rows) {
    var def = M.IMPORT_TYPES[type], head = rows[0].map(function (h) { return h.toLowerCase(); }), out = [], seen = {};
    rows.slice(1).forEach(function (r, i) {
      var d = {}, errs = [], warns = [];
      def.cols.forEach(function (c) {
        var v = r[head.indexOf(c[0])]; v = v == null ? '' : v; d[c[0]] = v;
        if (!v) { if (c[2]) errs.push(L(c[0] + ' wajib diisi', c[0] + ' is required')); else warns.push(L(c[0] + ' kosong', c[0] + ' is empty')); return; }
        var t = c[1];
        if (t === 'code' && !/^[A-Za-z0-9._-]{2,20}$/.test(v)) errs.push(L(c[0] + ' format kode salah', c[0] + ' has a wrong code format'));
        if ((t === 'num' || t === 'int') && (isNaN(+v) || (t === 'int' && Math.round(+v) !== +v))) errs.push(L(c[0] + ' harus angka', c[0] + ' must be a number'));
        else if ((t === 'num' || t === 'int') && +v <= 0 && c[0] !== 'qty') errs.push(L(c[0] + ' harus > 0', c[0] + ' must be > 0'));
        if (t === 'email' && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v)) errs.push(L('format email salah', 'wrong email format'));
        if (t === 'date' && !isDate(v)) errs.push(L(c[0] + ' bukan tanggal (YYYY-MM-DD)', c[0] + ' is not a date (YYYY-MM-DD)'));
        if (/^enum:/.test(t) && t.slice(5).split(',').indexOf(v.toLowerCase()) < 0) errs.push(L(c[0] + ' tidak dikenal: ' + v, c[0] + ' unknown: ' + v));
        if (/^ref:/.test(t) && !refExists(t.slice(4), v)) errs.push(L(c[0] + ' referensi tidak dikenal: ' + v, c[0] + ' unknown reference: ' + v));
      });
      var key = d[def.key];
      if (key && seen[key] && type !== 'price') errs.push(L('duplikat di file (baris ' + seen[key] + ')', 'duplicate in file (row ' + seen[key] + ')'));
      if (key && existsInSystem(type, key)) errs.push(L('sudah ada di sistem — tidak ditimpa', 'already exists in the system — not overwritten'));
      if (key && !seen[key]) seen[key] = i + 2;
      if (type === 'item' && +d.weight_kg > 5) warns.push(L('berat > 5 kg, periksa kembali', 'weight > 5 kg, double-check'));
      if (type === 'price' && isDate(d.effective) && d.effective < M.today()) errs.push(L('tanggal efektif mundur', 'effective date in the past'));
      if (type === 'price' && !errs.length) { var curP = tryf(function () { return M.CM.service(d.service).price; }, null); if (curP && Math.abs(+d.price - curP) / curP > 0.2) warns.push(L('perubahan > 20% dari harga master', 'change > 20% vs the master price')); }
      if (type === 'opening' && +d.qty === 0) warns.push(L('qty 0', 'qty 0'));
      out.push({ n: i + 2, data: d, st: errs.length ? 'error' : warns.length ? 'warning' : 'valid', errs: errs, warns: warns });
    });
    return out;
  }
  function impView(b) { return Object.assign({}, b, { typeN: M.IMPORT_TYPES[b.type].n }); }
  M.importValidate = function (ctx, type, text, file) {
    if (!can(ctx, 'sys11.import')) return deny(ctx, 'sys11.import', 'IMPORT ' + type);
    var def = M.IMPORT_TYPES[type]; if (!def) return bad('notfound');
    var rows = parseCsv(text); if (rows.length < 2) return bad('invalid', L('File kosong atau tanpa baris data.', 'The file is empty or has no data rows.'));
    var head = rows[0].map(function (h) { return h.toLowerCase(); }), miss = def.cols.filter(function (c) { return c[2] && head.indexOf(c[0]) < 0; }).map(function (c) { return c[0]; });
    if (miss.length) return bad('invalid', L('Kolom wajib tidak ada: ' + miss.join(', '), 'Required columns missing: ' + miss.join(', ')), { missing: miss });
    if (rows.length - 1 > (+M.cfgGet('th.importMaxRows') || 500)) return bad('invalid', L('Terlalu banyak baris.', 'Too many rows.'));
    var res = validateRows(type, rows), n = function (s) { return res.filter(function (r) { return r.st === s; }).length; };
    var b = { id: nid('imp', 'IMP-' + ym() + '-', 3), type: type, file: str(file) || (type + '.csv'), by: empId(ctx), byName: ctxName(ctx), at: nowS(), st: 'validated', rows: res, total: res.length, valid: n('valid'), warning: n('warning'), error: n('error'), imported: 0, rejected: 0, target: null };
    S().imports.unshift(b);
    M.audit('IMPORT.VALIDATE', ctx, { module: 'import', rec: b.id, after: { file: b.file, type: type, total: b.total, valid: b.valid, warning: b.warning, error: b.error } }); save();
    return { ok: true, batch: impView(b) };
  };
  M.imports = function (ctx) { if (!can(ctx, 'sys11.import') && !can(ctx, 'sys11.audit.view')) return []; return S().imports.map(function (b) { var v = impView(b); delete v.rows; return v; }); };
  M.importBatch = function (ctx, id) { if (!can(ctx, 'sys11.import') && !can(ctx, 'sys11.audit.view')) return null; var b = by(S().imports, 'id', id); return b ? impView(b) : null; };
  // Never import blindly (§54): only a validated batch, only rows without errors (warnings are flagged but importable); rejected rows are counted.
  M.importConfirm = function (ctx, id, reason) {
    if (!can(ctx, 'sys11.import')) return deny(ctx, 'sys11.import', id);
    var b = by(S().imports, 'id', id); if (!b) return bad('notfound');
    if (b.st !== 'validated') return bad('jump');
    var good = b.rows.filter(function (r) { return r.st !== 'error'; });
    if (!good.length) return bad('invalid', M.MSG.importErr, { error: b.error });
    var stg = S().staged[b.type] = S().staged[b.type] || [];
    good.forEach(function (r) { stg.push({ key: r.data[M.IMPORT_TYPES[b.type].key], data: r.data, batch: b.id, at: nowS(), st: 'staged', warn: r.warns.length > 0 }); });
    b.st = 'imported'; b.imported = good.length; b.rejected = b.rows.length - good.length; b.target = 'staged'; b.confAt = nowS(); b.confBy = empId(ctx);
    M.audit('IMPORT.CONFIRM', ctx, { module: 'import', rec: b.id, after: { file: b.file, rows: b.total, valid: b.valid, warning: b.warning, error: b.error, imported: b.imported, rejected: b.rejected, target: 'staged' }, reason: reason || null }); save();
    return { ok: true, batch: impView(b), imported: b.imported, rejected: b.rejected, target: 'staged' };
  };
  M.importCancel = function (ctx, id, reason) {
    if (!can(ctx, 'sys11.import')) return deny(ctx, 'sys11.import', id);
    var b = by(S().imports, 'id', id); if (!b) return bad('notfound');
    if (b.st !== 'validated') return bad('jump');
    b.st = 'cancelled'; b.rejected = b.total; M.audit('IMPORT.CANCEL', ctx, { module: 'import', rec: id, reason: reason || null }); save();
    return { ok: true, batch: impView(b) };
  };
  M.staged = function (ctx, type) { if (!can(ctx, 'sys11.import') && !can(ctx, 'sys11.master.view')) return []; return (S().staged[type] || []).slice(); };
  M.EXPORT_TYPES = {
    client: { n: L('Klien', 'Clients'), perm: 'com.client.view', sens: false }, orders: { n: L('Order', 'Orders'), perm: 'lg.order.view', sens: false }, invoices: { n: L('Invoice', 'Invoices'), perm: 'ar.view', sens: true },
    inventory: { n: L('Persediaan', 'Inventory'), perm: 'inv.view', sens: false }, supplier: { n: L('Supplier', 'Suppliers'), perm: 'sup.view', sens: false }, asset: { n: L('Aset', 'Assets'), perm: 'ast.view', sens: true },
    audit: { n: L('Audit Log', 'Audit Log'), perm: 'sys11.audit.view', sens: true }, users: { n: L('User Internal', 'Internal Users'), perm: 'sys11.users.view', sens: true }
  };
  M.exportTypes = function (ctx) { return Object.keys(M.EXPORT_TYPES).map(function (k) { var e = M.EXPORT_TYPES[k]; return { k: k, n: e.n, perm: e.perm, sens: e.sens, allowed: can(ctx, 'sys11.export') && can(ctx, e.perm) }; }); };
  function csv(rows) { return rows.map(function (r) { return r.map(function (v) { v = v == null ? '' : String(Array.isArray(v) ? v[0] : v); return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; }).join(','); }).join('\n'); }
  M.exportData = function (ctx, type, f) {
    var e = M.EXPORT_TYPES[type]; if (!e) return bad('notfound');
    if (!can(ctx, 'sys11.export')) return deny(ctx, 'sys11.export', 'EXPORT ' + type);
    if (!can(ctx, e.perm)) return deny(ctx, e.perm, 'EXPORT ' + type);
    f = f || {}; var rows = [];
    var inR = function (d) { d = String(d || '').slice(0, 10); return (!f.from || d >= f.from) && (!f.to || d <= f.to); };
    if (type === 'client') rows = [['id', 'name', 'type', 'city', 'status', 'terms']].concat(tryf(function () { return M.CM.state().clients; }, []).filter(function (c) { return !f.cl || c.id === f.cl; }).map(function (c) { return [c.id, c.n, c.type, c.city, c.status, c.terms]; }));
    if (type === 'orders') rows = [['id', 'client', 'property', 'kind', 'date', 'status', 'bags', 'kg']].concat(tryf(function () { return M.LG.state().orders; }, []).filter(function (o) { return (!f.cl || o.cl === f.cl) && inR(o.date) && (!f.st || o.st === f.st); }).map(function (o) { return [o.id, o.cl, o.prop, o.kind, o.date, o.st, o.bags, o.kg]; }));
    if (type === 'invoices') rows = [['id', 'client', 'period', 'issued', 'due', 'total', 'status']].concat(tryf(function () { return M.FN.state().inv; }, []).filter(function (i) { return (!f.cl || i.cl === f.cl) && inR(i.issued) && (!f.st || M.FN.invSt(i) === f.st); }).map(function (i) { return [i.id, i.cl, i.period, i.issued, i.due, i.total, M.FN.invSt(i)]; }));
    if (type === 'inventory') rows = [['code', 'name', 'unit', 'qty', 'min', 'avg_cost', 'location']].concat(tryf(function () { return M.FN.state().stock; }, []).map(function (s) { return [s.code, s.n, s.unit, s.qty, s.min, s.avg, s.loc]; }));
    if (type === 'supplier') rows = [['id', 'name', 'category', 'city', 'term', 'status']].concat(tryf(function () { return M.FN.state().sups; }, []).map(function (s) { return [s.id, s.n, s.cat, s.city, s.term, s.st]; }));
    if (type === 'asset') rows = [['code', 'name', 'category', 'acquired', 'cost', 'location', 'status']].concat(tryf(function () { return M.FN.state().assets; }, []).map(function (a) { return [a.code, a.n, a.cat, a.acq, a.cost, a.loc, a.st]; }));
    if (type === 'audit') rows = [['id', 'at', 'user', 'role', 'action', 'module', 'record', 'before', 'after', 'reason', 'result']].concat(M.auditAll(ctx, { module: f.module, from: f.from, to: f.to }).map(function (r) { return [r.id, r.atS, r.user, r.role, r.action, r.module, r.rec, r.before, r.after, r.reason, r.result]; }));
    if (type === 'users') rows = [['id', 'username', 'name', 'email', 'dept', 'position', 'branch', 'roles', 'status', 'last_login', 'access_end']].concat(M.users(ctx).map(function (r) { return [r.id, r.u, r.name, r.email, r.dept, r.pos, r.branch, r.roles.join(' '), r.status, r.lastLogin, r.end]; }));
    var x = { id: nid('xpt', 'XPT-' + ym() + '-', 3), type: type, module: T(e.n), by: empId(ctx), byName: ctxName(ctx), at: nowS(), filters: clone(f), count: rows.length - 1, sens: e.sens, file: type + '-' + M.today() + '.csv' };
    S().exports.unshift(x);
    M.audit('EXPORT', ctx, { module: 'export', rec: x.id, after: { module: type, filters: f, count: x.count, sens: e.sens } }); save();
    return { ok: true, csv: csv(rows), count: x.count, file: x.file, log: x };
  };
  M.exports = function (ctx) { if (!can(ctx, 'sys11.export') && !can(ctx, 'sys11.audit.view')) return []; return S().exports.slice(); };

  /* ---------- System health (§56) ---------- */
  var RANK = { healthy: 0, warning: 1, critical: 2 };
  function worst(a) { return a.reduce(function (w, s) { return RANK[s] > RANK[w] ? s : w; }, 'healthy'); }
  M.storage = function () {
    var used = 0, quota = 5 * 1024 * 1024;
    if (ls) { try { for (var i = 0; i < ls.length; i++) { var k = ls.key(i); used += (k.length + (ls.getItem(k) || '').length) * 2; } } catch (e) {} }
    else { [M.X && { st: function () { return M.X.auditLog(); } }, M.CM, M.LG, M.PR, M.DL, M.FN, M.CLP, { state: S }].forEach(function (E) { if (E && E.state) used += tryf(function () { return JSON.stringify(E.state()).length * 2; }, 0); }); }
    return { kb: Math.round(used / 1024), quotaKb: quota / 1024, pct: Math.round(used / quota * 1000) / 10 };
  };
  M.health = function (ctx) {
    if (!can(ctx, 'sys11.health.view')) return null;
    var items = [], st0 = M.storage(), apis = D.APIS.map(function (a, i) { return a; }), ig = M.integSummary({ perms: ['sys11.integration.view'] });
    var engines = [M.X, M.P, M.CM, M.LG, M.PR, M.DL, M.FN].filter(Boolean).length;
    items.push({ k: 'app', n: L('Aplikasi', 'Application'), st: engines >= 7 ? 'healthy' : 'warning', v: engines + (M.CLP ? 1 : 0) + 1 + ' engine', note: L('Semua modul Fase 4–11 termuat.', 'All Phase 4–11 modules loaded.') });
    items.push({ k: 'db', n: L('Database', 'Database'), st: 'healthy', v: ls ? 'localStorage' : 'memory', note: L('Tulis/baca normal.', 'Read/write normal.') });
    var apiV = M.apis({ perms: ['sys11.integration.view'] }), apiCrit = apiV.filter(function (a) { return a.st === 'critical'; }).length, apiWarn = apiV.filter(function (a) { return a.st === 'warning'; }).length;
    items.push({ k: 'api', n: L('API', 'API'), st: apiCrit >= 3 ? 'critical' : apiCrit || apiWarn ? 'warning' : 'healthy', v: (apiV.length - apiCrit - apiWarn) + '/' + apiV.length, note: apiCrit ? L(apiCrit + ' API kritis', apiCrit + ' critical API') : null, s: 'INT-003' });
    var jobs = D.JOBS.map(function (j) { return { id: j[0], n: L(j[1], j[2]), sched: j[3], last: j[4], st: j[5], note: j[6] }; }), jc = jobs.filter(function (j) { return j.st === 'critical'; }).length;
    items.push({ k: 'jobs', n: L('Background Jobs', 'Background Jobs'), st: jc > 1 ? 'critical' : jc || jobs.some(function (j) { return j.st === 'warning'; }) ? 'warning' : 'healthy', v: jobs.filter(function (j) { return j.st === 'healthy'; }).length + '/' + jobs.length, note: jc ? L(jc + ' job gagal', jc + ' job failed') : null });
    var cs = M.commSummary({ perms: ['sys11.notif.view'] }), fr = cs.rate == null ? 0 : 100 - cs.rate, th = +M.cfgGet('th.notifFailWarn') || 10;
    items.push({ k: 'notif', n: L('Notifikasi', 'Notifications'), st: fr >= 25 ? 'critical' : fr >= th ? 'warning' : 'healthy', v: (cs.rate == null ? '—' : cs.rate + '%'), note: L(cs.failed + ' gagal, ' + cs.pending + ' menunggu', cs.failed + ' failed, ' + cs.pending + ' pending'), s: 'NTF-001' });
    var sw = +M.cfgGet('th.storageWarnPct') || 70;
    items.push({ k: 'storage', n: L('Storage', 'Storage'), st: st0.pct >= 90 ? 'critical' : st0.pct >= sw ? 'warning' : 'healthy', v: st0.kb + ' KB · ' + st0.pct + '%', note: null });
    items.push({ k: 'integ', n: L('Integrasi', 'Integrations'), st: ig.critical + ig.disconnected >= 4 ? 'critical' : ig.warning + ig.critical + ig.disconnected ? 'warning' : 'healthy', v: ig.label, note: L(ig.disconnected + ' terputus, ' + ig.warning + ' warning', ig.disconnected + ' disconnected, ' + ig.warning + ' warning'), s: 'INT-001' });
    var ov = worst(items.map(function (i) { return i.st; }));
    items.forEach(function (i) { i.stN = M.INT_ST[i.st][0]; i.tone = M.INT_ST[i.st][1]; });
    return { overall: ov, overallN: M.INT_ST[ov][0], items: items, jobs: jobs, storage: st0, uptime: 99.9 };
  };

  /* ---------- NP-12 Super Admin (§58–§62), backup & retention (§65), KPIs (§71) ---------- */
  M.permIssues = function (ctx) {
    if (!can(ctx, 'sys11.users.view')) return [];
    var out = [];
    M.users(ctx).forEach(function (r) {
      if (r.status === 'active' && !r.roles.length) out.push({ uid: r.id, name: r.name, k: 'norole', n: L('Aktif tanpa role', 'Active without a role') });
      if (r.admin && effPerms(r.id).some(M.isBusinessApproval)) out.push({ uid: r.id, name: r.name, k: 'sod', n: L('Admin dengan hak persetujuan bisnis', 'Admin with business approval rights') });
      if (r.grant.length) out.push({ uid: r.id, name: r.name, k: 'grant', n: L('Izin langsung di luar role', 'Direct grants outside the role') });
      if (r.expired && r.status === 'active') out.push({ uid: r.id, name: r.name, k: 'expired', n: L('Akses berakhir, akun aktif', 'Access ended, account active') });
    });
    return out;
  };
  M.backups = function (ctx) {
    if (!can(ctx, 'sys11.backup.view')) return null;
    var l = S().backups.slice().sort(function (a, b) { return a.at < b.at ? 1 : -1; }), last = l[0], ok = l.filter(function (b) { return b.st === 'success'; })[0];
    var lbl = last ? (last.at.slice(0, 10) === M.today() ? L('Hari ini ' + last.at.slice(11), 'Today ' + last.at.slice(11)) : L(last.at, last.at)) : L('—');
    return { list: l, last: last, lastOk: ok, label: lbl, st: !last ? 'critical' : last.st === 'success' && dayDiff(last.at, M.today()) <= 1 ? 'healthy' : 'warning', schedule: '02:00 WITA' };
  };
  M.runBackup = function (ctx, reason) {
    if (!can(ctx, 'sys11.retention.manage')) return deny(ctx, 'sys11.retention.manage', 'BACKUP');
    var b = { id: 'BKP-' + nowS().replace(/[- :]/g, '') + 'M', at: nowS(), kind: 'manual', st: 'success', size: Math.round((M.storage().kb / 1024 + 410) * 10) / 10, dur: 6, note: reason ? Ln(T(reason)) : null, by: empId(ctx) };
    S().backups.push(b); M.audit('BACKUP.RUN', ctx, { module: 'backup', rec: b.id, after: { size: b.size }, reason: reason || null }); save();
    return { ok: true, backup: b };
  };
  M.RET_ST = { active: L('Aktif', 'Active'), archived: L('Diarsipkan', 'Archived'), historical: L('Historis', 'Historical') };
  M.retention = function (ctx) {
    if (!can(ctx, 'sys11.backup.view')) return null;
    var p = S().retention; return { policies: Object.keys(p).map(function (k) { return clone(p[k]); }), never: Object.keys(p).filter(function (k) { return p[k].never; }), statuses: M.RET_ST };
  };
  M.recordStatus = function (k, date) { var p = S().retention[k]; if (!p) return null; var age = dayDiff(date, M.today()) / 30.4; return age <= p.active ? 'active' : age <= p.active + p.archive ? 'archived' : 'historical'; };
  M.setRetention = function (ctx, k, patch, reason) {
    if (!can(ctx, 'sys11.retention.manage')) return deny(ctx, 'sys11.retention.manage', 'RETENTION ' + k);
    var p = S().retention[k]; if (!p) return bad('notfound');
    var r0 = needReason(reason); if (r0) return r0;
    patch = patch || {};
    if (patch.hardDelete && p.never) return bad('invalid', L(T(p.n) + ' tidak pernah dihapus permanen (§65).', p.n[1] + ' is never hard-deleted (§65).'));
    var ok = ['active', 'archive'].every(function (f) { return patch[f] == null || (typeof patch[f] === 'number' && patch[f] >= 1 && patch[f] <= 120 && Math.round(patch[f]) === patch[f]); }); if (!ok) return bad('invalid');
    if (p.never && patch.active != null && patch.active < 12) return bad('invalid', L('Data wajib simpan minimal 12 bulan aktif.', 'Mandatory records stay active at least 12 months.'));
    var before = clone(p); ['active', 'archive', 'hardDelete'].forEach(function (f) { if (patch[f] != null) p[f] = f === 'hardDelete' ? !!patch[f] : patch[f]; }); p.v += 1;
    M.audit('RETENTION.CHANGE', ctx, { module: 'retention', rec: k, before: { active: before.active, archive: before.archive, hardDelete: before.hardDelete }, after: { active: p.active, archive: p.archive, hardDelete: p.hardDelete }, reason: reason }); save();
    return { ok: true, policy: clone(p) };
  };
  M.kpis = function (ctx) {
    if (!can(ctx, 'sys11.health.view')) return [];
    var full = { perms: ALL11 }, us = M.userSummary(full), x = X(), au = x ? x.auditLog() : [], ok = au.filter(function (e) { return e.ev === 'AUTH.LOGIN_OK'; }).length, fl = au.filter(function (e) { return e.ev === 'AUTH.LOGIN_FAIL'; }).length;
    var iss = uniq(M.permIssues(full).map(function (i) { return i.uid; })).length, cs = M.commSummary(full), igs = S().integ.filter(function (i) { return !i.future; });
    var rows = S().imports.filter(function (b) { return b.st !== 'cancelled'; }), tot = rows.reduce(function (s, b) { return s + b.total; }, 0), err = rows.reduce(function (s, b) { return s + b.error; }, 0);
    var K = function (k, n, v, u, target, good) { return { k: k, n: n, v: v, u: u, target: target, st: v == null ? 'info' : good(v) ? 'ok' : 'warn' }; };
    return [
      K('activeRate', L('Active User Rate', 'Active User Rate'), pct(us.active, us.total), '%', '≥ 85%', function (v) { return v >= 85; }),
      K('loginFail', L('Login Failure Rate', 'Login Failure Rate'), pct(fl, ok + fl), '%', '≤ 5%', function (v) { return v <= 5; }),
      K('accessIssue', L('Access Issue Rate', 'Access Issue Rate'), pct(iss, us.total), '%', '≤ 5%', function (v) { return v <= 5; }),
      K('notifDelivery', L('Notification Delivery %', 'Notification Delivery %'), cs.rate, '%', '≥ 95%', function (v) { return v >= 95; }),
      K('integSuccess', L('Integration Success %', 'Integration Success %'), Math.round(igs.reduce(function (s, i) { return s + (i.rate || 0); }, 0) / igs.length * 10) / 10, '%', '≥ 95%', function (v) { return v >= 95; }),
      K('syncError', L('Sync Error %', 'Sync Error %'), pct(igs.filter(function (i) { return i.err && i.st !== 'healthy'; }).length, igs.length), '%', '≤ 10%', function (v) { return v <= 10; }),
      K('importError', L('Import Error Rate', 'Import Error Rate'), pct(err, tot), '%', '≤ 10%', function (v) { return v <= 10; }),
      K('availability', L('System Availability', 'System Availability'), 99.9, '%', '≥ 99.5%', function (v) { return v >= 99.5; }),
      K('secAlerts', L('Security Alert Count', 'Security Alert Count'), M.secAlerts({ perms: ALL11 }, { st: 'open' }).length, '', '0 kritis', function (v) { return v === 0; })
    ];
  };
  M.control = function (ctx) {
    if (!can(ctx, 'sys11.super.view')) return null;
    var full = { perms: ALL11, uid: ctx.uid }, us = M.userSummary(full), h = M.health(full), ig = M.integSummary(full), bk = M.backups(full), al = M.secAlerts(full, { st: 'open' }), cs = M.commSummary(full), x = X();
    var failed = x ? x.auditLog().filter(function (e) { return e.ev === 'AUTH.LOGIN_FAIL' && x.now() - e.at < DAY; }).length : 0;
    var issues = M.permIssues(full), rv = M.accessReview(full);
    var K = function (k, n, v, st, s, d) { return { k: k, n: n, v: v, st: st, s: s, d: d || null }; };
    return {
      hero: { brand: 'JFRESH OS', st: h.overall, stN: h.overallN, uptime: '99.9%', lastBackup: bk.label, backupSt: bk.st, integ: ig, integLabel: L('Integrasi ' + ig.label + ' Healthy', 'Integrations ' + ig.label + ' Healthy') },
      kpis: [K('users', L('Total User', 'Total Users'), us.total, 'info', 'ADM-001'), K('active', L('User Aktif', 'Active Users'), us.active, 'ok', 'ADM-001', us.pctActive + '%'), K('locked', L('User Terkunci', 'Locked Users'), us.locked, us.locked ? 'warn' : 'ok', 'SYS-002'),
        K('roles', L('Role', 'Roles'), roleKeys().length, 'info', 'ADM-003'), K('permIssues', L('Masalah Izin', 'Permission Issues'), issues.length, issues.length ? 'warn' : 'ok', 'SYS-002'), K('failed', L('Login Gagal (24j)', 'Failed Logins (24h)'), failed, failed >= 5 ? 'warn' : 'ok', 'SEC-002'),
        K('integErr', L('Error Integrasi', 'Integration Errors'), ig.warning + ig.critical + ig.disconnected, ig.critical + ig.disconnected ? 'crit' : ig.warning ? 'warn' : 'ok', 'SYS-003'), K('notifFail', L('Notifikasi Gagal', 'Notification Failures'), cs.failed, cs.failed ? 'warn' : 'ok', 'NTF-001'),
        K('auditAlerts', L('Audit / Security Alert', 'Audit / Security Alerts'), al.length, al.some(function (a) { return a.sev === 'crit'; }) ? 'crit' : al.length ? 'warn' : 'ok', 'SYS-004'), K('health', L('Kesehatan Sistem', 'System Health'), h.overallN, h.overall === 'healthy' ? 'ok' : h.overall === 'warning' ? 'warn' : 'crit', 'INT-007'),
        K('storage', L('Storage', 'Storage'), h.storage.pct + '%', h.storage.pct >= 70 ? 'warn' : 'ok', 'INT-007', h.storage.kb + ' KB'), K('backup', L('Status Backup', 'Backup Status'), bk.label, bk.st === 'healthy' ? 'ok' : 'warn', 'SYS-006')],
      sections: [['users', L('Users & Access', 'Users & Access'), 'ADM-001', us.total + ' user · ' + rv.counts.review + ' perlu review'], ['master', L('Master Data', 'Master Data'), 'CFG-001', M.MASTER_CATS.length + ' kategori'], ['settings', L('System Settings', 'System Settings'), 'SYS-005', null],
        ['workflow', L('Workflow Configuration', 'Workflow Configuration'), 'CFG-003', null], ['notif', L('Notification', 'Notification'), 'NTF-001', cs.failed + ' gagal'], ['integ', L('Integration', 'Integration'), 'INT-001', ig.label + ' healthy'],
        ['security', L('Security', 'Security'), 'SEC-001', al.length + ' alert'], ['audit', L('Audit', 'Audit'), 'SEC-002', null], ['retention', L('Data Retention', 'Data Retention'), 'SYS-006', null], ['health', L('System Health', 'System Health'), 'INT-007', h.overallN[0]]]
        .map(function (s) { return { k: s[0], n: s[1], s: s[2], d: s[3] }; }),
      quick: [['addUser', L('Tambah User', 'Add User'), 'ADM-002', 'new'], ['review', L('Review Akses', 'Review Access'), 'ADM-005', null], ['integ', L('Cek Integrasi', 'Check Integration'), 'SYS-003', null], ['audit', L('Buka Audit', 'Open Audit'), 'SEC-002', null],
        ['alert', L('Review Security Alert', 'Review Security Alert'), 'SYS-004', null], ['backup', L('Cek Backup', 'Check Backup'), 'SYS-006', null]].map(function (q) { return { k: q[0], n: q[1], s: q[2], rec: q[3] }; }),
      alerts: al.slice(0, 5), health: h, pendingRequests: S().reqs.filter(function (r) { return r.st === 'pending'; }).length, limits: L('Super Admin mengelola sistem, bukan approver bisnis: tidak ada persetujuan pembayaran, harga, HPP, tutup periode atau ubah data historis (§63).', 'Super Admin manages the system, not business approvals: no payment, price, HPP, period close or historical data approvals (§63).')
    };
  };
  M.userHealth = function (ctx) {
    if (!can(ctx, 'sys11.users.view')) return null;
    return { summary: M.userSummary(ctx), issues: M.permIssues(ctx), review: M.accessReview(ctx).counts, locked: M.users(ctx, { status: 'locked' }), expired: M.users(ctx).filter(function (r) { return r.expired; }), requests: M.requests(ctx, { st: 'pending' }) };
  };

  /* ---------- Notifications for admins (alert-only on mobile, §57) ---------- */
  M.joinNotifs = function (Xa) {
    if (!Xa || !Xa.notifsFor || Xa.__p11sysn) return; Xa.__p11sysn = true;
    var orig = Xa.notifsFor, origRead = Xa.markRead;
    Xa.notifsFor = function (ctx) {
      var base = orig.call(Xa, ctx);
      if (!ctx || ctx.client || !can(ctx, 'sys11.security.view')) return base;
      var seen = S().reads[ctx.uid] || [], t0 = Date.now();
      var mine = tryf(function () { return M.secAlerts(ctx, { st: 'open' }); }, []).slice(0, 8).map(function (a, i) { var id = 'SY-' + a.id;
        return { id: id, cat: a.sev === 'crit' ? 'crit' : 'warn', to: [], t: a.t, c: a.c, at: t0 - (i + 1) * 4e5, read: seen.indexOf(id) >= 0, cta: Xa.canScreen && Xa.canScreen(ctx, 'SYS-004') ? { l: L('Buka', 'Open'), s: 'SYS-004', rec: a.id } : (Xa.canScreen && Xa.canScreen(ctx, 'SEC-001') ? { l: L('Buka', 'Open'), s: 'SEC-001' } : null), p11: true }; });
      return base.concat(mine).sort(function (a, b) { return b.at - a.at; });
    };
    Xa.markRead = function (ctx, ids) {
      var all = ids === 'all' ? Xa.notifsFor(ctx).map(function (n) { return n.id; }) : ids || [];
      var r = S().reads, list = r[ctx.uid] = r[ctx.uid] || [];
      all.forEach(function (id) { if (/^SY-/.test(id) && list.indexOf(id) < 0) list.push(id); }); save();
      return origRead.call(Xa, ctx, all.filter(function (id) { return !/^SY-/.test(id); }));
    };
  };

  /* ---------- Screens (§73), navigation, roles, install ---------- */
  M.ALIAS = { 'SYS-HUB-001': 'SYS-001', 'SYS-USR-001': 'ADM-001', 'SYS-ROL-001': 'ADM-003', 'SYS-AUD-001': 'SEC-002', 'SYS-MD-001': 'CFG-001', 'SYS-SET-001': 'SYS-005' };
  function sc(id, n, a, p, np, icon, pur, emp, o) {
    var k = +np.slice(3);
    return Object.assign({ id: id, n: n, a: a, p: p, np: np, nv: 'NV-' + String(k).padStart(2, '0'), icon: icon, pur: pur, dom: 'sys11', lvl: 4, p11: true, nb: [], bf: [], aud: [], dev: 'd', devs: { d: 'primary', t: 'supported', m: 'alert' },
      emp: emp || L('Belum ada data.', 'No data yet.'), err: M.MSG.load, warn: L('Ada yang perlu perhatian.', 'Something needs attention.'), ok: L('Tersimpan.', 'Saved.') }, o || {});
  }
  var DV = function (t, m) { return { devs: { d: 'primary', t: t, m: m } }; };
  M.SCREENS = [
    sc('ADM-001', L('Daftar User Internal', 'Internal User List'), 'T05', 'sys11.users.view', 'NP-07', 'users', L('User, posisi, departemen, branch, status, login terakhir; filter & cari; panel detail.', 'Users, position, department, branch, status, last login; filter & search; detail panel.'), L('Belum ada user tambahan.', 'No additional users yet.'), DV('supported', 'no')),
    sc('ADM-002', L('Detail User', 'User Detail'), 'T03', 'sys11.users.view', 'NP-07', 'user', L('Info, role & izin efektif, akses plant, masa akses, status, aktivitas; aksi dengan alasan.', 'Info, role & effective permissions, plant access, access window, status, activity; actions with reason.'), null, DV('supported', 'no')),
    sc('ADM-003', L('Role Master', 'Role Master'), 'T05', 'sys11.roles.view', 'NP-07', 'idcard', L('Semua role: workspace, jumlah user, jumlah izin, privileged, versi; clone role baru.', 'All roles: workspace, users, permissions, privileged, version; clone a new role.'), null, DV('supported', 'no')),
    sc('ADM-004', L('Matriks Izin', 'Permission Matrix'), 'T05', 'sys11.roles.view', 'NP-07', 'columns', L('Modul × aksi (View, Create, Edit, Approve, Export, Admin) × role, dengan cakupan Own–All Company.', 'Module × action (View, Create, Edit, Approve, Export, Admin) × role, with scope Own–All Company.'), null, DV('review', 'no')),
    sc('ADM-005', L('Review Akses', 'Access Review'), 'T05', 'sys11.users.view', 'NP-07', 'usercheck', L('Privileged, akses berakhir, sementara, tidak aktif, perlu review; kampanye keep/revoke/adjust.', 'Privileged, expired, temporary, inactive, needing review; keep/revoke/adjust campaigns.'), null, DV('review', 'alert')),
    sc('CFG-001', L('Master Data', 'Master Data'), 'T05', 'sys11.master.view', 'NP-08', 'database', L('20 kategori; yang dimiliki modul lain tampil read-through dengan pemiliknya.', '20 categories; those owned by other modules are read-through with their owner.'), null, DV('limited', 'no')),
    sc('CFG-002', L('Detail Master', 'Master Detail'), 'T03', 'sys11.master.view', 'NP-08', 'layers', L('Versi, tanggal efektif, alasan, pengubah, persetujuan, dipakai oleh.', 'Versions, effective date, reason, changed by, approval, used by.'), null, DV('limited', 'no')),
    sc('CFG-003', L('Konfigurasi Sistem', 'System Configuration'), 'T06', 'sys11.config.view', 'NP-08', 'cog', L('Penomoran, bahasa, format, mata uang, zona waktu, status, workflow, ambang, persetujuan.', 'Numbering, language, format, currency, time zone, status, workflow, thresholds, approvals.'), null, DV('limited', 'no')),
    sc('NTF-001', L('Log Notifikasi', 'Notification Log'), 'T05', 'sys11.notif.view', 'NP-09', 'message', L('Tanggal, penerima, channel, template, status Pending/Delivered/Failed, error; kirim ulang.', 'Date, recipient, channel, template, Pending/Delivered/Failed, error; retry.'), L('Belum ada notifikasi.', 'No notifications yet.'), DV('supported', 'alert')),
    sc('NTF-002', L('Daftar Template', 'Template List'), 'T05', 'sys11.notif.view', 'NP-09', 'file', L('Template per event, channel, bahasa, versi, aktif.', 'Templates per event, channel, language, version, active.'), null, DV('supported', 'no')),
    sc('NTF-003', L('Editor Template', 'Template Editor'), 'T04', 'sys11.notif.view', 'NP-09', 'edit', L('Subjek, pesan ID/EN, variabel tervalidasi, preview, cek privasi klien.', 'Subject, ID/EN message, validated variables, preview, client privacy check.'), null, DV('supported', 'no')),
    sc('NTF-004', L('Pengaturan Channel', 'Channel Settings'), 'T06', 'sys11.notif.view', 'NP-09', 'bell', L('In-App, Email, WhatsApp (butuh integrasi sehat), Push, SMS (future).', 'In-App, Email, WhatsApp (needs a healthy integration), Push, SMS (future).'), null, DV('supported', 'no')),
    sc('SEC-001', L('Security Dashboard', 'Security Dashboard'), 'T08', 'sys11.security.view', 'NP-10', 'shield', L('Privileged user, review jatuh tempo, akses berakhir, alert, perubahan izin, login gagal.', 'Privileged users, review due, expired access, alerts, permission changes, failed logins.'), null, DV('review', 'alert')),
    sc('SEC-002', L('Audit Log', 'Audit Log'), 'T05', 'sys11.audit.view', 'NP-10', 'history', L('Satu audit trail dari semua modul; filter user, aksi, modul, tanggal, hasil. Read-only.', 'One audit trail from all modules; filter user, action, module, date, result. Read-only.'), null, DV('review', 'no')),
    sc('SEC-003', L('Detail Audit', 'Audit Detail'), 'T03', 'sys11.audit.view', 'NP-10', 'filecheck', L('Siapa, apa, sebelum, sesudah, alasan, waktu, perangkat, IP (disamarkan).', 'Who, what, before, after, reason, time, device, IP (masked).'), null, DV('review', 'no')),
    sc('SEC-004', L('Review Akses (Governance)', 'Access Review (Governance)'), 'T05', 'sys11.users.view', 'NP-10', 'usercheck', L('Kampanye review akses periodik dan progresnya.', 'Periodic access review campaigns and progress.'), null, DV('review', 'alert')),
    sc('SEC-005', L('Pengaturan Keamanan', 'Security Settings'), 'T06', 'sys11.security.view', 'NP-10', 'lock', L('Password, timeout sesi, kunci login gagal, masking, masa akses, suspensi; berversi.', 'Password, session timeout, failed-login lock, masking, access expiry, suspension; versioned.'), null, DV('limited', 'no')),
    sc('INT-001', L('Integration Center', 'Integration Center'), 'T08', 'sys11.integration.view', 'NP-11', 'plug', L('10 integrasi: status, sinkron terakhir, error, alur data, pemilik, kredensial tersamar.', '10 integrations: status, last sync, errors, data flow, owner, masked credentials.'), L('Belum ada integration error.', 'No integration errors yet.'), DV('monitor', 'alert')),
    sc('INT-002', L('Detail Integrasi', 'Integration Detail'), 'T03', 'sys11.integration.view', 'NP-11', 'link', L('Riwayat, tes koneksi, retry, nonaktifkan; penjelasan masalah.', 'History, connection test, retry, disable; problem explanation.'), null, DV('quick', 'alert')),
    sc('INT-003', L('API Management', 'API Management'), 'T05', 'sys11.integration.view', 'NP-11', 'component', L('Nama, tujuan, status, request terakhir, error rate, autentikasi, pemilik. Tanpa secret.', 'Name, purpose, status, last request, error rate, auth, owner. No secrets.'), null, DV('monitor', 'no')),
    sc('INT-004', L('Import Center', 'Import Center'), 'T05', 'sys11.import', 'NP-11', 'upload', L('Upload → validasi → preview → error → konfirmasi → import → audit.', 'Upload → validate → preview → errors → confirm → import → audit.'), null, DV('limited', 'no')),
    sc('INT-005', L('Validasi Import', 'Import Validation'), 'T04', 'sys11.import', 'NP-11', 'filecheck', L('Total, valid, warning, error per baris; hanya baris tanpa error yang diimport.', 'Total, valid, warning, error per row; only rows without errors are imported.'), null, DV('limited', 'no')),
    sc('INT-006', L('Export Center', 'Export Center'), 'T05', 'sys11.export', 'NP-11', 'download', L('Export klien, order, invoice, stok, supplier, aset, audit sesuai izin; setiap export dicatat.', 'Export clients, orders, invoices, stock, suppliers, assets, audit per permission; every export logged.'), null, DV('limited', 'no')),
    sc('INT-007', L('System Health', 'System Health'), 'T08', 'sys11.health.view', 'NP-11', 'gauge', L('Aplikasi, database, API, job, notifikasi, storage, integrasi; KPI admin.', 'Application, database, API, jobs, notifications, storage, integrations; admin KPIs.'), null, DV('monitor', 'alert')),
    sc('SYS-001', L('System Control Center', 'System Control Center'), 'T08', 'sys11.super.view', 'NP-12', 'grid', L('Hero status, 12 angka kendali, 10 seksi, aksi cepat; Super Admin bukan approver bisnis.', 'Status hero, 12 control figures, 10 sections, quick actions; Super Admin is not a business approver.'), null, DV('quick', 'alert')),
    sc('SYS-002', L('User Health', 'User Health'), 'T08', 'sys11.users.view', 'NP-12', 'usercheck', L('User aktif/terkunci, masalah izin, akses berakhir, permintaan menunggu.', 'Active/locked users, permission issues, expired access, pending requests.'), null, DV('quick', 'alert')),
    sc('SYS-003', L('Integration Health', 'Integration Health'), 'T08', 'sys11.integration.view', 'NP-12', 'plug', L('Status integrasi & API ringkas dengan retry cepat.', 'Integration & API status at a glance with quick retry.'), null, DV('quick', 'alert')),
    sc('SYS-004', L('Security Alerts', 'Security Alerts'), 'T05', 'sys11.security.view', 'NP-12', 'alert', L('Alert terbuka: akui, selesaikan dengan catatan; tercatat di audit.', 'Open alerts: acknowledge, resolve with a note; audited.'), L('Tidak ada alert terbuka.', 'No open alerts.'), Object.assign(DV('quick', 'alert'), { dev: 'm' })),
    sc('SYS-005', L('System Settings', 'System Settings'), 'T06', 'sys11.config.view', 'NP-12', 'cog', L('Ringkasan pengaturan sistem & keamanan dengan pemilik dan versi.', 'System & security settings summary with owner and version.'), null, DV('limited', 'no')),
    sc('SYS-006', L('Backup & Retensi', 'Backup / Retention'), 'T05', 'sys11.backup.view', 'NP-12', 'database', L('Riwayat backup (harian 02:00), retensi per jenis data, daftar tidak pernah dihapus.', 'Backup history (daily 02:00), retention per record type, never-delete list.'), null, DV('quick', 'alert'))
  ];
  M.screen = function (id) { return by(M.SCREENS, 'id', id); };
  M.PARENTS = { 'ADM-002': ['ADM-001'], 'ADM-004': ['ADM-003'], 'ADM-005': ['ADM-001'], 'CFG-002': ['CFG-001'], 'CFG-003': ['SYS-005'], 'NTF-002': ['NTF-001'], 'NTF-003': ['NTF-002'], 'NTF-004': ['NTF-001'],
    'SEC-002': ['SEC-001'], 'SEC-003': ['SEC-002'], 'SEC-004': ['SEC-001'], 'SEC-005': ['SEC-001'], 'INT-002': ['INT-001'], 'INT-003': ['INT-001'], 'INT-005': ['INT-004'], 'INT-006': ['INT-004'], 'INT-007': ['SYS-001'],
    'SYS-002': ['SYS-001'], 'SYS-003': ['SYS-001'], 'SYS-004': ['SYS-001'], 'SYS-005': ['SYS-001'], 'SYS-006': ['SYS-001'] };
  function N(k, l, i, s, x) { return Object.assign({ k: k, l: l, i: i, s: s }, x || {}); }
  function G(k, l, i, sub) { return { k: k, l: l, i: i, sub: sub }; }
  var MENU = { k: 'menu', l: L('Menu', 'Menu'), i: 'menu' };
  var F11 = {
    ctl: N('ctl11', L('Control Center', 'Control Center'), 'grid', 'SYS-001'), usr: N('usr11', L('Pengguna', 'Users'), 'users', 'ADM-001', { also: ['ADM-002'] }), rol: N('rol11', L('Role & Akses', 'Roles & Access'), 'idcard', 'ADM-003'),
    perm: N('perm11', L('Matriks Izin', 'Permission Matrix'), 'columns', 'ADM-004'), rev: N('rev11', L('Review Akses', 'Access Review'), 'usercheck', 'ADM-005', { also: ['SEC-004'] }), uh: N('uh11', L('User Health', 'User Health'), 'usercheck', 'SYS-002'),
    md: N('md11', L('Master Data', 'Master Data'), 'database', 'CFG-001', { also: ['CFG-002'] }), cfg: N('cfg11', L('Konfigurasi', 'Configuration'), 'cog', 'CFG-003'), set: N('set11', L('System Settings', 'System Settings'), 'cog', 'SYS-005'),
    nlog: N('nlog11', L('Log Notifikasi', 'Notification Log'), 'message', 'NTF-001'), tpl: N('tpl11', L('Template', 'Templates'), 'file', 'NTF-002', { also: ['NTF-003'] }), chan: N('chan11', L('Channel', 'Channels'), 'bell', 'NTF-004'),
    sec: N('sec11', L('Security Dashboard', 'Security Dashboard'), 'shield', 'SEC-001'), aud: N('aud11', L('Audit Log', 'Audit Log'), 'history', 'SEC-002', { also: ['SEC-003'] }), secset: N('secset11', L('Pengaturan Keamanan', 'Security Settings'), 'lock', 'SEC-005'),
    alrt: N('alrt11', L('Security Alerts', 'Security Alerts'), 'alert', 'SYS-004'), int: N('int11', L('Integrasi', 'Integrations'), 'plug', 'INT-001', { also: ['INT-002'] }), api: N('api11', L('API', 'API'), 'component', 'INT-003'),
    imp: N('imp11', L('Import', 'Import'), 'upload', 'INT-004', { also: ['INT-005'] }), exp: N('exp11', L('Export', 'Export'), 'download', 'INT-006'), hlth: N('hlth11', L('System Health', 'System Health'), 'gauge', 'INT-007'),
    ih: N('ih11', L('Integration Health', 'Integration Health'), 'plug', 'SYS-003'), bkp: N('bkp11', L('Backup & Retensi', 'Backup & Retention'), 'database', 'SYS-006')
  };
  M.F11NAV = F11;
  var GR = {
    users: G('g-usr11', L('Pengguna & Akses', 'Users & Access'), 'users', [F11.usr, F11.rol, F11.perm, F11.rev, F11.uh]), master: G('g-md11', L('Master Data & Konfigurasi', 'Master Data & Configuration'), 'database', [F11.md, F11.cfg, F11.set]),
    notif: G('g-ntf11', L('Notifikasi', 'Notifications'), 'bell', [F11.nlog, F11.tpl, F11.chan]), sec: G('g-sec11', L('Keamanan & Audit', 'Security & Audit'), 'shield', [F11.sec, F11.alrt, F11.aud, F11.secset]),
    integ: G('g-int11', L('Integrasi & Data', 'Integrations & Data'), 'plug', [F11.int, F11.ih, F11.api, F11.imp, F11.exp, F11.hlth])
  };
  var NAV_SUPER = [N('home', L('Control Center', 'Control Center'), 'grid', 'SYS-001'), GR.users, GR.master, GR.notif, GR.sec, GR.integ, F11.bkp];
  var NAV_SYS = [N('home', L('Pengguna', 'Users'), 'users', 'ADM-001', { also: ['ADM-002'] }), G('g-usr11', L('Pengguna & Akses', 'Users & Access'), 'idcard', [F11.rol, F11.perm, F11.rev, F11.uh]), GR.master, GR.notif, GR.sec, GR.integ, F11.bkp];
  function role(n, person, title, nav, mnav, q, feel, hide) { return { n: n, person: person, title: title, group: 'management', device: 'desktop', site: L('Kantor pusat', 'Head office'), q: q, feel: feel, nav: nav, mnav: mnav, extra: [], hide: hide, levels: [1, 2, 3, 4] }; }
  M.NEW_ROLES = {
    sysadmin: { x: { exp: 'sysadmin', n: L('System Admin', 'System Admin'), landing: 'ADM-001', land: 'LAND-003', group: 'management' },
      c: role(L('System Admin', 'System Admin'), 'Aditya Wiguna', L('System Administrator', 'System Administrator'), NAV_SYS, [NAV_SYS[0], N('alrt11', L('Alert', 'Alerts'), 'alert', 'SYS-004'), N('hlth11', L('Health', 'Health'), 'gauge', 'INT-007'), N('int11', L('Integrasi', 'Integrations'), 'plug', 'SYS-003'), MENU],
        L('User, role, master data dan integrasi mana yang perlu saya rapikan?', 'Which users, roles, master data and integrations need my attention?'), L('Terkendali, aman, tertelusur.', 'Controlled, secure, traceable.'), [L('Persetujuan pembayaran', 'Payment approvals'), L('Ubah harga & HPP', 'Price & HPP changes'), L('Tutup periode', 'Period close')]),
      d: D.PEOPLE.sysadmin },
    superadmin: { x: { exp: 'superadmin', n: L('Super Admin', 'Super Admin'), landing: 'SYS-001', land: 'LAND-003', group: 'management' },
      c: role(L('Super Admin', 'Super Admin'), 'Gede Rama', L('Super Administrator', 'Super Administrator'), NAV_SUPER, [NAV_SUPER[0], N('alrt11', L('Alert', 'Alerts'), 'alert', 'SYS-004'), N('ih11', L('Integrasi', 'Integrations'), 'plug', 'SYS-003'), N('uh11', L('User', 'Users'), 'usercheck', 'SYS-002'), MENU],
        L('Apakah JFRESH OS sehat, aman dan terkendali?', 'Is JFRESH OS healthy, secure and under control?'), L('Satu sistem kendali: sehat, aman, tertelusur.', 'One system of control: healthy, secure, traceable.'), [L('Persetujuan bisnis (§63)', 'Business approvals (§63)'), L('Ubah harga & HPP', 'Price & HPP changes'), L('Tutup periode', 'Period close')]),
      d: D.PEOPLE.superadmin }
  };
  var BASE = null;
  function snapshot() {
    var x = X(), C = M.C; BASE = { perms: {}, policy: x ? clone(x.POLICY) : null, users: {}, pwShort: x ? x.MSG.pw_short : null };
    roleKeys().forEach(function (k) { BASE.perms[k] = permArrays(k).map(function (a) { return a.slice(); }); });
    if (x) x.USERS.forEach(function (u) { BASE.users[u.id] = { email: u.email, name: u.name }; });
  }
  // Re-apply what this store remembers on top of the code-defined users and roles (page reload, login page).
  function restore() {
    var x = X(), s = S(); if (!x) return;
    s.added.forEach(function (a) { if (a.emp && !x.employee(a.emp.id)) x.EMPLOYEES.push(clone(a.emp)); if (!x.user(a.user.id)) x.USERS.push(clone(a.user)); });
    Object.keys(s.custom).forEach(function (k) { var d = s.custom[k]; if (!x.ROLES[k]) x.ROLES[k] = { exp: d.exp, n: (s.roleMeta[k] || {}).n || d.n, landing: d.landing, land: d.land, group: d.group, perms: d.perms.slice(), custom: true }; });
    Object.keys(s.rolePerms).forEach(function (k) { if (permArrays(k).length) writePerms(k, s.rolePerms[k]); });
    Object.keys(s.meta).forEach(function (uid) { var ov = s.meta[uid].ov, u = ov && x.user(uid); if (u) { if (ov.email) u.email = ov.email; if (ov.name) u.name = ov.name; } });
    applyPolicy();
  }
  function hookX(x) {
    if (x.__p11sys) return; x.__p11sys = true;
    x.MSG.expired_access = L('Masa akses akun Anda sudah berakhir. Hubungi administrator.', 'Your account access period has ended. Contact your administrator.');
    x.MSG.not_started = L('Masa akses akun Anda belum dimulai. Hubungi administrator.', 'Your account access period has not started yet. Contact your administrator.');
    x.EVENTS['ACC.INVITE_ACTIVATED'] = L('Undangan diaktifkan (login pertama)', 'Invitation activated (first login)');
    var oLogin = x.login, oResolve = x.resolve;
    // Invited → Active on the first successful sign-in (§31).
    x.login = function (id, pw) {
      var u = id && pw ? findByLogin(id) : null, a = u && x.account(u.id);
      if (u && a && a.status === 'invited' && pw === a.pw && x.net() === 'online' && !windowOf(u.id).code) {
        x.admin.setStatus(u.id, 'active', 'Sistem · aktivasi login pertama'); meta(u.id).activatedAt = nowS();
        M.audit('USER.ACTIVATE', { uid: u.id, name: x.fullName(u), roleKey: null, employee: u.emp ? { id: u.emp } : null }, { module: 'users', rec: u.id, before: { status: 'invited' }, after: { status: 'active' }, reason: 'first login' });
      }
      return oLogin.apply(x, arguments);
    };
    // Access window (temporary access, §31/§34): refused at login and on every session check.
    x.resolve = function (uid) {
      var r = oResolve.apply(x, arguments);
      if (!r || !r.ok) return r;
      var w = windowOf(uid); if (w.code) { var steps = (r.steps || []).concat([{ k: 'access', ok: false, v: w.code }]); return { ok: false, code: w.code, steps: steps }; }
      return r;
    };
  }
  M.install = function (C, Xa, P, CM, LG, PR, DL, FN, CLP) {
    if (!C || C.__p11sys) return; C.__p11sys = true;
    M.C = C; M.X = Xa || null; M.P = P || null; M.CM = CM || null; M.LG = LG || null; M.PR = PR || null; M.DL = DL || null; M.FN = FN || null; M.CLP = CLP || null;
    Object.keys(M.PERMS).forEach(function (k) { C.PERMS[k] = M.PERMS[k]; });
    function addP(list, extra) { extra.forEach(function (p) { if (list.indexOf(p) < 0) list.push(p); }); }
    Object.keys(M.NEW_ROLES).forEach(function (r) {
      var d = M.NEW_ROLES[r];
      if (!C.ROLES[r]) { C.ROLES[r] = Object.assign({ perms: M.ROLE_PERMS[r].slice() }, d.c); if (C.ROLE_ORDER.indexOf(r) < 0) C.ROLE_ORDER.splice(C.ROLE_ORDER.indexOf('owner'), 0, r); }
      if (Xa) {
        if (!Xa.ROLES[r]) Xa.ROLES[r] = Object.assign({ perms: M.ROLE_PERMS[r].slice() }, d.x);
        if (!Xa.employee(d.d.emp.id)) Xa.EMPLOYEES.push(clone(d.d.emp));
        if (!Xa.USERS.some(function (u) { return u.u === d.d.user.u; })) Xa.USERS.push(clone(d.d.user));
        if (!Xa.DEMO.some(function (x2) { return x2.u === d.d.demo.u; })) Xa.DEMO.push(d.d.demo);
      }
    });
    if (Xa) D.INVITED.forEach(function (d) { if (!Xa.employee(d.emp.id)) Xa.EMPLOYEES.push(clone(d.emp)); if (!Xa.user(d.user.id)) Xa.USERS.push(clone(d.user)); });
    ['owner', 'hr'].forEach(function (r) { var rl = C.ROLES[r], xr = Xa && Xa.ROLES[r]; if (rl) addP(rl.perms, M.ROLE_PERMS[r]); if (xr && xr.perms) addP(xr.perms, M.ROLE_PERMS[r]); });
    var own = C.ROLES.owner;
    if (own) {
      var gi = own.nav.map(function (n) { return n.k; }).indexOf('sys');
      var og = G('g-sys11', L('Sistem & Governance', 'System & Governance'), 'cog', [F11.ctl, F11.sec, F11.alrt, F11.aud, F11.hlth, F11.ih, F11.usr, F11.rev, F11.bkp]);
      if (gi >= 0) own.nav.splice(gi, 1, og); else own.nav.push(og);
    }
    if (Xa) { snapshot(); hookX(Xa); restore(); M.joinNotifs(Xa); }
    var orig = C.screen, extra = {};
    M.SCREENS.forEach(function (s) { extra[s.id] = s; });
    C.screen = function (id) { return extra[id] || orig(id); };
    C.SCREENS_P11SYS = M.SCREENS;
    S();
  };
  // Test/demo reset: fresh store, code-defined users/roles/policy restored, then the store re-applied.
  M._reset = function () {
    var x = X(), s0 = st;
    if (x && BASE) {
      var added = (s0 ? s0.added : []).map(function (a) { return a.user.id; }), addedE = (s0 ? s0.added : []).map(function (a) { return a.emp && a.emp.id; });
      for (var i = x.USERS.length - 1; i >= 0; i--) if (added.indexOf(x.USERS[i].id) >= 0) x.USERS.splice(i, 1);
      for (var j = x.EMPLOYEES.length - 1; j >= 0; j--) if (addedE.indexOf(x.EMPLOYEES[j].id) >= 0) x.EMPLOYEES.splice(j, 1);
      Object.keys(x.ROLES).forEach(function (k) { if (x.ROLES[k].custom) delete x.ROLES[k]; });
      Object.keys(BASE.perms).forEach(function (k) { var arrs = permArrays(k); BASE.perms[k].forEach(function (b, n) { if (arrs[n]) { arrs[n].length = 0; b.forEach(function (p) { arrs[n].push(p); }); } }); });
      Object.keys(BASE.users).forEach(function (uid) { var u = x.user(uid); if (u) { u.email = BASE.users[uid].email; if (BASE.users[uid].name === undefined) delete u.name; else u.name = BASE.users[uid].name; } });
      Object.assign(x.POLICY, BASE.policy); x.MSG.pw_short = BASE.pwShort;
    }
    SIM = ms(D.simNow); T0 = Date.now(); seed(); save();
    if (x) restore();
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = M;
  else root.JFSYS = M;
})(typeof window !== 'undefined' ? window : this);
