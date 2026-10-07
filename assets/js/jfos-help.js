/* ==========================================================================
   JFRESH OS — Smart Help & Guided Learning engine (Phase 12 · NP-09, §50–§64, §105)
   Contextual help per module/screen/role/status (§52), button help (§53),
   product tour (§54), PANDU SAYA walkthroughs (§55), searchable help center
   with Indonesian normalisation (§56), APA INI? (§57), Tanya JFRESH — a
   rule-based, context-aware assistant that reads the live record status,
   role, permissions and business rules (§58), role-aware help that never
   teaches an action the user cannot perform (§59), short videos (§60),
   training paths and progress (§61–§62), versioned content manager (§63)
   and help analytics + insight (§64, §105).

   ONE DATA: users, roles, permissions, screens, batches, invoices, orders,
   deliveries and Billing Ready are read live from the Phase 4–11 engines; only
   help content, tours, walkthroughs, training paths/progress and help usage
   logs live in this store (key jfos-help-v1). Every permission is checked
   here, never only in the UI. Prototype only.
   ========================================================================== */
(function (root) {
  function req(p) { try { return typeof require !== 'undefined' ? require(p) : null; } catch (e) { return null; } }
  var D = root.JFHELP_DATA || req('./jfos-help-data.js');
  function L(a, b) { return [a, b === undefined ? a : b]; }
  var M = { version: 'NP 1.0', D: D, C: null, X: null, P: null, CM: null, LG: null, PR: null, DL: null, FN: null, CLP: null, SYS: null };
  var DAY = 864e5;
  function clone(o) { return o == null ? o : JSON.parse(JSON.stringify(o)); }
  function by(arr, k, v) { for (var i = 0; i < (arr || []).length; i++) if (arr[i][k] === v) return arr[i]; return null; }
  function T(x) { return Array.isArray(x) ? x[0] : (x == null ? '' : String(x)); }
  function E(x) { return Array.isArray(x) ? x[1] : (x == null ? '' : String(x)); }
  function str(x) { return String(x == null ? '' : x).trim(); }
  function ms(s) { if (typeof s === 'number') return s; if (!s) return 0; var p = String(s).split(/[-: T]/); return Date.UTC(+p[0], +p[1] - 1, +(p[2] || 1), +(p[3] || 0), +(p[4] || 0), +(p[5] || 0)); }
  function iso(t) { return new Date(t).toISOString().slice(0, 10); }
  function isoT(t) { return new Date(t).toISOString().slice(0, 16).replace('T', ' '); }
  function pct(a, b) { return b ? Math.round(a / b * 1000) / 10 : 0; }
  function uniq(a) { return a.filter(function (x, i) { return x != null && a.indexOf(x) === i; }); }
  function tryf(fn, dflt) { try { var v = fn(); return v == null ? dflt : v; } catch (e) { return dflt; } }
  function J(x) { return x == null ? null : typeof x === 'string' ? x : JSON.stringify(x); }
  function fmt(pair, vars) { return [T(pair), E(pair)].map(function (s) { return s.replace(/\{(\w+)\}/g, function (m, k) { var v = vars[k]; return v == null ? '' : Array.isArray(v) ? v[0] : String(v); }); }); }
  function fmt2(pair, vars) { var r = fmt(pair, vars); r[1] = E(pair).replace(/\{(\w+)\}/g, function (m, k) { var v = vars[k]; return v == null ? '' : Array.isArray(v) ? v[1] : String(v); }); return r; }
  M.u = { L: L, T: T, ms: ms, iso: iso, isoT: isoT, pct: pct, clone: clone };

  M.MSG = {
    noperm: L('Anda tidak memiliki izin untuk tindakan ini.', 'You do not have permission for this action.'),
    notfound: L('Data tidak ditemukan.', 'Record not found.'),
    invalid: L('Periksa data dan coba lagi.', 'Check the data and try again.'),
    reason: L('Alasan wajib diisi.', 'A reason is required.'),
    jump: L('Langkah ini belum bisa dilakukan. Ikuti urutan proses.', 'This step is not possible yet. Follow the process order.'),
    dup: L('Data sudah ada.', 'This record already exists.'),
    scope: L('Data ini di luar cakupan Anda.', 'This record is outside your scope.'),
    maker: L('Peserta training tidak boleh menilai dirinya sendiri.', 'A trainee cannot assess their own training.'),
    load: L('Data belum berhasil dimuat.', 'The data could not be loaded.')
  };

  /* ---------- Permissions (§59, §63): role decides the workspace, permission decides the action ---------- */
  M.PERMS = {
    'help.view': L('Smart Help: bantuan, pencarian, Tanya JFRESH, training sendiri', 'Smart Help: help, search, Ask JFRESH, own training'),
    'help.team': L('Lihat progres belajar tim', 'View team learning progress'),
    'help.analytics': L('Lihat analitik & insight bantuan', 'View help analytics & insight'),
    'help.manage': L('Buka Tutorial Manager (konten, draft, jalur training)', 'Open the Tutorial Manager (content, drafts, training paths)'),
    'help.edit': L('Buat, ubah, terbitkan & arsipkan konten bantuan', 'Create, edit, publish & archive help content'),
    'help.assign': L('Tugaskan jalur training', 'Assign training paths'),
    'help.assess': L('Nilai praktik & luluskan training', 'Assess practice & pass training')
  };
  // '*' = every role that exists (incl. client and roles added later by other engines: applied lazily on X.resolve).
  M.ROLE_PERMS = {
    '*': ['help.view'],
    trainer: ['help.view', 'help.team', 'help.analytics', 'help.manage', 'help.edit', 'help.assign', 'help.assess'],
    owner: ['help.team', 'help.analytics', 'help.manage', 'help.assess'],
    superadmin: ['help.team', 'help.analytics', 'help.manage'],
    implead: ['help.team', 'help.analytics', 'help.assign'],
    qalead: ['help.analytics'],
    supervisor: ['help.team', 'help.assign', 'help.assess'],
    opsmgr: ['help.team', 'help.assign', 'help.assess'],
    hr: ['help.team']
  };
  // Supervisors see the operations teams only; the other help.team holders see everyone.
  M.OPS_ROLES = ['operator', 'qc', 'driver', 'prod1', 'prod2', 'prod3', 'maint', 'supervisor'];
  function rolePerms(k) { return uniq((M.ROLE_PERMS['*'] || []).concat(M.ROLE_PERMS[k] || [])); }
  // Engine-side check. ctx.perms is the truth; for help.* perms the role grant is honoured even when the
  // session was resolved before this engine (or a later engine adding the role) was installed — unless denied.
  function can(ctx, p) {
    if (!p) return true;
    if (!ctx) return false;
    if (ctx.perms && ctx.perms.indexOf(p) >= 0) return true;
    if (String(p).indexOf('help.') !== 0 || !ctx.roleKey) return false;
    var deny = ctx.acc && ctx.acc.deny || [], x = X();
    if (!((M.C && M.C.ROLES && M.C.ROLES[ctx.roleKey]) || (x && x.ROLES && x.ROLES[ctx.roleKey]))) return false;
    return rolePerms(ctx.roleKey).indexOf(p) >= 0 && deny.indexOf(p) < 0;
  }
  M.can = can;
  function viewer(ctx) { return !!(ctx && ctx.ok !== false && ctx.uid) && can(ctx, 'help.view'); }
  function uname(ctx) { return ctx && (ctx.user && ctx.user.u || ctx.u) || (ctx && ctx.uid) || null; }
  function empId(ctx) { return ctx && (ctx.employee ? ctx.employee.id : ctx.emp || ctx.uid) || 'system'; }
  function ctxName(ctx) { return ctx && (ctx.fullName || ctx.name) || 'Sistem JFRESH'; }
  M.empId = empId;

  /* ---------- State ---------- */
  var KEY = 'jfos-help-v1', mem = {}, st = null, SIM = ms(D.simNow), T0 = Date.now(), fixed = null, ver = 0, IDX = {};
  var ls = null;
  try { ls = root.localStorage || null; if (ls) { ls.setItem('__jfh', '1'); ls.removeItem('__jfh'); } } catch (e) { ls = null; }
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

  function expand(h) {
    var status = h.status || 'published', data = {
      module: h.mod, screen: h.s, feature: h.feat || null, button: h.btn || null, roles: (h.roles || []).slice(), perm: h.perm || null, kind: h.kind || 'howto',
      title: h.t, description: h.d, steps: (h.st || []).slice(), video: h.vid ? { len: h.vid, src: null, title: h.t } : null, image: h.img || null,
      faq: (h.faq || []).map(function (f) { return { q: f[0], a: f[1] }; }), keywords: str(h.kw).split(/\s+/).filter(Boolean), lang: ['id', 'en'], walk: h.walk || null
    };
    return Object.assign({ id: h.id, v: 1, status: status, archiveReason: h.archiveReason || null, at: '2026-09-01 09:00', by: 'Tim Training',
      vers: [{ v: 1, st: status, at: '2026-09-01 09:00', by: 'Tim Training', reason: L('Konten awal Fase 12', 'Phase 12 initial content'), data: clone(data) }] }, data);
  }
  function seed() {
    st = { v: 1, upd: null, seq: { hlp: 200, aud: 1 }, content: D.CONTENT.map(expand), tours: {}, walks: {}, progress: {}, assign: {},
      searches: [], opens: [], feedback: {}, asks: [], audit: [] };
    Object.keys(D.PROGRESS).forEach(function (u) {
      st.progress[u] = {};
      Object.keys(D.PROGRESS[u]).forEach(function (pid) {
        var r = D.PROGRESS[u][pid], p = pathById(pid); if (!p) return;
        st.progress[u][pid] = { st: r[0], items: p.items.slice(0, r[1]), score: r[2], at: r[3] + ' 09:00', by: r[0] === 'passed' ? 'ratih' : u, practiced: ['practiced', 'passed'].indexOf(r[0]) >= 0 };
      });
    });
    IDX = {};
  }

  /* ---------- Audit (engine-local; merged into JFSYS.auditAll at install) ---------- */
  M.AUDIT = {
    'HELP.CONTENT_CREATE': L('Konten bantuan dibuat', 'Help content created'), 'HELP.CONTENT_EDIT': L('Konten bantuan diubah (versi baru)', 'Help content edited (new version)'),
    'HELP.CONTENT_PUBLISH': L('Konten bantuan diterbitkan', 'Help content published'), 'HELP.CONTENT_ARCHIVE': L('Konten bantuan diarsipkan', 'Help content archived'),
    'HELP.TRAINING_ASSIGN': L('Jalur training ditugaskan', 'Training path assigned'), 'HELP.TRAINING_PROGRESS': L('Progres training dinilai', 'Training progress assessed'),
    'HELP.TRAINING_PASSED': L('Training dinyatakan lulus', 'Training passed'), 'ACCESS.DENIED': L('Akses ditolak', 'Access denied')
  };
  function device() { var ua = root.navigator && root.navigator.userAgent || 'node'; return /iPad|Tablet/i.test(ua) ? 'Tablet' : /Mobi|Android|iPhone/i.test(ua) ? 'Mobile' : (ua === 'node' ? 'Test' : 'Desktop'); }
  M.audit = function (ev, ctx, o) {
    o = o || {};
    var e = { id: 'HAU-' + String(S().seq.aud++).padStart(5, '0'), at: nowS(), ev: ev, uid: ctx && ctx.uid || null, emp: empId(ctx), actor: ctxName(ctx), role: ctx && ctx.roleKey || null, module: o.module || 'help',
      rec: o.rec || null, before: J(o.before), after: J(o.after), reason: o.reason == null ? null : T(o.reason), result: o.result || 'ok', device: ctx && ctx.device || device() };
    S().audit.unshift(e); if (S().audit.length > 1000) S().audit.length = 1000; save();
    return e;
  };
  M.auditLog = function (f) { f = f || {}; return S().audit.filter(function (e) { return (!f.ev || e.ev.indexOf(f.ev) === 0) && (!f.rec || e.rec === f.rec) && (!f.uid || e.uid === f.uid); }); };
  function bad(msg, code, extra) { return Object.assign({ ok: false, code: code || 'invalid', msg: msg || M.MSG.invalid }, extra || {}); }
  function deny(ctx, perm, rec) { M.audit('ACCESS.DENIED', ctx, { rec: rec || perm, after: perm, result: 'denied' }); return { ok: false, code: 'noperm', msg: M.MSG.noperm, perm: perm }; }

  /* ---------- Engines, roles and screens (read live) ---------- */
  function X() { return M.X || root.JFACCESS || null; }
  function screenSpec(id) { return id && M.C && M.C.screen ? tryf(function () { return M.C.screen(id); }, null) : null; }
  M.screenExists = function (id) { return !!screenSpec(id); };
  function roleKeys() { var a = [], C = M.C, x = X(); if (C && C.ROLES) a = a.concat(Object.keys(C.ROLES)); if (x && x.ROLES) a = a.concat(Object.keys(x.ROLES)); return uniq(a); }
  function rolePermsLive(k) { var x = X(); if (x && x.rolePerms && x.ROLES && x.ROLES[k]) return x.rolePerms(k); var r = M.C && M.C.ROLES && M.C.ROLES[k]; return r && r.perms ? r.perms.slice() : []; }
  function roleName(k) { var x = X(), r = x && x.ROLES && x.ROLES[k]; if (r && r.n) return r.n; var c = M.C && M.C.ROLES && M.C.ROLES[k]; return c && c.n ? c.n : L(k); }
  M.roleName = roleName;
  function permName(p) { var n = M.C && M.C.PERMS && M.C.PERMS[p]; return n ? (Array.isArray(n) ? n : L(String(n))) : L(p); }
  M.permName = permName;
  // Who can do it: every role holding the permission (live from X/C), in the C.ROLE_ORDER order.
  M.whoCan = function (perm) {
    if (!perm) return [];
    var order = (M.C && M.C.ROLE_ORDER || []).slice(); roleKeys().forEach(function (k) { if (order.indexOf(k) < 0) order.push(k); });
    return order.filter(function (k) { var p = rolePermsLive(k); return p.indexOf(perm) >= 0 || (perm.indexOf('help.') === 0 && rolePerms(k).indexOf(perm) >= 0 && (M.C.ROLES[k] || (X() && X().ROLES[k]))); })
      .map(function (k) { return { k: k, n: roleName(k) }; });
  };
  function joinNames(list) { return [list.map(function (r) { return T(r.n); }).join(', '), list.map(function (r) { return E(r.n); }).join(', ')]; }

  // Role perms install (§59): idempotent; re-applied on every X.resolve so roles created later (trainer, implead …)
  // and a JFSYS demo reset are covered. Admin removals are respected: an array that already holds one of our perms is left alone.
  function permArrays(k) {
    var out = [], C = M.C, x = X();
    if (C && C.ROLES && C.ROLES[k] && C.ROLES[k].perms) out.push(C.ROLES[k].perms);
    if (x && x.ROLES && x.ROLES[k]) { var r = x.ROLES[k]; if (r.perms) out.push(r.perms); else if (C && C.ROLES[r.exp] && C.ROLES[r.exp].perms) out.push(C.ROLES[r.exp].perms); }
    return out.filter(function (a, i) { return out.indexOf(a) === i; });
  }
  M.applyRolePerms = function () {
    var done = [];
    roleKeys().forEach(function (k) {
      var want = rolePerms(k);
      permArrays(k).forEach(function (arr) {
        var have = want.filter(function (p) { return arr.indexOf(p) >= 0; }).length;
        if (arr.__jfhelp && have > 0) return;
        var added = 0; want.forEach(function (p) { if (arr.indexOf(p) < 0) { arr.push(p); added++; } });
        try { Object.defineProperty(arr, '__jfhelp', { value: true, enumerable: false, configurable: true, writable: true }); } catch (e) { arr.__jfhelp = true; }
        if (added) done.push(k);
      });
    });
    navAppend();
    return { applied: uniq(done) };
  };
  // Navigation: the trainer role (owned by JFIMP) gets a Smart Help group if its nav does not reference HELP-006 yet.
  function N(k, l, i, s, x) { return Object.assign({ k: k, l: l, i: i, s: s }, x || {}); }
  M.NAV = {
    home: N('help12', L('Smart Help', 'Smart Help'), 'help', 'HELP-001', { also: ['HELP-002', 'HELP-003', 'HELP-004', 'HELP-005'] }),
    manager: N('helpmgr12', L('Tutorial Manager', 'Tutorial Manager'), 'edit', 'HELP-006'),
    progress: N('helpprog12', L('Progres Belajar', 'Learning Progress'), 'target', 'HELP-007'),
    search: N('helpq12', L('Cari Bantuan', 'Help Search'), 'search', 'HELP-004'),
    ask: N('helpask12', L('Tanya JFRESH', 'Ask JFRESH'), 'message', 'HELP-005')
  };
  M.NAV.group = { k: 'g-help12', l: L('Smart Help & Training', 'Smart Help & Training'), i: 'help', sub: [M.NAV.manager, M.NAV.progress, M.NAV.home] };
  function navHas(nav, s) { return (nav || []).some(function (n) { return n.s === s || (n.also || []).indexOf(s) >= 0 || (n.sub && navHas(n.sub, s)); }); }
  function navAppend() {
    var R = M.C && M.C.ROLES; if (!R) return;
    var r = R.trainer; if (r && r.nav && !navHas(r.nav, 'HELP-006')) r.nav.push(clone(M.NAV.group));
    // JFIMP leaves an empty 'g-help12' group in the Phase 12 roles' navs for this engine to fill (X.nav drops screens a role cannot open).
    Object.keys(R).forEach(function (k) {
      var nav = R[k] && R[k].nav; if (!nav) return;
      nav.forEach(function (g) { if (g.k !== 'g-help12' || !g.sub) return; [M.NAV.manager, M.NAV.progress, M.NAV.home].forEach(function (it) { if (!navHas(nav, it.s)) g.sub.push(clone(it)); }); });
    });
  }

  /* ---------- Screens HELP-001..007 (HELP-001 keeps the Phase 4 p4:true rule: every role incl. clients) ---------- */
  function sc(id, n, a, p, icon, pur, devs, o) {
    return Object.assign({ id: id, n: n, a: a, p: p, p4: p ? undefined : true, np: 'NP-09', nv: 'NV-09', icon: icon, pur: pur, dom: 'help12', lvl: 2, pN: 12, p12: true, nb: [], bf: ['BF-03'], aud: [],
      dev: 'm', devs: devs, emp: L('Belum ada konten.', 'No content yet.'), err: M.MSG.load, warn: L('Ada yang perlu perhatian.', 'Something needs attention.'), ok: L('Tersimpan.', 'Saved.') }, o || {});
  }
  var ALLDEV = { d: 'primary', t: 'primary', m: 'primary' };
  M.SCREENS = [
    sc('HELP-001', L('Smart Help', 'Smart Help'), 'T03', null, 'help', L('Beranda bantuan: cari bantuan, bantuan untuk peran Anda, video singkat, Tanya JFRESH, tur & progres belajar.', 'Help home: search, help for your role, short videos, Ask JFRESH, tour & learning progress.'), ALLDEV),
    sc('HELP-002', L('Bantuan Kontekstual', 'Contextual Help'), 'T03', null, 'help', L('Apa ini, cara melakukan, bagaimana jika, video dan masalah umum untuk layar, peran dan status saat ini.', 'What is it, how to, what if, video and common issues for the current screen, role and status.'), ALLDEV),
    sc('HELP-003', L('Panduan Interaktif', 'Guided Walkthrough'), 'T03', null, 'pointer', L('PANDU SAYA: sistem menyorot elemen berikutnya di layar asli; progres tersimpan.', 'GUIDE ME: the system highlights the next element on the real screen; progress is saved.'), ALLDEV),
    sc('HELP-004', L('Cari Bantuan', 'Help Search'), 'T05', null, 'search', L('Cari bantuan… dengan bahasa sehari-hari; hasil sesuai peran dan izin.', 'Search help… in everyday words; results follow role and permissions.'), ALLDEV, { emp: L('Tidak ada hasil. Coba kata lain atau Tanya JFRESH.', 'No results. Try other words or Ask JFRESH.') }),
    sc('HELP-005', L('Tanya JFRESH', 'Ask JFRESH'), 'T03', null, 'message', L('Asisten berbasis aturan yang membaca layar, status data, peran, izin dan aturan bisnis.', 'A rule-based assistant reading the screen, record status, role, permissions and business rules.'), ALLDEV),
    sc('HELP-006', L('Tutorial Manager', 'Tutorial Manager'), 'T05', 'help.manage', 'edit', L('Konten bantuan berversi (draft → terbit → arsip), jalur training, analitik & insight bantuan.', 'Versioned help content (draft → published → archived), training paths, help analytics & insight.'), { d: 'primary', t: 'supported', m: 'no' }, { dev: 'd', lvl: 3 }),
    sc('HELP-007', L('Progres Belajar', 'Learning Progress'), 'T05', null, 'target', L('Jalur training per peran: ditugaskan, mulai, selesai, praktik, lulus; tampilan tim untuk supervisor & trainer.', 'Training path per role: assigned, started, completed, practiced, passed; team view for supervisors & trainers.'), { d: 'primary', t: 'primary', m: 'supported' })
  ];
  M.screen = function (id) { return by(M.SCREENS, 'id', id); };
  M.PARENTS = { 'HELP-002': ['HELP-001'], 'HELP-003': ['HELP-001'], 'HELP-004': ['HELP-001'], 'HELP-005': ['HELP-001'], 'HELP-006': ['HELP-001'], 'HELP-007': ['HELP-001'] };

  /* ---------- Content ---------- */
  M.STATUS = { draft: [L('Draft', 'Draft'), 'mute'], published: [L('Terbit', 'Published'), 'ok'], archived: [L('Arsip', 'Archived'), 'warn'] };
  M.KINDS = { howto: L('Cara melakukan', 'How to'), why: L('Kenapa', 'Why'), whatif: L('Bagaimana jika', 'What if'), whatis: L('Apa ini', 'What is it') };
  M.MODULES = D.MODULES;
  function content() { return S().content; }
  function art(id) { return by(content(), 'id', id); }
  function pathById(id) { return by(D.PATHS, 'id', id); }
  function audience(a, ctx) { return a.roles.indexOf('*') >= 0 || (ctx && a.roles.indexOf(ctx.roleKey) >= 0); }
  function canDoArt(ctx, a) { if (!a.perm) return true; if (!can(ctx, a.perm)) return false; var x = X(); return !(x && x.canScreen && M.C && screenSpec(a.screen)) || x.canScreen(ctx, a.screen); }
  function needOf(perm) {
    if (!perm) return null;
    var who = M.whoCan(perm), pn = permName(perm), names = joinNames(who);
    return { perm: perm, permN: pn, roles: who, msg: [
      'Langkah ini butuh izin "' + T(pn) + '" (' + perm + '). Peran Anda belum memilikinya' + (who.length ? '; yang bisa: ' + names[0] : '') + '. Minta supervisor atau admin bila memang tugas Anda.',
      'This needs the "' + E(pn) + '" permission (' + perm + '). Your role does not have it' + (who.length ? '; who can: ' + names[1] : '') + '. Ask your supervisor or admin if it is part of your job.'] };
  }
  M.need = needOf;
  // Role-aware article view (§59): without the permission, no steps, video, FAQ or walkthrough — the requirement instead.
  function view(ctx, a, full) {
    var ok = canDoArt(ctx, a), sp = screenSpec(a.screen);
    var r = { id: a.id, module: a.module, moduleN: D.MODULES[a.module] || L(a.module), screen: a.screen, screenN: sp ? sp.n : L(a.screen), feature: a.feature, button: a.button, roles: a.roles.slice(), perm: a.perm,
      kind: a.kind, kindN: M.KINDS[a.kind], title: a.title, description: a.description, image: a.image, v: a.v, status: a.status, statusN: M.STATUS[a.status][0], lang: a.lang,
      canDo: ok, forYou: audience(a, ctx), steps: ok ? a.steps.slice() : null, video: ok ? a.video : null, faq: ok ? a.faq.slice() : [], walk: ok ? a.walk : null, need: ok ? null : needOf(a.perm), keywords: a.keywords.slice() };
    if (full && can(ctx, 'help.manage')) { r.versions = a.vers.map(function (v) { return { v: v.v, st: v.st, at: v.at, by: v.by, reason: v.reason }; }); r.archiveReason = a.archiveReason; r.draft = draftOf(a) ? { v: draftOf(a).v, at: draftOf(a).at, by: draftOf(a).by } : null; }
    return r;
  }
  function visible(ctx, a) { return a.status === 'published' || can(ctx, 'help.manage'); }
  M.articles = function (ctx, f) {
    if (!viewer(ctx)) return [];
    f = f || {};
    return content().filter(function (a) {
      return visible(ctx, a) && (!f.status || a.status === f.status) && (!f.module || a.module === f.module) && (!f.screen || a.screen === f.screen) && (!f.kind || a.kind === f.kind) &&
        (!f.mine || audience(a, ctx)) && (!f.role || a.roles.indexOf(f.role) >= 0 || a.roles.indexOf('*') >= 0);
    }).map(function (a) { return view(ctx, a, false); });
  };
  // Help for my role (HELP-001): articles for my role that I can actually do first.
  M.forMe = function (ctx, limit) {
    if (!viewer(ctx)) return [];
    var rows = M.articles(ctx, { status: 'published' }).filter(function (a) { return a.forYou && a.canDo; });
    rows.sort(function (a, b) { return (a.roles.indexOf('*') >= 0) - (b.roles.indexOf('*') >= 0) || (a.kind === 'howto' ? 0 : 1) - (b.kind === 'howto' ? 0 : 1); });
    return limit ? rows.slice(0, limit) : rows;
  };
  M.article = function (ctx, id, o) {
    if (!viewer(ctx)) return null;
    var a = art(id); if (!a || !visible(ctx, a)) return null;
    o = o || {};
    if (o.log !== false && a.status === 'published') { S().opens.push({ at: nowS(), id: id, uid: ctx.uid, u: uname(ctx), role: ctx.roleKey, src: o.src || 'direct' }); trim('opens'); save(); }
    var r = view(ctx, a, true);
    r.related = content().filter(function (x) { return x.id !== id && x.status === 'published' && (x.screen === a.screen || (x.feature && x.feature === a.feature)); }).slice(0, 5).map(function (x) { return { id: x.id, title: x.title, kind: x.kind, canDo: canDoArt(ctx, x) }; });
    r.feedback = fbOf(id); r.myFeedback = (S().feedback[id] || {})[uname(ctx)] || null;
    return r;
  };
  function trim(k) { var a = S()[k]; if (a.length > 3000) a.splice(0, a.length - 3000); }

  /* ---------- Search (§56): Indonesian normalisation ---------- */
  var STOP = {};
  ('cara caranya bagaimana gimana gmn how to do does did i the a an untuk utk buat2 yang yg di ke dari dan atau saya aku gue gw mau ingin bisa bisakah apa ini itu dong tolong please what is are of in on for my me can could ' +
    'nya sih kah lah ya deh nih kok with by and or am be its it this that').split(' ').forEach(function (w) { if (w) STOP[w] = 1; });
  var ROOTS = {};
  ('buat terima timbang kirim setuju bayar cuci kering lipat setrika pilah sortir koreksi batal catat minta lapor aju tagih proses periksa pakai ubah tambah hapus cari lihat pantau lacak jemput antar ganti atur ' +
    'tutup buka hitung pisah gabung kemas tolak serah cetak unduh isi pilih tekan simpan mulai selesai tunda tahan rilis terbit baca kelola undang masuk beli jual ambil jadwal tanya bantu ajar latih nilai lulus ' +
    'tugas kerja rawat perbaik tempel pindah sesuai cocok kurang lebih beda hilang rusak noda tanda tangan kunci').split(' ').forEach(function (w) { if (w) ROOTS[w] = 1; });
  var SYN = {
    bikin: 'buat', create: 'buat', make: 'buat', build: 'buat', receive: 'terima', receiving: 'terima', weigh: 'timbang', weighing: 'timbang', scale: 'timbang', weight: 'berat',
    wash: 'cuci', washing: 'cuci', dry: 'kering', drying: 'kering', sort: 'sortir', sorting: 'sortir', pilah: 'sortir', pack: 'packing', kemas: 'packing', packaging: 'packing',
    handover: 'handover', serah: 'handover', send: 'kirim', deliver: 'kirim', delivery: 'kirim', rilis: 'release', logistik: 'logistics', jemput: 'pickup', approve: 'setuju', approval: 'setuju', acc: 'setuju',
    reject: 'tolak', cancel: 'batal', pay: 'bayar', payment: 'bayar', faktur: 'invoice', tagih: 'invoice', bill: 'invoice', invoices: 'invoice', correct: 'koreksi', correction: 'koreksi', revisi: 'koreksi', perbaiki: 'koreksi', fix: 'koreksi', edit: 'ubah',
    complaint: 'komplain', keluh: 'komplain', keluhan: 'komplain', problem: 'masalah', issue: 'masalah', problems: 'masalah', pengguna: 'user', users: 'user', sandi: 'password', forgot: 'lupa',
    stock: 'stok', persediaan: 'stok', inventory: 'stok', purchase: 'beli', pembelian: 'beli', request: 'minta', cash: 'kas', close: 'tutup', track: 'lacak', tracking: 'lacak', schedule: 'jadwal',
    difference: 'selisih', beda: 'selisih', help: 'bantu', quality: 'qc', machine: 'mesin', print: 'cetak', why: 'kenapa', mengapa: 'kenapa', napa: 'kenapa', not: 'tidak', gak: 'tidak', nggak: 'tidak', ga: 'tidak', tak: 'tidak',
    yet: 'belum', button: 'tombol', active: 'aktif', training: 'latih', pelatihan: 'latih', tutorial: 'latih', video: 'video', bag: 'bag', bags: 'bag', customer: 'klien', client: 'klien', pelanggan: 'klien'
  };
  function words(s) { return String(s == null ? '' : s).toLowerCase().replace(/['’`]/g, '').replace(/[^a-z0-9]+/g, ' ').trim().split(/\s+/).filter(Boolean); }
  function cands(w) {
    var out = [w], sfx = [w];
    ['nya', 'lah', 'kah'].forEach(function (s) { if (w.length > s.length + 3 && w.slice(-s.length) === s) sfx.push(w.slice(0, -s.length)); });
    sfx.slice().forEach(function (b) { ['kan', 'an', 'i'].forEach(function (s) { if (b.length > s.length + 3 && b.slice(-s.length) === s) sfx.push(b.slice(0, -s.length)); }); });
    var PRE = [['meng', ['', 'k']], ['meny', ['s']], ['mem', ['', 'p']], ['men', ['', 't']], ['me', ['']], ['peng', ['', 'k']], ['peny', ['s']], ['pem', ['', 'p']], ['pen', ['', 't']], ['per', ['']], ['pe', ['']],
      ['di', ['']], ['ber', ['']], ['be', ['']], ['ter', ['']], ['se', ['']], ['ke', ['']]];
    sfx.forEach(function (b) {
      if (out.indexOf(b) < 0) out.push(b);
      PRE.forEach(function (p) { if (b.length > p[0].length + 2 && b.indexOf(p[0]) === 0) p[1].forEach(function (r) { var c = r + b.slice(p[0].length); if (out.indexOf(c) < 0) out.push(c); }); });
    });
    return out;
  }
  function stem(w) {
    if (SYN[w]) return SYN[w];
    if (ROOTS[w] || w.length <= 3) return w;
    var c = cands(w);
    for (var i = 0; i < c.length; i++) { if (SYN[c[i]]) return SYN[c[i]]; if (ROOTS[c[i]]) return c[i]; }
    return w;
  }
  M.stem = stem;
  // normalize("Bagaimana cara bikin invoice?") → ['buat', 'invoice']
  M.normalize = function (q) { return uniq(words(q).filter(function (w) { return !STOP[w]; }).map(stem).filter(function (w) { return w && !STOP[w]; })); };
  function toks(x) { if (x == null) return []; if (Array.isArray(x) && x.length === 2 && typeof x[0] === 'string' && typeof x[1] === 'string') return M.normalize(x[0] + ' ' + x[1]); if (Array.isArray(x)) return [].concat.apply([], x.map(toks)); return M.normalize(x); }
  function index(a) {
    var key = a.id + '@' + a.v + '@' + a.status; if (IDX[a.id] && IDX[a.id].key === key) return IDX[a.id];
    var bt = a.button ? M.normalize(a.button) : [];
    var ix = { key: key, t: toks(a.title), k: uniq(toks(a.keywords.join(' '))), b: bt, f: uniq(toks([a.feature || '', T(D.MODULES[a.module] || ''), E(D.MODULES[a.module] || '')].join(' '))),
      d: toks(a.description), s: uniq(toks(a.steps).concat(toks(a.faq.map(function (f) { return [f.q, f.a]; })))) };
    ix.tset = uniq(ix.t);
    IDX[a.id] = ix; return ix;
  }
  function score(a, q, ctx) {
    var ix = index(a), sc0 = 0, m = 0, tm = 0;
    q.forEach(function (w) {
      var s = ix.tset.indexOf(w) >= 0 ? 5 : ix.k.indexOf(w) >= 0 ? 3 : ix.b.indexOf(w) >= 0 ? 3 : ix.f.indexOf(w) >= 0 ? 2 : ix.d.indexOf(w) >= 0 ? 1.5 : ix.s.indexOf(w) >= 0 ? 1 : 0;
      if (s) { m++; sc0 += s; } if (ix.tset.indexOf(w) >= 0) tm++;
    });
    if (!m) return null;
    var cov = m / q.length; if (q.length >= 2 && cov < 0.5) return null;
    return { score: Math.round(sc0 * (0.5 + cov) * 100) / 100, matched: m, cov: cov, tcov: ix.tset.length ? tm / ix.tset.length : 0, mine: ctx && audience(a, ctx) && a.roles.indexOf('*') < 0 ? 1 : 0 };
  }
  function rank(ctx, q, opt) {
    opt = opt || {};
    var rows = [];
    content().forEach(function (a) {
      if (a.status !== 'published' && !(opt.all && can(ctx, 'help.manage'))) return;
      var s = score(a, q, ctx); if (!s || s.score < 2) return;
      rows.push({ a: a, s: s });
    });
    rows.sort(function (x, y) { return y.s.score - x.s.score || y.s.tcov - x.s.tcov || y.s.mine - x.s.mine || (x.a.id < y.a.id ? -1 : 1); });
    return rows;
  }
  M.search = function (ctx, q, o) {
    if (!viewer(ctx)) return null;
    o = o || {};
    var raw = str(q), norm = M.normalize(raw), rows = norm.length ? rank(ctx, norm, o) : [];
    var lim = o.limit || 10, results = rows.slice(0, lim).map(function (r) {
      var v = view(ctx, r.a, false);
      return { id: v.id, title: v.title, description: v.description, module: v.module, moduleN: v.moduleN, screen: v.screen, screenN: v.screenN, kind: v.kind, kindN: v.kindN, canDo: v.canDo, need: v.need, forYou: v.forYou, video: !!v.video, walk: v.walk, score: r.s.score };
    });
    var g = [];
    Object.keys(D.GLOSSARY).forEach(function (k) { var x = D.GLOSSARY[k]; var t = M.normalize(T(x.t) + ' ' + E(x.t) + ' ' + (x.al || []).join(' ') + ' ' + k); if (norm.some(function (w) { return t.indexOf(w) >= 0; }) && norm.length <= 2) g.push({ key: k, term: x.t, def: x.d }); });
    if (raw && o.log !== false) { S().searches.push({ at: nowS(), q: raw.slice(0, 120), norm: norm.join(' '), n: rows.length, uid: ctx.uid, u: uname(ctx), role: ctx.roleKey }); trim('searches'); save(); }
    return { q: raw, norm: norm, total: rows.length, results: results, glossary: g.slice(0, 3), unanswered: rows.length === 0,
      suggest: rows.length ? [] : M.forMe(ctx, 3).map(function (a) { return { id: a.id, title: a.title }; }), contact: contactOf(ctx) };
  };
  function contactOf(ctx) { return ctx && ctx.client ? { msg: L('Masih bingung? Hubungi tim J\'Fresh lewat Bantuan & Masalah.', 'Still stuck? Contact the J\'Fresh team via Help & Issues.'), s: 'CLP-010' } : { msg: L('Masih bingung? Hubungi supervisor Anda atau admin sistem.', 'Still stuck? Contact your supervisor or the system admin.'), s: null }; }

  /* ---------- APA INI? (§57) ---------- */
  function glossKey(key) {
    var k = String(key || '').toLowerCase().replace(/[^a-z0-9]/g, ''); if (D.GLOSSARY[k]) return k;
    var hit = null; Object.keys(D.GLOSSARY).some(function (g) { var x = D.GLOSSARY[g]; var al = [T(x.t), E(x.t)].concat(x.al || []).map(function (s) { return String(s).toLowerCase().replace(/[^a-z0-9]/g, ''); }); if (al.indexOf(k) >= 0) { hit = g; return true; } return false; });
    return hit;
  }
  M.whatIs = function (key, ctx) {
    var k = glossKey(key);
    if (k) { var x = D.GLOSSARY[k], sp = screenSpec(x.s); return { key: k, term: x.t, def: x.d, screen: x.s, screenN: sp ? sp.n : null, kind: 'term' }; }
    var b = M.buttonHelp(key, ctx); if (b) return { key: b.key, term: b.label, def: b.purpose, screen: b.screen, kind: 'button', button: b };
    var sp2 = screenSpec(String(key || '').toUpperCase()); if (sp2) return { key: sp2.id, term: sp2.n, def: sp2.pur || sp2.n, screen: sp2.id, kind: 'screen' };
    return null;
  };
  M.glossary = function () { return Object.keys(D.GLOSSARY).map(function (k) { var x = D.GLOSSARY[k]; return { key: k, term: x.t, def: x.d, screen: x.s }; }); };

  /* ---------- Button help (§53) ---------- */
  function btnKey(key) {
    if (D.BUTTONS[key]) return key;
    var w = String(key || '').toLowerCase().replace(/\s+/g, ' ').trim(), hit = null;
    Object.keys(D.BUTTONS).some(function (k) { var b = D.BUTTONS[k]; if ([T(b.l), E(b.l)].map(function (s) { return s.toLowerCase(); }).indexOf(w) >= 0) { hit = k; return true; } return false; });
    return hit;
  }
  function btnAllowed(ctx, b) { if (b.perm) return can(ctx, b.perm); if (b.roles) return !!ctx && b.roles.indexOf(ctx.roleKey) >= 0; return true; }
  M.buttonHelp = function (key, ctx) {
    var k = btnKey(key); if (!k) return null;
    var b = D.BUTTONS[k], sp = screenSpec(b.s);
    var r = { key: k, label: b.l, screen: b.s, screenN: sp ? sp.n : null, p12: !!b.p12, purpose: b.p, conditions: b.c.slice(), after: b.a, perm: b.perm || null, permN: b.perm ? permName(b.perm) : null,
      roles: b.roles ? b.roles.slice() : null, hlp: b.hlp || null, why: b.why || null, who: b.perm ? M.whoCan(b.perm) : (b.roles || []).map(function (k2) { return { k: k2, n: roleName(k2) }; }) };
    if (ctx) { r.allowed = btnAllowed(ctx, b); r.need = r.allowed ? null : (b.perm ? needOf(b.perm) : { perm: null, roles: r.who, msg: L('Hanya ' + T(joinNames(r.who)) + ' yang bisa menekan tombol ini.', 'Only ' + E(joinNames(r.who)) + ' can press this button.') }); }
    return r;
  };
  M.buttons = function (screenId) { return Object.keys(D.BUTTONS).filter(function (k) { return !screenId || D.BUTTONS[k].s === screenId; }).map(function (k) { return M.buttonHelp(k); }); };

  /* ---------- Live record context (read from the owner engines; scope-checked) ---------- */
  function lbl(x) { return Array.isArray(x) && Array.isArray(x[0]) ? x[0] : x; }
  function recInfo(ctx, rec) {
    if (!rec) return null;
    var id = String(rec), PR = M.PR, FN = M.FN, DL = M.DL, LG = M.LG, CM = M.CM, r = null;
    if (/^B-/.test(id) && PR) { var b = PR.batch(id); if (b) r = { kind: 'batch', id: id, st: b.stage, label: lbl(PR.STAGE[b.stage]) || L(b.stage), cl: b.cl, o: b }; }
    else if (/^RCV-/.test(id) && PR) { var rc = PR.rcv(id); if (rc) r = { kind: 'receiving', id: id, st: rc.stage, label: lbl(PR.RCV_ST[rc.stage]) || L(rc.stage), cl: rc.cl, o: rc }; }
    else if (/^INV-/.test(id) && FN) { var iv = FN.invoice(id); if (iv) { var s0 = FN.invSt(iv); r = { kind: 'invoice', id: id, st: s0, label: lbl(FN.INV_ST[s0]) || L(s0), cl: iv.cl, o: iv }; } }
    else if (/^BR-/.test(id) && FN) { var br = FN.brRec(id); if (br) r = { kind: 'billing', id: id, st: br.st, label: L(br.st), cl: br.cl, o: br }; }
    else if (/^REL-/.test(id) && DL) { var rl = DL.rel(id); if (rl) { var s1 = DL.relSt(rl), v = DL.relView(rl); r = { kind: 'release', id: id, st: s1, label: lbl(DL.REL_ST[s1]) || L(s1), cl: v ? v.cl : null, o: rl }; } }
    else if (/^DLV-/.test(id) && DL) { var d = DL.dlv(id); if (d) r = { kind: 'delivery', id: id, st: d.st, label: lbl(DL.DLV_ST[d.st]) || L(d.st), cl: d.cl, o: d }; }
    else if (/^ORD-/.test(id) && LG) { var o = LG.order(id); if (o) r = { kind: 'order', id: id, st: o.st, label: lbl(LG.ST[o.st]) || L(o.st), cl: o.cl, o: o }; }
    else if (/^CL-/.test(id) && CM) { var c = CM.client(id); if (c) r = { kind: 'client', id: id, st: c.status, label: L(c.n), cl: id, o: c }; }
    if (!r) return null;
    // Scope (§63): a client never learns about another client's records; staff follow the access layer's plant scope.
    if (ctx && ctx.client && r.cl !== ctx.client) return { kind: r.kind, id: id, scope: false };
    var x = X(); if (ctx && !ctx.client && x && x.inScope && r.kind !== 'client' && !tryf(function () { return x.inScope(ctx, r.o); }, true)) return { kind: r.kind, id: id, scope: false };
    r.scope = true; return r;
  }
  M.recordInfo = function (ctx, rec) { if (!viewer(ctx)) return null; var r = recInfo(ctx, rec); if (!r) return null; if (!r.scope) return { kind: r.kind, id: r.id, scope: false }; return { kind: r.kind, id: r.id, st: r.st, label: r.label, cl: r.cl, scope: true }; };

  // Business-rule evaluation of a button on a live record → why it is (not) available, who can do it, the next step.
  function stageName(s) { return M.PR && M.PR.STAGE[s] ? M.PR.STAGE[s][0] : L(s); }
  var EVAL = {
    pack: function (ctx, info) {
      var b = info.o, PR = M.PR, s = b.stage, out = { reasons: [], rules: [], next: null, ok: false };
      var qcOk = !!(b.qc && (b.qc.res === 'pass' || b.qc.res === 'partial') && b.qc.pass > 0), idx = PR.stageIdx(s), pq = PR.stageIdx('pack_q');
      if (s === 'hold') { out.rules.push('pack.hold'); out.reasons.push(fmt(L('Batch {id} sedang Ditahan supervisor ({why}). Packing baru bisa setelah hold dilepas.', 'Batch {id} is On Hold by a supervisor ({why}). Packing is possible after the hold is released.'), { id: b.id, why: b.hold && b.hold.reason || '—' })); }
      else if (s === 'qc_q' || (idx >= 0 && idx < pq)) {
        out.rules.push('pack.qc');
        out.reasons.push(fmt2(L('Batch {id} masih "{st}". Packing hanya untuk barang yang sudah lulus QC: QC harus selesai (LULUS) dulu di Keputusan QC.', 'Batch {id} is still "{st}". Only QC-passed items can be packed: QC must be completed (PASS) first on QC Decision.'), { id: b.id, st: stageName(s) }));
        out.next = { s: s === 'qc_q' ? 'PROD-QC-002' : 'PROD-TRACE-001', rec: b.id, l: s === 'qc_q' ? L('Buka Keputusan QC', 'Open QC Decision') : L('Telusur batch', 'Trace the batch'), perm: s === 'qc_q' ? 'prod.t3' : null };
        out.doer = { perm: 'prod.t3', what: L('QC', 'QC') };
      } else if (s === 'pack_q') {
        var packed = PR.packedQty(b);
        if (!qcOk) { out.rules.push('pack.qc'); out.reasons.push(fmt(L('QC batch {id} belum lulus. Tanpa QC lulus, packing hanya boleh oleh supervisor dengan alasan (override tercatat).', 'Batch {id} has not passed QC. Without a QC pass, packing is only allowed for a supervisor with a reason (override audited).'), { id: b.id })); out.doer = { perm: 'prod.spv', what: L('override', 'override') }; }
        else if (packed >= b.qc.pass) { out.rules.push('pack.done'); out.reasons.push(fmt(L('Semua barang lulus QC di batch {id} sudah dipacking.', 'Every QC-passed item of batch {id} is already packed.'), { id: b.id })); }
        else { out.ok = true; out.rules.push('pack.ready'); out.reasons.push(fmt(L('Batch {id} sudah lulus QC ({n} pcs) dan menunggu packing: tombol Packing aktif untuk Team 3.', 'Batch {id} passed QC ({n} pcs) and waits for packing: the Packing button is active for Team 3.'), { id: b.id, n: b.qc.pass - packed })); }
      } else { out.rules.push('pack.done'); out.reasons.push(fmt2(L('Batch {id} sudah melewati packing (status "{st}").', 'Batch {id} is past packing (status "{st}").'), { id: b.id, st: stageName(s) })); }
      return out;
    },
    'qc.pass': function (ctx, info) {
      var b = info.o, s = b.stage, out = { reasons: [], rules: [], ok: s === 'qc_q', next: null };
      if (s === 'qc_q') { out.rules.push('qc.ready'); out.reasons.push(fmt(L('Batch {id} menunggu QC: periksa lalu tekan LULUS atau ADA MASALAH.', 'Batch {id} waits for QC: check it then press PASS or ADA MASALAH.'), { id: b.id })); }
      else if (M.PR.stageIdx(s) >= 0 && M.PR.stageIdx(s) < M.PR.stageIdx('qc_q')) { out.rules.push('qc.early'); out.reasons.push(fmt2(L('Batch {id} masih "{st}". QC dilakukan setelah finishing selesai.', 'Batch {id} is still "{st}". QC happens after finishing is done.'), { id: b.id, st: stageName(s) })); }
      else { out.rules.push('qc.done'); out.reasons.push(fmt2(L('QC batch {id} sudah diputuskan (status "{st}").', 'QC of batch {id} is already decided (status "{st}").'), { id: b.id, st: stageName(s) })); }
      return out;
    },
    ready: function (ctx, info) {
      var b = info.o, out = { reasons: [], rules: [], ok: false };
      if (b.stage !== 'packed') { out.rules.push('ready.stage'); out.reasons.push(fmt2(L('SIAP DIKIRIM hanya setelah Packing Selesai; batch {id} berstatus "{st}".', 'READY TO DELIVER only after Packing Done; batch {id} is "{st}".'), { id: b.id, st: stageName(b.stage) })); return out; }
      var rc = M.PR.reconcile(b);
      if (!rc.ok) { out.rules.push('ready.reconcile'); out.reasons.push(L('Rekonsiliasi belum sesuai: ' + rc.gaps.map(T).join(' '), 'Reconciliation does not match: ' + rc.gaps.map(E).join(' '))); out.doer = { perm: 'prod.spv', what: L('persetujuan supervisor', 'supervisor approval') }; }
      else { out.ok = true; out.rules.push('ready.ok'); out.reasons.push(L('Rekonsiliasi sesuai; tombol aktif.', 'Reconciliation matches; the button is active.')); }
      return out;
    },
    release: function (ctx, info) {
      var DL = M.DL, rl = info.kind === 'release' ? info.o : by(DL.state().rel, 'batch', info.id), out = { reasons: [], rules: [], ok: false };
      if (!rl) { out.rules.push('release.none'); out.reasons.push(fmt(L('Belum ada antrian release untuk {id}: batch harus Siap Kirim dulu.', 'There is no release for {id} yet: the batch must be Ready to Deliver first.'), { id: info.id })); return out; }
      var s0 = DL.relSt(rl);
      if (s0 === 'released') { out.rules.push('release.done'); out.reasons.push(fmt(L('{id} sudah di-release.', '{id} is already released.'), { id: rl.id })); return out; }
      if (s0 === 'hold' || s0 === 'issue') { out.rules.push('release.' + s0); out.reasons.push(s0 === 'hold' ? L('Release ditahan: lepas hold dulu.', 'The release is on hold: release the hold first.') : L('Ada masalah terbuka: selesaikan dulu.', 'An issue is open: resolve it first.')); return out; }
      var fail = DL.relChecks(rl).filter(function (c) { return !c.ok; });
      if (fail.length) { out.rules.push('release.checks'); out.reasons.push(L('Cek yang belum lolos: ' + fail.map(function (c) { return T(c.n) + ' (' + c.v + ')'; }).join(', ') + '.', 'Checks not passed: ' + fail.map(function (c) { return E(c.n) + ' (' + c.v + ')'; }).join(', ') + '.')); out.fail = fail.map(function (c) { return c.k; }); }
      else { out.ok = true; out.rules.push('release.ok'); out.reasons.push(L('Semua cek lolos: siap RELEASE KE LOGISTICS.', 'Every check passed: ready to RELEASE TO LOGISTICS.')); }
      out.next = { s: 'REL-002', rec: rl.id, l: L('Buka detail release', 'Open the release detail') };
      return out;
    },
    'invoice.build': function (ctx, info) {
      var FN = M.FN, out = { reasons: [], rules: [], ok: false }, cl = info.kind === 'client' ? info.id : info.cl;
      if (info.kind === 'billing') {
        var br = info.o; if (br.st !== 'unbilled') { out.rules.push('inv.billed'); out.reasons.push(fmt(L('{id} sudah masuk invoice ({inv}).', '{id} is already on an invoice ({inv}).'), { id: br.id, inv: br.inv || '—' })); return out; }
      }
      if (info.kind === 'invoice') { out.rules.push('inv.exists'); out.reasons.push(fmt2(L('Invoice {id} sudah ada (status "{st}"). Untuk mengubahnya gunakan Koreksi Invoice.', 'Invoice {id} already exists (status "{st}"). Use Correct Invoice to change it.'), { id: info.id, st: info.label })); return out; }
      var open = FN.state().br.filter(function (b) { return b.cl === cl && b.st === 'unbilled'; });
      if (!open.length) { out.rules.push('inv.nobr'); out.reasons.push(fmt(L('Belum ada transaksi Billing Ready yang belum ditagih untuk {cl}. Invoice hanya dibuat dari Billing Ready: pastikan delivery sudah POD, Service Completed, dan dikirim ke Finance.', 'There is no unbilled Billing Ready transaction for {cl}. Invoices come only from Billing Ready: make sure the delivery has a POD, is Service Completed and was sent to Finance.'), { cl: cl })); out.next = { s: 'BILL-001', l: L('Cek Antrian Billing Ready', 'Check the Billing Ready queue'), perm: 'dlv.bill.view' }; }
      else { out.ok = true; out.rules.push('inv.ready'); out.reasons.push(fmt(L('{n} transaksi Billing Ready siap ditagih untuk {cl}.', '{n} Billing Ready transactions are ready to invoice for {cl}.'), { n: open.length, cl: cl })); out.next = { s: 'AR-001', q: { cl: cl }, l: L('Buka Antrian Billing Ready', 'Open the Billing Ready queue'), perm: 'ar.view' }; }
      return out;
    },
    'invoice.approve': function (ctx, info) {
      var iv = info.o, FN = M.FN, out = { reasons: [], rules: [], ok: false };
      if (iv.st !== 'review') { out.rules.push('inv.notreview'); out.reasons.push(fmt2(L('Hanya invoice berstatus Review yang bisa disetujui; {id} berstatus "{st}".', 'Only invoices in Review can be approved; {id} is "{st}".'), { id: iv.id, st: info.label })); return out; }
      if (FN.invNeedsSecond(iv) && iv.by === empId(ctx)) { out.rules.push('inv.maker'); out.reasons.push(L('Anda pembuat invoice ini; karena di atas batas atau ada diskon manual, harus disetujui orang lain (maker-checker).', 'You built this invoice; above the limit or with a manual discount it must be approved by someone else (maker-checker).')); return out; }
      out.ok = true; out.rules.push('inv.approve.ok'); out.reasons.push(L('Invoice siap disetujui.', 'The invoice is ready to approve.')); return out;
    },
    'invoice.issue': function (ctx, info) {
      var iv = info.o, out = { reasons: [], rules: [], ok: iv.st === 'approved' };
      out.rules.push(out.ok ? 'inv.issue.ok' : 'inv.notapproved');
      out.reasons.push(out.ok ? L('Invoice disetujui: siap diterbitkan.', 'The invoice is approved: ready to issue.') : fmt2(L('Invoice harus Disetujui dulu; {id} berstatus "{st}".', 'The invoice must be Approved first; {id} is "{st}".'), { id: iv.id, st: info.label }));
      return out;
    },
    'payment.record': function (ctx, info) {
      var s0 = info.st, out = { reasons: [], rules: [], ok: ['issued', 'partial', 'overdue'].indexOf(s0) >= 0 };
      out.rules.push(out.ok ? 'pay.ok' : 'pay.state');
      out.reasons.push(out.ok ? fmt(L('Sisa tagihan {id}: Rp {amt}.', 'Open balance of {id}: Rp {amt}.'), { id: info.id, amt: String(M.FN.openOf(info.o)).replace(/\B(?=(\d{3})+(?!\d))/g, '.') }) : fmt2(L('Pembayaran hanya untuk invoice Terbit / Sebagian / Jatuh Tempo; {id} berstatus "{st}".', 'Payments only for Issued / Partial / Overdue invoices; {id} is "{st}".'), { id: info.id, st: info.label }));
      return out;
    },
    'ho.send': function (ctx, info) {
      var b = info.o, out = { reasons: [], rules: [], ok: ['ready', 'fin_ready', 'rtd'].indexOf(b.stage) >= 0 };
      out.rules.push(out.ok ? 'ho.ok' : 'ho.stage');
      out.reasons.push(out.ok ? fmt(L('Batch {id} siap diserahkan ke tim berikutnya.', 'Batch {id} is ready for the next team.'), { id: b.id }) : fmt2(L('Handover hanya di tahap akhir tim (Siap Produksi / Siap Finalisasi / Siap Kirim); batch {id} berstatus "{st}".', 'Handover only at the team\'s last stage (Ready for Production / Ready for Finalization / Ready to Deliver); batch {id} is "{st}".'), { id: b.id, st: stageName(b.stage) }));
      if (!out.ok) return out;
      var kind = b.stage === 'ready' ? 't1t2' : b.stage === 'fin_ready' ? 't2t3' : 't3log'; out.perm = M.PR.HO_KIND[kind].perm; return out;
    }
  };
  EVAL.ho3l = function (ctx, info) { var b = info.o, out = { reasons: [], rules: [], ok: b.stage === 'rtd' }; out.rules.push(out.ok ? 'ho3l.ok' : 'ho3l.stage'); out.reasons.push(out.ok ? fmt(L('Batch {id} Siap Kirim: serahkan ke driver.', 'Batch {id} is Ready to Deliver: hand it to the driver.'), { id: b.id }) : fmt2(L('Serahkan ke Logistics hanya untuk batch Siap Kirim; batch {id} berstatus "{st}".', 'Hand over to Logistics only for Ready to Deliver batches; batch {id} is "{st}".'), { id: b.id, st: stageName(b.stage) })); return out; };
  var EVAL_KIND = { pack: ['batch'], 'qc.pass': ['batch'], ready: ['batch'], ho3l: ['batch'], 'ho.send': ['batch'], release: ['release', 'batch'], 'invoice.build': ['client', 'billing', 'invoice'], 'invoice.approve': ['invoice'], 'invoice.issue': ['invoice'], 'payment.record': ['invoice'] };
  M.evalButton = function (ctx, key, rec) {
    if (!viewer(ctx)) return null;
    var k = btnKey(key); if (!k) return null;
    var b = D.BUTTONS[k], info = rec ? recInfo(ctx, rec) : null, perm = b.perm || null;
    var r = { key: k, label: b.label || b.l, screen: b.s, perm: perm, permN: perm ? permName(perm) : null, hasPerm: btnAllowed(ctx, b), who: perm ? M.whoCan(perm) : (b.roles || []).map(function (x) { return { k: x, n: roleName(x) }; }),
      rec: info && info.scope ? { kind: info.kind, id: info.id, st: info.st, label: info.label } : null, ok: null, reasons: [], rules: [], next: null, doer: null, conditions: b.c.slice() };
    r.label = b.l;
    if (info && !info.scope) { r.reasons.push(L('Data ini di luar cakupan Anda.', 'This record is outside your scope.')); r.rules.push('scope'); return r; }
    if (info && EVAL[k] && (EVAL_KIND[k] || []).indexOf(info.kind) >= 0) {
      var e = EVAL[k](ctx, info); r.ok = e.ok; r.reasons = e.reasons; r.rules = e.rules; r.next = e.next || null; r.fail = e.fail || null;
      if (e.perm && e.perm !== perm) { r.perm = e.perm; r.permN = permName(e.perm); r.hasPerm = can(ctx, e.perm); r.who = M.whoCan(e.perm); }
      if (e.doer) r.doer = { perm: e.doer.perm, what: e.doer.what, who: M.whoCan(e.doer.perm), you: can(ctx, e.doer.perm) };
    }
    if (!r.hasPerm) { r.rules.push('perm'); r.need = perm ? needOf(r.perm) : { perm: null, roles: r.who, msg: L('Hanya ' + T(joinNames(r.who)) + ' yang bisa menekan tombol ini.', 'Only ' + E(joinNames(r.who)) + ' can press this button.') }; if (r.ok) r.ok = false; }
    if (r.next && r.next.perm && !can(ctx, r.next.perm)) r.next = null;
    return r;
  };

  /* ---------- Contextual help (§51–§52) ---------- */
  M.helpFor = function (ctx, screenId, o) {
    if (!viewer(ctx)) return null;
    o = o || {};
    var sp = screenSpec(screenId); if (!sp && !content().some(function (a) { return a.screen === screenId; })) return null;
    var direct = content().filter(function (a) { return a.status === 'published' && a.screen === screenId; });
    var mod = direct.length ? direct[0].module : null, feats = uniq(direct.map(function (a) { return a.feature; }));
    // Same feature on the sibling screens (e.g. "What is Receiving?" lives on the queue, "What if the count differs?" on the difference screen) — for my role only.
    var ext = content().filter(function (a) { return a.status === 'published' && a.screen !== screenId && a.module === mod && feats.indexOf(a.feature) >= 0 && audience(a, ctx) && a.roles.indexOf('*') < 0; });
    var list = direct.concat(ext);
    var info = o.rec ? recInfo(ctx, o.rec) : null, status = o.status || (info && info.scope ? info.st : null);
    function V(a) { return view(ctx, a, false); }
    var whatIs = list.filter(function (a) { return a.kind === 'whatis'; }).map(V)[0] || null;
    var howTo = list.filter(function (a) { return a.kind === 'howto'; }).map(V);
    var whatIf = list.filter(function (a) { return a.kind === 'why' || a.kind === 'whatif'; }).map(V);
    var fallback = !direct.length;
    if (!whatIs) whatIs = { id: null, title: sp ? sp.n : L(screenId), description: sp && sp.pur ? sp.pur : (howTo[0] ? howTo[0].description : L('Belum ada penjelasan untuk layar ini.', 'No explanation for this screen yet.')), fallback: true };
    var video = (howTo.filter(function (h) { return h.video; })[0] || {}).video || null;
    var issues = [];
    list.forEach(function (a) { if (canDoArt(ctx, a)) a.faq.forEach(function (f) { issues.push({ q: f.q, a: f.a, from: a.id }); }); });
    var buttons = M.buttons(screenId).map(function (b) { return M.buttonHelp(b.key, ctx); });
    var blocked = [];
    if (info && info.scope) buttons.forEach(function (b) { if (EVAL[b.key] && (EVAL_KIND[b.key] || []).indexOf(info.kind) >= 0) { var e = M.evalButton(ctx, b.key, info.id); if (!e.ok) blocked.push(e); } });
    blocked.forEach(function (e) { issues.unshift({ q: L('Kenapa ' + T(e.label) + ' belum aktif?', 'Why is ' + E(e.label) + ' not active?'), a: [e.reasons.map(T).join(' '), e.reasons.map(E).join(' ')], from: 'live', rules: e.rules }); });
    var related = mod ? content().filter(function (a) { return a.status === 'published' && a.module === mod && list.indexOf(a) < 0 && audience(a, ctx); }).slice(0, 5).map(function (a) { return { id: a.id, title: a.title, screen: a.screen, canDo: canDoArt(ctx, a) }; }) : [];
    var walks = D.WALKS.filter(function (w) { return w.s === screenId; }).map(function (w) { return { id: w.id, title: w.t, canDo: can(ctx, w.perm), need: can(ctx, w.perm) ? null : needOf(w.perm) }; });
    return { ok: true, screen: { id: screenId, n: sp ? sp.n : L(screenId), pur: sp ? sp.pur || null : null, module: mod, moduleN: mod ? D.MODULES[mod] : null, icon: sp ? sp.icon : null },
      role: { k: ctx.roleKey, n: roleName(ctx.roleKey) }, status: status, statusN: info && info.scope ? info.label : null, rec: info && info.scope ? { kind: info.kind, id: info.id, st: info.st, label: info.label } : null,
      whatIs: whatIs, howTo: howTo, whatIf: whatIf, video: video, issues: issues, buttons: buttons, blocked: blocked, walkthroughs: walks, related: related, fallback: fallback, contact: contactOf(ctx) };
  };

  /* ---------- Tanya JFRESH (§58–§59): rule-based, never external AI ---------- */
  var BTN_HINTS = [
    ['start.production', /start production|mulai produksi/], ['golive.decide', /go\s*\/?\s*no[\s-]?go|keputusan go/], ['release', /\brelease|\brilis/], ['ho3l', /serahkan ke logistic|serah\w* .*logistic/],
    ['pack', /packing|\bpack\b|kemas/], ['ready', /siap (di)?kirim|ready to deliver/], ['qc.pass', /\bqc\b|\blulus\b/], ['ho.send', /handover|kirim ke team|serah terima/],
    ['invoice.issue', /terbit|issue invoice/], ['invoice.approve', /(setuju|approve)\w* .*invoice|invoice .*(setuju|approve)/], ['payment.record', /bayar|pembayaran|payment/],
    ['invoice.build', /invoice|tagihan|faktur/], ['cash.approve', /\bkas\b|\bcash\b/], ['pickup.send', /pickup|jemput/], ['pod.confirm', /\bpod\b|bukti pengiriman|konfirmasi penerimaan/],
    ['bill.send', /kirim ke finance|billing ready/], ['dlv.complete', /service completed|layanan selesai/], ['batch.create', /batch/], ['weigh.save', /timbang/], ['rcv.start', /receiving|terima cucian/], ['ada.masalah', /ada masalah/]
  ];
  function detectButton(q) { for (var i = 0; i < BTN_HINTS.length; i++) if (BTN_HINTS[i][1].test(q)) return BTN_HINTS[i][0]; return null; }
  function stepsOk(ctx, a) { return a && canDoArt(ctx, a) ? a.steps.slice() : null; }
  function bestArticle(ctx, q, kinds) {
    var rows = rank(ctx, M.normalize(q)); if (kinds) { var f = rows.filter(function (r) { return kinds.indexOf(r.a.kind) >= 0; }); if (f.length) rows = f; }
    return rows.length && rows[0].s.cov >= 0.5 ? rows[0].a : null;
  }
  M.ask = function (ctx, question, o) {
    if (!viewer(ctx)) return null;
    o = o || {};
    var raw = str(question), q = raw.toLowerCase(), info = o.rec ? recInfo(ctx, o.rec) : null, screen = o.screen || null, sp = screen ? screenSpec(screen) : null;
    var res = { ok: true, q: raw, intent: null, answer: null, lines: [], steps: null, need: null, who: [], button: null, article: null, links: [], rules: [], fallback: false,
      context: { screen: screen, screenN: sp ? sp.n : null, rec: info && info.scope ? info.id : null, kind: info && info.scope ? info.kind : null, status: info && info.scope ? info.st : null, statusN: info && info.scope ? info.label : null, role: ctx.roleKey, roleN: roleName(ctx.roleKey) } };
    function link(s, rec, l, qs) { if (!s) return; var x = X(); if (x && x.canScreen && screenSpec(s) && !x.canScreen(ctx, s)) return; res.links.push({ s: s, rec: rec || null, q: qs || null, l: l }); }
    function useArticle(a) { res.article = { id: a.id, title: a.title, kind: a.kind }; if (canDoArt(ctx, a)) { res.steps = a.steps.slice(); link(a.screen, null, a.title); } else { res.need = needOf(a.perm); res.who = res.need.roles; } }
    if (!raw) { res.intent = 'empty'; res.fallback = true; res.answer = L('Tulis pertanyaan Anda, contoh: "Kenapa tombol Packing belum aktif?"', 'Write your question, e.g. "Why is the Packing button not active?"'); return finishAsk(ctx, res, o); }
    if (info && !info.scope) { res.intent = 'scope'; res.rules.push('scope'); res.answer = L('Data ' + info.id + ' di luar cakupan Anda, jadi saya tidak bisa menjelaskannya.', 'Record ' + info.id + ' is outside your scope, so I cannot explain it.'); return finishAsk(ctx, res, o); }
    var isWhat = /^(apa itu|apa arti|apa maksud|arti|what is|whats|what's|define)\b/.test(q) || /\b(artinya|maksudnya|singkatan)\b/.test(q);
    var isWhy = /\b(kenapa|mengapa|knp|why|kok)\b/.test(q) || /(belum|tidak|gak|nggak|ga) (aktif|bisa|muncul|jalan)|disabled|abu-abu|not active|can.?t|cannot/.test(q);
    var isPerm = /\b(boleh|bolehkah|izin|ijin|akses|hak|allowed|permission|siapa yang bisa|siapa yg bisa|who can)\b/.test(q) || /(bisakah|apakah) saya/.test(q) || /can i\b/.test(q);
    var isHow = /\b(cara|caranya|bagaimana|gimana|how)\b/.test(q), isStatus = /\b(status|posisi|sampai mana|di mana|dimana|where is)\b/.test(q);
    var bkey = detectButton(q);
    // 1. APA INI?
    if (isWhat) {
      var term = raw.replace(/^(apa itu|apa arti|apa maksud|arti|what is|whats|what's|define)\s*/i, '').replace(/[?.!]+$/, '').trim(), w = M.whatIs(term, ctx) || M.whatIs(term.split(/\s+/)[0], ctx);
      if (w) { res.intent = 'whatis'; res.rules.push('glossary'); res.answer = [T(w.term) + ': ' + T(w.def), E(w.term) + ': ' + E(w.def)]; link(w.screen, null, w.term); return finishAsk(ctx, res, o); }
    }
    // 2. Why is a button not active / why was it refused — live record + rules.
    if (isWhy && bkey) {
      var e = M.evalButton(ctx, bkey, info && info.scope ? info.id : null);
      res.intent = 'why'; res.button = { key: e.key, label: e.label, perm: e.perm, hasPerm: e.hasPerm, ok: e.ok }; res.rules = res.rules.concat(e.rules);
      if (e.rec) { res.lines = res.lines.concat(e.reasons); }
      else { res.rules.push('conditions'); res.lines.push(L('Tombol ' + T(e.label) + ' aktif bila: ' + e.conditions.map(T).join(' '), 'The ' + E(e.label) + ' button is active when: ' + e.conditions.map(E).join(' '))); }
      if (e.doer) { var dn = joinNames(e.doer.who); res.lines.push(L(T(e.doer.what) + ' dilakukan oleh: ' + dn[0] + (e.doer.you ? ' (termasuk Anda).' : '.'), E(e.doer.what) + ' is done by: ' + dn[1] + (e.doer.you ? ' (including you).' : '.'))); res.who = e.doer.who; }
      if (!e.hasPerm) { res.need = e.need; res.lines.push(e.need.msg); if (!res.who.length) res.who = e.need.roles; }
      else if (!res.who.length) res.who = e.who;
      if (e.next) link(e.next.s, e.next.rec, e.next.l, e.next.q);
      var b = D.BUTTONS[e.key], wa = b && b.why ? art(b.why) : null;
      if (wa && wa.status === 'published') { res.article = { id: wa.id, title: wa.title, kind: wa.kind }; res.steps = stepsOk(ctx, wa); }
      res.answer = [res.lines.map(T).join(' '), res.lines.map(E).join(' ')];
      return finishAsk(ctx, res, o);
    }
    // 3. Permission questions: answer with the required permission instead of teaching the action (§59).
    if (isPerm) {
      var pa = bkey ? null : bestArticle(ctx, raw, ['howto']), bh = bkey ? M.buttonHelp(bkey, ctx) : null, perm = bh ? bh.perm : pa ? pa.perm : null;
      if (bh || pa) {
        res.intent = 'perm'; res.rules.push('perm.check');
        var okp = bh ? bh.allowed : canDoArt(ctx, pa), what = bh ? bh.label : pa.title;
        if (okp) { res.answer = L('Ya, peran Anda (' + T(roleName(ctx.roleKey)) + ') boleh melakukan "' + T(what) + '".', 'Yes, your role (' + E(roleName(ctx.roleKey)) + ') may do "' + E(what) + '".'); if (pa) useArticle(pa); else if (bh.hlp && art(bh.hlp)) useArticle(art(bh.hlp)); }
        else { res.need = perm ? needOf(perm) : bh.need; res.who = res.need.roles; res.answer = res.need.msg; if (pa) res.article = { id: pa.id, title: pa.title, kind: pa.kind }; }
        res.who = res.who.length ? res.who : (perm ? M.whoCan(perm) : []);
        return finishAsk(ctx, res, o);
      }
    }
    // 4. Status of the record on screen (asked explicitly).
    if (isStatus && !isHow && info && info.scope) return statusAnswer();
    // 5. How-to (role-aware) and everything else that the help center can answer.
    var ka = bestArticle(ctx, raw, isWhy ? ['why', 'whatif'] : (isHow ? ['howto'] : null));
    if (!ka && isWhy) ka = bestArticle(ctx, raw);
    if (ka) {
      res.intent = isWhy ? 'why' : 'howto'; res.rules.push('search');
      useArticle(ka);
      res.answer = res.need ? res.need.msg : [T(ka.title) + ' — ' + T(ka.description), E(ka.title) + ' — ' + E(ka.description)];
      if (res.need) res.rules.push('perm');
      return finishAsk(ctx, res, o);
    }
    // 6. Status of the record on screen.
    if (info && info.scope) return statusAnswer();
    function statusAnswer() {
      res.intent = 'status'; res.rules.push('status');
      res.answer = L(info.id + ' berstatus "' + T(info.label) + '".', info.id + ' is "' + E(info.label) + '".');
      return finishAsk(ctx, res, o);
    }
    // 7. Honest fallback.
    var c = contactOf(ctx);
    res.intent = 'unknown'; res.fallback = true; res.rules.push('fallback');
    res.answer = [('Maaf, saya belum punya jawaban pasti untuk itu. Coba Cari Bantuan dengan kata lain. ' + T(c.msg)), ('Sorry, I do not have a sure answer for that yet. Try Help Search with other words. ' + E(c.msg))];
    link('HELP-004', null, L('Cari Bantuan', 'Help Search'), { q: raw }); if (c.s) link(c.s, null, L('Bantuan & Masalah', 'Help & Issues'));
    return finishAsk(ctx, res, o);
  };
  function finishAsk(ctx, res, o) {
    if (o.log !== false && res.q) { S().asks.push({ at: nowS(), q: res.q.slice(0, 160), uid: ctx.uid, u: uname(ctx), role: ctx.roleKey, screen: res.context.screen, rec: res.context.rec, intent: res.intent, answered: !res.fallback }); trim('asks'); save(); }
    return res;
  }

  /* ---------- Product tour (§54) ---------- */
  M.tour = function (ctx) {
    if (!viewer(ctx)) return null;
    var u = uname(ctx), s = S().tours[u] || { st: 'new', step: 0, at: null }, home = D.TOUR_HOME[ctx.roleKey] || D.TOUR_HOME[ctx.exp] || D.TOUR_HOME['*'];
    var steps = D.TOUR.map(function (t) { return { k: t.k, sel: t.sel, mSel: t.m || t.sel, opt: !!t.opt, t: t.t, b: t.k === 'home' ? home : t.b }; });
    if (!(ctx.plants && ctx.plants.length > 1)) steps = steps.filter(function (x) { return x.k !== 'plant'; });
    var show = s.st === 'new' || (s.st === 'skipped' && s.at && s.at.slice(0, 10) < M.today());
    return { role: ctx.roleKey, roleN: roleName(ctx.roleKey), steps: steps, state: s.st, step: Math.min(s.step || 0, steps.length - 1), show: show };
  };
  M.tourAction = function (ctx, act, step) {
    if (!viewer(ctx)) return deny(ctx, 'help.view');
    var u = uname(ctx), t = M.tour(ctx), s = S().tours[u] || (S().tours[u] = { st: 'new', step: 0, at: null });
    if (act === 'next') { s.step = (step != null ? +step : s.step) + 1; if (s.step >= t.steps.length) { s.st = 'seen'; s.step = 0; } }
    else if (act === 'back') s.step = Math.max(0, (step != null ? +step : s.step) - 1);
    else if (act === 'skip') s.st = 'skipped';
    else if (act === 'dontShow') s.st = 'dontShow';
    else if (act === 'done') { s.st = 'seen'; s.step = 0; }
    else if (act === 'restart') { s.st = 'new'; s.step = 0; }
    else return bad(M.MSG.invalid, 'invalid');
    s.at = nowS(); save();
    return { ok: true, state: s.st, step: s.step, tour: M.tour(ctx) };
  };

  /* ---------- PANDU SAYA walkthroughs (§55) ---------- */
  function walkById(id) { return by(D.WALKS, 'id', id); }
  function walkView(ctx, w) {
    var ok = can(ctx, w.perm), p = (S().walks[uname(ctx)] || {})[w.id] || null, sp = screenSpec(w.s);
    return { id: w.id, title: w.t, screen: w.s, screenN: sp ? sp.n : null, hlp: w.hlp, perm: w.perm, canDo: ok, need: ok ? null : needOf(w.perm),
      steps: ok ? w.steps.map(function (s, i) { return { n: i + 1, sel: s[0], t: s[1], hint: s[2], screen: s[3] || w.s }; }) : null, progress: p };
  }
  M.walkthroughs = function (ctx, screenId) { if (!viewer(ctx)) return []; return D.WALKS.filter(function (w) { return !screenId || w.s === screenId; }).map(function (w) { return walkView(ctx, w); }); };
  M.walkthrough = function (ctx, id) { if (!viewer(ctx)) return null; var w = walkById(id); return w ? walkView(ctx, w) : null; };
  function walkRec(ctx, id) { var u = uname(ctx), m = S().walks[u] || (S().walks[u] = {}); return m[id] || (m[id] = { st: 'new', step: 0, starts: 0, done: 0, at: null }); }
  M.walkStart = function (ctx, id) {
    var w = walkById(id); if (!w) return bad(M.MSG.notfound, 'notfound'); if (!viewer(ctx)) return deny(ctx, 'help.view', id);
    if (!can(ctx, w.perm)) return Object.assign(deny(ctx, w.perm, id), { need: needOf(w.perm) });
    var r = walkRec(ctx, id); r.st = 'started'; r.step = 1; r.starts++; r.at = nowS(); save();
    return { ok: true, walk: walkView(ctx, w), step: walkView(ctx, w).steps[0] };
  };
  M.walkStep = function (ctx, id, n) {
    var w = walkById(id); if (!w) return bad(M.MSG.notfound, 'notfound'); if (!can(ctx, w.perm)) return deny(ctx, w.perm, id);
    var r = walkRec(ctx, id); if (r.st !== 'started') return bad(M.MSG.jump, 'jump');
    n = Math.max(1, Math.min(w.steps.length, +n || r.step + 1)); r.step = n; r.at = nowS(); save();
    return { ok: true, step: walkView(ctx, w).steps[n - 1], last: n === w.steps.length };
  };
  M.walkDone = function (ctx, id) {
    var w = walkById(id); if (!w) return bad(M.MSG.notfound, 'notfound'); if (!can(ctx, w.perm)) return deny(ctx, w.perm, id);
    var r = walkRec(ctx, id); if (r.st !== 'started') return bad(M.MSG.jump, 'jump');
    r.st = 'done'; r.done++; r.step = w.steps.length; r.at = nowS();
    // Practice counts toward training (§62): the walkthrough's article is done; a completed path becomes "practiced".
    var u = uname(ctx), touched = [];
    assignedPaths(u, ctx.roleKey).forEach(function (p) {
      if (p.items.indexOf(w.hlp) < 0) return;
      var pr = progRec(u, p.id); if (pr.items.indexOf(w.hlp) < 0) pr.items.push(w.hlp);
      if (pr.st === 'assigned') pr.st = 'started';
      if (pr.items.length >= p.items.length && stIdx(pr.st) < 2) pr.st = 'completed';
      pr.practiced = true; if (pr.st === 'completed') pr.st = 'practiced';
      pr.at = nowS(); touched.push(p.id);
    });
    save(); return { ok: true, walk: walkView(ctx, w), paths: touched };
  };
  M.walkAbandon = function (ctx, id) { var w = walkById(id); if (!w) return bad(M.MSG.notfound, 'notfound'); var r = walkRec(ctx, id); if (r.st !== 'started') return bad(M.MSG.jump, 'jump'); r.st = 'abandoned'; r.at = nowS(); save(); return { ok: true }; };

  /* ---------- Training paths & progress (§61–§62) ---------- */
  M.PROGRESS = ['assigned', 'started', 'completed', 'practiced', 'passed'];
  M.PROGRESS_N = { assigned: L('Ditugaskan', 'Assigned'), started: L('Mulai', 'Started'), completed: L('Selesai', 'Completed'), practiced: L('Sudah praktik', 'Practiced'), passed: L('Lulus', 'Passed') };
  function stIdx(s) { return M.PROGRESS.indexOf(s); }
  M.paths = function () { return D.PATHS.map(function (p) { return { id: p.id, n: p.n, roles: p.roles.slice(), pass: p.pass, optional: !!p.optional, items: p.items.map(function (h) { var a = art(h); return { hlp: h, title: a ? a.title : L(h) }; }) }; }); };
  M.path = function (id) { return by(M.paths(), 'id', id); };
  M.pathsFor = function (role) { return D.PATHS.filter(function (p) { return p.roles.indexOf('*') >= 0 && role !== 'client' || p.roles.indexOf(role) >= 0; }).map(function (p) { return p.id; }); };
  function assignedPaths(u, role) { var ids = M.pathsFor(role).concat((S().assign[u] || []).map(function (a) { return a.path; })); return uniq(ids).map(pathById).filter(Boolean); }
  function progRec(u, pid) { var m = S().progress[u] || (S().progress[u] = {}); return m[pid] || (m[pid] = { st: 'assigned', items: [], score: null, at: null, by: null, practiced: false }); }
  function pathRow(u, p) {
    var pr = (S().progress[u] || {})[p.id] || { st: 'assigned', items: [], score: null, at: null };
    var done = p.items.filter(function (h) { return pr.items.indexOf(h) >= 0; }).length, pc = pr.st === 'passed' ? 100 : Math.round(done / p.items.length * 100);
    return { id: p.id, n: p.n, st: pr.st, stN: M.PROGRESS_N[pr.st], pct: pc, done: done, total: p.items.length, score: pr.score, pass: p.pass, optional: !!p.optional, at: pr.at, by: pr.by || null,
      items: p.items.map(function (h) { var a = art(h); return { hlp: h, title: a ? a.title : L(h), done: pr.items.indexOf(h) >= 0, walk: a ? a.walk : null }; }) };
  }
  function userRows() {
    var x = X(); if (!x) return [];
    return x.USERS.filter(function (u) { var a = tryf(function () { return x.account(u.id); }, null); return a && a.status === 'active' && a.roles && a.roles.length; }).map(function (u) {
      var a = x.account(u.id), def = (a.roles.filter(function (r) { return r.def; })[0] || a.roles[0]).k;
      return { uid: u.id, u: u.u, name: x.fullName ? x.fullName(u) : u.u, role: def, client: u.client || null };
    }).filter(function (r) { return x.ROLES[r.role]; });
  }
  function keyUsers() { var out = {}; Object.keys(D.KEY_USERS).forEach(function (r) { D.KEY_USERS[r].forEach(function (u) { out[u] = r; }); }); if (M.C && M.C.ROLES && M.C.ROLES.trainer) out.ratih = out.ratih || 'trainer'; return out; }
  function trainingOf(u, role, name, uid) {
    var paths = assignedPaths(u, role).map(function (p) { return pathRow(u, p); }), req = paths.filter(function (p) { return !p.optional; });
    var basis = req.length ? req : paths, pc = basis.length ? Math.round(basis.reduce(function (s0, p) { return s0 + p.pct; }, 0) / basis.length) : 0;
    var minSt = basis.length ? M.PROGRESS[Math.min.apply(null, basis.map(function (p) { return stIdx(p.st); }))] : 'assigned';
    return { uid: uid || null, u: u, name: name || u, role: role, roleN: roleName(role), key: !!keyUsers()[u], paths: paths, pct: pc, st: minSt, stN: M.PROGRESS_N[minSt],
      passed: basis.filter(function (p) { return p.st === 'passed'; }).length, total: basis.length, trained: basis.length > 0 && basis.every(function (p) { return p.st === 'passed'; }) };
  }
  function findUser(who) { var x = X(); if (!x || !who) return null; return by(x.USERS, 'id', who) || by(x.USERS, 'u', who); }
  function inTeam(ctx, role) { if (can(ctx, 'help.team') && ['supervisor', 'opsmgr'].indexOf(ctx.roleKey) < 0) return true; return can(ctx, 'help.team') && M.OPS_ROLES.indexOf(role) >= 0; }
  // Own progress; with who (uid or username) a team viewer sees another user's progress (scope: supervisors → operations roles).
  M.training = function (ctx, who) {
    if (!viewer(ctx)) return null;
    var me = uname(ctx);
    if (!who || who === me || who === ctx.uid) return trainingOf(me, ctx.roleKey, ctxName(ctx), ctx.uid);
    var row = by(userRows(), 'uid', who) || by(userRows(), 'u', who); if (!row) return null;
    if (!inTeam(ctx, row.role)) { deny(ctx, 'help.team', row.uid); return null; }
    return trainingOf(row.u, row.role, row.name, row.uid);
  };
  M.trainingTeam = function (ctx, f) {
    if (!viewer(ctx) || !can(ctx, 'help.team')) return [];
    f = f || {};
    return userRows().filter(function (r) { return (f.client ? true : !r.client) && inTeam(ctx, r.role) && (!f.role || r.role === f.role) && (!f.key || keyUsers()[r.u]); })
      .map(function (r) { var t = trainingOf(r.u, r.role, r.name, r.uid); delete t.paths; return t; });
  };
  function summaryOf(rows) {
    var roles = {};
    rows.forEach(function (r) { var g = roles[r.role] || (roles[r.role] = { role: r.role, roleN: r.roleN, users: 0, trained: 0, pctSum: 0 }); g.users++; g.pctSum += r.pct; if (r.trained) g.trained++; });
    var byRole = Object.keys(roles).map(function (k) { var g = roles[k]; return { role: k, roleN: g.roleN, users: g.users, trained: g.trained, pct: Math.round(g.pctSum / g.users) }; });
    var keys = rows.filter(function (r) { return r.key; });
    return { users: rows.length, overall: rows.length ? Math.round(rows.reduce(function (s0, r) { return s0 + r.pct; }, 0) / rows.length) : 0, trainedPct: pct(rows.filter(function (r) { return r.trained; }).length, rows.length),
      byRole: byRole, keyUsers: { total: keys.length, trained: keys.filter(function (r) { return r.trained; }).length, untrained: keys.filter(function (r) { return !r.trained; }).map(function (r) { return { uid: r.uid, u: r.u, name: r.name, role: r.role, roleN: r.roleN, st: r.st, pct: r.pct }; }) } };
  }
  M.trainingSummary = function (ctx) { if (!viewer(ctx) || !(can(ctx, 'help.team') || can(ctx, 'help.analytics'))) return null; return summaryOf(M.trainingTeam(Object.assign({}, ctx, { perms: (ctx.perms || []).concat(['help.team']), roleKey: ctx.roleKey === 'supervisor' || ctx.roleKey === 'opsmgr' ? ctx.roleKey : 'trainer' }))); };
  // Own learning: mark an item of an assigned path done (assigned → started → completed).
  M.markItem = function (ctx, pathId, hlpId) {
    if (!viewer(ctx)) return deny(ctx, 'help.view');
    var u = uname(ctx), p = pathById(pathId); if (!p || p.items.indexOf(hlpId) < 0) return bad(M.MSG.notfound, 'notfound');
    if (!assignedPaths(u, ctx.roleKey).some(function (x) { return x.id === pathId; })) return bad(M.MSG.scope, 'scope');
    var pr = progRec(u, pathId); if (pr.items.indexOf(hlpId) < 0) pr.items.push(hlpId);
    if (pr.st === 'assigned') pr.st = 'started';
    if (pr.items.length >= p.items.length && stIdx(pr.st) < 2) pr.st = pr.practiced ? 'practiced' : 'completed';
    pr.at = nowS(); save();
    return { ok: true, path: pathRow(u, p) };
  };
  // Assessor: practiced / passed (score ≥ pass mark; never on yourself — maker-checker).
  M.assess = function (ctx, who, pathId, stTo, o) {
    o = o || {};
    if (!can(ctx, 'help.assess')) return deny(ctx, 'help.assess', pathId);
    var row = by(userRows(), 'uid', who) || by(userRows(), 'u', who), p = pathById(pathId); if (!row || !p) return bad(M.MSG.notfound, 'notfound');
    if (row.u === uname(ctx)) return bad(M.MSG.maker, 'maker');
    if (!inTeam(ctx, row.role) && !can(ctx, 'help.manage')) return Object.assign(deny(ctx, 'help.team', row.uid), { code: 'scope', msg: M.MSG.scope });
    if (['practiced', 'passed'].indexOf(stTo) < 0) return bad(M.MSG.invalid, 'invalid');
    var pr = progRec(row.u, pathId), before = pr.st;
    if (stIdx(pr.st) < 2) return bad(L('Materi belum selesai dipelajari.', 'The material is not completed yet.'), 'jump');
    if (stTo === 'passed') { var sc0 = +o.score; if (!(sc0 >= 0 && sc0 <= 100)) return bad(L('Isi nilai 0–100.', 'Enter a score 0–100.'), 'invalid'); if (sc0 < p.pass) return bad(L('Nilai di bawah batas lulus (' + p.pass + ').', 'Score below the pass mark (' + p.pass + ').'), 'invalid'); pr.score = sc0; }
    pr.st = stTo; if (stTo === 'practiced') pr.practiced = true; pr.at = nowS(); pr.by = uname(ctx);
    M.audit(stTo === 'passed' ? 'HELP.TRAINING_PASSED' : 'HELP.TRAINING_PROGRESS', ctx, { rec: row.u + '/' + pathId, before: before, after: { st: stTo, score: pr.score }, reason: o.note || null });
    save(); return { ok: true, path: pathRow(row.u, p) };
  };
  M.assign = function (ctx, who, pathId, reason) {
    if (!can(ctx, 'help.assign')) return deny(ctx, 'help.assign', pathId);
    var row = by(userRows(), 'uid', who) || by(userRows(), 'u', who), p = pathById(pathId); if (!row || !p) return bad(M.MSG.notfound, 'notfound');
    if (!inTeam(ctx, row.role) && !can(ctx, 'help.manage')) return Object.assign(deny(ctx, 'help.team', row.uid), { code: 'scope', msg: M.MSG.scope });
    if (!str(reason)) return bad(M.MSG.reason, 'reason');
    if (assignedPaths(row.u, row.role).some(function (x) { return x.id === pathId; })) return bad(M.MSG.dup, 'dup');
    (S().assign[row.u] = S().assign[row.u] || []).push({ path: pathId, by: uname(ctx), at: nowS(), reason: str(reason) });
    progRec(row.u, pathId);
    M.audit('HELP.TRAINING_ASSIGN', ctx, { rec: row.u + '/' + pathId, after: pathId, reason: reason }); save();
    return { ok: true, path: pathRow(row.u, p) };
  };

  /* ---------- Content manager (§63): versioned, trainer only ---------- */
  function draftOf(a) { var l = a.vers[a.vers.length - 1]; return l && l.st === 'draft' && a.status === 'published' ? l : null; }
  var FIELDS = ['module', 'screen', 'feature', 'button', 'roles', 'perm', 'kind', 'title', 'description', 'steps', 'video', 'image', 'faq', 'keywords', 'lang', 'walk'];
  function pair(x) { return Array.isArray(x) ? [str(x[0]), str(x[1] == null ? x[0] : x[1])] : x == null ? null : [str(x), str(x)]; }
  M.validateArticle = function (f) {
    var errs = {};
    if (!f.title || !pair(f.title)[0]) errs.title = L('Judul wajib diisi.', 'Title is required.');
    if (!D.MODULES[f.module]) errs.module = L('Pilih modul.', 'Choose a module.');
    if (!f.screen || !screenSpec(f.screen)) errs.screen = L('Layar tidak ditemukan di registry.', 'Screen not found in the registry.');
    if (f.kind && !M.KINDS[f.kind]) errs.kind = L('Jenis tidak valid.', 'Invalid kind.');
    if (!Array.isArray(f.steps) || !f.steps.length) errs.steps = L('Isi minimal satu langkah.', 'Enter at least one step.');
    if (f.video && !(+f.video.len >= 30 && +f.video.len <= 90)) errs.video = L('Video 30–90 detik (§60).', 'Video 30–90 seconds (§60).');
    if (f.perm && M.C && M.C.PERMS && !M.C.PERMS[f.perm]) errs.perm = L('Izin tidak dikenal.', 'Unknown permission.');
    if (f.walk && !walkById(f.walk)) errs.walk = L('Walkthrough tidak ditemukan.', 'Walkthrough not found.');
    return { ok: !Object.keys(errs).length, errors: errs };
  };
  function normFields(f, base) {
    var d = Object.assign({}, base || { roles: ['*'], perm: null, kind: 'howto', feature: null, button: null, image: null, faq: [], keywords: [], lang: ['id', 'en'], walk: null, video: null });
    FIELDS.forEach(function (k) { if (f[k] !== undefined) d[k] = clone(f[k]); });
    d.title = pair(d.title); d.description = pair(d.description || ''); d.steps = (d.steps || []).map(pair).filter(function (s) { return s && s[0]; });
    d.faq = (d.faq || []).map(function (x) { return { q: pair(x.q), a: pair(x.a) }; });
    d.keywords = Array.isArray(d.keywords) ? d.keywords.map(str).filter(Boolean) : str(d.keywords).split(/[\s,]+/).filter(Boolean);
    if (d.video) d.video = { len: +d.video.len, src: d.video.src || null, title: d.title };
    return d;
  }
  M.createArticle = function (ctx, f, reason) {
    if (!can(ctx, 'help.edit')) return deny(ctx, 'help.edit', 'HLP-new');
    var d = normFields(f || {}), v = M.validateArticle(d); if (!v.ok) return bad(M.MSG.invalid, 'invalid', { errors: v.errors });
    var id = 'HLP-' + String(S().seq.hlp++).padStart(3, '0'), r0 = str(reason) || 'Konten baru';
    var a = Object.assign({ id: id, v: 1, status: 'draft', archiveReason: null, at: nowS(), by: uname(ctx), vers: [{ v: 1, st: 'draft', at: nowS(), by: uname(ctx), reason: L(r0, r0), data: clone(d) }] }, d);
    content().push(a); M.audit('HELP.CONTENT_CREATE', ctx, { rec: id, after: { title: d.title[0], screen: d.screen }, reason: r0 }); save();
    return { ok: true, article: view(ctx, a, true) };
  };
  M.editArticle = function (ctx, id, patch, reason) {
    if (!can(ctx, 'help.edit')) return deny(ctx, 'help.edit', id);
    var a = art(id); if (!a) return bad(M.MSG.notfound, 'notfound');
    if (a.status === 'archived') return bad(M.MSG.jump, 'jump');
    if (!str(reason)) return bad(M.MSG.reason, 'reason');
    var cur = draftOf(a) ? draftOf(a).data : (function () { var o = {}; FIELDS.forEach(function (k) { o[k] = clone(a[k]); }); return o; })();
    var d = normFields(patch || {}, cur), v = M.validateArticle(d); if (!v.ok) return bad(M.MSG.invalid, 'invalid', { errors: v.errors });
    var nv = a.vers[a.vers.length - 1].v + 1, before = { v: a.v, title: a.title[0] };
    if (a.status === 'published') { var dr = draftOf(a); if (dr) a.vers.pop(); a.vers.push({ v: dr ? dr.v : nv, st: 'draft', at: nowS(), by: uname(ctx), reason: L(str(reason)), data: clone(d) }); }
    else { Object.assign(a, d); a.v = nv; a.vers.push({ v: nv, st: 'draft', at: nowS(), by: uname(ctx), reason: L(str(reason)), data: clone(d) }); }
    M.audit('HELP.CONTENT_EDIT', ctx, { rec: id, before: before, after: { v: a.vers[a.vers.length - 1].v, title: d.title[0] }, reason: reason }); save();
    return { ok: true, article: view(ctx, a, true), pending: a.status === 'published' };
  };
  M.publish = function (ctx, id, reason) {
    if (!can(ctx, 'help.edit')) return deny(ctx, 'help.edit', id);
    var a = art(id); if (!a) return bad(M.MSG.notfound, 'notfound'); if (!str(reason)) return bad(M.MSG.reason, 'reason');
    var dr = a.status === 'published' ? draftOf(a) : (a.vers[a.vers.length - 1].st === 'draft' ? a.vers[a.vers.length - 1] : null);
    if (!dr && a.status !== 'archived') return bad(L('Tidak ada versi draft untuk diterbitkan.', 'There is no draft version to publish.'), 'jump');
    var src = dr || a.vers[a.vers.length - 1], v = M.validateArticle(src.data); if (!v.ok) return bad(M.MSG.invalid, 'invalid', { errors: v.errors });
    var before = { st: a.status, v: a.v };
    a.vers.forEach(function (x) { if (x.st === 'published') x.st = 'superseded'; });
    if (!dr) { src = { v: a.vers[a.vers.length - 1].v + 1, st: 'published', at: nowS(), by: uname(ctx), reason: L(str(reason)), data: clone(src.data) }; a.vers.push(src); }
    else { src.st = 'published'; src.pubAt = nowS(); src.pubBy = uname(ctx); }
    Object.assign(a, clone(src.data)); a.v = src.v; a.status = 'published'; a.archiveReason = null; a.at = nowS(); a.by = uname(ctx);
    M.audit('HELP.CONTENT_PUBLISH', ctx, { rec: id, before: before, after: { st: 'published', v: a.v }, reason: reason }); save();
    return { ok: true, article: view(ctx, a, true) };
  };
  M.archive = function (ctx, id, reason) {
    if (!can(ctx, 'help.edit')) return deny(ctx, 'help.edit', id);
    var a = art(id); if (!a) return bad(M.MSG.notfound, 'notfound'); if (!str(reason)) return bad(M.MSG.reason, 'reason');
    if (a.status === 'archived') return bad(M.MSG.jump, 'jump');
    var before = a.status; a.status = 'archived'; a.archiveReason = L(str(reason)); a.vers.push({ v: a.vers[a.vers.length - 1].v, st: 'archived', at: nowS(), by: uname(ctx), reason: L(str(reason)), data: clone(a.vers[a.vers.length - 1].data) });
    M.audit('HELP.CONTENT_ARCHIVE', ctx, { rec: id, before: before, after: 'archived', reason: reason }); save();
    return { ok: true, article: view(ctx, a, true) };
  };
  M.versions = function (ctx, id) { if (!can(ctx, 'help.manage')) return []; var a = art(id); return a ? a.vers.map(function (v) { return { v: v.v, st: v.st, at: v.at, by: v.by, reason: v.reason, title: v.data.title }; }) : []; };
  M.manager = function (ctx, f) {
    if (!can(ctx, 'help.manage')) return null;
    f = f || {};
    var rows = content().filter(function (a) { return (!f.status || a.status === f.status) && (!f.module || a.module === f.module) && (!f.q || M.normalize(f.q).every(function (w) { var ix = index(a); return ix.t.concat(ix.k).indexOf(w) >= 0; })); })
      .map(function (a) { var sp = screenSpec(a.screen); return { id: a.id, title: a.title, module: a.module, moduleN: D.MODULES[a.module], screen: a.screen, screenN: sp ? sp.n : null, screenOk: !!sp, kind: a.kind, roles: a.roles, perm: a.perm, status: a.status, statusN: M.STATUS[a.status][0], v: a.v, draft: !!draftOf(a), video: a.video ? a.video.len : null, at: a.at, by: a.by, opens: opensOf(a.id), feedback: fbOf(a.id) }; });
    var screens = uniq(content().filter(function (a) { return a.status === 'published'; }).map(function (a) { return a.screen; }));
    return { rows: rows, counts: { total: content().length, published: content().filter(function (a) { return a.status === 'published'; }).length, draft: content().filter(function (a) { return a.status === 'draft' || draftOf(a); }).length, archived: content().filter(function (a) { return a.status === 'archived'; }).length },
      screensCovered: screens.length, canEdit: can(ctx, 'help.edit'), paths: M.paths(), walks: D.WALKS.map(function (w) { return { id: w.id, title: w.t, screen: w.s, steps: w.steps.length }; }) };
  };

  /* ---------- Feedback & analytics (§64, §105) ---------- */
  M.feedback = function (ctx, id, helpful, note) {
    if (!viewer(ctx)) return deny(ctx, 'help.view', id);
    var a = art(id); if (!a || a.status !== 'published') return bad(M.MSG.notfound, 'notfound');
    var m = S().feedback[id] || (S().feedback[id] = {}), prev = m[uname(ctx)];
    m[uname(ctx)] = { helpful: !!helpful, note: str(note) || null, at: nowS(), role: ctx.roleKey }; save();
    return { ok: true, updated: !!prev, feedback: fbOf(id) };
  };
  function fbOf(id) {
    var s0 = by(D.FEEDBACK.map(function (r) { return { id: r[0], y: r[1], n: r[2] }; }), 'id', id) || { y: 0, n: 0 }, live = S().feedback[id] || {};
    var y = s0.y, n = s0.n; Object.keys(live).forEach(function (u) { if (live[u].helpful) y++; else n++; });
    return { yes: y, no: n, pct: y + n ? Math.round(y / (y + n) * 100) : null };
  }
  function opensOf(id) { var s0 = by(D.OPENS.map(function (r) { return { id: r[0], n: r[1] }; }), 'id', id); return (s0 ? s0.n : 0) + S().opens.filter(function (o) { return o.id === id; }).length; }
  function searchAgg() {
    var g = {};
    D.SEARCHES.forEach(function (r) { var k = M.normalize(r[0]).join(' ') || r[0]; var x = g[k] || (g[k] = { term: r[0], key: k, count: 0, users: 0, last: r[3], seeded: true }); x.count += r[1]; x.users += r[2]; });
    S().searches.forEach(function (s) { var k = s.norm || s.q.toLowerCase(); var x = g[k] || (g[k] = { term: s.q, key: k, count: 0, users: 0, last: null, live: 0, uset: {} }); x.count++; x.live = (x.live || 0) + 1; if (!x.uset) x.uset = {}; if (!x.uset[s.u]) { x.uset[s.u] = 1; x.users++; } if (!x.last || s.at.slice(0, 10) > x.last) x.last = s.at.slice(0, 10); });
    return Object.keys(g).map(function (k) { var x = g[k]; var rows = rank(null, k.split(' ')); var top = rows[0] ? rows[0].a : null; return { term: x.term, key: k, count: x.count, users: x.users, last: x.last, results: rows.length, top: top ? { id: top.id, title: top.title, screen: top.screen } : null }; })
      .sort(function (a, b) { return b.count - a.count; });
  }
  M.analytics = function (ctx) {
    if (!can(ctx, 'help.analytics') && !can(ctx, 'help.manage')) return null;
    var sa = searchAgg(), opened = content().filter(function (a) { return a.status === 'published'; }).map(function (a) { return { id: a.id, title: a.title, screen: a.screen, count: opensOf(a.id) }; }).filter(function (r) { return r.count; }).sort(function (a, b) { return b.count - a.count; });
    var walks = D.WALK_USE.map(function (r) { var w = walkById(r[0]), live = { s: 0, d: 0 }; Object.keys(S().walks).forEach(function (u) { var x = S().walks[u][r[0]]; if (x) { live.s += x.starts; live.d += x.done; } }); return { id: r[0], title: w ? w.t : L(r[0]), screen: w ? w.s : null, started: r[1] + live.s, completed: r[2] + live.d, rate: pct(r[2] + live.d, r[1] + live.s) }; }).sort(function (a, b) { return b.started - a.started; });
    var failed = failedTasks(ctx), unanswered = sa.filter(function (r) { return r.results === 0; });
    S().asks.filter(function (a) { return !a.answered; }).forEach(function (a) { var k = 'ask: ' + a.q.toLowerCase(), x = by(unanswered, 'key', k); if (x) x.count++; else unanswered.push({ term: a.q, key: k, count: 1, users: 1, last: a.at.slice(0, 10), results: 0, top: null, src: 'ask' }); });
    var fb = content().filter(function (a) { return a.status === 'published'; }).map(function (a) { var f = fbOf(a.id); return { id: a.id, title: a.title, yes: f.yes, no: f.no, pct: f.pct }; }).filter(function (r) { return r.yes + r.no; }).sort(function (a, b) { return (a.pct == null ? 101 : a.pct) - (b.pct == null ? 101 : b.pct); });
    var totalSearch = sa.reduce(function (s0, r) { return s0 + r.count; }, 0);
    return { topSearches: sa.slice(0, 10), topOpened: opened.slice(0, 10), topWalkthroughs: walks, failedTasks: failed, unanswered: unanswered.sort(function (a, b) { return b.count - a.count; }), feedback: fb,
      usage: { searches: totalSearch, opens: opened.reduce(function (s0, r) { return s0 + r.count; }, 0), asks: S().asks.length, askAnswered: pct(S().asks.filter(function (a) { return a.answered; }).length, S().asks.length), unansweredPct: pct(unanswered.reduce(function (s0, r) { return s0 + r.count; }, 0), totalSearch) },
      insights: insightsOf(sa, unanswered, fb, failed) };
  };
  function failedTasks(ctx) {
    var GO = root.JFGO, rows = null;
    if (GO) rows = tryf(function () { var f = GO.usability || GO.usabilityTests; var r = typeof f === 'function' ? f.call(GO, ctx) : null; return Array.isArray(r) ? r : (r && Array.isArray(r.list) ? r.list : null); }, null);
    if (rows && rows.length) return rows.map(function (u) { return { task: u.task || u.n || u.title || L(u.id), screen: u.screen || u.s || null, attempts: u.attempts || u.n || 1, fails: u.errors != null ? u.errors : (u.fails || 0), src: 'uat', id: u.id }; }).sort(function (a, b) { return b.fails - a.fails; });
    return D.FAILED.map(function (r) { return { id: r[0], task: r[1], screen: r[2], attempts: r[3], fails: r[4], rate: pct(r[4], r[3]), src: 'walkthrough' }; }).sort(function (a, b) { return b.rate - a.rate; });
  }
  function insightsOf(sa, unanswered, fb, failed) {
    var out = [];
    sa.filter(function (r) { return r.count >= 40 && r.top; }).slice(0, 4).forEach(function (r) {
      var sp = screenSpec(r.top.screen);
      out.push({ kind: 'ui', term: r.term, count: r.count, screen: r.top.screen, hlp: r.top.id, msg: L('Top search: "' + r.term + '" ' + r.count + ' pencarian. UI atau training ' + (sp ? T(sp.n) : r.top.screen) + ' mungkin perlu perbaikan.', 'Top search: "' + r.term + '" ' + r.count + ' searches. The UI or training of ' + (sp ? E(sp.n) : r.top.screen) + ' may need improvement.') });
    });
    unanswered.filter(function (r) { return r.count >= 5; }).slice(0, 3).forEach(function (r) { out.push({ kind: 'content', term: r.term, count: r.count, msg: L('"' + r.term + '" dicari ' + r.count + '× tanpa hasil: buat konten baru atau arahkan ke modul yang tepat.', '"' + r.term + '" searched ' + r.count + '× with no result: create content or point to the right module.') }); });
    fb.filter(function (r) { return r.pct != null && r.pct < 70 && r.yes + r.no >= 10; }).slice(0, 3).forEach(function (r) { out.push({ kind: 'content', hlp: r.id, pct: r.pct, msg: L(T(r.title) + ': hanya ' + r.pct + '% merasa terbantu — perbaiki langkah atau video.', E(r.title) + ': only ' + r.pct + '% found it helpful — improve the steps or video.') }); });
    failed.filter(function (r) { return (r.rate || pct(r.fails, r.attempts)) >= 25; }).slice(0, 2).forEach(function (r) { out.push({ kind: 'training', screen: r.screen, msg: L('Tugas sering gagal: ' + T(r.task) + ' (' + r.fails + '/' + r.attempts + '). Tambah praktik PANDU SAYA atau sederhanakan UI.', 'Frequently failed task: ' + E(r.task) + ' (' + r.fails + '/' + r.attempts + '). Add GUIDE ME practice or simplify the UI.') }); });
    return out;
  }
  M.insights = function (ctx) { var a = M.analytics(ctx); return a ? a.insights : []; };

  /* ---------- Engine-to-engine (JFGO readiness §94–§95, adoption §101, §116) ---------- */
  // No ctx: other engines read it. training = mean completion % of active internal users' required paths.
  M.readiness = function () {
    var rows = userRows().filter(function (r) { return !r.client; }).map(function (r) { return trainingOf(r.u, r.role, r.name, r.uid); }), s0 = summaryOf(rows);
    return { training: s0.overall, trainedPct: s0.trainedPct, users: s0.users, keyUsersTotal: s0.keyUsers.total, keyUsersTrained: s0.keyUsers.trained, keyUsersUntrained: s0.keyUsers.untrained, byRole: s0.byRole,
      content: { published: content().filter(function (a) { return a.status === 'published'; }).length, screensCovered: uniq(content().filter(function (a) { return a.status === 'published'; }).map(function (a) { return a.screen; })).length },
      gate: { ok: s0.keyUsers.untrained.length === 0, label: L('Key user wajib sudah terlatih', 'Required key users trained') },
      evidence: L(s0.users + ' user internal, rata-rata progres ' + s0.overall + '%; key user terlatih ' + s0.keyUsers.trained + '/' + s0.keyUsers.total + '.', s0.users + ' internal users, average progress ' + s0.overall + '%; key users trained ' + s0.keyUsers.trained + '/' + s0.keyUsers.total + '.') };
  };
  M.kpis = function (ctx) {
    if (ctx && !viewer(ctx)) return [];
    var sa = searchAgg(), searches = sa.reduce(function (s0, r) { return s0 + r.count; }, 0), opens = D.OPENS.reduce(function (s0, r) { return s0 + r[1]; }, 0) + S().opens.length;
    var users = uniq(S().searches.map(function (s) { return s.u; }).concat(S().opens.map(function (o) { return o.u; })).concat(S().asks.map(function (a) { return a.u; }))).length;
    var rd = M.readiness(), wl = D.WALK_USE.reduce(function (a, r) { return [a[0] + r[1], a[1] + r[2]]; }, [0, 0]);
    var un = sa.filter(function (r) { return r.results === 0; }).reduce(function (s0, r) { return s0 + r.count; }, 0);
    var fy = D.FEEDBACK.reduce(function (a, r) { return [a[0] + r[1], a[1] + r[2]]; }, [0, 0]);
    return [
      { k: 'helpUsage', n: L('Pemakaian Smart Help (30 hari)', 'Smart Help usage (30 days)'), v: searches + opens + S().asks.length, u: L('interaksi', 'interactions') },
      { k: 'searches', n: L('Pencarian bantuan', 'Help searches'), v: searches, u: '' },
      { k: 'helpUsersLive', n: L('User aktif bantuan (sesi ini)', 'Active help users (this session)'), v: users, u: '' },
      { k: 'tutorialCompletion', n: L('Penyelesaian tutorial', 'Tutorial completion'), v: rd.training, u: '%' },
      { k: 'walkCompletion', n: L('Walkthrough selesai', 'Walkthrough completion'), v: pct(wl[1], wl[0]), u: '%' },
      { k: 'unanswered', n: L('Pencarian tanpa jawaban', 'Unanswered searches'), v: pct(un, searches), u: '%' },
      { k: 'helpful', n: L('Konten membantu', 'Helpful content'), v: pct(fy[0], fy[0] + fy[1]), u: '%' },
      { k: 'keyUsersTrained', n: L('Key user terlatih', 'Key users trained'), v: rd.keyUsersTrained + '/' + rd.keyUsersTotal, u: '' }
    ];
  };
  // HELP-001 home in one call.
  M.home = function (ctx) {
    if (!viewer(ctx)) return null;
    var t = M.training(ctx);
    return { role: { k: ctx.roleKey, n: roleName(ctx.roleKey) }, forMe: M.forMe(ctx, 6), videos: M.forMe(ctx).filter(function (a) { return a.video; }).slice(0, 4).map(function (a) { return { id: a.id, title: a.title, len: a.video.len }; }),
      popular: (can(ctx, 'help.analytics') ? searchAgg() : searchAgg().filter(function (r) { return r.results > 0; })).slice(0, 5).map(function (r) { return { term: r.term, count: r.count }; }),
      walkthroughs: M.walkthroughs(ctx).filter(function (w) { return w.canDo; }), tour: M.tour(ctx), training: { pct: t.pct, st: t.st, stN: t.stN, trained: t.trained, paths: t.paths.length },
      glossary: M.glossary().slice(0, 8), canManage: can(ctx, 'help.manage'), canTeam: can(ctx, 'help.team'), contact: contactOf(ctx) };
  };

  /* ---------- Install ---------- */
  M.install = function (C, Xa, P, CM, LG, PR, DL, FN, CLP, SYS) {
    if (!C || C.__p12help) return; C.__p12help = true;
    M.C = C; M.X = Xa || null; M.P = P || null; M.CM = CM || null; M.LG = LG || null; M.PR = PR || null; M.DL = DL || null; M.FN = FN || null; M.CLP = CLP || null; M.SYS = SYS || null;
    Object.keys(M.PERMS).forEach(function (k) { C.PERMS[k] = M.PERMS[k]; });
    M.applyRolePerms();
    if (Xa && !Xa.__p12help) {
      Xa.__p12help = true;
      // Lazy re-apply: roles added after this install (JFIMP trainer/implead/…) or restored by a JFSYS demo reset.
      var oResolve = Xa.resolve; Xa.resolve = function () { M.applyRolePerms(); return oResolve.apply(Xa, arguments); };
      // HELP-001 is the Phase 4 spec object: enrich it in place so X.registerScreens (run later by app.js) serves this spec, still p4:true.
      var x1 = by(Xa.SCREENS || [], 'id', 'HELP-001');
      if (x1) { var mine = M.SCREENS[0]; Object.keys(mine).forEach(function (k) { if (k !== 'id') x1[k] = mine[k]; }); x1.p4 = true; x1.p = null; M.SCREENS[0] = x1; }
    }
    var orig = C.screen, extra = {};
    M.SCREENS.forEach(function (s) { extra[s.id] = s; });
    C.screen = function (id) { return extra[id] || orig(id); };
    C.SCREENS_P12HELP = M.SCREENS;
    // Unified audit: register with the guarded Phase 12 hook JFSYS.AUDIT_SOURCES when jfos-sys.js has it;
    // otherwise wrap auditAll so the Smart Help trail still shows as module "help".
    if (SYS && typeof SYS.auditAll === 'function' && !SYS.__p12help) {
      SYS.__p12help = true;
      if (SYS.AUDIT) Object.keys(M.AUDIT).forEach(function (k) { if (!SYS.AUDIT[k]) SYS.AUDIT[k] = M.AUDIT[k]; });
      if (SYS.AUDIT_MODULES && !SYS.AUDIT_MODULES.some(function (m) { return m[0] === 'help'; })) SYS.AUDIT_MODULES.push(['help', L('Smart Help (Fase 12)', 'Smart Help (Phase 12)')]);
      if (Array.isArray(SYS.AUDIT_SOURCES)) { if (!SYS.AUDIT_SOURCES.some(function (x) { return x[0] === 'help'; })) SYS.AUDIT_SOURCES.push(['help', function () { return S().audit; }]); M.auditVia = 'hook'; }
      else M.auditVia = 'wrap';
    }
    if (SYS && M.auditVia === 'wrap' && !SYS.__p12helpWrap) {
      SYS.__p12helpWrap = true;
      var oAll = SYS.auditAll;
      SYS.auditAll = function (ctx, f) {
        f = f || {};
        var rows = oAll.call(SYS, ctx, Object.assign({}, f, { limit: null }));
        if (!(ctx && ctx.perms && ctx.perms.indexOf('sys11.audit.view') >= 0) || (f.module && f.module !== 'help')) return f.limit ? rows.slice(0, f.limit) : rows;
        var kind = f.kind && SYS.AUDIT_KINDS ? SYS.AUDIT_KINDS.filter(function (k) { return k[0] === f.kind; })[0] : null, q = str(f.q).toLowerCase(), from = f.from ? ms(f.from) : null, to = f.to ? ms(f.to) + DAY : null;
        var n = S().audit.length, full = ctx.perms.indexOf('sys11.security.manage') >= 0;
        S().audit.forEach(function (e, i) {
          var at = ms(e.at), r = { id: 'HLP-' + e.id.slice(4), at: at, atS: e.at, user: e.actor, uid: e.uid, emp: e.emp, role: e.role, action: e.ev, actionN: M.AUDIT[e.ev] || L(e.ev), module: 'help', sub: e.module, rec: e.rec,
            before: e.before, after: e.after, device: e.device, ip: full ? '10.20.12.' + (n - i) : '10.20.•••.•••', reason: e.reason, result: e.result };
          if ((f.uid && r.uid !== f.uid && r.rec !== f.uid) || (f.user && String(r.user).toLowerCase().indexOf(String(f.user).toLowerCase()) < 0) || (f.action && r.action.indexOf(f.action) !== 0) || (kind && !kind[2].test(r.action)) ||
            (f.result && r.result !== f.result) || (from != null && at < from) || (to != null && at >= to) || (f.rec && r.rec !== f.rec) || (q && (r.action + ' ' + r.user + ' ' + (r.rec || '') + ' ' + (r.reason || '')).toLowerCase().indexOf(q) < 0)) return;
          rows.push(r);
        });
        rows.sort(function (a, b) { return b.at - a.at; });
        return f.limit ? rows.slice(0, f.limit) : rows;
      };
    }
    S();
  };
  M._reset = function () { SIM = ms(D.simNow); T0 = Date.now(); seed(); save(); if (M.C) M.applyRolePerms(); };

  if (typeof module !== 'undefined' && module.exports) module.exports = M;
  else root.JFHELP = M;
})(typeof window !== 'undefined' ? window : this);
