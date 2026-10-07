/* JFRESH OS — Phase 10 screens (part 3): NP-04 expenses & AP (AP-001…AP-005), NP-05 HPP
   (HPP-001…HPP-005) and NP-06 item master & unit economics (ITEM-001…ITEM-004).
   Desktop first for costing and finance; AP approvals and the item weight approvals also work on
   iPad (big action bar); the phone shows summaries and approvals only. Every number and every
   write goes through the finance engine (assets/js/jfos-fin*.js): permission, maker-checker,
   duplicate payment prevention, period lock, versioning and audit live there. */
(function () {
  var A = window.JFAPP, P = A && A.P10, H = A && A.P5, P8 = A && A.P8; if (!A || !P || !H || !P8) return;
  var F = P.F, D = F.D, U = F.u, V = A.V, T = A.T, L = A.L, t = A.t, esc = A.esc, ic = A.ic, can = A.can, href = A.href;
  var card = H.card, kv = H.kv, note = H.note, dlg = H.dlg, fld = H.fld, inp = H.inp, sel = H.sel, area = H.area, lnk = H.lnk, tabs = H.tabs;
  var cx = P.cx, rp = P.rp, rpj = P.rpj, n0 = P.n0, pct = P.pct, dt = P.dt, mon = P.mon, emp = P.emp, mono = P.mono, stc = P.stc;
  var expLink = P.expLink, supLink = P.supLink, poLink = P.poLink, jvLink = P.jvLink, itemLink = P.itemLink, cashLink = P.cashLink;
  function me() { return F.empId(cx()); }
  function sum(a) { return a.reduce(function (s, x) { return s + (+x || 0); }, 0); }
  function by(a, k, v) { return a.filter(function (x) { return x[k] === v; })[0]; }
  function done(msg) { P.after(msg); }

  /* ================= Shared AP helpers ================= */
  function tot(e) { return e.amt + e.tax; }
  function openOf(e) { return e.amt + e.tax - e.paid; }
  function expC(e) { return stc(F.EXP_ST, F.expSt(e)); }
  function catN(k) { return t(D.EXP_CATS[k] || L(k || '—', k || '—')); }
  function srcN(k) { return t(D.EXP_SRC[k] || L(k || '—', k || '—')); }
  function ccN(c) { var x = by(D.CC.map(function (r) { return { c: r[0], n: r[1] }; }), 'c', c); return x ? esc(c) + ' · ' + t(x.n) : esc(c || '—'); }
  function payee(e) { return e.sup ? esc(F.supName(e.sup)) : srcN(e.src); }
  function payeeL(e) { return e.sup ? supLink(e.sup) : srcN(e.src); }
  function dueTxt(e) {
    var d = U.dayDiff(e.due, F.today()), s = F.expSt(e);
    if (s === 'paid' || s === 'rejected') return dt(e.due);
    return dt(e.due) + '<small class="sub5 ' + (d > 0 ? 'ap10-crit' : d >= -3 ? 'ap10-warn' : '') + '">' + (d > 0 ? t(L('lewat ' + d + ' hari', d + ' days overdue')) : d === 0 ? t(L('hari ini', 'today')) : t(L('dalam ' + (-d) + ' hari', 'in ' + (-d) + ' days'))) + '</small>';
  }
  // Duplicate suspects that are still live (not rejected, not overridden at entry).
  function dupsOf(e) { return e.ovr || ['rejected', 'paid'].indexOf(F.expSt(e)) >= 0 ? [] : F.dupCheck(e, e.id); }
  function dupList(hits) {
    return '<ul class="ap10-dup">' + hits.map(function (h) {
      var x = h.exp;
      return '<li><div class="ap10-dup-h">' + lnk('AP-002', x.id, mono(x.id)) + expC(x) + '<b class="num">' + rp(tot(x)) + '</b></div>' +
        '<div class="sub5">' + payee(x) + ' · ' + t(L('No. invoice ', 'Invoice no. ')) + esc(x.sinv || '—') + ' · ' + dt(x.date) + (x.po ? ' · ' + esc(x.po) : '') + '</div>' +
        '<div class="ap10-why">' + h.why.map(function (w) { return A.chip('crit', w, 'copy'); }).join('') + '</div></li>';
    }).join('') + '</ul>';
  }
  var CAT_COA = { supplier: '5900', chemical: '1310', packaging: '1320', maintenance: '6400', fuel: '5500', payroll: '2300', tax: '2210', utility: '5400', rent: '6200', opex: '6900', capex: '1530' };
  function coaOpts() {
    return [['', L('Otomatis dari kategori / PO', 'Automatic from category / PO')]].concat(F.COA.filter(function (a) { return ['cogs', 'opex'].indexOf(a.type) >= 0 || ['1310', '1320', '1330', '1400', '1530', '2150', '2210', '2220', '2300', '2400', '7200'].indexOf(a.c) >= 0; })
      .map(function (a) { return [a.c, [a.c + ' · ' + a.n[0], a.c + ' · ' + a.n[1]]]; }));
  }
  function supOpts() { return [['', L('Tanpa supplier (opex / payroll / pajak)', 'No supplier (opex / payroll / tax)')]].concat((F.state().sups || []).map(function (s) { return [s.id, s.id + ' · ' + s.n]; })); }
  function accOpts(def) { return F.cashAccs().filter(function (a) { return !a.restricted; }).map(function (a) { return [a.id, a.n + ' · ' + rpj(F.accBal(a.id))]; }); }
  function money(s) {
    if (s == null || s === '') return '';
    var x = String(s).replace(/\s|rp/gi, '');
    if (/^\d{1,3}(\.\d{3})+(,\d+)?$/.test(x)) return x.replace(/\./g, '').replace(',', '.');
    return x.replace(/,(?=\d{3}(\D|$))/g, '');
  }
  function bigBar(main, side) { return '<div class="ap10-bar">' + P8.abar(main, side) + '</div>'; }

  /* ---------- Dialogs: new expense, duplicate warning, verify, approve, schedule, pay ---------- */
  function newExpDlg(pre) {
    pre = pre || {};
    var today = F.today();
    dlg({ title: L('Input Biaya / Invoice Supplier', 'Enter Expense / Supplier Invoice'), icon: 'plus', ok: L('Simpan', 'Save'),
      sub: t(L('Setiap biaya wajib punya bukti. Sistem mengecek supplier, nomor invoice, tanggal, nilai, PO dan referensi untuk mencegah pembayaran ganda.', 'Every expense needs evidence. The system checks supplier, invoice number, date, amount, PO and reference to prevent duplicate payment.')),
      body: '<div class="fg5">' +
        fld(L('Sumber', 'Source'), sel('src', P.opts(D.EXP_SRC), pre.src || 'supinv'), { req: true }) +
        fld(L('Kategori', 'Category'), sel('cat', P.opts(D.EXP_CATS), pre.cat || 'supplier'), { req: true }) +
        fld(L('Supplier', 'Supplier'), sel('sup', supOpts(), pre.sup || ''), { wide: true }) +
        fld(L('No. invoice supplier / referensi', 'Supplier invoice no. / reference'), inp('sinv', pre.sinv || '', { ph: L('mis. TMB-2610-044', 'e.g. TMB-2610-044') })) +
        fld(L('PO (bila ada)', 'PO (if any)'), inp('po', pre.po || '', { ph: 'PO-2609-014' })) +
        fld(L('Tanggal invoice', 'Invoice date'), inp('date', pre.date || today, { type: 'date' }), { req: true }) +
        fld(L('Jatuh tempo', 'Due date'), inp('due', pre.due || U.addDays(today, 14), { type: 'date' }), { req: true }) +
        fld(L('Nilai sebelum pajak (Rp)', 'Amount before tax (Rp)'), inp('amt', pre.amt || '', { num: true, ph: '9.130.000' }), { req: true }) +
        fld(L('PPN (Rp)', 'VAT (Rp)'), inp('tax', pre.tax || '', { num: true, ph: '0' })) +
        fld(L('Cost center', 'Cost center'), sel('cc', D.CC.map(function (c) { return [c[0], [c[0] + ' · ' + c[1][0], c[0] + ' · ' + c[1][1]]]; }), pre.cc || 'CC-PRD')) +
        fld(L('Akun biaya', 'Expense account'), sel('coa', coaOpts(), pre.coa || '')) +
        fld(L('Keterangan', 'Description'), inp('desc', pre.desc || ''), { wide: true }) +
        fld(L('Bukti / dokumen', 'Evidence / document'), inp('ev', pre.ev || '', { ph: L('mis. scan-invoice-TMB-2610-044.pdf', 'e.g. scan-invoice-TMB-2610-044.pdf') }), { req: true, wide: true, hint: t(L('Wajib. Nama file scan atau nomor dokumen fisik.', 'Required. Scan file name or physical document number.')) }) + '</div>',
      onOk: function (v) {
        v.amt = money(v.amt); v.tax = money(v.tax);
        if (!v.coa) v.coa = v.po ? '2150' : CAT_COA[v.cat] || '6900';
        var r = F.enterExpense(cx(), v);
        if (r.ok) { P.after(L('Biaya ' + r.exp.id + ' tersimpan sebagai Received.', 'Expense ' + r.exp.id + ' saved as Received.')); return true; }
        if (r.code === 'dup') { setTimeout(function () { dupEnterDlg(v, r.dup); }, 0); return true; }
        return r.msg;
      } });
  }
  function dupEnterDlg(v, hits) {
    var ov = can('ap.override');
    dlg({ title: L('Kemungkinan Pembayaran Ganda', 'Possible Duplicate Payment'), icon: 'alert', ok: L('Override & Simpan', 'Override & Save'),
      sub: t(L('Biaya ini cocok dengan ' + hits.length + ' catatan yang sudah ada. Periksa dulu sebelum menyimpan.', 'This expense matches ' + hits.length + ' existing record(s). Check before saving.')),
      body: '<div class="ap10-new">' + kv([[L('Supplier', 'Supplier'), v.sup ? esc(F.supName(v.sup)) : '—'], [L('No. invoice', 'Invoice no.'), esc(v.sinv || '—')], [L('Tanggal', 'Date'), dt(v.date)], [L('Nilai', 'Amount'), rp(+v.amt)], [L('PO', 'PO'), esc(v.po || '—')]]) + '</div>' +
        '<h3 class="ap10-h3">' + ic('copy') + t(L('Catatan yang cocok dan alasannya', 'Matching records and why')) + '</h3>' + dupList(hits) +
        (ov ? fld(L('Alasan override (tercatat di audit)', 'Override reason (recorded in the audit log)'), area('reason', '', L('mis. invoice terpisah untuk pengiriman kedua, dikonfirmasi supplier', 'e.g. separate invoice for the second delivery, confirmed by the supplier')), { req: true, wide: true })
          : note(t(L('Hanya user dengan izin "Override peringatan pembayaran ganda" yang boleh menyimpan. Batalkan dan periksa catatan di atas.', 'Only a user with the "Override the duplicate payment warning" permission may save. Cancel and check the records above.')), 'lock', 'warn')),
      onOk: ov ? function (x) {
        var r = F.enterExpense(cx(), Object.assign({}, v, { override: true, reason: x.reason }));
        if (!r.ok) return r.msg;
        P.after(L('Biaya ' + r.exp.id + ' tersimpan dengan override duplikat. Alasan dicatat di audit.', 'Expense ' + r.exp.id + ' saved with a duplicate override. The reason is in the audit log.'), 'warn'); return true;
      } : null });
  }
  function matchTbl(m) {
    if (!m) return '';
    var rows = (m.lines || []).map(function (l) {
      return '<tr><td>' + P.stockLink(l.item) + '</td><td class="r num">' + n0(l.poQty) + '</td><td class="r num">' + rp(l.poPrice) + '</td><td class="r num">' + n0(l.rcvQty) + '</td><td class="r num">' + rp(l.value) + '</td></tr>';
    }).join('');
    var diff = m.inv - m.grni;
    return '<div class="ap10-3w">' +
      '<div class="ap10-3w-i"><span>' + t(L('PO', 'PO')) + '</span><b class="num">' + rp(m.po) + '</b><small>' + t(L('nilai PO (sebelum pajak)', 'PO value (before tax)')) + '</small></div>' +
      '<div class="ap10-3w-i"><span>' + t(L('Penerimaan (GRN)', 'Receiving (GRN)')) + '</span><b class="num">' + rp(m.grni) + '</b><small>' + esc((m.grns || []).join(', ') || '—') + '</small></div>' +
      '<div class="ap10-3w-i"><span>' + t(L('Invoice', 'Invoice')) + '</span><b class="num">' + rp(m.inv) + '</b><small>' + t(L('nilai invoice sebelum pajak', 'invoice before tax')) + '</small></div>' +
      '<div class="ap10-3w-i ap10-3w-' + (m.ok ? 'ok' : 'crit') + '"><span>' + t(L('Selisih invoice − GRN', 'Difference invoice − GRN')) + '</span><b class="num">' + (diff > 0 ? '+' : '') + rp(diff) + '</b><small>' + t(L('toleransi ', 'tolerance ')) + rp(m.tol) + '</small></div></div>' +
      (rows ? '<div class="tblw"><table class="tbl dense"><thead><tr><th>' + t(L('Item', 'Item')) + '</th><th class="r">' + t(L('Qty PO', 'PO qty')) + '</th><th class="r">' + t(L('Harga PO', 'PO price')) + '</th><th class="r">' + t(L('Qty diterima', 'Received qty')) + '</th><th class="r">' + t(L('Nilai diterima', 'Received value')) + '</th></tr></thead><tbody>' + rows + '</tbody></table></div>' : '') +
      (m.ok ? note(t(L('Three-way match cocok dalam toleransi.', 'The three-way match agrees within tolerance.')), 'checkc', 'ok')
        : note(t(m.why ? m.why : L('Invoice berbeda ' + rp(diff) + ' dari nilai barang diterima. Perlu review dan alasan sebelum diverifikasi; selisih harga dibukukan sebagai price variance.', 'The invoice differs ' + rp(diff) + ' from the value received. It needs a review and a reason before verification; the price difference is booked as a price variance.')), 'alert', 'crit'));
  }
  function verifyDlg(id) {
    var e = F.expense(id); if (!e) return;
    var m = e.po ? F.match3(e) : null, dup = dupsOf(e);
    if (dup.length) {
      dlg({ title: L('Tidak bisa diverifikasi: duplikat', 'Cannot verify: duplicate'), icon: 'alert', sub: t(F.MSG.dup),
        body: dupList(dup) + note(t(L('Tolak biaya ini sebagai duplikat, atau tahan sampai supplier mengonfirmasi.', 'Reject this expense as a duplicate, or hold it until the supplier confirms.')), 'info', 'warn') });
      return;
    }
    var body = m ? matchTbl(m) : note(t(L('Bukan invoice PO: verifikasi cukup dengan bukti (' + (e.ev || e.sinv || '—') + ').', 'Not a PO invoice: verification needs the evidence only (' + (e.ev || e.sinv || '—') + ').')), 'file', 'info');
    P.reasonDlg({ title: L('Verifikasi ' + id, 'Verify ' + id), icon: 'filecheck', ok: L('Verifikasi', 'Verify'), body: body,
      optional: !m || m.ok, label: m && !m.ok ? L('Alasan menerima selisih', 'Reason for accepting the difference') : L('Catatan (opsional)', 'Note (optional)'),
      fn: function (reason) { return F.verifyExpense(cx(), id, { reason: reason }); }, done: L('Terverifikasi. Menunggu persetujuan.', 'Verified. Waiting for approval.') });
  }
  function approveDlg(id) {
    var e = F.expense(id), jo = F.apJournal(e), big = tot(e) > F.cfg().apMaker;
    P.confirmDlg({ title: L('Setujui ' + id, 'Approve ' + id), icon: 'checkc', ok: L('Setujui', 'Approve'),
      body: kv([[L('Penerima', 'Payee'), payee(e)], [L('Total', 'Total'), '<b class="num">' + rp(tot(e)) + '</b>'], [L('Jatuh tempo', 'Due'), dt(e.due)]]) +
        (big ? note(t(L('Di atas ' + rpj(F.cfg().apMaker) + ': maker-checker berlaku. Pembuat (' + F.empName(e.by) + ') tidak boleh menyetujui sendiri.', 'Above ' + rpj(F.cfg().apMaker) + ': maker-checker applies. The maker (' + F.empName(e.by) + ') cannot approve it.')), 'users', e.by === me() ? 'crit' : 'info') : '') +
        (jo ? '<h3 class="ap10-h3">' + ic('list') + t(L('Jurnal yang akan diposting', 'Journal to be posted')) + '</h3>' + P.jlines(jo.lines) : note(t(L('Kewajiban sudah diakru; tidak ada jurnal baru saat disetujui.', 'The liability is already accrued; no new journal on approval.')), 'info', 'info')),
      fn: function () { return F.approveExpense(cx(), id); }, done: L('Disetujui. Jurnal AP diposting.', 'Approved. The AP journal is posted.') });
  }
  function schedDlg(id) {
    var e = F.expense(id), d0 = e.sched ? e.sched.date : (e.due < F.today() ? F.today() : e.due);
    P.confirmDlg({ title: L('Jadwalkan Pembayaran ' + id, 'Schedule Payment ' + id), icon: 'calendar', ok: L('Jadwalkan', 'Schedule'),
      body: '<div class="fg5">' + fld(L('Tanggal bayar', 'Payment date'), inp('date', d0, { type: 'date' }), { req: true }) + fld(L('Dari rekening', 'From account'), sel('acc', accOpts(), e.sched ? e.sched.acc : 'ACC-01'), { req: true }) + '</div>' +
        note(t(L('Sisa tagihan ', 'Open amount ')) + '<b>' + rp(openOf(e)) + '</b> · ' + t(L('jatuh tempo ', 'due ')) + dt(e.due), 'coins', 'info'),
      fn: function (r, v) { return F.scheduleExpense(cx(), id, v.date, v.acc); }, done: L('Pembayaran dijadwalkan.', 'Payment scheduled.') });
  }
  function payDlg(id) {
    var e = F.expense(id);
    dlg({ title: L('Bayar ' + id, 'Pay ' + id), icon: 'coins', ok: L('Bayar', 'Pay'),
      sub: payee(e) + ' · ' + esc(e.sinv || '') + ' · ' + t(L('sisa ', 'open ')) + '<b>' + rp(openOf(e)) + '</b>',
      body: '<div class="fg5">' + fld(L('Nilai (Rp)', 'Amount (Rp)'), inp('amt', openOf(e), { num: true }), { req: true }) + fld(L('Tanggal', 'Date'), inp('date', F.today(), { type: 'date' }), { req: true }) +
        fld(L('Dari rekening', 'From account'), sel('acc', accOpts(), e.sched ? e.sched.acc : 'ACC-01'), { req: true, wide: true }) + '</div>' +
        note(t(L('Pembayaran memposting jurnal Utang Usaha / Kas-Bank dan dicek ulang terhadap pembayaran ganda.', 'The payment posts an AP / Cash-Bank journal and is checked again against duplicate payment.')), 'shield', 'info'),
      onOk: function (v) {
        v.amt = money(v.amt);
        var r = F.payExpense(cx(), id, v);
        if (r.ok) { P.after(L('Dibayar ' + rp(r.pay.amt) + ' (' + r.pay.id + ').', 'Paid ' + rp(r.pay.amt) + ' (' + r.pay.id + ').')); return true; }
        if (r.code === 'dup') { setTimeout(function () { dupPayDlg(id, v, r.dup); }, 0); return true; }
        return r.msg;
      } });
  }
  function dupPayDlg(id, v, hits) {
    var ov = can('ap.override');
    dlg({ title: L('Peringatan Pembayaran Ganda', 'Duplicate Payment Warning'), icon: 'alert', ok: L('Override & Bayar', 'Override & Pay'),
      sub: t(L('Invoice dengan supplier dan nomor yang sama sudah pernah dibayar.', 'An invoice with the same supplier and number was already paid.')),
      body: dupList(hits) + (ov ? fld(L('Alasan override', 'Override reason'), area('reason', '', ''), { req: true, wide: true }) : note(t(L('Anda tidak punya izin override. Pembayaran dibatalkan.', 'You do not have override permission. The payment is cancelled.')), 'lock', 'warn')),
      onOk: ov ? function (x) {
        var r = F.payExpense(cx(), id, Object.assign({}, v, { override: true, reason: x.reason }));
        if (!r.ok) return r.msg; P.after(L('Dibayar dengan override (' + r.pay.id + ').', 'Paid with override (' + r.pay.id + ').'), 'warn'); return true;
      } : null });
  }
  var expActs = {
    'new': function () { newExpDlg(); },
    verify: function (el) { verifyDlg(el.getAttribute('data-val')); },
    approve: function (el) { approveDlg(el.getAttribute('data-val')); },
    reject: function (el) { var id = el.getAttribute('data-val'); P.reasonDlg({ title: L('Tolak ' + id, 'Reject ' + id), icon: 'xc', ok: L('Tolak', 'Reject'), fn: function (r) { return F.rejectExpense(cx(), id, r); }, done: L('Biaya ditolak.', 'Expense rejected.') }); },
    hold: function (el) { var id = el.getAttribute('data-val'); P.reasonDlg({ title: L('Tahan ' + id, 'Hold ' + id), icon: 'pause', ok: L('Tahan', 'Hold'), fn: function (r) { return F.holdExpense(cx(), id, true, r); }, done: L('Biaya ditahan.', 'Expense on hold.') }); },
    unhold: function (el) { var id = el.getAttribute('data-val'); P.confirmDlg({ title: L('Lepas tahan ' + id, 'Release hold ' + id), icon: 'play', ok: L('Lepas', 'Release'), fn: function () { return F.holdExpense(cx(), id, false); }, done: L('Tahan dilepas.', 'Hold released.') }); },
    sched: function (el) { schedDlg(el.getAttribute('data-val')); },
    pay: function (el) { payDlg(el.getAttribute('data-val')); }
  };

  /* ================= NP-04 · AP-001 Expense List ================= */
  var ST_ORDER = ['received', 'verify', 'approved', 'scheduled', 'partial', 'overdue', 'hold', 'paid', 'rejected'];
  V['AP-001'] = {
    render: function (c) {
      var c0 = cx(), all = F.expenses(c0), q = c.q;
      var cnt = {}; all.forEach(function (e) { var s = F.expSt(e); cnt[s] = (cnt[s] || 0) + 1; });
      function amtOf(list) { return sum(list.map(openOf)); }
      var waiting = all.filter(function (e) { return ['received', 'verify'].indexOf(e.st) >= 0; }), open = all.filter(function (e) { return ['approved', 'scheduled', 'partial', 'overdue'].indexOf(F.expSt(e)) >= 0; });
      var od = all.filter(function (e) { return F.expSt(e) === 'overdue'; }), hold = all.filter(function (e) { return e.st === 'hold'; });
      var dups = all.filter(function (e) { return dupsOf(e).length; }), cur = F.curPeriod();
      var paidM = sum(F.state().apays.filter(function (p) { return p.date.slice(0, 7) === cur; }).map(function (p) { return p.amt; }));
      var defs = [
        { k: 'src', l: L('Sumber', 'Source'), opts: P.opts(D.EXP_SRC), fn: function (e, v) { return e.src === v; } },
        { k: 'cat', l: L('Kategori', 'Category'), opts: P.opts(D.EXP_CATS), fn: function (e, v) { return e.cat === v; } },
        { k: 'sup', l: L('Supplier', 'Supplier'), opts: (F.state().sups || []).map(function (s) { return [s.id, s.n]; }), fn: function (e, v) { return e.sup === v; } }
      ];
      var rows = A.applyFilters(all, defs, function (e) { return [e.id, e.sinv, payee(e), T(e.desc), e.po].join(' '); });
      if (q.st === 'dup') rows = rows.filter(function (e) { return dupsOf(e).length; }); else if (q.st) rows = rows.filter(function (e) { return F.expSt(e) === q.st; });
      var stTabs = [['', L('Semua', 'All'), null, all.length]].concat(ST_ORDER.filter(function (s) { return cnt[s]; }).map(function (s) { return [s, F.EXP_ST[s][0], null, cnt[s]]; })).concat(dups.length ? [['dup', L('Duplikat', 'Duplicates'), 'copy', dups.length]] : []);
      var cols = [
        { h: L('ID', 'ID'), v: function (e) { return mono(e.id) + '<small class="sub5">' + dt(e.date) + '</small>'; } },
        { h: L('Sumber', 'Source'), v: function (e) { return srcN(e.src) + '<small class="sub5">' + catN(e.cat) + '</small>'; } },
        { h: L('Penerima / keterangan', 'Payee / description'), v: function (e) { return '<b>' + payee(e) + '</b><small class="sub5">' + t(e.desc) + '</small>'; } },
        { h: L('Referensi', 'Reference'), v: function (e) { return esc(e.sinv || '—') + (e.po ? '<small class="sub5">' + esc(e.po) + (e.grn ? ' · ' + esc(e.grn) : '') + '</small>' : ''); } },
        { h: L('Total', 'Total'), cls: 'r num', v: function (e) { return rp(tot(e)) + (e.paid && openOf(e) > 0 ? '<small class="sub5">' + t(L('sisa ', 'open ')) + rp(openOf(e)) + '</small>' : ''); } },
        { h: L('Jatuh tempo', 'Due'), v: dueTxt },
        { h: L('Status', 'Status'), v: function (e) { return expC(e) + flags(e); } }
      ];
      function flags(e) {
        var f = [];
        if (dupsOf(e).length) f.push(A.chip('crit', L('Duplikat?', 'Duplicate?'), 'copy'));
        if (e.ovr) f.push(A.chip('appr', L('Override', 'Override'), 'shield'));
        if (e.match && !e.match.ok) f.push(A.chip(e.matchOk ? 'appr' : 'warn', L('Selisih 3-way', '3-way diff'), 'scale'));
        return f.length ? '<span class="ap10-flags">' + f.join('') + '</span>' : '';
      }
      var dupCard = dups.length ? '<section class="card ap10-warn-c">' + '<div class="ap10-wh">' + ic('alert') + '<div><h2>' + t(L(dups.length + ' biaya terindikasi pembayaran ganda', dups.length + ' expenses look like duplicate payments')) + '</h2><p class="sub5">' + t(L('Dicek: supplier, nomor invoice, tanggal, nilai, PO dan referensi. Jangan bayar sebelum diperiksa.', 'Checked: supplier, invoice number, date, amount, PO and reference. Do not pay before checking.')) + '</p></div></div>' +
        (function () { var seen = {}; return dups.slice().sort(function (a, b) { return a.date < b.date ? 1 : -1; }).filter(function (e) { if (seen[e.id]) return false; seen[e.id] = 1; dupsOf(e).forEach(function (h) { seen[h.exp.id] = 1; }); return true; }); })().map(function (e) { return '<div class="ap10-dpair"><div class="ap10-dpair-h">' + lnk('AP-002', e.id, mono(e.id)) + ' ' + expC(e) + ' <b class="num">' + rp(tot(e)) + '</b> · ' + payee(e) + ' · ' + esc(e.sinv || '—') + '</div>' + dupList(dupsOf(e)) + '</div>'; }).join('') + '</section>' : '';
      return P.head(t(L('Invoice supplier, PO, utilitas, payroll, maintenance, sewa, pajak, reimbursement dan opex: Received → Verifikasi → Approved → Scheduled → Paid.', 'Supplier invoices, POs, utilities, payroll, maintenance, rent, tax, reimbursements and opex: Received → Verification → Approved → Scheduled → Paid.')),
          A.pbtn('ap.enter', 'primary', L('Input Biaya', 'Enter Expense'), 'plus', { act: 'new' }), P.fresh({ src: L('Subledger AP', 'AP subledger'), kind: 'live' })) +
        P.kpis([
          { k: L('Menunggu verifikasi', 'Waiting verification'), v: n0(waiting.length), s: rpj(amtOf(waiting)), tone: waiting.length ? 'appr' : 'ok', icon: 'filecheck', go: 'AP-001', q: { st: 'received' } },
          { k: L('Disetujui belum dibayar', 'Approved unpaid'), v: rpj(amtOf(open)), s: n0(open.length) + ' ' + t(L('invoice', 'invoices')), icon: 'clock', go: 'AP-003' },
          { k: L('Lewat jatuh tempo', 'Overdue'), v: rpj(amtOf(od)), s: n0(od.length) + ' ' + t(L('invoice', 'invoices')), tone: od.length ? 'crit' : 'ok', icon: 'alert', go: 'AP-001', q: { st: 'overdue' } },
          { k: L('Ditahan', 'On hold'), v: n0(hold.length), s: rpj(amtOf(hold)), tone: hold.length ? 'warn' : null, icon: 'pause', go: 'AP-001', q: { st: 'hold' } },
          { k: L('Dugaan duplikat', 'Suspected duplicates'), v: n0(dups.length), s: rpj(sum(dups.map(tot))), tone: dups.length ? 'crit' : 'ok', icon: 'copy', go: 'AP-001', q: { st: 'dup' } },
          { k: L('Dibayar bulan ini', 'Paid this month'), v: rpj(paidM), s: mon(cur), icon: 'coins', go: 'AP-005' }
        ]) + dupCard +
        tabs(stTabs, q.st || '', 'st', { def: '' }) +
        A.filters(defs, { search: L('Cari ID, supplier, nomor invoice, PO', 'Search ID, supplier, invoice no., PO') }) +
        card(L('Daftar biaya', 'Expenses'), P.table(rows, cols, function (e) { return { t: mono(e.id) + ' · ' + payee(e), r: rp(tot(e)), s: t(e.desc) + ' · ' + t(L('jatuh tempo ', 'due ')) + dt(e.due), chip: expC(e) + flags(e) }; }, function (e) { return href('AP-002', e.id); }, { empty: L('Tidak ada biaya untuk filter ini.', 'No expenses for this filter.') }), { icon: 'list', count: rows.length });
    },
    act: expActs
  };

  /* ================= NP-04 · AP-002 Supplier Invoice (expense detail) ================= */
  var FLOW = [L('Received', 'Received'), L('Verifikasi', 'Verification'), L('Approved', 'Approved'), L('Scheduled', 'Scheduled'), L('Paid', 'Paid')];
  function flowIdx(e) { var s = e.st === 'hold' && e.hold ? e.hold.from : e.st; return { received: 1, verify: e.verified ? 2 : 1, approved: 3, scheduled: 4, partial: 4, paid: 5, rejected: 0 }[s] || 0; }
  function apQueue() {
    var c0 = cx(), list = F.expenses(c0).filter(function (e) { return ['received', 'verify', 'hold'].indexOf(e.st) >= 0 || (e.st === 'verify' && e.verified); });
    return P.head(t(L('Pilih invoice untuk diverifikasi, disetujui atau dibayar.', 'Pick an invoice to verify, approve or pay.')), A.btn('ghost', L('Semua biaya', 'All expenses'), 'list', { go: 'AP-001' }), P.fresh({ src: L('Subledger AP', 'AP subledger') })) +
      card(L('Perlu tindakan', 'Needs action'), P.table(list, [
        { h: L('ID', 'ID'), v: function (e) { return mono(e.id); } }, { h: L('Penerima', 'Payee'), v: function (e) { return '<b>' + payee(e) + '</b><small class="sub5">' + t(e.desc) + '</small>'; } },
        { h: L('Total', 'Total'), cls: 'r num', v: function (e) { return rp(tot(e)); } }, { h: L('Status', 'Status'), v: function (e) { return expC(e) + (e.verified ? ' ' + A.chip('info', L('Terverifikasi', 'Verified'), 'check') : ''); } }
      ], function (e) { return { t: mono(e.id) + ' · ' + payee(e), r: rp(tot(e)), chip: expC(e) }; }, function (e) { return href('AP-002', e.id); }, { empty: L('Tidak ada invoice yang menunggu.', 'No invoices waiting.') }), { icon: 'filecheck', count: list.length });
  }
  V['AP-002'] = {
    title: function (rec) { return rec ? L('Invoice ' + rec, 'Invoice ' + rec) : null; },
    render: function (c) {
      if (!c.rec) return apQueue();
      var e = F.expense(c.rec);
      if (!e) return A.stateCard('empty', L('Biaya tidak ditemukan.', 'Expense not found.'), A.btn('blue', L('Daftar Biaya', 'Expense List'), 'list', { go: 'AP-001' }));
      var s = F.expSt(e), dup = dupsOf(e), m = e.match || (e.po ? F.match3(e) : null), pays = F.apPaymentsOf(e.id), j = e.jv ? F.jv(e.jv) : null, jo = !j ? F.apJournal(e) : null;
      var od = U.dayDiff(e.due, F.today());
      var hero = P8.hero({ id: e.id, icon: e.sup ? 'invoice' : 'file', title: payee(e), sub: t(e.desc) + ' · ' + srcN(e.src) + ' · ' + catN(e.cat),
        chips: expC(e) + (dup.length ? A.chip('crit', L('Dugaan duplikat', 'Suspected duplicate'), 'copy') : '') + (e.ovr ? A.chip('appr', L('Override duplikat', 'Duplicate override'), 'shield') : '') + (m ? A.chip(m.ok ? 'ok' : e.matchOk ? 'appr' : 'warn', m.ok ? L('3-way match OK', '3-way match OK') : L('3-way berbeda', '3-way differs'), 'scale') : ''),
        facts: [[L('Nilai (DPP)', 'Amount (net)'), rp(e.amt), 'num'], [L('PPN', 'VAT'), rp(e.tax), 'num'], [L('Total', 'Total'), rp(tot(e)), 'num'], [L('Dibayar', 'Paid'), rp(e.paid), 'num'], [L('Sisa', 'Open'), rp(openOf(e)), 'num'],
          [L('Jatuh tempo', 'Due'), dt(e.due) + (s !== 'paid' && od > 0 ? ' · ' + t(L('lewat ' + od + ' hari', od + ' d overdue')) : ''), s === 'overdue' ? 'ap10-crit' : '']] });
      var steps = e.st === 'rejected' ? note(t(L('Ditolak oleh ', 'Rejected by ')) + emp((e.log.filter(function (l) { return l.to === 'rejected'; })[0] || {}).by) + ': ' + esc(e.rejWhy || ''), 'xc', 'crit') : P8.step8(FLOW, flowIdx(e));
      var holdN = e.st === 'hold' && e.hold ? note(t(L('Ditahan oleh ', 'Held by ')) + emp(e.hold.by) + ' · ' + esc(e.hold.at) + ': ' + esc(e.hold.reason), 'pause', 'warn') : '';
      var fields = kv([
        [L('Sumber', 'Source'), srcN(e.src)], [L('Supplier', 'Supplier'), e.sup ? supLink(e.sup) : '—'], [L('No. invoice / referensi', 'Invoice no. / reference'), esc(e.sinv || '—')], [L('Tanggal invoice', 'Invoice date'), dt(e.date)],
        [L('Kategori', 'Category'), catN(e.cat)], [L('Cost center', 'Cost center'), ccN(e.cc)], [L('Plant', 'Plant'), esc(e.plant || '—')], [L('Akun', 'Account'), P.accLink(e.coa)],
        [L('PO', 'PO'), e.po ? poLink(e.po) : '—'], [L('Penerimaan (GRN)', 'Goods receipt (GRN)'), e.grn ? lnk('PUR-006', e.po, mono(e.grn)) : '—'], [L('Bukti', 'Evidence'), e.ev ? ic('file') + ' ' + esc(e.ev) : esc(e.sinv || '—')],
        [L('Diinput oleh', 'Entered by'), emp(e.by)], [L('Diverifikasi', 'Verified'), e.verified ? emp(e.verified.by) + ' · ' + esc(e.verified.at) : '—'], [L('Disetujui', 'Approved'), e.appr ? emp(e.appr) + (e.apprAt ? ' · ' + esc(e.apprAt) : '') : '—'],
        [L('Jadwal bayar', 'Payment schedule'), e.sched ? dt(e.sched.date) + ' · ' + cashLink(e.sched.acc) : '—']
      ]);
      var match = e.po ? card(L('Three-way match: PO vs penerimaan vs invoice', 'Three-way match: PO vs receiving vs invoice'), (e.match ? '' : note(t(L('Pratinjau: belum diverifikasi.', 'Preview: not verified yet.')), 'eye', 'info')) + matchTbl(m) +
          (e.matchOk ? note(t(L('Selisih diterima oleh ', 'Difference accepted by ')) + emp(e.matchOk.by) + ' · ' + esc(e.matchOk.at) + ': ' + esc(e.matchOk.reason), 'checkc', 'appr') : ''), { icon: 'scale' })
        : card(L('Verifikasi', 'Verification'), note(t(L('Bukan invoice PO: tidak ada three-way match, verifikasi berdasarkan bukti.', 'Not a PO invoice: no three-way match, verified on the evidence.')), 'file', 'info'), { icon: 'filecheck' });
      var dupC = card(L('Cek pembayaran ganda', 'Duplicate payment check'), (dup.length ? note(t(F.MSG.dup), 'alert', 'crit') + dupList(dup) : note(t(L('Tidak ada catatan lain dengan supplier, nomor invoice, nilai, PO atau referensi yang sama.', 'No other record with the same supplier, invoice number, amount, PO or reference.')), 'checkc', 'ok')) +
        (e.ovr ? note(t(L('Override oleh ', 'Override by ')) + emp(e.ovr.by) + ' · ' + esc(e.ovr.at) + ' · ' + t(L('cocok dengan ', 'matched ')) + esc(e.ovr.of.join(', ')) + ': ' + esc(e.ovr.reason), 'shield', 'appr') : ''), { icon: 'copy' });
      var jc = card(L('Jurnal', 'Journal'), j ? '<p class="ap10-jh">' + jvLink(j.id) + ' · ' + dt(j.date) + ' · ' + stc(F.JV_ST, j.st) + '</p>' + P.jlines(j.lines) + P.traceChain(F.trace(j.id))
        : jo ? note(t(L('Pratinjau: jurnal diposting saat disetujui.', 'Preview: the journal is posted on approval.')), 'eye', 'info') + P.jlines(jo.lines)
        : note(t(L('Kewajiban (payroll / pajak) sudah diakru; pembayaran mendebit akun kewajiban langsung.', 'The liability (payroll / tax) is already accrued; the payment debits the liability account directly.')), 'info', 'info'), { icon: 'list' });
      var trace = P.traceChain([{ k: 'exp', id: e.id, n: L('Invoice', 'Invoice') }].concat(e.po ? [{ k: 'po', id: e.po, n: 'PO' }] : []).concat(e.grn ? [{ k: 'grn', id: e.grn, n: L('Penerimaan barang', 'Goods receipt') }] : []).concat(e.sup ? [{ k: 'sup', id: e.sup, n: F.supName(e.sup) }] : []).concat(e.jv ? [{ k: 'jv', id: e.jv, n: L('Jurnal ' + e.jv, 'Journal ' + e.jv) }] : []));
      var payC = pays.length ? card(L('Pembayaran', 'Payments'), P.table(pays, [
        { h: L('ID', 'ID'), v: function (p) { return lnk('AP-005', p.id, mono(p.id)); } }, { h: L('Tanggal', 'Date'), v: function (p) { return dt(p.date); } }, { h: L('Rekening', 'Account'), v: function (p) { return cashLink(p.acc); } },
        { h: L('Nilai', 'Amount'), cls: 'r num', v: function (p) { return rp(p.amt); } }, { h: L('Jurnal', 'Journal'), v: function (p) { return jvLink(p.jv); } }
      ], function (p) { return { t: mono(p.id), r: rp(p.amt), s: dt(p.date) }; }, function (p) { return href('AP-005', p.id); }), { icon: 'coins', count: pays.length }) : '';
      var log = card(L('Riwayat', 'History'), '<ol class="ap10-log">' + e.log.slice().reverse().map(function (l) { return '<li><b>' + t((F.EXP_ST[l.to] || [L(l.to, l.to)])[0]) + '</b> · ' + emp(l.by) + ' · ' + esc(l.at) + (l.amt ? ' · ' + rp(l.amt) : '') + (l.reason ? ' · ' + esc(l.reason) : '') + '</li>'; }).join('') + '</ol>' + (e.log.length ? '' : '<p class="sub5">' + t(L('Data migrasi: riwayat sebelum 6 Okt ada di sistem lama.', 'Migrated record: history before 6 Oct is in the old system.')) + '</p>'), { icon: 'history' });
      // Action bar (iPad: big buttons)
      var main = '', side = [];
      var big = { cls: 'ap10-xl' };
      function B(kind, l, i, act) { return A.btn(kind, l, i, Object.assign({ act: act, val: e.id }, big)); }
      if (['received', 'verify'].indexOf(e.st) >= 0 && !e.verified && can('ap.verify')) main = B('primary', L('Verifikasi', 'Verify'), 'filecheck', 'verify');
      var selfBlock = e.st === 'verify' && e.verified && tot(e) > F.cfg().apMaker && e.by === me();
      if (e.st === 'verify' && e.verified && can('ap.approve') && !selfBlock) main = B('primary', L('Setujui', 'Approve'), 'checkc', 'approve');
      else if (['approved', 'scheduled', 'partial'].indexOf(e.st) >= 0 && can('ap.pay')) { main = B('primary', L('Bayar', 'Pay'), 'coins', 'pay'); side.push(B('blue', e.sched ? L('Ubah jadwal', 'Reschedule') : L('Jadwalkan', 'Schedule'), 'calendar', 'sched')); }
      if (['received', 'verify', 'hold'].indexOf(e.st) >= 0 && can('ap.approve')) side.push(B('danger', L('Tolak', 'Reject'), 'xc', 'reject'));
      if (e.st === 'hold' && (can('ap.approve') || can('ap.pay'))) side.unshift(B('blue', L('Lepas tahan', 'Release hold'), 'play', 'unhold'));
      else if (['paid', 'rejected'].indexOf(s) < 0 && (can('ap.approve') || can('ap.pay'))) side.push(B('ghost', L('Tahan', 'Hold'), 'pause', 'hold'));
      var waitN = selfBlock && can('ap.approve') ? note(t(L('Maker-checker: Anda yang menginput biaya ini (di atas ' + rpj(F.cfg().apMaker) + '). Persetujuan harus oleh user lain.', 'Maker-checker: you entered this expense (above ' + rpj(F.cfg().apMaker) + '). Another user must approve it.')), 'users', 'appr') : !main && e.st === 'verify' && e.verified && !can('ap.approve') ? note(t(L('Menunggu persetujuan Owner / approver AP.', 'Waiting for the Owner / AP approver.')), 'hourglass', 'appr') : '';
      return '<div class="ap10-det">' + hero + steps + holdN + waitN + (main || side.length ? bigBar(main, side.join('')) : '') +
        '<div class="g21-10"><div class="col10">' + match + dupC + jc + payC + '</div><div class="col10">' + card(L('Data invoice', 'Invoice data'), fields, { icon: 'file' }) + card(L('Jejak', 'Trace'), trace, { icon: 'link' }) + log + '</div></div></div>';
    },
    act: expActs
  };

  /* ================= NP-04 · AP-003 AP Aging ================= */
  var BK = { overdue: [L('Lewat jatuh tempo', 'Overdue'), 'crit'], d7: [L('Jatuh tempo ≤ 7 hari', 'Due ≤ 7 days'), 'warn'], d30: [L('8–30 hari', '8–30 days'), 'info'], later: [L('> 30 hari', '> 30 days'), 'ok'] };
  V['AP-003'] = {
    render: function (c) {
      var c0 = cx(), ag = F.apAging(c0); if (!ag) return A.stateCard('noperm', F.MSG.noperm);
      var lc = F.lastClosed(), gl = F.natural('2100'), booked = sum(ag.rows.filter(function (r) { return r.booked && !F.isLiabCoa(r.exp.coa); }).map(function (r) { return r.open; }));
      var rows = c.q.b ? ag.rows.filter(function (r) { return r.b === c.q.b; }) : ag.rows;
      var bk = Object.keys(BK).map(function (k) { return { l: T(BK[k][0]), v: ag.B[k], go: 'AP-003', qs: 'b=' + k, hi: k === 'overdue' && ag.B[k] > 0 }; });
      var dpoTxt = ag.dpo == null ? '—' : n0(ag.dpo, 1) + ' ' + t(L('hari', 'days'));
      return P.head(t(L('Utang per umur dan supplier. Termasuk invoice yang belum disetujui (belum dijurnal).', 'Payables by age and supplier. Includes invoices not yet approved (not journalised).')), A.btn('ghost', L('Jadwal Pembayaran', 'Payment Schedule'), 'calendar', { go: 'AP-004' }), P.fresh({ src: L('Subledger AP + akun 2100', 'AP subledger + account 2100'), kind: 'mixed' })) +
        P.kpis([
          { k: L('Total utang terbuka', 'Total open payables'), v: rpj(ag.total), s: n0(ag.rows.length) + ' ' + t(L('invoice', 'invoices')), icon: 'clock', go: 'AP-001' },
          { k: T(BK.overdue[0]), v: rpj(ag.B.overdue), tone: ag.B.overdue ? 'crit' : 'ok', icon: 'alert', go: 'AP-003', q: { b: 'overdue' } },
          { k: T(BK.d7[0]), v: rpj(ag.B.d7), tone: ag.B.d7 ? 'warn' : null, icon: 'calendar', go: 'AP-003', q: { b: 'd7' } },
          { k: T(BK.d30[0]), v: rpj(ag.B.d30), icon: 'calendar', go: 'AP-003', q: { b: 'd30' } },
          { k: L('DPO', 'DPO'), v: dpoTxt, s: t(L('Utang ÷ HPP (tanpa tenaga kerja) × hari · ', 'AP ÷ COGS (excl. labour) × days · ')) + mon(lc), icon: 'gauge' },
          { k: L('Saldo akun 2100', 'Account 2100 balance'), v: rpj(gl), s: P.accLink('2100'), icon: 'list' }
        ]) +
        '<div class="g2-10">' + card(L('Umur utang', 'Payables by age'), A.hbars(bk, { fmt: rpj }) + note(t(L('Klik bucket untuk memfilter daftar.', 'Click a bucket to filter the list.')), 'filter', 'info'), { icon: 'clock' }) +
        card(L('Per supplier', 'By supplier'), P.table(ag.bySup, [
          { h: L('Supplier / kategori', 'Supplier / category'), v: function (x) { return x.sup ? supLink(x.sup) : catN(x.k); } },
          { h: L('Invoice', 'Invoices'), cls: 'r num', v: function (x) { return n0(x.n); } },
          { h: L('Terbuka', 'Open'), cls: 'r num', v: function (x) { return rp(x.total); } },
          { h: L('Porsi', 'Share'), v: function (x) { return P.bar(x.total, ag.bySup[0].total, 'info') + '<small class="sub5">' + pct(x.total / ag.total * 100, 0) + '</small>'; } }
        ], function (x) { return { t: x.sup ? esc(F.supName(x.sup)) : catN(x.k), r: rp(x.total), s: n0(x.n) + ' ' + t(L('invoice', 'invoices')) }; }, function (x) { return x.sup ? href('AP-001', null, { sup: x.sup }) : href('AP-001', null, { cat: x.k }); }), { icon: 'briefcase' }) + '</div>' +
        card(c.q.b ? L('Rincian utang · ' + BK[c.q.b][0][0], 'Payable detail · ' + BK[c.q.b][0][1]) : L('Rincian utang', 'Payable detail'), (c.q.b ? '<p>' + A.btn('ghost', L('Hapus filter', 'Clear filter'), 'x', { go: 'AP-003', cls: 'btn-sm' }) + '</p>' : '') + P.table(rows, [
          { h: L('ID', 'ID'), v: function (r) { return mono(r.exp.id); } },
          { h: L('Penerima', 'Payee'), v: function (r) { return '<b>' + payee(r.exp) + '</b><small class="sub5">' + esc(r.exp.sinv || '') + '</small>'; } },
          { h: L('Jatuh tempo', 'Due'), v: function (r) { return dueTxt(r.exp); } },
          { h: L('Umur', 'Age'), v: function (r) { return A.chip(BK[r.b][1], BK[r.b][0]); } },
          { h: L('Sisa', 'Open'), cls: 'r num', v: function (r) { return rp(r.open); } },
          { h: L('Dijurnal', 'Journalised'), v: function (r) { return r.booked ? A.chip('ok', L('Ya', 'Yes'), 'check') : A.chip('mute', L('Belum (belum disetujui)', 'Not yet (not approved)')); } },
          { h: L('Status', 'Status'), v: function (r) { return expC(r.exp); } }
        ], function (r) { return { t: mono(r.exp.id) + ' · ' + payee(r.exp), r: rp(r.open), s: t(L('jatuh tempo ', 'due ')) + dt(r.exp.due), chip: A.chip(BK[r.b][1], BK[r.b][0]) }; }, function (r) { return href('AP-002', r.exp.id); }), { icon: 'list', count: rows.length }) +
        note(t(L('Rekonsiliasi: saldo akun 2100 = invoice supplier yang sudah disetujui dan belum dibayar (' + rpj(booked) + ' dari subledger). Invoice payroll dan pajak memakai akun kewajiban masing-masing.', 'Reconciliation: account 2100 = approved unpaid supplier invoices (' + rpj(booked) + ' from the subledger). Payroll and tax invoices use their own liability accounts.')), 'scale', Math.abs(booked - gl) < 1000 ? 'ok' : 'warn');
    }
  };

  /* ================= NP-04 · AP-004 Payment Schedule ================= */
  V['AP-004'] = {
    render: function (c) {
      var c0 = cx(), days = +(c.q.d || 30), ps = F.paySchedule(c0, days); if (!ps) return A.stateCard('noperm', F.MSG.noperm);
      var tr = F.treasury(c0), items = []; ps.days.forEach(function (d) { items = items.concat(d.items); });
      var short = items.filter(function (x) { return x.short; }), od = items.filter(function (x) { return x.overdue; }), unsched = items.filter(function (x) { return !x.acc; });
      var accOut = {}; items.forEach(function (x) { var a = x.acc || 'ACC-01'; accOut[a] = (accOut[a] || 0) + x.amt; });
      var waitAmt = sum(ps.waiting.map(openOf));
      var dayHtml = ps.days.map(function (d) {
        return '<section class="ap10-day"><div class="ap10-day-h"><b>' + dt(d.date) + '</b>' + (d.date === F.today() ? A.chip('appr', L('Hari ini', 'Today')) : '') + '<span class="num">' + rp(d.total) + '</span></div>' +
          P.table(d.items, [
            { h: L('Invoice', 'Invoice'), v: function (x) { return lnk('AP-002', x.exp.id, mono(x.exp.id)) + (x.overdue ? ' ' + A.chip('crit', L('Lewat tempo', 'Overdue')) : ''); } },
            { h: L('Penerima', 'Payee'), v: function (x) { return '<b>' + payee(x.exp) + '</b><small class="sub5">' + t(x.exp.desc) + '</small>'; } },
            { h: L('Rekening', 'Account'), v: function (x) { return x.acc ? cashLink(x.acc) : A.chip('appr', L('Belum dijadwalkan', 'Not scheduled'), 'hourglass') + '<small class="sub5">' + t(L('default BCA Operasional', 'default BCA Operating')) + '</small>'; } },
            { h: L('Nilai', 'Amount'), cls: 'r num', v: function (x) { return rp(x.amt); } },
            { h: L('Saldo setelah', 'Balance after'), cls: 'r num', v: function (x) { return '<span class="' + (x.short ? 'ap10-crit' : '') + '">' + rp(x.after) + '</span>'; } },
            { h: '', cls: 'r', v: function (x) { return can('ap.pay') ? '<span class="ap10-ra">' + (x.acc ? '' : A.btn('ghost', L('Jadwalkan', 'Schedule'), 'calendar', { act: 'sched', val: x.exp.id, cls: 'btn-sm' })) + A.btn('blue', L('Bayar', 'Pay'), 'coins', { act: 'pay', val: x.exp.id, cls: 'btn-sm' }) + '</span>' : ''; } }
          ], function (x) { return { t: mono(x.exp.id) + ' · ' + payee(x.exp), r: rp(x.amt), s: x.acc ? esc((F.cashAcc(x.acc) || {}).n || '') : t(L('Belum dijadwalkan', 'Not scheduled')), chip: x.short ? A.chip('crit', L('Saldo kurang', 'Short'), 'alert') : '' }; }, null) + '</section>';
      }).join('');
      var after = tr ? tr.avail - ps.total : null;
      var recC = short.length ? P.rec({ title: L('Saldo rekening tidak cukup', 'Account balance not sufficient'), tone: 'crit', sig: L(short.length + ' pembayaran membuat saldo rekening negatif.', short.length + ' payments push an account balance below zero.'),
          why: short.map(function (x) { return L(x.exp.id + ' dari ' + (F.cashAcc(x.acc || 'ACC-01') || {}).n + ': saldo setelah ' + rp(x.after), x.exp.id + ' from ' + (F.cashAcc(x.acc || 'ACC-01') || {}).n + ': balance after ' + rp(x.after)); }),
          impact: L('Pembayaran akan ditolak sistem (saldo tidak cukup).', 'The system will refuse the payment (insufficient balance).'), rec: L('Pindahkan jadwal ke rekening lain atau transfer dana dulu.', 'Move the schedule to another account or transfer funds first.'), act: { n: L('Treasury', 'Treasury'), s: 'CASH-001' } })
        : od.length ? P.rec({ title: L('Utang lewat jatuh tempo', 'Overdue payables'), tone: 'warn', sig: L(od.length + ' invoice lewat jatuh tempo (' + rpj(sum(od.map(function (x) { return x.amt; }))) + ').', od.length + ' invoices overdue (' + rpj(sum(od.map(function (x) { return x.amt; }))) + ').'),
          why: od.map(function (x) { return L(x.exp.id + ' · ' + payee(x.exp) + ' · jatuh tempo ' + x.exp.due, x.exp.id + ' · ' + payee(x.exp) + ' · due ' + x.exp.due); }), impact: L('Risiko denda dan hubungan supplier.', 'Risk of penalties and supplier relations.'), rec: L('Bayar hari ini bila kas bebas cukup.', 'Pay today if free cash allows.'), act: { n: L('AP Aging', 'AP Aging'), s: 'AP-003' } }) : '';
      return P.head(t(L('Pembayaran yang disetujui per tanggal dan rekening, dengan dampak ke kas.', 'Approved payments by date and account, with the cash impact.')), A.btn('ghost', L('AP Aging', 'AP Aging'), 'clock', { go: 'AP-003' }), P.fresh({ src: L('Subledger AP + saldo rekening', 'AP subledger + account balances'), kind: 'mixed' })) +
        tabs([['7', L('7 hari', '7 days')], ['30', L('30 hari', '30 days')], ['60', L('60 hari', '60 days')]], String(days), 'd', { seg: true, def: '30' }) +
        P.kpis([
          { k: L('Akan dibayar', 'To be paid'), v: rpj(ps.total), s: n0(items.length) + ' ' + t(L('pembayaran · ', 'payments · ')) + days + ' ' + t(L('hari', 'days')), icon: 'calendar' },
          tr ? { k: L('Kas tersedia', 'Available cash'), v: rpj(tr.avail), s: t(L('tanpa rekening dibatasi', 'excl. restricted accounts')), icon: 'coins', go: 'CASH-001' } : null,
          tr ? { k: L('Kas bebas (treasury)', 'Free cash (treasury)'), v: rpj(tr.free), s: t(L('setelah komitmen 30 hari ', 'after 30-day commitments ')) + rpj(tr.committed), tone: tr.free < 0 ? 'crit' : 'ok', icon: 'gauge', go: 'CASH-001' } : null,
          after != null ? { k: L('Kas setelah jadwal ini', 'Cash after this schedule'), v: rpj(after), s: t(L('kas tersedia − pembayaran', 'available cash − payments')), tone: after < 0 ? 'crit' : null, icon: 'arrowdn' } : null,
          { k: L('Belum dijadwalkan', 'Not scheduled'), v: n0(unsched.length), s: rpj(sum(unsched.map(function (x) { return x.amt; }))), tone: unsched.length ? 'appr' : 'ok', icon: 'hourglass' },
          { k: L('Menunggu verifikasi / approval', 'Waiting verification / approval'), v: n0(ps.waiting.length), s: rpj(waitAmt) + ' · ' + t(L('belum masuk jadwal', 'not in the schedule')), icon: 'filecheck', go: 'AP-001', q: { st: 'received' } }
        ]) + recC +
        card(L('Jadwal per tanggal', 'Schedule by date'), dayHtml || A.empty(L('Tidak ada pembayaran dalam periode ini.', 'No payments in this window.')), { icon: 'calendar', count: items.length }) + '<div class="g2-10">' +
        card(L('Dampak per rekening', 'Impact by account'), P.table(Object.keys(ps.accs).filter(function (a) { return accOut[a] || !(F.cashAcc(a) || {}).restricted; }).map(function (a) { return { a: a, bal: ps.accs[a], out: accOut[a] || 0 }; }), [
          { h: L('Rekening', 'Account'), v: function (x) { return cashLink(x.a); } }, { h: L('Saldo', 'Balance'), cls: 'r num', v: function (x) { return rpj(x.bal); } },
          { h: L('Keluar', 'Out'), cls: 'r num', v: function (x) { return x.out ? '−' + rpj(x.out) : '—'; } }, { h: L('Sisa', 'After'), cls: 'r num', v: function (x) { return '<b class="' + (x.bal - x.out < 0 ? 'ap10-crit' : '') + '">' + rpj(x.bal - x.out) + '</b>'; } }
        ], function (x) { return { t: esc((F.cashAcc(x.a) || {}).n || x.a), r: rpj(x.bal - x.out), s: t(L('saldo ', 'balance ')) + rpj(x.bal) + (x.out ? ' · −' + rpj(x.out) : '') }; }, null), { icon: 'coins' }) +
        (ps.waiting.length ? card(L('Belum masuk jadwal', 'Not in the schedule yet'), '<ul class="ap10-mini">' + ps.waiting.map(function (e) { return '<li>' + lnk('AP-002', e.id, mono(e.id)) + ' ' + expC(e) + '<span>' + payee(e) + '</span><b class="num">' + rpj(openOf(e)) + '</b></li>'; }).join('') + '</ul>', { icon: 'hourglass' }) : '') + '</div>';
    },
    act: expActs
  };

  /* ================= NP-04 · AP-005 Payment Detail ================= */
  V['AP-005'] = {
    title: function (rec) { return rec ? L('Pembayaran ' + rec, 'Payment ' + rec) : null; },
    render: function (c) {
      var all = F.state().apays.slice().sort(function (a, b) { return a.at < b.at ? 1 : -1; });
      if (!c.rec) {
        return P.head(t(L('Semua pembayaran AP: rekening, invoice, jurnal.', 'All AP payments: account, invoice, journal.')), A.btn('ghost', L('Jadwal Pembayaran', 'Payment Schedule'), 'calendar', { go: 'AP-004' }), P.fresh({ src: L('Pembayaran AP', 'AP payments') })) +
          card(L('Pembayaran', 'Payments'), P.table(all, [
            { h: L('ID', 'ID'), v: function (p) { return mono(p.id); } }, { h: L('Tanggal', 'Date'), v: function (p) { return dt(p.date); } },
            { h: L('Invoice', 'Invoice'), v: function (p) { var e = F.expense(p.exp); return mono(p.exp) + (e ? '<small class="sub5">' + payee(e) + '</small>' : ''); } },
            { h: L('Rekening', 'Account'), v: function (p) { return esc((F.cashAcc(p.acc) || {}).n || p.acc); } }, { h: L('Nilai', 'Amount'), cls: 'r num', v: function (p) { return rp(p.amt); } }, { h: L('Jurnal', 'Journal'), v: function (p) { return esc(p.jv || '—'); } }
          ], function (p) { var e = F.expense(p.exp); return { t: mono(p.id) + (e ? ' · ' + payee(e) : ''), r: rp(p.amt), s: dt(p.date) }; }, function (p) { return href('AP-005', p.id); }), { icon: 'coins', count: all.length });
      }
      var p = by(all, 'id', c.rec);
      if (!p) return A.stateCard('empty', L('Pembayaran tidak ditemukan.', 'Payment not found.'), A.btn('blue', L('Semua pembayaran', 'All payments'), 'list', { go: 'AP-005' }));
      var e = F.expense(p.exp), j = p.jv ? F.jv(p.jv) : null, acc = F.cashAcc(p.acc), others = e ? F.apPaymentsOf(e.id).filter(function (x) { return x.id !== p.id; }) : [];
      return P8.hero({ id: p.id, icon: 'coins', title: rp(p.amt), sub: e ? payee(e) + ' · ' + esc(e.sinv || '') + ' · ' + t(e.desc) : '', chips: e ? expC(e) : '',
          facts: [[L('Tanggal bayar', 'Payment date'), dt(p.date)], [L('Rekening', 'Account'), cashLink(p.acc)], [L('Invoice', 'Invoice'), e ? expLink(e.id) : esc(p.exp)], [L('Supplier', 'Supplier'), e && e.sup ? supLink(e.sup) : e ? srcN(e.src) : '—'],
            [L('Dibayar oleh', 'Paid by'), emp(p.by)], [L('Disetujui oleh', 'Approved by'), e && e.appr ? emp(e.appr) : '—'], [L('Jurnal', 'Journal'), jvLink(p.jv)]] }) +
        '<div class="g21-10"><div class="col10">' + card(L('Jurnal pembayaran', 'Payment journal'), j ? '<p class="ap10-jh">' + jvLink(j.id) + ' · ' + dt(j.date) + ' · ' + stc(F.JV_ST, j.st) + '</p>' + P.jlines(j.lines) + P.traceChain(F.trace(j.id)) : A.empty(L('Belum ada jurnal.', 'No journal yet.')), { icon: 'list' }) +
        (e ? card(L('Invoice yang dibayar', 'Invoice paid'), kv([[L('Total invoice', 'Invoice total'), rp(tot(e))], [L('Total dibayar', 'Total paid'), rp(e.paid)], [L('Sisa', 'Open'), rp(openOf(e))], [L('Jatuh tempo', 'Due'), dt(e.due)], [L('Dijadwalkan', 'Scheduled'), e.sched ? dt(e.sched.date) + ' · ' + emp(e.sched.by) : '—']]) +
          (others.length ? '<h3 class="ap10-h3">' + t(L('Pembayaran lain untuk invoice ini', 'Other payments for this invoice')) + '</h3><ul class="ap10-mini">' + others.map(function (x) { return '<li>' + lnk('AP-005', x.id, mono(x.id)) + '<span>' + dt(x.date) + '</span><b class="num">' + rp(x.amt) + '</b></li>'; }).join('') + '</ul>' : ''), { icon: 'invoice', link: ['AP-002', L('Buka invoice', 'Open invoice'), e.id] }) : '') + '</div><div class="col10">' +
        card(L('Rekening & rekonsiliasi', 'Account & reconciliation'), kv([[L('Rekening', 'Account'), acc ? esc(acc.n) + (acc.no ? '<small class="sub5">' + esc(acc.bank + ' · ' + acc.no) + '</small>' : '') : esc(p.acc)], [L('Akun GL', 'GL account'), acc ? P.accLink(acc.coa) : '—'], [L('Saldo saat ini', 'Current balance'), rp(F.accBal(p.acc))], [L('Rekonsiliasi terakhir', 'Last reconciliation'), acc && acc.recAt ? dt(acc.recAt) : '—']]) +
          (acc && acc.bank ? '<p>' + (H.open('CASH-005') ? A.btn('ghost', L('Rekonsiliasi bank', 'Bank reconciliation'), 'scale', { go: 'CASH-005', rec: p.acc, cls: 'btn-sm' }) : '') + '</p>' : ''), { icon: 'card' }) +
        card(L('Audit', 'Audit'), kv([[L('Dicatat', 'Recorded'), esc(p.at) + ' · ' + emp(p.by)], [L('Maker-checker', 'Maker-checker'), e ? t(L('Input: ', 'Entered: ')) + emp(e.by) + ' · ' + t(L('Setuju: ', 'Approved: ')) + (e.appr ? emp(e.appr) : '—') + ' · ' + t(L('Bayar: ', 'Paid: ')) + emp(p.by) : '—']]), { icon: 'shield' }) + '</div></div>';
    }
  };

  /* ================= Shared HPP helpers ================= */
  var GIC = { drop: 'droplet' };
  var GORDER = ['chemical', 'utility', 'labor', 'machine', 'overhead', 'logistics'];   // the formula order
  var GCLS = { chemical: 'c-blue', utility: 'c-fresh', labor: 'c-orange', overhead: 'c-ok', machine: 'ap10-c5', logistics: 'ap10-c6' };
  var GSHORT = { chemical: L('Kimia/kg', 'Chemical/kg'), utility: L('Utilitas/kg', 'Utility/kg'), labor: L('Tenaga kerja/kg', 'Labour/kg'), machine: L('Mesin/kg', 'Machine/kg'), overhead: L('Overhead/kg', 'Overhead/kg'), logistics: L('Delivery/kg', 'Delivery/kg') };
  var GNAME = { chemical: L('Kimia', 'Chemical'), utility: L('Utilitas', 'Utility'), labor: L('Tenaga kerja', 'Labour'), machine: L('Mesin', 'Machine'), overhead: L('Overhead', 'Overhead'), logistics: L('Delivery', 'Delivery') };
  var BEH = { 'var': [L('Variabel', 'Variable'), 'info'], semi: [L('Semi-variabel', 'Semi-variable'), 'appr'], fixed: [L('Tetap', 'Fixed'), 'mute'] };
  var GCC = { chemical: 'CC-PRD', utility: 'CC-PRD', labor: 'CC-PRD', overhead: 'CC-ADM', machine: 'CC-PRD', logistics: 'CC-LOG' };
  var LCC = { maintenance: 'CC-MNT', rent: 'CC-PRD', waste: 'CC-PRD', mgmt: 'CC-MGT' };
  var GSRC = { chemical: [L('Konsumsi stok (kartu stok)', 'Stock consumption (stock card)'), 'INV-001'], utility: [L('Tagihan utilitas (AP)', 'Utility bills (AP)'), 'AP-001'], labor: [L('Rekap payroll HR', 'HR payroll summary'), null],
    overhead: [L('Buku besar (porsi produksi)', 'General ledger (production share)'), 'ACC-003'], machine: [L('Register aset · penyusutan', 'Asset register · depreciation'), 'AST-004'], logistics: [L('Armada & delivery', 'Fleet & delivery'), null] };
  function grp(k) { return by(D.HPP_GROUPS.map(function (g) { return { k: g[0], n: g[1], i: GIC[g[2]] || g[2] }; }), 'k', k); }
  function grpOf(line) { var g = null; Object.keys(D.HPP_COMP).forEach(function (k) { if (line in D.HPP_COMP[k]) g = k; }); return g; }
  function hppP(c) { var ps = F.hppPeriods(); return ps.indexOf(c.q.p) >= 0 ? c.q.p : ps[ps.length - 1]; }
  function prevP(p) { var ps = F.hppPeriods(), i = ps.indexOf(p); return i > 0 ? ps[i - 1] : null; }
  function perTabsH(p) { var ps = F.hppPeriods(); return tabs(ps.map(function (x) { var st = (F.period(x) || {}).st; return [x, L(mon(x), mon(x)), st === 'closed' || st === 'locked' ? 'lock' : null]; }), p, 'p', { seg: true, def: ps[ps.length - 1] }); }
  function hppFresh(h) {
    var st = (F.period(h.p) || {}).st || 'open';
    return P.fresh({ src: L('HPP v' + h.v + ' · ' + mon(h.p) + ' · ' + T(F.PER_ST[st][0]), 'HPP v' + h.v + ' · ' + mon(h.p) + ' · ' + F.PER_ST[st][0][1]), at: h.at, kind: st === 'open' ? 'live' : st === 'soft' ? 'snapshot' : 'ledger' });
  }
  function rpk(v) { return v == null || isNaN(v) ? '—' : 'Rp ' + n0(v); }
  function dPct(a, b, lowerGood) { if (a == null || b == null || !b) return ''; return H.delta((a - b) / b * 100, { u: '%', dir: lowerGood ? 'lower' : 'higher' }); }
  function formula(h) {
    var per = F.hppPerKg(h);
    return '<div class="ap10-fx" role="group" aria-label="' + t(L('Rumus HPP per kg', 'HPP per kg formula')) + '">' + GORDER.map(function (g, i) {
      return (i ? '<span class="ap10-op">+</span>' : '') + '<span class="ap10-fx-i"><small>' + t(GSHORT[g]) + '</small><b class="num">' + rpk(per[g]) + '</b></span>';
    }).join('') + '<span class="ap10-op">=</span><span class="ap10-fx-i ap10-fx-t"><small>' + t(L('HPP/kg', 'HPP/kg')) + '</small><b class="num">' + rpk(h.hpp) + '</b></span></div>' +
      '<p class="sub5 ap10-fx-n">' + t(L('Komponen/kg = biaya komponen periode ÷ volume periode (' + n0(h.vol) + ' kg ekuivalen). Total ' + rp(h.total) + ' ÷ ' + n0(h.vol) + ' kg = ' + rpk(h.hpp) + '/kg.', 'Component/kg = the period component cost ÷ the period volume (' + n0(h.vol) + ' kg equivalent). Total ' + rp(h.total) + ' ÷ ' + n0(h.vol) + ' kg = ' + rpk(h.hpp) + '/kg.')) + '</p>';
  }
  function avgItemW() { var it = F.state().items.filter(function (i) { return i.active; }), w = 0, v = 0; it.forEach(function (i) { var x = F.weightAt(i.code, '2026-09-15'); w += x * i.vol; v += i.vol; }); return v ? w / v : 0; }

  /* ================= NP-05 · HPP-001 HPP Dashboard ================= */
  V['HPP-001'] = {
    render: function (c) {
      var p = hppP(c), h = F.hppOf(p), pp = prevP(p), hb = pp ? F.hppOf(pp) : null, ser = F.hppSeries(), ins = F.hppInsight(p), aw = avgItemW();
      if (!h) return A.stateCard('empty', L('Belum ada HPP untuk periode ini.', 'No HPP for this period yet.'));
      var parts = GORDER.map(function (g) { return { n: grp(g).n, v: h.groups[g], cls: GCLS[g] }; });
      var al = F.allocation(p), top = F.state().items.filter(function (i) { return i.active; }).sort(function (a, b) { return b.vol - a.vol; }).slice(0, 6).map(function (i) { return F.hppItem(i.code, p); }).filter(Boolean);
      var pcsSvc = al ? al.rows.filter(function (x) { return x.unit === 'pcs'; }) : [];
      return P.head(t(L('HPP per kg, per pcs dan per item untuk periode terpilih. HPP disimpan per periode dan tidak dihitung ulang dengan biaya baru.', 'HPP per kg, per pcs and per item for the selected period. HPP is stored per period and never recalculated with new costs.')),
          A.btn('ghost', L('Rincian', 'Breakdown'), 'layers', { go: 'HPP-002', qs: 'p=' + p }) + A.btn('ghost', L('Versi', 'Versions'), 'history', { go: 'HPP-004' }), hppFresh(h)) + P.deskOnly() +
        perTabsH(p) +
        P.kpis([
          { k: L('HPP / kg', 'HPP / kg'), v: rpk(h.hpp), s: (hb ? dPct(h.hpp, hb.hpp, true) + ' ' + t(L('vs ', 'vs ')) + mon(pp, false) : '') + ' · v' + h.v, icon: 'gauge', tone: hb && h.hpp > hb.hpp ? 'warn' : 'ok', go: 'HPP-002', q: { p: p } },
          { k: L('HPP / pcs (rata-rata)', 'HPP / pcs (average)'), v: rpk(h.hpp * aw), s: t(L('HPP/kg × berat item rata-rata ', 'HPP/kg × average item weight ')) + (fw(aw)), icon: 'shirt', go: 'ITEM-004' },
          { k: L('Total biaya produksi', 'Total production cost'), v: rpj(h.total), s: hb ? dPct(h.total, hb.total, true) : '', icon: 'coins', go: 'HPP-002', q: { p: p } },
          { k: L('Volume', 'Volume'), v: n0(h.vol) + ' kg', s: (hb ? dPct(h.vol, hb.vol) : '') + ' ' + t(L('kg ekuivalen', 'kg equivalent')), icon: 'scale' },
          ins ? { k: L('Gross margin (HPP)', 'Gross margin (HPP)'), v: pct(ins.gmA), s: H.delta(ins.dGm, { u: ' pp' }) + ' ' + t(L('(Pendapatan/kg − HPP/kg) ÷ Pendapatan/kg', '(Revenue/kg − HPP/kg) ÷ Revenue/kg')), icon: 'percent', go: 'HPP-005', q: { p: p } } : null
        ]) +
        card(L('Rumus HPP per kg', 'HPP per kg formula'), formula(h), { icon: 'target' }) +
        '<div class="g2-10">' + card(L('Komposisi HPP', 'HPP composition'), H.donut(parts, { center: rpk(h.hpp), sub: L('per kg', 'per kg'), label: L('Komposisi HPP', 'HPP composition') }), { icon: 'layers', link: ['HPP-002', L('Rincian', 'Breakdown')] }) +
        card(L('Tren HPP/kg', 'HPP/kg trend'), A.lineChart([{ n: L('HPP/kg', 'HPP/kg'), v: ser.map(function (x) { return x.hpp; }) }], ser.map(function (x) { return mon(x.p, false); }), { min: Math.floor(Math.min.apply(null, ser.map(function (x) { return x.hpp; })) * 0.95 / 100) * 100, fmt: function (v) { return 'Rp ' + n0(v); }, label: T(L('Tren HPP per kg', 'HPP per kg trend')) }) +
          '<p class="sub5">' + t(L('Setiap titik = versi berlaku periode itu (dibekukan). ', 'Each point = the current version of that period (frozen). ')) + lnk('HPP-004', null, t(L('Lihat versi', 'See versions'))) + '</p>', { icon: 'trend' }) + '</div>' +
        '<div class="g2-10">' + card(L('HPP per layanan', 'HPP per service'), al ? P.table(al.rows, [
          { h: L('Layanan', 'Service'), v: function (x) { return '<b>' + esc(F.svcName(x.svc)) + '</b><small class="sub5">' + esc(x.svc) + ' · ' + esc(x.unit) + '</small>'; } },
          { h: L('HPP/kg', 'HPP/kg'), cls: 'r num', v: function (x) { return rpk(x.perKg); } },
          { h: L('HPP/unit', 'HPP/unit'), cls: 'r num', v: function (x) { return rpk(x.perUnit) + '<small class="ap10-u">/' + esc(x.unit) + '</small>'; } }
        ], function (x) { return { t: esc(F.svcName(x.svc)), r: rpk(x.perKg) + '/kg' }; }, null) : '', { icon: 'sort', link: ['HPP-003', L('Alokasi', 'Allocation')] }) +
        card(L('HPP per item (volume tertinggi)', 'HPP per item (highest volume)'), P.table(top, [
          { h: L('Item', 'Item'), v: function (x) { return itemLink(x.item.code) + '<small class="sub5">' + t(x.item.n) + '</small>'; } },
          { h: L('Berat standar', 'Standard weight'), cls: 'r num', v: function (x) { return (fw(x.w)); } },
          { h: L('HPP/item', 'HPP/item'), cls: 'r num', v: function (x) { return '<b>' + rpk(x.perItem) + '</b><small class="sub5">' + rpk(x.perKg) + ' × ' + n0(x.w, 2) + ' kg</small>'; } }
        ], function (x) { return { t: t(x.item.n), r: rpk(x.perItem), s: (fw(x.w)) + ' · ' + rpk(x.perKg) + '/kg' }; }, function (x) { return href('ITEM-002', x.item.code); }) +
          (pcsSvc.length ? '<p class="sub5">' + t(L('Layanan per pcs: ', 'Per-pcs services: ')) + pcsSvc.map(function (x) { return esc(F.svcName(x.svc)) + ' ' + rpk(x.perUnit) + '/pcs'; }).join(' · ') + '</p>' : ''), { icon: 'towel', link: ['ITEM-004', L('Unit economics', 'Unit economics')] }) + '</div>' +
        (ins ? P.rec({ title: L('HPP Insight', 'HPP Insight'), icon: 'bulb', tone: ins.dH > 0 ? 'warn' : 'ok', sig: ins.signal, why: ins.why, impact: ins.impact, rec: ins.rec, act: { n: L('Buka HPP Insight', 'Open HPP Insight'), s: 'HPP-005', q: 'p=' + p } }) : '');
    }
  };

  /* ================= NP-05 · HPP-002 HPP Breakdown ================= */
  V['HPP-002'] = {
    render: function (c) {
      var p = hppP(c), h = F.hppOf(p), pp = prevP(p), hb = pp ? F.hppOf(pp) : null; if (!h) return A.stateCard('empty', L('Belum ada HPP.', 'No HPP yet.'));
      var beh = F.hppBehavior(h);
      var rows = '';
      GORDER.forEach(function (g) {
        var G0 = grp(g), drv = D.HPP_ALLOC[g], src = GSRC[g];
        rows += '<tr class="ap10-gr"><th colspan="5">' + ic(G0.i) + ' ' + t(G0.n) + '</th><td class="r num">' + rp(h.groups[g]) + '</td><td class="r num">' + rpk(h.groups[g] / h.vol) + '</td><td class="r num">' + pct(h.groups[g] / h.total * 100) + '</td><td class="r">' + (hb ? dPct(h.groups[g], hb.groups[g], true) : '') + '</td></tr>';
        Object.keys(D.HPP_COMP[g]).forEach(function (k) {
          var b = D.HPP_BEH[k] || 'fixed', v = h.comp[k], v0 = hb ? hb.comp[k] : null;
          rows += '<tr><td class="ap10-ln">' + t(D.HPP_LINES[k]) + '</td><td>' + A.chip(BEH[b][1], BEH[b][0]) + '</td><td>' + ccN(LCC[k] || GCC[g]) + '</td><td>' + t(F.DRIVERS[drv]) + '</td><td>' + (src[1] ? lnk(src[1], null, t(src[0])) : t(src[0])) + '</td>' +
            '<td class="r num">' + rp(v) + '</td><td class="r num">' + rpk(v / h.vol) + '</td><td class="r num">' + pct(v / h.total * 100) + '</td><td class="r">' + (v0 != null ? dPct(v, v0, true) : '') + '</td></tr>';
        });
      });
      var tbl = '<div class="tblw hide-m"><table class="tbl dense ap10-bk"><thead><tr><th>' + t(L('Komponen', 'Component')) + '</th><th>' + t(L('Perilaku', 'Behaviour')) + '</th><th>' + t(L('Cost center', 'Cost center')) + '</th><th>' + t(L('Driver alokasi', 'Allocation driver')) + '</th><th>' + t(L('Sumber', 'Source')) + '</th><th class="r">' + t(L('Nilai', 'Amount')) + '</th><th class="r">' + t(L('Per kg', 'Per kg')) + '</th><th class="r">' + t(L('Porsi', 'Share')) + '</th><th class="r">' + t(L('vs ', 'vs ')) + (pp ? esc(mon(pp, false)) : '—') + '</th></tr></thead><tbody>' + rows + '</tbody>' +
        '<tfoot><tr><th colspan="5">' + t(L('Total HPP', 'Total HPP')) + ' · ' + n0(h.vol) + ' ' + t(L('kg ekuivalen', 'kg equivalent')) + '</th><td class="r num"><b>' + rp(h.total) + '</b></td><td class="r num"><b>' + rpk(h.hpp) + '</b></td><td class="r num">100%</td><td class="r">' + (hb ? dPct(h.hpp, hb.hpp, true) : '') + '</td></tr></tfoot></table></div>';
      var mob = '<div class="hide-d hide-t">' + P.mtable(GORDER.map(function (g) { return { n: grp(g).n, v: rp(h.groups[g]), sub: rpk(h.groups[g] / h.vol) + '/kg' }; }).concat([{ n: L('Total HPP', 'Total HPP'), v: rp(h.total), sub: rpk(h.hpp) + '/kg', cls: 'tot' }])) + '</div>';
      var behC = P.mtable(['var', 'semi', 'fixed'].map(function (k) { return { n: BEH[k][0], v: rp(beh[k]), sub: rpk(beh[k] / h.vol) + '/kg · ' + pct(beh[k] / h.total * 100) }; }).concat([{ n: L('Total', 'Total'), v: rp(h.total), cls: 'tot' }]));
      return P.head(t(L('Setiap komponen HPP dengan perilaku biaya, cost center, driver, sumber, nilai dan per kg.', 'Every HPP component with cost behaviour, cost center, driver, source, amount and per kg.')), A.btn('ghost', L('Dashboard HPP', 'HPP Dashboard'), 'gauge', { go: 'HPP-001', qs: 'p=' + p }), hppFresh(h)) + P.deskOnly() +
        perTabsH(p) + card(L('Rumus', 'Formula'), formula(h), { icon: 'target' }) +
        card(L('Komponen HPP ' + mon(p), 'HPP components ' + mon(p)), tbl + mob, { icon: 'layers' }) +
        '<div class="g2-10">' + card(L('Perilaku biaya', 'Cost behaviour'), behC + note(t(L('Variabel ikut volume; semi-variabel sebagian; tetap tidak. Saat volume turun, biaya tetap per kg naik.', 'Variable moves with volume; semi-variable partly; fixed does not. When volume falls, fixed cost per kg rises.')), 'info', 'info'), { icon: 'sort' }) +
        card(L('Versi', 'Version'), kv([[L('Versi', 'Version'), 'v' + h.v + ' · ' + A.chip('ok', L('Berlaku', 'Current'))], [L('Dibuat', 'Created'), esc(h.at) + ' · ' + emp(h.by)], [L('Alasan', 'Reason'), t(h.reason)], [L('Status periode', 'Period status'), stc(F.PER_ST, (F.period(p) || {}).st)]]) +
          note(t(L('Penyusutan mesin diambil dari register aset periode ini, bukan dari biaya saat ini.', 'Machine depreciation comes from this period\'s asset register, not from the current cost.')), 'washer', 'info'), { icon: 'history', link: ['HPP-004', L('Semua versi', 'All versions')] }) + '</div>';
    }
  };

  /* ================= NP-05 · HPP-003 Allocation ================= */
  V['HPP-003'] = {
    render: function (c) {
      var p = hppP(c), a = F.allocation(p); if (!a) return A.stateCard('empty', L('Belum ada HPP.', 'No HPP yet.'));
      var h = a.h, view = ['cl', 'prop'].indexOf(c.q.v) >= 0 ? c.q.v : 'svc';
      var drv = '<div class="ap10-drv">' + GORDER.map(function (g) { var k = D.HPP_ALLOC[g]; return '<div><span>' + ic(grp(g).i) + t(grp(g).n) + '</span><b class="num">' + rpj(h.groups[g]) + '</b><small>' + t(L('dibagi per ', 'split by ')) + t(F.DRIVERS[k]) + ' · ' + t(L('total ', 'total ')) + n0(a.tot[k]) + '</small></div>'; }).join('') + '</div>';
      var body;
      if (view === 'svc') {
        body = card(L('Alokasi per layanan', 'Allocation per service'), P.table(a.rows, [
          { h: L('Layanan', 'Service'), v: function (x) { return '<b>' + esc(F.svcName(x.svc)) + '</b><small class="sub5">' + esc(x.svc) + ' · ' + esc(x.unit) + '</small>'; } },
          { h: L('kg ek.', 'kg eq.'), cls: 'r num', v: function (x) { return n0(x.v); } },
          { h: L('Menit kerja', 'Labour min'), cls: 'r num', v: function (x) { return n0(x.d.labor); } },
          { h: L('Indeks kimia', 'Chem. index'), cls: 'r num', v: function (x) { return n0(x.d.chem); } },
          { h: L('Stop', 'Stops'), cls: 'r num', v: function (x) { return n0(x.d.dlv); } }
        ].concat(GORDER.map(function (g) { return { h: GNAME[g], cls: 'r num', v: function (x) { return rpj(x.alloc[g]); } }; })).concat([
          { h: L('Total', 'Total'), cls: 'r num', v: function (x) { return '<b>' + rpj(x.cost) + '</b>'; } },
          { h: L('HPP/kg', 'HPP/kg'), cls: 'r num', v: function (x) { return '<b>' + rpk(x.perKg) + '</b>'; } },
          { h: L('HPP/unit', 'HPP/unit'), cls: 'r num', v: function (x) { return rpk(x.perUnit) + '<small class="ap10-u">/' + esc(x.unit) + '</small>'; } }
        ]), function (x) { return { t: esc(F.svcName(x.svc)), r: rpk(x.perKg) + '/kg', s: n0(x.v) + ' kg ek. · ' + rpj(x.cost) }; }, null), { icon: 'sort' });
      } else {
        var rows = F.hppBy(view, p);
        body = card(view === 'cl' ? L('HPP per klien', 'HPP per client') : L('HPP per properti', 'HPP per property'), P.table(rows, [
          { h: view === 'cl' ? L('Klien', 'Client') : L('Properti', 'Property'), v: function (x) { return view === 'cl' ? '<b>' + P.cname(x.k) + '</b>' : '<b>' + P.pname(x.k) + '</b><small class="sub5">' + P.cname(x.cl) + '</small>'; } },
          { h: L('Volume kg ek.', 'Volume kg eq.'), cls: 'r num', v: function (x) { return n0(x.kgeq); } },
          { h: L('Pendapatan', 'Revenue'), cls: 'r num', v: function (x) { return rpj(x.rev); } },
          { h: L('Biaya HPP', 'HPP cost'), cls: 'r num', v: function (x) { return rpj(x.cost); } },
          { h: L('HPP/kg (mix layanan)', 'HPP/kg (service mix)'), cls: 'r num', v: function (x) { return rpk(x.perKg); } },
          { h: L('Gross margin', 'Gross margin'), cls: 'r num', v: function (x) { return '<b class="' + (x.margin < 20 ? 'ap10-crit' : '') + '">' + pct(x.margin) + '</b>'; } }
        ], function (x) { return { t: view === 'cl' ? P.cname(x.k) : P.pname(x.k), r: pct(x.margin), s: rpk(x.perKg) + '/kg · ' + rpj(x.rev) }; }, null), { icon: view === 'cl' ? 'building' : 'hotel', count: rows.length }) +
          note(t(L('HPP klien/properti = volume tiap layanan × HPP/kg layanan itu (periode ' + p + '). Mix layanan dari sales ledger September. Gross margin = (Pendapatan − HPP) ÷ Pendapatan.', 'Client/property HPP = each service volume × that service HPP/kg (period ' + p + '). Service mix from the September sales ledger. Gross margin = (Revenue − HPP) ÷ Revenue.')), 'info', 'info');
      }
      return P.head(t(L('Biaya tiap grup dibagi ke layanan menurut driver-nya; HPP klien dan properti mengikuti mix layanan mereka.', 'Each group\'s cost is spread to services by its driver; client and property HPP follow their service mix.')), A.btn('ghost', L('Dashboard HPP', 'HPP Dashboard'), 'gauge', { go: 'HPP-001', qs: 'p=' + p }), hppFresh(h)) + P.deskOnly() +
        perTabsH(p) + tabs([['svc', L('Per layanan', 'Per service'), 'sort'], ['cl', L('Per klien', 'Per client'), 'building'], ['prop', L('Per properti', 'Per property'), 'hotel']], view, 'v', { def: 'svc' }) +
        card(L('Driver alokasi', 'Allocation drivers'), drv + '<p class="sub5 ap10-fx-n">' + t(L('Alokasi grup ke layanan = biaya grup × (driver layanan ÷ total driver). Driver per layanan: menit kerja dan stop per kg ek. dari standar operasi.', 'Group allocation to a service = group cost × (service driver ÷ total driver). Service drivers: labour minutes and stops per kg eq. from the operating standard.')) + '</p>', { icon: 'target' }) + body;
    }
  };

  /* ================= NP-05 · HPP-004 Historical HPP ================= */
  function calcDlg(p0) {
    var ps = F.hppPeriods();
    P.reasonDlg({ title: L('Buat versi HPP baru', 'Create a new HPP version'), icon: 'refresh', ok: L('Hitung & simpan versi', 'Calculate & store version'),
      body: fld(L('Periode', 'Period'), sel('p', ps.slice().reverse().map(function (x) { var st = (F.period(x) || {}).st; return [x, mon(x) + ' · ' + T(F.PER_ST[st][0])]; }), p0 || ps[ps.length - 1]), { req: true, wide: true }) +
        note(t(L('Versi baru hanya untuk periode Open atau Soft Close. Versi lama tetap tersimpan; periode Closed/Locked tidak dihitung ulang.', 'A new version only for an Open or Soft Close period. Older versions stay stored; Closed/Locked periods are never recalculated.')), 'lock', 'info'),
      ph: L('mis. tagihan PLN September masuk', 'e.g. the September PLN bill arrived'),
      fn: function (reason, v) { return F.hppCalc(cx(), v.p, reason); }, done: L('Versi HPP baru disimpan.', 'New HPP version stored.') });
  }
  V['HPP-004'] = {
    render: function (c) {
      var ps = F.hppPeriods().slice().reverse(), ser = F.hppSeries();
      var blocks = ps.map(function (p) {
        var vs = F.hppVersions(p), st = (F.period(p) || {}).st || 'open', lock = st === 'closed' || st === 'locked', cur = vs.filter(function (v) { return v.st === 'current'; })[0];
        var diff = '';
        if (vs.length > 1) {
          var a = vs[0], b = vs[1], ch = Object.keys(a.comp).filter(function (k) { return Math.abs(a.comp[k] - b.comp[k]) >= 1000; });
          diff = '<p class="sub5">' + t(L('Perubahan v' + b.v + ' → v' + a.v + ': ', 'Change v' + b.v + ' → v' + a.v + ': ')) + (ch.length ? ch.map(function (k) { return t(D.HPP_LINES[k]) + ' ' + (a.comp[k] > b.comp[k] ? '+' : '−') + rpj(Math.abs(a.comp[k] - b.comp[k])); }).join(', ') : t(L('tidak ada perubahan komponen', 'no component change'))) + ' · HPP/kg ' + rpk(b.hpp) + ' → ' + rpk(a.hpp) + '</p>';
        }
        var act = lock ? '<span class="ap10-lock">' + ic('lock') + t(L('Ditolak untuk hitung ulang: periode ' + T(F.PER_ST[st][0]) + '. HPP historis tidak dihitung ulang dengan biaya saat ini.', 'Recalculation refused: the period is ' + F.PER_ST[st][0][1] + '. Historical HPP is never recalculated with current costs.')) + '</span>'
          : A.pbtn('hpp.calc', 'blue', L('Versi baru', 'New version'), 'refresh', { act: 'calc', val: p, cls: 'btn-sm' });
        return '<section class="ap10-per"><div class="ap10-per-h"><b>' + esc(mon(p)) + '</b>' + stc(F.PER_ST, st) + (cur ? '<span class="num">' + rpk(cur.hpp) + '/kg</span>' : '') + '<span class="ap10-per-a">' + act + '</span></div>' +
          P.table(vs, [
            { h: L('Versi', 'Version'), v: function (v) { return '<b>v' + v.v + '</b>'; } },
            { h: L('HPP/kg', 'HPP/kg'), cls: 'r num', v: function (v) { return rpk(v.hpp); } },
            { h: L('Total', 'Total'), cls: 'r num', v: function (v) { return rpj(v.total); } },
            { h: L('Volume', 'Volume'), cls: 'r num', v: function (v) { return n0(v.vol) + ' kg'; } },
            { h: L('Dibuat', 'Created'), v: function (v) { return esc(v.at) + '<small class="sub5">' + emp(v.by) + '</small>'; } },
            { h: L('Alasan', 'Reason'), v: function (v) { return t(v.reason); } },
            { h: L('Status', 'Status'), v: function (v) { return v.st === 'current' ? A.chip('ok', L('Berlaku', 'Current'), 'check') : A.chip('mute', L('Diganti', 'Superseded')); } }
          ], function (v) { return { t: 'v' + v.v + ' · ' + rpk(v.hpp) + '/kg', r: v.st === 'current' ? t(L('Berlaku', 'Current')) : '', s: esc(v.at) + ' · ' + t(v.reason) }; }, function () { return href('HPP-002', null, { p: p }); }) + diff + '</section>';
      }).join('');
      return P.head(t(L('HPP per periode dan versi. Periode lama tidak dihitung ulang dengan biaya baru; perubahan membuat versi baru.', 'HPP per period and version. Old periods are never recalculated with new costs; a change creates a new version.')),
          A.pbtn('hpp.calc', 'primary', L('Buat versi baru', 'Create new version'), 'refresh', { act: 'calc' }), P.fresh({ src: L('Versi HPP tersimpan', 'Stored HPP versions'), kind: 'ledger', at: F.hppVersions()[0].at })) +
        card(L('HPP/kg per periode (versi berlaku)', 'HPP/kg per period (current version)'), A.barChart(ser.map(function (x) { return { l: mon(x.p, false), v: x.hpp, hi: x.p === ser[ser.length - 1].p }; }), { fmt: function (v) { return 'Rp ' + n0(v); }, label: T(L('HPP per kg per periode', 'HPP per kg per period')), h: 200 }), { icon: 'chart' }) +
        card(L('Versi per periode', 'Versions per period'), blocks, { icon: 'history' });
    },
    act: { calc: function (el) { calcDlg(el.getAttribute('data-val')); } }
  };

  /* ================= NP-05 · HPP-005 HPP Insight ================= */
  V['HPP-005'] = {
    render: function (c) {
      var p = hppP(c), ins = F.hppInsight(p);
      var headA = A.btn('ghost', L('Dashboard HPP', 'HPP Dashboard'), 'gauge', { go: 'HPP-001', qs: 'p=' + p });
      if (!ins) return P.head(t(L('Kenapa HPP naik atau turun.', 'Why HPP rose or fell.')), headA) + perTabsH(p) + A.stateCard('empty', L('Periode pertama: belum ada pembanding bulan sebelumnya.', 'First period: no previous month to compare with.'));
      var max = Math.max.apply(null, ins.drivers.map(function (d) { return Math.abs(d.perKg); })) || 1, rev = ins.a.hpp / (1 - ins.gmA / 100);
      var actHtml = (H.open('INV-001') ? A.btn('primary', L('Konsumsi kimia/kg', 'Chemical use/kg'), 'droplet', { go: 'INV-001', cls: 'btn-sm' }) + ' ' : '') + (H.open('PRICE-003') ? A.btn('blue', L('Price Review', 'Price Review'), 'tag', { go: 'PRICE-003', cls: 'btn-sm' }) + ' ' : '') + A.btn('ghost', L('Rincian HPP', 'HPP breakdown'), 'layers', { go: 'HPP-002', qs: 'p=' + p, cls: 'btn-sm' }) + '<small class="sub5">' + t(ins.action) + '</small>';
      var bridge = '<ol class="ap10-br">' + '<li><span>' + t(L('HPP/kg ', 'HPP/kg ')) + esc(mon(ins.prev)) + '</span><b class="num">' + rpk(ins.b.hpp) + '</b></li>' +
        ins.drivers.map(function (d) { return '<li class="' + (d.perKg > 0 ? 'up' : 'dn') + '"><span>' + ic(grp(d.g).i) + t(grp(d.g).n) + ' <small>(' + (d.d >= 0 ? '+' : '') + d.d + '% ' + t(L('biaya', 'cost')) + ')</small></span>' + P.bar(d.perKg, max, d.perKg > 0 ? 'crit' : 'ok') + '<b class="num">' + (d.perKg >= 0 ? '+' : '−') + rpk(Math.abs(d.perKg)) + '</b></li>'; }).join('') +
        '<li class="tot"><span>' + t(L('HPP/kg ', 'HPP/kg ')) + esc(mon(ins.p)) + '</span><b class="num">' + rpk(ins.a.hpp) + '</b></li></ol>';
      return P.head(t(L('Kenapa HPP naik atau turun, dampaknya ke margin, dan apa yang harus dilakukan.', 'Why HPP rose or fell, the margin impact, and what to do.')), headA, hppFresh(ins.a)) +
        perTabsH(p) +
        P.kpis([
          { k: L('HPP/kg MoM', 'HPP/kg MoM'), v: (ins.dH >= 0 ? '+' : '') + pct(ins.dH), s: rpk(ins.b.hpp) + ' → ' + rpk(ins.a.hpp), tone: ins.dH > 0 ? 'warn' : 'ok', icon: 'gauge' },
          { k: L('Volume MoM', 'Volume MoM'), v: (ins.dV >= 0 ? '+' : '') + pct(ins.dV), s: n0(ins.b.vol) + ' → ' + n0(ins.a.vol) + ' kg', tone: ins.dV < 0 ? 'warn' : null, icon: 'scale' },
          { k: L('Gross margin (HPP)', 'Gross margin (HPP)'), v: pct(ins.gmA), s: pct(ins.gmB) + ' → ' + pct(ins.gmA) + ' · ' + (ins.dGm >= 0 ? '+' : '') + n0(ins.dGm, 1) + ' pp', tone: ins.dGm < 0 ? 'crit' : 'ok', icon: 'percent' },
          { k: L('Dampak ke laba bulan ini', 'Profit impact this month'), v: rpj(-(ins.a.hpp - ins.b.hpp) * ins.a.vol), s: t(L('(HPP/kg lalu − HPP/kg kini) × volume kini', '(previous HPP/kg − current HPP/kg) × current volume')), tone: ins.a.hpp > ins.b.hpp ? 'crit' : 'ok', icon: 'coins' }
        ]) +
        P.rec({ title: L('HPP ' + mon(ins.p), 'HPP ' + mon(ins.p)), icon: 'bulb', tone: ins.dH > 0 ? 'warn' : 'ok', sig: ins.signal, why: ins.why, impact: ins.impact, rec: ins.rec, act: actHtml }) +
        '<div class="g2-10">' + card(L('Jembatan HPP/kg: apa yang menggeser', 'HPP/kg bridge: what moved it'), bridge + '<p class="sub5">' + t(L('Kontribusi tiap grup = biaya grup ÷ volume kini − biaya grup ÷ volume lalu. Volume turun menaikkan biaya tetap per kg.', 'Each group\'s contribution = group cost ÷ current volume − group cost ÷ previous volume. Lower volume raises fixed cost per kg.')) + '</p>', { icon: 'sort' }) +
        card(L('Perubahan per grup', 'Change per group'), P.table(ins.drivers, [
          { h: L('Grup', 'Group'), v: function (d) { return t(grp(d.g).n); } },
          { h: L('Biaya MoM', 'Cost MoM'), cls: 'r num', v: function (d) { return (d.d >= 0 ? '+' : '') + pct(d.d); } },
          { h: L('Selisih biaya', 'Cost difference'), cls: 'r num', v: function (d) { return (d.abs >= 0 ? '+' : '−') + rpj(Math.abs(d.abs)); } },
          { h: L('Efek per kg', 'Effect per kg'), cls: 'r num', v: function (d) { return '<b class="' + (d.perKg > 0 ? 'ap10-crit' : '') + '">' + (d.perKg >= 0 ? '+' : '−') + rpk(Math.abs(d.perKg)) + '</b>'; } }
        ], function (d) { return { t: t(grp(d.g).n), r: (d.perKg >= 0 ? '+' : '−') + rpk(Math.abs(d.perKg)), s: (d.d >= 0 ? '+' : '') + pct(d.d) }; }, null) +
          '<p class="sub5">' + t(L('Gross margin = (Pendapatan/kg − HPP/kg) ÷ Pendapatan/kg; pendapatan/kg dari sales ledger September (' + rpk(rev) + '/kg).', 'Gross margin = (Revenue/kg − HPP/kg) ÷ Revenue/kg; revenue/kg from the September sales ledger (' + rpk(rev) + '/kg).')) + '</p>', { icon: 'chart' }) + '</div>';
    }
  };

  /* ================= Shared item helpers ================= */
  function catI(k) { return t(D.ITEM_CATS[k] || L(k, k)); }
  function procI(k) { return t(D.ITEM_PROC[k] || L(k, k)); }
  function wFmt(kgv) { return '<b class="num">' + n0(kgv, 2) + ' kg</b><small class="sub5">' + (fw(kgv)) + '</small>'; }
  // Display weight: grams below 1 kg, else kg (stored value is always kg).
  function fw(kgv) { return kgv == null || isNaN(kgv) ? '—' : kgv < 1 ? n0(Math.round(kgv * 1000)) + ' g' : P.kg(kgv); }
  function wvC(st) { return stc(F.ITEM_ST, st); }
  function prevVer(v) { var vs = F.weightVersions(v.code).filter(function (x) { return x.v < v.v && ['active', 'superseded', 'scheduled'].indexOf(x.st) >= 0; }); return vs[0] || null; }
  function proposeDlg(code) {
    var it = F.item(code), tom = U.addDays(F.today(), 1);
    P.reasonDlg({ title: L('Ajukan berat baru · ' + code, 'Propose a new weight · ' + code), icon: 'weight', ok: L('Ajukan', 'Propose'),
      sub: t(it.n) + ' · ' + t(L('berat sekarang ', 'current weight ')) + (fw(F.weightAt(code))),
      body: '<div class="fg5">' + fld(L('Berat baru', 'New weight'), inp('v', '', { num: true, ph: '0,50' }), { req: true }) + fld(L('Satuan', 'Unit'), sel('unit', [['kg', 'kg'], ['g', L('gram', 'gram')]], 'kg'), { req: true }) +
        fld(L('Tanggal berlaku', 'Effective date'), '<input name="eff" type="date" value="' + esc(tom) + '" min="' + esc(F.today()) + '">', { req: true, wide: true, hint: t(L('Tidak boleh mundur. Transaksi sebelum tanggal ini tetap memakai berat lama.', 'Cannot be backdated. Transactions before this date keep the old weight.')) }) + '</div>' +
        note(t(L('Disimpan dalam kg. Nilai yang tidak wajar (mis. 500 kg atau 0,5 gram) ditolak agar gram dan kg tidak tertukar.', 'Stored in kg. Unrealistic values (e.g. 500 kg or 0.5 gram) are refused so grams and kg are never mixed up.')), 'scale', 'info'),
      ph: L('mis. penimbangan ulang 200 pcs, rata-rata 498 g', 'e.g. re-weighed 200 pcs, average 498 g'),
      fn: function (reason, v) { return F.proposeWeight(cx(), code, { v: String(v.v).replace(',', '.'), unit: v.unit, eff: v.eff, reason: reason }); },
      done: L('Perubahan berat diajukan. Menunggu persetujuan.', 'Weight change proposed. Waiting for approval.') });
  }
  function decide(code, ok) {
    var v = F.weightPending().filter(function (x) { return x.code === code; })[0]; if (!v) return;
    var pv = prevVer(v), body = kv([[L('Item', 'Item'), esc(code) + ' · ' + t(F.itemName(code))], [L('Berat', 'Weight'), (pv ? (fw(pv.kg)) + ' → ' : '') + '<b>' + (fw(v.kg)) + '</b>'], [L('Berlaku', 'Effective'), dt(v.eff)], [L('Diajukan', 'Proposed by'), emp(v.by)], [L('Alasan', 'Reason'), t(v.reason)]]) +
      (v.by === me() ? note(t(F.MSG.maker), 'users', 'crit') : '');
    if (ok) P.confirmDlg({ title: L('Setujui berat ' + code, 'Approve weight ' + code), icon: 'checkc', ok: L('Setujui', 'Approve'), body: body, fn: function () { return F.decideWeight(cx(), code, true); }, done: L('Berat disetujui. Versi lama tetap di riwayat.', 'Weight approved. The old version stays in the history.') });
    else P.reasonDlg({ title: L('Tolak berat ' + code, 'Reject weight ' + code), icon: 'xc', ok: L('Tolak', 'Reject'), body: body, fn: function (r) { return F.decideWeight(cx(), code, false, r); }, done: L('Usulan berat ditolak.', 'Weight proposal rejected.') });
  }
  var itemActs = {
    propose: function (el) { proposeDlg(el.getAttribute('data-val')); },
    wok: function (el) { decide(el.getAttribute('data-val'), true); },
    wno: function (el) { decide(el.getAttribute('data-val'), false); }
  };

  /* ================= NP-06 · ITEM-001 Item Master ================= */
  V['ITEM-001'] = {
    render: function (c) {
      var c0 = cx(), all = F.items(c0), pend = F.weightPending();
      var defs = [
        { k: 'cat', l: L('Kategori', 'Category'), opts: P.opts(D.ITEM_CATS), fn: function (i, v) { return i.cat === v; } },
        { k: 'proc', l: L('Proses', 'Process'), opts: P.opts(D.ITEM_PROC), fn: function (i, v) { return i.proc === v; } },
        { k: 'unit', l: L('Unit tagih', 'Billing unit'), opts: [['kg', 'kg'], ['pcs', 'pcs']], fn: function (i, v) { return i.billUnit === v; } },
        { k: 'sp', l: L('Special treatment', 'Special treatment'), opts: [['1', L('Ya', 'Yes')], ['0', L('Tidak', 'No')]], fn: function (i, v) { return (i.special ? '1' : '0') === v; } },
        { k: 'act', l: L('Status', 'Status'), opts: [['1', L('Aktif', 'Active')], ['0', L('Nonaktif', 'Inactive')]], fn: function (i, v) { return (i.active ? '1' : '0') === v; } }
      ];
      var rows = A.applyFilters(all, defs, function (i) { return i.code + ' ' + i.n[0] + ' ' + i.n[1]; });
      var cols = [
        { h: L('Kode', 'Code'), v: function (i) { return mono(i.code); } },
        { h: L('Nama', 'Name'), v: function (i) { return '<b>' + t(i.n) + '</b>' + (pend.some(function (v) { return v.code === i.code; }) ? ' ' + A.chip('appr', L('Perubahan menunggu', 'Change pending'), 'hourglass') : ''); } },
        { h: L('Kategori', 'Category'), v: function (i) { return catI(i.cat); } },
        { h: L('Berat standar', 'Standard weight'), cls: 'r num', v: function (i) { return wFmt(F.weightAt(i.code)); } },
        { h: L('Unit tagih', 'Billing unit'), v: function (i) { return esc(i.billUnit); } },
        { h: L('Proses', 'Process'), v: function (i) { return procI(i.proc); } },
        { h: L('Layanan default', 'Default service'), v: function (i) { return esc(F.svcName(i.svc)); } },
        { h: L('Special', 'Special'), v: function (i) { return i.special ? A.chip('appr', L('Ya', 'Yes'), 'sparkles') : '<span class="sub5">—</span>'; } },
        { h: L('Status', 'Status'), v: function (i) { return i.active ? A.chip('ok', L('Aktif', 'Active')) : A.chip('mute', L('Nonaktif', 'Inactive')); } },
        { h: L('Berlaku / versi', 'Effective / version'), v: function (i) { var w = F.weightVer(i.code); return w ? dt(w.eff) + '<small class="sub5">v' + w.v + '</small>' : '—'; } }
      ];
      var sp = all.filter(function (i) { return i.special; }).length, pc = all.filter(function (i) { return i.billUnit === 'pcs'; }).length;
      return P.head(t(L('Satu master berat item untuk operasional, billing dan costing. Berat standar selalu disimpan dalam kg.', 'One item-weight master for operations, billing and costing. The standard weight is always stored in kg.')), A.btn('ghost', L('Versi berat', 'Weight versions'), 'weight', { go: 'ITEM-003' }) + A.btn('ghost', L('Unit economics', 'Unit economics'), 'percent', { go: 'ITEM-004' }), P.fresh({ src: L('Item master', 'Item master') })) +
        P.kpis([
          { k: L('Item', 'Items'), v: n0(all.length), s: n0(Object.keys(D.ITEM_CATS).length) + ' ' + t(L('kategori', 'categories')), icon: 'towel' },
          { k: L('Perubahan berat menunggu', 'Weight changes pending'), v: n0(pend.length), tone: pend.length ? 'appr' : 'ok', icon: 'hourglass', go: 'ITEM-003' },
          { k: L('Ditagih per pcs', 'Billed per pcs'), v: n0(pc), s: t(L('lainnya per kg', 'others per kg')), icon: 'shirt' },
          { k: L('Special treatment', 'Special treatment'), v: n0(sp), icon: 'sparkles', go: 'ITEM-001', q: { sp: '1' } }
        ]) +
        A.filters(defs, { search: L('Cari kode atau nama item', 'Search item code or name') }) +
        card(L('Item master', 'Item master'), P.table(rows, cols, function (i) { return { t: mono(i.code) + ' · ' + t(i.n), r: (fw(F.weightAt(i.code))), s: catI(i.cat) + ' · ' + procI(i.proc) + ' · ' + esc(i.billUnit), chip: i.special ? A.chip('appr', L('Special', 'Special')) : '' }; }, function (i) { return href('ITEM-002', i.code); }, { empty: L('Tidak ada item untuk filter ini.', 'No items for this filter.') }), { icon: 'list', count: rows.length });
    }
  };

  /* ================= NP-06 · ITEM-002 Item Detail ================= */
  V['ITEM-002'] = {
    title: function (rec) { var i = rec && F.item(rec); return i ? i.n : null; },
    render: function (c) {
      var it = c.rec && F.item(c.rec);
      if (!it) return A.stateCard('empty', L('Pilih item dari Item Master.', 'Pick an item from the Item Master.'), A.btn('blue', L('Item Master', 'Item Master'), 'towel', { go: 'ITEM-001' }));
      var c0 = cx(), code = it.code, w = F.weightAt(code), wv = F.weightVer(code), vs = F.weightVersions(code), pend = vs.filter(function (v) { return v.st === 'pending'; })[0], ec = F.itemEcon(c0, code);
      var hero = P8.hero({ id: code, icon: it.cat === 'uniform' || it.cat === 'garment' ? 'shirt' : 'towel', title: t(it.n), sub: catI(it.cat) + ' · ' + procI(it.proc) + ' · ' + esc(F.svcName(it.svc)),
        chips: (it.active ? A.chip('ok', L('Aktif', 'Active')) : A.chip('mute', L('Nonaktif', 'Inactive'))) + (it.special ? A.chip('appr', L('Special treatment', 'Special treatment'), 'sparkles') : '') + (pend ? A.chip('appr', L('Perubahan menunggu', 'Change pending'), 'hourglass') : ''),
        facts: [[L('Berat standar', 'Standard weight'), n0(w, 3) + ' kg', 'num'], [L('Tampilan', 'Display'), (fw(w))], [L('Unit tagih', 'Billing unit'), esc(it.billUnit)], [L('Versi', 'Version'), wv ? 'v' + wv.v + ' · ' + dt(wv.eff) : '—'], [L('Volume Sep', 'Sep volume'), n0(it.vol) + ' pcs', 'num']] });
      var main = pend && can('item.approve') ? A.btn('primary', L('Setujui berat ' + fw(pend.kg), 'Approve weight ' + fw(pend.kg)), 'checkc', { act: 'wok', val: code, cls: 'ap10-xl' }) : !pend && can('item.edit') ? A.btn('primary', L('Ajukan berat baru', 'Propose new weight'), 'weight', { act: 'propose', val: code, cls: 'ap10-xl' }) : '';
      var side = pend && can('item.approve') ? A.btn('danger', L('Tolak', 'Reject'), 'xc', { act: 'wno', val: code, cls: 'ap10-xl' }) : '';
      var pendN = pend ? note(t(L('Usulan v' + pend.v + ': ' + fw(pend.kg) + ' berlaku ' + pend.eff + ' oleh ' + F.empName(pend.by) + '. ', 'Proposal v' + pend.v + ': ' + fw(pend.kg) + ' effective ' + pend.eff + ' by ' + F.empName(pend.by) + '. ')) + (can('item.approve') ? '' : t(L('Menunggu persetujuan Owner.', 'Waiting for Owner approval.'))), 'hourglass', 'appr') : '';
      var hist = P.table(vs, [
        { h: L('Versi', 'Version'), v: function (v) { return '<b>v' + v.v + '</b>'; } },
        { h: L('Berat', 'Weight'), cls: 'r num', v: function (v) { return wFmt(v.kg); } },
        { h: L('Berlaku', 'Effective'), v: function (v) { return dt(v.eff); } },
        { h: L('Alasan', 'Reason'), v: function (v) { return t(v.reason) + (v.rej ? '<small class="sub5">' + t(L('Ditolak: ', 'Rejected: ')) + esc(v.rej) + '</small>' : ''); } },
        { h: L('Diajukan', 'Proposed'), v: function (v) { return emp(v.by) + '<small class="sub5">' + esc(v.at || '') + '</small>'; } },
        { h: L('Disetujui', 'Approved'), v: function (v) { return v.appr ? emp(v.appr) : '—'; } },
        { h: L('Status', 'Status'), v: function (v) { return wvC(v.st); } }
      ], function (v) { return { t: 'v' + v.v + ' · ' + (fw(v.kg)), r: dt(v.eff), s: t(v.reason), chip: wvC(v.st) }; }, null);
      var calc = '<div class="ap10-calc" id="ap10-calc" data-code="' + esc(code) + '"><div class="fg5">' + fld(L('Jumlah (pcs)', 'Quantity (pcs)'), '<input name="q" type="number" min="0" step="1" value="100" inputmode="numeric">') + fld(L('Tanggal transaksi', 'Transaction date'), '<input name="d" type="date" value="' + esc(F.today()) + '">') + '</div>' +
        '<p class="ap10-calc-r" aria-live="polite"></p></div>';
      var econ = ec ? '<div class="ap10-econ">' + kv([
        [L('HPP/kg (layanan ' + F.svcName(it.svc) + ')', 'HPP/kg (service ' + F.svcName(it.svc) + ')'), rpk(ec.hppKg)],
        [L('HPP/item', 'HPP/item'), '<b>' + rpk(ec.hppItem) + '</b><small class="sub5">' + rpk(ec.hppKg) + ' × ' + n0(ec.w, 2) + ' kg</small>'],
        [L('Harga jual/item', 'Selling price/item'), rpk(ec.price) + '<small class="sub5">' + (it.price != null ? t(L('Price List per pcs', 'Price List per pcs')) : t(L('tarif realisasi/kg × berat', 'realised rate/kg × weight'))) + '</small>'],
        [L('Profit/item', 'Profit/item'), '<b class="' + (ec.profit < 0 ? 'ap10-crit' : '') + '">' + rpk(ec.profit) + '</b>'], [L('Profit/kg', 'Profit/kg'), rpk(ec.profitKg)],
        [L('Gross margin', 'Gross margin'), '<b>' + pct(ec.margin) + '</b><small class="sub5">(' + t(L('Harga − HPP) ÷ Harga', 'Price − HPP) ÷ Price')) + '</small>'],
        [L('Markup', 'Markup'), '<b>' + pct(ec.markup) + '</b><small class="sub5">(' + t(L('Harga − HPP) ÷ HPP', 'Price − HPP) ÷ HPP')) + '</small>'],
        [L('Kontribusi/bulan', 'Contribution/month'), rpj(ec.contrib) + '<small class="sub5">' + n0(ec.vol) + ' pcs</small>'], [L('Status', 'Status'), stc(F.PRICE_ST, ec.st)]
      ]) + '</div>' + note(t(L('Markup bukan margin: markup dihitung dari HPP, gross margin dari harga jual.', 'Markup is not margin: markup is computed on HPP, gross margin on the selling price.')), 'info', 'info') : A.empty(L('Tidak ada akses ke data harga.', 'No access to price data.'));
      var aud = F.auditLog({ rec: code }).filter(function (a) { return a.ev.indexOf('ITEM.') === 0; }).slice(0, 8);
      return '<div class="ap10-det">' + hero + pendN + (main || side ? bigBar(main, side) : '') +
        card(L('Riwayat berat (tidak pernah ditimpa)', 'Weight history (never overwritten)'), hist + note(t(L('Transaksi lama tetap memakai berat yang berlaku pada tanggalnya.', 'Older transactions keep the weight in force on their date.')), 'history', 'info'), { icon: 'history', count: vs.length, link: ['ITEM-003', L('Semua versi', 'All versions')] }) +
        '<div class="g21-10"><div class="col10">' + card(L('Unit economics', 'Unit economics'), econ, { icon: 'percent', link: ['ITEM-004', L('Matriks', 'Matrix')] }) + '</div><div class="col10">' +
        card(L('Konversi pcs → kg ekuivalen', 'pcs → kg equivalent'), calc, { icon: 'scale' }) +
        card(L('Data item', 'Item data'), kv([[L('Kode', 'Code'), mono(code)], [L('Kategori', 'Category'), catI(it.cat)], [L('Proses', 'Process'), procI(it.proc)], [L('Layanan default', 'Default service'), esc(F.svcName(it.svc)) + ' <small class="sub5">' + esc(it.svc) + '</small>'], [L('Unit tagih', 'Billing unit'), esc(it.billUnit)], [L('Special treatment', 'Special treatment'), it.special ? t(L('Ya', 'Yes')) : t(L('Tidak', 'No'))], [L('Kunci Fase 8', 'Phase 8 key'), esc(it.p8 || '—')]]), { icon: 'file' }) +
        (aud.length ? card(L('Audit', 'Audit'), '<ol class="ap10-log">' + aud.map(function (a) { return '<li><b>' + t(F.AUDIT[a.ev] || a.ev) + '</b> · ' + esc(a.name) + ' · ' + esc(a.at) + (a.to ? ' · ' + esc(a.to) : '') + (a.reason ? ' · ' + esc(a.reason) : '') + '</li>'; }).join('') + '</ol>', { icon: 'shield' }) : '') + '</div></div></div>';
    },
    after: function () {
      var box = document.getElementById('ap10-calc'); if (!box) return;
      var code = box.getAttribute('data-code'), q = box.querySelector('[name=q]'), d = box.querySelector('[name=d]'), out = box.querySelector('.ap10-calc-r');
      function run() {
        var n = +q.value, date = d.value || F.today(), w = F.weightAt(code, date), r = F.kgEq(code, n, date);
        out.innerHTML = w == null ? t(L('Belum ada berat berlaku pada tanggal itu.', 'No weight in force on that date.'))
          : '<span>' + t(L('Jumlah × Berat Standar = kg ek.', 'Quantity × Standard Weight = kg eq.')) + '</span><b class="num">' + n0(n) + ' × ' + n0(w, 2) + ' kg = ' + n0(r, 2) + ' kg eq</b><small>' + t(L('Berat berlaku ', 'Weight in force on ')) + esc(dt(date)) + ': ' + (fw(w)) + '</small>';
      }
      q.oninput = run; d.onchange = run; run();
    },
    act: itemActs
  };

  /* ================= NP-06 · ITEM-003 Weight Version ================= */
  V['ITEM-003'] = {
    render: function (c) {
      var all = F.state().wver.slice().sort(function (a, b) { return (b.at || '') < (a.at || '') ? -1 : 1; }), view = c.q.st || 'pending';
      var cnt = { pending: 0, scheduled: 0 }; all.forEach(function (v) { if (cnt[v.st] != null) cnt[v.st]++; });
      var rows = view === 'all' ? all : all.filter(function (v) { return v.st === view; });
      function impact(v) { var it = F.item(v.code), pv = prevVer(v); if (!it || !pv) return null; var d = v.kg - pv.kg; return { d: d, pct: d / pv.kg * 100, kgm: d * it.vol }; }
      var pendCards = view === 'pending' && rows.length ? '<div class="ap10-wcards">' + rows.map(function (v) {
        var pv = prevVer(v), im = impact(v), it = F.item(v.code);
        return '<section class="card ap10-wc"><div class="ap10-wc-h">' + itemLink(v.code) + '<b>' + t(it ? it.n : v.code) + '</b>' + wvC(v.st) + '</div>' +
          '<div class="ap10-wc-w"><span class="num">' + (pv ? (fw(pv.kg)) : '—') + '</span>' + ic('arrow') + '<b class="num">' + (fw(v.kg)) + '</b>' + (im ? H.delta(im.pct, { u: '%' }) : '') + '</div>' +
          kv([[L('Berlaku', 'Effective'), dt(v.eff)], [L('Alasan', 'Reason'), t(v.reason)], [L('Diajukan', 'Proposed by'), emp(v.by) + ' · ' + esc(v.at || '')], im ? [L('Dampak volume', 'Volume impact'), (im.kgm >= 0 ? '+' : '−') + n0(Math.abs(im.kgm)) + ' ' + t(L('kg ek./bulan (volume Sep)', 'kg eq./month (Sep volume)'))] : null]) +
          (can('item.approve') ? '<div class="ap10-wc-a">' + A.btn('primary', L('Setujui', 'Approve'), 'checkc', { act: 'wok', val: v.code, cls: 'ap10-xl' }) + A.btn('danger', L('Tolak', 'Reject'), 'xc', { act: 'wno', val: v.code, cls: 'ap10-xl' }) + '</div>' : note(t(L('Menunggu persetujuan pemegang izin "Setujui perubahan berat".', 'Waiting for a holder of the "Approve weight changes" permission.')), 'hourglass', 'appr')) + '</section>';
      }).join('') + '</div>' : '';
      var tbl = P.table(rows, [
        { h: L('Item', 'Item'), v: function (v) { return itemLink(v.code) + '<small class="sub5">' + t(F.itemName(v.code)) + '</small>'; } },
        { h: L('Versi', 'Version'), v: function (v) { return '<b>v' + v.v + '</b>'; } },
        { h: L('Sebelumnya', 'Previous'), cls: 'r', v: function (v) { var pv = prevVer(v); return pv ? (fw(pv.kg)) : '—'; } },
        { h: L('Berat', 'Weight'), cls: 'r num', v: function (v) { return wFmt(v.kg); } },
        { h: L('Berlaku', 'Effective'), v: function (v) { return dt(v.eff); } },
        { h: L('Alasan', 'Reason'), v: function (v) { return t(v.reason); } },
        { h: L('Diajukan / disetujui', 'Proposed / approved'), v: function (v) { return emp(v.by) + '<small class="sub5">' + (v.appr ? '✓ ' + emp(v.appr) : '—') + '</small>'; } },
        { h: L('Status', 'Status'), v: function (v) { return wvC(v.st); } }
      ], function (v) { return { t: mono(v.code) + ' · v' + v.v + ' · ' + (fw(v.kg)), r: dt(v.eff), s: t(v.reason), chip: wvC(v.st) }; }, function (v) { return href('ITEM-002', v.code); }, { empty: L('Tidak ada versi untuk filter ini.', 'No versions for this filter.') });
      return P.head(t(L('Perubahan berat: nilai baru, tanggal berlaku, alasan, user dan persetujuan. Riwayat tetap memakai berat lama.', 'Weight changes: new value, effective date, reason, user and approval. History keeps the old weight.')), A.btn('ghost', L('Item Master', 'Item Master'), 'towel', { go: 'ITEM-001' }), P.fresh({ src: L('Versi berat item', 'Item weight versions') })) +
        tabs([['pending', L('Menunggu', 'Pending'), 'hourglass', cnt.pending], ['scheduled', L('Terjadwal', 'Scheduled'), 'calendar', cnt.scheduled], ['all', L('Semua riwayat', 'All history'), 'history', all.length]], view, 'st', { def: 'pending' }) +
        pendCards + (view === 'pending' && !rows.length ? A.empty(L('Tidak ada perubahan berat yang menunggu.', 'No weight changes waiting.')) : view !== 'pending' ? card(L('Versi berat', 'Weight versions'), tbl, { icon: 'weight', count: rows.length }) : '');
    },
    act: itemActs
  };

  /* ================= NP-06 · ITEM-004 Unit Economics ================= */
  V['ITEM-004'] = {
    render: function (c) {
      var c0 = cx(), s = F.ITEM_SORTS[c.q.s] ? c.q.s : 'low', rows = F.itemMatrix(c0, s); if (!rows) return A.stateCard('noperm', F.MSG.noperm);
      var rev = sum(rows.map(function (r) { return r.rev; })), con = sum(rows.map(function (r) { return r.contrib; })), cost = sum(rows.map(function (r) { return r.hppItem * r.vol; }));
      var below = rows.filter(function (r) { return r.st === 'below'; }), rev2 = rows.filter(function (r) { return ['below', 'review', 'low'].indexOf(r.st) >= 0; });
      var worst = rows.slice().sort(function (a, b) { return a.margin - b.margin; })[0];
      var cols = [
        { h: L('Item', 'Item'), v: function (r) { return itemLink(r.code) + '<small class="sub5">' + t(r.n) + '</small>'; } },
        { h: L('Berat', 'Weight'), cls: 'r num', v: function (r) { return (fw(r.w)); } },
        { h: L('HPP/item · HPP/kg', 'HPP/item · HPP/kg'), cls: 'r num', v: function (r) { return rpk(r.hppItem) + '<small class="sub5">' + rpk(r.hppKg) + '/kg</small>'; } },
        { h: L('Harga/item', 'Price/item'), cls: 'r num', v: function (r) { return rpk(r.price); } },
        { h: L('Profit/item · /kg', 'Profit/item · /kg'), cls: 'r num', v: function (r) { return '<span class="' + (r.profit < 0 ? 'ap10-crit' : '') + '">' + rpk(r.profit) + '</span><small class="sub5">' + rpk(r.profitKg) + '/kg</small>'; } },
        { h: L('Gross margin %', 'Gross margin %'), cls: 'r num', v: function (r) { return '<b>' + pct(r.margin) + '</b>'; } },
        { h: L('Markup %', 'Markup %'), cls: 'r num', v: function (r) { return pct(r.markup); } },
        { h: L('Volume · Revenue', 'Volume · Revenue'), cls: 'r num', v: function (r) { return n0(r.vol) + ' pcs<small class="sub5">' + rpj(r.rev) + '</small>'; } },
        { h: L('Kontribusi', 'Contribution'), cls: 'r num', v: function (r) { return rpj(r.contrib); } },
        { h: L('Status', 'Status'), v: function (r) { return stc(F.PRICE_ST, r.st); } }
      ];
      return P.head(t(L('Matriks profitabilitas item: HPP per item = HPP/kg layanan × berat standar. Gross margin dan markup selalu dipisah.', 'Item profitability matrix: HPP per item = service HPP/kg × standard weight. Gross margin and markup are always kept apart.')), A.btn('ghost', L('Item Master', 'Item Master'), 'towel', { go: 'ITEM-001' }) + A.btn('ghost', L('HPP', 'HPP'), 'gauge', { go: 'HPP-001' }), P.fresh({ src: L('HPP ' + F.hppLast().p + ' · volume Sep · Price List', 'HPP ' + F.hppLast().p + ' · Sep volume · Price List'), kind: 'snapshot', at: F.hppLast().at })) + P.deskOnly() +
        P.kpis([
          { k: L('Revenue item', 'Item revenue'), v: rpj(rev), s: n0(rows.length) + ' ' + t(L('item aktif', 'active items')), icon: 'coins' },
          { k: L('Kontribusi', 'Contribution'), v: rpj(con), s: t(L('Revenue − HPP item × volume', 'Revenue − item HPP × volume')), icon: 'chart' },
          { k: L('Gross margin rata-rata', 'Average gross margin'), v: pct(rev ? (rev - cost) / rev * 100 : null), s: t(L('(Revenue − HPP) ÷ Revenue', '(Revenue − HPP) ÷ Revenue')), icon: 'percent' },
          { k: L('Markup rata-rata', 'Average markup'), v: pct(cost ? (rev - cost) / cost * 100 : null), s: t(L('(Revenue − HPP) ÷ HPP', '(Revenue − HPP) ÷ HPP')), icon: 'tag' },
          { k: L('Perlu review', 'Review required'), v: n0(rev2.length), s: n0(below.length) + ' ' + t(L('di bawah HPP', 'below HPP')), tone: below.length ? 'crit' : rev2.length ? 'warn' : 'ok', icon: 'alert', go: 'ITEM-004', q: { s: 'review' } }
        ]) +
        (worst ? P.rec({ title: L('Item dengan margin terendah', 'Lowest-margin item'), tone: worst.st === 'below' ? 'crit' : 'warn', sig: L(worst.n[0] + ': gross margin ' + pct(worst.margin) + ' (markup ' + pct(worst.markup) + ').', worst.n[1] + ': gross margin ' + pct(worst.margin) + ' (markup ' + pct(worst.markup) + ').'),
          why: [L('HPP/item ' + rpk(worst.hppItem) + ' = ' + rpk(worst.hppKg) + '/kg × ' + fw(worst.w), 'HPP/item ' + rpk(worst.hppItem) + ' = ' + rpk(worst.hppKg) + '/kg × ' + fw(worst.w)), L('Harga/item ' + rpk(worst.price), 'Price/item ' + rpk(worst.price))],
          impact: L('Kontribusi ' + rpj(worst.contrib) + '/bulan dari ' + n0(worst.vol) + ' pcs.', 'Contribution ' + rpj(worst.contrib) + '/month from ' + n0(worst.vol) + ' pcs.'), rec: L('Tinjau harga layanan atau berat standar item ini.', 'Review the service price or this item\'s standard weight.'), act: { n: L('Buka item', 'Open item'), s: 'ITEM-002', rec: worst.code } }) : '') +
        tabs(Object.keys(F.ITEM_SORTS).map(function (k) { return [k, F.ITEM_SORTS[k]]; }), s, 's', { def: 'low' }) +
        card(L('Matriks profitabilitas item', 'Item profitability matrix'), P.table(rows, cols, function (r) { return { t: t(r.n), r: pct(r.margin), s: t(L('HPP ', 'HPP ')) + rpk(r.hppItem) + ' · ' + t(L('harga ', 'price ')) + rpk(r.price) + ' · markup ' + pct(r.markup), chip: stc(F.PRICE_ST, r.st) }; }, function (r) { return href('ITEM-002', r.code); }), { icon: 'percent', count: rows.length }) +
        note(t(L('Gross margin % = (Harga − HPP) ÷ Harga. Markup % = (Harga − HPP) ÷ HPP. Markup selalu lebih besar dari margin dan tidak boleh disebut margin.', 'Gross margin % = (Price − HPP) ÷ Price. Markup % = (Price − HPP) ÷ HPP. Markup is always larger than margin and must never be called margin.')), 'info', 'info');
    }
  };

  /* Every screen of this file sits in an .ap10 wrapper (scoped table styles). */
  ['AP-001', 'AP-002', 'AP-003', 'AP-004', 'AP-005', 'HPP-001', 'HPP-002', 'HPP-003', 'HPP-004', 'HPP-005', 'ITEM-001', 'ITEM-002', 'ITEM-003', 'ITEM-004'].forEach(function (id) {
    var v = V[id], r = v.render; v.render = function (c) { return '<div class="ap10">' + r(c) + '</div>'; };
  });
})();
