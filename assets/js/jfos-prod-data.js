/* ==========================================================================
   JFRESH OS — Laundry Production sample data (Phase 8 · NP 1.0)
   One plant day (2026-10-06, clock 10:30, the same day as Phase 7): the
   production teams, machines and programs, sorting categories, the item
   picker, client sorting rules, receiving records, batches in every stage,
   handovers, rework, production issues, checklist templates (versioned),
   machine SOPs, maintenance plans, work orders and downtime.

   Clients, properties and services come from Phase 6 (JFCOMM); manifests,
   drivers and delivery orders come from Phase 7 (JFLOG). They are referenced
   by id here, never copied. Sample data only: names and numbers are
   illustrative.
   ========================================================================== */
(function (root) {
  function L(a, b) { return [a, b === undefined ? a : b]; }
  var D = { today: '2026-10-06', yday: '2026-10-05', simNow: '2026-10-06 10:30', plant: 'PL-01' };

  /* ---------- Teams (§2) ---------- */
  D.TEAMS = {
    t1: { k: 't1', n: L('Team 1 · Inbound & Persiapan', 'Team 1 · Inbound & Preparation'), short: L('Team 1', 'Team 1'), icon: 'basket', device: 'ipad', lead: 'EMP-101', members: ['EMP-101', 'EMP-001', 'EMP-061'], need: 3 },
    t2: { k: 't2', n: L('Team 2 · Washing & Drying', 'Team 2 · Washing & Drying'), short: L('Team 2', 'Team 2'), icon: 'droplet', device: 'ipad', lead: 'EMP-071', members: ['EMP-071', 'EMP-074', 'EMP-075'], need: 3 },
    t3: { k: 't3', n: L('Team 3 · Finishing, QC & Packing', 'Team 3 · Finishing, QC & Packing'), short: L('Team 3', 'Team 3'), icon: 'shirt', device: 'ipad', lead: 'EMP-077', members: ['EMP-077', 'EMP-064', 'EMP-070', 'EMP-062', 'EMP-078'], need: 6 },
    log: { k: 'log', n: L('Team 4 · Logistics', 'Team 4 · Logistics'), short: L('Logistics', 'Logistics'), icon: 'truck', device: 'mobile', lead: 'EMP-021', members: ['EMP-002', 'EMP-063', 'EMP-082', 'EMP-083'], need: 4 },
    mnt: { k: 'mnt', n: L('Maintenance', 'Maintenance'), short: L('Maintenance', 'Maintenance'), icon: 'wrench', device: 'desktop', lead: 'EMP-102', members: ['EMP-102'], need: 1 }
  };
  // Production staff (names for attribution). Phase 5 people keep their own records; two new employees join here.
  D.STAFF = {
    'EMP-101': { n: 'Putu Wardana', team: 't1', title: L('Team Leader · Inbound', 'Team Leader · Inbound'), shift: ['06:00', '14:00'] },
    'EMP-001': { n: 'Made Wirana', team: 't1', title: L('Receiving', 'Receiving'), shift: ['06:00', '14:00'] },
    'EMP-061': { n: 'Putu Rahayu', team: 't1', title: L('Receiving & Sorting', 'Receiving & Sorting'), shift: ['06:00', '14:00'] },
    'EMP-071': { n: 'Wayan Arta', team: 't2', title: L('Team Leader · Washing', 'Team Leader · Washing'), shift: ['06:00', '14:00'] },
    'EMP-074': { n: 'Putu Eka', team: 't2', title: L('Operator Washing', 'Washing Operator'), shift: ['06:00', '14:00'] },
    'EMP-075': { n: 'Nengah Budi', team: 't2', title: L('Operator Drying', 'Drying Operator'), shift: ['06:00', '14:00'] },
    'EMP-077': { n: 'Luh Putri', team: 't3', title: L('Team Leader · Finishing', 'Team Leader · Finishing'), shift: ['07:00', '15:00'] },
    'EMP-064': { n: 'Dewa Ayu', team: 't3', title: L('Finishing', 'Finishing'), shift: ['07:00', '15:00'], absent: true },
    'EMP-070': { n: 'Komang Sari', team: 't3', title: L('QC Lead', 'QC Lead'), shift: ['07:00', '15:00'] },
    'EMP-062': { n: 'Kadek Rina', team: 't3', title: L('QC', 'QC'), shift: ['07:00', '15:00'] },
    'EMP-078': { n: 'Gusti Rai', team: 't3', title: L('Packing', 'Packing'), shift: ['07:00', '15:00'] },
    'EMP-102': { n: 'Oka Merta', team: 'mnt', title: L('Teknisi Maintenance', 'Maintenance Technician'), shift: ['07:00', '16:00'] },
    'EMP-021': { n: 'Saras Pradnyani', team: 'spv', title: L('Supervisor Produksi', 'Production Supervisor'), shift: ['06:00', '15:00'] },
    'EMP-010': { n: 'Dewi Lestari', team: 'spv', title: L('Operations Manager', 'Operations Manager'), shift: ['08:00', '17:00'] },
    'EMP-050': { n: 'Aji Jaens', team: 'own', title: L('Owner / CEO', 'Owner / CEO'), shift: ['08:00', '17:00'] },
    'EMP-002': { n: 'Ketut Arsana', team: 'log', title: L('Driver', 'Driver') }, 'EMP-063': { n: 'Gede Wira', team: 'log', title: L('Driver', 'Driver') },
    'EMP-082': { n: 'Wayan Sudarma', team: 'log', title: L('Driver', 'Driver') }, 'EMP-083': { n: 'Komang Ari', team: 'log', title: L('Driver', 'Driver') }
  };

  /* ---------- Sorting categories (§12) with the default process per stage ---------- */
  D.CATS = {
    white: { n: L('White Linen', 'White Linen'), icon: 'bed', wash: 'P-WL', dry: 'P-DMD', fin: 'iron', grp: 'white', kgPc: 0.45, tone: 'info' },
    color: { n: L('Color Linen', 'Color Linen'), icon: 'palette', wash: 'P-CL', dry: 'P-DMD', fin: 'iron', grp: 'color', kgPc: 0.4, tone: 'appr' },
    towel: { n: L('Handuk', 'Towels'), icon: 'towel', wash: 'P-TW', dry: 'P-DHI', fin: 'fold', grp: 'towel', kgPc: 0.5, tone: 'info' },
    spa: { n: L('Linen Spa', 'Spa Linen'), icon: 'leaf', wash: 'P-SP', dry: 'P-DLO', fin: 'fold', grp: 'spa', kgPc: 0.35, tone: 'ok' },
    uniform: { n: L('Seragam', 'Uniform'), icon: 'shirt', wash: 'P-UN', dry: 'P-DLO', fin: 'press', grp: 'uniform', kgPc: 0.45, tone: 'info' },
    delicate: { n: L('Delicate', 'Delicate'), icon: 'feather', wash: 'P-DL', dry: 'air', fin: 'hang', grp: 'delicate', kgPc: 0.3, tone: 'warn' },
    heavy: { n: L('Kotor Berat', 'Heavy Soil'), icon: 'droplet', wash: 'P-HS', dry: 'P-DMD', fin: 'iron', grp: 'heavy', kgPc: 0.5, tone: 'warn' },
    special: { n: L('Perlakuan Khusus', 'Special Treatment'), icon: 'star', wash: 'P-ST', dry: 'special', fin: 'steam', grp: 'special', kgPc: 0.4, tone: 'crit' }
  };
  D.FLAGS = { noda: [L('Noda', 'Stain'), 'warn', 'droplet'], rusak: [L('Rusak', 'Damaged'), 'crit', 'xc'], kontaminasi: [L('Kontaminasi', 'Contaminated'), 'crit', 'alert'], priority: [L('Prioritas', 'Priority'), 'info', 'flag'], express: [L('Express', 'Express'), 'appr', 'zap'], superexpress: [L('Super Express', 'Super Express'), 'crit', 'zap'] };

  /* ---------- Item picker (§9) ---------- */
  D.ITEMS = [
    { k: 'bathtowel', n: L('Handuk Mandi', 'Bath Towel'), icon: 'towel', cat: 'towel', kg: 0.6 },
    { k: 'handtowel', n: L('Handuk Tangan', 'Hand Towel'), icon: 'towel', cat: 'towel', kg: 0.15 },
    { k: 'sheet', n: L('Sprei', 'Bed Sheet'), icon: 'bed', cat: 'white', kg: 0.7 },
    { k: 'pillow', n: L('Sarung Bantal', 'Pillow Case'), icon: 'bed', cat: 'white', kg: 0.15 },
    { k: 'duvet', n: L('Sarung Duvet', 'Duvet Cover'), icon: 'bed', cat: 'white', kg: 1.1 },
    { k: 'spa', n: L('Linen Spa', 'Spa Linen'), icon: 'leaf', cat: 'spa', kg: 0.35 },
    { k: 'uniform', n: L('Seragam', 'Uniform'), icon: 'shirt', cat: 'uniform', kg: 0.45 },
    { k: 'sarong', n: L('Sarung', 'Sarong'), icon: 'leaf', cat: 'spa', kg: 0.3 },
    { k: 'other', n: L('Lainnya', 'Other'), icon: 'package', cat: 'white', kg: 0.4 }
  ];
  D.UNITS = { kg: L('kg', 'kg'), pcs: L('pcs', 'pcs'), bag: L('bag', 'bag'), bundle: L('ikat', 'bundle'), set: L('set', 'set') };

  /* ---------- Programs ---------- */
  D.WASH_PROGS = {
    'P-WL': { n: L('Linen Putih 70°', 'White Linen 70°'), min: 45, temp: 70, chem: L('Alkali + Oxy Bleach + Softener', 'Alkali + Oxy Bleach + Softener'), cats: ['white'] },
    'P-CL': { n: L('Linen Warna 40°', 'Color Linen 40°'), min: 40, temp: 40, chem: L('Deterjen Warna + Softener', 'Color Detergent + Softener'), cats: ['color'] },
    'P-TW': { n: L('Handuk 60°', 'Towels 60°'), min: 50, temp: 60, chem: L('Deterjen + Oxy + Softener Ringan', 'Detergent + Oxy + Light Softener'), cats: ['towel'] },
    'P-SP': { n: L('Linen Spa 60° (minyak)', 'Spa Linen 60° (oil)'), min: 55, temp: 60, chem: L('Degreaser Minyak + Deterjen', 'Oil Degreaser + Detergent'), cats: ['spa'] },
    'P-UN': { n: L('Seragam 40°', 'Uniform 40°'), min: 40, temp: 40, chem: L('Deterjen Netral + Starch', 'Neutral Detergent + Starch'), cats: ['uniform'] },
    'P-DL': { n: L('Delicate 30°', 'Delicate 30°'), min: 30, temp: 30, chem: L('Deterjen Lembut', 'Mild Detergent'), cats: ['delicate'] },
    'P-HS': { n: L('Kotor Berat 75°', 'Heavy Soil 75°'), min: 65, temp: 75, chem: L('Pre-wash + Alkali Kuat + Bleach', 'Pre-wash + Strong Alkali + Bleach'), cats: ['heavy'] },
    'P-ST': { n: L('Perlakuan Khusus', 'Special Treatment'), min: 55, temp: 40, chem: L('Sesuai instruksi supervisor', 'Per supervisor instruction'), cats: ['special'] },
    'P-RW': { n: L('Rewash Noda', 'Stain Rewash'), min: 35, temp: 60, chem: L('Stain Remover + Oxy', 'Stain Remover + Oxy'), cats: ['white', 'color', 'towel', 'spa', 'heavy'] }
  };
  D.DRY_PROGS = {
    'P-DHI': { n: L('Panas Tinggi 75°', 'High Heat 75°'), min: 40, temp: 75 },
    'P-DMD': { n: L('Panas Sedang 60°', 'Medium Heat 60°'), min: 30, temp: 60 },
    'P-DLO': { n: L('Panas Rendah 45°', 'Low Heat 45°'), min: 25, temp: 45 }
  };
  D.DRY_METHODS = { machine: [L('Mesin Dryer', 'Machine Dryer'), 'wind'], air: [L('Angin-angin', 'Air Dry'), 'fan'], hang: [L('Gantung', 'Hang Dry'), 'hanger'], special: [L('Metode Khusus', 'Special Method'), 'star'] };
  D.FIN_METHODS = { iron: [L('Setrika (Flatwork)', 'Iron (Flatwork)'), 'iron'], press: [L('Press', 'Press'), 'layers'], fold: [L('Lipat', 'Fold'), 'layers'], hang: [L('Gantung', 'Hang'), 'hanger'], steam: [L('Steam', 'Steam'), 'cloud'] };

  /* ---------- Machines (§49, §69, §76). Phase 10 keeps purchase value, depreciation, warranty, vendor. ---------- */
  function mc(id, type, n, cap, loc, brand, serial, st, hours, cycles, x) { return Object.assign({ id: id, type: type, n: n, cap: cap, loc: loc, brand: brand, serial: serial, st: st, hours: hours, cycles: cycles, batch: null, since: null }, x || {}); }
  D.MACHINES = [
    mc('W-01', 'washer', L('Washer Extractor 60 kg', 'Washer Extractor 60 kg'), 60, L('Zona Washing · baris 1', 'Washing zone · row 1'), 'Electrolux Professional', 'WE60-21-0142', 'running', 6120, 9240, { installed: '2021-04-12' }),
    mc('W-02', 'washer', L('Washer Extractor 60 kg', 'Washer Extractor 60 kg'), 60, L('Zona Washing · baris 1', 'Washing zone · row 1'), 'Electrolux Professional', 'WE60-21-0143', 'normal', 5980, 9010, { installed: '2021-04-12' }),
    mc('W-03', 'washer', L('Washer Extractor 30 kg', 'Washer Extractor 30 kg'), 30, L('Zona Washing · baris 2', 'Washing zone · row 2'), 'Primus', 'FX300-22-0877', 'running', 4410, 7820, { installed: '2022-02-01' }),
    mc('W-04', 'washer', L('Washer Extractor 100 kg', 'Washer Extractor 100 kg'), 100, L('Zona Washing · baris 2', 'Washing zone · row 2'), 'Girbau', 'HS6110-23-0315', 'maintenance', 3260, 4120, { installed: '2023-05-20' }),
    mc('D-01', 'dryer', L('Tumble Dryer 50 kg', 'Tumble Dryer 50 kg'), 50, L('Zona Drying', 'Drying zone'), 'Electrolux Professional', 'TD50-21-0311', 'normal', 5820, 10240, { installed: '2021-04-12', fuel: 'gas' }),
    mc('D-02', 'dryer', L('Tumble Dryer 50 kg', 'Tumble Dryer 50 kg'), 50, L('Zona Drying', 'Drying zone'), 'Electrolux Professional', 'TD50-21-0312', 'running', 5790, 10110, { installed: '2021-04-12', fuel: 'gas' }),
    mc('D-03', 'dryer', L('Tumble Dryer 30 kg', 'Tumble Dryer 30 kg'), 30, L('Zona Drying', 'Drying zone'), 'Primus', 'T30-22-0450', 'repair', 3980, 8040, { installed: '2022-02-01', fuel: 'electric' }),
    mc('D-04', 'dryer', L('Tumble Dryer 80 kg', 'Tumble Dryer 80 kg'), 80, L('Zona Drying', 'Drying zone'), 'Girbau', 'ED1100-23-0128', 'normal', 2950, 3900, { installed: '2023-05-20', fuel: 'gas' }),
    mc('D-05', 'dryer', L('Tumble Dryer 50 kg', 'Tumble Dryer 50 kg'), 50, L('Zona Drying', 'Drying zone'), 'Primus', 'T50-24-0091', 'offline', 1210, 1880, { installed: '2024-08-15', fuel: 'gas', why: L('Tidak dijadwalkan shift pagi (hemat gas).', 'Not scheduled for the morning shift (gas saving).') }),
    mc('FL-01', 'ironer', L('Flatwork Ironer Line 1', 'Flatwork Ironer Line 1'), 60, L('Zona Finishing', 'Finishing zone'), 'Girbau', 'PC120-22-0019', 'running', 4870, 0, { installed: '2022-03-10', perH: true }),
    mc('FL-02', 'fold', L('Meja Press & Lipat', 'Press & Fold Station'), 40, L('Zona Finishing', 'Finishing zone'), 'JFRESH', 'PF-01', 'normal', 0, 0, { perH: true }),
    mc('IR-01', 'iron', L('Steam Iron 1', 'Steam Iron 1'), 15, L('Zona Finishing', 'Finishing zone'), 'Silter', 'SPR2000-23-118', 'normal', 2300, 0, { perH: true }),
    mc('IR-02', 'iron', L('Steam Iron 2', 'Steam Iron 2'), 15, L('Zona Finishing', 'Finishing zone'), 'Silter', 'SPR2000-23-119', 'normal', 2240, 0, { perH: true }),
    mc('BL-01', 'boiler', L('Boiler Uap 300 kg/jam', 'Steam Boiler 300 kg/h'), 300, L('Ruang Utilitas', 'Utility room'), 'Miura', 'EX300-21-77', 'normal', 7400, 0, {}),
    mc('WF-01', 'filter', L('Water Filter & Softener', 'Water Filter & Softener'), 0, L('Ruang Utilitas', 'Utility room'), 'Pentair', 'WS-2100-88', 'normal', 0, 0, {}),
    mc('IP-01', 'ipal', L('IPAL (Pengolahan Air Limbah)', 'IPAL (Wastewater Treatment)'), 0, L('Area Belakang', 'Back area'), 'Biofive', 'IPAL-12-3', 'normal', 0, 0, {})
  ];
  D.MACH_TYPES = { washer: [L('Mesin Cuci', 'Washing Machine'), 'washer'], dryer: [L('Dryer', 'Dryer'), 'wind'], ironer: [L('Flatwork Ironer', 'Flatwork Ironer'), 'iron'], fold: [L('Meja Press & Lipat', 'Press & Fold'), 'layers'], iron: [L('Steam Iron', 'Steam Iron'), 'iron'], boiler: [L('Boiler', 'Boiler'), 'zap'], filter: [L('Water Filter', 'Water Filter'), 'filter'], ipal: [L('IPAL', 'IPAL'), 'loop'], other: [L('Peralatan Lain', 'Other Equipment'), 'wrench'] };
  D.DOCS = {
    washer: [L('Manual operasi washer', 'Washer operating manual'), L('SOP harian washer (JFRESH)', 'Washer daily SOP (JFRESH)')], dryer: [L('Manual operasi dryer', 'Dryer operating manual'), L('SOP keselamatan gas', 'Gas safety SOP')],
    iron: [L('Manual steam iron', 'Steam iron manual')], ironer: [L('Manual flatwork ironer', 'Flatwork ironer manual')], boiler: [L('Izin & manual boiler', 'Boiler permit & manual')], filter: [L('Manual water filter', 'Water filter manual')], ipal: [L('Izin & SOP IPAL', 'IPAL permit & SOP')]
  };

  /* ---------- Machine SOP baselines (§70–§72) ---------- */
  function sop(code, n, freq, x) { return Object.assign({ code: code, n: n, freq: freq }, x || {}); }
  D.SOP = {
    washer: [sop('W1', L('Bersihkan lint / filter', 'Clean lint / filter'), 'daily'), sop('W2', L('Bersihkan karet pintu (door seal)', 'Clean door seal'), 'daily'), sop('W8', L('Cek suara abnormal', 'Check abnormal noise'), 'daily'), sop('W9', L('Cek getaran abnormal', 'Check abnormal vibration'), 'daily'),
      sop('W3', L('Jalankan cleaning cycle', 'Run the cleaning cycle'), 'weekly'), sop('W4', L('Bersihkan laci deterjen', 'Clean detergent drawer'), 'weekly'),
      sop('W5', L('Periksa pompa', 'Inspect pump'), 'monthly', { danger: true }), sop('W6', L('Cek leveling mesin', 'Check machine leveling'), 'monthly'), sop('W7', L('Cek pipa air & selang', 'Check water pipes & hoses'), 'monthly')],
    dryer: [sop('D1', L('Bersihkan lint trap', 'Clean lint trap'), 'daily'), sop('D11', L('Cek suara abnormal', 'Check abnormal noise'), 'daily'),
      sop('D2', L('Cek ventilasi', 'Check ventilation'), 'weekly'), sop('D8', L('Bersihkan drum', 'Clean drum'), 'weekly'), sop('D9', L('Bersihkan / ganti filter', 'Clean / replace filter'), 'weekly'), sop('D10', L('Cek pintu & seal', 'Check door & seal'), 'weekly'),
      sop('D3', L('Bersihkan duct', 'Clean duct'), 'monthly', { danger: true }), sop('D4', L('Periksa pipa gas', 'Inspect gas pipe'), 'monthly', { danger: true }), sop('D7', L('Cek sensor kelembapan', 'Check moisture sensor'), 'monthly'),
      sop('D5', L('Cek heater', 'Check heater'), 'quarterly', { danger: true }), sop('D6', L('Cek ignitor', 'Check ignitor'), 'quarterly', { danger: true })],
    iron: [sop('S3', L('Bersihkan plat setrika', 'Clean iron plate'), 'daily'), sop('S7', L('Simpan aman setelah dipakai', 'Store safely after use'), 'daily'), sop('S8', L('Cek kondisi umum', 'Check general condition'), 'daily'),
      sop('S1', L('Descaling', 'Descaling'), 'weekly'), sop('S2', L('Bersihkan saluran uap', 'Clean steam channel'), 'weekly'), sop('S5', L('Periksa kabel listrik', 'Inspect power cable'), 'weekly', { danger: true }),
      sop('S4', L('Bersihkan / ganti filter', 'Clean / replace filter'), 'monthly'), sop('S6', L('Cek voltase', 'Check voltage'), 'monthly', { danger: true })],
    ironer: [sop('F1', L('Bersihkan roll & pita', 'Clean rolls & tapes'), 'daily'), sop('F2', L('Waxing roll', 'Roll waxing'), 'weekly'), sop('F3', L('Cek suhu & sabuk', 'Check temperature & belts'), 'monthly', { danger: true })],
    fold: [sop('P1', L('Meja bersih & rapi', 'Table clean & tidy'), 'daily')],
    boiler: [sop('B1', L('Blowdown & cek level air', 'Blowdown & water level check'), 'daily', { danger: true, num: ['bar', 6, 8] }), sop('B2', L('Tes safety valve', 'Safety valve test'), 'monthly', { danger: true }), sop('B3', L('Inspeksi tahunan (pihak berwenang)', 'Annual inspection (authorised party)'), 'annual', { danger: true })],
    filter: [sop('WF1', L('Cek tekanan water filter', 'Check water filter pressure'), 'daily', { num: ['bar', 2, 3] }), sop('WF2', L('Backwash filter', 'Filter backwash'), 'weekly'), sop('WF3', L('Ganti cartridge', 'Replace cartridge'), 'quarterly')],
    ipal: [sop('IP1', L('Cek pH air buangan', 'Check effluent pH'), 'daily', { num: ['pH', 6, 9] }), sop('IP2', L('Kuras lumpur', 'Sludge removal'), 'monthly'), sop('IP3', L('Uji lab air limbah', 'Wastewater lab test'), '6m')]
  };
  D.FREQ = { daily: [L('Harian', 'Daily'), 1], weekly: [L('Mingguan', 'Weekly'), 7], monthly: [L('Bulanan', 'Monthly'), 30], quarterly: [L('3 Bulanan', 'Quarterly'), 91], '6m': [L('6 Bulanan', '6-Monthly'), 182], annual: [L('Tahunan', 'Annual'), 365], hours: [L('Jam Operasi', 'Operating Hours'), 0], cycles: [L('Jumlah Siklus', 'Cycle Count'), 0], custom: [L('Khusus', 'Custom'), 14] };
  // Next due offsets (days from today) per machine + frequency. Anything not listed is due on its normal cycle.
  D.PM_DUE = {
    'W-01|daily': 1, 'W-01|weekly': 4, 'W-01|monthly': 18, 'W-02|daily': 0, 'W-02|weekly': 2, 'W-02|monthly': 11, 'W-03|daily': 0, 'W-03|weekly': 5, 'W-03|monthly': 24, 'W-04|daily': 0, 'W-04|weekly': 3, 'W-04|monthly': 0,
    'D-01|daily': 1, 'D-01|weekly': 3, 'D-01|monthly': 14, 'D-01|quarterly': 40, 'D-02|daily': 0, 'D-02|weekly': 5, 'D-02|monthly': -2, 'D-02|quarterly': 52, 'D-03|daily': 0, 'D-03|weekly': 6, 'D-03|monthly': 9, 'D-03|quarterly': 61,
    'D-04|daily': 0, 'D-04|weekly': 1, 'D-04|monthly': 21, 'D-04|quarterly': 33, 'D-05|daily': 2, 'D-05|weekly': 4, 'D-05|monthly': 27, 'D-05|quarterly': 75,
    'FL-01|daily': 0, 'FL-01|weekly': 2, 'FL-01|monthly': 16, 'FL-02|daily': 0, 'IR-01|daily': 1, 'IR-01|weekly': 3, 'IR-01|monthly': 12, 'IR-02|daily': 0, 'IR-02|weekly': 0, 'IR-02|monthly': 19,
    'BL-01|daily': 1, 'BL-01|monthly': 3, 'BL-01|annual': 142, 'WF-01|daily': 1, 'WF-01|weekly': 4, 'WF-01|quarterly': 7, 'IP-01|daily': 0, 'IP-01|monthly': 13, 'IP-01|6m': 88
  };
  // Usage-based plans (§66): operating hours / cycle count.
  D.PM_USAGE = [
    { id: 'PM-W-01-H', mach: 'W-01', freq: 'hours', every: 500, at: 5800, n: L('Servis berkala 500 jam (bearing, sabuk, pelumasan)', '500-hour service (bearings, belts, lubrication)'), danger: true },
    { id: 'PM-D-01-C', mach: 'D-01', freq: 'cycles', every: 2000, at: 8400, n: L('Cek bearing drum setiap 2.000 siklus', 'Drum bearing check every 2,000 cycles'), danger: true },
    { id: 'PM-W-04-C', mach: 'W-04', freq: 'cycles', every: 1500, at: 3000, n: L('Ganti shock absorber setiap 1.500 siklus', 'Replace shock absorbers every 1,500 cycles'), danger: true }
  ];
  // Done today before 10:30 (daily plans) and the planned job in progress.
  D.PM_TODAY = { done: { 'W-01|daily': ['07:05', 'EMP-074'], 'D-01|daily': ['07:20', 'EMP-075'], 'IR-01|daily': ['07:30', 'EMP-077'], 'BL-01|daily': ['06:30', 'EMP-102'], 'WF-01|daily': ['06:40', 'EMP-102'] }, running: { 'W-04|monthly': ['09:30', 'EMP-102'] } };

  /* ---------- Client sorting rules (§13 pre-suggest, §14 client rule) ---------- */
  D.RULES = {
    'PR-05A': { mix: { white: 0.7, heavy: 0.3 }, note: L('Pisahkan linen bernoda berat ke Kotor Berat.', 'Put heavily stained linen into Heavy Soil.') },
    'PR-01A': { mix: { white: 0.45, color: 0.2, towel: 0.35 } }, 'PR-01B': { mix: { white: 0.75, towel: 0.25 } },
    'PR-02A': { mix: { towel: 0.55, white: 0.45 } }, 'PR-03A': { mix: { white: 0.6, towel: 0.3, color: 0.1 } }, 'PR-03B': { mix: { white: 1 } },
    'PR-04A': { mix: { white: 0.7, towel: 0.3 } },
    'PR-06A': { mix: { spa: 0.7, towel: 0.3 }, sep: true, note: L('Linen spa klien ini tidak dicampur klien lain (minyak pijat).', 'This client\'s spa linen is not mixed with other clients (massage oil).') },
    'PR-07A': { mix: { spa: 1 }, sep: true, note: L('Linen spa Jaens dicuci terpisah per grup (minyak pijat).', 'Jaens spa linen is washed separately per group (massage oil).') },
    'PR-07B': { mix: { towel: 1 }, sep: true }, 'PR-07C': { mix: { spa: 1 }, sep: true }, 'PR-07D': { mix: { towel: 1 }, sep: true }
  };

  /* ---------- Receiving records (§5) ----------
     Yesterday's loads (001–006) are already in production; today's (007–013) fill the Team 1 queues. */
  function rv(id, src, prop, cl, arr, bags, estKg, st, stage, x) { return Object.assign({ id: id, src: src, prop: prop, cl: cl, arrAt: arr, bags: bags, estKg: estKg, estPcs: null, cont: 0, cat: 'linen', st: st, stage: stage, mf: null, ord: null, drv: null, veh: null, svc: 'SV-006', pri: 'normal', special: '' }, x || {}); }
  var Y = D.yday + ' ', T0 = D.today + ' ';
  D.RCV = [
    rv('RCV-2610-001', 'manifest', 'PR-03B', 'CL-03', Y + '15:10', 6, 45, 'received', 'done', { drv: 'EMP-002', veh: 'JF-01', rcvAt: Y + '15:14', rcvBy: 'EMP-001', act: { bags: 6, cont: 0, cond: 'good' }, weigh: { gross: 45.8, tare: 1.8, net: 44, scale: 'SC-01', auto: true, by: 'EMP-001', at: Y + '15:22' }, sort: { cats: { white: 44 }, flags: [], by: 'EMP-061', at: Y + '15:40', pre: true }, pcs: 98 }),
    rv('RCV-2610-002', 'manifest', 'PR-05A', 'CL-05', Y + '15:30', 10, 80, 'received', 'done', { drv: 'EMP-063', veh: 'JF-02', rcvAt: Y + '15:33', rcvBy: 'EMP-001', act: { bags: 10, cont: 0, cond: 'good' }, weigh: { gross: 84.2, tare: 2.2, net: 82, scale: 'SC-01', auto: true, by: 'EMP-001', at: Y + '15:45' }, sort: { cats: { white: 82 }, flags: [], by: 'EMP-061', at: Y + '16:05', pre: true }, pcs: 182 }),
    rv('RCV-2610-003', 'manifest', 'PR-07D', 'CL-07', Y + '16:05', 6, 35, 'received', 'done', { drv: 'EMP-082', veh: 'JF-03', rcvAt: Y + '16:08', rcvBy: 'EMP-061', act: { bags: 6, cont: 0, cond: 'good' }, weigh: { gross: 37.4, tare: 1.4, net: 36, scale: 'SC-01', auto: true, by: 'EMP-061', at: Y + '16:15' }, sort: { cats: { towel: 36 }, flags: [], by: 'EMP-061', at: Y + '16:30', pre: true }, pcs: 72, svc: 'SV-008', cat: 'towel' }),
    rv('RCV-2610-004', 'manifest', 'PR-01A', 'CL-01', Y + '16:40', 14, 135, 'received', 'done', { drv: 'EMP-002', veh: 'JF-01', rcvAt: Y + '16:44', rcvBy: 'EMP-001', act: { bags: 14, cont: 1, cond: 'good' }, weigh: { gross: 141.2, tare: 3.2, net: 138, scale: 'SC-02', auto: true, by: 'EMP-001', at: Y + '16:58' }, sort: { cats: { white: 60, color: 30, towel: 48 }, flags: [], by: 'EMP-061', at: Y + '17:25', pre: true }, pcs: 305 }),
    rv('RCV-2610-005', 'manifest', 'PR-02A', 'CL-02', Y + '17:10', 5, 40, 'received', 'done', { drv: 'EMP-082', veh: 'JF-03', rcvAt: Y + '17:12', rcvBy: 'EMP-001', act: { bags: 5, cont: 0, cond: 'good' }, weigh: { gross: 41.6, tare: 1.2, net: 40.4, scale: 'SC-01', auto: true, by: 'EMP-001', at: Y + '17:20' }, sort: { cats: { towel: 40.4 }, flags: [], by: 'EMP-061', at: Y + '17:35', pre: true }, pcs: 80, cat: 'towel' }),
    rv('RCV-2610-006', 'manifest', 'PR-04A', 'CL-04', Y + '17:30', 4, 28, 'received', 'done', { drv: 'EMP-063', veh: 'JF-02', rcvAt: Y + '17:33', rcvBy: 'EMP-061', act: { bags: 4, cont: 0, cond: 'good' }, weigh: { gross: 29.5, tare: 1.1, net: 28.4, scale: 'SC-01', auto: true, by: 'EMP-061', at: Y + '17:40' }, sort: { cats: { white: 28.4 }, flags: [], by: 'EMP-061', at: Y + '17:52', pre: true }, pcs: 63 }),
    rv('RCV-2610-007', 'drop', 'PR-07A', 'CL-07', T0 + '06:50', 4, 32, 'received', 'done', { rcvAt: T0 + '06:55', rcvBy: 'EMP-101', act: { bags: 4, cont: 0, cond: 'good' }, weigh: { gross: 33, tare: 1.4, net: 31.6, scale: 'SC-01', auto: true, by: 'EMP-101', at: T0 + '07:05' }, sort: { cats: { spa: 31.6 }, flags: [], by: 'EMP-061', at: T0 + '07:20', pre: true }, pcs: 90, svc: 'SV-007', cat: 'spa', dropBy: L('Kurir Jaens Spa (Wayan)', 'Jaens Spa courier (Wayan)') }),
    rv('RCV-2610-008', 'manifest', 'PR-05A', 'CL-05', T0 + '08:40', 10, 85, 'received', 'done', { mf: 'MF-2610-04', ord: 'ORD-2610-131', drv: 'EMP-063', veh: 'JF-02', rcvAt: T0 + '08:45', rcvBy: 'EMP-001', act: { bags: 10, cont: 0, cond: 'good' }, weigh: { gross: 86.4, tare: 2.2, net: 84.2, scale: 'SC-02', auto: true, by: 'EMP-001', at: T0 + '08:58' }, sort: { cats: { white: 58.2, heavy: 26 }, flags: ['noda'], by: 'EMP-061', at: T0 + '09:20', pre: true }, pcs: 181 }),
    rv('RCV-2610-009', 'manifest', 'PR-07D', 'CL-07', T0 + '08:40', 6, 34, 'difference', 'rcv', { mf: 'MF-2610-05', ord: 'ORD-2610-132', drv: 'EMP-063', veh: 'JF-02', svc: 'SV-002', pri: 'express', cat: 'towel', startAt: T0 + '08:42', startBy: 'EMP-001', chk: { client: true, prop: true }, act: { bags: 5, cont: 0, cond: 'good' },
      dis: { reasons: ['missing'], note: L('Pickup 6 bag, tiba 5 bag. Satu bag tertinggal di mobil JF-02 yang masuk bengkel.', 'Picked up 6 bags, 5 arrived. One bag was left in van JF-02, now at the workshop.'), photo: 'seed:bags', by: 'EMP-001', at: T0 + '08:43', review: 'pending', big: true, lgIssue: 'ISS-2610-02' } }),
    rv('RCV-2610-010', 'transfer', 'PR-02A', 'CL-02', T0 + '07:20', 9, 70, 'received', 'sort', { rcvAt: T0 + '07:30', rcvBy: 'EMP-101', from: L('Plant 2 Canggu (PL-02)', 'Plant 2 Canggu (PL-02)'), act: { bags: 9, cont: 0, cond: 'good' }, weigh: { gross: 71.2, tare: 2.6, net: 68.6, scale: 'SC-02', auto: true, by: 'EMP-101', at: T0 + '07:45' }, pcs: 142, estPcs: 140 }),
    rv('RCV-2610-011', 'drop', 'PR-04A', 'CL-04', T0 + '08:05', 4, 30, 'received', 'wgt', { rcvAt: T0 + '08:12', rcvBy: 'EMP-061', act: { bags: 4, cont: 0, cond: 'good' }, dropBy: L('Staf housekeeping Oceanview', 'Oceanview housekeeping staff'), estPcs: 64 }),
    rv('RCV-2610-012', 'drop', 'PR-03A', 'CL-03', T0 + '10:05', 7, 52, 'receiving', 'rcv', { startAt: T0 + '10:15', startBy: 'EMP-061', chk: { client: true, prop: true }, dropBy: L('Driver villa Kayana', 'Kayana villa driver'), estPcs: 110 }),
    rv('RCV-2610-013', 'drop', 'PR-06A', 'CL-06', T0 + '10:10', 3, 18, 'waiting', 'rcv', { svc: 'SV-007', cat: 'spa', dropBy: L('Staf Ubud Spa Retreat', 'Ubud Spa Retreat staff'), special: L('Satu bag handuk berminyak', 'One bag of oily towels'), estPcs: 50 })
  ];

  /* ---------- Batches (§14) in every stage ----------
     ev: [stage, at, by] · run: machine runs [kind, machine, program, start, end, op] */
  function bt(id, rcv, prop, cl, cat, kg, pcs, stage, x) { return Object.assign({ id: id, rcvs: [rcv], prop: prop, cl: cl, cat: cat, kg: kg, pcs: pcs, stage: stage, pri: 'normal', flags: [], runs: [], ev: [], mach: null, prog: null, team: 't1', dlv: null }, x || {}); }
  D.BATCHES = [
    bt('B-2610-001', 'RCV-2610-001', 'PR-03B', 'CL-03', 'white', 44, 98, 'ho3l', { dlv: 'ORD-2610-105', mach: 'W-02', prog: 'P-WL', created: [Y + '15:50', 'EMP-101'],
      runs: [['wash', 'W-02', 'P-WL', Y + '18:00', Y + '18:45', 'EMP-074'], ['dry', 'D-01', 'P-DMD', Y + '18:52', Y + '19:24', 'EMP-075'], ['fin', 'FL-01', 'iron', T0 + '07:10', T0 + '07:55', 'EMP-077']],
      qc: { res: 'pass', qty: 98, pass: 98, by: 'EMP-070', at: T0 + '08:05', checks: ['clean', 'stain', 'smell', 'dry', 'fold', 'count'] }, pack: { at: T0 + '08:20', by: 'EMP-078', label: 'std', pkgs: [[25, 11.2], [25, 11], [25, 11], [23, 10.8]] }, rtdAt: [T0 + '08:25', 'EMP-078'] }),
    bt('B-2610-002', 'RCV-2610-003', 'PR-07D', 'CL-07', 'towel', 36, 72, 'pack_q', { dlv: 'ORD-2610-113', mach: 'W-03', prog: 'P-TW', created: [Y + '16:40', 'EMP-101'],
      runs: [['wash', 'W-03', 'P-TW', Y + '19:00', Y + '19:50', 'EMP-074'], ['dry', 'D-04', 'P-DHI', Y + '19:58', Y + '20:38', 'EMP-075'], ['fin', 'FL-02', 'fold', T0 + '08:30', T0 + '09:25', 'EMP-064']],
      qc: { res: 'partial', qty: 72, pass: 68, fail: 4, by: 'EMP-062', at: T0 + '09:40', checks: ['clean', 'stain', 'smell', 'dry', 'fold', 'count'], rw: 'RW-2610-01' } }),
    bt('B-2610-003', 'RCV-2610-002', 'PR-05A', 'CL-05', 'white', 82, 182, 'qc_q', { dlv: 'ORD-2610-123', mach: 'W-04', prog: 'P-WL', created: [Y + '16:15', 'EMP-101'],
      runs: [['wash', 'W-04', 'P-WL', Y + '17:20', Y + '18:05', 'EMP-071'], ['dry', 'D-04', 'P-DMD', Y + '18:12', Y + '18:44', 'EMP-075'], ['fin', 'FL-01', 'iron', T0 + '08:05', T0 + '10:15', 'EMP-077']] }),
    bt('B-2610-004', 'RCV-2610-004', 'PR-01A', 'CL-01', 'white', 60, 134, 'finishing', { mach: 'W-01', prog: 'P-WL', created: [Y + '17:35', 'EMP-101'],
      runs: [['wash', 'W-01', 'P-WL', T0 + '06:30', T0 + '07:15', 'EMP-074'], ['dry', 'D-01', 'P-DMD', T0 + '07:22', T0 + '07:54', 'EMP-075'], ['fin', 'FL-01', 'iron', T0 + '10:05', null, 'EMP-077']], finDone: 70 }),
    bt('B-2610-005', 'RCV-2610-005', 'PR-02A', 'CL-02', 'towel', 40.4, 80, 'ho23', { mach: 'W-02', prog: 'P-TW', created: [Y + '17:45', 'EMP-101'],
      runs: [['wash', 'W-02', 'P-TW', T0 + '08:40', T0 + '09:30', 'EMP-074'], ['dry', 'D-04', 'P-DHI', T0 + '09:38', T0 + '10:18', 'EMP-075']] }),
    bt('B-2610-006', 'RCV-2610-004', 'PR-01A', 'CL-01', 'color', 30, 75, 'drying', { mach: 'W-03', prog: 'P-CL', created: [Y + '17:35', 'EMP-101'],
      runs: [['wash', 'W-03', 'P-CL', T0 + '09:25', T0 + '10:05', 'EMP-074'], ['dry', 'D-02', 'P-DMD', T0 + '10:12', null, 'EMP-075']] }),
    bt('B-2610-007', 'RCV-2610-006', 'PR-04A', 'CL-04', 'white', 28.4, 63, 'dry_q', { mach: 'W-02', prog: 'P-WL', created: [Y + '18:00', 'EMP-101'],
      runs: [['wash', 'W-02', 'P-WL', T0 + '09:35', T0 + '10:20', 'EMP-074']] }),
    bt('B-2610-008', 'RCV-2610-008', 'PR-05A', 'CL-05', 'white', 58.2, 129, 'washing', { mach: 'W-01', prog: 'P-WL', created: [T0 + '09:28', 'EMP-101'], flags: [],
      runs: [['wash', 'W-01', 'P-WL', T0 + '10:00', null, 'EMP-074']] }),
    bt('B-2610-009', 'RCV-2610-008', 'PR-05A', 'CL-05', 'heavy', 26, 52, 'washing', { mach: 'W-03', prog: 'P-HS', created: [T0 + '09:30', 'EMP-101'], flags: ['noda'],
      runs: [['wash', 'W-03', 'P-HS', T0 + '10:20', null, 'EMP-071']] }),
    bt('B-2610-010', 'RCV-2610-004', 'PR-01A', 'CL-01', 'towel', 48, 96, 'ho12', { mach: 'W-02', prog: 'P-TW', created: [T0 + '10:20', 'EMP-101'] }),
    bt('B-2610-011', 'RCV-2610-007', 'PR-07A', 'CL-07', 'spa', 31.6, 90, 'ready', { mach: 'W-02', prog: 'P-SP', created: [T0 + '09:50', 'EMP-101'] }),
    bt('B-2610-012', 'RCV-2610-003', 'PR-07D', 'CL-07', 'towel', 2, 4, 'wash_q', { mach: 'W-03', prog: 'P-RW', created: [T0 + '09:41', 'EMP-062'], parent: 'B-2610-002', rw: 'RW-2610-01', pri: 'express', flags: ['noda'], team: 't3', dlv: 'ORD-2610-113' })
  ];
  // Handovers still waiting at 10:30 (all earlier passes are derived from the batch history and accepted).
  D.HO_WAIT = { 'B-2610-010': ['t1t2', T0 + '10:25', 'EMP-101'], 'B-2610-005': ['t2t3', T0 + '10:22', 'EMP-075'], 'B-2610-001': ['t3log', T0 + '08:26', 'EMP-078'] };

  /* ---------- Rework (§35) ---------- */
  D.REWORK = [
    { id: 'RW-2610-01', batch: 'B-2610-002', child: 'B-2610-012', reason: 'noda', origin: 'qc', resp: 'wash', action: 'rewash', item: 'bathtowel', qty: 4, kg: 2, ev: 'seed:stain', note: L('4 handuk mandi masih ada noda minyak pijat.', '4 bath towels still show massage-oil stains.'), op: 'EMP-062', at: T0 + '09:40', timeMin: 120, slaMin: 30, st: 'open' },
    { id: 'RW-2609-14', batch: 'B-2609-188', reason: 'kering', origin: 'qc', resp: 'dry', action: 'redry', item: 'sheet', qty: 6, kg: 4.2, ev: 'seed:wet', note: L('Sprei masih lembap di lipatan.', 'Sheets still damp in the folds.'), op: 'EMP-070', at: '2026-09-29 13:10', timeMin: 35, slaMin: 0, st: 'closed', closedAt: '2026-09-29 14:00', cl: 'CL-01', prop: 'PR-01B' },
    { id: 'RW-2609-12', batch: 'B-2609-171', reason: 'finishing', origin: 'qc', resp: 'fin', action: 'refinish', item: 'pillow', qty: 18, kg: 2.7, ev: null, note: L('Lipatan sarung bantal tidak sesuai standar hotel.', 'Pillow case folds do not meet the hotel standard.'), op: 'EMP-070', at: '2026-09-27 10:40', timeMin: 25, slaMin: 0, st: 'closed', closedAt: '2026-09-27 11:10', cl: 'CL-05', prop: 'PR-05A' },
    { id: 'RW-2609-09', batch: 'B-2609-140', reason: 'noda', origin: 'qc', resp: 'wash', action: 'rewash', item: 'sheet', qty: 9, kg: 6.3, ev: 'seed:stain', note: L('Noda kopi di sprei.', 'Coffee stains on sheets.'), op: 'EMP-062', at: '2026-09-23 15:20', timeMin: 140, slaMin: 40, st: 'closed', closedAt: '2026-09-23 17:45', cl: 'CL-03', prop: 'PR-03A' }
  ];

  /* ---------- Production issues (§80–§81) ---------- */
  D.ISSUES = [
    { id: 'PI-2610-01', type: 'breakdown', stage: 'dry', team: 't2', mach: 'D-03', batch: null, sev: 'high', note: L('D-03 berhenti: error sensor kelembapan (E-21).', 'D-03 stopped: moisture sensor error (E-21).'), ev: null, action: 'maint', st: 'open', by: 'EMP-075', at: T0 + '09:05', owner: 'EMP-102', wo: 'WO-2610-01' },
    { id: 'PI-2610-02', type: 'staff', stage: 'fin', team: 't3', mach: null, batch: null, sev: 'med', note: L('Dewa Ayu izin sakit. Finishing kurang 1 orang.', 'Dewa Ayu is off sick. Finishing is one person short.'), ev: null, action: 'review', st: 'open', by: 'EMP-077', at: T0 + '07:10', owner: 'EMP-021' },
    { id: 'PI-2610-03', type: 'chemical', stage: 'wash', team: 't2', mach: null, batch: null, sev: 'low', note: L('Stok softener tinggal 1 jerigen (dari checklist opening).', 'One softener can left (from the opening checklist).'), ev: null, action: 'continue', st: 'open', by: 'EMP-071', at: T0 + '06:35', owner: 'EMP-021', chk: 'OPN-04' }
  ];

  /* ---------- Work orders & downtime (§74–§77) ---------- */
  D.WORK_ORDERS = [
    { id: 'WO-2610-01', mach: 'D-03', issue: L('Error sensor kelembapan (E-21), dryer berhenti di tengah siklus.', 'Moisture sensor error (E-21), dryer stopped mid-cycle.'), sev: 'high', at: T0 + '09:05', by: 'EMP-075', batch: null, impact: L('Kapasitas drying turun 30 kg per siklus.', 'Drying capacity down 30 kg per cycle.'), tech: 'EMP-102', st: 'repair', repStart: T0 + '09:40', repEnd: null, parts: '', notes: L('Sensor dilepas, dicek kabelnya.', 'Sensor removed, wiring being checked.'), ev: [], result: null, src: 'PI-2610-01',
      log: [['open', T0 + '09:05', 'EMP-075'], ['assigned', T0 + '09:12', 'EMP-021'], ['repair', T0 + '09:40', 'EMP-102']] },
    { id: 'WO-2609-07', mach: 'W-02', issue: L('Karet pintu bocor saat bilas.', 'Door seal leaking during rinse.'), sev: 'med', at: '2026-09-28 11:20', by: 'EMP-074', batch: 'B-2609-176', impact: L('1 batch dipindah ke W-01.', '1 batch moved to W-01.'), tech: 'EMP-102', st: 'ready', repStart: '2026-09-28 11:40', repEnd: '2026-09-28 13:05', parts: L('Door seal 60 kg (1 pcs)', 'Door seal 60 kg (1 pc)'), notes: L('Seal diganti, tes 1 siklus kosong OK.', 'Seal replaced, 1 empty test cycle OK.'), ev: [], result: 'pass', verBy: 'EMP-021', verAt: '2026-09-28 13:20',
      log: [['open', '2026-09-28 11:20', 'EMP-074'], ['assigned', '2026-09-28 11:25', 'EMP-021'], ['repair', '2026-09-28 11:40', 'EMP-102'], ['test', '2026-09-28 13:05', 'EMP-102'], ['verify', '2026-09-28 13:12', 'EMP-102'], ['ready', '2026-09-28 13:20', 'EMP-021']] }
  ];
  D.DOWNTIME = [
    { id: 'DT-2610-01', mach: 'D-03', start: T0 + '09:05', end: null, reason: L('Error sensor kelembapan', 'Moisture sensor error'), kind: 'breakdown', batch: null, impact: L('Kapasitas drying -30 kg/siklus', 'Drying capacity -30 kg/cycle'), wo: 'WO-2610-01' },
    { id: 'DT-2610-02', mach: 'W-04', start: T0 + '09:30', end: null, reason: L('Preventive maintenance bulanan', 'Monthly preventive maintenance'), kind: 'planned', batch: null, impact: L('W-04 tidak dipakai pagi ini', 'W-04 not used this morning') },
    { id: 'DT-2609-31', mach: 'W-02', start: '2026-09-28 11:20', end: '2026-09-28 13:20', reason: L('Karet pintu bocor', 'Door seal leak'), kind: 'breakdown', batch: 'B-2609-176', impact: L('1 batch dipindah', '1 batch moved'), wo: 'WO-2609-07' },
    { id: 'DT-2609-24', mach: 'D-02', start: '2026-09-19 14:10', end: '2026-09-19 16:40', reason: L('Ignitor gagal menyala', 'Ignitor failed'), kind: 'breakdown', batch: null, impact: L('Antrian dryer naik', 'Dryer queue grew') },
    { id: 'DT-2609-18', mach: 'FL-01', start: '2026-09-14 09:00', end: '2026-09-14 10:30', reason: L('Sabuk ironer aus', 'Ironer belt worn'), kind: 'breakdown', batch: null, impact: L('Finishing manual', 'Manual finishing') },
    { id: 'DT-2609-11', mach: 'BL-01', start: '2026-09-08 05:30', end: '2026-09-08 06:20', reason: L('Tekanan uap rendah', 'Low steam pressure'), kind: 'breakdown', batch: null, impact: L('Mulai produksi tertunda', 'Production start delayed') }
  ];

  /* ---------- Checklist templates (§54–§63) ----------
     ci(code, name, instruction, cat, area, type, opts) · type: check · num · text · select · photo_opt · photo_req · notes_req · approval */
  function ci(code, n, ins, cat, area, type, o) { return Object.assign({ code: code, n: n, ins: ins, cat: cat, area: area, type: type, mand: true, active: true, esc: 'spv' }, o || {}); }
  var OPN_V1 = [
    ci('OPN-01', L('Panel listrik utama normal', 'Main electrical panel normal'), L('Lampu indikator hijau, tidak ada bau terbakar.', 'Indicator lights green, no burning smell.'), 'equip', 'util', 'check', { mach: null }),
    ci('OPN-02', L('Cek tekanan water filter', 'Check water filter pressure'), L('Baca manometer. Normal 2,0–3,0 bar.', 'Read the gauge. Normal 2.0–3.0 bar.'), 'equip', 'util', 'num', { unit: 'bar', min: 2, max: 3, mach: 'WF-01' }),
    ci('OPN-03', L('Cek tekanan boiler', 'Check boiler pressure'), L('Normal 6–8 bar sebelum mesin jalan.', 'Normal 6–8 bar before machines run.'), 'equip', 'util', 'num', { unit: 'bar', min: 6, max: 8, mach: 'BL-01' }),
    ci('OPN-04', L('Cek chemical', 'Check chemicals'), L('Deterjen, bleach, softener cukup untuk hari ini.', 'Detergent, bleach, softener enough for today.'), 'stock', 'wash', 'select', { opts: [['ok', L('Stok OK', 'Stock OK')], ['low', L('Stok Rendah', 'Stock Low')]], bad: 'low' }),
    ci('OPN-05', L('Mesin cuci siap (W-01 s/d W-04)', 'Washers ready (W-01 to W-04)'), L('Tidak ada pesan error di panel.', 'No error message on the panels.'), 'equip', 'wash', 'check', { mach: 'W-01' }),
    ci('OPN-06', L('Lint trap dryer bersih', 'Dryer lint traps clean'), L('Foto lint trap setelah dibersihkan.', 'Photo the lint traps after cleaning.'), 'equip', 'dry', 'photo_req', { mach: 'D-01' }),
    ci('OPN-07', L('Area kerja bersih (5S)', 'Work area clean (5S)'), L('Lantai kering, jalur troli bebas.', 'Floor dry, trolley lanes clear.'), 'hk', 'all', 'photo_opt', { mand: false }),
    ci('OPN-08', L('APD tersedia', 'PPE available'), L('Sarung tangan, masker, apron, sepatu safety.', 'Gloves, masks, aprons, safety shoes.'), 'safety', 'all', 'check'),
    ci('OPN-09', L('Timbangan di-nol-kan', 'Scales zeroed'), L('SC-01 dan SC-02 menunjukkan 0,0 kg.', 'SC-01 and SC-02 show 0.0 kg.'), 'equip', 'rcv', 'check'),
    ci('OPN-10', L('Persetujuan supervisor opening', 'Supervisor opening approval'), L('Supervisor memeriksa dan menyetujui.', 'The supervisor reviews and approves.'), 'signoff', 'all', 'approval')
  ];
  var OPN_V2 = OPN_V1.slice(0, 3).concat([
    ci('OPN-04', L('Cek chemical per jenis', 'Check chemicals per type'), L('Pilih status untuk deterjen, bleach dan softener.', 'Choose a status for detergent, bleach and softener.'), 'stock', 'wash', 'select', { opts: [['ok', L('Semua OK', 'All OK')], ['low', L('Ada yang rendah', 'Some low')], ['out', L('Ada yang habis', 'Some out')]], bad: 'low' }),
    ci('OPN-11', L('Cek pH IPAL', 'Check IPAL pH'), L('Normal pH 6–9.', 'Normal pH 6–9.'), 'equip', 'util', 'num', { unit: 'pH', min: 6, max: 9, mach: 'IP-01' })
  ]).concat(OPN_V1.slice(4));
  D.TEMPLATES = [
    { id: 'TPL-OPN', n: L('Opening Checklist', 'Opening Checklist'), kind: 'opening', tab: 'opening', team: 'all', freq: 'daily', win: ['06:00', '07:00'], pic: 'lead', approve: true,
      versions: [{ v: 1, eff: '2026-01-01', until: '2026-10-31', items: OPN_V1, by: 'EMP-021', at: '2025-12-20 10:00', note: L('Migrasi dari checklist Excel bulanan.', 'Migrated from the monthly Excel checklist.') },
        { v: 2, eff: '2026-11-01', until: null, items: OPN_V2, by: 'EMP-021', at: '2026-09-30 15:00', note: L('Tambah cek pH IPAL, chemical per jenis.', 'Added IPAL pH check, chemicals per type.') }] },
    { id: 'TPL-CLS', n: L('Closing Checklist', 'Closing Checklist'), kind: 'closing', tab: 'closing', team: 'all', freq: 'daily', win: ['21:00', '22:00'], pic: 'lead', approve: true,
      versions: [{ v: 1, eff: '2026-01-01', until: null, by: 'EMP-021', at: '2025-12-20 10:00', note: L('Migrasi dari checklist Excel bulanan.', 'Migrated from the monthly Excel checklist.'), items: [
        ci('CLS-01', L('Semua mesin dimatikan', 'All machines switched off'), L('Washer, dryer, ironer, steam iron.', 'Washers, dryers, ironer, steam irons.'), 'equip', 'all', 'check'),
        ci('CLS-02', L('Sisa batch tercatat', 'Remaining batches recorded'), L('Cek layar Command Center, tidak ada batch tanpa status.', 'Check the Command Center, no batch without a status.'), 'ops', 'all', 'check'),
        ci('CLS-03', L('Chemical ditutup rapat', 'Chemicals sealed'), L('Tutup jerigen dan kunci rak chemical.', 'Close the cans and lock the chemical rack.'), 'safety', 'wash', 'check'),
        ci('CLS-04', L('Area bersih', 'Area clean'), L('Foto area washing dan finishing.', 'Photo the washing and finishing areas.'), 'hk', 'all', 'photo_req'),
        ci('CLS-05', L('Listrik & pintu dikunci', 'Power & doors locked'), L('Panel non-esensial off, pintu belakang dikunci.', 'Non-essential panels off, back door locked.'), 'safety', 'all', 'check'),
        ci('CLS-06', L('Catatan shift', 'Shift notes'), L('Tulis hal penting untuk shift besok.', 'Write what tomorrow\'s shift needs to know.'), 'ops', 'all', 'notes_req'),
        ci('CLS-07', L('Persetujuan supervisor closing', 'Supervisor closing approval'), L('Supervisor memeriksa dan menyetujui.', 'The supervisor reviews and approves.'), 'signoff', 'all', 'approval')] }] },
    { id: 'TPL-T1', n: L('Checklist Shift Team 1', 'Team 1 Shift Checklist'), kind: 'shift', tab: 't1', team: 't1', freq: 'shift', win: ['06:00', '07:30'], pic: 'op', approve: false,
      versions: [{ v: 1, eff: '2026-01-01', until: null, by: 'EMP-021', at: '2025-12-20 10:00', items: [
        ci('T1-01', L('Timbangan SC-01 / SC-02 nol', 'Scales SC-01 / SC-02 zero'), L('Tekan ZERO, layar 0,0 kg.', 'Press ZERO, display 0.0 kg.'), 'equip', 'rcv', 'check'),
        ci('T1-02', L('Troli receiving bersih', 'Receiving trolleys clean'), L('Troli kotor dan bersih dipisah.', 'Dirty and clean trolleys kept apart.'), 'hk', 'rcv', 'check'),
        ci('T1-03', L('Stok tag & label', 'Tags & labels stock'), L('Tag batch dan label kategori.', 'Batch tags and category labels.'), 'stock', 'rcv', 'select', { opts: [['ok', L('Ada', 'Available')], ['low', L('Hampir habis', 'Running low')]], bad: 'low' }),
        ci('T1-04', L('Area sorting rapi', 'Sorting area tidy'), L('Keranjang kategori di tempatnya.', 'Category baskets in place.'), 'hk', 'sort', 'photo_opt', { mand: false })] }] },
    { id: 'TPL-T2', n: L('Checklist Shift Team 2', 'Team 2 Shift Checklist'), kind: 'shift', tab: 't2', team: 't2', freq: 'shift', win: ['06:00', '07:30'], pic: 'op', approve: false,
      versions: [{ v: 1, eff: '2026-01-01', until: null, by: 'EMP-021', at: '2025-12-20 10:00', items: [
        ci('T2-01', L('Dosing chemical normal', 'Chemical dosing normal'), L('Selang dosing tidak bocor, pompa jalan.', 'Dosing hoses not leaking, pumps running.'), 'equip', 'wash', 'select', { opts: [['ok', 'OK'], ['low', L('Bermasalah', 'Problem')]], bad: 'low' }),
        ci('T2-02', L('Suhu air panas', 'Hot water temperature'), L('Normal 55–75 °C.', 'Normal 55–75 °C.'), 'equip', 'wash', 'num', { unit: '°C', min: 55, max: 75 }),
        ci('T2-03', L('Lint trap semua dryer', 'All dryer lint traps'), L('Bersihkan sebelum siklus pertama.', 'Clean before the first cycle.'), 'equip', 'dry', 'check'),
        ci('T2-04', L('Saluran pembuangan bersih', 'Drains clear'), L('Tidak ada genangan di zona washing.', 'No standing water in the washing zone.'), 'hk', 'wash', 'check')] }] },
    { id: 'TPL-T3', n: L('Checklist Shift Team 3', 'Team 3 Shift Checklist'), kind: 'shift', tab: 't3', team: 't3', freq: 'shift', win: ['07:00', '08:00'], pic: 'op', approve: false,
      versions: [{ v: 1, eff: '2026-01-01', until: null, by: 'EMP-021', at: '2025-12-20 10:00', items: [
        ci('T3-01', L('Suhu flatwork ironer', 'Flatwork ironer temperature'), L('Normal 150–190 °C.', 'Normal 150–190 °C.'), 'equip', 'fin', 'num', { unit: '°C', min: 150, max: 190, mach: 'FL-01' }),
        ci('T3-02', L('Meja QC bersih & terang', 'QC table clean & bright'), L('Lampu QC menyala.', 'QC light on.'), 'hk', 'qc', 'check'),
        ci('T3-03', L('Stok plastik & label packing', 'Packing plastic & label stock'), L('Cukup untuk hari ini.', 'Enough for today.'), 'stock', 'pack', 'select', { opts: [['ok', L('Stok OK', 'Stock OK')], ['low', L('Stok Rendah', 'Stock Low')]], bad: 'low' }),
        ci('T3-04', L('Area packing rapi', 'Packing area tidy'), L('Paket siap kirim di rak Siap Kirim.', 'Ready packages on the Ready rack.'), 'hk', 'pack', 'photo_opt', { mand: false })] }] },
    { id: 'TPL-LOG', n: L('Checklist Harian Logistics', 'Logistics Daily Checklist'), kind: 'daily', tab: 'log', team: 'log', freq: 'daily', win: ['06:30', '07:30'], pic: 'op', approve: false,
      versions: [{ v: 1, eff: '2026-01-01', until: null, by: 'EMP-021', at: '2025-12-20 10:00', items: [
        ci('LG-01', L('Kendaraan bersih', 'Vehicles clean'), L('Bak muatan bersih dan kering.', 'Cargo area clean and dry.'), 'hk', 'log', 'check'),
        ci('LG-02', L('Bag & troli bersih', 'Bags & trolleys clean'), L('Bag bersih terpisah dari bag kotor.', 'Clean bags apart from dirty bags.'), 'hk', 'log', 'check'),
        ci('LG-03', L('Cek BBM', 'Fuel check'), L('Pilih level BBM terendah dari semua kendaraan.', 'Choose the lowest fuel level of all vehicles.'), 'equip', 'log', 'select', { opts: [['full', L('Penuh', 'Full')], ['ok', L('Cukup', 'Enough')], ['low', L('Rendah', 'Low')]], bad: 'low' })] }] },
    { id: 'TPL-T2W', n: L('Deep Clean Mingguan Washing', 'Weekly Washing Deep Clean'), kind: 'weekly', tab: 't2', team: 't2', freq: 'weekly', day: 2, win: ['08:00', '14:00'], pic: 'op', approve: false,
      versions: [{ v: 1, eff: '2026-01-01', until: null, by: 'EMP-021', at: '2025-12-20 10:00', items: [
        ci('T2W-01', L('Deep clean drum washer', 'Washer drum deep clean'), L('Jalankan cleaning cycle tanpa muatan.', 'Run the cleaning cycle without a load.'), 'equip', 'wash', 'photo_req', { mach: 'W-02' })] }] },
    { id: 'TPL-T1M', n: L('Kalibrasi Bulanan Timbangan', 'Monthly Scale Calibration'), kind: 'monthly', tab: 't1', team: 't1', freq: 'monthly', day: 6, win: ['07:00', '12:00'], pic: 'lead', approve: false,
      versions: [{ v: 1, eff: '2026-01-01', until: null, by: 'EMP-021', at: '2025-12-20 10:00', items: [
        ci('T1M-01', L('Kalibrasi timbangan dengan anak timbang 20 kg', 'Calibrate scales with a 20 kg test weight'), L('Catat hasil baca SC-01.', 'Record the SC-01 reading.'), 'equip', 'rcv', 'num', { unit: 'kg', min: 19.9, max: 20.1 })] }] }
  ];
  // Today's checklist progress before 10:30 (instances are generated from the templates).
  // [code, status, value, by, at, note]
  D.CHK_TODAY = {
    'TPL-OPN': { st: 'lead_ok', sub: ['06:42', 'EMP-101'], lead: ['06:50', 'EMP-101'], items: [['OPN-01', 'done', true, 'EMP-101', '06:10'], ['OPN-02', 'done', 2.4, 'EMP-101', '06:14'], ['OPN-03', 'done', 7.1, 'EMP-071', '06:18'], ['OPN-04', 'issue', 'low', 'EMP-071', '06:24', L('Softener tinggal 1 jerigen.', 'One softener can left.'), 'PI-2610-03'], ['OPN-05', 'done', true, 'EMP-071', '06:28'], ['OPN-06', 'done', 'seed:pod', 'EMP-075', '06:33'], ['OPN-07', 'done', null, 'EMP-061', '06:36'], ['OPN-08', 'done', true, 'EMP-101', '06:38'], ['OPN-09', 'done', true, 'EMP-001', '06:40']] },
    'TPL-T1': { items: [['T1-01', 'done', true, 'EMP-001', '06:45'], ['T1-02', 'done', true, 'EMP-061', '06:48'], ['T1-03', 'done', 'ok', 'EMP-061', '06:50']] },
    'TPL-T2': { items: [['T2-01', 'done', 'ok', 'EMP-071', '06:40'], ['T2-02', 'done', 64, 'EMP-074', '06:44']] },
    'TPL-T3': { items: [['T3-02', 'done', true, 'EMP-070', '07:12']] },
    'TPL-LOG': { st: 'submitted', sub: ['07:05', 'EMP-002'], items: [['LG-01', 'done', true, 'EMP-002', '06:50'], ['LG-02', 'done', true, 'EMP-063', '06:55'], ['LG-03', 'done', 'ok', 'EMP-002', '07:00']] }
  };
  // Last 30 days, for the checklist KPI (§64).
  D.CHK_HIST = { days: 30, opening: 29, closing: 28, ontime: 27, crit: 3, equipOk: 412, equipAll: 425, done: 1168, mand: 1201 };

  /* ---------- Production history baseline (last 30 days) for the KPI board (§52) ---------- */
  D.HIST = { days: 30, kg: 33840, pcs: 74210, opHours: 2160, runMin: 52200, availMin: 64800, batches: 612, qcPass: 594, qcFail: 18, rwKg: 642, late: 21, cycleMin: 1095, downMin: 1240, breakdowns: 4, okBatches: 601, ho: 2448, hoOk: 2431, pmDone: 334, pmDue: 352 };
  // Queue load per stage two hours ago (kg) — used to measure queue growth (§50).
  D.QHIST = { at: T0 + '08:30', kg: { rcv: 122, sort: 210, wash: 174, dry: 95, fin: 81, qc: 60, pack: 44, rtd: 44 } };
  // Per-person production baseline (30 days) used to feed the Phase 5 Personal Score (§53).
  D.PEOPLE8 = {
    'EMP-001': { kg: 4920, hours: 27, ok: 412, err: 2, onTime: 404, tasks: 414 }, 'EMP-061': { kg: 4410, hours: 26, ok: 371, err: 3, onTime: 358, tasks: 374 },
    'EMP-071': { out: 101, pass: 97.4, onTime: 95.2 }, 'EMP-074': { out: 87, pass: 94.8, onTime: 88.1 }, 'EMP-075': { out: 93, pass: 98.1, onTime: 93.4 },
    'EMP-077': { out: 103, pass: 97.9, onTime: 97.6 }, 'EMP-064': { out: 96, pass: 98.4, onTime: 94.2 }, 'EMP-078': { out: 95, pass: 99.3, onTime: 93.1 },
    'EMP-070': { checks: 312, correct: 309, rw: 1.9, found: 18, turn: 17 }, 'EMP-062': { checks: 284, correct: 280, rw: 2.3, found: 21, turn: 21 }
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = D;
  else root.JFPROD_DATA = D;
})(typeof window !== 'undefined' ? window : this);
