/* ==========================================================================
   JFRESH OS — Delivery, Client Completion & Service Closure engine (Phase 9 · NP 1.0)
   From Ready to Deliver to Billing Ready: release validation with controlled
   override, the official delivery task, dispatch through the Phase 7 engine,
   the client delivery view, the formal handover at the client, POD with
   amendments only, sent vs received reconciliation with partial acceptance,
   delivery issues, returns and redeliveries that never overwrite the original,
   service completion with a frozen, versioned record and a reproducible SLA,
   billing validation with the historical rate and the Finance handoff, and the
   delivery / client experience KPI that feeds Phase 5 and Phase 6.

   Never a second tracking engine: drivers, vehicles, routes, trips, live
   position, ETA and chat are read from Phase 7 (JFLOG). Batches come from
   Phase 8 (JFPROD); clients, contacts, services, contracts and rate cards from
   Phase 6 (JFCOMM). One engine for the app (app/screens-dlv*.js), the Phase 9
   pages (phase9/) and the automated tests (tools/test-dlv.js). Every protected
   action checks the permission and the record scope first (§65, §82) and writes
   an audit entry (§59). Prototype only: a production backend must repeat these
   rules on the server. No invoice, AR or HPP here (§41, §73).
   ========================================================================== */
(function (root) {
  function req(p) { try { return typeof require !== 'undefined' ? require(p) : null; } catch (e) { return null; } }
  var D = root.JFDLV_DATA || req('./jfos-dlv-data.js');
  var LG = root.JFLOG || req('./jfos-logi.js');
  var PR = root.JFPROD || req('./jfos-prod.js');
  var CM = root.JFCOMM || (LG && LG.CM) || req('./jfos-comm.js');
  function L(a, b) { return [a, b === undefined ? a : b]; }
  var M = { version: 'NP 1.0', D: D };
  var MIN = 6e4, DAY = 864e5;
  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  function sum(a) { return a.reduce(function (s, x) { return s + (+x || 0); }, 0); }
  function r1(x) { return Math.round(x * 10) / 10; }
  function r2(x) { return Math.round(x * 100) / 100; }
  function pct(a, b) { return b ? Math.round(a / b * 1000) / 10 : null; }
  function by(arr, k, v) { for (var i = 0; i < arr.length; i++) if (arr[i][k] === v) return arr[i]; return null; }
  function T(x) { return Array.isArray(x) ? x[0] : (x == null ? '' : String(x)); }
  function ms(s) { if (typeof s === 'number') return s; var p = String(s).split(/[-: T]/); return Date.UTC(+p[0], +p[1] - 1, +p[2], +(p[3] || 0), +(p[4] || 0), +(p[5] || 0)); }
  function iso(t) { return new Date(t).toISOString().slice(0, 10); }
  function isoT(t) { return new Date(t).toISOString().slice(0, 16).replace('T', ' '); }
  function hm(t) { return new Date(t).toISOString().slice(11, 16); }
  function addDays(d, n) { return iso(ms(d) + n * DAY); }
  function str(x) { return String(x == null ? '' : x).trim(); }
  M.TODAY = D.today; M.ms = ms; M.iso = iso; M.isoT = isoT; M.hm = hm; M.addDays = addDays; M.r1 = r1;
  M.LG = LG; M.PR = PR; M.CM = CM;

  M.MSG = {
    noperm: L('Anda tidak memiliki izin untuk tindakan ini.', 'You do not have permission for this action.'),
    notfound: L('Data tidak ditemukan.', 'Record not found.'),
    scope: L('Data ini bukan milik Anda.', 'This record is not yours.'),
    invalid: L('Periksa data dan coba lagi.', 'Check the data and try again.'),
    reason: L('Alasan wajib diisi.', 'A reason is required.'),
    jump: L('Langkah ini belum bisa dilakukan. Ikuti urutan proses.', 'This step is not possible yet. Follow the process order.'),
    notrel: L('Barang belum di-release ke Logistics.', 'The goods have not been released to Logistics yet.'),
    notready: L('Barang belum siap kirim di produksi.', 'The goods are not ready to deliver in production yet.'),
    held: L('Pengiriman ditahan supervisor.', 'The delivery is on hold by the supervisor.'),
    podFail: L('POD belum berhasil disimpan. Coba Lagi.', 'POD could not be saved. Try Again.'),
    sync: L('Data pengiriman belum sinkron. Coba Lagi.', 'Delivery data is not in sync yet. Try Again.'),
    count: L('Jumlah paket belum sesuai.', 'The package count does not match.'),
    photo: L('Foto bukti wajib.', 'A photo is required.'),
    sign: L('Minta tanda tangan penerima.', 'Ask for the recipient signature.'),
    offline: L('Tidak ada koneksi.', 'No connection.'),
    retry: L('Coba Lagi.', 'Try Again.')
  };

  /* ---------- Permissions (§82) ---------- */
  M.PERMS = {
    'dlv.release.view': L('Lihat antrian siap kirim', 'View the ready-to-deliver queue'), 'dlv.release': L('Release ke Logistics, hold, ada masalah', 'Release to Logistics, hold, report issue'),
    'dlv.override': L('Override release terkontrol', 'Controlled release override'), 'dlv.view': L('Lihat delivery semua klien', 'View deliveries of all clients'),
    'dlv.dispatch': L('Dispatch delivery: driver, kendaraan, rute, jendela, hold, batal', 'Dispatch deliveries: driver, vehicle, route, window, hold, cancel'),
    'dlv.drv': L('Tugas delivery driver: serah terima & POD', 'Driver delivery tasks: handover & POD'), 'dlv.pod.amend': L('Amandemen POD', 'POD amendment'),
    'dlv.rec.review': L('Review rekonsiliasi & partial', 'Reconciliation & partial review'), 'dlv.issue.report': L('Laporkan masalah delivery', 'Report delivery issues'),
    'dlv.issue.manage': L('Putuskan masalah delivery', 'Decide delivery issues'), 'dlv.return': L('Kelola return & redelivery', 'Manage returns & redeliveries'),
    'dlv.return.receive': L('Terima return di plant', 'Receive returns at the plant'), 'dlv.complete': L('Tetapkan Service Completed', 'Set Service Completed'),
    'dlv.comp.amend': L('Amandemen service completion', 'Service completion amendment'), 'dlv.bill.view': L('Lihat Billing Ready', 'View Billing Ready'),
    'dlv.bill': L('Validasi & kirim Billing Ready ke Finance', 'Validate & send Billing Ready to Finance'), 'dlv.kpi': L('KPI delivery & pengalaman klien', 'Delivery & client experience KPI'),
    'dlv.timeline': L('Timeline layanan lengkap', 'Full service timeline'), 'dlv.track.own': L('Lacak delivery sendiri (klien)', 'Track own deliveries (client)'), 'dlv.feedback': L('Kirim feedback (klien)', 'Send feedback (client)'),
    'dlv.feedback.view': L('Lihat feedback klien', 'View client feedback')
  };
  var SPV9 = ['dlv.release.view', 'dlv.release', 'dlv.override', 'dlv.view', 'dlv.dispatch', 'dlv.pod.amend', 'dlv.rec.review', 'dlv.issue.report', 'dlv.issue.manage', 'dlv.return', 'dlv.return.receive', 'dlv.complete', 'dlv.kpi', 'dlv.timeline', 'dlv.feedback.view'];
  M.ROLE_PERMS = {
    driver: ['dlv.drv', 'dlv.issue.report'],
    client: ['dlv.track.own', 'dlv.feedback', 'dlv.feedback.view', 'dlv.issue.report'],
    supervisor: SPV9,
    opsmgr: SPV9.concat(['dlv.comp.amend', 'dlv.bill.view']),
    owner: ['dlv.release.view', 'dlv.view', 'dlv.kpi', 'dlv.timeline', 'dlv.bill.view', 'dlv.feedback.view'],
    finance: ['dlv.view', 'dlv.bill.view', 'dlv.bill', 'dlv.timeline', 'dlv.kpi'],
    sales: ['dlv.view', 'dlv.kpi', 'dlv.timeline', 'dlv.feedback.view'],
    prod3: ['dlv.release.view', 'dlv.return.receive']
  };
  function can(ctx, p) { return !p || !!(ctx && ctx.perms && ctx.perms.indexOf(p) >= 0); }
  M.can = can;
  function empId(ctx) { return ctx && (ctx.employee ? ctx.employee.id : ctx.emp || ctx.uid) || 'system'; }
  function isClient(ctx) { return !!(ctx && ctx.client); }
  M.empId = empId; M.isClient = isClient;
  // The engine's own hand on Phase 7: creates and closes logistics orders it owns, never a person.
  var SYS = { uid: 'system', name: 'Sistem JFRESH', fullName: 'Sistem JFRESH', roleKey: 'system', perms: [] };
  function sysPerms() { if (!SYS.perms.length) SYS.perms = Object.keys((LG && LG.PERMS) || {}).concat(Object.keys(M.PERMS)); return SYS; }

  /* ---------- Labels ---------- */
  M.REL_ST = { waiting: [L('Menunggu Release', 'Waiting Release'), 'appr'], ready: [L('Siap Release', 'Ready'), 'ok'], hold: [L('Ditahan', 'Hold'), 'warn'], issue: [L('Ada Masalah', 'Issue'), 'crit'], released: [L('Di-release ke Logistics', 'Released to Logistics'), 'info'] };
  M.REL_CHECKS = [
    ['qc', L('QC lulus', 'QC Passed'), 'ovr'], ['qty', L('Qty packing sesuai', 'Packed Quantity matches'), 'ovr'], ['pkgs', L('Jumlah paket benar', 'Package Count correct'), 'ovr'], ['label', L('Label terpasang', 'Label attached'), 'fix'],
    ['client', L('Klien benar', 'Client correct'), 'hard'], ['prop', L('Property benar', 'Property correct'), 'hard'], ['order', L('Order benar', 'Order correct'), 'hard'], ['date', L('Tanggal kirim benar', 'Delivery Date correct'), 'fix'],
    ['win', L('Jendela waktu benar', 'Delivery Time Window correct'), 'fix'], ['sla', L('SLA diketahui', 'SLA known'), 'hard'], ['instr', L('Instruksi khusus tersedia', 'Special Instructions available'), 'info'], ['crit', L('Tidak ada masalah kritis terbuka', 'No unresolved critical issue'), 'ovr']
  ];
  M.DLV_ST = {
    waiting: [L('Menunggu Dispatch', 'Waiting Dispatch'), 'appr'], assigned: [L('Ditugaskan', 'Assigned'), 'info'], ready: [L('Siap Berangkat', 'Ready'), 'info'], ontheway: [L('Dalam Perjalanan', 'On The Way'), 'info'],
    near: [L('Hampir Tiba', 'Near Destination'), 'info'], arrived: [L('Sudah Tiba', 'Arrived'), 'info'], handover: [L('Serah Terima', 'Handover In Progress'), 'appr'], delivered: [L('Terkirim', 'Delivered'), 'ok'],
    completed: [L('Selesai', 'Completed'), 'ok'], issue: [L('Ada Masalah', 'Issue'), 'crit'], returned: [L('Dikembalikan', 'Returned'), 'warn'], cancelled: [L('Dibatalkan', 'Cancelled'), 'mute']
  };
  M.ACTIVE = ['assigned', 'ready', 'ontheway', 'near', 'arrived', 'handover'];
  // §12: six simple client steps.
  M.CL_STEPS = [['ready', L('Siap Dikirim', 'Ready'), 'package'], ['assigned', L('Driver Ditugaskan', 'Assigned'), 'user'], ['ontheway', L('Dalam Perjalanan', 'On The Way'), 'truck'], ['near', L('Hampir Tiba', 'Almost There'), 'pin'], ['arrived', L('Sudah Tiba', 'Arrived'), 'flag'], ['delivered', L('Diterima', 'Delivered'), 'checkc']];
  M.PRI = LG && LG.PRI ? LG.PRI : { normal: [L('Normal', 'Normal'), 'mute', 1] };
  M.priRank = function (p) { return (M.PRI[p] || M.PRI.normal)[2]; };
  M.COND = { good: [L('Baik', 'Good'), 'ok', 'checkc'], note: [L('Ada Catatan', 'With Note'), 'warn', 'edit'], damaged: [L('Rusak', 'Damaged'), 'crit', 'alert'], partial: [L('Partial', 'Partial'), 'appr', 'minus'] };
  M.REC_TYPES = { missing: L('Paket kurang', 'Package Missing'), extra: L('Paket lebih', 'Package Extra'), qty: L('Selisih jumlah', 'Quantity Difference'), wrong: L('Item salah', 'Wrong Item'), damaged: L('Paket rusak', 'Damaged Package'), other: L('Lainnya', 'Other') };
  M.ACC = { full: [L('TERIMA SEMUA', 'FULL ACCEPT'), 'ok', 'checkc'], partial: [L('TERIMA SEBAGIAN', 'PARTIAL ACCEPT'), 'appr', 'minus'], reject: [L('TOLAK', 'REJECT'), 'crit', 'xc'] };
  M.REC_RES = { ok: [L('Sesuai', 'Matched'), 'ok'], diff: [L('Ada Selisih', 'Difference'), 'crit'] };
  M.REV_ST = { pending: [L('Menunggu review supervisor', 'Waiting for supervisor review'), 'appr'], approved: [L('Disetujui supervisor', 'Approved by supervisor'), 'ok'], client: [L('Diterima PIC klien', 'Accepted by the client PIC'), 'ok'] };
  M.ISSUE_TYPES = {
    unavail: [L('Klien Tidak Ada', 'Client Unavailable'), 'warn', 'user', 'notavail'], reject: [L('Klien Menolak', 'Client Rejects Delivery'), 'crit', 'xc', 'rejected'],
    wrongprop: [L('Property Salah', 'Wrong Property'), 'crit', 'pin', 'address'], missing: [L('Paket Hilang', 'Missing Package'), 'crit', 'search', 'missing'],
    wrongitem: [L('Item Salah', 'Wrong Item'), 'warn', 'swap', 'other'], qty: [L('Jumlah Salah', 'Wrong Quantity'), 'warn', 'hash', 'bagdiff'],
    damaged: [L('Paket Rusak', 'Damaged Package'), 'crit', 'package', 'damaged'], quality: [L('Komplain Kualitas', 'Quality Complaint'), 'warn', 'star', 'other'],
    late: [L('Terlambat', 'Late Delivery'), 'warn', 'clock', 'traffic'], other: [L('Lainnya', 'Other'), 'info', 'more', 'other']
  };
  M.ISSUE_ACT = { note: [L('Terima dengan Catatan', 'Accept with Note'), 'edit'], partial: [L('Terima Sebagian', 'Partial Accept'), 'minus'], return: [L('Bawa Kembali ke Plant', 'Return to Plant'), 'arrowl'],
    redelivery: [L('Kirim Ulang', 'Redelivery'), 'refresh'], review: [L('Review Supervisor', 'Supervisor Review'), 'users'], complaint: [L('Buat Kasus Komplain', 'Create Complaint Case'), 'flag'] };
  M.ISS_ST = { new: [L('Baru', 'New'), 'crit'], review: [L('Review', 'Review'), 'appr'], resolved: [L('Selesai', 'Resolved'), 'ok'], closed: [L('Ditutup', 'Closed'), 'mute'] };
  M.SEV = { info: [L('Info', 'Info'), 'info', 1], warn: [L('Peringatan', 'Warning'), 'warn', 2], crit: [L('Kritis', 'Critical'), 'crit', 3] };
  M.RET_ST = { created: [L('Dibuat', 'Created'), 'appr'], intransit: [L('Dalam Perjalanan', 'In Transit'), 'info'], arrived: [L('Tiba di Plant', 'Arrived at Plant'), 'info'], review: [L('Dalam Review', 'Under Review'), 'appr'],
    reprocess: [L('Proses Ulang', 'Reprocess'), 'warn'], repack: [L('Kemas Ulang', 'Repack'), 'warn'], ready: [L('Siap Kirim Ulang', 'Ready for Redelivery'), 'ok'], closed: [L('Ditutup', 'Closed'), 'mute'] };
  M.RET_FLOW = { created: ['intransit'], intransit: ['arrived'], arrived: ['review'], review: ['reprocess', 'repack', 'ready', 'closed'], reprocess: ['ready'], repack: ['ready'], ready: ['closed'], closed: [] };
  M.RET_NEED = { redelivery: L('Kirim ulang', 'Redelivery'), reprocess: L('Proses ulang lalu kirim ulang', 'Reprocess then redeliver'), repack: L('Kemas ulang lalu kirim ulang', 'Repack then redeliver'), claim: L('Klaim / tidak dikirim ulang', 'Claim / no redelivery'), none: L('Tidak perlu tindakan', 'No action needed') };
  M.SLA_ST = { ontime: [L('Tepat Waktu', 'On Time'), 'ok'], late: [L('Terlambat', 'Late'), 'crit'], exception: [L('Pengecualian', 'Exception'), 'appr'], pending: [L('Belum dihitung', 'Not calculated'), 'mute'] };
  M.SLA_CAUSE = { traffic: L('Macet', 'Traffic'), client: L('Klien tidak siap / tidak ada', 'Client not ready / unavailable'), prevstop: L('Stop sebelumnya terlambat', 'Previous stop delay'), vehicle: L('Masalah kendaraan', 'Vehicle issue'), production: L('Produksi terlambat', 'Production delay'), other: L('Lainnya', 'Other') };
  M.BILL_ST = { notready: [L('Belum Siap', 'Not Ready'), 'mute'], validation: [L('Perlu Validasi', 'Validation Required'), 'appr'], ready: [L('Billing Ready', 'Billing Ready'), 'ok'], sent: [L('Terkirim ke Finance', 'Sent to Finance'), 'info'], hold: [L('Billing Ditahan', 'Billing Hold'), 'warn'], issue: [L('Ada Masalah', 'Issue'), 'crit'] };
  M.BILL_CHECKS = [['contract', L('Kontrak valid', 'Contract Valid')], ['rc', L('Rate card valid', 'Rate Card Valid')], ['eff', L('Tanggal berlaku tarif valid', 'Rate Effective Date valid')], ['done', L('Service completed', 'Service Completed')],
    ['qty', L('Jumlah tagih valid', 'Billable Quantity Valid')], ['disc', L('Diskon disetujui', 'Discount Approved')], ['sur', L('Surcharge valid', 'Surcharge Valid')], ['block', L('Tidak ada blok billing kritis', 'No Critical Billing Block')]];
  M.COMP_CHECKS = [['delivered', L('Delivery selesai', 'Delivery Completed')], ['pod', L('POD valid', 'POD Valid')], ['rec', L('Rekonsiliasi jelas / disetujui', 'Reconciliation clear / approved')], ['crit', L('Tidak ada masalah kritis terbuka', 'No unresolved critical issue')], ['sla', L('SLA final dihitung', 'Final SLA calculated')]];
  // §34 full service timeline steps; c = what the client sees (§35).
  M.TL = {
    order: [L('Order Dibuat', 'Order Created'), 'file', 1], pickup: [L('Pickup', 'Pickup'), 'truck', 1], plant: [L('Tiba di Plant', 'Arrived at Plant'), 'factory', 0], rcv: [L('Receiving', 'Receiving'), 'inbox', 0], sort: [L('Sorting', 'Sorting'), 'layers', 0],
    wash: [L('Washing', 'Washing'), 'washer', 0], dry: [L('Drying', 'Drying'), 'wind', 0], fin: [L('Finishing', 'Finishing'), 'iron', 0], qc: [L('QC', 'QC'), 'search', 0], pack: [L('Packing', 'Packing'), 'package', 0], rtd: [L('Siap Dikirim', 'Ready to Deliver'), 'package', 1],
    rel: [L('Di-release', 'Released'), 'filecheck', 0], dispatch: [L('Dispatch', 'Dispatched'), 'user', 0], otw: [L('Dalam Perjalanan', 'On The Way'), 'truck', 1], arr: [L('Sudah Tiba', 'Arrived'), 'flag', 1], pod: [L('POD', 'POD'), 'sign', 1],
    delivered: [L('Diterima', 'Delivered'), 'checkc', 1], issue: [L('Ada Masalah', 'Issue'), 'alert', 1], ret: [L('Return', 'Return'), 'arrowl', 1], redel: [L('Kirim Ulang', 'Redelivery'), 'refresh', 1], done: [L('Service Completed', 'Service Completed'), 'checkc', 1], bill: [L('Billing Ready', 'Billing Ready'), 'invoice', 0]
  };

  /* ---------- State ---------- */
  var KEY = 'jfos-dlv-v1', mem = {}, st = null, T0 = Date.now(), SIM = ms(D.simNow), fixed = null;
  var ls = null;
  try { ls = root.localStorage || null; if (ls) { ls.setItem('__jfd', '1'); ls.removeItem('__jfd'); } } catch (e) { ls = null; }
  function clock() { if (fixed) return fixed(); if (LG && LG.now) return LG.now(); return SIM + (Date.now() - T0); }
  function S() {
    if (st) return st;
    try { var raw = ls ? ls.getItem(KEY) : mem[KEY]; if (raw) { var o = JSON.parse(raw); if (o && o.v === 1) { st = o; return st; } } } catch (e) {}
    st = seed(); post(); save(); return st;
  }
  function save() { if (!st) return; st.upd = clock(); try { var s = JSON.stringify(st); if (ls) ls.setItem(KEY, s); else mem[KEY] = s; } catch (e) {} }
  M._reset = function () { SIM = ms(D.simNow); T0 = Date.now(); st = seed(); post(); save(); };
  M._setClock = function (fn) { fixed = fn; };
  M.now = function () { S(); return clock(); };
  M.state = function () { return S(); };
  M.save = save;
  M.cfg = function () { return S().cfg; };
  function nowS() { return isoT(M.now()); }
  function nid(k, pre, pad) { var n = S().seq[k]++; return pre + (pad ? String(n).padStart(pad, '0') : n); }

  function seed() {
    var s = { v: 1, rel: clone(D.RELEASES), dlv: clone(D.DELIVERIES), issues: clone(D.ISSUES), rets: clone(D.RETURNS), cmps: clone(D.COMPLAINTS), fb: clone(D.FEEDBACK), notifs: [], audit: [], outbox: [], reads: {}, upd: null,
      seq: { dlv: 14, rel: 11, pod: 14, di: 5, ret: 3, cmp: 2, fb: 3, bil: 4, nt: 1 },
      cfg: { recTol: 2, recReviewPkgs: 1, slaTol: 0, podAmendSpv: true, nearMin: 10, delayMin: 10, maxRate: 5, offlineQueue: false } };
    s.dlv.forEach(function (d) { d.ev = d.ev.map(function (x) { return [x[0], x[1], x[2], x[3] || null]; }); d.hold = d.hold || null; d.ho = d.ho || null; });
    return s;
  }
  // After seeding: frozen completion data and the Billing Ready snapshots of the seeded history.
  function post() {
    var s = st;
    s.dlv.forEach(function (d) {
      if (d.comp && !d.comp.data) d.comp.data = compData(d, d.comp.at);
      if (d.bill && (d.bill.st === 'ready' || d.bill.st === 'sent') && !d.bill.calc) d.bill.calc = M.billCalc(d);
      if (d.bill && d.bill.st === 'sent') s.outbox.push(payload(d, d.bill.sent));
    });
  }

  /* ---------- Audit (§59) and notifications (§58) ---------- */
  M.AUDIT = { 'RELEASE.LOGISTICS': L('Di-release ke Logistics', 'Released to Logistics'), 'DELIVERY.CREATE': L('Delivery dibuat', 'Delivery Created'), 'DRIVER.ASSIGN': L('Driver ditugaskan', 'Driver Assigned'), 'DELIVERY.START': L('Delivery dimulai', 'Delivery Started'),
    'DELIVERY.ARRIVE': L('Tiba', 'Arrived'), 'HANDOVER.START': L('Serah terima dimulai', 'Handover Started'), 'POD.CAPTURE': L('POD tersimpan', 'POD Captured'), 'RECON.COMPLETE': L('Rekonsiliasi selesai', 'Reconciliation Completed'),
    'RECON.DIFF': L('Selisih ditemukan', 'Difference Found'), 'RETURN.CREATE': L('Return dibuat', 'Return Created'), 'RETURN.RECEIVE': L('Return diterima', 'Return Received'), 'REDELIVERY.CREATE': L('Redelivery dibuat', 'Redelivery Created'),
    'SERVICE.COMPLETE': L('Service completed', 'Service Completed'), 'BILLING.READY': L('Billing ready', 'Billing Ready'), 'FEEDBACK.SUBMIT': L('Feedback dikirim', 'Feedback Submitted'), 'ISSUE.CREATE': L('Masalah dibuat', 'Issue Created'), 'OVERRIDE': L('Override', 'Override') };
  M.audit = function (ev, ctx, o) {
    o = o || {};
    var e = { at: nowS(), ev: ev, by: ctx && ctx.client ? (ctx.contact || ctx.uid || ctx.client) : empId(ctx), name: ctx && (ctx.fullName || ctx.name) || 'system', role: ctx && ctx.roleKey || null, rec: o.rec || null, dlv: o.dlv || null,
      from: o.from == null ? null : String(o.from), to: o.to == null ? null : String(o.to), reason: o.reason == null ? null : T(o.reason) };
    S().audit.unshift(e); if (S().audit.length > 900) S().audit.length = 900; return e;
  };
  M.auditLog = function (f) { f = f || {}; return S().audit.filter(function (e) { return (!f.dlv || e.dlv === f.dlv || e.rec === f.dlv) && (!f.ev || e.ev.indexOf(f.ev) === 0) && (!f.rec || e.rec === f.rec); }); };
  function deny(ctx, what) { M.audit('ACCESS.DENIED', ctx, { rec: what }); return { ok: false, code: 'noperm', msg: M.MSG.noperm }; }
  function bad(msg, code, x) { return Object.assign({ ok: false, code: code || 'invalid', msg: msg || M.MSG.invalid }, x || {}); }
  function notify(to, kind, d, v) { var n = { id: nid('nt', 'NT9-'), to: to, kind: kind, dlv: d ? d.id : null, at: nowS(), v: v || {} }; S().notifs.unshift(n); return n; }

  /* ---------- Lookups ---------- */
  M.rel = function (id) { return by(S().rel, 'id', id); };
  M.dlv = function (id) { return by(S().dlv, 'id', id); };
  M.issue = function (id) { return by(S().issues, 'id', id); };
  M.ret = function (id) { return by(S().rets, 'id', id); };
  M.cmp = function (id) { return by(S().cmps, 'id', id); };
  M.feedback = function (id) { return by(S().fb, 'id', id); };
  M.prop = function (id) { return CM && CM.prop ? CM.prop(id) : null; };
  M.propName = function (id) { var p = M.prop(id); return p ? p.n : id || '—'; };
  M.client = function (id) { return CM && CM.client ? CM.client(id) : null; };
  M.clientName = function (id) { var c = M.client(id); return c ? c.n : id || '—'; };
  M.contact = function (id) { return CM && CM.contact ? CM.contact(id) : null; };
  M.svcName = function (id) { return CM && CM.svcName ? CM.svcName(id) : id; };
  M.empName = function (id) {
    if (!id) return '—'; if (id === 'system') return T(L('Sistem', 'System'));
    var ct = M.contact(id); if (ct) return ct.n;
    if (LG && LG.empName) { var n = LG.empName(id); if (n && n !== id) return n; }
    if (PR && PR.empName) return PR.empName(id);
    return id;
  };
  M.first = function (id) { return LG && LG.first ? LG.first(id) : String(M.empName(id)).split(' ')[0]; };
  M.order = function (id) { return id && LG && LG.order ? LG.order(id) : null; };
  M.batch = function (id) { return id && PR && PR.batch ? PR.batch(id) : null; };
  function ordOf(d) { return d ? M.order(d.ord) : null; }
  M.ordOf = ordOf;
  function tripOf(d) { var o = ordOf(d); return o && LG ? LG.tripOf(o) : null; }
  M.tripOf = tripOf;
  M.driverOf = function (d) { var t = tripOf(d); return t ? t.drv : d.drv; };
  M.vehOf = function (d) { var t = tripOf(d); return t ? t.veh : d.veh; };
  M.routeOf = function (d) { var t = tripOf(d); return t ? t.route : d.route; };
  M.byOrd = function (ordId) { return ordId ? S().dlv.filter(function (d) { return d.ord === ordId; })[0] || null : null; };
  M.relOfBatch = function (bid) { return S().rel.filter(function (r) { return r.batch === bid; })[0] || null; };
  M.recordOf = function (rec) {
    if (!rec) return null;
    var d = M.dlv(rec) || M.rel(rec) || M.ret(rec); if (d) return { cl: d.cl || (M.relView(d) || {}).cl, plant: 'PL-01' };
    return null;
  };

  /* ---------- Access (§65, §82) ---------- */
  M.canSee = function (ctx, d) {
    if (!d) return false;
    if (isClient(ctx)) return can(ctx, 'dlv.track.own') && d.cl === ctx.client;
    if (can(ctx, 'dlv.view') || can(ctx, 'dlv.bill.view')) return true;
    if (can(ctx, 'dlv.drv')) return M.driverOf(d) === empId(ctx);
    return false;
  };
  function ownDrv(ctx, d) { if (!d) return bad(M.MSG.notfound, 'notfound'); if (!can(ctx, 'dlv.drv')) return deny(ctx, d.id); if (M.driverOf(d) !== empId(ctx)) return deny(ctx, d.id); return null; }

  /* ---------- Phase 7 link: status, driver, events (one logistics truth) ---------- */
  var LG2D = { draft: 'waiting', requested: 'waiting', scheduled: 'waiting', assigned: 'assigned', ready: 'ready', ontheway: 'ontheway', arrived: 'arrived', inprogress: 'handover', completed: 'delivered', issue: 'issue', cancelled: 'cancelled' };
  var LGEV = { assigned: 'assigned', ready: 'ready', ontheway: 'ontheway', arrived: 'arrived', handover: 'inprogress', delivered: 'completed', issue: 'issue', cancelled: 'cancelled' };
  function syncOne(d) {
    if (!d.ord || !LG) return false;
    var o = LG.order(d.ord); if (!o) return false;
    var ch = false, t = LG.tripOf(o);
    if (t && (d.drv !== t.drv || d.veh !== t.veh || d.route !== t.route)) { d.drv = t.drv; d.veh = t.veh; d.route = t.route; ch = true; }
    if (!d.pod && ['waiting', 'assigned', 'ready'].indexOf(d.st) >= 0 && (o.date !== d.date || o.win[0] !== d.win[0] || o.win[1] !== d.win[1])) { d.date = o.date; d.win = o.win.slice(); ch = true; }
    if (d.pod || ['completed', 'returned'].indexOf(d.st) >= 0) return ch;
    var to = LG2D[o.st] || d.st;
    if (to === 'waiting' && o.trip) to = 'assigned';
    if (to === 'arrived' && d.ho) to = 'handover';
    if (to === 'cancelled' && d.st === 'returned') to = 'returned';
    if (to === 'delivered' && !d.pod) adoptPod(d, o);
    if (to !== d.st) {
      var lgSt = LGEV[to] || o.st, at = LG.evAt(o, lgSt) || nowS(), last = o.ev[o.ev.length - 1];
      d.ev.push([to, at, last ? last[2] : 'system', null]); d.st = to; ch = true;
    }
    return ch;
  }
  // A Phase 7 POD (taken on the Phase 7 screen) becomes the Phase 9 POD; nothing is typed twice.
  function adoptPod(d, o) {
    if (!o.pod) return;
    var sg = (LG.evidence ? (LG.state().evidence || []).filter(function (e) { return e.ord === o.id && e.kind === 'sign'; })[0] : null);
    var ph = (LG.state().evidence || []).filter(function (e) { return e.ord === o.id && e.kind === 'photo' && e.data === 'pod'; })[0];
    d.pod = { id: nid('pod', 'POD-2610-', 3), recv: o.pod.recv, role: '', sign: sg ? sg.img : 'seed:sig', photo: ph ? ph.img : 'seed:pod', at: o.pod.at, loc: true, pkgs: o.pod.pkg || o.pod.bags, qty: d.qty, kg: d.kg,
      cond: o.pod.cond === 'good' ? 'good' : o.pod.cond === 'damaged' ? 'damaged' : 'note', notes: o.pod.issue || '', by: M.driverOf(d), ver: 1, amend: [], src: 'p7', ref: 'JFRESH|POD|' + d.id + '|' + o.id };
    d.sla = slaOf(d, d.pod.at);
    var got = d.pod.pkgs;
    if (got === d.pkgs) d.rec = { res: 'ok', at: d.pod.at, by: 'system', sent: { pkgs: d.pkgs, qty: d.qty, kg: d.kg }, recv: { pkgs: got, qty: d.qty, kg: d.kg }, acc: 'full', accQty: d.qty, rejQty: 0, review: null };
    else {
      d.rec = { res: 'diff', at: d.pod.at, by: d.pod.by, sent: { pkgs: d.pkgs, qty: d.qty, kg: d.kg }, recv: { pkgs: got, qty: null, kg: null }, type: got < d.pkgs ? 'missing' : 'extra', reason: o.pod.issue ? L(o.pod.issue, o.pod.issue) : L('Jumlah paket berbeda.', 'Package count differs.'), notes: '', photo: null, pic: o.pod.recv, acc: 'partial', accQty: null, rejQty: 0, retReq: false, review: 'pending' };
      notify('sup', 'recdiff', d, { from: d.pkgs, to: got });
    }
    M.audit('POD.CAPTURE', null, { dlv: d.id, rec: d.pod.id, to: d.pod.recv + ' · ' + d.pod.pkgs + ' ' + T(L('paket', 'pkg')) });
  }
  // New Phase 8 batches at Ready to Deliver join the release queue on their own (§4).
  function autoRel() {
    if (!PR || !PR.state) return false;
    var ch = false;
    PR.state().batches.forEach(function (b) {
      if (['rtd', 'ho3l', 'handed'].indexOf(b.stage) < 0 || b.parent || M.relOfBatch(b.id)) return;
      S().rel.push({ id: nid('rel', 'REL-2610-', 3), src: 'prod', batch: b.id, st: 'waiting', readyAt: b.rtdAt ? b.rtdAt[0] : nowS(), hold: null, relAt: null, relBy: null, dlv: null, ovr: null }); ch = true;
    });
    return ch;
  }
  M.sync = function () { var ch = autoRel(); S().dlv.forEach(function (d) { if (syncOne(d)) ch = true; }); if (ch) save(); return ch; };
  // Live display status (§9): Near Destination comes from the Phase 7 ETA, never stored.
  M.status = function (d) {
    if (d.st === 'ontheway' && d.ord && LG) { var o = LG.order(d.ord); if (o && o.st === 'ontheway' && LG.tripStatus(o) === 'near') return 'near'; }
    return d.st;
  };
  M.eta = function (d) { var o = ordOf(d); return o && LG ? LG.eta(o) : null; };
  M.late = function (d) { var e = M.eta(d); return !!(e && e.late && M.ACTIVE.indexOf(d.st) >= 0); };

  /* ---------- NP-01 Ready to Deliver Release (§4–§7) ---------- */
  // One view over a release, live from the Phase 8 batch or from the closed production snapshot.
  M.relView = function (r) {
    if (!r) return null;
    if (r.src !== 'prod') {
      var due = r.date && r.win ? r.date + ' ' + r.win[1] : null;
      return { id: r.id, r: r, batch: r.batch, cl: r.cl, prop: r.prop, svc: r.svc, ord: r.dlv ? (M.dlv(r.dlv) || {}).ord || null : null, qty: r.qty, kg: r.kg, pkgs: r.pkgs, date: r.date, win: r.win, pri: r.pri, sla: due, instr: r.instr, qcSt: r.qc, packed: r.pack, label: r.label, live: false };
    }
    var b = M.batch(r.batch); if (!b) return null;
    var o = M.order(b.dlv), pk = b.pack ? b.pack.pkgs : [];
    return { id: r.id, r: r, b: b, batch: b.id, cl: b.cl, prop: b.prop, svc: o ? o.svc : 'SV-006', ord: o ? o.id : null, o: o, qty: PR.packedQty(b), kg: r1(sum(pk.map(function (p) { return p.kg; }))), pkgs: pk.length,
      date: o ? o.date : (b.sla ? b.sla.slice(0, 10) : M.TODAY), win: o ? o.win.slice() : null, pri: b.pri, sla: b.sla, instr: o && o.instr ? L(o.instr, o.instr) : '', qcSt: b.qc ? b.qc.res : null, packed: !!b.pack, label: !!(b.pack && b.pack.label), live: true, rec: PR.reconcile(b) };
  };
  M.relChecks = function (r) {
    var v = M.relView(r); if (!v) return [];
    var out = {}, crit;
    if (v.live) {
      var b = v.b, rec = v.rec;
      out.qc = [!!(b.qc && b.qc.pass > 0 && (b.qc.res === 'pass' || (b.qc.res === 'partial' && rec.ok))), b.qc ? T(L('QC ', 'QC ')) + b.qc.res + ' · ' + b.qc.pass + '/' + (b.qc.qty || b.pcs) + ' pcs' : T(L('Belum QC', 'No QC yet'))];
      out.qty = [!!(b.pack && b.qc && PR.packedQty(b) === b.qc.pass), v.qty + ' / ' + (b.qc ? b.qc.pass : '—') + ' pcs'];
      out.pkgs = [!!(b.pack && v.pkgs > 0 && (rec.ok || b.recOvr)), v.pkgs + ' ' + T(L('paket', 'packages')) + (rec.ok ? '' : ' · ' + rec.gaps.map(T).join(' '))];
      crit = PR.state().issues.filter(function (i) { return i.batch === b.id && i.st !== 'resolved' && (i.sev === 'crit' || i.sev === 'high'); });
      out.crit = [!crit.length, crit.length ? crit.map(function (i) { return i.id; }).join(', ') : T(L('Tidak ada', 'None'))];
    } else {
      out.qc = [r.qc === 'pass', r.qc === 'pass' ? T(L('Lulus', 'Passed')) : T(L('QC sebagian, ada re-check', 'Partial QC, re-check open'))];
      out.qty = [!!r.pack, r.qty + ' pcs'];
      out.pkgs = [!!r.pkgOk && r.pkgs > 0, r.pkgs + ' ' + T(L('paket', 'packages'))];
      out.crit = [!r.critIss, r.critIss ? T(r.issue || L('Ada masalah kritis', 'Critical issue open')) : T(L('Tidak ada', 'None'))];
    }
    out.label = [!!v.label, v.label ? T(L('Label + QR terpasang', 'Label + QR attached')) : T(L('Belum dikonfirmasi', 'Not confirmed'))];
    var p = M.prop(v.prop);
    out.client = [!!(p && p.cl === v.cl && M.client(v.cl)), M.clientName(v.cl)];
    out.prop = [!!(p && p.status === 'active'), M.propName(v.prop)];
    out.order = [v.live ? !!(v.o && v.o.kind === 'delivery' && v.o.prop === v.prop && v.o.cl === v.cl) : true, v.ord || (v.live ? T(L('Tidak ada order delivery', 'No delivery order')) : T(L('Dibuat saat release', 'Created at release')))];
    var dOk = !!v.date && v.date >= M.TODAY, wOk = !!(v.win && v.win[0] < v.win[1] && (v.date > M.TODAY || ms(v.date + ' ' + v.win[1]) > M.now()));
    out.date = [dOk, v.date || '—'];
    out.win = [wOk, v.win ? v.win.join('–') : '—'];
    out.sla = [!!v.sla, v.sla || '—'];
    out.instr = [true, T(v.instr) || T(L('Tidak ada instruksi khusus', 'No special instruction'))];
    return M.REL_CHECKS.map(function (c) { var x = out[c[0]]; return { k: c[0], n: c[1], kind: c[2], ok: x[0], v: x[1] }; });
  };
  M.relSt = function (r) {
    if (['hold', 'issue', 'released'].indexOf(r.st) >= 0) return r.st;
    return M.relChecks(r).every(function (c) { return c.ok; }) ? 'ready' : 'waiting';
  };
  M.releases = function (ctx, f) {
    f = f || {};
    if (!can(ctx, 'dlv.release.view')) return [];
    M.sync();
    return S().rel.filter(function (r) { var s0 = M.relSt(r); return M.relView(r) && (!f.st || (f.st === 'open' ? s0 !== 'released' : s0 === f.st)); })
      .sort(function (a, b) { var va = M.relView(a), vb = M.relView(b); return (M.relSt(a) === 'released') - (M.relSt(b) === 'released') || String(va.date + (va.win ? va.win[0] : '')).localeCompare(vb.date + (vb.win ? vb.win[0] : '')); });
  };
  function relGuard(ctx, id) { var r = M.rel(id); if (!r) return { e: bad(M.MSG.notfound, 'notfound') }; if (!can(ctx, 'dlv.release')) return { e: deny(ctx, id) }; return { r: r }; }
  /* RELEASE KE LOGISTICS (§6–§7): every check passes, or an authorised override with a reason for the four that allow it. */
  M.release = function (ctx, id, f) {
    f = f || {};
    var g = relGuard(ctx, id); if (g.e) return g.e; var r = g.r;
    var s0 = M.relSt(r);
    if (s0 === 'released') return bad(L('Sudah di-release.', 'Already released.'), 'done');
    if (s0 === 'hold') return bad(L('Lepas hold dulu sebelum release.', 'Release the hold first.'), 'hold');
    if (s0 === 'issue') return bad(L('Selesaikan masalah dulu sebelum release.', 'Resolve the issue first.'), 'issue');
    var chk = M.relChecks(r), fail = chk.filter(function (c) { return !c.ok; });
    var hard = fail.filter(function (c) { return c.kind !== 'ovr'; });
    if (hard.length) return bad(L('Belum bisa release: ' + hard.map(function (c) { return T(c.n); }).join(', ') + '.', 'Cannot release yet: ' + hard.map(function (c) { return c.n[1]; }).join(', ') + '.'), 'check', { fail: hard });
    if (fail.length) {
      if (!can(ctx, 'dlv.override')) return bad(L('Perlu override supervisor: ' + fail.map(function (c) { return T(c.n); }).join(', ') + '.', 'Supervisor override needed: ' + fail.map(function (c) { return c.n[1]; }).join(', ') + '.'), 'override', { fail: fail });
      if (!str(f.reason)) return bad(M.MSG.reason, 'reason', { fail: fail });
    }
    var v = M.relView(r);
    r.relAt = nowS(); r.relBy = empId(ctx); r.st = 'released';
    if (fail.length) { r.ovr = { by: empId(ctx), name: ctx.fullName || ctx.name || null, role: ctx.roleKey || null, reason: str(f.reason), at: r.relAt, approval: T(L('Override supervisor', 'Supervisor override')), ord: v.ord, gaps: fail.map(function (c) { return c.k; }) }; M.audit('OVERRIDE', ctx, { rec: r.id, to: fail.map(function (c) { return c.k; }).join(','), reason: f.reason }); }
    M.audit('RELEASE.LOGISTICS', ctx, { rec: r.id, to: v.ord || v.batch, reason: fail.length ? f.reason : null });
    var d = createDelivery(ctx, r, v);
    save();
    return { ok: true, rel: r, dlv: d };
  };
  M.holdRel = function (ctx, id, reason) { var g = relGuard(ctx, id); if (g.e) return g.e; var r = g.r; if (r.st === 'released') return bad(M.MSG.jump, 'jump'); if (!str(reason)) return bad(M.MSG.reason, 'reason'); r.prev = r.st === 'hold' ? r.prev : r.st; r.st = 'hold'; r.hold = { by: empId(ctx), at: nowS(), reason: L(str(reason), str(reason)) }; M.audit('RELEASE.HOLD', ctx, { rec: id, reason: reason }); save(); return { ok: true, rel: r }; };
  M.unholdRel = function (ctx, id, note) { var g = relGuard(ctx, id); if (g.e) return g.e; var r = g.r; if (r.st !== 'hold') return bad(M.MSG.jump, 'jump'); if (!str(note)) return bad(M.MSG.reason, 'reason'); r.st = 'waiting'; if (r.hold) r.hold.off = { by: empId(ctx), at: nowS(), note: str(note) }; M.audit('RELEASE.UNHOLD', ctx, { rec: id, reason: note }); save(); return { ok: true, rel: r }; };
  M.relIssue = function (ctx, id, f) {
    var g = relGuard(ctx, id); if (g.e) return g.e; var r = g.r; f = f || {};
    if (r.st === 'released') return bad(M.MSG.jump, 'jump'); if (!str(f.note)) return bad(L('Tulis apa masalahnya.', 'Describe the issue.'), 'note');
    r.st = 'issue'; r.critIss = f.sev !== 'warn'; r.issue = L(str(f.note), str(f.note)); r.issAt = nowS(); r.issBy = empId(ctx); r.issPhoto = f.photo || null;
    M.audit('ISSUE.CREATE', ctx, { rec: id, to: 'release', reason: f.note }); if (r.critIss) notify('sup', 'crit', null, { ref: id, txt: f.note });
    save(); return { ok: true, rel: r };
  };
  M.resolveRelIssue = function (ctx, id, note) { var g = relGuard(ctx, id); if (g.e) return g.e; var r = g.r; if (r.st !== 'issue') return bad(M.MSG.jump, 'jump'); if (!str(note)) return bad(M.MSG.reason, 'reason'); r.st = 'waiting'; r.critIss = false; r.issRes = { by: empId(ctx), at: nowS(), note: str(note) }; M.audit('ISSUE.RESOLVE', ctx, { rec: id, reason: note }); save(); return { ok: true, rel: r }; };
  M.confirmLabel = function (ctx, id) { var g = relGuard(ctx, id); if (g.e) return g.e; var r = g.r; if (r.src === 'prod') return bad(M.MSG.jump, 'jump'); r.label = true; r.labelBy = empId(ctx); r.labelAt = nowS(); M.audit('RELEASE.LABEL', ctx, { rec: id, to: 'label' }); save(); return { ok: true, rel: r }; };
  M.setRelWindow = function (ctx, id, date, win, reason) {
    var g = relGuard(ctx, id); if (g.e) return g.e; var r = g.r;
    if (r.src === 'prod') return bad(L('Ubah jadwal di order delivery (Dispatch).', 'Change the schedule on the delivery order (Dispatch).'), 'jump');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date || '') || date < M.TODAY || !win || !(win[0] < win[1])) return bad(L('Tanggal dan jam tidak valid.', 'Invalid date or time.'), 'win');
    if (!str(reason)) return bad(M.MSG.reason, 'reason');
    var from = r.date + ' ' + r.win.join('–'); r.date = date; r.win = [win[0], win[1]];
    M.audit('RELEASE.WINDOW', ctx, { rec: id, from: from, to: date + ' ' + win.join('–'), reason: reason }); save(); return { ok: true, rel: r };
  };

  /* ---------- NP-02 Delivery task & dispatch (§8–§10) ---------- */
  function slaOf(d, actual) {
    var promised = d.date + ' ' + d.win[1];
    if (!actual) return { promised: promised, actual: null, min: null, st: 'pending' };
    var m0 = Math.round((ms(actual) - ms(promised)) / MIN), o = ordOf(d);
    return { promised: promised, actual: actual, min: m0, st: m0 <= S().cfg.slaTol ? 'ontime' : 'late', cause: m0 > S().cfg.slaTol ? (o && o.delayR) || 'other' : null };
  }
  M.slaOf = slaOf;
  function createDelivery(ctx, r, v) {
    var o = v.o || null, ct = o && o.ct ? o.ct : (M.prop(v.prop) || {}).pic || null;
    var d = { id: nid('dlv', 'DLV-2610-', 3), rel: r.id, ord: v.ord, batch: v.batch, cl: v.cl, prop: v.prop, svc: v.svc, date: v.date, win: v.win.slice(), pkgs: v.pkgs, qty: v.qty, kg: v.kg, pri: v.pri || 'normal', instr: v.instr || '', ct: ct,
      drv: null, veh: null, route: null, st: 'waiting', ev: [['waiting', nowS(), empId(ctx), null]], created: [nowS(), empId(ctx)], ho: null, pod: null, rec: null, issues: [], ret: null, orig: null, redel: null, sla: null, comp: null, bill: null, fb: null, attempt: 1, hold: null };
    S().dlv.push(d); r.dlv = d.id;
    if (o) { o.bags = d.pkgs; o.kg = d.kg; if (LG.save) LG.save(); }
    else linkOrder(d, T(L('Release ', 'Release ')) + r.id);
    M.audit('DELIVERY.CREATE', ctx, { dlv: d.id, rec: d.id, to: (d.ord || '—') + ' · ' + d.pkgs + ' ' + T(L('paket', 'packages')) });
    notify(d.cl, 'sched', d, { date: d.date, win: d.win.join('–') });
    syncOne(d);
    return d;
  }
  // The delivery runs on a Phase 7 order; when there is none yet, the engine opens one (never a second tracker).
  function linkOrder(d, reason) {
    if (d.ord || !LG || !LG.createOrder) return d.ord ? { ok: true } : bad(M.MSG.sync, 'sync');
    var r = LG.createOrder(sysPerms(), { prop: d.prop, kind: 'delivery', date: d.date, win: d.win, bags: Math.max(1, d.pkgs), kg: d.kg, svc: d.svc, pri: M.PRI[d.pri] ? d.pri : 'normal', ct: d.ct, instr: T(d.instr), src: 'manual' }, { force: true, reason: reason || d.id });
    if (!r.ok) return r;
    d.ord = r.order.id; r.order.d9 = d.id; if (LG.save) LG.save();
    return { ok: true, order: r.order };
  }
  M.dispatchLink = function (ctx, id) {
    var d = M.dlv(id); if (!d) return bad(M.MSG.notfound, 'notfound'); if (!can(ctx, 'dlv.dispatch')) return deny(ctx, id);
    if (d.hold) return bad(M.MSG.held, 'hold');
    if (['waiting', 'assigned', 'ready'].indexOf(d.st) < 0) return bad(M.MSG.jump, 'jump');
    var r = linkOrder(d, T(L('Dispatch ', 'Dispatch ')) + d.id); if (!r.ok) return r;
    save(); return { ok: true, dlv: d, ord: d.ord };
  };
  M.deliveries = function (ctx, f) {
    f = f || {};
    M.sync();
    return S().dlv.filter(function (d) {
      if (!M.canSee(ctx, d)) return false;
      var s0 = M.status(d);
      if (f.st && (f.st === 'active' ? M.ACTIVE.indexOf(s0) < 0 : f.st === 'open' ? ['completed', 'cancelled'].indexOf(s0) >= 0 : s0 !== f.st && !(f.st === 'ontheway' && s0 === 'near'))) return false;
      if (f.date && d.date !== f.date) return false;
      if (f.cl && d.cl !== f.cl) return false;
      if (f.drv && M.driverOf(d) !== f.drv) return false;
      if (f.q) { var q = f.q.toLowerCase(); if ([d.id, d.ord, d.oref, M.clientName(d.cl), M.propName(d.prop)].join(' ').toLowerCase().indexOf(q) < 0) return false; }
      return true;
    }).sort(function (a, b) { return a.date.localeCompare(b.date) || a.win[0].localeCompare(b.win[0]) || M.priRank(b.pri) - M.priRank(a.pri); });
  };
  // The board lanes (§9) for today.
  M.LANES = [['waiting', L('Menunggu Dispatch', 'Waiting Dispatch'), 'inbox'], ['assigned', L('Ditugaskan / Siap', 'Assigned / Ready'), 'user'], ['moving', L('Di Jalan', 'On The Way'), 'truck'], ['site', L('Di Lokasi', 'At Client'), 'flag'], ['delivered', L('Terkirim', 'Delivered'), 'checkc'], ['exception', L('Masalah / Return', 'Issue / Return'), 'alert']];
  M.laneOf = function (d) { var s0 = M.status(d); return s0 === 'waiting' ? 'waiting' : s0 === 'assigned' || s0 === 'ready' ? 'assigned' : s0 === 'ontheway' || s0 === 'near' ? 'moving' : s0 === 'arrived' || s0 === 'handover' ? 'site' : s0 === 'delivered' || s0 === 'completed' ? 'delivered' : 'exception'; };
  M.board = function (ctx, date) {
    var list = M.deliveries(ctx, { date: date || M.TODAY }), out = {};
    M.LANES.forEach(function (l) { out[l[0]] = []; });
    list.forEach(function (d) { if (d.st !== 'cancelled') out[M.laneOf(d)].push(d); });
    return out;
  };
  M.attention = function (ctx) {
    var out = [], now = M.now();
    function add(sev, kind, txt, d, x) { out.push(Object.assign({ sev: sev, kind: kind, txt: txt, dlv: d ? d.id : null }, x || {})); }
    M.deliveries(ctx, {}).forEach(function (d) {
      var s0 = M.status(d), start = ms(d.date + ' ' + d.win[0]);
      if (s0 === 'waiting' && d.date === M.TODAY && start - now < 120 * MIN) add(start < now ? 'crit' : 'warn', 'nodrv', L(M.propName(d.prop) + ' ' + d.win.join('–'), M.propName(d.prop) + ' ' + d.win.join('–')), d);
      if (d.hold) add('warn', 'hold', L(M.propName(d.prop) + ': ' + T(d.hold.reason), M.propName(d.prop) + ': ' + d.hold.reason[1]), d);
      if (M.late(d)) { var e = M.eta(d); add(e.delay >= 30 ? 'crit' : 'warn', 'delay', L('Terlambat ± ' + e.delay + ' menit · ' + M.propName(d.prop), 'Late by ~' + e.delay + ' min · ' + M.propName(d.prop)), d); }
      if (d.rec && d.rec.review === 'pending') add('crit', 'recdiff', L('Menunggu review supervisor · ' + M.propName(d.prop), 'Difference waiting for review · ' + M.propName(d.prop)), d);
      if ((s0 === 'delivered' || s0 === 'completed') && !d.pod) add('crit', 'podmiss', L('POD belum ada · ' + d.id, 'POD missing · ' + d.id), d);
      if (s0 === 'delivered' && d.pod && M.compChecks(d).every(function (c) { return c.ok; })) add('info', 'complete', L('Semua syarat terpenuhi · ' + M.propName(d.prop), 'Every condition met · ' + M.propName(d.prop)), d);
    });
    if (can(ctx, 'dlv.return') || can(ctx, 'dlv.return.receive')) S().rets.filter(function (r) { return ['arrived', 'review', 'ready'].indexOf(r.st) >= 0; }).forEach(function (r) { add(r.st === 'ready' ? 'info' : 'warn', 'ret', L('Return ' + r.id + ' · ' + T(M.RET_ST[r.st][0]), 'Return ' + r.id + ' · ' + M.RET_ST[r.st][0][1]), null, { ret: r.id }); });
    if (can(ctx, 'dlv.release.view')) M.releases(ctx, { st: 'ready' }).forEach(function (r) { var v = M.relView(r); add('info', 'rel', L(r.id + ' · ' + M.propName(v.prop), r.id + ' · ' + M.propName(v.prop)), null, { rel: r.id }); });
    var R = { crit: 3, warn: 2, info: 1 };
    return out.sort(function (a, b) { return R[b.sev] - R[a.sev]; });
  };
  M.ATT_KIND = { nodrv: L('Belum ada driver', 'No driver'), hold: L('Ditahan', 'On hold'), delay: L('Terlambat', 'Late'), recdiff: L('Selisih', 'Difference'), podmiss: L('POD belum ada', 'POD missing'), complete: L('Siap selesai', 'Ready to complete'), ret: L('Return', 'Return'), rel: L('Siap release', 'Ready to release') };
  M.setWindow = function (ctx, id, date, win, reason) {
    var d = M.dlv(id); if (!d) return bad(M.MSG.notfound, 'notfound'); if (!can(ctx, 'dlv.dispatch')) return deny(ctx, id);
    if (['waiting', 'assigned', 'ready'].indexOf(d.st) < 0) return bad(M.MSG.jump, 'jump');
    if (!str(reason)) return bad(M.MSG.reason, 'reason');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date || '') || date < M.TODAY || !win || !(win[0] < win[1])) return bad(L('Tanggal dan jam tidak valid.', 'Invalid date or time.'), 'win');
    var from = d.date + ' ' + d.win.join('–');
    if (d.ord) { var r = LG.reschedule(ctx, d.ord, date, win, reason); if (!r.ok) return r; }
    d.date = date; d.win = [win[0], win[1]];
    M.audit('DELIVERY.WINDOW', ctx, { dlv: id, rec: id, from: from, to: date + ' ' + win.join('–'), reason: reason });
    notify(d.cl, 'sched', d, { date: date, win: win.join('–') });
    save(); return { ok: true, dlv: d };
  };
  M.holdDlv = function (ctx, id, reason) {
    var d = M.dlv(id); if (!d) return bad(M.MSG.notfound, 'notfound'); if (!can(ctx, 'dlv.dispatch')) return deny(ctx, id);
    M.sync(); if (['waiting', 'assigned', 'ready'].indexOf(d.st) < 0) return bad(L('Delivery sudah berjalan, tidak bisa ditahan.', 'The delivery is already running and cannot be held.'), 'jump');
    if (!str(reason)) return bad(M.MSG.reason, 'reason');
    d.hold = { by: empId(ctx), at: nowS(), reason: L(str(reason), str(reason)) }; M.audit('DELIVERY.HOLD', ctx, { dlv: id, rec: id, reason: reason }); save(); return { ok: true, dlv: d };
  };
  M.unholdDlv = function (ctx, id, note) { var d = M.dlv(id); if (!d) return bad(M.MSG.notfound, 'notfound'); if (!can(ctx, 'dlv.dispatch')) return deny(ctx, id); if (!d.hold) return bad(M.MSG.jump, 'jump'); d.hold = null; M.audit('DELIVERY.UNHOLD', ctx, { dlv: id, rec: id, reason: note || null }); save(); return { ok: true, dlv: d }; };
  M.cancelDlv = function (ctx, id, reason) {
    var d = M.dlv(id); if (!d) return bad(M.MSG.notfound, 'notfound'); if (!can(ctx, 'dlv.dispatch')) return deny(ctx, id);
    M.sync(); if (['waiting', 'assigned', 'ready'].indexOf(d.st) < 0) return bad(M.MSG.jump, 'jump');
    if (!str(reason)) return bad(M.MSG.reason, 'reason');
    if (d.ord) { var o = LG.order(d.ord); if (o && o.st !== 'cancelled') { var r = LG.setStatus(ctx, d.ord, 'cancelled', { reason: reason }); if (!r.ok) return r; } }
    d.st = 'cancelled'; d.ev.push(['cancelled', nowS(), empId(ctx), L(str(reason), str(reason))]);
    M.audit('DELIVERY.CANCEL', ctx, { dlv: id, rec: id, reason: reason }); save(); return { ok: true, dlv: d };
  };
  // Phase 7 guard: a delivery order cannot leave the plant before release, or while held (§7, §84).
  M.gate = function (ordId) {
    var d = M.byOrd(ordId);
    if (d) { if (d.hold) return M.MSG.held; if (d.rel) { var r = M.rel(d.rel); if (r && r.st !== 'released') return M.MSG.notrel; } return null; }
    if (!PR || !PR.state) return null;
    var b = PR.state().batches.filter(function (x) { return x.dlv === ordId && !x.parent; })[0]; if (!b) return null;
    if (PR.stageIdx(b.stage) < PR.stageIdx('rtd') && b.stage !== 'handed') return M.MSG.notready;
    var rl = M.relOfBatch(b.id); if (!rl || rl.st !== 'released') return M.MSG.notrel;
    return null;
  };

  /* ---------- NP-03 Client delivery view (§11–§13, §33, §65) ---------- */
  M.clientDeliveries = function (ctx) {
    if (!isClient(ctx) || !can(ctx, 'dlv.track.own')) return [];
    var from = addDays(M.TODAY, -3);
    return M.deliveries(ctx, {}).filter(function (d) { return d.date >= from && d.st !== 'cancelled'; }).sort(function (a, b) { var A0 = M.ACTIVE.indexOf(M.status(a)) >= 0, B0 = M.ACTIVE.indexOf(M.status(b)) >= 0; return (B0 - A0) || b.date.localeCompare(a.date) || a.win[0].localeCompare(b.win[0]); });
  };
  M.clientStep = function (d) { var s0 = M.status(d); return { waiting: 0, assigned: 1, ready: 1, ontheway: 2, near: 3, arrived: 4, handover: 4, delivered: 5, completed: 5 }[s0]; };
  M.clientView = function (ctx, id) {
    var d = M.dlv(id); if (!d || !isClient(ctx) || d.cl !== ctx.client || !can(ctx, 'dlv.track.own')) return null;
    M.sync();
    var o = ordOf(d), tr = o && LG ? LG.clientTrack(ctx, o.id) : null, s0 = M.status(d);
    return { d: d, st: s0, step: M.clientStep(d), track: tr, eta: tr ? tr.eta : null, live: !!(tr && tr.live), driver: tr ? tr.driver : null, plate: tr ? tr.plate : null,
      pod: d.pod ? { recv: d.pod.recv, at: d.pod.at, pkgs: M.podView(d.pod).pkgs, cond: M.podView(d.pod).cond, id: d.pod.id } : null, sla: d.sla, done: d.st === 'completed', fb: d.fb ? M.feedback(d.fb) : null,
      canRate: d.st === 'completed' && !d.fb && can(ctx, 'dlv.feedback'), canIssue: ['delivered', 'completed'].indexOf(d.st) >= 0 && can(ctx, 'dlv.issue.report') };
  };

  /* ---------- NP-04 Delivery handover & NP-05 POD (§14–§19) ---------- */
  M.driverDeliveries = function (ctx) {
    if (!can(ctx, 'dlv.drv')) return [];
    return M.deliveries(ctx, {}).filter(function (d) { return d.date === M.TODAY || M.ACTIVE.indexOf(M.status(d)) >= 0; });
  };
  M.hoStart = function (ctx, id) {
    var d = M.dlv(id), e = ownDrv(ctx, d); if (e) return e;
    M.sync(); var o = ordOf(d); if (!o) return bad(M.MSG.sync, 'sync');
    if (d.ho && d.ho.start) return { ok: true, dlv: d };
    if (['arrived', 'inprogress'].indexOf(o.st) < 0) return bad(L('Tekan SAYA SUDAH TIBA dulu.', 'Tap SAYA SUDAH TIBA first.'), 'jump');
    var r = LG.beginExec(ctx, o.id); if (!r.ok) return r;
    d.ho = { start: nowS(), arr: LG.evAt(o, 'arrived'), by: empId(ctx), verified: false };
    syncOne(d); M.audit('HANDOVER.START', ctx, { dlv: id, rec: id, to: M.propName(d.prop) }); save();
    return { ok: true, dlv: d };
  };
  /* Verify (§16): property, recipient, package count, visible condition → LANJUT KE KONFIRMASI. */
  M.hoVerify = function (ctx, id, f) {
    var d = M.dlv(id), e = ownDrv(ctx, d); if (e) return e; f = f || {};
    if (!d.ho || !d.ho.start) return bad(M.MSG.jump, 'jump');
    if (d.pod) return bad(L('POD sudah tersimpan.', 'The POD is already saved.'), 'done');
    if (!f.prop) return bad(L('Pastikan property benar. Jika salah, pilih ADA MASALAH · Property Salah.', 'Confirm the property. If it is wrong, choose ADA MASALAH · Wrong Property.'), 'prop');
    if (!str(f.recv)) return bad(L('Isi nama penerima.', 'Enter the recipient name.'), 'recv');
    var pk = Math.round(+f.pkgs); if (!(pk >= 0 && pk <= 99) || f.pkgs === '' || f.pkgs == null) return bad(L('Isi jumlah paket yang diterima.', 'Enter the packages received.'), 'pkgs');
    var cond = M.COND[f.cond] ? f.cond : 'good';
    if (cond !== 'good' && !str(f.notes)) return bad(L('Kondisi tidak baik: tulis catatan.', 'Condition is not good: write a note.'), 'notes');
    Object.assign(d.ho, { recv: str(f.recv), role: str(f.role), pkgs: pk, cond: cond, notes: str(f.notes), at: nowS(), verified: true });
    save();
    return { ok: true, dlv: d, match: pk === d.pkgs && cond === 'good' };
  };
  function lgCond(c) { return c === 'damaged' ? 'damaged' : 'good'; }
  /* KONFIRMASI PENERIMAAN (§18): signature + photo → Phase 7 completes the trip stop → POD TERSIMPAN → reconciliation (§20–§23). */
  M.podConfirm = function (ctx, id, f) {
    var d = M.dlv(id), e = ownDrv(ctx, d); if (e) return e; f = f || {};
    if (!d.ord) return bad(L('POD wajib punya order dan delivery.', 'A POD needs an order and a delivery.'), 'ref');
    if (d.pod) return bad(L('POD sudah tersimpan.', 'The POD is already saved.'), 'done');
    if (!d.ho || !d.ho.verified) return bad(L('Selesaikan verifikasi serah terima dulu.', 'Finish the handover verification first.'), 'jump');
    if (!f.sign) return bad(M.MSG.sign, 'sign');
    if (!f.photo) return bad(L('Ambil foto bukti pengiriman.', 'Take a delivery photo.'), 'photo');
    var ho = d.ho, qty = f.qty === '' || f.qty == null ? (ho.pkgs === d.pkgs ? d.qty : null) : Math.round(+f.qty), kg = f.kg === '' || f.kg == null ? (ho.pkgs === d.pkgs ? d.kg : null) : +f.kg;
    var diff = ho.pkgs !== d.pkgs || (qty != null && qty !== d.qty) || ho.cond === 'damaged' || ho.cond === 'partial';
    var rc = f.rec || {};
    if (diff) {
      if (!M.REC_TYPES[rc.type]) return bad(L('Pilih jenis selisih.', 'Choose the difference type.'), 'type');
      if (!str(rc.reason)) return bad(L('Tulis alasan selisih.', 'Write the reason for the difference.'), 'reason');
      if (!rc.photo) return bad(M.MSG.photo, 'photo');
      if (!M.ACC[rc.acc]) return bad(L('Pilih keputusan penerimaan.', 'Choose the acceptance decision.'), 'acc');
      if (rc.acc === 'reject') return bad(L('Untuk TOLAK pilih ADA MASALAH · Klien Menolak, barang dibawa kembali.', 'For REJECT choose ADA MASALAH · Client Rejects, the goods go back.'), 'reject');
      if (rc.acc === 'partial') { var a = Math.round(+rc.accQty), j = Math.round(+rc.rejQty); if (!(a >= 0) || !(j >= 0) || a + j <= 0) return bad(L('Isi qty diterima dan ditolak.', 'Enter the accepted and rejected quantity.'), 'qty'); }
      if (qty == null) qty = rc.acc === 'partial' ? Math.round(+rc.accQty) + Math.round(+rc.rejQty) : d.qty;
    }
    var o = LG.order(d.ord);
    var lr = LG.confirmDelivery(ctx, d.ord, { recv: ho.recv, bags: ho.pkgs, pkg: ho.pkgs, sign: f.sign, photo: f.photo, cond: lgCond(ho.cond), issue: ho.pkgs !== o.bags ? T(rc.reason || L('Selisih paket', 'Package difference')) : '' });
    if (!lr.ok) return lr.code === 'noperm' ? lr : bad(lr.msg || M.MSG.podFail, lr.code || 'pod');
    var at = nowS();
    d.pod = { id: nid('pod', 'POD-2610-', 3), recv: ho.recv, role: ho.role, sign: f.sign, photo: f.photo, at: at, loc: f.loc !== false, pkgs: ho.pkgs, qty: qty, kg: kg, cond: ho.cond, notes: ho.notes, by: empId(ctx), ver: 1, amend: [], ref: 'JFRESH|POD|' + d.id + '|' + d.ord };
    d.ev.push(['delivered', at, empId(ctx), null]); d.st = 'delivered'; d.sla = slaOf(d, at);
    M.audit('POD.CAPTURE', ctx, { dlv: id, rec: d.pod.id, to: ho.recv + ' · ' + ho.pkgs + ' ' + T(L('paket', 'pkg')) });
    if (!diff) {
      d.rec = { res: 'ok', at: at, by: 'system', sent: { pkgs: d.pkgs, qty: d.qty, kg: d.kg }, recv: { pkgs: ho.pkgs, qty: qty, kg: kg }, acc: 'full', accQty: d.qty, rejQty: 0, review: null };
      M.audit('RECON.COMPLETE', ctx, { dlv: id, rec: id, to: 'SESUAI' });
    } else recDiff(ctx, d, rc, qty, kg, at);
    save();
    return { ok: true, dlv: d, pod: d.pod, rec: d.rec };
  };
  function needReview(d, rc, qty) {
    var c = S().cfg, pk = Math.abs(d.pod.pkgs - d.pkgs), qd = qty == null ? 0 : Math.abs(qty - d.qty);
    return ['missing', 'damaged', 'wrong'].indexOf(rc.type) >= 0 || pk >= c.recReviewPkgs || qd > c.recTol || (rc.acc === 'partial' && +rc.rejQty > c.recTol);
  }
  function recDiff(ctx, d, rc, qty, kg, at) {
    var acc = rc.acc || 'full', accQty = acc === 'partial' ? Math.round(+rc.accQty) : qty, rejQty = acc === 'partial' ? Math.round(+rc.rejQty) : 0;
    d.rec = { res: 'diff', at: at, by: empId(ctx), sent: { pkgs: d.pkgs, qty: d.qty, kg: d.kg }, recv: { pkgs: d.pod.pkgs, qty: qty, kg: kg }, type: rc.type, reason: L(str(rc.reason), str(rc.reason)), notes: str(rc.notes), photo: rc.photo, pic: d.pod.recv,
      acc: acc, accQty: accQty, rejQty: rejQty, retReq: !!rc.retReq, review: needReview(d, rc, qty) ? 'pending' : 'client' };
    var tp = { missing: 'missing', extra: 'other', qty: 'qty', wrong: 'wrongitem', damaged: 'damaged', other: 'other' }[rc.type];
    var i = newIssue(ctx, d, { type: tp, sev: ['missing', 'damaged'].indexOf(rc.type) >= 0 ? 'crit' : 'warn', note: rc.reason, photo: rc.photo, action: acc === 'partial' ? 'partial' : 'review', src: 'driver' });
    i.st = d.rec.review === 'pending' ? 'review' : 'resolved'; if (i.st === 'resolved') { i.res = L('Diterima PIC klien saat serah terima.', 'Accepted by the client PIC at handover.'); i.resAt = at; i.resBy = empId(ctx); }
    if (d.rec.review === 'pending') { d.st = 'issue'; d.ev.push(['issue', at, empId(ctx), L(T(M.REC_TYPES[rc.type]), M.REC_TYPES[rc.type][1])]); notify('sup', 'recdiff', d, { from: d.pkgs, to: d.pod.pkgs }); }
    M.audit('RECON.DIFF', ctx, { dlv: d.id, rec: d.id, from: d.pkgs + ' / ' + d.qty, to: d.pod.pkgs + ' / ' + qty, reason: rc.reason });
    if (acc === 'partial' && rc.retReq && rejQty > 0) { var r = createReturn(ctx, d, { reason: rc.type === 'damaged' ? 'damaged' : 'quality', note: rc.reason, photo: rc.photo, pkgs: 1, qty: rejQty, kg: d.kg && d.qty ? r1(d.kg * rejQty / d.qty) : null, need: 'reprocess', issue: i.id }); i.ret = r.id; }
  }
  // POD view with amendments applied; the original stays as captured (§19).
  M.podView = function (p) {
    if (!p) return null;
    var v = Object.assign({}, p);
    (p.amend || []).forEach(function (a) { v[a.field] = a.to; });
    return v;
  };
  M.POD_FIELDS = { recv: L('Nama penerima', 'Recipient name'), role: L('Jabatan penerima', 'Recipient role'), pkgs: L('Jumlah paket', 'Package count'), qty: L('Jumlah item', 'Quantity'), kg: L('Berat', 'Weight'), cond: L('Kondisi', 'Condition'), notes: L('Catatan', 'Notes') };
  M.amendPod = function (ctx, id, f) {
    var d = M.dlv(id); if (!d || !d.pod) return bad(M.MSG.notfound, 'notfound');
    if (!can(ctx, 'dlv.pod.amend')) return deny(ctx, id);
    f = f || {}; if (!M.POD_FIELDS[f.field]) return bad(L('Pilih data yang dikoreksi.', 'Choose the field to correct.'), 'field');
    if (!str(f.reason)) return bad(M.MSG.reason, 'reason');
    if (d.comp && d.comp.frozen) return bad(L('Service sudah completed. Koreksi lewat amandemen completion.', 'Service is completed. Correct it with a completion amendment.'), 'frozen');
    var cur = M.podView(d.pod)[f.field], to = ['pkgs', 'qty'].indexOf(f.field) >= 0 ? Math.round(+f.value) : f.field === 'kg' ? +f.value : str(f.value);
    if ((['pkgs', 'qty', 'kg'].indexOf(f.field) >= 0 && !(to >= 0)) || (f.field === 'cond' && !M.COND[to]) || (f.field === 'recv' && !to)) return bad(M.MSG.invalid);
    d.pod.amend.push({ n: d.pod.amend.length + 1, field: f.field, from: cur, to: to, reason: str(f.reason), by: empId(ctx), at: nowS() }); d.pod.ver = d.pod.amend.length + 1;
    M.audit('POD.AMEND', ctx, { dlv: id, rec: d.pod.id, from: f.field + ': ' + cur, to: String(to), reason: f.reason });
    save(); return { ok: true, pod: d.pod };
  };

  /* ---------- NP-06 Reconciliation review (§22–§23, §62) ---------- */
  M.recQueue = function (ctx) { if (!can(ctx, 'dlv.rec.review') && !can(ctx, 'dlv.view')) return []; return M.deliveries(ctx, {}).filter(function (d) { return d.rec; }).sort(function (a, b) { return (b.rec.review === 'pending') - (a.rec.review === 'pending') || String(b.rec.at).localeCompare(a.rec.at); }); };
  M.REC_DEC = { approve: L('Setujui selisih (partial / catatan)', 'Approve the difference (partial / note)'), redeliver: L('Setujui & kirim ulang yang kurang', 'Approve & redeliver what is missing') };
  M.recReview = function (ctx, id, dec, f) {
    var d = M.dlv(id); if (!d || !d.rec) return bad(M.MSG.notfound, 'notfound');
    if (!can(ctx, 'dlv.rec.review')) return deny(ctx, id);
    f = f || {}; if (d.rec.review !== 'pending') return bad(L('Tidak ada selisih yang menunggu review.', 'No difference is waiting for review.'), 'done');
    if (!M.REC_DEC[dec]) return bad(); if (!str(f.note)) return bad(M.MSG.reason, 'reason');
    var nr = null;
    if (dec === 'redeliver') {
      var miss = Math.max(0, d.pkgs - d.pod.pkgs), mq = Math.max(0, d.qty - (d.rec.recv.qty || d.rec.accQty || 0));
      if (!miss && !mq) return bad(L('Tidak ada barang kurang untuk dikirim ulang.', 'Nothing missing to redeliver.'), 'none');
      nr = newRedelivery(ctx, d, null, { date: f.date || M.TODAY, win: f.win, pkgs: Math.max(1, miss), qty: mq, kg: d.kg && d.qty ? r1(d.kg * mq / d.qty) : null, reason: f.note });
      if (!nr.ok) return nr;
    }
    d.rec.review = 'approved'; d.rec.revBy = empId(ctx); d.rec.revAt = nowS(); d.rec.revNote = L(str(f.note), str(f.note)); d.rec.dec = dec;
    if (d.st === 'issue') { d.st = 'delivered'; d.ev.push(['delivered', nowS(), empId(ctx), L(T(M.REC_DEC[dec]), M.REC_DEC[dec][1])]); }
    d.issues.map(M.issue).filter(function (i) { return i && i.st === 'review' && ['missing', 'qty', 'wrongitem', 'damaged', 'other'].indexOf(i.type) >= 0; }).forEach(function (i) { i.st = 'resolved'; i.res = L(T(M.REC_DEC[dec]) + ' · ' + str(f.note), M.REC_DEC[dec][1] + ' · ' + str(f.note)); i.resAt = nowS(); i.resBy = empId(ctx); });
    M.audit('RECON.REVIEW', ctx, { dlv: id, rec: id, to: dec, reason: f.note });
    save(); return { ok: true, dlv: d, redel: nr ? nr.dlv : null };
  };

  /* ---------- NP-07 Issues, returns, redelivery, complaints (§24–§30, §50) ---------- */
  function newIssue(ctx, d, f) {
    var i = { id: nid('di', 'DI-2610-', 2), dlv: d.id, type: f.type, sev: M.SEV[f.sev] ? f.sev : M.ISSUE_TYPES[f.type][1], at: nowS(), by: isClient(ctx) ? (ctx.contact || ctx.uid) : empId(ctx), src: f.src || (isClient(ctx) ? 'client' : can(ctx, 'dlv.drv') ? 'driver' : 'staff'),
      note: L(str(f.note) || T(M.ISSUE_TYPES[f.type][0]), str(f.note) || M.ISSUE_TYPES[f.type][0][1]), photo: f.photo || null, action: f.action || 'review', st: f.st || 'new', res: null, ret: null, cmp: null, pod: d.pod ? d.pod.id : null, batch: d.batch || null, hist: [] };
    S().issues.unshift(i); d.issues.push(i.id);
    M.audit('ISSUE.CREATE', ctx, { dlv: d.id, rec: i.id, to: f.type + ' · ' + i.sev, reason: f.note || null });
    if (i.sev === 'crit') notify('sup', 'crit', d, { type: T(M.ISSUE_TYPES[f.type][0]), typeEn: M.ISSUE_TYPES[f.type][0][1], ref: i.id });
    if (f.type === 'reject') notify('sup', 'reject', d, { ref: i.id });
    return i;
  }
  M.issues = function (ctx, f) {
    f = f || {};
    return S().issues.filter(function (i) {
      var d = M.dlv(i.dlv); if (!d) return false;
      if (isClient(ctx)) { if (d.cl !== ctx.client) return false; }
      else if (!(can(ctx, 'dlv.issue.manage') || can(ctx, 'dlv.view'))) { if (!(can(ctx, 'dlv.drv') && M.driverOf(d) === empId(ctx))) return false; }
      if (f.st && (f.st === 'open' ? ['resolved', 'closed'].indexOf(i.st) >= 0 : i.st !== f.st)) return false;
      if (f.dlv && i.dlv !== f.dlv) return false; if (f.type && i.type !== f.type) return false; if (f.sev && i.sev !== f.sev) return false;
      return true;
    }).sort(function (a, b) { var R = { new: 0, review: 1, resolved: 2, closed: 3 }; return R[a.st] - R[b.st] || M.SEV[b.sev][2] - M.SEV[a.sev][2] || String(b.at).localeCompare(a.at); });
  };
  /* ADA MASALAH (§24–§25): a driver at the site, a supervisor, or a client after completion (§50). */
  M.reportIssue = function (ctx, id, f) {
    f = f || {};
    var d = M.dlv(id); if (!d) return bad(M.MSG.notfound, 'notfound');
    if (!can(ctx, 'dlv.issue.report')) return deny(ctx, id);
    if (!M.canSee(ctx, d)) return deny(ctx, id);
    if (!M.ISSUE_TYPES[f.type]) return bad(L('Pilih jenis masalah.', 'Choose the issue type.'), 'type');
    if ((f.type === 'other' || isClient(ctx)) && !str(f.note)) return bad(L('Tulis catatan singkat.', 'Write a short note.'), 'note');
    if (['damaged', 'reject', 'wrongitem', 'quality'].indexOf(f.type) >= 0 && !f.photo && !str(f.note)) return bad(L('Tambahkan foto atau catatan sebagai bukti.', 'Add a photo or a note as evidence.'), 'photo');
    M.sync();
    if (isClient(ctx)) {
      if (['delivered', 'completed'].indexOf(d.st) < 0) return bad(L('Laporan bisa dibuat setelah barang diterima. Untuk pengiriman berjalan, gunakan Chat.', 'You can report after the goods are delivered. For a running delivery, use Chat.'), 'jump');
      var ci = newIssue(ctx, d, { type: f.type, note: f.note, photo: f.photo, action: 'review', src: 'client', st: 'new' });
      notify('sup', 'clientiss', d, { ref: ci.id }); save();
      return { ok: true, issue: ci };
    }
    var act = M.ISSUE_ACT[f.action] ? f.action : 'review', o = ordOf(d), atSite = o && ['ontheway', 'arrived', 'inprogress'].indexOf(o.st) >= 0 && !d.pod;
    if (can(ctx, 'dlv.drv') && !can(ctx, 'dlv.issue.manage') && act !== 'review' && act !== 'note' && act !== 'return' && act !== 'redelivery' && act !== 'partial') act = 'review';
    var i = newIssue(ctx, d, { type: f.type, sev: f.sev, note: f.note, photo: f.photo, action: act });
    if (act === 'note') { i.st = 'resolved'; i.res = L('Diterima dengan catatan.', 'Accepted with a note.'); i.resAt = i.at; i.resBy = i.by; }
    else if (act === 'partial') { i.st = 'review'; }
    else if (act === 'return' || act === 'redelivery') {
      if (atSite) {
        var tp = M.ISSUE_TYPES[f.type][3], li = LG.reportIssue(ctx, o.id, { type: tp, action: 'return', note: T(i.note), photo: f.photo || null, sev: i.sev === 'crit' ? 'crit' : 'warn' });
        if (li.ok) { i.lg = li.issue.id; var dr = LG.decide(sysPerms(), li.issue.id, 'cancel', { note: T(L('Return ', 'Return ')) + i.id }); if (!dr.ok && LG.order(o.id).st === 'issue') LG.setStatus(sysPerms(), o.id, 'cancelled', { reason: 'Return ' + i.id }); }
      }
      if (d.pod) return bad(L('Barang sudah diterima. Gunakan TERIMA SEBAGIAN dengan return.', 'The goods are already received. Use PARTIAL ACCEPT with a return.'), 'jump');
      d.st = 'returned'; d.ev.push(['returned', nowS(), empId(ctx), L(T(M.ISSUE_TYPES[f.type][0]), M.ISSUE_TYPES[f.type][0][1])]);
      d.sla = { promised: d.date + ' ' + d.win[1], actual: null, min: null, st: 'exception', cause: f.type === 'unavail' || f.type === 'reject' ? 'client' : 'other' };
      var rt = createReturn(ctx, d, { reason: f.type, note: f.note || T(M.ISSUE_TYPES[f.type][0]), photo: f.photo, pkgs: d.pkgs, qty: d.qty, kg: d.kg, need: act === 'redelivery' ? 'redelivery' : 'review', issue: i.id, intransit: atSite });
      i.ret = rt.id; i.st = 'resolved'; i.res = L('Dibawa kembali ke plant · ' + rt.id, 'Returned to the plant · ' + rt.id); i.resAt = nowS(); i.resBy = empId(ctx);
    }
    else if (act === 'complaint') { var c = createComplaint(ctx, d, { type: f.type, note: f.note }); i.cmp = c.id; i.st = 'review'; }
    else {
      i.st = 'review';
      if (atSite) { var l2 = LG.reportIssue(ctx, o.id, { type: M.ISSUE_TYPES[f.type][3], action: 'review', note: T(i.note), photo: f.photo || null }); if (l2.ok) i.lg = l2.issue.id; }
      if (!d.pod && atSite) { d.st = 'issue'; d.ev.push(['issue', nowS(), empId(ctx), L(T(M.ISSUE_TYPES[f.type][0]), M.ISSUE_TYPES[f.type][0][1])]); }
    }
    if (d.cl) notify(d.cl, 'issue', d, {});
    save();
    return { ok: true, issue: i };
  };
  M.ISS_DEC = { resolve: L('Selesaikan dengan catatan', 'Resolve with note'), complaint: L('Buat kasus komplain', 'Create complaint case'), redelivery: L('Kirim ulang', 'Redelivery'), close: L('Tutup', 'Close') };
  M.decideIssue = function (ctx, id, dec, f) {
    f = f || {};
    var i = M.issue(id); if (!i) return bad(M.MSG.notfound, 'notfound');
    if (!can(ctx, 'dlv.issue.manage')) return deny(ctx, id);
    if (!M.ISS_DEC[dec]) return bad(); if (!str(f.note)) return bad(M.MSG.reason, 'reason');
    if (i.st === 'closed') return bad(L('Masalah ini sudah ditutup.', 'This issue is closed.'), 'done');
    var d = M.dlv(i.dlv), out = {};
    if (dec === 'complaint') { if (i.cmp) return bad(L('Kasus komplain sudah ada.', 'A complaint case already exists.'), 'done'); out.cmp = createComplaint(ctx, d, { type: i.type, note: T(i.note) }); i.cmp = out.cmp.id; }
    if (dec === 'redelivery') { var nr = newRedelivery(ctx, d, null, { date: f.date || M.TODAY, win: f.win, pkgs: f.pkgs || 1, qty: +f.qty || 0, kg: null, reason: f.note }); if (!nr.ok) return nr; out.dlv = nr.dlv; }
    if (d && d.st === 'issue' && !d.pod && ordOf(d)) { var o = ordOf(d); if (o.st === 'issue') { var li = LG.issues(sysPerms(), { ord: o.id, st: 'open' })[0]; if (li) LG.decide(sysPerms(), li.id, 'continue', { note: f.note }); } syncOne(d); }
    if (d && d.st === 'issue' && d.pod && (!d.rec || d.rec.review !== 'pending')) { d.st = 'delivered'; d.ev.push(['delivered', nowS(), empId(ctx), null]); }
    i.st = dec === 'close' ? 'closed' : 'resolved'; i.res = L(T(M.ISS_DEC[dec]) + ' · ' + str(f.note), M.ISS_DEC[dec][1] + ' · ' + str(f.note)); i.resAt = nowS(); i.resBy = empId(ctx); i.dec = dec;
    i.hist.push([dec, i.resAt, empId(ctx), str(f.note)]);
    M.audit('ISSUE.DECIDE', ctx, { dlv: i.dlv, rec: id, to: dec, reason: f.note });
    save(); return Object.assign({ ok: true, issue: i }, out);
  };
  function createComplaint(ctx, d, f) {
    var c = { id: nid('cmp', 'CMP-2610-', 2), dlv: d.id, cl: d.cl, prop: d.prop, batch: d.batch, ord: d.ord || d.oref, pod: d.pod ? d.pod.id : null, type: f.type === 'quality' ? 'stain' : f.type, at: nowS(), by: empId(ctx), note: L(str(f.note), str(f.note)), st: 'open' };
    S().cmps.unshift(c); pushComplaint(c);
    M.audit('COMPLAINT.CREATE', ctx, { dlv: d.id, rec: c.id, to: c.type, reason: f.note });
    return c;
  }
  function pushComplaint(c) { if (CM && CM.D && CM.D.COMPLAINTS && !by(CM.D.COMPLAINTS, 'id', c.id)) { CM.D.COMPLAINTS.push({ id: c.id, cl: c.cl, prop: c.prop, date: String(c.at).slice(0, 10), type: c.type, st: c.st, claim: 0, src9: c.dlv }); if (CM._clearCache) CM._clearCache(); } }
  function createReturn(ctx, d, f) {
    var at = nowS();
    var r = { id: nid('ret', 'RET-2610-', 2), dlv: d.id, ord: d.ord || d.oref, cl: d.cl, prop: d.prop, reason: f.reason, note: L(str(f.note), str(f.note)), pkgs: f.pkgs, qty: f.qty, kg: f.kg, photo: f.photo || null, drv: M.driverOf(d),
      at: at, st: 'created', need: f.need || 'review', owner: 'EMP-021', redel: null, issue: f.issue || null, hist: [['created', at, empId(ctx)]] };
    if (f.intransit !== false) { r.st = 'intransit'; r.hist.push(['intransit', at, M.driverOf(d) || empId(ctx)]); }
    S().rets.unshift(r); d.ret = r.id;
    M.audit('RETURN.CREATE', ctx, { dlv: d.id, rec: r.id, to: r.qty + ' pcs · ' + r.pkgs + ' ' + T(L('paket', 'pkg')), reason: f.note });
    notify('sup', 'ret', d, { ref: r.id });
    return r;
  }
  M.returns = function (ctx, f) {
    f = f || {};
    if (!(can(ctx, 'dlv.return') || can(ctx, 'dlv.return.receive') || can(ctx, 'dlv.view'))) return [];
    return S().rets.filter(function (r) { return !f.st || (f.st === 'open' ? r.st !== 'closed' : r.st === f.st); }).sort(function (a, b) { return (a.st === 'closed') - (b.st === 'closed') || String(b.at).localeCompare(a.at); });
  };
  /* Return flow (§26, §28): every step is appended; history is never deleted. */
  M.retAdvance = function (ctx, id, to, f) {
    f = f || {};
    var r = M.ret(id); if (!r) return bad(M.MSG.notfound, 'notfound');
    if ((M.RET_FLOW[r.st] || []).indexOf(to) < 0) return bad(M.MSG.jump, 'jump');
    var need = to === 'arrived' ? 'dlv.return.receive' : 'dlv.return';
    if (!can(ctx, need)) return deny(ctx, id);
    if (to === 'closed' && r.need !== 'claim' && r.need !== 'none' && !r.redel && !str(f.note)) return bad(L('Buat redelivery dulu, atau tulis alasan penutupan.', 'Create the redelivery first, or write the closing reason.'), 'redel');
    if ((to === 'reprocess' || to === 'repack') && !str(f.note)) return bad(L('Tulis instruksi untuk tim produksi.', 'Write the instruction for the production team.'), 'note');
    if (f.need && M.RET_NEED[f.need]) r.need = f.need;
    r.st = to; r.hist.push([to, nowS(), empId(ctx), str(f.note) ? L(str(f.note), str(f.note)) : null]);
    M.audit(to === 'arrived' ? 'RETURN.RECEIVE' : 'RETURN.STATUS', ctx, { dlv: r.dlv, rec: id, to: to, reason: f.note || null });
    save(); return { ok: true, ret: r };
  };
  function newRedelivery(ctx, d, r, f) {
    var date = f.date || M.TODAY, win = f.win && f.win[0] && f.win[1] ? [f.win[0], f.win[1]] : null;
    if (!win) return bad(L('Pilih jendela waktu pengiriman ulang.', 'Choose the redelivery window.'), 'win');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || date < M.TODAY || !(win[0] < win[1])) return bad(L('Tanggal dan jam tidak valid.', 'Invalid date or time.'), 'win');
    if (date === M.TODAY && ms(date + ' ' + win[1]) <= M.now()) return bad(L('Jam yang dipilih sudah lewat.', 'The chosen time has already passed.'), 'win');
    var nd = { id: nid('dlv', 'DLV-2610-', 3), rel: null, ord: null, batch: d.batch, cl: d.cl, prop: d.prop, svc: d.svc, date: date, win: win, pkgs: f.pkgs, qty: f.qty, kg: f.kg, pri: d.pri, instr: d.instr, ct: d.ct,
      drv: null, veh: null, route: null, st: 'waiting', ev: [['waiting', nowS(), empId(ctx), L('Redelivery dari ' + (r ? r.id : d.id), 'Redelivery from ' + (r ? r.id : d.id))]], created: [nowS(), empId(ctx)], ho: null, pod: null, rec: null, issues: [], ret: r ? r.id : null, orig: d.id, redel: null, sla: null, comp: null, bill: null, fb: null, attempt: (d.attempt || 1) + 1, hold: null };
    S().dlv.push(nd);
    if (!d.redel) d.redel = nd.id; else d.redel2 = (d.redel2 || []).concat([nd.id]);
    if (r) { r.redel = nd.id; r.hist.push(['redel', nowS(), empId(ctx), L(nd.id, nd.id)]); }
    linkOrder(nd, T(L('Redelivery ', 'Redelivery ')) + (r ? r.id : d.id));
    M.audit('REDELIVERY.CREATE', ctx, { dlv: nd.id, rec: nd.id, from: d.id, to: date + ' ' + win.join('–'), reason: f.reason || null });
    notify(d.cl, 'redel', nd, { date: date, win: win.join('–') });
    syncOne(nd);
    return { ok: true, dlv: nd };
  }
  /* Redelivery (§29): a new delivery event; the original stays as it happened. */
  M.createRedelivery = function (ctx, retId, f) {
    f = f || {};
    var r = M.ret(retId); if (!r) return bad(M.MSG.notfound, 'notfound');
    if (!can(ctx, 'dlv.return') && !can(ctx, 'dlv.dispatch')) return deny(ctx, retId);
    if (r.st !== 'ready') return bad(L('Return belum siap dikirim ulang.', 'The return is not ready for redelivery yet.'), 'jump');
    if (r.redel) return bad(L('Redelivery sudah dibuat: ' + r.redel, 'Redelivery already created: ' + r.redel), 'done');
    var d = M.dlv(r.dlv);
    var res = newRedelivery(ctx, d, r, { date: f.date, win: f.win, pkgs: r.pkgs, qty: r.qty, kg: r.kg, reason: f.reason });
    if (!res.ok) return res;
    save(); return { ok: true, dlv: res.dlv, ret: r };
  };
  M.chain = function (id) {
    var d = M.dlv(id); if (!d) return [];
    var first = d; while (first.orig && M.dlv(first.orig)) first = M.dlv(first.orig);
    var out = [], seen = {};
    (function walk(x) { if (!x || seen[x.id]) return; seen[x.id] = 1; out.push({ dlv: x, ret: x.ret ? M.ret(x.ret) : null }); S().dlv.filter(function (y) { return y.orig === x.id; }).forEach(walk); })(first);
    return out;
  };

  /* ---------- NP-08 Client acceptance & service completion (§31–§35, §60–§63) ---------- */
  M.compChecks = function (d) {
    var p = d.pod, rec = d.rec;
    var crit = d.issues.map(M.issue).filter(function (i) { return i && i.sev === 'crit' && ['resolved', 'closed'].indexOf(i.st) < 0; });
    var sla = d.sla || (p ? slaOf(d, p.at) : null);
    var out = {
      delivered: [(d.st === 'delivered' || d.st === 'completed') && !!p, T((M.DLV_ST[M.status(d)] || [L(d.st, d.st)])[0])],
      pod: [!!(p && p.recv && p.sign && p.photo && p.at && (d.ord || d.oref || d.batch)), p ? p.id + ' · ' + p.recv : T(L('Belum ada', 'None'))],
      rec: [!!(rec && (rec.res === 'ok' || rec.review === 'approved' || rec.review === 'client')), rec ? T(M.REC_RES[rec.res][0]) + (rec.review ? ' · ' + T(M.REV_ST[rec.review][0]) : '') : T(L('Belum direkonsiliasi', 'Not reconciled'))],
      crit: [!crit.length, crit.length ? crit.map(function (i) { return i.id; }).join(', ') : T(L('Tidak ada', 'None'))],
      sla: [!!(sla && sla.actual && sla.st !== 'pending'), sla && sla.actual ? T(M.SLA_ST[sla.st][0]) + ' · ' + (sla.min > 0 ? '+' : '') + sla.min + ' ' + T(L('mnt', 'min')) : '—']
    };
    return M.COMP_CHECKS.map(function (c) { return { k: c[0], n: c[1], ok: out[c[0]][0], v: out[c[0]][1] }; });
  };
  function worst(list) { return list.indexOf('late') >= 0 ? 'late' : list.indexOf('exception') >= 0 ? 'exception' : list.every(function (x) { return x === 'ontime'; }) ? 'ontime' : 'pending'; }
  // Pickup and production SLA come from the source records (Phase 7 pickup order, Phase 8 batch); archived batches carry their closed result.
  function srcSla(d) {
    var b = M.batch(d.batch), pick = 'ontime', prod = 'ontime', start = null;
    if (b && PR) {
      var r0 = PR.rcv(b.rcvs[0]), po = r0 && r0.ord ? M.order(r0.ord) : null;
      if (po) { var arr = LG.evAt(po, 'arrived'); pick = arr && ms(arr) > ms(po.date + ' ' + po.win[1]) ? 'late' : 'ontime'; start = po.at; }
      if (b.rtdAt && b.sla) prod = ms(b.rtdAt[0]) <= ms(b.sla) ? 'ontime' : 'late';
      start = start || (r0 && r0.arrAt) || b.created[0];
    }
    return { pick: pick, prod: prod, start: start };
  }
  function compData(d, at) {
    var pv = M.podView(d.pod) || {}, rec = d.rec || {}, src = srcSla(d), start = src.start || (d.created ? isoT(ms(d.created[0]) - 20 * 60 * MIN) : null), sla = d.sla || slaOf(d, d.pod ? d.pod.at : null);
    var iss = d.issues.map(M.issue).filter(Boolean);
    return { ord: d.ord || d.oref, cl: d.cl, prop: d.prop, date: String(at).slice(0, 10), time: String(at).slice(11, 16), tat: start ? Math.round((ms(at) - ms(start)) / MIN) : null, start: start,
      qty: rec.acc === 'partial' && rec.accQty != null ? rec.accQty : pv.qty != null ? pv.qty : d.qty, kg: pv.kg != null ? pv.kg : d.kg, pkgs: pv.pkgs != null ? pv.pkgs : d.pkgs,
      slaPick: src.pick, slaProd: src.prod, slaDel: sla.st, overall: worst([src.pick, src.prod, sla.st]), delRes: rec.acc || 'full', issRes: iss.length ? iss.filter(function (i) { return ['resolved', 'closed'].indexOf(i.st) >= 0; }).length + '/' + iss.length : '0', final: 'completed' };
  }
  M.compData = function (d) { return d.comp ? d.comp.data : null; };
  M.complete = function (ctx, id) {
    var d = M.dlv(id); if (!d) return bad(M.MSG.notfound, 'notfound');
    if (!can(ctx, 'dlv.complete')) return deny(ctx, id);
    if (d.comp) return bad(L('Sudah Service Completed.', 'Already Service Completed.'), 'done');
    M.sync();
    var miss = M.compChecks(d).filter(function (c) { return !c.ok; });
    if (miss.length) return bad(L('Belum bisa selesai: ' + miss.map(function (c) { return T(c.n); }).join(', ') + '.', 'Not complete yet: ' + miss.map(function (c) { return c.n[1]; }).join(', ') + '.'), 'check', { miss: miss });
    var at = nowS();
    d.sla = d.sla || slaOf(d, d.pod.at);
    d.comp = { at: at, by: empId(ctx), ver: 1, frozen: true, hist: [], data: compData(d, at) };
    d.st = 'completed'; d.ev.push(['completed', at, empId(ctx), null]);
    d.bill = { st: 'validation', id: null, at: null, by: null, sent: null, ver: 1 };
    if (d.ret) { var r = M.ret(d.ret); if (r && r.dlv !== d.id && r.st === 'ready') { r.st = 'closed'; r.hist.push(['closed', at, empId(ctx), L('Redelivery ' + d.id + ' selesai', 'Redelivery ' + d.id + ' completed')]); } }
    M.audit('SERVICE.COMPLETE', ctx, { dlv: id, rec: id, to: d.comp.data.overall + ' · ' + d.comp.data.qty + ' pcs' });
    notify(d.cl, 'done', d, {}); save();
    return { ok: true, dlv: d };
  };
  M.COMP_FIELDS = { qty: L('Qty final', 'Final quantity'), kg: L('Berat final', 'Final weight'), pkgs: L('Jumlah paket', 'Package count'), slaDel: L('SLA delivery', 'Delivery SLA') };
  /* Frozen completion (§60): change = amendment with reason, user and time; a new version that billing references. */
  M.amendComp = function (ctx, id, f) {
    f = f || {};
    var d = M.dlv(id); if (!d || !d.comp) return bad(M.MSG.notfound, 'notfound');
    if (!can(ctx, 'dlv.comp.amend')) return deny(ctx, id);
    if (!M.COMP_FIELDS[f.field]) return bad(L('Pilih data yang dikoreksi.', 'Choose the field to correct.'), 'field');
    if (!str(f.reason)) return bad(M.MSG.reason, 'reason');
    var to = f.field === 'slaDel' ? f.value : f.field === 'kg' ? +f.value : Math.round(+f.value);
    if (f.field === 'slaDel' ? !M.SLA_ST[to] || to === 'pending' : !(to >= 0)) return bad(M.MSG.invalid);
    var from = d.comp.data[f.field]; if (String(from) === String(to)) return bad(L('Nilainya sama.', 'The value is the same.'), 'same');
    d.comp.hist.push({ ver: d.comp.ver, at: nowS(), by: empId(ctx), field: f.field, from: from, to: to, reason: str(f.reason), data: clone(d.comp.data) });
    d.comp.data[f.field] = to; if (f.field === 'slaDel') d.comp.data.overall = worst([d.comp.data.slaPick, d.comp.data.slaProd, to]);
    d.comp.ver++;
    if (d.bill && d.bill.st === 'ready') { d.bill.st = 'validation'; d.bill.reval = T(L('Completion v' + d.comp.ver + ' perlu validasi ulang.', 'Completion v' + d.comp.ver + ' needs revalidation.')); }
    if (d.bill && d.bill.st === 'sent') { S().outbox.unshift(Object.assign(payload(d, nowS()), { amend: true, prevVer: d.bill.ver })); d.bill.ver = d.comp.ver; }
    M.audit('COMPLETION.AMEND', ctx, { dlv: id, rec: id, from: f.field + ': ' + from, to: String(to) + ' · v' + d.comp.ver, reason: f.reason });
    save(); return { ok: true, dlv: d };
  };
  M.completions = function (ctx, f) {
    f = f || {};
    if (!can(ctx, 'dlv.view') && !can(ctx, 'dlv.complete')) return [];
    return M.deliveries(ctx, {}).filter(function (d) { return (d.st === 'delivered' || d.st === 'completed' || (d.st === 'issue' && d.pod)) && (!f.st || (f.st === 'todo' ? !d.comp : !!d.comp)); })
      .sort(function (a, b) { return (!!a.comp) - (!!b.comp) || String(b.pod ? b.pod.at : '').localeCompare(a.pod ? a.pod.at : ''); });
  };

  /* Full service timeline (§34–§35) */
  function ev(rows, k, at, by, src, note) { if (at) rows.push({ k: k, at: at, by: by || null, src: src || 'P9', note: note || null }); }
  M.timeline = function (ctx, id) {
    var d = M.dlv(id); if (!d) return null;
    var full = can(ctx, 'dlv.timeline') && !isClient(ctx);
    if (!full && !M.canSee(ctx, d)) return null;
    var rows = [], b = M.batch(d.batch), rel = d.rel ? M.rel(d.rel) : null;
    if (b && PR) {
      var r0 = PR.rcv(b.rcvs[0]), po = r0 && r0.ord ? M.order(r0.ord) : null;
      if (po) { ev(rows, 'order', po.at, po.by, 'P7', po.id); ev(rows, 'pickup', LG.evAt(po, 'completed'), LG.tripOf(po) ? LG.tripOf(po).drv : null, 'P7', po.id); }
      if (r0) { ev(rows, 'plant', r0.arrAt, r0.drv, 'P8', r0.id); ev(rows, 'rcv', r0.rcvAt, r0.rcvBy, 'P8', r0.id); if (r0.sort) ev(rows, 'sort', r0.sort.at, r0.sort.by, 'P8'); }
      b.runs.forEach(function (r) { ev(rows, r.k === 'fin' ? 'fin' : r.k, r.start, r.op, 'P8', r.mach); });
      if (b.qc) ev(rows, 'qc', b.qc.at, b.qc.by, 'P8', b.qc.res + ' · ' + b.qc.pass + ' pcs');
      if (b.pack) ev(rows, 'pack', b.pack.at, b.pack.by, 'P8', b.pack.pkgs.length + ' pkg');
      if (b.rtdAt) ev(rows, 'rtd', b.rtdAt[0], b.rtdAt[1], 'P8');
    } else {
      // Batches closed before this prototype's day keep their archived production record.
      var R = rel ? ms(rel.readyAt) : ms(d.created[0]) - 60 * MIN, A0 = 'arsip';
      [['order', -20 * 60], ['pickup', -18 * 60], ['plant', -17 * 60 - 20], ['rcv', -17 * 60], ['sort', -16 * 60 - 30], ['wash', -15 * 60], ['dry', -14 * 60], ['fin', -12 * 60], ['qc', -60], ['pack', -40], ['rtd', 0]].forEach(function (x) { ev(rows, x[0], isoT(R + x[1] * MIN), null, A0); });
    }
    if (rel && rel.relAt) ev(rows, 'rel', rel.relAt, rel.relBy, 'P9', rel.ovr ? 'override' : null);
    if (d.orig) ev(rows, 'redel', d.created[0], d.created[1], 'P9', d.orig);
    var o = ordOf(d);
    d.ev.forEach(function (x) {
      var k = { assigned: 'dispatch', ontheway: 'otw', arrived: 'arr', delivered: 'delivered', issue: 'issue', returned: 'ret', completed: 'done' }[x[0]];
      if (k) ev(rows, k, x[1], x[2], o && ['assigned', 'ontheway', 'arrived'].indexOf(x[0]) >= 0 ? 'P7' : 'P9', x[3] ? T(x[3]) : null);
    });
    if (d.pod) ev(rows, 'pod', d.pod.at, d.pod.by, 'P9', d.pod.id);
    if (d.bill && d.bill.at && ['ready', 'sent'].indexOf(d.bill.st) >= 0) ev(rows, 'bill', d.bill.at, d.bill.by, 'P9', d.bill.id);
    rows.sort(function (a, b2) { return ms(a.at) - ms(b2.at) || (a.k === 'pod' ? -1 : 0); });
    if (full) return { full: true, rows: rows };
    // Client-safe (§35): plain steps, production collapsed into one line, no staff names.
    var c = [], seen = {}, prodAt = null;
    rows.forEach(function (r) {
      if (!M.TL[r.k][2]) { if (['wash', 'dry', 'fin', 'qc', 'pack', 'rcv', 'sort', 'plant'].indexOf(r.k) >= 0 && !prodAt) prodAt = r.at; return; }
      if (r.k === 'otw' && seen.otw) return; seen[r.k] = 1;
      c.push({ k: r.k, at: r.at });
    });
    if (prodAt) c.push({ k: 'proc', at: prodAt });
    c.sort(function (a, b2) { return ms(a.at) - ms(b2.at); });
    return { full: false, rows: c };
  };
  M.TL.proc = [L('Diproses di Plant JFRESH', 'Processed at the JFRESH plant'), 'factory', 1];

  /* ---------- NP-09 Billing Ready & Finance handoff (§36–§42, §64) ---------- */
  M.billCalc = function (d) {
    var sv = CM.service(d.svc), unit = sv ? sv.unit : 'kg', data = d.comp ? d.comp.data : { qty: d.qty, kg: d.kg };
    var qty = unit === 'kg' ? data.kg : data.qty, rate = CM.rateOn(d.prop, d.svc, d.date) || { rate: 0, client: 0, src: 'none' }, l = rate.line;
    var cl = M.client(d.cl), ctr = (CM.contractsForProp(d.prop, d.date) || [])[0] || null, now = CM.rateOn(d.prop, d.svc, M.TODAY);
    var charge = Math.round((rate.rate || 0) * (qty || 0)), min = l && l.minCharge ? l.minCharge : 0, minApplied = charge < min;
    if (minApplied) charge = min;
    var disc = l ? Math.round(rate.client * (qty || 0) * (l.disc || 0) / 100) : 0, sur = l ? Math.round((l.sur || 0) * (qty || 0)) : 0;
    var taxPct = l ? (l.tax == null ? 11 : l.tax) : (cl && cl.taxable ? 11 : 0), tax = Math.round(charge * taxPct / 100);
    return { svc: d.svc, unit: unit, qty: qty, base: rate.client, discPct: l ? l.disc || 0 : 0, disc: disc, surUnit: l ? l.sur || 0 : 0, sur: sur, rate: rate.rate, rc: rate.rc, v: rate.v, src: rate.src, eff: d.date, charge: charge, minApplied: minApplied, min: min,
      taxPct: taxPct, tax: tax, total: charge + tax, ctr: ctr ? ctr.no : null, ctrV: ctr ? ctr.v : null, ctrSt: ctr ? CM.ctrStatus(ctr) : null, today: now ? now.rate : null, todayRc: now ? (now.rc ? now.rc + ' v' + now.v : 'master') : null, compVer: d.comp ? d.comp.ver : null };
  };
  M.billChecks = function (d) {
    var c = M.billCalc(d), cl = M.client(d.cl), personal = cl && cl.type === 'personal';
    var crit = d.issues.map(M.issue).filter(function (i) { return i && i.sev === 'crit' && ['resolved', 'closed'].indexOf(i.st) < 0; });
    var line = c.src !== 'master' && c.src !== 'none';
    var out = {
      contract: [!!c.ctr || personal, c.ctr ? c.ctr + (c.ctrV ? ' v' + c.ctrV : '') : personal ? T(L('Pelanggan pribadi · tanpa kontrak', 'Personal customer · no contract')) : T(L('Tidak ada kontrak berlaku', 'No contract in force'))],
      rc: [line || (personal && c.src === 'master'), line ? c.rc + ' v' + c.v + ' · Rp ' + c.rate : c.src === 'master' ? T(L('Harga master Rp ', 'Master price Rp ')) + c.rate : T(L('Tidak ada tarif', 'No rate'))],
      eff: [c.src !== 'none', T(L('Tarif per tanggal layanan ', 'Rate as of the service date ')) + d.date],
      done: [!!(d.comp && d.comp.frozen), d.comp ? 'v' + d.comp.ver + ' · ' + d.comp.at : T(L('Belum completed', 'Not completed'))],
      qty: [c.qty > 0, (c.qty == null ? '—' : c.qty) + ' ' + c.unit],
      disc: [c.discPct <= S().cfg.maxRate * 4, c.discPct ? c.discPct + '% · ' + T(L('dari rate card', 'from the rate card')) : T(L('Tanpa diskon', 'No discount'))],
      sur: [c.sur >= 0, c.sur ? 'Rp ' + c.sur + ' · ' + T(L('dari rate card', 'from the rate card')) : T(L('Tanpa surcharge', 'No surcharge'))],
      block: [!(cl && cl.status === 'onhold') && !(d.bill && d.bill.st === 'hold') && !crit.length, cl && cl.status === 'onhold' ? T(L('Klien on hold', 'Client on hold')) : d.bill && d.bill.st === 'hold' ? T(d.bill.note || L('Billing ditahan', 'Billing on hold')) : crit.length ? crit.map(function (i) { return i.id; }).join(', ') : T(L('Tidak ada', 'None'))]
    };
    return M.BILL_CHECKS.map(function (k) { return { k: k[0], n: k[1], ok: out[k[0]][0], v: out[k[0]][1] }; });
  };
  M.billSt = function (d) {
    if (!d.comp) return 'notready';
    var b = d.bill || { st: 'validation' };
    if (['hold', 'ready', 'sent'].indexOf(b.st) >= 0) return b.st;
    var hard = M.billChecks(d).filter(function (c) { return !c.ok && ['contract', 'rc', 'eff', 'qty'].indexOf(c.k) >= 0; });
    return hard.length ? 'issue' : 'validation';
  };
  M.billing = function (ctx, f) {
    f = f || {};
    if (!can(ctx, 'dlv.bill.view')) return [];
    return M.deliveries(ctx, {}).filter(function (d) { return d.pod && d.st !== 'returned' && (!f.st || M.billSt(d) === f.st); })
      .sort(function (a, b) { var R = { issue: 0, validation: 1, hold: 2, ready: 3, notready: 4, sent: 5 }; return R[M.billSt(a)] - R[M.billSt(b)] || String(b.comp ? b.comp.at : '').localeCompare(a.comp ? a.comp.at : ''); });
  };
  /* MARK AS BILLING READY (§40, §64): every validation passes; the calculation and the completion version are frozen with it. */
  M.markBillReady = function (ctx, id) {
    var d = M.dlv(id); if (!d) return bad(M.MSG.notfound, 'notfound');
    if (!can(ctx, 'dlv.bill')) return deny(ctx, id);
    var s0 = M.billSt(d);
    if (s0 === 'notready') return bad(L('Service belum completed.', 'Service is not completed yet.'), 'jump');
    if (s0 === 'ready' || s0 === 'sent') return bad(L('Sudah Billing Ready.', 'Already Billing Ready.'), 'done');
    if (s0 === 'hold') return bad(L('Billing ditahan. Lepas hold dulu.', 'Billing is on hold. Release the hold first.'), 'hold');
    var fail = M.billChecks(d).filter(function (c) { return !c.ok; });
    if (fail.length) return bad(L('Validasi belum lulus: ' + fail.map(function (c) { return T(c.n); }).join(', ') + '.', 'Validation not passed: ' + fail.map(function (c) { return c.n[1]; }).join(', ') + '.'), 'check', { fail: fail });
    d.bill = { st: 'ready', id: d.bill && d.bill.id || nid('bil', 'BIL-2610-', 3), at: nowS(), by: empId(ctx), sent: null, ver: d.comp.ver, calc: M.billCalc(d) };
    M.audit('BILLING.READY', ctx, { dlv: id, rec: d.bill.id, to: 'Rp ' + d.bill.calc.total + ' · v' + d.comp.ver });
    save(); return { ok: true, dlv: d };
  };
  function payload(d, at) {
    var c = d.bill && d.bill.calc || M.billCalc(d);
    return { id: d.bill && d.bill.id, at: at || nowS(), cl: d.cl, prop: d.prop, ord: d.ord || d.oref, dlv: d.id, svc: d.svc, unit: c.unit, qty: c.qty, rate: c.rate, rc: c.rc ? c.rc + ' v' + c.v : 'master', charge: c.charge, disc: c.disc, sur: c.sur, tax: c.tax, taxPct: c.taxPct, total: c.total,
      ctr: c.ctr, compVer: d.comp ? d.comp.ver : null, evidence: [d.pod ? d.pod.id : null, d.rec ? (d.rec.res === 'ok' ? 'REC:ok' : 'REC:' + d.rec.review) : null, d.batch].filter(Boolean) };
  }
  M.payload = payload;
  M.sendFinance = function (ctx, ids) {
    if (!can(ctx, 'dlv.bill')) return deny(ctx, 'BILLING');
    ids = [].concat(ids || []); if (!ids.length) return bad(L('Pilih transaksi.', 'Choose transactions.'), 'none');
    var sent = [], skip = [];
    ids.forEach(function (id) { var d = M.dlv(id); if (!d || M.billSt(d) !== 'ready') { skip.push(id); return; } d.bill.st = 'sent'; d.bill.sent = nowS(); S().outbox.unshift(payload(d, d.bill.sent)); sent.push(id); M.audit('BILLING.SENT', ctx, { dlv: id, rec: d.bill.id, to: 'Finance' }); });
    if (!sent.length) return bad(L('Tidak ada transaksi Billing Ready yang dipilih.', 'No Billing Ready transaction selected.'), 'none');
    save(); return { ok: true, sent: sent, skip: skip };
  };
  M.billHold = function (ctx, id, reason) {
    var d = M.dlv(id); if (!d || !d.comp) return bad(M.MSG.notfound, 'notfound'); if (!can(ctx, 'dlv.bill')) return deny(ctx, id);
    if (d.bill.st === 'sent') return bad(L('Sudah dikirim ke Finance.', 'Already sent to Finance.'), 'done'); if (!str(reason)) return bad(M.MSG.reason, 'reason');
    d.bill.prev = d.bill.st; d.bill.st = 'hold'; d.bill.note = L(str(reason), str(reason)); d.bill.holdBy = empId(ctx); d.bill.holdAt = nowS();
    notify('fin', 'billblock', d, { txt: str(reason) }); M.audit('BILLING.HOLD', ctx, { dlv: id, rec: id, reason: reason }); save(); return { ok: true, dlv: d };
  };
  M.billUnhold = function (ctx, id, note) {
    var d = M.dlv(id); if (!d || !d.bill || d.bill.st !== 'hold') return bad(M.MSG.jump, 'jump'); if (!can(ctx, 'dlv.bill')) return deny(ctx, id); if (!str(note)) return bad(M.MSG.reason, 'reason');
    d.bill.st = 'validation'; d.bill.unhold = { by: empId(ctx), at: nowS(), note: str(note) }; M.audit('BILLING.UNHOLD', ctx, { dlv: id, rec: id, reason: note }); save(); return { ok: true, dlv: d };
  };
  M.outbox = function (ctx) { return can(ctx, 'dlv.bill.view') ? S().outbox.slice() : []; };

  /* ---------- Feedback (§49) ---------- */
  M.submitFeedback = function (ctx, id, f) {
    f = f || {};
    var d = M.dlv(id); if (!d) return bad(M.MSG.notfound, 'notfound');
    if (!isClient(ctx) || d.cl !== ctx.client) return deny(ctx, id);
    if (!can(ctx, 'dlv.feedback')) return deny(ctx, id);
    if (d.st !== 'completed') return bad(L('Feedback bisa dikirim setelah order selesai.', 'Feedback can be sent once the order is complete.'), 'jump');
    if (d.fb) return bad(L('Terima kasih, feedback sudah dikirim.', 'Thank you, feedback was already sent.'), 'done');
    var dr = Math.round(+f.dr), qr = Math.round(+f.qr);
    if (!(dr >= 1 && dr <= 5) || !(qr >= 1 && qr <= 5)) return bad(L('Pilih rating 1–5 untuk pengiriman dan kualitas.', 'Choose a 1–5 rating for delivery and quality.'), 'rating');
    var fb = { id: nid('fb', 'FB-2610-', 2), dlv: d.id, cl: d.cl, by: ctx.contact || ctx.uid, at: nowS(), dr: dr, qr: qr, c: str(f.c) ? L(str(f.c), str(f.c)) : null };
    S().fb.unshift(fb); d.fb = fb.id;
    M.audit('FEEDBACK.SUBMIT', ctx, { dlv: id, rec: fb.id, to: dr + '/' + qr });
    save(); return { ok: true, fb: fb };
  };

  /* ---------- NP-10 KPI (§43–§48) and the Phase 5 / Phase 6 feeds (§71–§72) ---------- */
  M.KPIS = [
    ['otd', L('Delivery Tepat Waktu', 'On-Time Delivery'), '%', 'higher', 96], ['comp', L('Delivery Selesai', 'Delivery Completion'), '%', 'higher', 99], ['first', L('Berhasil Percobaan Pertama', 'First Attempt Success'), '%', 'higher', 97], ['pod', L('Kelengkapan POD', 'POD Completion'), '%', 'higher', 100],
    ['rec', L('Akurasi Rekonsiliasi', 'Reconciliation Accuracy'), '%', 'higher', 99], ['ret', L('Return Rate', 'Return Rate'), '%', 'lower', 1.5], ['redel', L('Redelivery Rate', 'Redelivery Rate'), '%', 'lower', 1], ['iss', L('Delivery Issue Rate', 'Delivery Issue Rate'), '%', 'lower', 3]
  ];
  M.CX = [
    ['rateD', L('Rating Pengiriman', 'Delivery Rating'), '/5', 'higher', 4.6], ['rateQ', L('Rating Kualitas', 'Quality Rating'), '/5', 'higher', 4.5], ['acc', L('Tingkat Penerimaan Penuh', 'Acceptance Rate'), '%', 'higher', 98],
    ['cmp', L('Komplain Setelah Delivery', 'Complaint After Delivery'), '%', 'lower', 0.5], ['wait', L('Rata-rata Waktu Tunggu Klien', 'Average Client Waiting Time'), L('mnt', 'min'), 'lower', 5], ['resp', L('Waktu Respons Masalah', 'Response Time'), L('mnt', 'min'), 'lower', 20]
  ];
  // Today's closed and running deliveries, in the same shape as a history row.
  function todayRow() {
    var t = M.TODAY, ds = S().dlv.filter(function (d) { return d.date === t && d.st !== 'cancelled'; }), dl = ds.filter(function (d) { return !!d.pod; });
    var fbs = S().fb.filter(function (f) { return String(f.at).slice(0, 10) === t; }), iss = S().issues.filter(function (i) { return String(i.at).slice(0, 10) === t; });
    var resp = iss.filter(function (i) { return i.resAt; }).map(function (i) { return (ms(i.resAt) - ms(i.at)) / MIN; });
    return [t, ds.length, dl.length, dl.filter(function (d) { return d.sla && d.sla.st === 'ontime'; }).length, dl.filter(function (d) { return (d.attempt || 1) === 1; }).length,
      dl.filter(function (d) { return d.pod.sign && d.pod.photo && d.pod.recv; }).length, dl.filter(function (d) { return d.rec && d.rec.res === 'ok'; }).length,
      S().rets.filter(function (r) { return String(r.at).slice(0, 10) === t; }).length, ds.filter(function (d) { return d.attempt > 1; }).length, iss.length,
      S().cmps.filter(function (c) { return String(c.at).slice(0, 10) === t; }).length, dl.filter(function (d) { return d.rec && d.rec.acc === 'full'; }).length,
      sum(fbs.map(function (f) { return f.dr; })), sum(fbs.map(function (f) { return f.qr; })), fbs.length,
      sum(dl.map(function (d) { var o = ordOf(d), arr = o ? LG.evAt(o, 'arrived') : null; return arr ? Math.max(0, (ms(arr) - ms(d.date + ' ' + d.win[0])) / MIN) : 0; })), resp.length ? sum(resp) / resp.length : 0];
  }
  M.todayRow = todayRow;
  function agg(rows) {
    var s = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], respN = 0;
    rows.forEach(function (r) { for (var i = 1; i <= 16; i++) s[i - 1] += +r[i] || 0; if (r[16]) respN++; });
    var del = s[1];
    return { planned: s[0], del: del, otd: pct(s[2], del), comp: pct(del, s[0]), first: pct(s[3], del), pod: pct(s[4], del), rec: pct(s[5], del), ret: pct(s[6], del), redel: pct(s[7], del), iss: pct(s[8], del),
      rateD: s[13] ? Math.round(s[11] / s[13] * 100) / 100 : null, rateQ: s[13] ? Math.round(s[12] / s[13] * 100) / 100 : null, acc: pct(s[10], del), cmp: pct(s[9], del), wait: del ? r1(s[14] / del) : null, resp: respN ? r1(s[15] / respN) : null,
      n: { onTime: s[2], late: del - s[2], returns: s[6], redel: s[7], issues: s[8], cmp: s[9], ratings: s[13] } };
  }
  M.rows = function (days) { var h = D.HIST, base = days >= h.length ? h.slice() : h.slice(h.length - days + 1); return base.concat([todayRow()]); };
  M.kpi = function (days) { return agg(M.rows(days || 30)); };
  M.GRAN = { day: L('Harian', 'Daily'), week: L('Mingguan', 'Weekly'), month: L('Bulanan', 'Monthly'), quarter: L('Kuartalan', 'Quarterly') };
  M.TREND_M = { otd: L('Tepat waktu', 'On-time'), late: L('Terlambat', 'Delay'), ret: L('Return', 'Return'), redel: L('Redelivery', 'Redelivery'), cmp: L('Komplain', 'Complaint'), rateD: L('Rating', 'Rating') };
  M.trend = function (gran) {
    var rows = D.HIST.concat([todayRow()]), groups = {}, order = [];
    rows.forEach(function (r) {
      var d = new Date(ms(r[0])), k;
      if (gran === 'week') { var mon = new Date(ms(r[0]) - ((d.getUTCDay() + 6) % 7) * DAY); k = iso(mon.getTime()); }
      else if (gran === 'month') k = r[0].slice(0, 7);
      else if (gran === 'quarter') k = r[0].slice(0, 4) + '-Q' + (Math.floor(d.getUTCMonth() / 3) + 1);
      else k = r[0];
      if (!groups[k]) { groups[k] = []; order.push(k); }
      groups[k].push(r);
    });
    var take = { day: 14, week: 12, month: 12, quarter: 5 }[gran] || 14;
    return order.slice(-take).map(function (k) { var a = agg(groups[k]); return { k: k, otd: a.otd, late: a.otd == null ? null : r1(100 - a.otd), ret: a.ret, redel: a.redel, cmp: a.cmp, rateD: a.rateD, del: a.del, partial: k === order[order.length - 1] }; });
  };
  // §46 driver performance: Phase 7 delivery history + Phase 9 extras (first attempt, issues, ratings) + today.
  M.driverPerf = function () {
    var H = LG && LG.D ? LG.D.HIST : {};
    return Object.keys(D.DRV9).map(function (id) {
      var h = H[id] || { del: 0, delOn: 0, podOk: 0 }, x = D.DRV9[id], mine = S().dlv.filter(function (d) { return d.date === M.TODAY && d.pod && M.driverOf(d) === id; });
      var del = h.del + mine.length, on = h.delOn + mine.filter(function (d) { return d.sla && d.sla.st === 'ontime'; }).length, pod = h.podOk + mine.filter(function (d) { return d.pod.sign && d.pod.photo; }).length;
      var iss = x.iss + S().issues.filter(function (i) { var d = M.dlv(i.dlv); return d && d.date === M.TODAY && M.driverOf(d) === id && i.src === 'driver'; }).length;
      var first = x.first + mine.filter(function (d) { return (d.attempt || 1) === 1; }).length;
      var fbs = S().fb.filter(function (f) { var d = M.dlv(f.dlv); return d && M.driverOf(d) === id && String(f.at).slice(0, 10) === M.TODAY; });
      var rN = x.rN + fbs.length, rS = x.rSum + sum(fbs.map(function (f) { return f.dr; }));
      return { id: id, n: M.empName(id), del: del, on: pct(on, del), pod: pct(pod, del), iss: pct(iss, del), first: pct(first, del), rating: rN ? r2(rS / rN) : null };
    }).sort(function (a, b) { return (b.on || 0) - (a.on || 0); });
  };
  // §48 client / property performance.
  M.propPerf = function () {
    return D.PROP30.map(function (p) {
      var mine = S().dlv.filter(function (d) { return d.prop === p.prop && d.date === M.TODAY && d.pod; }), fbs = S().fb.filter(function (f) { var d = M.dlv(f.dlv); return d && d.prop === p.prop && String(f.at).slice(0, 10) === M.TODAY; });
      var n = p.n + mine.length, on = p.on + mine.filter(function (d) { return d.sla && d.sla.st === 'ontime'; }).length, lateM = mine.filter(function (d) { return d.sla && d.sla.min > 0; }).map(function (d) { return d.sla.min; });
      var iss = p.iss + S().issues.filter(function (i) { var d = M.dlv(i.dlv); return d && d.prop === p.prop && String(i.at).slice(0, 10) === M.TODAY; }).length, ret = p.ret + S().rets.filter(function (r) { return r.prop === p.prop && String(r.at).slice(0, 10) === M.TODAY; }).length;
      var pr = M.prop(p.prop);
      return { prop: p.prop, cl: pr ? pr.cl : null, n: n, on: pct(on, n), delay: r1((p.delay * (n - p.on) + sum(lateM)) / Math.max(1, (n - on))) || 0, iss: pct(iss, n), ret: pct(ret, n), rating: (p.rN + fbs.length) ? r1((p.rSum + sum(fbs.map(function (f) { return f.dr; }))) / (p.rN + fbs.length) * 10) / 10 : null };
    }).sort(function (a, b) { return (a.on || 0) - (b.on || 0); });
  };
  M.topIssues = function () {
    var c = Object.assign({}, D.ISSUE30);
    S().issues.forEach(function (i) { if (String(i.at).slice(0, 10) === M.TODAY) c[i.type] = (c[i.type] || 0) + 1; });
    return Object.keys(c).map(function (k) { return { type: k, n: c[k] }; }).sort(function (a, b) { return b.n - a.n; });
  };
  // §47 team KPI and §71 the Ambidex lines (computed, never typed in again).
  M.teamKpi = function () {
    var k = M.kpi(30), iss = S().issues, res = iss.filter(function (i) { return ['resolved', 'closed'].indexOf(i.st) >= 0; }).length;
    return [['otd', L('Delivery tepat waktu', 'On-Time Delivery'), k.otd, '%', 96], ['comp', L('Delivery selesai', 'Delivery Completion'), k.comp, '%', 99], ['pod', L('Akurasi POD', 'POD Accuracy'), k.pod, '%', 100],
      ['rec', L('Akurasi rekonsiliasi', 'Reconciliation Accuracy'), k.rec, '%', 99], ['ret', L('Return rate', 'Return Rate'), k.ret, '%', 1.5], ['res', L('Penyelesaian masalah', 'Issue Resolution'), pct(res, iss.length), '%', 90]];
  };
  M.ambidex = function () {
    var k1 = M.kpi(1), k7 = M.kpi(7), k30 = M.kpi(30), dp = M.driverPerf();
    return [
      { to: 'Daily Race', line: L('Delivery tepat waktu hari ini', 'On-time delivery today'), v: (k1.otd == null ? '—' : k1.otd + '%') },
      { to: 'Weekly Race', line: L('Tepat waktu 7 hari', 'On-time, 7 days'), v: k7.otd + '%' },
      { to: 'R2RE', line: L('Return & redelivery 30 hari', 'Returns & redeliveries, 30 days'), v: k30.ret + '% · ' + k30.redel + '%' },
      { to: L('Monthly Reflection', 'Monthly Reflection'), line: L('Masalah delivery teratas', 'Top delivery issues'), v: M.topIssues().slice(0, 2).map(function (x) { return T(M.ISSUE_TYPES[x.type][0]) + ' ' + x.n; }).join(' · ') },
      { to: L('Teamwork Score', 'Teamwork Score'), line: L('Tim Delivery: KPI tim', 'Delivery team: team KPI'), v: 'T-DLV-01 ' + k30.otd + '% · T-DLV-02 ' + k30.pod + '%' },
      { to: L('Personal Score', 'Personal Score'), line: L('Per driver: tepat waktu, POD, percobaan pertama', 'Per driver: on-time, POD, first attempt'), v: dp.length + ' driver' },
      { to: 'XScore', line: L('Pengalaman klien: rating & penerimaan', 'Client experience: rating & acceptance'), v: (k30.rateD || '—') + '/5 · ' + k30.acc + '%' }
    ];
  };
  // §72 per-client feed into Client Health (Phase 6).
  M.healthFeed = function (cl) {
    var props = D.PROP30.filter(function (p) { var pr = M.prop(p.prop); return pr && pr.cl === cl; }), n = sum(props.map(function (p) { return p.n; })), on = sum(props.map(function (p) { return p.on; }));
    var mine = S().dlv.filter(function (d) { return d.cl === cl; }), fbs = S().fb.filter(function (f) { return f.cl === cl; });
    var rN = sum(props.map(function (p) { return p.rN; })) + fbs.length, rS = sum(props.map(function (p) { return p.rSum; })) + sum(fbs.map(function (f) { return f.dr; }));
    return { cl: cl, n: n, sla: pct(on, n), cmp: S().cmps.filter(function (c) { return c.cl === cl; }).length, ret: S().rets.filter(function (r) { return r.cl === cl; }).length, acc: pct(mine.filter(function (d) { return d.rec && d.rec.acc === 'full'; }).length, mine.filter(function (d) { return d.rec; }).length),
      rating: rN ? r2(rS / rN) : null, iss: S().issues.filter(function (i) { var d = M.dlv(i.dlv); return d && d.cl === cl; }).length };
  };
  M.perfFeed = function (P) {
    if (!P || !P.D || !P.D.TEAMS) return 0;
    var k = M.kpi(30), n = 0, cases = S().issues.filter(function (i) { return String(i.at).slice(0, 7) === M.TODAY.slice(0, 7) && ['client', 'driver'].indexOf(i.src) >= 0; }).length;
    P.D.TEAMS.forEach(function (t) { (t.kpis || []).forEach(function (x) {
      if (x.code === 'T-DLV-01') { x.actual = k.otd; x.src9 = true; n++; }
      if (x.code === 'T-DLV-02') { x.actual = k.pod; x.src9 = true; n++; }
      if (x.code === 'T-DLV-04') { x.actual = cases; x.src9 = true; n++; }
    }); });
    return n;
  };
  // §70 reports, generated from the same records.
  M.REPORTS = [['daily', L('Laporan Delivery Harian', 'Delivery Daily Report')], ['sla', L('Laporan SLA Delivery', 'Delivery SLA Report')], ['ret', L('Laporan Return', 'Return Report')], ['redel', L('Laporan Redelivery', 'Redelivery Report')],
    ['pod', L('Laporan Kelengkapan POD', 'POD Completion Report')], ['cx', L('Laporan Pengalaman Klien', 'Client Experience Report')], ['comp', L('Laporan Service Completion', 'Service Completion Report')], ['bill', L('Laporan Billing Ready', 'Billing Ready Report')]];
  M.report = function (ctx, k) {
    if (!can(ctx, 'dlv.kpi') && !can(ctx, 'dlv.bill.view')) return null;
    var ds = M.deliveries(ctx, {}), H = [], R = [];
    function row(d) { return [d.id, d.ord || '—', M.clientName(d.cl), M.propName(d.prop), d.date + ' ' + d.win.join('–')]; }
    if (k === 'daily') { H = ['Delivery', 'Order', 'Client', 'Property', 'Window', 'Status', 'Driver']; R = ds.filter(function (d) { return d.date === M.TODAY; }).map(function (d) { return row(d).concat([T(M.DLV_ST[M.status(d)][0]), M.empName(M.driverOf(d))]); }); }
    if (k === 'sla') { H = ['Delivery', 'Order', 'Client', 'Property', 'Window', 'Promised', 'Actual', 'Min', 'SLA']; R = ds.filter(function (d) { return d.sla; }).map(function (d) { return row(d).concat([d.sla.promised, d.sla.actual || '—', d.sla.min == null ? '—' : d.sla.min, T(M.SLA_ST[d.sla.st][0])]); }); }
    if (k === 'ret') { H = ['Return', 'Delivery', 'Client', 'Property', 'Reason', 'Qty', 'Status', 'Redelivery']; R = S().rets.map(function (r) { return [r.id, r.dlv, M.clientName(r.cl), M.propName(r.prop), T(M.ISSUE_TYPES[r.reason] ? M.ISSUE_TYPES[r.reason][0] : r.reason), r.qty, T(M.RET_ST[r.st][0]), r.redel || '—']; }); }
    if (k === 'redel') { H = ['Delivery', 'Order', 'Client', 'Property', 'Window', 'Original', 'Return', 'Attempt', 'Status']; R = ds.filter(function (d) { return d.orig; }).map(function (d) { return row(d).concat([d.orig, d.ret || '—', d.attempt, T(M.DLV_ST[M.status(d)][0])]); }); }
    if (k === 'pod') { H = ['Delivery', 'Order', 'Client', 'Property', 'Window', 'POD', 'Recipient', 'Signature', 'Photo', 'Amendments']; R = ds.filter(function (d) { return d.pod; }).map(function (d) { return row(d).concat([d.pod.id, d.pod.recv, d.pod.sign ? 'ok' : '—', d.pod.photo ? 'ok' : '—', d.pod.amend.length]); }); }
    if (k === 'cx') { H = ['Feedback', 'Delivery', 'Client', 'Delivery rating', 'Quality rating', 'Comment']; R = S().fb.filter(function (f) { return M.canSee(ctx, M.dlv(f.dlv)); }).map(function (f) { return [f.id, f.dlv, M.clientName(f.cl), f.dr, f.qr, f.c ? T(f.c) : '']; }); }
    if (k === 'comp') { H = ['Delivery', 'Order', 'Client', 'Property', 'Window', 'Completed', 'Version', 'Qty', 'kg', 'Overall SLA']; R = ds.filter(function (d) { return d.comp; }).map(function (d) { var c = d.comp.data; return row(d).concat([d.comp.at, d.comp.ver, c.qty, c.kg, T(M.SLA_ST[c.overall][0])]); }); }
    if (k === 'bill') { H = ['Delivery', 'Order', 'Client', 'Property', 'Window', 'Billing', 'Status', 'Rate', 'Total']; R = ds.filter(function (d) { return d.comp; }).map(function (d) { var c = d.bill && d.bill.calc || M.billCalc(d); return row(d).concat([d.bill && d.bill.id || '—', T(M.BILL_ST[M.billSt(d)][0]), c.rate, c.total]); }); }
    return { k: k, head: H, rows: R };
  };

  /* ---------- Notifications (§56, §58) ---------- */
  M.NOTIF = { sched: L('Pengiriman Dijadwalkan', 'Delivery Scheduled'), redel: L('Pengiriman Ulang Dijadwalkan', 'Redelivery Scheduled'), issue: L('Ada Kendala Pengiriman', 'Delivery Issue'), done: L('Order Selesai', 'Order Complete'),
    reject: L('Klien Menolak', 'Client Reject'), ret: L('Return Dibuat', 'Return Created'), recdiff: L('Selisih Rekonsiliasi', 'Reconciliation Difference'), crit: L('Masalah Kritis', 'Critical Issue'), billblock: L('Billing Ditahan', 'Billing Block'), clientiss: L('Laporan Klien', 'Client Report'), podmiss: L('POD Belum Ada', 'POD Missing') };
  M.notifText = function (n) {
    var d = n.dlv && M.dlv(n.dlv), v = n.v || {}, pn = d ? M.propName(d.prop) : '';
    switch (n.kind) {
      case 'sched': return L('Pengiriman ke ' + pn + ' dijadwalkan ' + (v.date === M.TODAY ? 'hari ini' : v.date) + ' ' + v.win + '.', 'Delivery to ' + pn + ' scheduled ' + (v.date === M.TODAY ? 'today' : v.date) + ' ' + v.win + '.');
      case 'redel': return L('Pengiriman ulang ke ' + pn + ' dijadwalkan ' + (v.date === M.TODAY ? 'hari ini' : v.date) + ' ' + v.win + '.', 'Redelivery to ' + pn + ' scheduled ' + (v.date === M.TODAY ? 'today' : v.date) + ' ' + v.win + '.');
      case 'issue': return L('Ada kendala pada pengiriman ' + pn + '. Tim JFRESH sedang menanganinya.', 'There is a problem with the ' + pn + ' delivery. The JFRESH team is handling it.');
      case 'done': return L('Order ' + (d && d.ord || '') + ' selesai. Lihat POD dan beri rating.', 'Order ' + (d && d.ord || '') + ' is complete. View the POD and rate it.');
      case 'reject': return L('Klien menolak delivery ' + pn + '.', 'The client rejected the ' + pn + ' delivery.');
      case 'ret': return L('Return ' + (v.ref || '') + ' dibuat untuk ' + pn + '.', 'Return ' + (v.ref || '') + ' created for ' + pn + '.');
      case 'recdiff': return L('Selisih paket ' + pn + ': dikirim ' + v.from + ', diterima ' + v.to + '.', 'Package difference ' + pn + ': sent ' + v.from + ', received ' + v.to + '.');
      case 'crit': return L('Masalah kritis: ' + (v.type || v.txt || '') + (pn ? ' · ' + pn : '') + '.', 'Critical issue: ' + (v.typeEn || v.txt || '') + (pn ? ' · ' + pn : '') + '.');
      case 'billblock': return L('Billing ' + (d ? d.id : '') + ' ditahan: ' + (v.txt || ''), 'Billing ' + (d ? d.id : '') + ' on hold: ' + (v.txt || ''));
      case 'clientiss': return L('Klien melaporkan masalah setelah delivery · ' + pn + '.', 'The client reported an issue after delivery · ' + pn + '.');
    }
    return L(n.kind, n.kind);
  };
  M.notifs = function (ctx) {
    return S().notifs.filter(function (n) {
      if (isClient(ctx)) return n.to === ctx.client;
      if (n.to === empId(ctx)) return true;
      if (n.to === 'sup') return can(ctx, 'dlv.issue.manage') || can(ctx, 'dlv.dispatch');
      if (n.to === 'fin') return can(ctx, 'dlv.bill') || can(ctx, 'dlv.issue.manage');
      return false;
    });
  };
  var NCAT = { crit: 'crit', reject: 'crit', recdiff: 'crit', billblock: 'warn', ret: 'warn', clientiss: 'warn', issue: 'warn' };
  M.notifCta = function (ctx, n) {
    if (isClient(ctx)) return { l: L('Lihat Pengiriman', 'View Delivery'), s: 'CLIENT-DEL-001', rec: n.dlv };
    if (n.kind === 'recdiff') return { l: L('Buka Rekonsiliasi', 'Open Reconciliation'), s: 'REC-001', rec: n.dlv };
    if (n.kind === 'ret') return { l: L('Buka Return', 'Open Return'), s: 'RETURN-001', rec: n.v && n.v.ref };
    if (n.kind === 'billblock') return { l: L('Buka Billing Ready', 'Open Billing Ready'), s: 'BILL-001' };
    return { l: L('Buka Masalah Delivery', 'Open Delivery Issues'), s: 'DLV-ISSUE-001' };
  };
  M.joinNotifs = function (X) {
    if (!X || !X.notifsFor || X.__p9n) return; X.__p9n = true;
    var orig = X.notifsFor, origRead = X.markRead;
    function rk(ctx) { return ctx.uid || empId(ctx); }
    X.notifsFor = function (ctx) {
      var base = orig.call(X, ctx), now = M.now(), seen = (S().reads || {})[rk(ctx)] || [];
      var mine = M.notifs(ctx).slice(0, 12).map(function (n) {
        var cta = M.notifCta(ctx, n), id = 'DL-' + n.id;
        return { id: id, cat: NCAT[n.kind] || 'ops', to: [], t: M.NOTIF[n.kind] || L(n.kind, n.kind), c: M.notifText(n), at: Date.now() - (now - ms(n.at)), read: seen.indexOf(id) >= 0, cta: X.canScreen && !X.canScreen(ctx, cta.s) ? null : cta, p9: true };
      });
      return base.concat(mine).sort(function (a, b) { return b.at - a.at; });
    };
    X.markRead = function (ctx, ids) {
      var all = ids === 'all' ? X.notifsFor(ctx).map(function (n) { return n.id; }) : ids || [];
      var r = S().reads = S().reads || {}, k = rk(ctx), list = r[k] = r[k] || [];
      all.forEach(function (id) { if (/^DL-/.test(id) && list.indexOf(id) < 0) list.push(id); });
      save();
      return origRead.call(X, ctx, all.filter(function (id) { return !/^DL-/.test(id); }));
    };
  };

  /* ---------- Screens, navigation, install (§76–§77) ---------- */
  function sc(id, n, a, p, np, nv, icon, pur, emp, o) {
    return Object.assign({ id: id, n: n, a: a, p: p, np: np, nv: nv, icon: icon, pur: pur, dom: 'dlv', lvl: 2, p9: true, nb: [], bf: [], aud: [],
      emp: emp || L('Belum ada data.', 'No data yet.'), err: L('Data pengiriman belum sinkron. Coba Lagi.', 'Delivery data is not in sync yet. Try Again.'), warn: L('Ada pengiriman yang perlu perhatian.', 'Some deliveries need attention.'), ok: L('Tersimpan.', 'Saved.') }, o || {});
  }
  M.SCREENS = [
    sc('REL-001', L('Antrian Siap Kirim', 'Ready to Deliver Queue'), 'T02', 'dlv.release.view', 'NP-01', 'NV-01', 'package', L('Barang siap kirim dari produksi: Menunggu Release, Siap, Ditahan, Ada Masalah, Di-release.', 'Ready goods from production: Waiting Release, Ready, Hold, Issue, Released.'), L('Belum ada barang siap release.', 'No goods ready for release yet.'), { dev: 't' }),
    sc('REL-002', L('Detail Release', 'Release Detail'), 'T04', 'dlv.release.view', 'NP-01', 'NV-01', 'filecheck', L('12 cek validasi → RELEASE KE LOGISTICS, HOLD, ADA MASALAH; override terkontrol.', '12 validation checks → RELEASE KE LOGISTICS, HOLD, ADA MASALAH; controlled override.'), null, { dev: 't' }),
    sc('DISP-001', L('Dispatch Board Delivery', 'Delivery Dispatch Board'), 'T08', 'dlv.view', 'NP-02', 'NV-02', 'columns', L('Lajur delivery hari ini dan panel perhatian; driver, kendaraan dan rute lewat Fase 7.', 'Today\'s delivery lanes and the attention panel; driver, vehicle and route through Phase 7.'), L('Belum ada delivery hari ini.', 'No delivery today yet.'), { lvl: 3, dev: 't' }),
    sc('DISP-002', L('Detail Delivery', 'Delivery Detail'), 'T03', 'dlv.view', 'NP-02', 'NV-02', 'truck', L('Satu delivery: order, klien, jendela, paket, driver, ETA, SLA, POD, rekonsiliasi, dokumen.', 'One delivery: order, client, window, packages, driver, ETA, SLA, POD, reconciliation, documents.'), null, { dev: 't' }),
    sc('CLIENT-DEL-001', L('Pengiriman Saya', 'Client Delivery Tracking'), 'T03', 'dlv.track.own', 'NP-03', 'NV-03', 'truck', L('Klien: status 6 langkah, ETA, peta saat aktif, POD, ORDER COMPLETE, laporan dan rating.', 'Client: 6-step status, ETA, map while active, POD, ORDER COMPLETE, report and rating.'), L('Belum ada delivery hari ini.', 'No delivery today yet.'), { dom: 'clt', dev: 'm' }),
    sc('DRV-HO-001', L('Serah Terima Delivery', 'Delivery Handover'), 'T04', 'dlv.drv', 'NP-04', 'NV-04', 'filecheck', L('Driver: TIBA DI LOKASI → verifikasi property, penerima, paket, kondisi → LANJUT KE KONFIRMASI.', 'Driver: TIBA DI LOKASI → verify property, recipient, packages, condition → LANJUT KE KONFIRMASI.'), L('Belum ada delivery hari ini.', 'No delivery today yet.'), { dev: 'm' }),
    sc('DLV-POD-001', L('Ambil POD', 'POD Capture'), 'T04', 'dlv.drv', 'NP-05', 'NV-05', 'sign', L('"Barang telah diterima." Kondisi, tanda tangan, foto → KONFIRMASI PENERIMAAN → POD TERSIMPAN.', '"Barang telah diterima." Condition, signature, photo → KONFIRMASI PENERIMAAN → POD TERSIMPAN.'), null, { dev: 'm' }),
    sc('DLV-POD-002', L('Detail POD', 'POD Detail'), 'T03', 'dlv.view', 'NP-05', 'NV-05', 'filecheck', L('POD asli, amandemen (alasan, user, waktu), QR, dokumen POD.', 'Original POD, amendments (reason, user, time), QR, POD document.'), null, { dev: 't' }),
    sc('REC-001', L('Rekonsiliasi Delivery', 'Delivery Reconciliation'), 'T05', 'dlv.view', 'NP-06', 'NV-06', 'scale', L('Dikirim vs diterima: paket, qty, berat; SESUAI / ADA SELISIH; partial; review supervisor.', 'Sent vs received: packages, qty, weight; SESUAI / ADA SELISIH; partial; supervisor review.'), L('Belum ada rekonsiliasi.', 'No reconciliation yet.'), { dev: 't' }),
    sc('DLV-ISSUE-001', L('Masalah Delivery', 'Delivery Issue'), 'T06', 'dlv.issue.report', 'NP-07', 'NV-07', 'alert', L('ADA MASALAH: jenis, bukti, tindakan; daftar masalah dan keputusan supervisor.', 'ADA MASALAH: type, evidence, action; issue list and supervisor decisions.'), L('Tidak ada masalah delivery terbuka.', 'No open delivery issue.'), { dev: 't' }),
    sc('RETURN-001', L('Detail Return', 'Return Detail'), 'T05', 'dlv.return.receive', 'NP-07', 'NV-07', 'arrowl', L('Return dari dibuat sampai siap kirim ulang; riwayat tidak pernah dihapus.', 'A return from created to ready for redelivery; history never deleted.'), L('Belum ada return.', 'No return yet.'), { dev: 't' }),
    sc('REDEL-001', L('Detail Redelivery', 'Redelivery Detail'), 'T03', 'dlv.view', 'NP-07', 'NV-07', 'refresh', L('Rantai delivery asli → return → redelivery; delivery asli tidak ditimpa.', 'Chain original delivery → return → redelivery; the original is never overwritten.'), L('Belum ada redelivery.', 'No redelivery yet.'), { dev: 't' }),
    sc('COMP-001', L('Service Completion', 'Service Completion'), 'T05', 'dlv.view', 'NP-08', 'NV-08', 'checkc', L('Cek penyelesaian, SLA final, data beku berversi; amandemen dengan alasan.', 'Completion checks, final SLA, frozen versioned data; amendments with a reason.'), L('Belum ada delivery yang siap diselesaikan.', 'No delivery ready to complete yet.'), { lvl: 3, dev: 'd' }),
    sc('DLV-TIMELINE-001', L('Timeline Layanan Lengkap', 'Full Service Timeline'), 'T03', 'dlv.timeline', 'NP-08', 'NV-08', 'history', L('Dari order dibuat sampai Billing Ready; versi klien disederhanakan.', 'From order created to Billing Ready; the client version is simplified.'), null, { dev: 'd' }),
    sc('BILL-001', L('Antrian Billing Ready', 'Billing Ready Queue'), 'T05', 'dlv.bill.view', 'NP-09', 'NV-09', 'invoice', L('Transaksi selesai: Belum Siap, Perlu Validasi, Billing Ready, Terkirim, Ditahan, Masalah.', 'Completed transactions: Not Ready, Validation Required, Billing Ready, Sent, Hold, Issue.'), L('Belum ada transaksi Billing Ready.', 'No Billing Ready transaction yet.'), { lvl: 3, dev: 'd' }),
    sc('BILL-002', L('Validasi Billing', 'Billing Validation'), 'T04', 'dlv.bill.view', 'NP-09', 'NV-09', 'filecheck', L('Kontrak, rate card, tarif historis, qty, diskon, surcharge, pajak → MARK AS BILLING READY.', 'Contract, rate card, historical rate, qty, discount, surcharge, tax → MARK AS BILLING READY.'), null, { lvl: 3, dev: 'd' }),
    sc('DLV-KPI-001', L('Performa Delivery', 'Delivery Performance Dashboard'), 'T08', 'dlv.kpi', 'NP-10', 'NV-10', 'gauge', L('8 KPI delivery, pengalaman klien, tren, driver, tim, property, masalah teratas, Ambidex & Client Health.', '8 delivery KPIs, client experience, trends, drivers, team, properties, top issues, Ambidex & Client Health.'), null, { lvl: 4, dev: 'd' }),
    sc('FEEDBACK-001', L('Feedback Klien', 'Client Feedback'), 'T06', 'dlv.feedback.view', 'NP-10', 'NV-10', 'star', L('Klien: rating pengiriman dan kualitas 1–5, komentar opsional → KIRIM FEEDBACK.', 'Client: delivery and quality rating 1–5, optional comment → KIRIM FEEDBACK.'), L('Belum ada feedback.', 'No feedback yet.'), { dev: 'm' })
  ];
  M.screen = function (id) { return by(M.SCREENS, 'id', id); };
  M.PARENTS = { 'REL-002': ['REL-001'], 'DISP-002': ['DISP-001'], 'DLV-POD-001': ['DRV-HO-001'], 'DLV-POD-002': ['DISP-002'], 'REDEL-001': ['RETURN-001', 'DISP-001'], 'BILL-002': ['BILL-001'], 'DLV-TIMELINE-001': ['DISP-002', 'COMP-001'] };
  function N(k, l, i, s, x) { return Object.assign({ k: k, l: l, i: i, s: s }, x || {}); }
  function G(k, l, i, sub) { return { k: k, l: l, i: i, sub: sub }; }
  var MENU = { k: 'menu', l: L('Menu', 'Menu'), i: 'menu' };
  var DL = {
    rel: N('rel9', L('Siap Kirim', 'Ready Release'), 'package', 'REL-001', { also: ['REL-002'] }), disp: N('disp9', L('Dispatch Delivery', 'Delivery Dispatch'), 'columns', 'DISP-001', { also: ['DISP-002', 'DLV-POD-002', 'DLV-TIMELINE-001'] }),
    rec: N('rec9', L('Rekonsiliasi', 'Reconciliation'), 'scale', 'REC-001'), ret: N('ret9', L('Return & Redelivery', 'Returns & Redelivery'), 'arrowl', 'RETURN-001', { also: ['REDEL-001'] }), iss: N('iss9', L('Masalah Delivery', 'Delivery Issues'), 'alert', 'DLV-ISSUE-001'),
    comp: N('comp9', L('Service Completion', 'Service Completion'), 'checkc', 'COMP-001'), bill: N('bill9', L('Billing Ready', 'Billing Ready'), 'invoice', 'BILL-001', { also: ['BILL-002'] }), kpi: N('kpi9', L('Performa Delivery', 'Delivery Performance'), 'gauge', 'DLV-KPI-001'),
    fb: N('fb9', L('Feedback Klien', 'Client Feedback'), 'star', 'FEEDBACK-001')
  };
  M.NAV = {
    supervisor: { add: [G('g-dlv', L('Delivery & Penyelesaian', 'Delivery & Completion'), 'package', [DL.rel, DL.disp, DL.rec, DL.ret, DL.iss, DL.comp, DL.kpi])] },
    opsmgr: { add: [G('g-dlv', L('Delivery & Penyelesaian', 'Delivery & Completion'), 'package', [DL.kpi, DL.comp, DL.bill, DL.iss, DL.ret, DL.disp, DL.rel, DL.rec, DL.fb])] },
    owner: { add: [G('g-dlv', L('Delivery & Penyelesaian', 'Delivery & Completion'), 'package', [DL.kpi, DL.comp, DL.bill, DL.disp, DL.rel])] },
    finance: { add: [G('g-dlv', L('Billing Ready', 'Billing Ready'), 'invoice', [DL.bill, DL.comp, DL.kpi])] },
    sales: { add: [G('g-dlv', L('Delivery Klien', 'Client Delivery'), 'package', [DL.kpi, DL.disp, DL.fb])] },
    prod3: { append: [N('rel9', L('Release', 'Release'), 'package', 'REL-001', { also: ['REL-002'] }), N('ret9', L('Return', 'Returns'), 'arrowl', 'RETURN-001')] },
    driver: { insertAt: [2, N('dlv', L('Delivery', 'Delivery'), 'package', 'DRV-HO-001', { also: ['DLV-POD-001', 'DLV-ISSUE-001'] })], mnav: ['route', N('dlv', L('Delivery', 'Delivery'), 'package', 'DRV-HO-001', { also: ['DLV-POD-001', 'DLV-ISSUE-001'] })] },
    client: { insertAt: [2, N('del', L('Pengiriman', 'Deliveries'), 'truck', 'CLIENT-DEL-001', { also: ['FEEDBACK-001', 'DLV-ISSUE-001'] })], mnav: ['trk', N('del', L('Pengiriman', 'Deliveries'), 'truck', 'CLIENT-DEL-001', { also: ['FEEDBACK-001', 'DLV-ISSUE-001', 'TRACK-003'] })] }
  };
  // A client user for Kayana so the live Phase 7 delivery of ORD-2610-105 can be followed by its client.
  M.NEW_USERS = [{ user: { id: 'USR-093', u: 'nyoman.kayana', email: 'ubud@kayana.com', name: 'Pak Nyoman', client: 'CL-03', contact: 'CT-034', status: 'active', roles: [{ k: 'client', def: true }], plants: [], lang: 'id' }, demo: { u: 'nyoman.kayana', d: L('Klien · Kayana (delivery live)', 'Client · Kayana (live delivery)') } },
    { user: { id: 'USR-096', u: 'dewi', email: 'dewi@jfreshlaundry.app', emp: 'EMP-010', status: 'active', roles: [{ k: 'opsmgr', def: true }], plants: ['*'], lang: 'id' }, emp: { id: 'EMP-010', n: 'Dewi Lestari', short: 'Dewi', dept: L('Operasional', 'Operations'), status: 'active' }, demo: { u: 'dewi', d: L('Operations Manager · completion & performa delivery', 'Operations Manager · completion & delivery performance') } }];
  /* install(): joins the Phase 9 permissions, screens and menus to the shared config and access roles, guards
     the Phase 7 trip start and the Phase 8 logistics handover on release, feeds Phase 5 and Phase 6. Safe to call more than once. */
  M.install = function (C, X, P, CM2, LG2, PR2) {
    if (!C || C.__p9) return; C.__p9 = true;
    if (CM2) { CM = CM2; M.CM = CM2; } if (LG2) { LG = LG2; M.LG = LG2; } if (PR2) { PR = PR2; M.PR = PR2; }
    Object.keys(M.PERMS).forEach(function (k) { C.PERMS[k] = M.PERMS[k]; });
    function addP(list, extra) { extra.forEach(function (p) { if (list.indexOf(p) < 0) list.push(p); }); }
    Object.keys(M.ROLE_PERMS).forEach(function (r) { var rl = C.ROLES[r], xr = X && X.ROLES[r]; if (rl) addP(rl.perms, M.ROLE_PERMS[r]); if (xr && xr.perms) addP(xr.perms, M.ROLE_PERMS[r]); });
    if (X) M.NEW_USERS.forEach(function (x) { if (x.emp && X.employee && !X.employee(x.emp.id)) X.EMPLOYEES.push(x.emp); if (!X.USERS.some(function (u) { return u.u === x.user.u; })) X.USERS.push(Object.assign({}, x.user)); if (!X.DEMO.some(function (y) { return y.u === x.demo.u; })) X.DEMO.push(x.demo); });
    Object.keys(M.NAV).forEach(function (r) {
      var cfg = M.NAV[r], rl = C.ROLES[r]; if (!rl) return;
      if (cfg.add) rl.nav = rl.nav.concat(cfg.add);
      if (cfg.append) cfg.append.forEach(function (n) { if (!rl.nav.some(function (x) { return x.k === n.k; })) rl.nav = rl.nav.concat([n]); });
      if (cfg.insertAt && !rl.nav.some(function (x) { return x.k === cfg.insertAt[1].k; })) rl.nav.splice(Math.min(cfg.insertAt[0], rl.nav.length), 0, cfg.insertAt[1]);
      if (cfg.mnav && rl.mnav) { var i = rl.mnav.map(function (n) { return n.k; }).indexOf(cfg.mnav[0]); if (i >= 0) rl.mnav[i] = cfg.mnav[1]; }
    });
    var orig = C.screen, extra = {};
    M.SCREENS.forEach(function (s) { extra[s.id] = s; });
    C.screen = function (id) { return extra[id] || orig(id); };
    C.SCREENS_P9 = M.SCREENS;
    // Release gate on the Phase 7 trip start and on the Phase 8 handover to Logistics (§7, §84).
    if (LG && LG.startTrip && !LG.__p9) {
      LG.__p9 = true; var st0 = LG.startTrip;
      LG.startTrip = function (ctx, ordId) { var g = M.gate(ordId); if (g) return bad(g, 'release'); var r = st0.apply(LG, arguments); if (r && r.ok) { var d = M.byOrd(ordId); if (d) { syncOne(d); M.audit('DELIVERY.START', ctx, { dlv: d.id, rec: d.id }); save(); } } return r; };
      var ar0 = LG.arrive;
      LG.arrive = function (ctx, ordId) { var r = ar0.apply(LG, arguments); if (r && r.ok) { var d = M.byOrd(ordId); if (d) { syncOne(d); M.audit('DELIVERY.ARRIVE', ctx, { dlv: d.id, rec: d.id }); save(); } } return r; };
      var as0 = LG.assign;
      LG.assign = function (ctx, ordId) { var r = as0.apply(LG, arguments); if (r && r.ok) { var d = M.byOrd(ordId); if (d) { syncOne(d); M.audit('DRIVER.ASSIGN', ctx, { dlv: d.id, rec: d.id, to: M.empName(r.trip.drv) }); save(); } } return r; };
    }
    if (PR && PR.accept && !PR.__p9) {
      PR.__p9 = true; var ac0 = PR.accept;
      PR.accept = function (ctx, hoId) { var h = PR.ho(hoId); if (h && h.kind === 't3log' && h.batch) { var rl = M.relOfBatch(h.batch); if (!rl || rl.st !== 'released') return bad(M.MSG.notrel, 'release'); } return ac0.apply(PR, arguments); };
    }
    S().cmps.forEach(pushComplaint);
    if (P) M.perfFeed(P);
    if (X) M.joinNotifs(X);
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = M;
  else root.JFDLV = M;
})(typeof window !== 'undefined' ? window : this);
