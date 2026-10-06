/* ==========================================================================
   JFRESH OS — Phase 2 single source of truth (NP version 1.0)
   Sitemap, information levels, roles, permissions, navigation, user flows,
   screen archetypes, the screen register (functional screen framework) and
   the traceability catalogs. Read by the working app (app/), the Phase 2
   documentation pages (phase2/) and the docs generator (tools/).

   Every label is a pair: [Bahasa Indonesia, English]. Indonesian is default.
   Rule: permissions drive everything. A role sees a menu, a page, a button or
   a column only when its permission list contains the matching permission.
   ========================================================================== */
(function (root) {
  function L(id, en) { return [id, en === undefined ? id : en]; }

  var C = { version: 'NP 1.0', date: '2026-10-06' };

  /* ---------- Traceability catalogs ---------- */
  // Phase 1 Business Foundation visuals (in this repo: visuals/0n-*.html)
  C.BF = {
    'BF-01': L('Model Bisnis', 'Business Model'),
    'BF-02': L('Ruang Lingkup Sistem', 'System Scope'),
    'BF-03': L('Peta User & Peran', 'User & Role Map'),
    'BF-04': L('Alur Operasional End-to-End', 'End-to-End Operational Flow'),
    'BF-05': L('Aturan Bisnis & Kontrol', 'Business Rules & Control'),
    'BF-06': L('Arsitektur KPI & SLA', 'KPI & SLA Architecture'),
    'BF-07': L('Relasi Master Data', 'Master Data Relationships')
  };
  // Navigation Brief requirement catalog. NB-04 and NB-05 come from the
  // Phase 2 master prompt; the rest follow the Phase 1 golden workflow and are
  // provisional until the approved NB list is attached.
  C.NB = {
    'NB-01': L('Klien & Kontrak', 'Client & Contract'),
    'NB-02': L('Request & Jadwal Pickup', 'Pickup Request & Schedule'),
    'NB-03': L('Pickup', 'Pickup'),
    'NB-04': L('Penerimaan', 'Receiving'),
    'NB-05': L('Cocokkan Data (Rekonsiliasi)', 'Reconciliation'),
    'NB-06': L('Sorting', 'Sorting'),
    'NB-07': L('Proses Laundry', 'Production'),
    'NB-08': L('QC & Rewash', 'QC & Rewash'),
    'NB-09': L('Packing & Siap Dikirim', 'Packing & Dispatch'),
    'NB-10': L('Pengiriman & Bukti Pengiriman', 'Delivery & Proof of Delivery'),
    'NB-11': L('Masalah, Komplain & Klaim', 'Issues, Complaints & Claims'),
    'NB-12': L('Billing & Invoice', 'Billing & Invoice'),
    'NB-13': L('Pembayaran & Piutang', 'Payment & Receivables'),
    'NB-14': L('Supply & Inventory', 'Supply & Inventory'),
    'NB-15': L('Armada & Logistik', 'Fleet & Logistics'),
    'NB-16': L('KPI, SLA & Laporan', 'KPI, SLA & Reporting'),
    'NB-17': L('User, Peran & Hak Akses', 'Users, Roles & Permissions'),
    'NB-18': L('Audit & Kontrol', 'Audit & Control'),
    'NB-19': L('Client Portal', 'Client Portal'),
    'NB-20': L('Master Data & Pengaturan', 'Master Data & Settings')
  };
  C.NB_PROVISIONAL = ['NB-01', 'NB-02', 'NB-03', 'NB-06', 'NB-07', 'NB-08', 'NB-09', 'NB-10', 'NB-11', 'NB-12', 'NB-13', 'NB-14', 'NB-15', 'NB-16', 'NB-17', 'NB-18', 'NB-19', 'NB-20'];
  // Phase 2 high-fidelity navigation visuals (the six approved mockups)
  C.NV = {
    'NV-01': L('Master Sitemap', 'Master Sitemap'),
    'NV-02': L('Information Architecture', 'Information Architecture'),
    'NV-03': L('Navigasi User & Peran', 'User & Role Navigation'),
    'NV-04': L('User Flow', 'User Flow'),
    'NV-05': L('Screen Inventory', 'Screen Inventory'),
    'NV-06': L('Functional Screen Framework', 'Functional Screen Framework')
  };
  C.NP = [
    { k: 'NP-01', f: 'np01-sitemap.html', t: L('Master Sitemap', 'Master Sitemap'), d: L('Struktur lengkap modul JFRESH OS', 'Full module structure of JFRESH OS'), ic: 'layers' },
    { k: 'NP-02', f: 'np02-information-architecture.html', t: L('Information Architecture', 'Information Architecture'), d: L('Prioritas informasi berdasarkan kebutuhan user', 'Information priority by user need'), ic: 'target' },
    { k: 'NP-03', f: 'np03-role-navigation.html', t: L('Navigasi Berdasarkan Peran', 'Role-Based Navigation'), d: L('Akses menu berbeda sesuai peran', 'Different menus for each role'), ic: 'users' },
    { k: 'NP-04', f: 'np04-user-flows.html', t: L('User Flow', 'User Flow'), d: L('Alur kerja utama berdasarkan peran', 'Main task flows by role'), ic: 'route' },
    { k: 'NP-05', f: 'np05-screen-inventory.html', t: L('Screen Inventory', 'Screen Inventory'), d: L('9 jenis layar yang dipakai ulang', 'Nine reusable screen types'), ic: 'grid' },
    { k: 'NP-06', f: 'np06-screen-framework.html', t: L('Functional Screen Framework', 'Functional Screen Framework'), d: L('Standar struktur, state & izin setiap layar', 'Structure, states & permissions for every screen'), ic: 'clipboard' }
  ];

  /* ---------- NP-02 Information levels ---------- */
  C.LEVELS = [
    { n: 1, t: L('Saat Ini', 'Right Now'), q: L('Apa yang perlu perhatian sekarang?', 'What needs attention now?'),
      ex: [L('12 Cucian Menunggu', '12 Loads Waiting'), L('3 Menunggu QC', '3 Waiting for QC'), L('2 Ada Masalah', '2 Issues'), L('1 Terlambat', '1 Late')],
      who: L('Semua user. Selalu di bagian paling atas.', 'Every user. Always at the very top.') },
    { n: 2, t: L('Pekerjaan Saya', 'My Work'), q: L('Apa pekerjaan saya?', 'What is my work?'),
      ex: [L('Terima Cucian', 'Receive Laundry'), L('Proses Laundry', 'Laundry Process'), L('QC', 'QC'), L('Packing', 'Packing'), L('Pengiriman', 'Delivery')],
      who: L('Sesuai peran. Hanya fitur yang relevan.', 'By role. Only relevant features.') },
    { n: 3, t: L('Riwayat & Detail', 'History & Detail'), q: L('Apa yang sudah terjadi?', 'What has happened?'),
      ex: [L('Riwayat', 'History'), L('Status', 'Status'), L('Bukti', 'Proof'), L('Catatan', 'Notes'), L('Detail transaksi', 'Transaction detail')],
      who: L('Operasional & supervisor untuk lacak dan verifikasi.', 'Operations & supervisors for tracking and checks.') },
    { n: 4, t: L('Manajemen & Konfigurasi', 'Management & Configuration'), q: L('Bagaimana bisnis berjalan & diatur?', 'How is the business run and configured?'),
      ex: [L('Laporan', 'Reports'), L('Analitik', 'Analytics'), L('Master Data', 'Master Data'), L('Pengaturan', 'Settings'), L('Persetujuan', 'Approval'), L('Audit', 'Audit')],
      who: L('Manajemen. Strategis dan konfigurasi.', 'Management. Strategy and configuration.') }
  ];

  /* ---------- Alert levels ---------- */
  C.ALERTS = {
    info: { t: L('Info', 'Info'), color: 'blue', ex: L('12 cucian menunggu.', '12 loads waiting.'), icon: 'bell' },
    warn: { t: L('Peringatan', 'Warning'), color: 'amber', ex: L('SLA tersisa 1 jam.', '1 hour of SLA left.'), icon: 'clock' },
    crit: { t: L('Kritis', 'Critical'), color: 'red', ex: L('Order terlambat.', 'Order is late.'), icon: 'alert' }
  };

  /* ---------- Permissions ---------- */
  C.PERMS = {
    // role homes
    'home.op': L('Beranda operator', 'Operator home'),
    'home.drv': L('Beranda driver', 'Driver home'),
    'home.spv': L('Dashboard supervisor', 'Supervisor dashboard'),
    'home.mgr': L('Dashboard manager', 'Manager dashboard'),
    'home.fin': L('Dashboard finance', 'Finance dashboard'),
    'home.sal': L('Dashboard sales', 'Sales dashboard'),
    'home.exe': L('Dashboard eksekutif', 'Executive dashboard'),
    'home.clt': L('Beranda klien', 'Client home'),
    // operations
    'ops.pickup': L('Kerjakan pickup', 'Do pickups'),
    'ops.receive': L('Terima cucian', 'Receive laundry'),
    'ops.sort': L('Sorting', 'Sorting'),
    'ops.wash': L('Proses cuci', 'Washing'),
    'ops.qc': L('Putuskan QC', 'Decide QC'),
    'ops.pack': L('Packing', 'Packing'),
    'ops.deliver': L('Kerjakan pengiriman', 'Do deliveries'),
    'ops.issue': L('Laporkan masalah', 'Report an issue'),
    'ops.history': L('Lihat riwayat', 'View history'),
    'ops.detail': L('Lihat detail cucian', 'View load detail'),
    'ops.weight.override': L('Koreksi berat > 5%', 'Weight correction > 5%'),
    'ops.board': L('Lihat papan operasional', 'View operations board'),
    'ops.team': L('Atur tugas tim', 'Manage team tasks'),
    'log.route': L('Lihat rute sendiri', 'View own route'),
    'log.view': L('Lihat armada & rute', 'View fleet & routes'),
    'prd.view': L('Lihat produksi', 'View production'),
    // quality
    'qlt.view': L('Lihat kualitas', 'View quality'),
    'qlt.review': L('Tinjau masalah', 'Review issues'),
    'qlt.claim.approve': L('Setujui klaim', 'Approve claims'),
    'sla.view': L('Lihat SLA', 'View SLA'),
    // inventory
    'inv.view': L('Lihat stok', 'View stock'),
    'inv.adjust.request': L('Ajukan penyesuaian stok', 'Request stock adjustment'),
    'inv.adjust.approve': L('Setujui penyesuaian stok', 'Approve stock adjustment'),
    // finance
    'fin.view': L('Lihat finance', 'View finance'),
    'fin.bill': L('Buat tagihan', 'Create bills'),
    'fin.invoice': L('Kelola invoice', 'Manage invoices'),
    'fin.invoice.fix.approve': L('Setujui koreksi invoice', 'Approve invoice corrections'),
    'fin.payment': L('Catat pembayaran', 'Record payments'),
    'fin.ar': L('Lihat piutang', 'View receivables'),
    'fin.cn.request': L('Ajukan credit note', 'Request credit notes'),
    'fin.cn.approve': L('Setujui credit note', 'Approve credit notes'),
    // commercial
    'com.client.view': L('Lihat klien', 'View clients'),
    'com.client.edit': L('Tambah / ubah klien', 'Add / edit clients'),
    'com.property': L('Kelola property', 'Manage properties'),
    'com.contract.view': L('Lihat kontrak', 'View contracts'),
    'com.contract.edit': L('Buat / ubah kontrak', 'Create / edit contracts'),
    'com.rate.view': L('Lihat harga & rate card', 'View prices & rate cards'),
    'com.rate.request': L('Ajukan perubahan harga', 'Request price changes'),
    'com.rate.approve': L('Setujui perubahan harga', 'Approve price changes'),
    'com.sla': L('Kelola SLA klien', 'Manage client SLA'),
    'com.docs': L('Kelola dokumen', 'Manage documents'),
    'com.renewal': L('Kelola perpanjangan', 'Manage renewals'),
    // reports
    'rpt.ops': L('Laporan operasional', 'Operations reports'),
    'rpt.fin': L('Laporan finance', 'Finance reports'),
    'rpt.exec': L('Laporan eksekutif', 'Executive reports'),
    'rpt.export': L('Export laporan', 'Export reports'),
    'people.view': L('Lihat produktivitas tim', 'View team productivity'),
    // approvals & system
    'apr.view': L('Lihat persetujuan', 'View approvals'),
    'sys.users': L('Kelola user', 'Manage users'),
    'sys.roles': L('Kelola peran & izin', 'Manage roles & permissions'),
    'sys.audit': L('Lihat audit log', 'View audit log'),
    'sys.settings': L('Ubah pengaturan', 'Change settings'),
    'sys.master': L('Kelola master data', 'Manage master data'),
    // client portal (own data only)
    'clt.portal': L('Akses portal klien', 'Client portal access'),
    'clt.pickup': L('Minta pickup', 'Request pickup'),
    'clt.invoice': L('Lihat & bayar invoice', 'View & pay invoices'),
    'clt.complaint': L('Kirim komplain', 'Send complaints')
  };

  /* ---------- Roles (NP-03) ----------
     device: primary form factor. nav: visible menu (desktop / iPad sidebar).
     mnav: mobile bottom navigation (max 5, last may be "Menu"). */
  C.ROLES = {
    operator: {
      n: L('Frontline Operator', 'Frontline Operator'), person: 'Made', title: L('Operator Laundry', 'Laundry Operator'),
      group: 'frontline', device: 'mobile', site: 'Plant Denpasar',
      q: L('Apa yang harus saya kerjakan sekarang?', 'What should I do now?'),
      feel: L('Aplikasi ini mudah. Saya tahu persis apa yang harus saya kerjakan.', 'This app is easy. I know exactly what I need to do.'),
      perms: ['home.op', 'ops.receive', 'ops.sort', 'ops.wash', 'ops.qc', 'ops.pack', 'ops.issue', 'ops.history', 'ops.detail'],
      nav: [
        { k: 'home', l: L('Beranda', 'Home'), i: 'home', s: 'HOM-OPR-001' },
        { k: 'tasks', l: L('Tugas Saya', 'My Tasks'), i: 'clipboard', s: 'OPS-TSK-001' },
        { k: 'history', l: L('Riwayat', 'History'), i: 'history', s: 'OPS-HIS-001' },
        { k: 'issue', l: L('Ada Masalah', 'Report Issue'), i: 'alert', s: 'OPS-ISS-001' }
      ],
      mnav: [
        { k: 'home', l: L('Home', 'Home'), i: 'home', s: 'HOM-OPR-001' },
        { k: 'tasks', l: L('Tugas', 'Tasks'), i: 'clipboard', s: 'OPS-TSK-001' },
        { k: 'issue', l: L('Masalah', 'Issue'), i: 'alert', s: 'OPS-ISS-001' },
        { k: 'history', l: L('Riwayat', 'History'), i: 'history', s: 'OPS-HIS-001' },
        { k: 'menu', l: L('Menu', 'Menu'), i: 'menu' }
      ],
      hide: [L('Finance', 'Finance'), L('Klien', 'Clients'), L('Harga', 'Pricing'), L('Kontrak', 'Contracts'), L('Laporan', 'Reports'), L('Pengaturan', 'Settings')],
      levels: [1, 2, 3]
    },
    driver: {
      n: L('Driver / Pickup', 'Driver / Pickup'), person: 'Komang', title: L('Driver', 'Driver'),
      group: 'frontline', device: 'mobile', site: 'Armada B 1234 XY',
      q: L('Ke mana saya hari ini?', 'Where do I go today?'),
      feel: L('Saya tahu rute, barang, dan bukti yang harus saya bawa.', 'I know my route, my items and the proof I need.'),
      perms: ['home.drv', 'ops.pickup', 'ops.deliver', 'log.route', 'ops.issue', 'ops.history', 'ops.detail'],
      nav: [
        { k: 'home', l: L('Hari Ini', 'Today'), i: 'calendar', s: 'HOM-DRV-001' },
        { k: 'pickup', l: L('Pickup', 'Pickup'), i: 'package', s: 'OPS-PKP-002' },
        { k: 'delivery', l: L('Pengiriman', 'Delivery'), i: 'truck', s: 'OPS-DLV-002' },
        { k: 'route', l: L('Rute', 'Route'), i: 'route', s: 'LOG-RTE-001' },
        { k: 'issue', l: L('Masalah', 'Issue'), i: 'alert', s: 'OPS-ISS-001' },
        { k: 'history', l: L('Riwayat', 'History'), i: 'history', s: 'OPS-HIS-001' }
      ],
      mnav: [
        { k: 'home', l: L('Hari Ini', 'Today'), i: 'calendar', s: 'HOM-DRV-001' },
        { k: 'jobs', l: L('Pickup/Kirim', 'Pickup/Drop'), i: 'truck', s: 'OPS-PKP-002', also: ['OPS-DLV-002'] },
        { k: 'route', l: L('Rute', 'Route'), i: 'route', s: 'LOG-RTE-001' },
        { k: 'issue', l: L('Masalah', 'Issue'), i: 'alert', s: 'OPS-ISS-001' },
        { k: 'history', l: L('Riwayat', 'History'), i: 'history', s: 'OPS-HIS-001' }
      ],
      hide: [L('Finance', 'Finance'), L('Klien', 'Clients'), L('Harga', 'Pricing'), L('Laporan', 'Reports'), L('Pengaturan', 'Settings')],
      levels: [1, 2, 3]
    },
    supervisor: {
      n: L('Laundry Supervisor', 'Laundry Supervisor'), person: 'Budi Santoso', title: L('Supervisor', 'Supervisor'),
      group: 'management', device: 'ipad', site: 'Plant Denpasar',
      q: L('Apa yang perlu perhatian?', 'What needs attention?'),
      feel: L('Saya langsung melihat di mana masalahnya.', 'I can immediately see where the problem is.'),
      perms: ['home.spv', 'ops.board', 'ops.team', 'ops.receive', 'ops.sort', 'ops.wash', 'ops.qc', 'ops.pack', 'ops.issue', 'ops.history', 'ops.detail', 'ops.weight.override',
        'qlt.view', 'qlt.review', 'sla.view', 'rpt.ops', 'inv.adjust.request', 'apr.view'],
      nav: [
        { k: 'home', l: L('Dashboard', 'Dashboard'), i: 'grid', s: 'HOM-SPV-001' },
        { k: 'ops', l: L('Operasional', 'Operations'), i: 'washer', s: 'OPS-BRD-001' },
        { k: 'team', l: L('Tugas Tim', 'Team Tasks'), i: 'users', s: 'OPS-TEAM-001' },
        { k: 'qc', l: L('QC', 'QC'), i: 'shield', s: 'OPS-QC-002' },
        { k: 'issues', l: L('Masalah', 'Issues'), i: 'alert', s: 'QLT-ISS-001' },
        { k: 'sla', l: L('SLA', 'SLA'), i: 'clock', s: 'SLA-MON-001' },
        { k: 'reports', l: L('Laporan', 'Reports'), i: 'chart', s: 'RPT-OPS-001' }
      ],
      mnav: [
        { k: 'home', l: L('Dashboard', 'Dashboard'), i: 'grid', s: 'HOM-SPV-001' },
        { k: 'ops', l: L('Operasional', 'Operations'), i: 'washer', s: 'OPS-BRD-001' },
        { k: 'issues', l: L('Masalah', 'Issues'), i: 'alert', s: 'QLT-ISS-001' },
        { k: 'sla', l: L('SLA', 'SLA'), i: 'clock', s: 'SLA-MON-001' },
        { k: 'menu', l: L('Menu', 'Menu'), i: 'menu' }
      ],
      extra: [{ k: 'apr', l: L('Persetujuan', 'Approvals'), i: 'filecheck', s: 'APR-INB-001' }],
      hide: [L('Finance', 'Finance'), L('Harga', 'Pricing'), L('Kontrak', 'Contracts'), L('Pengaturan sistem', 'System settings')],
      levels: [1, 2, 3, 4]
    },
    opsmgr: {
      n: L('Operations Manager', 'Operations Manager'), person: 'Dewi Lestari', title: L('Operations Manager', 'Operations Manager'),
      group: 'management', device: 'desktop', site: 'Semua plant',
      q: L('Bagaimana operasional berjalan?', 'How is the operation performing?'),
      feel: L('Saya bisa mengendalikan operasional.', 'I can control the operation.'),
      perms: ['home.mgr', 'ops.board', 'ops.history', 'ops.detail', 'ops.weight.override', 'log.view', 'prd.view', 'qlt.view', 'qlt.review', 'qlt.claim.approve', 'inv.view', 'inv.adjust.request', 'inv.adjust.approve',
        'sla.view', 'rpt.ops', 'rpt.export', 'apr.view', 'people.view'],
      nav: [
        { k: 'home', l: L('Dashboard', 'Dashboard'), i: 'grid', s: 'HOM-MGR-001' },
        { k: 'ops', l: L('Operasional', 'Operations'), i: 'washer', s: 'OPS-BRD-001' },
        { k: 'log', l: L('Logistik', 'Logistics'), i: 'truck', s: 'LOG-FLT-001' },
        { k: 'prd', l: L('Produksi', 'Production'), i: 'factory', s: 'PRD-DSH-001' },
        { k: 'qlt', l: L('Quality', 'Quality'), i: 'shield', s: 'QLT-DSH-001' },
        { k: 'inv', l: L('Inventory', 'Inventory'), i: 'package', s: 'INV-STK-001' },
        { k: 'sla', l: L('SLA', 'SLA'), i: 'clock', s: 'SLA-MON-001' },
        { k: 'reports', l: L('Laporan', 'Reports'), i: 'chart', s: 'RPT-OPS-001' }
      ],
      mnav: [
        { k: 'home', l: L('Dashboard', 'Dashboard'), i: 'grid', s: 'HOM-MGR-001' },
        { k: 'ops', l: L('Operasional', 'Operations'), i: 'washer', s: 'OPS-BRD-001' },
        { k: 'apr', l: L('Persetujuan', 'Approvals'), i: 'filecheck', s: 'APR-INB-001' },
        { k: 'sla', l: L('SLA', 'SLA'), i: 'clock', s: 'SLA-MON-001' },
        { k: 'menu', l: L('Menu', 'Menu'), i: 'menu' }
      ],
      extra: [{ k: 'apr', l: L('Persetujuan', 'Approvals'), i: 'filecheck', s: 'APR-INB-001' }],
      hide: [L('Harga & kontrak', 'Pricing & contracts'), L('Invoice & pembayaran', 'Invoices & payments'), L('Pengaturan sistem', 'System settings')],
      levels: [1, 2, 3, 4]
    },
    finance: {
      n: L('Finance', 'Finance'), person: 'Rina Dewi', title: L('Finance', 'Finance'),
      group: 'management', device: 'desktop', site: 'Kantor pusat',
      q: L('Apa yang perlu ditagih atau ditagihkan?', 'What needs billing or collection?'),
      feel: L('Saya bisa melacak tagihan dan penagihan dengan akurat.', 'I can track billing and collection accurately.'),
      perms: ['home.fin', 'fin.view', 'fin.bill', 'fin.invoice', 'fin.invoice.fix.approve', 'fin.payment', 'fin.ar', 'fin.cn.request', 'rpt.fin', 'rpt.export', 'com.client.view', 'com.rate.view', 'apr.view'],
      nav: [
        { k: 'home', l: L('Dashboard Finance', 'Finance Dashboard'), i: 'grid', s: 'HOM-FIN-001' },
        { k: 'bill', l: L('Billing', 'Billing'), i: 'file', s: 'FIN-BIL-001' },
        { k: 'inv', l: L('Invoice', 'Invoice'), i: 'invoice', s: 'FIN-INV-001' },
        { k: 'pay', l: L('Pembayaran', 'Payment'), i: 'card', s: 'FIN-PAY-002' },
        { k: 'ar', l: L('Piutang (AR)', 'Receivables (AR)'), i: 'coins', s: 'FIN-AR-001' },
        { k: 'cn', l: L('Credit Note', 'Credit Note'), i: 'filecheck', s: 'FIN-CN-001' },
        { k: 'reports', l: L('Laporan', 'Reports'), i: 'chart', s: 'RPT-FIN-001' }
      ],
      mnav: [
        { k: 'home', l: L('Dashboard', 'Dashboard'), i: 'grid', s: 'HOM-FIN-001' },
        { k: 'inv', l: L('Invoice', 'Invoice'), i: 'invoice', s: 'FIN-INV-001' },
        { k: 'pay', l: L('Bayar', 'Payment'), i: 'card', s: 'FIN-PAY-002' },
        { k: 'ar', l: L('Piutang', 'AR'), i: 'coins', s: 'FIN-AR-001' },
        { k: 'menu', l: L('Menu', 'Menu'), i: 'menu' }
      ],
      extra: [{ k: 'apr', l: L('Persetujuan', 'Approvals'), i: 'filecheck', s: 'APR-INB-001' }],
      hide: [L('Operasional harian', 'Daily operations'), L('Ubah harga', 'Price changes'), L('Pengaturan sistem', 'System settings')],
      levels: [1, 2, 3, 4]
    },
    sales: {
      n: L('Sales / Account', 'Sales / Account'), person: 'Andi Pratama', title: L('Account Manager', 'Account Manager'),
      group: 'management', device: 'desktop', site: 'Kantor pusat',
      q: L('Klien mana yang perlu perhatian?', 'Which clients need attention?'),
      feel: L('Saya tahu kondisi setiap klien dan kontraknya.', 'I know the state of every client and contract.'),
      perms: ['home.sal', 'com.client.view', 'com.client.edit', 'com.property', 'com.contract.view', 'com.contract.edit', 'com.rate.view', 'com.rate.request', 'com.sla', 'com.docs', 'com.renewal', 'sla.view'],
      nav: [
        { k: 'home', l: L('Dashboard', 'Dashboard'), i: 'grid', s: 'HOM-SAL-001' },
        { k: 'cli', l: L('Klien', 'Clients'), i: 'users', s: 'COM-CLI-001' },
        { k: 'prp', l: L('Property', 'Property'), i: 'hotel', s: 'COM-PRP-001' },
        { k: 'ctr', l: L('Kontrak', 'Contracts'), i: 'contract', s: 'COM-CTR-001' },
        { k: 'rate', l: L('Rate Card', 'Rate Card'), i: 'tag', s: 'COM-RTC-001' },
        { k: 'sla', l: L('SLA', 'SLA'), i: 'clock', s: 'COM-SLA-001' },
        { k: 'doc', l: L('Dokumen', 'Documents'), i: 'file', s: 'COM-DOC-001' },
        { k: 'rnw', l: L('Renewal', 'Renewal'), i: 'refresh', s: 'COM-RNW-001' }
      ],
      mnav: [
        { k: 'home', l: L('Dashboard', 'Dashboard'), i: 'grid', s: 'HOM-SAL-001' },
        { k: 'cli', l: L('Klien', 'Clients'), i: 'users', s: 'COM-CLI-001' },
        { k: 'ctr', l: L('Kontrak', 'Contracts'), i: 'contract', s: 'COM-CTR-001' },
        { k: 'rnw', l: L('Renewal', 'Renewal'), i: 'refresh', s: 'COM-RNW-001' },
        { k: 'menu', l: L('Menu', 'Menu'), i: 'menu' }
      ],
      hide: [L('Operasional harian', 'Daily operations'), L('Pembayaran', 'Payments'), L('Pengaturan sistem', 'System settings')],
      levels: [1, 2, 3]
    },
    owner: {
      n: L('Director / CEO / Owner', 'Director / CEO / Owner'), person: 'Pak Jaens', title: L('Owner', 'Owner'),
      group: 'management', device: 'desktop', site: 'Semua plant',
      q: L('Bagaimana kinerja bisnis?', 'How is the business performing?'),
      feel: L('Saya memahami seluruh bisnis dari satu sistem yang andal.', 'I understand the entire business from one reliable system.'),
      perms: ['home.exe', 'rpt.exec', 'rpt.ops', 'rpt.fin', 'rpt.export', 'ops.board', 'ops.detail', 'prd.view', 'log.view', 'sla.view', 'qlt.view', 'qlt.claim.approve', 'inv.view', 'inv.adjust.approve',
        'fin.view', 'fin.ar', 'fin.cn.approve', 'com.client.view', 'com.contract.view', 'com.rate.view', 'com.rate.approve', 'people.view', 'apr.view',
        'sys.users', 'sys.roles', 'sys.audit', 'sys.settings', 'sys.master'],
      nav: [
        { k: 'home', l: L('Executive', 'Executive'), i: 'gauge', s: 'HOM-EXE-001' },
        { k: 'ops', l: L('Operasional', 'Operations'), i: 'washer', s: 'RPT-OPS-001' },
        { k: 'com', l: L('Komersial', 'Commercial'), i: 'briefcase', s: 'RPT-COM-001' },
        { k: 'fin', l: L('Finance', 'Finance'), i: 'coins', s: 'RPT-FIN-001' },
        { k: 'cli', l: L('Klien', 'Client'), i: 'hotel', s: 'RPT-CLI-001' },
        { k: 'qlt', l: L('Quality', 'Quality'), i: 'shield', s: 'QLT-DSH-001' },
        { k: 'inv', l: L('Inventory', 'Inventory'), i: 'package', s: 'INV-STK-001' },
        { k: 'ppl', l: L('People', 'People'), i: 'users', s: 'RPT-PPL-001' },
        { k: 'reports', l: L('Laporan', 'Reports'), i: 'chart', s: 'RPT-LIB-001' },
        { k: 'sys', l: L('Sistem', 'System'), i: 'cog', s: 'SYS-HUB-001' }
      ],
      mnav: [
        { k: 'home', l: L('Executive', 'Executive'), i: 'gauge', s: 'HOM-EXE-001' },
        { k: 'fin', l: L('Finance', 'Finance'), i: 'coins', s: 'RPT-FIN-001' },
        { k: 'apr', l: L('Persetujuan', 'Approvals'), i: 'filecheck', s: 'APR-INB-001' },
        { k: 'qlt', l: L('Quality', 'Quality'), i: 'shield', s: 'QLT-DSH-001' },
        { k: 'menu', l: L('Menu', 'Menu'), i: 'menu' }
      ],
      extra: [{ k: 'apr', l: L('Persetujuan', 'Approvals'), i: 'filecheck', s: 'APR-INB-001' }],
      hide: [L('Input operasional harian', 'Daily operational input')],
      levels: [1, 2, 3, 4]
    },
    client: {
      n: L('Client Portal', 'Client Portal'), person: 'Grand Vista Hotel', title: L('Housekeeping Manager', 'Housekeeping Manager'),
      group: 'client', device: 'mobile', site: 'Grand Vista Hotel', clientId: 'CL-01',
      q: L('Bagaimana status cucian saya?', 'What is happening with my laundry?'),
      feel: L('Saya bisa melihat status dan riwayat layanan laundry saya dengan jelas.', 'I can clearly see the status and history of my laundry service.'),
      perms: ['home.clt', 'clt.portal', 'clt.pickup', 'clt.invoice', 'clt.complaint'],
      nav: [
        { k: 'home', l: L('Beranda', 'Home'), i: 'home', s: 'HOM-CLT-001' },
        { k: 'pickup', l: L('Pickup', 'Pickup'), i: 'truck', s: 'CLT-PKP-001' },
        { k: 'orders', l: L('Pesanan', 'Orders'), i: 'list', s: 'CLT-ORD-001' },
        { k: 'dlv', l: L('Pengiriman', 'Delivery'), i: 'package', s: 'CLT-DLV-001' },
        { k: 'inv', l: L('Invoice', 'Invoice'), i: 'invoice', s: 'CLT-INV-001' },
        { k: 'cmp', l: L('Komplain', 'Complaint'), i: 'message', s: 'CLT-CMP-001' },
        { k: 'doc', l: L('Dokumen', 'Documents'), i: 'file', s: 'CLT-DOC-001' }
      ],
      mnav: [
        { k: 'home', l: L('Home', 'Home'), i: 'home', s: 'HOM-CLT-001' },
        { k: 'pickup', l: L('Pickup', 'Pickup'), i: 'truck', s: 'CLT-PKP-001' },
        { k: 'orders', l: L('Pesanan', 'Orders'), i: 'list', s: 'CLT-ORD-001' },
        { k: 'inv', l: L('Invoice', 'Invoice'), i: 'invoice', s: 'CLT-INV-001' },
        { k: 'menu', l: L('Menu', 'Menu'), i: 'menu' }
      ],
      hide: [L('Biaya internal', 'Internal cost'), L('Produktivitas karyawan', 'Employee productivity'), L('Masalah internal', 'Internal issues'), L('Margin', 'Margin'), L('Admin internal', 'Internal admin'), L('Klien lain', 'Other clients')],
      levels: [1, 2, 3]
    }
  };
  // `extra`: screens reached from the header shortcut and the home alerts, not the
  // main menu (keeps the approved menus exactly as briefed).
  C.ROLE_ORDER = ['operator', 'driver', 'supervisor', 'opsmgr', 'finance', 'sales', 'owner', 'client'];

  /* ---------- NP-05 Screen archetypes ---------- */
  C.ARCH = {
    T01: { n: L('Role Home', 'Role Home'), i: 'home', d: L('Beranda sesuai peran: perhatian sekarang dan akses cepat.', 'Home per role: what needs attention now and quick access.'),
      used: L('Operator, Supervisor, Finance, Executive, Client', 'Operator, Supervisor, Finance, Executive, Client'),
      header: L('Sapaan + nama, peran dan lokasi', 'Greeting + name, role and site'),
      statusArea: L('Kartu angka Level 1 (yang perlu perhatian sekarang)', 'Level 1 number cards (what needs attention now)'),
      main: L('Frontline: satu CTA utama + daftar tugas. Manajemen: KPI ringkas, alert, drill-down.', 'Frontline: one main CTA + task list. Management: summary KPI, alerts, drill-down.'),
      loading: L('Kerangka kartu angka tampil dulu; angka masuk setelah data siap.', 'Number-card skeleton first; numbers fill in when data is ready.'),
      empty: L('Tidak ada tugas. Semua beres untuk saat ini.', 'No tasks. All clear for now.'),
      responsive: { d: L('Sidebar + KPI 4–6 kolom + panel alert', 'Sidebar + 4–6 KPI columns + alert panel'), t: L('Rail navigasi + kartu besar 2–3 kolom', 'Nav rail + large cards in 2–3 columns'), m: L('Satu kolom: sapaan, angka, CTA, bottom nav', 'Single column: greeting, numbers, CTA, bottom nav') } },
    T02: { n: L('Work Queue', 'Work Queue'), i: 'list', d: L('Daftar pekerjaan berurutan dengan status dan SLA. Tap untuk detail.', 'Ordered list of work with status and SLA. Tap for detail.'),
      used: L('Pickup, Penerimaan, Proses, QC, Packing, Pengiriman', 'Pickup, Receiving, Production, QC, Packing, Delivery'),
      header: L('Nama antrian + jumlah', 'Queue name + count'),
      statusArea: L('Tab status sederhana (Semua / Mendesak) + chip SLA', 'Simple status tabs (All / Urgent) + SLA chip'),
      main: L('Kartu ringkas: klien, berat, bag, status. Diurutkan dari SLA paling dekat.', 'Short cards: client, weight, bags, status. Sorted by nearest SLA.'),
      loading: L('3 kartu kerangka', '3 skeleton cards'),
      empty: L('Belum ada cucian yang menunggu.', 'Nothing is waiting.'),
      responsive: { d: L('Daftar + panel detail di kanan', 'List + detail panel on the right'), t: L('Kartu besar, satu kolom, tab di atas', 'Large cards, one column, tabs on top'), m: L('Kartu penuh lebar, tap untuk buka', 'Full-width cards, tap to open') } },
    T03: { n: L('Task Detail', 'Task Detail'), i: 'file', d: L('Identitas transaksi, klien, status, instruksi, jumlah, waktu dan aksi berikutnya.', 'Transaction identity, client, status, instructions, quantities, times and next action.'),
      used: L('Detail cucian, invoice, status pesanan', 'Load detail, invoice, order status'),
      header: L('ID transaksi + klien + chip status', 'Transaction ID + client + status chip'),
      statusArea: L('Progress tahapan + SLA', 'Stage progress + SLA'),
      main: L('Jumlah penting, instruksi, catatan, bukti, riwayat', 'Key quantities, instructions, notes, proof, history'),
      loading: L('Kerangka header dan progress', 'Header and progress skeleton'),
      empty: L('Data tidak ditemukan. Kembali ke daftar.', 'Record not found. Back to the list.'),
      responsive: { d: L('Dua kolom: detail + panel konteks', 'Two columns: detail + context panel'), t: L('Satu kolom, progress horizontal', 'Single column, horizontal progress'), m: L('Satu kolom, progress ringkas, CTA di bawah', 'Single column, compact progress, CTA at the bottom') } },
    T04: { n: L('Quick Action', 'Quick Action'), i: 'zap', d: L('Satu tugas, satu tombol utama. Data yang sudah ada diisi otomatis.', 'One task, one main button. Known data is prefilled.'),
      used: L('Terima Cucian, Mulai Cuci, Selesai Cuci, Lulus QC, Siap Dikirim', 'Receive Laundry, Start Wash, Finish Wash, Pass QC, Ready to Ship'),
      header: L('Nama aksi + klien • nomor order', 'Action name + client • order number'),
      statusArea: L('Status saat ini + sisa SLA', 'Current status + SLA left'),
      main: L('Hanya field yang wajib, angka besar, foto opsional', 'Only required fields, large numbers, optional photo'),
      loading: L('Tombol utama terkunci + "Menyimpan…" (cegah dobel kirim)', 'Main button locked + "Saving…" (prevents double submit)'),
      empty: L('Tugas ini sudah selesai. Lanjut ke tugas berikutnya.', 'This task is already done. Go to the next task.'),
      responsive: { d: L('Form di tengah + info di samping, CTA besar', 'Centered form + side info, large CTA'), t: L('Field besar 3 kolom, CTA penuh lebar', 'Large fields in 3 columns, full-width CTA'), m: L('Satu kolom, CTA menempel di bawah', 'Single column, CTA pinned at the bottom') } },
    T05: { n: L('Management List', 'Management List'), i: 'grid', d: L('Daftar master/transaksi dengan cari, filter dan aksi per baris.', 'Master/transaction list with search, filters and row actions.'),
      used: L('Klien, Kontrak, Invoice, Kendaraan, User, Master Data', 'Client, Contract, Invoice, Vehicle, User, Master Data'),
      header: L('Judul + jumlah + tombol tambah (jika diizinkan)', 'Title + count + add button (if permitted)'),
      statusArea: L('Filter bar: tanggal, klien, property, status, SLA, cabang, layanan', 'Filter bar: date, client, property, status, SLA, branch, service'),
      main: L('Desktop: tabel. Mobile: kartu.', 'Desktop: table. Mobile: cards.'),
      loading: L('Baris tabel kerangka', 'Skeleton table rows'),
      empty: L('Belum ada data. Tambahkan data pertama.', 'No data yet. Add the first record.'),
      responsive: { d: L('Tabel penuh + filter lanjutan + export', 'Full table + advanced filters + export'), t: L('Tabel ringkas 4–5 kolom', 'Compact 4–5 column table'), m: L('Kartu per baris, filter di sheet', 'Card per row, filters in a sheet') } },
    T06: { n: L('Form', 'Form'), i: 'edit', d: L('Input dan edit data dengan validasi yang mudah dibaca.', 'Input and edit with human-readable validation.'),
      used: L('Tambah Klien, Buat Kontrak, Pembayaran, Master Data', 'Add Client, Create Contract, Payment, Master Data'),
      header: L('Judul form + konteks', 'Form title + context'),
      statusArea: L('Ringkasan error di atas jika ada', 'Error summary on top when present'),
      main: L('Field berkelompok, wajib ditandai *, pesan di bawah field', 'Grouped fields, required marked *, messages under fields'),
      loading: L('Tombol Simpan terkunci + "Menyimpan…"', 'Save button locked + "Saving…"'),
      empty: L('—', '—'),
      responsive: { d: L('Dua kolom field', 'Two field columns'), t: L('Dua kolom, field lebih tinggi', 'Two columns, taller fields'), m: L('Satu kolom, tombol Simpan di bawah', 'Single column, Save at the bottom') } },
    T07: { n: L('Approval', 'Approval'), i: 'filecheck', d: L('Antrian persetujuan dengan nilai lama vs baru dan alasan.', 'Approval queue with old vs new value and reason.'),
      used: L('Perubahan harga, credit note, klaim, penyesuaian stok, koreksi invoice', 'Rate change, credit note, claim, stock adjustment, invoice correction'),
      header: L('Persetujuan + jumlah menunggu', 'Approvals + count waiting'),
      statusArea: L('Tab: Menunggu / Disetujui / Ditolak', 'Tabs: Waiting / Approved / Rejected'),
      main: L('Kartu permintaan: jenis, pengaju, nilai lama → baru, alasan', 'Request card: type, requester, old → new value, reason'),
      loading: L('Tombol Setujui/Tolak terkunci saat diproses', 'Approve/Reject locked while processing'),
      empty: L('Tidak ada yang menunggu persetujuan.', 'Nothing waiting for approval.'),
      responsive: { d: L('Tabel + panel detail', 'Table + detail panel'), t: L('Kartu besar', 'Large cards'), m: L('Kartu, tombol Setujui besar', 'Cards, large Approve button') } },
    T08: { n: L('Analytics / Report', 'Analytics / Report'), i: 'chart', d: L('Ringkasan dulu: KPI, tren, lalu drill-down.', 'Summary first: KPI, trend, then drill-down.'),
      used: L('Revenue, Volume, SLA, Quality, Finance, Produktivitas', 'Revenue, Volume, SLA, Quality, Finance, Productivity'),
      header: L('Judul laporan + periode + export (jika diizinkan)', 'Report title + period + export (if permitted)'),
      statusArea: L('Baris KPI dengan tren', 'KPI row with trends'),
      main: L('Grafik tren + tabel rincian (dimuat belakangan)', 'Trend chart + detail table (lazy loaded)'),
      loading: L('KPI dulu, grafik dimuat belakangan', 'KPI first, charts lazy loaded'),
      empty: L('Belum ada data di periode ini.', 'No data in this period.'),
      responsive: { d: L('KPI 4–6 kolom + grafik + tabel', '4–6 KPI columns + chart + table'), t: L('KPI 2–3 kolom + grafik', '2–3 KPI columns + chart'), m: L('KPI 2 kolom, grafik ringkas, tabel jadi kartu', '2 KPI columns, compact chart, table becomes cards') } },
    T09: { n: L('System / Settings', 'System / Settings'), i: 'cog', d: L('User, peran, izin, workflow, audit, master data dan pengaturan.', 'Users, roles, permissions, workflow, audit, master data and settings.'),
      used: L('Users, Roles, Permissions, Workflow, Audit, Master Data, Settings', 'Users, Roles, Permissions, Workflow, Audit, Master Data, Settings'),
      header: L('Judul + sub-navigasi sistem', 'Title + system sub-navigation'),
      statusArea: L('Ringkasan perubahan terakhir', 'Last change summary'),
      main: L('Daftar/matriks pengaturan, semua perubahan tercatat di audit', 'Settings list/matrix, every change audited'),
      loading: L('Kerangka daftar', 'List skeleton'),
      empty: L('Belum ada data.', 'No data yet.'),
      responsive: { d: L('Sub-nav kiri + konten', 'Left sub-nav + content'), t: L('Sub-nav jadi tab', 'Sub-nav becomes tabs'), m: L('Daftar menu, buka per halaman', 'Menu list, one page at a time') } }
  };

  /* ---------- Shared state copy (NP-06 §17) ---------- */
  C.STATES = {
    default: { t: L('Default', 'Default'), ex: L('Tampilan normal dengan data.', 'Normal view with data.') },
    loading: { t: L('Memuat', 'Loading'), ex: L('Memuat data… Mohon tunggu sebentar.', 'Loading… One moment please.') },
    empty: { t: L('Kosong', 'Empty'), ex: L('Belum ada cucian yang menunggu.', 'Nothing is waiting.') },
    success: { t: L('Berhasil', 'Success'), ex: L('Cucian berhasil diterima.', 'Laundry received.') },
    warning: { t: L('Peringatan', 'Warning'), ex: L('SLA hampir habis.', 'SLA almost up.') },
    error: { t: L('Error', 'Error'), ex: L('Berat belum diisi.', 'Weight is missing.') },
    noperm: { t: L('Tanpa Akses', 'No Permission'), ex: L('Anda tidak memiliki akses untuk tindakan ini.', 'You do not have access to this action.') },
    offline: { t: L('Offline', 'Offline'), ex: L('Koneksi terputus. Data akan dikirim saat online kembali.', 'Connection lost. Data will be sent when you are back online.') }
  };

  /* ---------- Audit events (§23) ---------- */
  C.AUDIT = {
    'AUTH.LOGIN': L('Login', 'Login'),
    'ORD.STATUS': L('Perubahan status', 'Status change'),
    'ORD.PICKUP': L('Pickup selesai', 'Pickup completed'),
    'ORD.RECEIVE': L('Cucian diterima', 'Laundry received'),
    'PRC.START': L('Proses dimulai', 'Process started'),
    'PRC.COMPLETE': L('Proses selesai', 'Process completed'),
    'QC.RESULT': L('Hasil QC', 'QC result'),
    'ISS.CREATE': L('Masalah dibuat', 'Issue created'),
    'APR.DECISION': L('Keputusan persetujuan', 'Approval decision'),
    'PRICE.CHANGE': L('Perubahan harga', 'Price change'),
    'BILL.CHANGE': L('Perubahan billing', 'Billing change'),
    'PAY.RECORD': L('Pembayaran dicatat', 'Payment recorded'),
    'ORD.CANCEL': L('Pembatalan', 'Cancellation'),
    'DOC.VOID': L('Void dokumen', 'Document void'),
    'STK.ADJUST': L('Penyesuaian stok', 'Stock adjustment'),
    'DLV.POD': L('Bukti pengiriman', 'Proof of delivery'),
    'MD.CHANGE': L('Perubahan master data', 'Master data change'),
    'SYS.CHANGE': L('Perubahan pengaturan / akses', 'Settings / access change')
  };
  C.AUDIT_FIELDS = [L('User', 'User'), L('Waktu', 'Timestamp'), L('Event', 'Event'), L('Record', 'Record'), L('Nilai lama', 'Previous value'), L('Nilai baru', 'New value')];

  /* ---------- Order stages (golden workflow, BF-04) ---------- */
  C.STAGES = [
    { k: 'pickup', l: L('Pickup', 'Pickup'), wait: L('Menunggu Pickup', 'Waiting Pickup'), i: 'truck' },
    { k: 'receive', l: L('Terima', 'Receive'), wait: L('Menunggu Diterima', 'Waiting to Receive'), i: 'scale' },
    { k: 'sort', l: L('Sortir', 'Sort'), wait: L('Menunggu Sorting', 'Waiting Sorting'), i: 'basket' },
    { k: 'wash', l: L('Cuci', 'Wash'), wait: L('Menunggu Dicuci', 'Waiting to Wash'), i: 'washer' },
    { k: 'qc', l: L('QC', 'QC'), wait: L('Menunggu QC', 'Waiting QC'), i: 'shield' },
    { k: 'pack', l: L('Packing', 'Packing'), wait: L('Menunggu Packing', 'Waiting Packing'), i: 'package' },
    { k: 'deliver', l: L('Kirim', 'Deliver'), wait: L('Siap Dikirim', 'Ready to Ship'), i: 'truck' },
    { k: 'done', l: L('Selesai', 'Done'), wait: L('Terkirim', 'Delivered'), i: 'checkc' }
  ];
  C.ISSUE_REASONS = [
    { k: 'stain', l: L('Noda', 'Stain') }, { k: 'damage', l: L('Rusak', 'Damage') }, { k: 'smell', l: L('Bau', 'Smell') },
    { k: 'qty', l: L('Selisih jumlah', 'Quantity difference') }, { k: 'process', l: L('Salah proses', 'Wrong process') },
    { k: 'late', l: L('Terlambat', 'Late') }, { k: 'lost', l: L('Hilang', 'Lost') }, { k: 'other', l: L('Lainnya', 'Other') }
  ];

  /* ---------- NP-01 Master sitemap ----------
     Global architecture only. Each child points at the screen that serves it. */
  C.SITEMAP = [
    { n: 1, k: 'home', t: L('Home / Dashboard', 'Home / Dashboard'), i: 'home', items: [
      { t: L('Beranda sesuai peran', 'Home per role'), s: 'HOM-OPR-001' }, { t: L('Notifikasi', 'Notifications'), s: 'HOM-OPR-001' },
      { t: L('Akses cepat', 'Quick access'), s: 'OPS-TSK-001' }, { t: L('Aktivitas terbaru', 'Recent activity'), s: 'OPS-HIS-001' }, { t: L('KPI & insight', 'KPI & insight'), s: 'HOM-EXE-001' }] },
    { n: 2, k: 'ops', t: L('Operasional', 'Operations'), i: 'cog', items: [
      { t: L('Pickup', 'Pickup'), s: 'OPS-PKP-002' }, { t: L('Penerimaan', 'Receiving'), s: 'OPS-RCV-002' }, { t: L('Sorting', 'Sorting'), s: 'OPS-SRT-002' },
      { t: L('Proses Laundry', 'Laundry Process'), s: 'OPS-WSH-002' }, { t: L('QC', 'QC'), s: 'OPS-QC-002' }, { t: L('Packing', 'Packing'), s: 'OPS-PAC-002' }, { t: L('Pengiriman', 'Delivery'), s: 'OPS-DLV-002' }] },
    { n: 3, k: 'com', t: L('Klien & Komersial', 'Clients & Commercial'), i: 'users', items: [
      { t: L('Klien', 'Clients'), s: 'COM-CLI-001' }, { t: L('Property', 'Property'), s: 'COM-PRP-001' }, { t: L('Kontak', 'Contacts'), s: 'COM-CLI-001' },
      { t: L('Kontrak', 'Contracts'), s: 'COM-CTR-001' }, { t: L('Rate Card', 'Rate Card'), s: 'COM-RTC-001' }, { t: L('SLA', 'SLA'), s: 'COM-SLA-001' },
      { t: L('Layanan', 'Service'), s: 'COM-RTC-001' }, { t: L('Pricing', 'Pricing'), s: 'COM-RTC-001' }] },
    { n: 4, k: 'inv', t: L('Supply & Inventory', 'Supply & Inventory'), i: 'package', items: [
      { t: L('Chemical', 'Chemical'), s: 'INV-STK-001' }, { t: L('Consumable', 'Consumable'), s: 'INV-STK-001' }, { t: L('Stok', 'Stock'), s: 'INV-STK-001' },
      { t: L('Mutasi Stok', 'Stock Movement'), s: 'INV-STK-001' }, { t: L('Sesuaikan Stok', 'Adjustment'), s: 'INV-ADJ-001' }, { t: L('Supplier', 'Supplier'), s: 'SYS-MD-001' }] },
    { n: 5, k: 'log', t: L('Fleet & Logistics', 'Fleet & Logistics'), i: 'truck', items: [
      { t: L('Kendaraan', 'Vehicles'), s: 'LOG-FLT-001' }, { t: L('Driver', 'Drivers'), s: 'LOG-FLT-001' }, { t: L('Rute', 'Route'), s: 'LOG-RTE-001' },
      { t: L('Jadwal Pickup', 'Pickup Schedule'), s: 'OPS-PKP-002' }, { t: L('Jadwal Pengiriman', 'Delivery Schedule'), s: 'OPS-DLV-002' }, { t: L('Manifest', 'Manifest'), s: 'LOG-RTE-001' }] },
    { n: 6, k: 'qlt', t: L('Quality', 'Quality'), i: 'shield', items: [
      { t: L('QC', 'QC'), s: 'QLT-DSH-001' }, { t: L('Komplain', 'Complaint'), s: 'QLT-ISS-001' }, { t: L('Klaim', 'Claim'), s: 'APR-INB-001' },
      { t: L('Rewash', 'Rewash'), s: 'QLT-ISS-001' }, { t: L('Hilang', 'Lost'), s: 'QLT-ISS-001' }, { t: L('Rusak', 'Damage'), s: 'QLT-ISS-001' }, { t: L('Ada Masalah', 'Quality Issue'), s: 'QLT-ISS-002' }] },
    { n: 7, k: 'fin', t: L('Finance', 'Finance'), i: 'coins', items: [
      { t: L('Billing', 'Billing'), s: 'FIN-BIL-001' }, { t: L('Invoice', 'Invoice'), s: 'FIN-INV-001' }, { t: L('Pembayaran', 'Payment'), s: 'FIN-PAY-002' },
      { t: L('Piutang', 'Accounts Receivable'), s: 'FIN-AR-001' }, { t: L('Credit Note', 'Credit Note'), s: 'FIN-CN-001' }, { t: L('Koreksi', 'Adjustment'), s: 'APR-INB-001' }, { t: L('Saldo Klien', 'Client Balance'), s: 'FIN-AR-001' }] },
    { n: 8, k: 'rpt', t: L('Reports & Analytics', 'Reports & Analytics'), i: 'chart', items: [
      { t: L('Operasional', 'Operations'), s: 'RPT-OPS-001' }, { t: L('SLA', 'SLA'), s: 'SLA-MON-001' }, { t: L('Quality', 'Quality'), s: 'QLT-DSH-001' },
      { t: L('Klien', 'Client'), s: 'RPT-CLI-001' }, { t: L('Produktivitas', 'Productivity'), s: 'RPT-PPL-001' }, { t: L('Finance', 'Finance'), s: 'RPT-FIN-001' },
      { t: L('Revenue', 'Revenue'), s: 'RPT-COM-001' }, { t: L('Profitabilitas', 'Profitability'), s: 'RPT-FIN-001' }] },
    { n: 9, k: 'sys', t: L('Administration', 'Administration'), i: 'cog', items: [
      { t: L('User', 'Users'), s: 'SYS-USR-001' }, { t: L('Peran', 'Roles'), s: 'SYS-ROL-001' }, { t: L('Izin', 'Permissions'), s: 'SYS-ROL-001' },
      { t: L('Master Data', 'Master Data'), s: 'SYS-MD-001' }, { t: L('Workflow', 'Workflow'), s: 'SYS-SET-001' }, { t: L('Notifikasi', 'Notification'), s: 'SYS-SET-001' },
      { t: L('Audit Log', 'Audit Log'), s: 'SYS-AUD-001' }, { t: L('Bahasa', 'Language'), s: 'SYS-SET-001' }, { t: L('Pengaturan', 'Settings'), s: 'SYS-SET-001' }] },
    { n: 10, k: 'clt', t: L('Client Portal', 'Client Portal'), i: 'hotel', items: [
      { t: L('Request Pickup', 'Request Pickup'), s: 'CLT-PKP-001' }, { t: L('Status Pesanan', 'Order Status'), s: 'CLT-ORD-001' }, { t: L('Pengiriman', 'Delivery'), s: 'CLT-DLV-001' },
      { t: L('Invoice', 'Invoice'), s: 'CLT-INV-001' }, { t: L('Pembayaran', 'Payment'), s: 'CLT-INV-001' }, { t: L('Komplain', 'Complaint'), s: 'CLT-CMP-001' },
      { t: L('Dokumen', 'Documents'), s: 'CLT-DOC-001' }, { t: L('Notifikasi', 'Notifications'), s: 'HOM-CLT-001' }] }
  ];

  /* ---------- NP-04 User flows ---------- */
  C.FLOWS = [
    { k: 'receive', code: 'FL-A', t: L('Penerimaan', 'Receiving'), d: L('Terima cucian dari hotel/klien dengan cepat dan akurat.', 'Receive laundry from hotels/clients quickly and accurately.'), role: 'operator', target: L('3–4 interaksi utama', '3–4 main interactions'), taps: 3,
      steps: [
        { t: L('Beranda', 'Home'), s: 'HOM-OPR-001', i: 'home' },
        { t: L('Cucian Menunggu', 'Loads Waiting'), s: 'OPS-RCV-002', i: 'list', tap: true },
        { t: L('Pilih Cucian', 'Pick a Load'), s: 'OPS-RCV-002', i: 'pointer', tap: true },
        { t: L('Timbang / Hitung', 'Weigh / Count'), s: 'OPS-RCV-001', i: 'scale' },
        { t: L('Terima Cucian', 'Receive Laundry'), s: 'OPS-RCV-001', i: 'check', tap: true, cta: true },
        { t: L('Berhasil', 'Success'), s: 'OPS-RCV-001', i: 'checkc', ok: true }
      ] },
    { k: 'pickup', code: 'FL-B', t: L('Pickup', 'Pickup'), d: L('Ambil cucian kotor dari hotel sesuai jadwal.', 'Collect soiled laundry from hotels on schedule.'), role: 'driver', target: L('4 interaksi utama', '4 main interactions'), taps: 4,
      steps: [
        { t: L('Pickup Hari Ini', 'Today\'s Pickups'), s: 'OPS-PKP-002', i: 'calendar' },
        { t: L('Pilih Hotel', 'Pick Hotel'), s: 'OPS-PKP-002', i: 'hotel', tap: true },
        { t: L('Mulai Pickup', 'Start Pickup'), s: 'OPS-PKP-001', i: 'play', tap: true },
        { t: L('Konfirmasi Barang', 'Confirm Items'), s: 'OPS-PKP-001', i: 'clipboard', tap: true },
        { t: L('Foto jika perlu', 'Photo if needed'), s: 'OPS-PKP-001', i: 'camera', opt: true },
        { t: L('Pickup Selesai', 'Pickup Done'), s: 'OPS-PKP-001', i: 'checkc', tap: true, cta: true, ok: true }
      ] },
    { k: 'wash', code: 'FL-C', t: L('Proses Laundry', 'Washing'), d: L('Jalankan batch cuci sesuai jenis cucian.', 'Run wash batches by laundry type.'), role: 'operator', target: L('3 interaksi utama', '3 main interactions'), taps: 3,
      steps: [
        { t: L('Menunggu Dicuci', 'Waiting to Wash'), s: 'OPS-WSH-002', i: 'list' },
        { t: L('Pilih Batch', 'Pick Batch'), s: 'OPS-WSH-002', i: 'pointer', tap: true },
        { t: L('Mulai Cuci', 'Start Wash'), s: 'OPS-WSH-001', i: 'play', tap: true, cta: true },
        { t: L('Selesai Cuci', 'Finish Wash'), s: 'OPS-WSH-001', i: 'checkc', tap: true, cta: true, ok: true }
      ] },
    { k: 'qc', code: 'FL-D', t: L('QC (Quality Control)', 'QC (Quality Control)'), d: L('Pastikan kualitas cucian sesuai standar.', 'Make sure every load meets the standard.'), role: 'operator', target: L('3 interaksi (lulus) / 4 (masalah)', '3 interactions (pass) / 4 (issue)'), taps: 2,
      steps: [
        { t: L('Menunggu QC', 'Waiting QC'), s: 'OPS-QC-002', i: 'list' },
        { t: L('Pilih Cucian', 'Pick a Load'), s: 'OPS-QC-002', i: 'pointer', tap: true },
        { t: L('Cek', 'Check'), s: 'OPS-QC-001', i: 'search' },
        { t: L('LULUS', 'PASS'), s: 'OPS-QC-001', i: 'checkc', tap: true, cta: true, ok: true, next: L('→ Packing', '→ Packing') },
        { t: L('ADA MASALAH', 'ISSUE'), s: 'OPS-QC-003', i: 'xc', tap: true, bad: true, next: L('→ Pilih alasan → Rewash / Review Supervisor', '→ Choose reason → Rewash / Supervisor review') }
      ] },
    { k: 'deliver', code: 'FL-E', t: L('Pengiriman', 'Delivery'), d: L('Kirim cucian bersih ke hotel/klien tepat waktu.', 'Deliver clean laundry to hotels/clients on time.'), role: 'driver', target: L('4 interaksi utama', '4 main interactions'), taps: 4,
      steps: [
        { t: L('Pengiriman Hari Ini', 'Today\'s Deliveries'), s: 'OPS-DLV-002', i: 'calendar' },
        { t: L('Pilih Tujuan', 'Pick Destination'), s: 'OPS-DLV-002', i: 'pin', tap: true },
        { t: L('Mulai Pengiriman', 'Start Delivery'), s: 'OPS-DLV-001', i: 'play', tap: true },
        { t: L('Serahkan', 'Hand Over'), s: 'OPS-DLV-001', i: 'package', tap: true },
        { t: L('Bukti Pengiriman', 'Proof of Delivery'), s: 'OPS-DLV-003', i: 'camera' },
        { t: L('Selesai', 'Done'), s: 'OPS-DLV-003', i: 'checkc', tap: true, cta: true, ok: true }
      ] },
    { k: 'manage', code: 'FL-F', t: L('Management', 'Management'), d: L('Pantau kinerja dan ambil keputusan berbasis data.', 'Monitor performance and decide from data.'), role: 'opsmgr', target: L('Ringkasan → keputusan dalam 4 langkah', 'Summary → decision in 4 steps'), taps: 4,
      steps: [
        { t: L('Dashboard', 'Dashboard'), s: 'HOM-MGR-001', i: 'grid' },
        { t: L('Alert / KPI', 'Alert / KPI'), s: 'HOM-MGR-001', i: 'alert', tap: true },
        { t: L('Drill-down', 'Drill-down'), s: 'SLA-MON-001', i: 'search', tap: true },
        { t: L('Detail', 'Detail'), s: 'OPS-TRK-001', i: 'file', tap: true },
        { t: L('Aksi / Keputusan', 'Action / Decision'), s: 'APR-INB-001', i: 'filecheck', tap: true, cta: true, ok: true }
      ] }
  ];
  C.FLOW_RULES = [
    L('Aksi berikutnya selalu jelas', 'Next action is always clear'),
    L('Satu tombol utama yang dominan', 'One dominant main button'),
    L('Input seminimal mungkin', 'Minimum input'),
    L('Pakai ulang data yang sudah ada', 'Reuse existing data'),
    L('Tidak mengetik ulang data yang sudah diketahui', 'Never retype known data'),
    L('Kembali dengan aman', 'Safe back navigation'),
    L('Cegah kirim dobel', 'Prevent double submission'),
    L('Konfirmasi berhasil yang jelas', 'Clear success feedback'),
    L('Validasi yang mudah dipahami', 'Understandable validation')
  ];

  /* ---------- NP-06 Screen register ----------
     Short keys: n name · a archetype · dom sitemap domain · lvl IA level ·
     p view permission · flow · pur purpose · entry · hdr header · st status area ·
     main · pri primary action [label, perm] · sec secondary actions · f fields ·
     v validation · r business rules · aud audit events · ok success · warn ·
     err error · emp empty · nb · bf · (nv computed) */
  var S = [];
  function add(o) { S.push(o); }

  /* Role homes (T01) */
  add({ id: 'HOM-OPR-001', n: L('Beranda Operator', 'Operator Home'), a: 'T01', dom: 'home', lvl: 1, p: 'home.op', flow: 'receive',
    pur: L('Menjawab "Apa yang harus saya kerjakan sekarang?"', 'Answers "What should I do now?"'),
    entry: L('Setelah login; tab Home', 'After login; Home tab'),
    hdr: L('Selamat Pagi, Made • Plant Denpasar', 'Good Morning, Made • Plant Denpasar'),
    st: L('12 Cucian Menunggu • 3 Sedang Diproses • 2 Ada Masalah', '12 Loads Waiting • 3 In Process • 2 Issues'),
    main: L('Satu CTA besar ke tugas utama, lalu daftar tugas hari ini per stasiun.', 'One big CTA to the main task, then today\'s tasks per station.'),
    pri: [L('Terima Cucian', 'Receive Laundry'), 'ops.receive'], sec: [[L('Lihat Tugas', 'View Tasks'), 'ops.receive']],
    f: [], v: [], r: [L('Tidak menampilkan analitik perusahaan', 'No company-wide analytics'), L('Angka hanya untuk stasiun yang ditugaskan', 'Counts only for assigned stations')],
    aud: ['AUTH.LOGIN'], ok: L('—', '—'), warn: L('2 cucian SLA hampir habis.', '2 loads close to SLA.'), err: L('Data belum bisa dimuat. Coba lagi.', 'Could not load data. Try again.'), emp: L('Tidak ada tugas. Semua beres untuk saat ini.', 'No tasks. All clear for now.'),
    nb: ['NB-04', 'NB-16'], bf: ['BF-03', 'BF-04'] });
  add({ id: 'HOM-DRV-001', n: L('Hari Ini (Driver)', 'Today (Driver)'), a: 'T01', dom: 'home', lvl: 1, p: 'home.drv',
    pur: L('Menunjukkan pickup dan pengiriman hari ini sesuai urutan rute.', 'Shows today\'s pickups and deliveries in route order.'),
    entry: L('Setelah login; tab Hari Ini', 'After login; Today tab'), hdr: L('Halo, Komang • B 1234 XY', 'Hello, Komang • B 1234 XY'),
    st: L('Pickup tersisa • Pengiriman tersisa • Masalah', 'Pickups left • Deliveries left • Issues'),
    main: L('Stop berikutnya sebagai kartu besar + tombol mulai.', 'Next stop as a big card + start button.'),
    pri: [L('Mulai Stop Berikutnya', 'Start Next Stop'), 'ops.pickup'], sec: [[L('Lihat Rute', 'View Route'), 'log.route']],
    f: [], v: [], r: [L('Urutan stop mengikuti rute yang sudah ditetapkan', 'Stop order follows the assigned route')],
    aud: ['AUTH.LOGIN'], ok: L('—', '—'), warn: L('Pickup Hotel ABC terlambat 15 menit.', 'Hotel ABC pickup is 15 minutes late.'), err: L('Rute belum bisa dimuat. Coba lagi.', 'Route could not load. Try again.'), emp: L('Tidak ada pickup atau pengiriman hari ini.', 'No pickups or deliveries today.'),
    nb: ['NB-03', 'NB-10', 'NB-15'], bf: ['BF-03', 'BF-04'] });
  add({ id: 'HOM-SPV-001', n: L('Dashboard Supervisor', 'Supervisor Dashboard'), a: 'T01', dom: 'home', lvl: 1, p: 'home.spv',
    pur: L('Menjawab "Apa yang perlu perhatian?"', 'Answers "What needs attention?"'),
    entry: L('Setelah login; menu Dashboard', 'After login; Dashboard menu'), hdr: L('Hari Ini • Plant Denpasar', 'Today • Plant Denpasar'),
    st: L('Total beban kerja • Menunggu • Risiko SLA • Rewash', 'Total workload • Waiting • SLA risk • Rewash'),
    main: L('Bottleneck per tahap, tugas tim, masalah terbuka, SLA berisiko.', 'Bottleneck per stage, team tasks, open issues, SLA at risk.'),
    pri: [L('Tinjau Masalah', 'Review Issues'), 'qlt.review'], sec: [[L('Lihat Papan', 'Open Board'), 'ops.board']],
    f: [], v: [], r: [L('Bottleneck = tahap dengan antrian terbesar', 'Bottleneck = stage with the longest queue')],
    aud: ['AUTH.LOGIN'], ok: L('—', '—'), warn: L('3 order berisiko melewati SLA.', '3 orders at SLA risk.'), err: L('Data belum bisa dimuat. Coba lagi.', 'Could not load data. Try again.'), emp: L('Tidak ada antrian. Operasional lancar.', 'No queues. Operations running smoothly.'),
    nb: ['NB-16', 'NB-11'], bf: ['BF-03', 'BF-06'] });
  add({ id: 'HOM-MGR-001', n: L('Dashboard Operations Manager', 'Operations Manager Dashboard'), a: 'T01', dom: 'home', lvl: 1, p: 'home.mgr', flow: 'manage',
    pur: L('Menjawab "Bagaimana operasional berjalan?"', 'Answers "How is the operation performing?"'),
    entry: L('Setelah login; menu Dashboard', 'After login; Dashboard menu'), hdr: L('Operasional • Semua plant', 'Operations • All plants'),
    st: L('Volume • On-time SLA • Rewash rate • Armada aktif', 'Volume • On-time SLA • Rewash rate • Active fleet'),
    main: L('Alert, tren volume, papan tahap, persetujuan menunggu.', 'Alerts, volume trend, stage board, approvals waiting.'),
    pri: [L('Buka Persetujuan', 'Open Approvals'), 'apr.view'], sec: [[L('Lihat SLA', 'View SLA'), 'sla.view']],
    f: [], v: [], r: [L('Ringkasan dulu, detail lewat drill-down', 'Summary first, detail via drill-down')],
    aud: ['AUTH.LOGIN'], ok: L('—', '—'), warn: L('On-time SLA turun di bawah target 95%.', 'On-time SLA below the 95% target.'), err: L('Data belum bisa dimuat. Coba lagi.', 'Could not load data. Try again.'), emp: L('Belum ada aktivitas hari ini.', 'No activity today yet.'),
    nb: ['NB-16'], bf: ['BF-03', 'BF-06'] });
  add({ id: 'HOM-FIN-001', n: L('Dashboard Finance', 'Finance Dashboard'), a: 'T01', dom: 'home', lvl: 1, p: 'home.fin',
    pur: L('Menjawab "Apa yang perlu ditagih atau ditagihkan?"', 'Answers "What needs billing or collection?"'),
    entry: L('Setelah login; menu Dashboard Finance', 'After login; Finance Dashboard menu'), hdr: L('Finance • Oktober 2026', 'Finance • October 2026'),
    st: L('Siap ditagih • Invoice terbuka • Jatuh tempo • Terlambat bayar', 'Ready to bill • Open invoices • Due • Overdue'),
    main: L('Daftar siap ditagih, piutang per umur, pembayaran terbaru.', 'Ready-to-bill list, receivables by age, latest payments.'),
    pri: [L('Buat Tagihan', 'Create Bills'), 'fin.bill'], sec: [[L('Catat Pembayaran', 'Record Payment'), 'fin.payment']],
    f: [], v: [], r: [L('Harga mengikuti kontrak + rate card (terkunci)', 'Prices follow contract + rate card (locked)')],
    aud: ['AUTH.LOGIN'], ok: L('—', '—'), warn: L('3 invoice lewat jatuh tempo.', '3 invoices are overdue.'), err: L('Data belum bisa dimuat. Coba lagi.', 'Could not load data. Try again.'), emp: L('Tidak ada yang perlu ditagih.', 'Nothing to bill.'),
    nb: ['NB-12', 'NB-13'], bf: ['BF-03', 'BF-01'] });
  add({ id: 'HOM-SAL-001', n: L('Dashboard Sales / Account', 'Sales / Account Dashboard'), a: 'T01', dom: 'home', lvl: 1, p: 'home.sal',
    pur: L('Menunjukkan klien, kontrak dan renewal yang perlu perhatian.', 'Shows clients, contracts and renewals that need attention.'),
    entry: L('Setelah login; menu Dashboard', 'After login; Dashboard menu'), hdr: L('Akun Saya • Andi Pratama', 'My Accounts • Andi Pratama'),
    st: L('Klien aktif • Kontrak habis ≤ 60 hari • SLA klien • Komplain', 'Active clients • Contracts ending ≤ 60 days • Client SLA • Complaints'),
    main: L('Renewal mendatang, klien dengan SLA turun, dokumen tertunda.', 'Upcoming renewals, clients with SLA drop, pending documents.'),
    pri: [L('Lihat Renewal', 'View Renewals'), 'com.renewal'], sec: [[L('Tambah Klien', 'Add Client'), 'com.client.edit']],
    f: [], v: [], r: [L('Perubahan harga harus lewat persetujuan', 'Price changes need approval')],
    aud: ['AUTH.LOGIN'], ok: L('—', '—'), warn: L('2 kontrak berakhir dalam 30 hari.', '2 contracts end within 30 days.'), err: L('Data belum bisa dimuat. Coba lagi.', 'Could not load data. Try again.'), emp: L('Belum ada klien.', 'No clients yet.'),
    nb: ['NB-01'], bf: ['BF-03', 'BF-01', 'BF-07'] });
  add({ id: 'HOM-EXE-001', n: L('Executive Dashboard', 'Executive Dashboard'), a: 'T01', dom: 'home', lvl: 1, p: 'home.exe',
    pur: L('Menjawab "Bagaimana kinerja bisnis?"', 'Answers "How is the business performing?"'),
    entry: L('Setelah login; menu Executive', 'After login; Executive menu'), hdr: L('Executive • Bulan berjalan', 'Executive • Month to date'),
    st: L('Revenue • Volume • On-time SLA • Quality • Piutang • Profitabilitas', 'Revenue • Volume • On-time SLA • Quality • AR • Profitability'),
    main: L('Alert, performa klien, tren, drill-down. Tidak semua laporan sekaligus.', 'Alerts, client performance, trend, drill-down. Not every report at once.'),
    pri: [L('Buka Persetujuan', 'Open Approvals'), 'apr.view'], sec: [[L('Lihat Laporan', 'View Reports'), 'rpt.exec']],
    f: [], v: [], r: [L('Tampilan pertama hanya ringkasan', 'First view is a summary only')],
    aud: ['AUTH.LOGIN'], ok: L('—', '—'), warn: L('Piutang > 60 hari naik.', 'AR > 60 days is rising.'), err: L('Data belum bisa dimuat. Coba lagi.', 'Could not load data. Try again.'), emp: L('Belum ada data bulan ini.', 'No data this month yet.'),
    nb: ['NB-16'], bf: ['BF-01', 'BF-06'] });
  add({ id: 'HOM-CLT-001', n: L('Beranda Klien', 'Client Home'), a: 'T01', dom: 'clt', lvl: 1, p: 'home.clt',
    pur: L('Menjawab "Bagaimana status cucian saya?"', 'Answers "What is happening with my laundry?"'),
    entry: L('Login portal klien', 'Client portal login'), hdr: L('Grand Vista Hotel', 'Grand Vista Hotel'),
    st: L('Pesanan berjalan • Pengiriman berikutnya • Invoice terbuka • SLA', 'Orders in progress • Next delivery • Open invoices • SLA'),
    main: L('Status pesanan aktif, pengiriman berikutnya, notifikasi.', 'Active order status, next delivery, notifications.'),
    pri: [L('Minta Pickup', 'Request Pickup'), 'clt.pickup'], sec: [[L('Lihat Pesanan', 'View Orders'), 'clt.portal']],
    f: [], v: [], r: [L('Hanya data milik klien ini', 'Only this client\'s own data'), L('Tanpa biaya internal, margin, produktivitas, atau klien lain', 'No internal cost, margin, productivity or other clients')],
    aud: ['AUTH.LOGIN'], ok: L('—', '—'), warn: L('Pengiriman hari ini mundur 30 menit.', 'Today\'s delivery is 30 minutes behind.'), err: L('Data belum bisa dimuat. Coba lagi.', 'Could not load data. Try again.'), emp: L('Belum ada pesanan aktif.', 'No active orders.'),
    nb: ['NB-19'], bf: ['BF-03', 'BF-01'] });

  /* Frontline operations */
  add({ id: 'OPS-TSK-001', n: L('Tugas Saya', 'My Tasks'), a: 'T02', dom: 'ops', lvl: 2, p: 'home.op',
    pur: L('Semua antrian kerja saya dalam satu daftar.', 'All my work queues in one list.'),
    entry: L('Menu Tugas Saya / tab Tugas', 'My Tasks menu / Tasks tab'), hdr: L('Tugas Saya', 'My Tasks'),
    st: L('Jumlah per antrian + chip SLA', 'Count per queue + SLA chip'), main: L('Kartu antrian: Menunggu Diterima, Sorting, Dicuci, QC, Packing.', 'Queue cards: Waiting to Receive, Sorting, Washing, QC, Packing.'),
    pri: [L('Buka antrian', 'Open queue'), 'home.op'], sec: [],
    f: [], v: [], r: [L('Antrian tampil hanya jika user punya izin stasiun tersebut', 'A queue shows only if the user has that station permission')],
    aud: [], ok: L('—', '—'), warn: L('Ada cucian yang SLA-nya hampir habis.', 'Some loads are close to SLA.'), err: L('Tugas belum bisa dimuat. Coba lagi.', 'Tasks could not load. Try again.'), emp: L('Tidak ada tugas saat ini.', 'No tasks right now.'),
    nb: ['NB-04', 'NB-06', 'NB-07', 'NB-08', 'NB-09'], bf: ['BF-04'] });
  add({ id: 'OPS-PKP-002', n: L('Pickup Hari Ini', 'Today\'s Pickups'), a: 'T02', dom: 'ops', lvl: 2, p: 'ops.pickup', flow: 'pickup',
    pur: L('Daftar hotel yang harus dijemput hari ini.', 'Hotels to collect from today.'),
    entry: L('Hari Ini → Pickup / tab Pickup', 'Today → Pickup / Pickup tab'), hdr: L('Pickup Hari Ini', 'Today\'s Pickups'),
    st: L('Sisa pickup + jam jadwal', 'Pickups left + scheduled time'), main: L('Kartu hotel: jam, alamat, perkiraan bag.', 'Hotel card: time, address, estimated bags.'),
    pri: [L('Pilih hotel', 'Pick hotel'), 'ops.pickup'], sec: [],
    f: [], v: [], r: [L('Urut sesuai rute', 'Sorted by route')], aud: [],
    ok: L('—', '—'), warn: L('Jadwal pickup lewat 15 menit.', 'Pickup is 15 minutes late.'), err: L('Daftar belum bisa dimuat. Coba lagi.', 'List could not load. Try again.'), emp: L('Tidak ada pickup hari ini.', 'No pickups today.'),
    nb: ['NB-02', 'NB-03'], bf: ['BF-04'] });
  add({ id: 'OPS-PKP-001', n: L('Pickup', 'Pickup'), a: 'T04', dom: 'ops', lvl: 2, p: 'ops.pickup', flow: 'pickup',
    pur: L('Mulai, konfirmasi barang, dan selesaikan pickup di hotel.', 'Start, confirm items and finish a pickup at the hotel.'),
    entry: L('Pickup Hari Ini → pilih hotel', 'Today\'s Pickups → pick hotel'), hdr: L('Pickup • Hotel ABC', 'Pickup • Hotel ABC'),
    st: L('Menunggu Pickup → Sedang Pickup → Selesai', 'Waiting → Picking up → Done'),
    main: L('Jumlah bag (diisi dari jadwal), jenis cucian, foto opsional, catatan.', 'Bag count (prefilled from schedule), laundry type, optional photo, note.'),
    pri: [L('Mulai Pickup / Pickup Selesai', 'Start Pickup / Pickup Done'), 'ops.pickup'], sec: [[L('Ada Masalah', 'Report Issue'), 'ops.issue']],
    f: [L('Jumlah bag', 'Bag count'), L('Jenis cucian', 'Laundry type'), L('Foto (opsional)', 'Photo (optional)'), L('Catatan', 'Note')],
    v: [L('Jumlah bag harus lebih dari 0.', 'Bag count must be more than 0.')],
    r: [L('Order ID dibuat otomatis', 'Order ID is generated automatically'), L('Pickup tidak bisa diselesaikan dua kali', 'A pickup cannot be completed twice')],
    aud: ['ORD.STATUS', 'ORD.PICKUP'], ok: L('Pickup selesai. Lanjut ke stop berikutnya.', 'Pickup done. On to the next stop.'), warn: L('Jumlah bag berbeda dari jadwal.', 'Bag count differs from the schedule.'), err: L('Jumlah bag harus lebih dari 0.', 'Bag count must be more than 0.'), emp: L('Pickup ini sudah selesai.', 'This pickup is already done.'),
    nb: ['NB-03'], bf: ['BF-04', 'BF-05'] });
  add({ id: 'OPS-RCV-002', n: L('Cucian Menunggu', 'Loads Waiting'), a: 'T02', dom: 'ops', lvl: 2, p: 'ops.receive', flow: 'receive',
    pur: L('Antrian cucian yang sudah tiba di plant dan menunggu diterima.', 'Loads that arrived at the plant and wait to be received.'),
    entry: L('Beranda → Terima Cucian / Tugas Saya', 'Home → Receive Laundry / My Tasks'), hdr: L('Cucian Menunggu', 'Loads Waiting'),
    st: L('Jumlah menunggu + SLA terdekat', 'Count waiting + nearest SLA'), main: L('Kartu: hotel, perkiraan kg, bag, status.', 'Card: hotel, estimated kg, bags, status.'),
    pri: [L('Pilih cucian', 'Pick a load'), 'ops.receive'], sec: [],
    f: [], v: [], r: [L('Urut dari SLA paling dekat', 'Sorted by nearest SLA')], aud: [],
    ok: L('—', '—'), warn: L('SLA hampir habis.', 'SLA almost up.'), err: L('Antrian belum bisa dimuat. Coba lagi.', 'Queue could not load. Try again.'), emp: L('Belum ada cucian yang menunggu.', 'Nothing is waiting.'),
    nb: ['NB-04'], bf: ['BF-04'] });
  add({ id: 'OPS-RCV-001', n: L('Terima Cucian', 'Receive Laundry'), a: 'T04', dom: 'ops', lvl: 2, p: 'ops.receive', flow: 'receive',
    pur: L('Mencatat penerimaan cucian dari pickup: timbang, hitung, terima.', 'Record laundry received from pickup: weigh, count, receive.'),
    entry: L('Tugas Saya / Cucian Menunggu → pilih cucian', 'My Tasks / Loads Waiting → pick a load'),
    hdr: L('Terima Cucian • Hotel ABC • Order #RCV2024-00123', 'Receive Laundry • Hotel ABC • Order #RCV2024-00123'),
    st: L('Menunggu Diterima • SLA 5 jam 18 menit tersisa', 'Waiting to Receive • 5 h 18 min SLA left'),
    main: L('Berat (kg), jumlah bag (diisi dari pickup), jenis cucian (diisi dari pickup), catatan klien, foto opsional.', 'Weight (kg), bag count (from pickup), laundry type (from pickup), client note, optional photo.'),
    pri: [L('Terima Cucian', 'Receive Laundry'), 'ops.receive'], sec: [[L('Ada Masalah', 'Report Issue'), 'ops.issue']],
    f: [L('Berat total (kg) *', 'Total weight (kg) *'), L('Jumlah bag *', 'Bag count *'), L('Jenis cucian', 'Laundry type'), L('Catatan', 'Note'), L('Foto (opsional)', 'Photo (optional)')],
    v: [L('Berat wajib diisi.', 'Weight is required.'), L('Berat harus lebih dari 0.', 'Weight must be more than 0.'), L('Jumlah bag harus lebih dari 0.', 'Bag count must be more than 0.')],
    r: [L('Selisih berat > 5% dari pickup butuh persetujuan supervisor (Aturan 5)', 'Weight difference > 5% vs pickup needs supervisor approval (Rule 5)'), L('Status tidak boleh dilompati (Aturan 3)', 'Status cannot skip a step (Rule 3)'), L('Satu kali terima per order (idempotent)', 'One receive per order (idempotent)')],
    aud: ['ORD.RECEIVE', 'ORD.STATUS'], ok: L('Cucian berhasil diterima. Lanjut ke Sorting.', 'Laundry received. Next: Sorting.'), warn: L('Berat berbeda lebih dari 5% dari pickup. Perlu persetujuan supervisor.', 'Weight differs more than 5% from pickup. Supervisor approval needed.'),
    err: L('Berat wajib diisi.', 'Weight is required.'), emp: L('Cucian ini sudah diterima.', 'This load is already received.'),
    nb: ['NB-04', 'NB-05'], bf: ['BF-04', 'BF-05'] });
  add({ id: 'OPS-SRT-002', n: L('Menunggu Sorting', 'Waiting Sorting'), a: 'T02', dom: 'ops', lvl: 2, p: 'ops.sort',
    pur: L('Antrian cucian yang sudah diterima dan siap dipilah.', 'Received loads ready to be sorted.'), entry: L('Tugas Saya → Sorting', 'My Tasks → Sorting'), hdr: L('Menunggu Sorting', 'Waiting Sorting'),
    st: L('Jumlah + SLA', 'Count + SLA'), main: L('Kartu: hotel, kg, bag, jenis.', 'Card: hotel, kg, bags, type.'), pri: [L('Pilih cucian', 'Pick a load'), 'ops.sort'], sec: [],
    f: [], v: [], r: [L('Urut dari SLA paling dekat', 'Sorted by nearest SLA')], aud: [], ok: L('—', '—'), warn: L('SLA hampir habis.', 'SLA almost up.'), err: L('Antrian belum bisa dimuat. Coba lagi.', 'Queue could not load. Try again.'), emp: L('Tidak ada cucian untuk disortir.', 'Nothing to sort.'),
    nb: ['NB-06'], bf: ['BF-04'] });
  add({ id: 'OPS-SRT-001', n: L('Sorting', 'Sorting'), a: 'T04', dom: 'ops', lvl: 2, p: 'ops.sort',
    pur: L('Konfirmasi pemilahan per jenis dan lanjut ke proses cuci.', 'Confirm sorting by type and move to washing.'), entry: L('Menunggu Sorting → pilih cucian', 'Waiting Sorting → pick a load'),
    hdr: L('Sorting • Hotel • Order', 'Sorting • Hotel • Order'), st: L('Menunggu Sorting • SLA', 'Waiting Sorting • SLA'), main: L('Jumlah per kategori (diisi dari penerimaan) + catatan noda.', 'Count per category (from receiving) + stain note.'),
    pri: [L('Selesai Sorting', 'Sorting Done'), 'ops.sort'], sec: [[L('Ada Masalah', 'Report Issue'), 'ops.issue']],
    f: [L('Kategori & jumlah', 'Category & count'), L('Catatan noda', 'Stain note')], v: [L('Minimal satu kategori terisi.', 'Fill in at least one category.')],
    r: [L('Selisih jumlah vs penerimaan ditandai (Aturan 4)', 'Count difference vs receiving is flagged (Rule 4)')], aud: ['PRC.COMPLETE', 'ORD.STATUS'],
    ok: L('Sorting selesai. Lanjut ke Proses Cuci.', 'Sorting done. Next: Washing.'), warn: L('Jumlah berbeda dari penerimaan.', 'Count differs from receiving.'), err: L('Minimal satu kategori terisi.', 'Fill in at least one category.'), emp: L('Cucian ini sudah disortir.', 'This load is already sorted.'),
    nb: ['NB-06', 'NB-05'], bf: ['BF-04', 'BF-05'] });
  add({ id: 'OPS-WSH-002', n: L('Menunggu Dicuci', 'Waiting to Wash'), a: 'T02', dom: 'ops', lvl: 2, p: 'ops.wash', flow: 'wash',
    pur: L('Batch yang siap dicuci dan yang sedang dicuci.', 'Batches ready to wash and in the wash.'), entry: L('Tugas Saya → Proses Laundry', 'My Tasks → Laundry Process'), hdr: L('Menunggu Dicuci', 'Waiting to Wash'),
    st: L('Menunggu • Sedang dicuci', 'Waiting • Washing'), main: L('Kartu batch: hotel, kg, program cuci, mesin.', 'Batch card: hotel, kg, wash program, machine.'), pri: [L('Pilih batch', 'Pick batch'), 'ops.wash'], sec: [],
    f: [], v: [], r: [L('Batch sedang dicuci tampil paling atas', 'Batches in the wash show first')], aud: [], ok: L('—', '—'), warn: L('Mesin 3 melebihi waktu program.', 'Machine 3 is over program time.'), err: L('Antrian belum bisa dimuat. Coba lagi.', 'Queue could not load. Try again.'), emp: L('Tidak ada batch menunggu.', 'No batches waiting.'),
    nb: ['NB-07'], bf: ['BF-04'] });
  add({ id: 'OPS-WSH-001', n: L('Proses Cuci', 'Washing'), a: 'T04', dom: 'ops', lvl: 2, p: 'ops.wash', flow: 'wash',
    pur: L('Mulai dan selesaikan batch cuci.', 'Start and finish a wash batch.'), entry: L('Menunggu Dicuci → pilih batch', 'Waiting to Wash → pick batch'),
    hdr: L('Proses Cuci • Hotel • Batch', 'Washing • Hotel • Batch'), st: L('Menunggu Dicuci → Sedang Dicuci → Selesai', 'Waiting → Washing → Done'), main: L('Mesin dan program (diisi otomatis dari jenis cucian), waktu mulai.', 'Machine and program (auto from laundry type), start time.'),
    pri: [L('Mulai Cuci / Selesai Cuci', 'Start Wash / Finish Wash'), 'ops.wash'], sec: [[L('Ada Masalah', 'Report Issue'), 'ops.issue']],
    f: [L('Mesin', 'Machine'), L('Program cuci', 'Wash program')], v: [L('Pilih mesin terlebih dahulu.', 'Choose a machine first.')],
    r: [L('Selesai Cuci hanya muncul setelah Mulai Cuci', 'Finish Wash only appears after Start Wash'), L('Program mengikuti jenis cucian', 'Program follows laundry type')], aud: ['PRC.START', 'PRC.COMPLETE', 'ORD.STATUS'],
    ok: L('Cuci selesai. Lanjut ke QC.', 'Wash done. Next: QC.'), warn: L('Waktu cuci melebihi program.', 'Wash time is over the program.'), err: L('Pilih mesin terlebih dahulu.', 'Choose a machine first.'), emp: L('Batch ini sudah selesai dicuci.', 'This batch is already washed.'),
    nb: ['NB-07'], bf: ['BF-04', 'BF-05'] });
  add({ id: 'OPS-QC-002', n: L('Menunggu QC', 'Waiting QC'), a: 'T02', dom: 'ops', lvl: 2, p: 'ops.qc', flow: 'qc',
    pur: L('Cucian yang selesai diproses dan menunggu pemeriksaan kualitas.', 'Processed loads waiting for quality check.'), entry: L('Tugas Saya → QC / menu QC', 'My Tasks → QC / QC menu'), hdr: L('Menunggu QC', 'Waiting QC'),
    st: L('Jumlah + rewash', 'Count + rewash'), main: L('Kartu: hotel, kg, jenis, tanda rewash.', 'Card: hotel, kg, type, rewash flag.'), pri: [L('Pilih cucian', 'Pick a load'), 'ops.qc'], sec: [],
    f: [], v: [], r: [L('Cucian rewash ditandai', 'Rewash loads are flagged')], aud: [], ok: L('—', '—'), warn: L('SLA hampir habis.', 'SLA almost up.'), err: L('Antrian belum bisa dimuat. Coba lagi.', 'Queue could not load. Try again.'), emp: L('Tidak ada cucian menunggu QC.', 'Nothing waiting for QC.'),
    nb: ['NB-08'], bf: ['BF-04'] });
  add({ id: 'OPS-QC-001', n: L('Cek QC', 'QC Check'), a: 'T04', dom: 'ops', lvl: 2, p: 'ops.qc', flow: 'qc',
    pur: L('Putuskan LULUS atau ADA MASALAH untuk satu cucian.', 'Decide PASS or ISSUE for one load.'), entry: L('Menunggu QC → pilih cucian', 'Waiting QC → pick a load'),
    hdr: L('Cek QC • Hotel • Order', 'QC Check • Hotel • Order'), st: L('Menunggu QC • SLA', 'Waiting QC • SLA'), main: L('Checklist singkat: bersih, kering, rapi, jumlah sesuai.', 'Short checklist: clean, dry, neat, count matches.'),
    pri: [L('LULUS', 'PASS'), 'ops.qc'], sec: [[L('ADA MASALAH', 'ISSUE'), 'ops.qc']],
    f: [L('Checklist QC', 'QC checklist')], v: [], r: [L('LULUS → Packing', 'PASS → Packing'), L('ADA MASALAH → pilih alasan → Rewash / Review Supervisor', 'ISSUE → choose reason → Rewash / Supervisor review'), L('Rewash kembali ke QC (Aturan 6)', 'Rewash returns to QC (Rule 6)')],
    aud: ['QC.RESULT', 'ORD.STATUS'], ok: L('QC lulus. Lanjut ke Packing.', 'QC passed. Next: Packing.'), warn: L('Cucian ini sudah 1x rewash.', 'This load has been rewashed once.'), err: L('Hasil QC belum tersimpan. Coba lagi.', 'QC result not saved. Try again.'), emp: L('Cucian ini sudah di-QC.', 'This load is already checked.'),
    nb: ['NB-08'], bf: ['BF-04', 'BF-05'] });
  add({ id: 'OPS-QC-003', n: L('Alasan Masalah QC', 'QC Issue Reason'), a: 'T04', dom: 'qlt', lvl: 2, p: 'ops.qc', flow: 'qc',
    pur: L('Pilih alasan terstruktur dan tindak lanjut (Rewash atau Review Supervisor).', 'Choose a structured reason and follow-up (Rewash or Supervisor review).'), entry: L('Cek QC → ADA MASALAH', 'QC Check → ISSUE'),
    hdr: L('Ada Masalah • Hotel • Order', 'Issue • Hotel • Order'), st: L('QC gagal', 'QC failed'), main: L('Pilihan alasan (tombol besar), jumlah item, foto, catatan.', 'Reason choices (big buttons), item count, photo, note.'),
    pri: [L('Kirim ke Rewash', 'Send to Rewash'), 'ops.qc'], sec: [[L('Minta Review Supervisor', 'Ask Supervisor Review'), 'ops.qc']],
    f: [L('Alasan *', 'Reason *'), L('Jumlah item', 'Item count'), L('Foto', 'Photo'), L('Catatan', 'Note')], v: [L('Pilih alasan terlebih dahulu.', 'Choose a reason first.')],
    r: [L('Alasan utama dipilih, bukan diketik (Aturan 6)', 'Main reason is picked, not typed (Rule 6)'), L('Rusak/Hilang selalu ke Review Supervisor', 'Damage/Lost always go to Supervisor review')],
    aud: ['QC.RESULT', 'ISS.CREATE', 'ORD.STATUS'], ok: L('Masalah tercatat. Cucian dikirim ke Rewash.', 'Issue recorded. Load sent to Rewash.'), warn: L('Rusak/Hilang akan ditinjau supervisor.', 'Damage/Lost will be reviewed by a supervisor.'), err: L('Pilih alasan terlebih dahulu.', 'Choose a reason first.'), emp: L('—', '—'),
    nb: ['NB-08', 'NB-11'], bf: ['BF-04', 'BF-05'] });
  add({ id: 'OPS-PAC-002', n: L('Menunggu Packing', 'Waiting Packing'), a: 'T02', dom: 'ops', lvl: 2, p: 'ops.pack',
    pur: L('Cucian lulus QC yang siap dikemas.', 'QC-passed loads ready to pack.'), entry: L('Tugas Saya → Packing', 'My Tasks → Packing'), hdr: L('Menunggu Packing', 'Waiting Packing'),
    st: L('Jumlah + jadwal kirim', 'Count + delivery time'), main: L('Kartu: hotel, kg, bag, jam kirim.', 'Card: hotel, kg, bags, delivery time.'), pri: [L('Pilih cucian', 'Pick a load'), 'ops.pack'], sec: [],
    f: [], v: [], r: [L('Urut dari jadwal kirim', 'Sorted by delivery time')], aud: [], ok: L('—', '—'), warn: L('Jadwal kirim kurang dari 1 jam.', 'Delivery is less than 1 hour away.'), err: L('Antrian belum bisa dimuat. Coba lagi.', 'Queue could not load. Try again.'), emp: L('Tidak ada cucian untuk dikemas.', 'Nothing to pack.'),
    nb: ['NB-09'], bf: ['BF-04'] });
  add({ id: 'OPS-PAC-001', n: L('Packing / Siap Dikirim', 'Packing / Ready to Ship'), a: 'T04', dom: 'ops', lvl: 2, p: 'ops.pack',
    pur: L('Konfirmasi jumlah bag bersih dan tandai Siap Dikirim.', 'Confirm clean bag count and mark Ready to Ship.'), entry: L('Menunggu Packing → pilih cucian', 'Waiting Packing → pick a load'),
    hdr: L('Packing • Hotel • Order', 'Packing • Hotel • Order'), st: L('Menunggu Packing • jam kirim', 'Waiting Packing • delivery time'), main: L('Jumlah bag bersih (diisi dari penerimaan), label.', 'Clean bag count (from receiving), label.'),
    pri: [L('Siap Dikirim', 'Ready to Ship'), 'ops.pack'], sec: [[L('Ada Masalah', 'Report Issue'), 'ops.issue']],
    f: [L('Jumlah bag bersih *', 'Clean bag count *')], v: [L('Jumlah bag harus lebih dari 0.', 'Bag count must be more than 0.')],
    r: [L('Jumlah dicocokkan dengan penerimaan (Aturan 4)', 'Count is matched against receiving (Rule 4)')], aud: ['PRC.COMPLETE', 'ORD.STATUS'],
    ok: L('Siap dikirim. Masuk ke manifest pengiriman.', 'Ready to ship. Added to the delivery manifest.'), warn: L('Jumlah bag berbeda dari penerimaan.', 'Bag count differs from receiving.'), err: L('Jumlah bag harus lebih dari 0.', 'Bag count must be more than 0.'), emp: L('Cucian ini sudah siap dikirim.', 'This load is already ready to ship.'),
    nb: ['NB-09', 'NB-05'], bf: ['BF-04', 'BF-05'] });
  add({ id: 'OPS-DLV-002', n: L('Pengiriman Hari Ini', 'Today\'s Deliveries'), a: 'T02', dom: 'ops', lvl: 2, p: 'ops.deliver', flow: 'deliver',
    pur: L('Tujuan pengiriman hari ini sesuai urutan rute.', 'Today\'s delivery destinations in route order.'), entry: L('Hari Ini → Pengiriman', 'Today → Delivery'), hdr: L('Pengiriman Hari Ini', 'Today\'s Deliveries'),
    st: L('Sisa tujuan + jam janji', 'Destinations left + promised time'), main: L('Kartu tujuan: hotel, bag, jam.', 'Destination card: hotel, bags, time.'), pri: [L('Pilih tujuan', 'Pick destination'), 'ops.deliver'], sec: [],
    f: [], v: [], r: [L('Hanya order berstatus Siap Dikirim', 'Only Ready to Ship orders')], aud: [], ok: L('—', '—'), warn: L('Janji kirim kurang dari 1 jam.', 'Promised time less than 1 hour away.'), err: L('Daftar belum bisa dimuat. Coba lagi.', 'List could not load. Try again.'), emp: L('Tidak ada pengiriman hari ini.', 'No deliveries today.'),
    nb: ['NB-10'], bf: ['BF-04'] });
  add({ id: 'OPS-DLV-001', n: L('Pengiriman', 'Delivery'), a: 'T04', dom: 'ops', lvl: 2, p: 'ops.deliver', flow: 'deliver',
    pur: L('Mulai pengiriman dan serahkan ke hotel.', 'Start a delivery and hand it over to the hotel.'), entry: L('Pengiriman Hari Ini → pilih tujuan', 'Today\'s Deliveries → pick destination'),
    hdr: L('Pengiriman • Hotel • Order', 'Delivery • Hotel • Order'), st: L('Siap Dikirim → Dalam Perjalanan → Diserahkan', 'Ready → On the way → Handed over'), main: L('Alamat, kontak, jumlah bag (dari packing).', 'Address, contact, bag count (from packing).'),
    pri: [L('Mulai Pengiriman / Serahkan', 'Start Delivery / Hand Over'), 'ops.deliver'], sec: [[L('Ada Masalah', 'Report Issue'), 'ops.issue']],
    f: [], v: [], r: [L('Serahkan hanya setelah Mulai Pengiriman', 'Hand over only after Start Delivery')], aud: ['ORD.STATUS'],
    ok: L('Diserahkan. Ambil bukti pengiriman.', 'Handed over. Take proof of delivery.'), warn: L('Janji kirim terlewat.', 'Promised time passed.'), err: L('Status belum tersimpan. Coba lagi.', 'Status not saved. Try again.'), emp: L('Pengiriman ini sudah selesai.', 'This delivery is already done.'),
    nb: ['NB-10'], bf: ['BF-04'] });
  add({ id: 'OPS-DLV-003', n: L('Bukti Pengiriman', 'Proof of Delivery'), a: 'T04', dom: 'ops', lvl: 2, p: 'ops.deliver', flow: 'deliver',
    pur: L('Catat penerima dan foto/tanda tangan sebagai bukti.', 'Record the receiver and photo/signature as proof.'), entry: L('Pengiriman → Serahkan', 'Delivery → Hand Over'),
    hdr: L('Bukti Pengiriman • Hotel • Order', 'Proof of Delivery • Hotel • Order'), st: L('Diserahkan', 'Handed over'), main: L('Nama penerima, foto/tanda tangan, jumlah bag diterima.', 'Receiver name, photo/signature, bags received.'),
    pri: [L('Selesai', 'Done'), 'ops.deliver'], sec: [[L('Ada Masalah', 'Report Issue'), 'ops.issue']],
    f: [L('Nama penerima *', 'Receiver name *'), L('Foto / tanda tangan *', 'Photo / signature *'), L('Jumlah bag diterima', 'Bags received')], v: [L('Nama penerima wajib diisi.', 'Receiver name is required.'), L('Ambil foto atau tanda tangan.', 'Take a photo or signature.')],
    r: [L('Order tidak bisa selesai tanpa bukti', 'Order cannot close without proof'), L('Bukti tampil di portal klien', 'Proof shows in the client portal')], aud: ['DLV.POD', 'ORD.STATUS'],
    ok: L('Pengiriman selesai. Bukti tersimpan.', 'Delivery done. Proof saved.'), warn: L('Jumlah bag diterima berbeda.', 'Bags received differ.'), err: L('Nama penerima wajib diisi.', 'Receiver name is required.'), emp: L('Bukti sudah tersimpan.', 'Proof already saved.'),
    nb: ['NB-10'], bf: ['BF-04', 'BF-05'] });
  add({ id: 'OPS-ISS-001', n: L('Ada Masalah', 'Report Issue'), a: 'T06', dom: 'qlt', lvl: 2, p: 'ops.issue',
    pur: L('Laporkan masalah dengan satu tombol lalu pilih alasan.', 'Report a problem with one button, then choose a reason.'), entry: L('Menu Ada Masalah / tombol Ada Masalah di setiap tugas', 'Report Issue menu / Report Issue button on any task'),
    hdr: L('Ada Masalah', 'Report Issue'), st: L('Order terkait (otomatis jika dari tugas)', 'Related order (automatic when opened from a task)'), main: L('Alasan (tombol), order, foto, catatan singkat.', 'Reason (buttons), order, photo, short note.'),
    pri: [L('Kirim Laporan', 'Send Report'), 'ops.issue'], sec: [[L('Batal', 'Cancel'), 'ops.issue']],
    f: [L('Alasan *', 'Reason *'), L('Order', 'Order'), L('Foto', 'Photo'), L('Catatan', 'Note')], v: [L('Pilih alasan terlebih dahulu.', 'Choose a reason first.'), L('Pilih order terkait.', 'Choose the related order.')],
    r: [L('Alasan utama dipilih, bukan diketik (Aturan 6)', 'Main reason is picked, not typed (Rule 6)'), L('Masalah langsung tampil di dashboard supervisor', 'Issue appears on the supervisor dashboard at once')], aud: ['ISS.CREATE'],
    ok: L('Laporan terkirim. Supervisor sudah diberi tahu.', 'Report sent. Supervisor notified.'), warn: L('—', '—'), err: L('Pilih alasan terlebih dahulu.', 'Choose a reason first.'), emp: L('—', '—'),
    nb: ['NB-11'], bf: ['BF-04', 'BF-05'] });
  add({ id: 'OPS-HIS-001', n: L('Riwayat', 'History'), a: 'T02', dom: 'home', lvl: 3, p: 'ops.history',
    pur: L('Apa yang sudah saya kerjakan hari ini dan sebelumnya.', 'What I have done today and before.'), entry: L('Menu Riwayat', 'History menu'), hdr: L('Riwayat', 'History'),
    st: L('Hari ini / 7 hari', 'Today / 7 days'), main: L('Kartu aktivitas: aksi, order, jam. Tap untuk detail.', 'Activity card: action, order, time. Tap for detail.'), pri: [L('Buka detail', 'Open detail'), 'ops.detail'], sec: [],
    f: [], v: [], r: [L('Frontline hanya melihat aktivitas sendiri', 'Frontline sees only their own activity')], aud: [], ok: L('—', '—'), warn: L('—', '—'), err: L('Riwayat belum bisa dimuat. Coba lagi.', 'History could not load. Try again.'), emp: L('Belum ada aktivitas.', 'No activity yet.'),
    nb: ['NB-18'], bf: ['BF-05'] });
  add({ id: 'OPS-TRK-001', n: L('Detail Cucian', 'Load Detail'), a: 'T03', dom: 'ops', lvl: 3, p: 'ops.detail',
    pur: L('Identitas, status, jumlah, waktu, catatan, bukti dan riwayat satu order.', 'Identity, status, quantities, times, notes, proof and history of one order.'), entry: L('Tap kartu di antrian, riwayat, alert atau SLA', 'Tap a card in a queue, history, alert or SLA'),
    hdr: L('#Order • Hotel • chip status', '#Order • Hotel • status chip'), st: L('Progress 8 tahap + SLA', '8-stage progress + SLA'), main: L('Jumlah, jenis, instruksi klien, bukti, timeline audit.', 'Quantities, type, client instructions, proof, audit timeline.'),
    pri: [L('Aksi berikutnya (sesuai tahap & izin)', 'Next action (by stage & permission)'), 'ops.detail'], sec: [[L('Ada Masalah', 'Report Issue'), 'ops.issue']],
    f: [], v: [], r: [L('Tombol aksi hanya muncul jika user punya izin tahap itu', 'Action button only shows if the user has that stage permission')], aud: [], ok: L('—', '—'), warn: L('SLA hampir habis.', 'SLA almost up.'), err: L('Detail belum bisa dimuat. Coba lagi.', 'Detail could not load. Try again.'), emp: L('Order tidak ditemukan.', 'Order not found.'),
    nb: ['NB-18', 'NB-16'], bf: ['BF-04', 'BF-05', 'BF-07'] });
  add({ id: 'LOG-RTE-001', n: L('Rute Hari Ini', 'Today\'s Route'), a: 'T02', dom: 'log', lvl: 2, p: 'log.route',
    pur: L('Urutan stop pickup & pengiriman (manifest) hari ini.', 'Today\'s pickup & delivery stops in order (manifest).'), entry: L('Menu Rute', 'Route menu'), hdr: L('Rute Hari Ini • B 1234 XY', 'Today\'s Route • B 1234 XY'),
    st: L('Stop selesai / total', 'Stops done / total'), main: L('Daftar stop bernomor: jenis, hotel, jam, status.', 'Numbered stops: type, hotel, time, status.'), pri: [L('Buka stop', 'Open stop'), 'log.route'], sec: [],
    f: [], v: [], r: [L('Urutan ditetapkan oleh logistik', 'Order is set by logistics')], aud: [], ok: L('—', '—'), warn: L('Stop berikutnya terlambat.', 'Next stop is late.'), err: L('Rute belum bisa dimuat. Coba lagi.', 'Route could not load. Try again.'), emp: L('Belum ada rute hari ini.', 'No route today.'),
    nb: ['NB-15'], bf: ['BF-04'] });

  /* Supervisor / manager */
  add({ id: 'OPS-BRD-001', n: L('Papan Operasional', 'Operations Board'), a: 'T02', dom: 'ops', lvl: 2, p: 'ops.board',
    pur: L('Semua order per tahap dalam satu papan untuk menemukan bottleneck.', 'All orders by stage on one board to spot bottlenecks.'), entry: L('Menu Operasional', 'Operations menu'), hdr: L('Operasional', 'Operations'),
    st: L('Jumlah per tahap + SLA berisiko', 'Count per stage + SLA at risk'), main: L('Kolom tahap (desktop) / tab tahap (iPad & mobile).', 'Stage columns (desktop) / stage tabs (iPad & mobile).'), pri: [L('Buka order', 'Open order'), 'ops.detail'], sec: [],
    f: [], v: [], r: [L('Status mengikuti urutan yang valid (Aturan 3)', 'Status follows the valid order (Rule 3)')], aud: [], ok: L('—', '—'), warn: L('Antrian QC melebihi kapasitas.', 'QC queue over capacity.'), err: L('Papan belum bisa dimuat. Coba lagi.', 'Board could not load. Try again.'), emp: L('Tidak ada order aktif.', 'No active orders.'),
    nb: ['NB-16', 'NB-07'], bf: ['BF-04', 'BF-06'] });
  add({ id: 'OPS-TEAM-001', n: L('Tugas Tim', 'Team Tasks'), a: 'T05', dom: 'ops', lvl: 2, p: 'ops.team',
    pur: L('Siapa mengerjakan apa, dan siapa yang bisa dipindah ke bottleneck.', 'Who does what, and who can move to the bottleneck.'), entry: L('Menu Tugas Tim', 'Team Tasks menu'), hdr: L('Tugas Tim • shift pagi', 'Team Tasks • morning shift'),
    st: L('Hadir • Stasiun • Selesai hari ini', 'Present • Station • Done today'), main: L('Daftar staf: stasiun, tugas berjalan, selesai.', 'Staff list: station, running task, done.'), pri: [L('Pindahkan Stasiun', 'Move Station'), 'ops.team'], sec: [],
    f: [L('Stasiun', 'Station')], v: [], r: [L('Perpindahan stasiun tercatat di audit', 'Station moves are audited')], aud: ['SYS.CHANGE'], ok: L('Stasiun diperbarui.', 'Station updated.'), warn: L('Stasiun QC kekurangan orang.', 'QC station is understaffed.'), err: L('Perubahan belum tersimpan. Coba lagi.', 'Change not saved. Try again.'), emp: L('Belum ada staf hadir.', 'No staff present yet.'),
    nb: ['NB-16', 'NB-17'], bf: ['BF-03'] });
  add({ id: 'QLT-ISS-001', n: L('Masalah', 'Issues'), a: 'T05', dom: 'qlt', lvl: 2, p: 'qlt.view',
    pur: L('Semua masalah, komplain, rewash, rusak dan hilang yang terbuka.', 'All open issues, complaints, rewash, damage and lost items.'), entry: L('Menu Masalah / alert', 'Issues menu / alert'), hdr: L('Masalah', 'Issues'),
    st: L('Terbuka • Menunggu review • Selesai', 'Open • Waiting review • Closed'), main: L('Daftar: order, alasan, sumber, umur, status.', 'List: order, reason, source, age, status.'), pri: [L('Tinjau', 'Review'), 'qlt.review'], sec: [],
    f: [], v: [], r: [L('Komplain klien terhubung ke order', 'Client complaints link to the order')], aud: [], ok: L('—', '—'), warn: L('Ada masalah terbuka lebih dari 4 jam.', 'Some issues are open more than 4 hours.'), err: L('Daftar belum bisa dimuat. Coba lagi.', 'List could not load. Try again.'), emp: L('Tidak ada masalah terbuka.', 'No open issues.'),
    nb: ['NB-11'], bf: ['BF-04', 'BF-05'] });
  add({ id: 'QLT-ISS-002', n: L('Review Masalah', 'Issue Review'), a: 'T07', dom: 'qlt', lvl: 4, p: 'qlt.review',
    pur: L('Putuskan tindak lanjut masalah: Rewash, Ajukan Klaim, atau Tutup.', 'Decide the follow-up: Rewash, Raise Claim, or Close.'), entry: L('Masalah → Tinjau', 'Issues → Review'), hdr: L('Review Masalah • Order', 'Issue Review • Order'),
    st: L('Alasan + umur masalah', 'Reason + issue age'), main: L('Bukti foto, catatan, riwayat order.', 'Photo proof, note, order history.'), pri: [L('Rewash', 'Rewash'), 'qlt.review'], sec: [[L('Ajukan Klaim', 'Raise Claim'), 'qlt.review'], [L('Tutup', 'Close'), 'qlt.review']],
    f: [L('Keputusan', 'Decision'), L('Catatan', 'Note')], v: [L('Catatan wajib untuk klaim.', 'A note is required for a claim.')],
    r: [L('Klaim butuh persetujuan manager/owner', 'Claims need manager/owner approval')], aud: ['APR.DECISION', 'ORD.STATUS'], ok: L('Keputusan tersimpan.', 'Decision saved.'), warn: L('Masalah ini sudah 2x rewash.', 'This issue has been rewashed twice.'), err: L('Catatan wajib untuk klaim.', 'A note is required for a claim.'), emp: L('Masalah ini sudah diputuskan.', 'This issue is already decided.'),
    nb: ['NB-11', 'NB-08'], bf: ['BF-05'] });
  add({ id: 'SLA-MON-001', n: L('Monitor SLA', 'SLA Monitor'), a: 'T08', dom: 'rpt', lvl: 1, p: 'sla.view', flow: 'manage',
    pur: L('Order yang berisiko atau sudah melewati SLA.', 'Orders at risk of or past SLA.'), entry: L('Menu SLA / alert SLA', 'SLA menu / SLA alert'), hdr: L('SLA', 'SLA'),
    st: L('On-time • Berisiko • Terlambat', 'On-time • At risk • Late'), main: L('Daftar order berisiko dengan sisa waktu, tren on-time.', 'At-risk orders with time left, on-time trend.'), pri: [L('Buka order', 'Open order'), 'ops.detail'], sec: [],
    f: [], v: [], r: [L('Berisiko = sisa SLA ≤ 1 jam; terlambat = lewat SLA', 'At risk = ≤ 1 h SLA left; late = past SLA')], aud: [], ok: L('—', '—'), warn: L('SLA tersisa 1 jam.', '1 hour of SLA left.'), err: L('Data SLA belum bisa dimuat. Coba lagi.', 'SLA data could not load. Try again.'), emp: L('Semua order on-time.', 'All orders on time.'),
    nb: ['NB-16'], bf: ['BF-06'] });
  add({ id: 'RPT-OPS-001', n: L('Laporan Operasional', 'Operations Report'), a: 'T08', dom: 'rpt', lvl: 4, p: 'rpt.ops',
    pur: L('Volume, throughput per tahap, SLA dan rewash per periode.', 'Volume, stage throughput, SLA and rewash per period.'), entry: L('Menu Laporan / Operasional', 'Reports / Operations menu'), hdr: L('Laporan Operasional', 'Operations Report'),
    st: L('Volume • On-time • Rewash • Kg/jam', 'Volume • On-time • Rewash • Kg/hour'), main: L('Tren 14 hari + tabel per klien.', '14-day trend + table per client.'), pri: [L('Export', 'Export'), 'rpt.export'], sec: [],
    f: [L('Periode', 'Period'), L('Klien', 'Client'), L('Cabang', 'Branch')], v: [], r: [L('Grafik dimuat belakangan (lazy)', 'Charts are lazy loaded')], aud: [], ok: L('—', '—'), warn: L('—', '—'), err: L('Laporan belum bisa dimuat. Coba lagi.', 'Report could not load. Try again.'), emp: L('Belum ada data di periode ini.', 'No data in this period.'),
    nb: ['NB-16'], bf: ['BF-06'] });
  add({ id: 'LOG-FLT-001', n: L('Armada & Driver', 'Fleet & Drivers'), a: 'T05', dom: 'log', lvl: 4, p: 'log.view',
    pur: L('Kendaraan, driver dan rute yang aktif.', 'Active vehicles, drivers and routes.'), entry: L('Menu Logistik', 'Logistics menu'), hdr: L('Logistik', 'Logistics'),
    st: L('Aktif • Servis • Stop selesai', 'Active • Service • Stops done'), main: L('Tabel kendaraan: plat, driver, rute, progress, status.', 'Vehicle table: plate, driver, route, progress, status.'), pri: [L('Tambah Kendaraan', 'Add Vehicle'), 'sys.master'], sec: [],
    f: [], v: [], r: [L('Kendaraan servis tidak bisa diberi rute', 'Vehicles in service cannot get a route')], aud: ['MD.CHANGE'], ok: L('—', '—'), warn: L('1 kendaraan jadwal servis minggu ini.', '1 vehicle due for service this week.'), err: L('Data armada belum bisa dimuat. Coba lagi.', 'Fleet data could not load. Try again.'), emp: L('Belum ada kendaraan.', 'No vehicles yet.'),
    nb: ['NB-15'], bf: ['BF-07'] });
  add({ id: 'PRD-DSH-001', n: L('Produksi', 'Production'), a: 'T08', dom: 'rpt', lvl: 4, p: 'prd.view',
    pur: L('Kapasitas, throughput mesin dan antrian produksi.', 'Capacity, machine throughput and production queue.'), entry: L('Menu Produksi', 'Production menu'), hdr: L('Produksi', 'Production'),
    st: L('Kg hari ini • Utilisasi mesin • Antrian • Rewash', 'Kg today • Machine utilisation • Queue • Rewash'), main: L('Throughput per jam, utilisasi per mesin.', 'Throughput per hour, utilisation per machine.'), pri: [L('Export', 'Export'), 'rpt.export'], sec: [],
    f: [L('Periode', 'Period')], v: [], r: [], aud: [], ok: L('—', '—'), warn: L('Utilisasi mesin > 90%.', 'Machine utilisation > 90%.'), err: L('Data produksi belum bisa dimuat. Coba lagi.', 'Production data could not load. Try again.'), emp: L('Belum ada produksi hari ini.', 'No production today yet.'),
    nb: ['NB-07', 'NB-16'], bf: ['BF-06'] });
  add({ id: 'QLT-DSH-001', n: L('Quality', 'Quality'), a: 'T08', dom: 'qlt', lvl: 4, p: 'qlt.view',
    pur: L('Rewash rate, komplain, klaim, rusak dan hilang.', 'Rewash rate, complaints, claims, damage and loss.'), entry: L('Menu Quality', 'Quality menu'), hdr: L('Quality', 'Quality'),
    st: L('QC lulus • Rewash • Komplain • Klaim', 'QC pass • Rewash • Complaints • Claims'), main: L('Tren rewash, alasan terbanyak, daftar masalah.', 'Rewash trend, top reasons, issue list.'), pri: [L('Lihat Masalah', 'View Issues'), 'qlt.review'], sec: [[L('Export', 'Export'), 'rpt.export']],
    f: [L('Periode', 'Period'), L('Klien', 'Client')], v: [], r: [], aud: [], ok: L('—', '—'), warn: L('Rewash di atas 3%.', 'Rewash above 3%.'), err: L('Data quality belum bisa dimuat. Coba lagi.', 'Quality data could not load. Try again.'), emp: L('Belum ada data quality.', 'No quality data yet.'),
    nb: ['NB-08', 'NB-11', 'NB-16'], bf: ['BF-06'] });
  add({ id: 'INV-STK-001', n: L('Stok', 'Stock'), a: 'T05', dom: 'inv', lvl: 4, p: 'inv.view',
    pur: L('Stok chemical & consumable, mutasi, dan stok di bawah minimum.', 'Chemical & consumable stock, movement and items below minimum.'), entry: L('Menu Inventory', 'Inventory menu'), hdr: L('Inventory', 'Inventory'),
    st: L('Di bawah minimum • Mutasi hari ini', 'Below minimum • Movements today'), main: L('Tabel: item, kategori, stok, minimum, satuan, status.', 'Table: item, category, stock, minimum, unit, status.'), pri: [L('Sesuaikan Stok', 'Adjust Stock'), 'inv.adjust.request'], sec: [[L('Export', 'Export'), 'rpt.export']],
    f: [], v: [], r: [L('Penyesuaian stok butuh persetujuan', 'Stock adjustments need approval')], aud: [], ok: L('—', '—'), warn: L('3 item di bawah stok minimum.', '3 items below minimum stock.'), err: L('Data stok belum bisa dimuat. Coba lagi.', 'Stock data could not load. Try again.'), emp: L('Belum ada item stok.', 'No stock items yet.'),
    nb: ['NB-14'], bf: ['BF-07'] });
  add({ id: 'INV-ADJ-001', n: L('Sesuaikan Stok', 'Stock Adjustment'), a: 'T06', dom: 'inv', lvl: 4, p: 'inv.adjust.request',
    pur: L('Ajukan penyesuaian stok dengan alasan.', 'Request a stock adjustment with a reason.'), entry: L('Stok → Sesuaikan Stok', 'Stock → Adjust Stock'), hdr: L('Sesuaikan Stok', 'Stock Adjustment'),
    st: L('Stok sistem saat ini', 'Current system stock'), main: L('Item, stok fisik, alasan.', 'Item, physical count, reason.'), pri: [L('Ajukan', 'Submit'), 'inv.adjust.request'], sec: [[L('Batal', 'Cancel'), 'inv.adjust.request']],
    f: [L('Item *', 'Item *'), L('Stok fisik *', 'Physical count *'), L('Alasan *', 'Reason *')], v: [L('Stok fisik wajib diisi.', 'Physical count is required.'), L('Alasan wajib dipilih.', 'Reason is required.')],
    r: [L('Masuk antrian persetujuan; stok berubah setelah disetujui', 'Goes to approval; stock changes only after approval')], aud: ['STK.ADJUST'], ok: L('Pengajuan terkirim untuk disetujui.', 'Request sent for approval.'), warn: L('Selisih lebih dari 10%.', 'Difference is more than 10%.'), err: L('Stok fisik wajib diisi.', 'Physical count is required.'), emp: L('—', '—'),
    nb: ['NB-14', 'NB-18'], bf: ['BF-05'] });
  add({ id: 'APR-INB-001', n: L('Persetujuan', 'Approvals'), a: 'T07', dom: 'home', lvl: 4, p: 'apr.view', flow: 'manage',
    pur: L('Semua permintaan yang menunggu keputusan saya.', 'Every request waiting for my decision.'), entry: L('Menu Persetujuan / alert', 'Approvals menu / alert'), hdr: L('Persetujuan', 'Approvals'),
    st: L('Menunggu • Disetujui • Ditolak', 'Waiting • Approved • Rejected'), main: L('Kartu: jenis, pengaju, nilai lama → baru, alasan.', 'Card: type, requester, old → new value, reason.'),
    pri: [L('Setujui', 'Approve'), 'apr.view'], sec: [[L('Tolak', 'Reject'), 'apr.view']],
    f: [L('Catatan keputusan', 'Decision note')], v: [L('Alasan penolakan wajib diisi.', 'A rejection reason is required.')],
    r: [L('Hanya jenis yang sesuai izin yang tampil: harga (com.rate.approve), credit note (fin.cn.approve), klaim (qlt.claim.approve), stok (inv.adjust.approve), koreksi invoice (fin.invoice.fix.approve), selisih berat (ops.weight.override)', 'Only types the user may approve are shown: price (com.rate.approve), credit note (fin.cn.approve), claim (qlt.claim.approve), stock (inv.adjust.approve), invoice correction (fin.invoice.fix.approve), weight difference (ops.weight.override)'),
      L('Pengaju tidak bisa menyetujui permintaannya sendiri', 'Requesters cannot approve their own request')],
    aud: ['APR.DECISION', 'PRICE.CHANGE', 'STK.ADJUST', 'BILL.CHANGE'], ok: L('Keputusan tersimpan dan pengaju diberi tahu.', 'Decision saved and requester notified.'), warn: L('Permintaan ini menunggu lebih dari 2 hari.', 'This request has waited more than 2 days.'), err: L('Alasan penolakan wajib diisi.', 'A rejection reason is required.'), emp: L('Tidak ada yang menunggu persetujuan.', 'Nothing waiting for approval.'),
    nb: ['NB-18', 'NB-11', 'NB-12', 'NB-14'], bf: ['BF-05'] });

  /* Finance */
  add({ id: 'FIN-BIL-001', n: L('Siap Ditagih', 'Ready to Bill'), a: 'T05', dom: 'fin', lvl: 2, p: 'fin.bill',
    pur: L('Order terkirim yang belum dibuatkan invoice.', 'Delivered orders not yet invoiced.'), entry: L('Menu Billing', 'Billing menu'), hdr: L('Billing', 'Billing'),
    st: L('Order siap ditagih • Nilai', 'Orders ready • Value'), main: L('Tabel per klien: order, kg, nilai (dari rate card).', 'Table per client: orders, kg, value (from rate card).'), pri: [L('Buat Invoice', 'Create Invoice'), 'fin.bill'], sec: [],
    f: [], v: [], r: [L('Nilai dihitung dari kontrak + rate card (Aturan 8)', 'Value comes from contract + rate card (Rule 8)'), L('Order tanpa bukti pengiriman tidak bisa ditagih', 'Orders without proof of delivery cannot be billed')], aud: ['BILL.CHANGE'],
    ok: L('Invoice dibuat.', 'Invoice created.'), warn: L('2 order belum punya bukti pengiriman.', '2 orders have no proof of delivery.'), err: L('Invoice belum bisa dibuat. Coba lagi.', 'Invoice could not be created. Try again.'), emp: L('Tidak ada yang perlu ditagih.', 'Nothing to bill.'),
    nb: ['NB-12'], bf: ['BF-05', 'BF-07'] });
  add({ id: 'FIN-INV-001', n: L('Invoice', 'Invoices'), a: 'T05', dom: 'fin', lvl: 2, p: 'fin.invoice',
    pur: L('Semua invoice dengan status bayar dan jatuh tempo.', 'All invoices with payment status and due dates.'), entry: L('Menu Invoice', 'Invoice menu'), hdr: L('Invoice', 'Invoices'),
    st: L('Terbuka • Sebagian • Lunas • Terlambat', 'Open • Partial • Paid • Overdue'), main: L('Tabel: nomor, klien, tanggal, jatuh tempo, nilai, sisa, status.', 'Table: number, client, date, due, amount, balance, status.'), pri: [L('Buka invoice', 'Open invoice'), 'fin.invoice'], sec: [[L('Export', 'Export'), 'rpt.export']],
    f: [L('Tanggal', 'Date'), L('Klien', 'Client'), L('Status', 'Status')], v: [], r: [L('Invoice tidak dihapus, hanya void dengan alasan (Aturan 2)', 'Invoices are never deleted, only voided with a reason (Rule 2)')], aud: [], ok: L('—', '—'), warn: L('3 invoice lewat jatuh tempo.', '3 invoices overdue.'), err: L('Daftar invoice belum bisa dimuat. Coba lagi.', 'Invoices could not load. Try again.'), emp: L('Belum ada invoice.', 'No invoices yet.'),
    nb: ['NB-12'], bf: ['BF-05'] });
  add({ id: 'FIN-INV-002', n: L('Detail Invoice', 'Invoice Detail'), a: 'T03', dom: 'fin', lvl: 3, p: 'fin.invoice',
    pur: L('Rincian invoice, order terkait, pembayaran dan riwayat.', 'Invoice lines, linked orders, payments and history.'), entry: L('Invoice → pilih invoice', 'Invoices → pick invoice'), hdr: L('#Invoice • Klien • status', '#Invoice • Client • status'),
    st: L('Nilai • Dibayar • Sisa • Jatuh tempo', 'Amount • Paid • Balance • Due'), main: L('Baris order (kg × harga kontrak), pembayaran, audit.', 'Order lines (kg × contract price), payments, audit.'), pri: [L('Catat Pembayaran', 'Record Payment'), 'fin.payment'], sec: [[L('Ajukan Koreksi', 'Request Correction'), 'fin.invoice'], [L('Ajukan Credit Note', 'Request Credit Note'), 'fin.cn.request']],
    f: [], v: [], r: [L('Harga terkunci dari kontrak', 'Prices locked from contract'), L('Koreksi lewat persetujuan', 'Corrections go through approval')], aud: ['BILL.CHANGE', 'DOC.VOID'], ok: L('—', '—'), warn: L('Invoice lewat jatuh tempo.', 'Invoice is overdue.'), err: L('Detail belum bisa dimuat. Coba lagi.', 'Detail could not load. Try again.'), emp: L('Invoice tidak ditemukan.', 'Invoice not found.'),
    nb: ['NB-12', 'NB-13'], bf: ['BF-05', 'BF-07'] });
  add({ id: 'FIN-PAY-002', n: L('Pembayaran', 'Payments'), a: 'T05', dom: 'fin', lvl: 2, p: 'fin.payment',
    pur: L('Pembayaran masuk dan pencocokan ke invoice.', 'Incoming payments and matching to invoices.'), entry: L('Menu Pembayaran', 'Payment menu'), hdr: L('Pembayaran', 'Payments'),
    st: L('Diterima bulan ini • Belum dicocokkan', 'Received this month • Unmatched'), main: L('Tabel: tanggal, klien, invoice, metode, nilai.', 'Table: date, client, invoice, method, amount.'), pri: [L('Catat Pembayaran', 'Record Payment'), 'fin.payment'], sec: [[L('Export', 'Export'), 'rpt.export']],
    f: [], v: [], r: [L('Cocokkan invoice vs pembayaran (Aturan 4)', 'Match invoice vs payment (Rule 4)')], aud: [], ok: L('—', '—'), warn: L('1 pembayaran belum dicocokkan.', '1 payment is unmatched.'), err: L('Daftar belum bisa dimuat. Coba lagi.', 'List could not load. Try again.'), emp: L('Belum ada pembayaran.', 'No payments yet.'),
    nb: ['NB-13'], bf: ['BF-05'] });
  add({ id: 'FIN-PAY-001', n: L('Catat Pembayaran', 'Record Payment'), a: 'T06', dom: 'fin', lvl: 2, p: 'fin.payment',
    pur: L('Catat pembayaran klien ke invoice.', 'Record a client payment against an invoice.'), entry: L('Pembayaran / Detail Invoice → Catat Pembayaran', 'Payments / Invoice Detail → Record Payment'), hdr: L('Catat Pembayaran', 'Record Payment'),
    st: L('Sisa tagihan invoice', 'Invoice balance'), main: L('Invoice (diisi), tanggal, metode, nilai, referensi.', 'Invoice (prefilled), date, method, amount, reference.'), pri: [L('Simpan Pembayaran', 'Save Payment'), 'fin.payment'], sec: [[L('Batal', 'Cancel'), 'fin.payment']],
    f: [L('Invoice *', 'Invoice *'), L('Tanggal bayar *', 'Payment date *'), L('Metode *', 'Method *'), L('Nilai *', 'Amount *'), L('Referensi', 'Reference')],
    v: [L('Nilai wajib diisi.', 'Amount is required.'), L('Nilai tidak boleh melebihi sisa tagihan.', 'Amount cannot exceed the balance.'), L('Pilih metode pembayaran.', 'Choose a payment method.')],
    r: [L('Satu kali simpan per referensi (cegah dobel)', 'One save per reference (no duplicates)'), L('Sebagian bayar mengubah status ke Sebagian', 'Partial payment sets status to Partial')], aud: ['PAY.RECORD', 'BILL.CHANGE'],
    ok: L('Pembayaran tersimpan.', 'Payment saved.'), warn: L('Pembayaran sebagian. Sisa tetap tercatat.', 'Partial payment. Balance stays open.'), err: L('Nilai tidak boleh melebihi sisa tagihan.', 'Amount cannot exceed the balance.'), emp: L('—', '—'),
    nb: ['NB-13'], bf: ['BF-05'] });
  add({ id: 'FIN-AR-001', n: L('Piutang (AR)', 'Receivables (AR)'), a: 'T08', dom: 'fin', lvl: 2, p: 'fin.ar',
    pur: L('Umur piutang per klien dan saldo klien.', 'Receivable ageing per client and client balance.'), entry: L('Menu Piutang', 'AR menu'), hdr: L('Piutang', 'Receivables'),
    st: L('Total • 0–30 • 31–60 • > 60 hari', 'Total • 0–30 • 31–60 • > 60 days'), main: L('Bucket umur + tabel saldo per klien.', 'Age buckets + balance table per client.'), pri: [L('Export', 'Export'), 'rpt.export'], sec: [],
    f: [L('Per tanggal', 'As of date')], v: [], r: [], aud: [], ok: L('—', '—'), warn: L('Piutang > 60 hari naik.', 'AR > 60 days is rising.'), err: L('Data piutang belum bisa dimuat. Coba lagi.', 'AR data could not load. Try again.'), emp: L('Tidak ada piutang.', 'No receivables.'),
    nb: ['NB-13', 'NB-16'], bf: ['BF-06'] });
  add({ id: 'FIN-CN-001', n: L('Credit Note', 'Credit Notes'), a: 'T05', dom: 'fin', lvl: 2, p: 'fin.cn.request',
    pur: L('Credit note yang diajukan dan statusnya.', 'Requested credit notes and their status.'), entry: L('Menu Credit Note', 'Credit Note menu'), hdr: L('Credit Note', 'Credit Notes'),
    st: L('Menunggu • Disetujui • Ditolak', 'Waiting • Approved • Rejected'), main: L('Tabel: nomor, invoice, klien, nilai, alasan, status.', 'Table: number, invoice, client, amount, reason, status.'), pri: [L('Ajukan Credit Note', 'Request Credit Note'), 'fin.cn.request'], sec: [],
    f: [], v: [], r: [L('Finance mengajukan, owner menyetujui', 'Finance requests, owner approves')], aud: [], ok: L('—', '—'), warn: L('—', '—'), err: L('Daftar belum bisa dimuat. Coba lagi.', 'List could not load. Try again.'), emp: L('Belum ada credit note.', 'No credit notes yet.'),
    nb: ['NB-12', 'NB-13'], bf: ['BF-05'] });
  add({ id: 'FIN-CN-002', n: L('Ajukan Credit Note', 'Request Credit Note'), a: 'T06', dom: 'fin', lvl: 2, p: 'fin.cn.request',
    pur: L('Ajukan credit note terhadap invoice dengan alasan.', 'Request a credit note against an invoice with a reason.'), entry: L('Credit Note / Detail Invoice', 'Credit Notes / Invoice Detail'), hdr: L('Ajukan Credit Note', 'Request Credit Note'),
    st: L('Nilai invoice', 'Invoice amount'), main: L('Invoice, nilai, alasan (pilihan), catatan.', 'Invoice, amount, reason (choice), note.'), pri: [L('Ajukan', 'Submit'), 'fin.cn.request'], sec: [[L('Batal', 'Cancel'), 'fin.cn.request']],
    f: [L('Invoice *', 'Invoice *'), L('Nilai *', 'Amount *'), L('Alasan *', 'Reason *'), L('Catatan', 'Note')], v: [L('Nilai wajib diisi.', 'Amount is required.'), L('Nilai tidak boleh melebihi nilai invoice.', 'Amount cannot exceed the invoice amount.')],
    r: [L('Masuk antrian persetujuan owner', 'Goes to owner approval')], aud: ['BILL.CHANGE'], ok: L('Credit note diajukan.', 'Credit note requested.'), warn: L('—', '—'), err: L('Nilai wajib diisi.', 'Amount is required.'), emp: L('—', '—'),
    nb: ['NB-12'], bf: ['BF-05'] });
  add({ id: 'RPT-FIN-001', n: L('Laporan Finance', 'Finance Report'), a: 'T08', dom: 'rpt', lvl: 4, p: 'rpt.fin',
    pur: L('Revenue, penagihan, piutang dan profitabilitas.', 'Revenue, collection, receivables and profitability.'), entry: L('Menu Laporan / Finance', 'Reports / Finance menu'), hdr: L('Finance', 'Finance'),
    st: L('Revenue • Tertagih • Piutang • Margin', 'Revenue • Collected • AR • Margin'), main: L('Tren revenue bulanan + tabel per klien.', 'Monthly revenue trend + table per client.'), pri: [L('Export', 'Export'), 'rpt.export'], sec: [],
    f: [L('Periode', 'Period'), L('Klien', 'Client')], v: [], r: [L('Margin hanya untuk finance & owner', 'Margin only for finance & owner')], aud: [], ok: L('—', '—'), warn: L('—', '—'), err: L('Laporan belum bisa dimuat. Coba lagi.', 'Report could not load. Try again.'), emp: L('Belum ada data di periode ini.', 'No data in this period.'),
    nb: ['NB-12', 'NB-13', 'NB-16'], bf: ['BF-01', 'BF-06'] });

  /* Commercial */
  add({ id: 'COM-CLI-001', n: L('Klien', 'Clients'), a: 'T05', dom: 'com', lvl: 2, p: 'com.client.view',
    pur: L('Daftar klien, kontak dan status.', 'Client list, contacts and status.'), entry: L('Menu Klien', 'Clients menu'), hdr: L('Klien', 'Clients'),
    st: L('Aktif • Kontrak berakhir', 'Active • Contract ending'), main: L('Tabel: nama, jenis, kontak, property, status.', 'Table: name, type, contact, properties, status.'), pri: [L('Tambah Klien', 'Add Client'), 'com.client.edit'], sec: [],
    f: [L('Cari', 'Search'), L('Jenis', 'Type'), L('Status', 'Status')], v: [], r: [L('Klien tidak dihapus, hanya dinonaktifkan', 'Clients are deactivated, not deleted')], aud: [], ok: L('—', '—'), warn: L('—', '—'), err: L('Daftar klien belum bisa dimuat. Coba lagi.', 'Clients could not load. Try again.'), emp: L('Belum ada klien. Tambahkan klien pertama.', 'No clients yet. Add the first client.'),
    nb: ['NB-01'], bf: ['BF-07'] });
  add({ id: 'COM-CLI-002', n: L('Tambah Klien', 'Add Client'), a: 'T06', dom: 'com', lvl: 2, p: 'com.client.edit',
    pur: L('Daftarkan klien baru.', 'Register a new client.'), entry: L('Klien → Tambah Klien', 'Clients → Add Client'), hdr: L('Tambah Klien Baru', 'Add New Client'),
    st: L('—', '—'), main: L('Nama, jenis usaha, kontak, alamat.', 'Name, business type, contact, address.'), pri: [L('Simpan', 'Save'), 'com.client.edit'], sec: [[L('Batal', 'Cancel'), 'com.client.edit']],
    f: [L('Nama klien *', 'Client name *'), L('Jenis *', 'Type *'), L('Kontak', 'Contact'), L('Telepon / email', 'Phone / email'), L('Alamat', 'Address')],
    v: [L('Nama klien wajib diisi.', 'Client name is required.'), L('Pilih jenis klien.', 'Choose a client type.'), L('Nama klien sudah terdaftar.', 'Client name already exists.')],
    r: [L('Nama klien unik', 'Client name is unique')], aud: ['MD.CHANGE'], ok: L('Klien tersimpan.', 'Client saved.'), warn: L('—', '—'), err: L('Nama klien wajib diisi.', 'Client name is required.'), emp: L('—', '—'),
    nb: ['NB-01', 'NB-20'], bf: ['BF-07'] });
  add({ id: 'COM-PRP-001', n: L('Property', 'Properties'), a: 'T05', dom: 'com', lvl: 2, p: 'com.property',
    pur: L('Lokasi/property per klien dan jadwal pickup.', 'Locations/properties per client and pickup schedule.'), entry: L('Menu Property', 'Property menu'), hdr: L('Property', 'Properties'),
    st: L('Jumlah property', 'Property count'), main: L('Tabel: property, klien, kamar, jadwal pickup.', 'Table: property, client, rooms, pickup schedule.'), pri: [L('Tambah Property', 'Add Property'), 'com.property'], sec: [],
    f: [], v: [], r: [], aud: ['MD.CHANGE'], ok: L('—', '—'), warn: L('—', '—'), err: L('Daftar belum bisa dimuat. Coba lagi.', 'List could not load. Try again.'), emp: L('Belum ada property.', 'No properties yet.'),
    nb: ['NB-01'], bf: ['BF-07'] });
  add({ id: 'COM-CTR-001', n: L('Kontrak', 'Contracts'), a: 'T05', dom: 'com', lvl: 2, p: 'com.contract.view',
    pur: L('Kontrak aktif, masa berlaku, SLA dan rate card.', 'Active contracts, validity, SLA and rate card.'), entry: L('Menu Kontrak', 'Contracts menu'), hdr: L('Kontrak', 'Contracts'),
    st: L('Aktif • Berakhir ≤ 60 hari', 'Active • Ending ≤ 60 days'), main: L('Tabel: nomor, klien, mulai, akhir, SLA, status.', 'Table: number, client, start, end, SLA, status.'), pri: [L('Buat Kontrak', 'Create Contract'), 'com.contract.edit'], sec: [],
    f: [], v: [], r: [L('Kontrak aktif mengunci harga untuk billing', 'Active contract locks prices for billing')], aud: [], ok: L('—', '—'), warn: L('2 kontrak berakhir dalam 30 hari.', '2 contracts end within 30 days.'), err: L('Daftar belum bisa dimuat. Coba lagi.', 'List could not load. Try again.'), emp: L('Belum ada kontrak.', 'No contracts yet.'),
    nb: ['NB-01'], bf: ['BF-07', 'BF-05'] });
  add({ id: 'COM-CTR-002', n: L('Buat Kontrak', 'Create Contract'), a: 'T06', dom: 'com', lvl: 2, p: 'com.contract.edit',
    pur: L('Buat kontrak baru untuk klien.', 'Create a new client contract.'), entry: L('Kontrak → Buat Kontrak', 'Contracts → Create Contract'), hdr: L('Buat Kontrak', 'Create Contract'),
    st: L('—', '—'), main: L('Klien, periode, SLA jam, rate card.', 'Client, period, SLA hours, rate card.'), pri: [L('Simpan Draft', 'Save Draft'), 'com.contract.edit'], sec: [[L('Batal', 'Cancel'), 'com.contract.edit']],
    f: [L('Klien *', 'Client *'), L('Mulai *', 'Start *'), L('Berakhir *', 'End *'), L('SLA (jam) *', 'SLA (hours) *'), L('Rate card *', 'Rate card *')],
    v: [L('Pilih klien.', 'Choose a client.'), L('Tanggal berakhir harus setelah tanggal mulai.', 'End date must be after start date.'), L('SLA harus lebih dari 0 jam.', 'SLA must be more than 0 hours.')],
    r: [L('Kontrak baru berstatus Draft sampai disetujui', 'New contracts are Draft until approved')], aud: ['MD.CHANGE'], ok: L('Draft kontrak tersimpan.', 'Contract draft saved.'), warn: L('—', '—'), err: L('Tanggal berakhir harus setelah tanggal mulai.', 'End date must be after start date.'), emp: L('—', '—'),
    nb: ['NB-01'], bf: ['BF-07'] });
  add({ id: 'COM-RTC-001', n: L('Rate Card', 'Rate Card'), a: 'T05', dom: 'com', lvl: 2, p: 'com.rate.view',
    pur: L('Harga per layanan/item per klien.', 'Price per service/item per client.'), entry: L('Menu Rate Card', 'Rate Card menu'), hdr: L('Rate Card', 'Rate Card'),
    st: L('Item • Perubahan menunggu', 'Items • Changes waiting'), main: L('Tabel: layanan/item, satuan, harga, berlaku sejak.', 'Table: service/item, unit, price, valid from.'), pri: [L('Ajukan Perubahan Harga', 'Request Price Change'), 'com.rate.request'], sec: [],
    f: [], v: [], r: [L('Harga tidak bisa diubah langsung (Aturan 8)', 'Prices cannot be edited directly (Rule 8)')], aud: [], ok: L('—', '—'), warn: L('1 perubahan harga menunggu persetujuan.', '1 price change awaiting approval.'), err: L('Daftar belum bisa dimuat. Coba lagi.', 'List could not load. Try again.'), emp: L('Belum ada rate card.', 'No rate card yet.'),
    nb: ['NB-01', 'NB-12'], bf: ['BF-05', 'BF-07'] });
  add({ id: 'COM-RTC-002', n: L('Ajukan Perubahan Harga', 'Request Price Change'), a: 'T06', dom: 'com', lvl: 2, p: 'com.rate.request',
    pur: L('Ajukan harga baru dengan alasan; berlaku setelah disetujui.', 'Request a new price with a reason; effective after approval.'), entry: L('Rate Card → Ajukan Perubahan', 'Rate Card → Request Change'), hdr: L('Ajukan Perubahan Harga', 'Request Price Change'),
    st: L('Harga saat ini', 'Current price'), main: L('Item, harga baru, berlaku mulai, alasan.', 'Item, new price, effective date, reason.'), pri: [L('Ajukan', 'Submit'), 'com.rate.request'], sec: [[L('Batal', 'Cancel'), 'com.rate.request']],
    f: [L('Item *', 'Item *'), L('Harga baru *', 'New price *'), L('Berlaku mulai *', 'Effective from *'), L('Alasan *', 'Reason *')], v: [L('Harga baru wajib diisi.', 'New price is required.'), L('Alasan wajib diisi.', 'Reason is required.')],
    r: [L('Masuk antrian persetujuan owner', 'Goes to owner approval'), L('Nilai lama & baru tercatat (Aturan 2)', 'Old & new values recorded (Rule 2)')], aud: ['PRICE.CHANGE'], ok: L('Perubahan harga diajukan.', 'Price change requested.'), warn: L('Perubahan lebih dari 10%.', 'Change is more than 10%.'), err: L('Harga baru wajib diisi.', 'New price is required.'), emp: L('—', '—'),
    nb: ['NB-01', 'NB-12'], bf: ['BF-05'] });
  add({ id: 'COM-SLA-001', n: L('SLA Klien', 'Client SLA'), a: 'T05', dom: 'com', lvl: 2, p: 'com.sla',
    pur: L('Target SLA per klien dan pencapaian bulan ini.', 'SLA targets per client and this month\'s result.'), entry: L('Menu SLA', 'SLA menu'), hdr: L('SLA Klien', 'Client SLA'),
    st: L('Di atas target • Di bawah target', 'Above target • Below target'), main: L('Tabel: klien, target jam, on-time %, tren.', 'Table: client, target hours, on-time %, trend.'), pri: [L('Buka klien', 'Open client'), 'com.sla'], sec: [],
    f: [], v: [], r: [], aud: [], ok: L('—', '—'), warn: L('1 klien di bawah target SLA.', '1 client below SLA target.'), err: L('Data SLA belum bisa dimuat. Coba lagi.', 'SLA data could not load. Try again.'), emp: L('Belum ada data SLA.', 'No SLA data yet.'),
    nb: ['NB-01', 'NB-16'], bf: ['BF-06'] });
  add({ id: 'COM-DOC-001', n: L('Dokumen', 'Documents'), a: 'T05', dom: 'com', lvl: 3, p: 'com.docs',
    pur: L('Kontrak, SOP dan dokumen klien.', 'Contracts, SOPs and client documents.'), entry: L('Menu Dokumen', 'Documents menu'), hdr: L('Dokumen', 'Documents'),
    st: L('Menunggu tanda tangan', 'Waiting for signature'), main: L('Tabel: dokumen, klien, jenis, tanggal, status.', 'Table: document, client, type, date, status.'), pri: [L('Unggah Dokumen', 'Upload Document'), 'com.docs'], sec: [],
    f: [], v: [], r: [], aud: ['MD.CHANGE'], ok: L('—', '—'), warn: L('—', '—'), err: L('Daftar belum bisa dimuat. Coba lagi.', 'List could not load. Try again.'), emp: L('Belum ada dokumen.', 'No documents yet.'),
    nb: ['NB-01'], bf: ['BF-07'] });
  add({ id: 'COM-RNW-001', n: L('Renewal', 'Renewals'), a: 'T05', dom: 'com', lvl: 2, p: 'com.renewal',
    pur: L('Kontrak yang akan berakhir dan perlu diperpanjang.', 'Contracts ending soon that need renewal.'), entry: L('Menu Renewal / Dashboard', 'Renewal menu / Dashboard'), hdr: L('Renewal', 'Renewals'),
    st: L('≤ 30 hari • ≤ 60 hari • ≤ 90 hari', '≤ 30 days • ≤ 60 days • ≤ 90 days'), main: L('Tabel: klien, kontrak, berakhir, sisa hari, revenue/bulan.', 'Table: client, contract, ends, days left, revenue/month.'), pri: [L('Mulai Renewal', 'Start Renewal'), 'com.contract.edit'], sec: [],
    f: [], v: [], r: [], aud: [], ok: L('—', '—'), warn: L('Kontrak berakhir dalam 30 hari.', 'Contract ends within 30 days.'), err: L('Daftar belum bisa dimuat. Coba lagi.', 'List could not load. Try again.'), emp: L('Tidak ada kontrak yang perlu diperpanjang.', 'No contracts to renew.'),
    nb: ['NB-01'], bf: ['BF-07'] });

  /* Owner reports */
  add({ id: 'RPT-COM-001', n: L('Komersial & Revenue', 'Commercial & Revenue'), a: 'T08', dom: 'rpt', lvl: 4, p: 'rpt.exec',
    pur: L('Revenue per klien/layanan, kontrak, renewal.', 'Revenue per client/service, contracts, renewals.'), entry: L('Menu Komersial', 'Commercial menu'), hdr: L('Komersial', 'Commercial'),
    st: L('Revenue • Klien aktif • Renewal • Rata-rata harga/kg', 'Revenue • Active clients • Renewals • Avg price/kg'), main: L('Tren revenue, top klien.', 'Revenue trend, top clients.'), pri: [L('Export', 'Export'), 'rpt.export'], sec: [],
    f: [L('Periode', 'Period')], v: [], r: [], aud: [], ok: L('—', '—'), warn: L('—', '—'), err: L('Laporan belum bisa dimuat. Coba lagi.', 'Report could not load. Try again.'), emp: L('Belum ada data.', 'No data yet.'),
    nb: ['NB-16', 'NB-01'], bf: ['BF-01', 'BF-06'] });
  add({ id: 'RPT-CLI-001', n: L('Performa Klien', 'Client Performance'), a: 'T08', dom: 'rpt', lvl: 4, p: 'rpt.exec',
    pur: L('Volume, SLA, kualitas dan piutang per klien.', 'Volume, SLA, quality and AR per client.'), entry: L('Menu Klien (owner)', 'Client menu (owner)'), hdr: L('Performa Klien', 'Client Performance'),
    st: L('Klien aktif • SLA rata-rata • Komplain', 'Active clients • Avg SLA • Complaints'), main: L('Tabel klien dengan SLA, rewash, piutang, revenue.', 'Client table with SLA, rewash, AR, revenue.'), pri: [L('Export', 'Export'), 'rpt.export'], sec: [],
    f: [L('Periode', 'Period')], v: [], r: [], aud: [], ok: L('—', '—'), warn: L('—', '—'), err: L('Laporan belum bisa dimuat. Coba lagi.', 'Report could not load. Try again.'), emp: L('Belum ada data.', 'No data yet.'),
    nb: ['NB-16', 'NB-01'], bf: ['BF-06'] });
  add({ id: 'RPT-PPL-001', n: L('People & Produktivitas', 'People & Productivity'), a: 'T08', dom: 'rpt', lvl: 4, p: 'people.view',
    pur: L('Kg per orang per jam, kehadiran, beban per stasiun.', 'Kg per person per hour, attendance, load per station.'), entry: L('Menu People', 'People menu'), hdr: L('People', 'People'),
    st: L('Staf hadir • Kg/orang/jam • Lembur', 'Staff present • Kg/person/hour • Overtime'), main: L('Produktivitas per stasiun.', 'Productivity per station.'), pri: [L('Export', 'Export'), 'rpt.export'], sec: [],
    f: [L('Periode', 'Period')], v: [], r: [L('Tidak pernah tampil ke klien', 'Never shown to clients')], aud: [], ok: L('—', '—'), warn: L('—', '—'), err: L('Laporan belum bisa dimuat. Coba lagi.', 'Report could not load. Try again.'), emp: L('Belum ada data.', 'No data yet.'),
    nb: ['NB-16', 'NB-17'], bf: ['BF-03', 'BF-06'] });
  add({ id: 'RPT-LIB-001', n: L('Pustaka Laporan', 'Report Library'), a: 'T05', dom: 'rpt', lvl: 4, p: 'rpt.exec',
    pur: L('Semua laporan dalam satu daftar; dibuka saat dibutuhkan.', 'All reports in one list; opened when needed.'), entry: L('Menu Laporan', 'Reports menu'), hdr: L('Laporan', 'Reports'),
    st: L('Jumlah laporan', 'Report count'), main: L('Daftar laporan per domain.', 'Report list per domain.'), pri: [L('Buka laporan', 'Open report'), 'rpt.exec'], sec: [],
    f: [], v: [], r: [L('Laporan dimuat hanya saat dibuka (lazy)', 'Reports load only when opened (lazy)')], aud: [], ok: L('—', '—'), warn: L('—', '—'), err: L('—', '—'), emp: L('—', '—'),
    nb: ['NB-16'], bf: ['BF-06'] });

  /* System */
  add({ id: 'SYS-HUB-001', n: L('Sistem', 'System'), a: 'T09', dom: 'sys', lvl: 4, p: 'sys.settings',
    pur: L('Pintu masuk administrasi: user, peran, master data, audit, pengaturan.', 'Administration entry: users, roles, master data, audit, settings.'), entry: L('Menu Sistem', 'System menu'), hdr: L('Sistem', 'System'),
    st: L('Perubahan terakhir', 'Last change'), main: L('Kartu sub-menu sistem.', 'System sub-menu cards.'), pri: [L('Buka', 'Open'), 'sys.settings'], sec: [],
    f: [], v: [], r: [], aud: [], ok: L('—', '—'), warn: L('—', '—'), err: L('—', '—'), emp: L('—', '—'), nb: ['NB-17', 'NB-20'], bf: ['BF-02'] });
  add({ id: 'SYS-USR-001', n: L('User', 'Users'), a: 'T09', dom: 'sys', lvl: 4, p: 'sys.users',
    pur: L('Kelola akun user dan perannya.', 'Manage user accounts and their role.'), entry: L('Sistem → User', 'System → Users'), hdr: L('User', 'Users'),
    st: L('Aktif • Nonaktif', 'Active • Inactive'), main: L('Tabel: nama, peran, email, lokasi, status.', 'Table: name, role, email, site, status.'), pri: [L('Tambah User', 'Add User'), 'sys.users'], sec: [],
    f: [], v: [], r: [L('User dinonaktifkan, tidak dihapus', 'Users are deactivated, not deleted')], aud: ['SYS.CHANGE'], ok: L('—', '—'), warn: L('—', '—'), err: L('Daftar belum bisa dimuat. Coba lagi.', 'List could not load. Try again.'), emp: L('Belum ada user.', 'No users yet.'),
    nb: ['NB-17'], bf: ['BF-03'] });
  add({ id: 'SYS-ROL-001', n: L('Peran & Hak Akses', 'Roles & Permissions'), a: 'T09', dom: 'sys', lvl: 4, p: 'sys.roles',
    pur: L('Matriks izin per peran. Mengatur menu, halaman, tombol, data dan export.', 'Permission matrix per role. Controls menus, pages, buttons, data and export.'), entry: L('Sistem → Peran & Akses', 'System → Roles & Permissions'), hdr: L('Peran & Hak Akses', 'Roles & Permissions'),
    st: L('Peran • Izin', 'Roles • Permissions'), main: L('Matriks izin × peran.', 'Permission × role matrix.'), pri: [L('Ubah Izin', 'Edit Permissions'), 'sys.roles'], sec: [],
    f: [], v: [], r: [L('Setiap perubahan izin tercatat nilai lama & baru', 'Every permission change records old & new value')], aud: ['SYS.CHANGE'], ok: L('Izin diperbarui.', 'Permissions updated.'), warn: L('—', '—'), err: L('Perubahan belum tersimpan. Coba lagi.', 'Change not saved. Try again.'), emp: L('—', '—'),
    nb: ['NB-17'], bf: ['BF-03', 'BF-05'] });
  add({ id: 'SYS-AUD-001', n: L('Audit Log', 'Audit Log'), a: 'T09', dom: 'sys', lvl: 4, p: 'sys.audit',
    pur: L('Siapa melakukan apa, kapan, pada record mana, nilai lama dan baru.', 'Who did what, when, on which record, old and new value.'), entry: L('Sistem → Audit Log', 'System → Audit Log'), hdr: L('Audit Log', 'Audit Log'),
    st: L('Event hari ini', 'Events today'), main: L('Tabel: waktu, user, event, record, lama → baru.', 'Table: time, user, event, record, old → new.'), pri: [L('Export', 'Export'), 'rpt.export'], sec: [],
    f: [L('Tanggal', 'Date'), L('User', 'User'), L('Event', 'Event')], v: [], r: [L('Audit tidak bisa diubah atau dihapus', 'Audit cannot be edited or deleted')], aud: [], ok: L('—', '—'), warn: L('—', '—'), err: L('Audit belum bisa dimuat. Coba lagi.', 'Audit could not load. Try again.'), emp: L('Belum ada event.', 'No events yet.'),
    nb: ['NB-18'], bf: ['BF-05'] });
  add({ id: 'SYS-MD-001', n: L('Master Data', 'Master Data'), a: 'T09', dom: 'sys', lvl: 4, p: 'sys.master',
    pur: L('Jenis cucian, layanan, mesin, supplier, kendaraan, alasan masalah.', 'Laundry types, services, machines, suppliers, vehicles, issue reasons.'), entry: L('Sistem → Master Data', 'System → Master Data'), hdr: L('Master Data', 'Master Data'),
    st: L('Kategori master data', 'Master data categories'), main: L('Daftar kategori + jumlah record.', 'Category list + record count.'), pri: [L('Tambah', 'Add'), 'sys.master'], sec: [],
    f: [], v: [], r: [L('Master data dipakai ulang di semua layar (tidak ketik ulang)', 'Master data is reused on every screen (no retyping)')], aud: ['MD.CHANGE'], ok: L('—', '—'), warn: L('—', '—'), err: L('Data belum bisa dimuat. Coba lagi.', 'Data could not load. Try again.'), emp: L('Belum ada data.', 'No data yet.'),
    nb: ['NB-20'], bf: ['BF-07'] });
  add({ id: 'SYS-SET-001', n: L('Pengaturan', 'Settings'), a: 'T09', dom: 'sys', lvl: 4, p: 'sys.settings',
    pur: L('Bahasa default, notifikasi, workflow, jam SLA.', 'Default language, notifications, workflow, SLA hours.'), entry: L('Sistem → Pengaturan', 'System → Settings'), hdr: L('Pengaturan', 'Settings'),
    st: L('Diubah terakhir', 'Last changed'), main: L('Grup pengaturan dengan toggle besar.', 'Settings groups with large toggles.'), pri: [L('Simpan', 'Save'), 'sys.settings'], sec: [],
    f: [L('Bahasa default', 'Default language'), L('Notifikasi', 'Notifications'), L('Batas selisih berat', 'Weight difference limit')], v: [L('Batas selisih harus 1–20%.', 'Limit must be 1–20%.')],
    r: [L('Default bahasa: Bahasa Indonesia', 'Default language: Bahasa Indonesia')], aud: ['SYS.CHANGE'], ok: L('Pengaturan tersimpan.', 'Settings saved.'), warn: L('—', '—'), err: L('Batas selisih harus 1–20%.', 'Limit must be 1–20%.'), emp: L('—', '—'),
    nb: ['NB-20', 'NB-17'], bf: ['BF-05'] });

  /* Client portal */
  add({ id: 'CLT-PKP-001', n: L('Minta Pickup', 'Request Pickup'), a: 'T06', dom: 'clt', lvl: 2, p: 'clt.pickup',
    pur: L('Minta pickup tambahan di luar jadwal.', 'Request an extra pickup outside the schedule.'), entry: L('Beranda → Minta Pickup / menu Pickup', 'Home → Request Pickup / Pickup menu'), hdr: L('Minta Pickup', 'Request Pickup'),
    st: L('Jadwal pickup rutin berikutnya', 'Next scheduled pickup'), main: L('Property (diisi), tanggal, jam, perkiraan bag, catatan.', 'Property (prefilled), date, time, estimated bags, note.'), pri: [L('Kirim Permintaan', 'Send Request'), 'clt.pickup'], sec: [[L('Batal', 'Cancel'), 'clt.pickup']],
    f: [L('Property *', 'Property *'), L('Tanggal *', 'Date *'), L('Jam *', 'Time *'), L('Perkiraan bag', 'Estimated bags'), L('Catatan', 'Note')],
    v: [L('Pilih tanggal pickup.', 'Choose a pickup date.'), L('Tanggal tidak boleh di masa lalu.', 'Date cannot be in the past.')], r: [L('Hanya property milik klien ini', 'Only this client\'s properties')], aud: ['ORD.STATUS'],
    ok: L('Permintaan pickup terkirim. Kami akan konfirmasi jadwalnya.', 'Pickup request sent. We will confirm the time.'), warn: L('Permintaan di bawah 2 jam mungkin tidak bisa dipenuhi.', 'Requests under 2 hours ahead may not be possible.'), err: L('Pilih tanggal pickup.', 'Choose a pickup date.'), emp: L('—', '—'),
    nb: ['NB-19', 'NB-02'], bf: ['BF-04'] });
  add({ id: 'CLT-ORD-001', n: L('Pesanan', 'Orders'), a: 'T02', dom: 'clt', lvl: 3, p: 'clt.portal',
    pur: L('Pesanan berjalan dan riwayat pesanan klien.', 'The client\'s running orders and order history.'), entry: L('Menu Pesanan', 'Orders menu'), hdr: L('Pesanan', 'Orders'),
    st: L('Berjalan • Selesai', 'In progress • Done'), main: L('Kartu pesanan: nomor, tanggal, kg, tahap, SLA.', 'Order card: number, date, kg, stage, SLA.'), pri: [L('Lihat status', 'View status'), 'clt.portal'], sec: [],
    f: [], v: [], r: [L('Hanya pesanan klien ini', 'Only this client\'s orders')], aud: [], ok: L('—', '—'), warn: L('—', '—'), err: L('Pesanan belum bisa dimuat. Coba lagi.', 'Orders could not load. Try again.'), emp: L('Belum ada pesanan.', 'No orders yet.'),
    nb: ['NB-19'], bf: ['BF-04'] });
  add({ id: 'CLT-ORD-002', n: L('Status Pesanan', 'Order Status'), a: 'T03', dom: 'clt', lvl: 3, p: 'clt.portal',
    pur: L('Di mana cucian saya sekarang dan kapan sampai.', 'Where my laundry is now and when it arrives.'), entry: L('Pesanan → pilih pesanan', 'Orders → pick an order'), hdr: L('#Order • tanggal', '#Order • date'),
    st: L('Tahap sederhana: Dijemput → Dicuci → Dikirim → Diterima', 'Simple stages: Collected → Washing → Delivering → Received'), main: L('Kg, bag, jenis, perkiraan tiba, bukti pengiriman.', 'Kg, bags, type, estimated arrival, proof of delivery.'), pri: [L('Ada Masalah?', 'Something wrong?'), 'clt.complaint'], sec: [],
    f: [], v: [], r: [L('Tahap internal (sortir, QC) diringkas jadi "Dicuci"', 'Internal stages (sort, QC) are summarised as "Washing"'), L('Masalah internal tidak ditampilkan', 'Internal issues are not shown')], aud: [], ok: L('—', '—'), warn: L('Perkiraan tiba mundur.', 'Arrival estimate is delayed.'), err: L('Status belum bisa dimuat. Coba lagi.', 'Status could not load. Try again.'), emp: L('Pesanan tidak ditemukan.', 'Order not found.'),
    nb: ['NB-19'], bf: ['BF-04'] });
  add({ id: 'CLT-DLV-001', n: L('Pengiriman', 'Deliveries'), a: 'T05', dom: 'clt', lvl: 3, p: 'clt.portal',
    pur: L('Jadwal pengiriman dan bukti pengiriman.', 'Delivery schedule and proof of delivery.'), entry: L('Menu Pengiriman', 'Delivery menu'), hdr: L('Pengiriman', 'Deliveries'),
    st: L('Hari ini • Minggu ini', 'Today • This week'), main: L('Daftar: tanggal, order, bag, penerima, bukti.', 'List: date, order, bags, receiver, proof.'), pri: [L('Lihat bukti', 'View proof'), 'clt.portal'], sec: [],
    f: [], v: [], r: [], aud: [], ok: L('—', '—'), warn: L('—', '—'), err: L('Daftar belum bisa dimuat. Coba lagi.', 'List could not load. Try again.'), emp: L('Belum ada pengiriman.', 'No deliveries yet.'),
    nb: ['NB-19', 'NB-10'], bf: ['BF-04'] });
  add({ id: 'CLT-INV-001', n: L('Invoice & Pembayaran', 'Invoices & Payment'), a: 'T05', dom: 'clt', lvl: 3, p: 'clt.invoice',
    pur: L('Invoice klien, status bayar dan cara bayar.', 'Client invoices, payment status and how to pay.'), entry: L('Menu Invoice', 'Invoice menu'), hdr: L('Invoice', 'Invoices'),
    st: L('Belum dibayar • Jatuh tempo', 'Unpaid • Due'), main: L('Daftar: nomor, periode, nilai, jatuh tempo, status.', 'List: number, period, amount, due, status.'), pri: [L('Unduh PDF', 'Download PDF'), 'clt.invoice'], sec: [],
    f: [], v: [], r: [L('Hanya invoice klien ini, tanpa biaya internal', 'Only this client\'s invoices, no internal cost')], aud: [], ok: L('—', '—'), warn: L('1 invoice jatuh tempo minggu ini.', '1 invoice due this week.'), err: L('Daftar belum bisa dimuat. Coba lagi.', 'List could not load. Try again.'), emp: L('Belum ada invoice.', 'No invoices yet.'),
    nb: ['NB-19', 'NB-12', 'NB-13'], bf: ['BF-01'] });
  add({ id: 'CLT-CMP-001', n: L('Komplain', 'Complaints'), a: 'T06', dom: 'clt', lvl: 2, p: 'clt.complaint',
    pur: L('Kirim komplain terkait pesanan dan lihat statusnya.', 'Send a complaint about an order and track it.'), entry: L('Menu Komplain / Status Pesanan', 'Complaint menu / Order Status'), hdr: L('Komplain', 'Complaints'),
    st: L('Komplain terbuka', 'Open complaints'), main: L('Pesanan, alasan (pilihan), foto, catatan + daftar komplain.', 'Order, reason (choice), photo, note + complaint list.'), pri: [L('Kirim Komplain', 'Send Complaint'), 'clt.complaint'], sec: [],
    f: [L('Pesanan *', 'Order *'), L('Alasan *', 'Reason *'), L('Foto', 'Photo'), L('Catatan', 'Note')], v: [L('Pilih pesanan.', 'Choose an order.'), L('Pilih alasan.', 'Choose a reason.')],
    r: [L('Komplain masuk ke daftar Masalah internal', 'Complaints feed the internal Issues list')], aud: ['ISS.CREATE'], ok: L('Komplain terkirim. Tim kami akan menghubungi Anda.', 'Complaint sent. Our team will contact you.'), warn: L('—', '—'), err: L('Pilih alasan.', 'Choose a reason.'), emp: L('Belum ada komplain.', 'No complaints yet.'),
    nb: ['NB-19', 'NB-11'], bf: ['BF-04'] });
  add({ id: 'CLT-DOC-001', n: L('Dokumen', 'Documents'), a: 'T05', dom: 'clt', lvl: 3, p: 'clt.portal',
    pur: L('Kontrak, SLA dan dokumen layanan klien.', 'Client contract, SLA and service documents.'), entry: L('Menu Dokumen', 'Documents menu'), hdr: L('Dokumen', 'Documents'),
    st: L('—', '—'), main: L('Daftar dokumen dengan tombol unduh.', 'Document list with download.'), pri: [L('Unduh', 'Download'), 'clt.portal'], sec: [],
    f: [], v: [], r: [L('Hanya dokumen klien ini', 'Only this client\'s documents')], aud: [], ok: L('—', '—'), warn: L('—', '—'), err: L('Daftar belum bisa dimuat. Coba lagi.', 'List could not load. Try again.'), emp: L('Belum ada dokumen.', 'No documents yet.'),
    nb: ['NB-19'], bf: ['BF-07'] });

  /* ---------- Derived values ---------- */
  var byId = {};
  S.forEach(function (s) { byId[s.id] = s; });
  C.SCREENS = S;
  C.screen = function (id) { return byId[id]; };
  C.can = function (role, perm) { var r = C.ROLES[role]; return !!(r && perm && r.perms.indexOf(perm) !== -1); };
  // Roles that may open a screen: the permission decides.
  C.rolesFor = function (s) { if (typeof s === 'string') s = byId[s]; return C.ROLE_ORDER.filter(function (k) { return C.can(k, s.p); }); };
  // Which roles' navigation exposes a screen directly
  C.navRolesFor = function (id) {
    return C.ROLE_ORDER.filter(function (k) { var r = C.ROLES[k]; return r.nav.concat(r.extra || []).some(function (n) { return n.s === id; }); });
  };
  C.flowFor = function (id) { return C.FLOWS.filter(function (f) { return f.steps.some(function (st) { return st.s === id; }); }); };
  // NV mapping: every screen sits in the NV-01 sitemap and follows NV-05
  // (archetype) and NV-06 (framework); NV-01 is implied and not listed;
  // homes add NV-02/NV-03, flow screens add NV-04, frontline screens add NV-03.
  C.nvFor = function (s) {
    if (typeof s === 'string') s = byId[s];
    var nv = [];
    if (s.a === 'T01') nv.push('NV-02', 'NV-03');
    var roles = C.rolesFor(s);
    if (s.a !== 'T01' && roles.some(function (r) { return C.ROLES[r].group === 'frontline' || r === 'client'; })) nv.push('NV-03');
    if (C.flowFor(s.id).length) nv.push('NV-04');
    nv.push('NV-05', 'NV-06');
    return nv;
  };
  // Full 24-field functional framework for one screen (NP-06 §12)
  C.FRAMEWORK_FIELDS = [
    ['id', L('Screen ID', 'Screen ID')], ['n', L('Nama Layar', 'Screen Name')], ['pur', L('Tujuan', 'Purpose')], ['roles', L('Peran yang Diizinkan', 'Allowed Roles')],
    ['entry', L('Titik Masuk', 'Entry Point')], ['hdr', L('Header', 'Header')], ['st', L('Area Status', 'Status Area')], ['main', L('Konten Utama', 'Main Content')],
    ['pri', L('Aksi Utama', 'Primary Action')], ['sec', L('Aksi Sekunder', 'Secondary Action')], ['f', L('Field', 'Fields')], ['v', L('Validasi', 'Validation')],
    ['r', L('Aturan Bisnis', 'Business Rules')], ['perm', L('Aturan Izin', 'Permission Rules')], ['aud', L('Audit Event', 'Audit Events')], ['ok', L('State Berhasil', 'Success State')],
    ['warn', L('State Peringatan', 'Warning State')], ['err', L('State Error', 'Error State')], ['emp', L('State Kosong', 'Empty State')], ['load', L('State Memuat', 'Loading State')],
    ['noperm', L('State Tanpa Akses', 'No Permission State')], ['resp', L('Perilaku Responsif', 'Responsive Behavior')], ['lang', L('Label Bahasa', 'Language Labels')], ['map', L('Pemetaan NB/NV', 'NB/NV Mapping')]
  ];
  C.framework = function (id) {
    var s = typeof id === 'string' ? byId[id] : id, a = C.ARCH[s.a];
    var roles = C.rolesFor(s);
    var perm = [L('Lihat halaman: ' + s.p, 'View page: ' + s.p)];
    if (s.pri) perm.push(L('Aksi utama: ' + s.pri[1], 'Primary action: ' + s.pri[1]));
    (s.sec || []).forEach(function (x) { perm.push(L('Aksi sekunder: ' + x[1], 'Secondary action: ' + x[1])); });
    perm.push(L('Tanpa izin: menu & tombol disembunyikan, bukan dinonaktifkan', 'Without permission: menus & buttons are hidden, not disabled'));
    var labels = [s.n].concat(s.pri ? [s.pri[0]] : []).concat((s.sec || []).map(function (x) { return x[0]; })).filter(function (x, i, arr) { return arr.findIndex(function (y) { return y[0] === x[0]; }) === i; });
    return {
      id: s.id, n: s.n, a: s.a, arch: a.n, pur: s.pur, roles: roles, entry: s.entry, hdr: s.hdr, st: s.st, main: s.main,
      pri: s.pri ? s.pri[0] : null, sec: (s.sec || []).map(function (x) { return x[0]; }), f: s.f, v: s.v, r: s.r, perm: perm,
      aud: s.aud.map(function (e) { return { k: e, l: C.AUDIT[e] }; }), ok: s.ok, warn: s.warn, err: s.err, emp: s.emp,
      load: a.loading, noperm: C.STATES.noperm.ex, resp: a.responsive, lang: labels, nb: s.nb, nv: C.nvFor(s), bf: s.bf, lvl: s.lvl, dom: s.dom, flow: C.flowFor(s.id).map(function (f) { return f.code; })
    };
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = C;
  else root.JFOS = C;
})(typeof window !== 'undefined' ? window : this);
