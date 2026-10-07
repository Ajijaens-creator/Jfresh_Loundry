/* ==========================================================================
   JFRESH OS — Client Portal engine (Phase 11 · NP 1.0 · NP-01…NP-06)
   Client home, self-service pickup, tracking, POD & document center, order
   history, billing visibility, complaints & feedback, client users and
   property access — for hotel, villa and spa clients.

   Enter once, use everywhere: orders, schedules, trips and ETA come from
   Phase 7 (JFLOG), production stages from Phase 8 (JFPROD), deliveries, POD,
   service completion and returns from Phase 9 (JFDLV), invoices and payments
   from Phase 10 (JFFIN), clients, properties, contracts and shared documents
   from Phase 6 (JFCOMM). This engine stores only what is new: client-user
   access profiles, requests, cases, document views and shares, notifications
   and its own audit trail.

   Isolation (§47, §66): this engine is the "server" of the prototype. Every
   query and action goes through M.scope(ctx): the client of the session and
   the properties of the user's scope. A Client A user never reaches Client B
   data, a single-property user never reaches another property, a suspended or
   expired client user is refused here and at login (X.resolve is wrapped).
   Clients never get an edit function for anything financial.
   ========================================================================== */
(function (root) {
  function req(p) { try { return typeof require !== 'undefined' ? require(p) : null; } catch (e) { return null; } }
  var D = root.JFCLP_DATA || req('./jfos-clp-data.js');
  var CM = root.JFCOMM || req('./jfos-comm.js');
  var LG = root.JFLOG || req('./jfos-logi.js');
  var PR = root.JFPROD || req('./jfos-prod.js');
  var DL = root.JFDLV || req('./jfos-dlv.js');
  var FN = root.JFFIN || null;
  var X = root.JFACCESS || null;
  function L(a, b) { return [a, b === undefined ? a : b]; }
  var M = { version: 'NP 1.0', D: D };
  var MIN = 6e4, HOUR = 36e5, DAY = 864e5;
  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  function sum(a) { return a.reduce(function (s, x) { return s + (+x || 0); }, 0); }
  function r1(x) { return Math.round(x * 10) / 10; }
  function pct(a, b) { return b ? Math.round(a / b * 1000) / 10 : null; }
  function by(arr, k, v) { for (var i = 0; i < arr.length; i++) if (arr[i][k] === v) return arr[i]; return null; }
  function T(x) { return Array.isArray(x) ? x[0] : (x == null ? '' : String(x)); }
  function E(x) { return Array.isArray(x) ? x[1] : (x == null ? '' : String(x)); }
  function LL(x) { return Array.isArray(x) ? x : L(x == null ? '' : String(x)); }
  function str(x) { return T(x).trim(); }
  function uniq(a) { return a.filter(function (x, i) { return x != null && a.indexOf(x) === i; }); }
  function ms(s) { if (typeof s === 'number') return s; var p = String(s).split(/[-: T]/); return Date.UTC(+p[0], +p[1] - 1, +(p[2] || 1), +(p[3] || 0), +(p[4] || 0), +(p[5] || 0)); }
  function iso(t) { return new Date(t).toISOString().slice(0, 10); }
  function isoT(t) { return new Date(t).toISOString().slice(0, 16).replace('T', ' '); }
  function hm(t) { return new Date(t).toISOString().slice(11, 16); }
  function addDays(d, n) { return iso(ms(d) + n * DAY); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function rp(n) { var v = Math.round(+n || 0), neg = v < 0; v = Math.abs(v); return (neg ? '−' : '') + 'Rp ' + String(v).replace(/\B(?=(\d{3})+(?!\d))/g, '.'); }
  var MONTHS = [L('Jan', 'Jan'), L('Feb', 'Feb'), L('Mar', 'Mar'), L('Apr', 'Apr'), L('Mei', 'May'), L('Jun', 'Jun'), L('Jul', 'Jul'), L('Agu', 'Aug'), L('Sep', 'Sep'), L('Okt', 'Oct'), L('Nov', 'Nov'), L('Des', 'Dec')];
  var MONTHS_F = [L('Januari', 'January'), L('Februari', 'February'), L('Maret', 'March'), L('April', 'April'), L('Mei', 'May'), L('Juni', 'June'), L('Juli', 'July'), L('Agustus', 'August'), L('September', 'September'), L('Oktober', 'October'), L('November', 'November'), L('Desember', 'December')];
  function dLabel(d) { if (!d) return L('—', '—'); var p = String(d).slice(0, 10).split('-'), m = MONTHS[+p[1] - 1]; return L(+p[2] + ' ' + m[0] + ' ' + p[0], +p[2] + ' ' + m[1] + ' ' + p[0]); }
  function periodLabel(p) { if (!p) return L('—', '—'); var x = p.split('-'), m = MONTHS[+x[1] - 1], last = new Date(Date.UTC(+x[0], +x[1], 0)).getUTCDate(); return L('1–' + last + ' ' + m[0] + ' ' + x[0], '1–' + last + ' ' + m[1] + ' ' + x[0]); }
  M.u = { L: L, T: T, E: E, rp: rp, ms: ms, iso: iso, isoT: isoT, hm: hm, addDays: addDays, esc: esc, dLabel: dLabel, periodLabel: periodLabel, pct: pct, MONTHS: MONTHS, MONTHS_F: MONTHS_F };

  M.MSG = {
    noperm: L('Anda tidak memiliki izin untuk tindakan ini.', 'You do not have permission for this action.'),
    scope: L('Data ini di luar akses property Anda.', 'This record is outside your property access.'),
    blocked: L('Akses portal Anda sedang tidak aktif. Hubungi administrator perusahaan Anda.', 'Your portal access is not active. Contact your company administrator.'),
    notfound: L('Data tidak ditemukan.', 'Record not found.'),
    invalid: L('Periksa data dan coba lagi.', 'Check the data and try again.'),
    reason: L('Alasan wajib diisi.', 'A reason is required.'),
    jump: L('Langkah ini belum bisa dilakukan. Ikuti urutan proses.', 'This step is not possible yet. Follow the process order.'),
    dup: L('Sudah ada pickup di jam yang sama untuk property ini.', 'There is already a pickup at the same time for this property.'),
    loadErr: L('Data belum berhasil dimuat.', 'The data could not be loaded.'),
    retry: L('Coba Lagi', 'Try Again'),
    emptyActive: L('Belum ada pesanan aktif.', 'No active orders yet.'),
    emptyInv: L('Belum ada invoice.', 'No invoices yet.'),
    emptyCase: L('Belum ada laporan masalah.', 'No issue reports yet.'),
    emptyUser: L('Belum ada user tambahan.', 'No additional users yet.'),
    emptyDoc: L('Belum ada dokumen.', 'No documents yet.'),
    sent: L('Permintaan terkirim.', 'Request sent.')
  };

  /* ---------- Permissions (§28): client permission = what a client user may do in the portal ---------- */
  M.CP = { order: 'clp.order.view', pickup: 'clp.pickup.create', track: 'clp.track.view', pod: 'clp.pod.view', invoice: 'clp.invoice.view', payment: 'clp.payment.view', complaint: 'clp.complaint.create', users: 'clp.users.manage' };
  M.CP_KEYS = ['order', 'pickup', 'track', 'pod', 'invoice', 'payment', 'complaint', 'users'];
  M.CP_LABEL = { order: L('Lihat Pesanan', 'View Order'), pickup: L('Buat Pickup', 'Create Pickup'), track: L('Lihat Tracking', 'View Tracking'), pod: L('Lihat POD', 'View POD'), invoice: L('Lihat Invoice', 'View Invoice'),
    payment: L('Lihat Pembayaran', 'View Payment'), complaint: L('Buat Komplain', 'Create Complaint'), users: L('Kelola User Klien', 'Manage Client Users') };
  // Phase 4–9 permissions a client user loses together with the portal permission that covers them (defence in depth).
  var UNDER = { pickup: ['lg.order.create', 'clt.pickup'], track: ['lg.track.own', 'dlv.track.own'], invoice: ['clt.invoice'], complaint: ['clt.complaint', 'dlv.issue.report'] };
  M.PERMS = {
    'clp.portal': L('Portal klien: beranda, pesanan, dokumen', 'Client portal: home, orders, documents'),
    'clp.order.view': L('Klien: lihat pesanan & riwayat', 'Client: view orders & history'), 'clp.pickup.create': L('Klien: buat pickup, extra, reschedule, batal', 'Client: create pickup, extra, reschedule, cancel'),
    'clp.track.view': L('Klien: lihat tracking', 'Client: view tracking'), 'clp.pod.view': L('Klien: lihat POD & dokumen layanan', 'Client: view POD & service documents'),
    'clp.invoice.view': L('Klien: lihat invoice & statement', 'Client: view invoices & statements'), 'clp.payment.view': L('Klien: lihat pembayaran', 'Client: view payments'),
    'clp.complaint.create': L('Klien: buat & balas laporan masalah', 'Client: create & reply to issue reports'), 'clp.users.manage': L('Klien: kelola user & akses property', 'Client: manage users & property access'),
    'clp.view': L('Lihat permintaan & kasus portal klien', 'View client portal requests & cases'), 'clp.case.manage': L('Tangani kasus komplain klien', 'Handle client complaint cases'),
    'clp.kpi': L('KPI portal klien', 'Client portal KPIs')
  };
  M.ROLE_PERMS = {
    client: ['clp.portal'].concat(M.CP_KEYS.map(function (k) { return M.CP[k]; })),
    supervisor: ['clp.view', 'clp.case.manage'], opsmgr: ['clp.view', 'clp.case.manage', 'clp.kpi'], sales: ['clp.view', 'clp.case.manage', 'clp.kpi'],
    finance: ['clp.view', 'clp.case.manage'], owner: ['clp.view', 'clp.kpi']
  };
  /* Client roles (§26) with default permission sets (§28). rank: a user never grants above their own rank. */
  var ALLP = M.CP_KEYS.slice(), OPS = ['order', 'pickup', 'track', 'pod', 'complaint'];
  M.CROLES = {
    owner: { n: L('Owner', 'Owner'), rank: 8, perms: ALLP, contract: true },
    director: { n: L('Director', 'Director'), rank: 7, perms: ALLP, contract: true },
    gm: { n: L('General Manager', 'General Manager'), rank: 6, perms: ALLP, contract: true },
    finance: { n: L('Finance', 'Finance'), rank: 5, perms: ['order', 'pod', 'invoice', 'payment', 'complaint'], contract: true },
    opsmgr: { n: L('Operations Manager', 'Operations Manager'), rank: 4, perms: OPS, contract: false },
    supervisor: { n: L('Supervisor', 'Supervisor'), rank: 3, perms: OPS, contract: false },
    fo: { n: L('Front Office', 'Front Office'), rank: 2, perms: OPS, contract: false },
    viewonly: { n: L('View Only', 'View Only'), rank: 1, perms: ['order', 'track', 'pod'], contract: false }
  };
  M.CROLE_ORDER = ['owner', 'director', 'gm', 'finance', 'opsmgr', 'supervisor', 'fo', 'viewonly'];
  M.SCOPES = { all: L('Semua Property', 'All Properties'), sel: L('Property Terpilih', 'Selected Properties'), single: L('Satu Property', 'Single Property') };
  M.CU_ST = { invited: [L('Diundang', 'Invited'), 'info'], active: [L('Aktif', 'Active'), 'ok'], suspended: [L('Nonaktif Sementara', 'Suspended'), 'warn'], inactive: [L('Tidak Aktif', 'Inactive'), 'crit'] };
  var X_ST = { invited: 'inactive', active: 'active', suspended: 'suspended', inactive: 'inactive' };

  /* ---------- Client statuses (§12): internal complexity collapsed into a few plain steps ---------- */
  M.CST = {
    requested: [L('Menunggu Konfirmasi', 'Awaiting Confirmation'), 'appr', 'clock', 0], sched: [L('Pickup Dijadwalkan', 'Pickup Scheduled'), 'info', 'calendar', 0],
    assigned: [L('Driver Ditugaskan', 'Driver Assigned'), 'info', 'user', 0], otw: [L('Dalam Perjalanan', 'On The Way'), 'info', 'truck', 0], arrived: [L('Driver Tiba', 'Driver Arrived'), 'info', 'pin', 0],
    process: [L('Dalam Proses', 'In Process'), 'ok', 'factory', 1], washing: [L('Dicuci', 'Washing'), 'ok', 'washer', 1], finishing: [L('Finishing & QC', 'Finishing & QC'), 'ok', 'shirt', 1],
    packing: [L('Packing', 'Packing'), 'ok', 'package', 2], ready: [L('Siap Dikirim', 'Ready to Deliver'), 'appr', 'package', 3],
    dassigned: [L('Driver Ditugaskan', 'Driver Assigned'), 'info', 'user', 3], dotw: [L('Dalam Pengiriman', 'Out for Delivery'), 'info', 'truck', 3], darrived: [L('Driver Tiba', 'Driver Arrived'), 'info', 'pin', 3],
    delivered: [L('Terkirim', 'Delivered'), 'ok', 'checkc', 4], done: [L('Selesai', 'Completed'), 'ok', 'checkc', 5],
    issue: [L('Ada Kendala', 'Issue'), 'crit', 'alert', -1], returned: [L('Dikembalikan ke Plant', 'Returned to Plant'), 'warn', 'arrowl', -1], cancelled: [L('Dibatalkan', 'Cancelled'), 'mute', 'xc', -1]
  };
  M.STEPS = [['pickup', L('Pickup', 'Pickup'), 'truck'], ['proc', L('Proses', 'Process'), 'washer'], ['pack', L('Packing', 'Packing'), 'package'], ['dlv', L('Delivery', 'Delivery'), 'truck'], ['done', L('Selesai', 'Complete'), 'flag']];
  var PRIO = ['issue', 'dotw', 'otw', 'darrived', 'arrived', 'dassigned', 'assigned', 'ready', 'packing', 'finishing', 'washing', 'process', 'sched', 'requested', 'delivered', 'returned', 'done', 'cancelled'];
  var WASH = ['wash_q', 'washing', 'dry_q', 'drying', 'fin_ready', 'ho23'], FINI = ['fin_q', 'finishing', 'qc_q'], PACK = ['pack_q', 'packed'], RTD = ['rtd', 'ho3l', 'handed'];
  function stageSt(stage) { if (!stage) return 'process'; if (WASH.indexOf(stage) >= 0) return 'washing'; if (FINI.indexOf(stage) >= 0) return 'finishing'; if (PACK.indexOf(stage) >= 0) return 'packing'; if (RTD.indexOf(stage) >= 0) return 'ready'; if (stage === 'hold') return 'process'; return 'process'; }

  /* ---------- Requests (§7–§10) and cases (§20–§23) ---------- */
  M.REQ_TYPES = { pickup: L('Pickup Baru', 'New Pickup'), extra: L('Extra Pickup', 'Extra Pickup'), reschedule: L('Reschedule', 'Reschedule'), cancel: L('Batalkan', 'Cancel'), schedule: L('Ubah Jadwal Rutin', 'Change Recurring Schedule') };
  M.REQ_ST = { submitted: [L('Terkirim', 'Submitted'), 'appr'], approved: [L('Disetujui', 'Approved'), 'info'], done: [L('Selesai', 'Done'), 'ok'], rejected: [L('Ditolak', 'Rejected'), 'crit'], cancelled: [L('Dibatalkan', 'Cancelled'), 'mute'] };
  M.CATS = {
    missing: [L('Barang Kurang', 'Missing Item'), 'box', 'high'], wrongqty: [L('Jumlah Tidak Sesuai', 'Wrong Quantity'), 'hash', 'normal'], stain: [L('Noda', 'Stain'), 'droplet', 'normal'],
    smell: [L('Bau', 'Smell'), 'wind', 'normal'], damage: [L('Rusak', 'Damage'), 'alert', 'high'], latepickup: [L('Pickup Terlambat', 'Late Pickup'), 'truck', 'normal'],
    latedelivery: [L('Delivery Terlambat', 'Late Delivery'), 'clock', 'normal'], invoice: [L('Masalah Invoice', 'Invoice Issue'), 'invoice', 'normal'], quality: [L('Kualitas Cucian', 'Quality Issue'), 'star', 'normal'],
    other: [L('Lainnya', 'Other'), 'message', 'low']
  };
  M.CATS.missing[1] = 'package';
  M.CASE_ST = {
    new: [L('Laporan Baru', 'New'), 'info'], assigned: [L('Ditugaskan', 'Assigned'), 'info'], review: [L('Dalam Proses', 'Under Review'), 'appr'], waiting: [L('Menunggu Anda', 'Waiting Client'), 'warn'],
    action: [L('Tindakan Diperlukan', 'Action Required'), 'crit'], resolved: [L('Selesai', 'Resolved'), 'ok'], closed: [L('Ditutup', 'Closed'), 'mute']
  };
  M.CASE_FLOW = { new: ['assigned', 'review', 'waiting', 'action', 'resolved', 'closed'], assigned: ['review', 'waiting', 'action', 'resolved', 'closed'], review: ['waiting', 'action', 'resolved', 'assigned'],
    waiting: ['review', 'action', 'resolved'], action: ['review', 'waiting', 'resolved'], resolved: ['closed', 'review'], closed: [] };
  M.PRI = { low: [L('Rendah', 'Low'), 'mute', 72], normal: [L('Normal', 'Normal'), 'info', 48], high: [L('Tinggi', 'High'), 'warn', 24], critical: [L('Kritis', 'Critical'), 'crit', 4] };
  M.DOC_TYPES = { pod: [L('POD', 'POD'), 'filecheck', 'pod'], dn: [L('Delivery Note', 'Delivery Note'), 'file', 'pod'], sc: [L('Service Completion', 'Service Completion'), 'checkc', 'pod'],
    ret: [L('Return Note', 'Return Note'), 'arrowl', 'pod'], inv: [L('Invoice', 'Invoice'), 'invoice', 'invoice'], stmt: [L('Statement of Account', 'Statement of Account'), 'coins', 'invoice'],
    res: [L('Resolusi Komplain', 'Complaint Resolution'), 'message', 'order'], contract: [L('Kontrak', 'Contract'), 'contract', null] };

  /* ---------- State ---------- */
  var KEY = 'jfos-clp-v1', mem = {}, st = null, SIM = ms(D.simNow), T0 = Date.now(), fixed = null;
  var ls = null;
  try { ls = root.localStorage || null; if (ls) { ls.setItem('__jfc', '1'); ls.removeItem('__jfc'); } } catch (e) { ls = null; }
  function clock() { if (fixed) return fixed(); if (LG && LG.now) return LG.now(); return SIM + (Date.now() - T0); }
  function S() {
    if (st) return st;
    try { var raw = ls ? ls.getItem(KEY) : mem[KEY]; if (raw) { var o = JSON.parse(raw); if (o && o.v === 1) { st = o; return st; } } } catch (e) {}
    seed(); save(); return st;
  }
  function save() { if (!st) return; try { var s = JSON.stringify(st); if (ls) ls.setItem(KEY, s); else mem[KEY] = s; } catch (e) {} }
  M._reset = function () { SIM = ms(D.simNow); T0 = Date.now(); seed(); save(); syncX(true); };
  M._setClock = function (fn) { fixed = fn; };
  M.now = function () { return clock(); };
  M.today = function () { return iso(M.now()); };
  M.nowS = function () { return isoT(M.now()); };
  M.state = function () { return S(); };
  M.save = save;
  function nid(k, pre, pad) { var n = S().seq[k]++; return pre + (pad ? String(n).padStart(pad, '0') : n); }

  function seed() {
    st = { v: 1, users: {}, cases: [], reqs: [], views: [], shares: [], notifs: [], reads: {}, sel: {}, audit: [], links: {}, seq: clone(D.SEQ) };
    D.USERS.forEach(function (u) { var r = clone(u); delete r.demo; r.hist = []; st.users[r.uid] = r; });
    st.reqs = D.REQUESTS.map(function (r) { var o = clone(r); o.log = o.log.map(function (x) { return { at: x[0], by: x[1], st: x[2], note: x[3] || null }; }); return o; });
    st.cases = D.CASES.map(function (c) {
      var o = clone(c), last = o.st; o.resAt = null; o.res = null; o.target = null;
      o.log = [{ at: o.at, by: o.by, kind: 'create', to: 'new', note: o.desc, client: true }].concat(o.log.map(function (x) { return { at: x[0], by: x[1], kind: 'status', to: x[2], note: x[3] || null, client: true }; }));
      o.log.forEach(function (x) { if (x.to === 'resolved') { o.resAt = x.at; o.res = x.note; } });
      if (o.fb) o.log.push({ at: o.fb.at, by: o.fb.by, kind: 'feedback', note: L('Rating ' + o.fb.r + '/5', 'Rating ' + o.fb.r + '/5'), client: true });
      o.target = isoT(ms(o.at) + M.PRI[o.pri][2] * HOUR); o.upd = o.log[o.log.length - 1].at; o.st = last;
      return o;
    });
    st.views = D.VIEWS.map(function (v) { return { kind: v[0], rec: v[1], uid: v[2], at: v[3] }; });
    linkCases(true);
  }

  /* ---------- Audit (§29, §77): who, what changed, before, after, reason, when, device, result ---------- */
  function device() { var ua = root.navigator && root.navigator.userAgent || 'node'; return /iPad|Tablet/i.test(ua) ? 'Tablet' : /Mobi|Android|iPhone/i.test(ua) ? 'Mobile' : (ua === 'node' ? 'Test' : 'Desktop'); }
  function empId(ctx) { return ctx && (ctx.employee ? ctx.employee.id : ctx.emp) || null; }
  function actorName(ctx) { return ctx && (ctx.fullName || ctx.name) || 'Sistem JFRESH'; }
  function can(ctx, p) { return !p || !!(ctx && ctx.perms && ctx.perms.indexOf(p) >= 0); }
  M.can = can;
  M.AUDIT = { 'ACCESS.DENIED': L('Akses ditolak', 'Access Denied'), 'CLIENT.USER_ADD': L('User klien ditambahkan', 'Client User Added'), 'CLIENT.ACCESS_EDIT': L('Akses user klien diubah', 'Client User Access Changed'),
    'CLIENT.USER_SUSPEND': L('User klien ditangguhkan', 'Client User Suspended'), 'CLIENT.USER_DEACTIVATE': L('User klien dinonaktifkan', 'Client User Deactivated'), 'CLIENT.USER_ACTIVATE': L('User klien diaktifkan', 'Client User Activated'),
    'CLIENT.INVITE_ACCEPT': L('Undangan diterima', 'Invitation Accepted'), 'REQUEST.CREATE': L('Permintaan dibuat', 'Request Created'), 'REQUEST.APPLY': L('Permintaan dijalankan', 'Request Applied'), 'REQUEST.APPROVE': L('Permintaan disetujui', 'Request Approved'),
    'REQUEST.REJECT': L('Permintaan ditolak', 'Request Rejected'), 'CASE.CREATE': L('Kasus dibuat', 'Case Created'), 'CASE.STATUS': L('Status kasus diubah', 'Case Status Changed'), 'CASE.ASSIGN': L('Kasus ditugaskan', 'Case Assigned'),
    'CASE.REPLY': L('Balasan klien', 'Client Reply'), 'CASE.FEEDBACK': L('Feedback kasus', 'Case Feedback'), 'DOC.VIEW': L('Dokumen dilihat', 'Document Viewed'), 'DOC.DOWNLOAD': L('Dokumen diunduh', 'Document Downloaded'),
    'DOC.SHARE': L('Dokumen dibagikan', 'Document Shared'), 'PROPERTY.SELECT': L('Property dipilih', 'Property Selected') };
  M.audit = function (ev, ctx, o) {
    o = o || {};
    var e = { id: 'AUD11-' + (S().audit.length ? +String(S().audit[0].id).split('-')[1] + 1 : 1), at: M.nowS(), ev: ev, uid: ctx && ctx.uid || null, emp: empId(ctx), actor: actorName(ctx), role: ctx && ctx.roleKey || null, module: 'CLP',
      cl: o.cl || (ctx && ctx.client) || null, rec: o.rec || null, before: o.before === undefined ? null : clone(o.before), after: o.after === undefined ? null : clone(o.after), reason: o.reason == null ? null : T(o.reason), result: o.result || 'ok', device: device() };
    S().audit.unshift(e); if (S().audit.length > 1500) S().audit.length = 1500; save();
    return e;
  };
  M.auditLog = function (f) { f = f || {}; return S().audit.filter(function (e) { return (!f.ev || e.ev.indexOf(f.ev) === 0) && (!f.rec || e.rec === f.rec) && (!f.cl || e.cl === f.cl) && (!f.uid || e.uid === f.uid) && (!f.result || e.result === f.result); }); };
  function deny(ctx, what, code) { M.audit('ACCESS.DENIED', ctx, { rec: what || null, result: 'denied', reason: code || 'noperm' }); return { ok: false, code: code === 'scope' ? 'scope' : 'noperm', msg: code === 'scope' ? M.MSG.scope : code === 'blocked' ? M.MSG.blocked : M.MSG.noperm }; }
  function bad(msg, code, x) { return Object.assign({ ok: false, code: code || 'invalid', msg: msg || M.MSG.invalid }, x || {}); }
  M.deny = deny; M.bad = bad;

  /* ---------- Lookups ---------- */
  M.client = function (id) { return CM && CM.client ? CM.client(id) : null; };
  M.clientName = function (id) { var c = M.client(id); return c ? c.n : id || '—'; };
  M.prop = function (id) { return CM && CM.prop ? CM.prop(id) : null; };
  M.propName = function (id) { var p = M.prop(id); return p ? p.n : id || '—'; };
  M.propsOfClient = function (cl) { return CM && CM.propsOf ? CM.propsOf(cl) : []; };
  M.svcName = function (id) { return id ? (CM && CM.svcName ? CM.svcName(id) : id) : '—'; };
  M.empName = function (id) { if (!id) return '—'; if (DL && DL.empName) { var n = DL.empName(id); if (n && n !== id) return n; } if (X && X.user && X.user(id)) return X.fullName(X.user(id)); var e = X && X.employee ? X.employee(id) : null; return e ? e.n : id; };
  M.first = function (id) { return String(M.empName(id)).split(' ')[0]; };
  function whoName(id) { if (!id) return '—'; var r = S().users[id]; if (r) return r.name; return M.empName(id); }
  M.whoName = whoName;

  /* ---------- Client users & scope (NP-06, §24–§29) ---------- */
  function rec(uid) { return uid ? S().users[uid] || null : null; }
  M.userRec = rec;
  function profile(r, cl) {
    var role = r ? r.role : 'gm', base = (M.CROLES[role] || M.CROLES.viewonly).perms, scope = r ? r.scope : 'all';
    var all = M.propsOfClient(cl).map(function (p) { return p.id; });
    var props = scope === 'all' ? all : (r.props || []).filter(function (p) { return all.indexOf(p) >= 0; });
    var list = uniq(base.concat(r ? r.grant || [] : [])).filter(function (k) { return !(r && (r.deny || []).indexOf(k) >= 0) && M.CP[k]; });
    var perms = {}; M.CP_KEYS.forEach(function (k) { perms[k] = list.indexOf(k) >= 0; });
    return { role: role, scope: scope, props: props, perms: perms, implicit: !r };
  }
  // Is this client user allowed in right now? (status §27 and access window)
  function accessCheck(r) {
    if (!r) return { ok: true };
    var t = M.today();
    if (r.st === 'suspended') return { ok: false, code: 'suspended', why: 'suspended' };
    if (r.st === 'inactive') return { ok: false, code: 'inactive', why: 'inactive' };
    if (r.st === 'invited') return { ok: false, code: 'inactive', why: 'invited' };
    if (r.start && r.start > t) return { ok: false, code: 'inactive', why: 'notstarted' };
    if (r.end && r.end < t) return { ok: false, code: 'inactive', why: 'expired' };
    return { ok: true };
  }
  M.accessCheck = function (uid) { return accessCheck(rec(uid)); };
  /* scope(ctx): the single source of client isolation. Client → own client, scoped properties and the client permissions.
     Staff → no client filter (their own role permissions decide). A blocked client user gets blocked:true and is refused everywhere. */
  M.scope = function (ctx) {
    if (!ctx) return null;
    if (ctx.client) {
      var r = rec(ctx.uid);
      if (r && r.cl !== ctx.client) return { client: true, blocked: true, cl: ctx.client, props: [], perms: {}, why: 'client' };
      var chk = accessCheck(r), p = profile(r, ctx.client);
      var sel = S().sel[ctx.uid];
      if (!sel || (sel !== 'all' && p.props.indexOf(sel) < 0)) sel = p.props.length === 1 ? p.props[0] : 'all';
      return { client: true, cl: ctx.client, uid: ctx.uid, role: p.role, roleName: (M.CROLES[p.role] || M.CROLES.viewonly).n, scope: p.scope, props: chk.ok ? p.props : [], perms: chk.ok ? p.perms : {}, sel: sel,
        contract: !!(M.CROLES[p.role] || {}).contract, implicit: p.implicit, blocked: !chk.ok, why: chk.why || null };
    }
    return { client: false, staff: true, cl: null, props: null, perms: {}, view: can(ctx, 'clp.view'), manage: can(ctx, 'clp.case.manage'), approve: can(ctx, 'lg.dispatch') };
  };
  function gate(ctx, perm, what) {
    var s = M.scope(ctx);
    if (!s) return { e: deny(ctx, what) };
    if (s.blocked) return { e: deny(ctx, what, 'blocked') };
    if (s.client && perm && !s.perms[perm]) return { e: deny(ctx, what) };
    return { s: s };
  }
  function inScope(s, prop, cl) { if (!s) return false; if (!s.client) return true; if (cl && cl !== s.cl) return false; return s.props.indexOf(prop) >= 0; }
  M.inScope = function (ctx, prop) { return inScope(M.scope(ctx), prop); };
  // Properties a query covers: an explicit property (checked), 'all', or the remembered selection.
  function propsFor(s, prop) {
    if (!s.client) return prop && prop !== 'all' ? [prop] : null;
    if (prop && prop !== 'all') return s.props.indexOf(prop) >= 0 ? [prop] : [];
    if (prop === 'all') return s.props.slice();
    return s.sel === 'all' ? s.props.slice() : [s.sel];
  }
  function okProp(list, prop) { return !list || list.indexOf(prop) >= 0; }
  M.props = function (ctx) { var s = M.scope(ctx); if (!s || !s.client || s.blocked) return []; return s.props.map(function (id) { var p = M.prop(id); return { id: id, n: p ? p.n : id, city: p ? p.city : '', addr: p ? p.addr : '' }; }); };
  M.setProp = function (ctx, prop) {
    var g = gate(ctx, null, prop); if (g.e) return g.e; var s = g.s;
    if (!s.client) return bad();
    if (prop !== 'all' && s.props.indexOf(prop) < 0) return deny(ctx, prop, 'scope');
    S().sel[ctx.uid] = prop; save();
    return { ok: true, sel: prop };
  };
  M.selProp = function (ctx) { var s = M.scope(ctx); return s && s.client ? s.sel : null; };

  /* ---------- Jobs: one client-facing row per service in motion (pickup → process → packing → delivery → complete) ---------- */
  function lgOrders(cl) { return LG && LG.state ? LG.state().orders.filter(function (o) { return o.cl === cl && o.st !== 'draft'; }) : []; }
  function batches(cl) { return PR && PR.state ? PR.state().batches.filter(function (b) { return b.cl === cl && b.stage !== 'merged'; }) : []; }
  function dlvs(cl) { if (!DL || !DL.state) return []; try { DL.sync(); } catch (e) {} return DL.state().dlv.filter(function (d) { return d.cl === cl; }); }
  function batchOrders(b) { var out = (b.ords || []).slice(); (b.rcvs || []).forEach(function (r) { var x = PR.rcv(r); if (x && x.ord) out.push(x.ord); }); return uniq(out); }
  function stepRows(step, at) {
    return M.STEPS.map(function (s, i) { return { k: s[0], l: s[1], i: s[2], st: step >= 5 || i < step ? 'done' : i === step ? 'cur' : 'todo', at: at[s[0]] || null }; });
  }
  function etaOf(o) { if (!o || !LG || !LG.eta) return null; var e = null; try { e = LG.eta(o); } catch (x) { e = null; } if (!e || e.at == null) return null; return { at: hm(e.at), min: e.min, late: !!e.late, delay: e.delay || 0, live: !!e.live, near: !!e.near }; }
  function mkRow(o) {
    var c = M.CST[o.st] || M.CST.process, step = c[3] < 0 ? (o.step == null ? 0 : o.step) : c[3];
    var row = { id: o.id, kind: o.kind, cl: o.cl, prop: o.prop, propName: M.propName(o.prop), svc: o.svc || null, svcName: M.svcName(o.svc), date: o.date, win: o.win || null, bags: o.bags == null ? null : o.bags,
      kg: o.kg == null ? null : o.kg, pcs: o.pcs == null ? null : o.pcs, st: o.st, label: c[0], tone: c[1], icon: c[2], step: step, steps: stepRows(step, o.at || {}), eta: o.eta || null,
      ord: o.ord || null, batch: o.batch || null, dlv: o.dlv || null, pod: o.pod || null, req: o.req || null, src: o.src || null, upd: o.upd || null, active: true,
      link: { s: o.kind === 'process' ? 'CLP-006' : 'CLP-005', rec: o.id } };
    return row;
  }
  function reqOfOrd(ordId) { var r = S().reqs.filter(function (x) { return x.ord === ordId && (x.type === 'pickup' || x.type === 'extra'); })[0]; return r ? r.id : null; }
  function buildJobs(cl, list) {
    if (!cl) return [];
    var today = M.today(), rows = [], ords = lgOrders(cl), bs = batches(cl), ds = dlvs(cl);
    var ordBatch = {}, batchDlv = {}, dlvOrd = {};
    bs.forEach(function (b) { batchOrders(b).forEach(function (oid) { ordBatch[oid] = ordBatch[oid] || []; ordBatch[oid].push(b); }); });
    ds.forEach(function (d) { if (d.batch) batchDlv[d.batch] = d; if (d.ord) dlvOrd[d.ord] = d; });
    function pickAt(o) { return o ? LG.evAt(o, 'completed') : null; }
    function procAt(b) { if (!b) return null; var r0 = b.rcvs && b.rcvs[0] ? PR.rcv(b.rcvs[0]) : null; return (b.runs && b.runs[0] && b.runs[0].start) || (r0 && r0.rcvAt) || (b.created && b.created[0]) || null; }
    function packAt(b) { return b && b.pack ? b.pack.at : null; }
    // 1. Pickup orders
    ords.filter(function (o) { return o.kind === 'pickup'; }).forEach(function (o) {
      if (!okProp(list, o.prop)) return;
      var bl = ordBatch[o.id]; if (bl && bl.length) return;   // the batch row carries this pickup
      var s0 = o.st, x = { requested: 'requested', scheduled: 'sched', assigned: 'assigned', ready: 'assigned', ontheway: 'otw', arrived: 'arrived', inprogress: 'arrived', completed: 'process', atplant: 'process', received: 'process', issue: 'issue', cancelled: 'cancelled' }[s0] || 'sched';
      var row = mkRow({ id: o.id, kind: 'pickup', cl: cl, prop: o.prop, svc: o.svc, date: o.date, win: o.win, bags: o.exec && o.exec.bags != null ? o.exec.bags : o.bags, kg: o.kg, st: x, ord: o.id, src: o.src,
        at: { pickup: pickAt(o) }, eta: ['assigned', 'otw', 'arrived'].indexOf(x) >= 0 ? etaOf(o) : null, req: reqOfOrd(o.id), upd: (o.ev[o.ev.length - 1] || [])[1] || o.at, step: 0 });
      if (x === 'process' && o.date < addDays(today, -1)) { row.st = 'done'; row.label = M.CST.done[0]; row.tone = 'ok'; row.icon = 'checkc'; row.step = 5; row.steps = stepRows(5, {}); row.active = false; }
      if (x === 'cancelled') row.active = false;
      rows.push(row);
    });
    // 2. Batches in production (not yet carried by a delivery)
    bs.forEach(function (b) {
      if (!okProp(list, b.prop) || batchDlv[b.id] || (b.dlv && LG.order(b.dlv))) return;
      var po = batchOrders(b).map(function (id) { return LG.order(id); }).filter(Boolean)[0] || null, x = stageSt(b.stage);
      rows.push(mkRow({ id: b.id, kind: 'process', cl: cl, prop: b.prop, svc: (po && po.svc) || null, date: (b.created && String(b.created[0]).slice(0, 10)) || today, kg: b.kg, pcs: b.pcs, st: x, ord: po ? po.id : null, batch: b.id,
        at: { pickup: pickAt(po), proc: procAt(b), pack: packAt(b) }, upd: (b.ev && b.ev.length ? b.ev[b.ev.length - 1][1] : null) }));
    });
    // 3. Delivery orders without a Phase 9 delivery record: production still decides when the linen is not ready yet
    ords.filter(function (o) { return o.kind === 'delivery' && !dlvOrd[o.id]; }).forEach(function (o) {
      if (!okProp(list, o.prop)) return;
      var linked = bs.filter(function (b) { return b.dlv === o.id; }), notReady = linked.filter(function (b) { return RTD.indexOf(b.stage) < 0; });
      var x = { requested: 'ready', scheduled: 'ready', assigned: 'dassigned', ready: 'dassigned', ontheway: 'dotw', arrived: 'darrived', inprogress: 'darrived', completed: 'delivered', atplant: 'delivered', received: 'delivered', issue: 'issue', cancelled: 'cancelled' }[o.st] || 'ready';
      if (notReady.length && ['ready', 'dassigned'].indexOf(x) >= 0) x = notReady.map(function (b) { return stageSt(b.stage); }).sort(function (a, b) { return M.CST[a][3] - M.CST[b][3]; })[0];
      var b0 = linked[0] || null, po = b0 ? batchOrders(b0).map(function (id) { return LG.order(id); }).filter(Boolean)[0] : null;
      var row = mkRow({ id: o.id, kind: 'delivery', cl: cl, prop: o.prop, svc: o.svc, date: o.date, win: o.win, bags: o.bags, kg: o.kg || (b0 ? sum(linked.map(function (b) { return b.kg; })) : null), pcs: b0 ? sum(linked.map(function (b) { return b.pcs || 0; })) || null : null,
        st: x, ord: o.id, batch: b0 ? b0.id : null, at: { pickup: pickAt(po), proc: procAt(b0), pack: packAt(b0), dlv: LG.evAt(o, 'ontheway'), done: LG.evAt(o, 'completed') }, eta: ['dassigned', 'dotw', 'darrived'].indexOf(x) >= 0 ? etaOf(o) : null, upd: (o.ev[o.ev.length - 1] || [])[1] || o.at });
      if (x === 'delivered' && o.date < today) row.active = false;
      if (x === 'cancelled') row.active = false;
      rows.push(row);
    });
    // 4. Phase 9 deliveries
    ds.forEach(function (d) {
      if (!okProp(list, d.prop) || d.st === 'cancelled' && !d.pod) return;
      var s0 = DL.status(d), x = { waiting: 'ready', assigned: 'dassigned', ready: 'dassigned', ontheway: 'dotw', near: 'dotw', arrived: 'darrived', handover: 'darrived', delivered: 'delivered', completed: 'done', issue: 'issue', returned: 'returned', cancelled: 'cancelled' }[s0] || 'ready';
      var o = d.ord ? LG.order(d.ord) : null, b = d.batch && PR ? PR.batch(d.batch) : null, po = b ? batchOrders(b).map(function (id) { return LG.order(id); }).filter(Boolean)[0] : null;
      var evAt = function (k) { for (var i = d.ev.length - 1; i >= 0; i--) if (d.ev[i][0] === k) return d.ev[i][1]; return null; };
      var row = mkRow({ id: d.id, kind: 'delivery', cl: cl, prop: d.prop, svc: d.svc, date: d.date, win: d.win, bags: d.pkgs, kg: d.kg, pcs: d.qty, st: x, ord: d.ord || null, batch: d.batch || null, dlv: d.id, pod: d.pod ? d.pod.id : null,
        at: { pickup: pickAt(po), proc: procAt(b), pack: packAt(b) || (d.created && d.created[0]) || null, dlv: evAt('ontheway'), done: d.pod ? d.pod.at : null }, eta: ['dassigned', 'dotw', 'darrived'].indexOf(x) >= 0 ? etaOf(o) : null,
        upd: (d.ev[d.ev.length - 1] || [])[1] || null, step: d.pod ? 4 : 3 });
      if (['done', 'returned', 'cancelled'].indexOf(x) >= 0 || (x === 'delivered' && d.date < today) || (x === 'issue' && d.pod && d.date < today)) row.active = false;
      rows.push(row);
    });
    return rows.sort(function (a, b) { return (b.active - a.active) || PRIO.indexOf(a.st) - PRIO.indexOf(b.st) || String(b.date).localeCompare(String(a.date)) || String(a.id).localeCompare(String(b.id)); });
  }
  M._jobs = buildJobs;
  function jobsCtx(ctx, prop) { var s = M.scope(ctx); if (!s || s.blocked) return { s: s, rows: [] }; if (!s.client) return { s: s, rows: [] }; return { s: s, rows: buildJobs(s.cl, propsFor(s, prop)) }; }
  M.active = function (ctx, prop) {
    var g = gate(ctx, 'order', 'ACTIVE'); if (g.e) return [];
    return jobsCtx(ctx, prop).rows.filter(function (r) { return r.active; });
  };
  M.job = function (ctx, id) {
    var g = gate(ctx, 'order', id); if (g.e) return null; var s = g.s; if (!s.client) return null;
    var all = buildJobs(s.cl, null), r = by(all, 'id', id) || all.filter(function (x) { return x.ord === id || x.dlv === id || x.batch === id || x.pod === id; })[0];
    if (!r) { if (ownerOfRecord(id) && ownerOfRecord(id) !== s.cl) deny(ctx, id, 'scope'); return null; }
    if (s.props.indexOf(r.prop) < 0) { deny(ctx, id, 'scope'); return null; }
    return r;
  };

  /* ---------- NP-01 Home (§3–§5) ---------- */
  M.greeting = function (t) {
    var h = new Date(t == null ? M.now() : t).getUTCHours(), m = new Date(t == null ? M.now() : t).getUTCMinutes(), x = h * 60 + m;
    if (x >= 240 && x < 660) return { k: 'pagi', l: L('Selamat Pagi', 'Good Morning') };
    if (x >= 660 && x < 900) return { k: 'siang', l: L('Selamat Siang', 'Good Afternoon') };
    if (x >= 900 && x < 1110) return { k: 'sore', l: L('Selamat Sore', 'Good Evening') };
    return { k: 'malam', l: L('Selamat Malam', 'Good Night') };
  };
  M.home = function (ctx, prop) {
    var g = gate(ctx, null, 'HOME'); if (g.e) return null; var s = g.s; if (!s.client) return null;
    var list = propsFor(s, prop), c = M.client(s.cl), today = M.today(), gr = M.greeting(), rows = s.perms.order ? buildJobs(s.cl, list) : [];
    var name = list.length === 1 && s.props.length === 1 ? M.propName(list[0]) : c ? c.n : s.cl;
    var pickToday = lgOrders(s.cl).filter(function (o) { return o.kind === 'pickup' && o.date === today && o.st !== 'cancelled' && okProp(list, o.prop); });
    var otw = rows.filter(function (r) { return r.active && r.kind === 'delivery' && ['dotw', 'darrived'].indexOf(r.st) >= 0; });
    var open = casesOf(s, list).filter(function (x) { return ['resolved', 'closed'].indexOf(x.st) < 0; });
    var inv = s.perms.invoice ? invList(s, list).filter(function (iv) { return ['issued', 'partial', 'overdue'].indexOf(iv.st) >= 0; }) : null;
    var act = [];
    list.forEach(function (p) {
      var r = rows.filter(function (x) { return x.prop === p && x.active; })[0];
      if (r) act.push(Object.assign({}, r, { line: actLine(r) }));
    });
    var unread = 0; try { unread = X && X.unread ? X.unread(ctx) : 0; } catch (e) { unread = 0; }
    function Q(k, l, i, sc, perm) { var on = !perm || !!s.perms[perm]; return { k: k, l: l, i: i, s: sc, on: on }; }
    return {
      greet: gr.l, part: gr.k, name: name, title: L(T(gr.l) + ', ' + name, E(gr.l) + ', ' + name), user: ctx.fullName || ctx.name, client: { id: s.cl, n: c ? c.n : s.cl, group: !!(c && c.group) },
      props: M.props(ctx), sel: s.sel, scope: s.scope, role: s.role, roleName: s.roleName, unread: unread,
      cards: {
        pickupToday: { n: pickToday.length, l: L('Pickup Hari Ini', 'Pickups Today'), i: 'truck', link: { s: 'CLP-006', q: { tab: 'active' } } },
        deliveryOnTheWay: { n: otw.length, l: L('Delivery Dalam Perjalanan', 'Deliveries On The Way'), i: 'truck', link: { s: 'CLP-005' } },
        openIssues: { n: open.length, l: L('Issue Terbuka', 'Open Issues'), i: 'alert', link: { s: 'CLP-010' } },
        outstandingInvoice: inv ? { amt: sum(inv.map(function (iv) { return iv.open; })), count: inv.length, l: L('Outstanding Invoice', 'Outstanding Invoice'), i: 'invoice', link: { s: 'CLP-008' } } : null
      },
      quick: [Q('pickup', L('Buat Pickup', 'Create Pickup'), 'plus', 'CLP-003', 'pickup'), Q('track', L('Track Delivery', 'Track Delivery'), 'pin', 'CLP-005', 'track'), Q('invoice', L('Lihat Invoice', 'View Invoice'), 'invoice', 'CLP-008', 'invoice'),
        Q('issue', L('Laporkan Masalah', 'Report a Problem'), 'alert', 'CLP-011', 'complaint')].filter(function (q) { return q.on; }),
      activity: act, activeCount: rows.filter(function (r) { return r.active; }).length,
      empty: rows.filter(function (r) { return r.active; }).length ? null : M.MSG.emptyActive
    };
  };
  function actLine(r) {
    var k = r.kind === 'delivery' ? L('Delivery', 'Delivery') : r.kind === 'pickup' ? L('Pickup', 'Pickup') : L('Produksi', 'Production');
    var t = r.eta && r.eta.at ? L('ETA ' + r.eta.at, 'ETA ' + r.eta.at) : r.win ? L(r.win[0], r.win[0]) : null;
    return t ? L(T(k) + ' • ' + T(t), E(k) + ' • ' + E(t)) : k;
  }

  /* ---------- NP-03 Tracking, history, search (§11–§15) ---------- */
  M.track = function (ctx, id) {
    var g = gate(ctx, 'track', id); if (g.e) return null; var s = g.s; if (!s.client) return null;
    var r = M.job(ctx, id); if (!r) return null;
    var o = r.ord ? LG.order(r.ord) : null, d = r.dlv ? DL.dlv(r.dlv) : null, tr = null;
    if (r.kind === 'delivery' && o && o.kind !== 'delivery') o = null;
    if (o && LG.clientTrack) { try { tr = LG.clientTrack(ctx, o.id); } catch (e) { tr = null; } }
    var dv = null; if (d && DL.clientView && can(ctx, 'dlv.track.own')) { try { dv = DL.clientView(ctx, d.id); } catch (e) { dv = null; } }
    var t = tr || (dv && dv.track) || null;
    logView(ctx, 'track', r.id);
    var pos = t && t.pos ? { x: t.pos.pos ? t.pos.pos[0] : null, y: t.pos.pos ? t.pos.pos[1] : null, at: t.pos.at ? isoT(t.pos.at) : null, fresh: t.pos.fresh || null } : null;
    return { row: r, live: !!(t && t.live), pos: pos, dest: t ? t.dest : (LG && LG.loc ? LG.loc(r.prop) : null), plant: LG ? LG.PLANT : null, driver: t ? t.driver : null, plate: t ? t.plate : null,
      eta: r.eta, lastUpdate: pos && pos.at ? pos.at : r.upd, ended: r.step >= 4,
      chat: o && LG.canChat && LG.canChat(ctx, o) ? { s: 'CHAT-001', rec: o.id } : null, contact: { l: L('Hubungi JFRESH', 'Contact JFRESH'), phone: '+62 361 900 100', wa: '+62 811 3900 100' },
      pod: r.pod && s.perms.pod ? podSummary(d) : null };
  };
  function podSummary(d) { if (!d || !d.pod) return null; var p = DL.podView(d.pod); return { id: p.id, recv: p.recv, role: p.role || null, at: p.at, pkgs: p.pkgs, qty: p.qty, kg: p.kg, cond: p.cond, sign: !!p.sign, photo: !!p.photo }; }
  M.trackStats = function (ctx, prop) {
    var g = gate(ctx, 'order', 'TRACKSTATS'); if (g.e) return null; var s = g.s; if (!s.client) return null;
    var list = propsFor(s, prop), rows = buildJobs(s.cl, list), m = M.today().slice(0, 7);
    var sla = CM && CM.slaPerf ? CM.slaPerf(s.cl) : null, rs = sla ? sla.rows.filter(function (x) { return okProp(list, x.prop); }) : [];
    var on = sum(rs.map(function (x) { return x.on; })), n = sum(rs.map(function (x) { return x.n; }));
    var dl = dlvs(s.cl).filter(function (d) { return okProp(list, d.prop) && d.sla && d.sla.st && d.sla.st !== 'pending'; });
    var ot = n + dl.length ? pct(on + dl.filter(function (d) { return d.sla.st === 'ontime'; }).length, n + dl.length) : null;
    return { active: rows.filter(function (r) { return r.active; }).length, doneMonth: rows.filter(function (r) { return !r.active && r.st !== 'cancelled' && String(r.date).slice(0, 7) === m; }).length + (sla ? 0 : 0),
      slaDone: n, ontime: ot, attention: rows.filter(function (r) { return r.active && (r.st === 'issue' || (r.eta && r.eta.late)); }).length + casesOf(s, list).filter(function (c) { return c.st === 'waiting'; }).length };
  };
  /* History (§15): filters property, date range, service, status; search order / POD / invoice / document. */
  M.history = function (ctx, f) {
    f = f || {};
    var g = gate(ctx, 'order', 'HISTORY'); if (g.e) return []; var s = g.s; if (!s.client) return [];
    var list = propsFor(s, f.prop), q = String(f.q || '').trim().toLowerCase();
    return buildJobs(s.cl, list).filter(function (r) {
      if (f.active === true && !r.active) return false; if (f.active !== true && f.all !== true && r.active) return false;
      if (f.from && r.date < f.from) return false; if (f.to && r.date > f.to) return false;
      if (f.svc && r.svc !== f.svc) return false;
      if (f.st && (f.st === 'done' ? ['done', 'delivered'].indexOf(r.st) < 0 : f.st === 'issue' ? ['issue', 'returned'].indexOf(r.st) < 0 : r.st !== f.st)) return false;
      if (q && [r.id, r.ord, r.dlv, r.batch, r.pod, r.req, r.propName, T(r.svcName)].join(' ').toLowerCase().indexOf(q) < 0) return false;
      return true;
    }).sort(function (a, b) { return String(b.date).localeCompare(String(a.date)) || String(b.id).localeCompare(String(a.id)); });
  };
  M.search = function (ctx, q) {
    var g = gate(ctx, null, 'SEARCH'); if (g.e) return { orders: [], docs: [], invoices: [] }; var s = g.s; if (!s.client) return { orders: [], docs: [], invoices: [] };
    q = String(q || '').trim(); if (!q) return { orders: [], docs: [], invoices: [] };
    return { orders: s.perms.order ? M.history(ctx, { q: q, prop: 'all', all: true }) : [], docs: M.docs(ctx, { q: q, prop: 'all' }), invoices: s.perms.invoice ? M.invoices(ctx, { q: q, prop: 'all' }) : [] };
  };

  /* ---------- NP-02 Self-service: pickup, extra, reschedule, cancel (§7–§10) ---------- */
  var SVC = { uid: 'SYS-CLP', name: 'Client Portal Service', fullName: 'Client Portal Service', roleKey: 'system', perms: [] };
  function svcCtx() { if (!SVC.perms.length) SVC.perms = Object.keys((LG && LG.PERMS) || {}).concat(Object.keys((DL && DL.PERMS) || {})); return SVC; }
  M.WINDOWS = [['07:00', '08:00'], ['08:00', '09:00'], ['09:00', '10:00'], ['10:00', '11:00'], ['13:00', '14:00'], ['14:00', '15:00'], ['16:00', '17:00'], ['17:00', '18:00']];
  function dayLabel(days) {
    var D0 = LG && LG.DAYS ? LG.DAYS : [];
    if (days.length === 7) return L('Setiap hari', 'Every day');
    if (days.length === 6 && days.indexOf(0) < 0) return L('Senin – Sabtu', 'Monday – Saturday');
    if (days.length === 5 && days.indexOf(0) < 0 && days.indexOf(6) < 0) return L('Senin – Jumat', 'Monday – Friday');
    return L(days.map(function (d) { return T(D0[d]); }).join(', '), days.map(function (d) { return E(D0[d]); }).join(', '));
  }
  function addMin(h, n) { var t = ms('2026-01-01 ' + h) + n * MIN; return hm(t); }
  function schRow(sc) {
    var pick = sc.pick, am = pick < '12:00';
    return { id: sc.id, prop: sc.prop, propName: M.propName(sc.prop), svc: sc.svc, svcName: M.svcName(sc.svc), days: sc.days.slice(), daysLabel: dayLabel(sc.days), pick: pick, pickWin: [pick, addMin(pick, 60)],
      pickLabel: am ? L('Pickup Pagi', 'Morning Pickup') : L('Pickup Sore', 'Afternoon Pickup'), del: sc.del, delWin: sc.del ? [sc.del, addMin(sc.del, 60)] : null, freq: sc.freq, active: !!sc.active, paused: sc.paused || null,
      bags: sc.bags, kg: sc.kg, contract: sc.ctr || null, note: sc.note || null, skips: (sc.skips || []).slice(), extra: (sc.extra || []).map(function (x) { return { date: x.date, pick: x.pick }; }) };
  }
  /* Recurring service (§9) — internal read of the Phase 7 schedules, filtered by client and property scope. */
  M.schedules = function (ctx, prop) {
    var g = gate(ctx, 'order', 'SCHEDULE'); if (g.e) return []; var s = g.s; if (!s.client) return [];
    var list = propsFor(s, prop);
    return (LG && LG.state ? LG.state().schedules : []).filter(function (sc) { return sc.cl === s.cl && !sc.next && !sc.cancelled && okProp(list, sc.prop); }).map(schRow)
      .sort(function (a, b) { return a.propName.localeCompare(b.propName) || a.pick.localeCompare(b.pick); });
  };
  M.pickupOptions = function (ctx, prop) {
    var g = gate(ctx, 'pickup', 'PICKUP'); if (g.e) return null; var s = g.s; if (!s.client) return null;
    var p = prop && prop !== 'all' ? prop : (s.sel !== 'all' ? s.sel : s.props[0]);
    if (s.props.indexOf(p) < 0) { deny(ctx, p, 'scope'); return null; }
    var svcs = (CM && CM.svcConfig ? CM.svcConfig(p) : []).filter(function (x) { return x.active !== false; }).map(function (x) { var sv = CM.service(x.svc) || {}; return { svc: x.svc, n: sv.n || x.svc, unit: sv.unit || 'kg', sla: x.sla || sv.sla || null, express: !!x.express || x.svc === 'SV-002' || x.svc === 'SV-003', desc: sv.desc || null }; });
    var ct = CM && CM.contacts ? null : null, me = rec(ctx.uid), pr = M.prop(p);
    return { props: M.props(ctx), prop: p, svcs: svcs, windows: M.WINDOWS.map(function (w) { return w.slice(); }), minDate: M.today(), schedules: M.schedules(ctx, p),
      defaults: { prop: p, svc: svcs[0] ? svcs[0].svc : null, date: M.today(), win: null, bags: null, kg: null, pcs: null, pic: me ? me.name : ctx.fullName || ctx.name, phone: me ? me.phone : '', notes: '', instr: pr && pr.instr ? T(pr.instr) : '' },
      info: [L('Pastikan linen sudah dikemas rapi sesuai kategori.', 'Make sure the linen is packed neatly by category.'), L('Driver akan menghubungi Anda sebelum tiba.', 'The driver will contact you before arriving.'), L('Untuk permintaan mendesak, hubungi tim kami.', 'For urgent requests, contact our team.')] };
  };
  /* Step validation for the 3-step form (§8): 1 Detail · 2 Schedule · 3 Confirmation. Returns { ok, errors{field: msg} }. */
  M.validatePickup = function (ctx, step, f) {
    f = f || {}; var e = {}, s = M.scope(ctx), today = M.today();
    if (step >= 1) {
      if (!f.prop || !s || !inScope(s, f.prop)) e.prop = L('Pilih property.', 'Choose a property.');
      if (!f.svc || !(CM && CM.service(f.svc))) e.svc = L('Pilih layanan.', 'Choose a service.');
      var bags = +f.bags; if (!(bags >= 1 && bags <= 99)) e.bags = L('Isi perkiraan jumlah bag (1–99).', 'Enter the estimated bags (1–99).');
      if (f.kg !== '' && f.kg != null && !(+f.kg >= 0 && +f.kg <= 2000)) e.kg = L('Perkiraan berat tidak valid.', 'Estimated weight is not valid.');
      if (f.pcs !== '' && f.pcs != null && !(+f.pcs >= 0 && +f.pcs <= 20000)) e.pcs = L('Perkiraan pcs tidak valid.', 'Estimated pieces are not valid.');
      if (!str(f.pic)) e.pic = L('Isi nama PIC di lokasi.', 'Enter the on-site PIC name.');
      if (!/^\+?[0-9 ()-]{8,20}$/.test(String(f.phone || '').trim())) e.phone = L('Isi nomor telepon yang valid.', 'Enter a valid phone number.');
      if (String(f.notes || '').length > 500) e.notes = L('Catatan maksimal 500 karakter.', 'Notes can be at most 500 characters.');
      if (String(f.instr || '').length > 500) e.instr = L('Instruksi maksimal 500 karakter.', 'Instructions can be at most 500 characters.');
    }
    if (step >= 2) {
      if (!f.date || !/^\d{4}-\d{2}-\d{2}$/.test(f.date) || f.date < today) e.date = L('Tanggal tidak boleh di masa lalu.', 'The date cannot be in the past.');
      var w = f.win || [];
      if (!/^\d{2}:\d{2}$/.test(w[0] || '') || !/^\d{2}:\d{2}$/.test(w[1] || '') || w[0] >= w[1]) e.win = L('Pilih jendela waktu pickup.', 'Choose a pickup window.');
      else if (f.date === today && ms(f.date + ' ' + w[1]) <= M.now()) e.win = L('Jam yang dipilih sudah lewat.', 'The chosen time has already passed.');
    }
    return { ok: !Object.keys(e).length, errors: e };
  };
  function newReq(ctx, s, type, prop, fields, extra) {
    var t = M.now(), r = Object.assign({ id: nid('req', 'REQ-' + iso(t).slice(2, 4) + iso(t).slice(5, 7) + '-', 3), at: isoT(t), by: ctx.uid, cl: s.cl, prop: prop, type: type, st: 'submitted', ord: null, sch: null, fields: fields,
      log: [{ at: isoT(t), by: ctx.uid, st: 'submitted', note: null }] }, extra || {});
    S().reqs.unshift(r); return r;
  }
  function reqLog(r, by, stt, note) { r.st = stt; r.log.push({ at: M.nowS(), by: by, st: stt, note: note == null ? null : note }); }
  /* Create pickup / extra pickup (§7–§8): a real Phase 7 order (source Client App) carrying the Request ID. */
  M.requestPickup = function (ctx, f, opt) {
    f = f || {}; opt = opt || {};
    var g = gate(ctx, 'pickup', f.prop || 'PICKUP'); if (g.e) return g.e; var s = g.s;
    if (!s.client) return deny(ctx, 'PICKUP');
    if (f.prop && s.props.indexOf(f.prop) < 0) return deny(ctx, f.prop, 'scope');
    var v = M.validatePickup(ctx, 2, f); if (!v.ok) return bad(M.MSG.invalid, 'invalid', { errors: v.errors });
    var type = f.type === 'extra' ? 'extra' : 'pickup', sch = null;
    if (type === 'extra') { sch = f.sch && LG.schedule(f.sch); if (!sch || sch.cl !== s.cl || sch.prop !== f.prop) return bad(L('Pilih jadwal rutin property ini.', 'Choose a recurring schedule of this property.'), 'invalid', { errors: { sch: L('Pilih jadwal rutin.', 'Choose a recurring schedule.') } }); }
    var instr = [str(f.instr), str(f.notes) ? T(L('Catatan: ', 'Notes: ')) + str(f.notes) : '', 'PIC: ' + str(f.pic) + ' · ' + String(f.phone).trim(), f.pcs ? T(L('Estimasi ', 'Estimated ')) + (+f.pcs) + ' pcs' : ''].filter(Boolean).join(' · ');
    var r = LG.createOrder(ctx, { prop: f.prop, svc: f.svc, date: f.date, win: [f.win[0], f.win[1]], bags: +f.bags, kg: f.kg === '' || f.kg == null ? null : +f.kg, instr: instr, cat: f.cat, pri: f.svc === 'SV-002' || f.svc === 'SV-003' ? 'express' : 'normal' }, { force: !!opt.force, reason: opt.reason });
    if (!r.ok) {
      if (r.code === 'dup') return bad(M.MSG.dup, 'dup', { dup: (r.dup || []).map(function (x) { return { id: x.o.id, date: x.o.date, win: x.o.win, st: x.o.st, src: x.o.src }; }) });
      return r.code === 'noperm' ? deny(ctx, f.prop) : r;
    }
    var o = r.order;
    var fields = { svc: f.svc, date: f.date, win: [f.win[0], f.win[1]], bags: +f.bags, kg: o.kg, pcs: f.pcs ? +f.pcs : null, pic: str(f.pic), phone: String(f.phone).trim(), notes: str(f.notes), instr: str(f.instr) };
    var q = newReq(ctx, s, type, f.prop, fields, { ord: o.id, sch: sch ? sch.id : null });
    o.req = q.id; o.pcs = fields.pcs; o.pic = fields.pic; o.picPhone = fields.phone; if (sch) { o.sch = sch.id; o.extra = true; } LG.save();
    M.audit('REQUEST.CREATE', ctx, { rec: q.id, after: { type: type, ord: o.id, prop: f.prop, date: f.date, win: f.win.join('–'), bags: +f.bags }, reason: opt.reason || null });
    notify({ cl: s.cl, prop: f.prop, kind: 'req.sent', rec: q.id, perm: 'order' });
    notify({ staff: 'lg.dispatch', kind: 'req.new', rec: q.id, cl: s.cl, prop: f.prop });
    save();
    return { ok: true, request: q, order: o, dupConfirmed: (r.dup || []).length > 0 };
  };
  M.extraPickup = function (ctx, f, opt) { return M.requestPickup(ctx, Object.assign({}, f, { type: 'extra' }), opt); };
  function early(o) { return ['requested', 'scheduled'].indexOf(o.st) >= 0; }
  function ordInScope(ctx, s, id) { var o = LG.order(id); if (!o) return { e: bad(M.MSG.notfound, 'notfound') }; if (o.cl !== s.cl) return { e: deny(ctx, id, 'scope') }; if (s.props.indexOf(o.prop) < 0) return { e: deny(ctx, id, 'scope') }; return { o: o }; }
  /* Reschedule (§7, §9): an early, client-created order is moved at once (through Phase 7, service context, after the
     scope and permission checks here). A running order or an occurrence of the contracted schedule waits for operations. */
  M.requestReschedule = function (ctx, ordId, f) {
    f = f || {};
    var g = gate(ctx, 'pickup', ordId); if (g.e) return g.e; var s = g.s; if (!s.client) return deny(ctx, ordId);
    var x = ordInScope(ctx, s, ordId); if (x.e) return x.e; var o = x.o;
    if (o.kind !== 'pickup' || ['completed', 'atplant', 'received', 'cancelled'].indexOf(o.st) >= 0) return bad(L('Pesanan ini sudah tidak bisa dijadwalkan ulang.', 'This order can no longer be rescheduled.'), 'jump');
    if (!str(f.reason)) return bad(M.MSG.reason, 'reason');
    var v = M.validatePickup(ctx, 2, { prop: o.prop, svc: o.svc, bags: o.bags, pic: 'x', phone: '00000000', date: f.date, win: f.win });
    if (v.errors.date || v.errors.win) return bad(M.MSG.invalid, 'invalid', { errors: { date: v.errors.date, win: v.errors.win } });
    if (S().reqs.some(function (r) { return r.ord === ordId && r.st === 'submitted' && (r.type === 'reschedule' || r.type === 'cancel'); })) return bad(L('Sudah ada permintaan yang menunggu untuk pesanan ini.', 'There is already a pending request for this order.'), 'dup');
    var q = newReq(ctx, s, 'reschedule', o.prop, { date: f.date, win: [f.win[0], f.win[1]], reason: str(f.reason), from: o.date + ' ' + o.win.join('–') }, { ord: o.id, sch: o.sch || null });
    var auto = early(o) && !o.sch;
    if (auto) {
      var r = LG.reschedule(svcCtx(), o.id, f.date, f.win, T(L('Permintaan klien ', 'Client request ')) + q.id + ': ' + str(f.reason));
      if (!r.ok) { S().reqs.shift(); return r; }
      reqLog(q, 'SYS-CLP', 'done', L('Dijadwalkan ulang otomatis (pesanan belum berjalan).', 'Rescheduled automatically (order not started).'));
      M.audit('REQUEST.APPLY', ctx, { rec: q.id, before: { ord: o.id, slot: q.fields.from }, after: { slot: f.date + ' ' + f.win.join('–') }, reason: f.reason });
    } else {
      M.audit('REQUEST.CREATE', ctx, { rec: q.id, before: { ord: o.id, slot: q.fields.from }, after: { slot: f.date + ' ' + f.win.join('–'), wait: 'ops' }, reason: f.reason });
      notify({ staff: 'lg.dispatch', kind: 'req.new', rec: q.id, cl: s.cl, prop: o.prop });
    }
    notify({ cl: s.cl, prop: o.prop, kind: auto ? 'req.done' : 'req.sent', rec: q.id, perm: 'order' });
    save();
    return { ok: true, request: q, applied: auto, pending: !auto };
  };
  M.requestCancel = function (ctx, ordId, f) {
    f = f || {};
    var g = gate(ctx, 'pickup', ordId); if (g.e) return g.e; var s = g.s; if (!s.client) return deny(ctx, ordId);
    var x = ordInScope(ctx, s, ordId); if (x.e) return x.e; var o = x.o;
    if (o.kind !== 'pickup' || ['ontheway', 'arrived', 'inprogress', 'completed', 'atplant', 'received', 'cancelled'].indexOf(o.st) >= 0) return bad(L('Pickup yang sudah berjalan tidak bisa dibatalkan. Hubungi tim kami.', 'A pickup already under way cannot be cancelled. Contact our team.'), 'jump');
    if (!str(f.reason)) return bad(M.MSG.reason, 'reason');
    if (S().reqs.some(function (r) { return r.ord === ordId && r.st === 'submitted' && (r.type === 'reschedule' || r.type === 'cancel'); })) return bad(L('Sudah ada permintaan yang menunggu untuk pesanan ini.', 'There is already a pending request for this order.'), 'dup');
    var q = newReq(ctx, s, 'cancel', o.prop, { reason: str(f.reason), from: o.st }, { ord: o.id, sch: o.sch || null });
    var auto = early(o) && !o.sch;
    if (auto) {
      var r = LG.setStatus(svcCtx(), o.id, 'cancelled', { reason: T(L('Dibatalkan klien ', 'Cancelled by the client ')) + q.id + ': ' + str(f.reason) });
      if (!r.ok) { S().reqs.shift(); return r; }
      reqLog(q, 'SYS-CLP', 'done', L('Dibatalkan otomatis (pesanan belum berjalan).', 'Cancelled automatically (order not started).'));
      M.audit('REQUEST.APPLY', ctx, { rec: q.id, before: { ord: o.id, st: q.fields.from }, after: { st: 'cancelled' }, reason: f.reason });
    } else {
      M.audit('REQUEST.CREATE', ctx, { rec: q.id, before: { ord: o.id, st: o.st }, after: { st: 'cancel requested', wait: 'ops' }, reason: f.reason });
      notify({ staff: 'lg.dispatch', kind: 'req.new', rec: q.id, cl: s.cl, prop: o.prop });
    }
    notify({ cl: s.cl, prop: o.prop, kind: auto ? 'req.done' : 'req.sent', rec: q.id, perm: 'order' });
    save();
    return { ok: true, request: q, applied: auto, pending: !auto };
  };
  /* Change to the contracted recurring schedule (§9): always waits for operations approval. act skip | reschedule | pause. */
  M.requestScheduleChange = function (ctx, schId, f) {
    f = f || {};
    var g = gate(ctx, 'pickup', schId); if (g.e) return g.e; var s = g.s; if (!s.client) return deny(ctx, schId);
    var sc = LG.schedule(schId); if (!sc) return bad(M.MSG.notfound, 'notfound');
    if (sc.cl !== s.cl || s.props.indexOf(sc.prop) < 0) return deny(ctx, schId, 'scope');
    if (['skip', 'reschedule', 'pause'].indexOf(f.act) < 0) return bad();
    if (!str(f.reason)) return bad(M.MSG.reason, 'reason');
    if (f.act === 'skip' && (!f.date || f.date < M.today())) return bad(M.MSG.invalid, 'invalid', { errors: { date: L('Pilih tanggal.', 'Choose a date.') } });
    if (f.act === 'reschedule' && (!f.from || !f.to || f.to < M.today())) return bad(M.MSG.invalid, 'invalid', { errors: { date: L('Pilih tanggal asal dan tanggal baru.', 'Choose the original and the new date.') } });
    var q = newReq(ctx, s, 'schedule', sc.prop, { act: f.act, date: f.date || null, from: f.from || null, to: f.to || null, pick: f.pick || null, reason: str(f.reason) }, { sch: sc.id });
    M.audit('REQUEST.CREATE', ctx, { rec: q.id, before: { sch: sc.id, pick: sc.pick, days: sc.days.join(',') }, after: { act: f.act, date: f.date || f.to || null, wait: 'ops' }, reason: f.reason });
    notify({ staff: 'lg.dispatch', kind: 'req.new', rec: q.id, cl: s.cl, prop: sc.prop });
    notify({ cl: s.cl, prop: sc.prop, kind: 'req.sent', rec: q.id, perm: 'order' });
    save();
    return { ok: true, request: q, pending: true };
  };
  function reqView(r) {
    var o = r.ord && LG ? LG.order(r.ord) : null, stt = r.st;
    if ((r.type === 'pickup' || r.type === 'extra') && o && stt === 'submitted') { if (o.st === 'cancelled') stt = 'cancelled'; else if (['completed', 'atplant', 'received'].indexOf(o.st) >= 0) stt = 'done'; else if (o.st !== 'requested') stt = 'approved'; }
    if ((r.type === 'pickup' || r.type === 'extra') && o && stt === 'approved' && ['completed', 'atplant', 'received'].indexOf(o.st) >= 0) stt = 'done';
    return Object.assign({}, r, { stLive: stt, stLabel: M.REQ_ST[stt][0], tone: M.REQ_ST[stt][1], typeLabel: M.REQ_TYPES[r.type], propName: M.propName(r.prop), byName: whoName(r.by), ordSt: o ? o.st : null, link: { s: 'CLP-004', rec: r.id } });
  }
  M.requests = function (ctx, f) {
    f = f || {};
    var g = gate(ctx, 'order', 'REQUESTS'); if (g.e) return []; var s = g.s;
    if (!s.client && !(s.view || s.approve)) return [];
    var list = s.client ? propsFor(s, f.prop) : (f.prop ? [f.prop] : null);
    return S().reqs.filter(function (r) { return (!s.client || r.cl === s.cl) && okProp(list, r.prop) && (!f.cl || r.cl === f.cl) && (!f.type || r.type === f.type); }).map(reqView)
      .filter(function (r) { return !f.st || (f.st === 'pending' ? r.st === 'submitted' && r.stLive === 'submitted' : r.stLive === f.st); })
      .sort(function (a, b) { return ((b.stLive === 'submitted') - (a.stLive === 'submitted')) || b.at.localeCompare(a.at); });
  };
  M.request = function (ctx, id) {
    var g = gate(ctx, 'order', id); if (g.e) return null; var s = g.s, r = by(S().reqs, 'id', id); if (!r) return null;
    if (s.client && (r.cl !== s.cl || s.props.indexOf(r.prop) < 0)) { deny(ctx, id, 'scope'); return null; }
    if (!s.client && !(s.view || s.approve)) { deny(ctx, id); return null; }
    var v = reqView(r); v.order = r.ord ? (function () { var o = LG.order(r.ord); return o ? { id: o.id, st: o.st, stLabel: LG.stLabel(o), date: o.date, win: o.win, svc: o.svc, svcName: M.svcName(o.svc), bags: o.bags, kg: o.kg } : null; })() : null;
    v.timeline = r.log.map(function (x) { return { at: x.at, st: x.st, label: (M.REQ_ST[x.st] || [L(x.st, x.st)])[0], by: s.client && !/^USR-/.test(x.by) ? L('Tim JFRESH', 'JFRESH team') : L(whoName(x.by), whoName(x.by)), note: x.note }; });
    return v;
  };
  /* Operations approval (staff with lg.dispatch): applies the waiting request through Phase 7. */
  M.approveRequest = function (ctx, id, note) {
    var r = by(S().reqs, 'id', id); if (!r) return bad(M.MSG.notfound, 'notfound');
    if (ctx && ctx.client) return deny(ctx, id);
    if (!can(ctx, 'lg.dispatch')) return deny(ctx, id);
    if (r.st !== 'submitted' || ['reschedule', 'cancel', 'schedule'].indexOf(r.type) < 0) return bad(M.MSG.jump, 'jump');
    var res, F = r.fields;
    if (r.type === 'reschedule') res = LG.reschedule(svcCtx(), r.ord, F.date, F.win, T(L('Disetujui ', 'Approved ')) + r.id + ': ' + T(F.reason));
    else if (r.type === 'cancel') res = LG.setStatus(svcCtx(), r.ord, 'cancelled', { reason: T(L('Disetujui ', 'Approved ')) + r.id + ': ' + T(F.reason) });
    else res = LG.scheduleAction(svcCtx(), r.sch, F.act, { date: F.date, from: F.from, to: F.to, pick: F.pick, reason: r.id + ': ' + T(F.reason) });
    if (!res || !res.ok) return res || bad();
    reqLog(r, empId(ctx) || ctx.uid, 'approved', note || null); reqLog(r, empId(ctx) || ctx.uid, 'done', null);
    M.audit('REQUEST.APPROVE', ctx, { rec: id, cl: r.cl, before: { st: 'submitted' }, after: { st: 'done', type: r.type }, reason: note || null });
    notify({ cl: r.cl, prop: r.prop, kind: 'req.done', rec: id, perm: 'order' });
    save();
    return { ok: true, request: reqView(r) };
  };
  M.rejectRequest = function (ctx, id, reason) {
    var r = by(S().reqs, 'id', id); if (!r) return bad(M.MSG.notfound, 'notfound');
    if (ctx && ctx.client) return deny(ctx, id);
    if (!can(ctx, 'lg.dispatch')) return deny(ctx, id);
    if (r.st !== 'submitted') return bad(M.MSG.jump, 'jump');
    if (!str(reason)) return bad(M.MSG.reason, 'reason');
    reqLog(r, empId(ctx) || ctx.uid, 'rejected', reason);
    M.audit('REQUEST.REJECT', ctx, { rec: id, cl: r.cl, before: { st: 'submitted' }, after: { st: 'rejected' }, reason: reason });
    notify({ cl: r.cl, prop: r.prop, kind: 'req.rejected', rec: id, perm: 'order' });
    save();
    return { ok: true, request: reqView(r) };
  };
  M.pendingRequests = function (ctx) { return M.requests(ctx, { st: 'pending' }); };

  /* ---------- NP-03 Document center (§14) ---------- */
  function invVisible(s, iv, list) {
    if (!iv || iv.cl !== s.cl) return false;
    var st0 = FN.invSt(iv); if (['issued', 'partial', 'paid', 'overdue'].indexOf(st0) < 0) return false;
    var ps = (iv.props && iv.props.length ? iv.props : [iv.prop]).filter(Boolean);
    if (s.client && ps.some(function (p) { return s.props.indexOf(p) < 0; })) return false;   // never show amounts of a property outside scope
    if (list && !ps.some(function (p) { return list.indexOf(p) >= 0; })) return false;
    return true;
  }
  function docList(s, list) {
    var out = [], cl = s.cl;
    function add(d) { d.typeLabel = M.DOC_TYPES[d.type][0]; d.icon = M.DOC_TYPES[d.type][1]; d.propName = d.prop ? M.propName(d.prop) : M.clientName(cl); out.push(d); }
    if (s.perms.pod) {
      dlvs(cl).filter(function (d) { return okProp(list, d.prop) && d.prop && s.props.indexOf(d.prop) >= 0; }).forEach(function (d) {
        if (d.pod) add({ id: d.pod.id, type: 'pod', n: L('POD ' + d.pod.id, 'POD ' + d.pod.id), ref: d.id, ord: d.ord || d.oref || null, prop: d.prop, date: String(d.pod.at).slice(0, 10), at: d.pod.at, share: true });
        if (d.pod || ['delivered', 'completed'].indexOf(d.st) >= 0) add({ id: 'DN-' + d.id.slice(4), type: 'dn', n: L('Delivery Note ' + d.id, 'Delivery Note ' + d.id), ref: d.id, ord: d.ord || d.oref || null, prop: d.prop, date: d.date, at: d.date + ' ' + d.win[0], share: true });
        if (d.comp) add({ id: 'SC-' + d.id.slice(4), type: 'sc', n: L('Service Completion ' + d.id, 'Service Completion ' + d.id), ref: d.id, prop: d.prop, date: String(d.comp.at).slice(0, 10), at: d.comp.at, share: true });
      });
      (DL && DL.state ? DL.state().rets : []).filter(function (r) { return r.cl === cl && okProp(list, r.prop) && s.props.indexOf(r.prop) >= 0; }).forEach(function (r) {
        add({ id: r.id, type: 'ret', n: L('Return Note ' + r.id, 'Return Note ' + r.id), ref: r.dlv, prop: r.prop, date: String(r.at || r.created || M.today()).slice(0, 10), at: r.at || null, share: false });
      });
    }
    if (s.perms.invoice && FN) {
      FN.state().inv.filter(function (iv) { return invVisible(s, iv, list); }).forEach(function (iv) { add({ id: iv.id, type: 'inv', n: L('Invoice ' + iv.id, 'Invoice ' + iv.id), ref: iv.id, prop: iv.prop, date: iv.issued, at: iv.issued, share: true }); });
      if (s.perms.payment && s.scope === 'all') { var m0 = M.today().slice(0, 7), m1 = iso(ms(m0 + '-01') - DAY).slice(0, 7);
        [m0, m1].forEach(function (m) { add({ id: 'SOA-' + cl.slice(3) + '-' + m.replace('-', ''), type: 'stmt', n: L('Statement of Account ' + T(MONTHS_F[+m.slice(5) - 1]) + ' ' + m.slice(0, 4), 'Statement of Account ' + E(MONTHS_F[+m.slice(5) - 1]) + ' ' + m.slice(0, 4)), ref: m, prop: null, date: m === m0 ? M.today() : iso(ms(m0 + '-01') - DAY), at: null, share: true }); }); }
    }
    if (s.perms.order) casesOf(s, list).filter(function (c) { return c.res && ['resolved', 'closed'].indexOf(c.st) >= 0; }).forEach(function (c) {
      add({ id: 'RES-' + c.id.slice(5), type: 'res', n: L('Resolusi ' + c.id, 'Resolution ' + c.id), ref: c.id, prop: c.prop, date: String(c.resAt || c.upd).slice(0, 10), at: c.resAt, share: false });
    });
    if (s.contract && CM && CM.state) {
      CM.state().docs.filter(function (d) { return d.cl === cl && d.share && d.type === 'contract' && d.status !== 'superseded' && (d.prop ? s.props.indexOf(d.prop) >= 0 && okProp(list, d.prop) : s.scope === 'all'); }).forEach(function (d) {
        add({ id: d.id, type: 'contract', n: L(d.n, d.n), ref: d.ctr || null, prop: d.prop || null, date: d.date, at: d.date, share: false, file: d.file, v: d.v, status: d.status });
      });
    }
    return out.sort(function (a, b) { return String(b.date).localeCompare(String(a.date)) || String(a.id).localeCompare(String(b.id)); });
  }
  M.docs = function (ctx, f) {
    f = f || {};
    var g = gate(ctx, null, 'DOCS'); if (g.e) return []; var s = g.s; if (!s.client) return [];
    var q = String(f.q || '').trim().toLowerCase();
    return docList(s, propsFor(s, f.prop)).filter(function (d) { return (!f.type || d.type === f.type) && (!f.ref || d.ref === f.ref) && (!q || [d.id, d.ref, d.ord, T(d.n), d.propName].join(' ').toLowerCase().indexOf(q) >= 0); });
  };
  M.docsFor = function (ctx, jobId) { var r = M.job(ctx, jobId); if (!r) return []; return M.docs(ctx, { prop: 'all' }).filter(function (d) { return d.ref === r.dlv || d.ref === r.id || d.id === r.pod || (r.ord && d.ord === r.ord); }); };
  function fullPerms() { var o = {}; M.CP_KEYS.forEach(function (k) { o[k] = true; }); return o; }
  function docOf(ctx, id) { var g = gate(ctx, null, id); if (g.e) return { e: g.e }; var s = g.s; if (!s.client) return { e: deny(ctx, id) }; var d = by(docList(s, null), 'id', id); if (!d) { var own = ownerOfRecord(id), wide = Object.assign({}, s, { props: M.propsOfClient(s.cl).map(function (p) { return p.id; }), perms: fullPerms() }); return { e: (own && own !== s.cl) || by(docList(wide, null), 'id', id) ? deny(ctx, id, 'scope') : bad(M.MSG.notfound, 'notfound') }; } return { s: s, d: d }; }
  function logView(ctx, kind, recId) { if (!ctx || !ctx.client) return; var t = M.nowS(), v = S().views, last = v.filter(function (x) { return x.uid === ctx.uid && x.rec === recId && x.kind === kind; })[0]; if (last && ms(t) - ms(last.at) < 10 * MIN) return; v.unshift({ kind: kind, rec: recId, uid: ctx.uid, at: t }); if (v.length > 2000) v.length = 2000; save(); }
  M.views = function (f) { f = f || {}; return S().views.filter(function (v) { return (!f.kind || v.kind === f.kind) && (!f.rec || v.rec === f.rec); }); };
  /* Printable document (view / download): a plain HTML page and a text version, generated from the source records. */
  function render(s, d) {
    var rows = [], title = T(d.n), sub = M.clientName(s.cl) + (d.prop ? ' · ' + M.propName(d.prop) : '');
    function R(k, v) { rows.push([T(k), v == null || v === '' ? '—' : String(v)]); }
    var dl = d.type === 'pod' || d.type === 'dn' || d.type === 'sc' ? DL.dlv(d.ref) : null;
    if (d.type === 'pod') { var p = DL.podView(dl.pod); R(L('Nomor POD', 'POD number'), p.id); R(L('Delivery', 'Delivery'), dl.id); R(L('Penerima', 'Recipient'), p.recv + (p.role ? ' · ' + p.role : '')); R(L('Waktu terima', 'Received at'), p.at); R(L('Jumlah paket', 'Packages'), p.pkgs); R(L('Jumlah item', 'Items'), p.qty); R(L('Berat', 'Weight'), p.kg + ' kg'); R(L('Kondisi', 'Condition'), T((DL.COND[p.cond] || [L(p.cond, p.cond)])[0])); R(L('Catatan', 'Notes'), T(p.notes)); R(L('Tanda tangan', 'Signature'), p.sign ? T(L('Ada', 'Captured')) : '—'); }
    else if (d.type === 'dn') { R(L('Delivery', 'Delivery'), dl.id); R(L('Tanggal', 'Date'), dl.date + ' ' + dl.win.join('–')); R(L('Layanan', 'Service'), T(M.svcName(dl.svc))); R(L('Paket', 'Packages'), dl.pkgs); R(L('Item', 'Items'), dl.qty); R(L('Berat', 'Weight'), dl.kg + ' kg'); R(L('Status', 'Status'), T(DL.DLV_ST[DL.status(dl)][0])); }
    else if (d.type === 'sc') { var cd = dl.comp.data || {}; R(L('Delivery', 'Delivery'), dl.id); R(L('Selesai pada', 'Completed at'), dl.comp.at); R(L('Qty final', 'Final quantity'), cd.qty); R(L('Berat final', 'Final weight'), cd.kg != null ? cd.kg + ' kg' : '—'); R(L('Versi', 'Version'), dl.comp.ver); }
    else if (d.type === 'ret') { var rt = DL.ret(d.id); R(L('Return', 'Return'), rt.id); R(L('Delivery', 'Delivery'), rt.dlv); R(L('Alasan', 'Reason'), T(rt.note)); R(L('Qty', 'Quantity'), rt.qty); R(L('Status', 'Status'), T((DL.RET_ST[rt.st] || [L(rt.st, rt.st)])[0])); }
    else if (d.type === 'inv') { var iv = FN.invoice(d.id); R(L('Invoice', 'Invoice'), iv.id); R(L('Periode', 'Period'), T(periodLabel(iv.period))); R(L('Terbit', 'Issued'), iv.issued); R(L('Jatuh tempo', 'Due'), iv.due);
      iv.lines.forEach(function (l) { R(l.svc ? M.svcName(l.svc) : l.desc, l.qty + ' ' + l.unit + ' × ' + rp(l.rate) + ' = ' + rp(l.amt)); }); R(L('Subtotal', 'Subtotal'), rp(iv.sub)); R(L('Diskon', 'Discount'), rp(iv.disc)); R(L('Pajak', 'Tax'), rp(iv.tax)); R(L('Total', 'Total'), rp(iv.total)); R(L('Dibayar', 'Paid'), rp(FN.paidOf(iv))); R(L('Sisa', 'Outstanding'), rp(FN.openOf(iv))); }
    else if (d.type === 'stmt') { var m = d.ref, sa = statementCore(s, m + '-01', m === M.today().slice(0, 7) ? M.today() : iso(ms(m + '-01') + 40 * DAY).slice(0, 8) + '01', null); R(L('Saldo awal', 'Opening balance'), rp(sa.opening)); sa.rows.forEach(function (x) { R(x.date + ' ' + x.ref, (x.debit ? rp(x.debit) : '') + (x.credit ? ' / ' + rp(x.credit) : '') + ' → ' + rp(x.bal)); }); R(L('Saldo akhir', 'Closing balance'), rp(sa.closing)); }
    else if (d.type === 'res') { var c = by(S().cases, 'id', d.ref); R(L('Kasus', 'Case'), c.id); R(L('Kategori', 'Category'), T(M.CATS[c.cat][0])); R(L('Laporan', 'Report'), T(c.desc)); R(L('Resolusi', 'Resolution'), T(c.res)); R(L('Diselesaikan', 'Resolved at'), c.resAt); }
    else if (d.type === 'contract') { R(L('Dokumen', 'Document'), T(d.n)); R(L('Kontrak', 'Contract'), d.ref); R(L('Versi', 'Version'), d.v); R(L('File', 'File'), d.file); }
    var html = '<!doctype html><html lang="id"><head><meta charset="utf-8"><title>' + esc(title) + '</title><style>body{font:14px/1.5 Inter,system-ui,sans-serif;color:#0B2545;margin:32px}h1{font-size:20px;margin:0 0 4px}p{color:#5B6B82;margin:0 0 16px}table{border-collapse:collapse;width:100%}td{border-bottom:1px solid #E3EAF4;padding:6px 8px;vertical-align:top}td:first-child{color:#5B6B82;width:38%}footer{margin-top:24px;font-size:12px;color:#5B6B82}</style></head><body>' +
      '<h1>' + esc(title) + '</h1><p>' + esc(sub) + '</p><table>' + rows.map(function (r) { return '<tr><td>' + esc(r[0]) + '</td><td>' + esc(r[1]) + '</td></tr>'; }).join('') + '</table>' +
      '<footer>J\'Fresh Laundry · JFRESH OS · ' + esc(M.nowS()) + '</footer></body></html>';
    var text = title + '\n' + sub + '\n' + rows.map(function (r) { return r[0] + ': ' + r[1]; }).join('\n');
    return { title: title, sub: sub, rows: rows, html: html, text: text, file: (d.file || d.id + '.html') };
  }
  M.viewDoc = function (ctx, id) {
    var x = docOf(ctx, id); if (x.e) return x.e;
    var need = M.DOC_TYPES[x.d.type][2]; if (need && !x.s.perms[need]) return deny(ctx, id);
    logView(ctx, x.d.type, id);
    M.audit('DOC.VIEW', ctx, { rec: id });
    return Object.assign({ ok: true, doc: x.d }, render(x.s, x.d));
  };
  M.downloadDoc = function (ctx, id) {
    var x = docOf(ctx, id); if (x.e) return x.e;
    var need = M.DOC_TYPES[x.d.type][2]; if (need && !x.s.perms[need]) return deny(ctx, id);
    var r = render(x.s, x.d); logView(ctx, x.d.type, id);
    M.audit('DOC.DOWNLOAD', ctx, { rec: id });
    return { ok: true, doc: x.d, name: x.d.file && /\.pdf$/.test(x.d.file) ? x.d.file.replace(/\.pdf$/, '.html') : x.d.id + '.html', mime: 'text/html', body: r.html, text: r.text };
  };
  var SHARE_ROLES = ['owner', 'director', 'gm', 'finance', 'opsmgr'];
  M.canShare = function (ctx, id) { var x = docOf(ctx, id); return !x.e && x.d.share && SHARE_ROLES.indexOf(x.s.role) >= 0; };
  M.shareDoc = function (ctx, id, f) {
    f = f || {};
    var x = docOf(ctx, id); if (x.e) return x.e;
    if (!x.d.share || SHARE_ROLES.indexOf(x.s.role) < 0) return deny(ctx, id);
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(String(f.to || '').trim())) return bad(L('Isi email penerima yang valid.', 'Enter a valid recipient email.'), 'invalid', { errors: { to: L('Email tidak valid.', 'Invalid email.') } });
    var sh = { id: nid('shr', 'SHR-', 4), doc: id, to: String(f.to).trim(), note: str(f.note), by: ctx.uid, cl: x.s.cl, at: M.nowS(), exp: isoT(M.now() + 7 * DAY) };
    S().shares.unshift(sh);
    M.audit('DOC.SHARE', ctx, { rec: id, after: { to: sh.to, exp: sh.exp } }); save();
    return { ok: true, share: sh };
  };

  /* ---------- NP-04 Billing (§16–§19): read only — there is no client edit function for anything financial ---------- */
  function invRow(iv, s) {
    var st0 = FN.invSt(iv), paid = FN.paidOf(iv), pays = FN.paymentsOf(iv.id).filter(function (p) { return !p.void; });
    var kg = sum(iv.lines.filter(function (l) { return l.unit === 'kg'; }).map(function (l) { return l.qty; })), svcs = uniq(iv.lines.map(function (l) { return l.svc; }));
    var lastPay = pays.length ? pays[pays.length - 1].date : null;
    return { id: iv.id, no: iv.id, cl: iv.cl, prop: iv.prop, props: iv.props || [iv.prop], propName: M.propName(iv.prop), period: iv.period, periodLabel: periodLabel(iv.period), monthLabel: iv.period ? L(T(MONTHS[+iv.period.slice(5) - 1]).toUpperCase() + ' ' + iv.period.slice(0, 4), E(MONTHS[+iv.period.slice(5) - 1]).toUpperCase() + ' ' + iv.period.slice(0, 4)) : null,
      issued: iv.issued, due: iv.due, amt: iv.total, total: iv.total, paid: s.perms.payment ? paid : null, open: iv.total - paid, st: st0, stLabel: M.INV_ST_CLIENT[st0][0], tone: M.INV_ST_CLIENT[st0][1],
      svcNames: svcs.length ? svcs.map(function (x) { return M.svcName(x); }) : [L('Layanan laundry', 'Laundry services')], kg: kg || null, paidAt: st0 === 'paid' && s.perms.payment ? lastPay : null,
      daysLate: st0 === 'overdue' ? Math.round((ms(M.today()) - ms(iv.due)) / DAY) : 0, link: { s: 'CLP-009', rec: iv.id } };
  }
  M.INV_ST_CLIENT = { issued: [L('Belum Dibayar', 'Unpaid'), 'warn'], partial: [L('Dibayar Sebagian', 'Partially Paid'), 'warn'], paid: [L('Lunas', 'Paid'), 'ok'], overdue: [L('Terlambat', 'Overdue'), 'crit'] };
  function invList(s, list) { if (!FN) return []; return FN.state().inv.filter(function (iv) { return invVisible(s, iv, list); }).map(function (iv) { return invRow(iv, s); }); }
  M.invoices = function (ctx, f) {
    f = f || {};
    var g = gate(ctx, 'invoice', 'INVOICES'); if (g.e) return []; var s = g.s; if (!s.client) return [];
    var q = String(f.q || '').trim().toLowerCase();
    return invList(s, propsFor(s, f.prop)).filter(function (r) {
      if (f.st === 'open' && ['issued', 'partial', 'overdue'].indexOf(r.st) < 0) return false;
      if (f.st && f.st !== 'open' && f.st !== 'all' && r.st !== f.st) return false;
      if (q && [r.id, r.propName, r.period].join(' ').toLowerCase().indexOf(q) < 0) return false;
      return true;
    }).sort(function (a, b) { return String(b.issued).localeCompare(String(a.issued)) || b.id.localeCompare(a.id); });
  };
  M.billing = function (ctx, prop) {
    var g = gate(ctx, 'invoice', 'BILLING'); if (g.e) return null; var s = g.s; if (!s.client) return null;
    var list = M.invoices(ctx, { prop: prop }), m = M.today().slice(0, 7);
    function agg(a, k) { return { amt: sum(a.map(function (r) { return r[k]; })), count: a.length }; }
    var open = list.filter(function (r) { return ['issued', 'partial', 'overdue'].indexOf(r.st) >= 0; });
    return { summary: { outstanding: agg(open, 'open'), dueMonth: agg(open.filter(function (r) { return r.due.slice(0, 7) === m && r.st !== 'overdue'; }), 'open'), overdue: agg(open.filter(function (r) { return r.st === 'overdue'; }), 'open'),
      paid: s.perms.payment ? agg(list.filter(function (r) { return r.st === 'paid'; }), 'total') : null }, list: list, canStatement: !!(s.perms.payment), empty: list.length ? null : M.MSG.emptyInv,
      contact: { l: L('Hubungi Finance', 'Contact Finance'), s: 'CLP-011', q: { cat: 'invoice' } } };
  };
  M.invoice = function (ctx, id) {
    var g = gate(ctx, 'invoice', id); if (g.e) return null; var s = g.s; if (!s.client) return null;
    var iv = FN.invoice(id);
    if (!iv || !invVisible(s, iv, null)) { if (iv && (iv.cl !== s.cl || (iv.props || [iv.prop]).some(function (p) { return s.props.indexOf(p) < 0; }))) deny(ctx, id, 'scope'); return null; }
    logView(ctx, 'inv', id);
    var row = invRow(iv, s), ctr = iv.ctr && CM && CM.contract ? CM.contract(iv.ctr) : null;
    var lines = iv.lines.map(function (l) { return { svc: l.svc, svcName: l.svc ? M.svcName(l.svc) : LL(l.desc), desc: LL(l.desc), qty: l.qty, unit: l.unit, rate: l.rate, amt: l.amt, date: l.date || null }; });
    // Supporting detail (§18): Billing Ready lines → deliveries; seeded invoices → the deliveries / orders of that property in the period.
    var brs = iv.lines.map(function (l) { return l.br; }).filter(Boolean).map(function (b) { return by(FN.state().br, 'id', b); }).filter(Boolean);
    var dl = uniq(brs.map(function (b) { return b.dlv; })).map(function (x) { return DL.dlv(x); }).filter(Boolean);
    if (!dl.length) dl = dlvs(s.cl).filter(function (d) { return d.prop === iv.prop && String(d.date).slice(0, 7) === iv.period; });
    var ords = uniq(brs.map(function (b) { return b.ord; }).concat(dl.map(function (d) { return d.ord; }))).map(function (x) { return LG.order(x); }).filter(Boolean);
    if (!ords.length) ords = lgOrders(s.cl).filter(function (o) { return o.prop === iv.prop && String(o.date).slice(0, 7) === iv.period; });
    return Object.assign(row, {
      no: iv.id, contract: ctr ? { no: ctr.no, v: ctr.v, terms: ctr.terms || iv.terms } : (iv.ctr ? { no: iv.ctr } : null), terms: iv.terms, po: iv.po || null, lines: lines,
      service: uniq(lines.map(function (l) { return T(l.svcName); })).join(', '), quantity: sum(lines.map(function (l) { return l.qty; })), unit: lines[0] ? lines[0].unit : null,
      subtotal: iv.sub, surcharge: iv.sur || 0, discount: iv.disc || 0, tax: iv.tax, taxPct: iv.sub ? Math.round(iv.tax / Math.max(1, iv.sub - (iv.disc || 0) + (iv.sur || 0)) * 100) : 0, totalAmt: iv.total,
      paidAmt: s.perms.payment ? FN.paidOf(iv) : null, outstanding: FN.openOf(iv),
      payments: s.perms.payment ? FN.paymentsOf(iv.id).filter(function (p) { return !p.void; }).map(function (p) { return { id: p.id, date: p.date, amt: p.amt, ref: p.ref || null }; }) : null,
      support: {
        orders: s.perms.order ? ords.map(function (o) { return { id: o.id, date: o.date, kind: o.kind, svc: o.svc, svcName: M.svcName(o.svc), bags: o.bags, kg: o.kg }; }) : [],
        usage: lines.map(function (l) { return { svcName: l.svcName, qty: l.qty, unit: l.unit, rate: l.rate, amt: l.amt }; }),
        pods: s.perms.pod ? dl.filter(function (d) { return d.pod; }).map(function (d) { return { id: d.pod.id, dlv: d.id, at: d.pod.at, recv: d.pod.recv }; }) : [],
        deliveries: s.perms.order ? dl.map(function (d) { return { id: d.id, date: d.date, st: DL.status(d), pkgs: d.pkgs, qty: d.qty, kg: d.kg }; }) : []
      },
      allowed: ['download', 'statement', 'support', 'contact'], notAllowed: [L('Ubah tarif', 'Edit rate'), L('Ubah pajak', 'Edit tax'), L('Ubah nilai invoice', 'Edit invoice amount'), L('Ubah kontrak', 'Edit contract')]
    });
  };
  function statementCore(s, from, to, list) {
    var invs = FN.state().inv.filter(function (iv) { return invVisible(s, iv, list); });
    var opening = 0, rows = [];
    invs.forEach(function (iv) {
      if (iv.issued < from) opening += iv.total; else if (iv.issued <= to) rows.push({ date: iv.issued, kind: 'inv', ref: iv.id, desc: L('Invoice ' + iv.id + ' · ' + M.propName(iv.prop), 'Invoice ' + iv.id + ' · ' + M.propName(iv.prop)), debit: iv.total, credit: 0 });
      FN.paymentsOf(iv.id).filter(function (p) { return !p.void; }).forEach(function (p) { if (p.date < from) opening -= p.amt; else if (p.date <= to) rows.push({ date: p.date, kind: 'pay', ref: p.id, desc: L('Pembayaran ' + iv.id, 'Payment ' + iv.id), debit: 0, credit: p.amt }); });
    });
    rows.sort(function (a, b) { return a.date.localeCompare(b.date) || (a.kind === 'inv' ? -1 : 1); });
    var bal = opening; rows.forEach(function (r) { bal += r.debit - r.credit; r.bal = bal; });
    return { opening: opening, rows: rows, closing: bal, invoiced: sum(rows.map(function (r) { return r.debit; })), paid: sum(rows.map(function (r) { return r.credit; })) };
  }
  /* Statement of account (§19) for a date range: opening, invoices, payments, running balance. Needs View Invoice + View Payment. */
  M.statement = function (ctx, f) {
    f = f || {};
    var g = gate(ctx, 'invoice', 'STATEMENT'); if (g.e) return g.e; var s = g.s; if (!s.client) return deny(ctx, 'STATEMENT');
    if (!s.perms.payment) return deny(ctx, 'STATEMENT');
    var to = f.to || M.today(), from = f.from || addDays(to, -90);
    if (from > to) return bad(L('Tanggal awal harus sebelum tanggal akhir.', 'The start date must be before the end date.'), 'invalid');
    var list = propsFor(s, f.prop), core = statementCore(s, from, to, list);
    M.audit('DOC.DOWNLOAD', ctx, { rec: 'SOA-' + s.cl.slice(3) + '-' + from.replace(/-/g, '') + '-' + to.replace(/-/g, '') });
    var c = M.client(s.cl);
    return Object.assign({ ok: true, cl: s.cl, client: c ? c.n : s.cl, legal: c ? c.legal : null, from: from, to: to, props: list.map(M.propName) }, core);
  };
  /* Contact Finance (§19): creates an Invoice Issue case for the finance team. */
  M.contactFinance = function (ctx, f) {
    f = f || {};
    var g = gate(ctx, 'invoice', f.inv || 'FINANCE'); if (g.e) return g.e; var s = g.s; if (!s.client) return deny(ctx, 'FINANCE');
    var iv = f.inv ? FN.invoice(f.inv) : null;
    if (f.inv && (!iv || !invVisible(s, iv, null))) return iv && iv.cl !== s.cl ? deny(ctx, f.inv, 'scope') : bad(M.MSG.notfound, 'notfound');
    if (!str(f.msg)) return bad(L('Tulis pertanyaan Anda.', 'Write your question.'), 'invalid', { errors: { msg: L('Wajib diisi.', 'Required.') } });
    return createCase(ctx, s, { cat: 'invoice', ref: f.inv || null, prop: iv ? iv.prop : (f.prop && s.props.indexOf(f.prop) >= 0 ? f.prop : (s.sel !== 'all' ? s.sel : s.props[0])), desc: f.msg, pri: 'normal', pic: f.pic || null }, true);
  };

  /* ---------- NP-05 Cases: complaints, issues & service requests (§20–§23) ---------- */
  var CMAP = { stain: 'stain', late: 'latedelivery', damage: 'damage', lost: 'missing', missing: 'missing', quality: 'quality', smell: 'smell', qty: 'wrongqty', wrongitem: 'wrongqty', reject: 'quality', other: 'other' };
  function linkCases(seeding) {
    var s = S(), added = 0;
    function link(src, id, o) {
      if (s.links[id]) {   // keep the status in step with the source record
        var c0 = by(s.cases, 'id', s.links[id]); if (c0 && o.done && ['resolved', 'closed'].indexOf(c0.st) < 0) { c0.log.push({ at: M.nowS(), by: 'SYS-CLP', kind: 'status', from: c0.st, to: 'resolved', note: L('Diselesaikan oleh tim JFRESH.', 'Resolved by the JFRESH team.'), client: true }); c0.st = 'resolved'; c0.resAt = M.nowS(); c0.res = c0.res || L('Diselesaikan oleh tim JFRESH.', 'Resolved by the JFRESH team.'); c0.upd = c0.resAt; }
        return;
      }
      var cid = seeding ? 'CASE-' + String(s.seq.lnk = (s.seq.lnk || 150) + 1).padStart(5, '0') : nid('cas', 'CASE-', 5);
      var cat = CMAP[o.type] || 'other', pri = M.CATS[cat][2], at = o.at, cl = o.cl;
      var c = { id: cid, cl: cl, prop: o.prop, cat: cat, pri: pri, st: o.done ? 'resolved' : 'review', at: at, by: o.by || null, src: src, srcId: id, ref: o.ref || null, desc: o.desc, pic: null, owner: o.owner || 'EMP-021', photo: o.photo || null,
        log: [{ at: at, by: o.by || 'EMP-021', kind: 'create', to: 'new', note: o.desc, client: true }, { at: at, by: o.owner || 'EMP-021', kind: 'status', from: 'new', to: 'review', note: null, client: true }], fb: null, resAt: null, res: null };
      if (o.done) { c.resAt = o.resAt || at; c.res = o.res || L('Diselesaikan oleh tim JFRESH.', 'Resolved by the JFRESH team.'); c.log.push({ at: c.resAt, by: c.owner, kind: 'status', from: 'review', to: 'resolved', note: c.res, client: true }); }
      c.target = isoT(ms(at) + M.PRI[pri][2] * HOUR); c.upd = c.log[c.log.length - 1].at;
      s.cases.push(c); s.links[id] = cid; added++;
    }
    var clients = CM && CM.clients ? CM.clients().map(function (c) { return c.id; }) : [];
    clients.forEach(function (cl) {
      var am = (M.client(cl) || {}).am || 'EMP-040';
      (CM.complaints(cl).list || []).forEach(function (x) {
        var d9 = x.src9 && DL ? DL.cmp(x.id) : null;
        link('cm', x.id, { cl: cl, prop: x.prop, type: x.type, at: d9 ? d9.at : x.date + ' 10:00', done: x.st === 'resolved', ref: x.src9 || null, owner: d9 ? d9.by : am,
          desc: d9 ? d9.note : L('Komplain ' + T((M.CATS[CMAP[x.type] || 'other'] || M.CATS.other)[0]).toLowerCase() + ' dicatat tim JFRESH (' + x.id + ').', E((M.CATS[CMAP[x.type] || 'other'] || M.CATS.other)[0]) + ' complaint logged by the JFRESH team (' + x.id + ').') });
      });
    });
    if (DL && DL.state) {
      DL.state().cmps.forEach(function (x) { link('cmp', x.id, { cl: x.cl, prop: x.prop, type: x.type, at: x.at, done: x.st === 'closed' || x.st === 'resolved', ref: x.dlv, owner: x.by, desc: x.note }); });
      DL.state().issues.filter(function (i) { return i.src === 'client'; }).forEach(function (i) { var d = DL.dlv(i.dlv); if (!d) return; link('di', i.id, { cl: d.cl, prop: d.prop, type: i.type, at: i.at, done: ['resolved', 'closed'].indexOf(i.st) >= 0, ref: d.id, desc: i.note, photo: i.photo, by: i.by }); });
    }
    if (added && !seeding) save();
    return added;
  }
  M.syncCases = function () { return linkCases(false); };
  function casesOf(s, list) { if (!s || !s.client) return []; linkCases(false); return S().cases.filter(function (c) { return c.cl === s.cl && s.props.indexOf(c.prop) >= 0 && okProp(list, c.prop); }); }
  function caseView(c, client) {
    var cat = M.CATS[c.cat] || M.CATS.other, stl = M.CASE_ST[c.st], now = M.now();
    return { id: c.id, cl: c.cl, prop: c.prop, propName: M.propName(c.prop), cat: c.cat, catLabel: cat[0], icon: cat[1], pri: c.pri, priLabel: M.PRI[c.pri][0], st: c.st, stLabel: stl[0], tone: stl[1], at: c.at, atLabel: dLabel(c.at), time: String(c.at).slice(11, 16),
      desc: c.desc, ref: c.ref, photo: !!c.photo, pic: c.pic, src: c.src, owner: c.owner ? (client ? M.first(c.owner) : M.empName(c.owner)) : null, ownerId: client ? null : c.owner, upd: c.upd, target: c.target,
      overdue: ['resolved', 'closed'].indexOf(c.st) < 0 && c.target && ms(c.target) < now, res: c.res, resAt: c.resAt, fb: c.fb ? { r: c.fb.r, c: c.fb.c, at: c.fb.at } : null, link: { s: 'CLP-012', rec: c.id } };
  }
  M.cases = function (ctx, f) {
    f = f || {};
    var g = gate(ctx, null, 'CASES'); if (g.e) return []; var s = g.s, q = String(f.q || '').trim().toLowerCase();
    var base;
    if (s.client) base = casesOf(s, propsFor(s, f.prop));
    else { if (!(s.view || s.manage)) return []; linkCases(false); base = S().cases.filter(function (c) { return (!f.cl || c.cl === f.cl) && (!f.prop || c.prop === f.prop) && (!f.mine || c.owner === empId(ctx)); }); }
    var G = { open: ['new', 'assigned', 'review', 'waiting', 'action'], progress: ['assigned', 'review', 'action'], done: ['resolved', 'closed'] };
    return base.filter(function (c) { return (!f.st || (G[f.st] ? G[f.st].indexOf(c.st) >= 0 : c.st === f.st)) && (!f.cat || c.cat === f.cat) && (!q || [c.id, T(c.desc), c.ref, M.propName(c.prop)].join(' ').toLowerCase().indexOf(q) >= 0); })
      .map(function (c) { return caseView(c, s.client); })
      .sort(function (a, b) { var R = { waiting: 0, action: 1, new: 2, assigned: 3, review: 4, resolved: 5, closed: 6 }; return String(b.at).localeCompare(String(a.at)) || R[a.st] - R[b.st]; });
  };
  M.caseSummary = function (ctx, prop) {
    var list = M.cases(ctx, { prop: prop });
    return { new: list.filter(function (c) { return c.st === 'new'; }).length, progress: list.filter(function (c) { return ['assigned', 'review', 'action'].indexOf(c.st) >= 0; }).length,
      done: list.filter(function (c) { return ['resolved', 'closed'].indexOf(c.st) >= 0; }).length, waiting: list.filter(function (c) { return c.st === 'waiting'; }).length, total: list.length, empty: list.length ? null : M.MSG.emptyCase };
  };
  function caseGet(ctx, id) {
    var g = gate(ctx, null, id); if (g.e) return { e: g.e }; var s = g.s; linkCases(false);
    var c = by(S().cases, 'id', id); if (!c) return { e: bad(M.MSG.notfound, 'notfound') };
    if (s.client && (c.cl !== s.cl || s.props.indexOf(c.prop) < 0)) return { e: deny(ctx, id, 'scope') };
    if (!s.client && !(s.view || s.manage)) return { e: deny(ctx, id) };
    return { s: s, c: c };
  }
  M.case = function (ctx, id) {
    var x = caseGet(ctx, id); if (x.e) return null; var s = x.s, c = x.c, v = caseView(c, s.client);
    v.timeline = c.log.filter(function (l) { return !s.client || l.client !== false; }).map(function (l) {
      var who = /^USR-/.test(l.by || '') ? whoName(l.by) : (s.client ? (l.by === 'SYS-CLP' ? 'JFRESH' : 'Tim JFRESH · ' + M.first(l.by)) : M.empName(l.by));
      return { at: l.at, kind: l.kind, to: l.to || null, label: l.to ? M.CASE_ST[l.to][0] : l.kind === 'reply' ? L('Balasan klien', 'Client reply') : l.kind === 'feedback' ? L('Feedback', 'Feedback') : l.kind === 'assign' ? L('Ditugaskan', 'Assigned') : L('Catatan', 'Note'), by: who, note: l.note, internal: l.client === false };
    });
    v.canReply = !!(s.client && s.perms.complaint && c.st === 'waiting');
    v.canFeedback = !!(s.client && ['resolved', 'closed'].indexOf(c.st) >= 0 && !c.fb);
    v.actions = s.client ? [] : (s.manage ? M.CASE_FLOW[c.st].slice() : []);
    v.question = c.st === 'waiting' ? (c.log.filter(function (l) { return l.to === 'waiting'; }).slice(-1)[0] || {}).note || null : null;
    return v;
  };
  function caseOwner(cl, cat) { if (cat === 'invoice') return 'EMP-030'; if (['latepickup', 'latedelivery'].indexOf(cat) >= 0) return 'EMP-021'; return null; }
  function createCase(ctx, s, f, viaFinance) {
    if (!f.prop || s.props.indexOf(f.prop) < 0) return f.prop ? deny(ctx, f.prop, 'scope') : bad(L('Pilih property.', 'Choose a property.'), 'invalid', { errors: { prop: L('Pilih property.', 'Choose a property.') } });
    if (!M.CATS[f.cat]) return bad(L('Pilih kategori.', 'Choose a category.'), 'invalid', { errors: { cat: L('Pilih kategori.', 'Choose a category.') } });
    if (!str(f.desc) || str(f.desc).length < 5) return bad(L('Tulis deskripsi singkat.', 'Write a short description.'), 'invalid', { errors: { desc: L('Minimal 5 karakter.', 'At least 5 characters.') } });
    var ref = f.ref || null;
    if (ref) {
      var own = ownerOfRecord(ref); if (!own) return bad(L('Nomor order / delivery / invoice tidak ditemukan.', 'Order / delivery / invoice number not found.'), 'invalid', { errors: { ref: L('Tidak ditemukan.', 'Not found.') } });
      if (own !== s.cl) return deny(ctx, ref, 'scope');
      var rp0 = propOfRecord(ref); if (rp0 && s.props.indexOf(rp0) < 0) return deny(ctx, ref, 'scope');
    }
    var pri = M.PRI[f.pri] ? f.pri : M.CATS[f.cat][2], t = M.nowS();
    var c = { id: nid('cas', 'CASE-', 5), cl: s.cl, prop: f.prop, cat: f.cat, pri: pri, st: 'new', at: t, by: ctx.uid, src: 'portal', ref: ref, desc: str(f.desc), pic: str(f.pic) || null, photo: f.photo || null, owner: caseOwner(s.cl, f.cat),
      log: [{ at: t, by: ctx.uid, kind: 'create', to: 'new', note: str(f.desc), client: true }], fb: null, resAt: null, res: null };
    c.target = isoT(ms(t) + M.PRI[pri][2] * HOUR); c.upd = t;
    S().cases.push(c);
    M.audit('CASE.CREATE', ctx, { rec: c.id, after: { cat: c.cat, prop: c.prop, pri: c.pri, ref: ref } });
    notify({ cl: s.cl, prop: c.prop, kind: 'case.new', rec: c.id, perm: null });
    notify({ staff: 'clp.case.manage', emp: c.owner, kind: 'case.new', rec: c.id, cl: s.cl, prop: c.prop });
    save();
    return { ok: true, case: caseView(c, true), via: viaFinance ? 'finance' : 'portal' };
  }
  /* KIRIM LAPORAN (§21): Order/Delivery/Invoice, Property, Category, Description, Photo, Priority, PIC. */
  M.createCase = function (ctx, f) {
    f = f || {};
    var g = gate(ctx, 'complaint', f.prop || 'CASE'); if (g.e) return g.e; var s = g.s; if (!s.client) return deny(ctx, 'CASE');
    return createCase(ctx, s, f, false);
  };
  M.caseOptions = function (ctx) {
    var s = M.scope(ctx); if (!s || !s.client || s.blocked) return null;
    var recent = s.perms.order ? M.history(ctx, { prop: 'all', all: true }).slice(0, 12).map(function (r) { return { id: r.dlv || r.ord || r.id, label: L((r.dlv || r.ord || r.id) + ' · ' + r.propName, (r.dlv || r.ord || r.id) + ' · ' + r.propName), prop: r.prop }; }) : [];
    var invs = s.perms.invoice ? M.invoices(ctx, { prop: 'all' }).slice(0, 8).map(function (r) { return { id: r.id, label: L(r.id + ' · ' + r.propName, r.id + ' · ' + r.propName), prop: r.prop }; }) : [];
    return { cats: Object.keys(M.CATS).map(function (k) { return { k: k, l: M.CATS[k][0], i: M.CATS[k][1], pri: M.CATS[k][2] }; }), pri: Object.keys(M.PRI).map(function (k) { return { k: k, l: M.PRI[k][0], h: M.PRI[k][2] }; }),
      props: M.props(ctx), refs: recent.concat(invs), pic: (rec(ctx.uid) || {}).name || ctx.fullName || ctx.name, canCreate: !!s.perms.complaint };
  };
  /* Internal handling (sales / operations manager / supervisor / finance with clp.case.manage). act: assign | review | waiting | action | resolve | close | reopen. */
  M.caseAct = function (ctx, id, act, f) {
    f = f || {};
    var x = caseGet(ctx, id); if (x.e) return x.e; var s = x.s, c = x.c;
    if (s.client || !s.manage) return deny(ctx, id);
    var to = { assign: 'assigned', review: 'review', waiting: 'waiting', ask: 'waiting', action: 'action', resolve: 'resolved', close: 'closed', reopen: 'review' }[act];
    if (!to) return bad();
    if (act === 'assign') { var emp = f.emp || empId(ctx); if (!emp || !(X && X.employee && X.employee(emp)) && !(DL && DL.empName && DL.empName(emp) !== emp)) return bad(L('Pilih pemilik kasus.', 'Choose the case owner.'), 'invalid'); }
    if (M.CASE_FLOW[c.st].indexOf(to) < 0 && !(act === 'assign' && ['new', 'assigned', 'review', 'action'].indexOf(c.st) >= 0)) return bad(M.MSG.jump, 'jump');
    if ((to === 'waiting' || to === 'resolved' || act === 'reopen') && !str(f.note)) return bad(to === 'waiting' ? L('Tulis pertanyaan untuk klien.', 'Write the question for the client.') : to === 'resolved' ? L('Tulis catatan resolusi.', 'Write the resolution note.') : M.MSG.reason, 'reason');
    if (to === 'closed' && c.st !== 'resolved' && !str(f.note)) return bad(M.MSG.reason, 'reason');
    var from = c.st, t = M.nowS();
    if (act === 'assign') { var before = c.owner; c.owner = f.emp || empId(ctx); c.log.push({ at: t, by: empId(ctx) || ctx.uid, kind: 'assign', note: L(M.empName(c.owner), M.empName(c.owner)), client: true }); if (c.st === 'new') c.st = 'assigned'; M.audit('CASE.ASSIGN', ctx, { rec: id, cl: c.cl, before: { owner: before, st: from }, after: { owner: c.owner, st: c.st } }); }
    else {
      c.st = to; c.log.push({ at: t, by: empId(ctx) || ctx.uid, kind: 'status', from: from, to: to, note: str(f.note) || null, client: f.internal ? false : true });
      if (to === 'resolved') { c.resAt = t; c.res = str(f.note); }
      if (!c.owner) c.owner = empId(ctx);
      M.audit('CASE.STATUS', ctx, { rec: id, cl: c.cl, before: { st: from }, after: { st: to }, reason: f.note || null });
      if (['waiting', 'resolved', 'action', 'closed'].indexOf(to) >= 0) notify({ cl: c.cl, prop: c.prop, kind: 'case.' + to, rec: id, perm: null });
    }
    c.upd = t; save();
    return { ok: true, case: caseView(c, false) };
  };
  M.caseNote = function (ctx, id, note) { var x = caseGet(ctx, id); if (x.e) return x.e; if (x.s.client || !x.s.manage) return deny(ctx, id); if (!str(note)) return bad(M.MSG.reason, 'reason'); x.c.log.push({ at: M.nowS(), by: empId(ctx) || ctx.uid, kind: 'note', note: str(note), client: false }); x.c.upd = M.nowS(); save(); return { ok: true }; };
  /* Client reply while the case waits for the client (§22). */
  M.replyCase = function (ctx, id, f) {
    f = f || {};
    var x = caseGet(ctx, id); if (x.e) return x.e; var s = x.s, c = x.c;
    if (!s.client || !s.perms.complaint) return deny(ctx, id);
    if (c.st !== 'waiting') return bad(L('Balasan hanya bisa dikirim saat tim JFRESH menunggu jawaban Anda.', 'You can reply only when the JFRESH team is waiting for your answer.'), 'jump');
    if (!str(f.msg)) return bad(L('Tulis balasan Anda.', 'Write your reply.'), 'invalid');
    var t = M.nowS(); c.log.push({ at: t, by: ctx.uid, kind: 'reply', note: str(f.msg), photo: f.photo || null, client: true }); c.log.push({ at: t, by: 'SYS-CLP', kind: 'status', from: 'waiting', to: 'review', note: null, client: true }); c.st = 'review'; c.upd = t;
    M.audit('CASE.REPLY', ctx, { rec: id, before: { st: 'waiting' }, after: { st: 'review' } });
    notify({ staff: 'clp.case.manage', emp: c.owner, kind: 'case.reply', rec: id, cl: c.cl, prop: c.prop });
    save();
    return { ok: true, case: caseView(c, true) };
  };
  /* Feedback after Resolved (§23): rating 1–5, optional comment, once. */
  M.caseFeedback = function (ctx, id, f) {
    f = f || {};
    var x = caseGet(ctx, id); if (x.e) return x.e; var s = x.s, c = x.c;
    if (!s.client) return deny(ctx, id);
    if (['resolved', 'closed'].indexOf(c.st) < 0) return bad(L('Feedback bisa diberikan setelah kasus selesai.', 'Feedback can be given after the case is resolved.'), 'jump');
    if (c.fb) return bad(L('Feedback sudah diberikan.', 'Feedback was already given.'), 'dup');
    var r = Math.round(+f.rating); if (!(r >= 1 && r <= 5)) return bad(L('Pilih rating 1–5.', 'Choose a rating of 1–5.'), 'invalid');
    c.fb = { r: r, c: str(f.comment) || null, at: M.nowS(), by: ctx.uid };
    c.log.push({ at: c.fb.at, by: ctx.uid, kind: 'feedback', note: L('Rating ' + r + '/5' + (c.fb.c ? ' · ' + c.fb.c : ''), 'Rating ' + r + '/5' + (c.fb.c ? ' · ' + c.fb.c : '')), client: true });
    M.audit('CASE.FEEDBACK', ctx, { rec: id, after: { rating: r } }); save();
    return { ok: true, case: caseView(c, true) };
  };

  /* ---------- NP-06 Client users & property access (§24–§29) ---------- */
  function lastLogin(uid) {
    var r = rec(uid), a = r && r.last ? r.last : null;
    if (X && X.auditLog) { var e = X.auditLog().filter(function (x) { return x.uid === uid && x.ev === 'AUTH.LOGIN_OK'; })[0]; if (e) { var t = isoT(e.at); if (!a || t > a) a = t; } }
    return a;
  }
  function cuView(r) {
    var p = profile(r, r.cl), c = M.CU_ST[r.st], chk = accessCheck(r);
    return { uid: r.uid, u: r.u, cl: r.cl, name: r.name, email: r.email, phone: r.phone, pos: r.pos, role: r.role, roleName: (M.CROLES[r.role] || {}).n, scope: r.scope, scopeLabel: M.SCOPES[r.scope],
      props: p.props.slice(), propNames: r.scope === 'all' ? [M.SCOPES.all] : p.props.map(function (x) { return L(M.propName(x), M.propName(x)); }), perms: p.perms, grant: (r.grant || []).slice(), deny: (r.deny || []).slice(),
      start: r.start, end: r.end, st: r.st, stLabel: c[0], tone: c[1], expired: chk.why === 'expired', lastLogin: lastLogin(r.uid), ct: r.ct || null, note: r.note || null, legacy: !!r.legacy, link: { s: 'CLP-014', rec: r.uid } };
  }
  function manager(ctx) { var g = gate(ctx, 'users', 'CLIENT_USERS'); if (g.e) return g; if (!g.s.client) return { e: deny(ctx, 'CLIENT_USERS') }; return g; }
  M.clientUsers = function (ctx, f) {
    f = f || {};
    var s = M.scope(ctx);
    if (!s || s.blocked || !s.client || !s.perms.users) { if (s && (s.client || !(s.view))) deny(ctx, 'CLIENT_USERS', s && s.blocked ? 'blocked' : null); if (!s || s.client || !s.view) return { list: [], summary: { total: 0, active: 0, suspended: 0, inactive: 0, invited: 0 } }; }
    var cl = s.client ? s.cl : f.cl, q = String(f.q || '').trim().toLowerCase();
    var all = Object.keys(S().users).map(function (k) { return S().users[k]; }).filter(function (r) { return r.cl === cl; }).map(cuView);
    var list = all.filter(function (u) { return (!f.st || u.st === f.st) && (!f.prop || f.prop === 'all' || u.scope === 'all' || u.props.indexOf(f.prop) >= 0) && (!q || [u.name, u.email, u.pos, u.u].join(' ').toLowerCase().indexOf(q) >= 0); })
      .sort(function (a, b) { var R = { active: 0, invited: 1, suspended: 2, inactive: 3 }; return R[a.st] - R[b.st] || a.name.localeCompare(b.name); });
    return { list: list, summary: { total: all.length, active: all.filter(function (u) { return u.st === 'active'; }).length, suspended: all.filter(function (u) { return u.st === 'suspended'; }).length, inactive: all.filter(function (u) { return u.st === 'inactive'; }).length, invited: all.filter(function (u) { return u.st === 'invited'; }).length },
      empty: all.length > 1 ? null : M.MSG.emptyUser };
  };
  M.clientUser = function (ctx, uid) {
    var g = manager(ctx); if (g.e) return null; var s = g.s, r = rec(uid);
    if (!r) return null;
    if (r.cl !== s.cl) { deny(ctx, uid, 'scope'); return null; }
    var v = cuView(r);
    v.history = M.auditLog({ rec: uid }).filter(function (e) { return e.ev.indexOf('CLIENT.') === 0; }).map(function (e) { return { at: e.at, ev: e.ev, label: M.AUDIT[e.ev] || L(e.ev, e.ev), actor: e.actor, before: e.before, after: e.after, reason: e.reason }; });
    v.logins = X && X.auditLog ? X.auditLog().filter(function (e) { return e.uid === uid && /^AUTH\.LOGIN/.test(e.ev); }).slice(0, 10).map(function (e) { return { at: isoT(e.at), ok: e.ev === 'AUTH.LOGIN_OK', device: e.device }; }) : [];
    v.editable = uid !== ctx.uid && withinOwn(s, r);
    return v;
  };
  function withinOwn(s, r) { var p = profile(r, r.cl); if (p.props.some(function (x) { return s.props.indexOf(x) < 0; })) return false; if (M.CP_KEYS.some(function (k) { return p.perms[k] && !s.perms[k]; })) return false; return (M.CROLES[r.role] || {}).rank <= (M.CROLES[s.role] || {}).rank; }
  function snap(r) { return { role: r.role, scope: r.scope, props: (r.props || []).slice(), grant: (r.grant || []).slice(), deny: (r.deny || []).slice(), start: r.start, end: r.end, st: r.st, pos: r.pos, phone: r.phone, name: r.name }; }
  // Validates a requested access profile against the manager's own scope (never above own scope).
  function checkAccess(s, f, ctx) {
    var e = {};
    if (!M.CROLES[f.role]) e.role = L('Pilih role.', 'Choose a role.');
    if (!M.SCOPES[f.scope]) e.scope = L('Pilih cakupan property.', 'Choose the property scope.');
    var props = f.scope === 'all' ? [] : (f.props || []).slice();
    if (f.scope === 'single' && props.length !== 1) e.props = L('Pilih tepat satu property.', 'Choose exactly one property.');
    if (f.scope === 'sel' && props.length < 1) e.props = L('Pilih minimal satu property.', 'Choose at least one property.');
    if (f.start && !/^\d{4}-\d{2}-\d{2}$/.test(f.start)) e.start = L('Tanggal tidak valid.', 'Invalid date.');
    if (f.end && (!/^\d{4}-\d{2}-\d{2}$/.test(f.end) || (f.start && f.end < f.start))) e.end = L('Akhir akses harus setelah awal akses.', 'Access end must be after access start.');
    if ((f.grant || []).concat(f.deny || []).some(function (k) { return !M.CP[k]; })) e.perms = L('Hak akses tidak dikenal.', 'Unknown permission.');
    if (Object.keys(e).length) return { e: bad(M.MSG.invalid, 'invalid', { errors: e }) };
    var all = M.propsOfClient(s.cl).map(function (p) { return p.id; });
    if (props.some(function (p) { return all.indexOf(p) < 0; })) return { e: deny(ctx, props.join(','), 'scope') };
    var tmp = { role: f.role, scope: f.scope, props: props, grant: f.grant || [], deny: f.deny || [], cl: s.cl };
    if (!withinOwn(s, tmp)) return { e: deny(ctx, 'ABOVE_OWN_SCOPE') };
    return { props: props };
  }
  M.addClientUser = function (ctx, f) {
    f = f || {};
    var g = manager(ctx); if (g.e) return g.e; var s = g.s;
    var e = {};
    if (!str(f.name)) e.name = L('Nama wajib diisi.', 'Name is required.');
    var email = String(f.email || '').trim().toLowerCase();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) e.email = L('Email tidak valid.', 'Invalid email.');
    else if (X && X.USERS.some(function (u) { return u.email.toLowerCase() === email; })) e.email = L('Email sudah terdaftar.', 'Email already registered.');
    if (f.phone && !/^\+?[0-9 ()-]{8,20}$/.test(String(f.phone).trim())) e.phone = L('Nomor telepon tidak valid.', 'Invalid phone number.');
    if (Object.keys(e).length) return bad(M.MSG.invalid, Object.keys(e).length === 1 && e.email && /terdaftar/.test(T(e.email)) ? 'dup' : 'invalid', { errors: e });
    var ck = checkAccess(s, f, ctx); if (ck.e) return ck.e;
    var short = (M.client(s.cl) || { n: s.cl }).n.split(' ')[0].toLowerCase().replace(/[^a-z]/g, '') || 'client';
    var base = email.split('@')[0].replace(/[^a-z0-9]/g, '') + '.' + short, u = base, i = 2;
    while (X && X.USERS.some(function (x) { return x.u === u; })) u = base + (i++);
    var n = 700; Object.keys(S().users).forEach(function (k) { var m = /^USR-(\d+)$/.exec(k); if (m && +m[1] > n && +m[1] < 1000) n = +m[1]; }); if (X) X.USERS.forEach(function (x) { var m = /^USR-7(\d\d)$/.exec(x.id); if (m && 700 + +m[1] > n) n = 700 + +m[1]; });
    var uid = 'USR-' + (n + 1);
    var r = { uid: uid, u: u, cl: s.cl, name: str(f.name), email: email, phone: String(f.phone || '').trim(), pos: str(f.pos), role: f.role, scope: f.scope, props: ck.props, st: 'invited', start: f.start || M.today(), end: f.end || null,
      grant: (f.grant || []).slice(), deny: (f.deny || []).slice(), ct: null, last: null, by: ctx.uid, at: M.nowS(), hist: [] };
    S().users[uid] = r; regX(r);
    M.audit('CLIENT.USER_ADD', ctx, { rec: uid, after: snap(r), reason: f.reason || null });
    save();
    return { ok: true, user: cuView(r), invite: { to: email, u: u, link: '#/undangan?u=' + uid } };
  };
  /* Invitation accepted (first activation): invited → active, the access account opens. */
  M.acceptInvite = function (uid) {
    var r = rec(uid); if (!r) return bad(M.MSG.notfound, 'notfound');
    if (r.st !== 'invited') return bad(M.MSG.jump, 'jump');
    var b = snap(r); r.st = 'active'; setX(r);
    M.audit('CLIENT.INVITE_ACCEPT', { uid: uid, name: r.name, client: r.cl }, { rec: uid, cl: r.cl, before: b, after: snap(r) }); save();
    return { ok: true, user: cuView(r) };
  };
  function target(ctx, s, uid) {
    var r = rec(uid); if (!r) return { e: bad(M.MSG.notfound, 'notfound') };
    if (r.cl !== s.cl) return { e: deny(ctx, uid, 'scope') };
    if (uid === ctx.uid) return { e: bad(L('Anda tidak bisa mengubah akses akun Anda sendiri.', 'You cannot change the access of your own account.'), 'invalid') };
    if (!withinOwn(s, r)) return { e: deny(ctx, uid) };
    return { r: r };
  }
  M.editAccess = function (ctx, uid, f, reason) {
    f = f || {};
    var g = manager(ctx); if (g.e) return g.e; var s = g.s;
    var t = target(ctx, s, uid); if (t.e) return t.e; var r = t.r;
    if (!str(reason)) return bad(M.MSG.reason, 'reason');
    var want = { role: f.role || r.role, scope: f.scope || r.scope, props: f.props || (f.scope === 'all' ? [] : r.props), grant: f.grant || r.grant || [], deny: f.deny || r.deny || [], start: f.start === undefined ? r.start : f.start, end: f.end === undefined ? r.end : f.end };
    var ck = checkAccess(s, want, ctx); if (ck.e) return ck.e;
    if (f.phone && !/^\+?[0-9 ()-]{8,20}$/.test(String(f.phone).trim())) return bad(M.MSG.invalid, 'invalid', { errors: { phone: L('Nomor telepon tidak valid.', 'Invalid phone number.') } });
    var b = snap(r);
    r.role = want.role; r.scope = want.scope; r.props = ck.props; r.grant = want.grant.slice(); r.deny = want.deny.slice(); r.start = want.start; r.end = want.end || null;
    if (f.phone) r.phone = String(f.phone).trim(); if (f.pos) r.pos = str(f.pos); if (f.name) r.name = str(f.name);
    var a = snap(r);
    if (JSON.stringify(a) === JSON.stringify(b)) return bad(L('Tidak ada perubahan.', 'Nothing changed.'), 'invalid');
    if (X && X.account && X.account(uid)) { var acc = X.account(uid); acc.ver += 1; if (X.admin && X.admin.forceLogout && (b.scope !== a.scope || JSON.stringify(b.props) !== JSON.stringify(a.props) || b.role !== a.role || JSON.stringify(b.deny) !== JSON.stringify(a.deny))) X.admin.forceLogout(uid, actorName(ctx)); }
    M.audit('CLIENT.ACCESS_EDIT', ctx, { rec: uid, before: b, after: a, reason: reason });
    save();
    return { ok: true, user: cuView(r) };
  };
  function setStatus(ctx, uid, to, reason, ev) {
    var g = manager(ctx); if (g.e) return g.e; var s = g.s;
    var t = target(ctx, s, uid); if (t.e) return t.e; var r = t.r;
    if (!str(reason)) return bad(M.MSG.reason, 'reason');
    if (r.st === to) return bad(M.MSG.jump, 'jump');
    if (to === 'active' && r.st === 'invited') return bad(L('User undangan aktif setelah menerima undangan.', 'An invited user becomes active after accepting the invitation.'), 'jump');
    if (to !== 'active' && r.st === 'active' && profile(r, r.cl).perms.users) {
      var others = Object.keys(S().users).map(function (k) { return S().users[k]; }).filter(function (x) { return x.cl === s.cl && x.uid !== uid && x.st === 'active' && profile(x, x.cl).perms.users; });
      if (!others.length) return bad(L('Harus ada minimal satu user aktif yang bisa mengelola user.', 'At least one active user must be able to manage users.'), 'invalid');
    }
    var b = snap(r); r.st = to; setX(r, actorName(ctx));
    M.audit(ev, ctx, { rec: uid, before: b, after: snap(r), reason: reason }); save();
    return { ok: true, user: cuView(r) };
  }
  M.suspend = function (ctx, uid, reason) { return setStatus(ctx, uid, 'suspended', reason, 'CLIENT.USER_SUSPEND'); };
  M.deactivate = function (ctx, uid, reason) { return setStatus(ctx, uid, 'inactive', reason, 'CLIENT.USER_DEACTIVATE'); };
  M.reactivate = function (ctx, uid, reason) { return setStatus(ctx, uid, 'active', reason, 'CLIENT.USER_ACTIVATE'); };
  /* Property access (CLP-015): who reaches which property. */
  M.propertyAccess = function (ctx) {
    var g = manager(ctx); if (g.e) return null; var s = g.s;
    var users = Object.keys(S().users).map(function (k) { return S().users[k]; }).filter(function (r) { return r.cl === s.cl; });
    return { props: M.propsOfClient(s.cl).map(function (p) {
      var us = users.filter(function (r) { return profile(r, r.cl).props.indexOf(p.id) >= 0; }).map(function (r) { return { uid: r.uid, name: r.name, role: r.role, roleName: M.CROLES[r.role].n, st: r.st, scope: r.scope }; });
      return { id: p.id, n: p.n, city: p.city, users: us, active: us.filter(function (u) { return u.st === 'active'; }).length, inScope: s.props.indexOf(p.id) >= 0 };
    }), roles: M.roleMatrix() };
  };
  M.roleMatrix = function () { return M.CROLE_ORDER.map(function (k) { var r = M.CROLES[k], p = {}; M.CP_KEYS.forEach(function (x) { p[x] = r.perms.indexOf(x) >= 0; }); return { k: k, n: r.n, rank: r.rank, perms: p, contract: r.contract }; }); };

  /* ---------- KPIs (§70) from the engine data ---------- */
  M.kpis = function (ctx, cl) {
    var s = M.scope(ctx); if (!s || s.blocked) return [];
    if (s.client) { if (!s.perms.users) return []; cl = s.cl; } else if (!can(ctx, 'clp.kpi') && !can(ctx, 'clp.view')) return [];
    function inCl(x) { return !cl || x === cl; }
    var users = Object.keys(S().users).map(function (k) { return S().users[k]; }).filter(function (r) { return inCl(r.cl); }), act = users.filter(function (r) { return r.st === 'active'; });
    var adopt = act.filter(function (r) { return !!lastLogin(r.uid); }).length;
    var picks = (LG ? LG.state().orders : []).filter(function (o) { return o.kind === 'pickup' && inCl(o.cl) && o.st !== 'cancelled' && o.st !== 'draft'; }), self = picks.filter(function (o) { return o.src === 'client'; }).length;
    var dl = (DL ? DL.state().dlv : []).filter(function (d) { return inCl(d.cl); }), withPod = dl.filter(function (d) { return d.pod; });
    var uids = users.map(function (r) { return r.uid; }), V = S().views.filter(function (v) { return uids.indexOf(v.uid) >= 0; });
    var podSeen = withPod.filter(function (d) { return V.some(function (v) { return v.kind === 'pod' && v.rec === d.pod.id; }); }).length;
    var trackable = dl.filter(function (d) { return d.date >= addDays(M.today(), -7) && d.st !== 'cancelled'; }).map(function (d) { return d.id; }).concat(picks.filter(function (o) { return o.date >= addDays(M.today(), -7) && ['completed', 'atplant', 'received', 'ontheway', 'arrived', 'inprogress'].indexOf(o.st) >= 0; }).map(function (o) { return o.id; }));
    var lgViews = LG ? LG.state().locLog.filter(function (x) { return x.role === 'client' || /^USR-/.test(x.who); }).length : 0;
    var tracked = trackable.filter(function (id) { return V.some(function (v) { return v.kind === 'track' && (v.rec === id || (v.rec && DL.dlv(id) && DL.dlv(id).ord === v.rec)); }); }).length;
    var invs = FN ? FN.state().inv.filter(function (iv) { return inCl(iv.cl) && ['issued', 'partial', 'paid', 'overdue'].indexOf(FN.invSt(iv)) >= 0 && iv.issued >= addDays(M.today(), -60); }) : [];
    var invSeen = invs.filter(function (iv) { return V.some(function (v) { return v.kind === 'inv' && v.rec === iv.id; }); }).length;
    var cs = S().cases.filter(function (c) { return inCl(c.cl); }), dig = cs.filter(function (c) { return c.src === 'portal'; }).length;
    var res = cs.filter(function (c) { return c.resAt; }), avgH = res.length ? r1(sum(res.map(function (c) { return (ms(c.resAt) - ms(c.at)) / HOUR; })) / res.length) : null;
    var K = [
      { k: 'adoption', n: L('Portal Adoption', 'Portal Adoption'), v: pct(adopt, act.length), unit: '%', num: adopt, den: act.length, target: 80, note: L('User aktif yang pernah login', 'Active users who have signed in') },
      { k: 'selfPickup', n: L('Self-Service Pickup', 'Self-Service Pickup'), v: pct(self, picks.length), unit: '%', num: self, den: picks.length, target: 30, note: L('Pickup dari aplikasi klien', 'Pickups created in the client app') },
      { k: 'tracking', n: L('Digital Tracking Usage', 'Digital Tracking Usage'), v: pct(tracked, trackable.length), unit: '%', num: tracked, den: trackable.length, target: 50, extra: lgViews, note: L('Layanan 7 hari terakhir yang dilacak di portal', 'Services of the last 7 days tracked in the portal') },
      { k: 'podView', n: L('POD View', 'POD View'), v: pct(podSeen, withPod.length), unit: '%', num: podSeen, den: withPod.length, target: 60, note: L('POD yang dibuka klien', 'PODs opened by the client') },
      { k: 'invoiceView', n: L('Invoice View', 'Invoice View'), v: pct(invSeen, invs.length), unit: '%', num: invSeen, den: invs.length, target: 70, note: L('Invoice 60 hari terakhir yang dibuka klien', 'Invoices of the last 60 days opened by the client') },
      { k: 'complaintDigital', n: L('Complaint Digital Submission', 'Complaint Digital Submission'), v: pct(dig, cs.length), unit: '%', num: dig, den: cs.length, target: 70, note: L('Kasus yang dibuat lewat portal', 'Cases created through the portal') },
      { k: 'resolutionTime', n: L('Complaint Resolution Time', 'Complaint Resolution Time'), v: avgH, unit: 'h', num: res.length, den: cs.length, target: 48, lower: true, note: L('Rata-rata jam sampai selesai', 'Average hours to resolution') }
    ];
    var parts = K.filter(function (x) { return x.unit === '%' && x.v != null; });
    K.push({ k: 'engagement', n: L('Client Digital Engagement', 'Client Digital Engagement'), v: parts.length ? r1(sum(parts.map(function (x) { return Math.min(100, x.v / x.target * 100); })) / parts.length) : null, unit: '%', target: 100, note: L('Rata-rata pencapaian target KPI digital', 'Average attainment of the digital KPI targets') });
    return K;
  };

  /* ---------- Notifications (§67): only the client's own data, inside the user's property scope ---------- */
  M.NOTIF = { 'req.sent': L('Permintaan terkirim', 'Request sent'), 'req.done': L('Permintaan selesai', 'Request completed'), 'req.rejected': L('Permintaan ditolak', 'Request rejected'), 'req.new': L('Permintaan klien baru', 'New client request'),
    'case.new': L('Laporan masalah diterima', 'Issue report received'), 'case.waiting': L('JFRESH menunggu jawaban Anda', 'JFRESH is waiting for your answer'), 'case.action': L('Tindakan diperlukan', 'Action required'), 'case.resolved': L('Laporan selesai', 'Report resolved'),
    'case.closed': L('Laporan ditutup', 'Report closed'), 'case.reply': L('Balasan klien', 'Client reply'), 'inv.due': L('Invoice jatuh tempo', 'Invoice due'), 'inv.overdue': L('Invoice terlambat', 'Invoice overdue') };
  function notify(n) { var x = Object.assign({ id: nid('nt', 'NT11-'), at: M.nowS() }, n); S().notifs.unshift(x); if (S().notifs.length > 300) S().notifs.length = 300; return x; }
  M.notifText = function (n) {
    var r = n.rec || '', p = n.prop ? M.propName(n.prop) : '', rq = /^REQ-/.test(r) ? by(S().reqs, 'id', r) : null, cs = /^CASE-/.test(r) ? by(S().cases, 'id', r) : null;
    switch (n.kind) {
      case 'req.sent': return L(T(rq ? M.REQ_TYPES[rq.type] : L('Permintaan', 'Request')) + ' ' + r + ' · ' + p + ' diterima tim JFRESH.', E(rq ? M.REQ_TYPES[rq.type] : L('Request', 'Request')) + ' ' + r + ' · ' + p + ' received by the JFRESH team.');
      case 'req.done': return L(r + ' · ' + p + ' sudah dijalankan.', r + ' · ' + p + ' has been applied.');
      case 'req.rejected': return L(r + ' · ' + p + ' tidak bisa dijalankan. Lihat alasannya.', r + ' · ' + p + ' could not be applied. See the reason.');
      case 'req.new': return L(T(rq ? M.REQ_TYPES[rq.type] : L('Permintaan', 'Request')) + ' ' + r + ' · ' + M.clientName(n.cl) + ' · ' + p, E(rq ? M.REQ_TYPES[rq.type] : L('Request', 'Request')) + ' ' + r + ' · ' + M.clientName(n.cl) + ' · ' + p);
      case 'case.reply': return L(r + ' · ' + M.clientName(n.cl) + ' membalas.', r + ' · ' + M.clientName(n.cl) + ' replied.');
      case 'inv.due': return L(r + ' jatuh tempo ' + (n.due || '') + '.', r + ' is due on ' + (n.due || '') + '.');
      case 'inv.overdue': return L(r + ' lewat jatuh tempo ' + (n.due || '') + '.', r + ' is past its due date ' + (n.due || '') + '.');
    }
    if (cs) return L(r + ' · ' + T(M.CATS[cs.cat][0]) + ' · ' + p, r + ' · ' + E(M.CATS[cs.cat][0]) + ' · ' + p);
    return L(r, r);
  };
  M.notifs = function (ctx) {
    var s = M.scope(ctx); if (!s || s.blocked) return [];
    var out = S().notifs.filter(function (n) {
      if (s.client) return n.cl === s.cl && !n.staff && (!n.prop || s.props.indexOf(n.prop) >= 0) && (!n.perm || s.perms[n.perm]);
      if (!n.staff || !can(ctx, n.staff)) return false;
      return !n.emp || n.emp === empId(ctx) || can(ctx, 'clp.case.manage') || can(ctx, 'lg.dispatch');
    }).slice(0, 30);
    if (s.client && s.perms.invoice && FN) invList(s, s.props).forEach(function (iv) {
      if (iv.st === 'overdue') out.push({ id: 'INV-OD-' + iv.id, kind: 'inv.overdue', cl: s.cl, prop: iv.prop, rec: iv.id, due: iv.due, at: iv.due + ' 08:00' });
      else if (['issued', 'partial'].indexOf(iv.st) >= 0 && ms(iv.due) - ms(M.today()) <= 7 * DAY) out.push({ id: 'INV-DUE-' + iv.id, kind: 'inv.due', cl: s.cl, prop: iv.prop, rec: iv.id, due: iv.due, at: M.today() + ' 08:00' });
    });
    return out.sort(function (a, b) { return String(b.at).localeCompare(String(a.at)); });
  };
  function notifCta(ctx, n) {
    var r = n.rec || '';
    if (/^REQ-/.test(r)) return { l: L('Lihat Permintaan', 'View Request'), s: 'CLP-004', rec: r };
    if (/^CASE-/.test(r)) return { l: L('Lihat Laporan', 'View Report'), s: 'CLP-012', rec: r };
    if (/^INV-/.test(r)) return { l: L('Lihat Invoice', 'View Invoice'), s: 'CLP-009', rec: r };
    return null;
  }
  var NCAT = { 'req.rejected': 'warn', 'case.waiting': 'warn', 'case.action': 'warn', 'inv.overdue': 'crit', 'inv.due': 'warn', 'req.new': 'ops', 'case.reply': 'ops' };
  M.joinNotifs = function (X2) {
    if (!X2 || !X2.notifsFor || X2.__p11n) return; X2.__p11n = true;
    var orig = X2.notifsFor, origRead = X2.markRead;
    X2.notifsFor = function (ctx) {
      var base = orig.call(X2, ctx), s = M.scope(ctx);
      if (s && s.client) {
        if (s.blocked) return [];
        // Earlier engines tag client notifications by client only: drop the ones naming a property outside this user's scope (§67).
        var out = M.propsOfClient(s.cl).filter(function (p) { return s.props.indexOf(p.id) < 0; }).map(function (p) { return p.n; });
        if (out.length) base = base.filter(function (n) { var txt = JSON.stringify([n.t, n.c, n.d || null]); return !out.some(function (nm) { return txt.indexOf(nm) >= 0; }); });
        if (!s.perms.track) base = base.filter(function (n) { return !(n.cta && ['TRACK-003', 'CLIENT-DEL-001'].indexOf(n.cta.s) >= 0); });
      }
      var seen = (S().reads || {})[ctx.uid] || [], t0 = Date.now(), now = M.now();
      var mine = M.notifs(ctx).slice(0, 12).map(function (n) {
        var id = 'CL-' + n.id, cta = notifCta(ctx, n);
        return { id: id, cat: NCAT[n.kind] || (ctx.client ? 'ops' : 'info'), to: [], client: n.cl || null, t: M.NOTIF[n.kind] || L(n.kind, n.kind), c: M.notifText(n), at: t0 - Math.max(0, now - ms(n.at)), read: seen.indexOf(id) >= 0,
          cta: cta && X2.canScreen && !X2.canScreen(ctx, cta.s) ? null : cta, p11: true };
      });
      return base.concat(mine).sort(function (a, b) { return b.at - a.at; });
    };
    X2.markRead = function (ctx, ids) {
      var all = ids === 'all' ? X2.notifsFor(ctx).map(function (n) { return n.id; }) : ids || [];
      var r = S().reads = S().reads || {}, list = r[ctx.uid] = r[ctx.uid] || [];
      all.forEach(function (id) { if (/^CL-/.test(id) && list.indexOf(id) < 0) list.push(id); });
      save();
      return origRead.call(X2, ctx, all.filter(function (id) { return !/^CL-/.test(id); }));
    };
  };

  /* ---------- Record ownership (for authorize() and scope checks) ---------- */
  function ownerOfRecord(id) {
    if (!id) return null; id = String(id);
    var o = LG && LG.order(id); if (o) return o.cl;
    var d = DL && DL.dlv(id); if (d) return d.cl;
    var b = PR && PR.batch(id); if (b) return b.cl;
    var iv = FN && FN.invoice(id); if (iv) return iv.cl;
    var c = by(S().cases, 'id', id); if (c) return c.cl;
    var q = by(S().reqs, 'id', id); if (q) return q.cl;
    var u = S().users[id]; if (u) return u.cl;
    if (/^POD-/.test(id) && DL) { var dp = DL.state().dlv.filter(function (x) { return x.pod && x.pod.id === id; })[0]; if (dp) return dp.cl; }
    if (/^(DN|SC)-/.test(id) && DL) { var dd = DL.dlv('DLV-' + id.slice(id.indexOf('-') + 1)); if (dd) return dd.cl; }
    if (/^RES-/.test(id)) { var cr = by(S().cases, 'id', 'CASE-' + id.slice(4)); if (cr) return cr.cl; }
    if (/^RET-/.test(id) && DL) { var rt = DL.ret(id); if (rt) return rt.cl; }
    if (/^SOA-/.test(id)) return 'CL-' + id.split('-')[1];
    if (/^DOC-/.test(id) && CM && CM.state) { var dc = by(CM.state().docs, 'id', id); if (dc) return dc.cl; }
    if (/^SCH-/.test(id) && LG) { var sc = LG.schedule(id); if (sc) return sc.cl; }
    return null;
  }
  function propOfRecord(id) {
    var o = LG && LG.order(id); if (o) return o.prop; var d = DL && DL.dlv(id); if (d) return d.prop; var b = PR && PR.batch(id); if (b) return b.prop; var iv = FN && FN.invoice(id); if (iv) return iv.prop;
    var c = by(S().cases, 'id', id); if (c) return c.prop; var q = by(S().reqs, 'id', id); if (q) return q.prop; return null;
  }
  M.ownerOf = ownerOfRecord;
  M.recordOf = function (id) { var cl = ownerOfRecord(id); if (!cl) return null; var p = propOfRecord(id); return p ? { cl: cl, prop: p } : { cl: cl }; };

  /* ---------- Screens (§73), navigation (§6), install ---------- */
  function sc(id, n, a, p, np, icon, pur, emp, o) {
    var k = +np.slice(3);
    return Object.assign({ id: id, n: n, a: a, p: p, np: np, nv: 'NV-' + String(k).padStart(2, '0'), icon: icon, pur: pur, dom: 'clp11', lvl: 2, p11: true, pN: 11, nb: [], bf: [], aud: [], dev: 'm', devs: { m: 'primary', t: 'full', d: 'supported' },
      emp: emp || L('Belum ada data.', 'No data yet.'), err: M.MSG.loadErr, warn: L('Ada yang perlu perhatian.', 'Something needs attention.'), ok: L('Tersimpan.', 'Saved.') }, o || {});
  }
  var DESK = { m: 'supported', t: 'full', d: 'primary' }, LIMIT = { m: 'limited', t: 'supported', d: 'primary' };
  M.SCREENS = [
    sc('CLP-001', L('Beranda Klien', 'Client Home'), 'T08', 'clp.portal', 'NP-01', 'home', L('Salam, pemilih property, 4 kartu (pickup hari ini, delivery di jalan, issue terbuka, outstanding invoice), aksi cepat, aktivitas per property.', 'Greeting, property selector, 4 cards (pickups today, deliveries on the way, open issues, outstanding invoice), quick actions, activity per property.'), M.MSG.emptyActive),
    sc('CLP-002', L('Login Klien', 'Client Login'), 'T06', 'clp.portal', 'NP-01', 'key', L('Email/username, password, lupa password, ingat saya. Tanpa OTP.', 'Email/username, password, forgot password, remember me. No OTP.'), null, { p4: true, route: 'login.html' }),
    sc('CLP-003', L('Buat Permintaan Pickup', 'Pickup Request'), 'T06', 'clp.pickup.create', 'NP-02', 'plus', L('3 langkah: Detail, Jadwal, Konfirmasi; jadwal rutin, extra pickup, reschedule, batal.', '3 steps: Detail, Schedule, Confirmation; recurring schedule, extra pickup, reschedule, cancel.'), null, { devs: { m: 'primary', t: 'full', d: 'full' } }),
    sc('CLP-004', L('Konfirmasi Permintaan', 'Pickup Confirmation'), 'T03', 'clp.order.view', 'NP-02', 'checkc', L('Request ID, waktu, peminta, property, status, order terkait.', 'Request ID, time, requester, property, status, linked order.')),
    sc('CLP-005', L('Tracking', 'Tracking'), 'T03', 'clp.track.view', 'NP-03', 'pin', L('Timeline Pickup → Proses → Packing → Delivery → Selesai, ETA, peta, driver, update terakhir, chat.', 'Timeline Pickup → Process → Packing → Delivery → Complete, ETA, map, driver, last update, chat.'), M.MSG.emptyActive),
    sc('CLP-006', L('Pesanan & Riwayat', 'Order History'), 'T05', 'clp.order.view', 'NP-03', 'list', L('Tab Aktif, Riwayat, Dokumen; filter property, tanggal, layanan, status; cari order, POD, invoice.', 'Tabs Active, History, Documents; filter property, date, service, status; search order, POD, invoice.'), M.MSG.emptyActive),
    sc('CLP-007', L('Pusat Dokumen', 'Document Center'), 'T05', 'clp.portal', 'NP-03', 'file', L('POD, Delivery Note, Service Completion, Invoice, Return Note, Resolusi, Kontrak bila diizinkan. Lihat, unduh, bagikan.', 'POD, Delivery Note, Service Completion, Invoice, Return Note, Resolution, Contract if permitted. View, download, share.'), M.MSG.emptyDoc),
    sc('CLP-008', L('Billing & Invoice', 'Billing Overview'), 'T08', 'clp.invoice.view', 'NP-04', 'invoice', L('Outstanding, jatuh tempo bulan ini, terlambat, lunas; daftar invoice; statement; hubungi finance.', 'Outstanding, due this month, overdue, paid; invoice list; statement; contact finance.'), M.MSG.emptyInv, { dev: 'd', devs: DESK }),
    sc('CLP-009', L('Detail Invoice', 'Invoice Detail'), 'T03', 'clp.invoice.view', 'NP-04', 'invoice', L('No, periode, kontrak, layanan, qty, tarif, subtotal, diskon, pajak, total, dibayar, sisa, jatuh tempo + dokumen pendukung. Tanpa edit.', 'No, period, contract, service, qty, rate, subtotal, discount, tax, total, paid, outstanding, due + supporting documents. No edit.'), null, { dev: 'd', devs: DESK }),
    sc('CLP-010', L('Bantuan & Masalah', 'Complaint List'), 'T05', 'clp.portal', 'NP-05', 'headset', L('Ringkasan laporan baru, dalam proses, selesai, menunggu Anda; daftar kasus.', 'Summary new, in progress, resolved, waiting for you; case list.'), M.MSG.emptyCase),
    sc('CLP-011', L('Laporkan Masalah', 'Create Complaint'), 'T06', 'clp.complaint.create', 'NP-05', 'alert', L('Order/Delivery/Invoice, property, kategori, deskripsi, foto, prioritas, PIC → KIRIM LAPORAN.', 'Order/Delivery/Invoice, property, category, description, photo, priority, PIC → KIRIM LAPORAN.')),
    sc('CLP-012', L('Detail Laporan', 'Complaint Detail'), 'T03', 'clp.portal', 'NP-05', 'message', L('Nomor kasus, pemilik, update terakhir, target resolusi, timeline, balasan, feedback 1–5.', 'Case number, owner, last update, resolution target, timeline, reply, feedback 1–5.')),
    sc('CLP-013', L('Pengguna & Akses', 'Client User List'), 'T05', 'clp.users.manage', 'NP-06', 'users', L('Ringkasan user, cari, filter property, tambah user; status aktif / nonaktif sementara / tidak aktif.', 'User summary, search, property filter, add user; status active / suspended / inactive.'), M.MSG.emptyUser, { dev: 'd', devs: LIMIT }),
    sc('CLP-014', L('Detail User Klien', 'Client User Detail'), 'T03', 'clp.users.manage', 'NP-06', 'user', L('Nama, email, telepon, posisi, role, cakupan property, awal/akhir akses, status, login terakhir, riwayat akses.', 'Name, email, phone, position, role, property scope, access start/end, status, last login, access history.'), null, { dev: 'd', devs: LIMIT }),
    sc('CLP-015', L('Akses Property', 'Property Access'), 'T05', 'clp.users.manage', 'NP-06', 'building', L('Siapa mengakses property mana; role & hak akses default.', 'Who reaches which property; roles & default permissions.'), null, { dev: 'd', devs: LIMIT })
  ];
  M.screen = function (id) { return by(M.SCREENS, 'id', id); };
  // Portal screens internal staff may open (staff view): request approval and the client case queue.
  M.STAFF_SCREENS = { 'CLP-004': ['lg.dispatch', 'clp.view'], 'CLP-010': ['clp.view', 'clp.case.manage'], 'CLP-012': ['clp.view', 'clp.case.manage'] };
  M.PARENTS = { 'CLP-003': ['CLP-006'], 'CLP-004': ['CLP-003'], 'CLP-005': ['CLP-006'], 'CLP-007': ['CLP-006'], 'CLP-009': ['CLP-008'], 'CLP-011': ['CLP-010'], 'CLP-012': ['CLP-010'], 'CLP-014': ['CLP-013'], 'CLP-015': ['CLP-013'] };
  // Phase 2 client mocks → the Phase 11 screens (the Phase 4 landing HOM-CLT-001 keeps working and renders CLP-001).
  // The home nav item points at HOM-CLT-001 (the landing) with CLP-001 in `also`, so the app shell does not add a second landing entry.
  M.ALIAS = { 'HOM-CLT-001': 'CLP-001', 'CLT-ORD-001': 'CLP-006', 'CLT-ORD-002': 'CLP-005', 'CLT-INV-001': 'CLP-008', 'CLT-CMP-001': 'CLP-010', 'CLT-DOC-001': 'CLP-007' };
  function N(k, l, i, s, x) { return Object.assign({ k: k, l: l, i: i, s: s }, x || {}); }
  M.NAV = {
    nav: [N('home', L('Beranda', 'Home'), 'home', 'HOM-CLT-001', { also: ['CLP-001'] }), N('orders', L('Pesanan', 'Orders'), 'list', 'CLP-006', { also: ['CLP-004', 'CLT-ORD-001'] }), N('pickup', L('Buat Pickup', 'Request Pickup'), 'plus', 'CLP-003'),
      N('track', L('Tracking', 'Tracking'), 'pin', 'CLP-005', { also: ['TRACK-003', 'CHAT-001', 'CLT-ORD-002'] }), N('docs', L('Dokumen', 'Documents'), 'file', 'CLP-007', { also: ['CLT-DOC-001'] }), N('bill', L('Billing', 'Billing'), 'invoice', 'CLP-008', { also: ['CLP-009', 'CLT-INV-001'] }),
      N('help', L('Bantuan', 'Help'), 'headset', 'CLP-010', { also: ['CLP-011', 'CLP-012', 'CLT-CMP-001'] }), N('users', L('Pengguna & Akses', 'Users & Access'), 'users', 'CLP-013', { also: ['CLP-014', 'CLP-015'] }),
      N('acct', L('Layanan & Kontrak', 'Services & Contract'), 'contract', 'CLT-COM-001'), N('del', L('Pengiriman', 'Deliveries'), 'truck', 'CLIENT-DEL-001', { also: ['FEEDBACK-001', 'DLV-ISSUE-001'] })],
    mnav: [N('home', L('Beranda', 'Home'), 'home', 'HOM-CLT-001', { also: ['CLP-001'] }), N('orders', L('Pesanan', 'Orders'), 'list', 'CLP-006', { also: ['CLP-003', 'CLP-004'] }), N('track', L('Tracking', 'Tracking'), 'pin', 'CLP-005', { also: ['TRACK-003', 'CHAT-001'] }),
      N('bill', L('Billing', 'Billing'), 'invoice', 'CLP-008', { also: ['CLP-009'] }), { k: 'menu', l: L('Akun', 'Account'), i: 'user' }]
  };

  /* Keep the access accounts in step with the client-user store (status §27; suspended / inactive users cannot sign in). */
  function regX(r) {
    if (!X || !X.USERS) return;
    var u = X.user(r.uid);
    if (!u && !X.USERS.some(function (x) { return x.u === r.u; })) { X.USERS.push({ id: r.uid, u: r.u, email: r.email, name: r.name, client: r.cl, contact: r.ct || undefined, status: X_ST[r.st] || 'inactive', roles: [{ k: 'client', def: true }], plants: [], lang: 'id', p11: true }); }
  }
  function setX(r, actor) {
    if (!X || !X.account || !X.account(r.uid)) return;
    var want = X_ST[r.st] || 'inactive', a = X.account(r.uid);
    if (a.status !== want) X.admin.setStatus(r.uid, want, actor || 'Client Portal');
    if (want !== 'active' && X.admin.forceLogout) X.admin.forceLogout(r.uid, actor || 'Client Portal');
  }
  function syncX(reset) { if (!X) return; if (reset && X.USERS) for (var i = X.USERS.length - 1; i >= 0; i--) if (X.USERS[i].p11 && !S().users[X.USERS[i].id]) X.USERS.splice(i, 1); Object.keys(S().users).forEach(function (k) { var r = S().users[k]; regX(r); var a = X.account(r.uid); if (a && a.status !== (X_ST[r.st] || 'inactive') && a.status !== 'locked') X.admin.setStatus(r.uid, X_ST[r.st] || 'inactive', 'Client Portal'); }); }
  M._syncX = syncX;
  /* Jaens invoices join the Phase 10 seed itself (before its ledger is built), so the AR subledger stays equal to the GL. */
  function seedInvoices(s) {
    (D.INVOICES || []).forEach(function (x) {
      if (by(s.inv, 'id', x.id)) return;
      var lines = x.lines.map(function (l) { var rt = CM && CM.rateOn ? CM.rateOn(x.prop, l[0], l[3]) : null; return { svc: l[0], desc: L(M.svcName(l[0]) + ' · ' + x.period, M.svcName(l[0]) + ' · ' + x.period), qty: l[1], unit: 'kg', rate: l[2], amt: l[1] * l[2], br: null, rc: rt ? rt.rc : null, date: l[3] }; });
      var sub = sum(lines.map(function (l) { return l.amt; })), tax = Math.round(sub * 0.11), ctr = CM && CM.contractsForProp ? (CM.contractsForProp(x.prop, x.issued)[0] || {}).no || null : null;
      var iv = { id: x.id, cl: x.cl, prop: x.prop, period: x.period, issued: x.issued, due: x.due, terms: (M.client(x.cl) || {}).terms || 30, ctr: ctr, po: null, mig: true, p11: true, lines: lines, sub: sub, sur: 0, disc: 0, tax: tax, total: sub + tax,
        st: 'issued', by: 'EMP-030', appr: 'EMP-030', apprAt: x.issued, docs: ['POD', 'Billing Ready'], jv: null, log: [] };
      if (x.paid) iv.paidSeed = [x.paid[0], x.paid[1]];
      s.inv.push(iv);
    });
  }
  M._seedInvoices = seedInvoices;

  /* install(): joins the Phase 11 client portal to config and access — permissions, client users, the login / session
     guard for client users, property-scoped record checks, notifications, screens and the client menu. Safe to call more than once. */
  M.install = function (C, X2, P, CM2, LG2, PR2, DL2, FN2) {
    if (!C || C.__p11c) return; C.__p11c = true;
    if (CM2) { CM = CM2; } if (LG2) { LG = LG2; } if (PR2) { PR = PR2; } if (DL2) { DL = DL2; } if (FN2) { FN = FN2; } if (X2) { X = X2; }
    M.CM = CM; M.LG = LG; M.PR = PR; M.DL = DL; M.FN = FN; M.X = X;
    Object.keys(M.PERMS).forEach(function (k) { C.PERMS[k] = M.PERMS[k]; });
    function addP(list, extra) { extra.forEach(function (p) { if (list.indexOf(p) < 0) list.push(p); }); }
    Object.keys(M.ROLE_PERMS).forEach(function (r) { var rl = C.ROLES[r], xr = X && X.ROLES[r]; if (rl) addP(rl.perms, M.ROLE_PERMS[r]); if (xr && xr.perms) addP(xr.perms, M.ROLE_PERMS[r]); });
    if (FN && FN._seed && !FN.__p11c) { FN.__p11c = true; FN._seed.push(seedInvoices); if (D.INVOICES.length && !FN.invoice(D.INVOICES[0].id)) FN._reset(); }
    S();
    if (X) {
      D.USERS.forEach(function (u) { if (u.demo && !X.DEMO.some(function (d) { return d.u === u.u; })) X.DEMO.push({ u: u.u, d: u.demo }); });
      syncX();
      // Login / session guard: a client user who is suspended, inactive, invited or outside the access window is refused (§27, §29),
      // and the context carries only the client permissions of the user's role and overrides.
      var res0 = X.resolve;
      X.resolve = function (uid) {
        var ctx = res0.apply(X, arguments);
        if (!ctx || !ctx.ok || !ctx.client) return ctx;
        var r = rec(uid), chk = accessCheck(r);
        if (!chk.ok) { ctx.steps.push({ k: 'clp', ok: false, v: chk.why }); return { ok: false, code: chk.code, why: chk.why, steps: ctx.steps }; }
        var p = profile(r, ctx.client), drop = [];
        M.CP_KEYS.forEach(function (k) { if (!p.perms[k]) drop = drop.concat([M.CP[k]], UNDER[k] || []); });
        ctx.perms = ctx.perms.filter(function (x) { return drop.indexOf(x) < 0; });
        addP(ctx.perms, ['clp.portal'].concat(M.CP_KEYS.filter(function (k) { return p.perms[k]; }).map(function (k) { return M.CP[k]; })));
        ctx.clp = { cl: p.cl || ctx.client, role: p.role, roleName: (M.CROLES[p.role] || {}).n, scope: p.scope, props: p.props.slice(), perms: p.perms, implicit: p.implicit };
        ctx.nav = X.nav(ctx, 'd'); ctx.mnav = X.nav(ctx, 'm'); ctx.landing = X.landing(ctx);
        return ctx;
      };
      // authorize(): a client record that names a property must also be inside the user's property scope.
      var ins0 = X.inScope;
      X.inScope = function (ctx, o) {
        if (!ins0.call(X, ctx, o)) return false;
        if (ctx && ctx.client && o && o.prop) { var s = M.scope(ctx); if (!s || s.blocked || s.props.indexOf(o.prop) < 0) return false; }
        return true;
      };
      M.joinNotifs(X);
      // Staff handling: the request detail (CLP-004) and the case screens (CLP-010 / CLP-012) also open for internal
      // staff with the matching permission. The engine functions behind them check the permission again.
      var cs0 = X.canScreen;
      X.canScreen = function (ctx, id) {
        if (cs0.call(X, ctx, id)) return true;
        var need = M.STAFF_SCREENS[id];
        return !!(need && ctx && !ctx.client && need.some(function (p) { return can(ctx, p); }));
      };
    }
    var cl = C.ROLES.client;
    if (cl) { cl.nav = M.NAV.nav.slice(); cl.mnav = M.NAV.mnav.slice(); }
    var orig = C.screen, extra = {};
    M.SCREENS.forEach(function (s0) { extra[s0.id] = s0; });
    C.screen = function (id) { return extra[id] || orig(id); };
    C.SCREENS_P11C = M.SCREENS;
    // Browser only: the Phase 1–3 client screens (app/data.js, loaded after the engines) only know their own demo
    // clients. Portal clients missing there get a minimal compatible record, so the legacy screens still render
    // for a CL-07 user until the CLP screens take over their routes (ALIAS).
    if (root && root.document) {
      if (root.JFDB) M.legacyBridge(root.JFDB);
      else try { Object.defineProperty(root, 'JFDB', { configurable: true, get: function () { return undefined; }, set: function (v) { delete root.JFDB; root.JFDB = v; M.legacyBridge(v); } }); } catch (e) {}
    }
  };
  /* Adds the portal clients and their properties to the legacy demo data (app/data.js) when they are missing there. */
  M.legacyBridge = function (db) {
    if (!db || !db.CLIENTS || !db.PROPS) return;
    var cls = {}; Object.keys(S().users).forEach(function (k) { cls[S().users[k].cl] = true; });
    Object.keys(cls).forEach(function (cl) {
      if (db.CLIENTS.some(function (c) { return c.id === cl; })) return;
      var c = M.client(cl); if (!c) return;
      var ct = (CM && CM.contactsOf ? CM.contactsOf(cl) : [])[0] || {};
      db.CLIENTS.push({ id: cl, n: c.n, type: c.type ? c.type.charAt(0).toUpperCase() + c.type.slice(1) : 'Client', pic: ct.n || '', phone: ct.phone || '', email: ct.email || '', status: c.status || 'active', sla: 24, rooms: 0, p11: true });
      M.propsOfClient(cl).forEach(function (p) { if (!db.PROPS.some(function (x) { return x.id === p.id; })) db.PROPS.push({ id: p.id, cl: cl, n: c.n + ' — ' + p.n, rooms: 0, sched: p.pickup ? T(p.pickup) : '', p11: true }); });
    });
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = M;
  else root.JFCLP = M;
})(typeof window !== 'undefined' ? window : this);
