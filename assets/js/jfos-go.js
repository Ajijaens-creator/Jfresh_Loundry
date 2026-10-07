/* ==========================================================================
   JFRESH OS — Go-Live engine (Phase 12 · Engine B · JFGO)
   NP-06 data migration, cleansing & reconciliation · NP-08 UAT & usability ·
   NP-10 pilot, parallel run, data classification, Reset Center (soft erase),
   snapshot, cut-off, go-live preparation, START PRODUCTION, rollback ·
   NP-11 go-live command center, hypercare, incidents, readiness score, hard
   gates & the human Go/No-Go decision · NP-12 30/60/90 reviews, adoption,
   backlog, release & rollback plans · §109/§116 Fase 12 Command Center.

   ONE DATA, ONE SOURCE (§1–§4, §117): this engine never copies business
   records. Clients, orders, invoices, users, integrations… are read live
   from their owner engines and referenced by id. Resets are a SOFT ERASE
   kept in this store (owner engines are never mutated): screens and
   reporting ask M.isErased / M.visible / M.reportable. Every permission is
   checked here (the static app has no server). Prototype only.
   ========================================================================== */
(function (root) {
  function req(p) { try { return typeof require !== 'undefined' ? require(p) : null; } catch (e) { return null; } }
  var D = root.JFGO_DATA || req('./jfos-go-data.js');
  function L(a, b) { return [a, b === undefined ? a : b]; }
  var M = { version: 'NP 1.0', D: D, C: null, X: null, P: null, CM: null, LG: null, PR: null, DL: null, FN: null, CLP: null, SYS: null, IMP: null };
  var DAY = 864e5, HOUR = 36e5;
  function clone(o) { return o == null ? o : JSON.parse(JSON.stringify(o)); }
  function by(arr, k, v) { for (var i = 0; i < (arr || []).length; i++) if (arr[i][k] === v) return arr[i]; return null; }
  function T(x) { return Array.isArray(x) ? x[0] : (x == null ? '' : String(x)); }
  function str(x) { return String(x == null ? '' : x).trim(); }
  function ms(s) { if (typeof s === 'number') return s; if (!s) return 0; var p = String(s).split(/[-: T]/); return Date.UTC(+p[0], +p[1] - 1, +(p[2] || 1), +(p[3] || 0), +(p[4] || 0), +(p[5] || 0)); }
  function iso(t) { return new Date(t).toISOString().slice(0, 10); }
  function isoT(t) { return new Date(t).toISOString().slice(0, 16).replace('T', ' '); }
  function pct(a, b) { return b ? Math.round(a / b * 1000) / 10 : null; }
  function sum(a) { return a.reduce(function (s, x) { return s + (+x || 0); }, 0); }
  function uniq(a) { return a.filter(function (x, i) { return x != null && a.indexOf(x) === i; }); }
  function isDate(s) { if (!/^\d{4}-\d{2}-\d{2}$/.test(String(s || ''))) return false; var t = ms(s); return !isNaN(t) && iso(t) === String(s); }
  function isDT(s) { return /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/.test(String(s || '')) && isDate(String(s).slice(0, 10)) && +String(s).slice(11, 13) < 24 && +String(s).slice(14, 16) < 60; }
  function hash(s) { s = String(s); var h = 2166136261; for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0).toString(16).padStart(8, '0'); }
  function tryf(fn, dflt) { try { var v = fn(); return v == null ? dflt : v; } catch (e) { return dflt; } }
  function num(x) { if (typeof x === 'number') return x; if (x && typeof x === 'object') { var k = ['score', 'v', 'pct', 'value', 'n']; for (var i = 0; i < k.length; i++) if (typeof x[k[i]] === 'number') return x[k[i]]; } return null; }
  M.u = { L: L, T: T, ms: ms, iso: iso, isoT: isoT, pct: pct, hash: hash };

  M.MSG = {
    noperm: L('Anda tidak memiliki izin untuk tindakan ini.', 'You do not have permission for this action.'),
    notfound: L('Data tidak ditemukan.', 'Record not found.'),
    invalid: L('Periksa data dan coba lagi.', 'Check the data and try again.'),
    reason: L('Alasan wajib diisi.', 'A reason is required.'),
    jump: L('Langkah ini belum bisa dilakukan. Ikuti urutan proses.', 'This step is not possible yet. Follow the process order.'),
    dup: L('Data sudah ada.', 'This record already exists.'),
    scope: L('Data ini di luar cakupan Anda.', 'This record is outside your scope.'),
    maker: L('Pembuat permintaan tidak boleh menyetujui permintaannya sendiri.', 'The requester cannot approve their own request.'),
    gate: L('Syarat wajib belum terpenuhi.', 'Required conditions are not met.'),
    locked: L('Sudah dikunci dan tidak bisa diubah.', 'Locked and cannot be changed.'),
    inuse: L('Data dipakai data lain.', 'The record is used by other records.'),
    device: L('Tindakan ini hanya bisa dilakukan di desktop, tidak di HP (§113).', 'This action is desktop-only, never on mobile (§113).'),
    migFail: L('Migration validation failed.', 'Migration validation failed.'),
    load: L('Data belum berhasil dimuat. Coba Lagi.', 'The data could not be loaded. Try again.')
  };

  /* ---------- Permissions ---------- */
  M.PERMS = {
    'go.view': L('Lihat Go-Live (Fase 12)', 'View Go-Live (Phase 12)'),
    'go.mig.view': L('Lihat migrasi data', 'View data migration'), 'go.mig.manage': L('Jalankan pipeline migrasi', 'Run the migration pipeline'),
    'go.mig.approve': L('Setujui migrasi data', 'Approve data migration'), 'go.fin.approve': L('Persetujuan kedua Finance (migrasi & reset berdampak keuangan)', 'Finance second approval (finance-impacting migration & reset)'),
    'go.uat.view': L('Lihat UAT & usability', 'View UAT & usability'), 'go.uat.manage': L('Kelola UAT (QA & UAT Lead)', 'Manage UAT (QA & UAT Lead)'), 'go.uat.test': L('Jalankan tugas UAT', 'Run UAT tasks'),
    'go.cut.view': L('Lihat cutover & Reset Center', 'View cutover & Reset Center'), 'go.reset.request': L('Ajukan reset data', 'Request a data reset'),
    'go.reset.approve': L('Setujui reset data', 'Approve a data reset'), 'go.reset.execute': L('Eksekusi reset yang sudah disetujui', 'Execute an approved reset'),
    'go.snapshot': L('Buat snapshot', 'Create snapshots'), 'go.cutoff.manage': L('Atur cut-off & pilot', 'Set cut-off & pilot'),
    'go.start.approve': L('START PRODUCTION', 'START PRODUCTION'), 'go.golive.approve': L('Keputusan Go/No-Go', 'Go/No-Go decision'),
    'go.live.view': L('Go-Live Command Center & hypercare', 'Go-Live Command Center & hypercare'), 'go.incident.report': L('Laporkan masalah', 'Report a problem'),
    'go.incident.manage': L('Triage & tangani insiden', 'Triage & handle incidents'), 'go.opt.view': L('Lihat review & improvement', 'View reviews & improvement'),
    'go.opt.manage': L('Kelola backlog, review & release plan', 'Manage backlog, reviews & release plans')
  };
  var VIEWS = ['go.view', 'go.mig.view', 'go.uat.view', 'go.cut.view', 'go.live.view', 'go.opt.view'];
  M.ROLE_PERMS = {
    implead: VIEWS.concat(['go.reset.request', 'go.snapshot', 'go.cutoff.manage', 'go.incident.report', 'go.incident.manage', 'go.opt.manage']),
    qalead: ['go.view', 'go.mig.view', 'go.uat.view', 'go.uat.manage', 'go.uat.test', 'go.live.view', 'go.opt.view', 'go.incident.report'],
    datalead: ['go.view', 'go.mig.view', 'go.mig.manage', 'go.cut.view', 'go.reset.request', 'go.uat.view', 'go.incident.report'],
    trainer: ['go.uat.view', 'go.opt.view', 'go.incident.report'],
    owner: VIEWS.concat(['go.mig.approve', 'go.reset.approve', 'go.start.approve', 'go.golive.approve', 'go.incident.report', 'go.uat.test']),
    finance: ['go.mig.view', 'go.cut.view', 'go.fin.approve', 'go.uat.test', 'go.incident.report'],
    superadmin: ['go.view', 'go.mig.view', 'go.cut.view', 'go.live.view', 'go.reset.execute', 'go.snapshot', 'go.incident.report', 'go.incident.manage'],
    sysadmin: ['go.view', 'go.mig.view', 'go.cut.view', 'go.live.view', 'go.reset.execute', 'go.snapshot', 'go.incident.report', 'go.incident.manage'],
    prod1: ['go.uat.test', 'go.incident.report'], prod2: ['go.uat.test', 'go.incident.report'], prod3: ['go.uat.test', 'go.incident.report'],
    driver: ['go.uat.test', 'go.incident.report'], supply: ['go.uat.test', 'go.incident.report'],
    // Client UAT testers (§44) run their own cases; the engine limits them to cases assigned to them.
    client: ['go.uat.test']
  };
  // Every other internal role: report a problem (LIVE-003).
  M.BASE_PERMS = ['go.incident.report'];
  function can(ctx, p) { return !p || !!(ctx && ctx.perms && ctx.perms.indexOf(p) >= 0); }
  M.can = can;
  function empId(ctx) { return ctx && (ctx.employee ? ctx.employee.id : ctx.emp || ctx.uid) || 'system'; }
  function ctxName(ctx) { return ctx && (ctx.fullName || ctx.name) || 'Sistem JFRESH'; }
  function mobile(ctx, o) { return (o && (o.device === 'mobile' || o.device === 'm')) || (ctx && (ctx.device === 'mobile' || ctx.device === 'm')); }

  /* ---------- State ---------- */
  var KEY = 'jfos-go-v1', SNAPKEY = 'jfos-go-snap-v1', mem = {}, st = null, SIM = ms(D.simNow), T0 = Date.now(), fixed = null, snapMem = {};
  var ls = null;
  try { ls = root.localStorage || null; if (ls) { ls.setItem('__jfg', '1'); ls.removeItem('__jfg'); } } catch (e) { ls = null; }
  function clock() { if (fixed) return fixed(); if (M.LG && M.LG.now) return M.LG.now(); return SIM + (Date.now() - T0); }
  function S() {
    if (st) return st;
    try { var raw = ls ? ls.getItem(KEY) : mem[KEY]; if (raw) { var o = JSON.parse(raw); if (o && o.v === 1) { st = o; return st; } } } catch (e) {}
    seed(); save(); return st;
  }
  function save() { if (!st) return; st.upd = isoT(clock()); try { var s = JSON.stringify(st); if (ls) ls.setItem(KEY, s); else mem[KEY] = s; } catch (e) {} }
  M._setClock = function (fn) { fixed = fn; };
  M.now = function () { return clock(); };
  M.today = function () { return iso(M.now()); };
  function nowS() { return isoT(M.now()); }
  M.nowS = nowS;
  M.state = function () { return S(); };
  function nid(k, pre, pad) { var s = S(); var n = s.seq[k]++; return pre + String(n).padStart(pad || 3, '0'); }

  function seed() {
    st = { v: 1, upd: null, seq: { aud: 1, rsb: 1, snp: 1, inc: 4, bkl: 7, usb: 7, uc: 1 }, audit: [], tests: {}, erased: {}, resets: [], snaps: [], prod: null, decisions: [],
      mig: [], staged: {}, recon: {}, uat: [], usb: [], cycles: [], pilot: clone(D.PILOT), cutoff: clone(D.CUTOFF), incidents: [], hyper: {}, reviews: [], backlog: clone(D.BACKLOG), rpl: [], reads: {} };
    D.SOURCES.forEach(function (s, i) {
      st.mig.push({ id: 'MGB-' + String(i + 1).padStart(2, '0'), src: s[0], n: L(s[1], s[2]), owner: s[3], target: s[4], fin: s[5], kind: s[6], done: [], st: 'new', rows: [], summary: null, approvals: [], reqBy: null, log: [] });
    });
    st.uat = D.UAT.map(function (u) { return { id: u[0], group: u[1], role: u[2], tester: u[3], module: u[4], scenario: L(u[5], u[6]), pre: L('Login sebagai ' + u[3], 'Signed in as ' + u[3]), steps: u[7], expected: u[8], device: u[9], sev: u[10], st: u[11], actual: u[12], evidence: u[13].slice(), log: [] }; });
    st.usb = D.USABILITY.map(function (r) { return { id: r[0], user: r[1], task: L(r[2], r[3]), device: r[4], target: r[5], time: r[6], taps: r[7], errors: r[8], questions: r[9], help: r[10], diff: r[11], screen: r[12] || null }; });
    st.incidents = D.INCIDENTS.map(function (x) { return Object.assign({ log: [[x.st, x.at, x.by, null]], escalated: false, conf: x.st === 'closed' }, clone(x)); });
    D.HYPERCARE.forEach(function (h) { st.hyper[h[0] + ':' + h[1]] = { day: h[0], k: h[1], n: L(h[2], h[3]), st: 'todo', by: null, at: null, note: null }; });
    st.reviews = D.REVIEWS.map(function (r) { return { id: r.id, day: r.day, focus: L(r.focus[0], r.focus[1]), topics: r.topics.map(function (t) { return { n: L(t[0], t[1]), st: 'todo', note: null }; }), st: 'planned', findings: [] }; });
    st.rpl = D.RELEASE_PLANS.map(function (r) { var o = clone(r); o.steps = {}; M.RPL_STEPS.forEach(function (k) { o.steps[k] = r.done.indexOf(k) >= 0 ? { st: 'done', at: '2026-10-0' + (2 + M.RPL_STEPS.indexOf(k)) + ' 16:00', by: 'USR-121' } : { st: 'todo' }; }); delete o.done; return o; });
    return st;
  }

  /* ---------- Audit (§111 event names) ---------- */
  M.AUDIT = {
    MIGRATION_EXECUTED: L('Migrasi dieksekusi', 'Migration executed'), MIGRATION_APPROVED: L('Migrasi disetujui', 'Migration approved'), MIGRATION_STEP: L('Langkah migrasi', 'Migration step'),
    MIGRATION_ROW: L('Baris migrasi diperbaiki/ditolak', 'Migration row fixed/rejected'), RECON_UPDATE: L('Rekonsiliasi diperbarui', 'Reconciliation updated'),
    RESET_REQUESTED: L('Reset diajukan', 'Reset requested'), RESET_APPROVED: L('Reset disetujui', 'Reset approved'), RESET_EXECUTED: L('Reset dieksekusi (soft erase)', 'Reset executed (soft erase)'),
    RESET_STEP: L('Langkah reset', 'Reset step'), SNAPSHOT_CREATED: L('Snapshot dibuat', 'Snapshot created'), RESTORE_EXECUTED: L('Restore dieksekusi', 'Restore executed'),
    ROLLBACK_EXECUTED: L('Rollback dieksekusi', 'Rollback executed'), CUTOFF_SET: L('Cut-off diatur', 'Cut-off set'), PRODUCTION_START: L('Production Start', 'Production Start'),
    UAT_RESULT: L('Hasil UAT', 'UAT result'), UAT_COMPLETED: L('UAT selesai (sign-off)', 'UAT completed (sign-off)'), GOLIVE_APPROVED: L('Go-Live disetujui', 'Go-Live approved'),
    GOLIVE_DECISION: L('Keputusan Go/No-Go', 'Go/No-Go decision'), INCIDENT_REPORTED: L('Insiden dilaporkan', 'Incident reported'), INCIDENT_UPDATE: L('Insiden diperbarui', 'Incident updated'),
    INCIDENT_CLOSED: L('Insiden ditutup', 'Incident closed'), RELEASE_STEP: L('Langkah release plan', 'Release plan step'), RELEASE_DEPLOYED: L('Release dideploy', 'Release deployed'),
    BACKLOG_UPDATE: L('Backlog diperbarui', 'Backlog updated'), REVIEW_UPDATE: L('Review diperbarui', 'Review updated'), HYPERCARE_TICK: L('Hypercare dicentang', 'Hypercare ticked'),
    PILOT_UPDATE: L('Pilot diperbarui', 'Pilot updated'), TEST_TAGGED: L('Data ditandai TEST', 'Record tagged TEST'), ACCESS_DENIED: L('Akses ditolak', 'Access denied')
  };
  function J(x) { return x == null ? null : typeof x === 'string' ? x : JSON.stringify(x); }
  function devOf(ctx) { if (ctx && ctx.device) return ctx.device; var ua = root.navigator && root.navigator.userAgent || 'node'; return ua === 'node' ? 'test' : /iPad|Tablet/i.test(ua) ? 'ipad' : /Mobi|Android|iPhone/i.test(ua) ? 'mobile' : 'desktop'; }
  M.audit = function (ev, ctx, o) {
    o = o || {};
    var e = { id: 'GAU-' + String(S().seq.aud++).padStart(5, '0'), at: nowS(), ev: ev, uid: ctx && ctx.uid || null, emp: empId(ctx), actor: ctxName(ctx), role: ctx && ctx.roleKey || null, module: o.module || 'golive',
      rec: o.rec || null, before: J(o.before), after: J(o.after), reason: o.reason == null ? null : T(o.reason), result: o.result || 'ok', device: devOf(ctx) };
    S().audit.unshift(e); if (S().audit.length > 3000) S().audit.length = 3000; save();
    return e;
  };
  M.auditLog = function (f) { f = f || {}; return S().audit.filter(function (e) { return (!f.ev || e.ev === f.ev) && (!f.rec || e.rec === f.rec); }); };
  function deny(ctx, perm, rec) { M.audit('ACCESS_DENIED', ctx, { rec: rec || perm, after: perm, result: 'denied' }); return { ok: false, code: 'noperm', msg: M.MSG.noperm }; }
  function bad(code, msg, x) { return Object.assign({ ok: false, code: code || 'invalid', msg: msg || M.MSG[code] || M.MSG.invalid }, x || {}); }
  function needReason(r) { return str(T(r)) ? null : bad('reason'); }
  function noMobile(ctx, o, rec) { if (!mobile(ctx, o)) return null; M.audit('ACCESS_DENIED', ctx, { rec: rec, after: 'device:mobile', result: 'denied' }); return bad('device'); }
  M.deny = deny; M.bad = bad;

  /* ---------- Lazy links to the other Phase 12 engines (never at load time) ---------- */
  M._stub = {};
  function IMP() { return M._stub.imp !== undefined ? M._stub.imp : (M.IMP || root.JFIMP || null); }
  function HELP() { return M._stub.help !== undefined ? M._stub.help : (root.JFHELP || null); }
  function SYS() { return M.SYS || root.JFSYS || null; }
  function X() { return M.X; }
  function userByU(u) { var x = X(); return x ? by(x.USERS, 'u', u) : null; }
  function uidOf(u) { var r = userByU(u); return r ? r.id : null; }
  function nameOfUid(uid) { var x = X(); var u = x && by(x.USERS, 'id', uid); return u ? x.fullName(u) : uid; }
  function sysCtx(ctx, perms) { return Object.assign({}, ctx || {}, { perms: ((ctx && ctx.perms) || []).concat(perms) }); }

  /* ---------- NP-10 §68 record registry over the OWNER engines (read-only) ---------- */
  var AUTO_JV = ['inv', 'br', 'pay', 'dep', 'sum', 'cash', 'ap', 'apay', 'grn', 'mv'];
  function fs() { return M.FN ? M.FN.state() : null; }
  function ver(r) { return r.id + ' v' + r.v; }
  function opn(r) { return (M.FN && ['issued', 'partial', 'paid', 'overdue'].indexOf(M.FN.invSt(r)) >= 0); }
  // kind: master → REAL; tx → transactional chain member. date(r) is the business date used by cut-off/scope filters.
  M.MODS = {
    'cm.client': { n: L('Klien', 'Clients'), eng: 'JFCOMM', kind: 'master', list: function () { return M.CM.state().clients; }, id: function (r) { return r.id; }, cl: function (r) { return r.id; } },
    'cm.property': { n: L('Properti', 'Properties'), eng: 'JFCOMM', kind: 'master', list: function () { return M.CM.state().props; }, id: function (r) { return r.id; }, cl: function (r) { return r.cl; } },
    'cm.contact': { n: L('Kontak', 'Contacts'), eng: 'JFCOMM', kind: 'master', list: function () { return M.CM.state().contacts; }, id: function (r) { return r.id; }, cl: function (r) { return r.cl; } },
    'cm.contract': { n: L('Kontrak', 'Contracts'), eng: 'JFCOMM', kind: 'master', list: function () { return M.CM.state().contracts; }, id: function (r) { return r.no + ' v' + r.v; }, cl: function (r) { return r.cl; } },
    'cm.rate': { n: L('Rate Card', 'Rate Cards'), eng: 'JFCOMM', kind: 'master', list: function () { return M.CM.state().rcs; }, id: ver, cl: function (r) { return r.cl; } },
    'fn.item': { n: L('Item', 'Items'), eng: 'JFFIN', kind: 'master', list: function () { return fs().items; }, id: function (r) { return r.code; } },
    'fn.supplier': { n: L('Supplier', 'Suppliers'), eng: 'JFFIN', kind: 'master', list: function () { return fs().sups; }, id: function (r) { return r.id; } },
    'fn.stock': { n: L('Persediaan', 'Inventory'), eng: 'JFFIN', kind: 'master', list: function () { return fs().stock; }, id: function (r) { return r.code; } },
    'fn.asset': { n: L('Aset', 'Assets'), eng: 'JFFIN', kind: 'master', list: function () { return fs().assets; }, id: function (r) { return r.code; } },
    'fn.coa': { n: L('COA', 'COA'), eng: 'JFFIN', kind: 'master', list: function () { return (M.FN.D && M.FN.D.COA) || []; }, id: function (r) { return Array.isArray(r) ? r[0] : (r.code || r.id || r.a); } },
    'x.user': { n: L('User', 'Users'), eng: 'JFACCESS', kind: 'master', list: function () { return X().USERS.filter(function (u) { return !u.client; }); }, id: function (r) { return r.id; } },
    'x.employee': { n: L('Karyawan', 'Employees'), eng: 'JFACCESS', kind: 'master', list: function () { return X().EMPLOYEES; }, id: function (r) { return r.id; } },
    'lg.order': { n: L('Order', 'Orders'), eng: 'JFLOG', kind: 'tx', list: function () { return M.LG.state().orders; }, id: function (r) { return r.id; }, date: function (r) { return r.date; }, cl: function (r) { return r.cl; }, prop: function (r) { return r.prop; }, links: function () { return []; } },
    'pr.receiving': { n: L('Receiving', 'Receiving'), eng: 'JFPROD', kind: 'tx', list: function () { return M.PR.state().rcv; }, id: function (r) { return r.id; }, date: function (r) { return String(r.rcvAt || r.arrAt || '').slice(0, 10); }, cl: function (r) { return r.cl; }, prop: function (r) { return r.prop; }, links: function (r) { return [r.ord]; } },
    'pr.batch': { n: L('Batch produksi', 'Production batches'), eng: 'JFPROD', kind: 'tx', list: function () { return M.PR.state().batches; }, id: function (r) { return r.id; }, date: function (r) { return String(r.created && r.created[0] || '').slice(0, 10); }, cl: function (r) { return r.cl; }, prop: function (r) { return r.prop; }, links: function (r) { return (r.rcvs || []).concat([r.dlv]).concat(r.ords || []); } },
    'dl.delivery': { n: L('Delivery & POD', 'Delivery & POD'), eng: 'JFDLV', kind: 'tx', list: function () { return M.DL.state().dlv; }, id: function (r) { return r.id; }, date: function (r) { return r.date; }, cl: function (r) { return r.cl; }, prop: function (r) { return r.prop; }, links: function (r) { return [r.ord, r.oref, r.batch]; }, prot: function (r) { return r.pod ? 'pod' : null; } },
    'fn.billing': { n: L('Billing ready', 'Billing ready'), eng: 'JFFIN', kind: 'tx', list: function () { return fs().br; }, id: function (r) { return r.id; }, date: function (r) { return r.date; }, cl: function (r) { return r.cl; }, prop: function (r) { return r.prop; }, links: function (r) { return [r.dlv, r.ord, r.inv]; } },
    'fn.invoice': { n: L('Invoice', 'Invoices'), eng: 'JFFIN', kind: 'tx', list: function () { return fs().inv; }, id: function (r) { return r.id; }, date: function (r) { return r.issued; }, cl: function (r) { return r.cl; }, prop: function (r) { return r.prop; }, links: function (r) { return (r.lines || []).map(function (l) { return l.br; }); }, prot: function (r) { return opn(r) ? 'invoice' : null; } },
    'fn.payment': { n: L('Pembayaran', 'Payments'), eng: 'JFFIN', kind: 'tx', list: function () { return fs().pays; }, id: function (r) { return r.id; }, date: function (r) { return r.date; }, links: function (r) { return [r.inv, r.jv]; }, prot: function () { return 'payment'; } },
    'fn.journal': { n: L('Jurnal', 'Journals'), eng: 'JFFIN', kind: 'tx', list: function () { return fs().jv; }, id: function (r) { return r.id; }, date: function (r) { return r.date; }, links: function (r) { return [r.src && r.src.id]; }, prot: function (r) { return r.st === 'posted' || r.st === 'adjust' ? 'journal' : null; } },
    'fn.expense': { n: L('Hutang / biaya', 'Payables / expenses'), eng: 'JFFIN', kind: 'tx', list: function () { return fs().exp; }, id: function (r) { return r.id; }, date: function (r) { return r.date; }, links: function (r) { return [r.po, r.grn]; } },
    'fn.appay': { n: L('Pembayaran hutang', 'AP payments'), eng: 'JFFIN', kind: 'tx', list: function () { return fs().apays; }, id: function (r) { return r.id; }, date: function (r) { return r.date; }, links: function (r) { return [r.exp, r.jv]; }, prot: function () { return 'payment'; } },
    'fn.cash': { n: L('Transaksi kas', 'Cash transactions'), eng: 'JFFIN', kind: 'tx', list: function () { return fs().cashTx; }, id: function (r) { return r.id; }, date: function (r) { return r.date; }, links: function () { return []; } }
  };
  M.CLASSES = { DUMMY: L('Dummy', 'Dummy'), TEST: L('Test', 'Test'), MIGRATION: L('Migrasi', 'Migration'), REAL: L('Asli', 'Real'), SYSTEM: L('Dibuat sistem', 'System generated') };
  M.PROTECTED = { journal: L('Jurnal terposting', 'Posted journal'), invoice: L('Invoice terbit', 'Issued invoice'), payment: L('Pembayaran', 'Payment'), pod: L('POD', 'POD'),
    close: L('Tutup buku', 'Financial close'), hpp: L('HPP historis', 'Historical HPP'), price: L('Harga historis', 'Historical price'), audit: L('Audit log', 'Audit log') };
  M.ALTERNATIVES = [L('Reverse', 'Reverse'), L('Cancel', 'Cancel'), L('Archive', 'Archive'), L('Adjustment', 'Adjustment')];
  function modOf(mod) { var m = M.MODS[mod]; if (!m) return null; try { m.list(); return m; } catch (e) { return null; } }
  function recDate(mod, r) { var m = M.MODS[mod]; return m && m.date ? str(m.date(r)).slice(0, 10) : null; }
  function prodStartDay() { var p = S().prod; return p ? String(p.date).slice(0, 10) : null; }
  M.tagTest = function (ctx, mod, id) {
    if (!M.MODS[mod] || !id) return bad('invalid');
    S().tests[mod + ':' + id] = { at: nowS(), by: ctx && ctx.uid || 'system' };
    M.audit('TEST_TAGGED', ctx, { rec: id, after: mod }); save(); return { ok: true };
  };
  // §68 classification. Masters that represent the company are REAL; transactional demo seed is DUMMY; QA/UAT-created
  // records TEST; migrated opening records MIGRATION; auto-generated journals SYSTEM; after production start new records are REAL.
  M.classify = function (mod, rec) {
    if (mod === 'go.migration') return 'MIGRATION';
    var m = M.MODS[mod]; if (!m || !rec) return null;
    var id = m.id(rec);
    if (S().tests[mod + ':' + id]) return 'TEST';
    if (m.kind === 'master') return 'REAL';
    var ps = prodStartDay(), d = recDate(mod, rec);
    if (ps && d && d >= ps) return 'REAL';
    if (rec.mig === true) return 'MIGRATION';
    if (mod === 'fn.journal') { var t = rec.src && rec.src.t; if (t === 'open') return 'MIGRATION'; if (AUTO_JV.indexOf(t) >= 0) return 'SYSTEM'; }
    return 'DUMMY';
  };
  M.protectedType = function (mod, rec) { var m = M.MODS[mod]; return m && m.prot ? m.prot(rec) : null; };

  /* ---------- Soft erase view helpers (owner engines untouched) ---------- */
  M.isErased = function (mod, id) { var e = S().erased[mod + ':' + id]; return !!(e && !e.restored); };
  M.erasure = function (mod, id) { var e = S().erased[mod + ':' + id]; return e ? clone(e) : null; };
  M.visible = function (mod, rec) { var m = M.MODS[mod]; if (!m || !rec) return true; return !M.isErased(mod, m.id(rec)); };
  // Reporting helper (§83): erased records never count; after production start DUMMY/TEST records are excluded too.
  M.reportable = function (mod, rec) {
    if (!M.visible(mod, rec)) return false;
    if (!S().prod) return true;
    var c = M.classify(mod, rec); return c !== 'DUMMY' && c !== 'TEST';
  };
  M.filter = function (mod, list, o) { var f = o && o.report ? M.reportable : M.visible; return (list || []).filter(function (r) { return f(mod, r); }); };

  /* ---------- §78 dependency chains over REAL owner data (union-find on record ids) ---------- */
  function records() {
    var out = [];
    Object.keys(M.MODS).forEach(function (mod) {
      var m = modOf(mod); if (!m) return;
      m.list().forEach(function (r) { out.push({ key: mod + ':' + m.id(r), mod: mod, id: m.id(r), r: r, kind: m.kind }); });
    });
    return out;
  }
  function graph() {
    var all = records(), tx = all.filter(function (n) { return n.kind === 'tx'; }), idx = {}, par = {};
    tx.forEach(function (n) { if (!idx[n.id]) idx[n.id] = n.key; par[n.key] = n.key; });
    function find(k) { while (par[k] !== k) { par[k] = par[par[k]]; k = par[k]; } return k; }
    function join(a, b) { a = find(a); b = find(b); if (a !== b) par[b] = a; }
    tx.forEach(function (n) { (M.MODS[n.mod].links(n.r) || []).forEach(function (l) { if (l && idx[l] && idx[l] !== n.key) join(n.key, idx[l]); }); });
    var chains = {}, of = {};
    tx.forEach(function (n) { n.cls = M.classify(n.mod, n.r); n.prot = M.protectedType(n.mod, n.r); n.date = recDate(n.mod, n.r); var r = find(n.key); (chains[r] = chains[r] || []).push(n); });
    var list = Object.keys(chains).map(function (k, i) { var mem = chains[k]; var c = { id: 'CH-' + String(i + 1).padStart(3, '0'), members: mem }; mem.forEach(function (n) { of[n.key] = c; }); return c; });
    return { all: all, tx: tx, chains: list, of: of };
  }
  M.chains = function (ctx) {
    if (!can(ctx, 'go.cut.view')) return [];
    return graph().chains.filter(function (c) { return c.members.length > 1; }).map(function (c) {
      return { id: c.id, size: c.members.length, members: c.members.map(function (n) { return { mod: n.mod, id: n.id, cls: n.cls, prot: n.prot, erased: M.isErased(n.mod, n.id) }; }), classes: uniq(c.members.map(function (n) { return n.cls; })) };
    });
  };
  M.chainOf = function (mod, id) { var g = graph(), c = g.of[mod + ':' + id]; return c ? c.members.map(function (n) { return { mod: n.mod, id: n.id, cls: n.cls, prot: n.prot }; }) : []; };

  /* ---------- §68 counts per module × class ---------- */
  M.classes = function (ctx) {
    if (!can(ctx, 'go.cut.view') && !can(ctx, 'go.mig.view')) return null;
    var rows = [], tot = { DUMMY: 0, TEST: 0, MIGRATION: 0, REAL: 0, SYSTEM: 0 };
    Object.keys(M.MODS).forEach(function (mod) {
      var m = modOf(mod); if (!m) return;
      var c = { DUMMY: 0, TEST: 0, MIGRATION: 0, REAL: 0, SYSTEM: 0 }, er = 0;
      m.list().forEach(function (r) { if (M.isErased(mod, m.id(r))) { er++; return; } c[M.classify(mod, r)]++; });
      Object.keys(c).forEach(function (k) { tot[k] += c[k]; });
      rows.push({ mod: mod, n: m.n, eng: m.eng, kind: m.kind, counts: c, erased: er, total: m.list().length });
    });
    var stg = 0; Object.keys(S().staged).forEach(function (k) { stg += S().staged[k].length; });
    rows.push({ mod: 'go.migration', n: L('Staging migrasi', 'Migration staging'), eng: 'JFGO', kind: 'staging', counts: { DUMMY: 0, TEST: 0, MIGRATION: stg, REAL: 0, SYSTEM: 0 }, erased: 0, total: stg }); tot.MIGRATION += stg;
    var aud = auditCount(); rows.push({ mod: 'audit', n: L('Audit & notifikasi', 'Audit & notifications'), eng: 'ALL', kind: 'system', counts: { DUMMY: 0, TEST: 0, MIGRATION: 0, REAL: 0, SYSTEM: aud }, erased: 0, total: aud, protected: true }); tot.SYSTEM += aud;
    return { rows: rows, totals: tot, classes: M.CLASSES };
  };
  function auditCount() {
    var n = S().audit.length, x = X();
    if (x) n += tryf(function () { return x.auditLog().length; }, 0);
    [M.P, M.CM, M.LG, M.PR, M.DL, M.FN, M.CLP].forEach(function (E) { if (E && E.auditLog) n += tryf(function () { return E.auditLog().length; }, 0); });
    var s = SYS(); if (s && s.state) n += tryf(function () { return s.state().audit.length; }, 0);
    return n;
  }

  /* ---------- NP-06 §30–§36 migration pipeline ---------- */
  M.MIG_STEPS = ['extract', 'clean', 'normalize', 'map', 'validate', 'import', 'reconcile', 'approve'];
  M.MIG_STEP_N = { extract: L('Extract', 'Extract'), clean: L('Clean', 'Clean'), normalize: L('Normalize', 'Normalize'), map: L('Map', 'Map'), validate: L('Validate', 'Validate'), import: L('Import', 'Import'), reconcile: L('Reconcile', 'Reconcile'), approve: L('Approve', 'Approve') };
  M.ISSUES = { dup: L('Duplikat', 'Duplicate'), missing: L('Field wajib kosong', 'Missing field'), optional: L('Field kosong', 'Empty field'), unit: L('Satuan tidak valid', 'Invalid unit'), date: L('Tanggal salah', 'Incorrect date'),
    obsolete: L('Master usang', 'Obsolete master data'), ref: L('Referensi tidak valid', 'Invalid reference'), status: L('Status salah', 'Wrong status'), value: L('Nilai tidak didukung', 'Unsupported value'),
    unitDiff: L('Satuan beda dengan master', 'Unit differs from the master'), partial: L('Cocok sebagian, cek manual', 'Partial match, check manually'), weightDiff: L('Beda dengan berat yang disetujui', 'Differs from the approved weight'),
    notInNew: L('Tidak ada di JFRESH OS', 'Not in JFRESH OS'), dupNew: L('JFFIN mencatat dokumen ini lebih dari sekali', 'JFFIN holds this document more than once') };
  var REQ = { clients: ['name'], properties: ['name', 'client'], contacts: ['name', 'email'], contracts: ['no', 'start', 'end'], rates: ['client', 'svc', 'unit', 'rate'], items: ['name', 'unit'], weights: ['item', 'w', 'unit'],
    hpp: ['period', 'perKg'], pricelist: ['svc', 'price', 'eff'], suppliers: ['name'], inventory: ['code', 'qty', 'avg'], assets: ['code', 'nbv'], users: ['u', 'email'], ar: ['inv', 'client', 'open'], ap: ['ref', 'open'],
    cash: ['acc', 'bal'], bank: ['acc', 'bal'], opentx: ['ref', 'client', 'date'] };
  var UNITS = { items: ['kg', 'pcs'], rates: ['kg', 'pcs'], weights: ['g', 'kg'] };
  var STOP = ['pt', 'cv', 'ud', 'tbk', 'the', 'bpk', 'ibu', 'bapak', 'and', 'dan', '&'];
  function norm(s) { return str(s).toLowerCase().replace(/[.,'’()\/&-]+/g, ' ').replace(/\s+/g, ' ').trim(); }
  function toks(s) { return norm(s).split(' ').filter(function (w) { return w && STOP.indexOf(w) < 0; }); }
  function title(s) { return str(s).replace(/\s+/g, ' ').toLowerCase().replace(/(^|\s)\S/g, function (c) { return c.toUpperCase(); }); }
  function sub(a, b) { return a.length && a.every(function (w) { return b.indexOf(w) >= 0; }); }
  // Name matcher: exact normalized name → master ⊆ old tokens → old ⊆ master (unique → partial warning).
  function matchName(name, cands) {
    var nt = toks(name), nn = nt.join(' '); if (!nn) return null;
    for (var i = 0; i < cands.length; i++) if (cands[i].names.some(function (x) { return toks(x).join(' ') === nn; })) return { id: cands[i].id, how: 'exact' };
    var sup = cands.filter(function (c) { return c.names.some(function (x) { return sub(toks(x), nt); }); });
    if (sup.length === 1) return { id: sup[0].id, how: 'tokens' };
    var part = cands.filter(function (c) { return c.names.some(function (x) { return sub(nt, toks(x)); }); });
    if (part.length === 1) return { id: part[0].id, how: 'partial' };
    return null;
  }
  function batch(id) { return by(S().mig, 'id', id) || by(S().mig, 'src', id); }
  function srcDef(src) { var d = D.SOURCES.filter(function (s) { return s[0] === src; })[0]; return d; }
  function rowView(b, r) { return Object.assign({ batch: b.id, src: b.src }, clone(r)); }
  function issue(r, k, sev, note) { if (!r.issues.some(function (i) { return i.k === k; })) r.issues.push({ k: k, sev: sev, n: M.ISSUES[k], note: note || null }); }
  function rowSt(r) { return r.rej ? 'rejected' : r.issues.some(function (i) { return i.sev === 'error'; }) ? 'error' : r.issues.length ? 'warning' : 'ok'; }
  function summary(b) {
    var s = { total: b.rows.length, valid: 0, warning: 0, error: 0, rejected: 0, linked: 0, staged: 0, isNew: 0 };
    b.rows.forEach(function (r) { r.st = rowSt(r); if (r.st === 'ok') s.valid++; else s[r.st]++; if (r.res === 'linked') s.linked++; if (r.res === 'staged') s.staged++; if (r.match === 'new' && !r.rej) s.isNew++; });
    s.accuracy = pct(s.valid + s.warning, s.total - s.rejected || s.total);
    return s;
  }
  function stepOk(b, step) { var i = M.MIG_STEPS.indexOf(step); return b.done.length === i; }
  function migGuard(ctx, id, step) {
    if (!can(ctx, 'go.mig.manage')) return { r: deny(ctx, 'go.mig.manage', id) };
    var b = batch(id); if (!b) return { r: bad('notfound') };
    if (!stepOk(b, step)) return { r: bad('jump', null, { next: M.MIG_STEPS[b.done.length] || null }) };
    return { b: b };
  }
  function finish(ctx, b, step, after) {
    b.done.push(step); b.st = step === 'import' ? 'imported' : step === 'reconcile' ? 'reconciled' : step; b.summary = summary(b);
    b.log.unshift({ step: step, at: nowS(), by: ctx.uid, after: after || null });
    M.audit(step === 'import' ? 'MIGRATION_EXECUTED' : 'MIGRATION_STEP', ctx, { module: 'migration', rec: b.id, after: Object.assign({ step: step }, after || {}) }); save();
    return { ok: true, batch: M.migBatch(ctx, b.id) };
  }
  // Masters as match candidates, read from the owner engines.
  function cands(src) {
    var CM = M.CM, F = M.FN, x = X();
    switch (src) {
      case 'clients': return CM.clients().map(function (c) { return { id: c.id, names: [c.n, c.legal], tax: c.tax }; });
      case 'suppliers': return fs().sups.map(function (s) { return { id: s.id, names: [s.n] }; });
      case 'items': case 'weights': return fs().items.map(function (i) { return { id: i.code, names: [i.n[0], i.n[1], i.code], unit: i.billUnit }; });
      default: return [];
    }
  }
  function clientRef(code) { var cb = batch('clients'), r = cb && cb.rows.filter(function (x) { return x.old.code === code && x.target; })[0]; return r ? r.target : (D.LEGACY_CLIENT[code] || null); }
  function clientRefNew(code) { var cb = batch('clients'); return !!(cb && cb.rows.some(function (x) { return x.old.code === code && x.match === 'new' && !x.rej; })); }
  var STEP_FN = {
    extract: function (b) { b.rows = (D.OLD[b.src] || []).map(function (o, i) { return { n: i + 1, old: clone(o), norm: {}, issues: [], st: 'ok', target: null, match: null, res: null }; }); return { rows: b.rows.length }; },
    clean: function (b) {
      var seen = {};
      b.rows.forEach(function (r) {
        var o = r.old;
        (REQ[b.src] || []).forEach(function (f) { if (o[f] == null || str(o[f]) === '') issue(r, 'missing', 'error', f); });
        if (b.src === 'clients' && !str(o.tax)) issue(r, 'optional', 'warning', 'tax');
        if (o.obsolete || /tutup|closed|nonaktif/i.test(o.status || '')) issue(r, 'obsolete', 'error');
        if (UNITS[b.src] && o.unit && UNITS[b.src].indexOf(str(o.unit).toLowerCase()) < 0) issue(r, 'unit', 'error', o.unit);
        ['start', 'end', 'eff', 'date', 'due'].forEach(function (f) { if (o[f] && !isDate(o[f])) issue(r, 'date', 'error', f + ' ' + o[f]); });
        if (o.period && !/^\d{4}-(0[1-9]|1[0-2])$/.test(o.period)) issue(r, 'date', 'error', 'period ' + o.period);
        if (o.email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(o.email)) issue(r, 'value', 'error', 'email');
        ['w', 'qty', 'rate', 'price', 'perKg', 'open', 'bal', 'nbv', 'avg'].forEach(function (f) { if (o[f] != null && (typeof o[f] !== 'number' || o[f] < 0 || (f !== 'qty' && f !== 'bal' && f !== 'nbv' && f !== 'open' && o[f] === 0))) issue(r, 'value', 'error', f); });
        var k = b.src === 'users' || b.src === 'contacts' ? norm(o.email) : b.src === 'clients' ? (o.tax ? 'tax:' + o.tax : toks(o.name).join(' ')) : (b.src === 'items' || b.src === 'suppliers') ? toks(o.name).join(' ') : null;
        if (b.src === 'items' && k) k = (matchName(o.name, cands('items')) || { id: k }).id;
        if (b.src === 'suppliers' && k) k = (matchName(o.name, cands('suppliers')) || { id: k }).id;
        if (b.src === 'clients' && k && !o.tax) k = (matchName(o.name, cands('clients')) || { id: k }).id;
        if (b.src === 'clients' && o.tax) { var m0 = matchName(o.name, cands('clients')); if (m0) k = m0.id; }
        if (k) { if (seen[k]) { issue(r, 'dup', 'warning', 'row ' + seen[k]); r.dupOf = seen[k]; } else seen[k] = r.n; }
      });
      var s = summary(b); return { error: s.error, warning: s.warning };
    },
    normalize: function (b) {
      b.rows.forEach(function (r) {
        var o = r.old, n = {};
        if (o.name != null) n.name = b.src === 'items' || b.src === 'clients' || b.src === 'suppliers' ? title(o.name) : str(o.name);
        if (o.unit) n.unit = str(o.unit).toLowerCase();
        if (o.email) n.email = str(o.email).toLowerCase();
        if (o.u) n.u = str(o.u).toLowerCase();
        if (b.src === 'weights' && typeof o.w === 'number') { n.kg = n.unit === 'g' ? Math.round(o.w) / 1000 : o.w; n.unit = 'kg'; }
        r.norm = n;
      });
      return { rows: b.rows.length };
    },
    map: function (b) {
      var F = M.FN, CM = M.CM, x = X(), cs = CM.state();
      b.rows.forEach(function (r) {
        if (r.rej) return;
        var o = r.old, n = r.norm, m = null;
        if (r.dupOf) { var orig = by(b.rows, 'n', r.dupOf); if (orig && orig.target) { r.target = orig.target; r.match = 'dup'; return; } }
        switch (b.src) {
          case 'clients': {
            var byTax = o.tax && cs.clients.filter(function (c) { return c.tax === o.tax; })[0];
            m = byTax ? { id: byTax.id, how: 'tax' } : matchName(o.name, cands('clients')); break;
          }
          case 'properties': {
            var cl = clientRef(o.client);
            if (!cl) { if (clientRefNew(o.client)) { r.match = 'new'; return; } issue(r, 'ref', 'error', 'client ' + o.client); return; }
            m = matchName(o.name, CM.propsOf(cl).map(function (p) { return { id: p.id, names: [p.n, p.n.replace(/·/g, ' ')] }; }));
            r.cl = cl; break;
          }
          case 'contacts': { var ct = cs.contacts.filter(function (c) { return c.email && norm(c.email) === norm(o.email); })[0] || cs.contacts.filter(function (c) { return toks(c.n).join(' ') === toks(o.name).join(' '); })[0]; m = ct ? { id: ct.id, how: 'email' } : null; break; }
          case 'contracts': { var k = cs.contracts.filter(function (c) { return c.no === o.no; }).sort(function (a, c) { return c.v - a.v; })[0]; m = k ? { id: k.no + ' v' + k.v, how: 'no' } : null; break; }
          case 'rates': {
            var rc = clientRef(o.client); if (!rc) { issue(r, 'ref', 'error', 'client ' + o.client); return; }
            var card = cs.rcs.filter(function (c) { return c.cl === rc && c.status === 'active' && (c.lines || []).some(function (l) { return l.svc === o.svc; }); })[0];
            m = card ? { id: card.id + ' v' + card.v, how: 'card' } : null; break;
          }
          case 'items': {
            m = matchName(o.name, cands('items'));
            if (m) { var it = F.item(m.id); if (it && n.unit && it.billUnit !== n.unit) issue(r, 'unitDiff', 'warning', n.unit + ' ≠ ' + it.billUnit); }
            break;
          }
          case 'weights': {
            var wm = matchName(o.item, cands('weights'));
            if (wm) { var cur = tryf(function () { return F.weightAt(wm.id, M.today()); }, null); var kg = cur && (cur.kg != null ? cur.kg : cur); m = { id: wm.id, how: wm.how }; if (typeof kg === 'number' && n.kg != null && Math.abs(kg - n.kg) > 1e-9) issue(r, 'weightDiff', 'warning', n.kg + ' kg ≠ ' + kg + ' kg'); }
            break;
          }
          case 'hpp': { var h = fs().hpp.filter(function (x2) { return x2.p === o.period && x2.st === 'current'; })[0]; m = h ? { id: 'HPP ' + o.period, how: 'period' } : null; break; }
          case 'pricelist': { var sv = CM.services().filter(function (s) { return s.id === o.svc; })[0]; if (!sv) { issue(r, 'ref', 'error', 'svc ' + o.svc); return; } m = { id: o.svc + '@' + o.eff, how: 'svc' }; break; }
          case 'suppliers': m = matchName(o.name, cands('suppliers')); break;
          case 'inventory': { var sk = by(fs().stock, 'code', o.code); m = sk ? { id: sk.code, how: 'code' } : null; break; }
          case 'assets': { var as = by(fs().assets, 'code', o.code) || (o.serial && by(fs().assets, 'serial', o.serial)); m = as ? { id: as.code, how: 'code' } : null; break; }
          case 'users': { var us = x.USERS.filter(function (u) { return u.u.toLowerCase() === n.u || norm(u.email) === n.email; })[0]; m = us ? { id: us.id, how: 'user' } : null; break; }
          case 'ar': {
            r.cl = clientRef(o.client); if (!r.cl) issue(r, 'ref', 'error', 'client ' + o.client);
            var iv = F.invoice(o.inv); if (iv) m = { id: iv.id, how: 'no' }; else issue(r, 'notInNew', 'warning', o.inv); break;
          }
          case 'ap': {
            var ex = fs().exp.filter(function (e) { return e.sinv === o.ref || (e.ev === o.ref); });
            if (ex.length) { m = { id: ex[0].id, how: 'ref' }; if (ex.length > 1) issue(r, 'dupNew', 'warning', ex.map(function (e) { return e.id; }).join(', ')); } else issue(r, 'notInNew', 'warning', o.ref); break;
          }
          case 'cash': case 'bank': { var ac = tryf(function () { return F.cashAcc(o.acc); }, null); m = ac ? { id: o.acc, how: 'acc' } : null; if (!ac) issue(r, 'ref', 'error', o.acc); break; }
          case 'opentx': {
            var c2 = clientRef(o.client); if (!c2) { if (!clientRefNew(o.client)) issue(r, 'ref', 'error', 'client ' + o.client); r.match = 'new'; return; }
            var pb = batch('properties'), pr = pb && pb.rows.filter(function (y) { return y.old.code === o.prop; })[0], pid = pr && pr.target;
            var od = M.LG.state().orders.filter(function (y) { return y.cl === c2 && y.date === o.date && y.kind === o.kind && (!pid || y.prop === pid); })[0];
            m = od ? { id: od.id, how: 'order' } : null; r.cl = c2; break;
          }
        }
        if (m) { r.target = m.id; r.match = 'existing'; r.how = m.how; if (m.how === 'partial') issue(r, 'partial', 'warning'); }
        else if (!r.issues.some(function (i) { return i.k === 'ref'; })) r.match = r.match || 'new';
      });
      // A duplicate of a NEW row shares its staged identity (never a second new master).
      b.rows.forEach(function (r) { if (r.dupOf && !r.target) { var o2 = by(b.rows, 'n', r.dupOf); if (o2 && o2.match === 'new') r.match = 'dup'; } });
      var s = summary(b); return { existing: b.rows.filter(function (r) { return r.match === 'existing'; }).length, isNew: s.isNew, dup: b.rows.filter(function (r) { return r.match === 'dup'; }).length };
    },
    validate: function (b) { var s = summary(b); b.validated = nowS(); return { total: s.total, valid: s.valid, warning: s.warning, error: s.error, rejected: s.rejected }; },
    import: function (b) {
      var stg = S().staged[b.src] = S().staged[b.src] || [];
      b.rows.forEach(function (r) {
        if (r.rej || r.st === 'error') return;
        if (r.match === 'existing') { r.res = 'linked'; return; }
        if (r.match === 'dup') { var o = by(b.rows, 'n', r.dupOf); r.res = 'linked'; r.target = o && (o.target || o.staged) || null; return; }
        if (r.match === 'new') { var id = b.id + '-R' + String(r.n).padStart(3, '0'); if (!by(stg, 'id', id)) stg.push({ id: id, batch: b.id, src: b.src, n: r.n, data: Object.assign({}, r.old, r.norm), cls: 'MIGRATION', at: nowS(), st: 'staged' }); r.staged = id; r.res = 'staged'; }
      });
      var s = summary(b); return { linked: s.linked, staged: s.staged, rejected: s.rejected, writes: 0 };
    },
    reconcile: function (b) {
      var k = RECON_OF[b.src];
      if (k) { var rc = reconRow(k); return { recon: rc.id, st: rc.st, diff: rc.diff }; }
      var s = summary(b), ok = s.linked + s.staged + s.rejected === s.total; b.reconSt = ok ? 'reconciled' : 'difference';
      return { st: b.reconSt, linked: s.linked, staged: s.staged, rejected: s.rejected };
    }
  };
  M.runStep = function (ctx, id, step) {
    if (M.MIG_STEPS.indexOf(step) < 0 || step === 'approve') return bad('invalid');
    var g = migGuard(ctx, id, step); if (g.r) return g.r;
    var b = g.b;
    if (step === 'import') {
      var s0 = summary(b);
      if (s0.error) { M.audit('MIGRATION_STEP', ctx, { module: 'migration', rec: b.id, after: { step: 'import', error: s0.error }, result: 'failed' }); return bad('invalid', M.MSG.migFail, { errors: s0.error, rows: b.rows.filter(function (r) { return r.st === 'error'; }).map(function (r) { return r.n; }) }); }
    }
    var after = STEP_FN[step](b);
    return finish(ctx, b, step, after);
  };
  M.MIG_STEPS.slice(0, 7).forEach(function (s) { M['mig' + s.charAt(0).toUpperCase() + s.slice(1)] = function (ctx, id) { return M.runStep(ctx, id, s); }; });
  // Run every remaining automatic step up to (not incl.) a stop step; stops at the first refusal.
  M.runPipeline = function (ctx, id, until) {
    var b = batch(id); if (!b) return bad('notfound');
    var stop = M.MIG_STEPS.indexOf(until || 'approve'), last = { ok: true, batch: M.migBatch(ctx, b.id) };
    while (b.done.length < Math.min(stop, 7)) { last = M.runStep(ctx, b.id, M.MIG_STEPS[b.done.length]); if (!last.ok) return last; }
    return last;
  };
  M.rejectRow = function (ctx, id, n, reason) {
    if (!can(ctx, 'go.mig.manage')) return deny(ctx, 'go.mig.manage', id);
    var b = batch(id); if (!b) return bad('notfound'); var r = by(b.rows, 'n', n); if (!r) return bad('notfound');
    var r0 = needReason(reason); if (r0) return r0;
    if (b.done.indexOf('import') >= 0) return bad('locked');
    r.rej = { reason: T(reason), by: ctx.uid, at: nowS() }; r.st = 'rejected'; b.summary = summary(b);
    M.audit('MIGRATION_ROW', ctx, { module: 'migration', rec: b.id + '#' + n, after: 'rejected', reason: reason }); save();
    return { ok: true, row: rowView(b, r) };
  };
  M.fixRow = function (ctx, id, n, patch, reason) {
    if (!can(ctx, 'go.mig.manage')) return deny(ctx, 'go.mig.manage', id);
    var b = batch(id); if (!b) return bad('notfound'); var r = by(b.rows, 'n', n); if (!r) return bad('notfound');
    var r0 = needReason(reason); if (r0) return r0;
    if (b.done.indexOf('import') >= 0) return bad('locked');
    var before = clone(r.old); Object.assign(r.old, patch || {}); r.issues = []; r.target = null; r.match = null; r.rej = null; r.dupOf = null;
    // Re-run the completed automatic steps for this batch so the row is re-checked end to end.
    var done = b.done.slice(); b.done = []; done.forEach(function (s) { if (s !== 'extract') STEP_FN[s](b); b.done.push(s); });
    b.summary = summary(b);
    M.audit('MIGRATION_ROW', ctx, { module: 'migration', rec: b.id + '#' + n, before: before, after: r.old, reason: reason }); save();
    return { ok: true, row: rowView(b, r) };
  };
  function migRow(b) {
    var s = b.summary || summary(b), rc = RECON_OF[b.src] ? reconRow(RECON_OF[b.src]) : null;
    return { id: b.id, src: b.src, n: b.n, owner: b.owner, target: b.target, fin: b.fin, kind: b.kind, st: b.st, done: b.done.slice(), next: M.MIG_STEPS[b.done.length] || null,
      progress: Math.round(b.done.length / M.MIG_STEPS.length * 100), summary: s, recon: rc ? { id: rc.id, st: rc.st, diff: rc.diff } : (b.reconSt ? { st: b.reconSt } : null),
      approvals: b.approvals.slice(), reqBy: b.reqBy, needs: b.fin ? ['owner', 'finance'] : ['owner'] };
  }
  M.migration = function (ctx) {
    if (!can(ctx, 'go.mig.view')) return null;
    var rows = S().mig.map(migRow), tot = { total: 0, valid: 0, warning: 0, error: 0, rejected: 0 };
    rows.forEach(function (r) { ['total', 'valid', 'warning', 'error', 'rejected'].forEach(function (k) { tot[k] += r.summary[k]; }); });
    var approved = rows.filter(function (r) { return r.st === 'approved'; }).length;
    return { batches: rows, totals: tot, approved: approved, count: rows.length, accuracy: M.migAccuracy(), steps: M.MIG_STEPS, pending: rows.filter(function (r) { return r.st === 'pending'; }).length };
  };
  M.migBatch = function (ctx, id) {
    if (!can(ctx, 'go.mig.view')) return null;
    var b = batch(id); if (!b) return null;
    return Object.assign(migRow(b), { rows: b.rows.map(function (r) { return rowView(b, r); }), log: b.log.slice(0, 30), staged: (S().staged[b.src] || []).filter(function (x) { return x.batch === b.id; }) });
  };
  M.staged = function (ctx, src) { if (!can(ctx, 'go.mig.view')) return []; return clone(src ? (S().staged[src] || []) : [].concat.apply([], Object.keys(S().staged).map(function (k) { return S().staged[k]; }))); };
  // §116 migration accuracy: rows that reached a valid mapping (linked or staged) ÷ rows extracted that were not rejected.
  M.migAccuracy = function () {
    var ok = 0, n = 0; S().mig.forEach(function (b) { b.rows.forEach(function (r) { if (r.rej) return; n++; if (r.st !== 'error') ok++; }); });
    return n ? Math.round(ok / n * 1000) / 10 : null;
  };
  M.requestMigApproval = function (ctx, id, note) {
    if (!can(ctx, 'go.mig.manage')) return deny(ctx, 'go.mig.manage', id);
    var b = batch(id); if (!b) return bad('notfound');
    if (b.done.length !== 7) return bad('jump', null, { next: M.MIG_STEPS[b.done.length] });
    if (b.st === 'pending' || b.st === 'approved') return bad('dup');
    b.st = 'pending'; b.reqBy = ctx.uid; b.reqAt = nowS(); b.approvals = [];
    M.audit('MIGRATION_STEP', ctx, { module: 'migration', rec: b.id, after: { step: 'request' }, reason: note || null }); save();
    return { ok: true, batch: M.migBatch(ctx, b.id) };
  };
  M.approveMigration = function (ctx, id, reason) {
    var asOwner = can(ctx, 'go.mig.approve'), asFin = can(ctx, 'go.fin.approve');
    if (!asOwner && !asFin) return deny(ctx, 'go.mig.approve', id);
    var b = batch(id); if (!b) return bad('notfound');
    if (b.st !== 'pending') return bad('jump');
    if (b.reqBy === ctx.uid) { M.audit('ACCESS_DENIED', ctx, { rec: b.id, after: 'maker', result: 'denied' }); return bad('maker'); }
    var r0 = needReason(reason); if (r0) return r0;
    var role = asOwner ? 'owner' : 'finance';
    if (role === 'finance' && !b.fin) return bad('invalid', L('Batch ini tidak butuh persetujuan Finance.', 'This batch does not need a Finance approval.'));
    if (b.approvals.some(function (a) { return a.role === role || a.uid === ctx.uid; })) return bad('dup');
    var rk = RECON_OF[b.src]; if (rk) { var rc = reconRow(rk); if (rc.st === 'difference' || rc.st === 'review') return bad('gate', L('Selisih rekonsiliasi harus dijelaskan dan disetujui dulu.', 'The reconciliation difference must be explained and approved first.'), { recon: rc.id, diff: rc.diff }); }
    b.approvals.push({ role: role, uid: ctx.uid, at: nowS(), reason: T(reason) });
    var need = b.fin ? ['owner', 'finance'] : ['owner'], full = need.every(function (k) { return b.approvals.some(function (a) { return a.role === k; }); });
    if (full) { b.st = 'approved'; b.done.push('approve'); M.audit('MIGRATION_APPROVED', ctx, { module: 'migration', rec: b.id, after: { approvals: b.approvals.map(function (a) { return a.role + ':' + a.uid; }) }, reason: reason }); }
    else M.audit('MIGRATION_STEP', ctx, { module: 'migration', rec: b.id, after: { step: 'approve', role: role }, reason: reason });
    save();
    return { ok: true, approved: full, batch: M.migBatch(ctx, b.id) };
  };

  /* ---------- §35–§36 reconciliation: old (legacy rows) vs new (the REAL JFFIN numbers) ---------- */
  var RECON_OF = { ar: 'ar', ap: 'ap', inventory: 'stock', assets: 'asset', cash: 'cash', bank: 'bank' };
  M.RECON = {
    ar: { src: 'ar', n: L('Piutang (AR)', 'Receivables (AR)'), fld: 'open', fn: 'JFFIN.aging().total', opening: true },
    ap: { src: 'ap', n: L('Hutang (AP)', 'Payables (AP)'), fld: 'open', fn: 'JFFIN.apAging().total', opening: true },
    stock: { src: 'inventory', n: L('Persediaan', 'Inventory'), fld: null, fn: 'Σ JFFIN.stockValue(stock)', opening: true },
    asset: { src: 'assets', n: L('Nilai buku aset', 'Asset book value'), fld: 'nbv', fn: 'JFFIN.astDash().nbv', opening: false },
    cash: { src: 'cash', n: L('Kas', 'Cash'), fld: 'bal', fn: 'Σ JFFIN.accBal(cash accounts)', opening: true },
    bank: { src: 'bank', n: L('Bank', 'Bank'), fld: 'bal', fn: 'Σ JFFIN.accBal(bank accounts)', opening: true }
  };
  M.RECON_ST = { reconciled: [L('Reconciled', 'Reconciled'), 'ok'], difference: [L('Difference', 'Difference'), 'crit'], review: [L('Review Required', 'Review Required'), 'warn'], approved: [L('Approved', 'Approved'), 'ok'] };
  var CASH_T = ['cashier', 'ops', 'petty'], BANK_T = ['bank', 'payroll', 'restricted'];
  M.newSide = function (k) {
    var F = M.FN; if (!F) return null;
    switch (k) {
      case 'ar': return tryf(function () { return F.aging({ perms: ['ar.view'] }).total; }, null);
      case 'ap': return tryf(function () { return F.apAging({ perms: ['ap.view'] }).total; }, null);
      case 'stock': return sum(fs().stock.map(function (x) { return F.stockValue(x); }));
      case 'asset': return tryf(function () { return F.astDash({ perms: ['ast.view'] }).nbv; }, null);
      case 'cash': return sum(F.cashAccs().filter(function (a) { return CASH_T.indexOf(a.type) >= 0; }).map(function (a) { return F.accBal(a.id); }));
      case 'bank': return sum(F.cashAccs().filter(function (a) { return BANK_T.indexOf(a.type) >= 0; }).map(function (a) { return F.accBal(a.id); }));
    }
    return null;
  };
  function oldSide(k) {
    var def = M.RECON[k], b = batch(def.src), rows = b && b.rows.length ? b.rows.filter(function (r) { return !r.rej; }).map(function (r) { return r.old; }) : D.OLD[def.src];
    return sum(rows.map(function (o) { return def.fld ? o[def.fld] : Math.round(o.qty * o.avg); }));
  }
  function reconRow(k) {
    var def = M.RECON[k], s = S().recon[k] = S().recon[k] || { id: 'RCN-' + k.toUpperCase(), k: k, st: null, note: null, noteBy: null, appr: null, apprDiff: null, log: [] };
    var o = oldSide(k), n = M.newSide(k), diff = n == null ? null : Math.round((n - o) * 100) / 100;
    var stv = s.st;
    if (stv === 'approved' && s.apprDiff !== diff) stv = null;
    if (stv === 'review' && s.reviewDiff !== diff) stv = null;
    if (!stv) stv = diff === 0 ? 'reconciled' : 'difference';
    return { id: s.id, k: k, n: def.n, src: def.src, opening: def.opening, fn: def.fn, old: o, new: n, diff: diff, diffPct: o ? Math.round((diff || 0) / o * 10000) / 100 : null, st: stv, stN: M.RECON_ST[stv][0], tone: M.RECON_ST[stv][1], note: s.note, noteBy: s.noteBy, appr: s.appr, log: s.log.slice() };
  }
  M.reconciliation = function (ctx) { if (!can(ctx, 'go.mig.view')) return []; return Object.keys(M.RECON).map(reconRow); };
  M.reconItem = function (ctx, id) { if (!can(ctx, 'go.mig.view')) return null; var k = String(id).replace(/^RCN-/, '').toLowerCase(); return M.RECON[k] ? reconRow(k) : null; };
  M.explainRecon = function (ctx, id, note) {
    if (!can(ctx, 'go.mig.manage') && !can(ctx, 'go.fin.approve')) return deny(ctx, 'go.mig.manage', id);
    var k = String(id).replace(/^RCN-/, '').toLowerCase(); if (!M.RECON[k]) return bad('notfound');
    var r0 = needReason(note); if (r0) return r0;
    var cur = reconRow(k); if (cur.st !== 'difference') return bad('jump');
    var s = S().recon[k]; s.st = 'review'; s.reviewDiff = cur.diff; s.note = T(note); s.noteBy = ctx.uid; s.log.unshift({ at: nowS(), by: ctx.uid, st: 'review', note: T(note) });
    M.audit('RECON_UPDATE', ctx, { module: 'migration', rec: s.id, before: 'difference', after: 'review', reason: note }); save();
    return { ok: true, recon: reconRow(k) };
  };
  M.approveRecon = function (ctx, id, reason) {
    if (!can(ctx, 'go.fin.approve') && !can(ctx, 'go.mig.approve')) return deny(ctx, 'go.fin.approve', id);
    var k = String(id).replace(/^RCN-/, '').toLowerCase(); if (!M.RECON[k]) return bad('notfound');
    var r0 = needReason(reason); if (r0) return r0;
    var cur = reconRow(k); if (cur.st === 'difference') return bad('jump', L('Jelaskan selisih dulu (Review Required).', 'Explain the difference first (Review Required).'));
    if (cur.st === 'approved') return bad('dup');
    var s = S().recon[k]; if (s.noteBy && s.noteBy === ctx.uid) return bad('maker');
    s.st = 'approved'; s.apprDiff = cur.diff; s.appr = { uid: ctx.uid, at: nowS(), reason: T(reason) }; s.log.unshift({ at: nowS(), by: ctx.uid, st: 'approved', note: T(reason) });
    M.audit('RECON_UPDATE', ctx, { module: 'migration', rec: s.id, before: cur.st, after: 'approved', reason: reason }); save();
    return { ok: true, recon: reconRow(k) };
  };

  /* ---------- NP-08 §44–§49 UAT & usability ---------- */
  M.UAT_ST = { pass: [L('Pass', 'Pass'), 'ok'], fail: [L('Fail', 'Fail'), 'crit'], blocked: [L('Blocked', 'Blocked'), 'warn'], retest: [L('Retest', 'Retest'), 'info'] };
  M.SEV = { critical: [L('Critical', 'Critical'), 'crit', L('Kegagalan operasional atau keamanan', 'Operational or security failure')], high: [L('High', 'High'), 'warn', L('Fungsi utama gagal', 'Major function failure')],
    medium: [L('Medium', 'Medium'), 'info', L('Ada workaround', 'Workaround available')], low: [L('Low', 'Low'), 'mute', L('Masalah kecil', 'Minor issue')] };
  M.DEVICES = { mobile: L('Mobile', 'Mobile'), ipad: L('iPad Pro', 'iPad Pro'), desktop: L('Desktop', 'Desktop') };
  M.UAT_GROUPS = D.UAT_GROUPS.map(function (g) { return { k: g[0], n: L(g[1], g[2]) }; });
  function uatView(u) { var g = by(M.UAT_GROUPS, 'k', u.group); return Object.assign(clone(u), { testerUid: uidOf(u.tester), testerName: nameOfUid(uidOf(u.tester)), groupN: g ? g.n : L(u.group), stN: M.UAT_ST[u.st][0], tone: M.UAT_ST[u.st][1], sevN: M.SEV[u.sev][0], open: u.st !== 'pass', critical: u.sev === 'critical' && u.st !== 'pass' }); }
  function mine(ctx, u) { return ctx && ctx.uid && uidOf(u.tester) === ctx.uid; }
  M.uat = function (ctx, f) {
    f = f || {}; var all = can(ctx, 'go.uat.view');
    return S().uat.filter(function (u) { return (all || mine(ctx, u)) && (!f.group || u.group === f.group) && (!f.st || u.st === f.st) && (!f.sev || u.sev === f.sev) && (!f.device || u.device === f.device) && (!f.tester || u.tester === f.tester); }).map(uatView);
  };
  M.myUat = function (ctx) { return S().uat.filter(function (u) { return mine(ctx, u); }).map(uatView); };
  M.uatCase = function (ctx, id) { var u = by(S().uat, 'id', id); if (!u) return null; if (!can(ctx, 'go.uat.view') && !mine(ctx, u)) return null; return uatView(u); };
  M.recordUat = function (ctx, id, o) {
    var u = by(S().uat, 'id', id); if (!u) return bad('notfound');
    var mgr = can(ctx, 'go.uat.manage');
    if (!mgr && !(mine(ctx, u) && (can(ctx, 'go.uat.test') || (ctx && ctx.client)))) return deny(ctx, 'go.uat.test', id);
    o = o || {};
    if (['pass', 'fail', 'blocked'].indexOf(o.status) < 0) return bad('invalid', null, { errors: { status: L('Pilih Pass, Fail atau Blocked.', 'Pick Pass, Fail or Blocked.') } });
    if (o.status !== 'pass' && !str(o.actual)) return bad('invalid', null, { errors: { actual: L('Isi hasil aktual.', 'Fill in the actual result.') } });
    if (o.device && !M.DEVICES[o.device]) return bad('invalid');
    if (o.sev && (!mgr || !M.SEV[o.sev])) return o.sev && !mgr ? deny(ctx, 'go.uat.manage', id) : bad('invalid');
    var before = { st: u.st, sev: u.sev };
    u.st = o.status; u.actual = str(o.actual) || u.actual; if (o.device) u.device = o.device; if (o.sev) u.sev = o.sev;
    (o.evidence || []).forEach(function (e) { if (str(e)) u.evidence.push(str(e)); });
    u.log.unshift({ at: nowS(), by: ctx.uid, st: u.st, actual: u.actual });
    M.audit('UAT_RESULT', ctx, { module: 'uat', rec: u.id, before: before, after: { st: u.st, sev: u.sev, device: u.device } }); save();
    return { ok: true, uat: uatView(u) };
  };
  M.markRetest = function (ctx, id, note) {
    if (!can(ctx, 'go.uat.manage')) return deny(ctx, 'go.uat.manage', id);
    var u = by(S().uat, 'id', id); if (!u) return bad('notfound');
    if (u.st !== 'fail' && u.st !== 'blocked') return bad('jump');
    var r0 = needReason(note); if (r0) return r0;
    var b = u.st; u.st = 'retest'; u.log.unshift({ at: nowS(), by: ctx.uid, st: 'retest', actual: T(note) });
    M.audit('UAT_RESULT', ctx, { module: 'uat', rec: u.id, before: b, after: 'retest', reason: note }); save();
    return { ok: true, uat: uatView(u) };
  };
  M.addEvidence = function (ctx, id, name) {
    var u = by(S().uat, 'id', id); if (!u) return bad('notfound');
    if (!can(ctx, 'go.uat.manage') && !mine(ctx, u)) return deny(ctx, 'go.uat.test', id);
    if (!str(name)) return bad('invalid');
    u.evidence.push(str(name)); M.audit('UAT_RESULT', ctx, { module: 'uat', rec: u.id, after: { evidence: str(name) } }); save();
    return { ok: true, uat: uatView(u) };
  };
  M.uatSummary = function (ctx) {
    if (!can(ctx, 'go.uat.view')) return null;
    var l = S().uat, c = { pass: 0, fail: 0, blocked: 0, retest: 0 }; l.forEach(function (u) { c[u.st]++; });
    var cov = {}; l.forEach(function (u) { var r = cov[u.role] = cov[u.role] || { mobile: { n: 0, pass: 0 }, ipad: { n: 0, pass: 0 }, desktop: { n: 0, pass: 0 } }; r[u.device].n++; if (u.st === 'pass') r[u.device].pass++; });
    var groups = M.UAT_GROUPS.map(function (g) { var gl = l.filter(function (u) { return u.group === g.k; }); return { k: g.k, n: g.n, total: gl.length, pass: gl.filter(function (u) { return u.st === 'pass'; }).length }; });
    var crit = l.filter(function (u) { return u.sev === 'critical' && u.st !== 'pass'; }).map(uatView);
    var devs = { mobile: 0, ipad: 0, desktop: 0 }; l.forEach(function (u) { devs[u.device]++; });
    return { total: l.length, counts: c, passPct: pct(c.pass, l.length), completion: pct(l.length - c.retest - c.blocked, l.length), openCritical: crit, groups: groups, coverage: cov, devices: devs, cycles: clone(S().cycles), canSignOff: !crit.length };
  };
  M.signOffUat = function (ctx, reason) {
    if (!can(ctx, 'go.uat.manage')) return deny(ctx, 'go.uat.manage', 'UAT');
    var r0 = needReason(reason); if (r0) return r0;
    var sm = M.uatSummary(Object.assign({}, ctx, { perms: ctx.perms.concat(['go.uat.view']) }));
    if (sm.openCritical.length) return bad('gate', L('Tidak boleh sign-off dengan isu UAT Critical terbuka (§47).', 'No sign-off with open Critical UAT issues (§47).'), { failed: sm.openCritical.map(function (u) { return u.id; }) });
    var cy = { id: 'UT-C' + String(S().seq.uc++).padStart(2, '0'), at: nowS(), by: ctx.uid, passPct: sm.passPct, total: sm.total, reason: T(reason) };
    S().cycles.push(cy); M.audit('UAT_COMPLETED', ctx, { module: 'uat', rec: cy.id, after: { passPct: cy.passPct, total: cy.total }, reason: reason }); save();
    return { ok: true, cycle: clone(cy) };
  };
  // §48 thresholds: over 150% of target time, ≥2 errors, ≥2 questions or difficulty ≥4 → improve the UI first.
  function usbView(r) {
    var flags = [];
    if (r.time > r.target * 1.5) flags.push('time'); if (r.errors >= 2) flags.push('errors'); if (r.questions >= 2) flags.push('questions'); if (r.diff >= 4) flags.push('difficulty');
    return Object.assign(clone(r), { userName: nameOfUid(uidOf(r.user)), flags: flags, struggle: flags.length > 0, rec: flags.length ? 'improve_ui' : 'ok',
      recN: flags.length ? L('Perbaiki UI dulu — jangan hanya menambah training.', 'Improve the UI first — do not rely only on more training.') : L('Lancar.', 'Smooth.') });
  }
  M.usability = function (ctx) { if (!can(ctx, 'go.uat.view')) return []; return S().usb.map(usbView); };
  M.addUsability = function (ctx, f) {
    if (!can(ctx, 'go.uat.manage') && !(can(ctx, 'go.uat.view') && can(ctx, 'go.opt.view'))) return deny(ctx, 'go.uat.manage', 'USB');
    f = f || {};
    var nums = ['target', 'time', 'taps', 'errors', 'questions', 'diff'];
    if (!userByU(f.user) || !str(T(f.task)) || !M.DEVICES[f.device] || nums.some(function (k) { return typeof f[k] !== 'number' || f[k] < 0; }) || f.diff < 1 || f.diff > 5) return bad('invalid');
    var r = { id: nid('usb', 'USB-', 2), user: f.user, task: Array.isArray(f.task) ? f.task : L(f.task), device: f.device, target: f.target, time: f.time, taps: f.taps, errors: f.errors, questions: f.questions, help: !!f.help, diff: f.diff, screen: f.screen || null };
    S().usb.push(r); M.audit('UAT_RESULT', ctx, { module: 'uat', rec: r.id, after: { usability: true } }); save();
    return { ok: true, usability: usbView(r) };
  };

  /* ---------- §66–§67 pilot & parallel run ---------- */
  M.pilot = function (ctx) { if (!can(ctx, 'go.view') && !can(ctx, 'go.cut.view')) return null; var p = clone(S().pilot); p.clientNames = p.clients.map(function (c) { var x = M.CM.client(c); return x ? x.n : c; }); return p; };
  M.setPilot = function (ctx, patch, reason) {
    if (!can(ctx, 'go.cutoff.manage')) return deny(ctx, 'go.cutoff.manage', 'PILOT');
    var r0 = needReason(reason); if (r0) return r0; patch = patch || {};
    if (patch.clients && patch.clients.some(function (c) { return !M.CM.client(c); })) return bad('invalid');
    if (patch.props && patch.props.some(function (p) { return !M.CM.prop(p); })) return bad('invalid');
    if ((patch.from && !isDate(patch.from)) || (patch.to && !isDate(patch.to))) return bad('invalid');
    var b = clone(S().pilot); ['clients', 'props', 'shifts', 'teams', 'from', 'to', 'st'].forEach(function (k) { if (patch[k] != null) S().pilot[k] = clone(patch[k]); });
    M.audit('PILOT_UPDATE', ctx, { module: 'cutover', rec: 'PILOT', before: b, after: S().pilot, reason: reason }); save();
    return { ok: true, pilot: M.pilot(Object.assign({}, ctx, { perms: ['go.view'] })) };
  };
  M.parallel = function (ctx) {
    if (!can(ctx, 'go.view') && !can(ctx, 'go.cut.view')) return null;
    var p = S().pilot, inCl = function (c) { return p.clients.indexOf(c) >= 0; }, F = M.FN, old = D.PARALLEL_OLD;
    var vis = function (mod) { return function (r) { return M.visible(mod, r); }; };
    var nw = {
      orders: M.LG.state().orders.filter(vis('lg.order')).filter(function (o) { return inCl(o.cl) && o.st !== 'cancelled' && o.st !== 'draft'; }).length,
      weight: Math.round(sum(M.PR.state().rcv.filter(vis('pr.receiving')).filter(function (r) { return inCl(r.cl); }).map(function (r) { return r.weigh && r.weigh.net || 0; })) * 10) / 10,
      production: Math.round(sum(M.PR.state().batches.filter(vis('pr.batch')).filter(function (b) { return inCl(b.cl); }).map(function (b) { return b.kg || 0; })) * 10) / 10,
      delivery: M.DL.state().dlv.filter(vis('dl.delivery')).filter(function (d) { return inCl(d.cl); }).length,
      invoice: sum(fs().inv.filter(vis('fn.invoice')).filter(function (i) { return inCl(i.cl) && i.issued >= p.from && i.issued <= p.to; }).map(function (i) { return i.total; })),
      inventory: M.newSide('stock'), cash: M.newSide('cash') + M.newSide('bank')
    };
    var src = { orders: 'JFLOG.orders', weight: 'JFPROD.rcv.weigh.net', production: 'JFPROD.batches.kg', delivery: 'JFDLV.dlv', invoice: 'JFFIN.inv.total', inventory: 'JFFIN.stockValue', cash: 'JFFIN.accBal' };
    var N = { orders: L('Order', 'Orders'), weight: L('Berat (kg)', 'Weight (kg)'), production: L('Produksi (kg)', 'Production (kg)'), delivery: L('Delivery', 'Delivery'), invoice: L('Invoice (Rp)', 'Invoice (IDR)'), inventory: L('Persediaan (Rp)', 'Inventory (IDR)'), cash: L('Kas & bank (Rp)', 'Cash & bank (IDR)') };
    var rows = Object.keys(nw).map(function (k) { var d = Math.round((nw[k] - old[k]) * 100) / 100, dp = old[k] ? Math.round(d / old[k] * 1000) / 10 : null; return { k: k, n: N[k], old: old[k], new: nw[k], diff: d, diffPct: dp, st: Math.abs(dp || 0) <= 0.5 ? 'match' : Math.abs(dp) <= 2 ? 'review' : 'difference', src: src[k] }; });
    return { pilot: clone(p), rows: rows, match: rows.filter(function (r) { return r.st === 'match'; }).length };
  };

  /* ---------- §76 snapshots: serialized copy of every engine state + checksum ---------- */
  function engines() {
    var out = { JFPERF: M.P, JFCOMM: M.CM, JFLOG: M.LG, JFPROD: M.PR, JFDLV: M.DL, JFFIN: M.FN, JFCLP: M.CLP, JFSYS: SYS(), JFIMP: IMP(), JFHELP: HELP() };
    Object.keys(out).forEach(function (k) { if (!out[k] || typeof out[k].state !== 'function') delete out[k]; });
    return out;
  }
  function payloadNow() {
    var E = engines(), p = { at: nowS(), engines: {}, access: null, go: { erased: clone(S().erased), resets: S().resets.map(function (r) { return { id: r.id, st: r.st }; }) } };
    Object.keys(E).forEach(function (k) { p.engines[k] = tryf(function () { return clone(E[k].state()); }, null); });
    var x = X(); if (x) p.access = { users: clone(x.USERS.map(function (u) { return { id: u.id, u: u.u, status: tryf(function () { return x.account(u.id).status; }, null) }; })), audit: tryf(function () { return x.auditLog().length; }, 0) };
    return p;
  }
  function countsOf(p) {
    var c = {}; Object.keys(p.engines).forEach(function (k) { var s = p.engines[k] || {}, n = 0; Object.keys(s).forEach(function (f) { if (Array.isArray(s[f])) n += s[f].length; }); c[k] = n; });
    c.JFACCESS = p.access ? p.access.users.length : 0; return c;
  }
  function storeSnap(id, json) { snapMem = {}; snapMem[id] = json; try { if (ls) ls.setItem(SNAPKEY, JSON.stringify({ id: id, json: json })); } catch (e) {} }
  function loadSnap(id) { if (snapMem[id]) return snapMem[id]; try { var raw = ls && ls.getItem(SNAPKEY); if (raw) { var o = JSON.parse(raw); if (o.id === id) { snapMem[id] = o.json; return o.json; } } } catch (e) {} return null; }
  M.createSnapshot = function (ctx, o) {
    if (!can(ctx, 'go.snapshot')) return deny(ctx, 'go.snapshot', 'SNAPSHOT');
    o = o || {}; var r0 = needReason(o.reason); if (r0) return r0;
    var p = payloadNow(), json = JSON.stringify(p), sn = { id: nid('snp', 'SNP-'), at: nowS(), by: ctx.uid, reason: T(o.reason), checksum: hash(json), size: json.length, counts: countsOf(p), engines: Object.keys(p.engines), go: p.go, reset: o.reset || null, verified: null };
    storeSnap(sn.id, json); S().snaps.unshift(sn);
    if (o.reset) { var rs = by(S().resets, 'id', o.reset); if (rs && rs.step === 'preview') { rs.snap = sn.id; rs.step = 'snapshot'; rs.st = 'pending'; rs.log.unshift({ at: nowS(), by: ctx.uid, step: 'snapshot', note: sn.id }); } }
    M.audit('SNAPSHOT_CREATED', ctx, { module: 'cutover', rec: sn.id, after: { checksum: sn.checksum, size: sn.size, reset: o.reset || null }, reason: o.reason }); save();
    return { ok: true, snapshot: snapView(sn) };
  };
  function snapView(s) { var v = clone(s); v.payload = !!loadSnap(s.id); v.ageDays = Math.floor((M.now() - ms(s.at)) / DAY); delete v.go; return v; }
  M.snapshots = function (ctx) { if (!can(ctx, 'go.cut.view') && !can(ctx, 'go.snapshot')) return []; return S().snaps.map(snapView); };
  M.snapshot = function (ctx, id) { if (!can(ctx, 'go.cut.view') && !can(ctx, 'go.snapshot')) return null; var s = by(S().snaps, 'id', id); return s ? snapView(s) : null; };
  // Real round trip: re-read the stored payload, re-hash it and compare counts (no change to live data).
  M.verifySnapshot = function (ctx, id) {
    if (!can(ctx, 'go.snapshot') && !can(ctx, 'go.cut.view')) return deny(ctx, 'go.snapshot', id);
    var s = by(S().snaps, 'id', id); if (!s) return bad('notfound');
    var t0 = Date.now(), json = loadSnap(id);
    if (!json) { s.verified = { at: nowS(), ok: false, why: 'payload' }; save(); return { ok: true, match: false, why: L('Isi snapshot tidak tersedia di perangkat ini.', 'The snapshot payload is not on this device.') }; }
    var p = JSON.parse(json), ok = hash(json) === s.checksum && JSON.stringify(countsOf(p)) === JSON.stringify(s.counts);
    s.verified = { at: nowS(), ok: ok, ms: Date.now() - t0 }; save();
    return { ok: true, match: ok, counts: countsOf(p), ms: s.verified.ms };
  };
  function snapReady() { var s = S().snaps[0]; return !!(s && (M.now() - ms(s.at)) <= 7 * DAY && (!s.verified || s.verified.ok)); }

  /* ---------- §69–§80 Reset Center (soft erase in THIS store; owner engines untouched) ---------- */
  M.RESET_MODES = {
    dummy_only: { n: L('HAPUS DUMMY SAJA', 'DUMMY DATA ONLY'), cls: ['DUMMY', 'TEST'] },
    keep_real: { n: L('SISAKAN DATA ASLI SAJA', 'KEEP REAL DATA ONLY'), cls: ['DUMMY', 'TEST', 'SYSTEM'] },
    cutoff: { n: L('RESET BERDASARKAN CUT-OFF', 'RESET BY CUT-OFF'), cls: ['DUMMY', 'TEST', 'SYSTEM'] },
    soft: { n: L('SOFT RESET', 'SOFT RESET'), cls: ['DUMMY', 'TEST'] },
    full_clean: { n: L('FULL CLEAN START', 'FULL CLEAN START'), cls: ['DUMMY', 'TEST', 'SYSTEM', 'MIGRATION'] }
  };
  M.RESET_ACTIONS = { archive: L('Archive', 'Archive'), soft_erase: L('Soft Erase', 'Soft Erase'), delete: L('Permanent Delete', 'Permanent Delete') };
  M.RESET_STEPS = ['mode', 'cutoff', 'scope', 'deps', 'preview', 'snapshot', 'approved', 'executed', 'reconciled', 'ready'];
  M.RETENTION_DAYS = 30;
  function rsb(id) { return by(S().resets, 'id', id); }
  function stepIdx(r) { return M.RESET_STEPS.indexOf(r.step); }
  function modeClasses(r) { var c = M.RESET_MODES[r.mode].cls.slice(); if (S().prod) c = c.filter(function (k) { return k === 'DUMMY' || k === 'TEST'; }); if (r.action === 'delete') c = c.filter(function (k) { return k === 'DUMMY' || k === 'TEST'; }); return c; }
  function inScope(r, n) {
    var sc = r.scope || {}, m = M.MODS[n.mod], d = n.date;
    if (sc.mods && sc.mods.length && sc.mods.indexOf(n.mod) < 0) return false;
    if (sc.from && (!d || d < sc.from)) return false; if (sc.to && (!d || d > sc.to)) return false;
    if (sc.month && (!d || d.slice(0, 7) !== sc.month)) return false;
    if (sc.cl && (!m.cl || m.cl(n.r) !== sc.cl)) return false; if (sc.prop && (!m.prop || m.prop(n.r) !== sc.prop)) return false;
    if (sc.source && n.cls !== sc.source) return false; if (sc.status && n.r.st !== sc.status) return false;
    if (sc.by && n.r.by !== sc.by) return false; if (sc.env && sc.env !== (n.cls === 'TEST' ? 'UAT' : 'PRD')) return false;
    if (r.mode === 'cutoff') { var co = r.cutoff && r.cutoff.at; if (!co || !d || d > co.slice(0, 10)) return false; }
    return true;
  }
  // §78: a chain is archived whole or kept whole. SYSTEM members follow their source; any member of a class outside
  // the mode (REAL / MIGRATION / out-of-mode) keeps the whole chain.
  function computeTargets(r, g) {
    g = g || graph(); var cls = modeClasses(r), allow = cls.concat(r.action === 'delete' ? [] : ['SYSTEM']), targets = {}, kept = [], pulled = [], protectedHits = [];
    var cand = g.tx.filter(function (n) { return !M.isErased(n.mod, n.id) && cls.indexOf(n.cls) >= 0 && inScope(r, n); }), seen = {};
    cand.forEach(function (n) {
      var c = g.of[n.key]; if (seen[c.id]) return; seen[c.id] = true;
      var live = c.members.filter(function (x) { return !M.isErased(x.mod, x.id); });
      var blocker = live.filter(function (x) { return allow.indexOf(x.cls) < 0; })[0];
      if (blocker) { kept.push({ chain: c.id, size: live.length, because: { mod: blocker.mod, id: blocker.id, cls: blocker.cls }, sample: live.slice(0, 6).map(function (x) { return x.id; }) }); return; }
      live.forEach(function (x) { targets[x.key] = x; if (!(cls.indexOf(x.cls) >= 0 && inScope(r, x))) pulled.push({ mod: x.mod, id: x.id, cls: x.cls }); });
    });
    var list = Object.keys(targets).sort().map(function (k) { return targets[k]; });
    // §74 after production start: any protected record in scope or in a chain to delete refuses the whole request.
    if (r.action === 'delete' && S().prod) { var ph = {}; cand.concat(list).forEach(function (x) { if (x.prot && !ph[x.key]) { ph[x.key] = 1; protectedHits.push({ mod: x.mod, id: x.id, prot: x.prot }); } }); }
    return { list: list, kept: kept, pulled: pulled, protectedHits: protectedHits, hash: hash(list.map(function (x) { return x.key; }).join('|')), g: g };
  }
  function finImpact(list) { return list.some(function (x) { return x.r && /^fn\./.test(x.mod); }) ; }
  function rsbView(r) {
    var v = clone(r); v.modeN = M.RESET_MODES[r.mode].n; v.actionN = M.RESET_ACTIONS[r.action]; v.stepIdx = stepIdx(r); v.requesterName = nameOfUid(r.by);
    v.needs = r.fin ? ['owner', 'finance'] : ['owner']; v.canRestore = r.step !== 'mode' && ['executed', 'reconciled', 'ready'].indexOf(r.step) >= 0 && r.action !== 'delete' && !S().prod && (M.now() - ms(r.execAt)) <= M.RETENTION_DAYS * DAY;
    return v;
  }
  M.resets = function (ctx) { if (!can(ctx, 'go.cut.view')) return []; return S().resets.map(rsbView); };
  M.reset = function (ctx, id) { if (!can(ctx, 'go.cut.view')) return null; var r = rsb(id); return r ? rsbView(r) : null; };
  M.createReset = function (ctx, o) {
    if (!can(ctx, 'go.reset.request')) return deny(ctx, 'go.reset.request', 'RESET');
    o = o || {}; var dv = noMobile(ctx, o, 'RESET'); if (dv) return dv;
    if (!M.RESET_MODES[o.mode]) return bad('invalid', null, { errors: { mode: L('Pilih mode reset.', 'Pick a reset mode.') } });
    var action = o.action || 'soft_erase'; if (!M.RESET_ACTIONS[action]) return bad('invalid');
    var r0 = needReason(o.reason); if (r0) return r0;
    if (action === 'delete' && S().prod) { /* allowed to draft; protected records are refused at the dependency check */ }
    var r = { id: nid('rsb', 'RSB-'), mode: o.mode, action: action, reason: T(o.reason), by: ctx.uid, at: nowS(), step: 'mode', st: 'draft', cutoff: null, scope: {}, deps: null, preview: null, snap: null, approvals: [], fin: false, execAt: null, execBy: null, count: 0, restored: [], recon: null, log: [{ at: nowS(), by: ctx.uid, step: 'mode', note: o.mode }] };
    S().resets.unshift(r);
    M.audit('RESET_REQUESTED', ctx, { module: 'cutover', rec: r.id, after: { mode: r.mode, action: action }, reason: o.reason }); save();
    return { ok: true, reset: rsbView(r) };
  };
  function editable(ctx, r, o) {
    if (!can(ctx, 'go.reset.request')) return deny(ctx, 'go.reset.request', r && r.id);
    if (!r) return bad('notfound'); var dv = noMobile(ctx, o, r.id); if (dv) return dv;
    if (stepIdx(r) >= M.RESET_STEPS.indexOf('snapshot')) return bad('locked', L('Reset sudah di-snapshot / disetujui; buat permintaan baru.', 'The reset already has a snapshot / approval; create a new request.'));
    return null;
  }
  function back(r, step, ctx, note) { r.step = step; r.deps = stepIdx(r) < 3 ? null : r.deps; if (stepIdx(r) < 4) r.preview = null; r.log.unshift({ at: nowS(), by: ctx.uid, step: step, note: note || null }); }
  M.setResetCutoff = function (ctx, id, o) {
    var r = rsb(id), e = editable(ctx, r, o); if (e) return e;
    o = o || {}; var at = o.at || (S().cutoff && S().cutoff.at);
    if (!isDT(at)) return bad('invalid', null, { errors: { at: L('Format YYYY-MM-DD HH:MM.', 'Format YYYY-MM-DD HH:MM.') } });
    r.cutoff = { at: at }; back(r, 'cutoff', ctx, at);
    M.audit('RESET_STEP', ctx, { module: 'cutover', rec: r.id, after: { step: 'cutoff', at: at } }); save();
    return { ok: true, reset: rsbView(r) };
  };
  M.setResetScope = function (ctx, id, scope, o) {
    var r = rsb(id), e = editable(ctx, r, o); if (e) return e;
    if (r.mode === 'cutoff' && !r.cutoff) return bad('jump', L('Atur cut-off dulu.', 'Set the cut-off first.'));
    scope = scope || {};
    if ((scope.from && !isDate(scope.from)) || (scope.to && !isDate(scope.to)) || (scope.month && !/^\d{4}-\d{2}$/.test(scope.month)) || (scope.mods && scope.mods.some(function (m) { return !M.MODS[m]; })) || (scope.source && !M.CLASSES[scope.source])) return bad('invalid');
    r.scope = clone(scope); back(r, 'scope', ctx);
    M.audit('RESET_STEP', ctx, { module: 'cutover', rec: r.id, after: { step: 'scope', scope: r.scope } }); save();
    return { ok: true, reset: rsbView(r) };
  };
  M.dependencyCheck = function (ctx, id, o) {
    var r = rsb(id), e = editable(ctx, r, o); if (e) return e;
    if (r.step === 'mode' && r.mode !== 'cutoff') { r.step = 'scope'; }
    if (stepIdx(r) < M.RESET_STEPS.indexOf('scope')) return bad('jump');
    var t = computeTargets(r);
    if (t.protectedHits.length) {
      M.audit('RESET_STEP', ctx, { module: 'cutover', rec: r.id, after: { step: 'deps', protected: t.protectedHits.length }, result: 'denied' });
      return bad('locked', L('Setelah produksi dimulai, data ini tidak boleh dihapus permanen (§74). Gunakan Reverse, Cancel, Archive atau Adjustment.', 'After production start these records can never be hard-deleted (§74). Use Reverse, Cancel, Archive or Adjustment.'), { protected: t.protectedHits, alt: M.ALTERNATIVES });
    }
    var chains = uniq(t.list.map(function (x) { return t.g.of[x.key].id; }));
    r.deps = { at: nowS(), chains: chains.length, targets: t.list.length, kept: t.kept, pulled: t.pulled, orphans: 0 };
    r.step = 'deps'; r.preview = null; r.log.unshift({ at: nowS(), by: ctx.uid, step: 'deps', note: t.list.length + ' records' });
    M.audit('RESET_STEP', ctx, { module: 'cutover', rec: r.id, after: { step: 'deps', targets: t.list.length, kept: t.kept.length } }); save();
    return { ok: true, reset: rsbView(r), deps: clone(r.deps) };
  };
  M.previewReset = function (ctx, id, o) {
    var r = rsb(id), e = editable(ctx, r, o); if (e) return e;
    if (stepIdx(r) < M.RESET_STEPS.indexOf('deps')) return bad('jump', L('Jalankan dependency check dulu.', 'Run the dependency check first.'));
    var t = computeTargets(r), keys = {}; t.list.forEach(function (x) { keys[x.key] = true; });
    var byMod = {}, retain = { count: 0, byModule: {}, sample: [] };
    t.list.forEach(function (x) { var b = byMod[x.mod] = byMod[x.mod] || { mod: x.mod, n: M.MODS[x.mod].n, count: 0, sample: [], classes: {} }; b.count++; b.classes[x.cls] = (b.classes[x.cls] || 0) + 1; if (b.sample.length < 5) b.sample.push(x.id); });
    t.g.all.forEach(function (x) { if (keys[x.key] || M.isErased(x.mod, x.id)) return; retain.count++; retain.byModule[x.mod] = (retain.byModule[x.mod] || 0) + 1; if (retain.sample.length < 8 && x.kind === 'tx') retain.sample.push(x.id); });
    var del = r.action === 'delete', fin = finImpact(t.list);
    r.preview = { at: nowS(), hash: t.hash, retain: retain, archive: del ? { count: 0 } : { count: t.list.length, byModule: Object.keys(byMod).map(function (k) { return byMod[k]; }) },
      del: del ? { count: t.list.length, byModule: Object.keys(byMod).map(function (k) { return byMod[k]; }) } : { count: 0 }, recoverable: del ? 0 : t.list.length,
      dependencies: { chains: r.deps.chains, kept: t.kept, pulled: t.pulled }, finance: fin, keys: t.list.map(function (x) { return x.key; }) };
    r.fin = fin; r.step = 'preview'; r.log.unshift({ at: nowS(), by: ctx.uid, step: 'preview', note: t.list.length + ' records' });
    M.audit('RESET_STEP', ctx, { module: 'cutover', rec: r.id, after: { step: 'preview', archive: r.preview.archive.count, del: r.preview.del.count, retain: retain.count, fin: fin } }); save();
    var v = clone(r.preview); delete v.keys; return { ok: true, reset: rsbView(r), preview: v };
  };
  M.approveReset = function (ctx, id, reason, o) {
    var asOwner = can(ctx, 'go.reset.approve'), asFin = can(ctx, 'go.fin.approve');
    if (!asOwner && !asFin) return deny(ctx, 'go.reset.approve', id);
    var r = rsb(id); if (!r) return bad('notfound');
    var dv = noMobile(ctx, o, r.id); if (dv) return dv;
    if (r.step === 'preview' || !r.preview) return bad('jump', L('Snapshot wajib sebelum persetujuan (§76).', 'A snapshot is required before approval (§76).'));
    if (r.step !== 'snapshot') return bad('jump');
    if (r.by === ctx.uid) { M.audit('ACCESS_DENIED', ctx, { rec: r.id, after: 'maker', result: 'denied' }); return bad('maker'); }
    var r0 = needReason(reason); if (r0) return r0;
    var role = asOwner ? 'owner' : 'finance';
    if (role === 'finance' && !r.fin) return bad('invalid', L('Reset ini tidak berdampak keuangan.', 'This reset is not finance-impacting.'));
    if (r.approvals.some(function (a) { return a.role === role || a.uid === ctx.uid; })) return bad('dup');
    r.approvals.push({ role: role, uid: ctx.uid, at: nowS(), reason: T(reason) });
    var need = r.fin ? ['owner', 'finance'] : ['owner'], full = need.every(function (k) { return r.approvals.some(function (a) { return a.role === k; }); });
    if (full) { r.step = 'approved'; r.st = 'approved'; }
    r.log.unshift({ at: nowS(), by: ctx.uid, step: 'approval', note: role });
    M.audit('RESET_APPROVED', ctx, { module: 'cutover', rec: r.id, after: { role: role, complete: full }, reason: reason }); save();
    return { ok: true, approved: full, reset: rsbView(r) };
  };
  M.executeReset = function (ctx, id, o) {
    if (!can(ctx, 'go.reset.execute')) return deny(ctx, 'go.reset.execute', id);
    var r = rsb(id); if (!r) return bad('notfound');
    var dv = noMobile(ctx, o, r.id); if (dv) return dv;
    if (r.step !== 'approved') return bad('jump', !r.preview ? L('Preview wajib sebelum eksekusi.', 'A preview is required before execution.') : !r.snap ? L('Snapshot wajib (§76).', 'A snapshot is required (§76).') : L('Persetujuan belum lengkap.', 'Approval is not complete.'));
    if (!by(S().snaps, 'id', r.snap)) return bad('jump');
    var t = computeTargets(r);
    if (t.protectedHits.length) return bad('locked', null, { protected: t.protectedHits, alt: M.ALTERNATIVES });
    if (t.hash !== r.preview.hash) return bad('jump', L('Data berubah sejak preview. Jalankan ulang dependency check & preview.', 'Data changed since the preview. Re-run the dependency check & preview.'));
    var kind = r.action === 'delete' ? 'deleted' : r.action === 'archive' ? 'archived' : 'soft_erased';
    t.list.forEach(function (x) { S().erased[x.key] = { rsb: r.id, at: nowS(), by: ctx.uid, reason: r.reason, orig: x.r.st || null, cls: x.cls, kind: kind, mod: x.mod, id: x.id, restored: null }; });
    r.step = 'executed'; r.st = 'executed'; r.execAt = nowS(); r.execBy = ctx.uid; r.count = t.list.length; r.log.unshift({ at: nowS(), by: ctx.uid, step: 'executed', note: t.list.length + ' ' + kind });
    M.audit('RESET_EXECUTED', ctx, { module: 'cutover', rec: r.id, after: { count: t.list.length, kind: kind, snapshot: r.snap } }); save();
    return { ok: true, reset: rsbView(r), count: t.list.length };
  };
  // §77 reconcile: every chain is uniformly erased or uniformly kept (no orphan), counts match the preview.
  M.orphanCheck = function () {
    var g = graph(), bad2 = [];
    g.chains.forEach(function (c) { var e = c.members.filter(function (n) { return M.isErased(n.mod, n.id); }).length; if (e && e < c.members.length) bad2.push({ chain: c.id, erased: e, size: c.members.length, sample: c.members.slice(0, 5).map(function (n) { return n.id + (M.isErased(n.mod, n.id) ? '×' : ''); }) }); });
    return bad2;
  };
  M.reconcileReset = function (ctx, id) {
    if (!can(ctx, 'go.reset.execute') && !can(ctx, 'go.reset.request')) return deny(ctx, 'go.reset.execute', id);
    var r = rsb(id); if (!r) return bad('notfound'); if (r.step !== 'executed') return bad('jump');
    var orph = M.orphanCheck(), n = Object.keys(S().erased).filter(function (k) { var e = S().erased[k]; return e.rsb === r.id && !e.restored; }).length;
    r.recon = { at: nowS(), orphans: orph, erased: n, expected: r.preview.keys.length, ok: !orph.length && n === r.preview.keys.length };
    if (!r.recon.ok) { save(); return bad('gate', L('Rekonsiliasi reset gagal: ada orphan atau jumlah tidak cocok.', 'Reset reconciliation failed: orphans or a count mismatch.'), { recon: clone(r.recon) }); }
    r.step = 'reconciled'; r.st = 'reconciled'; r.log.unshift({ at: nowS(), by: ctx.uid, step: 'reconciled', note: null });
    M.audit('RESET_STEP', ctx, { module: 'cutover', rec: r.id, after: { step: 'reconciled', erased: n } }); save();
    return { ok: true, reset: rsbView(r) };
  };
  M.markResetReady = function (ctx, id) {
    if (!can(ctx, 'go.reset.execute') && !can(ctx, 'go.reset.request')) return deny(ctx, 'go.reset.execute', id);
    var r = rsb(id); if (!r) return bad('notfound'); if (r.step !== 'reconciled') return bad('jump');
    r.step = 'ready'; r.st = 'ready'; r.log.unshift({ at: nowS(), by: ctx.uid, step: 'ready', note: null });
    M.audit('RESET_STEP', ctx, { module: 'cutover', rec: r.id, after: { step: 'ready' } }); save();
    return { ok: true, reset: rsbView(r) };
  };
  // §72 restore selected / all within retention; a selected record brings back its whole chain from that batch.
  M.restoreReset = function (ctx, id, o) {
    if (!can(ctx, 'go.reset.execute')) return deny(ctx, 'go.reset.execute', id);
    var r = rsb(id); if (!r) return bad('notfound'); o = o || {};
    var dv = noMobile(ctx, o, r.id); if (dv) return dv;
    var r0 = needReason(o.reason); if (r0) return r0;
    if (['executed', 'reconciled', 'ready'].indexOf(r.step) < 0) return bad('jump');
    if (r.action === 'delete') return bad('locked', L('Data yang dihapus permanen tidak bisa di-restore.', 'Permanently deleted records cannot be restored.'));
    if (S().prod) return bad('locked', L('Setelah Production Start, data dummy tidak dikembalikan ke data operasional.', 'After Production Start dummy data is not brought back into operations.'));
    if (M.now() - ms(r.execAt) > M.RETENTION_DAYS * DAY) return bad('locked', L('Lewat masa retensi.', 'Past the retention period.'));
    var mineKeys = Object.keys(S().erased).filter(function (k) { var e = S().erased[k]; return e.rsb === r.id && !e.restored; }), pick;
    if (o.all) pick = mineKeys;
    else {
      var ids = o.ids || []; if (!ids.length) return bad('invalid');
      var g = graph(), set = {};
      mineKeys.forEach(function (k) { var e = S().erased[k]; if (ids.indexOf(e.id) >= 0) { var c = g.of[k]; (c ? c.members.map(function (n) { return n.key; }) : [k]).forEach(function (kk) { if (mineKeys.indexOf(kk) >= 0) set[kk] = true; }); } });
      pick = Object.keys(set); if (!pick.length) return bad('notfound');
    }
    pick.forEach(function (k) { S().erased[k].restored = { at: nowS(), by: ctx.uid, reason: T(o.reason) }; });
    r.restored = r.restored.concat(pick); r.log.unshift({ at: nowS(), by: ctx.uid, step: 'restore', note: pick.length + ' records' });
    M.audit('RESTORE_EXECUTED', ctx, { module: 'cutover', rec: r.id, after: { restored: pick.length, all: !!o.all }, reason: o.reason }); save();
    return { ok: true, restored: pick.length, reset: rsbView(r) };
  };
  M.erasedList = function (ctx, f) {
    if (!can(ctx, 'go.cut.view')) return []; f = f || {};
    return Object.keys(S().erased).map(function (k) { return clone(S().erased[k]); }).filter(function (e) { return (!f.rsb || e.rsb === f.rsb) && (f.all || !e.restored) && (!f.mod || e.mod === f.mod); });
  };
  // §74 hard-delete protection for one record.
  M.canHardDelete = function (mod, rec) {
    var m = M.MODS[mod]; if (!m || !rec) return bad('notfound');
    var cls = M.classify(mod, rec), prot = M.protectedType(mod, rec);
    if (m.kind === 'master') return bad('locked', L('Master data asli tidak pernah dihapus permanen; nonaktifkan saja.', 'Real master data is never hard-deleted; deactivate it instead.'), { cls: cls, alt: M.ALTERNATIVES });
    if (S().prod && prot) return bad('locked', L(T(M.PROTECTED[prot]) + ' tidak boleh dihapus permanen setelah produksi (§74).', M.PROTECTED[prot][1] + ' can never be hard-deleted after production start (§74).'), { prot: prot, cls: cls, alt: M.ALTERNATIVES });
    if (cls !== 'DUMMY' && cls !== 'TEST') return bad('locked', L('Hanya data DUMMY/TEST yang boleh dihapus permanen.', 'Only DUMMY/TEST records may be permanently deleted.'), { cls: cls, alt: M.ALTERNATIVES });
    return { ok: true, cls: cls, needs: ['preview', 'snapshot', 'dual approval'] };
  };

  /* ---------- §75 cut-off ---------- */
  M.cutoff = function (ctx) { if (!can(ctx, 'go.cut.view') && !can(ctx, 'go.view')) return null; return clone(S().cutoff); };
  M.setCutoff = function (ctx, o) {
    if (!can(ctx, 'go.cutoff.manage')) return deny(ctx, 'go.cutoff.manage', 'CUTOFF');
    if (S().prod) return bad('locked');
    o = o || {}; var r0 = needReason(o.reason); if (r0) return r0;
    var at = o.at, start = o.start;
    if (o.kind === 'monthly') {
      if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(o.month || '')) return bad('invalid');
      var y = +o.month.slice(0, 4), mo = +o.month.slice(5, 7), last = new Date(Date.UTC(y, mo, 0)).getUTCDate();
      at = o.month + '-' + String(last).padStart(2, '0') + ' 23:59'; start = iso(Date.UTC(y, mo, 1)) + ' 00:00';
    } else if (o.kind !== 'date') return bad('invalid');
    if (!isDT(at) || !isDT(start) || ms(start) <= ms(at)) return bad('invalid', null, { errors: { start: L('Production start harus setelah cut-off.', 'Production start must be after the cut-off.') } });
    var b = clone(S().cutoff);
    S().cutoff = { id: (b && b.id) || 'COF-001', kind: o.kind, month: o.month || null, at: at, start: start, st: 'set', by: ctx.uid, setAt: nowS(), reason: T(o.reason) };
    M.audit('CUTOFF_SET', ctx, { module: 'cutover', rec: S().cutoff.id, before: b && { at: b.at, start: b.start }, after: { at: at, start: start }, reason: o.reason }); save();
    return { ok: true, cutoff: clone(S().cutoff) };
  };

  /* ---------- §81 go-live preparation checklist (computed from real state) ---------- */
  function reconOk(k) { var r = reconRow(k); return r.st === 'reconciled' || r.st === 'approved'; }
  function dummyLeft() { return computeTargets({ mode: 'dummy_only', action: 'soft_erase', scope: {} }).list.length; }
  M.prep = function (ctx) {
    if (!can(ctx, 'go.cut.view') && !can(ctx, 'go.view')) return null;
    var x = X(), C = M.C, items = [];
    function I(k, n, ok, hard, v, s) { items.push({ k: k, n: n, ok: !!ok, hard: hard, st: ok ? 'pass' : hard ? 'fail' : 'warn', v: v == null ? null : v, s: s || null }); }
    var sn = S().snaps[0];
    I('snapshot', L('Snapshot siap', 'Snapshot Ready'), snapReady(), true, sn ? sn.id + ' · ' + sn.at : L('Belum ada snapshot', 'No snapshot yet'), 'CUT-004');
    var left = dummyLeft(); I('dummy', L('Data dummy dibersihkan', 'Dummy Cleaned'), left === 0, true, left ? L(left + ' record dummy tersisa', left + ' dummy records left') : L('Bersih (rantai yang memuat data asli/migrasi dipertahankan utuh)', 'Clean (chains holding real/migrated data kept whole)'), 'CUT-002');
    var realGone = Object.keys(S().erased).filter(function (k) { var e = S().erased[k]; return !e.restored && e.cls === 'REAL'; }).length;
    I('master', L('Master data asli dipertahankan', 'Real Master Retained'), realGone === 0, true, realGone ? realGone + ' REAL erased' : L('Semua master utuh', 'All masters intact'), 'DATA-001');
    I('inventory', L('Persediaan awal', 'Opening Inventory'), reconOk('stock'), true, reconRow('stock').stN, 'MIG-003');
    I('ar', L('Piutang awal (AR)', 'Opening AR'), reconOk('ar'), true, reconRow('ar').stN, 'MIG-003');
    I('ap', L('Hutang awal (AP)', 'Opening AP'), reconOk('ap'), true, reconRow('ap').stN, 'MIG-003');
    I('cashbank', L('Kas / Bank', 'Cash / Bank'), reconOk('cash') && reconOk('bank'), true, reconRow('cash').stN[0] + ' / ' + reconRow('bank').stN[0], 'MIG-003');
    var roles = C ? C.ROLE_ORDER.filter(function (k) { return k !== 'client'; }) : [], noUser = x ? roles.filter(function (k) { return !x.USERS.some(function (u) { return !u.client && u.roles.some(function (r) { return r.k === k; }) && tryf(function () { return x.account(u.id).status; }, 'active') === 'active'; }); }) : roles;
    I('users', L('User', 'Users'), x && noUser.length === 0, true, noUser.length ? L('Role tanpa user aktif: ' + noUser.join(', '), 'Roles without an active user: ' + noUser.join(', ')) : L('Setiap role punya user aktif', 'Every role has an active user'), 'ADM-001');
    var badRoles = x ? roles.filter(function (k) { return !x.ROLES[k] || !x.ROLES[k].landing; }) : roles;
    I('roles', L('Role', 'Roles'), x && badRoles.length === 0, true, badRoles.length ? badRoles.join(', ') : roles.length + ' role', 'ADM-003');
    var act = M.CM.clients().filter(function (c) { return c.status === 'active'; }), noCtr = act.filter(function (c) { return !tryf(function () { return M.CM.activeContracts(c.id).length; }, 0); });
    I('contracts', L('Kontrak', 'Contracts'), noCtr.length === 0, false, noCtr.length ? L('Klien aktif tanpa kontrak aktif: ' + noCtr.map(function (c) { return c.id; }).join(', '), 'Active clients without an active contract: ' + noCtr.map(function (c) { return c.id; }).join(', ')) : act.length + ' klien', 'CONTRACT-001');
    var rcs = M.CM.state().rcs, noRate = act.filter(function (c) { return tryf(function () { return M.CM.activeContracts(c.id).length; }, 0) && !rcs.some(function (r) { return r.cl === c.id && r.status === 'active'; }); });
    I('rates', L('Rate', 'Rates'), noRate.length === 0, false, noRate.length ? noRate.map(function (c) { return c.id; }).join(', ') : L('Semua kontrak aktif punya rate card', 'Every active contract has a rate card'), null);
    var mg = S().mig, notAppr = mg.filter(function (b) { return b.st !== 'approved'; }).length, rcBad = Object.keys(M.RECON).filter(function (k) { return !reconOk(k); });
    I('migration', L('Migrasi terekonsiliasi', 'Migration Reconciled'), notAppr === 0 && rcBad.length === 0, true, L((mg.length - notAppr) + '/' + mg.length + ' batch disetujui' + (rcBad.length ? ' · selisih: ' + rcBad.join(', ') : ''), (mg.length - notAppr) + '/' + mg.length + ' batches approved' + (rcBad.length ? ' · differences: ' + rcBad.join(', ') : '')), 'MIG-001');
    I('audit', L('Audit dipertahankan', 'Audit Preserved'), true, true, L(auditCount() + ' entri, tanpa fungsi hapus', auditCount() + ' entries, no delete function'), 'SEC-002');
    var co = S().cutoff; I('cutoff', L('Cut-off ditetapkan', 'Cut-off Set'), !!(co && co.st === 'set'), true, co ? co.at + ' → ' + co.start : null, 'CUT-006');
    var hard = items.filter(function (i) { return i.hard; });
    return { items: items, pass: items.filter(function (i) { return i.ok; }).length, total: items.length, hardFail: hard.filter(function (i) { return !i.ok; }).map(function (i) { return i.k; }), pct: pct(items.filter(function (i) { return i.ok; }).length, items.length) };
  };

  /* ---------- §94–§96 readiness score, hard gates, recommendation ---------- */
  M.WEIGHTS = [['build', 20, L('Build', 'Build')], ['qa', 15, L('QA', 'QA')], ['security', 10, L('Security', 'Security')], ['migration', 15, L('Migrasi', 'Migration')], ['integration', 10, L('Integrasi', 'Integration')],
    ['uat', 15, L('UAT', 'UAT')], ['training', 10, L('Training', 'Training')], ['ops', 5, L('Kesiapan operasional', 'Operational Readiness')]];
  function impReadiness() { var I = IMP(); return I && typeof I.readiness === 'function' ? tryf(function () { return I.readiness(); }, null) : null; }
  function helpReadiness() { var H = HELP(); return H && typeof H.readiness === 'function' ? tryf(function () { return H.readiness(); }, null) : null; }
  // Looks a fact up in JFIMP.readiness() (top level, .evidence, .facts, .gates, or the dimension objects).
  function fact(r, names) {
    if (!r) return undefined; var bags = [r, r.evidence, r.facts, r.gates, r.qa, r.security, r.integration, r.build, r.reliability, r.restore].filter(function (b) { return b && typeof b === 'object'; });
    for (var i = 0; i < names.length; i++) for (var j = 0; j < bags.length; j++) if (bags[j][names[i]] !== undefined) return bags[j][names[i]];
    return undefined;
  }
  function cnt(v) { return Array.isArray(v) ? v.length : typeof v === 'number' ? v : v === true ? 1 : v === false ? 0 : null; }
  function migScore() {
    var mg = S().mig, prog = sum(mg.map(function (b) { return b.done.length / M.MIG_STEPS.length; })) / mg.length * 100, rk = Object.keys(M.RECON), rc = rk.filter(reconOk).length / rk.length * 100, acc = M.migAccuracy();
    return Math.round((prog * 0.5 + rc * 0.3 + (acc == null ? 0 : acc) * 0.2) * 10) / 10;
  }
  M.readiness = function (ctx) {
    if (!can(ctx, 'go.view') && !can(ctx, 'go.live.view')) return null;
    var ir = impReadiness(), hr = helpReadiness(), sy = SYS(), dims = [];
    var integ = num(ir && ir.integration);
    if (integ == null && sy) { var is = tryf(function () { return sy.integSummary({ perms: ['sys11.integration.view'] }); }, null); if (is) integ = Math.round(is.healthy / Math.max(1, is.total - (is.future || 0)) * 1000) / 10; }
    var uat = S().uat, uatPct = pct(uat.filter(function (u) { return u.st === 'pass'; }).length, uat.length), pr = M.prep(Object.assign({}, ctx, { perms: (ctx.perms || []).concat(['go.view']) }));
    var val = { build: num(ir && ir.build), qa: num(ir && ir.qa), security: num(ir && ir.security), migration: migScore(), integration: integ, uat: uatPct, training: num(hr && hr.training), ops: pr.pct };
    var src = { build: 'JFIMP.readiness().build', qa: 'JFIMP.readiness().qa', security: 'JFIMP.readiness().security', migration: 'JFGO migration pipeline + reconciliation', integration: ir && num(ir.integration) != null ? 'JFIMP.readiness().integration' : 'JFSYS.integSummary()', uat: 'JFGO UAT pass %', training: 'JFHELP.readiness().training', ops: 'JFGO prep checklist §81' };
    var score = 0;
    M.WEIGHTS.forEach(function (w) { var v = val[w[0]]; score += (v == null ? 0 : Math.max(0, Math.min(100, v))) * w[1] / 100; dims.push({ k: w[0], n: w[2], w: w[1], v: v, pts: v == null ? 0 : Math.round(Math.max(0, Math.min(100, v)) * w[1]) / 100, src: src[w[0]], missing: v == null }); });
    score = Math.round(score * 10) / 10;
    var gates = M.gates(ctx, { ir: ir, hr: hr });
    var failed = gates.filter(function (g) { return !g.ok; });
    var rec = failed.length ? 'NO-GO' : score >= 85 ? 'GO' : score >= 70 ? 'CONDITIONAL GO' : 'NO-GO';
    return { score: score, dims: dims, gates: gates, failed: failed.map(function (g) { return g.k; }), rec: rec, recN: M.REC[rec], decision: M.lastDecision(), at: nowS() };
  };
  M.REC = { 'GO': L('GO', 'GO'), 'CONDITIONAL GO': L('CONDITIONAL GO', 'CONDITIONAL GO'), 'NO-GO': L('NO-GO', 'NO-GO') };
  M.gates = function (ctx, pre) {
    pre = pre || {}; var ir = pre.ir !== undefined ? pre.ir : impReadiness(), hr = pre.hr !== undefined ? pre.hr : helpReadiness(), out = [];
    function G(k, n, ok, v, src, unknown) { out.push({ k: k, n: n, ok: !!ok, v: v, src: src, unknown: !!unknown }); }
    var cb = cnt(fact(ir, ['criticalBugs', 'criticalBugsOpen', 'openCritical', 'critical']));
    G('criticalBug', L('Bug Critical terbuka', 'Critical bug open'), cb === 0, cb == null ? L('JFIMP tidak tersedia', 'JFIMP not available') : cb, 'JFIMP', cb == null);
    var ob = ['ar', 'ap', 'stock', 'cash', 'bank'].filter(function (k) { return !reconOk(k); });
    G('openingBalance', L('Saldo awal tidak cocok', 'Opening balance mismatch'), ob.length === 0, ob.length ? ob.map(function (k) { return 'RCN-' + k.toUpperCase(); }) : 0, 'JFGO MIG-003');
    var sf = cnt(fact(ir, ['securityFailures', 'securityFailed', 'unexpectedAllows', 'secFail']));
    G('security', L('Kegagalan keamanan', 'Security failure'), sf === 0, sf == null ? L('JFIMP tidak tersedia', 'JFIMP not available') : sf, 'JFIMP SVL', sf == null);
    var pf = cnt(fact(ir, ['permissionFailures', 'permFailures', 'permissionFailed']));
    if (pf == null && sf != null) pf = sf;
    G('permission', L('Kegagalan izin', 'Permission failure'), pf === 0, pf == null ? L('JFIMP tidak tersedia', 'JFIMP not available') : pf, 'JFIMP SVL', pf == null);
    var rt = fact(ir, ['restoreTested', 'restoreOk', 'restore_ok']); if (rt && typeof rt === 'object') rt = rt.ok;
    var ownRt = S().snaps.some(function (s) { return s.verified && s.verified.ok; });
    G('restore', L('Restore belum dites', 'Restore not tested'), rt === true || ownRt, rt === true ? L('Restore test JFIMP OK', 'JFIMP restore test OK') : ownRt ? L('Snapshot terverifikasi (round trip)', 'Snapshot verified (round trip)') : L('Belum ada restore test', 'No restore test yet'), rt === true ? 'JFIMP RLB-005' : 'JFGO CUT-004');
    var cu = S().uat.filter(function (u) { return u.sev === 'critical' && u.st !== 'pass'; }).map(function (u) { return u.id; });
    G('uat', L('UAT Critical gagal', 'Critical UAT failed'), cu.length === 0, cu.length ? cu : 0, 'JFGO UAT');
    var ku = hr ? (hr.keyUsersUntrained || []) : null;
    G('training', L('Key user wajib belum terlatih', 'Required key users untrained'), ku != null && cnt(ku) === 0, ku == null ? L('JFHELP tidak tersedia', 'JFHELP not available') : Array.isArray(ku) ? ku.map(function (u) { return u && (u.u || u.uid || u.name || u); }) : ku, 'JFHELP', ku == null);
    return out;
  };
  M.lastDecision = function () { var d = S().decisions[0]; return d ? clone(d) : null; };
  M.decisions = function (ctx) { if (!can(ctx, 'go.view') && !can(ctx, 'go.live.view')) return []; return clone(S().decisions); };
  // §96 the final decision is an authorized HUMAN decision (owner). GO / CONDITIONAL GO refused while a hard gate fails.
  M.decide = function (ctx, decision, reason, o) {
    if (!can(ctx, 'go.golive.approve')) return deny(ctx, 'go.golive.approve', 'GO/NO-GO');
    o = o || {};
    if (!M.REC[decision]) return bad('invalid');
    if (S().prod) return bad('locked');
    var r0 = needReason(reason); if (r0) return r0;
    if (decision === 'CONDITIONAL GO' && !str(T(o.conditions))) return bad('invalid', null, { errors: { conditions: L('Tulis syarat Conditional GO.', 'Write the Conditional GO conditions.') } });
    var rd = M.readiness(Object.assign({}, ctx, { perms: ctx.perms.concat(['go.view']) }));
    if (decision !== 'NO-GO' && rd.failed.length) { M.audit('GOLIVE_DECISION', ctx, { module: 'golive', rec: 'GO/NO-GO', after: { decision: decision, failed: rd.failed }, result: 'denied', reason: reason }); return bad('gate', L('Hard gate gagal: keputusan GO tidak bisa diambil (§95).', 'A hard gate fails: a GO decision cannot be taken (§95).'), { failed: rd.failed }); }
    var d = { decision: decision, at: nowS(), by: ctx.uid, byName: ctxName(ctx), reason: T(reason), conditions: str(T(o.conditions)) || null, score: rd.score, rec: rd.rec, gates: rd.gates.map(function (g) { return { k: g.k, ok: g.ok }; }) };
    S().decisions.unshift(d);
    M.audit(decision === 'NO-GO' ? 'GOLIVE_DECISION' : 'GOLIVE_APPROVED', ctx, { module: 'golive', rec: 'GO/NO-GO', after: { decision: decision, score: rd.score, rec: rd.rec }, reason: reason }); save();
    return { ok: true, decision: clone(d) };
  };

  /* ---------- §82–§84 START PRODUCTION (immutable marker) & rollback ---------- */
  M.productionStart = function () { var p = S().prod; return p ? clone(p) : null; };
  M.isLive = function () { return !!S().prod; };
  M.startCheck = function (ctx) {
    var full = Object.assign({}, ctx, { perms: (ctx && ctx.perms || []).concat(['go.view']) }), pr = M.prep(full), rd = M.readiness(full), d = M.lastDecision(), out = [];
    pr.items.filter(function (i) { return i.hard; }).forEach(function (i) { out.push({ k: i.k, n: i.n, ok: i.ok }); });
    out.push({ k: 'decision', n: L('Keputusan Go/No-Go = GO / CONDITIONAL GO', 'Go/No-Go decision = GO / CONDITIONAL GO'), ok: !!(d && d.decision !== 'NO-GO') });
    out.push({ k: 'gates', n: L('Semua hard gate lulus', 'All hard gates pass'), ok: rd.failed.length === 0 });
    return { items: out, ok: out.every(function (i) { return i.ok; }), failed: out.filter(function (i) { return !i.ok; }).map(function (i) { return i.k; }), started: M.productionStart() };
  };
  M.startProduction = function (ctx, o) {
    if (!can(ctx, 'go.start.approve')) return deny(ctx, 'go.start.approve', 'PRODUCTION_START');
    o = o || {};
    if (S().prod) { M.audit('PRODUCTION_START', ctx, { module: 'golive', rec: 'PRODUCTION_START_DATE', after: 'repeat', result: 'denied' }); return bad('locked', L('PRODUCTION_START_DATE sudah ditetapkan dan tidak bisa diubah.', 'PRODUCTION_START_DATE is already set and can never be changed.'), { start: M.productionStart() }); }
    var dv = noMobile(ctx, o, 'PRODUCTION_START'); if (dv) return dv;
    var r0 = needReason(o.reason); if (r0) return r0;
    var chk = M.startCheck(ctx);
    if (!chk.ok) { M.audit('PRODUCTION_START', ctx, { module: 'golive', rec: 'PRODUCTION_START_DATE', after: { failed: chk.failed }, result: 'denied', reason: o.reason }); return bad('gate', null, { failed: chk.failed }); }
    var co = S().cutoff, d = M.lastDecision(), I = IMP();
    var verS = I ? tryf(function () { return typeof I.currentVersion === 'function' ? I.currentVersion() : null; }, null) : null;
    S().prod = { date: co.start, cutoff: co.at, cof: co.id, at: nowS(), by: ctx.uid, byName: ctxName(ctx), decision: d.decision, score: d.score, version: verS && (verS.version || verS) || 'v1.0.0', reason: T(o.reason) };
    M.audit('PRODUCTION_START', ctx, { module: 'golive', rec: 'PRODUCTION_START_DATE', after: { date: co.start, decision: d.decision }, reason: o.reason }); save();
    return { ok: true, start: M.productionStart() };
  };
  // Any attempt to change the marker is refused (demo M._reset() is the only way back).
  M.setProductionStart = function (ctx) { M.audit('PRODUCTION_START', ctx, { module: 'golive', rec: 'PRODUCTION_START_DATE', after: 'change', result: 'denied' }); return bad('locked'); };
  // §84 irreversible real-world events after production start: payments received, PODs signed.
  M.irreversible = function () {
    var p = S().prod; if (!p) return [];
    var d = String(p.date).slice(0, 10), out = [];
    fs().pays.forEach(function (x) { if (x.date >= d && !M.isErased('fn.payment', x.id)) out.push({ mod: 'fn.payment', id: x.id, at: x.date }); });
    M.DL.state().dlv.forEach(function (x) { if (x.pod && String(x.pod.at).slice(0, 10) >= d && !M.isErased('dl.delivery', x.id)) out.push({ mod: 'dl.delivery', id: x.id, at: x.pod.at }); });
    return out;
  };
  M.rollback = function (ctx, snapId, o) {
    if (!can(ctx, 'go.reset.approve')) return deny(ctx, 'go.reset.approve', 'ROLLBACK');
    o = o || {}; var dv = noMobile(ctx, o, 'ROLLBACK'); if (dv) return dv;
    var r0 = needReason(o.reason); if (r0) return r0;
    var s = by(S().snaps, 'id', snapId); if (!s) return bad('notfound');
    var irr = M.irreversible();
    if (irr.length) { M.audit('ROLLBACK_EXECUTED', ctx, { module: 'golive', rec: s.id, after: { irreversible: irr.length }, result: 'denied', reason: o.reason }); return bad('locked', L('Tidak boleh rollback buta setelah kejadian nyata yang tidak bisa dibatalkan (pembayaran, POD).', 'No blind rollback after irreversible real-world events (payments, PODs).'), { events: irr.slice(0, 10) }); }
    var before = Object.keys(S().erased).length;
    S().erased = clone(s.go.erased || {});
    S().resets.forEach(function (r) { var was = by(s.go.resets || [], 'id', r.id), EX = ['executed', 'reconciled', 'ready']; if (!(was && EX.indexOf(was.st) >= 0) && EX.indexOf(r.step) >= 0 && r.st !== 'rolled_back') { r.st = 'rolled_back'; r.log.unshift({ at: nowS(), by: ctx.uid, step: 'rollback', note: s.id }); } });
    M.audit('ROLLBACK_EXECUTED', ctx, { module: 'golive', rec: s.id, before: { erased: before }, after: { erased: Object.keys(S().erased).length }, reason: o.reason });
    M.audit('RESTORE_EXECUTED', ctx, { module: 'golive', rec: s.id, after: { rollback: true }, reason: o.reason }); save();
    return { ok: true, snapshot: snapView(s), erased: Object.keys(S().erased).length, note: L('Rollback mengembalikan status reset (soft erase). Data engine pemilik tidak pernah diubah.', 'Rollback restores the reset (soft erase) state. Owner-engine data was never changed.') };
  };

  /* ---------- §90–§93 incidents ---------- */
  M.INC_FLOW = ['reported', 'ticket', 'triage', 'assign', 'investigate', 'fix', 'test', 'deploy', 'confirm', 'closed'];
  M.INC_FLOW_N = { reported: L('Laporan', 'Issue Report'), ticket: L('Tiket', 'Ticket'), triage: L('Triage', 'Triage'), assign: L('Assign', 'Assign'), investigate: L('Investigasi', 'Investigate'), fix: L('Perbaikan', 'Fix'), test: L('Tes', 'Test'), deploy: L('Deploy', 'Deploy'), confirm: L('Konfirmasi', 'Confirm'), closed: L('Ditutup', 'Closed') };
  M.CRITICAL_KINDS = { login_outage: L('Login tidak bisa', 'Login outage'), order_missing: L('Order hilang', 'Order missing'), production_blocked: L('Produksi terhenti', 'Production blocked'), financial_mismatch: L('Selisih keuangan', 'Financial mismatch'),
    duplicate_payment: L('Pembayaran ganda', 'Duplicate payment'), client_data_exposure: L('Data klien bocor', 'Client data exposure'), database_outage: L('Database mati', 'Database outage') };
  M.SLA_H = { critical: 4, high: 8, medium: 24, low: 72 };
  M.INC_MODULES = ['auth', 'order', 'logistics', 'production', 'delivery', 'finance', 'client', 'integration', 'other'];
  function incView(i) {
    var due = ms(i.at) + M.SLA_H[i.sev] * HOUR, open = i.st !== 'closed';
    return Object.assign(clone(i), { reporterName: nameOfUid(i.by), ownerName: i.owner ? nameOfUid(i.owner) : null, sevN: M.SEV[i.sev][0], tone: M.SEV[i.sev][1], stN: M.INC_FLOW_N[i.st], stepIdx: M.INC_FLOW.indexOf(i.st),
      next: open ? M.INC_FLOW[M.INC_FLOW.indexOf(i.st) + 1] : null, sla: M.SLA_H[i.sev] + ' h', due: isoT(due), overdue: open && M.now() > due, open: open, kindN: M.CRITICAL_KINDS[i.kind] || null });
  }
  M.incidents = function (ctx, f) {
    f = f || {}; var all = can(ctx, 'go.live.view') || can(ctx, 'go.incident.manage');
    return S().incidents.filter(function (i) { return (all || (ctx && i.by === ctx.uid)) && (!f.st || (f.st === 'open' ? i.st !== 'closed' : i.st === f.st)) && (!f.sev || i.sev === f.sev) && (!f.module || i.module === f.module); })
      .map(incView).sort(function (a, b) { return a.at < b.at ? 1 : -1; });
  };
  M.incident = function (ctx, id) { var i = by(S().incidents, 'id', id); if (!i) return null; if (!(can(ctx, 'go.live.view') || can(ctx, 'go.incident.manage') || (ctx && i.by === ctx.uid))) return null; return incView(i); };
  // Any signed-in user may report a problem, on any device (incl. mobile).
  M.reportIncident = function (ctx, f) {
    if (!ctx || !ctx.uid) return bad('noperm');
    f = f || {};
    var errs = {}; if (!str(T(f.problem))) errs.problem = L('Ceritakan masalahnya.', 'Describe the problem.'); if (f.sev && !M.SEV[f.sev]) errs.sev = L('Pilih tingkat.', 'Pick a severity.');
    if (Object.keys(errs).length) return bad('invalid', null, { errors: errs });
    var crit = !!M.CRITICAL_KINDS[f.kind], sev = crit ? 'critical' : (f.sev || 'medium');
    var i = { id: nid('inc', 'INC-', 4), at: nowS(), by: ctx.uid, role: ctx.roleKey || null, module: M.INC_MODULES.indexOf(f.module) >= 0 ? f.module : 'other', screen: f.screen || null, problem: Array.isArray(f.problem) ? f.problem : L(str(f.problem)),
      sev: sev, kind: crit ? f.kind : 'other', evidence: (f.evidence || []).filter(str), owner: null, st: 'ticket', rc: null, fix: null, rel: null, escalated: crit || sev === 'critical', conf: false, device: devOf(ctx),
      log: [['reported', nowS(), ctx.uid, null], ['ticket', nowS(), 'system', null]] };
    S().incidents.unshift(i);
    M.audit('INCIDENT_REPORTED', ctx, { module: 'incident', rec: i.id, after: { sev: sev, kind: i.kind, escalated: i.escalated } }); save();
    return { ok: true, incident: incView(i), escalated: i.escalated };
  };
  M.advanceIncident = function (ctx, id, to, o) {
    var i = by(S().incidents, 'id', id); if (!i) return bad('notfound'); o = o || {};
    var mgr = can(ctx, 'go.incident.manage'), isOwner = ctx && i.owner === ctx.uid, isRep = ctx && i.by === ctx.uid;
    var need = { triage: mgr, assign: mgr, investigate: mgr || isOwner, fix: mgr || isOwner, test: mgr || isOwner, deploy: mgr || isOwner, confirm: mgr || isRep, closed: mgr };
    if (!(to in need)) return bad('invalid');
    if (!need[to]) return deny(ctx, 'go.incident.manage', id);
    if (M.INC_FLOW.indexOf(to) !== M.INC_FLOW.indexOf(i.st) + 1) return bad('jump', null, { next: M.INC_FLOW[M.INC_FLOW.indexOf(i.st) + 1] || null });
    if (to === 'triage' && o.sev) { if (!M.SEV[o.sev]) return bad('invalid'); if (!M.CRITICAL_KINDS[i.kind]) i.sev = o.sev; if (i.sev === 'critical') i.escalated = true; }
    if (to === 'assign') { var x = X(); if (!o.owner || !x || !by(x.USERS, 'id', o.owner)) return bad('invalid', null, { errors: { owner: L('Pilih penanggung jawab.', 'Pick an owner.') } }); i.owner = o.owner; }
    if (to === 'investigate' && o.rc) i.rc = L(str(T(o.rc)));
    if (to === 'fix') { if (o.rc) i.rc = L(str(T(o.rc))); if (o.fix) i.fix = L(str(T(o.fix))); }
    if (to === 'deploy') { if (o.release) i.rel = str(o.release); }
    if (to === 'confirm') i.conf = true;
    if (to === 'closed') { if (o.rc) i.rc = L(str(T(o.rc))); if (o.fix) i.fix = L(str(T(o.fix))); if (!i.rc || !i.fix) return bad('invalid', null, { errors: { rc: L('Root cause dan fix wajib.', 'Root cause and fix are required.') } }); }
    var b = i.st; i.st = to; i.log.push([to, nowS(), ctx.uid, o.note || null]);
    M.audit(to === 'closed' ? 'INCIDENT_CLOSED' : 'INCIDENT_UPDATE', ctx, { module: 'incident', rec: i.id, before: b, after: to, reason: o.note || null }); save();
    return { ok: true, incident: incView(i) };
  };

  /* ---------- §89 hypercare ---------- */
  M.HYPER_DAYS = [1, 3, 7, 14, 30];
  M.hypercare = function (ctx) {
    if (!can(ctx, 'go.live.view')) return null;
    var p = S().prod, base = p ? ms(String(p.date).slice(0, 10)) : (S().cutoff && S().cutoff.start ? ms(S().cutoff.start.slice(0, 10)) : null), today = ms(M.today());
    var days = M.HYPER_DAYS.map(function (d) {
      var items = Object.keys(S().hyper).map(function (k) { return S().hyper[k]; }).filter(function (h) { return h.day === d; }).map(clone);
      var date = base != null ? iso(base + (d - 1) * DAY) : null;
      return { day: d, date: date, items: items, done: items.filter(function (h) { return h.st === 'done'; }).length, total: items.length, st: !p ? 'planned' : today < ms(date) ? 'upcoming' : items.every(function (h) { return h.st === 'done'; }) ? 'done' : 'active' };
    });
    var dayNo = p ? Math.floor((today - base) / DAY) + 1 : null;
    return { live: !!p, start: p ? p.date : null, day: dayNo, period: L('7–30 hari', '7–30 days'), days: days, openIncidents: S().incidents.filter(function (i) { return i.st !== 'closed'; }).length };
  };
  M.tickHypercare = function (ctx, day, k, o) {
    if (!can(ctx, 'go.incident.manage') && !can(ctx, 'go.opt.manage')) return deny(ctx, 'go.opt.manage', 'HYPERCARE');
    var h = S().hyper[day + ':' + k]; if (!h) return bad('notfound'); o = o || {};
    if (!S().prod) return bad('jump', L('Hypercare dimulai setelah Production Start.', 'Hypercare starts after Production Start.'));
    h.st = o.undo ? 'todo' : 'done'; h.by = ctx.uid; h.at = nowS(); h.note = o.note || null;
    M.audit('HYPERCARE_TICK', ctx, { module: 'golive', rec: 'D' + day + ':' + k, after: h.st }); save();
    return { ok: true, item: clone(h) };
  };

  /* ---------- Bell (GO- prefix): escalated incidents, approvals waiting ---------- */
  function goNotifs(ctx) {
    var out = [], t0 = Date.now(), x = X();
    var cta = function (s, rec) { return x && x.canScreen && x.canScreen(ctx, s) ? { l: L('Buka', 'Open'), s: s, rec: rec || null } : null; };
    if (can(ctx, 'go.live.view') || can(ctx, 'go.incident.manage')) S().incidents.filter(function (i) { return i.escalated && i.st !== 'closed'; }).forEach(function (i, n) { out.push({ id: 'GO-' + i.id, cat: 'crit', to: [], t: L('Insiden kritis: ' + T(i.problem), 'Critical incident: ' + i.problem[1]), c: L(i.id + ' · eskalasi segera', i.id + ' · immediate escalation'), at: t0 - (n + 1) * 3e5, cta: cta('LIVE-003', i.id), p12: true }); });
    S().resets.filter(function (r) { return r.step === 'snapshot'; }).forEach(function (r, n) {
      var need = (can(ctx, 'go.reset.approve') && !r.approvals.some(function (a) { return a.role === 'owner'; })) || (r.fin && can(ctx, 'go.fin.approve') && !r.approvals.some(function (a) { return a.role === 'finance'; }));
      if (need && r.by !== ctx.uid) out.push({ id: 'GO-' + r.id, cat: 'warn', to: [], t: L('Reset menunggu persetujuan', 'Reset waiting for approval'), c: L(r.id + ' · ' + T(M.RESET_MODES[r.mode].n), r.id + ' · ' + M.RESET_MODES[r.mode].n[1]), at: t0 - (n + 2) * 4e5, cta: cta('CUT-003', r.id), p12: true });
    });
    S().mig.filter(function (b) { return b.st === 'pending'; }).forEach(function (b, n) {
      var need = (can(ctx, 'go.mig.approve') && !b.approvals.some(function (a) { return a.role === 'owner'; })) || (b.fin && can(ctx, 'go.fin.approve') && !b.approvals.some(function (a) { return a.role === 'finance'; }));
      if (need && b.reqBy !== ctx.uid) out.push({ id: 'GO-' + b.id, cat: 'warn', to: [], t: L('Migrasi menunggu persetujuan', 'Migration waiting for approval'), c: L(b.id + ' · ' + T(b.n), b.id + ' · ' + b.n[1]), at: t0 - (n + 3) * 4e5, cta: cta('MIG-004', b.id), p12: true });
    });
    return out;
  }
  M.notifs = function (ctx) { if (!ctx || ctx.client) return []; var seen = S().reads[ctx.uid] || []; return goNotifs(ctx).map(function (n) { n.read = seen.indexOf(n.id) >= 0; return n; }); };
  M.joinNotifs = function (Xa) {
    if (!Xa || !Xa.notifsFor || Xa.__p12gon) return; Xa.__p12gon = true;
    var orig = Xa.notifsFor, origRead = Xa.markRead;
    Xa.notifsFor = function (ctx) { var base = orig.call(Xa, ctx); var mineN = tryf(function () { return M.notifs(ctx); }, []); return mineN.length ? base.concat(mineN).sort(function (a, b) { return b.at - a.at; }) : base; };
    Xa.markRead = function (ctx, ids) {
      var all = ids === 'all' ? Xa.notifsFor(ctx).map(function (n) { return n.id; }) : ids || [];
      var r = S().reads, list = r[ctx.uid] = r[ctx.uid] || [];
      all.forEach(function (id) { if (/^GO-/.test(id) && list.indexOf(id) < 0) list.push(id); }); save();
      return origRead.call(Xa, ctx, all.filter(function (id) { return !/^GO-/.test(id); }));
    };
  };

  /* ---------- §86–§88 go-live command center ---------- */
  function sysHealth() { var s = SYS(); return s ? tryf(function () { return s.health({ perms: ['sys11.health.view'] }); }, null) : null; }
  function curVersion() {
    var I = IMP(); if (!I) return null;
    var v = tryf(function () { return typeof I.currentVersion === 'function' ? I.currentVersion() : null; }, null); if (v) return v.version || v;
    var env = tryf(function () { return typeof I.environment === 'function' ? I.environment({ perms: ['imp.view'] }, 'ENV-PRD') : null; }, null); return env && (env.version || env.ver) || null;
  }
  M.hero = function (ctx) {
    if (!can(ctx, 'go.live.view') && !can(ctx, 'go.view')) return null;
    var p = S().prod, h = sysHealth(), co = S().cutoff;
    return { brand: 'JFRESH OS', st: p ? 'LIVE' : 'PRE-GO-LIVE', stN: p ? L('LIVE', 'LIVE') : L('PRE-GO-LIVE', 'PRE-GO-LIVE'), start: p ? p.date : null, planned: co ? co.start : null, version: (p && p.version) || curVersion() || 'v1.0.0-rc',
      health: h ? h.overall : null, healthN: h ? h.overallN : null, decision: M.lastDecision() };
  };
  M.liveKpis = function (ctx) {
    if (!can(ctx, 'go.live.view')) return [];
    var x = X(), s = SYS(), au = x ? x.auditLog() : [], xn = x ? x.now() : Date.now();
    var active = uniq(au.filter(function (e) { return e.ev === 'AUTH.LOGIN_OK' && xn - e.at < DAY; }).map(function (e) { return e.uid; })).length;
    var ordersToday = M.LG.state().orders.filter(function (o) { return o.date === M.today() && o.st !== 'cancelled' && M.reportable('lg.order', o); }).length;
    var rows = s ? tryf(function () { return s.auditAll(sysCtx(ctx, ['sys11.audit.view']), { from: M.today(), to: M.today() }); }, []) : [];
    var okTx = rows.filter(function (r) { return r.result === 'ok'; }).length, failTx = rows.filter(function (r) { return r.result !== 'ok'; }).length;
    var inc = S().incidents.filter(function (i) { return i.st !== 'closed'; }), crit = inc.filter(function (i) { return i.sev === 'critical'; }).length;
    var ig = s ? tryf(function () { return s.integSummary({ perms: ['sys11.integration.view'] }); }, null) : null, avail = s ? tryf(function () { return by(s.kpis({ perms: ['sys11.health.view'] }), 'k', 'availability').v; }, null) : null;
    var K = function (k, n, v, st, src, sc) { return { k: k, n: n, v: v, st: st, src: src, s: sc || null }; };
    return [K('activeUsers', L('User Aktif', 'Active Users'), active, 'info', 'JFACCESS audit AUTH.LOGIN_OK (24 jam)'), K('ordersToday', L('Order Hari Ini', 'Orders Today'), ordersToday, 'info', 'JFLOG.orders'),
      K('okTx', L('Transaksi Berhasil', 'Successful Transactions'), okTx, 'ok', 'JFSYS.auditAll result ok'), K('failTx', L('Transaksi Gagal', 'Failed Transactions'), failTx, failTx ? 'warn' : 'ok', 'JFSYS.auditAll result failed/denied'),
      K('critical', L('Isu Kritis', 'Critical Issues'), crit, crit ? 'crit' : 'ok', 'JFGO incidents', 'LIVE-002'), K('tickets', L('Tiket Terbuka', 'Open Tickets'), inc.length, inc.length ? 'warn' : 'ok', 'JFGO incidents', 'LIVE-002'),
      K('integErr', L('Error Integrasi', 'Integration Errors'), ig ? ig.warning + ig.critical + ig.disconnected : null, ig && ig.critical + ig.disconnected ? 'crit' : ig && ig.warning ? 'warn' : 'ok', 'JFSYS.integSummary', 'RLB-002'),
      K('availability', L('Ketersediaan Sistem', 'System Availability'), avail, avail != null && avail >= 99.5 ? 'ok' : 'warn', 'JFSYS.kpis availability')];
  };
  M.domainHealth = function (ctx) {
    if (!can(ctx, 'go.live.view')) return [];
    var x = X(), s = SYS(), au = x ? x.auditLog() : [], ok = au.filter(function (e) { return e.ev === 'AUTH.LOGIN_OK'; }).length, fl = au.filter(function (e) { return e.ev === 'AUTH.LOGIN_FAIL'; }).length;
    var lgIss = M.LG.state().orders.filter(function (o) { return o.st === 'issue'; }).length, hold = M.PR.state().batches.filter(function (b) { return b.hold; }).length, dlIss = M.DL.state().dlv.filter(function (d) { return d.st === 'issue' || d.st === 'returned'; }).length;
    var ag = tryf(function () { return M.FN.aging({ perms: ['ar.view'] }); }, null), ig = s ? tryf(function () { return s.integSummary({ perms: ['sys11.integration.view'] }); }, null) : null;
    var incBy = function (m) { return S().incidents.filter(function (i) { return i.st !== 'closed' && i.module === m; }); };
    function H(k, n, st, v, src) { var inc = incBy(k); if (inc.some(function (i) { return i.sev === 'critical'; })) st = 'critical'; else if (inc.length && st === 'healthy') st = 'warning'; return { k: k, n: n, st: st, v: v, incidents: inc.length, src: src }; }
    return [H('auth', L('Autentikasi', 'Authentication'), fl > ok && fl > 3 ? 'warning' : 'healthy', ok + ' ok · ' + fl + ' gagal', 'JFACCESS'), H('order', L('Order', 'Order'), lgIss ? 'warning' : 'healthy', lgIss + ' issue', 'JFLOG'),
      H('production', L('Produksi', 'Production'), hold ? 'warning' : 'healthy', hold + ' hold', 'JFPROD'), H('delivery', L('Delivery', 'Delivery'), dlIss ? 'warning' : 'healthy', dlIss + ' issue/return', 'JFDLV'),
      H('finance', L('Finance', 'Finance'), ag && ag.overduePct > 50 ? 'warning' : 'healthy', ag ? ag.overduePct + '% overdue' : null, 'JFFIN'), H('client', L('Portal Klien', 'Client Portal'), M.CLP ? 'healthy' : 'warning', M.CLP ? 'online' : 'n/a', 'JFCLP'),
      H('integration', L('Integrasi', 'Integration'), !ig ? 'warning' : ig.critical + ig.disconnected >= 4 ? 'critical' : ig.warning + ig.critical + ig.disconnected ? 'warning' : 'healthy', ig ? ig.label : null, 'JFSYS')];
  };
  M.goLive = function (ctx) {
    if (!can(ctx, 'go.live.view')) return null;
    return { hero: M.hero(ctx), kpis: M.liveKpis(ctx), domains: M.domainHealth(ctx), hypercare: M.hypercare(ctx), incidents: M.incidents(ctx, { st: 'open' }).slice(0, 8), readiness: M.readiness(Object.assign({}, ctx, { perms: ctx.perms.concat(['go.view']) })) };
  };

  /* ---------- NP-12 §98–§108 ---------- */
  M.reviews = function (ctx) {
    if (!can(ctx, 'go.opt.view')) return [];
    var p = S().prod, base = p ? p.date.slice(0, 10) : (S().cutoff && S().cutoff.start ? S().cutoff.start.slice(0, 10) : M.today());
    return S().reviews.map(function (r) { return Object.assign(clone(r), { due: iso(ms(base) + r.day * DAY), planned: !p }); });
  };
  M.updateReview = function (ctx, id, patch, reason) {
    if (!can(ctx, 'go.opt.manage')) return deny(ctx, 'go.opt.manage', id);
    var r = by(S().reviews, 'id', id); if (!r) return bad('notfound'); patch = patch || {};
    var r0 = needReason(reason); if (r0) return r0;
    if (patch.st && ['planned', 'in_progress', 'done'].indexOf(patch.st) < 0) return bad('invalid');
    var b = r.st; if (patch.st) r.st = patch.st;
    if (patch.topic != null) { var t = r.topics[patch.topic]; if (!t) return bad('invalid'); t.st = patch.topicSt || 'done'; t.note = patch.note || null; }
    if (patch.finding) r.findings.push({ at: nowS(), by: ctx.uid, t: L(str(T(patch.finding))) });
    M.audit('REVIEW_UPDATE', ctx, { module: 'improvement', rec: r.id, before: b, after: r.st, reason: reason }); save();
    return { ok: true, review: clone(r) };
  };
  M.adoption = function (ctx) {
    if (!can(ctx, 'go.opt.view') && !can(ctx, 'go.live.view')) return null;
    var x = X(), au = x ? x.auditLog() : [], xn = x ? x.now() : Date.now(), H = HELP();
    var dau = uniq(au.filter(function (e) { return e.ev === 'AUTH.LOGIN_OK' && xn - e.at < DAY; }).map(function (e) { return e.uid; })).length;
    var staff = x ? x.USERS.filter(function (u) { return !u.client && tryf(function () { return x.account(u.id).status; }, '') === 'active'; }).length : 0;
    var clpK = M.CLP ? tryf(function () { return M.CLP.kpis({ perms: ['clp.kpi'] }); }, []) : [], portal = clpK.filter(function (k) { return /adopt/i.test(k.k); })[0];
    var picks = M.LG.state().orders.filter(function (o) { return o.kind === 'pickup' && o.st !== 'cancelled' && o.st !== 'draft'; }), self = picks.filter(function (o) { return o.src === 'client'; }).length;
    var hr = helpReadiness(), ha = H ? tryf(function () { return typeof H.analytics === 'function' ? H.analytics({ perms: ['help.manage', 'help.view'] }) : null; }, null) : null;
    var inc = S().incidents.length;
    var K = function (k, n, v, u, src) { return { k: k, n: n, v: v, u: u, src: src }; };
    return [K('dau', L('Daily Active Users', 'Daily Active Users'), dau, '', 'JFACCESS audit'), K('activePct', L('Active User %', 'Active User %'), pct(dau, staff), '%', 'JFACCESS'),
      K('feature', L('Feature Adoption', 'Feature Adoption'), pct(uniq(au.filter(function (e) { return /SCREEN|VIEW/.test(e.ev); }).map(function (e) { return e.target || e.ev; })).length, 60), '%', 'JFACCESS audit'),
      K('portal', L('Client Portal Adoption', 'Client Portal Adoption'), portal ? portal.v : null, '%', 'JFCLP.kpis'), K('self', L('Self-Service %', 'Self-Service %'), pct(self, picks.length), '%', 'JFLOG src client'),
      K('help', L('Smart Help Usage', 'Smart Help Usage'), ha ? (ha.usage && ha.usage.searches != null ? ha.usage.searches : ha.searches != null ? ha.searches : null) : null, '', 'JFHELP.analytics'), K('tutorial', L('Tutorial Completion', 'Tutorial Completion'), hr ? num(hr.training) : null, '%', 'JFHELP.readiness'),
      K('tickets', L('Support Ticket Rate', 'Support Ticket Rate'), staff ? Math.round(inc / staff * 1000) / 10 : null, '/100 user', 'JFGO incidents')];
  };
  // §102–§104: referenced from the owner engines' own KPI functions, not recomputed.
  M.kpiRefs = function (ctx) {
    if (!can(ctx, 'go.opt.view') && !can(ctx, 'go.live.view')) return null;
    var s = SYS();
    return { ops: { prod: tryf(function () { return M.PR.kpi(); }, null), logi: tryf(function () { return M.LG.kpi().k; }, null), dlv: tryf(function () { return M.DL.kpi(); }, null), src: 'JFPROD.kpi · JFLOG.kpi · JFDLV.kpi' },
      finance: { aging: tryf(function () { var a = M.FN.aging({ perms: ['ar.view'] }); return { total: a.total, overdue: a.overdue, overduePct: a.overduePct, dso: a.dso }; }, null), hpp: tryf(function () { return M.FN.hppLast(); }, null), src: 'JFFIN.aging · JFFIN.hppLast' },
      system: { kpis: s ? tryf(function () { return s.kpis({ perms: ['sys11.health.view'] }); }, []) : [], src: 'JFSYS.kpis' } };
  };
  M.helpInsight = function (ctx) {
    if (!can(ctx, 'go.opt.view')) return [];
    var H = HELP(); if (!H) return [];
    var r = tryf(function () { return typeof H.analytics === 'function' ? H.analytics({ perms: ['help.manage', 'help.view'] }) : null; }, null);
    var top = r ? (Array.isArray(r) ? r : r.topSearches || r.top || r.mostSearched || []) : [];
    return top.slice(0, 5).map(function (t) { var q = t.term || t.q || t.k || t[0], n = t.n || t.count || t[1]; return { term: q, n: n, note: L('"' + q + '" dicari ' + n + '× — UI atau training mungkin perlu diperbaiki.', '"' + q + '" searched ' + n + '× — the UI or training may need improvement.'), src: 'JFHELP' }; });
  };
  M.BKL_PRI = { P0: L('P0 Critical', 'P0 Critical'), P1: L('P1 High', 'P1 High'), P2: L('P2 Medium', 'P2 Medium'), P3: L('P3 Improvement', 'P3 Improvement') };
  M.BKL_ST = ['new', 'planned', 'in_progress', 'done', 'rejected'];
  M.backlog = function (ctx, f) {
    if (!can(ctx, 'go.opt.view')) return []; f = f || {};
    return S().backlog.filter(function (b) { return (!f.pri || b.pri === f.pri) && (!f.st || b.st === f.st) && (!f.module || b.module === f.module); }).map(function (b) { return Object.assign(clone(b), { priN: M.BKL_PRI[b.pri], ownerName: b.owner ? nameOfUid(b.owner) : null }); })
      .sort(function (a, b) { return a.pri < b.pri ? -1 : a.pri > b.pri ? 1 : a.id < b.id ? -1 : 1; });
  };
  M.addBacklog = function (ctx, f) {
    if (!can(ctx, 'go.opt.manage')) return deny(ctx, 'go.opt.manage', 'BACKLOG');
    f = f || {}; if (!str(T(f.problem)) || !M.BKL_PRI[f.pri] || !str(f.module)) return bad('invalid');
    var b = { id: nid('bkl', 'BKL-'), problem: Array.isArray(f.problem) ? f.problem : L(str(f.problem)), module: f.module, impact: f.impact ? (Array.isArray(f.impact) ? f.impact : L(str(f.impact))) : null, pri: f.pri, owner: f.owner || null, effort: f.effort || null, rel: f.rel || null, st: 'new', src: f.src || null };
    S().backlog.push(b); M.audit('BACKLOG_UPDATE', ctx, { module: 'improvement', rec: b.id, after: { pri: b.pri } }); save();
    return { ok: true, item: clone(b) };
  };
  M.updateBacklog = function (ctx, id, patch, reason) {
    if (!can(ctx, 'go.opt.manage')) return deny(ctx, 'go.opt.manage', id);
    var b = by(S().backlog, 'id', id); if (!b) return bad('notfound'); patch = patch || {};
    var r0 = needReason(reason); if (r0) return r0;
    if ((patch.pri && !M.BKL_PRI[patch.pri]) || (patch.st && M.BKL_ST.indexOf(patch.st) < 0)) return bad('invalid');
    var before = clone(b); ['pri', 'st', 'owner', 'effort', 'rel'].forEach(function (k) { if (patch[k] !== undefined) b[k] = patch[k]; });
    M.audit('BACKLOG_UPDATE', ctx, { module: 'improvement', rec: b.id, before: { pri: before.pri, st: before.st }, after: { pri: b.pri, st: b.st }, reason: reason }); save();
    return { ok: true, item: clone(b) };
  };
  M.RPL_STEPS = ['build', 'qa', 'regression', 'uat', 'backup', 'deploy', 'smoke', 'monitor'];
  M.RPL_STEP_N = { build: L('Build', 'Build'), qa: L('QA', 'QA'), regression: L('Regression', 'Regression'), uat: L('UAT (bila perlu)', 'UAT (when needed)'), backup: L('Backup', 'Backup'), deploy: L('Deploy', 'Deploy'), smoke: L('Smoke Test', 'Smoke Test'), monitor: L('Monitor', 'Monitor') };
  function rplView(r) {
    var I = IMP(), rel = I ? tryf(function () { return typeof I.release === 'function' ? I.release({ perms: ['imp.view'] }, r.version) : null; }, null) : null;
    var next = M.RPL_STEPS.filter(function (k) { return r.steps[k].st !== 'done' && r.steps[k].st !== 'skipped'; })[0] || null;
    return Object.assign(clone(r), { next: next, progress: Math.round(M.RPL_STEPS.filter(function (k) { return r.steps[k].st === 'done' || r.steps[k].st === 'skipped'; }).length / M.RPL_STEPS.length * 100), impRelease: rel ? (rel.id || rel.version || true) : null, hasRollback: !!(r.rb && r.rb.version && r.rb.db && r.rb.owner && r.rb.comm && r.rb.validation) });
  }
  M.releasePlans = function (ctx) { if (!can(ctx, 'go.opt.view')) return []; return S().rpl.map(rplView); };
  M.releasePlan = function (ctx, id) { if (!can(ctx, 'go.opt.view')) return null; var r = by(S().rpl, 'id', id); return r ? rplView(r) : null; };
  M.advanceRelease = function (ctx, id, step, o) {
    if (!can(ctx, 'go.opt.manage')) return deny(ctx, 'go.opt.manage', id);
    var r = by(S().rpl, 'id', id); if (!r) return bad('notfound'); o = o || {};
    var next = rplView(r).next; if (step !== next) return bad('jump', null, { next: next });
    if (step === 'uat' && o.skip) { if (r.major) return bad('invalid', L('Rilis mayor wajib UAT.', 'A major release requires UAT.')); r.steps.uat = { st: 'skipped', at: nowS(), by: ctx.uid }; }
    else {
      if (step === 'deploy' && !(r.rb && r.rb.version && r.rb.db && r.rb.owner && r.rb.comm && r.rb.validation)) return bad('gate', L('Rollback plan wajib sebelum deploy (§108).', 'A rollback plan is required before deploy (§108).'));
      if (step === 'backup') { var s = SYS(), bk = s ? tryf(function () { return s.backups({ perms: ['sys11.backup.view'] }); }, null) : null; if (!bk || !bk.lastOk || String(bk.lastOk.at).slice(0, 10) < iso(M.now() - DAY)) return bad('gate', L('Backup terakhir yang sukses harus dari 24 jam terakhir (JFSYS).', 'The last successful backup must be from the last 24 hours (JFSYS).')); }
      r.steps[step] = { st: 'done', at: nowS(), by: ctx.uid, note: o.note || null };
    }
    M.audit(step === 'deploy' ? 'RELEASE_DEPLOYED' : 'RELEASE_STEP', ctx, { module: 'release', rec: r.id, after: { step: step, version: r.version } }); save();
    return { ok: true, plan: rplView(r) };
  };

  /* ---------- Engine-to-engine facts for JFIMP (no ctx; read-only) ---------- */
  // §11 production deployment gate: required UAT passed = no open Critical case and ≥ 95% pass.
  M.uatGate = function () { var u = S().uat, p = u.filter(function (x) { return x.st === 'pass'; }).length, cr = u.filter(function (x) { return x.sev === 'critical' && x.st !== 'pass'; }).length, rate = pct(p, u.length) || 0;
    return { ok: u.length > 0 && !cr && rate >= 95, v: L('UAT ' + rate + '% lulus · ' + cr + ' kritis terbuka', 'UAT ' + rate + '% passed · ' + cr + ' critical open'), rate: rate, critical: cr }; };
  M.migrationGate = function () { var mg = S().mig, ap = mg.filter(function (b) { return b.st === 'approved'; }).length, rc = Object.keys(M.RECON).filter(function (k) { return !reconOk(k); });
    return { ok: ap === mg.length && !rc.length, v: L(ap + '/' + mg.length + ' batch disetujui' + (rc.length ? ' · selisih ' + rc.join(', ') : ''), ap + '/' + mg.length + ' batches approved' + (rc.length ? ' · differences ' + rc.join(', ') : '')), approved: ap, total: mg.length, differences: rc }; };
  var UAT_WAVE = { 'Logistik': 'W3', 'Produksi': 'W4', 'Delivery': 'W5', 'Finance': 'W6', 'Supply': 'W6', 'Manajemen': 'W7', 'Portal Klien': 'W8' };
  M.uatByWave = function (w) { var l = S().uat.filter(function (u) { return UAT_WAVE[u.module] === w; }); return l.length ? Math.round(l.filter(function (u) { return u.st === 'pass'; }).length / l.length * 100) : null; };
  // Staging rows (old system) whose references do not resolve — for JFIMP's orphan check (§15).
  M.stagingOrphans = function () { var out = []; S().mig.forEach(function (b) { b.rows.forEach(function (r) { if (!r.rej && r.issues.some(function (i) { return i.k === 'ref'; })) out.push({ id: b.id + '-R' + String(r.n).padStart(3, '0'), src: b.src, n: r.n, ref: r.issues.filter(function (i) { return i.k === 'ref'; })[0].note }); }); }); return out; };

  /* ---------- §109 / §116 Fase 12 Command Center ---------- */
  M.command = function (ctx) {
    if (!can(ctx, 'go.view')) return null;
    var full = Object.assign({}, ctx, { perms: ctx.perms.concat(['go.view', 'go.live.view', 'go.uat.view', 'go.opt.view']) });
    var rd = M.readiness(full), ir = impReadiness(), hr = helpReadiness(), d = function (k) { return by(rd.dims, 'k', k); }, h = sysHealth(), ad = M.adoption(full);
    var crit = S().incidents.filter(function (i) { return i.st !== 'closed' && i.sev === 'critical'; }).length + (cnt(fact(ir, ['criticalBugs', 'criticalBugsOpen', 'openCritical'])) || 0);
    var avail = by(M.liveKpis(full), 'k', 'availability');
    var K = function (k, n, v, u, st, sc, src) { return { k: k, n: n, v: v, u: u, st: st, s: sc, src: src }; };
    var tone = function (v, g, w) { return v == null ? 'info' : v >= g ? 'ok' : v >= w ? 'warn' : 'crit'; };
    return {
      hero: M.hero(full), readiness: { score: rd.score, rec: rd.rec, failed: rd.failed },
      kpis: [K('build', L('Build Completion', 'Build Completion'), d('build').v, '%', tone(d('build').v, 90, 70), 'BUILD-002', 'JFIMP'), K('qa', L('QA Pass Rate', 'QA Pass Rate'), d('qa').v, '%', tone(d('qa').v, 95, 85), 'QA-001', 'JFIMP'),
        K('regression', L('Regression Pass', 'Regression Pass'), num(fact(ir, ['regression', 'regressionPass'])), '%', tone(num(fact(ir, ['regression', 'regressionPass'])), 100, 95), 'QA-001', 'JFIMP'),
        K('security', L('Security Status', 'Security Status'), d('security').v, '%', rd.failed.indexOf('security') >= 0 || rd.failed.indexOf('permission') >= 0 ? 'crit' : tone(d('security').v, 95, 85), 'SVL-004', 'JFIMP'),
        K('migration', L('Migration Accuracy', 'Migration Accuracy'), M.migAccuracy(), '%', tone(M.migAccuracy(), 98, 90), 'MIG-001', 'JFGO'), K('uat', L('UAT Completion', 'UAT Completion'), d('uat').v, '%', tone(d('uat').v, 95, 80), 'UAT-001', 'JFGO'),
        K('training', L('Training Completion', 'Training Completion'), d('training').v, '%', tone(d('training').v, 90, 70), 'HELP-007', 'JFHELP'), K('critical', L('Critical Issues', 'Critical Issues'), crit, '', crit ? 'crit' : 'ok', 'LIVE-002', 'JFGO + JFIMP'),
        K('readiness', L('Go-Live Readiness', 'Go-Live Readiness'), rd.score, '%', rd.rec === 'GO' ? 'ok' : rd.rec === 'CONDITIONAL GO' ? 'warn' : 'crit', 'LIVE-004', 'JFGO §94'),
        K('health', L('Production Health', 'Production Health'), h ? h.overallN : null, '', h ? (h.overall === 'healthy' ? 'ok' : h.overall === 'warning' ? 'warn' : 'crit') : 'info', 'LIVE-001', 'JFSYS.health'),
        K('adoption', L('Production Adoption', 'Production Adoption'), ad ? by(ad, 'k', 'activePct').v : null, '%', 'info', 'OPT-002', 'JFACCESS'), K('availability', L('System Availability', 'System Availability'), avail ? avail.v : null, '%', avail ? avail.st : 'info', 'RLB-001', 'JFSYS')],
      flow: ['BUILD', 'INTEGRATE', 'TEST', 'SECURITY VALIDATION', 'MIGRATE', 'RECONCILE', 'UAT', 'TRAIN', 'SMART HELP READY', 'PILOT', 'PARALLEL RUN', 'CLEAN DUMMY DATA', 'SNAPSHOT', 'CUT-OFF', 'GO / NO-GO', 'START PRODUCTION', 'HYPERCARE', '30-DAY REVIEW', '60-DAY OPTIMIZATION', '90-DAY SCALE', 'CONTINUOUS IMPROVEMENT'],
      gates: rd.gates, training: hr ? { pct: num(hr.training), untrained: hr.keyUsersUntrained || [] } : null
    };
  };

  /* ---------- Screens (§112) MIG / UAT / CUT / LIVE / OPT ---------- */
  function sc(id, n, a, p, np, icon, pur, emp, devs, o) {
    return Object.assign({ id: id, n: n, a: a, p: p, np: np, nv: 'NV-' + np.slice(3), icon: icon, pur: pur, dom: 'go12', lvl: 4, pN: 12, p12: true, nb: [], bf: [], aud: [], dev: 'd', devs: devs || { d: 'primary', t: 'supported', m: 'no' },
      emp: emp || L('Belum ada data.', 'No data yet.'), err: M.MSG.load, warn: L('Ada yang perlu perhatian.', 'Something needs attention.'), ok: L('Tersimpan.', 'Saved.') }, o || {});
  }
  var DT = function (t, m) { return { d: 'primary', t: t, m: m }; };
  M.SCREENS = [
    sc('MIG-001', L('Data Migration Center', 'Data Migration Center'), 'T08', 'go.mig.view', 'NP-06', 'database', L('18 sumber migrasi, pipeline Extract→Approve, total/valid/warning/error/rejected, akurasi.', '18 migration sources, Extract→Approve pipeline, total/valid/warning/error/rejected, accuracy.'), L('No migration error.', 'No migration error.'), DT('limited', 'no')),
    sc('MIG-002', L('Validasi Migrasi', 'Migration Validation'), 'T04', 'go.mig.view', 'NP-06', 'filecheck', L('Baris lama per sumber: duplikat, field kosong, satuan, tanggal, usang, referensi; mapping ke ID master yang sudah ada.', 'Old rows per source: duplicates, missing fields, units, dates, obsolete, references; mapping to existing master ids.'), L('No migration error.', 'No migration error.'), DT('limited', 'no')),
    sc('MIG-003', L('Rekonsiliasi', 'Reconciliation'), 'T05', 'go.mig.view', 'NP-06', 'scale', L('Lama vs baru (AR, AP, stok, aset, kas, bank) dari angka JFFIN asli; selisih terlihat; Reconciled/Difference/Review/Approved.', 'Old vs new (AR, AP, stock, assets, cash, bank) from the real JFFIN numbers; visible difference; Reconciled/Difference/Review/Approved.'), null, DT('review', 'no')),
    sc('MIG-004', L('Persetujuan Migrasi', 'Migration Approval'), 'T03', 'go.mig.view', 'NP-06', 'usercheck', L('Data lead mengajukan, owner menyetujui; AR/AP/kas/saldo awal juga Finance.', 'Data lead requests, owner approves; AR/AP/cash/opening also Finance.'), null, DT('review', 'alert')),
    sc('UAT-001', L('UAT Command Center', 'UAT Command Center'), 'T08', 'go.uat.view', 'NP-08', 'clipboard', L('Kasus UAT per kelompok tester, status, severity, cakupan role × perangkat; sign-off tanpa isu Critical.', 'UAT cases per tester group, status, severity, role × device coverage; sign-off without Critical issues.'), L('No critical UAT issue.', 'No critical UAT issue.'), DT('primary', 'alert')),
    sc('UAT-002', L('Skenario UAT', 'UAT Scenario'), 'T03', 'go.uat.test', 'NP-08', 'checklist', L('Prasyarat, langkah, hasil yang diharapkan, hasil aktual, bukti, Pass/Fail/Blocked.', 'Precondition, steps, expected, actual, evidence, Pass/Fail/Blocked.'), null, DT('primary', 'supported')),
    sc('UAT-003', L('Bukti UAT', 'UAT Evidence'), 'T05', 'go.uat.test', 'NP-08', 'camera', L('Foto, video, screenshot per kasus UAT.', 'Photos, videos, screenshots per UAT case.'), null, DT('primary', 'supported')),
    sc('UAT-004', L('Hasil Usability', 'Usability Result'), 'T05', 'go.uat.view', 'NP-08', 'gauge', L('Waktu, tap, error, pertanyaan, bantuan, kesulitan; "perbaiki UI dulu" bila pengguna kesulitan.', 'Time, taps, errors, questions, help, difficulty; "improve UI first" when users struggle.'), null, DT('primary', 'no')),
    sc('CUT-001', L('Persiapan Go-Live', 'Go-Live Preparation'), 'T08', 'go.cut.view', 'NP-10', 'checklist', L('Checklist §81 dari data nyata, pilot & parallel run, klasifikasi data.', '§81 checklist from real data, pilot & parallel run, data classification.'), null, DT('review', 'no')),
    sc('CUT-002', L('Reset Center', 'Reset Center'), 'T05', 'go.cut.view', 'NP-10', 'refresh', L('5 mode reset, cut-off, scope, dependency check, preview, snapshot, dual approval, eksekusi soft erase.', '5 reset modes, cut-off, scope, dependency check, preview, snapshot, dual approval, soft-erase execution.'), null, DT('limited', 'no')),
    sc('CUT-003', L('Preview Reset', 'Reset Preview'), 'T03', 'go.cut.view', 'NP-10', 'eye', L('Akan dipertahankan / diarsip / dihapus / bisa dipulihkan / dependensi, dengan jumlah dan contoh ID.', 'Will retain / archive / delete / recoverable / dependencies, with counts and sample ids.'), null, DT('review', 'no')),
    sc('CUT-004', L('Snapshot', 'Snapshot'), 'T05', 'go.cut.view', 'NP-10', 'camera', L('Salinan semua state engine + checksum; verifikasi round trip.', 'Copy of every engine state + checksum; round-trip verification.'), null, DT('limited', 'no')),
    sc('CUT-005', L('Riwayat Reset', 'Reset History'), 'T05', 'go.cut.view', 'NP-10', 'history', L('Batch reset, tanggal, oleh, alasan; restore terpilih / semua dalam retensi.', 'Reset batches, date, by, reason; restore selected / all within retention.'), L('No reset history.', 'No reset history.'), DT('review', 'no')),
    sc('CUT-006', L('Cut-Off', 'Cut-Off'), 'T06', 'go.cut.view', 'NP-10', 'calendar', L('Cut-off tanggal atau bulanan → production start.', 'Date or monthly cut-off → production start.'), null, DT('limited', 'no')),
    sc('CUT-007', L('Production Start', 'Production Start'), 'T03', 'go.cut.view', 'NP-10', 'flag', L('START PRODUCTION hanya aktif bila semua syarat wajib lulus; PRODUCTION_START_DATE tidak bisa diubah.', 'START PRODUCTION only when all hard requirements pass; PRODUCTION_START_DATE can never change.'), null, DT('review', 'no')),
    sc('LIVE-001', L('Go-Live Command Center', 'Go-Live Command Center'), 'T08', 'go.live.view', 'NP-11', 'gauge', L('LIVE / PRE-GO-LIVE, versi, kesehatan sistem, KPI go-live, kesehatan domain.', 'LIVE / PRE-GO-LIVE, version, system health, go-live KPIs, domain health.'), null, DT('monitor', 'alert')),
    sc('LIVE-002', L('Hypercare', 'Hypercare'), 'T05', 'go.live.view', 'NP-11', 'heart', L('Hari 1/3/7/14/30 dan insiden terbuka.', 'Day 1/3/7/14/30 and open incidents.'), L('No active incident.', 'No active incident.'), DT('monitor', 'alert')),
    sc('LIVE-003', L('Detail Insiden', 'Incident Detail'), 'T03', 'go.incident.report', 'NP-11', 'alert', L('Laporkan masalah (semua user, juga HP); triage → assign → … → close.', 'Report a problem (every user, incl. mobile); triage → assign → … → close.'), L('No active incident.', 'No active incident.'), { d: 'primary', t: 'quick', m: 'primary' }),
    sc('LIVE-004', L('Go / No-Go', 'Go / No-Go'), 'T08', 'go.live.view', 'NP-11', 'scale', L('Skor kesiapan berbobot, hard gate, rekomendasi; keputusan akhir oleh owner.', 'Weighted readiness score, hard gates, recommendation; final decision by the owner.'), null, DT('review', 'alert')),
    sc('OPT-001', L('Review 30/60/90', '30/60/90 Review'), 'T05', 'go.opt.view', 'NP-12', 'calendar', L('Stabilize, Optimize, Scale.', 'Stabilize, Optimize, Scale.'), null, DT('review', 'no')),
    sc('OPT-002', L('Adoption Dashboard', 'Adoption Dashboard'), 'T08', 'go.opt.view', 'NP-12', 'users', L('DAU, user aktif %, portal klien, self-service, Smart Help; KPI operasi, finance & sistem dari engine pemilik.', 'DAU, active user %, client portal, self-service, Smart Help; ops, finance & system KPIs from the owner engines.'), null, DT('review', 'no')),
    sc('OPT-003', L('Improvement Backlog', 'Improvement Backlog'), 'T05', 'go.opt.view', 'NP-12', 'list', L('P0–P3, owner, effort, target release, status.', 'P0–P3, owner, effort, target release, status.'), L('No improvement request.', 'No improvement request.'), DT('review', 'no')),
    sc('OPT-004', L('Release Plan', 'Release Plan'), 'T05', 'go.opt.view', 'NP-12', 'rocket', L('Build→QA→Regression→UAT→Backup→Deploy→Smoke→Monitor + rollback plan.', 'Build→QA→Regression→UAT→Backup→Deploy→Smoke→Monitor + rollback plan.'), null, DT('review', 'no'))
  ];
  M.screen = function (id) { return by(M.SCREENS, 'id', id); };
  M.PARENTS = { 'MIG-002': ['MIG-001'], 'MIG-003': ['MIG-001'], 'MIG-004': ['MIG-001'], 'UAT-002': ['UAT-001'], 'UAT-003': ['UAT-002'], 'UAT-004': ['UAT-001'], 'CUT-002': ['CUT-001'], 'CUT-003': ['CUT-002'],
    'CUT-004': ['CUT-002'], 'CUT-005': ['CUT-002'], 'CUT-006': ['CUT-001'], 'CUT-007': ['CUT-001'], 'LIVE-002': ['LIVE-001'], 'LIVE-003': ['LIVE-002'], 'LIVE-004': ['LIVE-001'], 'OPT-002': ['OPT-001'], 'OPT-003': ['OPT-001'], 'OPT-004': ['OPT-001'] };
  // record id → {kind, id} for app recordOf / authorize (staff-only records, no client scope).
  M.recordOf = function (id) {
    id = String(id || '');
    if (/^MGB-\d+$/.test(id)) { var b = batch(id); return b ? { id: id, kind: 'migration' } : null; }
    if (/^RCN-/.test(id)) return M.RECON[id.slice(4).toLowerCase()] ? { id: id, kind: 'recon' } : null;
    if (/^UT-\d+$/.test(id)) return by(S().uat, 'id', id) ? { id: id, kind: 'uat' } : null;
    if (/^USB-/.test(id)) return by(S().usb, 'id', id) ? { id: id, kind: 'usability' } : null;
    if (/^RSB-/.test(id)) return rsb(id) ? { id: id, kind: 'reset' } : null;
    if (/^SNP-/.test(id)) return by(S().snaps, 'id', id) ? { id: id, kind: 'snapshot' } : null;
    if (/^INC-/.test(id)) { var i = by(S().incidents, 'id', id); return i ? { id: id, kind: 'incident', by: i.by } : null; }
    if (/^BKL-/.test(id)) return by(S().backlog, 'id', id) ? { id: id, kind: 'backlog' } : null;
    if (/^RVW-/.test(id)) return by(S().reviews, 'id', id) ? { id: id, kind: 'review' } : null;
    if (/^RPL-/.test(id)) return by(S().rpl, 'id', id) ? { id: id, kind: 'release' } : null;
    if (/^COF-/.test(id)) return { id: id, kind: 'cutoff' };
    return null;
  };

  /* ---------- Navigation (append to the navs JFIMP defines; never replace) ---------- */
  function N(k, l, i, s, x) { return Object.assign({ k: k, l: l, i: i, s: s }, x || {}); }
  var GN = {
    prep: N('cut1', L('Persiapan Go-Live', 'Go-Live Preparation'), 'checklist', 'CUT-001', { also: ['CUT-006'] }), reset: N('cut2', L('Reset Center', 'Reset Center'), 'refresh', 'CUT-002', { also: ['CUT-003'] }),
    snap: N('cut4', L('Snapshot', 'Snapshot'), 'camera', 'CUT-004'), hist: N('cut5', L('Riwayat Reset', 'Reset History'), 'history', 'CUT-005'), cof: N('cut6', L('Cut-Off', 'Cut-Off'), 'calendar', 'CUT-006'),
    start: N('cut7', L('Production Start', 'Production Start'), 'flag', 'CUT-007'), mig: N('mig1', L('Migrasi Data', 'Data Migration'), 'database', 'MIG-001', { also: ['MIG-002'] }), val: N('mig2', L('Validasi', 'Validation'), 'filecheck', 'MIG-002'),
    rec: N('mig3', L('Rekonsiliasi', 'Reconciliation'), 'scale', 'MIG-003'), migA: N('mig4', L('Persetujuan Migrasi', 'Migration Approval'), 'usercheck', 'MIG-004'),
    uat: N('uat1', L('UAT', 'UAT'), 'clipboard', 'UAT-001', { also: ['UAT-002', 'UAT-003'] }), uatT: N('uat2', L('Tugas UAT', 'UAT Tasks'), 'checklist', 'UAT-002', { also: ['UAT-003'] }), usb: N('uat4', L('Usability', 'Usability'), 'gauge', 'UAT-004'),
    live: N('live1', L('Go-Live Center', 'Go-Live Center'), 'gauge', 'LIVE-001'), hyper: N('live2', L('Hypercare', 'Hypercare'), 'heart', 'LIVE-002', { also: ['LIVE-003'] }), gng: N('live4', L('Go / No-Go', 'Go / No-Go'), 'scale', 'LIVE-004'),
    inc: N('live3', L('Lapor Masalah', 'Report a Problem'), 'alert', 'LIVE-003'), rvw: N('opt1', L('Review 30/60/90', '30/60/90 Review'), 'calendar', 'OPT-001'), adopt: N('opt2', L('Adopsi', 'Adoption'), 'users', 'OPT-002'),
    bkl: N('opt3', L('Backlog', 'Backlog'), 'list', 'OPT-003'), rpl: N('opt4', L('Release Plan', 'Release Plan'), 'rocket', 'OPT-004')
  };
  M.GONAV = GN;
  // role → [[group key, id label, en label, icon, items]]. JFIMP's navs carry empty groups g-mig12 / g-uat12 / g-go12 (owner: g-live12) we fill.
  var GO_G = function (it) { return ['g-go12', 'Cutover & Go-Live', 'Cutover & Go-Live', 'flag', it]; };
  var NAV_ADD = {
    implead: [['g-mig12', 'Migrasi Data', 'Data Migration', 'upload', [GN.mig, GN.rec, GN.migA]], ['g-uat12', 'UAT', 'UAT', 'usercheck', [GN.uat, GN.usb]],
      GO_G([GN.prep, GN.reset, GN.hist, GN.cof, GN.start, GN.live, GN.hyper, GN.gng, GN.rvw, GN.adopt, GN.bkl, GN.rpl])],
    qalead: [['g-uat12', 'UAT', 'UAT', 'usercheck', [GN.uat, GN.uatT, GN.usb]], GO_G([GN.live, GN.hyper])],
    datalead: [['g-mig12', 'Migrasi & Rekonsiliasi', 'Migration & Reconciliation', 'upload', [GN.mig, GN.val, GN.rec, GN.migA]], GO_G([GN.reset, GN.hist, GN.prep])],
    trainer: [['g-uat12', 'UAT & Usability', 'UAT & Usability', 'usercheck', [GN.usb]], GO_G([GN.adopt])],
    owner: [['g-live12', 'Go-Live', 'Go-Live', 'flag', [GN.live, GN.gng, GN.prep, GN.start, GN.migA, GN.rec, GN.hyper, GN.rvw, GN.adopt]]],
    finance: [['g-go12', 'Go-Live (Finance)', 'Go-Live (Finance)', 'flag', [GN.migA, GN.rec, GN.hist]]],
    superadmin: [['g-go12', 'Cutover Teknis', 'Technical Cutover', 'refresh', [GN.reset, GN.snap, GN.hist, GN.live, GN.hyper]]],
    sysadmin: [['g-go12', 'Cutover Teknis', 'Technical Cutover', 'refresh', [GN.reset, GN.snap, GN.hist, GN.live, GN.hyper]]]
  };
  function navHas(nav, s) { return nav.some(function (n) { return n.s === s || (n.sub && navHas(n.sub, s)); }); }
  function addNav(C, only) {
    (only || Object.keys(NAV_ADD)).forEach(function (r) {
      var R = C.ROLES[r]; if (!R || !Array.isArray(R.nav)) return;
      NAV_ADD[r].forEach(function (d) {
        var items = d[4].filter(function (n) { return !navHas(R.nav, n.s); }); if (!items.length) return;
        // Owner without JFIMP's g-live12: extend any group already holding LIVE-004 / LIVE-001.
        var host = R.nav.filter(function (n) { return n.sub && n.k === d[0]; })[0] || (r === 'owner' ? R.nav.filter(function (n) { return n.sub && n.sub.some(function (m) { return m.s === 'LIVE-004' || m.s === 'LIVE-001'; }); })[0] : null);
        if (host) items.forEach(function (n) { host.sub.push(n); });
        else R.nav.push({ k: d[0], l: L(d[1], d[2]), i: d[3], sub: items });
      });
    });
  }

  /* ---------- Roles: add JFGO perms to the roles that exist (incl. JFIMP's, whenever they appear) ---------- */
  function addP(list, extra) { if (!Array.isArray(list)) return; extra.forEach(function (p) { if (list.indexOf(p) < 0) list.push(p); }); }
  var navDone = {};
  M.syncRoles = function () {
    var C = M.C, x = X(); if (!C) return;
    Object.keys(C.ROLES).forEach(function (r) {
      if (r === 'client' && !M.ROLE_PERMS.client) return;
      var ps = M.ROLE_PERMS[r] || M.BASE_PERMS;
      addP(C.ROLES[r].perms, ps); if (x && x.ROLES[r]) addP(x.ROLES[r].perms, ps);
      if (!navDone[r] && NAV_ADD[r] && C.ROLES[r].nav) { navDone[r] = true; addNav(C, [r]); }
    });
  };
  M.install = function (C, Xa, P, CM, LG, PR, DL, FN, CLP, SYSa, IMPa) {
    if (!C || C.__p12go) return; C.__p12go = true;
    M.C = C; M.X = Xa || null; M.P = P || null; M.CM = CM || null; M.LG = LG || null; M.PR = PR || null; M.DL = DL || null; M.FN = FN || null; M.CLP = CLP || null; M.SYS = SYSa || null; M.IMP = IMPa || null;
    Object.keys(M.PERMS).forEach(function (k) { C.PERMS[k] = M.PERMS[k]; });
    M.syncRoles();
    if (Xa) {
      M.joinNotifs(Xa);
      // Install-order safety: roles JFIMP adds later get their JFGO perms before any session is built.
      if (!Xa.__p12goR) { Xa.__p12goR = true; var oRes = Xa.resolve; Xa.resolve = function () { tryf(M.syncRoles, null); return oRes.apply(Xa, arguments); }; }
    }
    var s = SYSa || root.JFSYS;
    if (s) {
      if (Array.isArray(s.AUDIT_SOURCES) && !s.AUDIT_SOURCES.some(function (a) { return a[0] === 'golive'; })) s.AUDIT_SOURCES.push(['golive', function () { return S().audit; }]);
      if (Array.isArray(s.AUDIT_MODULES) && !s.AUDIT_MODULES.some(function (a) { return a[0] === 'golive'; })) s.AUDIT_MODULES.push(['golive', L('Go-Live (Fase 12)', 'Go-Live (Phase 12)')]);
      if (s.AUDIT) Object.keys(M.AUDIT).forEach(function (k) { if (!s.AUDIT[k]) s.AUDIT[k] = M.AUDIT[k]; });
    }
    var orig = C.screen, extra = {};
    M.SCREENS.forEach(function (sp) { extra[sp.id] = sp; });
    C.screen = function (id) { return extra[id] || orig(id); };
    C.SCREENS_P12GO = M.SCREENS;
    S();
  };
  // Test/demo reset: fresh store (the only way to clear PRODUCTION_START_DATE), stubs cleared.
  M._reset = function () {
    st = null; snapMem = {}; M._stub = {}; fixed = null; SIM = ms(D.simNow); T0 = Date.now();
    try { if (ls) { ls.removeItem(KEY); ls.removeItem(SNAPKEY); } else delete mem[KEY]; } catch (e) {}
    seed(); save(); M.syncRoles();
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = M;
  else root.JFGO = M;
})(typeof window !== 'undefined' ? window : this);
