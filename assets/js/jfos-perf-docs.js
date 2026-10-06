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
    { k: 'NV-02', f: null, t: L('Financial Health & Cash Position', 'Financial Health & Cash Position'), missing: true },
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
      links: [[L('Buka Financial Health', 'Open Financial Health'), go('owner', 'FIN-HLT-001')], [L('Sebagai Finance', 'As Finance'), go('finance', 'FIN-HLT-001')]] },
    { k: 'NP-03', id: 'np03', ic: 'target', v: 'NV-03', t: L('Goal Cascade & Orbital Goal', 'Goal Cascade & Orbital Goal'),
      d: L('Roadmap 3 tahun sampai Daily Race; setiap goal terhubung satu level ke atas.', '3-year roadmap down to Daily Race; every goal links one level up.'),
      built: [L('Tujuh level dari Roadmap sampai Daily Race', 'Seven levels from Roadmap to Daily Race'), L('Status On Track, At Risk, Off Track, Completed, Cancelled', 'On Track, At Risk, Off Track, Completed, Cancelled statuses'), L('Progres otomatis dari KPI, milestone dan race; koreksi manual wajib alasan', 'Progress from KPIs, milestones and races; manual adjustment needs a reason'), L('Detail goal dengan 8 tab', 'Goal detail with 8 tabs'), L('Goal tanpa induk ditolak', 'A goal without a parent is refused')],
      links: [[L('Buka Goal Cascade', 'Open Goal Cascade'), go('owner', 'GOL-CAS-001')], [L('Contoh detail goal', 'Sample goal detail'), go('owner', 'GOL-DTL-001/BG-H2-01')]] },
    { k: 'NP-04', id: 'np04', ic: 'list', v: 'NV-04', t: L('KPI Master, Kontrak & Bobot', 'KPI Master, Contract & Weighting'),
      d: L('KPI resmi dengan kontrak, bobot 100% per scorecard dan versi yang tidak menimpa riwayat.', 'Official KPIs with a contract, 100% weights per scorecard and versions that never overwrite history.'),
      built: [L('Library KPI per kategori termasuk Keberlanjutan', 'KPI library by category including Sustainability'), L('Editor: kode, target, bobot, floor, cap, stretch, arah, sumber, bukti, reviewer, approver', 'Editor: code, target, weight, floor, cap, stretch, direction, source, evidence, reviewer, approver'), L('Weight board dengan pesan kurang / lebih / valid 100%', 'Weight board with under / over / valid 100% messages'), L('Lifecycle Draft → Review → Approved → Active → Frozen → Archived', 'Lifecycle Draft → Review → Approved → Active → Frozen → Archived'), L('Mengubah KPI aktif membuat versi draft baru', 'Changing an active KPI creates a new draft version')],
      links: [[L('Buka KPI Master', 'Open KPI Master'), go('owner', 'KPI-MST-001')], [L('Detail KPI SLA', 'SLA KPI detail'), go('owner', 'KPI-DTL-001/OPS-01')]] },
    { k: 'NP-05', id: 'np05', ic: 'gauge', v: 'NV-05', t: L('XScore', 'XScore'),
      d: L('Satu skor 0–100 dari kerangka KPI Ambidex: eksploitasi 80%, eksplorasi 20%.', 'One 0–100 score from the Ambidex KPI framework: exploitation 80%, exploration 20%.'),
      built: [L('Enam dimensi dengan bobot efektif', 'Six dimensions with effective weights'), L('Periode 30D, Kuartal, 6M, 12M', '30D, Quarter, 6M, 12M periods'), L('Band status yang bisa dikonfigurasi dan divalidasi', 'Configurable, validated status bands'), L('Drill ke KPI yang paling menurunkan skor', 'Drill to the KPI pulling the score down most')],
      links: [[L('Buka XScore', 'Open XScore'), go('owner', 'XSC-001')]] },
    { k: 'NP-06', id: 'np06', ic: 'users', v: 'NV-06', t: L('Teamwork Score', 'Teamwork Score'),
      d: L('Skor tim dari KPI bersama, bukan rata-rata skor anggota.', 'Team score from shared KPIs, never an average of member scores.'),
      built: [L('Kartu skor per tim dengan tren dan lead', 'Score card per team with trend and lead'), L('Scorecard KPI tim berbobot 100%', 'Team KPI scorecard weighted to 100%'), L('Perbandingan skor tim vs rata-rata anggota', 'Team score vs member average comparison'), L('Kontribusi anggota dicatat terpisah', 'Member contribution recorded separately')],
      links: [[L('Buka Teamwork Score', 'Open Teamwork Score'), go('owner', 'TEAM-001')], [L('Tim Receiving', 'Receiving team'), go('owner', 'TEAM-DTL-001/rcv')]] },
    { k: 'NP-07', id: 'np07', ic: 'idcard', v: 'NV-07', t: L('Personal Score & Kinerja HR', 'Personal Score & HR Performance'),
      d: L('Personal Score = KPI individu + kontribusi tim, sesuai peran. Skor mendukung HR, tidak menggantikan manusia.', 'Personal Score = individual KPIs + team contribution, by role. Scores support HR and never replace people.'),
      built: [L('Layar frontline sederhana: skor saya dan target hari ini', 'Simple frontline screen: my score and today\'s targets'), L('Daftar karyawan sesuai cakupan (supervisor hanya timnya)', 'Employee list within scope (supervisors see their teams only)'), L('Profil dengan 10 tab HR: kehadiran, coaching, training, prestasi, rekognisi, probation, PIP, promosi, riwayat', 'Profile with 10 HR tabs: attendance, coaching, training, achievement, recognition, probation, PIP, promotion, history'), L('Catatan HR hanya dengan izin hr.manage dan tercatat di audit', 'HR notes only with hr.manage and logged in the audit'), L('Tidak ada pemberhentian, disiplin atau promosi otomatis', 'No automatic termination, discipline or promotion')],
      links: [[L('Kinerja Individu', 'Individual Performance'), go('owner', 'PERF-HR-001')], [L('Kinerja Saya (operator)', 'My Performance (operator)'), APP + encodeURIComponent('#/operator/PERF-001') + '#/?u=made']] },
    { k: 'NP-08', id: 'np08', ic: 'flag', v: 'NV-08', t: L('Daily Race, Weekly Race & R2RE', 'Daily Race, Weekly Race & R2RE'),
      d: L('Eksekusi harian dan mingguan yang terhubung ke goal dan KPI, ditinjau di R2RE.', 'Daily and weekly execution linked to goals and KPIs, reviewed in R2RE.'),
      built: [L('Daily Race: PIC, progres, blocker, eskalasi, bukti otomatis', 'Daily Race: owner, progress, blocker, escalation, automatic evidence'), L('Weekly Race: target, aktual, pencapaian, varian, status', 'Weekly Race: target, actual, achievement, variance, status'), L('R2RE Board per minggu dan kategori, bobot 100%', 'R2RE board per week and category, weights 100%'), L('Meeting Mode satu KPI per layar: why, root cause, impact, recovery, keputusan', 'Meeting Mode one KPI per screen: why, root cause, impact, recovery, decision')],
      links: [[L('Buka Daily Race', 'Open Daily Race'), go('owner', 'RACE-DLY-001')], [L('R2RE Board', 'R2RE Board'), go('owner', 'R2RE-001')]] },
    { k: 'NP-09', id: 'np09', ic: 'history', v: 'NV-09', t: L('Monthly Reflection & Strategy', 'Monthly Reflection & Strategy'),
      d: L('Refleksi bulanan dari 4 R2RE, issue, insight, strategi dan STRACON bulan berikutnya.', 'Monthly reflection from 4 R2REs, issues, insights, strategy and next month\'s STRACON.'),
      built: [L('Bobot bulanan dirata-rata lalu dinormalisasi ke 100%, tidak dijumlah 400%', 'Monthly weights averaged then normalised to 100%, never summed to 400%'), L('Konsolidasi, tren, issue, insight, ringkasan dan strategi', 'Consolidation, trend, issues, insights, summary and strategy'), L('STRACON baru dengan carry forward', 'New STRACON with carry forward'), L('Alur persetujuan sampai freeze; perubahan setelah freeze lewat amandemen', 'Approval flow up to freeze; changes after freeze go through an amendment')],
      links: [[L('Buka Monthly Reflection', 'Open Monthly Reflection'), go('owner', 'REFL-001')]] },
    { k: 'NP-10', id: 'np10', ic: 'bulb', v: 'NV-10', t: L('Decision Intelligence & Reporting', 'Decision Intelligence & Reporting'),
      d: L('Executive Brief, insight WHAT · WHY · RISK · RECOMMENDATION · ACTION, Decision Log dan Report Library.', 'Executive Brief, WHAT · WHY · RISK · RECOMMENDATION · ACTION insights, Decision Log and Report Library.'),
      built: [L('Executive Brief harian lima area', 'Daily Executive Brief across five areas'), L('Insight deskriptif, diagnostik, prediktif, preskriptif dengan aksi', 'Descriptive, diagnostic, predictive, prescriptive insights with actions'), L('Decision Log dengan owner, hasil diharapkan dan aktual', 'Decision Log with owner, expected and actual results'), L('Report Library: pratinjau, PDF, Excel, CSV', 'Report Library: preview, PDF, Excel, CSV')],
      links: [[L('Buka Executive Brief', 'Open Executive Brief'), go('owner', 'DI-BRF-001')], [L('Report Library', 'Report Library'), go('owner', 'DI-RPT-001')]] }
  ];

  var SCORES = [
    ['Business Health Score', L('Snapshot kondisi bisnis dari 6 pilar berbobot.', 'Condition snapshot from six weighted pillars.'), 'HOM-EXE-001'],
    ['Financial Health Score', L('Scorecard khusus keuangan: revenue, margin, kas, collection, AR, biaya, quick ratio.', 'Finance-only scorecard: revenue, margin, cash, collection, AR, cost, quick ratio.'), 'FIN-HLT-001'],
    ['XScore', L('Kinerja periode pada kerangka KPI Ambidex (eksploitasi 80% · eksplorasi 20%).', 'Period performance on the Ambidex KPI framework (exploitation 80% · exploration 20%).'), 'XSC-001'],
    ['Teamwork Score', L('Hasil KPI bersama tim, bukan rata-rata skor anggota.', 'Shared team KPI results, never an average of member scores.'), 'TEAM-001'],
    ['Personal Score', L('KPI individu + kontribusi tim, formula sesuai peran.', 'Individual KPIs + team contribution, formula by role.'), 'PERF-001']
  ];

  var RULES = [L('Satu sumber angka: semua skor dihitung di satu engine', 'One source of numbers: every score comes from one engine'), L('Bobot setiap scorecard tepat 100%', 'Every scorecard weighs exactly 100%'), L('Versi KPI tidak pernah menimpa riwayat', 'KPI versions never overwrite history'), L('Setiap goal terhubung ke atas', 'Every goal links upward'), L('Input manual wajib pemilik dan alasan atau bukti', 'Manual input needs an owner and a reason or evidence'), L('Akses per izin dan cakupan', 'Access by permission and scope'), L('Audit siapa, kapan, sebelum, sesudah, alasan', 'Audit who, when, before, after, reason'), L('Bahasa Indonesia dulu, Design System Fase 3', 'Indonesian first, Phase 3 design system')];
  var DONT = [L('Menjumlah bobot 4 minggu menjadi 400%', 'Sum four weekly weights to 400%'), L('Menghitung skor tim dari rata-rata anggota', 'Compute a team score from the member average'), L('Keputusan HR otomatis dari skor', 'Automatic HR decisions from a score'), L('Menampilkan rekening bank tanpa izin', 'Show bank accounts without permission'), L('Mengubah KPI aktif tanpa versi baru', 'Change an active KPI without a new version'), L('Membangun ulang logika Fase 1–4 yang sudah disetujui', 'Rebuild approved Phase 1–4 logic')];

  var DOD = [
    [L('Lima skor dihitung dari engine yang sama dan dites', 'Five scores computed by the same engine and tested'), 'done', 'tests.html'],
    [L('Semua 23 layar NP-01 sampai NP-10 berjalan di aplikasi', 'All 23 NP-01 to NP-10 screens run in the app'), 'done', 'screens.html'],
    [L('Bobot 100% divalidasi di KPI, R2RE dan refleksi', '100% weights validated in KPIs, R2RE and reflection'), 'done', 'tests.html#np04'],
    [L('Akses per peran: frontline sederhana, manajemen lengkap', 'Access by role: simple frontline, comprehensive management'), 'done', 'tests.html#np07'],
    [L('PC, iPad dan mobile diperiksa tanpa overflow', 'PC, iPad and mobile checked with no overflow'), 'done', 'tests.html#responsive'],
    [L('Audit perubahan KPI, target, bobot, formula (§81)', 'Audit of KPI, target, weight, formula changes (§81)'), 'done', 'tests.html#audit'],
    [L('Data asli dari server, akuntansi dan HRIS', 'Real data from the server, accounting and HRIS'), 'backend', 'index.html#backend']
  ];

  var RESPONSIVE = [
    ['1440', L('Desktop: sidebar bergrup, 8 tile sebaris di layar lebar, tabel penuh.', 'Desktop: grouped sidebar, 8 tiles in a row on wide screens, full tables.')],
    ['900', L('iPad: rail ikon, tile 4 kolom, kartu 2 kolom, tabel bisa digeser.', 'iPad: icon rail, 4-column tiles, 2-column cards, scrollable tables.')],
    ['390', L('Mobile: bottom nav, tile 2 kolom, kartu satu kolom, dialog sebagai bottom sheet, tombol aksi menempel di bawah.', 'Mobile: bottom nav, 2-column tiles, single-column cards, dialogs as bottom sheets, sticky action buttons.')],
    ['A11Y', L('Target sentuh ≥ 44 px, fokus terlihat, dialog bisa ditutup dengan Escape, skor punya label teks.', 'Touch targets ≥ 44 px, visible focus, dialogs close with Escape, scores carry text labels.')],
    ['QA', L('23 layar dan semua tab dibuka sebagai owner di 1440, 900 dan 390 px; 146 tombol aksi diklik; 0 error.', '23 screens and every tab opened as owner at 1440, 900 and 390 px; 146 action buttons clicked; 0 errors.')]
  ];

  var NOTES = {
    truncated: L('Master prompt Fase 5 yang diterima terpotong di §81 Auditability ("Log changes to: Goal KPI Target Weight Formula"). Bagian yang diterima sudah dibangun; bagian setelah §81 menunggu teks lengkap.', 'The Phase 5 master prompt arrived cut off at §81 Auditability ("Log changes to: Goal KPI Target Weight Formula"). Everything received is built; anything after §81 waits for the full text.'),
    nv02: L('Visual NV-02 (Financial Health & Cash Position) belum dikirim. Layar FIN-HLT-001 dibangun dari teks NP-02 dan gaya visual lainnya.', 'Visual NV-02 (Financial Health & Cash Position) has not been sent. FIN-HLT-001 is built from the NP-02 text and the other visuals\' style.')
  };

  var API = { VISUALS: VISUALS, NP: NP, SCORES: SCORES, RULES: RULES, DONT: DONT, DOD: DOD, RESPONSIVE: RESPONSIVE, NOTES: NOTES, go: go };
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
  else root.JFPERF_DOCS = API;
})(typeof window !== 'undefined' ? window : this);
