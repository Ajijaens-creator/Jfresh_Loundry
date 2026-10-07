/* ==========================================================================
   JFRESH OS — Phase 10 sample data (Business Support, Finance, Costing &
   Scale-Up Intelligence). Clients, properties, services, contracts, rate
   cards and payment terms come from Phase 6 (jfos-comm-data.js); delivery
   and vehicles from Phase 7; machines, capacity, downtime and work orders
   from Phase 8; Billing Ready from Phase 9; the monthly P&L of Apr–Sep and
   the cash balances from Phase 5 (jfos-perf-data.js). This file only holds
   what is new in Phase 10: the chart of accounts, periods, cash accounts and
   transactions, invoices and collection notes, suppliers, expenses and
   supplier invoices, the September sales ledger (volumes only: rates are
   read from the Phase 6 rate cards), HPP cost components, the laundry item
   master with standard weights, inventory, purchasing, the asset register,
   budgets, the bank statement, the monthly close checklist, ratio
   thresholds, decision model weights and investment scenarios.
   Amounts in rupiah. Day shown: Tuesday 6 Oct 2026, clock starts at 10:30.

   Migration baseline (§90): HPP 2026, Price List 2026 and "Berat Item
   Laundry Update 2026" were cleaned, normalized (every weight in kg) and
   versioned. Legacy formulas were not trusted: every HPP is recalculated
   from its components and volume, and stored per period.
   ========================================================================== */
(function (root) {
  function L(a, b) { return [a, b === undefined ? a : b]; }
  var JT = 1e6;
  function j(x) { return Math.round(x * JT); }
  var D = { today: '2026-10-06', simNow: '2026-10-06 10:30', JT: JT };

  /* ---------- NP-01 foundation (§3) ---------- */
  D.COMPANY = { n: 'PT J\'Fresh Laundry Bali', short: 'J\'Fresh Laundry', npwp: '02.456.789.1-905.000', cur: 'IDR', fy: '2026', fyStart: '2026-01-01', ledgerStart: '2026-04-01', addr: 'Jl. Raya Mas No. 88, Ubud, Gianyar, Bali' };
  D.PLANTS = [['PL-01', 'Main Plant — Ubud'], ['PL-02', 'Plant 2 — Gianyar'], ['HO', L('Kantor Pusat', 'Head Office')]];
  D.TAXES = [['PPN', L('PPN Keluaran', 'Output VAT'), 11, '2210'], ['PPH23', L('PPh 23 (jasa)', 'Income tax art. 23 (services)'), 2, '2220'], ['PPH21', L('PPh 21 (karyawan)', 'Income tax art. 21 (employees)'), null, '2220']];
  D.CC = [['CC-PRD', L('Produksi', 'Production'), 'PL-01'], ['CC-PRD2', L('Produksi Gianyar', 'Production Gianyar'), 'PL-02'], ['CC-LOG', L('Logistik', 'Logistics'), 'PL-01'], ['CC-MNT', L('Maintenance', 'Maintenance'), 'PL-01'],
    ['CC-SLS', L('Sales & Account', 'Sales & Account'), 'HO'], ['CC-ADM', L('Admin & Keuangan', 'Admin & Finance'), 'HO'], ['CC-MGT', L('Manajemen', 'Management'), 'HO']];
  D.DEPTS = [['OPS', L('Operasional', 'Operations')], ['LOG', L('Logistik', 'Logistics')], ['FIN', L('Keuangan', 'Finance')], ['SLS', L('Sales', 'Sales')], ['MNT', L('Maintenance', 'Maintenance')], ['MGT', L('Direksi', 'Board')], ['SUP', L('Purchasing', 'Purchasing')]];
  D.PROJECTS = [['PRJ-01', L('Dryer tambahan Plant Ubud', 'Additional dryer Ubud plant'), 'plan'], ['PRJ-02', L('Studi cabang Sanur', 'Sanur branch study'), 'plan'], ['PRJ-03', L('Upgrade IPAL', 'IPAL upgrade'), 'active']];

  /* ---------- Chart of accounts (§4): [code, id, en, type, group, current, normal] ---------- */
  D.COA = [
    ['1111', 'Kas Main Plant Ubud', 'Cash Main Plant Ubud', 'asset', 'cash', 1, 'd'], ['1112', 'Kas Plant Gianyar', 'Cash Plant Gianyar', 'asset', 'cash', 1, 'd'], ['1113', 'Petty Cash', 'Petty Cash', 'asset', 'cash', 1, 'd'],
    ['1121', 'Bank BCA Operasional', 'Bank BCA Operating', 'asset', 'bank', 1, 'd'], ['1122', 'Bank BCA Payroll', 'Bank BCA Payroll', 'asset', 'bank', 1, 'd'], ['1123', 'Bank Mandiri', 'Bank Mandiri', 'asset', 'bank', 1, 'd'],
    ['1124', 'BNI Deposito Jaminan', 'BNI Guarantee Deposit', 'asset', 'bank', 1, 'd'],
    ['1200', 'Piutang Usaha', 'Accounts Receivable', 'asset', 'ar', 1, 'd'], ['1210', 'Piutang Belum Ditagih', 'Unbilled Receivable', 'asset', 'ar', 1, 'd'],
    ['1310', 'Persediaan Bahan Kimia', 'Chemical Inventory', 'asset', 'inv', 1, 'd'], ['1320', 'Persediaan Kemasan & Label', 'Packaging & Label Inventory', 'asset', 'inv', 1, 'd'], ['1330', 'Persediaan Spare Part & BHP', 'Spare Parts & Consumables Inventory', 'asset', 'inv', 1, 'd'],
    ['1400', 'Biaya Dibayar di Muka', 'Prepaid Expenses', 'asset', 'prepaid', 1, 'd'], ['1410', 'PPN Masukan', 'Input VAT', 'asset', 'prepaid', 1, 'd'],
    ['1510', 'Mesin Produksi', 'Production Machines', 'asset', 'fa', 0, 'd'], ['1520', 'Kendaraan', 'Vehicles', 'asset', 'fa', 0, 'd'], ['1530', 'Peralatan & Renovasi', 'Equipment & Leasehold', 'asset', 'fa', 0, 'd'],
    ['1590', 'Akumulasi Penyusutan', 'Accumulated Depreciation', 'asset', 'accdep', 0, 'c'],
    ['2100', 'Utang Usaha', 'Accounts Payable', 'liab', 'ap', 1, 'c'], ['2150', 'Barang Diterima Belum Ditagih', 'Goods Received Not Invoiced', 'liab', 'ap', 1, 'c'],
    ['2210', 'PPN Keluaran', 'Output VAT', 'liab', 'tax', 1, 'c'], ['2220', 'Utang PPh', 'Income Tax Payable', 'liab', 'tax', 1, 'c'], ['2300', 'Utang Gaji & BPJS', 'Payroll & BPJS Payable', 'liab', 'payroll', 1, 'c'],
    ['2400', 'Biaya Masih Harus Dibayar', 'Accrued Expenses', 'liab', 'other', 1, 'c'], ['2500', 'Utang Bank Jangka Panjang', 'Long-term Bank Loan', 'liab', 'debt', 0, 'c'],
    ['3100', 'Modal Disetor', 'Paid-in Capital', 'eq', 'eq', 0, 'c'], ['3200', 'Saldo Laba', 'Retained Earnings', 'eq', 'eq', 0, 'c'], ['3300', 'Dividen Interim', 'Interim Dividend', 'eq', 'eq', 0, 'd'],
    ['4100', 'Pendapatan Laundry per kg', 'Laundry Revenue per kg', 'rev', 'rev', 0, 'c'], ['4200', 'Pendapatan Laundry per pcs', 'Laundry Revenue per pcs', 'rev', 'rev', 0, 'c'], ['4300', 'Pendapatan Express', 'Express Revenue', 'rev', 'rev', 0, 'c'],
    ['4400', 'Pendapatan Special Treatment', 'Special Treatment Revenue', 'rev', 'rev', 0, 'c'], ['4500', 'Pendapatan Delivery', 'Delivery Revenue', 'rev', 'rev', 0, 'c'], ['4900', 'Pendapatan Lain', 'Other Revenue', 'rev', 'rev', 0, 'c'],
    ['5100', 'Bahan Kimia', 'Chemicals', 'cogs', 'cogs', 0, 'd'], ['5200', 'Kemasan', 'Packaging', 'cogs', 'cogs', 0, 'd'], ['5300', 'Tenaga Kerja Langsung', 'Direct Labour', 'cogs', 'cogs', 0, 'd'],
    ['5400', 'Utilitas Produksi', 'Production Utilities', 'cogs', 'cogs', 0, 'd'], ['5500', 'Delivery Attributable', 'Delivery Attributable', 'cogs', 'cogs', 0, 'd'], ['5900', 'Biaya Produksi Lain', 'Other Direct Production Cost', 'cogs', 'cogs', 0, 'd'],
    ['6100', 'Gaji Tidak Langsung', 'Indirect Salaries', 'opex', 'opex', 0, 'd'], ['6200', 'Sewa', 'Rent', 'opex', 'opex', 0, 'd'], ['6300', 'Administrasi', 'Administration', 'opex', 'opex', 0, 'd'],
    ['6400', 'Maintenance', 'Maintenance', 'opex', 'opex', 0, 'd'], ['6500', 'Marketing', 'Marketing', 'opex', 'opex', 0, 'd'], ['6600', 'Management Fee', 'Management Fee', 'opex', 'opex', 0, 'd'],
    ['6700', 'Penyusutan', 'Depreciation', 'opex', 'opex', 0, 'd'], ['6900', 'Opex Lain', 'Other Opex', 'opex', 'opex', 0, 'd'],
    ['7100', 'Pendapatan Non-Operasional', 'Non-operating Income', 'other', 'other', 0, 'c'], ['7200', 'Beban Bunga & Bank', 'Interest & Bank Charges', 'other', 'other', 0, 'd'],
    ['8100', 'Pajak Penghasilan Badan', 'Corporate Income Tax', 'tax', 'tax', 0, 'd']
  ];
  // Cost behaviour of each P&L cost account (§23), used for BEP and contribution.
  D.BEHAVIOR = { '5100': 'var', '5200': 'var', '5300': 'semi', '5400': 'semi', '5500': 'var', '5900': 'var', '6100': 'fixed', '6200': 'fixed', '6300': 'fixed', '6400': 'semi', '6500': 'fixed', '6600': 'fixed', '6700': 'fixed', '6900': 'fixed', '7200': 'fixed' };
  D.SEMI_VAR = 0.6;   // share of a semi-variable cost that moves with volume
  // Service → revenue account (§4).
  D.SVC_ACC = { 'SV-001': '4100', 'SV-004': '4100', 'SV-006': '4100', 'SV-007': '4100', 'SV-008': '4100', 'SV-005': '4200', 'SV-009': '4200', 'SV-002': '4300', 'SV-003': '4300', 'SV-010': '4400' };
  // Service tiers (§32): Regular, One Day, Express, Super Express, Special Treatment.
  D.TIERS = [['regular', L('Regular', 'Regular')], ['oneday', L('One Day', 'One Day')], ['express', L('Express', 'Express')], ['superx', L('Super Express', 'Super Express')], ['special', L('Special Treatment', 'Special Treatment')]];
  D.SVC_TIER = { 'SV-001': 'regular', 'SV-004': 'regular', 'SV-006': 'oneday', 'SV-007': 'oneday', 'SV-008': 'oneday', 'SV-009': 'regular', 'SV-002': 'express', 'SV-003': 'superx', 'SV-005': 'special', 'SV-010': 'special' };

  /* ---------- Periods (§7) ---------- */
  D.PERIODS = [
    ['2026-01', 'locked', L('Sebelum migrasi ledger (saldo awal 31 Mar)', 'Before the ledger migration (opening balance 31 Mar)')], ['2026-02', 'locked'], ['2026-03', 'locked'],
    ['2026-04', 'locked'], ['2026-05', 'locked'], ['2026-06', 'locked'], ['2026-07', 'closed'], ['2026-08', 'closed'], ['2026-09', 'soft'], ['2026-10', 'open'], ['2026-11', 'open'], ['2026-12', 'open']
  ];
  D.CLOSE_HIST = { '2026-04': ['2026-05-06', 'EMP-030'], '2026-05': ['2026-06-05', 'EMP-030'], '2026-06': ['2026-07-06', 'EMP-030'], '2026-07': ['2026-08-05', 'EMP-030'], '2026-08': ['2026-09-07', 'EMP-030'] };

  /* ---------- NP-02 cash accounts (§8): balance targets at 6 Oct from Phase 5 ---------- */
  D.CASH_ACC = [
    { id: 'ACC-01', coa: '1121', n: 'BCA Operasional', type: 'bank', bank: 'BCA', no: '7720-0418-55', pic: 'EMP-030', bal: j(1240), recBal: j(1214.6), recAt: '2026-10-05', status: 'active' },
    { id: 'ACC-02', coa: '1122', n: 'BCA Payroll', type: 'payroll', bank: 'BCA', no: '7720-0418-91', pic: 'EMP-030', bal: j(420), recBal: j(420), recAt: '2026-09-30', status: 'active', restricted: L('Cadangan gaji Oktober', 'October payroll reserve') },
    { id: 'ACC-03', coa: '1123', n: 'Mandiri Operasional', type: 'bank', bank: 'Mandiri', no: '145-00-1927-334', pic: 'EMP-030', bal: j(610), recBal: j(610), recAt: '2026-09-30', status: 'active' },
    { id: 'ACC-04', coa: '1124', n: 'BNI Deposito Jaminan', type: 'restricted', bank: 'BNI', no: '0812-339-410', pic: 'EMP-050', bal: j(300), recBal: j(300), recAt: '2026-09-30', status: 'active', restricted: L('Jaminan bank kontrak hotel', 'Bank guarantee for hotel contracts') },
    { id: 'ACC-05', coa: '1111', n: 'Kas Main Plant Ubud', type: 'cashier', bank: null, no: null, pic: 'EMP-021', bal: j(18.5), recBal: j(18.5), recAt: '2026-10-05', status: 'active' },
    { id: 'ACC-06', coa: '1112', n: 'Kas Plant Gianyar', type: 'ops', bank: null, no: null, pic: 'EMP-021', bal: j(9.2), recBal: j(9.2), recAt: '2026-10-05', status: 'active' },
    { id: 'ACC-07', coa: '1113', n: 'Petty Cash', type: 'petty', bank: null, no: null, pic: 'EMP-030', bal: j(6), recBal: j(6.4), recAt: '2026-10-02', status: 'active' }
  ];
  D.CASH_CATS = [['client', L('Penerimaan klien', 'Client receipt')], ['supplier', L('Pembayaran supplier', 'Supplier payment')], ['payroll', L('Gaji & BPJS', 'Payroll & BPJS')], ['utility', L('Utilitas', 'Utilities')], ['fuel', L('BBM', 'Fuel')],
    ['tax', L('Pajak', 'Tax')], ['rent', L('Sewa', 'Rent')], ['capex', L('Capex', 'Capex')], ['opex', L('Biaya operasional', 'Operating expense')], ['bank', L('Biaya bank', 'Bank charges')], ['transfer', L('Transfer antar rekening', 'Internal transfer')], ['other', L('Lainnya', 'Other')]];
  // October cash transactions (§9). [id, date, type, acc, toAcc, cat, amount JT, ref, cc, pic, coa (counter account), note]
  D.CASH_TX = [
    ['CT-2610-001', '2026-10-01', 'transfer', 'ACC-01', 'ACC-07', 'transfer', 5, 'TRF/2610/01', 'CC-ADM', 'EMP-030', null, L('Isi ulang petty cash', 'Petty cash top-up')],
    ['CT-2610-002', '2026-10-01', 'out', 'ACC-07', null, 'opex', 0.85, 'BKK-2610-01', 'CC-ADM', 'EMP-030', '6300', L('Materai, ATK dan fotokopi kontrak', 'Stamp duty, stationery and contract copies')],
    ['CT-2610-003', '2026-10-02', 'out', 'ACC-05', null, 'fuel', 1.4, 'BKK-2610-02', 'CC-LOG', 'EMP-021', '5500', L('BBM darurat JF-03', 'Emergency fuel JF-03')],
    ['CT-2610-004', '2026-10-02', 'deposit', 'ACC-05', 'ACC-01', 'transfer', 6.2, 'STR-2610-01', 'CC-ADM', 'EMP-021', null, L('Setor tunai penjualan walk-in ke BCA', 'Deposit walk-in cash sales to BCA')],
    ['CT-2610-005', '2026-10-03', 'out', 'ACC-01', null, 'bank', 0.12, 'BCA-ADM-09', 'CC-ADM', 'EMP-030', '7200', L('Biaya administrasi bank September', 'September bank admin fee')],
    ['CT-2610-006', '2026-10-03', 'out', 'ACC-06', null, 'opex', 0.6, 'BKK-2610-03', 'CC-PRD2', 'EMP-021', '5900', L('Sarung tangan dan masker produksi', 'Production gloves and masks')],
    ['CT-2610-007', '2026-10-04', 'in', 'ACC-05', null, 'client', 2.8, 'KWT-2610-11', 'CC-SLS', 'EMP-021', '4900', L('Laundry walk-in tunai', 'Walk-in laundry cash')],
    ['CT-2610-008', '2026-10-05', 'out', 'ACC-03', null, 'other', 1.5, 'MDR-2610-02', 'CC-MGT', 'EMP-030', '6500', L('Sponsor acara asosiasi hotel Ubud', 'Ubud hotel association event sponsorship')],
    ['CT-2610-009', '2026-10-05', 'in', 'ACC-03', null, 'other', 0.32, 'MDR-BNG-09', 'CC-ADM', 'EMP-030', '7100', L('Jasa giro September', 'September current account interest')]
  ];

  /* ---------- NP-03 sales ledger, September (volumes only; rate from the Phase 6 rate card on 15 Sep) ---------- */
  // [property, service, quantity in the service unit]
  D.SALES_SEP = [
    ['PR-01A', 'SV-006', 19800], ['PR-01A', 'SV-008', 9000], ['PR-01A', 'SV-009', 3600], ['PR-01A', 'SV-002', 1200], ['PR-01A', 'SV-005', 380],
    ['PR-01B', 'SV-006', 13400], ['PR-01B', 'SV-008', 6100], ['PR-01B', 'SV-009', 2600], ['PR-01B', 'SV-010', 60],
    ['PR-07A', 'SV-007', 8000], ['PR-07A', 'SV-008', 3200], ['PR-07B', 'SV-007', 6400], ['PR-07B', 'SV-008', 2100], ['PR-07C', 'SV-007', 5200], ['PR-07D', 'SV-007', 4300], ['PR-07D', 'SV-001', 1100],
    ['PR-03A', 'SV-006', 17000], ['PR-03A', 'SV-008', 4600], ['PR-03A', 'SV-003', 420], ['PR-03A', 'SV-010', 140], ['PR-03B', 'SV-006', 6900], ['PR-03B', 'SV-008', 2300],
    ['PR-02A', 'SV-006', 15800], ['PR-02A', 'SV-008', 5800], ['PR-02A', 'SV-009', 1700], ['PR-02A', 'SV-002', 900],
    ['PR-05A', 'SV-006', 14200], ['PR-05A', 'SV-008', 5200], ['PR-05A', 'SV-009', 1500], ['PR-05A', 'SV-003', 380], ['PR-05A', 'SV-005', 220],
    ['PR-04A', 'SV-006', 7900], ['PR-04A', 'SV-008', 2600], ['PR-04A', 'SV-001', 600],
    ['PR-06A', 'SV-007', 5600], ['PR-06A', 'SV-008', 1700],
    ['PR-10A', 'SV-006', 3600], ['PR-10A', 'SV-008', 900],
    ['PR-08A', 'SV-006', 2400], ['PR-08A', 'SV-001', 500],
    ['PR-09A', 'SV-006', 1700], ['PR-09A', 'SV-002', 300],
    ['PR-11A', 'SV-001', 140], ['PR-11A', 'SV-005', 30], ['PR-11A', 'SV-010', 8]
  ];
  D.SEP_REV_TOTAL = j(1610);     // Phase 5 D.FIN.pl September revenue; the rest after the sales ledger is delivery and other revenue
  D.SEP_DELIVERY_SHARE = 0.55;    // of that rest: delivery fees (4500); the remainder is other revenue (4900)
  // Standard weight per pcs service (kg per pcs) for the kg equivalent (§29); kg services count 1:1.
  D.SVC_PCS_ITEM = { 'SV-005': 'IT-DRY-01', 'SV-009': 'IT-UNF-01', 'SV-010': 'IT-SPC-01' };

  // October Billing Ready accruals already archived from Phase 9 (1–5 Oct). [id, date, property, service, qty]
  D.BR_SEED = [
    ['BR-2610-101', '2026-10-01', 'PR-01A', 'SV-006', 3300], ['BR-2610-102', '2026-10-01', 'PR-03A', 'SV-006', 2800], ['BR-2610-103', '2026-10-01', 'PR-07A', 'SV-007', 1300],
    ['BR-2610-104', '2026-10-02', 'PR-01B', 'SV-006', 2200], ['BR-2610-105', '2026-10-02', 'PR-02A', 'SV-006', 2600], ['BR-2610-106', '2026-10-02', 'PR-05A', 'SV-006', 2300],
    ['BR-2610-107', '2026-10-03', 'PR-01A', 'SV-008', 1500], ['BR-2610-108', '2026-10-03', 'PR-07B', 'SV-007', 1050], ['BR-2610-109', '2026-10-03', 'PR-04A', 'SV-006', 1300],
    ['BR-2610-110', '2026-10-04', 'PR-03B', 'SV-006', 1150], ['BR-2610-111', '2026-10-04', 'PR-06A', 'SV-007', 900], ['BR-2610-112', '2026-10-04', 'PR-01A', 'SV-009', 600],
    ['BR-2610-113', '2026-10-05', 'PR-02A', 'SV-008', 950], ['BR-2610-114', '2026-10-05', 'PR-05A', 'SV-008', 850], ['BR-2610-115', '2026-10-05', 'PR-07C', 'SV-007', 850], ['BR-2610-116', '2026-10-05', 'PR-03A', 'SV-003', 70],
    ['BR-2610-117', '2026-10-06', 'PR-01A', 'SV-006', 3100], ['BR-2610-118', '2026-10-06', 'PR-01B', 'SV-006', 2100], ['BR-2610-119', '2026-10-06', 'PR-02A', 'SV-006', 2500], ['BR-2610-120', '2026-10-06', 'PR-03A', 'SV-006', 2600],
    ['BR-2610-121', '2026-10-06', 'PR-04A', 'SV-006', 1250], ['BR-2610-122', '2026-10-06', 'PR-05A', 'SV-006', 2200], ['BR-2610-123', '2026-10-06', 'PR-07A', 'SV-007', 1250], ['BR-2610-124', '2026-10-06', 'PR-08A', 'SV-006', 900]
  ];

  /* ---------- Invoices (§14). Phase 5 open invoices plus paid history. amt = total incl. PPN ---------- */
  // [inv, client, property, period, issued, due, total JT, paid JT, lastPay, status hint]
  D.INVOICES = [
    ['INV-2610-001', 'CL-01', 'PR-01A', '2026-09', '2026-10-01', '2026-10-31', 186, 0], ['INV-2610-002', 'CL-02', 'PR-02A', '2026-09', '2026-10-01', '2026-10-31', 94, 0],
    ['INV-2610-003', 'CL-05', 'PR-05A', '2026-09', '2026-10-01', '2026-10-15', 76, 0], ['INV-2610-004', 'CL-06', 'PR-06A', '2026-09', '2026-10-01', '2026-10-31', 38, 0],
    ['INV-2609-044', 'CL-01', 'PR-01B', '2026-08', '2026-09-05', '2026-10-05', 172, 0], ['INV-2609-031', 'CL-02', 'PR-02A', '2026-08', '2026-08-26', '2026-09-25', 88, 0],
    ['INV-2609-020', 'CL-03', 'PR-03A', '2026-08', '2026-08-19', '2026-09-18', 142, 0], ['INV-2608-019', 'CL-03', 'PR-03A', '2026-07', '2026-07-29', '2026-08-28', 131, 0],
    ['INV-2608-031', 'CL-04', 'PR-04A', '2026-07', '2026-07-16', '2026-08-15', 84, 20, '2026-10-05'], ['INV-2607-031', 'CL-04', 'PR-04A', '2026-06', '2026-06-20', '2026-07-20', 58, 0],
    ['INV-2606-031', 'CL-04', 'PR-04A', '2026-05', '2026-05-26', '2026-06-25', 41, 0], ['INV-2609-052', 'CL-05', 'PR-05A', '2026-08', '2026-09-08', '2026-10-08', 71, 0],
    ['INV-2609-060', 'CL-06', 'PR-06A', '2026-08', '2026-08-31', '2026-09-30', 35, 0],
    ['INV-2609-012', 'CL-01', 'PR-01A', '2026-08', '2026-08-29', '2026-09-28', 168, 168, '2026-09-28'], ['INV-2609-071', 'CL-07', 'PR-07A', '2026-08', '2026-09-02', '2026-10-02', 236, 236, '2026-10-02'],
    ['INV-2609-072', 'CL-03', 'PR-03B', '2026-08', '2026-09-03', '2026-10-03', 92, 92, '2026-10-05'], ['INV-2609-080', 'CL-08', 'PR-08A', '2026-08', '2026-09-04', '2026-10-04', 25, 25, '2026-10-03']
  ];
  // Collection workspace (§16): PIC, last contact, next action, promise to pay.
  D.COLLECT = {
    'INV-2606-031': { pic: 'EMP-030', last: '2026-10-02', next: '2026-10-07', act: L('Telepon GM Oceanview, minta jadwal pelunasan', 'Call the Oceanview GM, ask for a settlement schedule'), esc: true, outcome: 'ptp',
      ptp: { date: '2026-10-09', amt: j(41) }, notes: [['2026-09-18', 'EMP-030', L('Email pengingat ke-3, belum ada jawaban.', '3rd reminder email, no reply.')], ['2026-10-02', 'EMP-040', L('Ayu bertemu Finance Oceanview: janji bayar 9 Okt.', 'Ayu met Oceanview Finance: promise to pay 9 Oct.')]] },
    'INV-2607-031': { pic: 'EMP-030', last: '2026-10-02', next: '2026-10-09', act: L('Konfirmasi pembayaran setelah INV-2606-031', 'Confirm payment after INV-2606-031'), esc: true, outcome: 'contacted', notes: [['2026-10-02', 'EMP-040', L('Dibahas bersama INV-2606-031.', 'Discussed together with INV-2606-031.')]] },
    'INV-2608-031': { pic: 'EMP-030', last: '2026-10-05', next: '2026-10-10', act: L('Tagih sisa Rp 64 jt', 'Collect the remaining Rp 64 m'), outcome: 'partial', notes: [['2026-10-05', 'EMP-030', L('Diterima Rp 20 jt via BCA.', 'Received Rp 20 m via BCA.')]] },
    'INV-2608-019': { pic: 'EMP-030', last: '2026-09-29', next: '2026-10-06', act: L('Kirim rekap POD Juli ke Kayana Finance', 'Send the July POD summary to Kayana Finance'), outcome: 'dispute', notes: [['2026-09-29', 'EMP-030', L('Kayana minta bukti POD 3 pengiriman Juli sebelum bayar.', 'Kayana asks for POD proof of 3 July deliveries before paying.')]] },
    'INV-2609-020': { pic: 'EMP-030', last: '2026-09-29', next: '2026-10-08', act: L('Follow-up setelah POD dikirim', 'Follow up after the POD is sent'), outcome: 'contacted', notes: [] },
    'INV-2609-031': { pic: 'EMP-030', last: '2026-10-01', next: '2026-10-07', act: L('Pengingat ke Santai Finance', 'Reminder to Santai Finance'), outcome: 'ptp', ptp: { date: '2026-10-08', amt: j(88) }, notes: [['2026-10-01', 'EMP-030', L('Janji transfer 8 Okt.', 'Promised a transfer on 8 Oct.')]] },
    'INV-2609-060': { pic: 'EMP-030', last: '2026-10-01', next: '2026-10-07', act: L('Pengingat pertama', 'First reminder'), outcome: 'contacted', notes: [] }
  };

  /* ---------- NP-04 suppliers (§50) ---------- */
  // [id, name, category, contact, phone, city, term days, lead days, quality 1–5, delivery 1–5, status]
  D.SUPPLIERS = [
    ['SUP-01', 'PT Ecolab Indonesia', 'chemical', 'Rudi Hartono', '+62 361 470 221', 'Denpasar', 30, 5, 4.6, 4.4, 'active'],
    ['SUP-02', 'Bali Linen Supply', 'linen', 'Kadek Sujana', '+62 361 980 115', 'Gianyar', 14, 7, 4.2, 4.0, 'active'],
    ['SUP-03', 'CV Kemasan Dewata', 'packaging', 'Ni Made Ayu', '+62 812 3640 2210', 'Denpasar', 30, 3, 4.1, 4.5, 'active'],
    ['SUP-04', 'PT Teknik Mesin Bali', 'sparepart', 'I Wayan Gede', '+62 361 720 118', 'Denpasar', 30, 10, 4.3, 3.6, 'active'],
    ['SUP-05', 'Pertamina Fleet Card', 'fuel', 'Customer Care', '135', 'Bali', 15, 0, 4.5, 5.0, 'active'],
    ['SUP-06', 'PLN UP3 Bali Timur', 'utility', 'Layanan Pelanggan', '123', 'Gianyar', 20, 0, 4.0, 5.0, 'active'],
    ['SUP-07', 'Perumda Air Gianyar', 'utility', 'Layanan Pelanggan', '+62 361 943 107', 'Gianyar', 20, 0, 4.0, 5.0, 'active'],
    ['SUP-08', 'PT Diversey Indonesia', 'chemical', 'Ivan Setiawan', '+62 21 5098 8800', 'Jakarta', 45, 9, 4.7, 3.8, 'active'],
    ['SUP-09', 'UD Sumber Kimia Bali', 'chemical', 'Komang Arya', '+62 813 3725 4410', 'Denpasar', 14, 2, 3.7, 4.6, 'active'],
    ['SUP-10', 'Toko Sinar ATK', 'office', 'Pak Hendra', '+62 361 975 002', 'Ubud', 7, 1, 4.0, 4.2, 'active'],
    ['SUP-11', 'PT Graha Laundry Equipment', 'machine', 'Andreas Lim', '+62 31 535 4400', 'Surabaya', 30, 45, 4.5, 4.0, 'active']
  ];
  D.SUP_CATS = { chemical: L('Bahan kimia', 'Chemicals'), linen: L('Linen', 'Linen'), packaging: L('Kemasan', 'Packaging'), sparepart: L('Spare part', 'Spare parts'), fuel: L('BBM', 'Fuel'), utility: L('Utilitas', 'Utilities'), office: L('ATK', 'Office supply'), machine: L('Mesin', 'Machines') };

  /* ---------- Expenses & supplier invoices (§17–§20). [id, src, supplier, supplier inv no, date, cat, cc, plant, amount JT, tax JT, due, po, grn, status, coa, desc, paid JT] ---------- */
  D.EXPENSES = [
    ['EXP-2610-001', 'supinv', 'SUP-02', 'BLS/IX/0921', '2026-09-22', 'supplier', 'CC-PRD', 'PL-01', 16.2, 1.8, '2026-10-06', null, null, 'scheduled', '5900', L('Linen pengganti klien (rusak) September', 'Client replacement linen (damaged) September'), 0],
    ['EXP-2610-002', 'supinv', 'SUP-04', 'TMB-2610-044', '2026-10-01', 'maintenance', 'CC-MNT', 'PL-01', 9.13, 1.0, '2026-10-08', 'PO-2609-014', 'GRN-2609-021', 'approved', '2150', L('Spare part dryer #2: bearing dan belt', 'Dryer #2 spare parts: bearing and belt'), 0],
    ['EXP-2610-003', 'supinv', 'SUP-05', 'PFC-0926-77', '2026-09-30', 'fuel', 'CC-LOG', 'PL-01', 14, 0, '2026-10-10', null, null, 'approved', '5500', L('BBM armada September', 'Fleet fuel September'), 0],
    ['EXP-2610-004', 'payroll', null, 'BPJS-2609', '2026-10-01', 'payroll', 'CC-ADM', 'HO', 28, 0, '2026-10-10', null, null, 'approved', '2300', L('BPJS Ketenagakerjaan & Kesehatan September', 'September BPJS employment & health'), 0],
    ['EXP-2610-005', 'supinv', 'SUP-01', 'ECL/INV/26/09871', '2026-10-02', 'chemical', 'CC-PRD', 'PL-01', 29.476, 3.24, '2026-10-12', 'PO-2609-011', 'GRN-2609-019', 'verify', '2150', L('Detergen, softener dan bleach (PO-2609-011)', 'Detergent, softener and bleach (PO-2609-011)'), 0],
    ['EXP-2610-006', 'tax', null, 'SPT-2609', '2026-10-01', 'tax', 'CC-ADM', 'HO', 74, 0, '2026-10-15', null, null, 'approved', '2210', L('PPN & PPh September', 'September VAT & income tax'), 0],
    ['EXP-2610-007', 'utility', 'SUP-06', '5512 0098 7734/09', '2026-10-03', 'utility', 'CC-PRD', 'PL-01', 48, 0, '2026-10-20', null, null, 'received', '5400', L('Listrik PLN September', 'PLN electricity September'), 0],
    ['EXP-2610-008', 'utility', 'SUP-07', 'PDAM-GNY-0926', '2026-10-03', 'utility', 'CC-PRD', 'PL-01', 9, 0, '2026-10-20', null, null, 'received', '5400', L('Air PDAM September', 'PDAM water September'), 0],
    ['EXP-2610-009', 'supinv', 'SUP-03', 'KD/2610/118', '2026-10-04', 'packaging', 'CC-PRD', 'PL-01', 4.68, 0.51, '2026-11-14', 'PO-2610-002', 'GRN-2610-002', 'approved', '2150', L('Plastik kemasan dan label (PO-2610-002)', 'Packaging plastic and labels (PO-2610-002)'), 0],
    ['EXP-2610-010', 'supinv', 'SUP-04', 'TMB-2610-044', '2026-10-05', 'maintenance', 'CC-MNT', 'PL-01', 9.13, 1.0, '2026-10-08', null, null, 'received', '2150', L('Spare part dryer #2 (tagihan dikirim ulang)', 'Dryer #2 spare parts (invoice re-sent)'), 0],
    ['EXP-2609-031', 'supinv', 'SUP-01', 'ECL/INV/26/09102', '2026-09-03', 'chemical', 'CC-PRD', 'PL-01', 49.5, 5.4, '2026-10-03', 'PO-2608-022', 'GRN-2608-030', 'paid', '2150', L('Bahan kimia Agustus', 'August chemicals'), 54.9],
    ['EXP-2609-032', 'rent', null, 'SEWA-UBD-10', '2026-09-25', 'rent', 'CC-ADM', 'PL-01', 120, 0, '2026-10-01', null, null, 'paid', '1400', L('Sewa plant Ubud Oktober (dibayar di muka)', 'Ubud plant rent October (prepaid)'), 120],
    ['EXP-2610-011', 'reimb', null, 'RMB-2610-03', '2026-10-05', 'opex', 'CC-SLS', 'HO', 1.35, 0, '2026-10-12', null, null, 'verify', '6500', L('Reimburse entertain klien Kayana (Ayu)', 'Client entertainment reimbursement Kayana (Ayu)'), 0]
  ];
  D.EXP_CATS = { supplier: L('Supplier', 'Supplier'), chemical: L('Bahan kimia', 'Chemicals'), packaging: L('Kemasan', 'Packaging'), maintenance: L('Maintenance', 'Maintenance'), fuel: L('BBM', 'Fuel'), payroll: L('Gaji & BPJS', 'Payroll & BPJS'),
    tax: L('Pajak', 'Tax'), utility: L('Utilitas', 'Utilities'), rent: L('Sewa', 'Rent'), opex: L('Operasional', 'Operating'), capex: L('Capex', 'Capex') };
  D.EXP_SRC = { supinv: L('Invoice supplier', 'Supplier invoice'), po: 'PO', utility: L('Utilitas', 'Utility'), payroll: L('Payroll', 'Payroll'), maintenance: L('Maintenance', 'Maintenance'), rent: L('Sewa', 'Rent'), tax: L('Pajak', 'Tax'), reimb: L('Reimburse', 'Reimbursement'), opex: L('Biaya operasional', 'Operational expense') };
  // Recurring obligations for the cash forecast (§11): [key, label, day of month, amount JT, account]
  D.RECURRING = [['payroll', L('Gaji karyawan', 'Employee payroll'), 28, 385, 'ACC-02'], ['bpjs', L('BPJS', 'BPJS'), 10, 28, 'ACC-01'], ['tax', L('PPN & PPh', 'VAT & income tax'), 15, 76, 'ACC-01'],
    ['elec', L('Listrik PLN', 'PLN electricity'), 20, 50, 'ACC-01'], ['water', L('Air PDAM', 'PDAM water'), 20, 9, 'ACC-01'], ['rent', L('Sewa plant Gianyar', 'Gianyar plant rent'), 1, 120, 'ACC-03'],
    ['loan', L('Angsuran pinjaman bank', 'Bank loan instalment'), 25, 24.5, 'ACC-03'], ['fuel', L('BBM armada', 'Fleet fuel'), 10, 15, 'ACC-01'], ['chem', L('Bahan kimia', 'Chemicals'), 12, 58, 'ACC-01']];

  /* ---------- HPP cost components per month (§22–§25), Rp juta. Volume = kg equivalent (§29) ---------- */
  // Months Apr–Sep; September volume is computed from the sales ledger, earlier months are the stored volume.
  D.HPP_MONTHS = ['2026-04', '2026-05', '2026-06', '2026-07', '2026-08', '2026-09'];
  D.HPP_VOL = [176900, 179400, 182800, 186100, 190500, null];
  D.HPP_COMP = {
    chemical: { detergent: [44.8, 45.4, 46.5, 47.6, 48.2, 51.5], softener: [16.0, 16.2, 16.6, 17.0, 17.2, 18.4], bleach: [8.8, 8.9, 9.1, 9.4, 9.5, 10.1], stain: [6.4, 6.5, 6.6, 6.8, 6.9, 7.4], packing: [15.0, 15.2, 15.6, 16.1, 16.6, 18.0], bhp: [4.0, 4.1, 4.2, 4.3, 4.3, 4.6] },
    utility: { electricity: [79.9, 80.8, 82.5, 84.2, 83.3, 85.9], water: [16.2, 16.2, 17.1, 16.2, 15.3, 15.3], gas: [20.1, 20.4, 21.0, 21.6, 22.0, 22.8] },
    labor: { salary: [280.7, 284.8, 287.8, 290.3, 292.4, 294.9], allowance: [34.2, 34.7, 35.1, 35.4, 35.7, 36.0], meal: [27.4, 27.8, 28.1, 28.3, 28.5, 28.8] },
    overhead: { rent: [96, 96, 96, 96, 96, 96], admin: [17.5, 17.5, 18.0, 18.5, 18.0, 19.0], waste: [5.2, 5.3, 5.4, 5.5, 5.6, 5.7], maintenance: [36, 38, 40, 39, 41, 44], mgmt: [49.5, 50.0, 50.4, 50.9, 51.0, 51.3], permit: [2.5, 2.5, 2.5, 2.5, 2.5, 2.5], other: [22.0, 22.5, 23.0, 23.0, 23.5, 24.0] },
    machine: { depreciation: null },   // from the asset register (production machines, per period)
    logistics: { fuel: [55, 57, 58, 60, 59, 61], vehicle: [9.0, 9.4, 9.8, 10.1, 10.4, 10.8], delivery: [28.5, 28.9, 29.3, 29.8, 30.2, 30.5] }
  };
  D.HPP_GROUPS = [['chemical', L('Bahan Kimia & Consumable', 'Chemicals & Consumables'), 'drop'], ['utility', L('Utilitas', 'Utilities'), 'zap'], ['labor', L('Tenaga Kerja', 'Labour'), 'users'], ['overhead', L('Overhead', 'Overhead'), 'building'], ['machine', L('Mesin', 'Machines'), 'washer'], ['logistics', L('Logistik', 'Logistics'), 'truck']];
  D.HPP_LINES = { detergent: L('Detergen', 'Detergent'), softener: L('Softener', 'Softener'), bleach: L('Bleach', 'Bleach'), stain: L('Stain remover', 'Stain remover'), packing: L('Kemasan', 'Packing'), bhp: L('BHP', 'Consumables (BHP)'),
    electricity: L('Listrik', 'Electricity'), water: L('Air', 'Water'), gas: L('Gas boiler', 'Boiler gas'), salary: L('Gaji langsung', 'Direct salary'), allowance: L('Tunjangan', 'Allowance'), meal: L('Makan & transport', 'Meal & transport'),
    rent: L('Sewa (porsi produksi 80%)', 'Rent (production share 80%)'), admin: L('Admin (porsi 50%)', 'Admin (50% share)'), waste: L('Limbah & IPAL', 'Waste & IPAL'), maintenance: L('Maintenance', 'Maintenance'), mgmt: L('Biaya manajemen (porsi 30%)', 'Management cost (30% share)'),
    permit: L('Izin', 'Permits'), other: L('Biaya tetap lain', 'Other fixed cost'), depreciation: L('Penyusutan mesin produksi', 'Production machine depreciation'), fuel: L('BBM', 'Fuel'), vehicle: L('Maintenance kendaraan', 'Vehicle maintenance'), delivery: L('Upah driver (delivery attributable)', 'Driver wages (delivery attributable)') };
  // Cost behaviour per HPP line (§23)
  D.HPP_BEH = { detergent: 'var', softener: 'var', bleach: 'var', stain: 'var', packing: 'var', bhp: 'var', electricity: 'semi', water: 'var', gas: 'semi', salary: 'semi', allowance: 'fixed', meal: 'semi', rent: 'fixed', admin: 'fixed', waste: 'var', maintenance: 'semi', mgmt: 'fixed', permit: 'fixed', other: 'fixed', depreciation: 'fixed', fuel: 'var', vehicle: 'semi', delivery: 'semi' };
  // Allocation driver per group (§23, HPP-003): kgeq = kg equivalent; labor = labour minutes; dlv = delivery stops.
  D.HPP_ALLOC = { chemical: 'chem', utility: 'kgeq', labor: 'labor', overhead: 'kgeq', machine: 'kgeq', logistics: 'dlv' };
  // Service drivers: labour minutes per kg eq, chemical index, delivery stops per 100 kg eq.
  D.SVC_DRIVER = { 'SV-001': [1.00, 1.00, 1.0], 'SV-002': [1.30, 1.00, 1.6], 'SV-003': [1.85, 1.05, 2.4], 'SV-004': [0.80, 0.20, 1.0], 'SV-005': [3.40, 1.60, 1.2], 'SV-006': [0.82, 0.95, 0.9], 'SV-007': [0.90, 1.05, 1.0], 'SV-008': [0.62, 1.10, 0.9], 'SV-009': [1.70, 1.00, 1.0], 'SV-010': [4.20, 2.20, 1.4] };
  // Stored HPP versions (§25): September v1 at soft close, v2 after the late PLN accrual.
  D.HPP_VERSIONS = [['2026-09', 1, '2026-10-02 16:10', 'EMP-030', L('Hitung awal soft close September', 'First calculation at the September soft close'), { electricity: 81.9 }], ['2026-09', 2, '2026-10-05 11:20', 'EMP-030', L('Tagihan PLN September masuk: listrik +Rp 4 jt', 'September PLN bill arrived: electricity +Rp 4 m'), null]];

  /* ---------- NP-06 laundry item master (§27–§31). Standard weight always in kg ---------- */
  // [code, id, en, category, kg, billing unit, process, default service, special, p8 key, Sept pcs volume, price per pcs (Price List 2026) or null for kg billing]
  D.ITEMS = [
    ['IT-BTW-01', 'Handuk Mandi', 'Bath Towel', 'towel', 0.60, 'kg', 'towel', 'SV-008', 0, 'bathtowel', 38400, null], ['IT-HTW-01', 'Handuk Tangan', 'Hand Towel', 'towel', 0.15, 'kg', 'towel', 'SV-008', 0, 'handtowel', 41200, null],
    ['IT-FTW-01', 'Keset Kaki Handuk', 'Bath Mat', 'towel', 0.35, 'kg', 'towel', 'SV-008', 0, null, 18600, null], ['IT-PTW-01', 'Handuk Kolam', 'Pool Towel', 'towel', 0.80, 'kg', 'towel', 'SV-008', 0, null, 9800, null],
    ['IT-SHT-01', 'Sprei Single', 'Single Bed Sheet', 'white', 0.55, 'kg', 'flat', 'SV-006', 0, null, 22400, null], ['IT-SHT-02', 'Sprei King', 'King Bed Sheet', 'white', 0.70, 'kg', 'flat', 'SV-006', 0, 'sheet', 61800, null],
    ['IT-PLW-01', 'Sarung Bantal', 'Pillow Case', 'white', 0.15, 'kg', 'flat', 'SV-006', 0, 'pillow', 98400, null], ['IT-DUV-01', 'Sarung Duvet King', 'King Duvet Cover', 'white', 1.10, 'kg', 'flat', 'SV-006', 0, 'duvet', 24300, null],
    ['IT-DUV-02', 'Duvet Insert', 'Duvet Insert', 'white', 1.80, 'kg', 'bulky', 'SV-006', 1, null, 820, null], ['IT-TBC-01', 'Taplak Meja F&B', 'F&B Table Cloth', 'fnb', 0.45, 'kg', 'flat', 'SV-006', 0, null, 8600, null],
    ['IT-NPK-01', 'Serbet F&B', 'F&B Napkin', 'fnb', 0.05, 'kg', 'flat', 'SV-006', 0, null, 31200, null], ['IT-SPA-01', 'Linen Spa', 'Spa Linen', 'spa', 0.35, 'kg', 'flat', 'SV-007', 0, 'spa', 52600, null],
    ['IT-SRG-01', 'Sarung Spa', 'Spa Sarong', 'spa', 0.30, 'kg', 'flat', 'SV-007', 0, 'sarong', 21400, null], ['IT-ROB-01', 'Bathrobe', 'Bathrobe', 'spa', 1.20, 'kg', 'towel', 'SV-007', 0, null, 6400, null],
    ['IT-UNF-01', 'Seragam Staf', 'Staff Uniform', 'uniform', 0.45, 'pcs', 'garment', 'SV-009', 0, 'uniform', 9400, 12000], ['IT-UNF-02', 'Seragam Chef', 'Chef Uniform', 'uniform', 0.55, 'pcs', 'garment', 'SV-009', 0, null, 2200, 12000],
    ['IT-DRY-01', 'Jas / Dry Cleaning', 'Suit / Dry Cleaning', 'garment', 0.90, 'pcs', 'dry', 'SV-005', 1, null, 630, 25000], ['IT-SPC-01', 'Gaun / Special Treatment', 'Dress / Special Treatment', 'garment', 0.80, 'pcs', 'special', 'SV-010', 1, null, 208, 35000],
    ['IT-CUR-01', 'Gorden', 'Curtain', 'bulky', 2.40, 'kg', 'bulky', 'SV-001', 1, null, 160, null], ['IT-OTH-01', 'Lainnya', 'Other', 'white', 0.40, 'kg', 'flat', 'SV-001', 0, 'other', 5200, null]
  ];
  D.ITEM_CATS = { towel: L('Handuk', 'Towels'), white: L('Linen putih', 'White linen'), fnb: L('Linen F&B', 'F&B linen'), spa: L('Linen spa', 'Spa linen'), uniform: L('Seragam', 'Uniforms'), garment: L('Garmen', 'Garments'), bulky: L('Barang besar', 'Bulky items') };
  D.ITEM_PROC = { towel: L('Handuk (tumble dry)', 'Towel (tumble dry)'), flat: L('Flatwork (ironer)', 'Flatwork (ironer)'), bulky: L('Barang besar', 'Bulky'), garment: L('Garmen (press)', 'Garment (press)'), dry: L('Dry cleaning', 'Dry cleaning'), special: L('Special treatment', 'Special treatment') };
  // Weight history (§31): earlier versions kept. [code, version, kg, effective, reason, user, approved by, status]
  D.ITEM_VERS = [
    ['IT-BTW-01', 1, 0.65, '2025-01-01', L('Berat item 2025 (legacy, satuan gram 650)', '2025 item weight (legacy, unit gram 650)'), 'EMP-030', 'EMP-050', 'superseded'],
    ['IT-BTW-01', 2, 0.60, '2026-01-01', L('Berat Item Laundry Update 2026, dinormalisasi ke kg', 'Laundry Item Weight Update 2026, normalized to kg'), 'EMP-030', 'EMP-050', 'active'],
    ['IT-BTW-01', 3, 0.50, '2026-11-01', L('Penimbangan ulang 200 handuk baru Grand Vista (rata-rata 498 g)', 'Re-weighing 200 new Grand Vista towels (average 498 g)'), 'EMP-010', null, 'pending'],
    ['IT-DUV-01', 1, 1.20, '2025-01-01', L('Berat item 2025 (legacy)', '2025 item weight (legacy)'), 'EMP-030', 'EMP-050', 'superseded'],
    ['IT-DUV-01', 2, 1.10, '2026-01-01', L('Berat Item Laundry Update 2026', 'Laundry Item Weight Update 2026'), 'EMP-030', 'EMP-050', 'active'],
    ['IT-SPA-01', 1, 0.35, '2026-01-01', L('Berat Item Laundry Update 2026', 'Laundry Item Weight Update 2026'), 'EMP-030', 'EMP-050', 'active']
  ];
  // §90 legacy data issues found while cleaning the baseline.
  D.LEGACY = [
    [L('Berat Handuk Mandi tertulis "650" tanpa satuan; dinormalisasi ke 0,65 kg (v1).', 'Bath Towel weight written as "650" without a unit; normalized to 0.65 kg (v1).'), 'fixed'],
    [L('HPP 2026 lama menjumlahkan penyusutan dua kali (di overhead dan mesin). Dihitung ulang dari komponen.', 'The old HPP 2026 counted depreciation twice (overhead and machines). Recalculated from components.'), 'fixed'],
    [L('Price List 2026 memakai "margin" untuk markup. Label diperbaiki: markup dan gross margin dipisah.', 'Price List 2026 used "margin" for markup. Labels fixed: markup and gross margin are separate.'), 'fixed'],
    [L('3 item tanpa kategori proses (gorden, duvet insert, bathrobe). Sudah dilengkapi.', '3 items without a process category (curtain, duvet insert, bathrobe). Completed.'), 'fixed'],
    [L('Usulan berat baru Handuk Mandi 0,50 kg menunggu persetujuan Owner.', 'The proposed new Bath Towel weight 0.50 kg waits for Owner approval.'), 'open']
  ];

  /* ---------- NP-07 pricing (§32–§37) ---------- */
  D.PRICE_CFG = { method: 'margin', targetMargin: 35, targetMarkup: 55, excellent: 45, healthy: 30, low: 15, staleDays: 365, eff: '2026-01-01', v: 2 };
  // Last master price change per service (Price List history).
  D.PRICE_HIST = [['SV-001', 7000, '2024-01-01'], ['SV-001', 7500, '2025-01-01'], ['SV-002', 9500, '2025-01-01'], ['SV-003', 12000, '2024-06-01'], ['SV-003', 12500, '2025-07-01'], ['SV-004', 6000, '2025-01-01'],
    ['SV-005', 25000, '2025-01-01'], ['SV-006', 8500, '2025-07-01'], ['SV-007', 9000, '2025-07-01'], ['SV-008', 8000, '2025-07-01'], ['SV-009', 12000, '2025-01-01'], ['SV-010', 35000, '2025-01-01']];

  /* ---------- NP-08 inventory (§39–§44) ---------- */
  // [code, name id, en, category, unit, min, rop, max, supplier, avg cost, location, qty, consumption per 1000 kg eq (unit), GL]
  D.STOCK = [
    ['CHM-DET-01', 'Detergen Cair Ecolab Turbo', 'Ecolab Turbo Liquid Detergent', 'detergent', 'L', 180, 320, 900, 'SUP-01', 36500, 'GD-UBD-A1', 422, 7.2, '1310'],
    ['CHM-DET-02', 'Detergen Bubuk Sumber Kimia', 'Sumber Kimia Powder Detergent', 'detergent', 'kg', 100, 180, 500, 'SUP-09', 21800, 'GD-UBD-A1', 140, 1.4, '1310'],
    ['CHM-SFT-01', 'Softener Ecolab Soft', 'Ecolab Soft Softener', 'softener', 'L', 120, 200, 600, 'SUP-01', 28400, 'GD-UBD-A2', 268, 3.3, '1310'],
    ['CHM-BLC-01', 'Bleach Oksigen', 'Oxygen Bleach', 'bleach', 'L', 80, 140, 400, 'SUP-01', 24600, 'GD-UBD-A2', 62, 2.1, '1310'],
    ['CHM-STN-01', 'Stain Remover Diversey', 'Diversey Stain Remover', 'chemical', 'L', 20, 40, 120, 'SUP-08', 96000, 'GD-UBD-A3', 46, 0.40, '1310'],
    ['CHM-ALK-01', 'Booster Alkali', 'Alkali Booster', 'chemical', 'L', 60, 100, 300, 'SUP-01', 31200, 'GD-UBD-A3', 0, 1.2, '1310'],
    ['CHM-NTR-01', 'Neutralizer Sour', 'Sour Neutralizer', 'chemical', 'L', 40, 70, 200, 'SUP-08', 33800, 'GD-UBD-A3', 88, 0.9, '1310'],
    ['CHM-DET-03', 'Detergen Cair Plant Gianyar', 'Liquid Detergent Gianyar Plant', 'detergent', 'L', 120, 200, 500, 'SUP-01', 36500, 'GD-GNY-A1', 236, 0, '1310'],
    ['PKG-PLS-01', 'Plastik Kemasan 60×90', 'Packaging Plastic 60×90', 'packaging', 'pcs', 4000, 7000, 20000, 'SUP-03', 620, 'GD-UBD-B1', 9910, 42, '1320'],
    ['PKG-PLS-02', 'Plastik Kemasan 40×60', 'Packaging Plastic 40×60', 'packaging', 'pcs', 3000, 5000, 15000, 'SUP-03', 410, 'GD-UBD-B1', 3600, 28, '1320'],
    ['PKG-LBL-01', 'Label Thermal QR', 'Thermal QR Label', 'label', 'roll', 20, 35, 120, 'SUP-03', 48000, 'GD-UBD-B2', 32, 0.14, '1320'],
    ['PKG-BAG-01', 'Laundry Bag Kain', 'Cloth Laundry Bag', 'packaging', 'pcs', 150, 250, 800, 'SUP-02', 38000, 'GD-UBD-B2', 410, 0.6, '1320'],
    ['PKG-TAG-01', 'Tag Seragam', 'Uniform Tag', 'label', 'pcs', 1000, 1800, 6000, 'SUP-03', 120, 'GD-UBD-B2', 2300, 5, '1320'],
    ['SPR-BLT-01', 'V-Belt Dryer', 'Dryer V-Belt', 'sparepart', 'pcs', 4, 6, 16, 'SUP-04', 385000, 'GD-MNT-01', 7, 0, '1330'],
    ['SPR-BRG-01', 'Bearing Drum Washer', 'Washer Drum Bearing', 'sparepart', 'pcs', 2, 4, 10, 'SUP-04', 1450000, 'GD-MNT-01', 4, 0, '1330'],
    ['SPR-SNS-01', 'Sensor Kelembapan Dryer', 'Dryer Moisture Sensor', 'sparepart', 'pcs', 1, 2, 6, 'SUP-04', 2850000, 'GD-MNT-01', 0, 0, '1330'],
    ['SPR-SEL-01', 'Karet Pintu Washer', 'Washer Door Seal', 'sparepart', 'pcs', 2, 3, 8, 'SUP-04', 920000, 'GD-MNT-01', 2, 0, '1330'],
    ['CNS-GLV-01', 'Sarung Tangan Nitril', 'Nitrile Gloves', 'consumable', 'box', 20, 35, 120, 'SUP-09', 68000, 'GD-UBD-C1', 44, 0.25, '1330'],
    ['CNS-MSK-01', 'Masker Medis', 'Medical Masks', 'consumable', 'box', 15, 25, 80, 'SUP-09', 42000, 'GD-UBD-C1', 22, 0.12, '1330'],
    ['OFC-PPR-01', 'Kertas A4', 'A4 Paper', 'office', 'rim', 10, 15, 50, 'SUP-10', 52000, 'HO-01', 18, 0, '1330'],
    ['OTH-HNG-01', 'Hanger Plastik', 'Plastic Hanger', 'bhp', 'pcs', 500, 900, 3000, 'SUP-03', 1800, 'GD-UBD-C2', 1240, 1.8, '1330']
  ];
  D.STOCK_CATS = { chemical: L('Bahan kimia', 'Chemical'), detergent: L('Detergen', 'Detergent'), softener: L('Softener', 'Softener'), bleach: L('Bleach', 'Bleach'), packaging: L('Kemasan', 'Packaging'), label: L('Label', 'Label'),
    consumable: L('Consumable', 'Consumable'), sparepart: L('Spare part', 'Spare part'), office: L('ATK', 'Office supply'), bhp: L('BHP lain', 'Other consumables') };
  D.LOCS = { 'GD-UBD-A1': L('Gudang Ubud · Rak Kimia A1', 'Ubud store · Chemical rack A1'), 'GD-UBD-A2': L('Gudang Ubud · Rak Kimia A2', 'Ubud store · Chemical rack A2'), 'GD-UBD-A3': L('Gudang Ubud · Rak Kimia A3', 'Ubud store · Chemical rack A3'),
    'GD-UBD-B1': L('Gudang Ubud · Kemasan B1', 'Ubud store · Packaging B1'), 'GD-UBD-B2': L('Gudang Ubud · Label B2', 'Ubud store · Labels B2'), 'GD-UBD-C1': L('Gudang Ubud · Consumable C1', 'Ubud store · Consumables C1'),
    'GD-UBD-C2': L('Gudang Ubud · BHP C2', 'Ubud store · BHP C2'), 'GD-MNT-01': L('Ruang Maintenance', 'Maintenance room'), 'GD-GNY-A1': L('Gudang Gianyar · Kimia', 'Gianyar store · Chemicals'), 'HO-01': L('Kantor Pusat', 'Head Office'), 'PROD-UBD': L('Lantai produksi Ubud', 'Ubud production floor'), 'PROD-GNY': L('Lantai produksi Gianyar', 'Gianyar production floor') };
  // October movements (§41). [id, at, type, item, qty (+in / −out), from, to, source, reason, user]
  D.MOVES = [
    ['MV-2610-001', '2026-10-01 07:10', 'issue', 'CHM-DET-01', -52, 'GD-UBD-A1', 'PROD-UBD', 'B-2610-801', L('Pemakaian washing 1 Okt', 'Washing use 1 Oct'), 'EMP-071'],
    ['MV-2610-002', '2026-10-01 07:12', 'issue', 'CHM-SFT-01', -24, 'GD-UBD-A2', 'PROD-UBD', 'B-2610-801', L('Pemakaian washing 1 Okt', 'Washing use 1 Oct'), 'EMP-071'],
    ['MV-2610-003', '2026-10-02 07:05', 'issue', 'CHM-DET-01', -49, 'GD-UBD-A1', 'PROD-UBD', 'B-2610-820', L('Pemakaian washing 2 Okt', 'Washing use 2 Oct'), 'EMP-071'],
    ['MV-2610-004', '2026-10-02 07:06', 'issue', 'CHM-BLC-01', -15, 'GD-UBD-A2', 'PROD-UBD', 'B-2610-820', L('Pemakaian washing 2 Okt', 'Washing use 2 Oct'), 'EMP-071'],
    ['MV-2610-005', '2026-10-02 14:30', 'receipt', 'PKG-PLS-01', 6000, 'SUP-03', 'GD-UBD-B1', 'GRN-2610-002', L('Penerimaan PO-2610-002', 'Receipt PO-2610-002'), 'EMP-110'],
    ['MV-2610-006', '2026-10-02 14:35', 'receipt', 'PKG-LBL-01', 20, 'SUP-03', 'GD-UBD-B2', 'GRN-2610-002', L('Penerimaan PO-2610-002', 'Receipt PO-2610-002'), 'EMP-110'],
    ['MV-2610-007', '2026-10-03 07:00', 'issue', 'PKG-PLS-01', -1650, 'GD-UBD-B1', 'PROD-UBD', 'PACK-2610-03', L('Kemasan packing 1–3 Okt', 'Packing use 1–3 Oct'), 'EMP-077'],
    ['MV-2610-008', '2026-10-03 07:15', 'issue', 'CHM-DET-01', -55, 'GD-UBD-A1', 'PROD-UBD', 'B-2610-845', L('Pemakaian washing 3 Okt', 'Washing use 3 Oct'), 'EMP-071'],
    ['MV-2610-009', '2026-10-03 09:20', 'transfer', 'CHM-DET-01', -60, 'GD-UBD-A1', 'GD-GNY-A1', 'TRF-2610-01', L('Transfer ke Plant Gianyar', 'Transfer to the Gianyar plant'), 'EMP-110'],
    ['MV-2610-010', '2026-10-03 09:20', 'transfer', 'CHM-DET-03', 60, 'GD-UBD-A1', 'GD-GNY-A1', 'TRF-2610-01', L('Transfer dari Gudang Ubud', 'Transfer from the Ubud store'), 'EMP-110'],
    ['MV-2610-011', '2026-10-04 07:02', 'issue', 'CHM-DET-01', -51, 'GD-UBD-A1', 'PROD-UBD', 'B-2610-870', L('Pemakaian washing 4 Okt', 'Washing use 4 Oct'), 'EMP-071'],
    ['MV-2610-012', '2026-10-04 07:04', 'issue', 'CHM-ALK-01', -38, 'GD-UBD-A3', 'PROD-UBD', 'B-2610-870', L('Pemakaian washing 4 Okt (stok habis)', 'Washing use 4 Oct (stock out)'), 'EMP-071'],
    ['MV-2610-013', '2026-10-04 16:10', 'waste', 'CHM-SFT-01', -6, 'GD-UBD-A2', null, 'WST-2610-01', L('Jerigen bocor, cairan tidak bisa dipakai', 'Leaking jerrycan, liquid unusable'), 'EMP-071'],
    ['MV-2610-014', '2026-10-05 07:00', 'issue', 'CHM-DET-01', -53, 'GD-UBD-A1', 'PROD-UBD', 'B-2610-890', L('Pemakaian washing 5 Okt', 'Washing use 5 Oct'), 'EMP-071'],
    ['MV-2610-015', '2026-10-05 07:01', 'issue', 'CHM-SFT-01', -22, 'GD-UBD-A2', 'PROD-UBD', 'B-2610-890', L('Pemakaian washing 5 Okt', 'Washing use 5 Oct'), 'EMP-071'],
    ['MV-2610-016', '2026-10-05 15:40', 'return', 'PKG-BAG-01', 12, 'PROD-UBD', 'GD-UBD-B2', 'RTN-2610-01', L('Laundry bag sisa dikembalikan ke gudang', 'Spare laundry bags returned to the store'), 'EMP-077'],
    ['MV-2610-017', '2026-10-06 07:05', 'issue', 'CHM-DET-01', -50, 'GD-UBD-A1', 'PROD-UBD', 'B-2610-001', L('Pemakaian washing 6 Okt', 'Washing use 6 Oct'), 'EMP-071'],
    ['MV-2610-018', '2026-10-06 09:30', 'issue', 'SPR-SNS-01', -1, 'GD-MNT-01', 'D-03', 'WO-2610-01', L('Sensor untuk perbaikan D-03 (stok terakhir)', 'Sensor for the D-03 repair (last unit)'), 'EMP-102']
  ];
  // September stock opname waiting for approval (§44): [item, system qty, physical qty, reason]
  D.OPNAME = { id: 'SO-2609-01', at: '2026-09-30 17:00', by: 'EMP-110', st: 'review', lines: [['CHM-DET-01', 192, 180, L('Selisih takaran dispenser', 'Dispenser measuring difference')], ['CHM-SFT-01', 120, 120, ''], ['PKG-PLS-01', 5560, 5450, L('Plastik sobek tidak dicatat', 'Torn plastic not recorded')], ['PKG-LBL-01', 12, 11, ''], ['SPR-BRG-01', 2, 2, '']] };
  D.STOCK_CFG = { adjApproval: 2500000, wasteWarn: 2 };

  /* ---------- NP-09 purchasing (§45–§51) ---------- */
  // Purchase requests: [id, at, item, qty, required, reason, dept, cc, pic, priority, budget, status, est unit price]
  D.PRS = [
    ['PR-2610-001', '2026-10-04 08:10', 'CHM-ALK-01', 200, '2026-10-08', L('Stok habis, booster wajib untuk linen F&B', 'Stock out, booster required for F&B linen'), 'OPS', 'CC-PRD', 'EMP-110', 'high', 'BUD-2610-CHEM', 'approved', 31200],
    ['PR-2610-002', '2026-10-05 10:30', 'SPR-SNS-01', 3, '2026-10-09', L('Sensor kelembapan cadangan, D-03 rusak (WO-2610-01)', 'Spare moisture sensors, D-03 broken (WO-2610-01)'), 'MNT', 'CC-MNT', 'EMP-102', 'urgent', 'BUD-2610-MNT', 'submitted', 2850000],
    ['PR-2610-003', '2026-10-05 14:00', 'CHM-BLC-01', 240, '2026-10-12', L('Di bawah reorder point (62 L)', 'Below the reorder point (62 L)'), 'OPS', 'CC-PRD', 'EMP-110', 'normal', 'BUD-2610-CHEM', 'review', 24600],
    ['PR-2610-004', '2026-10-06 08:40', 'CHM-SFT-01', 300, '2026-10-13', L('Mendekati reorder point', 'Approaching the reorder point'), 'OPS', 'CC-PRD', 'EMP-110', 'normal', 'BUD-2610-CHEM', 'draft', 28400],
    ['PR-2609-018', '2026-09-24 09:00', 'CHM-DET-01', 600, '2026-10-01', L('Stok bulanan detergen', 'Monthly detergent stock'), 'OPS', 'CC-PRD', 'EMP-110', 'normal', 'BUD-2609-CHEM', 'converted', 36500],
    ['PR-2609-019', '2026-09-25 11:00', 'PKG-PLS-01', 6000, '2026-10-02', L('Stok kemasan bulanan', 'Monthly packaging stock'), 'OPS', 'CC-PRD', 'EMP-110', 'normal', 'BUD-2609-PKG', 'converted', 620]
  ];
  D.PR_RULES = [{ k: 'amount', lim: 10000000, by: 'finance', l: L('Nilai ≤ Rp 10 jt: Finance', 'Value ≤ Rp 10 m: Finance') }, { k: 'amount', lim: 50000000, by: 'owner', l: L('Nilai > Rp 10 jt: Owner', 'Value > Rp 10 m: Owner') }, { k: 'category', v: 'machine', by: 'owner', l: L('Kategori mesin / capex: selalu Owner', 'Machine / capex category: always Owner') }, { k: 'self', l: L('Pemohon tidak boleh menyetujui PR sendiri', 'A requester cannot approve their own PR') }];
  // RFQs: [id, at, prs, items [[item, qty]], suppliers, due, terms, status, quotes {sup: [unit price, lead days, term days, note]}]
  D.RFQS = [
    { id: 'RFQ-2610-001', at: '2026-10-04 13:00', prs: ['PR-2610-001'], items: [['CHM-ALK-01', 200]], sups: ['SUP-01', 'SUP-08', 'SUP-09'], due: '2026-10-06', terms: L('Franco Gudang Ubud, termasuk PPN', 'Delivered to the Ubud store, VAT included'), st: 'quoted',
      quotes: { 'SUP-01': [31200, 5, 30, ''], 'SUP-08': [29800, 9, 45, L('Minimum order 300 L', 'Minimum order 300 L')], 'SUP-09': [27500, 2, 14, L('Merek lokal, belum pernah dipakai', 'Local brand, never used before')] } },
    { id: 'RFQ-2609-007', at: '2026-09-24 14:00', prs: ['PR-2609-018'], items: [['CHM-DET-01', 600]], sups: ['SUP-01', 'SUP-08'], due: '2026-09-26', terms: L('Franco Gudang Ubud', 'Delivered to the Ubud store'), st: 'awarded', award: 'SUP-01', awardWhy: L('Harga sama, lead time lebih cepat, kualitas terbukti', 'Same price, faster lead time, proven quality'),
      quotes: { 'SUP-01': [36500, 5, 30, ''], 'SUP-08': [36900, 9, 45, ''] } }
  ];
  // POs: [id, at, supplier, lines [[item, qty, price]], tax %, delivery, terms, cc, approver, status, received lines qty, rfq]
  D.POS = [
    { id: 'PO-2609-011', at: '2026-09-26 10:00', sup: 'SUP-01', lines: [['CHM-DET-01', 600, 36500], ['CHM-SFT-01', 200, 28400], ['CHM-BLC-01', 60, 24600]], tax: 11, dlv: '2026-10-01', terms: 30, cc: 'CC-PRD', appr: 'EMP-050', st: 'received', rcv: [600, 200, 60], rfq: 'RFQ-2609-007', pr: 'PR-2609-018' },
    { id: 'PO-2609-014', at: '2026-09-27 15:00', sup: 'SUP-04', lines: [['SPR-BRG-01', 2, 1450000], ['SPR-BLT-01', 4, 385000], ['SPR-SEL-01', 2, 920000], ['SPR-SNS-01', 4, 2850000]], tax: 11, dlv: '2026-09-30', terms: 30, cc: 'CC-MNT', appr: 'EMP-050', st: 'partial', rcv: [2, 4, 2, 1], pr: null },
    { id: 'PO-2610-002', at: '2026-09-29 09:00', sup: 'SUP-03', lines: [['PKG-PLS-01', 6000, 620], ['PKG-LBL-01', 20, 48000], ['PKG-TAG-01', 2000, 120]], tax: 11, dlv: '2026-10-02', terms: 30, cc: 'CC-PRD', appr: 'EMP-030', st: 'partial', rcv: [6000, 20, 0], pr: 'PR-2609-019' },
    { id: 'PO-2610-003', at: '2026-10-05 16:00', sup: 'SUP-11', lines: [['CAPEX-DRY-50', 1, 285000000]], tax: 11, dlv: '2026-11-20', terms: 30, cc: 'CC-PRD', appr: null, st: 'draft', rcv: [0], pr: null, capex: true, note: L('Dryer 50 kg pengganti D-03. Menunggu keputusan Owner dari skenario CFO-005.', '50 kg dryer replacing D-03. Waiting for the Owner decision from scenario CFO-005.') }
  ];
  // Receipts: [id, at, po, lines qty, by, note]
  D.GRNS = [['GRN-2609-019', '2026-10-01 10:20', 'PO-2609-011', [600, 200, 60], 'EMP-110', ''], ['GRN-2609-021', '2026-09-30 15:10', 'PO-2609-014', [2, 4, 2, 1], 'EMP-110', L('Sensor baru datang 1 dari 4', 'Only 1 of 4 sensors arrived')], ['GRN-2610-002', '2026-10-02 14:30', 'PO-2610-002', [6000, 20, 0], 'EMP-110', L('Tag seragam menyusul', 'Uniform tags to follow')],
    ['GRN-2608-030', '2026-09-01 09:00', 'PO-2608-022', null, 'EMP-110', '']];
  // Supplier price history (§50): [supplier, item, date, price]
  D.PRICE_LOG = [['SUP-01', 'CHM-DET-01', '2025-10-01', 33200], ['SUP-01', 'CHM-DET-01', '2026-04-01', 34800], ['SUP-01', 'CHM-DET-01', '2026-09-26', 36500], ['SUP-01', 'CHM-SFT-01', '2026-04-01', 26900], ['SUP-01', 'CHM-SFT-01', '2026-09-26', 28400],
    ['SUP-01', 'CHM-BLC-01', '2026-04-01', 23800], ['SUP-01', 'CHM-BLC-01', '2026-09-26', 24600], ['SUP-08', 'CHM-STN-01', '2026-03-12', 92000], ['SUP-08', 'CHM-STN-01', '2026-08-20', 96000], ['SUP-03', 'PKG-PLS-01', '2026-01-15', 580], ['SUP-03', 'PKG-PLS-01', '2026-09-29', 620],
    ['SUP-04', 'SPR-SNS-01', '2025-11-02', 2600000], ['SUP-04', 'SPR-SNS-01', '2026-09-27', 2850000]];
  D.SUP_PERF = { 'SUP-01': [46, 44, 1], 'SUP-02': [18, 16, 1], 'SUP-03': [22, 22, 0], 'SUP-04': [14, 10, 2], 'SUP-08': [9, 7, 0], 'SUP-09': [12, 12, 2] };   // [orders 12m, on time, quality issues]

  /* ---------- NP-10 asset register (§53–§57) ---------- */
  // [code, name id, en, category, brand, serial, acquired, cost JT, life months, residual %, location, user, vendor, warranty until, status, machine/vehicle link, energy kWh per cycle or km/L]
  D.ASSETS = [
    ['AST-W01', 'Washer Extractor 60 kg', 'Washer Extractor 60 kg', 'machine', 'Electrolux W5600', 'EX60-21-0391', '2021-03-15', 420, 120, 10, 'PL-01', 'EMP-102', 'SUP-11', '2024-03-15', 'active', 'W-01', 4.8],
    ['AST-W02', 'Washer Extractor 60 kg', 'Washer Extractor 60 kg', 'machine', 'Electrolux W5600', 'EX60-21-0392', '2021-03-15', 420, 120, 10, 'PL-01', 'EMP-102', 'SUP-11', '2024-03-15', 'active', 'W-02', 4.9],
    ['AST-W03', 'Washer Extractor 30 kg', 'Washer Extractor 30 kg', 'machine', 'Girbau HS-6032', 'GB30-19-1177', '2019-06-10', 210, 96, 10, 'PL-01', 'EMP-102', 'SUP-11', '2021-06-10', 'active', 'W-03', 3.6],
    ['AST-W04', 'Washer Extractor 100 kg', 'Washer Extractor 100 kg', 'machine', 'Electrolux W5850', 'EX100-23-0088', '2023-08-01', 780, 120, 10, 'PL-01', 'EMP-102', 'SUP-11', '2026-08-01', 'maint', 'W-04', 7.1],
    ['AST-D01', 'Tumble Dryer 50 kg', 'Tumble Dryer 50 kg', 'machine', 'Electrolux T5550', 'TD50-21-0510', '2021-03-15', 260, 96, 10, 'PL-01', 'EMP-102', 'SUP-11', '2023-03-15', 'active', 'D-01', 9.2],
    ['AST-D02', 'Tumble Dryer 50 kg', 'Tumble Dryer 50 kg', 'machine', 'Electrolux T5550', 'TD50-21-0511', '2021-03-15', 260, 96, 10, 'PL-01', 'EMP-102', 'SUP-11', '2023-03-15', 'active', 'D-02', 9.4],
    ['AST-D03', 'Tumble Dryer 30 kg', 'Tumble Dryer 30 kg', 'machine', 'Speed Queen ST030', 'SQ30-18-2201', '2018-02-01', 150, 96, 10, 'PL-01', 'EMP-102', 'SUP-11', '2019-02-01', 'repair', 'D-03', 8.6],
    ['AST-D04', 'Tumble Dryer 80 kg', 'Tumble Dryer 80 kg', 'machine', 'Electrolux T5800', 'TD80-24-0031', '2024-05-01', 420, 96, 10, 'PL-01', 'EMP-102', 'SUP-11', '2027-05-01', 'active', 'D-04', 12.4],
    ['AST-D05', 'Tumble Dryer 50 kg', 'Tumble Dryer 50 kg', 'machine', 'Girbau ED660', 'GBD50-19-0420', '2019-09-01', 240, 96, 10, 'PL-01', 'EMP-102', 'SUP-11', '2021-09-01', 'idle', 'D-05', 11.8],
    ['AST-FL01', 'Flatwork Ironer Line 1', 'Flatwork Ironer Line 1', 'machine', 'Kannegiesser HPM', 'KG-FL-22-071', '2022-01-10', 950, 120, 10, 'PL-01', 'EMP-102', 'SUP-11', '2025-01-10', 'active', 'FL-01', 18.5],
    ['AST-FL02', 'Meja Press & Lipat', 'Press & Fold Station', 'machine', 'Trevil Pantamatic', 'TV-PF-22-118', '2022-01-10', 120, 96, 10, 'PL-01', 'EMP-102', 'SUP-11', '2024-01-10', 'active', 'FL-02', 1.2],
    ['AST-IR01', 'Steam Iron 1', 'Steam Iron 1', 'machine', 'Silter SPR', 'SL-IR-23-401', '2023-02-01', 18, 60, 0, 'PL-01', 'EMP-102', 'SUP-11', '2024-02-01', 'active', 'IR-01', 0.6],
    ['AST-IR02', 'Steam Iron 2', 'Steam Iron 2', 'machine', 'Silter SPR', 'SL-IR-23-402', '2023-02-01', 18, 60, 0, 'PL-01', 'EMP-102', 'SUP-11', '2024-02-01', 'active', 'IR-02', 0.6],
    ['AST-BL01', 'Boiler Uap 300 kg/jam', 'Steam Boiler 300 kg/h', 'machine', 'Miura EH-300', 'MR-BL-21-055', '2021-03-15', 380, 120, 10, 'PL-01', 'EMP-102', 'SUP-11', '2023-03-15', 'active', 'BL-01', 0],
    ['AST-WF01', 'Water Filter & Softener', 'Water Filter & Softener', 'machine', 'Pentair Fleck', 'PF-WF-21-310', '2021-03-15', 95, 96, 10, 'PL-01', 'EMP-102', 'SUP-11', '2022-03-15', 'active', 'WF-01', 0],
    ['AST-IP01', 'IPAL', 'Wastewater Treatment (IPAL)', 'machine', 'BioFil IP-30', 'BF-IP-21-009', '2021-03-15', 310, 120, 10, 'PL-01', 'EMP-102', 'SUP-11', '2023-03-15', 'active', 'IP-01', 0],
    ['AST-JF01', 'Van JF-01 (DK 1234 AB)', 'Van JF-01 (DK 1234 AB)', 'vehicle', 'Toyota HiAce', 'MHF-22-01843', '2022-04-01', 360, 60, 20, 'PL-01', 'EMP-002', 'Auto2000', '2025-04-01', 'active', 'JF-01', 9.5],
    ['AST-JF02', 'Van JF-02 (DK 5678 CD)', 'Van JF-02 (DK 5678 CD)', 'vehicle', 'Toyota HiAce', 'MHF-21-00912', '2021-07-01', 340, 60, 20, 'PL-01', 'EMP-063', 'Auto2000', '2024-07-01', 'repair', 'JF-02', 8.8],
    ['AST-JF03', 'Pickup JF-03 (DK 9012 EF)', 'Pickup JF-03 (DK 9012 EF)', 'vehicle', 'Mitsubishi L300', 'MMB-23-04411', '2023-01-01', 240, 60, 20, 'PL-01', 'EMP-082', 'Bumen Redja', '2026-01-01', 'active', 'JF-03', 10.2],
    ['AST-JF04', 'Pickup JF-04 (DK 3456 GH)', 'Pickup JF-04 (DK 3456 GH)', 'vehicle', 'Suzuki Carry', 'MHY-24-00377', '2024-03-01', 210, 60, 20, 'PL-02', 'EMP-002', 'Suzuki Sanur', '2027-03-01', 'active', 'JF-04', 12.0],
    ['AST-JF05', 'Van JF-05 (DK 7788 IJ)', 'Van JF-05 (DK 7788 IJ)', 'vehicle', 'Daihatsu Gran Max', 'MHK-19-02210', '2019-11-01', 300, 60, 20, 'PL-01', 'EMP-002', 'Astra Daihatsu', '2022-11-01', 'idle', 'JF-05', 8.1],
    ['AST-REN01', 'Renovasi Plant Ubud', 'Ubud Plant Leasehold', 'building', '—', '—', '2021-03-01', 900, 120, 0, 'PL-01', 'EMP-050', 'CV Karya Bali', null, 'active', null, null],
    ['AST-REN02', 'Renovasi Plant Gianyar', 'Gianyar Plant Leasehold', 'building', '—', '—', '2022-06-01', 650, 120, 0, 'PL-02', 'EMP-050', 'CV Karya Bali', null, 'active', null, null],
    ['AST-EQ01', 'Rak & Troli Linen', 'Linen Racks & Trolleys', 'equipment', 'Lokal', '—', '2022-06-01', 85, 60, 0, 'PL-02', 'EMP-021', 'UD Logam Jaya', null, 'active', null, null],
    ['AST-IT01', 'Komputer, Tablet & Server', 'Computers, Tablets & Server', 'it', 'Lenovo / Apple', 'IT-24-001', '2024-01-01', 120, 48, 0, 'HO', 'EMP-030', 'Bhinneka', '2026-01-01', 'active', null, null],
    ['AST-EQ02', 'Timbangan Digital (6 unit)', 'Digital Scales (6 units)', 'equipment', 'Mettler Toledo', 'MT-23-0660', '2023-05-01', 36, 60, 0, 'PL-01', 'EMP-021', 'Mettler Indonesia', '2025-05-01', 'active', null, null]
  ];
  D.AST_CATS = { machine: [L('Mesin produksi', 'Production machine'), '1510'], vehicle: [L('Kendaraan', 'Vehicle'), '1520'], building: [L('Renovasi bangunan', 'Leasehold improvement'), '1530'], equipment: [L('Peralatan', 'Equipment'), '1530'], it: [L('IT', 'IT'), '1530'] };
  // Asset events (transfer, status changes) with history (§54).
  D.AST_EVENTS = [['AST-JF04', '2025-02-10', 'transfer', 'PL-01', 'PL-02', 'EMP-030', L('Pindah ke Plant Gianyar untuk rute timur', 'Moved to the Gianyar plant for the east route')], ['AST-D05', '2026-08-21', 'status', 'active', 'idle', 'EMP-102', L('Pemanas lemah, menunggu keputusan perbaikan', 'Weak heater, waiting for a repair decision')],
    ['AST-D03', '2026-10-06', 'status', 'active', 'repair', 'EMP-102', L('Error sensor kelembapan (WO-2610-01)', 'Moisture sensor error (WO-2610-01)')]];
  // Maintenance spend per machine, last 12 months (Rp juta), read with Phase 8 work orders. Replacement price today (Rp juta).
  D.AST_MNT = { 'W-01': 6.2, 'W-02': 9.8, 'W-03': 14.5, 'W-04': 3.1, 'D-01': 7.4, 'D-02': 8.9, 'D-03': 21.6, 'D-04': 1.2, 'D-05': 18.3, 'FL-01': 12.0, 'FL-02': 2.1, 'BL-01': 9.4, 'JF-01': 8.2, 'JF-02': 16.8, 'JF-03': 5.1, 'JF-04': 2.4, 'JF-05': 19.5 };
  D.AST_REPL = { 'W-01': 465, 'W-02': 465, 'W-03': 240, 'W-04': 820, 'D-01': 285, 'D-02': 285, 'D-03': 285, 'D-04': 445, 'D-05': 285, 'FL-01': 1050, 'FL-02': 135, 'BL-01': 420, 'JF-01': 410, 'JF-02': 410, 'JF-03': 270, 'JF-04': 230, 'JF-05': 380 };
  // Utilisation and cycles over the last 30 days from Phase 8 history (the live status is read from Phase 8).
  D.AST_USE = { 'W-01': [78, 342], 'W-02': [74, 318], 'W-03': [61, 270], 'W-04': [69, 188], 'D-01': [83, 410], 'D-02': [86, 422], 'D-03': [58, 251], 'D-04': [88, 365], 'D-05': [12, 40], 'FL-01': [91, 0], 'FL-02': [72, 0], 'BL-01': [80, 0] };

  /* ---------- NP-11 budget 2026 (§58–§60), Rp juta per month ---------- */
  // [key, label, kind ('rev' | 'cost' | 'profit' | 'capex'), cost centre, accounts, monthly budget Apr..Dec]
  D.BUDGET = [
    ['revenue', L('Pendapatan', 'Revenue'), 'rev', null, ['4100', '4200', '4300', '4400', '4500', '4900'], [1450, 1480, 1510, 1540, 1580, 1620, 1650, 1680, 1720]],
    ['chemical', L('Bahan kimia & kemasan', 'Chemicals & packaging'), 'cost', 'CC-PRD', ['5100', '5200'], [96, 97, 99, 101, 103, 104, 106, 108, 110]],
    ['utilities', L('Utilitas', 'Utilities'), 'cost', 'CC-PRD', ['5400'], [116, 117, 119, 120, 121, 122, 124, 125, 127]],
    ['payroll', L('Payroll', 'Payroll'), 'cost', null, ['5300', '6100'], [505, 512, 518, 524, 528, 532, 538, 545, 552]],
    ['maintenance', L('Maintenance', 'Maintenance'), 'cost', 'CC-MNT', ['6400'], [38, 38, 40, 40, 40, 40, 42, 42, 42]],
    ['delivery', L('Delivery', 'Delivery'), 'cost', 'CC-LOG', ['5500'], [82, 83, 85, 86, 87, 92, 94, 96, 98]],
    ['marketing', L('Marketing', 'Marketing'), 'cost', 'CC-SLS', ['6500'], [20, 20, 22, 24, 24, 25, 25, 25, 30]],
    ['overhead', L('Sewa, admin & lainnya', 'Rent, admin & other'), 'cost', 'CC-ADM', ['6200', '6300', '6600', '6900', '5900'], [210, 212, 214, 222, 215, 236, 238, 240, 242]],
    ['capex', L('Capex', 'Capex'), 'capex', null, ['1510', '1520', '1530'], [0, 0, 120, 0, 0, 0, 300, 0, 0]],
    ['netprofit', L('Laba bersih', 'Net profit'), 'profit', null, null, [250, 258, 262, 268, 285, 300, 305, 312, 320]]
  ];
  D.BUD_MONTHS = ['2026-04', '2026-05', '2026-06', '2026-07', '2026-08', '2026-09', '2026-10', '2026-11', '2026-12'];
  D.BUD_CFG = { good: -2, ontrack: 2, watch: 5, over: 10, v: 1, eff: '2026-01-01' };   // cost variance % thresholds; revenue uses the mirrored sign
  D.BUD_HIST = [['2026-07-02', 'EMP-050', 'capex', '2026-10', 0, 300, L('Cadangan dryer tambahan Q4', 'Reserve for an additional dryer in Q4')]];

  /* ---------- Bank statement BCA Operasional, 1–5 Oct (§61) ---------- */
  // [id, date, description, amount (+in/−out) JT, matched system ref or null]
  D.BANK_STMT = [
    ['BS-01', '2026-10-01', 'TRF KE 7720041899 PETTY', -5, 'CT-2610-001'], ['BS-02', '2026-10-02', 'TRF MASUK JAENS SPA INDONESIA', 236, 'PAY-2610-001'], ['BS-03', '2026-10-02', 'SETORAN TUNAI', 6.2, 'CT-2610-004'],
    ['BS-04', '2026-10-03', 'BIAYA ADM', -0.12, 'CT-2610-005'], ['BS-05', '2026-10-03', 'TRF MASUK PONDOK IMPIAN', 25, 'PAY-2610-002'], ['BS-06', '2026-10-04', 'DEBET OTOMATIS TELKOM', -1.85, null],
    ['BS-07', '2026-10-05', 'TRF MASUK KAYANA RESORT', 92, 'PAY-2610-004'], ['BS-08', '2026-10-05', 'TRF MASUK OCEANVIEW', 20.5, 'PAY-2610-003'], ['BS-09', '2026-10-05', 'BUNGA JASA GIRO', 0.41, null]
  ];
  D.RECON_OTHER = [
    ['cash', 'ACC-05', L('Kas Main Plant Ubud (hitung fisik)', 'Cash Main Plant Ubud (physical count)'), j(18.5), '2026-10-05', 'EMP-021', 'matched'],
    ['petty', 'ACC-07', L('Petty cash (hitung fisik)', 'Petty cash (physical count)'), j(6.4), '2026-10-02', 'EMP-030', 'review']
  ];

  /* ---------- Monthly close September (§63) ---------- */
  D.CLOSE_SEP = { bank: ['done', 'EMP-030', '2026-10-02'], ar: ['done', 'EMP-030', '2026-10-03'], ap: ['done', 'EMP-030', '2026-10-03'], inv: ['open'], dep: ['done', 'EMP-030', '2026-10-01'], accrual: ['open'], pl: ['open'], bs: ['open'] };

  /* ---------- NP-12 ratio thresholds (§69), versioned and effective-dated ---------- */
  // [ratio, version, effective, target, watch, critical, direction, context note]
  D.RATIO_TH = [
    ['current', 1, '2026-01-01', 2.0, 1.5, 1.2, 'higher'], ['quick', 1, '2026-01-01', 1.5, 1.1, 0.8, 'higher'], ['cash', 1, '2026-01-01', 1.0, 0.5, 0.3, 'higher'],
    ['ocf', 1, '2026-01-01', 1.0, 0.6, 0.3, 'higher'], ['runway', 1, '2026-01-01', 3.0, 2.0, 1.0, 'higher'], ['gpm', 1, '2026-01-01', 55, 50, 45, 'higher'],
    ['npm', 1, '2026-01-01', 18, 14, 10, 'higher'], ['dso', 1, '2026-01-01', 40, 50, 60, 'lower'], ['dso', 2, '2026-07-01', 35, 45, 55, 'lower', L('Klien hotel termin 30 hari: target DSO diperketat', 'Hotel clients on 30-day terms: DSO target tightened')],
    ['ccc', 1, '2026-01-01', 30, 45, 60, 'lower'], ['de', 1, '2026-01-01', 0.8, 1.5, 2.0, 'lower'], ['roi', 1, '2026-01-01', 25, 15, 8, 'higher'], ['mos', 1, '2026-01-01', 30, 20, 10, 'higher']
  ];
  D.RATIO_DEF = { de: 'liab', runway: 'gross' };   // §68 one configured definition: D/E uses total liabilities; runway uses gross operating cash out
  // Decision model weights (§70–§76), versioned. Health dims follow the Phase 5 weighting rule (total 100).
  D.MODELS = [
    { k: 'health', v: 1, eff: '2026-01-01', w: [['liq', 20], ['prof', 20], ['cf', 20], ['wc', 15], ['solv', 10], ['ret', 10], ['grow', 5]] },
    { k: 'branch', v: 1, eff: '2026-01-01', w: [['fin', 40], ['mkt', 20], ['cap', 20], ['ops', 10], ['risk', 10]] },
    { k: 'sales', v: 1, eff: '2026-01-01', w: [['pipe', 30], ['fu', 25], ['conv', 20], ['revp', 15], ['mgn', 10]] },
    { k: 'machine', v: 1, eff: '2026-01-01', w: [['cap', 30], ['dem', 20], ['roi', 20], ['sla', 15], ['dt', 15]] }
  ];
  // Market inputs not in any system yet (entered by management, dated, shown as assumptions).
  D.MARKET = { sanurDemand: [68, '2026-09-15', 'EMP-040', L('Survei 22 villa & hotel Sanur: 15 tertarik, 6 sedang kontrak laundry lain', 'Survey of 22 Sanur villas & hotels: 15 interested, 6 under another laundry contract')], compRate: [8200, '2026-08-30', 'EMP-040', L('Harga pesaing linen hotel Ubud (rata-rata 3 pesaing)', 'Competitor hotel linen price in Ubud (average of 3 competitors)')],
    salesCapacity: [26, '2026-10-01', 'EMP-040', L('Maks follow-up aktif per sales per bulan', 'Max active follow-ups per salesperson per month')], salesTeam: 1, opsHeadcount: { wash: 8, dry: 4, fin: 10, pack: 6 }, overtime: { wash: 18, dry: 6, fin: 52, pack: 14 } };
  // Investment scenarios (§83–§84). Inputs only; every output is computed.
  D.SCENARIOS = [
    { id: 'SCN-01', n: L('Tambah 1 Dryer 50 kg', 'Add one 50 kg dryer'), by: 'EMP-050', at: '2026-10-05 09:00', inp: { capex: 285, capKg: 1250, labor: 0, maint: 0.8, vol: 0.55, price: 8300, life: 96, fin: 'cash', rate: 0, start: '2026-12-01', energy: 3.1 } },
    { id: 'SCN-02', n: L('Dryer 80 kg dengan leasing', '80 kg dryer on lease'), by: 'EMP-030', at: '2026-10-05 10:30', inp: { capex: 445, capKg: 2000, labor: 4.5, maint: 1.0, vol: 0.5, price: 8300, life: 96, fin: 'lease', rate: 11, start: '2027-01-01', energy: 4.6 } },
    { id: 'SCN-03', n: L('Buka cabang Sanur', 'Open a Sanur branch'), by: 'EMP-050', at: '2026-10-05 14:00', inp: { capex: 1850, capKg: 4500, labor: 62, maint: 4, vol: 0.35, price: 8400, life: 120, fin: 'loan', rate: 10.5, start: '2027-04-01', energy: 16, ovh: 55 } }
  ];
  D.LOAN = { bal: j(650), rate: 10, inst: j(24.5), bank: 'Bank Mandiri', purpose: L('Pembiayaan W-04 dan renovasi Gianyar', 'Financing W-04 and the Gianyar leasehold') };
  D.BS_TARGET = { prepaid: j(182), tax2210: j(52), tax2220: j(22), payroll: j(28), accrual: j(0), capital: j(1500) };

  if (typeof module !== 'undefined' && module.exports) module.exports = D;
  else root.JFFIN_DATA = D;
})(typeof window !== 'undefined' ? window : this);
