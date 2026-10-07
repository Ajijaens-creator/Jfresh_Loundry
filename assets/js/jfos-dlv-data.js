/* ==========================================================================
   JFRESH OS — Phase 9 sample data (Delivery, Client Completion & Service
   Closure). Clients, properties, contacts, services, contracts and rate cards
   come from Phase 6 (jfos-comm-data.js); orders, trips, drivers, tracking,
   ETA and chat from Phase 7 (jfos-logi-data.js); batches from Phase 8
   (jfos-prod-data.js). This file only holds what is new in Phase 9: release
   records, delivery tasks, POD, reconciliation, delivery issues, returns and
   redeliveries, service completion, billing status, feedback and the
   delivery KPI history.
   Day shown: Tuesday 6 Oct 2026, simulated clock starts at 10:30.
   ========================================================================== */
(function (root) {
  function L(a, b) { return [a, b === undefined ? a : b]; }
  var D = { today: '2026-10-06', simNow: '2026-10-06 10:30' };
  var Y = '2026-10-05 ', T0 = '2026-10-06 ';

  // Ready-to-deliver releases (§4–§7). src 'prod' reads the live Phase 8 batch; the others are snapshots of
  // batches finished on the night shift (their production record is closed).
  function rl(id, batch, cl, prop, svc, qty, kg, pkgs, date, win, st, x) {
    return Object.assign({ id: id, src: 'snap', batch: batch, cl: cl, prop: prop, svc: svc, qty: qty, kg: kg, pkgs: pkgs, date: date, win: win, st: st, pri: 'normal',
      qc: 'pass', pack: true, pkgOk: true, label: true, recOk: true, critIss: false, instr: '', readyAt: T0 + '06:00', hold: null, relAt: null, relBy: null, dlv: null, ovr: null }, x || {});
  }
  D.RELEASES = [
    { id: 'REL-2610-001', src: 'prod', batch: 'B-2610-001', st: 'waiting', readyAt: Y + '22:10', hold: null, relAt: null, relBy: null, dlv: null, ovr: null },
    rl('REL-2610-002', 'B-2610-901', 'CL-07', 'PR-07A', 'SV-007', 118, 44, 4, D.today, ['16:00', '17:00'], 'ready', { readyAt: T0 + '05:40', instr: L('Pisahkan handuk spa dan linen bed.', 'Separate spa towels and bed linen.') }),
    rl('REL-2610-003', 'B-2610-902', 'CL-01', 'PR-01A', 'SV-006', 214, 96, 8, D.today, ['17:00', '18:00'], 'waiting', { label: false, readyAt: T0 + '07:15', instr: L('Linen kamar dihitung per pcs saat serah terima.', 'Room linen is counted per piece at handover.') }),
    rl('REL-2610-004', 'B-2610-903', 'CL-02', 'PR-02A', 'SV-006', 160, 70, 6, D.today, ['18:00', '19:00'], 'hold', { qc: 'partial', readyAt: T0 + '08:05', hold: { by: 'EMP-021', at: T0 + '09:15', reason: L('Menunggu QC ulang 2 pcs bernoda.', 'Waiting for a QC re-check of 2 stained pieces.') } }),
    rl('REL-2610-005', 'B-2610-904', 'CL-06', 'PR-06A', 'SV-007', 58, 22, 2, '2026-10-07', ['10:00', '11:00'], 'issue', { critIss: true, readyAt: T0 + '09:40', issue: L('Satu paket robek saat dipindahkan ke rak siap kirim.', 'One package tore while being moved to the ready rack.') }),
    rl('REL-2610-006', 'B-2610-905', 'CL-01', 'PR-01B', 'SV-006', 150, 62, 6, D.today, ['08:00', '09:00'], 'released', { readyAt: Y + '23:20', relAt: T0 + '06:30', relBy: 'EMP-021', dlv: 'DLV-2610-008' }),
    rl('REL-2610-007', 'B-2610-906', 'CL-05', 'PR-05A', 'SV-006', 200, 82, 10, D.today, ['07:00', '07:30'], 'released', { readyAt: Y + '23:45', relAt: T0 + '06:10', relBy: 'EMP-021', dlv: 'DLV-2610-009' }),
    rl('REL-2610-008', 'B-2610-907', 'CL-07', 'PR-07B', 'SV-008', 72, 36, 4, D.today, ['09:00', '10:00'], 'released', { readyAt: T0 + '05:10', relAt: T0 + '07:30', relBy: 'EMP-021', dlv: 'DLV-2610-010' }),
    rl('REL-2610-009', 'B-2610-908', 'CL-08', 'PR-08A', 'SV-006', 64, 26, 3, D.today, ['14:00', '15:00'], 'released', { readyAt: T0 + '08:50', relAt: T0 + '09:50', relBy: 'EMP-021', dlv: 'DLV-2610-012' }),
    rl('REL-2610-010', 'B-2610-909', 'CL-07', 'PR-07C', 'SV-007', 56, 24, 3, D.today, ['15:30', '16:30'], 'released', { pri: 'express', readyAt: T0 + '09:20', relAt: T0 + '10:05', relBy: 'EMP-021', dlv: 'DLV-2610-013' })
  ];

  // Delivery tasks (§8–§9). ord = Phase 7 order when the delivery runs on a Phase 7 trip; seeded tasks that
  // already ran keep their own driver, vehicle and events. ev: [status, time, by, note]
  function dl(id, cl, prop, svc, date, win, pkgs, qty, kg, st, x) {
    return Object.assign({ id: id, rel: null, ord: null, batch: null, cl: cl, prop: prop, svc: svc, date: date, win: win, pkgs: pkgs, qty: qty, kg: kg, pri: 'normal', instr: '', ct: null, drv: null, veh: null, route: null,
      st: st, ev: [], created: null, ho: null, pod: null, rec: null, issues: [], ret: null, orig: null, redel: null, sla: null, comp: null, bill: null, fb: null, attempt: 1, hold: null }, x || {});
  }
  function pod(id, recv, role, at, pkgs, qty, kg, cond, notes, by, x) { return Object.assign({ id: id, recv: recv, role: role, sign: 'seed:sig', photo: 'seed:pod', at: at, loc: true, pkgs: pkgs, qty: qty, kg: kg, cond: cond, notes: notes || '', by: by, ver: 1, amend: [] }, x || {}); }
  function recOk(at, pkgs, qty, kg) { return { res: 'ok', at: at, by: 'system', sent: { pkgs: pkgs, qty: qty, kg: kg }, recv: { pkgs: pkgs, qty: qty, kg: kg }, acc: 'full', accQty: qty, rejQty: 0, review: null }; }
  function comp(at, by, sla) { return { at: at, by: by, ver: 1, frozen: true, hist: [], sla: sla }; }
  function ev(list, by) { return list.map(function (x) { return [x[0], x[1], x[2] || by, x[3] || null]; }); }
  D.DELIVERIES = [
    // Yesterday (5 Oct): completed and billed / waiting for billing
    dl('DLV-2610-001', 'CL-01', 'PR-01A', 'SV-006', '2026-10-05', ['16:00', '17:00'], 8, 210, 96, 'completed', { batch: 'B-2610-801', ct: 'CT-011', drv: 'EMP-002', veh: 'JF-01', route: 'R-01', created: [Y + '13:10', 'EMP-021'],
      ev: ev([['waiting', Y + '13:10', 'EMP-021'], ['assigned', Y + '13:20', 'EMP-021'], ['ontheway', Y + '16:15'], ['arrived', Y + '16:36'], ['handover', Y + '16:37'], ['delivered', Y + '16:42'], ['completed', Y + '17:10', 'EMP-021']], 'EMP-002'),
      pod: pod('POD-2610-001', 'Ibu Sari Wulandari', 'Executive Housekeeper', Y + '16:42', 8, 210, 96, 'good', '', 'EMP-002'), rec: recOk(Y + '16:42', 8, 210, 96),
      sla: { promised: Y + '17:00', actual: Y + '16:42', min: -18, st: 'ontime' }, comp: comp(Y + '17:10', 'EMP-021'), bill: { st: 'sent', id: 'BIL-2610-001', at: T0 + '08:05', by: 'EMP-030', sent: T0 + '08:15', ver: 1 }, fb: 'FB-2610-01' }),
    dl('DLV-2610-002', 'CL-05', 'PR-05A', 'SV-006', '2026-10-05', ['15:00', '16:00'], 10, 190, 85, 'completed', { batch: 'B-2610-802', ct: 'CT-051', drv: 'EMP-063', veh: 'JF-02', route: 'R-04', created: [Y + '12:40', 'EMP-021'],
      ev: ev([['waiting', Y + '12:40', 'EMP-021'], ['assigned', Y + '12:45', 'EMP-021'], ['ontheway', Y + '15:05'], ['arrived', Y + '15:30'], ['handover', Y + '15:31'], ['delivered', Y + '15:38'], ['completed', Y + '16:20', 'EMP-021']], 'EMP-063'),
      pod: pod('POD-2610-002', 'Ibu Nia Kurnia', 'Executive Housekeeper', Y + '15:38', 10, 190, 85, 'good', '', 'EMP-063'), rec: recOk(Y + '15:38', 10, 190, 85),
      sla: { promised: Y + '16:00', actual: Y + '15:38', min: -22, st: 'ontime' }, comp: comp(Y + '16:20', 'EMP-021'), bill: { st: 'ready', id: 'BIL-2610-002', at: T0 + '08:20', by: 'EMP-030', sent: null, ver: 1 } }),
    dl('DLV-2610-003', 'CL-07', 'PR-07A', 'SV-007', '2026-10-05', ['16:00', '17:00'], 4, 120, 45, 'completed', { batch: 'B-2610-803', ct: 'CT-074', drv: 'EMP-002', veh: 'JF-01', route: 'R-01', created: [Y + '13:10', 'EMP-021'],
      ev: ev([['waiting', Y + '13:10', 'EMP-021'], ['assigned', Y + '13:20', 'EMP-021'], ['ontheway', Y + '15:55'], ['arrived', Y + '16:06'], ['handover', Y + '16:07'], ['delivered', Y + '16:12'], ['completed', Y + '16:30', 'EMP-021']], 'EMP-002'),
      pod: pod('POD-2610-003', 'Mila Putri', 'Supervisor', Y + '16:12', 4, 120, 45, 'good', '', 'EMP-002'), rec: recOk(Y + '16:12', 4, 120, 45),
      sla: { promised: Y + '17:00', actual: Y + '16:12', min: -48, st: 'ontime' }, comp: comp(Y + '16:30', 'EMP-021'), bill: { st: 'sent', id: 'BIL-2610-003', at: T0 + '08:06', by: 'EMP-030', sent: T0 + '08:15', ver: 1 }, fb: 'FB-2610-02' }),
    dl('DLV-2610-004', 'CL-03', 'PR-03A', 'SV-006', '2026-10-05', ['14:00', '15:00'], 5, 96, 40, 'completed', { batch: 'B-2610-804', ct: 'CT-033', drv: 'EMP-082', veh: 'JF-03', route: 'R-02', created: [Y + '11:00', 'EMP-021'],
      ev: ev([['waiting', Y + '11:00', 'EMP-021'], ['assigned', Y + '11:05', 'EMP-021'], ['ontheway', Y + '14:20'], ['arrived', Y + '15:30', null, L('Macet di Jl. Sunset Road', 'Traffic on Jl. Sunset Road')], ['handover', Y + '15:31'], ['delivered', Y + '15:35'], ['completed', Y + '16:00', 'EMP-021']], 'EMP-082'),
      pod: pod('POD-2610-004', 'Kadek Surya', 'Housekeeping Supervisor', Y + '15:35', 5, 96, 40, 'good', '', 'EMP-082'), rec: recOk(Y + '15:35', 5, 96, 40),
      sla: { promised: Y + '15:00', actual: Y + '15:35', min: 35, st: 'late', cause: 'traffic' }, comp: comp(Y + '16:00', 'EMP-021'), bill: { st: 'validation', id: null, at: null, by: null, sent: null, ver: 1 } }),
    dl('DLV-2610-005', 'CL-04', 'PR-04A', 'SV-006', '2026-10-05', ['13:00', '14:00'], 7, 140, 55, 'completed', { batch: 'B-2610-805', ct: 'CT-042', drv: 'EMP-083', veh: 'JF-04', route: 'R-05', created: [Y + '10:30', 'EMP-021'],
      ev: ev([['waiting', Y + '10:30', 'EMP-021'], ['assigned', Y + '10:40', 'EMP-021'], ['ontheway', Y + '12:50'], ['arrived', Y + '13:34'], ['handover', Y + '13:35'], ['delivered', Y + '13:40'], ['completed', Y + '14:20', 'EMP-021']], 'EMP-083'),
      pod: pod('POD-2610-005', 'Wayan Gede', 'Villa Manager', Y + '13:40', 7, 140, 55, 'good', '', 'EMP-083'), rec: recOk(Y + '13:40', 7, 140, 55),
      sla: { promised: Y + '14:00', actual: Y + '13:40', min: -20, st: 'ontime' }, comp: comp(Y + '14:20', 'EMP-021'),
      bill: { st: 'hold', id: null, at: T0 + '08:30', by: 'EMP-030', sent: null, ver: 1, note: L('Piutang Oceanview lewat batas. Tunggu keputusan Finance.', 'Oceanview receivables are overdue. Waiting for a Finance decision.') } }),
    dl('DLV-2610-006', 'CL-11', 'PR-11A', 'SV-005', '2026-10-05', ['17:00', '18:00'], 1, 3, 2, 'completed', { batch: 'B-2610-806', ct: 'CT-111', drv: 'EMP-002', veh: 'JF-01', route: null, created: [Y + '14:00', 'EMP-081'],
      ev: ev([['waiting', Y + '14:00', 'EMP-081'], ['assigned', Y + '14:10', 'EMP-021'], ['ontheway', Y + '17:02'], ['arrived', Y + '17:16'], ['handover', Y + '17:17'], ['delivered', Y + '17:20'], ['completed', Y + '17:40', 'EMP-021']], 'EMP-002'),
      pod: pod('POD-2610-006', 'Ratna Dewi', L('Pemilik', 'Owner'), Y + '17:20', 1, 3, 2, 'good', L('Gaun digantung, tidak dilipat.', 'Dress kept on a hanger, not folded.'), 'EMP-002'), rec: recOk(Y + '17:20', 1, 3, 2),
      sla: { promised: Y + '18:00', actual: Y + '17:20', min: -40, st: 'ontime' }, comp: comp(Y + '17:40', 'EMP-021'), bill: { st: 'validation', id: null, at: null, by: null, sent: null, ver: 1 } }),
    dl('DLV-2610-007', 'CL-09', 'PR-09A', 'SV-006', '2026-10-05', ['15:00', '16:00'], 4, 60, 24, 'returned', { batch: 'B-2610-807', ct: 'CT-091', drv: 'EMP-082', veh: 'JF-03', route: 'R-02', created: [Y + '11:30', 'EMP-021'],
      ev: ev([['waiting', Y + '11:30', 'EMP-021'], ['assigned', Y + '11:35', 'EMP-021'], ['ontheway', Y + '14:58'], ['arrived', Y + '15:20'], ['issue', Y + '15:24', null, L('Klien tidak ada di lokasi', 'Client not at the location')], ['returned', Y + '15:26', 'EMP-021']], 'EMP-082'),
      issues: ['DI-2610-01'], ret: 'RET-2610-01', redel: 'DLV-2610-011', sla: { promised: Y + '16:00', actual: null, min: null, st: 'exception', cause: 'client' } }),
    // Today (6 Oct)
    dl('DLV-2610-008', 'CL-01', 'PR-01B', 'SV-006', D.today, ['08:00', '09:00'], 6, 150, 62, 'completed', { rel: 'REL-2610-006', batch: 'B-2610-905', ct: 'CT-014', drv: 'EMP-002', veh: 'JF-01', route: 'R-01', created: [T0 + '06:30', 'EMP-021'],
      ev: ev([['waiting', T0 + '06:30', 'EMP-021'], ['assigned', T0 + '06:35', 'EMP-021'], ['ontheway', T0 + '07:45'], ['arrived', T0 + '08:05'], ['handover', T0 + '08:06'], ['delivered', T0 + '08:12'], ['completed', T0 + '08:40', 'EMP-021']], 'EMP-002'),
      pod: pod('POD-2610-008', 'Agus Pratama', 'Linen Room Supervisor', T0 + '08:12', 6, 150, 62, 'good', '', 'EMP-002'), rec: recOk(T0 + '08:12', 6, 150, 62),
      sla: { promised: T0 + '09:00', actual: T0 + '08:12', min: -48, st: 'ontime' }, comp: comp(T0 + '08:40', 'EMP-021'), bill: { st: 'validation', id: null, at: null, by: null, sent: null, ver: 1 } }),
    dl('DLV-2610-009', 'CL-05', 'PR-05A', 'SV-006', D.today, ['07:00', '07:30'], 10, 200, 82, 'issue', { rel: 'REL-2610-007', batch: 'B-2610-906', ct: 'CT-051', drv: 'EMP-063', veh: 'JF-02', route: 'R-04', created: [T0 + '06:10', 'EMP-021'],
      ev: ev([['waiting', T0 + '06:10', 'EMP-021'], ['assigned', T0 + '06:12', 'EMP-021'], ['ontheway', T0 + '06:40'], ['arrived', T0 + '06:58'], ['handover', T0 + '07:00'], ['delivered', T0 + '07:08'], ['issue', T0 + '07:10', null, L('1 paket tidak ada saat serah terima', '1 package missing at handover')]], 'EMP-063'),
      pod: pod('POD-2610-009', 'Ibu Nia Kurnia', 'Executive Housekeeper', T0 + '07:08', 9, 180, 74, 'note', L('Diterima 9 dari 10 paket.', 'Received 9 of 10 packages.'), 'EMP-063'),
      rec: { res: 'diff', at: T0 + '07:10', by: 'EMP-063', sent: { pkgs: 10, qty: 200, kg: 82 }, recv: { pkgs: 9, qty: 180, kg: 74 }, type: 'missing', reason: L('1 paket tidak ditemukan di mobil saat serah terima.', '1 package was not found in the van at handover.'), notes: L('Dicek ulang bersama PIC, 9 paket utuh.', 'Re-checked with the PIC, 9 packages intact.'), photo: 'seed:bags', pic: 'Ibu Nia Kurnia', acc: 'partial', accQty: 180, rejQty: 0, retReq: false, review: 'pending' },
      issues: ['DI-2610-02'], sla: { promised: T0 + '07:30', actual: T0 + '07:08', min: -22, st: 'ontime' } }),
    dl('DLV-2610-010', 'CL-07', 'PR-07B', 'SV-008', D.today, ['09:00', '10:00'], 4, 72, 36, 'delivered', { rel: 'REL-2610-008', batch: 'B-2610-907', ct: 'CT-075', drv: 'EMP-082', veh: 'JF-03', route: 'R-02', created: [T0 + '07:30', 'EMP-021'],
      ev: ev([['waiting', T0 + '07:30', 'EMP-021'], ['assigned', T0 + '07:32', 'EMP-021'], ['ontheway', T0 + '08:50'], ['arrived', T0 + '09:12'], ['handover', T0 + '09:13'], ['delivered', T0 + '09:25']], 'EMP-082'),
      pod: pod('POD-2610-010', 'Putra Mahendra', 'Operations Manager', T0 + '09:25', 4, 70, 35, 'partial', L('2 handuk dikembalikan karena noda.', '2 towels returned because of stains.'), 'EMP-082'),
      rec: { res: 'diff', at: T0 + '09:27', by: 'EMP-082', sent: { pkgs: 4, qty: 72, kg: 36 }, recv: { pkgs: 4, qty: 70, kg: 35 }, type: 'qty', reason: L('2 handuk ditolak klien karena masih ada noda.', '2 towels rejected by the client because stains remain.'), notes: L('Handuk dipisah ke kantong return.', 'Towels separated into a return bag.'), photo: 'seed:stain', pic: 'Putra Mahendra', acc: 'partial', accQty: 70, rejQty: 2, retReq: true, review: 'approved', revBy: 'EMP-021', revAt: T0 + '09:40', revNote: L('Partial disetujui. Return untuk rewash.', 'Partial approved. Return for rewash.') },
      issues: ['DI-2610-03'], ret: 'RET-2610-02', sla: { promised: T0 + '10:00', actual: T0 + '09:25', min: -35, st: 'ontime' } }),
    dl('DLV-2610-011', 'CL-09', 'PR-09A', 'SV-006', D.today, ['13:00', '14:00'], 4, 60, 24, 'waiting', { batch: 'B-2610-807', ct: 'CT-091', orig: 'DLV-2610-007', ret: 'RET-2610-01', attempt: 2, created: [Y + '16:55', 'EMP-021'], instr: L('Pengiriman ulang. Telepon Ibu Sari 15 menit sebelum tiba.', 'Redelivery. Call Ms Sari 15 minutes before arrival.'),
      ev: ev([['waiting', Y + '16:55', 'EMP-021', L('Redelivery dari RET-2610-01', 'Redelivery from RET-2610-01')]], 'EMP-021') }),
    dl('DLV-2610-012', 'CL-08', 'PR-08A', 'SV-006', D.today, ['14:00', '15:00'], 3, 64, 26, 'waiting', { rel: 'REL-2610-009', batch: 'B-2610-908', ct: 'CT-081', created: [T0 + '09:50', 'EMP-021'], ev: ev([['waiting', T0 + '09:50', 'EMP-021']], 'EMP-021') }),
    dl('DLV-2610-013', 'CL-07', 'PR-07C', 'SV-007', D.today, ['15:30', '16:30'], 3, 56, 24, 'waiting', { rel: 'REL-2610-010', batch: 'B-2610-909', ct: 'CT-076', pri: 'express', created: [T0 + '10:05', 'EMP-021'], ev: ev([['waiting', T0 + '10:05', 'EMP-021']], 'EMP-021') })
  ];

  // Delivery issues (§24–§25, §50). st: new · review · resolved · closed
  D.ISSUES = [
    { id: 'DI-2610-01', dlv: 'DLV-2610-007', type: 'unavail', sev: 'warn', at: Y + '15:24', by: 'EMP-082', src: 'driver', note: L('Villa tutup, PIC tidak bisa dihubungi.', 'Villa closed, the PIC could not be reached.'), photo: 'seed:pod', action: 'redelivery', st: 'resolved', res: L('Dibawa kembali ke plant, redelivery dijadwalkan.', 'Brought back to the plant, redelivery scheduled.'), resAt: Y + '16:55', resBy: 'EMP-021', ret: 'RET-2610-01', cmp: null },
    { id: 'DI-2610-02', dlv: 'DLV-2610-009', type: 'missing', sev: 'crit', at: T0 + '07:10', by: 'EMP-063', src: 'driver', note: L('Dikirim 10 paket, diterima 9. Satu paket belum ditemukan.', 'Sent 10 packages, 9 received. One package not found yet.'), photo: 'seed:bags', action: 'review', st: 'review', res: null, ret: null, cmp: null },
    { id: 'DI-2610-03', dlv: 'DLV-2610-010', type: 'quality', sev: 'warn', at: T0 + '09:22', by: 'EMP-082', src: 'driver', note: L('Klien menolak 2 handuk karena masih ada noda.', 'The client rejected 2 towels because stains remain.'), photo: 'seed:stain', action: 'partial', st: 'resolved', res: L('Partial accept disetujui, return untuk rewash, komplain dibuat.', 'Partial accept approved, return for rewash, complaint opened.'), resAt: T0 + '09:40', resBy: 'EMP-021', ret: 'RET-2610-02', cmp: 'CMP-2610-01' },
    { id: 'DI-2610-04', dlv: 'DLV-2610-001', type: 'qty', sev: 'warn', at: T0 + '08:50', by: 'CT-011', src: 'client', note: L('1 sarung bantal kurang dari hitungan kami.', 'One pillowcase short compared with our count.'), photo: null, action: 'review', st: 'new', res: null, ret: null, cmp: null }
  ];

  // Returns (§26–§28)
  D.RETURNS = [
    { id: 'RET-2610-01', dlv: 'DLV-2610-007', ord: null, cl: 'CL-09', prop: 'PR-09A', reason: 'unavail', note: L('Klien tidak ada di lokasi. Paket utuh, segel tidak dibuka.', 'Client not at the location. Packages intact, seals unopened.'), pkgs: 4, qty: 60, kg: 24, photo: 'seed:pod', drv: 'EMP-082',
      at: Y + '15:26', st: 'ready', need: 'redelivery', owner: 'EMP-021', redel: 'DLV-2610-011',
      hist: [['created', Y + '15:26', 'EMP-082'], ['intransit', Y + '15:30', 'EMP-082'], ['arrived', Y + '16:40', 'EMP-077'], ['review', Y + '16:45', 'EMP-021'], ['ready', Y + '16:55', 'EMP-021', L('Tidak perlu proses ulang', 'No reprocessing needed')]] },
    { id: 'RET-2610-02', dlv: 'DLV-2610-010', ord: null, cl: 'CL-07', prop: 'PR-07B', reason: 'quality', note: L('2 handuk bernoda, rewash.', '2 stained towels, rewash.'), pkgs: 1, qty: 2, kg: 1, photo: 'seed:stain', drv: 'EMP-082',
      at: T0 + '09:40', st: 'intransit', need: 'reprocess', owner: 'EMP-021', redel: null, hist: [['created', T0 + '09:40', 'EMP-021'], ['intransit', T0 + '09:45', 'EMP-082']] }
  ];

  // Complaint cases linked to delivery (§30). They also join the Phase 6 complaint list for Client Health.
  D.COMPLAINTS = [
    { id: 'CMP-2610-01', dlv: 'DLV-2610-010', cl: 'CL-07', prop: 'PR-07B', batch: 'B-2610-907', type: 'stain', at: T0 + '09:40', by: 'EMP-021', note: L('2 handuk masih bernoda saat diterima.', '2 towels still stained on delivery.'), st: 'open' }
  ];

  // Client feedback (§49)
  D.FEEDBACK = [
    { id: 'FB-2610-01', dlv: 'DLV-2610-001', cl: 'CL-01', by: 'CT-011', at: T0 + '07:30', dr: 5, qr: 5, c: L('Rapi dan tepat waktu. Terima kasih.', 'Neat and on time. Thank you.') },
    { id: 'FB-2610-02', dlv: 'DLV-2610-003', cl: 'CL-07', by: 'CT-074', at: Y + '18:05', dr: 5, qr: 4, c: L('Handuk wangi, satu robe sedikit kusut.', 'Towels smell fresh, one robe slightly wrinkled.') }
  ];

  // Driver performance extras over the last 30 days (deliveries, on-time and POD come from Phase 7 history).
  D.DRV9 = {
    'EMP-002': { first: 47, iss: 1, rSum: 196, rN: 40 },
    'EMP-082': { first: 45, iss: 2, rSum: 179, rN: 38 },
    'EMP-083': { first: 35, iss: 3, rSum: 147, rN: 32 },
    'EMP-063': { first: 41, iss: 2, rSum: 158, rN: 35 }
  };
  // Delivery performance per property, last 30 days (closed days).
  function pp(prop, n, on, delay, iss, ret, rSum, rN) { return { prop: prop, n: n, on: on, delay: delay, iss: iss, ret: ret, rSum: rSum, rN: rN }; }
  D.PROP30 = [
    pp('PR-07A', 30, 30, 0, 0, 0, 145, 29), pp('PR-07B', 30, 29, 6, 1, 1, 136, 28), pp('PR-07C', 26, 24, 22, 1, 0, 112, 24), pp('PR-07D', 30, 28, 14, 1, 0, 131, 28),
    pp('PR-01A', 30, 29, 8, 1, 0, 144, 30), pp('PR-01B', 30, 30, 0, 0, 0, 142, 29), pp('PR-05A', 30, 28, 12, 2, 0, 128, 27), pp('PR-03A', 30, 27, 31, 1, 0, 121, 26),
    pp('PR-03B', 12, 12, 0, 0, 0, 58, 12), pp('PR-02A', 30, 28, 18, 1, 1, 130, 28), pp('PR-04A', 26, 25, 9, 0, 0, 118, 25), pp('PR-06A', 26, 26, 0, 0, 0, 125, 25),
    pp('PR-08A', 13, 12, 10, 1, 0, 58, 12), pp('PR-09A', 9, 7, 25, 2, 1, 36, 8), pp('PR-11A', 4, 4, 0, 0, 0, 20, 4)
  ];
  // Top delivery issue types over the last 30 days (closed days).
  D.ISSUE30 = { unavail: 28, wrongpkg: 16, late: 12, quality: 8, wrongprop: 5, missing: 4, damaged: 3, reject: 2, qty: 6, other: 3 };

  /* KPI history: one row per closed day for the last 400 days (deterministic, no server yet).
     [date, planned, delivered, onTime, firstOk, podOk, recOk, returns, redel, issues, complaints, fullAcc, rSumD, rSumQ, rN, waitMin, respMin] */
  D.HIST = (function () {
    var seed = 9, out = [], end = Date.UTC(2026, 9, 5);
    function rnd() { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }
    for (var i = 399; i >= 0; i--) {
      var t = end - i * 864e5, d = new Date(t), dow = d.getUTCDay(), m = d.getUTCMonth();
      var season = [0.86, 0.8, 0.84, 0.9, 0.95, 1.0, 1.12, 1.18, 1.05, 1.0, 0.92, 1.1][m], ramp = 0.86 + (399 - i) / 399 * 0.14;
      var planned = Math.round((44 + rnd() * 10) * season * ramp * (dow === 0 ? 0.82 : 1));
      var delivered = planned - (rnd() < 0.35 ? 1 : 0);
      var otp = 0.93 + rnd() * 0.05 + (399 - i) / 399 * 0.015, onTime = Math.min(delivered, Math.round(delivered * otp));
      var issues = Math.round(delivered * (0.012 + rnd() * 0.02)), ret = Math.min(issues, Math.round(delivered * (0.008 + rnd() * 0.014))), redel = Math.min(ret, Math.round(delivered * (0.004 + rnd() * 0.01)));
      var firstOk = delivered - redel - (rnd() < 0.3 ? 1 : 0), podOk = delivered - (rnd() < 0.25 ? 1 : 0), recOk = delivered - (rnd() < 0.3 ? 1 : 0), cmp = rnd() < 0.18 ? 1 : 0;
      var fullAcc = delivered - ret - (rnd() < 0.2 ? 1 : 0), rN = Math.round(delivered * (0.55 + rnd() * 0.2));
      out.push([new Date(t).toISOString().slice(0, 10), planned, delivered, onTime, firstOk, podOk, recOk, ret, redel, issues, cmp, fullAcc, Math.round(rN * (4.62 + rnd() * 0.3)), Math.round(rN * (4.5 + rnd() * 0.35)), rN, Math.round(delivered * (2 + rnd() * 3)), Math.round(12 + rnd() * 14)]);
    }
    return out;
  })();

  if (typeof module !== 'undefined' && module.exports) module.exports = D;
  else root.JFDLV_DATA = D;
})(typeof window !== 'undefined' ? window : this);
