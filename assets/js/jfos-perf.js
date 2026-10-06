/* ==========================================================================
   JFRESH OS — Performance engine (Phase 5 · NP 1.0)
   Executive Business Health, Financial Health, Goal Cascade, KPI Master &
   weighting, XScore (Ambidex), Teamwork Score, Personal Score, Daily /
   Weekly Race & R2RE, Monthly Reflection and Decision Intelligence.

   One engine for the app (app/screens-perf*.js), the Phase 5 pages
   (phase5/) and the automated tests (tools/test-perf.js). Every score is a
   deterministic function of the stored data and the configured versions
   (§78). Every protected action checks a permission first (§74) and writes
   an audit entry (§81). Prototype only: a production backend must repeat
   these rules on the server.

   The five scores are different things (§77):
     Business Health Score  condition snapshot of six business pillars
     Financial Health Score financial-only KPI scorecard (§18)
     XScore                 period performance on the Ambidex KPI framework
     Teamwork Score         shared team KPIs (never an average of people)
     Personal Score         individual KPIs + team contribution, by role
   ========================================================================== */
(function (root) {
  var D = root.JFPERF_DATA || (typeof require !== 'undefined' ? require('./jfos-perf-data.js') : null);
  function L(a, b) { return [a, b === undefined ? a : b]; }
  var P = { version: 'Phase 5 · NP 1.0', date: '2026-10-06', D: D };
  var DAY = 864e5, JT = 1e6;
  function r1(x) { return Math.round(x * 10) / 10; }
  function r2(x) { return Math.round(x * 100) / 100; }
  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  function sum(a) { return a.reduce(function (s, x) { return s + (+x || 0); }, 0); }
  function avg(a) { return a.length ? sum(a) / a.length : 0; }
  function clamp(x, lo, hi) { return Math.max(lo, Math.min(hi, x)); }
  function ms(s) { return Date.parse(s.length === 10 ? s + 'T00:00:00Z' : s.replace(' ', 'T') + ':00Z'); }
  function by(arr, k, v) { return arr.filter(function (x) { return x[k] === v; })[0]; }
  P.r1 = r1; P.r2 = r2; P.ms = ms;
  P.TODAY = D.today;
  P.days = function (from, to) { return Math.round((ms(to) - ms(from || P.TODAY)) / DAY); };

  /* ---------- Catalogs ---------- */
  P.CATS = { financial: L('Keuangan', 'Financial'), operations: L('Operasional', 'Operations'), client: L('Klien', 'Client'), quality: L('Kualitas', 'Quality'), people: L('People', 'People'), innovation: L('Inovasi', 'Innovation'), sustainability: L('Keberlanjutan', 'Sustainability') };
  P.CAT_ORDER = ['financial', 'operations', 'client', 'quality', 'people', 'innovation', 'sustainability'];
  P.CAT_ICON = { financial: 'coins', operations: 'washer', client: 'hotel', quality: 'shield', people: 'users', innovation: 'bulb', sustainability: 'droplet' };
  P.PRI = {
    critical: { n: L('Kritis', 'Critical'), rank: 0, rec: [20, 30] }, high: { n: L('Tinggi', 'High'), rank: 1, rec: [15, 20] },
    medium: { n: L('Sedang', 'Medium'), rank: 2, rec: [10, 15] }, supporting: { n: L('Pendukung', 'Supporting'), rank: 3, rec: [5, 10] }
  };
  P.DIRS = { higher: L('Makin tinggi makin baik', 'Higher is better'), lower: L('Makin rendah makin baik', 'Lower is better'), range: L('Rentang target', 'Target range'), binary: L('Ya / Tidak (biner)', 'Binary'), formula: L('Formula sistem', 'System formula') };
  P.AGG = {
    sum: { n: L('Jumlah', 'Sum'), d: L('Menjumlahkan nilai', 'Adds the values'), ex: L('Revenue', 'Revenue'), icon: 'plus' },
    avg: { n: L('Rata-rata', 'Average'), d: L('Rata-rata sederhana', 'Simple average'), ex: L('CSAT, utilisasi', 'CSAT, utilisation'), icon: 'chart' },
    wavg: { n: L('Rata-rata tertimbang', 'Weighted average'), d: L('Rata-rata dengan bobot volume', 'Average weighted by volume'), ex: L('Turnaround per order', 'Turnaround per order'), icon: 'percent' },
    ratio: { n: L('Rasio', 'Ratio'), d: L('Total pembilang ÷ total penyebut', 'Total numerator ÷ total denominator'), ex: L('SLA, rewash, produktivitas', 'SLA, rewash, productivity'), icon: 'scale' },
    latest: { n: L('Nilai terakhir', 'Latest value'), d: L('Nilai akhir periode', 'Value at period end'), ex: L('Retensi, headcount', 'Retention, headcount'), icon: 'clock' },
    formula: { n: L('Formula sistem', 'System formula'), d: L('Dihitung sistem dari data sumber', 'Calculated by the system from source data'), ex: L('XScore, Teamwork Score', 'XScore, Teamwork Score'), icon: 'cog' }
  };
  P.SRC = {
    billing: L('Billing & invoice', 'Billing & invoices'), finance: L('Buku besar finance', 'Finance ledger'), invoice: L('Invoice & pembayaran', 'Invoices & payments'),
    delivery: L('Data pengiriman', 'Delivery data'), production: L('Produksi & jam kerja', 'Production & labour hours'), maintenance: L('Log maintenance', 'Maintenance log'),
    qc: L('QC & reproses', 'QC & reprocess'), crm: L('CRM & komplain', 'CRM & complaints'), survey: L('Survei klien', 'Client survey'), hr: L('HR & absensi', 'HR & attendance'),
    receiving: L('Receiving', 'Receiving'), system: L('Dihitung sistem', 'System calculated'), manual: L('Input manual', 'Manual input')
  };
  P.LIFE = {
    draft: { n: L('Draft', 'Draft'), tone: 'mute' }, review: { n: L('Review', 'Review'), tone: 'info' }, approved: { n: L('Disetujui', 'Approved'), tone: 'info' },
    active: { n: L('Aktif', 'Active'), tone: 'ok' }, frozen: { n: L('Frozen', 'Frozen'), tone: 'appr' }, archived: { n: L('Diarsipkan', 'Archived'), tone: 'mute' }
  };
  P.LIFE_ORDER = ['draft', 'review', 'approved', 'active', 'frozen', 'archived'];
  P.TRANSITIONS = { draft: ['review'], review: ['approved', 'draft'], approved: ['active', 'draft'], active: ['frozen', 'archived'], frozen: ['archived'], archived: [] };
  // Changes to these fields after a KPI leaves draft/review create a new version (§30).
  P.PROTECTED = ['target', 'weight', 'formula', 'owner', 'agg', 'dir', 'lo', 'hi', 'stretch', 'floor', 'cap'];
  P.ST = {
    on: { n: L('On Track', 'On Track'), tone: 'ok', icon: 'checkc' }, risk: { n: L('At Risk', 'At Risk'), tone: 'warn', icon: 'alert' }, off: { n: L('Off Track', 'Off Track'), tone: 'crit', icon: 'xc' },
    done: { n: L('Selesai', 'Done'), tone: 'info', icon: 'check' }, completed: { n: L('Completed', 'Completed'), tone: 'info', icon: 'check' }, cancelled: { n: L('Cancelled', 'Cancelled'), tone: 'mute', icon: 'ban' },
    progress: { n: L('Berjalan', 'In Progress'), tone: 'info', icon: 'refresh' }, notstarted: { n: L('Belum Mulai', 'Not Started'), tone: 'mute', icon: 'clock' },
    open: { n: L('Terbuka', 'Open'), tone: 'crit', icon: 'alert' }, resolved: { n: L('Selesai', 'Resolved'), tone: 'ok', icon: 'checkc' }, carried: { n: L('Dibawa ke bulan depan', 'Carried forward'), tone: 'appr', icon: 'arrow' }
  };
  P.SEV = { crit: { n: L('Kritis', 'Critical'), tone: 'crit', rank: 3 }, high: { n: L('Tinggi', 'High'), tone: 'crit', rank: 2 }, medium: { n: L('Sedang', 'Medium'), tone: 'warn', rank: 1 }, low: { n: L('Rendah', 'Low'), tone: 'info', rank: 0 }, info: { n: L('Info', 'Info'), tone: 'info', rank: 0 } };
  P.INS_TYPE = { descriptive: { n: L('Descriptive', 'Descriptive'), icon: 'chart', d: L('Apa yang terjadi', 'What happened') }, diagnostic: { n: L('Diagnostic', 'Diagnostic'), icon: 'search', d: L('Mengapa terjadi', 'Why it happened') }, predictive: { n: L('Predictive', 'Predictive'), icon: 'trend', d: L('Apa yang akan terjadi', 'What will happen') }, prescriptive: { n: L('Prescriptive', 'Prescriptive'), icon: 'bulb', d: L('Apa yang harus dilakukan', 'What to do') } };
  P.TREND = { improving: { n: L('Membaik', 'Improving'), icon: 'arrowup', tone: 'ok' }, declining: { n: L('Menurun', 'Declining'), icon: 'arrowdn', tone: 'crit' }, stable: { n: L('Stabil', 'Stable'), icon: 'minus', tone: 'info' }, volatile: { n: L('Fluktuatif', 'Volatile'), icon: 'zap', tone: 'warn' } };
  P.BANDS_DEFAULT = [
    { min: 95, k: 'excellent', n: L('Excellent', 'Excellent'), tone: 'ok' }, { min: 85, k: 'healthy', n: L('Healthy', 'Healthy'), tone: 'ok' },
    { min: 75, k: 'attention', n: L('Perlu Perhatian', 'Need Attention'), tone: 'warn' }, { min: 60, k: 'warning', n: L('Warning', 'Warning'), tone: 'warn' },
    { min: 0, k: 'critical', n: L('Kritis', 'Critical'), tone: 'crit' }
  ];
  P.WEIGHT_MSG = {
    ok: L('Bobot valid.', 'Weights are valid.'),
    under: function (n) { return L('Bobot belum lengkap — tersisa ' + n + '%.', 'Weights incomplete — ' + n + '% left.'); },
    over: function (n) { return L('Bobot melebihi 100% sebesar ' + n + '%.', 'Weights exceed 100% by ' + n + '%.'); }
  };
  P.MSG = {
    noperm: L('Anda tidak memiliki akses untuk tindakan ini.', 'You do not have access to this action.'),
    reason: L('Alasan wajib diisi.', 'A reason is required.'),
    approver: L('Pilih approver yang berwenang.', 'Choose an authorised approver.'),
    weights: L('Scorecard belum bisa diaktifkan karena bobot belum 100%.', 'The scorecard cannot be activated until weights total 100%.'),
    transition: L('Perubahan status ini tidak diizinkan.', 'This status change is not allowed.'),
    protected: L('Race Leader tidak dapat mengubah target, formula, bobot atau struktur scorecard.', 'A Race Leader cannot change the target, formula, weight or scorecard structure.'),
    frozen: L('Reflection sudah frozen. Perubahan memerlukan amandemen.', 'The reflection is frozen. Changes need an amendment.'),
    review: L('Draft STRACON harus direview sebelum diaktifkan.', 'The STRACON draft must be reviewed before activation.'),
    evidence: L('Input manual wajib menyertakan pemilik dan alasan atau bukti.', 'Manual input needs an owner and a reason or evidence.'),
    sum100: L('Total harus tepat 100%.', 'The total must be exactly 100%.'),
    invalid: L('Data belum lengkap.', 'Some data is missing.'),
    notfound: L('Data tidak ditemukan.', 'Record not found.')
  };

  /* ---------- Permissions (Phase 5) ---------- */
  P.PERMS = {
    'exe.health': L('Lihat Business Health', 'View Business Health'),
    'fin.health': L('Lihat Financial Health', 'View Financial Health'),
    'fin.cash.accounts': L('Lihat saldo per rekening', 'View balances per account'),
    'goal.view': L('Lihat goal cascade', 'View goal cascade'), 'goal.edit': L('Kelola goal', 'Manage goals'), 'goal.adjust': L('Koreksi progres goal manual', 'Manually adjust goal progress'),
    'kpi.view': L('Lihat KPI master', 'View KPI master'), 'kpi.edit': L('Buat / ubah KPI (target, formula, owner)', 'Create / edit KPIs (target, formula, owner)'),
    'kpi.weight': L('Ubah bobot & struktur scorecard', 'Change weights & scorecard structure'), 'kpi.approve': L('Setujui KPI & aktifkan scorecard', 'Approve KPIs & activate scorecards'),
    'xscore.view': L('Lihat XScore', 'View XScore'), 'xscore.config': L('Atur bobot XScore & band status', 'Configure XScore weights & status bands'),
    'team.view': L('Lihat Teamwork Score', 'View Teamwork Score'),
    'perf.self': L('Lihat kinerja sendiri', 'View own performance'), 'perf.view': L('Lihat kinerja karyawan', 'View employee performance'),
    'hr.manage': L('Catat coaching, PIP & rekognisi', 'Record coaching, PIP & recognition'), 'hr.config': L('Atur formula Personal Score', 'Configure the Personal Score formula'),
    'race.view': L('Lihat Daily & Weekly Race', 'View Daily & Weekly Race'), 'race.edit': L('Buat & update race', 'Create & update races'), 'race.lead': L('Pimpin R2RE (Race Leader)', 'Lead R2RE (Race Leader)'),
    'refl.view': L('Lihat Monthly Reflection', 'View Monthly Reflection'), 'refl.edit': L('Susun Monthly Reflection', 'Prepare Monthly Reflection'), 'refl.review': L('Review Reflection (Manager)', 'Review Reflection (Manager)'), 'refl.approve': L('Setujui & freeze Reflection', 'Approve & freeze Reflection'),
    'stracon.create': L('Buat draft STRACON', 'Create STRACON drafts'),
    'di.view': L('Lihat insight & executive brief', 'View insights & executive brief'), 'di.act': L('Tindak lanjut insight & keputusan', 'Act on insights & decisions'),
    'rpt.ambidex': L('Laporan Ambidex', 'Ambidex reports'), 'rpt.hr': L('Laporan kinerja HR', 'HR performance reports')
  };
  var ALL5 = Object.keys(P.PERMS);
  P.ROLE_PERMS = {
    owner: ALL5,
    opsmgr: ['goal.view', 'goal.edit', 'kpi.view', 'kpi.edit', 'xscore.view', 'team.view', 'perf.self', 'perf.view', 'hr.manage', 'race.view', 'race.edit', 'race.lead', 'refl.view', 'refl.edit', 'refl.review', 'stracon.create', 'di.view', 'rpt.ambidex', 'rpt.hr'],
    supervisor: ['goal.view', 'kpi.view', 'team.view', 'perf.self', 'perf.view', 'race.view', 'race.edit', 'race.lead', 'refl.view', 'refl.edit'],
    finance: ['fin.health', 'fin.cash.accounts', 'goal.view', 'kpi.view', 'team.view', 'perf.self', 'race.view', 'race.edit'],
    sales: ['goal.view', 'kpi.view', 'perf.self', 'race.view', 'race.edit'],
    operator: ['perf.self', 'race.view'], driver: ['perf.self', 'race.view'], qc: ['perf.self', 'race.view'], client: []
  };
  function can(ctx, p) { return !p || !!(ctx && ctx.perms && ctx.perms.indexOf(p) >= 0); }
  P.can = can;

  /* ---------- State (browser: localStorage · node: memory) ---------- */
  var KEY = 'jfos-perf-v1', mem = {}, st = null, clock = function () { return Date.now(); };
  var ls = null;
  try { ls = root.localStorage || null; if (ls) { ls.setItem('__jfp', '1'); ls.removeItem('__jfp'); } } catch (e) { ls = null; }
  function normKpi(k) {
    var auto = k.src === 'system' || k.agg === 'formula';
    return Object.assign({
      desc: k.formula || L('—', '—'), goal: null, owner: 'EMP-050', team: null, role: null, period: 'monthly', freq: 'monthly', floor: P.FLOOR, cap: 100, stretch: null,
      evid: k.src === 'manual' ? L('Lampiran wajib + alasan', 'Attachment + reason required') : auto ? L('Otomatis dari sistem', 'Automatic from the system') : L('Otomatis dari data transaksi', 'Automatic from transaction data'),
      reviewer: 'EMP-010', approver: 'EMP-050', status: 'active', v: 1, eff: '2026-07-01', reason: L('Versi awal', 'Initial version'), teams: [], hist: []
    }, k);
  }
  function seed() {
    var kpis = D.KPIS.map(normKpi);
    // FIN-01 carries an older version to show that history keeps its own target (§30).
    var f1 = by(kpis, 'code', 'FIN-01'); f1.v = 2; f1.eff = '2026-07-01'; f1.reason = L('Target H2 dinaikkan sesuai Business Goal', 'H2 target raised to match the Business Goal');
    kpis.push(Object.assign(clone(f1), { v: 1, status: 'archived', target: 1600 * JT, eff: '2026-01-01', reason: L('Versi awal', 'Initial version'), stretch: 1700 * JT }));
    var r2 = D.R2.map(function (k) { return normKpi(Object.assign({ owner: k.pic, team: 'ops' }, k)); });
    return {
      v: 1, kpis: kpis.concat(r2), scorecards: clone(D.SCORECARDS), goals: clone(D.GOALS), daily: clone(D.DAILY), weekly: clone(D.WEEKLY), issues: clone(D.ISSUES),
      decisions: clone(D.DECISIONS), strategy: clone(D.STRATEGY), reviews: {}, tasks: [], notes: [], snapshots: [], audit: [], manual: [],
      refl: { month: D.closedMonth, status: 'draft', v: 1, amend: [], log: [] }, stracon: null,
      cfg: { bands: clone(P.BANDS_DEFAULT), kst: { on: 95, risk: 75 }, ambidex: clone(D.AMBIDEX), dims: D.XDIMS.map(function (d) { return { k: d.k, w: d.w, g: d.g }; }), personal: clone(D.PERSONAL_FORMULA), teamComp: { result: 50, member: 50 }, expThreshold: 5, cashBuffer: 600 * JT, bigObligation: 15, cashTarget: 1500 * JT }
    };
  }
  function S() {
    if (st) return st;
    try { var raw = ls ? ls.getItem(KEY) : mem[KEY]; st = raw ? JSON.parse(raw) : null; } catch (e) { st = null; }
    if (!st || st.v !== 1) { st = seed(); save(); }
    return st;
  }
  function save() { try { var s = JSON.stringify(st); if (ls) ls.setItem(KEY, s); else mem[KEY] = s; } catch (e) {} }
  P.state = S; P.save = save;
  P._reset = function () { st = seed(); save(); };
  P._setClock = function (fn) { clock = fn; };
  P.now = function () { return clock(); };
  P.cfg = function () { return S().cfg; };

  /* ---------- Audit (§81) ---------- */
  P.EVENTS = {
    'GOAL.CREATE': L('Goal dibuat', 'Goal created'), 'GOAL.ADJUST': L('Progres goal dikoreksi manual', 'Goal progress manually adjusted'), 'GOAL.STATUS': L('Status goal diubah', 'Goal status changed'),
    'KPI.CREATE': L('KPI dibuat', 'KPI created'), 'KPI.EDIT': L('KPI diubah', 'KPI edited'), 'KPI.VERSION': L('Versi KPI baru', 'New KPI version'), 'KPI.STATUS': L('Status KPI diubah', 'KPI status changed'),
    'KPI.COPY': L('KPI disalin', 'KPI copied'), 'KPI.DEACTIVATE': L('KPI dinonaktifkan', 'KPI deactivated'),
    'TARGET.CHANGE': L('Target diubah', 'Target changed'), 'WEIGHT.CHANGE': L('Bobot diubah', 'Weight changed'), 'FORMULA.CHANGE': L('Formula diubah', 'Formula changed'), 'OWNER.CHANGE': L('Owner diubah', 'Owner changed'), 'AGG.CHANGE': L('Metode agregasi diubah', 'Aggregation changed'),
    'SCORECARD.ACTIVATE': L('Scorecard diaktifkan', 'Scorecard activated'), 'SCORECARD.BLOCKED': L('Aktivasi scorecard ditolak', 'Scorecard activation blocked'), 'SCORE.SNAPSHOT': L('Skor periode disimpan', 'Period score saved'),
    'MANUAL.INPUT': L('Input manual KPI', 'Manual KPI input'), 'RACE.CREATE': L('Race dibuat', 'Race created'), 'RACE.UPDATE': L('Race diupdate', 'Race updated'), 'R2RE.REVIEW': L('KPI direview di R2RE', 'KPI reviewed in R2RE'),
    'REFL.STATUS': L('Status reflection diubah', 'Reflection status changed'), 'REFL.AMEND': L('Amandemen reflection', 'Reflection amendment'), 'ISSUE.CARRY': L('Issue dibawa ke bulan depan', 'Issue carried forward'),
    'STRACON.DRAFT': L('Draft STRACON dibuat', 'STRACON draft created'), 'STRACON.STATUS': L('Status STRACON diubah', 'STRACON status changed'),
    'INSIGHT.ACTION': L('Tindak lanjut insight', 'Insight action'), 'DECISION.CREATE': L('Keputusan dicatat', 'Decision recorded'), 'DECISION.UPDATE': L('Keputusan diupdate', 'Decision updated'),
    'REPORT.EXPORT': L('Laporan diexport', 'Report exported'), 'CONFIG.BANDS': L('Band status diubah', 'Status bands changed'), 'CONFIG.AMBIDEX': L('Bobot Ambidex / XScore diubah', 'Ambidex / XScore weights changed'), 'CONFIG.PERSONAL': L('Formula Personal Score diubah', 'Personal Score formula changed'),
    'HR.NOTE': L('Catatan HR ditambahkan', 'HR note added'), 'ACCESS.DENIED': L('Tindakan ditolak (tanpa izin)', 'Action denied (no permission)')
  };
  P.audit = function (ev, ctx, o) {
    o = o || {};
    var e = { at: P.now(), ev: ev, uid: ctx && ctx.uid || null, by: ctx && (ctx.name || ctx.fullName) || 'system', target: o.target || null, from: o.from == null ? null : String(o.from), to: o.to == null ? null : String(o.to), reason: o.reason || null, v: o.v || null };
    S().audit.unshift(e); if (S().audit.length > 400) S().audit.length = 400; save();
    return e;
  };
  P.auditLog = function () { return S().audit; };
  function deny(ctx, what) { P.audit('ACCESS.DENIED', ctx, { target: what }); return { ok: false, code: 'noperm', msg: P.MSG.noperm }; }

  /* ---------- Scoring math (§79) ----------
     Achievement (%) respects the KPI direction; stretch lifts it from 100 to the cap
     between target and stretch target. The achievement score then applies the floor:
     at or below the floor the score is 0, between floor and target it climbs linearly
     to 100, above target it follows the (capped) achievement.
     Weighted score = achievement score × weight. */
  P.FLOOR = 80;
  P.ach = function (k, actual) {
    var a = actual === undefined ? P.actual(k) : actual, tg = k.target, raw;
    if (a == null || isNaN(a)) return null;
    var cap = k.cap == null ? 100 : k.cap;
    switch (k.dir) {
      case 'lower':
        if (a <= 0) { raw = cap; break; }
        if (k.stretch != null && a < tg && k.stretch < tg) raw = 100 + (tg - a) / (tg - k.stretch) * (cap - 100);
        else raw = tg / a * 100;
        break;
      case 'range': {
        var lo = k.lo, hi = k.hi;
        raw = a < lo ? a / lo * 100 : a > hi ? hi / a * 100 : 100; break;
      }
      case 'binary': raw = (k.zero ? a === 0 : !!a) ? 100 : 0; break;
      case 'formula': raw = tg ? a / tg * 100 : a; break;
      default:
        if (!tg) { raw = 0; break; }
        if (k.stretch != null && a > tg && k.stretch > tg) raw = 100 + (a - tg) / (k.stretch - tg) * (cap - 100);
        else raw = a / tg * 100;
    }
    return r1(clamp(raw, 0, cap));
  };
  P.floorOf = function (k) { return k.dir === 'binary' ? null : (k.floor === undefined ? P.FLOOR : k.floor); };
  P.pts = function (k, ach) {
    if (ach == null) return null;
    var f = P.floorOf(k);
    if (f == null || ach >= 100) return r1(ach);
    if (ach <= f) return 0;
    return r1((ach - f) / (100 - f) * 100);
  };
  P.weighted = function (pts, weight) { return pts == null ? 0 : r2(pts * weight / 100); };
  P.kst = function (pts) { var c = S().cfg.kst; return pts == null ? 'off' : pts >= c.on ? 'on' : pts >= c.risk ? 'risk' : 'off'; };
  P.band = function (score) { var b = S().cfg.bands; for (var i = 0; i < b.length; i++) if (score >= b[i].min) return b[i]; return b[b.length - 1]; };
  P.validateBands = function (bands) {
    if (!bands || bands.length < 2) return false;
    for (var i = 0; i < bands.length; i++) { if (bands[i].min < 0 || bands[i].min > 100) return false; if (i && bands[i].min >= bands[i - 1].min) return false; }
    return bands[bands.length - 1].min === 0;
  };
  P.setBands = function (ctx, bands) {
    if (!can(ctx, 'xscore.config')) return deny(ctx, 'bands');
    if (!P.validateBands(bands)) return { ok: false, code: 'invalid', msg: P.MSG.invalid };
    var old = S().cfg.bands.map(function (b) { return b.min; }).join('/');
    S().cfg.bands = bands; save(); P.audit('CONFIG.BANDS', ctx, { from: old, to: bands.map(function (b) { return b.min; }).join('/') });
    return { ok: true };
  };
  /* Weight rule (§28): exactly 100%, no rounding tolerance beyond 0.01. */
  P.validateWeights = function (weights) {
    var total = r2(sum(weights)), diff = r2(100 - total);
    if (Math.abs(diff) < 0.005) return { ok: true, total: 100, msg: P.WEIGHT_MSG.ok };
    if (diff > 0) return { ok: false, total: total, left: diff, msg: P.WEIGHT_MSG.under(fmtPct(diff)) };
    return { ok: false, total: total, over: -diff, msg: P.WEIGHT_MSG.over(fmtPct(-diff)) };
  };
  function fmtPct(n) { return String(r2(n)).replace('.', ','); }
  P.normalize = function (weights) { var t = sum(weights); return t ? weights.map(function (w) { return r2(w / t * 100); }) : weights.map(function () { return 0; }); };
  /* Week-over-week trend (§59), direction aware. */
  P.trendOf = function (vals, dir) {
    vals = vals.filter(function (v) { return v != null && !isNaN(v); });
    if (vals.length < 2) return 'stable';
    var m = Math.abs(avg(vals)) || 1, tol = m * 0.015, d = [];
    for (var i = 1; i < vals.length; i++) d.push(vals[i] - vals[i - 1]);
    var big = d.filter(function (x) { return Math.abs(x) > tol; }), flips = 0;
    for (var j = 1; j < big.length; j++) if ((big[j] > 0) !== (big[j - 1] > 0)) flips++;
    var net = vals[vals.length - 1] - vals[0];
    if (flips >= 2) return 'volatile';
    if (Math.abs(net) <= tol) return big.length >= 2 ? 'volatile' : 'stable';
    var up = net > 0; if (dir === 'lower') up = !up;
    return up ? 'improving' : 'declining';
  };
  /* Aggregation (§56): rows are weekly values; ratio rows are [num, den]; wavg rows are [value, weight]. */
  P.aggregate = function (method, rows) {
    rows = rows.filter(function (r) { return r != null; });
    if (!rows.length) return null;
    switch (method) {
      case 'sum': return sum(rows);
      case 'avg': return avg(rows.map(function (r) { return Array.isArray(r) ? r[0] : r; }));
      case 'wavg': { var w = sum(rows.map(function (r) { return r[1]; })); return w ? sum(rows.map(function (r) { return r[0] * r[1]; })) / w : null; }
      case 'ratio': { var den = sum(rows.map(function (r) { return r[1]; })); return den ? sum(rows.map(function (r) { return r[0]; })) / den * 100 : null; }
      case 'latest': { var x = rows[rows.length - 1]; return Array.isArray(x) ? x[0] : x; }
      default: return null;
    }
  };
  P.weekValue = function (k, row) { if (row == null) return null; if (k.agg === 'ratio') return row[1] ? row[0] / row[1] * 100 : null; if (Array.isArray(row)) return row[0]; return row; };

  /* ---------- KPI master (§23–§30) ---------- */
  P.versions = function (code) { return S().kpis.filter(function (k) { return k.code === code; }).sort(function (a, b) { return b.v - a.v; }); };
  // Effective version: highest version in force (active or frozen).
  P.kpi = function (code) { return P.versions(code).filter(function (k) { return k.status === 'active' || k.status === 'frozen'; })[0] || null; };
  // Proposed version: newest version not archived (a draft / review / approved change, or the effective one).
  P.proposed = function (code) { return P.versions(code).filter(function (k) { return k.status !== 'archived'; })[0] || null; };
  P.codes = function (scId) {
    var seen = {}, out = [];
    S().kpis.forEach(function (k) { if ((!scId || k.sc === scId) && !seen[k.code]) { seen[k.code] = 1; out.push(k.code); } });
    return out;
  };
  P.kpis = function (scId) { return P.codes(scId).map(P.kpi).filter(Boolean); };
  P.library = function () { return P.codes().map(function (c) { return P.proposed(c) || P.versions(c)[0]; }).filter(function (k) { return k.sc !== 'R2-UBD' || true; }); };
  // Default sort (§29): category, priority, weight descending.
  P.sortKpis = function (list) {
    return list.slice().sort(function (a, b) {
      return (P.CAT_ORDER.indexOf(a.cat) - P.CAT_ORDER.indexOf(b.cat)) || (P.PRI[a.pri].rank - P.PRI[b.pri].rank) || (b.weight - a.weight) || (a.code < b.code ? -1 : 1);
    });
  };
  // Race / R2RE sort (§29, §50): category, weight descending, critical / at risk first, achievement ascending.
  P.sortRace = function (lines) {
    function urg(l) { return l.st === 'off' ? 0 : l.st === 'risk' ? 1 : (l.k.pri === 'critical' ? 2 : 3); }
    return lines.slice().sort(function (a, b) {
      return (P.CAT_ORDER.indexOf(a.k.cat) - P.CAT_ORDER.indexOf(b.k.cat)) || (b.k.weight - a.k.weight) || (urg(a) - urg(b)) || ((a.ach || 0) - (b.ach || 0));
    });
  };
  // System formulas (§80): actuals calculated from other data, never typed in.
  P.FN = {
    teamAvg: function () { return r1(avg(D.TEAMS.map(function (t) { return P.teamScore(t.k); }))); },
    personAvg: function () { return r1(avg(D.PEOPLE.map(function (p) { return P.person(p.id).score; }))); },
    revGrowth: function () { var r = D.FIN.revenue; return r1((r.sep / r.aug - 1) * 100); },
    netMargin: function () { return P.fin.pl().nm; },
    ar60: function () { return P.fin.ar().over60Share; },
    expVar: function () { return P.fin.expenses().varPct; },
    quick: function () { return P.fin.cash().quick; }
  };
  P.actual = function (k) { if (k.fn && P.FN[k.fn]) return P.FN[k.fn](); return k.actual; };
  P.line = function (k, actual) {
    var a = actual === undefined ? P.actual(k) : actual, ach = P.ach(k, a), pts = P.pts(k, ach);
    return { k: k, actual: a, ach: ach, pts: pts, ws: P.weighted(pts, k.weight), st: P.kst(pts), gap: a == null ? null : r2(a - (k.dir === 'range' ? clamp(a, k.lo, k.hi) : k.target)) };
  };
  P.scorecard = function (id) { return by(S().scorecards, 'id', id); };
  P.lines = function (scId) { return P.kpis(scId).map(function (k) { return P.line(k); }); };
  P.score = function (lines) {
    var v = P.validateWeights(lines.map(function (l) { return l.k.weight; }));
    return { score: r1(Math.min(100, sum(lines.map(function (l) { return l.ws; })))), valid: v.ok, weights: v };
  };
  P.scScore = function (scId) { return P.score(P.lines(scId)).score; };
  // Proposed weights on the weight board (drafts included) — what activation would apply.
  P.board = function (scId) {
    var rows = P.codes(scId).map(function (c) { var p = P.proposed(c); return p && !p.retire ? p : null; }).filter(Boolean);
    return { rows: P.sortKpis(rows), check: P.validateWeights(rows.map(function (k) { return k.weight; })) };
  };
  P.weightHint = function (k) { var r = P.PRI[k.pri].rec; return L('Saran bobot ' + r[0] + '–' + r[1] + '% untuk prioritas ' + P.PRI[k.pri].n[0].toLowerCase() + '. Bobot akhir tetap ditentukan manajemen.', 'Suggested ' + r[0] + '–' + r[1] + '% for ' + P.PRI[k.pri].n[1].toLowerCase() + ' priority. Management sets the final weight.'); };
  var FIELD_EVENT = { target: 'TARGET.CHANGE', weight: 'WEIGHT.CHANGE', formula: 'FORMULA.CHANGE', owner: 'OWNER.CHANGE', agg: 'AGG.CHANGE' };
  /* Save KPI changes. Protected changes after draft/review create a new draft version;
     the version in force keeps working until the scorecard activates the change (§30). */
  P.kpiSave = function (ctx, code, changes, reason) {
    var cur = P.proposed(code); if (!cur) return { ok: false, code: 'notfound', msg: P.MSG.notfound };
    var keys = Object.keys(changes).filter(function (f) { return JSON.stringify(changes[f]) !== JSON.stringify(cur[f]); });
    if (!keys.length) return { ok: true, same: true, k: cur };
    if (keys.indexOf('weight') >= 0 && !can(ctx, 'kpi.weight')) return deny(ctx, code + ' weight');
    if (keys.some(function (f) { return f !== 'weight'; }) && !can(ctx, 'kpi.edit')) return deny(ctx, code);
    var prot = keys.filter(function (f) { return P.PROTECTED.indexOf(f) >= 0; });
    var editable = cur.status === 'draft' || cur.status === 'review';
    if (prot.length && !editable && !String(reason || '').trim()) return { ok: false, code: 'reason', msg: P.MSG.reason };
    var target = cur, newV = false;
    if (prot.length && !editable) {
      target = Object.assign(clone(cur), { v: Math.max.apply(null, P.versions(code).map(function (k) { return k.v; })) + 1, status: 'draft', eff: null, reason: reason ? L(reason, reason) : cur.reason });
      S().kpis.push(target); newV = true;
      P.audit('KPI.VERSION', ctx, { target: code, from: 'v' + cur.v, to: 'v' + target.v, reason: reason, v: target.v });
    }
    keys.forEach(function (f) {
      var from = cur[f]; target[f] = changes[f];
      P.audit(FIELD_EVENT[f] || 'KPI.EDIT', ctx, { target: code + ' · ' + f, from: Array.isArray(from) ? from[0] : from, to: Array.isArray(changes[f]) ? changes[f][0] : changes[f], reason: reason || null, v: target.v });
    });
    save();
    return { ok: true, k: target, newVersion: newV };
  };
  P.kpiCreate = function (ctx, k) {
    if (!can(ctx, 'kpi.edit')) return deny(ctx, 'new KPI');
    if (!k.code || !k.n || !k.sc || !k.cat || !k.dir || k.target == null || k.weight == null) return { ok: false, code: 'invalid', msg: P.MSG.invalid };
    if (P.versions(k.code).length) return { ok: false, code: 'invalid', msg: L('Kode KPI sudah dipakai.', 'KPI code already in use.') };
    if (k.weight && !can(ctx, 'kpi.weight')) return deny(ctx, k.code + ' weight');
    var rec = normKpi(Object.assign({ pri: 'medium', agg: 'sum', src: 'manual', actual: null, unit: '' }, k, { v: 1, status: 'draft', eff: null }));
    S().kpis.push(rec); save(); P.audit('KPI.CREATE', ctx, { target: k.code, to: k.sc, v: 1 });
    return { ok: true, k: rec };
  };
  P.kpiCopy = function (ctx, code, newCode, scId) {
    if (!can(ctx, 'kpi.edit')) return deny(ctx, code + ' copy');
    var src = P.proposed(code); if (!src) return { ok: false, code: 'notfound', msg: P.MSG.notfound };
    if (P.versions(newCode).length) return { ok: false, code: 'invalid', msg: L('Kode KPI sudah dipakai.', 'KPI code already in use.') };
    var rec = Object.assign(clone(src), { code: newCode, sc: scId || src.sc, v: 1, status: 'draft', eff: null, weight: can(ctx, 'kpi.weight') ? src.weight : 0, reason: L('Disalin dari ' + code, 'Copied from ' + code) });
    S().kpis.push(rec); save(); P.audit('KPI.COPY', ctx, { target: newCode, from: code, v: 1 });
    return { ok: true, k: rec };
  };
  // Deactivation changes scorecard structure: it is proposed as a retiring draft and applied on activation.
  P.kpiDeactivate = function (ctx, code, reason) {
    if (!can(ctx, 'kpi.weight')) return deny(ctx, code + ' deactivate');
    if (!String(reason || '').trim()) return { ok: false, code: 'reason', msg: P.MSG.reason };
    var cur = P.proposed(code); if (!cur) return { ok: false, code: 'notfound', msg: P.MSG.notfound };
    var rec = cur.status === 'draft' ? cur : Object.assign(clone(cur), { v: Math.max.apply(null, P.versions(code).map(function (k) { return k.v; })) + 1, status: 'draft', eff: null });
    if (rec !== cur) S().kpis.push(rec);
    rec.retire = true; rec.weight = 0; rec.reason = L(reason, reason); save();
    P.audit('KPI.DEACTIVATE', ctx, { target: code, reason: reason, v: rec.v });
    return { ok: true, k: rec };
  };
  P.kpiTransition = function (ctx, code, v, to) {
    var k = P.versions(code).filter(function (x) { return x.v === v; })[0]; if (!k) return { ok: false, code: 'notfound', msg: P.MSG.notfound };
    if ((P.TRANSITIONS[k.status] || []).indexOf(to) < 0) return { ok: false, code: 'transition', msg: P.MSG.transition };
    var perm = to === 'review' || to === 'draft' ? 'kpi.edit' : 'kpi.approve';
    if (!can(ctx, perm)) return deny(ctx, code + ' → ' + to);
    if (to === 'active') return { ok: false, code: 'transition', msg: L('Versi baru aktif lewat aktivasi scorecard.', 'New versions go live through scorecard activation.') };
    var from = k.status; k.status = to; save();
    P.audit('KPI.STATUS', ctx, { target: code + ' v' + v, from: from, to: to, v: v });
    return { ok: true, k: k };
  };
  /* Activate a scorecard (§28): only when proposed weights total exactly 100%.
     Approved versions go live, versions they replace are archived, retiring KPIs leave. */
  P.activateScorecard = function (ctx, scId) {
    if (!can(ctx, 'kpi.approve')) return deny(ctx, scId + ' activate');
    var b = P.board(scId), sc = P.scorecard(scId);
    if (!b.check.ok) { P.audit('SCORECARD.BLOCKED', ctx, { target: scId, to: b.check.total + '%' }); return { ok: false, code: 'weights', msg: b.check.msg, check: b.check }; }
    var pending = P.codes(scId).map(P.proposed).filter(function (k) { return k && k.status !== 'active' && k.status !== 'frozen'; });
    var notReady = pending.filter(function (k) { return k.status !== 'approved'; });
    if (notReady.length) return { ok: false, code: 'approval', msg: L(notReady.length + ' perubahan KPI belum disetujui.', notReady.length + ' KPI changes are not approved yet.'), list: notReady.map(function (k) { return k.code; }) };
    pending.forEach(function (k) {
      P.versions(k.code).forEach(function (o) { if (o !== k && (o.status === 'active' || o.status === 'frozen')) o.status = 'archived'; });
      if (k.retire) k.status = 'archived'; else { k.status = 'active'; k.eff = P.TODAY; }
    });
    sc.v += 1; sc.status = 'active'; save();
    P.audit('SCORECARD.ACTIVATE', ctx, { target: scId, to: 'v' + sc.v, v: sc.v });
    return { ok: true, v: sc.v, applied: pending.length };
  };
  /* Manual KPI input (§80): owner + reason/evidence, audited, labelled "Input Manual". */
  P.manualInput = function (ctx, code, value, reason, evidence) {
    var k = P.kpi(code); if (!k) return { ok: false, code: 'notfound', msg: P.MSG.notfound };
    var isOwner = ctx && ctx.employee && ctx.employee.id === k.owner;
    if (!isOwner && !can(ctx, 'kpi.edit')) return deny(ctx, code + ' manual');
    if (!String(reason || '').trim() && !String(evidence || '').trim()) return { ok: false, code: 'evidence', msg: P.MSG.evidence };
    var from = k.actual; k.actual = value; k.src = 'manual'; k.manual = { by: ctx.employee ? ctx.employee.id : ctx.uid, reason: L(reason || '—', reason || '—'), ev: evidence || null, at: P.now() };
    S().manual.unshift({ code: code, v: value, by: k.manual.by, reason: reason, ev: evidence, at: P.now() }); save();
    P.audit('MANUAL.INPUT', ctx, { target: code, from: from, to: value, reason: reason || evidence });
    return { ok: true, k: k };
  };
  /* Versioned period snapshot (§78): formula / target / weight versions, period, time, sources. */
  P.snapshot = function (ctx, scId, period) {
    var sc = P.scorecard(scId), lines = P.lines(scId);
    var snap = {
      id: 'SNP-' + scId + '-' + period, sc: scId, period: period, at: P.now(), by: ctx && ctx.uid || 'system', scV: sc.v,
      formulaV: lines.map(function (l) { return l.k.code + '@v' + l.k.v; }).join(','), targetV: sc.v, weightV: sc.v,
      lines: lines.map(function (l) { return { code: l.k.code, v: l.k.v, dir: l.k.dir, target: l.k.target, lo: l.k.lo, hi: l.k.hi, zero: l.k.zero, cap: l.k.cap, floor: l.k.floor, stretch: l.k.stretch, weight: l.k.weight, actual: l.actual, src: l.k.src, ach: l.ach, pts: l.pts, ws: l.ws }; }),
      score: P.score(lines).score
    };
    S().snapshots = S().snapshots.filter(function (s) { return s.id !== snap.id; }); S().snapshots.push(snap); save();
    P.audit('SCORE.SNAPSHOT', ctx, { target: scId, to: snap.score, v: sc.v });
    return snap;
  };
  // Recompute a stored snapshot from its own stored versions: history never moves (§30, §78).
  P.recompute = function (snap) { return P.score(snap.lines.map(function (x) { return P.line(x, x.actual); })).score; };

  /* ---------- XScore (§31–§34) ---------- */
  P.dims = function () {
    var c = S().cfg, gw = c.ambidex;
    var tot = { exploit: 0, explore: 0 };
    c.dims.forEach(function (d) { tot[d.g] += d.w; });
    return D.XDIMS.map(function (meta) {
      var d = by(c.dims, 'k', meta.k), eff = tot[d.g] ? gw[d.g] * d.w / tot[d.g] : 0;
      return Object.assign({}, meta, { w: d.w, g: d.g, eff: r2(eff), score: P.scScore(meta.sc) });
    });
  };
  // Monthly dimension score history from KPI history (Apr–Sep), current month recalculated.
  P.dimHist = function (dimK) {
    var dm = by(D.XDIMS, 'k', dimK), ks = P.kpis(dm.sc);
    return D.HIST_MONTHS.map(function (m, i) {
      var last = i === D.HIST_MONTHS.length - 1;
      return P.score(ks.map(function (k) { return P.line(k, last ? P.actual(k) : k.hist[i]); })).score;
    });
  };
  P.xscoreHist = function () {
    var dims = P.dims(), hs = {}; dims.forEach(function (d) { hs[d.k] = P.dimHist(d.k); });
    return D.HIST_MONTHS.map(function (m, i) { return r1(sum(dims.map(function (d) { return hs[d.k][i] * d.eff / 100; }))); });
  };
  P.xscore = function (period) {
    var dims = P.dims(), c = S().cfg;
    var h = P.xscoreHist(), all12 = D.XSCORE_OLDER.concat(h);
    var score = r1(sum(dims.map(function (d) { return d.score * d.eff / 100; })));
    var val = period === 'q' ? r1(avg(h.slice(-3))) : period === '6m' ? r1(avg(h)) : period === '12m' ? r1(avg(all12)) : score;
    function grp(g) { var ds = dims.filter(function (d) { return d.g === g; }), w = sum(ds.map(function (d) { return d.w; })); return { w: c.ambidex[g], score: w ? r1(sum(ds.map(function (d) { return d.score * d.w; })) / w) : 0, dims: ds.map(function (d) { return d.k; }) }; }
    return {
      score: val, now: score, prev: h[h.length - 2], delta: r1(score - h[h.length - 2]), dims: dims, band: P.band(val), hist: h, hist12: all12,
      groups: { exploit: grp('exploit'), explore: grp('explore') }, dimCheck: P.validateWeights(c.dims.map(function (d) { return d.w; })), ambiCheck: P.validateWeights([c.ambidex.exploit, c.ambidex.explore])
    };
  };
  P.setAmbidex = function (ctx, exploit, explore, dims) {
    if (!can(ctx, 'xscore.config')) return deny(ctx, 'ambidex');
    if (!P.validateWeights([exploit, explore]).ok) return { ok: false, code: 'sum100', msg: P.MSG.sum100 };
    if (dims && !P.validateWeights(dims.map(function (d) { return d.w; })).ok) return { ok: false, code: 'sum100', msg: P.MSG.sum100 };
    var c = S().cfg, from = c.ambidex.exploit + '/' + c.ambidex.explore;
    c.ambidex = { exploit: exploit, explore: explore };
    if (dims) dims.forEach(function (d) { var x = by(c.dims, 'k', d.k); if (x) { x.w = d.w; if (d.g) x.g = d.g; } });
    save(); P.audit('CONFIG.AMBIDEX', ctx, { from: from, to: exploit + '/' + explore });
    return { ok: true };
  };

  /* ---------- Finance (§7–§18) ---------- */
  P.fin = {};
  P.fin.cash = function () {
    var a = D.FIN.accounts, s = function (f) { return sum(a.filter(f).map(function (x) { return x.bal; })); };
    var total = s(function () { return true; }), restricted = s(function (x) { return x.restricted; });
    var onHand = s(function (x) { return x.type === 'cash'; }), petty = s(function (x) { return x.type === 'petty'; }), bank = s(function (x) { return x.type === 'bank'; });
    var operational = s(function (x) { return x.use === 'ops'; });
    var available = total - restricted, ap = P.fin.ap(), committed = ap.due30;
    var arCur = P.fin.ar().buckets.current;
    return { total: total, onHand: onHand, petty: petty, operational: operational, bank: bank, restricted: restricted, available: available, committed: committed, free: available - committed, quick: r2((available + arCur) / committed), accounts: a };
  };
  P.FLOW_IN = { client: L('Pembayaran klien', 'Client payments'), deposit: L('Deposit', 'Deposits'), other: L('Pendapatan lain', 'Other income') };
  P.FLOW_OUT = { payroll: L('Gaji', 'Payroll'), chemical: L('Bahan kimia', 'Chemicals'), utility: L('Utilitas', 'Utilities'), fuel: L('BBM', 'Fuel'), maintenance: L('Maintenance', 'Maintenance'), supplier: L('Supplier', 'Supplier'), rental: L('Sewa', 'Rental'), tax: L('Pajak', 'Tax'), capex: L('Capex', 'Capex'), opex: L('Opex lain', 'Other opex') };
  P.FLOW_PERIODS = [['today', L('Hari Ini', 'Today')], ['d7', L('7 Hari', '7 Days')], ['mtd', 'MTD'], ['m3', L('3 Bulan', '3 Months')], ['ytd', 'YTD']];
  // Net Cash Flow = Cash In − Cash Out (§9)
  P.fin.flow = function (period) {
    var f = D.FIN.flow[period || 'mtd'], u = D.FIN.flowUnit;
    var inn = {}, out = {}; Object.keys(f.inn).forEach(function (k) { inn[k] = f.inn[k] * u; }); Object.keys(f.out).forEach(function (k) { out[k] = f.out[k] * u; });
    var tin = sum(Object.keys(inn).map(function (k) { return inn[k]; })), tout = sum(Object.keys(out).map(function (k) { return out[k]; }));
    return { inn: inn, out: out, tin: tin, tout: tout, net: tin - tout };
  };
  P.COLLECT_P = { current: 0.95, b30: 0.8, b60: 0.6, b90: 0.4, b90p: 0.15 };
  P.fin.forecast = function () {
    var ar = P.fin.ar(), ap = P.fin.ap(), cash = P.fin.cash(), c = S().cfg;
    function inflow(days) {
      return sum(ar.items.map(function (i) {
        var p = P.COLLECT_P[i.bucket];
        if (i.age <= 0) return -i.age <= days ? i.amt * p : 0;    // due inside the window
        return days >= 30 ? i.amt * p : (i.bucket === 'b30' ? i.amt * p * 0.5 : 0);   // overdue: expected inside 30 days
      }));
    }
    function outflow(days) { return sum(ap.items.filter(function (x) { return x.days <= days; }).map(function (x) { return x.amt; })); }
    var in7 = Math.round(inflow(7)), in30 = Math.round(inflow(30)), out7 = outflow(7), out30 = outflow(30);
    var proj7 = cash.available + in7 - out7, proj30 = cash.available + in30 - out30;
    var alerts = [];
    if (proj30 < c.cashBuffer) alerts.push({ k: 'risk', sev: 'high', t: L('Risiko forecast kas: proyeksi 30 hari di bawah buffer', 'Cash forecast risk: 30-day projection below buffer') });
    if (cash.free < c.cashBuffer) alerts.push({ k: 'free', sev: 'medium', t: L('Free cash di bawah buffer Rp ' + Math.round(c.cashBuffer / JT) + ' jt', 'Free cash below the Rp ' + Math.round(c.cashBuffer / JT) + ' M buffer') });
    ap.items.filter(function (x) { return x.days <= 30 && x.amt > cash.available * c.bigObligation / 100; }).forEach(function (x) {
      alerts.push({ k: 'big', sev: 'medium', t: L('Kewajiban besar: ' + x.n[0] + ' jatuh tempo ' + x.due, 'Large obligation: ' + x.n[1] + ' due ' + x.due), id: x.id });
    });
    return { in7: in7, in30: in30, out7: out7, out30: out30, proj7: proj7, proj30: proj30, available: cash.available, committed: cash.committed, free: cash.free, buffer: c.cashBuffer, alerts: alerts };
  };
  P.fin.revenue = function () {
    var r = D.FIN.revenue;
    return Object.assign({}, r, { mom: r1((r.sep / r.aug - 1) * 100), yoy: r1((r.sep / r.sepLy - 1) * 100), vsTarget: r1(r.mtd / r.mtdTarget * 100), ytdVs: r1(r.ytd / r.ytdTarget * 100), dod: r1((r.today / r.yesterday - 1) * 100) });
  };
  P.fin.segments = function (dim) { return D.FIN.revSeg[dim || 'client'].map(function (x) { return { id: x[0], n: x[1], rev: x[2] * JT, kg: x[3], pcs: x[4] }; }); };
  // P&L (§12) for a month index into plMonths (default: last closed month).
  P.fin.pl = function (i) {
    var p = D.FIN.pl, m = D.FIN.plMonths; if (i == null) i = m.length - 1;
    var rev = p.revenue[i] * JT, cogs = p.cogs[i] * JT, opex = p.opex[i] * JT, other = p.other[i] * JT, tax = p.tax[i] * JT;
    var gross = rev - cogs, op = gross - opex, pretax = op + other, net = pretax - tax;
    return { m: m[i], revenue: rev, cogs: cogs, gross: gross, opex: opex, op: op, other: other, pretax: pretax, tax: tax, net: net, gm: r1(gross / rev * 100), om: r1(op / rev * 100), nm: r1(net / rev * 100), cost: cogs + opex };
  };
  function plSum(idx) { var a = idx.map(function (i) { return P.fin.pl(i); }); var o = {}; ['revenue', 'cogs', 'gross', 'opex', 'op', 'net', 'cost'].forEach(function (k) { o[k] = sum(a.map(function (x) { return x[k]; })); }); o.nm = r1(o.net / o.revenue * 100); o.gm = r1(o.gross / o.revenue * 100); return o; }
  // Profit growth (§13): MoM (Sep vs Aug), QoQ (Q3 vs Q2), YoY (Sep 2026 vs Sep 2025)
  P.fin.growth = function () {
    function g(a, b) { return { gross: r1((a.gross / b.gross - 1) * 100), op: r1((a.op / b.op - 1) * 100), net: r1((a.net / b.net - 1) * 100), margin: r1(a.nm - b.nm), cost: r1((a.cost / b.cost - 1) * 100) }; }
    return { mom: g(P.fin.pl(6), P.fin.pl(5)), qoq: g(plSum([4, 5, 6]), plSum([1, 2, 3])), yoy: g(P.fin.pl(6), P.fin.pl(0)) };
  };
  P.fin.expenses = function () {
    var th = S().cfg.expThreshold;
    var rows = D.FIN.expenses.map(function (e) {
      var b = e[2] * JT, a = e[3] * JT, v = a - b, pct = r1(v / b * 100);
      return { k: e[0], n: e[1], budget: b, actual: a, var: v, pct: pct, alert: pct > th, trend: (D.FIN.expTrend[e[0]] || []).map(function (x) { return x * JT; }) };
    });
    var tb = sum(rows.map(function (r) { return r.budget; })), ta = sum(rows.map(function (r) { return r.actual; }));
    return { rows: rows, budget: tb, actual: ta, varPct: r2((ta - tb) / tb * 100), threshold: th };
  };
  P.fin.ue = function (dim) {
    var u = D.FIN.ue, pl = P.fin.pl();
    function row(id, n, rev, kg, pcs, cost) { return { id: id, n: n, rev: rev, kg: kg, pcs: pcs, cost: cost, revKg: Math.round(rev / kg), costKg: Math.round(cost / kg), profitKg: Math.round((rev - cost) / kg), margin: r1((rev - cost) / rev * 100), revPcs: Math.round(rev / pcs), costPcs: Math.round(cost / pcs), profitPcs: Math.round((rev - cost) / pcs) }; }
    var total = row('ALL', L('Total', 'Total'), pl.revenue, u.kg, u.pcs, pl.cost);
    var rows = dim ? u[dim].map(function (x) { return row(x[0], x[1], x[2] * JT, x[3], x[4], x[5] * JT); }) : [];
    return { total: total, rows: rows };
  };
  P.BUCKETS = [['current', L('Lancar', 'Current')], ['b30', L('1–30 hari', '1–30 days')], ['b60', L('31–60 hari', '31–60 days')], ['b90', L('61–90 hari', '61–90 days')], ['b90p', L('90+ hari', '90+ days')]];
  P.fin.ar = function () {
    var items = D.FIN.ar.map(function (i) {
      var age = P.days(i.due, P.TODAY);
      var b = age <= 0 ? 'current' : age <= 30 ? 'b30' : age <= 60 ? 'b60' : age <= 90 ? 'b90' : 'b90p';
      return Object.assign({}, i, { age: age, bucket: b });
    });
    var buckets = {}; P.BUCKETS.forEach(function (b) { buckets[b[0]] = sum(items.filter(function (i) { return i.bucket === b[0]; }).map(function (i) { return i.amt; })); });
    var total = sum(items.map(function (i) { return i.amt; })), overdue = total - buckets.current;
    var rev90 = sum([4, 5, 6].map(function (i) { return P.fin.pl(i).revenue; }));
    var byCl = {}; items.filter(function (i) { return i.age > 0; }).forEach(function (i) { byCl[i.cl] = (byCl[i.cl] || 0) + i.amt; });
    var top = Object.keys(byCl).map(function (c) { return { cl: c, amt: byCl[c], oldest: Math.max.apply(null, items.filter(function (i) { return i.cl === c; }).map(function (i) { return i.age; })) }; }).sort(function (a, b) { return b.amt - a.amt; });
    var upcoming = items.filter(function (i) { return i.age <= 0 && i.age >= -14; }).sort(function (a, b) { return b.age - a.age; });
    return {
      items: items, total: total, buckets: buckets, overdue: overdue, overdueRatio: r1(overdue / total * 100), over60Share: r1((buckets.b90 + buckets.b90p) / total * 100),
      dso: r1(total / rev90 * 90), collection: r1(D.FIN.collectedSep / D.FIN.dueSep * 100), top: top, upcoming: upcoming
    };
  };
  P.AP_CATS = { supplier: L('Supplier', 'Supplier'), payroll: L('Gaji & BPJS', 'Payroll & BPJS'), tax: L('Pajak', 'Tax'), rent: L('Sewa', 'Rent'), utilities: L('Utilitas', 'Utilities'), other: L('Kewajiban lain', 'Other obligations') };
  P.fin.ap = function () {
    var items = D.FIN.ap.map(function (x) { return Object.assign({}, x, { days: P.days(P.TODAY, x.due) }); });
    function due(d) { return sum(items.filter(function (x) { return x.days <= d; }).map(function (x) { return x.amt; })); }
    var byCat = {}; Object.keys(P.AP_CATS).forEach(function (c) { byCat[c] = sum(items.filter(function (x) { return x.cat === c && x.days <= 30; }).map(function (x) { return x.amt; })); });
    return { items: items, dueToday: due(0), due7: due(7), due30: due(30), byCat: byCat };
  };
  P.fin.health = function () { var l = P.lines('FH'); return { lines: l, score: P.score(l).score, band: P.band(P.score(l).score), hist: [82.0, 84.1, 80.6, 85.3, 87.9] }; };

  /* ---------- Business Health (§3–§5) ---------- */
  P.PILLARS = [
    { k: 'fin', n: L('Financial Health', 'Financial Health'), short: L('Keuangan', 'Financial'), w: 25, icon: 'coins', dim: 'fin' },
    { k: 'ops', n: L('Operations Health', 'Operations Health'), short: L('Operasional', 'Operations'), w: 20, icon: 'washer', dim: 'ops' },
    { k: 'cli', n: L('Client Health', 'Client Health'), short: L('Klien', 'Client'), w: 20, icon: 'hotel', dim: 'cli' },
    { k: 'qlt', n: L('Quality Health', 'Quality Health'), short: L('Kualitas', 'Quality'), w: 15, icon: 'shield', dim: 'qlt' },
    { k: 'ppl', n: L('People Health', 'People Health'), short: L('People', 'People'), w: 10, icon: 'users', dim: 'ppl' },
    { k: 'fut', n: L('Future Health', 'Future Health'), short: L('Masa Depan', 'Future'), w: 10, icon: 'bulb', dim: 'inv' }
  ];
  function ind(n, dir, target, actual, unit, kpi, o) { var k = Object.assign({ dir: dir, target: target, cap: 100 }, o || {}); var a = P.ach(k, actual); return Object.assign({ n: n, dir: dir, target: target, actual: actual, unit: unit, kpi: kpi, ach: a, pts: P.pts(k, a), st: P.kst(P.pts(k, a)) }, o || {}); }
  P.indicators = function (pk) {
    var cash = P.fin.cash(), rev = P.fin.revenue(), pl = P.fin.pl(), ar = P.fin.ar(), ap = P.fin.ap(), K = function (c) { return P.actual(P.kpi(c)); };
    var payOk = D.FIN.payments.filter(function (p) { return p.days <= 3; }).length / D.FIN.payments.length * 100;
    switch (pk) {
      case 'fin': return [ind(L('Kas tersedia', 'Available cash'), 'higher', S().cfg.cashTarget, cash.available, 'Rp', 'FH-03'), ind(L('Revenue MTD vs target', 'Revenue MTD vs target'), 'higher', rev.mtdTarget, rev.mtd, 'Rp', 'FIN-01'), ind(L('Net margin', 'Net margin'), 'higher', 20, pl.nm, '%', 'FIN-03'), ind(L('AR jatuh tempo', 'Overdue AR'), 'lower', 30, ar.overdueRatio, '%', 'FIN-04', { floor: null }), ind(L('AP terlambat', 'Late AP'), 'binary', 0, 0, L('item', 'items'), 'FH-07', { zero: true }), ind(L('Gross margin', 'Gross margin'), 'higher', 58, pl.gm, '%', 'FIN-02')];
      case 'ops': return [ind(L('Volume', 'Volume'), 'higher', 37000, D.FIN.ue.kg, 'kg', 'OPS-02'), ind('SLA', 'higher', 96, K('OPS-01'), '%', 'OPS-01'), ind(L('Kapasitas', 'Capacity'), 'range', 82.5, K('OPS-03'), '%', 'OPS-03', { lo: 75, hi: 90 }), ind(L('Produktivitas', 'Productivity'), 'higher', 42, K('OPS-02'), 'kg/jam', 'OPS-02'), ind('Turnaround', 'lower', 24, K('OPS-04'), L('jam', 'h'), 'OPS-04'), ind(L('Bottleneck (antrian dryer)', 'Bottleneck (dryer queue)'), 'lower', 2, 3.1, L('jam', 'h'), 'OPS-05', { floor: 50 })];
      case 'cli': return [ind(L('Pertumbuhan revenue klien', 'Client revenue growth'), 'higher', 12, K('CLI-01'), '%', 'CLI-01'), ind(L('Klien baru', 'New clients'), 'higher', 3, K('CLI-05'), L('klien', 'clients'), 'CLI-05', { floor: null }), ind(L('Retensi', 'Retention'), 'higher', 95, K('CLI-02'), '%', 'CLI-02'), ind(L('Komplain', 'Complaints'), 'lower', 3, K('CLI-03'), '/1.000', 'CLI-03', { floor: 50 }), ind(L('Kontrak diperpanjang tepat waktu', 'Contracts renewed on time'), 'higher', 90, 83, '%', 'CLI-02', { floor: 50 }), ind(L('Perilaku bayar (≤ 3 hari)', 'Payment behaviour (≤ 3 days)'), 'higher', 80, r1(payOk), '%', 'FIN-04', { floor: 50 })];
      case 'qlt': return [ind('QC', 'higher', 97.5, K('QLT-01'), '%', 'QLT-01'), ind('Rewash', 'lower', 2, K('QLT-02'), '%', 'QLT-02'), ind(L('Klaim', 'Claims'), 'lower', 2, K('QLT-03'), L('klaim', 'claims'), 'QLT-03', { floor: null }), ind(L('Kerusakan', 'Damage'), 'lower', 0.1, K('QLT-04'), '%', 'QLT-04'), ind(L('Barang hilang', 'Lost items'), 'binary', 0, K('QLT-05'), L('item', 'items'), 'QLT-05', { zero: true })];
      case 'ppl': return [ind('Teamwork Score', 'formula', 85, K('PPL-02'), L('skor', 'score'), 'PPL-02'), ind('Personal Score', 'formula', 85, K('PPL-05'), L('skor', 'score'), 'PPL-05'), ind(L('Produktivitas', 'Productivity'), 'higher', 42, K('OPS-02'), 'kg/jam', 'OPS-02'), ind(L('Kehadiran', 'Attendance'), 'higher', 97, K('PPL-01'), '%', 'PPL-01'), ind(L('Pengembangan (jam latih)', 'Development (training h)'), 'higher', 4, K('PPL-03'), L('jam', 'h'), 'PPL-03', { floor: null })];
      case 'fut': return [ind(L('Inovasi (proyek)', 'Innovation (projects)'), 'higher', 4, K('INV-01'), L('proyek', 'projects'), 'INV-01', { floor: null }), ind(L('Otomasi', 'Automation'), 'higher', 35, K('INV-02'), '%', 'INV-02', { floor: 50 }), ind(L('Keberlanjutan (air/kg)', 'Sustainability (water/kg)'), 'lower', 8, K('INV-03'), 'L/kg', 'INV-03'), ind(L('Ide perbaikan dijalankan', 'Improvement ideas implemented'), 'higher', 2, 2, L('ide', 'ideas'), 'INV-01', { floor: null }), ind(L('Inisiatif pertumbuhan', 'Growth initiatives'), 'higher', 60 * JT, K('INV-04'), 'Rp', 'INV-04', { floor: null })];
    }
    return [];
  };
  P.pillar = function (pk) {
    var meta = by(P.PILLARS, 'k', pk), inds = P.indicators(pk), score = r1(avg(inds.map(function (i) { return i.pts; })));
    var dh = P.dimHist(meta.dim), delta = r1(dh[dh.length - 1] - dh[dh.length - 2]);
    var top = P.attention().filter(function (a) { return a.pillar === pk; })[0] || null;
    return Object.assign({}, meta, { score: score, band: P.band(score), inds: inds, delta: delta, trend: dh, top: top, kpis: P.kpis(by(D.XDIMS, 'k', meta.dim).sc) });
  };
  P.health = function () {
    var ps = P.PILLARS.map(function (p) { return P.pillar(p.k); });
    var score = r1(sum(ps.map(function (p) { return p.score * p.w; })) / 100);
    return { score: score, band: P.band(score), pillars: ps, check: P.validateWeights(P.PILLARS.map(function (p) { return p.w; })) };
  };
  // Top KPI strip (§3)
  P.strip = function () {
    var h = P.health(), fh = P.fin.health(), x = P.xscore(), rev = P.fin.revenue(), pl = P.fin.pl(), cash = P.fin.cash(), ar = P.fin.ar();
    return { health: h.score, fin: fh.score, xscore: x.score, revMtd: rev.mtd, revTarget: rev.mtdTarget, net: pl.net, nm: pl.nm, cash: cash.available, sla: P.actual(P.kpi('OPS-01')), ar: ar.total, arOver: ar.overdue, rev: rev };
  };

  /* ---------- Attention engine (§6) & alert priority (§73) ---------- */
  function sevRank(a) { return (P.SEV[a.sev] || P.SEV.info).rank; }
  // §6: severity → financial impact → KPI weight → due time → strategic importance
  P.sortAttention = function (list) { return list.slice().sort(function (a, b) { return (sevRank(b) - sevRank(a)) || (b.fin - a.fin) || (b.w - a.w) || (ms(a.due) - ms(b.due)) || (b.str - a.str); }); };
  // §73: severity → financial impact → KPI weight → strategic impact → due time
  P.sortAlerts = function (list) { return list.slice().sort(function (a, b) { return (sevRank(b) - sevRank(a)) || (b.fin - a.fin) || (b.w - a.w) || (b.str - a.str) || (ms(a.due) - ms(b.due)); }); };
  P.attention = function () { return P.sortAttention(D.ATTENTION); };
  P.alerts = function () { return P.sortAlerts(D.ATTENTION); };
  P.ATT_ACTIONS = [['review', L('Review', 'Review'), 'eye', 'di.view'], ['assign', L('Assign', 'Assign'), 'usercheck', 'di.act'], ['investigate', L('Investigasi', 'Investigate'), 'search', 'di.act'], ['approve', L('Approve', 'Approve'), 'filecheck', 'apr.view'], ['action', L('Buat Aksi', 'Create Action'), 'plus', 'di.act'], ['source', L('Buka Data Sumber', 'Open Source Data'), 'database', null]];

  /* ---------- Goals (§19–§22) ---------- */
  P.LEVELS = [
    { k: 'roadmap', n: L('Roadmap 3 Tahun', '3-Year Roadmap'), p: L('3 tahun', '3 years'), icon: 'route' }, { k: 'orbital', n: L('Orbital Goal', 'Orbital Goal'), p: L('1 tahun', '1 year'), icon: 'target' },
    { k: 'business', n: L('Business Goal', 'Business Goal'), p: L('6 bulan', '6 months'), icon: 'briefcase' }, { k: 'quarterly', n: L('Quarterly Goal', 'Quarterly Goal'), p: L('Kuartal', 'Quarter'), icon: 'calendar' },
    { k: 'stracon', n: L('Monthly STRACON', 'Monthly STRACON'), p: L('Bulanan', 'Monthly'), icon: 'clipboard' }, { k: 'weekly', n: L('Weekly Race', 'Weekly Race'), p: L('Mingguan', 'Weekly'), icon: 'flag' },
    { k: 'daily', n: L('Daily Race', 'Daily Race'), p: L('Harian', 'Daily'), icon: 'zap' }
  ];
  P.lvlIdx = function (k) { return P.LEVELS.map(function (l) { return l.k; }).indexOf(k); };
  P.THEMES = { growth: L('Pertumbuhan', 'Growth'), client: L('Klien', 'Client'), financial: L('Keuangan', 'Financial'), operations: L('Operasional', 'Operations') };
  P.goalRaw = function (id) { return by(S().goals, 'id', id); };
  P.children = function (id) { return S().goals.filter(function (g) { return g.parent === id; }); };
  // Every lower level links upward to the level directly above (§19).
  P.validateGoal = function (g) {
    var li = P.lvlIdx(g.lvl);
    if (li < 0) return { ok: false, msg: L('Level goal tidak dikenal.', 'Unknown goal level.') };
    if (li === 0) return g.parent ? { ok: false, msg: L('Roadmap tidak punya induk.', 'A roadmap has no parent.') } : { ok: true };
    var p = P.goalRaw(g.parent);
    if (!p) return { ok: false, msg: L('Goal wajib terhubung ke goal di atasnya.', 'A goal must link to the goal above it.') };
    if (P.lvlIdx(p.lvl) !== li - 1) return { ok: false, msg: L('Induk harus satu level di atas.', 'The parent must be exactly one level up.') };
    return { ok: true };
  };
  P.validateCascade = function () { return S().goals.map(function (g) { return { id: g.id, r: P.validateGoal(g) }; }).filter(function (x) { return !x.r.ok; }); };
  // Progress prefers system sources (§21): KPIs, milestones, races, children. Manual adjustment needs permission + reason.
  P.goalProgress = function (g) {
    if (typeof g === 'string') g = P.goalRaw(g);
    if (g.adj) return { v: g.adj.v, src: 'manual' };
    var parts = [];
    var ks = (g.kpis || []).map(P.kpi).filter(Boolean);
    if (ks.length) parts.push({ v: avg(ks.map(function (k) { return Math.min(100, P.line(k).pts || 0); })), w: 0.6, src: 'kpi' });
    if (g.ms && g.ms.length) parts.push({ v: g.ms.filter(function (m) { return m[2]; }).length / g.ms.length * 100, w: 0.4, src: 'ms' });
    var races = S().daily.filter(function (r) { return r.goal === g.id; }).concat(S().weekly.filter(function (r) { return r.goal === g.id; }).map(function (r) { return { prog: Math.min(100, P.weeklyLine(r).ach) }; }));
    if (races.length) parts.push({ v: avg(races.map(function (r) { return r.prog; })), w: 0.5, src: 'race' });
    if (!parts.length) {
      var ch = P.children(g.id).filter(function (c) { return c.status !== 'cancelled'; });
      if (ch.length) return { v: r1(avg(ch.map(function (c) { return P.goalProgress(c).v; }))), src: 'children' };
      return { v: 0, src: 'none' };
    }
    var w = sum(parts.map(function (p) { return p.w; }));
    return { v: r1(sum(parts.map(function (p) { return p.v * p.w; })) / w), src: parts.map(function (p) { return p.src; }).join('+') };
  };
  P.goalStatus = function (g) {
    if (typeof g === 'string') g = P.goalRaw(g);
    if (g.status === 'cancelled' || g.status === 'completed') return g.status;
    var p = P.goalProgress(g).v;
    if (p >= 100 && g.ms && g.ms.every(function (m) { return m[2]; })) return 'completed';
    return P.kst(p);
  };
  P.goal = function (id) {
    var g = P.goalRaw(id); if (!g) return null;
    var pr = P.goalProgress(g);
    return Object.assign({}, g, { progress: pr.v, progSrc: pr.src, status: P.goalStatus(g), parentGoal: g.parent ? P.goalRaw(g.parent) : null, kids: P.children(id), lines: (g.kpis || []).map(P.kpi).filter(Boolean).map(function (k) { return P.line(k); }), valid: P.validateGoal(g) });
  };
  P.goalAdjust = function (ctx, id, value, reason) {
    if (!can(ctx, 'goal.adjust')) return deny(ctx, id + ' adjust');
    if (!String(reason || '').trim()) return { ok: false, code: 'reason', msg: P.MSG.reason };
    var g = P.goalRaw(id); if (!g) return { ok: false, code: 'notfound', msg: P.MSG.notfound };
    var from = P.goalProgress(g).v; g.adj = { v: clamp(+value, 0, 100), reason: reason, by: ctx.uid, at: P.now() }; g.v = (g.v || 1) + 1; save();
    P.audit('GOAL.ADJUST', ctx, { target: id, from: from, to: g.adj.v, reason: reason, v: g.v });
    return { ok: true };
  };
  P.goalCreate = function (ctx, g) {
    if (!can(ctx, 'goal.edit')) return deny(ctx, 'new goal');
    var v = P.validateGoal(g); if (!v.ok) return { ok: false, code: 'invalid', msg: v.msg };
    var rec = Object.assign({ theme: 'operations', kpis: [], v: 1 }, g); S().goals.push(rec); save();
    P.audit('GOAL.CREATE', ctx, { target: g.id, to: g.lvl, v: 1 });
    return { ok: true, g: rec };
  };

  /* ---------- Teams (§35–§39) — Teamwork Score from shared team KPIs only ---------- */
  P.team = function (k) {
    var t = by(D.TEAMS, 'k', k); if (!t) return null;
    var lines = t.kpis.map(function (x) { return P.line(Object.assign({ cap: 100, cat: 'operations', pri: 'high' }, x)); });
    var s = P.score(lines);
    var trend = t.trend.slice(0, -1).concat([s.score]);
    return Object.assign({}, t, { lines: lines, score: s.score, valid: s.valid, band: P.band(s.score), trend: trend, delta: r1(s.score - trend[trend.length - 2]) });
  };
  P.teamScore = function (k) { var t = by(D.TEAMS, 'k', k); return t ? P.score(t.kpis.map(function (x) { return P.line(Object.assign({ cap: 100 }, x)); })).score : 0; };
  P.teams = function () { return D.TEAMS.map(function (t) { return P.team(t.k); }); };
  P.memberAvg = function (k) { var t = by(D.TEAMS, 'k', k); return r1(avg(t.members.map(function (m) { return P.person(m).score; }))); };

  /* ---------- Personal Score (§40–§45) ----------
     Personal = individual KPI × w + team contribution × (100 − w), w by role.
     Team contribution = team result (Teamwork Score) and the member's own contribution. */
  P.formula = function (role) { var f = S().cfg.personal; return f[role] || f.def; };
  P.setFormula = function (ctx, role, ind, team) {
    if (!can(ctx, 'hr.config')) return deny(ctx, 'personal formula');
    if (!P.validateWeights([ind, team]).ok) return { ok: false, code: 'sum100', msg: P.MSG.sum100 };
    var from = P.formula(role); S().cfg.personal[role] = { ind: ind, team: team }; save();
    P.audit('CONFIG.PERSONAL', ctx, { target: role, from: from.ind + '/' + from.team, to: ind + '/' + team });
    return { ok: true };
  };
  P.person = function (id) {
    var p = by(D.PEOPLE, 'id', id); if (!p) return null;
    var rk = D.ROLE_KPIS[p.role];
    var lines = rk.kpis.map(function (x, i) { var k = { code: x[0], n: x[1], dir: x[2], target: x[3], unit: x[4], weight: x[5], cap: 100, cat: 'people', pri: 'high' }; if (x.length > 6) k.floor = x[6]; return P.line(k, p.ind[i]); });
    var ind = P.score(lines).score, team = P.teamScore(p.team), tc = S().cfg.teamComp;
    var teamPart = r1((team * tc.result + p.contrib * tc.member) / 100);
    var f = P.formula(p.role), score = r1((ind * f.ind + teamPart * f.team) / 100);
    var hist = p.hist.slice(0, -1).concat([score]), valid = hist.filter(function (x) { return x > 0; });
    var srt = lines.slice().sort(function (a, b) { return (b.pts - a.pts) || (b.ach - a.ach); });
    var prev3 = hist[hist.length - 4] || valid[0];
    return Object.assign({}, p, {
      roleN: rk.n, lines: lines, ind: ind, teamScore: team, teamPart: teamPart, f: f, score: score, band: P.band(score), hist: hist,
      avg3: r1(avg(valid.slice(-3))), avg6: r1(avg(valid.slice(-6))), delta: r1(score - (hist[hist.length - 2] || score)), trend: P.trendOf(valid.slice(-6), 'higher'),
      strength: srt[0], attention: srt[srt.length - 1], improve: r1(score - prev3), hr: P.hr(id)
    });
  };
  P.people = function () { return D.PEOPLE.map(function (p) { return P.person(p.id); }); };
  P.hr = function (id) {
    var h = D.HR[id] || {};
    var p = by(D.PEOPLE, 'id', id) || {};
    return {
      att: h.att || { days: 22, present: 21, late: 1, absent: 0, leave: 0 }, coaching: h.coaching || [], training: h.training || [], achievement: h.achievement || [], recognition: h.recognition || [],
      probation: h.probation || { st: p.st === 'probation' ? 'ongoing' : 'passed', end: null }, pip: h.pip || null, promo: h.promo || { k: '6-12', note: L('Dinilai ulang di review semester.', 'Reassessed at the half-year review.') }
    };
  };
  // HR decision rule (§45): signals only. Every item needs a human decision; nothing is automatic.
  P.HR_RULE = L('Skor kinerja mendukung keputusan HR, tidak menggantikan penilaian manusia. Sistem tidak pernah memberhentikan, mendisiplinkan atau mempromosikan karyawan secara otomatis.', 'Performance scores support HR decisions and never replace human judgement. The system never terminates, disciplines or promotes anyone automatically.');
  P.hrSignals = function (id) {
    var p = P.person(id), out = [];
    if (p.score < 75) out.push({ k: 'coaching', t: L('Pertimbangkan coaching terstruktur', 'Consider structured coaching'), why: L('Personal Score ' + p.score + ' di bawah 75', 'Personal Score ' + p.score + ' below 75') });
    if (p.trend === 'declining') out.push({ k: 'review', t: L('Diskusikan tren menurun dengan atasan', 'Discuss the declining trend with the manager'), why: L('Skor turun 6 bulan terakhir', 'Score falling over 6 months') });
    if (p.attention && p.attention.pts < 75) out.push({ k: 'training', t: L('Pertimbangkan pelatihan: ' + p.attention.k.n[0], 'Consider training: ' + p.attention.k.n[1]), why: L('Pencapaian ' + p.attention.ach + '%', 'Achievement ' + p.attention.ach + '%') });
    if (p.score >= 90) out.push({ k: 'recognition', t: L('Pertimbangkan rekognisi', 'Consider recognition'), why: L('Personal Score ≥ 90', 'Personal Score ≥ 90') });
    return out.map(function (x) { return Object.assign(x, { human: true, auto: false }); });
  };

  // HR notes (§44): coaching, recognition, training plans. Recorded by people with hr.manage; never automatic.
  P.HR_NOTE_KINDS = { coaching: L('Coaching', 'Coaching'), recognition: L('Rekognisi', 'Recognition'), training: L('Rencana pelatihan', 'Training plan'), note: L('Catatan', 'Note') };
  P.hrNote = function (ctx, id, kind, text) {
    if (!can(ctx, 'hr.manage')) return deny(ctx, id + ' hr');
    if (!P.HR_NOTE_KINDS[kind] || !String(text || '').trim()) return { ok: false, code: 'invalid', msg: P.MSG.invalid };
    var n = { emp: id, kind: kind, text: text, by: ctx.name || ctx.uid, at: P.now() };
    S().notes.unshift(n); save(); P.audit('HR.NOTE', ctx, { target: id, to: kind, reason: text });
    return { ok: true, n: n };
  };
  P.hrNotes = function (id) { return S().notes.filter(function (n) { return n.emp === id; }); };

  /* ---------- Race (§46–§52) ---------- */
  P.LEADER_ACTIONS = [['view', L('Lihat KPI', 'View KPI')], ['reviewed', L('Tandai sudah direview', 'Mark reviewed')], ['rootCause', L('Tambah root cause', 'Add root cause')], ['issue', L('Tambah issue', 'Add issue')], ['recovery', L('Buat recovery action', 'Create recovery action')], ['pic', L('Tentukan PIC', 'Assign PIC')], ['due', L('Tentukan due date', 'Set due date')], ['link', L('Hubungkan Daily Race', 'Link Daily Race')], ['evidence', L('Lampirkan bukti', 'Attach evidence')], ['carry', L('Bawa issue ke depan', 'Carry forward issue')], ['close', L('Tutup diskusi', 'Close discussion')], ['decision', L('Catat keputusan', 'Record decision')]];
  P.LEADER_CANNOT = [['target', L('Target resmi', 'Official target'), 'kpi.edit'], ['formula', L('Formula KPI', 'KPI formula'), 'kpi.edit'], ['weight', L('Bobot KPI', 'KPI weight'), 'kpi.weight'], ['structure', L('Struktur scorecard', 'Scorecard structure'), 'kpi.weight']];
  P.racePerm = function (ctx, action) {
    var no = by(P.LEADER_CANNOT.map(function (x) { return { k: x[0], p: x[2] }; }), 'k', action);
    if (no) return can(ctx, no.p);
    if (action === 'view') return can(ctx, 'race.view') || can(ctx, 'race.lead');
    return can(ctx, 'race.lead');
  };
  P.daily = function (ctx, scope) {
    var all = S().daily;
    if (scope === 'mine' && ctx && ctx.employee) return all.filter(function (r) { return r.pic === ctx.employee.id; });
    return all;
  };
  P.needsUpload = function (r) { return !(r.ev && r.ev.sys && r.ev.sys.length); };
  // Weekly race: achievement, variance, status; running totals are judged against pace (§48).
  P.WEEK_ELAPSED = 2 / 7;   // Monday + Tuesday of week 41
  P.weeklyLine = function (r) {
    var k = { dir: r.dir || 'higher', target: r.target, cap: 150 };
    var ach = P.ach(k, r.actual), variance = r.dir === 'lower' ? r2(r.target - r.actual) : r2(r.actual - r.target);
    var pace = r.pace ? r1(r.actual / (r.target * P.WEEK_ELAPSED) * 100) : null;
    var pts = P.pts(k, r.pace ? Math.min(pace, 100) : ach);
    return Object.assign({}, r, { ach: ach, pts: pts, variance: variance, pace: pace, st: P.kst(pts) });
  };
  P.weekly = function () { return S().weekly.map(P.weeklyLine); };
  P.raceUpdate = function (ctx, id, ch) {
    var r = by(S().daily, 'id', id) || by(S().weekly, 'id', id); if (!r) return { ok: false, code: 'notfound', msg: P.MSG.notfound };
    var own = ctx && ctx.employee && ctx.employee.id === r.pic;
    if (!can(ctx, 'race.edit') && !own) return deny(ctx, id);
    if (ch.target != null && ch.target !== r.target && !can(ctx, 'kpi.edit')) return deny(ctx, id + ' target');
    var from = r.prog != null ? r.prog + '%' : r.actual;
    Object.keys(ch).forEach(function (f) { r[f] = ch[f]; });
    if (r.prog != null && r.target) { if (ch.actual != null) r.prog = clamp(Math.round(r.actual / r.target * 100), 0, 100); if (r.prog >= 100 && !ch.status) r.status = 'done'; }
    save(); P.audit('RACE.UPDATE', ctx, { target: id, from: from, to: r.prog != null ? r.prog + '%' : r.actual });
    return { ok: true, r: r };
  };
  P.raceAdd = function (ctx, item) {
    if (!can(ctx, 'race.edit')) return deny(ctx, 'new race');
    if (!item.n || !item.pic || !item.goal || !item.kpi || item.target == null) return { ok: false, code: 'invalid', msg: P.MSG.invalid };
    var g = P.goalRaw(item.goal); if (!g) return { ok: false, code: 'invalid', msg: L('Race wajib terhubung ke goal.', 'A race must link to a goal.') };
    var rec = Object.assign({ id: 'DR-' + String(S().daily.length + 1).padStart(2, '0') + '-' + String(P.now()).slice(-4), actual: 0, prog: 0, blocker: '', ev: { sys: [], files: 0 }, status: 'on', result: '', follow: '', deadline: P.TODAY + ' 17:00', unit: '' }, item);
    S().daily.push(rec); save(); P.audit('RACE.CREATE', ctx, { target: rec.id, to: T0(item.n) });
    return { ok: true, r: rec };
  };
  function T0(x) { return Array.isArray(x) ? x[0] : x; }

  /* ---------- R2RE KPI Review Board (§49–§52) ---------- */
  P.R2_WEEKS = D.R2_WEEKS;
  P.r2Idx = function (wk) { return D.R2_WEEKS.map(function (w) { return w.k; }).indexOf(wk); };
  P.r2Line = function (k, wk) {
    var i = P.r2Idx(wk), a = P.weekValue(k, k.w[i]), prev = i > 0 ? P.weekValue(k, k.w[i - 1]) : null;
    var l = P.line(k, a == null ? null : r2(a));
    l.prev = prev == null ? null : r2(prev); l.trend = prev == null ? 'stable' : P.trendOf([prev, a], k.dir);
    l.vals = k.w.map(function (row) { var v = P.weekValue(k, row); return v == null ? null : r2(v); });
    return l;
  };
  P.r2Board = function (wk) {
    wk = wk || 'W40';
    var sc = P.scorecard('R2-UBD'), lines = P.kpis('R2-UBD').map(function (k) { return P.r2Line(k, wk); });
    var sorted = P.sortRace(lines), s = P.score(lines), rv = (S().reviews[wk] || {});
    var w = by(D.R2_WEEKS, 'k', wk), prevIdx = P.r2Idx(wk) - 1;
    var prevScore = prevIdx >= 0 ? P.score(P.kpis('R2-UBD').map(function (k) { return P.r2Line(k, D.R2_WEEKS[prevIdx].k); })).score : null;
    return {
      wk: wk, week: w, sc: sc, team: by(D.TEAMS, 'k', 'ops'), leader: 'EMP-021', lines: sorted, score: s.score, prev: prevScore, check: s.weights,
      counts: { total: lines.length, on: lines.filter(function (l) { return l.st === 'on'; }).length, risk: lines.filter(function (l) { return l.st === 'risk'; }).length, off: lines.filter(function (l) { return l.st === 'off'; }).length },
      reviews: rv, reviewed: Object.keys(rv).filter(function (c) { return rv[c].reviewed; }).length
    };
  };
  P.R2_FIELDS = ['why', 'rootCause', 'impact', 'recovery', 'pic', 'due', 'evidence', 'decision', 'reviewed', 'issue', 'link', 'carry', 'closed'];
  P.r2Review = function (ctx, wk, code, rec) {
    var prot = Object.keys(rec).filter(function (f) { return P.R2_FIELDS.indexOf(f) < 0; });
    if (prot.length) {
      var allowed = prot.every(function (f) { var x = by(P.LEADER_CANNOT.map(function (y) { return { k: y[0], p: y[2] }; }), 'k', f); return x ? can(ctx, x.p) : false; });
      if (!allowed) { P.audit('ACCESS.DENIED', ctx, { target: code + ' ' + prot.join(',') }); return { ok: false, code: 'protected', msg: P.MSG.protected }; }
    }
    if (!can(ctx, 'race.lead')) return deny(ctx, code + ' review');
    var r = S().reviews[wk] = S().reviews[wk] || {};
    r[code] = Object.assign({}, r[code] || {}, rec, { by: ctx.uid, at: P.now() });
    if (rec.reviewed == null) r[code].reviewed = true;
    save(); P.audit('R2RE.REVIEW', ctx, { target: wk + ' · ' + code, to: rec.decision || L('Direview', 'Reviewed')[0] });
    return { ok: true, rec: r[code] };
  };
  P.r2Next = function (wk, code) { var b = P.r2Board(wk), i = b.lines.map(function (l) { return l.k.code; }).indexOf(code); return b.lines[i + 1] ? b.lines[i + 1].k.code : null; };

  /* ---------- Monthly Reflection (§53–§68) ---------- */
  P.REFL_WEEKS = ['W37', 'W38', 'W39', 'W40'];
  P.REFL_FLOW = [['draft', L('Draft', 'Draft'), 'refl.edit'], ['leader', L('Review Race Leader', 'Race Leader Review'), 'race.lead'], ['manager', L('Review Manager', 'Manager Review'), 'refl.review'], ['owner', L('Persetujuan Director / Owner', 'Director / Owner Approval'), 'refl.approve'], ['frozen', L('Frozen', 'Frozen'), 'refl.approve']];
  P.reflLine = function (k, weeks) {
    var idx = weeks.map(P.r2Idx), rows = idx.map(function (i) { return k.w[i]; });
    var monthly = P.aggregate(k.agg, rows), ach = P.ach(k, monthly == null ? null : monthly);
    var target = k.agg === 'sum' && k.tw ? k.tw * weeks.length : k.target;
    if (k.agg === 'sum' && k.tw) ach = P.ach(Object.assign({}, k, { target: target }), monthly);
    var pts = P.pts(k, ach);
    var vals = P.REFL_WEEKS.map(function (w) { var i = P.r2Idx(w); return weeks.indexOf(w) >= 0 ? r2(P.weekValue(k, k.w[i])) : null; });
    return { k: k, target: target, vals: vals, monthly: monthly == null ? null : r2(monthly), ach: ach, pts: pts, st: P.kst(pts), gap: monthly == null ? null : r2(monthly - target), trend: P.trendOf(vals, k.dir) };
  };
  /* Monthly normalisation (§55): each weekly scorecard is 100%; the month is also exactly 100%.
     Weekly weights are averaged (never added up to 400%) and normalised. */
  P.reflection = function (weeks) {
    weeks = weeks && weeks.length ? weeks : P.REFL_WEEKS;
    var ks = P.kpis('R2-UBD');
    var weights = P.normalize(ks.map(function (k) { return avg(weeks.map(function () { return k.weight; })); }));
    var lines = ks.map(function (k, i) { var l = P.reflLine(k, weeks); l.weight = weights[i]; l.ws = P.weighted(l.pts, l.weight); l.note = D.INSIGHT_NOTES[k.code] || null; return l; });
    var total = r2(sum(weights)), score = r1(Math.min(100, sum(lines.map(function (l) { return l.ws; }))));
    var issues = S().issues, open = issues.filter(function (x) { return x.status === 'open' || x.status === 'progress'; });
    var x = P.xscore();
    var goals = ['BG-H2-01', 'BG-H2-02'].map(P.goal);
    var srt = lines.slice().sort(function (a, b) { return (b.pts - a.pts) || (b.weight - a.weight); });
    var gapW = lines.slice().sort(function (a, b) { return (b.weight * (100 - b.pts)) - (a.weight * (100 - a.pts)); });
    var wwScores = P.REFL_WEEKS.map(function (w) { return P.score(ks.map(function (k) { return P.r2Line(k, w); })).score; });
    var prevMonth = P.score(ks.map(function (k) { return P.r2Line(k, 'W36'); })).score;
    return {
      month: S().refl.month, weeks: weeks, lines: P.sortRace(lines), total: total, score: score, weekScores: wwScores, prevScore: prevMonth, xscore: x.now, xdelta: x.delta,
      goalProg: r1(avg(goals.map(function (g) { return g.progress; }))), goals: goals,
      counts: { on: lines.filter(function (l) { return l.st === 'on'; }).length, risk: lines.filter(function (l) { return l.st === 'risk'; }).length, off: lines.filter(function (l) { return l.st === 'off'; }).length, total: lines.length },
      openIssues: open.length, closedIssues: issues.filter(function (i) { return i.status === 'resolved'; }).length,
      summary: {
        well: lines.filter(function (l) { return l.st === 'on'; }).map(function (l) { return l.k; }),
        attention: lines.filter(function (l) { return l.st !== 'on'; }).map(function (l) { return l.k; }),
        win: srt[0], risk: gapW[0], opp: D.OPPORTUNITY
      },
      status: S().refl
    };
  };
  P.trendSeries = function (weeks) { return P.kpis('R2-UBD').map(function (k) { return { k: k, vals: P.REFL_WEEKS.map(function (w) { return r2(P.weekValue(k, k.w[P.r2Idx(w)])); }) }; }); };
  P.reflNext = function () { var i = P.REFL_FLOW.map(function (f) { return f[0]; }).indexOf(S().refl.status); return P.REFL_FLOW[i + 1] || null; };
  P.reflTransition = function (ctx, to) {
    var r = S().refl, flow = P.REFL_FLOW.map(function (f) { return f[0]; }), i = flow.indexOf(r.status), j = flow.indexOf(to);
    if (r.status === 'frozen') return { ok: false, code: 'frozen', msg: P.MSG.frozen };
    if (j !== i + 1 && !(to === 'draft' && i > 0)) return { ok: false, code: 'transition', msg: P.MSG.transition };
    // Who may move it on: the permission of the stage being completed (sending back needs the same).
    var perm = to === 'draft' ? P.REFL_FLOW[i][2] : (j === flow.length - 1 ? 'refl.approve' : P.REFL_FLOW[i][2]);
    if (!can(ctx, perm)) return deny(ctx, 'reflection → ' + to);
    var from = r.status; r.status = to; r.log.push({ from: from, to: to, by: ctx.uid, name: ctx.name, at: P.now() });
    if (to === 'frozen') { r.frozenAt = P.now(); r.snapshot = { score: P.reflection().score, v: r.v }; }
    save(); P.audit('REFL.STATUS', ctx, { target: r.month, from: from, to: to, v: r.v });
    return { ok: true };
  };
  P.reflAmend = function (ctx, reason, approver, change) {
    var r = S().refl;
    if (r.status !== 'frozen') return { ok: false, code: 'transition', msg: P.MSG.transition };
    if (!can(ctx, 'refl.edit') && !can(ctx, 'refl.approve')) return deny(ctx, 'amend');
    if (!String(reason || '').trim()) return { ok: false, code: 'reason', msg: P.MSG.reason };
    if (!approver || !approver.perms || approver.perms.indexOf('refl.approve') < 0) return { ok: false, code: 'approver', msg: P.MSG.approver };
    r.v += 1; r.amend.push({ v: r.v, reason: reason, approver: approver.uid, approverName: approver.name, by: ctx.uid, at: P.now(), change: change || null });
    save(); P.audit('REFL.AMEND', ctx, { target: r.month, to: 'v' + r.v, reason: reason, v: r.v });
    return { ok: true, v: r.v };
  };
  // Carry forward (§61): keeps detected week, age, owner, linked KPI and history.
  P.issueAge = function (i) { var w = P.r2Idx(i.week), start = ['2026-08-31', '2026-09-07', '2026-09-14', '2026-09-21', '2026-09-28'][w] || P.TODAY; return P.days(start, P.TODAY); };
  P.carryForward = function (ctx, id) {
    if (!can(ctx, 'race.lead') && !can(ctx, 'refl.edit')) return deny(ctx, id + ' carry');
    var i = by(S().issues, 'id', id); if (!i) return { ok: false, code: 'notfound', msg: P.MSG.notfound };
    if (i.status === 'resolved') return { ok: false, code: 'transition', msg: L('Issue yang sudah selesai tidak perlu dibawa.', 'Resolved issues are not carried forward.') };
    i.carried = { to: '2026-10', at: P.now(), by: ctx.uid, age: P.issueAge(i) };
    i.hist = (i.hist || []).concat([[P.TODAY, L('Dibawa ke Oktober 2026', 'Carried forward to October 2026')]]);
    save(); P.audit('ISSUE.CARRY', ctx, { target: id, to: '2026-10' });
    return { ok: true, i: i };
  };
  /* Next STRACON draft (§67): prefilled from KPI gaps, open issues, insights, recommendations,
     goal progress and carried actions. Always starts as a draft that needs review. */
  P.straconDraft = function (ctx) {
    if (!can(ctx, 'stracon.create')) return deny(ctx, 'stracon');
    var R = P.reflection(), items = [];
    R.lines.filter(function (l) { return l.st !== 'on'; }).forEach(function (l) { items.push({ src: 'gap', t: L('Tutup gap ' + l.k.n[0], 'Close the ' + l.k.n[1] + ' gap'), kpi: l.k.code, owner: l.k.owner, why: l.note ? l.note.rec : null }); });
    S().issues.filter(function (i) { return i.carried || i.status === 'open' || i.status === 'progress'; }).forEach(function (i) { items.push({ src: i.carried ? 'carry' : 'issue', t: i.action, kpi: i.kpi, owner: i.owner, ref: i.id }); });
    D.INSIGHTS.filter(function (x) { return x.type === 'prescriptive' || x.type === 'predictive'; }).forEach(function (x) { items.push({ src: 'insight', t: x.rec, kpi: x.src, ref: x.id }); });
    R.goals.filter(function (g) { return g.status !== 'on'; }).forEach(function (g) { items.push({ src: 'goal', t: L('Percepat ' + g.n[0], 'Accelerate ' + g.n[1]), ref: g.id, owner: g.owner }); });
    var d = { id: 'STRACON-2610-D', month: '2026-10', status: 'draft', v: 1, items: items, by: ctx.uid, at: P.now() };
    S().stracon = d; save(); P.audit('STRACON.DRAFT', ctx, { target: d.id, to: items.length + ' items' });
    return { ok: true, d: d };
  };
  P.straconTransition = function (ctx, to) {
    var d = S().stracon; if (!d) return { ok: false, code: 'notfound', msg: P.MSG.notfound };
    if (to === 'review') { if (!can(ctx, 'stracon.create')) return deny(ctx, 'stracon review'); if (d.status !== 'draft') return { ok: false, code: 'transition', msg: P.MSG.transition }; }
    else if (to === 'active') { if (!can(ctx, 'refl.approve')) return deny(ctx, 'stracon activate'); if (d.status !== 'review') return { ok: false, code: 'review', msg: P.MSG.review }; }
    else return { ok: false, code: 'transition', msg: P.MSG.transition };
    var from = d.status; d.status = to; save(); P.audit('STRACON.STATUS', ctx, { target: d.id, from: from, to: to });
    return { ok: true };
  };

  /* ---------- Decision intelligence (§69–§76) ---------- */
  P.insights = function () { return D.INSIGHTS; };
  P.insight = function (id) { return by(D.INSIGHTS, 'id', id); };
  P.MGMT_ACTIONS = [['assign', L('Assign Owner', 'Assign Owner'), 'usercheck'], ['task', L('Buat Task', 'Create Task'), 'plus'], ['due', L('Tambah Due Date', 'Add Due Date'), 'calendar'], ['approve', L('Approve', 'Approve'), 'filecheck'], ['investigate', L('Investigasi', 'Investigate'), 'search'], ['review', L('Minta Review', 'Request Review'), 'eye'], ['note', L('Tambah Catatan', 'Add Note'), 'edit'], ['open', L('Buka Data Pendukung', 'Open Supporting Data'), 'database']];
  P.insightAct = function (ctx, id, act, o) {
    o = o || {};
    if (act === 'open') return { ok: true };
    var perm = act === 'approve' ? 'apr.view' : 'di.act';
    if (!can(ctx, perm)) return deny(ctx, id + ' ' + act);
    var ins = P.insight(id) || by(D.ATTENTION, 'id', id); if (!ins) return { ok: false, code: 'notfound', msg: P.MSG.notfound };
    if ((act === 'note' || act === 'review') && !String(o.note || o.owner || '').trim() && act === 'note') return { ok: false, code: 'invalid', msg: P.MSG.invalid };
    var task = { id: 'TSK-' + String(S().tasks.length + 1).padStart(3, '0'), src: id, act: act, owner: o.owner || null, due: o.due || null, note: o.note || null, by: ctx.uid, at: P.now(), status: 'open' };
    S().tasks.unshift(task); save(); P.audit('INSIGHT.ACTION', ctx, { target: id, to: act + (o.owner ? ' → ' + o.owner : ''), reason: o.note || null });
    return { ok: true, task: task };
  };
  P.tasksFor = function (src) { return S().tasks.filter(function (t) { return !src || t.src === src; }); };
  P.decisions = function () { return S().decisions; };
  P.decisionAdd = function (ctx, d) {
    if (!can(ctx, 'di.act')) return deny(ctx, 'decision');
    if (!d.d || !d.owner || !d.due) return { ok: false, code: 'invalid', msg: P.MSG.invalid };
    var rec = Object.assign({ id: 'DEC-' + String(S().decisions.length + 1).padStart(2, '0'), at: P.TODAY, src: null, exp: '', fu: d.due, act: '', status: 'notstarted', note: '', ev: '' }, d);
    S().decisions.unshift(rec); save(); P.audit('DECISION.CREATE', ctx, { target: rec.id, to: T0(rec.d) });
    return { ok: true, d: rec };
  };
  P.decisionUpdate = function (ctx, id, ch) {
    if (!can(ctx, 'di.act')) return deny(ctx, id);
    var d = by(S().decisions, 'id', id); if (!d) return { ok: false, code: 'notfound', msg: P.MSG.notfound };
    var from = d.status; Object.keys(ch).forEach(function (f) { d[f] = ch[f]; }); save();
    P.audit('DECISION.UPDATE', ctx, { target: id, from: from, to: d.status });
    return { ok: true, d: d };
  };
  P.brief = function () {
    var s = P.strip(), cash = P.fin.cash(), ar = P.fin.ar(), x = P.xscore(), wk = P.weekly(), people = P.people();
    return {
      fin: { cash: cash.available, rev: s.revMtd, revVs: s.rev.vsTarget, net: s.net, nm: s.nm, ar: ar.total, arOver: ar.overdue },
      ops: { vol: D.FIN.ue.kg, sla: s.sla, cap: P.actual(P.kpi('OPS-03')) },
      cli: { growth: P.actual(P.kpi('CLI-01')), decline: L('Hotel ABC −8% volume', 'Hotel ABC −8% volume'), complaint: P.actual(P.kpi('CLI-03')) },
      ppl: { team: P.FN.teamAvg(), risk: people.filter(function (p) { return p.score < 75 || p.hr.pip; }).length },
      amb: { xscore: x.now, xdelta: x.delta, goal: r1(avg(['BG-H2-01', 'BG-H2-02'].map(function (g) { return P.goal(g).progress; }))), race: wk.filter(function (w) { return w.st === 'on'; }).length + ' / ' + wk.length, refl: P.reflection().score },
      alerts: P.alerts().slice(0, 5), recs: D.INSIGHTS.slice().sort(function (a, b) { return (P.SEV[b.sev].rank - P.SEV[a.sev].rank) || (b.impact - a.impact); }).slice(0, 5)
    };
  };
  P.EXPORT_FORMATS = [['pdf', 'PDF'], ['xls', 'Excel'], ['csv', 'CSV']];
  P.reports = function (ctx) { return D.REPORTS.map(function (r) { return Object.assign({}, r, { allowed: can(ctx, r.perm), exportable: can(ctx, r.perm) && can(ctx, 'rpt.export') }); }); };
  function csvCell(v) { v = Array.isArray(v) ? v[0] : v; v = v == null ? '' : String(v); return /[",\n;]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; }
  P.reportRows = function (k) {
    if (k === 'exec') { var h = P.health(); return [['Pilar', 'Skor', 'Status']].concat(h.pillars.map(function (p) { return [p.n, p.score, p.band.n]; })).concat([['Business Health', h.score, h.band.n]]); }
    if (k === 'fin') { var pl = P.fin.pl(); return [['Baris', 'Rp']].concat([['Revenue', pl.revenue], ['COGS', pl.cogs], ['Gross Profit', pl.gross], ['Operating Expense', pl.opex], ['Operating Profit', pl.op], ['Other', pl.other], ['Tax', pl.tax], ['Net Profit', pl.net]]); }
    if (k === 'ambidex') { var x = P.xscore(); return [['Dimensi', 'Bobot', 'Bobot efektif', 'Skor']].concat(x.dims.map(function (d) { return [d.n, d.w, d.eff, d.score]; })).concat([['XScore', 100, 100, x.now]]); }
    if (k === 'race') return [['Race', 'PIC', 'Target', 'Aktual', 'Status']].concat(S().daily.map(function (r) { return [r.n, r.pic, r.target, r.actual, r.status]; }));
    if (k === 'r2re') { var b = P.r2Board(); return [['Kategori', 'KPI', 'Target', 'Aktual', 'Achievement', 'Bobot', 'Weighted']].concat(b.lines.map(function (l) { return [P.CATS[l.k.cat], l.k.n, l.k.target, l.actual, l.ach, l.k.weight, l.ws]; })); }
    if (k === 'refl') { var R = P.reflection(); return [['KPI', 'Bobot', 'W1', 'W2', 'W3', 'W4', 'Bulanan', 'Achievement', 'Weighted']].concat(R.lines.map(function (l) { return [l.k.n, l.weight].concat(l.vals).concat([l.monthly, l.ach, l.ws]); })); }
    if (k === 'client') return [['Klien', 'Revenue Sep', 'kg', 'pcs']].concat(P.fin.segments('client').map(function (s) { return [s.n, s.rev, s.kg, s.pcs]; }));
    if (k === 'ops') return [['KPI', 'Target', 'Aktual', 'Achievement']].concat(P.lines('XS-OPS').map(function (l) { return [l.k.n, l.k.target, l.actual, l.ach]; }));
    if (k === 'hr') return [['Tim', 'Teamwork Score', 'Rata-rata anggota']].concat(P.teams().map(function (t) { return [t.n, t.score, P.memberAvg(t.k)]; }));
    return [];
  };
  P.exportReport = function (ctx, k, fmt) {
    var r = by(D.REPORTS, 'k', k); if (!r) return { ok: false, code: 'notfound', msg: P.MSG.notfound };
    if (!can(ctx, r.perm) || !can(ctx, 'rpt.export')) return deny(ctx, 'export ' + k);
    var rows = P.reportRows(k), name = 'jfresh-' + k + '-report-' + P.TODAY + '.' + (fmt === 'xls' ? 'xls' : fmt === 'pdf' ? 'pdf' : 'csv');
    var content = fmt === 'csv' ? rows.map(function (row) { return row.map(csvCell).join(','); }).join('\n') :
      fmt === 'xls' ? '<table>' + rows.map(function (row) { return '<tr>' + row.map(function (c) { return '<td>' + String(csvCell(c)).replace(/</g, '&lt;') + '</td>'; }).join('') + '</tr>'; }).join('') + '</table>' : null;
    P.audit('REPORT.EXPORT', ctx, { target: k, to: fmt.toUpperCase() });
    return { ok: true, name: name, content: content, rows: rows };
  };

  /* ---------- Phase 5 screens, navigation and install ---------- */
  function sc(id, n, a, p, np, nv, icon, pur) { return { id: id, n: n, a: a, p: p, np: np, nv: nv, icon: icon, pur: pur, dom: 'perf', lvl: 4, p5: true, nb: [], bf: [], aud: [], emp: L('Belum ada data untuk periode ini.', 'No data for this period yet.'), err: L('Data belum berhasil dimuat. Coba lagi.', 'Could not load the data. Try again.'), warn: L('Ada KPI yang perlu perhatian.', 'Some KPIs need attention.'), ok: L('Tersimpan.', 'Saved.') }; }
  P.SCREENS = [
    sc('HOM-EXE-001', L('Executive Business Health', 'Executive Business Health'), 'T01', 'home.exe', 'NP-01', 'NV-01', 'gauge', L('Kondisi bisnis dalam 5–10 detik: skor, pilar, risiko dan tindakan.', 'Business condition in 5–10 seconds: scores, pillars, risks and actions.')),
    sc('EXE-PIL-001', L('Detail Pilar', 'Pillar Detail'), 'T08', 'exe.health', 'NP-01', 'NV-01', 'layers', L('Drill-down pilar → KPI → tim → user → race → bukti.', 'Drill-down pillar → KPI → team → user → race → evidence.')),
    sc('FIN-HLT-001', L('Financial Health & Cash Position', 'Financial Health & Cash Position'), 'T08', 'fin.health', 'NP-02', 'NV-02', 'coins', L('Kas, arus kas, forecast, revenue, P&L, biaya, unit economics, AR, AP dan skor.', 'Cash, cash flow, forecast, revenue, P&L, expenses, unit economics, AR, AP and score.')),
    sc('GOL-CAS-001', L('Goal Cascade & Orbital Goal', 'Goal Cascade & Orbital Goal'), 'T08', 'goal.view', 'NP-03', 'NV-03', 'target', L('Roadmap sampai Daily Race, setiap level terhubung ke atas.', 'Roadmap down to Daily Race, every level linked upward.')),
    sc('GOL-DTL-001', L('Detail Goal', 'Goal Detail'), 'T03', 'goal.view', 'NP-03', 'NV-03', 'target', L('Overview, KPI, milestone, race, issue, insight, bukti dan riwayat goal.', 'Goal overview, KPIs, milestones, races, issues, insights, evidence and history.')),
    sc('KPI-MST-001', L('KPI Master & Scorecard', 'KPI Master & Scorecard'), 'T05', 'kpi.view', 'NP-04', 'NV-04', 'list', L('Library KPI, weight board 100% dan lifecycle versi.', 'KPI library, 100% weight board and version lifecycle.')),
    sc('KPI-EDT-001', L('KPI Editor', 'KPI Editor'), 'T06', 'kpi.view', 'NP-04', 'NV-04', 'edit', L('Ubah KPI: target, bobot, formula, arah, sumber, bukti, reviewer.', 'Edit a KPI: target, weight, formula, direction, source, evidence, reviewer.')),
    sc('KPI-DTL-001', L('Detail KPI', 'KPI Detail'), 'T03', 'kpi.view', 'NP-04', 'NV-04', 'chart', L('Drill-down KPI → tim → user → race → bukti.', 'KPI drill-down → team → user → race → evidence.')),
    sc('XSC-001', 'XScore', 'T08', 'xscore.view', 'NP-05', 'NV-05', 'gauge', L('Skor kinerja Ambidex: dimensi, eksploitasi vs eksplorasi, band status.', 'Ambidex performance score: dimensions, exploitation vs exploration, status bands.')),
    sc('TEAM-001', 'Teamwork Score', 'T08', 'team.view', 'NP-06', 'NV-06', 'users', L('Skor tim dari KPI bersama, bukan rata-rata anggota.', 'Team score from shared KPIs, not a member average.')),
    sc('TEAM-DTL-001', L('Detail Tim', 'Team Detail'), 'T03', 'team.view', 'NP-06', 'NV-06', 'users', L('Scorecard tim, kontribusi anggota, race dan bukti.', 'Team scorecard, member contribution, races and evidence.')),
    sc('PERF-001', L('Kinerja Saya', 'My Performance'), 'T03', 'perf.self', 'NP-07', 'NV-07', 'star', L('Personal Score, KPI saya dan target hari ini.', 'Personal Score, my KPIs and today\'s targets.')),
    sc('PERF-HR-001', L('Kinerja Individu', 'Individual Performance'), 'T05', 'perf.view', 'NP-07', 'NV-07', 'idcard', L('Daftar karyawan dengan Personal Score sesuai cakupan.', 'Employee list with Personal Score, within scope.')),
    sc('PERF-USR-001', L('Profil Kinerja', 'Performance Profile'), 'T03', 'perf.view', 'NP-07', 'NV-07', 'user', L('Profil kinerja dan tab HR satu karyawan.', 'One employee\'s performance profile and HR tabs.')),
    sc('RACE-DLY-001', 'Daily Race', 'T05', 'race.view', 'NP-08', 'NV-08', 'zap', L('Eksekusi harian: goal, KPI, PIC, progres, blocker, bukti.', 'Daily execution: goal, KPI, PIC, progress, blocker, evidence.')),
    sc('RACE-WK-001', 'Weekly Race', 'T05', 'race.view', 'NP-08', 'NV-08', 'flag', L('Fokus mingguan: target, aktual, achievement, varian, status.', 'Weekly focus: target, actual, achievement, variance, status.')),
    sc('R2RE-001', L('R2RE KPI Review Board', 'R2RE KPI Review Board'), 'T08', 'race.lead', 'NP-08', 'NV-08', 'clipboard', L('Review KPI mingguan per kategori, bobot 100%.', 'Weekly KPI review by category, weights 100%.')),
    sc('R2RE-MTG-001', L('R2RE Meeting Mode', 'R2RE Meeting Mode'), 'T04', 'race.lead', 'NP-08', 'NV-08', 'target', L('Satu KPI per layar: why, root cause, impact, recovery, keputusan.', 'One KPI at a time: why, root cause, impact, recovery, decision.')),
    sc('REFL-001', L('Monthly Reflection & Strategy', 'Monthly Reflection & Strategy'), 'T08', 'refl.view', 'NP-09', 'NV-09', 'history', L('Refleksi bulanan dari 4 R2RE, issue, strategi dan STRACON berikutnya.', 'Monthly reflection from 4 R2REs, issues, strategy and next STRACON.')),
    sc('DI-BRF-001', 'Executive Brief', 'T08', 'di.view', 'NP-10', 'NV-10', 'bulb', L('Ringkasan harian untuk keputusan: financial, operations, client, people, ambidex.', 'Daily brief for decisions: financial, operations, client, people, ambidex.')),
    sc('DI-INS-001', L('Insight & Rekomendasi', 'Insights & Recommendations'), 'T05', 'di.view', 'NP-10', 'NV-10', 'sparkles', L('Insight WHAT · WHY · RISK · RECOMMENDATION · ACTION.', 'Insights WHAT · WHY · RISK · RECOMMENDATION · ACTION.')),
    sc('DI-DEC-001', 'Decision Log', 'T05', 'di.view', 'NP-10', 'NV-10', 'filecheck', L('Keputusan, owner, hasil yang diharapkan dan aktual.', 'Decisions, owners, expected and actual results.')),
    sc('DI-RPT-001', L('Report Library', 'Report Library'), 'T05', 'di.view', 'NP-10', 'NV-10', 'file', L('Laporan eksekutif, finansial, ambidex, race, reflection, klien, operasional, HR.', 'Executive, financial, ambidex, race, reflection, client, operations and HR reports.'))
  ];
  P.screen = function (id) { return by(P.SCREENS, 'id', id); };
  P.PARENTS = {
    'EXE-PIL-001': ['HOM-EXE-001'], 'GOL-DTL-001': ['GOL-CAS-001'], 'KPI-EDT-001': ['KPI-MST-001'], 'KPI-DTL-001': ['KPI-MST-001', 'XSC-001', 'HOM-EXE-001'],
    'TEAM-DTL-001': ['TEAM-001'], 'PERF-USR-001': ['PERF-HR-001', 'TEAM-001'], 'R2RE-MTG-001': ['R2RE-001'], 'DI-INS-001': ['DI-BRF-001'], 'DI-DEC-001': ['DI-BRF-001'], 'DI-RPT-001': ['DI-BRF-001']
  };
  function N(k, l, i, s) { return { k: k, l: l, i: i, s: s }; }
  function G(k, l, i, sub) { return { k: k, l: l, i: i, sub: sub }; }
  var RACE_GROUP = function (extra) { return G('g-race', L('Ambidex & Race', 'Ambidex & Race'), 'flag', [N('dly', 'Daily Race', 'zap', 'RACE-DLY-001'), N('wk', 'Weekly Race', 'flag', 'RACE-WK-001'), N('r2re', 'R2RE KPI Review', 'clipboard', 'R2RE-001'), N('refl', 'Monthly Reflection', 'history', 'REFL-001')].concat(extra || [])); };
  P.NAV = {
    owner: {
      nav: [
        N('home', L('Business Health', 'Business Health'), 'gauge', 'HOM-EXE-001'),
        N('brief', L('Executive Brief', 'Executive Brief'), 'bulb', 'DI-BRF-001'),
        G('g-fin', L('Keuangan', 'Finance'), 'coins', [N('fhlt', 'Financial Health', 'coins', 'FIN-HLT-001'), N('fin', L('Laporan Finance', 'Finance Report'), 'chart', 'RPT-FIN-001')]),
        G('g-amb', L('Kinerja & KPI', 'Performance & KPI'), 'target', [N('goal', 'Goal Cascade', 'target', 'GOL-CAS-001'), N('kpi', 'KPI Master', 'list', 'KPI-MST-001'), N('xsc', 'XScore', 'gauge', 'XSC-001')]),
        RACE_GROUP(),
        G('g-ppl', L('People & HR', 'People & HR'), 'users', [N('tws', 'Teamwork Score', 'users', 'TEAM-001'), N('perf', L('Kinerja Individu', 'Individual Performance'), 'idcard', 'PERF-HR-001'), N('ppl', L('Produktivitas', 'Productivity'), 'chart', 'RPT-PPL-001')]),
        G('g-ops', L('Operasional', 'Operations'), 'washer', [N('ops', L('Operasional', 'Operations'), 'washer', 'RPT-OPS-001'), N('qlt', 'Quality', 'shield', 'QLT-DSH-001'), N('inv', 'Inventory', 'package', 'INV-STK-001')]),
        G('g-com', L('Klien & Komersial', 'Clients & Commercial'), 'briefcase', [N('com', L('Komersial', 'Commercial'), 'briefcase', 'RPT-COM-001'), N('cli', L('Klien', 'Clients'), 'hotel', 'RPT-CLI-001')]),
        G('g-dec', L('Keputusan & Laporan', 'Decisions & Reports'), 'filecheck', [N('ins', L('Insight', 'Insights'), 'sparkles', 'DI-INS-001'), N('dec', 'Decision Log', 'filecheck', 'DI-DEC-001'), N('rlib', 'Report Library', 'file', 'DI-RPT-001'), N('reports', L('Laporan Operasional', 'Operations Reports'), 'chart', 'RPT-LIB-001')]),
        N('sys', L('Sistem', 'System'), 'cog', 'SYS-HUB-001')
      ],
      mnav: [N('home', L('Health', 'Health'), 'gauge', 'HOM-EXE-001'), N('brief', L('Brief', 'Brief'), 'bulb', 'DI-BRF-001'), N('fhlt', L('Keuangan', 'Finance'), 'coins', 'FIN-HLT-001'), N('apr', L('Persetujuan', 'Approvals'), 'filecheck', 'APR-INB-001'), { k: 'menu', l: L('Menu', 'Menu'), i: 'menu' }]
    },
    opsmgr: { add: [RACE_GROUP(), G('g-amb', L('Kinerja & KPI', 'Performance & KPI'), 'target', [N('goal', 'Goal Cascade', 'target', 'GOL-CAS-001'), N('kpi', 'KPI Master', 'list', 'KPI-MST-001'), N('xsc', 'XScore', 'gauge', 'XSC-001'), N('tws', 'Teamwork Score', 'users', 'TEAM-001'), N('perf', L('Kinerja Individu', 'Individual Performance'), 'idcard', 'PERF-HR-001'), N('me', L('Kinerja Saya', 'My Performance'), 'star', 'PERF-001')])] },
    supervisor: { add: [RACE_GROUP([N('tws', 'Teamwork Score', 'users', 'TEAM-001'), N('perf', L('Kinerja Tim', 'Team Performance'), 'idcard', 'PERF-HR-001'), N('me', L('Kinerja Saya', 'My Performance'), 'star', 'PERF-001')])] },
    finance: { insert: [1, N('fhlt', 'Financial Health', 'gauge', 'FIN-HLT-001')], add: [G('g-me', L('Kinerja', 'Performance'), 'star', [N('dly', 'Daily Race', 'zap', 'RACE-DLY-001'), N('goal', 'Goal Cascade', 'target', 'GOL-CAS-001'), N('tws', 'Teamwork Score', 'users', 'TEAM-001'), N('me', L('Kinerja Saya', 'My Performance'), 'star', 'PERF-001')])] },
    sales: { add: [G('g-me', L('Kinerja', 'Performance'), 'star', [N('dly', 'Daily Race', 'zap', 'RACE-DLY-001'), N('goal', 'Goal Cascade', 'target', 'GOL-CAS-001'), N('me', L('Kinerja Saya', 'My Performance'), 'star', 'PERF-001')])] },
    operator: { add: [N('me', L('Kinerja Saya', 'My Performance'), 'star', 'PERF-001')] },
    driver: { add: [N('me', L('Kinerja Saya', 'My Performance'), 'star', 'PERF-001')] }
  };
  /* install(): joins the Phase 5 permissions, screens and menus to the shared config
     (and the Phase 4 access roles). Safe to call more than once. */
  P.install = function (C, X) {
    if (!C || C.__p5) return; C.__p5 = true;
    Object.keys(P.PERMS).forEach(function (k) { C.PERMS[k] = P.PERMS[k]; });
    Object.keys(P.ROLE_PERMS).forEach(function (r) {
      var role = C.ROLES[r], extra = P.ROLE_PERMS[r];
      if (role) extra.forEach(function (p) { if (role.perms.indexOf(p) < 0) role.perms.push(p); });
      if (X && X.ROLES[r] && X.ROLES[r].perms) extra.forEach(function (p) { if (X.ROLES[r].perms.indexOf(p) < 0) X.ROLES[r].perms.push(p); });
    });
    Object.keys(P.NAV).forEach(function (r) {
      var cfg = P.NAV[r], role = C.ROLES[r]; if (!role) return;
      if (cfg.nav) role.nav = cfg.nav;
      if (cfg.mnav) role.mnav = cfg.mnav;
      if (cfg.insert) role.nav.splice(cfg.insert[0], 0, cfg.insert[1]);
      if (cfg.add) role.nav = role.nav.concat(cfg.add);
    });
    var orig = C.screen, extra = {};
    P.SCREENS.forEach(function (s) { extra[s.id] = s; });
    C.screen = function (id) { return extra[id] || orig(id); };
    C.SCREENS_P5 = P.SCREENS;
  };
  /* Person scope for performance screens: self always; supervisors see the teams they lead;
     perf.view without a team lead role (managers, owner) sees everyone. */
  P.canSeePerson = function (ctx, empId) {
    if (!ctx) return false;
    if (ctx.employee && ctx.employee.id === empId) return can(ctx, 'perf.self') || can(ctx, 'perf.view');
    if (!can(ctx, 'perf.view')) return false;
    if (ctx.roleKey === 'supervisor') { var p = by(D.PEOPLE, 'id', empId); if (!p) return false; var led = D.TEAMS.filter(function (t) { return t.lead === (ctx.employee && ctx.employee.id) || t.k === 'ops'; }).map(function (t) { return t.k; }); return led.indexOf(p.team) >= 0 || ['rcv', 'wsh', 'dry', 'fin', 'qc', 'pck'].indexOf(p.team) >= 0; }
    return true;
  };
  P.empName = function (id) { var p = by(D.PEOPLE, 'id', id); if (p) return p.n; var o = { 'EMP-050': 'Aji Jaens' }; return o[id] || id; };
  P.clientName = function (id) { var m = { 'CL-01': 'Grand Vista Hotel', 'CL-02': 'The Santai Hotel', 'CL-03': 'Kayana Resort', 'CL-04': 'Oceanview Villa', 'CL-05': 'Hotel ABC', 'CL-06': 'Ubud Spa Retreat' }; return m[id] || id; };

  if (typeof module !== 'undefined' && module.exports) module.exports = P;
  else root.JFPERF = P;
})(typeof window !== 'undefined' ? window : this);
