/* ==========================================================================
   JFRESH OS — Phase 7 sample data (Order, Pickup, Delivery & Live Logistics).
   Clients, properties, contacts, services, contracts and SLA come from the
   Phase 6 commercial data (jfos-comm-data.js); this file only holds what is
   new in Phase 7: plant, drivers, vehicles, routes, schedules, today's
   orders and trips, manifests, evidence, issues, chat and KPI history.
   Day shown: Tuesday 6 Oct 2026, simulated clock starts at 10:30.
   Map points are in a schematic south-Bali canvas (0–1000 × 0–640).
   ========================================================================== */
(function (root) {
  function L(a, b) { return [a, b === undefined ? a : b]; }
  var D = { today: '2026-10-06', simNow: '2026-10-06 10:30' };

  D.PLANT = { id: 'PL-01', n: 'Main Plant', addr: 'JFRESH Main Plant · PL-01', x: 520, y: 372 };
  // Schematic points per property (same ids as Phase 6).
  D.LOC = {
    'PR-07A': [566, 150], 'PR-07B': [398, 396], 'PR-07C': [622, 430], 'PR-07D': [430, 468], 'PR-01A': [548, 166], 'PR-01B': [538, 176],
    'PR-02A': [382, 412], 'PR-03A': [370, 390], 'PR-03B': [512, 134], 'PR-04A': [372, 604], 'PR-05A': [500, 360], 'PR-06A': [582, 132],
    'PR-08A': [556, 182], 'PR-09A': [404, 418], 'PR-10A': [628, 446], 'PR-11A': [574, 162], 'PR-12A': [632, 416]
  };
  // Named pins clients can share in chat (§69).
  D.PINS = { 'PR-01B': [L('Loading Dock B', 'Loading Dock B'), 544, 180], 'PR-07A': [L('Pintu belakang spa', 'Spa back door'), 570, 146] };

  // Staff names used by this phase (CS / dispatch) that are not in the access list.
  D.STAFF = { 'EMP-081': 'Putri Anggraeni', 'EMP-021': 'Saras Pradnyani', 'EMP-001': 'Made Wirana', 'EMP-010': 'Komang Ops', 'EMP-050': 'Aji Jaens' };
  // Drivers (employees; Ketut and Gede are also in the Phase 5 people list, so their KPIs feed the Personal Score).
  D.DRIVERS = [
    { id: 'EMP-002', n: 'Ketut Arsana', short: 'Ketut', phone: '+62 812 3801 0002', shift: ['07:00', '15:00'], veh: 'JF-01', area: L('Ubud', 'Ubud') },
    { id: 'EMP-082', n: 'Wayan Sudira', short: 'Wayan', phone: '+62 812 3801 0082', shift: ['07:00', '15:00'], veh: 'JF-03', area: L('Kuta & Seminyak', 'Kuta & Seminyak') },
    { id: 'EMP-083', n: 'Komang Adi', short: 'Komang', phone: '+62 812 3801 0083', shift: ['08:00', '16:00'], veh: 'JF-04', area: L('Sanur', 'Sanur') },
    { id: 'EMP-063', n: 'Gede Wira', short: 'Gede', phone: '+62 812 3801 0063', shift: ['06:00', '14:00'], veh: 'JF-02', area: L('Denpasar', 'Denpasar') }
  ];
  D.VEHICLES = [
    { id: 'JF-01', plate: 'DK 1234 AB', type: 'van', cap: { bags: 40, kg: 400 }, maint: 'ok', next: '2026-11-02' },
    { id: 'JF-02', plate: 'DK 5678 CD', type: 'van', cap: { bags: 40, kg: 400 }, maint: 'repair', next: '2026-10-07', note: L('Rem depan diperiksa di bengkel', 'Front brakes checked at the workshop') },
    { id: 'JF-03', plate: 'DK 9012 EF', type: 'pickup', cap: { bags: 30, kg: 300 }, maint: 'ok', next: '2026-10-20' },
    { id: 'JF-04', plate: 'DK 3456 GH', type: 'pickup', cap: { bags: 20, kg: 180 }, maint: 'ok', next: '2026-12-01' },
    { id: 'JF-05', plate: 'DK 7788 IJ', type: 'van', cap: { bags: 40, kg: 400 }, maint: 'ok', next: '2026-11-18', note: L('Kendaraan cadangan', 'Spare vehicle') }
  ];
  D.ROUTES = [
    { id: 'R-01', n: 'Ubud Area', area: 'Ubud', start: '07:30', end: '14:30', min: 300, km: 52, maxStops: 7, drv: 'EMP-002', veh: 'JF-01', stops: ['PR-07A', 'PR-01A', 'PR-01B', 'PR-06A', 'PR-03B', 'PR-08A'], status: 'active' },
    { id: 'R-02', n: 'Kuta & Seminyak', area: 'Kuta · Seminyak', start: '08:00', end: '14:00', min: 270, km: 36, maxStops: 6, drv: 'EMP-082', veh: 'JF-03', stops: ['PR-07B', 'PR-09A', 'PR-07D', 'PR-02A', 'PR-03A'], status: 'active' },
    { id: 'R-03', n: 'Sanur & East', area: 'Sanur', start: '08:30', end: '13:30', min: 240, km: 28, maxStops: 5, drv: 'EMP-083', veh: 'JF-04', stops: ['PR-07C', 'PR-10A', 'PR-12A', 'PR-05A'], status: 'active' },
    { id: 'R-04', n: 'Denpasar Utara', area: 'Denpasar', start: '06:30', end: '09:00', min: 150, km: 22, maxStops: 5, drv: 'EMP-063', veh: 'JF-02', stops: ['PR-05A', 'PR-07D'], status: 'active' },
    { id: 'R-05', n: 'Nusa Dua & Uluwatu', area: 'Nusa Dua · Uluwatu', start: '12:30', end: '16:00', min: 210, km: 38, maxStops: 4, drv: null, veh: null, stops: ['PR-04A'], status: 'active' }
  ];

  // Recurring schedules (§8). days: 0 = Sunday … 6 = Saturday.
  function sc(id, prop, cl, ctr, svc, days, pick, del, freq, route, drv, veh, active, o) {
    return Object.assign({ id: id, prop: prop, cl: cl, ctr: ctr, svc: svc, days: days, pick: pick, del: del, freq: freq, eff: '2026-01-01', end: null, hol: 'earlier', route: route, drv: drv, veh: veh, active: active, skips: [], extra: [], moves: [], bags: 6, kg: 40, cat: 'linen', pri: 'normal' }, o || {});
  }
  var ALL = [0, 1, 2, 3, 4, 5, 6], MS = [1, 2, 3, 4, 5, 6];
  D.SCHEDULES = [
    sc('SCH-01', 'PR-07A', 'CL-07', 'CTR-2025-022', 'SV-007', ALL, '09:00', '16:00', 'multi', 'R-01', 'EMP-002', 'JF-01', true, { bags: 8, kg: 45, cat: 'spa', note: L('Pagi', 'Morning') }),
    sc('SCH-02', 'PR-07A', 'CL-07', 'CTR-2025-022', 'SV-007', ALL, '17:00', '09:00', 'multi', 'R-01', 'EMP-002', 'JF-01', true, { bags: 5, kg: 28, cat: 'spa', note: L('Sore', 'Evening') }),
    sc('SCH-03', 'PR-07B', 'CL-07', 'CTR-2025-022', 'SV-008', ALL, '09:00', '16:00', 'daily', 'R-02', 'EMP-082', 'JF-03', true, { bags: 6, kg: 38, cat: 'towel' }),
    sc('SCH-04', 'PR-07C', 'CL-07', 'CTR-2025-022', 'SV-007', MS, '09:30', '16:30', 'days', 'R-03', 'EMP-083', 'JF-04', true, { bags: 4, kg: 26, cat: 'spa' }),
    sc('SCH-05', 'PR-07D', 'CL-07', 'CTR-2025-022', 'SV-002', ALL, '07:30', '15:30', 'daily', 'R-04', 'EMP-063', 'JF-02', true, { bags: 6, kg: 34, cat: 'towel', pri: 'express' }),
    sc('SCH-06', 'PR-01A', 'CL-01', 'CTR-2025-014', 'SV-006', ALL, '09:30', '17:00', 'daily', 'R-01', 'EMP-002', 'JF-01', true, { bags: 12, kg: 96 }),
    sc('SCH-07', 'PR-01B', 'CL-01', 'CTR-2025-014', 'SV-006', ALL, '10:00', '17:30', 'daily', 'R-01', 'EMP-002', 'JF-01', true, { bags: 10, kg: 80 }),
    sc('SCH-08', 'PR-05A', 'CL-05', 'CTR-2025-031', 'SV-006', ALL, '07:00', '11:30', 'daily', 'R-04', 'EMP-063', 'JF-02', true, { bags: 10, kg: 85 }),
    sc('SCH-09', 'PR-02A', 'CL-02', 'CTR-2026-002', 'SV-006', ALL, '11:30', '18:00', 'daily', 'R-02', 'EMP-082', 'JF-03', true, { bags: 9, kg: 70 }),
    sc('SCH-10', 'PR-06A', 'CL-06', 'CTR-2025-008', 'SV-007', MS, '11:00', '17:00', 'days', 'R-01', 'EMP-002', 'JF-01', true, { bags: 4, kg: 22, cat: 'spa' }),
    sc('SCH-11', 'PR-04A', 'CL-04', 'CTR-2026-009', 'SV-006', MS, '13:00', '10:00', 'days', 'R-05', null, null, true, { bags: 7, kg: 55 }),
    sc('SCH-12', 'PR-08A', 'CL-08', 'CTR-2026-007', 'SV-006', [1, 3, 5], '09:00', '15:00', 'custom', 'R-01', 'EMP-002', 'JF-01', true, { bags: 5, kg: 36 }),
    sc('SCH-13', 'PR-10A', 'CL-10', null, 'SV-006', MS, '08:30', '17:00', 'days', 'R-03', 'EMP-083', 'JF-04', false, { bags: 4, kg: 30, paused: L('Klien ditahan (on hold) oleh Finance', 'Client put on hold by Finance') })
  ];
  // Exception calendar (§12).
  D.HOLIDAYS = [
    { id: 'HOL-01', d: '2026-10-14', kind: 'public', n: L('Hari Raya Galungan', 'Galungan holiday'), prop: null, rule: 'earlier', min: 60 },
    { id: 'HOL-02', d: '2026-10-09', kind: 'closed', n: L('Villa Sari tutup untuk renovasi', 'Villa Sari closed for renovation'), prop: 'PR-09A', rule: 'skip' },
    { id: 'HOL-03', d: '2026-10-12', kind: 'event', n: L('Retreat spa sepanjang hari', 'All-day spa retreat'), prop: 'PR-07A', rule: 'confirm' },
    { id: 'HOL-04', d: '2026-10-08', kind: 'manual', n: L('Jalan Monkey Forest ditutup pagi', 'Monkey Forest road closed in the morning'), prop: 'PR-01A', rule: 'later', min: 90 }
  ];

  // Today's orders. ev = status events [status, 'HH:MM', by].
  function o(id, prop, cl, kind, win, pri, svc, bags, kg, cat, src, st, x) {
    return Object.assign({ id: id, prop: prop, cl: cl, kind: kind, date: D.today, win: win, pri: pri, svc: svc, bags: bags, kg: kg, cat: cat, src: src, st: st, sch: null, ctr: null, ct: null,
      instr: '', by: 'system', at: '2026-10-06 06:00', trip: null, ev: [], exec: null, pod: null, plan: null }, x || {});
  }
  var SYS = 'system';
  D.ORDERS = [
    // Ketut · R-01 Ubud (trip active, tracking on since 08:40)
    o('ORD-2610-101', 'PR-07A', 'CL-07', 'pickup', ['09:00', '09:30'], 'normal', 'SV-007', 8, 45, 'spa', 'scheduled', 'completed', { sch: 'SCH-01', ctr: 'CTR-2025-022', ct: 'CT-074', trip: 'TRP-2610-01', plan: '09:05',
      ev: [['scheduled', '06:00', SYS], ['assigned', '06:00', SYS], ['ready', '08:30', 'EMP-021'], ['ontheway', '08:40', 'EMP-002'], ['arrived', '09:04', 'EMP-002'], ['inprogress', '09:05', 'EMP-002'], ['completed', '09:15', 'EMP-002']], instr: L('Pisahkan handuk spa dan linen bed.', 'Separate spa towels and bed linen.') }),
    o('ORD-2610-102', 'PR-01A', 'CL-01', 'pickup', ['09:30', '10:00'], 'normal', 'SV-006', 12, 96, 'linen', 'scheduled', 'completed', { sch: 'SCH-06', ctr: 'CTR-2025-014', ct: 'CT-011', trip: 'TRP-2610-01', plan: '09:35',
      ev: [['scheduled', '06:00', SYS], ['assigned', '06:00', SYS], ['ready', '08:30', 'EMP-021'], ['ontheway', '09:16', 'EMP-002'], ['arrived', '09:31', 'EMP-002'], ['inprogress', '09:32', 'EMP-002'], ['completed', '09:46', 'EMP-002']] }),
    o('ORD-2610-103', 'PR-01B', 'CL-01', 'pickup', ['10:00', '11:00'], 'important', 'SV-006', 10, 80, 'linen', 'scheduled', 'ontheway', { sch: 'SCH-07', ctr: 'CTR-2025-014', ct: 'CT-014', trip: 'TRP-2610-01', plan: '10:35', legMin: 16,
      ev: [['scheduled', '06:00', SYS], ['assigned', '06:00', SYS], ['ready', '08:30', 'EMP-021'], ['ontheway', '10:20', 'EMP-002']], instr: L('Ambil di Loading Dock B, lapor ke Linen Room.', 'Collect at Loading Dock B, report to the Linen Room.') }),
    o('ORD-2610-104', 'PR-06A', 'CL-06', 'pickup', ['11:00', '12:00'], 'normal', 'SV-007', 4, 22, 'spa', 'scheduled', 'ready', { sch: 'SCH-10', ctr: 'CTR-2025-008', ct: 'CT-062', trip: 'TRP-2610-01', plan: '11:05',
      ev: [['scheduled', '06:00', SYS], ['assigned', '06:00', SYS], ['ready', '08:30', 'EMP-021']] }),
    o('ORD-2610-105', 'PR-03B', 'CL-03', 'delivery', ['12:00', '13:00'], 'normal', 'SV-006', 6, 44, 'linen', 'contract', 'ready', { ctr: 'CTR-2026-004', ct: 'CT-034', trip: 'TRP-2610-01', plan: '11:45',
      ev: [['scheduled', '06:00', SYS], ['assigned', '06:00', SYS], ['ready', '08:30', 'EMP-021']] }),
    // Wayan · R-02 Kuta & Seminyak
    o('ORD-2610-111', 'PR-07B', 'CL-07', 'pickup', ['09:00', '09:30'], 'normal', 'SV-008', 6, 38, 'towel', 'scheduled', 'completed', { sch: 'SCH-03', ctr: 'CTR-2025-022', ct: 'CT-075', trip: 'TRP-2610-02', plan: '09:10',
      ev: [['scheduled', '06:00', SYS], ['assigned', '06:00', SYS], ['ready', '08:30', 'EMP-021'], ['ontheway', '08:45', 'EMP-082'], ['arrived', '09:08', 'EMP-082'], ['inprogress', '09:09', 'EMP-082'], ['completed', '09:22', 'EMP-082']] }),
    o('ORD-2610-112', 'PR-09A', 'CL-09', 'pickup', ['10:00', '11:00'], 'express', 'SV-002', 4, 24, 'linen', 'ondemand', 'inprogress', { ct: 'CT-091', trip: 'TRP-2610-02', plan: '10:15', by: 'EMP-021', at: '2026-10-06 08:05',
      ev: [['requested', '08:05', 'EMP-021'], ['assigned', '08:10', 'EMP-021'], ['ready', '08:30', 'EMP-021'], ['ontheway', '09:50', 'EMP-082'], ['arrived', '10:24', 'EMP-082'], ['inprogress', '10:26', 'EMP-082']] }),
    o('ORD-2610-113', 'PR-07D', 'CL-07', 'delivery', ['11:00', '12:00'], 'normal', 'SV-008', 6, 36, 'towel', 'scheduled', 'assigned', { sch: 'SCH-05', ctr: 'CTR-2025-022', ct: 'CT-077', trip: 'TRP-2610-02', plan: '11:05',
      ev: [['scheduled', '06:00', SYS], ['assigned', '06:00', SYS]] }),
    o('ORD-2610-114', 'PR-02A', 'CL-02', 'pickup', ['11:30', '12:30'], 'normal', 'SV-006', 9, 70, 'linen', 'scheduled', 'assigned', { sch: 'SCH-09', ctr: 'CTR-2026-002', ct: 'CT-022', trip: 'TRP-2610-02', plan: '11:40',
      ev: [['scheduled', '06:00', SYS], ['assigned', '06:00', SYS]] }),
    // Komang · R-03 Sanur (weak signal, traffic delay)
    o('ORD-2610-121', 'PR-07C', 'CL-07', 'pickup', ['09:30', '10:30'], 'normal', 'SV-007', 4, 26, 'spa', 'scheduled', 'ontheway', { sch: 'SCH-04', ctr: 'CTR-2025-022', ct: 'CT-076', trip: 'TRP-2610-03', plan: '09:50', delay: 25, delayR: 'traffic', lastDelay: 25,
      ev: [['scheduled', '06:00', SYS], ['assigned', '06:00', SYS], ['ready', '08:30', 'EMP-021'], ['ontheway', '09:35', 'EMP-083']] }),
    o('ORD-2610-123', 'PR-05A', 'CL-05', 'delivery', ['11:30', '12:30'], 'normal', 'SV-006', 10, 82, 'linen', 'scheduled', 'assigned', { sch: 'SCH-08', ctr: 'CTR-2025-031', ct: 'CT-051', trip: 'TRP-2610-03', plan: '11:45',
      ev: [['scheduled', '06:00', SYS], ['assigned', '06:00', SYS]] }),
    // Gede · R-04 early route, done; vehicle went to the workshop
    o('ORD-2610-131', 'PR-05A', 'CL-05', 'pickup', ['07:00', '07:30'], 'normal', 'SV-006', 10, 85, 'linen', 'scheduled', 'received', { sch: 'SCH-08', ctr: 'CTR-2025-031', ct: 'CT-051', trip: 'TRP-2610-04', plan: '07:05',
      ev: [['scheduled', '06:00', SYS], ['assigned', '06:00', SYS], ['ready', '06:20', 'EMP-021'], ['ontheway', '06:40', 'EMP-063'], ['arrived', '06:58', 'EMP-063'], ['inprogress', '06:59', 'EMP-063'], ['completed', '07:12', 'EMP-063'], ['atplant', '08:41', 'EMP-001'], ['received', '08:50', 'EMP-001']] }),
    o('ORD-2610-132', 'PR-07D', 'CL-07', 'pickup', ['07:30', '08:00'], 'express', 'SV-002', 6, 34, 'towel', 'scheduled', 'completed', { sch: 'SCH-05', ctr: 'CTR-2025-022', ct: 'CT-077', trip: 'TRP-2610-04', plan: '07:40',
      ev: [['scheduled', '06:00', SYS], ['assigned', '06:00', SYS], ['ready', '06:20', 'EMP-021'], ['ontheway', '07:14', 'EMP-063'], ['arrived', '07:38', 'EMP-063'], ['inprogress', '07:39', 'EMP-063'], ['completed', '07:52', 'EMP-063']] }),
    // Not yet assigned (dispatch board)
    o('ORD-2610-141', 'PR-04A', 'CL-04', 'pickup', ['13:00', '14:00'], 'urgent', 'SV-006', 7, 55, 'linen', 'scheduled', 'scheduled', { sch: 'SCH-11', ctr: 'CTR-2026-009', ct: 'CT-042', ev: [['scheduled', '06:00', SYS]] }),
    o('ORD-2610-142', 'PR-08A', 'CL-08', 'pickup', ['12:00', '13:00'], 'express', 'SV-002', 3, 18, 'linen', 'ondemand', 'requested', { ct: 'CT-081', by: 'EMP-081', at: '2026-10-06 09:42',
      ev: [['requested', '09:42', 'EMP-081']], instr: L('Tamu check-out siang, butuh linen cepat.', 'Guests check out at noon; linen needed fast.') }),
    o('ORD-2610-143', 'PR-07A', 'CL-07', 'pickup', ['17:00', '17:30'], 'normal', 'SV-007', 5, 28, 'spa', 'scheduled', 'scheduled', { sch: 'SCH-02', ctr: 'CTR-2025-022', ct: 'CT-074', ev: [['scheduled', '06:00', SYS]] }),
    o('ORD-2610-144', 'PR-11A', 'CL-11', 'pickup', ['14:00', '15:00'], 'normal', 'SV-005', 1, 4, 'garment', 'manual', 'draft', { ct: 'CT-111', by: 'EMP-081', at: '2026-10-06 10:05', ev: [['draft', '10:05', 'EMP-081']], instr: L('Gaun pesta, dry clean.', 'Party dress, dry clean.') })
  ];
  // Trips: one per driver per day. stops = order ids in route order.
  D.TRIPS = [
    { id: 'TRP-2610-01', drv: 'EMP-002', veh: 'JF-01', route: 'R-01', st: 'active', stops: ['ORD-2610-101', 'ORD-2610-102', 'ORD-2610-103', 'ORD-2610-104', 'ORD-2610-105'], track: { on: true, from: '2026-10-06 08:40', to: null }, shiftStart: '07:05', signal: 'ok' },
    { id: 'TRP-2610-02', drv: 'EMP-082', veh: 'JF-03', route: 'R-02', st: 'active', stops: ['ORD-2610-111', 'ORD-2610-112', 'ORD-2610-113', 'ORD-2610-114'], track: { on: true, from: '2026-10-06 08:45', to: null }, shiftStart: '07:10', signal: 'ok' },
    { id: 'TRP-2610-03', drv: 'EMP-083', veh: 'JF-04', route: 'R-03', st: 'active', stops: ['ORD-2610-121', 'ORD-2610-123'], track: { on: true, from: '2026-10-06 09:35', to: null }, shiftStart: '08:05', signal: 'weak', lastPing: '2026-10-06 10:26', lastPos: [600, 404] },
    { id: 'TRP-2610-04', drv: 'EMP-063', veh: 'JF-02', route: 'R-04', st: 'done', stops: ['ORD-2610-131', 'ORD-2610-132'], track: { on: false, from: '2026-10-06 06:40', to: '2026-10-06 08:40' }, shiftStart: '06:05', signal: 'ok', returned: '08:38' }
  ];
  // Manifests and bags (§31–§32).
  D.MANIFESTS = [
    { id: 'MF-2610-01', ord: 'ORD-2610-101', trip: 'TRP-2610-01', pickAt: '2026-10-06 09:15', bags: 8, cont: 1, kg: 45, cat: 'spa', special: '', notes: L('Cucian spa harian. Kondisi baik.', 'Daily spa laundry. Good condition.'), st: 'intransit' },
    { id: 'MF-2610-02', ord: 'ORD-2610-102', trip: 'TRP-2610-01', pickAt: '2026-10-06 09:46', bags: 12, cont: 0, kg: 96, cat: 'linen', special: L('2 bag bernoda berat', '2 heavily stained bags'), notes: '', st: 'intransit' },
    { id: 'MF-2610-03', ord: 'ORD-2610-111', trip: 'TRP-2610-02', pickAt: '2026-10-06 09:22', bags: 6, cont: 0, kg: 38, cat: 'towel', special: '', notes: L('1 bag basah', '1 wet bag'), st: 'intransit' },
    { id: 'MF-2610-04', ord: 'ORD-2610-131', trip: 'TRP-2610-04', pickAt: '2026-10-06 07:12', bags: 10, cont: 0, kg: 85, cat: 'linen', special: '', notes: '', st: 'received',
      ho: { arrAt: '2026-10-06 08:40', count: 10, cond: 'good', drv: '2026-10-06 08:41', rcv: '2026-10-06 08:41', rcvBy: 'EMP-001', diff: 0 } },
    { id: 'MF-2610-05', ord: 'ORD-2610-132', trip: 'TRP-2610-04', pickAt: '2026-10-06 07:52', bags: 6, cont: 0, kg: 34, cat: 'towel', special: '', notes: '', st: 'discrepancy',
      ho: { arrAt: '2026-10-06 08:40', count: 5, cond: 'good', drv: '2026-10-06 08:43', rcv: null, rcvBy: 'EMP-001', diff: -1, reason: L('Satu bag tertinggal di mobil, dicek di bengkel', 'One bag left in the van, being checked at the workshop'), issue: 'ISS-2610-02' } }
  ];
  // Issues (§43–§47).
  D.ISSUES = [
    { id: 'ISS-2610-01', ord: 'ORD-2610-121', mf: null, type: 'traffic', sev: 'warn', at: '2026-10-06 10:05', by: 'EMP-083', note: L('Macet di Jl. Bypass Ngurah Rai.', 'Traffic jam on Jl. Bypass Ngurah Rai.'), action: 'continue', st: 'open', owner: 'EMP-021', next: L('Kabari Triloka perkiraan tiba baru', 'Tell Triloka the new arrival estimate'), delay: 'traffic' },
    { id: 'ISS-2610-02', ord: 'ORD-2610-132', mf: 'MF-2610-05', type: 'bagdiff', sev: 'warn', at: '2026-10-06 08:43', by: 'EMP-001', note: L('Pickup 6 bag, tiba 5 bag.', 'Picked up 6 bags, 5 arrived.'), action: 'review', st: 'review', owner: 'EMP-021', next: L('Cek mobil JF-02 di bengkel', 'Check van JF-02 at the workshop') },
    { id: 'ISS-2610-03', ord: null, mf: null, veh: 'JF-02', type: 'vehicle', sev: 'crit', at: '2026-10-06 08:55', by: 'EMP-063', note: L('Rem depan bunyi dan kurang pakem. Mobil ke bengkel.', 'Front brakes squeal and feel weak. Van to the workshop.'), action: 'review', st: 'open', owner: 'EMP-010', next: L('Cari kendaraan pengganti untuk rute sore', 'Find a replacement vehicle for the afternoon route') },
    { id: 'ISS-2610-04', ord: 'ORD-2610-111', mf: 'MF-2610-03', type: 'wet', sev: 'info', at: '2026-10-06 09:18', by: 'EMP-082', note: L('Satu bag handuk kolam basah, dipisah.', 'One pool-towel bag is wet, kept apart.'), action: 'continue', st: 'resolved', owner: 'EMP-021', next: '', res: L('Dicatat untuk receiving.', 'Noted for receiving.'), resAt: '2026-10-06 09:30' }
  ];
  // Evidence (§37). kind: arrive · photo · sign · pic · pin · note · done
  D.EVIDENCE = [
    ['ORD-2610-101', 'arrive', '09:04', 'EMP-002'], ['ORD-2610-101', 'photo', '09:10', 'EMP-002', 'bags'], ['ORD-2610-101', 'pic', '09:13', 'EMP-002', 'Mila Putri · Supervisor'], ['ORD-2610-101', 'sign', '09:14', 'EMP-002', 'Mila'], ['ORD-2610-101', 'done', '09:15', 'EMP-002'],
    ['ORD-2610-102', 'arrive', '09:31', 'EMP-002'], ['ORD-2610-102', 'photo', '09:38', 'EMP-002', 'stain'], ['ORD-2610-102', 'pic', '09:44', 'EMP-002', 'Ibu Sari Wulandari · Executive Housekeeper'], ['ORD-2610-102', 'sign', '09:45', 'EMP-002', 'Sari W.'], ['ORD-2610-102', 'done', '09:46', 'EMP-002'],
    ['ORD-2610-111', 'arrive', '09:08', 'EMP-082'], ['ORD-2610-111', 'photo', '09:16', 'EMP-082', 'wet'], ['ORD-2610-111', 'pic', '09:20', 'EMP-082', 'Putra Mahendra · Operations Manager'], ['ORD-2610-111', 'sign', '09:21', 'EMP-082', 'Putra'], ['ORD-2610-111', 'done', '09:22', 'EMP-082'],
    ['ORD-2610-112', 'arrive', '10:24', 'EMP-082'],
    ['ORD-2610-131', 'arrive', '06:58', 'EMP-063'], ['ORD-2610-131', 'pic', '07:10', 'EMP-063', 'Ibu Nia Kurnia · Executive Housekeeper'], ['ORD-2610-131', 'sign', '07:11', 'EMP-063', 'Nia K.'], ['ORD-2610-131', 'done', '07:12', 'EMP-063'],
    ['ORD-2610-132', 'arrive', '07:38', 'EMP-063'], ['ORD-2610-132', 'pic', '07:50', 'EMP-063', 'Komang Ayu · Supervisor'], ['ORD-2610-132', 'sign', '07:51', 'EMP-063', 'Komang'], ['ORD-2610-132', 'done', '07:52', 'EMP-063']
  ];
  // Task chat (§65–§67). [order, 'HH:MM', by ('sys' for system events), kind, body, extra]
  D.CHAT = [
    ['ORD-2610-103', '08:30', 'sys', 'sys', 'assigned'],
    ['ORD-2610-103', '09:55', 'EMP-021', 'text', L('Pak Ketut, Tower B minta pickup di Loading Dock B ya.', 'Ketut, Tower B asks for pickup at Loading Dock B.')],
    ['ORD-2610-103', '09:58', 'CT-014', 'pin', L('Loading Dock B', 'Loading Dock B'), 'PR-01B'],
    ['ORD-2610-103', '10:20', 'sys', 'sys', 'tripstart'],
    ['ORD-2610-103', '10:21', 'EMP-002', 'text', L('Siap, berangkat dari Tower A. Kira-kira 15 menit.', 'On my way from Tower A. About 15 minutes.')],
    ['ORD-2610-121', '09:35', 'sys', 'sys', 'tripstart'],
    ['ORD-2610-121', '10:05', 'sys', 'sys', 'issue', L('Terlambat (macet)', 'Delayed (traffic)')],
    ['ORD-2610-121', '10:06', 'EMP-021', 'text', L('Noted Komang. Saya kabari Ibu Wayan di Triloka.', 'Noted Komang. I will tell Wayan at Triloka.')],
    ['ORD-2610-101', '09:15', 'sys', 'sys', 'pickdone'],
    ['ORD-2610-112', '10:24', 'sys', 'sys', 'arrived'],
    ['ORD-2610-112', '10:25', 'CT-091', 'text', L('Bag ada di dekat pantry, Pak.', 'The bags are near the pantry.')]
  ];
  // Notifications already sent today (§74–§75). to: client id · 'sup' · driver id
  D.NOTIFS = [
    ['CL-01', 'assigned', 'ORD-2610-103', '06:00'], ['CL-01', 'tripstart', 'ORD-2610-103', '10:20'], ['CL-07', 'tripstart', 'ORD-2610-121', '09:35'], ['CL-07', 'delay', 'ORD-2610-121', '10:05'],
    ['sup', 'vehicle', null, '08:55', 'JF-02'], ['sup', 'bagdiff', 'ORD-2610-132', '08:43'], ['sup', 'urgent', 'ORD-2610-141', '09:00'], ['CL-05', 'assigned', 'ORD-2610-123', '06:00'], ['CL-01', 'pickdone', 'ORD-2610-102', '09:46']
  ];
  // Location access already logged today (§79).
  D.LOCLOG = [['EMP-021', 'supervisor', 'EMP-083', 'TRP-2610-03', '10:07', L('Dispatch: cek keterlambatan', 'Dispatch: check delay')], ['CT-014', 'client', 'EMP-002', 'TRP-2610-01', '10:22', L('Pelacakan order sendiri', 'Own order tracking')]];

  // Last 30 days per driver (closed days) for the KPI engine (§76).
  // tasks, arrOn (on-time arrivals), pick, pickOn, del, delOn, travel (min), stop (min), failed, wait (client waiting min), evOk, ho, hoOk, routeIss, km, kmPlan, podOk
  D.HIST = {
    'EMP-002': { tasks: 132, arrOn: 127, pick: 84, pickOn: 81, del: 48, delOn: 46, travel: 2508, stop: 1452, failed: 1, wait: 198, evOk: 131, ho: 84, hoOk: 84, routeIss: 2, km: 740, kmPlan: 720, podOk: 48 },
    'EMP-082': { tasks: 118, arrOn: 109, pick: 70, pickOn: 65, del: 48, delOn: 44, travel: 2124, stop: 1416, failed: 2, wait: 236, evOk: 114, ho: 70, hoOk: 69, routeIss: 4, km: 700, kmPlan: 660, podOk: 47 },
    'EMP-083': { tasks: 96, arrOn: 86, pick: 58, pickOn: 52, del: 38, delOn: 34, travel: 1632, stop: 960, failed: 3, wait: 288, evOk: 90, ho: 58, hoOk: 57, routeIss: 6, km: 600, kmPlan: 540, podOk: 37 },
    'EMP-063': { tasks: 110, arrOn: 101, pick: 66, pickOn: 61, del: 44, delOn: 40, travel: 2090, stop: 1210, failed: 2, wait: 220, evOk: 106, ho: 66, hoOk: 64, routeIss: 3, km: 748, kmPlan: 690, podOk: 43 }
  };

  // Placeholder photos (inline SVG) for seeded evidence; real captures are stored as images.
  D.PHOTOS = {
    bags: 'bags', stain: 'stain', wet: 'wet'
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = D;
  else root.JFLOG_DATA = D;
})(typeof window !== 'undefined' ? window : this);
