/* ==========================================================================
   JFRESH OS — Go-Live engine seed data (Phase 12 · Engine B · JFGO)
   Only Phase-12-owned things live here: OLD-system staging rows for the
   migration (with deliberate problems), UAT cases, usability tests, pilot
   and parallel-run figures of the EXISTING process, incidents from the
   pilot, hypercare checklists, 30/60/90 reviews, backlog and release plans.
   Everything that describes the business today (clients, orders, AR, users…)
   is read live from the owner engines by jfos-go.js — never copied here.
   ========================================================================== */
(function (root) {
  var D = { simNow: '2026-10-06 10:30', today: '2026-10-06', legacy: 'Legacy Excel + Accurate 5 (2019–2026)' };

  /* ---------- NP-06 §30 migration sources. [key, id label, en label, owner engine, target, finance-impacting, kind] ---------- */
  D.SOURCES = [
    ['clients', 'Klien', 'Clients', 'JFCOMM', 'cm.client', false, 'master'],
    ['properties', 'Properti', 'Properties', 'JFCOMM', 'cm.property', false, 'master'],
    ['contacts', 'Kontak', 'Contacts', 'JFCOMM', 'cm.contact', false, 'master'],
    ['contracts', 'Kontrak', 'Contracts', 'JFCOMM', 'cm.contract', false, 'master'],
    ['rates', 'Rate Card', 'Rates', 'JFCOMM', 'cm.rate', false, 'master'],
    ['items', 'Item', 'Items', 'JFFIN', 'fn.item', false, 'master'],
    ['weights', 'Berat Item', 'Item Weights', 'JFFIN', 'fn.weight', false, 'master'],
    ['hpp', 'HPP', 'HPP', 'JFFIN', 'fn.hpp', true, 'master'],
    ['pricelist', 'Price List', 'Price List', 'JFFIN', 'fn.price', false, 'master'],
    ['suppliers', 'Supplier', 'Suppliers', 'JFFIN', 'fn.supplier', false, 'master'],
    ['inventory', 'Persediaan', 'Inventory', 'JFFIN', 'fn.stock', true, 'opening'],
    ['assets', 'Aset', 'Assets', 'JFFIN', 'fn.asset', true, 'opening'],
    ['users', 'User', 'Users', 'JFACCESS', 'x.user', false, 'master'],
    ['ar', 'Piutang (AR)', 'Receivables (AR)', 'JFFIN', 'fn.invoice', true, 'opening'],
    ['ap', 'Hutang (AP)', 'Payables (AP)', 'JFFIN', 'fn.expense', true, 'opening'],
    ['cash', 'Kas', 'Cash', 'JFFIN', 'fn.cashacc', true, 'opening'],
    ['bank', 'Bank', 'Bank', 'JFFIN', 'fn.cashacc', true, 'opening'],
    ['opentx', 'Transaksi Terbuka', 'Open Transactions', 'JFLOG', 'lg.order', false, 'open']
  ];

  /* ---------- OLD-system rows (as exported from the legacy files, problems included) ---------- */
  D.OLD = {
    clients: [
      { code: 'C-001', name: 'GRAND VISTA HOTEL', tax: '02.345.678.9-902.000', city: 'Badung', status: 'aktif' },
      { code: 'C-002', name: 'Grand Vista Hotel Bali', tax: '02.345.678.9-902.000', city: 'Badung', status: 'aktif' },
      { code: 'C-003', name: 'The Santai Hotel', tax: '03.456.789.0-903.000', city: 'Badung', status: 'aktif' },
      { code: 'C-004', name: 'Kayana Resort & Spa', tax: '04.567.890.1-904.000', city: 'Gianyar', status: 'aktif' },
      { code: 'C-005', name: 'Oceanview Villa', tax: '', city: 'Badung', status: 'aktif' },
      { code: 'C-006', name: 'hotel abc', tax: '06.789.012.3-906.000', city: 'Denpasar', status: 'aktif' },
      { code: 'C-007', name: 'Jaens Spa Group', tax: '01.234.567.8-901.000', city: 'Badung', status: 'aktif' },
      { code: 'C-008', name: 'Pondok Impian', tax: '08.901.234.5-908.000', city: 'Gianyar', status: 'aktif' },
      { code: 'C-009', name: 'Sanur Beach Villas', tax: '11.222.333.4-911.000', city: 'Denpasar', status: 'aktif' },
      { code: 'C-010', name: 'Hotel Lama Kuta', tax: '', city: 'Badung', status: 'tutup 2023' },
      { code: 'C-011', name: '', tax: '12.000.111.2-912.000', city: 'Denpasar', status: 'aktif' }
    ],
    properties: [
      { code: 'P-01', name: 'Grand Vista Tower A', client: 'C-001', city: 'Badung' },
      { code: 'P-02', name: 'Kayana Villas', client: 'C-004', city: 'Gianyar' },
      { code: 'P-03', name: 'Jaens Spa Bisma', client: 'C-007', city: 'Gianyar' },
      { code: 'P-04', name: 'Sanur Beach Main', client: 'C-009', city: 'Denpasar' },
      { code: 'P-05', name: 'Villa X Canggu', client: 'C-099', city: 'Badung' }
    ],
    contacts: [
      { name: 'Ibu Sari Wulandari', email: 'sari@grandvista.id', client: 'C-001' },
      { name: 'Bpk Arya Wijaya', email: 'arya@jaensspa.com', client: 'C-007' },
      { name: 'Ni Luh Putri', email: 'finance@jaensspa.com', client: 'C-007' },
      { name: 'Dewa Ketut', email: 'dewa@@sanurbeach', client: 'C-009' }
    ],
    contracts: [
      { no: 'CTR-2025-014', client: 'C-001', start: '2025-01-01', end: '2026-12-31' },
      { no: 'CTR-2026-001', client: 'C-007', start: '2026-01-01', end: '2026-12-31' },
      { no: 'KTR/LAMA/2019/03', client: 'C-010', start: '2019-03-01', end: '2019-02-30' }
    ],
    rates: [
      { client: 'C-001', svc: 'SV-006', unit: 'kg', rate: 8000 },
      { client: 'C-007', svc: 'SV-007', unit: 'kg', rate: 9000 },
      { client: 'C-006', svc: 'SV-008', unit: 'lusin', rate: 96000 }
    ],
    items: [
      { name: 'Bath Towel', unit: 'kg' }, { name: 'bath towel', unit: 'KG' }, { name: 'BATH TOWEL', unit: 'Kg' },
      { name: 'Handuk Tangan', unit: 'kg' }, { name: 'Sprei King', unit: 'kg' }, { name: 'King Bed Sheet ', unit: 'kg' },
      { name: 'Pillow Case', unit: 'Pcs' }, { name: 'Taplak Lama Motif Batik', unit: 'kg', obsolete: true }, { name: 'Bath Mat', unit: 'lusin' }
    ],
    weights: [
      { item: 'Bath Towel', w: 600, unit: 'g' }, { item: 'Hand Towel', w: 0.2, unit: 'kg' }, { item: 'Sprei King', w: -1, unit: 'kg' }
    ],
    hpp: [
      { period: '2026-07', perKg: 5160 }, { period: '2026-08', perKg: 5185 }, { period: '2026-13', perKg: 5200 }
    ],
    pricelist: [
      { svc: 'SV-006', price: 8500, eff: '2025-07-01' }, { svc: 'SV-008', price: 8000, eff: '2025-07-01' }, { svc: 'SV-099', price: 9900, eff: '2025-07-01' }
    ],
    suppliers: [
      { name: 'PT. Ecolab Indonesia', city: 'Denpasar' }, { name: 'ECOLAB INDONESIA', city: 'Denpasar' }, { name: 'Bali Linen Supply', city: 'Denpasar' },
      { name: 'CV Kemasan Dewata', city: 'Denpasar' }, { name: 'Toko Baru Kimia', city: 'Gianyar' }
    ],
    inventory: [["CHM-DET-01", "Detergen Cair Ecolab Turbo", "L", 410, 36500], ["CHM-DET-02", "Detergen Bubuk Sumber Kimia", "kg", 140, 21800], ["CHM-SFT-01", "Softener Ecolab Soft", "L", 268, 28400], ["CHM-BLC-01", "Bleach Oksigen", "L", 62, 24600], ["CHM-STN-01", "Stain Remover Diversey", "L", 46, 96000], ["CHM-ALK-01", "Booster Alkali", "L", 0, 31200], ["CHM-NTR-01", "Neutralizer Sour", "L", 88, 33800], ["CHM-DET-03", "Detergen Cair Plant Gianyar", "L", 236, 36500], ["PKG-PLS-01", "Plastik Kemasan 60×90", "pcs", 9910, 620], ["PKG-PLS-02", "Plastik Kemasan 40×60", "pcs", 3600, 410], ["PKG-LBL-01", "Label Thermal QR", "roll", 32, 48000], ["PKG-BAG-01", "Laundry Bag Kain", "pcs", 410, 38000], ["PKG-TAG-01", "Tag Seragam", "pcs", 2300, 120], ["SPR-BLT-01", "V-Belt Dryer", "pcs", 7, 385000], ["SPR-BRG-01", "Bearing Drum Washer", "pcs", 4, 1450000], ["SPR-SNS-01", "Sensor Kelembapan Dryer", "pcs", 0, 2850000], ["SPR-SEL-01", "Karet Pintu Washer", "pcs", 2, 920000], ["CNS-GLV-01", "Sarung Tangan Nitril", "box", 44, 68000], ["CNS-MSK-01", "Masker Medis", "box", 22, 42000], ["OFC-PPR-01", "Kertas A4", "rim", 18, 52000], ["OTH-HNG-01", "Hanger Plastik", "pcs", 1240, 1800]]
      .map(function (r) { return { code: r[0], name: r[1], unit: r[2], qty: r[3], avg: r[4] }; }),
    assets: [["AST-W01", "EX60-21-0391", "Washer Extractor 60 kg", 420000000, 212100000], ["AST-W02", "EX60-21-0392", "Washer Extractor 60 kg", 420000000, 212100000], ["AST-W03", "GB30-19-1177", "Washer Extractor 30 kg", 210000000, 38718750], ["AST-W04", "EX100-23-0088", "Washer Extractor 100 kg", 780000000, 563550000], ["AST-D01", "TD50-21-0510", "Tumble Dryer 50 kg", 260000000, 99125000], ["AST-D02", "TD50-21-0511", "Tumble Dryer 50 kg", 260000000, 99125000], ["AST-D03", "SQ30-18-2201", "Tumble Dryer 30 kg", 150000000, 15000000], ["AST-D04", "TD80-24-0031", "Tumble Dryer 80 kg", 420000000, 309750000], ["AST-D05", "GBD50-19-0420", "Tumble Dryer 50 kg", 240000000, 51000000], ["AST-FL01", "KG-FL-22-071", "Flatwork Ironer Line 1", 950000000, 551000000], ["AST-FL02", "TV-PF-22-118", "Meja Press & Lipat", 120000000, 57000000], ["AST-IR01", "SL-IR-23-401", "Steam Iron 1", 18000000, 5100000], ["AST-IR02", "SL-IR-23-402", "Steam Iron 2", 18000000, 5100000], ["AST-BL01", "MR-BL-21-055", "Boiler Uap 300 kg/jam", 380000000, 191900000], ["AST-WF01", "PF-WF-21-310", "Water Filter & Softener", 95000000, 36218750], ["AST-IP01", "BF-IP-21-009", "IPAL", 310000000, 156550000], ["AST-JF01", "MHF-22-01843", "Van JF-01 (DK 1234 AB)", 360000000, 105600000], ["AST-JF02", "MHF-21-00912", "Van JF-02 (DK 5678 CD)", 340000000, 68000000], ["AST-JF03", "MMB-23-04411", "Pickup JF-03 (DK 9012 EF)", 240000000, 99200000], ["AST-JF04", "MHY-24-00377", "Pickup JF-04 (DK 3456 GH)", 210000000, 126000000], ["AST-JF05", "MHK-19-02210", "Van JF-05 (DK 7788 IJ)", 300000000, 60000000], ["AST-REN01", "", "Renovasi Plant Ubud", 900000000, 405000000], ["AST-REN02", "", "Renovasi Plant Gianyar", 650000000, 373749983], ["AST-EQ01", "", "Rak & Troli Linen", 85000000, 12749983], ["AST-IT01", "IT-24-001", "Komputer, Tablet & Server", 120000000, 40000000], ["AST-EQ02", "MT-23-0660", "Timbangan Digital (6 unit)", 36000000, 12000000]]
      .map(function (r) { return { code: r[0], serial: r[1], name: r[2], cost: r[3], nbv: r[4] }; }),
    users: [
      { u: 'made', email: 'made@jfreshlaundry.app', name: 'Made Wirana' }, { u: 'budi', email: 'budi@jfreshlaundry.app', name: 'Budi Santoso' },
      { u: 'BUDI.S', email: 'BUDI@JFRESHLAUNDRY.APP', name: 'BUDI SANTOSO' }, { u: 'ex.staff', email: 'ex.staff@jfresh.co.id', name: 'Mantan Staf', obsolete: true },
      { u: 'new.cashier', email: 'kasir.gianyar@jfreshlaundry.app', name: 'Kasir Gianyar' }
    ],
    // Old AR (open invoices in Accurate on 5 Oct 2026). INV-2605-009 never reached JFFIN: a visible difference.
    ar: [["INV-2606-031", "C-005", "2026-06-25", 41000000], ["INV-2607-031", "C-005", "2026-07-20", 58000000], ["INV-2608-031", "C-005", "2026-08-15", 64000000], ["INV-2608-019", "C-004", "2026-08-28", 131000000], ["INV-2609-020", "C-004", "2026-09-18", 142000000], ["INV-2609-031", "C-003", "2026-09-25", 88000000], ["INV-2609-060", "C-012", "2026-09-30", 35000000], ["INV-2609-074", "C-007", "2026-09-30", 1736150], ["INV-2609-044", "C-001", "2026-10-05", 172000000], ["INV-2609-052", "C-006", "2026-10-08", 71000000], ["INV-2610-003", "C-006", "2026-10-15", 76000000], ["INV-2610-072", "C-007", "2026-10-25", 4329000], ["INV-2610-001", "C-001", "2026-10-31", 186000000], ["INV-2610-002", "C-003", "2026-10-31", 94000000], ["INV-2610-004", "C-012", "2026-10-31", 38000000], ["INV-2610-071", "C-007", "2026-10-31", 8158500], ["INV-2605-009", "C-005", "2026-05-31", 2000000]]
      .map(function (r) { return { inv: r[0], client: r[1], due: r[2], open: r[3] }; }),
    // Old AP: the legacy file holds supplier invoice TMB-2610-044 once; JFFIN has it on EXP-2610-002 and EXP-2610-010.
    ap: [["BLS/IX/0921", "Bali Linen Supply", 18000000], ["TMB-2610-044", "PT Teknik Mesin Bali", 10130000], ["PFC-0926-77", "Pertamina Fleet Card", 14000000], ["BPJS-2609", "BPJS", 28000000], ["ECL/INV/26/09871", "PT Ecolab Indonesia", 32716000], ["RMB-2610-03", "Reimburse staf", 1350000], ["SPT-2609", "Pajak", 74000000], ["5512 0098 7734/09", "PLN UP3 Bali Timur", 48000000], ["PDAM-GNY-0926", "Perumda Air Gianyar", 9000000], ["KD/2610/118", "CV Kemasan Dewata", 5190000]]
      .map(function (r) { return { ref: r[0], supplier: r[1], open: r[2] }; }),
    cash: [{ acc: 'ACC-05', name: 'Kas Main Plant Ubud', bal: 18500000 }, { acc: 'ACC-06', name: 'Kas Plant Gianyar', bal: 9200000 }, { acc: 'ACC-07', name: 'Petty Cash', bal: 6000000 }],
    bank: [{ acc: 'ACC-01', name: 'BCA Operasional', bal: 1240000000 }, { acc: 'ACC-02', name: 'BCA Payroll', bal: 420000000 }, { acc: 'ACC-03', name: 'Mandiri Operasional', bal: 610000000 }, { acc: 'ACC-04', name: 'BNI Deposito Jaminan', bal: 300000000 }],
    opentx: [
      { ref: 'SO-OLD-5531', client: 'C-007', prop: 'P-03', kind: 'pickup', date: '2026-10-06', bags: 6 },
      { ref: 'SO-OLD-5540', client: 'C-009', prop: 'P-04', kind: 'pickup', date: '2026-10-09', bags: 4 },
      { ref: 'SO-OLD-5541', client: 'C-001', prop: 'P-01', kind: 'pickup', date: '2026-09-31', bags: 5 }
    ]
  };
  // Legacy client code → master id hints (the old system used its own codes; names decide, these only confirm).
  D.LEGACY_CLIENT = { 'C-001': 'CL-01', 'C-002': 'CL-01', 'C-003': 'CL-02', 'C-004': 'CL-03', 'C-005': 'CL-04', 'C-006': 'CL-05', 'C-007': 'CL-07', 'C-008': 'CL-08', 'C-012': 'CL-06' };

  /* ---------- NP-08 UAT (§44–§49). [id, group, role, user, module, scenario id, en, steps, expected, device, severity, status, actual, evidence[]] ---------- */
  D.UAT = [
    ['UT-001', 'team1', 'prod1', 'putu', 'Produksi', 'Terima & timbang linen dari pickup', 'Receive & weigh linen from a pickup', 'Buka RCV → pilih manifest → timbang → simpan', 'Berat net tersimpan, label batch tercetak', 'mobile', 'high', 'pass', 'Sesuai', ['foto-timbang-ut001.jpg']],
    ['UT-002', 'team1', 'prod1', 'putu', 'Produksi', 'Sortir & buat batch', 'Sort & create a batch', 'Sortir per kategori → buat batch → KIRIM handover ke Team 2', 'Batch terbentuk, handover menunggu Team 2', 'mobile', 'medium', 'pass', 'Sesuai', []],
    ['UT-003', 'team2', 'prod2', 'arta', 'Produksi', 'Jalankan mesin cuci & pengering', 'Run washer & dryer', 'Terima handover → pilih mesin → mulai → selesai', 'Waktu mesin tercatat, overload diperingatkan', 'ipad', 'high', 'pass', 'Sesuai', ['video-ut003.mp4']],
    ['UT-004', 'team2', 'prod2', 'arta', 'Produksi', 'Rewash karena noda', 'Rewash for stains', 'QC tandai noda → rewash → ulangi QC', 'Batch kembali ke antrean cuci', 'ipad', 'medium', 'blocked', 'Mesin W-04 dalam perawatan, skenario ditunda', []],
    ['UT-005', 'team3', 'prod3', 'luh', 'Produksi', 'QC, packing & release ke logistik', 'QC, packing & release to logistics', 'QC lulus → packing → RELEASE KE LOGISTICS', 'Packing tidak bisa sebelum QC lulus', 'mobile', 'critical', 'pass', 'Tombol packing terkunci sampai QC lulus', ['foto-qc-ut005.jpg']],
    ['UT-006', 'team3', 'prod3', 'luh', 'Produksi', 'Handover ke driver', 'Handover to the driver', 'Scan paket → konfirmasi jumlah → tanda tangan', 'Jumlah paket cocok', 'mobile', 'medium', 'pass', 'Sesuai', []],
    ['UT-007', 'logistics', 'driver', 'ketut', 'Logistik', 'Pickup dengan bukti foto', 'Pickup with photo evidence', 'Buka tugas → tiba → foto → jumlah bag → selesai', 'Order pindah ke atplant, bukti lengkap', 'mobile', 'high', 'pass', 'Sesuai', ['foto-pickup-ut007.jpg']],
    ['UT-008', 'logistics', 'driver', 'ketut', 'Delivery', 'POD dengan tanda tangan klien', 'POD with client signature', 'Tiba → serahkan → tanda tangan → foto', 'POD tersimpan dan terkunci', 'mobile', 'critical', 'retest', 'Sinyal lemah: POD tersimpan offline, perlu dites ulang setelah sinkron', []],
    ['UT-009', 'finance', 'finance', 'budi', 'Finance', 'Buat invoice dari billing ready', 'Create an invoice from billing ready', 'Pilih billing ready → BUAT INVOICE → submit', 'Invoice draft dengan PPN 11%', 'desktop', 'high', 'pass', 'Sesuai', ['inv-draft-ut009.pdf']],
    ['UT-010', 'finance', 'finance', 'budi', 'Finance', 'Peringatan pembayaran ganda', 'Duplicate payment warning', 'Catat pembayaran yang sama dua kali di iPad', 'Sistem memperingatkan pembayaran ganda', 'ipad', 'critical', 'fail', 'Di iPad peringatan tertutup keyboard, pembayaran kedua hampir tersimpan', ['screenshot-ut010.png']],
    ['UT-011', 'supply', 'supply', 'rai', 'Supply', 'Purchase request bahan kimia', 'Chemical purchase request', 'Buat PR → submit → cek status', 'PR menunggu persetujuan', 'desktop', 'medium', 'pass', 'Sesuai', []],
    ['UT-012', 'supply', 'supply', 'rai', 'Supply', 'Penerimaan barang (GRN)', 'Goods receipt (GRN)', 'Pilih PO → terima qty → simpan', 'Stok bertambah, jurnal GRN', 'ipad', 'high', 'retest', 'Qty parsial salah dibulatkan, sudah diperbaiki', []],
    ['UT-013', 'management', 'owner', 'aji', 'Manajemen', 'Dashboard eksekutif & persetujuan', 'Executive dashboard & approvals', 'Buka dashboard → buka persetujuan → setujui', 'Angka sama dengan Finance', 'desktop', 'high', 'pass', 'Sesuai', []],
    ['UT-014', 'management', 'owner', 'aji', 'Manajemen', 'Go/No-Go di iPad', 'Go/No-Go on iPad', 'Buka LIVE-004 di iPad', 'Skor & gate terbaca jelas', 'ipad', 'medium', 'pass', 'Sesuai', []],
    ['UT-015', 'client', 'client', 'arya.jaens', 'Portal Klien', 'Request pickup dari portal', 'Request a pickup from the portal', 'Pilih properti → layanan → jumlah → kirim', 'Order masuk dispatcher dengan sumber client', 'mobile', 'high', 'pass', 'Sesuai', ['foto-ut015.jpg']],
    ['UT-016', 'client', 'client', 'arya.jaens', 'Portal Klien', 'Klien hanya melihat outlet sendiri', 'Client only sees its own outlets', 'Login → cek daftar invoice & properti', 'Tidak ada data klien lain', 'mobile', 'critical', 'pass', 'Hanya CL-07', []]
  ];
  D.UAT_GROUPS = [['team1', 'Team 1', 'Team 1'], ['team2', 'Team 2', 'Team 2'], ['team3', 'Team 3', 'Team 3'], ['logistics', 'Logistik', 'Logistics'], ['finance', 'Finance', 'Finance'], ['supply', 'Supply', 'Supply'], ['management', 'Manajemen', 'Management'], ['client', 'Klien', 'Client']];
  // Usability §48: [id, user, task id, task en, device, target sec, time sec, taps, errors, questions, help used, difficulty 1-5]
  D.USABILITY = [
    ['USB-01', 'putu', 'Timbang & simpan receiving', 'Weigh & save a receiving', 'mobile', 90, 84, 9, 0, 0, false, 2, 'PROD-RCV-001'],
    ['USB-02', 'arta', 'Pilih mesin & mulai cuci', 'Pick a machine & start washing', 'ipad', 60, 71, 7, 1, 0, false, 2, 'PROD-WASH-001'],
    ['USB-03', 'luh', 'Packing setelah QC', 'Packing after QC', 'mobile', 60, 118, 14, 2, 2, true, 4, 'PROD-PACK-001'],
    ['USB-04', 'ketut', 'Tanda tangan POD', 'POD signature', 'mobile', 45, 52, 6, 0, 1, false, 2, 'DLV-POD-001'],
    ['USB-05', 'budi', 'Buat invoice dari billing ready', 'Create an invoice from billing ready', 'desktop', 120, 205, 22, 1, 3, true, 4, 'AR-001'],
    ['USB-06', 'arya.jaens', 'Request pickup', 'Request a pickup', 'mobile', 60, 49, 8, 0, 0, false, 1, 'CLP-003']
  ];

  /* ---------- NP-10 pilot & parallel run (§66–§67). Existing-process figures from the legacy run sheets. ---------- */
  D.PILOT = { id: 'PLT-2610', clients: ['CL-07', 'CL-01'], props: ['PR-07A', 'PR-07B', 'PR-01A'], shifts: ['Pagi 06:00–14:00'], teams: ['t1', 't2', 't3'], from: '2026-10-01', to: '2026-10-14', st: 'running' };
  D.PARALLEL_OLD = { orders: 8, weight: 209.5, production: 207.6, delivery: 5, invoice: 198487500, inventory: 85589000, cash: 2603700000 };

  /* ---------- Incidents from the pilot (§90–§92) ---------- */
  D.INCIDENTS = [
    { id: 'INC-0001', at: '2026-10-03 08:20', by: 'USR-101', role: 'prod1', module: 'production', screen: 'RCV-001', problem: ['Label QR tidak tercetak di printer Plant Gianyar', 'QR label not printing on the Gianyar plant printer'], sev: 'medium', kind: 'other', evidence: ['foto-printer.jpg'], owner: 'USR-121', st: 'investigate', rc: null, fix: null, rel: null },
    { id: 'INC-0002', at: '2026-10-04 15:05', by: 'USR-002', role: 'driver', module: 'logistics', screen: 'DRV-001', problem: ['ETA driver tidak update saat sinyal lemah', 'Driver ETA does not update on a weak signal'], sev: 'high', kind: 'other', evidence: [], owner: 'USR-121', st: 'fix', rc: ['Sinkron lokasi menunggu koneksi penuh', 'Location sync waits for a full connection'], fix: null, rel: 'v1.0.0' },
    { id: 'INC-0003', at: '2026-10-02 10:40', by: 'USR-030', role: 'finance', module: 'finance', screen: 'AR-001', problem: ['Filter aging tidak menyimpan pilihan', 'Aging filter does not keep the selection'], sev: 'low', kind: 'other', evidence: [], owner: 'USR-121', st: 'closed', rc: ['State filter tidak disimpan', 'Filter state was not stored'], fix: ['Simpan filter per user', 'Store the filter per user'], rel: 'v0.9.4' }
  ];

  /* ---------- Hypercare (§89): [day, key, id, en] ---------- */
  D.HYPERCARE = [
    [1, 'login', 'Semua key user berhasil login', 'All key users signed in'], [1, 'orders', 'Order pertama mengalir pickup → plant', 'First orders flow pickup → plant'], [1, 'receiving', 'Receiving & timbang pertama', 'First receiving & weighing'], [1, 'warroom', 'War room stand-up 08:00 & 17:00', 'War room stand-up 08:00 & 17:00'], [1, 'integ', 'Monitoring integrasi aktif', 'Integration monitoring active'],
    [3, 'invoice', 'Invoice pertama terbit', 'First invoices issued'], [3, 'pod', 'Delivery & POD pertama lengkap', 'First deliveries & PODs complete'], [3, 'incident', 'Review insiden harian', 'Daily incident review'],
    [7, 'kpi', 'KPI mingguan pertama', 'First weekly KPI'], [7, 'training', 'Gap training ditutup', 'Training gaps closed'], [7, 'backlog', 'Triage backlog', 'Backlog triage'],
    [14, 'billing', 'Siklus billing pertama', 'First billing cycle'], [14, 'portal', 'Adopsi portal klien dicek', 'Client portal adoption checked'],
    [30, 'review', 'Siap review 30 hari', 'Ready for the 30-day review'], [30, 'stable', 'Sign-off stabilisasi', 'Stabilization sign-off']
  ];

  /* ---------- NP-12 (§98–§108) ---------- */
  D.REVIEWS = [
    { id: 'RVW-30', day: 30, focus: ['STABILIZE', 'STABILIZE'], topics: [['Bug', 'Bugs'], ['Adopsi', 'Adoption'], ['Training', 'Training'], ['Kualitas data', 'Data Quality'], ['Friksi operasional', 'Operational friction']] },
    { id: 'RVW-60', day: 60, focus: ['OPTIMIZE', 'OPTIMIZE'], topics: [['Workflow', 'Workflow'], ['Otomasi', 'Automation'], ['Kecepatan', 'Speed'], ['Konfigurasi role', 'Role Configuration'], ['KPI', 'KPI'], ['Reporting', 'Reporting'], ['Smart Help', 'Smart Help']] },
    { id: 'RVW-90', day: 90, focus: ['SCALE', 'SCALE'], topics: [['Portal klien', 'Client Portal'], ['Decision Intelligence', 'Decision Intelligence'], ['Kapasitas', 'Capacity'], ['Finance', 'Finance'], ['Otomasi', 'Automation'], ['Kesiapan scale-up', 'Scale-Up readiness']] }
  ];
  D.BACKLOG = [
    { id: 'BKL-001', problem: ['Peringatan pembayaran ganda tertutup keyboard di iPad', 'Duplicate payment warning hidden by the iPad keyboard'], module: 'finance', impact: ['Risiko pembayaran ganda', 'Duplicate payment risk'], pri: 'P0', owner: 'USR-121', effort: 'S', rel: 'v1.0.0', st: 'in_progress', src: 'UT-010' },
    { id: 'BKL-002', problem: ['Packing setelah QC butuh 14 tap', 'Packing after QC needs 14 taps'], module: 'production', impact: ['Team 3 lambat & bingung', 'Team 3 slow & confused'], pri: 'P1', owner: 'USR-121', effort: 'M', rel: 'v1.0.0', st: 'planned', src: 'USB-03' },
    { id: 'BKL-003', problem: ['Buat invoice dari billing ready terlalu panjang', 'Creating an invoice from billing ready is too long'], module: 'finance', impact: ['Billing cycle lebih lama', 'Longer billing cycle'], pri: 'P1', owner: 'USR-030', effort: 'M', rel: 'v1.1.0', st: 'planned', src: 'USB-05' },
    { id: 'BKL-004', problem: ['ETA driver saat sinyal lemah', 'Driver ETA on a weak signal'], module: 'logistics', impact: ['Klien tidak tahu posisi driver', 'Clients cannot see the driver'], pri: 'P1', owner: 'USR-121', effort: 'M', rel: 'v1.0.0', st: 'in_progress', src: 'INC-0002' },
    { id: 'BKL-005', problem: ['Ekspor laporan KPI ke PDF', 'Export KPI report to PDF'], module: 'reporting', impact: ['Laporan direksi manual', 'Manual board reports'], pri: 'P2', owner: 'USR-050', effort: 'M', rel: 'v1.1.0', st: 'new', src: null },
    { id: 'BKL-006', problem: ['Mode gelap untuk shift malam', 'Dark mode for the night shift'], module: 'ux', impact: ['Kenyamanan mata', 'Eye comfort'], pri: 'P3', owner: null, effort: 'L', rel: null, st: 'new', src: null }
  ];
  D.RELEASE_PLANS = [
    { id: 'RPL-100', version: 'v1.0.0', n: ['Rilis produksi awal', 'Initial production release'], major: true, target: '2026-10-30', done: ['build', 'qa', 'regression'],
      rb: { version: 'v1.0.0-rc', db: ['Restore snapshot SNP terakhir + backup harian 02:00', 'Restore the latest SNP snapshot + daily 02:00 backup'], owner: 'USR-121', comm: ['WA grup key user + banner aplikasi', 'Key-user WA group + in-app banner'], validation: ['Smoke test login, order, receiving, invoice', 'Smoke test login, order, receiving, invoice'] } },
    { id: 'RPL-110', version: 'v1.1.0', n: ['Optimasi pasca go-live', 'Post go-live optimisation'], major: true, target: '2026-12-15', done: [],
      rb: { version: 'v1.0.x', db: ['Migrasi skema reversibel', 'Reversible schema migration'], owner: 'USR-121', comm: ['Pengumuman 3 hari sebelum', 'Announcement 3 days ahead'], validation: ['Regression suite penuh + UAT finance', 'Full regression suite + finance UAT'] } }
  ];
  D.CUTOFF = { id: 'COF-001', kind: 'date', at: '2026-10-31 23:59', start: '2026-11-01 00:00', st: 'draft' };

  if (typeof module !== 'undefined' && module.exports) module.exports = D;
  else root.JFGO_DATA = D;
})(typeof window !== 'undefined' ? window : this);
