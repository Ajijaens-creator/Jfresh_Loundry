/* ==========================================================================
   JFRESH OS — Phase 5 demo data (NP 1.0)
   Seed data for the Executive, Financial & Ambidex Performance OS. Every
   number on the Phase 5 screens is either stored here or calculated from it
   by the engine (jfos-perf.js). Reference date: Tuesday 6 October 2026
   (ISO week 41). September 2026 is the last closed month; its four R2RE
   weeks are the weeks whose Monday falls in September (W37–W40).

   Demo values only: replace with JFRESH OS transactions when the backend
   exists (§80). Labels are [Bahasa Indonesia, English] pairs.
   ========================================================================== */
(function (root) {
  function L(a, b) { return [a, b === undefined ? a : b]; }
  var JT = 1e6;
  var D = { today: '2026-10-06', week: 41, month: '2026-10', closedMonth: '2026-09' };

  /* ---------- People (employee records; user accounts live in Phase 4) ----------
     role: role KPI set · team · st: tetap / kontrak / probation */
  D.PEOPLE = [
    { id: 'EMP-001', n: 'Made Wirana', role: 'rcv', team: 'rcv', plant: 'PL-01', st: 'tetap', title: L('Team Leader · Receiving', 'Team Leader · Receiving'), join: '2022-03-14', ind: [99.6, 188, 97.8, 0.42, 98.5], contrib: 92, hist: [88.9, 90.2, 90.8, 92.1, 91.6, 93.3, 93.8, 94.7, 94.4, 95.9, 97.1, 0] },
    { id: 'EMP-061', n: 'Putu Rahayu', role: 'rcv', team: 'rcv', plant: 'PL-01', st: 'kontrak', title: L('Receiving Operator', 'Receiving Operator'), join: '2024-07-01', ind: [99.1, 171, 96.2, 0.66, 96.0], contrib: 84, hist: [71.1, 72.3, 73.2, 74.9, 75.1, 76.4, 77.2, 78.0, 78.5, 79.1, 79.7, 0] },
    { id: 'EMP-073', n: 'Ni Kadek Ayu', role: 'rcv', team: 'rcv', plant: 'PL-02', st: 'probation', title: L('Receiving Operator', 'Receiving Operator'), join: '2026-07-20', ind: [98.4, 158, 94.0, 0.9, 95.5], contrib: 78, hist: [0, 0, 0, 0, 0, 0, 0, 0, 0, 67.3, 70.0, 0] },
    { id: 'EMP-021', n: 'Saras Pradnyani', role: 'spv', team: 'ops', plant: 'PL-01', st: 'tetap', title: L('Supervisor Operasional · Race Leader', 'Operations Supervisor · Race Leader'), join: '2021-01-11', ind: [94.8, 41.2, 88, 2.06, 5], contrib: 90, hist: [88.3, 89.1, 89.8, 90.5, 91.2, 91.7, 91.3, 92.1, 92.4, 91.8, 91.2, 0] },
    { id: 'EMP-010', n: 'Dewi Lestari', role: 'spv', team: 'ops', plant: 'PL-01', st: 'tetap', title: L('Operations Manager', 'Operations Manager'), join: '2020-06-01', ind: [95.1, 41.2, 91, 2.1, 6], contrib: 88, hist: [88.2, 88.8, 89.4, 89.2, 90.1, 90.5, 91.0, 91.2, 90.8, 91.4, 91.1, 0] },
    { id: 'EMP-071', n: 'Wayan Arta', role: 'prod', team: 'wsh', plant: 'PL-01', st: 'tetap', title: L('Team Leader · Washing', 'Team Leader · Washing'), join: '2022-09-05', ind: [101.5, 97.2, 95.0, 93.0, 97.0], contrib: 86, hist: [87.1, 87.6, 88.8, 88.6, 90.0, 90.6, 91.1, 90.4, 91.5, 92.2, 90.7, 0] },
    { id: 'EMP-074', n: 'Putu Eka', role: 'prod', team: 'wsh', plant: 'PL-01', st: 'kontrak', title: L('Operator Washing', 'Washing Operator'), join: '2025-02-10', ind: [86.0, 94.5, 88.0, 85.0, 90.5], contrib: 66, hist: [68.9, 68.0, 67.5, 66.7, 65.8, 64.9, 64.3, 63.7, 63.1, 62.4, 61.8, 0] },
    { id: 'EMP-075', n: 'Nengah Budi', role: 'prod', team: 'dry', plant: 'PL-01', st: 'tetap', title: L('Team Leader · Drying', 'Team Leader · Drying'), join: '2023-01-16', ind: [92.0, 98.0, 93.5, 96.0, 98.0], contrib: 85, hist: [81.4, 82.0, 82.6, 83.2, 83.9, 84.3, 84.0, 84.8, 85.2, 85.9, 83.4, 0] },
    { id: 'EMP-076', n: 'Ketut Sari', role: 'prod', team: 'dry', plant: 'PL-02', st: 'tetap', title: L('Operator Drying', 'Drying Operator'), join: '2023-08-01', ind: [99.0, 98.4, 96.5, 95.0, 97.5], contrib: 83, hist: [85.9, 86.8, 87.4, 88.3, 89.0, 89.8, 90.3, 90.9, 91.5, 91.9, 92.6, 0] },
    { id: 'EMP-064', n: 'Dewa Ayu', role: 'prod', team: 'fin', plant: 'PL-01', st: 'tetap', title: L('Team Leader · Finishing', 'Team Leader · Finishing'), join: '2022-05-23', ind: [97.0, 98.6, 94.0, 96.0, 99.0], contrib: 87, hist: [85.8, 86.2, 86.8, 87.6, 88.3, 87.9, 88.8, 89.4, 89.8, 90.1, 89.6, 0] },
    { id: 'EMP-077', n: 'Luh Putri', role: 'prod', team: 'fin', plant: 'PL-01', st: 'kontrak', title: L('Operator Finishing', 'Finishing Operator'), join: '2025-04-07', ind: [103.0, 97.8, 97.5, 98.0, 98.0], contrib: 89, hist: [85.6, 86.8, 88.0, 89.1, 90.2, 91.0, 92.1, 92.7, 93.6, 94.4, 95.0, 0] },
    { id: 'EMP-070', n: 'Komang Sari', role: 'qc', team: 'qc', plant: 'PL-01', st: 'tetap', title: L('QC Lead', 'QC Lead'), join: '2021-11-01', ind: [99.2, 2.06, 96.0, 18.0, 99.0], contrib: 90, hist: [92.8, 93.4, 94.1, 94.7, 95.2, 94.8, 95.7, 96.2, 95.8, 95.0, 94.3, 0] },
    { id: 'EMP-062', n: 'Kadek Rina', role: 'qc', team: 'qc', plant: 'PL-01', st: 'tetap', title: L('QC Inspector', 'QC Inspector'), join: '2023-03-20', ind: [98.6, 2.2, 93.0, 21.0, 96.0], contrib: 81, hist: [79.6, 80.2, 81.0, 81.6, 81.8, 82.5, 82.9, 82.6, 83.4, 83.7, 83.1, 0] },
    { id: 'EMP-078', n: 'Gusti Rai', role: 'prod', team: 'pck', plant: 'PL-01', st: 'tetap', title: L('Team Leader · Packing', 'Team Leader · Packing'), join: '2022-10-10', ind: [96.0, 99.4, 93.2, 95.0, 97.0], contrib: 82, hist: [84.8, 85.5, 86.3, 86.8, 87.4, 88.0, 87.8, 88.5, 88.8, 88.2, 87.6, 0] },
    { id: 'EMP-002', n: 'Ketut Arsana', role: 'drv', team: 'dlv', plant: 'PL-01', st: 'tetap', title: L('Driver · Rute Ubud', 'Driver · Ubud Route'), join: '2022-01-03', ind: [96.8, 97.0, 99.5, 1, 5.6], contrib: 88, hist: [90.7, 91.2, 91.8, 92.6, 92.9, 93.5, 94.2, 94.7, 95.1, 95.8, 96.3, 0] },
    { id: 'EMP-063', n: 'Gede Wira', role: 'drv', team: 'dlv', plant: 'PL-01', st: 'tetap', title: L('Driver · Rute Gianyar', 'Driver · Gianyar Route'), join: '2023-06-12', ind: [92.5, 91.0, 98.2, 3, 6.8], contrib: 72, hist: [78.2, 77.7, 77.3, 76.7, 76.3, 75.7, 75.2, 74.8, 74.5, 73.9, 73.6, 0] },
    { id: 'EMP-030', n: 'Budi Santoso', role: 'fin', team: 'fnc', plant: 'PL-01', st: 'tetap', title: L('Finance Lead', 'Finance Lead'), join: '2021-04-05', ind: [99.3, 98.5, 91.4, 8.3, 1], contrib: 87, hist: [85.2, 86.0, 86.4, 87.1, 87.5, 88.1, 88.4, 88.0, 87.3, 86.6, 86.1, 0] },
    { id: 'EMP-079', n: 'Desak Mira', role: 'fin', team: 'fnc', plant: 'PL-01', st: 'kontrak', title: L('Staf Billing', 'Billing Officer'), join: '2025-01-13', ind: [98.8, 99.2, 91.4, 8.3, 1], contrib: 85, hist: [78.4, 79.5, 80.6, 81.4, 82.3, 82.8, 83.4, 84.0, 84.5, 84.8, 84.4, 0] },
    { id: 'EMP-040', n: 'Ayu Lestari', role: 'sales', team: 'sls', plant: 'PL-01', st: 'tetap', title: L('Account Manager', 'Account Manager'), join: '2022-08-08', ind: [2, 96, 380 * JT, 22], contrib: 86, hist: [80.7, 82.1, 82.7, 84.2, 84.7, 85.9, 85.5, 86.3, 86.8, 85.7, 84.9, 0] },
    { id: 'EMP-080', n: 'Kevin Hartono', role: 'sales', team: 'sls', plant: 'PL-01', st: 'probation', title: L('Sales Executive', 'Sales Executive'), join: '2026-08-03', ind: [0, 95, 120 * JT, 18], contrib: 74, hist: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 50.0, 0] },
    { id: 'EMP-081', n: 'Made Ayu', role: 'prod', team: 'cs', plant: 'PL-01', st: 'tetap', title: L('Lead Customer Service', 'Customer Service Lead'), join: '2023-02-06', ind: [98.0, 97.5, 92.0, 96.0, 98.0], contrib: 84, hist: [85.6, 86.2, 87.0, 86.6, 87.8, 88.4, 88.7, 88.1, 89.0, 89.5, 88.8, 0] }
  ];

  /* ---------- HR records (§44) — detailed for a few people, defaults for the rest ---------- */
  D.HR = {
    'EMP-001': {
      att: { days: 22, present: 21, late: 1, absent: 0, leave: 1 },
      coaching: [['2026-09-24', 'Saras Pradnyani', L('Akurasi timbang bag campuran', 'Weighing accuracy for mixed bags'), L('Sudah konsisten. Lanjut bimbing operator baru.', 'Consistent now. Keep mentoring new operators.')], ['2026-08-27', 'Saras Pradnyani', L('Kecepatan receiving jam sibuk', 'Receiving speed at peak hour'), L('Target 180 kg/jam tercapai 3 minggu berturut-turut.', 'Hit 180 kg/h three weeks in a row.')]],
      training: [[L('Standar Receiving & Tagging', 'Receiving & Tagging Standard'), '2026-02-12', 'done', 6], [L('K3 & Kimia Laundry', 'Safety & Laundry Chemicals'), '2026-05-20', 'done', 4], [L('Leadership Dasar', 'Basic Leadership'), '2026-10-22', 'planned', 8]],
      achievement: [[L('Akurasi receiving 99,6% (Sep)', 'Receiving accuracy 99.6% (Sep)'), '2026-09-30']],
      recognition: [[L('Karyawan Terbaik Q2 2026', 'Employee of the Quarter Q2 2026'), '2026-07-05', 'Aji Jaens']],
      probation: { st: 'passed', end: '2022-06-14' }, pip: null,
      promo: { k: 'ready', note: L('Siap dipertimbangkan sebagai Supervisor Receiving. Keputusan tetap di manajemen.', 'Ready to be considered for Receiving Supervisor. Management decides.') }
    },
    'EMP-074': {
      att: { days: 22, present: 18, late: 4, absent: 2, leave: 0 },
      coaching: [['2026-09-29', 'Wayan Arta', L('Kepatuhan siklus cuci', 'Wash cycle compliance'), L('Belum konsisten di shift malam. Coaching mingguan.', 'Not yet consistent on the night shift. Weekly coaching.')]],
      training: [[L('SOP Mesin Cuci Industri', 'Industrial Washer SOP'), '2026-10-14', 'planned', 4]],
      achievement: [], recognition: [],
      probation: { st: 'passed', end: '2025-05-10' },
      pip: { start: '2026-09-15', end: '2026-12-15', goals: [L('Output ≥ 95% target', 'Output ≥ 95% of target'), L('Terlambat ≤ 1x per bulan', 'Late ≤ once a month')], by: 'Dewi Lestari' },
      promo: { k: 'notyet', note: L('Fokus pada rencana perbaikan kinerja.', 'Focus on the performance improvement plan.') }
    },
    'EMP-073': { probation: { st: 'ongoing', end: '2026-10-20' }, promo: { k: 'notyet', note: L('Masih masa percobaan.', 'Still on probation.') } },
    'EMP-080': { probation: { st: 'ongoing', end: '2026-11-03' }, promo: { k: 'notyet', note: L('Masih masa percobaan.', 'Still on probation.') } }
  };

  /* ---------- Teams (§35–§39): shared team KPIs, members, member contribution ----------
     k: [code, name, dir, target, unit, weight, actual, parent KPI] */
  function TK(code, n, dir, target, unit, weight, actual, parent, o) { return Object.assign({ code: code, n: n, dir: dir, target: target, unit: unit, weight: weight, actual: actual, parent: parent || null }, o || {}); }
  D.TEAMS = [
    { k: 'ops', n: L('Operasional', 'Operations'), plant: 'PL-01', lead: 'EMP-021', reviewer: 'EMP-010', members: ['EMP-021', 'EMP-010', 'EMP-001', 'EMP-071', 'EMP-064', 'EMP-070'], trend: [89.4, 90.3, 91.2, 91.9, 92.7, 0],
      kpis: [TK('T-OPS-01', L('SLA tepat waktu', 'On-time SLA'), 'higher', 95, '%', 30, 94.8, 'OPS-01'), TK('T-OPS-02', L('Produktivitas', 'Productivity'), 'higher', 42, 'kg/jam', 25, 41.2, 'OPS-02'), TK('T-OPS-03', L('Rewash rate', 'Rewash rate'), 'lower', 2.0, '%', 25, 2.06, 'QLT-02'), TK('T-OPS-04', L('Ide perbaikan dijalankan', 'Improvement ideas implemented'), 'higher', 2, L('ide', 'ideas'), 20, 2, 'INV-01', { floor: null })] },
    { k: 'rcv', n: L('Receiving', 'Receiving'), plant: 'PL-01', lead: 'EMP-001', reviewer: 'EMP-021', members: ['EMP-001', 'EMP-061', 'EMP-073'], trend: [91, 92.2, 93.1, 94, 95.3, 0],
      kpis: [TK('T-RCV-01', L('Akurasi receiving', 'Receiving accuracy'), 'higher', 99.5, '%', 35, 99.4), TK('T-RCV-02', L('Kg diterima per jam', 'Kg received per hour'), 'higher', 180, 'kg/jam', 25, 176, 'OPS-02'), TK('T-RCV-03', L('Kepatuhan tagging bag', 'Bag tagging compliance'), 'higher', 100, '%', 20, 99.2), TK('T-RCV-04', L('Waktu receiving ke sortir', 'Receiving to sorting time'), 'lower', 30, L('menit', 'min'), 20, 28, 'OPS-04')] },
    { k: 'wsh', n: L('Washing', 'Washing'), plant: 'PL-01', lead: 'EMP-071', reviewer: 'EMP-021', members: ['EMP-071', 'EMP-074'], trend: [81.2, 81.9, 82.4, 81.6, 80.8, 0],
      kpis: [TK('T-WSH-01', L('Utilisasi mesin', 'Machine utilisation'), 'range', 82.5, '%', 25, 88, 'OPS-03', { lo: 75, hi: 90 }), TK('T-WSH-02', L('Kepatuhan siklus cuci', 'Wash cycle compliance'), 'higher', 98, '%', 30, 95.4), TK('T-WSH-03', L('Akurasi dosis kimia', 'Chemical dosing accuracy'), 'higher', 97, '%', 25, 91.5, 'FIN-05'), TK('T-WSH-04', L('Pemakaian air', 'Water use'), 'lower', 8.0, 'L/kg', 20, 8.6, 'INV-03')] },
    { k: 'dry', n: L('Drying', 'Drying'), plant: 'PL-01', lead: 'EMP-075', reviewer: 'EMP-021', members: ['EMP-075', 'EMP-076'], trend: [84.3, 85.1, 85.4, 86.2, 83.9, 0],
      kpis: [TK('T-DRY-01', L('Uptime dryer', 'Dryer uptime'), 'higher', 98, '%', 30, 93.5, 'OPS-05'), TK('T-DRY-02', L('Energi per kg', 'Energy per kg'), 'lower', 0.45, 'kWh/kg', 25, 0.47, null, { floor: 50 }), TK('T-DRY-03', L('Kepatuhan kelembapan', 'Moisture compliance'), 'higher', 98, '%', 25, 97.6), TK('T-DRY-04', L('Throughput', 'Throughput'), 'higher', 160, 'kg/jam', 20, 151, 'OPS-02')] },
    { k: 'fin', n: L('Finishing', 'Finishing'), plant: 'PL-01', lead: 'EMP-064', reviewer: 'EMP-021', members: ['EMP-064', 'EMP-077'], trend: [85, 85.9, 86.5, 87.1, 85.7, 0],
      kpis: [TK('T-FIN-01', L('Throughput setrika', 'Ironing throughput'), 'higher', 220, L('pcs/jam', 'pcs/h'), 30, 214, 'OPS-02'), TK('T-FIN-02', L('Kualitas lipat', 'Folding quality'), 'higher', 98, '%', 30, 98.4, 'QLT-01'), TK('T-FIN-03', L('Lembur finishing', 'Finishing overtime'), 'lower', 40, L('jam', 'h'), 20, 52, 'FIN-05', { floor: 50 }), TK('T-FIN-04', L('Rework', 'Rework'), 'lower', 1.5, '%', 20, 1.4, 'QLT-02')] },
    { k: 'qc', n: L('QC', 'QC'), plant: 'PL-01', lead: 'EMP-070', reviewer: 'EMP-021', members: ['EMP-070', 'EMP-062'], trend: [92.4, 93.1, 93.7, 93.3, 92.2, 0],
      kpis: [TK('T-QC-01', L('Akurasi QC', 'QC accuracy'), 'higher', 99, '%', 30, 98.9, 'QLT-01'), TK('T-QC-02', L('Rewash rate', 'Rewash rate'), 'lower', 2.0, '%', 25, 2.1, 'QLT-02'), TK('T-QC-03', L('Deteksi masalah', 'Issue detection'), 'higher', 95, '%', 25, 94.5, 'QLT-03'), TK('T-QC-04', L('Waktu QC', 'QC turnaround'), 'lower', 20, L('menit', 'min'), 20, 19, 'OPS-04')] },
    { k: 'pck', n: L('Packing', 'Packing'), plant: 'PL-01', lead: 'EMP-078', reviewer: 'EMP-021', members: ['EMP-078'], trend: [88.4, 89.3, 90, 89.5, 88.3, 0],
      kpis: [TK('T-PCK-01', L('Akurasi packing', 'Packing accuracy'), 'higher', 99.5, '%', 35, 99.3), TK('T-PCK-02', L('Packing tepat waktu', 'Packing on time'), 'higher', 97, '%', 30, 92.6, 'OPS-01'), TK('T-PCK-03', L('Kepatuhan label', 'Label compliance'), 'higher', 100, '%', 20, 99.6), TK('T-PCK-04', L('Biaya kemasan', 'Packaging cost'), 'lower', 450, 'Rp/kg', 15, 470, 'FIN-05')] },
    { k: 'dlv', n: L('Delivery', 'Delivery'), plant: 'PL-01', lead: 'EMP-002', reviewer: 'EMP-010', members: ['EMP-002', 'EMP-063'], trend: [85.2, 85.8, 86.6, 87, 86.4, 0],
      kpis: [TK('T-DLV-01', L('Pengiriman tepat waktu', 'On-time delivery'), 'higher', 96, '%', 30, 94.7, 'OPS-01'), TK('T-DLV-02', L('Kelengkapan POD', 'POD completeness'), 'higher', 100, '%', 25, 98.8), TK('T-DLV-03', L('Efisiensi rute', 'Route efficiency'), 'lower', 6.0, 'km/stop', 25, 6.2), TK('T-DLV-04', L('Masalah pengiriman klien', 'Client delivery issues'), 'lower', 3, L('kasus', 'cases'), 20, 4, 'CLI-03', { floor: null })] },
    { k: 'fnc', n: L('Finance', 'Finance'), plant: 'PL-01', lead: 'EMP-030', reviewer: 'EMP-050', members: ['EMP-030', 'EMP-079'], trend: [94.5, 95, 94.6, 93.9, 93.3, 0],
      kpis: [TK('T-FNC-01', L('Akurasi invoice', 'Invoice accuracy'), 'higher', 99, '%', 25, 99.1), TK('T-FNC-02', L('Billing tepat waktu', 'Billing on time'), 'higher', 98, '%', 25, 98.6), TK('T-FNC-03', L('Collection rate', 'Collection rate'), 'higher', 95, '%', 30, 91.4, 'FIN-04'), TK('T-FNC-04', L('Rekonsiliasi D+3', 'Reconciliation by D+3'), 'binary', 1, L('ya/tidak', 'yes/no'), 20, 1)] },
    { k: 'sls', n: L('Sales', 'Sales'), plant: 'PL-01', lead: 'EMP-040', reviewer: 'EMP-050', members: ['EMP-040', 'EMP-080'], trend: [81.4, 82.8, 84.2, 85.6, 84.7, 0],
      kpis: [TK('T-SLS-01', L('Klien korporat baru', 'New corporate clients'), 'higher', 3, L('klien', 'clients'), 35, 2, 'CLI-05', { floor: null }), TK('T-SLS-02', L('Tingkat perpanjangan', 'Renewal rate'), 'higher', 95, '%', 25, 96, 'CLI-02'), TK('T-SLS-03', L('Nilai pipeline', 'Pipeline value'), 'higher', 400 * JT, 'Rp', 20, 380 * JT, null, { floor: null }), TK('T-SLS-04', L('Kunjungan klien', 'Client visits'), 'higher', 24, L('kunjungan', 'visits'), 20, 22, null, { floor: null })] },
    { k: 'cs', n: L('Customer Service', 'Customer Service'), plant: 'PL-01', lead: 'EMP-081', reviewer: 'EMP-010', members: ['EMP-081'], trend: [88.1, 88.8, 89.4, 90.2, 89.5, 0],
      kpis: [TK('T-CS-01', L('Respons pertama', 'First response'), 'lower', 15, L('menit', 'min'), 30, 14), TK('T-CS-02', L('Komplain selesai ≤ 48 jam', 'Complaints closed ≤ 48 h'), 'higher', 90, '%', 30, 86, 'CLI-03'), TK('T-CS-03', L('CSAT', 'CSAT'), 'higher', 4.6, L('skor', 'score'), 25, 4.55, 'CLI-04'), TK('T-CS-04', L('Kepatuhan follow-up', 'Follow-up compliance'), 'higher', 95, '%', 15, 93)] }
  ];

  /* ---------- Role KPI sets (§42) and personal formula (§41) ---------- */
  D.ROLE_KPIS = {
    rcv: { n: L('Receiving Operator', 'Receiving Operator'), kpis: [['RK-RCV-01', L('Akurasi receiving', 'Receiving accuracy'), 'higher', 99.5, '%', 30], ['RK-RCV-02', L('Produktivitas', 'Productivity'), 'higher', 180, 'kg/jam', 25], ['RK-RCV-03', L('Ketepatan waktu', 'Timeliness'), 'higher', 97, '%', 20], ['RK-RCV-04', L('Error rate', 'Error rate'), 'lower', 0.5, '%', 15], ['RK-RCV-05', L('Disiplin (kehadiran)', 'Discipline (attendance)'), 'higher', 97, '%', 10]] },
    qc: { n: L('QC Inspector', 'QC Inspector'), kpis: [['RK-QC-01', L('Akurasi QC', 'QC accuracy'), 'higher', 99, '%', 30], ['RK-QC-02', L('Rewash rate', 'Rewash rate'), 'lower', 2.0, '%', 20], ['RK-QC-03', L('Deteksi masalah', 'Issue detection'), 'higher', 95, '%', 20], ['RK-QC-04', L('Waktu QC', 'Turnaround'), 'lower', 20, L('menit', 'min'), 15], ['RK-QC-05', L('Kelengkapan bukti', 'Evidence completeness'), 'higher', 98, '%', 15]] },
    drv: { n: L('Driver', 'Driver'), kpis: [['RK-DRV-01', L('Pengiriman tepat waktu', 'On-time delivery'), 'higher', 96, '%', 30], ['RK-DRV-02', L('Kepatuhan rute', 'Route compliance'), 'higher', 95, '%', 20], ['RK-DRV-03', L('Akurasi POD', 'POD accuracy'), 'higher', 99, '%', 20], ['RK-DRV-04', L('Masalah klien', 'Client issues'), 'lower', 1, L('kasus', 'cases'), 15, null], ['RK-DRV-05', L('Efisiensi rute', 'Route efficiency'), 'lower', 6, 'km/stop', 15]] },
    fin: { n: L('Finance', 'Finance'), kpis: [['RK-FIN-01', L('Akurasi invoice', 'Invoice accuracy'), 'higher', 99, '%', 25], ['RK-FIN-02', L('Billing tepat waktu', 'Billing timeliness'), 'higher', 98, '%', 25], ['RK-FIN-03', L('Collection', 'Collection'), 'higher', 95, '%', 25], ['RK-FIN-04', L('AR > 60 hari', 'AR > 60 days'), 'lower', 5, '%', 15, 50], ['RK-FIN-05', L('Rekonsiliasi D+3', 'Reconciliation by D+3'), 'binary', 1, L('ya/tidak', 'yes/no'), 10]] },
    spv: { n: L('Supervisor', 'Supervisor'), kpis: [['RK-SPV-01', L('SLA tim', 'Team SLA'), 'higher', 95, '%', 25], ['RK-SPV-02', L('Produktivitas tim', 'Team productivity'), 'higher', 42, 'kg/jam', 20], ['RK-SPV-03', L('Penyelesaian masalah ≤ 48 jam', 'Issue resolution ≤ 48 h'), 'higher', 90, '%', 20], ['RK-SPV-04', L('Rewash', 'Rewash'), 'lower', 2.0, '%', 20], ['RK-SPV-05', L('Pengembangan tim (sesi coaching)', 'People development (coaching sessions)'), 'higher', 4, L('sesi', 'sessions'), 15, null]] },
    sales: { n: L('Sales / Account', 'Sales / Account'), kpis: [['RK-SLS-01', L('Klien baru', 'New clients'), 'higher', 3, L('klien', 'clients'), 35, null], ['RK-SLS-02', L('Perpanjangan kontrak', 'Contract renewals'), 'higher', 95, '%', 25], ['RK-SLS-03', L('Nilai pipeline', 'Pipeline value'), 'higher', 400 * JT, 'Rp', 20, null], ['RK-SLS-04', L('Kunjungan klien', 'Client visits'), 'higher', 24, L('kunjungan', 'visits'), 20, null]] },
    prod: { n: L('Operator Produksi', 'Production Operator'), kpis: [['RK-PRD-01', L('Output vs target', 'Output vs target'), 'higher', 100, '%', 30], ['RK-PRD-02', L('Kualitas lulus', 'Quality pass'), 'higher', 98, '%', 25], ['RK-PRD-03', L('Ketepatan waktu', 'Timeliness'), 'higher', 97, '%', 20], ['RK-PRD-04', L('Kepatuhan K3 & 5S', 'Safety & 5S compliance'), 'higher', 95, '%', 15], ['RK-PRD-05', L('Disiplin (kehadiran)', 'Discipline (attendance)'), 'higher', 97, '%', 10]] }
  };
  D.PERSONAL_FORMULA = { def: { ind: 70, team: 30 }, drv: { ind: 80, team: 20 }, spv: { ind: 60, team: 40 }, sales: { ind: 75, team: 25 } };

  /* ---------- KPI master (§24): company scorecards (XScore dimensions, Financial Health) ----------
     k(code, scorecard, category, name, dir, target, unit, weight, priority, aggregation, source, actual, history Apr–Sep, extra) */
  function k(code, sc, cat, n, dir, target, unit, weight, pri, agg, src, actual, hist, o) {
    return Object.assign({ code: code, sc: sc, cat: cat, n: n, dir: dir, target: target, unit: unit, weight: weight, pri: pri, agg: agg, src: src, actual: actual, hist: hist }, o || {});
  }
  var MONTHS6 = ['2026-04', '2026-05', '2026-06', '2026-07', '2026-08', '2026-09'];
  D.HIST_MONTHS = MONTHS6;
  D.KPIS = [
    // XScore · Financial
    k('FIN-01', 'XS-FIN', 'financial', L('Revenue', 'Revenue'), 'higher', 1650 * JT, 'Rp', 30, 'critical', 'sum', 'billing', 1610 * JT, [1460, 1490, 1520, 1550, 1550, 1610].map(function (x) { return x * JT; }), { owner: 'EMP-030', goal: 'BG-H2-01', teams: ['sls', 'fnc', 'ops'], stretch: 1750 * JT, cap: 110, formula: L('Jumlah invoice valid periode berjalan', 'Sum of valid invoices in the period') }),
    k('FIN-02', 'XS-FIN', 'financial', L('Gross margin', 'Gross margin'), 'higher', 58, '%', 20, 'high', 'ratio', 'finance', 58.8, [57.9, 58.2, 58.6, 58.1, 59.3, 58.8], { owner: 'EMP-030', goal: 'BG-H2-01', teams: ['wsh', 'fin', 'ops'], formula: L('Gross profit ÷ revenue', 'Gross profit ÷ revenue') }),
    k('FIN-03', 'XS-FIN', 'financial', L('Net margin', 'Net margin'), 'higher', 20, '%', 20, 'high', 'ratio', 'finance', 19.3, [18.2, 18.6, 19.0, 18.4, 20.1, 19.3], { owner: 'EMP-030', goal: 'BG-H2-01', teams: ['fnc', 'ops'], formula: L('Net profit ÷ revenue', 'Net profit ÷ revenue') }),
    k('FIN-04', 'XS-FIN', 'financial', L('Collection rate', 'Collection rate'), 'higher', 95, '%', 15, 'high', 'ratio', 'invoice', 91.4, [93, 94, 92, 92.5, 92, 91.4], { owner: 'EMP-030', goal: 'BG-H2-01', teams: ['fnc', 'sls'], formula: L('Pembayaran diterima ÷ tagihan jatuh tempo', 'Payments received ÷ invoices due') }),
    k('FIN-05', 'XS-FIN', 'financial', L('Biaya per kg', 'Cost per kg'), 'lower', 32500, 'Rp/kg', 15, 'medium', 'ratio', 'finance', 33132, [33900, 33600, 33400, 33300, 33000, 33132], { owner: 'EMP-010', goal: 'ST-2610-03', teams: ['wsh', 'fin', 'pck'], formula: L('(COGS + opex) ÷ kg diproses', '(COGS + opex) ÷ kg processed') }),
    // XScore · Operations
    k('OPS-01', 'XS-OPS', 'operations', L('SLA tepat waktu', 'On-time SLA'), 'higher', 96, '%', 30, 'critical', 'ratio', 'delivery', 95.1, [94.2, 94.8, 95.5, 95.9, 95.6, 95.1], { owner: 'EMP-010', goal: 'BG-H2-02', teams: ['dlv', 'pck', 'ops'], formula: L('Pengiriman tepat waktu ÷ total pengiriman', 'On-time deliveries ÷ all deliveries') }),
    k('OPS-02', 'XS-OPS', 'operations', L('Produktivitas', 'Productivity'), 'higher', 42, 'kg/jam', 25, 'high', 'ratio', 'production', 41.2, [38.5, 39.2, 40.1, 40.8, 41.5, 41.2], { owner: 'EMP-010', goal: 'QG-Q4-02', teams: ['ops', 'rcv', 'dry', 'fin'], formula: L('Total output kg ÷ total jam kerja', 'Total output kg ÷ total labour hours') }),
    k('OPS-03', 'XS-OPS', 'operations', L('Utilisasi kapasitas', 'Capacity utilisation'), 'range', 82.5, '%', 15, 'medium', 'avg', 'production', 87, [80, 82, 84, 86, 88, 87], { owner: 'EMP-010', goal: 'QG-Q4-02', teams: ['wsh'], lo: 75, hi: 90, formula: L('Kg diproses ÷ kapasitas terpasang', 'Kg processed ÷ installed capacity') }),
    k('OPS-04', 'XS-OPS', 'operations', L('Turnaround time', 'Turnaround time'), 'lower', 24, L('jam', 'h'), 20, 'high', 'avg', 'production', 25.1, [26.5, 26, 25.4, 24.8, 24.6, 25.1], { owner: 'EMP-010', goal: 'QG-Q4-02', teams: ['rcv', 'qc', 'ops'], formula: L('Rata-rata jam dari terima sampai siap kirim', 'Average hours from receiving to ready to ship') }),
    k('OPS-05', 'XS-OPS', 'operations', L('Uptime mesin', 'Machine uptime'), 'higher', 98, '%', 10, 'medium', 'ratio', 'maintenance', 97.1, [97.8, 98.2, 98.1, 97.9, 97.6, 97.1], { owner: 'EMP-010', goal: 'ST-2610-02', teams: ['dry', 'wsh'], formula: L('Jam mesin jalan ÷ jam terjadwal', 'Machine run hours ÷ scheduled hours') }),
    // XScore · Client
    k('CLI-01', 'XS-CLI', 'client', L('Pertumbuhan revenue klien (YoY)', 'Client revenue growth (YoY)'), 'higher', 12, '%', 25, 'high', 'formula', 'billing', 14.2, [9.5, 10.8, 11.6, 12.4, 13.1, 14.2], { owner: 'EMP-040', goal: 'OG-2026', teams: ['sls'], formula: L('Revenue bulan ini ÷ bulan sama tahun lalu − 1', 'This month revenue ÷ same month last year − 1') }),
    k('CLI-02', 'XS-CLI', 'client', L('Retensi klien', 'Client retention'), 'higher', 95, '%', 25, 'critical', 'latest', 'crm', 96, [95, 95, 96, 96, 96, 96], { owner: 'EMP-040', goal: 'OG-2026', teams: ['sls', 'cs'], formula: L('Klien aktif yang bertahan ÷ klien awal periode', 'Active clients retained ÷ clients at period start') }),
    k('CLI-03', 'XS-CLI', 'client', L('Komplain per 1.000 order', 'Complaints per 1,000 orders'), 'lower', 3.0, L('kasus', 'cases'), 20, 'high', 'ratio', 'crm', 3.6, [4.1, 3.8, 3.5, 3.2, 3.3, 3.6], { floor: 50, owner: 'EMP-081', goal: 'BG-H2-02', teams: ['cs', 'dlv'], formula: L('Komplain ÷ order × 1.000', 'Complaints ÷ orders × 1,000') }),
    k('CLI-04', 'XS-CLI', 'client', L('Kepuasan klien (CSAT)', 'Client satisfaction (CSAT)'), 'higher', 4.6, L('skor', 'score'), 20, 'high', 'avg', 'survey', 4.55, [4.5, 4.55, 4.6, 4.62, 4.6, 4.55], { owner: 'EMP-081', goal: 'OG-2026', teams: ['cs'], formula: L('Rata-rata survei 1–5', 'Average survey score 1–5') }),
    k('CLI-05', 'XS-CLI', 'client', L('Klien korporat baru', 'New corporate clients'), 'higher', 3, L('klien', 'clients'), 10, 'medium', 'sum', 'crm', 2, [1, 2, 1, 3, 2, 2], { floor: null, owner: 'EMP-040', goal: 'ST-2610-01', teams: ['sls'], formula: L('Kontrak baru yang aktif', 'New contracts that went live') }),
    // XScore · Quality
    k('QLT-01', 'XS-QLT', 'quality', L('QC lulus pertama', 'QC first pass'), 'higher', 97.5, '%', 30, 'critical', 'ratio', 'qc', 97.8, [97.1, 97.3, 97.6, 97.9, 97.7, 97.8], { owner: 'EMP-070', goal: 'BG-H2-02', teams: ['qc', 'fin'], formula: L('Lot lulus QC pertama ÷ lot diperiksa', 'Lots passing first QC ÷ lots inspected') }),
    k('QLT-02', 'XS-QLT', 'quality', L('Rewash rate', 'Rewash rate'), 'lower', 2.0, '%', 25, 'high', 'ratio', 'qc', 2.1, [2.4, 2.3, 2.0, 1.9, 1.8, 2.1], { owner: 'EMP-070', goal: 'BG-H2-02', teams: ['qc', 'wsh', 'ops'], formula: L('Pcs rewash ÷ pcs diproses', 'Rewashed pcs ÷ processed pcs') }),
    k('QLT-03', 'XS-QLT', 'quality', L('Klaim', 'Claims'), 'lower', 2, L('klaim', 'claims'), 15, 'medium', 'sum', 'qc', 3, [4, 3, 2, 2, 1, 3], { floor: null, owner: 'EMP-070', goal: 'BG-H2-02', teams: ['qc'], formula: L('Jumlah klaim disetujui', 'Approved claims count') }),
    k('QLT-04', 'XS-QLT', 'quality', L('Tingkat kerusakan', 'Damage rate'), 'lower', 0.10, '%', 15, 'medium', 'ratio', 'qc', 0.08, [0.14, 0.12, 0.11, 0.09, 0.09, 0.08], { owner: 'EMP-070', teams: ['qc', 'fin'], formula: L('Pcs rusak ÷ pcs diproses', 'Damaged pcs ÷ processed pcs') }),
    k('QLT-05', 'XS-QLT', 'quality', L('Barang hilang = 0', 'Lost items = 0'), 'binary', 0, L('item', 'items'), 15, 'high', 'sum', 'qc', 0, [1, 0, 0, 1, 0, 0], { owner: 'EMP-070', teams: ['rcv', 'pck', 'dlv'], zero: true, formula: L('Lulus bila tidak ada barang hilang', 'Pass when no item is lost') }),
    // XScore · People
    k('PPL-01', 'XS-PPL', 'people', L('Kehadiran', 'Attendance'), 'higher', 97, '%', 25, 'high', 'ratio', 'hr', 96.2, [96.8, 97.1, 96.5, 96.9, 96.6, 96.2], { owner: 'EMP-010', teams: ['ops', 'wsh'], formula: L('Hari hadir ÷ hari kerja', 'Days present ÷ working days') }),
    k('PPL-02', 'XS-PPL', 'people', L('Rata-rata Teamwork Score', 'Average Teamwork Score'), 'formula', 85, L('skor', 'score'), 25, 'high', 'formula', 'system', 0, [82.0, 82.6, 83.1, 83.8, 84.0, 0], { owner: 'EMP-010', fn: 'teamAvg', formula: L('Rata-rata Teamwork Score semua tim (dihitung sistem)', 'Average Teamwork Score of all teams (system)') }),
    k('PPL-03', 'XS-PPL', 'people', L('Jam pelatihan per karyawan', 'Training hours per employee'), 'higher', 4, L('jam', 'h'), 20, 'medium', 'avg', 'hr', 3.2, [2.5, 3.0, 4.2, 3.1, 3.6, 3.2], { floor: null, owner: 'EMP-010', formula: L('Jam pelatihan ÷ karyawan', 'Training hours ÷ employees') }),
    k('PPL-04', 'XS-PPL', 'people', L('Turnover', 'Turnover'), 'lower', 2.0, '%', 15, 'medium', 'ratio', 'hr', 1.4, [2.2, 1.8, 1.6, 2.4, 1.2, 1.4], { owner: 'EMP-010', formula: L('Karyawan keluar ÷ rata-rata karyawan', 'Leavers ÷ average headcount') }),
    k('PPL-05', 'XS-PPL', 'people', L('Rata-rata Personal Score', 'Average Personal Score'), 'formula', 85, L('skor', 'score'), 15, 'supporting', 'formula', 'system', 0, [81.0, 81.6, 82.2, 82.9, 83.3, 0], { owner: 'EMP-010', fn: 'personAvg', formula: L('Rata-rata Personal Score karyawan aktif (dihitung sistem)', 'Average Personal Score of active employees (system)') }),
    // XScore · Innovation & Future (exploration)
    k('INV-01', 'XS-INV', 'innovation', L('Proyek perbaikan selesai', 'Improvement projects completed'), 'higher', 4, L('proyek', 'projects'), 30, 'high', 'sum', 'manual', 3, [1, 2, 2, 3, 4, 3], { floor: null, owner: 'EMP-010', goal: 'RM-2028', manual: { by: 'EMP-010', reason: L('Rekap proyek dari rapat improvement 30 Sep', 'Project recap from the 30 Sep improvement meeting'), ev: 'IMP-2609.pdf' }, formula: L('Proyek dengan bukti hasil', 'Projects with evidence of results') }),
    k('INV-02', 'XS-INV', 'innovation', L('Cakupan otomasi', 'Automation coverage'), 'higher', 35, '%', 25, 'medium', 'latest', 'system', 31, [22, 24, 26, 28, 30, 31], { floor: 50, owner: 'EMP-010', goal: 'RM-2028', formula: L('Proses dengan data otomatis ÷ total proses', 'Processes with automatic data ÷ all processes') }),
    k('INV-03', 'XS-INV', 'sustainability', L('Pemakaian air per kg', 'Water use per kg'), 'lower', 8.0, 'L/kg', 25, 'medium', 'ratio', 'production', 8.4, [9.1, 8.9, 8.7, 8.6, 8.3, 8.4], { owner: 'EMP-071', goal: 'RM-2028', teams: ['wsh'], formula: L('Liter air ÷ kg diproses', 'Water litres ÷ kg processed') }),
    k('INV-04', 'XS-INV', 'innovation', L('Revenue layanan baru', 'New service revenue'), 'higher', 60 * JT, 'Rp', 20, 'medium', 'sum', 'billing', 48 * JT, [12, 18, 25, 31, 40, 48].map(function (x) { return x * JT; }), { floor: null, owner: 'EMP-040', goal: 'OG-2026', teams: ['sls'], formula: L('Revenue dari layanan yang diluncurkan < 12 bulan', 'Revenue from services launched in the last 12 months') }),
    // Financial Health scorecard (§18)
    k('FH-01', 'FH', 'financial', L('Pertumbuhan revenue (MoM)', 'Revenue growth (MoM)'), 'higher', 3.0, '%', 20, 'critical', 'formula', 'billing', 3.9, [2.1, 2.1, 2.0, 2.0, 0.0, 3.9], { owner: 'EMP-030', fn: 'revGrowth', formula: L('Revenue bulan ini ÷ bulan lalu − 1', 'This month revenue ÷ last month − 1') }),
    k('FH-02', 'FH', 'financial', L('Net margin', 'Net margin'), 'higher', 20, '%', 20, 'critical', 'ratio', 'finance', 19.3, [18.2, 18.6, 19.0, 18.4, 20.1, 19.3], { owner: 'EMP-030', fn: 'netMargin', formula: L('Net profit ÷ revenue', 'Net profit ÷ revenue') }),
    k('FH-03', 'FH', 'financial', L('Arus kas bersih', 'Net cash flow'), 'higher', 350 * JT, 'Rp', 20, 'high', 'sum', 'finance', 312 * JT, [280, 295, 260, 330, 342, 312].map(function (x) { return x * JT; }), { floor: 50, owner: 'EMP-030', formula: L('Kas masuk − kas keluar (bulan)', 'Cash in − cash out (month)') }),
    k('FH-04', 'FH', 'financial', L('Collection rate', 'Collection rate'), 'higher', 95, '%', 15, 'high', 'ratio', 'invoice', 91.4, [93, 94, 92, 92.5, 92, 91.4], { owner: 'EMP-030', formula: L('Pembayaran diterima ÷ tagihan jatuh tempo', 'Payments received ÷ invoices due') }),
    k('FH-05', 'FH', 'financial', L('Porsi AR > 60 hari', 'AR over 60 days share'), 'lower', 5, '%', 10, 'medium', 'formula', 'invoice', 0, [6.0, 5.4, 5.1, 6.2, 7.4, 0], { floor: 50, owner: 'EMP-030', fn: 'ar60', formula: L('AR > 60 hari ÷ total AR (dihitung dari invoice)', 'AR over 60 days ÷ total AR (from invoices)') }),
    k('FH-06', 'FH', 'financial', L('Kontrol biaya (varian)', 'Cost control (variance)'), 'lower', 3, '%', 10, 'medium', 'formula', 'finance', 0, [2.4, 2.9, 3.6, 2.2, 2.8, 0], { owner: 'EMP-030', fn: 'expVar', formula: L('(Aktual − budget) ÷ budget, total biaya', '(Actual − budget) ÷ budget, total cost') }),
    k('FH-07', 'FH', 'financial', L('Likuiditas (quick ratio)', 'Liquidity (quick ratio)'), 'higher', 1.5, 'x', 5, 'supporting', 'formula', 'finance', 0, [1.6, 1.7, 1.5, 1.8, 1.9, 0], { owner: 'EMP-030', fn: 'quick', formula: L('(Kas tersedia + AR lancar) ÷ kewajiban 30 hari', '(Available cash + current AR) ÷ 30-day obligations') })
  ];

  /* ---------- Scorecards ---------- */
  D.SCORECARDS = [
    { id: 'XS-FIN', n: L('XScore · Financial', 'XScore · Financial'), type: 'xscore', dim: 'fin', owner: 'EMP-030', period: 'monthly', status: 'active', v: 3 },
    { id: 'XS-OPS', n: L('XScore · Operations', 'XScore · Operations'), type: 'xscore', dim: 'ops', owner: 'EMP-010', period: 'monthly', status: 'active', v: 3 },
    { id: 'XS-CLI', n: L('XScore · Client', 'XScore · Client'), type: 'xscore', dim: 'cli', owner: 'EMP-040', period: 'monthly', status: 'active', v: 2 },
    { id: 'XS-QLT', n: L('XScore · Quality', 'XScore · Quality'), type: 'xscore', dim: 'qlt', owner: 'EMP-070', period: 'monthly', status: 'active', v: 2 },
    { id: 'XS-PPL', n: L('XScore · People', 'XScore · People'), type: 'xscore', dim: 'ppl', owner: 'EMP-010', period: 'monthly', status: 'active', v: 2 },
    { id: 'XS-INV', n: L('XScore · Innovation & Future', 'XScore · Innovation & Future'), type: 'xscore', dim: 'inv', owner: 'EMP-010', period: 'monthly', status: 'active', v: 1 },
    { id: 'FH', n: L('Financial Health Score', 'Financial Health Score'), type: 'financial', owner: 'EMP-030', period: 'monthly', status: 'active', v: 2 },
    { id: 'R2-UBD', n: L('R2RE · Tim Operasional Ubud', 'R2RE · Ubud Operations Team'), type: 'r2re', team: 'ops', owner: 'EMP-021', period: 'weekly', status: 'active', v: 4 }
  ];

  /* ---------- XScore dimensions & Ambidex groups (§31–§32) ---------- */
  D.XDIMS = [
    { k: 'fin', n: L('Financial', 'Financial'), sc: 'XS-FIN', w: 20, g: 'exploit', icon: 'coins', pillar: 'fin' },
    { k: 'ops', n: L('Operations', 'Operations'), sc: 'XS-OPS', w: 20, g: 'exploit', icon: 'washer', pillar: 'ops' },
    { k: 'cli', n: L('Client', 'Client'), sc: 'XS-CLI', w: 15, g: 'exploit', icon: 'hotel', pillar: 'cli' },
    { k: 'qlt', n: L('Quality', 'Quality'), sc: 'XS-QLT', w: 15, g: 'exploit', icon: 'shield', pillar: 'qlt' },
    { k: 'ppl', n: L('People', 'People'), sc: 'XS-PPL', w: 15, g: 'exploit', icon: 'users', pillar: 'ppl' },
    { k: 'inv', n: L('Innovation & Future', 'Innovation & Future'), sc: 'XS-INV', w: 15, g: 'explore', icon: 'bulb', pillar: 'fut' }
  ];
  D.AMBIDEX = { exploit: 80, explore: 20 };
  // XScore before the six-month KPI history (Oct 2025 – Mar 2026), for the 12M view.
  D.XSCORE_OLDER = [58.9, 61.2, 60.4, 62.8, 63.5, 61.0];

  /* ---------- R2RE weekly scorecard (§49–§51): Ubud operations team ----------
     w: weeks W36 (prior), W37, W38, W39, W40. Ratio KPIs store [numerator, denominator]. */
  D.R2_WEEKS = [{ k: 'W36', n: L('Minggu 36', 'Week 36'), d: L('31 Agu–6 Sep', '31 Aug–6 Sep') }, { k: 'W37', n: L('Minggu 1', 'Week 1'), d: L('7–13 Sep', '7–13 Sep') }, { k: 'W38', n: L('Minggu 2', 'Week 2'), d: L('14–20 Sep', '14–20 Sep') }, { k: 'W39', n: L('Minggu 3', 'Week 3'), d: L('21–27 Sep', '21–27 Sep') }, { k: 'W40', n: L('Minggu 4', 'Week 4'), d: L('28 Sep–4 Okt', '28 Sep–4 Oct') }];
  function r2(code, cat, n, dir, target, unit, weight, pri, agg, src, w, o) { return Object.assign({ code: code, sc: 'R2-UBD', cat: cat, n: n, dir: dir, target: target, unit: unit, weight: weight, pri: pri, agg: agg, src: src, w: w, period: 'weekly', freq: 'weekly' }, o || {}); }
  D.R2 = [
    r2('R2-REV', 'financial', L('Revenue plant', 'Plant revenue'), 'higher', 245 * JT, 'Rp', 20, 'critical', 'sum', 'billing', [228, 236, 241, 252, 248].map(function (x) { return x * JT; }), { pic: 'EMP-021', parent: 'FIN-01', tw: 245 * JT }),
    r2('R2-GM', 'financial', L('Gross margin', 'Gross margin'), 'higher', 35, '%', 15, 'high', 'ratio', 'finance', [[81, 228], [82, 236], [85, 241], [86, 252], [80, 248]], { pic: 'EMP-030', parent: 'FIN-02' }),
    r2('R2-CSAT', 'client', L('Kepuasan klien (CSAT)', 'Client satisfaction (CSAT)'), 'higher', 4.6, L('skor', 'score'), 15, 'high', 'wavg', 'survey', [[4.6, 38], [4.7, 41], [4.6, 40], [4.5, 44], [4.4, 39]], { pic: 'EMP-081', parent: 'CLI-04' }),
    r2('R2-RPT', 'client', L('Repeat order rate', 'Repeat order rate'), 'higher', 40, '%', 10, 'medium', 'ratio', 'billing', [[150, 400], [156, 402], [160, 398], [158, 410], [149, 405]], { pic: 'EMP-040', parent: 'CLI-02' }),
    r2('R2-TAT', 'operations', L('Turnaround time', 'Turnaround time'), 'lower', 24, L('jam', 'h'), 10, 'high', 'wavg', 'production', [[25.0, 400], [24.5, 402], [23.8, 398], [25.6, 410], [26.4, 405]], { pic: 'EMP-010', parent: 'OPS-04' }),
    r2('R2-UPT', 'operations', L('Uptime mesin', 'Equipment uptime'), 'higher', 98, '%', 10, 'medium', 'ratio', 'maintenance', [[1960, 2000], [1972, 2000], [1950, 2000], [1910, 2000], [1938, 2000]], { pic: 'EMP-075', parent: 'OPS-05' }),
    r2('R2-SLA', 'operations', L('SLA tepat waktu', 'On-time SLA'), 'higher', 95, '%', 10, 'critical', 'ratio', 'delivery', [[380, 400], [386, 402], [378, 398], [382, 410], [384, 405]], { pic: 'EMP-002', parent: 'OPS-01' }),
    r2('R2-RWS', 'quality', L('Rewash rate', 'Rewash rate'), 'lower', 2.0, '%', 10, 'high', 'ratio', 'qc', [[210, 12000], [230, 12100], [260, 11950], [280, 12300], [250, 12150]], { pic: 'EMP-070', parent: 'QLT-02' })
  ];

  /* ---------- Finance (§7–§18) ---------- */
  D.FIN = {
    accounts: [
      { id: 'ACC-01', n: 'BCA Operasional', type: 'bank', use: 'ops', bal: 1240 * JT, cur: 'IDR', upd: '2026-10-06 08:05', mov: 36.5 * JT, restricted: false },
      { id: 'ACC-02', n: 'BCA Payroll', type: 'bank', use: 'payroll', bal: 420 * JT, cur: 'IDR', upd: '2026-10-06 08:05', mov: 0, restricted: true, why: L('Cadangan gaji Oktober', 'October payroll reserve') },
      { id: 'ACC-03', n: 'Mandiri', type: 'bank', use: 'ops', bal: 610 * JT, cur: 'IDR', upd: '2026-10-06 08:10', mov: -22.4 * JT, restricted: false },
      { id: 'ACC-04', n: 'BNI Deposito Jaminan', type: 'bank', use: 'guarantee', bal: 300 * JT, cur: 'IDR', upd: '2026-10-01 09:00', mov: 0, restricted: true, why: L('Jaminan bank kontrak hotel', 'Bank guarantee for hotel contracts') },
      { id: 'ACC-05', n: 'Kas Main Plant Ubud', type: 'cash', use: 'cash', bal: 18.5 * JT, cur: 'IDR', upd: '2026-10-06 07:30', mov: 1.2 * JT, restricted: false },
      { id: 'ACC-06', n: 'Kas Plant Gianyar', type: 'cash', use: 'cash', bal: 9.2 * JT, cur: 'IDR', upd: '2026-10-06 07:30', mov: -0.4 * JT, restricted: false },
      { id: 'ACC-07', n: 'Petty Cash', type: 'petty', use: 'petty', bal: 6 * JT, cur: 'IDR', upd: '2026-10-05 17:00', mov: -0.8 * JT, restricted: false }
    ],
    // Cash flow by period: in / out categories (Rp)
    flow: {
      today: { inn: { client: 48.6, deposit: 0, other: 0.4 }, out: { payroll: 0, chemical: 6.2, utility: 0, fuel: 1.1, maintenance: 2.4, supplier: 18.0, rental: 0, tax: 0, capex: 0, opex: 3.2 } },
      d7: { inn: { client: 362.0, deposit: 15.0, other: 2.1 }, out: { payroll: 0, chemical: 24.5, utility: 12.0, fuel: 7.8, maintenance: 9.6, supplier: 41.0, rental: 0, tax: 0, capex: 0, opex: 22.4 } },
      mtd: { inn: { client: 298.4, deposit: 15.0, other: 1.6 }, out: { payroll: 0, chemical: 21.0, utility: 9.5, fuel: 6.4, maintenance: 8.1, supplier: 36.0, rental: 0, tax: 0, capex: 0, opex: 18.7 } },
      m3: { inn: { client: 4520, deposit: 60, other: 22 }, out: { payroll: 1695, chemical: 268, utility: 351, fuel: 252, maintenance: 131, supplier: 410, rental: 360, tax: 232, capex: 180, opex: 405 } },
      ytd: { inn: { client: 13480, deposit: 210, other: 74 }, out: { payroll: 5021, chemical: 802, utility: 1046, fuel: 748, maintenance: 402, supplier: 1210, rental: 1080, tax: 690, capex: 640, opex: 1196 } }
    },
    flowUnit: JT,
    // Revenue health (§11)
    revenue: { today: 48.2 * JT, yesterday: 52.6 * JT, mtd: 298.4 * JT, mtdTarget: 330 * JT, ytd: 13870 * JT, ytdTarget: 14400 * JT, sep: 1610 * JT, aug: 1550 * JT, sepLy: 1410 * JT },
    revSeg: {
      plant: [['PL-01', 'Main Plant — Ubud', 998, 22600, 71800], ['PL-02', 'Plant 2 — Gianyar', 612, 13800, 46200]],
      client: [['CL-01', 'Grand Vista Hotel', 482, 10600, 33800], ['CL-02', 'The Santai Hotel', 268, 6100, 19900], ['CL-03', 'Kayana Resort', 301, 6900, 22100], ['CL-04', 'Oceanview Villa', 152, 3500, 11800], ['CL-05', 'Hotel ABC', 246, 5600, 18600], ['CL-06', 'Ubud Spa Retreat', 161, 3700, 13800]],
      property: [['P-01', 'Grand Vista · Tower A', 291, 6400, 20200], ['P-02', 'Grand Vista · Tower B', 191, 4200, 13600], ['P-03', 'The Santai · Main', 268, 6100, 19900], ['P-04', 'Kayana · Villas', 301, 6900, 22100], ['P-05', 'Oceanview · Villas', 152, 3500, 11800], ['P-06', 'Hotel ABC · City', 246, 5600, 18600], ['P-07', 'Ubud Spa · Retreat', 161, 3700, 13800]],
      service: [['SV-01', L('Linen kamar', 'Room linen'), 742, 19200, 52800], ['SV-02', L('Linen F&B', 'F&B linen'), 268, 6100, 24400], ['SV-03', L('Seragam', 'Uniforms'), 214, 4300, 15100], ['SV-04', L('Handuk spa & kolam', 'Spa & pool towels'), 238, 5200, 18900], ['SV-05', L('Guest laundry', 'Guest laundry'), 148, 1600, 6800]]
    },
    // P&L by month (Rp juta): revenue, cogs, opex, other (+income / −expense), tax
    plMonths: ['2025-09', '2026-04', '2026-05', '2026-06', '2026-07', '2026-08', '2026-09'],
    pl: {
      revenue: [1410, 1460, 1490, 1520, 1550, 1550, 1610],
      cogs: [600, 615, 624, 630, 651, 631, 664],
      opex: [500, 518, 524, 532, 545, 529, 542],
      other: [-8, -7, -7, -6, -6, -5, -6],
      tax: [66, 70, 73, 77, 77, 86, 88]
    },
    cogsLines: [[L('Bahan kimia', 'Chemicals'), 92], [L('Tenaga kerja langsung', 'Direct labour'), 412], [L('Listrik & air produksi', 'Production power & water'), 118], [L('Linen & consumable', 'Linen & consumables'), 24], [L('Kemasan', 'Packaging'), 18]],
    opexLines: [[L('Gaji staf kantor', 'Office payroll'), 168], [L('Sewa', 'Rent'), 120], [L('Logistik & BBM', 'Logistics & fuel'), 86], [L('Maintenance', 'Maintenance'), 44], [L('Marketing', 'Marketing'), 22], [L('Administrasi', 'Administration'), 38], [L('Depresiasi', 'Depreciation'), 64]],
    // Expense health (§14) — September budget vs actual (Rp juta)
    expenses: [['payroll', L('Gaji', 'Payroll'), 575, 580], ['chemical', L('Bahan kimia', 'Chemicals'), 84, 92], ['electricity', L('Listrik', 'Electricity'), 96, 101], ['water', L('Air', 'Water'), 18, 17], ['fuel', L('BBM', 'Fuel'), 58, 61], ['maintenance', L('Maintenance', 'Maintenance'), 40, 44], ['rent', L('Sewa', 'Rent'), 120, 120], ['logistics', L('Logistik', 'Logistics'), 26, 25], ['admin', L('Administrasi', 'Administration'), 36, 38], ['marketing', L('Marketing', 'Marketing'), 25, 22], ['other', L('Lain-lain', 'Other'), 104, 106]],
    expTrend: { payroll: [552, 560, 566, 571, 575, 580], chemical: [80, 81, 83, 85, 86, 92], electricity: [94, 95, 97, 99, 98, 101], water: [18, 18, 19, 18, 17, 17], fuel: [55, 57, 58, 60, 59, 61], maintenance: [36, 38, 40, 39, 41, 44], rent: [120, 120, 120, 120, 120, 120], logistics: [24, 24, 25, 26, 25, 25], admin: [35, 35, 36, 37, 36, 38], marketing: [18, 20, 22, 24, 23, 22], other: [102, 101, 103, 105, 98, 106] },
    // Unit economics (§15) — September; segment rows [id, name, revenue Rp juta, kg, pcs, cost Rp juta]
    ue: {
      kg: 36400, pcs: 118000,
      plant: [['PL-01', 'Main Plant — Ubud', 998, 22600, 71800, 735], ['PL-02', 'Plant 2 — Gianyar', 612, 13800, 46200, 471]],
      client: [['CL-01', 'Grand Vista Hotel', 482, 10600, 33800, 344], ['CL-02', 'The Santai Hotel', 268, 6100, 19900, 203], ['CL-03', 'Kayana Resort', 301, 6900, 22100, 232], ['CL-04', 'Oceanview Villa', 152, 3500, 11800, 121], ['CL-05', 'Hotel ABC', 246, 5600, 18600, 186], ['CL-06', 'Ubud Spa Retreat', 161, 3700, 13800, 120]],
      property: [['P-01', 'Grand Vista · Tower A', 291, 6400, 20200, 208], ['P-02', 'Grand Vista · Tower B', 191, 4200, 13600, 136], ['P-03', 'The Santai · Main', 268, 6100, 19900, 203], ['P-04', 'Kayana · Villas', 301, 6900, 22100, 232], ['P-05', 'Oceanview · Villas', 152, 3500, 11800, 121], ['P-06', 'Hotel ABC · City', 246, 5600, 18600, 186], ['P-07', 'Ubud Spa · Retreat', 161, 3700, 13800, 120]],
      service: [['SV-01', L('Linen kamar', 'Room linen'), 742, 19200, 52800, 548], ['SV-02', L('Linen F&B', 'F&B linen'), 268, 6100, 24400, 197], ['SV-03', L('Seragam', 'Uniforms'), 214, 4300, 15100, 158], ['SV-04', L('Handuk spa & kolam', 'Spa & pool towels'), 238, 5200, 18900, 186], ['SV-05', L('Guest laundry', 'Guest laundry'), 148, 1600, 6800, 117]]
    },
    // AR (§16): open invoices
    ar: [
      { inv: 'INV-2610-001', cl: 'CL-01', amt: 186 * JT, issued: '2026-10-01', due: '2026-10-20' },
      { inv: 'INV-2609-044', cl: 'CL-01', amt: 172 * JT, issued: '2026-09-05', due: '2026-10-05' },
      { inv: 'INV-2610-002', cl: 'CL-02', amt: 94 * JT, issued: '2026-10-01', due: '2026-10-25' },
      { inv: 'INV-2609-031', cl: 'CL-02', amt: 88 * JT, issued: '2026-08-26', due: '2026-09-25' },
      { inv: 'INV-2609-020', cl: 'CL-03', amt: 142 * JT, issued: '2026-08-19', due: '2026-09-18' },
      { inv: 'INV-2608-019', cl: 'CL-03', amt: 131 * JT, issued: '2026-07-29', due: '2026-08-28' },
      { inv: 'INV-2608-031', cl: 'CL-04', amt: 64 * JT, issued: '2026-07-16', due: '2026-08-15' },
      { inv: 'INV-2607-031', cl: 'CL-04', amt: 58 * JT, issued: '2026-06-20', due: '2026-07-20' },
      { inv: 'INV-2606-031', cl: 'CL-04', amt: 41 * JT, issued: '2026-05-26', due: '2026-06-25' },
      { inv: 'INV-2610-003', cl: 'CL-05', amt: 76 * JT, issued: '2026-10-01', due: '2026-10-15' },
      { inv: 'INV-2609-052', cl: 'CL-05', amt: 71 * JT, issued: '2026-09-08', due: '2026-10-08' },
      { inv: 'INV-2610-004', cl: 'CL-06', amt: 38 * JT, issued: '2026-10-01', due: '2026-10-28' },
      { inv: 'INV-2609-060', cl: 'CL-06', amt: 35 * JT, issued: '2026-08-31', due: '2026-09-30' }
    ],
    payments: [
      { cl: 'CL-01', inv: 'INV-2609-012', amt: 168 * JT, at: '2026-09-28', days: 2 }, { cl: 'CL-01', inv: 'INV-2608-044', amt: 165 * JT, at: '2026-09-04', days: 0 },
      { cl: 'CL-02', inv: 'INV-2608-033', amt: 86 * JT, at: '2026-09-22', days: 8 }, { cl: 'CL-03', inv: 'INV-2607-019', amt: 128 * JT, at: '2026-09-15', days: 18 },
      { cl: 'CL-04', inv: 'INV-2605-031', amt: 44 * JT, at: '2026-09-10', days: 74 }, { cl: 'CL-05', inv: 'INV-2608-052', amt: 69 * JT, at: '2026-09-07', days: -1 },
      { cl: 'CL-06', inv: 'INV-2608-060', amt: 34 * JT, at: '2026-09-29', days: 0 }
    ],
    billedSep: 1610 * JT, collectedSep: 1471 * JT, dueSep: 1609 * JT,
    // AP & obligations (§17)
    ap: [
      { id: 'AP-01', cat: 'supplier', n: L('Supplier linen (Bali Linen)', 'Linen supplier (Bali Linen)'), amt: 18 * JT, due: '2026-10-06' },
      { id: 'AP-02', cat: 'other', n: L('Maintenance dryer #2 (spare part)', 'Dryer #2 maintenance (spare part)'), amt: 21 * JT, due: '2026-10-08' },
      { id: 'AP-03', cat: 'other', n: L('BBM armada', 'Fleet fuel'), amt: 14 * JT, due: '2026-10-10' },
      { id: 'AP-04', cat: 'payroll', n: L('BPJS Ketenagakerjaan & Kesehatan', 'BPJS employment & health'), amt: 28 * JT, due: '2026-10-10' },
      { id: 'AP-05', cat: 'supplier', n: L('Bahan kimia (Ecolab)', 'Chemicals (Ecolab)'), amt: 62 * JT, due: '2026-10-12' },
      { id: 'AP-06', cat: 'tax', n: L('PPN & PPh September', 'September VAT & income tax'), amt: 74 * JT, due: '2026-10-15' },
      { id: 'AP-07', cat: 'utilities', n: L('Listrik PLN', 'PLN electricity'), amt: 48 * JT, due: '2026-10-20' },
      { id: 'AP-08', cat: 'utilities', n: L('Air PDAM', 'PDAM water'), amt: 9 * JT, due: '2026-10-20' },
      { id: 'AP-09', cat: 'payroll', n: L('Gaji Oktober', 'October payroll'), amt: 385 * JT, due: '2026-10-31' },
      { id: 'AP-10', cat: 'rent', n: L('Sewa plant Gianyar (Nov)', 'Gianyar plant rent (Nov)'), amt: 120 * JT, due: '2026-11-01' },
      { id: 'AP-11', cat: 'supplier', n: L('Kemasan & plastik', 'Packaging & plastic'), amt: 11 * JT, due: '2026-11-14' }
    ]
  };

  /* ---------- Goal cascade (§19–§22) ---------- */
  function G(id, lvl, parent, n, o) { return Object.assign({ id: id, lvl: lvl, parent: parent, n: n }, o); }
  D.GOALS = [
    G('RM-2028', 'roadmap', null, L('Roadmap 2026–2028: mitra laundry hospitality terpercaya di Bali', 'Roadmap 2026–2028: the trusted hospitality laundry partner in Bali'), { theme: 'growth', owner: 'EMP-050', start: '2026-01-01', end: '2028-12-31', target: L('Revenue Rp 30 M/tahun · 3 plant', 'Revenue Rp 30 B/year · 3 plants'), kpis: ['INV-01', 'INV-02', 'INV-03'], ms: [[L('Plant 2 Gianyar beroperasi', 'Plant 2 Gianyar live'), '2026-03-01', 1], [L('Sistem JFRESH OS penuh', 'Full JFRESH OS rollout'), '2026-12-31', 0], [L('Plant 3', 'Plant 3'), '2028-06-30', 0]], impact: L('Fondasi pertumbuhan 3 tahun', 'Three-year growth foundation'), v: 2 }),
    G('OG-2026', 'orbital', 'RM-2028', L('Menjadi pemimpin layanan laundry B2B yang paling dipercaya di Bali', 'Be the most trusted B2B laundry leader in Bali'), { theme: 'client', owner: 'EMP-050', start: '2026-01-01', end: '2026-12-31', target: L('Revenue Rp 19 M · 50 klien korporat · SLA ≥ 96%', 'Revenue Rp 19 B · 50 corporate clients · SLA ≥ 96%'), kpis: ['CLI-01', 'CLI-02', 'CLI-04', 'INV-04'], impact: L('Posisi pasar & loyalitas klien', 'Market position & client loyalty'), v: 1 }),
    G('BG-H2-01', 'business', 'OG-2026', L('Revenue Rp 9,6 M di H2 2026 dengan net margin ≥ 19%', 'Revenue Rp 9.6 B in H2 2026 with net margin ≥ 19%'), { theme: 'financial', owner: 'EMP-030', start: '2026-07-01', end: '2026-12-31', target: L('Rp 9,6 M · NM ≥ 19%', 'Rp 9.6 B · NM ≥ 19%'), kpis: ['FIN-01', 'FIN-03', 'FIN-04'], impact: L('Profitabilitas & kas', 'Profitability & cash'), v: 1 }),
    G('BG-H2-02', 'business', 'OG-2026', L('SLA ≥ 96% dan rewash ≤ 2% di semua plant', 'SLA ≥ 96% and rewash ≤ 2% across all plants'), { theme: 'operations', owner: 'EMP-010', start: '2026-07-01', end: '2026-12-31', target: L('SLA ≥ 96% · rewash ≤ 2%', 'SLA ≥ 96% · rewash ≤ 2%'), kpis: ['OPS-01', 'QLT-02', 'QLT-01'], impact: L('Kepuasan & retensi klien', 'Client satisfaction & retention'), v: 1 }),
    G('QG-Q4-01', 'quarterly', 'BG-H2-01', L('Q4: revenue Rp 5,0 M dan 5 klien korporat baru', 'Q4: revenue Rp 5.0 B and 5 new corporate clients'), { theme: 'financial', owner: 'EMP-040', start: '2026-10-01', end: '2026-12-31', target: L('Rp 5,0 M · 5 klien', 'Rp 5.0 B · 5 clients'), kpis: ['FIN-01', 'CLI-05'], impact: L('Kontribusi H2', 'H2 contribution'), v: 1 }),
    G('QG-Q4-02', 'quarterly', 'BG-H2-02', L('Q4: turnaround ≤ 24 jam dan produktivitas 42 kg/jam', 'Q4: turnaround ≤ 24 h and productivity 42 kg/h'), { theme: 'operations', owner: 'EMP-010', start: '2026-10-01', end: '2026-12-31', target: L('TAT ≤ 24 jam · 42 kg/jam', 'TAT ≤ 24 h · 42 kg/h'), kpis: ['OPS-04', 'OPS-02', 'OPS-03'], impact: L('Kapasitas musim liburan', 'Holiday season capacity'), v: 1 }),
    G('ST-2610-01', 'stracon', 'QG-Q4-01', L('STRACON Okt: akuisisi 2 klien korporat baru', 'October STRACON: sign 2 new corporate clients'), { theme: 'client', owner: 'EMP-040', start: '2026-10-01', end: '2026-10-31', target: L('2 kontrak baru', '2 new contracts'), kpis: ['CLI-05'], ms: [[L('Shortlist 8 prospek', 'Shortlist 8 prospects'), '2026-10-05', 1], [L('Proposal ke 4 hotel', 'Proposals to 4 hotels'), '2026-10-16', 0], [L('2 kontrak ditandatangani', '2 contracts signed'), '2026-10-30', 0]], impact: L('+ Rp 75 jt/bulan', '+ Rp 75 M/month'), v: 1 }),
    G('ST-2610-02', 'stracon', 'QG-Q4-02', L('STRACON Okt: stabilisasi mesin (uptime ≥ 98%)', 'October STRACON: stabilise machines (uptime ≥ 98%)'), { theme: 'operations', owner: 'EMP-010', start: '2026-10-01', end: '2026-10-31', target: L('Uptime ≥ 98%', 'Uptime ≥ 98%'), kpis: ['OPS-05'], ms: [[L('Audit semua mesin', 'Audit all machines'), '2026-10-03', 1], [L('Perbaikan dryer #2', 'Repair dryer #2'), '2026-10-08', 0], [L('PM bulanan berjalan', 'Monthly PM running'), '2026-10-31', 0]], impact: L('+10% kapasitas', '+10% capacity'), v: 1 }),
    G('ST-2610-03', 'stracon', 'QG-Q4-02', L('STRACON Okt: biaya per kg turun 2%', 'October STRACON: cost per kg down 2%'), { theme: 'financial', owner: 'EMP-030', start: '2026-10-01', end: '2026-10-31', target: L('≤ Rp 32.500/kg', '≤ Rp 32,500/kg'), kpis: ['FIN-05'], ms: [[L('Kalibrasi dosing semua mesin', 'Calibrate dosing on all machines'), '2026-10-09', 0], [L('Negosiasi harga kimia', 'Negotiate chemical prices'), '2026-10-20', 0]], impact: L('Margin +0,8 pt', 'Margin +0.8 pt'), v: 1 }),
    G('WR-41-01', 'weekly', 'ST-2610-02', L('Minggu 41: dryer #2 kembali beroperasi', 'Week 41: dryer #2 back in service'), { theme: 'operations', owner: 'EMP-075', start: '2026-10-05', end: '2026-10-11', target: L('Uptime ≥ 98%', 'Uptime ≥ 98%'), kpis: ['OPS-05'], v: 1 }),
    G('WR-41-02', 'weekly', 'ST-2610-01', L('Minggu 41: 3 meeting klien korporat', 'Week 41: 3 corporate client meetings'), { theme: 'client', owner: 'EMP-040', start: '2026-10-05', end: '2026-10-11', target: L('3 meeting', '3 meetings'), kpis: ['CLI-05'], v: 1 }),
    G('WR-41-03', 'weekly', 'ST-2610-03', L('Minggu 41: kalibrasi dosis kimia', 'Week 41: chemical dosing calibration'), { theme: 'financial', owner: 'EMP-071', start: '2026-10-05', end: '2026-10-11', target: L('4 mesin terkalibrasi', '4 machines calibrated'), kpis: ['FIN-05', 'QLT-02'], v: 1 }),
    G('DR-1006-01', 'daily', 'WR-41-01', L('Hari ini: pasang spare part dryer #2', 'Today: fit dryer #2 spare part'), { theme: 'operations', owner: 'EMP-075', start: '2026-10-06', end: '2026-10-06', target: L('Dryer jalan', 'Dryer running'), kpis: ['OPS-05'], v: 1 }),
    G('DR-1006-02', 'daily', 'WR-41-02', L('Hari ini: follow-up 3 prospek korporat', 'Today: follow up 3 corporate prospects'), { theme: 'client', owner: 'EMP-040', start: '2026-10-06', end: '2026-10-06', target: L('3 follow-up', '3 follow-ups'), kpis: ['CLI-05'], v: 1 }),
    G('DR-1006-03', 'daily', 'WR-41-03', L('Hari ini: kalibrasi dosis mesin 3', 'Today: calibrate washer 3 dosing'), { theme: 'financial', owner: 'EMP-071', start: '2026-10-06', end: '2026-10-06', target: L('1 mesin', '1 machine'), kpis: ['FIN-05'], v: 1 }),
    G('ST-2610-99', 'stracon', 'QG-Q4-01', L('STRACON Okt: promo guest laundry (dibatalkan)', 'October STRACON: guest laundry promo (cancelled)'), { theme: 'client', owner: 'EMP-040', start: '2026-10-01', end: '2026-10-31', target: L('—', '—'), kpis: [], status: 'cancelled', note: L('Dibatalkan: fokus ke klien korporat.', 'Cancelled: focus on corporate clients.'), v: 1 })
  ];

  /* ---------- Daily Race (§46–§47) — Tuesday 6 Oct 2026 ----------
     ev.sys: automatic evidence from JFRESH OS (no upload needed); ev.files: manual uploads */
  D.DAILY = [
    { id: 'DR-01', goal: 'WR-41-01', n: L('Pasang spare part & tes dryer #2', 'Fit spare part & test dryer #2'), kpi: 'R2-UPT', target: 1, actual: 0, unit: L('mesin', 'machine'), pic: 'EMP-075', team: 'dry', deadline: '2026-10-06 15:00', prog: 30, blocker: L('Spare part bearing belum datang dari supplier', 'Bearing spare part not yet delivered'), ev: { sys: [['maintenance', 'MT-2610-07', 1, 'PRD-DSH-001']], files: 1 }, status: 'off', result: '', follow: L('Eskalasi ke supplier jam 11:00', 'Escalate to supplier at 11:00') },
    { id: 'DR-02', goal: 'WR-41-02', n: L('Follow-up 3 prospek hotel korporat', 'Follow up 3 corporate hotel prospects'), kpi: 'CLI-05', target: 3, actual: 2, unit: L('prospek', 'prospects'), pic: 'EMP-040', team: 'sls', deadline: '2026-10-06 17:00', prog: 67, blocker: L('Materi promosi korporat belum final', 'Corporate pitch deck not final'), ev: { sys: [['crm', L('Catatan CRM', 'CRM notes'), 2, 'COM-CLI-001']], files: 0 }, status: 'risk', result: '', follow: '' },
    { id: 'DR-03', goal: 'WR-41-03', n: L('Kalibrasi dosis kimia mesin cuci 3', 'Calibrate washer 3 chemical dosing'), kpi: 'FIN-05', target: 1, actual: 0, unit: L('mesin', 'machine'), pic: 'EMP-071', team: 'wsh', deadline: '2026-10-06 16:00', prog: 40, blocker: '', ev: { sys: [['production', L('Log dosing', 'Dosing log'), 6, 'PRD-DSH-001']], files: 0 }, status: 'on', result: '', follow: '' },
    { id: 'DR-04', goal: 'BG-H2-02', n: L('Briefing CS & quality check pagi', 'Morning CS briefing & quality check'), kpi: 'R2-CSAT', target: 1, actual: 1, unit: L('sesi', 'session'), pic: 'EMP-021', team: 'ops', deadline: '2026-10-06 08:30', prog: 100, blocker: '', ev: { sys: [], files: 2 }, status: 'done', result: L('12 orang hadir, 2 temuan packing', '12 attended, 2 packing findings'), follow: '' },
    { id: 'DR-05', goal: 'BG-H2-02', n: L('Selesaikan QC 3 batch rewash Kayana', 'Finish QC on 3 Kayana rewash batches'), kpi: 'R2-RWS', target: 3, actual: 2, unit: 'batch', pic: 'EMP-070', team: 'qc', deadline: '2026-10-06 14:00', prog: 67, blocker: '', ev: { sys: [['qc', L('Catatan QC', 'QC records'), 2, 'OPS-QC-002']], files: 0 }, status: 'on', result: '', follow: '' },
    { id: 'DR-06', goal: 'BG-H2-01', n: L('Tagih 2 invoice overdue Oceanview Villa', 'Collect 2 overdue Oceanview Villa invoices'), kpi: 'FIN-04', target: 2, actual: 1, unit: 'invoice', pic: 'EMP-030', team: 'fnc', deadline: '2026-10-06 16:00', prog: 50, blocker: L('PIC klien cuti sampai Rabu', 'Client contact on leave until Wednesday'), ev: { sys: [['invoice', 'INV-2606-031', 1, 'FIN-AR-001']], files: 0 }, status: 'risk', result: '', follow: L('Kirim surat penagihan resmi', 'Send formal reminder letter') },
    { id: 'DR-07', goal: 'BG-H2-02', n: L('Pengiriman rute Ubud pagi tepat waktu', 'On-time Ubud morning route deliveries'), kpi: 'R2-SLA', target: 8, actual: 8, unit: 'stop', pic: 'EMP-002', team: 'dlv', deadline: '2026-10-06 11:00', prog: 100, blocker: '', ev: { sys: [['delivery', 'POD', 8, 'OPS-DLV-002']], files: 0 }, status: 'done', result: L('8/8 tepat waktu', '8/8 on time'), follow: '' },
    { id: 'DR-08', goal: 'BG-H2-01', n: L('Terima & timbang cucian Grand Vista', 'Receive & weigh Grand Vista laundry'), kpi: 'R2-REV', target: 1200, actual: 960, unit: 'kg', pic: 'EMP-001', team: 'rcv', deadline: '2026-10-06 17:00', prog: 80, blocker: '', ev: { sys: [['receiving', L('Bag diterima', 'Bags received'), 14, 'OPS-RCV-002']], files: 0 }, status: 'on', result: '', follow: '' }
  ];
  /* ---------- Weekly Race (§48) — week 41 ---------- */
  D.WEEKLY = [
    { id: 'WK-01', goal: 'BG-H2-01', n: L('Revenue plant minggu 41', 'Plant revenue week 41'), kpi: 'R2-REV', target: 250 * JT, actual: 118 * JT, unit: 'Rp', pace: true, pic: 'EMP-021', issues: 0, ev: L('Billing otomatis', 'Automatic billing') },
    { id: 'WK-02', goal: 'BG-H2-02', n: L('SLA tepat waktu ≥ 95%', 'On-time SLA ≥ 95%'), kpi: 'R2-SLA', target: 95, actual: 94.1, unit: '%', pic: 'EMP-021', issues: 1, ev: L('Data pengiriman', 'Delivery data') },
    { id: 'WK-03', goal: 'WR-41-01', n: L('Uptime mesin ≥ 98%', 'Machine uptime ≥ 98%'), kpi: 'R2-UPT', target: 98, actual: 93.5, unit: '%', pic: 'EMP-075', issues: 1, ev: L('Log maintenance', 'Maintenance log') },
    { id: 'WK-04', goal: 'BG-H2-02', n: L('Rewash ≤ 2%', 'Rewash ≤ 2%'), kpi: 'R2-RWS', target: 2.0, actual: 1.9, unit: '%', dir: 'lower', pic: 'EMP-070', issues: 0, ev: L('Catatan QC', 'QC records') },
    { id: 'WK-05', goal: 'BG-H2-01', n: L('Tagih AR > 60 hari', 'Collect AR over 60 days'), kpi: 'FIN-04', target: 99 * JT, actual: 41 * JT, unit: 'Rp', pace: true, pic: 'EMP-030', issues: 1, ev: L('Pembayaran tercatat', 'Recorded payments') },
    { id: 'WK-06', goal: 'WR-41-02', n: L('3 meeting klien korporat', '3 corporate client meetings'), kpi: 'CLI-05', target: 3, actual: 1, unit: L('meeting', 'meetings'), pace: true, pic: 'EMP-040', issues: 0, ev: L('Kalender CRM', 'CRM calendar') }
  ];

  /* ---------- Issue register (§60–§61) — September ---------- */
  D.ISSUES = [
    { id: 'ISS-0907', n: L('Mesin cuci 3 sering berhenti', 'Washer 3 keeps stopping'), cat: 'operations', week: 'W37', kpi: 'R2-UPT', sev: 'high', rc: L('Bearing aus, preventive maintenance terlambat', 'Worn bearing, preventive maintenance overdue'), impact: L('Kapasitas turun ± 8%', 'Capacity down ± 8%'), owner: 'EMP-071', action: L('Ganti bearing + jadwal PM bulanan', 'Replace bearing + monthly PM schedule'), due: '2026-10-10', status: 'open', ev: 'MT-2609-03', hist: [['2026-09-08', L('Dicatat di R2RE minggu 1', 'Logged in week 1 R2RE')]] },
    { id: 'ISS-0915', n: L('Komplain keterlambatan Hotel ABC', 'Hotel ABC late delivery complaints'), cat: 'client', week: 'W38', kpi: 'R2-SLA', sev: 'medium', rc: L('Antrian packing sore menumpuk', 'Afternoon packing queue builds up'), impact: L('CSAT Hotel ABC turun ke 4,2', 'Hotel ABC CSAT down to 4.2'), owner: 'EMP-021', action: L('Tambah shift packing 16:00–20:00', 'Add a 16:00–20:00 packing shift'), due: '2026-10-12', status: 'progress', ev: 'CMP-0915', hist: [['2026-09-15', L('Dicatat di R2RE minggu 2', 'Logged in week 2 R2RE')], ['2026-09-26', L('Keputusan: tambah 1 staf peak hour', 'Decision: add 1 peak-hour staff')]] },
    { id: 'ISS-0921', n: L('Rewash naik di batch Kayana', 'Rewash up on Kayana batches'), cat: 'quality', week: 'W39', kpi: 'R2-RWS', sev: 'high', rc: L('Dosis kimia tidak konsisten di mesin 3', 'Inconsistent chemical dosing on washer 3'), impact: L('Biaya kimia +9%, gross margin −1,4 pt', 'Chemical cost +9%, gross margin −1.4 pt'), owner: 'EMP-070', action: L('Kalibrasi dosing + cek supplier', 'Calibrate dosing + check supplier'), due: '2026-10-08', status: 'open', ev: 'QC-0921', fin: L('Gross margin −1,4 pt (W37 34,7% → W40 32,3%)', 'Gross margin −1.4 pt (W37 34.7% → W40 32.3%)'), hist: [['2026-09-22', L('Dicatat di R2RE minggu 3', 'Logged in week 3 R2RE')]] },
    { id: 'ISS-0922', n: L('Absensi tinggi shift malam', 'High absence on the night shift'), cat: 'people', week: 'W39', kpi: 'PPL-01', sev: 'medium', rc: L('Jadwal rotasi tidak merata', 'Uneven rotation schedule'), impact: L('Produktivitas malam −6%', 'Night productivity −6%'), owner: 'EMP-010', action: L('Rotasi ulang + insentif kehadiran', 'Re-rotate + attendance incentive'), due: '2026-10-20', status: 'open', ev: 'HR-0922', hist: [['2026-09-23', L('Dicatat di R2RE minggu 3', 'Logged in week 3 R2RE')]] },
    { id: 'ISS-0929', n: L('Stok deterjen menipis', 'Detergent stock running low'), cat: 'operations', week: 'W40', kpi: 'R2-UPT', sev: 'low', rc: L('PO terlambat diajukan', 'PO raised late'), impact: L('Risiko berhenti produksi', 'Risk of production stop'), owner: 'EMP-021', action: L('Reorder point dinaikkan', 'Reorder point raised'), due: '2026-10-02', status: 'resolved', ev: 'PO-2609-77', hist: [['2026-09-29', L('Dicatat di R2RE minggu 4', 'Logged in week 4 R2RE')], ['2026-10-01', L('Selesai: stok masuk', 'Resolved: stock arrived')]] },
    { id: 'ISS-0930', n: L('Pembayaran Oceanview Villa tertunda', 'Oceanview Villa payments delayed'), cat: 'financial', week: 'W40', kpi: 'FIN-04', sev: 'high', rc: L('Sengketa invoice Juni belum selesai', 'June invoice dispute unresolved'), impact: L('AR > 60 hari Rp 99 jt', 'AR over 60 days Rp 99 M'), owner: 'EMP-030', action: L('Rapat rekonsiliasi + payment plan', 'Reconciliation meeting + payment plan'), due: '2026-10-15', status: 'open', ev: 'INV-2606-031', fin: L('Kas tertahan Rp 99 jt', 'Rp 99 M cash held up'), hist: [['2026-09-30', L('Dicatat di R2RE minggu 4', 'Logged in week 4 R2RE')]] }
  ];

  /* ---------- KPI insight notes (§62) — WHY / IMPACT / RECOMMENDATION by KPI ---------- */
  D.INSIGHT_NOTES = {
    'R2-REV': { why: L('2 klien baru (Kayana villas, Hotel ABC wing) mulai September', '2 new clients (Kayana villas, Hotel ABC wing) started in September'), impact: L('Revenue plant Rp 977 jt, 99,7% target', 'Plant revenue Rp 977 M, 99.7% of target'), rec: L('Jaga kapasitas: volume Oktober diprediksi +8%', 'Protect capacity: October volume forecast +8%') },
    'R2-GM': { why: L('Pemakaian kimia naik di mesin 3 dan lembur finishing', 'Higher chemical use on washer 3 and finishing overtime'), impact: L('Gross margin −1,4 pt, ± Rp 14 jt per bulan', 'Gross margin −1.4 pt, ± Rp 14 M a month'), rec: L('Review dosing + harga supplier kimia', 'Review dosing + chemical supplier price') },
    'R2-CSAT': { why: L('Keterlambatan Hotel ABC dan rewash Kayana', 'Hotel ABC delays and Kayana rewash'), impact: L('Risiko retensi 2 klien besar', 'Retention risk on 2 large clients'), rec: L('Kunjungan account manager + perbaikan SLA packing', 'Account manager visit + fix packing SLA') },
    'R2-RPT': { why: L('Repeat order turun setelah komplain minggu 3–4', 'Repeat orders fell after week 3–4 complaints'), impact: L('± 9 order per minggu', '± 9 orders a week'), rec: L('Follow-up klien yang komplain', 'Follow up complaining clients') },
    'R2-TAT': { why: L('Dryer #2 berhenti, antrian pindah ke dryer lain', 'Dryer #2 down, queue moved to other dryers'), impact: L('2,4 jam di atas target di minggu 4', '2.4 h over target in week 4'), rec: L('Selesaikan perbaikan dryer #2', 'Finish the dryer #2 repair') },
    'R2-UPT': { why: L('Bearing mesin cuci 3 dan dryer #2 aus', 'Worn bearings on washer 3 and dryer #2'), impact: L('Kapasitas turun ± 8%', 'Capacity down ± 8%'), rec: L('PM bulanan + stok spare part kritis', 'Monthly PM + critical spare stock') },
    'R2-SLA': { why: L('Antrian packing sore', 'Afternoon packing queue'), impact: L('SLA minggu 3 di bawah target', 'Week 3 SLA below target'), rec: L('Shift packing 16:00–20:00', '16:00–20:00 packing shift') },
    'R2-RWS': { why: L('Dosis kimia tidak konsisten', 'Inconsistent chemical dosing'), impact: L('Biaya kimia +9%', 'Chemical cost +9%'), rec: L('Kalibrasi dosing tiap minggu', 'Weekly dosing calibration') }
  };

  /* ---------- Strategy (§65–§66) ---------- */
  D.STRATEGY = [
    { id: 'STR-01', n: L('Akuisisi 5 klien korporat baru di Q4', 'Sign 5 new corporate clients in Q4'), goal: 'QG-Q4-01', kpi: 'CLI-05', owner: 'EMP-040', due: '2026-10-30', impact: L('+ Rp 75 jt/bulan', '+ Rp 75 M/month'), status: 'on' },
    { id: 'STR-02', n: L('Stabilisasi operasional mesin', 'Stabilise machine operations'), goal: 'ST-2610-02', kpi: 'OPS-05', owner: 'EMP-010', due: '2026-10-15', impact: L('+10% kapasitas', '+10% capacity'), status: 'progress' },
    { id: 'STR-03', n: L('Optimasi biaya kimia & supply', 'Optimise chemical & supply cost'), goal: 'ST-2610-03', kpi: 'FIN-05', owner: 'EMP-030', due: '2026-10-30', impact: L('−3% biaya per kg', '−3% cost per kg'), status: 'notstarted' },
    { id: 'STR-04', n: L('Program retensi klien', 'Client retention programme'), goal: 'OG-2026', kpi: 'CLI-04', owner: 'EMP-081', due: '2026-10-30', impact: L('CSAT ≥ 4,7', 'CSAT ≥ 4.7'), status: 'on' }
  ];
  D.OPPORTUNITY = L('Ekspansi layanan premium spa & kemitraan villa B2B (revenue layanan baru +60% sejak April)', 'Premium spa service expansion & B2B villa partnerships (new service revenue +60% since April)');

  /* ---------- Decision intelligence (§69–§75) ---------- */
  D.INSIGHTS = [
    { id: 'INS-01', type: 'descriptive', t: L('Revenue September naik 3,9% dibanding Agustus', 'September revenue up 3.9% on August'), what: L('Revenue Rp 1,61 M (+3,9% MoM, +14,2% YoY)', 'Revenue Rp 1.61 B (+3.9% MoM, +14.2% YoY)'), why: L('2 klien korporat baru dan volume Grand Vista naik', '2 new corporate clients and higher Grand Vista volume'), risk: L('Kapasitas plant Ubud 87%, mendekati batas 90%', 'Ubud plant at 87% capacity, close to the 90% limit'), rec: L('Pertahankan kualitas dan siapkan kapasitas musim liburan', 'Keep quality and prepare holiday-season capacity'), acts: [['assign', 'EMP-010'], ['open', 'FIN-001', 'revenue']], src: 'FIN-01', impact: 60 * JT, sev: 'info' },
    { id: 'INS-02', type: 'diagnostic', t: L('Net margin turun 0,8 pt dibanding Agustus', 'Net margin down 0.8 pt on August'), what: L('Net margin 19,3% (Agustus 20,1%)', 'Net margin 19.3% (August 20.1%)'), why: L('Biaya kimia +9% dan lembur finishing +30%', 'Chemical cost +9% and finishing overtime +30%'), risk: L('Profitabilitas Q4 bisa di bawah target 20%', 'Q4 profitability may fall below the 20% target'), rec: L('Review konsumsi kimia dan staffing finishing', 'Review chemical consumption and finishing staffing'), acts: [['assign', 'EMP-030', L('Review CFO', 'CFO review')], ['assign', 'EMP-010', L('Review Operasional', 'Operations review')], ['open', 'FIN-001', 'expense']], src: 'FIN-03', impact: 13 * JT, sev: 'high' },
    { id: 'INS-03', type: 'diagnostic', t: L('Komplain meningkat di Hotel ABC', 'Complaints rising at Hotel ABC'), what: L('12 komplain di September (+33%)', '12 complaints in September (+33%)'), why: L('Antrian packing sore membuat pengiriman telat', 'Afternoon packing queue delays deliveries'), risk: L('Kepuasan turun, potensi kehilangan klien (Rp 246 jt/bulan)', 'Satisfaction falling, client at risk (Rp 246 M/month)'), rec: L('Tambah shift packing di jam sibuk', 'Add a packing shift at peak hours'), acts: [['task', 'EMP-021'], ['open', 'KPI-DTL-001', 'CLI-03']], src: 'CLI-03', impact: 246 * JT, sev: 'high' },
    { id: 'INS-04', type: 'predictive', t: L('Volume Oktober diprediksi naik 8%', 'October volume forecast up 8%'), what: L('Forecast 39,3 ton (+8%) karena musim liburan', 'Forecast 39.3 tons (+8%) for the holiday season'), why: L('Okupansi hotel klien naik dan 2 kontrak baru', 'Client hotel occupancy up and 2 new contracts'), risk: L('Kapasitas tidak cukup bila dryer #2 belum pulih', 'Not enough capacity if dryer #2 is not fixed'), rec: L('Percepat perbaikan dryer #2 dan siapkan shift tambahan', 'Speed up the dryer #2 repair and plan an extra shift'), acts: [['task', 'EMP-075'], ['open', 'RACE-001']], src: 'OPS-03', impact: 18 * JT, sev: 'medium' },
    { id: 'INS-05', type: 'prescriptive', t: L('Fokus penagihan AR > 60 hari Oceanview Villa', 'Focus collection on Oceanview Villa AR over 60 days'), what: L('Rp 99 jt di umur 61–90 dan 90+ hari', 'Rp 99 M aged 61–90 and 90+ days'), why: L('Sengketa invoice Juni belum selesai', 'June invoice dispute unresolved'), risk: L('Kas tertahan dan risiko piutang macet', 'Cash held up and bad-debt risk'), rec: L('Rapat rekonsiliasi dan payment plan minggu ini', 'Reconciliation meeting and payment plan this week'), acts: [['assign', 'EMP-030'], ['open', 'FIN-001', 'ar']], src: 'FIN-04', impact: 99 * JT, sev: 'high' },
    { id: 'INS-06', type: 'predictive', t: L('Free cash turun menjelang akhir Oktober', 'Free cash falls towards end of October'), what: L('Gaji Rp 385 jt dan sewa Rp 120 jt jatuh tempo dalam 30 hari', 'Rp 385 M payroll and Rp 120 M rent due within 30 days'), why: L('Kewajiban besar terkumpul di akhir bulan', 'Large obligations bunch up at month end'), risk: L('Free cash di bawah buffer bila penagihan terlambat', 'Free cash below buffer if collection slips'), rec: L('Percepat penagihan invoice jatuh tempo minggu ini', 'Speed up collection of invoices due this week'), acts: [['review', 'EMP-030'], ['open', 'FIN-001', 'forecast']], src: 'FH-03', impact: 385 * JT, sev: 'medium' }
  ];
  D.DECISIONS = [
    { id: 'DEC-01', at: '2026-09-26', src: 'INS-03', d: L('Tambah 1 staf packing di jam sibuk', 'Add 1 packing staff at peak hours'), owner: 'EMP-010', due: '2026-10-03', exp: L('SLA > 95%', 'SLA > 95%'), fu: '2026-10-07', act: L('SLA minggu 40: 94,8%', 'Week 40 SLA: 94.8%'), status: 'on', note: '', ev: 'R2RE W40' },
    { id: 'DEC-02', at: '2026-09-29', src: 'INS-05', d: L('Hubungi 3 klien prioritas dengan AR > 30 hari', 'Call 3 priority clients with AR over 30 days'), owner: 'EMP-030', due: '2026-10-06', exp: L('Pembayaran 70%', '70% collected'), fu: '2026-10-08', act: '', status: 'progress', note: '', ev: '' },
    { id: 'DEC-03', at: '2026-09-30', src: 'INS-04', d: L('Siapkan kapasitas & stok untuk musim liburan', 'Prepare capacity & stock for the holiday season'), owner: 'EMP-010', due: '2026-10-10', exp: L('Kapasitas cukup', 'Enough capacity'), fu: '2026-10-09', act: '', status: 'on', note: '', ev: '' },
    { id: 'DEC-04', at: '2026-10-01', src: 'INS-01', d: L('Kunjungan account manager ke 5 klien strategis', 'Account manager visits to 5 strategic clients'), owner: 'EMP-040', due: '2026-10-15', exp: L('Repeat order +15%', 'Repeat orders +15%'), fu: '2026-10-16', act: '', status: 'notstarted', note: '', ev: '' }
  ];

  /* ---------- Attention engine (§6, §73) ----------
     sev: crit 3 · high 2 · medium 1 · fin: financial impact (Rp) · w: KPI weight · due · str: strategic importance 1–3 */
  D.ATTENTION = [
    { id: 'ATT-01', t: L('Dryer #2 berhenti, kapasitas plant Ubud turun', 'Dryer #2 down, Ubud plant capacity reduced'), pillar: 'ops', sev: 'crit', fin: 12 * JT, w: 10, due: '2026-10-06', str: 3, kpi: 'OPS-05', src: 'PRD-DSH-001', owner: 'EMP-075' },
    { id: 'ATT-02', t: L('AR Oceanview Villa > 60 hari Rp 99 jt', 'Oceanview Villa AR over 60 days Rp 99 M'), pillar: 'fin', sev: 'high', fin: 99 * JT, w: 15, due: '2026-10-15', str: 2, kpi: 'FIN-04', src: 'FIN-001', tab: 'ar', owner: 'EMP-030' },
    { id: 'ATT-03', t: L('Gross margin plant Ubud turun ke 32,3%', 'Ubud plant gross margin down to 32.3%'), pillar: 'fin', sev: 'high', fin: 25 * JT, w: 20, due: '2026-10-09', str: 3, kpi: 'FIN-02', src: 'RACE-003', owner: 'EMP-030' },
    { id: 'ATT-04', t: L('SLA Hotel ABC di bawah target, komplain naik', 'Hotel ABC SLA below target, complaints rising'), pillar: 'cli', sev: 'high', fin: 8 * JT, w: 30, due: '2026-10-07', str: 3, kpi: 'OPS-01', src: 'SLA-MON-001', owner: 'EMP-021' },
    { id: 'ATT-05', t: L('Kontrak Oceanview Villa berakhir 18 hari lagi', 'Oceanview Villa contract ends in 18 days'), pillar: 'cli', sev: 'medium', fin: 64 * JT, w: 25, due: '2026-10-24', str: 3, kpi: 'CLI-02', src: 'RPT-CLI-001', owner: 'EMP-040' },
    { id: 'ATT-06', t: L('Rewash naik di batch Kayana', 'Rewash up on Kayana batches'), pillar: 'qlt', sev: 'medium', fin: 4 * JT, w: 25, due: '2026-10-08', str: 2, kpi: 'QLT-02', src: 'QLT-DSH-001', owner: 'EMP-070' },
    { id: 'ATT-07', t: L('Gaji Oktober Rp 385 jt jatuh tempo 31 Okt', 'October payroll Rp 385 M due 31 Oct'), pillar: 'fin', sev: 'medium', fin: 385 * JT, w: 0, due: '2026-10-31', str: 2, kpi: 'FH-03', src: 'FIN-001', tab: 'ap', owner: 'EMP-030' },
    { id: 'ATT-08', t: L('Putu Eka dalam rencana perbaikan kinerja (PIP)', 'Putu Eka on a performance improvement plan (PIP)'), pillar: 'ppl', sev: 'medium', fin: 0, w: 0, due: '2026-10-13', str: 1, kpi: 'PPL-05', src: 'PERSON-001', rec: 'EMP-074', owner: 'EMP-010' },
    { id: 'ATT-09', t: L('Cakupan otomasi 31% di bawah target 35%', 'Automation coverage 31% below the 35% target'), pillar: 'fut', sev: 'low', fin: 0, w: 25, due: '2026-10-30', str: 2, kpi: 'INV-02', src: 'XSCORE-001', owner: 'EMP-010' }
  ];

  /* ---------- Report library (§76) ---------- */
  D.REPORTS = [
    { k: 'exec', n: L('Executive Report', 'Executive Report'), d: L('Ringkasan eksekutif & business health', 'Executive summary & business health'), icon: 'gauge', perm: 'rpt.exec' },
    { k: 'fin', n: L('Financial Report', 'Financial Report'), d: L('P&L, kas, AR, AP', 'P&L, cash, AR, AP'), icon: 'coins', perm: 'fin.health' },
    { k: 'ambidex', n: L('Ambidex Report', 'Ambidex Report'), d: L('XScore, eksploitasi & eksplorasi', 'XScore, exploitation & exploration'), icon: 'target', perm: 'rpt.ambidex' },
    { k: 'race', n: L('Race Report', 'Race Report'), d: L('Daily & Weekly Race', 'Daily & Weekly Race'), icon: 'flag', perm: 'race.view' },
    { k: 'r2re', n: L('R2RE Report', 'R2RE Report'), d: L('Review KPI mingguan', 'Weekly KPI review'), icon: 'clipboard', perm: 'race.lead' },
    { k: 'refl', n: L('Reflection Report', 'Reflection Report'), d: L('Monthly Reflection & strategi', 'Monthly Reflection & strategy'), icon: 'history', perm: 'refl.view' },
    { k: 'client', n: L('Client Report', 'Client Report'), d: L('Klien & segmentasi', 'Clients & segments'), icon: 'hotel', perm: 'rpt.exec' },
    { k: 'ops', n: L('Operations Report', 'Operations Report'), d: L('Volume, SLA, kapasitas', 'Volume, SLA, capacity'), icon: 'washer', perm: 'rpt.ops' },
    { k: 'hr', n: L('HR Performance Report', 'HR Performance Report'), d: L('Tim & produktivitas', 'Teams & productivity'), icon: 'users', perm: 'rpt.hr' }
  ];

  if (typeof module !== 'undefined' && module.exports) module.exports = D;
  else root.JFPERF_DATA = D;
})(typeof window !== 'undefined' ? window : this);
