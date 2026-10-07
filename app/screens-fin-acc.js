/* JFRESH OS — Phase 10 screens (part 2): accounting core, cash & treasury, billing & receivables.
   NP-01 ACC-001…ACC-005 (the spec's FIN-001…FIN-005: finance dashboard, chart of accounts, journals,
   journal detail, period control), NP-02 CASH-001…CASH-005 (treasury, account detail, cash transactions,
   forecast, bank reconciliation) and NP-03 AR-001…AR-005 (Billing Ready queue, invoice builder, invoice
   detail, AR aging, collection workspace).
   Desktop first for the finance team, iPad works, the phone shows summaries and cards only.
   Every number comes from the finance engine (assets/js/jfos-fin.js, window.JFFIN); every journal balances
   and drills down to its source; posted journals and closed periods are never edited (reversal, adjustment
   or next-period correction, with a reason and an audit entry); invoices consume Phase 6/9 data and never
   re-enter a known value. Permission, period lock and maker-checker are checked again inside the engine. */
(function () {
  var A = window.JFAPP, P = A && A.P10, H = A && A.P5, P8 = A && A.P8; if (!A || !P || !H || !P8) return;
  var F = P.F, V = A.V, T = A.T, L = A.L, t = A.t, esc = A.esc, ic = A.ic, can = A.can, href = A.href;
  var card = H.card, kv = H.kv, note = H.note, dlg = H.dlg, fld = H.fld, inp = H.inp, sel = H.sel, area = H.area, lnk = H.lnk;
  var rp = P.rp, rpj = P.rpj, pct = P.pct, n0 = P.n0, dt = P.dt, mon = P.mon, emp = P.emp, cname = P.cname, pname = P.pname, mono = P.mono, accN = P.accN;
  var hero = P8.hero;
  function cx() { return P.cx(); }
  function go(id, rec, q) { A.go(id, rec, q); }
  function open(id) { return P.open(id); }
  function after(msg, tn) { P.after(msg, tn); }
  function fail(r) { return P.fail(r); }
  function by(arr, k, v) { for (var i = 0; i < arr.length; i++) if (arr[i][k] === v) return arr[i]; return null; }
  function sum(a) { return a.reduce(function (s, x) { return s + (+x || 0); }, 0); }
  // Rupiah typed by people: "1.500.000", "1,500,000", "Rp 1500000" → 1500000.
  function amtIn(s) { if (s == null || s === '') return null; var n = Number(String(s).replace(/[^\d-]/g, '')); return isNaN(n) ? NaN : n; }
  function gol(id, label, rec, q) { return open(id) ? lnk(id, rec, label, q) : label; }
  function grid(cls, parts) { return '<div class="' + cls + '">' + parts.filter(Boolean).join('') + '</div>'; }
  function chipsRow(html) { return '<div class="ac10-chips">' + html + '</div>'; }
  function today() { return F.today(); }
  function dtn(x) { return '<span class="ac10-nw">' + dt(x) + '</span>'; }
  function Lx(l, x) { return [l[0] + x, l[1] + x]; }
  function mt(rows, o) { return '<div class="ac10-mt">' + P.mtable(rows, o) + '</div>'; }
  function ago(s) { var d = F.dayDiff(String(s).slice(0, 10), today()); return d <= 0 ? T(L('hari ini', 'today')) : T(L(d + ' hari lalu', d + ' d ago')); }

  /* ================= Shared accounting helpers ================= */
  function jvSt(j) { return P.stc(F.JV_ST, j.st); }
  function kindChip(j) {
    if (j.kind === 'reversal') return A.chip('warn', L('Jurnal balik', 'Reversal'), 'loop');
    if (j.kind === 'open') return A.chip('mute', L('Saldo awal', 'Opening'), 'database');
    if (j.kind === 'accrual') return A.chip('info', L('Akrual', 'Accrual'), 'clock');
    if (j.kind === 'adjust') return A.chip('appr', L('Penyesuaian', 'Adjustment'), 'edit');
    if (j.kind === 'manual') return A.chip('info', L('Manual', 'Manual'), 'edit');
    return '';
  }
  function srcN(j) { return t(F.JV_SRC[j.src.t] || L(j.src.t, j.src.t)); }
  function payRec(id) { return by(F.state().pays, 'id', id); }
  function apayRec(id) { return by(F.state().apays, 'id', id); }
  // The record a journal was made from, as a link when this role can open it.
  function srcLink(j) {
    var s = j.src || {}, id = s.id;
    if (!id) return s.t === 'manual' || !s.t ? '<span class="sub5">' + emp(j.by) + '</span>' : '<span class="sub5">' + srcN(j) + '</span>';
    if (s.t === 'inv') return P.invLink(id);
    if (s.t === 'br') return gol('AR-001', mono(id), id);
    if (s.t === 'pay') { var p = payRec(id); return p ? gol('AR-003', mono(id), p.inv) : mono(id); }
    if (s.t === 'ap') return P.expLink(id);
    if (s.t === 'apay') { var a = apayRec(id); return a ? gol('AP-002', mono(id), a.exp) : mono(id); }
    if (s.t === 'cash') return gol('CASH-003', mono(id), id);
    if (s.t === 'grn') { var g = F.grn && F.grn(id); return g ? gol('PUR-006', mono(id), g.po) : mono(id); }
    if (s.t === 'mv') return gol('INV-004', mono(id), id);
    if (s.t === 'dep') return gol('AST-004', mono(id));
    if (s.t === 'rev') return P.jvLink(id);
    if (s.t === 'ast') return P.astLink(id);
    return mono(id);
  }
  var SRC_IC = { jv: 'list', inv: 'invoice', pay: 'coins', br: 'inbox', bil: 'file', exp: 'file', apay: 'coins', cash: 'coins', mv: 'swap', po: 'clipboard', grn: 'package', ast: 'washer', dep: 'arrowdn', dlv: 'truck', ord: 'clipboard', cl: 'building', sup: 'briefcase', batch: 'factory', wo: 'wrench', src: 'database', doc: 'filecheck', user: 'user', stock: 'package', more: 'more' };
  // Journal → source → … → client / supplier. Every step opens the next record (§6).
  function trace(id) {
    var list = F.trace(id); if (!list.length) return '';
    return H.drill(list.map(function (s, i) {
      var goTo = null, rec = s.id;
      if (s.k === 'jv') goTo = i > 0 ? 'ACC-004' : null;
      else if (s.k === 'pay') { var p = payRec(s.id); goTo = 'AR-003'; rec = p ? p.inv : null; }
      else if (s.k === 'apay') { var a = apayRec(s.id); goTo = 'AP-002'; rec = a ? a.exp : null; }
      else if (s.k === 'grn') { var g = F.grn && F.grn(s.id); goTo = g ? 'PUR-006' : null; rec = g ? g.po : null; }
      else if (s.k === 'dep') { goTo = 'AST-004'; rec = null; }
      else if (s.k === 'stock') goTo = 'INV-003';
      else if (s.id) goTo = P.SRC_SCR[s.k] || null;
      return { i: SRC_IC[s.k] || 'link', l: s.n ? s.n : L(s.k, s.k), s: s.id || '', go: goTo, rec: rec };
    }));
  }
  function months() { var out = [], p = '2026-04', cur = F.curPeriod(); while (p <= cur) { out.push(p); p = F.mAdd(p, 1); } return out; }
  function perChip(p) { var x = F.period(p); return x ? P.stc(F.PER_ST, x.st) : A.chip('ok', L('Open', 'Open')); }
  function perFresh(p) {
    var st = F.period(p) ? F.period(p).st : 'open';
    if (st === 'open') return P.fresh({ kind: 'live', src: L('ledger berjalan ' + mon(p), 'running ledger ' + mon(p)) });
    if (st === 'soft') return P.fresh({ kind: 'ledger', src: L('soft close ' + mon(p) + ' · bisa berubah lewat penyesuaian', mon(p) + ' soft close · may change through adjustments') });
    return P.fresh({ kind: 'ledger', at: (F.period(p).closedAt || F.mEnd(p)) + ' 23:59', src: L('periode ' + mon(p) + ' ditutup', 'period ' + mon(p) + ' closed') });
  }
  function ledgerHref(code, p) { return href('ACC-003', null, p ? { acc: code, p: p } : { acc: code }); }
  function accL(code, p, label) { return open('ACC-003') ? '<a class="lnk5" href="' + ledgerHref(code, p) + '">' + (label || accN(code)) + '</a>' : (label || accN(code)); }
  function coaOpts(filter) { return F.COA.filter(filter || function () { return true; }).map(function (a) { return [a.c, a.c + ' · ' + T(a.n)]; }); }
  function ccOpts() { return [['', L('— tanpa cost center —', '— no cost centre —')]].concat(F.D.CC.map(function (c) { return [c[0], c[0] + ' · ' + T(c[1])]; })); }
  function audits(rec, ev) {
    var list = F.auditLog({ rec: rec, ev: ev }).slice(0, 12);
    if (!list.length) return A.empty(L('Belum ada catatan audit.', 'No audit entries yet.'));
    return '<ol class="ac10-log">' + list.map(function (e) { return '<li><span class="ac10-log-t num">' + esc(e.at) + '</span><b>' + t(F.AUDIT[e.ev] || L(e.ev, e.ev)) + '</b><span>' + esc(e.name) + (e.from || e.to ? ' · ' + esc((e.from || '') + (e.from && e.to ? ' → ' : '') + (e.to || '')) : '') + (e.reason ? ' · ' + t(L('alasan: ', 'reason: ')) + esc(e.reason) : '') + '</span></li>'; }).join('') + '</ol>';
  }

  /* ---------- Draft journal dialog (ACC-003 new, ACC-004 edit draft) ---------- */
  var NL = 6;
  function jvDialog(j) {
    var lines = j ? j.lines : [], acc = coaOpts();
    var rows = '';
    for (var i = 0; i < NL; i++) {
      var l = lines[i] || {};
      rows += '<div class="ac10-jl"><label><span class="sr">' + t(L('Akun', 'Account')) + '</span>' + sel('a' + i, [['', L('— akun —', '— account —')]].concat(acc), l.a || '') + '</label>' +
        '<label><span class="sr">Debit</span>' + inp('d' + i, l.d || '', { num: true, ph: L('Debit', 'Debit') }) + '</label>' +
        '<label><span class="sr">' + t(L('Kredit', 'Credit')) + '</span>' + inp('c' + i, l.c || '', { num: true, ph: L('Kredit', 'Credit') }) + '</label>' +
        '<label><span class="sr">Cost center</span>' + sel('cc' + i, ccOpts(), l.cc || '') + '</label></div>';
    }
    var body = '<div class="ac10-dg">' + fld(L('Tanggal', 'Date'), inp('date', j ? j.date : today(), { type: 'date' }), { req: true }) + fld(L('Referensi', 'Reference'), inp('ref', j ? j.ref || '' : '', { ph: L('No. dokumen', 'Document no.') })) + '</div>' +
      fld(L('Keterangan', 'Description'), inp('desc', j ? T(j.desc) : '', { ph: L('Untuk apa jurnal ini?', 'What is this journal for?') }), { req: true, wide: true }) +
      (j ? '' : '<label class="ac10-cb"><input type="checkbox" name="adjust"><span>' + t(L('Jurnal penyesuaian (wajib alasan, ditandai Adjustment)', 'Adjustment journal (reason required, marked Adjustment)')) + '</span></label>' +
        fld(L('Alasan / dasar jurnal', 'Reason / basis'), area('reason', '', L('Wajib untuk penyesuaian dan periode soft close', 'Required for adjustments and soft-closed periods')), { wide: true })) +
      '<div class="ac10-jh"><span>' + t(L('Akun', 'Account')) + '</span><span>Debit</span><span>' + t(L('Kredit', 'Credit')) + '</span><span>Cost center</span></div>' + rows +
      '<p class="ac10-bal" data-bal></p>';
    function read(el) {
      var v = P.vals(el), out = [];
      for (var i = 0; i < NL; i++) { var d = amtIn(v['d' + i]) || 0, c = amtIn(v['c' + i]) || 0; if (v['a' + i] && (d || c)) out.push({ a: v['a' + i], d: d, c: c, cc: v['cc' + i] || null }); }
      return { v: v, lines: out };
    }
    function upd(el) {
      var r = read(el), tt = F.jvTotals(r.lines), ok = F.balanced(r.lines), b = el.querySelector('[data-bal]');
      b.className = 'ac10-bal ' + (ok ? 'ok' : 'crit');
      b.innerHTML = ic(ok ? 'checkc' : 'alert') + '<span>Debit <b class="num">' + rp(tt.d) + '</b> · ' + t(L('Kredit', 'Credit')) + ' <b class="num">' + rp(tt.c) + '</b> · ' + (ok ? t(L('Seimbang — siap diposting', 'Balanced — ready to post')) : t(L('Selisih ', 'Difference ')) + rp(tt.d - tt.c) + ' · ' + t(L('bisa disimpan sebagai draft, belum bisa diposting', 'can be saved as a draft, cannot be posted yet'))) + '</span>';
    }
    dlg({ title: j ? L('Ubah draft ' + j.id, 'Edit draft ' + j.id) : L('Draft jurnal manual', 'Draft manual journal'), icon: 'edit', ok: L('Simpan Draft', 'Save Draft'),
      sub: t(L('Draft belum masuk ledger. Posting dilakukan dari detail jurnal setelah debit = kredit.', 'A draft is not in the ledger yet. Post it from the journal detail once debit = credit.')),
      body: body,
      after: function (el) { el.querySelector('.dlg5-p').classList.add('ac10-wide'); el.addEventListener('input', function () { upd(el); }); el.addEventListener('change', function () { upd(el); }); upd(el); },
      onOk: function (v0, el) {
        var r = read(el), v = r.v, res;
        if (!j && v.adjust === true && !v.reason) return F.MSG.reason;
        if (j) res = F.editDraft(cx(), j.id, { date: v.date, desc: v.desc ? L(v.desc, v.desc) : null, ref: v.ref, lines: r.lines });
        else res = F.draftJournal(cx(), { date: v.date, desc: v.desc ? L(v.desc, v.desc) : '', ref: v.ref || null, lines: r.lines, adjust: v.adjust === true || v.adjust === 'on', reason: v.reason || null });
        if (!res || !res.ok) return res ? res.msg : F.MSG.invalid;
        var id = res.jv.id;
        setTimeout(function () { go('ACC-004', id); setTimeout(function () { A.toast(res.balanced ? L('Draft ' + id + ' tersimpan dan seimbang.', 'Draft ' + id + ' saved and balanced.') : L('Draft ' + id + ' tersimpan, belum seimbang.', 'Draft ' + id + ' saved, not balanced yet.'), res.balanced ? 'ok' : 'warn'); }, 350); }, 10);
        return true;
      } });
  }

  /* ================= NP-01 · ACC-001 Finance Dashboard ================= */
  V['ACC-001'] = {
    render: function (c) {
      var cur = F.curPeriod(), ms = months(), p = ms.indexOf(c.q.p) >= 0 ? c.q.p : cur, isCur = p === cur;
      var asOf = isCur ? today() : F.mEnd(p), pl = F.plMonth(p), pp = F.mAdd(p, -1), prev = F.plMonth(pp), rr = isCur ? +F.mEnd(p).slice(8) / Math.max(1, +asOf.slice(8)) : 1, bs = F.bs(asOf), cf = F.cashFlow(p + '-01', asOf);
      var lc = F.lastClosed(), cs = F.closeStatus(lc), ar = F.natural('1200', asOf), unb = F.natural('1210', asOf), ap = F.natural('2100', asOf);
      var cashT = sum(F.cashAccs().map(function (a) { return F.natural(a.coa, asOf); }));
      var tabs = H.tabs(ms.slice(-6).map(function (m) { return [m, L(mon(m) + (m === cur ? ' · MTD' : ''), mon(m) + (m === cur ? ' · MTD' : ''))]; }), p, 'p', { seg: true, def: cur, label: L('Periode', 'Period') });
      // Running month: compare the month-end run-rate (MTD ÷ days × month days) with last month; the formula is shown.
      function dl(a, b) { if (!b) return ''; var x = a * rr; return (isCur ? t(L('run-rate ', 'run-rate ')) + rpj(x) + ' ' : '') + H.delta(Math.round((x - b) / Math.abs(b) * 1000) / 10, { u: '%' }) + ' <small>vs ' + esc(mon(pp, false)) + '</small>'; }
      var tiles = P.kpis([
        { k: L('Pendapatan', 'Revenue'), v: rpj(pl.revenue), s: dl(pl.revenue, prev.revenue), icon: 'trend', go: 'ACC-002', q: { t: 'rev' } },
        { k: L('Laba kotor', 'Gross profit'), v: rpj(pl.gross), s: 'GM ' + pct(pl.gm), icon: 'chart', go: 'ACC-002', q: { t: 'cogs' } },
        { k: L('Laba bersih', 'Net profit'), v: rpj(pl.net), s: 'NM ' + pct(pl.nm) + ' · ' + dl(pl.net, prev.net), icon: 'gauge', tone: pl.net < 0 ? 'crit' : 'ok', go: 'ACC-002', q: { t: 'opex' } },
        { k: L('Kas & bank', 'Cash & bank'), v: rpj(cashT), s: t(L('per ', 'at ')) + dt(asOf), icon: 'coins', go: open('CASH-001') ? 'CASH-001' : null },
        { k: L('Piutang (AR)', 'Receivables (AR)'), v: rpj(ar), s: t(L('+ belum ditagih ', '+ unbilled ')) + rpj(unb), icon: 'clock', go: open('AR-004') ? 'AR-004' : null },
        { k: L('Utang usaha (AP)', 'Payables (AP)'), v: rpj(ap), s: accN('2100'), icon: 'file', go: open('AP-003') ? 'AP-003' : 'ACC-003', q: open('AP-003') ? null : { acc: '2100' } }
      ]);
      // P&L: every line opens its ledger for the period.
      function lines(arr) { return arr.map(function (x) { return { n: '', go: accL(x.c, p, esc(x.c) + ' · ' + t(x.n)), v: x.v, cls: 'ac10-ln' }; }); }
      var plT = mt([{ n: L('Pendapatan', 'Revenue'), cls: 'ac10-hd', v: '' }].concat(lines(pl.rev), [{ n: L('Total pendapatan', 'Total revenue'), v: pl.revenue, cls: 'tot' }, { n: L('HPP / COGS', 'COGS'), cls: 'ac10-hd', v: '' }], lines(pl.cogs),
        [{ n: L('Laba kotor', 'Gross profit'), v: pl.gross, cls: 'tot', sub: 'GM ' + pct(pl.gm) + ' = ' + t(L('laba kotor ÷ pendapatan', 'gross profit ÷ revenue')) }, { n: L('Beban operasional', 'Operating expenses'), cls: 'ac10-hd', v: '' }], lines(pl.opex),
        [{ n: 'EBIT', v: pl.ebit, cls: 'tot' }, { n: L('Lain-lain (bersih)', 'Other (net)'), v: pl.other }, { n: L('Pajak penghasilan', 'Income tax'), go: accL('8100', p, '8100 · ' + t(F.accName('8100'))), v: pl.tax },
          { n: L('Laba bersih', 'Net profit'), v: pl.net, cls: 'tot' + (pl.net < 0 ? ' neg' : ''), sub: 'NM ' + pct(pl.nm) }]));
      if (isCur) plT += '<p class="sub5 ac10-p">' + t(L('Run-rate di tile = MTD ÷ ' + (+asOf.slice(8)) + ' hari × ' + (+F.mEnd(p).slice(8)) + ' hari, dibandingkan dengan ' + mon(pp) + ' penuh.', 'Tile run-rate = MTD ÷ ' + (+asOf.slice(8)) + ' days × ' + (+F.mEnd(p).slice(8)) + ' days, compared with the full ' + mon(pp) + '.')) + '</p>';
      var bsT = mt([
        { n: L('Aset lancar', 'Current assets'), go: gol('ACC-002', t(L('Aset lancar', 'Current assets')), null, { t: 'asset' }), v: bs.CA },
        { n: L('Aset tidak lancar (neto)', 'Non-current assets (net)'), go: gol('ACC-002', t(L('Aset tidak lancar (neto)', 'Non-current assets (net)')), null, { t: 'asset' }), v: bs.NCA },
        { n: L('Total aset', 'Total assets'), v: bs.A, cls: 'tot' },
        { n: L('Liabilitas lancar', 'Current liabilities'), go: gol('ACC-002', t(L('Liabilitas lancar', 'Current liabilities')), null, { t: 'liab' }), v: bs.CL },
        { n: L('Liabilitas jangka panjang', 'Non-current liabilities'), go: gol('ACC-002', t(L('Liabilitas jangka panjang', 'Non-current liabilities')), null, { t: 'liab' }), v: bs.NCL },
        { n: L('Ekuitas (termasuk laba berjalan)', 'Equity (incl. current-year profit)'), go: gol('ACC-002', t(L('Ekuitas (termasuk laba berjalan)', 'Equity (incl. current-year profit)')), null, { t: 'eq' }), v: bs.EQ, sub: t(L('Laba tahun berjalan ', 'Current-year profit ')) + rp(bs.cyProfit) },
        { n: L('Total liabilitas + ekuitas', 'Total liabilities + equity'), v: bs.L + bs.EQ, cls: 'tot' }
      ]) + chipsRow(bs.check === 0 ? A.chip('ok', L('Neraca seimbang: aset = liabilitas + ekuitas', 'Balanced: assets = liabilities + equity'), 'checkc') : A.chip('crit', L('Selisih neraca ' + rp(bs.check), 'Balance sheet difference ' + rp(bs.check)), 'alert')) +
        '<p class="sub5 ac10-p">' + t(L('Current ratio ', 'Current ratio ')) + '<b class="num">' + (bs.CL ? n0(bs.CA / bs.CL, 2) : '—') + '</b> = ' + t(L('aset lancar ÷ liabilitas lancar', 'current assets ÷ current liabilities')) + '</p>';
      var cfT = mt([
        { n: L('Kas masuk operasi', 'Operating cash in'), v: cf.opIn, cls: 'ac10-ln' }, { n: L('Kas keluar operasi', 'Operating cash out'), v: -cf.opOut, cls: 'ac10-ln' },
        { n: L('Arus kas operasi', 'Operating cash flow'), v: cf.op, cls: 'tot' + (cf.op < 0 ? ' neg' : '') }, { n: L('Arus kas investasi', 'Investing cash flow'), v: cf.inv }, { n: L('Arus kas pendanaan', 'Financing cash flow'), v: cf.fin },
        { n: L('Perubahan kas bersih', 'Net change in cash'), v: cf.op + cf.inv + cf.fin, cls: 'tot' + (cf.op + cf.inv + cf.fin < 0 ? ' neg' : '') }
      ]) + '<p class="sub5 ac10-p">' + t(L('Metode langsung dari jurnal kas & bank (saldo awal migrasi tidak dihitung). Investasi = jurnal dengan akun aset tetap 15xx, pendanaan = utang bank 2500 / ekuitas 3xxx.', 'Direct method from cash & bank journals (migration opening excluded). Investing = journals touching fixed assets 15xx, financing = bank loan 2500 / equity 3xxx.')) + '</p>';
      var pers = F.periods().filter(function (x) { return x.p >= F.mAdd(cur, -5) && x.p <= cur; }).reverse();
      var perL = '<ul class="ac10-per">' + pers.map(function (x) { return '<li><a href="' + href('ACC-005', null, { p: x.p }) + '"><b>' + esc(mon(x.p)) + '</b>' + P.stc(F.PER_ST, x.st) + '<small>' + (x.closedAt ? t(L('ditutup ', 'closed ')) + dt(x.closedAt) : x.st === 'open' ? t(L('jurnal masih bisa diposting', 'journals can still be posted')) : '') + '</small></a></li>'; }).join('') + '</ul>';
      var js = F.journals({}).filter(function (j) { return j.st !== 'draft'; }).slice(0, 8), drafts = F.journals({ st: 'draft' }).length;
      var jl = P.table(js, [
        { h: L('Jurnal', 'Journal'), v: function (j) { return P.jvLink(j.id); } }, { h: L('Tanggal', 'Date'), v: function (j) { return dtn(j.date); } },
        { h: L('Keterangan', 'Description'), v: function (j) { return esc(T(j.desc)); } }, { h: L('Sumber', 'Source'), v: function (j) { return srcN(j) + '<small class="sub5">' + srcLink(j) + '</small>'; } },
        { h: L('Nilai', 'Amount'), cls: 'r num ac10-n', v: function (j) { return rp(F.jvTotals(j.lines).d); } }, { h: 'Status', v: jvSt }
      ], function (j) { return { t: esc(j.id), r: rpj(F.jvTotals(j.lines).d), s: esc(T(j.desc)), chip: jvSt(j) }; }, function (j) { return href('ACC-004', j.id); });
      var rev = months().slice(-7).map(function (m) { var x = F.plMonth(m); return { l: mon(m, false) + (m === cur ? '*' : ''), v: Math.max(0, x.revenue), hi: m === p }; });
      var recCard = !cs.ready ? P.rec({ title: L('Closing ' + mon(lc) + ' belum selesai', mon(lc) + ' close not finished'), tone: 'warn', icon: 'lock',
        sig: L('Checklist closing ' + mon(lc) + ': ' + cs.done + ' dari ' + cs.total + ' selesai, status periode ' + T(F.PER_ST[cs.perSt][0]) + '.', mon(lc) + ' close checklist: ' + cs.done + ' of ' + cs.total + ' done, period status ' + F.PER_ST[cs.perSt][0][1] + '.'),
        why: cs.items.filter(function (i) { return i.st !== 'done'; }).map(function (i) { return [T(i.n) + (i.auto && !i.auto.ok ? ' — ' + T(i.auto.why) : ''), i.n[1] + (i.auto && !i.auto.ok ? ' — ' + i.auto.why[1] : '')]; }),
        impact: L('Laporan dan rasio ' + mon(lc) + ' masih bisa berubah; CFO dashboard menandainya soft close.', mon(lc) + ' reports and ratios can still change; the CFO dashboard marks them soft-closed.'),
        rec: L('Selesaikan item checklist yang terbuka, lalu tutup periode di Kontrol Periode.', 'Finish the open checklist items, then close the period in Period Control.'),
        act: { n: L('Buka Kontrol Periode', 'Open Period Control'), s: 'ACC-005', q: 'p=' + lc } }) : '';
      return P.head(t(L('Laba rugi, neraca, arus kas dan status periode dari ledger. Klik angka untuk melihat sumbernya.', 'P&L, balance sheet, cash flow and period status from the ledger. Click a figure to see its source.')),
          A.pbtn('fin.gl.post', 'ghost', L('Draft Jurnal', 'Draft Journal'), 'plus', { act: 'newjv', cls: 'hide-m' }) + A.btn('ghost', L('Daftar Jurnal', 'Journal List'), 'list', { go: 'ACC-003' }), perFresh(p)) +
        tabs + tiles + recCard +
        grid('g21-10', [card(Lx(L('Laba rugi ', 'Profit & loss '), (isCur ? T(L('MTD s/d ', 'MTD to ')) + dt(asOf) : mon(p))), plT, { icon: 'chart', right: perChip(p) }),
          '<div class="col10">' + card(L('Pendapatan per bulan', 'Revenue by month'), A.barChart(rev, { label: T(L('Pendapatan per bulan', 'Revenue by month')), fmt: rpj, fmtAx: H.rpAx, h: 200 }) + '<p class="sub5 ac10-p">' + t(L('* bulan berjalan (MTD). Apr–Sep dari ringkasan migrasi Fase 5, Oktober detail.', '* running month (MTD). Apr–Sep from the Phase 5 migration summaries, October in detail.')) + '</p>', { icon: 'trend' }) +
          card(L('Status periode', 'Period status'), perL + chipsRow(A.chip(cs.ready ? 'ok' : 'warn', L('Closing ' + mon(lc) + ': ' + cs.done + '/' + cs.total, mon(lc) + ' close: ' + cs.done + '/' + cs.total), 'lock') + (drafts ? A.chip('mute', L(drafts + ' draft jurnal', drafts + ' draft journals'), 'edit') : '')), { icon: 'lock', link: ['ACC-005', L('Kontrol periode', 'Period control')] }) + '</div>']) +
        grid('g2-10', [card(Lx(L('Neraca per ', 'Balance sheet at '), dt(asOf)), bsT, { icon: 'scale', link: ['ACC-002', L('Chart of Accounts', 'Chart of Accounts')] }),
          card(Lx(L('Arus kas ', 'Cash flow '), (isCur ? 'MTD' : mon(p))), cfT, { icon: 'coins', link: open('CASH-001') ? ['CASH-001', L('Kas & treasury', 'Cash & treasury')] : null })]) +
        card(L('Jurnal terbaru', 'Latest journals'), jl, { icon: 'list', count: F.journals({}).length, link: ['ACC-003', L('Semua jurnal', 'All journals')] });
    },
    act: { newjv: function () { jvDialog(null); } }
  };

  /* ================= NP-01 · ACC-002 Chart of Accounts ================= */
  var COA_TABS = [['', L('Semua', 'All'), 'list'], ['asset', L('Aset', 'Assets'), 'building'], ['liab', L('Liabilitas', 'Liabilities'), 'file'], ['eq', L('Ekuitas', 'Equity'), 'shield'], ['rev', L('Pendapatan', 'Revenue'), 'trend'], ['cogs', 'HPP / COGS', 'factory'], ['opex', 'OPEX', 'coins'], ['other', L('Lain-lain & pajak', 'Other & tax'), 'percent']];
  V['ACC-002'] = {
    render: function (c) {
      var tp = c.q.t || '', cur = F.curPeriod(), from = cur + '-01';
      var types = tp === 'other' ? ['other', 'tax'] : tp ? [tp] : ['asset', 'liab', 'eq', 'rev', 'cogs', 'opex', 'other', 'tax'];
      var tb = F.tb({});
      var secs = types.map(function (ty) {
        var accs = F.COA.filter(function (a) { return a.type === ty; });
        if (!accs.length) return '';
        var rows = accs.map(function (a) { return { a: a, bal: F.natural(a.c), mtd: F.natural(a.c, today(), from) }; });
        var pl = ['rev', 'cogs', 'opex', 'other', 'tax'].indexOf(ty) >= 0;
        var cols = [
          { h: L('Kode', 'Code'), v: function (r) { return '<b class="mono6">' + esc(r.a.c) + '</b>'; } },
          { h: L('Nama akun', 'Account name'), v: function (r) { return t(r.a.n) + (r.a.nb === 'c' && ty === 'asset' ? ' <small class="sub5">' + t(L('kontra aset', 'contra asset')) + '</small>' : ''); } },
          { h: L('Grup', 'Group'), v: function (r) { return '<span class="sub5">' + esc(r.a.grp) + (r.a.cur && !pl ? ' · ' + t(L('lancar', 'current')) : '') + '</span>'; } },
          { h: L('Saldo normal', 'Normal balance'), v: function (r) { return r.a.nb === 'd' ? 'Debit' : t(L('Kredit', 'Credit')); } },
          { h: pl ? L('Mutasi YTD ledger', 'Ledger YTD movement') : L('Saldo', 'Balance'), cls: 'r num ac10-n', v: function (r) { return '<b' + (r.bal < 0 ? ' class="ac10-neg"' : '') + '>' + rp(r.bal) + '</b>'; } },
          { h: L('Mutasi ' + mon(cur, false), mon(cur, false) + ' movement'), cls: 'r num ac10-n', v: function (r) { return r.mtd ? rp(r.mtd) : '<span class="sub5">—</span>'; } },
          { h: L('Buku besar', 'Ledger'), v: function (r) { return A.btn('ghost', L('Buka', 'Open'), 'list', { go: 'ACC-003', qs: 'acc=' + r.a.c, cls: 'btn-sm' }); } }
        ];
        return card(F.TYPES[ty], P.table(rows, cols, function (r) { return { t: esc(r.a.c) + ' · ' + t(r.a.n), r: rpj(r.bal), s: t(L('Mutasi bulan ini ', 'This month ')) + rpj(r.mtd) }; }, function (r) { return ledgerHref(r.a.c); }), { icon: by(COA_TABS, 0, ty) ? by(COA_TABS, 0, ty)[2] : 'list', count: accs.length });
      }).join('');
      return P.head(t(L(F.COA.length + ' akun. Saldo dari ledger per hari ini; akun laba rugi menunjukkan mutasi sejak awal ledger (1 Apr). Klik akun untuk buku besar dengan saldo berjalan.', F.COA.length + ' accounts. Balances from the ledger as of today; P&L accounts show the movement since the ledger start (1 Apr). Click an account for its ledger with running balance.')),
          A.btn('ghost', L('Dashboard Finance', 'Finance Dashboard'), 'grid', { go: 'ACC-001' }), P.fresh({ kind: 'live', src: L('ledger', 'ledger') })) +
        H.tabs(COA_TABS.map(function (x) { return [x[0], x[1], x[2]]; }), tp, 't', { label: L('Tipe akun', 'Account type') }) +
        chipsRow(A.chip(Math.round(tb.d - tb.c) === 0 ? 'ok' : 'crit', L('Neraca saldo: debit ' + rp(tb.d) + ' = kredit ' + rp(tb.c), 'Trial balance: debit ' + rp(tb.d) + ' = credit ' + rp(tb.c)), Math.round(tb.d - tb.c) === 0 ? 'checkc' : 'alert')) +
        secs;
    }
  };

  /* ================= NP-01 · ACC-003 Journal List (and account ledger) ================= */
  function ledgerView(c) {
    var code = c.q.acc, a = F.acc(code), p = c.q.p || '';
    if (!a) return A.stateCard('empty', L('Akun tidak ditemukan.', 'Account not found.'), A.btn('blue', L('Kembali', 'Back'), 'arrowl', { go: 'ACC-002' }));
    var from = p ? p + '-01' : null, to = p ? (p === F.curPeriod() ? today() : F.mEnd(p)) : today(), lg = F.ledger(code, from, to);
    var ms = [['', L('Sejak awal ledger', 'Since ledger start')]].concat(months().reverse().map(function (m) { return [m, L(mon(m), mon(m))]; }));
    var rows = lg.rows.slice().reverse();
    var tbl = P.table(rows, [
      { h: L('Tanggal', 'Date'), v: function (r) { return dtn(r.date); } }, { h: L('Jurnal', 'Journal'), v: function (r) { return P.jvLink(r.jv); } },
      { h: L('Keterangan · sumber', 'Description · source'), v: function (r) { return esc(T(r.desc)) + '<small class="sub5">' + t(F.JV_SRC[r.src.t] || L(r.src.t, r.src.t)) + '</small>'; } },
      { h: 'Debit', cls: 'r num ac10-n', v: function (r) { return r.d ? rp(r.d) : ''; } }, { h: L('Kredit', 'Credit'), cls: 'r num ac10-n', v: function (r) { return r.c ? rp(r.c) : ''; } },
      { h: L('Saldo berjalan', 'Running balance'), cls: 'r num ac10-n', v: function (r) { return '<b>' + rp(r.bal) + '</b>'; } }
    ], function (r) { return { t: esc(r.jv) + ' · ' + dt(r.date), r: (r.d ? '+' : '−') + rpj(r.d || r.c), s: esc(T(r.desc)) + ' · ' + t(L('saldo ', 'balance ')) + rpj(r.bal) }; }, function (r) { return href('ACC-004', r.jv); }, { empty: L('Tidak ada mutasi pada rentang ini.', 'No movement in this range.') });
    return P.head(t(L('Buku besar ', 'Ledger ')) + '<b>' + accN(code) + '</b> · ' + t(F.TYPES[a.type]) + ' · ' + t(L('saldo normal ', 'normal balance ')) + (a.nb === 'd' ? 'Debit' : t(L('Kredit', 'Credit'))),
        A.btn('ghost', L('Semua jurnal', 'All journals'), 'list', { go: 'ACC-003' }) + A.btn('ghost', L('Chart of Accounts', 'Chart of Accounts'), 'arrowl', { go: 'ACC-002' }), P.fresh({ kind: p && F.period(p) && F.period(p).st !== 'open' ? 'ledger' : 'live', src: L('buku besar ' + code, 'ledger ' + code) })) +
      '<div class="fb"><label class="fb-f"><span class="sr">' + t(L('Periode', 'Period')) + '</span><select data-f="p">' + ms.map(function (m) { return '<option value="' + esc(m[0]) + '"' + (m[0] === p ? ' selected' : '') + '>' + t(m[1]) + '</option>'; }).join('') + '</select></label></div>' +
      P.kpis([{ k: L('Saldo awal', 'Opening balance'), v: rpj(lg.open), s: from ? dt(F.addDays(from, -1)) : t(L('awal ledger', 'ledger start')), icon: 'clock' },
        { k: 'Debit', v: rpj(sum(lg.rows.map(function (r) { return r.d; }))), s: lg.rows.filter(function (r) { return r.d; }).length + ' ' + t(L('baris', 'lines')), icon: 'arrowdn' },
        { k: L('Kredit', 'Credit'), v: rpj(sum(lg.rows.map(function (r) { return r.c; }))), s: lg.rows.filter(function (r) { return r.c; }).length + ' ' + t(L('baris', 'lines')), icon: 'arrowup' },
        { k: L('Saldo akhir', 'Closing balance'), v: rpj(lg.close), s: dt(to), icon: 'scale', tone: 'info' }]) +
      card(L('Mutasi (terbaru di atas)', 'Movements (newest first)'), tbl, { icon: 'list', count: rows.length });
  }
  V['ACC-003'] = {
    title: function () { var q = A.S.q || {}; return q.acc ? L('Buku Besar ' + q.acc, 'Ledger ' + q.acc) : null; },
    render: function (c) {
      if (c.q.acc) return ledgerView(c);
      var f = { period: c.q.p || null, src: c.q.src || null, st: c.q.st || null, q: c.q.q || null }, all = F.journals(f), lim = +c.q.n || 60, rows = all.slice(0, lim);
      var defs = [
        { k: 'p', l: L('Periode', 'Period'), opts: months().reverse().map(function (m) { return [m, L(mon(m), mon(m))]; }).concat([['2026-03', L('Mar 2026 (saldo awal)', 'Mar 2026 (opening)')]]) },
        { k: 'src', l: L('Sumber', 'Source'), opts: Object.keys(F.JV_SRC).map(function (k) { return [k, F.JV_SRC[k]]; }) },
        { k: 'st', l: 'Status', opts: Object.keys(F.JV_ST).map(function (k) { return [k, F.JV_ST[k][0]]; }) }
      ];
      var d = sum(all.map(function (j) { return F.jvTotals(j.lines).d; })), unb = all.filter(function (j) { return !F.balanced(j.lines); }).length, drafts = all.filter(function (j) { return j.st === 'draft'; });
      var cols = [
        { h: L('Jurnal', 'Journal'), v: function (j) { return '<b class="mono6">' + esc(j.id) + '</b>'; } }, { h: L('Tanggal', 'Date'), v: function (j) { return dtn(j.date); } },
        { h: L('Keterangan', 'Description'), v: function (j) { return esc(T(j.desc)) + (j.ref ? '<small class="sub5">' + t(L('Ref ', 'Ref ')) + esc(j.ref) + '</small>' : ''); } },
        { h: L('Sumber', 'Source'), v: function (j) { return srcN(j) + '<small class="sub5">' + srcLink(j) + '</small>'; } },
        { h: L('Akun', 'Accounts'), v: function (j) { return '<span class="sub5 num">' + j.lines.map(function (l) { return esc(l.a); }).filter(function (x, i, a) { return a.indexOf(x) === i; }).slice(0, 4).join(' · ') + (j.lines.length > 4 ? ' …' : '') + '</span>'; } },
        { h: L('Nilai', 'Amount'), cls: 'r num ac10-n', v: function (j) { return rp(F.jvTotals(j.lines).d); } },
        { h: 'Status', v: function (j) { return jvSt(j) + ' ' + kindChip(j) + (F.balanced(j.lines) ? '' : ' ' + A.chip('crit', L('Tidak seimbang', 'Unbalanced'), 'alert')); } }
      ];
      return P.head(t(L('Semua jurnal dengan sumber, referensi dan status. Jurnal yang sudah diposting tidak bisa diubah: koreksi lewat jurnal balik atau penyesuaian.', 'All journals with source, reference and status. Posted journals cannot be changed: correct them with a reversal or an adjustment.')),
          A.pbtn('fin.gl.post', 'primary', L('Draft Jurnal', 'Draft Journal'), 'plus', { act: 'newjv', cls: 'hide-m' }), P.fresh({ kind: 'live', src: L('jurnal ledger', 'ledger journals') })) +
        P.deskOnly() +
        A.filters(defs, { force: true, search: L('Cari no. jurnal, referensi, keterangan', 'Search journal no., reference, description') }) +
        '<div class="fb ac10-acc"><label class="fb-f"><span class="sr">' + t(L('Akun', 'Account')) + '</span><select data-f="acc"><option value="">' + t(L('Buku besar akun…', 'Account ledger…')) + '</option>' + coaOpts().map(function (o) { return '<option value="' + esc(o[0]) + '">' + esc(o[1]) + '</option>'; }).join('') + '</select></label></div>' +
        P.kpis([{ k: L('Jurnal', 'Journals'), v: n0(all.length), s: f.period ? esc(mon(f.period)) : t(L('semua periode', 'all periods')), icon: 'list' }, { k: L('Total debit = kredit', 'Total debit = credit'), v: rpj(d), icon: 'scale', tone: unb ? 'warn' : 'ok', s: unb ? t(L(unb + ' draft belum seimbang', unb + ' drafts unbalanced')) : t(L('semua seimbang', 'all balanced')) },
          { k: L('Draft', 'Drafts'), v: n0(drafts.length), s: t(L('belum masuk ledger', 'not in the ledger yet')), icon: 'edit', tone: drafts.length ? 'appr' : '', go: 'ACC-003', q: { st: 'draft' } },
          { k: L('Dibalik', 'Reversed'), v: n0(all.filter(function (j) { return j.st === 'reversed'; }).length), icon: 'loop', go: 'ACC-003', q: { st: 'reversed' } }]) +
        card(L('Jurnal', 'Journals'), P.table(rows, cols, function (j) { return { t: esc(j.id) + ' · ' + dt(j.date), r: rpj(F.jvTotals(j.lines).d), s: esc(T(j.desc)), chip: jvSt(j) }; }, function (j) { return href('ACC-004', j.id); }) +
          (all.length > lim ? '<p class="ac10-more">' + A.btn('ghost', L('Tampilkan ' + Math.min(60, all.length - lim) + ' lagi (' + (all.length - lim) + ' tersisa)', 'Show ' + Math.min(60, all.length - lim) + ' more (' + (all.length - lim) + ' left)'), 'chevd', { go: 'ACC-003', qs: Object.keys(c.q).filter(function (k) { return k !== 'n' && k !== 'state'; }).map(function (k) { return k + '=' + encodeURIComponent(c.q[k]); }).concat(['n=' + (lim + 60)]).join('&') }) + '</p>' : ''), { icon: 'list', count: all.length });
    },
    act: { newjv: function () { jvDialog(null); } }
  };

  /* ================= NP-01 · ACC-004 Journal Detail ================= */
  V['ACC-004'] = {
    title: function (rec) { return rec ? L('Jurnal ' + rec, 'Journal ' + rec) : null; },
    render: function (c) {
      var j = c.rec ? F.jv(c.rec) : null;
      if (!j) return P.head(t(L('Pilih jurnal dari daftar.', 'Pick a journal from the list.')), A.btn('blue', L('Daftar Jurnal', 'Journal List'), 'list', { go: 'ACC-003' })) + A.stateCard('empty', L('Jurnal tidak ditemukan.', 'Journal not found.'), A.btn('blue', L('Daftar Jurnal', 'Journal List'), 'list', { go: 'ACC-003' }));
      var tt = F.jvTotals(j.lines), bal = F.balanced(j.lines), ps = F.perSt(j.date), revJ = j.rev ? F.jv(j.rev) : null, orig = j.of ? F.jv(j.of) : null;
      var acts = '';
      if (j.st === 'draft') acts += A.pbtn('fin.gl.post', 'primary', L('Posting Jurnal', 'Post Journal'), 'checkc', { act: 'post', val: j.id }) + A.pbtn('fin.gl.post', 'ghost', L('Ubah Draft', 'Edit Draft'), 'edit', { act: 'edit', val: j.id });
      else if ((j.st === 'posted' || j.st === 'adjust') && j.kind !== 'open') acts += A.pbtn('fin.gl.reverse', 'ghost', L('Balik Jurnal', 'Reverse Journal'), 'loop', { act: 'reverse', val: j.id });
      var lock = j.st === 'draft' ? note(t(L('Draft: belum mempengaruhi ledger. Posting hanya bila debit = kredit' + (ps === 'soft' ? ' dan, karena periode soft close, dengan alasan' : '') + '.', 'Draft: not in the ledger yet. Posting requires debit = credit' + (ps === 'soft' ? ' and, as the period is soft-closed, a reason' : '') + '.')), 'edit', 'info')
        : note(t(L('Jurnal ini sudah ' + T(F.JV_ST[j.st][0]).toLowerCase() + ' dan tidak bisa diubah. Koreksi dengan jurnal balik (beserta alasan), penyesuaian, atau koreksi periode berikutnya bila periode ditutup.', 'This journal is ' + F.JV_ST[j.st][0][1].toLowerCase() + ' and cannot be changed. Correct it with a reversal (with a reason), an adjustment, or a next-period correction if the period is closed.')), 'lock', 'info');
      return P.head(srcN(j) + ' · ' + t(L('periode ', 'period ')) + esc(mon(j.period)) + ' ' + perChip(j.period), acts + A.btn('ghost', L('Daftar Jurnal', 'Journal List'), 'list', { go: 'ACC-003' })) +
        hero({ id: j.id, icon: 'list', title: esc(T(j.desc)), sub: t(L('Referensi ', 'Reference ')) + esc(j.ref || '—') + ' · ' + srcLink(j),
          chips: jvSt(j) + kindChip(j) + (bal ? A.chip('ok', L('Seimbang', 'Balanced'), 'checkc') : A.chip('crit', L('Tidak seimbang', 'Unbalanced'), 'alert')),
          facts: [[L('Tanggal', 'Date'), dt(j.date)], [L('Periode', 'Period'), esc(mon(j.period))], ['Debit', rp(tt.d), 'num'], [L('Kredit', 'Credit'), rp(tt.c), 'num'], [L('Baris', 'Lines'), j.lines.length, 'num']] }) +
        lock +
        grid('g21-10', [card(L('Baris jurnal', 'Journal lines'), P.jlines(j.lines.map(function (l) { return { a: l.a, d: l.d, c: l.c, cc: l.cc, m: l.memo }; })), { icon: 'list' }),
          card(L('Pembuat & persetujuan', 'Maker & approval'), kv([[L('Dibuat oleh', 'Created by'), emp(j.by)], [L('Disetujui / diposting oleh', 'Approved / posted by'), j.st === 'draft' ? '<span class="sub5">' + t(L('belum', 'not yet')) + '</span>' : emp(j.appr)], [L('Waktu', 'Time'), esc(j.at || '—')],
            [L('Jenis', 'Kind'), kindChip(j) || t(L('Otomatis dari dokumen sumber', 'Automatic from the source document'))], j.reason ? [L('Alasan', 'Reason'), esc(T(j.reason))] : null,
            revJ ? [L('Dibalik oleh jurnal', 'Reversed by journal'), P.jvLink(revJ.id) + ' · ' + dt(revJ.date)] : null, orig ? [L('Membalik jurnal', 'Reverses journal'), P.jvLink(orig.id)] : null,
            [L('Status periode', 'Period status'), perChip(j.period)]]), { icon: 'usercheck' })]) +
        card(L('Jejak ke sumber', 'Trace to source'), trace(j.id) + '<p class="sub5 ac10-p">' + t(L('Jurnal → Invoice → Billing Ready → Delivery → Order → Klien; Biaya → Invoice supplier → PO → Penerimaan → Supplier.', 'Journal → Invoice → Billing Ready → Delivery → Order → Client; Expense → Supplier invoice → PO → Receiving → Supplier.')) + '</p>', { icon: 'route' }) +
        card(L('Riwayat audit', 'Audit history'), audits(j.id), { icon: 'history' });
    },
    act: {
      post: function (el) {
        var j = F.jv(el.getAttribute('data-val')); if (!j) return;
        var need = F.perSt(j.date) === 'soft' || j.kind === 'adjust';
        P.reasonDlg({ title: L('Posting ' + j.id, 'Post ' + j.id), icon: 'checkc', ok: L('Posting', 'Post'), optional: !need,
          sub: t(L('Setelah diposting, jurnal tidak bisa diubah lagi — koreksi hanya lewat jurnal balik.', 'Once posted the journal cannot be changed — corrections only by reversal.')) + (need ? ' <b>' + t(L('Alasan wajib (penyesuaian / periode soft close).', 'A reason is required (adjustment / soft-closed period).')) + '</b>' : ''),
          label: need ? L('Alasan', 'Reason') : L('Catatan (opsional)', 'Note (optional)'),
          fn: function (reason) { return F.postJournal(cx(), j.id, reason || null); }, done: L('Jurnal ' + j.id + ' diposting.', 'Journal ' + j.id + ' posted.') });
      },
      edit: function (el) { var j = F.jv(el.getAttribute('data-val')); if (j) jvDialog(j); },
      reverse: function (el) {
        var j = F.jv(el.getAttribute('data-val')); if (!j) return;
        var ps = F.perSt(j.date);
        P.reasonDlg({ title: L('Balik ' + j.id, 'Reverse ' + j.id), icon: 'loop', ok: L('Buat Jurnal Balik', 'Create Reversal'),
          sub: t(ps === 'open' ? L('Jurnal balik dibuat di periode yang sama dengan baris debit/kredit ditukar. Jurnal asli tetap ada dan ditandai Reversed.', 'The reversal is posted in the same period with debit/credit swapped. The original stays and is marked Reversed.')
            : L('Periode ' + mon(j.period) + ' sudah ' + T(F.PER_ST[ps][0]) + ': jurnal balik dicatat sebagai koreksi periode berikutnya per hari ini.', 'Period ' + mon(j.period) + ' is ' + F.PER_ST[ps][0][1] + ': the reversal is recorded as a next-period correction dated today.')),
          fn: function (reason) { return F.reverse(cx(), j.id, reason); },
          then: function (r) { setTimeout(function () { go('ACC-004', r.jv.id); }, 300); },
          done: L('Jurnal balik dibuat.', 'Reversal created.') });
      }
    }
  };

  /* ================= NP-01 · ACC-005 Period Control ================= */
  var PER_ACT = { soft: [L('Soft Close', 'Soft Close'), 'pause'], open: [L('Buka Kembali', 'Reopen'), 'refresh'], closed: [L('Tutup Periode', 'Close Period'), 'lock'], locked: [L('Kunci', 'Lock'), 'key'] };
  V['ACC-005'] = {
    render: function (c) {
      var pers = F.periods(), def = (pers.filter(function (x) { return x.st === 'soft'; })[0] || {}).p || F.lastClosed(), p = c.q.p && F.period(c.q.p) ? c.q.p : def, per = F.period(p), cs = F.closeStatus(p), ck = F.closeCheck(p);
      var rows = pers.slice().reverse();
      var tbl = P.table(rows, [
        { h: L('Periode', 'Period'), v: function (x) { return '<a class="lnk5" href="' + href('ACC-005', null, { p: x.p }) + '"><b>' + esc(mon(x.p)) + '</b></a>' + (x.p === F.curPeriod() ? ' ' + A.chip('info', L('Berjalan', 'Current')) : ''); } },
        { h: 'Status', v: function (x) { return P.stc(F.PER_ST, x.st); } },
        { h: L('Ditutup', 'Closed'), v: function (x) { return x.closedAt ? '<span class="ac10-nw">' + dt(x.closedAt) + '</span><small class="sub5">' + emp(x.closedBy) + '</small>' : '<span class="sub5">—</span>'; } },
        { h: L('Jurnal', 'Journals'), cls: 'r num ac10-n', v: function (x) { return gol('ACC-003', n0(F.journals({ period: x.p }).length), null, { p: x.p }); } },
        { h: L('Aksi', 'Actions'), v: function (x) { var b = (F.PER_FLOW[x.st] || []).filter(function (to) { return to !== 'closed' || F.closeCheck(x.p).ok; }).map(function (to) { return A.pbtn(to === 'closed' ? 'fin.close' : 'fin.period', to === 'closed' ? 'primary' : 'ghost', PER_ACT[to][0], PER_ACT[to][1], { act: 'set', val: x.p + '|' + to, cls: 'btn-sm' }); }).join(' '); return b ? '<span class="ac10-nw">' + b + '</span>' : x.st === 'soft' ? '<span class="sub5">' + t(L('tutup setelah checklist', 'close after checklist')) + '</span>' : '<span class="sub5">' + t(L('final', 'final')) + '</span>'; } }
      ], function (x) { return { t: esc(mon(x.p)), r: '', s: x.closedAt ? t(L('ditutup ', 'closed ')) + dt(x.closedAt) : '', chip: P.stc(F.PER_ST, x.st) }; });
      var items = '<ul class="ac10-ck">' + cs.items.map(function (i) {
        var done = i.st === 'done', blk = i.auto && !i.auto.ok;
        return '<li class="' + (done ? 'ok' : blk ? 'no' : 'op') + '">' + ic(done ? 'checkc' : blk ? 'xc' : 'clock') + '<span><b>' + gol(i.scr, t(i.n)) + '</b><small>' + (done ? t(L('Selesai ', 'Done ')) + emp(i.by) + ' · ' + dt(i.at) + (i.note ? ' · ' + esc(i.note) : '') : blk ? t(i.auto.why) : t(L('Belum dicentang', 'Not ticked yet'))) + (i.auto && i.auto.warn ? ' · ' + t(i.auto.warn) : '') + '</small></span></li>';
      }).join('') + '</ul>';
      var log = [];
      pers.forEach(function (x) { (x.log || []).forEach(function (l) { log.push({ p: x.p, at: l.at, by: l.by, from: l.from, to: l.to, reason: l.reason }); }); });
      log.sort(function (a, b) { return a.at < b.at ? 1 : -1; });
      var hist = P.table(log, [
        { h: L('Waktu', 'Time'), v: function (l) { return esc(l.at); } }, { h: L('Periode', 'Period'), v: function (l) { return esc(mon(l.p)); } },
        { h: L('Perubahan', 'Change'), v: function (l) { return P.stc(F.PER_ST, l.from) + ' → ' + P.stc(F.PER_ST, l.to); } }, { h: L('Oleh', 'By'), v: function (l) { return emp(l.by); } }, { h: L('Alasan', 'Reason'), v: function (l) { return esc(l.reason ? T(l.reason) : '—'); } }
      ], function (l) { return { t: esc(mon(l.p)) + ' · ' + t(F.PER_ST[l.to][0]), r: '', s: esc(l.at) + ' · ' + emp(l.by) + (l.reason ? ' · ' + esc(T(l.reason)) : '') }; }, null, { empty: L('Belum ada perubahan status periode di sistem ini. Penutupan Jan–Agu tercatat di migrasi.', 'No period status change in this system yet. The Jan–Aug closes were recorded at migration.') });
      var closeBtn = per && (F.PER_FLOW[per.st] || []).indexOf('closed') >= 0 ? (ck.ok ? A.pbtn('fin.close', 'primary', L('CLOSE PERIOD ' + mon(p), 'CLOSE PERIOD ' + mon(p)), 'lock', { act: 'set', val: p + '|closed' }) : '<p class="note5 n-warn">' + ic('alert') + '<span>' + t(L('Tombol tutup periode aktif setelah semua item checklist selesai (' + cs.done + '/' + cs.total + ').', 'The close button activates when every checklist item is done (' + cs.done + '/' + cs.total + ').')) + '</span></p>') : '';
      return P.head(t(L('Open → Soft Close → Closed → Locked. Periode tertutup tidak bisa diubah diam-diam: koreksi hanya lewat penyesuaian, jurnal balik atau koreksi periode berikutnya, semuanya diaudit.', 'Open → Soft Close → Closed → Locked. A closed period is never changed silently: corrections only by adjustment, reversal or next-period correction, all audited.')),
          open('BUD-004') ? A.btn('ghost', L('Monthly Close', 'Monthly Close'), 'filecheck', { go: 'BUD-004' }) : '', P.fresh({ kind: 'live', src: L('status periode', 'period status') })) +
        grid('g21-10', [card(L('Periode akuntansi', 'Accounting periods'), tbl + '<p class="sub5 ac10-p">' + t(L('Soft close: hanya Finance dengan alasan yang boleh posting. Closed: posting ditolak. Locked: final untuk audit.', 'Soft close: only Finance with a reason may post. Closed: posting is refused. Locked: final for audit.')) + '</p>', { icon: 'lock' }),
          card(Lx(L('Checklist closing ', 'Close checklist '), mon(p)), '<div class="ac10-ckh">' + P.stc(F.PER_ST, cs.perSt) + '<b class="num">' + cs.done + ' / ' + cs.total + '</b>' + P.prog(cs.done, cs.total, cs.ready ? 'ok' : 'watch') + '</div>' + items + closeBtn +
            (open('BUD-004') ? '<p class="ac10-p">' + A.btn('ghost', L('Kerjakan checklist di Monthly Close', 'Work the checklist in Monthly Close'), 'arrow', { go: 'BUD-004', qs: 'p=' + p, cls: 'btn-sm' }) + '</p>' : ''), { icon: 'filecheck' })]) +
        card(L('Riwayat status periode', 'Period status history'), hist, { icon: 'history', count: log.length }) +
        card(L('Audit periode & closing', 'Period & close audit'), audits(null, 'PERIOD') , { icon: 'shield' });
    },
    act: {
      set: function (el) {
        var x = el.getAttribute('data-val').split('|'), p = x[0], to = x[1], per = F.period(p);
        if (!per) return;
        var warn = to === 'open' ? L('Membuka kembali periode ' + mon(p) + ' memungkinkan posting lagi. Wajib alasan; tercatat di audit.', 'Reopening ' + mon(p) + ' allows posting again. A reason is required; it is audited.')
          : to === 'closed' ? L('Setelah ditutup, jurnal ke ' + mon(p) + ' ditolak; koreksi lewat penyesuaian atau periode berikutnya.', 'Once closed, journals into ' + mon(p) + ' are refused; corrections go through adjustments or the next period.')
          : to === 'locked' ? L('Locked bersifat final untuk audit dan tidak bisa dibuka lagi.', 'Locked is final for audit and cannot be reopened.') : L('Soft close: hanya Finance dengan alasan yang boleh posting ke ' + mon(p) + '.', 'Soft close: only Finance with a reason may post into ' + mon(p) + '.');
        P.reasonDlg({ title: L(T(PER_ACT[to][0]) + ' · ' + mon(p), PER_ACT[to][0][1] + ' · ' + mon(p)), icon: PER_ACT[to][1], ok: PER_ACT[to][0], sub: '<b>' + P.stc(F.PER_ST, per.st) + ' → ' + P.stc(F.PER_ST, to) + '</b> ' + t(warn),
          fn: function (reason) { var r = F.setPeriod(cx(), p, to, reason); if (!r.ok && r.missing) r.msg = L(T(r.msg) + ' (' + r.missing.join(', ') + ')', r.msg[1] + ' (' + r.missing.join(', ') + ')'); return r; },
          done: L('Status ' + mon(p) + ' diubah.', mon(p) + ' status changed.') });
      }
    }
  };

  /* ================= NP-02 · Cash & treasury helpers ================= */
  function mask(no) { return no ? '•••• ' + String(no).replace(/\D/g, '').slice(-4) : '—'; }
  function accChip(a) { return a.restricted ? A.chip('warn', L('Dibatasi', 'Restricted'), 'lock') : A.chip('ok', L('Aktif', 'Active')); }
  function recInfo(a) { var r = (F.state().recon || {})[a.id]; return r && r.at ? { bal: F.accBal(a.id, String(r.at).slice(0, 10)), at: r.at, by: r.by, sys: true } : { bal: a.recBal, at: a.recAt, by: null, sys: false }; }
  function txSt(x) { return P.stc(F.TX_ST, x.st); }
  function txType(x) { var y = F.TX_TYPES[x.type]; return y ? A.chip(y[1], y[0], y[2]) : esc(x.type); }
  function catN(k) { var x = by(F.D.CASH_CATS, 0, k); return x ? t(x[1]) : esc(k || '—'); }
  function txSign(x) { return x.type === 'in' || (x.type === 'adjust' && x.dir === 'in') ? 1 : x.type === 'out' || x.type === 'adjust' ? -1 : 0; }
  function cashOpts(blank) { var o = F.cashAccs().map(function (a) { return [a.id, a.id + ' · ' + a.n + (a.restricted ? ' (' + T(L('dibatasi', 'restricted')) + ')' : '')]; }); return blank ? [['', blank]].concat(o) : o; }
  var CASH_COA = F.cashAccs().map(function (a) { return a.coa; });
  function txDialog(def) {
    def = def || {};
    var th = F.cfg().cashApprove;
    var body = '<div class="ac10-dg">' + fld(L('Jenis transaksi', 'Transaction type'), sel('type', Object.keys(F.TX_TYPES).map(function (k) { return [k, F.TX_TYPES[k][0]]; }), def.type || 'out'), { req: true }) +
      fld(L('Tanggal', 'Date'), inp('date', today(), { type: 'date' }), { req: true }) +
      fld(L('Rekening / kas', 'Account / cash'), sel('acc', cashOpts(), def.acc || 'ACC-01'), { req: true }) +
      fld(L('Rekening tujuan (transfer / setoran / penarikan)', 'Destination (transfer / deposit / withdrawal)'), sel('to', cashOpts(L('—', '—')), '')) +
      fld(L('Akun lawan', 'Counter account'), sel('coa', [['', L('— pilih akun —', '— choose account —')]].concat(coaOpts(function (a) { return CASH_COA.indexOf(a.c) < 0; })), def.coa || '6300'), { hint: t(L('Tidak dipakai untuk transfer.', 'Not used for transfers.')) }) +
      fld(L('Kategori', 'Category'), sel('cat', F.D.CASH_CATS, def.cat || 'opex')) +
      fld(L('Jumlah (Rp)', 'Amount (Rp)'), inp('amt', '', { num: true, ph: L('mis. 7.500.000', 'e.g. 7,500,000') }), { req: true }) +
      fld(L('Referensi', 'Reference'), inp('ref', '', { ph: L('No. BKK / transfer', 'Voucher / transfer no.') })) +
      fld('Cost center', sel('cc', ccOpts(), 'CC-ADM')) +
      fld(L('Arah penyesuaian', 'Adjustment direction'), sel('dir', [['out', L('Kurangi saldo', 'Decrease balance')], ['in', L('Tambah saldo', 'Increase balance')]], 'out')) + '</div>' +
      fld(L('Bukti (no. nota / nama file)', 'Evidence (receipt no. / file name)'), inp('ev', '', { ph: L('Wajib untuk kas keluar & penyesuaian', 'Required for cash out & adjustments') }), { wide: true }) +
      fld(L('Keterangan', 'Description'), inp('note', '', { ph: L('Untuk apa?', 'What for?') }), { wide: true }) +
      fld(L('Alasan (wajib untuk penyesuaian)', 'Reason (required for adjustments)'), area('reason', '', ''), { wide: true }) +
      note(t(L('Kas keluar di atas ' + rp(th) + ' tidak langsung diposting: menunggu persetujuan orang kedua (pembuat tidak boleh menyetujui sendiri).', 'Cash out above ' + rp(th) + ' is not posted straight away: it waits for a second person (the maker cannot approve it).')), 'usercheck', 'info');
    dlg({ title: L('Transaksi kas baru', 'New cash transaction'), icon: 'plus', ok: L('Simpan', 'Save'), body: body,
      after: function (el) { el.querySelector('.dlg5-p').classList.add('ac10-wide'); },
      onOk: function (v) {
        var r = F.addCashTx(cx(), { type: v.type, date: v.date, acc: v.acc, to: v.to || null, coa: v.coa || null, cat: v.cat, amt: amtIn(v.amt), ref: v.ref, cc: v.cc || null, ev: v.ev, note: v.note, dir: v.type === 'adjust' ? v.dir : null, reason: v.reason || null });
        if (!r || !r.ok) return r ? r.msg : F.MSG.invalid;
        var id = r.tx.id;
        setTimeout(function () { go('CASH-003', id); setTimeout(function () { A.toast(r.pending ? L(id + ' menunggu persetujuan orang kedua.', id + ' waits for a second approver.') : L(id + ' diposting ke ' + r.jv.id + '.', id + ' posted to ' + r.jv.id + '.'), r.pending ? 'warn' : 'ok'); }, 350); }, 10);
        return true;
      } });
  }

  /* ================= NP-02 · CASH-001 Cash & Treasury Dashboard ================= */
  var HZ = [['today', L('Hari ini', 'Today')], ['d7', L('7 hari', '7 days')], ['d30', L('30 hari', '30 days')], ['d90', L('90 hari', '90 days')]];
  V['CASH-001'] = {
    render: function (c) {
      var tr = F.treasury(cx()); if (!tr) return A.stateCard('noperm', F.MSG.noperm);
      var hz = by(HZ, 0, c.q.h) ? c.q.h : 'd30', per = tr.per[hz], hzN = by(HZ, 0, hz)[1];
      var tiles = P.kpis([
        { k: L('Total kas & bank', 'Total cash & bank'), v: rpj(tr.total), s: tr.accs.length + ' ' + t(L('rekening', 'accounts')), icon: 'coins', go: 'ACC-002', q: { t: 'asset' } },
        { k: L('Bank', 'Bank'), v: rpj(tr.bank), s: t(L('Kas fisik ', 'Cash on hand ')) + rpj(tr.cash), icon: 'building' },
        { k: L('Dibatasi', 'Restricted'), v: rpj(tr.restricted), s: t(L('payroll reserve, deposito jaminan', 'payroll reserve, guarantee deposit')), icon: 'lock', tone: 'warn' },
        { k: L('Tersedia', 'Available'), v: rpj(tr.avail), s: t(L('total − dibatasi', 'total − restricted')), icon: 'checkc', tone: 'info' },
        { k: L('Komitmen 30 hari', 'Committed 30 days'), v: rpj(tr.committed), s: tr.commitLines.length + ' ' + t(L('AP disetujui & PO', 'approved AP & POs')), icon: 'clipboard', tone: 'appr', go: open('AP-004') ? 'AP-004' : null },
        { k: 'Free cash', v: rpj(tr.free), s: t(L('tersedia − komitmen', 'available − committed')), icon: 'gauge', tone: tr.free > 0 ? 'ok' : 'crit' }
      ]);
      var hzT = '<div class="tblw"><table class="tbl dense mt10"><thead><tr><th>' + t(L('Horizon', 'Horizon')) + '</th><th class="r">' + t(L('Masuk', 'In')) + '</th><th class="r">' + t(L('Keluar', 'Out')) + '</th><th class="r">' + t(L('Saldo akhir', 'Closing')) + '</th></tr></thead><tbody>' +
        HZ.map(function (h) { var x = tr.per[h[0]]; return '<tr' + (h[0] === hz ? ' class="ac10-hi"' : '') + '><th><a class="lnk5" href="' + href('CASH-004', null, { d: { today: 0, d7: 7, d30: 30, d90: 90 }[h[0]] }) + '">' + t(h[1]) + '</a></th><td class="r num">' + rpj(x.inflow) + '</td><td class="r num">' + rpj(-x.outflow) + '</td><td class="r num' + (x.close < 0 ? ' ac10-neg' : '') + '"><b>' + rpj(x.close) + '</b></td></tr>'; }).join('') + '</tbody></table></div>' +
        '<p class="sub5 ac10-p">' + t(L('Skenario base dari kas tersedia (tanpa rekening dibatasi). Detail dan asumsi di Forecast Kas.', 'Base scenario from available cash (restricted accounts excluded). Details and assumptions in Cash Forecast.')) + '</p>';
      var accT = P.table(tr.accs, [
        { h: L('Rekening', 'Account'), v: function (x) { return '<b>' + esc(x.a.n) + '</b><small class="sub5">' + esc(x.a.id) + ' · ' + t(F.CASH_TYPES[x.a.type]) + '</small>'; } },
        { h: L('Bank · No.', 'Bank · No.'), v: function (x) { return x.a.bank ? esc(x.a.bank) + ' <span class="num">' + esc(mask(x.a.no)) + '</span>' : '<span class="sub5">' + t(L('Kas fisik', 'Cash on hand')) + '</span>'; } },
        { h: L('Saldo kini', 'Current balance'), cls: 'r num ac10-n', v: function (x) { return '<b>' + rp(x.bal) + '</b>'; } },
        { h: L('Saldo rekonsiliasi', 'Reconciled balance'), cls: 'r num ac10-n', v: function (x) { var r = recInfo(x.a); return rp(r.bal) + '<small class="sub5">' + dt(r.at) + '</small>'; } },
        { h: 'PIC', v: function (x) { return emp(x.a.pic); } }, { h: 'Status', v: function (x) { return accChip(x.a); } }
      ], function (x) { return { t: esc(x.a.n), r: rpj(x.bal), s: (x.a.bank ? esc(x.a.bank) + ' ' + esc(mask(x.a.no)) : t(L('Kas fisik', 'Cash on hand'))), chip: accChip(x.a) }; }, function (x) { return href('CASH-002', x.a.id); });
      var ms = months(), cur = F.curPeriod();
      var trend = ms.map(function (m) { var d = m === cur ? today() : F.mEnd(m); return { m: m, tot: sum(F.cashAccs().map(function (a) { return F.natural(a.coa, d); })), av: sum(F.cashAccs().filter(function (a) { return !a.restricted; }).map(function (a) { return F.natural(a.coa, d); })), cf: F.cashFlow(m + '-01', d) }; });
      var chart = A.lineChart([{ n: L('Kas & bank', 'Cash & bank'), v: trend.map(function (x) { return x.tot; }) }, { n: L('Tersedia', 'Available'), v: trend.map(function (x) { return x.av; }) }], trend.map(function (x) { return mon(x.m, false) + (x.m === cur ? '*' : ''); }), { h: 210, fmt: rpj, fmtAx: H.rpAx, min: 0, label: T(L('Saldo kas akhir bulan', 'Month-end cash')) }) +
        '<div class="hide-m">' + mt(trend.slice(-4).map(function (x) { return { n: L(mon(x.m, false), mon(x.m, false)), v: rpj(x.cf.op), inv: rpj(x.cf.inv), fin: rpj(x.cf.fin), net: '<b>' + rpj(x.cf.op + x.cf.inv + x.cf.fin) + '</b>' }; }), { cols: ['v', 'inv', 'fin', 'net'], head: [L('Operasi', 'Operating'), L('Investasi', 'Investing'), L('Pendanaan', 'Financing'), L('Bersih', 'Net')] }) + '</div>' +
        '<p class="sub5 ac10-p">' + t(L('* s/d hari ini. Arus kas per aktivitas dari jurnal kas & bank (metode langsung).', '* to date. Cash flow by activity from cash & bank journals (direct method).')) + '</p>';
      var com = P.table(tr.commitLines.slice().sort(function (a, b) { return a.date < b.date ? -1 : 1; }), [
        { h: L('Jatuh tempo', 'Due'), v: function (x) { return dtn(x.date); } }, { h: L('Komitmen', 'Commitment'), v: function (x) { return (x.k === 'ap' ? P.expLink(x.id) : P.poLink(x.id)) + ' <span class="sub5">' + esc(T(x.n)) + '</span>'; } },
        { h: L('Nilai', 'Amount'), cls: 'r num ac10-n', v: function (x) { return rp(x.amt); } }
      ], function (x) { return { t: esc(x.id), r: rpj(x.amt), s: dt(x.date) + ' · ' + esc(T(x.n)) }; });
      var pend = F.cashList(cx(), { st: 'pending' });
      var d90 = tr.per.d90, recCard = d90.close < tr.avail ? P.rec({ title: L('Kas tersedia turun dalam 90 hari', 'Available cash declines over 90 days'), tone: d90.close < tr.avail * 0.5 ? 'crit' : 'warn', icon: 'trend',
        sig: L('Proyeksi base 90 hari: ' + rpj(d90.close) + ' vs tersedia hari ini ' + rpj(tr.avail) + ' (' + pct((d90.close - tr.avail) / tr.avail * 100) + ').', 'Base 90-day projection: ' + rpj(d90.close) + ' vs available today ' + rpj(tr.avail) + ' (' + pct((d90.close - tr.avail) / tr.avail * 100) + ').'),
        why: [L('Perkiraan keluar 90 hari ' + rpj(d90.outflow) + ' (payroll, pajak, utilitas, supplier, PO, biaya rutin).', 'Expected 90-day outflow ' + rpj(d90.outflow) + ' (payroll, tax, utilities, suppliers, POs, recurring cost).'), L('Perkiraan masuk ' + rpj(d90.inflow) + ' dari AR dan Billing Ready yang belum ditagih.', 'Expected inflow ' + rpj(d90.inflow) + ' from AR and unbilled Billing Ready.')],
        impact: L('Free cash hari ini ' + rpj(tr.free) + '; buffer menipis bila AR lewat jatuh tempo tidak tertagih (skenario worst).', 'Free cash today ' + rpj(tr.free) + '; the buffer thins if overdue AR is not collected (worst case).'),
        rec: L('Percepat penagihan AR lewat jatuh tempo dan cek skenario worst sebelum komitmen baru.', 'Speed up collection of overdue AR and check the worst case before new commitments.'),
        act: { n: L('Buka Forecast Kas', 'Open Cash Forecast'), s: 'CASH-004', q: 'd=90' } }) : '';
      return P.head(t(L('Posisi kas semua rekening, komitmen dan proyeksi hari ini / 7 / 30 / 90 hari.', 'Cash position across all accounts, commitments and the today / 7 / 30 / 90-day projection.')),
          A.pbtn('cash.tx', 'primary', L('Transaksi Kas', 'Cash Transaction'), 'plus', { act: 'newtx' }) + A.btn('ghost', 'Forecast', 'trend', { go: 'CASH-004' }), P.fresh({ kind: 'live', at: tr.asOf, src: L('saldo ledger semua rekening', 'ledger balance of every account') })) +
        tiles + recCard +
        (pend.length ? note(t(L(pend.length + ' transaksi kas menunggu persetujuan orang kedua (' + rpj(sum(pend.map(function (x) { return x.amt; }))) + ').', pend.length + ' cash transactions wait for a second approver (' + rpj(sum(pend.map(function (x) { return x.amt; }))) + ').')) + ' ' + gol('CASH-003', t(L('Lihat', 'View')), null, { st: 'pending' }), 'usercheck', 'warn') : '') +
        grid('ac10-g2', [card(Lx(L('Proyeksi ', 'Projection '), T(hzN)), H.tabs(HZ, hz, 'h', { seg: true, def: 'd30', label: L('Horizon', 'Horizon') }) +
            P.kpis([{ k: L('Masuk', 'In'), v: rpj(per.inflow), icon: 'arrowdn', tone: 'ok' }, { k: L('Keluar', 'Out'), v: rpj(per.outflow), icon: 'arrowup', tone: 'crit' }, { k: L('Saldo akhir', 'Closing'), v: rpj(per.close), icon: 'scale', tone: per.close < 0 ? 'crit' : 'info' }], 'ac10-k3') + hzT, { icon: 'trend', link: ['CASH-004', L('Forecast', 'Forecast')] }),
          card(L('Tren kas', 'Cash trend'), chart, { icon: 'chart' })]) +
        card(L('Rekening', 'Accounts'), accT, { icon: 'building', count: tr.accs.length }) +
        card(L('Komitmen 30 hari', 'Commitments 30 days'), com, { icon: 'clipboard', count: tr.commitLines.length });
    },
    act: { newtx: function () { txDialog(); } }
  };

  /* ================= NP-02 · CASH-002 Account Detail ================= */
  V['CASH-002'] = {
    title: function (rec) { var a = rec && F.cashAcc(rec); return a ? L(a.n, a.n) : null; },
    render: function (c) {
      var a = F.cashAcc(c.rec || 'ACC-01'); if (!a) return A.stateCard('empty', L('Rekening tidak ditemukan.', 'Account not found.'), A.btn('blue', L('Kas & Treasury', 'Cash & Treasury'), 'arrowl', { go: 'CASH-001' }));
      var ms = months(), p = ms.indexOf(c.q.p) >= 0 ? c.q.p : F.curPeriod(), to = p === F.curPeriod() ? today() : F.mEnd(p), mv = F.accMoves(a.id, p + '-01', to), ri = recInfo(a);
      var cur = F.accBal(a.id), opening = F.accOpening(a.id, p);
      var tabs = H.tabs(F.cashAccs().map(function (x) { return [x.id, x.n, x.bank ? 'building' : 'coins']; }), a.id, null, { hf: function (k) { return href('CASH-002', k); }, label: L('Rekening', 'Accounts') });
      var rows = mv.rows.slice().reverse();
      var tbl = P.table(rows, [
        { h: L('Tanggal', 'Date'), v: function (r) { return dtn(r.date); } }, { h: L('Jurnal', 'Journal'), v: function (r) { return P.jvLink(r.jv); } },
        { h: L('Keterangan · sumber', 'Description · source'), v: function (r) { return esc(T(r.desc)) + '<small class="sub5">' + t(F.JV_SRC[r.src.t] || L(r.src.t, r.src.t)) + (r.src.id ? ' · ' + esc(r.src.id) : '') + '</small>'; } },
        { h: L('Masuk', 'In'), cls: 'r num ac10-n', v: function (r) { return r.d ? rp(r.d) : ''; } }, { h: L('Keluar', 'Out'), cls: 'r num ac10-n', v: function (r) { return r.c ? rp(r.c) : ''; } },
        { h: L('Saldo', 'Balance'), cls: 'r num ac10-n', v: function (r) { return '<b>' + rp(r.bal) + '</b>'; } }
      ], function (r) { return { t: dt(r.date) + ' · ' + esc(T(r.desc)), r: (r.d ? '+' : '−') + rpj(r.d || r.c), s: esc(r.jv) + ' · ' + t(L('saldo ', 'balance ')) + rpj(r.bal) }; }, function (r) { return href('ACC-004', r.jv); }, { empty: L('Belum ada mutasi pada periode ini.', 'No movement in this period.') });
      return P.head(t(L('Saldo, rekonsiliasi dan mutasi rekening dari ledger.', 'Balance, reconciliation and movements from the ledger.')),
          A.pbtn('cash.tx', 'primary', L('Transaksi Kas', 'Cash Transaction'), 'plus', { act: 'newtx', val: a.id }) + (a.id === 'ACC-01' && open('CASH-005') ? A.btn('ghost', L('Rekonsiliasi', 'Reconcile'), 'scale', { go: 'CASH-005' }) : ''),
          P.fresh({ kind: 'live', src: L('ledger ' + a.coa, 'ledger ' + a.coa) })) +
        tabs +
        hero({ id: a.id + ' · COA ' + a.coa, icon: a.bank ? 'building' : 'coins', title: esc(a.n), sub: t(F.CASH_TYPES[a.type]) + (a.restricted ? ' · ' + t(a.restricted) : ''), chips: accChip(a),
          facts: [[L('Bank', 'Bank'), esc(a.bank || '—')], [L('No. rekening', 'Account no.'), '<span class="num">' + esc(mask(a.no)) + '</span>'], [L('Mata uang', 'Currency'), 'IDR'], ['PIC', emp(a.pic)],
            [L('Saldo awal ', 'Opening ') + mon(p, false), rp(opening), 'num'], [L('Saldo kini', 'Current balance'), '<b>' + rp(cur) + '</b>', 'num'], [L('Saldo rekonsiliasi', 'Reconciled balance'), rp(ri.bal), 'num'], [L('Rekonsiliasi terakhir', 'Last reconciliation'), dt(ri.at) + (ri.by ? ' · ' + emp(ri.by) : '')]] }) +
        (Math.round(cur - ri.bal) ? note(t(L('Selisih saldo kini vs saldo rekonsiliasi ' + rp(cur - ri.bal) + ': mutasi sesudah ' + dt(ri.at) + ' belum direkonsiliasi.', 'Current vs reconciled balance differs by ' + rp(cur - ri.bal) + ': movements after ' + dt(ri.at) + ' are not reconciled yet.')), 'scale', 'info') : '') +
        card(Lx(L('Mutasi ', 'Movements '), mon(p)), '<div class="fb"><label class="fb-f"><span class="sr">' + t(L('Periode', 'Period')) + '</span><select data-f="p">' + ms.slice().reverse().map(function (m) { return '<option value="' + m + '"' + (m === p ? ' selected' : '') + '>' + esc(mon(m)) + '</option>'; }).join('') + '</select></label></div>' +
          mt([{ n: L('Saldo awal', 'Opening'), v: mv.open }, { n: L('Masuk', 'In'), v: sum(mv.rows.map(function (r) { return r.d; })) }, { n: L('Keluar', 'Out'), v: -sum(mv.rows.map(function (r) { return r.c; })) }, { n: L('Saldo akhir', 'Closing'), v: mv.close, cls: 'tot' }]) + tbl, { icon: 'list', count: rows.length });
    },
    act: { newtx: function (el) { txDialog({ acc: el.getAttribute('data-val') }); } }
  };

  /* ================= NP-02 · CASH-003 Cash Transactions ================= */
  function txDetail(x) {
    var A1 = F.cashAcc(x.acc), B1 = x.to ? F.cashAcc(x.to) : null, need = x.st === 'pending';
    return hero({ id: x.id, icon: (F.TX_TYPES[x.type] || [0, 0, 'coins'])[2], title: esc(T(x.note)), sub: catN(x.cat) + ' · ' + dt(x.date), chips: txType(x) + txSt(x),
      facts: [[L('Jumlah', 'Amount'), '<b>' + rp(x.amt) + '</b>', 'num'], [L('Rekening', 'Account'), P.cashLink(x.acc)], B1 ? [L('Tujuan', 'Destination'), P.cashLink(x.to)] : [L('Akun lawan', 'Counter account'), x.coa ? accL(x.coa) : '—'], ['Cost center', esc(x.cc || '—')],
        [L('Referensi', 'Reference'), esc(x.ref || '—')], [L('Bukti', 'Evidence'), x.ev ? ic('filecheck') + ' ' + esc(x.ev) : '<span class="ac10-neg">' + t(L('tidak ada', 'none')) + '</span>'], [L('Dibuat oleh', 'Created by'), emp(x.pic)], [L('Disetujui', 'Approved by'), x.st === 'posted' ? emp(x.appr) : '—'],
        [L('Jurnal', 'Journal'), x.jv ? P.jvLink(x.jv) : '—']].filter(Boolean),
      extra: (x.reason ? '<p class="sub5 ac10-p">' + t(L('Alasan: ', 'Reason: ')) + esc(T(x.reason)) + '</p>' : '') + (need ? '<div class="ac10-acts">' + (can('cash.approve') ? A.btn('primary', L('Setujui & Posting', 'Approve & Post'), 'checkc', { act: 'appr', val: x.id }) + A.btn('ghost', L('Tolak', 'Reject'), 'xc', { act: 'rej', val: x.id }) : '') + '<span class="sub5">' + t(L('Pembuat (' + F.empName(x.pic) + ') tidak boleh menyetujui sendiri.', 'The maker (' + F.empName(x.pic) + ') cannot approve it.')) + '</span></div>' : '') });
  }
  V['CASH-003'] = {
    title: function (rec) { return rec ? L('Transaksi ' + rec, 'Transaction ' + rec) : null; },
    render: function (c) {
      var c0 = cx(), x0 = c.rec ? F.cashTx(c.rec) : null, all = F.cashList(c0, { acc: c.q.acc || null, type: c.q.type || null, st: c.q.st || null }), pend = F.cashList(c0, { st: 'pending' });
      var defs = [{ k: 'acc', l: L('Rekening', 'Account'), opts: cashOpts() }, { k: 'type', l: L('Jenis', 'Type'), opts: Object.keys(F.TX_TYPES).map(function (k) { return [k, F.TX_TYPES[k][0]]; }) }, { k: 'st', l: 'Status', opts: Object.keys(F.TX_ST).map(function (k) { return [k, F.TX_ST[k][0]]; }) }];
      var inn = sum(all.filter(function (x) { return x.st === 'posted' && txSign(x) > 0; }).map(function (x) { return x.amt; })), out = sum(all.filter(function (x) { return x.st === 'posted' && txSign(x) < 0; }).map(function (x) { return x.amt; }));
      var cols = [
        { h: 'ID', v: function (x) { return '<b class="mono6">' + esc(x.id) + '</b><small class="sub5">' + dtn(x.date) + '</small>'; } }, { h: L('Jenis', 'Type'), v: txType },
        { h: L('Rekening', 'Account'), v: function (x) { return esc(F.cashAcc(x.acc).n) + (x.to ? ' → ' + esc(F.cashAcc(x.to).n) : ''); } },
        { h: L('Kategori · keterangan · bukti', 'Category · description · evidence'), v: function (x) { return catN(x.cat) + '<small class="sub5">' + esc(T(x.note)) + '</small><small class="sub5">' + t(L('Ref ', 'Ref ')) + esc(x.ref || '—') + (x.ev ? ' · ' + t(L('bukti ', 'evidence ')) + esc(x.ev) : '') + '</small>'; } },
        { h: L('Jumlah', 'Amount'), cls: 'r num ac10-n', v: function (x) { var s = txSign(x); return '<b' + (s < 0 ? ' class="ac10-neg"' : '') + '>' + (s > 0 ? '+' : s < 0 ? '−' : '') + rp(x.amt) + '</b>'; } },
        { h: 'Status', v: function (x) { return txSt(x) + (x.jv ? '<small class="sub5">' + esc(x.jv) + '</small>' : ''); } }
      ];
      var pendL = pend.length ? card(L('Menunggu persetujuan orang kedua', 'Waiting for a second approver'), pend.map(txDetail).join(''), { icon: 'usercheck', count: pend.length }) : '';
      return P.head(t(L('Kas masuk/keluar, transfer, setoran, penarikan dan penyesuaian dengan bukti. Kas keluar di atas ' + rp(F.cfg().cashApprove) + ' butuh orang kedua.', 'Cash in/out, transfers, deposits, withdrawals and adjustments with evidence. Cash out above ' + rp(F.cfg().cashApprove) + ' needs a second person.')),
          A.pbtn('cash.tx', 'primary', L('Transaksi Baru', 'New Transaction'), 'plus', { act: 'newtx' }), P.fresh({ kind: 'live', src: L('transaksi kas', 'cash transactions') })) +
        (x0 ? txDetail(x0) + (x0.jv ? card(L('Jejak', 'Trace'), trace(x0.jv), { icon: 'route' }) : '') : c.rec ? A.stateCard('empty', L('Transaksi tidak ditemukan.', 'Transaction not found.')) : '') +
        (x0 && x0.st === 'pending' ? '' : pendL) +
        A.filters(defs, { force: true }) +
        P.kpis([{ k: L('Transaksi', 'Transactions'), v: n0(all.length), icon: 'list' }, { k: L('Masuk (posted)', 'In (posted)'), v: rpj(inn), icon: 'arrowdn', tone: 'ok' }, { k: L('Keluar (posted)', 'Out (posted)'), v: rpj(out), icon: 'arrowup', tone: 'crit' },
          { k: L('Menunggu', 'Pending'), v: n0(pend.length), s: rpj(sum(pend.map(function (x) { return x.amt; }))), icon: 'usercheck', tone: pend.length ? 'appr' : '', go: 'CASH-003', q: { st: 'pending' } }]) +
        card(L('Transaksi', 'Transactions'), P.table(all, cols, function (x) { var s = txSign(x); return { t: esc(x.id) + ' · ' + dt(x.date), r: (s > 0 ? '+' : s < 0 ? '−' : '') + rpj(x.amt), s: catN(x.cat) + ' · ' + esc(T(x.note)), chip: txSt(x) }; }, function (x) { return href('CASH-003', x.id); }), { icon: 'swap', count: all.length });
    },
    act: {
      newtx: function () { txDialog(); },
      appr: function (el) {
        var id = el.getAttribute('data-val'), x = F.cashTx(id);
        P.confirmDlg({ title: L('Setujui ' + id, 'Approve ' + id), icon: 'checkc', ok: L('Setujui & Posting', 'Approve & Post'), sub: t(L(T(F.TX_TYPES[x.type][0]) + ' ' + rp(x.amt) + ' dari ' + F.cashAcc(x.acc).n + '. Jurnal diposting setelah disetujui.', F.TX_TYPES[x.type][0][1] + ' ' + rp(x.amt) + ' from ' + F.cashAcc(x.acc).n + '. The journal posts on approval.')),
          fn: function () { return F.approveCash(cx(), id, true); }, done: L(id + ' disetujui dan diposting.', id + ' approved and posted.') });
      },
      rej: function (el) { var id = el.getAttribute('data-val'); P.reasonDlg({ title: L('Tolak ' + id, 'Reject ' + id), icon: 'xc', ok: L('Tolak', 'Reject'), fn: function (r) { return F.approveCash(cx(), id, false, r); }, done: L(id + ' ditolak.', id + ' rejected.'), tone: 'warn' }); }
    }
  };

  /* ================= NP-02 · CASH-004 Cash Forecast ================= */
  var FC_SRC = { ar: [L('Penagihan AR', 'AR expected collection'), 'in'], unb: [L('Billing Ready belum ditagih', 'Unbilled Billing Ready'), 'in'], payroll: [L('Payroll & BPJS', 'Payroll & BPJS'), 'out'], tax: [L('Pajak', 'Tax'), 'out'],
    util: [L('Utilitas', 'Utilities'), 'out'], sup: [L('Supplier (AP & PO)', 'Suppliers (AP & PO)'), 'out'], capex: ['Capex', 'out'], recur: [L('Biaya rutin lain (sewa, angsuran, BBM)', 'Other recurring (rent, loan, fuel)'), 'out'] };
  function fcSrc(x, dir) {
    if (dir === 'in') return x.k === 'unb' ? 'unb' : 'ar';
    if (x.k === 'rec') return { payroll: 'payroll', bpjs: 'payroll', tax: 'tax', elec: 'util', water: 'util', chem: 'sup' }[x.cat] || 'recur';
    if (x.k === 'po') return x.capex ? 'capex' : 'sup';
    return { payroll: 'payroll', tax: 'tax', utility: 'util', capex: 'capex' }[x.cat] || 'sup';
  }
  function fcLink(x) { return x.k === 'ar' ? P.invLink(x.id) : x.k === 'ap' ? P.expLink(x.id) : x.k === 'po' ? P.poLink(x.id) : x.k === 'unb' ? gol('AR-001', t(L('Billing Ready', 'Billing Ready'))) : '<span class="sub5">' + t(L('rutin', 'recurring')) + '</span>'; }
  V['CASH-004'] = {
    render: function (c) {
      var d = [7, 30, 90].indexOf(+c.q.d) >= 0 ? +c.q.d : 30, f = F.forecast(cx(), d); if (!f) return A.stateCard('noperm', F.MSG.noperm);
      var cf = F.cfg().coll, win = function (x) { return x.date <= f.to; };
      var grp = {}; Object.keys(FC_SRC).forEach(function (k) { grp[k] = 0; });
      f.inflow.filter(win).forEach(function (x) { grp[fcSrc(x, 'in')] += x.amt; }); f.outflow.filter(win).forEach(function (x) { grp[fcSrc(x, 'out')] += x.amt; });
      function sc(k, n, tn) { var s = f[k]; return '<div class="ac10-sc ac10-sc-' + k + '"><h3>' + t(n) + '</h3><dl><div><dt>' + t(L('Kas awal', 'Opening')) + '</dt><dd class="num">' + rpj(f.start) + '</dd></div><div><dt>' + t(L('Masuk', 'In')) + '</dt><dd class="num">+' + rpj(s.inflow) + '</dd></div><div><dt>' + t(L('Keluar', 'Out')) + '</dt><dd class="num">−' + rpj(s.outflow) + '</dd></div><div class="tot"><dt>' + t(L('Saldo akhir', 'Closing')) + '</dt><dd class="num' + (s.close < 0 ? ' ac10-neg' : '') + '">' + rpj(s.close) + '</dd></div></dl>' + A.chip(tn, k === 'base' ? L('Paling mungkin', 'Most likely') : k === 'best' ? L('Optimis', 'Optimistic') : L('Konservatif', 'Conservative')) + '</div>'; }
      // Base daily closing balance over the horizon.
      var step = d <= 7 ? 1 : d <= 30 ? 3 : 7, pts = [], lab = [];
      for (var i = 0; i <= d; i += step) { var day = F.addDays(f.from, i); pts.push(f.start + sum(f.inflow.filter(function (x) { return x.date <= day; }).map(function (x) { return x.amt; })) - sum(f.outflow.filter(function (x) { return x.date <= day; }).map(function (x) { return x.amt; }))); lab.push(day.slice(8) + '/' + day.slice(5, 7)); }
      var lcols = [
        { h: L('Tanggal', 'Date'), v: function (x) { return '<span class="ac10-nw">' + dt(x.date) + '</span>'; } },
        { h: L('Keterangan', 'Description'), v: function (x) { return esc(T(x.n)) + ' <small class="sub5">' + t(FC_SRC[fcSrc(x, x._dir)][0]) + ' · ' + fcLink(x) + (x.od > 0 ? ' · ' + t(L('lewat ' + x.od + ' hari', x.od + ' days overdue')) : '') + '</small>'; } },
        { h: L('Nilai', 'Amount'), cls: 'r num ac10-n', v: function (x) { return '<span class="ac10-nw">' + (x._dir === 'in' ? '+' : '−') + rpj(x.amt) + '</span>'; } }
      ];
      var ins = f.inflow.filter(win).map(function (x) { return Object.assign({ _dir: 'in' }, x); }), outs = f.outflow.filter(win).map(function (x) { return Object.assign({ _dir: 'out' }, x); });
      function lcard(r) { return { t: dt(r.date) + ' · ' + esc(T(r.n)), r: (r._dir === 'in' ? '+' : '−') + rpj(r.amt), s: t(FC_SRC[fcSrc(r, r._dir)][0]) }; }
      return P.head(t(L('Best / base / worst dari AR, AP, payroll, pajak, utilitas, supplier, capex dan biaya rutin. Semua asumsi terlihat dan bisa diubah (tercatat di audit).', 'Best / base / worst from AR, AP, payroll, tax, utilities, suppliers, capex and recurring cost. Every assumption is visible and editable (audited).')),
          (can('cfo.th') ? A.btn('ghost', L('Ubah Asumsi', 'Edit Assumptions'), 'edit', { act: 'cfg' }) : '') + A.btn('ghost', L('Kas & Treasury', 'Cash & Treasury'), 'coins', { go: 'CASH-001' }), P.fresh({ kind: 'mixed', src: L('AR, AP, PO, biaya rutin + asumsi', 'AR, AP, POs, recurring cost + assumptions') })) +
        H.tabs([['7', L('7 hari', '7 days')], ['30', L('30 hari', '30 days')], ['90', L('90 hari', '90 days')]], String(d), 'd', { seg: true, def: '30', label: L('Horizon', 'Horizon') }) +
        '<div class="ac10-scs">' + sc('worst', 'Worst', 'crit') + sc('base', 'Base', 'info') + sc('best', 'Best', 'ok') + '</div>' +
        grid('g21-10', [card(Lx(L('Saldo proyeksi base ', 'Base projected balance '), dt(f.from) + ' – ' + dt(f.to)), A.lineChart([{ n: 'Base', v: pts }], lab, { h: 210, fmt: rpj, fmtAx: H.rpAx, label: 'Base' }), { icon: 'trend' }),
          card(L('Asumsi', 'Assumptions'), chipsRow(A.chip('appr', L('ASUMSI — bukan fakta', 'ASSUMPTIONS — not facts'), 'bulb')) + '<ul class="ac10-as">' + f.assume.map(function (a) { return '<li>' + t(a) + '</li>'; }).join('') + '</ul>' +
            kv([[L('Worst: keterlambatan AR', 'Worst: AR delay'), cf.worstDelay + ' ' + t(L('hari', 'days'))], [L('Worst: AR tertagih', 'Worst: AR collected'), pct(cf.worstShare * 100, 0)], [L('Best: AR tertagih', 'Best: AR collected'), pct(cf.bestShare * 100, 0)], [L('Biaya rutin best / worst', 'Recurring cost best / worst'), pct(cf.costBest * 100, 0) + ' / +' + pct(cf.costWorst * 100, 0)]]), { icon: 'bulb' })]) +
        card(L('Sumber arus kas (base, ' + d + ' hari)', 'Cash flow sources (base, ' + d + ' days)'), mt(Object.keys(FC_SRC).map(function (k) { return { n: FC_SRC[k][0], v: FC_SRC[k][1] === 'in' ? grp[k] : -grp[k], cls: grp[k] ? '' : 'ac10-ln' }; }).concat([{ n: L('Bersih', 'Net'), v: f.base.inflow - f.base.outflow, cls: 'tot' + (f.base.inflow - f.base.outflow < 0 ? ' neg' : '') }])), { icon: 'layers' }) +
        grid('ac10-g2', [card(L('Perkiraan masuk', 'Expected inflow'), P.table(ins, lcols, lcard), { icon: 'arrowdn', count: ins.length }), card(L('Perkiraan keluar', 'Expected outflow'), P.table(outs, lcols, lcard), { icon: 'arrowup', count: outs.length })]);
    },
    act: {
      cfg: function () {
        var cf = F.cfg().coll;
        dlg({ title: L('Ubah asumsi forecast', 'Edit forecast assumptions'), icon: 'edit', ok: L('Simpan', 'Save'),
          sub: t(L('Asumsi mempengaruhi skenario best dan worst. Nilai lama dan baru tercatat di audit.', 'Assumptions drive the best and worst cases. Old and new values are audited.')),
          body: '<div class="ac10-dg">' + fld(L('Worst: AR lewat jatuh tempo mundur (hari)', 'Worst: overdue AR slips (days)'), inp('worstDelay', cf.worstDelay, { num: true })) + fld(L('Worst: AR tertagih (%)', 'Worst: AR collected (%)'), inp('worstShare', Math.round(cf.worstShare * 100), { num: true })) +
            fld(L('Best: AR tertagih (%)', 'Best: AR collected (%)'), inp('bestShare', Math.round(cf.bestShare * 100), { num: true })) + fld(L('Best: perubahan biaya rutin (%)', 'Best: recurring cost change (%)'), inp('costBest', Math.round(cf.costBest * 100), { num: true })) +
            fld(L('Worst: perubahan biaya rutin (%)', 'Worst: recurring cost change (%)'), inp('costWorst', Math.round(cf.costWorst * 100), { num: true })) + '</div>',
          onOk: function (v) {
            function n(x) { var y = Number(String(x).replace(',', '.')); return isNaN(y) ? null : y; }
            var o = { worstDelay: n(v.worstDelay), worstShare: n(v.worstShare) / 100, bestShare: n(v.bestShare) / 100, costBest: n(v.costBest) / 100, costWorst: n(v.costWorst) / 100 };
            if ([o.worstDelay, o.worstShare, o.bestShare, o.costBest, o.costWorst].some(function (x) { return x == null || isNaN(x); }) || o.worstShare < 0 || o.worstShare > 1 || o.bestShare < 0 || o.bestShare > 1.5 || o.worstDelay < 0) return F.MSG.invalid;
            var r = F.setForecastCfg(cx(), o); if (!r.ok) return r.msg; after(L('Asumsi forecast disimpan.', 'Forecast assumptions saved.')); return true;
          } });
      }
    }
  };

  /* ================= NP-02 · CASH-005 Bank Reconciliation ================= */
  var REC_ST = { matched: [L('Cocok', 'Matched'), 'ok'], unmatched: [L('Belum Cocok', 'Unmatched'), 'warn'], diff: [L('Selisih', 'Difference'), 'crit'], review: [L('Review', 'Review'), 'appr'] };
  V['CASH-005'] = {
    render: function (c) {
      var b = F.bankRecon(cx(), 'ACC-01'); if (!b) return A.stateCard('noperm', F.MSG.noperm);
      var a = b.acc, last = b.stmt.length ? b.stmt[b.stmt.length - 1].date : today(), canDo = can('rec.do');
      var cols = [
        { h: L('Rekening koran', 'Bank statement'), v: function (x) { return '<b class="mono6">' + esc(x.id) + '</b> <small class="sub5">' + dtn(x.date) + '</small><small class="sub5">' + esc(x.desc) + '</small>'; } },
        { h: L('Nilai bank', 'Bank amount'), cls: 'r num ac10-n', v: function (x) { return '<b' + (x.amt < 0 ? ' class="ac10-neg"' : '') + '>' + rp(x.amt) + '</b>'; } },
        { h: L('Transaksi sistem', 'System transaction'), v: function (x) { return x.ref ? recRef(x.ref) : '<span class="sub5">' + t(L('tidak ada di sistem', 'not in the system')) + '</span>'; } },
        { h: L('Nilai sistem · selisih', 'System amount · difference'), cls: 'r num ac10-n', v: function (x) { return x.sys == null ? '—' : rp(x.sys) + (Math.round(x.amt - x.sys) ? '<small class="sub5 ac10-neg">' + t(L('selisih ', 'diff ')) + rp(x.amt - x.sys) + '</small>' : ''); } },
        { h: 'Status', v: function (x) { return P.stc(REC_ST, x.st) + (x.note ? '<small class="sub5">' + esc(x.note.note) + ' · ' + emp(x.note.by) + '</small>' : ''); } },
        { h: L('Aksi', 'Action'), v: function (x) {
          if (!canDo || b.done.at) return '';
          var o = '';
          if (x.st === 'unmatched' && !x.ref && can('cash.tx')) o += A.btn('primary', L('Bukukan', 'Book'), 'plus', { act: 'book', val: x.id, cls: 'btn-sm' });
          if (x.st === 'unmatched' || x.st === 'diff') o += A.btn('ghost', L('Review', 'Review'), 'eye', { act: 'mark', val: x.id, cls: 'btn-sm' });
          return o;
        } }
      ];
      function recRef(ref) { var tx = F.cashTx(ref), py = payRec(ref); return tx ? gol('CASH-003', mono(ref), ref) : py ? gol('AR-003', mono(ref), py.inv) : mono(ref); }
      var sysT = P.table(b.sysOnly, [
        { h: L('Tanggal', 'Date'), v: function (r) { return dtn(r.date); } }, { h: L('Jurnal', 'Journal'), v: function (r) { return P.jvLink(r.jv); } }, { h: L('Keterangan', 'Description'), v: function (r) { return esc(T(r.desc)); } },
        { h: L('Nilai', 'Amount'), cls: 'r num ac10-n', v: function (r) { return rp(r.d - r.c); } }
      ], function (r) { return { t: dt(r.date) + ' · ' + esc(r.jv), r: rpj(r.d - r.c), s: esc(T(r.desc)) }; }, null, { empty: L('Semua transaksi sistem ada di rekening koran.', 'Every system transaction is on the statement.') });
      var ready = !b.counts.unmatched && !b.counts.diff;
      return P.head(t(L('Rekening koran vs transaksi sistem bulan berjalan: Cocok, Belum Cocok, Selisih, Review. Rekening lain direkonsiliasi lewat hitung fisik di Pusat Rekonsiliasi.', 'Bank statement vs system transactions this month: Matched, Unmatched, Difference, Review. Other accounts are reconciled by physical count in the Reconciliation Centre.')),
          (b.done.at ? A.chip('ok', L('Selesai ' + b.done.at, 'Completed ' + b.done.at), 'checkc') : A.pbtn('rec.do', ready ? 'primary' : 'ghost', L('Selesaikan Rekonsiliasi', 'Complete Reconciliation'), 'checkc', { act: 'done' })) + A.btn('ghost', esc(a.n), 'building', { go: 'CASH-002', rec: a.id }),
          P.fresh({ kind: 'snapshot', at: last + ' 23:59', src: L('rekening koran ' + a.bank + ' ' + mask(a.no) + ' diimpor', a.bank + ' ' + mask(a.no) + ' statement imported') })) +
        P.deskOnly() +
        P.kpis([{ k: L('Saldo rekening koran', 'Statement balance'), v: rpj(b.stmtEnd), s: dt(last), icon: 'file' }, { k: L('Saldo buku', 'Book balance'), v: rpj(b.book), s: accN(a.coa), icon: 'list', go: 'ACC-003', q: { acc: a.coa } },
          { k: L('Selisih', 'Difference'), v: rpj(b.diff), s: t(L('rekening koran − buku', 'statement − book')), icon: 'scale', tone: b.diff ? 'crit' : 'ok' },
          { k: L('Cocok', 'Matched'), v: b.counts.matched + ' / ' + b.stmt.length, icon: 'checkc', tone: 'ok' }, { k: L('Belum cocok', 'Unmatched'), v: n0(b.counts.unmatched), icon: 'alert', tone: b.counts.unmatched ? 'warn' : '' },
          { k: L('Selisih nilai', 'Amount differences'), v: n0(b.counts.diff), s: t(L('review ', 'review ')) + n0(b.counts.review), icon: 'xc', tone: b.counts.diff ? 'crit' : b.counts.review ? 'appr' : '' }]) +
        (b.done.at ? note(t(L('Rekonsiliasi diselesaikan ' + b.done.at + ' oleh ' + F.empName(b.done.by) + '.', 'Reconciliation completed ' + b.done.at + ' by ' + F.empName(b.done.by) + '.')), 'checkc', 'ok')
          : note(t(ready ? L('Semua baris cocok atau sudah direview: rekonsiliasi siap diselesaikan.', 'Every line is matched or reviewed: the reconciliation can be completed.') : L('Bukukan baris bank yang belum ada di sistem (biaya bank, bunga) atau tandai review dengan catatan sebelum menyelesaikan.', 'Book bank lines missing from the system (fees, interest) or mark them for review with a note before completing.')), ready ? 'checkc' : 'info', ready ? 'ok' : 'info')) +
        card(Lx(L('Rekening koran ', 'Bank statement '), a.n), P.table(b.stmt, cols, function (x) { return { t: esc(x.id) + ' · ' + esc(x.desc), r: rpj(x.amt), s: dt(x.date) + (x.ref ? ' · ' + esc(x.ref) : ''), chip: P.stc(REC_ST, x.st) }; }), { icon: 'scale', count: b.stmt.length }) +
        card(L('Di sistem, belum di rekening koran', 'In the system, not on the statement'), sysT, { icon: 'list', count: b.sysOnly.length }) +
        card(L('Riwayat audit', 'Audit history'), audits(null, 'RECON'), { icon: 'history' });
    },
    act: {
      book: function (el) {
        var id = el.getAttribute('data-val'), x = by(F.bankRecon(cx(), 'ACC-01').stmt, 'id', id);
        dlg({ title: L('Bukukan ' + id, 'Book ' + id), icon: 'plus', ok: L('Bukukan', 'Book'), sub: '<b>' + esc(x.desc) + '</b> · ' + rp(x.amt) + ' · ' + dt(x.date) + '<br>' + t(L('Dicatat sebagai transaksi kas dengan bukti rekening koran, lalu otomatis cocok.', 'Recorded as a cash transaction with the statement as evidence, then matched automatically.')),
          body: fld(L('Akun lawan', 'Counter account'), sel('coa', coaOpts(function (a) { return CASH_COA.indexOf(a.c) < 0; }), x.amt < 0 ? '7200' : '7100'), { req: true, wide: true }),
          onOk: function (v) { var r = F.reconBook(cx(), 'ACC-01', id, v.coa); if (!r.ok) return r.msg; after(L(id + ' dibukukan sebagai ' + r.tx.id + '.', id + ' booked as ' + r.tx.id + '.')); return true; } });
      },
      mark: function (el) { var id = el.getAttribute('data-val'); P.reasonDlg({ title: L('Review ' + id, 'Review ' + id), icon: 'eye', ok: L('Tandai Review', 'Mark for Review'), label: L('Catatan review', 'Review note'), fn: function (n) { return F.reconMark(cx(), 'ACC-01', id, n); }, done: L(id + ' ditandai review.', id + ' marked for review.') }); },
      done: function () { P.confirmDlg({ title: L('Selesaikan rekonsiliasi bank', 'Complete bank reconciliation'), icon: 'checkc', ok: L('Selesaikan', 'Complete'), sub: t(L('Status rekonsiliasi dan pembuatnya tercatat di audit dan checklist closing.', 'The reconciliation status and who completed it are recorded in the audit and the close checklist.')), fn: function () { return F.reconComplete(cx(), 'ACC-01'); }, done: L('Rekonsiliasi bank selesai.', 'Bank reconciliation completed.') }); }
    }
  };

  /* ================= NP-03 · Billing & receivables helpers ================= */
  function invSt(iv) { return P.stc(F.INV_ST, F.invSt(iv)); }
  function brSt(b) { return P.stc(F.BR_ST, b.st); }
  function qtyU(q, u) { return n0(q, q % 1 ? 1 : 0) + ' ' + esc(u || ''); }
  function clLink(id) { return gol('CLIENT-002', cname(id), id); }
  function picOpts() { return ['EMP-030', 'EMP-040', 'EMP-041', 'EMP-050'].map(function (id) { return [id, F.empName(id)]; }); }
  function bankOpts() { return F.cashAccs().filter(function (a) { return !a.restricted; }).map(function (a) { return [a.id, a.n + (a.no ? ' · ' + mask(a.no) : '')]; }); }
  // Billing Ready → Phase 9 billing → delivery → order → client.
  function brTrace(b) {
    return H.drill([{ i: 'inbox', l: L('Billing Ready', 'Billing Ready'), s: b.id, go: 'AR-001', rec: b.id }, b.bil ? { i: 'file', l: L('Billing Fase 9', 'Phase 9 billing'), s: b.bil } : null,
      b.dlv ? { i: 'truck', l: L('Delivery & POD', 'Delivery & POD'), s: b.dlv, go: 'DISP-002', rec: b.dlv } : null, b.ord ? { i: 'clipboard', l: 'Order', s: b.ord, go: 'ORDER-002', rec: b.ord } : null,
      { i: 'building', l: F.clientName(b.cl), s: b.cl, go: 'CLIENT-002', rec: b.cl }].filter(Boolean));
  }
  function payDialog(iv) {
    var openAmt = F.openOf(iv);
    dlg({ title: L('Catat pembayaran ' + iv.id, 'Record payment ' + iv.id), icon: 'coins', ok: L('Catat Pembayaran', 'Record Payment'),
      sub: cname(iv.cl) + ' · ' + t(L('sisa tagihan ', 'open balance ')) + '<b class="num">' + rp(openAmt) + '</b> · ' + t(L('pembayaran sebagian diperbolehkan, tidak boleh melebihi sisa.', 'partial payment allowed, never above the open balance.')),
      body: '<div class="ac10-dg">' + fld(L('Jumlah (Rp)', 'Amount (Rp)'), inp('amt', openAmt, { num: true }), { req: true }) + fld(L('Tanggal terima', 'Date received'), inp('date', today(), { type: 'date' }), { req: true }) +
        fld(L('Masuk ke rekening', 'Into account'), sel('acc', bankOpts(), 'ACC-01'), { req: true }) + fld(L('Referensi bank', 'Bank reference'), inp('ref', '', { ph: L('mis. TRF 2026-10-06', 'e.g. TRF 2026-10-06') })) + '</div>',
      onOk: function (v) {
        var r = F.recordPayment(cx(), iv.id, { amt: amtIn(v.amt), date: v.date, acc: v.acc, ref: v.ref });
        if (!r.ok) return r.msg;
        after(r.st === 'paid' ? L(iv.id + ' lunas. Jurnal ' + r.pay.jv + '.', iv.id + ' paid in full. Journal ' + r.pay.jv + '.') : L('Pembayaran sebagian ' + rp(r.pay.amt) + ' dicatat; sisa ' + rp(F.openOf(iv)) + '.', 'Partial payment ' + rp(r.pay.amt) + ' recorded; ' + rp(F.openOf(iv)) + ' left.'));
        return true;
      } });
  }
  function invTotals(iv) {
    return mt([{ n: L('Subtotal (dari Billing Ready)', 'Subtotal (from Billing Ready)'), v: iv.sub }, iv.sur ? { n: L('Surcharge', 'Surcharge'), v: iv.sur } : null,
      { n: L('Diskon', 'Discount'), v: iv.disc ? -iv.disc : 0, sub: iv.discWhy ? t(L('Alasan: ', 'Reason: ')) + esc(T(iv.discWhy)) : '' }, { n: L('PPN ' + F.cfg().ppn + '%', 'VAT ' + F.cfg().ppn + '%'), v: iv.tax, sub: t(L('(subtotal + surcharge − diskon) × ', '(subtotal + surcharge − discount) × ')) + F.cfg().ppn + '%' },
      { n: L('Total invoice', 'Invoice total'), v: iv.total, cls: 'tot' }].concat(['draft', 'review', 'approved', 'cancelled'].indexOf(iv.st) < 0 ? [{ n: L('Sudah dibayar', 'Paid'), v: -F.paidOf(iv) }, { n: L('Sisa tagihan', 'Open balance'), v: F.openOf(iv), cls: 'tot' + (F.invSt(iv) === 'overdue' ? ' neg' : '') }] : []));
  }
  function invLines(iv) {
    return P.table(iv.lines, [
      { h: L('Layanan · property', 'Service · property'), v: function (l) { return esc(T(l.desc)) + (l.date ? '<small class="sub5">' + dt(l.date) + '</small>' : ''); } },
      { h: L('Jumlah', 'Qty'), cls: 'r num ac10-n', v: function (l) { return qtyU(l.qty, l.unit); } }, { h: L('Tarif', 'Rate'), cls: 'r num ac10-n', v: function (l) { return rp(l.rate) + (l.rc ? '<small class="sub5">' + esc(l.rc) + '</small>' : ''); } },
      { h: L('Nilai', 'Amount'), cls: 'r num ac10-n', v: function (l) { return '<b>' + rp(l.amt) + '</b>'; } },
      { h: L('Sumber', 'Source'), v: function (l) { return l.br ? gol('AR-001', mono(l.br), l.br) : '<span class="sub5">' + t(L('migrasi', 'migrated')) + '</span>'; } }
    ], function (l) { return { t: esc(T(l.desc)), r: rpj(l.amt), s: qtyU(l.qty, l.unit) + ' × ' + rp(l.rate) }; });
  }
  function invLog(iv) {
    var lg = (iv.log || []).slice().reverse();
    if (!lg.length) return A.empty(L('Invoice migrasi: riwayat sebelum Fase 10 tidak tersedia.', 'Migrated invoice: history before Phase 10 is not available.'));
    return '<ol class="ac10-log">' + lg.map(function (l) { return '<li><span class="ac10-log-t num">' + esc(l.at) + '</span><b>' + t((F.INV_ST[l.to] || [L(l.to, l.to)])[0]) + '</b><span>' + emp(l.by) + (l.amt ? ' · ' + rp(l.amt) : '') + (l.reason ? ' · ' + esc(T(l.reason)) : '') + '</span></li>'; }).join('') + '</ol>';
  }
  function invFacts(iv) {
    var s0 = F.invSt(iv), od = iv.due ? F.dayDiff(iv.due, today()) : null;
    return [[L('Klien', 'Client'), clLink(iv.cl)], [L('Property', 'Property'), iv.prop ? pname(iv.prop) : (iv.props || []).map(function (p) { return pname(p); }).join(', ') || '—'], [L('Kontrak', 'Contract'), esc(iv.ctr || '—')], ['PO', esc(iv.po || '—')],
      [L('Periode layanan', 'Service period'), esc(iv.period || '—')], [L('Terbit', 'Issued'), iv.issued ? dt(iv.issued) : '—'], [L('Jatuh tempo', 'Due'), iv.due ? dt(iv.due) + (s0 === 'overdue' ? ' <b class="ac10-neg">+' + od + ' ' + t(L('hari', 'd')) + '</b>' : '') : t(L('termin ', 'terms ')) + iv.terms + ' ' + t(L('hari', 'days'))],
      [L('Total', 'Total'), '<b>' + rp(iv.total) + '</b>', 'num']];
  }
  // Workflow buttons by status. where: 'b' builder (AR-002) or 'd' detail (AR-003).
  function invActs(iv, where) {
    var s0 = F.invSt(iv), o = '';
    if (iv.st === 'draft' && where === 'b') o += A.pbtn('ar.build', 'primary', L('Ajukan Review', 'Submit for Review'), 'arrow', { act: 'submit', val: iv.id }) + A.pbtn('ar.build', 'ghost', L('No. PO', 'PO No.'), 'hash', { act: 'po', val: iv.id }) + A.pbtn('ar.build', 'ghost', L('Diskon', 'Discount'), 'percent', { act: 'disc', val: iv.id });
    if (iv.st === 'draft' && where === 'd' && open('AR-002')) o += A.btn('primary', L('Buka Invoice Builder', 'Open Invoice Builder'), 'invoice', { go: 'AR-002', rec: iv.id });
    if (iv.st === 'review') o += A.pbtn('ar.approve', 'primary', L('Setujui', 'Approve'), 'checkc', { act: 'appr', val: iv.id }) + A.pbtn('ar.approve', 'ghost', L('Kembalikan', 'Return'), 'arrowl', { act: 'ret', val: iv.id });
    if (iv.st === 'approved') o += A.pbtn('ar.issue', 'primary', L('Terbitkan Invoice', 'Issue Invoice'), 'sign', { act: 'issue', val: iv.id });
    if (['issued', 'partial', 'overdue'].indexOf(s0) >= 0) o += A.pbtn('ar.pay', 'primary', L('Catat Pembayaran', 'Record Payment'), 'coins', { act: 'pay', val: iv.id }) + (open('AR-005') ? A.btn('ghost', 'Collection', 'headset', { go: 'AR-005', rec: iv.id }) : '');
    if (iv.st !== 'cancelled' && s0 !== 'paid' && !F.paidOf(iv) && (iv.st !== 'draft' || where === 'b')) o += A.pbtn('ar.issue', 'ghost', iv.st === 'draft' || iv.st === 'review' || iv.st === 'approved' ? L('Batalkan Draft', 'Cancel Draft') : L('Batalkan (Jurnal Balik)', 'Cancel (Reversal)'), 'ban', { act: 'cancel', val: iv.id });
    o += A.btn('ghost', L('Cetak Invoice', 'Print Invoice'), 'print', { act: 'print', val: iv.id });
    return o;
  }
  function needSecond(iv) {
    if (!F.invNeedsSecond(iv)) return note(t(L('Total di bawah ' + rp(F.cfg().arApprove) + ' tanpa diskon manual: Finance boleh menyetujui sendiri.', 'Total below ' + rp(F.cfg().arApprove) + ' with no manual discount: Finance may approve it.')), 'checkc', 'info');
    return note(t(L('Butuh persetujuan orang kedua: ' + (iv.manual ? 'ada diskon manual' : 'total di atas ' + rp(F.cfg().arApprove)) + '. Pembuat (' + F.empName(iv.by) + ') tidak boleh menyetujui sendiri.', 'Needs a second approver: ' + (iv.manual ? 'manual discount' : 'total above ' + rp(F.cfg().arApprove)) + '. The maker (' + F.empName(iv.by) + ') cannot approve it.')), 'usercheck', 'warn');
  }
  var STEPS = [['draft', L('Draft', 'Draft')], ['review', 'Review'], ['approved', L('Disetujui', 'Approved')], ['issued', L('Terbit', 'Issued')], ['paid', L('Lunas', 'Paid')]];
  function invSteps(iv) {
    var s0 = F.invSt(iv), idx = { draft: 0, review: 1, approved: 2, issued: 3, partial: 3, overdue: 3, paid: 4, cancelled: -1 }[s0];
    if (s0 === 'cancelled') return chipsRow(A.chip('mute', L('Dibatalkan: ' + T(iv.cancelWhy || ''), 'Cancelled: ' + (Array.isArray(iv.cancelWhy) ? iv.cancelWhy[1] : iv.cancelWhy || '')), 'ban'));
    return '<ol class="sp8 ac10-sp">' + STEPS.map(function (x, i) { var c = i < idx || (i === idx && s0 === 'paid') ? 'done' : i === idx ? 'now' : ''; return '<li class="' + c + '"><span>' + (c === 'done' ? ic('check') : i + 1) + '</span><b>' + t(x[1]) + '</b></li>'; }).join('') + '</ol>';
  }

  /* ---------- Printable invoice (logo from assets/brand only) ---------- */
  function invDoc(iv) {
    var cl = F.CM && F.CM.client(iv.cl) || {}, co = F.D.COMPANY, bank = F.cashAcc('ACC-01'), s0 = F.invSt(iv), ref = 'JFRESH|INV|' + iv.id + '|' + iv.total;
    var qr = A.P9 && A.P9.qr ? A.P9.qr(ref) : '';
    var draft = ['draft', 'review', 'approved'].indexOf(iv.st) >= 0;
    var rows = iv.lines.map(function (l) { return '<tr><td>' + esc(T(l.desc)) + (l.br ? '<small>' + esc(l.br) + (l.date ? ' · ' + esc(l.date) : '') + '</small>' : '') + '</td><td class="r num">' + qtyU(l.qty, l.unit) + '</td><td class="r num">' + rp(l.rate) + '</td><td class="r num">' + rp(l.amt) + '</td></tr>'; }).join('');
    var tot = [[L('Subtotal', 'Subtotal'), iv.sub], iv.sur ? [L('Surcharge', 'Surcharge'), iv.sur] : null, iv.disc ? [L('Diskon', 'Discount'), -iv.disc] : null, [L('PPN ' + F.cfg().ppn + '%', 'VAT ' + F.cfg().ppn + '%'), iv.tax], [L('TOTAL', 'TOTAL'), iv.total, 1]]
      .concat(!draft && F.paidOf(iv) ? [[L('Sudah dibayar', 'Paid'), -F.paidOf(iv)], [L('Sisa tagihan', 'Balance due'), F.openOf(iv), 1]] : []).filter(Boolean);
    return '<article class="doc9-p ac10-doc">' + (draft ? '<div class="ac10-wm">DRAFT</div>' : s0 === 'cancelled' ? '<div class="ac10-wm">' + t(L('DIBATALKAN', 'CANCELLED')) + '</div>' : s0 === 'paid' ? '<div class="ac10-wm ac10-wm-ok">' + t(L('LUNAS', 'PAID')) + '</div>' : '') +
      '<header><img src="../assets/brand/jfresh-logo.png" alt="J\'Fresh Laundry" width="605" height="373"><div><h2>INVOICE</h2><p>' + esc(co.n) + ' · ' + esc(co.addr) + '<br>NPWP ' + esc(co.npwp) + '</p></div>' + qr + '</header>' +
      '<div class="ac10-dh"><div><h4>' + t(L('Ditagihkan kepada', 'Bill to')) + '</h4><b>' + esc(cl.legal || F.clientName(iv.cl)) + '</b><p>' + esc(cl.bill || cl.addr || '') + (cl.city ? ', ' + esc(cl.city) : '') + '</p>' + (cl.tax ? '<p>NPWP ' + esc(cl.tax) + '</p>' : '') + '</div>' +
      '<table class="doc9-t"><tbody><tr><th>' + t(L('No. invoice', 'Invoice no.')) + '</th><td><b class="mono6">' + esc(iv.id) + '</b></td></tr><tr><th>' + t(L('Tanggal', 'Date')) + '</th><td>' + (iv.issued ? dt(iv.issued) : '—') + '</td></tr><tr><th>' + t(L('Jatuh tempo', 'Due date')) + '</th><td>' + (iv.due ? dt(iv.due) : t(L(iv.terms + ' hari setelah terbit', iv.terms + ' days after issue'))) + '</td></tr>' +
      '<tr><th>' + t(L('Kontrak', 'Contract')) + '</th><td>' + esc(iv.ctr || '—') + '</td></tr><tr><th>PO</th><td>' + esc(iv.po || '—') + '</td></tr><tr><th>' + t(L('Periode', 'Period')) + '</th><td>' + esc(iv.period || '—') + '</td></tr></tbody></table></div>' +
      '<table class="ac10-dl"><thead><tr><th>' + t(L('Layanan', 'Service')) + '</th><th class="r">' + t(L('Jumlah', 'Qty')) + '</th><th class="r">' + t(L('Tarif', 'Rate')) + '</th><th class="r">' + t(L('Nilai', 'Amount')) + '</th></tr></thead><tbody>' + rows + '</tbody>' +
      '<tfoot>' + tot.map(function (x) { return '<tr' + (x[2] ? ' class="tot"' : '') + '><td colspan="3" class="r">' + t(x[0]) + '</td><td class="r num">' + rp(x[1]) + '</td></tr>'; }).join('') + '</tfoot></table>' +
      '<p class="ac10-pay">' + t(L('Pembayaran ke ', 'Pay to ')) + '<b>' + esc(bank.bank) + ' ' + esc(bank.no) + '</b> a.n. ' + esc(co.n) + ' · ' + t(L('cantumkan nomor invoice pada berita transfer.', 'quote the invoice number in the transfer note.')) + '</p>' +
      '<footer><span class="mono6">' + esc(ref) + '</span><span>' + t(L('Dibuat dari Billing Ready (POD & rekap delivery terlampir). Perubahan hanya lewat nota kredit atau pembatalan tercatat.', 'Generated from Billing Ready (POD & delivery summary attached). Changes only through a credit note or a recorded cancellation.')) + '</span></footer></article>';
  }
  function openInv(id) {
    var iv = F.invoice(id); if (!iv) return;
    var old = document.querySelector('.doc9'); if (old) old.remove();
    var el = document.createElement('div'); el.className = 'doc9'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'true'); el.setAttribute('aria-label', 'Invoice ' + iv.id);
    el.innerHTML = '<div class="doc9-bar">' + A.btn('primary', L('Cetak / Simpan PDF', 'Print / Save PDF'), 'print', { cls: 'doc9-pr' }) + A.btn('ghost', L('Tutup', 'Close'), 'x', { cls: 'doc9-x' }) + '</div>' + invDoc(iv);
    document.body.appendChild(el); document.body.classList.add('doc9-on');
    function close() { el.remove(); document.body.classList.remove('doc9-on'); document.removeEventListener('keydown', key, true); }
    function key(e) { if (e.key === 'Escape') close(); }
    el.querySelector('.doc9-x').onclick = close; el.querySelector('.doc9-pr').onclick = function () { window.print(); };
    document.addEventListener('keydown', key, true); el.querySelector('.doc9-x').focus();
  }
  // Workflow actions shared by AR-002, AR-003 and AR-005.
  var INV_ACT = {
    submit: function (el) { var id = el.getAttribute('data-val'), iv = F.invoice(id); P.confirmDlg({ title: L('Ajukan review ' + id, 'Submit ' + id + ' for review'), icon: 'arrow', ok: L('Ajukan', 'Submit'), sub: t(F.invNeedsSecond(iv) ? L('Invoice ini butuh persetujuan orang kedua; approver mendapat notifikasi.', 'This invoice needs a second approver; approvers are notified.') : L('Setelah review, invoice bisa disetujui dan diterbitkan.', 'After review the invoice can be approved and issued.')), fn: function () { return F.invSubmit(cx(), id); }, done: L(id + ' diajukan untuk review.', id + ' submitted for review.') }); },
    po: function (el) { var id = el.getAttribute('data-val'), iv = F.invoice(id); dlg({ title: L('Nomor PO klien', 'Client PO number'), icon: 'hash', ok: L('Simpan', 'Save'), body: fld('PO', inp('po', iv.po || '', { ph: L('No. PO dari klien', 'Client PO no.') }), { wide: true }), onOk: function (v) { var r = F.invSetPo(cx(), id, v.po); if (!r.ok) return r.msg; after(L('PO disimpan.', 'PO saved.')); return true; } }); },
    disc: function (el) {
      var id = el.getAttribute('data-val'), iv = F.invoice(id);
      P.reasonDlg({ title: L('Diskon manual ' + id, 'Manual discount ' + id), icon: 'percent', ok: L('Simpan Diskon', 'Save Discount'),
        sub: t(L('Diskon menyimpang dari Billing Ready: wajib alasan dan selalu butuh persetujuan orang kedua. Maksimal subtotal ' + rp(iv.sub) + '.', 'A discount deviates from Billing Ready: it needs a reason and always a second approver. Maximum the subtotal ' + rp(iv.sub) + '.')),
        body: fld(L('Diskon (Rp)', 'Discount (Rp)'), inp('amt', iv.disc || '', { num: true }), { req: true, wide: true }),
        fn: function (reason, v) { return F.invDiscount(cx(), id, amtIn(v.amt), reason); }, done: L('Diskon disimpan — butuh persetujuan orang kedua.', 'Discount saved — needs a second approver.') });
    },
    appr: function (el) { var id = el.getAttribute('data-val'), iv = F.invoice(id); P.confirmDlg({ title: L('Setujui ' + id, 'Approve ' + id), icon: 'checkc', ok: L('Setujui', 'Approve'), sub: cname(iv.cl) + ' · <b class="num">' + rp(iv.total) + '</b> · ' + t(L('dibuat oleh ', 'made by ')) + emp(iv.by), fn: function () { return F.invApprove(cx(), id); }, done: L(id + ' disetujui.', id + ' approved.') }); },
    ret: function (el) { var id = el.getAttribute('data-val'); P.reasonDlg({ title: L('Kembalikan ' + id + ' ke draft', 'Return ' + id + ' to draft'), icon: 'arrowl', ok: L('Kembalikan', 'Return'), fn: function (r) { return F.invReturn(cx(), id, r); }, done: L(id + ' dikembalikan ke draft.', id + ' returned to draft.'), tone: 'warn' }); },
    issue: function (el) {
      var id = el.getAttribute('data-val'), iv = F.invoice(id);
      dlg({ title: L('Terbitkan ' + id, 'Issue ' + id), icon: 'sign', ok: L('Terbitkan', 'Issue'), sub: t(L('Menerbitkan memposting jurnal: Piutang ' + rp(iv.total) + ' / Piutang belum ditagih ' + rp(iv.sub + iv.sur - iv.disc) + ' / PPN keluaran ' + rp(iv.tax) + '. Jatuh tempo = tanggal terbit + ' + iv.terms + ' hari.', 'Issuing posts the journal: AR ' + rp(iv.total) + ' / Unbilled AR ' + rp(iv.sub + iv.sur - iv.disc) + ' / Output VAT ' + rp(iv.tax) + '. Due = issue date + ' + iv.terms + ' days.')),
        body: fld(L('Tanggal terbit', 'Issue date'), inp('date', today(), { type: 'date' }), { req: true, wide: true }),
        onOk: function (v) { var r = F.invIssue(cx(), id, v.date || null); if (!r.ok) return r.msg; after(L(id + ' terbit. Jurnal ' + r.jv.id + '.', id + ' issued. Journal ' + r.jv.id + '.')); return true; } });
    },
    pay: function (el) { var iv = F.invoice(el.getAttribute('data-val')); if (iv) payDialog(iv); },
    cancel: function (el) {
      var id = el.getAttribute('data-val'), iv = F.invoice(id);
      P.reasonDlg({ title: L('Batalkan ' + id, 'Cancel ' + id), icon: 'ban', ok: L('Batalkan Invoice', 'Cancel Invoice'), tone: 'warn',
        sub: t(iv.jv ? L('Invoice terbit tidak dihapus: jurnal ' + iv.jv + ' dibalik dan baris Billing Ready kembali ke antrian.', 'An issued invoice is never deleted: journal ' + iv.jv + ' is reversed and the Billing Ready lines go back to the queue.') : L('Baris Billing Ready kembali ke antrian.', 'The Billing Ready lines go back to the queue.')),
        fn: function (r) { return F.invCancel(cx(), id, r); }, done: L(id + ' dibatalkan.', id + ' cancelled.') });
    },
    print: function (el) { openInv(el.getAttribute('data-val')); }
  };

  /* ================= NP-03 · AR-001 Billing Ready Queue ================= */
  V['AR-001'] = {
    render: function (c) {
      var c0 = cx(), all = F.billingReady(c0, {}), st = c.q.st == null ? 'unbilled' : c.q.st, rows = all.filter(function (b) { return (!st || st === 'all' || b.st === st) && (!c.q.cl || b.cl === c.q.cl); }), b0 = c.rec ? F.brRec(c.rec) : null;
      var unb = all.filter(function (b) { return b.st === 'unbilled'; }), canB = can('ar.build');
      var cls = unb.map(function (b) { return b.cl; }).filter(function (x, i, a) { return a.indexOf(x) === i; });
      var clOpts = all.map(function (b) { return b.cl; }).filter(function (x, i, a) { return a.indexOf(x) === i; }).map(function (id) { return [id, F.clientName(id)]; });
      var cols = [
        canB ? { h: L('Pilih', 'Select'), v: function (b) { return b.st === 'unbilled' ? '<input type="checkbox" class="ac10-sel" value="' + esc(b.id) + '" data-cl="' + esc(b.cl) + '" data-amt="' + F.brAmount(b) + '" aria-label="' + esc(b.id) + '">' : ''; } } : null,
        { h: 'Billing Ready', v: function (b) { return '<a class="lnk5" href="' + href('AR-001', b.id, c.q) + '"><b class="mono6">' + esc(b.id) + '</b></a><small class="sub5">' + dtn(b.date) + '</small>'; } },
        { h: L('Klien · property · kontrak', 'Client · property · contract'), v: function (b) { return '<b>' + cname(b.cl) + '</b><small class="sub5">' + pname(b.prop) + ' · ' + esc(b.ctr || '—') + '</small>'; } },
        { h: L('Layanan · rate card', 'Service · rate card'), v: function (b) { return esc(F.svcName(b.svc)) + '<small class="sub5">' + esc(b.rc || '—') + '</small>'; } },
        { h: L('kg / pcs × tarif', 'kg / pcs × rate'), cls: 'r num ac10-n', v: function (b) { return qtyU(b.qty, b.unit) + '<small class="sub5">× ' + rp(b.rate) + '</small>'; } },
        { h: L('Nilai', 'Amount'), cls: 'r num ac10-n', v: function (b) { return '<b>' + rp(F.brAmount(b)) + '</b><small class="sub5">' + t(L('surch. ', 'surch. ')) + (b.sur ? '+' + rpj(b.sur) : '0') + ' · ' + t(L('disk. ', 'disc. ')) + (b.disc ? '−' + rpj(b.disc) : '0') + '</small>'; } },
        st === 'unbilled' ? null : { h: 'Status', v: function (b) { return brSt(b) + (b.inv ? '<small class="sub5">' + P.invLink(b.inv) + '</small>' : ''); } }
      ].filter(Boolean);
      var tabs = H.tabs([['unbilled', F.BR_ST.unbilled[0], 'inbox', all.filter(function (b) { return b.st === 'unbilled'; }).length], ['drafted', F.BR_ST.drafted[0], 'edit', all.filter(function (b) { return b.st === 'drafted'; }).length], ['invoiced', F.BR_ST.invoiced[0], 'checkc', all.filter(function (b) { return b.st === 'invoiced'; }).length], ['all', L('Semua', 'All'), 'list', all.length]], st, 'st', { def: 'unbilled', label: 'Status' });
      var det = b0 ? card(Lx(L('Billing Ready ', 'Billing Ready '), b0.id), grid('g2-10', [kv([[L('Klien', 'Client'), clLink(b0.cl)], [L('Property', 'Property'), pname(b0.prop)], [L('Kontrak', 'Contract'), esc(b0.ctr || '—')], ['Rate card', esc(b0.rc || '—')], [L('Layanan', 'Service'), esc(F.svcName(b0.svc))], [L('Jumlah', 'Quantity'), qtyU(b0.qty, b0.unit)],
          [L('Tarif × jumlah', 'Rate × quantity'), rp(b0.rate) + ' × ' + n0(b0.qty) + ' = ' + rp(b0.charge)], [L('Surcharge / diskon', 'Surcharge / discount'), rp(b0.sur) + ' / ' + rp(-b0.disc)], [L('Nilai', 'Amount'), '<b>' + rp(F.brAmount(b0)) + '</b>'], [L('PPN', 'VAT'), (b0.taxPct || 11) + '%'],
          [L('Bukti', 'Evidence'), (b0.evidence || []).map(function (e) { return A.chip('info', e, 'filecheck'); }).join(' ')], [L('Diterima', 'Received'), esc(b0.at) + ' · v' + b0.compVer], [L('Jurnal akrual', 'Accrual journal'), P.jvLink(b0.jv)], ['Status', brSt(b0) + (b0.inv ? ' ' + P.invLink(b0.inv) : '')]]),
          '<div>' + brTrace(b0) + '<p class="sub5 ac10-p">' + t(L('Nilai dihitung dari kontrak & rate card Fase 6 dan kuantitas POD Fase 9 — tidak diketik ulang di Finance.', 'Values come from the Phase 6 contract & rate card and the Phase 9 POD quantity — never re-typed in Finance.')) + '</p></div>']), { icon: 'inbox', right: A.btn('ghost', L('Tutup', 'Close'), 'x', { go: 'AR-001', qs: Object.keys(c.q).map(function (k) { return k + '=' + c.q[k]; }).join('&'), cls: 'btn-sm' }) }) : '';
      return P.head(t(L('Transaksi Billing Ready dari Fase 9 (POD & rekonsiliasi delivery selesai). Pilih baris satu klien → draft invoice. Tidak ada angka yang diketik ulang.', 'Phase 9 Billing Ready transactions (POD & delivery reconciliation done). Pick one client\'s lines → draft invoice. No figure is typed again.')),
          A.btn('ghost', 'Invoice Builder', 'invoice', { go: open('AR-002') ? 'AR-002' : 'AR-003' }), P.fresh({ kind: 'live', src: L('outbox Billing Ready Fase 9', 'Phase 9 Billing Ready outbox') })) +
        P.deskOnly() +
        P.kpis([{ k: L('Siap ditagih', 'Ready to invoice'), v: n0(unb.length), s: rpj(sum(unb.map(F.brAmount))) + ' ' + t(L('+ PPN', '+ VAT')), icon: 'inbox', tone: 'appr' }, { k: L('Klien', 'Clients'), v: n0(cls.length), s: t(L('dengan Billing Ready terbuka', 'with open Billing Ready')), icon: 'building' },
          { k: L('Di draft invoice', 'In draft invoices'), v: n0(all.filter(function (b) { return b.st === 'drafted'; }).length), icon: 'edit', go: open('AR-002') ? 'AR-002' : null }, { k: L('Piutang belum ditagih (1210)', 'Unbilled AR (1210)'), v: rpj(F.natural('1210')), s: t(L('ledger', 'ledger')), icon: 'scale', go: 'ACC-003', q: { acc: '1210' } }]) +
        det + tabs +
        '<div class="fb">' + '<label class="fb-f"><span class="sr">' + t(L('Klien', 'Client')) + '</span><select data-f="cl"><option value="">' + t(L('Klien: Semua', 'Client: All')) + '</option>' + clOpts.map(function (o) { return '<option value="' + esc(o[0]) + '"' + (c.q.cl === o[0] ? ' selected' : '') + '>' + esc(o[1]) + '</option>'; }).join('') + '</select></label></div>' +
        (canB && st !== 'invoiced' && st !== 'drafted' ? '<div class="ac10-selbar card hide-m"><span data-selsum>' + t(L('Pilih baris Billing Ready satu klien untuk membuat draft invoice.', 'Select Billing Ready lines of one client to build a draft invoice.')) + '</span>' +
          '<label class="ac10-selcl"><span class="sr">' + t(L('Pilih semua baris klien', 'Select all lines of a client')) + '</span><select data-selcl><option value="">' + t(L('Pilih semua baris klien…', 'Select all lines of a client…')) + '</option>' + cls.filter(function (id) { return !c.q.cl || id === c.q.cl; }).map(function (id) { var n = unb.filter(function (b) { return b.cl === id; }); return '<option value="' + esc(id) + '">' + cname(id) + ' · ' + n.length + ' · ' + esc(rpj(sum(n.map(F.brAmount)))) + '</option>'; }).join('') + '</select></label>' +
          A.btn('primary', L('Buat Draft Invoice', 'Build Draft Invoice'), 'invoice', { act: 'build' }) + '</div>' : '') +
        card(L('Billing Ready', 'Billing Ready'), P.table(rows, cols, function (b) { return { t: cname(b.cl) + ' · ' + esc(F.svcName(b.svc)), r: rpj(F.brAmount(b)), s: esc(b.id) + ' · ' + qtyU(b.qty, b.unit) + ' · ' + dt(b.date), chip: brSt(b) }; }, null, { empty: L('Tidak ada Billing Ready pada filter ini.', 'No Billing Ready for this filter.') }), { icon: 'inbox', count: rows.length });
    },
    after: function () {
      var box = document.querySelector('[data-selsum]'); if (!box) return;
      function upd() {
        var ck = [].slice.call(document.querySelectorAll('input.ac10-sel:checked')), cl = ck.map(function (x) { return x.getAttribute('data-cl'); }).filter(function (x, i, a) { return a.indexOf(x) === i; });
        if (!ck.length) { box.textContent = T(L('Pilih baris Billing Ready satu klien untuk membuat draft invoice.', 'Select Billing Ready lines of one client to build a draft invoice.')); box.className = ''; return; }
        var tot = sum(ck.map(function (x) { return +x.getAttribute('data-amt'); }));
        box.className = cl.length > 1 ? 'ac10-neg' : '';
        box.innerHTML = cl.length > 1 ? esc(T(L('Satu invoice untuk satu klien — ' + cl.length + ' klien terpilih.', 'One invoice per client — ' + cl.length + ' clients selected.'))) : '<b>' + ck.length + '</b> ' + esc(T(L('baris', 'lines'))) + ' · ' + esc(F.clientName(cl[0])) + ' · <b class="num">' + esc(rp(tot)) + '</b> + ' + esc(T(L('PPN', 'VAT')));
      }
      document.querySelectorAll('input.ac10-sel').forEach(function (x) { x.addEventListener('change', upd); });
      var sc = document.querySelector('[data-selcl]');
      if (sc) sc.addEventListener('change', function () { var cl = sc.value; document.querySelectorAll('input.ac10-sel').forEach(function (x) { x.checked = !!cl && x.getAttribute('data-cl') === cl; }); upd(); });
    },
    act: {
      build: function () {
        var ids = [].slice.call(document.querySelectorAll('input.ac10-sel:checked')).map(function (x) { return x.value; });
        if (!ids.length) { A.toast(L('Pilih transaksi Billing Ready.', 'Choose Billing Ready transactions.'), 'warn'); return; }
        var r = F.buildInvoice(cx(), ids, {}); if (!r.ok) return fail(r);
        go(open('AR-002') ? 'AR-002' : 'AR-003', r.inv.id); setTimeout(function () { A.toast(L('Draft ' + r.inv.id + ' dibuat dari ' + ids.length + ' baris Billing Ready.', 'Draft ' + r.inv.id + ' built from ' + ids.length + ' Billing Ready lines.')); }, 350);
      }
    }
  };

  /* ================= NP-03 · AR-002 Invoice Builder ================= */
  V['AR-002'] = {
    title: function (rec) { return rec ? L('Invoice Builder · ' + rec, 'Invoice Builder · ' + rec) : null; },
    render: function (c) {
      var iv = c.rec ? F.invoice(c.rec) : null;
      if (!iv) {
        var wip = F.invoices(cx(), {}).filter(function (x) { return ['draft', 'review', 'approved'].indexOf(x.st) >= 0; });
        return P.head(t(L('Draft dan review invoice. Invoice baru selalu dimulai dari Antrian Billing Ready.', 'Draft and review invoices. A new invoice always starts from the Billing Ready Queue.')), A.btn('primary', L('Antrian Billing Ready', 'Billing Ready Queue'), 'inbox', { go: 'AR-001' })) +
          card(L('Invoice dalam proses', 'Invoices in progress'), P.table(wip, [
            { h: 'Invoice', v: function (x) { return '<b class="mono6">' + esc(x.id) + '</b>'; } }, { h: L('Klien', 'Client'), v: function (x) { return cname(x.cl); } }, { h: L('Baris', 'Lines'), cls: 'r num ac10-n', v: function (x) { return x.lines.length; } },
            { h: L('Total', 'Total'), cls: 'r num ac10-n', v: function (x) { return rp(x.total); } }, { h: L('Dibuat', 'Made by'), v: function (x) { return emp(x.by); } }, { h: 'Status', v: invSt }
          ], function (x) { return { t: esc(x.id) + ' · ' + cname(x.cl), r: rpj(x.total), chip: invSt(x) }; }, function (x) { return href('AR-002', x.id); }, { empty: L('Tidak ada invoice dalam proses. Mulai dari Billing Ready.', 'No invoice in progress. Start from Billing Ready.') }), { icon: 'invoice' });
      }
      if (['draft', 'review', 'approved'].indexOf(iv.st) < 0) return P.head('', A.btn('primary', L('Buka Detail Invoice', 'Open Invoice Detail'), 'file', { go: 'AR-003', rec: iv.id })) + note(t(L(iv.id + ' sudah ' + T(F.INV_ST[F.invSt(iv)][0]).toLowerCase() + ': tidak bisa diubah di builder.', iv.id + ' is already ' + F.INV_ST[F.invSt(iv)][0][1].toLowerCase() + ': it cannot be changed in the builder.')), 'lock', 'info');
      return P.head(t(L('Baris diambil otomatis dari Billing Ready: kontrak, rate card, kuantitas POD, surcharge. Yang bisa ditambahkan hanya No. PO dan diskon beralasan.', 'Lines come automatically from Billing Ready: contract, rate card, POD quantity, surcharge. Only the PO number and a justified discount can be added.')), invActs(iv, 'b'), P.fresh({ kind: 'live', src: L('Billing Ready + kontrak Fase 6', 'Billing Ready + Phase 6 contract') })) +
        hero({ id: iv.id, icon: 'invoice', title: cname(iv.cl), sub: t(L('Dibuat ', 'Made by ')) + emp(iv.by) + ' · ' + iv.lines.length + ' ' + t(L('baris Billing Ready', 'Billing Ready lines')), chips: invSt(iv) + (iv.manual ? A.chip('appr', L('Diskon manual', 'Manual discount'), 'percent') : ''), facts: invFacts(iv) }) +
        invSteps(iv) + needSecond(iv) +
        grid('g21-10', [card(L('Baris invoice (dari Billing Ready, tidak bisa diketik)', 'Invoice lines (from Billing Ready, not typed)'), invLines(iv), { icon: 'list', count: iv.lines.length }),
          '<div class="col10">' + card(L('Total', 'Totals'), invTotals(iv), { icon: 'coins' }) + card(L('Dokumen pendukung', 'Supporting documents'), chipsRow((iv.docs || []).map(function (d) { return A.chip('info', d, 'filecheck'); }).join('')), { icon: 'filecheck' }) + card(L('Riwayat', 'History'), invLog(iv), { icon: 'history' }) + '</div>']);
    },
    act: INV_ACT
  };

  /* ================= NP-03 · AR-003 Invoice Detail ================= */
  var INV_TABS = [['', L('Semua', 'All')], ['open', L('Terbuka', 'Open')], ['overdue', F.INV_ST.overdue[0]], ['partial', F.INV_ST.partial[0]], ['paid', F.INV_ST.paid[0]], ['review', 'Review'], ['draft', 'Draft'], ['cancelled', F.INV_ST.cancelled[0]]];
  V['AR-003'] = {
    title: function (rec) { return rec ? L('Invoice ' + rec, 'Invoice ' + rec) : null; },
    render: function (c) {
      var rec = c.rec; if (rec && /^PAY-/.test(rec)) { var p0 = payRec(rec); rec = p0 ? p0.inv : rec; }
      var iv = rec ? F.invoice(rec) : null;
      if (!iv) {
        var list = F.invoices(cx(), { st: c.q.st || null, cl: c.q.cl || null });
        return P.head(t(L('Semua invoice: Draft, Review, Disetujui, Terbit, Sebagian, Lunas, Lewat Jatuh Tempo, Dibatalkan.', 'All invoices: Draft, Review, Approved, Issued, Partial, Paid, Overdue, Cancelled.')), A.btn('ghost', 'AR Aging', 'clock', { go: 'AR-004' }), P.fresh({ kind: 'live', src: L('invoice & pembayaran', 'invoices & payments') })) +
          H.tabs(INV_TABS, c.q.st || '', 'st', { label: 'Status' }) + (c.q.cl ? chipsRow(A.chip('info', L('Klien: ' + F.clientName(c.q.cl), 'Client: ' + F.clientName(c.q.cl)), 'building') + ' ' + lnk('AR-003', null, t(L('hapus filter', 'clear filter')), c.q.st ? { st: c.q.st } : null)) : '') +
          card('Invoice', P.table(list, [
            { h: 'Invoice', v: function (x) { return '<b class="mono6">' + esc(x.id) + '</b>'; } }, { h: L('Klien', 'Client'), v: function (x) { return cname(x.cl); } }, { h: L('Terbit', 'Issued'), v: function (x) { return x.issued ? dt(x.issued) : '—'; } },
            { h: L('Jatuh tempo', 'Due'), v: function (x) { return x.due ? dt(x.due) : '—'; } }, { h: L('Total', 'Total'), cls: 'r num ac10-n', v: function (x) { return rp(x.total); } },
            { h: L('Sisa', 'Open'), cls: 'r num ac10-n', v: function (x) { return ['draft', 'review', 'approved', 'cancelled'].indexOf(x.st) >= 0 ? '—' : '<b>' + rp(F.openOf(x)) + '</b>'; } }, { h: 'Status', v: invSt }
          ], function (x) { return { t: esc(x.id) + ' · ' + cname(x.cl), r: rpj(x.total), s: x.due ? t(L('jatuh tempo ', 'due ')) + dt(x.due) : '', chip: invSt(x) }; }, function (x) { return href('AR-003', x.id); }), { icon: 'invoice', count: list.length });
      }
      var pays = F.paymentsOf(iv.id), coll = F.state().coll[iv.id], brs = iv.lines.map(function (l) { return l.br && F.brRec(l.br); }).filter(Boolean);
      var jvs = [iv.jv].concat(pays.map(function (p) { return p.jv; })).filter(Boolean);
      var trc = brs.length ? brTrace(brs[0]) + (brs.length > 1 ? '<p class="sub5 ac10-p">' + t(L('+' + (brs.length - 1) + ' baris Billing Ready lain: ', '+' + (brs.length - 1) + ' more Billing Ready lines: ')) + brs.slice(1).map(function (b) { return gol('AR-001', mono(b.id), b.id); }).join(', ') + '</p>' : '')
        : H.drill([{ i: 'invoice', l: 'Invoice', s: iv.id }, { i: 'building', l: F.clientName(iv.cl), s: iv.cl, go: 'CLIENT-002', rec: iv.cl }]) + '<p class="sub5 ac10-p">' + t(L('Invoice migrasi dari sistem lama (dokumen pendukung: ', 'Invoice migrated from the old system (supporting documents: ')) + esc((iv.docs || []).join(', ')) + ').</p>';
      return P.head(cname(iv.cl) + ' · ' + invSt(iv), invActs(iv, 'd'), P.fresh({ kind: 'live', src: L('invoice, pembayaran, ledger', 'invoice, payments, ledger') })) +
        hero({ id: iv.id + (iv.mig ? ' · ' + T(L('migrasi', 'migrated')) : ''), icon: 'invoice', title: cname(iv.cl), sub: t(L('Dibuat ', 'Made by ')) + emp(iv.by) + (iv.appr ? ' · ' + t(L('disetujui ', 'approved by ')) + emp(iv.appr) : ''), chips: invSt(iv), facts: invFacts(iv) }) +
        invSteps(iv) + (iv.st === 'review' ? needSecond(iv) : '') +
        grid('g21-10', [card(L('Baris invoice', 'Invoice lines'), invLines(iv), { icon: 'list', count: iv.lines.length }), card(L('Total & sisa', 'Totals & balance'), invTotals(iv), { icon: 'coins' })]) +
        grid('ac10-g2', [card(L('Pembayaran', 'Payments'), P.table(pays, [
            { h: L('Pembayaran', 'Payment'), v: function (p) { return '<b class="mono6">' + esc(p.id) + '</b><small class="sub5">' + dtn(p.date) + '</small>'; } }, { h: L('Rekening · ref', 'Account · ref'), v: function (p) { return P.cashLink(p.acc) + '<small class="sub5">' + esc(p.ref || '—') + '</small>'; } }, { h: L('Jumlah', 'Amount'), cls: 'r num ac10-n', v: function (p) { return '<b>' + rp(p.amt) + '</b>'; } }, { h: L('Jurnal', 'Journal'), cls: 'ac10-n', v: function (p) { return P.jvLink(p.jv); } }
          ], function (p) { return { t: esc(p.id) + ' · ' + dt(p.date), r: rpj(p.amt), s: esc(p.ref || '') }; }, null, { empty: L('Belum ada pembayaran.', 'No payment yet.') }) +
            (coll ? '<p class="ac10-p">' + A.chip(coll.esc ? 'crit' : 'info', L('Collection: ' + T(F.OUTCOME[coll.outcome] || L('—', '—')), 'Collection: ' + (F.OUTCOME[coll.outcome] || ['—', '—'])[1]), 'headset') + (coll.ptp ? ' ' + A.chip('appr', L('Janji bayar ' + coll.ptp.date + ' · ' + rpj(coll.ptp.amt), 'Promise ' + coll.ptp.date + ' · ' + rpj(coll.ptp.amt)), 'calendar') : '') + ' ' + gol('AR-005', t(L('Buka collection', 'Open collection')), iv.id) + '</p>' : ''), { icon: 'coins', count: pays.length }),
          card(L('Jejak & jurnal', 'Trace & journals'), trc + (jvs.length ? '<h4 class="ac10-h4">' + t(L('Jurnal', 'Journals')) + '</h4><ul class="ac10-jvs">' + jvs.map(function (id) { var j = F.jv(id); return '<li>' + P.jvLink(id) + ' <span class="sub5">' + esc(j ? T(j.desc) : '') + '</span> ' + (j ? jvSt(j) : '') + '</li>'; }).join('') + '</ul>' : '<p class="sub5 ac10-p">' + t(L('Jurnal invoice dibuat saat diterbitkan.', 'The invoice journal is posted on issue.')) + '</p>'), { icon: 'route' })]) +
        card(L('Riwayat status', 'Status history'), invLog(iv), { icon: 'history' });
    },
    act: INV_ACT
  };

  /* ================= NP-03 · AR-004 AR Aging ================= */
  V['AR-004'] = {
    render: function (c) {
      var ag = F.aging(cx()); if (!ag) return A.stateCard('noperm', F.MSG.noperm);
      var ds = F.dso(), big = ag.largest, cr = ag.coll;
      var tiles = P.kpis([
        { k: L('Total AR', 'Total AR'), v: rpj(ag.total), s: ag.rows.length + ' ' + t(L('invoice terbuka', 'open invoices')), icon: 'clock', go: 'AR-003', q: { st: 'open' } },
        { k: L('Lewat jatuh tempo', 'Overdue'), v: rpj(ag.overdue), s: pct(ag.overduePct) + ' ' + t(L('dari AR', 'of AR')), icon: 'alert', tone: ag.overduePct > 30 ? 'crit' : 'warn', go: 'AR-003', q: { st: 'overdue' } },
        { k: 'DSO', v: n0(ag.dso, 1) + ' ' + t(L('hari', 'days')), s: t(L('3 bln s/d ', '3 mo to ')) + esc(mon(F.lastClosed(), false)), icon: 'hourglass', tone: ag.dso > 45 ? 'warn' : 'info' },
        { k: L('Collection rate', 'Collection rate'), v: pct(cr), s: esc(mon(F.lastClosed())), icon: 'percent' },
        { k: L('Ekspektasi tertagih 30 hari', 'Expected collection 30 days'), v: rpj(ag.exp), icon: 'calendar', tone: 'ok', go: open('CASH-004') ? 'CASH-004' : null },
        big ? { k: L('Terbesar', 'Largest outstanding'), v: rpj(big.open), s: esc(big.inv.id) + ' · ' + cname(big.inv.cl), icon: 'building', go: 'AR-003', rec: big.inv.id } : null
      ]);
      var bk = F.AGING.map(function (b) { return { l: b[1], v: ag.tot[b[0]], tone: b[2], k: b[0] }; });
      var bars = '<div class="ac10-ag">' + bk.map(function (b) { return '<div class="ac10-agb"><span>' + t(b.l) + '</span>' + P.bar(b.v, ag.total, b.tone) + '<b class="num">' + rpj(b.v) + '</b><small>' + pct(ag.total ? b.v / ag.total * 100 : 0, 0) + '</small></div>'; }).join('') + '</div>';
      var byCl = P.table(ag.byCl, [{ h: L('Klien', 'Client'), v: function (x) { return '<b>' + clLink(x.cl) + '</b>'; } }].concat(F.AGING.map(function (b) { return { h: b[1], cls: 'r num ac10-n', v: function (x) { var v = x.b[b[0]] || 0; return v ? '<span class="' + (b[0] === 'current' ? '' : b[0] === 'b30' ? '' : 'ac10-neg') + '">' + rpj(v) + '</span>' : '<span class="sub5">—</span>'; } }; }),
        [{ h: L('Total', 'Total'), cls: 'r num ac10-n', v: function (x) { return '<b>' + rp(x.total) + '</b>'; } }, { h: '', v: function (x) { return gol('AR-005', t(L('Collection', 'Collection')), null, { cl: x.cl }) + ' · ' + gol('AR-003', t(L('Invoice', 'Invoices')), null, { cl: x.cl }); } }]),
        function (x) { return { t: cname(x.cl), r: rpj(x.total), s: F.AGING.filter(function (b) { return x.b[b[0]]; }).map(function (b) { return T(b[1]) + ' ' + rpj(x.b[b[0]]); }).join(' · ') }; });
      var rows = P.table(ag.rows, [
        { h: 'Invoice', v: function (r) { return P.invLink(r.inv.id); } }, { h: L('Klien', 'Client'), v: function (r) { return cname(r.inv.cl); } }, { h: L('Jatuh tempo', 'Due'), v: function (r) { return dtn(r.inv.due) + '<small class="sub5">' + (r.days > 0 ? '<b class="ac10-neg">+' + r.days + ' ' + t(L('hari', 'days')) + '</b>' : t(L(-r.days + ' hari lagi', 'in ' + (-r.days) + ' days'))) + '</small>'; } }, { h: L('Umur', 'Bucket'), v: function (r) { var b = by(F.AGING, 0, r.b); return A.chip(b[2], b[1]); } },
        { h: L('Sisa', 'Open'), cls: 'r num ac10-n', v: function (r) { return '<b>' + rp(r.open) + '</b>'; } }, { h: L('Ekspektasi', 'Expected'), v: function (r) { return dtn(F.expectedDate(r.inv)); } },
        { h: 'PIC · ' + T(L('hasil', 'outcome')), v: function (r) { var cc = F.state().coll[r.inv.id]; return cc ? emp(cc.pic) + (cc.outcome ? '<small class="sub5">' + t(F.OUTCOME[cc.outcome]) + '</small>' : '') : '<span class="sub5">—</span>'; } }
      ], function (r) { var b = by(F.AGING, 0, r.b); return { t: esc(r.inv.id) + ' · ' + cname(r.inv.cl), r: rpj(r.open), s: t(L('jatuh tempo ', 'due ')) + dt(r.inv.due), chip: A.chip(b[2], b[1]) }; }, function (r) { return href('AR-003', r.inv.id); });
      var worst = ag.rows.filter(function (r) { return r.b === 'b90p' || r.b === 'b90'; }).sort(function (a, b) { return b.open - a.open; })[0];
      var cc = worst && F.state().coll[worst.inv.id];
      var recCard = worst ? P.rec({ title: L('Piutang > 60 hari', 'Receivables > 60 days'), tone: 'crit', icon: 'alert',
        sig: L(rpj(ag.tot.b90 + ag.tot.b90p) + ' piutang berumur > 60 hari; terbesar ' + worst.inv.id + ' (' + F.clientName(worst.inv.cl) + ', ' + rpj(worst.open) + ', +' + worst.days + ' hari).', rpj(ag.tot.b90 + ag.tot.b90p) + ' of receivables older than 60 days; largest ' + worst.inv.id + ' (' + F.clientName(worst.inv.cl) + ', ' + rpj(worst.open) + ', +' + worst.days + ' days).'),
        why: [L('DSO ' + n0(ag.dso, 1) + ' hari = rata-rata AR akhir bulan ÷ pendapatan 3 bulan × jumlah hari.', 'DSO ' + n0(ag.dso, 1) + ' days = average month-end AR ÷ 3-month revenue × days.'), cc ? L('Status collection: ' + T(F.OUTCOME[cc.outcome] || L('belum ada', 'none')) + (cc.ptp ? ', janji bayar ' + cc.ptp.date : '') + (cc.esc ? ', sudah dieskalasi' : ''), 'Collection status: ' + (F.OUTCOME[cc.outcome] || ['', 'none'])[1] + (cc.ptp ? ', promise to pay ' + cc.ptp.date : '') + (cc.esc ? ', escalated' : '')) : L('Belum ada PIC collection.', 'No collection PIC yet.')],
        impact: L('Semakin tua piutang, semakin kecil peluang tertagih; skenario worst forecast hanya menghitung ' + pct(F.cfg().coll.worstShare * 100, 0) + ' AR lewat jatuh tempo.', 'The older the receivable, the lower the chance of collection; the worst-case forecast counts only ' + pct(F.cfg().coll.worstShare * 100, 0) + ' of overdue AR.'),
        rec: L('Tetapkan tindak lanjut tertulis dan janji bayar untuk ' + worst.inv.id + '; eskalasi bila janji lewat.', 'Set a written follow-up and a promise to pay for ' + worst.inv.id + '; escalate if the promise lapses.'),
        act: { n: L('Buka Collection', 'Open Collection'), s: 'AR-005', rec: worst.inv.id } }) : '';
      return P.head(t(L('Umur piutang per invoice dan klien, DSO, collection rate dan ekspektasi penagihan.', 'Receivable ageing per invoice and client, DSO, collection rate and expected collection.')), A.btn('ghost', 'Collection', 'headset', { go: 'AR-005' }), P.fresh({ kind: 'mixed', src: L('invoice terbuka (live) · DSO & collection rate periode ' + mon(F.lastClosed()), 'open invoices (live) · DSO & collection rate period ' + mon(F.lastClosed())) })) +
        tiles + recCard +
        grid('g2-10', [card(L('Umur piutang', 'Ageing buckets'), bars + '<p class="sub5 ac10-p">' + t(L('Hari dihitung dari tanggal jatuh tempo sampai hari ini.', 'Days counted from the due date to today.')) + '</p>', { icon: 'chart' }),
          card(L('Cara menghitung', 'How it is calculated'), kv([['DSO', n0(ds.v, 1) + ' = ' + rpj(ds.avgAr) + ' ÷ ' + rpj(ds.rev) + ' × ' + ds.days + ' ' + t(L('hari', 'days'))], [L('Periode DSO', 'DSO periods'), ds.periods.map(function (p) { return esc(mon(p, false)); }).join(', ') + ' · ' + t(L('AR = 1200 + 1210 akhir bulan', 'AR = 1200 + 1210 at month end'))],
            [L('Collection rate', 'Collection rate'), t(L('penerimaan klien bulan ' + mon(F.lastClosed()) + ' ÷ AR akhir bulan sebelumnya', 'client receipts in ' + mon(F.lastClosed()) + ' ÷ AR at the previous month end'))], [L('Ekspektasi tertagih', 'Expected collection'), t(L('jatuh tempo + rata-rata keterlambatan klien, atau tanggal janji bayar', 'due date + the client\'s average delay, or the promise date'))]]), { icon: 'bulb' })]) +
        card(L('Per klien', 'Per client'), byCl, { icon: 'building', count: ag.byCl.length }) +
        card(L('Invoice terbuka', 'Open invoices'), rows, { icon: 'invoice', count: ag.rows.length });
    }
  };

  /* ================= NP-03 · AR-005 Collection Workspace ================= */
  var COLL_F = [['', L('Semua', 'All'), 'list'], ['overdue', L('Lewat jatuh tempo', 'Overdue'), 'alert'], ['ptp', L('Janji bayar', 'Promise to pay'), 'calendar'], ['esc', L('Eskalasi', 'Escalated'), 'zap'], ['nopic', L('Tanpa PIC', 'No PIC'), 'user'], ['mine', L('Milik saya', 'Mine'), 'usercheck']];
  function collRow(iv) { var c = F.state().coll[iv.id] || {}; return { iv: iv, c: c, st: F.invSt(iv), days: F.dayDiff(iv.due, today()), open: F.openOf(iv) }; }
  V['AR-005'] = {
    title: function (rec) { return rec ? L('Collection · ' + rec, 'Collection · ' + rec) : null; },
    render: function (c) {
      var me = F.empId(cx()), all = F.invoices(cx(), { st: 'open' }).map(collRow), f = c.q.f || '';
      var rows = all.filter(function (r) { return (!c.q.cl || r.iv.cl === c.q.cl) && (!f || (f === 'overdue' && r.st === 'overdue') || (f === 'ptp' && r.c.ptp) || (f === 'esc' && r.c.esc) || (f === 'nopic' && !r.c.pic) || (f === 'mine' && r.c.pic === me)); }).sort(function (a, b) { return b.days - a.days || b.open - a.open; });
      var cur = c.rec ? F.invoice(c.rec) : null;
      var listT = P.table(rows, [
        { h: 'Invoice', v: function (r) { return '<a class="lnk5" href="' + href('AR-005', r.iv.id, c.q) + '"><b class="mono6">' + esc(r.iv.id) + '</b></a>'; } }, { h: L('Klien', 'Client'), v: function (r) { return cname(r.iv.cl); } },
        { h: L('Sisa', 'Open'), cls: 'r num ac10-n', v: function (r) { return '<b>' + rp(r.open) + '</b><small class="sub5">' + (r.days > 0 ? '<span class="ac10-neg">+' + r.days + ' ' + t(L('hari', 'days')) + '</span>' : t(L('belum jatuh tempo', 'not due'))) + '</small>'; } },
        { h: 'PIC', v: function (r) { return r.c.pic ? emp(r.c.pic) : '<span class="ac10-wrn">' + t(L('belum ada', 'none')) + '</span>'; } },
        { h: L('Kontak terakhir', 'Last contact'), v: function (r) { return r.c.last ? dt(r.c.last) + '<small class="sub5">' + esc(ago(r.c.last)) + '</small>' : '—'; } },
        { h: L('Aksi berikut', 'Next action'), v: function (r) { return r.c.next ? dt(r.c.next) + (r.c.next < today() ? ' ' + A.chip('crit', L('lewat', 'late')) : '') + (r.c.act ? '<small class="sub5">' + esc(T(r.c.act)) + '</small>' : '') : '—'; } },
        { h: L('Hasil', 'Outcome'), v: function (r) { return (r.c.outcome ? A.chip(r.c.outcome === 'ptp' ? 'appr' : r.c.outcome === 'dispute' || r.c.outcome === 'noreply' ? 'crit' : 'info', F.OUTCOME[r.c.outcome]) : '') + (r.c.esc ? ' ' + A.chip('crit', L('Eskalasi', 'Escalated'), 'zap') : '') + (r.c.ptp ? '<small class="sub5">' + t(L('janji ', 'promise ')) + dt(r.c.ptp.date) + ' · ' + rpj(r.c.ptp.amt) + '</small>' : ''); } }
      ], function (r) { return { t: esc(r.iv.id) + ' · ' + cname(r.iv.cl), r: rpj(r.open), s: (r.days > 0 ? '+' + r.days + ' ' + T(L('hari', 'days')) + ' · ' : '') + (r.c.pic ? emp(r.c.pic) : t(L('tanpa PIC', 'no PIC'))), chip: r.c.outcome ? A.chip('info', F.OUTCOME[r.c.outcome]) : '' }; }, function (r) { return href('AR-005', r.iv.id, c.q); }, { empty: L('Tidak ada invoice pada filter ini.', 'No invoice for this filter.') });
      var ws = '';
      if (cur) {
        var r0 = collRow(cur), cc = F.collection(cur.id), live = ['issued', 'partial', 'overdue'].indexOf(r0.st) >= 0, canC = can('ar.collect') && live;
        var acts = canC ? '<div class="ac10-acts">' + Object.keys(F.COLL_ACTS).map(function (k) { return A.btn(k === 'follow' || k === 'ptp' ? 'primary' : 'ghost', F.COLL_ACTS[k], { assign: 'usercheck', follow: 'headset', ptp: 'calendar', remind: 'bell', escalate: 'zap', note: 'edit', attach: 'upload' }[k], { act: 'coll', val: cur.id + '|' + k, cls: 'btn-sm' }); }).join('') + (can('ar.pay') ? A.btn('ghost', L('Bayar Sebagian', 'Partial Payment'), 'coins', { act: 'pay', val: cur.id, cls: 'btn-sm' }) : '') + '</div>' : (live ? '' : note(t(L('Invoice ini sudah ' + T(F.INV_ST[r0.st][0]).toLowerCase() + '.', 'This invoice is ' + F.INV_ST[r0.st][0][1].toLowerCase() + '.')), 'checkc', 'ok'));
        var notes = (cc.notes || []).slice().reverse();
        ws = card(Lx(L('Workspace ', 'Workspace '), cur.id), grid('g21-10', ['<div>' + kv([[L('Klien', 'Client'), clLink(cur.cl)], [L('Sisa tagihan', 'Open balance'), '<b class="num">' + rp(r0.open) + '</b> / ' + rp(cur.total)], [L('Jatuh tempo', 'Due'), dt(cur.due) + (r0.days > 0 ? ' <b class="ac10-neg">+' + r0.days + ' ' + t(L('hari', 'days')) + '</b>' : '')], ['Status', invSt(cur)],
            ['PIC', cc.pic ? emp(cc.pic) : '—'], [L('Kontak terakhir', 'Last contact'), cc.last ? dt(cc.last) : '—'], [L('Aksi berikut', 'Next action'), (cc.next ? dt(cc.next) : '—') + (cc.act ? ' · ' + esc(T(cc.act)) : '')], [L('Hasil', 'Outcome'), cc.outcome ? t(F.OUTCOME[cc.outcome]) : '—'],
            [L('Janji bayar', 'Promise to pay'), cc.ptp ? dt(cc.ptp.date) + ' · ' + rp(cc.ptp.amt) : '—'], [L('Pengingat', 'Reminders'), n0(cc.reminded || 0)], [L('Eskalasi', 'Escalation'), cc.esc ? A.chip('crit', L('Ya', 'Yes'), 'zap') : t(L('Tidak', 'No'))],
            [L('Ekspektasi tertagih', 'Expected collection'), dt(F.expectedDate(cur)) + ' <small class="sub5">' + t(L('rata-rata telat klien ' + F.clientDelay(cur.cl) + ' hari', 'client average delay ' + F.clientDelay(cur.cl) + ' days')) + '</small>']]) +
            (cc.files && cc.files.length ? chipsRow(cc.files.map(function (x) { return A.chip('info', x.name, 'filecheck'); }).join('')) : '') + acts + '<p class="ac10-p">' + P.invLink(cur.id) + ' · ' + A.btn('ghost', L('Cetak Invoice', 'Print Invoice'), 'print', { act: 'print', val: cur.id, cls: 'btn-sm' }) + '</p></div>',
          '<div><h4 class="ac10-h4">' + t(L('Catatan & riwayat kontak', 'Notes & contact history')) + '</h4>' + (notes.length ? '<ol class="ac10-log">' + notes.map(function (n) { return '<li><span class="ac10-log-t num">' + esc(n[0]) + '</span><b>' + emp(n[1]) + '</b><span>' + esc(T(n[2])) + '</span></li>'; }).join('') + '</ol>' : A.empty(L('Belum ada catatan.', 'No notes yet.'))) + '</div>']), { icon: 'headset', right: A.btn('ghost', L('Tutup', 'Close'), 'x', { go: 'AR-005', qs: Object.keys(c.q).map(function (k) { return k + '=' + c.q[k]; }).join('&'), cls: 'btn-sm' }) });
      }
      var od = all.filter(function (r) { return r.st === 'overdue'; }), late = all.filter(function (r) { return r.c.next && r.c.next < today(); });
      return P.head(t(L('PIC, follow-up, janji bayar, pengingat, pembayaran sebagian, eskalasi dan catatan per invoice terbuka.', 'PIC, follow-up, promise to pay, reminders, partial payment, escalation and notes per open invoice.')), A.btn('ghost', 'AR Aging', 'clock', { go: 'AR-004' }), P.fresh({ kind: 'live', src: L('invoice terbuka & catatan collection', 'open invoices & collection notes') })) +
        P.kpis([{ k: L('Invoice terbuka', 'Open invoices'), v: n0(all.length), s: rpj(sum(all.map(function (r) { return r.open; }))), icon: 'invoice' }, { k: L('Lewat jatuh tempo', 'Overdue'), v: n0(od.length), s: rpj(sum(od.map(function (r) { return r.open; }))), icon: 'alert', tone: 'crit', go: 'AR-005', q: { f: 'overdue' } },
          { k: L('Janji bayar', 'Promises to pay'), v: n0(all.filter(function (r) { return r.c.ptp; }).length), s: rpj(sum(all.filter(function (r) { return r.c.ptp; }).map(function (r) { return r.c.ptp.amt; }))), icon: 'calendar', tone: 'appr', go: 'AR-005', q: { f: 'ptp' } },
          { k: L('Tindak lanjut terlambat', 'Late follow-ups'), v: n0(late.length), icon: 'clock', tone: late.length ? 'warn' : 'ok' }, { k: L('Tanpa PIC', 'No PIC'), v: n0(all.filter(function (r) { return !r.c.pic; }).length), icon: 'user', go: 'AR-005', q: { f: 'nopic' } }]) +
        ws + H.tabs(COLL_F, f, 'f', { label: 'Filter' }) + (c.q.cl ? chipsRow(A.chip('info', L('Klien: ' + F.clientName(c.q.cl), 'Client: ' + F.clientName(c.q.cl)), 'building') + ' ' + lnk('AR-005', null, t(L('hapus filter', 'clear filter')))) : '') +
        card(L('Antrian collection', 'Collection queue'), listT, { icon: 'headset', count: rows.length });
    },
    act: Object.assign({}, INV_ACT, {
      coll: function (el) {
        var x = el.getAttribute('data-val').split('|'), id = x[0], k = x[1], iv = F.invoice(id), cc = F.collection(id), body = '', need = null;
        if (k === 'assign') body = fld('PIC', sel('pic', picOpts(), cc.pic || 'EMP-030'), { req: true, wide: true });
        else if (k === 'follow') body = '<div class="ac10-dg">' + fld(L('Hasil', 'Outcome'), sel('outcome', Object.keys(F.OUTCOME).filter(function (o) { return o !== 'paid' && o !== 'ptp'; }).map(function (o) { return [o, F.OUTCOME[o]]; }), 'contacted')) + fld(L('Aksi berikut (tanggal)', 'Next action (date)'), inp('next', F.addDays(today(), 3), { type: 'date' })) + '</div>' +
          fld(L('Aksi berikut', 'Next action'), inp('act', '', { ph: L('mis. telepon ulang Finance klien', 'e.g. call the client\'s finance again') }), { wide: true }) + fld(L('Catatan kontak', 'Contact note'), area('note', '', L('Siapa yang dihubungi, apa jawabannya?', 'Who was contacted, what did they say?')), { req: true, wide: true });
        else if (k === 'ptp') body = '<div class="ac10-dg">' + fld(L('Tanggal janji', 'Promise date'), inp('date', F.addDays(today(), 7), { type: 'date' }), { req: true }) + fld(L('Jumlah (Rp)', 'Amount (Rp)'), inp('amt', F.openOf(iv), { num: true }), { req: true }) + '</div>';
        else if (k === 'escalate') body = fld(L('Alasan eskalasi', 'Escalation reason'), area('note', '', ''), { req: true, wide: true });
        else if (k === 'note') body = fld(L('Catatan', 'Note'), area('note', '', ''), { req: true, wide: true });
        else if (k === 'attach') body = fld(L('Nama dokumen / file', 'Document / file name'), inp('name', '', { ph: L('mis. Surat pernyataan janji bayar.pdf', 'e.g. Promise-to-pay letter.pdf') }), { req: true, wide: true });
        var sub = cname(iv.cl) + ' · ' + iv.id + ' · ' + t(L('sisa ', 'open ')) + rp(F.openOf(iv)) + (k === 'remind' ? '<br>' + t(L('Pengingat pembayaran dicatat sebagai kontak hari ini.', 'The payment reminder is recorded as today\'s contact.')) : '');
        dlg({ title: F.COLL_ACTS[k], icon: 'headset', ok: F.COLL_ACTS[k], sub: sub, body: body,
          onOk: function (v) {
            var o = k === 'ptp' ? { date: v.date, amt: amtIn(v.amt) } : k === 'follow' ? { note: v.note, next: v.next, outcome: v.outcome, act: v.act ? L(v.act, v.act) : null } : v;
            var r = F.collect(cx(), id, k, o); if (!r.ok) return r.msg;
            after(L(T(F.COLL_ACTS[k]) + ' dicatat untuk ' + id + '.', F.COLL_ACTS[k][1] + ' recorded for ' + id + '.')); return true;
          } });
      }
    })
  };

  // One wrapper per screen for the area styles (tablet table density, grids).
  ['ACC-001', 'ACC-002', 'ACC-003', 'ACC-004', 'ACC-005', 'CASH-001', 'CASH-002', 'CASH-003', 'CASH-004', 'CASH-005', 'AR-001', 'AR-002', 'AR-003', 'AR-004', 'AR-005'].forEach(function (id) {
    var r = V[id].render; V[id].render = function (c) { return '<div class="ac10">' + r(c) + '</div>'; };
  });
})();
