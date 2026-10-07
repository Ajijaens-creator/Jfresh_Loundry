/* ==========================================================================
   JFRESH OS — Order, Pickup, Delivery & Live Logistics engine (Phase 7 · NP 1.0)
   Orders with a strict lifecycle and duplicate check, recurring schedules
   with holiday rules and auto orders, the dispatch board with capacity
   validation, routes, drivers and vehicles, the driver trip (start, arrive,
   pickup / drop, return, shift end), manifests and bags, evidence and POD
   that are never silently edited, issues with escalation, arrival at plant
   and the two-sided receiving handover with bag reconciliation, live
   tracking that only runs during an active trip, ETA with freshness, task
   chat, notifications, the route timeline, the location access log and the
   logistics KPIs that feed the Phase 5 Personal Score.

   Clients, properties, contacts, services, contracts and SLA come from the
   Phase 6 engine (JFCOMM); they are never copied. One engine for the app
   (app/screens-logi*.js), the Phase 7 pages (phase7/) and the automated
   tests (tools/test-logi.js). Every protected action checks the permission,
   the task assignment and the client scope first (§90) and writes an audit
   entry (§78). Prototype only: a production backend must repeat these rules
   on the server, and the map is a schematic, not GPS.
   ========================================================================== */
(function (root) {
  var D = root.JFLOG_DATA || (typeof require !== 'undefined' ? require('./jfos-logi-data.js') : null);
  var CM = root.JFCOMM || (typeof require !== 'undefined' ? require('./jfos-comm.js') : null);
  function L(a, b) { return [a, b === undefined ? a : b]; }
  var M = { version: 'Phase 7 · NP 1.0', date: D.today, D: D, CM: CM };
  var MIN = 6e4, DAY = 864e5;
  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  function sum(a) { return a.reduce(function (s, x) { return s + (+x || 0); }, 0); }
  function r1(x) { return Math.round(x * 10) / 10; }
  function by(arr, k, v) { for (var i = 0; i < arr.length; i++) if (arr[i][k] === v) return arr[i]; return null; }
  function T(x) { return Array.isArray(x) ? x[0] : (x == null ? '' : String(x)); }
  function ms(s) { if (typeof s === 'number') return s; var p = String(s).split(/[-: T]/); return Date.UTC(+p[0], +p[1] - 1, +p[2], +(p[3] || 0), +(p[4] || 0), +(p[5] || 0)); }
  function iso(t) { return new Date(t).toISOString().slice(0, 10); }
  function isoT(t) { return new Date(t).toISOString().slice(0, 16).replace('T', ' '); }
  function hm(t) { return new Date(t).toISOString().slice(11, 16); }
  function at(date, h) { return ms(date + ' ' + h); }
  function addDays(d, n) { return iso(ms(d) + n * DAY); }
  function dist(a, b) { return Math.sqrt(Math.pow(a[0] - b[0], 2) + Math.pow(a[1] - b[1], 2)); }
  M.TODAY = D.today; M.ms = ms; M.iso = iso; M.isoT = isoT; M.hm = hm; M.at = at; M.addDays = addDays;
  M.D = D; M.version = 'NP 1.0';

  M.MSG = {
    noperm: L('Anda tidak memiliki izin untuk tindakan ini.', 'You do not have permission for this action.'),
    notfound: L('Data tidak ditemukan.', 'Record not found.'),
    invalid: L('Periksa data dan coba lagi.', 'Check the data and try again.'),
    reason: L('Alasan wajib diisi.', 'A reason is required.'),
    scope: L('Data ini berada di luar akun Anda.', 'This record is outside your account.'),
    notyours: L('Tugas ini bukan milik Anda.', 'This task is not assigned to you.'),
    jump: L('Status ini tidak bisa dilewati. Ikuti urutan tugas.', 'This status cannot be skipped. Follow the task order.'),
    loc: L('Lokasi belum dapat diperbarui.', 'Location could not be updated yet.'),
    weak: L('Koneksi internet lemah.', 'Weak internet connection.'),
    manifest: L('Manifest belum lengkap.', 'Manifest is not complete.'),
    bagdiff: L('Jumlah bag berbeda.', 'Bag count differs.'),
    retry: L('Coba Lagi.', 'Try Again.'),
    dup: L('Kemungkinan order ganda. Periksa order yang sudah ada.', 'Possible duplicate order. Check the existing order.'),
    hold: L('Klien sedang ditahan (on hold). Hubungi Finance.', 'The client is on hold. Contact Finance.'),
    maint: L('Kendaraan sedang dalam perawatan.', 'The vehicle is under maintenance.'),
    pending: L('Selisih handover belum diputuskan supervisor.', 'The handover difference has not been decided by a supervisor.')
  };

  /* ---------- Permissions (§82, §90) ---------- */
  M.PERMS = {
    'lg.order.view': L('Lihat order pickup & delivery', 'View pickup & delivery orders'), 'lg.order.create': L('Buat order / minta pickup', 'Create orders / request pickup'), 'lg.order.edit': L('Ubah, prioritaskan, reschedule & batalkan order', 'Edit, prioritise, reschedule & cancel orders'),
    'lg.schedule.view': L('Lihat jadwal rutin', 'View recurring schedules'), 'lg.schedule.edit': L('Kelola jadwal rutin & auto order', 'Manage recurring schedules & auto orders'),
    'lg.dispatch': L('Dispatch: tugaskan driver, kendaraan & rute', 'Dispatch: assign driver, vehicle & route'),
    'lg.route.view': L('Lihat rute', 'View routes'), 'lg.route.edit': L('Ubah master rute', 'Edit route master'), 'lg.fleet.view': L('Lihat driver & kendaraan', 'View drivers & vehicles'),
    'lg.drv.task': L('Kerjakan tugas driver sendiri', 'Run own driver tasks'),
    'lg.manifest.view': L('Lihat manifest & bag', 'View manifests & bags'), 'lg.manifest.edit': L('Ubah bag (tambah, lepas, rusak, hilang)', 'Change bags (add, remove, damaged, missing)'),
    'lg.evidence.view': L('Lihat bukti & POD', 'View evidence & POD'), 'lg.evidence.amend': L('Koreksi bukti (amended record)', 'Correct evidence (amended record)'),
    'lg.issue.report': L('Laporkan masalah (ADA MASALAH)', 'Report an issue (ADA MASALAH)'), 'lg.issue.view': L('Lihat inbox masalah logistik', 'View the logistics issue inbox'), 'lg.issue.manage': L('Putuskan masalah logistik', 'Decide logistics issues'),
    'lg.arrival': L('Arrival board plant', 'Plant arrival board'), 'lg.handover': L('Handover di plant', 'Handover at the plant'),
    'lg.track.fleet': L('Live map armada', 'Fleet live map'), 'lg.track.own': L('Lacak order sendiri (klien)', 'Track own order (client)'),
    'lg.chat': L('Chat tugas', 'Task chat'), 'lg.timeline': L('Timeline rute', 'Route timeline'), 'lg.kpi': L('KPI logistik', 'Logistics KPI'), 'lg.audit': L('Log akses lokasi & audit logistik', 'Location access log & logistics audit')
  };
  var ALL7 = Object.keys(M.PERMS).filter(function (p) { return p !== 'lg.drv.task' && p !== 'lg.track.own'; });
  M.ROLE_PERMS = {
    driver: ['lg.drv.task', 'lg.chat', 'lg.issue.report', 'lg.manifest.view', 'lg.evidence.view', 'lg.timeline', 'lg.handover'],
    supervisor: ['lg.order.view', 'lg.order.create', 'lg.order.edit', 'lg.schedule.view', 'lg.schedule.edit', 'lg.dispatch', 'lg.route.view', 'lg.route.edit', 'lg.fleet.view', 'lg.manifest.view', 'lg.manifest.edit',
      'lg.evidence.view', 'lg.evidence.amend', 'lg.issue.report', 'lg.issue.view', 'lg.issue.manage', 'lg.arrival', 'lg.handover', 'lg.track.fleet', 'lg.chat', 'lg.timeline', 'lg.kpi'],
    opsmgr: ALL7,
    // Receiving at the plant (§82): arrival board, manifest, handover, reconciliation.
    operator: ['lg.arrival', 'lg.handover', 'lg.manifest.view', 'lg.manifest.edit', 'lg.issue.report', 'lg.evidence.view', 'lg.order.view'],
    // Owner (§82): summary, KPI, exceptions, performance. No dispatch; live location only with a stated reason (§79).
    owner: ['lg.order.view', 'lg.schedule.view', 'lg.route.view', 'lg.fleet.view', 'lg.manifest.view', 'lg.evidence.view', 'lg.issue.view', 'lg.arrival', 'lg.track.fleet', 'lg.timeline', 'lg.kpi', 'lg.audit'],
    sales: ['lg.order.view', 'lg.schedule.view'],
    finance: [], qc: [],
    client: ['lg.order.view', 'lg.order.create', 'lg.track.own', 'lg.chat', 'lg.evidence.view']
  };
  function can(ctx, p) { return !p || !!(ctx && ctx.perms && ctx.perms.indexOf(p) >= 0); }
  M.can = can;
  function empId(ctx) { return ctx && (ctx.employee ? ctx.employee.id : ctx.emp || ctx.uid) || 'system'; }
  M.empId = empId;
  function isClient(ctx) { return !!(ctx && ctx.client); }
  M.isClient = isClient;

  /* ---------- Labels ---------- */
  M.ST = {
    draft: [L('Draft', 'Draft'), 'mute', 'edit'], requested: [L('Diminta', 'Requested'), 'info', 'bell'], scheduled: [L('Terjadwal', 'Scheduled'), 'info', 'calendar'],
    assigned: [L('Ditugaskan', 'Assigned'), 'info', 'user'], ready: [L('Siap', 'Ready'), 'info', 'check'], ontheway: [L('Dalam Perjalanan', 'On The Way'), 'info', 'truck'],
    arrived: [L('Tiba', 'Arrived'), 'info', 'pin'], inprogress: [L('Sedang Dikerjakan', 'In Progress'), 'appr', 'clipboard'], completed: [L('Selesai', 'Completed'), 'ok', 'checkc'],
    atplant: [L('Tiba di Plant', 'Arrived at Plant'), 'ok', 'factory'], received: [L('Diterima Receiving', 'Received'), 'ok', 'filecheck'], issue: [L('Masalah', 'Issue'), 'crit', 'alert'], cancelled: [L('Dibatalkan', 'Cancelled'), 'mute', 'xc']
  };
  // §6 lifecycle labels per kind: pickup / drop in progress
  M.stLabel = function (o, st) {
    st = st || o.st;
    if (st === 'inprogress') return o.kind === 'delivery' ? L('Drop Berlangsung', 'Drop In Progress') : L('Pickup Berlangsung', 'Pickup In Progress');
    if (st === 'completed') return o.kind === 'delivery' ? L('Delivery Selesai', 'Delivery Completed') : L('Pickup Selesai', 'Pickup Completed');
    return (M.ST[st] || [L(st, st)])[0];
  };
  M.ORDER_FLOW = ['draft', 'requested', 'scheduled', 'assigned', 'ready', 'ontheway', 'arrived', 'inprogress', 'completed', 'atplant', 'received'];
  M.FLOW = {
    draft: ['requested', 'cancelled'], requested: ['scheduled', 'assigned', 'cancelled'], scheduled: ['assigned', 'requested', 'cancelled'],
    assigned: ['ready', 'scheduled', 'cancelled', 'issue'], ready: ['ontheway', 'assigned', 'scheduled', 'cancelled', 'issue'],
    ontheway: ['arrived', 'issue'], arrived: ['inprogress', 'issue'], inprogress: ['completed', 'issue'],
    completed: ['atplant', 'issue'], atplant: ['received'], received: [], cancelled: [],
    issue: ['scheduled', 'assigned', 'ready', 'ontheway', 'arrived', 'inprogress', 'completed', 'cancelled']
  };
  M.canMove = function (o, to) {
    if (!o || !M.FLOW[o.st] || M.FLOW[o.st].indexOf(to) < 0) return false;
    if (to === 'atplant' && o.kind !== 'pickup') return false;            // a delivery ends at the client
    if (o.st === 'issue' && to !== 'cancelled' && to !== 'scheduled' && to !== o.prevSt) return false;   // back only to where it stopped
    return true;
  };
  M.PRI = {
    normal: [L('Normal', 'Normal'), 'mute', 1], important: [L('Penting', 'Important'), 'info', 2], express: [L('Express', 'Express'), 'appr', 3],
    urgent: [L('Urgent', 'Urgent'), 'crit', 4], superexpress: [L('Super Express', 'Super Express'), 'crit', 5]
  };
  M.priRank = function (p) { return (M.PRI[p] || M.PRI.normal)[2]; };
  M.SRC = { scheduled: L('Terjadwal', 'Scheduled'), ondemand: L('On Demand', 'On Demand'), manual: L('Manual', 'Manual'), contract: L('Dari Kontrak', 'Contract Generated'), client: L('Aplikasi Klien', 'Client App'), walkin: L('Personal / Walk-in', 'Personal / Walk-in') };
  M.KIND = { pickup: L('Pickup', 'Pickup'), delivery: L('Delivery', 'Delivery') };
  M.CAT = { linen: L('Linen', 'Linen'), towel: L('Handuk', 'Towel'), spa: L('Linen Spa', 'Spa Linen'), uniform: L('Seragam', 'Uniform'), garment: L('Pakaian', 'Garment'), fnb: L('Linen F&B', 'F&B Linen'), mixed: L('Campuran', 'Mixed') };
  M.COND = { good: [L('Baik', 'Good'), 'ok'], wet: [L('Basah', 'Wet'), 'warn'], stained: [L('Noda berat', 'Heavy stains'), 'warn'], damaged: [L('Rusak', 'Damaged'), 'crit'], contam: [L('Terkontaminasi', 'Contaminated'), 'crit'] };
  M.FREQ = { daily: L('Setiap hari', 'Daily'), days: L('Hari tertentu', 'Specific days'), weekly: L('Mingguan', 'Weekly'), multi: L('Beberapa kali sehari', 'Multiple times per day'), custom: L('Jadwal khusus', 'Custom schedule') };
  M.DAYS = [L('Min', 'Sun'), L('Sen', 'Mon'), L('Sel', 'Tue'), L('Rab', 'Wed'), L('Kam', 'Thu'), L('Jum', 'Fri'), L('Sab', 'Sat')];
  M.HOL_KIND = { public: L('Libur nasional', 'Public holiday'), closed: L('Klien tutup', 'Client closed'), event: L('Acara khusus', 'Special event'), manual: L('Pengecualian manual', 'Manual exception') };
  M.HOL_RULE = { skip: L('Lewati', 'Skip'), earlier: L('Majukan', 'Move earlier'), later: L('Mundurkan', 'Move later'), confirm: L('Perlu konfirmasi', 'Require confirmation') };
  M.VEH_TYPE = { van: L('Van', 'Van'), pickup: L('Pick-up', 'Pick-up'), motor: L('Motor + box', 'Motorbike + box') };
  M.MAINT = { ok: [L('Siap jalan', 'Ready'), 'ok'], service: [L('Jadwal servis', 'Service due'), 'warn'], repair: [L('Perawatan', 'Maintenance'), 'crit'] };
  M.MF_ST = { intransit: [L('Dalam Perjalanan', 'In Transit'), 'info'], arrived: [L('Tiba di Plant', 'At Plant'), 'info'], handed: [L('Sudah Diserahkan', 'Handed Over'), 'ok'], discrepancy: [L('Selisih Handover', 'Handover Difference'), 'crit'], received: [L('Diterima Receiving', 'Received'), 'ok'] };
  M.BAG_ST = { picked: [L('Diambil', 'Picked Up'), 'info'], intransit: [L('Dalam Perjalanan', 'In Transit'), 'info'], arrived: [L('Tiba di Plant', 'At Plant'), 'ok'], received: [L('Diterima', 'Received'), 'ok'], missing: [L('Hilang', 'Missing'), 'crit'], removed: [L('Dilepas', 'Removed'), 'mute'], delivered: [L('Diserahkan', 'Delivered'), 'ok'] };
  M.ISSUE_TYPES = {
    notready: [L('Klien Belum Siap', 'Client Not Ready'), 'warn', 'hourglass', 'client'], notavail: [L('Klien Tidak Ada', 'Client Not Available'), 'warn', 'user', 'client'],
    address: [L('Alamat Bermasalah', 'Address Problem'), 'warn', 'pin', 'other'], bagdiff: [L('Jumlah Bag Tidak Sesuai', 'Bag Count Difference'), 'warn', 'package', null],
    damaged: [L('Bag Rusak', 'Damaged Bag'), 'warn', 'package', null], wet: [L('Laundry Basah', 'Wet Laundry'), 'info', 'droplet', null],
    contam: [L('Laundry Terkontaminasi', 'Contaminated Laundry'), 'crit', 'alert', null], special: [L('Ada Barang Khusus', 'Special Item Found'), 'info', 'star', null],
    traffic: [L('Terlambat (Macet)', 'Traffic Delay'), 'warn', 'clock', 'traffic'], vehicle: [L('Masalah Kendaraan', 'Vehicle Problem'), 'crit', 'truck', 'vehicle'],
    routedelay: [L('Rute Terlambat', 'Route Delay'), 'warn', 'route', 'prevstop'], pickcancel: [L('Pickup Dibatalkan', 'Pickup Cancelled'), 'warn', 'xc', null],
    rejected: [L('Delivery Ditolak', 'Delivery Rejected'), 'crit', 'xc', null], missing: [L('Bag Hilang', 'Missing Bag'), 'crit', 'search', null], other: [L('Lainnya', 'Other'), 'info', 'more', null]
  };
  M.SEV = { info: [L('Info', 'Info'), 'info', 1], warn: [L('Peringatan', 'Warning'), 'warn', 2], crit: [L('Kritis', 'Critical'), 'crit', 3] };
  M.ISSUE_ACT = { continue: [L('Lanjutkan', 'Continue'), 'play'], wait: [L('Tunggu', 'Wait'), 'hourglass'], reschedule: [L('Jadwalkan Ulang', 'Reschedule'), 'calendar'], return: [L('Kembali / Bawa Pulang', 'Return'), 'arrowl'], review: [L('Minta Supervisor', 'Supervisor Review'), 'users'], cancel: [L('Batalkan', 'Cancel'), 'xc'] };
  M.ISSUE_ST = { open: [L('Terbuka', 'Open'), 'warn'], review: [L('Review Supervisor', 'Supervisor Review'), 'crit'], resolved: [L('Selesai', 'Resolved'), 'ok'] };
  M.DELAY = { traffic: L('Macet', 'Traffic'), prevstop: L('Stop sebelumnya terlambat', 'Previous stop delay'), client: L('Klien terlambat', 'Client delay'), vehicle: L('Masalah kendaraan', 'Vehicle issue'), routechange: L('Rute berubah', 'Route change'), weather: L('Cuaca', 'Weather'), other: L('Lainnya', 'Other') };
  // §63 trip status (what the client and the driver see)
  M.TRIP_ST = {
    assigned: [L('Driver Ditugaskan', 'Assigned'), 'info'], ready: [L('Siap Berangkat', 'Ready'), 'info'], ontheway: [L('Dalam Perjalanan', 'On The Way'), 'info'], near: [L('Hampir Tiba', 'Near Destination'), 'info'],
    arrived: [L('Tiba', 'Arrived'), 'ok'], inprogress: [L('Sedang Dikerjakan', 'In Progress'), 'appr'], completed: [L('Selesai', 'Completed'), 'ok'], delayed: [L('Terlambat', 'Delayed'), 'warn'], issue: [L('Ada Masalah', 'Issue'), 'crit']
  };
  // §57 driver status on the operations map
  M.LIVE_ST = {
    moving: [L('Bergerak', 'Moving'), 'info'], arrived: [L('Di Lokasi', 'Arrived'), 'ok'], delayed: [L('Terlambat', 'Delayed'), 'warn'], issue: [L('Ada Masalah', 'Issue'), 'crit'],
    weak: [L('Sinyal Lemah', 'Weak Connection'), 'warn'], offline: [L('Offline', 'Offline'), 'mute'], ended: [L('Shift Selesai', 'Shift Ended'), 'mute'], idle: [L('Di Plant / Belum Jalan', 'At Plant / Not Started'), 'mute'], returning: [L('Kembali ke Plant', 'Returning to Plant'), 'info']
  };
  M.EV_KIND = {
    arrive: [L('Driver Tiba', 'Driver Arrived'), 'pin'], photo: [L('Foto Ditambahkan', 'Photo Added'), 'camera'], file: [L('File Ditambahkan', 'File Added'), 'file'], sign: [L('Tanda Tangan', 'Signature'), 'sign'],
    pic: [L('PIC Klien', 'Client PIC'), 'user'], recv: [L('Penerima', 'Recipient'), 'user'], pin: [L('Map Pin', 'Map Pin'), 'pin'], note: [L('Catatan', 'Notes'), 'edit'], bags: [L('Jumlah Bag', 'Bag Count'), 'package'],
    cond: [L('Kondisi', 'Condition'), 'shield'], doc: [L('Dokumen', 'Document'), 'file'], done: [L('Selesai', 'Completed'), 'checkc'], amend: [L('Koreksi', 'Amendment'), 'edit']
  };
  M.TL = {
    shift: [L('Mulai Shift', 'Shift Start'), 'user'], tripstart: [L('Mulai Perjalanan', 'Trip Start'), 'play'], depart: [L('Berangkat', 'Depart'), 'truck'], arrive: [L('Tiba', 'Arrival'), 'pin'],
    pickstart: [L('Mulai Pickup', 'Pickup Start'), 'clipboard'], pickdone: [L('Pickup Selesai', 'Pickup Complete'), 'checkc'], delstart: [L('Mulai Delivery', 'Delivery Start'), 'package'], deldone: [L('Delivery Selesai', 'Delivery Complete'), 'checkc'],
    issue: [L('Masalah', 'Issue'), 'alert'], ret: [L('Kembali ke Plant', 'Return to Plant'), 'route'], plant: [L('Tiba di Plant', 'Arrived at Plant'), 'factory'], handover: [L('Handover', 'Handover'), 'filecheck'], shiftend: [L('Shift Selesai', 'Shift Complete'), 'flag']
  };
  M.EVENTS = {
    'ORDER.CREATE': L('Order dibuat', 'Order created'), 'ORDER.STATUS': L('Status order berubah', 'Order status changed'), 'ORDER.EDIT': L('Order diubah', 'Order changed'), 'ORDER.GENERATE': L('Order otomatis dari jadwal', 'Auto order from schedule'),
    'SCHEDULE.CREATE': L('Jadwal dibuat', 'Schedule created'), 'SCHEDULE.CHANGE': L('Jadwal diubah', 'Schedule changed'),
    'DRIVER.ASSIGN': L('Driver ditugaskan', 'Driver assigned'), 'VEHICLE.ASSIGN': L('Kendaraan ditugaskan', 'Vehicle assigned'), 'ROUTE.CHANGE': L('Rute diubah', 'Route changed'), 'ROUTE.EDIT': L('Master rute diubah', 'Route master changed'),
    'TRIP.START': L('Perjalanan dimulai', 'Trip started'), 'TRIP.ARRIVE': L('Driver tiba', 'Driver arrived'), 'PICKUP.COMPLETE': L('Pickup selesai', 'Pickup completed'), 'DELIVERY.COMPLETE': L('Delivery selesai', 'Delivery completed'),
    'ISSUE.CREATE': L('Masalah dilaporkan', 'Issue created'), 'ISSUE.ESCALATE': L('Masalah kritis dieskalasi', 'Critical issue escalated'), 'ISSUE.DECIDE': L('Masalah diputuskan', 'Issue decided'),
    'EVIDENCE.ADD': L('Bukti ditambahkan', 'Evidence added'), 'EVIDENCE.AMEND': L('Bukti dikoreksi (amended)', 'Evidence amended'), 'MANIFEST.CHANGE': L('Manifest / bag diubah', 'Manifest / bag changed'),
    'PLANT.ARRIVE': L('Tiba di plant', 'Arrived at plant'), 'HANDOVER.CONFIRM': L('Handover dikonfirmasi', 'Handover confirmed'), 'HANDOVER.DIFF': L('Selisih handover', 'Handover difference'), 'RECEIVING.START': L('Receiving dimulai', 'Receiving started'),
    'TRACK.START': L('Pelacakan lokasi dimulai', 'Tracking started'), 'TRACK.STOP': L('Pelacakan lokasi dihentikan', 'Tracking stopped'), 'ETA.UPDATE': L('ETA diperbarui', 'ETA updated'),
    'CHAT.PROMOTE': L('Lampiran chat dijadikan bukti', 'Chat evidence promoted'), 'LOCATION.VIEW': L('Lokasi live dilihat', 'Live location viewed'), 'SHIFT.END': L('Shift selesai', 'Shift ended'), 'VEHICLE.STATUS': L('Status kendaraan diubah', 'Vehicle status changed'),
    'ACCESS.DENIED': L('Tindakan ditolak', 'Action denied')
  };
  M.NOTIF = {
    assigned: [L('Driver Ditugaskan', 'Driver Assigned'), 'user'], tripstart: [L('Driver Berangkat', 'Trip Started'), 'truck'], near: [L('Hampir Tiba', 'Near Arrival'), 'pin'], arrived: [L('Driver Tiba', 'Driver Arrived'), 'pin'],
    pickdone: [L('Pickup Selesai', 'Pickup Complete'), 'checkc'], deldone: [L('Delivery Selesai', 'Delivery Complete'), 'checkc'], delay: [L('Terlambat', 'Delay'), 'clock'], resched: [L('Jadwal Diubah', 'Reschedule'), 'calendar'],
    urgent: [L('Urgent Belum Ditugaskan', 'Urgent Unassigned'), 'alert'], routedelay: [L('Rute Terlambat', 'Route Delay'), 'route'], vehicle: [L('Masalah Kendaraan', 'Vehicle Issue'), 'truck'], critical: [L('Masalah Pickup Kritis', 'Critical Pickup Issue'), 'alert'],
    bagdiff: [L('Selisih Bag', 'Bag Difference'), 'package'], offline: [L('Driver Offline', 'Driver Offline'), 'wifioff'], slarisk: [L('Risiko SLA', 'SLA Risk'), 'clock'], routechange: [L('Rute Berubah', 'Route Changed'), 'route'], task: [L('Tugas Baru', 'New Task'), 'clipboard']
  };
  M.CHAT_SYS = {
    assigned: L('Driver ditugaskan', 'Driver assigned'), tripstart: L('Perjalanan dimulai', 'Trip started'), eta: L('ETA diperbarui', 'ETA updated'), near: L('Driver hampir tiba', 'Driver near arrival'), arrived: L('Driver tiba', 'Driver arrived'),
    pickdone: L('Pickup selesai', 'Pickup complete'), deldone: L('Delivery selesai', 'Delivery complete'), issue: L('Masalah dilaporkan', 'Issue created'), routechange: L('Rute diubah', 'Route changed'), resched: L('Jadwal diubah', 'Rescheduled')
  };

  /* ---------- State (browser: localStorage · node: memory) ---------- */
  var KEY = 'jfos-logi-v1', mem = {}, st = null, T0 = Date.now(), SIM = ms(D.simNow);
  var clock = function () { return SIM + (Date.now() - T0); };
  var ls = null;
  try { ls = root.localStorage || null; if (ls) { ls.setItem('__jfl', '1'); ls.removeItem('__jfl'); } } catch (e) { ls = null; }
  function full(h) { return h && h.length <= 5 ? D.today + ' ' + h : h; }
  function seed() {
    var s = {
      v: 1, orders: clone(D.ORDERS), trips: clone(D.TRIPS), manifests: clone(D.MANIFESTS), issues: clone(D.ISSUES), schedules: clone(D.SCHEDULES), holidays: clone(D.HOLIDAYS),
      routes: clone(D.ROUTES), drivers: clone(D.DRIVERS), vehicles: clone(D.VEHICLES), bags: [], evidence: [], chat: [], notifs: [], locLog: [], audit: [], reads: {}, gen: {}, seq: { ord: 150, sch: 14, iss: 5, mf: 6, trp: 5, ev: 1, msg: 1, nt: 1 },
      cfg: { nearMin: 10, nearM: 500, delayMin: 10, delayStep: 10, staleSec: 120, offlineSec: 900, pingSec: 20, stopMin: 15, speed: 4, retention: 30, genAt: '06:00', dual: true, spvReview: true, ownerReason: true }
    };
    s.orders.forEach(function (o) { var sc0 = o.sch && by(s.schedules, 'id', o.sch); if (sc0) { o.prefRoute = sc0.route; o.prefDrv = sc0.drv; o.prefVeh = sc0.veh; } o.ev = o.ev.map(function (e) { return [e[0], full(e[1]), e[2]]; }); o.flags = {}; if (o.st === 'ontheway' || o.st === 'arrived') o.flags.started = true; o.genAt = o.src === 'scheduled' ? D.today + ' 06:00' : null; });
    s.trips.forEach(function (t) { t.shiftStart = full(t.shiftStart); t.log = [['shift', t.shiftStart, t.drv]]; if (t.track.from) t.log.push(['tripstart', t.track.from, t.drv]); if (t.returned) { t.log.push(['ret', D.today + ' 08:20', t.drv], ['plant', full(t.returned), t.drv]); t.atPlant = full(t.returned); } t.flags = {}; });
    s.manifests.forEach(function (m) {
      var o = by(s.orders, 'id', m.ord), n = m.bags + (m.cont || 0);
      for (var i = 1; i <= n; i++) {
        var id = 'BAG-' + m.id.slice(3) + '-' + (i < 10 ? '0' : '') + i, bst = m.st === 'received' ? 'received' : m.st === 'discrepancy' && i === n ? 'missing' : m.st === 'discrepancy' ? 'arrived' : 'intransit';
        s.bags.push({ id: id, mf: m.id, ord: m.ord, cl: o.cl, prop: o.prop, kind: i > m.bags ? 'container' : 'bag', cat: m.cat, st: bst, code: 'JF' + id.replace(/\D/g, ''), at: m.pickAt, special: m.id === 'MF-2610-02' && i <= 2, damaged: false, wet: m.id === 'MF-2610-03' && i === 1, hist: [] });
      }
      m.ver = 1; m.hist = [];
    });
    s.evidence = D.EVIDENCE.map(function (e, i) { return { id: 'EV-' + (1000 + i), ord: e[0], kind: e[1], at: full(e[2]), by: e[3], data: e[4] || null, img: e[1] === 'photo' ? 'seed:' + e[4] : null, amends: null, superseded: null, src: null }; });
    s.seq.ev = 1000 + s.evidence.length;
    s.chat = D.CHAT.map(function (c, i) { return { id: 'MSG-' + (100 + i), ord: c[0], at: full(c[1]), by: c[2], kind: c[3], body: c[4], extra: c[5] || null }; });
    s.seq.msg = 100 + s.chat.length;
    s.notifs = D.NOTIFS.map(function (n, i) { return { id: 'NT-' + (100 + i), to: n[0], kind: n[1], ord: n[2], at: full(n[3]), ref: n[4] || null, v: {} }; });
    s.seq.nt = 100 + s.notifs.length;
    s.locLog = D.LOCLOG.map(function (x) { return { who: x[0], role: x[1], drv: x[2], trip: x[3], at: full(x[4]), reason: x[5] }; });
    s.issues.forEach(function (i) { var o = i.ord && by(s.orders, 'id', i.ord); i.trip = o ? o.trip : i.trip || null; i.cl = o ? o.cl : null; i.prop = o ? o.prop : null; i.drv = o && o.trip ? by(s.trips, 'id', o.trip).drv : (i.by && by(s.drivers, 'id', i.by) ? i.by : null); i.hist = []; });
    return s;
  }
  function S() {
    if (st) return st;
    try { var raw = ls ? ls.getItem(KEY) : mem[KEY]; st = raw ? JSON.parse(raw) : null; } catch (e) { st = null; }
    if (!st || st.v !== 1) { st = seed(); save(); }
    else if (st.simAt && st.simAt > SIM) { SIM = st.simAt; T0 = Date.now(); }   // the simulated day continues where it stopped
    return st;
  }
  function save() { if (!st) return; st.simAt = clock(); try { var s = JSON.stringify(st); if (ls) ls.setItem(KEY, s); else mem[KEY] = s; } catch (e) {} }
  M.state = S; M.save = save;
  M._reset = function () { SIM = ms(D.simNow); T0 = Date.now(); st = seed(); save(); };
  M._setClock = function (fn) { clock = fn; };
  M.now = function () { S(); return clock(); };
  M.cfg = function () { return S().cfg; };
  function nid(k, pre, pad) { var n = S().seq[k]++; return pre + (pad ? String(n).padStart(pad, '0') : n); }

  /* ---------- Audit (§78) ---------- */
  M.audit = function (ev, ctx, o) {
    o = o || {};
    var e = { at: M.now(), ev: ev, uid: ctx && ctx.uid || null, by: ctx && (ctx.fullName || ctx.name) || 'system', emp: empId(ctx), rec: o.rec || null, ord: o.ord || null,
      from: o.from == null ? null : String(o.from), to: o.to == null ? null : String(o.to), reason: o.reason == null ? null : T(o.reason) };
    S().audit.unshift(e); if (S().audit.length > 800) S().audit.length = 800; save();
    return e;
  };
  M.auditLog = function (f) { f = f || {}; return S().audit.filter(function (e) { return (!f.ord || e.ord === f.ord || e.rec === f.ord) && (!f.ev || e.ev.indexOf(f.ev) === 0); }); };
  function deny(ctx, what) { M.audit('ACCESS.DENIED', ctx, { rec: what }); return { ok: false, code: 'noperm', msg: M.MSG.noperm }; }
  function bad(msg, code, x) { return Object.assign({ ok: false, code: code || 'invalid', msg: msg || M.MSG.invalid }, x || {}); }

  /* ---------- Lookups (clients / properties / contacts from Phase 6) ---------- */
  M.order = function (id) { return by(S().orders, 'id', id); };
  M.trip = function (id) { return by(S().trips, 'id', id); };
  M.route = function (id) { return by(S().routes, 'id', id); };
  M.driver = function (id) { return by(S().drivers, 'id', id); };
  M.vehicle = function (id) { return by(S().vehicles, 'id', id); };
  M.manifest = function (id) { return by(S().manifests, 'id', id); };
  M.mfOf = function (ord) { return by(S().manifests, 'ord', ord); };
  M.issue = function (id) { return by(S().issues, 'id', id); };
  M.schedule = function (id) { return by(S().schedules, 'id', id); };
  M.bag = function (id) { return by(S().bags, 'id', id) || by(S().bags, 'code', id); };
  M.prop = function (id) { return CM ? CM.prop(id) : null; };
  M.client = function (id) { return CM ? CM.client(id) : null; };
  M.contact = function (id) { return CM ? CM.contact(id) : null; };
  M.propName = function (id) { var p = M.prop(id); return p ? p.n : id; };
  M.clientName = function (id) { var c = M.client(id); return c ? c.n : id; };
  M.svcName = function (id) { return CM ? CM.svcName(id) : id; };
  M.empName = function (id) {
    if (!id) return '—'; if (id === 'system') return T(L('Sistem', 'System'));
    var d = M.driver(id); if (d) return d.n; if (D.STAFF[id]) return D.STAFF[id];
    var c = M.contact(id); if (c) return c.n;
    return CM ? CM.empName(id) : id;
  };
  M.first = function (id) { var d = M.driver(id); return d ? d.short : String(M.empName(id)).split(' ')[0]; };
  M.loc = function (prop) { return D.LOC[prop] || [D.PLANT.x, D.PLANT.y]; };
  M.PLANT = [D.PLANT.x, D.PLANT.y];
  M.tripOf = function (o) { return o && o.trip ? M.trip(o.trip) : null; };
  M.driverTrip = function (drv) { var t = S().trips.filter(function (x) { return x.drv === drv && x.st !== 'done'; })[0]; return t || S().trips.filter(function (x) { return x.drv === drv; }).slice(-1)[0] || null; };
  M.tripOrders = function (t) { return t ? t.stops.map(M.order).filter(Boolean) : []; };
  M.evAt = function (o, s) { for (var i = o.ev.length - 1; i >= 0; i--) if (o.ev[i][0] === s) return o.ev[i][1]; return null; };
  M.planAt = function (o) { return at(o.date, o.plan || o.win[0]); };
  M.sla = function (o) { var p = M.prop(o.prop); return CM && p ? CM.slaFor({ cl: p.cl, prop: o.prop, svc: o.svc, cat: o.cat, pri: o.pri === 'superexpress' || o.pri === 'express' ? 'express' : null }) : null; };
  // Record → scope for the app's authorize() check (§81, §90). All logistics runs from Main Plant (PL-01).
  M.recordOf = function (rec) {
    if (!rec) return null;
    var o = M.order(rec); if (o) return { cl: o.cl, plant: 'PL-01' };
    var m = M.manifest(rec); if (m) { o = M.order(m.ord); return { cl: o.cl, plant: 'PL-01' }; }
    var i = M.issue(rec); if (i) return { cl: i.cl || undefined, plant: 'PL-01' };
    var b = M.bag(rec); if (b) return { cl: b.cl, plant: 'PL-01' };
    if (M.trip(rec) || M.route(rec) || M.driver(rec) || M.vehicle(rec) || M.schedule(rec)) { var sc = M.schedule(rec); return { cl: sc ? sc.cl : undefined, plant: 'PL-01' }; }
    return null;
  };

  /* ---------- Scope (§81, §90): client → own orders; driver → own trip; staff → by permission ---------- */
  M.myDriver = function (ctx) { var e = empId(ctx); return M.driver(e) ? e : null; };
  M.ownsOrder = function (ctx, o) { var t = M.tripOf(o); return !!(t && t.drv === empId(ctx)); };
  M.canSeeOrder = function (ctx, o) {
    if (!o) return false;
    if (isClient(ctx)) return o.cl === ctx.client;
    if (can(ctx, 'lg.drv.task') && !can(ctx, 'lg.order.view')) return M.ownsOrder(ctx, o);
    return can(ctx, 'lg.order.view') || can(ctx, 'lg.dispatch') || can(ctx, 'lg.arrival') || M.ownsOrder(ctx, o);
  };
  M.orders = function (ctx, f) {
    f = f || {};
    return S().orders.filter(function (o) {
      if (!M.canSeeOrder(ctx, o)) return false;
      if (f.st && (f.st === 'active' ? ['completed', 'atplant', 'received', 'cancelled'].indexOf(o.st) >= 0 : o.st !== f.st)) return false;
      if (f.kind && o.kind !== f.kind) return false;
      if (f.src && o.src !== f.src) return false;
      if (f.pri && o.pri !== f.pri) return false;
      if (f.cl && o.cl !== f.cl) return false;
      if (f.date && o.date !== f.date) return false;
      if (f.drv) { var t = M.tripOf(o); if (!t || t.drv !== f.drv) return false; }
      if (f.q) { var q = f.q.toLowerCase(); if ([o.id, M.clientName(o.cl), M.propName(o.prop), M.svcName(o.svc)].join(' ').toLowerCase().indexOf(q) < 0) return false; }
      return true;
    }).sort(function (a, b) { return (a.date + (a.plan || a.win[0])).localeCompare(b.date + (b.plan || b.win[0])) || M.priRank(b.pri) - M.priRank(a.pri); });
  };
  // A client sees only what is theirs (§62, §81): no driver schedule, no other stops, no internal notes.
  M.clientOrder = function (ctx, id) { var o = M.order(id); return o && isClient(ctx) && o.cl === ctx.client ? o : null; };

  /* ---------- Status changes (§6) ---------- */
  function setSt(o, to, ctx, note) {
    var from = o.st;
    if (to === 'issue') o.prevSt = from;
    o.st = to; o.ev.push([to, isoT(M.now()), empId(ctx), note || null]);
    M.audit('ORDER.STATUS', ctx, { ord: o.id, rec: o.id, from: from, to: to, reason: note });
    return o;
  }
  M.setStatus = function (ctx, id, to, o2) {
    var o = M.order(id); if (!o) return bad(M.MSG.notfound, 'notfound');
    if (!M.canMove(o, to)) return bad(M.MSG.jump, 'jump');
    var needEdit = ['cancelled', 'scheduled', 'requested', 'assigned'].indexOf(to) >= 0 || (to === 'ready' && !M.ownsOrder(ctx, o));
    if (needEdit && !can(ctx, 'lg.order.edit') && !can(ctx, 'lg.dispatch')) return deny(ctx, id);
    if (to === 'cancelled' && !(o2 && String(o2.reason || '').trim())) return bad(M.MSG.reason, 'reason');
    setSt(o, to, ctx, o2 && o2.reason); save();
    return { ok: true, order: o };
  };

  /* ---------- Orders (§4–§7) ---------- */
  function overlap(a, b) { return a[0] < b[1] && b[0] < a[1]; }
  M.duplicates = function (q) {
    return S().orders.filter(function (o) {
      return o.prop === q.prop && o.kind === (q.kind || 'pickup') && o.date === q.date && ['cancelled', 'received'].indexOf(o.st) < 0 && overlap(o.win, q.win) && o.id !== q.id;
    }).map(function (o) { return { o: o, same: { svc: o.svc === q.svc, src: o.src === q.src, cl: o.cl === q.cl } }; });
  };
  M.createOrder = function (ctx, f, opt) {
    opt = opt || {};
    if (!can(ctx, 'lg.order.create')) return deny(ctx, 'ORDER');
    var p = M.prop(f.prop); if (!p) return bad(L('Pilih property.', 'Choose a property.'), 'prop');
    if (isClient(ctx) && p.cl !== ctx.client) return deny(ctx, f.prop);
    var cl = M.client(p.cl);
    if (p.status !== 'active') return bad(L('Property tidak aktif.', 'The property is not active.'), 'prop');
    if (cl && cl.status === 'onhold') return bad(M.MSG.hold, 'hold');
    var kind = f.kind === 'delivery' ? 'delivery' : 'pickup';
    if (isClient(ctx) && kind !== 'pickup') return bad(M.MSG.invalid);
    if (!f.date || !/^\d{4}-\d{2}-\d{2}$/.test(f.date) || f.date < M.TODAY) return bad(L('Tanggal tidak boleh di masa lalu.', 'The date cannot be in the past.'), 'date');
    var win = f.win || [];
    if (!/^\d{2}:\d{2}$/.test(win[0] || '') || !/^\d{2}:\d{2}$/.test(win[1] || '') || win[0] >= win[1]) return bad(L('Jam mulai harus lebih awal dari jam selesai.', 'The start time must be before the end time.'), 'win');
    if (f.date === M.TODAY && at(f.date, win[1]) <= M.now()) return bad(L('Jam yang dipilih sudah lewat.', 'The chosen time has already passed.'), 'win');
    var bags = +f.bags; if (!(bags >= 1 && bags <= 99)) return bad(L('Isi perkiraan jumlah bag (1–99).', 'Enter the estimated bags (1–99).'), 'bags');
    var kg = f.kg === '' || f.kg == null ? null : +f.kg; if (kg != null && (isNaN(kg) || kg < 0 || kg > 2000)) return bad(L('Perkiraan berat tidak valid.', 'Estimated weight is not valid.'), 'kg');
    var pri = M.PRI[f.pri] ? f.pri : 'normal', svc = f.svc && CM.service(f.svc) ? f.svc : null; if (!svc) return bad(L('Pilih layanan.', 'Choose a service.'), 'svc');
    var ct = f.ct ? M.contact(f.ct) : null; if (f.ct && (!ct || ct.cl !== p.cl)) return bad(L('PIC bukan kontak klien ini.', 'The PIC is not a contact of this client.'), 'ct');
    var src = isClient(ctx) ? 'client' : (M.SRC[f.src] ? f.src : 'manual');
    var q = { prop: p.id, kind: kind, date: f.date, win: win, svc: svc, src: src };
    var dup = M.duplicates(q);
    if (dup.length && !opt.force) return bad(M.MSG.dup, 'dup', { dup: dup });
    if (dup.length && !String(opt.reason || '').trim()) return bad(M.MSG.reason, 'reason', { dup: dup });
    var o = { id: nid('ord', 'ORD-2610-'), prop: p.id, cl: p.cl, kind: kind, date: f.date, win: [win[0], win[1]], pri: pri, svc: svc, bags: bags, kg: kg, cat: M.CAT[f.cat] ? f.cat : 'linen', src: src, st: f.draft ? 'draft' : 'requested',
      sch: null, ctr: (CM.activeContracts(p.cl)[0] || {}).no || null, ct: ct ? ct.id : null, instr: String(f.instr || '').trim(), by: empId(ctx), at: isoT(M.now()), trip: null, ev: [], exec: null, pod: null, plan: null, flags: {}, dupOf: dup.length ? dup[0].o.id : null, dupReason: dup.length ? opt.reason : null };
    o.ev.push([o.st, o.at, o.by]);
    var sl = M.sla(o); o.slaTat = sl ? sl.tat : null; o.slaRule = sl ? sl.rule.id : null;
    S().orders.push(o); save();
    M.audit('ORDER.CREATE', ctx, { ord: o.id, rec: o.id, to: o.st, reason: dup.length ? T(L('Order ganda dikonfirmasi: ', 'Duplicate confirmed: ')) + opt.reason : null });
    if (M.priRank(pri) >= 4) notify('sup', 'urgent', o, { prop: M.propName(o.prop) });
    return { ok: true, order: o, dup: dup };
  };
  M.submitDraft = function (ctx, id) { var o = M.order(id); if (!o || !M.canSeeOrder(ctx, o)) return bad(M.MSG.notfound); if (!can(ctx, 'lg.order.create')) return deny(ctx, id); if (o.st !== 'draft') return bad(M.MSG.jump, 'jump'); setSt(o, 'requested', ctx); save(); return { ok: true, order: o }; };
  M.prioritize = function (ctx, id, pri, reason) {
    var o = M.order(id); if (!o) return bad(M.MSG.notfound);
    if (!can(ctx, 'lg.order.edit')) return deny(ctx, id);
    if (!M.PRI[pri]) return bad(); if (!String(reason || '').trim()) return bad(M.MSG.reason, 'reason');
    var from = o.pri; o.pri = pri; save();
    M.audit('ORDER.EDIT', ctx, { ord: id, rec: id, from: T(M.PRI[from][0]), to: T(M.PRI[pri][0]), reason: reason });
    return { ok: true, order: o };
  };
  M.reschedule = function (ctx, id, date, win, reason) {
    var o = M.order(id); if (!o) return bad(M.MSG.notfound);
    if (!can(ctx, 'lg.order.edit')) return deny(ctx, id);
    if (['ontheway', 'arrived', 'inprogress', 'completed', 'atplant', 'received', 'cancelled'].indexOf(o.st) >= 0) return bad(L('Order yang sudah berjalan tidak bisa dijadwalkan ulang.', 'An order already running cannot be rescheduled.'), 'jump');
    if (!String(reason || '').trim()) return bad(M.MSG.reason, 'reason');
    if (!date || date < M.TODAY || !win || win[0] >= win[1]) return bad(L('Periksa tanggal dan jam.', 'Check the date and time.'), 'date');
    var from = o.date + ' ' + o.win.join('–');
    removeFromTrip(o);
    o.date = date; o.win = [win[0], win[1]]; o.plan = null;
    if (o.st !== 'scheduled') setSt(o, 'scheduled', ctx, reason);
    save();
    M.audit('ORDER.EDIT', ctx, { ord: id, rec: id, from: from, to: date + ' ' + win.join('–'), reason: reason });
    notify(o.cl, 'resched', o, { date: date, win: win.join('–') }); sysChat(o, 'resched', date + ' ' + win.join('–'));
    return { ok: true, order: o };
  };
  function removeFromTrip(o) { var t = M.tripOf(o); if (t) { t.stops = t.stops.filter(function (x) { return x !== o.id; }); } o.trip = null; }

  /* ---------- Recurring schedules (§8–§12) ---------- */
  M.schedules = function (ctx, f) {
    f = f || {};
    if (!can(ctx, 'lg.schedule.view')) return [];
    return S().schedules.filter(function (s) { return (!f.cl || s.cl === f.cl) && (!f.prop || s.prop === f.prop) && (f.all || !s.next) && (!f.st || (f.st === 'active' ? s.active : !s.active)); });
  };
  M.holidayOn = function (date, prop) { return S().holidays.filter(function (h) { return h.d === date && (!h.prop || h.prop === prop); })[0] || null; };
  function shiftT(h, min) { var t = at('2026-01-01', h) + min * MIN; return hm(t); }
  // One schedule on one date → occurrences with the holiday rule applied (§12).
  M.occurrences = function (s, date) {
    var out = [], dow = new Date(ms(date)).getUTCDay();
    if (date < s.eff || (s.end && date > s.end)) return out;
    var base = s.days.indexOf(dow) >= 0;
    var mv = s.moves.filter(function (m) { return m.from === date; })[0];
    if (base && !mv) {
      var skip = s.skips.indexOf(date) >= 0, hol = M.holidayOn(date, s.prop), occ = { sch: s.id, date: date, pick: s.pick, del: s.del, hol: hol, rule: null, skipped: skip, confirm: false, paused: !s.active };
      if (hol && !skip) {
        var rule = hol.prop ? hol.rule : (s.hol || hol.rule); occ.rule = rule;
        if (rule === 'skip') occ.skipped = true;
        else if (rule === 'earlier') occ.pick = shiftT(s.pick, -(hol.min || 60));
        else if (rule === 'later') occ.pick = shiftT(s.pick, hol.min || 60);
        else if (rule === 'confirm') occ.confirm = true;
      }
      out.push(occ);
    }
    s.moves.filter(function (m) { return m.to === date; }).forEach(function (m) { out.push({ sch: s.id, date: date, pick: m.pick || s.pick, del: s.del, moved: m.from, hol: null, skipped: false, confirm: false, paused: !s.active }); });
    s.extra.filter(function (x) { return x.date === date; }).forEach(function (x) { out.push({ sch: s.id, date: date, pick: x.pick, del: s.del, extra: true, hol: null, skipped: false, confirm: false, paused: !s.active }); });
    return out;
  };
  M.calendar = function (ctx, from, days) {
    var rows = [];
    for (var i = 0; i < (days || 7); i++) {
      var d = addDays(from || M.TODAY, i);
      M.schedules(ctx, { all: true }).forEach(function (s) { M.occurrences(s, d).forEach(function (o) { rows.push(o); }); });
    }
    return rows;
  };
  function winOf(pick) { return [pick, shiftT(pick, pick < '12:00' ? 60 : 30)]; }
  /* Auto order (§10): at genAt the system creates the orders of a date. Deduplicated per schedule, date and time. */
  M.generate = function (ctx, date, o2) {
    o2 = o2 || {};
    if (ctx && !can(ctx, 'lg.schedule.edit')) return deny(ctx, 'GENERATE');
    var made = [], skipped = [], s0 = S();
    s0.schedules.forEach(function (s) {
      M.occurrences(s, date).forEach(function (oc) {
        var key = s.id + '|' + date + '|' + oc.pick;
        if (!s.active) { skipped.push([oc, 'paused']); return; }
        if (oc.skipped) { skipped.push([oc, 'skip']); return; }
        if (oc.confirm && !o2.confirmed) { skipped.push([oc, 'confirm']); return; }
        if (s0.gen[key] || s0.orders.some(function (x) { return x.sch === s.id && x.date === date && (x.win[0] === oc.pick || x.genKey === key) && x.st !== 'cancelled'; })) { skipped.push([oc, 'exists']); return; }
        var cl = M.client(s.cl); if (cl && cl.status === 'onhold') { skipped.push([oc, 'hold']); return; }
        var o = { id: nid('ord', 'ORD-2610-'), prop: s.prop, cl: s.cl, kind: 'pickup', date: date, win: winOf(oc.pick), pri: s.pri, svc: s.svc, bags: s.bags, kg: s.kg, cat: s.cat, src: 'scheduled', st: 'scheduled', sch: s.id, ctr: s.ctr,
          ct: null, instr: s.instr || '', by: 'system', at: isoT(M.now()), genAt: isoT(M.now()), genKey: key, trip: null, ev: [['scheduled', isoT(M.now()), 'system']], exec: null, pod: null, plan: null, flags: {}, prefDrv: s.drv, prefVeh: s.veh, prefRoute: s.route };
        var sl = M.sla(o); o.slaTat = sl ? sl.tat : null; o.slaRule = sl ? sl.rule.id : null;
        if (oc.hol) o.instr = (o.instr ? o.instr + ' · ' : '') + T(oc.hol.n);
        s0.orders.push(o); s0.gen[key] = o.id; made.push(o);
        M.audit('ORDER.GENERATE', ctx || null, { ord: o.id, rec: s.id, to: date + ' ' + oc.pick });
      });
    });
    save();
    return { ok: true, made: made, skipped: skipped };
  };
  var SCH_FIELDS = ['prop', 'svc', 'days', 'pick', 'del', 'freq', 'eff', 'end', 'hol', 'route', 'drv', 'veh', 'bags', 'kg', 'cat', 'pri', 'ctr'];
  function schValid(f) {
    if (!f.prop || !M.prop(f.prop)) return L('Pilih property.', 'Choose a property.');
    if (!f.svc) return L('Pilih layanan.', 'Choose a service.');
    if (!/^\d{2}:\d{2}$/.test(f.pick || '') || !/^\d{2}:\d{2}$/.test(f.del || '')) return L('Isi jam pickup dan delivery.', 'Enter pickup and delivery times.');
    if (!f.days || !f.days.length) return L('Pilih minimal satu hari.', 'Choose at least one day.');
    if (!f.eff) return L('Isi tanggal berlaku.', 'Enter the effective date.');
    if (f.end && f.end < f.eff) return L('Tanggal akhir sebelum tanggal berlaku.', 'The end date is before the effective date.');
    if (f.veh && M.vehicle(f.veh) && M.vehicle(f.veh).cap.bags < (+f.bags || 0)) return L('Perkiraan bag melebihi kapasitas kendaraan pilihan.', 'Estimated bags exceed the preferred vehicle capacity.');
    return null;
  }
  M.saveSchedule = function (ctx, id, f) {
    if (!can(ctx, 'lg.schedule.edit')) return deny(ctx, id || 'SCHEDULE');
    var err = schValid(f); if (err) return bad(err);
    var p = M.prop(f.prop), x;
    if (!id) {
      x = { id: nid('sch', 'SCH-', 2), prop: p.id, cl: p.cl, ctr: f.ctr || (CM.activeContracts(p.cl)[0] || {}).no || null, svc: f.svc, days: f.days.map(Number), pick: f.pick, del: f.del, freq: f.freq || 'days', eff: f.eff, end: f.end || null, hol: f.hol || 'earlier',
        route: f.route || null, drv: f.drv || null, veh: f.veh || null, active: true, skips: [], extra: [], moves: [], bags: +f.bags || 1, kg: +f.kg || 0, cat: f.cat || 'linen', pri: f.pri || 'normal', note: f.note ? L(f.note, f.note) : null };
      S().schedules.push(x); save();
      M.audit('SCHEDULE.CREATE', ctx, { rec: x.id, to: M.propName(x.prop) + ' ' + x.pick });
      return { ok: true, schedule: x };
    }
    // Edit Future Schedule (§11): the old version ends the day before; a new version starts on the effective date.
    var old = M.schedule(id); if (!old) return bad(M.MSG.notfound);
    if (!String(f.reason || '').trim()) return bad(M.MSG.reason, 'reason');
    if (f.eff < M.TODAY) return bad(L('Perubahan hanya untuk jadwal mendatang.', 'Changes apply to future dates only.'));
    var changes = SCH_FIELDS.filter(function (k) { return JSON.stringify(old[k]) !== JSON.stringify(k === 'days' ? f.days.map(Number) : k === 'bags' || k === 'kg' ? +f[k] : f[k] || (k === 'end' ? null : old[k])); });
    x = clone(old); x.id = nid('sch', 'SCH-', 2); x.prev = old.id; SCH_FIELDS.forEach(function (k) { if (f[k] !== undefined && f[k] !== '') x[k] = k === 'days' ? f.days.map(Number) : k === 'bags' || k === 'kg' ? +f[k] : f[k]; });
    x.eff = f.eff; x.end = f.end || null; x.skips = old.skips.filter(function (d) { return d >= f.eff; }); x.moves = old.moves.filter(function (m) { return m.from >= f.eff; }); x.extra = old.extra.filter(function (e) { return e.date >= f.eff; });
    old.end = addDays(f.eff, -1); old.next = x.id;
    S().schedules.push(x); save();
    M.audit('SCHEDULE.CHANGE', ctx, { rec: x.id, from: old.id, to: changes.join(', ') + ' · ' + f.eff, reason: f.reason });
    return { ok: true, schedule: x, changes: changes };
  };
  // §11 actions: reschedule · skip · cancel · extra · pause · resume
  M.scheduleAction = function (ctx, id, act, a) {
    a = a || {};
    if (!can(ctx, 'lg.schedule.edit')) return deny(ctx, id);
    var s = M.schedule(id); if (!s) return bad(M.MSG.notfound);
    var reason = String(a.reason || '').trim();
    if (act !== 'resume' && !reason) return bad(M.MSG.reason, 'reason');
    var to;
    if (act === 'skip') { if (!a.date || a.date < M.TODAY) return bad(L('Pilih tanggal yang akan dilewati.', 'Choose the date to skip.')); if (s.skips.indexOf(a.date) < 0) s.skips.push(a.date); to = a.date; cancelGenerated(ctx, s, a.date, reason); }
    else if (act === 'reschedule') { if (!a.from || !a.to || a.to < M.TODAY) return bad(L('Pilih tanggal asal dan tanggal baru.', 'Choose the original and the new date.')); s.moves.push({ from: a.from, to: a.to, pick: a.pick || s.pick, reason: reason }); to = a.from + ' → ' + a.to + ' ' + (a.pick || s.pick); cancelGenerated(ctx, s, a.from, reason); }
    else if (act === 'extra') { if (!a.date || a.date < M.TODAY || !/^\d{2}:\d{2}$/.test(a.pick || '')) return bad(L('Isi tanggal dan jam pickup tambahan.', 'Enter the extra pickup date and time.')); s.extra.push({ date: a.date, pick: a.pick, reason: reason }); to = a.date + ' ' + a.pick; }
    else if (act === 'pause') { s.active = false; s.paused = L(reason, reason); to = 'paused'; }
    else if (act === 'resume') { s.active = true; s.paused = null; to = 'active'; }
    else if (act === 'cancel') { s.active = false; s.end = a.date || M.TODAY; s.cancelled = true; s.paused = L(reason, reason); to = 'cancelled ' + s.end; }
    else return bad();
    save();
    M.audit('SCHEDULE.CHANGE', ctx, { rec: id, to: act + ' ' + to, reason: reason || null });
    return { ok: true, schedule: s };
  };
  function cancelGenerated(ctx, s, date, reason) {
    S().orders.filter(function (o) { return o.sch === s.id && o.date === date && ['scheduled', 'requested', 'assigned', 'ready'].indexOf(o.st) >= 0; }).forEach(function (o) { removeFromTrip(o); setSt(o, 'cancelled', ctx, reason); });
  }

  /* ---------- Movement, position and ETA (§55–§61, §72) ---------- */
  function legMin(from, to, o) { return Math.max(6, Math.round(dist(from, to) / S().cfg.speed)); }
  function prevLoc(t, o) {
    var i = t.stops.indexOf(o.id), prev = null;
    for (var k = i - 1; k >= 0; k--) { var p = M.order(t.stops[k]); if (p && ['completed', 'atplant', 'received'].indexOf(p.st) >= 0) { prev = p; break; } }
    return prev ? M.loc(prev.prop) : M.PLANT;
  }
  M.curOrder = function (t) { if (!t) return null; var o = M.tripOrders(t).filter(function (x) { return x.st === 'ontheway' || x.st === 'arrived' || x.st === 'inprogress' || (x.st === 'issue' && ['ontheway', 'arrived', 'inprogress'].indexOf(x.prevSt) >= 0); })[0]; return o || null; };
  M.nextOrder = function (t) { if (!t) return null; return M.tripOrders(t).filter(function (x) { return ['assigned', 'ready'].indexOf(x.st) >= 0; })[0] || null; };
  M.doneCount = function (t) { return M.tripOrders(t).filter(function (x) { return ['completed', 'atplant', 'received', 'cancelled'].indexOf(x.st) >= 0; }).length; };
  function leg(t, o) {
    var from = prevLoc(t, o), to = M.loc(o.prop), start = ms(M.evAt(o, 'ontheway') || isoT(M.now()));
    var base = o.legMin || legMin(from, to, o);
    return { from: from, to: to, start: start, base: base, dur: base + (o.delay || 0) };
  }
  // The position known at the last ping. Weak signal freezes it at the last ping; nothing is extrapolated (§60, §72).
  M.position = function (t) {
    var c = S().cfg, now = M.now();
    if (!t || !t.track || !t.track.on) return null;
    var ping = t.signal === 'ok' || !t.signal ? Math.floor(now / (c.pingSec * 1000)) * c.pingSec * 1000 : ms(t.lastPing);
    var age = Math.max(0, Math.round((now - ping) / 1000)), fresh = age <= c.staleSec ? 'live' : age <= c.offlineSec ? 'weak' : 'offline';
    var pos, o = M.curOrder(t);
    if (t.signal && t.signal !== 'ok' && t.lastPos) pos = t.lastPos.slice();
    else if (t.ret && !t.atPlant) { var rs = ms(t.ret), rf = t.retFrom || M.PLANT, rd = Math.max(6, Math.round(dist(rf, M.PLANT) / c.speed)); var p0 = Math.min(0.97, Math.max(0, (ping - rs) / (rd * MIN))); pos = [rf[0] + (M.PLANT[0] - rf[0]) * p0, rf[1] + (M.PLANT[1] - rf[1]) * p0]; }
    else if (t.atPlant) pos = M.PLANT.slice();
    else if (o && (o.st === 'ontheway' || (o.st === 'issue' && o.prevSt === 'ontheway'))) { var lg = leg(t, o), pr = Math.min(0.97, Math.max(0, (ping - lg.start) / (lg.dur * MIN))); pos = [lg.from[0] + (lg.to[0] - lg.from[0]) * pr, lg.from[1] + (lg.to[1] - lg.from[1]) * pr]; }
    else if (o) pos = M.loc(o.prop).slice();
    else { var last = M.tripOrders(t).filter(function (x) { return ['completed', 'atplant', 'received'].indexOf(x.st) >= 0; }).slice(-1)[0]; pos = last ? M.loc(last.prop).slice() : M.PLANT.slice(); }
    return { pos: [Math.round(pos[0]), Math.round(pos[1])], at: ping, age: age, fresh: fresh };
  };
  M.signal = function (ctx, tripId, sig) {   // demo: weak signal / connection back (§72)
    var t = M.trip(tripId); if (!t) return bad(M.MSG.notfound);
    if (!(can(ctx, 'lg.track.fleet') || (t.drv === empId(ctx)))) return deny(ctx, tripId);
    if (sig === 'ok') { t.signal = 'ok'; t.lastPing = null; t.lastPos = null; t.flags.off = false; }
    else { var p = M.position(t); t.signal = 'weak'; t.lastPing = isoT(M.now()); t.lastPos = p ? p.pos : M.PLANT.slice(); }
    save(); return { ok: true };
  };
  /* ETA (§59): duration, clock time, last update. Stale data gives a last-known estimate, never a live one. */
  M.eta = function (o) {
    if (!o) return null;
    var t = M.tripOf(o), c = S().cfg, now = M.now();
    if (!t) return null;
    var plan = M.planAt(o), wEnd = at(o.date, o.win[1]);
    if (['arrived', 'inprogress'].indexOf(o.st) >= 0) { var a = ms(M.evAt(o, 'arrived')); return { at: a, min: 0, arrived: true, delay: Math.max(0, Math.round((a - plan) / MIN)), late: a > wEnd }; }
    if (['completed', 'atplant', 'received', 'cancelled'].indexOf(o.st) >= 0) return null;
    var p = M.position(t), etaAt;
    if (o.st === 'ontheway' || (o.st === 'issue' && o.prevSt === 'ontheway')) {
      var lg = leg(t, o);
      if (p && p.fresh !== 'live') etaAt = ms(t.lastPing || isoT(p.at)) + Math.round(dist(p.pos, lg.to) / c.speed) * MIN;
      else etaAt = lg.start + lg.dur * MIN;
      if (etaAt < now + MIN) etaAt = now + MIN;
    } else {
      etaAt = M.plan(t).filter(function (x) { return x.ord === o.id; }).map(function (x) { return x.eta; })[0];
      if (etaAt == null) return null;
    }
    var min = Math.max(0, Math.round((etaAt - now) / MIN)), delay = Math.max(0, Math.round((etaAt - plan) / MIN));
    return { at: etaAt, min: min, upd: p ? p.at : now, age: p ? p.age : 0, fresh: p ? p.fresh : 'none', live: o.st === 'ontheway' && !!p && p.fresh === 'live', stale: !!p && p.fresh !== 'live', delay: delay, late: etaAt > wEnd || delay > c.delayMin, near: o.st === 'ontheway' && min <= c.nearMin, projected: o.st !== 'ontheway' };
  };
  /* Route plan: projected arrival / departure per stop (actual times for done stops). */
  M.plan = function (t) {
    var c = S().cfg, now = M.now(), rows = [], cur = null, prevPos = M.PLANT, r = M.route(t.route);
    var clockT = t.track && t.track.from ? ms(t.track.from) : Math.max(now, at(D.today, r ? r.start : '08:00'));
    M.tripOrders(t).forEach(function (o) {
      var row = { ord: o.id, st: o.st, eta: null, etd: null, actual: false };
      var arr = M.evAt(o, 'arrived'), done = M.evAt(o, 'completed');
      if (['completed', 'atplant', 'received'].indexOf(o.st) >= 0 && arr) { row.eta = ms(arr); row.etd = ms(done || arr); row.actual = true; clockT = row.etd; prevPos = M.loc(o.prop); }
      else if (o.st === 'cancelled') { row.skip = true; }
      else if (['arrived', 'inprogress'].indexOf(o.st) >= 0 || (o.st === 'issue' && ['arrived', 'inprogress'].indexOf(o.prevSt) >= 0)) { row.eta = ms(arr); row.etd = Math.max(now, row.eta + c.stopMin * MIN); row.actual = true; clockT = row.etd; prevPos = M.loc(o.prop); }
      else if (o.st === 'ontheway' || (o.st === 'issue' && o.prevSt === 'ontheway')) { var lg = leg(t, o), e = lg.start + lg.dur * MIN; var p = M.position(t); if (p && p.fresh !== 'live') e = ms(t.lastPing) + Math.round(dist(p.pos, lg.to) / c.speed) * MIN; if (e < now + MIN) e = now + MIN; row.eta = e; row.etd = e + c.stopMin * MIN; clockT = row.etd; prevPos = lg.to; }
      else { var to = M.loc(o.prop), e2 = Math.max(clockT + legMin(prevPos, to) * MIN, o.st === 'assigned' || o.st === 'ready' ? clockT : 0); row.eta = e2; row.etd = e2 + c.stopMin * MIN; clockT = row.etd; prevPos = to; }
      if (row.eta) { row.late = row.eta > at(o.date, o.win[1]); row.delay = Math.max(0, Math.round((row.eta - M.planAt(o)) / MIN)); }
      rows.push(row);
    });
    rows.end = clockT + legMin(prevPos, M.PLANT) * MIN;
    return rows;
  };
  /* Live status per trip (§57) */
  M.liveStatus = function (t) {
    if (!t) return 'idle';
    if (t.st === 'done') return 'ended';
    if (t.atPlant && (!t.track || !t.track.on)) return 'idle';
    if (!t.track || !t.track.on) return 'idle';
    var p = M.position(t), o = M.curOrder(t);
    if (p && p.fresh === 'offline') return 'offline';
    if (S().issues.some(function (i) { return i.trip === t.id && i.st !== 'resolved' && i.sev === 'crit'; }) || (o && o.st === 'issue')) return 'issue';
    if (p && p.fresh === 'weak') return 'weak';
    if (t.ret && !t.atPlant) return 'returning';
    if (t.atPlant) return 'idle';
    if (o && (o.st === 'arrived' || o.st === 'inprogress')) return 'arrived';
    if (o) { var e = M.eta(o); if (e && e.late) return 'delayed'; return 'moving'; }
    return 'idle';
  };
  // §63 status for one order as the client / driver sees it
  M.tripStatus = function (o) {
    if (o.st === 'issue') return 'issue';
    if (['completed', 'atplant', 'received'].indexOf(o.st) >= 0) return 'completed';
    if (o.st === 'arrived') return 'arrived';
    if (o.st === 'inprogress') return 'inprogress';
    if (o.st === 'ontheway') { var e = M.eta(o); if (e && e.late) return 'delayed'; if (e && e.near) return 'near'; return 'ontheway'; }
    if (o.st === 'ready') return 'ready';
    return 'assigned';
  };

  /* ---------- Location privacy (§55–§56, §79–§80) ---------- */
  // Who may see a trip's live location right now.
  M.canSeeLocation = function (ctx, t, ordId) {
    if (!t || !t.track || !t.track.on) return false;                        // never outside an active trip
    if (can(ctx, 'lg.track.fleet')) return true;
    if (can(ctx, 'lg.drv.task') && t.drv === empId(ctx)) return true;        // own position
    if (isClient(ctx) && can(ctx, 'lg.track.own')) {                         // client: only while the driver is on the way to / at their stop
      var o = M.curOrder(t); if (!o || o.cl !== ctx.client || (ordId && o.id !== ordId)) return false;
      return ['ontheway', 'arrived', 'inprogress'].indexOf(o.st) >= 0;
    }
    return false;
  };
  M.needsReason = function (ctx) { return S().cfg.ownerReason && can(ctx, 'lg.track.fleet') && !can(ctx, 'lg.dispatch'); };
  // Location access audit (§79): who, when, which driver / task, context. Repeated views within 10 minutes count once.
  M.logView = function (ctx, tripId, reason) {
    var t = M.trip(tripId); if (!t) return bad(M.MSG.notfound);
    if (!M.canSeeLocation(ctx, t)) return deny(ctx, tripId);
    if (M.needsReason(ctx) && !String(reason || '').trim()) return bad(M.MSG.reason, 'reason');
    var who = isClient(ctx) ? (ctx.uid || 'client') : empId(ctx), now = M.now();
    var last = S().locLog.filter(function (x) { return x.who === who && x.trip === tripId; })[0];
    if (last && now - ms(last.at) < 10 * MIN && !reason) return { ok: true, dup: true };
    var e = { who: who, name: ctx.fullName || ctx.name || who, role: ctx.roleKey || (isClient(ctx) ? 'client' : ''), drv: t.drv, trip: tripId, at: isoT(now), reason: reason || (isClient(ctx) ? T(L('Pelacakan order sendiri', 'Own order tracking')) : T(L('Monitoring dispatch', 'Dispatch monitoring'))) };
    S().locLog.unshift(e); save();
    M.audit('LOCATION.VIEW', ctx, { rec: tripId, to: M.empName(t.drv), reason: e.reason });
    return { ok: true, entry: e };
  };
  M.locLog = function (ctx) { if (!can(ctx, 'lg.audit') && !can(ctx, 'lg.dispatch')) return []; return S().locLog.slice(); };
  // Retention (§56, §80): access log and last-known positions older than the policy are removed.
  M.purge = function (now) {
    var lim = (now || M.now()) - S().cfg.retention * DAY, s = S(), n0 = s.locLog.length;
    s.locLog = s.locLog.filter(function (x) { return ms(x.at) >= lim; });
    s.trips.forEach(function (t) { if (t.track && t.track.to && ms(t.track.to) < lim) { t.lastPos = null; t.lastPing = null; } });
    save(); return { removed: n0 - s.locLog.length };
  };

  /* ---------- Notifications (§61, §64, §74, §75) ---------- */
  function notify(to, kind, o, v) { var n = { id: nid('nt', 'NT-'), to: to, kind: kind, ord: o ? o.id : null, at: isoT(M.now()), ref: v && v.ref || null, v: v || {} }; S().notifs.unshift(n); return n; }
  M.notifText = function (n) {
    var o = n.ord && M.order(n.ord), v = n.v || {}, pn = o ? M.propName(o.prop) : '', k = o ? T(M.KIND[o.kind]) : '';
    var t = o && o.trip ? M.trip(o.trip) : null, dn = t ? M.first(t.drv) : '';
    switch (n.kind) {
      case 'assigned': return L('Driver ' + dn + ' ditugaskan untuk ' + k.toLowerCase() + ' ' + pn + (o ? ' (' + o.win.join('–') + ')' : '') + '.', 'Driver ' + dn + ' assigned to the ' + T(M.KIND[o ? o.kind : 'pickup'][1]).toLowerCase() + ' at ' + pn + '.');
      case 'tripstart': return L('Driver JFRESH sedang menuju ' + pn + '.', 'The JFRESH driver is on the way to ' + pn + '.');
      case 'near': return L('Driver JFRESH hampir tiba di ' + pn + '.', 'The JFRESH driver is almost at ' + pn + '.');
      case 'arrived': return L('Driver JFRESH sudah tiba di ' + pn + '.', 'The JFRESH driver has arrived at ' + pn + '.');
      case 'pickdone': return L('Pickup selesai di ' + pn + (v.bags ? ': ' + v.bags + ' bag' : '') + '.', 'Pickup complete at ' + pn + (v.bags ? ': ' + v.bags + ' bags' : '') + '.');
      case 'deldone': return L('Delivery selesai di ' + pn + (v.bags ? ': ' + v.bags + ' bag diterima' : '') + '.', 'Delivery complete at ' + pn + (v.bags ? ': ' + v.bags + ' bags received' : '') + '.');
      case 'delay': return L((o && o.kind === 'delivery' ? 'Delivery' : 'Pickup') + ' diperkirakan terlambat ' + (v.min || o && o.lastDelay || '') + ' menit.', (o && o.kind === 'delivery' ? 'Delivery' : 'Pickup') + ' is expected ' + (v.min || o && o.lastDelay || '') + ' min late.');
      case 'resched': return L('Jadwal ' + k.toLowerCase() + ' ' + pn + ' dipindah ke ' + (v.date || '') + ' ' + (v.win || '') + '.', 'The ' + pn + ' ' + T(M.KIND[o ? o.kind : 'pickup'][1]).toLowerCase() + ' moved to ' + (v.date || '') + ' ' + (v.win || '') + '.');
      case 'urgent': return L('Order ' + (o ? T(M.PRI[o.pri][0]).toLowerCase() : 'urgent') + ' belum ditugaskan: ' + pn + '.', 'Unassigned ' + (o ? M.PRI[o.pri][0][1].toLowerCase() : 'urgent') + ' order: ' + pn + '.');
      case 'routedelay': return L('Rute ' + (v.drv || dn) + ' terlambat ± ' + (v.min || '') + ' menit.', (v.drv || dn) + '\'s route is about ' + (v.min || '') + ' min late.');
      case 'vehicle': return L('Masalah kendaraan ' + (n.ref || v.veh || '') + '.', 'Vehicle problem ' + (n.ref || v.veh || '') + '.');
      case 'critical': return L('Masalah kritis: ' + (v.type || '') + (pn ? ' di ' + pn : '') + '.', 'Critical issue: ' + (v.typeEn || v.type || '') + (pn ? ' at ' + pn : '') + '.');
      case 'bagdiff': return L('Selisih bag ' + (v.mf || '') + (v.from != null ? ': ' + v.from + ' → ' + v.to : '') + '.', 'Bag difference ' + (v.mf || '') + (v.from != null ? ': ' + v.from + ' → ' + v.to : '') + '.');
      case 'offline': return L('Driver ' + (v.drv || dn) + ' offline. Lokasi terakhir dipakai.', 'Driver ' + (v.drv || dn) + ' is offline. Last known location in use.');
      case 'slarisk': return L('Risiko SLA: ' + pn + '.', 'SLA risk: ' + pn + '.');
      case 'routechange': return L('Rute berubah: ' + (v.txt || pn) + '.', 'Route changed: ' + (v.txtEn || v.txt || pn) + '.');
      case 'task': return L('Tugas baru: ' + k.toLowerCase() + ' ' + pn + (o ? ' ' + o.win.join('–') : '') + '.', 'New task: ' + pn + (o ? ' ' + o.win.join('–') : '') + '.');
    }
    return L(n.kind, n.kind);
  };
  M.notifs = function (ctx) {
    var e = empId(ctx);
    return S().notifs.filter(function (n) {
      if (isClient(ctx)) return n.to === ctx.client;
      if (n.to === e) return true;
      if (n.to === 'sup') return can(ctx, 'lg.dispatch') || can(ctx, 'lg.issue.manage') || (can(ctx, 'lg.issue.view') && n.kind === 'critical');
      return false;
    }).sort(function (a, b) { return ms(b.at) - ms(a.at); });
  };
  M.unread = function (ctx) { var k = isClient(ctx) ? ctx.client : empId(ctx), seen = S().reads[k] || 0; return M.notifs(ctx).filter(function (n) { return ms(n.at) > seen; }).length; };
  M.markRead = function (ctx) { var k = isClient(ctx) ? ctx.client : empId(ctx); S().reads[k] = M.now(); save(); };

  /* ---------- Chat (§65–§69) ---------- */
  function sysChat(o, code, extra) { var m = { id: nid('msg', 'MSG-'), ord: o.id, at: isoT(M.now()), by: 'sys', kind: 'sys', body: code, extra: extra || null }; S().chat.push(m); return m; }
  M.canChat = function (ctx, o) {
    if (!o) return false;
    if (isClient(ctx)) return can(ctx, 'lg.chat') && o.cl === ctx.client;
    if (can(ctx, 'lg.drv.task') && M.ownsOrder(ctx, o)) return true;
    return can(ctx, 'lg.chat') && !can(ctx, 'lg.drv.task');
  };
  M.rooms = function (ctx) {
    return S().orders.filter(function (o) { return M.canChat(ctx, o) && ['draft', 'cancelled'].indexOf(o.st) < 0 && (S().chat.some(function (m) { return m.ord === o.id; }) || ['ontheway', 'arrived', 'inprogress', 'ready', 'assigned', 'issue'].indexOf(o.st) >= 0); })
      .map(function (o) { var ms0 = S().chat.filter(function (m) { return m.ord === o.id; }); return { o: o, last: ms0[ms0.length - 1] || null, n: ms0.length }; })
      .sort(function (a, b) { return (b.last ? ms(b.last.at) : 0) - (a.last ? ms(a.last.at) : 0); });
  };
  M.messages = function (ctx, ord) { var o = M.order(ord); if (!M.canChat(ctx, o)) return null; return S().chat.filter(function (m) { return m.ord === ord; }); };
  M.participants = function (o) {
    var t = M.tripOf(o), out = [];
    if (t) out.push({ id: t.drv, role: 'drv', n: M.empName(t.drv) });
    out.push({ id: 'EMP-021', role: 'sup', n: M.empName('EMP-021') }, { id: 'EMP-081', role: 'cs', n: M.empName('EMP-081') });
    var c = o.ct && M.contact(o.ct); if (c) out.push({ id: c.id, role: 'client', n: c.n });
    return out;
  };
  M.send = function (ctx, ord, kind, body, extra) {
    var o = M.order(ord); if (!o) return bad(M.MSG.notfound);
    if (!M.canChat(ctx, o)) return deny(ctx, ord);
    if (['text', 'photo', 'file', 'pin', 'loc', 'ref'].indexOf(kind) < 0) return bad();
    if (kind === 'text' && !String(body || '').trim()) return bad(L('Tulis pesan dulu.', 'Write a message first.'));
    if (kind === 'ref') { var r = M.order(extra); if (!r || !M.canSeeOrder(ctx, r) || (isClient(ctx) && r.cl !== ctx.client)) return deny(ctx, extra); }
    if (kind === 'loc') {   // share current location: the driver's live position, or the client's own property
      var t = M.tripOf(o);
      if (can(ctx, 'lg.drv.task') && t && t.drv === empId(ctx)) { var p = M.position(t); if (!p) return bad(M.MSG.loc, 'loc'); extra = { x: p.pos[0], y: p.pos[1], age: p.age, fresh: p.fresh }; }
      else { var lc = M.loc(o.prop); extra = { x: lc[0], y: lc[1], prop: o.prop }; }
    }
    if (kind === 'pin' && (!extra || extra.x == null)) { var pn = D.PINS[o.prop]; extra = pn ? { n: pn[0], x: pn[1], y: pn[2], prop: o.prop } : { n: L(M.propName(o.prop), M.propName(o.prop)), x: M.loc(o.prop)[0], y: M.loc(o.prop)[1], prop: o.prop }; }
    var m = { id: nid('msg', 'MSG-'), ord: ord, at: isoT(M.now()), by: isClient(ctx) ? (o.ct || ctx.uid) : empId(ctx), name: isClient(ctx) ? (ctx.name || ctx.fullName) : null, client: isClient(ctx), kind: kind, body: typeof body === 'string' ? body : body, extra: extra || null };
    S().chat.push(m); save();
    return { ok: true, msg: m };
  };
  // §68: a chat photo / file / pin can become transaction evidence (linked, not copied by hand).
  M.promote = function (ctx, msgId) {
    var m = by(S().chat, 'id', msgId); if (!m) return bad(M.MSG.notfound);
    var o = M.order(m.ord);
    if (!(can(ctx, 'lg.evidence.amend') || can(ctx, 'lg.dispatch') || (can(ctx, 'lg.drv.task') && M.ownsOrder(ctx, o)))) return deny(ctx, msgId);
    if (['photo', 'file', 'pin', 'loc'].indexOf(m.kind) < 0) return bad(L('Hanya foto, file atau pin yang bisa jadi bukti.', 'Only a photo, file or pin can become evidence.'));
    if (m.ev) return bad(L('Sudah menjadi bukti.', 'Already evidence.'), 'exists');
    var e = addEv(ctx, o, m.kind === 'loc' ? 'pin' : m.kind, m.kind === 'pin' || m.kind === 'loc' ? m.extra : m.body, { src: m.id, img: m.kind === 'photo' ? m.body : null });
    m.ev = e.id; save();
    M.audit('CHAT.PROMOTE', ctx, { ord: o.id, rec: m.id, to: e.id });
    return { ok: true, ev: e };
  };

  /* ---------- Evidence (§36–§41) ---------- */
  function addEv(ctx, o, kind, data, x) {
    var e = Object.assign({ id: nid('ev', 'EV-'), ord: o.id, kind: kind, at: isoT(M.now()), by: empId(ctx), data: data == null ? null : data, img: null, amends: null, superseded: null, src: null }, x || {});
    S().evidence.push(e);
    M.audit('EVIDENCE.ADD', ctx, { ord: o.id, rec: e.id, to: kind });
    return e;
  }
  M.evidence = function (ctx, ord) { var o = M.order(ord); if (!o || !(M.canSeeOrder(ctx, o) && (can(ctx, 'lg.evidence.view') || M.ownsOrder(ctx, o)))) return null; return S().evidence.filter(function (e) { return e.ord === ord; }).sort(function (a, b) { return ms(a.at) - ms(b.at); }); };
  M.addEvidence = function (ctx, ord, kind, data, img) {
    var o = M.order(ord); if (!o) return bad(M.MSG.notfound);
    if (!(can(ctx, 'lg.drv.task') && M.ownsOrder(ctx, o)) && !can(ctx, 'lg.evidence.amend')) return deny(ctx, ord);
    if (!M.EV_KIND[kind] || kind === 'done' || kind === 'amend') return bad();
    if ((kind === 'photo' || kind === 'file' || kind === 'doc') && !img && !data) return bad(L('Pilih foto atau file.', 'Choose a photo or file.'));
    var e = addEv(ctx, o, kind, data, { img: img || null }); save();
    return { ok: true, ev: e };
  };
  // §41: completed evidence is never edited in place. A correction is a new record that points to the original.
  M.amendEvidence = function (ctx, evId, data, reason) {
    var e0 = by(S().evidence, 'id', evId); if (!e0) return bad(M.MSG.notfound);
    if (!can(ctx, 'lg.evidence.amend')) return deny(ctx, evId);
    if (!String(reason || '').trim()) return bad(M.MSG.reason, 'reason');
    if (e0.superseded) return bad(L('Bukti ini sudah dikoreksi. Koreksi versi terbaru.', 'This evidence was already corrected. Correct the latest version.'), 'superseded');
    var o = M.order(e0.ord), e = addEv(ctx, o, e0.kind, data, { amends: e0.id, reason: reason, img: e0.img });
    e0.superseded = e.id; save();
    M.audit('EVIDENCE.AMEND', ctx, { ord: o.id, rec: e0.id, from: JSON.stringify(e0.data), to: JSON.stringify(data), reason: reason });
    return { ok: true, ev: e };
  };
  M.evidenceComplete = function (o) {
    var ev = S().evidence.filter(function (e) { return e.ord === o.id && !e.superseded; }), k = ev.map(function (e) { return e.kind; });
    var need = o.kind === 'delivery' ? ['arrive', 'recv', 'sign', 'done'] : ['arrive', 'pic', 'sign', 'done'];
    if (k.indexOf('sign') < 0 && ev.some(function (e) { return e.kind === 'note' && e.data && e.data.nosign; }) && k.indexOf('photo') >= 0) need = need.filter(function (x) { return x !== 'sign'; });
    var miss = need.filter(function (x) { return k.indexOf(x) < 0 && !(x === 'recv' && k.indexOf('pic') >= 0); });
    return { ok: !miss.length, miss: miss };
  };

  /* ---------- Fleet: drivers, vehicles, routes (§17–§20) ---------- */
  function onShift(d, now) { var s = at(D.today, d.shift[0]), e = at(D.today, d.shift[1]); return now >= s - 60 * MIN && now <= e; }
  M.drivers = function (ctx) {
    var now = M.now();
    return S().drivers.map(function (d) {
      var t = M.driverTrip(d.id), os = t ? M.tripOrders(t) : [], p = t ? M.position(t) : null, live = t ? M.liveStatus(t) : 'idle';
      var avail = !onShift(d, now) ? 'off' : !t || t.st === 'done' ? (live === 'ended' ? 'done' : 'available') : t.track && t.track.on ? 'onroute' : 'planned';
      return { d: d, trip: t, pick: os.filter(function (o) { return o.kind === 'pickup' && o.st !== 'cancelled'; }).length, del: os.filter(function (o) { return o.kind === 'delivery' && o.st !== 'cancelled'; }).length,
        left: os.filter(function (o) { return ['completed', 'atplant', 'received', 'cancelled'].indexOf(o.st) < 0; }).length, avail: avail, live: live,
        veh: t && t.st !== 'done' ? t.veh : null, route: t ? t.route : null, pos: p && M.canSeeLocation(ctx, t) ? p : null };
    });
  };
  M.AVAIL = { available: [L('Tersedia', 'Available'), 'ok'], onroute: [L('Di Rute', 'On Route'), 'info'], planned: [L('Rute Siap', 'Route Planned'), 'info'], done: [L('Rute Selesai', 'Route Done'), 'mute'], off: [L('Di Luar Shift', 'Off Shift'), 'mute'] };
  M.load = function (t) { var os = M.tripOrders(t).filter(function (o) { return o.st !== 'cancelled'; }); return { bags: sum(os.map(function (o) { return o.exec && o.exec.bags != null ? o.exec.bags : o.bags; })), kg: sum(os.map(function (o) { return o.kg || 0; })), stops: os.length }; };
  M.vehicles = function () {
    return S().vehicles.map(function (v) {
      var t = S().trips.filter(function (x) { return x.veh === v.id && x.st !== 'done'; })[0] || null, ld = t ? M.load(t) : { bags: 0, kg: 0, stops: 0 };
      // current load: bags on board now (picked up and not handed over + deliveries still on board)
      var on = t ? sum(M.tripOrders(t).map(function (o) { if (o.kind === 'pickup') return ['completed'].indexOf(o.st) >= 0 && !(M.mfOf(o.id) && ['handed', 'received'].indexOf(M.mfOf(o.id).st) >= 0) ? (o.exec ? o.exec.bags : o.bags) : 0; return ['completed', 'cancelled'].indexOf(o.st) < 0 ? o.bags : 0; })) : 0;
      var cur = !t ? (v.maint === 'repair' ? 'maint' : 'idle') : t.track && t.track.on ? 'onroute' : 'planned';
      return { v: v, trip: t, drv: t ? t.drv : null, route: t ? t.route : null, plan: ld, onboard: on, cur: cur };
    });
  };
  M.VEH_CUR = { idle: [L('Siap di Plant', 'Ready at Plant'), 'ok'], onroute: [L('Di Rute', 'On Route'), 'info'], planned: [L('Rute Siap', 'Route Planned'), 'info'], maint: [L('Perawatan', 'Maintenance'), 'crit'] };
  M.setVehicle = function (ctx, id, maint, reason) {
    var v = M.vehicle(id); if (!v) return bad(M.MSG.notfound);
    if (!can(ctx, 'lg.dispatch')) return deny(ctx, id);
    if (!M.MAINT[maint]) return bad(); if (!String(reason || '').trim()) return bad(M.MSG.reason, 'reason');
    var from = v.maint; v.maint = maint; v.note = L(reason, reason); save();
    M.audit('VEHICLE.STATUS', ctx, { rec: id, from: from, to: maint, reason: reason });
    return { ok: true };
  };
  M.routes = function () { return S().routes; };
  M.saveRoute = function (ctx, id, f) {
    if (!can(ctx, 'lg.route.edit')) return deny(ctx, id || 'ROUTE');
    if (!String(f.n || '').trim() || !/^\d{2}:\d{2}$/.test(f.start || '') || !/^\d{2}:\d{2}$/.test(f.end || '') || f.start >= f.end) return bad(L('Isi nama, jam mulai dan jam selesai rute.', 'Enter the route name, start and end time.'));
    var r = id ? M.route(id) : null, from = r ? JSON.stringify({ start: r.start, end: r.end, drv: r.drv, veh: r.veh, maxStops: r.maxStops }) : null;
    if (!r) { r = { id: 'R-0' + (S().routes.length + 1), stops: [], status: 'active' }; S().routes.push(r); }
    ['n', 'area', 'start', 'end', 'drv', 'veh'].forEach(function (k) { if (f[k] !== undefined) r[k] = f[k] || null; });
    ['min', 'km', 'maxStops', 'cap'].forEach(function (k) { if (f[k] !== undefined && f[k] !== '') r[k] = +f[k]; });
    if (f.status) r.status = f.status;
    save(); M.audit('ROUTE.EDIT', ctx, { rec: r.id, from: from, to: JSON.stringify({ start: r.start, end: r.end, drv: r.drv, veh: r.veh, maxStops: r.maxStops }), reason: f.reason || null });
    return { ok: true, route: r };
  };

  /* ---------- Dispatch (§13–§16, §21–§22) ---------- */
  M.LANES = [['unassigned', L('Belum Ditugaskan', 'Unassigned'), 'clipboard'], ['assigned', L('Ditugaskan', 'Assigned'), 'user'], ['ready', L('Siap', 'Ready'), 'check'], ['ontheway', L('Dalam Perjalanan', 'On The Way'), 'truck'], ['atloc', L('Di Lokasi', 'At Location'), 'pin'], ['completed', L('Selesai', 'Completed'), 'checkc'], ['issue', L('Masalah', 'Issue'), 'alert']];
  M.laneOf = function (o) {
    if (o.st === 'issue') return 'issue';
    if (['requested', 'scheduled'].indexOf(o.st) >= 0 || (o.st === 'assigned' && !o.trip)) return 'unassigned';
    if (o.st === 'assigned') return 'assigned';
    if (o.st === 'ready') return 'ready';
    if (o.st === 'ontheway') return 'ontheway';
    if (o.st === 'arrived' || o.st === 'inprogress') return 'atloc';
    if (['completed', 'atplant', 'received'].indexOf(o.st) >= 0) return 'completed';
    return null;
  };
  M.board = function (ctx, f) {
    f = f || {};
    var lanes = {}; M.LANES.forEach(function (l) { lanes[l[0]] = []; });
    M.orders(ctx, { date: f.date || M.TODAY }).forEach(function (o) {
      var k = M.laneOf(o); if (!k) return;
      if (f.kind && o.kind !== f.kind) return; if (f.drv && !(o.trip && M.trip(o.trip).drv === f.drv)) return; if (f.route && !(o.trip && M.trip(o.trip).route === f.route)) return;
      lanes[k].push(o);
    });
    Object.keys(lanes).forEach(function (k) { lanes[k].sort(function (a, b) { return M.priRank(b.pri) - M.priRank(a.pri) || (a.plan || a.win[0]).localeCompare(b.plan || b.win[0]); }); });
    return lanes;
  };
  // Trip for a driver on a date; created (planned) when the first task is assigned.
  function tripFor(drv, veh, route, date) {
    var t = S().trips.filter(function (x) { return x.drv === drv && x.st !== 'done' && (x.date || D.today) === date; })[0];
    if (t) return t;
    t = { id: nid('trp', 'TRP-2610-0'), drv: drv, veh: veh, route: route || null, st: 'planned', date: date, stops: [], track: { on: false, from: null, to: null }, shiftStart: null, signal: 'ok', log: [], flags: {} };
    S().trips.push(t); return t;
  }
  /* §21 capacity validation. blocks stop the assignment; warns need a confirmation with a reason. */
  M.checkAssign = function (ordId, drv, veh) {
    var o = M.order(ordId), d = M.driver(drv), v = M.vehicle(veh), blocks = [], warns = [];
    if (!o || !d || !v) return { blocks: [['missing', M.MSG.invalid]], warns: [] };
    if (v.maint === 'repair') blocks.push(['maint', M.MSG.maint]);
    var other = S().trips.filter(function (x) { return x.veh === veh && x.drv !== drv && x.st !== 'done'; })[0];
    if (other) blocks.push(['vehDouble', L('Kendaraan ' + veh + ' sedang dipakai ' + M.first(other.drv) + '.', 'Vehicle ' + veh + ' is in use by ' + M.first(other.drv) + '.')]);
    var cur = S().trips.filter(function (x) { return x.drv === drv && x.st !== 'done'; })[0];
    if (cur && cur.veh !== veh) warns.push(['drvDouble', L(M.first(drv) + ' sudah memakai ' + cur.veh + ' hari ini. Kendaraan trip tidak diganti.', M.first(drv) + ' already uses ' + cur.veh + ' today. The trip vehicle stays.')]);
    if (o.trip && cur && o.trip !== cur.id) warns.push(['ordDouble', L('Order sudah ada di rute ' + M.first(M.trip(o.trip).drv) + '. Order akan dipindah.', 'The order is on ' + M.first(M.trip(o.trip).drv) + '\'s route. It will be moved.')]);
    if (!onShift(d, at(o.date, o.win[0]))) warns.push(['shift', L('Jam order di luar shift ' + d.short + ' (' + d.shift.join('–') + ').', 'The order time is outside ' + d.short + '\'s shift (' + d.shift.join('–') + ').')]);
    var useV = cur ? M.vehicle(cur.veh) : v, ld = cur ? M.load(cur) : { bags: 0, kg: 0, stops: 0 };
    if (ld.bags + o.bags > useV.cap.bags || ld.kg + (o.kg || 0) > useV.cap.kg) warns.push(['overload', L('Kendaraan kelebihan muatan: ' + (ld.bags + o.bags) + '/' + useV.cap.bags + ' bag, ' + (ld.kg + (o.kg || 0)) + '/' + useV.cap.kg + ' kg.', 'Vehicle overloaded: ' + (ld.bags + o.bags) + '/' + useV.cap.bags + ' bags, ' + (ld.kg + (o.kg || 0)) + '/' + useV.cap.kg + ' kg.')]);
    var r = M.route(cur ? cur.route : (o.prefRoute || null)), maxS = r ? r.maxStops : 7;
    if (ld.stops + 1 > maxS) warns.push(['stops', L('Terlalu banyak stop: ' + (ld.stops + 1) + ' dari maksimal ' + maxS + '.', 'Too many stops: ' + (ld.stops + 1) + ' of max ' + maxS + '.')]);
    // projected timing with the new stop appended
    if (cur) {
      var pl = M.plan(cur), last = pl.filter(function (x) { return x.etd; }).slice(-1)[0], fromP = cur.stops.length ? M.loc(M.order(cur.stops[cur.stops.length - 1]).prop) : M.PLANT;
      var eta = Math.max((last ? last.etd : M.now()) + legMin(fromP, M.loc(o.prop)) * MIN, at(o.date, o.win[0]) - 10 * MIN), end = eta + S().cfg.stopMin * MIN + legMin(M.loc(o.prop), M.PLANT) * MIN;
      if (eta > at(o.date, o.win[1])) warns.push(['window', L('Perkiraan tiba ' + hm(eta) + ', setelah jendela ' + o.win.join('–') + '.', 'Expected arrival ' + hm(eta) + ', after the ' + o.win.join('–') + ' window.')]);
      if (end > at(D.today, d.shift[1])) warns.push(['shiftEnd', L('Rute selesai ± ' + hm(end) + ', melewati akhir shift ' + d.shift[1] + '.', 'Route ends about ' + hm(end) + ', past the shift end ' + d.shift[1] + '.')]);
      if (pl.some(function (x) { return x.late && !x.actual; })) warns.push(['late', L('Rute ini kemungkinan terlambat.', 'This route is likely late.')]);
    }
    return { blocks: blocks, warns: warns, trip: cur ? cur.id : null };
  };
  M.assign = function (ctx, ordId, drv, veh, opt) {
    opt = opt || {};
    if (!can(ctx, 'lg.dispatch')) return deny(ctx, ordId);
    var o = M.order(ordId); if (!o) return bad(M.MSG.notfound);
    if (['requested', 'scheduled', 'assigned', 'ready'].indexOf(o.st) < 0) return bad(L('Order ini sudah berjalan dan tidak bisa ditugaskan ulang dari sini.', 'This order is already running and cannot be reassigned here.'), 'jump');
    var chk = M.checkAssign(ordId, drv, veh);
    if (chk.blocks.length) return bad(chk.blocks[0][1], chk.blocks[0][0], { check: chk });
    var moving = o.trip && M.trip(o.trip).drv !== drv;
    if ((chk.warns.length || moving) && !opt.force) return bad(L('Periksa peringatan kapasitas sebelum menugaskan.', 'Check the capacity warnings before assigning.'), 'warn', { check: chk });
    if ((chk.warns.length || moving) && !String(opt.reason || '').trim()) return bad(M.MSG.reason, 'reason', { check: chk });
    var oldT = M.tripOf(o), oldDrv = oldT ? oldT.drv : null;
    removeFromTrip(o);
    var t = tripFor(drv, veh, opt.route || o.prefRoute || (M.route(o.prefRoute) ? o.prefRoute : null), o.date);
    if (opt.route && t.stops.length === 0) t.route = opt.route;
    // insert by planned time, after stops already done or running
    var idx = t.stops.length; for (var i = 0; i < t.stops.length; i++) { var s = M.order(t.stops[i]); if (s && ['assigned', 'ready'].indexOf(s.st) >= 0 && (s.plan || s.win[0]) > (o.plan || o.win[0])) { idx = i; break; } }
    t.stops.splice(idx, 0, o.id); o.trip = t.id; if (!o.plan) o.plan = o.win[0];
    if (o.st === 'requested' || o.st === 'scheduled') setSt(o, 'assigned', ctx);
    save();
    M.audit('DRIVER.ASSIGN', ctx, { ord: o.id, rec: o.id, from: oldDrv ? M.empName(oldDrv) : null, to: M.empName(drv), reason: opt.reason || null });
    M.audit('VEHICLE.ASSIGN', ctx, { ord: o.id, rec: o.id, from: oldT ? oldT.veh : null, to: t.veh });
    if (oldDrv && oldDrv !== drv) { notify(oldDrv, 'routechange', o, { txt: o.id + ' dipindah ke ' + M.first(drv), txtEn: o.id + ' moved to ' + M.first(drv) }); M.audit('ROUTE.CHANGE', ctx, { ord: o.id, rec: t.id, from: oldT.id, to: t.id, reason: opt.reason }); sysChat(o, 'routechange', M.first(drv)); }
    notify(drv, 'task', o); notify(o.cl, 'assigned', o); sysChat(o, 'assigned', M.first(drv));
    save();
    return { ok: true, order: o, trip: t, check: chk };
  };
  M.markReady = function (ctx, ordId) {
    var o = M.order(ordId); if (!o) return bad(M.MSG.notfound);
    if (!can(ctx, 'lg.dispatch') && !(can(ctx, 'lg.drv.task') && M.ownsOrder(ctx, o))) return deny(ctx, ordId);
    if (o.st !== 'assigned' || !o.trip) return bad(M.MSG.jump, 'jump');
    setSt(o, 'ready', ctx); save(); return { ok: true, order: o };
  };
  /* §22 route change: new stop order, reason, driver + client notified, ETA recalculated (computed live), logged. */
  M.moveStop = function (ctx, tripId, ordId, dir, reason) {
    if (!can(ctx, 'lg.dispatch')) return deny(ctx, tripId);
    var t = M.trip(tripId); if (!t) return bad(M.MSG.notfound);
    if (!String(reason || '').trim()) return bad(M.MSG.reason, 'reason');
    var i = t.stops.indexOf(ordId), j = i + (dir === 'up' ? -1 : 1);
    if (i < 0 || j < 0 || j >= t.stops.length) return bad();
    var a = M.order(t.stops[i]), b = M.order(t.stops[j]);
    if (['assigned', 'ready'].indexOf(a.st) < 0 || ['assigned', 'ready'].indexOf(b.st) < 0) return bad(L('Hanya stop yang belum dimulai yang bisa ditukar.', 'Only stops not yet started can be swapped.'), 'jump');
    var from = t.stops.join(','); t.stops[i] = b.id; t.stops[j] = a.id; save();
    M.audit('ROUTE.CHANGE', ctx, { rec: tripId, ord: ordId, from: from, to: t.stops.join(','), reason: reason });
    notify(t.drv, 'routechange', a, { txt: T(L('urutan stop diubah', 'stop order changed')), txtEn: 'stop order changed' });
    [a, b].forEach(function (o) { sysChat(o, 'routechange'); });
    return { ok: true, trip: t };
  };

  /* ---------- Attention panel (§16) and supervisor alerts (§75) ---------- */
  M.attention = function (ctx) {
    var now = M.now(), out = [];
    function add(sev, kind, txt, o, x) { out.push(Object.assign({ sev: sev, kind: kind, txt: txt, ord: o ? o.id : null, at: o ? at(o.date, o.plan || o.win[0]) : now }, x || {})); }
    M.orders(ctx, { date: M.TODAY }).forEach(function (o) {
      var lane = M.laneOf(o), start = at(o.date, o.win[0]);
      if (lane === 'unassigned' && M.priRank(o.pri) >= 3) add(M.priRank(o.pri) >= 4 ? 'crit' : 'warn', 'urgent', L(T(M.PRI[o.pri][0]) + ' belum ditugaskan · ' + M.propName(o.prop), M.PRI[o.pri][0][1] + ' unassigned · ' + M.propName(o.prop)), o);
      if ((lane === 'unassigned' || lane === 'assigned') && start - now < 90 * MIN) add(start < now ? 'crit' : 'warn', 'slarisk', L('Risiko SLA: ' + M.propName(o.prop) + ' mulai ' + o.win[0] + (o.trip ? '' : ', belum ada driver'), 'SLA risk: ' + M.propName(o.prop) + ' starts ' + o.win[0] + (o.trip ? '' : ', no driver yet')), o);
      if (o.st === 'ontheway') { var e = M.eta(o); if (e && e.late) add(e.delay >= 30 ? 'crit' : 'warn', o.kind === 'delivery' ? 'deldelay' : 'pickdelay', L((o.kind === 'delivery' ? 'Delivery' : 'Pickup') + ' terlambat ± ' + e.delay + ' menit · ' + M.propName(o.prop), (o.kind === 'delivery' ? 'Delivery' : 'Pickup') + ' late by ~' + e.delay + ' min · ' + M.propName(o.prop)), o); }
      if (o.trip && ['assigned', 'ready'].indexOf(o.st) >= 0) { var row = M.plan(M.trip(o.trip)).filter(function (x) { return x.ord === o.id; })[0]; if (row && row.late) add('warn', o.kind === 'delivery' ? 'deldelay' : 'pickdelay', L('Diperkirakan terlambat: ' + M.propName(o.prop) + ' (perkiraan ' + hm(row.eta) + ', jendela ' + o.win.join('–') + ')', 'Likely late: ' + M.propName(o.prop) + ' (expected ' + hm(row.eta) + ', window ' + o.win.join('–') + ')'), o); }
    });
    S().trips.filter(function (t) { return t.st !== 'done'; }).forEach(function (t) {
      var d = M.driver(t.drv), pl = M.plan(t);
      if (pl.end > at(D.today, d.shift[1])) out.push({ sev: 'warn', kind: 'routeconflict', txt: L('Rute ' + d.short + ' selesai ± ' + hm(pl.end) + ', melewati shift ' + d.shift[1], d.short + '\'s route ends ~' + hm(pl.end) + ', past shift end ' + d.shift[1]), trip: t.id, at: pl.end });
      var ld = M.load(t), v = M.vehicle(t.veh);
      if (ld.bags > v.cap.bags) out.push({ sev: 'warn', kind: 'routeconflict', txt: L('Muatan ' + t.veh + ' melebihi kapasitas (' + ld.bags + '/' + v.cap.bags + ' bag)', t.veh + ' load over capacity (' + ld.bags + '/' + v.cap.bags + ' bags)'), trip: t.id, at: now });
      if (v.maint === 'repair') out.push({ sev: 'crit', kind: 'vehicle', txt: L('Kendaraan ' + v.id + ' dalam perawatan tapi ada di rute ' + d.short, 'Vehicle ' + v.id + ' in maintenance but on ' + d.short + '\'s route'), trip: t.id, at: now });
      var lst = M.liveStatus(t); if (lst === 'offline' || lst === 'weak') out.push({ sev: lst === 'offline' ? 'crit' : 'warn', kind: 'offline', txt: L('Sinyal ' + d.short + (lst === 'offline' ? ' hilang' : ' lemah') + ' · lokasi terakhir ' + Math.round(M.position(t).age / 60) + ' menit lalu', d.short + '\'s signal ' + (lst === 'offline' ? 'lost' : 'weak') + ' · last location ' + Math.round(M.position(t).age / 60) + ' min ago'), trip: t.id, at: now });
      var dbl = S().trips.filter(function (x) { return x !== t && x.drv === t.drv && x.st !== 'done'; }); if (dbl.length) out.push({ sev: 'crit', kind: 'drvconflict', txt: L(d.short + ' punya dua rute aktif', d.short + ' has two active routes'), trip: t.id, at: now });
    });
    S().vehicles.forEach(function (v) { var iss = S().issues.filter(function (i) { return i.veh === v.id && i.st !== 'resolved'; })[0]; if (iss) out.push({ sev: iss.sev, kind: 'vehicle', txt: L('Masalah kendaraan ' + v.id + ': ' + T(iss.note), 'Vehicle problem ' + v.id + ': ' + iss.note[1]), iss: iss.id, at: ms(iss.at) }); });
    S().issues.filter(function (i) { return i.st !== 'resolved' && i.sev === 'crit' && i.type !== 'vehicle'; }).forEach(function (i) { out.push({ sev: 'crit', kind: 'critical', txt: L(T(M.ISSUE_TYPES[i.type][0]) + (i.prop ? ' · ' + M.propName(i.prop) : ''), M.ISSUE_TYPES[i.type][0][1] + (i.prop ? ' · ' + M.propName(i.prop) : '')), iss: i.id, ord: i.ord, at: ms(i.at) }); });
    out.sort(function (a, b) { return M.SEV[b.sev][2] - M.SEV[a.sev][2] || a.at - b.at; });
    return out;
  };
  M.ATT_KIND = { urgent: L('Urgent belum ditugaskan', 'Urgent unassigned'), slarisk: L('Risiko SLA', 'SLA risk'), routeconflict: L('Konflik rute', 'Route conflict'), drvconflict: L('Konflik driver', 'Driver conflict'), vehicle: L('Masalah kendaraan', 'Vehicle issue'), pickdelay: L('Pickup terlambat', 'Pickup delay'), deldelay: L('Delivery terlambat', 'Delivery delay'), offline: L('Sinyal driver', 'Driver signal'), critical: L('Masalah kritis', 'Critical issue') };

  /* ---------- Live tick: near arrival, material ETA change, offline (§61, §64, §75) ---------- */
  M.tick = function () {
    var c = S().cfg, changed = false;
    S().trips.filter(function (t) { return t.track && t.track.on; }).forEach(function (t) {
      var o = M.curOrder(t), p = M.position(t);
      if (p && p.fresh === 'offline' && !t.flags.off) { t.flags.off = true; notify('sup', 'offline', null, { drv: M.first(t.drv), ref: t.id }); changed = true; }
      if (!o || o.st !== 'ontheway') return;
      var e = M.eta(o); if (!e) return;
      if (e.near && !e.stale && !o.flags.near) { o.flags.near = true; notify(o.cl, 'near', o, { min: e.min }); sysChat(o, 'near', e.min); changed = true; }
      var last = o.lastDelay || 0;
      if (e.delay >= c.delayMin && Math.abs(e.delay - last) >= c.delayStep) {
        o.lastDelay = e.delay; notify(o.cl, 'delay', o, { min: e.delay }); notify('sup', 'routedelay', o, { min: e.delay, drv: M.first(t.drv) }); notify(t.drv, 'delay', o, { min: e.delay }); sysChat(o, 'eta', e.delay);
        M.audit('ETA.UPDATE', null, { ord: o.id, rec: o.id, from: last ? '+' + last : 'on time', to: '+' + e.delay + ' min · ' + hm(e.at) }); changed = true;
      }
    });
    if (changed) save();
    return changed;
  };

  /* ---------- Driver workflow (§23–§29, §55) ---------- */
  function own(ctx, o) { if (!o) return bad(M.MSG.notfound); if (!can(ctx, 'lg.drv.task')) return deny(ctx, o.id); if (!M.ownsOrder(ctx, o)) return deny(ctx, o.id); return null; }
  M.myTrip = function (ctx) { var d = M.myDriver(ctx); return d ? M.driverTrip(d) : null; };
  M.driverHome = function (ctx) {
    var t = M.myTrip(ctx); if (!t) return null;
    var os = M.tripOrders(t), cur = M.curOrder(t), nxt = M.nextOrder(t);
    return { trip: t, orders: os, cur: cur, next: nxt, focus: cur || nxt, pick: os.filter(function (o) { return o.kind === 'pickup' && o.st !== 'cancelled'; }).length, del: os.filter(function (o) { return o.kind === 'delivery' && o.st !== 'cancelled'; }).length,
      done: M.doneCount(t), issues: S().issues.filter(function (i) { return i.trip === t.id && i.st !== 'resolved'; }).length, allDone: os.length > 0 && os.every(function (o) { return ['completed', 'atplant', 'received', 'cancelled'].indexOf(o.st) >= 0 || (o.st === 'issue' && ['completed'].indexOf(o.prevSt) >= 0); }) };
  };
  /* MULAI PERJALANAN (§25): next stop → On The Way, tracking starts (first leg), trip start recorded, client notified. */
  M.startTrip = function (ctx, ordId) {
    var o = M.order(ordId), e = own(ctx, o); if (e) return e;
    var t = M.tripOf(o);
    if (M.curOrder(t)) return bad(L('Selesaikan stop yang sedang berjalan dulu.', 'Finish the current stop first.'), 'busy');
    if (['assigned', 'ready'].indexOf(o.st) < 0) return bad(M.MSG.jump, 'jump');
    if (M.vehicle(t.veh).maint === 'repair') return bad(M.MSG.maint, 'maint');
    var first = !t.track.on;
    if (o.st === 'assigned') setSt(o, 'ready', ctx, T(L('Kendaraan dimuat', 'Vehicle loaded')));
    setSt(o, 'ontheway', ctx); o.flags.started = true;
    if (first) {
      t.track = { on: true, from: isoT(M.now()), to: null }; t.st = 'active'; t.signal = 'ok';
      if (!t.shiftStart) { t.shiftStart = isoT(M.now()); t.log.push(['shift', t.shiftStart, t.drv]); }
      t.log.push(['tripstart', t.track.from, t.drv]); t.atPlant = null; t.ret = null;
      M.audit('TRACK.START', ctx, { rec: t.id, ord: o.id, to: M.empName(t.drv) });
    }
    M.audit('TRIP.START', ctx, { rec: t.id, ord: o.id, to: M.propName(o.prop) });
    notify(o.cl, 'tripstart', o); sysChat(o, 'tripstart');
    save();
    return { ok: true, order: o, trip: t, eta: M.eta(o) };
  };
  /* SAYA SUDAH TIBA (§27): arrival time, location (if permitted), status Arrived. */
  M.arrive = function (ctx, ordId, o2) {
    o2 = o2 || {};
    var o = M.order(ordId), e = own(ctx, o); if (e) return e;
    if (o.st !== 'ontheway') return bad(M.MSG.jump, 'jump');
    var t = M.tripOf(o), p = M.position(t), to = M.loc(o.prop);
    setSt(o, 'arrived', ctx);
    var pos = o2.noLoc || !p ? null : to.slice();
    addEv(ctx, o, 'arrive', { pos: pos, fresh: p ? p.fresh : null, noLoc: !pos });
    M.audit('TRIP.ARRIVE', ctx, { rec: t.id, ord: o.id, to: M.propName(o.prop) });
    notify(o.cl, 'arrived', o); sysChat(o, 'arrived');
    save();
    return { ok: true, order: o };
  };
  M.beginExec = function (ctx, ordId) {
    var o = M.order(ordId), e = own(ctx, o); if (e) return e;
    if (o.st === 'inprogress') return { ok: true, order: o };
    if (o.st !== 'arrived') return bad(M.MSG.jump, 'jump');
    setSt(o, 'inprogress', ctx); save(); return { ok: true, order: o };
  };
  /* Pickup execution (§28): bags, containers, category, estimate, condition, special item, photo, notes. No item count (§35). */
  M.savePickup = function (ctx, ordId, f) {
    var o = M.order(ordId), e = own(ctx, o); if (e) return e;
    if (o.kind !== 'pickup') return bad();
    if (o.st === 'arrived') setSt(o, 'inprogress', ctx);
    if (o.st !== 'inprogress') return bad(M.MSG.jump, 'jump');
    var bags = +f.bags, cont = +(f.cont || 0), kg = f.kg === '' || f.kg == null ? o.kg : +f.kg;
    if (!(bags >= 1 && bags <= 99)) return bad(L('Isi jumlah bag (minimal 1).', 'Enter the bag count (at least 1).'), 'bags');
    if (!(cont >= 0 && cont <= 20)) return bad(L('Jumlah container tidak valid.', 'Container count is not valid.'), 'cont');
    if (kg != null && (isNaN(kg) || kg < 0 || kg > 2000)) return bad(L('Perkiraan berat tidak valid.', 'Estimated weight is not valid.'), 'kg');
    var cond = M.COND[f.cond] ? f.cond : 'good';
    if (cond !== 'good' && !String(f.notes || '').trim() && !(f.photos && f.photos.length)) return bad(L('Kondisi tidak normal: tambahkan foto atau catatan.', 'Condition is not normal: add a photo or a note.'), 'cond');
    o.exec = { bags: bags, cont: cont, kg: kg, cat: M.CAT[f.cat] ? f.cat : o.cat, cond: cond, special: String(f.special || '').trim(), notes: String(f.notes || '').trim(), at: isoT(M.now()) };
    (f.photos || []).forEach(function (img) { addEv(ctx, o, 'photo', o.exec.cond, { img: img }); });
    save();
    return { ok: true, order: o, diff: bags - o.bags };
  };
  /* KONFIRMASI PENYERAHAN (§38): client PIC + signature → pickup complete, manifest and bags created. */
  M.confirmPickup = function (ctx, ordId, f) {
    var o = M.order(ordId), e = own(ctx, o); if (e) return e;
    if (o.kind !== 'pickup' || o.st !== 'inprogress' || !o.exec) return bad(M.MSG.manifest, 'manifest');
    var pic = String(f.pic || '').trim(); if (!pic) return bad(L('Isi nama PIC klien.', 'Enter the client PIC name.'), 'pic');
    var nosign = !f.sign;
    if (nosign && !(String(f.nosignReason || '').trim() && f.photo)) return bad(L('Minta tanda tangan klien, atau isi alasan dan foto bukti.', 'Ask for the client signature, or give a reason and a photo.'), 'sign');
    addEv(ctx, o, 'pic', pic + (f.picPos ? ' · ' + f.picPos : ''));
    addEv(ctx, o, 'bags', { bags: o.exec.bags, cont: o.exec.cont, kg: o.exec.kg, cat: o.exec.cat });
    addEv(ctx, o, 'cond', o.exec.cond);
    if (f.sign) addEv(ctx, o, 'sign', pic, { img: f.sign });
    else { addEv(ctx, o, 'note', { nosign: true, reason: f.nosignReason }); addEv(ctx, o, 'photo', 'nosign', { img: f.photo }); }
    if (o.exec.notes) addEv(ctx, o, 'note', o.exec.notes);
    setSt(o, 'completed', ctx); addEv(ctx, o, 'done', null);
    var t = M.tripOf(o), mf = { id: nid('mf', 'MF-2610-0'), ord: o.id, trip: t.id, pickAt: isoT(M.now()), bags: o.exec.bags, cont: o.exec.cont, kg: o.exec.kg, cat: o.exec.cat, special: o.exec.special ? L(o.exec.special, o.exec.special) : '', notes: o.exec.notes ? L(o.exec.notes, o.exec.notes) : '', st: 'intransit', ver: 1, hist: [] };
    S().manifests.push(mf);
    for (var i = 1; i <= mf.bags + mf.cont; i++) { var id = 'BAG-' + mf.id.slice(3) + '-' + (i < 10 ? '0' : '') + i; S().bags.push({ id: id, mf: mf.id, ord: o.id, cl: o.cl, prop: o.prop, kind: i > mf.bags ? 'container' : 'bag', cat: mf.cat, st: 'intransit', code: 'JF' + id.replace(/\D/g, ''), at: mf.pickAt, special: false, damaged: o.exec.cond === 'damaged', wet: o.exec.cond === 'wet', hist: [] }); }
    M.audit('PICKUP.COMPLETE', ctx, { ord: o.id, rec: mf.id, to: mf.bags + ' bag' });
    notify(o.cl, 'pickdone', o, { bags: mf.bags }); sysChat(o, 'pickdone', mf.bags);
    if (o.exec.bags !== o.bags) M.audit('MANIFEST.CHANGE', ctx, { ord: o.id, rec: mf.id, from: o.bags + ' bag (estimasi)', to: mf.bags + ' bag' });
    save();
    return { ok: true, order: o, manifest: mf };
  };
  /* SERAHKAN & KONFIRMASI → SELESAIKAN DELIVERY (§29, §39): recipient, signature, photo, bag count, condition. */
  M.confirmDelivery = function (ctx, ordId, f) {
    var o = M.order(ordId), e = own(ctx, o); if (e) return e;
    if (o.kind !== 'delivery') return bad();
    if (o.st === 'arrived') setSt(o, 'inprogress', ctx);
    if (o.st !== 'inprogress') return bad(M.MSG.jump, 'jump');
    var recv = String(f.recv || '').trim(), bags = +f.bags, pk = +(f.pkg || 0);
    if (!recv) return bad(L('Isi nama penerima.', 'Enter the recipient name.'), 'recv');
    if (!(bags >= 0 && bags <= 99)) return bad(L('Isi jumlah bag yang diserahkan.', 'Enter the bags handed over.'), 'bags');
    if (!f.sign) return bad(L('Minta tanda tangan penerima.', 'Ask for the recipient signature.'), 'sign');
    if (!f.photo) return bad(L('Ambil foto bukti pengiriman.', 'Take a delivery photo.'), 'photo');
    var cond = M.COND[f.cond] ? f.cond : 'good';
    if (bags !== o.bags && !String(f.issue || '').trim()) return bad(L('Jumlah bag berbeda dari rencana (' + o.bags + '). Tulis alasannya.', 'Bag count differs from the plan (' + o.bags + '). Give the reason.'), 'bagdiff');
    addEv(ctx, o, 'recv', recv); addEv(ctx, o, 'bags', { bags: bags, pkg: pk }); addEv(ctx, o, 'cond', cond); addEv(ctx, o, 'sign', recv, { img: f.sign }); addEv(ctx, o, 'photo', 'pod', { img: f.photo });
    o.pod = { recv: recv, bags: bags, pkg: pk, cond: cond, issue: String(f.issue || '').trim() || null, at: isoT(M.now()) };
    setSt(o, 'completed', ctx); addEv(ctx, o, 'done', null);
    M.audit('DELIVERY.COMPLETE', ctx, { ord: o.id, rec: o.id, to: bags + ' bag · ' + recv });
    notify(o.cl, 'deldone', o, { bags: bags, recv: recv }); sysChat(o, 'deldone', bags);
    if (bags !== o.bags) M.reportIssue(ctx, o.id, { type: bags < o.bags ? 'missing' : 'bagdiff', note: o.pod.issue, action: 'review', noStatus: true });
    save();
    return { ok: true, order: o };
  };
  // All stops done → back to the plant (route timeline: Return Plant).
  M.returnToPlant = function (ctx) {
    var h = M.driverHome(ctx); if (!h) return deny(ctx, 'TRIP');
    var t = h.trip; if (!t.track.on) return bad(M.MSG.jump, 'jump');
    if (M.curOrder(t)) return bad(L('Selesaikan stop yang sedang berjalan dulu.', 'Finish the current stop first.'), 'busy');
    var last = M.tripOrders(t).filter(function (x) { return ['completed', 'atplant', 'received'].indexOf(x.st) >= 0; }).slice(-1)[0];
    t.ret = isoT(M.now()); t.retFrom = last ? M.loc(last.prop) : M.PLANT; t.log.push(['ret', t.ret, t.drv]); save();
    return { ok: true, trip: t };
  };
  M.arriveAtPlant = function (ctx) {
    var h = M.driverHome(ctx); if (!h) return deny(ctx, 'TRIP');
    var t = h.trip; if (!t.ret) return bad(M.MSG.jump, 'jump');
    t.atPlant = isoT(M.now()); t.log.push(['plant', t.atPlant, t.drv]);
    S().manifests.filter(function (m) { return m.trip === t.id && m.st === 'intransit'; }).forEach(function (m) { m.st = 'arrived'; m.ho = Object.assign(m.ho || {}, { arrAt: t.atPlant }); S().bags.filter(function (b) { return b.mf === m.id && b.st === 'intransit'; }).forEach(function (b) { b.st = 'arrived'; }); });
    // route complete → tracking stops (§55)
    t.track.on = false; t.track.to = t.atPlant; M.audit('TRACK.STOP', ctx, { rec: t.id, to: T(L('Rute selesai, tiba di plant', 'Route complete, at plant')) });
    M.audit('PLANT.ARRIVE', ctx, { rec: t.id, to: t.atPlant });
    save(); return { ok: true, trip: t };
  };
  M.endShift = function (ctx) {
    var h = M.driverHome(ctx); if (!h) return deny(ctx, 'TRIP');
    var t = h.trip;
    if (M.curOrder(t)) return bad(L('Masih ada stop yang berjalan.', 'A stop is still running.'), 'busy');
    var openMf = S().manifests.filter(function (m) { return m.trip === t.id && ['intransit', 'arrived'].indexOf(m.st) >= 0 && !(m.ho && m.ho.drv); });
    if (openMf.length) return bad(L('Serahkan dulu ' + openMf.length + ' manifest ke receiving.', 'First hand over ' + openMf.length + ' manifest(s) to receiving.'), 'handover');
    if (t.track.on) { t.track.on = false; t.track.to = isoT(M.now()); M.audit('TRACK.STOP', ctx, { rec: t.id, to: T(L('Shift selesai', 'Shift ended')) }); }
    t.st = 'done'; t.log.push(['shiftend', isoT(M.now()), t.drv]);
    M.audit('SHIFT.END', ctx, { rec: t.id }); save();
    return { ok: true, trip: t };
  };

  /* ---------- Issues (§42–§47) ---------- */
  M.issues = function (ctx, f) {
    f = f || {};
    return S().issues.filter(function (i) {
      if (isClient(ctx)) return false;
      if (!(can(ctx, 'lg.issue.view') || can(ctx, 'lg.issue.manage'))) { if (!(can(ctx, 'lg.drv.task') && i.drv === empId(ctx)) && !(can(ctx, 'lg.handover') && i.type === 'bagdiff')) return false; }
      if (f.st && (f.st === 'open' ? i.st === 'resolved' : i.st !== f.st)) return false;
      if (f.sev && i.sev !== f.sev) return false; if (f.type && i.type !== f.type) return false; if (f.ord && i.ord !== f.ord) return false; if (f.trip && i.trip !== f.trip) return false;
      return true;
    }).sort(function (a, b) { return (a.st === 'resolved') - (b.st === 'resolved') || M.SEV[b.sev][2] - M.SEV[a.sev][2] || ms(b.at) - ms(a.at); });
  };
  /* ADA MASALAH (§45): reason (type, never free text only) → photo → notes → action. */
  M.reportIssue = function (ctx, ordId, f) {
    if (!can(ctx, 'lg.issue.report')) return deny(ctx, ordId || 'ISSUE');
    var o = ordId ? M.order(ordId) : null;
    if (ordId && !o) return bad(M.MSG.notfound);
    if (o && can(ctx, 'lg.drv.task') && !M.ownsOrder(ctx, o) && !can(ctx, 'lg.dispatch')) return deny(ctx, ordId);
    if (!M.ISSUE_TYPES[f.type]) return bad(L('Pilih jenis masalah.', 'Choose the issue type.'), 'type');
    var act = M.ISSUE_ACT[f.action] ? f.action : 'continue', tp = M.ISSUE_TYPES[f.type];
    if (f.type === 'other' && !String(f.note || '').trim()) return bad(L('Tulis catatan untuk masalah lainnya.', 'Write a note for an other issue.'), 'note');
    if (['damaged', 'wet', 'contam', 'rejected'].indexOf(f.type) >= 0 && !f.photo && !String(f.note || '').trim()) return bad(L('Tambahkan foto atau catatan sebagai bukti.', 'Add a photo or a note as evidence.'), 'photo');
    var sev = M.SEV[f.sev] ? f.sev : tp[1];
    var t = o ? M.tripOf(o) : (M.myDriver(ctx) ? M.driverTrip(M.myDriver(ctx)) : null);
    var i = { id: nid('iss', 'ISS-2610-', 2), ord: o ? o.id : null, mf: o && M.mfOf(o.id) ? M.mfOf(o.id).id : null, veh: f.type === 'vehicle' && t ? t.veh : f.veh || null, trip: t ? t.id : null, drv: t ? t.drv : null, cl: o ? o.cl : null, prop: o ? o.prop : null,
      type: f.type, sev: sev, at: isoT(M.now()), by: empId(ctx), note: f.note ? L(f.note, f.note) : L(T(tp[0]), tp[0][1]), photo: f.photo || null, action: act, st: 'open', owner: 'EMP-021', next: L(T(M.ISSUE_ACT[act][0]), M.ISSUE_ACT[act][0][1]), delay: null, hist: [] };
    if (sev === 'info' && act === 'continue') { i.st = 'resolved'; i.res = L('Dicatat, perjalanan dilanjutkan.', 'Noted, trip continues.'); i.resAt = i.at; }
    if (['reschedule', 'return', 'review', 'cancel'].indexOf(act) >= 0) i.st = 'review';
    var dmin = +f.delay || 0;
    if (dmin > 0 && o) { i.delay = tp[3] || f.delayR || 'other'; o.delay = (o.delay || 0) + dmin; o.delayR = i.delay; }
    if (o && i.st === 'review' && !f.noStatus && M.canMove(o, 'issue')) setSt(o, 'issue', ctx, T(tp[0]));
    S().issues.unshift(i);
    if (f.photo && o) addEv(ctx, o, 'photo', 'issue:' + i.id, { img: f.photo });
    M.audit('ISSUE.CREATE', ctx, { ord: o ? o.id : null, rec: i.id, to: f.type + ' · ' + sev, reason: f.note || null });
    if (o) sysChat(o, 'issue', T(tp[0]));
    if (sev === 'crit') { notify('sup', f.type === 'vehicle' ? 'vehicle' : 'critical', o, { type: T(tp[0]), typeEn: tp[0][1], ref: i.veh || i.id }); M.audit('ISSUE.ESCALATE', ctx, { ord: o ? o.id : null, rec: i.id, to: 'supervisor' }); }
    else if (i.st === 'review') notify('sup', 'critical', o, { type: T(tp[0]), typeEn: tp[0][1], ref: i.id });
    if ((f.type === 'bagdiff' || f.type === 'missing') && !f.silent) notify('sup', 'bagdiff', o, { mf: i.mf || '' });
    save();
    return { ok: true, issue: i };
  };
  /* Supervisor decision (§46–§47). Discrepancies (Selisih Handover) are decided here too. */
  M.DECIDE = { continue: L('Lanjutkan tugas', 'Continue the task'), reschedule: L('Jadwalkan ulang', 'Reschedule'), return: L('Bawa kembali ke plant', 'Return to plant'), cancel: L('Batalkan order', 'Cancel order'), found: L('Bag ditemukan, jumlah cocok', 'Bag found, count matches'), accept: L('Terima selisih (bag hilang, klaim diproses)', 'Accept the difference (bag missing, claim follows)'), close: L('Tutup (sudah ditangani)', 'Close (handled)') };
  M.decide = function (ctx, issId, dec, f) {
    f = f || {};
    if (!can(ctx, 'lg.issue.manage')) return deny(ctx, issId);
    var i = M.issue(issId); if (!i) return bad(M.MSG.notfound);
    if (i.st === 'resolved') return bad(L('Masalah ini sudah selesai.', 'This issue is already resolved.'), 'done');
    if (!M.DECIDE[dec]) return bad();
    var note = String(f.note || '').trim(); if (!note) return bad(M.MSG.reason, 'reason');
    var o = i.ord ? M.order(i.ord) : null;
    if (i.type === 'bagdiff' && i.mf) {
      var mf = M.manifest(i.mf);
      if (dec === 'found') { mf.ho.count = mf.bags + (mf.cont || 0); mf.ho.diff = 0; S().bags.filter(function (b) { return b.mf === mf.id && b.st === 'missing'; }).forEach(function (b) { b.st = 'arrived'; b.hist.push(['found', isoT(M.now()), empId(ctx)]); }); }
      else if (dec === 'accept') mf.ho.accepted = true;
      else if (dec !== 'close') return bad();
      mf.st = 'arrived'; mf.hist.push(['decide', isoT(M.now()), empId(ctx), dec]);
      if (o && o.st === 'issue') setSt(o, o.prevSt, ctx, note);
      M.audit('MANIFEST.CHANGE', ctx, { ord: mf.ord, rec: mf.id, to: dec, reason: note });
    } else if (o && o.st === 'issue') {
      if (dec === 'continue') setSt(o, o.prevSt, ctx, note);
      else if (dec === 'reschedule') { if (!f.date || !f.win) return bad(L('Pilih tanggal dan jam baru.', 'Choose the new date and time.')); removeFromTrip(o); o.date = f.date; o.win = f.win; o.plan = null; setSt(o, 'scheduled', ctx, note); notify(o.cl, 'resched', o, { date: f.date, win: f.win.join('–') }); sysChat(o, 'resched'); }
      else if (dec === 'return') { removeFromTrip(o); setSt(o, 'scheduled', ctx, note); notify(o.cl, 'resched', o, { date: o.date, win: o.win.join('–') }); }
      else if (dec === 'cancel') { removeFromTrip(o); setSt(o, 'cancelled', ctx, note); }
    }
    i.st = 'resolved'; i.res = L(T(M.DECIDE[dec]) + ' · ' + note, M.DECIDE[dec][1] + ' · ' + note); i.resAt = isoT(M.now()); i.resBy = empId(ctx); i.dec = dec;
    i.hist.push(['decide', i.resAt, empId(ctx), dec, note]);
    save(); M.audit('ISSUE.DECIDE', ctx, { ord: i.ord, rec: i.id, to: dec, reason: note });
    return { ok: true, issue: i };
  };

  /* ---------- Manifest and bags (§30–§34) ---------- */
  M.manifests = function (ctx, f) {
    f = f || {};
    return S().manifests.filter(function (m) { var o = M.order(m.ord); return M.canSeeOrder(ctx, o) && (can(ctx, 'lg.manifest.view') || isClient(ctx)) && (!f.st || m.st === f.st) && (!f.trip || m.trip === f.trip); });
  };
  M.bags = function (ctx, f) {
    f = f || {};
    return S().bags.filter(function (b) { var o = M.order(b.ord); if (!M.canSeeOrder(ctx, o) || !can(ctx, 'lg.manifest.view')) return false; if (f.mf && b.mf !== f.mf) return false; if (f.st && b.st !== f.st) return false; if (f.q) { var q = f.q.toLowerCase(); if ((b.id + ' ' + b.code + ' ' + b.ord + ' ' + M.propName(b.prop)).toLowerCase().indexOf(q) < 0) return false; } return true; });
  };
  M.reconcile = function (mfId) {
    var m = M.manifest(mfId); if (!m) return null;
    var pick = m.bags + (m.cont || 0), arr = m.ho && m.ho.count != null ? m.ho.count : null, live = S().bags.filter(function (b) { return b.mf === m.id && b.st !== 'removed'; }).length;
    return { pick: pick, arr: arr, scanned: S().bags.filter(function (b) { return b.mf === m.id && b.scan; }).length, live: live, diff: arr == null ? null : arr - pick, match: arr != null && arr === pick };
  };
  /* Bag actions (§33): scan, add, remove with reason, mark special / damaged / missing. Each change versions the manifest. */
  M.bagAction = function (ctx, mfId, act, a) {
    a = a || {};
    var m = M.manifest(mfId); if (!m) return bad(M.MSG.notfound);
    var o = M.order(m.ord), t = M.trip(m.trip), isDrv = can(ctx, 'lg.drv.task') && t && t.drv === empId(ctx);
    if (!can(ctx, 'lg.manifest.edit') && !isDrv) return deny(ctx, mfId);
    if (['received'].indexOf(m.st) >= 0) return bad(L('Manifest sudah diterima receiving dan terkunci.', 'The manifest is received and locked.'), 'locked');
    var b = a.bag ? M.bag(a.bag) : null, reason = String(a.reason || '').trim(), now = isoT(M.now()), from = null, to = null;
    if (act === 'scan') {
      b = M.bag(String(a.code || '').trim()); if (!b) return bad(L('Kode bag tidak dikenali. Coba scan lagi.', 'Bag code not recognised. Scan again.'), 'scan');
      if (b.mf !== m.id) return bad(L('Bag ini milik manifest ' + b.mf + '.', 'This bag belongs to manifest ' + b.mf + '.'), 'wrongmf');
      b.scan = now; b.hist.push(['scan', now, empId(ctx)]); save(); return { ok: true, bag: b };
    }
    if (act === 'add') {
      var n = S().bags.filter(function (x) { return x.mf === m.id; }).length + 1, id = 'BAG-' + m.id.slice(3) + '-' + (n < 10 ? '0' : '') + n;
      b = { id: id, mf: m.id, ord: m.ord, cl: o.cl, prop: o.prop, kind: a.kind === 'container' ? 'container' : 'bag', cat: m.cat, st: m.st === 'intransit' ? 'intransit' : 'arrived', code: 'JF' + id.replace(/\D/g, ''), at: now, special: false, damaged: false, wet: false, hist: [['add', now, empId(ctx), reason]] };
      if (!reason) return bad(M.MSG.reason, 'reason');
      S().bags.push(b); if (b.kind === 'container') m.cont = (m.cont || 0) + 1; else m.bags++; from = (m.bags - (b.kind === 'bag' ? 1 : 0)) + ''; to = m.bags + '';
    } else {
      if (!b || b.mf !== m.id) return bad(M.MSG.notfound);
      if (act === 'remove') { if (!reason) return bad(M.MSG.reason, 'reason'); if (b.st === 'removed') return bad(); from = b.st; b.st = 'removed'; if (b.kind === 'container') m.cont--; else m.bags--; to = 'removed'; }
      else if (act === 'special') { b.special = !b.special; to = 'special ' + b.special; }
      else if (act === 'damaged') { if (!reason) return bad(M.MSG.reason, 'reason'); b.damaged = true; to = 'damaged'; }
      else if (act === 'missing') { if (!reason) return bad(M.MSG.reason, 'reason'); from = b.st; b.st = 'missing'; to = 'missing'; M.reportIssue(ctx, m.ord, { type: 'missing', note: b.id + ' · ' + reason, action: 'review' }); }
      else return bad();
      b.hist.push([act, now, empId(ctx), reason || null]);
    }
    m.ver = (m.ver || 1) + 1; m.hist.push([act, now, empId(ctx), b.id, reason || null]); save();
    M.audit('MANIFEST.CHANGE', ctx, { ord: m.ord, rec: m.id, from: from, to: b.id + ' · ' + to, reason: reason || null });
    return { ok: true, bag: b, manifest: m };
  };

  /* ---------- Arrival and handover (§48–§53, §89) ---------- */
  M.arrivals = function (ctx) {
    if (!can(ctx, 'lg.arrival')) return null;
    var now = M.now(), lanes = { expected: [], soon: [], arrived: [], issue: [], done: [] };
    S().trips.forEach(function (t) {
      var mfs = S().manifests.filter(function (m) { return m.trip === t.id; }), picks = M.tripOrders(t).filter(function (o) { return o.kind === 'pickup' && o.st !== 'cancelled'; });
      if (!picks.length && !mfs.length) return;
      var eta = null;
      if (t.ret && !t.atPlant) { var rf = t.retFrom || M.PLANT; eta = ms(t.ret) + Math.max(6, Math.round(dist(rf, M.PLANT) / S().cfg.speed)) * MIN; if (eta < now + MIN) eta = now + MIN; }
      else if (!t.atPlant && t.st !== 'done') eta = M.plan(t).end;
      var card = { trip: t, mfs: mfs, bags: sum(mfs.map(function (m) { return m.bags + (m.cont || 0); })) + sum(picks.filter(function (o) { return !M.mfOf(o.id); }).map(function (o) { return o.bags; })), eta: eta, pend: picks.filter(function (o) { return !M.mfOf(o.id); }).length };
      if (mfs.some(function (m) { return m.st === 'discrepancy'; })) lanes.issue.push(card);
      else if (mfs.some(function (m) { return m.st === 'arrived'; })) lanes.arrived.push(card);
      else if (eta && !t.atPlant) (t.ret || eta - now <= 30 * MIN ? lanes.soon : lanes.expected).push(card);
      else if (mfs.length && mfs.every(function (m) { return ['handed', 'received'].indexOf(m.st) >= 0; })) lanes.done.push(card);
    });
    lanes.expected.sort(function (a, b) { return a.eta - b.eta; }); lanes.soon.sort(function (a, b) { return a.eta - b.eta; });
    return lanes;
  };
  /* Receiving verifies count and condition and confirms arrival (§51). A mismatch needs reason + evidence → Selisih Handover (§52). */
  M.hoVerify = function (ctx, mfId, f) {
    var m = M.manifest(mfId); if (!m) return bad(M.MSG.notfound);
    if (!can(ctx, 'lg.handover') || can(ctx, 'lg.drv.task')) return deny(ctx, mfId);
    if (['handed', 'received'].indexOf(m.st) >= 0) return bad(L('Handover manifest ini sudah selesai.', 'This manifest handover is already complete.'), 'done');
    if (m.st === 'discrepancy') return bad(M.MSG.pending, 'pending');
    var count = +f.count; if (!(count >= 0 && count <= 199) || f.count === '' || f.count == null) return bad(L('Isi jumlah bag yang tiba.', 'Enter the bags that arrived.'), 'count');
    var cond = M.COND[f.cond] ? f.cond : 'good', pick = m.bags + (m.cont || 0), diff = count - pick;
    if (diff !== 0 && !(String(f.reason || '').trim() && f.photo)) return bad(L('Jumlah bag berbeda. Isi alasan dan tambahkan foto bukti.', 'Bag count differs. Give a reason and add a photo.'), 'bagdiff', { diff: diff });
    if (cond !== 'good' && !String(f.notes || f.reason || '').trim()) return bad(L('Kondisi tidak baik: tulis catatan.', 'Condition not good: write a note.'), 'cond');
    var now = isoT(M.now());
    m.ho = Object.assign(m.ho || {}, { arrAt: (m.ho && m.ho.arrAt) || now, count: count, cond: cond, notes: f.notes || null, rcvBy: empId(ctx), verAt: now, diff: diff, reason: diff ? L(f.reason, f.reason) : null, photo: f.photo || null });
    var t = M.trip(m.trip); if (t && !t.atPlant && t.ret) { t.atPlant = now; t.log.push(['plant', now, t.drv]); }
    if (m.st === 'intransit') m.st = 'arrived';
    S().bags.filter(function (b) { return b.mf === m.id && b.st === 'intransit'; }).forEach(function (b) { b.st = 'arrived'; });
    if (diff !== 0) {
      m.st = 'discrepancy';
      var r = M.reportIssue(Object.assign({}, ctx, { perms: (ctx.perms || []).concat(['lg.issue.report']) }), m.ord, { type: 'bagdiff', note: T(L('Pickup ', 'Picked up ')) + pick + ' → ' + T(L('tiba ', 'arrived ')) + count + '. ' + f.reason, action: 'review', photo: f.photo, noStatus: true, silent: true });
      m.ho.issue = r.issue.id; r.issue.mf = m.id;
      notify('sup', 'bagdiff', M.order(m.ord), { mf: m.id, from: pick, to: count });
      M.audit('HANDOVER.DIFF', ctx, { ord: m.ord, rec: m.id, from: pick, to: count, reason: f.reason });
    }
    save();
    return { ok: true, manifest: m, match: diff === 0, diff: diff };
  };
  /* Both sides confirm (§89): driver "SERAHKAN & KONFIRMASI", receiving "TERIMA & KONFIRMASI". */
  M.hoConfirm = function (ctx, mfId) {
    var m = M.manifest(mfId); if (!m) return bad(M.MSG.notfound);
    var t = M.trip(m.trip), now = isoT(M.now()), side;
    if (can(ctx, 'lg.drv.task')) { if (!t || t.drv !== empId(ctx)) return deny(ctx, mfId); side = 'drv'; }
    else if (can(ctx, 'lg.handover')) side = 'rcv';
    else return deny(ctx, mfId);
    if (['handed', 'received'].indexOf(m.st) >= 0) return bad(L('Handover manifest ini sudah selesai.', 'This manifest handover is already complete.'), 'done');
    if (side === 'drv' && !(t.atPlant || t.ret || (m.ho && m.ho.arrAt))) return bad(L('Konfirmasi setelah tiba di plant.', 'Confirm after arriving at the plant.'), 'notyet');
    if (side === 'rcv' && !(m.ho && m.ho.count != null)) return bad(L('Verifikasi jumlah dan kondisi bag dulu.', 'Verify bag count and condition first.'), 'verify');
    if (m.st === 'discrepancy') {
      var iss = m.ho && m.ho.issue && M.issue(m.ho.issue);
      if (side === 'rcv' && (!iss || iss.st !== 'resolved')) return bad(M.MSG.pending, 'pending');
    }
    m.ho = m.ho || {}; m.ho[side] = now; if (side === 'rcv') m.ho.rcvBy = empId(ctx);
    M.audit('HANDOVER.CONFIRM', ctx, { ord: m.ord, rec: m.id, to: side === 'drv' ? 'driver' : 'receiving' });
    var both = !S().cfg.dual || (m.ho.drv && m.ho.rcv);
    if (both && m.st !== 'discrepancy' && (m.ho.diff === 0 || m.ho.accepted || m.ho.diff == null)) {
      m.st = 'handed';
      var o = M.order(m.ord); if (o.st === 'completed') setSt(o, 'atplant', ctx, T(L('Handover dikonfirmasi dua pihak', 'Handover confirmed by both sides')));
      if (t) t.log.push(['handover', now, t.drv, m.id]);
    }
    save();
    return { ok: true, manifest: m, side: side, complete: m.st === 'handed' };
  };
  // Arrived at Plant ≠ Received (§53): receiving starts as a separate event and hands over to OPS-RCV.
  M.startReceiving = function (ctx, mfId) {
    var m = M.manifest(mfId); if (!m) return bad(M.MSG.notfound);
    if (!can(ctx, 'lg.handover') || can(ctx, 'lg.drv.task')) return deny(ctx, mfId);
    if (m.st !== 'handed') return bad(L('Selesaikan handover dua pihak dulu.', 'Complete the two-sided handover first.'), 'jump');
    var o = M.order(m.ord); if (!M.canMove(o, 'received')) return bad(M.MSG.jump, 'jump');
    m.st = 'received'; S().bags.filter(function (b) { return b.mf === m.id && ['arrived', 'intransit'].indexOf(b.st) >= 0; }).forEach(function (b) { b.st = 'received'; });
    setSt(o, 'received', ctx); M.audit('RECEIVING.START', ctx, { ord: o.id, rec: m.id }); save();
    return { ok: true, manifest: m, order: o };
  };

  /* ---------- Route timeline (§71) ---------- */
  M.timeline = function (ctx, tripId) {
    var t = M.trip(tripId); if (!t) return null;
    if (!(can(ctx, 'lg.timeline') && (!can(ctx, 'lg.drv.task') || t.drv === empId(ctx)))) return null;
    var rows = t.log.map(function (l) { return { k: l[0], at: l[1], by: l[2], ref: l[3] || null }; });
    M.tripOrders(t).forEach(function (o) {
      o.ev.forEach(function (e) {
        var k = { ontheway: 'depart', arrived: 'arrive', inprogress: o.kind === 'delivery' ? 'delstart' : 'pickstart', completed: o.kind === 'delivery' ? 'deldone' : 'pickdone' }[e[0]];
        if (k) rows.push({ k: k, at: e[1], by: e[2], ord: o.id });
      });
    });
    S().issues.filter(function (i) { return i.trip === t.id; }).forEach(function (i) { rows.push({ k: 'issue', at: i.at, by: i.by, ord: i.ord, iss: i.id }); });
    return rows.sort(function (a, b) { return ms(a.at) - ms(b.at); });
  };
  M.trips = function (ctx) { return S().trips.filter(function (t) { return can(ctx, 'lg.track.fleet') || can(ctx, 'lg.dispatch') || can(ctx, 'lg.kpi') || can(ctx, 'lg.timeline') && (!can(ctx, 'lg.drv.task') || t.drv === empId(ctx)); }); };

  /* ---------- Client tracking (§62–§64, §81) ---------- */
  M.clientTrack = function (ctx, ordId) {
    var o = M.clientOrder(ctx, ordId); if (!o) return null;
    var t = M.tripOf(o), stt = M.tripStatus(o), show = t && M.canSeeLocation(ctx, t, o.id), p = show ? M.position(t) : null, e = M.eta(o);
    return { o: o, st: stt, eta: e, pos: p, dest: M.loc(o.prop), driver: t ? M.first(t.drv) : null, plate: t && show ? M.vehicle(t.veh).plate : null, live: !!p, ended: stt === 'completed' };
  };
  M.clientActive = function (ctx) { return isClient(ctx) ? S().orders.filter(function (o) { return o.cl === ctx.client && o.date === M.TODAY && ['cancelled', 'draft'].indexOf(o.st) < 0; }) : []; };

  /* ---------- KPI (§76) and the Phase 5 link (§77) ---------- */
  M.KPIS = [
    ['arrOn', L('Kedatangan tepat waktu', 'On-Time Arrival'), '%', 'higher', 95], ['pickOn', L('Pickup tepat waktu', 'Pickup On-Time'), '%', 'higher', 95], ['delOn', L('Delivery tepat waktu', 'Delivery On-Time'), '%', 'higher', 96],
    ['travel', L('Rata-rata waktu tempuh', 'Average Travel Time'), L('mnt', 'min'), 'lower', 20], ['stop', L('Rata-rata waktu di stop', 'Average Stop Time'), L('mnt', 'min'), 'lower', 12], ['perDay', L('Tugas per driver / hari', 'Tasks per Driver / day'), '', 'higher', 4],
    ['eff', L('Efisiensi rute', 'Route Efficiency'), '%', 'higher', 95], ['failed', L('Pickup gagal', 'Failed Pickup Rate'), '%', 'lower', 1], ['wait', L('Waktu tunggu klien', 'Client Waiting Time'), L('mnt', 'min'), 'lower', 2],
    ['evid', L('Kelengkapan bukti', 'Evidence Completion'), '%', 'higher', 98], ['hoAcc', L('Akurasi handover', 'Handover Accuracy'), '%', 'higher', 99], ['routeIss', L('Rasio masalah rute', 'Route Issue Rate'), '%', 'lower', 3]
  ];
  function todayAgg(drv) {
    var a = { tasks: 0, arrOn: 0, pick: 0, pickOn: 0, del: 0, delOn: 0, travel: 0, stop: 0, failed: 0, wait: 0, evOk: 0, ho: 0, hoOk: 0, routeIss: 0, km: 0, kmPlan: 0, podOk: 0 };
    S().orders.filter(function (o) { var t = M.tripOf(o); return t && t.drv === drv && ['completed', 'atplant', 'received'].indexOf(o.st) >= 0 && o.date === M.TODAY; }).forEach(function (o) {
      var arr = M.evAt(o, 'arrived'), dep = M.evAt(o, 'ontheway'), done = M.evAt(o, 'completed'), on = arr && ms(arr) <= at(o.date, o.win[1]);
      a.tasks++; if (on) a.arrOn++;
      if (o.kind === 'pickup') { a.pick++; if (on) a.pickOn++; } else { a.del++; if (on) a.delOn++; if (M.evidenceComplete(o).ok) a.podOk++; }
      if (dep && arr) a.travel += (ms(arr) - ms(dep)) / MIN; if (arr && done) a.stop += (ms(done) - ms(arr)) / MIN;
      if (arr) a.wait += Math.max(0, (ms(arr) - M.planAt(o)) / MIN);
      if (M.evidenceComplete(o).ok) a.evOk++;
      var m = M.mfOf(o.id); if (m && m.ho && m.ho.count != null) { a.ho++; if (m.ho.diff === 0) a.hoOk++; }
      var t2 = M.tripOf(o), km = r1(dist(prevLoc(t2, o), M.loc(o.prop)) / 9); a.km += km; a.kmPlan += km;
    });
    a.failed = S().orders.filter(function (o) { var t = M.tripOf(o); return t && t.drv === drv && o.st === 'cancelled'; }).length;
    a.routeIss = S().issues.filter(function (i) { return i.drv === drv && ['traffic', 'routedelay', 'vehicle', 'address'].indexOf(i.type) >= 0; }).length;
    return a;
  }
  function kpiOf(h, days) {
    function p(a, b) { return b ? r1(a / b * 100) : null; }
    return { arrOn: p(h.arrOn, h.tasks), pickOn: p(h.pickOn, h.pick), delOn: p(h.delOn, h.del), travel: h.tasks ? r1(h.travel / h.tasks) : null, stop: h.tasks ? r1(h.stop / h.tasks) : null, perDay: r1(h.tasks / (days || 30)),
      eff: h.km ? r1(Math.min(100, h.kmPlan / h.km * 100)) : null, failed: p(h.failed, h.tasks), wait: h.tasks ? r1(h.wait / h.tasks) : null, evid: p(h.evOk, h.tasks), hoAcc: p(h.hoOk, h.ho), routeIss: p(h.routeIss, h.tasks),
      pod: p(h.podOk, h.del), compliance: h.tasks ? r1((h.tasks - h.routeIss) / h.tasks * 100) : null, kmStop: h.tasks ? r1(h.km / h.tasks) : null, issues: h.failed, tasks: h.tasks };
  }
  M.kpi = function (drv) {
    var ids = drv ? [drv] : Object.keys(D.HIST), h = {}, tdy = {};
    Object.keys(D.HIST['EMP-002']).forEach(function (k) { h[k] = 0; tdy[k] = 0; });
    ids.forEach(function (id) { var a = D.HIST[id] || {}, b = todayAgg(id); Object.keys(h).forEach(function (k) { h[k] += (a[k] || 0) + (b[k] || 0); tdy[k] += b[k] || 0; }); });
    return { k: kpiOf(h, 31 * (drv ? 1 : ids.length)), today: kpiOf(tdy, 1), raw: h, drivers: ids.length };
  };
  M.kpiByDriver = function () { return Object.keys(D.HIST).map(function (id) { return { id: id, d: M.driver(id), k: M.kpi(id).k }; }); };
  // §77: the driver Personal KPI lines of Phase 5 (on-time, route compliance, POD accuracy, issues, km/stop) are fed from here.
  M.perfFeed = function (P) {
    if (!P || !P.D || !P.D.PEOPLE) return 0;
    var n = 0;
    P.D.PEOPLE.forEach(function (p) {
      if (p.role !== 'drv' || !D.HIST[p.id]) return;
      var k = M.kpi(p.id).k;
      p.ind = [k.delOn, k.compliance, k.pod, k.issues, k.kmStop]; p.src7 = M.version; n++;
    });
    return n;
  };

  /* ---------- Screens, navigation, install (§84) ---------- */
  function sc(id, n, a, p, np, nv, icon, pur, emp, o) {
    return Object.assign({ id: id, n: n, a: a, p: p, np: np, nv: nv, icon: icon, pur: pur, dom: 'log', lvl: 2, p7: true, nb: [], bf: [], aud: [],
      emp: emp || L('Belum ada data.', 'No data yet.'), err: L('Data logistik belum berhasil dimuat. Coba Lagi.', 'Logistics data could not be loaded. Try Again.'), warn: L('Ada tugas yang perlu perhatian.', 'Some tasks need attention.'), ok: L('Tersimpan.', 'Saved.') }, o || {});
  }
  M.SCREENS = [
    sc('ORDER-001', L('Daftar Order', 'Order List'), 'T05', 'lg.order.view', 'NP-01', 'NV-01', 'list', L('Semua order pickup & delivery: sumber, prioritas, status, SLA.', 'All pickup & delivery orders: source, priority, status, SLA.'), L('Belum ada order hari ini.', 'No order today yet.')),
    sc('ORDER-002', L('Buat Order', 'Create Order'), 'T06', 'lg.order.create', 'NP-01', 'NV-01', 'plus', L('Buat order / minta pickup dengan cek order ganda.', 'Create an order / request a pickup with a duplicate check.')),
    sc('ORDER-003', L('Detail Order', 'Order Detail'), 'T03', 'lg.order.view', 'NP-01', 'NV-01', 'file', L('Satu order: status, driver, ETA, bukti, manifest, chat dan riwayat.', 'One order: status, driver, ETA, evidence, manifest, chat and history.')),
    sc('SCHEDULE-001', L('Jadwal Rutin', 'Recurring Schedule'), 'T05', 'lg.schedule.view', 'NP-02', 'NV-02', 'calendar', L('Jadwal pickup rutin, kalender 7 hari, libur dan auto order.', 'Recurring pickups, 7-day calendar, holidays and auto orders.'), L('Belum ada jadwal rutin.', 'No recurring schedule yet.')),
    sc('SCHEDULE-002', L('Editor Jadwal', 'Schedule Editor'), 'T06', 'lg.schedule.edit', 'NP-02', 'NV-02', 'edit', L('Buat jadwal atau ubah jadwal mendatang (versi baru).', 'Create a schedule or change future dates (new version).')),
    sc('DISPATCH-001', L('Dispatch Board', 'Dispatch Board'), 'T08', 'lg.dispatch', 'NP-03', 'NV-03', 'columns', L('Tujuh lajur kerja harian dan panel perhatian.', 'Seven daily work lanes and the attention panel.'), L('Belum ada tugas hari ini.', 'No task today yet.'), { lvl: 3 }),
    sc('ROUTE-001', L('Perencanaan Rute', 'Route Planner'), 'T05', 'lg.route.view', 'NP-04', 'NV-04', 'route', L('Master rute dan rute hari ini dengan peta, muatan dan peringatan.', 'Route master and today\'s routes with map, load and warnings.'), L('Belum ada rute.', 'No route yet.'), { lvl: 3 }),
    sc('ROUTE-002', L('Detail Rute', 'Route Detail'), 'T03', 'lg.route.view', 'NP-04', 'NV-04', 'route', L('Stop berurutan, perkiraan tiba, muatan dan ubah urutan dengan alasan.', 'Ordered stops, expected arrival, load and reorder with a reason.'), null, { lvl: 3 }),
    sc('DRIVER-001', L('Penugasan Driver', 'Driver Assignment'), 'T05', 'lg.fleet.view', 'NP-04', 'NV-04', 'users', L('Driver, shift, ketersediaan, kendaraan, rute dan sisa tugas.', 'Drivers, shift, availability, vehicle, route and tasks left.'), L('Belum ada driver.', 'No driver yet.'), { lvl: 3 }),
    sc('VEHICLE-001', L('Penugasan Kendaraan', 'Vehicle Assignment'), 'T05', 'lg.fleet.view', 'NP-04', 'NV-04', 'truck', L('Kendaraan, kapasitas, muatan, perawatan dan driver.', 'Vehicles, capacity, load, maintenance and driver.'), L('Belum ada kendaraan.', 'No vehicle yet.'), { lvl: 3 }),
    sc('DRIVER-MOB-001', L('Hari Ini', 'Driver Today'), 'T01', 'lg.drv.task', 'NP-05', 'NV-05', 'calendar', L('Tugas hari ini, tugas berikutnya dan MULAI PERJALANAN.', 'Today\'s tasks, next task and MULAI PERJALANAN.'), L('Belum ada tugas hari ini.', 'No task today.'), { lvl: 1 }),
    sc('DRIVER-MOB-002', L('Perjalanan', 'Trip Detail'), 'T04', 'lg.drv.task', 'NP-05', 'NV-05', 'truck', L('Tujuan, kontak, ETA, peta, instruksi dan SAYA SUDAH TIBA.', 'Destination, contact, ETA, map, instructions and SAYA SUDAH TIBA.')),
    sc('DRIVER-MOB-003', L('Pickup di Lokasi', 'Arrived / Pickup Execution'), 'T04', 'lg.drv.task', 'NP-05', 'NV-05', 'clipboard', L('Bag, kategori, kondisi, foto, catatan dan SELESAIKAN PICKUP.', 'Bags, category, condition, photo, notes and SELESAIKAN PICKUP.')),
    sc('MANIFEST-001', L('Detail Manifest', 'Manifest Detail'), 'T03', 'lg.manifest.view', 'NP-06', 'NV-06', 'clipboard', L('Manifest: order, klien, driver, bag, berat, status dan versi.', 'Manifest: order, client, driver, bags, weight, status and versions.'), L('Belum ada manifest.', 'No manifest yet.')),
    sc('BAG-001', L('Pelacakan Bag', 'Bag Tracking'), 'T05', 'lg.manifest.view', 'NP-06', 'NV-06', 'package', L('Setiap bag: ID, order, klien, status, kode scan (QR/barcode/RFID siap).', 'Each bag: ID, order, client, status, scan code (QR/barcode/RFID ready).'), L('Belum ada bag.', 'No bag yet.')),
    sc('EVIDENCE-001', L('Bukti & Konfirmasi', 'Evidence Capture'), 'T04', 'lg.evidence.view', 'NP-07', 'NV-07', 'camera', L('Barang diserahkan: PIC, tanda tangan, foto dan KONFIRMASI PENYERAHAN; timeline bukti.', 'Items handed over: PIC, signature, photo and KONFIRMASI PENYERAHAN; evidence timeline.')),
    sc('POD-001', L('Konfirmasi Delivery', 'Delivery Confirmation'), 'T04', 'lg.drv.task', 'NP-07', 'NV-07', 'sign', L('Penerima, tanda tangan, foto, bag, kondisi dan SELESAIKAN DELIVERY.', 'Recipient, signature, photo, bags, condition and SELESAIKAN DELIVERY.')),
    sc('ISSUE-001', L('Ada Masalah', 'Report Issue'), 'T06', 'lg.issue.report', 'NP-08', 'NV-08', 'alert', L('Pilih alasan, foto, catatan dan tindakan.', 'Choose reason, photo, notes and action.')),
    sc('ISSUE-002', L('Inbox Masalah Logistik', 'Supervisor Issue Inbox'), 'T05', 'lg.issue.view', 'NP-08', 'NV-08', 'alert', L('Masalah menurut keparahan dengan pemilik dan tindakan berikutnya.', 'Issues by severity with owner and next action.'), L('Tidak ada masalah terbuka.', 'No open issue.'), { lvl: 3 }),
    sc('ARRIVAL-001', L('Arrival Board', 'Arrival Board'), 'T08', 'lg.arrival', 'NP-09', 'NV-09', 'factory', L('Kendaraan menuju plant: diharapkan, segera tiba, tiba, masalah.', 'Vehicles heading to the plant: expected, arriving soon, arrived, issue.'), L('Belum ada kendaraan menuju plant.', 'No vehicle heading to the plant.')),
    sc('HANDOVER-001', L('Handover Receiving', 'Receiving Handover'), 'T04', 'lg.handover', 'NP-09', 'NV-09', 'filecheck', L('Verifikasi bag dan kondisi, rekonsiliasi, konfirmasi dua pihak.', 'Verify bags and condition, reconcile, two-sided confirmation.'), L('Tidak ada manifest menunggu handover.', 'No manifest waiting for handover.')),
    sc('TRACK-001', L('Live Map Operasional', 'Live Operations Map'), 'T08', 'lg.track.fleet', 'NP-10', 'NV-10', 'pin', L('Posisi driver selama trip aktif, status, ETA dan tugas.', 'Driver positions during active trips, status, ETA and tasks.'), L('Tidak ada trip aktif. Lokasi hanya tampil selama perjalanan.', 'No active trip. Location shows only during a trip.'), { lvl: 3 }),
    sc('TRACK-002', L('Detail Driver Live', 'Driver Live Detail'), 'T03', 'lg.track.fleet', 'NP-10', 'NV-10', 'user', L('Satu driver: tugas sekarang, berikutnya, ETA, progres, SLA, update terakhir.', 'One driver: current task, next stop, ETA, progress, SLA, last update.'), null, { lvl: 3 }),
    sc('TRACK-003', L('Lacak Driver', 'Client Tracking'), 'T03', 'lg.track.own', 'NP-10', 'NV-10', 'truck', L('Klien: status trip, ETA dan peta hanya untuk order sendiri.', 'Client: trip status, ETA and map for own order only.'), L('Tidak ada pickup atau delivery aktif hari ini.', 'No active pickup or delivery today.'), { dom: 'clt' }),
    sc('CHAT-001', L('Chat Tugas', 'Task Chat'), 'T03', 'lg.chat', 'NP-10', 'NV-10', 'message', L('Satu ruang chat per order: teks, foto, file, pin, lokasi, event sistem.', 'One chat room per order: text, photo, file, pin, location, system events.'), L('Belum ada chat tugas.', 'No task chat yet.')),
    sc('TIMELINE-001', L('Timeline Rute', 'Route Timeline'), 'T05', 'lg.timeline', 'NP-10', 'NV-10', 'history', L('Shift, trip, berangkat, tiba, pickup, delivery, masalah, kembali, selesai.', 'Shift, trip, depart, arrive, pickup, delivery, issue, return, complete.'), L('Belum ada perjalanan hari ini.', 'No trip today yet.')),
    sc('LOG-KPI-001', L('KPI Logistik', 'Logistics KPI'), 'T08', 'lg.kpi', 'NP-10', 'NV-10', 'gauge', L('12 KPI logistik otomatis per driver dan sambungan ke Personal Score.', '12 automatic logistics KPIs per driver and the link to the Personal Score.'), null, { lvl: 4 })
  ];
  M.screen = function (id) { return by(M.SCREENS, 'id', id); };
  M.PARENTS = {
    'ORDER-002': ['ORDER-001'], 'ORDER-003': ['ORDER-001', 'DISPATCH-001'], 'SCHEDULE-002': ['SCHEDULE-001'], 'ROUTE-002': ['ROUTE-001'], 'TRACK-002': ['TRACK-001'], 'MANIFEST-001': ['BAG-001', 'ARRIVAL-001'],
    'DRIVER-MOB-002': ['DRIVER-MOB-001'], 'DRIVER-MOB-003': ['DRIVER-MOB-001'], 'EVIDENCE-001': ['DRIVER-MOB-001', 'ORDER-003'], 'POD-001': ['DRIVER-MOB-001'], 'HANDOVER-001': ['ARRIVAL-001'], 'ISSUE-001': ['DRIVER-MOB-001', 'ISSUE-002']
  };
  // Phase 2 logistics routes open the Phase 7 screen (one logistics truth).
  M.ALIAS = { 'HOM-DRV-001': 'DRIVER-MOB-001', 'OPS-PKP-002': 'DRIVER-MOB-001', 'OPS-DLV-002': 'DRIVER-MOB-001', 'LOG-RTE-001': 'TIMELINE-001', 'LOG-FLT-001': 'TRACK-001', 'CLT-PKP-001': 'ORDER-002', 'CLT-DLV-001': 'TRACK-003' };
  function N(k, l, i, s, x) { return Object.assign({ k: k, l: l, i: i, s: s }, x || {}); }
  function G(k, l, i, sub) { return { k: k, l: l, i: i, sub: sub }; }
  var MENU = { k: 'menu', l: L('Menu', 'Menu'), i: 'menu' };
  var LOG_SPV = [N('dsp', L('Dispatch Board', 'Dispatch Board'), 'columns', 'DISPATCH-001'), N('map', L('Live Map', 'Live Map'), 'pin', 'TRACK-001'), N('ord', L('Order', 'Orders'), 'list', 'ORDER-001'), N('sch', L('Jadwal Rutin', 'Recurring Schedule'), 'calendar', 'SCHEDULE-001'),
    N('rte', L('Rute', 'Routes'), 'route', 'ROUTE-001'), N('drv', L('Driver', 'Drivers'), 'users', 'DRIVER-001'), N('veh', L('Kendaraan', 'Vehicles'), 'truck', 'VEHICLE-001'), N('iss', L('Masalah Logistik', 'Logistics Issues'), 'alert', 'ISSUE-002'),
    N('arr', L('Arrival Board', 'Arrival Board'), 'factory', 'ARRIVAL-001'), N('bag', L('Bag & Manifest', 'Bags & Manifests'), 'package', 'BAG-001'), N('chat', L('Chat Tugas', 'Task Chat'), 'message', 'CHAT-001'), N('tl', L('Timeline Rute', 'Route Timeline'), 'history', 'TIMELINE-001'), N('kpi', L('KPI Logistik', 'Logistics KPI'), 'gauge', 'LOG-KPI-001')];
  M.NAV = {
    driver: {
      nav: [N('home', L('Hari Ini', 'Today'), 'calendar', 'DRIVER-MOB-001', { also: ['DRIVER-MOB-002', 'DRIVER-MOB-003', 'EVIDENCE-001', 'POD-001'] }), N('route', L('Rute', 'Route'), 'route', 'TIMELINE-001'), N('chat', L('Chat', 'Chat'), 'message', 'CHAT-001'),
        N('issue', L('Masalah', 'Issue'), 'alert', 'ISSUE-001'), N('ho', L('Handover', 'Handover'), 'filecheck', 'HANDOVER-001'), N('history', L('Riwayat', 'History'), 'history', 'OPS-HIS-001')],
      mnav: [N('home', L('Hari Ini', 'Today'), 'calendar', 'DRIVER-MOB-001', { also: ['DRIVER-MOB-002', 'DRIVER-MOB-003', 'EVIDENCE-001', 'POD-001'] }), N('route', L('Rute', 'Route'), 'route', 'TIMELINE-001'), N('chat', L('Chat', 'Chat'), 'message', 'CHAT-001'), N('issue', L('Masalah', 'Issue'), 'alert', 'ISSUE-001'), MENU],
      landing: 'DRIVER-MOB-001'
    },
    supervisor: { add: [G('g-log', L('Logistik', 'Logistics'), 'truck', LOG_SPV.filter(function (n) { return n.k !== 'kpi'; }).concat([LOG_SPV[12]]))], mnavSwap: ['sla', N('dsp', L('Dispatch', 'Dispatch'), 'columns', 'DISPATCH-001')] },
    opsmgr: { replace: ['log', G('g-log', L('Logistik', 'Logistics'), 'truck', [LOG_SPV[12]].concat(LOG_SPV.slice(0, 12)))] },
    owner: { add: [G('g-log', L('Logistik', 'Logistics'), 'truck', [N('kpi', L('KPI Logistik', 'Logistics KPI'), 'gauge', 'LOG-KPI-001'), N('iss', L('Masalah Logistik', 'Logistics Issues'), 'alert', 'ISSUE-002'), N('map', L('Live Map', 'Live Map'), 'pin', 'TRACK-001'), N('ord', L('Order', 'Orders'), 'list', 'ORDER-001'), N('arr', L('Arrival Board', 'Arrival Board'), 'factory', 'ARRIVAL-001'), N('tl', L('Timeline Rute', 'Route Timeline'), 'history', 'TIMELINE-001')])] },
    operator: { insertAt: [1, N('arr', L('Arrival', 'Arrival'), 'factory', 'ARRIVAL-001', { also: ['HANDOVER-001', 'MANIFEST-001'] })] },
    sales: { add: [G('g-log', L('Pickup & Delivery', 'Pickup & Delivery'), 'truck', [N('ord', L('Order', 'Orders'), 'list', 'ORDER-001'), N('sch', L('Jadwal Rutin', 'Recurring Schedule'), 'calendar', 'SCHEDULE-001')])] },
    client: {
      swap: { pickup: N('pickup', L('Minta Pickup', 'Request Pickup'), 'truck', 'ORDER-002'), dlv: N('trk', L('Lacak Driver', 'Track Driver'), 'pin', 'TRACK-003') },
      insertAt: [2, N('lgo', L('Pickup & Delivery', 'Pickup & Delivery'), 'list', 'ORDER-001')],
      mnav: [N('home', L('Home', 'Home'), 'home', 'HOM-CLT-001'), N('pickup', L('Pickup', 'Pickup'), 'truck', 'ORDER-002'), N('trk', L('Lacak', 'Track'), 'pin', 'TRACK-003'), N('orders', L('Pesanan', 'Orders'), 'list', 'CLT-ORD-001'), MENU]
    }
  };
  /* install(): joins Phase 7 permissions, screens and menus to the shared config and access roles,
     and feeds the driver KPIs into the Phase 5 people data. Safe to call more than once. */
  M.install = function (C, X, P, CM2) {
    if (!C || C.__p7) return; C.__p7 = true;
    if (CM2) { CM = CM2; M.CM = CM2; }
    Object.keys(M.PERMS).forEach(function (k) { C.PERMS[k] = M.PERMS[k]; });
    function addP(list, extra) { extra.forEach(function (p) { if (list.indexOf(p) < 0) list.push(p); }); }
    Object.keys(M.ROLE_PERMS).forEach(function (r) {
      var role = C.ROLES[r], xr = X && X.ROLES[r];
      if (role) addP(role.perms, M.ROLE_PERMS[r]);
      if (xr && xr.perms) addP(xr.perms, M.ROLE_PERMS[r]);
    });
    Object.keys(M.NAV).forEach(function (r) {
      var cfg = M.NAV[r], role = C.ROLES[r]; if (!role) return;
      if (cfg.nav) role.nav = cfg.nav;
      if (cfg.mnav) role.mnav = cfg.mnav;
      if (cfg.replace) { var i = role.nav.map(function (n) { return n.k; }).indexOf(cfg.replace[0]); if (i >= 0) role.nav[i] = cfg.replace[1]; else role.nav.push(cfg.replace[1]); }
      if (cfg.swap) role.nav = role.nav.map(function (n) { return cfg.swap[n.k] || n; });
      if (cfg.insertAt) { role.nav.splice(cfg.insertAt[0], 0, cfg.insertAt[1]); if (role.mnav && !cfg.mnav) role.mnav.splice(Math.min(cfg.insertAt[0], role.mnav.length), 0, cfg.insertAt[1]); }
      if (cfg.add) role.nav = role.nav.concat(cfg.add);
      if (cfg.mnavSwap && role.mnav) role.mnav = role.mnav.map(function (n) { return n.k === cfg.mnavSwap[0] ? cfg.mnavSwap[1] : n; });
      if (cfg.landing && X && X.ROLES[r]) X.ROLES[r].landing = cfg.landing;
    });
    var orig = C.screen, extra = {};
    M.SCREENS.forEach(function (s) { extra[s.id] = s; });
    C.screen = function (id) { return extra[id] || orig(id); };
    C.SCREENS_P7 = M.SCREENS;
    if (P) M.perfFeed(P);
    if (X && X.notifsFor) M.joinNotifs(X);
  };
  /* Phase 4 header bell (§74–§75): logistics notifications join the same list, scoped by the same rules,
     with the CTA pointing at the screen the role uses for it. Read state is kept per user. */
  var NCAT = { critical: 'crit', vehicle: 'crit', bagdiff: 'crit', offline: 'crit', urgent: 'crit', delay: 'warn', routedelay: 'warn', slarisk: 'warn', resched: 'warn', routechange: 'warn' };
  M.notifCta = function (ctx, n) {
    if (isClient(ctx)) return ['near', 'arrived', 'tripstart', 'delay', 'assigned'].indexOf(n.kind) >= 0 ? { l: L('Lacak Driver', 'Track Driver'), s: 'TRACK-003' } : { l: L('Lihat Pickup & Delivery', 'View Pickups & Deliveries'), s: 'ORDER-001' };
    if (can(ctx, 'lg.drv.task')) return { l: L('Buka Tugas Hari Ini', 'Open Today\'s Tasks'), s: 'DRIVER-MOB-001' };
    if (['critical', 'vehicle', 'bagdiff'].indexOf(n.kind) >= 0) return { l: L('Buka Inbox Masalah', 'Open Issue Inbox'), s: 'ISSUE-002' };
    if (n.kind === 'offline') return { l: L('Buka Live Map', 'Open Live Map'), s: 'TRACK-001' };
    return { l: L('Buka Dispatch Board', 'Open Dispatch Board'), s: 'DISPATCH-001' };
  };
  M.joinNotifs = function (X) {
    if (X.__p7n) return; X.__p7n = true;
    var orig = X.notifsFor, origRead = X.markRead;
    function rk(ctx) { return ctx.uid || empId(ctx); }
    X.notifsFor = function (ctx) {
      var base = orig.call(X, ctx), now = M.now(), seen = (S().reads7 || {})[rk(ctx)] || [];
      var mine = M.notifs(ctx).filter(function (n) { return n.at.slice(0, 10) === M.TODAY; }).slice(0, 12).map(function (n) {
        var cta = M.notifCta(ctx, n), id = 'LG-' + n.id;
        return { id: id, cat: NCAT[n.kind] || 'ops', to: [], t: (M.NOTIF[n.kind] || [L(n.kind, n.kind)])[0], c: M.notifText(n), at: Date.now() - (now - ms(n.at)), read: seen.indexOf(id) >= 0, cta: X.canScreen && !X.canScreen(ctx, cta.s) ? null : cta, p7: true };
      });
      return base.concat(mine).sort(function (a, b) { return b.at - a.at; });
    };
    X.markRead = function (ctx, ids) {
      var all = ids === 'all' ? X.notifsFor(ctx).map(function (n) { return n.id; }) : ids || [];
      var r = S().reads7 = S().reads7 || {}, k = rk(ctx), list = r[k] = r[k] || [];
      all.forEach(function (id) { if (/^LG-/.test(id) && list.indexOf(id) < 0) list.push(id); });
      save();
      return origRead.call(X, ctx, all.filter(function (id) { return !/^LG-/.test(id); }));
    };
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = M;
  else root.JFLOG = M;
})(typeof window !== 'undefined' ? window : this);
