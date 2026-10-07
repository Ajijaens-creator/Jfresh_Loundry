/* ==========================================================================
   JFRESH OS — Phase 5 documentation data (Executive, Financial & Ambidex
   Performance OS · NP Version 1.0). Used by phase5/*.html only; the app
   reads the engine (jfos-perf.js), never this file.
   ========================================================================== */
(function (root) {
  function L(a, b) { return [a, b === undefined ? a : b]; }
  var APP = '../app/login.html?next=';
  function go(role, id) { return APP + encodeURIComponent('#/' + role + '/' + id) + '#/'; }

  var VISUALS = [
    { k: 'NV-01', f: 'nv01-executive-business-health.jpg', t: L('Executive Business Health', 'Executive Business Health') },
    { k: 'NV-02', f: 'nv02-financial-health-cash-position.jpg', t: L('Financial Health & Cash Position', 'Financial Health & Cash Position') },
    { k: 'NV-03', f: 'nv03-goal-cascade-orbital-goal.jpg', t: L('Goal Cascade & Orbital Goal', 'Goal Cascade & Orbital Goal') },
    { k: 'NV-04', f: 'nv04-kpi-master-contract-weighting.jpg', t: L('KPI Master, Kontrak & Bobot', 'KPI Master, Contract & Weighting') },
    { k: 'NV-05', f: 'nv05-xscore.jpg', t: L('XScore', 'XScore') },
    { k: 'NV-06', f: 'nv06-teamwork-score.jpg', t: L('Teamwork Score', 'Teamwork Score') },
    { k: 'NV-07', f: 'nv07-personal-score-hr-performance.jpg', t: L('Personal Score & Kinerja HR', 'Personal Score & HR Performance') },
    { k: 'NV-08', f: 'nv08-daily-weekly-race-r2re.jpg', t: L('Daily Race, Weekly Race & R2RE', 'Daily Race, Weekly Race & R2RE') },
    { k: 'NV-09', f: 'nv09-monthly-reflection-strategy.jpg', t: L('Monthly Reflection & Strategy', 'Monthly Reflection & Strategy') },
    { k: 'NV-10', f: 'nv10-decision-intelligence-reporting.jpg', t: L('Decision Intelligence & Reporting', 'Decision Intelligence & Reporting') }
  ];

  var NP = [
    { k: 'NP-01', id: 'np01', ic: 'gauge', v: 'NV-01', t: L('Executive Business Health', 'Executive Business Health'),
      d: L('Owner memahami kondisi bisnis dalam 5–10 detik dan tahu tindakan berikutnya.', 'The owner understands the business in 5–10 seconds and knows the next action.'),
      built: [L('8 tile: Business Health, Financial Health, XScore, revenue, net profit, kas, SLA, AR', '8 tiles: Business Health, Financial Health, XScore, revenue, net profit, cash, SLA, AR'), L('Periode Hari Ini / MTD / YTD', 'Today / MTD / YTD periods'), L('Enam pilar berbobot dengan tren dan issue utama', 'Six weighted pillars with trend and top issue'), L('Perlu Perhatian: Review, Assign, Investigasi, Approve, Buat Aksi, Buka Data Sumber', 'Needs Attention: Review, Assign, Investigate, Approve, Create Action, Open Source Data'), L('Drill-down pilar → KPI → tim → user → race → bukti', 'Drill-down pillar → KPI → team → user → race → evidence')],
      links: [[L('Buka Business Health', 'Open Business Health'), go('owner', 'HOM-EXE-001')], [L('Detail pilar', 'Pillar detail'), go('owner', 'EXE-PIL-001')]] },
    { k: 'NP-02', id: 'np02', ic: 'coins', v: 'NV-02', t: L('Financial Health & Cash Position', 'Financial Health & Cash Position'),
      d: L('Kas, arus kas, forecast, revenue, P&L, biaya, unit economics, AR, AP dan Financial Health Score.', 'Cash, cash flow, forecast, revenue, P&L, expenses, unit economics, AR, AP and the Financial Health Score.'),
      built: [L('Posisi kas per rekening hanya untuk izin fin.cash.accounts', 'Per-account cash only with the fin.cash.accounts permission'), L('Arus kas harian / mingguan / bulanan dan forecast 13 minggu dengan peringatan', 'Daily / weekly / monthly cash flow and 13-week forecast with warnings'), L('Revenue per plant, klien, layanan; P&L per bulan; MoM, QoQ, YoY', 'Revenue by plant, client, service; monthly P&L; MoM, QoQ, YoY'), L('Biaya dan unit economics per kg, order, klien, plant', 'Expenses and unit economics per kg, order, client, plant'), L('AR aging, DSO, AP jatuh tempo, free cash', 'AR aging, DSO, AP due, free cash')],
      links: [[L('Buka Financial Health', 'Open Financial Health'), go('owner', 'FIN-001')], [L('Sebagai Finance', 'As Finance'), go('finance', 'FIN-001')]] },
    { k: 'NP-03', id: 'np03', ic: 'target', v: 'NV-03', t: L('Goal Cascade & Orbital Goal', 'Goal Cascade & Orbital Goal'),
      d: L('Roadmap 3 tahun sampai Daily Race; setiap goal terhubung satu level ke atas.', '3-year roadmap down to Daily Race; every goal links one level up.'),
      built: [L('Tujuh level dari Roadmap sampai Daily Race', 'Seven levels from Roadmap to Daily Race'), L('Status On Track, At Risk, Off Track, Completed, Cancelled', 'On Track, At Risk, Off Track, Completed, Cancelled statuses'), L('Progres otomatis dari KPI, milestone dan race; koreksi manual wajib alasan', 'Progress from KPIs, milestones and races; manual adjustment needs a reason'), L('Detail goal dengan 8 tab', 'Goal detail with 8 tabs'), L('Goal tanpa induk ditolak', 'A goal without a parent is refused')],
      links: [[L('Buka Goal Cascade', 'Open Goal Cascade'), go('owner', 'GOAL-001')], [L('Contoh detail goal', 'Sample goal detail'), go('owner', 'GOAL-002/BG-H2-01')]] },
    { k: 'NP-04', id: 'np04', ic: 'list', v: 'NV-04', t: L('KPI Master, Kontrak & Bobot', 'KPI Master, Contract & Weighting'),
      d: L('KPI resmi dengan kontrak, bobot 100% per scorecard dan versi yang tidak menimpa riwayat.', 'Official KPIs with a contract, 100% weights per scorecard and versions that never overwrite history.'),
      built: [L('Library KPI per kategori termasuk Keberlanjutan', 'KPI library by category including Sustainability'), L('Editor: kode, target, bobot, floor, cap, stretch, arah, sumber, bukti, reviewer, approver', 'Editor: code, target, weight, floor, cap, stretch, direction, source, evidence, reviewer, approver'), L('Weight board dengan pesan kurang / lebih / valid 100%', 'Weight board with under / over / valid 100% messages'), L('Lifecycle Draft → Review → Approved → Active → Frozen → Archived', 'Lifecycle Draft → Review → Approved → Active → Frozen → Archived'), L('Mengubah KPI aktif membuat versi draft baru', 'Changing an active KPI creates a new draft version')],
      links: [[L('Buka KPI Master', 'Open KPI Master'), go('owner', 'KPI-001')], [L('Detail KPI SLA', 'SLA KPI detail'), go('owner', 'KPI-DTL-001/OPS-01')]] },
    { k: 'NP-05', id: 'np05', ic: 'gauge', v: 'NV-05', t: L('XScore', 'XScore'),
      d: L('Satu skor 0–100 dari kerangka KPI Ambidex: eksploitasi 80%, eksplorasi 20%.', 'One 0–100 score from the Ambidex KPI framework: exploitation 80%, exploration 20%.'),
      built: [L('Enam dimensi dengan bobot efektif', 'Six dimensions with effective weights'), L('Periode 30D, Kuartal, 6M, 12M', '30D, Quarter, 6M, 12M periods'), L('Band status yang bisa dikonfigurasi dan divalidasi', 'Configurable, validated status bands'), L('Drill ke KPI yang paling menurunkan skor', 'Drill to the KPI pulling the score down most')],
      links: [[L('Buka XScore', 'Open XScore'), go('owner', 'XSCORE-001')]] },
    { k: 'NP-06', id: 'np06', ic: 'users', v: 'NV-06', t: L('Teamwork Score', 'Teamwork Score'),
      d: L('Skor tim dari KPI bersama, bukan rata-rata skor anggota.', 'Team score from shared KPIs, never an average of member scores.'),
      built: [L('Kartu skor per tim dengan tren dan lead', 'Score card per team with trend and lead'), L('Scorecard KPI tim berbobot 100%', 'Team KPI scorecard weighted to 100%'), L('Perbandingan skor tim vs rata-rata anggota', 'Team score vs member average comparison'), L('Kontribusi anggota dicatat terpisah', 'Member contribution recorded separately')],
      links: [[L('Buka Teamwork Score', 'Open Teamwork Score'), go('owner', 'TEAM-001')], [L('Tim Receiving', 'Receiving team'), go('owner', 'TEAM-002/rcv')]] },
    { k: 'NP-07', id: 'np07', ic: 'idcard', v: 'NV-07', t: L('Personal Score & Kinerja HR', 'Personal Score & HR Performance'),
      d: L('Personal Score = KPI individu + kontribusi tim, sesuai peran. Skor mendukung HR, tidak menggantikan manusia.', 'Personal Score = individual KPIs + team contribution, by role. Scores support HR and never replace people.'),
      built: [L('Layar frontline sederhana: skor saya dan target hari ini', 'Simple frontline screen: my score and today\'s targets'), L('Daftar karyawan sesuai cakupan (supervisor hanya timnya)', 'Employee list within scope (supervisors see their teams only)'), L('Profil dengan 10 tab HR: kehadiran, coaching, training, prestasi, rekognisi, probation, PIP, promosi, riwayat', 'Profile with 10 HR tabs: attendance, coaching, training, achievement, recognition, probation, PIP, promotion, history'), L('Catatan HR hanya dengan izin hr.manage dan tercatat di audit', 'HR notes only with hr.manage and logged in the audit'), L('Tidak ada pemberhentian, disiplin atau promosi otomatis', 'No automatic termination, discipline or promotion')],
      links: [[L('Kinerja Individu', 'Individual Performance'), go('owner', 'PERF-HR-001')], [L('Kinerja Saya (operator)', 'My Performance (operator)'), APP + encodeURIComponent('#/operator/PERF-001') + '#/?u=made']] },
    { k: 'NP-08', id: 'np08', ic: 'flag', v: 'NV-08', t: L('Daily Race, Weekly Race & R2RE', 'Daily Race, Weekly Race & R2RE'),
      d: L('Eksekusi harian dan mingguan yang terhubung ke goal dan KPI, ditinjau di R2RE.', 'Daily and weekly execution linked to goals and KPIs, reviewed in R2RE.'),
      built: [L('Daily Race: PIC, progres, blocker, eskalasi, bukti otomatis', 'Daily Race: owner, progress, blocker, escalation, automatic evidence'), L('Weekly Race: target, aktual, pencapaian, varian, status', 'Weekly Race: target, actual, achievement, variance, status'), L('R2RE Board per minggu dan kategori, bobot 100%', 'R2RE board per week and category, weights 100%'), L('Meeting Mode satu KPI per layar: why, root cause, impact, recovery, keputusan', 'Meeting Mode one KPI per screen: why, root cause, impact, recovery, decision')],
      links: [[L('Buka Daily Race', 'Open Daily Race'), go('owner', 'RACE-001')], [L('R2RE Board', 'R2RE Board'), go('owner', 'RACE-003')]] },
    { k: 'NP-09', id: 'np09', ic: 'history', v: 'NV-09', t: L('Monthly Reflection & Strategy', 'Monthly Reflection & Strategy'),
      d: L('Refleksi bulanan dari 4 R2RE, issue, insight, strategi dan STRACON bulan berikutnya.', 'Monthly reflection from 4 R2REs, issues, insights, strategy and next month\'s STRACON.'),
      built: [L('Bobot bulanan dirata-rata lalu dinormalisasi ke 100%, tidak dijumlah 400%', 'Monthly weights averaged then normalised to 100%, never summed to 400%'), L('Konsolidasi, tren, issue, insight, ringkasan dan strategi', 'Consolidation, trend, issues, insights, summary and strategy'), L('STRACON baru dengan carry forward', 'New STRACON with carry forward'), L('Alur persetujuan sampai freeze; perubahan setelah freeze lewat amandemen', 'Approval flow up to freeze; changes after freeze go through an amendment')],
      links: [[L('Buka Monthly Reflection', 'Open Monthly Reflection'), go('owner', 'REFL-001')]] },
    { k: 'NP-10', id: 'np10', ic: 'bulb', v: 'NV-10', t: L('Decision Intelligence & Reporting', 'Decision Intelligence & Reporting'),
      d: L('Executive Brief, insight WHAT · WHY · RISK · RECOMMENDATION · ACTION, Decision Log dan Report Library.', 'Executive Brief, WHAT · WHY · RISK · RECOMMENDATION · ACTION insights, Decision Log and Report Library.'),
      built: [L('Executive Brief harian lima area', 'Daily Executive Brief across five areas'), L('Insight deskriptif, diagnostik, prediktif, preskriptif dengan aksi', 'Descriptive, diagnostic, predictive, prescriptive insights with actions'), L('Decision Log dengan owner, hasil diharapkan dan aktual', 'Decision Log with owner, expected and actual results'), L('Report Library: pratinjau, PDF, Excel, CSV', 'Report Library: preview, PDF, Excel, CSV')],
      links: [[L('Buka Executive Brief', 'Open Executive Brief'), go('owner', 'DI-001')], [L('Report Library', 'Report Library'), go('owner', 'REPORT-001')]] }
  ];

  var SCORES = [
    ['Business Health Score', L('Snapshot kondisi bisnis dari 6 pilar berbobot.', 'Condition snapshot from six weighted pillars.'), 'HOM-EXE-001'],
    ['Financial Health Score', L('Scorecard khusus keuangan: revenue, margin, kas, collection, AR, biaya, quick ratio.', 'Finance-only scorecard: revenue, margin, cash, collection, AR, cost, quick ratio.'), 'FIN-001'],
    ['XScore', L('Kinerja periode pada kerangka KPI Ambidex (eksploitasi 80% · eksplorasi 20%).', 'Period performance on the Ambidex KPI framework (exploitation 80% · exploration 20%).'), 'XSCORE-001'],
    ['Teamwork Score', L('Hasil KPI bersama tim, bukan rata-rata skor anggota.', 'Shared team KPI results, never an average of member scores.'), 'TEAM-001'],
    ['Personal Score', L('KPI individu + kontribusi tim, formula sesuai peran.', 'Individual KPIs + team contribution, formula by role.'), 'PERF-001']
  ];

  var RULES = [L('Satu sumber angka: semua skor dihitung di satu engine', 'One source of numbers: every score comes from one engine'), L('Bobot setiap scorecard tepat 100%', 'Every scorecard weighs exactly 100%'), L('Versi KPI tidak pernah menimpa riwayat', 'KPI versions never overwrite history'), L('Setiap goal terhubung ke atas', 'Every goal links upward'), L('Input manual wajib pemilik dan alasan atau bukti', 'Manual input needs an owner and a reason or evidence'), L('Akses per izin dan cakupan', 'Access by permission and scope'), L('Audit siapa, kapan, sebelum, sesudah, alasan', 'Audit who, when, before, after, reason'), L('Bahasa Indonesia dulu, Design System Fase 3', 'Indonesian first, Phase 3 design system')];
  var DONT = [L('Menjumlah bobot 4 minggu menjadi 400%', 'Sum four weekly weights to 400%'), L('Menghitung skor tim dari rata-rata anggota', 'Compute a team score from the member average'), L('Keputusan HR otomatis dari skor', 'Automatic HR decisions from a score'), L('Menampilkan rekening bank tanpa izin', 'Show bank accounts without permission'), L('Mengubah KPI aktif tanpa versi baru', 'Change an active KPI without a new version'), L('Membangun ulang logika Fase 1–4 yang sudah disetujui', 'Rebuild approved Phase 1–4 logic')];

  // §95 Definition of Done: every item points to the screen or test that proves it.
  function dd(t, link) { return [t, 'done', link]; }
  var DOD = [
    dd(L('Executive Business Health berjalan', 'Executive Business Health works'), 'screens.html#EXEC-001'),
    dd(L('Dashboard Financial Health lengkap (layout NV-02)', 'Financial Health dashboard complete (NV-02 layout)'), 'screens.html#FIN-001'),
    dd(L('Saldo kas per rekening dengan waktu update', 'Cash balances by account with as-of time'), 'screens.html#FIN-002'),
    dd(L('Arus kas lengkap', 'Cash flow complete'), 'screens.html#FIN-003'),
    dd(L('Cash forecast lengkap', 'Cash forecast complete'), 'screens.html#FIN-001'),
    dd(L('Pertumbuhan revenue lengkap', 'Revenue growth complete'), 'screens.html#FIN-001'),
    dd(L('P&L lengkap', 'P&L complete'), 'screens.html#FIN-004'),
    dd(L('Pertumbuhan laba/rugi (MoM, QoQ, YoY)', 'Profit/loss growth (MoM, QoQ, YoY)'), 'screens.html#FIN-004'),
    dd(L('Expense health lengkap', 'Expense health complete'), 'screens.html#FIN-001'),
    dd(L('AR aging lengkap', 'AR aging complete'), 'screens.html#FIN-005'),
    dd(L('AP & kewajiban lengkap', 'AP obligations complete'), 'screens.html#FIN-001'),
    dd(L('Unit economics lengkap', 'Unit economics complete'), 'screens.html#FIN-006'),
    dd(L('Goal cascade lengkap', 'Goal cascade complete'), 'screens.html#GOAL-001'),
    dd(L('Orbital Goal lengkap', 'Orbital Goal complete'), 'screens.html#GOAL-002'),
    dd(L('KPI library lengkap', 'KPI library complete'), 'screens.html#KPI-001'),
    dd(L('Tambah/ubah KPI (penuh di desktop, sebagian di iPad, ringkas di HP)', 'KPI add/edit (full on desktop, selected on iPad, summary on mobile)'), 'screens.html#KPI-002'),
    dd(L('Versi KPI dengan perbandingan field', 'KPI versioning with field comparison'), 'screens.html#KPI-004'),
    dd(L('Aturan bobot KPI = 100%', 'KPI weighting hard rule = 100%'), 'tests.html#np04'),
    dd(L('XScore lengkap', 'XScore complete'), 'screens.html#XSCORE-001'),
    dd(L('Eksploitasi / Eksplorasi lengkap', 'Exploitation / Exploration complete'), 'screens.html#XSCORE-002'),
    dd(L('Teamwork Score lengkap', 'Teamwork Score complete'), 'screens.html#TEAM-001'),
    dd(L('Personal Score lengkap', 'Personal Score complete'), 'screens.html#PERF-001'),
    dd(L('Profil kinerja HR lengkap', 'HR Performance profile complete'), 'screens.html#PERSON-001'),
    dd(L('Daily Race lengkap', 'Daily Race complete'), 'screens.html#RACE-001'),
    dd(L('Weekly Race lengkap', 'Weekly Race complete'), 'screens.html#RACE-002'),
    dd(L('R2RE KPI Board dengan prioritas review', 'R2RE KPI Board with review priority'), 'screens.html#RACE-003'),
    dd(L('R2RE Meeting Mode satu KPI per layar', 'R2RE Meeting Mode, one KPI per screen'), 'screens.html#RACE-004'),
    dd(L('Izin Race Leader (scope, target & bobot terkunci)', 'Race Leader permissions (scope, locked target & weight)'), 'tests.html#gov'),
    dd(L('Scorecard KPI mingguan = 100%', 'Weekly KPI scorecard = 100%'), 'tests.html#np08'),
    dd(L('Monthly Reflection lengkap', 'Monthly Reflection complete'), 'screens.html#REFL-001'),
    dd(L('Pemilih W1 / W2 / W3 / W4 / Semua', 'W1 / W2 / W3 / W4 / All selector'), 'screens.html#REFL-001'),
    dd(L('KPI bulanan dinormalisasi = 100%', 'Monthly KPI normalized = 100%'), 'tests.html#np09'),
    dd(L('Metode agregasi KPI', 'KPI aggregation methods'), 'screens.html#REFL-002'),
    dd(L('Issue Register (catat, perbarui, tutup)', 'Issue Register (log, update, close)'), 'screens.html#REFL-003'),
    dd(L('Carry forward berjalan', 'Carry Forward works'), 'tests.html#np09'),
    dd(L('KPI insight lengkap', 'KPI insight complete'), 'screens.html#REFL-004'),
    dd(L('Reflection Summary lengkap', 'Reflection Summary complete'), 'screens.html#REFL-005'),
    dd(L('Strategy Toward Goal lengkap', 'Strategy Toward Goal complete'), 'screens.html#REFL-005'),
    dd(L('Alur draft STRACON berikutnya', 'Next STRACON draft workflow'), 'screens.html#REFL-001'),
    dd(L('Persetujuan Reflection', 'Reflection approval'), 'screens.html#REFL-006'),
    dd(L('Decision Intelligence lengkap', 'Decision Intelligence complete'), 'screens.html#DI-002'),
    dd(L('Executive Daily Brief', 'Executive Daily Brief'), 'screens.html#DI-001'),
    dd(L('Prioritas alert', 'Alert prioritization'), 'screens.html#DI-003'),
    dd(L('Alur rekomendasi', 'Recommendation workflow'), 'screens.html#DI-004'),
    dd(L('Decision Log', 'Decision Log'), 'screens.html#DI-005'),
    dd(L('Report Library', 'Report Library'), 'screens.html#REPORT-001'),
    dd(L('Drill-down ke data sumber', 'Drill-down to source data'), 'tests.html#gov'),
    dd(L('Semua perhitungan skor bisa diaudit', 'All score calculations auditable'), 'screens.html#AUD-PERF-001'),
    dd(L('Izin berbasis peran', 'Role-based permission'), 'tests.html#np07'),
    dd(L('Privasi kinerja pribadi terlindungi', 'Personal performance privacy protected'), 'tests.html#gov'),
    dd(L('Desktop responsif', 'Desktop responsive'), 'tests.html#responsive'),
    dd(L('Meeting mode iPad', 'iPad meeting mode'), 'tests.html#responsive'),
    dd(L('Mode ringkas/aksi di HP', 'Mobile summary/action mode'), 'tests.html#responsive'),
    dd(L('Brand J\'Fresh dipertahankan (logo asli, palet resmi)', 'J\'Fresh brand preserved (original logo, approved palette)'), 'index.html#rules'),
    [L('Data asli dari server, akuntansi dan HRIS', 'Real data from the server, accounting and HRIS'), 'backend', 'index.html#backend']
  ];

  // §90 fields per screen that are not already in the engine's screen record.
  var C_KPI = 'Card.KPI, StatusChip, Progress, Charts', C_TBL = 'Table.Management, Filter, Tabs, EmptyState, ErrorState', C_APR = 'Approval, Modal, Button.Primary, Button.Secondary';
  function sp(entry, kpi, act, flt, drill, src, aud, cmp, nb) { return { entry: entry, kpi: kpi, act: act, flt: flt, drill: drill, src: src, aud: aud, cmp: cmp, nb: nb || '—' }; }
  var SPEC = {
    'HOM-EXE-001': sp(L('Landing owner', 'Owner landing'), 'Business Health, Financial Health, XScore, Revenue, Net Profit, Cash, SLA, AR', 'Review, Assign, Investigate, Approve', L('Periode Hari Ini / MTD / YTD', 'Period Today / MTD / YTD'), L('Pilar → KPI → Tim → User → Race → Bukti', 'Pillar → KPI → Team → User → Race → Evidence'), 'POS, GL, AR, Ops, HR', 'ALERT.ACT', C_KPI + ', Card.Alert', 'NB-01'),
    'EXEC-001': sp(L('ID §89 dari Executive Business Health', '§89 ID of Executive Business Health'), 'Business Health + six pillars', 'Review, Assign, Investigate, Approve', L('Periode', 'Period'), L('Pilar → KPI', 'Pillar → KPI'), 'POS, GL, AR, Ops, HR', 'ALERT.ACT', C_KPI, 'NB-01'),
    'EXE-PIL-001': sp(L('Kartu pilar di Business Health', 'Pillar card on Business Health'), L('Skor pilar, KPI penyusun, bobot', 'Pillar score, contributing KPIs, weights'), L('Buka KPI, assign', 'Open KPI, assign'), L('Pilar', 'Pillar'), 'KPI → Team → Race', 'KPI engine', '—', C_KPI, 'NB-01'),
    'FIN-001': sp(L('Menu Keuangan › Financial Health', 'Finance menu › Financial Health'), 'Total Cash, Revenue MTD, Net Profit MTD, Gross Margin, SLA, DSO, Outstanding AR, Financial Health Score', L('Export, Koreksi Keuangan, Rincian Lengkap, Perbarui data', 'Export, Financial Adjustment, Full Detail, Refresh data'), L('Tab Overview…Unit Economics, periode', 'Tabs Overview…Unit Economics, period'), L('Kartu → FIN-002…006 → transaksi', 'Card → FIN-002…006 → transaction'), 'Bank, GL, AR/AP, POS', 'FIN.ADJUST, APPROVAL.REQUEST, DATA.REFRESH, REPORT.EXPORT', C_KPI + ', Table.Management, Tabs', 'NB-02'),
    'FIN-002': sp('FIN-001 › Cash Position', L('Saldo per rekening, kas, kas terbatas, free cash', 'Balance by account, cash, restricted, free cash'), L('Perbarui saldo bank', 'Refresh bank balances'), L('Rekening', 'Account'), L('Rekening → mutasi', 'Account → movements'), 'Bank feed', 'DATA.REFRESH', C_TBL, 'NB-02'),
    'FIN-003': sp('FIN-001 › Cash Flow', L('Kas masuk, keluar, bersih', 'Cash in, out, net'), 'Export', L('Periode harian / mingguan / bulanan', 'Daily / weekly / monthly'), L('Kategori → transaksi', 'Category → transaction'), 'Bank, GL', 'REPORT.EXPORT', C_KPI, 'NB-02'),
    'FIN-004': sp('FIN-001 › P&L', 'Revenue, COGS, Gross Profit, OpEx, Net Profit, MoM/QoQ/YoY', 'Export', L('Bulan', 'Month'), L('Baris P&L → akun', 'P&L line → account'), 'GL', 'REPORT.EXPORT', C_TBL, 'NB-02'),
    'FIN-005': sp('FIN-001 › AR', 'Total AR, buckets, DSO, collection rate, overdue ratio', L('Follow-up klien', 'Client follow-up'), L('Bucket umur', 'Aging bucket'), L('Klien → invoice', 'Client → invoice'), 'AR ledger', 'FIN.ADJUST', C_TBL, 'NB-02'),
    'FIN-006': sp('FIN-001 › Unit Economics', 'Revenue/kg, cost/kg, profit/kg, per client & plant', 'Export', L('Dimensi', 'Dimension'), L('Klien → layanan', 'Client → service'), 'POS, GL', 'REPORT.EXPORT', C_KPI, 'NB-02'),
    'GOAL-001': sp(L('Menu Kinerja › Goal', 'Performance menu › Goals'), L('Progres per level, status', 'Progress per level, status'), L('Tambah goal, ubah status', 'Add goal, change status'), L('Level, status, owner', 'Level, status, owner'), 'Goal → KPI → Race', 'Goal store, KPI engine', 'GOAL.CREATE, GOAL.STATUS.SET', 'Stepper, Card.KPI, Filter', 'NB-03'),
    'GOAL-002': sp('GOAL-001', L('Progres, KPI, milestone, race', 'Progress, KPIs, milestones, races'), L('Koreksi progres (wajib alasan)', 'Adjust progress (reason required)'), L('Tab', 'Tabs'), 'KPI → Race → Evidence', 'Goal store', 'GOAL.PROGRESS.ADJUST', 'Tabs, Progress, Table.Management', 'NB-03'),
    'KPI-001': sp(L('Menu Kinerja › KPI', 'Performance menu › KPI'), L('Library per kategori, bobot, status', 'Library by category, weight, status'), L('Buat KPI, aktifkan scorecard', 'Create KPI, activate scorecard'), L('Kategori, scorecard, status, prioritas, cari', 'Category, scorecard, status, priority, search'), 'KPI → KPI-DTL-001', 'KPI store', 'KPI.CREATE, KPI.WEIGHT', C_TBL, 'NB-04'),
    'KPI-002': sp('KPI-001 / KPI-DTL-001', L('Kontrak KPI', 'KPI contract'), L('Simpan, kirim review, setujui, salin, nonaktifkan', 'Save, send to review, approve, copy, deactivate'), '—', 'KPI-004', 'KPI store', 'KPI.UPDATE, KPI.VERSION, KPI.STATUS', 'Modal, Button.Primary, Approval', 'NB-04'),
    'KPI-003': sp('KPI-001 › Weight Board', L('Bobot per KPI, total 100%', 'Weight per KPI, total 100%'), L('Ubah bobot, aktifkan scorecard', 'Change weight, activate scorecard'), 'Scorecard', 'KPI-002', 'KPI store', 'KPI.WEIGHT, SCORECARD.ACTIVATE', 'Progress, StatusChip, Approval', 'NB-04'),
    'KPI-DTL-001': sp(L('Baris KPI di mana saja', 'Any KPI row'), 'Target vs Actual, achievement, gap, weight, weighted score, status, trend, evidence', L('Input manual (dengan persetujuan), ubah KPI', 'Manual input (approval), edit KPI'), L('Periode', 'Period'), L('Tim → User → Race → Bukti', 'Team → User → Race → Evidence'), L('Sumber KPI (POS, GL, ops, CRM, HR)', 'KPI source (POS, GL, ops, CRM, HR)'), 'KPI.MANUAL, APPROVAL.REQUEST', C_KPI, 'NB-04'),
    'KPI-004': sp('KPI-DTL-001 / KPI-001', L('Versi, field berubah, tanggal berlaku', 'Versions, changed fields, effective date'), '—', 'KPI', L('Versi → audit', 'Version → audit'), 'KPI store, audit', '—', 'Table.Management, StatusChip', 'NB-04'),
    'XSCORE-001': sp(L('Menu Kinerja › XScore', 'Performance menu › XScore'), L('XScore, enam dimensi, eksploitasi/eksplorasi', 'XScore, six dimensions, exploitation/exploration'), L('Konfigurasi band', 'Configure bands'), '30D / Q / 6M / 12M', 'XSCORE-002 → KPI', 'KPI engine', 'XSCORE.BANDS', C_KPI, 'NB-05'),
    'XSCORE-002': sp('XSCORE-001', L('Skor dimensi, bobot, KPI penyusun', 'Dimension score, weight, contributing KPIs'), '—', L('Dimensi', 'Dimension'), 'KPI-DTL-001', 'KPI engine', '—', C_KPI, 'NB-05'),
    'TEAM-001': sp(L('Menu Kinerja › Tim', 'Performance menu › Teams'), L('Teamwork Score per tim, tren', 'Teamwork Score per team, trend'), '—', L('Plant', 'Plant'), 'TEAM-002', 'KPI engine', '—', C_KPI, 'NB-06'),
    'TEAM-002': sp('TEAM-001', L('Scorecard tim, kontribusi anggota (Personal Score disembunyikan tanpa izin)', 'Team scorecard, member contribution (Personal Score hidden without access)'), '—', '—', 'KPI → PERSON-001', 'KPI engine', '—', C_TBL, 'NB-06'),
    'PERF-001': sp(L('Landing frontline', 'Frontline landing'), L('Skor saya, target hari ini', 'My score, today\'s targets'), '—', '—', 'KPI', 'KPI engine', '—', 'Card.KPI, Progress', 'NB-07'),
    'PERF-HR-001': sp(L('Menu SDM', 'HR menu'), L('Personal Score sesuai cakupan', 'Personal Score within scope'), '—', L('Tim, band, status', 'Team, band, status'), 'PERSON-001', 'HRIS, KPI engine', '—', C_TBL, 'NB-07'),
    'PERSON-001': sp('PERF-HR-001 / TEAM-002', L('Skor, KPI, 10 tab HR', 'Score, KPIs, 10 HR tabs'), L('Catatan HR, coaching', 'HR note, coaching'), L('Tab', 'Tabs'), 'KPI → Race', 'HRIS, KPI engine', 'HR.NOTE, ACCESS.GRANT', 'Tabs, Card.KPI, Modal', 'NB-07'),
    'RACE-001': sp(L('Menu Race', 'Race menu'), L('Progres, blocker, bukti', 'Progress, blocker, evidence'), L('Update progres, eskalasi', 'Update progress, escalate'), L('Semua / Race saya', 'All / My races'), 'KPI → Goal', 'Ops events', 'RACE.UPDATE, RACE.ESCALATE', 'Card.KPI, Progress, Modal', 'NB-08'),
    'RACE-002': sp('RACE-001', L('Target, aktual, pace, varian', 'Target, actual, pace, variance'), '—', '—', 'KPI → Goal', 'KPI engine', '—', C_TBL, 'NB-08'),
    'RACE-003': sp(L('Menu Race › R2RE', 'Race menu › R2RE'), L('Skor minggu, prioritas review, KPI per kategori', 'Week score, review priority, KPIs by category'), L('Mulai Meeting Mode', 'Start Meeting Mode'), L('Minggu', 'Week'), 'RACE-004', 'KPI engine', '—', C_TBL + ', Card.Alert', 'NB-08'),
    'RACE-004': sp('RACE-003', L('Satu KPI: target, aktual, bobot, tren', 'One KPI: target, actual, weight, trend'), L('Simpan & KPI berikutnya', 'Save & next KPI'), '—', 'KPI-DTL-001', 'KPI engine', 'R2RE.REVIEW, ISSUE.CREATE', 'Card.KPI, Charts, Button.Primary', 'NB-08'),
    'REFL-001': sp(L('Menu Race › Reflection', 'Race menu › Reflection'), L('Skor reflection, progres goal, issue', 'Reflection score, goal progress, issues'), L('Langkah §87, STRACON, persetujuan', '§87 steps, STRACON, approval'), 'W1 / W2 / W3 / W4 / ' + 'All', 'REFL-002…006', 'KPI engine', 'REFL.STATUS, STRACON.CREATE', 'Stepper, Tabs, ' + C_KPI, 'NB-09'),
    'REFL-002': sp('REFL-001', L('Bulanan, target, pencapaian, weighted', 'Monthly, target, achievement, weighted'), '—', L('Minggu', 'Week'), 'KPI-DTL-001', 'KPI engine', '—', C_TBL, 'NB-09'),
    'REFL-003': sp('REFL-001', L('Issue, umur, owner, status', 'Issue, age, owner, status'), L('Catat, perbarui, tutup, bawa ke depan', 'Log, update, close, carry forward'), '—', 'KPI', 'Issue store', 'ISSUE.CREATE, ISSUE.UPDATE, ISSUE.CLOSE, ISSUE.CARRY', C_TBL + ', Modal', 'NB-09'),
    'REFL-004': sp('REFL-001', 'WHAT, WHY, TREND, IMPACT, LESSON', '—', '—', 'KPI-DTL-001', 'KPI engine', '—', 'Card.Insight', 'NB-09'),
    'REFL-005': sp('REFL-001', L('Ringkasan, progres goal, strategi', 'Summary, goal progress, strategies'), L('Perbarui strategi', 'Update strategy'), '—', 'GOAL-002, KPI', 'Strategy store', 'STRATEGY.CHANGE', C_TBL, 'NB-09'),
    'REFL-006': sp('REFL-001', L('Tahap alur, riwayat, amandemen', 'Flow stage, history, amendments'), L('Kirim, setujui & freeze, amandemen', 'Send, approve & freeze, amend'), '—', 'AUD-PERF-001', 'Reflection store', 'REFL.STATUS, REFL.AMEND', C_APR + ', Stepper', 'NB-09'),
    'DI-001': sp(L('Menu Keputusan', 'Decisions menu'), L('Brief lima area', 'Five-area brief'), L('Buka insight', 'Open insight'), '—', 'DI-002', 'KPI engine', '—', 'Card.Insight, Card.Alert', 'NB-10'),
    'DI-002': sp('DI-001', 'WHAT, WHY, RISK, RECOMMENDATION, ACTION + source', 'Assign, Task, Investigate, Approve', L('Tipe insight', 'Insight type'), L('Sumber KPI', 'Source KPI'), 'KPI engine', 'INSIGHT.ACT', 'Card.Insight, Modal', 'NB-10'),
    'DI-003': sp(L('Menu Keputusan › Alert', 'Decisions menu › Alerts'), L('Alert per severitas & dampak', 'Alerts by severity & impact'), L('Terima, assign, selesai', 'Acknowledge, assign, resolve'), L('Status', 'Status'), L('Sumber', 'Source'), 'KPI engine', 'ALERT.ACT', 'Card.Alert, Filter', 'NB-10'),
    'DI-004': sp(L('Menu Keputusan › Rekomendasi', 'Decisions menu › Recommendations'), L('Rekomendasi, dampak, owner, due', 'Recommendation, impact, owner, due'), L('Terima, kerjakan, selesai, tolak', 'Accept, start, done, reject'), L('Status', 'Status'), L('Insight / strategi sumber', 'Source insight / strategy'), 'Insight, strategy', 'REC.STATUS, DECISION.CREATE', 'Card.Insight, Modal', 'NB-10'),
    'DI-005': sp(L('Menu Keputusan', 'Decisions menu'), L('Keputusan, owner, hasil', 'Decision, owner, result'), L('Catat keputusan, hasil aktual', 'Record decision, actual result'), L('Status', 'Status'), L('Insight sumber', 'Source insight'), 'Decision store', 'DECISION.CREATE, DECISION.RESULT', C_TBL, 'NB-10'),
    'REPORT-001': sp(L('Menu Keputusan › Laporan', 'Decisions menu › Reports'), L('Laporan per area', 'Reports by area'), L('Pratinjau, PDF, Excel, CSV, jadwal', 'Preview, PDF, Excel, CSV, schedule'), L('Area', 'Area'), L('Laporan → layar sumber', 'Report → source screen'), 'All engines', 'REPORT.EXPORT', C_TBL, 'NB-10'),
    'APR-PERF-001': sp(L('Menu Kontrol & Audit › Persetujuan', 'Control & Audit menu › Approvals'), L('Antrian: input manual, koreksi keuangan, versi KPI, scorecard, reflection, STRACON, keputusan', 'Queue: manual actual, financial adjustment, KPI version, scorecard, reflection, STRACON, decision'), L('Setujui, tolak (wajib alasan)', 'Approve, reject (reason required)'), L('Menunggu / Diputuskan', 'Pending / Decided'), L('Item → layar sumber', 'Item → source screen'), 'Approval store', 'APPROVAL.REQUEST, APPROVAL.APPROVE, APPROVAL.REJECT', C_APR, 'NB-04'),
    'AUD-PERF-001': sp(L('Menu Kontrol & Audit › Audit', 'Control & Audit menu › Audit'), L('Siapa, kapan, lama, baru, alasan, persetujuan; rincian hitung skor', 'Who, when, old, new, reason, approval; score calculation breakdown'), 'Export', L('Objek: Goal, KPI, Target, Bobot, Formula, Aktual, Scorecard, Race, Issue, Reflection, Strategi, Keputusan, Persetujuan', 'Object: Goal, KPI, Target, Weight, Formula, Actual, Scorecard, Race, Issue, Reflection, Strategy, Decision, Approval'), L('Skor → komponen → bobot → sumber', 'Score → component → weight → source'), 'Audit log', 'REPORT.EXPORT', C_TBL, 'NB-04')
  };
  var DEVICE = {
    d: ['HOM-EXE-001', 'EXEC-001', 'EXE-PIL-001', 'FIN-001', 'FIN-002', 'FIN-003', 'FIN-004', 'FIN-005', 'FIN-006', 'GOAL-001', 'GOAL-002', 'KPI-001', 'KPI-002', 'KPI-003', 'KPI-004', 'KPI-DTL-001', 'XSCORE-001', 'XSCORE-002', 'TEAM-001', 'TEAM-002', 'PERF-HR-001', 'PERSON-001', 'DI-002', 'DI-005', 'REPORT-001', 'AUD-PERF-001'],
    t: ['RACE-002', 'RACE-003', 'RACE-004', 'REFL-001', 'REFL-002', 'REFL-003', 'REFL-004', 'REFL-005', 'REFL-006', 'APR-PERF-001'],
    m: ['RACE-001', 'DI-001', 'DI-003', 'PERF-001', 'DI-004']
  };
  var DEV_TXT = { d: L('Utama di desktop: grid, chart, tabel, drill-down. iPad 2 kolom. HP: ringkasan dan aksi, tabel jadi daftar kartu.', 'Desktop first: grids, charts, tables, drill-down. iPad two columns. Mobile: summary and actions, tables become card lists.'),
    t: L('Utama di iPad: kartu besar, kontrol sentuh, meeting mode. Desktop lebih lebar; HP satu kolom.', 'iPad first: large cards, touch controls, meeting mode. Desktop wider; mobile single column.'),
    m: L('Utama di HP: satu kolom, aksi cepat, tombol bawah. Desktop dan iPad menampilkan lebih banyak konteks.', 'Mobile first: single column, quick actions, bottom buttons. Desktop and iPad show more context.') };
  function device(id) { return DEVICE.t.indexOf(id) >= 0 ? 't' : DEVICE.m.indexOf(id) >= 0 ? 'm' : 'd'; }

  // §96 and §97
  var MODEL = {
    exec: ['3-Year Roadmap', 'Orbital Goal', 'Business Goal', 'Quarterly Goal', 'Monthly STRACON', 'Daily Race', 'Weekly Race', 'R2RE', 'Monthly Reflection', 'Summary Insight', 'Strategy Toward Goal', 'Next STRACON'],
    score: ['Personal Score', 'Teamwork Score', 'XScore'],
    health: ['Financial Health', 'Operations Health', 'Client Health', 'Quality Health', 'People Health', 'Future Health'],
    out: ['Executive Business Health', 'Decision Intelligence'],
    links: { 'Orbital Goal': 'GOAL-001', 'Business Goal': 'GOAL-001', 'Quarterly Goal': 'GOAL-001', 'Monthly STRACON': 'REFL-001', 'Daily Race': 'RACE-001', 'Weekly Race': 'RACE-002', 'R2RE': 'RACE-003', 'Monthly Reflection': 'REFL-001', 'Summary Insight': 'REFL-004', 'Strategy Toward Goal': 'REFL-005', 'Next STRACON': 'REFL-001',
      'Personal Score': 'PERF-001', 'Teamwork Score': 'TEAM-001', 'XScore': 'XSCORE-001', 'Financial Health': 'FIN-001', 'Executive Business Health': 'EXEC-001', 'Decision Intelligence': 'DI-002' }
  };
  RULES = RULES.concat([L('Target vs aktual, pencapaian, gap, bobot, weighted score, status, tren dan bukti di setiap KPI', 'Target vs actual, achievement, gap, weight, weighted score, status, trend and evidence on every KPI'), L('KPI→Goal, Race→KPI, Reflection→Strategi, Strategi→Goal, keputusan→owner, insight→sumber', 'KPI→Goal, Race→KPI, Reflection→Strategy, Strategy→Goal, decision→owner, insight→source'), L('Setiap perubahan dan persetujuan tercatat di audit', 'Every change and approval is audited'), L('Bahasa Indonesia default, brand J\'Fresh', 'Bahasa Indonesia by default, J\'Fresh brand')]);
  DONT = DONT.concat([L('Mengaktifkan scorecard bila total bobot ≠ 100%', 'Activate a scorecard when weights ≠ 100%'), L('Race Leader mengubah target/bobot', 'Race Leader changing target/weight'), L('Meminta bukti manual bila bukti sistem ada', 'Ask for manual evidence when system evidence exists'), L('Menampilkan Personal Score ke yang tidak berhak', 'Show Personal Scores to unauthorised users'), L('Menyembunyikan detail keuangan di balik XScore', 'Hide financial detail behind XScore'), L('Angka tanpa drill-down', 'Numbers without drill-down'), L('Reflection sebagai laporan statis', 'Reflection as a static report'), L('Membuang issue yang belum selesai', 'Discard unresolved issues'), L('Insight tanpa sumber', 'Insights without a source'), L('Membuat ulang logo', 'Recreate the logo')]);

  var RESPONSIVE = [
    ['1440', L('Desktop: sidebar bergrup, grid 3 kolom NV-02, tabel penuh, panel konteks dan drill-down.', 'Desktop: grouped sidebar, NV-02 three-column grid, full tables, context panel and drill-down.')],
    ['900', L('iPad: rail ikon, kartu 2 kolom, Meeting Mode R2RE satu KPI per layar, editor KPI hanya field terpilih.', 'iPad: icon rail, two-column cards, R2RE Meeting Mode one KPI per screen, KPI editor with selected fields only.')],
    ['390', L('Mobile: bottom nav, satu kolom, ringkasan dan aksi cepat; KPI builder berganti ringkasan + setujui + update aktual, tidak memadatkan dashboard desktop.', 'Mobile: bottom nav, single column, summary and quick actions; KPI builder becomes summary + approve + update actual, never a squeezed desktop dashboard.')],
    ['A11Y', L('Target sentuh ≥ 44 px, fokus terlihat, dialog bisa ditutup dengan Escape, skor punya label teks.', 'Touch targets ≥ 44 px, visible focus, dialogs close with Escape, scores carry text labels.')],
    ['QA', L('41 layar dan tab dibuka sebagai owner, finance, supervisor, HR dan Race Leader di 1440, 900 dan 390 px; 247 tombol aksi diklik sebagai owner; 0 error, 0 overflow.', '41 screens and tabs opened as owner, finance, supervisor, HR and Race Leader at 1440, 900 and 390 px; 247 action buttons clicked as owner; 0 errors, 0 overflow.')]
  ];

  var NOTES = {
    received: L('§81–§97 dan visual NV-02 diterima 7 Okt 2026 dan sudah dibangun di versi ini.', '§81–§97 and visual NV-02 arrived on 7 Oct 2026 and are built in this version.')
  };

  var API = { VISUALS: VISUALS, NP: NP, SCORES: SCORES, RULES: RULES, DONT: DONT, DOD: DOD, RESPONSIVE: RESPONSIVE, NOTES: NOTES, SPEC: SPEC, DEV_TXT: DEV_TXT, device: device, MODEL: MODEL, go: go };
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
  else root.JFPERF_DOCS = API;
})(typeof window !== 'undefined' ? window : this);
