/* JFRESH OS — Phase 12 screens (writer W1): Build & Environment (IMP-001…003), One Data (DATA-001…003),
   Module build & integration (BUILD-001…004) and, inside BUILD-001, the Fase 12 Command Center (§109 / §116)
   for the Product Owner and the Implementation Lead.
   Desktop first (tables, steppers, gate lists); iPad for monitoring and approvals; phone shows status cards
   only and never the production deployment buttons (§6, §113). Every number is read live from the
   implementation engine (assets/js/jfos-imp.js, JFIMP) which reads the owner engines; the command center
   reads JFGO.command when Engine B is loaded and falls back to JFIMP.readiness(). Every write goes through
   the engine: permission, reason, maker-checker, gates and audit live there, never only here. */
(function () {
  var A = window.JFAPP, P = A && A.P10, H = A && A.P5, P8 = A && A.P8, I = window.JFIMP;
  if (!A || !P || !H || !P8 || !I) return;
  var V = A.V, T = A.T, L = A.L, t = A.t, esc = A.esc, ic = A.ic, can = A.can, href = A.href;
  var card = H.card, kv = H.kv, note = H.note, dlg = H.dlg, fld = H.fld, inp = H.inp, sel = H.sel, area = H.area, lnk = H.lnk, open = H.open;
  A.addParents(I.PARENTS || {});

  /* ================= Shared helpers ================= */
  function cx() { return A.ctx(); }
  function GO() { return window.JFGO || null; }
  function isM() { return A.mode() === 'm'; }
  function isT() { return A.mode() === 't'; }
  function dev() { return { device: isM() ? 'mobile' : isT() ? 'tablet' : 'desktop' }; }
  function tryf(fn, d) { try { var r = fn(); return r === undefined ? d : r; } catch (e) { return d; } }
  function me() { var c = cx() || {}; return { uid: c.uid, emp: c.employee && c.employee.id, role: c.roleKey }; }
  function mine(p) { var m = me(); return !!((p.byUid && p.byUid === m.uid) || (p.by && p.by === m.emp)); }
  function dt(s) { return s ? esc(H.dt(s)) : '—'; }
  function pc(v) { return v == null || isNaN(v) ? '—' : P.n0(v, v % 1 ? 1 : 0) + '%'; }
  function tn(v, g, w) { return v == null || isNaN(v) ? 'mute' : v >= g ? 'ok' : v >= w ? 'warn' : 'crit'; }
  function lab(v) { return v == null ? '—' : Array.isArray(v) ? t(v) : esc(String(v)); }
  function src(s) { return '<span class="im12-src">' + ic('database') + '<span>' + t(L('Sumber: ', 'Source: ')) + lab(s) + '</span></span>'; }
  function fresh(s) { return P.fresh({ kind: 'live', src: s, at: tryf(function () { return I.nowS(); }, null) }); }
  function chipOf(map, k, icon) { var x = map && map[k]; return x ? A.chip(x[1], x[0], icon) : A.chip('mute', L(String(k || '—'), String(k || '—'))); }
  function okChip(ok, y, n) { return ok ? A.chip('ok', y || L('Lulus', 'Passed'), 'checkc') : A.chip('crit', n || L('Belum lulus', 'Not passed'), 'xc'); }
  function mono(id) { return '<span class="mono6">' + esc(id) + '</span>'; }
  function roleN(r) { var C = I.C, x = C && C.ROLES && C.ROLES[r]; return x ? T(x.n) : r; }
  function rolesWith(perm) { var rp = I.ROLE_PERMS || {}; return Object.keys(rp).filter(function (r) { return (rp[r] || []).indexOf(perm) >= 0; }).map(roleN); }
  function deskOnly(msg) { return P.deskOnly(msg || L('Layar ini dirancang untuk PC/iPad. Di ponsel hanya status yang ditampilkan; tindakan produksi tidak tersedia.', 'This screen is designed for PC/iPad. On a phone only the status is shown; production actions are not available.')); }
  function qx(over) { var o = Object.assign({}, A.S.q, over || {}); delete o.state; Object.keys(o).forEach(function (k) { if (o[k] == null || o[k] === '') delete o[k]; }); return o; }

  // Readiness ring (SVG, own tones: ok / warn / crit / info).
  function ring(v, tone, o) {
    o = o || {}; var sz = o.size || 96, sw = o.sw || Math.max(7, Math.round(sz / 11)), r = (sz - sw) / 2, c = 2 * Math.PI * r, val = Math.max(0, Math.min(100, v || 0)), m = sz / 2;
    return '<span class="im12-ring im12-t-' + (tone || 'info') + '" style="--sz:' + sz + 'px" role="img" aria-label="' + esc((o.label ? T(o.label) + ': ' : '') + (v == null ? '—' : pc(v))) + '">' +
      '<svg viewBox="0 0 ' + sz + ' ' + sz + '" aria-hidden="true"><circle cx="' + m + '" cy="' + m + '" r="' + r + '" class="im12-rt" stroke-width="' + sw + '"/>' +
      (v == null ? '' : '<circle cx="' + m + '" cy="' + m + '" r="' + r + '" class="im12-rv" stroke-width="' + sw + '" stroke-dasharray="' + (c * val / 100).toFixed(1) + ' ' + c.toFixed(1) + '" transform="rotate(-90 ' + m + ' ' + m + ')"/>') + '</svg>' +
      '<b class="num">' + (v == null ? '—' : P.n0(v, v % 1 ? 1 : 0) + (o.u === '' ? '' : '<small>%</small>')) + '</b></span>';
  }
  function bar(v, tone) { var w = v == null ? 0 : Math.max(2, Math.min(100, v)); return '<span class="im12-bar" role="img" aria-label="' + esc(pc(v)) + '"><i class="im12-t-' + (tone || tn(v, 90, 70)) + '" style="width:' + w + '%"></i></span>'; }
  function pbar(v, g, w) { return '<span class="im12-pb">' + bar(v, tn(v, g || 90, w || 70)) + '<b class="num">' + pc(v) + '</b></span>'; }

  // Engine refusal → plain text, listing every failed gate in plain language.
  function emsg(r) {
    if (!r) return T(I.MSG.load);
    var m = T(r.msg || I.MSG.invalid), ex = [];
    if (r.failed && r.failed.length) {
      var list = r.gates && r.gates.list ? r.gates.list : [];
      r.failed.forEach(function (k) { var g = list.filter(function (x) { return x.k === k; })[0]; ex.push(g ? T(g.n) + (g.v ? ' (' + T(g.v) + ')' : '') : k); });
    }
    if (r.errors) Object.keys(r.errors).forEach(function (k) { ex.push(T(r.errors[k])); });
    return ex.length ? m + ' — ' + T(L('Belum terpenuhi: ', 'Not met: ')) + ex.join(' · ') : m;
  }
  function failT(r) { A.toast(emsg(r), 'crit'); return false; }
  // Reason dialog: fn(reason, values) → engine result. Errors stay in the dialog.
  function rdlg(o) {
    dlg({ title: o.title, icon: o.icon || 'check', sub: o.sub || '', ok: o.ok || L('Simpan', 'Save'),
      body: (o.body || '') + (o.noReason ? '' : fld(o.label || L('Alasan', 'Reason'), area('reason', '', o.ph || L('Tulis alasan singkat (tercatat di audit)', 'Write a short reason (recorded in the audit)')), { req: !o.optional, wide: true })),
      onOk: function (v, el) {
        v = P.vals(el); var r = o.fn(v.reason, v);
        if (!r || !r.ok) return emsg(r);
        P.after(typeof o.done === 'function' ? o.done(r) : (o.done || L('Tersimpan.', 'Saved.')));
        return true;
      } });
  }
  function navTabs(list, cur) { var items = list.filter(function (x) { return open(x[0]); }); return items.length > 1 ? H.tabs(items, cur, '_s', { hf: function (k) { return href(k); } }) : ''; }
  function impTabs(cur) { return navTabs([['IMP-001', L('Build & Environment', 'Build & Environment'), 'layers'], ['IMP-002', L('Detail Environment', 'Environment Detail'), 'database'], ['IMP-003', L('Release Pipeline', 'Release Pipeline'), 'route']], cur); }
  function dataTabs(cur) { return navTabs([['DATA-001', L('One Data', 'One Data'), 'database'], ['DATA-002', L('Kepemilikan', 'Ownership'), 'link'], ['DATA-003', L('Review Duplikat', 'Duplicate Review'), 'copy']], cur); }
  function buildTabs(cur) { return navTabs([['BUILD-001', L('Roadmap', 'Roadmap'), 'target'], ['BUILD-002', L('Progres Modul', 'Module Progress'), 'list'], ['BUILD-003', L('Peta Integrasi', 'Integration Map'), 'route'], ['BUILD-004', L('Blocker', 'Blockers'), 'alert']], cur); }
  function sumCards(items) {
    return '<div class="im12-sum">' + items.filter(Boolean).map(function (x) {
      var tag = x.go && open(x.go) ? 'a' : 'div';
      return '<' + tag + ' class="im12-sum-i im12-t-' + (x.tone || 'info') + '"' + (tag === 'a' ? ' href="' + href(x.go, x.rec, x.q) + '"' : '') + '><span class="im12-sum-ic">' + ic(x.icon || 'gauge') + '</span><span class="im12-sum-b"><span class="im12-sum-k">' + t(x.k) + '</span><b class="num' + (typeof x.v === 'string' && !/^[\d.,—%\s-]+$/.test(x.v) ? ' im12-sum-txt' : '') + '">' + x.v + '</b>' + (x.s ? '<small>' + x.s + '</small>' : '') + '</span></' + tag + '>';
    }).join('') + '</div>';
  }
  function gateList(g, o) {
    if (!g || !g.list) return A.empty(L('Tidak ada gate untuk langkah ini.', 'No gates for this step.'));
    o = o || {};
    return '<ul class="im12-gates">' + g.list.map(function (x) {
      return '<li class="' + (x.ok ? 'is-ok' : 'is-no') + '">' + ic(x.ok ? 'checkc' : 'xc') + '<span class="im12-g-t"><b>' + t(x.n) + '</b>' + (x.v ? '<small>' + lab(x.v) + '</small>' : '') + '</span>' + (o.chips === false ? '' : okChip(x.ok, L('Terpenuhi', 'Met'), L('Belum', 'Not yet'))) + '</li>';
    }).join('') + '</ul>';
  }

  /* ---------- Labels the engine does not carry ---------- */
  var DATA_CLS = { dummy: ['warn', L('Data dummy', 'Dummy data')], test: ['info', L('Data uji', 'Test data')], real: ['ok', L('Data nyata', 'Real data')] };
  function dataChip(k) { var x = DATA_CLS[k] || ['mute', L(k || '—', k || '—')]; return A.chip(x[0], x[1], 'database'); }
  var ENV_ST = { live: ['ok', L('Live', 'Live'), 'checkc'], validated: ['ok', L('Tervalidasi', 'Validated'), 'checkc'], superseded: ['mute', L('Digantikan', 'Superseded'), 'history'] };
  var ENV_IC = { DEV: 'cog', QA: 'flask', UAT: 'users', PRD: 'globe' };
  function envN(k) { return { DEV: L('Development', 'Development'), QA: L('QA / Testing', 'QA / Testing'), UAT: L('UAT', 'UAT'), PRD: L('Production', 'Production') }[k] || L(k, k); }
  var DUP_ST = { open: ['warn', L('Perlu review', 'Needs review'), 'eye'], not_duplicate: ['ok', L('Bukan duplikat', 'Not a duplicate'), 'checkc'], merge_requested: ['appr', L('Merge diminta · menunggu pemilik data', 'Merge requested · waiting for the data owner'), 'hourglass'], merge_approved: ['info', L('Merge disetujui pemilik', 'Merge approved by the owner'), 'checkc'] };
  var MATCH_N = { name: L('Nama', 'Name'), normalized: L('Nama dinormalisasi', 'Normalized name'), email: L('Email', 'Email'), phone: L('Telepon', 'Phone'), tax: L('NPWP', 'Tax ID'), address: L('Alamat', 'Address'), code: L('Kode', 'Code') };
  var DOM_IC = { client: 'building', property: 'hotel', contract: 'contract', rate: 'tag', order: 'clipboard', item: 'shirt', itemweight: 'scale', supplier: 'briefcase', inventory: 'package', employee: 'idcard', asset: 'washer', coa: 'list', user: 'users', payment: 'coins', contact: 'user' };
  var DOM_SCR = { client: ['CLIENT-002', 'CLIENT-001'], property: ['PROP-002', 'CLIENT-002'], order: ['ORDER-002', 'ORDER-001'], item: ['ITEM-002', 'ITEM-001'], supplier: ['PUR-007'], asset: ['AST-003', 'AST-001'], user: ['ADM-002', 'ADM-001'], inventory: ['INV-003', 'INV-001'], employee: ['ADM-001'], coa: ['ACC-002'], payment: ['AR-001'], contract: ['CONTRACT-001'], rate: ['RATE-001'] };
  function ownerScreen(k) { return (DOM_SCR[k] || []).filter(function (s) { return open(s); })[0] || null; }
  function recLink(k, id, label) { var s = (DOM_SCR[k] || [])[0]; return s && open(s) && /-002$|-003$|-007$/.test(s) ? lnk(s, id, label) : label; }

  /* ================= IMP-001 Build & Environment Center (NV-01) ================= */
  function envCard(e) {
    return '<a class="im12-env im12-t-' + e.tone + '" href="' + href('IMP-002', e.id) + '"><span class="im12-env-h"><span class="im12-env-ic">' + ic(ENV_IC[e.k] || 'layers') + '</span><b>' + t(e.n) + '</b>' + (e.live ? '<span class="im12-here">' + t(L('instans ini', 'this instance')) + '</span>' : '') + '</span>' +
      '<span class="im12-env-c">' + A.chip(e.tone, e.healthN, e.tone === 'ok' ? 'checkc' : e.tone === 'crit' ? 'xc' : e.tone === 'warn' ? 'alert' : 'clock') + dataChip(e.data) + '</span>' +
      '<span class="im12-env-v"><span>' + t(L('Versi', 'Version')) + '</span><b class="mono6">' + esc(e.version || '—') + '</b></span>' +
      '<span class="im12-env-m">' + t(L('Deploy terakhir ', 'Last deploy ')) + dt(e.lastDeploy) + ' · ' + esc(e.ownerN) + '</span>' +
      '<span class="im12-env-f">' + (e.pending.length ? A.chip('appr', L(e.pending.length + ' promosi tertunda', e.pending.length + ' pending promotion(s)'), 'hourglass') : '') + (e.blockers ? A.chip('warn', L(e.blockers + ' blocker/bug', e.blockers + ' blocker/bug'), 'alert') : '') + '</span></a>';
  }
  function pipeStepper(r, promos) {
    var flow = I.ENV_FLOW || ['DEV', 'QA', 'UAT', 'PRD'];
    return '<ol class="im12-pipe">' + flow.map(function (k, i) {
      var s = r.envs[k], x = ENV_ST[s], op = (promos || []).filter(function (p) { return p.rls === r.id && p.to === k && ['requested', 'approved', 'deployed'].indexOf(p.st) >= 0; })[0];
      var cls = x ? (s === 'superseded' ? 'is-past' : 'is-done') : op ? 'is-now' : r.next === k ? 'is-next' : '';
      var sub = x ? t(x[1]) : op ? t(op.stN) : r.next === k ? t(L('Berikutnya', 'Next')) : '—';
      return '<li class="im12-ps ' + cls + '"><span class="im12-ps-n">' + (x ? ic(s === 'superseded' ? 'history' : 'check') : ic(ENV_IC[k])) + '</span><span class="im12-ps-l"><b>' + t(envN(k)) + '</b><small>' + sub + '</small></span>' + (i < flow.length - 1 ? '<i class="im12-ps-a" aria-hidden="true"></i>' : '') + '</li>';
    }).join('') + '</ol>';
  }
  function techReady() {
    var c0 = cx(), g = GO(), rd = g && g.readiness ? tryf(function () { return g.readiness(c0); }, null) : null;
    if (rd && rd.score != null) return { v: rd.score, src: 'JFGO §94', rec: rd.rec, label: L('Kesiapan Go-Live', 'Go-Live Readiness'), go: 'LIVE-004' };
    var r = I.readiness(); return { v: Math.round((r.build + r.qa + r.security + r.integration) / 4), src: 'JFIMP.readiness()', rec: null, label: L('Kesiapan teknis', 'Technical readiness'), go: 'BUILD-001' };
  }
  V['IMP-001'] = {
    render: function () {
      var c0 = cx(), d = I.envDashboard(c0), cur = I.currentVersion(), rels = I.releases(c0), promos = I.promotions(c0), rd = techReady();
      var active = rels.filter(function (r) { return r.st === 'testing' || r.open.length; }).concat(rels.filter(function (r) { return r.st === 'live'; })).filter(function (r, i, a) { return a.indexOf(r) === i; }).slice(0, 3);
      var tiles = sumCards([
        { k: L('Build Completion', 'Build Completion'), v: pc(d.build), s: t(L('dari registry layar', 'from the screen registry')), icon: 'layers', tone: tn(d.build, 95, 80), go: 'BUILD-002' },
        { k: L('Development', 'Development'), v: t(d.dev.healthN), s: esc(d.dev.version || '—'), icon: 'cog', tone: d.dev.tone, go: 'IMP-002', rec: 'ENV-DEV' },
        { k: L('QA / Testing', 'QA / Testing'), v: t(d.qa.healthN), s: esc(d.qa.version || '—'), icon: 'flask', tone: d.qa.tone, go: 'IMP-002', rec: 'ENV-QA' },
        { k: L('UAT', 'UAT'), v: t(d.uat.healthN), s: esc(d.uat.version || '—'), icon: 'users', tone: d.uat.tone, go: 'IMP-002', rec: 'ENV-UAT' },
        { k: L('Production', 'Production'), v: t(d.prd.healthN), s: esc(d.prd.version || t(L('belum live', 'not live'))), icon: 'globe', tone: d.prd.tone, go: 'IMP-002', rec: 'ENV-PRD' },
        { k: L('Deployment Pending', 'Deployment Pending'), v: d.pending, s: t(L('promosi terbuka', 'open promotions')), icon: 'hourglass', tone: d.pending ? 'warn' : 'ok', go: 'IMP-003' },
        { k: L('Open Blockers', 'Open Blockers'), v: d.blockers, s: t(L('lintas wave', 'across waves')), icon: 'alert', tone: d.blockers ? 'crit' : 'ok', go: 'BUILD-004' }
      ]);
      var envs = '<div class="im12-envs">' + d.envs.map(envCard).join('') + '</div>';
      var pipe = card(L('Pipeline rilis', 'Release pipeline'), (active.length ? active.map(function (r) {
        return '<div class="im12-pl"><div class="im12-pl-h"><a class="lnk5" href="' + href('IMP-003', null, { rls: r.id }) + '"><b class="mono6">' + esc(r.v) + '</b></a>' + A.chip(r.tone, r.stN) + '<small>' + esc(r.id) + ' · ' + t(L('build ', 'build ')) + esc(r.build.no || '—') + '</small></div>' + pipeStepper(r, promos) + '</div>';
      }).join('') : A.empty(L('Belum ada rilis aktif.', 'No active release.'))) + note(t(L('Setiap promosi: Build → Tes → Persetujuan → Deployment → Validasi (§9). Production butuh semua gate §11.', 'Every promotion: Build → Tests → Approval → Deployment → Validation (§9). Production needs every §11 gate.')), 'route', 'info'),
        { icon: 'route', link: open('IMP-003') ? ['IMP-003', L('Buka pipeline', 'Open pipeline')] : null });
      var side = '<section class="card im12-ready"><div class="card-h"><h2>' + ic('gauge') + '<span>' + t(rd.label) + '</span></h2></div>' + ring(rd.v, tn(rd.v, 85, 70), { size: 120, label: rd.label }) +
        (rd.rec ? '<div class="im12-ready-r">' + A.chip(rd.rec === 'GO' ? 'ok' : rd.rec === 'CONDITIONAL GO' ? 'warn' : 'crit', L(rd.rec, rd.rec)) + '</div>' : '') + '<div class="im12-ready-s">' + src(rd.src) + '</div>' +
        '<dl class="im12-ver"><div><dt>' + t(L('Versi berjalan', 'Current version')) + '</dt><dd class="mono6">' + esc(cur.version || '—') + ' <small>' + esc(cur.env) + '</small></dd></div>' + (cur.planned ? '<div><dt>' + t(L('Rilis produksi awal', 'Initial production release')) + '</dt><dd class="mono6">' + esc(cur.planned) + '</dd></div>' : '') + '</dl>' +
        (open(rd.go) ? A.btn('ghost', rd.go === 'LIVE-004' ? L('Buka Go/No-Go', 'Open Go/No-Go') : L('Lihat roadmap', 'View roadmap'), 'arrow', { go: rd.go, cls: 'btn-sm' }) : '') + '</section>';
      var hist = card(L('Riwayat promosi & deployment', 'Promotion & deployment history'), P.table(promos, [
        { h: L('Promosi', 'Promotion'), v: function (p) { return mono(p.id); } }, { h: L('Rilis', 'Release'), v: function (p) { return lnk('IMP-003', null, '<b class="mono6">' + esc(p.v) + '</b>', { rls: p.rls }); } },
        { h: L('Tahap', 'Step'), v: function (p) { return esc(p.from) + ' → <b>' + esc(p.to) + '</b>'; } }, { h: L('Diajukan', 'Requested'), v: function (p) { return esc(p.byN) + '<small class="sub5">' + dt(p.at) + '</small>'; } },
        { h: L('Disetujui', 'Approved'), v: function (p) { return p.apprN ? esc(p.apprN) + '<small class="sub5">' + dt(p.apprAt) + '</small>' : '—'; } }, { h: L('Deploy', 'Deploy'), v: function (p) { return p.depN ? esc(p.depN) + '<small class="sub5">' + dt(p.depAt) + '</small>' : '—'; } },
        { h: L('Status', 'Status'), v: function (p) { return A.chip(p.tone, p.stN); } }
      ], function (p) { return { t: esc(p.v) + ' · ' + esc(p.from) + ' → ' + esc(p.to), r: '', s: mono(p.id) + ' · ' + esc(p.byN) + ' · ' + dt(p.at), chip: A.chip(p.tone, p.stN) }; }, function (p) { return href('IMP-003', null, { rls: p.rls }); }, { empty: L('Belum ada promosi.', 'No promotions yet.') }), { icon: 'history', count: promos.length });
      return P.head(t(L('Monitoring seluruh environment dan deployment pipeline', 'Monitoring every environment and the deployment pipeline')), open('IMP-003') ? A.btn('primary', L('Release Pipeline', 'Release Pipeline'), 'route', { go: 'IMP-003' }) : '', fresh(L('JFIMP + JFSYS.health', 'JFIMP + JFSYS.health'))) +
        impTabs('IMP-001') + tiles + envs + '<div class="im12-split">' + '<div class="im12-main">' + pipe + hist + '</div>' + side + '</div>' + deskOnly();
    }
  };

  /* ================= IMP-002 Environment Detail ================= */
  var HEALTH_SET = ['healthy', 'warning', 'critical', 'standby', 'down'];
  function envDlg(id) {
    var e = I.environment(cx(), id); if (!e) return;
    rdlg({ title: L('Ubah status environment · ' + T(e.n), 'Change environment status · ' + T(e.n)), icon: 'edit', ok: L('Simpan', 'Save'),
      sub: '<b>' + esc(e.id) + '</b> · ' + t(e.healthN) + '<br>' + t(e.live ? L('Instans ini: kesehatan dibaca live dari JFSYS.health dan tidak bisa diubah manual. Hanya catatan.', 'This instance: health is read live from JFSYS.health and cannot be set by hand. Note only.') : L('Perubahan tercatat di audit (sebelum/sesudah/alasan).', 'The change is audited (before/after/reason).')),
      body: (e.live ? '' : fld(L('Kesehatan', 'Health'), sel('health', HEALTH_SET.map(function (k) { return [k, I.HEALTH[k][0]]; }), e.health))) + fld(L('Catatan', 'Note'), inp('note', T(e.note || L('', ''))), { wide: true }),
      fn: function (reason, v) { var patch = {}; if (!e.live && v.health && v.health !== e.health) patch.health = v.health; if (v.note && v.note !== T(e.note || L('', ''))) patch.note = v.note; return I.setEnv(cx(), e.id, patch, reason); },
      done: L('Environment diperbarui.', 'Environment updated.') });
  }
  V['IMP-002'] = {
    title: function (rec) { var e = rec && I.environment(A.ctx(), rec); return e ? L('Environment · ' + T(e.n), 'Environment · ' + e.n[1]) : L('Detail Environment', 'Environment Detail'); },
    render: function (c) {
      var c0 = cx(), envs = I.environments(c0), e = I.environment(c0, c.rec || 'ENV-UAT');
      if (!e) return A.stateCard('empty', I.MSG.notfound, A.btn('blue', L('Kembali', 'Back'), 'arrowl', { go: 'IMP-001' }));
      var tabs = H.tabs(envs.map(function (x) { return [x.id, x.n, ENV_IC[x.k]]; }), e.id, '_e', { hf: function (k) { return href('IMP-002', k); }, seg: true });
      var hero = P8.hero({ icon: ENV_IC[e.k] || 'layers', id: e.id, title: t(e.n), sub: esc(e.url) + (e.live ? ' · ' + t(L('instans yang sedang Anda pakai', 'the instance you are using')) : ''),
        chips: A.chip(e.tone, e.healthN) + dataChip(e.data), facts: [[L('Versi', 'Version'), esc(e.version || '—'), 'mono6'], [L('Deploy terakhir', 'Last deploy'), dt(e.lastDeploy)], [L('Pemilik', 'Owner'), esc(e.ownerN)], [L('Promosi tertunda', 'Pending promotions'), String(e.pending.length)]] });
      var sep = card(L('Pemisahan environment (§7)', 'Environment separation (§7)'), '<ul class="im12-sep">' + [[L('Database', 'Database'), esc(e.db), 'database'], [L('Kredensial', 'Credentials'), esc(e.cred), 'key'], [L('Integrasi', 'Integrations'), t(e.integ), 'plug'], [L('Storage', 'Storage'), esc(e.storage), 'package'], [L('Logging', 'Logging'), esc(e.log), 'list'], [L('Konfigurasi', 'Configuration'), esc(e.config), 'cog']].map(function (x) {
        return '<li>' + ic(x[2]) + '<span><b>' + t(x[0]) + '</b><small class="mono6">' + x[1] + '</small></span>' + A.chip('ok', L('Terpisah', 'Separate'), 'checkc') + '</li>';
      }).join('') + '</ul>' + note(t(L('Identitas disamarkan; secret tidak pernah ditampilkan atau disimpan di layar ini.', 'Identifiers are masked; secrets are never shown or stored on this screen.')), 'lock', 'info'), { icon: 'shield' });
      var rl = card(L('Rilis di environment ini', 'Releases in this environment'), P.table(e.releases.slice().reverse(), [
        { h: L('Versi', 'Version'), v: function (r) { return lnk('IMP-003', null, '<b class="mono6">' + esc(r.v) + '</b>', { rls: r.id }); } }, { h: L('Rilis', 'Release'), v: function (r) { return mono(r.id); } },
        { h: L('Status di ' + e.k, 'Status in ' + e.k), v: function (r) { var x = ENV_ST[r.st]; return x ? A.chip(x[0], x[1], x[2]) : esc(r.st); } }
      ], function (r) { var x = ENV_ST[r.st]; return { t: esc(r.v), s: mono(r.id), chip: x ? A.chip(x[0], x[1]) : '' }; }, function (r) { return href('IMP-003', null, { rls: r.id }); }, { empty: L('Belum ada rilis di environment ini.', 'No release in this environment yet.') }), { icon: 'tag', count: e.releases.length });
      var pr = card(L('Promosi & deployment ke ' + e.k, 'Promotions & deployments to ' + e.k), P.table(e.promotions, [
        { h: L('Promosi', 'Promotion'), v: function (p) { return mono(p.id); } }, { h: L('Versi', 'Version'), v: function (p) { return '<b class="mono6">' + esc(p.v) + '</b>'; } },
        { h: L('Diajukan', 'Requested'), v: function (p) { return esc(p.byN) + '<small class="sub5">' + dt(p.at) + '</small>'; } }, { h: L('Disetujui', 'Approved'), v: function (p) { return p.apprN ? esc(p.apprN) : '—'; } },
        { h: L('Status', 'Status'), v: function (p) { return A.chip(p.tone, p.stN); } }
      ], function (p) { return { t: esc(p.v), s: mono(p.id) + ' · ' + esc(p.byN), chip: A.chip(p.tone, p.stN) }; }, function (p) { return href('IMP-003', null, { rls: p.rls }); }, { empty: L('Belum ada promosi ke environment ini.', 'No promotion to this environment yet.') }), { icon: 'route', count: e.promotions.length });
      var act = can('imp.env.manage') ? A.btn('ghost', e.live ? L('Ubah Catatan', 'Edit Note') : L('Ubah Status', 'Change Status'), 'edit', { act: 'env', val: e.id }) : '';
      return P.head(t(e.note || L('', '')), act, fresh(e.live ? L('JFSYS.health (instans ini)', 'JFSYS.health (this instance)') : L('JFIMP environment', 'JFIMP environment'))) + impTabs('IMP-002') + tabs + hero +
        '<div class="im12-g2">' + sep + '<div class="im12-main">' + rl + pr + '</div></div>' + deskOnly();
    },
    act: { env: function (el) { envDlg(el.getAttribute('data-val')); } }
  };

  /* ================= IMP-003 Release Pipeline ================= */
  var PROMO_STEPS = [['build', L('Build', 'Build')], ['tests', L('Tes', 'Tests')], ['approval', L('Persetujuan', 'Approval')], ['deploy', L('Deployment', 'Deployment')], ['valid', L('Validasi', 'Validation')]];
  function promoSteps(p) {
    var done = { requested: 2, approved: 3, deployed: 4, validated: 5, failed: 4, rejected: 2, rolledback: 4 }[p.st] || 0, bad = p.st === 'failed' ? 4 : p.st === 'rejected' ? 2 : -1;
    return '<ol class="im12-st5">' + PROMO_STEPS.map(function (s, i) { var cls = i === bad ? 'is-bad' : i < done ? 'is-done' : i === done ? 'is-now' : ''; return '<li class="' + cls + '"><span>' + ic(i === bad ? 'xc' : i < done ? 'check' : 'clock') + '</span><b>' + t(s[1]) + '</b></li>'; }).join('') + '</ol>';
  }
  function approvePerm(env) { return env === 'PRD' ? 'imp.release.approve.prod' : 'imp.release.approve'; }
  function promoCard(p) {
    var c0 = cx(), perm = approvePerm(p.to), prd = p.to === 'PRD', who = rolesWith(perm).join(' / '), acts = '', info = '';
    if (p.st === 'requested') {
      info = A.chip('appr', L('Menunggu persetujuan', 'Waiting for approval'), 'hourglass') + '<span>' + t(L('Yang boleh menyetujui: ', 'May approve: ')) + '<b>' + esc(who) + '</b> · ' + t(L('pembuat permintaan tidak boleh menyetujui sendiri', 'the requester cannot approve their own request')) + '</span>';
      if (can(perm)) {
        if (mine(p)) acts = note(t(L('Anda pembuat permintaan ini. Persetujuan harus oleh orang lain (maker-checker).', 'You made this request. Approval must come from someone else (maker-checker).')), 'usercheck', 'warn');
        else if (prd && isM()) acts = deskOnly(L('Persetujuan production hanya di PC/iPad.', 'Production approval only on PC/iPad.'));
        else acts = (prd ? P8.xl('primary', L('SETUJUI DEPLOY PRODUCTION', 'APPROVE PRODUCTION DEPLOYMENT'), 'checkc', { act: 'appr', val: p.id }) : A.btn('primary', L('Setujui', 'Approve'), 'checkc', { act: 'appr', val: p.id })) + A.btn('ghost', L('Tolak', 'Reject'), 'xc', { act: 'rej', val: p.id });
      }
    } else if (p.st === 'approved') {
      info = A.chip('info', L('Disetujui · menunggu deployment', 'Approved · waiting for deployment'), 'checkc') + '<span>' + t(L('Eksekusi teknis oleh: ', 'Technical execution by: ')) + '<b>' + esc(rolesWith('imp.deploy').join(' / ')) + '</b></span>';
      if (can('imp.deploy')) acts = prd && isM() ? deskOnly(L('Deploy ke production tidak tersedia di ponsel (§113).', 'Production deployment is not available on a phone (§113).')) : (prd ? P8.xl('danger', L('DEPLOY KE PRODUCTION', 'DEPLOY TO PRODUCTION'), 'upload', { act: 'dep', val: p.id }) : A.btn('primary', L('Deploy ke ' + p.to, 'Deploy to ' + p.to), 'upload', { act: 'dep', val: p.id }));
    } else if (p.st === 'deployed') {
      info = A.chip('warn', L('Ter-deploy · menunggu smoke test', 'Deployed · waiting for the smoke test'), 'hourglass') + '<span>' + t(L('Validasi oleh: ', 'Validated by: ')) + '<b>' + esc(rolesWith('imp.validate').join(' / ')) + '</b> · ' + t(L('gagal = rollback otomatis ke ', 'fail = automatic rollback to ')) + '<b class="mono6">' + esc(p.prevV || '—') + '</b></span>';
      if (can('imp.validate')) acts = A.btn('primary', L('Smoke Test Lulus', 'Smoke Test Passed'), 'checkc', { act: 'val', val: p.id + '|pass' }) + A.btn('danger', L('Smoke Test Gagal', 'Smoke Test Failed'), 'xc', { act: 'val', val: p.id + '|fail' });
    }
    return '<div class="im12-pr im12-pr-' + p.st + '"><div class="im12-pr-h"><b class="mono6">' + esc(p.id) + '</b><span>' + esc(p.v) + ' · ' + esc(p.from) + ' → <b>' + esc(p.to) + '</b></span>' + A.chip(p.tone, p.stN) + '</div>' + promoSteps(p) +
      '<p class="im12-pr-m">' + t(L('Diajukan oleh ', 'Requested by ')) + '<b>' + esc(p.byN) + '</b> · ' + dt(p.at) + (p.reason ? ' · “' + lab(p.reason) + '”' : '') + (p.apprN ? '<br>' + t(p.st === 'rejected' ? L('Ditolak oleh ', 'Rejected by ') : L('Disetujui oleh ', 'Approved by ')) + '<b>' + esc(p.apprN) + '</b> · ' + dt(p.apprAt) : '') + (p.depN ? '<br>' + t(L('Deploy oleh ', 'Deployed by ')) + '<b>' + esc(p.depN) + '</b> · ' + dt(p.depAt) : '') + (p.valAt ? '<br>' + t(L('Smoke test ', 'Smoke test ')) + '<b>' + esc(p.res || '') + '</b> · ' + dt(p.valAt) + (p.notes ? ' · ' + lab(p.notes) : '') : '') + '</p>' +
      (info ? '<div class="im12-pr-i">' + info + '</div>' : '') + (acts ? '<div class="im12-pr-a">' + acts + '</div>' : '') + '</div>';
  }
  function pickRelease(rels, q) {
    if (q.rls) { var x = rels.filter(function (r) { return r.id === q.rls || r.v === q.rls; })[0]; if (x) return x; }
    return rels.filter(function (r) { return r.open.length; })[0] || rels.filter(function (r) { return r.st === 'testing'; })[0] || rels.filter(function (r) { return r.next; })[0] || rels[rels.length - 1];
  }
  function reqDlg(rid) {
    var c0 = cx(), r = I.release(c0, rid); if (!r || !r.next) return;
    rdlg({ title: L('Ajukan promosi ke ' + r.next, 'Request promotion to ' + r.next), icon: 'route', ok: L('Ajukan', 'Request'),
      sub: '<b class="mono6">' + esc(r.v) + '</b> · ' + esc(r.id) + ' → <b>' + t(envN(r.next)) + '</b><br>' + t(L('Engine mengecek gate sebelum persetujuan. Setelah diajukan, ', 'The engine checks the pre-approval gates. Once requested, ')) + '<b>' + esc(rolesWith(approvePerm(r.next)).join(' / ')) + '</b> ' + t(L('yang menyetujui (bukan Anda).', 'approves it (not you).')),
      body: '<div class="im12-dlg-g">' + gateList(r.gates, { chips: false }) + '</div>',
      fn: function (reason) { return I.requestPromotion(cx(), r.id, r.next, reason); }, done: L('Promosi diajukan · menunggu persetujuan.', 'Promotion requested · waiting for approval.') });
  }
  function apprDlg(pid, ok) {
    var c0 = cx(), p = I.promotion(c0, pid); if (!p) return;
    var g = ok ? I.gates(c0, p.rls, p.to, { approver: c0 }) : null, prd = p.to === 'PRD';
    rdlg({ title: ok ? (prd ? L('Setujui deploy ke PRODUCTION', 'Approve the PRODUCTION deployment') : L('Setujui promosi ke ' + p.to, 'Approve the promotion to ' + p.to)) : L('Tolak promosi', 'Reject the promotion'), icon: ok ? 'checkc' : 'xc', ok: ok ? L('Setujui', 'Approve') : L('Tolak', 'Reject'),
      sub: '<b class="mono6">' + esc(p.v) + '</b> · ' + esc(p.id) + ' · ' + esc(p.from) + ' → <b>' + esc(p.to) + '</b><br>' + t(L('Pembuat: ', 'Maker: ')) + esc(p.byN) + ' · ' + dt(p.at) +
        (ok ? '<br><b>' + t(prd ? L('Yang akan terjadi: rilis ini boleh di-deploy ke Production oleh System Admin. Data nyata akan memakai versi ini.', 'What happens: System Admin may deploy this release to Production. Real data will run on this version.') : L('Yang akan terjadi: rilis ini boleh di-deploy ke ' + p.to + ' oleh System Admin.', 'What happens: System Admin may deploy this release to ' + p.to + '.')) + '</b>' : ''),
      body: ok ? '<div class="im12-dlg-g">' + gateList(g, { chips: false }) + '</div>' : '',
      fn: function (reason) { return ok ? I.approvePromotion(cx(), pid, reason) : I.rejectPromotion(cx(), pid, reason); }, done: ok ? L('Promosi disetujui · siap deployment.', 'Promotion approved · ready for deployment.') : L('Promosi ditolak.', 'Promotion rejected.') });
  }
  function depDlg(pid) {
    var c0 = cx(), p = I.promotion(c0, pid); if (!p) return; var prd = p.to === 'PRD';
    rdlg({ title: prd ? L('DEPLOY KE PRODUCTION', 'DEPLOY TO PRODUCTION') : L('Deploy ke ' + p.to, 'Deploy to ' + p.to), icon: 'upload', ok: prd ? L('Ya, deploy ke Production', 'Yes, deploy to Production') : L('Deploy', 'Deploy'),
      sub: '<b class="mono6">' + esc(p.v) + '</b> → <b>' + t(envN(p.to)) + '</b> · ' + t(L('disetujui oleh ', 'approved by ')) + esc(p.apprN || '—') + '<br><b>' + t(L('Yang akan terjadi: versi di ' + p.to + ' berganti ke ' + p.v + '. Setelah itu wajib smoke test; bila gagal, environment kembali otomatis ke versi sebelumnya.', 'What happens: the ' + p.to + ' version changes to ' + p.v + '. A smoke test is then required; if it fails, the environment returns automatically to the previous version.')) + '</b>',
      body: prd ? '<div class="im12-dlg-g">' + gateList(p.gates, { chips: false }) + '</div>' : '',
      fn: function (reason) { return I.deploy(cx(), pid, reason, dev()); }, done: L('Deployment tercatat · lakukan smoke test.', 'Deployment recorded · run the smoke test.') });
  }
  function valDlg(pid, res) {
    var p = I.promotion(cx(), pid); if (!p) return;
    rdlg({ title: res === 'pass' ? L('Smoke test lulus', 'Smoke test passed') : L('Smoke test gagal · rollback', 'Smoke test failed · rollback'), icon: res === 'pass' ? 'checkc' : 'xc', ok: res === 'pass' ? L('Tandai lulus', 'Mark passed') : L('Tandai gagal & rollback', 'Mark failed & roll back'),
      sub: '<b class="mono6">' + esc(p.v) + '</b> · ' + esc(p.to) + '<br>' + t(res === 'pass' ? L('Rilis menjadi live di ' + p.to + '; rilis lama ditandai digantikan.', 'The release becomes live in ' + p.to + '; the old release is marked superseded.') : L('Environment ' + p.to + ' kembali ke ' + (p.prevV || 'versi sebelumnya') + '.', 'Environment ' + p.to + ' returns to ' + (p.prevV || 'the previous version') + '.')),
      label: res === 'pass' ? L('Catatan (opsional)', 'Notes (optional)') : L('Apa yang gagal? (wajib)', 'What failed? (required)'), optional: res === 'pass',
      fn: function (notes) { return I.validate(cx(), pid, { result: res, notes: notes }); }, done: res === 'pass' ? L('Rilis tervalidasi.', 'Release validated.') : L('Smoke test gagal · environment di-rollback.', 'Smoke test failed · environment rolled back.') });
  }
  function buildDlg(rid) {
    var r = I.release(cx(), rid); if (!r) return;
    rdlg({ title: L('Catat build ' + r.v, 'Record build ' + r.v), icon: 'layers', ok: L('Catat Build', 'Record Build'), optional: true, label: L('Catatan (opsional)', 'Notes (optional)'),
      sub: esc(r.id) + ' · ' + t(L('Build yang berhasil langsung live di DEV; rilis DEV sebelumnya digantikan.', 'A successful build goes live in DEV; the previous DEV release is superseded.')),
      body: fld(L('Nomor build', 'Build number'), inp('no', '', { ph: L('mis. b701', 'e.g. b701') }), { req: true, hint: t(L('Format: b + 2–6 angka', 'Format: b + 2–6 digits')) }),
      fn: function (reason, v) { return I.recordBuild(cx(), r.id, { no: v.no }, reason); }, done: L('Build tercatat · DEV live.', 'Build recorded · DEV live.') });
  }
  function envDots(r) { return '<span class="im12-dots">' + (I.ENV_FLOW || ['DEV', 'QA', 'UAT', 'PRD']).map(function (k) { var s = r.envs[k]; return '<i class="im12-d-' + (s || 'none') + '" title="' + esc(k + ': ' + (s || '—')) + '">' + esc(k) + '</i>'; }).join('') + '</span>'; }
  V['IMP-003'] = {
    render: function (c) {
      var c0 = cx(), rels = I.releases(c0);
      if (!rels.length) return P.head('') + A.stateCard('empty', L('Belum ada rilis.', 'No releases yet.'));
      var r0 = pickRelease(rels, c.q), r = I.release(c0, r0.id), prom = r.promotions, openP = prom.filter(function (p) { return ['requested', 'approved', 'deployed'].indexOf(p.st) >= 0; });
      var rtabs = H.tabs(rels.slice().reverse().map(function (x) { return [x.id, L(x.v, x.v), x.st === 'live' ? 'checkc' : x.st === 'testing' ? 'flask' : x.st === 'planned' ? 'calendar' : 'history']; }), r.id, 'rls', { hf: function (k) { return href('IMP-003', null, qx({ rls: k })); } });
      var hero = P8.hero({ icon: 'tag', id: r.id, title: '<span class="mono6">' + esc(r.v) + '</span> · ' + esc(String(r.type).toUpperCase()), sub: t(r.notes), chips: A.chip(r.tone, r.stN) + (r.initial ? A.chip('info', L('Rilis produksi awal', 'Initial production release'), 'flag') : ''),
        facts: [[L('Tanggal', 'Date'), dt(r.date)], [L('Build', 'Build'), r.build.st === 'ok' ? '<span class="mono6">' + esc(r.build.no) + '</span> · ' + dt(r.build.at) : t(L('belum ada', 'not yet'))], [L('Langkah berikutnya', 'Next step'), r.next ? t(envN(r.next)) : '—'], [L('Test case', 'Test cases'), r.tests.total ? r.tests.pass + '/' + r.tests.total + ' · ' + pc(r.tests.rate) : '—']],
        extra: pipeStepper(r, prom) });
      var reqBtn = '', nextBody;
      if (r.build.st !== 'ok') nextBody = note(t(L('Build belum ada. Catat build yang berhasil untuk memulai pipeline (DEV).', 'No build yet. Record a successful build to start the pipeline (DEV).')), 'layers', 'info') + (can('imp.env.manage') ? A.btn('primary', L('Catat Build', 'Record Build'), 'layers', { act: 'build', val: r.id }) : '');
      else if (!r.next) nextBody = A.empty(r.envs.PRD === 'live' ? L('Rilis ini sudah live di Production.', 'This release is live in Production.') : L('Tidak ada langkah promosi berikutnya untuk rilis ini.', 'No further promotion step for this release.'));
      else {
        var hasOpen = openP.some(function (p) { return p.to === r.next; });
        reqBtn = !hasOpen && can('imp.release.request') && !(r.next === 'PRD' && isM()) ? A.btn('primary', L('Ajukan Promosi ke ' + r.next, 'Request Promotion to ' + r.next), 'route', { act: 'req', val: r.id }) : '';
        nextBody = '<p class="im12-lead">' + t(L('Gate promosi ', 'Promotion gates ')) + '<b>' + esc(r.v) + ' → ' + t(envN(r.next)) + '</b> ' + (r.gates && r.gates.ok ? A.chip('ok', L('semua terpenuhi', 'all met'), 'checkc') : A.chip('warn', L((r.gates ? r.gates.failed.length : 0) + ' belum terpenuhi', (r.gates ? r.gates.failed.length : 0) + ' not met yet'), 'alert')) + '</p>' + gateList(r.gates) +
          (hasOpen ? note(t(L('Permintaan promosi ke ' + r.next + ' sudah terbuka (lihat di bawah).', 'A promotion request to ' + r.next + ' is already open (see below).')), 'hourglass', 'info') : '') + (reqBtn ? '<div class="im12-act">' + reqBtn + '</div>' : '');
      }
      var nextCard = card(L('Promosi berikutnya', 'Next promotion'), nextBody, { icon: 'route' });
      var openCard = card(L('Permintaan promosi terbuka', 'Open promotion requests'), openP.length ? openP.map(promoCard).join('') : A.empty(L('Tidak ada permintaan promosi terbuka.', 'No open promotion request.')), { icon: 'hourglass', count: openP.length });
      var pg = I.gates(c0, r.id, 'PRD');
      var prdCard = card(L('Deployment safety · Production (§11)', 'Deployment safety · Production (§11)'), gateList(pg) + '<div class="im12-srcs">' + src('JFIMP gates') + src('JFGO uatGate / migrationGate') + src('JFSYS backups') + '</div>', { icon: 'shield', right: pg ? (pg.ok ? A.chip('ok', L('Siap', 'Ready'), 'checkc') : A.chip('crit', L(pg.failed.length + ' gate gagal', pg.failed.length + ' gates failing'), 'xc')) : '' });
      var info = card(L('Catatan rilis (§10)', 'Release notes (§10)'), kv([
        [L('Perubahan', 'Changes'), r.changes && r.changes.length ? '<ul class="im12-ul">' + r.changes.map(function (x) { return '<li>' + t(x) + '</li>'; }).join('') + '</ul>' : '—'],
        [L('Migrasi DB', 'DB migration'), lab(r.db)], [L('Known issues', 'Known issues'), r.known && r.known.length ? '<ul class="im12-ul">' + r.known.map(function (x) { return '<li>' + t(x) + '</li>'; }).join('') + '</ul>' : t(L('Tidak ada', 'None'))],
        [L('Rollback plan', 'Rollback plan'), (r.rollback && r.rollback.to ? '<b class="mono6">→ ' + esc(r.rollback.to) + '</b> · ' : '') + lab(r.rollback && r.rollback.plan)]
      ]) + (r.bugs.length ? '<h3 class="im12-h3">' + t(L('Bug pada versi ini', 'Bugs on this version')) + '</h3><div class="rls">' + r.bugs.map(function (b) { return A.rowLink({ href: open('QA-005') ? href('QA-005', b.id) : '#', icon: 'alert', tone: b.tone === 'crit' ? 'crit' : null, t: esc(b.id) + ' · ' + t(b.t), s: t(b.sevN), chip: A.chip(b.tone, b.stN) }); }).join('') + '</div>' : ''), { icon: 'file' });
      var hist = card(L('Riwayat promosi rilis ini', 'Promotion history of this release'), prom.filter(function (p) { return openP.indexOf(p) < 0; }).length ? prom.filter(function (p) { return openP.indexOf(p) < 0; }).map(promoCard).join('') : A.empty(L('Belum ada riwayat.', 'No history yet.')), { icon: 'history' });
      var all = card(L('Semua rilis (semantic versioning)', 'All releases (semantic versioning)'), P.table(rels.slice().reverse(), [
        { h: L('Versi', 'Version'), v: function (x) { return '<b class="mono6">' + esc(x.v) + '</b>'; } }, { h: L('Tipe', 'Type'), v: function (x) { return esc(x.type); } }, { h: L('Tanggal', 'Date'), v: function (x) { return dt(x.date); } },
        { h: L('Environment', 'Environments'), v: envDots }, { h: L('Status', 'Status'), v: function (x) { return A.chip(x.tone, x.stN); } }
      ], function (x) { return { t: esc(x.v) + ' · ' + esc(x.type), s: dt(x.date), chip: A.chip(x.tone, x.stN) }; }, function (x) { return href('IMP-003', null, qx({ rls: x.id })); }), { icon: 'tag', count: rels.length });
      return P.head(t(L('DEV → QA → UAT → PRODUCTION · setiap promosi: build, tes, persetujuan, deployment, validasi', 'DEV → QA → UAT → PRODUCTION · each promotion: build, tests, approval, deployment, validation')), reqBtn, fresh(L('JFIMP pipeline', 'JFIMP pipeline'))) +
        impTabs('IMP-003') + rtabs + hero + '<div class="im12-g2">' + '<div class="im12-main">' + nextCard + openCard + '</div><div class="im12-main">' + prdCard + info + '</div></div>' + hist + all;
    },
    act: {
      req: function (el) { reqDlg(el.getAttribute('data-val')); },
      appr: function (el) { apprDlg(el.getAttribute('data-val'), true); },
      rej: function (el) { apprDlg(el.getAttribute('data-val'), false); },
      dep: function (el) { depDlg(el.getAttribute('data-val')); },
      val: function (el) { var p = el.getAttribute('data-val').split('|'); valDlg(p[0], p[1]); },
      build: function (el) { buildDlg(el.getAttribute('data-val')); }
    }
  };

  /* ================= DATA-001 One Data Control Center (NV-02) ================= */
  // Migration staging facts from JFGO (read-only): rows whose reference does not resolve, and rows without a valid master mapping.
  function stagingFacts() {
    var g = GO(); if (!g) return { broken: null, mapping: null };
    var broken = typeof g.stagingOrphans === 'function' ? tryf(function () { return g.stagingOrphans().length; }, null) : null;
    var mapping = tryf(function () { var n = 0; (g.state().mig || []).forEach(function (b) { (b.rows || []).forEach(function (r) { if (!r.rej && (r.issues || []).some(function (i) { return ['notInNew', 'partial', 'unitDiff'].indexOf(i.k) >= 0; })) n++; }); }); return n; }, null);
    return { broken: broken, mapping: mapping };
  }
  function domTile(d, curK) {
    return '<a class="im12-dom im12-t-' + d.tone + (d.k === curK ? ' is-on' : '') + '" href="' + href('DATA-002', d.k) + '"><span class="im12-dom-ic">' + ic(DOM_IC[d.k] || 'database') + '</span><b>' + t(d.n) + '</b><span class="num">' + (d.count == null ? '—' : P.n0(d.count)) + '</span><small>' + (d.dups || d.orphans ? t(L(d.dups + ' dup · ' + d.orphans + ' orphan', d.dups + ' dup · ' + d.orphans + ' orphan')) : t(L('bersih', 'clean'))) + '</small></a>';
  }
  function hub(d) {
    return '<div class="im12-hub"><div class="im12-hub-c"><span class="im12-hub-ic">' + ic(DOM_IC[d.k] || 'database') + '</span><b>' + t(d.n) + ' MASTER</b><small class="mono6">' + esc(d.key) + '</small><small>' + src(d.src) + '</small></div>' +
      '<ul class="im12-hub-l">' + d.consumers.map(function (x) { return '<li>' + ic('link') + '<span>' + esc(x) + '</span></li>'; }).join('') + '</ul></div>';
  }
  V['DATA-001'] = {
    render: function (c) {
      var c0 = cx(), h = I.dataHealth(c0), ds = I.domains(c0), o = I.orphans(c0), sf = stagingFacts();
      var curK = c.q.d && ds.some(function (d) { return d.k === c.q.d; }) ? c.q.d : 'client', d = ds.filter(function (x) { return x.k === curK; })[0] || ds[0];
      var row = '<div class="im12-doms">' + ds.map(function (x) { return domTile(x, curK); }).join('') + '</div>';
      var own = '<section class="card im12-own"><div class="card-h"><h2>' + ic('link') + '<span>' + t(L('Kepemilikan data', 'Data ownership')) + '</span></h2>' + '<label class="im12-pick"><span class="sr">' + t(L('Domain', 'Domain')) + '</span><select data-f="d" aria-label="' + t(L('Domain', 'Domain')) + '">' + ds.map(function (x) { return '<option value="' + esc(x.k) + '"' + (x.k === curK ? ' selected' : '') + '>' + t(x.n) + '</option>'; }).join('') + '</select></label></div>' +
        '<div class="im12-own-b">' + hub(d) + kv([[L('Pemilik', 'Owner'), '<b>' + t(d.owner) + '</b>'], [L('Role pemilik (approval)', 'Owner roles (approval)'), esc(d.ownerRoles.map(roleN).join(', ') || '—')], [L('Sumber kebenaran', 'Source of truth'), esc(d.src) + ' · <span class="mono6">' + esc(d.key) + '</span>'], [L('Record live', 'Live records'), d.count == null ? '—' : P.n0(d.count)], [L('Kesehatan', 'Health'), pbar(d.health, 90, 70)]]) +
        '<div class="im12-act">' + A.btn('ghost', L('Detail kepemilikan', 'Ownership detail'), 'arrow', { go: 'DATA-002', rec: d.k, cls: 'btn-sm' }) + (ownerScreen(d.k) ? A.btn('ghost', L('Buka master di modul pemilik', 'Open the master in its owner module'), 'link', { go: ownerScreen(d.k), cls: 'btn-sm' }) : '') + '</div></div>' +
        note(t(L('Modul lain hanya mengonsumsi record yang sama; master diubah oleh pemiliknya (§3).', 'Other modules only consume the same record; the master is changed by its owner (§3).')), 'info', 'info') + '</section>';
      var health = sumCards([
        { k: L('Duplicate Client', 'Duplicate Client'), v: h.byType.dupClient, icon: 'building', tone: h.byType.dupClient ? 'warn' : 'ok', go: 'DATA-003', q: { domain: 'client' } },
        { k: L('Duplicate Property', 'Duplicate Property'), v: h.byType.dupProperty, icon: 'hotel', tone: h.byType.dupProperty ? 'warn' : 'ok', go: 'DATA-003', q: { domain: 'property' } },
        { k: L('Duplicate Item', 'Duplicate Item'), v: h.byType.dupItem, icon: 'shirt', tone: h.byType.dupItem ? 'warn' : 'ok', go: 'DATA-003', q: { domain: 'item' } },
        { k: L('Duplicate Supplier', 'Duplicate Supplier'), v: h.byType.dupSupplier, icon: 'briefcase', tone: h.byType.dupSupplier ? 'warn' : 'ok', go: 'DATA-003', q: { domain: 'supplier' } },
        { k: L('Orphan Record', 'Orphan Record'), v: o.total, s: t(L('12 cek data live', '12 live data checks')), icon: 'link', tone: o.total ? 'crit' : 'ok' },
        { k: L('Broken Reference', 'Broken Reference'), v: sf.broken == null ? '—' : sf.broken, s: t(L('baris migrasi (JFGO)', 'migration rows (JFGO)')), icon: 'alert', tone: sf.broken ? 'warn' : sf.broken == null ? 'info' : 'ok', go: 'MIG-002' },
        { k: L('Missing Owner', 'Missing Owner'), v: h.missingOwner, s: t(L('domain tanpa pemilik', 'domains without owner')), icon: 'usercheck', tone: h.missingOwner ? 'crit' : 'ok' },
        { k: L('Invalid Mapping', 'Invalid Mapping'), v: sf.mapping == null ? '—' : sf.mapping, s: t(L('baris migrasi belum ter-mapping', 'migration rows not mapped')), icon: 'swap', tone: sf.mapping ? 'warn' : sf.mapping == null ? 'info' : 'ok', go: 'MIG-002' },
        { k: L('Data Health', 'Data Health'), v: pc(h.score), s: t(L(h.domains + ' domain · ' + P.n0(h.records) + ' record', h.domains + ' domains · ' + P.n0(h.records) + ' records')), icon: 'gauge', tone: tn(h.score, 95, 80) }
      ]);
      var orph = card(L('Cek orphan record (§15)', 'Orphan record check (§15)'), '<ul class="im12-chk im12-chk2">' + o.checks.map(function (x) {
        return '<li class="' + (x.count ? 'is-no' : 'is-ok') + '">' + ic(x.count ? 'alert' : 'checkc') + '<span><b>' + t(x.n) + '</b><small>' + esc(x.src) + (x.ids.length ? ' · ' + x.ids.slice(0, 4).map(esc).join(', ') : '') + '</small></span><b class="num">' + x.count + '</b></li>';
      }).join('') + '</ul>' + (o.clean ? note(t(o.note || L('0 orphan.', '0 orphans.')), 'checkc', 'ok') : ''), { icon: 'link', count: o.total });
      var tbl = card(L('Domain data · pemilik · sumber · konsumen', 'Data domains · owner · source · consumers'), P.table(ds, [
        { h: L('Domain', 'Domain'), v: function (x) { return lnk('DATA-002', x.k, '<b>' + t(x.n) + '</b>'); } }, { h: L('Pemilik', 'Owner'), v: function (x) { return t(x.owner); } },
        { h: L('Sumber', 'Source'), v: function (x) { return esc(x.src) + '<small class="sub5 mono6">' + esc(x.key) + '</small>'; } }, { h: L('Konsumen', 'Consumers'), v: function (x) { return '<small>' + esc(x.consumers.join(', ')) + '</small>'; } },
        { h: L('Record', 'Records'), v: function (x) { return x.count == null ? '—' : P.n0(x.count); }, cls: 'r num' }, { h: L('Dup', 'Dup'), v: function (x) { return x.dups; }, cls: 'r num' }, { h: L('Orphan', 'Orphan'), v: function (x) { return x.orphans; }, cls: 'r num' },
        { h: L('Kesehatan', 'Health'), v: function (x) { return pbar(x.health, 90, 70); } }
      ], function (x) { return { t: t(x.n), r: x.count == null ? '—' : P.n0(x.count), s: t(x.owner) + ' · ' + esc(x.src), chip: A.chip(x.tone, L(x.health + '%', x.health + '%')) }; }, function (x) { return href('DATA-002', x.k); }), { icon: 'database', count: ds.length });
      return P.head(t(L('One Data · One Source · Many Views — tidak ada double entry', 'One Data · One Source · Many Views — no double entry')), open('DATA-003') ? A.btn('ghost', L('Review Duplikat', 'Duplicate Review'), 'copy', { go: 'DATA-003' }) : '', fresh(L('dihitung live dari engine pemilik', 'counted live from the owner engines'))) +
        dataTabs('DATA-001') + row + '<div class="im12-g2">' + own + '<div class="im12-main">' + health + '</div></div>' + tbl + orph + deskOnly();
    }
  };

  /* ================= DATA-002 Ownership Detail ================= */
  V['DATA-002'] = {
    title: function (rec) { var d = rec && I.domain(A.ctx(), rec); return d ? L('Kepemilikan · ' + T(d.n), 'Ownership · ' + d.n[1]) : L('Detail Kepemilikan', 'Ownership Detail'); },
    render: function (c) {
      var c0 = cx(), ds = I.domains(c0), d = I.domain(c0, c.rec || 'client');
      if (!d) return A.stateCard('empty', I.MSG.notfound, A.btn('blue', L('Kembali', 'Back'), 'arrowl', { go: 'DATA-001' }));
      var pick = '<label class="im12-pick im12-pick-w"><span>' + t(L('Domain', 'Domain')) + '</span><select id="im12-dom" aria-label="' + t(L('Domain', 'Domain')) + '">' + ds.map(function (x) { return '<option value="' + esc(x.k) + '"' + (x.k === d.k ? ' selected' : '') + '>' + t(x.n) + '</option>'; }).join('') + '</select></label>';
      var os = ownerScreen(d.k);
      var hero = P8.hero({ icon: DOM_IC[d.k] || 'database', id: d.key, title: t(d.n), sub: t(L('Pemilik: ', 'Owner: ')) + '<b>' + t(d.owner) + '</b> · ' + esc(d.src), chips: A.chip(d.tone, L('Kesehatan ' + d.health + '%', 'Health ' + d.health + '%'), 'gauge') + (d.missingOwner ? A.chip('crit', L('Tanpa pemilik', 'No owner'), 'alert') : A.chip('ok', L('Pemilik jelas', 'Clear owner'), 'usercheck')),
        facts: [[L('Record live', 'Live records'), d.count == null ? '—' : P.n0(d.count), 'num'], [L('Kandidat duplikat', 'Duplicate candidates'), String(d.dups), 'num'], [L('Orphan', 'Orphans'), String(d.orphans), 'num'], [L('Approver merge', 'Merge approver'), esc(d.ownerRoles.map(roleN).join(', ') + ' / ' + roleN('owner'))]],
        extra: os ? '<div class="im12-act">' + A.btn('ghost', L('Buka master di modul pemilik', 'Open the master in its owner module'), 'link', { go: os, cls: 'btn-sm' }) + '</div>' : '' });
      var cons = card(L('Sumber & konsumen', 'Source & consumers'), hub(d) + note(t(L('Satu identifier per entitas (' + d.key + '). Tidak ada ID per departemen (§4).', 'One identifier per entity (' + d.key + '). No per-department ids (§4).')), 'hash', 'info'), { icon: 'link' });
      var orph = card(L('Cek orphan domain ini', 'Orphan checks for this domain'), d.orphanChecks.length ? '<ul class="im12-chk">' + d.orphanChecks.map(function (x) { return '<li class="' + (x.count ? 'is-no' : 'is-ok') + '">' + ic(x.count ? 'alert' : 'checkc') + '<span><b>' + t(x.n) + '</b><small>' + esc(x.src) + (x.ids.length ? ' · ' + x.ids.slice(0, 6).map(esc).join(', ') : '') + '</small></span><b class="num">' + x.count + '</b></li>'; }).join('') + '</ul>' : A.empty(L('Tidak ada cek orphan khusus untuk domain ini.', 'No specific orphan check for this domain.')), { icon: 'alert' });
      var dup = card(L('Kandidat duplikat', 'Duplicate candidates'), d.duplicates.length ? '<div class="rls">' + d.duplicates.map(function (x) { var s = DUP_ST[x.st] || DUP_ST.open; return A.rowLink({ href: href('DATA-003', x.id), icon: 'copy', t: esc(x.a.n) + ' ↔ ' + esc(x.b.n), s: mono(x.id) + ' · ' + t(L('skor ', 'score ')) + x.score, chip: A.chip(s[0], s[1]) }); }).join('') + '</div>' : A.empty(L('Tidak ada kandidat duplikat.', 'No duplicate candidates.')), { icon: 'copy', count: d.duplicates.length });
      var sample = card(L('Contoh record (dibaca dari ' + d.src + ')', 'Sample records (read from ' + d.src + ')'), d.sample.length ? '<ul class="im12-sample">' + d.sample.map(function (x) { return '<li><span class="mono6">' + recLink(d.k, x.id, esc(x.id)) + '</span><span>' + esc(x.n) + '</span></li>'; }).join('') + '</ul>' + note(t(L('Hanya referensi — tidak ada salinan yang bisa diedit di sini.', 'Reference only — no editable copy here.')), 'eye', 'info') : A.empty(L('Belum ada record.', 'No records yet.')), { icon: 'list' });
      return P.head(t(L('Pemilik, sumber kebenaran dan konsumen satu domain data', 'Owner, source of truth and consumers of one data domain')), pick, fresh(L(d.src + ' (live)', d.src + ' (live)'))) + dataTabs('DATA-002') + hero + '<div class="im12-g2">' + cons + '<div class="im12-main">' + orph + dup + '</div></div>' + sample;
    },
    after: function () { var s = document.getElementById('im12-dom'); if (s) s.onchange = function () { A.go('DATA-002', s.value); }; }
  };

  /* ================= DATA-003 Duplicate Review ================= */
  function dupDlg(id, kind) {
    var c0 = cx(), x = I.duplicate(c0, id); if (!x) return;
    var K = { not_duplicate: [L('Tandai bukan duplikat', 'Mark as not a duplicate'), 'checkc', L('Kandidat ditutup; kedua record tetap seperti semula.', 'The candidate is closed; both records stay as they are.')],
      merge_requested: [L('Minta merge ke pemilik data', 'Request a merge from the data owner'), 'copy', L('Tidak ada yang digabung otomatis. Pemilik data (' + I.domainOwners(x.domain).map(roleN).join(', ') + ') atau Product Owner yang menyetujui.', 'Nothing is merged automatically. The data owner (' + I.domainOwners(x.domain).map(roleN).join(', ') + ') or the Product Owner approves.')],
      approve: [L('Setujui permintaan merge', 'Approve the merge request'), 'usercheck', L('Keputusan tercatat; perubahan master tetap dilakukan pemilik data di modulnya.', 'The decision is recorded; the master is still changed by its owner in its own module.')] }[kind];
    rdlg({ title: K[0], icon: K[1], ok: K[0], sub: '<b>' + esc(x.a.n) + '</b> <span class="mono6">' + esc(x.a.id) + '</span> ↔ <b>' + esc(x.b.n) + '</b> <span class="mono6">' + esc(x.b.id) + '</span><br>' + t(L('Skor ', 'Score ')) + x.score + ' · ' + x.matched.map(function (m) { return T(MATCH_N[m] || L(m, m)); }).join(', ') + '<br>' + t(K[2]),
      label: kind === 'approve' ? L('Alasan', 'Reason') : L('Catatan review', 'Review note'),
      fn: function (reason) { return kind === 'approve' ? I.approveMerge(cx(), id, reason) : I.reviewDuplicate(cx(), id, kind, reason); }, done: kind === 'not_duplicate' ? L('Ditandai bukan duplikat.', 'Marked as not a duplicate.') : kind === 'approve' ? L('Merge disetujui · pemilik data menindaklanjuti di modulnya.', 'Merge approved · the data owner follows up in its module.') : L('Permintaan merge dikirim ke pemilik data.', 'Merge request sent to the data owner.') });
  }
  function canApproveMerge(x) { var c0 = cx(); if (!c0 || x.st !== 'merge_requested' || !x.dec) return false; var ok = I.domainOwners(x.domain).indexOf(c0.roleKey) >= 0 || c0.roleKey === 'owner'; return ok && x.dec.byUid !== c0.uid && x.dec.by !== (c0.employee && c0.employee.id); }
  function dupActs(x) {
    var out = '';
    if ((x.st === 'open' || x.st === 'not_duplicate' || x.st === 'merge_requested') && can('imp.data.review') && x.st !== 'merge_approved') {
      if (x.st !== 'not_duplicate') out += A.btn('ghost', L('Bukan Duplikat', 'Not Duplicate'), 'checkc', { act: 'dnd', val: x.id, cls: 'btn-sm' });
      if (x.st !== 'merge_requested') out += A.btn('blue', L('Minta Merge', 'Request Merge'), 'copy', { act: 'dmr', val: x.id, cls: 'btn-sm' });
    }
    if (canApproveMerge(x)) out += A.btn('primary', L('Setujui Merge', 'Approve Merge'), 'usercheck', { act: 'dap', val: x.id, cls: 'btn-sm' });
    return out;
  }
  function dupDecision(x) {
    if (!x.dec) return '<small class="sub5">—</small>';
    return '<small>' + esc(I.empName(x.dec.by)) + ' · ' + dt(x.dec.at) + (x.dec.note ? ' · “' + lab(x.dec.note) + '”' : '') + (x.dec.approvals && x.dec.approvals.length ? '<br>' + t(L('Disetujui: ', 'Approved: ')) + x.dec.approvals.map(function (a) { return esc(I.empName(a.by)) + ' (' + esc(roleN(a.role)) + ')'; }).join(', ') : x.st === 'merge_requested' ? '<br>' + t(L('Menunggu: ', 'Waiting for: ')) + esc(I.domainOwners(x.domain).map(roleN).concat([roleN('owner')]).join(' / ')) : '') + '</small>';
  }
  V['DATA-003'] = {
    render: function (c) {
      var c0 = cx(), q = c.q, all = I.duplicates(c0), list = all.filter(function (x) { return (!q.domain || x.domain === q.domain) && (!q.st || x.st === q.st) && (!q.src || x.src === q.src); });
      var cur = c.rec ? all.filter(function (x) { return x.id === c.rec; })[0] : null;
      var fb = A.filters([{ k: 'domain', l: L('Domain', 'Domain'), opts: I.DUP_DOMAINS.map(function (d) { return [d[0], d[1]]; }) }, { k: 'st', l: L('Status', 'Status'), opts: Object.keys(DUP_ST).map(function (k) { return [k, DUP_ST[k][1]]; }) }, { k: 'src', l: L('Asal', 'Origin'), opts: [['live', L('Data live', 'Live data')], ['migration', L('Staging migrasi', 'Migration staging')]] }]);
      var tiles = sumCards([
        { k: L('Kandidat', 'Candidates'), v: all.length, icon: 'copy', tone: all.length ? 'info' : 'ok' }, { k: L('Perlu review', 'Needs review'), v: all.filter(function (x) { return x.st === 'open'; }).length, icon: 'eye', tone: all.some(function (x) { return x.st === 'open'; }) ? 'warn' : 'ok' },
        { k: L('Menunggu pemilik data', 'Waiting for data owner'), v: all.filter(function (x) { return x.st === 'merge_requested'; }).length, icon: 'hourglass', tone: all.some(function (x) { return x.st === 'merge_requested'; }) ? 'warn' : 'ok' },
        { k: L('Dari staging migrasi', 'From migration staging'), v: all.filter(function (x) { return x.src === 'migration'; }).length, icon: 'upload', tone: 'info' }
      ]);
      function side(x) { return '<span class="im12-dup-r">' + (x.a.staged ? A.chip('info', L('staging', 'staging')) : '') + '<b>' + esc(x.a.n) + '</b><small class="mono6">' + recLink(x.domain, x.a.id, esc(x.a.id)) + '</small></span>'; }
      function sideB(x) { return '<span class="im12-dup-r">' + (x.b.staged ? A.chip('info', L('staging', 'staging')) : '') + '<b>' + esc(x.b.n) + '</b><small class="mono6">' + recLink(x.domain, x.b.id, esc(x.b.id)) + '</small></span>'; }
      var rows = P.table(list, [
        { h: L('Kandidat', 'Candidate'), v: function (x) { return lnk('DATA-003', x.id, mono(x.id)) + '<small class="sub5">' + t((I.DUP_DOMAINS.filter(function (d) { return d[0] === x.domain; })[0] || [0, L(x.domain, x.domain)])[1]) + '</small>'; } },
        { h: L('Record A', 'Record A'), v: side }, { h: L('Record B', 'Record B'), v: sideB },
        { h: L('Skor', 'Score'), v: function (x) { return '<span class="im12-pb">' + bar(x.score, x.score >= 80 ? 'crit' : x.score >= 60 ? 'warn' : 'info') + '<b class="num">' + x.score + '</b></span>'; } },
        { h: L('Cocok pada', 'Matched on'), v: function (x) { return '<span class="im12-chips">' + x.matched.map(function (m) { return A.chip('info', MATCH_N[m] || L(m, m)); }).join('') + '</span>'; } },
        { h: L('Status', 'Status'), v: function (x) { var s = DUP_ST[x.st] || DUP_ST.open; return A.chip(s[0], s[1], s[2]) + dupDecision(x); } },
        { h: L('Tindakan', 'Actions'), v: function (x) { return '<span class="im12-acts">' + (dupActs(x) || '<small class="sub5">—</small>') + '</span>'; } }
      ], function (x) { var s = DUP_ST[x.st] || DUP_ST.open; return { t: esc(x.a.n) + ' ↔ ' + esc(x.b.n), r: String(x.score), s: mono(x.id) + ' · ' + x.matched.map(function (m) { return T(MATCH_N[m] || L(m, m)); }).join(', '), chip: A.chip(s[0], s[1]) }; }, null, { empty: L('Tidak ada kandidat duplikat.', 'No duplicate candidates.') });
      var det = cur ? card(L('Kandidat ' + cur.id, 'Candidate ' + cur.id), '<div class="im12-dup-d">' + side(cur) + '<span class="im12-vs">↔</span>' + sideB(cur) + '</div>' + kv([[L('Skor', 'Score'), String(cur.score)], [L('Cocok pada', 'Matched on'), cur.matched.map(function (m) { return T(MATCH_N[m] || L(m, m)); }).join(', ')], [L('Asal', 'Origin'), cur.src === 'migration' ? t(L('Staging migrasi (JFGO)', 'Migration staging (JFGO)')) : t(L('Data live', 'Live data'))], [L('Status', 'Status'), A.chip((DUP_ST[cur.st] || DUP_ST.open)[0], (DUP_ST[cur.st] || DUP_ST.open)[1])], [L('Keputusan', 'Decision'), dupDecision(cur)]]) + '<div class="im12-act">' + dupActs(cur) + '</div>', { icon: 'copy' }) : '';
      var body = all.length ? fb + rows : A.stateCard('empty', L('Tidak ada kandidat duplikat.', 'No duplicate candidates.'), null, L('Data master bersih', 'Master data is clean')) + note(t(L('Pemeriksaan dijalankan live atas data klien, properti, kontak, item, supplier, karyawan dan user. Kandidat dari migrasi muncul di sini setelah data lama di-staging oleh Data Migration Lead.', 'The check runs live on client, property, contact, item, supplier, employee and user data. Candidates from migration appear here once old data is staged by the Data Migration Lead.')), 'info', 'info');
      return P.head(t(L('Nama, email, telepon, NPWP, alamat, kode dan nama dinormalisasi — tanpa merge otomatis (§14)', 'Name, email, phone, tax ID, address, code and normalized name — never an automatic merge (§14)')), '', fresh(L('JFCOMM · JFFIN · JFACCESS · JFGO staging', 'JFCOMM · JFFIN · JFACCESS · JFGO staging'))) + dataTabs('DATA-003') + tiles + det + card(L('Kandidat duplikat', 'Duplicate candidates'), body, { icon: 'copy', count: list.length }) + deskOnly();
    },
    act: { dnd: function (el) { dupDlg(el.getAttribute('data-val'), 'not_duplicate'); }, dmr: function (el) { dupDlg(el.getAttribute('data-val'), 'merge_requested'); }, dap: function (el) { dupDlg(el.getAttribute('data-val'), 'approve'); } }
  };

  /* ================= BUILD-001 Implementation Roadmap · Fase 12 Command Center (NV-03, §109, §116) ================= */
  function isCmdRole() { var c0 = cx(); return !!c0 && (c0.roleKey === 'owner' || c0.roleKey === 'implead'); }
  // §118 flow → the readiness fact that tells whether the step is done; steps without one link to their owner screen.
  var FLOW_K = { 'BUILD': ['build', 'BUILD-002'], 'INTEGRATE': ['integration', 'BUILD-003'], 'TEST': ['qa', 'QA-001'], 'SECURITY VALIDATION': ['security', 'SVL-004'], 'MIGRATE': ['migration', 'MIG-001'], 'RECONCILE': ['recon', 'MIG-003'], 'UAT': ['uat', 'UAT-001'], 'TRAIN': ['training', 'HELP-007'],
    'SMART HELP READY': ['training', 'HELP-001'], 'PILOT': [null, 'CUT-001'], 'PARALLEL RUN': [null, 'CUT-001'], 'CLEAN DUMMY DATA': [null, 'CUT-002'], 'SNAPSHOT': [null, 'CUT-004'], 'CUT-OFF': [null, 'CUT-006'], 'GO / NO-GO': ['decision', 'LIVE-004'], 'START PRODUCTION': ['live', 'CUT-007'],
    'HYPERCARE': ['live', 'LIVE-002'], '30-DAY REVIEW': [null, 'OPT-001'], '60-DAY OPTIMIZATION': [null, 'OPT-001'], '90-DAY SCALE': [null, 'OPT-001'], 'CONTINUOUS IMPROVEMENT': [null, 'OPT-003'] };
  var GATE_GO = { criticalBug: 'QA-001', openingBalance: 'MIG-003', security: 'SVL-004', permission: 'SVL-001', restore: 'RLB-005', uat: 'UAT-001', training: 'HELP-007' };
  function flowStrip(steps, val) {
    return '<ol class="im12-flow21">' + steps.map(function (s, i) {
      var f = FLOW_K[s] || [null, null], v = f[0] ? val[f[0]] : undefined, st = v === undefined ? 'idle' : v === true || (typeof v === 'number' && v >= 95) ? 'done' : v === false || v == null || v === 0 ? 'todo' : 'part';
      var inner = '<span class="im12-f-n">' + (st === 'done' ? ic('check') : i + 1) + '</span><span class="im12-f-l">' + esc(s) + '</span>';
      return '<li class="im12-f-' + st + '">' + (f[1] && open(f[1]) ? '<a href="' + href(f[1]) + '">' + inner + '</a>' : '<span>' + inner + '</span>') + '</li>';
    }).join('') + '</ol>';
  }
  function cmdCenter(c0) {
    var g = GO(), cmd = g && typeof g.command === 'function' ? tryf(function () { return g.command(c0); }, null) : null, ir = I.readiness();
    if (!cmd) {
      // Fallback: JFIMP technical readiness only (JFGO not loaded or not permitted).
      var dims = [['build', L('Build Completion', 'Build Completion'), 'BUILD-002'], ['qa', L('QA Pass Rate', 'QA Pass Rate'), 'QA-001'], ['security', L('Security Status', 'Security Status'), 'SVL-004'], ['integration', L('Integrasi', 'Integration'), 'BUILD-003'], ['regression', L('Regression Pass', 'Regression Pass'), 'QA-001']];
      return card(L('Fase 12 Command Center', 'Phase 12 Command Center'), note(t(L('Modul Go-Live (JFGO) belum termuat: migrasi, UAT, training dan Go/No-Go belum bisa dihitung. Ditampilkan kesiapan teknis dari JFIMP.', 'The Go-Live module (JFGO) is not loaded: migration, UAT, training and Go/No-Go cannot be computed yet. Showing technical readiness from JFIMP.')), 'alert', 'warn') +
        '<div class="im12-kpis">' + dims.map(function (d) { var v = ir[d[0]]; return kpiTile({ k: d[0], n: d[1], v: v, u: '%', st: tn(v, 95, 80), s: d[2], src: 'JFIMP' }); }).join('') + '</div>' +
        '<ul class="im12-gates">' + [[L('Bug kritis terbuka', 'Open critical bugs'), ir.criticalBugs], [L('Kegagalan keamanan', 'Security failures'), ir.securityFailures], [L('Kegagalan izin', 'Permission failures'), ir.permissionFailures]].map(function (x) { var ok = !x[1].length; return '<li class="' + (ok ? 'is-ok' : 'is-no') + '">' + ic(ok ? 'checkc' : 'xc') + '<span class="im12-g-t"><b>' + t(x[0]) + '</b><small>' + (ok ? '0' : esc(x[1].join(', '))) + '</small></span></li>'; }).join('') +
        '<li class="' + (ir.restoreTested ? 'is-ok' : 'is-no') + '">' + ic(ir.restoreTested ? 'checkc' : 'xc') + '<span class="im12-g-t"><b>' + t(L('Restore test', 'Restore test')) + '</b><small>' + (ir.facts.restore ? esc(ir.facts.restore.id + ' · ' + ir.facts.restore.at) : '—') + '</small></span></li></ul>', { icon: 'gauge', cls: 'im12-cmd' });
    }
    var h = cmd.hero || {}, rd = cmd.readiness || {}, K = {}; (cmd.kpis || []).forEach(function (k) { K[k.k] = k.v; });
    var gates = cmd.gates || [], failed = gates.filter(function (x) { return !x.ok; });
    var recT = rd.rec === 'GO' ? 'ok' : rd.rec === 'CONDITIONAL GO' ? 'warn' : 'crit';
    var heroH = '<section class="card im12-chero"><div class="im12-chero-b"><span class="im12-brand">' + esc(h.brand || 'JFRESH OS') + '</span>' + A.chip(h.st === 'LIVE' ? 'ok' : 'info', h.stN || L(h.st || '—', h.st || '—'), h.st === 'LIVE' ? 'checkc' : 'clock') +
      '<span class="im12-chero-f"><span>' + t(L('Versi', 'Version')) + ' <b class="mono6">' + esc(h.version || '—') + '</b></span><span>' + t(h.st === 'LIVE' ? L('Production start ', 'Production start ') : L('Rencana production start ', 'Planned production start ')) + '<b>' + dt(h.start || h.planned) + '</b></span>' +
      '<span>' + t(L('Kesehatan sistem ', 'System health ')) + (h.healthN ? A.chip(h.health === 'healthy' ? 'ok' : h.health === 'critical' ? 'crit' : 'warn', h.healthN) : '—') + '</span>' +
      '<span>' + t(L('Keputusan terakhir ', 'Last decision ')) + (h.decision ? '<b>' + esc(h.decision.decision) + '</b> · ' + esc(h.decision.byName || '') + ' · ' + dt(h.decision.at) : '<b>' + t(L('belum ada', 'none yet')) + '</b>') + '</span></span></div></section>';
    var ready = '<section class="card im12-cready"><div class="card-h"><h2>' + ic('gauge') + '<span>' + t(L('Go-Live Readiness', 'Go-Live Readiness')) + '</span></h2>' + src('JFGO §94') + '</div><div class="im12-cready-b">' + ring(rd.score, recT, { size: 132, label: L('Go-Live Readiness', 'Go-Live Readiness') }) +
      '<div class="im12-cready-t"><span>' + t(L('Rekomendasi sistem', 'System recommendation')) + '</span>' + A.chip(recT, L(rd.rec || '—', rd.rec || '—'), recT === 'ok' ? 'checkc' : recT === 'warn' ? 'alert' : 'xc') + '<small>' + t(L('Keputusan akhir tetap oleh Product Owner (§96).', 'The final decision stays with the Product Owner (§96).')) + '</small>' + (open('LIVE-004') ? A.btn('ghost', L('Buka Go / No-Go', 'Open Go / No-Go'), 'arrow', { go: 'LIVE-004', cls: 'btn-sm' }) : '') + '</div></div></section>';
    var todo = card(L('Yang harus selesai sebelum Go-Live', 'What must be done before Go-Live'), failed.length ? '<ul class="im12-todo">' + failed.map(function (x) {
      var go = GATE_GO[x.k], v = Array.isArray(x.v) && typeof x.v[0] === 'string' && x.v.length === 2 && !/^[A-Z]{2,}-/.test(x.v[0]) ? t(x.v) : Array.isArray(x.v) ? esc(x.v.join(', ')) : esc(String(x.v));
      return '<li>' + ic('xc') + '<span><b>' + t(x.n) + '</b><small>' + v + ' · ' + esc(x.src || '') + '</small></span>' + (go && open(go) ? A.btn('ghost', L('Tindak lanjuti', 'Follow up'), 'arrow', { go: go, cls: 'btn-sm' }) : '') + '</li>';
    }).join('') + '</ul>' : A.empty(L('Semua hard gate Go-Live terpenuhi.', 'Every Go-Live hard gate is met.')), { icon: 'flag', count: failed.length });
    var kp = card(L('Implementation KPI (§116)', 'Implementation KPIs (§116)'), '<div class="im12-kpis">' + (cmd.kpis || []).map(kpiTile).join('') + '</div>', { icon: 'chart' });
    var val = { build: K.build, integration: ir.integration, qa: K.qa, security: K.security, migration: K.migration, recon: !failed.some(function (x) { return x.k === 'openingBalance'; }), uat: K.uat, training: K.training, decision: h.decision ? true : false, live: h.st === 'LIVE' };
    var flow = card(L('Alur Fase 12 (§118)', 'Phase 12 flow (§118)'), flowStrip(cmd.flow || [], val) + '<p class="im12-legend"><span class="im12-f-done"><i></i>' + t(L('Selesai', 'Done')) + '</span><span class="im12-f-part"><i></i>' + t(L('Berjalan', 'In progress')) + '</span><span class="im12-f-todo"><i></i>' + t(L('Belum', 'Not yet')) + '</span><span class="im12-f-idle"><i></i>' + t(L('Lihat layar', 'See screen')) + '</span></p>', { icon: 'route' });
    return heroH + '<div class="im12-cgrid">' + ready + todo + '</div>' + kp + flow;
  }
  function kpiTile(k) {
    var v = k.v, isNum = typeof v === 'number', go = k.s && open(k.s), tag = go ? 'a' : 'div', tone = { ok: 'ok', warn: 'warn', crit: 'crit', info: 'info' }[k.st] || 'info';
    return '<' + tag + ' class="im12-kpi im12-t-' + tone + '"' + (go ? ' href="' + href(k.s) + '"' : '') + '><span class="im12-kpi-k">' + t(k.n) + '</span><b class="num">' + (v == null ? '—' : isNum ? P.n0(v, v % 1 ? 1 : 0) + (k.u ? '<small>' + esc(k.u) + '</small>' : '') : lab(v)) + '</b>' +
      (isNum && k.u === '%' ? bar(v, tone) : '') + '<span class="im12-kpi-s">' + (v == null ? t(L('belum ada data', 'no data yet')) + ' · ' : '') + esc(k.src || '') + '</span></' + tag + '>';
  }
  function waveRing(m) {
    var tone = m.blocker ? (m.blocker.sev === 'critical' ? 'crit' : 'warn') : tn(m.build, 95, 80);
    return '<a class="im12-wave" href="' + href('BUILD-002', null, { w: m.k }) + '"><small>' + t(L('Wave ' + m.wave, 'Wave ' + m.wave)) + '</small>' + ring(m.build, tone, { size: 64, label: m.n }) + '<b>' + t(m.n) + '</b>' + (m.blocker ? A.chip(tone, L(m.blockers.length + ' blocker', m.blockers.length + ' blocker'), 'alert') : '<span class="im12-wave-r mono6">' + esc(m.release) + '</span>') + '</a>';
  }
  function mapStrip(mp, compact) {
    return '<ol class="im12-map' + (compact ? ' im12-map-c' : '') + '">' + mp.nodes.map(function (n, i) {
      var l = mp.links[i];
      return '<li class="im12-mn"><span class="im12-mn-d">' + ic({ client: 'building', order: 'clipboard', pickup: 'truck', production: 'factory', delivery: 'package', billing: 'invoice', finance: 'coins', kpi: 'chart' }[n.k] || 'link') + '</span><b>' + t(n.n) + '</b></li>' +
        (l ? '<li class="im12-ml im12-t-' + l.tone + '" title="' + esc(T(l.evidence || L('', ''))) + '"><i></i><span>' + t(l.stN) + '</span></li>' : '');
    }).join('') + '</ol>';
  }
  function roadmap(c0) {
    var mods = I.modules(c0), mp = I.integrationMap(c0), blk = I.blockers(c0, { st: 'open' }), cur = I.currentVersion(), ir = I.readiness();
    var sev = ['critical', 'high', 'medium', 'low']; blk.sort(function (a, b) { return sev.indexOf(a.sev) - sev.indexOf(b.sev); });
    var waves = card(L('Implementation Roadmap · 8 wave', 'Implementation Roadmap · 8 waves'), '<div class="im12-waves">' + mods.map(waveRing).join('') + '</div><div class="im12-srcs">' + src(L('Build % = renderer layar ÷ layar terdaftar', 'Build % = screen renderers ÷ registered screens')) + '</div>', { icon: 'target', link: open('BUILD-002') ? ['BUILD-002', L('Progres modul', 'Module progress')] : null });
    var map = card(L('End-to-End Integration Map', 'End-to-End Integration Map'), mapStrip(mp, true) + '<p class="im12-lead">' + t(L(mp.connected + ' dari ' + mp.total + ' koneksi terhubung', mp.connected + ' of ' + mp.total + ' connections connected')) + ' · ' + pc(mp.pct) + '</p>', { icon: 'route', link: open('BUILD-003') ? ['BUILD-003', L('Detail peta', 'Map detail')] : null });
    var top = card(L('Top blocker', 'Top blockers'), blk.length ? '<div class="rls">' + blk.slice(0, 5).map(function (b) { return A.rowLink({ href: href('BUILD-004', b.id), icon: 'alert', tone: b.tone === 'crit' ? 'crit' : b.tone === 'warn' ? 'warn' : null, t: esc(b.id) + ' · ' + t(b.t), s: t(b.waveN || L(b.wave, b.wave)) + ' · ' + esc(b.ownerN) + ' · ' + t(L('jatuh tempo ', 'due ')) + dt(b.due) + (b.overdue ? ' · ' + t(L('terlambat', 'overdue')) : ''), chip: A.chip(b.tone, b.sevN) }); }).join('') + '</div>' : A.empty(L('Tidak ada blocker terbuka.', 'No open blocker.')), { icon: 'alert', count: blk.length, link: open('BUILD-004') ? ['BUILD-004', L('Semua blocker', 'All blockers')] : null });
    var status = card(L('Status modul', 'Module status'), P.table(mods, [
      { h: L('Wave', 'Wave'), v: function (m) { return '<b>' + t(m.n) + '</b><small class="sub5">' + esc(m.k) + ' · ' + t(L('Fase ', 'Phase ')) + esc(m.phases.join(', ')) + '</small>'; } }, { h: L('Build', 'Build'), v: function (m) { return pbar(m.build, 95, 80); } }, { h: L('QA', 'QA'), v: function (m) { return pbar(m.qa, 95, 80); } },
      { h: L('Integrasi', 'Integration'), v: function (m) { return pbar(m.integ, 90, 75); } }, { h: L('UAT', 'UAT'), v: function (m) { return pbar(m.uat, 90, 75); } }, { h: L('Pemilik', 'Owner'), v: function (m) { return esc(m.ownerN); } }
    ], function (m) { return { t: t(m.n), r: pc(m.build), s: 'QA ' + pc(m.qa) + ' · UAT ' + pc(m.uat) + ' · ' + esc(m.ownerN), chip: m.blocker ? A.chip(m.blocker.sev === 'critical' ? 'crit' : 'warn', L('Blocker', 'Blocker')) : '' }; }, function (m) { return href('BUILD-002', null, { w: m.k }); }), { icon: 'list' });
    var techT = [['build', L('Build', 'Build')], ['qa', L('QA', 'QA')], ['security', L('Security', 'Security')], ['integration', L('Integrasi', 'Integration')]];
    var tech = card(L('Kesiapan teknis', 'Technical readiness'), '<div class="im12-tech">' + techT.map(function (x) { return '<div>' + ring(ir[x[0]], tn(ir[x[0]], 95, 80), { size: 72, label: x[1] }) + '<b>' + t(x[1]) + '</b><small>' + lab(ir.evidence[x[0]]) + '</small></div>'; }).join('') + '</div>' +
      kv([[L('Versi berjalan', 'Current version'), '<span class="mono6">' + esc(cur.version || '—') + '</span> · ' + esc(cur.env)], [L('Rilis produksi awal', 'Initial production release'), '<span class="mono6">' + esc(cur.planned || '—') + '</span>']]) + '<div class="im12-srcs">' + src('JFIMP.readiness()') + '</div>', { icon: 'gauge' });
    return '<div class="im12-g2">' + waves + tech + '</div>' + '<div class="im12-g2">' + map + top + '</div>' + status;
  }
  V['BUILD-001'] = {
    title: function () { return isCmdRole() ? L('Fase 12 Command Center', 'Phase 12 Command Center') : L('Roadmap Implementasi', 'Implementation Roadmap'); },
    render: function () {
      var c0 = cx(), cmd = isCmdRole();
      return P.head(t(cmd ? L('Build → test → migrate → train → go live → improve · satu layar untuk manajemen', 'Build → test → migrate → train → go live → improve · one screen for management') : L('Progres modul dan integrasi end-to-end', 'Module progress and end-to-end integration')), '', fresh(cmd ? L('JFGO.command + JFIMP', 'JFGO.command + JFIMP') : L('JFIMP', 'JFIMP'))) +
        buildTabs('BUILD-001') + (cmd ? cmdCenter(c0) + '<h2 class="im12-sec">' + ic('target') + t(L('Implementation Roadmap', 'Implementation Roadmap')) + '</h2>' : '') + roadmap(c0);
    }
  };

  /* ================= BUILD-002 Module Progress ================= */
  V['BUILD-002'] = {
    render: function (c) {
      var c0 = cx(), mods = I.modules(c0), w = c.q.w && mods.some(function (m) { return m.k === c.q.w; }) ? c.q.w : null, m = w ? I.module(c0, w) : null;
      var avg = function (k) { var l = mods.filter(function (x) { return x[k] != null; }); return l.length ? Math.round(l.reduce(function (s, x) { return s + x[k]; }, 0) / l.length) : null; };
      var tiles = sumCards([{ k: L('Build %', 'Build %'), v: pc(avg('build')), icon: 'layers', tone: tn(avg('build'), 95, 80) }, { k: L('QA %', 'QA %'), v: pc(avg('qa')), icon: 'flask', tone: tn(avg('qa'), 95, 80), go: 'QA-001' }, { k: L('Integrasi %', 'Integration %'), v: pc(avg('integ')), icon: 'plug', tone: tn(avg('integ'), 90, 75), go: 'BUILD-003' }, { k: L('UAT %', 'UAT %'), v: pc(avg('uat')), icon: 'users', tone: tn(avg('uat'), 90, 75), go: 'UAT-001' },
        { k: L('Blocker terbuka', 'Open blockers'), v: mods.reduce(function (s, x) { return s + x.blockers.length; }, 0), icon: 'alert', tone: mods.some(function (x) { return x.blockers.length; }) ? 'crit' : 'ok', go: 'BUILD-004' }]);
      var tbl = card(L('Status build per modul (§17)', 'Build status per module (§17)'), P.table(mods, [
        { h: L('Wave / modul', 'Wave / module'), v: function (x) { return '<b>' + t(x.n) + '</b><small class="sub5">' + esc(x.k) + ' · ' + t(L('Fase ', 'Phase ')) + esc(x.phases.join(', ')) + ' · ' + (x.screens.live == null ? x.screens.specs : x.screens.live + '/' + x.screens.specs) + ' ' + t(L('layar', 'screens')) + '</small>'; } },
        { h: L('Build %', 'Build %'), v: function (x) { return pbar(x.build, 95, 80); } }, { h: L('QA %', 'QA %'), v: function (x) { return pbar(x.qa, 95, 80); } }, { h: L('Integrasi %', 'Integration %'), v: function (x) { return pbar(x.integ, 90, 75); } },
        { h: L('UAT %', 'UAT %'), v: function (x) { return pbar(x.uat, 90, 75) + '<small class="sub5">' + (x.uatSrc === 'JFGO' ? 'JFGO UAT' : t(L('estimasi awal', 'initial estimate'))) + '</small>'; } },
        { h: L('Pemilik', 'Owner'), v: function (x) { return esc(x.ownerN); } }, { h: L('Blocker', 'Blocker'), v: function (x) { return x.blocker ? lnk('BUILD-004', x.blocker.id, A.chip(x.blocker.sev === 'critical' ? 'crit' : 'warn', L(x.blocker.id, x.blocker.id), 'alert')) : '<small class="sub5">—</small>'; } },
        { h: L('Rilis', 'Release'), v: function (x) { return '<span class="mono6">' + esc(x.release) + '</span>'; } }
      ], function (x) { return { t: t(x.n), r: pc(x.build), s: 'QA ' + pc(x.qa) + ' · INT ' + pc(x.integ) + ' · UAT ' + pc(x.uat), chip: x.blocker ? A.chip('warn', L(x.blocker.id, x.blocker.id)) : A.chip('ok', L('Tanpa blocker', 'No blocker')) }; }, function (x) { return href('BUILD-002', null, qx({ w: x.k })); }), { icon: 'list', count: mods.length });
      var det = '';
      if (m) {
        var tc = m.tests || [];
        det = '<section class="card im12-wdet"><div class="card-h"><h2>' + ic('target') + '<span>' + t(L('Wave ' + m.wave + ' · ', 'Wave ' + m.wave + ' · ')) + t(m.n) + '</span></h2><a class="card-l" href="' + href('BUILD-002') + '">' + t(L('Tutup', 'Close')) + ic('x') + '</a></div>' +
          '<div class="im12-tech">' + [['build', L('Build', 'Build')], ['qa', L('QA', 'QA')], ['integ', L('Integrasi', 'Integration')], ['uat', L('UAT', 'UAT')]].map(function (x) { return '<div>' + ring(m[x[0]], tn(m[x[0]], 90, 75), { size: 68, label: x[1] }) + '<b>' + t(x[1]) + '</b></div>'; }).join('') + '</div>' +
          kv([[L('Layar', 'Screens'), (m.screens.live == null ? m.screens.specs : m.screens.live + '/' + m.screens.specs) + ' · ' + esc(m.screens.src)], [L('Pemilik', 'Owner'), esc(m.ownerN)], [L('Rilis', 'Release'), '<span class="mono6">' + esc(m.release) + '</span>'],
            [L('Regression suite', 'Regression suites'), (m.suiteRuns || []).map(function (s) { return '<span class="mono6">' + esc(s.file) + '</span> ' + (s.at ? s.passed + '/' + s.total : t(L('belum dijalankan', 'not run yet'))); }).join(' · ') || '—'],
            [L('Blocker', 'Blockers'), m.blockers.length ? m.blockers.map(function (id) { return lnk('BUILD-004', id, mono(id)); }).join(', ') : t(L('Tidak ada', 'None'))]]) +
          '<h3 class="im12-h3">' + t(L('Test case wave ini', 'Test cases of this wave')) + ' <small>' + tc.filter(function (x) { return x.st === 'pass'; }).length + '/' + tc.length + '</small></h3>' +
          (tc.length ? '<div class="rls">' + tc.slice(0, 12).map(function (x) { return A.rowLink({ href: open('QA-003') ? href('QA-003', x.id) : '#', icon: 'filecheck', t: esc(x.id) + ' · ' + t(x.scen), s: t(x.moduleN) + ' · ' + t(x.sevN), chip: A.chip(x.tone, x.stN) }); }).join('') + '</div>' : A.empty(L('Belum ada test case.', 'No test cases yet.'))) + '</section>';
      }
      return P.head(t(L('Build % dari registry layar · QA % dari test case · UAT % dari JFGO', 'Build % from the screen registry · QA % from test cases · UAT % from JFGO')), '', fresh(L('JFIMP + JFGO', 'JFIMP + JFGO'))) + buildTabs('BUILD-002') + tiles + det + tbl + deskOnly();
    }
  };

  /* ================= BUILD-003 Integration Map ================= */
  var NODE_SCR = { client: 'CLIENT-001', order: 'ORDER-001', pickup: 'DISP-001', production: 'PROD-BATCH-001', delivery: 'DLV-001', billing: 'AR-001', finance: 'ACC-001', kpi: 'KPI-001' };
  V['BUILD-003'] = {
    render: function () {
      var c0 = cx(), mp = I.integrationMap(c0), ru = I.dataReuse(c0);
      var cnt = function (s) { return mp.links.filter(function (l) { return l.st === s; }).length; };
      var tiles = sumCards([{ k: L('Connected', 'Connected'), v: cnt('connected'), icon: 'checkc', tone: 'ok' }, { k: L('Testing', 'Testing'), v: cnt('testing'), icon: 'flask', tone: 'info' }, { k: L('Issue', 'Issue'), v: cnt('issue'), icon: 'alert', tone: cnt('issue') ? 'warn' : 'ok' }, { k: L('Blocked', 'Blocked'), v: cnt('blocked'), icon: 'xc', tone: cnt('blocked') ? 'crit' : 'ok' }, { k: L('Terhubung', 'Connected'), v: pc(mp.pct), icon: 'route', tone: tn(mp.pct, 95, 70) }]);
      var flow = card(L('Client → Order → Pickup → Production → Delivery → Billing → Finance → KPI', 'Client → Order → Pickup → Production → Delivery → Billing → Finance → KPI'), mapStrip(mp) +
        '<p class="im12-legend">' + ['connected', 'testing', 'issue', 'blocked'].map(function (k) { var x = I.LINK_ST[k]; return '<span class="im12-lg-' + x[1] + '"><i></i>' + t(x[0]) + '</span>'; }).join('') + '</p>', { icon: 'route' });
      var links = card(L('Status per koneksi (dari record nyata)', 'Status per connection (from real records)'), '<div class="im12-links">' + mp.links.map(function (l) {
        var a = mp.nodes.filter(function (n) { return n.k === l.from; })[0], b = mp.nodes.filter(function (n) { return n.k === l.to; })[0];
        return '<div class="im12-lk im12-t-' + l.tone + '"><div class="im12-lk-h"><b>' + (NODE_SCR[l.from] ? lnk(NODE_SCR[l.from], null, t(a.n)) : t(a.n)) + ' → ' + (NODE_SCR[l.to] ? lnk(NODE_SCR[l.to], null, t(b.n)) : t(b.n)) + '</b>' + A.chip(l.tone, l.stN) + '</div>' +
          (l.total ? '<span class="im12-pb">' + bar(Math.round(l.ok / l.total * 100), l.tone) + '<b class="num">' + l.ok + '/' + l.total + '</b></span>' : '') + '<p>' + lab(l.evidence) + '</p>' +
          (l.blockers.length ? '<p class="im12-lk-b">' + ic('alert') + l.blockers.map(function (id) { return lnk('BUILD-004', id, mono(id)); }).join(', ') + '</p>' : '') + '</div>';
      }).join('') + '</div>', { icon: 'link' });
      var reuse = ru ? card(L('Data reuse: satu berat aktual, dipakai di mana-mana (§19)', 'Data reuse: one actual weight, used everywhere (§19)'), '<p class="im12-lead">' + t(L('Receiving ', 'Receiving ')) + lnk('PROD-RCV-002', ru.rcv, mono(ru.rcv)) + ' · ' + esc(ru.net) + ' kg · ' + A.chip(ru.found === ru.steps.length ? 'ok' : 'warn', L(ru.found + '/' + ru.steps.length + ' langkah memakai record yang sama', ru.found + '/' + ru.steps.length + ' steps use the same record')) + ' ' + A.chip('ok', L('Input ulang: ' + ru.reentry, 'Re-entry: ' + ru.reentry), 'checkc') + '</p>' +
        '<ol class="im12-reuse">' + ru.steps.map(function (s) { return '<li class="' + (s.found ? 'is-ok' : 'is-no') + '"><span class="im12-ru-n">' + ic(s.found ? 'checkc' : 'xc') + '</span><span class="im12-ru-b"><b>' + t(s.n) + '</b><span class="mono6">' + esc(s.id || '—') + '</span>' + (s.v ? '<b class="num">' + esc(s.v) + '</b>' : '') + '<small>' + t(s.how) + ' · ' + esc(s.src) + '</small></span></li>'; }).join('') + '</ol>', { icon: 'scale' }) : '';
      return P.head(t(L('Setiap koneksi dihitung dari record nyata di engine pemilik', 'Each connection is computed from real records in the owner engines')), '', fresh(L('JFCOMM · JFLOG · JFPROD · JFDLV · JFFIN · JFPERF', 'JFCOMM · JFLOG · JFPROD · JFDLV · JFFIN · JFPERF'))) + buildTabs('BUILD-003') + tiles + flow + links + reuse;
    }
  };

  /* ================= BUILD-004 Blocker Detail ================= */
  function waveOpts() { return I.modules(cx()).map(function (m) { return [m.k, [m.k + ' · ' + T(m.n), m.k + ' · ' + m.n[1]]]; }); }
  function sevOpts() { return Object.keys(I.SEV).map(function (k) { return [k, I.SEV[k][0]]; }); }
  function linkOpts() { var mp = I.integrationMap(cx()); return [['', L('Tidak terkait koneksi', 'Not tied to a connection')]].concat(mp.links.map(function (l) { return [l.from + '>' + l.to, L(l.from + ' → ' + l.to, l.from + ' → ' + l.to)]; })); }
  function addDlg() {
    var c0 = cx(), bugs = can('imp.qa.view') ? I.bugs(c0, { st: 'open' }) : [];
    dlg({ title: L('Tambah blocker', 'Add blocker'), icon: 'plus', ok: L('Simpan', 'Save'), sub: t(L('Blocker tampil di roadmap, progres modul dan peta integrasi; tercatat di audit.', 'The blocker shows on the roadmap, module progress and integration map; it is audited.')),
      body: fld(L('Judul', 'Title'), inp('t', '', { ph: L('Apa yang menghambat?', 'What is blocking?') }), { req: true, wide: true }) + fld(L('Severity', 'Severity'), sel('sev', sevOpts(), 'high'), { req: true }) + fld(L('Wave', 'Wave'), sel('wave', waveOpts(), 'W1'), { req: true }) +
        fld(L('Jatuh tempo', 'Due'), inp('due', '', { type: 'date' }), { req: true }) + fld(L('Koneksi integrasi', 'Integration connection'), sel('link', linkOpts(), '')) + (bugs.length ? fld(L('Bug terkait', 'Linked bug'), sel('bug', [['', L('Tidak ada', 'None')]].concat(bugs.map(function (b) { return [b.id, L(b.id + ' · ' + T(b.t), b.id + ' · ' + b.t[1])]; })), '')) : ''),
      onOk: function (v, el) { v = P.vals(el); var r = I.addBlocker(cx(), { t: v.t, sev: v.sev, wave: v.wave, due: v.due, link: v.link || null, bug: v.bug || null }); if (!r || !r.ok) return emsg(r); A.go('BUILD-004', r.blocker.id); setTimeout(function () { A.toast(L('Blocker dibuat.', 'Blocker created.')); }, 450); return true; } });
  }
  function updDlg(id, st) {
    var b = I.blocker(cx(), id); if (!b) return;
    rdlg({ title: st ? (st === 'resolved' ? L('Tandai blocker selesai', 'Mark the blocker resolved') : st === 'progress' ? L('Mulai dikerjakan', 'Start working') : L('Buka kembali', 'Reopen')) : L('Ubah blocker', 'Edit blocker'), icon: st === 'resolved' ? 'checkc' : 'edit', ok: L('Simpan', 'Save'),
      sub: '<b>' + esc(b.id) + '</b> · ' + t(b.t) + '<br>' + t(b.stN) + (st ? ' → <b>' + t(I.BLK_ST[st][0]) + '</b>' : ''),
      body: st ? '' : fld(L('Status', 'Status'), sel('st', Object.keys(I.BLK_ST).map(function (k) { return [k, I.BLK_ST[k][0]]; }), b.st)) + fld(L('Severity', 'Severity'), sel('sev', sevOpts(), b.sev)) + fld(L('Jatuh tempo', 'Due'), inp('due', b.due, { type: 'date' })),
      fn: function (reason, v) { var patch = st ? { st: st } : { st: v.st, sev: v.sev, due: v.due }; return I.updateBlocker(cx(), id, patch, reason); }, done: L('Blocker diperbarui.', 'Blocker updated.') });
  }
  V['BUILD-004'] = {
    title: function (rec) { return rec ? L('Blocker ' + rec, 'Blocker ' + rec) : L('Blocker', 'Blockers'); },
    render: function (c) {
      var c0 = cx(), mg = can('imp.blocker.manage');
      if (c.rec) {
        var b = I.blocker(c0, c.rec);
        if (!b) return A.stateCard('empty', I.MSG.notfound, A.btn('blue', L('Kembali', 'Back'), 'arrowl', { go: 'BUILD-004' }));
        var acts = mg ? (b.st === 'open' ? A.btn('blue', L('Mulai Dikerjakan', 'Start Working'), 'play', { act: 'bst', val: b.id + '|progress' }) : '') + (b.st !== 'resolved' ? A.btn('primary', L('Tandai Selesai', 'Mark Resolved'), 'checkc', { act: 'bst', val: b.id + '|resolved' }) : A.btn('ghost', L('Buka Kembali', 'Reopen'), 'refresh', { act: 'bst', val: b.id + '|open' })) + A.btn('ghost', L('Ubah', 'Edit'), 'edit', { act: 'bed', val: b.id }) : '';
        var hero = P8.hero({ icon: 'alert', id: b.id, title: t(b.t), sub: t(b.waveN || L(b.wave, b.wave)) + ' · ' + esc(b.wave), chips: A.chip(b.tone, b.sevN) + A.chip(I.BLK_ST[b.st][1], b.stN) + (b.overdue ? A.chip('crit', L('Terlambat', 'Overdue'), 'clock') : ''),
          facts: [[L('Pemilik', 'Owner'), esc(b.ownerN)], [L('Jatuh tempo', 'Due'), dt(b.due), b.overdue ? 'im12-crit' : ''], [L('Dibuat', 'Created'), dt(b.at) + ' · ' + esc(I.empName(b.by))], [L('Koneksi', 'Connection'), b.link ? lnk('BUILD-003', null, esc(b.link.replace('>', ' → '))) : '—']] });
        var bug = card(L('Bug terkait', 'Linked bug'), b.bugRec ? A.rowLink({ href: open('QA-005') ? href('QA-005', b.bugRec.id) : '#', icon: 'alert', t: esc(b.bugRec.id) + (b.bugRec.t ? ' · ' + t(b.bugRec.t) : ''), s: (b.bugRec.sevN ? t(b.bugRec.sevN) : '') + (b.bugRec.ownerN ? ' · ' + esc(b.bugRec.ownerN) : ''), chip: b.bugRec.stN ? A.chip(b.bugRec.tone, b.bugRec.stN) : '' }) + note(t(L('Status bug dikelola QA (QA-005); blocker ini hanya merujuk.', 'The bug status is managed by QA (QA-005); this blocker only references it.')), 'link', 'info') : A.empty(L('Tidak ada bug terkait.', 'No linked bug.')), { icon: 'flask' });
        var log = card(L('Riwayat perubahan', 'Change history'), b.log.length ? '<ol class="im12-log">' + b.log.slice().reverse().map(function (x) { return '<li><b>' + dt(x.at) + '</b> · ' + esc(I.empName(x.by)) + '<span>' + Object.keys(x.after).map(function (k) { return esc(k) + ': ' + esc(String(x.before[k])) + ' → <b>' + esc(String(x.after[k])) + '</b>'; }).join(' · ') + '</span><small>“' + lab(x.reason) + '”</small></li>'; }).join('') + '</ol>' : A.empty(L('Belum ada perubahan.', 'No changes yet.')), { icon: 'history', count: b.log.length });
        return P.head(t(L('Modul, severity, pemilik, jatuh tempo, status, bug terkait', 'Module, severity, owner, due, status, linked bug')), acts, fresh(L('JFIMP blocker', 'JFIMP blocker'))) + buildTabs('BUILD-004') + hero + '<div class="im12-g2">' + bug + log + '</div>' +
          (mg ? '' : note(t(L('Perubahan blocker oleh: ', 'Blockers are changed by: ')) + esc(rolesWith('imp.blocker.manage').join(', ')), 'lock', 'info'));
      }
      var q = c.q, st = q.st || 'open', all = I.blockers(c0), list = I.blockers(c0, { st: st === 'all' ? null : st, sev: q.sev || null, wave: q.wave || null });
      var tabs = H.tabs([['open', L('Terbuka', 'Open'), 'alert', all.filter(function (b) { return b.st !== 'resolved'; }).length], ['resolved', L('Selesai', 'Resolved'), 'checkc', all.filter(function (b) { return b.st === 'resolved'; }).length], ['all', L('Semua', 'All'), 'list', all.length]], st, 'st', { def: 'open', seg: true });
      var fb = A.filters([{ k: 'sev', l: L('Severity', 'Severity'), opts: sevOpts() }, { k: 'wave', l: L('Wave', 'Wave'), opts: waveOpts() }]);
      var rows = P.table(list, [
        { h: L('Blocker', 'Blocker'), v: function (b) { return '<b>' + t(b.t) + '</b><small class="sub5 mono6">' + esc(b.id) + (b.link ? ' · ' + esc(b.link.replace('>', ' → ')) : '') + '</small>'; } }, { h: L('Wave', 'Wave'), v: function (b) { return t(b.waveN || L(b.wave, b.wave)); } },
        { h: L('Severity', 'Severity'), v: function (b) { return A.chip(b.tone, b.sevN); } }, { h: L('Pemilik', 'Owner'), v: function (b) { return esc(b.ownerN); } },
        { h: L('Jatuh tempo', 'Due'), v: function (b) { return dt(b.due) + (b.overdue ? ' ' + A.chip('crit', L('Terlambat', 'Overdue')) : ''); } }, { h: L('Bug', 'Bug'), v: function (b) { return b.bug ? mono(b.bug) : '—'; } },
        { h: L('Status', 'Status'), v: function (b) { return A.chip(I.BLK_ST[b.st][1], b.stN); } }
      ], function (b) { return { t: t(b.t), s: mono(b.id) + ' · ' + t(b.waveN || L(b.wave, b.wave)) + ' · ' + dt(b.due), chip: A.chip(b.tone, b.sevN) }; }, function (b) { return href('BUILD-004', b.id); }, { empty: st === 'open' ? L('Tidak ada blocker terbuka.', 'No open blocker.') : L('Tidak ada blocker.', 'No blockers.') });
      return P.head(t(L('Hambatan build per wave, dengan pemilik dan jatuh tempo', 'Build blockers per wave, with owner and due date')), mg ? A.btn('primary', L('Tambah Blocker', 'Add Blocker'), 'plus', { act: 'badd' }) : '', fresh(L('JFIMP blocker', 'JFIMP blocker'))) + buildTabs('BUILD-004') + tabs + fb + card(L('Daftar blocker', 'Blocker list'), rows, { icon: 'alert', count: list.length });
    },
    act: { badd: function () { addDlg(); }, bed: function (el) { updDlg(el.getAttribute('data-val')); }, bst: function (el) { var p = el.getAttribute('data-val').split('|'); updDlg(p[0], p[1]); } }
  };
})();
