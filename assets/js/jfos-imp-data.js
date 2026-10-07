/* ==========================================================================
   JFRESH OS — Phase 12 sample data for Engine A (JFIMP): build, environments,
   releases, module waves, blockers, QA test cases and bugs, regression suite
   manifest, security validation scenarios, performance / reliability /
   restore test history, backup policy and DR targets.

   ONE DATA, ONE SOURCE (§1–§4): nothing here describes the business. Clients,
   properties, orders, receiving, batches, deliveries, invoices, payments,
   journals, items, suppliers, assets, users, integrations and backups are
   READ from their owner engines (JFCOMM, JFLOG, JFPROD, JFDLV, JFFIN,
   JFACCESS, JFCLP, JFSYS) at call time. This file only holds things the
   implementation project itself owns (§7–§43).
   Day shown: Tuesday 6 Oct 2026, clock starts at 10:30 (WITA).
   ========================================================================== */
(function (root) {
  function L(a, b) { return [a, b === undefined ? a : b]; }
  var D = { today: '2026-10-06', simNow: '2026-10-06 10:30' };

  /* ---------- §110 project roles' people (owned by Engine A) ---------- */
  D.PEOPLE = {
    implead: {
      emp: { id: 'EMP-130', n: 'Bayu Pradana', short: 'Bayu', dept: L('Implementasi', 'Implementation'), status: 'active' },
      user: { id: 'USR-130', u: 'bayu', email: 'bayu@jfreshlaundry.app', emp: 'EMP-130', status: 'active', roles: [{ k: 'implead', def: true }], plants: ['*'], lang: 'id' },
      demo: { u: 'bayu', d: L('Implementation Lead · Go-Live Commander', 'Implementation Lead · Go-Live Commander') }
    },
    qalead: {
      emp: { id: 'EMP-131', n: 'Intan Permata', short: 'Intan', dept: L('Implementasi', 'Implementation'), status: 'active' },
      user: { id: 'USR-131', u: 'intan', email: 'intan@jfreshlaundry.app', emp: 'EMP-131', status: 'active', roles: [{ k: 'qalead', def: true }], plants: ['*'], lang: 'id' },
      demo: { u: 'intan', d: L('QA & UAT Lead', 'QA & UAT Lead') }
    },
    datalead: {
      emp: { id: 'EMP-132', n: 'Dodi Saputra', short: 'Dodi', dept: L('Implementasi', 'Implementation'), status: 'active' },
      user: { id: 'USR-132', u: 'dodi', email: 'dodi@jfreshlaundry.app', emp: 'EMP-132', status: 'active', roles: [{ k: 'datalead', def: true }], plants: ['*'], lang: 'id' },
      demo: { u: 'dodi', d: L('Data Migration Lead', 'Data Migration Lead') }
    },
    trainer: {
      emp: { id: 'EMP-133', n: 'Ratih Kusuma', short: 'Ratih', dept: L('Implementasi', 'Implementation'), status: 'active' },
      user: { id: 'USR-133', u: 'ratih', email: 'ratih@jfreshlaundry.app', emp: 'EMP-133', status: 'active', roles: [{ k: 'trainer', def: true }], plants: ['*'], lang: 'id' },
      demo: { u: 'ratih', d: L('Training Lead · Smart Help', 'Training Lead · Smart Help') }
    }
  };

  /* ---------- NP-01 §7–§8 environments (identifiers are masked; secrets never stored) ---------- */
  D.ENVS = [
    { id: 'ENV-DEV', k: 'DEV', n: L('Development', 'Development'), ord: 0, db: 'pg-jfresh-dev-•••a1', cred: 'vault://dev/•••7c', integ: L('Sandbox semua penyedia', 'Sandbox for every provider'), storage: 's3://jfresh-dev-•••', log: 'loki/jfresh-dev', config: 'cfg-dev v41', url: 'dev.jfresh.internal',
      data: 'dummy', version: 'v1.0.0-rc.1', health: 'healthy', lastDeploy: '2026-10-03 21:10', owner: 'EMP-121', note: L('Build harian dari branch utama.', 'Daily build from the main branch.') },
    { id: 'ENV-QA', k: 'QA', n: L('QA / Testing', 'QA / Testing'), ord: 1, db: 'pg-jfresh-qa-•••b2', cred: 'vault://qa/•••19', integ: L('Sandbox + mock gateway', 'Sandbox + mock gateway'), storage: 's3://jfresh-qa-•••', log: 'loki/jfresh-qa', config: 'cfg-qa v33', url: 'qa.jfresh.internal',
      data: 'test', version: 'v1.0.0-rc.1', health: 'warning', lastDeploy: '2026-10-04 20:00', owner: 'EMP-131', note: L('2 test case gagal menunggu retest.', '2 failed test cases waiting for retest.') },
    { id: 'ENV-UAT', k: 'UAT', n: L('UAT', 'UAT'), ord: 2, db: 'pg-jfresh-uat-•••c3', cred: 'vault://uat/•••e4', integ: L('Sandbox + WhatsApp staging', 'Sandbox + WhatsApp staging'), storage: 's3://jfresh-uat-•••', log: 'loki/jfresh-uat', config: 'cfg-uat v28', url: 'uat.jfreshlaundry.app',
      data: 'test', version: 'v0.10.0', health: 'live', lastDeploy: '2026-09-27 22:00', owner: 'EMP-130', live: true, note: L('Instans ini: UAT bersama key user.', 'This instance: UAT with key users.') },
    { id: 'ENV-PRD', k: 'PRD', n: L('Production', 'Production'), ord: 3, db: 'pg-jfresh-prd-•••d4', cred: 'vault://prd/•••90', integ: L('Penyedia produksi (kredensial terpisah)', 'Production providers (separate credentials)'), storage: 's3://jfresh-prd-•••', log: 'loki/jfresh-prd', config: 'cfg-prd v1', url: 'app.jfreshlaundry.app',
      data: 'real', version: null, health: 'standby', lastDeploy: null, owner: 'EMP-121', note: L('Belum live. Rilis awal produksi direncanakan v1.0.0.', 'Not live yet. Initial production release planned as v1.0.0.') }
  ];
  D.ENV_FLOW = ['DEV', 'QA', 'UAT', 'PRD'];

  /* ---------- NP-01 §9–§10 releases (semantic versioning) ---------- */
  // envs: per environment 'live' | 'superseded' | 'validated' | null
  D.RELEASES = [
    { id: 'RLS-001', v: 'v0.9.0', type: 'minor', date: '2026-08-15', st: 'superseded', build: { st: 'ok', no: 'b512', at: '2026-08-14 22:10' }, envs: { DEV: 'superseded', QA: 'superseded', UAT: 'superseded', PRD: null },
      notes: L('Fondasi Fase 1–10 di satu aplikasi.', 'Phase 1–10 foundation in one app.'), changes: [L('Akses & app shell', 'Access & app shell'), L('Logistik, produksi, delivery, finance', 'Logistics, production, delivery, finance')], db: L('Skema awal (42 tabel)', 'Initial schema (42 tables)'), known: [], rollback: { to: null, plan: L('Tidak ada versi sebelumnya: restore backup awal.', 'No previous version: restore the initial backup.') } },
    { id: 'RLS-002', v: 'v0.9.1', type: 'patch', date: '2026-08-29', st: 'superseded', build: { st: 'ok', no: 'b547', at: '2026-08-28 21:40' }, envs: { DEV: 'superseded', QA: 'superseded', UAT: 'superseded', PRD: null },
      notes: L('Perbaikan bug timbangan & POD.', 'Scale & POD bug fixes.'), changes: [L('Perbaikan pembulatan berat', 'Weight rounding fix'), L('POD foto wajib', 'POD photo mandatory')], db: L('Tidak ada', 'None'), known: [], rollback: { to: 'v0.9.0', plan: L('Deploy ulang v0.9.0, tanpa migrasi DB.', 'Redeploy v0.9.0, no DB migration.') } },
    { id: 'RLS-003', v: 'v0.9.2', type: 'patch', date: '2026-09-12', st: 'superseded', build: { st: 'ok', no: 'b588', at: '2026-09-11 22:00' }, envs: { DEV: 'superseded', QA: 'superseded', UAT: 'superseded', PRD: null },
      notes: L('Perbaikan invoice & aging.', 'Invoice & aging fixes.'), changes: [L('Aging bucket 90+', 'Aging 90+ bucket'), L('Koreksi invoice berversi', 'Versioned invoice correction')], db: L('Kolom versi invoice', 'Invoice version column'), known: [], rollback: { to: 'v0.9.1', plan: L('Deploy ulang v0.9.1 + rollback migrasi kolom versi.', 'Redeploy v0.9.1 + roll back the version column migration.') } },
    { id: 'RLS-004', v: 'v0.10.0', type: 'minor', date: '2026-09-26', st: 'live', build: { st: 'ok', no: 'b631', at: '2026-09-25 22:30' }, envs: { DEV: 'superseded', QA: 'superseded', UAT: 'live', PRD: null },
      notes: L('Portal klien & governance (Fase 11).', 'Client portal & governance (Phase 11).'), changes: [L('Portal klien multi-properti', 'Multi-property client portal'), L('System admin & audit terpadu', 'System admin & unified audit')], db: L('Tabel user klien & audit', 'Client user & audit tables'), known: [L('WhatsApp staging rate limit', 'WhatsApp staging rate limit')], rollback: { to: 'v0.9.2', plan: L('Deploy ulang v0.9.2; data user klien tetap (tabel baru tidak dihapus).', 'Redeploy v0.9.2; client user data kept (new tables not dropped).') } },
    { id: 'RLS-005', v: 'v1.0.0-rc.1', type: 'rc', date: '2026-10-03', st: 'testing', build: { st: 'ok', no: 'b672', at: '2026-10-03 21:00' }, envs: { DEV: 'live', QA: 'live', UAT: null, PRD: null },
      notes: L('Release candidate go-live: Fase 12 implementasi, Smart Help, reset & cutover.', 'Go-live release candidate: Phase 12 implementation, Smart Help, reset & cutover.'), changes: [L('Implementation & QA center', 'Implementation & QA center'), L('Smart Help & training', 'Smart Help & training'), L('Data reset & production start', 'Data reset & production start')], db: L('Tabel help, reset batch, snapshot', 'Help, reset batch, snapshot tables'), known: [L('BUG-003 sinkron timbangan offline', 'BUG-003 offline scale sync')], rollback: { to: 'v0.10.0', plan: L('Deploy ulang v0.10.0; tabel Fase 12 tidak dipakai versi lama.', 'Redeploy v0.10.0; Phase 12 tables are unused by the old version.') } },
    { id: 'RLS-006', v: 'v1.0.0', type: 'major', date: '2026-11-01', st: 'planned', build: { st: 'pending', no: null, at: null }, envs: { DEV: null, QA: null, UAT: null, PRD: null }, initial: true,
      notes: L('Rilis awal produksi (production start 1 Nov 2026 00:00).', 'Initial production release (production start 1 Nov 2026 00:00).'), changes: [L('rc.1 + perbaikan UAT', 'rc.1 + UAT fixes')], db: L('Migrasi data master & saldo awal', 'Master data & opening balance migration'), known: [], rollback: { to: 'v0.10.0', plan: L('Rollback terkontrol ke snapshot sebelum production start (§84).', 'Controlled rollback to the pre-production-start snapshot (§84).') } }
  ];
  // Promotion history [id, release, from, to, requested by, at, approved by, at, deployed by, at, validated, result]
  D.PROMOS = [
    ['PRM-001', 'RLS-004', 'DEV', 'QA', 'EMP-130', '2026-09-24 09:00', 'EMP-131', '2026-09-24 11:00', 'EMP-121', '2026-09-24 20:00', '2026-09-25 09:00', 'pass'],
    ['PRM-002', 'RLS-004', 'QA', 'UAT', 'EMP-131', '2026-09-26 10:00', 'EMP-130', '2026-09-26 14:00', 'EMP-121', '2026-09-27 22:00', '2026-09-28 08:30', 'pass'],
    ['PRM-003', 'RLS-005', 'DEV', 'QA', 'EMP-130', '2026-10-04 09:00', 'EMP-131', '2026-10-04 10:30', 'EMP-121', '2026-10-04 20:00', '2026-10-05 09:10', 'pass']
  ];

  /* ---------- NP-03 §16–§17 module waves (build % is computed from the real screen registry) ---------- */
  // [k, wave, id, en, phases, registry keys (C.<key>), owner emp, integration %, uat % (seed until JFGO reports), release, test modules]
  D.WAVES = [
    ['W1', 1, 'Fondasi', 'Foundation', [1, 2, 3, 4], ['SCREENS', 'X'], 'EMP-121', 100, 92, 'v0.9.0', ['access']],
    ['W2', 2, 'Klien & Komersial', 'Client & Commercial', [6], ['SCREENS_P6'], 'EMP-040', 95, 88, 'v0.9.0', ['comm']],
    ['W3', 3, 'Logistik', 'Logistics', [7], ['SCREENS_P7'], 'EMP-002', 92, 85, 'v0.9.1', ['logi']],
    ['W4', 4, 'Produksi', 'Production', [8], ['SCREENS_P8'], 'EMP-021', 90, 80, 'v0.9.1', ['prod']],
    ['W5', 5, 'Penyelesaian Layanan', 'Completion', [9], ['SCREENS_P9'], 'EMP-096', 85, 75, 'v0.9.2', ['dlv']],
    ['W6', 6, 'Finance', 'Finance', [10], ['SCREENS_P10'], 'EMP-030', 80, 70, 'v0.9.2', ['fin']],
    ['W7', 7, 'Intelligence', 'Intelligence', [5], ['SCREENS_P5'], 'EMP-050', 88, 78, 'v0.9.0', ['perf']],
    ['W8', 8, 'Portal Klien & Governance', 'Client Portal & Governance', [11], ['SCREENS_P11C', 'SCREENS_P11SYS'], 'EMP-121', 75, 55, 'v0.10.0', ['clp', 'sys']]
  ];
  D.MOD_WAVE = { access: 'W1', comm: 'W2', logi: 'W3', prod: 'W4', dlv: 'W5', fin: 'W6', perf: 'W7', clp: 'W8', sys: 'W8', imp: 'W8' };

  /* ---------- §18 integration map: Client → Order → Pickup → Production → Delivery → Billing → Finance → KPI ---------- */
  D.FLOW = [['client', 'Klien', 'Client'], ['order', 'Order', 'Order'], ['pickup', 'Pickup', 'Pickup'], ['production', 'Produksi', 'Production'], ['delivery', 'Delivery', 'Delivery'], ['billing', 'Billing', 'Billing'], ['finance', 'Finance', 'Finance'], ['kpi', 'KPI', 'KPI']];

  /* ---------- §17 blockers ---------- */
  // [id, title id, title en, wave, severity, owner emp, due, status open|progress|resolved, bug, link (flow connection 'from>to')]
  D.BLOCKERS = [
    ['BLK-001', 'Sinkron timbangan Plant 2 terputus saat offline', 'Plant 2 scale sync breaks while offline', 'W4', 'high', 'EMP-121', '2026-10-09', 'progress', 'BUG-003', 'pickup>production'],
    ['BLK-002', 'Billing Ready belum terkirim otomatis untuk delivery parsial', 'Billing Ready not sent automatically for partial deliveries', 'W5', 'high', 'EMP-030', '2026-10-10', 'open', 'BUG-005', 'delivery>billing'],
    ['BLK-003', 'Payment gateway terputus (kontrak penyedia baru)', 'Payment gateway disconnected (new provider contract)', 'W6', 'medium', 'EMP-030', '2026-10-20', 'open', null, 'billing>finance'],
    ['BLK-004', 'Template WhatsApp klien belum disetujui Meta', 'Client WhatsApp templates not yet approved by Meta', 'W8', 'medium', 'EMP-121', '2026-10-15', 'progress', null, null],
    ['BLK-005', 'Saldo awal AR menunggu rekonsiliasi Finance', 'Opening AR balance waiting for Finance reconciliation', 'W6', 'critical', 'EMP-132', '2026-10-12', 'open', 'BUG-007', null],
    ['BLK-006', 'Rute driver baru Sanur belum dipetakan', 'New Sanur driver route not mapped yet', 'W3', 'low', 'EMP-002', '2026-09-30', 'resolved', null, 'order>pickup']
  ];

  /* ---------- NP-04 §21 QA test cases (~40) ---------- */
  // [id, module, scenario id, scenario en, severity, status, tester emp, expected id, expected en, actual|null, evidence|null, retest count]
  D.TESTCASES = [
    ['TC-001', 'access', 'Login dengan username & password benar', 'Login with correct username & password', 'high', 'pass', 'EMP-131', 'Masuk ke halaman awal sesuai peran', 'Lands on the role home page', null, 'scr-tc001.png', 0],
    ['TC-002', 'access', 'Akun terkunci setelah 5 kali gagal', 'Account locked after 5 failed attempts', 'critical', 'pass', 'EMP-131', 'Akun terkunci 15 menit, audit tercatat', 'Account locked 15 min, audit recorded', null, 'scr-tc002.png', 0],
    ['TC-003', 'access', 'Sesi habis setelah 30 menit tidak aktif', 'Session expires after 30 minutes idle', 'high', 'pass', 'EMP-131', 'Kembali ke login dengan pesan sesi habis', 'Back to login with a session-expired message', null, null, 0],
    ['TC-004', 'access', 'Ganti peran untuk user multi-role', 'Switch role for a multi-role user', 'medium', 'pass', 'EMP-131', 'Menu & izin berganti sesuai peran', 'Menu & permissions change with the role', null, null, 0],
    ['TC-005', 'access', 'Lupa password: token sekali pakai 30 menit', 'Forgot password: one-time 30-minute token', 'high', 'pass', 'EMP-131', 'Token kedua ditolak', 'A second use of the token is refused', null, null, 0],
    ['TC-006', 'comm', 'Buat kontrak berversi untuk properti grup', 'Create a versioned contract for a group property', 'high', 'pass', 'EMP-131', 'Versi baru aktif, versi lama tersimpan', 'New version active, old version kept', null, null, 0],
    ['TC-007', 'comm', 'Rate card berlaku sesuai tanggal efektif', 'Rate card applies by effective date', 'critical', 'pass', 'EMP-131', 'Tarif order mengikuti tanggal order', 'Order rate follows the order date', null, null, 0],
    ['TC-008', 'comm', 'Klien onhold tidak bisa buat order', 'Client on hold cannot create orders', 'high', 'pass', 'EMP-131', 'Order ditolak dengan kode hold', 'Order refused with code hold', null, null, 0],
    ['TC-009', 'comm', 'Komplain tercatat ke timeline klien', 'Complaint recorded on the client timeline', 'medium', 'pass', 'EMP-131', 'Timeline menampilkan komplain', 'Timeline shows the complaint', null, null, 0],
    ['TC-010', 'logi', 'Request pickup dari portal klien', 'Pickup request from the client portal', 'critical', 'pass', 'EMP-131', 'Order src klien tampil di dispatch', 'Client-source order appears in dispatch', null, null, 0],
    ['TC-011', 'logi', 'Deteksi order duplikat', 'Duplicate order detection', 'high', 'pass', 'EMP-131', 'Peringatan duplikat, lanjut dengan alasan', 'Duplicate warning, continue with a reason', null, null, 0],
    ['TC-012', 'logi', 'Assign driver & trip', 'Assign driver & trip', 'high', 'pass', 'EMP-131', 'Order berstatus assigned dengan trip', 'Order is assigned with a trip', null, null, 0],
    ['TC-013', 'logi', 'ETA & tracking klien', 'Client ETA & tracking', 'medium', 'retest', 'EMP-131', 'ETA diperbarui setiap 2 menit', 'ETA refreshes every 2 minutes', 'ETA basi 6 menit saat sinyal lemah', 'ETA stale 6 minutes on weak signal', 1],
    ['TC-014', 'logi', 'Handover driver ke plant', 'Driver to plant handover', 'high', 'pass', 'EMP-131', 'Bag diterima, selisih tercatat', 'Bags received, differences recorded', null, null, 0],
    ['TC-015', 'prod', 'Receiving & timbang otomatis', 'Receiving & automatic weighing', 'critical', 'fail', 'EMP-131', 'Berat bersih dari timbangan tersimpan', 'Net weight from the scale is stored', 'Plant 2 offline: berat manual tidak tersinkron', 'Plant 2 offline: manual weight not synced', 1],
    ['TC-016', 'prod', 'Sorting & pembuatan batch', 'Sorting & batch creation', 'high', 'pass', 'EMP-131', 'Batch dibuat dari lot hasil sorting', 'Batch created from sorted lots', null, null, 0],
    ['TC-017', 'prod', 'Mesin overload diblokir', 'Machine overload blocked', 'critical', 'pass', 'EMP-131', 'Batch > batas kapasitas ditolak', 'Batch above the capacity limit refused', null, null, 0],
    ['TC-018', 'prod', 'QC gagal tidak bisa packing', 'QC failed cannot be packed', 'critical', 'pass', 'EMP-131', 'Packing ditolak, rework dibuat', 'Packing refused, rework created', null, null, 0],
    ['TC-019', 'prod', 'Handover Tim 1 → Tim 2', 'Team 1 → Team 2 handover', 'high', 'pass', 'EMP-131', 'Penerima konfirmasi qty', 'Receiver confirms qty', null, null, 0],
    ['TC-020', 'prod', 'Release ke logistics', 'Release to logistics', 'high', 'pass', 'EMP-131', 'Release tercatat dengan label', 'Release recorded with a label', null, null, 0],
    ['TC-021', 'dlv', 'POD dengan tanda tangan & foto', 'POD with signature & photo', 'critical', 'pass', 'EMP-131', 'POD lengkap, terkunci', 'POD complete, locked', null, null, 0],
    ['TC-022', 'dlv', 'Service completion beku setelah POD', 'Service completion frozen after POD', 'high', 'pass', 'EMP-131', 'Data completion tidak bisa diubah tanpa amend', 'Completion data cannot change without an amendment', null, null, 0],
    ['TC-023', 'dlv', 'Billing Ready terkirim ke Finance', 'Billing Ready sent to Finance', 'critical', 'fail', 'EMP-131', 'Billing Ready masuk outbox Finance', 'Billing Ready reaches the Finance outbox', 'Delivery parsial tidak terkirim otomatis', 'Partial delivery not sent automatically', 0],
    ['TC-024', 'dlv', 'Retur & redelivery', 'Return & redelivery', 'medium', 'pass', 'EMP-131', 'Retur membuat delivery ulang', 'A return creates a redelivery', null, null, 0],
    ['TC-025', 'fin', 'Invoice dari Billing Ready', 'Invoice from Billing Ready', 'critical', 'pass', 'EMP-131', 'Invoice draft dengan baris BR', 'Draft invoice with BR lines', null, null, 0],
    ['TC-026', 'fin', 'Invoice tanpa Billing Ready diblokir', 'Invoice without Billing Ready blocked', 'critical', 'pass', 'EMP-131', 'Build invoice ditolak', 'Invoice build refused', null, null, 0],
    ['TC-027', 'fin', 'Periode tutup tidak bisa diubah diam-diam', 'Closed period cannot be edited silently', 'critical', 'pass', 'EMP-131', 'Posting ke periode tutup ditolak', 'Posting into a closed period refused', null, null, 0],
    ['TC-028', 'fin', 'Pembayaran ganda diperingatkan', 'Duplicate payment warned', 'critical', 'pass', 'EMP-131', 'Peringatan duplikat, override butuh izin', 'Duplicate warning, override needs permission', null, null, 0],
    ['TC-029', 'fin', 'Saldo awal AR = subledger', 'Opening AR equals the subledger', 'critical', 'blocked', 'EMP-131', 'Selisih 0', 'Difference 0', 'Menunggu rekonsiliasi saldo awal (BLK-005)', 'Waiting for the opening balance reconciliation (BLK-005)', 0],
    ['TC-030', 'fin', 'Persetujuan kas di atas batas', 'Cash approval above the limit', 'high', 'pass', 'EMP-131', 'Kas > 5 jt butuh persetujuan', 'Cash > 5 M needs approval', null, null, 0],
    ['TC-031', 'perf', 'Dashboard eksekutif memuat KPI', 'Executive dashboard loads KPIs', 'medium', 'pass', 'EMP-131', 'KPI tampil < 2 detik', 'KPIs show < 2 seconds', null, null, 0],
    ['TC-032', 'perf', 'Scorecard Ambidex per tim', 'Ambidex scorecard per team', 'medium', 'pass', 'EMP-131', 'Skor sesuai formula', 'Score matches the formula', null, null, 0],
    ['TC-033', 'clp', 'Klien A tidak melihat invoice klien B', 'Client A cannot see client B invoices', 'critical', 'pass', 'EMP-131', 'Akses ditolak (scope)', 'Access denied (scope)', null, null, 0],
    ['TC-034', 'clp', 'User klien terbatas properti', 'Client user limited to properties', 'high', 'pass', 'EMP-131', 'Hanya properti terpilih tampil', 'Only selected properties show', null, null, 0],
    ['TC-035', 'clp', 'Statement of account klien', 'Client statement of account', 'medium', 'retest', 'EMP-131', 'Saldo akhir = outstanding', 'Closing balance = outstanding', 'Pembulatan Rp 1 pada statement grup', 'Rp 1 rounding on the group statement', 1],
    ['TC-036', 'sys', 'Role privileged butuh persetujuan', 'Privileged role needs approval', 'critical', 'pass', 'EMP-131', 'Permintaan pending, maker ≠ checker', 'Request pending, maker ≠ checker', null, null, 0],
    ['TC-037', 'sys', 'Audit trail tidak bisa dihapus', 'Audit trail cannot be deleted', 'critical', 'pass', 'EMP-131', 'Tidak ada fungsi hapus', 'No delete function exists', null, null, 0],
    ['TC-038', 'sys', 'Import validasi sebelum konfirmasi', 'Import validated before confirmation', 'high', 'pass', 'EMP-131', 'Baris error tidak diimport', 'Error rows are not imported', null, null, 0],
    ['TC-039', 'sys', 'Integrasi WhatsApp gagal → retry', 'WhatsApp integration failure → retry', 'medium', 'blocked', 'EMP-131', 'Retry mengirim ulang pesan gagal', 'Retry resends failed messages', 'Template belum disetujui Meta (BLK-004)', 'Templates not yet approved by Meta (BLK-004)', 0],
    ['TC-040', 'imp', 'Restore test dari backup', 'Restore test from backup', 'critical', 'pass', 'EMP-121', 'Jumlah record & hash sama', 'Record counts & hash match', null, 'RST-001', 0]
  ];
  // [id, title id, title en, severity, tc, status open|fixing|fixed|retest|closed, owner emp, reported, release]
  D.BUGS = [
    ['BUG-001', 'ETA basi saat sinyal lemah', 'ETA stale on weak signal', 'medium', 'TC-013', 'retest', 'EMP-121', '2026-10-02', 'v1.0.0-rc.1'],
    ['BUG-002', 'Tombol simpan ganda di form kontrak', 'Double save button on the contract form', 'low', 'TC-006', 'closed', 'EMP-121', '2026-09-20', 'v0.10.0'],
    ['BUG-003', 'Berat manual Plant 2 tidak tersinkron', 'Plant 2 manual weight not synced', 'high', 'TC-015', 'fixing', 'EMP-121', '2026-10-04', 'v1.0.0-rc.1'],
    ['BUG-004', 'Label QR terpotong di printer thermal', 'QR label cut off on the thermal printer', 'low', 'TC-020', 'fixed', 'EMP-121', '2026-09-29', 'v1.0.0-rc.1'],
    ['BUG-005', 'Billing Ready delivery parsial tidak terkirim', 'Partial-delivery Billing Ready not sent', 'high', 'TC-023', 'open', 'EMP-121', '2026-10-05', 'v1.0.0-rc.1'],
    ['BUG-006', 'Pembulatan Rp 1 statement grup', 'Rp 1 rounding on the group statement', 'low', 'TC-035', 'retest', 'EMP-121', '2026-10-03', 'v1.0.0-rc.1'],
    ['BUG-007', 'Saldo awal AR selisih migrasi', 'Opening AR migration difference', 'critical', 'TC-029', 'open', 'EMP-132', '2026-10-05', 'v1.0.0-rc.1'],
    ['BUG-008', 'Teks EN terpotong di iPad portrait', 'EN text cut off on iPad portrait', 'low', 'TC-031', 'closed', 'EMP-121', '2026-09-22', 'v0.10.0'],
    ['BUG-009', 'Filter aging lambat > 2 dtk', 'Aging filter slow > 2 s', 'medium', 'TC-025', 'fixed', 'EMP-121', '2026-09-30', 'v1.0.0-rc.1'],
    ['BUG-010', 'Notifikasi ganda saat retry WA', 'Duplicate notification on WA retry', 'medium', 'TC-039', 'open', 'EMP-121', '2026-10-05', 'v1.0.0-rc.1']
  ];
  /* §24 automated regression = the real node suites (tools/test-*.js); counts are verified by tools/test-imp.js */
  D.SUITES = [
    ['access', 'tools/test-access.js', 51, 'W1'], ['comm', 'tools/test-comm.js', 50, 'W2'], ['logi', 'tools/test-logi.js', 44, 'W3'], ['prod', 'tools/test-prod.js', 60, 'W4'], ['dlv', 'tools/test-dlv.js', 34, 'W5'],
    ['fin', 'tools/test-fin.js', 45, 'W6'], ['perf', 'tools/test-perf.js', 80, 'W7'], ['clp', 'tools/test-clp.js', 42, 'W8'], ['sys', 'tools/test-sys.js', 40, 'W8'],
    ['imp', 'tools/test-imp.js', 42, 'W8'], ['go', 'tools/test-go.js', 46, 'W8'], ['help', 'tools/test-help.js', 35, 'W8']
  ];
  D.SUITE_RUN = '2026-10-06 07:30';

  /* ---------- NP-05 §25 roles under test → real demo users ---------- */
  // [label id, label en, role key, username]
  D.SEC_ROLES = [
    ['Tim 1', 'Team 1', 'prod1', 'putu'], ['Tim 2', 'Team 2', 'prod2', 'arta'], ['Tim 3', 'Team 3', 'prod3', 'luh'], ['Driver', 'Driver', 'driver', 'ketut'], ['Supervisor', 'Supervisor', 'supervisor', 'saras'],
    ['Operations Manager', 'Operations Manager', 'opsmgr', 'dewi'], ['Sales', 'Sales', 'sales', 'ayu'], ['Finance', 'Finance', 'finance', 'budi'], ['CFO (workspace Finance)', 'CFO (Finance workspace)', 'finance', 'gita'],
    ['Supply', 'Supply', 'supply', 'rai'], ['Asset', 'Asset', 'assetadm', 'komang'], ['HR', 'HR', 'hr', 'wulan'], ['Klien', 'Client', 'client', 'sari.grandvista'], ['Owner', 'Owner', 'owner', 'aji'],
    ['System Admin', 'System Admin', 'sysadmin', 'adit'], ['Super Admin', 'Super Admin', 'superadmin', 'rama']
  ];
  /* §27 negative access tests — all expect 'denied'. kind: screen | perm | record | golive */
  D.NEGATIVE = [
    ['SVT-001', 'driver', 'ketut', 'screen', 'FIN-001', 'Driver → Finance Dashboard', 'Driver → Finance Dashboard'],
    ['SVT-002', 'driver', 'ketut', 'perm', 'ar.view', 'Driver → lihat piutang', 'Driver → view receivables'],
    ['SVT-003', 'operator', 'made', 'perm', 'com.rate.edit', 'Operator → ubah tarif', 'Operator → edit pricing'],
    ['SVT-004', 'operator', 'made', 'perm', 'price.edit', 'Operator → ubah harga jual', 'Operator → edit selling price'],
    ['SVT-005', 'client', 'sari.grandvista', 'record', 'INV-2610-071', 'Klien CL-01 → invoice CL-07', 'Client CL-01 → CL-07 invoice'],
    ['SVT-006', 'client', 'sari.grandvista', 'record', 'ORD-2610-101', 'Klien CL-01 → order CL-07', 'Client CL-01 → CL-07 order'],
    ['SVT-007', 'sysadmin', 'adit', 'perm', 'ap.pay', 'System Admin → bayar AP tanpa izin Finance', 'System Admin → pay AP without Finance permission'],
    ['SVT-008', 'sysadmin', 'adit', 'perm', 'cash.approve', 'System Admin → setujui kas', 'System Admin → approve cash'],
    ['SVT-009', 'superadmin', 'rama', 'golive', 'decide', 'Super Admin → keputusan Go/No-Go', 'Super Admin → Go/No-Go decision'],
    ['SVT-010', 'superadmin', 'rama', 'perm', 'imp.release.approve.prod', 'Super Admin → setujui deploy produksi', 'Super Admin → approve production deployment'],
    ['SVT-011', 'prod1', 'putu', 'screen', 'HPP-001', 'Tim 1 → HPP', 'Team 1 → HPP'],
    ['SVT-012', 'client', 'sari.grandvista', 'screen', 'ADM-001', 'Klien → daftar user internal', 'Client → internal user list'],
    ['SVT-013', 'finance', 'budi', 'screen', 'SYS-001', 'Finance → System Control Center', 'Finance → System Control Center'],
    ['SVT-014', 'sales', 'ayu', 'perm', 'ap.approve', 'Sales → setujui AP', 'Sales → approve AP'],
    ['SVT-015', 'qalead', 'intan', 'perm', 'imp.release.approve.prod', 'QA Lead → setujui deploy produksi', 'QA Lead → approve production deployment'],
    ['SVT-016', 'driver', 'ketut', 'screen', 'QA-001', 'Driver → QA Dashboard', 'Driver → QA Dashboard']
  ];

  /* ---------- NP-07 §38–§43 ---------- */
  D.LATENCY = { 'INT-WA': 820, 'INT-EMAIL': 310, 'INT-MAPS': 140, 'INT-PAY': null, 'INT-BANK': 960, 'INT-ACC': 1250, 'INT-SCALE': 95, 'INT-QR': 40, 'INT-IOT': null, 'INT-ERP': null };
  // [id, kind, test id, test en, target id, target en, target ms|value, result, unit, status, at]
  D.PERF = [
    ['PFT-001', 'concurrent', '80 user bersamaan (jam sibuk pagi)', '80 concurrent users (morning peak)', 'p95 < 2.000 ms', 'p95 < 2,000 ms', 2000, 1420, 'ms', 'pass', '2026-10-02 09:00'],
    ['PFT-002', 'volume', '5.000 transaksi / hari', '5,000 transactions / day', 'Tanpa error, antrian < 5 dtk', 'No errors, queue < 5 s', 5000, 3100, 'ms', 'pass', '2026-10-02 10:00'],
    ['PFT-003', 'list', 'Daftar order 10.000 baris', 'Order list 10,000 rows', '< 1.500 ms', '< 1,500 ms', 1500, 980, 'ms', 'pass', '2026-10-02 11:00'],
    ['PFT-004', 'search', 'Cari klien/order/invoice', 'Search clients/orders/invoices', '< 800 ms', '< 800 ms', 800, 420, 'ms', 'pass', '2026-10-02 11:30'],
    ['PFT-005', 'dashboard', 'Dashboard eksekutif', 'Executive dashboard', '< 2.000 ms', '< 2,000 ms', 2000, 1750, 'ms', 'pass', '2026-10-02 13:00'],
    ['PFT-006', 'report', 'Laporan aging 12 bulan', '12-month aging report', '< 3.000 ms', '< 3,000 ms', 3000, 3400, 'ms', 'fail', '2026-10-02 14:00'],
    ['PFT-007', 'upload', 'Upload foto POD 3 MB', 'POD photo upload 3 MB', '< 4.000 ms (4G)', '< 4,000 ms (4G)', 4000, 2900, 'ms', 'pass', '2026-10-03 09:00'],
    ['PFT-008', 'import', 'Import 2.000 baris master', 'Import 2,000 master rows', '< 30.000 ms', '< 30,000 ms', 30000, 18500, 'ms', 'pass', '2026-10-03 10:00'],
    ['PFT-009', 'docs', 'Generate 50 invoice PDF', 'Generate 50 invoice PDFs', '< 20.000 ms', '< 20,000 ms', 20000, 14200, 'ms', 'pass', '2026-10-03 11:00']
  ];
  // [id, kind, scenario id, en, expected graceful behaviour id, en]
  D.RELI = [
    ['RLT-001', 'internet', 'Internet terputus di HP driver', 'Internet interruption on the driver phone', 'Mode offline, data tersimpan lokal, sinkron saat kembali online', 'Offline mode, data kept locally, synced when back online'],
    ['RLT-002', 'timeout', 'API timeout ke penyedia', 'API timeout to a provider', 'Pesan sederhana + Coba Lagi, tanpa stack trace', 'Simple message + Try Again, no stack trace'],
    ['RLT-003', 'notif', 'Notifikasi gagal terkirim', 'Notification fails to send', 'Status Failed di log, bisa dikirim ulang', 'Failed status in the log, can be retried'],
    ['RLT-004', 'storage', 'Storage gagal ditulis', 'Storage write fails', 'Aplikasi tetap jalan dengan memori, tidak crash', 'App keeps running in memory, no crash'],
    ['RLT-005', 'slow', 'Query lambat', 'Slow query', 'Indikator memuat, tidak membeku; target < 2 dtk', 'Loading indicator, no freeze; target < 2 s'],
    ['RLT-006', 'integ', 'Integrasi tidak tersedia', 'Integration unavailable', 'Status Disconnected terlihat, proses inti tetap jalan', 'Disconnected status visible, core process keeps running']
  ];
  D.RESTORE_SEED = [{ id: 'RST-001', at: '2026-09-21 03:00', by: 'EMP-121', src: 'BKP-20260921', target: L('Salinan UAT terisolasi', 'Isolated UAT copy'), res: 'pass', dur: 840000, engines: 8, records: 1984, hashOk: true, countsOk: true, note: L('Restore manual dari backup harian; validasi jumlah record & hash.', 'Manual restore from the daily backup; record counts & hash validated.'), seed: true }];
  D.BACKUP_POLICY = { freq: L('Harian 02:00 WITA + manual sebelum deploy', 'Daily 02:00 WITA + manual before each deploy'), retention: L('14 harian · 12 bulanan', '14 daily · 12 monthly'), location: L('Object storage terenkripsi (Jakarta) + salinan offsite (Singapura)', 'Encrypted object storage (Jakarta) + offsite copy (Singapore)'), owner: 'EMP-121' };
  D.DR = { rpoH: 24, rtoH: 4 };

  /* ---------- NP-02 §12–§13 data domains (records are counted live in the owner engine) ---------- */
  // [k, id, en, owner dept id, en, owner roles (domain owner approval), source engine, key, consumers]
  D.DOMAINS = [
    ['client', 'Klien', 'Client', 'Komersial', 'Commercial', ['sales'], 'JFCOMM', 'client_id (CL-)', ['Logistik', 'Produksi', 'Finance', 'Portal Klien', 'Laporan']],
    ['property', 'Properti', 'Property', 'Komersial', 'Commercial', ['sales'], 'JFCOMM', 'property_id (PR-)', ['Logistik', 'Produksi', 'Delivery', 'Finance', 'Portal Klien']],
    ['contract', 'Kontrak', 'Contract', 'Komersial + Finance', 'Commercial + Finance', ['sales', 'finance'], 'JFCOMM', 'contract_no (CTR-)', ['Logistik', 'Delivery', 'Finance']],
    ['rate', 'Tarif', 'Rate', 'Komersial + Finance', 'Commercial + Finance', ['sales', 'finance'], 'JFCOMM', 'rate_card (RC-)', ['Delivery (billing)', 'Finance', 'Costing']],
    ['order', 'Order', 'Order', 'Logistik', 'Logistics', ['opsmgr'], 'JFLOG', 'order_id (ORD-)', ['Produksi', 'Delivery', 'Finance', 'Portal Klien', 'KPI']],
    ['item', 'Item', 'Item', 'Operasional', 'Operations', ['opsmgr'], 'JFFIN', 'item_code (IT-)', ['Produksi', 'HPP', 'Pricing', 'Billing', 'Inventory']],
    ['itemweight', 'Berat Item', 'Item Weight', 'Operasional / Costing', 'Operations / Costing', ['opsmgr', 'finance'], 'JFFIN', 'item_code + version', ['HPP', 'Pricing', 'Produksi']],
    ['supplier', 'Supplier', 'Supplier', 'Supply', 'Supply', ['supply'], 'JFFIN', 'supplier_id (SUP-)', ['Pembelian', 'AP', 'Inventory']],
    ['inventory', 'Persediaan', 'Inventory', 'Supply', 'Supply', ['supply'], 'JFFIN', 'stock_code', ['Produksi', 'Finance', 'HPP']],
    ['employee', 'Karyawan', 'Employee', 'HR', 'HR', ['hr'], 'JFACCESS', 'employee_id (EMP-)', ['Autentikasi', 'Role Access', 'KPI', 'Operasional']],
    ['asset', 'Aset', 'Asset', 'Asset Admin', 'Asset Admin', ['assetadm'], 'JFFIN', 'asset_code (AST-)', ['Maintenance', 'Finance (penyusutan)']],
    ['coa', 'Bagan Akun', 'Chart of Accounts', 'Finance', 'Finance', ['finance'], 'JFFIN', 'account_no', ['Jurnal', 'Laporan keuangan']],
    ['user', 'User / Role', 'User / Role', 'System Admin', 'System Admin', ['sysadmin', 'superadmin'], 'JFACCESS', 'user_id (USR-)', ['Semua modul']],
    ['payment', 'Pembayaran', 'Payment', 'Finance', 'Finance', ['finance'], 'JFFIN', 'payment_id (PAY-)', ['AR', 'Kas & bank', 'Jurnal', 'Portal Klien']]
  ];

  if (typeof module !== 'undefined' && module.exports) module.exports = D;
  else root.JFIMP_DATA = D;
})(typeof window !== 'undefined' ? window : this);
