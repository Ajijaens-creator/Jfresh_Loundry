/* ==========================================================================
   JFRESH OS — Access layer (Phase 4 · NP 1.0)
   Authentication, account status, employee link, role, plant, permission,
   navigation and landing resolution, sessions, password recovery,
   notifications and the security audit trail.

   This file is the single access engine for the prototype. The login page,
   the app shell and the automated tests (tools/test-access.js and
   phase4/tests.html) all call it.

   Important: this is a static prototype with no server. Every rule here is
   written the way the backend must enforce it (authorize() is called before
   any screen renders and before any protected action), but a production
   build must repeat these checks on the server. Hidden menus are never the
   security boundary.
   ========================================================================== */
(function (root) {
  var C = root.JFOS || (typeof require !== 'undefined' ? require('./jfos-config.js') : null);
  function L(a, b) { return [a, b === undefined ? a : b]; }
  var M = 60e3, H = 60 * M, D = 24 * H;
  var X = { version: 'Phase 4 · NP 1.0', date: '2026-10-06' };

  /* ---------- Policy (§3, §49, §52, §54) ---------- */
  X.POLICY = {
    otp: false,                 // normal login never asks for OTP
    maxFailed: 5,               // failed passwords before the account is locked
    lockMinutes: 15,            // temporary lock length
    deviceWindow: 60 * 1000,    // throttle window per device
    deviceMax: 8,               // attempts per window before "too many attempts"
    idle: 30 * M,               // session idle timeout
    idleRemember: 8 * H,        // idle timeout with "Ingat saya"
    warnBefore: 2 * M,          // warn before expiry
    resetTtl: 30 * M,           // password reset link lifetime
    minPassword: 8
  };

  /* ---------- Organisation scope ---------- */
  X.COMPANY = { id: 'CO-01', n: "J'Fresh Laundry" };
  X.PLANTS = [
    { id: 'PL-01', n: L('Main Plant — Ubud', 'Main Plant — Ubud'), short: 'Ubud' },
    { id: 'PL-02', n: L('Plant 2 — Gianyar', 'Plant 2 — Gianyar'), short: 'Gianyar' }
  ];
  X.ALL = '*';
  // Which plant serves each client (demo data has no plant column).
  X.CLIENT_PLANT = { 'CL-01': 'PL-01', 'CL-02': 'PL-01', 'CL-05': 'PL-01', 'CL-03': 'PL-02', 'CL-04': 'PL-02', 'CL-06': 'PL-02' };
  X.plant = function (id) { return X.PLANTS.filter(function (p) { return p.id === id; })[0]; };
  X.plantName = function (id) { return id === X.ALL ? L('Semua Plant', 'All Plants') : (X.plant(id) || { n: L('—', '—') }).n; };

  /* ---------- Roles (§11): role = experience, permission = actions ----------
     exp: the Phase 2 experience (navigation shell + home) the role uses.
     perms: when omitted, the Phase 2 role permissions are used. */
  X.ROLES = {
    operator: { exp: 'operator', n: L('Receiving Operator', 'Receiving Operator'), landing: 'HOM-OPR-001', land: 'LAND-001', group: 'frontline' },
    qc: { exp: 'operator', n: L('QC Inspector', 'QC Inspector'), landing: 'OPS-QC-002', land: 'LAND-001', group: 'frontline',
      perms: ['home.op', 'ops.qc', 'ops.issue', 'ops.history', 'ops.detail'] },
    driver: { exp: 'driver', n: L('Driver / Pickup', 'Driver / Pickup'), landing: 'HOM-DRV-001', land: 'LAND-002', group: 'frontline' },
    supervisor: { exp: 'supervisor', n: L('Supervisor', 'Supervisor'), landing: 'HOM-SPV-001', land: 'LAND-003', group: 'management' },
    opsmgr: { exp: 'opsmgr', n: L('Operations Manager', 'Operations Manager'), landing: 'HOM-MGR-001', land: 'LAND-003', group: 'management' },
    finance: { exp: 'finance', n: L('Finance', 'Finance'), landing: 'HOM-FIN-001', land: 'LAND-004', group: 'management' },
    sales: { exp: 'sales', n: L('Sales / Account', 'Sales / Account'), landing: 'HOM-SAL-001', land: 'LAND-005', group: 'management' },
    owner: { exp: 'owner', n: L('Owner / CEO', 'Owner / CEO'), landing: 'HOM-EXE-001', land: 'LAND-006', group: 'management' },
    client: { exp: 'client', n: L('Client Portal', 'Client Portal'), landing: 'HOM-CLT-001', land: 'LAND-007', group: 'client' }
  };
  X.rolePerms = function (key) { var r = X.ROLES[key]; if (!r) return []; return (r.perms || (C.ROLES[r.exp] || { perms: [] }).perms).slice(); };

  /* ---------- Employee ≠ User account (§10) ---------- */
  X.EMPLOYEES = [
    { id: 'EMP-001', n: 'Made Wirana', short: 'Made', dept: L('Operasional', 'Operations'), status: 'active' },
    { id: 'EMP-002', n: 'Ketut Arsana', short: 'Ketut', dept: L('Logistik', 'Logistics'), status: 'active', vehicle: 'B 1234 XY' },
    { id: 'EMP-021', n: 'Saras Pradnyani', short: 'Saras', dept: L('Operasional', 'Operations'), status: 'active' },
    { id: 'EMP-030', n: 'Budi Santoso', short: 'Budi', dept: L('Finance', 'Finance'), status: 'active' },
    { id: 'EMP-040', n: 'Ayu Lestari', short: 'Ayu', dept: L('Sales', 'Sales'), status: 'active' },
    { id: 'EMP-050', n: 'Aji Jaens', short: 'Aji', dept: L('Direksi', 'Board'), status: 'active' },
    { id: 'EMP-060', n: 'Nyoman Sudarsa', short: 'Nyoman', dept: L('Operasional', 'Operations'), status: 'resigned' },
    { id: 'EMP-061', n: 'Putu Rahayu', short: 'Putu', dept: L('Operasional', 'Operations'), status: 'active' },     // employee without a user account
    { id: 'EMP-062', n: 'Kadek Rina', short: 'Rina', dept: L('Operasional', 'Operations'), status: 'active' },
    { id: 'EMP-063', n: 'Gede Wira', short: 'Gede', dept: L('Logistik', 'Logistics'), status: 'active' },
    { id: 'EMP-064', n: 'Dewa Ayu', short: 'Dewa', dept: L('Operasional', 'Operations'), status: 'active' }
  ];
  X.employee = function (id) { return X.EMPLOYEES.filter(function (e) { return e.id === id; })[0]; };

  // Demo password for every account. Production stores only salted hashes.
  X.DEMO_PASSWORD = 'jfresh123';
  X.USERS = [
    { id: 'USR-001', u: 'made', email: 'made@jfreshlaundry.app', emp: 'EMP-001', status: 'active', roles: [{ k: 'operator', def: true }], plants: ['PL-01'], lang: 'id' },
    { id: 'USR-002', u: 'ketut', email: 'ketut@jfreshlaundry.app', emp: 'EMP-002', status: 'active', roles: [{ k: 'driver', def: true }], plants: ['PL-01'], lang: 'id' },
    { id: 'USR-021', u: 'saras', email: 'saras@jfreshlaundry.app', emp: 'EMP-021', status: 'active', roles: [{ k: 'supervisor', def: true }, { k: 'qc' }], plants: ['PL-01', 'PL-02'], defPlant: 'PL-01', lang: 'id', switchRole: true },
    { id: 'USR-030', u: 'budi', email: 'budi@jfreshlaundry.app', emp: 'EMP-030', status: 'active', roles: [{ k: 'finance', def: true }], plants: [X.ALL], lang: 'id', deny: ['fin.invoice.fix.approve'] },
    { id: 'USR-040', u: 'ayu', email: 'ayu@jfreshlaundry.app', emp: 'EMP-040', status: 'active', roles: [{ k: 'sales', def: true }], plants: [X.ALL], lang: 'id' },
    { id: 'USR-050', u: 'aji', email: 'aji@jfreshlaundry.app', emp: 'EMP-050', status: 'active', roles: [{ k: 'owner', def: true }], plants: [X.ALL], lang: 'id', full: true },
    { id: 'USR-090', u: 'sari.grandvista', email: 'sari@grandvista.id', name: 'Ibu Sari', client: 'CL-01', status: 'active', roles: [{ k: 'client', def: true }], plants: [], lang: 'id' },
    { id: 'USR-091', u: 'nia.hotelabc', email: 'nia@hotelabc.id', name: 'Ibu Nia', client: 'CL-05', status: 'active', roles: [{ k: 'client', def: true }], plants: [], lang: 'id' },
    { id: 'USR-060', u: 'nyoman', email: 'nyoman@jfreshlaundry.app', emp: 'EMP-060', status: 'inactive', roles: [{ k: 'operator', def: true }], plants: ['PL-01'], lang: 'id' },
    { id: 'USR-062', u: 'rina', email: 'rina@jfreshlaundry.app', emp: 'EMP-062', status: 'locked', lockUntil: Infinity, roles: [{ k: 'operator', def: true }], plants: ['PL-01'], lang: 'id' },
    { id: 'USR-063', u: 'gede', email: 'gede@jfreshlaundry.app', emp: 'EMP-063', status: 'suspended', roles: [{ k: 'driver', def: true }], plants: ['PL-01'], lang: 'id' },
    { id: 'USR-064', u: 'dewa', email: 'dewa@jfreshlaundry.app', emp: 'EMP-064', status: 'active', roles: [], plants: ['PL-01'], lang: 'id' }
  ];
  X.DEMO = [
    { u: 'made', d: L('Receiving Operator · Main Plant', 'Receiving Operator · Main Plant') },
    { u: 'ketut', d: L('Driver / Pickup', 'Driver / Pickup') },
    { u: 'saras', d: L('Supervisor + QC Inspector · 2 plant', 'Supervisor + QC Inspector · 2 plants') },
    { u: 'budi', d: L('Finance', 'Finance') },
    { u: 'ayu', d: L('Sales / Account', 'Sales / Account') },
    { u: 'aji', d: L('Owner / CEO', 'Owner / CEO') },
    { u: 'sari.grandvista', d: L('Klien · Grand Vista Hotel', 'Client · Grand Vista Hotel') },
    { u: 'nyoman', d: L('Akun tidak aktif', 'Inactive account') },
    { u: 'rina', d: L('Akun terkunci', 'Locked account') },
    { u: 'gede', d: L('Akun ditangguhkan', 'Suspended account') },
    { u: 'dewa', d: L('Tanpa peran aktif', 'No active role') }
  ];

  /* ---------- Storage (browser: localStorage · node: memory) ---------- */
  var KEY = 'jfos-access-v1';
  var mem = {}, store = null, clock = function () { return Date.now(); };
  var ls = null;
  try { ls = root.localStorage || null; if (ls) { ls.setItem('__jf', '1'); ls.removeItem('__jf'); } } catch (e) { ls = null; }
  function blank() { return { v: 1, acc: {}, sessions: {}, current: null, audit: [], outbox: [], device: [], reads: {}, prefs: {}, remember: null, net: 'online', notifs: [] }; }
  function load() {
    if (store) return store;
    try { var raw = ls ? ls.getItem(KEY) : mem[KEY]; store = raw ? JSON.parse(raw) : null; } catch (e) { store = null; }
    if (!store || store.v !== 1) store = blank();
    return store;
  }
  function save() { try { var s = JSON.stringify(store); if (ls) ls.setItem(KEY, s); else mem[KEY] = s; } catch (e) {} }
  X._setClock = function (fn) { clock = fn; };
  X._resetStore = function () { store = blank(); save(); };
  X.now = function () { return clock(); };

  // Mutable account state (status, failed attempts, lock, password, roles, plants, permission overrides)
  function acc(u) {
    var s = load(), a = s.acc[u.id];
    if (!a) {
      a = s.acc[u.id] = { status: u.status, failed: 0, lockUntil: u.lockUntil === Infinity ? 9e15 : (u.lockUntil || 0), pw: X.DEMO_PASSWORD, roles: JSON.parse(JSON.stringify(u.roles)), plants: u.plants.slice(), grant: (u.grant || []).slice(), deny: (u.deny || []).slice(), ver: 1, lang: u.lang || 'id' };
    }
    return a;
  }
  X.user = function (id) { return X.USERS.filter(function (u) { return u.id === id; })[0]; };
  X.account = function (id) { var u = X.user(id); return u ? acc(u) : null; };
  function findUser(identifier) {
    var k = String(identifier || '').trim().toLowerCase();
    return X.USERS.filter(function (u) { return u.u === k || u.email.toLowerCase() === k; })[0];
  }
  X.displayName = function (u) { var e = u.emp && X.employee(u.emp); return u.name || (e ? e.short : u.u); };
  X.fullName = function (u) { var e = u.emp && X.employee(u.emp); return u.name || (e ? e.n : u.u); };

  /* ---------- Security audit trail (§58) ---------- */
  X.EVENTS = {
    'AUTH.LOGIN_OK': L('Login berhasil', 'Successful login'), 'AUTH.LOGIN_FAIL': L('Login gagal', 'Failed login'), 'AUTH.LOGOUT': L('Logout', 'Logout'),
    'AUTH.RESET_REQ': L('Reset password diminta', 'Password reset requested'), 'AUTH.PW_CHANGED': L('Password diubah', 'Password changed'),
    'ACC.LOCKED': L('Akun dikunci', 'Account locked'), 'ACC.ACTIVATED': L('Akun diaktifkan', 'Account activated'), 'ACC.DEACTIVATED': L('Akun dinonaktifkan', 'Account deactivated'),
    'ACC.SUSPENDED': L('Akun ditangguhkan', 'Account suspended'), 'ACC.ROLE_CHANGED': L('Peran diubah', 'Role changed'), 'ACC.PERM_CHANGED': L('Hak akses diubah', 'Permission changed'),
    'ACC.PLANT_CHANGED': L('Akses plant diubah', 'Plant access changed'), 'AUTH.ROLE_SWITCH': L('Ganti peran', 'Role switched'), 'AUTH.PLANT_SWITCH': L('Ganti plant', 'Plant switched'),
    'AUTH.FORCED_LOGOUT': L('Logout paksa', 'Forced logout'), 'AUTH.SESSION_EXPIRED': L('Sesi berakhir', 'Session expired'), 'AUTH.ACCESS_DENIED': L('Akses ditolak', 'Access denied')
  };
  function device() {
    var ua = root.navigator && root.navigator.userAgent || 'node';
    var kind = /iPad|Tablet/i.test(ua) ? 'Tablet' : /Mobi|Android|iPhone/i.test(ua) ? 'Mobile' : (ua === 'node' ? 'Test' : 'Desktop');
    return kind;
  }
  X.audit = function (ev, o) {
    o = o || {};
    var s = load(), u = o.uid && X.user(o.uid);
    var row = { at: X.now(), ev: ev, uid: o.uid || null, emp: u && u.emp || null, actor: o.actor || (u ? X.displayName(u) : 'system'), target: o.target || (u ? u.id : null),
      from: o.from == null ? null : String(o.from), to: o.to == null ? null : String(o.to), device: device(), session: o.sid || (s.current || null), reason: o.reason || null };
    s.audit.unshift(row); if (s.audit.length > 400) s.audit.length = 400; save();
    return row;
  };
  X.auditLog = function () { return load().audit.slice(); };

  /* ---------- Network simulation (demo only) ---------- */
  X.setNet = function (v) { load().net = v; save(); };
  X.net = function () { var off = root.navigator && root.navigator.onLine === false; return off ? 'offline' : load().net; };

  /* ---------- Login (§3–§8) ----------
     Returns { ok, code, field?, sid? }. Codes:
     empty_user · empty_pass · invalid · inactive · suspended · locked · too_many · network · system */
  X.MSG = {
    empty_user: L('Username atau email wajib diisi.', 'Username or email is required.'),
    empty_pass: L('Password wajib diisi.', 'Password is required.'),
    invalid: L('Username atau password belum benar.', 'Username or password is not correct.'),
    inactive: L('Akun Anda tidak aktif. Hubungi administrator.', 'Your account is inactive. Contact your administrator.'),
    suspended: L('Akun Anda sedang ditangguhkan. Hubungi administrator.', 'Your account is suspended. Contact your administrator.'),
    locked: L('Akun sementara dikunci.', 'Your account is temporarily locked.'),
    too_many: L('Terlalu banyak percobaan masuk. Silakan coba lagi beberapa saat.', 'Too many sign-in attempts. Please try again in a moment.'),
    network: L('Tidak dapat terhubung. Periksa koneksi internet.', 'Cannot connect. Check your internet connection.'),
    system: L('Sistem sedang mengalami kendala. Silakan coba lagi.', 'The system is having a problem. Please try again.'),
    no_role: L('Akun Anda belum memiliki peran aktif. Hubungi administrator.', 'Your account has no active role yet. Contact your administrator.'),
    no_plant: L('Akun Anda belum memiliki akses lokasi kerja. Hubungi administrator.', 'Your account has no work location yet. Contact your administrator.'),
    no_employee: L('Akun Anda belum terhubung ke data karyawan. Hubungi administrator.', 'Your account is not linked to an employee record yet. Contact your administrator.'),
    pw_short: L('Password minimal 8 karakter.', 'Password must be at least 8 characters.'),
    pw_match: L('Password tidak sama.', 'Passwords do not match.'),
    pw_old: L('Password lama belum benar.', 'Current password is not correct.'),
    pw_same: L('Password baru harus berbeda dari password lama.', 'The new password must be different from the current one.'),
    reset_sent: L('Jika akun terdaftar, instruksi reset password akan dikirim ke email terkait.', 'If the account exists, password reset instructions will be sent to its email.'),
    reset_bad: L('Link reset sudah tidak berlaku. Silakan minta link baru.', 'This reset link is no longer valid. Please request a new one.')
  };
  function throttled() {
    var s = load(), t = X.now();
    s.device = s.device.filter(function (x) { return t - x < X.POLICY.deviceWindow; });
    return s.device.length >= X.POLICY.deviceMax;
  }
  X.login = function (identifier, password, o) {
    o = o || {};
    identifier = String(identifier || '').trim();
    if (!identifier) return { ok: false, code: 'empty_user', field: 'user' };
    if (!password) return { ok: false, code: 'empty_pass', field: 'pass' };
    var net = X.net();
    if (net === 'offline') return { ok: false, code: 'network' };
    if (net === 'error') return { ok: false, code: 'system' };
    var s = load();
    if (throttled()) return { ok: false, code: 'too_many' };
    s.device.push(X.now()); save();
    var u = findUser(identifier);
    if (!u) { X.audit('AUTH.LOGIN_FAIL', { actor: identifier, target: null, reason: 'invalid' }); return { ok: false, code: 'invalid' }; }
    var a = acc(u), t = X.now();
    if (a.status === 'locked' && a.lockUntil && a.lockUntil <= t) { a.status = 'active'; a.failed = 0; a.lockUntil = 0; save(); }
    if (a.status === 'locked') { X.audit('AUTH.LOGIN_FAIL', { uid: u.id, reason: 'locked' }); return { ok: false, code: 'locked' }; }
    if (password !== a.pw) {
      a.failed += 1;
      if (a.failed >= X.POLICY.maxFailed && a.status === 'active') {
        a.status = 'locked'; a.lockUntil = t + X.POLICY.lockMinutes * M; save();
        X.audit('AUTH.LOGIN_FAIL', { uid: u.id, reason: 'invalid' });
        X.audit('ACC.LOCKED', { uid: u.id, actor: 'system', from: 'active', to: 'locked', reason: X.POLICY.maxFailed + ' failed attempts' });
        return { ok: false, code: 'locked' };
      }
      save();
      X.audit('AUTH.LOGIN_FAIL', { uid: u.id, reason: 'invalid' });
      // Never reveal which part was wrong, or the status of an account whose password was wrong.
      return { ok: false, code: 'invalid' };
    }
    if (a.status === 'inactive' || a.status === 'suspended') { X.audit('AUTH.LOGIN_FAIL', { uid: u.id, reason: a.status }); return { ok: false, code: a.status }; }
    a.failed = 0; save();
    var ctx = X.resolve(u.id, {});
    if (!ctx.ok) { X.audit('AUTH.LOGIN_FAIL', { uid: u.id, reason: ctx.code }); return { ok: false, code: ctx.code, steps: ctx.steps }; }
    var sid = 'SES-' + Math.random().toString(36).slice(2, 10).toUpperCase();
    s.sessions[sid] = { id: sid, uid: u.id, role: ctx.roleKey, plant: ctx.plant, at: t, last: t, remember: !!o.remember, ver: a.ver, status: 'active' };
    s.current = sid;
    s.remember = o.remember ? identifier : null;
    save();
    X.audit('AUTH.LOGIN_OK', { uid: u.id, sid: sid, to: X.ROLES[ctx.roleKey].n[0] + ' · ' + X.plantName(ctx.plant)[0] });
    return { ok: true, sid: sid, steps: ctx.steps, landing: ctx.landing };
  };

  /* ---------- Access resolution (§9, §12, §13, §70) ---------- */
  X.STEPS = [
    ['session', L('Memeriksa sesi', 'Checking session')], ['account', L('Memuat akun', 'Loading account')], ['status', L('Memeriksa status akun', 'Checking account status')],
    ['employee', L('Memuat data karyawan', 'Loading employee record')], ['role', L('Menentukan peran', 'Resolving role')], ['plant', L('Menentukan plant', 'Resolving plant')],
    ['perms', L('Memuat hak akses', 'Loading permissions')], ['lang', L('Memuat bahasa', 'Loading language')], ['nav', L('Menyusun menu', 'Building navigation')], ['landing', L('Menentukan halaman awal', 'Choosing landing page')]
  ];
  X.resolve = function (uid, o) {
    o = o || {};
    var steps = [], u = X.user(uid);
    function step(k, ok, v) { steps.push({ k: k, ok: ok, v: v == null ? null : v }); return ok; }
    function fail(code) { return { ok: false, code: code, steps: steps }; }
    step('session', true);
    if (!step('account', !!u, u && u.id)) return fail('invalid');
    var a = acc(u);
    if (!step('status', a.status === 'active', a.status)) return fail(a.status === 'locked' ? 'locked' : a.status);
    var emp = u.emp ? X.employee(u.emp) : null;
    if (!u.client && !step('employee', !!emp, u.emp)) return fail('no_employee');
    if (u.client) step('employee', true, 'client:' + u.client); else step('employee', true, emp.id);
    var roles = a.roles.filter(function (r) { return X.ROLES[r.k]; });
    var pick = roles.filter(function (r) { return r.k === o.role; })[0] || roles.filter(function (r) { return r.def; })[0] || roles[0];
    if (!step('role', !!pick, pick && pick.k)) return fail('no_role');
    var role = X.ROLES[pick.k];
    var plants = a.plants.slice(), all = plants.indexOf(X.ALL) >= 0, plant = null;
    if (role.group === 'client') plant = X.CLIENT_PLANT[u.client] || null;
    else if (all) plant = o.plant && (o.plant === X.ALL || X.plant(o.plant)) ? o.plant : X.ALL;
    else plant = plants.indexOf(o.plant) >= 0 ? o.plant : (u.defPlant && plants.indexOf(u.defPlant) >= 0 ? u.defPlant : plants[0]);
    if (!step('plant', role.group === 'client' ? !!u.client : !!plant, plant)) return fail('no_plant');
    var perms = X.rolePerms(pick.k).concat(a.grant).filter(function (p, i, arr) { return arr.indexOf(p) === i && a.deny.indexOf(p) < 0; });
    step('perms', true, perms.length);
    step('lang', true, a.lang);
    var ctx = {
      ok: true, user: u, uid: u.id, acc: a, employee: emp, name: X.displayName(u), fullName: X.fullName(u),
      roleKey: pick.k, role: role, exp: role.exp, group: role.group, roles: roles.map(function (r) { return r.k; }), defRole: (roles.filter(function (r) { return r.def; })[0] || roles[0]).k,
      plant: plant, plants: all ? [X.ALL].concat(X.PLANTS.map(function (p) { return p.id; })) : plants, allPlants: all, client: u.client || null,
      perms: perms, full: !!u.full, lang: a.lang, ver: a.ver, steps: steps
    };
    ctx.nav = X.nav(ctx, 'd'); ctx.mnav = X.nav(ctx, 'm');
    step('nav', ctx.nav.length > 0, ctx.nav.length);
    ctx.landing = X.landing(ctx);
    step('landing', !!ctx.landing, ctx.landing);
    return ctx;
  };
  X.can = function (ctx, perm) { return !perm || !!(ctx && ctx.perms && ctx.perms.indexOf(perm) >= 0); };

  /* ---------- Navigation (§29–§34): role × permission × device × plant ---------- */
  X.nav = function (ctx, device) {
    var R = C.ROLES[ctx.exp]; if (!R) return [];
    function ok(n) { if (!n.s) return true; var sc = C.screen(n.s); return !!sc && X.can(ctx, sc.p); }
    if (device === 'm') {
      var items = R.mnav.filter(ok);
      // max 5: four tasks + Lainnya (menu)
      var main = items.filter(function (n) { return n.k !== 'menu'; }).slice(0, 4), menu = items.filter(function (n) { return n.k === 'menu'; });
      return main.concat(menu);
    }
    // Phase 5: a group (item with sub) keeps only the screens this user can open; empty groups drop out.
    return R.nav.map(function (n) { return n.sub ? Object.assign({}, n, { sub: n.sub.filter(ok) }) : n; }).filter(function (n) { return n.sub ? n.sub.length > 0 : ok(n); });
  };
  X.landing = function (ctx) {
    var want = ctx.role.landing;
    if (X.canScreen(ctx, want)) return want;
    var first = ctx.nav[0]; return first ? (first.sub ? first.sub[0].s : first.s) : null;
  };
  // Phase 4 screens join the Phase 2 screen index (registered by registerScreens)
  X.canScreen = function (ctx, id) {
    var sc = C.screen(id); if (!sc) return false;
    if (sc.p4) return sc.p4 === true || X.can(ctx, sc.p4);
    return X.can(ctx, sc.p);
  };
  // Record scope (§13, §63): plant for staff, client for the client portal.
  X.orderPlant = function (o) { return o.plant || X.CLIENT_PLANT[o.cl] || 'PL-01'; };
  X.inScope = function (ctx, o) {
    if (!o) return true;
    if (ctx.client) return o.cl === ctx.client;
    if (ctx.allPlants && ctx.plant === X.ALL) return true;
    if (o.cl && !o.plant && !X.CLIENT_PLANT[o.cl]) return true;
    return X.orderPlant(o) === ctx.plant;
  };
  /* authorize(): the single check before rendering a screen or running an action.
     Returns { ok, code } with code noperm · scope. */
  X.authorize = function (ctx, screenId, record) {
    if (!ctx || !ctx.ok) return { ok: false, code: 'nosession' };
    if (!X.canScreen(ctx, screenId)) return { ok: false, code: 'noperm' };
    if (record && !X.inScope(ctx, record)) return { ok: false, code: 'scope' };
    return { ok: true };
  };

  /* ---------- Sessions (§49–§51, §60) ---------- */
  X.session = function () { var s = load(); return s.current ? s.sessions[s.current] || null : null; };
  X.idleLimit = function (ses) { return ses && ses.remember ? X.POLICY.idleRemember : X.POLICY.idle; };
  X.expiresAt = function (ses) { return ses ? ses.last + X.idleLimit(ses) : 0; };
  /* validate(): run on start and on a timer. Returns { ok, code, ctx }.
     Codes: none · expired · revoked · inactive · suspended · locked · no_role · no_plant */
  X.validate = function () {
    var s = load(), ses = X.session();
    if (!ses) return { ok: false, code: 'none' };
    if (ses.status === 'revoked') { endSession(ses, 'revoked'); return { ok: false, code: 'revoked' }; }
    if (X.now() > X.expiresAt(ses)) { X.audit('AUTH.SESSION_EXPIRED', { uid: ses.uid, sid: ses.id, actor: 'system' }); endSession(ses, 'expired'); return { ok: false, code: 'expired' }; }
    var a = X.account(ses.uid);
    if (!a || a.status !== 'active') { X.audit('AUTH.FORCED_LOGOUT', { uid: ses.uid, sid: ses.id, actor: 'system', reason: a ? a.status : 'missing' }); endSession(ses, a ? a.status : 'revoked'); return { ok: false, code: a ? a.status : 'revoked' }; }
    // Permission / role / plant changed during the session: rebuild context from the account (never from cached UI state).
    var ctx = X.resolve(ses.uid, { role: ses.role, plant: ses.plant });
    if (!ctx.ok) { endSession(ses, ctx.code); return { ok: false, code: ctx.code }; }
    var changed = ses.ver !== a.ver || ses.role !== ctx.roleKey || ses.plant !== ctx.plant;
    ses.ver = a.ver; ses.role = ctx.roleKey; ses.plant = ctx.plant; save();
    return { ok: true, ctx: ctx, changed: changed, ses: ses };
  };
  X.touch = function () { var ses = X.session(); if (ses) { ses.last = X.now(); save(); } };
  X.extend = X.touch;
  function endSession(ses, why) { var s = load(); ses.status = why || 'ended'; ses.ended = X.now(); if (s.current === ses.id) s.current = null; save(); }
  // Logout (§51): end the session and clear what this browser holds about the user.
  X.logout = function (why) {
    var ses = X.session(); if (!ses) return;
    X.audit('AUTH.LOGOUT', { uid: ses.uid, sid: ses.id, reason: why || null });
    endSession(ses, 'logout');
    try { if (root.sessionStorage) root.sessionStorage.clear(); } catch (e) {}
  };
  X.switchRole = function (key) {
    var v = X.validate(); if (!v.ok) return v;
    var ctx = v.ctx;
    if (ctx.roles.indexOf(key) < 0) { X.audit('AUTH.ACCESS_DENIED', { uid: ctx.uid, reason: 'role not assigned: ' + key }); return { ok: false, code: 'noperm' }; }
    if (!ctx.user.switchRole && ctx.roles.length > 1) return { ok: false, code: 'noperm' };
    var from = ctx.roleKey; v.ses.role = key; save();
    X.audit('AUTH.ROLE_SWITCH', { uid: ctx.uid, from: X.ROLES[from].n[0], to: X.ROLES[key].n[0] });
    return X.validate();
  };
  X.switchPlant = function (pid) {
    var v = X.validate(); if (!v.ok) return v;
    var ctx = v.ctx;
    if (ctx.plants.indexOf(pid) < 0) { X.audit('AUTH.ACCESS_DENIED', { uid: ctx.uid, reason: 'plant not assigned: ' + pid }); return { ok: false, code: 'noperm' }; }
    var from = ctx.plant; v.ses.plant = pid; save();
    X.audit('AUTH.PLANT_SWITCH', { uid: ctx.uid, from: X.plantName(from)[0], to: X.plantName(pid)[0] });
    return X.validate();
  };
  X.setLang = function (lang) { var ses = X.session(); if (!ses) return; var a = X.account(ses.uid); a.lang = lang === 'en' ? 'en' : 'id'; save(); };

  /* ---------- Admin actions (used by tests and the demo panel; a real build does these from System › User) ---------- */
  function bump(a) { a.ver += 1; }
  X.admin = {
    setStatus: function (uid, status, actor) {
      var a = X.account(uid), from = a.status; a.status = status; if (status === 'active') { a.failed = 0; a.lockUntil = 0; } bump(a); save();
      X.audit(status === 'active' ? 'ACC.ACTIVATED' : status === 'suspended' ? 'ACC.SUSPENDED' : status === 'locked' ? 'ACC.LOCKED' : 'ACC.DEACTIVATED', { uid: uid, actor: actor || 'Admin', from: from, to: status });
    },
    setRoles: function (uid, roles, actor) { var a = X.account(uid), from = a.roles.map(function (r) { return r.k; }).join(', '); a.roles = roles; bump(a); save(); X.audit('ACC.ROLE_CHANGED', { uid: uid, actor: actor || 'Admin', from: from, to: roles.map(function (r) { return r.k; }).join(', ') || '—' }); },
    setPerms: function (uid, grant, deny, actor) { var a = X.account(uid); var from = '+' + a.grant.join(',') + ' −' + a.deny.join(','); a.grant = grant || []; a.deny = deny || []; bump(a); save(); X.audit('ACC.PERM_CHANGED', { uid: uid, actor: actor || 'Admin', from: from, to: '+' + a.grant.join(',') + ' −' + a.deny.join(',') }); },
    setPlants: function (uid, plants, actor) { var a = X.account(uid), from = a.plants.join(', '); a.plants = plants; bump(a); save(); X.audit('ACC.PLANT_CHANGED', { uid: uid, actor: actor || 'Admin', from: from, to: plants.join(', ') || '—' }); },
    forceLogout: function (uid, actor) {
      var s = load(); Object.keys(s.sessions).forEach(function (k) { var ses = s.sessions[k]; if (ses.uid === uid && ses.status === 'active') ses.status = 'revoked'; }); save();
      X.audit('AUTH.FORCED_LOGOUT', { uid: uid, actor: actor || 'Admin' });
    },
    expire: function () { var ses = X.session(); if (ses) { ses.last = X.now() - X.idleLimit(ses) - 1000; save(); } },
    nearExpiry: function () { var ses = X.session(); if (ses) { ses.last = X.now() - X.idleLimit(ses) + X.POLICY.warnBefore - 5000; save(); } }
  };

  /* ---------- Password recovery (§46–§48) — no OTP ---------- */
  X.requestReset = function (identifier) {
    identifier = String(identifier || '').trim();
    if (!identifier) return { ok: false, code: 'empty_user' };
    var net = X.net(); if (net !== 'online') return { ok: false, code: net === 'offline' ? 'network' : 'system' };
    var u = findUser(identifier), s = load();
    if (u && acc(u).status === 'active') {
      var token = Math.random().toString(36).slice(2, 12) + Math.random().toString(36).slice(2, 8);
      s.outbox.unshift({ to: u.email, uid: u.id, token: token, at: X.now(), exp: X.now() + X.POLICY.resetTtl, used: false });
      if (s.outbox.length > 20) s.outbox.length = 20;
      save();
    }
    X.audit('AUTH.RESET_REQ', { uid: u ? u.id : null, actor: u ? X.displayName(u) : identifier, target: u ? u.id : null });
    // Same answer whether or not the account exists (§47).
    return { ok: true, msg: X.MSG.reset_sent };
  };
  X.outbox = function () { return load().outbox.slice(); };
  X.checkToken = function (token) { var m = load().outbox.filter(function (x) { return x.token === token; })[0]; return !!(m && !m.used && m.exp > X.now()); };
  X.validatePassword = function (p1, p2) {
    if (!p1 || p1.length < X.POLICY.minPassword) return { ok: false, code: 'pw_short', field: 'p1' };
    if (p1 !== p2) return { ok: false, code: 'pw_match', field: 'p2' };
    return { ok: true };
  };
  X.resetPassword = function (token, p1, p2) {
    var s = load(), m = s.outbox.filter(function (x) { return x.token === token; })[0];
    if (!m || m.used || m.exp <= X.now()) return { ok: false, code: 'reset_bad' };
    var v = X.validatePassword(p1, p2); if (!v.ok) return v;
    var a = X.account(m.uid); a.pw = p1; a.failed = 0; if (a.status === 'locked') { a.status = 'active'; a.lockUntil = 0; } bump(a);
    m.used = true;
    // A new password ends every open session of this account.
    Object.keys(s.sessions).forEach(function (k) { if (s.sessions[k].uid === m.uid && s.sessions[k].status === 'active') s.sessions[k].status = 'revoked'; });
    save();
    X.audit('AUTH.PW_CHANGED', { uid: m.uid, reason: 'reset link' });
    return { ok: true };
  };
  X.changePassword = function (old, p1, p2) {
    var v0 = X.validate(); if (!v0.ok) return v0;
    var a = X.account(v0.ctx.uid);
    if (old !== a.pw) return { ok: false, code: 'pw_old', field: 'old' };
    var v = X.validatePassword(p1, p2); if (!v.ok) return v;
    if (p1 === old) return { ok: false, code: 'pw_same', field: 'p1' };
    a.pw = p1; save();
    X.audit('AUTH.PW_CHANGED', { uid: v0.ctx.uid, reason: 'profile' });
    return { ok: true };
  };

  /* ---------- Notifications (§37–§45) ----------
     cat: crit · warn · ops · info. to: access role keys that receive it.
     exec: selected critical/high-value alerts the Owner also receives. */
  X.CATS = {
    crit: { n: L('Kritis', 'Critical'), icon: 'alert', tone: 'error' },
    warn: { n: L('Peringatan', 'Warning'), icon: 'clock', tone: 'warning' },
    ops: { n: L('Operasional', 'Operational'), icon: 'truck', tone: 'info' },
    info: { n: L('Informasi', 'Information'), icon: 'bell', tone: 'success' }
  };
  X.NOTIFS = [
    { id: 'NT-01', cat: 'crit', to: ['supervisor', 'opsmgr'], exec: true, plant: 'PL-01', t: L('Order terlambat', 'Order late'), c: L('Grand Vista Hotel · lewat 35 menit', 'Grand Vista Hotel · 35 min over'), ago: 6 * M, cta: { l: L('Lihat Order', 'View Order'), s: 'SLA-MON-001' },
      d: [[L('Klien', 'Client'), 'Grand Vista Hotel'], [L('Tahap', 'Stage'), L('Packing', 'Packing')], [L('Estimasi', 'Due'), '12:00']], hint: L('Prioritaskan packing dan kabari klien bila perlu.', 'Prioritise packing and inform the client if needed.') },
    { id: 'NT-02', cat: 'warn', to: ['operator', 'supervisor', 'qc'], plant: 'PL-01', t: L('SLA hampir habis', 'SLA almost due'), c: L('Hotel ABC · 45 menit tersisa', 'Hotel ABC · 45 min left'), ago: 5 * M, cta: { l: L('Lihat Order', 'View Order'), s: 'OPS-TSK-001' },
      d: [[L('Klien', 'Client'), 'Hotel ABC'], [L('Sisa waktu', 'Time left'), L('45 menit', '45 min')]], hint: L('Kerjakan order ini lebih dulu.', 'Work on this order first.') },
    { id: 'NT-03', cat: 'warn', to: ['supervisor', 'opsmgr'], exec: false, plant: 'PL-01', t: L('Stok hampir habis', 'Stock running low'), c: L('Bleach Oksigen 20 L · tersisa 6', 'Oxygen Bleach 20 L · 6 left'), ago: 25 * M, cta: { l: L('Lihat Stok', 'View Stock'), s: 'INV-STK-001' },
      d: [[L('Item', 'Item'), 'Bleach Oksigen 20 L'], [L('Stok saat ini', 'In stock'), '6 jerigen'], [L('Minimum', 'Minimum'), '8 jerigen'], [L('Lokasi', 'Location'), L('Gudang Utama', 'Main Store')]], hint: L('Segera lakukan pembelian atau transfer stok dari plant lain.', 'Purchase or transfer stock from another plant soon.') },
    { id: 'NT-04', cat: 'ops', to: ['operator', 'supervisor'], plant: 'PL-01', t: L('Order baru masuk', 'New order'), c: L('The Santai Hotel · 46 kg', 'The Santai Hotel · 46 kg'), ago: 32 * M, cta: { l: L('Lihat Antrian', 'View Queue'), s: 'OPS-RCV-002' } },
    { id: 'NT-05', cat: 'ops', to: ['driver'], plant: 'PL-01', t: L('Jadwal pickup berubah', 'Pickup time changed'), c: L('Hotel ABC · 09:00 → 09:30', 'Hotel ABC · 09:00 → 09:30'), ago: 15 * M, cta: { l: L('Lihat Rute', 'View Route'), s: 'LOG-RTE-001' } },
    { id: 'NT-06', cat: 'ops', to: ['driver', 'supervisor'], plant: 'PL-01', t: L('Barang siap dikirim', 'Ready to ship'), c: L('Kayana Resort · 4 bag', 'Kayana Resort · 4 bags'), ago: 50 * M, cta: { l: L('Lihat Pengiriman', 'View Deliveries'), s: 'OPS-DLV-002' } },
    { id: 'NT-07', cat: 'ops', to: ['qc', 'supervisor'], plant: 'PL-01', t: L('QC menunggu', 'QC waiting'), c: L('3 cucian menunggu pemeriksaan', '3 loads waiting for inspection'), ago: 2 * H, cta: { l: L('Buka Antrian QC', 'Open QC Queue'), s: 'OPS-QC-002' } },
    { id: 'NT-08', cat: 'crit', to: ['finance'], exec: true, t: L('Pembayaran gagal', 'Payment failed'), c: L('Oceanview Villa · INV-2610-031', 'Oceanview Villa · INV-2610-031'), ago: 40 * M, cta: { l: L('Lihat Invoice', 'View Invoice'), s: 'FIN-INV-001' } },
    { id: 'NT-09', cat: 'warn', to: ['finance'], t: L('Invoice jatuh tempo', 'Invoice overdue'), c: L('3 invoice lewat jatuh tempo', '3 invoices overdue'), ago: 3 * H, cta: { l: L('Lihat AR', 'View AR'), s: 'FIN-AR-001' } },
    { id: 'NT-10', cat: 'ops', to: ['finance'], t: L('Pembayaran diterima', 'Payment received'), c: L('Grand Vista Hotel · Rp 12.400.000', 'Grand Vista Hotel · Rp 12,400,000'), ago: 1 * H, cta: { l: L('Lihat Pembayaran', 'View Payments'), s: 'FIN-PAY-002' } },
    { id: 'NT-11', cat: 'warn', to: ['sales'], exec: true, t: L('Kontrak segera berakhir', 'Contract ending soon'), c: L('Oceanview Villa · 18 hari lagi', 'Oceanview Villa · 18 days left'), ago: 4 * H, cta: { l: L('Lihat Renewal', 'View Renewals'), s: 'COM-RNW-001' } },
    { id: 'NT-12', cat: 'info', to: ['operator', 'driver', 'qc', 'supervisor', 'opsmgr', 'finance', 'sales', 'owner'], t: L('Jadwal libur nasional diperbarui', 'Public holiday schedule updated'), c: L('Pengumuman HR', 'HR announcement'), ago: 1 * D },
    { id: 'NT-13', cat: 'info', to: ['operator', 'driver', 'qc', 'supervisor', 'opsmgr', 'finance', 'sales', 'owner', 'client'], t: L('Pembaruan sistem malam ini', 'System update tonight'), c: L('22:00–22:15 · tidak perlu tindakan', '22:00–22:15 · no action needed'), ago: 6 * H },
    { id: 'NT-14', cat: 'ops', to: ['client'], client: 'CL-01', t: L('Cucian siap dikirim', 'Laundry ready to ship'), c: L('Order JF2610-00112 · tiba ±14:00', 'Order JF2610-00112 · arrives ±14:00'), ago: 20 * M, cta: { l: L('Lihat Pesanan', 'View Order'), s: 'CLT-ORD-001' } },
    { id: 'NT-15', cat: 'ops', to: ['client'], client: 'CL-05', t: L('Pickup dijadwalkan', 'Pickup scheduled'), c: L('Hotel ABC · besok 06:30', 'Hotel ABC · tomorrow 06:30'), ago: 2 * H, cta: { l: L('Lihat Pesanan', 'View Order'), s: 'CLT-ORD-001' } },
    { id: 'NT-16', cat: 'crit', to: ['supervisor', 'opsmgr'], exec: true, plant: 'PL-02', t: L('Mesin cuci berhenti', 'Washer stopped'), c: L('Plant 2 · Mesin 3', 'Plant 2 · Washer 3'), ago: 12 * M, cta: { l: L('Lihat Produksi', 'View Production'), s: 'PRD-DSH-001' } },
    { id: 'NT-17', cat: 'warn', to: ['owner'], t: L('Rewash rate naik', 'Rewash rate rising'), c: L('1,8% · naik 0,5%', '1.8% · up 0.5%'), ago: 3 * H, cta: { l: L('Lihat Quality', 'View Quality'), s: 'QLT-DSH-001' } }
  ];
  function seedTime(n) { var s = load(); if (!s.nseed) { s.nseed = X.now(); save(); } return s.nseed - n.ago; }
  X.notifsFor = function (ctx) {
    var reads = (load().reads[ctx.uid] || []);
    return X.NOTIFS.filter(function (n) {
      if (ctx.client) return n.to.indexOf('client') >= 0 && (!n.client || n.client === ctx.client);
      var forRole = n.to.indexOf(ctx.roleKey) >= 0 || (ctx.roleKey === 'owner' && n.exec);
      if (!forRole) return false;
      if (n.plant && ctx.plant !== X.ALL && ctx.plant !== n.plant) return false;
      if (n.cta && n.cta.s && !X.canScreen(ctx, n.cta.s)) return false;   // never point at a screen the user cannot open
      return true;
    }).map(function (n) { return Object.assign({}, n, { at: seedTime(n), read: reads.indexOf(n.id) >= 0 }); })
      .sort(function (a, b) { return b.at - a.at; });
  };
  X.unread = function (ctx) { return X.notifsFor(ctx).filter(function (n) { return !n.read; }).length; };
  X.markRead = function (ctx, ids) {
    var s = load(), r = s.reads[ctx.uid] = s.reads[ctx.uid] || [];
    (ids === 'all' ? X.notifsFor(ctx).map(function (n) { return n.id; }) : ids).forEach(function (id) { if (r.indexOf(id) < 0) r.push(id); });
    save();
  };
  X.CHANNELS = [['app', L('Di Aplikasi', 'In-App')], ['email', L('Email', 'Email')], ['push', L('Push Notification (Mobile)', 'Push Notification (Mobile)')]];
  X.prefs = function (ctx) {
    var s = load(), p = s.prefs[ctx.uid];
    if (!p) p = { crit: true, warn: true, ops: true, info: true, app: true, email: ctx.group !== 'frontline', push: ctx.group !== 'management' };
    p.crit = true; p.app = true;   // critical and in-app security/system messages cannot be turned off (§45)
    return p;
  };
  X.setPrefs = function (ctx, p) { var s = load(); p.crit = true; p.app = true; s.prefs[ctx.uid] = p; save(); };

  /* ---------- Phase 4 screens (registered into the app's screen index) ---------- */
  X.SCREENS = [
    { id: 'USER-001', n: L('Profil Saya', 'My Profile'), a: 'T03', p4: true, icon: 'user' },
    { id: 'USER-002', n: L('Ganti Password', 'Change Password'), a: 'T06', p4: true, icon: 'key' },
    { id: 'USER-003', n: L('Ganti Peran', 'Switch Role'), a: 'T06', p4: true, icon: 'swap' },
    { id: 'USER-004', n: L('Ganti Plant', 'Switch Plant'), a: 'T06', p4: true, icon: 'building' },
    { id: 'NOTIF-001', n: L('Notifikasi', 'Notifications'), a: 'T02', p4: true, icon: 'bell' },
    { id: 'NOTIF-002', n: L('Detail Notifikasi', 'Notification Detail'), a: 'T03', p4: true, icon: 'bell' },
    { id: 'NOTIF-003', n: L('Pengaturan Notifikasi', 'Notification Settings'), a: 'T06', p4: true, icon: 'cog' },
    { id: 'HELP-001', n: L('Bantuan', 'Help'), a: 'T03', p4: true, icon: 'help' }
  ].map(function (s) {
    return Object.assign({ p: null, dom: 'user', lvl: 2, bf: ['BF-03'], nb: [], emp: L('Belum ada data.', 'Nothing here yet.'), err: L('Data belum berhasil dimuat. Coba lagi.', 'Could not load the data. Try again.'), warn: L('Perlu perhatian.', 'Needs attention.'), ok: L('Tersimpan.', 'Saved.') }, s);
  });
  X.registerScreens = function (cfg) {
    cfg = cfg || C;
    if (cfg.__p4) return; cfg.__p4 = true;
    var orig = cfg.screen, extra = {};
    X.SCREENS.forEach(function (s) { extra[s.id] = s; });
    cfg.screen = function (id) { return extra[id] || orig(id); };
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = X;
  else root.JFACCESS = X;
})(typeof window !== 'undefined' ? window : this);
