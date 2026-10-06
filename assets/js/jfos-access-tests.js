/* ==========================================================================
   JFRESH OS — Phase 4 automated test cases (§74 login, §75 access
   resolution, §76 landing pages). Each case resets the access store, runs
   against the real access engine (jfos-access.js) and returns pass / fail.
   Run in node:    node tools/test-access.js
   Run in browser: phase4/tests.html
   ========================================================================== */
(function (root) {
  function L(a, b) { return [a, b === undefined ? a : b]; }
  var T = [];
  function add(group, id, name, fn) { T.push({ group: group, id: id, n: name, fn: fn }); }
  function eq(a, b, what) { if (a !== b) throw new Error((what || 'value') + ': expected ' + JSON.stringify(b) + ', got ' + JSON.stringify(a)); }
  function ok(v, what) { if (!v) throw new Error(what || 'expected true'); }
  var PW = 'jfresh123';

  /* ----- §74 Login ----- */
  add('login', 'LGN-01', L('Username + password benar', 'Valid username + password'), function (X) { var r = X.login('made', PW); eq(r.ok, true, 'ok'); eq(X.session().uid, 'USR-001', 'session user'); });
  add('login', 'LGN-02', L('Login dengan email', 'Login with email'), function (X) { eq(X.login('BUDI@jfreshlaundry.app', PW).ok, true, 'ok'); });
  add('login', 'LGN-03', L('Password salah → pesan umum', 'Wrong password → generic message'), function (X) { var r = X.login('made', 'salah'); eq(r.code, 'invalid', 'code'); eq(X.MSG.invalid[0], 'Username atau password belum benar.', 'copy'); });
  add('login', 'LGN-04', L('Username tidak terdaftar → pesan sama', 'Unknown username → same message'), function (X) { eq(X.login('tidakada', PW).code, 'invalid', 'code'); });
  add('login', 'LGN-05', L('Username kosong', 'Empty username'), function (X) { var r = X.login('', PW); eq(r.code, 'empty_user'); eq(r.field, 'user'); });
  add('login', 'LGN-06', L('Password kosong', 'Empty password'), function (X) { var r = X.login('made', ''); eq(r.code, 'empty_pass'); eq(r.field, 'pass'); });
  add('login', 'LGN-07', L('Akun tidak aktif', 'Inactive account'), function (X) { eq(X.login('nyoman', PW).code, 'inactive'); });
  add('login', 'LGN-08', L('Akun tidak aktif + password salah tidak membuka status', 'Inactive account + wrong password hides status'), function (X) { eq(X.login('nyoman', 'x').code, 'invalid'); });
  add('login', 'LGN-09', L('Akun terkunci', 'Locked account'), function (X) { eq(X.login('rina', PW).code, 'locked'); });
  add('login', 'LGN-10', L('5x salah → akun dikunci sementara', '5 wrong attempts → temporary lock'), function (X) {
    for (var i = 0; i < 4; i++) eq(X.login('ayu', 'x').code, 'invalid', 'attempt ' + (i + 1));
    eq(X.login('ayu', 'x').code, 'locked', 'attempt 5'); eq(X.login('ayu', PW).code, 'locked', 'correct password while locked');
    var t0 = X.now(); X._setClock(function () { return t0 + 16 * 60e3; }); eq(X.login('ayu', PW).ok, true, 'unlocked after 15 min');
  });
  add('login', 'LGN-11', L('Terlalu banyak percobaan dari perangkat', 'Too many attempts from one device'), function (X) {
    var u = ['a1', 'a2', 'a3', 'a4', 'a5', 'a6', 'a7', 'a8']; u.forEach(function (x) { X.login(x, 'x'); });
    eq(X.login('made', PW).code, 'too_many');
  });
  add('login', 'LGN-12', L('Jaringan tidak tersedia', 'Network unavailable'), function (X) { X.setNet('offline'); eq(X.login('made', PW).code, 'network'); });
  add('login', 'LGN-13', L('Server tidak tersedia', 'Server unavailable'), function (X) { X.setNet('error'); eq(X.login('made', PW).code, 'system'); });
  add('login', 'LGN-14', L('Pesan error tanpa kode teknis', 'Error copy has no technical codes'), function (X) {
    Object.keys(X.MSG).forEach(function (k) { var s = X.MSG[k].join(' '); ok(!/\b(4\d\d|5\d\d)\b|HTTP|API|stack|exception|SQL|null/i.test(s), k + ' contains technical wording'); });
  });
  add('login', 'LGN-15', L('Login normal tanpa OTP', 'Normal login without OTP'), function (X) { eq(X.POLICY.otp, false, 'otp policy'); var r = X.login('made', PW); eq(r.ok, true); ok(!r.otp && !r.challenge, 'no second step'); });
  add('login', 'LGN-16', L('Ingat saya: username diingat, sesi lebih lama', 'Remember me: username kept, longer session'), function (X) {
    X.login('made', PW, { remember: true }); eq(X.idleLimit(X.session()), X.POLICY.idleRemember, 'idle'); X.logout(); X.login('made', PW); eq(X.idleLimit(X.session()), X.POLICY.idle, 'idle without remember');
  });
  add('login', 'LGN-17', L('Logout lalu login lagi', 'Logout then login again'), function (X) { X.login('made', PW); var a = X.session().id; X.logout(); eq(X.session(), null, 'no session'); eq(X.validate().code, 'none'); X.login('made', PW); ok(X.session().id !== a, 'new session id'); });
  add('login', 'LGN-18', L('Bahasa default ID, ganti EN tidak mengubah data/akses', 'Default ID; switching to EN keeps data/access'), function (X) {
    X.login('made', PW); var v1 = X.validate().ctx; eq(v1.lang, 'id', 'default'); X.setLang('en'); var v2 = X.validate().ctx;
    eq(v2.lang, 'en'); eq(v2.perms.join(), v1.perms.join(), 'perms'); eq(v2.landing, v1.landing, 'landing'); eq(v2.nav.map(function (n) { return n.s; }).join(), v1.nav.map(function (n) { return n.s; }).join(), 'nav');
  });
  add('login', 'LGN-19', L('Audit login berhasil & gagal', 'Audit for successful & failed login'), function (X) {
    X.login('made', 'x'); X.login('made', PW); var log = X.auditLog(); eq(log[0].ev, 'AUTH.LOGIN_OK'); eq(log[1].ev, 'AUTH.LOGIN_FAIL'); eq(log[0].emp, 'EMP-001', 'employee id'); ok(log[0].session, 'session id');
  });

  /* ----- §75 Access resolution ----- */
  add('access', 'ACC-01', L('User satu peran', 'Single-role user'), function (X) { X.login('made', PW); var c = X.validate().ctx; eq(c.roleKey, 'operator'); eq(c.roles.length, 1); eq(c.plant, 'PL-01'); });
  add('access', 'ACC-02', L('User multi-peran memakai peran default', 'Multi-role user starts on default role'), function (X) { X.login('saras', PW); var c = X.validate().ctx; eq(c.roleKey, 'supervisor'); eq(c.roles.join(), 'supervisor,qc'); });
  add('access', 'ACC-03', L('Ganti peran ke peran yang ditugaskan + audit', 'Switch to an assigned role + audit'), function (X) {
    X.login('saras', PW); var r = X.switchRole('qc'); eq(r.ok, true); eq(r.ctx.roleKey, 'qc'); eq(r.ctx.landing, 'OPS-QC-002', 'landing reloads'); eq(X.auditLog()[0].ev, 'AUTH.ROLE_SWITCH');
    ok(r.ctx.nav.every(function (n) { return n.s !== 'OPS-BRD-001'; }), 'supervisor menu removed');
  });
  add('access', 'ACC-04', L('Tidak bisa memilih peran yang tidak ditugaskan', 'Cannot pick an unassigned role'), function (X) { X.login('saras', PW); eq(X.switchRole('owner').code, 'noperm'); eq(X.validate().ctx.roleKey, 'supervisor'); });
  add('access', 'ACC-05', L('Tanpa peran aktif', 'No valid role'), function (X) { eq(X.login('dewa', PW).code, 'no_role'); });
  add('access', 'ACC-06', L('Peran dicabut saat sesi berjalan', 'Role removed during the session'), function (X) { X.login('made', PW); X.admin.setRoles('USR-001', []); eq(X.validate().code, 'no_role'); eq(X.session(), null); });
  add('access', 'ACC-07', L('Satu plant', 'Single plant'), function (X) { X.login('made', PW); var c = X.validate().ctx; eq(c.plants.join(), 'PL-01'); eq(X.switchPlant('PL-02').code, 'noperm'); });
  add('access', 'ACC-08', L('Multi plant: ganti plant + audit', 'Multiple plants: switch + audit'), function (X) { X.login('saras', PW); var r = X.switchPlant('PL-02'); eq(r.ctx.plant, 'PL-02'); eq(X.auditLog()[0].ev, 'AUTH.PLANT_SWITCH'); });
  add('access', 'ACC-09', L('Data dibatasi per plant', 'Data scoped by plant'), function (X) {
    X.login('saras', PW); var c = X.validate().ctx; ok(X.inScope(c, { cl: 'CL-01' }), 'Ubud order visible'); ok(!X.inScope(c, { cl: 'CL-03' }), 'Gianyar order hidden');
    c = X.switchPlant('PL-02').ctx; ok(X.inScope(c, { cl: 'CL-03' }), 'after switch'); ok(!X.inScope(c, { cl: 'CL-01' }), 'Ubud hidden after switch');
  });
  add('access', 'ACC-10', L('Akses plant dicabut saat sesi', 'Plant access removed during session'), function (X) { X.login('saras', PW); X.switchPlant('PL-02'); X.admin.setPlants('USR-021', ['PL-01']); var v = X.validate(); eq(v.ok, true); eq(v.ctx.plant, 'PL-01', 'falls back'); eq(v.changed, true); });
  add('access', 'ACC-11', L('Menu dibatasi sesuai hak akses', 'Navigation restricted by permission'), function (X) {
    X.login('made', PW); var c = X.validate().ctx; var ids = c.nav.map(function (n) { return n.s; });
    ok(ids.every(function (s) { return !/^FIN|^COM|^RPT|^SYS/.test(s); }), 'no finance/commercial/report/system for operator'); ok(c.mnav.length <= 5, 'mobile ≤ 5');
  });
  add('access', 'ACC-12', L('Deep link ke halaman terlarang', 'Restricted deep link'), function (X) { X.login('made', PW); var c = X.validate().ctx; eq(X.authorize(c, 'FIN-INV-001').code, 'noperm'); eq(X.authorize(c, 'OPS-RCV-002').ok, true); });
  add('access', 'ACC-13', L('Hak akses berubah saat sesi', 'Permission changed during session'), function (X) {
    X.login('made', PW); X.admin.setPerms('USR-001', [], ['ops.receive']); var v = X.validate(); eq(v.changed, true); ok(!X.can(v.ctx, 'ops.receive'), 'receive revoked'); eq(X.authorize(v.ctx, 'OPS-RCV-001').code, 'noperm');
    eq(X.auditLog()[0].ev, 'ACC.PERM_CHANGED');
  });
  add('access', 'ACC-14', L('Akun dinonaktifkan saat sesi', 'Account deactivated during session'), function (X) { X.login('made', PW); X.admin.setStatus('USR-001', 'inactive'); eq(X.validate().code, 'inactive'); eq(X.session(), null); });
  add('access', 'ACC-15', L('Logout paksa oleh admin', 'Forced logout by admin'), function (X) { X.login('made', PW); X.admin.forceLogout('USR-001'); eq(X.validate().code, 'revoked'); });
  add('access', 'ACC-16', L('Sesi berakhir karena tidak aktif', 'Session expires when idle'), function (X) { X.login('made', PW); var t0 = X.now(); X._setClock(function () { return t0 + 31 * 60e3; }); eq(X.validate().code, 'expired'); });
  add('access', 'ACC-17', L('Role ≠ semua aksi: Finance tidak bisa approve koreksi', 'Role ≠ every action: Finance cannot approve corrections'), function (X) { X.login('budi', PW); var c = X.validate().ctx; ok(X.can(c, 'fin.invoice'), 'create invoice'); ok(!X.can(c, 'fin.invoice.fix.approve'), 'approve denied'); });
  add('access', 'ACC-18', L('Manager bukan super admin otomatis', 'Managers are not super admin by default'), function (X) { X.login('saras', PW); var c = X.validate().ctx; eq(c.full, false); ok(!X.can(c, 'sys.users'), 'no user admin'); X.logout(); X.login('aji', PW); eq(X.validate().ctx.full, true, 'owner full access is explicit'); });
  add('access', 'ACC-19', L('Isolasi data klien', 'Client data isolation'), function (X) {
    X.login('sari.grandvista', PW); var c = X.validate().ctx; ok(X.inScope(c, { cl: 'CL-01' }), 'own order'); ok(!X.inScope(c, { cl: 'CL-05' }), 'other client order');
    eq(X.authorize(c, 'CLT-ORD-002', { cl: 'CL-05' }).code, 'scope'); eq(X.authorize(c, 'OPS-BRD-001').code, 'noperm');
    ok(X.notifsFor(c).every(function (n) { return !n.client || n.client === 'CL-01'; }), 'notifications isolated');
  });
  add('access', 'ACC-20', L('Riwayat karyawan tetap saat akun nonaktif', 'Employee history kept when account inactive'), function (X) { var e = X.employee('EMP-060'); ok(e, 'employee kept'); eq(X.account('USR-060').status, 'inactive'); eq(X.employee('EMP-061') && X.USERS.some(function (u) { return u.emp === 'EMP-061'; }), false, 'employee without user'); });
  add('access', 'ACC-21', L('Reset password tanpa OTP, pesan generik', 'Password reset without OTP, generic message'), function (X) {
    var a = X.requestReset('made'), b = X.requestReset('tidakada@x.id'); eq(a.msg[0], b.msg[0], 'same message'); var m = X.outbox()[0]; eq(m.to, 'made@jfreshlaundry.app');
    eq(X.resetPassword(m.token, 'pendek', 'pendek').code, 'pw_short'); eq(X.resetPassword(m.token, 'rahasia123', 'rahasia124').code, 'pw_match');
    eq(X.resetPassword(m.token, 'rahasia123', 'rahasia123').ok, true); eq(X.resetPassword(m.token, 'rahasia123', 'rahasia123').code, 'reset_bad', 'single use');
    eq(X.login('made', PW).code, 'invalid', 'old password'); eq(X.login('made', 'rahasia123').ok, true, 'new password');
  });
  add('access', 'ACC-22', L('Notifikasi sesuai peran', 'Notifications filtered by role'), function (X) {
    X.login('made', PW); var op = X.notifsFor(X.validate().ctx); ok(op.every(function (n) { return n.id !== 'NT-09' && n.id !== 'NT-08'; }), 'operator gets no invoice alerts'); X.logout();
    X.login('budi', PW); var fin = X.notifsFor(X.validate().ctx); ok(fin.every(function (n) { return n.id !== 'NT-04' && n.id !== 'NT-07'; }), 'finance gets no floor alerts'); X.logout();
    X.login('aji', PW); var ow = X.notifsFor(X.validate().ctx); ok(ow.every(function (n) { return n.exec || n.to.indexOf('owner') >= 0; }), 'owner gets selected alerts only');
  });
  add('access', 'ACC-23', L('Notifikasi kritis tidak bisa dimatikan', 'Critical notifications cannot be disabled'), function (X) { X.login('made', PW); var c = X.validate().ctx; X.setPrefs(c, { crit: false, warn: false, app: false }); var p = X.prefs(c); eq(p.crit, true); eq(p.app, true); eq(p.warn, false); });

  /* ----- §76 Landing pages ----- */
  [['made', 'operator', 'HOM-OPR-001'], ['ketut', 'driver', 'HOM-DRV-001'], ['saras', 'supervisor', 'HOM-SPV-001'], ['budi', 'finance', 'HOM-FIN-001'], ['ayu', 'sales', 'HOM-SAL-001'], ['aji', 'owner', 'HOM-EXE-001'], ['sari.grandvista', 'client', 'HOM-CLT-001']].forEach(function (x, i) {
    add('landing', 'LND-0' + (i + 1), L(X0(x[1]) + ' → ' + x[2], X0(x[1]) + ' → ' + x[2]), function (X) { var r = X.login(x[0], PW); eq(r.ok, true); eq(r.landing, x[2], 'landing'); var c = X.validate().ctx; eq(c.roleKey, x[1]); ok(X.canScreen(c, x[2]), 'can open landing'); });
  });
  function X0(k) { return { operator: 'Receiving Operator', driver: 'Driver', supervisor: 'Supervisor', finance: 'Finance', sales: 'Sales / Account', owner: 'Owner / CEO', client: 'Client' }[k]; }
  add('landing', 'LND-08', L('Tidak ada landing universal', 'No universal landing page'), function (X) {
    var seen = {}; ['made', 'ketut', 'saras', 'budi', 'ayu', 'aji', 'sari.grandvista'].forEach(function (u) { X.logout(); var r = X.login(u, PW); seen[r.landing] = 1; }); eq(Object.keys(seen).length, 7, 'distinct landings');
  });
  add('landing', 'LND-09', L('Operator tidak melihat finance/harga', 'Operator does not see finance/pricing'), function (X) { X.login('made', PW); var c = X.validate().ctx; ['fin.view', 'com.rate.view', 'rpt.fin', 'com.client.view'].forEach(function (p) { ok(!X.can(c, p), p); }); });

  function run(X, opts) {
    opts = opts || {};
    var out = [];
    T.forEach(function (tc) {
      X._resetStore(); var base = Date.now(); X._setClock(function () { return base; });
      var r = { group: tc.group, id: tc.id, n: tc.n, ok: true, err: null };
      try { tc.fn(X); } catch (e) { r.ok = false; r.err = e.message; }
      out.push(r);
    });
    X._resetStore(); X._setClock(function () { return Date.now(); });
    return out;
  }
  var API = { cases: T, run: run };
  if (typeof module !== 'undefined' && module.exports) module.exports = API; else root.JFACCESS_TESTS = API;
})(typeof window !== 'undefined' ? window : this);
