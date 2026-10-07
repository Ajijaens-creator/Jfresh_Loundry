/* ==========================================================================
   JFRESH OS — Client Portal seed (Phase 11 · NP 1.0 · NP-01…NP-06)
   Only what the earlier phases do not already hold. Orders, schedules,
   tracking, production, deliveries, POD, returns, complaints, contracts,
   documents and finance all come from the Phase 6–10 engines at run time.
   This file adds:
   · the Jaens Spa Group client users (NP-06) and the profiles of the client
     users that already existed (Grand Vista, Hotel ABC, Kayana);
   · four Jaens case records that match the NV-05 sheet (the other cases are
     linked from the Phase 6 / Phase 9 complaint records);
   · four Jaens invoices (the Phase 10 seed holds only one, already paid, so the
     billing view would have nothing open): seeded INTO the finance engine's
     own seed, so the AR subledger still equals the GL (see jfos-clp.js);
   · two earlier pickup requests and a few earlier portal views (KPI §70).
   ========================================================================== */
(function (root) {
  function L(a, b) { return [a, b === undefined ? a : b]; }
  var D = { today: '2026-10-06', simNow: '2026-10-06 10:30' };

  /* Client users (§24–§29). uid = access user id. role = client role key (§26).
     scope all | sel | single (§25). grant / deny = per-user overrides of the role permissions (§28). */
  function cu(uid, u, cl, name, email, phone, pos, role, scope, props, st, o) {
    return Object.assign({ uid: uid, u: u, cl: cl, name: name, email: email, phone: phone, pos: pos, role: role, scope: scope, props: props || [], st: st, start: '2026-01-01', end: null, grant: [], deny: [], ct: null, last: null, by: 'EMP-041', at: '2026-01-02 09:00', demo: null }, o || {});
  }
  D.USERS = [
    cu('USR-701', 'arya.jaens', 'CL-07', 'Arya Wijaya', 'arya@jaensspa.com', '+62 811 3801 7101', 'General Manager', 'gm', 'all', [], 'active',
      { ct: 'CT-071', last: '2026-10-06 07:55', demo: L('Klien · Jaens Spa Group · GM (semua property, kelola user)', 'Client · Jaens Spa Group · GM (all properties, manages users)') }),
    cu('USR-702', 'mila.jaens', 'CL-07', 'Mila Putri', 'mila@jaensspa.com', '+62 812 3456 7890', 'Front Office', 'fo', 'single', ['PR-07A'], 'active',
      { ct: 'CT-074', last: '2026-10-06 08:40', demo: L('Klien · Jaens Spa Center · Front Office (1 property)', 'Client · Jaens Spa Center · Front Office (1 property)') }),
    cu('USR-703', 'putu.jaens', 'CL-07', 'Putu Ayu', 'putu@jaensspa.com', '+62 811 3801 7104', 'Finance', 'finance', 'all', [], 'active',
      { last: '2026-10-05 16:20', demo: L('Klien · Jaens Spa Group · Finance (invoice & pembayaran)', 'Client · Jaens Spa Group · Finance (invoices & payments)') }),
    cu('USR-704', 'kadek.jaens', 'CL-07', 'Kadek Ari', 'kadek@jaensspa.com', '+62 812 3456 7897', 'Operations Manager', 'opsmgr', 'sel', ['PR-07B', 'PR-07C'], 'active', { last: '2026-10-04 09:10' }),
    cu('USR-705', 'wayan.jaens', 'CL-07', 'Wayan Dika', 'wayan.dika@jaensspa.com', '+62 812 3456 7898', 'Supervisor', 'supervisor', 'single', ['PR-07D'], 'suspended',
      { last: '2026-09-12 08:30', note: L('Cuti panjang sampai November.', 'Long leave until November.') }),
    cu('USR-706', 'komang.jaens', 'CL-07', 'Komang Intan', 'owner@jaensspa.com', '+62 811 3801 7100', 'Director', 'director', 'all', [], 'active', { last: '2026-10-02 19:45' }),
    cu('USR-707', 'gede.jaens', 'CL-07', 'Gede Wira', 'fo.bisma@jaensspa.com', '+62 812 3456 7895', 'Front Office', 'viewonly', 'single', ['PR-07D'], 'inactive',
      { ct: 'CT-079', end: '2026-08-31', last: '2026-08-30 11:00' }),
    cu('USR-708', 'sinta.jaens', 'CL-07', 'Sinta Dewi', 'sinta@jaensspa.com', '+62 812 3456 7899', 'Supervisor', 'supervisor', 'single', ['PR-07C'], 'invited',
      { start: '2026-10-07', at: '2026-10-05 15:30', by: 'USR-701' }),
    // Client users that existed before Phase 11 keep working with an Owner/GM-like profile over all of their properties.
    cu('USR-090', 'sari.grandvista', 'CL-01', 'Ibu Sari', 'sari@grandvista.id', '+62 811 2001 0011', 'Housekeeping Manager', 'gm', 'all', [], 'active', { last: '2026-10-06 07:10', legacy: true }),
    cu('USR-091', 'nia.hotelabc', 'CL-05', 'Ibu Nia', 'nia@hotelabc.id', '+62 811 2001 0051', 'Executive Housekeeper', 'gm', 'all', [], 'active', { last: '2026-10-05 13:00', legacy: true }),
    cu('USR-093', 'nyoman.kayana', 'CL-03', 'Pak Nyoman', 'ubud@kayana.com', '+62 811 2001 0031', 'Operations Manager', 'gm', 'all', [], 'active', { ct: 'CT-034', last: '2026-10-06 09:30', legacy: true })
  ];

  /* Case records seeded for the NV-05 sheet (§20–§23). Linked cases come from JFCOMM / JFDLV at seed time. */
  D.CASES = [
    { id: 'CASE-00201', cl: 'CL-07', prop: 'PR-07D', cat: 'latepickup', pri: 'normal', st: 'closed', at: '2026-09-05 09:10', by: 'USR-704', src: 'portal', ref: null,
      desc: L('Pickup pagi terlambat 40 menit, handuk kolam menumpuk.', 'Morning pickup 40 minutes late, pool towels piling up.'), pic: 'Kadek Ari · +62 812 3456 7897', owner: 'EMP-021',
      log: [['2026-09-05 09:30', 'EMP-021', 'assigned'], ['2026-09-05 11:00', 'EMP-021', 'review', L('Rute R-04 terlambat karena macet di Jl. Gatot Subroto.', 'Route R-04 late because of traffic on Jl. Gatot Subroto.')],
        ['2026-09-05 16:00', 'EMP-021', 'resolved', L('Jadwal Bisma dimajukan 15 menit dan rute dipisah di akhir pekan.', 'The Bisma pickup moved 15 minutes earlier and the route is split at weekends.')], ['2026-09-08 10:00', 'EMP-021', 'closed']],
      fb: { r: 4, c: L('Sudah lebih tepat waktu.', 'More on time now.'), at: '2026-09-08 09:00', by: 'USR-704' } },
    { id: 'CASE-00205', cl: 'CL-07', prop: 'PR-07C', cat: 'quality', pri: 'normal', st: 'resolved', at: '2026-09-18 16:15', by: 'USR-704', src: 'portal', ref: 'DLV-2610-003',
      desc: L('Beberapa handuk spa terasa kasar setelah dicuci.', 'Some spa towels feel rough after washing.'), pic: 'Kadek Ari · +62 812 3456 7897', owner: 'EMP-021',
      log: [['2026-09-18 16:40', 'EMP-021', 'assigned'], ['2026-09-19 09:00', 'EMP-021', 'review', L('Dosis softener disesuaikan untuk program P-TW.', 'Softener dose adjusted for programme P-TW.')],
        ['2026-09-19 15:00', 'EMP-021', 'resolved', L('Program cuci handuk spa diperbarui dan 12 handuk dicuci ulang tanpa biaya.', 'The spa towel programme was updated and 12 towels were rewashed free of charge.')]], fb: null },
    { id: 'CASE-00210', cl: 'CL-07', prop: 'PR-07B', cat: 'missing', pri: 'high', st: 'new', at: '2026-10-05 14:20', by: 'USR-701', src: 'portal', ref: null,
      desc: L('Barang kurang: 3 bathrobe tidak kembali dari pengiriman kemarin.', 'Items missing: 3 bathrobes did not come back with yesterday\'s delivery.'), pic: 'Arya Wijaya · +62 811 3801 7101', owner: null, log: [], fb: null },
    { id: 'CASE-00214', cl: 'CL-07', prop: 'PR-07A', cat: 'stain', pri: 'normal', st: 'review', at: '2026-10-06 08:30', by: 'USR-702', src: 'portal', ref: 'ORD-2610-101',
      desc: L('Noda pada linen: 4 sarung bantal masih ada noda minyak pijat.', 'Stains on linen: 4 pillowcases still show massage-oil stains.'), pic: 'Mila Putri · +62 812 3456 7890', owner: 'EMP-021',
      log: [['2026-10-06 08:50', 'EMP-021', 'assigned'], ['2026-10-06 09:15', 'EMP-021', 'review', L('Sarung bantal dipisah untuk treatment noda minyak di batch berikutnya.', 'Pillowcases separated for oil-stain treatment in the next batch.')]], fb: null }
  ];

  /* Jaens invoices joined to the Phase 10 finance seed (qty in kg, rate per kg from RC-07 v2 / RC-07C, PPN 11 %). */
  D.INVOICES = [
    { id: 'INV-2610-071', cl: 'CL-07', prop: 'PR-07A', period: '2026-09', issued: '2026-10-01', due: '2026-10-31', lines: [['SV-007', 780, 8500, '2026-09-30'], ['SV-008', 96, 7500, '2026-09-30']], paid: null },
    { id: 'INV-2610-072', cl: 'CL-07', prop: 'PR-07B', period: '2026-09', issued: '2026-10-01', due: '2026-10-25', lines: [['SV-008', 520, 7500, '2026-09-30']], paid: null },
    { id: 'INV-2609-074', cl: 'CL-07', prop: 'PR-07D', period: '2026-08', issued: '2026-08-31', due: '2026-09-30', lines: [['SV-002', 290, 8500, '2026-08-31']], paid: [1000000, '2026-09-22'] },
    { id: 'INV-2609-073', cl: 'CL-07', prop: 'PR-07C', period: '2026-08', issued: '2026-08-31', due: '2026-09-30', lines: [['SV-007', 820, 8000, '2026-08-31']], paid: [7281600, '2026-09-28'] }
  ];

  /* Earlier self-service requests (§10): one already done, one waiting for the operations team. */
  D.REQUESTS = [
    { id: 'REQ-2610-001', at: '2026-10-02 15:05', by: 'USR-702', cl: 'CL-07', prop: 'PR-07A', type: 'extra', st: 'done', ord: null, sch: 'SCH-01',
      fields: { svc: 'SV-007', date: '2026-10-03', win: ['14:00', '15:00'], bags: 3, kg: 18, pcs: null, pic: 'Mila Putri', phone: '+62 812 3456 7890', notes: L('Acara spa akhir pekan.', 'Weekend spa event.'), instr: '' },
      log: [['2026-10-02 15:05', 'USR-702', 'submitted'], ['2026-10-02 15:20', 'EMP-021', 'approved'], ['2026-10-03 14:35', 'EMP-002', 'done']] },
    { id: 'REQ-2610-002', at: '2026-10-06 07:45', by: 'USR-702', cl: 'CL-07', prop: 'PR-07A', type: 'reschedule', st: 'submitted', ord: 'ORD-2610-143', sch: 'SCH-02',
      fields: { date: '2026-10-06', win: ['17:30', '18:00'], reason: L('Tamu grup check-out sore, linen baru siap 17:30.', 'Group guests check out late, linen ready only at 17:30.') },
      log: [['2026-10-06 07:45', 'USR-702', 'submitted']] }
  ];
  D.SEQ = { req: 3, cas: 215, nt: 1, shr: 1 };

  /* Earlier digital views (§70 KPI): [kind, rec, uid, at]. */
  D.VIEWS = [['pod', 'POD-2610-003', 'USR-701', '2026-10-05 18:10'], ['inv', 'INV-2609-071', 'USR-703', '2026-09-03 10:00'], ['inv', 'INV-2610-071', 'USR-703', '2026-10-02 09:12'], ['track', 'ORD-2610-121', 'USR-704', '2026-10-06 09:52'], ['pod', 'POD-2610-001', 'USR-090', '2026-10-05 17:40']];

  if (typeof module !== 'undefined' && module.exports) module.exports = D;
  else root.JFCLP_DATA = D;
})(typeof window !== 'undefined' ? window : this);
