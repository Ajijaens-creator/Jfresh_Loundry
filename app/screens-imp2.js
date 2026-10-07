/* JFRESH OS — Phase 12 screens (part 2, writer W2): NP-04 Functional QA, Regression & Business Rule Testing
   (QA-001…005), NP-05 Role, Permission, Security & Privacy Testing (SVL-001…004, the spec's SEC-001…004 renamed
   because Phase 11 owns SEC-*) and NP-07 Integration, Performance, Reliability, Backup & Recovery (RLB-001…005,
   the spec's REL-001…005 renamed because Phase 9 owns REL-*).
   Desktop is primary (tables, filters, pipelines); iPad reviews and runs tests; the phone shows status cards only
   with a designed-for-PC note (§113). Every figure and every action goes through the implementation engine
   (assets/js/jfos-imp.js, JFIMP) — integrations and backups through the system engine (JFSYS) — which checks the
   permission, the reason, the device and writes the audit trail. Owner records (orders, batches, invoices, users,
   integrations, backups) are linked to their owner screens, never copied (§2). */
(function () {
  var A = window.JFAPP, P = A && A.P10, H = A && A.P5, P8 = A && A.P8, I = window.JFIMP, Y = window.JFSYS;
  if (!A || !P || !H || !P8 || !I) return;
  var V = A.V, T = A.T, L = A.L, t = A.t, esc = A.esc, ic = A.ic, can = A.can, href = A.href;
  var lnk = H.lnk, card = H.card, kv = H.kv, note = H.note, dlg = H.dlg, fld = H.fld, inp = H.inp, sel = H.sel, area = H.area;
  var mono = P.mono, dt = H.dt;
  if (I.PARENTS) A.addParents(I.PARENTS);

  /* ================= Local helpers ================= */
  function cx() { return A.ctx(); }
  function devO() { return { device: A.mode() === 'm' ? 'mobile' : A.mode() === 't' ? 'tablet' : 'desktop' }; }
  function kp(items) { return P.kpis(items.map(function (x) { if (x.go && !H.open(x.go)) delete x.go; return x; }), 'qa12-kp'); }
  function fresh(src) { return P.fresh({ src: src, at: I.nowS(), kind: 'live' }); }
  function n0(v) { return v == null || isNaN(v) ? '—' : A.fmt.num(v, 0); }
  function pc(v, d) { return v == null || isNaN(v) ? '—' : A.fmt.num(v, d == null ? 1 : d) + '%'; }
  function msS(v) { return v == null ? '—' : v >= 60000 ? A.fmt.num(v / 60000, 1) + ' ' + T(L('mnt', 'min')) : v >= 1000 ? A.fmt.num(v / 1000, 2) + ' s' : A.fmt.num(v, v < 10 ? 2 : 0) + ' ms'; }
  function mOnly(html) { return '<div class="hide-d hide-t">' + html + '</div>'; }
  function noM(html) { return '<div class="hide-m">' + html + '</div>'; }
  function deskNote(msg) { return P.deskOnly(msg || L('Layar ini dirancang untuk PC. Di ponsel hanya status dan ringkasan yang ditampilkan.', 'This screen is designed for PC. On a phone only the status and summary are shown.')); }
  function errState() { return A.stateCard('error', I.MSG.load, A.btn('blue', L('Coba Lagi', 'Try Again'), 'refresh', { act: 'retry' }) + A.backBtn('ghost')); }
  function nfState(back) { return A.stateCard('empty', I.MSG.notfound, A.btn('blue', L('Kembali', 'Back'), 'arrowl', { go: back })); }
  function emp(id) { return id ? esc(I.empName(id)) : '—'; }
  // "Sumber: …" chip: where each number comes from (§2 one data).
  function src(lbl) { return '<span class="qa12-src">' + ic('database') + '<span>' + t(L('Sumber: ', 'Source: ')) + t(lbl) + '</span></span>'; }
  function mx(map, k, icon) { var x = map && map[k]; return x ? A.chip(x[1], x[0], icon) : A.chip('mute', L(String(k || '—'))); }
  var TC_IC = { pass: 'checkc', fail: 'xc', blocked: 'ban', retest: 'refresh' };
  function tcChip(st) { return mx(I.TC_ST, st, TC_IC[st]); }
  function bugChip(st) { return mx(I.BUG_ST, st); }
  function sevChip(s) { return mx(I.SEV, s, s === 'critical' ? 'alert' : null); }
  function tcLink(id) { return id ? lnk('QA-003', id, mono(id)) : '—'; }
  function bugLink(id) { return id ? lnk('QA-005', id, mono(id)) : '—'; }
  function uLink(uid, name) { return uid ? lnk('ADM-002', uid, esc(name || uid)) : esc(name || '—'); }
  // A real record id opens its owner screen when this role may open it.
  var REC_SCR = [[/^ORD-/, 'ORDER-002'], [/^RCV-/, 'PROD-RCV-002'], [/^B-/, 'PROD-TRACE-001'], [/^DLV-/, 'DISP-002'], [/^INV-/, 'AR-003'], [/^JV-/, 'ACC-004'], [/^INT-/, 'INT-002'], [/^BKP-/, 'SYS-006'], [/^BLK-/, 'BUILD-004'], [/^BUG-/, 'QA-005'], [/^TC-\d/, 'QA-003']];
  function recLink(rec) { if (!rec) return '—'; var s = REC_SCR.filter(function (x) { return x[0].test(rec); })[0]; return s ? lnk(s[1], rec, mono(rec)) : mono(rec); }
  function ring(v, tone, label) { return H.ring(v == null ? 0 : v, { size: 92, band: { tone: tone, n: label || L('', '') }, label: label }); }
  function toneOf(p, ok, warn) { return p == null ? 'mute' : p >= ok ? 'ok' : p >= warn ? 'warn' : 'crit'; }
  function bar(v, max, tone) { return P.bar(v, max, tone); }
  function relOpts(blank) { var r = I.releases(cx(), {}).map(function (x) { return [x.v, x.v + ' · ' + T(x.stN || x.st)]; }); return blank ? [['', blank]].concat(r) : r; }
  function modOpts(blank) { var o = Object.keys(I.MODULE_N).map(function (k) { return [k, I.MODULE_N[k]]; }); return blank ? [['', blank]].concat(o) : o; }
  function sevOpts(blank) { var o = Object.keys(I.SEV).map(function (k) { return [k, I.SEV[k][0]]; }); return blank ? [['', blank]].concat(o) : o; }
  function lines(s) { return String(s || '').split(/\n|;/).map(function (x) { return x.trim(); }).filter(Boolean); }
  // Run a heavier engine call after the button shows it is busy (the page never freezes without feedback, §40).
  function busy(el, fn) { if (el) { el.disabled = true; el.classList.add('busy'); var s = el.querySelector('span'); if (s) s.textContent = T(L('Menjalankan…', 'Running…')); } setTimeout(fn, 60); }
  function done(r, msg, tone) { if (!r || !r.ok) { A.rerender(); setTimeout(function () { P.fail(r); }, 280); return; } P.after(msg, tone); }
  function confirmRun(o) { dlg({ title: o.title, icon: o.icon || 'play', ok: o.ok || L('Jalankan', 'Run'), sub: t(o.sub), body: o.body || '', onOk: function () { var r = o.fn(); if (!r || !r.ok) return r ? r.msg : I.MSG.invalid; P.after(o.done(r), o.tone ? o.tone(r) : 'ok'); return true; } }); }

  /* ---------- Shared QA dialogs ---------- */
  function addTcDlg() {
    dlg({ title: L('Tambah Test Case', 'Add Test Case'), icon: 'plus', ok: L('Simpan Test Case', 'Save Test Case'),
      sub: t(L('Test case baru masuk dengan status Retest sampai dijalankan pertama kali.', 'A new test case starts as Retest until it is run for the first time.')),
      body: '<div class="qa12-fg">' + fld(L('Modul', 'Module'), sel('module', modOpts(), 'fin'), { req: true }) + fld(L('Severity', 'Severity'), sel('sev', sevOpts(), 'medium'), { req: true }) +
        fld(L('Skenario', 'Scenario'), inp('scen', '', { ph: L('mis. Invoice dibuat dari Billing Ready', 'e.g. Invoice built from Billing Ready') }), { req: true, wide: true }) +
        fld(L('Prasyarat', 'Precondition'), inp('pre', ''), { wide: true }) +
        fld(L('Langkah (satu per baris)', 'Steps (one per line)'), area('steps', '', L('Login sebagai finance\nBuka Billing Ready\nBuat invoice', 'Log in as finance\nOpen Billing Ready\nBuild the invoice')), { wide: true }) +
        fld(L('Hasil yang diharapkan', 'Expected result'), area('exp', ''), { req: true, wide: true }) + fld(L('Build', 'Build'), sel('build', relOpts(L('Build QA saat ini', 'Current QA build')), ''), { wide: true }) + '</div>',
      onOk: function (v, el) {
        v = P.vals(el);
        var r = I.addTestCase(cx(), { module: v.module, sev: v.sev, scen: v.scen, pre: v.pre || null, steps: lines(v.steps), exp: v.exp, build: v.build || null });
        if (!r || !r.ok) return r ? r.msg : I.MSG.invalid;
        P.after(L('Test case ' + r.tc.id + ' dibuat.', 'Test case ' + r.tc.id + ' created.')); return true;
      } });
  }
  function addBugDlg(tc) {
    var tcs = I.testCases(cx(), {}).map(function (x) { return [x.id, x.id + ' · ' + T(x.scen)]; });
    dlg({ title: L('Laporkan Bug', 'Report a Bug'), icon: 'alert', ok: L('Laporkan Bug', 'Report Bug'),
      sub: t(L('Bug baru berstatus Terbuka. Bug kritis/tinggi menahan gate produksi (§11).', 'A new bug starts Open. Critical/high bugs hold the production gate (§11).')),
      body: '<div class="qa12-fg">' + fld(L('Judul bug', 'Bug title'), inp('t', '', { ph: L('Apa yang salah?', 'What is wrong?') }), { req: true, wide: true }) +
        fld(L('Severity', 'Severity'), sel('sev', sevOpts(), 'high'), { req: true }) + fld(L('Rilis', 'Release'), sel('rls', relOpts(L('Build QA saat ini', 'Current QA build')), ''), {}) +
        fld(L('Test case terkait', 'Linked test case'), sel('tc', [['', L('Tidak ada', 'None')]].concat(tcs), tc || ''), { wide: true }) + '</div>',
      onOk: function (v, el) {
        v = P.vals(el);
        var r = I.addBug(cx(), { t: v.t, sev: v.sev, tc: v.tc || null, rls: v.rls || null });
        if (!r || !r.ok) return r ? r.msg : I.MSG.invalid;
        P.after(L('Bug ' + r.bug.id + ' dilaporkan.', 'Bug ' + r.bug.id + ' reported.'), 'warn'); return true;
      } });
  }
  function resultDlg(tc) {
    var x = I.testCase(cx(), tc); if (!x) { A.toast(I.MSG.notfound, 'crit'); return; }
    dlg({ title: L('Catat Hasil ' + x.id, 'Record Result ' + x.id), icon: 'filecheck', ok: L('Simpan Hasil', 'Save Result'),
      sub: '<b>' + esc(T(x.scen)) + '</b><br>' + t(L('Expected: ', 'Expected: ')) + esc(T(x.exp)),
      body: '<div class="qa12-fg">' + fld(L('Status', 'Status'), sel('status', Object.keys(I.TC_ST).map(function (k) { return [k, I.TC_ST[k][0]]; }), x.st === 'pass' ? 'pass' : 'pass'), { req: true }) +
        fld(L('Build', 'Build'), sel('build', relOpts(L('Tetap ' + x.build, 'Keep ' + x.build)), ''), {}) +
        fld(L('Hasil aktual', 'Actual result'), area('actual', '', L('Wajib untuk Fail / Blocked', 'Required for Fail / Blocked')), { wide: true, hint: t(L('Kosongkan untuk Pass: hasil aktual = expected.', 'Leave empty for Pass: actual = expected.')) }) +
        fld(L('Bukti (satu per baris: file / link / record id)', 'Evidence (one per line: file / link / record id)'), area('evidence', ''), { wide: true }) + '</div>',
      onOk: function (v, el) {
        v = P.vals(el);
        var r = I.result(cx(), x.id, { status: v.status, actual: v.actual || null, evidence: lines(v.evidence), build: v.build || null });
        if (!r || !r.ok) return r ? r.msg : I.MSG.invalid;
        P.after(L(x.id + ': ' + T(I.TC_ST[r.tc.st][0]) + ' tersimpan.', x.id + ': ' + I.TC_ST[r.tc.st][0][1] + ' saved.'), r.tc.st === 'pass' ? 'ok' : 'warn'); return true;
      } });
  }
  var BUG_ACT = { fixing: [L('Mulai Perbaikan', 'Start Fixing'), 'wrench', 'blue'], fixed: [L('Tandai Sudah Diperbaiki', 'Mark Fixed'), 'check', 'blue'], retest: [L('Kirim ke Retest', 'Send to Retest'), 'refresh', 'blue'], closed: [L('Tutup Bug', 'Close Bug'), 'checkc', 'primary'] };
  function bugStDlg(id, to) {
    var b = I.bug(cx(), id); if (!b) { A.toast(I.MSG.notfound, 'crit'); return; }
    P.reasonDlg({ title: L(T(BUG_ACT[to][0]) + ' · ' + id, BUG_ACT[to][0][1] + ' · ' + id), icon: BUG_ACT[to][1], ok: BUG_ACT[to][0], label: L('Catatan', 'Note'), ph: L('Apa yang dilakukan / diperiksa?', 'What was done / checked?'),
      sub: t(L('Status ', 'Status ')) + '<b>' + t(I.BUG_ST[b.st][0]) + '</b> → <b>' + t(I.BUG_ST[to][0]) + '</b>' + (to === 'closed' && b.tc ? '<br>' + t(L('Bug hanya bisa ditutup bila ' + b.tc + ' sudah lulus retest.', 'The bug can only be closed when ' + b.tc + ' has passed its retest.')) : ''),
      fn: function (n) { return I.setBugStatus(cx(), id, to, n); }, done: L(id + ': ' + T(I.BUG_ST[to][0]) + '.', id + ': ' + I.BUG_ST[to][0][1] + '.') });
  }
  function e2eRun(el) { busy(el, function () { var r = I.runE2E(cx()); done(r, r && r.ok ? L('E2E ' + r.run.id + ': ' + r.run.found + '/' + r.run.total + ' langkah ditemukan.', 'E2E ' + r.run.id + ': ' + r.run.found + '/' + r.run.total + ' steps found.') : '', r && r.ok && r.run.found === r.run.total ? 'ok' : 'warn'); }); }
  function rulesRun(el) { busy(el, function () { var r = I.runRules(cx()); done(r, r && r.ok ? L('Business rule test: ' + r.run.pass + '/' + r.run.total + ' lulus.', 'Business rule tests: ' + r.run.pass + '/' + r.run.total + ' passed.') : '', r && r.ok && r.run.pass === r.run.total ? 'ok' : 'warn'); }); }
  var qaActs = {
    addtc: function () { addTcDlg(); },
    addbug: function (el) { addBugDlg(el.getAttribute('data-val') || ''); },
    result: function (el) { resultDlg(el.getAttribute('data-val')); },
    e2e: function (el) { e2eRun(el); },
    rules: function (el) { rulesRun(el); },
    suite: function (el) {
      var k = el.getAttribute('data-val'), s = I.suites(cx()).filter(function (x) { return x.k === k; })[0]; if (!s) return;
      dlg({ title: L('Catat hasil suite ' + k, 'Record suite result ' + k), icon: 'list', ok: L('Simpan', 'Save'),
        sub: t(L('Jalankan ', 'Run ')) + '<code>node ' + esc(s.file) + '</code>' + t(L(' lalu isi baris terakhir "x/y passed".', ' then enter the last line "x/y passed".')),
        body: '<div class="qa12-fg">' + fld(L('Lulus', 'Passed'), inp('passed', s.passed == null ? s.total : s.passed, { num: true }), { req: true }) + fld(L('Total kasus', 'Total cases'), inp('total', s.total, { num: true }), { req: true }) + '</div>',
        onOk: function (v, el2) { v = P.vals(el2); var r = I.recordSuiteRun(cx(), k, +v.passed, +v.total); if (!r || !r.ok) return r ? r.msg : I.MSG.invalid; P.after(L('Suite ' + k + ': ' + v.passed + '/' + v.total + ' tercatat.', 'Suite ' + k + ': ' + v.passed + '/' + v.total + ' recorded.'), +v.passed === +v.total ? 'ok' : 'warn'); return true; } });
    },
    bugst: function (el) { var p = (el.getAttribute('data-val') || '').split('|'); bugStDlg(p[0], p[1]); }
  };
  function qaHeadBtns(o) {
    o = o || {};
    return (o.e2e ? A.pbtn('imp.qa.run', 'blue', L('Run E2E', 'Run E2E'), 'route', { act: 'e2e', cls: 'hide-m' }) : '') +
      (o.rules ? A.pbtn('imp.qa.run', 'ghost', L('Run Business Rules', 'Run Business Rules'), 'shield', { act: 'rules', cls: 'hide-m' }) : '') +
      (o.bug ? A.pbtn('imp.qa.manage', 'ghost', L('Laporkan Bug', 'Report Bug'), 'alert', { act: 'addbug', val: o.tc || '', cls: 'hide-m' }) : '') +
      (o.tc ? '' : A.pbtn('imp.qa.manage', 'primary', L('Tambah Test Case', 'Add Test Case'), 'plus', { act: 'addtc', cls: 'hide-m' }));
  }

  /* ---------- Golden E2E pipeline (§22) ---------- */
  function pipe(steps, o) {
    o = o || {};
    return '<ol class="qa12-pipe' + (o.compact ? ' qa12-pipe-c' : '') + '">' + steps.map(function (s, i) {
      return '<li class="' + (s.found ? 'ok' : 'miss') + '" title="' + esc(T(s.n) + (s.id ? ' · ' + s.id : '')) + '"><span class="qa12-pd">' + (s.found ? ic('check') : i + 1) + '</span><b>' + t(s.n) + '</b>' + (o.compact ? '' : '<small>' + (s.id ? recLink(s.id) : t(s.found ? L('ada', 'found') : L('belum ada', 'missing'))) + '</small>') + '</li>';
    }).join('') + '</ol>';
  }
  function ruleRows(rt) {
    return '<ul class="qa12-rl">' + rt.map(function (r) {
      var ch = r.last == null ? A.chip('mute', L('Belum dijalankan', 'Not run yet'), 'clock') : r.last ? A.chip('ok', L('Lulus', 'Pass'), 'checkc') : A.chip('crit', L('Gagal', 'Fail'), 'xc');
      return '<li><span class="qa12-rl-id mono6">' + esc(r.id) + '</span><span class="qa12-rl-b"><b>' + t(r.n) + '</b>' + (r.evidence ? '<small>' + t(r.evidence) + (r.how ? ' · ' + (r.how === 'sandbox' ? t(L('sandbox, state dipulihkan', 'sandbox, state restored')) : t(L('live read-only', 'live read-only'))) : '') + '</small>' : '') + '</span>' + ch + '</li>';
    }).join('') + '</ul>';
  }

  /* ================= QA-001 QA Dashboard (NV-04) ================= */
  V['QA-001'] = {
    title: function () { return L('QA Dashboard', 'QA Dashboard'); },
    render: function () {
      var c = cx(), q = I.qaSummary(c); if (!q) return errState();
      var tcs = I.testCases(c, {}), bugs = I.bugs(c, { st: 'open' }), suites = I.suites(c), e = I.e2e(c), rt = I.ruleTests(c);
      var gateQA = q.passRate >= 95 && !q.bugs.critical && !q.bugs.high;
      var tiles = kp([
        { k: L('Total Test Case', 'Total Test Cases'), v: n0(q.total), icon: 'list', tone: 'info', go: 'QA-002' },
        { k: L('Lulus', 'Passed'), v: n0(q.pass), icon: 'checkc', tone: 'ok', go: 'QA-002', q: { st: 'pass' } },
        { k: L('Gagal', 'Failed'), v: n0(q.fail), icon: 'xc', tone: q.fail ? 'crit' : 'ok', go: 'QA-002', q: { st: 'fail' } },
        { k: L('Terblokir', 'Blocked'), v: n0(q.blocked), icon: 'ban', tone: q.blocked ? 'warn' : 'ok', go: 'QA-002', q: { st: 'blocked' } },
        { k: L('Retest', 'Retest'), v: n0(q.retest), icon: 'refresh', tone: q.retest ? 'info' : 'ok', go: 'QA-002', q: { st: 'retest' } },
        { k: L('Pass Rate', 'Pass Rate'), v: pc(q.passRate), s: t(L('gate PROD ≥ 95%', 'PROD gate ≥ 95%')), icon: 'gauge', tone: toneOf(q.passRate, 95, 80) }
      ]);
      var focus = tcs.filter(function (x) { return x.st !== 'pass'; }).concat(tcs.filter(function (x) { return x.st === 'pass'; })).slice(0, 8);
      var tcCard = card(L('Test case perlu perhatian', 'Test cases needing attention'), A.list(focus, [
        { h: 'ID', cls: 'nw', v: function (x) { return tcLink(x.id); } },
        { h: L('Modul', 'Module'), v: function (x) { return t(x.moduleN); } },
        { h: L('Skenario', 'Scenario'), v: function (x) { return esc(T(x.scen)); } },
        { h: L('Severity', 'Severity'), v: function (x) { return sevChip(x.sev); } },
        { h: L('Hasil', 'Result'), v: function (x) { return tcChip(x.st); } }
      ], function (x) { return { t: esc(x.id) + ' · ' + esc(T(x.scen)), s: t(x.moduleN), chip: tcChip(x.st) }; }, function (x) { return href('QA-003', x.id); }), { icon: 'list', count: q.total - q.pass, link: ['QA-002', L('Semua test case', 'All test cases')] });
      var e2eCard = card(L('Skenario E2E emas', 'Golden E2E scenario'), (e ? pipe(e.chain ? e.chain.steps : [], { compact: true }) +
        '<p class="qa12-p">' + t(L('Rantai record nyata terbaik ', 'Best real record chain ')) + '<b>' + esc(e.chain ? e.chain.start : '—') + '</b>: ' + e.found + '/' + e.total + ' ' + t(L('langkah', 'steps')) + ' · ' + t(L('cakupan semua record ', 'coverage across all records ')) + e.coverage.filter(function (s) { return s.found; }).length + '/' + e.total + '</p>' : A.empty(L('Belum ada rantai record.', 'No record chain yet.'))) +
        '<div class="qa12-ra">' + A.pbtn('imp.qa.run', 'primary', L('Run Test', 'Run Test'), 'play', { act: 'e2e', cls: 'btn-sm hide-m' }) + A.btn('ghost', L('Detail E2E', 'E2E detail'), 'route', { go: 'QA-004', cls: 'btn-sm' }) + '</div>', { icon: 'route', right: e ? A.chip(e.found === e.total ? 'ok' : 'warn', e.pct + '%') : '' });
      var sevRows = ['critical', 'high', 'medium', 'low'].map(function (s) { var n = bugs.filter(function (b) { return b.sev === s; }).length; return { l: I.SEV[s][0], v: n, go: 'QA-005', qs: 'sev=' + s }; });
      var bugCard = card(L('Bug terbuka', 'Open bugs'), (bugs.length ? A.hbars(sevRows) + '<div class="rls qa12-gap8">' + bugs.slice(0, 4).map(function (b) { return A.rowLink({ href: href('QA-005', b.id), icon: 'alert', t: esc(b.id) + ' · ' + esc(T(b.t)), s: t(b.sevN) + ' · ' + t(b.stN) + ' · ' + esc(b.ownerN), tone: b.sev === 'critical' ? 'crit' : b.sev === 'high' ? 'warn' : '' }); }).join('') + '</div>' : A.empty(L('Tidak ada bug terbuka.', 'No open bugs.'))), { icon: 'alert', count: q.bugs.open, link: ['QA-005', L('Semua bug', 'All bugs')] });
      var regCard = card(L('Regression (suite otomatis)', 'Regression (automated suites)'), '<div class="qa12-reg"><b class="num">' + pc(q.regression.rate) + '</b><span>' + n0(q.regression.passed) + '/' + n0(q.regression.total) + ' ' + t(L('kasus', 'cases')) + ' · ' + q.regression.suites + ' suite</span></div>' +
        '<ul class="qa12-su">' + suites.map(function (s) { return '<li><span class="mono6">' + esc(s.k) + '</span><span class="qa12-su-b">' + (s.run ? bar(s.passed, s.total, s.ok ? 'ok' : 'crit') : '<small class="sub5">' + t(L('belum dicatat', 'not recorded')) + '</small>') + '</span><span class="num">' + (s.run ? s.passed + '/' + s.total : '—/' + s.total) + '</span>' + (can('imp.qa.manage') && !s.run ? A.btn('ghost', L('Catat', 'Record'), 'edit', { act: 'suite', val: s.k, cls: 'btn-sm qa12-ib hide-m' }) : '') + '</li>'; }).join('') + '</ul>' + src(L('tools/test-*.js (node)', 'tools/test-*.js (node)')), { icon: 'refresh' });
      var ruleCard = card(L('Business rule test (§23)', 'Business rule tests (§23)'), ruleRows(rt) + '<div class="qa12-ra">' + A.pbtn('imp.qa.run', 'blue', L('Run Business Rules', 'Run Business Rules'), 'shield', { act: 'rules', cls: 'btn-sm hide-m' }) + '</div>', { icon: 'shield', right: q.lastRules ? A.chip(q.lastRules.pass === q.lastRules.total ? 'ok' : 'crit', q.lastRules.pass + '/' + q.lastRules.total) : A.chip('mute', L('Belum dijalankan', 'Not run yet')) });
      var modCard = card(L('Pass rate per modul', 'Pass rate by module'), A.hbars(q.byModule.map(function (m) { return { l: m.n, v: Math.round(m.pass / m.total * 100), go: 'QA-002', qs: 'module=' + m.k }; }), { fmt: function (v) { return v + '%'; } }), { icon: 'chart' });
      var gate = note(gateQA ? t(L('Gate QA produksi terpenuhi: pass rate ≥ 95% dan tidak ada bug kritis/tinggi terbuka.', 'Production QA gate met: pass rate ≥ 95% and no open critical/high bug.')) :
        t(L('Gate QA produksi belum terpenuhi: ', 'Production QA gate not met: ')) + [q.passRate < 95 ? T(L('pass rate ' + pc(q.passRate) + ' (< 95%)', 'pass rate ' + pc(q.passRate) + ' (< 95%)')) : null, q.bugs.critical ? T(L(q.bugs.critical + ' bug kritis', q.bugs.critical + ' critical bug(s)')) : null, q.bugs.high ? T(L(q.bugs.high + ' bug tinggi', q.bugs.high + ' high bug(s)')) : null].filter(Boolean).map(esc).join(' · '), gateQA ? 'checkc' : 'alert', gateQA ? 'ok' : 'warn');
      var mobile = mOnly(P8.bigCount([
        { k: L('Pass rate', 'Pass rate'), v: pc(q.passRate, 0), icon: 'gauge', tone: toneOf(q.passRate, 95, 80) },
        { k: L('Gagal', 'Failed'), v: q.fail, icon: 'xc', tone: q.fail ? 'crit' : 'ok' },
        { k: L('Bug kritis', 'Critical bugs'), v: q.bugs.critical, icon: 'alert', tone: q.bugs.critical ? 'crit' : 'ok', go: 'QA-005', qs: 'sev=critical' },
        { k: L('Regression', 'Regression'), v: pc(q.regression.rate, 0), icon: 'refresh', tone: toneOf(q.regression.rate, 100, 95) }
      ]) + bugCard);
      return P.head(t(L('Functional, integration, regression, end-to-end & business rule — build ', 'Functional, integration, regression, end-to-end & business rules — build ')) + esc((tcs[0] || {}).build || '—'),
        qaHeadBtns({ rules: true, bug: true }), fresh(L('test case, bug & run dari JFIMP; record dari engine pemilik', 'test cases, bugs & runs from JFIMP; records from the owner engines'))) + deskNote() + mobile +
        noM(tiles + '<div class="qa12-gate">' + gate + '</div><div class="g21-10 qa12-gap"><div class="col10">' + tcCard + e2eCard + modCard + '</div><div class="col10">' + bugCard + regCard + ruleCard + '</div></div>');
    },
    act: qaActs
  };

  /* ================= QA-002 Test Case List (§21) ================= */
  V['QA-002'] = {
    title: function () { return L('Daftar Test Case', 'Test Case List'); },
    render: function (c0) {
      var c = cx(), qq = c0.q || {}, q = I.qaSummary(c); if (!q) return errState();
      var rows = I.testCases(c, { st: qq.st || null, module: qq.module || null, sev: qq.sev || null, q: qq.q || null });
      var defs = [
        { k: 'st', l: L('Status', 'Status'), opts: Object.keys(I.TC_ST).map(function (k) { return [k, I.TC_ST[k][0]]; }) },
        { k: 'module', l: L('Modul', 'Module'), opts: modOpts() },
        { k: 'sev', l: L('Severity', 'Severity'), opts: sevOpts() }
      ];
      var seg = H.tabs([['', L('Semua', 'All'), null, q.total], ['pass', I.TC_ST.pass[0], 'checkc', q.pass], ['fail', I.TC_ST.fail[0], 'xc', q.fail], ['blocked', I.TC_ST.blocked[0], 'ban', q.blocked], ['retest', I.TC_ST.retest[0], 'refresh', q.retest]], qq.st || '', 'st', { seg: true, def: '' });
      var list = A.list(rows, [
        { h: 'ID', cls: 'nw', v: function (x) { return tcLink(x.id); } },
        { h: L('Modul', 'Module'), v: function (x) { return t(x.moduleN) + '<small class="sub5">' + esc(x.wave || '') + '</small>'; } },
        { h: L('Skenario', 'Scenario'), v: function (x) { return '<b>' + esc(T(x.scen)) + '</b><small class="sub5">' + t(L('Expected: ', 'Expected: ')) + esc(T(x.exp)) + '</small>'; } },
        { h: L('Build', 'Build'), cls: 'nw', v: function (x) { return mono(x.build || '—'); } },
        { h: L('Tester', 'Tester'), v: function (x) { return esc(x.testerN); } },
        { h: L('Severity', 'Severity'), v: function (x) { return sevChip(x.sev); } },
        { h: L('Status', 'Status'), v: function (x) { return tcChip(x.st); } },
        { h: L('Retest', 'Retest'), cls: 'r num', v: function (x) { return x.retest ? n0(x.retest) : '—'; } },
        { h: L('Bug', 'Bugs'), v: function (x) { return x.bugs.length ? x.bugs.map(bugLink).join(' ') : '—'; } }
      ], function (x) { return { t: esc(x.id) + ' · ' + esc(T(x.scen)), r: '', s: t(x.moduleN) + ' · ' + esc(x.testerN), chip: tcChip(x.st) }; }, function (x) { return href('QA-003', x.id); },
        { dense: true, empty: L('Tidak ada test case untuk filter ini.', 'No test cases for this filter.') });
      return P.head(t(L('Test ID, modul, skenario, build, tester, severity, status dan retest (§21).', 'Test ID, module, scenario, build, tester, severity, status and retest (§21).')), qaHeadBtns({ bug: true }), fresh(L('JFIMP test case', 'JFIMP test cases'))) +
        seg + A.filters(defs, { search: L('Cari ID atau skenario', 'Search ID or scenario'), force: true }) + card(L('Test case', 'Test cases'), list, { icon: 'list', count: rows.length });
    },
    act: qaActs
  };

  /* ================= QA-003 Test Case Detail (§21) ================= */
  V['QA-003'] = {
    title: function (rec) { return rec ? L('Test Case ' + rec, 'Test Case ' + rec) : L('Detail Test Case', 'Test Case Detail'); },
    render: function (c0) {
      var c = cx();
      if (!c0.rec) {
        var open = I.testCases(c, {}).filter(function (x) { return x.st !== 'pass'; });
        return P.head(t(L('Pilih test case untuk melihat detail dan mencatat hasil.', 'Pick a test case to see its detail and record a result.')), A.btn('ghost', L('Semua test case', 'All test cases'), 'list', { go: 'QA-002' })) +
          card(L('Belum lulus', 'Not passed yet'), open.length ? '<div class="rls">' + open.map(function (x) { return A.rowLink({ href: href('QA-003', x.id), icon: 'filecheck', t: esc(x.id) + ' · ' + esc(T(x.scen)), s: t(x.moduleN), chip: tcChip(x.st) }); }).join('') + '</div>' : A.empty(L('Semua test case lulus.', 'All test cases pass.')), { icon: 'filecheck', count: open.length });
      }
      var x = I.testCase(c, c0.rec); if (!x) return nfState('QA-002');
      var hero = P8.hero({ id: x.id, icon: 'filecheck', title: esc(T(x.scen)), sub: t(x.moduleN) + ' · ' + esc(x.wave || '') + ' · ' + t(L('build ', 'build ')) + esc(x.build || '—'), chips: tcChip(x.st) + sevChip(x.sev),
        facts: [[L('Tester', 'Tester'), esc(x.testerN)], [L('Terakhir dijalankan', 'Last run'), esc(dt(x.at))], [L('Retest', 'Retest'), n0(x.retest) + '×'], [L('Bukti', 'Evidence'), n0(x.evidence.length)], [L('Bug terkait', 'Linked bugs'), n0(x.bugs.length)]] });
      var steps = card(L('Prasyarat & langkah', 'Precondition & steps'), kv([[L('Prasyarat', 'Precondition'), esc(T(x.pre))]]) + (x.steps.length ? '<ol class="qa12-steps">' + x.steps.map(function (s) { return '<li>' + esc(T(s)) + '</li>'; }).join('') + '</ol>' : ''), { icon: 'list' });
      var res = card(L('Expected vs aktual', 'Expected vs actual'), '<div class="qa12-ea"><div class="qa12-ea-e"><span>' + t(L('Hasil yang diharapkan', 'Expected result')) + '</span><p>' + esc(T(x.exp)) + '</p></div><div class="qa12-ea-a qa12-t-' + x.tone + '"><span>' + t(L('Hasil aktual', 'Actual result')) + '</span><p>' + (x.act ? esc(T(x.act)) : t(L('Belum ada hasil.', 'No result yet.'))) + '</p></div></div>', { icon: 'filecheck' });
      var ev = card(L('Bukti', 'Evidence'), x.evidence.length ? '<ul class="qa12-ev">' + x.evidence.map(function (e) { return '<li>' + ic('file') + '<span>' + recLink(e) + '</span></li>'; }).join('') + '</ul>' : A.empty(L('Belum ada bukti terlampir.', 'No evidence attached yet.')), { icon: 'file', count: x.evidence.length });
      var bg = card(L('Bug terkait', 'Linked bugs'), x.bugRecs.length ? '<div class="rls">' + x.bugRecs.map(function (b) { return A.rowLink({ href: href('QA-005', b.id), icon: 'alert', t: esc(b.id) + ' · ' + esc(T(b.t)), s: t(b.sevN) + ' · ' + esc(b.ownerN), chip: bugChip(b.st) }); }).join('') + '</div>' : A.empty(L('Tidak ada bug untuk test case ini.', 'No bugs for this test case.')), { icon: 'alert', count: x.bugRecs.length });
      var hist = card(L('Riwayat hasil', 'Result history'), x.hist.length ? A.list(x.hist.slice().reverse(), [
        { h: L('Waktu', 'Time'), cls: 'nw', v: function (h) { return esc(dt(h.at)); } }, { h: L('Oleh', 'By'), v: function (h) { return emp(h.by); } },
        { h: L('Status sebelumnya', 'Previous status'), v: function (h) { return tcChip(h.st); } }, { h: L('Build', 'Build'), v: function (h) { return mono(h.build || '—'); } }
      ], function (h) { return { t: esc(dt(h.at)), s: emp(h.by), chip: tcChip(h.st) }; }, null, { dense: true }) : A.empty(L('Belum ada riwayat: ini hasil pertama.', 'No history yet: this is the first result.')), { icon: 'history' });
      var acts = A.pbtn('imp.qa.manage', 'primary', L('Catat Hasil', 'Record Result'), 'filecheck', { act: 'result', val: x.id }) + A.pbtn('imp.qa.manage', 'ghost', L('Laporkan Bug', 'Report Bug'), 'alert', { act: 'addbug', val: x.id });
      return P.head(t(L('Test case §21 · audit setiap hasil', 'Test case §21 · every result is audited')), acts, fresh(L('JFIMP test case', 'JFIMP test case'))) + hero +
        '<div class="g21-10 qa12-gap"><div class="col10">' + res + steps + hist + '</div><div class="col10">' + bg + ev + '</div></div>' +
        (can('imp.qa.manage') ? mOnly(P8.abar(P8.xl('primary', L('CATAT HASIL', 'RECORD RESULT'), 'filecheck', { act: 'result', val: x.id }))) : '');
    },
    act: qaActs
  };

  /* ================= QA-004 E2E Test (§22) + business rules (§23) ================= */
  V['QA-004'] = {
    title: function () { return L('E2E Test', 'E2E Test'); },
    render: function () {
      var c = cx(), e = I.e2e(c), q = I.qaSummary(c); if (!e || !q) return errState();
      var steps = e.chain ? e.chain.steps : [], rt = I.ruleTests(c), last = q.lastE2E;
      var tiles = kp([
        { k: L('Langkah ditemukan', 'Steps found'), v: e.found + '/' + e.total, s: esc(e.chain ? e.chain.start : '—'), icon: 'route', tone: e.found === e.total ? 'ok' : 'warn' },
        { k: L('Cakupan semua record', 'Coverage across records'), v: e.coverage.filter(function (s) { return s.found; }).length + '/' + e.total, s: t(L('langkah yang ada di data', 'steps present in the data')), icon: 'layers', tone: 'info' },
        { k: L('Kandidat rantai', 'Chain candidates'), v: n0(e.candidates), s: t(L('order, receiving, delivery', 'orders, receivings, deliveries')), icon: 'search' },
        { k: L('Run terakhir', 'Last run'), v: last ? esc(last.id) : '—', s: last ? esc(dt(last.at)) + ' · ' + last.found + '/' + last.total : t(L('belum dijalankan', 'not run yet')), icon: 'history', tone: last ? (last.found === last.total ? 'ok' : 'warn') : null },
        { k: L('Business rule', 'Business rules'), v: q.lastRules ? q.lastRules.pass + '/' + q.lastRules.total : '—', s: q.lastRules ? esc(dt(q.lastRules.at)) : t(L('belum dijalankan', 'not run yet')), icon: 'shield', tone: q.lastRules ? (q.lastRules.pass === q.lastRules.total ? 'ok' : 'crit') : null }
      ]);
      var chain = card(L('Rantai emas: Pickup Request → Dashboard', 'Golden chain: Pickup Request → Dashboard'), pipe(steps) +
        '<p class="qa12-p">' + note(t(L('Read-only: E2E menelusuri record nyata di JFLOG → JFPROD → JFDLV → JFFIN dan tidak mengubah data.', 'Read-only: the E2E walks real records through JFLOG → JFPROD → JFDLV → JFFIN and changes nothing.')), 'eye', 'info') + '</p>', { icon: 'route', right: A.chip(e.found === e.total ? 'ok' : 'warn', e.pct + '%') });
      var tbl = card(L('Langkah per langkah', 'Step by step'), A.list(steps, [
        { h: '#', cls: 'r num', v: function (s) { return steps.indexOf(s) + 1; } },
        { h: L('Langkah', 'Step'), v: function (s) { return '<b>' + t(s.n) + '</b>'; } },
        { h: L('Record', 'Record'), cls: 'nw', v: function (s) { return s.id ? recLink(s.id) : '—'; } },
        { h: L('Catatan', 'Note'), v: function (s) { return s.note ? esc(T(s.note)) : '—'; } },
        { h: L('Engine pemilik', 'Owner engine'), v: function (s) { return '<span class="mono6">' + esc(s.engine) + '</span>'; } },
        { h: L('Hasil', 'Result'), v: function (s) { return s.found ? A.chip('ok', L('Ditemukan', 'Found'), 'checkc') : A.chip('warn', L('Belum ada', 'Missing'), 'alert'); } },
        { h: L('Ada di data lain', 'In other data'), cls: 'nw', v: function (s) { var cv = e.coverage.filter(function (x) { return x.k === s.k; })[0]; return cv && cv.found ? recLink(cv.id) : '<span class="sub5">—</span>'; } }
      ], function (s) { return { t: t(s.n), r: s.id ? esc(s.id) : '', s: esc(s.engine), chip: s.found ? A.chip('ok', L('Ditemukan', 'Found')) : A.chip('warn', L('Belum ada', 'Missing')) }; }, null, { dense: true }), { icon: 'list', count: steps.length });
      var miss = e.missing.length ? P.rec({ title: L('Langkah yang belum tersambung', 'Steps not yet linked'), icon: 'alert', tone: 'warn',
        sig: L(e.missing.length + ' dari ' + e.total + ' langkah belum ada di rantai terbaik.', e.missing.length + ' of ' + e.total + ' steps are missing from the best chain.'),
        why: L('Data demo memisah pickup, delivery dan invoice di record berbeda; rantai lengkap butuh satu order yang melewati semua tahap.', 'The demo data splits pickup, delivery and invoice across records; a full chain needs one order that passes every stage.'),
        impact: L('Gate UAT: skenario emas harus lulus penuh sebelum go-live.', 'UAT gate: the golden scenario must pass in full before go-live.'),
        rec: L('Jalankan satu order uji dari Pickup Request sampai Payment di UAT, lalu Run E2E lagi.', 'Run one test order from Pickup Request to Payment in UAT, then Run E2E again.') }) : '';
      var rules = card(L('Business rule test (§23)', 'Business rule tests (§23)'), ruleRows(rt) + note(t(L('Uji yang mengubah data berjalan di sandbox: state engine disalin, diuji, lalu dipulihkan persis.', 'Tests that would change data run in a sandbox: the engine state is copied, tested, then restored exactly.')), 'lock', 'info'), { icon: 'shield' });
      return P.head(t(L('Golden end-to-end test pada rantai record nyata (§22) dan business rule test (§23).', 'Golden end-to-end test on a real record chain (§22) and business rule tests (§23).')), qaHeadBtns({ e2e: true, rules: true }), fresh(L('JFLOG · JFPROD · JFDLV · JFFIN', 'JFLOG · JFPROD · JFDLV · JFFIN'))) +
        deskNote() + tiles + '<div class="qa12-gap">' + chain + '</div><div class="qa12-gap hide-m">' + tbl + '</div><div class="g21-10 qa12-gap"><div class="col10">' + rules + '</div><div class="col10">' + miss + '</div></div>';
    },
    act: qaActs
  };

  /* ================= QA-005 Bug Detail (and bug list without a record) ================= */
  var BUG_FLOW_ORDER = ['open', 'fixing', 'fixed', 'retest', 'closed'];
  V['QA-005'] = {
    title: function (rec) { return rec ? L('Bug ' + rec, 'Bug ' + rec) : L('Bug', 'Bugs'); },
    render: function (c0) {
      var c = cx(), qq = c0.q || {};
      if (!c0.rec) {
        var all = I.bugs(c, {}), q = I.qaSummary(c); if (!q) return errState();
        var rows = I.bugs(c, { st: qq.st || null, sev: qq.sev || null });
        var defs = [{ k: 'st', l: L('Status', 'Status'), opts: [['open', L('Belum selesai', 'Not done')]].concat(Object.keys(I.BUG_ST).map(function (k) { return [k, I.BUG_ST[k][0]]; })) }, { k: 'sev', l: L('Severity', 'Severity'), opts: sevOpts() }];
        var tiles = kp([
          { k: L('Bug terbuka', 'Open bugs'), v: q.bugs.open, icon: 'alert', tone: q.bugs.open ? 'warn' : 'ok', go: 'QA-005', q: { st: 'open' } },
          { k: L('Kritis', 'Critical'), v: q.bugs.critical, icon: 'alert', tone: q.bugs.critical ? 'crit' : 'ok', go: 'QA-005', q: { st: 'open', sev: 'critical' } },
          { k: L('Tinggi', 'High'), v: q.bugs.high, icon: 'alert', tone: q.bugs.high ? 'warn' : 'ok', go: 'QA-005', q: { st: 'open', sev: 'high' } },
          { k: L('Ditutup', 'Closed'), v: all.filter(function (b) { return b.st === 'closed'; }).length, icon: 'checkc', tone: 'ok', go: 'QA-005', q: { st: 'closed' } },
          { k: L('Total', 'Total'), v: q.bugs.total, icon: 'list', tone: 'info' }
        ]);
        var list = A.list(rows, [
          { h: 'ID', cls: 'nw', v: function (b) { return bugLink(b.id); } },
          { h: L('Judul', 'Title'), v: function (b) { return '<b>' + esc(T(b.t)) + '</b>'; } },
          { h: L('Severity', 'Severity'), v: function (b) { return sevChip(b.sev); } },
          { h: L('Test case', 'Test case'), v: function (b) { return tcLink(b.tc); } },
          { h: L('Rilis', 'Release'), v: function (b) { return mono(b.rls || '—'); } },
          { h: L('Pemilik', 'Owner'), v: function (b) { return esc(b.ownerN); } },
          { h: L('Dilaporkan', 'Reported'), cls: 'nw', v: function (b) { return esc(dt(b.at)); } },
          { h: L('Status', 'Status'), v: function (b) { return bugChip(b.st); } }
        ], function (b) { return { t: esc(b.id) + ' · ' + esc(T(b.t)), s: t(b.sevN) + ' · ' + esc(b.ownerN), chip: bugChip(b.st) }; }, function (b) { return href('QA-005', b.id); }, { dense: true, empty: L('Tidak ada bug untuk filter ini.', 'No bugs for this filter.') });
        return P.head(t(L('Bug dari test case & UAT · alur Terbuka → Diperbaiki → Sudah diperbaiki → Retest → Ditutup', 'Bugs from test cases & UAT · flow Open → Fixing → Fixed → Retest → Closed')), qaHeadBtns({ bug: true, tc: true }), fresh(L('JFIMP bug', 'JFIMP bugs'))) +
          tiles + A.filters(defs, { force: true }) + card(L('Daftar bug', 'Bug list'), list, { icon: 'alert', count: rows.length });
      }
      var b = I.bug(c, c0.rec); if (!b) return nfState('QA-005');
      var cur = BUG_FLOW_ORDER.indexOf(b.st);
      var hero = P8.hero({ id: b.id, icon: 'alert', title: esc(T(b.t)), sub: t(L('Dilaporkan ', 'Reported ')) + esc(dt(b.at)) + ' · ' + t(L('rilis ', 'release ')) + esc(b.rls || '—'), chips: sevChip(b.sev) + bugChip(b.st),
        facts: [[L('Pemilik perbaikan', 'Fix owner'), esc(b.ownerN)], [L('Test case', 'Test case'), tcLink(b.tc)], [L('Status test case', 'Test case status'), b.tcRec ? tcChip(b.tcRec.st) : '—'], [L('Langkah berikut', 'Next steps'), b.next.length ? b.next.map(function (n) { return t(I.BUG_ST[n][0]); }).join(' / ') : t(L('Selesai', 'Done'))]],
        extra: '<div class="qa12-flow">' + P8.step8(BUG_FLOW_ORDER.map(function (k) { return I.BUG_ST[k][0]; }), b.st === 'closed' ? BUG_FLOW_ORDER.length : cur) + '</div>' });
      var mng = can('imp.qa.manage');
      var actBtns = mng ? b.next.map(function (n) { var a = BUG_ACT[n]; return A.btn(a[2], a[0], a[1], { act: 'bugst', val: b.id + '|' + n }); }).join('') : '';
      var actCard = card(L('Tindakan', 'Actions'), (actBtns ? '<div class="qa12-ra">' + actBtns + '</div>' + (b.tcRec && b.next.indexOf('closed') >= 0 && b.tcRec.st !== 'pass' && b.st !== 'open' ? note(t(L('Penutupan ditolak engine selama ' + b.tc + ' belum lulus retest. Catat hasil retest dulu.', 'The engine refuses closing while ' + b.tc + ' has not passed its retest. Record the retest result first.')), 'info', 'warn') : '') :
        b.st === 'closed' ? A.empty(L('Bug sudah ditutup.', 'The bug is closed.')) : note(t(L('Hanya QA Lead (izin imp.qa.manage) yang mengubah status bug.', 'Only the QA Lead (imp.qa.manage) changes a bug status.')), 'lock', 'info')) +
        (b.tc && mng && H.open('QA-003') ? '<div class="qa12-ra">' + A.btn('ghost', L('Catat retest ' + b.tc, 'Record retest ' + b.tc), 'filecheck', { act: 'result', val: b.tc, cls: 'btn-sm' }) + '</div>' : ''), { icon: 'zap' });
      var tcCard = b.tcRec ? card(L('Test case terkait', 'Linked test case'), kv([[L('ID', 'ID'), tcLink(b.tcRec.id)], [L('Skenario', 'Scenario'), esc(T(b.tcRec.scen))], [L('Expected', 'Expected'), esc(T(b.tcRec.exp || L('—')))], [L('Aktual', 'Actual'), b.tcRec.act ? esc(T(b.tcRec.act)) : '—'], [L('Status', 'Status'), tcChip(b.tcRec.st)]]), { icon: 'filecheck' }) : '';
      var log = card(L('Riwayat status', 'Status history'), b.log.length ? '<ul class="qa12-log">' + b.log.slice().reverse().map(function (l) { return '<li><span class="qa12-log-d">' + esc(dt(l.at)) + '</span><span>' + bugChip(l.from) + ' → ' + bugChip(l.to) + '<small>' + emp(l.by) + (l.note ? ' · ' + esc(T(l.note)) : '') + '</small></span></li>'; }).join('') + '</ul>' : A.empty(L('Belum ada perubahan status.', 'No status changes yet.')), { icon: 'history', count: b.log.length });
      return P.head(t(L('Bug §21 · setiap perubahan status butuh catatan dan tercatat di audit', 'Bug §21 · every status change needs a note and is audited')), '', fresh(L('JFIMP bug', 'JFIMP bug'))) + hero +
        '<div class="g21-10 qa12-gap"><div class="col10">' + actCard + log + '</div><div class="col10">' + tcCard + '</div></div>';
    },
    act: qaActs
  };

  /* ================= NP-05 Security validation (SVL-001…004) ================= */
  function secRun(el) {
    busy(el, function () {
      var r = I.runSecurity(cx());
      done(r, r && r.ok ? (r.run.findings.length ? L('Validasi ' + r.run.id + ': ' + r.run.findings.length + ' temuan KRITIS.', 'Validation ' + r.run.id + ': ' + r.run.findings.length + ' CRITICAL findings.') : L('Validasi ' + r.run.id + ': ' + r.run.pass + '/' + r.run.total + ' uji negatif ditolak sesuai harapan.', 'Validation ' + r.run.id + ': ' + r.run.pass + '/' + r.run.total + ' negative tests denied as expected.')) : '', r && r.ok && r.run.findings.length ? 'crit' : 'ok');
    });
  }
  var secActs = { secrun: function (el) { secRun(el); } };
  function secBtn(cls) { return A.pbtn('imp.sec.run', 'primary', L('Jalankan Validasi Keamanan', 'Run Security Validation'), 'shield', { act: 'secrun', cls: cls || '' }); }
  function negChip(res) { return res == null ? A.chip('mute', L('Belum dijalankan', 'Not run yet'), 'clock') : res === 'pass' ? A.chip('ok', L('Ditolak ✓', 'Denied ✓'), 'ban') : A.chip('crit', L('DIIZINKAN', 'ALLOWED'), 'alert'); }
  function runLine(r) { return r.lastRun ? t(L('Run terakhir ', 'Last run ')) + '<b>' + esc(r.lastRun.id) + '</b> · ' + esc(dt(r.lastRun.at)) + ' · ' + emp(r.lastRun.by) : t(L('Belum ada run tersimpan — angka dihitung live sekarang.', 'No stored run yet — figures computed live now.')); }
  var KIND_N = { screen: L('Layar (URL)', 'Screen (URL)'), perm: L('Izin aksi', 'Action permission'), record: L('Record klien lain', 'Other client record'), golive: L('Keputusan Go/No-Go', 'Go/No-Go decision') };

  /* ================= SVL-001 Access Validation (NV-05) ================= */
  V['SVL-001'] = {
    title: function () { return L('Validasi Akses', 'Access Validation'); },
    render: function () {
      var c = cx(), roles = I.secRoles(c), rp = I.secReport(c), pm = I.permMatrix(c); if (!rp || !roles.length) return errState();
      var ok = roles.filter(function (r) { return r.resolved && r.match; }).length, checks = 0, held = 0;
      if (pm) pm.rows.forEach(function (r) { Object.keys(r.cells).forEach(function (m) { pm.actions.forEach(function (a) { checks += r.cells[m][a[0]].of; held += r.cells[m][a[0]].has; }); }); });
      var tiles = kp([
        { k: L('Peran diuji', 'Roles tested'), v: roles.length, s: t(L('user demo nyata', 'real demo users')), icon: 'users', tone: 'info' },
        { k: L('Uji izin', 'Permission tests'), v: n0(checks), s: n0(held) + ' ' + t(L('dimiliki', 'held')), icon: 'columns', go: 'SVL-002' },
        { k: L('Peran sesuai', 'Roles matching'), v: ok + '/' + roles.length, s: t(L('login & peran cocok', 'login & role match')), icon: 'usercheck', tone: ok === roles.length ? 'ok' : 'crit' },
        { k: L('Uji negatif ditolak', 'Negative tests denied'), v: rp.negative.pass + '/' + rp.negative.total, icon: 'ban', tone: rp.failures ? 'crit' : 'ok', go: 'SVL-003' },
        { k: L('Isu kritis', 'Critical issues'), v: rp.findings.length, icon: 'alert', tone: rp.findings.length ? 'crit' : 'ok', go: 'SVL-004' }
      ]);
      var list = A.list(roles, [
        { h: L('Peran (§25)', 'Role (§25)'), v: function (r) { return '<b>' + t(r.n) + '</b><small class="sub5 mono6">' + esc(r.role) + '</small>'; } },
        { h: L('User demo', 'Demo user'), v: function (r) { return uLink(r.uid, r.u); } },
        { h: L('Peran terbaca', 'Resolved role'), v: function (r) { return r.roleKey ? '<span class="mono6">' + esc(r.roleKey) + '</span>' : A.chip('crit', L(r.code || 'gagal', r.code || 'failed')); } },
        { h: L('Landing', 'Landing'), v: function (r) { return r.landing ? '<span class="mono6">' + esc(r.landing) + '</span>' : '—'; } },
        { h: L('Izin', 'Perms'), cls: 'r num', v: function (r) { return n0(r.perms); } },
        { h: L('Status', 'Status'), v: function (r) { return r.resolved && r.match ? A.chip('ok', L('Sesuai', 'Matches'), 'checkc') : A.chip('crit', L('Tidak sesuai', 'Mismatch'), 'alert'); } }
      ], function (r) { return { t: t(r.n), r: esc(r.u), s: esc(r.landing || r.code || '—'), chip: r.resolved && r.match ? A.chip('ok', L('Sesuai', 'Matches')) : A.chip('crit', L('Tidak sesuai', 'Mismatch')) }; }, null, { dense: true });
      var neg = I.negativeTests(c).slice(0, 5);
      var negCard = card(L('Hasil uji negatif', 'Negative test results'), '<ul class="qa12-ng">' + neg.map(function (n) { return '<li><span>' + t(n.n) + '</span>' + negChip(n.last) + '</li>'; }).join('') + '</ul>' + (rp.live ? note(t(L('Belum ada run tersimpan. Hasil live saat ini: ' + rp.negative.pass + '/' + rp.negative.total + ' ditolak.', 'No stored run yet. Live result now: ' + rp.negative.pass + '/' + rp.negative.total + ' denied.')), 'info', 'info') : ''), { icon: 'ban', link: ['SVL-003', L('Semua uji', 'All tests')] });
      var pick = ['login', 'api', 'session', 'masking'], chk = rp.checklist.items.filter(function (x) { return pick.indexOf(x.k) >= 0; });
      var chkRow = '<div class="qa12-ck4">' + chk.map(function (x) { return '<div class="qa12-ck qa12-t-' + (x.ok ? 'ok' : 'crit') + '">' + ic(x.ok ? 'checkc' : 'xc') + '<span><b>' + t(x.n) + '</b><small>' + t(x.v) + '</small></span></div>'; }).join('') + '</div>';
      var mobile = mOnly(P8.bigCount([
        { k: L('Peran sesuai', 'Roles matching'), v: ok + '/' + roles.length, icon: 'usercheck', tone: ok === roles.length ? 'ok' : 'crit' },
        { k: L('Uji negatif', 'Negative tests'), v: rp.negative.pass + '/' + rp.negative.total, icon: 'ban', tone: rp.failures ? 'crit' : 'ok', go: 'SVL-003' },
        { k: L('Checklist', 'Checklist'), v: rp.checklist.ok + '/' + rp.checklist.total, icon: 'checkc', tone: rp.checklist.ok === rp.checklist.total ? 'ok' : 'warn', go: 'SVL-004' },
        { k: L('Isu kritis', 'Critical issues'), v: rp.findings.length, icon: 'alert', tone: rp.findings.length ? 'crit' : 'ok', go: 'SVL-004' }
      ]));
      return P.head(runLine(rp), secBtn('hide-m') + A.btn('ghost', L('Laporan', 'Report'), 'shield', { go: 'SVL-004' }), fresh(L('X.resolve per user demo · JFSYS.matrix', 'X.resolve per demo user · JFSYS.matrix'))) + deskNote() + mobile +
        noM(tiles + '<div class="g21-10 qa12-gap"><div class="col10">' + card(L('Setiap peran di-resolve dengan user nyata', 'Each role resolved with a real user'), list + src(L('JFACCESS (login & role live)', 'JFACCESS (live login & role)')), { icon: 'usercheck', count: roles.length }) + '</div><div class="col10">' + negCard + '</div></div>' +
          '<div class="qa12-gap">' + card(L('Keamanan dasar', 'Security basics'), chkRow, { icon: 'lock', link: ['SVL-004', L('Checklist lengkap', 'Full checklist')] }) + '</div>');
    },
    act: secActs
  };

  /* ================= SVL-002 Permission Matrix Test (§26) ================= */
  function cell(x) {
    if (!x || !x.of) return '<span class="qa12-mx qa12-mx-na" title="—">·</span>';
    var full = x.has === x.of, none = !x.has;
    return '<span class="qa12-mx ' + (none ? 'qa12-mx-no' : full ? 'qa12-mx-ok' : 'qa12-mx-pt') + '" title="' + x.has + '/' + x.of + '">' + (none ? ic('minus') : ic('check')) + '<small>' + x.has + '/' + x.of + '</small></span>';
  }
  V['SVL-002'] = {
    title: function () { return L('Uji Matriks Izin', 'Permission Matrix Test'); },
    render: function (c0) {
      var c = cx(), qq = c0.q || {}, pm = I.permMatrix(c); if (!pm || !pm.rows.length) return errState();
      var row = pm.rows.filter(function (r) { return r.u === qq.u; })[0] || pm.rows[0];
      var scopeN = {}; (pm.scopes || []).forEach(function (s) { scopeN[s[0]] = s[1]; });
      var pickRole = '<label class="qa12-pick"><span>' + t(L('Peran', 'Role')) + '</span><select data-f="u">' + pm.rows.map(function (r) { return '<option value="' + esc(r.u) + '"' + (r.u === row.u ? ' selected' : '') + '>' + esc(T(r.n)) + ' · ' + esc(r.u) + '</option>'; }).join('') + '</select></label>';
      var head = '<tr><th>' + t(L('Modul', 'Module')) + '</th><th>' + t(L('Cakupan', 'Scope')) + '</th>' + pm.actions.map(function (a) { return '<th class="c">' + t(a[1]) + '</th>'; }).join('') + '</tr>';
      var body = pm.modules.map(function (m) { var cl = row.cells[m.k] || {}; return '<tr><th>' + t(m.n) + '</th><td>' + (cl.scope ? A.chip('info', scopeN[cl.scope] || L(cl.scope)) : '<span class="sub5">—</span>') + '</td>' + pm.actions.map(function (a) { return '<td class="c">' + cell(cl[a[0]]) + '</td>'; }).join('') + '</tr>'; }).join('');
      var table = '<div class="tblw hide-m"><table class="tbl dense qa12-mxt"><thead>' + head + '</thead><tbody>' + body + '</tbody></table></div>';
      var cards = '<div class="mcards hide-d hide-t">' + pm.modules.map(function (m) { var cl = row.cells[m.k] || {}, on = pm.actions.filter(function (a) { return cl[a[0]] && cl[a[0]].has; }).map(function (a) { return T(a[1]); }); return '<div class="mc"><span class="mc-t"><b>' + t(m.n) + '</b></span><span class="mc-s">' + (on.length ? esc(on.join(' · ')) : t(L('Tidak ada akses', 'No access'))) + '</span><span class="mc-c">' + (cl.scope ? A.chip('info', scopeN[cl.scope] || L(cl.scope)) : '') + '</span></div>'; }).join('') + '</div>';
      // Overview: how many modules each role can view / approve / administer (whole matrix at a glance).
      var over = A.list(pm.rows, [
        { h: L('Peran', 'Role'), v: function (r) { return '<a class="lnk5" href="' + href('SVL-002', null, { u: r.u }) + '">' + t(r.n) + '</a><small class="sub5">' + esc(r.u) + '</small>'; } }
      ].concat(pm.actions.map(function (a) { return { h: a[1], cls: 'r num', v: function (r) { var n = pm.modules.filter(function (m) { return r.cells[m.k] && r.cells[m.k][a[0]] && r.cells[m.k][a[0]].has; }).length; return n ? n : '<span class="sub5">0</span>'; } }; })),
        function (r) { return { t: t(r.n), r: esc(r.u) }; }, function (r) { return href('SVL-002', null, { u: r.u }); }, { dense: true });
      var legend = '<div class="qa12-lg">' + cell({ has: 3, of: 3 }) + '<span>' + t(L('semua izin dimiliki', 'all permissions held')) + '</span>' + cell({ has: 1, of: 3 }) + '<span>' + t(L('sebagian', 'partly')) + '</span>' + cell({ has: 0, of: 3 }) + '<span>' + t(L('tidak ada (ditolak)', 'none (denied)')) + '</span></div>';
      return P.head(t(L('View · Create · Edit · Approve · Export · Admin × modul × cakupan (Own, Team, Branch, Selected Branch, All Company).', 'View · Create · Edit · Approve · Export · Admin × module × scope (Own, Team, Branch, Selected Branch, All Company).')), A.btn('ghost', L('Validasi Akses', 'Access Validation'), 'usercheck', { go: 'SVL-001' }), fresh(L('JFSYS.matrix + izin live per user', 'JFSYS.matrix + live permissions per user'))) +
        '<div class="qa12-bar">' + pickRole + '<span class="qa12-bar-r">' + (row.resolved ? A.chip('ok', L('Login ' + row.u + ' berhasil', 'Login ' + row.u + ' OK'), 'checkc') : A.chip('crit', L('User tidak bisa login', 'User cannot sign in'), 'alert')) + src(L(pm.src, pm.src)) + '</span></div>' +
        card(L('Matriks: ' + T(row.n), 'Matrix: ' + row.n[1]), table + cards + legend, { icon: 'columns' }) + '<div class="qa12-gap hide-m">' + card(L('Ringkasan semua peran (jumlah modul per aksi)', 'All roles at a glance (modules per action)'), over, { icon: 'grid', count: pm.rows.length }) + '</div>';
    }
  };

  /* ================= SVL-003 Negative Test (§27) ================= */
  V['SVL-003'] = {
    title: function () { return L('Uji Negatif', 'Negative Test'); },
    render: function () {
      var c = cx(), rows = I.negativeTests(c), rp = I.secReport(c); if (!rp || !rows.length) return errState();
      var run = rows.filter(function (r) { return r.last; }).length, fail = rows.filter(function (r) { return r.last === 'fail'; }).length;
      var tiles = kp([
        { k: L('Skenario', 'Scenarios'), v: rows.length, s: t(L('semua harus DITOLAK', 'all must be DENIED')), icon: 'lock', tone: 'info' },
        { k: L('Ditolak sesuai harapan', 'Denied as expected'), v: rp.negative.pass + '/' + rp.negative.total, s: rp.live ? t(L('dihitung live', 'computed live')) : esc(rp.lastRun.id), icon: 'ban', tone: rp.failures ? 'crit' : 'ok' },
        { k: L('Diizinkan (gagal)', 'Allowed (failed)'), v: rp.failures, icon: 'alert', tone: rp.failures ? 'crit' : 'ok' },
        { k: L('Run terakhir', 'Last run'), v: rp.lastRun ? esc(dt(rp.lastRun.at)) : '—', s: rp.lastRun ? emp(rp.lastRun.by) : t(L('belum dijalankan', 'not run yet')), icon: 'history' }
      ]);
      var list = A.list(rows, [
        { h: 'ID', cls: 'nw', v: function (r) { return mono(r.id); } },
        { h: L('Skenario', 'Scenario'), v: function (r) { return '<b>' + t(r.n) + '</b>'; } },
        { h: L('User uji', 'Test user'), v: function (r) { return esc(r.u) + '<small class="sub5 mono6">' + esc(r.role) + '</small>'; } },
        { h: L('Jenis', 'Kind'), v: function (r) { return t(KIND_N[r.kind] || L(r.kind)) + '<small class="sub5 mono6">' + esc(r.target) + '</small>'; } },
        { h: L('Harapan', 'Expected'), v: function () { return A.chip('info', L('Ditolak', 'Denied'), 'ban'); } },
        { h: L('Hasil', 'Result'), v: function (r) { return negChip(r.last); } },
        { h: L('Bukti', 'Evidence'), cls: 'qa12-evd', v: function (r) { return r.evidence ? '<small>' + t(r.evidence) + '</small>' : '<span class="sub5">—</span>'; } }
      ], function (r) { return { t: t(r.n), r: esc(r.id), s: esc(r.u) + ' · ' + esc(r.target), chip: negChip(r.last) }; }, null, { dense: true });
      var findings = fail ? P.rec({ title: L('Temuan kritis', 'Critical findings'), icon: 'alert', tone: 'crit', sig: L(fail + ' skenario yang harus ditolak ternyata DIIZINKAN.', fail + ' scenarios that must be denied were ALLOWED.'), why: rows.filter(function (r) { return r.last === 'fail'; }).map(function (r) { return r.n; }),
        impact: L('Gate go-live keamanan tertutup; SECURITY_FAILURE tercatat di audit.', 'The security go-live gate is closed; SECURITY_FAILURE is in the audit.'), rec: L('Perbaiki izin peran terkait di System Admin, lalu jalankan validasi lagi.', 'Fix the role permissions in System Admin, then run the validation again.'), act: { n: L('Matriks peran', 'Role matrix'), s: 'ADM-003' } }) : '';
      return P.head(t(L('Driver → Finance, Operator → ubah tarif, Klien A → invoice Klien B, System Admin → setujui pembayaran: semua harus DITOLAK (§27).', 'Driver → Finance, Operator → pricing edit, Client A → Client B invoice, System Admin → approve payment: all must be DENIED (§27).')), secBtn('hide-m'), fresh(L('X.canScreen · X.can · X.authorize · JFCLP live', 'X.canScreen · X.can · X.authorize · JFCLP live'))) +
        deskNote() + tiles + (run ? '' : '<div class="qa12-gap">' + note(t(L('Belum ada run tersimpan. Jalankan validasi agar hasil dan bukti per skenario tercatat (ROLE_TESTED di audit).', 'No stored run yet. Run the validation so each scenario\'s result and evidence are recorded (ROLE_TESTED in the audit).')), 'info', 'info') + '</div>') + findings +
        '<div class="qa12-gap">' + card(L('Skenario uji negatif', 'Negative test scenarios'), list, { icon: 'lock', count: rows.length }) + '</div>';
    },
    act: secActs
  };

  /* ================= SVL-004 Security Test Report (§28–§29) ================= */
  V['SVL-004'] = {
    title: function () { return L('Laporan Uji Keamanan', 'Security Test Report'); },
    render: function () {
      var c = cx(), rp = I.secReport(c); if (!rp) return errState();
      var stT = { healthy: ['ok', L('Sehat', 'Healthy')], warning: ['warn', L('Perlu perhatian', 'Needs attention')], critical: ['crit', L('Kritis', 'Critical')] }[rp.st] || ['info', L(rp.st)];
      var hero = '<section class="card qa12-hero"><div class="qa12-hero-r">' + ring(rp.score, stT[0], L('Skor keamanan', 'Security score')) + '</div><div class="qa12-hero-b"><span class="qa12-eb">' + t(L('Skor keamanan', 'Security score')) + '</span><h2>' + A.chip(stT[0], stT[1], rp.st === 'healthy' ? 'checkc' : 'alert') + '</h2><p>' + runLine(rp) + '</p>' +
        '<div class="qa12-hf"><div><span>' + t(L('Peran diuji', 'Roles tested')) + '</span><b class="num">' + rp.roles + '</b></div><div><span>' + t(L('Uji negatif ditolak', 'Negative tests denied')) + '</span><b class="num">' + rp.negative.pass + '/' + rp.negative.total + '</b></div><div><span>' + t(L('Checklist §28', 'Checklist §28')) + '</span><b class="num">' + rp.checklist.ok + '/' + rp.checklist.total + '</b></div><div><span>' + t(L('Temuan kritis', 'Critical findings')) + '</span><b class="num' + (rp.findings.length ? ' qa12-crit' : '') + '">' + rp.findings.length + '</b></div></div></div></section>';
      var chk = card(L('Checklist keamanan (§28)', 'Security checklist (§28)'), '<ul class="qa12-cl">' + rp.checklist.items.map(function (x) { return '<li class="qa12-t-' + (x.ok ? 'ok' : 'crit') + '">' + ic(x.ok ? 'checkc' : 'xc') + '<span><b>' + t(x.n) + '</b><small>' + t(x.v) + '</small></span>' + A.chip(x.ok ? 'ok' : 'crit', x.ok ? L('Lulus', 'Passed') : L('Gagal', 'Failed')) + '</li>'; }).join('') + '</ul>' + src(L('X.POLICY · JFSYS.security · JFCLP · X.authorize (live)', 'X.POLICY · JFSYS.security · JFCLP · X.authorize (live)')), { icon: 'lock', count: rp.checklist.ok + '/' + rp.checklist.total });
      var fnd = card(L('Temuan kritis', 'Critical findings'), rp.findings.length ? '<ul class="qa12-ng">' + rp.findings.map(function (f) { return '<li><span><b class="mono6">' + esc(f.id) + '</b> ' + t(f.n) + '<small>' + t(f.evidence || L('—')) + '</small></span>' + A.chip('crit', L('Kritis', 'Critical'), 'alert') + '</li>'; }).join('') + '</ul>' : A.empty(L('Tidak ada temuan kritis.', 'No critical findings.')), { icon: 'alert', count: rp.findings.length });
      var priv = card(L('Privasi (§29)', 'Privacy (§29)'), '<ul class="qa12-pv"><li>' + ic('building') + t(L('Klien hanya melihat data klien/properti miliknya (uji isolasi lintas klien).', 'A client sees only its own client/property data (cross-client isolation tests).')) + '</li><li>' + ic('lock') + t(L('Data finansial, personalia dan sistem dibatasi per peran (uji negatif finance/HR/sistem).', 'Financial, personnel and system data are role-restricted (finance/HR/system negative tests).')) + '</li><li>' + ic('eyeoff') + t(L('Telepon dan rekening bank disamarkan untuk peran tanpa izin.', 'Phone and bank account numbers are masked for roles without permission.')) + '</li></ul>', { icon: 'eyeoff' });
      var links = '<div class="qa12-ra">' + A.btn('ghost', L('Validasi Akses', 'Access Validation'), 'usercheck', { go: 'SVL-001', cls: 'btn-sm' }) + A.btn('ghost', L('Matriks Izin', 'Permission Matrix'), 'columns', { go: 'SVL-002', cls: 'btn-sm' }) + A.btn('ghost', L('Uji Negatif', 'Negative Test'), 'lock', { go: 'SVL-003', cls: 'btn-sm' }) + (H.open('SEC-002') ? A.btn('ghost', L('Audit keamanan', 'Security audit'), 'history', { go: 'SEC-002', qs: 'module=implementation', cls: 'btn-sm' }) : '') + '</div>';
      return P.head(t(L('Ringkasan untuk keputusan go-live: peran, uji negatif, checklist keamanan dan temuan.', 'Summary for the go-live decision: roles, negative tests, security checklist and findings.')), secBtn('hide-m'), fresh(L('JFIMP validasi keamanan (live)', 'JFIMP security validation (live)'))) +
        hero + '<div class="g21-10 qa12-gap"><div class="col10">' + chk + '</div><div class="col10">' + fnd + priv + card(L('Lihat detail', 'See details'), links, { icon: 'link' }) + '</div></div>';
    },
    act: secActs
  };

  /* ================= NP-07 Reliability (RLB-001…005) ================= */
  var ST_IC = { healthy: 'checkc', warning: 'alert', critical: 'xc', disconnected: 'wifioff' };
  function intChip(i) { return i.future ? A.chip('mute', L('Rencana', 'Planned'), 'clock') : mx(I.INT_ST, i.st, ST_IC[i.st]); }
  function intLink(i) { return lnk('INT-002', i.id, esc(i.n)); }
  function latS(v) { return v == null ? '—' : n0(v) + ' ms'; }
  function latTone(v) { return v == null ? 'mute' : v >= 1000 ? 'crit' : v >= 600 ? 'warn' : 'ok'; }
  function bkpChip(st) { return st === 'success' ? A.chip('ok', L('Berhasil', 'Success'), 'checkc') : st === 'failed' ? A.chip('crit', L('Gagal', 'Failed'), 'xc') : A.chip('warn', L(String(st || '—'))); }
  function bStChip(st) { return st === 'healthy' ? A.chip('ok', L('Sehat', 'Healthy'), 'checkc') : st === 'warning' ? A.chip('warn', L('Perlu perhatian', 'Warning'), 'alert') : A.chip('crit', L('Kritis', 'Critical'), 'xc'); }
  function resChip(res) { return res == null ? A.chip('mute', L('Belum dijalankan', 'Not run yet'), 'clock') : res === 'pass' ? A.chip('ok', L('Lulus', 'Pass'), 'checkc') : A.chip('crit', L('Gagal', 'Fail'), 'xc'); }
  function hrs(h) { return h == null ? '—' : h < 1 ? n0(Math.round(h * 60)) + ' ' + T(L('mnt', 'min')) : A.fmt.num(h, 1) + ' ' + T(L('jam', 'h')); }
  function drCard(d) {
    if (!d) return '';
    return card(L('Disaster recovery (§43)', 'Disaster recovery (§43)'), '<div class="qa12-dr"><div class="qa12-t-' + (d.rpo.ok ? 'ok' : 'crit') + '"><span>RPO · ' + t(L('titik pemulihan', 'recovery point')) + '</span><b class="num">' + hrs(d.rpo.measured) + '</b><small>' + t(L('target ≤ ', 'target ≤ ')) + d.rpo.target + ' ' + t(L('jam', 'h')) + ' · ' + recLink(d.rpo.src) + '</small></div>' +
      '<div class="qa12-t-' + (d.rto.ok ? 'ok' : 'crit') + '"><span>RTO · ' + t(L('waktu pemulihan', 'recovery time')) + '</span><b class="num">' + hrs(d.rto.measured) + '</b><small>' + t(L('target ≤ ', 'target ≤ ')) + d.rto.target + ' ' + t(L('jam', 'h')) + ' · ' + esc(d.rto.src || '—') + '</small></div></div>' +
      note(t(L('RPO diukur dari backup sukses terakhir (JFSYS); RTO dari durasi restore test terakhir yang lulus.', 'RPO is measured from the last successful backup (JFSYS); RTO from the duration of the last passing restore test.')), 'info', 'info'), { icon: 'target' });
  }
  function reliRun(el, id) {
    busy(el, function () {
      var r = I.runReliability(cx(), id || undefined);
      done(r, r && r.ok ? L('Simulasi: ' + r.results.filter(function (x) { return x.res === 'pass'; }).length + '/' + r.results.length + ' gagal dengan aman.', 'Simulation: ' + r.results.filter(function (x) { return x.res === 'pass'; }).length + '/' + r.results.length + ' failed gracefully.') : '', r && r.ok && r.results.every(function (x) { return x.res === 'pass'; }) ? 'ok' : 'warn');
    });
  }
  function benchRun() {
    dlg({ title: L('Benchmark performa live', 'Live performance benchmark'), icon: 'zap', ok: L('Jalankan Benchmark', 'Run Benchmark'),
      sub: t(L('Mengukur waktu nyata di perangkat ini: daftar order (JFLOG), pencarian klien (JFCOMM) dan daftar invoice (JFFIN), masing-masing diulang N kali. Read-only.', 'Measures real time on this device: order list (JFLOG), client search (JFCOMM) and invoice list (JFFIN), each repeated N times. Read-only.')),
      body: fld(L('Jumlah pengulangan', 'Repetitions'), sel('n', [['50', '50'], ['200', '200'], ['500', '500']], '200'), { wide: true }),
      onOk: function (v, el) {
        v = P.vals(el); var r = I.runBenchmark(cx(), +v.n);
        if (!r || !r.ok) return r ? r.msg : I.MSG.invalid;
        var ok = r.results.filter(function (x) { return x.st === 'pass'; }).length;
        P.after(L('Benchmark: ' + ok + '/' + r.results.length + ' di bawah target (' + r.results.map(function (x) { return msS(x.res); }).join(', ') + ').', 'Benchmark: ' + ok + '/' + r.results.length + ' under target (' + r.results.map(function (x) { return msS(x.res); }).join(', ') + ').'), ok === r.results.length ? 'ok' : 'warn'); return true;
      } });
  }
  function restoreRun() {
    if (A.mode() === 'm') { A.toast(I.MSG.device, 'crit'); return; }
    var b = I.backup(cx());
    P.reasonDlg({ title: L('Jalankan Restore Test', 'Run Restore Test'), icon: 'refresh', ok: L('JALANKAN RESTORE TEST', 'RUN RESTORE TEST'), label: L('Alasan / konteks', 'Reason / context'), ph: L('mis. Restore test bulanan sebelum go-live', 'e.g. Monthly restore test before go-live'),
      sub: '<b>' + t(L('Yang akan terjadi:', 'What will happen:')) + '</b> ' + t(L('state semua engine (order, produksi, delivery, finance, portal, sistem, implementasi, akses) diserialisasi seperti backup, dipulihkan ke objek scratch di memori, lalu jumlah record dan hash dibandingkan. Data live TIDAK diubah. Hasil tercatat sebagai RESTORE_EXECUTED di audit.', 'the state of every engine (orders, production, delivery, finance, portal, system, implementation, access) is serialized like a backup, restored into a scratch object in memory, then record counts and hashes are compared. Live data is NOT changed. The result is logged as RESTORE_EXECUTED in the audit.')) +
        (b && b.lastOk ? '<br>' + t(L('Backup acuan: ', 'Reference backup: ')) + '<b class="mono6">' + esc(b.lastOk.id) + '</b> · ' + esc(dt(b.lastOk.at)) : ''),
      fn: function (n) { return I.runRestoreTest(cx(), n, devO()); }, done: L('Restore test selesai. Lihat hasil validasi data.', 'Restore test finished. See the data validation.') });
  }
  var relActs = {
    reli: function (el) { reliRun(el, el.getAttribute('data-val')); },
    bench: function () { benchRun(); },
    restore: function () { restoreRun(); },
    test: function (el) {
      var id = el.getAttribute('data-val');
      busy(el, function () {
        var r = Y && Y.testConnection ? Y.testConnection(cx(), id) : null;
        A.rerender(); setTimeout(function () { if (!r) { A.toast(I.MSG.load, 'crit'); return; } A.toast(r.msg || (r.ok ? L('Koneksi berhasil.', 'Connection OK.') : I.MSG.load), r.res === 'success' ? 'ok' : r.res === 'warning' ? 'warn' : 'crit'); }, 280);
      });
    },
    backup: function () {
      P.reasonDlg({ title: L('Backup Sekarang', 'Back Up Now'), icon: 'database', ok: L('Jalankan Backup', 'Run Backup'), label: L('Alasan', 'Reason'), ph: L('mis. Backup manual sebelum deploy v1.0.0', 'e.g. Manual backup before deploying v1.0.0'),
        sub: t(L('Backup manual di JFSYS (selain jadwal harian 02:00 WITA). Tercatat di audit sistem.', 'A manual backup in JFSYS (on top of the daily 02:00 WITA schedule). Logged in the system audit.')),
        fn: function (n) { return Y.runBackup(cx(), n); }, done: L('Backup manual selesai.', 'Manual backup finished.') });
    }
  };
  function relBtn(kind, label, icon, act, cls) { return A.pbtn('imp.rel.run', kind, label, icon, { act: act, cls: cls || '' }); }

  /* ================= RLB-001 Reliability Center (NV-07) ================= */
  V['RLB-001'] = {
    title: function () { return L('Reliability Center', 'Reliability Center'); },
    render: function () {
      var c = cx(), rc = I.reliabilityCenter(c); if (!rc) return errState();
      var ig = I.integrationHealth(c), rl = I.reliability(c), bk = I.backup(c), d = rc.dr, ix = rc.integrations;
      var tiles = kp([
        { k: L('Integrasi sehat', 'Healthy integrations'), v: ix.healthy + '/' + ix.total, s: (ix.warning ? ix.warning + ' warning · ' : '') + (ix.disconnected ? ix.disconnected + ' ' + T(L('terputus', 'disconnected')) : ''), icon: 'plug', tone: ix.critical ? 'crit' : ix.warning || ix.disconnected ? 'warn' : 'ok', go: 'RLB-002' },
        { k: L('Uji performa lulus', 'Performance tests passed'), v: rc.perf.pass + '/' + rc.perf.total, icon: 'zap', tone: rc.perf.pass === rc.perf.total ? 'ok' : 'warn', go: 'RLB-003' },
        { k: L('Simulasi gangguan', 'Failure simulations'), v: rc.reliability.run ? rc.reliability.pass + '/' + rc.reliability.total : '—', s: rc.reliability.run ? t(L('gagal dengan aman', 'failed gracefully')) : t(L('belum dijalankan', 'not run yet')), icon: 'shield', tone: !rc.reliability.run ? 'warn' : rc.reliability.pass === rc.reliability.total ? 'ok' : 'crit' },
        { k: L('Backup terakhir', 'Last backup'), v: rc.backup.last ? esc(String(rc.backup.last.at).slice(5, 16)) : '—', s: rc.backup.ready ? t(L('siap untuk deploy', 'ready for deploy')) : t(L('belum siap', 'not ready')), icon: 'database', tone: rc.backup.st === 'healthy' ? 'ok' : rc.backup.st === 'warning' ? 'warn' : 'crit', go: 'RLB-004' },
        { k: L('Restore test', 'Restore test'), v: rc.restore ? esc(rc.restore.id) : '—', s: rc.restore ? esc(dt(rc.restore.at)) : t(L('belum pernah', 'never')), icon: 'refresh', tone: rc.restore && rc.restore.res === 'pass' ? 'ok' : 'crit', go: 'RLB-005' },
        { k: 'RPO / RTO', v: hrs(d.rpo.measured) + ' / ' + hrs(d.rto.measured), s: t(L('target ', 'target ')) + d.rpo.target + ' / ' + d.rto.target + ' ' + t(L('jam', 'h')), icon: 'target', tone: d.rpo.ok && d.rto.ok ? 'ok' : 'crit', go: 'RLB-005' }
      ]);
      var act = ig.filter(function (i) { return !i.future; });
      var igCard = card(L('Status integrasi', 'Integration status'), A.list(act, [
        { h: L('Integrasi', 'Integration'), v: function (i) { return intLink(i); } },
        { h: L('Status', 'Status'), v: function (i) { return intChip(i); } },
        { h: L('Latency', 'Latency'), cls: 'r num', v: function (i) { return '<span class="qa12-l-' + latTone(i.latency) + '">' + latS(i.latency) + '</span>'; } },
        { h: L('Sinkron terakhir', 'Last sync'), cls: 'nw', v: function (i) { return esc(i.lastSync ? dt(i.lastSync) : '—'); } }
      ], function (i) { return { t: esc(i.n), r: latS(i.latency), chip: intChip(i) }; }, function (i) { return H.open('INT-002') ? href('INT-002', i.id) : null; }, { dense: true }) + src(L('JFSYS integrasi', 'JFSYS integrations')), { icon: 'plug', count: act.length, link: ['RLB-002', L('Detail', 'Details')] });
      var bkCard = card(L('Backup & recovery', 'Backup & recovery'), kv([
        [L('Backup terakhir', 'Last backup'), bk && bk.last ? recLink(bk.last.id) + ' · ' + esc(dt(bk.last.at)) + ' ' + bkpChip(bk.last.st) : '—'],
        [L('Frekuensi', 'Frequency'), bk ? t(bk.policy.freq) : '—'], [L('Retensi', 'Retention'), bk ? t(bk.policy.retention) : '—'],
        [L('Restore test terakhir', 'Last restore test'), rc.restore ? esc(rc.restore.id) + ' · ' + esc(dt(rc.restore.at)) + ' ' + resChip(rc.restore.res) : A.chip('crit', L('Belum pernah', 'Never'))],
        [L('Status', 'Status'), bStChip(rc.backup.st)], ['RPO', hrs(d.rpo.measured) + ' <span class="sub5">/ ' + d.rpo.target + ' ' + t(L('jam', 'h')) + '</span>'], ['RTO', hrs(d.rto.measured) + ' <span class="sub5">/ ' + d.rto.target + ' ' + t(L('jam', 'h')) + '</span>']
      ]) + '<div class="qa12-ra">' + relBtn('primary', L('Test Restore', 'Test Restore'), 'refresh', 'restore', 'btn-sm hide-m') + A.btn('ghost', L('Backup', 'Backup'), 'database', { go: 'RLB-004', cls: 'btn-sm' }) + '</div>', { icon: 'database' });
      var rlCard = card(L('Simulasi gangguan (§40)', 'Failure simulations (§40)'), '<ul class="qa12-rl">' + rl.map(function (r) { return '<li><span class="qa12-rl-id mono6">' + esc(r.id) + '</span><span class="qa12-rl-b"><b>' + t(r.n) + '</b><small>' + (r.evidence ? t(r.evidence) : t(L('Harapan: ', 'Expected: ')) + t(r.expect)) + '</small></span>' + resChip(r.res) + (can('imp.rel.run') ? A.btn('ghost', L('Uji', 'Test'), 'play', { act: 'reli', val: r.id, cls: 'btn-sm qa12-ib hide-m' }) : '') + '</li>'; }).join('') + '</ul>' +
        '<div class="qa12-ra">' + relBtn('blue', L('Jalankan semua simulasi', 'Run all simulations'), 'shield', 'reli', 'btn-sm hide-m') + '</div>', { icon: 'shield', right: rc.reliability.run ? A.chip(rc.reliability.pass === rc.reliability.total ? 'ok' : 'crit', rc.reliability.pass + '/' + rc.reliability.total) : '' });
      var mobile = mOnly(P8.bigCount([
        { k: L('Integrasi sehat', 'Healthy integrations'), v: ix.healthy + '/' + ix.total, icon: 'plug', tone: ix.critical ? 'crit' : ix.warning || ix.disconnected ? 'warn' : 'ok', go: 'RLB-002' },
        { k: L('Backup', 'Backup'), v: rc.backup.st === 'healthy' ? 'OK' : '!', icon: 'database', tone: rc.backup.st === 'healthy' ? 'ok' : 'warn', go: 'RLB-004' },
        { k: 'RPO', v: hrs(d.rpo.measured), icon: 'target', tone: d.rpo.ok ? 'ok' : 'crit' },
        { k: 'RTO', v: hrs(d.rto.measured), icon: 'clock', tone: d.rto.ok ? 'ok' : 'crit' }
      ]) + card(L('Integrasi bermasalah', 'Integrations with issues'), act.filter(function (i) { return i.st !== 'healthy'; }).length ? '<div class="rls">' + act.filter(function (i) { return i.st !== 'healthy'; }).map(function (i) { return A.rowLink({ href: H.open('INT-002') ? href('INT-002', i.id) : '#', icon: 'plug', t: esc(i.n), s: i.error ? esc(T(i.error)) : '', chip: intChip(i) }); }).join('') + '</div>' : A.empty(L('Semua integrasi sehat.', 'All integrations healthy.')), { icon: 'plug' }));
      return P.head(t(L('Integrasi, performa, simulasi gangguan, backup, restore test dan RPO/RTO dalam satu layar.', 'Integrations, performance, failure simulations, backup, restore test and RPO/RTO on one screen.')),
        A.btn('ghost', L('Integration Health', 'Integration Health'), 'plug', { go: 'RLB-002' }) + A.btn('ghost', L('Performa', 'Performance'), 'zap', { go: 'RLB-003' }) + relBtn('primary', L('Test Restore', 'Test Restore'), 'refresh', 'restore', 'hide-m'),
        fresh(L('JFSYS integrasi & backup · JFIMP uji', 'JFSYS integrations & backups · JFIMP tests'))) + deskNote() + mobile +
        noM(tiles + '<div class="g21-10 qa12-gap"><div class="col10">' + igCard + rlCard + '</div><div class="col10">' + bkCard + drCard(d) + '</div></div>');
    },
    act: relActs
  };

  /* ================= RLB-002 Integration Health (§38) ================= */
  V['RLB-002'] = {
    title: function () { return L('Integration Health', 'Integration Health'); },
    render: function (c0) {
      var c = cx(), qq = c0.q || {}, all = I.integrationHealth(c); if (!all) return errState();
      if (!all.length) return P.head('', '') + A.stateCard('empty', L('Belum ada integration error.', 'No integration errors yet.'));
      var rows = all.filter(function (i) { return !qq.st || (qq.st === 'future' ? i.future : !i.future && i.st === qq.st); });
      var act = all.filter(function (i) { return !i.future; }), cnt = function (s) { return act.filter(function (i) { return i.st === s; }).length; }, mng = can('sys11.integration.manage') && Y && Y.testConnection;
      var tiles = kp([
        { k: 'Healthy', v: cnt('healthy'), icon: 'checkc', tone: 'ok', go: 'RLB-002', q: { st: 'healthy' } },
        { k: 'Warning', v: cnt('warning'), icon: 'alert', tone: cnt('warning') ? 'warn' : 'ok', go: 'RLB-002', q: { st: 'warning' } },
        { k: 'Critical', v: cnt('critical'), icon: 'xc', tone: cnt('critical') ? 'crit' : 'ok', go: 'RLB-002', q: { st: 'critical' } },
        { k: 'Disconnected', v: cnt('disconnected'), icon: 'wifioff', tone: cnt('disconnected') ? 'warn' : 'ok', go: 'RLB-002', q: { st: 'disconnected' } },
        { k: L('Rencana', 'Planned'), v: all.length - act.length, icon: 'clock', go: 'RLB-002', q: { st: 'future' } }
      ]);
      var seg = H.tabs([['', L('Semua', 'All'), null, all.length], ['healthy', 'Healthy', 'checkc'], ['warning', 'Warning', 'alert'], ['critical', 'Critical', 'xc'], ['disconnected', 'Disconnected', 'wifioff'], ['future', L('Rencana', 'Planned'), 'clock']], qq.st || '', 'st', { seg: true, def: '' });
      var list = A.list(rows, [
        { h: L('Integrasi', 'Integration'), v: function (i) { return '<b>' + intLink(i) + '</b><small class="sub5 mono6">' + esc(i.id) + '</small>'; } },
        { h: L('Status', 'Status'), v: function (i) { return intChip(i); } },
        { h: L('Latency', 'Latency'), cls: 'r num', v: function (i) { return '<span class="qa12-l-' + latTone(i.latency) + '">' + latS(i.latency) + '</span>'; } },
        { h: L('Sinkron terakhir', 'Last sync'), cls: 'nw', v: function (i) { return esc(i.lastSync ? dt(i.lastSync) : '—'); } },
        { h: L('Sukses terakhir', 'Last success'), cls: 'nw', v: function (i) { return esc(i.lastSuccess ? dt(i.lastSuccess) : '—'); } },
        { h: L('Error', 'Error'), cls: 'qa12-evd', v: function (i) { return i.error ? '<small>' + esc(T(i.error)) + (i.errAt ? ' · ' + esc(dt(i.errAt)) : '') + '</small>' : '<span class="sub5">—</span>'; } },
        { h: L('Sukses %', 'Success %'), cls: 'r num', v: function (i) { return i.rate == null ? '—' : pc(i.rate); } },
        { h: L('Pemilik', 'Owner'), v: function (i) { return esc(T(i.owner || '—')); } },
        { h: '', v: function (i) { return mng && !i.future ? A.btn('ghost', L('Tes Koneksi', 'Test Connection'), 'refresh', { act: 'test', val: i.id, cls: 'btn-sm' }) : ''; } }
      ], function (i) { return { t: esc(i.n), r: latS(i.latency), s: i.error ? esc(T(i.error)) : t(L('Sinkron ', 'Synced ')) + esc(i.lastSync ? dt(i.lastSync) : '—'), chip: intChip(i) }; }, null, { dense: true, empty: L('Tidak ada integrasi untuk filter ini.', 'No integrations for this filter.') });
      var issues = act.filter(function (i) { return i.st !== 'healthy'; });
      var recs = issues.length ? P.rec({ title: L('Integrasi perlu perhatian', 'Integrations needing attention'), icon: 'plug', tone: issues.some(function (i) { return i.st === 'critical'; }) ? 'crit' : 'warn',
        sig: L(issues.length + ' integrasi tidak sehat: ' + issues.map(function (i) { return i.n; }).join(', ') + '.', issues.length + ' integrations not healthy: ' + issues.map(function (i) { return i.n; }).join(', ') + '.'),
        why: issues.filter(function (i) { return i.error; }).map(function (i) { return [i.n + ': ' + T(i.error), i.n + ': ' + i.error[1]]; }),
        impact: L('Proses inti tetap jalan (diuji RLT-006), tetapi notifikasi/pembayaran terkait bisa tertunda.', 'The core process keeps running (tested by RLT-006), but related notifications/payments may be delayed.'),
        rec: L('Periksa kredensial dan log di System Admin, lalu tes koneksi ulang.', 'Check credentials and logs in System Admin, then test the connection again.'), act: { n: L('Buka Integration Hub', 'Open the Integration Hub'), s: 'INT-001' } }) : '';
      return P.head(t(L('Status, latency, sinkron terakhir, sukses terakhir, error dan pemilik setiap integrasi (§38). Data milik System Admin.', 'Status, latency, last sync, last success, error and owner of every integration (§38). Owned by System Admin.')),
        (H.open('INT-001') ? A.btn('ghost', L('Integration Hub', 'Integration Hub'), 'plug', { go: 'INT-001' }) : ''), fresh(L('JFSYS.integrations · latency uji JFIMP', 'JFSYS.integrations · JFIMP test latency'))) +
        tiles + recs + '<div class="qa12-gap">' + seg + '</div>' + card(L('Integrasi', 'Integrations'), list + src(L('System Admin (JFSYS)', 'System Admin (JFSYS)')), { icon: 'plug', count: rows.length });
    },
    act: relActs
  };

  /* ================= RLB-003 Performance (§39) ================= */
  var KIND_P = { concurrent: L('User bersamaan', 'Concurrent users'), volume: L('Volume transaksi', 'Transaction volume'), list: L('Daftar besar', 'Large list'), search: L('Pencarian', 'Search'), dashboard: L('Dashboard', 'Dashboard'), report: L('Laporan', 'Report'), upload: L('Upload file', 'File upload'), import: L('Import', 'Import'), docs: L('Generate dokumen', 'Document generation'), live: L('Benchmark live', 'Live benchmark') };
  V['RLB-003'] = {
    title: function () { return L('Performa', 'Performance'); },
    render: function () {
      var c = cx(), rows = I.perfTests(c); if (!rows) return errState();
      var pass = rows.filter(function (p) { return p.st === 'pass'; }).length, live = rows.filter(function (p) { return p.live; }), fails = rows.filter(function (p) { return p.st !== 'pass'; });
      var mayRun = can('imp.qa.run') || can('imp.rel.run');
      var tiles = kp([
        { k: L('Uji performa', 'Performance tests'), v: rows.length, icon: 'zap', tone: 'info' },
        { k: L('Lulus target', 'Met target'), v: pass + '/' + rows.length, icon: 'checkc', tone: pass === rows.length ? 'ok' : 'warn' },
        { k: L('Di atas target', 'Over target'), v: fails.length, icon: 'alert', tone: fails.length ? 'crit' : 'ok' },
        { k: L('Benchmark live', 'Live benchmarks'), v: live.length, s: live.length ? esc(dt(live[live.length - 1].at)) : t(L('belum dijalankan', 'not run yet')), icon: 'gauge' }
      ]);
      var list = A.list(rows.slice().reverse(), [
        { h: 'ID', cls: 'nw', v: function (p) { return mono(p.id); } },
        { h: L('Uji', 'Test'), v: function (p) { return '<b>' + t(p.n) + '</b><small class="sub5">' + t(KIND_P[p.kind] || L(p.kind)) + (p.live ? ' · ' + n0(p.items) + ' ' + t(L('baris', 'rows')) + ' · ' + A.fmt.num(p.per, 3) + ' ms/' + t(L('panggil', 'call')) : '') + '</small>'; } },
        { h: L('Target', 'Target'), v: function (p) { return esc(T(p.target)); } },
        { h: L('Hasil', 'Result'), cls: 'qa12-pr', v: function (p) { return '<span class="qa12-prv"><b class="num">' + msS(p.res) + '</b>' + bar(p.res, Math.max(p.res, p.tv), p.st === 'pass' ? 'ok' : 'crit') + '</span>'; } },
        { h: L('Status', 'Status'), v: function (p) { return resChip(p.st) + (p.live ? ' ' + A.chip('info', L('Live', 'Live'), 'refresh') : ''); } },
        { h: L('Waktu', 'Time'), cls: 'nw', v: function (p) { return esc(dt(p.at)); } }
      ], function (p) { return { t: t(p.n), r: msS(p.res), s: esc(T(p.target)), chip: resChip(p.st) }; }, null, { dense: true });
      var recs = fails.length ? P.rec({ title: L('Di atas target', 'Over target'), icon: 'zap', tone: 'warn', sig: fails.map(function (p) { return [T(p.n) + ': ' + msS(p.res) + ' (' + T(p.target) + ')', p.n[1] + ': ' + msS(p.res) + ' (' + p.target[1] + ')']; })[0],
        why: L('Laporan besar dihitung saat dibuka; tidak ada cache ringkasan.', 'Large reports are computed on open; there is no summary cache.'), impact: L('Pengguna menunggu lebih lama; tidak memblokir go-live bila ada indikator memuat.', 'Users wait longer; does not block go-live when a loading indicator is shown.'),
        rec: L('Masukkan ke backlog optimasi dan ukur ulang setelah perbaikan.', 'Add it to the optimisation backlog and measure again after the fix.') }) : '';
      return P.head(t(L('Concurrent users, volume transaksi, daftar besar, pencarian, dashboard, laporan, upload, import, generate dokumen (§39).', 'Concurrent users, transaction volume, large lists, search, dashboard, report, upload, import, document generation (§39).')),
        mayRun ? A.btn('primary', L('Jalankan Benchmark', 'Run Benchmark'), 'play', { act: 'bench', cls: 'hide-m' }) : '', fresh(L('hasil uji JFIMP · benchmark live di perangkat ini', 'JFIMP test results · live benchmark on this device'))) +
        deskNote() + tiles + recs + '<div class="qa12-gap">' + card(L('Target vs hasil', 'Target vs result'), list, { icon: 'zap', count: rows.length }) + '</div>';
    },
    act: relActs
  };

  /* ================= RLB-004 Backup (§41) ================= */
  V['RLB-004'] = {
    title: function () { return L('Backup', 'Backup'); },
    render: function () {
      var c = cx(), b = I.backup(c); if (!b) return errState();
      var rst = I.restoreTests(c)[0], mayBk = Y && Y.runBackup && can('sys11.retention.manage');
      var hero = P8.hero({ id: b.last ? b.last.id : '—', icon: 'database', title: t(L('Backup terakhir ', 'Last backup ')) + (b.last ? esc(dt(b.last.at)) : '—'), sub: t(b.policy.freq) + ' · ' + t(L('jadwal ', 'schedule ')) + esc(b.schedule || '—'),
        chips: bStChip(b.st) + (b.ready ? A.chip('ok', L('Siap untuk deploy', 'Ready for deploy'), 'checkc') : A.chip('warn', L('Belum siap untuk deploy', 'Not ready for deploy'), 'alert')) + (b.restoreTested ? A.chip('ok', L('Restore sudah diuji', 'Restore tested'), 'refresh') : A.chip('crit', L('Restore belum diuji', 'Restore not tested'), 'alert')),
        facts: [[L('Frekuensi', 'Frequency'), t(b.policy.freq)], [L('Retensi', 'Retention'), t(b.policy.retention)], [L('Lokasi', 'Location'), t(b.policy.location)], [L('Pemilik', 'Owner'), esc(b.policy.ownerN)], [L('Backup sukses terakhir', 'Last successful backup'), b.lastOk ? recLink(b.lastOk.id) : '—']] });
      var warn = !b.restoreTested ? note(t(L('Backup belum dianggap lengkap sampai restore diuji (§42).', 'A backup is not considered complete until restore is tested (§42).')), 'alert', 'warn') :
        note(t(L('Restore terakhir diuji ', 'Restore last tested ')) + '<b>' + esc(rst ? rst.id + ' · ' + dt(rst.at) : '—') + '</b>. ' + t(L('Backup dianggap lengkap hanya bila restore diuji (§42).', 'A backup only counts as complete when restore is tested (§42).')), 'checkc', 'ok');
      var list = A.list(b.list, [
        { h: 'ID', cls: 'nw', v: function (x) { return recLink(x.id); } },
        { h: L('Waktu', 'Time'), cls: 'nw', v: function (x) { return esc(dt(x.at)); } },
        { h: L('Jenis', 'Kind'), v: function (x) { return x.kind === 'manual' ? A.chip('appr', L('Manual', 'Manual')) : A.chip('info', L('Terjadwal', 'Scheduled')); } },
        { h: L('Ukuran', 'Size'), cls: 'r num', v: function (x) { return x.size == null ? '—' : A.fmt.num(x.size, 1) + ' MB'; } },
        { h: L('Durasi', 'Duration'), cls: 'r num', v: function (x) { return x.dur == null ? '—' : n0(x.dur) + ' ' + t(L('mnt', 'min')); } },
        { h: L('Status', 'Status'), v: function (x) { return bkpChip(x.st); } },
        { h: L('Catatan', 'Note'), v: function (x) { return x.note ? '<small>' + esc(T(x.note)) + '</small>' : '<span class="sub5">—</span>'; } }
      ], function (x) { return { t: esc(x.id), r: esc(String(x.at).slice(5, 16)), chip: bkpChip(x.st) }; }, function (x) { return H.open('SYS-006') ? href('SYS-006', x.id) : null; }, { dense: true, empty: L('Belum ada backup.', 'No backups yet.') });
      return P.head(t(L('Frekuensi, retensi, lokasi, pemilik, backup terakhir dan status (§41). Data backup milik System Admin (JFSYS).', 'Frequency, retention, location, owner, last backup and status (§41). Backup data is owned by System Admin (JFSYS).')),
        (mayBk ? A.btn('ghost', L('Backup Sekarang', 'Back Up Now'), 'database', { act: 'backup', cls: 'hide-m' }) : '') + A.btn('primary', L('Restore Test', 'Restore Test'), 'refresh', { go: 'RLB-005' }), fresh(L('JFSYS.backups', 'JFSYS.backups'))) +
        hero + '<div class="qa12-gap">' + warn + '</div><div class="g21-10 qa12-gap"><div class="col10">' + card(L('Riwayat backup (14 terakhir)', 'Backup history (last 14)'), list + src(L('System Admin (JFSYS)', 'System Admin (JFSYS)')), { icon: 'history', count: b.list.length }) + '</div><div class="col10">' + drCard(I.dr(c)) + '</div></div>';
    },
    act: relActs
  };

  /* ================= RLB-005 Restore Test (§42–§43) ================= */
  var ENG_N = { perf: 'JFPERF', comm: 'JFCOMM', logi: 'JFLOG', prod: 'JFPROD', dlv: 'JFDLV', fin: 'JFFIN', clp: 'JFCLP', sys: 'JFSYS', imp: 'JFIMP', go: 'JFGO', help: 'JFHELP', access: 'JFACCESS' };
  V['RLB-005'] = {
    title: function () { return L('Restore Test', 'Restore Test'); },
    render: function () {
      var c = cx(), list = I.restoreTests(c), d = I.dr(c); if (!list || !d) return errState();
      var last = list[0], m = A.mode() === 'm';
      var hero = last ? P8.hero({ id: last.id, icon: 'refresh', title: t(L('Restore test terakhir ', 'Last restore test ')) + esc(dt(last.at)), sub: t(last.target || L('—')) + ' · ' + t(L('sumber ', 'source ')) + recLink(last.src) + ' · ' + emp(last.by),
        chips: resChip(last.res) + (last.liveUntouched ? A.chip('ok', L('Data live tidak diubah', 'Live data untouched'), 'shield') : ''),
        facts: [[L('Hasil', 'Result'), last.res === 'pass' ? t(L('Lulus', 'Pass')) : t(L('Gagal', 'Fail')), last.res === 'pass' ? '' : 'qa12-crit'], [L('Durasi', 'Duration'), msS(last.dur)], [L('Engine', 'Engines'), n0(last.engines)], [L('Record divalidasi', 'Records validated'), n0(last.records)],
          [L('Validasi data', 'Data validation'), (last.countsOk ? '✓ ' + T(L('jumlah', 'counts')) : '✗ ' + T(L('jumlah', 'counts'))) + ' · ' + (last.hashOk ? '✓ hash' : '✗ hash')]] }) :
        A.stateCard('warning', L('Belum ada restore test. Backup belum dianggap lengkap.', 'No restore test yet. The backup is not considered complete.'));
      var det = last && last.detail ? card(L('Validasi per engine (' + last.id + ')', 'Validation per engine (' + last.id + ')'), A.list(last.detail, [
        { h: L('Engine', 'Engine'), v: function (x) { return '<b class="mono6">' + esc(ENG_N[x.k] || x.k) + '</b>'; } },
        { h: L('Record sebelum', 'Records before'), cls: 'r num', v: function (x) { return n0(x.before); } },
        { h: L('Record sesudah restore', 'Records after restore'), cls: 'r num', v: function (x) { return n0(x.after); } },
        { h: L('Jumlah', 'Count'), v: function (x) { return x.countOk ? A.chip('ok', L('Sama', 'Match'), 'checkc') : A.chip('crit', L('Beda', 'Differs'), 'xc'); } },
        { h: 'Hash', v: function (x) { return x.hashOk ? A.chip('ok', L('Sama', 'Match'), 'checkc') : A.chip('crit', L('Beda', 'Differs'), 'xc'); } }
      ], function (x) { return { t: esc(ENG_N[x.k] || x.k), r: n0(x.after), chip: x.countOk && x.hashOk ? A.chip('ok', L('Sama', 'Match')) : A.chip('crit', L('Beda', 'Differs')) }; }, null, { dense: true }), { icon: 'database', count: last.detail.length }) : '';
      var hist = card(L('Riwayat restore test', 'Restore test history'), A.list(list, [
        { h: 'ID', cls: 'nw', v: function (x) { return mono(x.id); } },
        { h: L('Waktu', 'Time'), cls: 'nw', v: function (x) { return esc(dt(x.at)); } },
        { h: L('Sumber', 'Source'), v: function (x) { return recLink(x.src); } },
        { h: L('Durasi', 'Duration'), cls: 'r num', v: function (x) { return msS(x.dur); } },
        { h: L('Record', 'Records'), cls: 'r num', v: function (x) { return n0(x.records); } },
        { h: L('Validasi', 'Validation'), v: function (x) { return (x.countsOk ? A.chip('ok', L('Jumlah', 'Counts')) : A.chip('crit', L('Jumlah', 'Counts'))) + ' ' + (x.hashOk ? A.chip('ok', 'Hash') : A.chip('crit', 'Hash')); } },
        { h: L('Hasil', 'Result'), v: function (x) { return resChip(x.res); } },
        { h: L('Oleh', 'By'), v: function (x) { return emp(x.by); } }
      ], function (x) { return { t: esc(x.id) + ' · ' + esc(dt(x.at)), r: msS(x.dur), chip: resChip(x.res) }; }, null, { dense: true, empty: L('Belum ada restore test.', 'No restore tests yet.') }), { icon: 'history', count: list.length });
      var runBtn = !m && can('imp.rel.run') ? A.btn('primary', L('Jalankan Restore Test', 'Run Restore Test'), 'refresh', { act: 'restore' }) : '';
      var phone = m && can('imp.rel.run') ? note(t(L('Restore test hanya bisa dijalankan dari PC atau iPad (§113).', 'A restore test can only be run from a PC or iPad (§113).')), 'monitor', 'info') : '';
      var who = !can('imp.rel.run') ? note(t(L('Restore test dijalankan oleh System Admin / Super Admin (izin imp.rel.run). Anda melihat hasilnya.', 'Restore tests are run by System Admin / Super Admin (imp.rel.run). You see the results.')), 'lock', 'info') : '';
      return P.head(t(L('Backup tidak dianggap lengkap sampai restore diuji: restore test terakhir, hasil, durasi, validasi data (§42).', 'A backup is not complete until restore is tested: last restore test, result, duration, data validation (§42).')), runBtn + A.btn('ghost', L('Backup', 'Backup'), 'database', { go: 'RLB-004' }), fresh(L('JFIMP restore test · semua engine', 'JFIMP restore test · every engine'))) +
        deskNote(L('Layar ini dirancang untuk PC. Di ponsel hanya status restore yang ditampilkan; restore test tidak bisa dijalankan dari ponsel.', 'This screen is designed for PC. On a phone only the restore status is shown; restore tests cannot run from a phone.')) + phone + who + hero +
        '<div class="g21-10 qa12-gap"><div class="col10">' + noM(det) + noM(hist) + '</div><div class="col10">' + drCard(d) + '</div></div>';
    },
    act: relActs
  };
})();
