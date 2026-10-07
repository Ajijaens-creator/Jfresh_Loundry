/* ==========================================================================
   JFRESH OS — Phase 12 Engine A automated test cases (JFIMP: build,
   environments, releases, One Data, QA, security validation, reliability).
   Each case resets the access, SYS and IMP stores, fixes the clock at
   2026-10-06 10:30 and runs against the real engine installed on top of the
   Phase 4–11 engines, the same way the app loads them.
   Run in node:    node tools/test-imp.js
   ========================================================================== */
(function (root) {
  var T = [];
  function add(group, id, name, fn) { T.push({ group: group, id: id, n: name, fn: fn }); }
  function eq(a, b, what) { if (a !== b) throw new Error((what || 'value') + ': expected ' + JSON.stringify(b) + ', got ' + JSON.stringify(a)); }
  function ok(v, what) { if (!v) throw new Error(what || 'expected true'); }
  function no(r, code, what) { ok(r && r.ok === false, (what || 'action') + ' should be refused'); if (code) eq(r.code, code, (what || 'action') + ' code'); }
  function yes(r, what) { if (!r || r.ok !== true) throw new Error((what || 'action') + ' should pass: ' + (r ? (r.code + ' ' + JSON.stringify(r.msg) + (r.failed ? ' failed=' + r.failed.join(',') : '')) : 'no result')); return r; }
  function as(E, u) { var usr = E.X.USERS.filter(function (x) { return x.u === u; })[0]; if (!usr) throw new Error('no user ' + u); var c = E.X.resolve(usr.id); if (!c || !c.ok) throw new Error('resolve ' + u + ' failed: ' + (c && c.code)); return c; }
  function audited(I, ev, rec, result) { return I.state().audit.some(function (e) { return e.ev === ev && (!rec || e.rec === rec) && (!result || e.result === result); }); }
  function H(o) { return JSON.stringify(o); }
  var GO_OK = { uatGate: function () { return { ok: true, v: 'UAT 100%' }; }, migrationGate: function () { return { ok: true, v: '18/18' }; } };

  /* ---- Roles, users, screens, install ---- */
  add('ROLES', 'IMP-T01', ['4 peran proyek + user demo (bayu, intan, dodi, ratih)', '4 project roles + demo users (bayu, intan, dodi, ratih)'], function (E) {
    var C = E.C, X = E.X, map = { implead: 'bayu', qalead: 'intan', datalead: 'dodi', trainer: 'ratih' };
    Object.keys(map).forEach(function (r) {
      ok(C.ROLES[r] && X.ROLES[r], r + ' registered'); eq(X.ROLES[r].group, 'management', r + ' group');
      ok(C.ROLE_ORDER.indexOf(r) >= 0 && C.ROLE_ORDER.indexOf(r) < C.ROLE_ORDER.indexOf('owner'), r + ' before owner');
      ok(X.DEMO.some(function (d) { return d.u === map[r]; }), map[r] + ' in demo list');
      var c = as(E, map[r]); eq(c.roleKey, r); ok(c.employee && /^EMP-13/.test(c.employee.id), 'own employee record');
    });
    eq(X.login('bayu', X.DEMO_PASSWORD).ok, true, 'bayu signs in with the demo password');
  });
  add('ROLES', 'IMP-T02', ['Landing & menu peran baru selalu bisa dibuka', 'New roles land on a screen they can open'], function (E) {
    var X = E.X, b = as(E, 'bayu'), i = as(E, 'intan'), d = as(E, 'dodi'), r = as(E, 'ratih');
    eq(b.landing, 'BUILD-001'); eq(i.landing, 'QA-001');
    [b, i, d, r].forEach(function (c) { ok(c.landing && X.canScreen(c, c.landing), c.roleKey + ' landing opens: ' + c.landing); ok(c.nav.length > 0, c.roleKey + ' has a nav'); ok(c.mnav.length <= 5, 'mobile nav max 5'); });
    if (!E.C.screen('MIG-001')) eq(d.landing, 'DATA-001', 'datalead falls back to DATA-001 while MIG-001 is absent');
    var groups = E.C.ROLES.implead.nav.map(function (n) { return n.k; }); ['g-mig12', 'g-uat12', 'g-help12', 'g-go12'].forEach(function (g) { ok(groups.indexOf(g) >= 0, 'append group ' + g); });
  });
  add('ROLES', 'IMP-T03', ['Owner: grup Go-Live (BUILD-001, LIVE-004, LIVE-001) & semua layar Fase 12', 'Owner: Go-Live group (BUILD-001, LIVE-004, LIVE-001) & every Phase 12 screen'], function (E, I) {
    var g = E.C.ROLES.owner.nav.filter(function (n) { return n.k === 'g-live12'; })[0]; ok(g, 'g-live12 group');
    ['BUILD-001', 'LIVE-004', 'LIVE-001'].forEach(function (s) { ok(g.sub.some(function (n) { return n.s === s; }), s + ' in the group'); });
    var aji = as(E, 'aji'); I.SCREENS.forEach(function (s) { ok(E.X.canScreen(aji, s.id), 'owner opens ' + s.id); });
    ok(aji.nav.some(function (n) { return n.k === 'g-live12'; }), 'visible in the resolved nav');
  });
  add('ROLES', 'IMP-T04', ['Peran lain tidak melihat Fase 12 (engine mengembalikan kosong)', 'Other roles do not see Phase 12 (engine returns empty)'], function (E, I) {
    ['made', 'ketut', 'budi', 'putu', 'sari.grandvista'].forEach(function (u) {
      var c = as(E, u); ok(!E.X.canScreen(c, 'BUILD-001') && !E.X.canScreen(c, 'QA-001') && !E.X.canScreen(c, 'SVL-001'), u + ' cannot open Phase 12 screens');
      eq(I.environments(c).length, 0); eq(I.testCases(c).length, 0); eq(I.duplicates(c).length, 0); eq(I.center(c), null); eq(I.secReport(c), null);
    });
  });
  add('ROLES', 'IMP-T05', ['24 layar terdaftar; SVL/RLB tidak bentrok dengan SEC/REL lama', '24 screens registered; SVL/RLB do not collide with old SEC/REL'], function (E, I) {
    eq(I.SCREENS.length, 24); I.SCREENS.forEach(function (s) { var sp = E.C.screen(s.id); ok(sp && sp.pN === 12 && sp.dom === 'imp12' && sp.p12, s.id + ' registered'); ok(E.C.PERMS[sp.p], s.id + ' perm defined'); });
    eq(E.C.screen('SEC-001').dom, 'sys11', 'SEC-001 stays Phase 11'); ok(!E.C.screen('SEC-001').p12 && !(E.C.screen('REL-001') || {}).p12, 'REL-001 untouched');
    ['SVL-001', 'SVL-004', 'RLB-001', 'RLB-005', 'IMP-003', 'DATA-003', 'BUILD-004', 'QA-005'].forEach(function (id) { ok(I.screen(id), id); });
  });
  add('ROLES', 'IMP-T06', ['15 event audit §111 terdefinisi; audit JFIMP masuk ke audit terpadu JFSYS', '15 §111 audit events defined; JFIMP audit joins the JFSYS unified trail'], function (E, I) {
    eq(I.AUDIT_111.length, 15); I.AUDIT_111.forEach(function (ev) { ok(I.AUDIT[ev], ev + ' label'); });
    yes(I.runRestoreTest(as(E, 'adit'), 'uji'));
    var rows = E.S.auditAll(as(E, 'rama'), { module: 'implementation' }); ok(rows.some(function (r) { return r.action === 'RESTORE_EXECUTED'; }), 'RESTORE_EXECUTED in JFSYS.auditAll');
    var e = I.state().audit[0]; ['id', 'at', 'ev', 'uid', 'emp', 'role', 'module', 'rec', 'before', 'after', 'reason', 'result', 'device'].forEach(function (k) { ok(k in e, 'audit field ' + k); });
  });
  add('ROLES', 'IMP-T07', ['Super Admin / System Admin tanpa persetujuan bisnis Fase 12', 'Super Admin / System Admin hold no Phase 12 business approval'], function (E, I) {
    ['rama', 'adit'].forEach(function (u) { var c = as(E, u); ok(!c.perms.filter(function (p) { return /^imp\./.test(p); }).some(E.S.isBusinessApproval), u + ' no business approval'); ok(!E.X.can(c, 'imp.release.approve.prod') && !E.X.can(c, 'imp.release.approve'), u + ' cannot approve releases'); });
    E.S._reset(); ok(E.X.can(as(E, 'aji'), 'imp.release.approve.prod'), 'owner perms survive JFSYS._reset');
  });

  /* ---- NP-01 environments & releases ---- */
  add('NP-01', 'IMP-T08', ['4 environment dengan database, kredensial, integrasi, storage, log, konfigurasi terpisah (disamarkan)', '4 environments with separate (masked) database, credentials, integrations, storage, logs, config'], function (E, I) {
    var e = I.environments(as(E, 'bayu')); eq(e.map(function (x) { return x.k; }).join(), 'DEV,QA,UAT,PRD');
    ['db', 'cred', 'storage', 'log', 'config', 'url'].forEach(function (k) { var v = e.map(function (x) { return x[k]; }); eq(v.filter(function (x, i) { return v.indexOf(x) === i; }).length, 4, k + ' separate'); });
    e.forEach(function (x) { ok(x.db.indexOf('•') >= 0 && x.cred.indexOf('•') >= 0, x.k + ' masked'); });
    eq(e[3].version, null, 'production not live yet'); eq(e[3].health, 'standby');
  });
  add('NP-01', 'IMP-T09', ['Dashboard environment §8; UAT = instans ini (kesehatan dari JFSYS)', 'Environment dashboard §8; UAT = this instance (health from JFSYS)'], function (E, I) {
    var d = I.envDashboard(as(E, 'bayu')); ['build', 'dev', 'qa', 'uat', 'prd', 'pending', 'blockers'].forEach(function (k) { ok(d[k] !== undefined, k); });
    var h = E.S.health(as(E, 'rama')).overall; eq(d.uat.health, h === 'healthy' ? 'live' : h, 'UAT health is JFSYS.health');
    eq(d.blockers, I.blockers(as(E, 'bayu'), { st: 'open' }).length);
  });
  add('NP-01', 'IMP-T10', ['Rilis semver v0.9.0 … v1.0.0-rc.1, v1.0.0 = rilis awal produksi, rollback plan', 'Semver releases v0.9.0 … v1.0.0-rc.1, v1.0.0 = initial production, rollback plan'], function (E, I) {
    var r = I.releases(as(E, 'bayu')); ok(r.length >= 5); r.forEach(function (x) { ok(/^v\d+\.\d+\.\d+(-rc\.\d+)?$/.test(x.v), x.v + ' semver'); ok(x.notes && x.changes && x.db && x.rollback, x.v + ' notes/changes/db/rollback'); });
    var v1 = r.filter(function (x) { return x.v === 'v1.0.0'; })[0]; ok(v1 && v1.initial && v1.st === 'planned', 'v1.0.0 planned initial production');
    ok(r.some(function (x) { return x.v === 'v1.0.0-rc.1'; }) && r.some(function (x) { return x.v === 'v0.9.0'; }));
  });
  add('NP-01', 'IMP-T11', ['Promosi: izin, urutan pipeline, gerbang (bug kritis terbuka)', 'Promotion: permission, pipeline order, gate (open critical bug)'], function (E, I) {
    no(I.requestPromotion(as(E, 'made'), 'RLS-005', 'UAT', 'x'), 'noperm', 'operator');
    no(I.requestPromotion(as(E, 'bayu'), 'RLS-005', 'PRD', 'lompat'), 'jump', 'skip UAT');
    no(I.requestPromotion(as(E, 'bayu'), 'RLS-005', 'UAT', ''), 'reason');
    var r = I.requestPromotion(as(E, 'bayu'), 'RLS-005', 'UAT', 'UAT key user'); no(r, 'gate'); ok(r.failed.indexOf('qa') >= 0, 'qa gate failed (BUG-007 critical)');
  });
  function closeBug007(E, I) {
    var q = as(E, 'intan');
    yes(I.result(q, 'TC-029', { status: 'pass', evidence: ['rcn-ar.png'] }));
    yes(I.setBugStatus(q, 'BUG-007', 'fixing', 'Selisih ditemukan')); yes(I.setBugStatus(q, 'BUG-007', 'fixed', 'Mapping saldo diperbaiki')); yes(I.setBugStatus(q, 'BUG-007', 'retest', 'Retest')); yes(I.setBugStatus(q, 'BUG-007', 'closed', 'Retest lulus'));
  }
  add('NP-01', 'IMP-T12', ['QA → UAT: ajukan, maker-checker, setujui, deploy, smoke test', 'QA → UAT: request, maker-checker, approve, deploy, smoke test'], function (E, I) {
    closeBug007(E, I);
    var bayu = as(E, 'bayu'), intan = as(E, 'intan'), adit = as(E, 'adit');
    var rq = yes(I.requestPromotion(intan, 'RLS-005', 'UAT', 'Siap UAT')); no(I.promote(intan, 'RLS-005', 'UAT', 'ok'), 'maker', 'requester approves');
    no(I.approvePromotion(intan, rq.promotion.id, 'ok'), 'maker');
    I.rejectPromotion(as(E, 'aji'), rq.promotion.id, 'Ulang oleh Implementation Lead');
    var p = yes(I.requestPromotion(bayu, 'RLS-005', 'UAT', 'Siap UAT')).promotion;
    no(I.deploy(adit, p.id, 'deploy'), 'jump', 'deploy before approval');
    yes(I.approvePromotion(intan, p.id, 'QA lulus')); ok(audited(I, 'BUILD_PROMOTED', p.id, 'ok'), 'BUILD_PROMOTED');
    no(I.deploy(intan, p.id, 'x'), 'noperm', 'QA lead cannot deploy');
    yes(I.deploy(adit, p.id, 'Deploy malam')); ok(audited(I, 'DEPLOYMENT', p.id) && audited(I, 'RELEASE_DEPLOYED', 'RLS-005'), 'DEPLOYMENT + RELEASE_DEPLOYED');
    yes(I.validate(intan, p.id, { result: 'pass' }));
    eq(I.environment(bayu, 'ENV-UAT').version, 'v1.0.0-rc.1'); eq(I.release(bayu, 'RLS-004').envs.UAT, 'superseded'); eq(I.release(bayu, 'RLS-005').envs.UAT, 'live');
  });
  add('NP-01', 'IMP-T13', ['Smoke test gagal → rollback ke versi sebelumnya', 'Failed smoke test → rollback to the previous version'], function (E, I) {
    closeBug007(E, I);
    var p = yes(I.requestPromotion(as(E, 'bayu'), 'RLS-005', 'UAT', 'UAT')).promotion; yes(I.approvePromotion(as(E, 'intan'), p.id, 'ok')); yes(I.deploy(as(E, 'rama'), p.id, 'deploy'));
    no(I.validate(as(E, 'intan'), p.id, { result: 'fail' }), 'reason');
    yes(I.validate(as(E, 'intan'), p.id, { result: 'fail', notes: 'Login error 500' }));
    eq(I.environment(as(E, 'bayu'), 'ENV-UAT').version, 'v0.10.0', 'rolled back'); ok(audited(I, 'DEPLOY.ROLLBACK', p.id), 'rollback audited');
    eq(I.promotion(as(E, 'bayu'), p.id).st, 'failed');
  });
  add('NP-01', 'IMP-T14', ['Gerbang produksi §11 menolak dengan daftar gerbang gagal', 'Production gate §11 refuses with the list of failed gates'], function (E, I) {
    I.link('GO', {});
    var g = I.gates(as(E, 'aji'), 'RLS-006', 'PRD'); eq(g.list.length, 8); ok(!g.ok);
    ['build', 'qa', 'uat', 'migration', 'approver'].forEach(function (k) { ok(g.failed.indexOf(k) >= 0, k + ' failed'); });
    ok(g.failed.indexOf('backup') < 0, 'backup ready today (JFSYS)'); ok(g.failed.indexOf('rollback') < 0, 'rollback available');
    var r = I.requestPromotion(as(E, 'bayu'), 'RLS-006', 'PRD', 'go'); no(r); ok(r.code === 'jump' || r.code === 'gate', 'not reachable without build/UAT');
    var rc = I.gates(as(E, 'aji'), 'RLS-005', 'PRD'); ok(rc.failed.indexOf('stable') >= 0, 'a release candidate is never production');
  });
  add('NP-01', 'IMP-T15', ['Produksi end-to-end: hanya Owner menyetujui, desktop saja, gerbang JFGO', 'Production end to end: only the Owner approves, desktop only, JFGO gates'], function (E, I) {
    var bayu = as(E, 'bayu'), intan = as(E, 'intan'), adit = as(E, 'adit'), aji = as(E, 'aji'), rama = as(E, 'rama');
    yes(I.recordBuild(bayu, 'RLS-006', { no: 'b701' }, 'Build final'));
    I.testCases(intan).forEach(function (t) { yes(I.result(intan, t.id, { status: 'pass', build: 'v1.0.0' })); });
    function step(env) { var p = yes(I.requestPromotion(bayu, 'RLS-006', env, 'next')).promotion; yes(I.promote(env === 'PRD' ? aji : intan, 'RLS-006', env, 'ok')); yes(I.deploy(adit, p.id, 'deploy')); yes(I.validate(intan, p.id, { result: 'pass' })); }
    step('QA'); step('UAT');
    I.link('GO', {});
    var p = yes(I.requestPromotion(bayu, 'RLS-006', 'PRD', 'Go-live')).promotion;
    no(I.promote(intan, 'RLS-006', 'PRD', 'ok'), 'noperm', 'QA lead'); no(I.promote(rama, 'RLS-006', 'PRD', 'ok'), 'noperm', 'super admin');
    var g = I.promote(aji, 'RLS-006', 'PRD', 'ok'); no(g, 'gate'); eq(g.failed.sort().join(), 'migration,uat', 'only the JFGO gates fail');
    I.link('GO', GO_OK);
    yes(I.promote(aji, 'RLS-006', 'PRD', 'Disetujui Product Owner'));
    no(I.deploy(adit, p.id, 'deploy', { device: 'mobile' }), 'device', 'mobile deploy');
    yes(I.deploy(adit, p.id, 'Deploy produksi')); yes(I.validate(adit, p.id, { result: 'pass' }));
    eq(I.environment(bayu, 'ENV-PRD').version, 'v1.0.0'); eq(I.currentVersion().version, 'v1.0.0');
  });
  add('NP-01', 'IMP-T16', ['Tolak promosi butuh alasan; environment diubah dengan alasan', 'Rejecting a promotion needs a reason; environment changes need a reason'], function (E, I) {
    closeBug007(E, I);
    var p = yes(I.requestPromotion(as(E, 'bayu'), 'RLS-005', 'UAT', 'x')).promotion;
    no(I.rejectPromotion(as(E, 'intan'), p.id, ''), 'reason'); yes(I.rejectPromotion(as(E, 'intan'), p.id, 'Tunggu BUG-003'));
    no(I.setEnv(as(E, 'intan'), 'ENV-QA', { health: 'healthy' }, 'x'), 'noperm'); no(I.setEnv(as(E, 'adit'), 'ENV-QA', { health: 'healthy' }, ''), 'reason');
    yes(I.setEnv(as(E, 'adit'), 'ENV-QA', { health: 'healthy' }, 'Retest selesai')); ok(audited(I, 'ENV.CHANGE', 'ENV-QA'));
  });

  /* ---- NP-03 waves, integration map, blockers, data reuse ---- */
  add('NP-03', 'IMP-T17', ['8 wave modul; build % dari registry layar nyata', '8 module waves; build % from the real screen registry'], function (E, I) {
    var m = I.modules(as(E, 'bayu')); eq(m.length, 8);
    eq(m[1].screens.specs, E.C.SCREENS_P6.length, 'Wave 2 = Phase 6 registry'); eq(m[5].screens.specs, E.C.SCREENS_P10.length, 'Wave 6 = Phase 10 registry'); eq(m[7].screens.specs, E.C.SCREENS_P11C.length + E.C.SCREENS_P11SYS.length, 'Wave 8 = Phase 11');
    eq(m[6].phases.join(), '5', 'Wave 7 Intelligence = Phase 5');
    m.forEach(function (w) { ok(w.build >= 0 && w.build <= 100 && w.owner && w.release, w.k); ok(w.qa == null || (w.qa >= 0 && w.qa <= 100), w.k + ' qa'); });
  });
  add('NP-03', 'IMP-T18', ['Peta integrasi dari data nyata; blocker menandai issue', 'Integration map from real data; blockers mark issues'], function (E, I) {
    var b = as(E, 'bayu'), m = I.integrationMap(b); eq(m.links.length, 7); eq(m.links[0].from + '>' + m.links[0].to, 'client>order');
    eq(m.links[0].total, E.LG.state().orders.length, 'every order checked'); eq(m.links[0].st, 'connected');
    var db = m.links.filter(function (l) { return l.from === 'delivery'; })[0]; eq(db.st, 'issue'); ok(db.blockers.indexOf('BLK-002') >= 0);
    yes(I.updateBlocker(b, 'BLK-002', { st: 'resolved' }, 'BR parsial terkirim')); eq(I.integrationMap(b).links.filter(function (l) { return l.from === 'delivery'; })[0].st, 'connected');
  });
  add('NP-03', 'IMP-T19', ['Blocker: buat, ubah dengan alasan, izin', 'Blockers: create, change with a reason, permission'], function (E, I) {
    var b = as(E, 'bayu'); no(I.addBlocker(as(E, 'ratih'), { t: 'Contoh blocker', sev: 'low', wave: 'W1', due: '2026-10-10' }), 'noperm');
    no(I.addBlocker(b, { t: 'x', sev: 'bad', wave: 'W1', due: '2026-10-10' }), 'invalid');
    var r = yes(I.addBlocker(b, { t: 'Printer label Plant 2 belum terpasang', sev: 'high', wave: 'W4', due: '2026-10-12', bug: 'BUG-004' })); ok(/^BLK-\d{3}$/.test(r.blocker.id));
    no(I.updateBlocker(b, r.blocker.id, { st: 'progress' }, ''), 'reason'); yes(I.updateBlocker(b, r.blocker.id, { st: 'progress' }, 'Teknisi dijadwalkan'));
    eq(I.blocker(b, r.blocker.id).log.length, 1); ok(audited(I, 'BLOCKER.CREATE', r.blocker.id) && audited(I, 'BLOCKER.CHANGE', r.blocker.id));
  });
  add('NP-03', 'IMP-T20', ['§19 berat receiving nyata dipakai produksi, kapasitas, HPP, billing, KPI tanpa input ulang', '§19 real receiving weight reused by production, capacity, HPP, billing, KPI without re-entry'], function (E, I) {
    var t = I.dataReuse(as(E, 'bayu')), r = E.PR.rcv(t.rcv); ok(r && r.weigh, 'real receiving'); eq(t.net, r.weigh.net, 'weight read from JFPROD');
    ok(t.found >= 5, 'consumers found: ' + t.found); eq(t.reentry, 0);
    var b = t.steps.filter(function (s) { return s.k === 'production'; })[0]; ok(E.PR.batch(b.id.split(', ')[0]).rcvs.indexOf(t.rcv) >= 0, 'batch built from that receiving');
  });

  /* ---- NP-02 One Data ---- */
  add('NP-02', 'IMP-T21', ['14 domain data: jumlah record live dari engine pemilik', '14 data domains: live record counts from the owner engines'], function (E, I) {
    var d = I.domains(as(E, 'dodi')), g = function (k) { return d.filter(function (x) { return x.k === k; })[0]; }; eq(d.length, 14);
    eq(g('client').count, E.CM.state().clients.length); eq(g('order').count, E.LG.state().orders.length); eq(g('user').count, E.X.USERS.length); eq(g('payment').count, E.F.state().pays.length); eq(g('supplier').count, E.F.state().sups.length);
    d.forEach(function (x) { ok(x.owner && x.src && x.key && x.consumers.length && x.ownerRoles.length, x.k + ' ownership'); });
  });
  add('NP-02', 'IMP-T22', ['Deteksi duplikat atas data nyata + baris staging migrasi', 'Duplicate detection over real data + migration staging rows'], function (E, I) {
    var dd = as(E, 'dodi'); eq(I.duplicates(dd, { src: 'live' }).length, 0, 'real masters are clean');
    var c7 = E.CM.client('CL-07');
    I.link('GO', { stagingRows: function (dom) { return dom === 'client' ? [{ id: 'MIG-CL-0007', n: 'PT Jaens Spa Group', tax: c7.tax.replace(/\./g, ''), addr: c7.addr }] : dom === 'item' ? [{ id: 'MIG-IT-01', n: 'BATH TOWEL', code: 'IT-BTW-01' }] : []; } });
    var l = I.duplicates(dd); ok(l.length >= 2, 'staging candidates');
    var c = l.filter(function (x) { return x.b.id === 'CL-07' || x.a.id === 'CL-07'; })[0]; ok(c && c.score >= 50 && c.matched.indexOf('tax') >= 0 && c.matched.indexOf('name') >= 0, 'name + tax matched'); eq(c.src, 'migration');
    ok(l.some(function (x) { return x.matched.indexOf('code') >= 0; }), 'item code matched'); eq(I.normName('PT. Jaens  Spa Group'), 'jaens spa group');
  });
  add('NP-02', 'IMP-T23', ['Review duplikat: tidak ada merge otomatis; merge butuh pemilik domain (≠ peminta)', 'Duplicate review: no automatic merge; merge needs the domain owner (≠ requester)'], function (E, I) {
    I.link('GO', { stagingRows: function (dom) { return dom === 'client' ? [{ id: 'MIG-CL-0001', n: 'Grand Vista Hotel', tax: E.CM.client('CL-01').tax }] : []; } });
    var dd = as(E, 'dodi'), c = I.duplicates(dd)[0], before = H(E.CM.state().clients);
    no(I.reviewDuplicate(as(E, 'bayu'), c.id, 'merge_requested', 'x'), 'noperm'); no(I.reviewDuplicate(dd, c.id, 'merge', 'x'), 'invalid'); no(I.reviewDuplicate(dd, c.id, 'merge_requested', ''), 'reason');
    var r = yes(I.reviewDuplicate(dd, c.id, 'merge_requested', 'Klien lama = CL-01')); eq(r.mutated, false); eq(r.candidate.st, 'merge_requested');
    no(I.approveMerge(as(E, 'ketut'), c.id, 'x'), 'noperm', 'driver'); no(I.approveMerge(as(E, 'rai'), c.id, 'x'), 'noperm', 'supply is not the client owner');
    var a = yes(I.approveMerge(as(E, 'ayu'), c.id, 'Disetujui Komersial')); eq(a.candidate.st, 'merge_approved'); eq(H(E.CM.state().clients), before, 'JFCOMM untouched');
    ok(audited(I, 'DUP.REVIEW', c.id) && audited(I, 'DUP.MERGE_APPROVED', c.id));
  });
  add('NP-02', 'IMP-T24', ['Cek orphan data nyata = 0 (tidak dipalsukan); orphan staging terpisah', 'Real-data orphan check = 0 (never faked); staging orphans separate'], function (E, I) {
    var o = I.orphans(as(E, 'dodi')); ok(o.checks.length >= 10); eq(o.total, 0); ok(o.clean && o.note);
    ['order_client', 'property_client', 'invoice_source', 'payment_invoice', 'batch_receiving', 'move_item', 'user_owner'].forEach(function (k) { ok(o.checks.some(function (c) { return c.k === k; }), k); });
    I.link('GO', { stagingOrphans: function () { return [{ id: 'MIG-PR-0099' }]; } }); var o2 = I.orphans(as(E, 'dodi')); eq(o2.staging, 1); eq(o2.total, 0, 'staging not mixed into live');
    var h = I.dataHealth(as(E, 'dodi')); ok(h.score >= 0 && h.score <= 100 && h.domains === 14 && h.records > 0);
  });

  /* ---- NP-04 QA ---- */
  add('NP-04', 'IMP-T25', ['~40 test case dengan field §21 & 4 status', '~40 test cases with §21 fields & 4 statuses'], function (E, I) {
    var t = I.testCases(as(E, 'intan')); ok(t.length >= 40);
    t.forEach(function (x) { ['id', 'module', 'scen', 'build', 'pre', 'steps', 'exp', 'act', 'tester', 'evidence', 'sev', 'st', 'retest'].forEach(function (k) { ok(k in x, x.id + ' ' + k); }); ok(['pass', 'fail', 'blocked', 'retest'].indexOf(x.st) >= 0, x.id + ' status'); });
    var q = I.qaSummary(as(E, 'intan')); eq(q.total, t.length); eq(q.pass + q.fail + q.blocked + q.retest, q.total); ok(q.passRate > 0 && q.passRate < 100);
  });
  add('NP-04', 'IMP-T26', ['Hasil test: gagal butuh actual, retest dihitung, izin QA', 'Test results: fail needs actual, retest counted, QA permission'], function (E, I) {
    var q = as(E, 'intan'); no(I.result(as(E, 'bayu'), 'TC-001', { status: 'pass' }), 'noperm');
    no(I.result(q, 'TC-001', { status: 'fail' }), 'reason'); no(I.result(q, 'TC-001', { status: 'ok' }), 'invalid');
    var r0 = I.testCase(q, 'TC-015').retest; yes(I.result(q, 'TC-015', { status: 'pass', evidence: ['scale-sync.mp4'] }));
    var t = I.testCase(q, 'TC-015'); eq(t.retest, r0 + 1); eq(t.st, 'pass'); ok(t.evidence.indexOf('scale-sync.mp4') >= 0); eq(t.hist.length, 1);
    var n = yes(I.addTestCase(q, { module: 'logi', scen: 'Reschedule pickup oleh klien', exp: 'Permintaan pending dispatch', sev: 'medium' })); ok(/^TC-\d{3}$/.test(n.tc.id));
  });
  add('NP-04', 'IMP-T27', ['Alur bug open → fixing → fixed → retest → closed; tutup ditolak bila test belum lulus', 'Bug flow open → fixing → fixed → retest → closed; closing refused while the test fails'], function (E, I) {
    var q = as(E, 'intan'); no(I.setBugStatus(q, 'BUG-005', 'fixed', 'x'), 'jump', 'skip fixing');
    yes(I.setBugStatus(q, 'BUG-005', 'fixing', 'Dikerjakan')); yes(I.setBugStatus(q, 'BUG-005', 'fixed', 'Patch')); yes(I.setBugStatus(q, 'BUG-005', 'retest', 'Retest'));
    no(I.setBugStatus(q, 'BUG-005', 'closed', 'Tutup'), 'jump', 'TC-023 still fails');
    yes(I.result(q, 'TC-023', { status: 'pass' })); yes(I.setBugStatus(q, 'BUG-005', 'closed', 'Retest lulus')); eq(I.bug(q, 'BUG-005').st, 'closed');
    var b = yes(I.addBug(q, { t: 'Tombol export hilang di iPad', sev: 'low', tc: 'TC-031' })); ok(/^BUG-\d{3}$/.test(b.bug.id));
  });
  add('NP-04', 'IMP-T28', ['Regression = suite node nyata; jumlah kasus manifest = jumlah kasus file', 'Regression = the real node suites; manifest counts = actual case counts'], function (E, I, ctx) {
    var s = I.suites(as(E, 'intan')); ok(s.length >= 10);
    (ctx.counts || []).forEach(function (c) { var m = s.filter(function (x) { return x.k === c[0]; })[0]; ok(m, c[0] + ' in manifest'); eq(m.total, c[1], c[0] + ' case count'); });
    eq(I.qaSummary(as(E, 'intan')).regression.rate, 100, 'recorded runs pass');
    no(I.recordSuiteRun(as(E, 'intan'), 'fin', 50, 45), 'invalid'); yes(I.recordSuiteRun(as(E, 'intan'), 'fin', 44, 45)); ok(I.qaSummary(as(E, 'intan')).regression.rate < 100);
  });
  add('NP-04', 'IMP-T29', ['E2E emas: rantai record nyata, read-only', 'Golden E2E: a real record chain, read-only'], function (E, I) {
    var before = H([E.LG.state(), E.PR.state(), E.DL.state(), E.F.state()]), e = I.e2e(as(E, 'intan'));
    eq(e.total, 20); ok(e.found >= 8, 'found ' + e.found); ok(e.chain.steps.filter(function (s) { return s.found; }).every(function (s) { return !!s.id; }), 'found steps carry ids');
    var rc = e.chain.steps.filter(function (s) { return s.k === 'receiving'; })[0]; if (rc.found) ok(E.PR.rcv(rc.id), 'receiving id is real');
    ok(e.coverage.filter(function (c) { return c.found; }).length >= e.found, 'coverage ≥ chain');
    var r = yes(I.runE2E(as(E, 'intan'))); ok(/^E2E-\d{3}$/.test(r.run.id) && r.run.id !== 'E2E-001'); eq(H([E.LG.state(), E.PR.state(), E.DL.state(), E.F.state()]), before, 'owner engines untouched');
    no(I.runE2E(as(E, 'dodi')), 'noperm');
  });
  add('NP-04', 'IMP-T30', ['Business rule §23 live; probe mutasi di sandbox lalu dipulihkan', 'Business rules §23 live; mutating probes run in a sandbox and are restored'], function (E, I) {
    var before = H([E.PR.state(), E.F.state()]), r = yes(I.runRules(as(E, 'intan'))).run;
    eq(r.total, 6); eq(r.pass, 6, r.results.filter(function (x) { return !x.ok; }).map(function (x) { return x.id + ' ' + x.evidence[1]; }).join(' | '));
    ok(r.results.some(function (x) { return x.how === 'sandbox'; }) && r.results.some(function (x) { return x.how === 'live-readonly'; }));
    eq(H([E.PR.state(), E.F.state()]), before, 'JFPROD & JFFIN restored exactly');
  });

  /* ---- NP-05 security ---- */
  add('NP-05', 'IMP-T31', ['16 peran §25 di-resolve dengan user demo nyata', '16 §25 roles resolved with real demo users'], function (E, I) {
    var r = I.secRoles(as(E, 'intan')); eq(r.length, 16); r.forEach(function (x) { ok(x.resolved && x.match, x.u + ' → ' + x.role + ' (' + x.code + ')'); ok(x.landing, x.u + ' landing'); });
  });
  add('NP-05', 'IMP-T32', ['Matriks izin View/Create/Edit/Approve/Export/Admin × modul × cakupan (live)', 'Permission matrix View/Create/Edit/Approve/Export/Admin × module × scope (live)'], function (E, I) {
    var m = I.permMatrix(as(E, 'intan')); eq(m.actions.length, 6); ok(m.modules.length >= 10); eq(m.rows.length, 16);
    var f = m.rows.filter(function (x) { return x.u === 'budi'; })[0].cells.fin, d = m.rows.filter(function (x) { return x.u === 'ketut'; })[0].cells.fin;
    ok(f.approve.has > 0 && f.view.has > 0, 'finance approves in finance'); eq(d.approve.has + d.view.has + d.create.has, 0, 'driver nothing in finance');
    ok(['own', 'team', 'branch', 'selbranch', 'all'].indexOf(f.scope) >= 0, 'scope');
  });
  add('NP-05', 'IMP-T33', ['Uji negatif live: 16/16 ditolak, ROLE_TESTED per peran', 'Live negative tests: 16/16 denied, ROLE_TESTED per role'], function (E, I) {
    var r = yes(I.runSecurity(as(E, 'intan'))).run; eq(r.total, 16); eq(r.pass, 16, r.results.filter(function (x) { return x.res === 'fail'; }).map(function (x) { return x.id; }).join());
    eq(I.state().audit.filter(function (e) { return e.ev === 'ROLE_TESTED'; }).length, 16); ok(!audited(I, 'SECURITY_FAILURE'));
    ['SVT-001', 'SVT-005', 'SVT-007', 'SVT-009'].forEach(function (id) { ok(r.results.some(function (x) { return x.id === id && x.res === 'pass'; }), id); });
    no(I.runSecurity(as(E, 'bayu')), 'noperm'); var rp = I.secReport(as(E, 'bayu')); eq(rp.failures, 0); eq(rp.st, 'healthy');
  });
  add('NP-05', 'IMP-T34', ['Izin bocor → SECURITY_FAILURE + temuan kritis + gerbang go-live', 'Leaked permission → SECURITY_FAILURE + critical finding + go-live gate'], function (E, I) {
    E.X.admin.setPerms('USR-002', ['ar.view'], [], 'test'); // driver given a finance permission by mistake
    var r = yes(I.runSecurity(as(E, 'intan'))).run, f = r.results.filter(function (x) { return x.res === 'fail'; });
    ok(f.some(function (x) { return x.id === 'SVT-002'; }), 'driver → receivables now allowed'); ok(audited(I, 'SECURITY_FAILURE', 'SVT-002', 'failed'));
    ok(r.findings.some(function (x) { return x.sev === 'critical' && x.id === 'SVT-002'; })); ok(I.readiness().securityFailures.indexOf('SVT-002') >= 0, 'readiness reports it');
    eq(I.secReport(as(E, 'intan')).st, 'critical');
  });
  add('NP-05', 'IMP-T35', ['Checklist keamanan §28 dari konfigurasi nyata', '§28 security checklist from the real configuration'], function (E, I) {
    var c = I.secChecklist(as(E, 'intan')); eq(c.length, 11); c.forEach(function (x) { ok(x.ok, x.k + ': ' + x.v[1]); });
    var keep = E.X.POLICY.minPassword; E.X.POLICY.minPassword = 6;
    try { ok(!I.secChecklist(as(E, 'intan')).filter(function (x) { return x.k === 'password'; })[0].ok, 'weak policy detected'); } finally { E.X.POLICY.minPassword = keep; }
  });

  /* ---- NP-07 reliability ---- */
  add('NP-07', 'IMP-T36', ['Integration health = JFSYS.integrations (tidak disalin)', 'Integration health = JFSYS.integrations (not copied)'], function (E, I) {
    var i = I.integrationHealth(as(E, 'adit')), s = E.S.integrations(as(E, 'rama')); eq(i.length, s.length);
    i.forEach(function (x, n) { eq(x.st, s[n].st, x.id); ok(['healthy', 'warning', 'critical', 'disconnected'].indexOf(x.st) >= 0); ok('latency' in x && 'lastSync' in x && 'lastSuccess' in x && 'error' in x && 'owner' in x); });
    ok(I.state().integ === undefined, 'no integration copy in the JFIMP store');
  });
  add('NP-07', 'IMP-T37', ['Performa: target vs hasil + benchmark live terukur', 'Performance: target vs result + a measured live benchmark'], function (E, I) {
    ok(I.perfTests(as(E, 'adit')).length >= 9); no(I.runBenchmark(as(E, 'dodi')), 'noperm');
    var r = yes(I.runBenchmark(as(E, 'adit'), 50)).results; eq(r.length, 3);
    r.forEach(function (x) { ok(x.live && typeof x.res === 'number' && x.res >= 0 && x.runs === 50 && x.items > 0, x.id); ok(/^PFT-\d{3}$/.test(x.id)); });
    ok(audited(I, 'PERF.RUN'));
  });
  add('NP-07', 'IMP-T38', ['6 simulasi reliability gagal dengan anggun; jaringan dipulihkan', '6 reliability simulations fail gracefully; network restored'], function (E, I) {
    no(I.runReliability(as(E, 'intan')), 'noperm');
    var r = yes(I.runReliability(as(E, 'adit'))).results; eq(r.length, 6); r.forEach(function (x) { eq(x.res, 'pass', x.id + ' ' + x.evidence[1]); });
    eq(E.X.net(), 'online', 'network back online'); ok(I.reliability(as(E, 'adit')).every(function (x) { return x.res === 'pass' && x.at; }));
  });
  add('NP-07', 'IMP-T39', ['Restore test nyata: semua state engine round trip, hash & jumlah cocok, live tidak berubah', 'Real restore test: every engine state round-trips, hash & counts match, live untouched'], function (E, I) {
    no(I.runRestoreTest(as(E, 'intan'), 'x'), 'noperm'); no(I.runRestoreTest(as(E, 'adit'), 'x', { device: 'mobile' }), 'device');
    var before = H([E.CM.state(), E.F.state()]), t = yes(I.runRestoreTest(as(E, 'adit'), 'Uji restore mingguan')).test;
    eq(t.res, 'pass'); ok(t.hashOk && t.countsOk && t.liveUntouched); ok(t.engines >= 8 && t.records > 500, t.engines + ' engines, ' + t.records + ' records'); ok(typeof t.dur === 'number');
    eq(H([E.CM.state(), E.F.state()]), before); ok(audited(I, 'RESTORE_EXECUTED', t.id));
    var dr = I.dr(as(E, 'adit')); eq(dr.rto.src, t.id); ok(dr.rto.ok && dr.rpo.target === 24);
  });
  add('NP-07', 'IMP-T40', ['Backup dibaca dari JFSYS + kebijakan; siap bila sukses hari ini', 'Backup read from JFSYS + policy; ready when successful today'], function (E, I) {
    var b = I.backup(as(E, 'adit')), s = E.S.backups(as(E, 'rama')); eq(b.last.id, s.last.id); eq(b.lastOk.id, s.lastOk.id); eq(b.src, 'JFSYS.backups');
    ok(b.policy.freq && b.policy.retention && b.policy.location && b.policy.ownerN); eq(b.ready, s.lastOk.at.slice(0, 10) === I.today()); ok(b.restoreTested);
  });
  add('READY', 'IMP-T41', ['readiness(): build/qa/security/integration 0–100 + fakta gerbang untuk JFGO', 'readiness(): build/qa/security/integration 0–100 + gate facts for JFGO'], function (E, I) {
    var r = I.readiness(); ['build', 'qa', 'security', 'integration'].forEach(function (k) { ok(typeof r[k] === 'number' && r[k] >= 0 && r[k] <= 100, k + ' ' + r[k]); ok(r.evidence[k], k + ' evidence'); });
    ok(Array.isArray(r.criticalBugs) && r.criticalBugs.indexOf('BUG-007') >= 0, 'BUG-007 critical open'); eq(r.securityFailures.length, 0); eq(r.permissionFailures.length, 0); eq(r.restoreTested, true);
    eq(r.qa, Math.round(I.qaSummary(as(E, 'intan')).pass / I.qaSummary(as(E, 'intan')).total * 100));
    var c = I.center(as(E, 'aji')); ok(c.readiness && c.env && c.modules.length === 8 && c.integration && c.qa && c.security && c.reliability && c.data);
  });
  add('READY', 'IMP-T42', ['addRolePerms / addNav untuk engine B & C (tanpa duplikat)', 'addRolePerms / addNav for engines B & C (no duplicates)'], function (E, I) {
    ok(I.addNav('implead', { k: 'x', l: ['X', 'X'], i: 'flag', s: 'QA-001' }, 'g-go12') === false, 'QA-001 already in nav');
    var origScreen = E.C.screen, nav0 = E.C.ROLES.implead.nav.map(function (n) { return n.sub ? Object.assign({}, n, { sub: n.sub.slice() }) : n; });
    E.C.screen = function (id) { return id === 'ZZ-T42' ? { id: id, p: 'imp.view' } : origScreen(id); };
    try {
    ok(I.addNav('implead', { k: 'zz42', l: ['ZZ', 'ZZ'], i: 'flag', s: 'ZZ-T42' }, 'g-go12')); ok(!I.addNav('implead', { k: 'zz42', l: ['ZZ', 'ZZ'], i: 'flag', s: 'ZZ-T42' }, 'g-go12'), 'deduped');
    var g = as(E, 'bayu').nav.filter(function (n) { return n.k === 'g-go12'; })[0]; ok(g && g.sub.some(function (n) { return n.s === 'ZZ-T42'; }), 'visible after append');
    I.addRolePerms('trainer', ['help.manage']); ok(E.X.can(as(E, 'ratih'), 'help.manage')); E.S._reset(); ok(E.X.can(as(E, 'ratih'), 'help.manage'), 'kept across JFSYS._reset');
    } finally { E.C.screen = origScreen; E.C.ROLES.implead.nav = nav0; }
  });

  function run(E) {
    var I = E.I, res = [];
    T.forEach(function (t) {
      var NOW = I.u.ms('2026-10-06 10:30'); I._setClock(function () { return NOW; }); if (E.S._setClock) E.S._setClock(function () { return NOW; });
      if (E.X._resetStore) E.X._resetStore(); E.S._reset(); I._reset(); I.link('GO', null); I.link('HELP', null);
      try { t.fn(E, I, E); res.push({ group: t.group, id: t.id, n: t.n, ok: true }); }
      catch (e) { res.push({ group: t.group, id: t.id, n: t.n, ok: false, err: e.message }); }
    });
    I._setClock(null); if (E.S._setClock) E.S._setClock(null); if (E.X._resetStore) E.X._resetStore(); E.S._reset(); I._reset(); I.link('GO', null);
    return res;
  }
  var api = { cases: T, run: run };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.JFIMP_TESTS = api;
})(typeof window !== 'undefined' ? window : this);
