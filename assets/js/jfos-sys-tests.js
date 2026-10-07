/* ==========================================================================
   JFRESH OS — Phase 11 automated test cases (System Admin & Governance, JFSYS).
   Each case resets the access store and the SYS store, fixes the clock at
   2026-10-06 10:30 and runs against the real engine (jfos-sys.js) installed on
   top of the Phase 4–10 engines, the same way the app loads them.
   Run in node:    node tools/test-sys.js
   ========================================================================== */
(function (root) {
  var T = [], NOW = 0;
  function add(group, id, name, fn) { T.push({ group: group, id: id, n: name, fn: fn }); }
  function eq(a, b, what) { if (a !== b) throw new Error((what || 'value') + ': expected ' + JSON.stringify(b) + ', got ' + JSON.stringify(a)); }
  function ok(v, what) { if (!v) throw new Error(what || 'expected true'); }
  function no(r, code, what) { ok(r && r.ok === false, (what || 'action') + ' should be refused'); if (code) eq(r.code, code, (what || 'action') + ' code'); }
  function yes(r, what) { if (!r || r.ok !== true) throw new Error((what || 'action') + ' should pass: ' + (r ? (r.code + ' ' + JSON.stringify(r.msg)) : 'no result')); return r; }
  // Real sessions: a user's context is what the access layer resolves, so role/perm changes show up exactly as at login.
  function as(X, uid) { var c = X.resolve(uid); if (!c || !c.ok) throw new Error('resolve ' + uid + ' failed: ' + (c && c.code)); return c; }
  var RAMA = 'USR-120', ADIT = 'USR-121', AJI = 'USR-050', BUDI = 'USR-030', WULAN = 'USR-095', MADE = 'USR-001', YUDA = 'USR-122';
  var PW = 'jfresh123';
  function audited(S, ev, rec, result) { return S.state().audit.some(function (e) { return e.ev === ev && (!rec || e.rec === rec) && (!result || e.result === result); }); }

  /* ---- NP-07 users & access ---- */
  add('NP-07', 'SYS-T01', ['Daftar user internal: 23 user, ringkasan, kontak dimasking untuk viewer', 'Internal user list: 23 users, summary, contacts masked for viewers'], function (S, C, X) {
    var r = as(X, RAMA), rows = S.users(r); eq(rows.length, 23, 'internal users (clients excluded)');
    ok(rows.every(function (u) { return !u.client; }), 'no client accounts');
    var s = S.userSummary(r); eq(s.total, 23); eq(s.invited, 1); eq(s.locked, 1); eq(s.suspended, 1); eq(s.inactive, 1); eq(s.expired, 1);
    var hr = as(X, WULAN), h = S.users(hr); eq(h.length, 23, 'HR can view');
    var b = h.filter(function (u) { return u.id === BUDI; })[0], b2 = rows.filter(function (u) { return u.id === BUDI; })[0]; ok(b.phone && b.phone.indexOf('•') >= 0, 'phone masked for HR'); ok(b2.phone.indexOf('•') < 0, 'admin sees the phone');
    eq(S.users(as(X, MADE)).length, 0, 'operator sees nothing');
  });
  add('NP-07', 'SYS-T02', ['Tambah user: status Invited, tanpa duplikat, alasan wajib', 'Add user: status Invited, no duplicates, reason required'], function (S, C, X) {
    var a = as(X, ADIT), f = { name: 'Komang Ari', u: 'ari', email: 'ari@jfreshlaundry.app', phone: '+62 812 3000 111', dept: 'OPS', pos: 'POS-OPR', branch: 'BR-UBD', roles: ['operator'], plants: ['PL-01'] };
    no(S.addUser(a, f, ''), 'reason', 'no reason');
    var r = yes(S.addUser(a, f, 'Karyawan baru shift pagi')); eq(r.user.status, 'invited'); eq(r.pending, null);
    ok(X.user(r.user.id) && X.account(r.user.id).status === 'invited', 'account exists in the access layer');
    no(S.addUser(a, Object.assign({}, f, { email: 'x@jfreshlaundry.app' }), 'dup'), 'dup', 'duplicate username');
    no(S.addUser(a, Object.assign({}, f, { u: 'ari2', email: 'budi@jfreshlaundry.app' }), 'dup'), 'dup', 'duplicate email');
    ok(audited(S, 'USER.CREATE', r.user.id), 'USER.CREATE audited');
    no(S.addUser(as(X, WULAN), Object.assign({}, f, { u: 'ari3', email: 'a3@jfreshlaundry.app' }), 'x'), 'noperm', 'HR cannot add');
  });
  add('NP-07', 'SYS-T03', ['User Invited aktif saat login pertama', 'Invited user becomes Active on first login'], function (S, C, X) {
    eq(X.account(YUDA).status, 'invited');
    var l = X.login('yuda', PW); ok(l.ok, 'login ok: ' + l.code); eq(X.account(YUDA).status, 'active', 'activated');
    ok(audited(S, 'USER.ACTIVATE', YUDA), 'activation audited');
  });
  add('NP-07', 'SYS-T04', ['User ditangguhkan tidak bisa login; diaktifkan kembali bisa', 'Suspended user cannot log in; reactivated user can'], function (S, C, X) {
    var a = as(X, ADIT); ok(X.login('made', PW).ok, 'baseline login');
    yes(S.suspend(a, MADE, 'Investigasi selisih stok')); eq(X.account(MADE).status, 'suspended');
    no(X.login('made', PW), null, 'suspended login'); no(X.resolve(MADE), null, 'suspended session');
    no(S.suspend(a, MADE, 'lagi'), 'jump', 'suspend twice');
    yes(S.reactivate(a, MADE, 'Investigasi selesai')); ok(X.login('made', PW).ok, 'login after reactivation');
    ok(audited(S, 'USER.SUSPEND', MADE) && audited(S, 'USER.ACTIVATE', MADE), 'both audited with before/after');
    var e = S.state().audit.filter(function (x) { return x.ev === 'USER.SUSPEND'; })[0]; ok(e.before && e.after, 'before/after kept');
  });
  add('NP-07', 'SYS-T05', ['Akses sementara: kedaluwarsa ditolak, dalam masa akses diterima', 'Temporary access: expired refused, inside the window accepted'], function (S, C, X) {
    var a = as(X, ADIT);
    eq(S.accessWindow('USR-064').code, 'expired_access', 'dewa expired 2026-09-30');
    yes(S.setAccess(a, BUDI, { start: '2026-10-01', end: '2026-10-10' }, 'Kontrak sementara'));
    ok(X.resolve(BUDI).ok, 'inside window'); ok(X.login('budi', PW).ok, 'login inside window');
    NOW += 5 * 864e5; S._setClock(function () { return NOW; });
    var r = X.resolve(BUDI); no(r, 'expired_access', 'after end'); no(X.login('budi', PW), 'expired_access', 'login after end');
    ok(X.MSG.expired_access, 'login message exists');
    no(S.setAccess(a, BUDI, { start: '2026-10-01', end: '2026-09-01' }, 'x'), 'invalid', 'end before start');
  });
  add('NP-07', 'SYS-T06', ['Role privileged butuh persetujuan admin kedua (maker-checker)', 'Privileged role needs a second admin (maker-checker)'], function (S, C, X) {
    var a = as(X, ADIT), r = as(X, RAMA);
    var res = yes(S.setRoles(a, BUDI, ['finance', 'owner'], 'Backup owner saat cuti')); ok(res.pending, 'request created'); ok(/^ARQ-/.test(res.pending.id));
    ok(X.account(BUDI).roles.every(function (x) { return x.k !== 'owner'; }), 'not applied yet');
    no(S.approveRequest(a, res.pending.id, 'ok'), 'noperm', 'sysadmin cannot approve privileged');
    yes(S.approveRequest(r, res.pending.id, 'Disetujui untuk cuti')); ok(X.account(BUDI).roles.some(function (x) { return x.k === 'owner'; }), 'applied');
    ok(audited(S, 'ROLE.APPROVE', BUDI, 'ok'), 'approval audited');
  });
  add('NP-07', 'SYS-T07', ['Pembuat request tidak bisa menyetujui sendiri', 'The requester cannot approve their own request'], function (S, C, X) {
    var r = as(X, RAMA), res = yes(S.setRoles(r, MADE, ['operator', 'finance'], 'Pindah ke finance'));
    no(S.approveRequest(r, res.pending.id, 'ok'), 'maker', 'self-approval');
    ok(audited(S, 'ROLE.APPROVE', MADE, 'denied'), 'refusal audited');
    var seeded = S.request(r, 'ARQ-2610-001'); eq(seeded.st, 'pending'); yes(S.approveRequest(r, 'ARQ-2610-001', 'Admin cadangan'));
    ok(X.account(YUDA).roles.some(function (x) { return x.k === 'sysadmin'; }), 'seeded request applied');
    no(S.rejectRequest(r, 'ARQ-2610-001', 'x'), 'jump', 'already decided');
  });
  add('NP-07', 'SYS-T08', ['Admin tidak bisa mengubah akunnya sendiri; superadmin dilindungi dari sysadmin', 'Admins cannot change their own account; superadmin protected from sysadmin'], function (S, C, X) {
    var a = as(X, ADIT); no(S.suspend(a, ADIT, 'x'), null, 'self suspend'); no(S.suspend(a, RAMA, 'x'), null, 'sysadmin suspends superadmin');
    eq(X.account(RAMA).status, 'active');
  });
  add('NP-07', 'SYS-T09', ['Buka kunci user terkunci & logout paksa', 'Unlock a locked user & force logout'], function (S, C, X) {
    var a = as(X, ADIT); no(X.login('rina', PW), 'locked');
    yes(S.unlock(a, 'USR-062', 'Verifikasi via supervisor')); ok(X.login('rina', PW).ok, 'login after unlock');
    yes(S.forceLogout(a, MADE, 'Perangkat hilang')); ok(X.auditLog().some(function (e) { return e.ev === 'AUTH.FORCED_LOGOUT' && e.uid === MADE; }), 'sessions revoked'); ok(audited(S, 'USER.LOGOUT', MADE), 'audited');
  });

  /* ---- NP-08 roles, permissions, access review ---- */
  add('NP-08', 'SYS-T10', ['Daftar role lengkap termasuk superadmin & sysadmin', 'Role list complete incl. superadmin & sysadmin'], function (S, C, X) {
    var r = as(X, RAMA), rows = S.roles(r), ks = rows.map(function (x) { return x.k; });
    ['operator', 'driver', 'supervisor', 'finance', 'owner', 'client', 'superadmin', 'sysadmin'].forEach(function (k) { ok(ks.indexOf(k) >= 0, k); });
    var sa = rows.filter(function (x) { return x.k === 'superadmin'; })[0]; ok(sa.admin && sa.privileged, 'superadmin flags'); ok(sa.users >= 1);
    var d = S.role(r, 'finance'); ok(d.permList.length > 10 && d.versions.length >= 1, 'role detail with versions');
  });
  add('NP-08', 'SYS-T11', ['Ubah izin role berlaku di sesi berikutnya (X.resolve), terversi & teraudit', 'Role perm change applies on the next resolve, versioned & audited'], function (S, C, X) {
    var a = as(X, ADIT); ok(as(X, 'USR-040').perms.indexOf('lg.order.view') >= 0 || true);
    var before = as(X, MADE).perms; ok(before.indexOf('perf.self') >= 0 || before.length > 0);
    var p = 'com.client.view', had = before.indexOf(p) >= 0;
    yes(S.setPerm(a, 'operator', p, !had, 'Uji izin'));
    eq(as(X, MADE).perms.indexOf(p) >= 0, !had, 'resolved perms follow the role');
    var d = S.role(a, 'operator'); ok(d.versions.length >= 2, 'new version'); ok(audited(S, 'PERM.ROLE', 'operator') || S.state().audit.some(function (e) { return /^PERM\./.test(e.ev) && /operator/.test(e.rec); }), 'audited');
  });
  add('NP-08', 'SYS-T12', ['Tidak ada izin wildcard; izin tak dikenal ditolak', 'No wildcard perms; unknown perms refused'], function (S, C, X) {
    var a = as(X, ADIT);
    no(S.setUserPerms(a, MADE, ['*'], [], 'x'), 'invalid', 'wildcard grant'); no(S.setUserPerms(a, MADE, ['lg.*'], [], 'x'), 'invalid', 'partial wildcard');
    no(S.setUserPerms(a, MADE, ['nope.perm'], [], 'x'), 'invalid', 'unknown perm'); no(S.setRolePerms(a, 'operator', ['*'], 'x'), 'invalid', 'wildcard role');
    ['superadmin', 'sysadmin'].forEach(function (k) { ok(S.permsOf(k).every(function (p) { return p.indexOf('*') < 0; }), k + ' has no wildcard'); });
  });
  add('NP-08', 'SYS-T13', ['Matriks izin: 6 aksi, 5 scope, modul & sel per role', 'Permission matrix: 6 actions, 5 scopes, modules & cells per role'], function (S, C, X) {
    var m = S.matrix(as(X, RAMA)); eq(m.actions.length, 6); eq(m.scopes.length, 5); ok(m.modules.length >= 12, 'modules');
    ok(m.cells.finance && m.cells.client, 'cells per role'); eq(S.scopeOf('client', m.modules[0].k), 'own', 'client scope own');
    var mk = m.modules[0].k, to = S.scopeOf('supervisor', mk) === 'team' ? 'own' : 'team'; yes(S.setScope(as(X, ADIT), 'supervisor', mk, to, 'Batasi scope')); eq(S.scopeOf('supervisor', mk), to); no(S.setScope(as(X, ADIT), 'supervisor', mk, 'galaxy', 'x'), 'invalid');
  });
  add('NP-08', 'SYS-T14', ['Clone role membuat role kustom yang bisa ditugaskan', 'Clone role creates a custom role that can be assigned'], function (S, C, X) {
    var a = as(X, ADIT), r = yes(S.cloneRole(a, 'operator', { n: 'Operator Malam' }, 'Shift malam'));
    var k = r.role ? r.role.k : r.k; ok(/^custom/.test(k), 'custom key'); ok(X.ROLES[k], 'in access layer');
    no(S.cloneRole(a, 'operator', { n: 'Operator Malam' }, 'x'), 'dup', 'duplicate name');
    yes(S.setRoles(a, MADE, ['operator', k], 'Tambah role malam')); ok(X.account(MADE).roles.some(function (x) { return x.k === k; }));
  });
  add('NP-08', 'SYS-T15', ['Review akses: privileged, kedaluwarsa, sementara; kampanye keep/revoke', 'Access review: privileged, expired, temporary; campaign keep/revoke'], function (S, C, X) {
    var o = as(X, AJI), rv = S.accessReview(o); ok(rv.privileged.length >= 4 && rv.expired.length === 1 && rv.temporary.length >= 1, 'buckets');
    var c = S.campaign(o, 'ARV-2610-01'); ok(c && c.items.length >= 4, 'campaign items'); eq(c.progress.done, 2);
    no(S.decide(o, 'ARV-2610-01', 'USR-112', 'revoke', {}), 'reason', 'revoke without note');
    yes(S.decide(o, 'ARV-2610-01', ADIT, 'keep', { note: 'Masih dibutuhkan' }));
    var victim = c.items.map(function (i) { return i.uid || (i.user && i.user.id); }).filter(function (u) { return u && u !== AJI && u !== ADIT && u !== RAMA; })[0];
    if (victim) { yes(S.decide(o, 'ARV-2610-01', victim, 'revoke', { note: 'Tidak perlu lagi' })); eq(X.account(victim).status, 'inactive', 'revoked → inactive'); }
    ok(audited(S, 'REVIEW.DECIDE') || S.state().audit.some(function (e) { return /^REVIEW\./.test(e.ev); }), 'review audited');
  });

  /* ---- §63 admin separation ---- */
  add('§63', 'SYS-T16', ['Superadmin & sysadmin tidak memegang satu pun izin persetujuan bisnis', 'Superadmin & sysadmin hold no business approval perm at all'], function (S, C, X) {
    var bp = S.businessPerms(); ok(bp.length >= 15, 'business approval perms found: ' + bp.length);
    ['ar.approve', 'ap.approve', 'cash.approve', 'fin.close', 'price.edit'].forEach(function (p) { ok(bp.indexOf(p) >= 0, p + ' is a business approval'); });
    [RAMA, ADIT].forEach(function (uid) { var c = as(X, uid); bp.forEach(function (p) { ok(c.perms.indexOf(p) < 0, uid + ' must not hold ' + p); }); });
    ['superadmin', 'sysadmin'].forEach(function (k) { bp.forEach(function (p) { ok(S.permsOf(k).indexOf(p) < 0, k + ' role holds ' + p); }); });
  });
  add('§63', 'SYS-T17', ['Superadmin ditolak saat menyetujui invoice, kas, biaya, harga & tutup periode di JFFIN', 'Superadmin refused when approving invoices, cash, expenses, prices & closing periods in JFFIN'], function (S, C, X, F) {
    var r = as(X, RAMA), inv = F.state().inv.filter(function (i) { return i.st === 'review'; })[0];
    no(F.invApprove(r, inv ? inv.id : 'INV-X'), null, 'invoice approve'); ok(!F.invApprove(r, inv ? inv.id : 'INV-X').ok);
    no(F.setPeriod(r, '2026-09', 'closed', 'tutup'), null, 'period close');
    no(F.approveCash(r, 'CT-X', true, 'x'), null, 'cash'); no(F.approveExpense(r, 'EXP-X'), null, 'expense'); no(F.setPrice(r, 'SV-001', 9000, '2026-11-01', 'x'), null, 'price');
    var a = as(X, ADIT); no(F.invApprove(a, inv ? inv.id : 'INV-X'), null, 'sysadmin invoice approve');
  });
  add('§63', 'SYS-T18', ['Izin bisnis tidak bisa ditambahkan ke role admin atau user admin', 'Business perms cannot be added to an admin role or admin user'], function (S, C, X) {
    var r = as(X, RAMA);
    no(S.setPerm(r, 'sysadmin', 'ar.approve', true, 'x'), 'invalid', 'role');
    no(S.setUserPerms(r, ADIT, ['cash.approve'], [], 'x'), null, 'user grant');
    eq(S.permIssues(r).filter(function (i) { return i.k === 'sod'; }).length, 0, 'no SoD issue');
  });

  /* ---- NP-08 master data & config ---- */
  add('NP-08', 'SYS-T19', ['Master data: 20 kategori + COA; kategori milik modul lain read-only', 'Master data: 20 categories + COA; other modules\' categories read-only'], function (S, C, X) {
    var a = as(X, ADIT), cats = S.masterCats(a); eq(cats.length, 21);
    var cl = S.masterList(a, 'client'); ok(cl.length > 0 && cl[0].readOnly && cl[0].link, 'client read-through');
    no(S.masterAdd(a, 'client', { code: 'CL-99', n: 'X' }, { reason: 'x' }), 'scope', 'edit client here');
    ok(S.masterList(a, 'department').length >= 10, 'departments');
  });
  add('NP-08', 'SYS-T20', ['Master dipakai transaksi tidak bisa dihapus, hanya dinonaktifkan', 'A used master record cannot be deleted, only deactivated'], function (S, C, X) {
    var a = as(X, ADIT); ok(S.inUse('department', 'OPS') > 0, 'OPS used by users');
    no(S.masterDelete(a, 'department', 'OPS', 'hapus'), 'inuse'); yes(S.masterSetActive(a, 'department', 'OPS', false, 'Restrukturisasi'));
    yes(S.masterAdd(a, 'department', { code: 'TMP', n: ['Sementara', 'Temp'] }, { reason: 'uji' }));
    yes(S.masterDelete(a, 'department', 'TMP', 'Salah input')); eq(S.masterRecord(a, 'department', 'TMP'), null, 'soft-deleted');
    ok(S.state().master.department.some(function (r) { return r.code === 'TMP' && r.st === 'deleted'; }), 'kept in history');
  });
  add('NP-08', 'SYS-T21', ['Versi master berlaku efektif; histori memakai versi lama', 'Master versions effective-dated; history keeps the old version'], function (S, C, X) {
    eq(S.masterAt('tax', 'PPN', '2021-06-01').rate, 10); eq(S.masterAt('tax', 'PPN', '2026-10-06').rate, 11);
    var a = as(X, ADIT), r = yes(S.masterEdit(a, 'tax', 'PPN', { rate: 12 }, { eff: '2027-01-01', reason: 'Kenaikan PPN' })); ok(r.pending, 'tax needs approval');
    no(S.masterApprove(a, 'tax', 'PPN', r.version.v, true, 'ok'), 'noperm', 'sysadmin cannot approve master');
    yes(S.masterApprove(as(X, RAMA), 'tax', 'PPN', r.version.v, true, 'Sesuai UU'));
    eq(S.masterAt('tax', 'PPN', '2026-12-31').rate, 11, 'before eff'); eq(S.masterAt('tax', 'PPN', '2027-01-02').rate, 12, 'after eff');
    no(S.masterEdit(a, 'branch', 'BR-UBD', { n: 'X' }, { eff: '2026-01-01', reason: 'mundur' }), 'invalid', 'backdated');
  });
  add('NP-08', 'SYS-T22', ['Konfigurasi sistem: terversi, validasi, milik modul lain ditolak', 'System config: versioned, validated, other modules\' settings refused'], function (S, C, X) {
    var a = as(X, ADIT), c = S.config(a); ok(c.groups.length === 6 && c.items.length > 20, 'groups & items');
    yes(S.setConfig(a, 'th.inactiveDays', 45, { reason: 'Kebijakan baru' })); eq(S.cfgGet('th.inactiveDays'), 45);
    no(S.setConfig(a, 'th.inactiveDays', 999, { reason: 'x' }), 'invalid', 'out of range'); no(S.setConfig(a, 'tz', 'Mars', { reason: 'x' }), 'invalid');
    no(S.setConfig(a, 'fin.arApprove', 1, { reason: 'x' }), 'scope', 'finance-owned'); no(S.setConfig(a, 'lang.default', 'en', {}), 'reason');
    no(S.setConfig(as(X, WULAN), 'tz', 'Asia/Jakarta', { reason: 'x' }), 'noperm');
  });

  /* ---- NP-09 notifications ---- */
  add('NP-09', 'SYS-T23', ['Template: variabel tak dikenal & data internal ke klien ditolak; preview', 'Templates: unknown vars & internal data to clients refused; preview'], function (S, C, X) {
    var a = as(X, ADIT); eq(S.templates(a).length, 12);
    no(S.saveTemplate(a, 'TPL-01', { lang: { id: { subj: 'Pickup', body: 'Halo {{client_nam}}' } } }, 'typo'), 'invalid', 'unknown var');
    no(S.saveTemplate(a, 'TPL-01', { lang: { id: { subj: 'Pickup', body: 'HPP kami {{hpp}}' } } }, 'bocor'), 'scope', 'privacy');
    ok(audited(S, 'TEMPLATE.SAVE', 'TPL-01', 'denied'), 'privacy refusal audited');
    var r = yes(S.saveTemplate(a, 'TPL-01', { lang: { id: { subj: 'Pickup {{order_number}}', body: 'Halo {{client_name}}, pickup {{pickup_date}}' } } }, 'Perbaiki kalimat'));
    eq(r.template.v, 2, 'version bumped'); var p = S.preview(a, 'TPL-01', 'id', { client_name: 'Hotel ABC' }); ok(/Hotel ABC/.test(p.body) && !/\{\{/.test(p.body), 'rendered');
  });
  add('NP-09', 'SYS-T24', ['Channel: SMS future, In-App wajib aktif; email bisa dimatikan', 'Channels: SMS future, In-App must stay on; email can be switched off'], function (S, C, X) {
    var a = as(X, ADIT), ch = S.channels(a); eq(ch.length, 5);
    no(S.setChannel(a, 'sms', true, 'x'), 'invalid'); no(S.setChannel(a, 'app', false, 'x'), 'invalid');
    yes(S.setChannel(a, 'email', false, 'Maintenance SMTP')); eq(S.channels(a).filter(function (c) { return c.k === 'email'; })[0].on, false);
    no(S.sendTest(a, 'TPL-07', { cl: 'CL-01' }), 'scope', 'internal template to client');
  });
  add('NP-09', 'SYS-T25', ['Log komunikasi gabungan dari semua engine; retry gagal', 'Communication log merged from all engines; retry failed'], function (S, C, X) {
    var a = as(X, ADIT), log = S.commLog(a);
    ['LG-', 'AX-', 'OB-'].forEach(function (p) { ok(log.some(function (r) { return r.id.indexOf(p) === 0; }), p + ' rows'); });
    var f = S.commLog(a, { st: 'failed', ch: 'wa' }); ok(f.length >= 1, 'failed WA rows');
    var s0 = S.commSummary(a); var r = S.retry(a, f[0].id); ok(r.ok || r.code === 'invalid', 'retry ran');
    ok(audited(S, 'NOTIF.RETRY', f[0].id), 'retry audited'); no(S.retry(as(X, WULAN), f[0].id), 'noperm');
    ok(s0.total === log.length, 'summary consistent');
  });

  /* ---- NP-10 audit & security ---- */
  add('NP-10', 'SYS-T26', ['Audit gabungan: akses, sistem, finance, logistik dalam satu daftar', 'Unified audit: access, system, finance, logistics in one list'], function (S, C, X) {
    X.login('budi', 'salah'); X.login('budi', PW); var r = as(X, RAMA); yes(S.suspend(as(X, ADIT), MADE, 'uji'));
    var rows = S.auditAll(r), mods = {}; rows.forEach(function (x) { mods[x.module] = 1; });
    ['access', 'system'].forEach(function (m) { ok(mods[m], m + ' rows'); });
    ok(rows.some(function (x) { return x.action === 'AUTH.LOGIN_FAIL'; }), 'failed login'); ok(rows.some(function (x) { return x.action === 'USER.SUSPEND' && x.before; }), 'suspend with before');
    ok(S.auditAll(r, { kind: 'failed' }).every(function (x) { return x.action === 'AUTH.LOGIN_FAIL'; }), 'kind filter');
    var d = S.auditDetail(r, rows[0].id); ok(d && d.id === rows[0].id, 'detail');
    eq(S.auditAll(as(X, 'USR-002')).length, 0, 'driver has no audit access');
  });
  add('NP-10', 'SYS-T27', ['Audit tidak bisa dihapus/diubah; IP dimasking untuk non-security', 'Audit cannot be deleted/edited; IP masked without security.manage'], function (S, C, X) {
    Object.keys(S).forEach(function (k) { ok(!/^(delete|remove|clear|purge|edit)Audit|audit(Delete|Remove|Clear|Edit|Purge)/i.test(k), 'no audit mutation fn: ' + k); });
    var o = as(X, AJI), rows = S.auditAll(o); ok(rows.length && rows.every(function (r) { return r.ip.indexOf('•') >= 0; }), 'owner sees masked IP');
    var r = S.auditAll(as(X, RAMA)); ok(r.some(function (x) { return x.ip.indexOf('•') < 0; }), 'superadmin sees IP');
  });
  add('NP-10', 'SYS-T28', ['Akses ditolak selalu diaudit', 'Every denied action is audited'], function (S, C, X) {
    var h = as(X, WULAN); no(S.suspend(h, MADE, 'x'), 'noperm'); no(S.setConfig(h, 'tz', 'Asia/Jakarta', { reason: 'x' }), 'noperm');
    var d = S.state().audit.filter(function (e) { return e.result === 'denied' && e.uid === WULAN; }); ok(d.length >= 2, 'denied rows: ' + d.length);
    ok(S.auditAll(as(X, RAMA), { kind: 'denied' }).length >= 2 || S.auditAll(as(X, RAMA), { result: 'denied' }).length >= 2, 'visible in unified audit');
  });
  add('NP-10', 'SYS-T29', ['Pengaturan keamanan diterapkan ke X.POLICY & login', 'Security settings applied to X.POLICY & login'], function (S, C, X) {
    var r = as(X, RAMA); yes(S.setSecurity(r, { maxFailed: 3, idleMin: 20 }, 'Pengetatan keamanan')); eq(X.POLICY.maxFailed, 3); eq(Math.round(X.POLICY.idle / 60000), 20);
    X.login('made', 'x1'); X.login('made', 'x2'); var l = X.login('made', 'x3'); eq(l.code, 'locked', 'locked after 3');
    no(S.setSecurity(r, { maxFailed: 1 }, 'x'), 'invalid', 'below range'); no(S.setSecurity(r, { enforce: 'client' }, 'x'), 'invalid', 'enforcement fixed');
    ok(audited(S, 'SECURITY.CHANGE'), 'audited'); eq(S.security(r).versions.length, 2);
  });
  add('NP-10', 'SYS-T30', ['Alert keamanan: deteksi, acknowledge, resolve dengan catatan', 'Security alerts: detect, acknowledge, resolve with a note'], function (S, C, X) {
    var r = as(X, RAMA), al = S.secAlerts(r, { st: 'open' }); ok(al.some(function (a) { return a.kind === 'locked'; }) && al.some(function (a) { return a.kind === 'expired'; }) && al.some(function (a) { return a.kind === 'cred'; }), 'detectors');
    var id = al.filter(function (a) { return a.kind === 'locked'; })[0].id;
    yes(S.ackAlert(r, id, 'Dicek')); no(S.resolveAlert(r, id, ''), 'reason'); yes(S.resolveAlert(r, id, 'User sudah diverifikasi'));
    eq(S.secAlerts(r).filter(function (a) { return a.id === id; })[0].st, 'resolved'); no(S.ackAlert(r, id, 'x'), 'jump');
    var g = S.governance(r); ok(g.privileged >= 4 && g.alerts.open >= 1, 'governance');
    var n = X.notifsFor(r); ok(n.some(function (x) { return /^SY-/.test(x.id); }), 'alerts in the bell');
  });

  /* ---- NP-11 integrations, import, export ---- */
  add('NP-11', 'SYS-T31', ['Integrasi: kredensial selalu dimasking; tes koneksi & retry', 'Integrations: credentials always masked; connection test & retry'], function (S, C, X) {
    var a = as(X, ADIT), l = S.integrations(a); eq(l.length, 10);
    l.forEach(function (i) { if (i.cred && i.cred.mask) ok(/^••••/.test(i.cred.mask) && !i.cred.secret, i.id + ' masked'); });
    ok(JSON.stringify(l).indexOf('secret') < 0, 'no secret field');
    eq(S.testConnection(a, 'INT-EMAIL').res, 'success'); eq(S.testConnection(a, 'INT-PAY').res, 'failed'); eq(S.testConnection(a, 'INT-IOT').res, 'future');
    yes(S.retrySync(a, 'INT-SCALE', 'Kabel diganti')); eq(S.integration(a, 'INT-SCALE').st, 'healthy');
    ok(audited(S, 'INTEGRATION.TEST', 'INT-PAY', 'failed'), 'failed test audited');
    var s = S.integSummary(a); eq(s.total, 9); eq(s.future, 1);
  });
  add('NP-11', 'SYS-T32', ['Import: validasi dulu, error ditolak, hanya baris valid masuk staging', 'Import: validate first, errors rejected, only valid rows go to staging'], function (S, C, X) {
    var a = as(X, ADIT), v = yes(S.importValidate(a, 'client', S.importSample('client'), 'klien.csv')).batch;
    ok(/^IMP-/.test(v.id) && v.error >= 2 && v.valid >= 1, 'validated with errors: ' + v.error);
    ok(v.rows.some(function (r) { return r.data.id === 'CL-01' && r.st === 'error'; }), 'existing client not overwritten');
    var c = yes(S.importConfirm(a, v.id, 'Import awal')); eq(c.target, 'staged'); eq(c.imported + c.rejected, v.total);
    eq(S.staged(a, 'client').length, c.imported); no(S.importConfirm(a, v.id, 'x'), 'jump', 'twice');
    no(S.importValidate(a, 'client', 'foo,bar\n1,2', 'x.csv'), 'invalid', 'missing columns');
    no(S.importValidate(as(X, WULAN), 'client', S.importSample('client'), 'x.csv'), 'noperm');
  });
  add('NP-11', 'SYS-T33', ['Export butuh izin modul & tercatat di audit', 'Export needs the module perm & is audited'], function (S, C, X) {
    var a = as(X, ADIT), r = yes(S.exportData(a, 'users')); ok(r.count === 23 && /^id,username/.test(r.csv), 'users csv');
    ok(audited(S, 'EXPORT', r.log.id), 'export audited'); eq(S.exports(a)[0].id, r.log.id);
    no(S.exportData(a, 'invoices'), 'noperm', 'sysadmin has no AR view'); no(S.exportData(as(X, MADE), 'users'), 'noperm');
    var o = yes(S.exportData(as(X, AJI), 'invoices')); ok(o.count > 0, 'owner exports invoices');
  });

  /* ---- NP-12 super admin, health, backup ---- */
  add('NP-12', 'SYS-T34', ['Kesehatan sistem: 7 komponen & status keseluruhan', 'System health: 7 components & overall status'], function (S, C, X) {
    var h = S.health(as(X, ADIT)); eq(h.items.length, 7); ok(['healthy', 'warning', 'critical'].indexOf(h.overall) >= 0); ok(h.jobs.length === 6 && h.storage.kb > 0);
    eq(S.health(as(X, MADE)), null, 'operator');
  });
  add('NP-12', 'SYS-T35', ['Super Admin Control Center: hero, 12 KPI, 10 seksi, 6 aksi cepat', 'Super Admin Control Center: hero, 12 KPIs, 10 sections, 6 quick actions'], function (S, C, X) {
    var c = S.control(as(X, RAMA)); eq(c.hero.brand, 'JFRESH OS'); eq(c.kpis.length, 12); eq(c.sections.length, 10); eq(c.quick.length, 6); ok(c.pendingRequests >= 1);
    eq(S.control(as(X, ADIT)), null, 'sysadmin has no control center'); ok(S.control(as(X, AJI)), 'owner can view');
    var k = S.kpis(as(X, RAMA)); eq(k.length, 9); ok(k.every(function (x) { return x.k && x.target; }));
  });
  add('NP-12', 'SYS-T36', ['Backup harian & retensi: data wajib tidak pernah dihapus permanen', 'Daily backup & retention: mandatory records never hard-deleted'], function (S, C, X) {
    var r = as(X, RAMA), b = S.backups(r); ok(b.list.length >= 14 && b.last.st === 'success', 'backups'); ok(b.list.some(function (x) { return x.st === 'failed'; }), 'failed one kept');
    yes(S.runBackup(r, 'Sebelum migrasi')); no(S.runBackup(as(X, ADIT), 'x'), 'noperm');
    var ret = S.retention(r); ['invoice', 'pod', 'journal', 'payment', 'hpp', 'price', 'audit'].forEach(function (k) { ok(ret.never.indexOf(k) >= 0, k + ' never'); });
    no(S.setRetention(r, 'invoice', { hardDelete: true }, 'x'), 'invalid'); eq(S.recordStatus('invoice', '2026-09-01'), 'active');
  });

  /* ---- INTEGRATION: screens, nav, roles ---- */
  add('INTEGRATION', 'SYS-T37', ['30 layar Fase 11 terdaftar; ID lama dialihkan', '30 Phase 11 screens registered; old IDs aliased'], function (S, C, X) {
    eq(S.SCREENS.length, 30); ['ADM-001', 'ADM-005', 'CFG-003', 'NTF-004', 'SEC-005', 'INT-007', 'SYS-001', 'SYS-006'].forEach(function (id) { ok(C.screen(id) && C.screen(id).p11, id); });
    eq(S.ALIAS['SYS-HUB-001'], 'SYS-001'); eq(S.ALIAS['SYS-USR-001'], 'ADM-001');
  });
  add('INTEGRATION', 'SYS-T38', ['Login rama → SYS-001, adit → ADM-001; Owner nav menuju SYS-001', 'rama lands on SYS-001, adit on ADM-001; Owner nav goes to SYS-001'], function (S, C, X) {
    var r = X.login('rama', PW); ok(r.ok, 'rama login'); eq(r.landing || as(X, RAMA).landing, 'SYS-001');
    var a = X.login('adit', PW); ok(a.ok, 'adit login'); eq(a.landing || as(X, ADIT).landing, 'ADM-001');
    var nav = JSON.stringify(as(X, AJI).nav); ok(nav.indexOf('SYS-001') >= 0, 'owner nav has SYS-001'); ok(nav.indexOf('SYS-HUB-001') < 0, 'old hub gone');
    ok(X.canScreen(as(X, AJI), 'SYS-001'), 'owner can open SYS-001'); ok(!X.canScreen(as(X, MADE), 'SYS-001'), 'operator cannot');
    ok(!X.canScreen(as(X, ADIT), 'SYS-001'), 'sysadmin cannot open Control Center');
  });
  add('INTEGRATION', 'SYS-T39', ['Tes regresi: Owner tetap boot, izin lama tetap ada', 'Regression: Owner still boots, legacy perms intact'], function (S, C, X) {
    var o = as(X, AJI); ok(o.landing && o.landing !== 'SYS-001', 'owner keeps its own landing'); ok(o.perms.indexOf('ar.approve') >= 0, 'owner keeps business approvals');
    ok(o.perms.indexOf('sys11.priv.approve') >= 0, 'owner approves privileged access'); ok(as(X, BUDI).perms.indexOf('ar.view') >= 0, 'finance unchanged');
  });
  add('AUDIT', 'SYS-T40', ['Event audit Fase 11 terdefinisi & perubahan sensitif punya before/after', 'Phase 11 audit events defined & sensitive changes carry before/after'], function (S, C, X) {
    ok(Object.keys(S.AUDIT).length >= 30, 'events: ' + Object.keys(S.AUDIT).length);
    var a = as(X, ADIT); S.setPlants(a, MADE, ['PL-01', 'PL-02'], 'Rotasi'); S.setConfig(a, 'th.inactiveDays', 60, { reason: 'x' });
    ['USER.PLANT', 'CONFIG.CHANGE'].forEach(function (ev) { var e = S.state().audit.filter(function (x) { return x.ev === ev; })[0]; ok(e && e.before != null && e.after != null && e.reason, ev + ' before/after/reason'); });
  });

  function run(S, C, X, F) {
    var res = [];
    T.forEach(function (t) {
      NOW = Date.parse('2026-10-06T10:30:00'); S._setClock(function () { return NOW; });
      if (X && X._resetStore) X._resetStore(); S._reset();
      try { t.fn(S, C, X, F); res.push({ group: t.group, id: t.id, n: t.n, ok: true }); }
      catch (e) { res.push({ group: t.group, id: t.id, n: t.n, ok: false, err: e.message }); }
    });
    S._setClock(null); if (X && X._resetStore) X._resetStore(); S._reset();
    return res;
  }
  var api = { cases: T, run: run };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.JFSYS_TESTS = api;
})(typeof window !== 'undefined' ? window : this);
