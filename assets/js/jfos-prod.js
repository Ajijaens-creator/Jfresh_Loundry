/* ==========================================================================
   JFRESH OS — Laundry Production engine (Phase 8 · NP 1.0)
   From arrival at the plant to Ready to Deliver: receiving & verification,
   weighing & counting with discrepancy, sorting with client pre-suggest,
   batch building with capacity validation, the four formal handovers
   (Logistics → Team 1 → Team 2 → Team 3 → Logistics), washing, drying,
   finishing, QC with rewash / reprocess that keeps its root cause, packing
   with labels and reconciliation, Ready to Deliver, full batch
   traceability, the production command center (live board, capacity,
   machines, bottlenecks, supervisor actions), production KPI and the
   Phase 5 Ambidex feed, the versioned daily checklist engine and
   preventive maintenance with work orders and downtime.

   Clients and properties come from Phase 6 (JFCOMM); manifests, drivers
   and delivery orders from Phase 7 (JFLOG). One engine for the app
   (app/screens-prod*.js), the Phase 8 pages (phase8/) and the automated
   tests (tools/test-prod.js). Every protected action checks the permission
   and the team scope first (§85) and writes an audit entry (§84).
   Prototype only: a production backend must repeat these rules on the
   server. No costing / HPP here (§52, §79).
   ========================================================================== */
(function (root) {
  function req(p) { try { return typeof require !== 'undefined' ? require(p) : null; } catch (e) { return null; } }
  var D = root.JFPROD_DATA || req('./jfos-prod-data.js');
  var LG = root.JFLOG || req('./jfos-logi.js');
  var CM = root.JFCOMM || (LG && LG.CM) || req('./jfos-comm.js');
  function L(a, b) { return [a, b === undefined ? a : b]; }
  var M = { version: 'NP 1.0', D: D };
  var MIN = 6e4, DAY = 864e5;
  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  function sum(a) { return a.reduce(function (s, x) { return s + (+x || 0); }, 0); }
  function r1(x) { return Math.round(x * 10) / 10; }
  function pct(a, b) { return b ? Math.round(a / b * 1000) / 10 : 0; }
  function by(arr, k, v) { for (var i = 0; i < arr.length; i++) if (arr[i][k] === v) return arr[i]; return null; }
  function T(x) { return Array.isArray(x) ? x[0] : (x == null ? '' : String(x)); }
  function ms(s) { if (typeof s === 'number') return s; var p = String(s).split(/[-: T]/); return Date.UTC(+p[0], +p[1] - 1, +p[2], +(p[3] || 0), +(p[4] || 0), +(p[5] || 0)); }
  function iso(t) { return new Date(t).toISOString().slice(0, 10); }
  function isoT(t) { return new Date(t).toISOString().slice(0, 16).replace('T', ' '); }
  function hm(t) { return new Date(t).toISOString().slice(11, 16); }
  function addDays(d, n) { return iso(ms(d) + n * DAY); }
  function dayDiff(a, b) { return Math.round((ms(b) - ms(a)) / DAY); }
  function str(x) { return String(x == null ? '' : x).trim(); }
  M.TODAY = D.today; M.ms = ms; M.iso = iso; M.isoT = isoT; M.hm = hm; M.addDays = addDays; M.dayDiff = dayDiff; M.r1 = r1;
  M.LG = LG; M.CM = CM; M.D = D;

  M.MSG = {
    noperm: L('Anda tidak memiliki izin untuk tindakan ini.', 'You do not have permission for this action.'),
    notfound: L('Data tidak ditemukan.', 'Record not found.'),
    invalid: L('Periksa data dan coba lagi.', 'Check the data and try again.'),
    reason: L('Alasan wajib diisi.', 'A reason is required.'),
    team: L('Ini bukan pekerjaan tim Anda.', 'This is not your team\'s work.'),
    jump: L('Langkah ini belum bisa dilakukan. Ikuti urutan proses.', 'This step is not possible yet. Follow the process order.'),
    mach: L('Mesin tidak tersedia. Pilih mesin lain.', 'The machine is not available. Choose another machine.'),
    mismatch: L('Jumlah berbeda. Pilih ADA SELISIH.', 'The count differs. Choose ADA SELISIH.'),
    review: L('Menunggu keputusan supervisor.', 'Waiting for the supervisor\'s decision.'),
    photo: L('Foto bukti wajib.', 'A photo is required.'),
    note: L('Catatan wajib diisi.', 'Notes are required.'),
    offline: L('Tidak ada koneksi.', 'No connection.'),
    retry: L('Coba Lagi.', 'Try Again.')
  };
  M.SAFETY = L('Lakukan perawatan ini hanya jika Anda berwenang dan sudah terlatih. Ikuti SOP keselamatan mesin.', 'Only perform this maintenance if you are authorized and trained. Follow the machine safety SOP.');

  /* ---------- Permissions (§85) ---------- */
  M.PERMS = {
    'prod.t1': L('Workspace Team 1: receiving, timbang, sorting, batch', 'Team 1 workspace: receiving, weighing, sorting, batch'),
    'prod.t2': L('Workspace Team 2: washing & drying', 'Team 2 workspace: washing & drying'),
    'prod.t3': L('Workspace Team 3: finishing, QC, rewash, packing', 'Team 3 workspace: finishing, QC, rewash, packing'),
    'prod.ho12': L('Handover Team 1 → Team 2', 'Handover Team 1 → Team 2'), 'prod.ho23': L('Handover Team 2 → Team 3', 'Handover Team 2 → Team 3'), 'prod.ho3l': L('Handover Team 3 → Logistics', 'Handover Team 3 → Logistics'),
    'prod.issue': L('Laporkan masalah produksi (ADA MASALAH)', 'Report production issues (ADA MASALAH)'), 'prod.issue.manage': L('Putuskan masalah produksi', 'Decide production issues'),
    'prod.cmd': L('Production Command Center & kapasitas', 'Production Command Center & capacity'), 'prod.spv': L('Tindakan supervisor & override terkontrol', 'Supervisor actions & controlled override'),
    'prod.mach': L('Status mesin live', 'Machine live status'), 'prod.kpi': L('KPI produksi & Ambidex', 'Production KPI & Ambidex'), 'prod.trace': L('Telusur batch', 'Batch traceability'),
    'prod.weight.override': L('Ubah berat manual (override timbangan)', 'Manual weight override'), 'prod.history': L('Riwayat kerja tim', 'Team work history'),
    'chk.view': L('Lihat checklist', 'View checklists'), 'chk.do': L('Kerjakan checklist', 'Do checklists'), 'chk.lead': L('Review team leader checklist', 'Team leader checklist review'),
    'chk.approve': L('Approve opening / closing', 'Approve opening / closing'), 'chk.master': L('Kelola master & template checklist', 'Manage checklist master & templates'),
    'mnt.view': L('Lihat maintenance mesin', 'View machine maintenance'), 'mnt.do': L('Kerjakan maintenance & perbaikan', 'Do maintenance & repairs'), 'mnt.manage': L('Jadwalkan maintenance & work order', 'Schedule maintenance & work orders'), 'mnt.verify': L('Verifikasi supervisor (siap pakai)', 'Supervisor verification (ready for service)')
  };
  var ALL8 = Object.keys(M.PERMS).filter(function (p) { return p !== 'mnt.do'; });
  var LG_T1 = ['lg.arrival', 'lg.handover', 'lg.manifest.view', 'lg.evidence.view', 'lg.issue.report'];
  M.ROLE_PERMS = {
    prod1: ['prod.t1', 'prod.ho12', 'prod.issue', 'prod.history', 'chk.view', 'chk.do', 'chk.lead'].concat(LG_T1),
    prod2: ['prod.t2', 'prod.ho12', 'prod.ho23', 'prod.issue', 'prod.mach', 'prod.history', 'chk.view', 'chk.do', 'chk.lead'],
    prod3: ['prod.t3', 'prod.ho23', 'prod.ho3l', 'prod.issue', 'prod.history', 'chk.view', 'chk.do', 'chk.lead'],
    maint: ['mnt.view', 'mnt.do', 'mnt.manage', 'prod.mach', 'prod.issue', 'chk.view', 'chk.do'],
    supervisor: ALL8, opsmgr: ALL8,
    owner: ['prod.cmd', 'prod.kpi', 'prod.trace', 'prod.mach', 'chk.view', 'mnt.view'],
    driver: ['prod.ho3l']
  };
  function can(ctx, p) { return !p || !!(ctx && ctx.perms && ctx.perms.indexOf(p) >= 0); }
  M.can = can;
  function empId(ctx) { return ctx && (ctx.employee ? ctx.employee.id : ctx.emp || ctx.uid) || 'system'; }
  M.empId = empId;
  // Team scope (§85): supervisors see the whole plant; frontline sees its own team.
  M.teamOf = function (ctx) {
    if (can(ctx, 'prod.spv')) return 'all';
    if (can(ctx, 'prod.t1')) return 't1'; if (can(ctx, 'prod.t2')) return 't2'; if (can(ctx, 'prod.t3')) return 't3';
    if (can(ctx, 'mnt.do')) return 'mnt'; if (can(ctx, 'prod.ho3l')) return 'log';
    return null;
  };

  /* ---------- Labels ---------- */
  M.TEAMS = D.TEAMS; M.CATS = D.CATS; M.FLAGS = D.FLAGS; M.ITEMS = D.ITEMS; M.UNITS = D.UNITS; M.WASH_PROGS = D.WASH_PROGS; M.DRY_PROGS = D.DRY_PROGS; M.DRY_METHODS = D.DRY_METHODS; M.FIN_METHODS = D.FIN_METHODS; M.MACH_TYPES = D.MACH_TYPES; M.FREQ = D.FREQ;
  M.SRC = { manifest: [L('Manifest Pickup', 'Pickup Manifest'), 'truck'], drop: [L('Antar Klien', 'Client Drop'), 'user'], transfer: [L('Transfer Internal', 'Internal Transfer'), 'swap'], walkin: [L('Walk-in', 'Walk-in'), 'basket'] };
  M.RCV_ST = { waiting: [L('Menunggu', 'Waiting'), 'mute'], receiving: [L('Sedang Receiving', 'Receiving'), 'info'], verified: [L('Sesuai', 'Verified'), 'ok'], difference: [L('Ada Selisih', 'Difference'), 'crit'], received: [L('Diterima', 'Received'), 'ok'] };
  M.COND = { good: [L('Baik', 'Good'), 'ok'], wet: [L('Basah', 'Wet'), 'warn'], stained: [L('Noda berat', 'Heavy stains'), 'warn'], damaged: [L('Kemasan rusak', 'Damaged package'), 'crit'], contam: [L('Terkontaminasi', 'Contaminated'), 'crit'] };
  M.DIS_REASONS = { extra: L('Bag lebih', 'Extra Bag'), missing: L('Bag kurang', 'Missing Bag'), weight: L('Selisih berat', 'Weight Difference'), category: L('Kategori salah', 'Wrong Category'), damaged: L('Kemasan rusak', 'Damaged Package'), estimate: L('Estimasi klien berbeda', 'Client Estimate Difference'), other: L('Lainnya', 'Other') };
  M.PRI = { normal: [L('Normal', 'Normal'), 'mute', 1], important: [L('Penting', 'Important'), 'info', 2], express: [L('Express', 'Express'), 'appr', 3], urgent: [L('Urgent', 'Urgent'), 'crit', 4], superexpress: [L('Super Express', 'Super Express'), 'crit', 5] };
  M.priRank = function (p) { return (M.PRI[p] || M.PRI.normal)[2]; };
  M.STAGE = {
    ready: [L('Siap Produksi', 'Ready for Production'), 'info', 't1'], ho12: [L('Handover ke Team 2', 'Handover to Team 2'), 'appr', 't1'],
    wash_q: [L('Siap Cuci', 'Ready to Wash'), 'info', 't2'], washing: [L('Sedang Dicuci', 'Washing'), 'info', 't2'], dry_q: [L('Menunggu Dryer', 'Waiting for Dryer'), 'info', 't2'], drying: [L('Sedang Dikeringkan', 'Drying'), 'info', 't2'],
    fin_ready: [L('Siap Finalisasi', 'Ready for Finalization'), 'ok', 't2'], ho23: [L('Handover ke Team 3', 'Handover to Team 3'), 'appr', 't2'],
    fin_q: [L('Menunggu Finishing', 'Waiting for Finishing'), 'info', 't3'], finishing: [L('Sedang Finishing', 'Finishing'), 'info', 't3'], qc_q: [L('Menunggu QC', 'Waiting for QC'), 'info', 't3'],
    pack_q: [L('Menunggu Packing', 'Waiting for Packing'), 'info', 't3'], packed: [L('Packing Selesai', 'Packed'), 'ok', 't3'], rtd: [L('Siap Kirim', 'Ready to Deliver'), 'ok', 't3'], ho3l: [L('Handover ke Logistics', 'Handover to Logistics'), 'appr', 't3'],
    handed: [L('Diterima Logistics', 'With Logistics'), 'ok', 'log'], merged: [L('Digabung ke batch asal', 'Merged into the original batch'), 'mute', 't3'], hold: [L('Ditahan', 'On Hold'), 'crit', 'spv']
  };
  M.FLOW = ['ready', 'ho12', 'wash_q', 'washing', 'dry_q', 'drying', 'fin_ready', 'ho23', 'fin_q', 'finishing', 'qc_q', 'pack_q', 'packed', 'rtd', 'ho3l', 'handed'];
  M.stageIdx = function (st) { return M.FLOW.indexOf(st); };
  M.HO_KIND = {
    log1: { from: 'log', to: 't1', n: L('Logistics → Team 1', 'Logistics → Team 1'), no: 1 }, t1t2: { from: 't1', to: 't2', n: L('Team 1 → Team 2', 'Team 1 → Team 2'), no: 2, perm: 'prod.ho12', send: 'ready', wait: 'ho12', next: 'wash_q' },
    t2t3: { from: 't2', to: 't3', n: L('Team 2 → Team 3', 'Team 2 → Team 3'), no: 3, perm: 'prod.ho23', send: 'fin_ready', wait: 'ho23', next: 'fin_q' }, t3log: { from: 't3', to: 'log', n: L('Team 3 → Logistics', 'Team 3 → Logistics'), no: 4, perm: 'prod.ho3l', send: 'rtd', wait: 'ho3l', next: 'handed' }
  };
  M.HO_ST = { waiting: [L('Menunggu', 'Waiting'), 'appr'], accepted: [L('Diterima', 'Accepted'), 'ok'], difference: [L('Ada Selisih', 'Difference'), 'crit'], returned: [L('Dikembalikan', 'Returned'), 'warn'], resolved: [L('Selesai', 'Resolved'), 'ok'] };
  M.MACH_ST = { normal: [L('Tersedia', 'Available'), 'ok'], running: [L('Berjalan', 'Running'), 'info'], idle: [L('Idle', 'Idle'), 'mute'], maintenance: [L('Maintenance', 'Maintenance'), 'warn'], repair: [L('Perbaikan', 'Repair'), 'crit'], error: [L('Error', 'Error'), 'crit'], offline: [L('Offline', 'Offline'), 'mute'] };
  M.SEV = { low: [L('Rendah', 'Low'), 'info'], med: [L('Sedang', 'Medium'), 'warn'], high: [L('Tinggi', 'High'), 'crit'], crit: [L('Kritis', 'Critical'), 'crit'] };
  // Issue reasons per stage (§22, §25, §31) and the production issue master (§80).
  M.REASONS = {
    wash: { mstop: L('Mesin berhenti', 'Machine Stop'), wprog: L('Program salah', 'Wrong Program'), chem: L('Masalah chemical', 'Chemical Problem'), water: L('Masalah air', 'Water Issue'), power: L('Masalah listrik', 'Electricity Issue'), overload: L('Kelebihan muatan', 'Overload'), foreign: L('Benda asing', 'Foreign Object'), other: L('Lainnya', 'Other') },
    dry: { mach: L('Masalah mesin', 'Machine Issue'), over: L('Terlalu kering', 'Over Dry'), under: L('Kurang kering', 'Under Dry'), temp: L('Masalah suhu', 'Temperature Issue'), fabric: L('Masalah kain', 'Fabric Issue'), delay: L('Terlambat', 'Delay'), other: L('Lainnya', 'Other') },
    fin: { stain: L('Ada noda', 'Stain Found'), wrinkle: L('Kusut', 'Wrinkle'), damage: L('Rusak', 'Damage'), count: L('Jumlah salah', 'Wrong Count'), missing: L('Item hilang', 'Missing Item'), std: L('Standar finishing tidak tercapai', 'Finishing Standard Not Met'), other: L('Lainnya', 'Other') },
    master: { breakdown: L('Mesin rusak', 'Machine Breakdown'), chemical: L('Chemical kurang', 'Chemical Shortage'), water: L('Masalah air', 'Water Issue'), power: L('Masalah listrik', 'Power Issue'), wbatch: L('Batch salah', 'Wrong Batch'), wprog: L('Program salah', 'Wrong Program'), stain: L('Noda', 'Stain'), damage: L('Rusak', 'Damage'), contam: L('Kontaminasi', 'Contamination'), missing: L('Item hilang', 'Missing Item'), count: L('Jumlah salah', 'Wrong Count'), overload: L('Kapasitas berlebih', 'Capacity Overload'), staff: L('Kurang staf', 'Staff Shortage'), other: L('Lainnya', 'Other') }
  };
  M.MACH_REASONS = ['mstop', 'power', 'water', 'mach', 'temp', 'breakdown'];
  M.ISSUE_ACT = { continue: [L('Lanjut', 'Continue'), 'play'], hold: [L('Tahan', 'Hold'), 'pause'], reprocess: [L('Proses Ulang', 'Reprocess'), 'refresh'], review: [L('Review Supervisor', 'Supervisor Review'), 'user'], maint: [L('Maintenance', 'Maintenance'), 'wrench'], escalate: [L('Eskalasi', 'Escalate'), 'arrowup'] };
  M.ISSUE_ST = { open: [L('Terbuka', 'Open'), 'crit'], review: [L('Review', 'Review'), 'appr'], resolved: [L('Selesai', 'Resolved'), 'ok'] };
  M.QC_CHECKS = { clean: L('Bersih', 'Cleanliness'), stain: L('Tanpa noda', 'Stain'), smell: L('Tidak bau', 'Smell'), damage: L('Tidak rusak', 'Damage'), dry: L('Kering', 'Dryness'), iron: L('Setrika rapi', 'Ironing'), fold: L('Lipatan rapi', 'Folding'), count: L('Jumlah benar', 'Count'), pack: L('Siap dikemas', 'Packaging Readiness') };
  M.QC_FAIL = { noda: L('Noda', 'Stain'), bau: L('Bau', 'Smell'), rusak: L('Rusak', 'Damaged'), kering: L('Belum Kering', 'Not Dry'), finishing: L('Finishing Tidak Sesuai', 'Finishing Not Met'), hitung: L('Salah Hitung', 'Wrong Count'), kontaminasi: L('Kontaminasi', 'Contamination'), other: L('Lainnya', 'Other') };
  M.QC_ACT = { rewash: [L('Rewash', 'Rewash'), 'refresh'], refinish: [L('Refinish', 'Refinish'), 'iron'], review: [L('Review Supervisor', 'Supervisor Review'), 'user'], claim: [L('Klaim / Kerusakan', 'Claim / Damage'), 'file'] };
  // Responsible stage per QC fail reason (§35: connect QC failure to root process).
  M.QC_RESP = { noda: 'wash', bau: 'wash', kontaminasi: 'wash', kering: 'dry', finishing: 'fin', hitung: 'fin', rusak: 'claim', other: 'review' };
  M.RESP = { wash: L('Washing', 'Washing'), dry: L('Drying', 'Drying'), fin: L('Finishing', 'Finishing'), claim: L('Klaim kerusakan', 'Damage claim'), review: L('Review supervisor', 'Supervisor review'), rcv: L('Receiving / Sorting', 'Receiving / Sorting') };
  M.RW_ST = { open: [L('Sedang diproses ulang', 'Reprocessing'), 'appr'], closed: [L('Selesai', 'Closed'), 'ok'], claim: [L('Klaim menunggu keputusan', 'Claim pending'), 'crit'], claimok: [L('Klaim disetujui', 'Claim approved'), 'mute'], review: [L('Review supervisor', 'Supervisor review'), 'appr'] };
  M.LABELS = { std: L('Label standar', 'Standard label'), qr: L('Label + QR', 'Label + QR'), bar: L('Label + barcode', 'Label + barcode') };
  M.BOARD = { rcv: L('Receiving', 'Receiving'), sort: L('Sorting', 'Sorting'), wash: L('Washing', 'Washing'), dry: L('Drying', 'Drying'), fin: L('Finishing', 'Finishing'), qc: L('QC', 'QC'), pack: L('Packing', 'Packing'), rtd: L('Siap Kirim', 'Ready Delivery') };
  M.CHK_TYPES = { opening: L('Opening', 'Opening'), closing: L('Closing', 'Closing'), shift: L('Per Shift', 'Per Shift'), daily: L('Harian', 'Daily'), weekly: L('Mingguan', 'Weekly'), monthly: L('Bulanan', 'Monthly'), custom: L('Khusus', 'Custom') };
  M.CHK_TABS = { opening: L('Opening', 'Opening'), t1: L('Team 1', 'Team 1'), t2: L('Team 2', 'Team 2'), t3: L('Team 3', 'Team 3'), log: L('Logistics', 'Logistics'), closing: L('Closing', 'Closing') };
  M.CHK_INPUT = { check: L('Centang', 'Checkbox'), num: L('Angka', 'Numeric'), text: L('Teks', 'Text'), select: L('Pilihan', 'Select Option'), photo_opt: L('Foto opsional', 'Photo Optional'), photo_req: L('Foto wajib', 'Photo Required'), notes_req: L('Catatan wajib', 'Notes Required'), approval: L('Perlu persetujuan', 'Approval Required') };
  M.CHK_CAT = { equip: L('Peralatan', 'Equipment'), stock: L('Stok', 'Stock'), hk: L('Kebersihan', 'Housekeeping'), safety: L('Keselamatan', 'Safety'), ops: L('Operasional', 'Operations'), signoff: L('Persetujuan', 'Sign-off') };
  M.CHK_AREA = { util: L('Utilitas', 'Utilities'), rcv: L('Receiving', 'Receiving'), sort: L('Sorting', 'Sorting'), wash: L('Washing', 'Washing'), dry: L('Drying', 'Drying'), fin: L('Finishing', 'Finishing'), qc: L('QC', 'QC'), pack: L('Packing', 'Packing'), log: L('Logistics', 'Logistics'), all: L('Semua area', 'All areas') };
  M.CHK_PIC = { op: L('Operator', 'Operator'), lead: L('Team Leader', 'Team Leader'), spv: L('Supervisor', 'Supervisor') };
  M.CHK_ST = { open: [L('Berjalan', 'In progress'), 'info'], submitted: [L('Menunggu Team Leader', 'Waiting for Team Leader'), 'appr'], lead_ok: [L('Menunggu Supervisor', 'Waiting for Supervisor'), 'appr'], approved: [L('Disetujui', 'Approved'), 'ok'], done: [L('Selesai', 'Completed'), 'ok'], returned: [L('Dikembalikan', 'Returned'), 'warn'] };
  M.CHK_FOLLOW = { maint: [L('Buat tugas maintenance', 'Create maintenance task'), 'wrench'], followup: [L('Follow-up operasional', 'Operational follow-up'), 'clipboard'], review: [L('Review supervisor', 'Supervisor review'), 'user'] };
  M.WO_ST = { open: [L('Masalah Ditemukan', 'Issue Found'), 'crit'], assigned: [L('Work Order', 'Work Order'), 'appr'], repair: [L('Perbaikan', 'Repair'), 'warn'], test: [L('Tes', 'Test'), 'info'], verify: [L('Verifikasi Supervisor', 'Supervisor Verification'), 'appr'], ready: [L('Siap Dipakai', 'Ready for Service'), 'ok'] };
  M.WO_FLOW = ['open', 'assigned', 'repair', 'test', 'verify', 'ready'];
  M.TASK_ST = { scheduled: [L('Terjadwal', 'Scheduled'), 'mute'], duesoon: [L('Segera', 'Due Soon'), 'info'], duetoday: [L('Hari Ini', 'Due Today'), 'appr'], overdue: [L('Terlambat', 'Overdue'), 'crit'], inprogress: [L('Dikerjakan', 'In Progress'), 'info'], completed: [L('Selesai', 'Completed'), 'ok'], issue: [L('Ada Masalah', 'Issue Found'), 'crit'] };
  M.REM = { h7: L('H-7', 'D-7'), h3: L('H-3', 'D-3'), h1: L('H-1', 'D-1'), today: L('Hari Ini', 'Due Today'), overdue: L('Terlambat', 'Overdue') };

  /* ---------- State ---------- */
  var KEY = 'jfos-prod-v1', mem = {}, st = null, T0 = Date.now(), SIM = ms(D.simNow);
  var clock = function () { return SIM + (Date.now() - T0); };
  var ls = null;
  try { ls = root.localStorage || null; if (ls) { ls.setItem('__jfp', '1'); ls.removeItem('__jfp'); } } catch (e) { ls = null; }
  function S() {
    if (st) return st;
    try { var raw = ls ? ls.getItem(KEY) : mem[KEY]; if (raw) { var o = JSON.parse(raw); if (o && o.v === 1) { st = o; if (o.simAt) { SIM = o.simAt; T0 = Date.now(); } return st; } } } catch (e) {}
    st = seed(); save(); return st;
  }
  function save() { if (!st) return; st.simAt = clock(); st.upd = clock(); try { var s = JSON.stringify(st); if (ls) ls.setItem(KEY, s); else mem[KEY] = s; } catch (e) {} }
  M._reset = function () { SIM = ms(D.simNow); T0 = Date.now(); st = seed(); save(); };
  M._setClock = function (fn) { clock = fn; };
  M.now = function () { S(); return clock(); };
  M.state = function () { return S(); };
  M.cfg = function () { return S().cfg; };
  function nowS() { return isoT(M.now()); }
  function nid(k, pre, pad) { var n = S().seq[k]++; return pre + (pad ? String(n).padStart(pad, '0') : n); }

  function seed() {
    var s = {
      v: 1, mach: clone(D.MACHINES), rcv: clone(D.RCV), lots: [], batches: clone(D.BATCHES), ho: [], rework: clone(D.REWORK), issues: clone(D.ISSUES), wo: clone(D.WORK_ORDERS), dt: clone(D.DOWNTIME),
      tpl: clone(D.TEMPLATES), chk: [], plans: [], tasks: [], mhist: [], audit: [], notes: [], moves: {}, upd: null,
      seq: { rcv: 14, lot: 1, b: 13, ho: 1, rw: 2, pi: 4, wo: 2, dt: 3, mt: 1, chk: 1, pkg: 1 },
      cfg: {
        bagReview: 2, kgWarn: 5, kgReview: 10, missingReview: true, disPhoto: true, disNote: true, sortTol: 1, under: 50, maxOver: 110,
        capWarn: 85, capCrit: 100, growth: 20, riskBuf: 15, dispatchBuf: 30, finKgH: 60, qcMin: 10, packMin: 15, hoMin: 10,
        capH: { rcv: 150, sort: 120, fin: 52.5, qc: 150, pack: 100 }, tat: { normal: 1440, important: 1440, express: 720, urgent: 480, superexpress: 360 },
        qcPhoto: true, soon: 7, rem: [7, 3, 1], scale: true
      }
    };
    var now = ms(D.simNow);
    // Batches: events, runs, machine links, SLA.
    s.batches.forEach(function (b) {
      b.ev = [['created', b.created[0], b.created[1]]]; b.lots = []; b.changes = 0; b.ovr = null; b.hold = null; b.esc = null; b.assignee = null; b.kg0 = b.kg; b.pcs0 = b.pcs;
      b.runs = b.runs.map(function (r) { return { k: r[0], mach: r[1], prog: r[2], start: r[3], end: r[4], op: r[5] }; });
      b.run = b.runs.filter(function (r) { return !r.end; })[0] || null;
      b.runs.forEach(function (r) { b.ev.push([r.k + '.start', r.start, r.op]); if (r.end) b.ev.push([r.k + '.end', r.end, r.op]); });
      if (b.run) { var m = by(s.mach, 'id', b.run.mach); if (m) { m.st = 'running'; m.batch = b.id; m.since = b.run.start; } }
      if (b.runs.some(function (r) { return r.k === 'fin' && r.end; })) b.finQty = b.pcs;
      if (b.qc) b.ev.push(['qc', b.qc.at, b.qc.by]);
      if (b.pack) { b.pack.pkgs = b.pack.pkgs.map(function (p, i) { return { id: 'PKG-' + b.id.slice(2) + '-' + String(i + 1).padStart(2, '0'), n: i + 1, qty: p[0], kg: p[1] }; }); b.ev.push(['packed', b.pack.at, b.pack.by]); }
      if (b.rtdAt) b.ev.push(['rtd', b.rtdAt[0], b.rtdAt[1]]);
      var r0 = by(s.rcv, 'id', b.rcvs[0]); b.ords = r0 && r0.ord ? [r0.ord] : [];
      if (r0 && r0.pri && M.priRank(r0.pri) > M.priRank(b.pri)) b.pri = r0.pri;
      b.sla = slaOf(b, r0, s);
    });
    // Handovers derived from history; waiting ones from the data.
    function ho(kind, b, at, sender, rcvBy, recAt, x) {
      var k = M.HO_KIND[kind], h = Object.assign({ id: 'HO-2610-' + String(s.seq.ho++).padStart(3, '0'), kind: kind, from: k.from, to: k.to, batch: b ? b.id : null, rcv: null, mf: null, ord: b ? (b.ords[0] || b.dlv || null) : null, cl: b ? b.cl : null, prop: b ? b.prop : null,
        kg: b ? b.kg : null, qty: b ? b.pcs : null, bags: null, cat: b ? b.cat : null, cond: 'good', sender: sender, at: at, receiver: rcvBy || null, recAt: recAt || null, ev: [], diff: null, st: rcvBy ? 'accepted' : 'waiting', sla: b ? b.sla : null, pri: b ? b.pri : 'normal', note: '' }, x || {});
      s.ho.push(h); return h;
    }
    s.rcv.forEach(function (r) {
      if (r.src !== 'manifest' || !r.rcvAt && r.st !== 'difference') return;
      if (r.st === 'difference') ho('log1', null, r.arrAt, r.drv, null, null, { rcv: r.id, mf: r.mf, ord: r.ord, cl: r.cl, prop: r.prop, kg: r.estKg, bags: r.act.bags, st: 'difference', receiver: r.startBy, recAt: r.dis.at, diff: { bags: r.act.bags - r.bags, reason: 'missing', note: r.dis.note } });
      else ho('log1', null, r.arrAt, r.drv, r.rcvBy, r.rcvAt, { rcv: r.id, mf: r.mf, ord: r.ord, cl: r.cl, prop: r.prop, kg: r.estKg, bags: r.act.bags });
    });
    s.batches.forEach(function (b) {
      var i = M.stageIdx(b.stage), w = D.HO_WAIT[b.id], wash = b.runs.filter(function (r) { return r.k === 'wash'; })[0], dry = b.runs.filter(function (r) { return r.k === 'dry'; })[0];
      if (b.parent) return;
      if (i > M.stageIdx('ho12')) { var a1 = wash ? ms(wash.start) - 12 * MIN : ms(b.created[0]) + 10 * MIN; ho('t1t2', b, isoT(a1), b.created[1], 'EMP-071', isoT(a1 + 3 * MIN)); b.ev.push(['ho.t1t2', isoT(a1 + 3 * MIN), 'EMP-071']); }
      if (i > M.stageIdx('ho23') && dry && dry.end) { var a2 = ms(dry.end) + 4 * MIN; ho('t2t3', b, isoT(a2), dry.op, 'EMP-077', isoT(a2 + 5 * MIN)); b.ev.push(['ho.t2t3', isoT(a2 + 5 * MIN), 'EMP-077']); }
      if (w) { var h = ho(w[0], b, w[1], w[2]); if (w[0] === 't3log') h.bags = b.pack.pkgs.length; }
    });
    s.batches.forEach(function (b) { b.ev.sort(function (x, y) { return ms(x[1]) - ms(y[1]); }); });
    // Checklist instances for yesterday (complete) and today (from the data).
    [D.yday, D.today].forEach(function (d) { genChecklists(s, d); });
    var y = s.chk.filter(function (c) { return c.date === D.yday; });
    y.forEach(function (c) {
      var t = by(s.tpl, 'id', c.tpl);
      c.items.forEach(function (it, i) { var def = itemDef(s, c, it.code); it.st = 'done'; it.by = (D.TEAMS[c.tab] || D.TEAMS.t1).lead || 'EMP-101'; it.at = c.date + ' ' + hm(ms(c.date + ' ' + c.win[0]) + (i + 1) * 4 * MIN); it.val = def.type === 'num' ? r1((def.min + def.max) / 2) : def.type === 'select' ? def.opts[0][0] : def.type === 'photo_req' ? 'seed:pod' : def.type === 'notes_req' ? T(L('Shift lancar.', 'Smooth shift.')) : true; });
      c.st = t.approve ? 'approved' : 'done'; c.log = [['submitted', c.date + ' ' + c.win[1], 'EMP-101']]; if (t.approve) c.log.push(['approved', c.date + ' ' + c.win[1], 'EMP-021']);
    });
    Object.keys(D.CHK_TODAY).forEach(function (tid) {
      var c = s.chk.filter(function (x) { return x.date === D.today && x.tpl === tid; })[0], d = D.CHK_TODAY[tid]; if (!c) return;
      d.items.forEach(function (x) { var it = by(c.items, 'code', x[0]); if (!it) return; it.st = x[1]; it.val = /^seed:/.test(x[2]) ? null : x[2]; it.photo = /^seed:/.test(x[2]) ? x[2] : null; it.by = x[3]; it.at = D.today + ' ' + x[4]; it.note = x[5] ? T(x[5]) : ''; it.issue = x[6] || null; });
      if (d.st) { c.st = d.st; c.log = []; if (d.sub) c.log.push(['submitted', D.today + ' ' + d.sub[0], d.sub[1]]); if (d.lead) c.log.push(['lead_ok', D.today + ' ' + d.lead[0], d.lead[1]]); }
    });
    // Maintenance plans from the machine SOPs, the current task of each plan and recent history.
    s.mach.forEach(function (m) {
      var sops = D.SOP[m.type] || [], freqs = {};
      sops.forEach(function (x) { (freqs[x.freq] = freqs[x.freq] || []).push(x); });
      Object.keys(freqs).forEach(function (f) {
        var key = m.id + '|' + f, every = D.FREQ[f][1], off = D.PM_DUE[key] != null ? D.PM_DUE[key] : every, next = addDays(D.today, off);
        var pic = f === 'daily' ? ({ washer: 'EMP-074', dryer: 'EMP-075', iron: 'EMP-077', ironer: 'EMP-077', fold: 'EMP-078' }[m.type] || 'EMP-102') : 'EMP-102';
        var p = { id: 'PM-' + m.id + '-' + f, mach: m.id, freq: f, every: every, items: freqs[f].map(function (x) { return x.code; }), n: L('PM ' + T(D.FREQ[f][0]) + ' ' + m.id, D.FREQ[f][0][1] + ' PM ' + m.id), pic: pic, next: next, last: addDays(next, -every), danger: freqs[f].some(function (x) { return x.danger; }), rem: null, active: true };
        s.plans.push(p);
        for (var d = p.last, k = 0; dayDiff(d, D.today) <= 60 && k < (f === 'daily' ? 3 : 8); d = addDays(d, -every), k++) {
          s.mhist.push({ id: 'MH-' + p.id + '-' + d, plan: p.id, mach: m.id, freq: f, date: d, by: pic, at: d + ' ' + (f === 'daily' ? '07:00' : '10:00'), result: 'ok', items: p.items.map(function (c) { return { code: c, ok: true }; }), parts: '', notes: '' });
        }
        var t = mkTask(s, p);
        var dn = D.PM_TODAY.done[key], rn = D.PM_TODAY.running[key];
        if (dn) { t.date = D.today; t.st = 'completed'; t.by = dn[1]; t.at = D.today + ' ' + dn[0]; t.result = 'ok'; t.items.forEach(function (it) { it.ok = true; }); s.mhist.push(histOf(t)); p.last = D.today; p.next = addDays(D.today, every); mkTask(s, p); }
        if (rn) { t.st = 'inprogress'; t.start = D.today + ' ' + rn[0]; t.by = rn[1]; t.items.slice(0, 4).forEach(function (it) { it.ok = true; }); }
      });
    });
    D.PM_USAGE.forEach(function (u) {
      var m = by(s.mach, 'id', u.mach), left = u.at + u.every - (u.freq === 'hours' ? m.hours : m.cycles), perDay = u.freq === 'hours' ? 12 : 20;
      var p = { id: u.id, mach: u.mach, freq: u.freq, every: u.every, at: u.at, items: [], custom: u.n, n: u.n, pic: 'EMP-102', next: addDays(D.today, Math.max(0, Math.round(left / perDay))), last: null, danger: !!u.danger, left: left, active: true };
      s.plans.push(p); mkTask(s, p);
    });
    s.mhist.sort(function (a, b) { return ms(b.at) - ms(a.at); });
    return s;
  }
  function slaOf(b, r0, s) {
    var o = b.dlv && LG && LG.order ? LG.order(b.dlv) : null;
    if (o) return isoT(ms(o.date + ' ' + o.win[0]) - ((s && s.cfg) || S().cfg).dispatchBuf * MIN);
    var cfg = (s && s.cfg) || S().cfg, base = r0 && (r0.rcvAt || r0.arrAt) || b.created[0];
    return isoT(ms(base) + (cfg.tat[b.pri] || cfg.tat.normal) * MIN);
  }
  function mkTask(s, p) {
    var m = by(s.mach, 'id', p.mach), sops = D.SOP[m.type] || [];
    var t = { id: 'MT-2610-' + String(s.seq.mt++).padStart(3, '0'), plan: p.id, mach: p.mach, freq: p.freq, date: p.next, pic: p.pic, items: p.items.length ? p.items.map(function (c) { return { code: c, ok: null, note: '', val: null }; }) : [{ code: 'U1', ok: null, note: '', val: null }], parts: '', notes: '', photo: null, result: null, st: 'scheduled', by: null, at: null, start: null, wo: null };
    s.tasks.push(t); return t;
  }
  function histOf(t) { return Object.freeze ? JSON.parse(JSON.stringify({ id: 'MH-' + t.id, plan: t.plan, mach: t.mach, freq: t.freq, date: t.date, by: t.by, at: t.at, result: t.result, items: t.items, parts: t.parts, notes: t.notes, photo: t.photo, task: t.id, wo: t.wo })) : null; }

  /* ---------- Audit (§84) ---------- */
  M.audit = function (ev, ctx, o) {
    o = o || {};
    var e = { at: nowS(), ev: ev, by: empId(ctx), role: ctx && ctx.roleKey || null, rec: o.rec || null, batch: o.batch || null, from: o.from == null ? null : o.from, to: o.to == null ? null : o.to, reason: o.reason || null, note: o.note || null };
    S().audit.unshift(e); return e;
  };
  M.auditLog = function (f) { f = f || {}; return S().audit.filter(function (e) { return (!f.batch || e.batch === f.batch || e.rec === f.batch) && (!f.ev || e.ev.indexOf(f.ev) === 0) && (!f.rec || e.rec === f.rec); }); };
  function deny(ctx, what) { M.audit('ACCESS.DENIED', ctx, { rec: what }); return { ok: false, code: 'noperm', msg: M.MSG.noperm }; }
  function bad(msg, code, x) { return Object.assign({ ok: false, code: code || 'invalid', msg: msg || M.MSG.invalid }, x || {}); }

  /* ---------- Lookups ---------- */
  M.rcv = function (id) { return by(S().rcv, 'id', id); };
  M.batch = function (id) { return by(S().batches, 'id', id); };
  M.lot = function (id) { return by(S().lots, 'id', id); };
  M.machine = function (id) { return by(S().mach, 'id', id); };
  M.ho = function (id) { return by(S().ho, 'id', id); };
  M.rw = function (id) { return by(S().rework, 'id', id); };
  M.issue = function (id) { return by(S().issues, 'id', id); };
  M.wo = function (id) { return by(S().wo, 'id', id); };
  M.tpl = function (id) { return by(S().tpl, 'id', id); };
  M.chkInst = function (id) { return by(S().chk, 'id', id); };
  M.plan = function (id) { return by(S().plans, 'id', id); };
  M.task = function (id) { return by(S().tasks, 'id', id); };
  M.prop = function (id) { return CM && CM.prop ? CM.prop(id) : null; };
  M.propName = function (id) { var p = M.prop(id); return p ? p.n : id || '—'; };
  M.clientName = function (id) { var c = CM && CM.client ? CM.client(id) : null; return c ? c.n : id || '—'; };
  M.empName = function (id) {
    if (!id) return '—'; if (id === 'system') return T(L('Sistem', 'System'));
    if (D.STAFF[id]) return D.STAFF[id].n;
    if (LG && LG.empName) { var n = LG.empName(id); if (n && n !== id) return n; }
    return CM && CM.empName ? CM.empName(id) : id;
  };
  M.first = function (id) { return String(M.empName(id)).split(' ')[0]; };
  M.order = function (id) { return id && LG && LG.order ? LG.order(id) : null; };
  M.recordOf = function (rec) {
    if (!rec) return null;
    var b = M.batch(rec) || M.rcv(rec); if (b) return { cl: b.cl, plant: 'PL-01' };
    return null;
  };
  M.teamMembers = function (team) { var t = D.TEAMS[team]; if (!t) return []; var mv = S().moves, list = t.members.filter(function (e) { return !mv[e] || mv[e] === team; }); Object.keys(mv).forEach(function (e) { if (mv[e] === team && list.indexOf(e) < 0) list.push(e); }); return list; };
  M.onShift = function (team) { return M.teamMembers(team).filter(function (e) { return !(D.STAFF[e] && D.STAFF[e].absent); }); };
  function opOf(ctx, f, team) { var op = f && f.op; if (op && (team === 'all' || M.teamMembers(team).indexOf(op) >= 0 || D.STAFF[op])) return op; return empId(ctx); }
  function inTeam(ctx, team) { var t = M.teamOf(ctx); return t === 'all' || t === team; }

  /* ---------- Clock helpers ---------- */
  function progMin(b, k) { if (k === 'wash') { var p = D.WASH_PROGS[b.prog] || D.WASH_PROGS[(D.CATS[b.cat] || {}).wash]; return p ? p.min : 45; } if (k === 'dry') { var c = D.CATS[b.cat] || {}, dp = D.DRY_PROGS[b.dprog || c.dry]; return dp ? dp.min : ({ air: 120, hang: 180, special: 90 }[b.dmethod || c.dry] || 40); } return 0; }
  M.runEnd = function (b) {
    var r = b.run; if (!r) return null;
    if (r.k === 'wash') return ms(r.start) + (D.WASH_PROGS[r.prog] ? D.WASH_PROGS[r.prog].min : 45) * MIN;
    if (r.k === 'dry') return ms(r.start) + (r.dur || progMin(b, 'dry')) * MIN;
    if (r.k === 'fin') return ms(r.start) + Math.round(b.kg / S().cfg.finKgH * 60) * MIN;
    return null;
  };
  // Standard minutes left until Ready to Deliver, from where the batch is now (§19–§41).
  M.remain = function (b) {
    var c = S().cfg, i = M.stageIdx(b.stage === 'hold' && b.hold ? b.hold.prev : b.stage), now = M.now(), m = 0;
    function after(st) { return i <= M.stageIdx(st); }
    if (i < 0) return 0;
    if (after('wash_q')) m += progMin(b, 'wash') + (after('ho12') && i <= M.stageIdx('ho12') ? c.hoMin : 0);
    else if (b.stage === 'washing') m += Math.max(0, Math.round((M.runEnd(b) - now) / MIN));
    if (after('dry_q')) m += progMin(b, 'dry'); else if (b.stage === 'drying') m += Math.max(0, Math.round((M.runEnd(b) - now) / MIN));
    if (after('ho23')) m += c.hoMin;
    if (after('fin_q')) m += Math.round(b.kg / c.finKgH * 60); else if (b.stage === 'finishing') m += Math.max(0, Math.round(b.kg * (1 - (b.finDone || 0) / Math.max(1, b.pcs)) / c.finKgH * 60));
    if (after('qc_q')) m += c.qcMin;
    if (after('pack_q')) m += c.packMin;
    return m;
  };
  M.slaState = function (b) {
    if (!b.sla || ['handed', 'merged'].indexOf(b.stage) >= 0) return 'ok';
    if (['rtd', 'ho3l'].indexOf(b.stage) >= 0) return M.now() > ms(b.sla) && !b.rtdAt ? 'late' : 'ok';
    var now = M.now(), s = ms(b.sla);
    if (now > s) return 'late';
    if (now + (M.remain(b) + S().cfg.riskBuf) * MIN > s) return 'risk';
    return 'ok';
  };
  M.SLA_ST = { ok: [L('Aman', 'On Track'), 'ok'], risk: [L('Risiko SLA', 'SLA Risk'), 'warn'], late: [L('Terlambat', 'Late'), 'crit'] };
  M.slaLeft = function (b) { return b.sla ? Math.round((ms(b.sla) - M.now()) / MIN) : null; };

  /* ---------- Phase 7 bridge: manifests heading to the plant (§5, §7) ---------- */
  M.incoming = function () {
    if (!LG || !LG.state) return [];
    return LG.state().manifests.filter(function (m) { return ['intransit', 'arrived'].indexOf(m.st) >= 0; }).map(function (m) {
      var o = LG.order(m.ord), t = LG.trip(m.trip);
      return { mf: m.id, ord: m.ord, prop: o ? o.prop : null, cl: o ? o.cl : null, drv: t ? t.drv : null, veh: t ? t.veh : null, bags: m.bags + (m.cont || 0), kg: m.kg, cat: m.cat, st: m.st, pickAt: m.pickAt, eta: t && t.atPlant ? null : (o && LG.eta ? null : null) };
    });
  };
  M.sync = function () {
    if (!LG || !LG.state) return 0;
    var n = 0, s = S();
    LG.state().manifests.forEach(function (m) {
      if (m.st !== 'handed' || s.rcv.some(function (r) { return r.mf === m.id; })) return;
      var o = LG.order(m.ord), t = LG.trip(m.trip);
      s.rcv.push({ id: nid('rcv', 'RCV-2610-', 3), src: 'manifest', mf: m.id, ord: m.ord, prop: o.prop, cl: o.cl, drv: t ? t.drv : null, veh: t ? t.veh : null, arrAt: m.ho && m.ho.arrAt || nowS(), bags: m.bags + (m.cont || 0), cont: m.cont || 0, estKg: m.kg, estPcs: null, cat: m.cat, svc: o.svc, pri: o.pri, special: T(m.special), st: 'waiting', stage: 'rcv' });
      n++;
    });
    if (n) save();
    return n;
  };

  /* ---------- NP-01 Receiving & Verification ---------- */
  function t1(ctx) { return can(ctx, 'prod.t1'); }
  M.rcvList = function (ctx, stage) { M.sync(); if (!t1(ctx) && !can(ctx, 'prod.cmd')) return []; return S().rcv.filter(function (r) { return !stage || r.stage === stage; }).sort(function (a, b) { return M.priRank(b.pri) - M.priRank(a.pri) || ms(a.arrAt) - ms(b.arrAt); }); };
  M.rcvStart = function (ctx, id, f) {
    var r = M.rcv(id); if (!r) return bad(M.MSG.notfound); if (!t1(ctx)) return deny(ctx, id);
    if (r.st !== 'waiting') return bad(M.MSG.jump, 'jump');
    r.st = 'receiving'; r.startAt = nowS(); r.startBy = opOf(ctx, f, 't1'); r.chk = r.chk || {};
    M.audit('RECEIVING.START', ctx, { rec: id }); save(); return { ok: true, rcv: r };
  };
  // SESUAI: client, property, bag count and condition checked; any mismatch is refused here (§7: never silently accept).
  M.rcvVerify = function (ctx, id, f) {
    var r = M.rcv(id); if (!r) return bad(M.MSG.notfound); if (!t1(ctx)) return deny(ctx, id);
    if (r.st === 'waiting') M.rcvStart(ctx, id, f);
    if (r.st !== 'receiving') return bad(M.MSG.jump, 'jump');
    f = f || {};
    if (!f.client || !f.prop) return bad(L('Cek klien dan property dulu.', 'Check the client and property first.'), 'check');
    var bags = +f.bags, cont = +(f.cont || 0); if (!(bags >= 0)) return bad(L('Isi jumlah bag.', 'Enter the bag count.'), 'bags');
    var cond = M.COND[f.cond] ? f.cond : 'good';
    r.chk = { client: true, prop: true }; r.act = { bags: bags, cont: cont, cond: cond }; r.notes = str(f.notes); if (f.photo) r.photo = f.photo;
    if (bags !== r.bags || cond === 'damaged' || cond === 'contam') { save(); return bad(M.MSG.mismatch, 'mismatch', { gap: bags - r.bags }); }
    r.st = 'verified'; r.verAt = nowS(); r.verBy = opOf(ctx, f, 't1');
    M.audit('RECEIVING.VERIFIED', ctx, { rec: id }); save(); return { ok: true, rcv: r };
  };
  // ADA SELISIH: reason, notes, photo (configurable). Large differences need a supervisor decision (§11).
  M.rcvDifference = function (ctx, id, f) {
    var r = M.rcv(id), c = S().cfg; if (!r) return bad(M.MSG.notfound); if (!t1(ctx)) return deny(ctx, id);
    if (r.st === 'waiting') M.rcvStart(ctx, id, f);
    if (['receiving', 'verified'].indexOf(r.st) < 0) return bad(M.MSG.jump, 'jump');
    f = f || {};
    var reasons = (f.reasons || []).filter(function (k) { return M.DIS_REASONS[k]; }); if (!reasons.length) return bad(L('Pilih alasan selisih.', 'Choose the reason for the difference.'), 'reason');
    if (c.disNote && !str(f.note)) return bad(M.MSG.note, 'note');
    if (c.disPhoto && !f.photo) return bad(M.MSG.photo, 'photo');
    var bags = f.bags != null && f.bags !== '' ? +f.bags : (r.act ? r.act.bags : r.bags);
    r.act = Object.assign({ cont: 0, cond: 'good' }, r.act || {}, { bags: bags }); if (f.cond && M.COND[f.cond]) r.act.cond = f.cond;
    var gap = bags - r.bags, big = Math.abs(gap) >= c.bagReview || (c.missingReview && gap < 0) || reasons.indexOf('damaged') >= 0;
    r.dis = { reasons: reasons, note: str(f.note), photo: f.photo, by: opOf(ctx, f, 't1'), at: nowS(), review: big ? 'pending' : 'none', big: big, gap: gap };
    r.st = 'difference';
    if (big) issueNew(ctx, { type: reasons.indexOf('missing') >= 0 ? 'missing' : 'count', stage: 'rcv', team: 't1', rcv: r.id, sev: 'high', note: T(L('Selisih receiving ', 'Receiving difference ')) + r.id + ': ' + str(f.note), action: 'review' });
    M.audit('RECEIVING.DIFFERENCE', ctx, { rec: id, from: r.bags, to: bags, reason: reasons.join(','), note: r.dis.note }); save();
    return { ok: true, rcv: r, review: big };
  };
  M.rcvReview = function (ctx, id, dec, note) {
    var r = M.rcv(id); if (!r) return bad(M.MSG.notfound); if (!can(ctx, 'prod.spv')) return deny(ctx, id);
    if (!r.dis || r.dis.review !== 'pending') return bad(M.MSG.jump, 'jump');
    if (!str(note)) return bad(M.MSG.reason, 'reason');
    r.dis.review = dec === 'approve' ? 'approved' : 'rejected'; r.dis.revBy = empId(ctx); r.dis.revAt = nowS(); r.dis.revNote = str(note);
    if (dec !== 'approve') r.st = 'receiving';
    S().issues.filter(function (i) { return i.rcv === r.id && i.st !== 'resolved'; }).forEach(function (i) { i.st = 'resolved'; i.res = str(note); i.resAt = nowS(); i.resBy = empId(ctx); });
    M.audit('SUPERVISOR.OVERRIDE', ctx, { rec: id, to: r.dis.review, reason: str(note) }); save(); return { ok: true, rcv: r };
  };
  // TERIMA CUCIAN: formal Logistics → Team 1 handover (§7) and the start of production.
  M.rcvAccept = function (ctx, id, f) {
    var r = M.rcv(id); if (!r) return bad(M.MSG.notfound); if (!t1(ctx)) return deny(ctx, id);
    if (r.st === 'difference' && r.dis && r.dis.review === 'pending') return bad(M.MSG.review, 'review');
    if (r.st === 'difference' && r.dis && r.dis.review === 'rejected') return bad(L('Supervisor meminta hitung ulang.', 'The supervisor asked for a recount.'), 'review');
    if (['verified', 'difference'].indexOf(r.st) < 0) return bad(M.MSG.jump, 'jump');
    r.st = 'received'; r.stage = 'wgt'; r.rcvAt = nowS(); r.rcvBy = opOf(ctx, f, 't1');
    var h = { id: nid('ho', 'HO-2610-', 3), kind: 'log1', from: 'log', to: 't1', batch: null, rcv: r.id, mf: r.mf, ord: r.ord, cl: r.cl, prop: r.prop, kg: r.estKg, qty: r.estPcs, bags: r.act.bags, cat: r.cat, cond: r.act.cond, sender: r.drv || (r.src === 'drop' ? 'client' : 'system'), at: r.arrAt, receiver: r.rcvBy, recAt: r.rcvAt, ev: r.photo ? [r.photo] : [], diff: r.dis ? { bags: r.dis.gap, reason: r.dis.reasons.join(','), note: r.dis.note } : null, st: r.dis ? 'resolved' : 'accepted', sla: null, pri: r.pri };
    S().ho.push(h);
    if (r.mf && LG && LG.manifest) { var m = LG.manifest(r.mf); if (m && m.st === 'handed') LG.startReceiving(ctx, r.mf); }
    M.audit('RECEIVING.ACCEPTED', ctx, { rec: id, note: r.dis ? T(L('Dengan selisih yang tercatat', 'With a recorded difference')) : null }); save();
    return { ok: true, rcv: r, ho: h };
  };

  /* ---------- NP-02 Weighing, Counting & Discrepancy ---------- */
  // Simulated digital scale (§8): a steady reading for the prototype.
  M.readScale = function (id) { var r = M.rcv(id); if (!r) return null; var tare = r1((r.act ? r.act.bags : r.bags) * 0.22 + 0.4); return { gross: r1(r.estKg * 0.985 + tare), tare: tare, scale: r.estKg > 60 ? 'SC-02' : 'SC-01', at: nowS() }; };
  M.compare = function (r) {
    var c = S().cfg, w = r.weigh, rows = [];
    function row(k, est, act, warnPct, critPct) { if (est == null || act == null) { rows.push({ k: k, est: est, act: act, gap: null, pct: null, st: 'na' }); return; } var gap = r1(act - est), p = est ? r1(gap / est * 100) : 0; rows.push({ k: k, est: est, act: act, gap: gap, pct: p, st: Math.abs(p) >= critPct ? 'crit' : Math.abs(p) >= warnPct ? 'warn' : 'ok' }); }
    row('kg', r.estKg, w ? w.net : null, c.kgWarn, c.kgReview);
    row('bag', r.bags, r.act ? r.act.bags : null, 0.01, 0.01);
    row('pcs', r.estPcs, r.pcs != null && r.items ? r.pcs : null, c.kgWarn, c.kgReview);
    return rows;
  };
  M.weigh = function (ctx, id, f) {
    var r = M.rcv(id), c = S().cfg; if (!r) return bad(M.MSG.notfound); if (!t1(ctx)) return deny(ctx, id);
    var re = r.stage === 'sort' && r.weigh; if (r.stage !== 'wgt' && !re) return bad(M.MSG.jump, 'jump');
    f = f || {};
    var gross = +f.gross, tare = +(f.tare || 0); if (!(gross > 0) || tare < 0 || tare >= gross) return bad(L('Isi berat kotor dan tara dengan benar.', 'Enter the gross and tare weight correctly.'), 'kg');
    var auto = M.readScale(id), manual = !f.auto || Math.abs(gross - auto.gross) > 0.05 || Math.abs(tare - auto.tare) > 0.05;
    if ((manual && c.scale) || re) { if (!can(ctx, 'prod.weight.override')) return bad(L('Ubah berat manual perlu izin supervisor.', 'A manual weight change needs supervisor permission.'), 'noperm'); if (!str(f.reason)) return bad(M.MSG.reason, 'reason'); }
    var net = r1(gross - tare), items = {}, pcs = 0;
    Object.keys(f.items || {}).forEach(function (k) { var q = Math.max(0, Math.round(+f.items[k] || 0)); if (q && by(D.ITEMS, 'k', k)) { items[k] = q; pcs += q; } });
    var est = r.estKg ? r1((net - r.estKg) / r.estKg * 100) : 0;
    if (Math.abs(est) >= c.kgWarn && !re) {
      if (!str(f.disNote)) return bad(L('Berat beda ' + est + '% dari estimasi. Isi alasan selisih.', 'Weight differs ' + est + '% from the estimate. Enter the reason.'), 'weightgap', { pct: est });
      r.wdis = { reasons: ['weight'], note: str(f.disNote), pct: est, by: opOf(ctx, f, 't1'), at: nowS(), review: Math.abs(est) >= c.kgReview ? 'pending' : 'none' };
      if (r.wdis.review === 'pending') issueNew(ctx, { type: 'count', stage: 'rcv', team: 't1', rcv: r.id, sev: 'med', note: T(L('Selisih berat ', 'Weight difference ')) + est + '% · ' + r.id, action: 'review' });
      M.audit('RECEIVING.DIFFERENCE', ctx, { rec: id, from: r.estKg, to: net, reason: 'weight', note: r.wdis.note });
    }
    var prev = r.weigh ? r.weigh.net : null;
    r.weigh = { gross: r1(gross), tare: r1(tare), net: net, scale: f.scale || auto.scale, auto: !manual, by: opOf(ctx, f, 't1'), at: nowS(), unit: D.UNITS[f.unit] ? f.unit : 'kg', manual: manual ? { by: empId(ctx), reason: str(f.reason) } : null };
    r.items = pcs ? items : (r.items || null); r.pcs = pcs || r.pcs || Math.round(net / ((D.CATS[r.cat] || D.CATS.white).kgPc || 0.45));
    if (f.bags != null && f.bags !== '') r.act.bagsW = +f.bags;
    r.stage = 'sort';
    M.audit(re || manual ? 'WEIGHT.CHANGED' : 'WEIGHT.RECORDED', ctx, { rec: id, from: prev, to: net, reason: manual || re ? str(f.reason) : null }); save();
    return { ok: true, rcv: r, cmp: M.compare(r) };
  };
  M.wdisReview = function (ctx, id, dec, note) {
    var r = M.rcv(id); if (!r) return bad(M.MSG.notfound); if (!can(ctx, 'prod.spv')) return deny(ctx, id);
    if (!r.wdis || r.wdis.review !== 'pending') return bad(M.MSG.jump, 'jump'); if (!str(note)) return bad(M.MSG.reason, 'reason');
    r.wdis.review = dec === 'approve' ? 'approved' : 'rejected'; r.wdis.revBy = empId(ctx); r.wdis.revAt = nowS(); r.wdis.revNote = str(note);
    if (dec !== 'approve') { r.stage = 'wgt'; r.weigh = null; }
    S().issues.filter(function (i) { return i.rcv === r.id && i.st !== 'resolved'; }).forEach(function (i) { i.st = 'resolved'; i.res = str(note); i.resAt = nowS(); i.resBy = empId(ctx); });
    M.audit('SUPERVISOR.OVERRIDE', ctx, { rec: id, to: r.wdis.review, reason: str(note) }); save(); return { ok: true, rcv: r };
  };

  /* ---------- NP-03 Sorting & Classification ---------- */
  M.suggestSort = function (r) {
    var rule = D.RULES[r.prop], net = r.weigh ? r.weigh.net : r.estKg, cats = {}, flags = [];
    var mix = rule ? rule.mix : (function () { var o = {}; o[{ towel: 'towel', spa: 'spa', uniform: 'uniform', garment: 'delicate' }[r.cat] || 'white'] = 1; return o; })();
    var keys = Object.keys(mix), left = net;
    keys.forEach(function (k, i) { var v = i === keys.length - 1 ? r1(left) : r1(net * mix[k]); cats[k] = v; left -= v; });
    if (/noda|stain/i.test(T(r.special)) || (r.act && r.act.cond === 'stained')) flags.push('noda');
    if (r.pri === 'express' || r.pri === 'urgent') flags.push('express'); if (r.pri === 'superexpress') flags.push('superexpress');
    return { cats: cats, flags: flags, src: rule ? 'client' : 'default', note: rule && rule.note || null, sep: !!(rule && rule.sep) };
  };
  M.sortDone = function (ctx, id, f) {
    var r = M.rcv(id), c = S().cfg; if (!r) return bad(M.MSG.notfound); if (!t1(ctx)) return deny(ctx, id);
    if (r.stage !== 'sort') return bad(M.MSG.jump, 'jump');
    if (r.wdis && r.wdis.review === 'pending') return bad(M.MSG.review, 'review');
    f = f || {};
    var cats = {}, tot = 0; Object.keys(f.cats || {}).forEach(function (k) { var v = r1(+f.cats[k] || 0); if (v > 0 && D.CATS[k]) { cats[k] = v; tot += v; } });
    if (!Object.keys(cats).length) return bad(L('Pilih minimal satu kategori.', 'Choose at least one category.'), 'cats');
    var net = r.weigh.net; if (Math.abs(tot - net) > Math.max(0.5, net * c.sortTol / 100)) return bad(L('Total kategori ' + r1(tot) + ' kg harus sama dengan berat bersih ' + net + ' kg.', 'Category total ' + r1(tot) + ' kg must equal the net weight ' + net + ' kg.'), 'total');
    var flags = (f.flags || []).filter(function (k) { return D.FLAGS[k]; });
    var sg = M.suggestSort(r);
    r.sort = { cats: cats, flags: flags, by: opOf(ctx, f, 't1'), at: nowS(), pre: JSON.stringify(sg.cats) === JSON.stringify(cats) };
    var pri = flags.indexOf('superexpress') >= 0 ? 'superexpress' : flags.indexOf('express') >= 0 ? 'express' : flags.indexOf('priority') >= 0 && M.priRank(r.pri) < 2 ? 'important' : r.pri;
    var sla = isoT(ms(r.rcvAt || r.arrAt) + (c.tat[pri] || c.tat.normal) * MIN), keys = Object.keys(cats), left = r.pcs;
    var lots = keys.map(function (k, i) { var pcs = i === keys.length - 1 ? left : Math.round(r.pcs * cats[k] / net); left -= pcs; return { id: nid('lot', 'LOT-2610-', 3), rcv: r.id, prop: r.prop, cl: r.cl, cat: k, kg: cats[k], pcs: pcs, flags: flags.slice(), pri: pri, sla: sla, ord: r.ord, batch: null, at: nowS(), sep: sg.sep }; });
    lots.forEach(function (l) { S().lots.push(l); });
    r.stage = 'batch';
    M.audit('SORTING.COMPLETED', ctx, { rec: id, note: keys.map(function (k) { return k + ' ' + cats[k] + ' kg'; }).join(', ') }); save();
    return { ok: true, rcv: r, lots: lots };
  };

  /* ---------- NP-04 Batch Creation & Production Planning ---------- */
  M.lotsOpen = function () { return S().lots.filter(function (l) { return !l.batch; }); };
  function machOk(m) { return m && ['normal', 'idle', 'running'].indexOf(m.st) >= 0; }
  M.machAvail = function (m) { return !!m && ['normal', 'idle'].indexOf(m.st) >= 0 && !m.batch; };
  M.washers = function () { return S().mach.filter(function (m) { return m.type === 'washer'; }); };
  M.dryers = function () { return S().mach.filter(function (m) { return m.type === 'dryer'; }); };
  M.finLines = function () { return S().mach.filter(function (m) { return ['ironer', 'fold', 'iron'].indexOf(m.type) >= 0; }); };
  // Auto batch recommendation (§15): compatible lots, best machine fit, program, SLA, duration.
  M.recommend = function () {
    var groups = {}, out = [];
    M.lotsOpen().forEach(function (l) { var k = D.CATS[l.cat].grp + (l.sep ? '|' + l.cl : ''); (groups[k] = groups[k] || []).push(l); });
    Object.keys(groups).forEach(function (k) {
      var lots = groups[k].sort(function (a, b) { return ms(a.sla) - ms(b.sla); }), ws = M.washers().filter(machOk).sort(function (a, b) { return a.cap - b.cap; }), maxCap = ws.length ? ws[ws.length - 1].cap : 0;
      var chunk = [], kg = 0;
      function flush() {
        if (!chunk.length) return;
        var fit = ws.filter(function (m) { return m.cap >= kg; }), m = fit.filter(function (x) { return kg / x.cap >= 0.6; })[0] || fit[0] || ws[ws.length - 1];
        var cat = chunk[0].cat, prog = D.CATS[cat].wash, dur = (D.WASH_PROGS[prog] || {}).min || 45, sla = chunk.map(function (l) { return l.sla; }).sort()[0];
        var v = M.validate({ lots: chunk.map(function (l) { return l.id; }), mach: m && m.id, prog: prog });
        out.push({ key: k, lots: chunk.map(function (l) { return l.id; }), kg: r1(kg), pcs: sum(chunk.map(function (l) { return l.pcs; })), cat: cat, cl: chunk[0].cl, mach: m ? m.id : null, util: m ? Math.round(kg / m.cap * 100) : 0, prog: prog, sla: sla, dur: dur, finish: isoT(Math.max(M.now(), m && m.batch ? M.runEnd(M.batch(m.batch)) || M.now() : M.now()) + dur * MIN), warns: v.warns, blocks: v.blocks });
        chunk = []; kg = 0;
      }
      lots.forEach(function (l) { if (kg + l.kg > maxCap && chunk.length) flush(); chunk.push(l); kg += l.kg; });
      flush();
    });
    return out.sort(function (a, b) { return ms(a.sla) - ms(b.sla); });
  };
  // Capacity validation before activation (§16).
  M.validate = function (f) {
    var c = S().cfg, lots = (f.lots || []).map(M.lot).filter(Boolean), m = M.machine(f.mach), blocks = [], warns = [];
    var kg = f.kg != null ? +f.kg : r1(sum(lots.map(function (l) { return l.kg; }))), util = m && m.cap ? Math.round(kg / m.cap * 100) : 0;
    if (!m || m.type !== 'washer') blocks.push(['mach', L('Pilih mesin cuci.', 'Choose a washing machine.')]);
    else if (!machOk(m)) blocks.push(['unavail', L(m.id + ' tidak tersedia (' + T(M.MACH_ST[m.st][0]) + '). Batch tidak boleh ke mesin ini.', m.id + ' is not available (' + M.MACH_ST[m.st][0][1] + '). A batch cannot go to this machine.')]);
    if (m && m.cap) {
      if (util > c.maxOver) blocks.push(['overload', L('Kelebihan muatan ' + util + '% dari kapasitas ' + m.cap + ' kg.', 'Overloaded at ' + util + '% of the ' + m.cap + ' kg capacity.')]);
      else if (util > 100) warns.push(['overload', L('Overload ' + util + '%. Hanya dengan override supervisor.', 'Overload ' + util + '%. Supervisor override only.'), true]);
      else if (util < c.under) warns.push(['underload', L('Muatan rendah ' + util + '%. Gabungkan dengan lot lain jika bisa.', 'Low load ' + util + '%. Combine with other lots if possible.')]);
    }
    var grps = {}; lots.forEach(function (l) { grps[D.CATS[l.cat].grp] = 1; });
    if (Object.keys(grps).length > 1) warns.push(['incompat', L('Kategori tidak cocok dicampur: ' + Object.keys(grps).join(' + ') + '.', 'Categories not compatible: ' + Object.keys(grps).join(' + ') + '.')]);
    var cls = {}; lots.forEach(function (l) { cls[l.cl] = l.sep ? 1 : cls[l.cl]; }); var sepCl = lots.filter(function (l) { return l.sep; }).map(function (l) { return l.cl; });
    if (sepCl.length && lots.some(function (l) { return sepCl.indexOf(l.cl) < 0; })) warns.push(['incompat', L('Aturan klien: linen klien ini tidak dicampur klien lain.', 'Client rule: this client\'s linen is not mixed with other clients.')]);
    var p = D.WASH_PROGS[f.prog]; if (p && lots.length && lots.some(function (l) { return p.cats.indexOf(l.cat) < 0; })) warns.push(['prog', L('Program ' + T(p.n) + ' tidak sesuai kategori.', 'Program ' + p.n[1] + ' does not suit the category.')]);
    var sla = lots.map(function (l) { return l.sla; }).sort()[0];
    if (sla && p) { var est = M.now() + (p.min + 30 + 15 + Math.round(kg / c.finKgH * 60) + c.qcMin + c.packMin + 2 * c.hoMin) * MIN; if (est > ms(sla)) warns.push(['sla', L('Konflik SLA: perkiraan selesai ' + isoT(est).slice(11) + ', batas ' + sla.slice(11) + '.', 'SLA conflict: estimated finish ' + isoT(est).slice(11) + ', deadline ' + sla.slice(11) + '.')]); }
    return { kg: kg, util: util, blocks: blocks, warns: warns, sla: sla };
  };
  M.createBatch = function (ctx, f) {
    if (!t1(ctx)) return deny(ctx, 'BATCH');
    f = f || {};
    var lots = (f.lots || []).map(M.lot); if (!lots.length || lots.some(function (l) { return !l || l.batch; })) return bad(L('Pilih lot yang belum masuk batch.', 'Choose lots that are not in a batch yet.'), 'lots');
    var v = M.validate(f), prog = D.WASH_PROGS[f.prog] ? f.prog : D.CATS[lots[0].cat].wash;
    if (v.blocks.length) return bad(v.blocks[0][1], v.blocks[0][0], { v: v });
    var needOvr = v.warns.some(function (w) { return w[2]; });
    if (needOvr && !can(ctx, 'prod.spv')) return bad(v.warns.filter(function (w) { return w[2]; })[0][1], 'overload', { v: v });
    if (v.warns.length && !str(f.reason)) return bad(L('Ada peringatan. Isi alasan untuk melanjutkan.', 'There are warnings. Enter a reason to continue.'), 'reason', { v: v });
    var kg = r1(sum(lots.map(function (l) { return l.kg; }))), pcs = sum(lots.map(function (l) { return l.pcs; })), main = lots.slice().sort(function (a, b) { return b.kg - a.kg; })[0];
    var flags = []; lots.forEach(function (l) { l.flags.forEach(function (x) { if (flags.indexOf(x) < 0) flags.push(x); }); });
    var pri = lots.map(function (l) { return l.pri; }).sort(function (a, b) { return M.priRank(b) - M.priRank(a); })[0];
    var b = { id: nid('b', 'B-2610-', 3), rcvs: [], lots: lots.map(function (l) { return l.id; }), prop: main.prop, cl: main.cl, cat: main.cat, kg: kg, pcs: pcs, kg0: kg, pcs0: pcs, stage: 'ready', pri: f.pri && M.PRI[f.pri] ? f.pri : pri, flags: flags, runs: [], run: null, ev: [], mach: f.mach, prog: prog, team: 't1', dlv: null,
      created: [nowS(), opOf(ctx, f, 't1')], changes: 0, ovr: needOvr ? { by: empId(ctx), reason: str(f.reason), at: nowS() } : null, warnNote: v.warns.length ? str(f.reason) : null, hold: null, esc: null, assignee: null, ords: [], sla: v.sla };
    lots.forEach(function (l) { l.batch = b.id; if (b.rcvs.indexOf(l.rcv) < 0) b.rcvs.push(l.rcv); if (l.ord && b.ords.indexOf(l.ord) < 0) b.ords.push(l.ord); });
    b.mixed = lots.some(function (l) { return l.cl !== b.cl; });
    b.dlv = findDelivery(b.prop);
    if (b.dlv) b.sla = [b.sla, slaOf(b)].sort()[0];
    b.ev.push(['created', b.created[0], b.created[1]]);
    S().batches.push(b);
    b.rcvs.forEach(function (rid) { var r = M.rcv(rid); if (r && !S().lots.some(function (l) { return l.rcv === rid && !l.batch; })) r.stage = 'done'; });
    M.audit('BATCH.CREATED', ctx, { rec: b.id, batch: b.id, note: kg + ' kg · ' + b.mach + ' · ' + prog, reason: b.warnNote });
    if (needOvr) M.audit('SUPERVISOR.OVERRIDE', ctx, { rec: b.id, batch: b.id, reason: str(f.reason), note: 'overload ' + v.util + '%' });
    save(); return { ok: true, batch: b, v: v };
  };
  function findDelivery(prop) {
    if (!LG || !LG.state) return null;
    var used = {}; S().batches.forEach(function (b) { if (b.dlv) used[b.dlv] = 1; });
    var o = LG.state().orders.filter(function (x) { return x.kind === 'delivery' && x.prop === prop && x.date >= D.today && ['cancelled', 'completed'].indexOf(x.st) < 0 && !used[x.id]; }).sort(function (a, b) { return ms(a.date + ' ' + a.win[0]) - ms(b.date + ' ' + b.win[0]); })[0];
    return o ? o.id : null;
  }
  M.changeBatch = function (ctx, id, f) {
    var b = M.batch(id); if (!b) return bad(M.MSG.notfound);
    if (!(can(ctx, 'prod.spv') || (t1(ctx) && b.stage === 'ready'))) return deny(ctx, id);
    if (M.stageIdx(b.stage) > M.stageIdx('wash_q')) return bad(L('Batch sudah diproses. Mesin tidak bisa diganti.', 'The batch is already in process. The machine cannot be changed.'), 'jump');
    if (!str(f.reason)) return bad(M.MSG.reason, 'reason');
    var v = M.validate({ lots: b.lots, kg: b.kg, mach: f.mach || b.mach, prog: f.prog || b.prog });
    if (v.blocks.length) return bad(v.blocks[0][1], v.blocks[0][0], { v: v });
    if (v.warns.some(function (w) { return w[2]; }) && !can(ctx, 'prod.spv')) return bad(M.MSG.noperm, 'noperm');
    var from = b.mach + ' · ' + b.prog; b.mach = f.mach || b.mach; b.prog = f.prog || b.prog; if (f.pri && M.PRI[f.pri]) b.pri = f.pri; b.changes++;
    M.audit('BATCH.CHANGED', ctx, { rec: id, batch: id, from: from, to: b.mach + ' · ' + b.prog, reason: str(f.reason) }); save(); return { ok: true, batch: b };
  };

  /* ---------- Handover engine (§43): one pattern for all four handovers ---------- */
  M.hoFor = function (bId) { return S().ho.filter(function (h) { return h.batch === bId; }); };
  M.hoOpen = function (kind, bId) { return S().ho.filter(function (h) { return h.kind === kind && h.batch === bId && ['waiting', 'difference'].indexOf(h.st) >= 0; })[0] || null; };
  M.hoList = function (ctx, kind) { var k = M.HO_KIND[kind]; if (k && k.perm && !can(ctx, k.perm) && !can(ctx, 'prod.cmd')) return []; return S().ho.filter(function (h) { return !kind || h.kind === kind; }).sort(function (a, b) { return ms(b.at) - ms(a.at); }); };
  M.canReceive = function (ctx, h) { var t = M.teamOf(ctx), k = M.HO_KIND[h.kind]; return !!k && (t === 'all' || t === h.to) && (!k.perm || can(ctx, k.perm)); };
  M.canSend = function (ctx, kind) { var t = M.teamOf(ctx), k = M.HO_KIND[kind]; return !!k && (t === 'all' || t === k.from) && (!k.perm || can(ctx, k.perm)); };
  M.send = function (ctx, bId, f) {
    var b = M.batch(bId); if (!b) return bad(M.MSG.notfound);
    var kind = Object.keys(M.HO_KIND).filter(function (k) { return M.HO_KIND[k].send === b.stage; })[0]; if (!kind) return bad(M.MSG.jump, 'jump');
    if (!M.canSend(ctx, kind)) return deny(ctx, bId);
    f = f || {};
    if (kind === 't3log' && !b.rtdAt) return bad(M.MSG.jump, 'jump');
    var k = M.HO_KIND[kind], h = { id: nid('ho', 'HO-2610-', 3), kind: kind, from: k.from, to: k.to, batch: b.id, rcv: null, mf: null, ord: b.dlv || b.ords[0] || null, cl: b.cl, prop: b.prop, kg: b.kg, qty: kind === 't3log' ? packedQty(b) : (b.finQty || b.pcs), bags: kind === 't3log' ? b.pack.pkgs.length : null, cat: b.cat,
      cond: M.COND[f.cond] ? f.cond : 'good', sender: opOf(ctx, f, k.from), at: nowS(), receiver: null, recAt: null, ev: f.photo ? [f.photo] : [], diff: null, st: 'waiting', sla: b.sla, pri: b.pri, note: str(f.note), issues: S().issues.filter(function (i) { return i.batch === b.id && i.st !== 'resolved'; }).map(function (i) { return i.id; }) };
    S().ho.push(h); b.stage = k.wait; b.ev.push(['ho.' + kind + '.sent', h.at, h.sender]);
    M.audit('HANDOVER', ctx, { rec: h.id, batch: b.id, from: k.from, to: k.to, note: T(L('Dikirim', 'Sent')) }); save();
    return { ok: true, ho: h, batch: b };
  };
  // TERIMA HANDOVER (§43). Handover 4 resumes the Phase 7 delivery flow (§42).
  M.accept = function (ctx, hoId, f) {
    var h = M.ho(hoId); if (!h) return bad(M.MSG.notfound); if (!M.canReceive(ctx, h)) return deny(ctx, hoId);
    if (h.st !== 'waiting') return bad(M.MSG.jump, 'jump');
    var b = M.batch(h.batch), k = M.HO_KIND[h.kind]; f = f || {};
    h.st = 'accepted'; h.receiver = opOf(ctx, f, k.to === 'log' ? 'log' : k.to); h.recAt = nowS();
    var out = { ok: true, ho: h, batch: b };
    if (b) { b.stage = k.next; b.ev.push(['ho.' + h.kind, h.recAt, h.receiver]); if (k.next === 'wash_q' || k.next === 'fin_q') b.team = k.to; if (h.kind === 't3log') out.delivery = toLogistics(ctx, b); }
    M.audit('HANDOVER', ctx, { rec: h.id, batch: h.batch, from: h.from, to: h.to, note: T(L('Diterima', 'Accepted')) }); save();
    return out;
  };
  function toLogistics(ctx, b) {
    if (!LG || !LG.order) return null;
    var o = b.dlv ? LG.order(b.dlv) : null;
    if (o) { if (o.st === 'assigned' && LG.ownsOrder && LG.ownsOrder(ctx, o)) LG.markReady(ctx, o.id); b.dlvAt = nowS(); return { order: o, created: false }; }
    var now = M.now(), sh = isoT(now + 60 * MIN), late = sh.slice(11) > '19:00', date = late ? addDays(D.today, 1) : D.today, w0 = late ? '09:00' : hm(Math.ceil((now + 60 * MIN) / (30 * MIN)) * 30 * MIN), w1 = late ? '10:00' : hm(ms(date + ' ' + w0) + 60 * MIN);
    var cat = { white: 'linen', color: 'linen', heavy: 'linen', towel: 'towel', spa: 'spa', uniform: 'uniform', delicate: 'garment', special: 'garment' }[b.cat] || 'linen';
    var svc = (M.rcv(b.rcvs[0]) || {}).svc || 'SV-006';
    var r = LG.createOrder({ uid: 'system', roleKey: 'system', perms: ['lg.order.create'], employee: { id: 'system' } }, { prop: b.prop, kind: 'delivery', date: date, win: [w0, w1], svc: svc, bags: b.pack.pkgs.length, kg: b.kg, cat: cat, pri: b.pri, src: 'manual', instr: T(L('Dari produksi ', 'From production ')) + b.id }, { force: true, reason: T(L('Dibuat otomatis dari Handover 4 produksi', 'Created automatically from production Handover 4')) });
    if (r.ok) { b.dlv = r.order.id; b.dlvAt = nowS(); return { order: r.order, created: true }; }
    return null;
  }
  // ADA SELISIH on a handover: reason + notes, supervisor decides (§43).
  M.hoDiff = function (ctx, hoId, f) {
    var h = M.ho(hoId); if (!h) return bad(M.MSG.notfound); if (!M.canReceive(ctx, h)) return deny(ctx, hoId);
    if (h.st !== 'waiting') return bad(M.MSG.jump, 'jump');
    f = f || {}; if (!str(f.reason)) return bad(M.MSG.reason, 'reason'); if (!str(f.note)) return bad(M.MSG.note, 'note');
    h.st = 'difference'; h.receiver = opOf(ctx, f, h.to); h.recAt = nowS();
    h.diff = { kg: f.kg != null && f.kg !== '' ? r1(+f.kg - h.kg) : null, qty: f.qty != null && f.qty !== '' ? Math.round(+f.qty - h.qty) : null, bags: f.bags != null && f.bags !== '' ? Math.round(+f.bags - (h.bags || 0)) : null, reason: str(f.reason), note: str(f.note), photo: f.photo || null };
    issueNew(ctx, { type: h.diff.qty < 0 || h.diff.bags < 0 ? 'missing' : 'count', stage: M.HO_KIND[h.kind].to === 'log' ? 'pack' : 'ho', team: h.to, batch: h.batch, sev: 'high', note: T(M.HO_KIND[h.kind].n) + ' · ' + str(f.note), action: 'review', ho: h.id });
    M.audit('HANDOVER', ctx, { rec: h.id, batch: h.batch, from: h.from, to: h.to, note: T(L('Ada selisih: ', 'Difference: ')) + str(f.note), reason: str(f.reason) }); save();
    return { ok: true, ho: h };
  };
  M.hoResolve = function (ctx, hoId, dec, note) {
    var h = M.ho(hoId); if (!h) return bad(M.MSG.notfound); if (!can(ctx, 'prod.spv')) return deny(ctx, hoId);
    if (h.st !== 'difference') return bad(M.MSG.jump, 'jump'); if (!str(note)) return bad(M.MSG.reason, 'reason');
    var b = M.batch(h.batch), k = M.HO_KIND[h.kind];
    if (dec === 'return') { h.st = 'returned'; if (b) { b.stage = k.send; b.ev.push(['ho.' + h.kind + '.returned', nowS(), empId(ctx)]); } }
    else { h.st = 'resolved'; if (b) { if (h.diff && h.diff.qty) { b.pcs += h.diff.qty; } if (h.diff && h.diff.kg) b.kg = r1(b.kg + h.diff.kg); b.stage = k.next; b.ev.push(['ho.' + h.kind, nowS(), empId(ctx)]); if (h.kind === 't3log') toLogistics(ctx, b); } }
    h.res = { by: empId(ctx), at: nowS(), note: str(note), dec: dec };
    S().issues.filter(function (i) { return i.ho === h.id && i.st !== 'resolved'; }).forEach(function (i) { i.st = 'resolved'; i.res = str(note); i.resAt = nowS(); i.resBy = empId(ctx); });
    M.audit('SUPERVISOR.OVERRIDE', ctx, { rec: h.id, batch: h.batch, to: h.st, reason: str(note) }); save(); return { ok: true, ho: h };
  };
  // Full handover timeline (§44): Logistics → Team 1 → Team 2 → Team 3 → Logistics.
  M.hoTimeline = function (bId) {
    var b = M.batch(bId); if (!b) return [];
    var root0 = b.parent ? M.batch(b.parent) || b : b;
    var rows = S().ho.filter(function (h) { return h.kind === 'log1' && root0.rcvs.indexOf(h.rcv) >= 0; }).concat(S().ho.filter(function (h) { return h.batch === b.id; }));
    return ['log1', 't1t2', 't2t3', 't3log'].map(function (k) { var list = rows.filter(function (h) { return h.kind === k; }); return { kind: k, ho: list[list.length - 1] || null, all: list }; });
  };

  /* ---------- Queues per team ---------- */
  function byPri(a, b) { var sa = M.slaState(a), sb = M.slaState(b), rk = { late: 0, risk: 1, ok: 2 }; return rk[sa] - rk[sb] || M.priRank(b.pri) - M.priRank(a.pri) || ms(a.sla || '2099-01-01') - ms(b.sla || '2099-01-01'); }
  M.batches = function (stages) { stages = [].concat(stages || []); return S().batches.filter(function (b) { return !stages.length || stages.indexOf(b.stage) >= 0; }).sort(byPri); };
  M.teamCan = function (ctx, team) { return team === 't1' ? can(ctx, 'prod.t1') : team === 't2' ? can(ctx, 'prod.t2') : team === 't3' ? can(ctx, 'prod.t3') : false; };
  function stageGuard(ctx, b, stage, team) { if (!b) return bad(M.MSG.notfound); if (!M.teamCan(ctx, team)) return deny(ctx, b.id); if (b.stage !== stage) return bad(b.stage === 'hold' ? L('Batch sedang ditahan supervisor.', 'The batch is on hold by the supervisor.') : M.MSG.jump, b.stage === 'hold' ? 'hold' : 'jump'); return null; }

  /* ---------- NP-05 Washing ---------- */
  M.startWash = function (ctx, id, f) {
    var b = M.batch(id), g = stageGuard(ctx, b, 'wash_q', 't2'); if (g) return g;
    f = f || {}; var m = M.machine(f.mach || b.mach), prog = D.WASH_PROGS[f.prog] ? f.prog : b.prog;
    if (!m || m.type !== 'washer' || !M.machAvail(m)) return bad(M.MSG.mach, 'mach');
    if (b.kg > m.cap && !(b.ovr && b.mach === m.id)) return bad(L('Berat ' + b.kg + ' kg melebihi kapasitas ' + m.id + ' (' + m.cap + ' kg).', 'Weight ' + b.kg + ' kg exceeds ' + m.id + ' capacity (' + m.cap + ' kg).'), 'overload');
    if (m.id !== b.mach) { b.changes++; M.audit('BATCH.CHANGED', ctx, { rec: id, batch: id, from: b.mach, to: m.id, reason: T(L('Mesin dipilih saat MULAI CUCI', 'Machine chosen at MULAI CUCI')) }); }
    var op = opOf(ctx, f, 't2');
    b.mach = m.id; b.prog = prog; b.run = { k: 'wash', mach: m.id, prog: prog, start: nowS(), end: null, op: op, chem: T(D.WASH_PROGS[prog].chem) }; b.runs.push(b.run); b.stage = 'washing';
    m.st = 'running'; m.batch = b.id; m.since = b.run.start;
    b.ev.push(['wash.start', b.run.start, op]);
    M.audit('WASHING.STARTED', ctx, { rec: id, batch: id, to: m.id, note: T(D.WASH_PROGS[prog].n) }); save();
    return { ok: true, batch: b, end: isoT(M.runEnd(b)) };
  };
  function release(b, cyc) { var m = M.machine(b.run.mach); if (m && m.batch === b.id) { m.batch = null; m.since = null; if (m.st === 'running') m.st = 'normal'; if (cyc) { m.cycles += 1; m.hours = r1(m.hours + (ms(b.run.end) - ms(b.run.start)) / 36e5); } } }
  M.finishWash = function (ctx, id, f) {
    var b = M.batch(id), g = stageGuard(ctx, b, 'washing', 't2'); if (g) return g;
    var op = opOf(ctx, f, 't2'); b.run.end = nowS(); b.run.endBy = op; release(b, true);
    b.ev.push(['wash.end', b.run.end, op]); b.run = null; b.stage = 'dry_q';
    M.audit('WASHING.COMPLETED', ctx, { rec: id, batch: id }); save(); return { ok: true, batch: b };
  };

  /* ---------- NP-06 Drying ---------- */
  M.startDry = function (ctx, id, f) {
    var b = M.batch(id), g = stageGuard(ctx, b, 'dry_q', 't2'); if (g) return g;
    f = f || {}; var c = D.CATS[b.cat] || D.CATS.white, method = D.DRY_METHODS[f.method] ? f.method : (D.DRY_METHODS[c.dry] ? c.dry : 'machine'), m = null;
    var prog = D.DRY_PROGS[f.prog] ? f.prog : (D.DRY_PROGS[c.dry] ? c.dry : 'P-DMD');
    if (method === 'machine') {
      m = M.machine(f.mach); if (!m || m.type !== 'dryer' || !M.machAvail(m)) return bad(M.MSG.mach, 'mach');
      if (b.kg > m.cap) return bad(L('Berat ' + b.kg + ' kg melebihi kapasitas ' + m.id + ' (' + m.cap + ' kg).', 'Weight ' + b.kg + ' kg exceeds ' + m.id + ' capacity (' + m.cap + ' kg).'), 'overload');
    }
    var dp = D.DRY_PROGS[prog], dur = +f.dur > 0 ? Math.round(+f.dur) : method === 'machine' ? dp.min : ({ air: 120, hang: 180, special: 90 }[method]), temp = method === 'machine' ? (+f.temp > 0 ? +f.temp : dp.temp) : null;
    var op = opOf(ctx, f, 't2');
    b.dmethod = method; b.dprog = method === 'machine' ? prog : null;
    b.run = { k: 'dry', mach: m ? m.id : null, prog: method === 'machine' ? prog : method, method: method, temp: temp, dur: dur, start: nowS(), end: null, op: op, note: str(f.note) }; b.runs.push(b.run); b.stage = 'drying';
    if (m) { m.st = 'running'; m.batch = b.id; m.since = b.run.start; }
    b.ev.push(['dry.start', b.run.start, op]);
    M.audit('DRYING.STARTED', ctx, { rec: id, batch: id, to: m ? m.id : method }); save();
    return { ok: true, batch: b, end: isoT(M.runEnd(b)) };
  };
  M.finishDry = function (ctx, id, f) {
    var b = M.batch(id), g = stageGuard(ctx, b, 'drying', 't2'); if (g) return g;
    f = f || {}; var op = opOf(ctx, f, 't2'); b.run.end = nowS(); b.run.cond = f.cond || 'ok'; b.run.endNote = str(f.note); if (b.run.mach) release(b, true);
    b.ev.push(['dry.end', b.run.end, op]); b.run = null; b.stage = 'fin_ready';
    M.audit('DRYING.COMPLETED', ctx, { rec: id, batch: id }); save(); return { ok: true, batch: b };
  };

  /* ---------- NP-07 Ironing / Final Finishing ---------- */
  M.startFin = function (ctx, id, f) {
    var b = M.batch(id), g = stageGuard(ctx, b, 'fin_q', 't3'); if (g) return g;
    f = f || {}; var c = D.CATS[b.cat] || D.CATS.white, method = D.FIN_METHODS[f.method] ? f.method : c.fin, m = M.machine(f.line);
    if (!m || ['ironer', 'fold', 'iron'].indexOf(m.type) < 0 || !M.machAvail(m)) return bad(L('Pilih workstation / line yang tersedia.', 'Choose an available workstation / line.'), 'mach');
    var op = opOf(ctx, f, 't3');
    b.fmethod = method; b.finDone = 0; b.finQty = null;
    b.run = { k: 'fin', mach: m.id, prog: method, start: nowS(), end: null, op: op, qtyStart: b.pcs }; b.runs.push(b.run); b.stage = 'finishing';
    m.st = 'running'; m.batch = b.id; m.since = b.run.start;
    b.ev.push(['fin.start', b.run.start, op]);
    M.audit('FINISHING.STARTED', ctx, { rec: id, batch: id, to: m.id }); save(); return { ok: true, batch: b };
  };
  M.finProgress = function (ctx, id, qty) {
    var b = M.batch(id), g = stageGuard(ctx, b, 'finishing', 't3'); if (g) return g;
    qty = Math.round(+qty); if (!(qty >= 0 && qty <= b.pcs)) return bad(L('Jumlah 0 sampai ' + b.pcs + '.', 'Quantity 0 to ' + b.pcs + '.'), 'qty');
    b.finDone = qty; save(); return { ok: true, batch: b };
  };
  M.finishFin = function (ctx, id, f) {
    var b = M.batch(id), g = stageGuard(ctx, b, 'finishing', 't3'); if (g) return g;
    f = f || {}; var qty = f.qty == null || f.qty === '' ? b.pcs : Math.round(+f.qty);
    if (!(qty >= 0 && qty <= b.pcs)) return bad(L('Jumlah selesai 0 sampai ' + b.pcs + '.', 'Completed quantity 0 to ' + b.pcs + '.'), 'qty');
    if (qty < b.pcs) {
      if (!str(f.note)) return bad(L('Jumlah kurang ' + (b.pcs - qty) + ' pcs. Isi catatan (ADA MASALAH).', (b.pcs - qty) + ' pcs short. Enter a note (ADA MASALAH).'), 'short', { short: b.pcs - qty });
      issueNew(ctx, { type: 'count', stage: 'fin', team: 't3', batch: b.id, sev: 'med', note: T(L('Finishing kurang ', 'Finishing short ')) + (b.pcs - qty) + ' pcs · ' + str(f.note), action: 'review' });
    }
    var op = opOf(ctx, f, 't3'); b.run.end = nowS(); b.run.qtyDone = qty; release(b, false);
    b.finDone = qty; b.finQty = qty; b.ev.push(['fin.end', b.run.end, op]); b.run = null; b.stage = 'qc_q';
    M.audit('FINISHING.COMPLETED', ctx, { rec: id, batch: id, note: qty + ' pcs' }); save(); return { ok: true, batch: b };
  };

  /* ---------- NP-08 Quality Control & Rewash ---------- */
  M.qcPass = function (ctx, id, f) {
    var b = M.batch(id), g = stageGuard(ctx, b, 'qc_q', 't3'); if (g) return g;
    f = f || {}; var op = opOf(ctx, f, 't3'), qty = b.finQty != null ? b.finQty : b.pcs;
    b.qc = { res: 'pass', qty: qty, pass: qty, fail: 0, by: op, at: nowS(), checks: (f.checks || []).filter(function (k) { return M.QC_CHECKS[k]; }) };
    b.ev.push(['qc', b.qc.at, op]);
    M.audit('QC.PASSED', ctx, { rec: id, batch: id, note: qty + ' pcs' });
    if (b.parent) mergeBack(ctx, b); else b.stage = 'pack_q';
    save(); return { ok: true, batch: b, merged: !!b.parent };
  };
  function mergeBack(ctx, child) {
    var p = M.batch(child.parent), rw = M.rw(child.rw);
    child.stage = 'merged'; child.ev.push(['merged', nowS(), empId(ctx)]);
    if (rw) { rw.st = 'closed'; rw.closedAt = nowS(); }
    if (p) { p.qc.pass += child.qc.pass; p.qc.fail = Math.max(0, (p.qc.fail || 0) - child.qc.pass); if (p.qc.pass >= p.qc.qty) p.qc.res = 'pass'; p.ev.push(['rework.back', nowS(), empId(ctx)]); if (['packed'].indexOf(p.stage) >= 0) p.stage = 'pack_q'; }
  }
  // ADA MASALAH at QC (§34–§35): reason → action, with the root cause kept on the rework record.
  M.qcFail = function (ctx, id, f) {
    var b = M.batch(id), g = stageGuard(ctx, b, 'qc_q', 't3'), c = S().cfg; if (g) return g;
    f = f || {};
    if (!M.QC_FAIL[f.reason]) return bad(L('Pilih alasan masalah.', 'Choose the issue reason.'), 'reason');
    if (!M.QC_ACT[f.action]) return bad(L('Pilih tindakan.', 'Choose an action.'), 'action');
    var total = b.finQty != null ? b.finQty : b.pcs, qty = Math.round(+f.qty || 0); if (!(qty >= 1 && qty <= total)) return bad(L('Jumlah bermasalah 1 sampai ' + total + ' pcs.', 'Problem quantity 1 to ' + total + ' pcs.'), 'qty');
    if (c.qcPhoto && !f.photo) return bad(M.MSG.photo, 'photo');
    if (f.reason === 'other' && !str(f.note)) return bad(M.MSG.note, 'note');
    var op = opOf(ctx, f, 't3'), resp = M.QC_RESP[f.reason], act = f.action;
    var target = act === 'rewash' ? (resp === 'dry' ? 'dry_q' : 'wash_q') : act === 'refinish' ? 'fin_q' : act === 'review' ? 'hold' : null;
    var kg = r1(b.kg * qty / Math.max(1, b.pcs)), timeMin = target === 'wash_q' ? progMin(b, 'wash') + progMin(b, 'dry') + 50 : target === 'dry_q' ? progMin(b, 'dry') + 35 : target === 'fin_q' ? 25 : 0;
    var slaMin = b.sla ? Math.max(0, Math.round((M.now() + timeMin * MIN - ms(b.sla)) / MIN)) : 0;
    var rw = { id: nid('rw', 'RW-2610-', 2), batch: b.parent || b.id, child: null, reason: f.reason, origin: 'qc', resp: act === 'rewash' || act === 'refinish' ? (target === 'wash_q' ? 'wash' : target === 'dry_q' ? 'dry' : 'fin') : resp, action: act, item: f.item || null, qty: qty, kg: kg, ev: f.photo || null, note: str(f.note), op: op, at: nowS(), timeMin: timeMin, slaMin: slaMin, st: act === 'claim' ? 'claim' : act === 'review' ? 'review' : 'open', cl: b.cl, prop: b.prop };
    S().rework.push(rw);
    b.qc = { res: qty === total ? 'fail' : 'partial', qty: total, pass: total - qty, fail: qty, by: op, at: nowS(), checks: (f.checks || []).filter(function (k) { return M.QC_CHECKS[k]; }), rw: rw.id, reason: f.reason };
    b.ev.push(['qc.fail', b.qc.at, op]);
    if (target) {
      if (qty === total && !b.parent) {   // the whole batch goes back
        b.stage = target === 'hold' ? 'hold' : target; if (target === 'hold') b.hold = { prev: 'qc_q', by: op, at: nowS(), reason: T(M.QC_FAIL[f.reason]) }; b.qc = null; rw.child = b.id; b.rwOpen = rw.id;
        if (target === 'wash_q') { b.prog = 'P-RW'; b.team = 't2'; } if (target === 'dry_q') b.team = 't2';
      } else {
        var ch = { id: nid('b', 'B-2610-', 3), rcvs: b.rcvs.slice(), lots: [], prop: b.prop, cl: b.cl, cat: b.cat, kg: kg, pcs: qty, kg0: kg, pcs0: qty, stage: target === 'hold' ? 'hold' : target, pri: M.priRank(b.pri) < 3 ? 'express' : b.pri, flags: [f.reason === 'noda' ? 'noda' : 'priority'], runs: [], run: null, ev: [['created', nowS(), op]],
          mach: target === 'wash_q' ? pickWasher(kg) : null, prog: target === 'wash_q' ? 'P-RW' : b.prog, team: target === 'fin_q' ? 't3' : 't2', dlv: b.dlv, created: [nowS(), op], changes: 0, ovr: null, hold: target === 'hold' ? { prev: 'qc_q', by: op, at: nowS(), reason: T(M.QC_FAIL[f.reason]) } : null, esc: null, assignee: null, ords: b.ords.slice(), sla: b.sla, parent: b.parent || b.id, rw: rw.id, finQty: target === 'hold' ? qty : null };
        if (target === 'hold') ch.qc = null;
        S().batches.push(ch); rw.child = ch.id;
        if (!b.parent) b.stage = 'pack_q'; else { b.stage = 'merged'; }
      }
      M.audit('REWASH', ctx, { rec: rw.id, batch: b.id, to: target, reason: f.reason, note: qty + ' pcs' });
    } else if (qty === total && !b.parent) { b.stage = 'pack_q'; }
    else if (!b.parent) b.stage = 'pack_q';
    if (act === 'claim' || act === 'review') issueNew(ctx, { type: f.reason === 'rusak' ? 'damage' : f.reason === 'hitung' ? 'count' : 'stain', stage: 'qc', team: 't3', batch: b.id, sev: act === 'claim' ? 'high' : 'med', note: T(M.QC_FAIL[f.reason]) + ' · ' + qty + ' pcs' + (str(f.note) ? ' · ' + str(f.note) : ''), action: 'review', rw: rw.id });
    M.audit('QC.FAILED', ctx, { rec: id, batch: id, reason: f.reason, note: qty + ' pcs → ' + act });
    save(); return { ok: true, batch: b, rework: rw, child: rw.child ? M.batch(rw.child) : null };
  };
  function pickWasher(kg) { var w = M.washers().filter(machOk).sort(function (a, b) { return a.cap - b.cap; }).filter(function (m) { return m.cap >= kg; })[0]; return w ? w.id : 'W-03'; }
  M.reworks = function (f) { f = f || {}; return S().rework.filter(function (r) { return (!f.open || ['open', 'claim', 'review'].indexOf(r.st) >= 0) && (!f.batch || r.batch === f.batch || r.child === f.batch); }).sort(function (a, b) { return ms(b.at) - ms(a.at); }); };
  M.rwDecide = function (ctx, rwId, dec, note) {
    var rw = M.rw(rwId); if (!rw) return bad(M.MSG.notfound); if (!can(ctx, 'prod.spv')) return deny(ctx, rwId); if (!str(note)) return bad(M.MSG.reason, 'reason');
    if (rw.st === 'claim') { rw.st = 'claimok'; rw.dec = { by: empId(ctx), at: nowS(), note: str(note) }; }
    else if (rw.st === 'review') {
      var ch = M.batch(rw.child); rw.dec = { by: empId(ctx), at: nowS(), note: str(note), to: dec };
      if (dec === 'rewash' || dec === 'refinish') { rw.st = 'open'; rw.action = dec; rw.resp = dec === 'rewash' ? 'wash' : 'fin'; if (ch) { ch.stage = dec === 'rewash' ? 'wash_q' : 'fin_q'; ch.hold = null; ch.team = dec === 'rewash' ? 't2' : 't3'; if (dec === 'rewash') { ch.prog = 'P-RW'; ch.mach = pickWasher(ch.kg); } } }
      else if (dec === 'pass') { rw.st = 'closed'; rw.closedAt = nowS(); if (ch) { ch.qc = { res: 'pass', qty: ch.pcs, pass: ch.pcs, fail: 0, by: empId(ctx), at: nowS(), checks: [] }; ch.hold = null; if (ch.parent) mergeBack(ctx, ch); else ch.stage = 'pack_q'; } }
      else { rw.st = 'claim'; }
    } else return bad(M.MSG.jump, 'jump');
    S().issues.filter(function (i) { return i.rw === rw.id && i.st !== 'resolved'; }).forEach(function (i) { i.st = 'resolved'; i.res = str(note); i.resAt = nowS(); i.resBy = empId(ctx); });
    M.audit('SUPERVISOR.OVERRIDE', ctx, { rec: rw.id, batch: rw.batch, to: rw.st, reason: str(note) }); save(); return { ok: true, rework: rw };
  };
  // Root cause (§36): rework by responsible stage and reason, history never dropped.
  M.rootCause = function () {
    var by0 = {}, rs = {};
    S().rework.forEach(function (r) { by0[r.resp] = (by0[r.resp] || 0) + r.qty; rs[r.reason] = (rs[r.reason] || 0) + r.qty; });
    return { stage: by0, reason: rs, total: sum(S().rework.map(function (r) { return r.qty; })) };
  };

  /* ---------- NP-09 Packing, Labeling & Ready to Deliver ---------- */
  function packedQty(b) { return b.pack ? sum(b.pack.pkgs.map(function (p) { return p.qty; })) : 0; }
  M.packedQty = packedQty;
  M.pack = function (ctx, id, f) {
    var b = M.batch(id); if (!b) return bad(M.MSG.notfound); if (!can(ctx, 'prod.t3')) return deny(ctx, id);
    if (b.stage !== 'pack_q') return bad(b.stage === 'hold' ? M.MSG.review : M.MSG.jump, 'jump');
    f = f || {};
    var qcOk = b.qc && (b.qc.res === 'pass' || b.qc.res === 'partial') && b.qc.pass > 0;
    if (!qcOk) { if (!can(ctx, 'prod.spv')) return bad(L('Hanya barang yang lulus QC yang boleh dipacking.', 'Only items that passed QC can be packed.'), 'qc'); if (!str(f.reason)) return bad(M.MSG.reason, 'reason'); }
    var avail = (qcOk ? b.qc.pass : (b.finQty || b.pcs)) - packedQty(b); if (avail <= 0) return bad(L('Semua barang lulus QC sudah dipacking.', 'All QC-passed items are packed already.'), 'done');
    var n = Math.round(+f.pkgs); if (!(n >= 1 && n <= 60)) return bad(L('Isi jumlah paket (1–60).', 'Enter the package count (1–60).'), 'pkgs');
    var kgs = [].concat(f.kgPer || []).map(Number).filter(function (x) { return x > 0; }), kgAvail = r1(b.kg * avail / Math.max(1, b.pcs));
    var pkgs = b.pack ? b.pack.pkgs : [], base = Math.floor(avail / n), extra = avail - base * n, start = pkgs.length;
    for (var i = 0; i < n; i++) { var q = base + (i < extra ? 1 : 0); pkgs.push({ id: 'PKG-' + b.id.slice(2) + '-' + String(start + i + 1).padStart(2, '0'), n: start + i + 1, qty: q, kg: kgs[i] || r1(kgAvail * q / avail) }); }
    b.pack = { at: nowS(), by: opOf(ctx, f, 't3'), label: M.LABELS[f.label] ? f.label : 'qr', note: str(f.note), photo: f.photo || (b.pack && b.pack.photo) || null, pkgs: pkgs, ovr: qcOk ? null : { by: empId(ctx), reason: str(f.reason), at: nowS() } };
    b.stage = 'packed'; b.ev.push(['packed', b.pack.at, b.pack.by]);
    M.audit('PACKING.COMPLETED', ctx, { rec: id, batch: id, note: n + ' ' + T(L('paket', 'packages')) + ' · ' + avail + ' pcs' });
    if (!qcOk) M.audit('SUPERVISOR.OVERRIDE', ctx, { rec: id, batch: id, reason: str(f.reason), note: 'pack without QC' });
    save(); return { ok: true, batch: b };
  };
  // Reconciliation before Ready to Deliver (§39): received = processed = QC passed = packed.
  M.reconcile = function (b) {
    var rcv = b.pcs0 || b.pcs, proc = b.finQty != null ? b.finQty : (b.runs.some(function (r) { return r.k === 'fin' && r.end; }) ? b.pcs : null), qc = b.qc ? b.qc.pass : null, packed = packedQty(b);
    var kids = S().batches.filter(function (x) { return x.parent === b.id; }), openKids = kids.filter(function (x) { return x.stage !== 'merged'; });
    var claims = S().rework.filter(function (r) { return r.batch === b.id && (r.st === 'claimok'); }).reduce(function (s0, r) { return s0 + r.qty; }, 0);
    var claimPending = S().rework.filter(function (r) { return r.batch === b.id && r.st === 'claim'; }).reduce(function (s0, r) { return s0 + r.qty; }, 0);
    var expect = rcv - claims, gaps = [];
    if (proc != null && proc !== rcv) gaps.push(L('Diproses ' + proc + ' dari ' + rcv + ' pcs.', 'Processed ' + proc + ' of ' + rcv + ' pcs.'));
    openKids.forEach(function (k) { gaps.push(L(k.pcs + ' pcs masih proses ulang (' + k.id + ').', k.pcs + ' pcs still in rework (' + k.id + ').')); });
    if (claimPending) gaps.push(L(claimPending + ' pcs klaim kerusakan menunggu keputusan supervisor.', claimPending + ' pcs damage claim waiting for the supervisor.'));
    if (qc != null && packed !== qc) gaps.push(L('Dipacking ' + packed + ' dari ' + qc + ' pcs lulus QC.', 'Packed ' + packed + ' of ' + qc + ' QC-passed pcs.'));
    if (packed !== expect && !gaps.length) gaps.push(L('Dipacking ' + packed + ', seharusnya ' + expect + ' pcs.', 'Packed ' + packed + ', expected ' + expect + ' pcs.'));
    return { rcv: rcv, proc: proc, qc: qc, packed: packed, claims: claims, ok: !gaps.length && packed === expect, gaps: gaps };
  };
  M.ready = function (ctx, id, f) {
    var b = M.batch(id); if (!b) return bad(M.MSG.notfound); if (!can(ctx, 'prod.t3')) return deny(ctx, id);
    if (b.stage !== 'packed') return bad(M.MSG.jump, 'jump');
    f = f || {}; var rec = M.reconcile(b);
    if (!rec.ok) { if (!can(ctx, 'prod.spv')) return bad(L('Rekonsiliasi belum sesuai. Selesaikan selisih atau minta persetujuan supervisor.', 'Reconciliation does not match. Resolve it or ask for supervisor approval.'), 'reconcile', { rec: rec }); if (!str(f.reason)) return bad(M.MSG.reason, 'reason', { rec: rec }); b.recOvr = { by: empId(ctx), reason: str(f.reason), at: nowS(), gaps: rec.gaps.map(T) }; }
    b.stage = 'rtd'; b.rtdAt = [nowS(), opOf(ctx, f, 't3')]; b.ev.push(['rtd', b.rtdAt[0], b.rtdAt[1]]);
    M.audit('READY.DELIVER', ctx, { rec: id, batch: id, note: rec.packed + ' pcs · ' + b.pack.pkgs.length + ' ' + T(L('paket', 'packages')) });
    if (!rec.ok) M.audit('SUPERVISOR.OVERRIDE', ctx, { rec: id, batch: id, reason: str(f.reason), note: 'ready with reconciliation gap' });
    save(); return { ok: true, batch: b };
  };
  M.label = function (b, pkg) {
    var o = M.order(b.dlv), r = M.rcv(b.rcvs[0]);
    return { batch: b.id, pkg: pkg.id, n: pkg.n, of: b.pack.pkgs.length, qty: pkg.qty, kg: pkg.kg, cl: M.clientName(b.cl), prop: M.propName(b.prop), ord: b.dlv || (r && r.ord) || b.ords[0] || '—', date: o ? o.date + ' ' + o.win.join('–') : (b.sla ? b.sla.slice(0, 10) : D.today), cat: b.cat, qr: 'JFRESH|PKG|' + pkg.id + '|' + b.id + '|' + (b.dlv || '-') };
  };

  /* ---------- Issues (§80–§81) ---------- */
  function issueNew(ctx, f) {
    var i = { id: nid('pi', 'PI-2610-', 2), type: f.type, stage: f.stage || null, team: f.team || null, mach: f.mach || null, batch: f.batch || null, rcv: f.rcv || null, ho: f.ho || null, rw: f.rw || null, sev: f.sev || 'med', note: f.note || '', ev: f.photo || null, action: f.action || 'review', st: f.action === 'continue' ? 'open' : f.action === 'review' ? 'review' : 'open', by: empId(ctx), at: nowS(), owner: f.owner || 'EMP-021', wo: null, chk: f.chk || null };
    S().issues.unshift(i); return i;
  }
  M.issueList = function (ctx, f) {
    f = f || {}; var t = M.teamOf(ctx);
    return S().issues.filter(function (i) { return (t === 'all' || can(ctx, 'prod.cmd') || i.team === t || (t === 'mnt' && i.mach)) && (!f.open || i.st !== 'resolved') && (!f.team || i.team === f.team); }).sort(function (a, b) { var r = { crit: 0, high: 1, med: 2, low: 3 }; return (a.st === 'resolved') - (b.st === 'resolved') || r[a.sev] - r[b.sev] || ms(b.at) - ms(a.at); });
  };
  // ADA MASALAH (§81): type → severity → evidence → notes → action.
  M.reportIssue = function (ctx, f) {
    f = f || {}; if (!can(ctx, 'prod.issue')) return deny(ctx, 'ISSUE');
    var stage = f.stage || 'master', reasons = M.REASONS[stage] || M.REASONS.master;
    if (!reasons[f.type] && !M.REASONS.master[f.type]) return bad(L('Pilih jenis masalah.', 'Choose the issue type.'), 'type');
    if (!M.SEV[f.sev]) return bad(L('Pilih tingkat keparahan.', 'Choose the severity.'), 'sev');
    if (!M.ISSUE_ACT[f.action]) return bad(L('Pilih tindakan.', 'Choose an action.'), 'action');
    if ((f.type === 'other' || f.sev === 'crit' || f.sev === 'high') && !str(f.note)) return bad(M.MSG.note, 'note');
    if (f.sev === 'crit' && !f.photo) return bad(M.MSG.photo, 'photo');
    var b = f.batch ? M.batch(f.batch) : null, m = f.mach ? M.machine(f.mach) : (b && b.run && b.run.mach ? M.machine(b.run.mach) : null);
    var team = M.teamOf(ctx); team = team === 'all' ? (b ? M.STAGE[b.stage][2] : f.team || 't2') : team;
    var i = issueNew(ctx, { type: f.type, stage: stage, team: team, mach: m ? m.id : null, batch: b ? b.id : null, sev: f.sev, note: str(f.note), photo: f.photo, action: f.action });
    var machIssue = m && (M.MACH_REASONS.indexOf(f.type) >= 0 || f.action === 'maint');
    // Critical machine issue opens a maintenance work order automatically (§22).
    if (machIssue && (f.sev === 'crit' || f.sev === 'high' || f.action === 'maint')) {
      var w = woNew(ctx, { mach: m.id, issue: T(reasons[f.type] || M.REASONS.master[f.type]) + (str(f.note) ? ' · ' + str(f.note) : ''), sev: f.sev, batch: b ? b.id : null, impact: b ? T(L('Batch ', 'Batch ')) + b.id + T(L(' terhenti', ' interrupted')) : '', src: i.id });
      i.wo = w.id; i.owner = 'EMP-102';
      if (b && b.run && b.run.mach === m.id) { b.run.end = nowS(); b.run.interrupted = true; var mm = M.machine(m.id); mm.batch = null; b.ev.push([b.run.k + '.stop', nowS(), empId(ctx)]); b.stage = b.run.k === 'wash' ? 'wash_q' : b.run.k === 'dry' ? 'dry_q' : 'fin_q'; b.run = null; }
    }
    if (b && f.action === 'hold' && b.stage !== 'hold') { b.hold = { prev: b.stage, by: empId(ctx), at: nowS(), reason: str(f.note) || T(reasons[f.type]) }; b.stage = 'hold'; }
    if (b && f.action === 'reprocess' && b.run) { b.run.end = nowS(); b.run.interrupted = true; release(b, false); b.stage = b.run.k === 'wash' ? 'wash_q' : b.run.k === 'dry' ? 'dry_q' : 'fin_q'; b.run = null; }
    if (f.action === 'escalate') { i.esc = { by: empId(ctx), at: nowS() }; note('opsmgr', 'escalate', i.id); }
    M.audit(machIssue ? 'MACHINE.ISSUE' : 'ISSUE.OPEN', ctx, { rec: i.id, batch: b ? b.id : null, to: f.action, reason: f.type, note: str(f.note) }); save();
    return { ok: true, issue: i, wo: i.wo ? M.wo(i.wo) : null };
  };
  M.resolveIssue = function (ctx, id, note) {
    var i = M.issue(id); if (!i) return bad(M.MSG.notfound); if (!can(ctx, 'prod.issue.manage')) return deny(ctx, id);
    if (i.st === 'resolved') return bad(M.MSG.jump, 'jump'); if (!str(note)) return bad(M.MSG.reason, 'reason');
    i.st = 'resolved'; i.res = str(note); i.resAt = nowS(); i.resBy = empId(ctx);
    M.audit('ISSUE.RESOLVED', ctx, { rec: id, note: str(note) }); save(); return { ok: true, issue: i };
  };
  function note(to, kind, ref) { S().notes.unshift({ to: to, kind: kind, ref: ref, at: nowS() }); }

  /* ---------- NP-10 Supervisor actions (§51), all audited ---------- */
  function spv(ctx, id) { if (!can(ctx, 'prod.spv')) return deny(ctx, id); return null; }
  M.spvPrioritize = function (ctx, id, pri, reason) { var g = spv(ctx, id); if (g) return g; var b = M.batch(id); if (!b) return bad(M.MSG.notfound); if (!M.PRI[pri]) return bad(M.MSG.invalid); if (!str(reason)) return bad(M.MSG.reason, 'reason'); var from = b.pri; b.pri = pri; M.audit('SPV.PRIORITIZE', ctx, { rec: id, batch: id, from: from, to: pri, reason: str(reason) }); save(); return { ok: true, batch: b }; };
  M.spvHold = function (ctx, id, reason) { var g = spv(ctx, id); if (g) return g; var b = M.batch(id); if (!b) return bad(M.MSG.notfound); if (b.stage === 'hold' || ['handed', 'merged'].indexOf(b.stage) >= 0) return bad(M.MSG.jump, 'jump'); if (!str(reason)) return bad(M.MSG.reason, 'reason'); if (b.run) { b.run.end = nowS(); b.run.interrupted = true; release(b, false); b.ev.push([b.run.k + '.stop', nowS(), empId(ctx)]); var back = b.run.k === 'wash' ? 'wash_q' : b.run.k === 'dry' ? 'dry_q' : 'fin_q'; b.run = null; b.hold = { prev: back, by: empId(ctx), at: nowS(), reason: str(reason) }; } else b.hold = { prev: b.stage, by: empId(ctx), at: nowS(), reason: str(reason) }; b.stage = 'hold'; b.ev.push(['hold', nowS(), empId(ctx)]); M.audit('SPV.HOLD', ctx, { rec: id, batch: id, reason: str(reason) }); save(); return { ok: true, batch: b }; };
  M.spvResume = function (ctx, id, reason) { var g = spv(ctx, id); if (g) return g; var b = M.batch(id); if (!b) return bad(M.MSG.notfound); if (b.stage !== 'hold' || !b.hold) return bad(M.MSG.jump, 'jump'); b.stage = b.hold.prev; b.ev.push(['resume', nowS(), empId(ctx)]); b.hold = null; M.audit('SPV.RESUME', ctx, { rec: id, batch: id, reason: str(reason) || null }); save(); return { ok: true, batch: b }; };
  M.spvMachine = function (ctx, id, mach, reason) { var g = spv(ctx, id); if (g) return g; return M.changeBatch(ctx, id, { mach: mach, reason: reason }); };
  M.spvAssign = function (ctx, id, emp, reason) { var g = spv(ctx, id); if (g) return g; var b = M.batch(id); if (!b) return bad(M.MSG.notfound); if (!D.STAFF[emp]) return bad(M.MSG.invalid); var from = b.assignee; b.assignee = emp; M.audit('SPV.REASSIGN', ctx, { rec: id, batch: id, from: from, to: emp, reason: str(reason) || null }); save(); return { ok: true, batch: b }; };
  M.spvStaff = function (ctx, emp, team, reason) { var g = spv(ctx, emp); if (g) return g; if (!D.STAFF[emp] || !D.TEAMS[team]) return bad(M.MSG.invalid); if (!str(reason)) return bad(M.MSG.reason, 'reason'); var from = S().moves[emp] || D.STAFF[emp].team; S().moves[emp] = team; M.audit('SPV.ASSIGN_STAFF', ctx, { rec: emp, from: from, to: team, reason: str(reason) }); save(); return { ok: true }; };
  M.spvEscalate = function (ctx, id, reason) { var g = spv(ctx, id); if (g) return g; var b = M.batch(id); if (!b) return bad(M.MSG.notfound); if (!str(reason)) return bad(M.MSG.reason, 'reason'); b.esc = { by: empId(ctx), at: nowS(), reason: str(reason) }; note('opsmgr', 'sla', b.id); M.audit('SPV.ESCALATE', ctx, { rec: id, batch: id, reason: str(reason) }); save(); return { ok: true, batch: b }; };
  M.spvMaint = function (ctx, mach, f) { var g = spv(ctx, mach); if (g) return g; f = f || {}; if (!M.machine(mach)) return bad(M.MSG.notfound); if (!str(f.issue)) return bad(M.MSG.note, 'note'); var w = woNew(ctx, { mach: mach, issue: str(f.issue), sev: M.SEV[f.sev] ? f.sev : 'med', impact: str(f.impact) }); M.audit('SPV.MAINTENANCE', ctx, { rec: w.id, to: mach, note: str(f.issue) }); save(); return { ok: true, wo: w }; };

  /* ---------- NP-10 Command Center: live board, capacity, machines, bottlenecks ---------- */
  function rkg(r) { return r.weigh ? r.weigh.net : r.estKg; }
  M.board = function () {
    var B = S().batches, R = S().rcv, c = S().cfg;
    function bs(list) { return B.filter(function (b) { return list.indexOf(b.stage) >= 0 || (b.stage === 'hold' && b.hold && list.indexOf(b.hold.prev) >= 0); }); }
    var defs = {
      rcv: { q: R.filter(function (r) { return r.stage === 'rcv' && r.st === 'waiting'; }), p: R.filter(function (r) { return r.stage === 'rcv' && r.st !== 'waiting'; }), rec: true },
      sort: { q: R.filter(function (r) { return r.stage === 'wgt' || r.stage === 'sort'; }), p: bs(['ready']).concat(M.lotsOpen()), rec: true },
      wash: { q: bs(['ho12', 'wash_q']), p: bs(['washing']) }, dry: { q: bs(['dry_q']), p: bs(['drying']) },
      fin: { q: bs(['fin_ready', 'ho23', 'fin_q']), p: bs(['finishing']) }, qc: { q: bs(['qc_q']), p: [] }, pack: { q: bs(['pack_q']), p: bs(['packed']) }, rtd: { q: bs(['rtd', 'ho3l']), p: [] }
    };
    var cap = M.capacity();
    return Object.keys(defs).map(function (k) {
      var d = defs[k], all = d.q.concat(d.p), bat = all.filter(function (x) { return x.stage && M.STAGE[x.stage]; });
      var kg = r1(sum(all.map(function (x) { return x.weigh || x.estKg ? rkg(x) : x.kg; })));
      var risk = bat.filter(function (b) { return M.slaState(b) === 'risk'; }).length, late = bat.filter(function (b) { return M.slaState(b) === 'late'; }).length;
      var iss = S().issues.filter(function (i) { return i.st !== 'resolved' && (i.stage === k || (k === 'rcv' && i.stage === 'rcv') || (k === 'pack' && i.stage === 'pack') || (k === 'qc' && i.stage === 'qc')); }).length;
      return { k: k, n: M.BOARD[k], queue: d.q.length, proc: d.p.length, kg: kg, risk: risk, late: late, cap: cap[k] ? cap[k].pct : null, capSt: cap[k] ? cap[k].st : 'ok', issues: iss };
    });
  };
  // Capacity utilization per stage (§48): load (queue + in process) over two hours of stage capacity.
  M.capacity = function () {
    var c = S().cfg, B = S().batches, R = S().rcv, out = {};
    function load(list) { return sum(B.filter(function (b) { return list.indexOf(b.stage) >= 0; }).map(function (b) { return b.kg; })); }
    var wCap = sum(M.washers().filter(machOk).map(function (m) { return m.cap; })) * 2, dCap = sum(M.dryers().filter(machOk).map(function (m) { return m.cap; })) * 120 / 45;
    var finStaff = M.onShift('t3').filter(function (e) { return ['EMP-077', 'EMP-064', 'EMP-061'].indexOf(e) >= 0 || S().moves[e] === 't3'; }).length;
    var finH = c.capH.fin * Math.max(0.5, finStaff) / 1;
    var defs = {
      rcv: [sum(R.filter(function (r) { return r.stage === 'rcv'; }).map(rkg)), c.capH.rcv * 2], sort: [sum(R.filter(function (r) { return r.stage === 'wgt' || r.stage === 'sort'; }).map(rkg)) + sum(M.lotsOpen().map(function (l) { return l.kg; })) + load(['ready']), c.capH.sort * 2],
      wash: [load(['ho12', 'wash_q', 'washing']), wCap], dry: [load(['dry_q', 'drying']), dCap], fin: [load(['fin_ready', 'ho23', 'fin_q', 'finishing']), finH * 2], qc: [load(['qc_q']), c.capH.qc * 2], pack: [load(['pack_q', 'packed']), c.capH.pack * 2]
    };
    Object.keys(defs).forEach(function (k) { var d = defs[k], p = d[1] ? Math.round(d[0] / d[1] * 100) : 0; out[k] = { load: r1(d[0]), cap: r1(d[1]), pct: p, st: p >= c.capCrit ? 'crit' : p >= c.capWarn ? 'warn' : 'ok' }; });
    return out;
  };
  M.machinesLive = function (types) {
    return S().mach.filter(function (m) { return !types || types.indexOf(m.type) >= 0; }).map(function (m) {
      var b = m.batch ? M.batch(m.batch) : null, end = b ? M.runEnd(b) : null, plans = S().plans.filter(function (p) { return p.mach === m.id && p.active; }).sort(function (a, b2) { return ms(a.next) - ms(b2.next); });
      var runMin = runMinutes(m.id), avail = Math.max(1, Math.round((M.now() - ms(D.today + ' 06:00')) / MIN));
      return { m: m, b: b, start: b && b.run ? b.run.start : null, end: end ? isoT(end) : null, util: m.cap && ['washer', 'dryer', 'ironer'].indexOf(m.type) >= 0 ? Math.min(100, Math.round(runMin / avail * 100)) : null, load: b && m.cap ? Math.round(b.kg / m.cap * 100) : null, pm: plans[0] || null, wo: S().wo.filter(function (w) { return w.mach === m.id && w.st !== 'ready'; })[0] || null };
    });
  };
  function runMinutes(machId, from) {
    var t0 = ms(from || D.today + ' 06:00'), now = M.now(), tot = 0;
    S().batches.forEach(function (b) { b.runs.forEach(function (r) { if (r.mach !== machId) return; var a = Math.max(t0, ms(r.start)), z = Math.min(now, r.end ? ms(r.end) : now); if (z > a) tot += (z - a) / MIN; }); });
    return Math.round(tot);
  }
  M.runMinutes = runMinutes;
  // Bottleneck detection (§50): queue growth, utilization, downtime, staff, slow cycle, SLA risk.
  M.insights = function () {
    var c = S().cfg, out = [], cap = M.capacity(), now = M.now();
    Object.keys(cap).forEach(function (k) {
      var x = cap[k], before = D.QHIST.kg[k] || 0, g = before ? Math.round((x.load - before) / before * 100) : 0;
      if (x.pct >= c.capWarn) out.push({ k: 'util', sev: x.st === 'crit' ? 'crit' : 'warn', stage: k, pct: x.pct, growth: g, txt: L(T(M.BOARD[k]) + ' utilisasi ' + x.pct + '%.' + (g >= c.growth ? ' Antrian naik ' + g + '% dalam dua jam terakhir.' : ''), M.BOARD[k][1] + ' utilization ' + x.pct + '%.' + (g >= c.growth ? ' Queue increased ' + g + '% during the last two hours.' : '')) });
      else if (g >= c.growth * 2 && x.load > 40) out.push({ k: 'growth', sev: 'info', stage: k, growth: g, txt: L('Antrian ' + T(M.BOARD[k]) + ' naik ' + g + '% dalam dua jam terakhir.', M.BOARD[k][1] + ' queue increased ' + g + '% during the last two hours.') });
    });
    S().mach.filter(function (m) { return ['error', 'repair'].indexOf(m.st) >= 0 || (m.st === 'maintenance' && ['washer', 'dryer'].indexOf(m.type) >= 0); }).forEach(function (m) {
      var d = S().dt.filter(function (x) { return x.mach === m.id && !x.end; })[0], min = d ? Math.round((now - ms(d.start)) / MIN) : 0;
      out.push({ k: 'down', sev: m.st === 'maintenance' ? 'info' : 'warn', mach: m.id, txt: L(m.id + ' ' + T(M.MACH_ST[m.st][0]).toLowerCase() + (d ? ' sejak ' + d.start.slice(11) + ' (' + min + ' menit)' : '') + '. Kapasitas ' + T(D.MACH_TYPES[m.type][0]).toLowerCase() + ' berkurang ' + m.cap + ' kg.', m.id + ' ' + M.MACH_ST[m.st][0][1].toLowerCase() + (d ? ' since ' + d.start.slice(11) + ' (' + min + ' min)' : '') + '. ' + D.MACH_TYPES[m.type][0][1] + ' capacity down ' + m.cap + ' kg.') });
    });
    ['t1', 't2', 't3'].forEach(function (t) { var on = M.onShift(t).length, need = D.TEAMS[t].need; if (on < need) { var abs = M.teamMembers(t).filter(function (e) { return D.STAFF[e] && D.STAFF[e].absent; }).map(M.first); out.push({ k: 'staff', sev: 'warn', team: t, txt: L(T(D.TEAMS[t].short) + ' kurang ' + (need - on) + ' orang' + (abs.length ? ' (' + abs.join(', ') + ' tidak hadir)' : '') + '.', D.TEAMS[t].short[1] + ' is ' + (need - on) + ' person short' + (abs.length ? ' (' + abs.join(', ') + ' absent)' : '') + '.') }); } });
    S().batches.filter(function (b) { return b.run && M.runEnd(b) && now > M.runEnd(b) + 10 * MIN; }).forEach(function (b) { var over = Math.round((now - M.runEnd(b)) / MIN); out.push({ k: 'slow', sev: 'warn', batch: b.id, txt: L(b.id + ' di ' + b.run.mach + ' lewat ' + over + ' menit dari perkiraan selesai.', b.id + ' on ' + b.run.mach + ' is ' + over + ' min past the expected finish.') }); });
    var risk = S().batches.filter(function (b) { return ['risk', 'late'].indexOf(M.slaState(b)) >= 0; });
    if (risk.length) out.push({ k: 'sla', sev: risk.some(function (b) { return M.slaState(b) === 'late'; }) ? 'crit' : 'warn', batches: risk.map(function (b) { return b.id; }), txt: L(risk.length + ' batch berisiko SLA: ' + risk.map(function (b) { return b.id + ' (' + M.propName(b.prop) + ')'; }).join(', ') + '.', risk.length + ' batches at SLA risk: ' + risk.map(function (b) { return b.id + ' (' + M.propName(b.prop) + ')'; }).join(', ') + '.') });
    var rk = { crit: 0, warn: 1, info: 2 }; return out.sort(function (a, b) { return rk[a.sev] - rk[b.sev]; });
  };
  M.top = function () {
    var B = S().batches.filter(function (b) { return b.stage !== 'merged' && b.stage !== 'handed'; }), bd = M.board();
    return { queue: sum(bd.map(function (x) { return x.queue; })), proc: sum(bd.map(function (x) { return x.proc; })), risk: B.filter(function (b) { return M.slaState(b) === 'risk'; }).length, late: B.filter(function (b) { return M.slaState(b) === 'late'; }).length, rework: M.reworks({ open: true }).length, rtd: B.filter(function (b) { return ['rtd', 'ho3l'].indexOf(b.stage) >= 0; }).length };
  };
  // Data freshness (§89): live when the view refreshed recently; never show stale data as real-time.
  M.fresh = function (fetchedAt) { var age = Math.max(0, Math.round((M.now() - (fetchedAt || S().upd || M.now())) / 1000)); return { age: age, live: age <= 60 }; };
  M.tick = function () { S().upd = M.now(); return S().upd; };

  /* ---------- Traceability (§83) ---------- */
  M.trace = function (id) {
    var b = M.batch(id); if (!b) return null;
    var root0 = b.parent ? M.batch(b.parent) || b : b, rcvs = root0.rcvs.map(M.rcv).filter(Boolean), rows = [];
    function ev(at, k, txt, by0, team, ref) { if (at) rows.push({ at: at, k: k, txt: txt, by: by0, team: team, ref: ref || null }); }
    rcvs.forEach(function (r) {
      if (r.mf) ev(r.arrAt, 'arrive', L('Tiba di plant · ' + r.mf, 'Arrived at the plant · ' + r.mf), r.drv, 'log');
      ev(r.rcvAt, 'rcv', L('Receiving diterima · ' + r.id + (r.dis ? ' (dengan selisih)' : ''), 'Receiving accepted · ' + r.id + (r.dis ? ' (with difference)' : '')), r.rcvBy, 't1', r.id);
      if (r.weigh) ev(r.weigh.at, 'wgt', L('Timbang ' + r.weigh.net + ' kg bersih · ' + r.weigh.scale + (r.weigh.manual ? ' (manual)' : ''), 'Weighed ' + r.weigh.net + ' kg net · ' + r.weigh.scale + (r.weigh.manual ? ' (manual)' : '')), r.weigh.by, 't1', r.id);
      if (r.sort) ev(r.sort.at, 'sort', L('Sorting: ' + Object.keys(r.sort.cats).map(function (k) { return T(D.CATS[k].n) + ' ' + r.sort.cats[k] + ' kg'; }).join(', '), 'Sorting: ' + Object.keys(r.sort.cats).map(function (k) { return D.CATS[k].n[1] + ' ' + r.sort.cats[k] + ' kg'; }).join(', ')), r.sort.by, 't1', r.id);
    });
    if (b.parent) ev(b.created[0], 'rework', L('Batch rework dari ' + b.parent + ' (' + b.rw + ')', 'Rework batch from ' + b.parent + ' (' + b.rw + ')'), b.created[1], 't3');
    else ev(b.created[0], 'batch', L('Batch dibuat · ' + b.kg0 + ' kg · ' + b.mach + ' · ' + b.prog, 'Batch created · ' + b.kg0 + ' kg · ' + b.mach + ' · ' + b.prog), b.created[1], 't1');
    S().ho.filter(function (h) { return h.batch === b.id && h.kind !== 'log1'; }).forEach(function (h) { ev(h.at, 'ho', L('Handover ' + T(M.HO_KIND[h.kind].n) + ' dikirim', 'Handover ' + M.HO_KIND[h.kind].n[1] + ' sent'), h.sender, h.from, h.id); if (h.recAt) ev(h.recAt, 'ho', L('Handover ' + T(M.HO_KIND[h.kind].n) + ' · ' + T(M.HO_ST[h.st][0]), 'Handover ' + M.HO_KIND[h.kind].n[1] + ' · ' + M.HO_ST[h.st][0][1]), h.receiver, h.to, h.id); });
    b.runs.forEach(function (r) {
      var nm = r.k === 'wash' ? L('Cuci', 'Wash') : r.k === 'dry' ? L('Kering', 'Dry') : L('Finishing', 'Finishing'), pn = r.k === 'wash' ? T((D.WASH_PROGS[r.prog] || {}).n) : r.k === 'dry' ? (D.DRY_PROGS[r.prog] ? T(D.DRY_PROGS[r.prog].n) : T((D.DRY_METHODS[r.prog] || [''])[0])) : T((D.FIN_METHODS[r.prog] || [''])[0]);
      ev(r.start, r.k, L(T(nm) + ' mulai · ' + (r.mach || '—') + ' · ' + pn, nm[1] + ' started · ' + (r.mach || '—') + ' · ' + pn), r.op, r.k === 'fin' ? 't3' : 't2');
      if (r.end) ev(r.end, r.k, L(T(nm) + (r.interrupted ? ' dihentikan' : ' selesai'), nm[1] + (r.interrupted ? ' stopped' : ' completed')), r.endBy || r.op, r.k === 'fin' ? 't3' : 't2');
    });
    if (b.qc) ev(b.qc.at, 'qc', L('QC ' + (b.qc.res === 'pass' ? 'lulus ' + b.qc.pass + ' pcs' : 'lulus ' + b.qc.pass + ', masalah ' + b.qc.fail + ' pcs'), 'QC ' + (b.qc.res === 'pass' ? 'passed ' + b.qc.pass + ' pcs' : 'passed ' + b.qc.pass + ', issue ' + b.qc.fail + ' pcs')), b.qc.by, 't3');
    S().rework.filter(function (r) { return r.batch === b.id || r.child === b.id; }).forEach(function (r) { ev(r.at, 'rework', L('Rework ' + r.id + ': ' + T(M.QC_FAIL[r.reason] || r.reason) + ' · ' + r.qty + ' pcs → ' + T(M.RESP[r.resp] || r.resp), 'Rework ' + r.id + ': ' + (M.QC_FAIL[r.reason] || [r.reason, r.reason])[1] + ' · ' + r.qty + ' pcs → ' + (M.RESP[r.resp] || [r.resp, r.resp])[1]), r.op, 't3', r.id); });
    if (b.pack) ev(b.pack.at, 'pack', L('Packing ' + b.pack.pkgs.length + ' paket · ' + packedQty(b) + ' pcs', 'Packed ' + b.pack.pkgs.length + ' packages · ' + packedQty(b) + ' pcs'), b.pack.by, 't3');
    if (b.rtdAt) ev(b.rtdAt[0], 'rtd', L('Siap Kirim (Ready to Deliver)', 'Ready to Deliver'), b.rtdAt[1], 't3');
    if (b.hold) ev(b.hold.at, 'hold', L('Ditahan: ' + b.hold.reason, 'On hold: ' + b.hold.reason), b.hold.by, 'spv');
    S().issues.filter(function (i) { return i.batch === b.id; }).forEach(function (i) { ev(i.at, 'issue', L('Masalah ' + i.id + ': ' + i.note, 'Issue ' + i.id + ': ' + i.note), i.by, i.team, i.id); });
    var o = M.order(b.dlv);
    rows.sort(function (x, y) { return ms(x.at) - ms(y.at); });
    return { b: b, root: root0, rcvs: rcvs, ords: rcvs.map(function (r) { return r.ord; }).filter(Boolean), mfs: rcvs.map(function (r) { return r.mf; }).filter(Boolean), dlv: o, kids: S().batches.filter(function (x) { return x.parent === b.id; }), ho: M.hoTimeline(b.id), rows: rows, machines: b.runs.map(function (r) { return r.mach; }).filter(Boolean), ops: b.runs.map(function (r) { return r.op; }) };
  };

  /* ---------- Production KPI (§52) ---------- */
  M.kpi = function () {
    var now = M.now(), t0 = ms(D.today + ' 06:00'), hrs = Math.max(0.5, (now - t0) / 36e5), B = S().batches, H = D.HIST;
    var washedToday = B.filter(function (b) { return b.runs.some(function (r) { return r.k === 'wash' && r.end && r.end.slice(0, 10) === D.today && !r.interrupted; }); });
    var kg = r1(sum(washedToday.map(function (b) { return b.kg; }))), finToday = B.filter(function (b) { return b.runs.some(function (r) { return r.k === 'fin' && r.end && r.end.slice(0, 10) === D.today; }); }), pcs = sum(finToday.map(function (b) { return b.finQty || b.pcs; }));
    var ops = M.onShift('t1').length + M.onShift('t2').length + M.onShift('t3').length;
    var wd = M.washers().concat(M.dryers()), avail = wd.filter(function (m) { return m.st !== 'offline'; }).length * (now - t0) / MIN, run = sum(wd.map(function (m) { return runMinutes(m.id); }));
    var qcB = B.filter(function (b) { return b.qc && b.qc.at.slice(0, 10) === D.today; }), qcPass = sum(qcB.map(function (b) { return b.qc.pass; })), qcAll = sum(qcB.map(function (b) { return b.qc.qty; }));
    var rwToday = S().rework.filter(function (r) { return r.at.slice(0, 10) === D.today; }), rwKg = sum(rwToday.map(function (r) { return r.kg; }));
    var rtd = B.filter(function (b) { return b.rtdAt && b.rtdAt[0].slice(0, 10) === D.today && !b.parent; }), cyc = rtd.map(function (b) { var r = M.rcv(b.rcvs[0]); return r && r.rcvAt ? (ms(b.rtdAt[0]) - ms(r.rcvAt)) / MIN : null; }).filter(function (x) { return x != null; });
    var downToday = sum(S().dt.map(function (d) { var a = Math.max(t0, ms(d.start)), z = d.end ? ms(d.end) : now; return z > a ? (z - a) / MIN : 0; }));
    var created = B.filter(function (b) { return !b.parent; }), okB = created.filter(function (b) { return !b.ovr && !b.changes && !b.warnNote; });
    var hos = S().ho.filter(function (h) { return h.st !== 'waiting'; }), hoOk = hos.filter(function (h) { return h.st === 'accepted'; });
    var cap = M.capacity(), capAvg = Math.round(sum(Object.keys(cap).map(function (k) { return cap[k].pct; })) / Object.keys(cap).length);
    var late = B.filter(function (b) { return M.slaState(b) === 'late'; }).length, risk = B.filter(function (b) { return M.slaState(b) === 'risk'; }).length;
    return {
      today: { kg: kg, pcs: pcs, perOp: ops ? r1(kg / ops) : 0, perHour: r1(kg / hrs), machUtil: avail ? Math.round(run / avail * 100) : 0, capUtil: capAvg, cycleH: cyc.length ? r1(sum(cyc) / cyc.length / 60) : null, qcPass: qcAll ? pct(qcPass, qcAll) : null, rewash: kg ? pct(rwKg, kg) : (rwKg ? 100 : 0), delay: late, downMin: Math.round(downToday), batchAcc: pct(okB.length, created.length), slaRisk: risk + late, hoAcc: pct(hoOk.length, hos.length), hours: r1(hrs), ops: ops },
      d30: { kg: Math.round(H.kg / H.days), pcs: Math.round(H.pcs / H.days), perOp: r1(H.kg / H.days / 11), perHour: r1(H.kg / H.days / 16), machUtil: pct(H.runMin, H.availMin), cycleH: r1(H.cycleMin / 60), qcPass: pct(H.qcPass, H.qcPass + H.qcFail), rewash: pct(H.rwKg, H.kg), delay: H.late, downMin: H.downMin, batchAcc: pct(H.okBatches, H.batches), hoAcc: pct(H.hoOk, H.ho) }
    };
  };
  // §53: what each production number feeds in the Phase 5 Ambidex engine.
  M.ambidex = function () {
    var k = M.kpi(), rc = M.rootCause();
    return [
      { to: L('Daily Race', 'Daily Race'), line: L('Kg diproses hari ini', 'Kg processed today'), v: k.today.kg + ' kg', src: 'PROD-KPI' },
      { to: L('Weekly Race', 'Weekly Race'), line: L('Rata-rata kg per hari (30 hari)', 'Average kg per day (30 days)'), v: k.d30.kg + ' kg', src: 'PROD-KPI' },
      { to: 'R2RE', line: L('Rewash rate · R2-RWS', 'Rewash rate · R2-RWS'), v: k.d30.rewash + '%', src: 'QC' },
      { to: 'R2RE', line: L('Uptime mesin · R2-UPT', 'Machine uptime · R2-UPT'), v: M.mntMetrics().avail + '%', src: 'MNT' },
      { to: L('Teamwork Score', 'Teamwork Score'), line: L('Utilisasi washing, uptime dryer, rewash QC, akurasi packing', 'Washing utilisation, dryer uptime, QC rewash, packing accuracy'), v: k.today.machUtil + '% · ' + k.d30.qcPass + '%', src: 'PROD-KPI' },
      { to: L('Personal Score', 'Personal Score'), line: L('Output, kualitas lulus, ketepatan waktu per operator', 'Output, quality pass, timeliness per operator'), v: M.onShift('t1').length + M.onShift('t2').length + M.onShift('t3').length + ' ' + T(L('operator', 'operators')), src: 'PROD' },
      { to: 'XScore', line: L('Operasional: SLA & produktivitas', 'Operations: SLA & productivity'), v: k.today.perHour + ' kg/' + T(L('jam', 'h')), src: 'PROD-KPI' },
      { to: L('Monthly Reflection', 'Monthly Reflection'), line: L('Akar masalah rework per tahap', 'Rework root cause per stage'), v: Object.keys(rc.stage).map(function (s0) { return T(M.RESP[s0] || [s0]) + ' ' + rc.stage[s0]; }).join(' · '), src: 'QC' },
      { to: L('Checklist → Compliance', 'Checklist → Compliance'), line: L('Kepatuhan checklist', 'Checklist compliance'), v: M.chkKpi().compliance + '%', src: 'CHK' }
    ];
  };
  // Phase 5 feed (§53): production people's Personal Score lines and team KPI actuals, computed — never typed in again.
  M.perfFeed = function (P) {
    if (!P || !P.D || !P.D.PEOPLE) return 0;
    var n = 0, k = M.kpi(), H = D.PEOPLE8, today = S().batches;
    P.D.PEOPLE.forEach(function (p) {
      var h = H[p.id]; if (!h || !p.ind) return;
      if (p.role === 'rcv') { var mine = S().rcv.filter(function (r) { return r.rcvBy === p.id && r.rcvAt && r.rcvAt.slice(0, 10) === D.today; }), err = mine.filter(function (r) { return r.weigh && r.weigh.manual; }).length; p.ind = [pct(h.ok + mine.length - err, h.ok + h.err + mine.length), r1((h.kg + sum(mine.map(rkg))) / h.hours / 1), pct(h.onTime + mine.length, h.tasks + mine.length), pct(h.err + err, h.ok + h.err + mine.length), p.ind[4]]; }
      else if (p.role === 'qc') { var dec = today.filter(function (b) { return b.qc && b.qc.by === p.id && b.qc.at.slice(0, 10) === D.today; }); p.ind = [pct(h.correct + dec.length, h.checks + dec.length), h.rw, p.ind[2], h.turn, p.ind[4]]; }
      else if (p.role === 'prod') { var runs = 0; today.forEach(function (b) { b.runs.forEach(function (r) { if (r.op === p.id && r.end && r.end.slice(0, 10) === D.today) runs++; }); }); p.ind = [r1(h.out + runs * 0.2), h.pass, h.onTime, p.ind[3], p.ind[4]]; }
      else return;
      p.src8 = M.version; n++;
    });
    (P.D.TEAMS || []).forEach(function (t) {
      (t.kpis || []).forEach(function (x) {
        if (x.code === 'T-WSH-01') { x.actual = k.today.machUtil || x.actual; x.src8 = true; }
        if (x.code === 'T-QC-02') { x.actual = k.d30.rewash; x.src8 = true; }
        if (x.code === 'T-DRY-01') { x.actual = M.mntMetrics('dryer').avail; x.src8 = true; }
      });
    });
    return n;
  };

  /* ---------- NP-11 Daily Operational Checklist ---------- */
  function verAt(t, date) { return t.versions.filter(function (v) { return !v.draft && v.eff <= date && (!v.until || v.until >= date); }).sort(function (a, b) { return b.v - a.v; })[0] || null; }
  M.verAt = verAt;
  function dueOn(t, date) { var d = new Date(ms(date)); if (t.active === false) return false; if (t.freq === 'weekly') return d.getUTCDay() === t.day; if (t.freq === 'monthly') return d.getUTCDate() === t.day; return true; }
  function genChecklists(s, date) {
    s.tpl.forEach(function (t) {
      if (!dueOn(t, date) || s.chk.some(function (c) { return c.tpl === t.id && c.date === date; })) return;
      var v = verAt(t, date); if (!v) return;
      var cfg = v.cfg || {};
      s.chk.push({ id: 'CL-' + date.replace(/-/g, '') + '-' + t.id.slice(4), tpl: t.id, v: v.v, date: date, tab: cfg.tab || t.tab, team: cfg.team || t.team, win: cfg.win || t.win, approve: cfg.approve != null ? cfg.approve : t.approve, items: v.items.filter(function (i) { return i.active !== false; }).map(function (i) { return { code: i.code, st: 'pending', val: null, photo: null, note: '', by: null, at: null, issue: null }; }), st: 'open', log: [] });
    });
  }
  M.genChecklists = function (date) { genChecklists(S(), date || D.today); save(); };
  function itemDef(s, c, code) { var t = by(s.tpl, 'id', c.tpl), v = by(t.versions, 'v', c.v); return by(v.items, 'code', code); }
  M.itemDef = function (c, code) { return itemDef(S(), c, code); };
  M.chkTabsFor = function (ctx) { var t = M.teamOf(ctx); if (t === 'all' || can(ctx, 'chk.approve') || can(ctx, 'prod.cmd')) return Object.keys(M.CHK_TABS); if (t === 'mnt') return ['opening', 'closing']; return t && M.CHK_TABS[t] ? ['opening', t, 'closing'] : []; };
  M.chkToday = function (ctx, tab, date) {
    date = date || D.today; genChecklists(S(), date);
    var tabs = M.chkTabsFor(ctx); if (tab && tabs.indexOf(tab) < 0) return null;
    var list = S().chk.filter(function (c) { return c.date === date && (!tab || c.tab === tab) && tabs.indexOf(c.tab) >= 0; });
    return { list: list, sum: chkSum(list, date) };
  };
  M.itemOverdue = function (c, it) { return it.st === 'pending' && M.now() > ms(c.date + ' ' + c.win[1]); };
  function chkSum(list) {
    var tot = 0, done = 0, issue = 0, over = 0;
    list.forEach(function (c) { c.items.forEach(function (it) { var d = itemDef(S(), c, it.code); if (d.type === 'approval') return; tot++; if (it.st === 'done') done++; if (it.st === 'issue') issue++; if (M.itemOverdue(c, it)) over++; }); });
    return { total: tot, done: done, pending: tot - done - issue, issue: issue, overdue: over, pct: tot ? Math.round((done + issue) / tot * 100) : 0 };
  }
  M.chkSum = chkSum;
  function chkGuard(ctx, c, perm) { if (!c) return bad(M.MSG.notfound); if (!can(ctx, perm)) return deny(ctx, c.id); if (M.chkTabsFor(ctx).indexOf(c.tab) < 0) return bad(M.MSG.team, 'team'); return null; }
  // SELESAI (§60): the required value / evidence per input type (§58).
  M.chkDo = function (ctx, id, code, f) {
    var c = M.chkInst(id), g = chkGuard(ctx, c, 'chk.do'); if (g) return g;
    if (['approved', 'done'].indexOf(c.st) >= 0 || (c.st !== 'open' && c.st !== 'returned')) return bad(L('Checklist sudah dikirim.', 'The checklist has been submitted.'), 'jump');
    var it = by(c.items, 'code', code), d = itemDef(S(), c, code); if (!it) return bad(M.MSG.notfound); f = f || {};
    var val = null;
    if (d.type === 'approval') return bad(L('Item ini disetujui supervisor saat APPROVE.', 'This item is approved by the supervisor at APPROVE.'), 'approval');
    if (d.type === 'check') val = true;
    if (d.type === 'num') { val = Number(String(f.val).replace(',', '.')); if (f.val === '' || f.val == null || isNaN(val)) return bad(L('Isi nilai angka.', 'Enter a number.'), 'val'); if ((d.min != null && val < d.min) || (d.max != null && val > d.max)) return bad(L('Nilai ' + val + ' ' + d.unit + ' di luar batas normal (' + d.min + '–' + d.max + '). Pilih ADA MASALAH.', 'Value ' + val + ' ' + d.unit + ' is outside the normal range (' + d.min + '–' + d.max + '). Choose ADA MASALAH.'), 'range'); }
    if (d.type === 'text') { val = str(f.val); if (!val) return bad(L('Isi jawaban.', 'Enter an answer.'), 'val'); }
    if (d.type === 'select') { val = f.val; if (!d.opts.some(function (o) { return o[0] === val; })) return bad(L('Pilih salah satu.', 'Choose one.'), 'val'); if (d.bad && (val === d.bad || val === 'out')) return bad(L('Status ini perlu dilaporkan. Pilih ADA MASALAH.', 'This status needs to be reported. Choose ADA MASALAH.'), 'badopt'); }
    if (d.type === 'photo_req' && !f.photo) return bad(M.MSG.photo, 'photo');
    if (d.type === 'notes_req') { val = str(f.note || f.val); if (!val) return bad(M.MSG.note, 'note'); }
    it.st = 'done'; it.val = val; it.photo = f.photo || it.photo || null; it.note = str(f.note); it.by = opOf(ctx, f, c.tab); it.at = nowS(); it.late = M.now() > ms(c.date + ' ' + c.win[1]); it.ret = null;
    M.audit('CHECKLIST.ITEM', ctx, { rec: c.id, to: code }); save(); return { ok: true, inst: c, item: it };
  };
  // ADA MASALAH on a checklist item (§61): issue → evidence → notes → follow-up.
  M.chkIssue = function (ctx, id, code, f) {
    var c = M.chkInst(id), g = chkGuard(ctx, c, 'chk.do'); if (g) return g;
    if (c.st !== 'open' && c.st !== 'returned') return bad(L('Checklist sudah dikirim.', 'The checklist has been submitted.'), 'jump');
    var it = by(c.items, 'code', code), d = itemDef(S(), c, code); if (!it) return bad(M.MSG.notfound); f = f || {};
    if (!str(f.note)) return bad(M.MSG.note, 'note'); if (!M.CHK_FOLLOW[f.follow]) return bad(L('Pilih tindak lanjut.', 'Choose a follow-up.'), 'follow');
    var follow = null, mach = f.mach || d.mach;
    if (f.follow === 'maint') { if (!mach) return bad(L('Pilih mesin.', 'Choose a machine.'), 'mach'); var w = woNew(ctx, { mach: mach, issue: T(d.n) + ' · ' + str(f.note), sev: f.sev || 'med', src: c.id }); follow = w.id; }
    else { var i = issueNew(ctx, { type: d.cat === 'stock' ? 'chemical' : d.cat === 'equip' ? 'breakdown' : 'other', stage: d.area, team: c.tab, mach: mach || null, sev: f.sev || (d.cat === 'safety' ? 'high' : 'low'), note: T(d.n) + ' · ' + str(f.note), photo: f.photo, action: f.follow === 'review' ? 'review' : 'continue', chk: code }); follow = i.id; }
    it.st = 'issue'; it.val = f.val != null ? f.val : it.val; it.photo = f.photo || null; it.note = str(f.note); it.by = opOf(ctx, f, c.tab); it.at = nowS(); it.issue = follow; it.follow = f.follow;
    M.audit('CHECKLIST.ISSUE', ctx, { rec: c.id, to: code, note: str(f.note), reason: f.follow }); save(); return { ok: true, inst: c, item: it, follow: follow };
  };
  // Operator complete → Team Leader review → Supervisor approval (§62).
  M.chkSubmit = function (ctx, id, f) {
    var c = M.chkInst(id), g = chkGuard(ctx, c, 'chk.do'); if (g) return g;
    if (c.st !== 'open' && c.st !== 'returned') return bad(M.MSG.jump, 'jump');
    var missing = c.items.filter(function (it) { var d = itemDef(S(), c, it.code); return d.type !== 'approval' && d.mand && it.st === 'pending'; });
    if (missing.length) return bad(L('Masih ' + missing.length + ' item wajib belum selesai.', missing.length + ' mandatory items are not done yet.'), 'missing', { missing: missing.map(function (x) { return x.code; }) });
    c.st = c.approve ? 'submitted' : 'done'; c.log.push(['submitted', nowS(), opOf(ctx, f, c.tab)]);
    M.audit('CHECKLIST.COMPLETED', ctx, { rec: c.id, to: c.st }); save(); return { ok: true, inst: c };
  };
  M.chkLead = function (ctx, id) {
    var c = M.chkInst(id), g = chkGuard(ctx, c, 'chk.lead'); if (g) return g;
    if (c.st !== 'submitted') return bad(M.MSG.jump, 'jump');
    c.st = 'lead_ok'; c.log.push(['lead_ok', nowS(), empId(ctx)]); M.audit('CHECKLIST.LEAD', ctx, { rec: c.id }); save(); return { ok: true, inst: c };
  };
  M.chkApprove = function (ctx, id, note0) {
    var c = M.chkInst(id); if (!c) return bad(M.MSG.notfound); if (!can(ctx, 'chk.approve')) return deny(ctx, id);
    if (c.st !== 'lead_ok') return bad(c.st === 'submitted' ? L('Menunggu review team leader dulu.', 'Waiting for the team leader review first.') : M.MSG.jump, 'jump');
    c.items.forEach(function (it) { var d = itemDef(S(), c, it.code); if (d.type === 'approval') { it.st = 'done'; it.val = true; it.by = empId(ctx); it.at = nowS(); it.note = str(note0); } });
    c.st = 'approved'; c.log.push(['approved', nowS(), empId(ctx), str(note0)]);
    M.audit('CHECKLIST.APPROVED', ctx, { rec: c.id, note: str(note0) }); save(); return { ok: true, inst: c };
  };
  M.chkReturn = function (ctx, id, code, note0) {
    var c = M.chkInst(id); if (!c) return bad(M.MSG.notfound); if (!can(ctx, 'chk.approve') && !can(ctx, 'chk.lead')) return deny(ctx, id);
    if (['submitted', 'lead_ok'].indexOf(c.st) < 0) return bad(M.MSG.jump, 'jump'); if (!str(note0)) return bad(M.MSG.reason, 'reason');
    var it = by(c.items, 'code', code); if (!it) return bad(M.MSG.notfound);
    it.st = 'pending'; it.ret = { by: empId(ctx), at: nowS(), note: str(note0), prev: it.val }; it.val = null;
    c.st = 'returned'; c.log.push(['returned', nowS(), empId(ctx), code + ': ' + str(note0)]);
    M.audit('CHECKLIST.RETURN', ctx, { rec: c.id, to: code, reason: str(note0) }); save(); return { ok: true, inst: c };
  };
  M.chkPending = function (ctx) { return S().chk.filter(function (c) { return ['submitted', 'lead_ok'].indexOf(c.st) >= 0 && M.chkTabsFor(ctx).indexOf(c.tab) >= 0; }); };
  /* Checklist master (§56) & versioning (§63): published versions are never edited; changes go into a draft version with an effective date. */
  M.templates = function () { return S().tpl; };
  M.tplLatest = function (t) { return t.versions.filter(function (v) { return !v.draft; }).sort(function (a, b) { return b.v - a.v; })[0]; };
  M.tplDraft = function (ctx, id, create) {
    var t = M.tpl(id); if (!t) return null; var d = t.versions.filter(function (v) { return v.draft; })[0];
    if (d || !create) return d || null; if (!can(ctx, 'chk.master')) return null;
    var last = M.tplLatest(t); d = { v: Math.max.apply(null, t.versions.map(function (v) { return v.v; })) + 1, eff: null, until: null, draft: true, items: clone(last.items), by: empId(ctx), at: nowS(), note: '', cfg: clone(last.cfg || { tab: t.tab, team: t.team, win: t.win, approve: t.approve, pic: t.pic, freq: t.freq }) };
    t.versions.push(d); save(); return d;
  };
  M.tplSaveItem = function (ctx, id, f) {
    if (!can(ctx, 'chk.master')) return deny(ctx, id); var t = M.tpl(id); if (!t) return bad(M.MSG.notfound);
    f = f || {}; if (!str(f.n)) return bad(L('Isi nama item.', 'Enter the item name.'), 'n'); if (!M.CHK_INPUT[f.type]) return bad(L('Pilih tipe input.', 'Choose the input type.'), 'type');
    if (f.type === 'num' && !(+f.max > +f.min)) return bad(L('Isi batas bawah dan atas.', 'Enter the low and high limits.'), 'range');
    var opts = null; if (f.type === 'select') { opts = String(f.opts || '').split(/[,\n]/).map(str).filter(Boolean).map(function (x, i) { return [i === 0 ? 'ok' : i === 1 ? 'low' : 'o' + i, L(x, x)]; }); if (opts.length < 2) return bad(L('Isi minimal 2 pilihan, dipisah koma.', 'Enter at least 2 options, comma-separated.'), 'opts'); }
    var d = M.tplDraft(ctx, id, true), it = f.code ? by(d.items, 'code', f.code) : null;
    var base = { n: L(str(f.n), str(f.n)), ins: L(str(f.ins), str(f.ins)), cat: M.CHK_CAT[f.cat] ? f.cat : 'ops', area: M.CHK_AREA[f.area] ? f.area : 'all', type: f.type, mand: f.mand !== false && f.mand !== 'false', active: true, esc: 'spv', unit: f.type === 'num' ? str(f.unit) : undefined, min: f.type === 'num' ? +f.min : undefined, max: f.type === 'num' ? +f.max : undefined, opts: opts || undefined, bad: opts ? 'low' : undefined, mach: f.mach || null };
    if (it) { var keepN = it.n, keepI = it.ins; Object.assign(it, base); if (str(f.n) === T(keepN)) it.n = keepN; if (str(f.ins) === T(keepI)) it.ins = keepI; }
    else { var pre = t.id.slice(4), n = d.items.length + 1, code; do { code = pre + '-' + String(n++).padStart(2, '0'); } while (by(d.items, 'code', code)); it = Object.assign({ code: code }, base); var appr = d.items.map(function (x) { return x.type; }).indexOf('approval'); if (appr >= 0) d.items.splice(appr, 0, it); else d.items.push(it); }
    M.audit('CHECKLIST.TEMPLATE', ctx, { rec: t.id, to: 'v' + d.v + ' ' + it.code, note: T(it.n) }); save(); return { ok: true, draft: d, item: it };
  };
  M.tplMove = function (ctx, id, code, dir) { if (!can(ctx, 'chk.master')) return deny(ctx, id); var d = M.tplDraft(ctx, id, true); if (!d) return bad(M.MSG.notfound); var i = d.items.map(function (x) { return x.code; }).indexOf(code), j = i + (dir < 0 ? -1 : 1); if (i < 0 || j < 0 || j >= d.items.length) return bad(M.MSG.invalid); var x = d.items[i]; d.items[i] = d.items[j]; d.items[j] = x; save(); return { ok: true, draft: d }; };
  M.tplToggle = function (ctx, id, code) { if (!can(ctx, 'chk.master')) return deny(ctx, id); var d = M.tplDraft(ctx, id, true); var it = d && by(d.items, 'code', code); if (!it) return bad(M.MSG.notfound); it.active = it.active === false; M.audit('CHECKLIST.TEMPLATE', ctx, { rec: id, to: code + (it.active ? ' on' : ' off') }); save(); return { ok: true, draft: d, item: it }; };
  M.tplSettings = function (ctx, id, f) { if (!can(ctx, 'chk.master')) return deny(ctx, id); var d = M.tplDraft(ctx, id, true); if (!d) return bad(M.MSG.notfound); f = f || {}; if (f.win && !(f.win[0] < f.win[1])) return bad(L('Jam mulai harus lebih awal.', 'The start time must be earlier.'), 'win'); d.cfg = Object.assign(d.cfg || {}, { tab: M.CHK_TABS[f.tab] ? f.tab : d.cfg.tab, team: f.team || d.cfg.team, win: f.win || d.cfg.win, approve: f.approve != null ? !!f.approve : d.cfg.approve, pic: M.CHK_PIC[f.pic] ? f.pic : d.cfg.pic, freq: f.freq || d.cfg.freq }); save(); return { ok: true, draft: d }; };
  M.tplPublish = function (ctx, id, eff, note0) {
    if (!can(ctx, 'chk.master')) return deny(ctx, id); var t = M.tpl(id), d = t && t.versions.filter(function (v) { return v.draft; })[0]; if (!d) return bad(M.MSG.notfound);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(eff || '') || eff <= D.today) return bad(L('Tanggal berlaku harus setelah hari ini. Riwayat lama tetap di versi lama.', 'The effective date must be after today. Past records stay on the old version.'), 'eff');
    t.versions.filter(function (v) { return !v.draft && (!v.until || v.until >= eff); }).forEach(function (v) { if (v.eff >= eff) { v.until = addDays(v.eff, -1); v.superseded = true; } else v.until = addDays(eff, -1); });
    d.draft = false; d.eff = eff; d.until = null; d.by = empId(ctx); d.at = nowS(); d.note = str(note0);
    if (d.cfg) { t.win = t.win; }
    M.audit('CHECKLIST.TEMPLATE', ctx, { rec: id, to: 'v' + d.v + ' @ ' + eff, note: str(note0) }); save(); return { ok: true, version: d };
  };
  M.tplNew = function (ctx, f) {
    if (!can(ctx, 'chk.master')) return deny(ctx, 'TPL'); f = f || {}; if (!str(f.n)) return bad(L('Isi nama checklist.', 'Enter the checklist name.'), 'n'); if (!M.CHK_TYPES[f.kind]) return bad(M.MSG.invalid, 'kind');
    var id = 'TPL-C' + String(S().tpl.length + 1).padStart(2, '0'), tab = M.CHK_TABS[f.tab] ? f.tab : 't1';
    var t = { id: id, n: L(str(f.n), str(f.n)), kind: f.kind, tab: tab, team: tab, freq: f.kind === 'weekly' ? 'weekly' : f.kind === 'monthly' ? 'monthly' : 'daily', day: f.kind === 'weekly' ? 1 : f.kind === 'monthly' ? 1 : undefined, win: [f.w0 || '07:00', f.w1 || '09:00'], pic: 'op', approve: !!f.approve, versions: [] };
    t.versions.push({ v: 1, eff: null, until: null, draft: true, items: [], by: empId(ctx), at: nowS(), note: '', cfg: { tab: tab, team: tab, win: t.win, approve: t.approve, pic: 'op', freq: t.freq } });
    S().tpl.push(t); M.audit('CHECKLIST.TEMPLATE', ctx, { rec: id, to: 'new' }); save(); return { ok: true, tpl: t };
  };
  // Checklist KPI (§64), 30-day baseline + today.
  M.chkKpi = function () {
    var H = D.CHK_HIST, today = S().chk.filter(function (c) { return c.date === D.today; }), sm = chkSum(today);
    var opn = today.filter(function (c) { return c.tpl === 'TPL-OPN'; })[0], cls = today.filter(function (c) { return c.tpl === 'TPL-CLS'; })[0];
    var eqAll = 0, eqOk = 0, late = 0, doneN = 0;
    today.forEach(function (c) { c.items.forEach(function (it) { var d = itemDef(S(), c, it.code); if (d.cat === 'equip') { eqAll++; if (it.st === 'done') eqOk++; } if (it.st === 'done') { doneN++; if (it.late) late++; } }); });
    var crit = S().issues.filter(function (i) { return i.chk && i.at.slice(0, 10) === D.today && (i.sev === 'high' || i.sev === 'crit'); }).length + S().wo.filter(function (w) { return /^CL-/.test(w.src || '') && (w.sev === 'high' || w.sev === 'crit'); }).length;
    return {
      opening: opn ? (['approved'].indexOf(opn.st) >= 0 ? 100 : chkSum([opn]).pct) : null, closing: cls ? (cls.st === 'approved' ? 100 : chkSum([cls]).pct) : null,
      opening30: pct(H.opening, H.days), closing30: pct(H.closing, H.days), ontime: pct(H.ontime * 40 + (doneN - late), H.days * 40 + doneN), crit: H.crit + crit,
      equip: pct(H.equipOk + eqOk, H.equipAll + eqAll), compliance: pct(H.done + sm.done + sm.issue, H.mand + sm.total), today: sm
    };
  };

  /* ---------- NP-12 Preventive Maintenance & Machine Care ---------- */
  M.SOP = D.SOP;
  M.sopItem = function (mach, code) { var m = M.machine(mach); if (code === 'U1') { var p = S().plans.filter(function (x) { return x.mach === mach && x.custom; })[0]; return { code: 'U1', n: p ? p.custom : L('Servis berkala', 'Periodic service'), danger: true }; } return m ? by(D.SOP[m.type] || [], 'code', code) : null; };
  M.taskSt = function (t) {
    if (['completed', 'inprogress', 'issue'].indexOf(t.st) >= 0) return t.st;
    var d = dayDiff(D.today, t.date); return d < 0 ? 'overdue' : d === 0 ? 'duetoday' : d <= S().cfg.soon ? 'duesoon' : 'scheduled';
  };
  M.remLevel = function (t) { if (['completed'].indexOf(t.st) >= 0) return null; var d = dayDiff(D.today, t.date), p = M.plan(t.plan), rem = p && p.rem || S().cfg.rem; if (d < 0) return 'overdue'; if (d === 0) return 'today'; if (d <= 1 && rem.indexOf(1) >= 0) return 'h1'; if (d <= 3 && rem.indexOf(3) >= 0) return 'h3'; if (d <= 7 && rem.indexOf(7) >= 0) return 'h7'; return null; };
  M.tasks = function (f) { f = f || {}; return S().tasks.filter(function (t) { return (!f.mach || t.mach === f.mach) && (!f.st || M.taskSt(t) === f.st) && (!f.open || t.st !== 'completed'); }).sort(function (a, b) { return ms(a.date) - ms(b.date) || a.mach.localeCompare(b.mach); }); };
  M.reminders = function () { return S().tasks.map(function (t) { return { t: t, lv: M.remLevel(t) }; }).filter(function (x) { return x.lv; }).sort(function (a, b) { return ms(a.t.date) - ms(b.t.date); }); };
  M.mntDash = function () {
    var T0 = S().tasks;
    return { dueToday: T0.filter(function (t) { return M.taskSt(t) === 'duetoday'; }).length, dueSoon: T0.filter(function (t) { return M.taskSt(t) === 'duesoon'; }).length, overdue: T0.filter(function (t) { return M.taskSt(t) === 'overdue'; }).length,
      completed: T0.filter(function (t) { return t.st === 'completed' && t.at && t.at.slice(0, 10) === D.today; }).length, issue: S().wo.filter(function (w) { return w.st !== 'ready'; }).length, under: S().mach.filter(function (m) { return ['maintenance', 'repair', 'error'].indexOf(m.st) >= 0; }).length };
  };
  // Calendar occurrences of each plan in a date range (§68).
  M.calendar = function (from, days) {
    var to = addDays(from, days - 1), out = [];
    S().plans.forEach(function (p) {
      if (!p.active) return;
      var task = S().tasks.filter(function (t) { return t.plan === p.id && t.st !== 'completed'; })[0];
      if (!p.every) { if (task && task.date >= from && task.date <= to) out.push({ date: task.date, plan: p, task: task }); return; }
      if (p.freq === 'daily' && days > 7) return;
      for (var d = task ? task.date : p.next, k = 0; d <= to && k < 60; d = addDays(d, p.every), k++) if (d >= from) out.push({ date: d, plan: p, task: k === 0 ? task : null });
    });
    S().tasks.filter(function (t) { return t.st === 'completed' && t.date >= from && t.date <= to && !(t.freq === 'daily' && days > 7); }).forEach(function (t) { out.push({ date: t.date, plan: M.plan(t.plan), task: t }); });
    return out.sort(function (a, b) { return ms(a.date) - ms(b.date) || a.plan.mach.localeCompare(b.plan.mach); });
  };
  function mntGuard(ctx, t, perm) { if (!t) return bad(M.MSG.notfound); if (!can(ctx, perm || 'mnt.do')) return deny(ctx, t.id); return null; }
  M.mntStart = function (ctx, id, f) {
    var t = M.task(id), g = mntGuard(ctx, t); if (g) return g;
    if (t.st !== 'scheduled') return bad(M.MSG.jump, 'jump'); if (dayDiff(D.today, t.date) > S().cfg.soon) return bad(L('Belum jadwalnya.', 'Not scheduled yet.'), 'early');
    var m = M.machine(t.mach); if (m.batch) return bad(L(m.id + ' sedang dipakai batch ' + m.batch + '. Tunggu selesai.', m.id + ' is running batch ' + m.batch + '. Wait until it finishes.'), 'busy');
    var stop = t.freq !== 'daily' && ['washer', 'dryer', 'ironer', 'iron', 'boiler'].indexOf(m.type) >= 0;
    t.st = 'inprogress'; t.start = nowS(); t.by = opOf(ctx, f, 'mnt');
    if (stop && ['normal', 'idle'].indexOf(m.st) >= 0) { m.st = 'maintenance'; S().dt.push({ id: nid('dt', 'DT-2610-', 2), mach: m.id, start: t.start, end: null, reason: T(L('Preventive maintenance ', 'Preventive maintenance ')) + T(D.FREQ[t.freq][0]), kind: 'planned', batch: null, impact: '', task: t.id }); }
    M.audit('MAINTENANCE.STARTED', ctx, { rec: t.id, to: t.mach }); save(); return { ok: true, task: t };
  };
  M.mntSave = function (ctx, id, f) {
    var t = M.task(id), g = mntGuard(ctx, t); if (g) return g; if (t.st !== 'inprogress') return bad(M.MSG.jump, 'jump');
    f = f || {}; Object.keys(f.items || {}).forEach(function (code) { var it = by(t.items, 'code', code), v = f.items[code]; if (!it) return; if (v.ok != null) it.ok = v.ok === true || v.ok === 'ok'; if (v.note != null) it.note = str(v.note); if (v.val != null) it.val = v.val; });
    if (f.parts != null) t.parts = str(f.parts); if (f.notes != null) t.notes = str(f.notes); if (f.photo) t.photo = f.photo;
    save(); return { ok: true, task: t };
  };
  M.mntComplete = function (ctx, id, f) {
    var t = M.task(id), g = mntGuard(ctx, t); if (g) return g; if (t.st !== 'inprogress') return bad(M.MSG.jump, 'jump');
    M.mntSave(ctx, id, f); f = f || {};
    var open = t.items.filter(function (it) { return it.ok == null; }); if (open.length) return bad(L('Masih ' + open.length + ' langkah SOP belum dicek.', open.length + ' SOP steps are not checked yet.'), 'open');
    var failed = t.items.filter(function (it) { return it.ok === false; });
    if (failed.length && failed.some(function (it) { return !it.note; }) && !str(f.notes)) return bad(L('Tulis catatan untuk langkah yang bermasalah.', 'Write a note for the failed steps.'), 'note');
    var m = M.machine(t.mach), p = M.plan(t.plan);
    t.st = 'completed'; t.at = nowS(); t.by = t.by || empId(ctx); t.result = failed.length ? 'issue' : 'ok';
    if (failed.length) { var w = woNew(ctx, { mach: m.id, issue: failed.map(function (it) { var s0 = M.sopItem(m.id, it.code); return T(s0 ? s0.n : it.code) + (it.note ? ': ' + it.note : ''); }).join('; '), sev: f.sev || 'med', src: t.id }); t.wo = w.id; }
    S().dt.filter(function (d) { return d.task === t.id && !d.end; }).forEach(function (d) { d.end = nowS(); });
    if (m.st === 'maintenance' && !S().wo.some(function (w) { return w.mach === m.id && w.st !== 'ready' && ['high', 'crit'].indexOf(w.sev) >= 0; })) m.st = 'normal';
    S().mhist.unshift(histOf(t));
    if (p) { p.last = D.today; if (p.every) p.next = addDays(D.today, p.every); else { if (p.freq === 'hours') p.at = m.hours; else p.at = m.cycles; p.left = p.every; p.next = addDays(D.today, Math.round(p.every / (p.freq === 'hours' ? 12 : 20))); } mkTask(S(), p); }
    M.audit('MAINTENANCE.COMPLETED', ctx, { rec: t.id, to: t.mach, note: t.result }); save(); return { ok: true, task: t, wo: t.wo ? M.wo(t.wo) : null };
  };
  M.history = function (mach) { return S().mhist.filter(function (h) { return !mach || h.mach === mach; }); };
  M.planSet = function (ctx, id, f) {
    var p = M.plan(id); if (!p) return bad(M.MSG.notfound); if (!can(ctx, 'mnt.manage')) return deny(ctx, id); f = f || {};
    if (f.next) { if (!/^\d{4}-\d{2}-\d{2}$/.test(f.next) || f.next < D.today) return bad(L('Tanggal tidak boleh di masa lalu.', 'The date cannot be in the past.'), 'date'); if (!str(f.reason)) return bad(M.MSG.reason, 'reason'); var from = p.next; p.next = f.next; S().tasks.filter(function (t) { return t.plan === p.id && t.st === 'scheduled'; }).forEach(function (t) { t.date = f.next; }); M.audit('MAINTENANCE.RESCHEDULE', ctx, { rec: id, from: from, to: f.next, reason: str(f.reason) }); }
    if (f.pic && D.STAFF[f.pic]) { p.pic = f.pic; S().tasks.filter(function (t) { return t.plan === p.id && t.st !== 'completed'; }).forEach(function (t) { t.pic = f.pic; }); }
    if (f.rem) p.rem = f.rem.map(Number).filter(function (x) { return [7, 3, 1].indexOf(x) >= 0; });
    save(); return { ok: true, plan: p };
  };
  /* Work orders (§74–§75): Issue Found → Work Order → Repair → Test → Supervisor Verification → Ready for Service. */
  function woNew(ctx, f) {
    var m = M.machine(f.mach), w = { id: nid('wo', 'WO-2610-', 2), mach: f.mach, issue: f.issue, sev: f.sev || 'med', at: nowS(), by: empId(ctx), batch: f.batch || null, impact: f.impact || '', tech: null, st: 'open', repStart: null, repEnd: null, parts: '', notes: '', ev: [], result: null, src: f.src || null, log: [['open', nowS(), empId(ctx)]] };
    S().wo.unshift(w);
    if (m && ['high', 'crit'].indexOf(w.sev) >= 0) { if (['normal', 'idle', 'running', 'maintenance'].indexOf(m.st) >= 0) m.st = 'error'; if (!S().dt.some(function (d) { return d.mach === m.id && !d.end && d.kind === 'breakdown'; })) S().dt.push({ id: nid('dt', 'DT-2610-', 2), mach: m.id, start: nowS(), end: null, reason: f.issue, kind: 'breakdown', batch: f.batch || null, impact: f.impact || '', wo: w.id }); }
    M.audit('MACHINE.ISSUE', ctx, { rec: w.id, to: f.mach, note: f.issue });
    return w;
  }
  M.woCreate = function (ctx, f) { if (!can(ctx, 'mnt.manage') && !can(ctx, 'prod.issue')) return deny(ctx, 'WO'); f = f || {}; if (!M.machine(f.mach)) return bad(L('Pilih mesin.', 'Choose a machine.'), 'mach'); if (!str(f.issue)) return bad(M.MSG.note, 'note'); if (!M.SEV[f.sev]) return bad(L('Pilih tingkat keparahan.', 'Choose the severity.'), 'sev'); var w = woNew(ctx, { mach: f.mach, issue: str(f.issue), sev: f.sev, batch: f.batch, impact: str(f.impact) }); if (f.photo) w.ev.push(f.photo); save(); return { ok: true, wo: w }; };
  function woStep(ctx, id, from, to, perm, fn) {
    var w = M.wo(id); if (!w) return bad(M.MSG.notfound); if (!can(ctx, perm)) return deny(ctx, id);
    if ([].concat(from).indexOf(w.st) < 0) return bad(M.MSG.jump, 'jump');
    var r = fn ? fn(w) : null; if (r && r.ok === false) return r;
    w.st = to; w.log.push([to, nowS(), empId(ctx)]); M.audit('WORKORDER.' + to.toUpperCase(), ctx, { rec: w.id, to: w.mach }); save(); return { ok: true, wo: w };
  }
  M.woAssign = function (ctx, id, tech) { return woStep(ctx, id, ['open', 'assigned'], 'assigned', 'mnt.manage', function (w) { if (!D.STAFF[tech]) return bad(L('Pilih teknisi.', 'Choose a technician.'), 'tech'); w.tech = tech; }); };
  M.woStart = function (ctx, id) { return woStep(ctx, id, ['assigned', 'test'], 'repair', 'mnt.do', function (w) { var m = M.machine(w.mach); if (m.batch) return bad(L(m.id + ' masih menjalankan batch ' + m.batch + '.', m.id + ' is still running batch ' + m.batch + '.'), 'busy'); w.repStart = w.repStart || nowS(); m.st = 'repair'; if (!S().dt.some(function (d) { return d.mach === m.id && !d.end; })) S().dt.push({ id: nid('dt', 'DT-2610-', 2), mach: m.id, start: nowS(), end: null, reason: w.issue, kind: 'breakdown', batch: w.batch, impact: w.impact, wo: w.id }); }); };
  M.woFinish = function (ctx, id, f) { f = f || {}; return woStep(ctx, id, 'repair', 'test', 'mnt.do', function (w) { if (!str(f.notes)) return bad(L('Tulis apa yang diperbaiki.', 'Write what was repaired.'), 'note'); w.repEnd = nowS(); w.parts = str(f.parts); w.notes = str(f.notes); if (f.photo) w.ev.push(f.photo); }); };
  M.woTest = function (ctx, id, f) { f = f || {}; var w = M.wo(id); if (w && w.st === 'test' && f.result === 'fail') return woStep(ctx, id, 'test', 'repair', 'mnt.do', function (x) { x.result = 'fail'; x.notes = (x.notes ? x.notes + ' · ' : '') + T(L('Tes gagal: ', 'Test failed: ')) + str(f.note); }); return woStep(ctx, id, 'test', 'verify', 'mnt.do', function (x) { x.result = 'pass'; x.testNote = str(f.note); }); };
  M.woVerify = function (ctx, id, note0) {
    return woStep(ctx, id, 'verify', 'ready', 'mnt.verify', function (w) {
      var m = M.machine(w.mach); w.verBy = empId(ctx); w.verAt = nowS(); w.verNote = str(note0); m.st = 'normal';
      S().dt.filter(function (d) { return d.mach === m.id && !d.end; }).forEach(function (d) { d.end = nowS(); });
      S().issues.filter(function (i) { return i.wo === w.id && i.st !== 'resolved'; }).forEach(function (i) { i.st = 'resolved'; i.res = T(L('Mesin siap dipakai lagi (', 'Machine ready for service (')) + w.id + ')'; i.resAt = nowS(); i.resBy = empId(ctx); });
      M.audit('MAINTENANCE.VERIFIED', ctx, { rec: w.id, to: m.id, note: str(note0) });
    });
  };
  M.workOrders = function (f) { f = f || {}; return S().wo.filter(function (w) { return (!f.mach || w.mach === f.mach) && (!f.open || w.st !== 'ready'); }).sort(function (a, b) { return (a.st === 'ready') - (b.st === 'ready') || ms(b.at) - ms(a.at); }); };
  M.setMachine = function (ctx, id, stt, reason) {
    var m = M.machine(id); if (!m) return bad(M.MSG.notfound); if (!can(ctx, 'mnt.manage') && !can(ctx, 'prod.spv')) return deny(ctx, id);
    if (['normal', 'idle', 'offline'].indexOf(stt) < 0) return bad(M.MSG.invalid); if (m.batch) return bad(L('Mesin sedang dipakai.', 'The machine is in use.'), 'busy'); if (!str(reason)) return bad(M.MSG.reason, 'reason');
    if (['repair', 'error'].indexOf(m.st) >= 0 && stt !== 'offline') return bad(L('Selesaikan work order dan verifikasi supervisor dulu.', 'Finish the work order and supervisor verification first.'), 'wo');
    var from = m.st; m.st = stt; m.why = stt === 'offline' ? L(str(reason), str(reason)) : null;
    M.audit('MACHINE.STATUS', ctx, { rec: id, from: from, to: stt, reason: str(reason) }); save(); return { ok: true, machine: m };
  };
  // Downtime (§77) and the maintenance metrics; Phase 10 keeps cost, vendor and asset value (§79).
  M.downtime = function (f) { f = f || {}; var now = M.now(); return S().dt.filter(function (d) { return !f.mach || d.mach === f.mach; }).map(function (d) { return Object.assign({}, d, { dur: Math.round(((d.end ? ms(d.end) : now) - ms(d.start)) / MIN) }); }).sort(function (a, b) { return ms(b.start) - ms(a.start); }); };
  M.mntMetrics = function (type) {
    var H = D.HIST, now = M.now(), from = now - 30 * DAY, list = M.downtime().filter(function (d) { var m = M.machine(d.mach); return ms(d.start) >= from && (!type || m.type === type); });
    var machs = S().mach.filter(function (m) { return (!type || m.type === type) && ['washer', 'dryer', 'ironer', 'boiler'].indexOf(m.type) >= 0; }), availMin = machs.length * 30 * 16 * 60;
    var down = sum(list.filter(function (d) { return d.kind === 'breakdown'; }).map(function (d) { return d.dur; })), done = S().tasks.filter(function (t) { return t.st === 'completed' && t.at && t.at.slice(0, 10) === D.today; }).length;
    var mttr = S().wo.filter(function (w) { return w.repStart && w.repEnd; }).map(function (w) { return (ms(w.repEnd) - ms(w.repStart)) / MIN; });
    return { total: Math.round(sum(list.map(function (d) { return d.dur; }))), breakdown: list.filter(function (d) { return d.kind === 'breakdown'; }).length, planned: list.filter(function (d) { return d.kind === 'planned'; }).length, completion: pct(H.pmDone + done, H.pmDue + done + S().tasks.filter(function (t) { return M.taskSt(t) === 'overdue'; }).length), avail: availMin ? r1(100 - down / availMin * 100) : 100, mttr: mttr.length ? Math.round(sum(mttr) / mttr.length) : null };
  };
  M.machineDetail = function (id) {
    var m = M.machine(id); if (!m) return null;
    return { m: m, plans: S().plans.filter(function (p) { return p.mach === id; }), tasks: M.tasks({ mach: id }), hist: M.history(id), wo: M.workOrders({ mach: id }), issues: S().issues.filter(function (i) { return i.mach === id; }), dt: M.downtime({ mach: id }), docs: D.DOCS[m.type] || [], sop: D.SOP[m.type] || [], live: M.machinesLive().filter(function (x) { return x.m.id === id; })[0] };
  };

  /* ---------- Team home summaries (§4, §18, §27) ---------- */
  M.home = function (team) {
    M.sync();
    var R = S().rcv, B = S().batches;
    function bc(list) { return B.filter(function (b) { return list.indexOf(b.stage) >= 0; }).length; }
    var hoIn = function (k) { return S().ho.filter(function (h) { return h.kind === k && h.st === 'waiting'; }); };
    if (team === 't1') return { mfWait: M.incoming().length + R.filter(function (r) { return r.st === 'waiting'; }).length, rcving: R.filter(function (r) { return ['receiving', 'verified'].indexOf(r.st) >= 0; }).length, diff: R.filter(function (r) { return r.st === 'difference' || (r.wdis && r.wdis.review === 'pending'); }).length, wgt: R.filter(function (r) { return r.stage === 'wgt'; }).length, sort: R.filter(function (r) { return r.stage === 'sort'; }).length, ready: bc(['ready']) + M.lotsOpen().length, hoOut: hoIn('t1t2').length };
    if (team === 't2') return { washQ: bc(['wash_q']), washing: bc(['washing']), dryQ: bc(['dry_q']), drying: bc(['drying']), finReady: bc(['fin_ready']), machBad: S().mach.filter(function (m) { return ['washer', 'dryer'].indexOf(m.type) >= 0 && ['error', 'repair', 'maintenance'].indexOf(m.st) >= 0; }).length, risk: B.filter(function (b) { return M.STAGE[b.stage] && M.STAGE[b.stage][2] === 't2' && M.slaState(b) !== 'ok'; }).length, hoIn: hoIn('t1t2').length };
    if (team === 't3') return { finQ: bc(['fin_q']), finishing: bc(['finishing']), qcQ: bc(['qc_q']), rework: M.reworks({ open: true }).length, packQ: bc(['pack_q', 'packed']), rtd: bc(['rtd', 'ho3l']), hoIn: hoIn('t2t3').length, risk: B.filter(function (b) { return M.STAGE[b.stage] && M.STAGE[b.stage][2] === 't3' && M.slaState(b) !== 'ok'; }).length };
    return null;
  };
  // Team work history (Riwayat): what this team finished today.
  M.teamHistory = function (team) {
    var keys = { t1: ['rcv', 'wgt', 'sort', 'batch', 'ho.t1t2'], t2: ['wash.end', 'dry.end', 'ho.t2t3.sent', 'ho.t1t2'], t3: ['fin.end', 'qc', 'qc.fail', 'packed', 'rtd', 'ho.t2t3', 'ho.t3log.sent'] }[team] || [];
    var rows = [];
    S().batches.forEach(function (b) { b.ev.forEach(function (e) { if (keys.indexOf(e[0]) >= 0 && e[1].slice(0, 10) === D.today) rows.push({ at: e[1], k: e[0], batch: b.id, by: e[2], b: b }); }); });
    if (team === 't1') S().rcv.forEach(function (r) { if (r.rcvAt && r.rcvAt.slice(0, 10) === D.today) rows.push({ at: r.rcvAt, k: 'rcv', rcv: r.id, by: r.rcvBy, r: r }); if (r.weigh && r.weigh.at.slice(0, 10) === D.today) rows.push({ at: r.weigh.at, k: 'wgt', rcv: r.id, by: r.weigh.by, r: r }); if (r.sort && r.sort.at.slice(0, 10) === D.today) rows.push({ at: r.sort.at, k: 'sort', rcv: r.id, by: r.sort.by, r: r }); });
    return rows.sort(function (a, b) { return ms(b.at) - ms(a.at); });
  };

  /* ---------- Screens, navigation, install (§86) ---------- */
  function sc(id, n, a, p, np, nv, icon, pur, emp, o) {
    return Object.assign({ id: id, n: n, a: a, p: p, np: np, nv: nv, icon: icon, pur: pur, dom: 'prd', lvl: 2, p8: true, nb: [], bf: [], aud: [],
      emp: emp || L('Belum ada data.', 'No data yet.'), err: L('Data produksi belum berhasil dimuat. Coba Lagi.', 'Production data could not be loaded. Try Again.'), warn: L('Ada pekerjaan yang perlu perhatian.', 'Some work needs attention.'), ok: L('Tersimpan.', 'Saved.') }, o || {});
  }
  M.SCREENS = [
    sc('HOM-T1-001', L('Beranda Team 1', 'Team 1 Home'), 'T01', 'prod.t1', 'NP-01', 'NV-01', 'home', L('Manifest menunggu, receiving, selisih, timbang, sorting, batch siap.', 'Waiting manifests, receiving, differences, weighing, sorting, ready batches.'), null, { lvl: 1, team: 't1' }),
    sc('PROD-RCV-001', L('Antrian Receiving', 'Receiving Queue'), 'T02', 'prod.t1', 'NP-01', 'NV-01', 'inbox', L('Manifest & cucian datang: klien, property, driver, bag, status.', 'Incoming manifests & laundry: client, property, driver, bags, status.'), L('Belum ada cucian datang.', 'No laundry arriving yet.'), { team: 't1' }),
    sc('PROD-RCV-002', L('Detail Receiving', 'Receiving Detail'), 'T04', 'prod.t1', 'NP-01', 'NV-01', 'clipboard', L('Cek klien, property, bag, kondisi → SESUAI / ADA SELISIH → TERIMA CUCIAN.', 'Check client, property, bags, condition → SESUAI / ADA SELISIH → TERIMA CUCIAN.'), null, { team: 't1' }),
    sc('PROD-WGT-001', L('Timbang & Hitung', 'Weighing & Counting'), 'T04', 'prod.t1', 'NP-02', 'NV-02', 'scale', L('Berat kotor, tara, bersih, timbangan; hitung item dengan − angka +.', 'Gross, tare, net, scale; count items with − number +.'), L('Tidak ada cucian menunggu timbang.', 'No laundry waiting for weighing.'), { team: 't1' }),
    sc('PROD-DIS-001', L('Selisih', 'Discrepancy'), 'T04', 'prod.t1', 'NP-02', 'NV-02', 'alert', L('Alasan, catatan, foto; selisih besar perlu review supervisor.', 'Reason, notes, photo; large differences need supervisor review.'), null, { team: 't1' }),
    sc('PROD-SORT-001', L('Antrian Sorting', 'Sorting Queue'), 'T02', 'prod.t1', 'NP-03', 'NV-03', 'layers', L('Cucian yang sudah ditimbang menunggu sorting.', 'Weighed laundry waiting for sorting.'), L('Tidak ada cucian menunggu sorting.', 'No laundry waiting for sorting.'), { team: 't1' }),
    sc('PROD-SORT-002', L('Detail Sorting', 'Sorting Detail'), 'T04', 'prod.t1', 'NP-03', 'NV-03', 'layers', L('Kartu kategori dengan saran dari data klien, flag, SELESAI SORTIR.', 'Category cards pre-suggested from client data, flags, SELESAI SORTIR.'), null, { team: 't1' }),
    sc('PROD-BATCH-001', L('Batch Builder', 'Batch Builder'), 'T04', 'prod.t1', 'NP-04', 'NV-04', 'grid', L('Rekomendasi batch, mesin, utilisasi, program, SLA; validasi kapasitas.', 'Batch recommendation, machine, utilisation, program, SLA; capacity validation.'), L('Belum ada lot siap dibatch. Selesaikan sorting dulu.', 'No lots ready for a batch. Finish sorting first.'), { team: 't1' }),
    sc('PROD-HO-001', L('Handover Team 1 → Team 2', 'Team 1 → Team 2 Handover'), 'T04', 'prod.ho12', 'NP-04', 'NV-04', 'swap', L('KIRIM KE TEAM 2 — WASHING; Team 2 TERIMA HANDOVER / ADA SELISIH.', 'KIRIM KE TEAM 2 — WASHING; Team 2 TERIMA HANDOVER / ADA SELISIH.'), L('Tidak ada handover menunggu.', 'No handover waiting.')),
    sc('HOM-T2-001', L('Beranda Team 2', 'Team 2 Home'), 'T01', 'prod.t2', 'NP-05', 'NV-05', 'home', L('Siap cuci, sedang dicuci, menunggu dryer, sedang dikeringkan, mesin bermasalah, risiko SLA.', 'Ready to wash, washing, waiting for dryer, drying, machine problems, SLA risk.'), null, { lvl: 1, team: 't2' }),
    sc('PROD-WASH-001', L('Antrian Washing', 'Washing Queue'), 'T02', 'prod.t2', 'NP-05', 'NV-05', 'droplet', L('Batch, klien, item, berat, rekomendasi mesin, program, prioritas, SLA.', 'Batch, client, items, weight, machine recommendation, program, priority, SLA.'), L('Tidak ada batch siap cuci.', 'No batch ready to wash.'), { team: 't2' }),
    sc('PROD-WASH-002', L('Detail Washing', 'Washing Detail'), 'T04', 'prod.t2', 'NP-05', 'NV-05', 'droplet', L('MULAI CUCI; berjalan: waktu, perkiraan selesai, SELESAI CUCI / ADA MASALAH.', 'MULAI CUCI; running: time, expected finish, SELESAI CUCI / ADA MASALAH.'), null, { team: 't2' }),
    sc('PROD-DRY-001', L('Antrian Drying', 'Drying Queue'), 'T02', 'prod.t2', 'NP-06', 'NV-06', 'wind', L('Menunggu dikeringkan: batch, item, berat, metode, prioritas, SLA.', 'Waiting for drying: batch, items, weight, method, priority, SLA.'), L('Tidak ada batch menunggu dryer.', 'No batch waiting for a dryer.'), { team: 't2' }),
    sc('PROD-DRY-002', L('Detail Drying', 'Drying Detail'), 'T04', 'prod.t2', 'NP-06', 'NV-06', 'wind', L('Dryer, program, suhu, durasi → MULAI KERING → SELESAI KERING.', 'Dryer, program, temperature, duration → MULAI KERING → SELESAI KERING.'), null, { team: 't2' }),
    sc('PROD-HO-002', L('Handover Team 2 → Team 3', 'Team 2 → Team 3 Handover'), 'T04', 'prod.ho23', 'NP-06', 'NV-06', 'swap', L('Siap finalisasi → KIRIM KE TEAM 3; Team 3 TERIMA HANDOVER / ADA SELISIH.', 'Ready for finalization → KIRIM KE TEAM 3; Team 3 TERIMA HANDOVER / ADA SELISIH.'), L('Tidak ada handover menunggu.', 'No handover waiting.')),
    sc('HOM-T3-001', L('Beranda Team 3', 'Team 3 Home'), 'T01', 'prod.t3', 'NP-07', 'NV-07', 'home', L('Menunggu finishing, sedang finishing, menunggu QC, rewash, packing, siap kirim.', 'Waiting for finishing, finishing, waiting for QC, rewash, packing, ready to deliver.'), null, { lvl: 1, team: 't3' }),
    sc('PROD-FIN-001', L('Antrian Finishing', 'Finishing Queue'), 'T02', 'prod.t3', 'NP-07', 'NV-07', 'iron', L('Batch, klien, item, qty, berat, prioritas, SLA.', 'Batch, client, items, qty, weight, priority, SLA.'), L('Tidak ada batch menunggu finishing.', 'No batch waiting for finishing.'), { team: 't3' }),
    sc('PROD-FIN-002', L('Detail Finishing', 'Finishing Detail'), 'T04', 'prod.t3', 'NP-07', 'NV-07', 'iron', L('Metode, workstation, MULAI FINISHING, progres qty, SELESAI FINISHING.', 'Method, workstation, MULAI FINISHING, quantity progress, SELESAI FINISHING.'), null, { team: 't3' }),
    sc('PROD-QC-001', L('Antrian QC', 'QC Queue'), 'T02', 'prod.t3', 'NP-08', 'NV-08', 'search', L('Batch menunggu QC dengan SLA dan instruksi khusus.', 'Batches waiting for QC with SLA and special instructions.'), L('Tidak ada batch menunggu QC.', 'No batch waiting for QC.'), { team: 't3' }),
    sc('PROD-QC-002', L('Keputusan QC', 'QC Decision'), 'T04', 'prod.t3', 'NP-08', 'NV-08', 'checkc', L('Dua tombol besar: LULUS / ADA MASALAH; checklist opsional.', 'Two large buttons: LULUS / ADA MASALAH; optional checklist.'), null, { team: 't3' }),
    sc('PROD-REWASH-001', L('Rewash / Proses Ulang', 'Rewash / Reprocess'), 'T05', 'prod.t3', 'NP-08', 'NV-08', 'refresh', L('Setiap rework: alasan, asal, tahap penyebab, qty, bukti, dampak waktu & SLA.', 'Each rework: reason, origin, responsible stage, qty, evidence, time & SLA impact.'), L('Tidak ada rework terbuka.', 'No open rework.'), { team: 't3' }),
    sc('PROD-PACK-001', L('Antrian Packing', 'Packing Queue'), 'T02', 'prod.t3', 'NP-09', 'NV-09', 'package', L('Klien, property, batch, qty, berat, SLA, jadwal kirim, status QC.', 'Client, property, batch, qty, weight, SLA, delivery schedule, QC status.'), L('Tidak ada batch menunggu packing.', 'No batch waiting for packing.'), { team: 't3' }),
    sc('PROD-PACK-002', L('Detail Packing', 'Packing Detail'), 'T04', 'prod.t3', 'NP-09', 'NV-09', 'package', L('Jumlah paket, berat per paket, label + QR, rekonsiliasi, PACKING SELESAI / SIAP DIKIRIM.', 'Package count, weight per package, label + QR, reconciliation, PACKING SELESAI / SIAP DIKIRIM.'), null, { team: 't3' }),
    sc('PROD-READY-001', L('Siap Kirim', 'Ready to Deliver'), 'T02', 'prod.t3', 'NP-09', 'NV-09', 'truck', L('Paket siap kirim dan SERAHKAN KE LOGISTICS.', 'Ready packages and SERAHKAN KE LOGISTICS.'), L('Belum ada paket siap kirim.', 'No package ready to deliver yet.'), { team: 't3' }),
    sc('PROD-HO-003', L('Handover Team 3 → Logistics', 'Team 3 → Logistics Handover'), 'T04', 'prod.ho3l', 'NP-09', 'NV-09', 'truck', L('Handover 4: paket, qty, berat, label → Logistics menerima → delivery Fase 7.', 'Handover 4: packages, qty, weight, labels → Logistics accepts → Phase 7 delivery.'), L('Tidak ada paket menunggu diambil.', 'No packages waiting for pickup.')),
    sc('PROD-ISSUE-002', L('Masalah Tim', 'Team Issues'), 'T06', 'prod.issue', 'NP-10', 'NV-10', 'alert', L('ADA MASALAH: jenis → keparahan → bukti → catatan → tindakan; daftar masalah tim.', 'ADA MASALAH: type → severity → evidence → notes → action; team issue list.'), L('Tidak ada masalah terbuka.', 'No open issue.')),
    sc('PROD-HIS-001', L('Riwayat Tim', 'Team History'), 'T05', 'prod.history', 'NP-10', 'NV-10', 'history', L('Pekerjaan tim yang selesai hari ini.', 'The team\'s finished work today.'), L('Belum ada pekerjaan selesai hari ini.', 'No finished work today yet.')),
    sc('PROD-CMD-001', L('Production Command Center', 'Production Command Center'), 'T08', 'prod.cmd', 'NP-10', 'NV-10', 'gauge', L('Live board 8 tahap, KPI utama, kapasitas, mesin, bottleneck, tindakan supervisor.', 'Live board of 8 stages, top KPI, capacity, machines, bottlenecks, supervisor actions.'), null, { lvl: 3 }),
    sc('PROD-CAP-001', L('Kapasitas', 'Capacity'), 'T08', 'prod.cmd', 'NP-10', 'NV-10', 'chart', L('Utilisasi washing, drying, finishing, QC, packing dengan ambang peringatan.', 'Washing, drying, finishing, QC, packing utilisation with warning thresholds.'), null, { lvl: 3 }),
    sc('PROD-MACH-001', L('Status Mesin Live', 'Machine Live Status'), 'T05', 'prod.mach', 'NP-10', 'NV-10', 'washer', L('Setiap mesin: status, batch, mulai, perkiraan selesai, utilisasi, jadwal maintenance.', 'Each machine: status, batch, start, expected finish, utilisation, maintenance due.'), null),
    sc('PROD-ISSUE-001', L('Pusat Masalah Produksi', 'Production Issue Center'), 'T05', 'prod.cmd', 'NP-10', 'NV-10', 'alert', L('Masalah, selisih handover, rework dan review menurut keparahan.', 'Issues, handover differences, rework and reviews by severity.'), L('Tidak ada masalah terbuka.', 'No open issue.'), { lvl: 3 }),
    sc('PROD-TRACE-001', L('Telusur Batch', 'Batch Traceability'), 'T03', 'prod.trace', 'NP-10', 'NV-10', 'route', L('Klien → order → manifest → receiving → sorting → mesin → operator → QC → packing → logistics.', 'Client → order → manifest → receiving → sorting → machine → operator → QC → packing → logistics.'), L('Pilih batch untuk ditelusuri.', 'Choose a batch to trace.'), { lvl: 3 }),
    sc('PROD-KPI-001', L('KPI Produksi', 'Production KPI'), 'T08', 'prod.kpi', 'NP-10', 'NV-10', 'chart', L('14 KPI produksi otomatis dan alirannya ke Ambidex Fase 5.', '14 automatic production KPIs and their flow into the Phase 5 Ambidex.'), null, { lvl: 4 }),
    sc('CHK-001', L('Checklist Hari Ini', 'Checklist Today'), 'T02', 'chk.view', 'NP-11', 'NV-11', 'clipboard', L('Tab Opening, Team 1–3, Logistics, Closing: total, selesai, pending, masalah, terlambat, progres.', 'Opening, Team 1–3, Logistics, Closing tabs: total, done, pending, issue, overdue, progress.'), L('Belum ada checklist hari ini.', 'No checklist today.')),
    sc('CHK-002', L('Item Checklist', 'Checklist Item'), 'T04', 'chk.view', 'NP-11', 'NV-11', 'check', L('Satu item: instruksi singkat, nilai/bukti, SELESAI / ADA MASALAH.', 'One item: short instruction, value/evidence, SELESAI / ADA MASALAH.')),
    sc('CHK-003', L('Master Checklist', 'Checklist Master'), 'T05', 'chk.master', 'NP-11', 'NV-11', 'list', L('Semua template, versi, tanggal berlaku, tim, frekuensi.', 'All templates, versions, effective dates, teams, frequency.'), null, { lvl: 3 }),
    sc('CHK-004', L('Editor Template', 'Template Editor'), 'T06', 'chk.master', 'NP-11', 'NV-11', 'edit', L('Tambah, ubah, urutkan, aktif/nonaktif item; terbitkan versi baru dengan tanggal berlaku.', 'Add, edit, reorder, activate items; publish a new version with an effective date.'), null, { lvl: 3 }),
    sc('CHK-005', L('Approval Checklist', 'Checklist Approval'), 'T05', 'chk.approve', 'NP-11', 'NV-11', 'filecheck', L('APPROVE OPENING / RETURN ITEM setelah review team leader.', 'APPROVE OPENING / RETURN ITEM after team leader review.'), L('Tidak ada checklist menunggu persetujuan.', 'No checklist waiting for approval.'), { lvl: 3 }),
    sc('MNT-001', L('Dashboard Maintenance', 'Maintenance Dashboard'), 'T08', 'mnt.view', 'NP-12', 'NV-12', 'wrench', L('Jatuh tempo hari ini, segera, terlambat, selesai, masalah, dalam perawatan; pengingat.', 'Due today, due soon, overdue, completed, issue found, under maintenance; reminders.')),
    sc('MNT-002', L('Kalender Maintenance', 'Maintenance Calendar'), 'T05', 'mnt.view', 'NP-12', 'NV-12', 'calendar', L('Hari ini, minggu, bulan, kalender: mesin, tugas, frekuensi, PIC, status.', 'Today, week, month, calendar: machine, task, frequency, PIC, status.')),
    sc('MNT-003', L('Detail Mesin', 'Machine Detail'), 'T03', 'mnt.view', 'NP-12', 'NV-12', 'washer', L('Overview, jadwal, checklist, riwayat, masalah, downtime, dokumen.', 'Overview, schedule, checklist, history, issues, downtime, documents.'), L('Pilih mesin.', 'Choose a machine.')),
    sc('MNT-004', L('Checklist Maintenance', 'Maintenance Checklist'), 'T04', 'mnt.view', 'NP-12', 'NV-12', 'clipboard', L('Langkah SOP mesin, part, catatan, foto, hasil; catatan keselamatan.', 'Machine SOP steps, parts, notes, photo, result; safety note.')),
    sc('MNT-005', L('Riwayat Maintenance', 'Maintenance History'), 'T05', 'mnt.view', 'NP-12', 'NV-12', 'history', L('Semua maintenance selesai, tidak pernah ditimpa.', 'All completed maintenance, never overwritten.'), L('Belum ada riwayat.', 'No history yet.')),
    sc('MNT-006', L('Masalah Mesin / Work Order', 'Machine Issue / Work Order'), 'T04', 'mnt.view', 'NP-12', 'NV-12', 'wrench', L('Masalah → work order → perbaikan → tes → verifikasi supervisor → siap pakai.', 'Issue → work order → repair → test → supervisor verification → ready for service.'), L('Tidak ada work order terbuka.', 'No open work order.'))
  ];
  M.screen = function (id) { return by(M.SCREENS, 'id', id); };
  M.PARENTS = {
    'PROD-RCV-002': ['PROD-RCV-001'], 'PROD-DIS-001': ['PROD-RCV-001'], 'PROD-SORT-002': ['PROD-SORT-001'], 'PROD-WASH-002': ['PROD-WASH-001'], 'PROD-DRY-002': ['PROD-DRY-001'],
    'PROD-FIN-002': ['PROD-FIN-001'], 'PROD-QC-002': ['PROD-QC-001'], 'PROD-PACK-002': ['PROD-PACK-001'], 'PROD-CAP-001': ['PROD-CMD-001'], 'PROD-TRACE-001': ['PROD-CMD-001'],
    'CHK-002': ['CHK-001'], 'CHK-004': ['CHK-003'], 'MNT-003': ['MNT-001'], 'MNT-004': ['MNT-001'], 'MNT-006': ['MNT-001']
  };
  function N(k, l, i, s, x) { return Object.assign({ k: k, l: l, i: i, s: s }, x || {}); }
  function G(k, l, i, sub) { return { k: k, l: l, i: i, sub: sub }; }
  var MENU = { k: 'menu', l: L('Menu', 'Menu'), i: 'menu' };
  var NAV_T1 = [N('home', L('Beranda', 'Home'), 'home', 'HOM-T1-001', { also: ['CHK-001', 'CHK-002'] }), N('rcv', L('Receiving', 'Receiving'), 'inbox', 'PROD-RCV-001', { also: ['PROD-RCV-002', 'PROD-DIS-001'] }), N('wgt', L('Timbang', 'Weigh'), 'scale', 'PROD-WGT-001'),
    N('sort', L('Sorting', 'Sorting'), 'layers', 'PROD-SORT-001', { also: ['PROD-SORT-002'] }), N('batch', L('Batch', 'Batch'), 'grid', 'PROD-BATCH-001', { also: ['PROD-HO-001'] }), N('iss', L('Masalah', 'Issues'), 'alert', 'PROD-ISSUE-002')];
  var NAV_T2 = [N('home', L('Beranda', 'Home'), 'home', 'HOM-T2-001', { also: ['CHK-001', 'CHK-002', 'PROD-HO-001'] }), N('wash', L('Washing', 'Washing'), 'droplet', 'PROD-WASH-001', { also: ['PROD-WASH-002'] }), N('dry', L('Drying', 'Drying'), 'wind', 'PROD-DRY-001', { also: ['PROD-DRY-002', 'PROD-HO-002'] }),
    N('mach', L('Mesin', 'Machines'), 'washer', 'PROD-MACH-001'), N('iss', L('Masalah', 'Issues'), 'alert', 'PROD-ISSUE-002'), N('his', L('Riwayat', 'History'), 'history', 'PROD-HIS-001')];
  var NAV_T3 = [N('home', L('Beranda', 'Home'), 'home', 'HOM-T3-001', { also: ['CHK-001', 'CHK-002', 'PROD-HO-002'] }), N('fin', L('Finishing', 'Finishing'), 'iron', 'PROD-FIN-001', { also: ['PROD-FIN-002'] }), N('qc', L('QC', 'QC'), 'search', 'PROD-QC-001', { also: ['PROD-QC-002'] }),
    N('rw', L('Rewash', 'Rewash'), 'refresh', 'PROD-REWASH-001'), N('pack', L('Packing', 'Packing'), 'package', 'PROD-PACK-001', { also: ['PROD-PACK-002'] }), N('rtd', L('Siap Kirim', 'Ready'), 'truck', 'PROD-READY-001', { also: ['PROD-HO-003'] }), N('iss', L('Masalah', 'Issues'), 'alert', 'PROD-ISSUE-002')];
  var NAV_MNT = [N('dash', L('Dashboard', 'Dashboard'), 'wrench', 'MNT-001', { also: ['MNT-004'] }), N('cal', L('Kalender', 'Calendar'), 'calendar', 'MNT-002'), N('mach', L('Mesin', 'Machines'), 'washer', 'MNT-003'), N('wo', L('Work Order', 'Work Orders'), 'wrench', 'MNT-006'), N('his', L('Riwayat', 'History'), 'history', 'MNT-005'), N('live', L('Status Live', 'Live Status'), 'gauge', 'PROD-MACH-001'), N('chk', L('Checklist', 'Checklist'), 'clipboard', 'CHK-001', { also: ['CHK-002'] })];
  var PROD_SPV = [N('cmd', L('Command Center', 'Command Center'), 'gauge', 'PROD-CMD-001'), N('cap', L('Kapasitas', 'Capacity'), 'chart', 'PROD-CAP-001'), N('mach', L('Status Mesin', 'Machine Status'), 'washer', 'PROD-MACH-001'), N('piss', L('Masalah Produksi', 'Production Issues'), 'alert', 'PROD-ISSUE-001'),
    N('trace', L('Telusur Batch', 'Batch Trace'), 'route', 'PROD-TRACE-001'), N('pkpi', L('KPI Produksi', 'Production KPI'), 'chart', 'PROD-KPI-001'), N('t1', L('Workspace Team 1', 'Team 1 Workspace'), 'basket', 'HOM-T1-001'), N('t2', L('Workspace Team 2', 'Team 2 Workspace'), 'droplet', 'HOM-T2-001'), N('t3', L('Workspace Team 3', 'Team 3 Workspace'), 'shirt', 'HOM-T3-001')];
  var CTRL_SPV = [N('chk', L('Checklist Hari Ini', 'Checklist Today'), 'clipboard', 'CHK-001'), N('chka', L('Approval Checklist', 'Checklist Approval'), 'filecheck', 'CHK-005'), N('chkm', L('Master Checklist', 'Checklist Master'), 'list', 'CHK-003'), N('mnt', L('Maintenance', 'Maintenance'), 'wrench', 'MNT-001'), N('cal', L('Kalender Maintenance', 'Maintenance Calendar'), 'calendar', 'MNT-002'), N('wo', L('Work Order', 'Work Orders'), 'wrench', 'MNT-006')];
  M.NAV = {
    supervisor: { add: [G('g-prod', L('Produksi', 'Production'), 'factory', PROD_SPV), G('g-ctrl', L('Checklist & Maintenance', 'Checklist & Maintenance'), 'clipboard', CTRL_SPV)] },
    opsmgr: { add: [G('g-prod', L('Produksi', 'Production'), 'factory', [PROD_SPV[5]].concat(PROD_SPV.slice(0, 5))), G('g-ctrl', L('Checklist & Maintenance', 'Checklist & Maintenance'), 'clipboard', CTRL_SPV)] },
    owner: { add: [G('g-prod', L('Produksi', 'Production'), 'factory', [PROD_SPV[5], PROD_SPV[0], PROD_SPV[2], PROD_SPV[4], N('chk', L('Checklist Hari Ini', 'Checklist Today'), 'clipboard', 'CHK-001'), N('mnt', L('Maintenance', 'Maintenance'), 'wrench', 'MNT-001')])] },
    driver: { append: N('ho4', L('Ambil di Plant', 'Plant Pickup'), 'package', 'PROD-HO-003') }
  };
  function role(n, person, title, device, nav, mnav, landing, q, feel) { return { n: n, person: person, title: title, group: device === 'desktop' ? 'management' : 'frontline', device: device, site: 'Main Plant — Ubud', q: q, feel: feel, nav: nav, mnav: mnav, extra: [], hide: [L('Keuangan', 'Finance'), L('Komersial', 'Commercial'), L('CEO Dashboard', 'CEO Dashboard'), L('HR', 'HR')], levels: [1, 2, 3] }; }
  M.NEW_ROLES = {
    prod1: {
      x: { exp: 'prod1', n: L('Team 1 · Inbound', 'Team 1 · Inbound'), landing: 'HOM-T1-001', land: 'LAND-001', group: 'frontline' },
      c: role(L('Team 1 · Inbound & Persiapan', 'Team 1 · Inbound & Preparation'), 'Putu', L('Team Leader Inbound', 'Inbound Team Leader'), 'ipad', NAV_T1,
        [NAV_T1[0], NAV_T1[1], NAV_T1[2], NAV_T1[3], MENU], 'HOM-T1-001', L('Cucian mana yang harus saya terima dan siapkan sekarang?', 'Which laundry do I receive and prepare now?'), L('Satu iPad, satu alur: terima, timbang, sortir, batch.', 'One iPad, one flow: receive, weigh, sort, batch.')),
      emp: { id: 'EMP-101', n: 'Putu Wardana', short: 'Putu', dept: L('Produksi', 'Production'), status: 'active' },
      user: { id: 'USR-101', u: 'putu', email: 'putu@jfreshlaundry.app', emp: 'EMP-101', status: 'active', roles: [{ k: 'prod1', def: true }], plants: ['PL-01'], lang: 'id' },
      demo: { u: 'putu', d: L('Team 1 · iPad Inbound', 'Team 1 · Inbound iPad') }
    },
    prod2: {
      x: { exp: 'prod2', n: L('Team 2 · Washing & Drying', 'Team 2 · Washing & Drying'), landing: 'HOM-T2-001', land: 'LAND-001', group: 'frontline' },
      c: role(L('Team 2 · Washing & Drying', 'Team 2 · Washing & Drying'), 'Wayan', L('Team Leader Washing', 'Washing Team Leader'), 'ipad', NAV_T2,
        [NAV_T2[0], NAV_T2[1], NAV_T2[2], NAV_T2[4], MENU], 'HOM-T2-001', L('Batch mana yang harus saya cuci dan keringkan sekarang?', 'Which batch do I wash and dry now?'), L('Saya tahu mesin mana, program apa, dan kapan selesai.', 'I know which machine, which program and when it finishes.')),
      emp: { id: 'EMP-071', n: 'Wayan Arta', short: 'Wayan', dept: L('Produksi', 'Production'), status: 'active' },
      user: { id: 'USR-102', u: 'arta', email: 'arta@jfreshlaundry.app', emp: 'EMP-071', status: 'active', roles: [{ k: 'prod2', def: true }], plants: ['PL-01'], lang: 'id' },
      demo: { u: 'arta', d: L('Team 2 · iPad Washing & Drying', 'Team 2 · Washing & Drying iPad') }
    },
    prod3: {
      x: { exp: 'prod3', n: L('Team 3 · Finishing, QC & Packing', 'Team 3 · Finishing, QC & Packing'), landing: 'HOM-T3-001', land: 'LAND-001', group: 'frontline' },
      c: role(L('Team 3 · Finishing, QC & Packing', 'Team 3 · Finishing, QC & Packing'), 'Luh', L('Team Leader Finishing', 'Finishing Team Leader'), 'ipad', NAV_T3,
        [NAV_T3[0], NAV_T3[1], NAV_T3[2], NAV_T3[4], MENU], 'HOM-T3-001', L('Apa yang harus saya selesaikan, cek dan kemas sekarang?', 'What do I finish, check and pack now?'), L('Kualitas jelas: LULUS atau ADA MASALAH.', 'Quality is clear: LULUS or ADA MASALAH.')),
      emp: { id: 'EMP-077', n: 'Luh Putri', short: 'Luh', dept: L('Produksi', 'Production'), status: 'active' },
      user: { id: 'USR-103', u: 'luh', email: 'luh@jfreshlaundry.app', emp: 'EMP-077', status: 'active', roles: [{ k: 'prod3', def: true }], plants: ['PL-01'], lang: 'id' },
      demo: { u: 'luh', d: L('Team 3 · iPad Finishing, QC & Packing', 'Team 3 · Finishing, QC & Packing iPad') }
    },
    maint: {
      x: { exp: 'maint', n: L('Maintenance PIC', 'Maintenance PIC'), landing: 'MNT-001', land: 'LAND-003', group: 'management' },
      c: role(L('Maintenance PIC', 'Maintenance PIC'), 'Oka', L('Teknisi Maintenance', 'Maintenance Technician'), 'desktop', NAV_MNT,
        [NAV_MNT[0], NAV_MNT[1], NAV_MNT[3], NAV_MNT[2], MENU], 'MNT-001', L('Mesin mana yang perlu dirawat atau diperbaiki hari ini?', 'Which machine needs care or repair today?'), L('Jadwal jelas, SOP jelas, riwayat lengkap.', 'Clear schedule, clear SOP, full history.')),
      emp: { id: 'EMP-102', n: 'Oka Merta', short: 'Oka', dept: L('Maintenance', 'Maintenance'), status: 'active' },
      user: { id: 'USR-104', u: 'oka', email: 'oka@jfreshlaundry.app', emp: 'EMP-102', status: 'active', roles: [{ k: 'maint', def: true }], plants: ['PL-01'], lang: 'id' },
      demo: { u: 'oka', d: L('Maintenance PIC · mesin & work order', 'Maintenance PIC · machines & work orders') }
    }
  };
  /* install(): joins the Phase 8 permissions, roles, screens and menus to the shared config and access roles,
     and feeds the production KPIs into the Phase 5 people data. Safe to call more than once. */
  M.install = function (C, X, P, CM2, LG2) {
    if (!C || C.__p8) return; C.__p8 = true;
    if (CM2) { CM = CM2; M.CM = CM2; } if (LG2) { LG = LG2; M.LG = LG2; }
    Object.keys(M.PERMS).forEach(function (k) { C.PERMS[k] = M.PERMS[k]; });
    function addP(list, extra) { extra.forEach(function (p) { if (list.indexOf(p) < 0) list.push(p); }); }
    Object.keys(M.ROLE_PERMS).forEach(function (r) {
      var rl = C.ROLES[r], xr = X && X.ROLES[r];
      if (rl) addP(rl.perms, M.ROLE_PERMS[r]);
      if (xr && xr.perms) addP(xr.perms, M.ROLE_PERMS[r]);
    });
    Object.keys(M.NEW_ROLES).forEach(function (r) {
      var d = M.NEW_ROLES[r];
      if (!C.ROLES[r]) { C.ROLES[r] = Object.assign({ perms: M.ROLE_PERMS[r].slice() }, d.c); if (C.ROLE_ORDER.indexOf(r) < 0) C.ROLE_ORDER.splice(C.ROLE_ORDER.indexOf('owner'), 0, r); }
      if (X) {
        if (!X.ROLES[r]) X.ROLES[r] = d.x;
        if (!X.employee(d.emp.id)) X.EMPLOYEES.push(d.emp);
        if (!X.user(d.user.id) && !X.USERS.some(function (u) { return u.u === d.user.u; })) X.USERS.push(Object.assign({}, d.user));
        if (!X.DEMO.some(function (x) { return x.u === d.demo.u; })) X.DEMO.splice(Math.min(X.DEMO.length, 6), 0, d.demo);
      }
    });
    Object.keys(M.NAV).forEach(function (r) {
      var cfg = M.NAV[r], rl = C.ROLES[r]; if (!rl) return;
      if (cfg.add) rl.nav = rl.nav.concat(cfg.add);
      if (cfg.append && !rl.nav.some(function (n) { return n.k === cfg.append.k; })) rl.nav = rl.nav.concat([cfg.append]);
    });
    var orig = C.screen, extra = {};
    M.SCREENS.forEach(function (s) { extra[s.id] = s; });
    C.screen = function (id) { return extra[id] || orig(id); };
    C.SCREENS_P8 = M.SCREENS;
    if (P) M.perfFeed(P);
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = M;
  else root.JFPROD = M;
})(typeof window !== 'undefined' ? window : this);
