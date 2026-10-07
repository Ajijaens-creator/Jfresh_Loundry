/* ==========================================================================
   JFRESH OS — Phase 11 sample data (System Administration & Governance).
   Users, employees, roles, permissions, clients, properties, services,
   items, machines, vehicles, cost centres, COA, suppliers, invoices,
   notifications and audit trails all come from the Phase 4–10 engines.
   This file only holds what is new in Phase 11: the two system roles'
   people (Super Admin, System Admin), the HR profile of every internal user
   (phone, department, position, branch, access window, last login seed),
   the system-owned master data (company, branch, plant, unit, department,
   position, expense / issue / checklist category, maintenance type, tax,
   currency) with versions, system configuration, the notification
   templates, simulated outbound messages, security alerts history,
   integrations and APIs, background jobs, backups and retention policies.
   Day shown: Tuesday 6 Oct 2026, clock starts at 10:30 (WITA).
   ========================================================================== */
(function (root) {
  function L(a, b) { return [a, b === undefined ? a : b]; }
  var D = { today: '2026-10-06', simNow: '2026-10-06 10:30' };

  /* ---------- NP-07 new roles' people ---------- */
  D.PEOPLE = {
    superadmin: {
      emp: { id: 'EMP-120', n: 'Gede Rama', short: 'Rama', dept: L('IT & Sistem', 'IT & Systems'), status: 'active' },
      user: { id: 'USR-120', u: 'rama', email: 'rama@jfreshlaundry.app', emp: 'EMP-120', status: 'active', roles: [{ k: 'superadmin', def: true }], plants: ['*'], lang: 'id' },
      demo: { u: 'rama', d: L('Super Admin · System Control Center', 'Super Admin · System Control Center') }
    },
    sysadmin: {
      emp: { id: 'EMP-121', n: 'Aditya Wiguna', short: 'Adit', dept: L('IT & Sistem', 'IT & Systems'), status: 'active' },
      user: { id: 'USR-121', u: 'adit', email: 'adit@jfreshlaundry.app', emp: 'EMP-121', status: 'active', roles: [{ k: 'sysadmin', def: true }], plants: ['*'], lang: 'id' },
      demo: { u: 'adit', d: L('System Admin · user, role & master data', 'System Admin · users, roles & master data') }
    }
  };
  // An invited user who has not signed in yet (status Invited → Active on first login).
  D.INVITED = [{
    emp: { id: 'EMP-122', n: 'Yuda Pratama', short: 'Yuda', dept: L('IT & Sistem', 'IT & Systems'), status: 'active' },
    user: { id: 'USR-122', u: 'yuda', email: 'yuda@jfreshlaundry.app', emp: 'EMP-122', status: 'invited', roles: [{ k: 'supervisor', def: true }], plants: ['PL-01'], lang: 'id' }
  }];

  /* ---------- §31 internal user profile (lives in the SYS store keyed by user id) ----------
     [uid, phone, dept, position, branch, joined, access start, access end, last login, last device] */
  D.USER_META = [
    ['USR-001', '+62 812 3801 1101', 'OPS', 'POS-OPR', 'BR-UBD', '2023-02-01', '2023-02-01', null, '2026-10-06 06:02', 'Mobile · Android'],
    ['USR-002', '+62 812 3801 1102', 'LOG', 'POS-DRV', 'BR-UBD', '2022-07-11', '2022-07-11', null, '2026-10-06 05:48', 'Mobile · Android'],
    ['USR-021', '+62 812 3801 1121', 'OPS', 'POS-SPV', 'BR-UBD', '2021-11-15', '2021-11-15', null, '2026-10-06 07:10', 'Tablet · iPad'],
    ['USR-030', '+62 812 3801 1130', 'FIN', 'POS-FIN', 'BR-HO', '2021-03-01', '2021-03-01', null, '2026-10-06 08:05', 'Desktop · Chrome'],
    ['USR-040', '+62 812 3801 1140', 'SLS', 'POS-SAL', 'BR-HO', '2022-01-10', '2022-01-10', null, '2026-10-06 08:31', 'Desktop · Chrome'],
    ['USR-050', '+62 811 3900 0050', 'MGT', 'POS-CEO', 'BR-HO', '2019-06-01', '2019-06-01', null, '2026-10-06 07:45', 'Tablet · iPad'],
    ['USR-060', '+62 812 3801 1160', 'OPS', 'POS-OPR', 'BR-UBD', '2022-04-04', '2022-04-04', null, '2026-06-30 16:20', 'Mobile · Android'],
    ['USR-062', '+62 812 3801 1162', 'OPS', 'POS-OPR', 'BR-UBD', '2024-01-08', '2024-01-08', null, '2026-10-06 07:41', 'Mobile · Android'],
    ['USR-063', '+62 812 3801 1163', 'LOG', 'POS-DRV', 'BR-UBD', '2023-05-02', '2023-05-02', null, '2026-08-14 06:10', 'Mobile · Android'],
    ['USR-064', '+62 812 3801 1164', 'OPS', 'POS-OPR', 'BR-UBD', '2026-07-01', '2026-07-01', '2026-09-30', null, null],
    ['USR-095', '+62 812 3801 1195', 'HR', 'POS-HRA', 'BR-HO', '2022-09-01', '2022-09-01', null, '2026-10-05 15:12', 'Desktop · Chrome'],
    ['USR-075', '+62 812 3801 1175', 'PRD', 'POS-RLD', 'BR-UBD', '2023-08-21', '2023-08-21', null, '2026-10-06 06:40', 'Tablet · iPad'],
    ['USR-101', '+62 812 3801 1201', 'PRD', 'POS-LST', 'BR-UBD', '2024-03-11', '2024-03-11', null, '2026-10-06 06:05', 'Tablet · iPad'],
    ['USR-102', '+62 812 3801 1202', 'PRD', 'POS-LST', 'BR-UBD', '2024-03-11', '2024-03-11', null, '2026-10-06 06:07', 'Tablet · iPad'],
    ['USR-103', '+62 812 3801 1203', 'PRD', 'POS-LST', 'BR-UBD', '2024-06-03', '2024-06-03', null, '2026-10-06 06:11', 'Tablet · iPad'],
    ['USR-104', '+62 812 3801 1204', 'MNT', 'POS-TEK', 'BR-UBD', '2023-02-20', '2023-02-20', null, '2026-10-06 07:02', 'Desktop · Chrome'],
    ['USR-096', '+62 812 3801 1196', 'OPS', 'POS-OPM', 'BR-UBD', '2021-08-02', '2021-08-02', null, '2026-10-06 07:30', 'Desktop · Chrome'],
    ['USR-110', '+62 812 3801 1210', 'SUP', 'POS-PUR', 'BR-HO', '2023-10-02', '2023-10-02', null, '2026-10-06 08:20', 'Tablet · iPad'],
    ['USR-111', '+62 812 3801 1211', 'FIN', 'POS-AST', 'BR-HO', '2024-02-05', '2024-02-05', null, '2026-10-02 10:15', 'Tablet · iPad'],
    ['USR-112', '+62 812 3801 1212', 'FIN', 'POS-FIN', 'BR-HO', '2026-08-01', '2026-08-01', '2026-12-31', '2026-10-05 16:40', 'Desktop · Chrome'],
    ['USR-120', '+62 812 3801 1220', 'IT', 'POS-SUA', 'BR-HO', '2020-01-06', '2020-01-06', null, '2026-10-06 08:58', 'Desktop · Chrome'],
    ['USR-121', '+62 812 3801 1221', 'IT', 'POS-SYA', 'BR-HO', '2023-04-17', '2023-04-17', null, '2026-10-06 09:14', 'Desktop · Edge'],
    ['USR-122', '+62 812 3801 1222', 'IT', 'POS-ITS', 'BR-HO', '2026-10-05', '2026-10-05', null, null, null]
  ];

  /* ---------- NP-07 seeds: maker-checker request, access review campaign ---------- */
  D.REQUESTS = [
    { id: 'ARQ-2610-001', type: 'role', uid: 'USR-122', add: ['sysadmin'], roles: ['supervisor', 'sysadmin'], by: 'EMP-121', byName: 'Aditya Wiguna', at: '2026-10-06 09:20', reason: L('Yuda membantu admin sistem selama migrasi Fase 11.', 'Yuda supports system admin during the Phase 11 migration.'), st: 'pending' }
  ];
  D.CAMPAIGNS = [
    { id: 'ARV-2610-01', n: L('Review Akses Privileged Q4 2026', 'Privileged Access Review Q4 2026'), scope: 'privileged', due: '2026-10-15', at: '2026-10-01 09:00', by: 'EMP-120', st: 'open',
      dec: { 'USR-050': ['keep', L('Owner — tetap.', 'Owner — keep.'), 'EMP-120', '2026-10-01 09:30'], 'USR-030': ['keep', L('Finance utama — tetap.', 'Main finance — keep.'), 'EMP-120', '2026-10-01 09:32'] } }
  ];

  /* ---------- NP-08 system-owned master data: [code, id-label, en-label, extra data, versions?] ---------- */
  // versions: [[v, eff, reason-id, reason-en, by, data]]; when omitted a single v1 from 2026-01-01 is made.
  D.MASTER = {
    company: [{ code: 'CO-01', n: L("PT J'Fresh Laundry Bali", "PT J'Fresh Laundry Bali"), d: { legal: "PT J'Fresh Laundry Bali", npwp: '02.456.789.1-905.000', addr: 'Jl. Raya Mas, Ubud, Gianyar, Bali', cur: 'IDR', tz: 'Asia/Makassar' } }],
    branch: [
      { code: 'BR-HO', n: L('Kantor Pusat Ubud', 'Head Office Ubud'), d: { city: 'Ubud', plant: null, head: 'EMP-050' } },
      { code: 'BR-UBD', n: L('Cabang Ubud (Main Plant)', 'Ubud Branch (Main Plant)'), d: { city: 'Ubud', plant: 'PL-01', head: 'EMP-021' } },
      { code: 'BR-GNY', n: L('Cabang Gianyar (Plant 2)', 'Gianyar Branch (Plant 2)'), d: { city: 'Gianyar', plant: 'PL-02', head: 'EMP-021' } },
      { code: 'BR-SNR', n: L('Cabang Sanur (rencana)', 'Sanur Branch (planned)'), d: { city: 'Sanur', plant: null, head: null }, st: 'inactive' }
    ],
    plant: [
      { code: 'PL-01', n: L('Main Plant — Ubud', 'Main Plant — Ubud'), d: { branch: 'BR-UBD', capKg: 2400 } },
      { code: 'PL-02', n: L('Plant 2 — Gianyar', 'Plant 2 — Gianyar'), d: { branch: 'BR-GNY', capKg: 1200 } }
    ],
    unit: [
      { code: 'kg', n: L('Kilogram', 'Kilogram'), d: { sym: 'kg', type: 'weight' } }, { code: 'pcs', n: L('Pieces', 'Pieces'), d: { sym: 'pcs', type: 'count' } },
      { code: 'set', n: L('Set', 'Set'), d: { sym: 'set', type: 'count' } }, { code: 'lot', n: L('Lot', 'Lot'), d: { sym: 'lot', type: 'count' } },
      { code: 'L', n: L('Liter', 'Litre'), d: { sym: 'L', type: 'volume' } }, { code: 'bag', n: L('Bag', 'Bag'), d: { sym: 'bag', type: 'count' } },
      { code: 'roll', n: L('Roll', 'Roll'), d: { sym: 'roll', type: 'count' } }, { code: 'box', n: L('Box', 'Box'), d: { sym: 'box', type: 'count' } }, { code: 'rim', n: L('Rim', 'Ream'), d: { sym: 'rim', type: 'count' } }
    ],
    department: [
      { code: 'OPS', n: L('Operasional', 'Operations') }, { code: 'PRD', n: L('Produksi', 'Production') }, { code: 'LOG', n: L('Logistik', 'Logistics') }, { code: 'FIN', n: L('Keuangan', 'Finance') },
      { code: 'SLS', n: L('Sales', 'Sales') }, { code: 'MNT', n: L('Maintenance', 'Maintenance') }, { code: 'SUP', n: L('Purchasing', 'Purchasing') }, { code: 'HR', n: L('HRD', 'HR') },
      { code: 'IT', n: L('IT & Sistem', 'IT & Systems') }, { code: 'MGT', n: L('Direksi', 'Board') }, { code: 'QA', n: L('Quality', 'Quality'), st: 'inactive' }
    ],
    position: [
      { code: 'POS-OPR', n: L('Laundry Operator', 'Laundry Operator'), d: { dept: 'OPS' } }, { code: 'POS-DRV', n: L('Driver', 'Driver'), d: { dept: 'LOG' } }, { code: 'POS-SPV', n: L('Supervisor', 'Supervisor'), d: { dept: 'OPS' } },
      { code: 'POS-OPM', n: L('Operations Manager', 'Operations Manager'), d: { dept: 'OPS' } }, { code: 'POS-FIN', n: L('Finance Staff', 'Finance Staff'), d: { dept: 'FIN' } }, { code: 'POS-SAL', n: L('Account Manager', 'Account Manager'), d: { dept: 'SLS' } },
      { code: 'POS-CEO', n: L('Owner / CEO', 'Owner / CEO'), d: { dept: 'MGT' } }, { code: 'POS-HRA', n: L('HR Admin', 'HR Admin'), d: { dept: 'HR' } }, { code: 'POS-RLD', n: L('Race Leader', 'Race Leader'), d: { dept: 'PRD' } },
      { code: 'POS-LST', n: L('Laundry Staff', 'Laundry Staff'), d: { dept: 'PRD' } }, { code: 'POS-TEK', n: L('Teknisi', 'Technician'), d: { dept: 'MNT' } }, { code: 'POS-PUR', n: L('Purchasing Officer', 'Purchasing Officer'), d: { dept: 'SUP' } },
      { code: 'POS-AST', n: L('Asset Admin', 'Asset Admin'), d: { dept: 'FIN' } }, { code: 'POS-SUA', n: L('Super Admin', 'Super Admin'), d: { dept: 'IT' } }, { code: 'POS-SYA', n: L('System Admin', 'System Admin'), d: { dept: 'IT' } },
      { code: 'POS-ITS', n: L('IT Support', 'IT Support'), d: { dept: 'IT' } }
    ],
    expense: [
      { code: 'supplier', n: L('Supplier', 'Supplier'), d: { coa: '5900' } }, { code: 'chemical', n: L('Bahan kimia', 'Chemicals'), d: { coa: '5100' } }, { code: 'packaging', n: L('Kemasan', 'Packaging'), d: { coa: '5300' } },
      { code: 'maintenance', n: L('Maintenance', 'Maintenance'), d: { coa: '6400' } }, { code: 'fuel', n: L('BBM', 'Fuel'), d: { coa: '6500' } }, { code: 'payroll', n: L('Gaji & BPJS', 'Payroll & BPJS'), d: { coa: '6100' } },
      { code: 'tax', n: L('Pajak', 'Tax'), d: { coa: '6900' } }, { code: 'utility', n: L('Utilitas', 'Utilities'), d: { coa: '6200' } }, { code: 'rent', n: L('Sewa', 'Rent'), d: { coa: '6300' } },
      { code: 'opex', n: L('Operasional', 'Operating'), d: { coa: '6800' } }, { code: 'capex', n: L('Capex', 'Capex'), d: { coa: '1500' } }, { code: 'training', n: L('Pelatihan', 'Training'), d: { coa: '6800' } }
    ],
    issue: [
      { code: 'IC-QLT', n: L('Kualitas (noda, bau, rusak)', 'Quality (stain, smell, damage)'), d: { map: ['quality', 'reject', 'damaged', 'contam', 'wet'] } },
      { code: 'IC-QTY', n: L('Jumlah / barang kurang', 'Quantity / missing items'), d: { map: ['qty', 'missing', 'bagdiff', 'wrongitem'] } },
      { code: 'IC-LATE', n: L('Keterlambatan', 'Lateness'), d: { map: ['late', 'traffic', 'routedelay'] } },
      { code: 'IC-ACC', n: L('Akses / alamat / penerima', 'Access / address / receiver'), d: { map: ['unavail', 'notavail', 'address', 'wrongprop', 'notready', 'rejected', 'pickcancel'] } },
      { code: 'IC-FLT', n: L('Kendaraan', 'Vehicle'), d: { map: ['vehicle'] } },
      { code: 'IC-MCH', n: L('Mesin & produksi', 'Machine & production'), d: { map: ['breakdown', 'chemical', 'staff'] } },
      { code: 'IC-OTH', n: L('Lainnya', 'Other'), d: { map: ['other', 'special'] } },
      { code: 'IC-INV', n: L('Masalah invoice', 'Invoice issue'), d: { map: ['invoice'] } }
    ],
    checklist: [
      { code: 'opening', n: L('Opening', 'Opening') }, { code: 'closing', n: L('Closing', 'Closing') }, { code: 'shift', n: L('Pergantian shift', 'Shift handover') },
      { code: 'daily', n: L('Harian', 'Daily') }, { code: 'weekly', n: L('Mingguan', 'Weekly') }, { code: 'monthly', n: L('Bulanan', 'Monthly') }, { code: 'safety', n: L('K3 / Keselamatan', 'Safety') }
    ],
    maint: [
      { code: 'MT-PM', n: L('Preventive maintenance', 'Preventive maintenance'), d: { src: 'plans' } }, { code: 'MT-CM', n: L('Corrective / perbaikan', 'Corrective / repair'), d: { src: 'wo' } },
      { code: 'MT-CAL', n: L('Kalibrasi', 'Calibration'), d: { src: null } }, { code: 'MT-INS', n: L('Inspeksi', 'Inspection'), d: { src: null } }
    ],
    tax: [
      { code: 'PPN', n: L('PPN', 'VAT (PPN)'), d: { rate: 11, type: 'output' }, ver: [[1, '2020-01-01', 'Tarif PPN UU 42/2009', 'VAT rate Law 42/2009', 'EMP-030', { rate: 10, type: 'output' }], [2, '2022-04-01', 'UU HPP: PPN naik ke 11%', 'Tax Harmonisation Law: VAT to 11%', 'EMP-030', { rate: 11, type: 'output' }]] },
      { code: 'PPH23', n: L('PPh 23 jasa', 'Withholding tax art. 23 (services)'), d: { rate: 2, type: 'withholding' } },
      { code: 'PB1', n: L('Pajak daerah (PB1)', 'Regional tax (PB1)'), d: { rate: 10, type: 'regional' }, st: 'inactive' }
    ],
    currency: [
      { code: 'IDR', n: L('Rupiah Indonesia', 'Indonesian Rupiah'), d: { sym: 'Rp', dec: 0, base: true } },
      { code: 'USD', n: L('Dolar AS', 'US Dollar'), d: { sym: 'US$', dec: 2, base: false, rate: 15800 }, st: 'inactive' }
    ]
  };

  /* ---------- §38 system configuration (system-owned keys, v1 values) ---------- */
  D.CONFIG = {
    'num.order': 'ORD-YYMM-nnn', 'num.delivery': 'DLV-YYMM-nnn', 'num.invoice': 'INV-YYMM-nnn', 'num.request': 'REQ-YYMM-nnn', 'num.case': 'CASE-NNNNN', 'num.user': 'USR-nnn', 'num.import': 'IMP-YYMM-nnn',
    'lang.default': 'id', 'fmt.date': 'DD MMM YYYY', 'fmt.time': 'HH:mm', 'cur.default': 'IDR', 'tz': 'Asia/Makassar',
    'wf.makerChecker': true, 'wf.privRoles': 'owner,finance,superadmin,sysadmin', 'wf.masterApproval': 'tax,currency', 'wf.reviewDays': 90,
    'th.inactiveDays': 30, 'th.tempMaxDays': 90, 'th.importMaxRows': 500, 'th.notifFailWarn': 10, 'th.storageWarnPct': 70
  };

  /* ---------- NP-09 notification templates: [id, event, aud, channels, subj id, body id, subj en, body en] ---------- */
  D.TEMPLATES = [
    ['TPL-01', 'pickup_scheduled', 'client', ['app', 'wa'], 'Pickup dijadwalkan', 'Halo {{client_name}}, pickup untuk {{property_name}} dijadwalkan {{pickup_date}} pukul {{pickup_window}}. No. order {{order_number}}.', 'Pickup scheduled', 'Hello {{client_name}}, the pickup for {{property_name}} is scheduled on {{pickup_date}} at {{pickup_window}}. Order {{order_number}}.'],
    ['TPL-02', 'driver_assigned', 'client', ['app', 'wa'], 'Driver ditugaskan', '{{driver_name}} ({{plate}}) akan menangani order {{order_number}} untuk {{property_name}}.', 'Driver assigned', '{{driver_name}} ({{plate}}) will handle order {{order_number}} for {{property_name}}.'],
    ['TPL-03', 'near_arrival', 'client', ['app', 'wa', 'push'], 'Driver hampir tiba', 'Driver J\'Fresh tiba di {{property_name}} sekitar {{eta}}. Order {{order_number}}.', 'Driver arriving soon', 'The J\'Fresh driver arrives at {{property_name}} around {{eta}}. Order {{order_number}}.'],
    ['TPL-04', 'delivery_completed', 'client', ['app', 'wa', 'email'], 'Pengiriman selesai', 'Cucian untuk {{property_name}} sudah diterima. POD tersedia di portal. Order {{order_number}}.', 'Delivery completed', 'The laundry for {{property_name}} has been received. The POD is in the portal. Order {{order_number}}.'],
    ['TPL-05', 'invoice_issued', 'client', ['app', 'email'], 'Invoice {{invoice_number}} terbit', 'Yth. {{client_name}}, invoice {{invoice_number}} sebesar {{amount}} jatuh tempo {{due_date}}.', 'Invoice {{invoice_number}} issued', 'Dear {{client_name}}, invoice {{invoice_number}} of {{amount}} is due on {{due_date}}.'],
    ['TPL-06', 'payment_due', 'client', ['app', 'email', 'wa'], 'Pengingat jatuh tempo', 'Invoice {{invoice_number}} ({{amount}}) jatuh tempo {{due_date}}. Abaikan bila sudah dibayar.', 'Payment reminder', 'Invoice {{invoice_number}} ({{amount}}) is due on {{due_date}}. Ignore if already paid.'],
    ['TPL-07', 'ar_overdue', 'internal', ['app', 'email'], 'AR lewat jatuh tempo', '{{client_name}} · {{invoice_number}} lewat {{days_overdue}} hari ({{amount}}).', 'AR overdue', '{{client_name}} · {{invoice_number}} is {{days_overdue}} days overdue ({{amount}}).'],
    ['TPL-08', 'complaint_update', 'client', ['app', 'email'], 'Update laporan {{case_number}}', 'Status laporan {{case_number}} untuk {{property_name}}: {{status}}.', 'Case {{case_number}} update', 'Case {{case_number}} for {{property_name}}: {{status}}.'],
    ['TPL-09', 'maintenance_due', 'internal', ['app', 'push'], 'Maintenance jatuh tempo', '{{machine_name}}: {{maintenance_type}} jatuh tempo {{due_date}}.', 'Maintenance due', '{{machine_name}}: {{maintenance_type}} due on {{due_date}}.'],
    ['TPL-10', 'approval_required', 'internal', ['app', 'push', 'email'], 'Persetujuan dibutuhkan', '{{approval_type}} {{record}} menunggu persetujuan Anda.', 'Approval required', '{{approval_type}} {{record}} is waiting for your approval.'],
    ['TPL-11', 'stock_critical', 'internal', ['app', 'push'], 'Stok kritis', '{{item_name}} tersisa {{qty}}. Segera buat PR.', 'Critical stock', '{{item_name}} has {{qty}} left. Create a PR soon.'],
    ['TPL-12', 'sla_risk', 'internal', ['app', 'push'], 'Risiko SLA', '{{order_number}} · {{client_name}} berisiko terlambat {{delay_min}} menit.', 'SLA risk', '{{order_number}} · {{client_name}} is at risk of being {{delay_min}} minutes late.']
  ];

  /* ---------- §42 outbound messages the other engines do not keep (email / WhatsApp to clients) ----------
     [id, at, event, channel, cl, recipient, rec, status, error] */
  D.OUTBOX = [
    ['OB-2610-001', '2026-10-06 06:05', 'driver_assigned', 'wa', 'CL-07', 'Front Office · Jaens Spa Center', 'ORD-2610-143', 'delivered', null],
    ['OB-2610-002', '2026-10-06 06:12', 'driver_assigned', 'wa', 'CL-01', 'Ibu Sari · Grand Vista', 'ORD-2610-103', 'delivered', null],
    ['OB-2610-003', '2026-10-06 07:40', 'near_arrival', 'wa', 'CL-07', 'Front Office · Jaens Spa Shanti', 'ORD-2610-121', 'failed', L('Nomor tujuan tidak terdaftar di WhatsApp.', 'The recipient number is not registered on WhatsApp.')],
    ['OB-2610-004', '2026-10-06 08:02', 'invoice_issued', 'email', 'CL-05', 'finance@hotelabc.id', 'INV-2610-003', 'delivered', null],
    ['OB-2610-005', '2026-10-06 08:15', 'payment_due', 'wa', 'CL-03', 'Finance · Kayana Resort', 'INV-2609-020', 'failed', L('Template WhatsApp belum disetujui Meta.', 'The WhatsApp template is not approved by Meta yet.')],
    ['OB-2610-006', '2026-10-06 08:15', 'payment_due', 'email', 'CL-03', 'finance@kayana.id', 'INV-2609-020', 'delivered', null],
    ['OB-2610-007', '2026-10-06 09:05', 'complaint_update', 'email', 'CL-07', 'gm@jaensspa.id', 'DLV-2610-010', 'delivered', null],
    ['OB-2610-008', '2026-10-06 09:40', 'pickup_scheduled', 'wa', 'CL-07', 'Front Office · Jaens Spa Bisma', 'ORD-2610-132', 'failed', L('Batas kirim WhatsApp per menit tercapai (rate limit).', 'WhatsApp per-minute send limit reached (rate limit).')],
    ['OB-2610-009', '2026-10-06 10:20', 'payment_due', 'email', 'CL-01', 'ap@grandvista.id', 'INV-2610-001', 'pending', null],
    ['OB-2610-010', '2026-10-06 10:28', 'near_arrival', 'wa', 'CL-01', 'Ibu Sari · Grand Vista', 'ORD-2610-103', 'pending', null]
  ];

  /* ---------- NP-10 security alert history (detectors add live alerts on top) ---------- */
  D.ALERTS = [
    { id: 'SA-0101', kind: 'priv', sev: 'warn', at: '2026-10-02 14:05', t: L('Perubahan role privileged', 'Privileged role change'), c: L('Role Finance diberikan ke Gita Pratiwi (akses sementara s/d 31 Des 2026).', 'Finance role granted to Gita Pratiwi (temporary until 31 Dec 2026).'), rec: 'USR-112', st: 'resolved', note: L('Disetujui Owner, sesuai memo HR.', 'Approved by the Owner per HR memo.'), by: 'EMP-120' },
    { id: 'SA-0102', kind: 'failed', sev: 'warn', at: '2026-10-04 22:41', t: L('Percobaan login gagal beruntun', 'Repeated failed sign-ins'), c: L('6 percobaan gagal ke akun "admin" (tidak terdaftar) dari 1 perangkat.', '6 failed attempts on "admin" (not registered) from one device.'), rec: null, st: 'ack', note: L('Dipantau.', 'Being monitored.'), by: 'EMP-121' }
  ];

  /* ---------- NP-11 integrations (§49–§51) ---------- */
  D.INTEGRATIONS = [
    { id: 'INT-WA', n: 'WhatsApp Business API', k: 'wa', st: 'warning', last: '2026-10-06 10:28', ok: '2026-10-06 10:12', errAt: '2026-10-06 09:40', err: L('3 pesan gagal dalam 4 jam (template belum disetujui / rate limit).', '3 messages failed in 4 hours (template not approved / rate limit).'), flow: L('JFRESH → WhatsApp: notifikasi klien & driver', 'JFRESH → WhatsApp: client & driver notifications'), dir: 'out', owner: L('System Admin', 'System Admin'), cred: { type: 'API Key', last4: '4821', exp: '2026-10-20' }, rate: 91.2 },
    { id: 'INT-EMAIL', n: 'Email (SMTP)', k: 'email', st: 'healthy', last: '2026-10-06 10:20', ok: '2026-10-06 10:20', errAt: null, err: null, flow: L('JFRESH → Email: invoice, statement, reset password', 'JFRESH → Email: invoices, statements, password reset'), dir: 'out', owner: L('System Admin', 'System Admin'), cred: { type: 'SMTP', last4: '7710', exp: '2027-03-31' }, rate: 99.6 },
    { id: 'INT-MAPS', n: 'Google Maps Platform', k: 'maps', st: 'healthy', last: '2026-10-06 10:29', ok: '2026-10-06 10:29', errAt: null, err: null, flow: L('Maps → JFRESH: rute, ETA, geocoding', 'Maps → JFRESH: routes, ETA, geocoding'), dir: 'in', owner: L('Logistik', 'Logistics'), cred: { type: 'API Key', last4: '0932', exp: '2027-01-15' }, rate: 99.9 },
    { id: 'INT-PAY', n: 'Payment Gateway', k: 'pay', st: 'disconnected', last: '2026-09-30 17:00', ok: '2026-09-30 16:58', errAt: '2026-09-30 17:00', err: L('Kredensial dicabut oleh penyedia; menunggu kontrak baru.', 'Credentials revoked by the provider; waiting for a new contract.'), flow: L('Gateway → JFRESH: pembayaran online klien', 'Gateway → JFRESH: client online payments'), dir: 'in', owner: L('Finance', 'Finance'), cred: { type: 'OAuth2', last4: '5520', exp: '2026-09-30' }, rate: 0 },
    { id: 'INT-BANK', n: 'Bank BCA (mutasi rekening)', k: 'bank', st: 'healthy', last: '2026-10-06 06:00', ok: '2026-10-06 06:00', errAt: null, err: null, flow: L('Bank → JFRESH: mutasi untuk rekonsiliasi', 'Bank → JFRESH: statements for reconciliation'), dir: 'in', owner: L('Finance', 'Finance'), cred: { type: 'Certificate', last4: '3307', exp: '2027-06-30' }, rate: 100 },
    { id: 'INT-ACC', n: 'Accounting / Tax (e-Faktur)', k: 'acc', st: 'healthy', last: '2026-10-06 02:30', ok: '2026-10-06 02:30', errAt: null, err: null, flow: L('JFRESH → e-Faktur: faktur pajak keluaran', 'JFRESH → e-Faktur: output tax invoices'), dir: 'out', owner: L('Finance', 'Finance'), cred: { type: 'Certificate', last4: '8841', exp: '2026-11-02' }, rate: 99.1 },
    { id: 'INT-SCALE', n: 'Timbangan Digital', k: 'scale', st: 'warning', last: '2026-10-06 10:26', ok: '2026-10-06 10:26', errAt: '2026-10-06 09:58', err: L('Timbangan Plant 2 offline 6 menit, data dimasukkan manual.', 'Plant 2 scale offline for 6 minutes, data entered manually.'), flow: L('Timbangan → JFRESH: berat penerimaan', 'Scale → JFRESH: receiving weights'), dir: 'in', owner: L('Operasional', 'Operations'), cred: { type: 'Device token', last4: '1180', exp: '2027-02-01' }, rate: 96.4 },
    { id: 'INT-QR', n: 'Barcode / QR', k: 'qr', st: 'healthy', last: '2026-10-06 10:30', ok: '2026-10-06 10:30', errAt: null, err: null, flow: L('Scanner → JFRESH: bag, batch, aset', 'Scanner → JFRESH: bags, batches, assets'), dir: 'in', owner: L('Operasional', 'Operations'), cred: { type: 'Device token', last4: '6605', exp: '2027-08-01' }, rate: 99.8 },
    { id: 'INT-IOT', n: 'IoT Mesin (rencana)', k: 'iot', st: 'disconnected', future: true, last: null, ok: null, errAt: null, err: L('Belum diaktifkan: integrasi masa depan.', 'Not enabled yet: future integration.'), flow: L('Mesin → JFRESH: siklus, suhu, energi', 'Machines → JFRESH: cycles, temperature, energy'), dir: 'in', owner: L('Maintenance', 'Maintenance'), cred: null, rate: null },
    { id: 'INT-ERP', n: 'External ERP Grup', k: 'erp', st: 'disconnected', last: '2026-08-31 23:00', ok: '2026-08-31 23:00', errAt: '2026-09-01 00:10', err: L('Endpoint ERP grup berubah; menunggu konfigurasi baru dari vendor.', 'The group ERP endpoint changed; waiting for new configuration from the vendor.'), flow: L('JFRESH ↔ ERP Grup: jurnal ringkasan bulanan', 'JFRESH ↔ Group ERP: monthly summary journals'), dir: 'both', owner: L('Finance', 'Finance'), cred: { type: 'OAuth2', last4: '2290', exp: '2026-12-31' }, rate: 0 }
  ];
  /* §52 API management: [name, purpose-id, purpose-en, status, last request, error rate %, auth, owner] */
  D.APIS = [
    ['Order API', 'Buat & baca order pickup/delivery', 'Create & read pickup/delivery orders', 'healthy', '2026-10-06 10:29', 0.2, 'OAuth2 (session)', 'Logistik'],
    ['Tracking API', 'Posisi driver & ETA untuk portal klien', 'Driver position & ETA for the client portal', 'healthy', '2026-10-06 10:30', 0.4, 'OAuth2 (session)', 'Logistik'],
    ['Invoice API', 'Invoice & statement untuk portal klien', 'Invoices & statements for the client portal', 'healthy', '2026-10-06 10:21', 0.1, 'OAuth2 (session)', 'Finance'],
    ['Payment Webhook', 'Notifikasi pembayaran dari gateway', 'Payment notifications from the gateway', 'critical', '2026-09-30 17:00', 100, 'HMAC signature', 'Finance'],
    ['WhatsApp Send', 'Kirim notifikasi WhatsApp', 'Send WhatsApp notifications', 'warning', '2026-10-06 10:28', 8.8, 'API Key', 'System Admin'],
    ['Email SMTP', 'Kirim email transaksional', 'Send transactional email', 'healthy', '2026-10-06 10:20', 0.4, 'SMTP Auth', 'System Admin'],
    ['Maps Geocoding', 'Alamat → koordinat & rute', 'Address → coordinates & routes', 'healthy', '2026-10-06 10:29', 0.1, 'API Key', 'Logistik'],
    ['Scale Reader', 'Baca berat dari timbangan', 'Read weights from the scales', 'warning', '2026-10-06 10:26', 3.6, 'Device token', 'Operasional']
  ];
  /* §56 background jobs: [id, name-id, name-en, schedule, last run, status, note] */
  D.JOBS = [
    ['JOB-BKP', 'Backup harian', 'Daily backup', '02:00', '2026-10-06 02:00', 'healthy', null],
    ['JOB-FIN', 'Sinkron Billing Ready → Finance', 'Billing Ready → Finance sync', '*/15 min', '2026-10-06 10:15', 'healthy', null],
    ['JOB-NTF', 'Dispatcher notifikasi', 'Notification dispatcher', '*/1 min', '2026-10-06 10:30', 'warning', L('Antrian WhatsApp tertunda (rate limit).', 'WhatsApp queue delayed (rate limit).')],
    ['JOB-ETA', 'Hitung ulang ETA', 'ETA recalculation', '*/1 min', '2026-10-06 10:30', 'healthy', null],
    ['JOB-ERP', 'Kirim jurnal ke ERP Grup', 'Send journals to the Group ERP', 'monthly', '2026-09-01 00:10', 'critical', L('Gagal: endpoint ERP berubah.', 'Failed: the ERP endpoint changed.')],
    ['JOB-RET', 'Arsip data sesuai retensi', 'Archive data per retention', 'weekly', '2026-10-04 03:00', 'healthy', null]
  ];

  /* ---------- §65 backup history and retention ---------- */
  D.BACKUPS = (function () {
    var out = [], d0 = Date.UTC(2026, 9, 6);
    for (var i = 0; i < 14; i++) {
      var dt = new Date(d0 - i * 864e5).toISOString().slice(0, 10), failed = dt === '2026-09-28';
      out.push({ id: 'BKP-' + dt.replace(/-/g, ''), at: dt + ' 02:00', kind: 'auto', st: failed ? 'failed' : 'success', size: Math.round((412 - i * 1.7) * 10) / 10, dur: failed ? 0 : 7 + (i % 3), note: failed ? L('Disk tujuan penuh; diulang 02:40 berhasil.', 'Target disk full; retried 02:40 successfully.') : null });
      if (failed) out.push({ id: 'BKP-' + dt.replace(/-/g, '') + 'R', at: dt + ' 02:40', kind: 'retry', st: 'success', size: 398.3, dur: 8, note: null });
    }
    return out;
  })();
  // [key, id, en, active (months), archive after (months), never hard-delete]
  D.RETENTION = [
    ['invoice', 'Invoice', 'Invoice', 24, 24, true], ['pod', 'POD', 'POD', 12, 12, true], ['journal', 'Jurnal', 'Journal', 24, 24, true], ['payment', 'Pembayaran', 'Payment', 24, 24, true],
    ['hpp', 'Versi HPP', 'HPP Version', 24, 24, true], ['price', 'Versi Harga', 'Price Version', 24, 24, true], ['audit', 'Audit Log', 'Audit Log', 36, 36, true], ['completion', 'Service Completion', 'Service Completion', 12, 12, true],
    ['access', 'Riwayat Akses', 'Access History', 24, 24, true], ['order', 'Order & tracking', 'Orders & tracking', 12, 12, false], ['notif', 'Log notifikasi', 'Notification log', 3, 3, false],
    ['chat', 'Chat order', 'Order chat', 6, 6, false], ['import', 'File import', 'Import files', 6, 6, false], ['export', 'File export', 'Export files', 1, 1, false], ['session', 'Log sesi', 'Session log', 3, 3, false]
  ];

  if (typeof module !== 'undefined' && module.exports) module.exports = D;
  else root.JFSYS_DATA = D;
})(typeof window !== 'undefined' ? window : this);
