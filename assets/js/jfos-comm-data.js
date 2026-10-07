/* ==========================================================================
   JFRESH OS — Phase 6 demo data (Client & Commercial · NP 1.0)
   Client groups, properties, contacts, service catalog, client service
   configuration, contracts with versions, rate cards with versions, SLA
   rules, live SLA clocks, documents, commercial timeline, renewals,
   approvals, complaints, opportunities and 13 months of billing per
   property. Reference date: Tuesday 6 October 2026 (same as Phase 5).

   AR is not stored here: it comes from the Phase 5 finance ledger
   (JFPERF_DATA.FIN.ar). AR_EXTRA holds the open invoices of the clients
   that Phase 5 does not know yet; install() adds them to that one ledger
   so Financial Health and Client 360 read the same numbers (§50).

   Demo values only. Labels are [Bahasa Indonesia, English] pairs.
   ========================================================================== */
(function (root) {
  function L(a, b) { return [a, b === undefined ? a : b]; }
  var JT = 1e6;
  var D = { today: '2026-10-06', month: '2026-10', closedMonth: '2026-09', simNow: '2026-10-06 12:35' };
  // 13 closed months: Sep 2025 … Sep 2026 (index 12 = Sep 2026, index 0 = same month last year).
  D.MONTHS = ['2025-09', '2025-10', '2025-11', '2025-12', '2026-01', '2026-02', '2026-03', '2026-04', '2026-05', '2026-06', '2026-07', '2026-08', '2026-09'];

  D.AMS = [
    { id: 'EMP-040', n: 'Ayu Lestari', title: L('Account Manager', 'Account Manager') },
    { id: 'EMP-041', n: 'Sari Dewi', title: L('Account Manager', 'Account Manager') },
    { id: 'EMP-050', n: 'Aji Jaens', title: L('Owner / CEO', 'Owner / CEO') }
  ];

  /* ---------- NP-01 Client master (§3) ---------- */
  function cl(id, n, legal, type, ind, tax, addr, city, status, start, am, terms, credit, taxable, notes, extra) {
    return Object.assign({ id: id, n: n, legal: legal, group: null, type: type, ind: ind, tax: tax, bill: addr, addr: addr, city: city, status: status, start: start, am: am, terms: terms, credit: credit * JT, cur: 'IDR', taxable: taxable, notes: notes || '' }, extra || {});
  }
  D.CLIENTS = [
    cl('CL-07', 'Jaens Spa Group', 'PT Jaens Spa Indonesia', 'spa', L('Wellness & spa', 'Wellness & spa'), '01.234.567.8-901.000', 'Jl. Raya Ubud No. 18, Ubud, Gianyar', 'Ubud', 'active', '2022-01-12', 'EMP-041', 30, 500, true, L('Grup 4 outlet spa. Tagihan dikonsolidasi ke kantor grup.', 'Group of 4 spa outlets. Billing consolidated to the group office.'), { group: true }),
    cl('CL-01', 'Grand Vista Hotel', 'PT Grand Vista Bali', 'hotel', L('Hotel', 'Hotel'), '02.345.678.9-902.000', 'Jl. Monkey Forest No. 77, Ubud', 'Ubud', 'active', '2021-03-01', 'EMP-040', 30, 600, true, ''),
    cl('CL-02', 'The Santai Hotel', 'PT Santai Resort Bali', 'hotel', L('Hotel', 'Hotel'), '03.456.789.0-903.000', 'Jl. Kayu Aya No. 9, Seminyak', 'Seminyak', 'active', '2022-06-15', 'EMP-040', 30, 300, true, ''),
    cl('CL-03', 'Kayana Resort', 'PT Kayana Bali Resort', 'resort', L('Resort', 'Resort'), '04.567.890.1-904.000', 'Jl. Petitenget No. 12, Seminyak', 'Seminyak', 'active', '2023-02-01', 'EMP-041', 30, 350, true, L('Menambah property Ubud Hideaway Juli 2026.', 'Added the Ubud Hideaway property in July 2026.'), { group: true }),
    cl('CL-04', 'Oceanview Villa', 'CV Oceanview Bali', 'villa', L('Villa', 'Villa'), '05.678.901.2-905.000', 'Jl. Labuan Sait No. 3, Uluwatu', 'Uluwatu', 'active', '2023-08-01', 'EMP-040', 30, 120, true, L('Piutang lewat batas kredit.', 'Receivables above the credit limit.')),
    cl('CL-05', 'Hotel ABC', 'PT ABC Hotel Denpasar', 'hotel', L('Hotel', 'Hotel'), '06.789.012.3-906.000', 'Jl. Teuku Umar No. 101, Denpasar', 'Denpasar', 'active', '2022-11-01', 'EMP-040', 14, 250, true, ''),
    cl('CL-06', 'Ubud Spa Retreat', 'PT Ubud Retreat Wellness', 'spa', L('Wellness & spa', 'Wellness & spa'), '07.890.123.4-907.000', 'Jl. Suweta No. 5, Ubud', 'Ubud', 'active', '2024-05-01', 'EMP-041', 30, 150, true, ''),
    cl('CL-08', 'Pondok Impian', 'Pondok Impian Ubud', 'villa', L('Villa', 'Villa'), '08.901.234.5-908.000', 'Jl. Bisma No. 21, Ubud', 'Ubud', 'active', '2024-03-01', 'EMP-041', 30, 80, true, ''),
    cl('CL-09', 'Villa Sari', 'CV Villa Sari Seminyak', 'villa', L('Villa', 'Villa'), '09.012.345.6-909.000', 'Jl. Drupadi No. 8, Seminyak', 'Seminyak', 'active', '2024-06-01', 'EMP-040', 14, 60, true, ''),
    cl('CL-10', 'Bali Nest', 'PT Bali Nest Villas', 'villa', L('Villa', 'Villa'), '10.123.456.7-910.000', 'Jl. Danau Tamblingan No. 40, Sanur', 'Sanur', 'onhold', '2023-01-01', 'EMP-040', 30, 90, true, L('Kontrak berakhir 30 Sep 2026, negosiasi berjalan.', 'Contract ended 30 Sep 2026, negotiation ongoing.')),
    cl('CL-11', 'Ratna Dewi', 'Ratna Dewi', 'personal', L('Pelanggan pribadi', 'Personal customer'), '', 'Jl. Sriwedari No. 2, Ubud', 'Ubud', 'active', '2025-02-10', 'EMP-040', 0, 0, false, L('Bayar tunai saat pengiriman.', 'Pays cash on delivery.')),
    cl('CL-12', 'Warung Segar Sanur', 'CV Segar Sanur', 'fnb', L('Restoran / F&B', 'Restaurant / F&B'), '', 'Jl. Danau Poso No. 15, Sanur', 'Sanur', 'prospect', '2026-09-20', 'EMP-041', 14, 30, true, L('Prospek dari referensi Jaens Spa.', 'Prospect referred by Jaens Spa.'))
  ];

  /* ---------- Property master (§4) ---------- */
  function pr(id, n, cl, type, addr, city, op, bill, pick, cmp, ps, ds, billing, status, start, instr) {
    return { id: id, n: n, cl: cl, type: type, addr: addr, city: city, op: op, bill: bill, pick: pick, cmp: cmp, pickup: ps, delivery: ds, billing: billing, status: status, start: start, instr: instr || '', notes: '' };
  }
  var DAILY = L('Setiap hari 07:00', 'Daily 07:00'), MONSAT = L('Senin–Sabtu 08:00', 'Mon–Sat 08:00'), DAILY_PM = L('Setiap hari 16:00', 'Daily 16:00');
  D.PROPERTIES = [
    pr('PR-07A', 'Jaens Spa Center', 'CL-07', 'spa', 'Jl. Raya Ubud No. 18', 'Ubud', 'CT-074', 'CT-078', 'CT-074', 'CT-074', DAILY, DAILY_PM, 'group', 'active', '2022-01-12', L('Pisahkan handuk spa dan linen bed. Lipat handuk 3 bagian.', 'Separate spa towels and bed linen. Fold towels in thirds.')),
    pr('PR-07B', 'Jaens Spa Shanti', 'CL-07', 'spa', 'Jl. Kayu Jati No. 4', 'Seminyak', 'CT-075', 'CT-078', 'CT-075', 'CT-075', DAILY, DAILY_PM, 'group', 'active', '2022-08-01', L('Pickup lewat pintu servis belakang.', 'Pick up via the rear service door.')),
    pr('PR-07C', 'Jaens Spa Triloka', 'CL-07', 'spa', 'Jl. Danau Tamblingan No. 88', 'Sanur', 'CT-076', 'CT-072', 'CT-076', 'CT-076', L('Senin–Sabtu 07:30', 'Mon–Sat 07:30'), L('Senin–Sabtu 16:30', 'Mon–Sat 16:30'), 'group', 'active', '2023-04-01', ''),
    pr('PR-07D', 'Jaens Spa Bisma', 'CL-07', 'spa', 'Jl. Bisma No. 33', 'Kuta', 'CT-077', 'CT-072', 'CT-077', 'CT-077', DAILY, DAILY_PM, 'group', 'active', '2024-02-15', L('Layanan express untuk handuk kolam pada akhir pekan.', 'Express service for pool towels at weekends.')),
    pr('PR-01A', 'Grand Vista · Tower A', 'CL-01', 'hotel', 'Jl. Monkey Forest No. 77', 'Ubud', 'CT-011', 'CT-013', 'CT-011', 'CT-011', DAILY, DAILY_PM, 'client', 'active', '2021-03-01', L('Linen kamar dihitung per pcs saat pickup bersama housekeeping.', 'Room linen counted per piece at pickup with housekeeping.')),
    pr('PR-01B', 'Grand Vista · Tower B', 'CL-01', 'hotel', 'Jl. Monkey Forest No. 77', 'Ubud', 'CT-011', 'CT-013', 'CT-014', 'CT-011', DAILY, DAILY_PM, 'client', 'active', '2022-09-01', ''),
    pr('PR-02A', 'The Santai · Main', 'CL-02', 'hotel', 'Jl. Kayu Aya No. 9', 'Seminyak', 'CT-022', 'CT-021', 'CT-022', 'CT-022', DAILY, DAILY_PM, 'client', 'active', '2022-06-15', ''),
    pr('PR-03A', 'Kayana · Villas', 'CL-03', 'resort', 'Jl. Petitenget No. 12', 'Seminyak', 'CT-033', 'CT-032', 'CT-033', 'CT-033', DAILY, DAILY_PM, 'client', 'active', '2023-02-01', ''),
    pr('PR-03B', 'Kayana · Ubud Hideaway', 'CL-03', 'resort', 'Jl. Raya Sayan No. 7', 'Ubud', 'CT-034', 'CT-032', 'CT-034', 'CT-034', MONSAT, L('Senin–Sabtu 17:00', 'Mon–Sat 17:00'), 'client', 'active', '2026-07-01', L('Akses jalan sempit, gunakan motor box.', 'Narrow road access, use the box motorbike.')),
    pr('PR-04A', 'Oceanview · Villas', 'CL-04', 'villa', 'Jl. Labuan Sait No. 3', 'Uluwatu', 'CT-042', 'CT-041', 'CT-042', 'CT-042', MONSAT, L('Senin–Sabtu 17:00', 'Mon–Sat 17:00'), 'client', 'active', '2023-08-01', ''),
    pr('PR-05A', 'Hotel ABC · City', 'CL-05', 'hotel', 'Jl. Teuku Umar No. 101', 'Denpasar', 'CT-051', 'CT-053', 'CT-051', 'CT-051', DAILY, DAILY_PM, 'client', 'active', '2022-11-01', ''),
    pr('PR-06A', 'Ubud Spa Retreat', 'CL-06', 'spa', 'Jl. Suweta No. 5', 'Ubud', 'CT-062', 'CT-061', 'CT-062', 'CT-062', MONSAT, L('Senin–Sabtu 16:00', 'Mon–Sat 16:00'), 'client', 'active', '2024-05-01', ''),
    pr('PR-08A', 'Pondok Impian', 'CL-08', 'villa', 'Jl. Bisma No. 21', 'Ubud', 'CT-081', 'CT-081', 'CT-081', 'CT-081', L('Senin, Rabu, Jumat 09:00', 'Mon, Wed, Fri 09:00'), L('Selasa, Kamis, Sabtu 15:00', 'Tue, Thu, Sat 15:00'), 'client', 'active', '2024-03-01', ''),
    pr('PR-09A', 'Villa Sari', 'CL-09', 'villa', 'Jl. Drupadi No. 8', 'Seminyak', 'CT-091', 'CT-091', 'CT-091', 'CT-091', L('Senin, Kamis 09:00', 'Mon, Thu 09:00'), L('Rabu, Sabtu 15:00', 'Wed, Sat 15:00'), 'client', 'active', '2024-06-01', ''),
    pr('PR-10A', 'Bali Nest', 'CL-10', 'villa', 'Jl. Danau Tamblingan No. 40', 'Sanur', 'CT-102', 'CT-101', 'CT-102', 'CT-102', MONSAT, L('Senin–Sabtu 17:00', 'Mon–Sat 17:00'), 'client', 'onhold', '2023-01-01', L('Layanan ditahan sampai kontrak baru disetujui.', 'Service on hold until the new contract is approved.')),
    pr('PR-11A', 'Rumah Ratna', 'CL-11', 'personal', 'Jl. Sriwedari No. 2', 'Ubud', 'CT-111', 'CT-111', 'CT-111', 'CT-111', L('Sesuai permintaan', 'On request'), L('Sesuai permintaan', 'On request'), 'client', 'active', '2025-02-10', ''),
    pr('PR-12A', 'Warung Segar Sanur', 'CL-12', 'fnb', 'Jl. Danau Poso No. 15', 'Sanur', 'CT-121', 'CT-121', 'CT-121', 'CT-121', L('Belum dijadwalkan', 'Not scheduled'), L('Belum dijadwalkan', 'Not scheduled'), 'client', 'inactive', '2026-09-20', '')
  ];

  /* ---------- NP-02 Contacts (§7–§11). scope: all · sel · single ---------- */
  function ct(id, n, pos, dept, cl, level, scope, props, phone, email, pref, roles, active, notes) {
    return { id: id, n: n, pos: pos, dept: dept, cl: cl, level: level, scope: scope, props: props || [], phone: phone, wa: phone, email: email, pref: pref, roles: roles, active: active !== false, notes: notes || '' };
  }
  D.CONTACTS = [
    ct('CT-071', 'Bpk. Arya Wijaya', 'General Manager', L('Manajemen', 'Management'), 'CL-07', 'group', 'all', [], '+62 811 3801 7101', 'arya@jaensspa.com', 'wa', ['decision', 'contract', 'renewal', 'pricing', 'escalation']),
    ct('CT-072', 'Ni Luh Putri', 'Finance Manager', 'Finance', 'CL-07', 'group', 'all', [], '+62 811 3801 7102', 'finance@jaensspa.com', 'email', ['billing', 'payment', 'ar', 'tax']),
    ct('CT-073', 'Made Arta', 'Corporate Purchasing', 'Purchasing', 'CL-07', 'group', 'all', [], '+62 811 3801 7103', 'purchasing@jaensspa.com', 'email', ['pricing', 'contract']),
    ct('CT-074', 'Mila Putri', 'Supervisor', L('Operasional', 'Operations'), 'CL-07', 'property', 'single', ['PR-07A'], '+62 812 3456 7890', 'mila@jaensspa.com', 'wa', ['operational', 'pickup', 'complaint', 'emergency'], true, L('PIC operasional harian dan koordinasi pickup.', 'Daily operations PIC and pickup coordination.')),
    ct('CT-075', 'Putra Mahendra', 'Operations Manager', L('Operasional', 'Operations'), 'CL-07', 'property', 'single', ['PR-07B'], '+62 812 3456 7891', 'putra@jaensspa.com', 'wa', ['operational', 'pickup', 'delivery', 'complaint']),
    ct('CT-076', 'Wayan Sudarma', 'Supervisor', L('Operasional', 'Operations'), 'CL-07', 'property', 'single', ['PR-07C'], '+62 812 3456 7892', 'wayan@jaensspa.com', 'phone', ['operational', 'pickup', 'complaint']),
    ct('CT-077', 'Komang Ayu', 'Supervisor', L('Operasional', 'Operations'), 'CL-07', 'property', 'single', ['PR-07D'], '+62 812 3456 7893', 'komang@jaensspa.com', 'wa', ['operational', 'pickup', 'housekeeping', 'emergency']),
    ct('CT-078', 'Kadek Rina', 'Accounting', 'Accounting', 'CL-07', 'property', 'sel', ['PR-07A', 'PR-07B'], '+62 812 3456 7894', 'accounting@jaensspa.com', 'email', ['billing', 'ar']),
    ct('CT-079', 'Gede Wira', 'Front Office', 'Front Office', 'CL-07', 'property', 'single', ['PR-07D'], '+62 812 3456 7895', 'fo.bisma@jaensspa.com', 'phone', ['delivery']),
    ct('CT-080', 'Ketut Lama', 'Supervisor', L('Operasional', 'Operations'), 'CL-07', 'property', 'single', ['PR-07C'], '+62 812 3456 7896', '', 'phone', ['operational'], false, L('Sudah tidak bertugas sejak Mei 2026.', 'No longer on duty since May 2026.')),
    ct('CT-011', 'Ibu Sari Wulandari', 'Executive Housekeeper', 'Housekeeping', 'CL-01', 'property', 'sel', ['PR-01A', 'PR-01B'], '+62 813 5501 1101', 'sari@grandvista.id', 'wa', ['operational', 'complaint', 'housekeeping', 'emergency']),
    ct('CT-012', 'Bpk. Hendra Gunawan', 'General Manager', L('Manajemen', 'Management'), 'CL-01', 'group', 'all', [], '+62 813 5501 1102', 'gm@grandvista.id', 'email', ['decision', 'contract', 'renewal', 'pricing', 'escalation']),
    ct('CT-013', 'Dewi Anggraeni', 'Corporate Finance', 'Finance', 'CL-01', 'group', 'all', [], '+62 813 5501 1103', 'finance@grandvista.id', 'email', ['billing', 'payment', 'ar', 'tax']),
    ct('CT-014', 'Agus Pratama', 'Linen Room Supervisor', 'Housekeeping', 'CL-01', 'property', 'single', ['PR-01B'], '+62 813 5501 1104', 'linen@grandvista.id', 'wa', ['pickup', 'delivery']),
    ct('CT-021', 'Bpk. Rudi Hartono', 'Director', L('Manajemen', 'Management'), 'CL-02', 'group', 'all', [], '+62 813 5502 2101', 'rudi@santaihotel.com', 'email', ['decision', 'contract', 'renewal', 'pricing', 'billing', 'payment']),
    ct('CT-022', 'Ni Made Sukma', 'Housekeeping Manager', 'Housekeeping', 'CL-02', 'property', 'single', ['PR-02A'], '+62 813 5502 2102', 'hk@santaihotel.com', 'wa', ['operational', 'pickup', 'delivery', 'complaint']),
    ct('CT-031', 'Ibu Laras Santoso', 'Director of Operations', L('Manajemen', 'Management'), 'CL-03', 'group', 'all', [], '+62 813 5503 3101', 'laras@kayana.com', 'email', ['decision', 'contract', 'renewal', 'pricing', 'escalation']),
    ct('CT-032', 'Putu Dharma', 'Finance Manager', 'Finance', 'CL-03', 'group', 'all', [], '+62 813 5503 3102', 'finance@kayana.com', 'email', ['billing', 'payment', 'ar', 'tax']),
    ct('CT-033', 'Kadek Surya', 'Housekeeping Supervisor', 'Housekeeping', 'CL-03', 'property', 'single', ['PR-03A'], '+62 813 5503 3103', 'hk.seminyak@kayana.com', 'wa', ['operational', 'pickup', 'complaint']),
    ct('CT-034', 'Nyoman Adi', 'Villa Manager', L('Operasional', 'Operations'), 'CL-03', 'property', 'single', ['PR-03B'], '+62 813 5503 3104', 'ubud@kayana.com', 'wa', ['operational', 'pickup', 'complaint', 'emergency']),
    ct('CT-041', 'Mr. James Walker', 'Owner', L('Pemilik', 'Owner'), 'CL-04', 'group', 'all', [], '+62 813 5504 4101', 'james@oceanview.villa', 'email', ['decision', 'contract', 'renewal', 'pricing', 'billing', 'payment']),
    ct('CT-042', 'Wayan Gede', 'Villa Manager', L('Operasional', 'Operations'), 'CL-04', 'property', 'single', ['PR-04A'], '+62 813 5504 4102', 'manager@oceanview.villa', 'wa', ['operational', 'pickup', 'delivery', 'complaint']),
    ct('CT-051', 'Ibu Nia Kurnia', 'Executive Housekeeper', 'Housekeeping', 'CL-05', 'property', 'single', ['PR-05A'], '+62 813 5505 5101', 'nia@hotelabc.id', 'wa', ['operational', 'pickup', 'delivery', 'complaint']),
    ct('CT-052', 'Bpk. Andre Wibowo', 'General Manager', L('Manajemen', 'Management'), 'CL-05', 'group', 'all', [], '+62 813 5505 5102', 'gm@hotelabc.id', 'email', ['decision', 'contract', 'renewal', 'pricing', 'escalation']),
    ct('CT-053', 'Lina Marlina', 'Chief Accountant', 'Accounting', 'CL-05', 'group', 'all', [], '+62 813 5505 5103', 'accounting@hotelabc.id', 'email', ['billing', 'payment', 'ar', 'tax']),
    ct('CT-061', 'Ibu Dayu Pertiwi', 'Owner', L('Pemilik', 'Owner'), 'CL-06', 'group', 'all', [], '+62 813 5506 6101', 'dayu@ubudspa.com', 'wa', ['decision', 'contract', 'renewal', 'pricing', 'billing', 'payment']),
    ct('CT-062', 'Komang Sri', 'Spa Supervisor', L('Operasional', 'Operations'), 'CL-06', 'property', 'single', ['PR-06A'], '+62 813 5506 6102', 'spa@ubudspa.com', 'wa', ['operational', 'pickup', 'complaint']),
    ct('CT-081', 'Bpk. Made Sujana', 'Owner', L('Pemilik', 'Owner'), 'CL-08', 'group', 'all', [], '+62 813 5508 8101', 'pondokimpian@gmail.com', 'wa', ['decision', 'contract', 'renewal', 'pricing', 'billing', 'payment', 'operational', 'pickup', 'complaint']),
    ct('CT-091', 'Ibu Sari Kusuma', 'Villa Manager', L('Manajemen', 'Management'), 'CL-09', 'group', 'all', [], '+62 813 5509 9101', 'manager@villasari.com', 'wa', ['decision', 'contract', 'renewal', 'pricing', 'billing', 'operational', 'pickup', 'complaint']),
    ct('CT-101', 'Mr. Peter Lim', 'General Manager', L('Manajemen', 'Management'), 'CL-10', 'group', 'all', [], '+62 813 5510 1101', 'gm@balinest.com', 'email', ['decision', 'contract', 'renewal', 'pricing', 'billing', 'payment']),
    ct('CT-102', 'Ketut Adi', 'Housekeeping', 'Housekeeping', 'CL-10', 'property', 'single', ['PR-10A'], '+62 813 5510 1102', 'hk@balinest.com', 'wa', ['operational', 'pickup', 'complaint']),
    ct('CT-111', 'Ratna Dewi', L('Pelanggan', 'Customer'), '—', 'CL-11', 'group', 'all', [], '+62 812 9911 1101', 'ratna.dewi@gmail.com', 'wa', ['decision', 'billing', 'payment', 'operational', 'pickup', 'complaint']),
    ct('CT-121', 'Bpk. Wayan Segara', 'Owner', L('Pemilik', 'Owner'), 'CL-12', 'group', 'all', [], '+62 812 9912 1201', 'warungsegar@gmail.com', 'wa', ['decision', 'contract', 'pricing'])
  ];

  /* ---------- NP-03 Service catalog (§13): global standard ---------- */
  function sv(id, n, desc, unit, price, sla, proc, items, icon) { return { id: id, n: n, desc: desc, unit: unit, price: price, sla: sla, proc: proc, items: items, icon: icon, active: true }; }
  D.SERVICES = [
    sv('SV-001', 'Wash Regular', L('Cuci, kering, lipat standar.', 'Standard wash, dry, fold.'), 'kg', 7500, 24, L('Terima → Cuci → Kering → Lipat → QC → Packing', 'Receive → Wash → Dry → Fold → QC → Pack'), L('Linen, handuk, pakaian', 'Linen, towels, clothes'), 'washer'),
    sv('SV-002', 'Wash Express', L('Cuci prioritas selesai dalam 8 jam.', 'Priority wash done within 8 hours.'), 'kg', 9500, 8, L('Jalur prioritas, QC cepat', 'Priority line, fast QC'), L('Linen, handuk', 'Linen, towels'), 'zap'),
    sv('SV-003', 'Super Express 4 Jam', L('Selesai dalam 4 jam untuk kebutuhan mendesak.', 'Done within 4 hours for urgent needs.'), 'kg', 12500, 4, L('Jalur prioritas khusus, kurir langsung', 'Dedicated priority line, direct courier'), L('Handuk, linen kecil', 'Towels, small linen'), 'zap'),
    sv('SV-004', 'Iron Only', L('Setrika saja.', 'Ironing only.'), 'kg', 6000, 24, L('Terima → Setrika → Lipat → QC', 'Receive → Iron → Fold → QC'), L('Linen, seragam', 'Linen, uniforms'), 'shirt'),
    sv('SV-005', 'Dry Cleaning', L('Dry clean untuk bahan sensitif.', 'Dry cleaning for delicate fabric.'), 'pcs', 25000, 48, L('Inspeksi → Dry clean → Press → QC', 'Inspect → Dry clean → Press → QC'), L('Jas, gaun, tirai', 'Suits, dresses, curtains'), 'shirt'),
    sv('SV-006', 'Linen Care', L('Perawatan linen kamar hotel.', 'Hotel room linen care.'), 'kg', 8500, 24, L('Sortir → Cuci → Ironer → Lipat → QC', 'Sort → Wash → Ironer → Fold → QC'), L('Sprei, sarung bantal, duvet', 'Sheets, pillowcases, duvets'), 'bed'),
    sv('SV-007', 'Spa Linen', L('Linen spa dengan deterjen lembut.', 'Spa linen with gentle detergent.'), 'kg', 9000, 24, L('Sortir → Cuci lembut → Kering → Lipat → QC', 'Sort → Gentle wash → Dry → Fold → QC'), L('Handuk spa, kain pijat, robe', 'Spa towels, massage cloths, robes'), 'sparkles'),
    sv('SV-008', 'Towel Care', L('Perawatan handuk kamar dan kolam.', 'Room and pool towel care.'), 'kg', 8000, 24, L('Sortir → Cuci → Kering → Lipat → QC', 'Sort → Wash → Dry → Fold → QC'), L('Handuk mandi, handuk kolam', 'Bath towels, pool towels'), 'droplet'),
    sv('SV-009', 'Uniform Care', L('Cuci dan setrika seragam staf.', 'Staff uniform wash and press.'), 'pcs', 12000, 24, L('Terima → Cuci → Setrika → Gantung → QC', 'Receive → Wash → Press → Hang → QC'), L('Seragam staf', 'Staff uniforms'), 'idcard'),
    sv('SV-010', 'Special Treatment', L('Penanganan noda berat dan bahan khusus.', 'Heavy stain and special fabric treatment.'), 'pcs', 35000, 48, L('Inspeksi → Perlakuan khusus → Cuci → QC', 'Inspect → Special treatment → Wash → QC'), L('Noda berat, bahan khusus', 'Heavy stains, special fabric'), 'shield')
  ];

  /* ---------- Client service configuration (§14–§15): property-level overrides ---------- */
  function cs(prop, svc, rate, sla, instr, o) { return Object.assign({ prop: prop, svc: svc, active: true, rate: rate, sla: sla, instr: instr || '', items: '', pickup: L('Ikut jadwal pickup property', 'Follows the property pickup schedule'), express: false, minCharge: 0, notes: '' }, o || {}); }
  var SPA_DET = L('Gunakan deterjen khusus spa', 'Use spa detergent');
  D.CLIENT_SERVICES = [
    cs('PR-07A', 'SV-001', 7000, 24, ''), cs('PR-07A', 'SV-007', 8500, 24, SPA_DET), cs('PR-07A', 'SV-008', 7500, 24, ''),
    cs('PR-07B', 'SV-001', 7000, 24, ''), cs('PR-07B', 'SV-007', 8500, 24, SPA_DET), cs('PR-07B', 'SV-008', 7500, 24, ''),
    cs('PR-07C', 'SV-001', 7000, 24, ''), cs('PR-07C', 'SV-007', 8000, 24, SPA_DET, { notes: L('Tarif addendum Triloka', 'Triloka addendum rate') }), cs('PR-07C', 'SV-008', 7500, 24, ''),
    cs('PR-07D', 'SV-001', 7000, 24, ''), cs('PR-07D', 'SV-007', 8500, 24, SPA_DET), cs('PR-07D', 'SV-008', 7500, 24, ''), cs('PR-07D', 'SV-002', 8500, 6, L('Handuk kolam akhir pekan', 'Weekend pool towels'), { express: true, minCharge: 150000 }),
    cs('PR-01A', 'SV-006', 8000, 12, L('Hitung per pcs bersama housekeeping', 'Count per piece with housekeeping'), { items: L('Sprei, sarung bantal, duvet', 'Sheets, pillowcases, duvets') }), cs('PR-01A', 'SV-008', 7600, 24, ''), cs('PR-01A', 'SV-009', 11000, 24, ''), cs('PR-01A', 'SV-005', 24000, 48, '', { minCharge: 100000 }), cs('PR-01A', 'SV-002', 9000, 8, '', { express: true }),
    cs('PR-01B', 'SV-006', 8000, 12, ''), cs('PR-01B', 'SV-008', 7600, 24, ''), cs('PR-01B', 'SV-002', 9000, 8, '', { express: true }),
    cs('PR-02A', 'SV-006', 8200, 24, ''), cs('PR-02A', 'SV-008', 7800, 24, ''), cs('PR-02A', 'SV-009', 11500, 24, ''),
    cs('PR-03A', 'SV-006', 8300, 24, ''), cs('PR-03A', 'SV-008', 7800, 24, ''), cs('PR-03A', 'SV-010', 32000, 48, ''),
    cs('PR-03B', 'SV-006', 8300, 24, ''), cs('PR-03B', 'SV-008', 7800, 24, '', { pickup: L('Senin–Sabtu, motor box', 'Mon–Sat, box motorbike') }),
    cs('PR-04A', 'SV-001', 7500, 24, ''), cs('PR-04A', 'SV-006', 8500, 24, ''), cs('PR-04A', 'SV-008', 8000, 24, ''),
    cs('PR-05A', 'SV-006', 8100, 24, ''), cs('PR-05A', 'SV-008', 7700, 24, ''), cs('PR-05A', 'SV-009', 11000, 24, ''), cs('PR-05A', 'SV-004', 5800, 24, ''),
    cs('PR-06A', 'SV-007', 8700, 24, SPA_DET), cs('PR-06A', 'SV-008', 7800, 24, ''),
    cs('PR-08A', 'SV-001', 7500, 24, ''), cs('PR-08A', 'SV-006', 8500, 24, ''),
    cs('PR-09A', 'SV-001', 7500, 24, ''), cs('PR-09A', 'SV-008', 8000, 24, ''),
    cs('PR-10A', 'SV-006', 8400, 24, '', { active: false, notes: L('Ditahan: kontrak berakhir', 'On hold: contract ended') }), cs('PR-10A', 'SV-008', 7900, 24, '', { active: false }),
    cs('PR-11A', 'SV-001', null, null, ''), cs('PR-11A', 'SV-005', null, null, '')
  ];

  /* ---------- NP-04 Contracts with versions (§16–§20) ----------
     Each record is one version; the newest non-archived version per number is current. */
  function ctr(no, v, cl, props, start, end, renew, status, o) {
    return Object.assign({ no: no, v: v, cl: cl, props: props, start: start, end: end, renew: renew, status: status, terms: 30, credit: L('Limit sesuai master klien', 'Limit per client master'),
      scope: [], sla: null, rc: null, minVol: 0, pickup: L('Setiap hari', 'Daily'), cycle: 'monthly', tax: L('PPN 11%', 'VAT 11%'), special: '', attach: [], notes: '', owner: 'EMP-040', approver: 'EMP-050',
      eff: start, reason: L('Kontrak awal', 'Initial contract'), by: 'EMP-040', apprBy: 'EMP-050', at: start + ' 10:00', strat: null }, o || {});
  }
  var JAENS = ['PR-07A', 'PR-07B', 'PR-07C', 'PR-07D'];
  D.CONTRACTS = [
    ctr('CTR-2026-001', 1, 'CL-07', JAENS, '2026-01-01', '2026-12-31', 'manual', 'archived', { terms: 21, scope: ['SV-001', 'SV-007', 'SV-008'], sla: 'SLA-07', rc: 'RC-07', minVol: 1200, pickup: L('Setiap hari 07:00', 'Daily 07:00'), cycle: 'biweekly', owner: 'EMP-041', strat: 'CT-071', at: '2025-12-20 14:00', reason: L('Kontrak grup 2026', 'Group contract 2026'), attach: ['DOC-0711'] }),
    ctr('CTR-2026-001', 2, 'CL-07', JAENS, '2026-01-01', '2026-12-31', 'manual', 'active', { terms: 30, scope: ['SV-001', 'SV-007', 'SV-008', 'SV-002'], sla: 'SLA-07', rc: 'RC-07', minVol: 1500, pickup: L('Setiap hari 07:00', 'Daily 07:00'), cycle: 'monthly', owner: 'EMP-041', strat: 'CT-071', eff: '2026-07-01', at: '2026-06-24 11:20', reason: L('Termin Net 30, volume minimum naik dan express untuk Bisma', 'Net 30 terms, higher minimum volume and express for Bisma'), special: L('Pickup Minggu gratis untuk Bisma', 'Free Sunday pickup for Bisma'), attach: ['DOC-0712'] }),
    ctr('CTR-2025-022', 1, 'CL-07', ['PR-07C'], '2025-11-21', '2026-11-20', 'manual', 'active', { scope: ['SV-007'], sla: 'SLA-07', rc: 'RC-07C', owner: 'EMP-041', strat: 'CT-071', reason: L('Addendum tarif Spa Linen Triloka', 'Triloka Spa Linen rate addendum'), at: '2025-11-15 09:30', attach: ['DOC-0713'] }),
    ctr('CTR-2025-014', 2, 'CL-01', ['PR-01A', 'PR-01B'], '2024-11-06', '2025-11-05', 'auto', 'archived', { scope: ['SV-006', 'SV-008', 'SV-009'], sla: 'SLA-01', rc: 'RC-01', minVol: 9000, at: '2024-10-30 10:00', reason: L('Perpanjangan 2024', '2024 renewal') }),
    ctr('CTR-2025-014', 3, 'CL-01', ['PR-01A', 'PR-01B'], '2025-11-06', '2026-11-05', 'auto', 'active', { scope: ['SV-006', 'SV-008', 'SV-009', 'SV-005', 'SV-002'], sla: 'SLA-01', rc: 'RC-01', minVol: 10000, eff: '2025-11-06', at: '2025-10-28 15:10', reason: L('Perpanjangan 2025, tambah dry cleaning dan express', '2025 renewal, added dry cleaning and express'), strat: 'CT-012', attach: ['DOC-0111'] }),
    ctr('CTR-2026-002', 1, 'CL-02', ['PR-02A'], '2026-02-01', '2027-01-31', 'manual', 'active', { scope: ['SV-006', 'SV-008', 'SV-009'], sla: 'SLA-STD-REG', rc: 'RC-02', minVol: 5000, strat: 'CT-021', attach: ['DOC-0211'] }),
    ctr('CTR-2026-004', 1, 'CL-03', ['PR-03A'], '2026-03-01', '2027-02-28', 'manual', 'archived', { scope: ['SV-006', 'SV-008', 'SV-010'], sla: 'SLA-STD-REG', rc: 'RC-03', minVol: 5500, owner: 'EMP-041', strat: 'CT-031', at: '2026-02-20 10:00' }),
    ctr('CTR-2026-004', 2, 'CL-03', ['PR-03A', 'PR-03B'], '2026-03-01', '2027-02-28', 'manual', 'active', { scope: ['SV-006', 'SV-008', 'SV-010'], sla: 'SLA-STD-REG', rc: 'RC-03', minVol: 7000, owner: 'EMP-041', strat: 'CT-031', eff: '2026-07-01', at: '2026-06-18 13:00', reason: L('Tambah property Ubud Hideaway', 'Added the Ubud Hideaway property'), attach: ['DOC-0311'] }),
    ctr('CTR-2026-009', 1, 'CL-04', ['PR-04A'], '2026-04-01', '2027-03-31', 'manual', 'active', { scope: ['SV-001', 'SV-006', 'SV-008'], sla: 'SLA-STD-REG', rc: 'RC-04', minVol: 2500, pickup: L('Senin–Sabtu', 'Mon–Sat'), strat: 'CT-041' }),
    ctr('CTR-2025-031', 1, 'CL-05', ['PR-05A'], '2025-12-21', '2026-12-20', 'manual', 'active', { terms: 14, scope: ['SV-006', 'SV-008', 'SV-009', 'SV-004'], sla: 'SLA-05', rc: 'RC-05', minVol: 4500, strat: 'CT-052', attach: ['DOC-0511'] }),
    ctr('CTR-2025-008', 1, 'CL-06', ['PR-06A'], '2025-05-01', '2026-10-31', 'manual', 'active', { scope: ['SV-007', 'SV-008'], sla: 'SLA-STD-REG', rc: 'RC-06', minVol: 1800, owner: 'EMP-041', strat: 'CT-061', pickup: L('Senin–Sabtu', 'Mon–Sat') }),
    ctr('CTR-2026-011', 1, 'CL-06', ['PR-06A'], '2026-11-01', '2027-10-31', 'manual', 'review', { scope: ['SV-007', 'SV-008', 'SV-003'], sla: 'SLA-STD-REG', rc: 'RC-06', minVol: 2000, owner: 'EMP-041', strat: 'CT-061', pickup: L('Senin–Sabtu', 'Mon–Sat'), at: '2026-10-01 16:00', reason: L('Renewal 2026–2027 dengan Super Express', '2026–2027 renewal with Super Express'), renewalOf: 'CTR-2025-008', apprBy: null }),
    ctr('CTR-2026-007', 1, 'CL-08', ['PR-08A'], '2026-03-01', '2027-02-28', 'manual', 'active', { scope: ['SV-001', 'SV-006'], sla: 'SLA-STD-REG', rc: 'RC-08', minVol: 900, owner: 'EMP-041', strat: 'CT-081', pickup: L('Senin, Rabu, Jumat', 'Mon, Wed, Fri') }),
    ctr('CTR-2025-020', 1, 'CL-09', ['PR-09A'], '2025-10-22', '2026-10-21', 'manual', 'active', { terms: 14, scope: ['SV-001', 'SV-008'], sla: 'SLA-STD-REG', rc: 'RC-09', minVol: 700, strat: 'CT-091', pickup: L('Senin, Kamis', 'Mon, Thu') }),
    ctr('CTR-2024-010', 2, 'CL-10', ['PR-10A'], '2024-10-01', '2026-09-30', 'manual', 'expired', { scope: ['SV-006', 'SV-008'], sla: 'SLA-STD-REG', rc: 'RC-10', minVol: 2000, strat: 'CT-101', at: '2025-09-25 10:00', reason: L('Perpanjangan 1 tahun', '1-year extension') }),
    ctr('CTR-2026-012', 1, 'CL-12', ['PR-12A'], '2026-11-01', '2027-10-31', 'manual', 'draft', { terms: 14, scope: ['SV-001', 'SV-009'], sla: 'SLA-STD-REG', rc: null, minVol: 400, owner: 'EMP-041', strat: 'CT-121', at: '2026-10-02 11:00', reason: L('Draft kontrak klien baru', 'New client contract draft'), apprBy: null })
  ];

  /* ---------- NP-05 Rate cards with versions (§21–§26) ---------- */
  function rl(svc, client, o) { return Object.assign({ svc: svc, item: L('Semua item', 'All items'), cat: null, disc: 0, minQty: 0, minCharge: 0, sur: 0, tax: 11, status: 'active' }, o || {}, { client: client }); }
  function rc(id, v, n, cl, prop, ctr, eff, exp, status, lines, o) { return Object.assign({ id: id, v: v, n: n, cl: cl, prop: prop, ctr: ctr, eff: eff, exp: exp, cur: 'IDR', status: status, approver: 'EMP-050', by: 'EMP-040', at: eff + ' 09:00', reason: L('Rate card awal', 'Initial rate card'), lines: lines, prio: 0 }, o || {}); }
  D.RATECARDS = [
    rc('RC-07', 1, 'Rate Card · Jaens Spa Group', 'CL-07', null, 'CTR-2026-001', '2025-01-01', '2025-12-31', 'archived', [rl('SV-001', 6500), rl('SV-007', 8200), rl('SV-008', 7200)], { by: 'EMP-041' }),
    rc('RC-07', 2, 'Rate Card · Jaens Spa Group', 'CL-07', null, 'CTR-2026-001', '2026-01-01', '2026-12-31', 'active', [rl('SV-001', 7000), rl('SV-007', 8500, { cat: L('Linen spa', 'Spa linen') }), rl('SV-008', 7500), rl('SV-002', 8500, { minCharge: 150000, sur: 0 }), rl('SV-004', 5000)],
      { by: 'EMP-041', reason: L('Penyesuaian biaya chemical dan energi', 'Chemical and energy cost adjustment'), at: '2025-12-12 10:30' }),
    rc('RC-07C', 1, 'Rate Card · Jaens Spa Triloka (addendum)', 'CL-07', 'PR-07C', 'CTR-2025-022', '2025-11-21', '2026-11-20', 'active', [rl('SV-007', 8000)], { by: 'EMP-041', prio: 1, reason: L('Tarif khusus addendum Triloka', 'Triloka addendum special rate') }),
    rc('RC-01', 2, 'Rate Card · Grand Vista Hotel', 'CL-01', null, 'CTR-2025-014', '2024-11-06', '2025-11-05', 'archived', [rl('SV-006', 7800), rl('SV-008', 7400), rl('SV-009', 10500)]),
    rc('RC-01', 3, 'Rate Card · Grand Vista Hotel', 'CL-01', null, 'CTR-2025-014', '2025-11-06', '2026-11-05', 'active', [rl('SV-006', 8000, { cat: L('Linen kamar', 'Room linen') }), rl('SV-008', 7600), rl('SV-009', 11000), rl('SV-005', 24000, { minCharge: 100000 }), rl('SV-002', 9000, { sur: 0 })], { reason: L('Perpanjangan 2025', '2025 renewal') }),
    rc('RC-02', 1, 'Rate Card · The Santai Hotel', 'CL-02', null, 'CTR-2026-002', '2026-02-01', '2027-01-31', 'active', [rl('SV-006', 8200), rl('SV-008', 7800), rl('SV-009', 11500)]),
    rc('RC-03', 1, 'Rate Card · Kayana Resort', 'CL-03', null, 'CTR-2026-004', '2026-03-01', '2027-02-28', 'active', [rl('SV-006', 8300), rl('SV-008', 7800), rl('SV-010', 32000)], { by: 'EMP-041' }),
    rc('RC-04', 1, 'Rate Card · Oceanview Villa', 'CL-04', null, 'CTR-2026-009', '2026-04-01', '2027-03-31', 'active', [rl('SV-001', 7500), rl('SV-006', 8500), rl('SV-008', 8000)]),
    rc('RC-05', 1, 'Rate Card · Hotel ABC', 'CL-05', null, 'CTR-2025-031', '2025-12-21', '2026-12-20', 'active', [rl('SV-006', 8100), rl('SV-008', 7700), rl('SV-009', 11000), rl('SV-004', 5800)]),
    rc('RC-06', 1, 'Rate Card · Ubud Spa Retreat', 'CL-06', null, 'CTR-2025-008', '2025-05-01', '2026-10-31', 'active', [rl('SV-007', 8700), rl('SV-008', 7800)], { by: 'EMP-041' }),
    rc('RC-08', 1, 'Rate Card · Pondok Impian', 'CL-08', null, 'CTR-2026-007', '2026-03-01', '2027-02-28', 'active', [rl('SV-001', 7500), rl('SV-006', 8500)], { by: 'EMP-041' }),
    rc('RC-09', 1, 'Rate Card · Villa Sari', 'CL-09', null, 'CTR-2025-020', '2025-10-22', '2026-10-21', 'active', [rl('SV-001', 7500), rl('SV-008', 8000)]),
    rc('RC-10', 1, 'Rate Card · Bali Nest', 'CL-10', null, 'CTR-2024-010', '2024-10-01', '2026-09-30', 'expired', [rl('SV-006', 8400), rl('SV-008', 7900)])
  ];
  // §25 rate change history (approved changes)
  D.RATE_CHANGES = [
    { id: 'RCH-001', rc: 'RC-07', svc: 'SV-001', from: 6500, to: 7000, eff: '2026-01-01', reason: L('Penyesuaian biaya chemical dan energi', 'Chemical and energy cost adjustment'), by: 'EMP-041', appr: 'EMP-050', at: '2025-12-12 10:30' },
    { id: 'RCH-002', rc: 'RC-07', svc: 'SV-007', from: 8200, to: 8500, eff: '2026-01-01', reason: L('Penyesuaian biaya chemical dan energi', 'Chemical and energy cost adjustment'), by: 'EMP-041', appr: 'EMP-050', at: '2025-12-12 10:30' },
    { id: 'RCH-003', rc: 'RC-07', svc: 'SV-008', from: 7200, to: 7500, eff: '2026-01-01', reason: L('Penyesuaian biaya chemical dan energi', 'Chemical and energy cost adjustment'), by: 'EMP-041', appr: 'EMP-050', at: '2025-12-12 10:30' },
    { id: 'RCH-004', rc: 'RC-01', svc: 'SV-006', from: 7800, to: 8000, eff: '2025-11-06', reason: L('Perpanjangan 2025', '2025 renewal'), by: 'EMP-040', appr: 'EMP-050', at: '2025-10-28 15:10' }
  ];
  // Invoice lines priced with the rate valid on the pricing date (§26).
  D.INVOICE_LINES = [
    { inv: 'INV-2512-071', cl: 'CL-07', prop: 'PR-07A', date: '2025-12-15', svc: 'SV-001', qty: 1040 },
    { inv: 'INV-2601-071', cl: 'CL-07', prop: 'PR-07A', date: '2026-01-15', svc: 'SV-001', qty: 1080 },
    { inv: 'INV-2609-071', cl: 'CL-07', prop: 'PR-07C', date: '2026-09-30', svc: 'SV-007', qty: 410 },
    { inv: 'INV-2609-072', cl: 'CL-07', prop: 'PR-07B', date: '2026-09-30', svc: 'SV-007', qty: 520 },
    { inv: 'INV-2510-011', cl: 'CL-01', prop: 'PR-01A', date: '2025-10-31', svc: 'SV-006', qty: 6100 },
    { inv: 'INV-2609-011', cl: 'CL-01', prop: 'PR-01A', date: '2026-09-30', svc: 'SV-006', qty: 6400 }
  ];

  /* ---------- NP-06 SLA rules (§27–§31). Unset fields mean "any". ---------- */
  function sl(id, n, o) { return Object.assign({ id: id, n: n, cl: null, prop: null, svc: null, cat: null, pri: null, win: null, tat: 24, pickCut: '09:00', delCut: '17:00', esc: L('75% Info · 90% Warning · 100% Late → Supervisor lalu Ops Manager', '75% Info · 90% Warning · 100% Late → Supervisor then Ops Manager'), penalty: '', comp: '', review: L('Kuartalan', 'Quarterly'), eff: '2026-01-01', exp: null, status: 'active' }, o); }
  D.SLA_RULES = [
    sl('SLA-STD-REG', L('Standar Wash Regular', 'Standard Wash Regular'), { svc: 'SV-001', tat: 24 }),
    sl('SLA-STD-EXP', L('Standar Express', 'Standard Express'), { svc: 'SV-002', tat: 8, pickCut: '10:00', delCut: '18:00' }),
    sl('SLA-STD-SUP', L('Standar Super Express', 'Standard Super Express'), { svc: 'SV-003', tat: 4, pickCut: '13:00', delCut: '19:00' }),
    sl('SLA-STD-DRY', L('Standar Dry Cleaning', 'Standard Dry Cleaning'), { svc: 'SV-005', tat: 48 }),
    sl('SLA-STD-ALL', L('Standar umum', 'General default'), { tat: 24 }),
    sl('SLA-07', L('SLA Grup Jaens Spa', 'Jaens Spa Group SLA'), { cl: 'CL-07', tat: 24, pickCut: '09:00', delCut: '17:00', penalty: L('Potongan 5% untuk item terlambat', '5% discount on late items'), comp: L('Rewash gratis', 'Free rewash'), eff: '2026-01-01', exp: '2026-12-31', review: L('Mei & Nov', 'May & Nov') }),
    sl('SLA-07D', L('Express akhir pekan Bisma', 'Bisma weekend express'), { cl: 'CL-07', prop: 'PR-07D', svc: 'SV-002', tat: 6, pickCut: '08:00', delCut: '14:00', eff: '2026-07-01', exp: '2026-12-31' }),
    sl('SLA-01', L('Linen kamar Grand Vista', 'Grand Vista room linen'), { cl: 'CL-01', svc: 'SV-006', pri: 'high', tat: 12, pickCut: '08:00', delCut: '20:00', penalty: L('Potongan 10% item terlambat', '10% discount on late items'), comp: L('Pengiriman ulang gratis', 'Free redelivery'), eff: '2025-11-06', exp: '2026-11-05' }),
    sl('SLA-01-WE', L('Linen kamar Grand Vista · akhir pekan', 'Grand Vista room linen · weekend'), { cl: 'CL-01', svc: 'SV-006', pri: 'high', win: 'weekend', tat: 18, eff: '2025-11-06', exp: '2026-11-05' }),
    sl('SLA-05', L('SLA Hotel ABC', 'Hotel ABC SLA'), { cl: 'CL-05', tat: 20, eff: '2025-12-21', exp: '2026-12-20', review: L('Jatuh tempo 15 Okt 2026', 'Due 15 Oct 2026'), reviewDue: '2026-10-15' })
  ];
  // Monthly SLA result per property and service (operations SLA feed, §51). [onTrack, atRisk, late, avgTatHours]
  D.SLA_MONTH = {
    'PR-07A': { 'SV-001': [312, 6, 2, 19.8], 'SV-007': [268, 5, 1, 20.4], 'SV-008': [190, 2, 0, 18.9] },
    'PR-07B': { 'SV-001': [298, 5, 1, 20.1], 'SV-007': [301, 6, 2, 20.9], 'SV-008': [176, 3, 1, 19.6] },
    'PR-07C': { 'SV-001': [201, 7, 4, 22.6], 'SV-007': [188, 6, 3, 22.9], 'SV-008': [120, 2, 1, 21.0] },
    'PR-07D': { 'SV-001': [256, 4, 1, 19.5], 'SV-007': [244, 3, 1, 19.7], 'SV-008': [210, 2, 0, 18.2], 'SV-002': [84, 3, 1, 5.2] },
    'PR-01A': { 'SV-006': [940, 22, 6, 10.4], 'SV-008': [410, 6, 2, 19.2], 'SV-009': [320, 4, 1, 18.8], 'SV-005': [62, 1, 0, 40.2], 'SV-002': [96, 4, 1, 6.6] },
    'PR-01B': { 'SV-006': [610, 18, 5, 10.9], 'SV-008': [280, 4, 1, 19.0], 'SV-002': [70, 2, 1, 6.9] },
    'PR-02A': { 'SV-006': [820, 14, 3, 20.2], 'SV-008': [360, 5, 1, 19.4], 'SV-009': [240, 3, 0, 18.6] },
    'PR-03A': { 'SV-006': [700, 28, 12, 22.4], 'SV-008': [330, 9, 4, 21.8], 'SV-010': [40, 2, 1, 44.0] },
    'PR-03B': { 'SV-006': [180, 9, 5, 23.1], 'SV-008': [90, 3, 2, 22.6] },
    'PR-04A': { 'SV-001': [160, 4, 2, 21.2], 'SV-006': [210, 6, 2, 21.6], 'SV-008': [150, 3, 1, 20.8] },
    'PR-05A': { 'SV-006': [690, 12, 4, 17.8], 'SV-008': [300, 5, 1, 18.2], 'SV-009': [210, 3, 1, 18.0], 'SV-004': [120, 2, 0, 16.4] },
    'PR-06A': { 'SV-007': [220, 4, 1, 20.0], 'SV-008': [140, 2, 0, 19.1] },
    'PR-08A': { 'SV-001': [96, 2, 0, 20.4], 'SV-006': [80, 1, 0, 20.8] },
    'PR-09A': { 'SV-001': [70, 3, 2, 22.0], 'SV-008': [60, 2, 1, 21.7] }
  };
  // Live orders with an SLA clock (§30). ev: [state, 'YYYY-MM-DD HH:MM', reason?]
  D.SLA_ORDERS = [
    { id: 'ORD-2610-04123', prop: 'PR-07D', svc: 'SV-003', cat: L('Handuk kolam', 'Pool towels'), pri: 'high', kg: 18, ev: [['start', '2026-10-06 10:00']] },
    { id: 'ORD-2610-04118', prop: 'PR-07A', svc: 'SV-001', cat: L('Linen spa', 'Spa linen'), pri: 'normal', kg: 46, ev: [['start', '2026-10-05 15:10']] },
    { id: 'ORD-2610-04110', prop: 'PR-07C', svc: 'SV-007', cat: L('Linen spa', 'Spa linen'), pri: 'normal', kg: 38, ev: [['start', '2026-10-05 13:50'], ['pause', '2026-10-05 18:00', L('Menunggu konfirmasi noda dari klien', 'Waiting for client stain confirmation')], ['resume', '2026-10-06 08:00']] },
    { id: 'ORD-2610-04102', prop: 'PR-01A', svc: 'SV-006', cat: L('Linen kamar', 'Room linen'), pri: 'high', kg: 220, ev: [['start', '2026-10-06 01:40']] },
    { id: 'ORD-2610-04096', prop: 'PR-03A', svc: 'SV-006', cat: L('Linen kamar', 'Room linen'), pri: 'normal', kg: 160, ev: [['start', '2026-10-05 11:30']] },
    { id: 'ORD-2610-04090', prop: 'PR-05A', svc: 'SV-009', cat: L('Seragam', 'Uniforms'), pri: 'normal', kg: 0, pcs: 64, ev: [['start', '2026-10-05 17:00']] },
    { id: 'ORD-2610-04081', prop: 'PR-02A', svc: 'SV-006', cat: L('Linen kamar', 'Room linen'), pri: 'normal', kg: 180, ev: [['start', '2026-10-05 09:00'], ['complete', '2026-10-06 07:40']] },
    { id: 'ORD-2610-04077', prop: 'PR-07B', svc: 'SV-008', cat: L('Handuk', 'Towels'), pri: 'normal', kg: 52, ev: [['start', '2026-10-05 08:20'], ['complete', '2026-10-06 06:10']] }
  ];

  /* ---------- NP-07 Documents (§33–§34, §70) ---------- */
  function dc(id, n, type, cl, prop, ctr, v, date, eff, exp, by, status, file, share, notes) { return { id: id, n: n, type: type, cl: cl, prop: prop, ctr: ctr, v: v, date: date, eff: eff, exp: exp, by: by, status: status, file: file, share: !!share, notes: notes || '' }; }
  D.DOCS = [
    dc('DOC-0711', 'Kontrak Jaens Spa Group 2026', 'contract', 'CL-07', null, 'CTR-2026-001', 1, '2025-12-20', '2026-01-01', '2026-12-31', 'EMP-041', 'superseded', 'Kontrak_JaensSpa_2026_v1.pdf', true),
    dc('DOC-0712', 'Kontrak Jaens Spa Group 2026', 'contract', 'CL-07', null, 'CTR-2026-001', 2, '2026-06-24', '2026-07-01', '2026-12-31', 'EMP-041', 'active', 'Kontrak_JaensSpa_2026_v2.pdf', true, L('Termin Net 30 dan express Bisma', 'Net 30 terms and Bisma express')),
    dc('DOC-0713', 'Addendum Tarif Triloka', 'contract', 'CL-07', 'PR-07C', 'CTR-2025-022', 1, '2025-11-15', '2025-11-21', '2026-11-20', 'EMP-041', 'active', 'Addendum_Triloka_2025.pdf', true),
    dc('DOC-0714', 'Rate Card Jaens Spa 2026', 'ratecard', 'CL-07', null, 'CTR-2026-001', 2, '2025-12-12', '2026-01-01', '2026-12-31', 'EMP-041', 'active', 'RateCard_JaensSpa_2026.pdf', true),
    dc('DOC-0715', 'SLA Agreement Jaens Spa', 'sla', 'CL-07', null, 'CTR-2026-001', 1, '2025-12-10', '2026-01-01', '2026-12-31', 'EMP-041', 'active', 'SLA_JaensSpa_2026.pdf', true),
    dc('DOC-0716', 'Meeting Notes · Review Renewal', 'meeting', 'CL-07', null, 'CTR-2026-001', 1, '2026-09-28', null, null, 'EMP-041', 'active', 'MoM_JaensSpa_2026-09-28.pdf', false),
    dc('DOC-0717', 'Complaint Resolution · Shanti', 'complaint', 'CL-07', 'PR-07B', null, 1, '2026-02-12', null, null, 'EMP-041', 'active', 'Complaint_Shanti_CMP-0702.pdf', true),
    dc('DOC-0718', 'NPWP PT Jaens Spa Indonesia', 'tax', 'CL-07', null, null, 1, '2022-01-12', null, null, 'EMP-041', 'active', 'NPWP_JaensSpa.pdf', false),
    dc('DOC-0719', 'Proposal Super Express Center & Shanti', 'proposal', 'CL-07', null, null, 1, '2026-10-02', null, '2026-11-02', 'EMP-041', 'draft', 'Proposal_SuperExpress_Jaens.pdf', false),
    dc('DOC-0111', 'Kontrak Grand Vista 2025–2026', 'contract', 'CL-01', null, 'CTR-2025-014', 3, '2025-10-28', '2025-11-06', '2026-11-05', 'EMP-040', 'active', 'Kontrak_GrandVista_2025.pdf', true),
    dc('DOC-0112', 'Proposal Renewal Grand Vista 2026', 'proposal', 'CL-01', null, 'CTR-2025-014', 1, '2026-10-02', null, '2026-10-31', 'EMP-040', 'active', 'Proposal_GV_2026.pdf', false),
    dc('DOC-0211', 'Kontrak The Santai 2026', 'contract', 'CL-02', null, 'CTR-2026-002', 1, '2026-01-25', '2026-02-01', '2027-01-31', 'EMP-040', 'active', 'Kontrak_Santai_2026.pdf', true),
    dc('DOC-0311', 'Kontrak Kayana 2026 (v2)', 'contract', 'CL-03', null, 'CTR-2026-004', 2, '2026-06-18', '2026-07-01', '2027-02-28', 'EMP-041', 'active', 'Kontrak_Kayana_2026_v2.pdf', true),
    dc('DOC-0511', 'Kontrak Hotel ABC 2026', 'contract', 'CL-05', null, 'CTR-2025-031', 1, '2025-12-15', '2025-12-21', '2026-12-20', 'EMP-040', 'active', 'Kontrak_HotelABC_2026.pdf', true),
    dc('DOC-0512', 'Invoice Agreement Hotel ABC', 'invoiceagr', 'CL-05', null, 'CTR-2025-031', 1, '2025-12-15', '2025-12-21', null, 'EMP-040', 'active', 'InvoiceAgreement_ABC.pdf', true),
    dc('DOC-0611', 'Draft Kontrak Ubud Spa 2026–2027', 'contract', 'CL-06', null, 'CTR-2026-011', 1, '2026-10-01', '2026-11-01', '2027-10-31', 'EMP-041', 'draft', 'Draft_UbudSpa_2026.pdf', false),
    dc('DOC-0911', 'Quotation Renewal Villa Sari', 'quotation', 'CL-09', null, 'CTR-2025-020', 1, '2026-09-10', null, '2026-10-10', 'EMP-040', 'expired', 'Quotation_VillaSari.pdf', false),
    dc('DOC-1211', 'MoU Warung Segar', 'mou', 'CL-12', null, null, 1, '2026-09-25', null, null, 'EMP-041', 'draft', 'MoU_WarungSegar.pdf', false)
  ];

  /* ---------- Commercial timeline (§35–§36) ---------- */
  function tl(at, cl, ev, by, o) { return Object.assign({ at: at, cl: cl, ev: ev, by: by, from: null, to: null, reason: null, doc: null, rec: null, prop: null }, o || {}); }
  D.TIMELINE = [
    tl('2022-01-12 09:00', 'CL-07', 'CLIENT.CREATE', 'EMP-040', { to: 'Jaens Spa Group' }),
    tl('2025-06-01 10:00', 'CL-07', 'AM.CHANGE', 'EMP-050', { from: 'Ayu Lestari', to: 'Sari Dewi', reason: L('Pembagian portofolio spa', 'Spa portfolio split') }),
    tl('2025-11-10 14:00', 'CL-07', 'PROPOSAL.SENT', 'EMP-041', { doc: 'DOC-0711', reason: L('Proposal kontrak grup 2026', '2026 group contract proposal') }),
    tl('2025-11-15 09:30', 'CL-07', 'CONTRACT.SIGNED', 'EMP-041', { rec: 'CTR-2025-022', prop: 'PR-07C', doc: 'DOC-0713' }),
    tl('2025-12-12 10:30', 'CL-07', 'RATE.UPDATE', 'EMP-041', { rec: 'RC-07', from: 'SV-001 Rp 6.500', to: 'SV-001 Rp 7.000', reason: L('Penyesuaian biaya chemical dan energi', 'Chemical and energy cost adjustment'), doc: 'DOC-0714' }),
    tl('2025-12-20 14:00', 'CL-07', 'CONTRACT.SIGNED', 'EMP-041', { rec: 'CTR-2026-001', doc: 'DOC-0711' }),
    tl('2026-02-03 08:40', 'CL-07', 'COMPLAINT.OPEN', 'EMP-021', { prop: 'PR-07B', rec: 'CMP-0702', reason: L('Noda minyak pijat pada 14 handuk', 'Massage oil stains on 14 towels') }),
    tl('2026-02-12 16:00', 'CL-07', 'COMPLAINT.RESOLVE', 'EMP-021', { prop: 'PR-07B', rec: 'CMP-0702', doc: 'DOC-0717', reason: L('Rewash gratis dan SOP deterjen spa', 'Free rewash and spa detergent SOP') }),
    tl('2026-05-14 11:00', 'CL-07', 'SLA.REVIEW', 'EMP-010', { rec: 'SLA-07', reason: L('Review SLA semester', 'Half-year SLA review') }),
    tl('2026-06-24 11:20', 'CL-07', 'CONTRACT.VERSION', 'EMP-041', { rec: 'CTR-2026-001', from: 'v1 · Net 21', to: 'v2 · Net 30', reason: L('Termin Net 30, volume minimum naik dan express untuk Bisma', 'Net 30 terms, higher minimum volume and express for Bisma'), doc: 'DOC-0712' }),
    tl('2026-06-24 11:25', 'CL-07', 'TERMS.CHANGE', 'EMP-041', { rec: 'CTR-2026-001', from: 'Net 21', to: 'Net 30' }),
    tl('2026-08-18 10:00', 'CL-07', 'PAYMENT.ISSUE', 'EMP-030', { reason: L('Pembayaran Juli terlambat 9 hari', 'July payment 9 days late') }),
    tl('2026-09-28 15:00', 'CL-07', 'RENEWAL.DISCUSS', 'EMP-041', { rec: 'CTR-2026-001', doc: 'DOC-0716', reason: L('Review akun dan rencana kontrak 2027', 'Account review and 2027 contract plan') }),
    tl('2021-03-01 09:00', 'CL-01', 'CLIENT.CREATE', 'EMP-040', { to: 'Grand Vista Hotel' }),
    tl('2025-10-28 15:10', 'CL-01', 'CONTRACT.RENEWED', 'EMP-040', { rec: 'CTR-2025-014', from: 'v2', to: 'v3', doc: 'DOC-0111' }),
    tl('2026-10-02 09:00', 'CL-01', 'PROPOSAL.SENT', 'EMP-040', { rec: 'CTR-2025-014', doc: 'DOC-0112', reason: L('Proposal renewal 2026 dengan kenaikan tarif linen', '2026 renewal proposal with a linen rate increase') }),
    tl('2026-07-01 09:00', 'CL-03', 'PROPERTY.ADD', 'EMP-041', { prop: 'PR-03B', to: 'Kayana · Ubud Hideaway' }),
    tl('2026-09-02 10:00', 'CL-04', 'CREDIT.EXCEEDED', 'EMP-030', { from: 'Rp 120 jt', to: 'AR Rp 163 jt' }),
    tl('2026-09-10 11:00', 'CL-09', 'RENEWAL.DISCUSS', 'EMP-040', { rec: 'CTR-2025-020', doc: 'DOC-0911', reason: L('Klien minta diskon 10%', 'Client asked for a 10% discount') }),
    tl('2026-10-01 16:00', 'CL-06', 'CONTRACT.DRAFT', 'EMP-041', { rec: 'CTR-2026-011', doc: 'DOC-0611' }),
    tl('2026-09-20 10:00', 'CL-12', 'CLIENT.CREATE', 'EMP-041', { to: 'Warung Segar Sanur' })
  ];

  /* ---------- NP-08 Renewals (§37–§39). stage: upcoming · review · proposal · negotiation · approval · renewed ---------- */
  D.RENEWALS = [
    { ctr: 'CTR-2025-020', stage: 'negotiation', since: '2026-09-10', next: L('Putuskan permintaan diskon 10%', 'Decide on the 10% discount request'), follow: '2026-10-08', risk: 'high', opp: L('Tambah Towel Care untuk kamar baru', 'Add Towel Care for new rooms'), owner: 'EMP-040' },
    { ctr: 'CTR-2025-008', stage: 'approval', since: '2026-10-01', next: L('Persetujuan kontrak CTR-2026-011', 'Approve contract CTR-2026-011'), follow: '2026-10-09', risk: 'medium', opp: L('Super Express untuk paket spa', 'Super Express for spa packages'), owner: 'EMP-041' },
    { ctr: 'CTR-2025-014', stage: 'proposal', since: '2026-10-02', next: L('Presentasi proposal ke GM', 'Present the proposal to the GM'), follow: '2026-10-12', risk: 'medium', opp: L('Uniform Care untuk Tower B', 'Uniform Care for Tower B'), owner: 'EMP-040' },
    { ctr: 'CTR-2025-022', stage: 'review', since: '2026-09-28', next: L('Review volume dan tarif Triloka', 'Review Triloka volume and rate'), follow: '2026-10-14', risk: 'medium', opp: L('Gabungkan ke kontrak grup 2027', 'Merge into the 2027 group contract'), owner: 'EMP-041' },
    { ctr: 'CTR-2025-031', stage: 'upcoming', since: '2026-09-21', next: L('Jadwalkan review akun', 'Schedule account review'), follow: '2026-10-20', risk: 'low', opp: L('Premium Care untuk suite', 'Premium Care for suites'), owner: 'EMP-040' },
    { ctr: 'CTR-2026-001', stage: 'review', since: '2026-09-28', next: L('Siapkan proposal kontrak grup 2027', 'Prepare the 2027 group contract proposal'), follow: '2026-10-16', risk: 'low', opp: L('Super Express untuk Center dan Shanti', 'Super Express for Center and Shanti'), owner: 'EMP-041' },
    { ctr: 'CTR-2024-010', stage: 'negotiation', since: '2026-09-05', next: L('Kirim penawaran revisi', 'Send a revised offer'), follow: '2026-10-07', risk: 'high', opp: '', owner: 'EMP-040' }
  ];

  /* ---------- Approvals (§41). st: pending · approved · rejected · returned ---------- */
  D.APPROVALS = [
    { id: 'APC-001', kind: 'rate', cl: 'CL-01', prop: null, rec: 'RC-01', svc: 'SV-006', from: 8000, to: 8400, reason: L('Kenaikan biaya chemical 6% dan permintaan SLA 12 jam', 'Chemical cost up 6% and a 12-hour SLA request'), impact: 4.2 * JT, attach: 'Proposal_GV_2026.pdf', eff: '2026-11-06', by: 'EMP-040', at: '2026-10-02 09:30', st: 'pending' },
    { id: 'APC-002', kind: 'discount', cl: 'CL-09', prop: 'PR-09A', rec: 'RC-09', svc: 'SV-001', from: 0, to: 10, reason: L('Syarat renewal dari klien', 'Client renewal condition'), impact: -0.5 * JT, attach: 'Quotation_VillaSari.pdf', eff: '2026-10-22', by: 'EMP-040', at: '2026-09-12 10:00', st: 'pending' },
    { id: 'APC-003', kind: 'credit', cl: 'CL-04', prop: null, rec: 'CL-04', from: 120 * JT, to: 180 * JT, reason: L('Volume musim ramai, riwayat bayar 3 tahun', 'Peak-season volume, 3-year payment history'), impact: 60 * JT, attach: '', eff: '2026-10-10', by: 'EMP-030', at: '2026-10-03 14:00', st: 'pending' },
    { id: 'APC-004', kind: 'contract', cl: 'CL-06', prop: 'PR-06A', rec: 'CTR-2026-011', from: 'CTR-2025-008 v1', to: 'CTR-2026-011 v1', reason: L('Renewal 2026–2027 dengan Super Express', '2026–2027 renewal with Super Express'), impact: 3.1 * JT, attach: 'Draft_UbudSpa_2026.pdf', eff: '2026-11-01', by: 'EMP-041', at: '2026-10-01 16:10', st: 'pending' },
    { id: 'APC-005', kind: 'slaexc', cl: 'CL-03', prop: 'PR-03B', rec: 'SLA-STD-REG', from: '24', to: '30', reason: L('Akses jalan Ubud Hideaway, pickup Senin–Sabtu', 'Ubud Hideaway road access, Mon–Sat pickup'), impact: 0, attach: '', eff: '2026-10-15', by: 'EMP-010', at: '2026-10-04 09:00', st: 'pending' },
    { id: 'APC-006', kind: 'creditnote', cl: 'CL-05', prop: 'PR-05A', rec: 'INV-2609-052', from: 0, to: 1.5 * JT, reason: L('Klaim 3 sprei rusak, sudah diverifikasi QC', 'Claim for 3 damaged sheets, verified by QC'), impact: -1.5 * JT, attach: 'QC_Claim_ABC.jpg', eff: '2026-10-06', by: 'EMP-040', at: '2026-10-05 11:00', st: 'pending' },
    { id: 'APC-007', kind: 'special', cl: 'CL-07', prop: 'PR-07D', rec: 'CTR-2026-001', from: L('Pickup Minggu tidak tersedia', 'No Sunday pickup'), to: L('Pickup Minggu gratis', 'Free Sunday pickup'), reason: L('Volume akhir pekan Bisma naik 30%', 'Bisma weekend volume up 30%'), impact: -0.8 * JT, attach: '', eff: '2026-07-01', by: 'EMP-041', at: '2026-06-20 10:00', st: 'approved', revBy: 'EMP-050', revAt: '2026-06-22 09:00', note: L('Disetujui selama volume ≥ 1.500 kg', 'Approved while volume ≥ 1,500 kg') }
  ];

  /* ---------- Complaints & quality feed (§52) ---------- */
  D.COMPLAINTS = [
    { id: 'CMP-0702', cl: 'CL-07', prop: 'PR-07B', date: '2026-02-03', type: 'stain', st: 'resolved', claim: 0 },
    { id: 'CMP-0715', cl: 'CL-07', prop: 'PR-07C', date: '2026-09-22', type: 'late', st: 'open', claim: 0 },
    { id: 'CMP-0716', cl: 'CL-07', prop: 'PR-07C', date: '2026-09-29', type: 'damage', st: 'open', claim: 0.4 * JT },
    { id: 'CMP-0111', cl: 'CL-01', prop: 'PR-01A', date: '2026-09-14', type: 'lost', st: 'resolved', claim: 0.9 * JT },
    { id: 'CMP-0112', cl: 'CL-01', prop: 'PR-01B', date: '2026-10-01', type: 'late', st: 'open', claim: 0 },
    { id: 'CMP-0311', cl: 'CL-03', prop: 'PR-03A', date: '2026-09-03', type: 'late', st: 'resolved', claim: 0 },
    { id: 'CMP-0312', cl: 'CL-03', prop: 'PR-03B', date: '2026-09-18', type: 'damage', st: 'open', claim: 1.2 * JT },
    { id: 'CMP-0313', cl: 'CL-03', prop: 'PR-03A', date: '2026-09-26', type: 'stain', st: 'open', claim: 0 },
    { id: 'CMP-0511', cl: 'CL-05', prop: 'PR-05A', date: '2026-09-30', type: 'damage', st: 'resolved', claim: 1.5 * JT },
    { id: 'CMP-0911', cl: 'CL-09', prop: 'PR-09A', date: '2026-09-08', type: 'late', st: 'resolved', claim: 0 },
    { id: 'CMP-0912', cl: 'CL-09', prop: 'PR-09A', date: '2026-09-27', type: 'late', st: 'open', claim: 0 }
  ];
  // Complaints per month per client (13 months, same index as MONTHS)
  D.COMPLAINT_MONTH = {
    'CL-07': [2, 1, 2, 1, 1, 2, 1, 1, 1, 0, 1, 1, 2], 'CL-01': [3, 2, 3, 2, 2, 2, 1, 2, 2, 1, 2, 1, 2], 'CL-02': [1, 1, 0, 1, 1, 0, 1, 0, 1, 0, 1, 0, 0],
    'CL-03': [1, 1, 1, 2, 1, 1, 2, 1, 2, 2, 2, 3, 3], 'CL-04': [0, 1, 0, 0, 1, 0, 1, 0, 0, 1, 0, 1, 0], 'CL-05': [1, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 0, 1],
    'CL-06': [0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0], 'CL-08': [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0], 'CL-09': [0, 1, 0, 0, 1, 0, 0, 1, 0, 1, 1, 1, 2], 'CL-10': [1, 1, 2, 1, 2, 1, 2, 2, 1, 2, 1, 1, 0], 'CL-11': [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
  };

  /* ---------- NP-09 Billing per property (13 months). kg = base × (1 + g·i) × season; rev and cost per kg are blended. ---------- */
  var SEASON = [0.99, 0.97, 1.0, 1.12, 1.05, 0.93, 0.98, 1.0, 1.02, 1.05, 1.09, 1.04, 1.03];
  // [prop, baseKg, monthly growth, revPerKg, costPerKg, orders per 100kg, first active month index, service mix {svc: share}]
  D.BILLING_BASE = [
    ['PR-07A', 2900, 0.006, 7900, 5600, 1.1, 0, { 'SV-001': 0.45, 'SV-007': 0.35, 'SV-008': 0.2 }],
    ['PR-07B', 2750, 0.008, 7950, 5700, 1.1, 0, { 'SV-001': 0.4, 'SV-007': 0.4, 'SV-008': 0.2 }],
    ['PR-07C', 1850, -0.004, 7700, 6100, 1.2, 0, { 'SV-001': 0.45, 'SV-007': 0.35, 'SV-008': 0.2 }],
    ['PR-07D', 2400, 0.022, 8300, 5600, 1.2, 0, { 'SV-001': 0.35, 'SV-007': 0.3, 'SV-008': 0.2, 'SV-002': 0.15 }],
    ['PR-01A', 7300, 0.004, 8600, 6000, 0.6, 0, { 'SV-006': 0.6, 'SV-008': 0.2, 'SV-009': 0.1, 'SV-005': 0.04, 'SV-002': 0.06 }],
    ['PR-01B', 4600, 0.005, 8350, 6000, 0.6, 0, { 'SV-006': 0.7, 'SV-008': 0.22, 'SV-002': 0.08 }],
    ['PR-02A', 5900, 0.003, 8500, 6100, 0.6, 0, { 'SV-006': 0.65, 'SV-008': 0.25, 'SV-009': 0.1 }],
    ['PR-03A', 6200, -0.002, 8600, 6700, 0.6, 0, { 'SV-006': 0.65, 'SV-008': 0.3, 'SV-010': 0.05 }],
    ['PR-03B', 1700, 0.04, 8500, 7100, 0.7, 10, { 'SV-006': 0.65, 'SV-008': 0.35 }],
    ['PR-04A', 2600, 0.003, 8300, 6400, 0.8, 0, { 'SV-001': 0.3, 'SV-006': 0.4, 'SV-008': 0.3 }],
    ['PR-05A', 5200, 0.004, 8350, 6200, 0.6, 0, { 'SV-006': 0.6, 'SV-008': 0.2, 'SV-009': 0.12, 'SV-004': 0.08 }],
    ['PR-06A', 1900, 0.003, 8500, 6300, 1.0, 0, { 'SV-007': 0.65, 'SV-008': 0.35 }],
    ['PR-08A', 950, 0.005, 8000, 6000, 1.0, 0, { 'SV-001': 0.5, 'SV-006': 0.5 }],
    ['PR-09A', 760, -0.006, 7750, 6050, 1.0, 0, { 'SV-001': 0.55, 'SV-008': 0.45 }],
    ['PR-10A', 2100, -0.012, 8150, 6450, 0.8, 0, { 'SV-006': 0.6, 'SV-008': 0.4 }],
    ['PR-11A', 22, 0, 9800, 6200, 4.5, 0, { 'SV-001': 0.8, 'SV-005': 0.2 }]
  ];
  D.SEASON = SEASON;
  // Services added during the 13 months (month index they started). Before that their share is billed as the first service of the mix.
  D.SVC_START = { 'PR-07D|SV-002': 10, 'PR-01A|SV-005': 2, 'PR-01A|SV-002': 2, 'PR-01B|SV-002': 2 };
  // Kilogram-equivalent per piece for piece-priced services (volume and cost conversion).
  D.PCS_KG = { 'SV-005': 0.9, 'SV-009': 0.8, 'SV-010': 0.7 };
  // Direct cost factor per service against the property's blended cost per kg (express lines cost more).
  D.SVC_COST = { 'SV-002': 1.15, 'SV-003': 1.3, 'SV-005': 1.25, 'SV-009': 1.2, 'SV-010': 1.35, 'SV-004': 0.7 };
  // Properties whose billing stopped (month index). Bali Nest is on hold from October, after the last closed month.
  D.BILLING_STOP = {};
  // Payment behaviour feed from finance: average days paid after due date, last 6 months.
  D.PAY_DAYS = { 'CL-07': 4, 'CL-01': 2, 'CL-02': 6, 'CL-03': 21, 'CL-04': 38, 'CL-05': 3, 'CL-06': 5, 'CL-08': 1, 'CL-09': 12, 'CL-10': 26, 'CL-11': 0 };
  // Revenue targets per client per month (commercial plan)
  D.REV_TARGET = { 'CL-07': 82 * JT, 'CL-01': 102 * JT, 'CL-02': 50 * JT, 'CL-03': 70 * JT, 'CL-04': 22 * JT, 'CL-05': 44 * JT, 'CL-06': 16 * JT, 'CL-08': 7.6 * JT, 'CL-09': 6.2 * JT, 'CL-10': 16 * JT, 'CL-11': 0.2 * JT };

  // Open invoices of clients Phase 5 does not know yet; joined to the Phase 5 AR ledger on install (§50).
  D.AR_EXTRA = [
    { inv: 'INV-2610-071', cl: 'CL-07', amt: 84 * JT, issued: '2026-10-01', due: '2026-10-31' },
    { inv: 'INV-2609-071', cl: 'CL-07', amt: 79 * JT, issued: '2026-09-01', due: '2026-10-01' },
    { inv: 'INV-2610-081', cl: 'CL-08', amt: 7.4 * JT, issued: '2026-10-01', due: '2026-10-31' },
    { inv: 'INV-2609-091', cl: 'CL-09', amt: 5.9 * JT, issued: '2026-09-15', due: '2026-09-29' },
    { inv: 'INV-2610-091', cl: 'CL-09', amt: 6.0 * JT, issued: '2026-10-01', due: '2026-10-15' },
    { inv: 'INV-2608-101', cl: 'CL-10', amt: 15.2 * JT, issued: '2026-08-01', due: '2026-08-31' },
    { inv: 'INV-2609-101', cl: 'CL-10', amt: 14.8 * JT, issued: '2026-09-01', due: '2026-09-30' }
  ];

  /* ---------- Opportunities (§47–§48). stage: identified · qualified · proposal · negotiation · won · lost ---------- */
  D.OPPS = [
    { id: 'OPP-001', n: L('Super Express untuk Center & Shanti', 'Super Express for Center & Shanti'), cl: 'CL-07', prop: null, props: ['PR-07A', 'PR-07B'], type: 'superexpress', rev: 6.0 * JT, margin: 38, prob: 60, owner: 'EMP-041', next: L('Demo layanan ke Mila dan Putra', 'Service demo to Mila and Putra'), due: '2026-10-15', stage: 'proposal', notes: L('Proposal terkirim 2 Okt', 'Proposal sent on 2 Oct') },
    { id: 'OPP-002', n: L('Perpanjang addendum Triloka ke kontrak grup', 'Extend the Triloka addendum into the group contract'), cl: 'CL-07', prop: 'PR-07C', type: 'extension', rev: 4.5 * JT, margin: 22, prob: 70, owner: 'EMP-041', next: L('Review volume Triloka', 'Review Triloka volume'), due: '2026-10-14', stage: 'qualified' },
    { id: 'OPP-003', n: L('Uniform Care untuk Tower B', 'Uniform Care for Tower B'), cl: 'CL-01', prop: 'PR-01B', type: 'service', rev: 3.4 * JT, margin: 32, prob: 50, owner: 'EMP-040', next: L('Hitung volume seragam bersama HK', 'Count uniform volume with HK'), due: '2026-10-12', stage: 'qualified' },
    { id: 'OPP-004', n: L('Property baru Kayana Ubud Hideaway', 'New property Kayana Ubud Hideaway'), cl: 'CL-03', prop: 'PR-03B', type: 'property', rev: 14.5 * JT, margin: 18, prob: 100, owner: 'EMP-041', next: L('Stabilkan SLA pickup', 'Stabilise pickup SLA'), due: '2026-07-01', stage: 'won' },
    { id: 'OPP-005', n: L('Klien baru Warung Segar Sanur', 'New client Warung Segar Sanur'), cl: 'CL-12', prop: 'PR-12A', type: 'newclient', rev: 3.2 * JT, margin: 30, prob: 40, owner: 'EMP-041', next: L('Finalkan draft kontrak', 'Finalise the contract draft'), due: '2026-10-20', stage: 'negotiation' },
    { id: 'OPP-006', n: L('Premium Care untuk suite Hotel ABC', 'Premium Care for Hotel ABC suites'), cl: 'CL-05', prop: 'PR-05A', type: 'premium', rev: 2.8 * JT, margin: 40, prob: 30, owner: 'EMP-040', next: L('Kirim sampel hasil', 'Send result samples'), due: '2026-10-25', stage: 'identified' },
    { id: 'OPP-007', n: L('Express untuk Oceanview high season', 'Express for Oceanview high season'), cl: 'CL-04', prop: 'PR-04A', type: 'express', rev: 1.9 * JT, margin: 35, prob: 20, owner: 'EMP-040', next: L('Tunggu pembayaran AR lewat jatuh tempo', 'Wait for overdue AR payment'), due: '2026-11-01', stage: 'identified' },
    { id: 'OPP-008', n: L('Volume tambahan Bisma akhir pekan', 'Extra Bisma weekend volume'), cl: 'CL-07', prop: 'PR-07D', type: 'volume', rev: 4.4 * JT, margin: 34, prob: 80, owner: 'EMP-041', next: L('Konfirmasi kapasitas Minggu', 'Confirm Sunday capacity'), due: '2026-10-10', stage: 'negotiation' }
  ];

  if (typeof module !== 'undefined' && module.exports) module.exports = D;
  else root.JFCOMM_DATA = D;
})(typeof window !== 'undefined' ? window : this);
