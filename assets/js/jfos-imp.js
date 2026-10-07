/* ==========================================================================
   JFRESH OS — Implementation engine (Phase 12 · Engine A · JFIMP · NP 1.0)
   NP-01 environments, releases, promotion pipeline and the production
   deployment gate · NP-02 One Data control (domains, duplicate detection,
   orphan check, data health) · NP-03 module waves, integration map,
   blockers, data-reuse trace · NP-04 QA test cases, bugs, regression
   manifest, golden end-to-end walk, business-rule tests · NP-05 live
   security validation (role matrix, negative access tests, checklist) ·
   NP-07 integration health, performance, reliability, backup, restore
   test, disaster recovery · readiness inputs for the go-live score.

   ONE DATA, ONE SOURCE (§1–§4, §19, §117): this engine never copies a
   client, order, invoice, user, integration or backup. It reads the owner
   engines (JFCOMM, JFLOG, JFPROD, JFDLV, JFFIN, JFACCESS, JFCLP, JFSYS) at
   call time and references their ids. Only implementation-owned records
   (environments, releases, promotions, blockers, test cases, bugs, runs,
   review decisions) live in this store. Every permission is checked here,
   never only in the UI. Prototype only: a production backend repeats it.
   ========================================================================== */
(function (root) {
  function req(p) { try { return typeof require !== 'undefined' ? require(p) : null; } catch (e) { return null; } }
  var D = root.JFIMP_DATA || req('./jfos-imp-data.js');
  function L(a, b) { return [a, b === undefined ? a : b]; }
  var M = { version: 'NP 1.0', D: D, C: null, X: null, P: null, CM: null, LG: null, PR: null, DL: null, FN: null, CLP: null, SYS: null, GO: null, HELP: null };
  var DAY = 864e5;
  function clone(o) { return o == null ? o : JSON.parse(JSON.stringify(o)); }
  function by(arr, k, v) { for (var i = 0; i < (arr || []).length; i++) if (arr[i][k] === v) return arr[i]; return null; }
  function T(x) { return Array.isArray(x) ? x[0] : (x == null ? '' : String(x)); }
  function Ln(x) { return Array.isArray(x) ? x : L(String(x == null ? '' : x)); }
  function str(x) { return String(x == null ? '' : x).trim(); }
  function ms(s) { if (typeof s === 'number') return s; if (!s) return 0; var p = String(s).split(/[-: T]/); return Date.UTC(+p[0], +p[1] - 1, +(p[2] || 1), +(p[3] || 0), +(p[4] || 0), +(p[5] || 0)); }
  function iso(t) { return new Date(t).toISOString().slice(0, 10); }
  function isoT(t) { return new Date(t).toISOString().slice(0, 16).replace('T', ' '); }
  function dayDiff(a, b) { return Math.round((ms(String(b).slice(0, 10)) - ms(String(a).slice(0, 10))) / DAY); }
  function pct(a, b) { return b ? Math.round(a / b * 1000) / 10 : null; }
  function uniq(a) { return a.filter(function (x, i) { return x != null && a.indexOf(x) === i; }); }
  function hash(s) { s = String(s); var h = 2166136261; for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  function tryf(fn, dflt) { try { var v = fn(); return v == null ? dflt : v; } catch (e) { return dflt; } }
  function perf() { return root.performance && root.performance.now ? root.performance.now() : (typeof process !== 'undefined' && process.hrtime ? (function () { var h = process.hrtime(); return h[0] * 1e3 + h[1] / 1e6; })() : Date.now()); }
  M.u = { L: L, T: T, ms: ms, iso: iso, isoT: isoT, pct: pct, clone: clone, hash: hash };

  M.MSG = {
    noperm: L('Anda tidak memiliki izin untuk tindakan ini.', 'You do not have permission for this action.'),
    notfound: L('Data tidak ditemukan.', 'Record not found.'),
    invalid: L('Periksa data dan coba lagi.', 'Check the data and try again.'),
    reason: L('Alasan wajib diisi.', 'A reason is required.'),
    jump: L('Langkah ini belum bisa dilakukan. Ikuti urutan DEV → QA → UAT → PRODUCTION.', 'This step is not possible yet. Follow DEV → QA → UAT → PRODUCTION.'),
    dup: L('Permintaan yang sama masih terbuka.', 'The same request is still open.'),
    scope: L('Data ini di luar cakupan Anda.', 'This record is outside your scope.'),
    maker: L('Pembuat permintaan tidak boleh menyetujui permintaannya sendiri.', 'The requester cannot approve their own request.'),
    gate: L('Syarat promosi belum terpenuhi.', 'Promotion requirements are not met.'),
    locked: L('Data ini sudah terkunci.', 'This record is locked.'),
    inuse: L('Data sedang dipakai.', 'This record is in use.'),
    device: L('Tindakan ini tidak tersedia di perangkat mobile.', 'This action is not available on mobile.'),
    load: L('Data belum berhasil dimuat.', 'The data could not be loaded.')
  };

  /* ---------- Permissions ---------- */
  M.PERMS = {
    'imp.view': L('Lihat Build, Environment, Roadmap & Reliability (Fase 12)', 'View Build, Environment, Roadmap & Reliability (Phase 12)'),
    'imp.data.view': L('Lihat One Data Control', 'View One Data Control'), 'imp.qa.view': L('Lihat QA & test case', 'View QA & test cases'), 'imp.sec.view': L('Lihat validasi keamanan', 'View security validation'),
    'imp.env.manage': L('Kelola environment & catat build', 'Manage environments & record builds'), 'imp.release.request': L('Ajukan promosi rilis', 'Request a release promotion'),
    'imp.release.approve': L('Setujui promosi ke QA / UAT', 'Approve promotion to QA / UAT'), 'imp.release.approve.prod': L('Setujui deployment produksi (Product Owner)', 'Approve production deployment (Product Owner)'),
    'imp.deploy': L('Eksekusi deployment (teknis)', 'Execute deployments (technical)'), 'imp.validate': L('Validasi smoke test setelah deploy', 'Validate the smoke test after a deploy'),
    'imp.blocker.manage': L('Kelola blocker implementasi', 'Manage implementation blockers'), 'imp.data.review': L('Review kandidat duplikat & orphan', 'Review duplicate candidates & orphans'),
    'imp.qa.manage': L('Kelola test case, hasil & bug', 'Manage test cases, results & bugs'), 'imp.qa.run': L('Jalankan E2E, business rule & benchmark', 'Run E2E, business rules & benchmarks'),
    'imp.sec.run': L('Jalankan validasi keamanan', 'Run security validation'), 'imp.rel.run': L('Jalankan simulasi reliability & restore test', 'Run reliability simulations & restore tests')
  };
  var V4 = ['imp.view', 'imp.data.view', 'imp.qa.view', 'imp.sec.view'];
  M.ROLE_PERMS = {
    implead: V4.concat(['imp.env.manage', 'imp.release.request', 'imp.blocker.manage', 'imp.qa.run']),
    qalead: V4.concat(['imp.release.request', 'imp.release.approve', 'imp.validate', 'imp.blocker.manage', 'imp.qa.manage', 'imp.qa.run', 'imp.sec.run']),
    datalead: ['imp.view', 'imp.data.view', 'imp.qa.view', 'imp.data.review', 'imp.blocker.manage'],
    trainer: ['imp.view'],
    owner: V4.concat(['imp.release.approve', 'imp.release.approve.prod']),
    superadmin: V4.concat(['imp.env.manage', 'imp.deploy', 'imp.validate', 'imp.sec.run', 'imp.rel.run']),
    sysadmin: V4.concat(['imp.env.manage', 'imp.release.request', 'imp.deploy', 'imp.validate', 'imp.rel.run'])
  };
  M.NEW_ROLE_KEYS = ['implead', 'qalead', 'datalead', 'trainer'];
  function can(ctx, p) { return !p || !!(ctx && ctx.perms && ctx.perms.indexOf(p) >= 0); }
  M.can = can;
  function empId(ctx) { return ctx && (ctx.employee ? ctx.employee.id : ctx.emp || ctx.uid) || 'system'; }
  function ctxName(ctx) { return ctx && (ctx.fullName || ctx.name) || 'Sistem JFRESH'; }
  function isMobile(ctx, o) { return !!((o && o.device === 'mobile') || (ctx && ctx.device === 'mobile')); }
  // Internal read contexts for owner engines' perm-gated getters (engine-to-engine, never returned to a caller).
  function sysCtx() { return { uid: 'system:jfimp', perms: M.SYS ? Object.keys(M.SYS.PERMS || {}) : [] }; }
  function finCtx() { return { uid: 'system:jfimp', perms: M.FN && M.FN.PERMS ? Object.keys(M.FN.PERMS) : [] }; }
  function goEng() { return M.GO || root.JFGO || (typeof global !== 'undefined' && global.JFGO) || null; }
  function helpEng() { return M.HELP || root.JFHELP || (typeof global !== 'undefined' && global.JFHELP) || null; }
  M.link = function (k, eng) { if (k === 'GO' || k === 'HELP') M[k] = eng || null; };

  /* ---------- State ---------- */
  var KEY = 'jfos-imp-v1', mem = {}, st = null, SIM = ms(D.simNow), T0 = Date.now(), fixed = null, ls = null;
  try { ls = root.localStorage || null; if (ls) { ls.setItem('__jfi', '1'); ls.removeItem('__jfi'); } } catch (e) { ls = null; }
  function clock() { if (fixed) return fixed(); if (M.LG && M.LG.now) return M.LG.now(); return SIM + (Date.now() - T0); }
  function S() {
    if (st) return st;
    try { var raw = ls ? ls.getItem(KEY) : mem[KEY]; if (raw) { var o = JSON.parse(raw); if (o && o.v === 1) { st = o; return st; } } } catch (e) {}
    seed(); save(); return st;
  }
  function save() { if (!st) return; st.upd = clock(); try { var s = JSON.stringify(st); if (ls) ls.setItem(KEY, s); else mem[KEY] = s; } catch (e) {} }
  M._setClock = function (fn) { fixed = fn; };
  M.now = function () { return clock(); };
  M.today = function () { return iso(M.now()); };
  function nowS() { return isoT(M.now()); }
  M.nowS = nowS;
  M.state = function () { return S(); };
  M.save = save;
  function nid(k, pre, pad) { var s = S(); var n = s.seq[k]++; return pre + String(n).padStart(pad || 3, '0'); }

  function seed() {
    st = { v: 1, upd: null, seq: { aud: 1, prm: D.PROMOS.length + 1, blk: D.BLOCKERS.length + 1, bug: D.BUGS.length + 1, e2e: 2, svr: 1, pft: D.PERF.length + 1, rst: D.RESTORE_SEED.length + 1, rlt: 1, tc: D.TESTCASES.length + 1 },
      audit: [], envs: clone(D.ENVS), rls: clone(D.RELEASES), promos: [], blockers: [], tcs: [], bugs: [], suites: {}, e2e: [], rules: [], secRuns: [], perf: [], reli: {}, restores: clone(D.RESTORE_SEED), dupDec: {}, deploys: [] };
    D.PROMOS.forEach(function (p) { st.promos.push({ id: p[0], rls: p[1], from: p[2], to: p[3], by: p[4], at: p[5], appr: p[6], apprAt: p[7], dep: p[8], depAt: p[9], valAt: p[10], res: p[11], st: 'validated', reason: L('Riwayat pipeline', 'Pipeline history'), seed: true }); });
    D.BLOCKERS.forEach(function (b) { st.blockers.push({ id: b[0], t: L(b[1], b[2]), wave: b[3], sev: b[4], owner: b[5], due: b[6], st: b[7], bug: b[8], link: b[9], at: '2026-10-01 09:00', by: 'EMP-130', log: [] }); });
    D.TESTCASES.forEach(function (t) {
      // [id, module, scen id, scen en, sev, status, tester, exp id, exp en, actual id | null, actual en | evidence, retest]
      var act = t[9] != null ? L(t[9], t[10]) : (t[5] === 'pass' ? L(t[7], t[8]) : null), ev = t[9] == null && t[10] ? [t[10]] : [];
      st.tcs.push({ id: t[0], module: t[1], scen: L(t[2], t[3]), build: 'v1.0.0-rc.1', pre: L('Data demo UAT, user sesuai peran', 'UAT demo data, user per role'), steps: [L('Login sesuai peran', 'Log in as the role'), L('Jalankan skenario', 'Run the scenario'), L('Bandingkan hasil', 'Compare the result')],
        exp: L(t[7], t[8]), act: act, sev: t[4], st: t[5], tester: t[6], evidence: ev, retest: t[11] || 0, at: '2026-10-05 15:00', hist: [] });
    });
    D.BUGS.forEach(function (b) { st.bugs.push({ id: b[0], t: L(b[1], b[2]), sev: b[3], tc: b[4], st: b[5], owner: b[6], at: b[7], rls: b[8], log: [] }); });
    // Phase 12 suites (imp/go/help) have no recorded run in the seed: they count once a run is recorded (recordSuiteRun).
    D.SUITES.forEach(function (s) { var p12 = ['imp', 'go', 'help'].indexOf(s[0]) >= 0; st.suites[s[0]] = { k: s[0], file: s[1], total: s[2], passed: p12 ? null : s[2], at: p12 ? null : D.SUITE_RUN, wave: s[3] }; });
    D.PERF.forEach(function (p) { st.perf.push({ id: p[0], kind: p[1], n: L(p[2], p[3]), target: L(p[4], p[5]), tv: p[6], res: p[7], unit: p[8], st: p[9], at: p[10], live: false }); });
    return st;
  }

  /* ---------- Audit (§111 events + engine events) ---------- */
  M.AUDIT = {
    BUILD_PROMOTED: L('Build dipromosikan', 'Build promoted'), DEPLOYMENT: L('Deployment', 'Deployment'), MIGRATION_EXECUTED: L('Migrasi dieksekusi', 'Migration executed'), MIGRATION_APPROVED: L('Migrasi disetujui', 'Migration approved'),
    RESET_REQUESTED: L('Reset diminta', 'Reset requested'), RESET_APPROVED: L('Reset disetujui', 'Reset approved'), SNAPSHOT_CREATED: L('Snapshot dibuat', 'Snapshot created'), RESTORE_EXECUTED: L('Restore dieksekusi', 'Restore executed'),
    PRODUCTION_START: L('Production Start', 'Production Start'), ROLE_TESTED: L('Role diuji', 'Role tested'), SECURITY_FAILURE: L('Kegagalan keamanan', 'Security failure'), UAT_COMPLETED: L('UAT selesai', 'UAT completed'),
    GOLIVE_APPROVED: L('Go-Live disetujui', 'Go-Live approved'), INCIDENT_CLOSED: L('Insiden ditutup', 'Incident closed'), RELEASE_DEPLOYED: L('Rilis ter-deploy', 'Release deployed'),
    'PROMOTION.REQUEST': L('Promosi diajukan', 'Promotion requested'), 'PROMOTION.REJECT': L('Promosi ditolak', 'Promotion rejected'), 'DEPLOY.VALIDATED': L('Smoke test deploy', 'Deploy smoke test'), 'DEPLOY.ROLLBACK': L('Rollback deploy', 'Deploy rollback'),
    'BUILD.RECORD': L('Build dicatat', 'Build recorded'), 'ENV.CHANGE': L('Environment diubah', 'Environment changed'), 'BLOCKER.CREATE': L('Blocker dibuat', 'Blocker created'), 'BLOCKER.CHANGE': L('Blocker diubah', 'Blocker changed'),
    'TC.RESULT': L('Hasil test case', 'Test case result'), 'TC.CREATE': L('Test case dibuat', 'Test case created'), 'BUG.CREATE': L('Bug dilaporkan', 'Bug reported'), 'BUG.CHANGE': L('Status bug diubah', 'Bug status changed'), 'SUITE.RUN': L('Hasil regression suite', 'Regression suite result'),
    'E2E.RUN': L('E2E dijalankan', 'E2E run'), 'RULES.RUN': L('Business rule test dijalankan', 'Business rule tests run'), 'SECURITY.RUN': L('Validasi keamanan dijalankan', 'Security validation run'),
    'DUP.REVIEW': L('Review kandidat duplikat', 'Duplicate candidate reviewed'), 'DUP.MERGE_APPROVED': L('Permintaan merge disetujui pemilik data', 'Merge request approved by the data owner'),
    'PERF.RUN': L('Benchmark performa', 'Performance benchmark'), 'RELIABILITY.RUN': L('Simulasi reliability', 'Reliability simulation'), 'ACCESS.DENIED': L('Akses ditolak', 'Access denied')
  };
  M.AUDIT_111 = ['BUILD_PROMOTED', 'DEPLOYMENT', 'MIGRATION_EXECUTED', 'MIGRATION_APPROVED', 'RESET_REQUESTED', 'RESET_APPROVED', 'SNAPSHOT_CREATED', 'RESTORE_EXECUTED', 'PRODUCTION_START', 'ROLE_TESTED', 'SECURITY_FAILURE', 'UAT_COMPLETED', 'GOLIVE_APPROVED', 'INCIDENT_CLOSED', 'RELEASE_DEPLOYED'];
  function device(ctx) { if (ctx && ctx.device) return ctx.device === 'mobile' ? 'Mobile' : ctx.device === 'ipad' || ctx.device === 'tablet' ? 'Tablet' : 'Desktop'; var ua = root.navigator && root.navigator.userAgent || 'node'; return /iPad|Tablet/i.test(ua) ? 'Tablet' : /Mobi|Android|iPhone/i.test(ua) ? 'Mobile' : (ua === 'node' ? 'Test' : 'Desktop'); }
  function J(x) { return x == null ? null : typeof x === 'string' ? x : JSON.stringify(x); }
  M.audit = function (ev, ctx, o) {
    o = o || {};
    var e = { id: 'IAU-' + String(S().seq.aud++).padStart(5, '0'), at: nowS(), ev: ev, uid: ctx && ctx.uid || null, emp: empId(ctx), actor: ctxName(ctx), role: ctx && ctx.roleKey || null, module: o.module || 'implementation',
      rec: o.rec || null, before: J(o.before), after: J(o.after), reason: o.reason == null ? null : T(o.reason), result: o.result || 'ok', device: device(ctx) };
    S().audit.unshift(e); if (S().audit.length > 3000) S().audit.length = 3000; save();
    return e;
  };
  M.auditLog = function (f) { f = f || {}; return S().audit.filter(function (e) { return (!f.ev || e.ev === f.ev) && (!f.rec || e.rec === f.rec); }); };
  function deny(ctx, perm, rec) { M.audit('ACCESS.DENIED', ctx, { rec: rec || perm, after: perm, result: 'denied' }); return { ok: false, code: 'noperm', msg: M.MSG.noperm }; }
  function bad(code, msg, x) { return Object.assign({ ok: false, code: code || 'invalid', msg: msg || M.MSG[code] || M.MSG.invalid }, x || {}); }
  function needReason(r) { return str(T(r)) ? null : bad('reason'); }
  M.deny = deny; M.bad = bad;
  function empName(id) { var x = M.X, e = x && id && x.employee(id); return e ? e.n : (id || '—'); }
  M.empName = empName;

  /* ==========================================================================
     NP-01 §7–§11 environments, releases, pipeline, deployment gate
     ========================================================================== */
  M.ENV_FLOW = D.ENV_FLOW;
  M.HEALTH = { healthy: [L('Sehat', 'Healthy'), 'ok'], live: [L('Live (instans ini)', 'Live (this instance)'), 'ok'], warning: [L('Perlu perhatian', 'Warning'), 'warn'], critical: [L('Kritis', 'Critical'), 'crit'], standby: [L('Standby · belum live', 'Standby · not live'), 'info'], down: [L('Down', 'Down'), 'crit'] };
  M.PROMO_ST = { requested: [L('Diajukan', 'Requested'), 'info'], approved: [L('Disetujui', 'Approved'), 'info'], deployed: [L('Ter-deploy · validasi', 'Deployed · validating'), 'warn'], validated: [L('Tervalidasi', 'Validated'), 'ok'], failed: [L('Smoke test gagal', 'Smoke test failed'), 'crit'], rejected: [L('Ditolak', 'Rejected'), 'mute'], rolledback: [L('Di-rollback', 'Rolled back'), 'mute'] };
  M.RLS_ST = { planned: [L('Direncanakan', 'Planned'), 'mute'], testing: [L('Dalam pengujian', 'Testing'), 'info'], live: [L('Live', 'Live'), 'ok'], superseded: [L('Digantikan', 'Superseded'), 'mute'] };
  function envByK(k) { return by(S().envs, 'k', k); }
  function rlsRec(id) { return by(S().rls, 'id', id) || by(S().rls, 'v', id); }
  // The UAT instance is the running app: its health is JFSYS.health (read, not copied).
  function envHealth(e) {
    if (e.live && M.SYS && M.SYS.health) { var h = tryf(function () { return M.SYS.health(sysCtx()); }, null); if (h) return h.overall === 'healthy' ? 'live' : h.overall; }
    return e.health;
  }
  function openBugs(f) { return S().bugs.filter(function (b) { return ['closed', 'fixed'].indexOf(b.st) < 0 && (!f || f(b)); }); }
  function envView(e) {
    var hl = envHealth(e), hs = M.HEALTH[hl] || M.HEALTH.warning;
    var pend = S().promos.filter(function (p) { return p.to === e.k && ['requested', 'approved', 'deployed'].indexOf(p.st) >= 0; });
    var blockers = e.k === 'PRD' ? S().blockers.filter(function (b) { return b.st !== 'resolved'; }).length : openBugs(function (b) { return b.rls === e.version && (b.sev === 'critical' || b.sev === 'high'); }).length;
    return { id: e.id, k: e.k, n: e.n, ord: e.ord, db: e.db, cred: e.cred, integ: e.integ, storage: e.storage, log: e.log, config: e.config, url: e.url, data: e.data, version: e.version, health: hl, healthN: hs[0], tone: hs[1],
      lastDeploy: e.lastDeploy, owner: e.owner, ownerN: empName(e.owner), live: !!e.live, note: e.note, pending: pend.map(function (p) { return p.id; }), blockers: blockers };
  }
  M.environments = function (ctx) { if (!can(ctx, 'imp.view')) return []; return S().envs.map(envView); };
  M.environment = function (ctx, id) {
    if (!can(ctx, 'imp.view')) return null;
    var e = by(S().envs, 'id', id) || envByK(id); if (!e) return null;
    return Object.assign(envView(e), { releases: S().rls.filter(function (r) { return r.envs[e.k]; }).map(function (r) { return { id: r.id, v: r.v, st: r.envs[e.k] }; }),
      promotions: S().promos.filter(function (p) { return p.to === e.k; }).map(promoView), deploys: S().deploys.filter(function (d) { return d.env === e.k; }) });
  };
  M.setEnv = function (ctx, id, patch, reason) {
    if (!can(ctx, 'imp.env.manage')) return deny(ctx, 'imp.env.manage', id);
    var e = by(S().envs, 'id', id) || envByK(id); if (!e) return bad('notfound');
    var r0 = needReason(reason); if (r0) return r0;
    patch = patch || {}; var allowed = ['health', 'config', 'note'], before = {}, after = {};
    if (patch.health && (!M.HEALTH[patch.health] || e.live)) return bad('invalid');
    allowed.forEach(function (k) { if (patch[k] != null) { before[k] = e[k]; e[k] = k === 'note' ? Ln(patch[k]) : patch[k]; after[k] = e[k]; } });
    if (!Object.keys(after).length) return bad('invalid');
    M.audit('ENV.CHANGE', ctx, { rec: e.id, before: before, after: after, reason: reason }); save();
    return { ok: true, env: envView(e) };
  };
  // §8 environment dashboard
  M.envDashboard = function (ctx) {
    if (!can(ctx, 'imp.view')) return null;
    var ev = S().envs.map(envView), h = function (k) { var e = by(ev, 'k', k); return { health: e.health, healthN: e.healthN, tone: e.tone, version: e.version }; };
    return { build: buildPct(), dev: h('DEV'), qa: h('QA'), uat: h('UAT'), prd: h('PRD'), pending: S().promos.filter(function (p) { return ['requested', 'approved', 'deployed'].indexOf(p.st) >= 0; }).length,
      blockers: S().blockers.filter(function (b) { return b.st !== 'resolved'; }).length, envs: ev };
  };

  function rlsView(r) {
    var s = M.RLS_ST[r.st] || M.RLS_ST.planned, nx = nextEnv(r);
    return { id: r.id, v: r.v, type: r.type, date: r.date, st: r.st, stN: s[0], tone: s[1], build: clone(r.build), envs: clone(r.envs), notes: r.notes, changes: r.changes, db: r.db, known: r.known, rollback: r.rollback, initial: !!r.initial, next: nx,
      open: S().promos.filter(function (p) { return p.rls === r.id && ['requested', 'approved', 'deployed'].indexOf(p.st) >= 0; }).map(function (p) { return p.id; }) };
  }
  function nextEnv(r) { var f = D.ENV_FLOW, hi = -1; f.forEach(function (k, i) { if (r.envs[k] === 'live' || r.envs[k] === 'superseded' || r.envs[k] === 'validated') hi = i; }); return hi < 0 ? (r.build.st === 'ok' ? 'DEV' : null) : (f[hi + 1] || null); }
  M.releases = function (ctx, f) { if (!can(ctx, 'imp.view')) return []; f = f || {}; return S().rls.filter(function (r) { return !f.st || r.st === f.st; }).map(rlsView); };
  M.release = function (ctx, id) {
    if (!can(ctx, 'imp.view')) return null;
    var r = rlsRec(id); if (!r) return null; var v = rlsView(r);
    v.gates = v.next ? M.gates(ctx, r.id, v.next) : null;
    v.promotions = S().promos.filter(function (p) { return p.rls === r.id; }).map(promoView);
    v.tests = qaFor(r.v); v.bugs = S().bugs.filter(function (b) { return b.rls === r.v; }).map(bugView);
    return v;
  };
  M.recordBuild = function (ctx, id, f, reason) {
    if (!can(ctx, 'imp.env.manage')) return deny(ctx, 'imp.env.manage', id);
    var r = rlsRec(id); if (!r) return bad('notfound');
    f = f || {}; var no = str(f.no); if (!/^b\d{2,6}$/.test(no)) return bad('invalid');
    if (r.build.st === 'ok') return bad('locked');
    var before = clone(r.build); r.build = { st: 'ok', no: no, at: nowS() }; r.envs.DEV = 'live'; if (r.st === 'planned') r.st = 'testing';
    S().rls.forEach(function (o) { if (o !== r && o.envs.DEV === 'live') o.envs.DEV = 'superseded'; }); envByK('DEV').version = r.v; envByK('DEV').lastDeploy = nowS();
    M.audit('BUILD.RECORD', ctx, { rec: r.id, before: before, after: r.build, reason: reason || null }); save();
    return { ok: true, release: rlsView(r) };
  };
  function qaFor(v) {
    var tcs = S().tcs.filter(function (t) { return t.build === v; }), n = function (s) { return tcs.filter(function (t) { return t.st === s; }).length; };
    return { total: tcs.length, pass: n('pass'), fail: n('fail'), blocked: n('blocked'), retest: n('retest'), rate: pct(n('pass'), tcs.length) || 0 };
  }
  function backupReady() {
    if (!M.SYS || !M.SYS.backups) return { ok: false, v: L('JFSYS tidak termuat', 'JFSYS not loaded') };
    var b = tryf(function () { return M.SYS.backups(sysCtx()); }, null); if (!b || !b.lastOk) return { ok: false, v: L('Belum ada backup sukses', 'No successful backup yet') };
    var ok = b.lastOk.at.slice(0, 10) === M.today();
    return { ok: ok, v: L(b.lastOk.id + ' · ' + b.lastOk.at + (ok ? '' : ' (bukan hari ini)'), b.lastOk.id + ' · ' + b.lastOk.at + (ok ? '' : ' (not today)')), id: b.lastOk.id };
  }
  M.backupReady = backupReady;
  // Engine B (JFGO) reports UAT and migration status; until it is loaded those gates stay closed (never assumed).
  function goGate(fn, lbl) {
    var G = goEng();
    if (!G) return { ok: false, v: L(lbl[0] + ': modul JFGO belum termuat', lbl[1] + ': JFGO module not loaded') };
    if (typeof G[fn] === 'function') { var r = tryf(function () { return G[fn](); }, null); if (!r) return { ok: false, v: M.MSG.load }; return { ok: !!r.ok, v: r.v ? Ln(r.v) : L(r.ok ? 'Lulus' : 'Belum lulus', r.ok ? 'Passed' : 'Not passed') }; }
    // Fallback on JFGO's own store when it has no gate function: UAT = no critical case open and ≥ 95% pass; migration = every batch through all pipeline steps.
    var gs = tryf(function () { return G.state(); }, null); if (!gs) return { ok: false, v: M.MSG.load };
    if (fn === 'uatGate' && Array.isArray(gs.uat)) { var u = gs.uat, p = u.filter(function (x) { return x.st === 'pass'; }).length, cr = u.filter(function (x) { return x.sev === 'critical' && x.st !== 'pass'; }).length, rate = pct(p, u.length) || 0; return { ok: u.length > 0 && !cr && rate >= 95, v: L('UAT ' + rate + '% lulus · ' + cr + ' kritis terbuka', 'UAT ' + rate + '% passed · ' + cr + ' critical open') }; }
    if (fn === 'migrationGate' && Array.isArray(gs.mig)) { var steps = (G.MIG_STEPS || []).length, done = gs.mig.filter(function (b) { return steps && (b.done || []).length >= steps; }).length; return { ok: gs.mig.length > 0 && done === gs.mig.length, v: L(done + '/' + gs.mig.length + ' batch migrasi selesai & disetujui', done + '/' + gs.mig.length + ' migration batches complete & approved') }; }
    return { ok: false, v: L(lbl[0] + ': status belum tersedia dari JFGO', lbl[1] + ': status not available from JFGO') };
  }
  M.GATES = {
    QA: [['build', L('Build berhasil', 'Build succeeded')], ['prev', L('Tervalidasi di DEV', 'Validated in DEV')], ['tests', L('Regression otomatis lulus', 'Automated regression passed')], ['approval', L('Disetujui QA Lead', 'Approved by the QA Lead')]],
    UAT: [['build', L('Build berhasil', 'Build succeeded')], ['prev', L('Tervalidasi di QA', 'Validated in QA')], ['qa', L('QA ≥ 80% & tanpa bug kritis terbuka', 'QA ≥ 80% & no open critical bug')], ['approval', L('Disetujui QA Lead', 'Approved by the QA Lead')]],
    PRD: [['build', L('Build disetujui (lulus UAT)', 'Approved build (passed UAT)')], ['stable', L('Versi stabil (bukan pre-release)', 'Stable version (not a pre-release)')], ['qa', L('QA lulus ≥ 95%, tanpa bug kritis/tinggi', 'QA passed ≥ 95%, no critical/high bug')],
      ['uat', L('UAT wajib lulus', 'Required UAT passed')], ['backup', L('Backup siap (sukses hari ini)', 'Backup ready (successful today)')], ['migration', L('Migrasi sudah dicek', 'Migration checked')], ['rollback', L('Rollback tersedia', 'Rollback available')], ['approver', L('Approver berwenang (Product Owner)', 'Authorized approver (Product Owner)')]],
    DEV: [['build', L('Build berhasil', 'Build succeeded')]]
  };
  // gates(ctx, rls, env, {approver}) → {ok, env, list[{k,n,ok,v}], failed[k]}
  M.gates = function (ctx, id, env, o) {
    var r = rlsRec(id); if (!r || !M.GATES[env]) return null;
    o = o || {}; var prevK = D.ENV_FLOW[D.ENV_FLOW.indexOf(env) - 1], qa = qaFor(r.v), list = [];
    var openReq = by(S().promos.filter(function (p) { return p.rls === r.id && p.to === env && ['approved', 'deployed', 'validated'].indexOf(p.st) >= 0; }), 'to', env);
    M.GATES[env].forEach(function (g) {
      var k = g[0], ok = false, v = null;
      if (k === 'build') { ok = r.build.st === 'ok' && (env !== 'PRD' || r.envs.UAT === 'live' || r.envs.UAT === 'validated' || r.envs.UAT === 'superseded'); v = r.build.st === 'ok' ? L(r.build.no + (env === 'PRD' ? ' · UAT ' + (r.envs.UAT || '—') : ''), r.build.no + (env === 'PRD' ? ' · UAT ' + (r.envs.UAT || '—') : '')) : L('Build belum ada', 'No build yet'); }
      else if (k === 'prev') { var pv = r.envs[prevK]; ok = pv === 'live' || pv === 'validated' || pv === 'superseded'; v = L(prevK + ': ' + (pv || '—')); }
      else if (k === 'tests') { var sv = Object.keys(S().suites).map(function (s) { return S().suites[s]; }).filter(function (s) { return s.at; }), fail = sv.filter(function (s) { return s.passed < s.total; }); ok = sv.length > 0 && !fail.length; v = L(sv.length - fail.length + '/' + sv.length + ' suite lulus', sv.length - fail.length + '/' + sv.length + ' suites passed'); }
      else if (k === 'qa') {
        var need = env === 'PRD' ? 95 : 80, crit = openBugs(function (b) { return b.rls === r.v && (b.sev === 'critical' || (env === 'PRD' && b.sev === 'high')); });
        ok = qa.total > 0 && qa.rate >= need && !crit.length; v = L('QA ' + qa.rate + '% (' + qa.pass + '/' + qa.total + ')' + (crit.length ? ' · bug terbuka ' + crit.map(function (b) { return b.id; }).join(', ') : ''), 'QA ' + qa.rate + '% (' + qa.pass + '/' + qa.total + ')' + (crit.length ? ' · open bugs ' + crit.map(function (b) { return b.id; }).join(', ') : ''));
      }
      else if (k === 'stable') { ok = !/-/.test(r.v); v = L(r.v); }
      else if (k === 'uat') { var u = goGate('uatGate', ['UAT', 'UAT']); ok = u.ok; v = u.v; }
      else if (k === 'migration') { var m = goGate('migrationGate', ['Migrasi', 'Migration']); ok = m.ok; v = m.v; }
      else if (k === 'backup') { var b = backupReady(); ok = b.ok; v = b.v; }
      else if (k === 'rollback') { ok = !!(r.rollback && r.rollback.to && str(T(r.rollback.plan))); v = r.rollback && r.rollback.to ? L('Ke ' + r.rollback.to, 'To ' + r.rollback.to) : L('Tidak ada versi rollback', 'No rollback version'); }
      else if (k === 'approver' || k === 'approval') {
        var perm = env === 'PRD' ? 'imp.release.approve.prod' : 'imp.release.approve';
        ok = !!(openReq && openReq.appr) || !!(o.approver && can(o.approver, perm)); v = openReq && openReq.appr ? L(empName(openReq.appr)) : (o.approver && can(o.approver, perm) ? L(ctxName(o.approver)) : L('Menunggu persetujuan', 'Waiting for approval'));
      }
      list.push({ k: k, n: g[1], ok: ok, v: v });
    });
    var failed = list.filter(function (g) { return !g.ok; }).map(function (g) { return g.k; });
    return { ok: !failed.length, env: env, rls: r.id, v: r.v, list: list, failed: failed };
  };
  function promoView(p) { var s = M.PROMO_ST[p.st]; var r = rlsRec(p.rls); return Object.assign(clone(p), { v: r ? r.v : null, stN: s[0], tone: s[1], byN: empName(p.by), apprN: p.appr ? empName(p.appr) : null, depN: p.dep ? empName(p.dep) : null }); }
  M.promotions = function (ctx, f) { if (!can(ctx, 'imp.view')) return []; f = f || {}; return S().promos.filter(function (p) { return (!f.st || p.st === f.st) && (!f.rls || p.rls === f.rls) && (!f.env || p.to === f.env); }).map(promoView); };
  M.promotion = function (ctx, id) { if (!can(ctx, 'imp.view')) return null; var p = by(S().promos, 'id', id); if (!p) return null; return Object.assign(promoView(p), { gates: M.gates(ctx, p.rls, p.to) }); };
  // requestPromotion(ctx, rls, env, reason): implead / qalead / sysadmin. The pre-approval gates must already pass.
  M.requestPromotion = function (ctx, id, env, reason) {
    if (!can(ctx, 'imp.release.request')) return deny(ctx, 'imp.release.request', id);
    var r = rlsRec(id); if (!r) return bad('notfound');
    if (D.ENV_FLOW.indexOf(env) < 1) return bad('invalid');
    if (nextEnv(r) !== env) return bad('jump');
    var r0 = needReason(reason); if (r0) return r0;
    if (S().promos.some(function (p) { return p.rls === r.id && p.to === env && ['requested', 'approved', 'deployed'].indexOf(p.st) >= 0; })) return bad('dup');
    var g = M.gates(ctx, r.id, env), pre = g.list.filter(function (x) { return !x.ok && ['approval', 'approver'].indexOf(x.k) < 0 && (env !== 'PRD' || ['build', 'stable', 'rollback'].indexOf(x.k) >= 0); });
    if (pre.length) return bad('gate', null, { failed: pre.map(function (x) { return x.k; }), gates: g });
    var p = { id: nid('prm', 'PRM-'), rls: r.id, from: D.ENV_FLOW[D.ENV_FLOW.indexOf(env) - 1], to: env, by: empId(ctx), byUid: ctx.uid, at: nowS(), appr: null, apprAt: null, dep: null, depAt: null, valAt: null, res: null, st: 'requested', reason: Ln(T(reason)) };
    S().promos.unshift(p); M.audit('PROMOTION.REQUEST', ctx, { rec: p.id, after: { rls: r.v, to: env }, reason: reason }); save();
    return { ok: true, promotion: promoView(p), gates: g };
  };
  // promote(ctx, rls, env, reason): the approver step. PROD → owner (imp.release.approve.prod), QA/UAT → imp.release.approve. Maker-checker.
  M.promote = function (ctx, id, env, reason) {
    var perm = env === 'PRD' ? 'imp.release.approve.prod' : 'imp.release.approve';
    if (!can(ctx, perm)) return deny(ctx, perm, id);
    var r = rlsRec(id); if (!r) return bad('notfound');
    var p = S().promos.filter(function (x) { return x.rls === r.id && x.to === env && x.st === 'requested'; })[0];
    if (!p) return bad('jump');
    if (p.by === empId(ctx) || (p.byUid && p.byUid === ctx.uid)) { M.audit('ACCESS.DENIED', ctx, { rec: p.id, after: 'maker-checker', result: 'denied' }); return bad('maker'); }
    var r0 = needReason(reason); if (r0) return r0;
    var g = M.gates(ctx, r.id, env, { approver: ctx });
    if (!g.ok) { M.audit('BUILD_PROMOTED', ctx, { rec: p.id, after: { failed: g.failed }, reason: reason, result: 'denied' }); save(); return bad('gate', null, { failed: g.failed, gates: g }); }
    p.st = 'approved'; p.appr = empId(ctx); p.apprUid = ctx.uid; p.apprAt = nowS(); p.apprReason = Ln(T(reason));
    M.audit('BUILD_PROMOTED', ctx, { rec: p.id, before: { st: 'requested' }, after: { rls: r.v, to: env, st: 'approved' }, reason: reason }); save();
    return { ok: true, promotion: promoView(p), gates: g };
  };
  M.approvePromotion = function (ctx, promoId, reason) { var p = by(S().promos, 'id', promoId); if (!p) return bad('notfound'); return M.promote(ctx, p.rls, p.to, reason); };
  M.rejectPromotion = function (ctx, promoId, reason) {
    var p = by(S().promos, 'id', promoId); if (!p) return bad('notfound');
    var perm = p.to === 'PRD' ? 'imp.release.approve.prod' : 'imp.release.approve'; if (!can(ctx, perm)) return deny(ctx, perm, promoId);
    if (p.st !== 'requested') return bad('jump'); var r0 = needReason(reason); if (r0) return r0;
    p.st = 'rejected'; p.appr = empId(ctx); p.apprAt = nowS(); p.apprReason = Ln(T(reason));
    M.audit('PROMOTION.REJECT', ctx, { rec: p.id, before: { st: 'requested' }, after: { st: 'rejected' }, reason: reason }); save();
    return { ok: true, promotion: promoView(p) };
  };
  // deploy(ctx, promo, reason): technical execution by sysadmin / superadmin, only after approval; desktop only for production.
  M.deploy = function (ctx, promoId, reason, o) {
    if (!can(ctx, 'imp.deploy')) return deny(ctx, 'imp.deploy', promoId);
    var p = by(S().promos, 'id', promoId); if (!p) return bad('notfound');
    if (p.to === 'PRD' && isMobile(ctx, o)) return bad('device');
    if (p.st !== 'approved') return bad('jump');
    var r0 = needReason(reason); if (r0) return r0;
    var r = rlsRec(p.rls);
    if (p.to === 'PRD') { var g = M.gates(ctx, r.id, 'PRD'); if (!g.ok) return bad('gate', null, { failed: g.failed, gates: g }); }
    var e = envByK(p.to), prev = e.version;
    p.st = 'deployed'; p.dep = empId(ctx); p.depAt = nowS(); p.prevV = prev;
    e.version = r.v; e.lastDeploy = p.depAt;
    var d = { id: 'DEP-' + p.id.slice(4), promo: p.id, rls: r.id, v: r.v, env: p.to, prev: prev, at: p.depAt, by: p.dep };
    S().deploys.unshift(d);
    M.audit('DEPLOYMENT', ctx, { rec: p.id, before: { env: p.to, v: prev }, after: { env: p.to, v: r.v }, reason: reason });
    M.audit('RELEASE_DEPLOYED', ctx, { rec: r.id, before: { env: p.to, v: prev }, after: { env: p.to, v: r.v }, reason: reason }); save();
    return { ok: true, promotion: promoView(p), deploy: d };
  };
  // validate(ctx, promo, {result:'pass'|'fail', notes}): smoke test. Fail → automatic rollback to the previous version in that env.
  M.validate = function (ctx, promoId, f) {
    if (!can(ctx, 'imp.validate')) return deny(ctx, 'imp.validate', promoId);
    var p = by(S().promos, 'id', promoId); if (!p) return bad('notfound');
    if (p.st !== 'deployed') return bad('jump');
    f = f || {}; if (['pass', 'fail'].indexOf(f.result) < 0) return bad('invalid');
    if (f.result === 'fail' && !str(T(f.notes))) return bad('reason');
    var r = rlsRec(p.rls), e = envByK(p.to);
    p.valAt = nowS(); p.res = f.result; p.valBy = empId(ctx); p.notes = f.notes ? Ln(T(f.notes)) : null;
    if (f.result === 'pass') {
      p.st = 'validated';
      S().rls.forEach(function (o) { if (o !== r && o.envs[p.to] === 'live') { o.envs[p.to] = 'superseded'; if (o.st === 'live' && !D.ENV_FLOW.some(function (k) { return o.envs[k] === 'live'; })) o.st = 'superseded'; } });
      r.envs[p.to] = 'live'; if (p.to === 'PRD' || p.to === 'UAT') r.st = 'live';
      if (p.to === 'PRD') { e.health = 'healthy'; e.live = e.live || false; }
    } else {
      p.st = 'failed'; e.version = p.prevV || null;
      M.audit('DEPLOY.ROLLBACK', ctx, { rec: p.id, before: { v: r.v }, after: { v: e.version }, reason: f.notes, result: 'failed' });
    }
    M.audit('DEPLOY.VALIDATED', ctx, { rec: p.id, after: { result: f.result, env: p.to, v: r.v }, reason: f.notes || null, result: f.result === 'pass' ? 'ok' : 'failed' }); save();
    return { ok: true, promotion: promoView(p) };
  };
  // currentVersion() → {version, env}: what production runs, or (pre go-live) the UAT version.
  M.currentVersion = function () { var c = M.currentRelease(); return { version: c.v, env: c.env, planned: c.planned || null }; };
  M.currentRelease = function () { var e = envByK('PRD'); if (e && e.version) return { env: 'PRD', v: e.version }; var u = envByK('UAT'); return { env: 'UAT', v: u ? u.version : null, planned: (S().rls.filter(function (r) { return r.initial; })[0] || {}).v || null }; };

  /* ==========================================================================
     NP-03 §16–§19 module waves, integration map, blockers, data reuse
     ========================================================================== */
  function waveScreens(w) {
    var C = M.C, ids = [];
    if (!C) return { specs: 0, live: null, src: 'none', ids: [] };
    w[5].forEach(function (k) {
      if (k === 'X') { if (M.X && M.X.SCREENS) M.X.SCREENS.forEach(function (s) { ids.push(s.id); }); return; }
      (C[k] || []).forEach(function (s) { ids.push(s.id); });
    });
    ids = uniq(ids);
    var V = root.JFAPP && root.JFAPP.V, live = V ? ids.filter(function (id) { return !!V[id]; }).length : null;
    return { specs: ids.length, live: live, src: V ? 'renderer' : 'registry', ids: ids };
  }
  function waveQa(w) {
    var tcs = S().tcs.filter(function (t) { return w[10].indexOf(t.module) >= 0; });
    return tcs.length ? Math.round(tcs.filter(function (t) { return t.st === 'pass'; }).length / tcs.length * 100) : null;
  }
  function waveUat(w) {
    var G = goEng(); if (G && typeof G.uatByWave === 'function') { var u = tryf(function () { return G.uatByWave(w[0]); }, null); if (typeof u === 'number') return { v: u, src: 'JFGO' }; }
    return { v: w[8], src: 'seed' };
  }
  function waveRow(w) {
    var sc = waveScreens(w), build = sc.specs ? (sc.live == null ? 100 : Math.round(sc.live / sc.specs * 100)) : 0, bl = S().blockers.filter(function (b) { return b.wave === w[0] && b.st !== 'resolved'; });
    var sev = ['critical', 'high', 'medium', 'low'], top = bl.slice().sort(function (a, b) { return sev.indexOf(a.sev) - sev.indexOf(b.sev); })[0] || null, u = waveUat(w);
    return { k: w[0], wave: w[1], n: L(w[2], w[3]), phases: w[4], screens: { specs: sc.specs, live: sc.live, src: sc.src }, build: build, qa: waveQa(w), integ: w[7], uat: u.v, uatSrc: u.src, owner: w[6], ownerN: empName(w[6]),
      blockers: bl.map(function (b) { return b.id; }), blocker: top ? { id: top.id, t: top.t, sev: top.sev } : null, release: w[9], suites: w[10] };
  }
  function buildPct() { var rows = D.WAVES.map(waveRow); return Math.round(rows.reduce(function (s, r) { return s + r.build; }, 0) / rows.length); }
  M.modules = function (ctx) { if (!can(ctx, 'imp.view')) return []; return D.WAVES.map(waveRow); };
  M.module = function (ctx, k) {
    if (!can(ctx, 'imp.view')) return null; var w = D.WAVES.filter(function (x) { return x[0] === k; })[0]; if (!w) return null;
    var row = waveRow(w); row.screenIds = waveScreens(w).ids; row.tests = S().tcs.filter(function (t) { return w[10].indexOf(t.module) >= 0; }).map(tcView);
    row.suiteRuns = w[10].map(function (s) { return S().suites[s]; }).filter(Boolean); return row;
  };

  // §18: each connection's status is computed from the real records; open blockers on a connection mark it testing / issue.
  function linkStatus(from, to) {
    var CM = M.CM, LG = M.LG, PR = M.PR, DL = M.DL, FN = M.FN, ok = 0, total = 0, ev = null, ids = [];
    var orders = LG ? LG.state().orders : [];
    if (from === 'client') { orders.forEach(function (o) { total++; if (CM.client(o.cl) && CM.prop(o.prop)) ok++; }); ev = L(ok + '/' + total + ' order merujuk klien & properti master', ok + '/' + total + ' orders reference the client & property master'); }
    else if (from === 'order') { var po = orders.filter(function (o) { return o.kind === 'pickup' && ['assigned', 'ready', 'ontheway', 'arrived', 'inprogress', 'completed', 'atplant', 'received'].indexOf(o.st) >= 0; }); total = po.length; ok = po.filter(function (o) { return o.trip && LG.trip(o.trip); }).length; ev = L(ok + '/' + total + ' pickup ter-assign punya trip driver', ok + '/' + total + ' assigned pickups have a driver trip'); }
    else if (from === 'pickup') { var rv = PR ? PR.state().rcv.filter(function (r) { return r.ord; }) : []; total = rv.length; ok = rv.filter(function (r) { return LG.order(r.ord); }).length; ids = rv.map(function (r) { return r.id; }); ev = L(ok + '/' + total + ' receiving merujuk order pickup', ok + '/' + total + ' receivings reference a pickup order'); }
    else if (from === 'production') { var rel = DL ? DL.state().rel : []; total = rel.length; ok = rel.filter(function (r) { return /^B-/.test(r.batch); }).length; ev = L(ok + '/' + total + ' release logistik merujuk batch produksi', ok + '/' + total + ' logistics releases reference a production batch'); }
    else if (from === 'delivery') { var dl = DL ? DL.state().dlv.filter(function (d) { return d.bill && d.bill.st === 'sent'; }) : []; total = dl.length; ok = dl.filter(function (d) { return FN && FN.state().br.some(function (b) { return b.dlv === d.id; }); }).length; ids = dl.map(function (d) { return d.id; }); ev = L(ok + '/' + total + ' billing terkirim sampai di Billing Ready Finance', ok + '/' + total + ' sent billings reached Finance Billing Ready'); }
    else if (from === 'billing') { var br = FN ? FN.state().br : []; total = br.length; ok = br.filter(function (b) { return !!b.jv; }).length; ev = L(ok + '/' + total + ' Billing Ready terjurnal (accrual)', ok + '/' + total + ' Billing Ready journalled (accrual)'); }
    else if (from === 'finance') { var k = tryf(function () { return M.P && M.P.state ? M.P.state().kpis.length : 0; }, 0), fh = tryf(function () { return FN.health ? 1 : 0; }, 0); total = 2; ok = (k ? 1 : 0) + (FN && (FN.health || FN.aging) ? 1 : 0); ev = L('KPI JFPERF ' + k + ' · ringkasan finance ' + (ok > 1 || fh ? 'tersedia' : '—'), 'JFPERF KPIs ' + k + ' · finance summary ' + (ok > 1 || fh ? 'available' : '—')); }
    return { ok: ok, total: total, ev: ev, ids: ids };
  }
  M.LINK_ST = { connected: [L('Terhubung', 'Connected'), 'ok'], testing: [L('Pengujian', 'Testing'), 'info'], issue: [L('Masalah', 'Issue'), 'warn'], blocked: [L('Terblokir', 'Blocked'), 'crit'] };
  M.integrationMap = function (ctx) {
    if (!can(ctx, 'imp.view')) return null;
    var nodes = D.FLOW.map(function (f) { return { k: f[0], n: L(f[1], f[2]) }; }), links = [];
    for (var i = 0; i < D.FLOW.length - 1; i++) {
      var a = D.FLOW[i][0], b = D.FLOW[i + 1][0], s = tryf(function () { return linkStatus(a, b); }, { ok: 0, total: 0, ev: M.MSG.load, ids: [] });
      var bl = S().blockers.filter(function (x) { return x.link === a + '>' + b && x.st !== 'resolved'; });
      var stt = !s.total ? 'testing' : s.ok === s.total ? 'connected' : s.ok === 0 ? 'blocked' : 'issue';
      if (bl.length) stt = bl.some(function (x) { return x.sev === 'critical'; }) ? 'blocked' : bl.some(function (x) { return x.sev === 'high'; }) ? 'issue' : (stt === 'connected' ? 'testing' : stt);
      links.push({ from: a, to: b, st: stt, stN: M.LINK_ST[stt][0], tone: M.LINK_ST[stt][1], ok: s.ok, total: s.total, evidence: s.ev, ids: s.ids, blockers: bl.map(function (x) { return x.id; }) });
    }
    var conn = links.filter(function (l) { return l.st === 'connected'; }).length;
    return { nodes: nodes, links: links, connected: conn, total: links.length, pct: Math.round(conn / links.length * 100) };
  };

  M.SEV = { critical: [L('Kritis', 'Critical'), 'crit'], high: [L('Tinggi', 'High'), 'warn'], medium: [L('Sedang', 'Medium'), 'info'], low: [L('Rendah', 'Low'), 'mute'] };
  M.BLK_ST = { open: [L('Terbuka', 'Open'), 'warn'], progress: [L('Dikerjakan', 'In progress'), 'info'], resolved: [L('Selesai', 'Resolved'), 'ok'] };
  function blkView(b) { return Object.assign(clone(b), { sevN: M.SEV[b.sev][0], tone: M.SEV[b.sev][1], stN: M.BLK_ST[b.st][0], ownerN: empName(b.owner), overdue: b.st !== 'resolved' && b.due < M.today(), waveN: (by(D.WAVES.map(function (w) { return { k: w[0], n: L(w[2], w[3]) }; }), 'k', b.wave) || {}).n || null }); }
  M.blockers = function (ctx, f) { if (!can(ctx, 'imp.view')) return []; f = f || {}; return S().blockers.filter(function (b) { return (!f.st || (f.st === 'open' ? b.st !== 'resolved' : b.st === f.st)) && (!f.wave || b.wave === f.wave) && (!f.sev || b.sev === f.sev); }).map(blkView); };
  M.blocker = function (ctx, id) { if (!can(ctx, 'imp.view')) return null; var b = by(S().blockers, 'id', id); if (!b) return null; var v = blkView(b); v.bugRec = b.bug ? bugView(by(S().bugs, 'id', b.bug) || { id: b.bug }) : null; return v; };
  M.addBlocker = function (ctx, f) {
    if (!can(ctx, 'imp.blocker.manage')) return deny(ctx, 'imp.blocker.manage', 'BLK');
    f = f || {}; var t = str(T(f.t)); if (t.length < 5 || !M.SEV[f.sev] || !by(D.WAVES.map(function (w) { return { k: w[0] }; }), 'k', f.wave) || !/^\d{4}-\d{2}-\d{2}$/.test(f.due || '')) return bad('invalid');
    if (f.bug && !by(S().bugs, 'id', f.bug)) return bad('notfound');
    var b = { id: nid('blk', 'BLK-'), t: Ln(f.t), wave: f.wave, sev: f.sev, owner: f.owner || empId(ctx), due: f.due, st: 'open', bug: f.bug || null, link: f.link || null, at: nowS(), by: empId(ctx), log: [] };
    S().blockers.unshift(b); M.audit('BLOCKER.CREATE', ctx, { rec: b.id, after: { t: t, sev: b.sev, wave: b.wave } }); save();
    return { ok: true, blocker: blkView(b) };
  };
  M.updateBlocker = function (ctx, id, patch, reason) {
    if (!can(ctx, 'imp.blocker.manage')) return deny(ctx, 'imp.blocker.manage', id);
    var b = by(S().blockers, 'id', id); if (!b) return bad('notfound');
    var r0 = needReason(reason); if (r0) return r0; patch = patch || {};
    if (patch.st && !M.BLK_ST[patch.st]) return bad('invalid'); if (patch.sev && !M.SEV[patch.sev]) return bad('invalid');
    var before = {}, after = {}; ['st', 'sev', 'owner', 'due'].forEach(function (k) { if (patch[k] != null && patch[k] !== b[k]) { before[k] = b[k]; b[k] = patch[k]; after[k] = b[k]; } });
    if (!Object.keys(after).length) return bad('invalid');
    b.log.push({ at: nowS(), by: empId(ctx), before: before, after: after, reason: Ln(T(reason)) });
    M.audit('BLOCKER.CHANGE', ctx, { rec: b.id, before: before, after: after, reason: reason }); save();
    return { ok: true, blocker: blkView(b) };
  };

  // §19 data reuse: one REAL receiving weight traced into production, capacity, HPP, billing and KPI without re-entry.
  M.dataReuse = function (ctx, rcvId) {
    if (!can(ctx, 'imp.view')) return null;
    var PR = M.PR, DL = M.DL, FN = M.FN; if (!PR) return null;
    function trace(r) {
      var net = r.weigh ? r.weigh.net : null, steps = [];
      var bs = PR.state().batches.filter(function (b) { return (b.rcvs || []).indexOf(r.id) >= 0; });
      steps.push({ k: 'receiving', n: L('Receiving · berat aktual', 'Receiving · actual weight'), found: net != null, id: r.id, v: net != null ? net + ' kg' : null, src: 'JFPROD', how: L('Ditimbang sekali oleh Tim 1 (' + (r.weigh && r.weigh.scale || '—') + ')', 'Weighed once by Team 1 (' + (r.weigh && r.weigh.scale || '—') + ')') });
      steps.push({ k: 'production', n: L('Volume produksi (batch)', 'Production volume (batch)'), found: bs.length > 0, id: bs.map(function (b) { return b.id; }).join(', ') || null, v: bs.length ? Math.round(bs.reduce(function (s, b) { return s + (b.kg || 0); }, 0) * 10) / 10 + ' kg' : null, src: 'JFPROD', how: L('Batch dibuat dari lot hasil sorting receiving ini', 'Batches built from this receiving\'s sorted lots') });
      var cap = tryf(function () { return PR.capacity(); }, null);
      steps.push({ k: 'capacity', n: L('Kapasitas mesin', 'Machine capacity'), found: !!(cap && bs.length), id: bs.length ? bs.map(function (b) { return b.mach || (b.runs[0] || {}).mach; }).filter(Boolean).join(', ') || null : null, v: bs.length ? bs.map(function (b) { return b.kg + ' kg'; }).join(' + ') : null, src: 'JFPROD', how: L('Validasi overload memakai kg batch yang sama', 'The overload check uses the same batch kg') });
      var hpp = tryf(function () { return FN.state().hpp.filter(function (h) { return h.st === 'current'; }).slice(-1)[0]; }, null), perKg = hpp && hpp.vol ? Object.keys(hpp.comp).reduce(function (s, k) { return s + hpp.comp[k]; }, 0) / hpp.vol : null;
      steps.push({ k: 'hpp', n: L('HPP', 'HPP'), found: !!(perKg && net != null), id: hpp ? 'HPP ' + hpp.p + ' v' + hpp.v : null, v: perKg && net != null ? 'Rp ' + Math.round(perKg).toLocaleString('id-ID') + '/kg × ' + net + ' kg = Rp ' + Math.round(perKg * net).toLocaleString('id-ID') : null, src: 'JFFIN', how: L('HPP/kg × berat aktual, tanpa input ulang', 'HPP/kg × actual weight, no re-entry') });
      var dlvs = DL ? DL.state().dlv.filter(function (d) { return bs.some(function (b) { return d.batch === b.id; }); }) : [];
      var ordD = bs.map(function (b) { return b.dlv; }).filter(Boolean);
      var brs = FN ? FN.state().br.filter(function (b) { return dlvs.some(function (d) { return d.id === b.dlv; }); }) : [];
      steps.push({ k: 'billing', n: L('Billing (bila berlaku)', 'Billing (where applicable)'), found: brs.length > 0 || dlvs.length > 0 || ordD.length > 0, id: brs.map(function (b) { return b.id; }).concat(dlvs.map(function (d) { return d.id; })).concat(ordD).join(', ') || null, v: brs.length ? brs.map(function (b) { return b.qty + ' ' + b.unit; }).join(', ') : (dlvs.length ? dlvs.map(function (d) { return d.kg + ' kg'; }).join(', ') : null), src: 'JFDLV/JFFIN', how: L('Billing memakai kg delivery dari batch yang sama', 'Billing uses the delivery kg from the same batch') });
      var kpi = tryf(function () { return PR.kpi(); }, null);
      steps.push({ k: 'kpi', n: L('KPI produksi', 'Production KPI'), found: !!kpi, id: 'PROD-KPI', v: kpi && kpi.kg != null ? kpi.kg + ' kg dicuci hari ini' : null, src: 'JFPROD', how: L('KPI menjumlah kg batch, bukan input terpisah', 'The KPI sums batch kg, not a separate input') });
      return { rcv: r.id, cl: r.cl, prop: r.prop, net: net, steps: steps, found: steps.filter(function (s) { return s.found; }).length, reentry: 0 };
    }
    var list = PR.state().rcv.filter(function (r) { return r.weigh && r.weigh.net != null; });
    if (rcvId) { var one = by(list, 'id', rcvId); return one ? trace(one) : null; }
    var best = null; list.forEach(function (r) { var t = trace(r); if (!best || t.found > best.found) best = t; });
    return best;
  };

  /* ==========================================================================
     NP-02 §12–§15 One Data: domains, duplicates, orphans, data health
     ========================================================================== */
  function rows(domain) {
    var CM = M.CM, FN = M.FN, X = M.X, out = [];
    var fin = FN ? FN.state() : null, cm = CM ? CM.state() : null;
    if (domain === 'client' && cm) cm.clients.forEach(function (c) { out.push({ id: c.id, n: c.n, legal: c.legal, tax: c.tax, addr: c.addr, email: null, phone: null }); });
    else if (domain === 'property' && cm) cm.props.forEach(function (p) { out.push({ id: p.id, n: p.n, addr: p.addr, parent: p.cl }); });
    else if (domain === 'contact' && cm) cm.contacts.forEach(function (c) { out.push({ id: c.id, n: c.n, email: c.email, phone: c.phone, parent: c.cl }); });
    else if (domain === 'item' && fin) fin.items.forEach(function (i) { out.push({ id: i.code, code: i.code, n: T(i.n), en: i.n[1] }); });
    else if (domain === 'supplier' && fin) fin.sups.forEach(function (s) { out.push({ id: s.id, n: s.n, phone: s.phone, city: s.city }); });
    else if (domain === 'employee' && X) X.EMPLOYEES.forEach(function (e) { out.push({ id: e.id, n: e.n }); });
    else if (domain === 'user' && X) X.USERS.forEach(function (u) { out.push({ id: u.id, n: u.u, email: u.email }); });
    return out;
  }
  M.DUP_DOMAINS = [['client', L('Klien', 'Client'), 'JFCOMM'], ['property', L('Properti', 'Property'), 'JFCOMM'], ['contact', L('Kontak', 'Contact'), 'JFCOMM'], ['item', L('Item', 'Item'), 'JFFIN'], ['supplier', L('Supplier', 'Supplier'), 'JFFIN'], ['employee', L('Karyawan', 'Employee'), 'JFACCESS'], ['user', L('User', 'User'), 'JFACCESS']];
  var STOP = ['pt', 'cv', 'tbk', 'ud', 'bpk', 'ibu', 'bapak', 'pak', 'the', 'dan', 'and', 'jl', 'jalan', 'no'];
  function normName(s) { return String(s || '').toLowerCase().replace(/[^a-z0-9 ]+/g, ' ').split(/\s+/).filter(function (w) { return w && STOP.indexOf(w) < 0; }).join(' '); }
  M.normName = normName;
  function normPhone(s) { var d = String(s || '').replace(/\D+/g, ''); return d.length >= 8 ? d.slice(-9) : ''; }
  function normTax(s) { var d = String(s || '').replace(/\D+/g, ''); return d.length >= 10 ? d : ''; }
  function jacc(a, b) { var A = a.split(' ').filter(Boolean), B = b.split(' ').filter(Boolean); if (!A.length || !B.length) return 0; var i = A.filter(function (w) { return B.indexOf(w) >= 0; }).length; return i / (A.length + B.length - i); }
  function compare(a, b, domain) {
    var m = [], s = 0, na = normName(a.n), nb = normName(b.n);
    if (na && na === nb) { m.push('name'); s += 45; } else if (na && nb && jacc(na, nb) >= 0.6) { m.push('normalized'); s += 25; }
    if (a.email && b.email && String(a.email).toLowerCase() === String(b.email).toLowerCase()) { m.push('email'); s += 35; }
    var pa = normPhone(a.phone), pb = normPhone(b.phone); if (pa && pa === pb) { m.push('phone'); s += 30; }
    var ta = normTax(a.tax), tb = normTax(b.tax); if (ta && ta === tb) { m.push('tax'); s += 45; }
    var aa = normName(a.addr), ab = normName(b.addr); if (aa && aa === ab && aa.split(' ').length >= 3) { m.push('address'); s += 15; }
    if (a.code && b.code && a.code === b.code) { m.push('code'); s += 50; }
    // Contacts / properties of the same client legitimately share phone/address; only flag them with a name signal.
    if ((domain === 'contact' || domain === 'property') && a.parent && a.parent === b.parent && m.indexOf('name') < 0 && m.indexOf('normalized') < 0) s = Math.min(s, 30);
    return { score: Math.min(100, s), matched: m };
  }
  function stagingRows(domain) { var G = goEng(); if (!G || typeof G.stagingRows !== 'function') return []; return tryf(function () { return G.stagingRows(domain) || []; }, []).map(function (r) { return Object.assign({ staged: true }, r); }); }
  function dupCands(domain) {
    var real = rows(domain), stg = stagingRows(domain), out = [];
    function add(a, b) {
      var c = compare(a, b, domain); if (c.score < 50) return;
      var ids = [a.id, b.id].sort(), id = 'DUP-' + domain.toUpperCase().slice(0, 3) + '-' + hash(domain + ids.join('|')).toString(36).toUpperCase().slice(0, 6);
      var dec = S().dupDec[id] || null;
      out.push({ id: id, domain: domain, a: { id: a.id, n: a.n, staged: !!a.staged }, b: { id: b.id, n: b.n, staged: !!b.staged }, score: c.score, matched: c.matched, src: a.staged || b.staged ? 'migration' : 'live', st: dec ? dec.st : 'open', dec: dec ? clone(dec) : null });
    }
    for (var i = 0; i < real.length; i++) for (var j = i + 1; j < real.length; j++) add(real[i], real[j]);
    stg.forEach(function (s) { real.forEach(function (r) { add(s, r); }); });
    for (var a = 0; a < stg.length; a++) for (var b = a + 1; b < stg.length; b++) add(stg[a], stg[b]);
    return out.sort(function (x, y) { return y.score - x.score; });
  }
  M.duplicates = function (ctx, f) {
    if (!can(ctx, 'imp.data.view')) return [];
    f = f || {}; var out = [];
    M.DUP_DOMAINS.forEach(function (d) { if (!f.domain || f.domain === d[0]) out = out.concat(dupCands(d[0])); });
    return out.filter(function (c) { return (!f.st || c.st === f.st) && (!f.src || c.src === f.src); });
  };
  M.duplicate = function (ctx, id) { if (!can(ctx, 'imp.data.view')) return null; return by(M.duplicates(ctx), 'id', id); };
  // reviewDuplicate(ctx, dup, 'not_duplicate'|'merge_requested', note): never merges anything (§14).
  M.reviewDuplicate = function (ctx, id, decision, note) {
    if (!can(ctx, 'imp.data.review')) return deny(ctx, 'imp.data.review', id);
    var c = by(M.duplicates(ctx), 'id', id); if (!c) return bad('notfound');
    if (['not_duplicate', 'merge_requested'].indexOf(decision) < 0) return bad('invalid');
    var r0 = needReason(note); if (r0) return r0;
    if (c.dec && c.dec.st === 'merge_approved') return bad('locked');
    var before = c.st, dec = { st: decision, by: empId(ctx), byUid: ctx.uid, at: nowS(), note: Ln(T(note)), domain: c.domain, a: c.a.id, b: c.b.id, approvals: [] };
    S().dupDec[id] = dec;
    M.audit('DUP.REVIEW', ctx, { module: 'onedata', rec: id, before: before, after: decision, reason: note }); save();
    return { ok: true, candidate: by(M.duplicates(ctx), 'id', id), mutated: false };
  };
  function domainOwners(domain) { var map = { contact: 'client' }; var d = D.DOMAINS.filter(function (x) { return x[0] === (map[domain] || domain); })[0]; return d ? d[5] : []; }
  M.domainOwners = domainOwners;
  // approveMerge(ctx, dup, reason): the domain owner (or the owner) approves the merge REQUEST. It only records the decision.
  M.approveMerge = function (ctx, id, reason) {
    var c = by(M.duplicates({ perms: ['imp.data.view'] }), 'id', id); if (!c) return bad('notfound');
    var owners = domainOwners(c.domain);
    if (!ctx || !(owners.indexOf(ctx.roleKey) >= 0 || ctx.roleKey === 'owner')) return deny(ctx, 'domain-owner:' + c.domain, id);
    var dec = S().dupDec[id]; if (!dec || dec.st !== 'merge_requested') return bad('jump');
    if (dec.by === empId(ctx) || dec.byUid === ctx.uid) return bad('maker');
    var r0 = needReason(reason); if (r0) return r0;
    dec.st = 'merge_approved'; dec.approvals.push({ by: empId(ctx), role: ctx.roleKey, at: nowS(), reason: Ln(T(reason)) });
    M.audit('DUP.MERGE_APPROVED', ctx, { module: 'onedata', rec: id, before: 'merge_requested', after: 'merge_approved', reason: reason }); save();
    return { ok: true, candidate: by(M.duplicates({ perms: ['imp.data.view'] }), 'id', id), mutated: false, note: L('Keputusan tercatat; perubahan master dilakukan pemilik data di modulnya.', 'Decision recorded; the master is changed by its owner in its own module.') };
  };

  // §15 orphan check over REAL data. If the seed is clean, the count is 0 (never faked).
  M.orphanChecks = function () {
    var CM = M.CM, LG = M.LG, PR = M.PR, DL = M.DL, FN = M.FN, X = M.X, out = [];
    function chk(k, id, en, src, list) { out.push({ k: k, n: L(id, en), src: src, count: list.length, ids: list.slice(0, 20) }); }
    var lg = LG ? LG.state().orders : [], cm = CM ? CM.state() : { props: [], contacts: [] }, fin = FN ? FN.state() : { inv: [], pays: [], moves: [], stock: [], br: [] };
    chk('order_client', 'Order tanpa klien', 'Order without client', 'JFLOG', lg.filter(function (o) { return !CM.client(o.cl); }).map(function (o) { return o.id; }));
    chk('order_property', 'Order tanpa properti', 'Order without property', 'JFLOG', lg.filter(function (o) { return !CM.prop(o.prop); }).map(function (o) { return o.id; }));
    chk('property_client', 'Properti tanpa klien', 'Property without client', 'JFCOMM', cm.props.filter(function (p) { return !CM.client(p.cl); }).map(function (p) { return p.id; }));
    chk('contact_client', 'Kontak tanpa klien', 'Contact without client', 'JFCOMM', cm.contacts.filter(function (c) { return !CM.client(c.cl); }).map(function (c) { return c.id; }));
    // Migrated / manual invoices carry their own source (migration, manual with reason); others must reference Billing Ready.
    chk('invoice_source', 'Invoice tanpa sumber billing', 'Invoice without billing source', 'JFFIN', fin.inv.filter(function (iv) { return !iv.mig && !iv.manual && !iv.lines.some(function (l) { return l.br && FN.brRec(l.br); }); }).map(function (iv) { return iv.id; }));
    chk('payment_invoice', 'Pembayaran tanpa invoice', 'Payment without invoice', 'JFFIN', fin.pays.filter(function (p) { return !FN.invoice(p.inv); }).map(function (p) { return p.id; }));
    chk('batch_receiving', 'Batch produksi tanpa receiving', 'Production batch without receiving', 'JFPROD', PR ? PR.state().batches.filter(function (b) { return !b.parent && !(b.rcvs || []).some(function (r) { return PR.rcv(r); }); }).map(function (b) { return b.id; }) : []);
    chk('receiving_order', 'Receiving merujuk order yang tidak ada', 'Receiving referencing a missing order', 'JFPROD', PR ? PR.state().rcv.filter(function (r) { return r.ord && !LG.order(r.ord); }).map(function (r) { return r.id; }) : []);
    chk('move_item', 'Mutasi stok tanpa item', 'Stock movement without item', 'JFFIN', fin.moves.filter(function (m) { return !by(fin.stock, 'code', m.item); }).map(function (m) { return m.id; }));
    chk('br_client', 'Billing Ready tanpa klien', 'Billing Ready without client', 'JFFIN', fin.br.filter(function (b) { return !CM.client(b.cl); }).map(function (b) { return b.id; }));
    chk('delivery_source', 'Delivery tanpa order/batch', 'Delivery without order/batch', 'JFDLV', DL ? DL.state().dlv.filter(function (d) { return !d.ord && !d.oref && !d.batch; }).map(function (d) { return d.id; }) : []);
    chk('user_owner', 'User tanpa karyawan/klien', 'User without employee/client', 'JFACCESS', X ? X.USERS.filter(function (u) { return u.client ? !CM.client(u.client) : !X.employee(u.emp); }).map(function (u) { return u.id; }) : []);
    var G = goEng(), stg = G && typeof G.stagingOrphans === 'function' ? tryf(function () { return G.stagingOrphans() || []; }, []) : [];
    if (stg.length || (G && typeof G.stagingOrphans === 'function')) chk('staging', 'Baris migrasi dengan referensi tidak valid', 'Migration rows with invalid references', 'JFGO (staging)', stg.map(function (r) { return r.id || r; }));
    return out;
  };
  M.orphans = function (ctx) {
    if (!can(ctx, 'imp.data.view')) return null;
    var checks = M.orphanChecks(), live = checks.filter(function (c) { return c.k !== 'staging'; }), total = live.reduce(function (s, c) { return s + c.count; }, 0);
    return { checks: checks, total: total, staging: (by(checks, 'k', 'staging') || { count: 0 }).count, clean: total === 0, note: total === 0 ? L('Data owner engine bersih: 0 orphan.', 'Owner engine data is clean: 0 orphans.') : null };
  };
  function domCount(k) {
    var CM = M.CM, LG = M.LG, FN = M.FN, X = M.X;
    var f = { client: function () { return CM.state().clients.length; }, property: function () { return CM.state().props.length; }, contract: function () { return CM.state().contracts.length; }, rate: function () { return CM.state().rcs.length; },
      order: function () { return LG.state().orders.length; }, item: function () { return FN.state().items.length; }, itemweight: function () { return FN.state().wver.length; }, supplier: function () { return FN.state().sups.length; },
      inventory: function () { return FN.state().stock.length; }, employee: function () { return X.EMPLOYEES.length; }, asset: function () { return FN.state().assets.length; }, coa: function () { return (FN.COA || FN.D.COA).length; },
      user: function () { return X.USERS.length; }, payment: function () { return FN.state().pays.length; } }[k];
    return f ? tryf(f, null) : null;
  }
  var ORPH_DOM = { order_client: 'order', order_property: 'order', property_client: 'property', contact_client: 'client', invoice_source: 'payment', payment_invoice: 'payment', move_item: 'inventory', user_owner: 'user', br_client: 'client' };
  var DUP_DOM = { client: 'client', property: 'property', contact: 'client', item: 'item', supplier: 'supplier', employee: 'employee', user: 'user' };
  M.domains = function (ctx) {
    if (!can(ctx, 'imp.data.view')) return [];
    var dups = M.duplicates(ctx).filter(function (c) { return c.st !== 'not_duplicate'; }), orph = M.orphanChecks();
    return D.DOMAINS.map(function (d) {
      var nd = dups.filter(function (c) { return DUP_DOM[c.domain] === d[0]; }).length, no = orph.filter(function (o) { return ORPH_DOM[o.k] === d[0]; }).reduce(function (s, o) { return s + o.count; }, 0), cnt = domCount(d[0]);
      var score = cnt == null ? 0 : Math.max(0, 100 - nd * 5 - no * 10);
      return { k: d[0], n: L(d[1], d[2]), owner: L(d[3], d[4]), ownerRoles: d[5], src: d[6], key: d[7], consumers: d[8], count: cnt, dups: nd, orphans: no, missingOwner: !d[5].length, health: score, tone: score >= 90 ? 'ok' : score >= 70 ? 'warn' : 'crit' };
    });
  };
  M.domain = function (ctx, k) {
    if (!can(ctx, 'imp.data.view')) return null; var d = by(M.domains(ctx), 'k', k); if (!d) return null;
    d.duplicates = M.duplicates(ctx).filter(function (c) { return DUP_DOM[c.domain] === k; }); d.orphanChecks = M.orphanChecks().filter(function (o) { return ORPH_DOM[o.k] === k; });
    d.sample = rows(k === 'client' ? 'client' : k).slice(0, 8).map(function (r) { return { id: r.id, n: r.n }; }); return d;
  };
  M.dataHealth = function (ctx) {
    if (!can(ctx, 'imp.data.view')) return null;
    var ds = M.domains(ctx), o = M.orphans(ctx), dup = M.duplicates(ctx);
    return { score: Math.round(ds.reduce(function (s, d) { return s + d.health; }, 0) / ds.length), domains: ds.length, records: ds.reduce(function (s, d) { return s + (d.count || 0); }, 0),
      dupOpen: dup.filter(function (c) { return c.st === 'open'; }).length, dupTotal: dup.length, orphans: o.total, missingOwner: ds.filter(function (d) { return d.missingOwner; }).length, staging: o.staging,
      byType: { dupClient: dup.filter(function (c) { return c.domain === 'client'; }).length, dupProperty: dup.filter(function (c) { return c.domain === 'property'; }).length, dupItem: dup.filter(function (c) { return c.domain === 'item'; }).length, dupSupplier: dup.filter(function (c) { return c.domain === 'supplier'; }).length } };
  };

  /* ==========================================================================
     NP-04 §20–§24 test cases, bugs, regression, golden E2E, business rules
     ========================================================================== */
  M.TC_ST = { pass: [L('Lulus', 'Pass'), 'ok'], fail: [L('Gagal', 'Fail'), 'crit'], blocked: [L('Terblokir', 'Blocked'), 'warn'], retest: [L('Retest', 'Retest'), 'info'] };
  M.BUG_ST = { open: [L('Terbuka', 'Open'), 'crit'], fixing: [L('Diperbaiki', 'Fixing'), 'warn'], fixed: [L('Sudah diperbaiki', 'Fixed'), 'info'], retest: [L('Retest', 'Retest'), 'info'], closed: [L('Ditutup', 'Closed'), 'ok'] };
  M.BUG_FLOW = { open: ['fixing', 'closed'], fixing: ['fixed'], fixed: ['retest', 'closed'], retest: ['closed', 'fixing'], closed: [] };
  M.MODULE_N = { access: L('Akses & App Shell', 'Access & App Shell'), comm: L('Komersial', 'Commercial'), logi: L('Logistik', 'Logistics'), prod: L('Produksi', 'Production'), dlv: L('Delivery & Completion', 'Delivery & Completion'), fin: L('Finance', 'Finance'), perf: L('Kinerja & KPI', 'Performance & KPI'), clp: L('Portal Klien', 'Client Portal'), sys: L('System Admin', 'System Admin'), imp: L('Implementasi', 'Implementation') };
  function tcView(t) { var s = M.TC_ST[t.st]; return Object.assign(clone(t), { stN: s[0], tone: s[1], sevN: M.SEV[t.sev][0], moduleN: M.MODULE_N[t.module] || L(t.module), testerN: empName(t.tester), wave: D.MOD_WAVE[t.module] || null, bugs: S().bugs.filter(function (b) { return b.tc === t.id; }).map(function (b) { return b.id; }) }); }
  function bugView(b) { var s = M.BUG_ST[b.st] || M.BUG_ST.open; return Object.assign(clone(b), { stN: s[0], tone: s[1], sevN: (M.SEV[b.sev] || M.SEV.low)[0], ownerN: empName(b.owner), next: (M.BUG_FLOW[b.st] || []).slice() }); }
  M.testCases = function (ctx, f) { if (!can(ctx, 'imp.qa.view')) return []; f = f || {}; var q = str(f.q).toLowerCase(); return S().tcs.filter(function (t) { return (!f.st || t.st === f.st) && (!f.module || t.module === f.module) && (!f.sev || t.sev === f.sev) && (!q || (t.id + ' ' + T(t.scen) + ' ' + t.scen[1]).toLowerCase().indexOf(q) >= 0); }).map(tcView); };
  M.testCase = function (ctx, id) { if (!can(ctx, 'imp.qa.view')) return null; var t = by(S().tcs, 'id', id); if (!t) return null; var v = tcView(t); v.bugRecs = S().bugs.filter(function (b) { return b.tc === id; }).map(bugView); return v; };
  M.addTestCase = function (ctx, f) {
    if (!can(ctx, 'imp.qa.manage')) return deny(ctx, 'imp.qa.manage', 'TC');
    f = f || {}; if (!M.MODULE_N[f.module] || str(T(f.scen)).length < 5 || !str(T(f.exp)) || !M.SEV[f.sev || 'medium']) return bad('invalid');
    var t = { id: nid('tc', 'TC-'), module: f.module, scen: Ln(f.scen), build: f.build || (envByK('QA') || {}).version, pre: Ln(f.pre || '—'), steps: (f.steps || []).map(Ln), exp: Ln(f.exp), act: null, sev: f.sev || 'medium', st: 'retest', tester: empId(ctx), evidence: [], retest: 0, at: nowS(), hist: [] };
    S().tcs.push(t); M.audit('TC.CREATE', ctx, { module: 'qa', rec: t.id, after: { module: t.module } }); save();
    return { ok: true, tc: tcView(t) };
  };
  // result(ctx, tc, {status, actual, evidence, build}): fail needs the actual result; a re-run of a failed case counts as a retest.
  M.result = function (ctx, id, f) {
    if (!can(ctx, 'imp.qa.manage')) return deny(ctx, 'imp.qa.manage', id);
    var t = by(S().tcs, 'id', id); if (!t) return bad('notfound');
    f = f || {}; if (!M.TC_ST[f.status]) return bad('invalid');
    if ((f.status === 'fail' || f.status === 'blocked') && !str(T(f.actual))) return bad('reason');
    if (f.build && !S().rls.some(function (r) { return r.v === f.build; })) return bad('invalid');
    var before = { st: t.st, build: t.build };
    if (['fail', 'blocked', 'retest'].indexOf(t.st) >= 0 && t.st !== f.status) t.retest++;
    t.hist.push({ at: nowS(), by: empId(ctx), st: t.st, act: t.act, build: t.build });
    t.st = f.status; t.act = f.actual ? Ln(f.actual) : (f.status === 'pass' ? clone(t.exp) : t.act); t.tester = empId(ctx); t.at = nowS(); if (f.build) t.build = f.build;
    [].concat(f.evidence || []).forEach(function (e) { if (str(e)) t.evidence.push(str(e)); });
    M.audit('TC.RESULT', ctx, { module: 'qa', rec: t.id, before: before, after: { st: t.st, build: t.build }, reason: f.actual || null, result: t.st === 'pass' ? 'ok' : 'failed' }); save();
    return { ok: true, tc: tcView(t) };
  };
  M.bugs = function (ctx, f) { if (!can(ctx, 'imp.qa.view')) return []; f = f || {}; return S().bugs.filter(function (b) { return (!f.st || (f.st === 'open' ? ['closed', 'fixed'].indexOf(b.st) < 0 : b.st === f.st)) && (!f.sev || b.sev === f.sev) && (!f.rls || b.rls === f.rls); }).map(bugView); };
  M.bug = function (ctx, id) { if (!can(ctx, 'imp.qa.view')) return null; var b = by(S().bugs, 'id', id); if (!b) return null; var v = bugView(b); v.tcRec = b.tc ? tcView(by(S().tcs, 'id', b.tc) || { id: b.tc, st: 'retest', sev: 'low', scen: L('—') }) : null; return v; };
  M.addBug = function (ctx, f) {
    if (!can(ctx, 'imp.qa.manage')) return deny(ctx, 'imp.qa.manage', 'BUG');
    f = f || {}; if (str(T(f.t)).length < 5 || !M.SEV[f.sev]) return bad('invalid'); if (f.tc && !by(S().tcs, 'id', f.tc)) return bad('notfound');
    var b = { id: nid('bug', 'BUG-'), t: Ln(f.t), sev: f.sev, tc: f.tc || null, st: 'open', owner: f.owner || 'EMP-121', at: M.today(), rls: f.rls || (envByK('QA') || {}).version, log: [] };
    S().bugs.unshift(b); M.audit('BUG.CREATE', ctx, { module: 'qa', rec: b.id, after: { sev: b.sev, tc: b.tc } }); save();
    return { ok: true, bug: bugView(b) };
  };
  M.setBugStatus = function (ctx, id, to, note) {
    if (!can(ctx, 'imp.qa.manage')) return deny(ctx, 'imp.qa.manage', id);
    var b = by(S().bugs, 'id', id); if (!b) return bad('notfound');
    if ((M.BUG_FLOW[b.st] || []).indexOf(to) < 0) return bad('jump');
    var r0 = needReason(note); if (r0) return r0;
    // Closing a bug whose test case still fails is refused: retest first (§21).
    var tc = b.tc && by(S().tcs, 'id', b.tc); if (to === 'closed' && tc && tc.st !== 'pass' && b.st !== 'open') return bad('jump', L('Test case ' + tc.id + ' belum lulus retest.', 'Test case ' + tc.id + ' has not passed its retest.'));
    var before = b.st; b.st = to; b.log.push({ at: nowS(), by: empId(ctx), from: before, to: to, note: Ln(T(note)) });
    M.audit('BUG.CHANGE', ctx, { module: 'qa', rec: b.id, before: before, after: to, reason: note }); save();
    return { ok: true, bug: bugView(b) };
  };
  M.suites = function (ctx) { if (!can(ctx, 'imp.qa.view')) return []; return Object.keys(S().suites).map(function (k) { var s = S().suites[k]; return Object.assign(clone(s), { rate: s.at ? pct(s.passed, s.total) : null, ok: !!s.at && s.passed === s.total, run: !!s.at }); }); };
  M.recordSuiteRun = function (ctx, k, passed, total) {
    if (!can(ctx, 'imp.qa.manage')) return deny(ctx, 'imp.qa.manage', k);
    var s = S().suites[k]; if (!s) return bad('notfound');
    if (!(total > 0) || !(passed >= 0) || passed > total || Math.round(passed) !== passed || Math.round(total) !== total) return bad('invalid');
    var before = { passed: s.passed, total: s.total }; s.passed = passed; s.total = total; s.at = nowS();
    M.audit('SUITE.RUN', ctx, { module: 'qa', rec: k, before: before, after: { passed: passed, total: total }, result: passed === total ? 'ok' : 'failed' }); save();
    return { ok: true, suite: clone(s) };
  };
  M.qaSummary = function (ctx) {
    if (!can(ctx, 'imp.qa.view')) return null;
    var t = S().tcs, n = function (s) { return t.filter(function (x) { return x.st === s; }).length; }, sv = Object.keys(S().suites).map(function (k) { return S().suites[k]; }).filter(function (x) { return x.at; });
    var rp = sv.reduce(function (s, x) { return s + x.passed; }, 0), rt = sv.reduce(function (s, x) { return s + x.total; }, 0), ob = openBugs();
    return { total: t.length, pass: n('pass'), fail: n('fail'), blocked: n('blocked'), retest: n('retest'), passRate: pct(n('pass'), t.length), regression: { passed: rp, total: rt, rate: pct(rp, rt), suites: sv.length, at: D.SUITE_RUN },
      bugs: { open: ob.length, critical: ob.filter(function (b) { return b.sev === 'critical'; }).length, high: ob.filter(function (b) { return b.sev === 'high'; }).length, total: S().bugs.length },
      byModule: Object.keys(M.MODULE_N).map(function (m) { var x = t.filter(function (c) { return c.module === m; }); return { k: m, n: M.MODULE_N[m], total: x.length, pass: x.filter(function (c) { return c.st === 'pass'; }).length }; }).filter(function (r) { return r.total; }),
      lastE2E: S().e2e[0] || null, lastRules: S().rules[0] || null };
  };

  /* §22 golden E2E: walk a REAL record chain through the owner engines, read-only */
  M.E2E_STEPS = [['request', L('Pickup Request', 'Pickup Request')], ['assign', L('Assign Driver', 'Driver Assignment')], ['pickup', L('Pickup', 'Pickup')], ['receiving', L('Receiving', 'Receiving')], ['weight', L('Timbang', 'Weight')],
    ['sorting', L('Sorting', 'Sorting')], ['batch', L('Batch', 'Batch')], ['washing', L('Cuci', 'Washing')], ['drying', L('Kering', 'Drying')], ['finishing', L('Finishing', 'Finishing')], ['qc', L('QC', 'QC')], ['packing', L('Packing', 'Packing')],
    ['delivery', L('Delivery', 'Delivery')], ['pod', L('POD', 'POD')], ['completion', L('Service Completion', 'Service Completion')], ['billing', L('Billing Ready', 'Billing Ready')], ['invoice', L('Invoice', 'Invoice')], ['payment', L('Pembayaran', 'Payment')],
    ['journal', L('Jurnal', 'Journal')], ['dashboard', L('Dashboard KPI', 'Dashboard KPI')]];
  function walk(start) {
    var LG = M.LG, PR = M.PR, DL = M.DL, FN = M.FN, c = { order: null, rcv: null, batch: null, dlv: null, br: null, inv: null, pay: null, jv: null };
    var prs = PR ? PR.state() : { rcv: [], batches: [] }, dls = DL ? DL.state() : { dlv: [] }, fns = FN ? FN.state() : { br: [], inv: [], pays: [], jv: [] };
    if (start.kind === 'order') c.order = start.rec; else if (start.kind === 'rcv') c.rcv = start.rec; else if (start.kind === 'dlv') c.dlv = start.rec;
    if (c.order && !c.rcv) c.rcv = prs.rcv.filter(function (r) { return r.ord === c.order.id; })[0] || null;
    if (c.rcv && !c.order && c.rcv.ord) c.order = LG.order(c.rcv.ord) || null;
    if (c.rcv) c.batch = prs.batches.filter(function (b) { return !b.parent && (b.rcvs || []).indexOf(c.rcv.id) >= 0; }).sort(function (a, b) { return PR.stageIdx ? PR.stageIdx(b.stage) - PR.stageIdx(a.stage) : 0; })[0] || null;
    if (c.batch && !c.dlv) c.dlv = dls.dlv.filter(function (d) { return d.batch === c.batch.id; })[0] || (c.batch.dlv ? dls.dlv.filter(function (d) { return d.ord === c.batch.dlv; })[0] : null) || null;
    if (c.dlv && !c.batch) { c.batch = PR && c.dlv.batch ? PR.batch(c.dlv.batch) || null : null; if (c.batch && !c.rcv) c.rcv = PR.rcv((c.batch.rcvs || [])[0]) || null; }
    if (c.dlv && !c.order) { var oid = c.dlv.comp && c.dlv.comp.data && c.dlv.comp.data.ord || c.dlv.oref; c.order = oid && LG.order(oid) || (c.rcv && c.rcv.ord && LG.order(c.rcv.ord)) || null; }
    if (c.dlv) c.br = fns.br.filter(function (b) { return b.dlv === c.dlv.id; })[0] || null;
    if (c.br) c.inv = (c.br.inv && FN.invoice(c.br.inv)) || fns.inv.filter(function (iv) { return iv.lines.some(function (l) { return l.br === c.br.id; }); })[0] || null;
    if (c.inv) c.pay = fns.pays.filter(function (p) { return p.inv === c.inv.id; })[0] || null;
    c.jv = (c.pay && c.pay.jv && FN.jv(c.pay.jv)) || (c.inv && c.inv.jv && FN.jv(c.inv.jv)) || (c.br && c.br.jv && FN.jv(c.br.jv)) || null;
    var o = c.order, r = c.rcv, b = c.batch, d = c.dlv, run = function (k) { return b && (b.runs || []).filter(function (x) { return x.k === k && x.end; })[0]; };
    var packed = b && (b.pack || ['packed', 'rtd', 'ho3l', 'handed'].indexOf(b.stage) >= 0);
    var S0 = function (k, found, id, note, eng) { return { k: k, n: by(M.E2E_STEPS.map(function (s) { return { k: s[0], n: s[1] }; }), 'k', k).n, found: !!found, id: found ? id : null, note: note || null, engine: eng }; };
    var steps = [
      S0('request', o, o && o.id, o ? L('Sumber ' + o.src, 'Source ' + o.src) : null, 'JFLOG'), S0('assign', o && o.trip, o && o.trip, null, 'JFLOG'), S0('pickup', o && ['completed', 'atplant', 'received'].indexOf(o.st) >= 0, o && o.id, o ? L(o.st) : null, 'JFLOG'),
      S0('receiving', r, r && r.id, null, 'JFPROD'), S0('weight', r && r.weigh, r && r.id, r && r.weigh ? L(r.weigh.net + ' kg') : null, 'JFPROD'), S0('sorting', r && r.sort, r && r.id, null, 'JFPROD'),
      S0('batch', b, b && b.id, b ? L(b.stage) : null, 'JFPROD'), S0('washing', run('wash'), b && b.id, null, 'JFPROD'), S0('drying', run('dry'), b && b.id, null, 'JFPROD'), S0('finishing', run('fin'), b && b.id, null, 'JFPROD'),
      S0('qc', b && b.qc && b.qc.pass > 0 || (b && ['pack_q', 'packed', 'rtd', 'ho3l', 'handed'].indexOf(b.stage) >= 0), b && b.id, null, 'JFPROD'), S0('packing', packed, b && b.id, null, 'JFPROD'),
      S0('delivery', d, d && d.id, d ? L(d.st) : null, 'JFDLV'), S0('pod', d && d.pod, d && d.pod && d.pod.id, null, 'JFDLV'), S0('completion', d && d.comp, d && d.id, null, 'JFDLV'),
      S0('billing', c.br, c.br && c.br.id, c.br ? L(c.br.st) : null, 'JFFIN'), S0('invoice', c.inv, c.inv && c.inv.id, c.inv ? L(c.inv.st) : null, 'JFFIN'), S0('payment', c.pay, c.pay && c.pay.id, null, 'JFFIN'), S0('journal', c.jv, c.jv && c.jv.id, null, 'JFFIN'),
      S0('dashboard', (d || c.inv) && tryf(function () { return DL.kpi(); }, null), d ? 'DLV-KPI' : 'FIN-AR', L('KPI membaca record yang sama', 'The KPI reads the same records'), 'JFDLV/JFFIN')
    ];
    return { start: start.kind + ':' + start.rec.id, steps: steps, found: steps.filter(function (s) { return s.found; }).length, total: steps.length };
  }
  M.e2e = function (ctx) {
    if (!can(ctx, 'imp.qa.view')) return null;
    var LG = M.LG, PR = M.PR, DL = M.DL, starts = [];
    (LG ? LG.state().orders.filter(function (o) { return o.kind === 'pickup'; }) : []).forEach(function (o) { starts.push({ kind: 'order', rec: o }); });
    (PR ? PR.state().rcv : []).forEach(function (r) { starts.push({ kind: 'rcv', rec: r }); });
    (DL ? DL.state().dlv : []).forEach(function (d) { starts.push({ kind: 'dlv', rec: d }); });
    var best = null, cover = {};
    starts.forEach(function (s) { var w = tryf(function () { return walk(s); }, null); if (!w) return; w.steps.forEach(function (st0) { if (st0.found && !cover[st0.k]) cover[st0.k] = st0.id; }); if (!best || w.found > best.found) best = w; });
    var steps = best ? best.steps : [];
    return { id: 'E2E-001', chain: best, found: best ? best.found : 0, total: M.E2E_STEPS.length, pct: best ? Math.round(best.found / M.E2E_STEPS.length * 100) : 0, missing: steps.filter(function (s) { return !s.found; }).map(function (s) { return s.k; }),
      coverage: M.E2E_STEPS.map(function (s) { return { k: s[0], n: s[1], found: !!cover[s[0]], id: cover[s[0]] || null }; }), candidates: starts.length, readOnly: true };
  };
  M.runE2E = function (ctx) {
    if (!can(ctx, 'imp.qa.run')) return deny(ctx, 'imp.qa.run', 'E2E-001');
    var e = M.e2e({ perms: ['imp.qa.view'] }), run = { id: nid('e2e', 'E2E-', 3), at: nowS(), by: empId(ctx), found: e.found, total: e.total, pct: e.pct, start: e.chain ? e.chain.start : null, missing: e.missing, steps: e.chain ? e.chain.steps.map(function (s) { return { k: s.k, found: s.found, id: s.id }; }) : [] };
    S().e2e.unshift(run); M.audit('E2E.RUN', ctx, { module: 'qa', rec: run.id, after: { found: run.found, total: run.total, start: run.start }, result: run.found === run.total ? 'ok' : 'failed' }); save();
    return { ok: true, run: run, e2e: e };
  };

  // Sandbox: snapshot an owner engine's state, run a mutating probe, restore the exact state (in place + storage). Used only by business-rule tests.
  var ENGINE_KEYS = { CM: 'jfos-comm-v1', LG: 'jfos-logi-v1', PR: 'jfos-prod-v1', DL: 'jfos-dlv-v1', FN: 'jfos-fin-v1', SYS: 'jfos-sys-v1', CLP: 'jfos-clp-v1', P: 'jfos-perf-v1' };
  function sandbox(k, fn) {
    var E = M[k]; if (!E || !E.state) return { ok: false, err: 'missing' };
    var live = E.state(), snap = JSON.stringify(live), out;
    try { out = fn(); } catch (e) { out = { error: String(e && e.message || e) }; }
    finally {
      var o = JSON.parse(snap); Object.keys(live).forEach(function (x) { delete live[x]; }); Object.keys(o).forEach(function (x) { live[x] = o[x]; });
      try { if (root.localStorage && ENGINE_KEYS[k]) root.localStorage.setItem(ENGINE_KEYS[k], snap); } catch (e) {}
    }
    return { ok: true, out: out, restored: JSON.stringify(E.state()) === snap };
  }
  M._sandbox = sandbox;
  function userCtx(u) { var X = M.X; if (!X) return null; var usr = X.USERS.filter(function (x) { return x.u === u; })[0]; if (!usr) return null; var c = X.resolve(usr.id); return c && c.ok ? c : null; }
  M.RULES = [['TC-BR-01', L('Mesin overload → blokir', 'Machine overload → block')], ['TC-BR-02', L('QC gagal → tidak bisa packing normal', 'QC failed → cannot proceed to packing')], ['TC-BR-03', L('Invoice tanpa Billing Ready → diblokir', 'Invoice without Billing Ready → blocked')],
    ['TC-BR-04', L('Periode akuntansi tutup → tidak bisa diubah diam-diam', 'Closed accounting period → cannot silently edit')], ['TC-BR-05', L('Klien A akses Klien B → ditolak', 'Client A accessing Client B → denied')], ['TC-BR-06', L('Pembayaran ganda → peringatan / blokir', 'Duplicate payment → warning / block')]];
  function runRule(id) {
    var PR = M.PR, FN = M.FN, X = M.X, CLP = M.CLP, r = { id: id, n: by(M.RULES.map(function (x) { return { id: x[0], n: x[1] }; }), 'id', id).n, ok: false, how: 'live-readonly', evidence: null };
    if (id === 'TC-BR-01') {
      var ws = PR.state().mach.filter(function (x) { return x.type === 'washer' && x.cap; }), m = ws.filter(function (x) { return ['normal', 'idle', 'running'].indexOf(x.st) >= 0; }).sort(function (a, b) { return b.cap - a.cap; })[0] || ws[0], cfg = PR.cfg ? PR.cfg() : PR.state().cfg, kg = Math.ceil(m.cap * ((cfg.maxOver || 120) / 100 + 0.3));
      var v = PR.validate({ lots: [], mach: m.id, kg: kg, prog: 'P-WL' }), blk = v.blocks.filter(function (b) { return b[0] === 'overload'; })[0];
      r.ok = !!blk; r.evidence = L('JFPROD.validate(' + m.id + ', ' + kg + ' kg / kapasitas ' + m.cap + ' kg) → ' + (blk ? 'blok "' + blk[0] + '"' : 'tidak diblok'), 'JFPROD.validate(' + m.id + ', ' + kg + ' kg / capacity ' + m.cap + ' kg) → ' + (blk ? 'block "' + blk[0] + '"' : 'not blocked'));
    } else if (id === 'TC-BR-02') {
      var luh = userCtx('luh'), b0 = PR.state().batches.filter(function (b) { return b.stage === 'qc_q'; })[0] || PR.state().batches[0];
      var sb = sandbox('PR', function () { var b = PR.batch(b0.id); b.stage = 'pack_q'; b.qc = { res: 'fail', qty: b.pcs, pass: 0, fail: b.pcs, by: 'EMP-079', at: nowS() }; return PR.pack(luh, b.id, { pkgs: 2 }); });
      var res = sb.out || {}; r.how = 'sandbox'; r.ok = res.ok === false && sb.restored; r.evidence = L('Sandbox JFPROD: ' + b0.id + ' QC gagal → JFPROD.pack ditolak (' + (res.code || '—') + '); state dipulihkan: ' + (sb.restored ? 'ya' : 'TIDAK'), 'JFPROD sandbox: ' + b0.id + ' QC failed → JFPROD.pack refused (' + (res.code || '—') + '); state restored: ' + (sb.restored ? 'yes' : 'NO'));
    } else if (id === 'TC-BR-03') {
      var budi = userCtx('budi'), res3 = FN.buildInvoice(budi, []), res3b = FN.buildInvoice(budi, ['BR-NOT-READY']);
      r.ok = res3.ok === false && res3b.ok === false; r.evidence = L('JFFIN.buildInvoice tanpa Billing Ready → ditolak (' + (res3.code || 'invalid') + ')', 'JFFIN.buildInvoice without Billing Ready → refused (' + (res3.code || 'invalid') + ')');
    } else if (id === 'TC-BR-04') {
      var bd = userCtx('budi'), per = FN.state().periods.filter(function (p) { return p.st === 'closed' || p.st === 'locked'; }).slice(-1)[0], date = per.p + '-15';
      var sb4 = sandbox('FN', function () { var d = FN.draftJournal(bd, { date: date, desc: L('Uji periode tutup', 'Closed period test'), lines: [{ a: '1111', d: 1000 }, { a: '4100', c: 1000 }] }); if (!d.ok) return d; return FN.postJournal(bd, d.jv.id, 'uji'); });
      var res4 = sb4.out || {}; r.how = 'sandbox'; r.ok = res4.ok === false && sb4.restored; r.evidence = L('Sandbox JFFIN: posting jurnal ' + date + ' (periode ' + per.p + ' ' + per.st + ') → ditolak (' + (res4.code || '—') + '); state dipulihkan: ' + (sb4.restored ? 'ya' : 'TIDAK'), 'JFFIN sandbox: posting a journal on ' + date + ' (period ' + per.p + ' ' + per.st + ') → refused (' + (res4.code || '—') + '); state restored: ' + (sb4.restored ? 'yes' : 'NO'));
    } else if (id === 'TC-BR-05') {
      var sari = userCtx('sari.grandvista'), rec = CLP && CLP.recordOf ? CLP.recordOf('INV-2610-071') : { cl: 'CL-07' }, az = X.authorize(sari, 'CLP-009', rec), iv = CLP && CLP.invoice ? CLP.invoice(sari, 'INV-2610-071') : null;
      r.ok = !az.ok && !iv; r.evidence = L('sari.grandvista (CL-01) → INV-2610-071 (CL-07): X.authorize ' + (az.ok ? 'IZIN' : az.code) + ', JFCLP.invoice ' + (iv ? 'TAMPIL' : 'null'), 'sari.grandvista (CL-01) → INV-2610-071 (CL-07): X.authorize ' + (az.ok ? 'ALLOWED' : az.code) + ', JFCLP.invoice ' + (iv ? 'SHOWN' : 'null'));
    } else if (id === 'TC-BR-06') {
      var e0 = FN.state().exp.filter(function (e) { return e.sinv && e.sup; })[0], hits = e0 ? FN.dupCheck({ sup: e0.sup, sinv: e0.sinv, amt: e0.amt, date: e0.date }) : [];
      r.ok = hits.length > 0; r.evidence = L('JFFIN.dupCheck(' + (e0 ? e0.sup + ' · ' + e0.sinv : '—') + ') → ' + hits.length + ' kemungkinan duplikat (' + (hits[0] ? T(hits[0].why[0]) : '—') + ')', 'JFFIN.dupCheck(' + (e0 ? e0.sup + ' · ' + e0.sinv : '—') + ') → ' + hits.length + ' possible duplicates (' + (hits[0] ? hits[0].why[0][1] : '—') + ')');
    }
    return r;
  }
  M.ruleTests = function (ctx) { if (!can(ctx, 'imp.qa.view')) return []; var last = S().rules[0]; return M.RULES.map(function (x) { var lr = last ? by(last.results, 'id', x[0]) : null; return { id: x[0], n: x[1], last: lr ? lr.ok : null, how: lr ? lr.how : null, evidence: lr ? lr.evidence : null, at: last ? last.at : null }; }); };
  M.runRules = function (ctx) {
    if (!can(ctx, 'imp.qa.run')) return deny(ctx, 'imp.qa.run', 'RULES');
    var results = M.RULES.map(function (x) { return tryf(function () { return runRule(x[0]); }, { id: x[0], n: x[1], ok: false, how: 'error', evidence: M.MSG.load }); });
    var run = { at: nowS(), by: empId(ctx), results: results, pass: results.filter(function (x) { return x.ok; }).length, total: results.length };
    S().rules.unshift(run); if (S().rules.length > 20) S().rules.length = 20;
    M.audit('RULES.RUN', ctx, { module: 'qa', rec: 'TC-BR', after: { pass: run.pass, total: run.total }, result: run.pass === run.total ? 'ok' : 'failed' }); save();
    return { ok: true, run: run };
  };

  /* ==========================================================================
     NP-05 §25–§29 live security validation (read-only)
     ========================================================================== */
  function resolveU(u) { var X = M.X, usr = X ? X.USERS.filter(function (x) { return x.u === u; })[0] : null; if (!usr) return { user: null, ctx: null }; var c = X.resolve(usr.id); return { user: usr, ctx: c && c.ok ? c : null, code: c && !c.ok ? c.code : null }; }
  M.secRoles = function (ctx) {
    if (!can(ctx, 'imp.sec.view')) return [];
    return D.SEC_ROLES.map(function (r) { var x = resolveU(r[3]); return { n: L(r[0], r[1]), role: r[2], u: r[3], uid: x.user ? x.user.id : null, resolved: !!x.ctx, code: x.code || null, roleKey: x.ctx ? x.ctx.roleKey : null, landing: x.ctx ? x.ctx.landing : null, perms: x.ctx ? x.ctx.perms.length : 0, match: !!(x.ctx && x.ctx.roleKey === r[2]) }; });
  };
  M.ACTIONS = [['view', L('Lihat', 'View')], ['create', L('Buat', 'Create')], ['edit', L('Ubah', 'Edit')], ['approve', L('Setujui', 'Approve')], ['export', L('Export', 'Export')], ['admin', L('Admin', 'Admin')]];
  M.permMatrix = function (ctx) {
    if (!can(ctx, 'imp.sec.view')) return null;
    var SYS = M.SYS, mx = SYS && SYS.matrix ? tryf(function () { return SYS.matrix({ perms: ['sys11.roles.view'] }, { roles: uniq(D.SEC_ROLES.map(function (r) { return r[2]; })) }); }, null) : null;
    var mods = mx ? mx.modules.map(function (m) { return { k: m.k, n: m.n }; }) : [];
    var rowsOut = D.SEC_ROLES.map(function (r) {
      var x = resolveU(r[3]), cells = {};
      mods.forEach(function (m) {
        var base = mx.cells[r[2]] && mx.cells[r[2]][m.k], c = { scope: x.user && SYS.userScope ? SYS.userScope(x.user.id, m.k) || (base && base.scope) : base && base.scope };
        M.ACTIONS.forEach(function (a) { var all = mx.modules.filter(function (mm) { return mm.k === m.k; })[0].byAction[a[0]] || [], has = x.ctx ? all.filter(function (p) { return x.ctx.perms.indexOf(p) >= 0; }).length : 0; c[a[0]] = { has: has, of: all.length }; });
        cells[m.k] = c;
      });
      return { n: L(r[0], r[1]), role: r[2], u: r[3], uid: x.user ? x.user.id : null, resolved: !!x.ctx, cells: cells };
    });
    return { actions: M.ACTIONS, scopes: SYS ? SYS.SCOPES : [], modules: mods, rows: rowsOut, src: mx ? 'JFSYS.matrix + live X.resolve' : 'unavailable' };
  };
  // One negative test, live: returns {allowed, evidence}. Never mutates owner engines.
  function evalNeg(t) {
    var X = M.X, x = resolveU(t[2]), c = x.ctx, kind = t[3], target = t[4], allowed = false, ev = null;
    if (!c) return { allowed: false, evidence: L('User tidak bisa login (' + (x.code || 'tidak ada') + ')', 'User cannot sign in (' + (x.code || 'missing') + ')'), user: x.user ? x.user.id : null };
    if (kind === 'screen') { allowed = X.canScreen(c, target); var az = X.authorize(c, target); ev = L('X.canScreen(' + target + ') = ' + allowed + ' · authorize ' + (az.ok ? 'ok' : az.code), 'X.canScreen(' + target + ') = ' + allowed + ' · authorize ' + (az.ok ? 'ok' : az.code)); }
    else if (kind === 'perm') { allowed = X.can(c, target); ev = L('X.can(' + target + ') = ' + allowed, 'X.can(' + target + ') = ' + allowed); }
    else if (kind === 'record') {
      var rec = M.CLP && M.CLP.recordOf ? M.CLP.recordOf(target) : null, scr = /^INV-/.test(target) ? 'CLP-009' : 'CLP-006', az2 = X.authorize(c, scr, rec), seen = null;
      if (/^INV-/.test(target)) seen = M.CLP && M.CLP.invoice ? M.CLP.invoice(c, target) : null; else seen = M.CLP && M.CLP.job ? tryf(function () { return M.CLP.job(c, target); }, null) : null;
      allowed = az2.ok || !!seen; ev = L('X.authorize(' + scr + ', ' + target + ' → ' + (rec ? rec.cl : '—') + ') = ' + (az2.ok ? 'ok' : az2.code) + ' · data ' + (seen ? 'TAMPIL' : 'null'), 'X.authorize(' + scr + ', ' + target + ' → ' + (rec ? rec.cl : '—') + ') = ' + (az2.ok ? 'ok' : az2.code) + ' · data ' + (seen ? 'SHOWN' : 'null'));
    } else if (kind === 'golive') {
      var G = goEng(), ps = G && G.PERMS ? Object.keys(G.PERMS).filter(function (p) { return /decid|gonogo|golive\.approve|decision/i.test(p); }) : [];
      var held = ps.filter(function (p) { return X.can(c, p); }); allowed = held.length > 0;
      ev = G ? L('Izin Go/No-Go JFGO [' + (ps.join(', ') || '—') + '] dimiliki: ' + (held.join(', ') || 'tidak ada'), 'JFGO Go/No-Go permissions [' + (ps.join(', ') || '—') + '] held: ' + (held.join(', ') || 'none')) : L('JFGO belum termuat: belum ada izin keputusan Go/No-Go, jadi ditolak', 'JFGO not loaded: no Go/No-Go decision permission exists, so denied');
    }
    return { allowed: allowed, evidence: ev, user: x.user.id };
  }
  M.negativeTests = function (ctx) {
    if (!can(ctx, 'imp.sec.view')) return [];
    var last = S().secRuns[0];
    return D.NEGATIVE.map(function (t) { var lr = last ? by(last.results, 'id', t[0]) : null; return { id: t[0], role: t[1], u: t[2], kind: t[3], target: t[4], n: L(t[5], t[6]), expect: 'denied', last: lr ? lr.res : null, evidence: lr ? lr.evidence : null, at: last ? last.at : null }; });
  };
  function liveNegatives() { return D.NEGATIVE.map(function (t) { var e = tryf(function () { return evalNeg(t); }, { allowed: true, evidence: M.MSG.load, user: null }); return { id: t[0], role: t[1], u: t[2], user: e.user, kind: t[3], target: t[4], n: L(t[5], t[6]), expect: 'denied', res: e.allowed ? 'fail' : 'pass', allowed: e.allowed, evidence: e.evidence }; }); }
  // §28 checklist, each item from real configuration / live checks.
  M.secChecklist = function (ctx) {
    if (ctx !== true && !can(ctx, 'imp.sec.view')) return [];
    var X = M.X, SYS = M.SYS, P = X ? X.POLICY : {}, out = [];
    function it(k, id, en, ok, v) { out.push({ k: k, n: L(id, en), ok: !!ok, v: v }); }
    it('login', 'Login: kunci setelah gagal berulang', 'Login: lock after repeated failures', P.maxFailed > 0 && P.maxFailed <= 10 && P.lockMinutes >= 5, L(P.maxFailed + ' gagal → kunci ' + P.lockMinutes + ' mnt', P.maxFailed + ' failures → lock ' + P.lockMinutes + ' min'));
    it('session', 'Sesi: timeout tidak aktif', 'Session: idle timeout', P.idle > 0 && P.idle <= 60 * 6e4, L('Idle ' + Math.round(P.idle / 6e4) + ' mnt', 'Idle ' + Math.round(P.idle / 6e4) + ' min'));
    it('password', 'Password: panjang minimal', 'Password: minimum length', P.minPassword >= 8, L('Min ' + P.minPassword + ' karakter', 'Min ' + P.minPassword + ' characters'));
    var api = SYS && SYS.users ? SYS.users(userCtx('made') || { perms: [] }).length === 0 : true;
    it('api', 'Otorisasi API di engine (bukan hanya UI)', 'API authorization in the engine (not only the UI)', api, L('JFSYS.users(operator) → ' + (api ? '[]' : 'DATA'), 'JFSYS.users(operator) → ' + (api ? '[]' : 'DATA')));
    var dr = userCtx('ketut'), url = dr ? !X.authorize(dr, 'FIN-001').ok : false;
    it('url', 'Akses URL langsung ditolak', 'Direct URL access refused', url, L('Driver → #/FIN-001: ' + (url ? 'ditolak' : 'TERBUKA'), 'Driver → #/FIN-001: ' + (url ? 'refused' : 'OPEN')));
    var sari = userCtx('sari.grandvista'), docs = M.CLP && M.CLP.docs && sari ? M.CLP.docs(sari, {}) : [], foreign = docs.filter(function (d) { var r = M.CLP.recordOf(d.ref || d.ord || d.id); return r && r.cl && r.cl !== 'CL-01'; });
    it('file', 'Akses file/dokumen klien lain', 'Other clients\' files/documents', !foreign.length, L(docs.length + ' dokumen CL-01, ' + foreign.length + ' milik klien lain', docs.length + ' CL-01 documents, ' + foreign.length + ' from other clients'));
    var ex = SYS && SYS.exportTypes ? SYS.exportTypes(userCtx('made') || { perms: [] }).filter(function (e) { return e.allowed; }).length : 0;
    it('export', 'Export dibatasi izin', 'Export limited by permission', ex === 0, L('Operator bisa export ' + ex + ' jenis', 'Operator can export ' + ex + ' types'));
    var sec = SYS && SYS.security ? tryf(function () { return SYS.security(sysCtx()); }, null) : null, cur = sec && (sec.cur || sec.current || {}); cur = cur && cur.data ? cur.data : cur;
    it('masking', 'Masking field sensitif', 'Sensitive field masking', !!(cur && cur.maskPhone && cur.maskBank), L('Telepon ' + (cur && cur.maskPhone ? 'disamarkan' : '—') + ', bank ' + (cur && cur.maskBank ? 'disamarkan' : '—'), 'Phone ' + (cur && cur.maskPhone ? 'masked' : '—') + ', bank ' + (cur && cur.maskBank ? 'masked' : '—')));
    var iso2 = liveNegatives().filter(function (n) { return n.kind === 'record'; }), isoOk = iso2.every(function (n) { return n.res === 'pass'; });
    it('isolation', 'Isolasi data klien', 'Client data isolation', isoOk && iso2.length > 0, L(iso2.filter(function (n) { return n.res === 'pass'; }).length + '/' + iso2.length + ' uji lintas klien ditolak', iso2.filter(function (n) { return n.res === 'pass'; }).length + '/' + iso2.length + ' cross-client tests denied'));
    var budi = userCtx('budi'), byp = budi ? budi.perms.indexOf('fin.invoice.fix.approve') < 0 : false;
    it('bypass', 'Deny override tidak bisa dilewati', 'Deny override cannot be bypassed', byp, L('budi deny fin.invoice.fix.approve → ' + (byp ? 'tidak dimiliki' : 'DIMILIKI'), 'budi deny fin.invoice.fix.approve → ' + (byp ? 'not held' : 'HELD')));
    var hook = !!(X && X.__p11sys), wf = SYS && SYS.accessWindow, exu = wf && X ? X.USERS.filter(function (u) { return wf(u.id).code === 'expired_access'; }) : [], rs = exu.length ? X.resolve(exu[0].id) : null, exp = !!(rs && !rs.ok);
    it('expiry', 'Masa akses berakhir ditolak', 'Expired access refused', hook && (exu.length ? exp : true), L('Hook masa akses ' + (hook ? 'aktif' : 'TIDAK ADA') + (exu.length ? ' · ' + exu[0].u + ' (berakhir ' + wf(exu[0].id).end + ') → ' + (rs.ok ? 'MASUK' : rs.code) : ' · tidak ada akun kedaluwarsa'), 'Access window hook ' + (hook ? 'active' : 'MISSING') + (exu.length ? ' · ' + exu[0].u + ' (ended ' + wf(exu[0].id).end + ') → ' + (rs.ok ? 'SIGNED IN' : rs.code) : ' · no expired account')));
    return out;
  };
  // runAll(ctx): live, read-only. ROLE_TESTED per role, SECURITY_FAILURE + critical finding for any unexpected allow.
  M.runSecurity = function (ctx) {
    if (!can(ctx, 'imp.sec.run')) return deny(ctx, 'imp.sec.run', 'SVT');
    var results = liveNegatives(), roles = M.secRoles({ perms: ['imp.sec.view'] }), check = M.secChecklist(true), failures = results.filter(function (r) { return r.res === 'fail'; });
    var run = { id: nid('svr', 'SVT-R', 3), at: nowS(), by: empId(ctx), results: results, pass: results.length - failures.length, total: results.length, roles: roles.map(function (r) { return { role: r.role, u: r.u, resolved: r.resolved }; }), checklist: check,
      findings: failures.map(function (f) { return { sev: 'critical', id: f.id, n: f.n, evidence: f.evidence }; }) };
    S().secRuns.unshift(run); if (S().secRuns.length > 20) S().secRuns.length = 20;
    roles.forEach(function (r) { M.audit('ROLE_TESTED', ctx, { module: 'security', rec: r.role + ':' + r.u, after: { resolved: r.resolved, perms: r.perms, tests: results.filter(function (x) { return x.u === r.u; }).length }, result: r.resolved ? 'ok' : 'failed' }); });
    failures.forEach(function (f) { M.audit('SECURITY_FAILURE', ctx, { module: 'security', rec: f.id, after: { user: f.u, target: f.target, evidence: T(f.evidence) }, result: 'failed' }); });
    M.audit('SECURITY.RUN', ctx, { module: 'security', rec: run.id, after: { pass: run.pass, total: run.total, failures: failures.length }, result: failures.length ? 'failed' : 'ok' }); save();
    return { ok: true, run: run };
  };
  M.runAll = M.runSecurity;
  M.secReport = function (ctx) {
    if (!can(ctx, 'imp.sec.view')) return null;
    var last = S().secRuns[0], check = M.secChecklist(ctx), live = last ? null : liveNegatives(), res = last ? last.results : live;
    var pass = res.filter(function (r) { return r.res === 'pass'; }).length, cOk = check.filter(function (c) { return c.ok; }).length, fail = res.length - pass;
    return { lastRun: last ? { id: last.id, at: last.at, by: last.by } : null, live: !last, roles: D.SEC_ROLES.length, negative: { pass: pass, total: res.length }, failures: fail, findings: last ? last.findings : res.filter(function (r) { return r.res === 'fail'; }).map(function (f) { return { sev: 'critical', id: f.id, n: f.n, evidence: f.evidence }; }),
      checklist: { ok: cOk, total: check.length, items: check }, score: Math.round((pass + cOk) / (res.length + check.length) * 100), st: fail ? 'critical' : cOk < check.length ? 'warning' : 'healthy' };
  };

  /* ==========================================================================
     NP-07 §37–§43 integration health, performance, reliability, backup, restore, DR
     ========================================================================== */
  M.INT_ST = { healthy: [L('Healthy', 'Healthy'), 'ok'], warning: [L('Warning', 'Warning'), 'warn'], critical: [L('Critical', 'Critical'), 'crit'], disconnected: [L('Disconnected', 'Disconnected'), 'mute'] };
  M.integrationHealth = function (ctx) {
    if (!can(ctx, 'imp.view')) return [];
    var list = M.SYS && M.SYS.integrations ? tryf(function () { return M.SYS.integrations(sysCtx()); }, []) : [];
    return list.map(function (i) { var stt = M.INT_ST[i.st] ? i.st : 'critical'; return { id: i.id, n: i.n, st: stt, stN: M.INT_ST[stt][0], tone: M.INT_ST[stt][1], latency: D.LATENCY[i.id] == null ? null : D.LATENCY[i.id], lastSync: i.last, lastSuccess: i.ok, error: i.err, errAt: i.errAt, owner: i.owner, future: i.future, rate: i.rate, link: { s: 'INT-002', rec: i.id } }; });
  };
  M.perfTests = function (ctx) { if (!can(ctx, 'imp.view')) return []; return S().perf.map(function (p) { return Object.assign(clone(p), { tone: p.st === 'pass' ? 'ok' : 'crit' }); }); };
  // A real measurement in this runtime: owner-engine reads repeated N times.
  M.runBenchmark = function (ctx, n) {
    if (!can(ctx, 'imp.qa.run') && !can(ctx, 'imp.rel.run')) return deny(ctx, 'imp.rel.run', 'PFT');
    n = Math.max(10, Math.min(1000, +n || 200));
    var LG = M.LG, CM = M.CM, FN = M.FN, oc = { perms: ['lg.order.view', 'lg.dispatch'], roleKey: 'opsmgr', plant: '*', allPlants: true, uid: 'system:jfimp' }, fc = finCtx(), out = [];
    function bench(id, en, target, fn) { var t0 = perf(), cnt = 0; for (var i = 0; i < n; i++) cnt = fn() || cnt; var dur = Math.round((perf() - t0) * 100) / 100; return { id: id, en: en, target: target, dur: dur, per: Math.round(dur / n * 1000) / 1000, items: cnt }; }
    out.push(bench('orders', 'JFLOG.orders', 1500, function () { var r = LG.orders(oc, {}); return r.length; }));
    out.push(bench('search', 'JFCOMM search', 800, function () { var q = 'grand'; return CM.clients().filter(function (c) { return (c.n + ' ' + c.legal).toLowerCase().indexOf(q) >= 0; }).length; }));
    out.push(bench('invoices', 'JFFIN.invoices', 1500, function () { return (FN.invoices(fc, {}) || []).length; }));
    var recs = out.map(function (b) {
      var p = { id: nid('pft', 'PFT-'), kind: 'live', n: L('Benchmark live: ' + b.en + ' × ' + n, 'Live benchmark: ' + b.en + ' × ' + n), target: L('< ' + b.target + ' ms total', '< ' + b.target + ' ms total'), tv: b.target, res: b.dur, unit: 'ms', st: b.dur < b.target ? 'pass' : 'fail', at: nowS(), live: true, per: b.per, items: b.items, runs: n, by: empId(ctx) };
      S().perf.push(p); return p;
    });
    M.audit('PERF.RUN', ctx, { module: 'reliability', rec: recs.map(function (r) { return r.id; }).join(','), after: recs.map(function (r) { return { id: r.id, ms: r.res }; }), result: recs.every(function (r) { return r.st === 'pass'; }) ? 'ok' : 'failed' }); save();
    return { ok: true, results: recs };
  };
  function reliView(r) { var x = S().reli[r[0]] || null; return { id: r[0], kind: r[1], n: L(r[2], r[3]), expect: L(r[4], r[5]), res: x ? x.res : null, evidence: x ? x.evidence : null, at: x ? x.at : null, by: x ? x.by : null, dur: x ? x.dur : null }; }
  M.reliability = function (ctx) { if (!can(ctx, 'imp.view')) return []; return D.RELI.map(reliView); };
  function reliCheck(kind) {
    var X = M.X, SYS = M.SYS, LG = M.LG;
    if (kind === 'internet') {
      if (!X || !X.setNet) return { ok: false, ev: M.MSG.load }; var prev = X.net(), r;
      try { X.setNet('offline'); r = X.login('made', X.DEMO_PASSWORD); } finally { X.setNet(root.navigator && root.navigator.onLine === false ? 'online' : prev); }
      return { ok: r && r.ok === false && r.code === 'network', ev: L('Jaringan offline → login dijawab "' + (r && r.code) + '" (tanpa crash, tanpa hitungan gagal)', 'Network offline → login answers "' + (r && r.code) + '" (no crash, no failed-attempt count)') };
    }
    if (kind === 'timeout') {
      var res = safeCall(function () { throw new Error('ETIMEDOUT provider 30000ms'); });
      return { ok: res.ok === false && res.code === 'integ' && !/ETIMEDOUT/.test(T(res.msg)), ev: L('Timeout → pesan "' + T(res.msg) + '" + Coba Lagi; detail teknis tidak ditampilkan', 'Timeout → message "' + res.msg[1] + '" + Try Again; technical detail not shown') };
    }
    if (kind === 'notif') {
      var log = SYS && SYS.commLog ? tryf(function () { return SYS.commLog(sysCtx(), {}); }, []) : [], failed = log.filter(function (l) { return l.st === 'failed'; });
      return { ok: failed.length > 0 && typeof SYS.retry === 'function', ev: L(failed.length + ' pesan Failed tercatat di log komunikasi; JFSYS.retry tersedia', failed.length + ' Failed messages recorded in the communication log; JFSYS.retry available') };
    }
    if (kind === 'storage') {
      // Swap this engine's storage for one that throws on write: save() must not crash and data must stay readable from memory.
      var keep = ls, threw = false, read = null;
      ls = { getItem: function () { return null; }, setItem: function () { throw new Error('QuotaExceededError'); }, removeItem: function () {} };
      try { try { save(); } catch (e) { threw = true; } read = tryf(function () { return S().tcs.length + LG.state().orders.length; }, null); }
      finally { ls = keep; save(); }
      return { ok: !threw && read != null, ev: L('Tulis storage dipaksa gagal → tidak ada crash, data tetap terbaca dari memori (' + read + ' record)', 'Storage writes forced to fail → no crash, data still readable from memory (' + read + ' records)') };
    }
    if (kind === 'slow') {
      var t0 = perf(), rows0 = SYS && SYS.auditAll ? tryf(function () { return SYS.auditAll({ perms: ['sys11.audit.view'] }).length; }, 0) : 0, dur = Math.round(perf() - t0);
      return { ok: dur < 2000, ev: L('Query terberat (audit gabungan ' + rows0 + ' baris) ' + dur + ' ms (target < 2.000 ms)', 'Heaviest query (unified audit ' + rows0 + ' rows) ' + dur + ' ms (target < 2,000 ms)'), dur: dur };
    }
    if (kind === 'integ') {
      var ig = M.integrationHealth({ perms: ['imp.view'] }), down = ig.filter(function (i) { return i.st === 'disconnected' && !i.future; }), core = tryf(function () { return LG.state().orders.length; }, null);
      return { ok: down.length > 0 ? core != null : true, ev: L(down.length + ' integrasi terputus (' + down.map(function (i) { return i.id; }).join(', ') + ') terlihat di status; proses inti tetap jalan (' + core + ' order)', down.length + ' integrations disconnected (' + down.map(function (i) { return i.id; }).join(', ') + ') visible in status; core process keeps running (' + core + ' orders)') };
    }
    return { ok: false, ev: M.MSG.invalid };
  }
  function safeCall(fn) { try { return { ok: true, v: fn() }; } catch (e) { return { ok: false, code: 'integ', msg: M.SYS && M.SYS.MSG && M.SYS.MSG.integ || L('Integration sedang bermasalah. Coba Lagi.', 'The integration is having a problem. Try Again.') }; } }
  M.safeCall = safeCall;
  M.runReliability = function (ctx, id) {
    if (!can(ctx, 'imp.rel.run')) return deny(ctx, 'imp.rel.run', id || 'RLT');
    var defs = id ? D.RELI.filter(function (r) { return r[0] === id; }) : D.RELI; if (!defs.length) return bad('notfound');
    var out = defs.map(function (r) { var t0 = perf(), c = tryf(function () { return reliCheck(r[1]); }, { ok: false, ev: M.MSG.load }); var x = { res: c.ok ? 'pass' : 'fail', evidence: c.ev, at: nowS(), by: empId(ctx), dur: Math.round(perf() - t0) }; S().reli[r[0]] = x; return Object.assign({ id: r[0] }, x); });
    M.audit('RELIABILITY.RUN', ctx, { module: 'reliability', rec: id || 'RLT-ALL', after: out.map(function (x) { return { id: x.id, res: x.res }; }), result: out.every(function (x) { return x.res === 'pass'; }) ? 'ok' : 'failed' }); save();
    return { ok: true, results: out };
  };
  M.backup = function (ctx) {
    if (!can(ctx, 'imp.view')) return null;
    var b = M.SYS && M.SYS.backups ? tryf(function () { return M.SYS.backups(sysCtx()); }, null) : null, rdy = backupReady();
    return { policy: { freq: D.BACKUP_POLICY.freq, retention: D.BACKUP_POLICY.retention, location: D.BACKUP_POLICY.location, owner: D.BACKUP_POLICY.owner, ownerN: empName(D.BACKUP_POLICY.owner) },
      last: b ? b.last : null, lastOk: b ? b.lastOk : null, st: b ? b.st : 'critical', schedule: b ? b.schedule : null, list: b ? b.list.slice(0, 14) : [], ready: rdy.ok, readyV: rdy.v, src: 'JFSYS.backups', restoreTested: !!lastRestoreOk() };
  };
  function lastRestoreOk() { return S().restores.filter(function (r) { return r.res === 'pass'; }).sort(function (a, b) { return a.at < b.at ? 1 : -1; })[0] || null; }
  M.restoreTests = function (ctx) { if (!can(ctx, 'imp.view')) return []; return S().restores.slice().sort(function (a, b) { return a.at < b.at ? 1 : -1; }).map(clone); };
  // Every engine's state (localStorage jfos-*-v1 / M.state()), serialized → restored into a scratch object → compared. Live data untouched.
  function engineStates() {
    var out = [], seen = {};
    function add(k, E) { if (!E || !E.state || seen[k]) return; var s = tryf(function () { return E.state(); }, null); if (s) { seen[k] = 1; out.push({ k: k, s: s }); } }
    add('perf', M.P); add('comm', M.CM); add('logi', M.LG); add('prod', M.PR); add('dlv', M.DL); add('fin', M.FN); add('clp', M.CLP); add('sys', M.SYS); add('imp', M); add('go', goEng()); add('help', helpEng());
    if (root.localStorage) { try { var a = root.localStorage.getItem('jfos-access-v1'); if (a) out.push({ k: 'access', s: JSON.parse(a) }); } catch (e) {} }
    return out;
  }
  function countRecords(s) { var n = 0; Object.keys(s || {}).forEach(function (k) { var v = s[k]; if (Array.isArray(v)) n += v.length; else if (v && typeof v === 'object' && k !== 'seq' && k !== 'cfg') n += Object.keys(v).length; }); return n; }
  M.runRestoreTest = function (ctx, reason, o) {
    if (!can(ctx, 'imp.rel.run')) return deny(ctx, 'imp.rel.run', 'RST');
    if (isMobile(ctx, o)) return bad('device');
    var t0 = perf(), states = engineStates(), before = states.map(function (e) { var j = JSON.stringify(e.s); return { k: e.k, json: j, n: countRecords(e.s), h: hash(j) }; });
    var blob = JSON.stringify(before.map(function (b) { return { k: b.k, data: b.json }; }));
    var scratch = JSON.parse(blob).map(function (b) { return { k: b.k, s: JSON.parse(b.data) }; });
    var cmp = scratch.map(function (e, i) { var j = JSON.stringify(e.s), n = countRecords(e.s), h = hash(j); return { k: e.k, before: before[i].n, after: n, hashOk: h === before[i].h, countOk: n === before[i].n }; });
    var liveSame = states.every(function (e, i) { return hash(JSON.stringify(e.s)) === before[i].h; });
    var dur = Math.round((perf() - t0) * 100) / 100, ok = cmp.every(function (c) { return c.hashOk && c.countOk; }) && liveSame;
    var b0 = backupReady(), rec = { id: nid('rst', 'RST-'), at: nowS(), by: empId(ctx), src: b0.id || 'live-state', target: L('Objek scratch di memori (data live tidak diubah)', 'Scratch object in memory (live data untouched)'), res: ok ? 'pass' : 'fail', dur: dur, engines: cmp.length,
      records: cmp.reduce(function (s, c) { return s + c.before; }, 0), bytes: blob.length, hashOk: cmp.every(function (c) { return c.hashOk; }), countsOk: cmp.every(function (c) { return c.countOk; }), liveUntouched: liveSame, detail: cmp, note: reason ? Ln(T(reason)) : null };
    S().restores.push(rec);
    M.audit('RESTORE_EXECUTED', ctx, { module: 'reliability', rec: rec.id, after: { res: rec.res, engines: rec.engines, records: rec.records, ms: dur }, reason: reason || null, result: ok ? 'ok' : 'failed' }); save();
    return { ok: true, test: clone(rec) };
  };
  M.dr = function (ctx) {
    if (!can(ctx, 'imp.view')) return null;
    var b = M.SYS && M.SYS.backups ? tryf(function () { return M.SYS.backups(sysCtx()); }, null) : null, lo = b && b.lastOk, rpo = lo ? Math.round((M.now() - ms(lo.at)) / 36e5 * 10) / 10 : null, rs = lastRestoreOk();
    var rtoH = rs ? Math.round(rs.dur / 36e5 * 1000) / 1000 : null;
    return { rpo: { target: D.DR.rpoH, measured: rpo, ok: rpo != null && rpo <= D.DR.rpoH, src: lo ? lo.id : null }, rto: { target: D.DR.rtoH, measured: rtoH, ok: rtoH != null && rtoH <= D.DR.rtoH, src: rs ? rs.id : null, ms: rs ? rs.dur : null } };
  };
  M.reliabilityCenter = function (ctx) {
    if (!can(ctx, 'imp.view')) return null;
    var ig = M.integrationHealth(ctx), act = ig.filter(function (i) { return !i.future; }), pf = M.perfTests(ctx), rl = M.reliability(ctx), bk = M.backup(ctx), rs = lastRestoreOk();
    return { integrations: { total: act.length, healthy: act.filter(function (i) { return i.st === 'healthy'; }).length, warning: act.filter(function (i) { return i.st === 'warning'; }).length, critical: act.filter(function (i) { return i.st === 'critical'; }).length, disconnected: act.filter(function (i) { return i.st === 'disconnected'; }).length },
      perf: { total: pf.length, pass: pf.filter(function (p) { return p.st === 'pass'; }).length }, reliability: { total: rl.length, run: rl.filter(function (r) { return r.res; }).length, pass: rl.filter(function (r) { return r.res === 'pass'; }).length },
      backup: { st: bk.st, last: bk.last, ready: bk.ready }, restore: rs ? { id: rs.id, at: rs.at, res: rs.res, dur: rs.dur } : null, dr: M.dr(ctx) };
  };

  /* ==========================================================================
     Readiness inputs (§94) for Engine B and the command center
     ========================================================================== */
  // readiness() → {build, qa, security, integration} 0–100 + evidence + hard-gate facts. Read-only, no ctx (engine-to-engine).
  M.readiness = function () {
    var waves = D.WAVES.map(waveRow), build = Math.round(waves.reduce(function (s, w) { return s + w.build; }, 0) / waves.length);
    var t = S().tcs, pass = t.filter(function (x) { return x.st === 'pass'; }).length, qa = Math.round(pass / Math.max(1, t.length) * 100);
    var last = S().secRuns[0], neg = last ? last.results : liveNegatives(), negPass = neg.filter(function (r) { return r.res === 'pass'; }).length, chk = M.secChecklist(true), cOk = chk.filter(function (c) { return c.ok; }).length;
    var security = Math.round((negPass + cOk) / Math.max(1, neg.length + chk.length) * 100);
    var map = M.integrationMap({ perms: ['imp.view'] }), ig = M.integrationHealth({ perms: ['imp.view'] }).filter(function (i) { return !i.future; }), igOk = ig.filter(function (i) { return i.st === 'healthy'; }).length;
    var integration = Math.round((map.pct + (ig.length ? igOk / ig.length * 100 : 0)) / 2), ob = openBugs(), rs = lastRestoreOk();
    var permFail = M.secRoles({ perms: ['imp.sec.view'] }).filter(function (r) { return !r.match; });
    var sv = Object.keys(S().suites).map(function (k) { return S().suites[k]; }).filter(function (x) { return x.at; }), regression = pct(sv.reduce(function (s, x) { return s + x.passed; }, 0), sv.reduce(function (s, x) { return s + x.total; }, 0));
    var facts = { criticalBugs: ob.filter(function (b) { return b.sev === 'critical'; }).map(function (b) { return b.id; }), securityFailures: neg.filter(function (r) { return r.res === 'fail'; }).map(function (r) { return r.id; }),
      permissionFailures: permFail.map(function (r) { return r.u; }), restoreTested: !!rs, restore: rs ? { id: rs.id, at: rs.at } : null, securityRun: last ? last.id : null, regression: regression };
    return { build: build, qa: qa, security: security, integration: integration, regression: regression, criticalBugs: facts.criticalBugs, securityFailures: facts.securityFailures, permissionFailures: facts.permissionFailures, restoreTested: facts.restoreTested, facts: facts, hard: facts,
      evidence: { build: L(waves.length + ' wave · ' + waves.reduce(function (s, w) { return s + w.screens.specs; }, 0) + ' layar terdaftar', waves.length + ' waves · ' + waves.reduce(function (s, w) { return s + w.screens.specs; }, 0) + ' registered screens'), qa: L(pass + '/' + t.length + ' test case lulus', pass + '/' + t.length + ' test cases passed'),
        security: L(negPass + '/' + neg.length + ' uji negatif ditolak · checklist ' + cOk + '/' + chk.length + (last ? '' : ' (dihitung live)'), negPass + '/' + neg.length + ' negative tests denied · checklist ' + cOk + '/' + chk.length + (last ? '' : ' (computed live)')),
        integration: L('Peta ' + map.connected + '/' + map.total + ' terhubung · integrasi sehat ' + igOk + '/' + ig.length, 'Map ' + map.connected + '/' + map.total + ' connected · integrations healthy ' + igOk + '/' + ig.length) },
    };
  };
  // Fase 12 build center summary (BUILD-001 / IMP-001 hero data)
  M.center = function (ctx) {
    if (!can(ctx, 'imp.view')) return null;
    var rd = M.readiness(), full = { perms: V4 };
    return { readiness: rd, env: M.envDashboard(full), release: M.currentRelease(), modules: M.modules(full), integration: M.integrationMap(full), blockers: M.blockers(full, { st: 'open' }), qa: M.qaSummary(full), security: M.secReport(full), reliability: M.reliabilityCenter(full),
      data: can(ctx, 'imp.data.view') ? M.dataHealth(full) : null };
  };
  M.kpis = function (ctx) {
    if (!can(ctx, 'imp.view')) return [];
    var rd = M.readiness(), q = M.qaSummary({ perms: ['imp.qa.view'] });
    return [{ k: 'build', n: L('Build Completion', 'Build Completion'), v: rd.build, u: '%' }, { k: 'test', n: L('Test Pass', 'Test Pass'), v: q.passRate, u: '%' }, { k: 'regression', n: L('Regression Pass', 'Regression Pass'), v: q.regression.rate, u: '%' },
      { k: 'security', n: L('Security Pass', 'Security Pass'), v: rd.security, u: '%' }, { k: 'integration', n: L('Integrasi', 'Integration'), v: rd.integration, u: '%' }];
  };

  /* ==========================================================================
     Screens, roles, navigation, install
     ========================================================================== */
  function sc(id, n, a, p, np, icon, pur, emp, devs) {
    return { id: id, n: n, a: a, p: p, np: np, nv: 'NV-' + np.slice(3), icon: icon, pur: pur, dom: 'imp12', lvl: 4, pN: 12, p12: true, nb: [], bf: [], aud: [], dev: 'd', devs: devs || { d: 'primary', t: 'supported', m: 'no' },
      emp: emp || L('Belum ada data.', 'No data yet.'), err: M.MSG.load, warn: L('Ada yang perlu perhatian.', 'Something needs attention.'), ok: L('Tersimpan.', 'Saved.') };
  }
  var MON = { d: 'primary', t: 'monitor', m: 'alert' }, REV = { d: 'primary', t: 'review', m: 'no' };
  M.SCREENS = [
    sc('IMP-001', L('Build & Environment Center', 'Build & Environment Center'), 'T08', 'imp.view', 'NP-01', 'layers', L('Build completion, kesehatan DEV/QA/UAT/PRODUCTION, deployment pending, blocker terbuka.', 'Build completion, DEV/QA/UAT/PRODUCTION health, pending deployments, open blockers.'), null, MON),
    sc('IMP-002', L('Detail Environment', 'Environment Detail'), 'T03', 'imp.view', 'NP-01', 'database', L('Database, kredensial, integrasi, storage, log, konfigurasi terpisah (disamarkan); versi & riwayat deploy.', 'Separate database, credentials, integrations, storage, logs, configuration (masked); version & deploy history.'), null, REV),
    sc('IMP-003', L('Release Pipeline', 'Release Pipeline'), 'T05', 'imp.view', 'NP-01', 'route', L('DEV → QA → UAT → PRODUCTION: build, tes, persetujuan, deployment, validasi; gerbang produksi.', 'DEV → QA → UAT → PRODUCTION: build, tests, approval, deployment, validation; production gate.'), L('Belum ada rilis.', 'No releases yet.'), REV),
    sc('DATA-001', L('One Data Control Center', 'One Data Control Center'), 'T08', 'imp.data.view', 'NP-02', 'database', L('Domain data, pemilik, sumber kebenaran, konsumen, duplikat, orphan, kesehatan data.', 'Data domains, ownership, source of truth, consumers, duplicates, orphans, data health.'), null, REV),
    sc('DATA-002', L('Detail Kepemilikan', 'Ownership Detail'), 'T03', 'imp.data.view', 'NP-02', 'link', L('Pemilik domain, engine sumber & key, konsumen, jumlah record live, cek orphan.', 'Domain owner, source engine & key, consumers, live record count, orphan checks.'), null, REV),
    sc('DATA-003', L('Review Duplikat', 'Duplicate Review'), 'T05', 'imp.data.view', 'NP-02', 'copy', L('Kandidat duplikat dengan skor & field cocok; keputusan bukan duplikat / minta merge (tanpa merge otomatis).', 'Duplicate candidates with score & matched fields; not duplicate / request merge (never automatic).'), L('Tidak ada kandidat duplikat.', 'No duplicate candidates.'), REV),
    sc('BUILD-001', L('Implementation Roadmap · Fase 12 Command Center', 'Implementation Roadmap · Phase 12 Command Center'), 'T08', 'imp.view', 'NP-03', 'target', L('8 wave modul, kesiapan build/QA/security/integrasi, rilis, blocker, alur Fase 12.', '8 module waves, build/QA/security/integration readiness, release, blockers, Phase 12 flow.'), null, MON),
    sc('BUILD-002', L('Progres Modul', 'Module Progress'), 'T05', 'imp.view', 'NP-03', 'list', L('Build % dari registry layar, QA %, integrasi %, UAT %, pemilik, blocker, rilis.', 'Build % from the screen registry, QA %, integration %, UAT %, owner, blocker, release.'), null, REV),
    sc('BUILD-003', L('Peta Integrasi', 'Integration Map'), 'T08', 'imp.view', 'NP-03', 'route', L('Klien → Order → Pickup → Produksi → Delivery → Billing → Finance → KPI dari data nyata.', 'Client → Order → Pickup → Production → Delivery → Billing → Finance → KPI from real data.'), null, MON),
    sc('BUILD-004', L('Detail Blocker', 'Blocker Detail'), 'T03', 'imp.view', 'NP-03', 'alert', L('Blocker: modul, severity, pemilik, jatuh tempo, status, bug terkait, riwayat.', 'Blocker: module, severity, owner, due, status, linked bug, history.'), L('Tidak ada blocker terbuka.', 'No open blocker.'), MON),
    sc('QA-001', L('QA Dashboard', 'QA Dashboard'), 'T08', 'imp.qa.view', 'NP-04', 'flask', L('Pass rate, regression, bug terbuka per severity, E2E emas, business rule.', 'Pass rate, regression, open bugs by severity, golden E2E, business rules.'), null, MON),
    sc('QA-002', L('Daftar Test Case', 'Test Case List'), 'T05', 'imp.qa.view', 'NP-04', 'list', L('Test case per modul dengan status Pass/Fail/Blocked/Retest.', 'Test cases per module with Pass/Fail/Blocked/Retest status.'), null, REV),
    sc('QA-003', L('Detail Test Case', 'Test Case Detail'), 'T03', 'imp.qa.view', 'NP-04', 'filecheck', L('Skenario, build, prasyarat, langkah, expected/actual, tester, bukti, severity, retest.', 'Scenario, build, precondition, steps, expected/actual, tester, evidence, severity, retest.'), null, REV),
    sc('QA-004', L('E2E Test', 'E2E Test'), 'T05', 'imp.qa.view', 'NP-04', 'route', L('Rantai record nyata pickup → jurnal → dashboard, ditemukan/hilang per langkah.', 'Real record chain pickup → journal → dashboard, found/missing per step.'), null, REV),
    sc('QA-005', L('Detail Bug', 'Bug Detail'), 'T03', 'imp.qa.view', 'NP-04', 'alert', L('Severity, test case terkait, status open → fixing → fixed → retest → closed.', 'Severity, linked test case, status open → fixing → fixed → retest → closed.'), null, REV),
    sc('SVL-001', L('Validasi Akses', 'Access Validation'), 'T05', 'imp.sec.view', 'NP-05', 'usercheck', L('Setiap peran §25 di-resolve dengan user demo nyata: landing, izin, status.', 'Each §25 role resolved with a real demo user: landing, permissions, status.'), null, REV),
    sc('SVL-002', L('Uji Matriks Izin', 'Permission Matrix Test'), 'T05', 'imp.sec.view', 'NP-05', 'columns', L('View/Create/Edit/Approve/Export/Admin × modul × cakupan per peran, live.', 'View/Create/Edit/Approve/Export/Admin × module × scope per role, live.'), null, REV),
    sc('SVL-003', L('Uji Negatif', 'Negative Test'), 'T05', 'imp.sec.view', 'NP-05', 'lock', L('Skenario harus ditolak: driver → finance, klien A → klien B, admin → approve pembayaran.', 'Scenarios that must be denied: driver → finance, client A → client B, admin → approve payment.'), null, REV),
    sc('SVL-004', L('Laporan Uji Keamanan', 'Security Test Report'), 'T08', 'imp.sec.view', 'NP-05', 'shield', L('Ringkasan uji negatif, checklist keamanan §28, temuan kritis.', 'Negative test summary, §28 security checklist, critical findings.'), null, MON),
    sc('RLB-001', L('Reliability Center', 'Reliability Center'), 'T08', 'imp.view', 'NP-07', 'gauge', L('Integrasi, performa, simulasi gangguan, backup, restore test, RPO/RTO.', 'Integrations, performance, failure simulations, backup, restore test, RPO/RTO.'), null, MON),
    sc('RLB-002', L('Integration Health', 'Integration Health'), 'T05', 'imp.view', 'NP-07', 'plug', L('Status, latency, sinkron terakhir, sukses terakhir, error, pemilik (dari JFSYS).', 'Status, latency, last sync, last success, error, owner (from JFSYS).'), L('Belum ada integration error.', 'No integration errors yet.'), MON),
    sc('RLB-003', L('Performa', 'Performance'), 'T05', 'imp.view', 'NP-07', 'zap', L('Target vs hasil; benchmark live di runtime ini.', 'Target vs result; live benchmark in this runtime.'), null, REV),
    sc('RLB-004', L('Backup', 'Backup'), 'T05', 'imp.view', 'NP-07', 'history', L('Frekuensi, retensi, lokasi, pemilik, backup terakhir & status.', 'Frequency, retention, location, owner, last backup & status.'), null, MON),
    sc('RLB-005', L('Restore Test', 'Restore Test'), 'T05', 'imp.view', 'NP-07', 'refresh', L('Restore nyata ke objek scratch: jumlah record & hash, durasi; RPO/RTO.', 'Real restore into a scratch object: record counts & hash, duration; RPO/RTO.'), null, REV)
  ];
  M.screen = function (id) { return by(M.SCREENS, 'id', id); };
  M.PARENTS = { 'IMP-002': ['IMP-001'], 'IMP-003': ['IMP-001'], 'DATA-002': ['DATA-001'], 'DATA-003': ['DATA-001'], 'BUILD-002': ['BUILD-001'], 'BUILD-003': ['BUILD-001'], 'BUILD-004': ['BUILD-001'], 'QA-002': ['QA-001'], 'QA-003': ['QA-002'], 'QA-004': ['QA-001'], 'QA-005': ['QA-001'],
    'SVL-002': ['SVL-001'], 'SVL-003': ['SVL-001'], 'SVL-004': ['SVL-001'], 'RLB-002': ['RLB-001'], 'RLB-003': ['RLB-001'], 'RLB-004': ['RLB-001'], 'RLB-005': ['RLB-004'] };

  function N(k, l, i, s, x) { return Object.assign({ k: k, l: l, i: i, s: s }, x || {}); }
  function G(k, l, i, sub) { return { k: k, l: l, i: i, sub: sub }; }
  var MENU = { k: 'menu', l: L('Menu', 'Menu'), i: 'menu' };
  var F12 = {
    road: N('road12', L('Roadmap Implementasi', 'Implementation Roadmap'), 'target', 'BUILD-001'), env: N('env12', L('Build & Environment', 'Build & Environment'), 'layers', 'IMP-001', { also: ['IMP-002'] }), pipe: N('pipe12', L('Release Pipeline', 'Release Pipeline'), 'route', 'IMP-003'),
    mod: N('mod12', L('Progres Modul', 'Module Progress'), 'list', 'BUILD-002'), map: N('map12', L('Peta Integrasi', 'Integration Map'), 'route', 'BUILD-003'), blk: N('blk12', L('Blocker', 'Blockers'), 'alert', 'BUILD-004'),
    data: N('data12', L('One Data Control', 'One Data Control'), 'database', 'DATA-001', { also: ['DATA-002'] }), own: N('own12', L('Kepemilikan Data', 'Data Ownership'), 'link', 'DATA-002'), dup: N('dup12', L('Review Duplikat', 'Duplicate Review'), 'copy', 'DATA-003'),
    qa: N('qa12', L('QA Dashboard', 'QA Dashboard'), 'flask', 'QA-001'), tc: N('tc12', L('Test Case', 'Test Cases'), 'list', 'QA-002', { also: ['QA-003'] }), e2e: N('e2e12', L('E2E Test', 'E2E Test'), 'route', 'QA-004'), bug: N('bug12', L('Bug', 'Bugs'), 'alert', 'QA-005'),
    acc: N('acc12', L('Validasi Akses', 'Access Validation'), 'usercheck', 'SVL-001'), mx: N('mx12', L('Matriks Izin', 'Permission Matrix'), 'columns', 'SVL-002'), neg: N('neg12', L('Uji Negatif', 'Negative Test'), 'lock', 'SVL-003'), srep: N('srep12', L('Laporan Keamanan', 'Security Report'), 'shield', 'SVL-004'),
    rlb: N('rlb12', L('Reliability Center', 'Reliability Center'), 'gauge', 'RLB-001'), ih: N('ih12', L('Integration Health', 'Integration Health'), 'plug', 'RLB-002'), pf: N('pf12', L('Performa', 'Performance'), 'zap', 'RLB-003'), bkp: N('bkp12', L('Backup', 'Backup'), 'history', 'RLB-004'), rst: N('rst12', L('Restore Test', 'Restore Test'), 'refresh', 'RLB-005')
  };
  M.F12NAV = F12;
  // Group keys Engines B (JFGO) and C (JFHELP) append into (via M.addNav): g-mig12, g-uat12, g-help12, g-go12.
  function navImp() { return [N('home', L('Roadmap', 'Roadmap'), 'target', 'BUILD-001'), G('g-build12', L('Build & Rilis', 'Build & Release'), 'layers', [F12.env, F12.pipe, F12.mod, F12.map, F12.blk]), G('g-qa12', L('Kualitas & Keamanan', 'Quality & Security'), 'flask', [F12.qa, F12.tc, F12.e2e, F12.acc, F12.srep]),
    G('g-data12', L('One Data', 'One Data'), 'database', [F12.data, F12.dup]), G('g-mig12', L('Migrasi Data', 'Data Migration'), 'upload', []), G('g-uat12', L('UAT', 'UAT'), 'usercheck', []), G('g-help12', L('Smart Help & Training', 'Smart Help & Training'), 'help', []),
    G('g-rel12', L('Reliability', 'Reliability'), 'gauge', [F12.rlb, F12.ih, F12.pf, F12.bkp, F12.rst]), G('g-go12', L('Cutover & Go-Live', 'Cutover & Go-Live'), 'flag', [])]; }
  function navQa() { return [N('home', L('QA Dashboard', 'QA Dashboard'), 'flask', 'QA-001'), G('g-qa12', L('Testing', 'Testing'), 'list', [F12.tc, F12.e2e, F12.bug]), G('g-sec12', L('Validasi Keamanan', 'Security Validation'), 'shield', [F12.acc, F12.mx, F12.neg, F12.srep]),
    G('g-uat12', L('UAT', 'UAT'), 'usercheck', []), G('g-build12', L('Build & Rilis', 'Build & Release'), 'layers', [F12.pipe, F12.road, F12.mod, F12.blk]), G('g-rel12', L('Performa', 'Performance'), 'zap', [F12.pf, F12.rlb]), G('g-help12', L('Smart Help', 'Smart Help'), 'help', []), G('g-go12', L('Go-Live', 'Go-Live'), 'flag', [])]; }
  function navData() { return [N('home', L('Migrasi Data', 'Data Migration'), 'upload', 'MIG-001'), G('g-data12', L('One Data', 'One Data'), 'database', [F12.data, F12.own, F12.dup]), G('g-mig12', L('Migrasi & Rekonsiliasi', 'Migration & Reconciliation'), 'upload', []),
    G('g-build12', L('Implementasi', 'Implementation'), 'target', [F12.road, F12.blk]), G('g-help12', L('Smart Help', 'Smart Help'), 'help', []), G('g-go12', L('Cutover', 'Cutover'), 'flag', [])]; }
  function navTrainer() { return [N('home', L('Tutorial Manager', 'Tutorial Manager'), 'help', 'HELP-006'), G('g-help12', L('Smart Help & Training', 'Smart Help & Training'), 'help', []), G('g-uat12', L('UAT & Usability', 'UAT & Usability'), 'usercheck', []), G('g-build12', L('Implementasi', 'Implementation'), 'target', [F12.road])]; }
  function mnav(home) { return [home, N('ntf12', L('Notifikasi', 'Alerts'), 'bell', 'NOTIF-001'), N('help12', L('Bantuan', 'Help'), 'help', 'HELP-001'), N('inc12', L('Lapor Masalah', 'Report a Problem'), 'alert', 'LIVE-003'), MENU]; }
  function role(n, person, title, nav, q, feel, hide) { return { n: n, person: person, title: title, group: 'management', device: 'desktop', site: L('Kantor pusat · proyek implementasi', 'Head office · implementation project'), q: q, feel: feel, nav: nav, mnav: mnav(nav[0]), extra: [], hide: hide, levels: [1, 2, 3, 4] }; }
  M.NEW_ROLES = {
    implead: { x: { exp: 'implead', n: L('Implementation Lead', 'Implementation Lead'), landing: 'BUILD-001', land: 'LAND-003', group: 'management' },
      c: function () { return role(L('Implementation Lead', 'Implementation Lead'), 'Bayu Pradana', L('Implementation Lead · Go-Live Commander', 'Implementation Lead · Go-Live Commander'), navImp(), L('Apakah implementasi on track dan siap go-live?', 'Is the implementation on track and ready to go live?'), L('Terkendali dari build sampai hypercare.', 'In control from build to hypercare.'), [L('Permintaan promosi rilis', 'Release promotion requests'), L('Rekomendasi Go/No-Go ke Owner', 'Go/No-Go recommendation to the Owner')]); } },
    qalead: { x: { exp: 'qalead', n: L('QA & UAT Lead', 'QA & UAT Lead'), landing: 'QA-001', land: 'LAND-003', group: 'management' },
      c: function () { return role(L('QA & UAT Lead', 'QA & UAT Lead'), 'Intan Permata', L('QA & UAT Lead', 'QA & UAT Lead'), navQa(), L('Apa yang belum lulus dan apa yang harus diuji ulang?', 'What has not passed and what must be retested?'), L('Diuji keras, dibuktikan dengan data.', 'Tested hard, proven with data.'), [L('Persetujuan produksi', 'Production approval'), L('Migrasi data', 'Data migration')]); } },
    datalead: { x: { exp: 'datalead', n: L('Data Migration Lead', 'Data Migration Lead'), landing: 'MIG-001', land: 'LAND-003', group: 'management' },
      c: function () { return role(L('Data Migration Lead', 'Data Migration Lead'), 'Dodi Saputra', L('Data Migration Lead', 'Data Migration Lead'), navData(), L('Apakah data bersih, satu sumber, dan sudah direkonsiliasi?', 'Is the data clean, single-source and reconciled?'), L('One data, one source, no double entry.', 'One data, one source, no double entry.'), [L('Persetujuan migrasi (Owner/Finance)', 'Migration approval (Owner/Finance)'), L('Merge otomatis', 'Automatic merges')]); } },
    trainer: { x: { exp: 'trainer', n: L('Training Lead', 'Training Lead'), landing: 'HELP-006', land: 'LAND-003', group: 'management' },
      c: function () { return role(L('Training Lead', 'Training Lead'), 'Ratih Kusuma', L('Training Lead · Smart Help', 'Training Lead · Smart Help'), navTrainer(), L('Siapa yang belum terlatih dan bantuan apa yang perlu diperbaiki?', 'Who is not trained yet and what help needs improving?'), L('Belajar di dalam sistem, bukan dari manual.', 'Learning inside the system, not from manuals.'), [L('Data operasional & keuangan', 'Operational & finance data')]); } }
  };
  function ownerGroup() { return G('g-live12', L('Go-Live', 'Go-Live'), 'flag', [N('cmd12', L('Fase 12 Command Center', 'Phase 12 Command Center'), 'target', 'BUILD-001'), N('gng12', L('Go/No-Go', 'Go/No-Go'), 'flag', 'LIVE-004'), N('live12', L('Go-Live Command Center', 'Go-Live Command Center'), 'gauge', 'LIVE-001'),
    F12.pipe, F12.qa, F12.srep, F12.data, F12.rlb]); }
  function addP(list, extra) { (extra || []).forEach(function (p) { if (list.indexOf(p) < 0) list.push(p); }); }
  function applyRolePerms() {
    var C = M.C, X = M.X; if (!C) return;
    Object.keys(M.ROLE_PERMS).forEach(function (r) { var cr = C.ROLES[r], xr = X && X.ROLES[r]; if (cr) addP(cr.perms = cr.perms || [], M.ROLE_PERMS[r]); if (xr && xr.perms) addP(xr.perms, M.ROLE_PERMS[r]); });
    Object.keys(extraPerms).forEach(function (r) { var cr = C.ROLES[r], xr = X && X.ROLES[r]; if (cr) addP(cr.perms = cr.perms || [], extraPerms[r]); if (xr && xr.perms) addP(xr.perms, extraPerms[r]); });
  }
  var extraPerms = {};
  // addRolePerms(role, perms[]): other Phase 12 engines grant their perms to these roles (kept across JFSYS._reset).
  M.addRolePerms = function (r, perms) { extraPerms[r] = uniq((extraPerms[r] || []).concat(perms || [])); applyRolePerms(); return true; };
  // addNav(role, item, groupKey?): append a nav item (deduped by screen id) to a role's desktop nav or into one of its groups.
  M.addNav = function (r, item, groupKey) {
    var C = M.C, R = C && C.ROLES[r]; if (!R || !item || !item.s) return false;
    function has(list) { return list.some(function (n) { return n.s === item.s || (n.sub && has(n.sub)); }); }
    if (has(R.nav)) return false;
    var g = groupKey ? R.nav.filter(function (n) { return n.k === groupKey && n.sub; })[0] : null;
    if (g) g.sub.push(item); else R.nav.push(item); return true;
  };
  M.install = function (C, Xa, P, CM, LG, PR, DL, FN, CLP, SYS) {
    if (!C || C.__p12imp) return; C.__p12imp = true;
    M.C = C; M.X = Xa || null; M.P = P || null; M.CM = CM || null; M.LG = LG || null; M.PR = PR || null; M.DL = DL || null; M.FN = FN || null; M.CLP = CLP || null; M.SYS = SYS || null;
    Object.keys(M.PERMS).forEach(function (k) { C.PERMS[k] = M.PERMS[k]; });
    M.NEW_ROLE_KEYS.forEach(function (r) {
      var d = M.NEW_ROLES[r], pp = D.PEOPLE[r], cdef = d.c();
      if (!C.ROLES[r]) C.ROLES[r] = Object.assign({ perms: M.ROLE_PERMS[r].slice() }, cdef);
      else { var ex = C.ROLES[r]; ex.perms = ex.perms || []; ['n', 'person', 'title', 'group', 'device', 'site', 'q', 'feel', 'hide', 'levels', 'extra'].forEach(function (k) { if (ex[k] == null) ex[k] = cdef[k]; });
        var old = (ex.nav || []).slice(); ex.nav = cdef.nav; old.forEach(function (n) { if (n.sub) { var g = ex.nav.filter(function (x) { return x.k === n.k && x.sub; })[0]; if (g) n.sub.forEach(function (i) { M.addNav(r, i, n.k); }); else ex.nav.push(n); } else M.addNav(r, n); }); if (!ex.mnav || !ex.mnav.length) ex.mnav = cdef.mnav; }
      if (C.ROLE_ORDER.indexOf(r) < 0) C.ROLE_ORDER.splice(Math.max(0, C.ROLE_ORDER.indexOf('owner')), 0, r);
      if (Xa) {
        if (!Xa.ROLES[r]) Xa.ROLES[r] = Object.assign({ perms: M.ROLE_PERMS[r].slice() }, d.x); else { Xa.ROLES[r].perms = Xa.ROLES[r].perms || []; ['exp', 'n', 'landing', 'land', 'group'].forEach(function (k) { if (Xa.ROLES[r][k] == null) Xa.ROLES[r][k] = d.x[k]; }); }
        if (!Xa.employee(pp.emp.id)) Xa.EMPLOYEES.push(clone(pp.emp));
        if (!Xa.USERS.some(function (u) { return u.u === pp.user.u; })) Xa.USERS.push(clone(pp.user));
        if (!Xa.DEMO.some(function (x2) { return x2.u === pp.demo.u; })) Xa.DEMO.push(clone(pp.demo));
      }
    });
    // Engines that installed before us (JFHELP) may expose ROLE_PERMS for our roles: merge them now.
    [helpEng(), goEng()].forEach(function (E) { if (E && E.ROLE_PERMS) M.NEW_ROLE_KEYS.forEach(function (r) { if (E.ROLE_PERMS[r]) M.addRolePerms(r, E.ROLE_PERMS[r]); }); });
    applyRolePerms();
    var own = C.ROLES.owner;
    if (own && !own.nav.some(function (n) { return n.k === 'g-live12'; })) { var at = own.nav.map(function (n) { return n.k; }).indexOf('brief'); own.nav.splice(at >= 0 ? at + 1 : 1, 0, ownerGroup()); }
    // JFSYS._reset restores role perms to its install-time baseline: re-apply ours afterwards.
    if (SYS && SYS._reset && !SYS.__p12impReset) { SYS.__p12impReset = true; var oR = SYS._reset; SYS._reset = function () { var r = oR.apply(this, arguments); applyRolePerms(); return r; }; }
    // Audit merge: JFSYS.auditAll reads SYS.AUDIT_SOURCES (guarded Phase 12 hook in jfos-sys.js); labels & module joined here.
    if (SYS) {
      SYS.AUDIT_SOURCES = SYS.AUDIT_SOURCES || [];
      if (!SYS.AUDIT_SOURCES.some(function (x) { return x[0] === 'implementation'; })) SYS.AUDIT_SOURCES.push(['implementation', function () { return M.auditLog(); }]);
      if (SYS.AUDIT_MODULES && !SYS.AUDIT_MODULES.some(function (m) { return m[0] === 'implementation'; })) SYS.AUDIT_MODULES.push(['implementation', L('Implementasi (Fase 12)', 'Implementation (Phase 12)')]);
      if (SYS.AUDIT) Object.keys(M.AUDIT).forEach(function (k) { if (!SYS.AUDIT[k]) SYS.AUDIT[k] = M.AUDIT[k]; });
    }
    var orig = C.screen, extra = {};
    M.SCREENS.forEach(function (s) { extra[s.id] = s; });
    C.screen = function (id) { return extra[id] || orig(id); };
    C.SCREENS_P12IMP = M.SCREENS;
    S();
  };
  M._reset = function () { SIM = ms(D.simNow); T0 = Date.now(); seed(); save(); applyRolePerms(); };

  if (typeof module !== 'undefined' && module.exports) module.exports = M;
  else root.JFIMP = M;
})(typeof window !== 'undefined' ? window : this);
