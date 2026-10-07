/* ==========================================================================
   JFRESH OS — Phase 6 automated test cases. Each case resets the
   commercial store and runs against the real engine (jfos-comm.js).
   Run in node:    node tools/test-comm.js
   Run in browser: phase6/tests.html
   ========================================================================== */
(function (root) {
  function L(a, b) { return [a, b === undefined ? a : b]; }
  var T = [];
  function add(group, id, name, fn) { T.push({ group: group, id: id, n: name, fn: fn }); }
  function eq(a, b, what) { if (a !== b) throw new Error((what || 'value') + ': expected ' + JSON.stringify(b) + ', got ' + JSON.stringify(a)); }
  function ok(v, what) { if (!v) throw new Error(what || 'expected true'); }
  function ctx(role, emp, extra) { return function (M) { return { uid: 'T-' + role, name: 'Tester ' + role, exp: role, roleKey: role, perms: (M.ROLE_PERMS[role] || []).concat(extra || []), employee: emp ? { id: emp } : null }; }; }
  var own = ctx('owner', 'EMP-050'), sal = ctx('sales', 'EMP-040'), sal2 = ctx('sales', 'EMP-041'), fin = ctx('finance', 'EMP-030'), ops = ctx('opsmgr', 'EMP-010'), spv = ctx('supervisor', 'EMP-021'), opr = ctx('operator', 'EMP-001');
  function cli(id) { return function (M) { return { uid: 'T-client', name: 'Client', exp: 'client', roleKey: 'client', client: id, perms: M.ROLE_PERMS.client.slice() }; }; }
  var gv = cli('CL-01'), abc = cli('CL-05');
  function T0(x) { return Array.isArray(x) ? x[0] : x; }

  /* ----- NP-01 Client & Property Master ----- */
  add('np01', 'CL-01', L('Klien (grup) dan property adalah record terpisah; satu klien punya banyak property', 'Client (group) and property are separate records; one client has many properties'), function (M) {
    var c = M.client('CL-07'); ok(c && !c.cl, 'client record has no parent client'); eq(M.propsOf('CL-07').length, 4, 'Jaens Spa has 4 properties');
    M.propsOf('CL-07').forEach(function (p) { eq(p.cl, 'CL-07'); ok(p.op && p.pickup, p.id + ' has its own PIC and pickup schedule'); });
    ok(M.prop('PR-07A').op !== M.prop('PR-07B').op, 'properties have different operational PICs');
  });
  add('np01', 'CL-02', L('Client 360: header dan ringkasan lengkap (§5–§6)', 'Client 360: full header and summary (§5–§6)'), function (M) {
    var s = M.summary(own(M), 'CL-07');
    ['health', 'activeProps', 'rev', 'revGrowth', 'ar', 'sla', 'activeContracts', 'next', 'openComplaints', 'openOpps'].forEach(function (k) { ok(s[k] !== undefined && s[k] !== null, k); });
    eq(s.activeProps, 4); ok(s.activeContracts >= 2, 'group contract + Triloka addendum'); eq(s.next.no, 'CTR-2025-022', 'next renewal = Triloka addendum');
  });
  add('np01', 'CL-03', L('Pencarian klien: nama, property, kode, telepon, kontak, nomor kontrak', 'Client search: name, property, code, phone, contact, contract number'), function (M) {
    function ids(q) { return M.searchClients(own(M), { q: q }).map(function (c) { return c.id; }); }
    ok(ids('jaens').indexOf('CL-07') >= 0, 'name'); ok(ids('Triloka').indexOf('CL-07') >= 0, 'property'); eq(ids('CL-05')[0], 'CL-05', 'code');
    ok(ids('0812 3456 7890').indexOf('CL-07') >= 0, 'phone in local format'); ok(ids('Mila').indexOf('CL-07') >= 0, 'contact'); ok(ids('CTR-2025-022').indexOf('CL-07') >= 0, 'contract number');
    ok(M.searchClients(own(M), { type: 'spa' }).every(function (c) { return c.type === 'spa'; }), 'type filter'); ok(M.searchClients(own(M), { health: 'critical' }).length >= 1, 'health filter');
  });
  add('np01', 'CL-04', L('Buat klien dan property: validasi, data dipakai ulang, audit', 'Create client and property: validation, data reuse, audit'), function (M) {
    eq(M.saveClient(sal(M), { n: '', type: 'hotel' }).code, 'invalid'); eq(M.saveClient(sal(M), { n: 'Jaens Spa Group', type: 'spa' }).code, 'dup');
    var r = M.saveClient(sal(M), { n: 'Sanur Bay Hotel', type: 'hotel', addr: 'Jl. Pantai Sindhu 1', city: 'Sanur', terms: 30, credit: 50e6 }); eq(r.ok, true); eq(r.client.status, 'prospect');
    var p = M.saveProperty(sal(M), { cl: r.client.id, n: 'Sanur Bay · Main' }); eq(p.ok, true); eq(p.prop.addr, 'Jl. Pantai Sindhu 1', 'address reused from the client'); eq(p.prop.city, 'Sanur');
    eq(M.saveProperty(sal(M), { cl: r.client.id, n: 'Sanur Bay · Main' }).code, 'dup'); eq(M.auditLog()[0].ev, 'PROPERTY.ADD');
    eq(M.saveClient(opr(M), { n: 'X', type: 'hotel' }).code, 'noperm');
  });
  add('np01', 'CL-05', L('Status, termin dan limit kredit: alasan wajib, termin & kredit lewat persetujuan', 'Status, terms and credit limit: reason required, terms & credit through approval'), function (M) {
    eq(M.saveClient(sal(M), { id: 'CL-10', n: 'Bali Nest', type: 'villa', status: 'inactive' }).code, 'reason');
    eq(M.saveClient(sal(M), { id: 'CL-10', n: 'Bali Nest', type: 'villa', status: 'inactive', reason: 'Tidak lanjut' }).ok, true); eq(M.client('CL-10').status, 'inactive');
    var r = M.saveClient(sal(M), { id: 'CL-02', n: 'The Santai Hotel', type: 'hotel', credit: 400e6, reason: 'Volume naik' }); eq(r.ok, true); eq(r.pending.length, 1); eq(M.client('CL-02').credit, 300e6, 'credit unchanged until approved');
    eq(M.decide(own(M), r.pending[0], 'approve').ok, true); eq(M.client('CL-02').credit, 400e6);
  });

  /* ----- NP-02 Contacts ----- */
  add('np02', 'CT-01', L('Kontak tingkat grup dan property dengan cakupan semua / terpilih / satu', 'Group and property contacts with all / selected / single scope'), function (M) {
    var g = M.contacts(own(M), { cl: 'CL-07', level: 'group' }), p = M.contacts(own(M), { cl: 'CL-07', level: 'property' });
    ok(g.length >= 3 && p.length >= 5, 'both levels'); ok(g.every(function (c) { return c.scope === 'all'; }), 'group scope all');
    eq(M.contact('CT-074').scope, 'single'); eq(M.contact('CT-074').props[0], 'PR-07A'); eq(M.contact('CT-078').scope, 'sel');
    var center = M.contacts(own(M), { cl: 'CL-07', prop: 'PR-07A' }).map(function (c) { return c.id; }), triloka = M.contacts(own(M), { cl: 'CL-07', prop: 'PR-07C' }).map(function (c) { return c.id; });
    ok(center.indexOf('CT-074') >= 0 && center.indexOf('CT-071') >= 0, 'Center sees Mila and the GM'); ok(triloka.indexOf('CT-074') < 0 && triloka.indexOf('CT-078') < 0, 'Triloka does not see Center-only contacts');
  });
  add('np02', 'CT-02', L('Satu kontak bisa banyak peran; GM tidak diasumsikan menangani operasional', 'One contact can hold many roles; the GM is not assumed to run operations'), function (M) {
    ok(M.contact('CT-071').roles.length >= 4, 'GM has several roles'); ok(M.contact('CT-071').roles.indexOf('pickup') < 0, 'GM is not the pickup contact');
  });
  add('np02', 'CT-03', L('Rekomendasi kontak cerdas (§12)', 'Smart contact recommendation (§12)'), function (M) {
    eq(M.recommend('CL-07', 'PR-07A', 'contract').primary[0].id, 'CT-071', 'contract → GM');
    eq(M.recommend('CL-07', 'PR-07A', 'ops').primary[0].id, 'CT-074', 'pickup → Mila (Center supervisor)');
    eq(M.recommend('CL-07', 'PR-07A', 'billing').primary[0].id, 'CT-072', 'invoice → Finance');
    var c = M.recommend('CL-07', 'PR-07C', 'complaint'); eq(c.primary[0].id, 'CT-076', 'complaint → Triloka contact'); eq(c.escalation[0].id, 'CT-071', 'escalation → GM');
    ok(M.recommend('CL-07', 'PR-07C', 'ops').primary.every(function (x) { return x.active; }), 'inactive contacts never recommended');
  });
  add('np02', 'CT-04', L('Validasi kontak dan nonaktif tanpa hapus', 'Contact validation and deactivate instead of delete'), function (M) {
    eq(M.saveContact(sal(M), { n: 'Test', cl: 'CL-07', phone: '0812', scope: 'single', props: [], roles: ['pickup'] }).code, 'invalid');
    eq(M.saveContact(sal(M), { n: 'Test', cl: 'CL-07', phone: '0812', scope: 'single', props: ['PR-01A'], roles: ['pickup'] }).code, 'invalid');
    var r = M.saveContact(sal(M), { n: 'Dewa Ayu', cl: 'CL-07', phone: '+62 812 1', scope: 'single', props: ['PR-07C'], roles: ['pickup', 'operational'] }); eq(r.ok, true);
    eq(M.setContactActive(sal(M), r.contact.id, false).code, 'reason'); eq(M.setContactActive(sal(M), r.contact.id, false, 'Pindah divisi').ok, true);
    ok(M.contact(r.contact.id), 'record kept'); ok(M.contacts(own(M), { cl: 'CL-07' }).every(function (c) { return c.id !== r.contact.id; }), 'hidden from the active list');
  });

  /* ----- NP-03 Services ----- */
  add('np03', 'SV-01', L('Katalog layanan lengkap: kode, unit, harga master, SLA standar, proses, item', 'Full service catalog: code, unit, master price, standard SLA, process, items'), function (M) {
    eq(M.services().length, 10); M.services().forEach(function (s) { ok(s.id && s.n && s.unit && s.price > 0 && s.sla > 0 && s.proc && s.items, s.id); });
    eq(M.service('SV-001').sla, 24); eq(M.service('SV-002').sla, 8); eq(M.service('SV-003').sla, 4);
  });
  add('np03', 'SV-02', L('Layanan per property: tidak semua layanan katalog tersedia; standar vs khusus jelas', 'Services per property: not every catalog service is enabled; standard vs custom is clear'), function (M) {
    var center = M.svcConfig('PR-07A').map(function (x) { return x.svc; }); ok(center.indexOf('SV-003') < 0, 'Center has no Super Express'); ok(center.length < M.services().length, 'subset of the catalog');
    var l = M.svcLine('PR-07A', 'SV-001'); eq(l.master, 7500); eq(l.rate, 7000, 'client rate from the Rate Card'); ok(l.custom, 'flagged as custom');
    var b = M.svcLine('PR-07D', 'SV-002'); eq(b.sla, 6, 'Bisma express SLA override'); eq(b.masterSla, 8);
  });
  add('np03', 'SV-03', L('Atur layanan klien: izin, audit; tarif tidak bisa diubah di sini', 'Configure client services: permission, audit; rates cannot be changed here'), function (M) {
    eq(M.saveSvcConfig(spv(M), 'PR-07A', 'SV-003', { active: true }).code, 'noperm');
    var r = M.saveSvcConfig(ops(M), 'PR-07A', 'SV-003', { active: true, instr: 'Handuk kolam saja', rate: 1 }); eq(r.ok, true); eq(r.row.rate, null, 'rate is not set through service config');
    eq(M.auditLog()[0].ev, 'SERVICE.CONFIG');
  });

  /* ----- NP-04 Contracts ----- */
  add('np04', 'CTR-01', L('Kontrak multi-property dengan versi; versi lama tidak ditimpa', 'Multi-property contract with versions; old versions are never overwritten'), function (M) {
    var v = M.contractVersions('CTR-2026-001'); eq(v.length, 2); eq(M.contract('CTR-2026-001').v, 2); eq(M.contract('CTR-2026-001').props.length, 4);
    eq(M.contractV('CTR-2026-001', 1).terms, 21, 'v1 keeps Net 21'); eq(M.contractOn('CTR-2026-001', '2026-03-15').v, 1, 'March uses v1'); eq(M.contractOn('CTR-2026-001', '2026-08-15').v, 2, 'August uses v2');
  });
  add('np04', 'CTR-02', L('Perbandingan versi menyorot field yang berubah', 'Version comparison highlights changed fields'), function (M) {
    var c = M.compare('CTR-2026-001', 1, 2), ch = c.rows.filter(function (r) { return r.changed; }).map(function (r) { return r.k; });
    ['terms', 'minVol', 'cycle', 'scope'].forEach(function (k) { ok(ch.indexOf(k) >= 0, k + ' changed'); }); ok(ch.indexOf('end') < 0, 'end date unchanged');
  });
  add('np04', 'CTR-03', L('Versi baru → review → persetujuan → aktif; versi lama diarsipkan', 'New version → review → approval → active; old version archived'), function (M) {
    eq(M.newVersion(sal2(M), 'CTR-2026-001', { terms: 45 }, '').code, 'reason'); eq(M.newVersion(sal2(M), 'CTR-2026-001', {}, 'x').code, 'nochange');
    var r = M.newVersion(sal2(M), 'CTR-2026-001', { terms: 45, minVol: 1800 }, 'Volume 2027 naik', '2026-10-06'); eq(r.ok, true); eq(r.contract.v, 3); eq(r.contract.status, 'review'); eq(M.contract('CTR-2026-001').v, 2, 'v2 stays in force while v3 is in review');
    eq(M.decide(sal2(M), r.approval.id, 'approve').code, 'noperm'); eq(M.decide(own(M), r.approval.id, 'approve').ok, true);
    eq(M.contract('CTR-2026-001').v, 3); eq(M.contractV('CTR-2026-001', 2).status, 'archived'); eq(M.contractV('CTR-2026-001', 2).terms, 30, 'v2 values kept');
  });
  add('np04', 'CTR-04', L('Status kontrak: Draft, Review, Approved, Active, Expiring, Expired, Terminated', 'Contract status: Draft, Review, Approved, Active, Expiring, Expired, Terminated'), function (M) {
    eq(M.ctrStatus(M.contract('CTR-2026-012')), 'draft'); eq(M.ctrStatus(M.contract('CTR-2026-011')), 'review'); eq(M.ctrStatus(M.contract('CTR-2026-002')), 'active');
    eq(M.ctrStatus(M.contract('CTR-2025-022')), 'expiring'); eq(M.ctrStatus(M.contract('CTR-2024-010')), 'expired');
    eq(M.setContractStatus(sal(M), 'CTR-2026-002', 1, 'terminated').code, 'reason'); eq(M.setContractStatus(sal(M), 'CTR-2026-002', 1, 'terminated', 'Hotel tutup').ok, true); eq(M.ctrStatus(M.contract('CTR-2026-002')), 'terminated');
    eq(M.setContractStatus(sal(M), 'CTR-2026-012', 1, 'active').code, 'flow');
  });
  add('np04', 'CTR-05', L('Buat kontrak: property harus milik klien, tanggal valid', 'Create contract: properties must belong to the client, dates valid'), function (M) {
    eq(M.createContract(sal(M), { cl: 'CL-07', props: ['PR-01A'], start: '2027-01-01', end: '2027-12-31', terms: 30 }).code, 'invalid');
    eq(M.createContract(sal(M), { cl: 'CL-07', props: ['PR-07A'], start: '2027-01-01', end: '2026-12-31', terms: 30 }).code, 'invalid');
    var r = M.createContract(sal(M), { cl: 'CL-07', props: ['PR-07A', 'PR-07B', 'PR-07C', 'PR-07D'], start: '2027-01-01', end: '2027-12-31', terms: 30 }); eq(r.ok, true); eq(r.contract.status, 'draft'); eq(r.contract.props.length, 4);
  });

  /* ----- NP-05 Rate cards ----- */
  add('np05', 'RT-01', L('Harga master ≠ harga klien; ubah master tidak menimpa tarif klien', 'Master price ≠ client price; changing the master never overwrites client rates'), function (M) {
    var before = M.rateOn('PR-07A', 'SV-001').rate; eq(before, 7000);
    var r = M.setMasterPrice(own(M), 'SV-001', 8000, 'Harga standar 2027'); eq(r.ok, true); ok(r.kept >= 1, 'client lines kept');
    eq(M.rateOn('PR-07A', 'SV-001').rate, 7000, 'client rate unchanged'); eq(M.service('SV-001').price, 8000);
    eq(M.setMasterPrice(sal(M), 'SV-001', 9000, 'x').code, 'noperm');
  });
  add('np05', 'RT-02', L('Invoice historis memakai tarif yang berlaku pada tanggal invoice', 'Historical invoices use the rate valid on the invoice date'), function (M) {
    var l = M.invoiceLines('CL-07'); eq(l[0].rate, 6500, 'Dec 2025 at RC-07 v1'); eq(l[1].rate, 7000, 'Jan 2026 at RC-07 v2'); eq(l[0].v, 1); eq(l[1].v, 2);
    eq(l[2].rate, 8000, 'Triloka uses the property addendum'); eq(l[3].rate, 8500, 'Shanti uses the group card');
  });
  add('np05', 'RT-03', L('Alur perubahan tarif: lama, baru, selisih %, alasan, tanggal berlaku, pengaju, approver', 'Rate change flow: old, new, difference %, reason, effective date, requester, approver'), function (M) {
    eq(M.requestRateChange(sal(M), 'RC-02', 'SV-006', 8600, '2026-11-01', '').code, 'reason');
    eq(M.requestRateChange(sal(M), 'RC-02', 'SV-006', 8600, '2026-09-01', 'Biaya naik').code, 'invalid', 'past date blocked');
    var r = M.requestRateChange(sal(M), 'RC-02', 'SV-006', 8600, '2026-11-01', 'Biaya chemical naik'); eq(r.ok, true); eq(r.diff, 4.9);
    var a = M.approval(r.approval.id); eq(a.from, 8200); eq(a.to, 8600); eq(a.by, 'EMP-040'); eq(a.st, 'pending');
    eq(M.rateOn('PR-02A', 'SV-006', '2026-11-15').rate, 8200, 'not effective before approval');
    eq(M.decide(own(M), a.id, 'approve').ok, true); eq(M.rateOn('PR-02A', 'SV-006', '2026-11-15').rate, 8600); eq(M.rateOn('PR-02A', 'SV-006', '2026-10-15').rate, 8200, 'October keeps the old rate');
    var h = M.rateHistory('RC-02')[0]; eq(h.from, 8200); eq(h.to, 8600); eq(h.appr, 'EMP-050'); eq(M.rcVersions('RC-02').length, 2);
  });
  add('np05', 'RT-04', L('Tarif tumpang tindih diperingatkan; prioritas eksplisit diizinkan', 'Overlapping rates warn; an explicit priority is allowed'), function (M) {
    var dup = JSON.parse(JSON.stringify(M.rateCard('RC-07'))); dup.id = 'RC-07X'; ok(M.rateOverlaps(dup).length >= 1, 'same client + period + service warns');
    eq(M.rateOverlaps(M.rateCard('RC-07C')).length, 0, 'Triloka addendum has a priority rule');
  });
  add('np05', 'RT-05', L('Harga hanya untuk izin com.rate.view', 'Pricing only with com.rate.view'), function (M) {
    ok(!M.canSee(ops(M), 'price'), 'ops cannot see pricing'); ok(!M.canSee(spv(M), 'price'), 'supervisor cannot see pricing'); ok(M.canSee(sal(M), 'price'), 'sales can');
    ok(!M.canSee(sal(M), 'margin'), 'sales cannot see margin'); ok(M.canSee(fin(M), 'margin'), 'finance can'); ok(!M.canSee(opr(M), 'margin'), 'frontline cannot');
  });

  /* ----- NP-06 SLA ----- */
  add('np06', 'SLA-01', L('Hirarki override SLA: property > klien > layanan > kategori > prioritas > hari', 'SLA override hierarchy: property > client > service > category > priority > day'), function (M) {
    eq(M.slaFor({ cl: 'CL-07', prop: 'PR-07D', svc: 'SV-002' }).rule.id, 'SLA-07D'); eq(M.slaFor({ cl: 'CL-07', prop: 'PR-07D', svc: 'SV-002' }).tat, 6);
    eq(M.slaFor({ cl: 'CL-07', prop: 'PR-07A', svc: 'SV-001' }).rule.id, 'SLA-07'); eq(M.slaFor({ cl: 'CL-02', prop: 'PR-02A', svc: 'SV-001' }).rule.id, 'SLA-STD-REG');
    eq(M.slaFor({ cl: 'CL-01', prop: 'PR-01A', svc: 'SV-006', pri: 'high', at: '2026-10-07 10:00' }).tat, 12, 'weekday 12h');
    eq(M.slaFor({ cl: 'CL-01', prop: 'PR-01A', svc: 'SV-006', pri: 'high', at: '2026-10-10 10:00' }).tat, 18, 'Saturday 18h');
  });
  add('np06', 'SLA-02', L('SLA clock: start, pause (alasan wajib), resume, complete dengan timestamp', 'SLA clock: start, pause (reason required), resume, complete with timestamps'), function (M) {
    var id = 'ORD-2610-04123', c0 = M.orders(spv(M)).filter(function (o) { return o.id === id; })[0]; eq(c0.st, 'ontrack');
    eq(M.clockAct(spv(M), id, 'pause').code, 'reason'); eq(M.clockAct(spv(M), id, 'pause', 'Menunggu konfirmasi klien').ok, true);
    var c1 = M.clock(M.state().orders.filter(function (o) { return o.id === id; })[0]); eq(c1.st, 'paused'); eq(M.clockAct(spv(M), id, 'complete').code, 'flow');
    M._setClock(function () { return M.ms('2026-10-06 14:35'); });
    eq(M.clockAct(spv(M), id, 'resume').ok, true); var c2 = M.clock(M.state().orders.filter(function (o) { return o.id === id; })[0]); ok(c2.used < 3, 'paused time does not count'); ok(c2.due > c0.due, 'due time moves with the pause');
    eq(M.clockAct(spv(M), id, 'complete').ok, true); eq(M.clock(M.state().orders.filter(function (o) { return o.id === id; })[0]).st, 'done');
    var ev = M.state().orders.filter(function (o) { return o.id === id; })[0].ev; ok(ev.every(function (e) { return /^\d{4}-\d\d-\d\d \d\d:\d\d$/.test(e[1]); }), 'every state has a timestamp');
    eq(M.clockAct(opr(M), 'ORD-2610-04118', 'pause', 'x').code, 'noperm');
  });
  add('np06', 'SLA-03', L('Eskalasi SLA 75% info · 90% warning · 100% late', 'SLA escalation 75% info · 90% warning · 100% late'), function (M) {
    var o = M.orders(own(M)), by = function (id) { return o.filter(function (x) { return x.id === id; })[0]; };
    eq(by('ORD-2610-04096').lvl, 'crit'); eq(by('ORD-2610-04096').st, 'late'); eq(by('ORD-2610-04102').lvl, 'warn'); eq(by('ORD-2610-04118').lvl, 'info'); eq(by('ORD-2610-04123').lvl, null);
  });
  add('np06', 'SLA-04', L('Aturan SLA bentrok ditolak tanpa urutan prioritas (§73)', 'Conflicting SLA rules are refused without precedence (§73)'), function (M) {
    eq(M.slaConflicts().length, 0, 'seed data has no conflict');
    var r = M.saveSlaRule(ops(M), { n: 'Jaens 20 jam', cl: 'CL-07', tat: 20, eff: '2026-10-10' }); eq(r.code, 'conflict');
    eq(M.saveSlaRule(ops(M), { n: 'Jaens Center 20 jam', cl: 'CL-07', prop: 'PR-07A', tat: 20, eff: '2026-10-10' }).ok, true, 'more specific rule is fine');
    eq(M.saveSlaRule(sal(M), { n: 'x', tat: 10, eff: '2026-10-10' }).code, 'noperm');
  });
  add('np06', 'SLA-05', L('SLA klien terhubung ke data operasional', 'Client SLA connects to operations data'), function (M) {
    var s = M.slaPerf('CL-07'); ok(s.n > 1000, 'monthly orders'); ok(s.ot > 95 && s.ot <= 100, 'on-time %'); ok(s.avgTat > 0, 'average turnaround'); ok(s.live.length >= 3, 'live clocks');
  });

  /* ----- NP-07 Documents & history ----- */
  add('np07', 'DOC-01', L('Dokumen versi baru tidak menimpa file lama', 'A new document version never replaces the old file'), function (M) {
    var r = M.addDoc(sal2(M), { n: 'Kontrak Jaens Spa Group 2026', type: 'contract', cl: 'CL-07', ctr: 'CTR-2026-001', file: 'Kontrak_JaensSpa_2026_v3.pdf' }); eq(r.ok, true); eq(r.doc.v, 3); eq(r.superseded, 'DOC-0712');
    var v = M.docVersions(r.doc); eq(v.length, 3); eq(v[1].status, 'superseded'); eq(v[1].file, 'Kontrak_JaensSpa_2026_v2.pdf');
    eq(M.addDoc(sal2(M), { n: 'X', type: 'contract', cl: 'CL-07' }).code, 'invalid', 'file required'); eq(M.addDoc(ops(M), { n: 'X', type: 'contract', cl: 'CL-07', file: 'a.pdf' }).code, 'noperm');
    eq(M.setDocStatus(sal2(M), 'DOC-0716', 'archived').code, 'reason'); eq(M.setDocStatus(sal2(M), 'DOC-0716', 'archived', 'Duplikat').ok, true); ok(M.state().docs.some(function (d) { return d.id === 'DOC-0716'; }), 'kept');
  });
  add('np07', 'HIS-01', L('Timeline komersial: siapa, kapan, nilai lama, nilai baru, alasan, dokumen', 'Commercial timeline: who, when, old value, new value, reason, document'), function (M) {
    var t = M.timeline('CL-07'); ok(t.length >= 12, 'events'); ok(M.timeline('CL-07', { ev: 'CONTRACT' }).length >= 3, 'filter');
    var v = t.filter(function (e) { return e.ev === 'CONTRACT.VERSION'; })[0]; ok(v.from && v.to && v.reason && v.doc && v.by, 'version event is complete');
    var types = t.map(function (e) { return e.ev; }); ['CLIENT.CREATE', 'PROPOSAL.SENT', 'CONTRACT.SIGNED', 'RATE.UPDATE', 'SLA.REVIEW', 'COMPLAINT.OPEN', 'COMPLAINT.RESOLVE', 'PAYMENT.ISSUE', 'RENEWAL.DISCUSS', 'AM.CHANGE'].forEach(function (e) { ok(types.indexOf(e) >= 0, e); });
  });

  /* ----- NP-08 Renewal, approval & alerts ----- */
  add('np08', 'RNW-01', L('Dashboard renewal: 30/60/90 hari, berakhir, berjalan, menunggu approval', 'Renewal dashboard: 30/60/90 days, expired, in progress, approval pending'), function (M) {
    var b = M.renewalBuckets(own(M)); ok(b.d30.length >= 2, '≤30'); ok(b.d60.some(function (x) { return x.no === 'CTR-2025-022'; }), 'Triloka in 60'); ok(b.d90.length >= 1, '≤90');
    ok(b.expired.some(function (x) { return x.no === 'CTR-2024-010'; }), 'Bali Nest expired'); ok(b.appr.some(function (x) { return x.no === 'CTR-2025-008'; }), 'Ubud Spa approval'); ok(b.prog.length >= 3, 'in progress');
  });
  add('np08', 'RNW-02', L('Pipeline renewal; Renewed hanya setelah kontrak baru disetujui', 'Renewal pipeline; Renewed only after the new contract is approved'), function (M) {
    eq(M.moveRenewal(sal(M), 'CTR-2026-002', 'proposal').code, 'notfound'); eq(M.startRenewal(sal(M), 'CTR-2026-002').ok, true); eq(M.startRenewal(sal(M), 'CTR-2026-002').code, 'dup'); eq(M.moveRenewal(sal(M), 'CTR-2026-002', 'proposal', { next: 'Kirim proposal' }).ok, true);
    eq(M.moveRenewal(sal2(M), 'CTR-2025-008', 'renewed').code, 'flow');
    eq(M.decide(own(M), 'APC-004', 'approve').ok, true); eq(M.renewalOf('CTR-2025-008').stage, 'renewed', 'approving the renewal contract closes the renewal');
    var card = M.renewalCard('CTR-2025-020'); ['cl', 'props', 'end', 'left', 'am', 'st', 'next', 'follow', 'risk', 'opp'].forEach(function (k) { ok(card[k] !== undefined, k); }); ok(card.stalled, 'Villa Sari negotiation is stalled');
  });
  add('np08', 'RNW-03', L('Peringatan kontrak 90/60/30/15/7 hari, mulai sebelum kontrak berakhir', 'Contract warnings at 90/60/30/15/7 days, before expiry'), function (M) {
    eq(M.warnLevel('2026-12-31').th, 90); eq(M.warnLevel('2026-11-20').th, 60); eq(M.warnLevel('2026-11-05').th, 30); eq(M.warnLevel('2026-10-21').th, 15); eq(M.warnLevel('2026-10-10').th, 7); eq(M.warnLevel('2027-06-01').th, null);
  });
  add('np08', 'ALR-01', L('Alert komersial sesuai peran dan diurutkan (§67), tanpa duplikat', 'Commercial alerts role-filtered and sorted (§67), no duplicates'), function (M) {
    var a = M.alerts(own(M)), rank = { crit: 3, warn: 2, info: 1 };
    for (var i = 1; i < a.length; i++) ok(rank[a[i - 1].sev] >= rank[a[i].sev], 'severity order at ' + i);
    var ids = a.map(function (x) { return x.id; }); eq(ids.length, ids.filter(function (x, i) { return ids.indexOf(x) === i; }).length, 'unique ids');
    ok(!a.some(function (x) { return x.k === 'rcexp' && x.rec === 'RC-06'; }), 'Rate Card ending with its contract is not a second alert');
    var f = M.alerts(fin(M)), s = M.alerts(spv(M)); ok(f.some(function (x) { return x.k === 'credit'; }), 'finance sees credit'); ok(!f.some(function (x) { return x.k === 'stalled'; }), 'finance does not see negotiation alerts');
    ok(s.every(function (x) { return ['slareview', 'slaconf'].indexOf(x.k) >= 0; }), 'supervisor only sees SLA alerts'); eq(M.alerts(gv(M)).length, 0, 'clients get no internal alerts');
    ['ctrexp', 'ctrexpired', 'credit', 'ar', 'stalled', 'slareview'].forEach(function (k) { ok(a.some(function (x) { return x.k === k; }), k); });
  });
  add('np08', 'APR-01', L('Inbox persetujuan: 7 jenis, field lengkap, approve / reject / return', 'Approval inbox: 7 kinds, full fields, approve / reject / return'), function (M) {
    var a = M.approvals(own(M), { st: 'pending' }), kinds = a.map(function (x) { return x.kind; });
    ['rate', 'discount', 'credit', 'contract', 'slaexc', 'creditnote'].forEach(function (k) { ok(kinds.indexOf(k) >= 0, k); }); ok(M.approvals(own(M)).some(function (x) { return x.kind === 'special'; }), 'special term');
    a.forEach(function (x) { ['by', 'cl', 'from', 'to', 'reason', 'impact', 'eff'].forEach(function (k) { ok(x[k] !== undefined, x.id + ' ' + k); }); });
    eq(M.decide(own(M), 'APC-002', 'reject').code, 'reason'); eq(M.decide(own(M), 'APC-002', 'return', 'Lampirkan analisis margin').ok, true); eq(M.approval('APC-002').st, 'returned');
    eq(M.resubmit(sal(M), 'APC-002', { reason: ['Syarat renewal, margin tetap 19%', 'Renewal condition, margin stays 19%'] }).ok, true); eq(M.approval('APC-002').st, 'pending');
    eq(M.decide(own(M), 'APC-002', 'approve').ok, true); eq(M.rateOn('PR-09A', 'SV-001', '2026-10-25').rate, 6750, '10% discount applied from the effective date');
  });
  add('np08', 'APR-02', L('Audit persetujuan: pengaju, waktu, reviewer, keputusan, alasan, nilai lama & baru; tidak bisa setujui sendiri', 'Approval audit: requester, time, reviewer, decision, reason, old & new; no self-approval'), function (M) {
    eq(M.decide(fin(M), 'APC-003', 'approve').code, 'noperm', 'finance cannot approve credit'); eq(M.decide(own(M), 'APC-003', 'approve').ok, true);
    var a = M.approval('APC-003'); ok(a.by && a.at && a.revBy && a.revAt && a.st === 'approved', 'fields'); eq(M.client('CL-04').credit, 180e6);
    var e = M.auditLog()[0]; eq(e.ev, 'APPROVAL.APPROVE'); ok(e.from && e.to && e.appr && e.appr.by === 'EMP-050', 'audit has old, new and approver');
    var r = M.requestRateChange(own(M), 'RC-08', 'SV-001', 7800, '2026-11-01', 'Uji'); eq(M.decide(own(M), r.approval.id, 'approve').code, 'self');
    eq(M.decide(fin(M), 'APC-006', 'approve').ok, true, 'finance decides commercial credit notes'); ok(M.state().cn.length === 1, 'credit note recorded');
  });

  /* ----- NP-09 Health, profitability, growth ----- */
  add('np09', 'HL-01', L('Client Health: 10 dimensi, skor, bobot 100%, tren, status', 'Client Health: 10 dimensions, score, weights 100%, trend, status'), function (M) {
    var h = M.health('CL-07'); eq(h.dims.length, 10); eq(h.wsum, 100); ok(h.score > 0 && h.score <= 100, 'score'); ok(M.HEALTH_ST[h.st], 'status');
    h.dims.forEach(function (d) { ok(d.s != null && d.w > 0 && M.HEALTH_ST[d.st] && d.trend !== undefined, d.k); });
    var s = 0; h.dims.forEach(function (d) { s += d.s * d.w; }); ok(Math.abs(s / 100 - h.score) < 0.11, 'weighted sum');
    ['healthy', 'attention', 'risk', 'critical'].forEach(function (b) { ok(M.clients().some(function (c) { return M.health(c.id).st === b; }), 'some client is ' + b); });
  });
  add('np09', 'HL-02', L('Data belum lengkap: peringatan, skor tidak disajikan sebagai pasti (§74)', 'Incomplete data: warning, score not shown as definitive (§74)'), function (M) {
    var p = M.health('CL-12'); eq(p.score, null, 'prospect has no score'); eq(p.st, 'nodata'); ok(p.incomplete);
    var b = M.health('CL-10'); ok(b.incomplete && b.gaps.indexOf('sla') >= 0, 'missing SLA feed flagged'); ok(b.score != null, 'score still calculated on the remaining weights');
    ok(M.sourceAge('sla').min >= 0 && M.sourceAge('billing').at, 'sources carry their as-of time');
  });
  add('np09', 'HL-03', L('Drill-down: health → dimensi → metrik → property → layanan → sumber', 'Drill-down: health → dimension → metric → property → service → source'), function (M) {
    var e = M.explain('CL-07', 'revenue'); eq(e.props.length, 4); ok(e.props[0].svcs.length >= 3 && e.props[0].svcs[0].src.indexOf('RC-07') >= 0, 'service line names the Rate Card');
    ok(M.explain('CL-07', 'sla').props[0].svcs[0].src.indexOf('on track') >= 0, 'SLA source'); ok(M.explain('CL-07', 'ar').fin.items.length >= 1, 'AR source from the finance ledger');
  });
  add('np09', 'HL-04', L('Koreksi manual dan bobot health: izin, batas, alasan, audit', 'Health manual adjustment and weights: permission, limit, reason, audit'), function (M) {
    eq(M.adjustHealth(sal(M), 'CL-07', 3, 'x').code, 'noperm'); eq(M.adjustHealth(own(M), 'CL-07', 15, 'x').code, 'invalid'); eq(M.adjustHealth(own(M), 'CL-07', -3, '').code, 'reason');
    var b = M.health('CL-07').score; eq(M.adjustHealth(own(M), 'CL-07', -3, 'Komplain eskalasi GM').ok, true); ok(Math.abs(M.health('CL-07').score - (b - 3)) < 0.11); eq(M.auditLog()[0].ev, 'HEALTH.ADJUST');
    var w = JSON.parse(JSON.stringify(M.cfg().hw)); w.sla = 30; eq(M.setHealthWeights(own(M), w, 'x').code, 'weights');
  });
  add('np09', 'PF-01', L('Profitabilitas: revenue, biaya langsung, kontribusi, margin, biaya/kg, profit/kg, drill-down', 'Profitability: revenue, direct cost, contribution, margin, cost/kg, profit/kg, drill-down'), function (M) {
    var p = M.profit('CL-07'); ok(p.rev > 0 && p.cost > 0, 'rev/cost'); eq(p.contrib, p.rev - p.cost); ok(p.margin > 0 && p.costKg > 0 && p.profitKg > 0, 'ratios'); eq(p.props.length, 4);
    var s = 0; p.props.forEach(function (x) { s += x.rev; }); eq(s, p.rev, 'properties add up'); ok(p.props[0].svcs[0].rc, 'service → Rate Card source');
  });
  add('np09', 'GR-01', L('Growth: MoM, YoY, volume, ekspansi layanan & property, cross-sell', 'Growth: MoM, YoY, volume, service & property expansion, cross-sell'), function (M) {
    var g = M.growth('CL-07'); ok(g.mom != null && g.yoy != null && g.vol != null, 'growth'); ok(g.svcAdded.indexOf('PR-07D|SV-002') >= 0, 'Bisma express is a new service'); ok(g.cross > 0, 'cross-sell revenue');
    ok(M.growth('CL-03').newProps.indexOf('PR-03B') >= 0, 'Kayana property expansion');
  });
  add('np09', 'RK-01', L('Risiko klien terdeteksi', 'Client risks detected'), function (M) {
    function has(cl, k) { return M.risks(cl).some(function (r) { return r.k === k; }); }
    ok(has('CL-07', 'expiring'), 'expiring'); ok(has('CL-04', 'credit'), 'credit'); ok(has('CL-04', 'ar'), 'overdue AR'); ok(has('CL-10', 'expired'), 'expired'); ok(has('CL-03', 'complaint'), 'complaint'); ok(has('CL-10', 'revdecline') || has('CL-10', 'svctrend'), 'decline');
  });
  add('np09', 'OP-01', L('Opportunity: field lengkap, tahap, validasi, kalah wajib alasan', 'Opportunity: full fields, stage, validation, lost needs a reason'), function (M) {
    M.opps(own(M)).forEach(function (o) { ['n', 'cl', 'type', 'rev', 'prob', 'owner', 'next', 'due', 'stage'].forEach(function (k) { ok(o[k] !== undefined, o.id + ' ' + k); }); });
    eq(M.saveOpp(sal(M), { n: 'X', cl: 'CL-07', type: 'nope', rev: 1, prob: 10 }).code, 'invalid'); var r = M.saveOpp(sal(M), { n: 'Uniform Care Bisma', cl: 'CL-07', prop: 'PR-07D', type: 'service', rev: 2e6, prob: 40 }); eq(r.ok, true);
    eq(M.moveOpp(sal(M), r.opp.id, 'lost').code, 'reason'); eq(M.moveOpp(sal(M), r.opp.id, 'won').ok, true); eq(M.opp(r.opp.id).prob, 100);
    ok(M.suggestOpps('CL-07').length >= 0, 'suggestions');
  });
  add('np09', 'IN-01', L('Insight WHAT · WHY · RISK · OPPORTUNITY · ACTION (contoh Jaens Spa)', 'Insight WHAT · WHY · RISK · OPPORTUNITY · ACTION (Jaens Spa example)'), function (M) {
    var i = M.insight('CL-07'); ok(T0(i.what).indexOf('naik') >= 0, 'revenue up'); ok(T0(i.why).indexOf('Bisma') >= 0, 'Bisma drives growth'); ok(T0(i.why).indexOf('Express') >= 0, 'express adoption');
    ok(T0(i.risk).indexOf('CTR-2025-022') >= 0 && T0(i.risk).indexOf('45') >= 0, 'Triloka expires in 45 days'); ok(T0(i.opp).indexOf('Super Express') >= 0, 'Super Express for Center & Shanti'); ok(T0(i.action).indexOf('renewal') >= 0, 'renewal action');
  });
  add('np09', 'AM-01', L('Tindakan Account Manager: follow-up, meeting, proposal, catatan, eskalasi', 'Account Manager actions: follow-up, meeting, proposal, note, escalation'), function (M) {
    eq(M.addTask(sal(M), 'CL-07', { kind: 'followup', t: 'Telepon GM', due: '2026-09-01' }).code, 'invalid');
    ['followup', 'meeting', 'proposal', 'note', 'escalate'].forEach(function (k) { eq(M.addTask(sal(M), 'CL-07', { kind: k, t: 'Uji ' + k, due: '2026-10-12' }).ok, true, k); });
    eq(M.tasks('CL-07').length, 5); eq(M.addTask(opr(M), 'CL-07', { kind: 'followup', t: 'x', due: '2026-10-12' }).code, 'noperm');
  });

  /* ----- Connections, isolation, governance ----- */
  add('gov', 'FIN-01', L('Client 360 membaca AR dari ledger Phase 5, tidak menyalin', 'Client 360 reads AR from the Phase 5 ledger, never a copy'), function (M) {
    var f = M.finance('CL-01'); eq(f.src, 'ledger'); ok(f.total > 0, 'AR from the ledger'); ok(f.util > 0 && f.credit > 0, 'credit utilisation');
    eq(M.finance('CL-07').total, 163e6, 'Phase 6 invoices joined once'); M.joinLedger(); eq(M.finance('CL-07').total, 163e6, 'joining twice does not duplicate');
    ok(M.finance('CL-04').over, 'Oceanview over its credit limit');
  });
  add('gov', 'CMP-01', L('Komplain terhubung ke health (open, tren, rate, klaim, rusak, hilang)', 'Complaints feed health (open, trend, rate, claim, damage, lost)'), function (M) {
    var c = M.complaints('CL-03'); ok(c.open >= 2 && c.trend.length === 13 && c.rate > 0, 'complaint data'); ok(c.damage >= 1 && c.claim > 0, 'damage & claim');
    var d = M.health('CL-03').dims.filter(function (x) { return x.k === 'complaint'; })[0], j = M.health('CL-08').dims.filter(function (x) { return x.k === 'complaint'; })[0]; ok(d.s < j.s, 'more complaints → lower score');
  });
  add('gov', 'ISO-01', L('Isolasi portal klien: klien A tidak pernah melihat data klien B', 'Client portal isolation: client A never sees client B data'), function (M) {
    var a = gv(M), p = M.portal(a); eq(p.c.id, 'CL-01'); ok(p.props.every(function (x) { return x.p.cl === 'CL-01'; }), 'own properties only');
    eq(M.visibleClients(a).length, 1); ok(M.contracts(a).every(function (c) { return c.cl === 'CL-01'; }), 'contracts'); ok(M.rateCards(a).every(function (r) { return r.cl === 'CL-01'; }), 'rates');
    ok(M.docs(a).every(function (d) { return d.cl === 'CL-01' && d.share; }), 'shared own documents only'); ok(M.opps(a).every(function (o) { return o.cl === 'CL-01'; }), 'opportunities'); eq(M.summary(a, 'CL-05'), null, 'other client summary');
    eq(M.recordOf('PR-05A').cl, 'CL-05', 'record scope resolves the owner'); eq(M.recordOf('CTR-2026-001').cl, 'CL-07'); ok(M.portal(abc(M)).props.every(function (x) { return x.p.cl === 'CL-05'; }), 'Hotel ABC sees only itself');
  });
  add('gov', 'PRM-01', L('Model izin §62 dan data sensitif §63', 'Permission model §62 and sensitive data §63'), function (M) {
    ['com.client.view', 'com.client.create', 'com.client.edit', 'com.property.view', 'com.property.create', 'com.property.edit', 'com.contact.manage', 'com.contract.create', 'com.contract.edit', 'com.contract.approve', 'com.rate.view', 'com.rate.edit', 'com.rate.approve', 'com.sla.edit', 'com.sla.approve', 'com.credit.edit', 'com.credit.approve', 'com.renewal.manage', 'com.opp.manage', 'com.doc.manage'].forEach(function (p) { ok(M.PERMS[p], p); });
    ok(M.ROLE_PERMS.sales.indexOf('com.margin.view') < 0, 'sales: no margin'); ok(M.ROLE_PERMS.opsmgr.indexOf('com.rate.view') < 0, 'ops: no pricing'); eq(M.ROLE_PERMS.operator.length, 0, 'frontline: nothing commercial');
    var c = M.clientView(ops(M), 'CL-07'); eq(c.credit, null, 'credit masked for ops');
  });
  add('gov', 'AUD-01', L('Audit perubahan penting dan tanpa hapus diam-diam', 'Audit of important changes and no silent delete'), function (M) {
    M.saveProperty(ops(M), { id: 'PR-07C', n: 'Jaens Spa Triloka', status: 'onhold', reason: 'Renovasi' }); var e = M.auditLog()[0]; eq(e.ev, 'PROPERTY.STATUS'); eq(e.from, 'active'); eq(e.to, 'onhold'); eq(e.reason, 'Renovasi'); ok(e.by && e.at, 'who & when');
    ok(typeof M.deleteClient === 'undefined' && typeof M.deleteContract === 'undefined' && typeof M.deleteRate === 'undefined', 'no delete functions');
    var n = M.state().contracts.length; M.setContractStatus(sal(M), 'CTR-2026-012', 1, 'archived', 'Batal'); eq(M.state().contracts.length, n, 'archive keeps the record');
  });

  function run(M) {
    return T.map(function (c) {
      M._reset(); M._setClock(function () { return M.ms('2026-10-06 12:35'); });
      try { c.fn(M); return { group: c.group, id: c.id, n: c.n, ok: true }; } catch (e) { return { group: c.group, id: c.id, n: c.n, ok: false, err: e.message }; }
    });
  }
  var API = { cases: T, run: function (M) { var r = run(M); M._reset(); M._setClock(function () { return M.ms(M.D.simNow) + (Date.now() - (API.t0 || (API.t0 = Date.now()))); }); return r; } };
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
  else root.JFCOMM_TESTS = API;
})(typeof window !== 'undefined' ? window : this);
