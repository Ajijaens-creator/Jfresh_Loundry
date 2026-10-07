/* JFRESH OS — Phase 10 screens (part 1): shared finance helpers (A.P10) used by every Phase 10
   screen file (screens-fin-acc.js, -ap.js, -sup.js, -cfo.js).
   Desktop first for the CFO and finance team, iPad for approvals, inventory, purchasing and
   assets, mobile for alerts only. Every number comes from the finance engine
   (assets/js/jfos-fin*.js); permission, period lock, maker-checker and audit live in the engine. */
(function () {
  var A = window.JFAPP, F = window.JFFIN, H = A && A.P5, G = A && A.P7, P8 = A && A.P8;
  if (!A || !F || !H || !G || !P8) return;
  var V = A.V, T = A.T, L = A.L, t = A.t, esc = A.esc, ic = A.ic, can = A.can, href = A.href, fmt = A.fmt;
  var lnk = H.lnk, card = H.card, kv = H.kv, note = H.note, dlg = H.dlg, fld = H.fld, inp = H.inp, area = H.area, sel = H.sel;
  A.addParents(F.PARENTS);
  function cx() { return A.ctx(); }
  function go(id, rec, q) { A.go(id, rec, q); }

  /* ---------- Numbers ---------- */
  // Full rupiah (tables, documents) and short rupiah (tiles, charts).
  function rp(v) { return v == null || isNaN(v) ? '—' : (v < 0 ? '−' : '') + fmt.rp(Math.abs(Math.round(v))); }
  function rpj(v) { return v == null || isNaN(v) ? '—' : (v < 0 ? '−' : '') + fmt.rpShort(Math.abs(v)); }
  function n0(v, d) { return v == null || isNaN(v) ? '—' : fmt.num(v, d || 0); }
  function pct(v, d) { return v == null || isNaN(v) ? '—' : fmt.num(v, d == null ? 1 : d) + '%'; }
  function kg(v) { return v == null || isNaN(v) ? '—' : fmt.num(v, v % 1 ? (Math.abs(v) < 10 ? 2 : 1) : 0) + ' kg'; }
  function dt(s) { return H.dt(s); }
  function mon(p, yr) { return H.mon(p, yr == null ? true : yr); }
  function emp(id) { return id ? esc(F.empName(id)) : '—'; }
  function cname(id) { return esc(F.clientName(id)); }
  function pname(id) { return esc(F.propName(id)); }
  function accN(c) { return esc(c) + ' · ' + t(F.accName(c)); }

  /* ---------- Status chips from the engine maps ([label, tone]) ---------- */
  function stc(map, k, icon) { var x = map && map[k]; return x ? A.chip(x[1], x[0], icon) : A.chip('mute', L(String(k || '—'), String(k || '—'))); }
  function tone(st) { return { healthy: 'ok', good: 'ok', ontrack: 'ok', watch: 'warn', critical: 'crit', over: 'crit' }[st] || st || 'info'; }

  /* ---------- Links to records (only when the screen is open to this role) ---------- */
  function mono(id) { return '<span class="mono6">' + esc(id) + '</span>'; }
  function jvLink(id) { return id ? lnk('ACC-004', id, mono(id)) : '—'; }
  function accLink(c) { return lnk('ACC-003', null, accN(c), { acc: c }); }
  function cashLink(id) { var a = F.cashAcc(id); return a ? lnk('CASH-002', a.id, esc(T(a.n))) : esc(id); }
  function invLink(id) { return id ? lnk('AR-003', id, mono(id)) : '—'; }
  function expLink(id) { return id ? lnk('AP-002', id, mono(id)) : '—'; }
  function itemLink(code) { return code ? lnk('ITEM-002', code, mono(code)) : '—'; }
  function stockLink(code) { return code ? lnk('INV-003', code, mono(code)) : '—'; }
  function prLink(id) { return id ? lnk('PUR-002', id, mono(id)) : '—'; }
  function poLink(id) { return id ? lnk('PUR-006', id, mono(id)) : '—'; }
  function supLink(id) { return id ? lnk('PUR-007', id, esc(F.supName ? F.supName(id) : id)) : '—'; }
  function astLink(id) { return id ? lnk('AST-003', id, mono(id)) : '—'; }

  /* ---------- Data freshness (§ every dashboard) ---------- */
  // src: what the figures are built from; at: when; kind: live | ledger | mixed | snapshot.
  function fresh(o) {
    o = o || {};
    var kind = o.kind || 'live', at = o.at || F.nowS(), K = { live: L('Live', 'Live'), ledger: L('Ledger', 'Ledger'), mixed: L('Ledger + live', 'Ledger + live'), snapshot: L('Snapshot', 'Snapshot') };
    return '<span class="fr10 fr10-' + kind + '" title="' + esc(T(o.src || '')) + '">' + ic(kind === 'live' ? 'refresh' : 'clock') + '<span><b>' + t(K[kind] || K.live) + '</b> · ' + t(L('data per ', 'data as of ')) + esc(String(at).slice(0, 16)) + (o.src ? ' · ' + t(o.src) : '') + '</span></span>';
  }
  // Page head with the freshness line under the subtitle.
  function head(sub, actions, fr) { return A.pageHead(null, (sub || '') + (fr ? '<span class="ph10-f">' + fr + '</span>' : ''), actions); }

  /* ---------- KPI tiles ---------- */
  // items: { k, v, s, tone, go, rec, q, icon }
  function kpis(items, cls) {
    return '<div class="kp10' + (cls ? ' ' + cls : '') + '">' + items.filter(Boolean).map(function (x) {
      var tag = x.go ? 'a' : 'div';
      return '<' + tag + ' class="kp10-i' + (x.tone ? ' kp10-' + x.tone : '') + '"' + (x.go ? ' href="' + href(x.go, x.rec, x.q) + '"' : '') + '>' +
        '<span class="kp10-k">' + (x.icon ? ic(x.icon) : '') + '<span>' + t(x.k) + '</span></span><b class="kp10-v num">' + x.v + '</b>' + (x.s ? '<span class="kp10-s">' + x.s + '</span>' : '') + '</' + tag + '>';
    }).join('') + '</div>';
  }

  /* ---------- Tables ---------- */
  // cols: [{ h, v(row), cls, perm }]; card(row) → { t, r, s, chip } for mobile; rowHref(row) optional.
  function table(rows, cols, cardFn, rowHref, o) {
    o = o || {};
    return A.list(rows, cols, cardFn || function (r) { return { t: cols[0].v(r), r: cols.length > 1 ? cols[cols.length - 1].v(r) : '' }; }, rowHref || null, { dense: o.dense !== false, empty: o.empty });
  }
  // A plain two-column money table: label → amount, with optional total rows.
  function mtable(rows, o) {
    o = o || {};
    return '<div class="tblw"><table class="tbl dense mt10"><tbody>' + rows.filter(Boolean).map(function (r) {
      return '<tr class="' + (r.cls || '').split(' ').filter(Boolean).map(function (c) { return 'mt10-' + c; }).join(' ') + '"><th>' + (r.go ? r.go : t(r.n)) + (r.sub ? '<small class="sub5">' + r.sub + '</small>' : '') + '</th>' + (o.cols || ['v']).map(function (k) { return '<td class="r num">' + (r[k] == null ? '' : typeof r[k] === 'string' ? r[k] : rp(r[k])) + '</td>'; }).join('') + '</tr>';
    }).join('') + '</tbody>' + (o.head ? '<thead><tr><th></th>' + o.head.map(function (h) { return '<th class="r">' + t(h) + '</th>'; }).join('') + '</tr></thead>' : '') + '</table></div>';
  }

  /* ---------- SIGNAL / WHY / IMPACT / RECOMMENDATION / ACTION (every recommendation) ---------- */
  // o: { sig, why (string | [..]), impact, rec, act: { n, s, rec, q } | html, tone, title, icon, score, out }
  function rec(o) {
    var why = o.why == null ? [] : Array.isArray(o.why) && !(o.why.length === 2 && typeof o.why[0] === 'string' && typeof o.why[1] === 'string' && !Array.isArray(o.why[0])) ? o.why : [o.why];
    var act = o.act ? (typeof o.act === 'string' ? o.act : open(o.act.s) ? A.btn('primary', o.act.n, o.act.i || 'arrow', { go: o.act.s, rec: o.act.rec, qs: o.act.q, cls: 'btn-sm' }) : '<span class="sub5">' + t(o.act.n) + '</span>') : '';
    function row(k, lab, body) { return body ? '<div class="sw10-r sw10-' + k + '"><dt>' + t(lab) + '</dt><dd>' + body + '</dd></div>' : ''; }
    return '<section class="card sw10' + (o.tone ? ' sw10-t-' + o.tone : '') + '">' + (o.title ? '<div class="sw10-h">' + ic(o.icon || 'zap') + '<h3>' + t(o.title) + '</h3>' + (o.chip || '') + '</div>' : '') + '<dl>' +
      row('sig', L('SIGNAL', 'SIGNAL'), o.sig ? t(o.sig) : '') +
      row('why', L('WHY', 'WHY'), why.length ? (why.length === 1 ? t(why[0]) : '<ul>' + why.map(function (w) { return '<li>' + t(w) + '</li>'; }).join('') + '</ul>') : '') +
      row('imp', L('IMPACT', 'IMPACT'), o.impact ? t(o.impact) : '') +
      row('rec', L('RECOMMENDATION', 'RECOMMENDATION'), o.rec ? '<b>' + t(o.rec) + '</b>' : '') +
      row('act', L('ACTION', 'ACTION'), act) + '</dl></section>';
  }
  function open(id) { return H.open(id); }

  /* ---------- Bars / mini charts ---------- */
  function bar(v, max, tn) { var w = max ? Math.max(1.5, Math.min(100, Math.abs(v) / max * 100)) : 0; return '<span class="br10"><i class="t-' + (tn || 'info') + '" style="width:' + w.toFixed(1) + '%"></i></span>'; }
  // Budget-style progress: actual vs budget, tone from status.
  function prog(a, b, st) { var p = b ? a / b * 100 : 0; return '<span class="pg10" role="img" aria-label="' + esc(pct(p, 0)) + '"><i class="t-' + tone(st) + '" style="width:' + Math.max(1.5, Math.min(100, p)).toFixed(1) + '%"></i>' + (p > 100 ? '<em style="left:' + (100 / p * 100).toFixed(1) + '%"></em>' : '') + '</span>'; }

  /* ---------- Dialogs ---------- */
  function vals(el) { return G.vals(el); }
  function after(msg, tn) { G.after(msg, tn); }
  function fail(r) { A.toast(r && r.msg ? r.msg : F.MSG.invalid, 'crit'); return false; }
  // A reason dialog for any engine call fn(reason, values) → { ok, msg }.
  function reasonDlg(o) {
    dlg({ title: o.title, icon: o.icon || 'edit', sub: o.sub || '', ok: o.ok || L('Simpan', 'Save'),
      body: (o.body || '') + (o.noReason ? '' : fld(o.label || L('Alasan', 'Reason'), area('reason', '', o.ph || L('Tulis alasan singkat', 'Write a short reason')), { req: !o.optional, wide: true })),
      onOk: function (v, el) { v = vals(el); var r = o.fn(v.reason, v); if (!r || !r.ok) return r ? r.msg : F.MSG.invalid; after(o.done || L('Tersimpan.', 'Saved.'), o.tone); if (o.then) o.then(r); return true; } });
  }
  // Confirm dialog without a reason.
  function confirmDlg(o) { reasonDlg(Object.assign({ noReason: true }, o)); }
  function opts(map, blank) { var o = Object.keys(map).map(function (k) { return [k, map[k] && Array.isArray(map[k]) && Array.isArray(map[k][0]) ? map[k][0] : map[k]]; }); return blank ? [['', blank]].concat(o) : o; }

  /* ---------- Device hints ---------- */
  // §: desktop for finance/CFO, iPad for approvals/inventory/purchasing/assets, mobile only for alerts.
  function deskOnly(msg) { return '<div class="dk10 hide-d hide-t">' + note(t(msg || L('Layar ini dirancang untuk PC. Di ponsel hanya ringkasan dan alert yang ditampilkan.', 'This screen is designed for PC. On a phone only the summary and alerts are shown.')), 'monitor', 'info') + '</div>'; }

  /* ---------- Trace chain (journal → source → client / supplier) ---------- */
  var SRC_SCR = { jv: 'ACC-004', inv: 'AR-003', pay: 'AR-003', br: 'AR-001', exp: 'AP-002', apay: 'AP-005', cash: 'CASH-003', mv: 'INV-004', po: 'PUR-006', grn: 'PUR-006', ast: 'AST-003', dep: 'AST-004', dlv: 'DISP-002', ord: 'ORDER-002', cl: 'CLIENT-002', sup: 'PUR-007', batch: 'PROD-TRACE-001', wo: 'MNT-002' };
  var SRC_IC = { jv: 'list', inv: 'invoice', pay: 'coins', br: 'inbox', bil: 'file', exp: 'file', apay: 'coins', cash: 'coins', mv: 'swap', po: 'clipboard', grn: 'package', ast: 'washer', dep: 'arrowdn', dlv: 'truck', ord: 'clipboard', cl: 'building', sup: 'briefcase', batch: 'factory', wo: 'wrench' };
  // F.trace(jvId) → [{ k, id, n }]: every step opens the next record when the role can see it.
  function traceChain(list) {
    if (!list || !list.length) return '';
    return H.drill(list.map(function (s, i) {
      // The first step is the journal on screen; a later journal (the original of a reversal) links to its own detail.
      var go = s.id && (s.k !== 'jv' || i > 0) ? SRC_SCR[s.k] : null, rec = s.id;
      // Payments open on their invoice, goods receipts on their PO.
      if (s.k === 'pay') { var p = (F.state().pays || []).filter(function (x) { return x.id === s.id; })[0]; rec = p ? p.inv : null; if (!p) go = null; }
      if (s.k === 'grn') { var g = F.grn && F.grn(s.id); rec = g ? g.po : null; if (!g) go = null; }
      return { i: SRC_IC[s.k] || 'link', l: s.n ? s.n : L(s.k, s.k), s: s.id || '', go: go, rec: rec };
    }));
  }

  /* ---------- Journal lines ---------- */
  function jlines(lines) {
    var d = 0, c = 0;
    return '<div class="tblw"><table class="tbl dense"><thead><tr><th>' + t(L('Akun', 'Account')) + '</th><th>' + t(L('Keterangan', 'Memo')) + '</th><th class="r">' + t(L('Debit', 'Debit')) + '</th><th class="r">' + t(L('Kredit', 'Credit')) + '</th></tr></thead><tbody>' +
      lines.map(function (l) { d += l.d || 0; c += l.c || 0; return '<tr><td>' + accLink(l.a) + '</td><td>' + esc(l.m ? T(l.m) : '') + (l.cc ? ' <small class="sub5">' + esc(l.cc) + '</small>' : '') + '</td><td class="r num">' + (l.d ? rp(l.d) : '') + '</td><td class="r num">' + (l.c ? rp(l.c) : '') + '</td></tr>'; }).join('') +
      '</tbody><tfoot><tr><th colspan="2">' + t(L('Total', 'Total')) + (Math.round(d) === Math.round(c) ? ' ' + A.chip('ok', L('Seimbang', 'Balanced'), 'checkc') : ' ' + A.chip('crit', L('Tidak seimbang', 'Unbalanced'), 'alert')) + '</th><td class="r num"><b>' + rp(d) + '</b></td><td class="r num"><b>' + rp(c) + '</b></td></tr></tfoot></table></div>';
  }

  /* ---------- Period picker (months with a ledger) ---------- */
  function perOpts() { return F.periods().map(function (p) { return [p.p, [mon(p.p) + ' · ' + T(F.PER_ST[p.st][0]), mon(p.p) + ' · ' + F.PER_ST[p.st][0][1]]]; }).reverse(); }
  function perTabs(cur, key, list) {
    list = list || F.periods().slice(-6).map(function (p) { return p.p; });
    return H.tabs(list.map(function (p) { return [p, L(mon(p), mon(p)), null]; }), cur, key || 'p', { seg: true, def: '' });
  }

  A.P10 = { F: F, cx: cx, go: go, rp: rp, rpj: rpj, n0: n0, pct: pct, kg: kg, dt: dt, mon: mon, emp: emp, cname: cname, pname: pname, accN: accN, stc: stc, tone: tone, mono: mono,
    jvLink: jvLink, accLink: accLink, cashLink: cashLink, invLink: invLink, expLink: expLink, itemLink: itemLink, stockLink: stockLink, prLink: prLink, poLink: poLink, supLink: supLink, astLink: astLink,
    fresh: fresh, head: head, kpis: kpis, table: table, mtable: mtable, rec: rec, open: open, bar: bar, prog: prog, vals: vals, after: after, fail: fail, reasonDlg: reasonDlg, confirmDlg: confirmDlg, opts: opts,
    deskOnly: deskOnly, traceChain: traceChain, jlines: jlines, perOpts: perOpts, perTabs: perTabs, SRC_SCR: SRC_SCR };

  /* ================= HOM-FIN-001 Finance Today (Phase 10 live data replaces the Phase 4 mock) ================= */
  var SEV_T = { crit: 'crit', appr: 'warn', info: 'info' };
  V['HOM-FIN-001'] = {
    render: function () {
      var c0 = cx(), br = F.billingReady(c0, {}).filter(function (b) { return b.st === 'unbilled'; }), inv = F.invoices(c0, {}), exp = F.expenses(c0, {});
      var toApprove = inv.filter(function (i) { return ['draft', 'review', 'approved'].indexOf(F.invSt(i)) >= 0; }), over = inv.filter(function (i) { return F.invSt(i) === 'overdue'; });
      var apOpen = exp.filter(function (e) { return ['received', 'verify'].indexOf(F.expSt(e)) >= 0; }), tr = F.treasury(c0, 30), ps = F.paySchedule(c0, 7), al = F.alerts(c0) || [];
      function sumv(a, f) { return a.reduce(function (x, y) { return x + (f(y) || 0); }, 0); }
      var tiles = kpis([
        { k: L('Siap Ditagih', 'Ready to Invoice'), v: br.length, s: rpj(sumv(br, F.brAmount)), icon: 'inbox', tone: br.length ? 'appr' : 'ok', go: 'AR-001' },
        { k: L('Invoice perlu tindakan', 'Invoices to act on'), v: toApprove.length, s: t(L('draft, review, siap terbit', 'draft, review, ready to issue')), icon: 'invoice', tone: toApprove.length ? 'appr' : 'ok', go: toApprove.length ? 'AR-002' : 'AR-001', rec: toApprove[0] && toApprove[0].id },
        { k: L('AR terlambat', 'Overdue AR'), v: over.length, s: rpj(sumv(over, F.openOf)), icon: 'alert', tone: over.length ? 'crit' : 'ok', go: 'AR-004' },
        { k: L('Biaya perlu verifikasi', 'Expenses to verify'), v: apOpen.length, s: rpj(sumv(apOpen, function (e) { return e.amt + e.tax; })), icon: 'file', tone: apOpen.length ? 'appr' : 'ok', go: 'AP-001' },
        { k: L('Bayar 7 hari', 'Payments in 7 days'), v: rpj(ps.total), s: t(L('jadwal pembayaran AP', 'AP payment schedule')), icon: 'calendar', go: 'AP-004' },
        { k: L('Free cash', 'Free cash'), v: rpj(tr.free), s: t(L('tersedia ', 'available ')) + rpj(tr.avail), icon: 'coins', tone: 'info', go: 'CASH-001' }
      ]);
      var alerts = card(L('Alert finansial', 'Financial alerts'), al.length ? '<div class="rls">' + al.slice(0, 6).map(function (a) { return A.rowLink({ href: open(a.s) ? href(a.s, a.rec) : '#', icon: a.sev === 'crit' ? 'alert' : 'bell', t: t(a.t), s: t(a.c), chip: A.chip(SEV_T[a.sev] || 'info', a.sev === 'crit' ? L('Kritis', 'Critical') : a.sev === 'appr' ? L('Perlu tindakan', 'Action needed') : L('Info', 'Info')) }); }).join('') + '</div>' : A.empty(L('Tidak ada alert.', 'No alerts.')), { icon: 'bell', count: al.length });
      var quick = card(L('Pintasan', 'Shortcuts'), '<div class="rls">' + [['ACC-001', 'grid', L('Dashboard Finance', 'Finance Dashboard')], ['ACC-003', 'list', L('Jurnal', 'Journals')], ['CASH-003', 'coins', L('Transaksi kas', 'Cash transactions')], ['BUD-004', 'checkc', L('Monthly close', 'Monthly close')], ['HPP-001', 'flask', L('Dashboard HPP', 'HPP dashboard')]].filter(function (x) { return open(x[0]); }).map(function (x) { return A.rowLink({ href: href(x[0]), icon: x[1], t: t(x[2]), s: esc(x[0]) }); }).join('') + '</div>', { icon: 'zap' });
      return head(esc(H.dt(F.today())) + ' · ' + t(L('Semua plant', 'All plants')), A.pbtn('ar.build', 'primary', L('Buat Invoice', 'Build Invoice'), 'file', { go: 'AR-001' }) + A.pbtn('ap.enter', 'ghost', L('Catat Biaya', 'Enter Expense'), 'plus', { go: 'AP-001' }), fresh({ kind: 'live', src: L('ledger + Billing Ready Fase 9', 'ledger + Phase 9 Billing Ready') })) +
        tiles + '<div class="g21-10">' + alerts + quick + '</div>';
    },
    title: function () { return L('Finance Hari Ini', 'Finance Today'); }
  };
})();
