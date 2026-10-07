/* ==========================================================================
   JFRESH OS — Business Support, Finance, Costing & Scale-Up engine
   (Phase 10 · NP 1.0) · part 1 of 4: the accounting core.
   Chart of accounts, periods with controlled close, the journal engine
   (every journal balances, posted journals are never edited: corrections are
   reversals or adjustments), the ledger and reports, drill-down from every
   journal to its source (§6), cash accounts, cash transactions, treasury and
   the cash forecast (NP-02), Billing Ready → invoice → payment → collection
   with AR aging (NP-03), and expenses, supplier invoices, AP, payment control
   with duplicate prevention (NP-04).

   Enter once, use everywhere: Billing Ready comes from Phase 9 (JFDLV),
   clients, properties, contracts, rate cards and payment terms from Phase 6
   (JFCOMM), the Apr–Sep P&L and the cash balances from Phase 5. The other
   parts extend the same object: jfos-fin-cost.js (HPP, item master, pricing,
   profitability), jfos-fin-sup.js (inventory, purchasing, assets) and
   jfos-fin-cfo.js (budget, reconciliation, close, ratios, health score,
   scale-up decisions, scenarios, screens, install). One engine for the app,
   the Phase 10 pages and the tests. Every protected action checks the
   permission first and writes an audit entry (§98). Prototype only: a
   production backend must repeat these rules on the server (§99).
   ========================================================================== */
(function (root) {
  function req(p) { try { return typeof require !== 'undefined' ? require(p) : null; } catch (e) { return null; } }
  var D = root.JFFIN_DATA || req('./jfos-fin-data.js');
  var PD = root.JFPERF_DATA || req('./jfos-perf-data.js');
  var DL = root.JFDLV || req('./jfos-dlv.js');
  var CM = root.JFCOMM || (DL && DL.CM) || req('./jfos-comm.js');
  var LG = root.JFLOG || (DL && DL.LG) || req('./jfos-logi.js');
  var PR = root.JFPROD || (DL && DL.PR) || req('./jfos-prod.js');
  function L(a, b) { return [a, b === undefined ? a : b]; }
  var M = { version: 'NP 1.0', D: D, PD: PD, DL: DL, CM: CM, LG: LG, PR: PR, P: null, X: null, _seed: [], _post: [], _ext: {} };
  var DAY = 864e5, JT = 1e6;
  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  function sum(a) { return a.reduce(function (s, x) { return s + (+x || 0); }, 0); }
  function r0(x) { return Math.round(x); }
  function r1(x) { return Math.round(x * 10) / 10; }
  function r2(x) { return Math.round(x * 100) / 100; }
  function pct(a, b) { return b ? Math.round(a / b * 1000) / 10 : null; }
  function by(arr, k, v) { for (var i = 0; i < arr.length; i++) if (arr[i][k] === v) return arr[i]; return null; }
  function T(x) { return Array.isArray(x) ? x[0] : (x == null ? '' : String(x)); }
  function ms(s) { if (typeof s === 'number') return s; var p = String(s).split(/[-: T]/); return Date.UTC(+p[0], +p[1] - 1, +(p[2] || 1), +(p[3] || 0), +(p[4] || 0), +(p[5] || 0)); }
  function iso(t) { return new Date(t).toISOString().slice(0, 10); }
  function isoT(t) { return new Date(t).toISOString().slice(0, 16).replace('T', ' '); }
  function addDays(d, n) { return iso(ms(d) + n * DAY); }
  function dayDiff(a, b) { return Math.round((ms(String(b).slice(0, 10)) - ms(String(a).slice(0, 10))) / DAY); }
  function ym(d) { return String(d).slice(0, 7); }
  function mEnd(p) { var x = p.split('-'); return iso(Date.UTC(+x[0], +x[1], 0)); }
  function mAdd(p, n) { var x = p.split('-'), d = new Date(Date.UTC(+x[0], +x[1] - 1 + n, 1)); return d.toISOString().slice(0, 7); }
  function str(x) { return String(x == null ? '' : x).trim(); }
  function num(x) { if (x === '' || x == null) return null; var n = Number(String(x).replace(/\s/g, '').replace(',', '.')); return isNaN(n) ? NaN : n; }
  M.u = { L: L, T: T, sum: sum, r0: r0, r1: r1, r2: r2, pct: pct, by: by, ms: ms, iso: iso, isoT: isoT, addDays: addDays, dayDiff: dayDiff, ym: ym, mEnd: mEnd, mAdd: mAdd, clone: clone, str: str, num: num };
  M.TODAY = D.today; M.JT = JT; M.ms = ms; M.iso = iso; M.isoT = isoT; M.addDays = addDays; M.dayDiff = dayDiff; M.ym = ym; M.mEnd = mEnd; M.mAdd = mAdd;

  M.MSG = {
    noperm: L('Anda tidak memiliki izin untuk tindakan ini.', 'You do not have permission for this action.'),
    notfound: L('Data tidak ditemukan.', 'Record not found.'),
    invalid: L('Periksa data dan coba lagi.', 'Check the data and try again.'),
    reason: L('Alasan wajib diisi.', 'A reason is required.'),
    unbal: L('Jurnal tidak seimbang. Debit harus sama dengan kredit.', 'The journal does not balance. Debit must equal credit.'),
    closed: L('Periode sudah ditutup. Gunakan jurnal penyesuaian atau koreksi periode berikutnya.', 'The period is closed. Use an adjustment or a next-period correction.'),
    soft: L('Periode soft close: hanya Finance dengan alasan yang boleh membukukan.', 'The period is soft-closed: only Finance with a reason may post.'),
    posted: L('Jurnal yang sudah diposting tidak bisa diubah. Buat jurnal balik.', 'A posted journal cannot be changed. Create a reversal.'),
    jump: L('Langkah ini belum bisa dilakukan. Ikuti urutan proses.', 'This step is not possible yet. Follow the process order.'),
    maker: L('Pembuat tidak boleh menyetujui dokumennya sendiri.', 'The maker cannot approve their own document.'),
    dup: L('Kemungkinan pembayaran ganda. Periksa sebelum melanjutkan.', 'Possible duplicate payment. Check before continuing.'),
    over: L('Nilai melebihi sisa tagihan.', 'The amount exceeds the open balance.'),
    funds: L('Saldo rekening tidak cukup.', 'Insufficient account balance.'),
    sync: L('Data keuangan belum sinkron. Coba Lagi.', 'Finance data is not in sync yet. Try Again.')
  };

  /* ---------- Permissions (§2, §99): role decides the workspace, permission decides the action ---------- */
  M.PERMS = {
    'fin.gl.view': L('Lihat COA, jurnal dan laporan keuangan', 'View the COA, journals and financial reports'), 'fin.gl.post': L('Buat & posting jurnal', 'Create & post journals'),
    'fin.gl.reverse': L('Jurnal balik & penyesuaian', 'Reversals & adjustments'), 'fin.period': L('Soft close & kunci periode', 'Soft close & lock periods'), 'fin.close': L('CLOSE PERIOD', 'CLOSE PERIOD'),
    'cash.view': L('Lihat kas, bank & treasury', 'View cash, bank & treasury'), 'cash.tx': L('Catat transaksi kas', 'Record cash transactions'), 'cash.approve': L('Setujui transaksi kas besar', 'Approve large cash transactions'),
    'ar.view': L('Lihat billing, invoice & AR', 'View billing, invoices & AR'), 'ar.build': L('Buat draft invoice dari Billing Ready', 'Build draft invoices from Billing Ready'), 'ar.approve': L('Setujui invoice', 'Approve invoices'),
    'ar.issue': L('Terbitkan & batalkan invoice', 'Issue & cancel invoices'), 'ar.pay': L('Catat pembayaran klien', 'Record client payments'), 'ar.collect': L('Kelola collection', 'Manage collection'),
    'ap.view': L('Lihat biaya & AP', 'View expenses & AP'), 'ap.enter': L('Input biaya & invoice supplier', 'Enter expenses & supplier invoices'), 'ap.verify': L('Verifikasi & three-way match', 'Verify & three-way match'),
    'ap.approve': L('Setujui biaya / AP', 'Approve expenses / AP'), 'ap.pay': L('Jadwalkan & bayar AP', 'Schedule & pay AP'), 'ap.override': L('Override peringatan pembayaran ganda', 'Override the duplicate payment warning'),
    'hpp.view': L('Lihat HPP & komposisinya', 'View HPP & its composition'), 'hpp.calc': L('Hitung & simpan versi HPP', 'Calculate & store HPP versions'),
    'item.view': L('Lihat item master & berat standar', 'View the item master & standard weights'), 'item.edit': L('Ajukan perubahan berat / item', 'Propose weight / item changes'), 'item.approve': L('Setujui perubahan berat', 'Approve weight changes'),
    'price.view': L('Lihat harga, markup & margin', 'View prices, markup & margin'), 'price.edit': L('Ubah harga master (versi baru)', 'Change master prices (new version)'), 'price.scn': L('Simulasi harga', 'Price simulation'),
    'prof.client': L('Lihat profitabilitas klien', 'View client profitability'),
    'inv.view': L('Lihat persediaan', 'View inventory'), 'inv.move': L('Catat mutasi stok', 'Record stock movements'), 'inv.adjust': L('Ajukan penyesuaian stok & opname', 'Request stock adjustments & stock counts'), 'inv.approve': L('Setujui penyesuaian stok', 'Approve stock adjustments'),
    'pur.view': L('Lihat purchasing', 'View purchasing'), 'pur.pr': L('Buat purchase request', 'Create purchase requests'), 'pur.approve': L('Setujui purchase request', 'Approve purchase requests'), 'pur.rfq': L('RFQ & perbandingan supplier', 'RFQ & supplier comparison'),
    'pur.po': L('Buat & kirim PO', 'Create & send POs'), 'pur.po.approve': L('Setujui PO', 'Approve POs'), 'pur.rcv': L('Terima barang (receiving)', 'Receive goods'), 'sup.view': L('Lihat supplier', 'View suppliers'), 'sup.edit': L('Kelola supplier', 'Manage suppliers'),
    'ast.view': L('Lihat register aset', 'View the asset register'), 'ast.edit': L('Tambah, transfer & ubah status aset', 'Add, transfer & change asset status'), 'ast.dep': L('Posting penyusutan', 'Post depreciation'),
    'bud.view': L('Lihat budget', 'View budgets'), 'bud.edit': L('Ubah budget', 'Change budgets'), 'rec.do': L('Lakukan rekonsiliasi', 'Perform reconciliations'),
    'cfo.view': L('CFO dashboard, rasio & skor kesehatan', 'CFO dashboard, ratios & health score'), 'cfo.th': L('Ubah ambang rasio', 'Change ratio thresholds'), 'cfo.model': L('Ubah bobot model keputusan', 'Change decision model weights'),
    'cfo.scn': L('Buat skenario investasi', 'Create investment scenarios'), 'cfo.act': L('Jadikan rekomendasi keputusan & aksi', 'Turn recommendations into decisions & actions')
  };
  var FIN10 = ['fin.gl.view', 'fin.gl.post', 'fin.gl.reverse', 'fin.period', 'fin.close', 'cash.view', 'cash.tx', 'cash.approve', 'ar.view', 'ar.build', 'ar.approve', 'ar.issue', 'ar.pay', 'ar.collect',
    'ap.view', 'ap.enter', 'ap.verify', 'ap.approve', 'ap.pay', 'ap.override', 'hpp.view', 'hpp.calc', 'item.view', 'item.edit', 'price.view', 'price.scn', 'prof.client', 'inv.view', 'pur.view', 'pur.approve', 'pur.po.approve', 'sup.view',
    'ast.view', 'ast.dep', 'bud.view', 'bud.edit', 'rec.do', 'cfo.view', 'cfo.th', 'cfo.model', 'cfo.scn', 'cfo.act'];
  M.ROLE_PERMS = {
    finance: FIN10,
    owner: ['fin.gl.view', 'cash.view', 'ar.view', 'ar.approve', 'ap.view', 'ap.approve', 'hpp.view', 'item.view', 'item.approve', 'price.view', 'price.edit', 'price.scn', 'prof.client', 'inv.view', 'inv.approve', 'pur.view', 'pur.approve', 'pur.po.approve', 'sup.view',
      'ast.view', 'bud.view', 'bud.edit', 'cfo.view', 'cfo.th', 'cfo.model', 'cfo.scn', 'cfo.act'],
    supply: ['inv.view', 'inv.move', 'inv.adjust', 'pur.view', 'pur.pr', 'pur.rfq', 'pur.po', 'pur.rcv', 'sup.view', 'sup.edit', 'item.view'],
    assetadm: ['ast.view', 'ast.edit', 'inv.view', 'sup.view', 'pur.view'],
    opsmgr: ['hpp.view', 'item.view', 'item.edit', 'inv.view', 'inv.approve', 'pur.view', 'pur.pr', 'ast.view']
  };
  function can(ctx, p) { return !p || !!(ctx && ctx.perms && ctx.perms.indexOf(p) >= 0); }
  M.can = can;
  function empId(ctx) { return ctx && (ctx.employee ? ctx.employee.id : ctx.emp || ctx.uid) || 'system'; }
  M.empId = empId;
  function ctxName(ctx) { return ctx && (ctx.fullName || ctx.name) || 'Sistem JFRESH'; }

  /* ---------- Labels ---------- */
  M.TYPES = { asset: L('Aset', 'Assets'), liab: L('Liabilitas', 'Liabilities'), eq: L('Ekuitas', 'Equity'), rev: L('Pendapatan', 'Revenue'), cogs: L('HPP / COGS', 'COGS'), opex: L('Beban Operasional', 'Operating Expenses'), other: L('Lain-lain', 'Other'), tax: L('Pajak', 'Tax') };
  M.PER_ST = { open: [L('Open', 'Open'), 'ok'], soft: [L('Soft Close', 'Soft Close'), 'appr'], closed: [L('Closed', 'Closed'), 'info'], locked: [L('Locked', 'Locked'), 'mute'] };
  M.JV_ST = { draft: [L('Draft', 'Draft'), 'mute'], posted: [L('Posted', 'Posted'), 'ok'], reversed: [L('Reversed', 'Reversed'), 'warn'], adjust: [L('Adjustment', 'Adjustment'), 'appr'] };
  M.JV_SRC = { open: L('Saldo awal migrasi', 'Migration opening balance'), sum: L('Ringkasan bulanan migrasi', 'Monthly migration summary'), inv: L('Invoice', 'Invoice'), br: L('Billing Ready', 'Billing Ready'), pay: L('Pembayaran klien', 'Client payment'),
    ap: L('Invoice supplier / biaya', 'Supplier invoice / expense'), apay: L('Pembayaran AP', 'AP payment'), grn: L('Penerimaan barang', 'Goods receipt'), mv: L('Mutasi stok', 'Stock movement'), dep: L('Penyusutan', 'Depreciation'), cash: L('Transaksi kas', 'Cash transaction'),
    manual: L('Jurnal manual', 'Manual journal'), rev: L('Jurnal balik', 'Reversal'), adj: L('Penyesuaian', 'Adjustment'), ast: L('Aset', 'Asset') };
  M.CASH_TYPES = { petty: L('Petty Cash', 'Petty Cash'), ops: L('Kas Operasional', 'Operational Cash'), cashier: L('Kas Kasir', 'Cashier Cash'), bank: L('Rekening Bank', 'Bank Account'), payroll: L('Rekening Payroll', 'Payroll Account'), restricted: L('Rekening Dibatasi', 'Restricted Account') };
  M.TX_TYPES = { in: [L('Kas Masuk', 'Cash In'), 'ok', 'arrowdn'], out: [L('Kas Keluar', 'Cash Out'), 'crit', 'arrowup'], transfer: [L('Transfer', 'Transfer'), 'info', 'swap'], deposit: [L('Setoran', 'Deposit'), 'info', 'download'], withdraw: [L('Penarikan', 'Withdrawal'), 'warn', 'upload'], adjust: [L('Penyesuaian', 'Adjustment'), 'appr', 'edit'] };
  M.TX_ST = { pending: [L('Menunggu Persetujuan', 'Pending Approval'), 'appr'], posted: [L('Diposting', 'Posted'), 'ok'], rejected: [L('Ditolak', 'Rejected'), 'crit'] };
  M.INV_ST = { draft: [L('Draft', 'Draft'), 'mute'], review: [L('Review', 'Review'), 'appr'], approved: [L('Disetujui', 'Approved'), 'info'], issued: [L('Terbit', 'Issued'), 'info'], partial: [L('Dibayar Sebagian', 'Partial'), 'warn'],
    paid: [L('Lunas', 'Paid'), 'ok'], overdue: [L('Jatuh Tempo Lewat', 'Overdue'), 'crit'], cancelled: [L('Dibatalkan', 'Cancelled'), 'mute'] };
  M.BR_ST = { unbilled: [L('Siap Ditagih', 'Ready to Invoice'), 'appr'], drafted: [L('Di Draft Invoice', 'In Draft Invoice'), 'info'], invoiced: [L('Sudah Ditagih', 'Invoiced'), 'ok'] };
  M.AGING = [['current', L('Belum Jatuh Tempo', 'Current'), 'ok'], ['b30', L('1–30 hari', '1–30 days'), 'info'], ['b60', L('31–60 hari', '31–60 days'), 'warn'], ['b90', L('61–90 hari', '61–90 days'), 'crit'], ['b90p', L('> 90 hari', '> 90 days'), 'crit']];
  M.OUTCOME = { contacted: L('Sudah dihubungi', 'Contacted'), ptp: L('Janji bayar', 'Promise to pay'), partial: L('Bayar sebagian', 'Partial payment'), dispute: L('Sengketa', 'Dispute'), noreply: L('Tidak ada respon', 'No reply'), paid: L('Lunas', 'Paid') };
  M.EXP_ST = { received: [L('Diterima', 'Received'), 'appr'], verify: [L('Verifikasi', 'Verification'), 'appr'], approved: [L('Disetujui', 'Approved'), 'info'], scheduled: [L('Terjadwal', 'Scheduled'), 'info'], paid: [L('Lunas', 'Paid'), 'ok'],
    partial: [L('Dibayar Sebagian', 'Partial'), 'warn'], overdue: [L('Jatuh Tempo Lewat', 'Overdue'), 'crit'], hold: [L('Ditahan', 'Hold'), 'warn'], rejected: [L('Ditolak', 'Rejected'), 'mute'] };

  /* ---------- State ---------- */
  var KEY = 'jfos-fin-v1', mem = {}, st = null, T0 = Date.now(), SIM = ms(D.simNow), fixed = null, ver = 0;
  var ls = null;
  try { ls = root.localStorage || null; if (ls) { ls.setItem('__jff', '1'); ls.removeItem('__jff'); } } catch (e) { ls = null; }
  function clock() { if (fixed) return fixed(); if (LG && LG.now) return LG.now(); return SIM + (Date.now() - T0); }
  function S() {
    if (st) return st;
    try { var raw = ls ? ls.getItem(KEY) : mem[KEY]; if (raw) { var o = JSON.parse(raw); if (o && o.v === 1) { st = o; ver++; return st; } } } catch (e) {}
    seed(); save(); return st;
  }
  function save() { if (!st) return; ver++; st.upd = clock(); try { var s = JSON.stringify(st); if (ls) ls.setItem(KEY, s); else mem[KEY] = s; } catch (e) {} }
  M._reset = function () { SIM = ms(D.simNow); T0 = Date.now(); seed(); save(); };
  M._setClock = function (fn) { fixed = fn; };
  M.now = function () { S(); return clock(); };
  M.today = function () { return iso(M.now()); };
  M.state = function () { return S(); };
  M.save = save;
  M.cfg = function () { return S().cfg; };
  M.ver = function () { S(); return ver; };
  function nowS() { return isoT(M.now()); }
  function nid(k, pre, pad) { var n = S().seq[k]++; return pre + (pad ? String(n).padStart(pad, '0') : n); }
  M.nid = nid; M.nowS = nowS;

  function seed() {
    st = { v: 1, upd: null, audit: [], notifs: [], reads: {}, jv: [], cashTx: [], br: [], inv: [], pays: [], exp: [], apays: [], p9: {},
      periods: D.PERIODS.map(function (p) { return { p: p[0], st: p[1], note: p[2] || null, closedAt: (D.CLOSE_HIST[p[0]] || [])[0] || null, closedBy: (D.CLOSE_HIST[p[0]] || [])[1] || null, log: [] }; }),
      seq: { jv: 1, ct: 10, br: 1, inv: 5, pay: 1, exp: 12, apay: 2, nt: 1, ex: 1 },
      cfg: { arApprove: 50 * JT, apMaker: 10 * JT, cashApprove: 5 * JT, ppn: 11, dupDays: 7, coll: { worstDelay: 30, worstShare: 0.8, bestShare: 1, costBest: -0.05, costWorst: 0.08 } } };
    st.cashTx = D.CASH_TX.map(function (x) { return { id: x[0], date: x[1], type: x[2], acc: x[3], to: x[4], cat: x[5], amt: Math.round(x[6] * JT), ref: x[7], cc: x[8], pic: x[9], coa: x[10], note: x[11], ev: x[7], appr: x[9], st: 'posted', jv: null }; });
    st.exp = D.EXPENSES.map(function (x) { return { id: x[0], src: x[1], sup: x[2], sinv: x[3], date: x[4], cat: x[5], cc: x[6], plant: x[7], amt: Math.round(x[8] * JT), tax: Math.round(x[9] * JT), due: x[10], po: x[11], grn: x[12], st: x[13], coa: x[14], desc: x[15], paid: Math.round((x[16] || 0) * JT),
      by: x[1] === 'reimb' ? 'EMP-040' : 'EMP-030', appr: ['approved', 'scheduled', 'paid'].indexOf(x[13]) >= 0 ? 'EMP-050' : null, sched: x[13] === 'scheduled' ? { date: x[10], acc: 'ACC-01' } : null, jv: null, match: null, hold: null, ovr: null, log: [] }; });
    st.inv = D.INVOICES.map(function (x) {
      var cl = CM && CM.client(x[1]), total = Math.round(x[6] * JT), sub = Math.round(total / 1.11), ctr = CM && CM.contractsForProp ? (CM.contractsForProp(x[2], x[4])[0] || {}).no || null : null;
      return { id: x[0], cl: x[1], prop: x[2], period: x[3], issued: x[4], due: x[5], terms: cl && cl.terms || 30, ctr: ctr, po: null, mig: true,
        lines: [{ svc: null, desc: L('Layanan laundry periode ' + x[3] + ' (migrasi invoice lama)', 'Laundry services period ' + x[3] + ' (migrated invoice)'), qty: 1, unit: 'lot', rate: sub, amt: sub, br: null }],
        sub: sub, sur: 0, disc: 0, tax: total - sub, total: total, st: 'issued', by: 'EMP-030', appr: 'EMP-030', apprAt: x[4], docs: ['POD', 'Billing Ready'], jv: null, log: [] };
    });
    st.coll = clone(D.COLLECT);
    M._seed.forEach(function (fn) { fn(st); });
    buildLedger(st);
    M._post.forEach(function (fn) { fn(st); });
    ver++;
    return st;
  }

  /* ---------- Audit (§98) and notifications ---------- */
  M.AUDIT = { 'JOURNAL.POST': L('Jurnal diposting', 'Journal Posted'), 'JOURNAL.REVERSE': L('Jurnal dibalik', 'Journal Reversed'), 'INVOICE.APPROVE': L('Invoice disetujui', 'Invoice Approved'), 'INVOICE.ISSUE': L('Invoice diterbitkan', 'Invoice Issued'),
    'PAYMENT.RECORD': L('Pembayaran dicatat', 'Payment Recorded'), 'EXPENSE.APPROVE': L('Biaya disetujui', 'Expense Approved'), 'PAYMENT.APPROVE': L('Pembayaran disetujui', 'Payment Approved'), 'HPP.VERSION': L('Versi HPP dibuat', 'HPP Version Created'),
    'PRICE.CHANGE': L('Harga diubah', 'Price Changed'), 'STOCK.ADJUST': L('Stok disesuaikan', 'Stock Adjusted'), 'PR.APPROVE': L('PR disetujui', 'PR Approved'), 'SUPPLIER.SELECT': L('Supplier dipilih', 'Supplier Selected'), 'PO.APPROVE': L('PO disetujui', 'PO Approved'),
    'ASSET.ADD': L('Aset ditambahkan', 'Asset Added'), 'ASSET.TRANSFER': L('Aset dipindahkan', 'Asset Transferred'), 'DEPRECIATION.POST': L('Penyusutan diposting', 'Depreciation Posted'), 'BUDGET.CHANGE': L('Budget diubah', 'Budget Changed'),
    'RECON.COMPLETE': L('Rekonsiliasi selesai', 'Reconciliation Completed'), 'PERIOD.CLOSE': L('Periode ditutup', 'Period Closed'), 'RATIO.THRESHOLD': L('Ambang rasio diubah', 'Ratio Threshold Changed'), 'MODEL.CHANGE': L('Model keputusan diubah', 'Decision Model Changed'),
    'SCENARIO.CREATE': L('Skenario dibuat', 'Scenario Created'), 'ACCESS.DENIED': L('Akses ditolak', 'Access Denied') };
  M.audit = function (ev, ctx, o) {
    o = o || {};
    var e = { at: nowS(), ev: ev, by: empId(ctx), name: ctxName(ctx), role: ctx && ctx.roleKey || null, rec: o.rec || null, from: o.from == null ? null : String(o.from), to: o.to == null ? null : String(o.to), reason: o.reason == null ? null : T(o.reason) };
    S().audit.unshift(e); if (S().audit.length > 1500) S().audit.length = 1500; return e;
  };
  M.auditLog = function (f) { f = f || {}; return S().audit.filter(function (e) { return (!f.ev || e.ev.indexOf(f.ev) === 0) && (!f.rec || e.rec === f.rec); }); };
  function deny(ctx, what) { M.audit('ACCESS.DENIED', ctx, { rec: what }); return { ok: false, code: 'noperm', msg: M.MSG.noperm }; }
  function bad(msg, code, x) { return Object.assign({ ok: false, code: code || 'invalid', msg: msg || M.MSG.invalid }, x || {}); }
  M.deny = deny; M.bad = bad;
  M.notify = function (to, kind, rec, v) { var n = { id: nid('nt', 'NT10-'), to: to, kind: kind, rec: rec || null, at: nowS(), v: v || {} }; S().notifs.unshift(n); if (S().notifs.length > 200) S().notifs.length = 200; return n; };

  /* ---------- Lookups ---------- */
  M.clientName = function (id) { var c = CM && CM.client(id); return c ? c.n : id || '—'; };
  M.propName = function (id) { var p = CM && CM.prop(id); return p ? p.n : id || '—'; };
  M.propClient = function (id) { var p = CM && CM.prop(id); return p ? p.cl : null; };
  M.svc = function (id) { return CM && CM.service ? CM.service(id) : null; };
  M.svcName = function (id) { var s = M.svc(id); return s ? T(s.n) : id || '—'; };
  M.empName = function (id) { if (!id) return '—'; if (DL && DL.empName) { var n = DL.empName(id); if (n && n !== id) return n; } var X = M.X; var e = X && X.employee ? X.employee(id) : null; return e ? e.n : id; };
  M.rateOn = function (prop, svc, date) { var r = CM && CM.rateOn ? CM.rateOn(prop, svc, date, { legacy: true }) : null; return r || { rate: 0, rc: null, v: null, src: 'none' }; };
  M.unitOf = function (svc) { var s = M.svc(svc); return s ? s.unit : 'kg'; };

  /* ---------- Chart of accounts (§4) ---------- */
  M.COA = D.COA.map(function (a) { return { c: a[0], n: L(a[1], a[2]), type: a[3], grp: a[4], cur: !!a[5], nb: a[6] }; });
  M.acc = function (c) { return by(M.COA, 'c', String(c)); };
  M.accName = function (c) { var a = M.acc(c); return a ? a.n : L(String(c), String(c)); };
  var BSTYPES = ['asset', 'liab', 'eq'], PLTYPES = ['rev', 'cogs', 'opex', 'other', 'tax'];
  M.isPL = function (c) { var a = M.acc(c); return !!a && PLTYPES.indexOf(a.type) >= 0; };

  /* ---------- Periods (§7) ---------- */
  M.periods = function () { return S().periods; };
  M.period = function (p) { return by(S().periods, 'p', p); };
  M.perSt = function (d) { var p = M.period(ym(d)); return p ? p.st : 'open'; };
  M.curPeriod = function () { return ym(M.today()); };
  M.lastClosed = function () { var ps = S().periods.filter(function (p) { return p.st !== 'open' && p.p >= '2026-04'; }); return ps.length ? ps[ps.length - 1].p : '2026-09'; };
  M.PER_FLOW = { open: ['soft'], soft: ['open', 'closed'], closed: ['locked'], locked: [] };
  M.setPeriod = function (ctx, p, to, reason) {
    var per = M.period(p); if (!per) return bad(M.MSG.notfound, 'notfound');
    var need = to === 'closed' ? 'fin.close' : 'fin.period';
    if (!can(ctx, need)) return deny(ctx, p);
    if (M.PER_FLOW[per.st].indexOf(to) < 0) return bad(M.MSG.jump, 'jump');
    if (to === 'open' && !str(reason)) return bad(M.MSG.reason, 'reason');
    if (to === 'closed') { var ck = M.closeCheck ? M.closeCheck(p) : { ok: true }; if (!ck.ok) return bad(L('Checklist closing belum lengkap.', 'The close checklist is not complete.'), 'checklist', { missing: ck.missing }); }
    var from = per.st; per.st = to; per.log.push({ at: nowS(), by: empId(ctx), from: from, to: to, reason: reason || null });
    if (to === 'closed') { per.closedAt = M.today(); per.closedBy = empId(ctx); }
    M.audit(to === 'closed' ? 'PERIOD.CLOSE' : 'PERIOD.STATUS', ctx, { rec: p, from: from, to: to, reason: reason }); save();
    return { ok: true, period: per };
  };

  /* ---------- Journals (§5) ---------- */
  function jvTotals(lines) { return { d: sum(lines.map(function (l) { return l.d || 0; })), c: sum(lines.map(function (l) { return l.c || 0; })) }; }
  M.jvTotals = jvTotals;
  function balanced(lines) { var t = jvTotals(lines); return lines.length >= 2 && Math.abs(t.d - t.c) < 1 && t.d > 0; }
  M.balanced = balanced;
  function cleanLines(lines) {
    var out = []; (lines || []).forEach(function (l) {
      var d = Math.round(+l.d || 0), c = Math.round(+l.c || 0); if (!d && !c) return;
      if (d < 0) { c += -d; d = 0; } if (c < 0) { d += -c; c = 0; }
      out.push({ a: String(l.a), d: d, c: c, cc: l.cc || null, br: l.br || null, memo: l.memo || null });
    });
    return out;
  }
  function mkJ(o) {
    return { id: o.id || nid('jv', 'JV-' + String(o.date).slice(2, 4) + String(o.date).slice(5, 7) + '-', 4), date: o.date, period: ym(o.date), src: o.src || { t: 'manual', id: null }, ref: o.ref || null, desc: o.desc || L('Jurnal', 'Journal'),
      lines: cleanLines(o.lines), by: o.by || 'system', appr: o.appr || null, at: o.at || (o.date + ' 23:59'), st: o.st || 'posted', kind: o.kind || 'auto', rev: null, of: o.of || null, reason: o.reason || null };
  }
  // Internal post: the engine's own journals (Billing Ready, invoices, payments, receipts…). Same balance and period rules.
  function postJ(o, ctx, opt) {
    opt = opt || {};
    var j = mkJ(o);
    if (!balanced(j.lines)) return bad(M.MSG.unbal, 'unbal');
    if (j.lines.some(function (l) { return !M.acc(l.a); })) return bad(L('Akun tidak dikenal.', 'Unknown account.'), 'account');
    if (!opt.seed) {
      var ps = M.perSt(j.date);
      if (ps === 'closed' || ps === 'locked') return bad(M.MSG.closed, 'closed');
      if (ps === 'soft' && !(can(ctx, 'fin.period') && str(o.reason))) return bad(M.MSG.soft, 'soft');
    }
    S().jv.push(j);
    if (!opt.seed) { M.audit('JOURNAL.POST', ctx, { rec: j.id, to: T(j.desc) + ' · ' + jvTotals(j.lines).d }); save(); }
    return { ok: true, jv: j };
  }
  M._postJ = postJ;
  M.jv = function (id) { return by(S().jv, 'id', id); };
  M.journals = function (f) {
    f = f || {};
    return S().jv.filter(function (j) {
      if (f.period && j.period !== f.period) return false;
      if (f.src && j.src.t !== f.src) return false;
      if (f.st && j.st !== f.st) return false;
      if (f.acc && !j.lines.some(function (l) { return l.a === f.acc; })) return false;
      if (f.from && j.date < f.from) return false; if (f.to && j.date > f.to) return false;
      if (f.q) { var q = String(f.q).toLowerCase(); if ([j.id, j.ref, T(j.desc), j.src.id].join(' ').toLowerCase().indexOf(q) < 0) return false; }
      return true;
    }).sort(function (a, b) { return a.date < b.date ? 1 : a.date > b.date ? -1 : (a.id < b.id ? 1 : -1); });
  };
  // Manual journal: draft first, then post (needs fin.gl.post; posting into a soft-closed period needs fin.period and a reason).
  M.draftJournal = function (ctx, o) {
    if (!can(ctx, 'fin.gl.post')) return deny(ctx, 'journal');
    if (!o || !o.date || !str(T(o.desc))) return bad(M.MSG.invalid);
    var j = mkJ({ date: o.date, desc: o.desc, ref: o.ref, lines: o.lines, src: { t: 'manual', id: null }, by: empId(ctx), st: 'draft', kind: o.adjust ? 'adjust' : 'manual', reason: o.reason, at: nowS() });
    if (!j.lines.length) return bad(M.MSG.invalid);
    S().jv.push(j); M.audit('JOURNAL.DRAFT', ctx, { rec: j.id }); save();
    return { ok: true, jv: j, balanced: balanced(j.lines) };
  };
  M.postJournal = function (ctx, id, reason) {
    if (!can(ctx, 'fin.gl.post')) return deny(ctx, id);
    var j = M.jv(id); if (!j) return bad(M.MSG.notfound, 'notfound');
    if (j.st !== 'draft') return bad(M.MSG.posted, 'posted');
    if (!balanced(j.lines)) return bad(M.MSG.unbal, 'unbal');
    var ps = M.perSt(j.date);
    if (ps === 'closed' || ps === 'locked') return bad(M.MSG.closed, 'closed');
    if (ps === 'soft' && !(can(ctx, 'fin.period') && str(reason || j.reason))) return bad(M.MSG.soft, 'soft');
    if (j.kind === 'adjust' && !str(reason || j.reason)) return bad(M.MSG.reason, 'reason');
    j.st = j.kind === 'adjust' ? 'adjust' : 'posted'; j.appr = empId(ctx); j.reason = reason || j.reason; j.at = nowS();
    M.audit('JOURNAL.POST', ctx, { rec: j.id, to: jvTotals(j.lines).d, reason: j.reason }); save();
    return { ok: true, jv: j };
  };
  M.editDraft = function (ctx, id, o) {
    if (!can(ctx, 'fin.gl.post')) return deny(ctx, id);
    var j = M.jv(id); if (!j) return bad(M.MSG.notfound, 'notfound');
    if (j.st !== 'draft') return bad(M.MSG.posted, 'posted');
    if (o.lines) j.lines = cleanLines(o.lines); if (o.desc) j.desc = o.desc; if (o.date) { j.date = o.date; j.period = ym(o.date); } if (o.ref != null) j.ref = o.ref;
    save(); return { ok: true, jv: j, balanced: balanced(j.lines) };
  };
  // Reversal (§7): never edits the posted journal; a mirror journal in an open period (today when the original period is closed).
  M.reverse = function (ctx, id, reason, o) {
    o = o || {};
    if (!can(ctx, 'fin.gl.reverse')) return deny(ctx, id);
    if (!str(reason)) return bad(M.MSG.reason, 'reason');
    var j = M.jv(id); if (!j) return bad(M.MSG.notfound, 'notfound');
    if (j.st === 'reversed' || j.st === 'draft') return bad(M.MSG.jump, 'jump');
    if (j.kind === 'open') return bad(L('Saldo awal migrasi tidak dibalik. Gunakan penyesuaian.', 'The migration opening balance is not reversed. Use an adjustment.'), 'open');
    var ps = M.perSt(j.date), date = (ps === 'open') ? (o.date || M.today()) : M.today();
    if (M.perSt(date) !== 'open') return bad(M.MSG.closed, 'closed');
    var r = postJ({ date: date, desc: L('Balik ' + j.id + ': ' + T(j.desc), 'Reverse ' + j.id + ': ' + (Array.isArray(j.desc) ? j.desc[1] : j.desc)), ref: j.id, src: { t: 'rev', id: j.id }, kind: 'reversal', by: empId(ctx), appr: empId(ctx), of: j.id, reason: reason,
      lines: j.lines.map(function (l) { return { a: l.a, d: l.c, c: l.d, cc: l.cc, br: l.br, memo: l.memo }; }) }, ctx, { seed: true });
    if (!r.ok) return r;
    j.st = 'reversed'; j.rev = r.jv.id; r.jv.at = nowS();
    M.audit('JOURNAL.REVERSE', ctx, { rec: j.id, to: r.jv.id, reason: reason }); save();
    return { ok: true, jv: r.jv, orig: j, nextPeriod: ps !== 'open' };
  };

  /* ---------- Ledger & reports ---------- */
  var cache = { v: -1, key: '', val: null };
  function live(j) { return j.st === 'posted' || j.st === 'reversed' || j.st === 'adjust'; }
  // Net debit (debit − credit) per account for journals in [from, to].
  M.balances = function (o) {
    o = o || {};
    var key = (o.from || '') + '|' + (o.to || '') + '|' + (o.cc || '');
    if (cache.v === ver && cache.key === key) return cache.val;
    var b = {}; S().jv.forEach(function (j) {
      if (!live(j)) return; if (o.from && j.date < o.from) return; if (o.to && j.date > o.to) return;
      j.lines.forEach(function (l) { if (o.cc && l.cc !== o.cc) return; b[l.a] = (b[l.a] || 0) + (l.d || 0) - (l.c || 0); });
    });
    cache = { v: ver, key: key, val: b }; return b;
  };
  M.bal = function (code, to, from) { var b = M.balances({ to: to || M.today(), from: from }); return b[String(code)] || 0; };
  // Natural balance: debit-normal accounts positive when debit; credit-normal positive when credit.
  M.natural = function (code, to, from) { var a = M.acc(code), v = M.bal(code, to, from); return a && a.nb === 'c' ? -v : v; };
  M.grpBal = function (grp, to) { return sum(M.COA.filter(function (a) { return a.grp === grp; }).map(function (a) { return M.natural(a.c, to); })); };
  M.tb = function (o) {
    o = o || {}; var b = M.balances({ from: o.from, to: o.to || M.today() });
    var rows = M.COA.map(function (a) { var v = b[a.c] || 0; return { c: a.c, n: a.n, type: a.type, d: v > 0 ? v : 0, c2: v < 0 ? -v : 0 }; }).filter(function (r) { return r.d || r.c2; });
    return { rows: rows, d: sum(rows.map(function (r) { return r.d; })), c: sum(rows.map(function (r) { return r.c2; })) };
  };
  // Profit & loss for a period range (§4 structure).
  M.pl = function (from, to) {
    from = from.length === 7 ? from + '-01' : from; to = to ? (to.length === 7 ? mEnd(to) : to) : mEnd(from.slice(0, 7));
    var b = M.balances({ from: from, to: to }), g = {};
    function lines(type) { return M.COA.filter(function (a) { return a.type === type; }).map(function (a) { var v = b[a.c] || 0; return { c: a.c, n: a.n, v: a.nb === 'c' ? -v : v }; }).filter(function (x) { return x.v; }); }
    g.rev = lines('rev'); g.cogs = lines('cogs'); g.opex = lines('opex');
    var oth = M.COA.filter(function (a) { return a.type === 'other'; }).map(function (a) { var v = b[a.c] || 0; return { c: a.c, n: a.n, v: -v }; }).filter(function (x) { return x.v; });
    var revenue = sum(g.rev.map(function (x) { return x.v; })), cogs = sum(g.cogs.map(function (x) { return x.v; })), opex = sum(g.opex.map(function (x) { return x.v; })), other = sum(oth.map(function (x) { return x.v; })), tax = M.natural('8100', to, from);
    var gross = revenue - cogs, ebit = gross - opex, pbt = ebit + other, net = pbt - tax;
    return { from: from, to: to, rev: g.rev, cogs: g.cogs, opex: g.opex, oth: oth, revenue: revenue, cogsT: cogs, opexT: opex, other: other, tax: tax, gross: gross, ebit: ebit, pbt: pbt, net: net, gm: pct(gross, revenue), nm: pct(net, revenue) };
  };
  M.plMonth = function (p) { return M.pl(p + '-01', p === M.curPeriod() ? M.today() : mEnd(p)); };
  // Balance sheet at a date: current-year profit shown on its own line (§4).
  M.bs = function (asOf) {
    asOf = asOf || M.today();
    var b = M.balances({ to: asOf });
    function grp(type, cur) { return M.COA.filter(function (a) { return a.type === type && (cur == null || a.cur === cur); }).map(function (a) { var v = b[a.c] || 0; return { c: a.c, n: a.n, v: type === 'asset' ? v : -v, grp: a.grp, contra: type === 'asset' && a.nb === 'c' }; }).filter(function (x) { return x.v; }); }
    var ca = grp('asset', true), nca = grp('asset', false), cl = grp('liab', true), ncl = grp('liab', false), eq = grp('eq');
    var pl = M.pl(D.COMPANY.ledgerStart, asOf);
    var t = function (a) { return sum(a.map(function (x) { return x.v; })); };
    var A = t(ca) + t(nca), Lb = t(cl) + t(ncl), E = t(eq) + pl.net;
    return { asOf: asOf, ca: ca, nca: nca, cl: cl, ncl: ncl, eq: eq, cyProfit: pl.net, CA: t(ca), NCA: t(nca), CL: t(cl), NCL: t(ncl), EQ: E, A: A, L: Lb, check: Math.round(A - Lb - E) };
  };
  M.ledger = function (code, from, to) {
    var a = M.acc(code); if (!a) return null; to = to || M.today();
    var open = from ? M.bal(code, addDays(from, -1)) : 0, run = open, rows = [];
    S().jv.filter(function (j) { return live(j) && (!from || j.date >= from) && j.date <= to && j.lines.some(function (l) { return l.a === String(code); }); })
      .sort(function (x, y) { return x.date < y.date ? -1 : x.date > y.date ? 1 : (x.id < y.id ? -1 : 1); })
      .forEach(function (j) { j.lines.filter(function (l) { return l.a === String(code); }).forEach(function (l) { run += (l.d || 0) - (l.c || 0); rows.push({ jv: j.id, date: j.date, desc: j.desc, src: j.src, d: l.d, c: l.c, bal: a.nb === 'c' ? -run : run }); }); });
    return { acc: a, open: a.nb === 'c' ? -open : open, rows: rows, close: a.nb === 'c' ? -run : run };
  };

  /* ---------- Traceability (§6): every journal drills down to its source ---------- */
  M.trace = function (id) {
    var j = M.jv(id); if (!j) return [];
    var out = [{ k: 'jv', id: j.id, n: j.desc }], s = j.src || {};
    function add(k, rid, n, x) { if (rid) out.push(Object.assign({ k: k, id: rid, n: n || null }, x || {})); }
    function brChain(b) { if (!b) return; add('br', b.id, L('Billing Ready', 'Billing Ready')); if (b.bil) add('bil', b.bil, L('Billing Fase 9', 'Phase 9 billing')); if (b.dlv) add('dlv', b.dlv, L('Delivery & POD', 'Delivery & POD')); if (b.ord) add('ord', b.ord, L('Order', 'Order')); add('cl', b.cl, M.clientName(b.cl)); }
    if (s.t === 'inv') { var iv = M.invoice(s.id); add('inv', s.id, L('Invoice', 'Invoice')); if (iv) { var brs = iv.lines.map(function (l) { return l.br && M.brRec(l.br); }).filter(Boolean); if (brs.length) brChain(brs[0]); else add('cl', iv.cl, M.clientName(iv.cl)); if (brs.length > 1) out.push({ k: 'more', id: null, n: L('+' + (brs.length - 1) + ' baris Billing Ready lain', '+' + (brs.length - 1) + ' more Billing Ready lines') }); } }
    else if (s.t === 'br') brChain(M.brRec(s.id));
    else if (s.t === 'pay') { var py = by(S().pays, 'id', s.id); add('pay', s.id, L('Pembayaran klien', 'Client payment')); if (py) { add('inv', py.inv, L('Invoice', 'Invoice')); var iv2 = M.invoice(py.inv); if (iv2) add('cl', iv2.cl, M.clientName(iv2.cl)); } }
    else if (s.t === 'ap' || s.t === 'apay') { var ex = M.expense(s.t === 'ap' ? s.id : (by(S().apays, 'id', s.id) || {}).exp); if (s.t === 'apay') add('apay', s.id, L('Pembayaran AP', 'AP payment')); if (ex) { add('exp', ex.id, L('Biaya / invoice supplier', 'Expense / supplier invoice'), { ref: ex.sinv }); if (ex.po) add('po', ex.po, 'PO'); if (ex.grn) add('grn', ex.grn, L('Penerimaan barang', 'Goods receipt')); if (ex.sup) add('sup', ex.sup, M.supName ? M.supName(ex.sup) : ex.sup); } }
    else if (s.t === 'grn') { var g = M.grn && M.grn(s.id); add('grn', s.id, L('Penerimaan barang', 'Goods receipt')); if (g) { add('po', g.po, 'PO'); var po = M.po && M.po(g.po); if (po) add('sup', po.sup, M.supName(po.sup)); } }
    else if (s.t === 'mv') { var mv = M.move && M.move(s.id); add('mv', s.id, L('Mutasi stok', 'Stock movement')); if (mv) { if (/^B-/.test(mv.src)) add('batch', mv.src, L('Batch produksi', 'Production batch')); else if (/^WO-/.test(mv.src)) add('wo', mv.src, L('Work order', 'Work order')); else add('doc', mv.src, null); add('stock', mv.item, M.stockName ? M.stockName(mv.item) : mv.item); } }
    else if (s.t === 'dep') { add('dep', s.id, L('Penyusutan periode ' + s.id, 'Depreciation period ' + s.id)); add('ast', null, L(j.lines.length - 1 + ' aset di register', j.lines.length - 1 + ' assets in the register')); }
    else if (s.t === 'cash') { var ct = M.cashTx(s.id); add('cash', s.id, L('Transaksi kas', 'Cash transaction')); if (ct) add('doc', ct.ev || ct.ref, L('Bukti', 'Evidence')); }
    else if (s.t === 'sum') add('src', s.id, L('P&L Fase 5 · ' + s.id + ' (ringkasan migrasi bulanan)', 'Phase 5 P&L · ' + s.id + ' (monthly migration summary)'));
    else if (s.t === 'open') add('src', null, L('Saldo subledger per 6 Okt: kas (Fase 5), AR, AP, stok, aset', 'Subledger balances at 6 Oct: cash (Phase 5), AR, AP, stock, assets'));
    else if (s.t === 'rev') add('jv', s.id, L('Jurnal asli', 'Original journal'));
    else if (s.t === 'ast') add('ast', s.id, L('Aset', 'Asset'));
    else add('user', j.by, M.empName(j.by));
    return out;
  };

  /* ---------- Ledger seeding: summaries Apr–Sep from Phase 5, October detail, opening balances solved from the subledgers ---------- */
  function buildLedger(s) {
    var FIN = PD && PD.FIN, pl = FIN ? FIN.pl : null, months = FIN ? FIN.plMonths : [];
    var SEED = { seed: true };
    function J(o) { o.kind = o.kind || 'auto'; o.by = o.by || 'EMP-030'; o.appr = o.appr || 'EMP-030'; var r = postJ(o, null, SEED); if (!r.ok) throw new Error('seed journal ' + T(o.desc) + ': ' + T(r.msg)); return r.jv; }
    // September sales ledger → revenue per account (rates from the Phase 6 rate cards).
    var sep = M.salesSep(), sepAcc = {};
    sep.rows.forEach(function (r) { sepAcc[r.acc] = (sepAcc[r.acc] || 0) + r.rev; });
    var rest = D.SEP_REV_TOTAL - sep.rev; if (rest > 0) { sepAcc['4500'] = Math.round(rest * D.SEP_DELIVERY_SHARE); sepAcc['4900'] = rest - sepAcc['4500']; }
    var sepTot = sum(Object.keys(sepAcc).map(function (k) { return sepAcc[k]; }));
    var oct1 = s.inv.filter(function (i) { return i.issued === '2026-10-01'; }), oct1Sub = sum(oct1.map(function (i) { return i.sub; }));
    var hppIdx = {}; D.HPP_MONTHS.forEach(function (m, i) { hppIdx[m] = i; });
    var prevBill = null, prevTax = null, prevPpn = null, prevAp = null;
    ['2026-04', '2026-05', '2026-06', '2026-07', '2026-08', '2026-09'].forEach(function (m) {
      var k = months.indexOf(m), end = mEnd(m), hi = hppIdx[m];
      var rev = pl ? pl.revenue[k] * JT : 0, cogs = pl ? pl.cogs[k] * JT : 0, opex = pl ? pl.opex[k] * JT : 0, oth = pl ? -pl.other[k] * JT : 0, tax = pl ? pl.tax[k] * JT : 0;
      // Revenue by account: September exact from the sales ledger, earlier months with the September mix.
      var revAcc = {}; Object.keys(sepAcc).forEach(function (a) { revAcc[a] = m === '2026-09' ? sepAcc[a] : Math.round(rev * sepAcc[a] / sepTot); });
      var revT = sum(Object.keys(revAcc).map(function (a) { return revAcc[a]; })), ppn = Math.round(revT * 0.11);
      var unb = m === '2026-09' ? oct1Sub : 0, unbPpn = 0;
      var billed = revT - unb, billPpn = Math.round(billed * 0.11);
      J({ date: end, desc: L('Penjualan ' + m + ' (ringkasan migrasi)', 'Sales ' + m + ' (migration summary)'), src: { t: 'sum', id: m }, kind: 'summary',
        lines: [{ a: '1200', d: billed + billPpn }].concat(unb ? [{ a: '1210', d: unb, memo: 'INV 1 Okt' }] : []).concat(Object.keys(revAcc).map(function (a) { return { a: a, c: revAcc[a] }; })).concat([{ a: '2210', c: billPpn + unbPpn }]) });
      // Cost by account.
      var C = D.HPP_COMP, chem = sum(['detergent', 'softener', 'bleach', 'stain', 'bhp'].map(function (x) { return C.chemical[x][hi]; })) * JT, pack = C.chemical.packing[hi] * JT;
      var labor = sum(['salary', 'allowance', 'meal'].map(function (x) { return C.labor[x][hi]; })) * JT, util = sum(['electricity', 'water', 'gas'].map(function (x) { return C.utility[x][hi]; })) * JT;
      if (m === '2026-09') util -= 4 * JT;   // the late PLN bill is accrued separately on 30 Sep (HPP v2)
      var dlv = Math.round(opex * 86 / 542), other = cogs - chem - pack - labor - util - (m === '2026-09' ? 4 * JT : 0);
      var base = opex * (392 / 542), op = { '6100': 168, '6200': 120, '6300': 26, '6600': 12, '6400': 44, '6500': 22 };
      var opx = {}; Object.keys(op).forEach(function (a) { opx[a] = Math.round(base * op[a] / 392); });
      var payroll = labor + opx['6100'] + Math.round(dlv * 0.4), apCost = chem + pack + util + other + Math.round(dlv * 0.6) + opx['6300'] + opx['6600'] + opx['6400'] + opx['6500'];
      J({ date: end, desc: L('Biaya produksi & operasional ' + m + ' (ringkasan migrasi)', 'Production & operating cost ' + m + ' (migration summary)'), src: { t: 'sum', id: m }, kind: 'summary',
        lines: [{ a: '5100', d: chem, cc: 'CC-PRD' }, { a: '5200', d: pack, cc: 'CC-PRD' }, { a: '5300', d: labor, cc: 'CC-PRD' }, { a: '5400', d: util, cc: 'CC-PRD' }, { a: '5500', d: dlv, cc: 'CC-LOG' }, { a: '5900', d: other, cc: 'CC-PRD' }]
          .concat(Object.keys(opx).map(function (a) { return { a: a, d: opx[a], cc: a === '6400' ? 'CC-MNT' : a === '6500' ? 'CC-SLS' : 'CC-ADM' }; }))
          .concat([{ a: '1310', c: chem }, { a: '1320', c: pack }, { a: '1400', c: opx['6200'] }, { a: '2300', c: payroll }, { a: '2100', c: apCost - chem - pack }]) });
      J({ date: end, desc: L('Pembelian bahan kimia & kemasan ' + m + ' (ringkasan)', 'Chemical & packaging purchases ' + m + ' (summary)'), src: { t: 'sum', id: m }, kind: 'summary', lines: [{ a: '1310', d: chem }, { a: '1320', d: pack }, { a: '2100', c: chem + pack }] });
      J({ date: end, desc: L('Pajak penghasilan ' + m, 'Income tax ' + m), src: { t: 'sum', id: m }, kind: 'summary', lines: [{ a: '8100', d: tax }, { a: '2220', c: tax }] });
      J({ date: end, desc: L('Bunga & biaya bank ' + m, 'Interest & bank charges ' + m), src: { t: 'sum', id: m }, kind: 'summary', lines: [{ a: '7200', d: oth }, { a: '1123', c: oth }] });
      // Cash summaries: collections, supplier & payroll payments, taxes, rent prepayment, loan principal.
      var coll = prevBill == null ? billed + billPpn : prevBill, payAp = prevAp == null ? apCost : prevAp;   // suppliers are paid the month after (≈30-day terms)
      J({ date: end, desc: L('Penerimaan klien ' + m + ' (ringkasan)', 'Client receipts ' + m + ' (summary)'), src: { t: 'sum', id: m }, kind: 'summary', lines: [{ a: '1121', d: Math.round(coll * 0.88) }, { a: '1123', d: coll - Math.round(coll * 0.88) }, { a: '1200', c: coll }] });
      J({ date: end, desc: L('Pembayaran supplier & gaji ' + m + ' (ringkasan)', 'Supplier & payroll payments ' + m + ' (summary)'), src: { t: 'sum', id: m }, kind: 'summary',
        lines: [{ a: '2100', d: payAp }, { a: '2300', d: payroll }, { a: '1122', d: payroll, memo: 'top-up payroll' }, { a: '1122', c: payroll }, { a: '1121', c: payAp + payroll }] });
      if (prevPpn != null) J({ date: end, desc: L('Setor PPN & PPh masa sebelumnya', 'Remit prior-period VAT & income tax'), src: { t: 'sum', id: m }, kind: 'summary', lines: [{ a: '2210', d: prevPpn }, { a: '2220', d: prevTax }, { a: '1121', c: prevPpn + prevTax }] });
      J({ date: end, desc: L('Sewa dibayar di muka & angsuran pinjaman ' + m, 'Prepaid rent & loan instalment ' + m), src: { t: 'sum', id: m }, kind: 'summary', lines: [{ a: '1400', d: opx['6200'] }, { a: '2500', d: 19 * JT }, { a: '1123', c: opx['6200'] + 19 * JT }] });
      if (m === '2026-06' || m === '2026-09') J({ date: end, desc: L('Dividen interim ' + m + ' (keputusan RUPS)', 'Interim dividend ' + m + ' (shareholder resolution)'), src: { t: 'sum', id: m }, kind: 'summary', by: 'EMP-050', appr: 'EMP-050', lines: [{ a: '3300', d: 450 * JT }, { a: '1121', c: 450 * JT }] });
      prevAp = apCost; prevBill = billed + billPpn; prevPpn = billPpn + unbPpn; prevTax = tax;
    });
    // September supplier bills (summary) paid in early October from Mandiri.
    J({ date: '2026-10-02', desc: L('Pembayaran tagihan supplier September (ringkasan migrasi)', 'Payment of September supplier bills (migration summary)'), src: { t: 'sum', id: '2026-09' }, kind: 'summary', lines: [{ a: '2100', d: prevAp }, { a: '1123', c: prevAp }] });
    // The late September PLN bill, accrued at 30 Sep (soft close adjustment, HPP v2).
    J({ date: '2026-09-30', desc: L('Akrual listrik PLN September (tagihan datang 3 Okt)', 'Accrual: September PLN electricity (bill arrived 3 Oct)'), src: { t: 'manual', id: null }, kind: 'adjust', st: 'adjust', reason: L('Tagihan terlambat', 'Late bill'), lines: [{ a: '5400', d: 4 * JT, cc: 'CC-PRD' }, { a: '2400', c: 4 * JT }] });
    // Depreciation per month from the asset register (§55).
    if (M.depRun) ['2026-04', '2026-05', '2026-06', '2026-07', '2026-08', '2026-09'].forEach(function (m) { var d = M.depRun(m); J({ date: mEnd(m), desc: L('Penyusutan aset ' + m, 'Asset depreciation ' + m), src: { t: 'dep', id: m }, kind: 'auto', lines: d.lines }); s.depPosted = s.depPosted || {}; s.depPosted[m] = true; });
    // October detail: invoices issued 1 Oct (September service), Billing Ready accruals, payments, cash, AP, receipts, stock.
    oct1.forEach(function (iv) { iv.jv = J({ date: iv.issued, desc: L('Invoice ' + iv.id + ' · ' + M.clientName(iv.cl), 'Invoice ' + iv.id + ' · ' + M.clientName(iv.cl)), src: { t: 'inv', id: iv.id }, ref: iv.id, lines: [{ a: '1200', d: iv.total }, { a: '1210', c: iv.sub }, { a: '2210', c: iv.tax }] }).id; });
    s.br.forEach(function (b) { if (b.date < '2026-10-01') return; b.jv = J(brJournal(b)).id; });
    var sepPay = 0;
    s.inv.filter(function (iv) { return iv.paidSeed; }).sort(function (a, b) { return a.paidSeed[1] < b.paidSeed[1] ? -1 : a.paidSeed[1] > b.paidSeed[1] ? 1 : a.paidSeed[0] - b.paidSeed[0]; }).forEach(function (iv) {
      var p = { id: iv.paidSeed[1] < '2026-10-01' ? 'PAY-2609-' + String(++sepPay + 40).padStart(3, '0') : nid('pay', 'PAY-2610-', 3), inv: iv.id, date: iv.paidSeed[1], amt: iv.paidSeed[0], acc: 'ACC-01', ref: 'TRF ' + iv.paidSeed[1], by: 'EMP-030', jv: null, at: iv.paidSeed[1] + ' 10:00' };
      if (p.date >= '2026-10-01') { p.jv = J({ date: p.date, desc: L('Pembayaran ' + iv.id + ' · ' + M.clientName(iv.cl), 'Payment ' + iv.id + ' · ' + M.clientName(iv.cl)), src: { t: 'pay', id: p.id }, ref: iv.id, lines: [{ a: '1121', d: p.amt }, { a: '1200', c: p.amt }] }).id; }
      s.pays.push(p); delete iv.paidSeed;
    });
    s.cashTx.forEach(function (t) { t.jv = J(cashJournal(t)).id; });
    s.exp.forEach(function (e) {
      if (['approved', 'scheduled', 'paid', 'partial'].indexOf(e.st) >= 0) { var o = apJournal(e); if (o) e.jv = J(o).id; }
      if (e.paid) { var pd = e.due < '2026-10-01' ? e.due : '2026-09-30', p = { id: nid('apay', 'APAY-' + pd.slice(2, 4) + pd.slice(5, 7) + '-', 3), exp: e.id, date: pd, amt: e.paid, acc: 'ACC-01', by: 'EMP-030', at: pd + ' 14:00', jv: null };
        p.jv = J({ date: pd, desc: L('Bayar ' + (e.sinv || e.id), 'Pay ' + (e.sinv || e.id)), src: { t: 'apay', id: p.id }, ref: e.sinv, lines: [{ a: isLiabCoa(e.coa) ? e.coa : '2100', d: e.paid }, { a: '1121', c: e.paid }] }).id; s.apays.push(p); }
    });
    // October 1–6 cost accrual at September daily run-rate (payroll, utilities, delivery, overhead), so month-to-date margin is not overstated.
    var sepJ = s.jv.filter(function (j) { return j.src && j.src.t === 'sum' && j.src.id === '2026-09' && j.lines.some(function (l) { return l.a === '5300'; }); })[0], octAcc = { pay: 0, acc: 0 };
    if (sepJ) {
      var accL = [], f = 6 / 30;
      sepJ.lines.forEach(function (l) { if (!l.d || /^5[12]/.test(l.a) || l.a === '6200') return; var v = Math.round(l.d * f); accL.push({ a: l.a, d: v, cc: l.cc }); if (l.a === '5300' || l.a === '6100') octAcc.pay += v; else octAcc.acc += v; });
      accL.push({ a: '2300', c: octAcc.pay }); accL.push({ a: '2400', c: octAcc.acc });
      J({ date: '2026-10-06', desc: L('Akrual biaya 1–6 Okt (run-rate September)', 'Cost accrual 1–6 Oct (September run-rate)'), src: { t: 'manual', id: null }, kind: 'accrual', reason: L('Akrual harian sampai tagihan dan payroll diposting', 'Daily accrual until bills and payroll are posted'), lines: accL });
    }
    s._octAcc = octAcc;
    if (M.seedOps) M.seedOps(s, J);   // goods receipts and stock movements (jfos-fin-sup.js)
    // Phase 9 Billing Ready already sent before Phase 10 opened.
    syncP9(s, true);
    // Opening balances at 31 Mar solved from the subledger truth at today.
    s._sepTax = { ppn: prevPpn, pph: prevTax };
    var tgt = targets(s), eff = {};
    s.jv.forEach(function (j) { if (!live(j)) return; j.lines.forEach(function (l) { eff[l.a] = (eff[l.a] || 0) + l.d - l.c; }); });
    var lines = [];
    Object.keys(tgt).forEach(function (a) { var want = tgt[a], dif = want - (eff[a] || 0); if (Math.round(dif)) lines.push(dif > 0 ? { a: a, d: Math.round(dif) } : { a: a, c: Math.round(-dif) }); });
    var t = jvTotals(lines), plug = t.d - t.c;
    lines.push(plug > 0 ? { a: '3200', c: plug } : { a: '3200', d: -plug });
    var op = mkJ({ id: 'JV-2603-0000', date: '2026-03-31', desc: L('Saldo awal migrasi ledger (31 Mar 2026)', 'Ledger migration opening balance (31 Mar 2026)'), src: { t: 'open', id: null }, kind: 'open', by: 'EMP-030', appr: 'EMP-050', lines: lines });
    s.jv.unshift(op);
  }
  // Truth at today for the opening solve: debit-positive targets.
  function targets(s) {
    var t = {}, B = D.BS_TARGET;
    D.CASH_ACC.forEach(function (a) { t[a.coa] = a.bal; });
    t['1200'] = sum(s.inv.filter(function (i) { return i.st !== 'cancelled' && i.st !== 'draft' && i.issued <= D.today; }).map(function (i) { return i.total - M.paidOf(i, s); }));
    t['1210'] = sum(s.br.filter(function (b) { return b.st !== 'invoiced'; }).map(function (b) { return b.charge - b.disc + b.sur; }));
    if (M.stockValueByGl) { var sv = M.stockValueByGl(s); Object.keys(sv).forEach(function (g) { t[g] = sv[g]; }); }
    t['1400'] = B.prepaid;
    if (M.faTargets) { var fa = M.faTargets(s); Object.keys(fa).forEach(function (g) { t[g] = fa[g]; }); }
    t['2100'] = -sum(s.exp.filter(function (e) { return ['approved', 'scheduled', 'partial'].indexOf(e.st) >= 0 && !isLiabCoa(e.coa); }).map(function (e) { return e.amt + e.tax - e.paid; }));
    t['2150'] = M.grniTarget ? -M.grniTarget(s) : 0;
    t['2210'] = -((s._sepTax ? s._sepTax.ppn : B.tax2210) + sum(s.inv.filter(function (i) { return i.issued >= '2026-10-01'; }).map(function (i) { return i.tax; })));
    t['2220'] = -(s._sepTax ? s._sepTax.pph : B.tax2220); delete s._sepTax; var oa = s._octAcc || { pay: 0, acc: 0 }; delete s._octAcc; t['2300'] = -(B.payroll + oa.pay); t['2400'] = -(B.accrual + 4 * JT + oa.acc); t['2500'] = -D.LOAN.bal; t['3100'] = -B.capital;
    return t;
  }
  function isLiabCoa(c) { return /^2[23]/.test(String(c)); }
  M.isLiabCoa = isLiabCoa;

  /* ---------- NP-03 Billing Ready (§12–§13): consumed from Phase 9, never re-entered ---------- */
  M.salesSep = function () {
    var rows = D.SALES_SEP.map(function (x) {
      var r = M.rateOn(x[0], x[1], '2026-09-15'), unit = M.unitOf(x[1]), w = M.pcsWeight ? M.pcsWeight(x[1]) : 1;
      return { prop: x[0], cl: M.propClient(x[0]), svc: x[1], unit: unit, qty: x[2], rate: r.rate, rc: r.rc ? r.rc + ' v' + r.v : null, rev: Math.round(r.rate * x[2]), kgeq: unit === 'pcs' ? x[2] * w : x[2], acc: D.SVC_ACC[x[1]] || '4100', tier: D.SVC_TIER[x[1]] || 'regular' };
    });
    return { rows: rows, rev: sum(rows.map(function (r) { return r.rev; })), kgeq: sum(rows.map(function (r) { return r.kgeq; })) };
  };
  function brFromSeed(x) {
    var r = M.rateOn(x[2], x[3], x[1]), charge = Math.round(r.rate * x[4]);
    return { id: x[0], src: 'seed', bil: 'BIL-' + x[0].slice(3), dlv: null, ord: null, cl: M.propClient(x[2]), prop: x[2], svc: x[3], unit: M.unitOf(x[3]), qty: x[4], rate: r.rate, rc: r.rc ? r.rc + ' v' + r.v : null,
      ctr: CM && CM.contractsForProp ? (CM.contractsForProp(x[2], x[1])[0] || {}).no || null : null, charge: charge, disc: 0, sur: 0, taxPct: 11, date: x[1], at: x[1] + ' 18:00', compVer: 1, evidence: ['POD', 'REC:ok'], st: 'unbilled', inv: null, jv: null };
  }
  function brJournal(b) {
    var amt = b.charge - b.disc + b.sur;
    return { date: b.date, desc: L('Billing Ready ' + b.id + ' · ' + M.propName(b.prop), 'Billing Ready ' + b.id + ' · ' + M.propName(b.prop)), src: { t: 'br', id: b.id }, ref: b.bil, lines: [{ a: '1210', d: amt }, { a: D.SVC_ACC[b.svc] || '4100', c: amt, cc: 'CC-SLS' }] };
  }
  M._seed.push(function (s) {
    s.br = D.BR_SEED.map(brFromSeed);
    // Seeded paid amounts on invoices become payment records once the ledger is built.
    D.INVOICES.forEach(function (x) { var iv = by(s.inv, 'id', x[0]); if (x[7]) iv.paidSeed = [Math.round(x[7] * JT), x[8]]; });
  });
  // Phase 9 → Phase 10: every Billing Ready payload sent to Finance becomes a BR line with its revenue accrual (§91).
  function syncP9(s, seeding) {
    if (!DL || !DL.state) return 0;
    var out = (DL.state().outbox || []), n = 0;
    out.forEach(function (p) {
      if (s.p9[p.id]) return;
      var b = { id: 'BR-' + p.id.slice(4), src: 'p9', bil: p.id, dlv: p.dlv, ord: p.ord, cl: p.cl, prop: p.prop, svc: p.svc, unit: p.unit, qty: p.qty, rate: p.rate, rc: p.rc, ctr: p.ctr, charge: p.charge, disc: p.disc || 0, sur: p.sur || 0, taxPct: p.taxPct,
        date: String(p.at).slice(0, 10), at: p.at, compVer: p.compVer, evidence: p.evidence || [], st: 'unbilled', inv: null, jv: null };
      if (by(s.br, 'id', b.id)) b.id = b.id + '-' + p.compVer;
      var o = brJournal(b), date = b.date;
      if (M.perSt(date) !== 'open') { o.date = M.today(); }
      var r = postJ(o, null, { seed: true }); if (r.ok) b.jv = r.jv.id;
      s.br.push(b); s.p9[p.id] = b.id; n++;
      if (!seeding) M.audit('BILLING.RECEIVED', null, { rec: b.id, to: p.id });
    });
    return n;
  }
  M.sync = function () { var n = syncP9(S(), false); if (n) save(); return n; };
  M.brRec = function (id) { return by(S().br, 'id', id); };
  M.brAmount = function (b) { return b.charge - b.disc + b.sur; };
  M.billingReady = function (ctx, f) {
    if (!can(ctx, 'ar.view')) return [];
    M.sync(); f = f || {};
    return S().br.filter(function (b) { return (!f.st || b.st === f.st) && (!f.cl || b.cl === f.cl); }).sort(function (a, b) { return a.at < b.at ? 1 : -1; });
  };

  /* ---------- Invoices (§14) ---------- */
  M.invoice = function (id) { return by(S().inv, 'id', id); };
  M.paidOf = function (iv, s) { return sum((s || S()).pays.filter(function (p) { return p.inv === iv.id && !p.void; }).map(function (p) { return p.amt; })); };
  M.openOf = function (iv) { return iv.total - M.paidOf(iv); };
  M.invSt = function (iv) {
    if (['draft', 'review', 'approved', 'cancelled'].indexOf(iv.st) >= 0) return iv.st;
    var paid = M.paidOf(iv);
    if (paid >= iv.total) return 'paid';
    if (dayDiff(iv.due, M.today()) > 0) return 'overdue';
    return paid > 0 ? 'partial' : 'issued';
  };
  M.invoices = function (ctx, f) {
    if (!can(ctx, 'ar.view')) return [];
    f = f || {};
    return S().inv.filter(function (iv) { var s0 = M.invSt(iv); return (!f.st || s0 === f.st || (f.st === 'open' && ['issued', 'partial', 'overdue'].indexOf(s0) >= 0)) && (!f.cl || iv.cl === f.cl); })
      .sort(function (a, b) { return (b.issued || '9') < (a.issued || '9') ? -1 : 1; });
  };
  function invCalc(iv) {
    iv.sub = sum(iv.lines.map(function (l) { return l.amt; }));
    var cl = CM && CM.client(iv.cl), taxable = !cl || cl.taxable !== false;
    iv.tax = taxable ? Math.round((iv.sub + iv.sur - iv.disc) * S().cfg.ppn / 100) : 0;
    iv.total = iv.sub + iv.sur - iv.disc + iv.tax;
    return iv;
  }
  // AR-002 invoice builder: lines come from Billing Ready only; nothing typed again (§13).
  M.buildInvoice = function (ctx, brIds, o) {
    if (!can(ctx, 'ar.build')) return deny(ctx, 'invoice');
    o = o || {};
    var brs = (brIds || []).map(M.brRec).filter(Boolean);
    if (!brs.length) return bad(L('Pilih transaksi Billing Ready.', 'Choose Billing Ready transactions.'));
    if (brs.some(function (b) { return b.st !== 'unbilled'; })) return bad(L('Ada transaksi yang sudah ditagih.', 'Some transactions are already invoiced.'), 'billed');
    var cl = brs[0].cl; if (brs.some(function (b) { return b.cl !== cl; })) return bad(L('Satu invoice untuk satu klien.', 'One invoice per client.'), 'client');
    var props = brs.map(function (b) { return b.prop; }).filter(function (p, i, a) { return a.indexOf(p) === i; });
    var c = CM && CM.client(cl), terms = c && c.terms || 30, dates = brs.map(function (b) { return b.date; }).sort();
    var iv = { id: nid('inv', 'INV-' + M.today().slice(2, 4) + M.today().slice(5, 7) + '-1', 2), cl: cl, prop: props.length === 1 ? props[0] : null, props: props, period: dates[0] === dates[dates.length - 1] ? dates[0] : dates[0] + ' – ' + dates[dates.length - 1],
      issued: null, due: null, terms: terms, ctr: brs[0].ctr, po: str(o.po) || null, mig: false, manual: false,
      lines: brs.map(function (b) { return { svc: b.svc, desc: L(M.svcName(b.svc) + ' · ' + M.propName(b.prop), M.svcName(b.svc) + ' · ' + M.propName(b.prop)), qty: b.qty, unit: b.unit, rate: b.rate, amt: b.charge, br: b.id, rc: b.rc, date: b.date }; }),
      sur: sum(brs.map(function (b) { return b.sur; })), disc: sum(brs.map(function (b) { return b.disc; })), st: 'draft', by: empId(ctx), appr: null, docs: ['Billing Ready', 'POD', L('Rekap delivery', 'Delivery summary')], jv: null, log: [{ at: nowS(), by: empId(ctx), to: 'draft' }] };
    invCalc(iv);
    brs.forEach(function (b) { b.st = 'drafted'; b.inv = iv.id; });
    S().inv.unshift(iv); M.audit('INVOICE.DRAFT', ctx, { rec: iv.id, to: iv.total }); save();
    return { ok: true, inv: iv };
  };
  M.invSetPo = function (ctx, id, po) { if (!can(ctx, 'ar.build')) return deny(ctx, id); var iv = M.invoice(id); if (!iv || ['draft', 'review'].indexOf(iv.st) < 0) return bad(M.MSG.jump, 'jump'); iv.po = str(po) || null; save(); return { ok: true, inv: iv }; };
  // A manual discount makes the invoice deviate from Billing Ready: it always needs a second person.
  M.invDiscount = function (ctx, id, amt, reason) {
    if (!can(ctx, 'ar.build')) return deny(ctx, id);
    var iv = M.invoice(id); if (!iv || iv.st !== 'draft') return bad(M.MSG.jump, 'jump');
    amt = num(amt); if (amt == null || isNaN(amt) || amt < 0 || amt > iv.sub) return bad(M.MSG.invalid);
    if (!str(reason)) return bad(M.MSG.reason, 'reason');
    iv.disc = Math.round(amt); iv.manual = true; iv.discWhy = reason; invCalc(iv); M.audit('INVOICE.DISCOUNT', ctx, { rec: id, to: amt, reason: reason }); save();
    return { ok: true, inv: iv };
  };
  M.invNeedsSecond = function (iv) { return iv.manual || iv.total > S().cfg.arApprove; };
  M.invSubmit = function (ctx, id) {
    if (!can(ctx, 'ar.build')) return deny(ctx, id);
    var iv = M.invoice(id); if (!iv) return bad(M.MSG.notfound, 'notfound'); if (iv.st !== 'draft') return bad(M.MSG.jump, 'jump');
    iv.st = 'review'; iv.log.push({ at: nowS(), by: empId(ctx), to: 'review' }); M.audit('INVOICE.REVIEW', ctx, { rec: id }); save();
    if (M.invNeedsSecond(iv)) M.notify('ar.approve', 'invappr', id, { total: iv.total });
    return { ok: true, inv: iv };
  };
  M.invApprove = function (ctx, id) {
    if (!can(ctx, 'ar.approve')) return deny(ctx, id);
    var iv = M.invoice(id); if (!iv) return bad(M.MSG.notfound, 'notfound'); if (iv.st !== 'review') return bad(M.MSG.jump, 'jump');
    if (M.invNeedsSecond(iv) && iv.by === empId(ctx)) return bad(M.MSG.maker, 'maker');
    iv.st = 'approved'; iv.appr = empId(ctx); iv.apprAt = nowS(); iv.log.push({ at: nowS(), by: empId(ctx), to: 'approved' }); M.audit('INVOICE.APPROVE', ctx, { rec: id, to: iv.total }); save();
    return { ok: true, inv: iv };
  };
  M.invReturn = function (ctx, id, reason) {
    if (!can(ctx, 'ar.approve')) return deny(ctx, id);
    var iv = M.invoice(id); if (!iv || iv.st !== 'review') return bad(M.MSG.jump, 'jump'); if (!str(reason)) return bad(M.MSG.reason, 'reason');
    iv.st = 'draft'; iv.log.push({ at: nowS(), by: empId(ctx), to: 'draft', reason: reason }); M.audit('INVOICE.RETURN', ctx, { rec: id, reason: reason }); save();
    return { ok: true, inv: iv };
  };
  // Issue: posts unbilled → AR and output VAT. The Billing Ready lines become invoiced.
  M.invIssue = function (ctx, id, date) {
    if (!can(ctx, 'ar.issue')) return deny(ctx, id);
    var iv = M.invoice(id); if (!iv) return bad(M.MSG.notfound, 'notfound'); if (iv.st !== 'approved') return bad(M.MSG.jump, 'jump');
    date = date || M.today();
    var lines = [{ a: '1200', d: iv.total }, { a: '1210', c: iv.sub + iv.sur - iv.disc }].concat(iv.tax ? [{ a: '2210', c: iv.tax }] : []);
    var r = postJ({ date: date, desc: L('Invoice ' + iv.id + ' · ' + M.clientName(iv.cl), 'Invoice ' + iv.id + ' · ' + M.clientName(iv.cl)), src: { t: 'inv', id: iv.id }, ref: iv.id, by: empId(ctx), appr: iv.appr, lines: lines }, ctx);
    if (!r.ok) return r;
    iv.jv = r.jv.id; iv.st = 'issued'; iv.issued = date; iv.due = addDays(date, iv.terms);
    iv.lines.forEach(function (l) { var b = l.br && M.brRec(l.br); if (b) b.st = 'invoiced'; });
    iv.log.push({ at: nowS(), by: empId(ctx), to: 'issued' }); M.audit('INVOICE.ISSUE', ctx, { rec: id, to: iv.total }); save();
    return { ok: true, inv: iv, jv: r.jv };
  };
  // Cancel: a draft simply releases its lines; an issued invoice without payments is reversed (never deleted).
  M.invCancel = function (ctx, id, reason) {
    if (!can(ctx, 'ar.issue')) return deny(ctx, id);
    var iv = M.invoice(id); if (!iv) return bad(M.MSG.notfound, 'notfound'); if (!str(reason)) return bad(M.MSG.reason, 'reason');
    if (iv.st === 'cancelled') return bad(M.MSG.jump, 'jump');
    if (M.paidOf(iv) > 0) return bad(L('Invoice sudah dibayar sebagian. Buat nota kredit.', 'The invoice is partly paid. Create a credit note.'), 'paid');
    if (iv.jv) { var j = M.jv(iv.jv); var rr = M.reverse(Object.assign({}, ctx, { perms: (ctx.perms || []).concat(['fin.gl.reverse']) }), iv.jv, reason); if (!rr.ok) return rr; }
    iv.lines.forEach(function (l) { var b = l.br && M.brRec(l.br); if (b) { b.st = 'unbilled'; b.inv = null; } });
    var from = M.invSt(iv); iv.st = 'cancelled'; iv.cancelWhy = reason; iv.log.push({ at: nowS(), by: empId(ctx), to: 'cancelled', reason: reason });
    M.audit('INVOICE.CANCEL', ctx, { rec: id, from: from, to: 'cancelled', reason: reason }); save();
    return { ok: true, inv: iv };
  };
  // Payment (§12): partial allowed, never above the open balance.
  M.recordPayment = function (ctx, id, o) {
    if (!can(ctx, 'ar.pay')) return deny(ctx, id);
    var iv = M.invoice(id); if (!iv) return bad(M.MSG.notfound, 'notfound');
    if (['issued', 'partial', 'overdue'].indexOf(M.invSt(iv)) < 0) return bad(M.MSG.jump, 'jump');
    var amt = num(o && o.amt); if (amt == null || isNaN(amt) || amt <= 0) return bad(M.MSG.invalid);
    amt = Math.round(amt); if (amt > M.openOf(iv)) return bad(M.MSG.over, 'over');
    var acc = M.cashAcc(o.acc || 'ACC-01'); if (!acc) return bad(M.MSG.invalid);
    var date = o.date || M.today(), p = { id: nid('pay', 'PAY-' + date.slice(2, 4) + date.slice(5, 7) + '-', 3), inv: id, date: date, amt: amt, acc: acc.id, ref: str(o.ref) || null, by: empId(ctx), at: nowS(), jv: null };
    var r = postJ({ date: date, desc: L('Pembayaran ' + iv.id + ' · ' + M.clientName(iv.cl), 'Payment ' + iv.id + ' · ' + M.clientName(iv.cl)), src: { t: 'pay', id: p.id }, ref: p.ref || iv.id, by: empId(ctx), lines: [{ a: acc.coa, d: amt }, { a: '1200', c: amt }] }, ctx);
    if (!r.ok) return r;
    p.jv = r.jv.id; S().pays.push(p);
    var c = S().coll[id]; if (c) { c.outcome = M.openOf(iv) <= 0 ? 'paid' : 'partial'; c.last = date; c.notes = c.notes || []; c.notes.push([date, empId(ctx), L('Pembayaran diterima ' + amt, 'Payment received ' + amt)]); }
    iv.log.push({ at: nowS(), by: empId(ctx), to: M.invSt(iv), amt: amt }); M.audit('PAYMENT.RECORD', ctx, { rec: id, to: amt }); save();
    return { ok: true, pay: p, inv: iv, st: M.invSt(iv) };
  };
  M.paymentsOf = function (id) { return S().pays.filter(function (p) { return p.inv === id; }); };

  /* ---------- AR aging, DSO, collection (§15–§16) ---------- */
  function bucket(days) { return days <= 0 ? 'current' : days <= 30 ? 'b30' : days <= 60 ? 'b60' : days <= 90 ? 'b90' : 'b90p'; }
  M.bucket = bucket;
  M.aging = function (ctx, o) {
    if (!can(ctx, 'ar.view')) return null;
    o = o || {};
    var today = M.today(), rows = S().inv.filter(function (iv) { return ['issued', 'partial', 'overdue'].indexOf(M.invSt(iv)) >= 0; }).map(function (iv) {
      var od = dayDiff(iv.due, today); return { inv: iv, open: M.openOf(iv), days: od, b: bucket(od) };
    });
    var tot = {}; M.AGING.forEach(function (b) { tot[b[0]] = 0; });
    rows.forEach(function (r) { tot[r.b] += r.open; });
    var byCl = {}; rows.forEach(function (r) { var c = byCl[r.inv.cl] = byCl[r.inv.cl] || { cl: r.inv.cl, total: 0, b: {} }; c.total += r.open; c.b[r.b] = (c.b[r.b] || 0) + r.open; });
    var total = sum(rows.map(function (r) { return r.open; })), overdue = total - tot.current;
    var largest = rows.slice().sort(function (a, b) { return b.open - a.open; })[0] || null;
    return { rows: rows.sort(function (a, b) { return b.days - a.days; }), tot: tot, total: total, overdue: overdue, overduePct: pct(overdue, total), largest: largest, byCl: Object.keys(byCl).map(function (k) { return byCl[k]; }).sort(function (a, b) { return b.total - a.total; }),
      dso: M.dso().v, coll: M.collRate(), exp: M.expectedColl(30) };
  };
  // DSO (§68): average month-end AR (billed + unbilled) over the last 3 closed months ÷ credit revenue × days.
  M.dso = function (endP) {
    endP = endP || M.lastClosed();
    var ps = [mAdd(endP, -2), mAdd(endP, -1), endP], ar = ps.map(function (p) { return M.natural('1200', mEnd(p)) + M.natural('1210', mEnd(p)); });
    var rev = sum(ps.map(function (p) { return M.pl(p + '-01', mEnd(p)).revenue; })), days = sum(ps.map(function (p) { return +mEnd(p).slice(8); }));
    var avg = sum(ar) / 3;
    return { v: rev ? r1(avg / rev * days) : null, avgAr: avg, rev: rev, days: days, periods: ps };
  };
  // Collection rate: client receipts ÷ AR due in the last closed month (cash basis from the ledger).
  M.collRate = function (p) {
    p = p || M.lastClosed();
    var rec = sum(S().jv.filter(function (j) { return live(j) && j.period === p && (j.src.t === 'pay' || (j.src.t === 'sum' && /Penerimaan klien/.test(T(j.desc)))); }).map(function (j) { return sum(j.lines.filter(function (l) { return l.a === '1200'; }).map(function (l) { return l.c; })); }));
    var due = M.natural('1200', mEnd(mAdd(p, -1))) || 1;
    return r1(Math.min(100, rec / due * 100));
  };
  // Expected collection: the client's own payment behaviour (average days late from payment history) shifts the due date.
  M.clientDelay = function (cl) {
    var hist = (PD && PD.FIN ? PD.FIN.payments : []).filter(function (p) { return p.cl === cl; });
    if (hist.length) return Math.max(0, Math.round(sum(hist.map(function (p) { return p.days; })) / hist.length));
    return 5;
  };
  M.expectedDate = function (iv) {
    var c = S().coll[iv.id], today = M.today();
    if (c && c.ptp && c.ptp.date >= today) return c.ptp.date;
    var d = addDays(iv.due, M.clientDelay(iv.cl));
    return d < today ? addDays(today, Math.min(30, Math.max(3, dayDiff(iv.due, today) > 60 ? 21 : 7))) : d;
  };
  M.expectedColl = function (days) {
    var lim = addDays(M.today(), days);
    return sum(S().inv.filter(function (iv) { return ['issued', 'partial', 'overdue'].indexOf(M.invSt(iv)) >= 0 && M.expectedDate(iv) <= lim; }).map(function (iv) { var c = S().coll[iv.id]; return c && c.ptp && c.ptp.date <= lim ? Math.min(c.ptp.amt, M.openOf(iv)) : M.openOf(iv); }));
  };
  M.collection = function (id) { var c = S().coll[id]; if (!c) { c = S().coll[id] = { pic: null, last: null, next: null, act: null, outcome: null, esc: false, notes: [] }; } return c; };
  M.COLL_ACTS = { assign: L('Tetapkan PIC', 'Assign PIC'), follow: L('Follow-up', 'Follow-up'), ptp: L('Janji Bayar', 'Promise to Pay'), remind: L('Kirim Pengingat', 'Send Reminder'), escalate: L('Eskalasi', 'Escalate'), note: L('Catatan', 'Note'), attach: L('Lampiran', 'Attachment') };
  M.collect = function (ctx, id, act, o) {
    if (!can(ctx, 'ar.collect')) return deny(ctx, id);
    var iv = M.invoice(id); if (!iv) return bad(M.MSG.notfound, 'notfound');
    if (['issued', 'partial', 'overdue'].indexOf(M.invSt(iv)) < 0) return bad(M.MSG.jump, 'jump');
    o = o || {}; var c = M.collection(id), today = M.today(), who = empId(ctx);
    if (act === 'assign') { if (!o.pic) return bad(M.MSG.invalid); c.pic = o.pic; c.notes.push([today, who, L('PIC: ' + M.empName(o.pic), 'PIC: ' + M.empName(o.pic))]); }
    else if (act === 'follow') { if (!str(o.note)) return bad(M.MSG.invalid); c.last = today; c.next = o.next || addDays(today, 3); c.act = o.act || c.act; c.outcome = o.outcome || 'contacted'; c.notes.push([today, who, str(o.note)]); }
    else if (act === 'ptp') { var a = num(o.amt); if (!o.date || a == null || isNaN(a) || a <= 0 || a > M.openOf(iv)) return bad(M.MSG.invalid); if (o.date < today) return bad(L('Tanggal janji bayar tidak boleh lewat.', 'The promise date cannot be in the past.')); c.ptp = { date: o.date, amt: Math.round(a) }; c.outcome = 'ptp'; c.last = today; c.next = o.date; c.notes.push([today, who, L('Janji bayar ' + o.date, 'Promise to pay ' + o.date)]); }
    else if (act === 'remind') { c.last = today; c.reminded = (c.reminded || 0) + 1; c.notes.push([today, who, L('Pengingat pembayaran ke-' + c.reminded + ' dikirim ke ' + M.clientName(iv.cl), 'Payment reminder #' + c.reminded + ' sent to ' + M.clientName(iv.cl))]); }
    else if (act === 'escalate') { if (!str(o.note)) return bad(M.MSG.reason, 'reason'); c.esc = true; c.notes.push([today, who, L('Eskalasi: ' + str(o.note), 'Escalation: ' + str(o.note))]); M.notify('cfo.view', 'aresc', id, { cl: iv.cl, amt: M.openOf(iv) }); }
    else if (act === 'note') { if (!str(o.note)) return bad(M.MSG.invalid); c.notes.push([today, who, str(o.note)]); }
    else if (act === 'attach') { if (!str(o.name)) return bad(M.MSG.invalid); c.files = c.files || []; c.files.push({ name: str(o.name), at: today, by: who }); c.notes.push([today, who, L('Lampiran: ' + str(o.name), 'Attachment: ' + str(o.name))]); }
    else return bad(M.MSG.invalid);
    M.audit('COLLECTION.' + act.toUpperCase(), ctx, { rec: id, to: o.note || o.date || o.pic || null }); save();
    return { ok: true, coll: c };
  };

  /* ---------- NP-02 cash & treasury (§8–§11) ---------- */
  M.cashAccs = function () { return D.CASH_ACC; };
  M.cashAcc = function (id) { return by(D.CASH_ACC, 'id', id) || by(D.CASH_ACC, 'coa', id); };
  M.accBal = function (id, to) { var a = M.cashAcc(id); return a ? M.natural(a.coa, to) : 0; };
  M.accOpening = function (id, p) { p = p || M.curPeriod(); return M.accBal(id, addDays(p + '-01', -1)); };
  M.cashTx = function (id) { return by(S().cashTx, 'id', id); };
  M.cashList = function (ctx, f) {
    if (!can(ctx, 'cash.view')) return [];
    f = f || {};
    return S().cashTx.filter(function (t) { return (!f.acc || t.acc === f.acc || t.to === f.acc) && (!f.type || t.type === f.type) && (!f.st || t.st === f.st); }).sort(function (a, b) { return a.date < b.date ? 1 : a.date > b.date ? -1 : (a.id < b.id ? 1 : -1); });
  };
  // Every movement on a cash account, from the ledger (cash tx, client payments, AP payments, summaries).
  M.accMoves = function (id, from, to) { var a = M.cashAcc(id); return a ? M.ledger(a.coa, from || (M.curPeriod() + '-01'), to) : null; };
  function cashJournal(t) {
    var A = M.cashAcc(t.acc), B = t.to ? M.cashAcc(t.to) : null, desc = Array.isArray(t.note) ? t.note : L(t.note || t.id, t.note || t.id), lines;
    if (t.type === 'transfer' || t.type === 'deposit' || t.type === 'withdraw') lines = [{ a: B.coa, d: t.amt }, { a: A.coa, c: t.amt }];
    else if (t.type === 'in' || (t.type === 'adjust' && t.dir === 'in')) lines = [{ a: A.coa, d: t.amt }, { a: t.coa, c: t.amt, cc: t.cc }];
    else lines = [{ a: t.coa, d: t.amt, cc: t.cc }, { a: A.coa, c: t.amt }];
    return { date: t.date, desc: desc, src: { t: 'cash', id: t.id }, ref: t.ref, by: t.pic, appr: t.appr, lines: lines };
  }
  M.cashJournal = cashJournal;
  // Record a cash transaction (§9): evidence required for cash out; large amounts wait for approval.
  M.addCashTx = function (ctx, o) {
    if (!can(ctx, 'cash.tx')) return deny(ctx, 'cash');
    o = o || {};
    var amt = num(o.amt), A = M.cashAcc(o.acc), type = o.type;
    if (!M.TX_TYPES[type] || !A || amt == null || isNaN(amt) || amt <= 0) return bad(M.MSG.invalid);
    amt = Math.round(amt);
    var needTo = ['transfer', 'deposit', 'withdraw'].indexOf(type) >= 0, B = needTo ? M.cashAcc(o.to) : null;
    if (needTo && (!B || B.id === A.id)) return bad(L('Pilih rekening tujuan yang berbeda.', 'Choose a different destination account.'));
    if (!needTo && !M.acc(o.coa)) return bad(L('Pilih akun lawan.', 'Choose the counter account.'));
    if ((type === 'out' || type === 'adjust') && !str(o.ev)) return bad(L('Bukti wajib untuk kas keluar dan penyesuaian.', 'Evidence is required for cash out and adjustments.'), 'evidence');
    if (type === 'adjust' && !str(o.reason)) return bad(M.MSG.reason, 'reason');
    var out = type === 'out' || needTo || (type === 'adjust' && o.dir !== 'in');
    if (out && M.accBal(A.id) < amt) return bad(M.MSG.funds, 'funds');
    var date = o.date || M.today();
    var t = { id: nid('ct', 'CT-' + date.slice(2, 4) + date.slice(5, 7) + '-', 3), date: date, type: type, dir: o.dir || null, acc: A.id, to: B ? B.id : null, cat: o.cat || (needTo ? 'transfer' : 'other'), amt: amt, ref: str(o.ref) || null, cc: o.cc || null, pic: empId(ctx), coa: needTo ? null : o.coa,
      note: str(o.note) ? L(str(o.note), str(o.note)) : L(T(M.TX_TYPES[type][0]), M.TX_TYPES[type][0][1]), ev: str(o.ev) || null, reason: o.reason || null, appr: null, st: 'pending', jv: null };
    S().cashTx.push(t);
    if (out && amt > S().cfg.cashApprove && type !== 'transfer') { M.audit('CASH.SUBMIT', ctx, { rec: t.id, to: amt }); M.notify('cash.approve', 'cashappr', t.id, { amt: amt }); save(); return { ok: true, tx: t, pending: true }; }
    return postCash(ctx, t);
  };
  function postCash(ctx, t) {
    t.appr = t.appr || empId(ctx);
    var r = postJ(cashJournal(t), ctx, {}); if (!r.ok) { t.st = 'pending'; return r; }
    t.jv = r.jv.id; t.st = 'posted'; M.audit('CASH.POST', ctx, { rec: t.id, to: t.amt }); save();
    return { ok: true, tx: t, jv: r.jv };
  }
  M.approveCash = function (ctx, id, ok, reason) {
    if (!can(ctx, 'cash.approve')) return deny(ctx, id);
    var t = M.cashTx(id); if (!t || t.st !== 'pending') return bad(M.MSG.jump, 'jump');
    if (t.pic === empId(ctx)) return bad(M.MSG.maker, 'maker');
    if (!ok) { if (!str(reason)) return bad(M.MSG.reason, 'reason'); t.st = 'rejected'; t.reason = reason; M.audit('CASH.REJECT', ctx, { rec: id, reason: reason }); save(); return { ok: true, tx: t }; }
    t.appr = empId(ctx); return postCash(ctx, t);
  };
  // Treasury (§10)
  M.treasury = function (ctx, horizon) {
    if (!can(ctx, 'cash.view')) return null;
    var accs = D.CASH_ACC.map(function (a) { var b = M.accBal(a.id); return { a: a, bal: b, restricted: !!a.restricted }; });
    var total = sum(accs.map(function (x) { return x.bal; })), bank = sum(accs.filter(function (x) { return x.a.bank; }).map(function (x) { return x.bal; })), restricted = sum(accs.filter(function (x) { return x.restricted; }).map(function (x) { return x.bal; }));
    var avail = total - restricted, committed = M.committed(30), free = avail - committed.total;
    var H = { today: 0, d7: 7, d30: 30, d90: 90 }, per = {};
    Object.keys(H).forEach(function (k) { var f = M.forecast(ctx, H[k]); per[k] = { inflow: f.base.inflow, outflow: f.base.outflow, close: f.base.close }; });
    return { accs: accs, total: total, bank: bank, cash: total - bank, restricted: restricted, avail: avail, committed: committed.total, commitLines: committed.lines, free: free, per: per, asOf: nowS() };
  };
  // Committed cash: approved AP due in the window, approved POs not yet invoiced, approved capex.
  M.committed = function (days) {
    var lim = addDays(M.today(), days), lines = [];
    S().exp.forEach(function (e) { if (['approved', 'scheduled', 'partial'].indexOf(e.st) >= 0 && e.due <= lim) lines.push({ k: 'ap', id: e.id, n: e.desc, amt: e.amt + e.tax - e.paid, date: e.due }); });
    if (M.poCommitments) M.poCommitments().forEach(function (c) { if (c.date <= lim) lines.push(c); });
    return { total: sum(lines.map(function (l) { return l.amt; })), lines: lines };
  };
  // Cash forecast (§11): best / base / worst with every assumption visible.
  M.forecast = function (ctx, days) {
    if (!can(ctx, 'cash.view')) return null;
    days = days == null ? 30 : days;
    var today = M.today(), lim = addDays(today, days), cf = S().cfg.coll, start = sum(D.CASH_ACC.filter(function (a) { return !a.restricted; }).map(function (a) { return M.accBal(a.id); }));
    var inflow = [], outflow = [];
    S().inv.forEach(function (iv) { var s0 = M.invSt(iv); if (['issued', 'partial', 'overdue'].indexOf(s0) < 0) return; var d = M.expectedDate(iv); inflow.push({ k: 'ar', id: iv.id, n: L('AR ' + M.clientName(iv.cl), 'AR ' + M.clientName(iv.cl)), date: d, amt: M.openOf(iv), od: dayDiff(iv.due, today), cl: iv.cl }); });
    // Unbilled Billing Ready: invoiced on the 1st of next month, collected after the client terms.
    var unb = sum(S().br.filter(function (b) { return b.st !== 'invoiced'; }).map(function (b) { return M.brAmount(b) * 1.11; }));
    if (unb) inflow.push({ k: 'unb', id: null, n: L('Billing Ready belum ditagih', 'Unbilled Billing Ready'), date: addDays(mEnd(M.curPeriod()), 31), amt: Math.round(unb) });
    S().exp.forEach(function (e) { if (['received', 'verify', 'approved', 'scheduled', 'partial', 'hold'].indexOf(e.st) < 0) return; if (e.dupOf) return; outflow.push({ k: 'ap', id: e.id, n: e.desc, date: e.sched ? e.sched.date : e.due < today ? today : e.due, amt: e.amt + e.tax - e.paid, cat: e.cat }); });
    D.RECURRING.forEach(function (r) {
      for (var m = 0; m < 4; m++) {
        var p = mAdd(M.curPeriod(), m), d = p + '-' + String(r[2]).padStart(2, '0');
        if (d < today || d > lim) continue;
        if (outflow.some(function (o) { return o.k === 'ap' && o.cat === ({ bpjs: 'payroll', tax: 'tax', elec: 'utility', water: 'utility', fuel: 'fuel', chem: 'chemical' }[r[0]]) && ym(o.date) === p; })) continue;
        outflow.push({ k: 'rec', id: r[0], n: r[1], date: d, amt: Math.round(r[3] * JT), cat: r[0] });
      }
    });
    if (M.poCommitments) M.poCommitments().forEach(function (c) { if (!outflow.some(function (o) { return o.id === c.id; })) outflow.push(Object.assign({ k: 'po' }, c)); });
    function scen(k) {
      var inn = sum(inflow.map(function (x) {
        if (k === 'best') return x.date <= lim || (x.k === 'ar' && x.od > 0 && addDays(today, 7) <= lim) ? x.amt * cf.bestShare : 0;
        if (k === 'worst') { var d = x.k === 'ar' && x.od > 0 ? addDays(x.date, cf.worstDelay) : x.date; return d <= lim ? x.amt * (x.od > 0 ? cf.worstShare : 1) : 0; }
        return x.date <= lim ? x.amt : 0;
      }));
      var f = k === 'best' ? 1 + cf.costBest : k === 'worst' ? 1 + cf.costWorst : 1;
      var out = sum(outflow.filter(function (x) { return x.date <= lim; }).map(function (x) { return x.amt * (x.k === 'rec' ? f : 1); }));
      return { inflow: Math.round(inn), outflow: Math.round(out), close: Math.round(start + inn - out) };
    }
    return { days: days, start: start, from: today, to: lim, inflow: inflow.sort(function (a, b) { return a.date < b.date ? -1 : 1; }), outflow: outflow.sort(function (a, b) { return a.date < b.date ? -1 : 1; }), best: scen('best'), base: scen('base'), worst: scen('worst'),
      assume: [
        L('Base: AR masuk pada tanggal jatuh tempo + rata-rata keterlambatan klien, atau tanggal janji bayar.', 'Base: AR arrives on the due date + the client\'s average delay, or on the promise date.'),
        L('Best: semua AR jatuh tempo masuk ' + Math.round(cf.bestShare * 100) + '%, biaya rutin ' + Math.round(cf.costBest * 100) + '%.', 'Best: all due AR arrives ' + Math.round(cf.bestShare * 100) + '%, recurring cost ' + Math.round(cf.costBest * 100) + '%.'),
        L('Worst: AR lewat jatuh tempo mundur ' + cf.worstDelay + ' hari dan hanya ' + Math.round(cf.worstShare * 100) + '% tertagih, biaya rutin +' + Math.round(cf.costWorst * 100) + '%.', 'Worst: overdue AR slips ' + cf.worstDelay + ' days and only ' + Math.round(cf.worstShare * 100) + '% is collected, recurring cost +' + Math.round(cf.costWorst * 100) + '%.'),
        L('Billing Ready bulan ini ditagih tanggal 1 bulan depan dan dibayar sesuai termin (30 hari).', 'This month\'s Billing Ready is invoiced on the 1st of next month and paid on terms (30 days).'),
        L('Kas awal: semua rekening kecuali rekening dibatasi (payroll reserve, deposito jaminan).', 'Opening cash: all accounts except restricted ones (payroll reserve, guarantee deposit).')
      ] };
  };
  M.setForecastCfg = function (ctx, o) {
    if (!can(ctx, 'cash.view') || !can(ctx, 'cfo.th')) return deny(ctx, 'forecast');
    var c = S().cfg.coll, from = JSON.stringify(c);
    ['worstDelay', 'worstShare', 'bestShare', 'costBest', 'costWorst'].forEach(function (k) { if (o[k] != null && !isNaN(+o[k])) c[k] = +o[k]; });
    M.audit('FORECAST.ASSUMPTION', ctx, { rec: 'CASH-004', from: from, to: JSON.stringify(c) }); save(); return { ok: true, cfg: c };
  };

  /* ---------- NP-04 expenses, AP, payment control (§17–§20) ---------- */
  M.expense = function (id) { return by(S().exp, 'id', id); };
  M.expSt = function (e) {
    if (['received', 'verify', 'hold', 'rejected'].indexOf(e.st) >= 0) return e.st;
    var open = e.amt + e.tax - e.paid;
    if (open <= 0) return 'paid';
    if (dayDiff(e.due, M.today()) > 0) return 'overdue';
    return e.paid > 0 ? 'partial' : e.st;
  };
  M.expenses = function (ctx, f) {
    if (!can(ctx, 'ap.view')) return [];
    f = f || {};
    return S().exp.filter(function (e) { var s0 = M.expSt(e); return (!f.st || s0 === f.st || (f.st === 'open' && ['approved', 'scheduled', 'partial', 'overdue'].indexOf(s0) >= 0)) && (!f.sup || e.sup === f.sup) && (!f.cat || e.cat === f.cat); })
      .sort(function (a, b) { return a.date < b.date ? 1 : -1; });
  };
  // Duplicate detection (§20): supplier + invoice number, or supplier + amount within N days, or the same PO.
  M.dupCheck = function (o, selfId) {
    var hits = [];
    S().exp.forEach(function (e) {
      if (e.id === selfId || e.st === 'rejected') return;
      var why = [];
      if (o.sup && e.sup === o.sup && str(o.sinv) && str(e.sinv).toLowerCase() === str(o.sinv).toLowerCase()) why.push(L('Nomor invoice sama', 'Same invoice number'));
      if (o.sup && e.sup === o.sup && Math.round(o.amt) === e.amt && Math.abs(dayDiff(e.date, o.date || M.today())) <= S().cfg.dupDays) why.push(L('Supplier & nilai sama dalam ' + S().cfg.dupDays + ' hari', 'Same supplier & amount within ' + S().cfg.dupDays + ' days'));
      if (o.po && e.po === o.po && e.amt === Math.round(o.amt)) why.push(L('PO dan nilai sama', 'Same PO and amount'));
      if (o.ref && e.sinv && str(o.ref) === str(e.sinv) && e.sup === o.sup) why.push(L('Referensi sama', 'Same reference'));
      if (why.length) hits.push({ exp: e, why: why });
    });
    return hits;
  };
  M.enterExpense = function (ctx, o) {
    if (!can(ctx, 'ap.enter')) return deny(ctx, 'expense');
    o = o || {};
    var amt = num(o.amt), tax = num(o.tax) || 0;
    if (!o.cat || !o.date || !o.due || amt == null || isNaN(amt) || amt <= 0 || !M.acc(o.coa)) return bad(M.MSG.invalid);
    if (!str(o.ev)) return bad(L('Bukti / dokumen wajib.', 'Evidence / document is required.'), 'evidence');
    var e = { id: nid('exp', 'EXP-' + M.today().slice(2, 4) + M.today().slice(5, 7) + '-', 3), src: o.src || (o.sup ? 'supinv' : 'opex'), sup: o.sup || null, sinv: str(o.sinv) || null, date: o.date, cat: o.cat, cc: o.cc || null, plant: o.plant || 'PL-01', amt: Math.round(amt), tax: Math.round(tax), due: o.due,
      po: o.po || null, grn: o.grn || null, st: 'received', coa: String(o.coa), desc: str(o.desc) ? L(str(o.desc), str(o.desc)) : L(T(D.EXP_CATS[o.cat] || o.cat), T(D.EXP_CATS[o.cat] || o.cat)), paid: 0, by: empId(ctx), appr: null, sched: null, jv: null, match: null, hold: null, ovr: null, ev: str(o.ev), log: [{ at: nowS(), by: empId(ctx), to: 'received' }] };
    var dup = M.dupCheck(e);
    if (dup.length) {
      if (!o.override) return bad(M.MSG.dup, 'dup', { dup: dup });
      if (!can(ctx, 'ap.override')) return deny(ctx, 'dup-override');
      if (!str(o.reason)) return bad(M.MSG.reason, 'reason');
      e.ovr = { by: empId(ctx), at: nowS(), reason: o.reason, of: dup.map(function (d) { return d.exp.id; }) }; M.audit('AP.DUP.OVERRIDE', ctx, { rec: e.id, to: e.ovr.of.join(','), reason: o.reason });
    }
    S().exp.unshift(e); M.audit('EXPENSE.ENTER', ctx, { rec: e.id, to: e.amt }); save();
    return { ok: true, exp: e };
  };
  // Verification: three-way match for PO-backed invoices (§51); other expenses need evidence only.
  M.verifyExpense = function (ctx, id, o) {
    if (!can(ctx, 'ap.verify')) return deny(ctx, id);
    var e = M.expense(id); if (!e) return bad(M.MSG.notfound, 'notfound'); if (['received', 'verify'].indexOf(e.st) < 0) return bad(M.MSG.jump, 'jump');
    o = o || {};
    var m = e.po && M.match3 ? M.match3(e) : null; e.match = m;
    var dup = M.dupCheck(e, e.id); e.dupOf = dup.length && !e.ovr ? dup[0].exp.id : null;
    if (e.dupOf) { e.st = 'verify'; save(); return bad(M.MSG.dup, 'dup', { dup: dup }); }
    if (m && !m.ok && !str(o.reason)) { e.st = 'verify'; save(); return bad(L('Three-way match berbeda. Review dan isi alasan untuk melanjutkan.', 'The three-way match differs. Review and enter a reason to continue.'), 'match', { match: m }); }
    if (m && !m.ok) e.matchOk = { by: empId(ctx), at: nowS(), reason: o.reason };
    e.st = 'verify'; e.verified = { by: empId(ctx), at: nowS() }; e.log.push({ at: nowS(), by: empId(ctx), to: 'verified' });
    M.audit('EXPENSE.VERIFY', ctx, { rec: id, to: m ? (m.ok ? 'match' : 'diff') : 'ok', reason: o.reason }); save();
    return { ok: true, exp: e, match: m };
  };
  function apJournal(e) {
    if (isLiabCoa(e.coa)) return null;   // payroll / tax obligations already accrued: the payment debits the liability directly
    var lines = [{ a: e.coa, d: e.amt, cc: e.cc }].concat(e.tax ? [{ a: '1410', d: e.tax }] : []).concat([{ a: '2100', c: e.amt + e.tax }]);
    if (e.match && e.match.diffAmt && e.coa === '2150') { lines[0].d = e.match.grni; lines.splice(1, 0, { a: '5100', d: e.amt - e.match.grni, cc: e.cc, memo: 'price variance' }); }
    return { date: e.date < '2026-09-01' ? e.date : e.date, desc: L('AP ' + (e.sinv || e.id) + ' · ' + (e.sup && M.supName ? M.supName(e.sup) : T(e.desc)), 'AP ' + (e.sinv || e.id) + ' · ' + (e.sup && M.supName ? M.supName(e.sup) : (Array.isArray(e.desc) ? e.desc[1] : e.desc))), src: { t: 'ap', id: e.id }, ref: e.sinv, by: e.by, appr: e.appr, lines: lines };
  }
  M.apJournal = apJournal;
  M.approveExpense = function (ctx, id) {
    if (!can(ctx, 'ap.approve')) return deny(ctx, id);
    var e = M.expense(id); if (!e) return bad(M.MSG.notfound, 'notfound');
    if (e.st !== 'verify' || !e.verified) return bad(L('Biaya harus diverifikasi dulu.', 'The expense must be verified first.'), 'jump');
    if (e.dupOf && !e.ovr) return bad(M.MSG.dup, 'dup');
    if (e.amt + e.tax > S().cfg.apMaker && e.by === empId(ctx)) return bad(M.MSG.maker, 'maker');
    var o = apJournal(e);
    if (o) { o.date = M.perSt(e.date) === 'open' ? e.date : M.today(); o.by = e.by; o.appr = empId(ctx); var r = postJ(o, ctx); if (!r.ok) return r; e.jv = r.jv.id; }
    e.st = 'approved'; e.appr = empId(ctx); e.apprAt = nowS(); e.log.push({ at: nowS(), by: empId(ctx), to: 'approved' });
    M.audit('EXPENSE.APPROVE', ctx, { rec: id, to: e.amt + e.tax }); save();
    return { ok: true, exp: e };
  };
  M.rejectExpense = function (ctx, id, reason) {
    if (!can(ctx, 'ap.approve')) return deny(ctx, id);
    var e = M.expense(id); if (!e || ['received', 'verify', 'hold'].indexOf(e.st) < 0) return bad(M.MSG.jump, 'jump'); if (!str(reason)) return bad(M.MSG.reason, 'reason');
    e.st = 'rejected'; e.rejWhy = reason; e.log.push({ at: nowS(), by: empId(ctx), to: 'rejected', reason: reason }); M.audit('EXPENSE.REJECT', ctx, { rec: id, reason: reason }); save();
    return { ok: true, exp: e };
  };
  M.holdExpense = function (ctx, id, on, reason) {
    if (!can(ctx, 'ap.approve') && !can(ctx, 'ap.pay')) return deny(ctx, id);
    var e = M.expense(id); if (!e) return bad(M.MSG.notfound, 'notfound');
    if (on) { if (!str(reason)) return bad(M.MSG.reason, 'reason'); if (['paid', 'rejected', 'hold'].indexOf(M.expSt(e)) >= 0) return bad(M.MSG.jump, 'jump'); e.hold = { from: e.st, by: empId(ctx), at: nowS(), reason: reason }; e.st = 'hold'; }
    else { if (e.st !== 'hold') return bad(M.MSG.jump, 'jump'); e.st = e.hold.from; e.hold = null; }
    M.audit(on ? 'EXPENSE.HOLD' : 'EXPENSE.UNHOLD', ctx, { rec: id, reason: reason }); save();
    return { ok: true, exp: e };
  };
  M.scheduleExpense = function (ctx, id, date, acc) {
    if (!can(ctx, 'ap.pay')) return deny(ctx, id);
    var e = M.expense(id); if (!e) return bad(M.MSG.notfound, 'notfound'); if (['approved', 'scheduled', 'partial'].indexOf(e.st) < 0 && M.expSt(e) !== 'overdue') return bad(M.MSG.jump, 'jump');
    if (!date || !M.cashAcc(acc)) return bad(M.MSG.invalid);
    e.sched = { date: date, acc: M.cashAcc(acc).id, by: empId(ctx) }; e.st = 'scheduled'; e.log.push({ at: nowS(), by: empId(ctx), to: 'scheduled' });
    M.audit('PAYMENT.APPROVE', ctx, { rec: id, to: date + ' · ' + acc }); save();
    return { ok: true, exp: e };
  };
  // Pay (§19–§20): only approved or scheduled; warns again before a duplicate payment; override needs permission and reason.
  M.payExpense = function (ctx, id, o) {
    if (!can(ctx, 'ap.pay')) return deny(ctx, id);
    o = o || {};
    var e = M.expense(id); if (!e) return bad(M.MSG.notfound, 'notfound');
    if (['approved', 'scheduled', 'partial'].indexOf(e.st) < 0) return bad(L('Hanya biaya yang disetujui yang bisa dibayar.', 'Only approved expenses can be paid.'), 'jump');
    var open = e.amt + e.tax - e.paid, amt = o.amt == null || o.amt === '' ? open : Math.round(num(o.amt));
    if (!amt || isNaN(amt) || amt <= 0) return bad(M.MSG.invalid); if (amt > open) return bad(M.MSG.over, 'over');
    var acc = M.cashAcc(o.acc || (e.sched && e.sched.acc) || 'ACC-01'); if (!acc) return bad(M.MSG.invalid);
    if (M.accBal(acc.id) < amt) return bad(M.MSG.funds, 'funds');
    var paidDup = S().exp.filter(function (x) { return x.id !== e.id && x.sup && x.sup === e.sup && x.sinv && e.sinv && str(x.sinv).toLowerCase() === str(e.sinv).toLowerCase() && x.paid > 0; });
    if (paidDup.length && !o.override) return bad(M.MSG.dup, 'dup', { dup: paidDup.map(function (x) { return { exp: x, why: [L('Invoice ini sudah pernah dibayar', 'This invoice was already paid')] }; }) });
    if (paidDup.length) { if (!can(ctx, 'ap.override')) return deny(ctx, 'dup-override'); if (!str(o.reason)) return bad(M.MSG.reason, 'reason'); M.audit('AP.DUP.OVERRIDE', ctx, { rec: id, reason: o.reason }); }
    var date = o.date || M.today(), p = { id: nid('apay', 'APAY-' + date.slice(2, 4) + date.slice(5, 7) + '-', 3), exp: id, date: date, amt: amt, acc: acc.id, by: empId(ctx), at: nowS(), jv: null };
    var debit = isLiabCoa(e.coa) ? e.coa : '2100';
    var r = postJ({ date: date, desc: L('Bayar ' + (e.sinv || e.id) + (e.sup && M.supName ? ' · ' + M.supName(e.sup) : ''), 'Pay ' + (e.sinv || e.id) + (e.sup && M.supName ? ' · ' + M.supName(e.sup) : '')), src: { t: 'apay', id: p.id }, ref: e.sinv, by: empId(ctx), lines: [{ a: debit, d: amt }, { a: acc.coa, c: amt }] }, ctx);
    if (!r.ok) return r;
    p.jv = r.jv.id; S().apays.push(p); e.paid += amt; if (e.paid >= e.amt + e.tax) e.st = 'paid'; else e.st = 'partial';
    e.log.push({ at: nowS(), by: empId(ctx), to: e.st, amt: amt }); M.audit('PAYMENT.RECORD', ctx, { rec: id, to: amt }); save();
    return { ok: true, pay: p, exp: e };
  };
  M.apPaymentsOf = function (id) { return S().apays.filter(function (p) { return p.exp === id; }); };
  M.apAging = function (ctx) {
    if (!can(ctx, 'ap.view')) return null;
    var today = M.today(), rows = S().exp.filter(function (e) { return ['approved', 'scheduled', 'partial', 'hold', 'received', 'verify'].indexOf(e.st) >= 0 && e.amt + e.tax - e.paid > 0; }).map(function (e) {
      var d = dayDiff(e.due, today); return { exp: e, open: e.amt + e.tax - e.paid, days: d, b: d <= 0 ? (dayDiff(today, e.due) <= 7 ? 'd7' : dayDiff(today, e.due) <= 30 ? 'd30' : 'later') : 'overdue', booked: !!e.jv || isLiabCoa(e.coa) && ['approved', 'scheduled', 'partial'].indexOf(e.st) >= 0 };
    });
    var B = { overdue: 0, d7: 0, d30: 0, later: 0 }; rows.forEach(function (r) { B[r.b] += r.open; });
    var bySup = {}; rows.forEach(function (r) { var k = r.exp.sup || r.exp.cat; var x = bySup[k] = bySup[k] || { k: k, sup: r.exp.sup, total: 0, n: 0 }; x.total += r.open; x.n++; });
    return { rows: rows.sort(function (a, b) { return a.exp.due < b.exp.due ? -1 : 1; }), B: B, total: sum(rows.map(function (r) { return r.open; })), bySup: Object.keys(bySup).map(function (k) { return bySup[k]; }).sort(function (a, b) { return b.total - a.total; }), dpo: M.dpo() };
  };
  // DPO: AP ÷ purchases & production cost of the last closed month × days.
  M.dpo = function (p) {
    p = p || M.lastClosed(); var ap = M.natural('2100', mEnd(p)), plm = M.pl(p + '-01', mEnd(p)), base = plm.cogsT - (M.natural('5300', mEnd(p), p + '-01'));
    return base ? r1(ap / base * (+mEnd(p).slice(8))) : null;
  };
  M.paySchedule = function (ctx, days) {
    if (!can(ctx, 'ap.view')) return null;
    var lim = addDays(M.today(), days || 30), today = M.today();
    var items = S().exp.filter(function (e) { return ['approved', 'scheduled', 'partial'].indexOf(e.st) >= 0 && e.amt + e.tax - e.paid > 0; }).map(function (e) { return { exp: e, date: e.sched ? e.sched.date : (e.due < today ? today : e.due), acc: e.sched ? e.sched.acc : null, amt: e.amt + e.tax - e.paid, overdue: dayDiff(e.due, today) > 0 }; })
      .filter(function (x) { return x.date <= lim; }).sort(function (a, b) { return a.date < b.date ? -1 : 1; });
    var days2 = {}; items.forEach(function (x) { (days2[x.date] = days2[x.date] || []).push(x); });
    var accs = {}; D.CASH_ACC.forEach(function (a) { accs[a.id] = M.accBal(a.id); });
    var run = Object.assign({}, accs), list = Object.keys(days2).sort().map(function (d) { var tot = sum(days2[d].map(function (x) { return x.amt; })); days2[d].forEach(function (x) { var a = x.acc || 'ACC-01'; run[a] -= x.amt; x.after = run[a]; x.short = run[a] < 0; }); return { date: d, items: days2[d], total: tot }; });
    return { days: list, total: sum(items.map(function (x) { return x.amt; })), accs: accs, waiting: S().exp.filter(function (e) { return ['received', 'verify'].indexOf(e.st) >= 0; }) };
  };

  /* ---------- Bank reconciliation (§61) ---------- */
  M.bankRecon = function (ctx, accId) {
    if (!can(ctx, 'cash.view') && !can(ctx, 'rec.do')) return null;
    accId = accId || 'ACC-01';
    var acc = M.cashAcc(accId), st0 = S().recon = S().recon || {}, done = st0[accId] || { matched: {}, notes: {}, at: null, by: null };
    var stmt = D.BANK_STMT.map(function (x) { return { id: x[0], date: x[1], desc: x[2], amt: Math.round(x[3] * JT), ref: done.matched[x[0]] || x[4] }; });
    var sys = M.ledger(acc.coa, '2026-10-01').rows.filter(function (r) { return r.src.t !== 'sum'; });
    function sysAmt(ref) { var s = sys.filter(function (r) { return r.src.id === ref || r.jv === ref; })[0]; if (s) return s.d - s.c; var t = M.cashTx(ref); if (t && t.jv) { s = sys.filter(function (r) { return r.jv === t.jv; })[0]; return s ? s.d - s.c : null; } var p = by(S().pays, 'id', ref); if (p) { s = sys.filter(function (r) { return r.jv === p.jv; })[0]; return s ? s.d - s.c : null; } return null; }
    stmt.forEach(function (x) { var a = x.ref ? sysAmt(x.ref) : null; x.sys = a; x.st = done.notes[x.id] ? 'review' : !x.ref ? 'unmatched' : a == null ? 'unmatched' : Math.abs(a - x.amt) < 1 ? 'matched' : 'diff'; x.note = done.notes[x.id] || null; });
    var usedJv = {}; stmt.forEach(function (x) { if (!x.ref) return; var t = M.cashTx(x.ref), p = by(S().pays, 'id', x.ref); usedJv[(t && t.jv) || (p && p.jv) || x.ref] = 1; });
    var sysOnly = sys.filter(function (r) { return !usedJv[r.jv] && !usedJv[r.src.id]; });
    var stmtBal = acc.recBal - 0, bookBal = M.accBal(accId);
    var stmtEnd = M.accBal(accId, '2026-09-30') + sum(stmt.map(function (x) { return x.amt; }));
    return { acc: acc, stmt: stmt, sysOnly: sysOnly, stmtEnd: stmtEnd, book: bookBal, diff: Math.round(stmtEnd - bookBal), done: done, counts: { matched: stmt.filter(function (x) { return x.st === 'matched'; }).length, unmatched: stmt.filter(function (x) { return x.st === 'unmatched'; }).length, diff: stmt.filter(function (x) { return x.st === 'diff'; }).length, review: stmt.filter(function (x) { return x.st === 'review'; }).length } };
  };
  M.reconMark = function (ctx, accId, lineId, note) {
    if (!can(ctx, 'rec.do')) return deny(ctx, lineId);
    if (!str(note)) return bad(M.MSG.reason, 'reason');
    var r = S().recon = S().recon || {}, d = r[accId] = r[accId] || { matched: {}, notes: {}, at: null, by: null };
    d.notes[lineId] = { note: str(note), by: empId(ctx), at: nowS() }; M.audit('RECON.REVIEW', ctx, { rec: lineId, reason: note }); save();
    return { ok: true };
  };
  // Book an unmatched statement line (bank fee, interest) as a cash transaction, then it matches.
  M.reconBook = function (ctx, accId, lineId, coa) {
    if (!can(ctx, 'rec.do') || !can(ctx, 'cash.tx')) return deny(ctx, lineId);
    var x = by(D.BANK_STMT.map(function (y) { return { id: y[0], date: y[1], desc: y[2], amt: Math.round(y[3] * JT) }; }), 'id', lineId); if (!x || !M.acc(coa)) return bad(M.MSG.invalid);
    var r0x = S().recon = S().recon || {}, d = r0x[accId] = r0x[accId] || { matched: {}, notes: {}, at: null, by: null };
    if (d.matched[lineId]) return bad(M.MSG.jump, 'jump');
    var t = { id: nid('ct', 'CT-' + x.date.slice(2, 4) + x.date.slice(5, 7) + '-', 3), date: x.date, type: x.amt > 0 ? 'in' : 'out', acc: accId, to: null, cat: 'bank', amt: Math.abs(x.amt), ref: x.id, cc: 'CC-ADM', pic: empId(ctx), coa: coa, note: L(x.desc, x.desc), ev: 'Rekening koran ' + x.id, appr: empId(ctx), st: 'pending', jv: null };
    S().cashTx.push(t); var r = postCash(ctx, t); if (!r.ok) return r;
    d.matched[lineId] = t.id; delete d.notes[lineId]; save();
    return { ok: true, tx: t };
  };
  M.reconComplete = function (ctx, accId) {
    if (!can(ctx, 'rec.do')) return deny(ctx, accId);
    var b = M.bankRecon(ctx, accId);
    if (b.counts.unmatched || b.counts.diff) return bad(L('Masih ada baris belum cocok atau selisih tanpa catatan.', 'Some lines are unmatched or differ without a note.'), 'open');
    var d = S().recon[accId] = S().recon[accId] || { matched: {}, notes: {} }; d.at = nowS(); d.by = empId(ctx);
    M.audit('RECON.COMPLETE', ctx, { rec: accId, to: 'bank' }); save();
    return { ok: true };
  };

  /* ---------- Notifications for finance (§96 mobile alerts) ---------- */
  M.NOTIF = { invappr: L('Invoice Menunggu Persetujuan', 'Invoice Waiting for Approval'), cashappr: L('Kas Keluar Menunggu Persetujuan', 'Cash Out Waiting for Approval'), aresc: L('Eskalasi AR', 'AR Escalation'), stock: L('Stok Kritis', 'Critical Stock'),
    prappr: L('PR Menunggu Persetujuan', 'PR Waiting for Approval'), poappr: L('PO Menunggu Persetujuan', 'PO Waiting for Approval'), wtappr: L('Perubahan Berat Menunggu Persetujuan', 'Weight Change Waiting for Approval'), adjappr: L('Penyesuaian Stok Menunggu Persetujuan', 'Stock Adjustment Waiting for Approval'),
    decision: L('Keputusan Baru', 'New Decision'), close: L('Closing Bulanan', 'Monthly Close') };
  M.notifs = function (ctx) { return S().notifs.filter(function (n) { return n.to === empId(ctx) || (M.PERMS[n.to] && can(ctx, n.to)); }); };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = M;
    ['./jfos-fin-cost.js', './jfos-fin-sup.js', './jfos-fin-cfo.js'].forEach(function (p) { try { require(p); } catch (e) { if (!(e.code === 'MODULE_NOT_FOUND' && e.message.indexOf(p.slice(2)) >= 0)) throw e; } });
  } else root.JFFIN = M;
})(typeof window !== 'undefined' ? window : this);
