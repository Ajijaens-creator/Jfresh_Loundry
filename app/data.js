/* JFRESH OS — demo data store for the Phase 2 prototype.
   One connected dataset: an action by one role (e.g. the operator receiving a
   load) is immediately visible to every other role. Kept in localStorage so a
   demo survives reloads; "Reset data" restores the seed. */
(function () {
  var KEY = 'jfos-demo-v1';
  var H = 3600e3, M = 60e3, D = 24 * H;

  var CLIENTS = [
    { id: 'CL-01', n: 'Grand Vista Hotel', type: 'Hotel', pic: 'Ibu Sari', phone: '0812 3456 7890', email: 'hk@grandvista.id', status: 'active', sla: 24, rooms: 180 },
    { id: 'CL-02', n: 'The Santai Hotel', type: 'Resort', pic: 'Pak Dodi', phone: '0812 9876 5432', email: 'hk@thesantai.id', status: 'active', sla: 24, rooms: 120 },
    { id: 'CL-03', n: 'Kayana Resort', type: 'Villa', pic: 'Ibu Laras', phone: '0813 1111 2222', email: 'ops@kayana.id', status: 'active', sla: 36, rooms: 48 },
    { id: 'CL-04', n: 'Oceanview Villa', type: 'Villa', pic: 'Pak Rudi', phone: '0813 3333 4444', email: 'gm@oceanview.id', status: 'active', sla: 48, rooms: 24 },
    { id: 'CL-05', n: 'Hotel ABC', type: 'Hotel', pic: 'Ibu Nia', phone: '0811 2020 3030', email: 'hk@hotelabc.id', status: 'active', sla: 24, rooms: 150 },
    { id: 'CL-06', n: 'Ubud Spa Retreat', type: 'Spa', pic: 'Ibu Dewa', phone: '0819 5151 6262', email: 'spa@ubudretreat.id', status: 'active', sla: 48, rooms: 30 }
  ];
  var PROPS = [
    { id: 'PR-01', cl: 'CL-01', n: 'Grand Vista Hotel — Kuta', rooms: 180, sched: 'Setiap hari 07:00' },
    { id: 'PR-02', cl: 'CL-02', n: 'The Santai — Sanur', rooms: 120, sched: 'Setiap hari 08:00' },
    { id: 'PR-03', cl: 'CL-03', n: 'Kayana Resort — Seminyak', rooms: 48, sched: 'Sen/Rab/Jum 09:00' },
    { id: 'PR-04', cl: 'CL-04', n: 'Oceanview Villa — Uluwatu', rooms: 24, sched: 'Sel/Kam/Sab 10:00' },
    { id: 'PR-05', cl: 'CL-05', n: 'Hotel ABC — Denpasar', rooms: 150, sched: 'Setiap hari 06:30' },
    { id: 'PR-06', cl: 'CL-06', n: 'Ubud Spa Retreat — Ubud', rooms: 30, sched: 'Sel/Jum 11:00' },
    { id: 'PR-07', cl: 'CL-01', n: 'Grand Vista Hotel — Nusa Dua', rooms: 96, sched: 'Setiap hari 07:30' }
  ];
  var TYPES = { bed: ['Bed Linen', 'Bed Linen'], towel: ['Handuk', 'Towel'], fnb: ['Linen F&B', 'F&B Linen'], uniform: ['Seragam', 'Uniform'] };
  var RATES = { bed: 14000, towel: 15500, fnb: 16000, uniform: 18000 };
  var STAFF = [
    { id: 'ST-01', n: 'Made', st: 'receive', kg: 412, done: 9, present: true },
    { id: 'ST-02', n: 'Ketut', st: 'sort', kg: 388, done: 8, present: true },
    { id: 'ST-03', n: 'Wayan', st: 'wash', kg: 520, done: 6, present: true },
    { id: 'ST-04', n: 'Nyoman', st: 'wash', kg: 476, done: 5, present: true },
    { id: 'ST-05', n: 'Kadek', st: 'qc', kg: 301, done: 7, present: true },
    { id: 'ST-06', n: 'Sari', st: 'qc', kg: 0, done: 0, present: false },
    { id: 'ST-07', n: 'Putu', st: 'pack', kg: 344, done: 8, present: true },
    { id: 'ST-08', n: 'Agus', st: 'pack', kg: 290, done: 6, present: true },
    { id: 'ST-09', n: 'Komang', st: 'driver', kg: 0, done: 3, present: true }
  ];

  function seed() {
    var now = Date.now(), n = 0;
    var orders = [];
    function o(cl, prop, stage, type, est, bags, dueIn, extra) {
      n++;
      var id = 'JF2610-' + String(100100 + n).slice(-5);
      var c = CLIENTS.filter(function (x) { return x.id === cl; })[0];
      var created = now + dueIn - c.sla * H;
      var rec = {
        id: id, cl: cl, prop: prop, stage: stage, sub: null, type: type, estKg: est, kg: stage === 'pickup' || stage === 'receive' ? null : est,
        bags: bags, cleanBags: null, note: '', dueAt: now + dueIn, createdAt: created, rewash: 0, machine: null, pod: null,
        pickupAt: stage === 'pickup' ? now + 40 * M + n * 12 * M : created + 40 * M, deliverAt: now + dueIn - 30 * M, history: []
      };
      for (var k in extra || {}) rec[k] = extra[k];
      orders.push(rec);
      return rec;
    }
    // Pickup (driver)
    o('CL-05', 'PR-05', 'pickup', 'bed', 84, 8, 22 * H, { pickupAt: now - 15 * M });
    o('CL-02', 'PR-02', 'pickup', 'towel', 46, 5, 23 * H);
    o('CL-03', 'PR-03', 'pickup', 'bed', 38, 4, 35 * H);
    o('CL-06', 'PR-06', 'pickup', 'towel', 22, 3, 46 * H);
    // Waiting to receive
    o('CL-05', 'PR-05', 'receive', 'bed', 82.4, 8, 5 * H + 18 * M, { note: 'Linen kamar, handuk, bath mat. Mohon pisahkan linen putih.' });
    o('CL-01', 'PR-01', 'receive', 'bed', 126, 12, 50 * M, { note: 'Ada 2 sprei bernoda kopi.' });
    o('CL-02', 'PR-02', 'receive', 'towel', 58.5, 6, 3 * H + 5 * M);
    o('CL-01', 'PR-07', 'receive', 'fnb', 31, 3, 6 * H + 40 * M, { note: 'Napkin restoran, lipat segitiga.' });
    o('CL-04', 'PR-04', 'receive', 'bed', 24.8, 3, 9 * H);
    o('CL-03', 'PR-03', 'receive', 'uniform', 12, 2, 20 * H);
    // Sorting
    o('CL-01', 'PR-01', 'sort', 'towel', 74, 7, 4 * H);
    o('CL-05', 'PR-05', 'sort', 'fnb', 28, 3, 7 * H);
    o('CL-02', 'PR-02', 'sort', 'bed', 61, 6, 2 * H + 30 * M);
    // Washing (two running)
    o('CL-01', 'PR-01', 'wash', 'bed', 118, 11, 3 * H + 10 * M, { sub: 'running', machine: 'Washer 2 (60 kg)', washStart: now - 25 * M });
    o('CL-03', 'PR-03', 'wash', 'towel', 33, 4, 8 * H, { sub: 'running', machine: 'Washer 4 (30 kg)', washStart: now - 50 * M });
    o('CL-05', 'PR-05', 'wash', 'bed', 92, 9, 45 * M);
    o('CL-06', 'PR-06', 'wash', 'towel', 19, 2, 30 * H);
    o('CL-02', 'PR-02', 'wash', 'uniform', 16, 2, 11 * H);
    // QC
    o('CL-01', 'PR-07', 'qc', 'fnb', 27, 3, 2 * H + 5 * M);
    o('CL-04', 'PR-04', 'qc', 'bed', 22, 3, 13 * H, { rewash: 1 });
    o('CL-05', 'PR-05', 'qc', 'towel', 49, 5, -20 * M);
    o('CL-02', 'PR-02', 'qc', 'bed', 66, 7, 5 * H);
    // Packing
    o('CL-01', 'PR-01', 'pack', 'bed', 131, 12, 1 * H + 40 * M);
    o('CL-03', 'PR-03', 'pack', 'bed', 35, 4, 6 * H);
    o('CL-05', 'PR-05', 'pack', 'uniform', 14, 2, 9 * H);
    // Ready to ship / out for delivery
    o('CL-01', 'PR-01', 'deliver', 'towel', 88, 8, 1 * H + 10 * M, { cleanBags: 8 });
    o('CL-02', 'PR-02', 'deliver', 'bed', 70, 7, 2 * H + 20 * M, { cleanBags: 7 });
    o('CL-05', 'PR-05', 'deliver', 'fnb', 30, 3, 3 * H + 45 * M, { cleanBags: 3 });
    o('CL-04', 'PR-04', 'deliver', 'towel', 18, 2, 7 * H, { cleanBags: 2 });
    // Done (delivered with proof)
    [['CL-01', 'PR-01', 'bed', 124, 12], ['CL-05', 'PR-05', 'bed', 80, 8], ['CL-02', 'PR-02', 'towel', 52, 5], ['CL-03', 'PR-03', 'bed', 36, 4],
     ['CL-01', 'PR-07', 'fnb', 29, 3], ['CL-04', 'PR-04', 'bed', 21, 3], ['CL-06', 'PR-06', 'towel', 20, 2], ['CL-01', 'PR-01', 'towel', 77, 7],
     ['CL-05', 'PR-05', 'towel', 51, 5], ['CL-02', 'PR-02', 'bed', 64, 6]].forEach(function (d, i) {
      var r = o(d[0], d[1], 'done', d[2], d[3], d[4], -(3 + i * 7) * H + 4 * H, { cleanBags: d[4] });
      r.deliveredAt = r.dueAt - (i === 3 ? -50 * M : 70 * M);
      r.pod = { name: ['Ibu Sari', 'Ibu Nia', 'Pak Dodi', 'Ibu Laras', 'Ibu Sari', 'Pak Rudi', 'Ibu Dewa', 'Ibu Sari', 'Ibu Nia', 'Pak Dodi'][i], at: r.deliveredAt, photo: true };
      r.billed = i >= 6 ? null : 'INV-2610-0' + (21 + (i % 3));
    });
    orders.forEach(function (r) {
      r.history.push({ at: r.createdAt, by: 'Sistem', ev: 'ORD.STATUS', to: 'Order dibuat' });
      if (r.stage !== 'pickup') r.history.push({ at: r.createdAt + 40 * M, by: 'Komang', ev: 'ORD.PICKUP', to: r.bags + ' bag' });
      if (['pickup', 'receive'].indexOf(r.stage) === -1) r.history.push({ at: r.createdAt + 80 * M, by: 'Made', ev: 'ORD.RECEIVE', to: r.kg + ' kg' });
      if (r.pod) r.history.push({ at: r.pod.at, by: 'Komang', ev: 'DLV.POD', to: r.pod.name });
    });

    var day = new Date(now); day.setHours(0, 0, 0, 0);
    var invoices = [
      { id: 'INV-2610-021', cl: 'CL-01', date: now - 12 * D, due: now + 2 * D, amt: 48650000, paid: 20000000 },
      { id: 'INV-2610-022', cl: 'CL-05', date: now - 12 * D, due: now + 2 * D, amt: 31200000, paid: 0 },
      { id: 'INV-2610-023', cl: 'CL-02', date: now - 12 * D, due: now + 2 * D, amt: 27440000, paid: 27440000 },
      { id: 'INV-2609-014', cl: 'CL-03', date: now - 40 * D, due: now - 10 * D, amt: 12800000, paid: 0 },
      { id: 'INV-2609-015', cl: 'CL-04', date: now - 40 * D, due: now - 10 * D, amt: 8950000, paid: 4000000 },
      { id: 'INV-2609-016', cl: 'CL-06', date: now - 40 * D, due: now - 10 * D, amt: 6420000, paid: 6420000 },
      { id: 'INV-2608-009', cl: 'CL-05', date: now - 72 * D, due: now - 42 * D, amt: 29870000, paid: 0 },
      { id: 'INV-2609-011', cl: 'CL-01', date: now - 40 * D, due: now - 10 * D, amt: 51300000, paid: 51300000 },
      { id: 'INV-2609-012', cl: 'CL-02', date: now - 40 * D, due: now - 10 * D, amt: 26100000, paid: 26100000 },
      { id: 'INV-2609-013', cl: 'CL-05', date: now - 40 * D, due: now - 10 * D, amt: 30450000, paid: 30450000 }
    ];
    var payments = [
      { id: 'PAY-1101', inv: 'INV-2610-021', cl: 'CL-01', at: now - 1 * D, method: 'Transfer BCA', amt: 20000000, ref: 'BCA-889201' },
      { id: 'PAY-1100', inv: 'INV-2610-023', cl: 'CL-02', at: now - 2 * D, method: 'Transfer Mandiri', amt: 27440000, ref: 'MDR-552190' },
      { id: 'PAY-1099', inv: 'INV-2609-015', cl: 'CL-04', at: now - 6 * D, method: 'Transfer BCA', amt: 4000000, ref: 'BCA-771034' },
      { id: 'PAY-1098', inv: 'INV-2609-016', cl: 'CL-06', at: now - 9 * D, method: 'Giro', amt: 6420000, ref: 'GR-00921' },
      { id: 'PAY-1097', inv: 'INV-2609-011', cl: 'CL-01', at: now - 11 * D, method: 'Transfer BCA', amt: 51300000, ref: 'BCA-660122' },
      { id: 'PAY-1096', inv: 'INV-2609-012', cl: 'CL-02', at: now - 12 * D, method: 'Transfer Mandiri', amt: 26100000, ref: 'MDR-449012' },
      { id: 'PAY-1095', inv: 'INV-2609-013', cl: 'CL-05', at: now - 13 * D, method: 'Transfer BNI', amt: 30450000, ref: 'BNI-330981' }
    ];
    var cns = [
      { id: 'CN-0031', inv: 'INV-2609-014', cl: 'CL-03', amt: 640000, reason: 'damage', status: 'wait', by: 'Rina Dewi', at: now - 1 * D },
      { id: 'CN-0030', inv: 'INV-2609-012', cl: 'CL-02', amt: 310000, reason: 'late', status: 'ok', by: 'Rina Dewi', at: now - 15 * D }
    ];
    var approvals = [
      { id: 'APR-301', type: 'weight', perm: 'ops.weight.override', ref: orders[5].id, by: 'Made', at: now - 35 * M, from: '126 kg (pickup)', to: '118.2 kg (timbang)', why: ['Selisih timbang 6,2%', 'Weight difference 6.2%'], status: 'wait' },
      { id: 'APR-302', type: 'rate', perm: 'com.rate.approve', ref: 'Kayana Resort · Bed Linen', by: 'Andi Pratama', at: now - 1 * D, from: 'Rp 14.000/kg', to: 'Rp 14.800/kg', why: ['Penyesuaian harga chemical 2026', '2026 chemical cost adjustment'], status: 'wait' },
      { id: 'APR-303', type: 'cn', perm: 'fin.cn.approve', ref: 'CN-0031 · INV-2609-014', by: 'Rina Dewi', at: now - 1 * D, from: 'Rp 12.800.000', to: 'Rp 12.160.000', why: ['2 sprei rusak (klaim klien)', '2 damaged sheets (client claim)'], status: 'wait' },
      { id: 'APR-304', type: 'claim', perm: 'qlt.claim.approve', ref: 'ISS-0412 · Hotel ABC', by: 'Budi Santoso', at: now - 5 * H, from: '—', to: 'Rp 450.000', why: ['1 handuk hilang setelah pengiriman', '1 towel lost after delivery'], status: 'wait' },
      { id: 'APR-305', type: 'stock', perm: 'inv.adjust.approve', ref: 'Softener 20 L', by: 'Budi Santoso', at: now - 3 * H, from: '14 jerigen', to: '12 jerigen', why: ['Jerigen bocor', 'Leaking containers'], status: 'wait' },
      { id: 'APR-306', type: 'invfix', perm: 'fin.invoice.fix.approve', ref: 'INV-2610-022 · Hotel ABC', by: 'Andi Pratama', at: now - 6 * H, from: 'Rp 31.200.000', to: 'Rp 30.880.000', why: ['1 order tercatat dobel', '1 order counted twice'], status: 'wait' },
      { id: 'APR-299', type: 'rate', perm: 'com.rate.approve', ref: 'Hotel ABC · Towel', by: 'Andi Pratama', at: now - 8 * D, from: 'Rp 15.000/kg', to: 'Rp 15.500/kg', why: ['Kontrak baru', 'New contract'], status: 'ok', dec: 'Pak Jaens' },
      { id: 'APR-298', type: 'stock', perm: 'inv.adjust.approve', ref: 'Plastik packing', by: 'Budi Santoso', at: now - 9 * D, from: '40 roll', to: '25 roll', why: ['Salah input', 'Input error'], status: 'no', dec: 'Dewi Lestari', note: 'Hitung ulang dulu.' }
    ];
    var issues = [
      { id: 'ISS-0415', ord: orders[19].id, reason: 'stain', src: 'qc', by: 'Kadek', at: now - 2 * H, status: 'open', note: 'Noda kuning di 3 sprei' },
      { id: 'ISS-0414', ord: orders[5].id, reason: 'qty', src: 'receive', by: 'Made', at: now - 35 * M, status: 'open', note: 'Timbang 118,2 kg vs pickup 126 kg' },
      { id: 'ISS-0413', ord: orders[25].id, reason: 'late', src: 'client', by: 'Grand Vista Hotel', at: now - 4 * H, status: 'open', note: 'Pengiriman kemarin terlambat 1 jam' },
      { id: 'ISS-0412', ord: orders[29].id, reason: 'lost', src: 'client', by: 'Hotel ABC', at: now - 6 * H, status: 'review', note: '1 handuk tidak ada saat diterima' },
      { id: 'ISS-0409', ord: orders[30].id, reason: 'damage', src: 'qc', by: 'Kadek', at: now - 2 * D, status: 'closed', note: 'Sobek kecil di tepi', dec: 'rewash' }
    ];
    var stock = [
      { id: 'SK-01', n: 'Detergen Alkaline 20 L', cat: 'chem', qty: 18, min: 10, unit: 'jerigen', used: 3 },
      { id: 'SK-02', n: 'Bleach Oksigen 20 L', cat: 'chem', qty: 6, min: 8, unit: 'jerigen', used: 2 },
      { id: 'SK-03', n: 'Softener 20 L', cat: 'chem', qty: 14, min: 8, unit: 'jerigen', used: 2 },
      { id: 'SK-04', n: 'Sour Neutralizer 20 L', cat: 'chem', qty: 4, min: 6, unit: 'jerigen', used: 1 },
      { id: 'SK-05', n: 'Starch 10 kg', cat: 'chem', qty: 9, min: 4, unit: 'sak', used: 0 },
      { id: 'SK-06', n: 'Plastik packing', cat: 'cons', qty: 22, min: 15, unit: 'roll', used: 4 },
      { id: 'SK-07', n: 'Label & tag', cat: 'cons', qty: 3, min: 5, unit: 'box', used: 1 },
      { id: 'SK-08', n: 'Laundry bag', cat: 'cons', qty: 140, min: 80, unit: 'pcs', used: 12 },
      { id: 'SK-09', n: 'Hanger seragam', cat: 'cons', qty: 260, min: 100, unit: 'pcs', used: 20 }
    ];
    var vehicles = [
      { id: 'B 1234 XY', drv: 'Komang', route: 'Rute Selatan', stops: 7, done: 3, status: 'active', svc: now + 20 * D },
      { id: 'DK 8812 AB', drv: 'Gede', route: 'Rute Utara', stops: 5, done: 2, status: 'active', svc: now + 45 * D },
      { id: 'DK 7721 EF', drv: 'Putu R.', route: 'Rute Timur', stops: 4, done: 4, status: 'active', svc: now + 4 * D },
      { id: 'DK 4410 CD', drv: '—', route: '—', stops: 0, done: 0, status: 'service', svc: now }
    ];
    var contracts = [
      { id: 'KTR-2025-011', cl: 'CL-01', start: now - 300 * D, end: now + 65 * D, sla: 24, rev: 49000000, status: 'active' },
      { id: 'KTR-2025-014', cl: 'CL-02', start: now - 280 * D, end: now + 25 * D, sla: 24, rev: 27000000, status: 'active' },
      { id: 'KTR-2026-002', cl: 'CL-03', start: now - 120 * D, end: now + 245 * D, sla: 36, rev: 12500000, status: 'active' },
      { id: 'KTR-2025-019', cl: 'CL-04', start: now - 340 * D, end: now + 18 * D, sla: 48, rev: 9000000, status: 'active' },
      { id: 'KTR-2026-005', cl: 'CL-05', start: now - 90 * D, end: now + 275 * D, sla: 24, rev: 31000000, status: 'active' },
      { id: 'KTR-2026-008', cl: 'CL-06', start: now - 30 * D, end: now + 335 * D, sla: 48, rev: 6500000, status: 'active' }
    ];
    var docs = [
      { id: 'DOC-101', cl: 'CL-01', n: 'Kontrak KTR-2025-011.pdf', kind: 'contract', at: now - 300 * D, status: 'signed' },
      { id: 'DOC-102', cl: 'CL-01', n: 'SLA Grand Vista 2026.pdf', kind: 'sla', at: now - 300 * D, status: 'signed' },
      { id: 'DOC-103', cl: 'CL-02', n: 'Draft perpanjangan KTR-2025-014.pdf', kind: 'contract', at: now - 3 * D, status: 'pending' },
      { id: 'DOC-104', cl: 'CL-05', n: 'SOP Linen Hotel ABC.pdf', kind: 'sop', at: now - 80 * D, status: 'signed' },
      { id: 'DOC-105', cl: 'CL-04', n: 'Penawaran renewal Oceanview.pdf', kind: 'offer', at: now - 1 * D, status: 'pending' },
      { id: 'DOC-106', cl: 'CL-01', n: 'Rate card Grand Vista 2026.pdf', kind: 'rate', at: now - 300 * D, status: 'signed' }
    ];
    var audit = [
      { at: now - 8 * H, by: 'Made', role: 'operator', ev: 'AUTH.LOGIN', rec: '—', from: null, to: null },
      { at: now - 7 * H, by: 'Budi Santoso', role: 'supervisor', ev: 'AUTH.LOGIN', rec: '—', from: null, to: null },
      { at: now - 6 * H, by: 'Andi Pratama', role: 'sales', ev: 'BILL.CHANGE', rec: 'INV-2610-022', from: 'Rp 31.200.000', to: 'Koreksi diajukan' },
      { at: now - 5 * H, by: 'Budi Santoso', role: 'supervisor', ev: 'ISS.CREATE', rec: 'ISS-0412', from: null, to: 'Klaim diajukan' },
      { at: now - 3 * H, by: 'Budi Santoso', role: 'supervisor', ev: 'STK.ADJUST', rec: 'Softener 20 L', from: '14', to: '12 (menunggu)' },
      { at: now - 2 * H, by: 'Kadek', role: 'operator', ev: 'QC.RESULT', rec: orders[19].id, from: 'Menunggu QC', to: 'Ada Masalah · Noda' },
      { at: now - 35 * M, by: 'Made', role: 'operator', ev: 'ORD.RECEIVE', rec: orders[5].id, from: '126 kg', to: '118.2 kg (menunggu persetujuan)' },
      { at: now - 1 * D, by: 'Pak Jaens', role: 'owner', ev: 'SYS.CHANGE', rec: 'Peran Finance', from: '—', to: '+ fin.invoice.fix.approve' },
      { at: now - 8 * D, by: 'Pak Jaens', role: 'owner', ev: 'PRICE.CHANGE', rec: 'Hotel ABC · Towel', from: 'Rp 15.000/kg', to: 'Rp 15.500/kg' }
    ];
    var pickupReqs = [];
    return { v: 1, seed: now, orders: orders, invoices: invoices, payments: payments, cns: cns, approvals: approvals, issues: issues, stock: stock, vehicles: vehicles, contracts: contracts, docs: docs, audit: audit, pickupReqs: pickupReqs, staff: STAFF.map(function (s) { return Object.assign({}, s); }), done: {} };
  }

  var db;
  function load() {
    try { var raw = localStorage.getItem(KEY); if (raw) { db = JSON.parse(raw); if (db && db.v === 1) return; } } catch (e) {}
    db = seed();
  }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(db)); } catch (e) {} }
  function reset() { db = seed(); save(); }
  load();

  window.JFDB = {
    get: function () { return db; }, save: save, reset: reset,
    CLIENTS: CLIENTS, PROPS: PROPS, TYPES: TYPES, RATES: RATES,
    client: function (id) { return CLIENTS.filter(function (c) { return c.id === id; })[0]; },
    prop: function (id) { return PROPS.filter(function (c) { return c.id === id; })[0]; },
    order: function (id) { return db.orders.filter(function (c) { return c.id === id; })[0]; },
    invoice: function (id) { return db.invoices.filter(function (c) { return c.id === id; })[0]; },
    issue: function (id) { return db.issues.filter(function (c) { return c.id === id; })[0]; }
  };
})();
