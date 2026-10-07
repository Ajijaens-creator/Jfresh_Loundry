/* ==========================================================================
   JFRESH OS — Phase 12 automated test cases (Engine B · JFGO: migration, UAT,
   cutover / reset, go-live, improvement). Each case resets the access store
   and the JFGO store, fixes the clock at 2026-10-06 10:30 and runs against the
   real engine installed on top of the Phase 4–11 engines (and JFHELP / JFIMP
   when present), the same way the app loads them. JFIMP / JFHELP readiness
   inputs are stubbed only where a case needs a known value (G._stub).
   Run in node:    node tools/test-go.js
   ========================================================================== */
(function (root) {
  var T = [], NOW = 0;
  function add(group, id, name, fn) { T.push({ group: group, id: id, n: name, fn: fn }); }
  function eq(a, b, what) { if (a !== b) throw new Error((what || 'value') + ': expected ' + JSON.stringify(b) + ', got ' + JSON.stringify(a)); }
  function ok(v, what) { if (!v) throw new Error(what || 'expected true'); }
  function no(r, code, what) { ok(r && r.ok === false, (what || 'action') + ' should be refused, got ' + JSON.stringify(r && r.ok)); if (code) eq(r.code, code, (what || 'action') + ' code'); }
  function yes(r, what) { if (!r || r.ok !== true) throw new Error((what || 'action') + ' should pass: ' + (r ? (r.code + ' ' + JSON.stringify(r.msg) + (r.failed ? ' failed=' + JSON.stringify(r.failed) : '') + (r.errors ? ' errors=' + JSON.stringify(r.errors) : '')) : 'no result')); return r; }
  var E = {};
  // Real sessions from the access layer; Phase 12 roles fall back to a synthetic session when JFIMP is not loaded.
  var ROLE_OF = { bayu: 'implead', intan: 'qalead', dodi: 'datalead', ratih: 'trainer' };
  function as(u, dev) {
    var X = E.X, us = X.USERS.filter(function (x) { return x.u === u; })[0], c;
    if (us) { c = X.resolve(us.id); if (!c || !c.ok) throw new Error('resolve ' + u + ' failed: ' + (c && c.code)); }
    else if (ROLE_OF[u]) c = { ok: true, uid: 'SYN-' + u, roleKey: ROLE_OF[u], name: u, perms: E.G.ROLE_PERMS[ROLE_OF[u]].slice() };
    else throw new Error('no user ' + u);
    if (dev) c.device = dev; return c;
  }
  function audited(G, ev, rec, result) { return G.state().audit.some(function (e) { return e.ev === ev && (!rec || e.rec === rec) && (!result || e.result === result); }); }
  var GOOD_IMP = { readiness: function () { return { build: 100, qa: 100, security: 100, integration: 100, criticalBugs: [], securityFailures: [], permissionFailures: [], restoreTested: true }; }, currentVersion: function () { return { version: 'v1.0.0' }; } };
  var GOOD_HELP = { readiness: function () { return { training: 100, keyUsersUntrained: [] }; } };
  function stubGood(G) { G._stub.imp = GOOD_IMP; G._stub.help = GOOD_HELP; }
  // Takes every migration batch through the pipeline: error rows rejected with a reason, differences explained by the
  // data lead and approved by Finance, then requested and approved (owner + Finance where finance-impacting).
  function migrateAll(G) {
    var d = as('dodi'), aji = as('aji'), budi = as('budi');
    G.migration(d).batches.forEach(function (b) {
      yes(G.runPipeline(d, b.id, 'import'), 'pipeline ' + b.id);
      G.migBatch(d, b.id).rows.filter(function (r) { return r.st === 'error'; }).forEach(function (r) { yes(G.rejectRow(d, b.id, r.n, 'Data lama tidak valid / usang'), 'reject ' + b.id + '#' + r.n); });
      yes(G.runStep(d, b.id, 'import'), 'import ' + b.id); yes(G.runStep(d, b.id, 'reconcile'), 'reconcile ' + b.id);
    });
    G.reconciliation(d).forEach(function (r) { if (r.st === 'difference') { yes(G.explainRecon(d, r.id, 'Selisih dijelaskan: dokumen lama/duplikat')); yes(G.approveRecon(budi, r.id, 'Disetujui Finance')); } });
    G.migration(d).batches.forEach(function (b) {
      yes(G.requestMigApproval(d, b.id, 'Siap disetujui'), 'request ' + b.id); yes(G.approveMigration(aji, b.id, 'OK owner'), 'owner ' + b.id);
      if (b.fin) yes(G.approveMigration(budi, b.id, 'OK finance'), 'finance ' + b.id);
    });
  }
  function passUat(G) { var q = as('intan'); G.uat(q).forEach(function (u) { if (u.st !== 'pass') yes(G.recordUat(q, u.id, { status: 'pass', actual: 'Lulus setelah perbaikan' }), 'uat ' + u.id); }); }
  function cleanDummy(G) {
    var b = as('bayu'), adit = as('adit'), r = yes(G.createReset(b, { mode: 'dummy_only', reason: 'Bersihkan data demo sebelum go-live' })).reset;
    yes(G.dependencyCheck(b, r.id)); yes(G.previewReset(b, r.id)); yes(G.createSnapshot(adit, { reason: 'Sebelum reset dummy', reset: r.id }));
    yes(G.approveReset(as('aji'), r.id, 'Disetujui owner')); if (G.reset(b, r.id).fin) yes(G.approveReset(as('budi'), r.id, 'Disetujui finance'));
    yes(G.executeReset(adit, r.id)); yes(G.reconcileReset(adit, r.id)); yes(G.markResetReady(adit, r.id)); return r.id;
  }
  function readyForGo(G) { stubGood(G); migrateAll(G); passUat(G); yes(G.setCutoff(as('bayu'), { kind: 'monthly', month: '2026-10', reason: 'Cut-off akhir Oktober' })); cleanDummy(G); }

  /* ---- install, roles, screens ---- */
  add('SETUP', 'GO-T01', ['Install: izin, 23 layar, peran mendapat izin JFGO; superadmin tanpa hak keputusan bisnis', 'Install: perms, 23 screens, roles get JFGO perms; superadmin without business decisions'], function (G, C, X) {
    ['MIG-001', 'MIG-004', 'UAT-001', 'UAT-004', 'CUT-001', 'CUT-007', 'LIVE-001', 'LIVE-004', 'OPT-001', 'OPT-004'].forEach(function (id) { ok(C.screen(id) && C.screen(id).pN === 12, id + ' registered'); });
    eq(G.SCREENS.length, 23, 'screens'); ok(C.PERMS['go.golive.approve'], 'perm registered');
    var aji = as('aji'), rama = as('rama'), adit = as('adit'), budi = as('budi');
    ok(aji.perms.indexOf('go.golive.approve') >= 0 && aji.perms.indexOf('go.start.approve') >= 0, 'owner decides');
    ['go.golive.approve', 'go.start.approve', 'go.mig.approve', 'go.reset.approve', 'go.fin.approve'].forEach(function (p) { ok(rama.perms.indexOf(p) < 0 && adit.perms.indexOf(p) < 0, 'admins lack ' + p); });
    ok(rama.perms.indexOf('go.reset.execute') >= 0, 'superadmin executes approved resets'); ok(budi.perms.indexOf('go.fin.approve') >= 0, 'finance second approver');
    ok(as('made').perms.indexOf('go.incident.report') >= 0, 'every staff role can report a problem');
    if (C.ROLES.implead) ok(C.ROLES.implead.perms.indexOf('go.reset.request') >= 0, 'JFIMP role got JFGO perms');
    var sys = root.JFSYS || (E.S); if (sys && sys.AUDIT_SOURCES) ok(sys.AUDIT_SOURCES.some(function (a) { return a[0] === 'golive'; }), 'audit merge hook registered');
  });
  add('SETUP', 'GO-T02', ['Getter tanpa izin mengembalikan null/[]', 'Getters return null/[] without the view perm'], function (G) {
    var k = as('ketut');
    eq(G.migration(k), null); eq(G.reconciliation(k).length, 0); eq(G.resets(k).length, 0); eq(G.readiness(k), null); eq(G.command(k), null); eq(G.prep(k), null); eq(G.backlog(k).length, 0); eq(G.liveKpis(k).length, 0);
    ok(G.uat(k).length === 2 && G.uat(k).every(function (u) { return u.tester === 'ketut'; }), 'a tester sees only own UAT tasks');
  });

  /* ---- NP-06 migration ---- */
  add('NP-06', 'GO-T03', ['18 sumber migrasi dengan baris sistem lama', '18 migration sources with old-system rows'], function (G) {
    var m = G.migration(as('dodi')); eq(m.count, 18); eq(m.batches[0].id, 'MGB-01');
    ['clients', 'properties', 'contacts', 'contracts', 'rates', 'items', 'weights', 'hpp', 'pricelist', 'suppliers', 'inventory', 'assets', 'users', 'ar', 'ap', 'cash', 'bank', 'opentx'].forEach(function (s, i) { eq(m.batches[i].src, s, 'source ' + i); });
    ok(m.batches.filter(function (b) { return b.fin; }).map(function (b) { return b.src; }).join() === 'hpp,inventory,assets,ar,ap,cash,bank', 'finance-impacting sources');
  });
  add('NP-06', 'GO-T04', ['Urutan pipeline wajib; hanya data lead', 'Pipeline order enforced; data lead only'], function (G) {
    var d = as('dodi');
    no(G.runStep(d, 'MGB-01', 'map'), 'jump', 'map before extract'); no(G.runStep(as('ketut'), 'MGB-01', 'extract'), 'noperm', 'driver');
    ok(audited(G, 'ACCESS_DENIED', 'MGB-01', 'denied'), 'denial audited');
    yes(G.runStep(d, 'MGB-01', 'extract')); no(G.runStep(d, 'MGB-01', 'extract'), 'jump', 'twice'); no(G.runStep(d, 'MGB-01', 'approve'), 'invalid', 'approve is not an automatic step');
  });
  add('NP-06', 'GO-T05', ['Cleansing: duplikat, field kosong, satuan, tanggal, usang, referensi, nilai', 'Cleansing: duplicates, missing fields, units, dates, obsolete, references, values'], function (G) {
    var d = as('dodi'), kinds = {};
    G.migration(d).batches.forEach(function (b) { G.runPipeline(d, b.id, 'validate'); G.migBatch(d, b.id).rows.forEach(function (r) { r.issues.forEach(function (i) { kinds[i.k] = true; }); }); });
    ['dup', 'missing', 'unit', 'date', 'obsolete', 'ref', 'value'].forEach(function (k) { ok(kinds[k], 'detects ' + k); });
    var c = G.migBatch(d, 'clients').rows; eq(c[10].st, 'error', 'empty client name'); eq(c[9].issues.some(function (i) { return i.k === 'obsolete'; }), true, 'closed hotel obsolete');
    var ct = G.migBatch(d, 'contracts').rows; ok(ct[2].issues.some(function (i) { return i.k === 'date'; }), '2019-02-30 is a wrong date');
  });
  add('NP-06', 'GO-T06', ['Bath Towel / bath towel / BATH TOWEL → satu master IT-BTW-01', 'Bath Towel / bath towel / BATH TOWEL → one master IT-BTW-01'], function (G) {
    var d = as('dodi'); yes(G.runPipeline(d, 'items', 'validate'));
    var rows = G.migBatch(d, 'items').rows.slice(0, 3);
    ok(rows.every(function (r) { return r.target === 'IT-BTW-01'; }), 'all three map to IT-BTW-01');
    ok(rows.every(function (r) { return r.norm.name === 'Bath Towel'; }), 'normalized to one spelling');
    eq(rows.filter(function (r) { return r.match === 'existing'; }).length, 1, 'one mapping, two duplicates');
  });
  add('NP-06', 'GO-T07', ['Master yang sudah ada dipetakan ke ID yang ada, tanpa duplikat; engine pemilik tidak ditulis', 'Existing masters map to existing ids, no duplicates; owner engines not written'], function (G, C, X, F) {
    var d = as('dodi'), CM = E.CM, n0 = CM.clients().length, s0 = F.state().sups.length, i0 = F.state().items.length;
    ['clients', 'items', 'suppliers', 'users'].forEach(function (s) { yes(G.runPipeline(d, s, 'import')); G.migBatch(d, s).rows.filter(function (r) { return r.st === 'error'; }).forEach(function (r) { yes(G.rejectRow(d, s, r.n, 'usang')); }); yes(G.runStep(d, s, 'import')); });
    var cl = G.migBatch(d, 'clients').rows;
    eq(cl[0].target, 'CL-01'); eq(cl[1].target, 'CL-01', 'duplicate row → same id'); eq(cl[3].target, 'CL-03'); eq(cl[5].target, 'CL-05'); eq(cl[6].target, 'CL-07'); eq(cl[4].target, 'CL-04');
    var st = G.staged(d, 'clients'); eq(st.length, 1, 'only the new client is staged'); eq(st[0].data.name, 'Sanur Beach Villas'); eq(st[0].cls, 'MIGRATION');
    eq(G.staged(d, 'suppliers').length, 1, 'only Toko Baru Kimia staged'); eq(G.migBatch(d, 'suppliers').rows[1].target, 'SUP-01', 'ECOLAB INDONESIA → SUP-01');
    eq(G.staged(d, 'users').length, 1, 'only new.cashier staged'); eq(G.migBatch(d, 'users').rows[2].target, 'USR-030', 'BUDI.S → existing budi');
    eq(CM.clients().length, n0, 'no client created in JFCOMM'); eq(F.state().sups.length, s0, 'no supplier created'); eq(F.state().items.length, i0, 'no item created');
    var ids = cl.filter(function (r) { return r.match === 'existing'; }).map(function (r) { return r.target; }); eq(ids.length, new Set(ids).size, 'no master mapped twice as existing');
  });
  add('NP-06', 'GO-T08', ['Validasi total/valid/warning/error/rejected; import ditolak selama ada error', 'Validation total/valid/warning/error/rejected; import refused while errors remain'], function (G) {
    var d = as('dodi'); yes(G.runPipeline(d, 'clients', 'import'));
    var s = G.migBatch(d, 'clients').summary; eq(s.total, 11); eq(s.error, 2); eq(s.rejected, 0); eq(s.valid + s.warning + s.error + s.rejected, s.total, 'summary adds up');
    var r = G.runStep(d, 'clients', 'import'); no(r, 'invalid', 'import with errors'); eq(r.errors, 2);
    no(G.rejectRow(d, 'clients', 10, ''), 'reason', 'reject needs reason');
    yes(G.rejectRow(d, 'clients', 10, 'Hotel tutup 2023')); yes(G.rejectRow(d, 'clients', 11, 'Nama kosong'));
    yes(G.runStep(d, 'clients', 'import')); eq(G.migBatch(d, 'clients').summary.rejected, 2); ok(audited(G, 'MIGRATION_EXECUTED', 'MGB-01'), 'MIGRATION_EXECUTED');
    no(G.rejectRow(d, 'clients', 1, 'x'), 'locked', 'rows locked after import');
  });
  add('NP-06', 'GO-T09', ['Perbaiki baris: divalidasi ulang dan dipetakan', 'Fix a row: re-validated and mapped'], function (G) {
    var d = as('dodi'); yes(G.runPipeline(d, 'clients', 'validate'));
    no(G.fixRow(d, 'clients', 11, { name: 'Bali Breeze Hotel' }, ''), 'reason');
    var r = yes(G.fixRow(d, 'clients', 11, { name: 'Bali Breeze Hotel' }, 'Nama dari arsip kontrak')).row; eq(r.st, 'ok'); eq(r.match, 'new');
    var w = G.runPipeline(d, 'weights', 'validate'); yes(w); var wr = G.migBatch(d, 'weights').rows;
    eq(wr[0].norm.kg, 0.6, '600 g → 0.6 kg'); eq(wr[0].target, 'IT-BTW-01'); eq(wr[2].st, 'error', 'negative weight');
  });
  add('NP-06', 'GO-T10', ['Rekonsiliasi: sisi baru = angka JFFIN asli, selisih terlihat', 'Reconciliation: new side equals the real JFFIN numbers, difference visible'], function (G, C, X, F) {
    var rc = G.reconciliation(as('dodi')), by = function (k) { return rc.filter(function (r) { return r.k === k; })[0]; };
    eq(by('ar').new, F.aging({ perms: ['ar.view'] }).total, 'new AR = JFFIN aging total');
    eq(by('ap').new, F.apAging({ perms: ['ap.view'] }).total, 'new AP = JFFIN AP aging');
    eq(by('stock').new, F.state().stock.reduce(function (s, x) { return s + F.stockValue(x); }, 0), 'new stock = JFFIN stock value');
    eq(by('asset').new, F.astDash({ perms: ['ast.view'] }).nbv, 'new asset NBV');
    eq(by('cash').new, ['ACC-05', 'ACC-06', 'ACC-07'].reduce(function (s, a) { return s + F.accBal(a); }, 0), 'cash');
    eq(by('bank').new, ['ACC-01', 'ACC-02', 'ACC-03', 'ACC-04'].reduce(function (s, a) { return s + F.accBal(a); }, 0), 'bank');
    eq(by('ar').diff, -2000000, 'AR difference visible (INV-2605-009 never reached JFFIN)'); eq(by('ar').st, 'difference');
    eq(by('ap').diff, 10130000, 'AP difference (TMB-2610-044 twice in JFFIN)'); eq(by('stock').diff, 438000); eq(by('asset').st, 'reconciled'); eq(by('cash').st, 'reconciled');
  });
  add('NP-06', 'GO-T11', ['Status rekonsiliasi: Difference → Review → Approved (maker-checker)', 'Reconciliation status: Difference → Review → Approved (maker-checker)'], function (G) {
    var d = as('dodi'), b = as('budi');
    no(G.approveRecon(b, 'RCN-AR', 'ok'), 'jump', 'approve straight from Difference');
    no(G.explainRecon(as('ketut'), 'RCN-AR', 'x'), 'noperm');
    yes(G.explainRecon(d, 'RCN-AR', 'INV-2605-009 Rp 2 jt sudah dihapusbukukan di sistem lama')); eq(G.reconItem(d, 'RCN-AR').st, 'review');
    var both = Object.assign({}, b, { uid: d.uid }); no(G.approveRecon(both, 'RCN-AR', 'ok'), 'maker', 'explainer cannot approve');
    yes(G.approveRecon(b, 'RCN-AR', 'Disetujui Finance')); eq(G.reconItem(d, 'RCN-AR').st, 'approved'); ok(audited(G, 'RECON_UPDATE', 'RCN-AR'), 'audited');
  });
  add('NP-06', 'GO-T12', ['Persetujuan migrasi: data lead mengajukan, owner menyetujui, AR juga Finance', 'Migration approval: data lead requests, owner approves, AR also Finance'], function (G) {
    var d = as('dodi'), aji = as('aji'), budi = as('budi');
    no(G.requestMigApproval(d, 'clients'), 'jump', 'before reconcile');
    ['clients', 'ar'].forEach(function (s) { yes(G.runPipeline(d, s, 'import')); G.migBatch(d, s).rows.filter(function (r) { return r.st === 'error'; }).forEach(function (r) { G.rejectRow(d, s, r.n, 'usang'); }); yes(G.runStep(d, s, 'import')); yes(G.runStep(d, s, 'reconcile')); yes(G.requestMigApproval(d, s, 'siap')); });
    no(G.approveMigration(d, 'clients', 'ok'), 'noperm', 'data lead cannot approve');
    var self = Object.assign({}, aji, { uid: d.uid }); no(G.approveMigration(self, 'clients', 'ok'), 'maker', 'requester cannot approve');
    no(G.approveMigration(budi, 'clients', 'ok'), 'invalid', 'clients need no Finance approval');
    var r = yes(G.approveMigration(aji, 'clients', 'Master klien OK')); eq(r.approved, true); ok(audited(G, 'MIGRATION_APPROVED', 'MGB-01'), 'MIGRATION_APPROVED');
    no(G.approveMigration(aji, 'ar', 'ok'), 'gate', 'AR difference not yet explained/approved');
    yes(G.explainRecon(d, 'RCN-AR', 'Dihapusbukukan')); yes(G.approveRecon(budi, 'RCN-AR', 'OK'));
    eq(yes(G.approveMigration(aji, 'ar', 'OK owner')).approved, false, 'AR still needs Finance'); eq(yes(G.approveMigration(budi, 'ar', 'OK finance')).approved, true);
    no(G.approveMigration(as('rama'), 'ar', 'x'), 'noperm', 'superadmin never approves migration');
  });
  add('NP-06', 'GO-T13', ['Baris staging dengan referensi tidak valid dilaporkan ke JFIMP', 'Staging rows with invalid references reported to JFIMP'], function (G) {
    var d = as('dodi'); yes(G.runPipeline(d, 'clients', 'validate')); yes(G.runPipeline(d, 'properties', 'validate'));
    var o = G.stagingOrphans(); ok(o.some(function (r) { return r.src === 'properties' && /C-099/.test(r.ref); }), 'P-05 → C-099 orphan');
    var p = G.migBatch(d, 'properties').rows; eq(p[0].target, 'PR-01A'); eq(p[2].target, 'PR-07D'); eq(p[3].match, 'new', 'property of a new client stays new');
  });

  /* ---- NP-08 UAT ---- */
  add('NP-08', 'GO-T14', ['16 kasus UAT, 8 kelompok tester = user demo asli, cakupan perangkat', '16 UAT cases, 8 tester groups = real demo users, device coverage'], function (G, C, X) {
    var s = G.uatSummary(as('intan')); eq(s.total, 16); eq(s.groups.length, 8); ok(s.groups.every(function (g) { return g.total === 2; }), '2 cases per group');
    G.uat(as('intan')).forEach(function (u) { ok(u.testerUid, u.tester + ' is a real user'); });
    ok(s.devices.mobile > 0 && s.devices.ipad > 0 && s.devices.desktop > 0, 'mobile, iPad and desktop covered');
    eq(s.openCritical.length, 2, 'UT-008 retest + UT-010 fail are critical and open'); ok(s.coverage.client.mobile.n === 2, 'client role tested on mobile');
  });
  add('NP-08', 'GO-T15', ['Tester mencatat tugasnya sendiri (juga klien); tidak untuk kasus orang lain', 'Testers record their own tasks (client too); never someone else\'s'], function (G) {
    var putu = as('putu'), arya = as('arya.jaens');
    eq(G.uat(putu).length, 2); no(G.recordUat(putu, 'UT-007', { status: 'pass' }), 'noperm', 'putu on ketut\'s case');
    yes(G.recordUat(arya, 'UT-015', { status: 'pass', evidence: ['foto-baru.jpg'] }), 'client tester');
    no(G.recordUat(putu, 'UT-001', { status: 'fail' }), 'invalid', 'fail needs the actual result');
    no(G.recordUat(putu, 'UT-001', { status: 'pass', sev: 'low' }), 'noperm', 'severity is the QA lead\'s call');
    yes(G.recordUat(putu, 'UT-001', { status: 'fail', actual: 'Label tidak tercetak', device: 'mobile' })); ok(audited(G, 'UAT_RESULT', 'UT-001'), 'audited');
    yes(G.markRetest(as('intan'), 'UT-001', 'Driver printer diperbarui')); eq(G.uatCase(putu, 'UT-001').st, 'retest');
  });
  add('NP-08', 'GO-T16', ['Sign-off UAT ditolak selama isu Critical terbuka; lalu UAT_COMPLETED', 'UAT sign-off refused while a Critical issue is open; then UAT_COMPLETED'], function (G) {
    var q = as('intan');
    var r = G.signOffUat(q, 'Siklus 1'); no(r, 'gate'); ok(r.failed.indexOf('UT-010') >= 0, 'UT-010 listed');
    yes(G.recordUat(as('budi'), 'UT-010', { status: 'pass', actual: 'Peringatan tampil di atas keyboard' })); yes(G.recordUat(as('ketut'), 'UT-008', { status: 'pass' }));
    var c = yes(G.signOffUat(q, 'Siklus 1 selesai')).cycle; ok(audited(G, 'UAT_COMPLETED', c.id), 'UAT_COMPLETED');
    no(G.signOffUat(as('putu'), 'x'), 'noperm');
  });
  add('NP-08', 'GO-T17', ['Usability: pengguna kesulitan → perbaiki UI dulu', 'Usability: users struggle → improve the UI first'], function (G) {
    var u = G.usability(as('intan')), by = function (id) { return u.filter(function (x) { return x.id === id; })[0]; };
    eq(by('USB-03').rec, 'improve_ui'); eq(by('USB-05').rec, 'improve_ui'); eq(by('USB-01').rec, 'ok'); ok(by('USB-05').flags.indexOf('time') >= 0, 'too slow');
    no(G.addUsability(as('intan'), { user: 'putu', task: 'x', device: 'phone', target: 60, time: 50, taps: 5, errors: 0, questions: 0, diff: 2 }), 'invalid');
    var r = yes(G.addUsability(as('intan'), { user: 'luh', task: 'Packing ulang', device: 'mobile', target: 60, time: 61, taps: 8, errors: 0, questions: 0, diff: 2 })); eq(r.usability.rec, 'ok');
  });
  add('NP-08', 'GO-T18', ['Fakta untuk JFIMP: uatGate, migrationGate, uatByWave', 'Facts for JFIMP: uatGate, migrationGate, uatByWave'], function (G) {
    eq(G.uatGate().ok, false, 'critical UAT open'); eq(G.migrationGate().ok, false); eq(typeof G.uatByWave('W4'), 'number'); eq(G.uatByWave('W1'), null);
    passUat(G); eq(G.uatGate().ok, true);
  });

  /* ---- NP-10 classification, chains, reset ---- */
  add('NP-10', 'GO-T19', ['Klasifikasi DUMMY / TEST / MIGRATION / REAL / SYSTEM per modul', 'Classification DUMMY / TEST / MIGRATION / REAL / SYSTEM per module'], function (G, C, X, F) {
    eq(G.classify('cm.client', E.CM.client('CL-01')), 'REAL'); eq(G.classify('fn.item', F.item('IT-BTW-01')), 'REAL');
    eq(G.classify('lg.order', E.LG.order('ORD-2610-101')), 'DUMMY'); eq(G.classify('fn.invoice', F.invoice('INV-2610-001')), 'MIGRATION');
    var jv = F.state().jv; eq(G.classify('fn.journal', jv.filter(function (j) { return j.src.t === 'inv'; })[0]), 'SYSTEM'); eq(G.classify('fn.journal', jv.filter(function (j) { return j.src.t === 'open'; })[0]), 'MIGRATION');
    yes(G.tagTest(as('intan'), 'lg.order', 'ORD-2610-144')); eq(G.classify('lg.order', E.LG.order('ORD-2610-144')), 'TEST');
    var c = G.classes(as('bayu')); ok(c.totals.REAL > 0 && c.totals.DUMMY > 0 && c.totals.SYSTEM > 0 && c.totals.TEST === 1, 'counts per class');
    ok(c.rows.some(function (r) { return r.mod === 'audit' && r.protected; }), 'audit counted as protected SYSTEM');
  });
  add('NP-10', 'GO-T20', ['Rantai dependensi dari data nyata (Order→…→Payment→Journal)', 'Dependency chains from real data (Order→…→Payment→Journal)'], function (G) {
    var ch = G.chainOf('dl.delivery', 'DLV-2610-001').map(function (x) { return x.id; });
    ok(ch.indexOf('BR-2610-001') >= 0 && ch.indexOf('JV-2610-0133') >= 0, 'delivery → billing → journal');
    var c2 = G.chainOf('fn.payment', 'PAY-2610-001').map(function (x) { return x.id; }); ok(c2.indexOf('INV-2609-071') >= 0 && c2.indexOf('JV-2610-0094') >= 0, 'invoice → payment → journal');
    var c3 = G.chainOf('pr.receiving', 'RCV-2610-008').map(function (x) { return x.id; }); ok(c3.indexOf('ORD-2610-131') >= 0 && c3.indexOf('B-2610-008') >= 0, 'order → receiving → batch');
  });
  add('NP-10', 'GO-T21', ['Reset butuh preview + snapshot + persetujuan ganda', 'Reset needs preview + snapshot + dual approval'], function (G) {
    var b = as('bayu'), aji = as('aji'), budi = as('budi'), adit = as('adit');
    no(G.createReset(b, { mode: 'dummy_only' }), 'reason'); no(G.createReset(as('putu'), { mode: 'dummy_only', reason: 'x' }), 'noperm');
    var id = yes(G.createReset(b, { mode: 'dummy_only', reason: 'Bersihkan dummy' })).reset.id; ok(audited(G, 'RESET_REQUESTED', id), 'RESET_REQUESTED');
    no(G.previewReset(b, id), 'jump', 'preview before dependency check');
    yes(G.dependencyCheck(b, id)); no(G.approveReset(aji, id, 'ok'), 'jump', 'approve before preview'); no(G.executeReset(adit, id), 'jump', 'execute before preview');
    var pv = yes(G.previewReset(b, id)).preview; ok(pv.archive.count > 0 && pv.retain.count > 0 && pv.recoverable === pv.archive.count, 'preview counts'); ok(pv.dependencies.kept.length > 0, 'kept chains listed');
    no(G.approveReset(aji, id, 'ok'), 'jump', 'approve before snapshot'); no(G.executeReset(adit, id), 'jump', 'execute before snapshot');
    yes(G.createSnapshot(adit, { reason: 'Sebelum reset', reset: id }));
    var self = Object.assign({}, aji, { uid: b.uid }); no(G.approveReset(self, id, 'ok'), 'maker', 'requester cannot approve');
    no(G.approveReset(adit, id, 'ok'), 'noperm', 'sysadmin never approves');
    eq(yes(G.approveReset(aji, id, 'Owner setuju')).approved, false, 'finance-impacting needs Finance too'); no(G.executeReset(adit, id), 'jump', 'one approval only');
    yes(G.approveReset(budi, id, 'Finance setuju')); ok(audited(G, 'RESET_APPROVED', id), 'RESET_APPROVED');
    no(G.executeReset(b, id), 'noperm', 'requester cannot execute'); var ex = yes(G.executeReset(adit, id)); ok(ex.count > 0, 'records erased'); ok(audited(G, 'RESET_EXECUTED', id), 'audited');
  });
  add('NP-10', 'GO-T22', ['HP ditolak untuk reset, hapus permanen & production start (§113)', 'Mobile refused for reset, permanent delete & production start (§113)'], function (G) {
    var bm = as('bayu', 'mobile'); no(G.createReset(bm, { mode: 'dummy_only', reason: 'x' }), 'device');
    no(G.createReset(as('bayu'), { mode: 'dummy_only', action: 'delete', reason: 'x', device: 'mobile' }), 'device', 'arg device');
    var id = yes(G.createReset(as('bayu'), { mode: 'dummy_only', reason: 'x' })).reset.id;
    no(G.dependencyCheck(bm, id), 'device'); no(G.executeReset(as('adit', 'mobile'), id), 'device'); no(G.startProduction(as('aji', 'mobile'), { reason: 'x' }), 'device');
    no(G.rollback(as('aji'), 'SNP-001', { reason: 'x', device: 'mobile' }), 'device');
    yes(G.reportIncident(as('ketut', 'mobile'), { problem: 'Tidak bisa foto POD', module: 'delivery' }), 'incident reporting works on mobile');
  });
  add('NP-10', 'GO-T23', ['Rantai disimpan utuh atau diarsip utuh; tanpa orphan', 'Chains kept whole or archived whole; no orphans'], function (G) {
    var b = as('bayu'), id = yes(G.createReset(b, { mode: 'dummy_only', reason: 'x' })).reset.id, d = yes(G.dependencyCheck(b, id)).deps;
    ok(d.kept.some(function (k) { return k.sample.indexOf('PAY-2610-001') >= 0 || k.because.id === 'INV-2609-071'; }), 'MIGRATION invoice chain kept whole');
    ok(d.pulled.some(function (p) { return p.id === 'JV-2610-0133'; }), 'SYSTEM journal pulled with its dummy delivery chain');
    yes(G.previewReset(b, id)); yes(G.createSnapshot(as('adit'), { reason: 'x', reset: id })); yes(G.approveReset(as('aji'), id, 'ok')); yes(G.approveReset(as('budi'), id, 'ok')); yes(G.executeReset(as('adit'), id));
    ok(G.isErased('dl.delivery', 'DLV-2610-001') && G.isErased('fn.billing', 'BR-2610-001') && G.isErased('fn.journal', 'JV-2610-0133'), 'whole chain archived');
    ok(!G.isErased('fn.payment', 'PAY-2610-001') && !G.isErased('fn.invoice', 'INV-2609-071'), 'kept chain untouched');
    eq(G.orphanCheck().length, 0, 'no orphan'); yes(G.reconcileReset(as('adit'), id)); yes(G.markResetReady(as('bayu'), id));
    var p = G.prep(as('aji')).items.filter(function (i) { return i.k === 'dummy'; })[0]; eq(p.ok, true, 'dummy cleaned');
  });
  add('NP-10', 'GO-T24', ['Soft erase: engine pemilik tidak diubah sama sekali', 'Soft erase: owner engines are never mutated'], function (G, C, X, F) {
    var snap = function () { return JSON.stringify([E.CM.state().clients, E.LG.state().orders, E.PR.state().batches, E.DL.state().dlv, F.state().inv, F.state().pays, F.state().jv, F.state().br]); };
    var before = snap(); cleanDummy(G); eq(snap(), before, 'owner engine data identical');
    var o = E.LG.order('ORD-2610-101'); ok(o, 'order still in JFLOG'); eq(G.visible('lg.order', o), false, 'hidden by JFGO'); eq(G.reportable('lg.order', o), false);
    eq(G.filter('lg.order', E.LG.state().orders).length < E.LG.state().orders.length, true, 'filter helper');
    var e = G.erasure('lg.order', 'ORD-2610-101'); ok(e.rsb && e.by && e.reason && e.kind === 'soft_erased' && e.orig === 'completed', 'batch id, by, reason, original status recorded');
  });
  add('NP-10', 'GO-T25', ['Data berubah setelah preview → eksekusi ditolak', 'Data changed after preview → execution refused'], function (G) {
    var b = as('bayu'), id = yes(G.createReset(b, { mode: 'dummy_only', reason: 'x' })).reset.id;
    yes(G.dependencyCheck(b, id)); yes(G.previewReset(b, id)); yes(G.createSnapshot(as('adit'), { reason: 'x', reset: id })); yes(G.approveReset(as('aji'), id, 'ok')); yes(G.approveReset(as('budi'), id, 'ok'));
    yes(G.tagTest(as('intan'), 'lg.order', 'ORD-2610-144'));
    yes(G.tagTest(as('intan'), 'fn.invoice', 'INV-2610-001'));
    no(G.executeReset(as('adit'), id), 'jump', 'stale preview');
    no(G.setResetScope(b, id, {}), 'locked', 'approved reset cannot be edited');
  });
  add('NP-10', 'GO-T26', ['Restore terpilih (seluruh rantai) dan semua; dalam retensi', 'Restore selected (whole chain) and all; within retention'], function (G) {
    var id = cleanDummy(G), a = as('adit');
    no(G.restoreReset(a, id, { ids: ['DLV-2610-001'] }), 'reason');
    var r = yes(G.restoreReset(a, id, { ids: ['DLV-2610-001'], reason: 'Dibutuhkan untuk pilot' })); ok(r.restored >= 3, 'whole chain restored');
    ok(!G.isErased('fn.journal', 'JV-2610-0133') && !G.isErased('fn.billing', 'BR-2610-001'), 'chain back'); eq(G.orphanCheck().length, 0, 'still no orphan');
    ok(audited(G, 'RESTORE_EXECUTED', id), 'RESTORE_EXECUTED'); yes(G.restoreReset(a, id, { all: true, reason: 'Batal reset' })); eq(G.erasedList(as('bayu')).length, 0);
    no(G.restoreReset(as('bayu'), id, { all: true, reason: 'x' }), 'noperm');
  });
  add('NP-10', 'GO-T27', ['Hapus permanen sebelum produksi: hanya DUMMY/TEST, tetap preview + snapshot + 2 persetujuan', 'Permanent delete before production: DUMMY/TEST only, still preview + snapshot + dual approval'], function (G, C, X, F) {
    no(G.canHardDelete('cm.client', E.CM.client('CL-01')), 'locked', 'real master'); no(G.canHardDelete('fn.invoice', F.invoice('INV-2610-001')), 'locked', 'migrated invoice');
    yes(G.canHardDelete('lg.order', E.LG.order('ORD-2610-142')), 'dummy order');
    var b = as('bayu'), id = yes(G.createReset(b, { mode: 'dummy_only', action: 'delete', reason: 'Hapus order demo' })).reset.id;
    yes(G.setResetScope(b, id, { mods: ['lg.order'] })); var d = yes(G.dependencyCheck(b, id)).deps;
    ok(d.kept.some(function (k) { return k.because.cls === 'SYSTEM' || k.because.cls === 'MIGRATION'; }) || d.targets > 0, 'chains with journals are kept for delete');
    var pv = yes(G.previewReset(b, id)).preview; eq(pv.recoverable, 0, 'delete is not recoverable'); ok(pv.del.count > 0, 'will delete');
    yes(G.createSnapshot(as('adit'), { reason: 'x', reset: id })); yes(G.approveReset(as('aji'), id, 'ok')); if (G.reset(b, id).fin) yes(G.approveReset(as('budi'), id, 'ok'));
    yes(G.executeReset(as('adit'), id)); ok(G.isErased('lg.order', 'ORD-2610-142') && G.erasure('lg.order', 'ORD-2610-142').kind === 'deleted', 'marked deleted');
    ok(E.LG.order('ORD-2610-142'), 'owner engine still holds it (demo never really removes)'); no(G.restoreReset(as('adit'), id, { all: true, reason: 'x' }), 'locked', 'deleted is not restorable');
  });
  add('NP-10', 'GO-T28', ['Proteksi hapus permanen setelah production start', 'Hard-delete protection after production start'], function (G, C, X, F) {
    readyForGo(G); yes(G.decide(as('aji'), 'GO', 'Semua gate lulus')); yes(G.startProduction(as('aji'), { reason: 'Go-live' }));
    var p = G.canHardDelete('fn.payment', F.state().pays[0]); no(p, 'locked'); eq(p.alt.length, 4, 'reverse / cancel / archive / adjustment suggested');
    no(G.canHardDelete('dl.delivery', E.DL.state().dlv.filter(function (d) { return d.pod && !G.isErased('dl.delivery', d.id); })[0] || E.DL.state().dlv[0]), 'locked', 'POD');
    no(G.canHardDelete('fn.journal', F.state().jv.filter(function (j) { return j.st === 'posted'; })[0]), 'locked', 'posted journal');
    var b = as('bayu'), id = yes(G.createReset(b, { mode: 'dummy_only', action: 'delete', reason: 'hapus pembayaran' })).reset.id; yes(G.setResetScope(b, id, { mods: ['fn.payment'] }));
    var r = G.dependencyCheck(b, id); no(r, 'locked', 'payments after start'); ok(r.protected.length > 0 && r.alt.length === 4, 'protected list + alternatives');
  });
  add('NP-10', 'GO-T29', ['Snapshot: salinan semua engine + checksum, verifikasi round trip', 'Snapshot: copy of every engine + checksum, round-trip verification'], function (G) {
    no(G.createSnapshot(as('putu'), { reason: 'x' }), 'noperm'); no(G.createSnapshot(as('adit'), {}), 'reason');
    var s = yes(G.createSnapshot(as('adit'), { reason: 'Baseline pra go-live' })).snapshot;
    ok(/^[0-9a-f]{8}$/.test(s.checksum) && s.size > 1000, 'checksum + size'); ok(s.engines.indexOf('JFFIN') >= 0 && s.engines.indexOf('JFLOG') >= 0, 'engines included'); ok(s.counts.JFFIN > 0, 'counts');
    var v = yes(G.verifySnapshot(as('adit'), s.id)); eq(v.match, true, 'round trip matches'); ok(audited(G, 'SNAPSHOT_CREATED', s.id), 'SNAPSHOT_CREATED');
  });
  add('NP-10', 'GO-T30', ['Cut-off tanggal & bulanan', 'Date & monthly cut-off'], function (G) {
    var b = as('bayu');
    no(G.setCutoff(as('ketut'), { kind: 'date', at: '2026-10-31 23:59', start: '2026-11-01 00:00', reason: 'x' }), 'noperm');
    no(G.setCutoff(b, { kind: 'date', at: '2026-11-01 00:00', start: '2026-10-31 23:59', reason: 'x' }), 'invalid', 'start before cut-off');
    var c = yes(G.setCutoff(b, { kind: 'monthly', month: '2026-10', reason: 'Akhir Oktober' })).cutoff; eq(c.at, '2026-10-31 23:59'); eq(c.start, '2026-11-01 00:00'); eq(c.st, 'set');
    ok(audited(G, 'CUTOFF_SET', 'COF-001'), 'CUTOFF_SET');
  });
  add('NP-10', 'GO-T31', ['Pilot & parallel run: angka JFRESH OS dari engine nyata', 'Pilot & parallel run: JFRESH OS figures from the real engines'], function (G, C, X, F) {
    var p = G.parallel(as('bayu')), by = function (k) { return p.rows.filter(function (r) { return r.k === k; })[0]; };
    eq(by('orders').new, E.LG.state().orders.filter(function (o) { return ['CL-07', 'CL-01'].indexOf(o.cl) >= 0 && o.st !== 'cancelled' && o.st !== 'draft'; }).length, 'orders from JFLOG');
    eq(by('inventory').new, F.state().stock.reduce(function (s, x) { return s + F.stockValue(x); }, 0)); ok(by('weight').diff !== 0, 'weight difference visible'); eq(p.rows.length, 7);
    no(G.setPilot(as('putu'), { from: '2026-10-02' }, 'x'), 'noperm'); yes(G.setPilot(as('bayu'), { clients: ['CL-07'] }, 'Pilot fokus Jaens'));
  });
  add('NP-10', 'GO-T32', ['Checklist persiapan go-live dihitung dari data nyata', 'Go-live preparation checklist computed from real state'], function (G) {
    var p = G.prep(as('aji')), it = function (k) { return p.items.filter(function (i) { return i.k === k; })[0]; };
    eq(p.items.length, 14); eq(it('snapshot').ok, false); eq(it('dummy').ok, false); eq(it('ar').ok, false); eq(it('master').ok, true); eq(it('audit').ok, true); eq(it('cashbank').ok, true);
    eq(it('contracts').hard, false, 'contracts is a warning'); ok(/CL-11/.test(it('contracts').v[1]), 'CL-11 has no active contract (real JFCOMM data)');
  });

  /* ---- NP-11 readiness, gates, decision, production start ---- */
  add('NP-11', 'GO-T33', ['Skor kesiapan: bobot §94 = 100, dari JFIMP/JFHELP/JFGO', 'Readiness score: §94 weights = 100, from JFIMP/JFHELP/JFGO'], function (G) {
    eq(G.WEIGHTS.reduce(function (s, w) { return s + w[1]; }, 0), 100);
    stubGood(G); var r = G.readiness(as('aji'));
    eq(r.dims.length, 8); var sum = r.dims.reduce(function (s, d) { return s + d.pts; }, 0); ok(Math.abs(sum - r.score) < 0.2, 'score = Σ weighted');
    eq(r.dims.filter(function (d) { return d.k === 'build'; })[0].v, 100, 'build from JFIMP'); eq(r.dims.filter(function (d) { return d.k === 'training'; })[0].v, 100, 'training from JFHELP');
    eq(r.rec, 'NO-GO', 'gates fail (UAT critical, opening balance)'); ok(r.failed.indexOf('uat') >= 0 && r.failed.indexOf('openingBalance') >= 0, 'failed gates listed');
  });
  add('NP-11', 'GO-T34', ['Hard gate: bug kritis JFIMP, key user belum terlatih, JFIMP tidak ada = gagal', 'Hard gates: JFIMP critical bug, untrained key users, missing JFIMP = fail'], function (G) {
    G._stub.imp = { readiness: function () { return { build: 90, qa: 90, security: 90, integration: 90, criticalBugs: ['BUG-0007'], securityFailures: [], permissionFailures: [], restoreTested: false }; } };
    G._stub.help = { readiness: function () { return { training: 60, keyUsersUntrained: ['putu'] }; } };
    var g = G.gates(as('aji')), by = function (k) { return g.filter(function (x) { return x.k === k; })[0]; };
    eq(by('criticalBug').ok, false); eq(by('training').ok, false); eq(by('restore').ok, false); eq(by('security').ok, true);
    G._stub.imp = null; G._stub.help = null; g = G.gates(as('aji')); ok(by('criticalBug') && g.filter(function (x) { return x.k === 'criticalBug'; })[0].unknown, 'unknown when JFIMP missing');
    eq(g.filter(function (x) { return x.k === 'criticalBug'; })[0].ok, false, 'never assumed');
    yes(G.createSnapshot(as('adit'), { reason: 'x' })); yes(G.verifySnapshot(as('adit'), 'SNP-001')); eq(G.gates(as('aji')).filter(function (x) { return x.k === 'restore'; })[0].ok, true, 'verified snapshot = restore tested');
  });
  add('NP-11', 'GO-T35', ['GO ditolak selama hard gate gagal; NO-GO boleh; Conditional butuh syarat', 'GO refused while a hard gate fails; NO-GO allowed; Conditional needs conditions'], function (G) {
    stubGood(G); var aji = as('aji');
    var r = G.decide(aji, 'GO', 'Mau go-live'); no(r, 'gate'); ok(r.failed.length > 0, 'failed gates returned');
    no(G.decide(aji, 'CONDITIONAL GO', 'x', { conditions: 'y' }), 'gate'); no(G.decide(aji, 'GO', ''), 'reason'); no(G.decide(aji, 'MAYBE', 'x'), 'invalid');
    yes(G.decide(aji, 'NO-GO', 'Gate UAT & saldo awal belum lulus')); eq(G.lastDecision().decision, 'NO-GO'); ok(audited(G, 'GOLIVE_DECISION', 'GO/NO-GO'), 'audited');
    readyForGo(G); no(G.decide(aji, 'CONDITIONAL GO', 'x'), 'invalid', 'conditions required');
    yes(G.decide(aji, 'GO', 'Semua gate lulus')); ok(audited(G, 'GOLIVE_APPROVED', 'GO/NO-GO'), 'GOLIVE_APPROVED');
  });
  add('NP-11', 'GO-T36', ['Superadmin / sysadmin / implementation lead tidak bisa memutuskan GO', 'Superadmin / sysadmin / implementation lead cannot decide GO'], function (G) {
    readyForGo(G);
    no(G.decide(as('rama'), 'GO', 'x'), 'noperm', 'superadmin'); no(G.decide(as('adit'), 'GO', 'x'), 'noperm', 'sysadmin'); no(G.decide(as('bayu'), 'GO', 'x'), 'noperm', 'implead');
    no(G.startProduction(as('rama'), { reason: 'x' }), 'noperm', 'superadmin start'); ok(G.state().audit.filter(function (e) { return e.ev === 'ACCESS_DENIED' && e.result === 'denied'; }).length >= 4, 'denials audited');
    eq(G.state().decisions.length, 0, 'no decision recorded');
  });
  add('NP-11', 'GO-T37', ['START PRODUCTION terkunci sampai semua syarat wajib lulus', 'START PRODUCTION gated until all hard requirements pass'], function (G) {
    stubGood(G); var aji = as('aji');
    var r = G.startProduction(aji, { reason: 'Go' }); no(r, 'gate'); ['snapshot', 'dummy', 'migration', 'cutoff', 'decision'].forEach(function (k) { ok(r.failed.indexOf(k) >= 0, k + ' listed'); });
    ok(audited(G, 'PRODUCTION_START', 'PRODUCTION_START_DATE', 'denied'), 'refusal audited'); no(G.startProduction(as('budi'), { reason: 'x' }), 'noperm', 'finance');
    readyForGo(G); r = G.startProduction(aji, { reason: 'Go' }); no(r, 'gate'); eq(r.failed.join(), 'decision', 'only the human decision is missing');
    eq(G.startCheck(aji).ok, false);
  });
  add('NP-11', 'GO-T38', ['PRODUCTION_START_DATE tidak bisa diubah setelah dibuat', 'PRODUCTION_START_DATE is immutable once created'], function (G) {
    readyForGo(G); var aji = as('aji'); yes(G.decide(aji, 'GO', 'Lulus semua gate'));
    var s = yes(G.startProduction(aji, { reason: 'Go-live 1 Nov' })).start; eq(s.date, '2026-11-01 00:00'); eq(s.decision, 'GO'); eq(s.version, 'v1.0.0'); ok(audited(G, 'PRODUCTION_START', 'PRODUCTION_START_DATE', 'ok'), 'PRODUCTION_START');
    no(G.startProduction(aji, { reason: 'lagi' }), 'locked', 'second start'); no(G.setProductionStart(aji, '2026-12-01'), 'locked'); no(G.decide(aji, 'NO-GO', 'x'), 'locked');
    no(G.setCutoff(as('bayu'), { kind: 'monthly', month: '2026-11', reason: 'x' }), 'locked'); eq(G.productionStart().date, '2026-11-01 00:00'); eq(G.hero(aji).st, 'LIVE');
    var copy = G.productionStart(); copy.date = 'x'; eq(G.productionStart().date, '2026-11-01 00:00', 'returned copy cannot alter it');
    G._reset(); eq(G.productionStart(), null, 'only the demo reset clears it');
  });
  add('NP-11', 'GO-T39', ['Setelah production start: data dummy/test dikeluarkan dari pelaporan; data baru = REAL', 'After production start: dummy/test excluded from reporting; new records = REAL'], function (G, C, X, F) {
    readyForGo(G); yes(G.decide(as('aji'), 'GO', 'ok')); yes(G.startProduction(as('aji'), { reason: 'go' }));
    var pay = F.state().pays.filter(function (p) { return !G.isErased('fn.payment', p.id); })[0]; eq(G.reportable('fn.payment', pay), false, 'pre-start dummy payment excluded');
    eq(G.reportable('fn.invoice', F.invoice('INV-2610-001')), true, 'migrated opening invoice reported');
    eq(G.classify('lg.order', { id: 'ORD-2611-001', date: '2026-11-02', st: 'requested' }), 'REAL', 'post-start order is REAL');
    no(G.restoreReset(as('adit'), G.resets(as('bayu'))[0].id, { all: true, reason: 'x' }), 'locked', 'no dummy restore after start');
  });
  add('NP-11', 'GO-T40', ['Rollback terkendali; ditolak setelah kejadian nyata yang tidak bisa dibatalkan', 'Controlled rollback; refused after irreversible real-world events'], function (G) {
    var id = cleanDummy(G), aji = as('aji'), snap = G.reset(aji, id).snap;
    no(G.rollback(as('bayu'), snap, { reason: 'x' }), 'noperm'); var r = yes(G.rollback(aji, snap, { reason: 'Reset salah scope' })); eq(r.erased, 0, 'back to the pre-reset state');
    ok(audited(G, 'ROLLBACK_EXECUTED', snap), 'audited'); eq(G.reset(aji, id).st, 'rolled_back');
    G._reset(); stubGood(G); migrateAll(G); passUat(G); yes(G.setCutoff(as('bayu'), { kind: 'date', at: '2026-09-30 23:59', start: '2026-10-01 00:00', reason: 'Pilot cut-off' })); var id2 = cleanDummy(G);
    yes(G.decide(aji, 'GO', 'ok')); yes(G.startProduction(aji, { reason: 'go' }));
    ok(G.irreversible().length > 0, 'payments / PODs since 1 Oct'); var rr = G.rollback(aji, G.reset(aji, id2).snap, { reason: 'x' }); no(rr, 'locked'); ok(rr.events.length > 0, 'events listed');
  });
  add('NP-11', 'GO-T41', ['Insiden: semua user lapor, kritis eskalasi & bell, alur berurutan, tutup butuh root cause', 'Incidents: anyone reports, critical escalates & bell, ordered flow, close needs root cause'], function (G, C, X) {
    var k = as('ketut', 'mobile'), b = as('bayu'), aji = as('aji');
    no(G.reportIncident(k, { problem: '' }), 'invalid');
    var i = yes(G.reportIncident(k, { problem: 'Pembayaran tercatat dua kali', kind: 'duplicate_payment', module: 'finance', sev: 'low' })); eq(i.incident.sev, 'critical', 'critical kind forces Critical'); eq(i.escalated, true);
    ok(X.notifsFor(aji).some(function (n) { return n.id === 'GO-' + i.incident.id; }), 'owner bell has GO- notification');
    var id = i.incident.id; no(G.advanceIncident(k, id, 'triage'), 'noperm', 'reporter cannot triage'); no(G.advanceIncident(b, id, 'assign', { owner: 'USR-121' }), 'jump', 'skip triage');
    yes(G.advanceIncident(b, id, 'triage')); no(G.advanceIncident(b, id, 'assign', {}), 'invalid', 'owner required'); yes(G.advanceIncident(b, id, 'assign', { owner: 'USR-121' }));
    var adit = as('adit'); ['investigate', 'fix', 'test', 'deploy'].forEach(function (s) { yes(G.advanceIncident(adit, id, s, s === 'fix' ? { rc: 'Tombol simpan dobel-tap', fix: 'Debounce tombol' } : {}), s); });
    yes(G.advanceIncident(k, id, 'confirm')); no(G.advanceIncident(k, id, 'closed'), 'noperm', 'reporter cannot close');
    yes(G.advanceIncident(b, id, 'closed')); ok(audited(G, 'INCIDENT_CLOSED', id), 'INCIDENT_CLOSED'); eq(G.incident(k, id).st, 'closed', 'reporter sees own ticket');
    eq(G.incidents(as('arta')).length, 0, 'others\' tickets hidden without go.live.view');
  });
  add('NP-11', 'GO-T42', ['Go-Live Command Center: KPI dari engine pemilik, 7 domain, hypercare', 'Go-Live Command Center: KPIs from owner engines, 7 domains, hypercare'], function (G, C, X) {
    var aji = as('aji'), h = G.hero(aji); eq(h.st, 'PRE-GO-LIVE'); eq(h.brand, 'JFRESH OS');
    var k = G.liveKpis(aji), by = function (x) { return k.filter(function (r) { return r.k === x; })[0]; };
    eq(by('ordersToday').v, E.LG.state().orders.filter(function (o) { return o.date === '2026-10-06' && o.st !== 'cancelled'; }).length, 'orders today = JFLOG');
    if (E.S) { var ig = E.S.integSummary({ perms: ['sys11.integration.view'] }); eq(by('integErr').v, ig.warning + ig.critical + ig.disconnected, 'integration errors = JFSYS'); }
    eq(G.domainHealth(aji).length, 7); var hc = G.hypercare(aji); eq(hc.days.length, 5); eq(hc.live, false);
    no(G.tickHypercare(as('bayu'), 1, 'login'), 'jump', 'before production start');
  });

  /* ---- NP-12 improvement + command center ---- */
  add('NP-12', 'GO-T43', ['Backlog P0–P3, review 30/60/90, release plan berurutan dengan rollback plan', 'Backlog P0–P3, 30/60/90 reviews, ordered release plan with rollback plan'], function (G) {
    var b = as('bayu');
    eq(G.backlog(b)[0].pri, 'P0', 'sorted by priority'); no(G.addBacklog(b, { problem: 'x', module: 'ux', pri: 'P9' }), 'invalid'); var n = yes(G.addBacklog(b, { problem: 'Tombol terlalu kecil', module: 'ux', pri: 'P2' })).item;
    no(G.updateBacklog(b, n.id, { st: 'done' }, ''), 'reason'); yes(G.updateBacklog(b, n.id, { st: 'planned' }, 'Masuk v1.1')); no(G.addBacklog(as('aji'), { problem: 'x', module: 'ux', pri: 'P1' }), 'noperm', 'owner reads only');
    var rv = G.reviews(b); eq(rv.length, 3); eq(rv[0].due, '2026-12-01', '30 days after the planned start'); yes(G.updateReview(b, 'RVW-30', { st: 'in_progress', finding: 'Adopsi Team 3 rendah' }, 'Mulai review'));
    var p = G.releasePlan(b, 'RPL-100'); eq(p.next, 'uat'); eq(p.hasRollback, true); no(G.advanceRelease(b, 'RPL-100', 'deploy'), 'jump');
    no(G.advanceRelease(b, 'RPL-100', 'uat', { skip: true }), 'invalid', 'major release needs UAT'); yes(G.advanceRelease(b, 'RPL-100', 'uat'));
    var bk = G.advanceRelease(b, 'RPL-100', 'backup'); ok(bk.ok || bk.code === 'gate', 'backup step checks JFSYS backups');
  });
  add('NP-12', 'GO-T44', ['Fase 12 Command Center & adopsi dari data nyata', 'Phase 12 Command Center & adoption from real data'], function (G) {
    stubGood(G); var c = G.command(as('aji'));
    ['build', 'qa', 'security', 'migration', 'uat', 'training', 'critical', 'readiness', 'health', 'adoption', 'availability'].forEach(function (k) { ok(c.kpis.some(function (x) { return x.k === k; }), k); });
    eq(c.flow.length, 21); eq(G.command(as('putu')), null);
    var ad = G.adoption(as('aji')), self = ad.filter(function (x) { return x.k === 'self'; })[0];
    var picks = E.LG.state().orders.filter(function (o) { return o.kind === 'pickup' && o.st !== 'cancelled' && o.st !== 'draft'; }); eq(self.v, Math.round(picks.filter(function (o) { return o.src === 'client'; }).length / picks.length * 1000) / 10, 'self-service from JFLOG');
    ok(G.kpiRefs(as('aji')).finance.aging.total > 0, 'finance KPI referenced from JFFIN');
  });
  add('AUDIT', 'GO-T45', ['Event audit §111 ada; JFSYS.auditAll menggabungkan audit JFGO', '§111 audit events exist; JFSYS.auditAll merges the JFGO trail'], function (G) {
    ['MIGRATION_EXECUTED', 'MIGRATION_APPROVED', 'RESET_REQUESTED', 'RESET_APPROVED', 'SNAPSHOT_CREATED', 'RESTORE_EXECUTED', 'PRODUCTION_START', 'UAT_COMPLETED', 'GOLIVE_APPROVED', 'INCIDENT_CLOSED', 'RELEASE_DEPLOYED'].forEach(function (k) { ok(G.AUDIT[k], k); });
    yes(G.createSnapshot(as('adit'), { reason: 'audit test' }));
    var e = G.state().audit[0]; ['id', 'at', 'ev', 'uid', 'emp', 'role', 'module', 'rec', 'before', 'after', 'reason', 'result', 'device'].forEach(function (f) { ok(f in e, 'field ' + f); });
    if (E.S) { var rows = E.S.auditAll(as('rama'), { module: 'golive' }); ok(rows.some(function (r) { return r.action === 'SNAPSHOT_CREATED'; }), 'merged into JFSYS.auditAll'); }
  });
  add('AUDIT', 'GO-T46', ['Ujung ke ujung: migrasi → UAT → cut-off → reset → snapshot → GO → START PRODUCTION → hypercare', 'End to end: migrate → UAT → cut-off → reset → snapshot → GO → START PRODUCTION → hypercare'], function (G) {
    readyForGo(G); var aji = as('aji'), r = G.readiness(aji);
    eq(r.failed.length, 0, 'all hard gates pass'); eq(r.rec, 'GO'); ok(r.score >= 85, 'score ≥ 85'); eq(G.migrationGate().ok, true);
    yes(G.decide(aji, 'GO', 'Ready')); yes(G.startProduction(aji, { reason: 'Production start' }));
    yes(G.tickHypercare(as('bayu'), 1, 'login', { note: 'Semua key user login' })); eq(G.hypercare(aji).live, true);
  });

  function run(G, C, X, F, env) {
    E = env || {}; E.G = G; E.C = C; E.X = X; E.F = F;
    var res = [];
    T.forEach(function (t) {
      if (X && X._resetStore) X._resetStore(); G._reset();
      NOW = Date.UTC(2026, 9, 6, 10, 30); G._setClock(function () { return NOW; });
      try { t.fn(G, C, X, F); res.push({ group: t.group, id: t.id, n: t.n, ok: true }); }
      catch (e) { res.push({ group: t.group, id: t.id, n: t.n, ok: false, err: e.message }); }
    });
    if (X && X._resetStore) X._resetStore(); G._reset(); G._setClock(null);
    return res;
  }
  var api = { cases: T, run: run };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.JFGO_TESTS = api;
})(typeof window !== 'undefined' ? window : this);
