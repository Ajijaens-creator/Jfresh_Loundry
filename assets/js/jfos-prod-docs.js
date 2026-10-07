/* ==========================================================================
   JFRESH OS — Phase 8 documentation data (Laundry Production · NP Version
   1.0). Used by phase8/*.html only; the app reads the engine (jfos-prod.js),
   never this file.
   ========================================================================== */
(function (root) {
  function L(a, b) { return [a, b === undefined ? a : b]; }
  var APP = '../app/login.html?next=';
  function go(role, id) { return APP + encodeURIComponent('#/' + role + '/' + id) + '#/'; }

  var VISUALS = [
    { k: 'NV-06', f: 'nv06-drying-process.jpg', t: L('Proses Drying', 'Drying Process') },
    { k: 'NV-07a', f: 'nv07-machine-equipment-management.jpg', t: L('Mesin & Peralatan', 'Machine & Equipment') },
    { k: 'NV-07b', f: 'nv07-inventory-stock-management.jpg', t: L('Inventaris & Stok (acuan Fase 10)', 'Inventory & Stock (Phase 10 reference)') },
    { k: 'NV-07c', f: 'nv07-inventory-asset-management.jpg', t: L('Inventaris & Aset (acuan Fase 10)', 'Inventory & Assets (Phase 10 reference)') },
    { k: 'NV-08', f: 'nv08-washing-process-management.jpg', t: L('Proses Washing', 'Washing Process') },
    { k: 'NV-09', f: 'nv09-packing-labeling-ready-to-deliver.jpg', t: L('Packing, Label & Siap Kirim', 'Packing, Labeling & Ready to Deliver') },
    { k: 'NV-11a', f: 'nv11-delivery-dispatch-management.jpg', t: L('Dispatch Delivery (lanjut di Fase 7)', 'Delivery Dispatch (continues in Phase 7)') },
    { k: 'NV-11b', f: 'nv11-delivery-handover-to-client.jpg', t: L('Serah Terima ke Klien (lanjut di Fase 7)', 'Handover to Client (continues in Phase 7)') },
    { k: 'NV-12', f: 'nv12-preventive-maintenance-machine-care.jpg', t: L('Preventive Maintenance & Perawatan Mesin', 'Preventive Maintenance & Machine Care') }
  ];

  var NP = [
    { k: 'NP-01', id: 'np01', ic: 'inbox', v: null, t: L('Receiving & Verifikasi', 'Receiving & Verification'), d: L('Cucian dari Logistics diterima resmi oleh Team 1. Selisih tidak pernah diterima diam-diam.', 'Laundry from Logistics is formally received by Team 1. A mismatch is never accepted silently.'),
      built: [L('Antrian receiving dari manifest Fase 7, antar klien, transfer dan walk-in', 'Receiving queue from Phase 7 manifests, client drops, transfers and walk-ins'), L('Cek klien, property, bag dan kondisi → SESUAI / ADA SELISIH → TERIMA CUCIAN', 'Check client, property, bags and condition → SESUAI / ADA SELISIH → TERIMA CUCIAN'), L('Handover Logistics → Team 1 tercatat: pengirim, penerima, waktu, bukti, selisih', 'Logistics → Team 1 handover recorded: sender, receiver, time, evidence, difference')],
      links: [[L('Antrian receiving', 'Receiving queue'), go('prod1', 'PROD-RCV-001')], [L('Detail receiving', 'Receiving detail'), go('prod1', 'PROD-RCV-002/RCV-2610-012')]] },
    { k: 'NP-02', id: 'np02', ic: 'scale', v: null, t: L('Timbang, Hitung & Selisih', 'Weighing, Counting & Discrepancy'), d: L('Berat aktual dicatat sekali dan dipakai di batch, kapasitas dan KPI.', 'The actual weight is entered once and reused by batches, capacity and KPI.'),
      built: [L('BACA TIMBANGAN otomatis; berat manual hanya dengan izin dan audit', 'Automatic READ SCALE; manual weight only with permission and audit'), L('Item picker − angka + untuk layanan per pcs', 'Item picker − number + for per-piece services'), L('Perbandingan estimasi pickup vs aktual dengan GAP terlihat; selisih besar wajib review supervisor', 'Pickup estimate vs actual comparison with a visible GAP; large differences require supervisor review')],
      links: [[L('Timbang & hitung', 'Weighing & counting'), go('prod1', 'PROD-WGT-001/RCV-2610-011')], [L('Selisih', 'Discrepancy'), go('prod1', 'PROD-DIS-001/RCV-2610-009')]] },
    { k: 'NP-03', id: 'np03', ic: 'layers', v: null, t: L('Sorting & Klasifikasi', 'Sorting & Classification'), d: L('Kartu kategori besar dengan saran dari aturan klien.', 'Large category cards pre-suggested from the client rule.'),
      built: [L('8 kategori + flag noda, rusak, kontaminasi, prioritas', '8 categories + stain, damage, contamination, priority flags'), L('Total harus cocok dengan berat bersih (toleransi)', 'The total must match the net weight (tolerance)'), L('SELESAI SORTIR membuat lot siap batch', 'SELESAI SORTIR creates lots ready for a batch')],
      links: [[L('Detail sorting', 'Sorting detail'), go('prod1', 'PROD-SORT-002/RCV-2610-010')]] },
    { k: 'NP-04', id: 'np04', ic: 'grid', v: null, t: L('Batch & Perencanaan Produksi', 'Batch Creation & Production Planning'), d: L('Rekomendasi batch dengan validasi kapasitas mesin sebelum dikirim ke Team 2.', 'Batch recommendations with machine capacity validation before going to Team 2.'),
      built: [L('Rekomendasi: berat, mesin, utilisasi, program, SLA, durasi', 'Recommendation: weight, machine, utilisation, program, SLA, duration'), L('Overload diblokir; override terkontrol butuh izin dan alasan', 'Overload blocked; controlled override needs permission and a reason'), L('KIRIM KE TEAM 2 — WASHING (Handover 2)', 'KIRIM KE TEAM 2 — WASHING (Handover 2)')],
      links: [[L('Batch builder', 'Batch builder'), go('prod1', 'PROD-BATCH-001')], [L('Handover 2', 'Handover 2'), go('prod2', 'PROD-HO-001')]] },
    { k: 'NP-05', id: 'np05', ic: 'droplet', v: 'NV-08', t: L('Proses Washing', 'Washing Process'), d: L('MULAI CUCI → waktu besar dan perkiraan selesai → SELESAI CUCI.', 'MULAI CUCI → large timer and expected finish → SELESAI CUCI.'),
      built: [L('Mesin tidak tersedia tidak bisa dipilih', 'Unavailable machines cannot be chosen'), L('ADA MASALAH terhubung ke batch, mesin, operator; masalah mesin kritis membuat work order', 'ADA MASALAH links batch, machine, operator; a critical machine issue creates a work order')],
      links: [[L('Detail washing', 'Washing detail'), go('prod2', 'PROD-WASH-002/B-2610-008')]] },
    { k: 'NP-06', id: 'np06', ic: 'wind', v: 'NV-06', t: L('Proses Drying', 'Drying Process'), d: L('Dryer, air dry, hang dry atau metode khusus, lalu KIRIM KE TEAM 3.', 'Dryer, air dry, hang dry or special method, then KIRIM KE TEAM 3.'),
      built: [L('Program, suhu, durasi, perkiraan selesai', 'Program, temperature, duration, expected finish'), L('Handover 3 ke Team 3 dengan TERIMA HANDOVER / ADA SELISIH', 'Handover 3 to Team 3 with TERIMA HANDOVER / ADA SELISIH')],
      links: [[L('Detail drying', 'Drying detail'), go('prod2', 'PROD-DRY-002/B-2610-006')], [L('Handover 3', 'Handover 3'), go('prod3', 'PROD-HO-002')]] },
    { k: 'NP-07', id: 'np07', ic: 'iron', v: null, t: L('Setrika / Finishing Akhir', 'Ironing / Final Finishing'), d: L('Metode, workstation, progres qty dengan stepper.', 'Method, workstation, quantity progress with a stepper.'),
      built: [L('MULAI FINISHING → progres → SELESAI FINISHING', 'MULAI FINISHING → progress → SELESAI FINISHING'), L('Masalah finishing: noda, kusut, rusak, salah hitung', 'Finishing issues: stain, wrinkle, damage, wrong count')],
      links: [[L('Detail finishing', 'Finishing detail'), go('prod3', 'PROD-FIN-002/B-2610-004')]] },
    { k: 'NP-08', id: 'np08', ic: 'search', v: null, t: L('QC & Rewash', 'Quality Control & Rewash'), d: L('Dua tombol besar LULUS / ADA MASALAH. Setiap rework kembali ke tahap penyebabnya.', 'Two large buttons LULUS / ADA MASALAH. Every rework returns to the stage that caused it.'),
      built: [L('Checklist QC opsional', 'Optional QC checklist'), L('Rewash → Washing, belum kering → Drying, finishing → Finishing, rusak → klaim', 'Rewash → Washing, not dry → Drying, finishing → Finishing, damage → claim'), L('Akar masalah tersimpan dan mengalir ke KPI', 'Root cause stored and fed into KPI')],
      links: [[L('Keputusan QC', 'QC decision'), go('prod3', 'PROD-QC-002/B-2610-003')], [L('Rewash', 'Rewash'), go('prod3', 'PROD-REWASH-001')]] },
    { k: 'NP-09', id: 'np09', ic: 'package', v: 'NV-09', t: L('Packing, Label & Siap Kirim', 'Packing, Labeling & Ready to Deliver'), d: L('Rekonsiliasi diterima → diproses → lulus QC → dikemas sebelum Siap Kirim.', 'Received → processed → QC passed → packed reconciliation before Ready to Deliver.'),
      built: [L('Label dengan logo J\'Fresh, paket ke-n, qty, berat, QR', 'Label with the J\'Fresh logo, package n, qty, weight, QR'), L('Selisih memblokir Siap Kirim kecuali supervisor menyetujui', 'A gap blocks Ready to Deliver unless the supervisor approves'), L('SERAHKAN KE LOGISTICS (Handover 4) melanjutkan delivery Fase 7', 'SERAHKAN KE LOGISTICS (Handover 4) resumes the Phase 7 delivery')],
      links: [[L('Detail packing', 'Packing detail'), go('prod3', 'PROD-PACK-002/B-2610-002')], [L('Siap kirim', 'Ready to deliver'), go('prod3', 'PROD-READY-001')]] },
    { k: 'NP-10', id: 'np10', ic: 'gauge', v: 'NV-07a', t: L('Command Center, Kapasitas, Mesin & KPI', 'Command Center, Capacity, Machine & KPI'), d: L('Satu layar live untuk supervisor: 8 tahap, kapasitas, mesin, bottleneck dan tindakan.', 'One live screen for supervisors: 8 stages, capacity, machines, bottlenecks and actions.'),
      built: [L('Live board, KPI utama, kesegaran data', 'Live board, top KPI, data freshness'), L('Deteksi bottleneck: antrian naik, utilisasi, downtime, staf, siklus lambat, SLA', 'Bottleneck detection: queue growth, utilisation, downtime, staff, slow cycle, SLA'), L('Tindakan supervisor teraudit: prioritas, tahan, lanjut, ganti mesin, tugaskan, pindah staf, maintenance, eskalasi', 'Audited supervisor actions: priority, hold, resume, change machine, assign, move staff, maintenance, escalate'), L('Telusur batch end-to-end dan 14 KPI ke Ambidex', 'End-to-end batch trace and 14 KPIs into the Ambidex')],
      links: [[L('Command Center', 'Command Center'), go('supervisor', 'PROD-CMD-001')], [L('KPI produksi', 'Production KPI'), go('supervisor', 'PROD-KPI-001')], [L('Telusur batch', 'Batch trace'), go('supervisor', 'PROD-TRACE-001/B-2610-002')]] },
    { k: 'NP-11', id: 'np11', ic: 'clipboard', v: null, t: L('Checklist Harian & Kontrol Shift', 'Daily Operational Checklist & Shift Control'), d: L('Pengganti checklist Excel bulanan: dibuat otomatis dari template versi.', 'Replaces the monthly Excel checklist: generated automatically from versioned templates.'),
      built: [L('Tab Opening, Team 1–3, Logistics, Closing dengan progres', 'Opening, Team 1–3, Logistics, Closing tabs with progress'), L('8 tipe input; nilai di luar batas wajib ADA MASALAH', '8 input types; out-of-range values must use ADA MASALAH'), L('Operator → team leader → supervisor APPROVE / RETURN ITEM', 'Operator → team leader → supervisor APPROVE / RETURN ITEM'), L('Editor template dengan versi dan tanggal berlaku; riwayat lama tidak berubah', 'Template editor with versions and effective dates; past records never change')],
      links: [[L('Checklist hari ini', 'Checklist today'), go('prod1', 'CHK-001')], [L('Approval', 'Approval'), go('supervisor', 'CHK-005')], [L('Editor template', 'Template editor'), go('supervisor', 'CHK-004/TPL-OPN')]] },
    { k: 'NP-12', id: 'np12', ic: 'wrench', v: 'NV-12', t: L('Preventive Maintenance & Perawatan Mesin', 'Preventive Maintenance & Machine Care'), d: L('Jadwal dari SOP mesin, pengingat, work order sampai siap pakai, downtime.', 'Schedules from the machine SOPs, reminders, work orders to ready for service, downtime.'),
      built: [L('Frekuensi harian sampai tahunan, jam operasi dan siklus', 'Daily to annual frequency, operating hours and cycles'), L('SOP washer, dryer, steam iron, boiler, filter, IPAL dengan catatan keselamatan', 'Washer, dryer, steam iron, boiler, filter, IPAL SOPs with a safety note'), L('Masalah → work order → perbaikan → tes → verifikasi → siap pakai', 'Issue → work order → repair → test → verification → ready for service'), L('Pengingat H-7, H-3, H-1, hari ini, terlambat', 'Reminders D-7, D-3, D-1, due today, overdue')],
      links: [[L('Dashboard maintenance', 'Maintenance dashboard'), go('maint', 'MNT-001')], [L('Checklist maintenance', 'Maintenance checklist'), go('maint', 'MNT-004')], [L('Work order', 'Work order'), go('maint', 'MNT-006/WO-2610-01')]] }
  ];

  var MODEL = {
    flow: ['Logistics', 'Handover 1', 'Receiving', 'Weigh / Count', 'Sorting', 'Batch', 'Handover 2', 'Washing', 'Drying', 'Handover 3', 'Finishing', 'QC', 'Rewash', 'Packing', 'Ready to Deliver', 'Handover 4', 'Logistics'],
    feel: [L('Sederhana untuk operator', 'Simple for the operator'), L('Jelas antar tim', 'Clear between teams'), L('Cepat saat handover', 'Fast in handover'), L('Ketat soal kualitas', 'Strict in quality'), L('Terlihat oleh supervisor', 'Visible to supervisors'), L('Terukur untuk manajemen', 'Measurable for management')],
    links: { 'Receiving': 'PROD-RCV-001', 'Weigh / Count': 'PROD-WGT-001', 'Sorting': 'PROD-SORT-001', 'Batch': 'PROD-BATCH-001', 'Handover 2': 'PROD-HO-001', 'Washing': 'PROD-WASH-001', 'Drying': 'PROD-DRY-001', 'Handover 3': 'PROD-HO-002', 'Finishing': 'PROD-FIN-001', 'QC': 'PROD-QC-001', 'Rewash': 'PROD-REWASH-001', 'Packing': 'PROD-PACK-001', 'Ready to Deliver': 'PROD-READY-001', 'Handover 4': 'PROD-HO-003' }
  };

  // §86 per screen: entry, primary action, validation, audit
  function sp(entry, act, val, aud) { return { entry: entry, act: act, val: val, aud: aud }; }
  var NONE = L('Tidak ada input', 'No input');
  var SPEC = {
    'HOM-T1-001': sp(L('Login Team 1 (layar awal)', 'Team 1 login (home)'), L('Langkah berikutnya', 'Next step'), NONE, '—'),
    'PROD-RCV-001': sp(L('Beranda › Receiving', 'Home › Receiving'), L('Buka receiving', 'Open receiving'), NONE, '—'),
    'PROD-RCV-002': sp(L('Antrian receiving', 'Receiving queue'), 'SESUAI · ADA SELISIH · TERIMA CUCIAN', L('Bag & kondisi wajib dicek; selisih tidak bisa diterima tanpa alasan', 'Bags & condition must be checked; a difference cannot be accepted without a reason'), 'RECEIVING.ACCEPTED · RECEIVING.DIFFERENCE'),
    'PROD-DIS-001': sp(L('Receiving › ADA SELISIH', 'Receiving › ADA SELISIH'), L('Simpan selisih', 'Save difference'), L('Alasan, catatan, foto (sesuai konfigurasi); selisih besar → review supervisor', 'Reason, notes, photo (as configured); large difference → supervisor review'), 'RECEIVING.DIFFERENCE · SUPERVISOR.OVERRIDE'),
    'PROD-WGT-001': sp(L('Receiving › LANJUT KE TIMBANG', 'Receiving › LANJUT KE TIMBANG'), L('BACA TIMBANGAN · Simpan', 'READ SCALE · Save'), L('Berat manual butuh izin prod.weight.override + alasan', 'Manual weight needs prod.weight.override + reason'), 'WEIGHT.CHANGED'),
    'PROD-SORT-001': sp(L('Menu Sorting', 'Sorting menu'), L('Buka sorting', 'Open sorting'), NONE, '—'),
    'PROD-SORT-002': sp(L('Antrian sorting', 'Sorting queue'), 'SELESAI SORTIR', L('Total kategori = berat bersih ± toleransi', 'Category total = net weight ± tolerance'), 'SORTING.COMPLETED'),
    'PROD-BATCH-001': sp(L('Menu Batch', 'Batch menu'), L('Terima rekomendasi / batch manual', 'Accept recommendation / manual batch'), L('Kapasitas, kompatibilitas, ketersediaan mesin, SLA', 'Capacity, compatibility, machine availability, SLA'), 'BATCH.CREATED · BATCH.CHANGED'),
    'PROD-HO-001': sp(L('Batch › Kirim', 'Batch › Send'), 'KIRIM KE TEAM 2 · TERIMA HANDOVER · ADA SELISIH', L('Selisih wajib alasan + catatan', 'A difference needs a reason + notes'), 'HANDOVER'),
    'HOM-T2-001': sp(L('Login Team 2 (layar awal)', 'Team 2 login (home)'), L('Langkah berikutnya', 'Next step'), NONE, '—'),
    'PROD-WASH-001': sp(L('Menu Washing', 'Washing menu'), L('Buka batch', 'Open batch'), NONE, '—'),
    'PROD-WASH-002': sp(L('Antrian washing', 'Washing queue'), 'MULAI CUCI · SELESAI CUCI', L('Mesin harus tersedia dan cukup kapasitas', 'Machine must be available with enough capacity'), 'WASH.STARTED · WASH.COMPLETED · MACHINE.ISSUE'),
    'PROD-DRY-001': sp(L('Menu Drying', 'Drying menu'), L('Buka batch', 'Open batch'), NONE, '—'),
    'PROD-DRY-002': sp(L('Antrian drying', 'Drying queue'), 'MULAI KERING · SELESAI KERING · KIRIM KE TEAM 3', L('Dryer tersedia untuk metode mesin', 'Dryer available for the machine method'), 'DRY.STARTED · DRY.COMPLETED'),
    'PROD-HO-002': sp(L('Drying › Kirim', 'Drying › Send'), 'KIRIM KE TEAM 3 · TERIMA HANDOVER · ADA SELISIH', L('Selisih wajib alasan + catatan', 'A difference needs a reason + notes'), 'HANDOVER'),
    'HOM-T3-001': sp(L('Login Team 3 (layar awal)', 'Team 3 login (home)'), L('Langkah berikutnya', 'Next step'), NONE, '—'),
    'PROD-FIN-001': sp(L('Menu Finishing', 'Finishing menu'), L('Buka batch', 'Open batch'), NONE, '—'),
    'PROD-FIN-002': sp(L('Antrian finishing', 'Finishing queue'), 'MULAI FINISHING · SELESAI FINISHING', L('Qty selesai ≤ qty batch', 'Done qty ≤ batch qty'), 'FINISH.STARTED · FINISH.COMPLETED'),
    'PROD-QC-001': sp(L('Menu QC', 'QC menu'), L('Buka batch', 'Open batch'), NONE, '—'),
    'PROD-QC-002': sp(L('Antrian QC', 'QC queue'), 'LULUS · ADA MASALAH', L('Gagal wajib alasan, qty, tindakan; bukti foto', 'Fail needs reason, qty, action; photo evidence'), 'QC.PASSED · QC.FAILED · REWASH'),
    'PROD-REWASH-001': sp(L('Menu Rewash', 'Rewash menu'), L('Keputusan supervisor', 'Supervisor decision'), L('Keputusan wajib catatan', 'A decision needs a note'), 'REWASH · SUPERVISOR.OVERRIDE'),
    'PROD-PACK-001': sp(L('Menu Packing', 'Packing menu'), L('Buka batch', 'Open batch'), NONE, '—'),
    'PROD-PACK-002': sp(L('Antrian packing', 'Packing queue'), 'PACKING SELESAI · SIAP DIKIRIM', L('Hanya lulus QC; rekonsiliasi harus sesuai atau disetujui supervisor', 'QC passed only; reconciliation must match or be supervisor-approved'), 'PACKING.COMPLETED · READY_TO_DELIVER'),
    'PROD-READY-001': sp(L('Menu Siap Kirim', 'Ready menu'), 'SERAHKAN KE LOGISTICS', NONE, 'HANDOVER'),
    'PROD-HO-003': sp(L('Siap kirim, driver › Ambil di Plant', 'Ready, driver › Plant Pickup'), 'TERIMA HANDOVER · ADA SELISIH', L('Selisih wajib alasan + catatan', 'A difference needs a reason + notes'), 'HANDOVER'),
    'PROD-ISSUE-002': sp(L('Menu Masalah (setiap tim)', 'Issues menu (each team)'), 'ADA MASALAH', L('Jenis, keparahan, tindakan wajib; Tinggi/Kritis/Lainnya butuh catatan', 'Type, severity, action required; High/Critical/Other need a note'), 'MACHINE.ISSUE · ISSUE'),
    'PROD-HIS-001': sp(L('Menu Riwayat', 'History menu'), '—', NONE, '—'),
    'PROD-CMD-001': sp(L('Menu Produksi › Command Center', 'Production menu › Command Center'), L('Tindakan supervisor', 'Supervisor actions'), L('Setiap tindakan wajib alasan', 'Every action needs a reason'), 'SPV.* · SUPERVISOR.OVERRIDE'),
    'PROD-CAP-001': sp(L('Command Center › Kapasitas', 'Command Center › Capacity'), L('Pindah staf', 'Move staff'), L('Alasan wajib', 'Reason required'), 'SPV.ASSIGN_STAFF'),
    'PROD-MACH-001': sp(L('Menu Mesin / Status Live', 'Machines / Live Status menu'), L('Buka mesin', 'Open machine'), NONE, '—'),
    'PROD-ISSUE-001': sp(L('Menu Produksi › Masalah Produksi', 'Production menu › Production Issues'), L('Tandai selesai / putuskan', 'Resolve / decide'), L('Penyelesaian wajib catatan', 'Resolution needs a note'), 'ISSUE.RESOLVED'),
    'PROD-TRACE-001': sp(L('Command Center, link batch di semua layar', 'Command Center, batch links on every screen'), L('Cari batch', 'Search batch'), NONE, '—'),
    'PROD-KPI-001': sp(L('Menu Produksi › KPI', 'Production menu › KPI'), '—', NONE, '—'),
    'CHK-001': sp(L('Beranda tim › Checklist shift', 'Team home › Shift checklist'), L('KIRIM CHECKLIST', 'SUBMIT CHECKLIST'), L('Item wajib harus selesai', 'Mandatory items must be done'), 'CHECKLIST.COMPLETED'),
    'CHK-002': sp(L('Checklist hari ini', 'Checklist today'), 'SELESAI · ADA MASALAH', L('Nilai sesuai tipe input; di luar batas → ADA MASALAH', 'Value per input type; out of range → ADA MASALAH'), 'CHECKLIST.ITEM · CHECKLIST.ISSUE'),
    'CHK-003': sp(L('Menu Checklist & Maintenance › Master', 'Checklist & Maintenance menu › Master'), L('Template baru', 'New template'), L('Nama dan jenis wajib', 'Name and type required'), 'CHECKLIST.TEMPLATE'),
    'CHK-004': sp(L('Master checklist', 'Checklist master'), L('Terbitkan versi', 'Publish version'), L('Tanggal berlaku setelah hari ini; versi terbit tidak bisa diubah', 'Effective date after today; published versions cannot change'), 'CHECKLIST.TEMPLATE'),
    'CHK-005': sp(L('Menu Approval Checklist', 'Checklist Approval menu'), 'APPROVE OPENING · RETURN ITEM', L('Return wajib alasan; approve setelah review team leader', 'Return needs a reason; approve after team leader review'), 'CHECKLIST.APPROVED · CHECKLIST.RETURN'),
    'MNT-001': sp(L('Login maintenance (layar awal)', 'Maintenance login (home)'), L('Masalah mesin', 'Machine issue'), NONE, '—'),
    'MNT-002': sp(L('Menu Kalender', 'Calendar menu'), L('Buka tugas', 'Open task'), NONE, '—'),
    'MNT-003': sp(L('Menu Mesin', 'Machines menu'), L('Ubah status, atur jadwal', 'Change status, adjust schedule'), L('Alasan wajib; tanggal tidak boleh lampau', 'Reason required; date cannot be in the past'), 'MACHINE.STATUS · MAINTENANCE.RESCHEDULE'),
    'MNT-004': sp(L('Dashboard, kalender, pengingat', 'Dashboard, calendar, reminders'), 'MULAI MAINTENANCE · SELESAI', L('Semua langkah SOP dicek; langkah bermasalah butuh catatan → work order', 'Every SOP step checked; failed steps need a note → work order'), 'MAINTENANCE.STARTED · MAINTENANCE.COMPLETED'),
    'MNT-005': sp(L('Menu Riwayat', 'History menu'), '—', NONE, '—'),
    'MNT-006': sp(L('Menu Work Order, ADA MASALAH mesin', 'Work Order menu, machine ADA MASALAH'), L('Tugaskan · perbaiki · tes · verifikasi', 'Assign · repair · test · verify'), L('Tidak bisa melompati tahap; verifikasi hanya supervisor', 'Steps cannot be skipped; verification by supervisor only'), 'WORKORDER.* · MAINTENANCE.VERIFIED')
  };

  var DEVICE = { t: ['HOM-T1-001', 'PROD-RCV-001', 'PROD-RCV-002', 'PROD-DIS-001', 'PROD-WGT-001', 'PROD-SORT-001', 'PROD-SORT-002', 'PROD-BATCH-001', 'PROD-HO-001', 'HOM-T2-001', 'PROD-WASH-001', 'PROD-WASH-002', 'PROD-DRY-001', 'PROD-DRY-002', 'PROD-HO-002', 'HOM-T3-001', 'PROD-FIN-001', 'PROD-FIN-002', 'PROD-QC-001', 'PROD-QC-002', 'PROD-REWASH-001', 'PROD-PACK-001', 'PROD-PACK-002', 'PROD-READY-001', 'PROD-HO-003', 'PROD-ISSUE-002', 'PROD-HIS-001', 'CHK-001', 'CHK-002', 'MNT-004'] };
  var DEV_TXT = {
    d: L('Utama di desktop: command center, kapasitas, KPI, master checklist, perencanaan maintenance. iPad 1–2 kolom; HP menampilkan ringkasan dan aksi cepat.', 'Desktop first: command center, capacity, KPI, checklist master, maintenance planning. iPad 1–2 columns; mobile shows summary and quick actions.'),
    t: L('Utama di iPad tim: satu layar satu tugas, kartu dan tombol besar di bawah, label Indonesia pendek. Desktop lebih lebar; HP satu kolom untuk masalah cepat dan tugas pribadi.', 'Team iPad first: one screen one job, large cards and bottom buttons, short Indonesian labels. Desktop wider; mobile single column for quick issues and personal tasks.')
  };
  function device(id) { return DEVICE.t.indexOf(id) >= 0 ? 't' : 'd'; }

  // §91: [item, done|backend, evidence]
  function d(t, ev) { return [t, 'done', ev]; }
  var DOD = [
    d(L('Workspace Team 1', 'Team 1 workspace'), 'tests.html#sec'), d(L('Workspace Team 2', 'Team 2 workspace'), 'tests.html#sec'), d(L('Workspace Team 3', 'Team 3 workspace'), 'tests.html#sec'),
    d(L('Receiving', 'Receiving'), 'tests.html#np01'), d(L('Handover manifest', 'Manifest handover'), 'tests.html#np01'), d(L('Timbang', 'Weighing'), 'tests.html#np02'), d(L('Hitung', 'Counting'), 'tests.html#np02'), d(L('Selisih', 'Discrepancy'), 'tests.html#np02'),
    d(L('Sorting', 'Sorting'), 'tests.html#np03'), d(L('Batch Builder', 'Batch Builder'), 'tests.html#np04'), d(L('Validasi kapasitas', 'Capacity validation'), 'tests.html#np04'), d(L('Handover Team 1 → Team 2', 'Team 1 → Team 2 handover'), 'tests.html#ho'),
    d(L('Washing', 'Washing'), 'tests.html#np05'), d(L('Masalah washing', 'Washing issues'), 'tests.html#np05'), d(L('Drying', 'Drying'), 'tests.html#np06'), d(L('Handover Team 2 → Team 3', 'Team 2 → Team 3 handover'), 'tests.html#ho'),
    d(L('Finishing', 'Finishing'), 'tests.html#np07'), d(L('QC Lulus / Ada Masalah', 'QC Pass / Issue'), 'tests.html#np08'), d(L('Loop rewash / proses ulang', 'Rewash / reprocess loop'), 'tests.html#np08'),
    d(L('Packing', 'Packing'), 'tests.html#np09'), d(L('Label', 'Labeling'), 'tests.html#np09'), d(L('Rekonsiliasi', 'Reconciliation'), 'tests.html#np09'), d(L('Siap Kirim', 'Ready to Deliver'), 'tests.html#np09'), d(L('Handover Team 3 → Logistics', 'Team 3 → Logistics handover'), 'tests.html#ho'),
    d(L('Telusur batch penuh', 'Full batch traceability'), 'tests.html#np10'), d(L('Production Command Center', 'Production Command Center'), 'tests.html#np10'), d(L('Status mesin live', 'Machine live status'), 'tests.html#np10'), d(L('Tampilan kapasitas', 'Capacity view'), 'tests.html#np10'),
    d(L('Deteksi bottleneck', 'Bottleneck detection'), 'tests.html#np10'), d(L('KPI produksi', 'Production KPI'), 'tests.html#np10'), d(L('Integrasi Ambidex', 'Ambidex integration'), 'tests.html#np10'),
    d(L('Engine checklist harian', 'Daily checklist engine'), 'tests.html#np11'), d(L('Checklist opening', 'Opening checklist'), 'tests.html#np11'), d(L('Checklist closing', 'Closing checklist'), 'tests.html#np11'), d(L('Tambah / ubah checklist', 'Add / edit checklist'), 'tests.html#np11'),
    d(L('Versi checklist', 'Checklist versioning'), 'tests.html#np11'), d(L('Bukti checklist', 'Checklist evidence'), 'tests.html#np11'), d(L('Eskalasi masalah checklist', 'Checklist issue escalation'), 'tests.html#np11'), d(L('Persetujuan supervisor', 'Supervisor approval'), 'tests.html#np11'),
    d(L('Dashboard maintenance', 'Maintenance dashboard'), 'tests.html#np12'), d(L('Penjadwalan maintenance', 'Maintenance scheduling'), 'tests.html#np12'), d(L('Checklist SOP washer', 'Washer SOP checklist'), 'tests.html#np12'), d(L('Checklist SOP dryer', 'Dryer SOP checklist'), 'tests.html#np12'), d(L('Checklist SOP steam iron', 'Steam iron SOP checklist'), 'tests.html#np12'),
    d(L('Masalah mesin → work order', 'Machine issue → work order'), 'tests.html#np12'), d(L('Perbaikan → tes → siap pakai', 'Repair → test → ready'), 'tests.html#np12'), d(L('Downtime', 'Downtime'), 'tests.html#np12'), d(L('Riwayat maintenance', 'Maintenance history'), 'tests.html#np12'), d(L('Pengingat', 'Reminders'), 'tests.html#np12'),
    d(L('Navigasi iPad per peran', 'Role-based iPad navigation'), 'tests.html#responsive'), d(L('Pengalaman supervisor di desktop', 'Desktop supervisor experience'), 'tests.html#responsive'), d(L('Bahasa Indonesia default', 'Bahasa Indonesia default'), 'index.html#rules'), d(L('Brand guideline terjaga', 'Brand guideline preserved'), 'index.html#rules'),
    [L('Integrasi timbangan digital, data, izin dan audit diulang di server', 'Digital scale integration, data, permissions and audit repeated on the server'), 'backend', 'index.html#backend']
  ];

  // §92
  var RULES = [L('Satu workspace per tim', 'One workspace per team'), L('Pengalaman operator sederhana', 'Simple operator experience'), L('Handover jelas', 'Clear handover'), L('Rekonsiliasi qty / berat jelas', 'Clear quantity/weight reconciliation'), L('Telusuri setiap batch', 'Trace every batch'), L('Hubungkan SLA ke produksi', 'Connect SLA to production'), L('Hubungkan mesin ke batch', 'Connect machine to batch'), L('Hubungkan operator ke proses', 'Connect operator to process'), L('Hubungkan kegagalan QC ke proses asal', 'Connect QC failure to root process'), L('Ubah data produksi jadi KPI otomatis', 'Convert production data into KPI automatically'), L('Checklist bisa diubah dan berversi', 'Checklist editable and versioned'), L('Maintenance berkala dan teraudit', 'Maintenance periodic and auditable'), L('Bahasa Indonesia sebagai default', 'Bahasa Indonesia as default'), L('Ikuti design system J\'Fresh', 'Follow the J\'Fresh design system')];
  var DONT = [L('Menampilkan semua modul produksi ke setiap operator', 'Show all production modules to every operator'), L('Menggabungkan Team 1, 2, 3 dalam satu workspace rumit', 'Combine Teams 1, 2, 3 into one complicated workspace'), L('Melewati handover resmi antar tim', 'Skip formal handover between teams'), L('Menerima selisih jumlah diam-diam', 'Silently accept quantity discrepancies'), L('Melebihi kapasitas mesin tanpa override terkontrol', 'Exceed machine capacity without controlled override'), L('Mengemas item yang gagal QC', 'Pack items that fail QC'), L('Kehilangan riwayat akar masalah rewash', 'Lose rewash root-cause history'), L('Siap Kirim dengan rekonsiliasi belum selesai', 'Mark Ready to Deliver with unresolved reconciliation'), L('Laporan KPI manual ganda', 'Duplicate manual KPI reporting'), L('Menimpa template checklist lama', 'Overwrite historical checklist templates'), L('Menimpa riwayat maintenance', 'Overwrite maintenance history'), L('Memakai UI maintenance sebagai pengganti prosedur keselamatan', 'Use the maintenance UI as a substitute for safety procedure'), L('Mencampur engine HPP / harga ke Fase 8', 'Mix the HPP/pricing engine into Phase 8'), L('Membuat ulang logo J\'Fresh', 'Recreate the J\'Fresh logo')];

  var RESPONSIVE = [
    ['1440', L('Desktop supervisor: sidebar bergrup Produksi dan Checklist & Maintenance, live board 8 tahap, kapasitas, kartu mesin, KPI 14 angka, kalender bulan.', 'Desktop supervisor: grouped Production and Checklist & Maintenance sidebar, 8-stage live board, capacity, machine cards, 14 KPIs, month calendar.')],
    ['900', L('iPad tim: rail ikon dengan 6–7 menu per tim, tombol 88 px, stepper − angka +, kartu kategori, dua tombol QC besar, timer mesin besar.', 'Team iPad: icon rail with 6–7 menus per team, 88 px buttons, − number + steppers, category cards, two large QC buttons, large machine timer.')],
    ['390', L('HP: satu kolom, tombol di bawah, untuk masalah cepat, pengingat maintenance dan tugas pribadi.', 'Mobile: single column, bottom buttons, for quick issues, maintenance reminders and personal tasks.')],
    ['A11Y', L('Target sentuh ≥ 48 px, fokus terlihat, status punya label teks, data live menunjukkan waktu update, banner "Tidak ada koneksi" menghentikan aksi saat offline.', 'Touch targets ≥ 48 px, visible focus, statuses carry text labels, live data shows its update time, a "No connection" banner pauses actions while offline.')],
    ['QA', L('Semua layar dibuka sebagai putu, arta, luh, oka, saras dan aji di 1440, 900 dan 390 px: 0 error, 0 overflow halaman. Alur klik (QC lulus → packing, item checklist, SOP maintenance selesai, work order, tahan batch, approve checklist, draft template, offline) lulus.', 'Every screen opened as putu, arta, luh, oka, saras and aji at 1440, 900 and 390 px: 0 errors, 0 page overflow. Click flows (QC pass → packing, checklist item, maintenance SOP complete, work order, hold batch, approve checklist, template draft, offline) passed.')]
  ];

  var API = { VISUALS: VISUALS, NP: NP, MODEL: MODEL, SPEC: SPEC, DEV_TXT: DEV_TXT, device: device, DOD: DOD, RULES: RULES, DONT: DONT, RESPONSIVE: RESPONSIVE, go: go };
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
  else root.JFPROD_DOCS = API;
})(typeof window !== 'undefined' ? window : this);
