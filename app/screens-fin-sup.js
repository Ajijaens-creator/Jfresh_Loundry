/* JFRESH OS — Phase 10 screens (part 4): pricing intelligence, inventory, purchasing and suppliers.
   PRICE-001…005 (desktop first: HPP, price, profit, markup vs gross margin never mixed, recommended
   price by the method shown, scenarios labelled as assumptions, client profitability), INV-001…005
   (iPad first: stock status, movements with a full record, no silent adjustment, stock count with
   maker-checker approval) and PUR-001…007 (iPad first: PR with approval rules, RFQ to ≥ 2 suppliers,
   transparent supplier comparison, PO with capex never auto-approved, receiving, three-way match,
   supplier master). Phone: stock alerts and approvals only. Every number and every write goes
   through the finance engine (window.JFFIN); permission, maker-checker and audit live there. */
(function () {
  var A = window.JFAPP, P = A && A.P10, H = A && A.P5, P8 = A && A.P8; if (!A || !P || !H || !P8) return;
  var F = P.F, V = A.V, T = A.T, L = A.L, t = A.t, esc = A.esc, ic = A.ic, can = A.can, href = A.href;
  var lnk = H.lnk, card = H.card, kv = H.kv, note = H.note, dlg = H.dlg, fld = H.fld, inp = H.inp, sel = H.sel, area = H.area, tabs = H.tabs;
  var cx = P.cx, rp = P.rp, rpj = P.rpj, n0 = P.n0, pct = P.pct, dt = P.dt, mon = P.mon, emp = P.emp, stc = P.stc, mono = P.mono;
  var stockLink = P.stockLink, prLink = P.prLink, poLink = P.poLink, supLink = P.supLink, jvLink = P.jvLink;
  var D = F.D;
  function S() { return F.state(); }
  function sum(a) { return a.reduce(function (s, v) { return s + (+v || 0); }, 0); }
  function by(list, k, v) { return list.filter(function (x) { return x[k] === v; })[0] || null; }
  function val(el) { return el.getAttribute('data-val'); }
  function today() { return F.today(); }
  function g2(html) { return '<div class="fg5">' + html + '</div>'; }
  function sub(x) { return '<small class="sub5">' + x + '</small>'; }
  function svcN(svc) { return esc(F.svcName(svc)); }
  function svcLink(svc) { return lnk('PRICE-002', svc, svcN(svc)); }
  function tierN(k) { var x = D.TIERS.filter(function (r) { return r[0] === k; })[0]; return x ? t(x[1]) : esc(k || '—'); }
  function unitN(u) { return u === 'pcs' ? 'pcs' : 'kg'; }
  function qtyU(q, u) { return '<span class="num">' + n0(q, q % 1 ? 1 : 0) + '</span> ' + esc(u || ''); }
  function sgn(v, f) { return v == null || isNaN(v) ? '—' : (v > 0 ? '+' : '') + (f ? f(v) : n0(v)); }
  function locN(code) {
    if (!code) return '—';
    if (/^SUP-/.test(code)) return supLink(code);
    return D.LOCS[code] ? '<span title="' + esc(code) + '">' + t(D.LOCS[code]) + '</span>' : mono(code);
  }
  // Short location in tables: the code, with the full name on hover.
  function locS(code) { if (!code) return '—'; if (/^SUP-/.test(code)) return supLink(code); return '<span class="mono6" title="' + esc(D.LOCS[code] ? T(D.LOCS[code]) : code) + '">' + esc(code) + '</span>'; }
  function z(v) { return v === 0 ? 0 : v; }
  function catN(map, k) { return map[k] ? t(map[k]) : esc(k || '—'); }
  function stockSt(x) { return stc(F.STOCK_ST, F.stockSt(x)); }
  function mvChip(type) { var x = F.MV_TYPES[type]; return x ? A.chip(x[1], x[0], x[2]) : esc(type); }
  function freshLive(src) { return P.fresh({ kind: 'live', src: src }); }
  function noAccess() { return A.stateCard('noperm', L('Anda tidak memiliki akses ke data ini.', 'You do not have access to this data.'), A.backBtn()); }
  function notFound(scr, label) { return A.stateCard('empty', L('Data tidak ditemukan.', 'Record not found.'), A.btn('blue', label || L('Kembali', 'Back'), 'arrowl', { go: scr })); }
  function logList(log) {
    if (!log || !log.length) return A.empty(L('Belum ada riwayat.', 'No history yet.'));
    return '<ol class="su10-log">' + log.slice().reverse().map(function (x) {
      return '<li><b>' + esc(x.to ? String(x.to).toUpperCase() : '—') + '</b><span>' + emp(x.by) + ' · ' + esc(dt(x.at)) + '</span>' + (x.reason ? '<em>' + esc(T(x.reason)) + '</em>' : '') + '</li>';
    }).join('') + '</ol>';
  }
  function auditList(rec) {
    var list = F.auditLog({ rec: rec }).slice(0, 12);
    if (!list.length) return A.empty(L('Belum ada jejak audit.', 'No audit trail yet.'));
    return '<ol class="su10-log">' + list.map(function (e) {
      return '<li><b>' + esc(e.ev) + '</b><span>' + esc(e.name || F.empName(e.by)) + ' · ' + esc(dt(e.at)) + '</span>' + (e.from || e.to ? '<em>' + esc((e.from != null ? e.from + ' → ' : '') + (e.to || '')) + '</em>' : '') + (e.reason ? '<em>' + t(L('Alasan: ', 'Reason: ')) + esc(e.reason) + '</em>' : '') + '</li>';
    }).join('') + '</ol>';
  }
  // A small step list for document flows (PR → RFQ → PO → GRN → invoice).
  function flow(steps) { return H.drill(steps.filter(Boolean)); }
  function mustReason(v) { return v && String(v).trim(); }

  /* =====================================================================
     NP-07 PRICING
     ===================================================================== */
  var FX_MARKUP = L('Markup = (Harga − HPP) ÷ HPP', 'Markup = (Price − HPP) ÷ HPP');
  var FX_MARGIN = L('Gross margin = (Harga − HPP) ÷ Harga', 'Gross margin = (Price − HPP) ÷ Price');
  function fxStrip(extra) {
    return '<div class="su10-fx">' + ic('percent') + '<span><b>' + t(FX_MARKUP) + '</b></span><span><b>' + t(FX_MARGIN) + '</b></span>' + (extra ? '<span>' + extra + '</span>' : '') + '</div>';
  }
  function methodN(m) { return m === 'margin' ? L('Target Gross Margin', 'Target Gross Margin') : L('Target Markup', 'Target Markup'); }
  // The recommended price formula with the numbers filled in.
  function recFx(hpp, r) {
    if (!r) return '—';
    return r.method === 'margin' ? rp(hpp) + ' ÷ (1 − ' + n0(r.target) + '%) = <b>' + rp(r.price) + '</b>' : rp(hpp) + ' × (1 + ' + n0(r.target) + '%) = <b>' + rp(r.price) + '</b>';
  }
  function pricingFresh(p) {
    var h = F.hppOf(p);
    return P.fresh({ kind: 'ledger', at: h ? h.at : p, src: L('HPP ' + mon(p) + ' v' + (h ? h.v : 1) + ' · harga Fase 6', 'HPP ' + mon(p) + ' v' + (h ? h.v : 1) + ' · Phase 6 prices') });
  }
  function priceRows(pr) { return pr.rows.slice().sort(function (a, b) { return (a.margin || 0) - (b.margin || 0); }); }
  function priceCols(o) {
    o = o || {};
    return [
      { h: L('Layanan', 'Service'), v: function (r) { return svcLink(r.svc) + sub(tierN(r.tier) + ' · ' + t(L('per ', 'per ')) + unitN(r.unit)); } },
      { h: L('HPP / unit', 'HPP / unit'), cls: 'r num', v: function (r) { return rp(r.hpp); } },
      { h: L('Harga jual', 'Selling price'), cls: 'r num', v: function (r) { return rp(r.price) + sub(t(L('master ', 'master ')) + rp(r.master)); } },
      { h: L('Profit / unit', 'Profit / unit'), cls: 'r num', v: function (r) { return '<span class="' + (r.profit < 0 ? 'su10-neg' : '') + '">' + rp(r.profit) + '</span>'; } },
      { h: L('Profit / kg', 'Profit / kg'), cls: 'r num', v: function (r) { return rp(r.profitKg); } },
      { h: L('Markup %', 'Markup %'), cls: 'r num', v: function (r) { return pct(r.markup); } },
      { h: L('Gross margin %', 'Gross margin %'), cls: 'r num', v: function (r) { return '<b>' + pct(r.margin) + '</b>'; } },
      o.short ? null : { h: L('Volume', 'Volume'), cls: 'r num', v: function (r) { return n0(r.vol) + ' ' + unitN(r.unit); } },
      { h: L('Revenue', 'Revenue'), cls: 'r num', v: function (r) { return rpj(r.rev); } },
      o.short ? null : { h: L('Kontribusi', 'Contribution'), cls: 'r num', v: function (r) { return rpj(r.contrib); } },
      { h: L('Status', 'Status'), v: function (r) { return stc(F.PRICE_ST, r.st); } }
    ].filter(Boolean);
  }
  function priceCard(r) { return { t: svcN(r.svc), r: pct(r.margin), s: t(L('HPP ', 'HPP ')) + rp(r.hpp) + ' · ' + t(L('harga ', 'price ')) + rp(r.price) + ' · ' + t(L('markup ', 'markup ')) + pct(r.markup), chip: stc(F.PRICE_ST, r.st) }; }
  function cfgDlg() {
    var c = F.priceCfg();
    P.reasonDlg({ title: L('Ubah Ambang & Target Harga', 'Change Price Thresholds & Targets'), icon: 'target', ok: L('Simpan versi baru', 'Save new version'),
      sub: t(L('Ambang disimpan sebagai versi baru (v' + ((c.v || 1) + 1) + '). Versi lama tetap di riwayat.', 'Thresholds are saved as a new version (v' + ((c.v || 1) + 1) + '). The old version stays in the history.')),
      body: g2(fld(L('Metode rekomendasi', 'Recommendation method'), sel('method', [['margin', methodN('margin')], ['markup', methodN('markup')]], c.method)) +
        fld(L('Target gross margin %', 'Target gross margin %'), inp('targetMargin', c.targetMargin, { num: true })) + fld(L('Target markup %', 'Target markup %'), inp('targetMarkup', c.targetMarkup, { num: true })) +
        fld(L('Excellent ≥ margin %', 'Excellent ≥ margin %'), inp('excellent', c.excellent, { num: true })) + fld(L('Sehat ≥ margin %', 'Healthy ≥ margin %'), inp('healthy', c.healthy, { num: true })) + fld(L('Margin rendah ≥ %', 'Low margin ≥ %'), inp('low', c.low, { num: true }))),
      fn: function (reason, v) { return F.setPriceCfg(cx(), v, reason); }, done: L('Ambang harga versi baru tersimpan.', 'New price threshold version saved.') });
  }
  function cfgCard() {
    var c = F.priceCfg(), hist = (S().pcfgHist || []).slice().reverse();
    var body = kv([[L('Metode aktif', 'Active method'), '<b>' + t(methodN(c.method)) + '</b>' + sub(c.method === 'margin' ? t(L('Harga = HPP ÷ (1 − Target Margin)', 'Price = HPP ÷ (1 − Target Margin)')) : t(L('Harga = HPP × (1 + Target Markup)', 'Price = HPP × (1 + Target Markup)')))],
      [L('Target gross margin', 'Target gross margin'), pct(c.targetMargin, 0)], [L('Target markup', 'Target markup'), pct(c.targetMarkup, 0)],
      [L('Excellent', 'Excellent'), t(L('margin ≥ ', 'margin ≥ ')) + pct(c.excellent, 0)], [L('Sehat', 'Healthy'), t(L('margin ≥ ', 'margin ≥ ')) + pct(c.healthy, 0)], [L('Margin rendah', 'Low margin'), t(L('margin ≥ ', 'margin ≥ ')) + pct(c.low, 0)],
      [L('Di bawah HPP', 'Below HPP'), t(L('harga < HPP atau margin < ', 'price < HPP or margin < ')) + pct(c.low, 0)], [L('Perlu review', 'Review required'), t(L('harga tidak berubah > ' + c.staleDays + ' hari dan margin < sehat', 'price unchanged > ' + c.staleDays + ' days and margin below healthy'))],
      [L('Versi', 'Version'), 'v' + esc(c.v || 1) + ' · ' + t(L('berlaku ', 'effective ')) + esc(dt(c.eff))]]);
    var hl = '<details class="su10-det"><summary>' + t(L('Riwayat versi ambang', 'Threshold version history')) + ' (' + hist.length + ')</summary><ol class="su10-log">' + hist.map(function (h) {
      return '<li><b>v' + esc(h.v || 1) + ' · ' + t(methodN(h.method)) + '</b><span>' + emp(h.by) + ' · ' + esc(dt(h.at)) + '</span><em>' + esc('M ' + h.targetMargin + '% · MU ' + h.targetMarkup + '% · ' + h.excellent + '/' + h.healthy + '/' + h.low) + '</em>' + (h.reason ? '<em>' + esc(T(h.reason)) + '</em>' : '') + '</li>';
    }).join('') + '</ol></details>';
    return card(L('Ambang & target harga', 'Price thresholds & targets'), body + hl + (can('price.edit') || can('cfo.th') ? '<div class="su10-ar">' + A.btn('ghost', L('Ubah ambang', 'Change thresholds'), 'edit', { act: 'cfg', cls: 'btn-sm' }) + '</div>' : ''), { icon: 'target' });
  }

  /* ---------- PRICE-001 Pricing Overview ---------- */
  V['PRICE-001'] = {
    render: function (c) {
      var pr = F.pricing(cx()); if (!pr) return noAccess();
      var rows = priceRows(pr), cost = sum(rows.map(function (r) { return r.hpp * r.vol; })), avgM = pr.rev ? (pr.rev - cost) / pr.rev * 100 : null;
      var cnt = {}; rows.forEach(function (r) { cnt[r.st] = (cnt[r.st] || 0) + 1; });
      var st = c.q.st || '', list = st ? rows.filter(function (r) { return r.st === st; }) : rows;
      var rv = F.priceReview(cx()) || [], worst = rv.filter(function (r) { return r.gap > 0 && ['below', 'low', 'review'].indexOf(r.st) >= 0; })[0];
      var tiers = F.serviceProfit(cx()) || [], tmax = Math.max.apply(null, tiers.map(function (x) { return Math.abs(x.contrib); }).concat([1]));
      var tierTbl = P.table(tiers, [
        { h: L('Tier layanan', 'Service tier'), v: function (x) { return '<b>' + t(x.n) + '</b>' + sub(x.svcs.map(function (s) { return svcN(s); }).join(', ') || '—'); } },
        { h: L('Volume kg-eq', 'Volume kg-eq'), cls: 'r num', v: function (x) { return n0(x.vol); } },
        { h: L('Revenue', 'Revenue'), cls: 'r num', v: function (x) { return rpj(x.rev); } },
        { h: L('HPP / kg', 'HPP / kg'), cls: 'r num', v: function (x) { return rp(x.hpp); } },
        { h: L('Kontribusi', 'Contribution'), v: function (x) { return '<span class="su10-bc">' + P.bar(x.contrib, tmax, x.contrib < 0 ? 'crit' : 'ok') + '<b class="num">' + rpj(x.contrib) + '</b></span>'; } },
        { h: L('Gross margin', 'Gross margin'), cls: 'r num', v: function (x) { return pct(x.margin); } },
        { h: L('Growth YoY', 'Growth YoY'), cls: 'r num', v: function (x) { return sgn(x.growth, function (v) { return pct(v); }); } }
      ], function (x) { return { t: t(x.n), r: pct(x.margin), s: rpj(x.rev) + ' · ' + n0(x.vol) + ' kg-eq' }; });
      return P.deskOnly() + P.head(t(L('Harga, HPP, profit, markup dan gross margin per layanan · periode ', 'Price, HPP, profit, markup and gross margin per service · period ')) + esc(mon(pr.p)),
        A.btn('ghost', L('Rekomendasi', 'Recommendation'), 'bulb', { go: 'PRICE-003' }) + A.btn('ghost', L('Simulasi', 'Scenario'), 'zap', { go: 'PRICE-004' }) + (P.open('PRICE-005') ? A.btn('ghost', L('Profit klien', 'Client profit'), 'hotel', { go: 'PRICE-005' }) : ''), pricingFresh(pr.p)) +
        P.kpis([
          { k: L('Rata-rata gross margin', 'Average gross margin'), v: pct(avgM), s: t(L('(Revenue − HPP) ÷ Revenue', '(Revenue − HPP) ÷ Revenue')), icon: 'percent', tone: avgM >= pr.cfg.healthy ? 'ok' : 'warn' },
          { k: L('Revenue', 'Revenue'), v: rpj(pr.rev), s: t(L('Kontribusi ', 'Contribution ')) + rpj(pr.contrib), icon: 'coins' },
          { k: L('Margin rendah', 'Low margin'), v: n0(cnt.low || 0), s: t(L('layanan', 'services')), icon: 'alert', tone: cnt.low ? 'warn' : 'ok', go: 'PRICE-001', q: { st: 'low' } },
          { k: L('Di bawah HPP', 'Below HPP'), v: n0(cnt.below || 0), s: t(L('layanan', 'services')), icon: 'xc', tone: cnt.below ? 'crit' : 'ok', go: 'PRICE-001', q: { st: 'below' } },
          { k: L('Perlu review', 'Review required'), v: n0(cnt.review || 0), s: t(L('layanan', 'services')), icon: 'clock', tone: cnt.review ? 'appr' : 'ok', go: 'PRICE-001', q: { st: 'review' } }
        ]) +
        fxStrip(t(L('Harga jual = realisasi rata-rata ', 'Selling price = realised average ')) + esc(mon(pr.p)) + t(L(' (Revenue ÷ Volume); harga master di bawahnya.', ' (Revenue ÷ Volume); master price below it.'))) +
        (worst ? P.rec({ title: L('Harga yang perlu ditindak', 'Price that needs action'), tone: worst.st === 'below' ? 'crit' : 'warn', chip: stc(F.PRICE_ST, worst.st),
          sig: L(F.svcName(worst.svc) + ': gross margin ' + worst.margin + '% (markup ' + worst.markup + '%)', F.svcName(worst.svc) + ': gross margin ' + worst.margin + '% (markup ' + worst.markup + '%)'),
          why: [L('HPP ' + rp(worst.hpp) + ' per ' + unitN(worst.unit) + ', harga realisasi ' + rp(worst.price), 'HPP ' + rp(worst.hpp) + ' per ' + unitN(worst.unit) + ', realised price ' + rp(worst.price)), L('Ambang sehat = margin ≥ ' + pr.cfg.healthy + '%', 'Healthy threshold = margin ≥ ' + pr.cfg.healthy + '%')],
          impact: L('Selisih ke harga rekomendasi ' + rp(worst.gap) + ' × ' + n0(worst.vol) + ' ' + unitN(worst.unit) + ' = ' + rpj(worst.gap * worst.vol) + ' per bulan', 'Gap to the recommended price ' + rp(worst.gap) + ' × ' + n0(worst.vol) + ' ' + unitN(worst.unit) + ' = ' + rpj(worst.gap * worst.vol) + ' per month'),
          rec: L('Review ke ' + rp(worst.rec.price) + ' (' + T(methodN(worst.rec.method)) + ' ' + worst.rec.target + '%)', 'Review to ' + rp(worst.rec.price) + ' (' + methodN(worst.rec.method)[1] + ' ' + worst.rec.target + '%)'),
          act: { n: L('Buka detail harga', 'Open the price detail'), s: 'PRICE-002', rec: worst.svc } }) : '') +
        card(L('Harga per layanan', 'Price per service'), tabs([['', L('Semua', 'All'), null, rows.length]].concat(Object.keys(F.PRICE_ST).map(function (k) { return [k, F.PRICE_ST[k][0], null, cnt[k] || 0]; })), st, 'st', { def: '' }) +
          P.table(list, priceCols(), priceCard, function (r) { return href('PRICE-002', r.svc); }, { empty: L('Tidak ada layanan dengan status ini.', 'No service with this status.') }), { icon: 'tag', count: list.length }) +
        '<div class="g21-10">' + card(L('Profit per tier layanan', 'Profit per service tier'), tierTbl, { icon: 'layers' }) + cfgCard() + '</div>';
    },
    act: { cfg: function () { cfgDlg(); } }
  };

  /* ---------- PRICE-002 Pricing Detail ---------- */
  function priceDlg(svc) {
    var d = F.priceDetail(cx(), svc); if (!d) return;
    var r = d.row, rc = d.rec[F.priceCfg().method];
    dlg({ title: L('Ubah Harga Master · versi baru', 'Change Master Price · new version'), icon: 'tag', ok: L('Simpan versi harga', 'Save price version'),
      sub: '<b>' + svcN(svc) + '</b> · ' + t(L('Harga master sekarang ', 'Current master price ')) + rp(r.master) + ' · HPP ' + rp(r.hpp) + '<br>' + t(L('Harga lama tidak ditimpa: tersimpan sebagai versi di riwayat. Harga kontrak klien (Fase 6) tidak berubah.', 'The old price is never overwritten: it stays as a version in the history. Client contract prices (Phase 6) do not change.')),
      body: g2(fld(L('Harga baru (Rp per ' + unitN(r.unit) + ')', 'New price (Rp per ' + unitN(r.unit) + ')'), inp('price', rc.price || r.master, { num: true }), { req: true }) + fld(L('Tanggal berlaku', 'Effective date'), inp('eff', today(), { type: 'date' }), { req: true, hint: t(L('Tidak boleh mundur.', 'Cannot be backdated.')) })) +
        '<p class="su10-pv" id="su10-pv"></p>' + fld(L('Alasan', 'Reason'), area('reason', '', L('Contoh: HPP naik, margin di bawah target', 'Example: HPP rose, margin below target')), { req: true, wide: true }),
      after: function (el) {
        var i = el.querySelector('[name=price]'), pv = el.querySelector('#su10-pv');
        function upd() { var p = +String(i.value).replace(/[^\d.]/g, ''); pv.innerHTML = p ? t(L('Gross margin ', 'Gross margin ')) + '<b>' + pct(F.margin(p, r.hpp)) + '</b> · ' + t(L('Markup ', 'Markup ')) + '<b>' + pct(F.markup(p, r.hpp)) + '</b> · ' + t(L('status ', 'status ')) + stc(F.PRICE_ST, F.priceStatus(p, r.hpp)) : ''; }
        i.addEventListener('input', upd); upd();
      },
      onOk: function (v, el) { v = P.vals(el); var x = F.setPrice(cx(), svc, v.price, v.eff, v.reason); if (!x.ok) return x.msg; P.after(L('Versi harga baru tersimpan. Versi lama tetap di riwayat.', 'New price version saved. The old version stays in the history.')); return true; } });
  }
  V['PRICE-002'] = {
    title: function (rec) { return rec ? L('Harga · ' + F.svcName(rec), 'Pricing · ' + F.svcName(rec)) : null; },
    render: function (c) {
      var pr = F.pricing(cx()); if (!pr) return noAccess();
      if (!c.rec) return P.deskOnly() + P.head(t(L('Pilih layanan untuk melihat harga master, harga kontrak dan riwayat versi.', 'Choose a service to see its master price, contract prices and version history.')), '', pricingFresh(pr.p)) +
        card(L('Layanan', 'Services'), P.table(priceRows(pr), priceCols({ short: true }), priceCard, function (r) { return href('PRICE-002', r.svc); }), { icon: 'tag' });
      var d = F.priceDetail(cx(), c.rec); if (!d) return notFound('PRICE-001', L('Ringkasan Harga', 'Pricing Overview'));
      var r = d.row, cfg = F.priceCfg(), sv = F.svc(c.rec) || {};
      var asc = d.hist.slice().sort(function (a, b) { return a.eff < b.eff ? -1 : a.eff > b.eff ? 1 : (a.at || '') < (b.at || '') ? -1 : 1; });
      var curV = asc.filter(function (h) { return h.eff <= today(); }).pop();
      var histTbl = P.table(asc.slice().reverse(), [
        { h: L('Versi', 'Version'), v: function (h) { return '<b>v' + (asc.indexOf(h) + 1) + '</b>'; } },
        { h: L('Harga', 'Price'), cls: 'r num', v: function (h) { return rp(h.price); } },
        { h: L('Sebelumnya', 'Previous'), cls: 'r num', v: function (h) { return h.from ? rp(h.from) : '—'; } },
        { h: L('Berlaku', 'Effective'), v: function (h) { return esc(dt(h.eff)); } },
        { h: L('Oleh', 'By'), v: function (h) { return emp(h.by) + (h.at ? sub(esc(dt(h.at))) : ''); } },
        { h: L('Alasan', 'Reason'), v: function (h) { return esc(T(h.reason) || '—'); } },
        { h: L('Status', 'Status'), v: function (h) { return h.eff > today() ? A.chip('info', L('Terjadwal', 'Scheduled'), 'calendar') : h === curV ? A.chip('ok', L('Berlaku', 'Current'), 'checkc') : A.chip('mute', L('Riwayat', 'History'), 'history'); } }
      ], function (h) { return { t: 'v' + (asc.indexOf(h) + 1) + ' · ' + rp(h.price), r: esc(dt(h.eff)), s: emp(h.by) + ' · ' + esc(T(h.reason) || '') }; });
      var clTbl = P.table(d.clients, [
        { h: L('Klien / property', 'Client / property'), v: function (x) { return lnk('CLIENT-002', x.cl, P.cname(x.cl)) + sub(P.pname(x.prop)); } },
        { h: L('Rate card', 'Rate card'), v: function (x) { return x.rc ? mono(x.rc) : '—'; } },
        { h: L('Harga kontrak', 'Contract price'), cls: 'r num', v: function (x) { return rp(x.rate); } },
        { h: L('Volume', 'Volume'), cls: 'r num', v: function (x) { return n0(x.qty) + ' ' + unitN(r.unit); } },
        { h: L('Revenue', 'Revenue'), cls: 'r num', v: function (x) { return rpj(x.rev); } },
        { h: L('Markup', 'Markup'), cls: 'r num', v: function (x) { return pct(x.markup); } },
        { h: L('Gross margin', 'Gross margin'), cls: 'r num', v: function (x) { return '<b>' + pct(x.margin) + '</b>'; } },
        { h: L('Status', 'Status'), v: function (x) { return stc(F.PRICE_ST, x.st); } }
      ], function (x) { return { t: P.cname(x.cl), r: rp(x.rate), s: P.pname(x.prop) + ' · ' + t(L('margin ', 'margin ')) + pct(x.margin), chip: stc(F.PRICE_ST, x.st) }; }, null, { empty: L('Belum ada harga kontrak klien untuk layanan ini.', 'No client contract price for this service yet.') });
      function recBox(k) {
        var x = d.rec[k], on = cfg.method === k;
        return '<div class="su10-rb' + (on ? ' on' : '') + '"><span class="su10-rb-k">' + t(methodN(k)) + ' ' + pct(x.target, 0) + (on ? ' ' + A.chip('ok', L('metode aktif', 'active method')) : '') + '</span>' +
          '<span class="su10-rb-f">' + t(x.formula) + '</span><span class="su10-rb-n num">' + recFx(r.hpp, x) + '</span>' +
          '<span class="su10-rb-s">' + t(L('Hasil: gross margin ', 'Result: gross margin ')) + pct(F.margin(x.price, r.hpp)) + ' · markup ' + pct(F.markup(x.price, r.hpp)) + '</span></div>';
      }
      return P.deskOnly() + P8.hero({ id: c.rec, icon: 'tag', title: svcN(c.rec), sub: tierN(r.tier) + ' · ' + t(L('per ', 'per ')) + unitN(r.unit) + ' · ' + t(L('periode HPP ', 'HPP period ')) + esc(mon(pr.p)),
          chips: stc(F.PRICE_ST, r.st) + ' ' + pricingFresh(pr.p),
          facts: [[L('HPP / unit', 'HPP / unit'), rp(r.hpp)], [L('Harga master', 'Master price'), rp(r.master)], [L('Harga realisasi', 'Realised price'), rp(r.price)],
            [L('Gross margin', 'Gross margin'), pct(r.margin)], [L('Markup', 'Markup'), pct(r.markup)], [L('Kontribusi', 'Contribution'), rpj(r.contrib)]] }) +
        fxStrip() +
        '<div class="g2-10">' + card(L('Tingkat harga', 'Price levels'), kv([
            [L('Harga master (Fase 6)', 'Master price (Phase 6)'), '<b>' + rp(sv.price != null ? sv.price : r.master) + '</b>' + sub(t(L('margin ', 'margin ')) + pct(r.mMargin) + ' · markup ' + pct(r.mMarkup))],
            [L('Harga layanan (realisasi)', 'Service price (realised)'), rp(r.price) + sub(t(L('Revenue ÷ volume ', 'Revenue ÷ volume ')) + esc(mon(pr.p)) + ' = ' + rpj(r.rev) + ' ÷ ' + n0(r.vol))],
            [L('Harga kontrak klien', 'Client contract prices'), d.clients.length ? rp(Math.min.apply(null, d.clients.map(function (x) { return x.rate; }))) + ' – ' + rp(Math.max.apply(null, d.clients.map(function (x) { return x.rate; }))) + sub(d.clients.length + ' ' + t(L('kontrak', 'contracts'))) : '—'],
            [L('Perubahan terakhir', 'Last change'), r.last ? esc(dt(r.last.eff)) + ' · ' + rp(r.last.price) : '—']]) +
            '<div class="su10-ar">' + (can('price.edit') ? A.btn('primary', L('Ubah harga (versi baru)', 'Change price (new version)'), 'edit', { act: 'price', val: c.rec }) : '<span class="sub5">' + t(L('Perubahan harga hanya oleh Owner.', 'Price changes by the Owner only.')) + '</span>') +
            A.btn('ghost', L('Simulasikan', 'Simulate'), 'zap', { go: 'PRICE-004', qs: 'svc=' + c.rec }) + '</div>', { icon: 'layers' }) +
          card(L('Harga rekomendasi', 'Recommended price'), '<div class="su10-rbs">' + recBox('margin') + recBox('markup') + '</div>' + note(t(L('Margin dan markup memberi harga berbeda untuk target yang sama angkanya. Metode yang dipakai selalu ditulis.', 'Margin and markup give different prices for the same target number. The method used is always written.')), 'info'), { icon: 'bulb' }) + '</div>' +
        card(L('Harga kontrak klien (Fase 6)', 'Client contract prices (Phase 6)'), clTbl, { icon: 'hotel', count: d.clients.length }) +
        card(L('Riwayat versi harga', 'Price version history'), note(t(L('Setiap perubahan harga membuat versi baru. Harga historis tidak pernah ditimpa.', 'Every price change creates a new version. Historical prices are never overwritten.')), 'history') + histTbl, { icon: 'history', count: asc.length });
    },
    act: { price: function (el) { priceDlg(val(el)); } }
  };

  /* ---------- PRICE-003 Recommendation ---------- */
  V['PRICE-003'] = {
    render: function (c) {
      var rv = F.priceReview(cx()); if (!rv) return noAccess();
      var cfg = F.priceCfg(), p = F.pricing(cx()).p;
      var up = rv.filter(function (r) { return r.gap > 0; }), act = up.filter(function (r) { return ['below', 'low', 'review'].indexOf(r.st) >= 0; });
      var gain = sum(up.map(function (r) { return r.gap * r.vol; }));
      var tbl = P.table(rv, [
        { h: L('Layanan', 'Service'), v: function (r) { return svcLink(r.svc) + sub(tierN(r.tier) + ' · ' + t(L('per ', 'per ')) + unitN(r.unit)); } },
        { h: L('HPP', 'HPP'), cls: 'r num', v: function (r) { return rp(r.hpp); } },
        { h: L('Harga saat ini', 'Current price'), cls: 'r num', v: function (r) { return rp(r.price); } },
        { h: L('Gross margin', 'Gross margin'), cls: 'r num', v: function (r) { return pct(r.margin); } },
        { h: L('Markup', 'Markup'), cls: 'r num', v: function (r) { return pct(r.markup); } },
        { h: L('Metode · rumus', 'Method · formula'), v: function (r) { return '<b>' + t(methodN(r.rec.method)) + ' ' + pct(r.rec.target, 0) + '</b>' + sub(recFx(r.hpp, r.rec)); } },
        { h: L('Rekomendasi', 'Recommended'), cls: 'r num', v: function (r) { return '<b>' + rp(r.rec.price) + '</b>'; } },
        { h: L('Gap', 'Gap'), cls: 'r num', v: function (r) { return '<span class="' + (r.gap > 0 ? 'su10-up' : '') + '">' + sgn(r.gap, rp) + '</span>' + sub(sgn(r.gapPct, function (v) { return pct(v); })); } },
        { h: L('Metode lain', 'Other method'), cls: 'r num', v: function (r) { return rp(r.alt.price) + sub(t(methodN(r.alt.method)) + ' ' + pct(r.alt.target, 0)); } },
        { h: L('Status', 'Status'), v: function (r) { return stc(F.PRICE_ST, r.st); } }
      ], function (r) { return { t: svcN(r.svc), r: rp(r.rec.price), s: t(L('sekarang ', 'now ')) + rp(r.price) + ' · gap ' + sgn(r.gap, rp) + ' · ' + t(methodN(r.rec.method)), chip: stc(F.PRICE_ST, r.st) }; }, function (r) { return href('PRICE-002', r.svc); });
      var cards = act.slice(0, 3).map(function (r) {
        return P.rec({ title: L(F.svcName(r.svc), F.svcName(r.svc)), tone: r.st === 'below' ? 'crit' : 'warn', chip: stc(F.PRICE_ST, r.st),
          sig: L('Gross margin ' + r.margin + '% · markup ' + r.markup + '% · harga ' + rp(r.price) + ' vs rekomendasi ' + rp(r.rec.price), 'Gross margin ' + r.margin + '% · markup ' + r.markup + '% · price ' + rp(r.price) + ' vs recommended ' + rp(r.rec.price)),
          why: [L('Metode ' + T(methodN(r.rec.method)) + ': ' + T(r.rec.formula) + ' = ' + rp(r.hpp) + (r.rec.method === 'margin' ? ' ÷ (1 − ' : ' × (1 + ') + r.rec.target + '%) = ' + rp(r.rec.price), 'Method ' + methodN(r.rec.method)[1] + ': ' + r.rec.formula[1] + ' = ' + rp(r.hpp) + (r.rec.method === 'margin' ? ' ÷ (1 − ' : ' × (1 + ') + r.rec.target + '%) = ' + rp(r.rec.price)),
            L('HPP ' + mon(p) + ' per ' + unitN(r.unit) + ' = ' + rp(r.hpp), 'HPP ' + mon(p) + ' per ' + unitN(r.unit) + ' = ' + rp(r.hpp)),
            r.last ? L('Harga terakhir diubah ' + dt(r.last.eff), 'Price last changed ' + dt(r.last.eff)) : L('Belum ada riwayat perubahan', 'No change history')],
          impact: L('+' + rpj(r.gap * r.vol) + ' revenue dan profit per bulan pada volume ' + n0(r.vol) + ' ' + unitN(r.unit) + ' (volume diasumsikan tetap)', '+' + rpj(r.gap * r.vol) + ' revenue and profit per month at ' + n0(r.vol) + ' ' + unitN(r.unit) + ' (volume assumed unchanged)'),
          rec: L('Usulkan versi harga ' + rp(r.rec.price) + ' (+' + r.gapPct + '%); uji dulu di simulasi', 'Propose price version ' + rp(r.rec.price) + ' (+' + r.gapPct + '%); test it in the scenario first'),
          act: A.btn('primary', L('Simulasikan', 'Simulate'), 'zap', { go: 'PRICE-004', qs: 'svc=' + r.svc + '&method=' + r.rec.method + '&target=' + r.rec.target, cls: 'btn-sm' }) + ' ' + A.btn('ghost', L('Detail harga', 'Price detail'), 'arrow', { go: 'PRICE-002', rec: r.svc, cls: 'btn-sm' }) });
      }).join('');
      return P.deskOnly() + P.head(t(L('Harga rekomendasi per layanan dengan metode dan rumus yang dipakai.', 'Recommended price per service with the method and formula used.')), A.btn('ghost', L('Simulasi', 'Scenario'), 'zap', { go: 'PRICE-004' }), pricingFresh(p)) +
        P.kpis([
          { k: L('Metode aktif', 'Active method'), v: t(methodN(cfg.method)), s: cfg.method === 'margin' ? t(L('HPP ÷ (1 − ', 'HPP ÷ (1 − ')) + cfg.targetMargin + '%)' : t(L('HPP × (1 + ', 'HPP × (1 + ')) + cfg.targetMarkup + '%)', icon: 'bulb' },
          { k: L('Di bawah rekomendasi', 'Below recommendation'), v: n0(up.length), s: t(L('layanan', 'services')), icon: 'arrowup', tone: up.length ? 'warn' : 'ok' },
          { k: L('Perlu tindakan', 'Need action'), v: n0(act.length), s: t(L('rendah / di bawah HPP / review', 'low / below HPP / review')), icon: 'alert', tone: act.length ? 'crit' : 'ok' },
          { k: L('Potensi per bulan', 'Potential per month'), v: rpj(gain), s: t(L('jika semua ke rekomendasi (asumsi volume tetap)', 'if all move to the recommendation (volume assumed unchanged)')), icon: 'coins' }
        ]) + fxStrip() + cards +
        card(L('Rekomendasi per layanan', 'Recommendation per service'), tbl, { icon: 'bulb', count: rv.length }) +
        (can('price.edit') || can('cfo.th') ? '' : note(t(L('Metode dan target diatur oleh Owner / Finance di Ringkasan Harga.', 'Method and targets are set by the Owner / Finance on the Pricing Overview.')), 'lock'));
    }
  };

  /* ---------- PRICE-004 Price Scenario ---------- */
  var SCN_KEYS = ['svc', 'method', 'hpp', 'target', 'price', 'vol'];
  V['PRICE-004'] = {
    render: function (c) {
      var pr = F.pricing(cx()); if (!pr) return noAccess();
      var q = c.q, o = {}; SCN_KEYS.forEach(function (k) { if (q[k] != null && q[k] !== '') o[k] = q[k]; });
      o.svc = o.svc || (pr.rows.some(function (x) { return x.svc === 'SV-001'; }) ? 'SV-001' : pr.rows[0].svc);
      var r = F.priceScenario(cx(), o); if (!r) return notFound('PRICE-001');
      var row = r.row, cfg = F.priceCfg(), m = o.method || 'price';
      var changed = { hpp: o.hpp != null, vol: o.vol != null, price: m !== 'price' || o.price != null };
      var form = '<form class="card su10-sf" id="su10-sf" onsubmit="return false"><h2 class="h5">' + ic('edit') + t(L('Asumsi simulasi', 'Scenario assumptions')) + '</h2>' +
        '<div class="fg5 su10-g3">' + fld(L('Layanan', 'Service'), sel('svc', pr.rows.map(function (x) { return [x.svc, F.svcName(x.svc)]; }), o.svc), { wide: true }) +
        fld(L('Cara menentukan harga', 'How the price is set'), sel('method', [['price', L('Harga jual langsung', 'Selling price directly')], ['margin', methodN('margin')], ['markup', methodN('markup')]], m)) +
        fld(L('Target %', 'Target %'), inp('target', o.target || (m === 'markup' ? cfg.targetMarkup : cfg.targetMargin), { num: true }), { hint: t(L('Dipakai bila metode margin / markup.', 'Used with the margin / markup method.')) }) +
        fld(L('Harga jual (Rp)', 'Selling price (Rp)'), inp('price', o.price || '', { num: true, ph: L('sekarang ' + Math.round(row.price), 'now ' + Math.round(row.price)) })) +
        fld(L('Asumsi HPP / unit (Rp)', 'HPP / unit assumption (Rp)'), inp('hpp', o.hpp || '', { num: true, ph: 'HPP ' + Math.round(row.hpp) })) +
        fld(L('Asumsi volume / bulan', 'Volume / month assumption'), inp('vol', o.vol || '', { num: true, ph: n0(row.vol) + ' ' + unitN(row.unit) })) + '</div>' +
        '<div class="su10-ar">' + A.btn('primary', L('Hitung', 'Calculate'), 'zap', { act: 'calc' }) + A.btn('ghost', L('Reset', 'Reset'), 'refresh', { go: 'PRICE-004', qs: 'svc=' + o.svc }) + '</div></form>';
      function line(lab, a, b, f, asm) { var d = b - a; return '<tr><th>' + t(lab) + (asm ? ' ' + A.chip('appr', L('asumsi', 'assumption')) : '') + '</th><td class="r num">' + f(a) + '</td><td class="r num"><b>' + f(b) + '</b></td><td class="r num ' + (d > 0 ? 'su10-up' : d < 0 ? 'su10-neg' : '') + '">' + (Math.abs(d) < 0.05 ? '—' : sgn(d, f)) + '</td></tr>'; }
      var cmp = '<div class="tblw"><table class="tbl dense mt10"><thead><tr><th></th><th class="r">' + t(L('Saat ini', 'Current')) + '</th><th class="r">' + t(L('Skenario', 'Scenario')) + '</th><th class="r">' + t(L('Selisih', 'Difference')) + '</th></tr></thead><tbody>' +
        line(L('Harga jual / ' + unitN(row.unit), 'Selling price / ' + unitN(row.unit)), r.cur.price, r.nw.price, rp, changed.price) +
        line(L('HPP / ' + unitN(row.unit), 'HPP / ' + unitN(row.unit)), r.cur.hpp, r.nw.hpp, rp, changed.hpp) +
        line(L('Volume / bulan', 'Volume / month'), r.cur.vol, r.nw.vol, n0, changed.vol) +
        line(L('Revenue / bulan', 'Revenue / month'), r.cur.rev, r.nw.rev, rp) +
        line(L('Kontribusi (profit kotor) / bulan', 'Contribution (gross profit) / month'), r.contrib0, r.contrib1, rp) +
        line(L('Gross margin %', 'Gross margin %'), r.cur.margin, r.nw.margin, function (v) { return pct(v); }) +
        line(L('Markup %', 'Markup %'), r.cur.markup, r.nw.markup, function (v) { return pct(v); }) + '</tbody></table></div>' +
        (m !== 'price' ? note(t(L('Harga skenario dari ', 'Scenario price from ')) + '<b>' + t(methodN(m)) + '</b>: ' + recFx(r.nw.hpp, { method: m, target: +o.target || 0, price: r.nw.price }), 'percent') : '');
      var bep = r.bep ? kv([[L('BEP revenue perusahaan sekarang', 'Company BEP revenue now'), rp(r.bep.bep0)], [L('BEP revenue dengan skenario', 'BEP revenue with the scenario'), '<b>' + (r.bep.bep1 ? rp(r.bep.bep1) : '—') + '</b>' + (r.bep.bep1 ? sub(sgn(r.bep.bep1 - r.bep.bep0, rp)) : '')],
        [L('Revenue perusahaan', 'Company revenue'), rp(r.bep.rev0) + ' → ' + rp(r.bep.rev1)]]) + sub(t(L('BEP = biaya tetap ÷ rasio margin kontribusi (perilaku biaya HPP terakhir).', 'BEP = fixed cost ÷ contribution margin ratio (latest HPP cost behaviour).'))) : A.empty(L('Data BEP belum tersedia.', 'BEP data not available.'));
      var saved = (S().pscn || []);
      var savedTbl = P.table(saved, [
        { h: L('Skenario', 'Scenario'), v: function (s) { return '<a class="lnk5" href="' + href('PRICE-004', null, s.inp) + '">' + mono(s.id) + ' · ' + esc(s.n) + '</a>'; } },
        { h: L('Layanan', 'Service'), v: function (s) { return svcN(s.inp.svc); } },
        { h: L('Harga skenario', 'Scenario price'), cls: 'r num', v: function (s) { return rp(s.out.price); } },
        { h: L('Gross margin', 'Gross margin'), cls: 'r num', v: function (s) { return pct(s.out.margin); } },
        { h: L('Δ profit / bulan', 'Δ profit / month'), cls: 'r num', v: function (s) { return sgn(s.out.dProfit, rpj); } },
        { h: L('Oleh', 'By'), v: function (s) { return emp(s.by) + sub(esc(dt(s.at))); } }
      ], function (s) { return { t: esc(s.n), r: rp(s.out.price), s: mono(s.id) + ' · ' + pct(s.out.margin) }; }, null, { empty: L('Belum ada skenario tersimpan.', 'No saved scenario yet.') });
      return P.deskOnly() + P.head(t(L('Simulasi harga: hasil di bawah adalah asumsi, bukan fakta. Harga tidak berubah.', 'Price simulation: the results below are assumptions, not facts. Prices do not change.')),
          can('price.scn') ? A.btn('primary', L('Simpan skenario', 'Save scenario'), 'download', { act: 'save' }) : '', P.fresh({ kind: 'snapshot', src: L('Simulasi · HPP ' + mon(pr.p), 'Simulation · HPP ' + mon(pr.p)) })) +
        form + card(L('Hasil skenario · ' + F.svcName(r.svc), 'Scenario result · ' + F.svcName(r.svc)), cmp, { icon: 'zap', right: A.chip('appr', L('SIMULASI', 'SIMULATION'), 'zap') }) +
        '<div class="g2-10">' + card(L('Efek ke BEP', 'Effect on BEP'), bep, { icon: 'target' }) +
        card(L('Asumsi', 'Assumptions'), '<ul class="su10-as">' + r.assume.map(function (a) { return '<li>' + A.chip('appr', L('ASUMSI', 'ASSUMPTION')) + '<span>' + t(a) + '</span></li>'; }).join('') + '</ul>', { icon: 'help' }) + '</div>' +
        card(L('Skenario tersimpan', 'Saved scenarios'), savedTbl, { icon: 'list', count: saved.length });
    },
    act: {
      calc: function () { var v = P.vals(document.getElementById('su10-sf')), q = {}; SCN_KEYS.forEach(function (k) { if (v[k] !== '' && v[k] != null) q[k] = v[k]; }); if (q.method === 'price') delete q.target; location.hash = href('PRICE-004', null, q); },
      save: function () {
        var q = A.S.q, o = {}; SCN_KEYS.forEach(function (k) { if (q[k] != null && q[k] !== '') o[k] = q[k]; });
        dlg({ title: L('Simpan Skenario Harga', 'Save Price Scenario'), icon: 'download', sub: t(L('Skenario disimpan dengan asumsinya. Harga tidak berubah.', 'The scenario is saved with its assumptions. Prices do not change.')),
          body: fld(L('Nama skenario', 'Scenario name'), inp('name', F.svcName(o.svc || 'SV-001') + ' · ' + today()), { req: true, wide: true }),
          onOk: function (v, el) { v = P.vals(el); var r = F.saveScenarioPrice(cx(), o, v.name); if (!r.ok) return r.msg; P.after(L('Skenario ' + r.scn.id + ' tersimpan.', 'Scenario ' + r.scn.id + ' saved.')); return true; } });
      }
    }
  };

  /* ---------- PRICE-005 Client Profitability ---------- */
  V['PRICE-005'] = {
    render: function (c) {
      var key = c.q.by === 'prop' ? 'prop' : 'cl', cp = F.clientProfit(cx(), key); if (!cp) return noAccess();
      var rows = cp.rows.slice().sort(function (a, b) { return b.rev - a.rev; }), cfg = F.priceCfg();
      var rev = sum(rows.map(function (r) { return r.rev; })), ar = sum(rows.map(function (r) { return r.ar; }));
      var low = rows.filter(function (r) { return r.margin < cfg.low; }), minR = rows.slice().sort(function (a, b) { return a.margin - b.margin; })[0];
      var trap = rows.slice(0, 3).filter(function (r) { return r.margin < cp.avgMargin || (r.dso || 0) > 45; })[0];
      function nm(r) { return key === 'prop' ? P.pname(r.k) + sub(P.cname(r.cl)) : lnk('CLIENT-002', r.cl, P.cname(r.cl)); }
      var cols = [
        { h: key === 'prop' ? L('Property / klien', 'Property / client') : L('Klien', 'Client'), v: function (r) { return '<b>' + nm(r) + '</b>'; } },
        { h: L('Revenue', 'Revenue'), cls: 'r num', v: function (r) { return rpj(r.rev); } },
        { h: L('Biaya langsung · alokasi', 'Direct · allocated cost'), cls: 'r num', v: function (r) { return rpj(r.direct) + sub(rpj(r.alloc)); } },
        { h: L('Kontribusi', 'Contribution'), cls: 'r num', v: function (r) { return rpj(r.contrib) + sub(pct(r.cm)); } },
        { h: L('Gross margin', 'Gross margin'), cls: 'r num', v: function (r) { return '<b class="' + (r.margin < cfg.low ? 'su10-neg' : '') + '">' + pct(r.margin) + '</b>'; } },
        { h: L('kg-eq', 'kg-eq'), cls: 'r num', v: function (r) { return n0(r.kgeq); } },
        { h: L('AR · DSO', 'AR · DSO'), cls: 'r num', v: function (r) { return (r.ar ? rpj(r.ar) : '—') + sub(r.dso == null ? '—' : 'DSO ' + n0(r.dso) + ' ' + t(L('hr', 'd'))); } },
        { h: 'SLA', cls: 'r num', v: function (r) { return r.sla == null ? '—' : pct(r.sla); } },
        { h: L('Health', 'Health'), v: function (r) { return r.health == null ? '—' : A.chip(P.tone(r.healthSt), String(Math.round(r.health))); } }
      ];
      return P.deskOnly() + P.head(t(L('Profitabilitas per ', 'Profitability per ')) + t(key === 'prop' ? L('property', 'property') : L('klien', 'client')) + ' · HPP ' + esc(mon(cp.p)) + ' · ' + t(L('data sensitif: Finance & Owner', 'sensitive data: Finance & Owner')), '',
          P.fresh({ kind: 'mixed', src: L('HPP ' + mon(cp.p) + ' + AR live', 'HPP ' + mon(cp.p) + ' + live AR') })) +
        P.kpis([
          { k: L('Revenue', 'Revenue'), v: rpj(rev), s: rows.length + ' ' + t(key === 'prop' ? L('property', 'properties') : L('klien', 'clients')), icon: 'coins' },
          { k: L('Rata-rata gross margin', 'Average gross margin'), v: pct(cp.avgMargin), s: t(L('(Revenue − biaya) ÷ Revenue', '(Revenue − cost) ÷ Revenue')), icon: 'percent' },
          { k: L('Margin terendah', 'Lowest margin'), v: minR ? pct(minR.margin) : '—', s: minR ? (key === 'prop' ? P.pname(minR.k) : P.cname(minR.cl)) : '', icon: 'arrowdn', tone: minR && minR.margin < cfg.low ? 'crit' : 'warn' },
          { k: L('Margin < ambang rendah', 'Margin < low threshold'), v: n0(low.length), s: t(L('ambang ', 'threshold ')) + pct(cfg.low, 0), icon: 'alert', tone: low.length ? 'warn' : 'ok' },
          { k: L('AR terbuka', 'Open AR'), v: rpj(ar), icon: 'clock', go: P.open('AR-004') ? 'AR-004' : null }
        ]) +
        note('<b>' + t(cp.note) + '</b>', 'info', 'warn') +
        (trap ? P.rec({ title: L('Revenue tinggi ≠ klien sehat', 'High revenue ≠ healthy client'), tone: 'warn',
          sig: L((key === 'prop' ? F.propName(trap.k) : F.clientName(trap.cl)) + ': revenue #' + (rows.indexOf(trap) + 1) + ' tetapi margin ' + trap.margin + '% (rata-rata ' + cp.avgMargin + '%)', (key === 'prop' ? F.propName(trap.k) : F.clientName(trap.cl)) + ': revenue #' + (rows.indexOf(trap) + 1) + ' but margin ' + trap.margin + '% (average ' + cp.avgMargin + '%)'),
          why: [L('Biaya per kg ' + rp(trap.perKg) + ' · volume ' + n0(trap.kgeq) + ' kg-eq', 'Cost per kg ' + rp(trap.perKg) + ' · volume ' + n0(trap.kgeq) + ' kg-eq'), L('AR terbuka ' + rpj(trap.ar) + (trap.dso != null ? ' · DSO ' + trap.dso + ' hari' : ''), 'Open AR ' + rpj(trap.ar) + (trap.dso != null ? ' · DSO ' + trap.dso + ' days' : ''))],
          impact: L('Setiap 1 poin margin = ' + rpj(trap.rev / 100) + ' per bulan', 'Every margin point = ' + rpj(trap.rev / 100) + ' per month'),
          rec: L('Review harga kontrak dan mix layanan klien ini sebelum perpanjangan', 'Review this client\'s contract prices and service mix before renewal'),
          act: { n: L('Buka rekomendasi harga', 'Open the price recommendation'), s: 'PRICE-003' } }) : '') +
        card(L('Profitabilitas', 'Profitability'), tabs([['cl', L('Per klien', 'Per client'), 'hotel'], ['prop', L('Per property', 'Per property'), 'building']], key, 'by', { def: 'cl', seg: true }) +
          P.table(rows, cols, function (r) { return { t: key === 'prop' ? P.pname(r.k) : P.cname(r.cl), r: pct(r.margin), s: rpj(r.rev) + ' · ' + t(L('kontribusi ', 'contribution ')) + rpj(r.contrib) + (r.dso != null ? ' · DSO ' + n0(r.dso) : '') }; }), { icon: 'hotel', count: rows.length }) +
        sub(t(L('Biaya langsung = porsi variabel + semi-variabel HPP; biaya alokasi = porsi tetap. Kontribusi = Revenue − biaya langsung.', 'Direct cost = variable + semi-variable share of HPP; allocated cost = fixed share. Contribution = Revenue − direct cost.')));
    }
  };

  /* =====================================================================
     NP-08 INVENTORY (iPad first)
     ===================================================================== */
  var OPN_ST = { count: [L('Penghitungan', 'Counting'), 'info'], review: [L('Menunggu Persetujuan', 'Waiting for Approval'), 'appr'], approved: [L('Disetujui', 'Approved'), 'ok'] };
  // Stock level against min / reorder point / max.
  function level(x) {
    var mx = Math.max(x.max, x.qty, 1), st = F.stockSt(x), tn = F.STOCK_ST[st][1];
    function p(v) { return Math.max(0, Math.min(100, v / mx * 100)).toFixed(1); }
    return '<span class="su10-lv" role="img" aria-label="' + esc(x.qty + ' / ' + x.max) + '"><i class="t-' + tn + '" style="width:' + Math.max(1.5, p(x.qty)) + '%"></i><em class="mn" style="left:' + p(x.min) + '%"></em><em class="rp" style="left:' + p(x.rop) + '%"></em></span>';
  }
  function stockOpts() { return S().stock.map(function (x) { return [x.code, x.code + ' · ' + T(x.n)]; }); }
  // PR dialog (§46): item, qty, needed date, reason, department, cost centre, priority, budget reference.
  function prDlg(code, qty, reason) {
    var it = code ? F.stock(code) : null;
    dlg({ title: L('Buat Purchase Request', 'Create Purchase Request'), icon: 'file', ok: L('Simpan PR', 'Save PR'),
      sub: t(L('PR dicatat atas nama Anda. Aturan persetujuan dihitung dari nilai, kategori dan pemohon.', 'The PR is recorded in your name. The approval rule follows value, category and requester.')),
      body: g2(fld(L('Item', 'Item'), sel('item', stockOpts(), code || ''), { req: true, wide: true }) +
        fld(L('Qty', 'Qty'), inp('qty', qty || '', { num: true }), { req: true, hint: it ? t(L('Satuan ', 'Unit ')) + esc(it.unit) + ' · ' + t(L('stok ', 'stock ')) + n0(it.qty) : '' }) +
        fld(L('Tanggal dibutuhkan', 'Needed by'), inp('need', F.u.addDays(today(), it ? (F.supplier(it.sup) || {}).lead || 5 : 5), { type: 'date' }), { req: true }) +
        fld(L('Departemen', 'Department'), sel('dept', D.DEPTS, 'OPS')) + fld(L('Cost center', 'Cost centre'), sel('cc', D.CC.map(function (x) { return [x[0], x[0] + ' · ' + T(x[1])]; }), 'CC-PRD')) +
        fld(L('Prioritas', 'Priority'), sel('pri', P.opts(F.PRIO), 'normal')) + fld(L('Referensi budget', 'Budget reference'), inp('bud', 'BUD-' + today().slice(2, 4) + today().slice(5, 7) + '-' + (it && /^CHM/.test(it.code) ? 'CHEM' : 'OPS'))) +
        fld(L('Alasan', 'Reason'), area('reason', reason || '', L('Kenapa barang ini dibutuhkan?', 'Why is this needed?')), { req: true, wide: true }) +
        '<label class="su10-cb f5-w"><input type="checkbox" name="submit" checked><span>' + t(L('Langsung ajukan untuk persetujuan', 'Submit for approval right away')) + '</span></label>'),
      onOk: function (v, el) { v = P.vals(el); var r = F.createPr(cx(), v); if (!r.ok) return r.msg; var rule = F.prRule(r.pr); P.after(L('PR ' + r.pr.id + ' tersimpan · persetujuan: ' + (rule.lvl === 'owner' ? 'Owner' : 'Finance'), 'PR ' + r.pr.id + ' saved · approval: ' + (rule.lvl === 'owner' ? 'Owner' : 'Finance'))); return true; } });
  }
  // Movement dialog (§41): issue, transfer, return, waste with source, reason, evidence. Receipts only via PO receiving.
  function moveDlg(code) {
    var it = code ? F.stock(code) : null;
    dlg({ title: L('Catat Mutasi Stok', 'Record Stock Movement'), icon: 'swap', ok: L('Simpan mutasi', 'Save movement'),
      sub: t(L('Penerimaan barang lewat receiving PO; penyesuaian lewat pengajuan. Setiap mutasi menyimpan user, waktu dan bukti.', 'Goods receipts go through PO receiving; adjustments through a request. Every movement keeps user, time and evidence.')),
      body: g2(fld(L('Item', 'Item'), sel('item', stockOpts(), code || ''), { req: true, wide: true }) +
        fld(L('Jenis', 'Type'), sel('type', ['issue', 'transfer', 'return', 'waste'].map(function (k) { return [k, F.MV_TYPES[k][0]]; }), 'issue'), { req: true }) +
        fld(L('Qty', 'Qty'), inp('qty', '', { num: true }), { req: true, hint: it ? t(L('Stok ', 'Stock ')) + n0(it.qty) + ' ' + esc(it.unit) : '' }) +
        fld(L('Tujuan (transfer / issue)', 'Destination (transfer / issue)'), sel('to', [['', L('Otomatis', 'Automatic')]].concat(Object.keys(D.LOCS).map(function (k) { return [k, D.LOCS[k]]; })), '')) +
        fld(L('Sumber (batch / WO / dokumen)', 'Source (batch / WO / document)'), inp('src', '', { ph: 'B-2610-… / WO-… / TRF-…' }), { req: true }) +
        fld(L('Alasan', 'Reason'), area('reason', '', L('Wajib untuk waste', 'Required for waste')), { wide: true }) +
        fld(L('Bukti (no. foto / dokumen)', 'Evidence (photo / document no.)'), inp('ev', ''), { wide: true })),
      onOk: function (v, el) { v = P.vals(el); var r = F.recordMove(cx(), v); if (!r.ok) return r.msg; P.after(L('Mutasi ' + r.move.id + ' tercatat. Stok ' + r.item.code + ' = ' + r.item.qty + ' ' + r.item.unit + '.', 'Movement ' + r.move.id + ' recorded. Stock ' + r.item.code + ' = ' + r.item.qty + ' ' + r.item.unit + '.'), r.st === 'aman' ? 'ok' : 'warn'); return true; } });
  }
  // Adjustment request (§44): never silent — old, new, variance, reason, evidence; approval above the threshold by another person.
  function adjDlg(code) {
    var it = F.stock(code); if (!it) return;
    var thr = S().scfg.adjApproval;
    dlg({ title: L('Ajukan Penyesuaian Stok', 'Request Stock Adjustment'), icon: 'edit', ok: L('Ajukan', 'Submit'),
      sub: '<b>' + esc(it.code) + ' · ' + t(it.n) + '</b><br>' + t(L('Selisih bernilai > ' + rp(thr) + ' butuh persetujuan orang lain (Ops Manager / Owner). Di bawahnya langsung diterapkan dan tetap diaudit.', 'A variance worth > ' + rp(thr) + ' needs approval by another person (Ops Manager / Owner). Below it the change applies at once and is still audited.')),
      body: g2(fld(L('Qty sistem (lama)', 'System qty (old)'), inp('old', it.qty + ' ' + it.unit, { ro: true })) + fld(L('Qty baru', 'New qty'), inp('nw', '', { num: true }), { req: true }) +
        '<p class="su10-pv f5-w" id="su10-adj"></p>' +
        fld(L('Alasan', 'Reason'), area('reason', '', L('Contoh: hitung fisik gudang, jerigen bocor', 'Example: physical store count, leaking jerrycan')), { req: true, wide: true }) +
        fld(L('Bukti (no. foto / berita acara)', 'Evidence (photo / record no.)'), inp('ev', ''), { wide: true })),
      after: function (el) {
        var i = el.querySelector('[name=nw]'), o = el.querySelector('#su10-adj');
        function upd() { var n = parseFloat(String(i.value).replace(',', '.')); if (isNaN(n)) { o.innerHTML = ''; return; } var vq = n - it.qty, vv = Math.round(vq * it.avg); o.innerHTML = t(L('Selisih ', 'Variance ')) + '<b>' + sgn(vq) + ' ' + esc(it.unit) + '</b> · ' + t(L('nilai ', 'value ')) + '<b>' + sgn(vv, rp) + '</b> · ' + (Math.abs(vv) > thr ? A.chip('appr', L('Butuh persetujuan', 'Needs approval'), 'lock') : A.chip('info', L('Langsung diterapkan', 'Applies at once'))); }
        i.addEventListener('input', upd);
      },
      onOk: function (v, el) { v = P.vals(el); var r = F.requestAdjust(cx(), code, v.nw, v.reason, v.ev); if (!r.ok) return r.msg; P.after(r.pending ? L('Pengajuan ' + r.adj.id + ' menunggu persetujuan.', 'Request ' + r.adj.id + ' is waiting for approval.') : L('Penyesuaian ' + r.adj.id + ' diterapkan dan diaudit.', 'Adjustment ' + r.adj.id + ' applied and audited.'), r.pending ? 'warn' : 'ok'); return true; } });
  }
  function adjApprove(id) { var a = by(S().adj, 'id', id); P.confirmDlg({ title: L('Setujui Penyesuaian ' + id, 'Approve Adjustment ' + id), icon: 'checkc', ok: L('Setujui', 'Approve'), sub: a ? '<b>' + esc(a.item) + '</b> ' + n0(a.old) + ' → ' + n0(a.nw) + ' · ' + sgn(a.varV, rp) + '<br>' + esc(a.reason) : '', fn: function () { return F.decideAdjust(cx(), id, true); }, done: L('Penyesuaian disetujui dan stok diperbarui.', 'Adjustment approved and stock updated.') }); }
  function adjReject(id) { P.reasonDlg({ title: L('Tolak Penyesuaian ' + id, 'Reject Adjustment ' + id), icon: 'xc', ok: L('Tolak', 'Reject'), fn: function (reason) { return F.decideAdjust(cx(), id, false, reason); }, done: L('Penyesuaian ditolak.', 'Adjustment rejected.'), tone: 'warn' }); }
  function adjTable(list, o) {
    o = o || {};
    return P.table(list, [
      { h: L('Pengajuan', 'Request'), v: function (a) { return mono(a.id) + sub(esc(dt(a.at))); } },
      o.noItem ? null : { h: L('Item', 'Item'), v: function (a) { return stockLink(a.item) + sub(t(F.stockName(a.item))); } },
      { h: L('Lama → baru', 'Old → new'), cls: 'r num', v: function (a) { return n0(a.old) + ' → <b>' + n0(a.nw) + '</b>'; } },
      { h: L('Selisih', 'Variance'), cls: 'r num', v: function (a) { return sgn(a.varQ) + sub(sgn(a.varV, rp)); } },
      { h: L('Alasan · bukti', 'Reason · evidence'), v: function (a) { return esc(a.reason) + (a.ev ? sub(esc(a.ev)) : ''); } },
      { h: L('Diajukan', 'Requested'), v: function (a) { return emp(a.by); } },
      { h: L('Status', 'Status'), v: function (a) { return stc(F.ADJ_ST, a.st) + (a.appr && a.st === 'applied' ? sub(t(L('oleh ', 'by ')) + emp(a.appr)) : '') + (a.rej ? sub(esc(T(a.rej))) : ''); } },
      { h: '', cls: 'r', v: function (a) { return a.st === 'pending' && can('inv.approve') ? '<span class="su10-bb">' + A.btn('primary', L('Setujui', 'Approve'), 'check', { act: 'adjOk', val: a.id, cls: 'btn-sm' }) + A.btn('ghost', L('Tolak', 'Reject'), 'x', { act: 'adjNo', val: a.id, cls: 'btn-sm' }) + '</span>' : a.mv ? mono(a.mv) : ''; } }
    ].filter(Boolean), function (a) { return { t: esc(a.item) + ' · ' + n0(a.old) + ' → ' + n0(a.nw), r: sgn(a.varV, rpj), s: esc(a.reason) + ' · ' + emp(a.by), chip: stc(F.ADJ_ST, a.st) + (a.st === 'pending' && can('inv.approve') ? ' ' + A.btn('primary', L('Setujui', 'Approve'), 'check', { act: 'adjOk', val: a.id, cls: 'btn-sm' }) + A.btn('ghost', L('Tolak', 'Reject'), 'x', { act: 'adjNo', val: a.id, cls: 'btn-sm' }) : '') }; }, null, { empty: o.empty || L('Tidak ada pengajuan.', 'No requests.') });
  }
  var INV_ACT = { adjOk: function (el) { adjApprove(val(el)); }, adjNo: function (el) { adjReject(val(el)); }, pr: function (el) { var x = (val(el) || '').split('|'); prDlg(x[0], x[1], x[2]); }, move: function (el) { moveDlg(val(el)); }, adj: function (el) { adjDlg(val(el)); } };
  function invTile(x) {
    return '<a class="su10-al su10-al-' + F.STOCK_ST[F.stockSt(x)][1] + '" href="' + href('INV-003', x.code) + '"><span class="su10-al-ic">' + ic('package') + '</span><span class="su10-al-b"><b>' + t(x.n) + '</b><small>' + esc(x.code) + ' · ' + t(L('stok ', 'stock ')) + n0(x.qty) + ' ' + esc(x.unit) + ' · min ' + n0(x.min) + '</small></span>' + stockSt(x) + '</a>';
  }

  /* ---------- INV-001 Inventory Dashboard ---------- */
  V['INV-001'] = {
    render: function () {
      var c0 = cx(), list = F.stockList(c0); if (!list.length && !can('inv.view')) return noAccess();
      var cnt = { aman: 0, menipis: 0, critical: 0, habis: 0 }; list.forEach(function (x) { cnt[F.stockSt(x)]++; });
      var tot = sum(list.map(F.stockValue)), cons = F.consumption(c0), ro = F.reorder(c0), pend = F.adjustments(c0).filter(function (a) { return a.st === 'pending'; });
      var so = F.opnames(c0).filter(function (o) { return o.st !== 'approved'; })[0];
      var alerts = list.filter(function (x) { var s = F.stockSt(x); return s === 'critical' || s === 'habis'; });
      var byCat = {}; list.forEach(function (x) { byCat[x.cat] = (byCat[x.cat] || 0) + F.stockValue(x); });
      var roTbl = P.table(ro, [
        { h: L('Item', 'Item'), v: function (r) { return stockLink(r.it.code) + sub(t(r.it.n)); } },
        { h: L('Stok', 'Stock'), cls: 'r num', v: function (r) { return n0(r.it.qty) + ' ' + esc(r.it.unit) + sub('ROP ' + n0(r.it.rop)); } },
        { h: L('Status', 'Status'), v: function (r) { return stc(F.STOCK_ST, r.st); } },
        { h: L('Saran qty', 'Suggested qty'), cls: 'r num', v: function (r) { return '<b>' + n0(r.qty) + '</b>' + sub(t(L('sampai max ', 'up to max ')) + n0(r.it.max)); } },
        { h: L('Supplier', 'Supplier'), v: function (r) { return supLink(r.sup); } },
        { h: L('Dokumen terbuka', 'Open document'), v: function (r) { return r.po ? poLink(r.po.id) : r.pr ? prLink(r.pr.id) + sub(stc(F.PR_ST, r.pr.st)) : '<span class="sub5">' + t(L('belum ada', 'none yet')) + '</span>'; } },
        { h: '', cls: 'r', v: function (r) { return !r.pr && !r.po && can('pur.pr') ? A.btn('primary', L('Buat PR', 'Create PR'), 'plus', { act: 'pr', val: r.it.code + '|' + r.qty + '|' + T(L('Saran reorder: stok ', 'Reorder suggestion: stock ')) + r.it.qty + ' ≤ ROP ' + r.it.rop, cls: 'btn-sm' }) : ''; } }
      ], function (r) { return { t: t(r.it.n), r: n0(r.qty) + ' ' + esc(r.it.unit), s: esc(r.it.code) + ' · ' + t(L('stok ', 'stock ')) + n0(r.it.qty) + (r.pr ? ' · ' + esc(r.pr.id) : r.po ? ' · ' + esc(r.po.id) : ''), chip: stc(F.STOCK_ST, r.st) + (!r.pr && !r.po && can('pur.pr') ? ' ' + A.btn('primary', L('Buat PR', 'Create PR'), 'plus', { act: 'pr', val: r.it.code + '|' + r.qty, cls: 'btn-sm' }) : '') }; }, null, { empty: L('Semua stok di atas reorder point.', 'All stock is above the reorder point.') });
      var consTbl = cons ? P.table(cons.rows.filter(function (r) { return r.used || r.waste; }), [
        { h: L('Item', 'Item'), v: function (r) { return stockLink(r.it.code) + sub(t(r.it.n)); } },
        { h: L('Dipakai', 'Used'), cls: 'r num', v: function (r) { return n0(z(r.used)) + ' ' + esc(r.it.unit); } },
        { h: L('Standar', 'Standard'), cls: 'r num', v: function (r) { return n0(r.std, 1) + sub(n0(r.stdPerK, 2) + ' / 1.000 kg'); } },
        { h: L('Aktual / 1.000 kg', 'Actual / 1,000 kg'), cls: 'r num', v: function (r) { return r.perK == null ? '—' : n0(r.perK, 2); } },
        { h: L('Varians', 'Variance'), cls: 'r num', v: function (r) { return r.varPct == null ? '—' : '<span class="' + (r.varPct > 5 ? 'su10-neg' : '') + '">' + sgn(r.varPct, function (v) { return pct(v); }) + '</span>'; } },
        { h: 'Waste', cls: 'r num', v: function (r) { return r.waste ? n0(r.waste) + sub(pct(r.wastePct)) : '—'; } },
        { h: L('Nilai', 'Value'), cls: 'r num', v: function (r) { return rpj(r.val); } }
      ], function (r) { return { t: t(r.it.n), r: n0(z(r.used)) + ' ' + esc(r.it.unit), s: t(L('varians ', 'variance ')) + sgn(r.varPct, function (v) { return pct(v); }) }; }) : '';
      var appr = can('inv.approve') && (pend.length || (so && so.st === 'review')) ? card(L('Menunggu persetujuan Anda', 'Waiting for your approval'),
        (pend.length ? adjTable(pend) : '') + (so && so.st === 'review' ? '<a class="su10-al su10-al-appr" href="' + href('INV-005', so.id) + '"><span class="su10-al-ic">' + ic('clipboard') + '</span><span class="su10-al-b"><b>' + t(L('Stock opname ', 'Stock count ')) + esc(so.id) + '</b><small>' + so.lines.length + ' ' + t(L('item · oleh ', 'items · by ')) + emp(so.by) + '</small></span>' + stc(OPN_ST, so.st) + '</a>' : ''), { icon: 'filecheck', count: pend.length + (so && so.st === 'review' ? 1 : 0) }) : '';
      return P.head(t(L('Nilai stok, status, konsumsi per kg dan saran pembelian.', 'Stock value, status, consumption per kg and purchase suggestions.')),
          A.pbtn('inv.move', 'ghost', L('Catat mutasi', 'Record movement'), 'swap', { act: 'move' }) + A.pbtn('pur.pr', 'primary', L('Buat PR', 'Create PR'), 'plus', { act: 'pr' }), freshLive(L('stok & mutasi', 'stock & movements'))) +
        P8.bigCount([
          { k: L('Aman', 'Safe'), v: String(cnt.aman), icon: 'checkc', tone: 'ok', go: 'INV-002', qs: { st: 'aman' } },
          { k: L('Menipis', 'Low'), v: String(cnt.menipis), icon: 'alert', tone: cnt.menipis ? 'warn' : '', go: 'INV-002', qs: { st: 'menipis' } },
          { k: L('Kritis', 'Critical'), v: String(cnt.critical), icon: 'alert', tone: cnt.critical ? 'crit' : '', go: 'INV-002', qs: { st: 'critical' } },
          { k: L('Habis', 'Out of stock'), v: String(cnt.habis), icon: 'xc', tone: cnt.habis ? 'crit' : '', go: 'INV-002', qs: { st: 'habis' } },
          { k: L('Saran PR', 'PR suggestions'), v: String(ro.filter(function (r) { return !r.pr && !r.po; }).length), icon: 'file', tone: 'warn' },
          { k: L('Pengajuan pending', 'Pending requests'), v: String(pend.length), icon: 'hourglass', tone: pend.length ? 'warn' : '', go: 'INV-004', qs: { tab: 'adj' } }
        ]) +
        (alerts.length ? card(L('Alert stok', 'Stock alerts'), '<div class="su10-als">' + alerts.map(invTile).join('') + '</div>', { icon: 'bell', count: alerts.length }) : '') + appr +
        '<div class="hide-m">' + P.kpis([
          { k: L('Nilai stok', 'Stock value'), v: rpj(tot), s: t(L('Σ qty × harga rata-rata', 'Σ qty × average cost')), icon: 'coins', go: 'INV-002' },
          cons ? { k: L('Bahan kimia / kg', 'Chemical / kg'), v: rp(cons.chemPerKg), s: n0(cons.kgeq) + ' kg-eq ' + esc(mon(cons.p)), icon: 'flask' } : null,
          cons ? { k: L('Kemasan / order', 'Packaging / order'), v: n0(cons.pkgPerOrder, 1) + ' pcs', s: t(L('plastik per order', 'bags per order')), icon: 'package' } : null,
          cons ? { k: L('Waste', 'Waste'), v: pct(cons.wastePct), s: t(L('nilai waste ÷ (pakai + waste)', 'waste value ÷ (used + waste)')), icon: 'trash', tone: cons.wastePct > S().scfg.wasteWarn ? 'warn' : 'ok' } : null
        ]) + '</div>' +
        card(L('Saran reorder', 'Reorder suggestions'), roTbl, { icon: 'refresh', count: ro.length, cls: 'hide-m' }) +
        '<div class="g21-10 hide-m">' + card(L('Konsumsi bulan ini vs standar', 'Consumption this month vs standard'), consTbl + sub(t(L('Standar = konsumsi per 1.000 kg-eq × volume kg-eq bulan ini; mengalir ke HPP.', 'Standard = consumption per 1,000 kg-eq × this month\'s kg-eq volume; it feeds HPP.'))), { icon: 'flask' }) +
        card(L('Nilai per kategori', 'Value per category'), A.hbars(Object.keys(byCat).sort(function (a, b) { return byCat[b] - byCat[a]; }).map(function (k) { return { l: D.STOCK_CATS[k] || k, v: byCat[k], go: 'INV-002', qs: 'cat=' + k }; }), { fmt: rpj }), { icon: 'chart', link: ['INV-002', L('Daftar stok', 'Stock list')] }) + '</div>';
    },
    act: INV_ACT
  };

  /* ---------- INV-002 Stock List ---------- */
  V['INV-002'] = {
    render: function (c) {
      var all = F.stockList(cx());
      var defs = [{ k: 'cat', l: L('Kategori', 'Category'), opts: Object.keys(D.STOCK_CATS).map(function (k) { return [k, D.STOCK_CATS[k]]; }), fn: function (x, v) { return x.cat === v; } },
        { k: 'st', l: L('Status', 'Status'), opts: Object.keys(F.STOCK_ST).map(function (k) { return [k, F.STOCK_ST[k][0]]; }), fn: function (x, v) { return F.stockSt(x) === v; } },
        { k: 'loc', l: L('Lokasi', 'Location'), opts: Object.keys(D.LOCS).filter(function (k) { return all.some(function (x) { return x.loc === k; }); }).map(function (k) { return [k, D.LOCS[k]]; }), fn: function (x, v) { return x.loc === v; } }];
      var rows = A.applyFilters(all, defs, function (x) { return x.code + ' ' + T(x.n) + ' ' + x.n[1]; });
      rows.sort(function (a, b) { var o = { habis: 0, critical: 1, menipis: 2, aman: 3 }; return o[F.stockSt(a)] - o[F.stockSt(b)] || (a.code < b.code ? -1 : 1); });
      return P.head(t(L('Item stok dengan min, reorder point, max, supplier, harga rata-rata dan lokasi.', 'Stock items with min, reorder point, max, supplier, average cost and location.')), A.pbtn('inv.move', 'ghost', L('Catat mutasi', 'Record movement'), 'swap', { act: 'move' }), freshLive(L('stok', 'stock'))) +
        A.filters(defs, { search: L('Cari kode atau nama', 'Search code or name') }) +
        card(L('Stok', 'Stock'), P.table(rows, [
          { h: L('Kode', 'Code'), v: function (x) { return stockLink(x.code); } },
          { h: L('Nama', 'Name'), v: function (x) { return '<b>' + t(x.n) + '</b>' + sub(catN(D.STOCK_CATS, x.cat)); } },
          { h: L('Qty', 'Qty'), cls: 'r num', v: function (x) { return '<b>' + n0(x.qty) + '</b> ' + esc(x.unit); } },
          { h: L('Level', 'Level'), v: function (x) { return level(x); } },
          { h: 'Min / ROP / Max', cls: 'r num', v: function (x) { return n0(x.min) + ' / ' + n0(x.rop) + ' / ' + n0(x.max); } },
          { h: L('Supplier utama', 'Preferred supplier'), v: function (x) { return supLink(x.sup); } },
          { h: L('Harga rata-rata', 'Average cost'), cls: 'r num', v: function (x) { return rp(x.avg); } },
          { h: L('Nilai', 'Value'), cls: 'r num', v: function (x) { return rpj(F.stockValue(x)); } },
          { h: L('Lokasi', 'Location'), v: function (x) { return mono(x.loc); } },
          { h: L('Status', 'Status'), v: function (x) { return stockSt(x); } }
        ], function (x) { return { t: t(x.n), r: n0(x.qty) + ' ' + esc(x.unit), s: esc(x.code) + ' · min ' + n0(x.min) + ' · ROP ' + n0(x.rop) + ' · ' + esc(x.loc), chip: stockSt(x) }; }, function (x) { return href('INV-003', x.code); }, { empty: L('Tidak ada item sesuai filter.', 'No item matches the filter.') }), { icon: 'list', count: rows.length });
    },
    act: INV_ACT
  };

  /* ---------- INV-003 Stock Detail ---------- */
  V['INV-003'] = {
    title: function (rec) { var x = rec && F.stock(rec); return x ? L(T(x.n), x.n[1]) : null; },
    render: function (c) {
      var c0 = cx();
      if (!c.rec) { var al = F.stockList(c0).filter(function (x) { return F.stockSt(x) !== 'aman'; }); return P.head(t(L('Pilih item stok.', 'Choose a stock item.')), A.btn('ghost', L('Daftar stok', 'Stock list'), 'list', { go: 'INV-002' })) + card(L('Perlu perhatian', 'Needs attention'), '<div class="su10-als">' + al.map(invTile).join('') + '</div>', { icon: 'bell' }); }
      var x = F.stock(c.rec); if (!x) return notFound('INV-002', L('Daftar Stok', 'Stock List'));
      var mv = F.moves(c0, { item: x.code }), cons = F.consumption(c0), cr = cons ? cons.rows.filter(function (r) { return r.it.code === x.code; })[0] : null;
      var adj = F.adjustments(c0).filter(function (a) { return a.item === x.code; }), prs = S().prs.filter(function (p) { return p.item === x.code; }), pos = S().pos.filter(function (p) { return p.lines.some(function (l) { return l[0] === x.code; }); });
      var ph = S().plogSup.filter(function (p) { return p.item === x.code; }).sort(function (a, b) { return a.date < b.date ? 1 : -1; });
      var ro = F.reorder(c0).filter(function (r) { return r.it.code === x.code; })[0];
      var mvTbl = P.table(mv, [
        { h: L('Waktu', 'Time'), v: function (m) { return esc(dt(m.at)) + sub(mono(m.id)); } },
        { h: L('Jenis', 'Type'), v: function (m) { return mvChip(m.type); } },
        { h: L('Qty', 'Qty'), cls: 'r num', v: function (m) { return '<b class="' + (m.qty < 0 ? 'su10-neg' : 'su10-up') + '">' + sgn(m.qty) + '</b>'; } },
        { h: L('Dari → ke', 'From → to'), v: function (m) { return locS(m.from) + ' → ' + locS(m.to); } },
        { h: L('Sumber · alasan', 'Source · reason'), v: function (m) { return mono(m.src || '—') + sub(esc(T(m.reason))); } },
        { h: L('User', 'User'), v: function (m) { return emp(m.by); } },
        { h: L('Jurnal', 'Journal'), v: function (m) { return m.jv ? jvLink(m.jv) : '—'; } }
      ], function (m) { return { t: t(F.MV_TYPES[m.type][0]) + ' · ' + sgn(m.qty) + ' ' + esc(m.unit), r: esc(dt(m.at)), s: esc(m.src || '') + ' · ' + emp(m.by) }; }, null, { empty: L('Belum ada mutasi.', 'No movements yet.') });
      var side = A.pbtn('inv.adjust', 'ghost', L('Ajukan penyesuaian', 'Request adjustment'), 'edit', { act: 'adj', val: x.code, cls: 'btn-xl' }) + A.pbtn('pur.pr', 'ghost', L('Buat PR', 'Create PR'), 'file', { act: 'pr', val: x.code + '|' + (ro ? ro.qty : Math.max(0, x.max - x.qty)), cls: 'btn-xl' });
      return P8.hero({ id: x.code, icon: x.cat === 'sparepart' ? 'wrench' : /^PKG|^OTH/.test(x.code) ? 'package' : 'flask', title: t(x.n), sub: catN(D.STOCK_CATS, x.cat) + ' · ' + locN(x.loc), chips: stockSt(x),
          facts: [[L('Qty', 'Qty'), n0(x.qty) + ' ' + esc(x.unit), 'num'], ['Min / ROP / Max', n0(x.min) + ' / ' + n0(x.rop) + ' / ' + n0(x.max), 'num'], [L('Harga rata-rata', 'Average cost'), rp(x.avg), 'num'], [L('Nilai stok', 'Stock value'), rp(F.stockValue(x)), 'num'],
            [L('Supplier utama', 'Preferred supplier'), supLink(x.sup)], [L('Akun persediaan', 'Inventory account'), P.accLink(x.gl)]], extra: '<div class="su10-lvw">' + level(x) + '<span class="sub5">0</span><span class="sub5">min ' + n0(x.min) + ' · ROP ' + n0(x.rop) + ' · max ' + n0(x.max) + '</span></div>' }) +
        (F.stockSt(x) !== 'aman' ? note(t(L('Stok ', 'Stock ')) + '<b>' + t(F.STOCK_ST[F.stockSt(x)][0]) + '</b>' + (ro && ro.pr ? ' · ' + t(L('PR terbuka ', 'open PR ')) + prLink(ro.pr.id) : ro && ro.po ? ' · ' + t(L('PO terbuka ', 'open PO ')) + poLink(ro.po.id) : ' · ' + t(L('belum ada PR / PO terbuka', 'no open PR / PO yet'))), 'alert', F.STOCK_ST[F.stockSt(x)][1]) : '') +
        '<div class="g21-10"><div class="col10">' + card(L('Mutasi', 'Movements'), mvTbl, { icon: 'swap', count: mv.length, link: ['INV-004', L('Semua mutasi', 'All movements')] }) +
        card(L('Penyesuaian', 'Adjustments'), adjTable(adj, { noItem: true, empty: L('Belum ada penyesuaian untuk item ini.', 'No adjustment for this item yet.') }), { icon: 'edit', count: adj.length }) + '</div><div class="col10">' +
        card(L('Konsumsi ' + mon(F.curPeriod()), 'Consumption ' + mon(F.curPeriod())), cr ? kv([[L('Dipakai', 'Used'), n0(z(cr.used)) + ' ' + esc(x.unit)], [L('Standar', 'Standard'), n0(cr.std, 1) + ' ' + esc(x.unit) + sub(n0(cr.stdPerK, 2) + ' / 1.000 kg-eq')], [L('Aktual / 1.000 kg-eq', 'Actual / 1,000 kg-eq'), cr.perK == null ? '—' : n0(cr.perK, 2)],
          [L('Varians', 'Variance'), sgn(cr.varPct, function (v) { return pct(v); })], ['Waste', n0(z(cr.waste)) + ' ' + esc(x.unit) + ' · ' + pct(z(cr.wastePct))], [L('Nilai pemakaian', 'Usage value'), rp(cr.val)]]) : A.empty(L('Item ini tidak dipakai per kg produksi.', 'This item is not consumed per production kg.')), { icon: 'flask' }) +
        card(L('PR & PO terkait', 'Related PRs & POs'), (prs.length || pos.length ? '<ul class="su10-ul">' + prs.map(function (p) { return '<li>' + prLink(p.id) + ' ' + stc(F.PR_ST, p.st) + '<span class="sub5">' + n0(p.qty) + ' ' + esc(x.unit) + ' · ' + esc(dt(p.at)) + '</span></li>'; }).join('') + pos.map(function (p) { return '<li>' + poLink(p.id) + ' ' + stc(F.PO_ST, p.st) + '<span class="sub5">' + esc(F.supName(p.sup)) + ' · ' + esc(dt(p.at)) + '</span></li>'; }).join('') + '</ul>' : A.empty(L('Tidak ada.', 'None.'))), { icon: 'file' }) +
        card(L('Riwayat harga supplier', 'Supplier price history'), ph.length ? P.table(ph, [{ h: L('Tanggal', 'Date'), v: function (p) { return esc(dt(p.date)); } }, { h: L('Supplier', 'Supplier'), v: function (p) { return supLink(p.sup); } }, { h: L('Harga', 'Price'), cls: 'r num', v: function (p) { return rp(p.price); } }], function (p) { return { t: esc(F.supName(p.sup)), r: rp(p.price), s: esc(dt(p.date)) }; }) : A.empty(L('Belum ada.', 'None yet.')), { icon: 'history' }) + '</div></div>' +
        P8.abar(A.pbtn('inv.move', 'primary', L('Catat mutasi', 'Record movement'), 'swap', { act: 'move', val: x.code, cls: 'btn-xl' }), side);
    },
    act: INV_ACT
  };

  /* ---------- INV-004 Stock Movement ---------- */
  V['INV-004'] = {
    render: function (c) {
      var c0 = cx(), tab = c.q.tab === 'adj' ? 'adj' : 'mv', type = c.q.type || '', all = F.moves(c0), adj = F.adjustments(c0), pend = adj.filter(function (a) { return a.st === 'pending'; });
      var cnt = {}; all.forEach(function (m) { cnt[m.type] = (cnt[m.type] || 0) + 1; });
      var rows = A.applyFilters(type ? all.filter(function (m) { return m.type === type; }) : all, [], function (m) { return m.id + ' ' + m.item + ' ' + T(F.stockName(m.item)) + ' ' + (m.src || ''); });
      var body = tab === 'adj' ? note(t(L('Tidak ada penyesuaian diam-diam: setiap perubahan menyimpan qty lama dan baru, selisih, alasan, user, waktu dan bukti. Di atas ' + rp(S().scfg.adjApproval) + ' disetujui orang lain.', 'No silent adjustment: every change keeps old and new qty, variance, reason, user, time and evidence. Above ' + rp(S().scfg.adjApproval) + ' another person approves.')), 'shield') + adjTable(adj) :
        tabs([['', L('Semua', 'All'), null, all.length]].concat(Object.keys(F.MV_TYPES).map(function (k) { return [k, F.MV_TYPES[k][0], F.MV_TYPES[k][2], cnt[k] || 0]; })), type, 'type', { def: '' }) +
        A.filters([], { search: L('Cari item, sumber, nomor', 'Search item, source, number') }) +
        P.table(rows, [
          { h: L('Waktu', 'Time'), v: function (m) { return esc(dt(m.at)) + sub(mono(m.id)); } },
          { h: L('Jenis', 'Type'), v: function (m) { return mvChip(m.type); } },
          { h: L('Item', 'Item'), v: function (m) { return stockLink(m.item) + sub(t(F.stockName(m.item))); } },
          { h: L('Qty', 'Qty'), cls: 'r num', v: function (m) { return '<b class="' + (m.qty < 0 ? 'su10-neg' : 'su10-up') + '">' + sgn(m.qty) + '</b> ' + esc(m.unit); } },
          { h: L('Dari → ke', 'From → to'), v: function (m) { return locS(m.from) + ' → ' + locS(m.to); } },
          { h: L('Sumber', 'Source'), v: function (m) { return mono(m.src || '—'); } },
          { h: L('Alasan', 'Reason'), v: function (m) { return esc(T(m.reason)); } },
          { h: L('User', 'User'), v: function (m) { return emp(m.by); } },
          { h: L('Bukti', 'Evidence'), v: function (m) { return m.ev ? mono(m.ev) : '—'; } },
          { h: L('Jurnal', 'Journal'), v: function (m) { return m.jv ? jvLink(m.jv) : '—'; } }
        ], function (m) { return { t: esc(m.item) + ' · ' + sgn(m.qty) + ' ' + esc(m.unit), r: esc(dt(m.at)), s: t(F.MV_TYPES[m.type][0]) + ' · ' + esc(m.src || '') + ' · ' + emp(m.by), chip: mvChip(m.type) }; }, function (m) { return href('INV-003', m.item); }, { empty: L('Tidak ada mutasi.', 'No movements.') });
      return P.head(t(L('Semua mutasi stok dengan sumber, alasan, user, waktu dan bukti.', 'Every stock movement with source, reason, user, time and evidence.')),
          A.pbtn('inv.move', 'primary', L('Catat mutasi', 'Record movement'), 'swap', { act: 'move' }), freshLive(L('mutasi', 'movements'))) +
        (pend.length && can('inv.approve') && tab !== 'adj' ? card(L('Penyesuaian menunggu persetujuan', 'Adjustments waiting for approval'), adjTable(pend), { icon: 'hourglass', count: pend.length }) : '') +
        tabs([['mv', L('Mutasi', 'Movements'), 'swap', all.length], ['adj', L('Penyesuaian', 'Adjustments'), 'edit', pend.length ? pend.length + ' pending' : adj.length]], tab, 'tab', { def: 'mv', seg: true }) +
        '<section class="card">' + body + '</section>';
    },
    act: INV_ACT
  };

  /* ---------- INV-005 Stock Opname ---------- */
  function saveCount(id) {
    var o = F.opname(id), f = document.getElementById('su10-so'); if (!o || !f) return { ok: false };
    var v = P.vals(f), n = 0, err = null;
    o.lines.forEach(function (l) { var p = v['p_' + l.item]; if (p === '' || p == null) return; var r = F.countOpname(cx(), id, l.item, p, v['r_' + l.item]); if (r.ok) n++; else err = r; });
    return err || { ok: true, n: n };
  }
  V['INV-005'] = {
    title: function (rec) { return rec ? L('Stock Opname ' + rec, 'Stock Count ' + rec) : null; },
    render: function (c) {
      var c0 = cx(), list = F.opnames(c0); if (!list.length && !can('inv.view')) return noAccess();
      var o = c.rec ? F.opname(c.rec) : list.filter(function (x) { return x.st !== 'approved'; })[0] || list[0];
      if (c.rec && !o) return notFound('INV-005');
      var running = list.some(function (x) { return x.st === 'count'; });
      var head = P.head(t(L('Hitung fisik vs sistem, selisih dan alasan. Persetujuan oleh orang lain, bukan penghitung.', 'Physical vs system count, variance and reason. Approved by another person, not the counter.')),
        !running ? A.pbtn('inv.adjust', 'primary', L('Mulai stock opname', 'Start a stock count'), 'plus', { act: 'start' }) : '', freshLive(L('stok', 'stock')));
      var hist = card(L('Riwayat stock opname', 'Stock count history'), P.table(list, [
        { h: L('Nomor', 'Number'), v: function (x) { return '<a class="lnk5" href="' + href('INV-005', x.id) + '">' + mono(x.id) + '</a>'; } },
        { h: L('Mulai', 'Started'), v: function (x) { return esc(dt(x.at)) + sub(emp(x.by)); } },
        { h: L('Item', 'Items'), cls: 'r num', v: function (x) { return n0(x.lines.length); } },
        { h: L('Selisih nilai', 'Value variance'), cls: 'r num', v: function (x) { return sgn(sum(F.opnameVar(x).map(function (l) { return l.varV || 0; })), rp); } },
        { h: L('Status', 'Status'), v: function (x) { return stc(OPN_ST, x.st) + (x.appr ? sub(t(L('oleh ', 'by ')) + emp(x.appr)) : ''); } }
      ], function (x) { return { t: esc(x.id), r: stc(OPN_ST, x.st), s: esc(dt(x.at)) + ' · ' + emp(x.by) }; }, function (x) { return href('INV-005', x.id); }), { icon: 'history', count: list.length });
      if (!o) return head + hist;
      var vv = F.opnameVar(o), varV = sum(vv.map(function (l) { return l.varV || 0; })), diff = vv.filter(function (l) { return l.varQ; }), counted = vv.filter(function (l) { return l.phys != null; }).length;
      var edit = o.st === 'count' && can('inv.adjust');
      var tbl = '<form id="su10-so" onsubmit="return false">' + P.table(vv, [
        { h: L('Item', 'Item'), v: function (l) { return stockLink(l.item) + sub(l.it ? t(l.it.n) : ''); } },
        { h: L('Sistem', 'System'), cls: 'r num', v: function (l) { return n0(l.sys) + ' ' + esc(l.it ? l.it.unit : ''); } },
        { h: L('Fisik', 'Physical'), cls: 'r num', v: function (l) { return edit ? '<input class="su10-in" name="p_' + esc(l.item) + '" inputmode="decimal" value="' + (l.phys == null ? '' : l.phys) + '" aria-label="' + esc(l.item) + '">' : '<b>' + (l.phys == null ? '—' : n0(l.phys)) + '</b>'; } },
        { h: L('Selisih qty', 'Qty variance'), cls: 'r num', v: function (l) { return l.varQ == null ? '—' : '<b class="' + (l.varQ < 0 ? 'su10-neg' : l.varQ > 0 ? 'su10-up' : '') + '">' + sgn(l.varQ) + '</b>'; } },
        { h: L('Selisih nilai', 'Value variance'), cls: 'r num', v: function (l) { return l.varV == null ? '—' : sgn(l.varV, rp); } },
        { h: L('Alasan', 'Reason'), v: function (l) { return edit ? '<input class="su10-in su10-in-w" name="r_' + esc(l.item) + '" value="' + esc(T(l.reason) || '') + '" placeholder="' + t(L('wajib bila ada selisih', 'required if different')) + '">' : esc(T(l.reason) || '—'); } }
      ], function (l) { return { t: esc(l.item) + ' · ' + (l.it ? t(l.it.n) : ''), r: l.varQ == null ? '—' : sgn(l.varQ), s: t(L('sistem ', 'system ')) + n0(l.sys) + ' · ' + t(L('fisik ', 'physical ')) + (l.phys == null ? '—' : n0(l.phys)) + (l.reason ? ' · ' + esc(T(l.reason)) : '') }; }) + '</form>';
      var main = o.st === 'review' ? A.pbtn('inv.approve', 'primary', L('Setujui stock opname', 'Approve stock count'), 'checkc', { act: 'approve', val: o.id, cls: 'btn-xl' }) :
        edit ? A.btn('primary', L('Ajukan untuk persetujuan', 'Submit for approval'), 'upload', { act: 'submit', val: o.id, cls: 'btn-xl' }) : '';
      var side = edit ? A.btn('ghost', L('Simpan hitungan', 'Save count'), 'check', { act: 'count', val: o.id, cls: 'btn-xl' }) : '';
      return head + P8.hero({ id: o.id, icon: 'clipboard', title: t(L('Stock opname ', 'Stock count ')) + esc(dt(o.at).slice(0, 11)), sub: t(L('Dihitung oleh ', 'Counted by ')) + emp(o.by) + (o.sub ? ' · ' + t(L('diajukan ', 'submitted ')) + esc(dt(o.sub)) : ''), chips: stc(OPN_ST, o.st),
          facts: [[L('Item', 'Items'), n0(o.lines.length)], [L('Sudah dihitung', 'Counted'), n0(counted) + ' / ' + n0(o.lines.length)], [L('Item berselisih', 'Items with variance'), n0(diff.length)], [L('Selisih nilai', 'Value variance'), sgn(varV, rp), varV < 0 ? 'su10-neg' : ''],
            [L('Disetujui', 'Approved'), o.appr ? emp(o.appr) + ' · ' + esc(dt(o.apprAt)) : '—']] }) +
        (o.st === 'review' ? note(t(L('Persetujuan membuat penyesuaian untuk setiap selisih (jurnal ke 5900) dan dicatat di audit. Penghitung tidak bisa menyetujui hitungannya sendiri.', 'Approval creates an adjustment for every variance (journal to 5900) and is audited. The counter cannot approve their own count.')), 'shield', 'warn') : '') +
        card(L('Baris hitung', 'Count lines'), tbl, { icon: 'clipboard', count: o.lines.length }) +
        (o.st === 'approved' ? card(L('Penyesuaian dari opname ini', 'Adjustments from this count'), adjTable(F.adjustments(c0).filter(function (a) { return a.ref === o.id; })), { icon: 'edit' }) : '') + hist +
        (main || side ? P8.abar(main, side) : '');
    },
    act: {
      start: function () { P.confirmDlg({ title: L('Mulai Stock Opname', 'Start a Stock Count'), icon: 'clipboard', ok: L('Mulai', 'Start'), sub: t(L('Semua item stok dimasukkan dengan qty sistem saat ini. Hitung fisik lalu ajukan.', 'Every stock item is added with its current system qty. Count physically, then submit.')), fn: function () { var r = F.startOpname(cx()); if (r.ok) setTimeout(function () { P.go('INV-005', r.op.id); }, 50); return r; }, done: L('Stock opname dimulai.', 'Stock count started.') }); },
      count: function (el) { var r = saveCount(val(el)); if (!r.ok) return P.fail(r); P.after(L(r.n + ' baris hitungan tersimpan.', r.n + ' count lines saved.')); },
      submit: function (el) {
        var id = val(el), s = saveCount(id); if (!s.ok) return P.fail(s);
        var r = F.submitOpname(cx(), id); if (!r.ok) { A.rerender(); return P.fail(r); } P.after(L('Stock opname diajukan untuk persetujuan.', 'Stock count submitted for approval.'));
      },
      approve: function (el) {
        var id = val(el), o = F.opname(id), vv = F.opnameVar(o), varV = sum(vv.map(function (l) { return l.varV || 0; }));
        P.confirmDlg({ title: L('Setujui Stock Opname ' + id, 'Approve Stock Count ' + id), icon: 'checkc', ok: L('Setujui', 'Approve'),
          sub: t(L('Selisih ', 'Variances ')) + vv.filter(function (l) { return l.varQ; }).length + ' item · ' + t(L('nilai ', 'value ')) + '<b>' + sgn(varV, rp) + '</b><br>' + t(L('Setiap selisih menjadi penyesuaian stok dengan jurnal dan audit.', 'Every variance becomes a stock adjustment with a journal and audit.')),
          fn: function () { return F.approveOpname(cx(), id); }, done: L('Stock opname disetujui. Penyesuaian diterapkan.', 'Stock count approved. Adjustments applied.') });
      }
    }
  };

  /* =====================================================================
     NP-09 PURCHASING & SUPPLIERS (iPad first)
     ===================================================================== */
  var SUP_ST = { active: [L('Aktif', 'Active'), 'ok'], hold: [L('Ditahan', 'On Hold'), 'warn'], blocked: [L('Diblokir', 'Blocked'), 'crit'] };
  function itemN(code) { return t(F.stockName(code)); }
  function itemL(code) { return F.stock(code) ? stockLink(code) : mono(code); }
  function ruleChip(p) { var r = F.prRule(p); return A.chip(r.lvl === 'owner' ? 'appr' : 'info', r.lvl === 'owner' ? L('Owner', 'Owner') : L('Finance', 'Finance'), 'shield'); }
  function myEmp() { return F.empId(cx()); }
  function rulesBox(p) {
    var r = F.prRule(p), it = F.stock(p.item), cat = it ? it.cat : 'machine';
    var hit = { 0: r.lvl === 'finance', 1: r.amt > D.PR_RULES[0].lim, 2: cat === 'machine' || /^CAPEX/.test(p.item), 3: true };
    return '<ul class="su10-rules">' + D.PR_RULES.map(function (x, i) { return '<li class="' + (hit[i] ? 'on' : '') + '">' + ic(hit[i] ? 'checkc' : 'minus') + '<span>' + t(x.l) + '</span></li>'; }).join('') + '</ul>' +
      '<p class="su10-pv">' + t(L('Nilai PR = qty × harga estimasi = ', 'PR value = qty × estimated price = ')) + n0(p.qty) + ' × ' + rp(p.est) + ' = <b>' + rp(r.amt) + '</b> → ' + ruleChip(p) + '</p>';
  }
  function prDecide(id, act) {
    var p = F.pr(id); if (!p) return;
    var lab = { approve: [L('Setujui PR ', 'Approve PR '), L('Setujui', 'Approve'), 'checkc', L('PR disetujui.', 'PR approved.')], review: [L('Minta Review PR ', 'Request Review of PR '), L('Kirim ke review', 'Send to review'), 'refresh', L('PR dikembalikan untuk review.', 'PR sent back for review.')], reject: [L('Tolak PR ', 'Reject PR '), L('Tolak', 'Reject'), 'xc', L('PR ditolak.', 'PR rejected.')] }[act];
    P.reasonDlg({ title: L(T(lab[0]) + id, lab[0][1] + id), icon: lab[2], ok: lab[1], optional: act === 'approve', label: act === 'approve' ? L('Catatan (opsional)', 'Note (optional)') : L('Alasan', 'Reason'),
      sub: '<b>' + itemN(p.item) + '</b> · ' + n0(p.qty) + ' · ' + rp(F.prAmount(p)) + ' · ' + t(L('pemohon ', 'requester ')) + emp(p.pic),
      fn: function (reason) { return F.decidePr(cx(), id, act, reason); }, done: lab[3], tone: act === 'approve' ? 'ok' : 'warn' });
  }
  var PR_ACT = {
    prNew: function (el) { var x = (val(el) || '').split('|'); prDlg(x[0], x[1], x[2]); },
    prSubmit: function (el) { var r = F.submitPr(cx(), val(el)); if (!r.ok) return P.fail(r); P.after(L('PR diajukan untuk persetujuan.', 'PR submitted for approval.')); },
    prOk: function (el) { prDecide(val(el), 'approve'); }, prRev: function (el) { prDecide(val(el), 'review'); }, prNo: function (el) { prDecide(val(el), 'reject'); }
  };
  function prCols() {
    return [
      { h: L('PR', 'PR'), v: function (p) { return prLink(p.id) + sub(esc(dt(p.at))); } },
      { h: L('Item', 'Item'), v: function (p) { return '<b>' + itemN(p.item) + '</b>' + sub(esc(p.item)); } },
      { h: L('Qty', 'Qty'), cls: 'r num', v: function (p) { return n0(p.qty) + ' ' + esc((F.stock(p.item) || {}).unit || ''); } },
      { h: L('Nilai est.', 'Est. value'), cls: 'r num', v: function (p) { return rpj(F.prAmount(p)); } },
      { h: L('Dibutuhkan', 'Needed'), v: function (p) { return esc(dt(p.need)); } },
      { h: L('Dept · CC', 'Dept · CC'), v: function (p) { return esc(p.dept) + sub(esc(p.cc)); } },
      { h: 'PIC', v: function (p) { return emp(p.pic); } },
      { h: L('Prioritas', 'Priority'), v: function (p) { return stc(F.PRIO, p.pri); } },
      { h: L('Persetujuan', 'Approval'), v: function (p) { return ruleChip(p); } },
      { h: L('Status', 'Status'), v: function (p) { return stc(F.PR_ST, p.st); } }
    ];
  }
  function prCard(p) { return { t: esc(p.id) + ' · ' + itemN(p.item), r: rpj(F.prAmount(p)), s: n0(p.qty) + ' · ' + t(L('butuh ', 'needed ')) + esc(dt(p.need)) + ' · ' + emp(p.pic), chip: stc(F.PR_ST, p.st) + ' ' + stc(F.PRIO, p.pri) }; }
  function poCols() {
    return [
      { h: 'PO', v: function (p) { return poLink(p.id) + sub(esc(dt(p.at))); } },
      { h: L('Supplier', 'Supplier'), v: function (p) { return supLink(p.sup); } },
      { h: L('Item', 'Items'), v: function (p) { return itemN(p.lines[0][0]) + (p.lines.length > 1 ? sub('+' + (p.lines.length - 1) + ' ' + t(L('item lain', 'more'))) : ''); } },
      { h: L('Total', 'Total'), cls: 'r num', v: function (p) { return rpj(F.poTotal(p)); } },
      { h: L('Kirim', 'Delivery'), v: function (p) { return '<span class="' + (p.dlv < today() && ['approved', 'sent', 'partial'].indexOf(p.st) >= 0 ? 'su10-neg' : '') + '">' + esc(dt(p.dlv)) + '</span>'; } },
      { h: L('Diterima', 'Received'), v: function (p) { var q = sum(p.lines.map(function (l) { return l[1]; })), r = sum(p.rcv); return P.bar(r, q, r >= q ? 'ok' : r ? 'warn' : 'info') + sub(pct(q ? r / q * 100 : 0, 0)); } },
      { h: L('Status', 'Status'), v: function (p) { return stc(F.PO_ST, p.st) + (p.capex ? ' ' + A.chip('appr', 'Capex', 'lock') : ''); } }
    ];
  }
  function poCard(p) { return { t: esc(p.id) + ' · ' + esc(F.supName(p.sup)), r: rpj(F.poTotal(p)), s: itemN(p.lines[0][0]) + ' · ' + t(L('kirim ', 'delivery ')) + esc(dt(p.dlv)), chip: stc(F.PO_ST, p.st) + (p.capex ? ' ' + A.chip('appr', 'Capex', 'lock') : '') }; }
  function supRating(v) { return v == null ? '—' : '<span class="su10-rt">' + ic('star') + '<b class="num">' + n0(v, 1) + '</b></span>'; }

  /* ---------- PUR-001 Purchasing Dashboard ---------- */
  V['PUR-001'] = {
    render: function () {
      var c0 = cx(), d = F.purDash(c0); if (!d) return noAccess();
      var due = d.poOpen.filter(function (p) { return ['approved', 'sent', 'partial'].indexOf(p.st) >= 0; }).sort(function (a, b) { return a.dlv < b.dlv ? -1 : 1; });
      var sups = F.suppliers(c0).map(function (s) { return { s: s, p: F.supPerf(s.id) }; }).filter(function (x) { return x.p.orders; }).sort(function (a, b) { return b.p.spend - a.p.spend; });
      var ro = d.reorder.filter(function (r) { return !r.pr && !r.po; });
      return P.head(t(L('PR, persetujuan, RFQ, PO, penerimaan, belanja dan kinerja supplier.', 'PRs, approvals, RFQs, POs, deliveries, spend and supplier performance.')),
          A.pbtn('pur.pr', 'primary', L('Buat PR', 'Create PR'), 'plus', { act: 'prNew' }) + (P.open('PUR-004') ? A.btn('ghost', 'RFQ', 'message', { go: 'PUR-004' }) : ''), freshLive(L('purchasing', 'purchasing'))) +
        P8.bigCount([
          { k: L('PR menunggu', 'PRs waiting'), v: String(d.prOpen.length), icon: 'file', tone: d.prOpen.length ? 'warn' : '', go: 'PUR-003' },
          { k: L('PR siap RFQ', 'PRs ready for RFQ'), v: String(d.prApproved.length), icon: 'filecheck', go: 'PUR-002', qs: { st: 'approved' } },
          { k: L('RFQ terbuka', 'Open RFQs'), v: String(d.rfqOpen.length), icon: 'message', go: 'PUR-004' },
          { k: L('PO menunggu persetujuan', 'POs waiting for approval'), v: String(d.poDraft.length), icon: 'hourglass', tone: d.poDraft.length ? 'warn' : '', go: 'PUR-006', qs: { st: 'draft' } },
          { k: L('Pengiriman terlambat', 'Late deliveries'), v: String(d.late.length), icon: 'truck', tone: d.late.length ? 'crit' : '', go: 'PUR-006', qs: { rcv: '1' } },
          { k: L('Selisih 3-way match', '3-way match issues'), v: String(d.matchIssues.length), icon: 'scale', tone: d.matchIssues.length ? 'warn' : '' }
        ]) +
        '<div class="hide-m">' + P.kpis([
          { k: L('Belanja PO bulan ini', 'PO spend this month'), v: rpj(d.spendMtd), s: t(L('PO disetujui s.d. diterima, termasuk PPN', 'Approved to received POs, VAT included')), icon: 'coins', go: 'PUR-006' },
          { k: L('PO terbuka', 'Open POs'), v: n0(d.poOpen.length), s: rpj(sum(d.poOpen.map(F.poTotal))), icon: 'invoice', go: 'PUR-006' },
          { k: L('Saran reorder tanpa PR', 'Reorder suggestions without PR'), v: n0(ro.length), s: t(L('dari stok di bawah ROP', 'from stock below the ROP')), icon: 'refresh', tone: ro.length ? 'warn' : 'ok', go: 'INV-001' }
        ]) + '</div>' +
        (d.late.length ? P.rec({ title: L('Pengiriman supplier terlambat', 'Late supplier deliveries'), tone: 'crit',
          sig: L(d.late.length + ' PO lewat tanggal kirim: ' + d.late.map(function (p) { return p.id; }).join(', '), d.late.length + ' POs past their delivery date: ' + d.late.map(function (p) { return p.id; }).join(', ')),
          why: d.late.map(function (p) { var out = p.lines.filter(function (l, i) { return p.rcv[i] < l[1]; }).map(function (l) { return T(F.stockName(l[0])); }); return L(p.id + ' · ' + F.supName(p.sup) + ' · janji ' + dt(p.dlv) + ' · belum: ' + out.join(', '), p.id + ' · ' + F.supName(p.sup) + ' · promised ' + dt(p.dlv) + ' · outstanding: ' + out.join(', ')); }),
          impact: L('Stok item terkait bisa habis; rating delivery supplier turun.', 'Stock of these items can run out; the supplier delivery rating drops.'),
          rec: L('Hubungi supplier hari ini, catat penerimaan sebagian bila barang datang.', 'Call the supplier today, record a partial receipt when goods arrive.'),
          act: { n: L('Buka receiving', 'Open receiving'), s: 'PUR-006', q: 'rcv=1' } }) : '') +
        '<div class="g2-10">' + card(L('PR menunggu persetujuan', 'PRs waiting for approval'), P.table(d.prOpen, [prCols()[0], prCols()[1], prCols()[3], prCols()[7], prCols()[8]], prCard, function (p) { return href('PUR-002', p.id); }, { empty: L('Tidak ada PR menunggu.', 'No PR waiting.') }), { icon: 'file', count: d.prOpen.length, link: ['PUR-003', L('Persetujuan', 'Approvals')] }) +
        card(L('Pengiriman berikutnya', 'Upcoming deliveries'), P.table(due, [poCols()[0], poCols()[1], poCols()[4], poCols()[5], poCols()[6]], poCard, function (p) { return href('PUR-006', p.id); }, { empty: L('Tidak ada PO terbuka.', 'No open PO.') }), { icon: 'truck', count: due.length, link: ['PUR-006', L('Semua PO', 'All POs'), null] }) + '</div>' +
        card(L('Kinerja supplier (12 bulan)', 'Supplier performance (12 months)'), P.table(sups, [
          { h: L('Supplier', 'Supplier'), v: function (x) { return supLink(x.s.id) + sub(catN(D.SUP_CATS, x.s.cat)); } },
          { h: L('Order', 'Orders'), cls: 'r num', v: function (x) { return n0(x.p.orders); } },
          { h: L('Tepat waktu', 'On time'), cls: 'r num', v: function (x) { return '<b>' + pct(x.p.otd) + '</b>' + sub(n0(x.p.onTime) + '/' + n0(x.p.orders)); } },
          { h: L('Isu kualitas', 'Quality issues'), cls: 'r num', v: function (x) { return n0(x.p.issues); } },
          { h: L('Kualitas', 'Quality'), v: function (x) { return supRating(x.s.q); } },
          { h: L('Delivery', 'Delivery'), v: function (x) { return supRating(x.s.dr); } },
          { h: L('Belanja', 'Spend'), cls: 'r num', v: function (x) { return rpj(x.p.spend); } },
          { h: L('AP terbuka', 'Open AP'), cls: 'r num', v: function (x) { return x.p.openAp ? rpj(x.p.openAp) : '—'; } }
        ], function (x) { return { t: esc(x.s.n), r: pct(x.p.otd), s: t(L('kualitas ', 'quality ')) + n0(x.s.q, 1) + ' · delivery ' + n0(x.s.dr, 1) + ' · ' + rpj(x.p.spend) }; }, function (x) { return href('PUR-007', x.s.id); }), { icon: 'briefcase', link: ['PUR-007', L('Semua supplier', 'All suppliers')] });
    },
    act: PR_ACT
  };

  /* ---------- PUR-002 Purchase Request ---------- */
  V['PUR-002'] = {
    title: function (rec) { return rec ? L('PR ' + rec, 'PR ' + rec) : null; },
    render: function (c) {
      var c0 = cx();
      if (!c.rec) {
        var all = F.prs(c0), st = c.q.st || '', cnt = {}; all.forEach(function (p) { cnt[p.st] = (cnt[p.st] || 0) + 1; });
        var rows = st ? all.filter(function (p) { return p.st === st; }) : all;
        return P.head(t(L('Purchase request: item, qty, tanggal butuh, alasan, departemen, cost center, prioritas, budget.', 'Purchase requests: item, qty, needed date, reason, department, cost centre, priority, budget.')), A.pbtn('pur.pr', 'primary', L('Buat PR', 'Create PR'), 'plus', { act: 'prNew' }), freshLive(L('PR', 'PRs'))) +
          card(L('Purchase request', 'Purchase requests'), tabs([['', L('Semua', 'All'), null, all.length]].concat(Object.keys(F.PR_ST).map(function (k) { return [k, F.PR_ST[k][0], null, cnt[k] || 0]; })), st, 'st', { def: '' }) +
            P.table(rows, prCols(), prCard, function (p) { return href('PUR-002', p.id); }, { empty: L('Tidak ada PR dengan status ini.', 'No PR with this status.') }), { icon: 'file', count: rows.length });
      }
      var p = F.pr(c.rec); if (!p) return notFound('PUR-002', L('Purchase Request', 'Purchase Request'));
      var it = F.stock(p.item), rule = F.prRule(p), rfq = p.conv ? F.rfq(p.conv) : S().rfqs.filter(function (r) { return r.prs.indexOf(p.id) >= 0; })[0] || null, po = S().pos.filter(function (o) { return o.pr === p.id || (rfq && o.rfq === rfq.id); })[0];
      var own = p.pic === myEmp(), canDecide = can('pur.approve') && ['submitted', 'review'].indexOf(p.st) >= 0;
      var main = '', side = '';
      if (p.st === 'draft' && can('pur.pr')) main = A.btn('primary', L('Ajukan', 'Submit'), 'upload', { act: 'prSubmit', val: p.id, cls: 'btn-xl' });
      else if (canDecide && !own) { main = A.btn('primary', L('Setujui', 'Approve'), 'checkc', { act: 'prOk', val: p.id, cls: 'btn-xl' }); side = A.btn('ghost', L('Review', 'Review'), 'refresh', { act: 'prRev', val: p.id, cls: 'btn-xl' }) + A.btn('danger', L('Tolak', 'Reject'), 'xc', { act: 'prNo', val: p.id, cls: 'btn-xl' }); }
      else if (p.st === 'approved' && rfq) main = A.btn('primary', L('Buka ' + rfq.id, 'Open ' + rfq.id), 'message', { go: 'PUR-004', rec: rfq.id, cls: 'btn-xl' });
      else if (p.st === 'approved' && can('pur.rfq')) main = A.btn('primary', L('Buat RFQ', 'Create RFQ'), 'message', { go: 'PUR-004', qs: 'pr=' + p.id, cls: 'btn-xl' });
      return P8.hero({ id: p.id, icon: 'file', title: itemN(p.item), sub: n0(p.qty) + ' ' + esc(it ? it.unit : '') + ' · ' + t(L('dibutuhkan ', 'needed by ')) + esc(dt(p.need)), chips: stc(F.PR_ST, p.st) + ' ' + stc(F.PRIO, p.pri),
          facts: [[L('Item', 'Item'), itemL(p.item)], [L('Nilai estimasi', 'Estimated value'), rp(rule.amt), 'num'], [L('Departemen', 'Department'), esc(p.dept) + ' · ' + catN({ OPS: D.DEPTS[0][1], LOG: D.DEPTS[1][1], FIN: D.DEPTS[2][1], SLS: D.DEPTS[3][1], MNT: D.DEPTS[4][1], MGT: D.DEPTS[5][1], SUP: D.DEPTS[6][1] }, p.dept)],
            [L('Cost center', 'Cost centre'), esc(p.cc)], ['PIC', emp(p.pic)], [L('Referensi budget', 'Budget reference'), p.bud ? mono(p.bud) : '—']] }) +
        (own && canDecide ? note(t(L('Anda pemohon PR ini: persetujuan harus oleh orang lain.', 'You requested this PR: someone else must approve it.')), 'lock', 'warn') : '') +
        (canDecide && rule.lvl === 'owner' && cx().roleKey !== 'owner' ? note(t(L('PR ini butuh persetujuan Owner: ', 'This PR needs Owner approval: ')) + t(rule.why), 'shield', 'warn') : '') +
        '<div class="g2-10">' + card(L('Detail permintaan', 'Request detail'), kv([[L('Alasan', 'Reason'), esc(T(p.reason))], [L('Qty', 'Qty'), n0(p.qty) + ' ' + esc(it ? it.unit : '') + (it ? sub(t(L('stok sekarang ', 'stock now ')) + n0(it.qty) + ' · ROP ' + n0(it.rop) + ' · max ' + n0(it.max)) : '')],
            [L('Harga estimasi', 'Estimated price'), rp(p.est) + sub(t(L('harga rata-rata stok', 'average stock cost')))], [L('Tanggal dibutuhkan', 'Needed by'), esc(dt(p.need))], [L('Dibuat', 'Created'), esc(dt(p.at))],
            [L('Disetujui', 'Approved'), p.appr ? emp(p.appr) + (p.apprAt ? ' · ' + esc(dt(p.apprAt)) : '') : '—']]), { icon: 'file' }) +
          card(L('Aturan persetujuan', 'Approval rule'), rulesBox(p) + sub(t(L('Berlaku: ', 'Applies: ')) + t(rule.why)), { icon: 'shield' }) + '</div>' +
        card(L('Alur dokumen', 'Document flow'), flow([{ i: 'file', l: L('PR', 'PR'), s: p.id }, rfq ? { i: 'message', l: L('RFQ', 'RFQ'), s: rfq.id, go: 'PUR-004', rec: rfq.id } : null, po ? { i: 'invoice', l: L('PO', 'PO'), s: po.id, go: 'PUR-006', rec: po.id } : null]) + (p.log && p.log.length ? '<h3 class="h5">' + t(L('Riwayat status', 'Status history')) + '</h3>' + logList(p.log) : '') +
          '<h3 class="h5">' + t(L('Jejak audit', 'Audit trail')) + '</h3>' + auditList(p.id), { icon: 'history' }) +
        (main || side ? P8.abar(main, side) : '');
    },
    act: PR_ACT
  };

  /* ---------- PUR-003 PR Approval (iPad first) ---------- */
  V['PUR-003'] = {
    render: function () {
      var c0 = cx(), me = myEmp(), list = F.prs(c0).filter(function (p) { return ['submitted', 'review'].indexOf(p.st) >= 0; });
      var done = F.prs(c0).filter(function (p) { return p.log.some(function (l) { return l.by === me && ['approved', 'rejected', 'review'].indexOf(l.to) >= 0; }); }).slice(0, 6);
      function cardOf(p) {
        var it = F.stock(p.item), rule = F.prRule(p), own = p.pic === me, lvlBlock = rule.lvl === 'owner' && c0.roleKey !== 'owner';
        var btns = !can('pur.approve') ? note(t(L('Menunggu keputusan ', 'Waiting for the decision of ')) + (rule.lvl === 'owner' ? 'Owner' : 'Finance') + '.', 'hourglass') : own ? note(t(L('Anda pemohon: tidak bisa menyetujui PR sendiri.', 'You are the requester: you cannot approve your own PR.')), 'lock', 'warn') :
          '<div class="su10-ab">' + (lvlBlock ? note(t(L('Butuh Owner: ', 'Needs the Owner: ')) + t(rule.why), 'shield', 'warn') : A.btn('primary', L('Setujui', 'Approve'), 'checkc', { act: 'prOk', val: p.id, cls: 'btn-xl' })) +
          A.btn('ghost', L('Review', 'Review'), 'refresh', { act: 'prRev', val: p.id, cls: 'btn-xl' }) + A.btn('danger', L('Tolak', 'Reject'), 'xc', { act: 'prNo', val: p.id, cls: 'btn-xl' }) + '</div>';
        return '<section class="card su10-ap"><div class="su10-ap-h"><a class="lnk5" href="' + href('PUR-002', p.id) + '">' + mono(p.id) + '</a>' + stc(F.PR_ST, p.st) + stc(F.PRIO, p.pri) + ruleChip(p) + '</div>' +
          '<h2>' + itemN(p.item) + '</h2><p class="sub5">' + esc(T(p.reason)) + '</p>' +
          '<div class="hr8-f su10-ap-f"><div><span>' + t(L('Qty', 'Qty')) + '</span><b class="num">' + n0(p.qty) + ' ' + esc(it ? it.unit : '') + '</b></div><div><span>' + t(L('Nilai', 'Value')) + '</span><b class="num">' + rp(rule.amt) + '</b></div><div><span>' + t(L('Dibutuhkan', 'Needed')) + '</span><b>' + esc(dt(p.need)) + '</b></div>' +
          '<div><span>' + t(L('Pemohon', 'Requester')) + '</span><b>' + emp(p.pic) + '</b></div><div><span>' + t(L('Dept · CC', 'Dept · CC')) + '</span><b>' + esc(p.dept + ' · ' + p.cc) + '</b></div><div><span>' + t(L('Stok sekarang', 'Stock now')) + '</span><b class="num">' + (it ? n0(it.qty) + ' ' + esc(it.unit) : '—') + '</b></div></div>' +
          '<p class="sub5">' + ic('shield') + ' ' + t(rule.why) + '</p>' + btns + '</section>';
      }
      return P.head(t(L('PR menunggu keputusan. Aturan: nilai, departemen, kategori dan pemohon; pemohon tidak menyetujui PR sendiri.', 'PRs waiting for a decision. Rules: value, department, category and requester; a requester never approves their own PR.')), '', freshLive(L('PR', 'PRs'))) +
        (list.length ? '<div class="su10-aps">' + list.map(cardOf).join('') + '</div>' : A.stateCard('empty', L('Tidak ada PR menunggu.', 'No PR waiting.'), A.btn('blue', L('Semua PR', 'All PRs'), 'list', { go: 'PUR-002' }))) +
        card(L('Aturan persetujuan', 'Approval rules'), '<ul class="su10-rules">' + D.PR_RULES.map(function (x) { return '<li class="on">' + ic('shield') + '<span>' + t(x.l) + '</span></li>'; }).join('') + '</ul>', { icon: 'shield' }) +
        (done.length ? card(L('Keputusan saya terakhir', 'My recent decisions'), P.table(done, [prCols()[0], prCols()[1], prCols()[3], prCols()[9]], prCard, function (p) { return href('PUR-002', p.id); }), { icon: 'history' }) : '');
    },
    act: PR_ACT
  };

  /* ---------- PUR-004 RFQ ---------- */
  function quoteDlg(id, sup) {
    var r = F.rfq(id), q = r.quotes[sup] || [], s = F.supplier(sup) || {};
    dlg({ title: L('Input Penawaran · ' + F.supName(sup), 'Enter Quote · ' + F.supName(sup)), icon: 'coins', ok: L('Simpan penawaran', 'Save quote'),
      sub: mono(id) + ' · ' + r.items.map(function (i) { return itemN(i[0]) + ' × ' + n0(i[1]); }).join(', '),
      body: g2(fld(L('Harga per unit (Rp, termasuk PPN)', 'Unit price (Rp, VAT incl.)'), inp('price', q[0] || '', { num: true }), { req: true }) + fld(L('Lead time (hari)', 'Lead time (days)'), inp('lead', q[1] != null ? q[1] : s.lead || '', { num: true }), { req: true }) +
        fld(L('Termin bayar (hari)', 'Payment terms (days)'), inp('term', q[2] != null ? q[2] : s.term || '', { num: true }), { req: true }) + fld(L('Catatan', 'Note'), inp('note', q[3] ? T(q[3]) : ''))),
      onOk: function (v, el) { v = P.vals(el); var x = F.addQuote(cx(), id, sup, v); if (!x.ok) return x.msg; P.after(L('Penawaran ' + F.supName(sup) + ' tersimpan.', 'Quote from ' + F.supName(sup) + ' saved.')); return true; } });
  }
  V['PUR-004'] = {
    title: function (rec) { return rec ? L('RFQ ' + rec, 'RFQ ' + rec) : null; },
    render: function (c) {
      var c0 = cx();
      if (!c.rec) {
        var rfqs = F.rfqs(c0), inRfq = function (p) { return S().rfqs.filter(function (r) { return r.prs.indexOf(p.id) >= 0 && r.st !== 'cancelled'; })[0]; };
        var aprAll = F.prs(c0, { st: 'approved' }), apr = aprAll.filter(function (p) { return !inRfq(p); }), busy = aprAll.filter(inRfq), pre = (c.q.pr || '').split(',');
        if (apr.length === 1) pre = [apr[0].id];
        var preSup = apr.filter(function (p) { return pre.indexOf(p.id) >= 0; }).map(function (p) { return (F.stock(p.item) || {}).sup; });
        var cats = {}; apr.forEach(function (p) { var it = F.stock(p.item); if (it) cats[it.cat] = 1; });
        var sups = F.suppliers(c0).filter(function (s) { return s.st === 'active' && ['utility', 'fuel'].indexOf(s.cat) < 0; });
        var form = can('pur.rfq') ? card(L('Buat RFQ dari PR disetujui', 'Create an RFQ from approved PRs'), (apr.length ? '<form id="su10-rfq" onsubmit="return false" class="su10-rf">' +
            '<h3 class="h5">' + t(L('1 · Pilih PR', '1 · Choose PRs')) + '</h3><div class="su10-cks">' + apr.map(function (p) { return '<label class="su10-ck"><input type="checkbox" name="prs" data-multi="1" value="' + esc(p.id) + '"' + (pre.indexOf(p.id) >= 0 ? ' checked' : '') + '><span><b>' + esc(p.id) + '</b> · ' + itemN(p.item) + ' × ' + n0(p.qty) + '<small>' + rpj(F.prAmount(p)) + ' · ' + t(L('butuh ', 'needed ')) + esc(dt(p.need)) + '</small></span></label>'; }).join('') + '</div>' +
            '<h3 class="h5">' + t(L('2 · Pilih minimal 2 supplier', '2 · Choose at least 2 suppliers')) + '</h3><div class="su10-cks">' + sups.map(function (s) { return '<label class="su10-ck"><input type="checkbox" name="sups" data-multi="1" value="' + esc(s.id) + '"' + (preSup.indexOf(s.id) >= 0 ? ' checked' : '') + '><span><b>' + esc(s.n) + '</b><small>' + catN(D.SUP_CATS, s.cat) + ' · lead ' + s.lead + ' ' + t(L('hr', 'd')) + ' · ' + t(L('termin ', 'terms ')) + s.term + ' ' + t(L('hr', 'd')) + ' · ★ ' + n0(s.q, 1) + '</small></span></label>'; }).join('') + '</div>' +
            '<div class="fg5">' + fld(L('Batas penawaran', 'Quote due date'), inp('due', F.u.addDays(today(), 2), { type: 'date' })) + '</div>' +
            '<div class="su10-ar">' + A.btn('primary', L('Kirim RFQ', 'Send RFQ'), 'message', { act: 'rfqNew', cls: 'btn-xl' }) + '</div></form>' : A.empty(L('Tidak ada PR disetujui yang menunggu RFQ.', 'No approved PR waiting for an RFQ.'))) + (busy.length ? sub(t(L('Sudah punya RFQ: ', 'Already in an RFQ: ')) + busy.map(function (p) { var r = inRfq(p); return prLink(p.id) + ' → <a class="lnk5" href="' + href('PUR-004', r.id) + '">' + mono(r.id) + '</a>'; }).join(', ')) : ''), { icon: 'plus' }) : '';
        return P.head(t(L('Permintaan penawaran ke minimal 2 supplier dari PR yang disetujui.', 'Requests for quotation to at least 2 suppliers from approved PRs.')), '', freshLive('RFQ')) + form +
          card(L('Daftar RFQ', 'RFQ list'), P.table(rfqs, [
            { h: 'RFQ', v: function (r) { return '<a class="lnk5" href="' + href('PUR-004', r.id) + '">' + mono(r.id) + '</a>' + sub(esc(dt(r.at))); } },
            { h: L('Item', 'Items'), v: function (r) { return r.items.map(function (i) { return itemN(i[0]) + ' × ' + n0(i[1]); }).join('<br>'); } },
            { h: L('PR', 'PR'), v: function (r) { return r.prs.map(prLink).join(', '); } },
            { h: L('Penawaran', 'Quotes'), cls: 'r num', v: function (r) { return Object.keys(r.quotes).length + ' / ' + r.sups.length; } },
            { h: L('Batas', 'Due'), v: function (r) { return esc(dt(r.due)); } },
            { h: L('Pemenang', 'Awarded'), v: function (r) { return r.award ? supLink(r.award) : '—'; } },
            { h: L('Status', 'Status'), v: function (r) { return stc(F.RFQ_ST, r.st); } }
          ], function (r) { return { t: esc(r.id) + ' · ' + itemN(r.items[0][0]), r: Object.keys(r.quotes).length + '/' + r.sups.length, s: t(L('batas ', 'due ')) + esc(dt(r.due)), chip: stc(F.RFQ_ST, r.st) }; }, function (r) { return href('PUR-004', r.id); }), { icon: 'message', count: rfqs.length });
      }
      var r = F.rfq(c.rec); if (!r) return notFound('PUR-004', 'RFQ');
      var po = S().pos.filter(function (o) { return o.rfq === r.id; })[0], openQ = ['open', 'quoted'].indexOf(r.st) >= 0, nq = Object.keys(r.quotes).length;
      var grid = '<div class="su10-qs">' + r.sups.map(function (sid) {
        var q = r.quotes[sid], s = F.supplier(sid) || {};
        return '<div class="su10-q' + (r.award === sid ? ' on' : '') + '"><div class="su10-q-h">' + supLink(sid) + (r.award === sid ? A.chip('ok', L('Dipilih', 'Selected'), 'checkc') : q ? A.chip('info', L('Penawaran masuk', 'Quote in')) : A.chip('appr', L('Menunggu', 'Waiting'))) + '</div>' +
          (q ? kv([[L('Harga / unit', 'Unit price'), '<b>' + rp(q[0]) + '</b>'], [L('Lead time', 'Lead time'), q[1] + ' ' + t(L('hari', 'days'))], [L('Termin', 'Terms'), q[2] + ' ' + t(L('hari', 'days'))], q[3] ? [L('Catatan', 'Note'), esc(T(q[3]))] : null]) : '<p class="sub5">' + t(L('Lead time standar ', 'Standard lead time ')) + esc(s.lead) + ' ' + t(L('hari · termin ', 'days · terms ')) + esc(s.term) + ' ' + t(L('hari', 'days')) + '</p>') +
          (openQ && can('pur.rfq') ? A.btn(q ? 'ghost' : 'primary', q ? L('Ubah penawaran', 'Edit quote') : L('Input penawaran', 'Enter quote'), 'coins', { act: 'quote', val: r.id + '|' + sid, cls: 'btn-sm' }) : '') + '</div>';
      }).join('') + '</div>';
      return P8.hero({ id: r.id, icon: 'message', title: r.items.map(function (i) { return itemN(i[0]) + ' × ' + n0(i[1]); }).join(', '), sub: t(L('Ke ', 'To ')) + r.sups.length + ' supplier · ' + t(L('batas ', 'due ')) + esc(dt(r.due)) + ' · ' + t(r.terms), chips: stc(F.RFQ_ST, r.st),
          facts: [[L('PR', 'PR'), r.prs.map(prLink).join(', ')], [L('Penawaran masuk', 'Quotes in'), nq + ' / ' + r.sups.length], [L('Pemenang', 'Awarded'), r.award ? supLink(r.award) : '—'], [L('Alasan pemilihan', 'Selection reason'), r.awardWhy ? esc(T(r.awardWhy)) : '—'], ['PO', po ? poLink(po.id) : '—']] }) +
        card(L('Supplier & penawaran', 'Suppliers & quotes'), grid, { icon: 'briefcase', count: nq }) +
        card(L('Alur dokumen', 'Document flow'), flow(r.prs.map(function (id) { return { i: 'file', l: L('PR', 'PR'), s: id, go: 'PUR-002', rec: id }; }).concat([{ i: 'message', l: 'RFQ', s: r.id }, nq ? { i: 'columns', l: L('Perbandingan', 'Comparison'), s: nq + ' ' + T(L('penawaran', 'quotes')), go: 'PUR-005', rec: r.id } : null, po ? { i: 'invoice', l: 'PO', s: po.id, go: 'PUR-006', rec: po.id } : null])) +
          '<h3 class="h5">' + t(L('Jejak audit', 'Audit trail')) + '</h3>' + auditList(r.id), { icon: 'history' }) +
        P8.abar(nq ? A.btn('primary', L('Bandingkan supplier', 'Compare suppliers'), 'columns', { go: 'PUR-005', rec: r.id, cls: 'btn-xl' }) : '', po ? A.btn('ghost', L('Buka PO', 'Open PO'), 'invoice', { go: 'PUR-006', rec: po.id, cls: 'btn-xl' }) : '');
    },
    act: {
      rfqNew: function () {
        var v = P.vals(document.getElementById('su10-rfq')), r = F.createRfq(cx(), v.prs || [], v.sups || [], v.due);
        if (!r.ok) return P.fail(r); A.toast(L('RFQ ' + r.rfq.id + ' dikirim ke ' + r.rfq.sups.length + ' supplier.', 'RFQ ' + r.rfq.id + ' sent to ' + r.rfq.sups.length + ' suppliers.')); P.go('PUR-004', r.rfq.id);
      },
      quote: function (el) { var x = val(el).split('|'); quoteDlg(x[0], x[1]); }
    }
  };

  /* ---------- PUR-005 Supplier Comparison ---------- */
  var CMP_FX = { price: L('harga terendah ÷ harga × 100', 'lowest price ÷ price × 100'), lead: L('(lead tercepat + 1) ÷ (lead + 1) × 100', '(fastest lead + 1) ÷ (lead + 1) × 100'), term: L('termin ÷ termin terpanjang × 100', 'terms ÷ longest terms × 100'),
    q: L('rating kualitas ÷ 5 × 100', 'quality rating ÷ 5 × 100'), dr: L('rating delivery ÷ 5 × 100', 'delivery rating ÷ 5 × 100'), hist: L('% tepat waktu − 5 × isu kualitas (12 bln)', 'on-time % − 5 × quality issues (12 m)') };
  V['PUR-005'] = {
    title: function (rec) { return rec ? L('Perbandingan · ' + rec, 'Comparison · ' + rec) : null; },
    render: function (c) {
      var c0 = cx(), rfqs = F.rfqs(c0).filter(function (r) { return Object.keys(r.quotes).length; });
      var id = c.rec || (rfqs.filter(function (r) { return r.st === 'quoted'; })[0] || rfqs[0] || {}).id;
      if (!id) return A.stateCard('empty', L('Belum ada RFQ dengan penawaran.', 'No RFQ with quotes yet.'), A.btn('blue', 'RFQ', 'message', { go: 'PUR-004' }));
      var cm = F.compare(id); if (!cm) return notFound('PUR-004', 'RFQ');
      var r = cm.rfq, rows = cm.rows, best = cm.best, openQ = ['open', 'quoted'].indexOf(r.st) >= 0 && can('pur.rfq');
      if (!rows.length) return A.stateCard('empty', L('Belum ada penawaran untuk ' + id + '.', 'No quotes for ' + id + ' yet.'), A.btn('blue', L('Buka RFQ', 'Open RFQ'), 'message', { go: 'PUR-004', rec: id }));
      function raw(x, k) { return { price: rp(x.price), lead: x.lead + ' ' + T(L('hari', 'days')), term: x.term + ' ' + T(L('hari', 'days')), q: n0(x.q, 1) + ' / 5', dr: n0(x.dr, 1) + ' / 5', hist: x.orders ? n0(x.hist, 1) + ' (' + x.orders + ' order)' : n0(x.hist) + ' ' + T(L('(belum ada riwayat, nilai default)', '(no history, default value)')) }[k]; }
      var head = '<thead><tr><th>' + t(L('Kriteria', 'Criterion')) + '</th><th class="r">' + t(L('Bobot', 'Weight')) + '</th>' + rows.map(function (x) { return '<th class="r' + (x === best ? ' su10-best' : '') + '">' + supLink(x.sup) + (x === best ? '<br>' + A.chip('ok', L('Skor tertinggi', 'Highest score'), 'star') : '') + (x === cm.cheapest ? '<br>' + A.chip('info', L('Termurah', 'Cheapest'), 'coins') : '') + (x.note ? '<small class="sub5">' + esc(T(x.note)) + '</small>' : '') + '</th>'; }).join('') + '</tr></thead>';
      var body = F.CMP_W.map(function (w) {
        return '<tr><th>' + t(w[1]) + '<small class="sub5">' + t(CMP_FX[w[0]]) + '</small></th><td class="r num"><b>' + w[2] + '%</b></td>' + rows.map(function (x) {
          return '<td class="r num' + (x === best ? ' su10-best' : '') + '">' + esc(raw(x, w[0])) + '<small class="sub5">' + t(L('skor ', 'score ')) + n0(x.sc[w[0]], 1) + ' × ' + w[2] + '% = <b>' + n0(x.sc[w[0]] * w[2] / 100, 1) + '</b></small></td>';
        }).join('') + '</tr>';
      }).join('');
      var foot = '<tfoot><tr><th>' + t(L('Total skor', 'Total score')) + '</th><td class="r num">100%</td>' + rows.map(function (x) { return '<td class="r num' + (x === best ? ' su10-best' : '') + '"><b class="su10-tot">' + n0(x.total, 1) + '</b><small class="sub5">' + t(L('nilai ', 'value ')) + rp(x.value) + '</small></td>'; }).join('') + '</tr>' +
        (openQ ? '<tr><th></th><td></td>' + rows.map(function (x) { return '<td class="r">' + A.btn(x === best ? 'primary' : 'ghost', L('Pilih', 'Select'), 'checkc', { act: 'award', val: r.id + '|' + x.sup, cls: 'btn-sm' }) + '</td>'; }).join('') + '</tr>' : '') + '</tfoot>';
      var mob = '<div class="hide-d hide-t su10-cmb">' + rows.map(function (x) {
        return '<section class="su10-q' + (x === best ? ' on' : '') + '"><div class="su10-q-h">' + supLink(x.sup) + '<b class="su10-tot">' + n0(x.total, 1) + '</b></div><ul class="su10-ul">' + F.CMP_W.map(function (w) { return '<li><span>' + t(w[1]) + ' (' + w[2] + '%)</span><span class="num">' + esc(raw(x, w[0])) + ' → ' + n0(x.sc[w[0]] * w[2] / 100, 1) + '</span></li>'; }).join('') + '</ul>' +
          (openQ ? A.btn(x === best ? 'primary' : 'ghost', L('Pilih', 'Select'), 'checkc', { act: 'award', val: r.id + '|' + x.sup, cls: 'btn-sm' }) : '') + '</section>';
      }).join('') + '</div>';
      var diffP = cm.cheapest && best && cm.cheapest !== best ? best.value - cm.cheapest.value : 0;
      return P.head(t(L('Bobot dan skor tiap kriteria terlihat: tidak ada skor misterius. Memilih bukan skor tertinggi wajib beri alasan.', 'Weights and the score per criterion are visible: no mystery score. Choosing other than the top score needs a reason.')),
          rfqs.length > 1 ? '<label class="fb-f"><select onchange="location.hash=this.value">' + rfqs.map(function (x) { return '<option value="' + esc(href('PUR-005', x.id)) + '"' + (x.id === id ? ' selected' : '') + '>' + esc(x.id + ' · ' + T(F.stockName(x.items[0][0]))) + '</option>'; }).join('') + '</select></label>' : '', freshLive('RFQ ' + id)) +
        P.rec({ title: L('Rekomendasi supplier', 'Supplier recommendation'), tone: r.st === 'awarded' ? 'ok' : 'info', chip: stc(F.RFQ_ST, r.st),
          sig: L(F.supName(best.sup) + ' skor ' + best.total + ' dari 100', F.supName(best.sup) + ' scores ' + best.total + ' of 100'),
          why: F.CMP_W.slice().sort(function (a, b) { return best.sc[b[0]] * b[2] - best.sc[a[0]] * a[2]; }).slice(0, 3).map(function (w) { return L(T(w[1]) + ': ' + raw(best, w[0]) + ' → ' + n0(best.sc[w[0]] * w[2] / 100, 1) + ' poin', w[1][1] + ': ' + raw(best, w[0]) + ' → ' + n0(best.sc[w[0]] * w[2] / 100, 1) + ' pts'); }),
          impact: diffP ? L('Lebih mahal ' + rp(diffP) + ' dari penawaran termurah (' + F.supName(cm.cheapest.sup) + '), ditukar dengan lead time, termin dan riwayat yang lebih baik.', rp(diffP) + ' more than the cheapest quote (' + F.supName(cm.cheapest.sup) + '), traded for better lead time, terms and history.') : L('Skor tertinggi juga penawaran termurah.', 'The highest score is also the cheapest quote.'),
          rec: r.st === 'awarded' ? L('Sudah dipilih: ' + F.supName(r.award) + ' · ' + T(r.awardWhy), 'Selected: ' + F.supName(r.award) + ' · ' + (Array.isArray(r.awardWhy) ? r.awardWhy[1] : r.awardWhy)) : L('Pilih ' + F.supName(best.sup) + ' dan buat PO', 'Select ' + F.supName(best.sup) + ' and create the PO'),
          act: openQ ? A.btn('primary', L('Pilih ' + F.supName(best.sup), 'Select ' + F.supName(best.sup)), 'checkc', { act: 'award', val: r.id + '|' + best.sup, cls: 'btn-sm' }) : (S().pos.filter(function (o) { return o.rfq === r.id; })[0] ? A.btn('ghost', L('Buka PO', 'Open PO'), 'invoice', { go: 'PUR-006', rec: S().pos.filter(function (o) { return o.rfq === r.id; })[0].id, cls: 'btn-sm' }) : '') }) +
        card(L('Perbandingan ' + r.id, 'Comparison ' + r.id), '<div class="tblw hide-m"><table class="tbl dense su10-cmp">' + head + '<tbody>' + body + '</tbody>' + foot + '</table></div>' + mob +
          sub(t(L('Skor tiap kriteria 0–100, dikali bobot. Total = jumlah kontribusi. Bobot diatur di engine (CMP_W) dan berlaku untuk semua RFQ.', 'Each criterion scores 0–100, multiplied by its weight. Total = sum of contributions. Weights are set in the engine (CMP_W) and apply to every RFQ.'))), { icon: 'columns' });
    },
    act: {
      award: function (el) {
        var x = val(el).split('|'), cm = F.compare(x[0]), row = by(cm.rows, 'sup', x[1]), isBest = row === cm.best;
        P.reasonDlg({ title: L('Pilih ' + F.supName(x[1]), 'Select ' + F.supName(x[1])), icon: 'checkc', ok: L('Pilih & buat PO', 'Select & create PO'), optional: isBest,
          label: isBest ? L('Catatan (opsional)', 'Note (optional)') : L('Alasan memilih bukan skor tertinggi', 'Reason for not choosing the top score'),
          sub: t(L('Skor ', 'Score ')) + '<b>' + n0(row.total, 1) + '</b> · ' + rp(row.price) + ' / unit · ' + t(L('nilai ', 'value ')) + rp(row.value) + (isBest ? '' : '<br>' + t(L('Skor tertinggi: ', 'Highest score: ')) + esc(F.supName(cm.best.sup)) + ' (' + n0(cm.best.total, 1) + ')') + '<br>' + t(L('PO draft dibuat dan menunggu persetujuan.', 'A draft PO is created and waits for approval.')),
          fn: function (reason) { return F.award(cx(), x[0], x[1], reason); }, done: L('Supplier dipilih. PO draft dibuat.', 'Supplier selected. Draft PO created.'),
          then: function (r) { if (r.po) setTimeout(function () { P.go('PUR-006', r.po.id); }, 400); } });
      }
    }
  };

  /* ---------- PUR-006 Purchase Order ---------- */
  function rcvDlg(id) {
    var p = F.po(id);
    dlg({ title: L('Terima Barang · ' + id, 'Receive Goods · ' + id), icon: 'download', ok: L('Simpan penerimaan', 'Save receipt'),
      sub: esc(F.supName(p.sup)) + ' · ' + t(L('Isi qty yang benar-benar diterima. Penerimaan sebagian boleh; stok, harga rata-rata dan GRNI (2150) diperbarui.', 'Enter the qty actually received. Partial receipt is fine; stock, average cost and GRNI (2150) are updated.')),
      body: g2(p.lines.map(function (l, i) { var out = l[1] - (p.rcv[i] || 0); return fld(T(F.stockName(l[0])) + ' (' + l[0] + ')', inp('q' + i, out > 0 ? out : 0, { num: true, ro: out <= 0 }), { hint: t(L('PO ', 'PO ')) + n0(l[1]) + ' · ' + t(L('sudah ', 'received ')) + n0(p.rcv[i] || 0) + ' · ' + t(L('sisa ', 'open ')) + n0(out) }); }).join('') +
        fld(L('Catatan / no. surat jalan', 'Note / delivery note no.'), inp('note', ''), { wide: true })),
      onOk: function (v, el) { v = P.vals(el); var r = F.receive(cx(), id, p.lines.map(function (l, i) { return v['q' + i]; }), v.note); if (!r.ok) return r.msg; P.after(L('Penerimaan ' + r.grn.id + ' tersimpan · status PO: ' + T(F.PO_ST[r.po.st][0]), 'Receipt ' + r.grn.id + ' saved · PO status: ' + F.PO_ST[r.po.st][0][1])); return true; } });
  }
  var PO_ACT = {
    poOk: function (el) { var id = val(el), p = F.po(id); P.confirmDlg({ title: L('Setujui PO ' + id, 'Approve PO ' + id), icon: 'checkc', ok: L('Setujui', 'Approve'), sub: esc(F.supName(p.sup)) + ' · <b>' + rp(F.poTotal(p)) + '</b>' + (p.capex ? '<br>' + t(L('PO capex: persetujuan Owner tercatat di audit, tidak pernah otomatis.', 'Capex PO: the Owner approval is audited, never automatic.')) : ''), fn: function () { return F.approvePo(cx(), id); }, done: L('PO disetujui.', 'PO approved.') }); },
    poSend: function (el) { var id = val(el); P.confirmDlg({ title: L('Kirim PO ' + id + ' ke supplier', 'Send PO ' + id + ' to the supplier'), icon: 'upload', ok: L('Kirim', 'Send'), sub: esc(F.supName(F.po(id).sup)), fn: function () { return F.sendPo(cx(), id); }, done: L('PO terkirim ke supplier.', 'PO sent to the supplier.') }); },
    poCancel: function (el) { var id = val(el); P.reasonDlg({ title: L('Batalkan PO ' + id, 'Cancel PO ' + id), icon: 'xc', ok: L('Batalkan PO', 'Cancel PO'), fn: function (reason) { return F.cancelPo(cx(), id, reason); }, done: L('PO dibatalkan.', 'PO cancelled.'), tone: 'warn' }); },
    rcv: function (el) { rcvDlg(val(el)); }
  };
  V['PUR-006'] = {
    title: function (rec) { return rec ? L('PO ' + rec, 'PO ' + rec) : null; },
    render: function (c) {
      var c0 = cx();
      if (!c.rec) {
        var all = F.pos(c0), rcvMode = !!c.q.rcv, st = c.q.st || '', cnt = {}; all.forEach(function (p) { cnt[p.st] = (cnt[p.st] || 0) + 1; });
        var rows = rcvMode ? all.filter(function (p) { return ['approved', 'sent', 'partial'].indexOf(p.st) >= 0; }).sort(function (a, b) { return a.dlv < b.dlv ? -1 : 1; }) : st ? all.filter(function (p) { return p.st === st; }) : all;
        var cols = poCols().concat(rcvMode && can('pur.rcv') ? [{ h: '', cls: 'r', v: function (p) { return A.btn('primary', L('Terima', 'Receive'), 'download', { act: 'rcv', val: p.id, cls: 'btn-sm' }); } }] : []);
        return P.head(rcvMode ? t(L('Receiving: PO yang menunggu barang datang, urut tanggal kirim.', 'Receiving: POs waiting for goods, by delivery date.')) : t(L('PO, persetujuan, kirim, penerimaan dan three-way match.', 'POs, approval, sending, receipts and three-way match.')), '', freshLive('PO')) +
          (rcvMode ? '' : tabs([['', L('Semua', 'All'), null, all.length]].concat(Object.keys(F.PO_ST).map(function (k) { return [k, F.PO_ST[k][0], null, cnt[k] || 0]; })), st, 'st', { def: '' })) +
          card(rcvMode ? L('Menunggu penerimaan', 'Waiting for receipt') : L('Purchase order', 'Purchase orders'), P.table(rows, cols, function (p) { var x = poCard(p); if (rcvMode && can('pur.rcv')) x.chip += ' ' + A.btn('primary', L('Terima', 'Receive'), 'download', { act: 'rcv', val: p.id, cls: 'btn-sm' }); return x; }, function (p) { return href('PUR-006', p.id); }, { empty: rcvMode ? L('Tidak ada barang yang ditunggu.', 'No goods expected.') : L('Tidak ada PO dengan status ini.', 'No PO with this status.') }), { icon: rcvMode ? 'download' : 'invoice', count: rows.length });
      }
      var p = F.po(c.rec); if (!p) return notFound('PUR-006', L('Purchase Order', 'Purchase Order'));
      var subT = F.poSub(p), tot = F.poTotal(p), grns = F.grnsOf(p.id), exps = S().exp.filter(function (e) { return e.po === p.id; }), rfq = p.rfq ? F.rfq(p.rfq) : null;
      var own = p.by && p.by === myEmp(), ownerOnly = p.capex && c0.roleKey !== 'owner';
      var lines = '<div class="tblw"><table class="tbl dense"><thead><tr><th>' + t(L('Item', 'Item')) + '</th><th class="r">' + t(L('Qty PO', 'PO qty')) + '</th><th class="r">' + t(L('Harga', 'Price')) + '</th><th class="r">' + t(L('Subtotal', 'Subtotal')) + '</th><th class="r">' + t(L('Diterima', 'Received')) + '</th><th class="r">' + t(L('Sisa', 'Open')) + '</th></tr></thead><tbody>' +
        p.lines.map(function (l, i) { var out = l[1] - (p.rcv[i] || 0); return '<tr><td>' + itemL(l[0]) + sub(itemN(l[0])) + '</td><td class="r num">' + n0(l[1]) + '</td><td class="r num">' + rp(l[2]) + '</td><td class="r num">' + rp(l[1] * l[2]) + '</td><td class="r num">' + n0(p.rcv[i] || 0) + '</td><td class="r num ' + (out > 0 ? 'su10-neg' : '') + '">' + n0(out) + '</td></tr>'; }).join('') +
        '</tbody><tfoot><tr><th colspan="3">' + t(L('Subtotal', 'Subtotal')) + '</th><td class="r num">' + rp(subT) + '</td><td colspan="2"></td></tr><tr><th colspan="3">' + t(L('PPN ', 'VAT ')) + p.tax + '%</th><td class="r num">' + rp(tot - subT) + '</td><td colspan="2"></td></tr>' +
        '<tr><th colspan="3"><b>' + t(L('Total = subtotal × (1 + PPN)', 'Total = subtotal × (1 + VAT)')) + '</b></th><td class="r num"><b>' + rp(tot) + '</b></td><td colspan="2"></td></tr></tfoot></table></div>';
      var grnTbl = P.table(grns, [
        { h: 'GRN', v: function (g) { return mono(g.id) + sub(esc(dt(g.at))); } },
        { h: L('Qty per baris', 'Qty per line'), v: function (g) { return g.qty ? p.lines.map(function (l, i) { return g.qty[i] ? mono(l[0]) + ' × ' + n0(g.qty[i]) : ''; }).filter(Boolean).join('<br>') : '—'; } },
        { h: L('Nilai', 'Value'), cls: 'r num', v: function (g) { return rp(F.grnValue(g)); } },
        { h: L('Diterima oleh', 'Received by'), v: function (g) { return emp(g.by) + (g.note ? sub(esc(T(g.note))) : ''); } },
        { h: L('Jurnal', 'Journal'), v: function (g) { return g.jv ? jvLink(g.jv) : '—'; } }
      ], function (g) { return { t: esc(g.id), r: rp(F.grnValue(g)), s: esc(dt(g.at)) + ' · ' + emp(g.by) }; }, null, { empty: L('Belum ada penerimaan.', 'No receipt yet.') });
      var m3 = exps.length ? exps.map(function (e) {
        var m = F.match3(e);
        return '<div class="su10-m3"><div class="su10-m3-h">' + P.expLink(e.id) + ' <span class="sub5">' + esc(e.sinv || '') + ' · ' + esc(dt(e.date)) + '</span> ' + (m.ok ? A.chip('ok', L('Cocok', 'Matched'), 'checkc') : A.chip('crit', L('Tidak cocok', 'Mismatch'), 'alert')) + '</div>' +
          '<div class="su10-m3-g"><div><span>' + t(L('PO (harga × qty)', 'PO (price × qty)')) + '</span><b class="num">' + rp(m.po) + '</b></div><div><span>' + t(L('Diterima (GRN)', 'Received (GRN)')) + '</span><b class="num">' + rp(m.grni) + '</b><small>' + (m.grns || []).join(', ') + '</small></div><div><span>' + t(L('Invoice supplier', 'Supplier invoice')) + '</span><b class="num">' + rp(m.inv) + '</b></div><div><span>' + t(L('Selisih', 'Difference')) + '</span><b class="num ' + (m.ok ? '' : 'su10-neg') + '">' + (m.ok ? '0' : sgn(m.diffAmt, rp)) + '</b><small>' + t(L('toleransi ', 'tolerance ')) + rp(m.tol) + '</small></div></div></div>';
      }).join('') : A.empty(L('Belum ada invoice supplier untuk PO ini.', 'No supplier invoice for this PO yet.'));
      var main = '', side = '';
      if (p.st === 'draft' && can('pur.po.approve')) main = own ? '' : ownerOnly ? '' : A.btn('primary', L('Setujui PO', 'Approve PO'), 'checkc', { act: 'poOk', val: p.id, cls: 'btn-xl' });
      else if (p.st === 'approved' && can('pur.po')) main = A.btn('primary', L('Kirim ke supplier', 'Send to supplier'), 'upload', { act: 'poSend', val: p.id, cls: 'btn-xl' });
      if (['approved', 'sent', 'partial'].indexOf(p.st) >= 0 && can('pur.rcv')) { var rb = A.btn(main ? 'ghost' : 'primary', L('Terima barang', 'Receive goods'), 'download', { act: 'rcv', val: p.id, cls: 'btn-xl' }); if (main) side += rb; else main = rb; }
      if (['draft', 'approved', 'sent'].indexOf(p.st) >= 0 && !p.rcv.some(function (q) { return q > 0; }) && can('pur.po')) side += A.btn('danger', L('Batalkan', 'Cancel'), 'xc', { act: 'poCancel', val: p.id, cls: 'btn-xl' });
      return P8.hero({ id: p.id, icon: 'invoice', title: esc(F.supName(p.sup)), sub: p.lines.length + ' ' + t(L('baris', 'lines')) + ' · ' + t(L('dibuat ', 'created ')) + esc(dt(p.at)) + (p.by ? ' · ' + emp(p.by) : ''), chips: stc(F.PO_ST, p.st) + (p.capex ? ' ' + A.chip('appr', L('Capex · hanya Owner', 'Capex · Owner only'), 'lock') : ''),
          facts: [[L('Total', 'Total'), rp(tot), 'num'], [L('Tanggal kirim', 'Delivery date'), esc(dt(p.dlv))], [L('Termin', 'Terms'), p.terms + ' ' + t(L('hari', 'days'))], [L('Cost center', 'Cost centre'), esc(p.cc)],
            [L('Disetujui', 'Approved'), p.appr ? emp(p.appr) + (p.apprAt ? sub(esc(dt(p.apprAt))) : '') : '—'], [L('Supplier', 'Supplier'), supLink(p.sup)]] }) +
        (p.capex ? note(t(L('PO capex tidak pernah disetujui otomatis: hanya Owner, setelah skenario investasi. ', 'A capex PO is never auto-approved: Owner only, after an investment scenario. ')) + (p.note ? esc(T(p.note)) : ''), 'lock', 'warn') : '') +
        (p.bypass ? note(t(L('PO tanpa PR / RFQ (diaudit). Alasan: ', 'PO without a PR / RFQ (audited). Reason: ')) + esc(T(p.bypass)), 'alert', 'warn') : '') +
        (p.st === 'draft' && own && can('pur.po.approve') ? note(t(L('Anda pembuat PO ini: persetujuan oleh orang lain.', 'You created this PO: someone else approves it.')), 'lock', 'warn') : '') +
        (p.st === 'draft' && ownerOnly && can('pur.po.approve') ? note(t(L('Menunggu persetujuan Owner.', 'Waiting for Owner approval.')), 'shield', 'warn') : '') +
        card(L('Baris PO', 'PO lines'), lines, { icon: 'list', count: p.lines.length }) +
        card(L('Penerimaan (GRN)', 'Receipts (GRN)'), grnTbl, { icon: 'download', count: grns.length }) +
        card(L('Three-way match', 'Three-way match'), m3 + sub(t(L('PO × qty diterima vs nilai GRN vs invoice supplier (sebelum PPN).', 'PO × received qty vs GRN value vs supplier invoice (before VAT).'))), { icon: 'scale', count: exps.length }) +
        card(L('Jejak dokumen', 'Document trace'), flow([p.pr ? { i: 'file', l: 'PR', s: p.pr, go: 'PUR-002', rec: p.pr } : null, rfq ? { i: 'message', l: 'RFQ', s: rfq.id, go: 'PUR-004', rec: rfq.id } : null, rfq ? { i: 'columns', l: L('Perbandingan', 'Comparison'), s: T(rfq.awardWhy || ''), go: 'PUR-005', rec: rfq.id } : null,
            { i: 'invoice', l: 'PO', s: p.id }].concat(grns.map(function (g) { return { i: 'package', l: 'GRN', s: g.id }; })).concat(exps.map(function (e) { return { i: 'file', l: L('Invoice supplier', 'Supplier invoice'), s: e.id, go: 'AP-002', rec: e.id }; })).concat(grns.filter(function (g) { return g.jv; }).map(function (g) { return { i: 'list', l: L('Jurnal', 'Journal'), s: g.jv, go: 'ACC-004', rec: g.jv }; }))) +
          (p.log && p.log.length ? '<h3 class="h5">' + t(L('Riwayat status', 'Status history')) + '</h3>' + logList(p.log) : '') + '<h3 class="h5">' + t(L('Jejak audit', 'Audit trail')) + '</h3>' + auditList(p.id), { icon: 'history' }) +
        (main || side ? P8.abar(main, side) : '');
    },
    act: PO_ACT
  };

  /* ---------- PUR-007 Supplier Detail ---------- */
  V['PUR-007'] = {
    title: function (rec) { return rec ? L(F.supName(rec), F.supName(rec)) : null; },
    render: function (c) {
      var c0 = cx();
      if (!c.rec) {
        var defs = [{ k: 'cat', l: L('Kategori', 'Category'), opts: Object.keys(D.SUP_CATS).map(function (k) { return [k, D.SUP_CATS[k]]; }), fn: function (s, v) { return s.cat === v; } }];
        var rows = A.applyFilters(F.suppliers(c0), defs, function (s) { return s.id + ' ' + s.n + ' ' + s.city; });
        return P.head(t(L('Master supplier: kontak, termin, lead time, rating kualitas dan delivery.', 'Supplier master: contact, terms, lead time, quality and delivery rating.')), '', freshLive(L('supplier', 'suppliers'))) + A.filters(defs, { search: L('Cari supplier', 'Search supplier') }) +
          card(L('Supplier', 'Suppliers'), P.table(rows, [
            { h: L('Kode', 'Code'), v: function (s) { return mono(s.id); } },
            { h: L('Nama', 'Name'), v: function (s) { return '<b>' + supLink(s.id) + '</b>' + sub(catN(D.SUP_CATS, s.cat)); } },
            { h: L('Kontak', 'Contact'), v: function (s) { return esc(s.contact) + sub(esc(s.phone)); } },
            { h: L('Kota', 'City'), v: function (s) { return esc(s.city); } },
            { h: L('Termin', 'Terms'), cls: 'r num', v: function (s) { return s.term + ' ' + t(L('hr', 'd')); } },
            { h: 'Lead', cls: 'r num', v: function (s) { return s.lead + ' ' + t(L('hr', 'd')); } },
            { h: L('Kualitas', 'Quality'), v: function (s) { return supRating(s.q); } },
            { h: L('Delivery', 'Delivery'), v: function (s) { return supRating(s.dr); } },
            { h: L('Status', 'Status'), v: function (s) { return stc(SUP_ST, s.st); } }
          ], function (s) { return { t: esc(s.n), r: '★ ' + n0(s.q, 1), s: catN(D.SUP_CATS, s.cat) + ' · ' + esc(s.city) + ' · ' + s.term + ' ' + t(L('hr', 'd')), chip: stc(SUP_ST, s.st) }; }, function (s) { return href('PUR-007', s.id); }), { icon: 'briefcase', count: rows.length });
      }
      var s = F.supplier(c.rec); if (!s) return notFound('PUR-007', L('Supplier', 'Supplier'));
      var pf = F.supPerf(s.id), pos = S().pos.filter(function (p) { return p.sup === s.id; }).sort(function (a, b) { return a.at < b.at ? 1 : -1; }), exps = S().exp.filter(function (e) { return e.sup === s.id; }).sort(function (a, b) { return a.date < b.date ? 1 : -1; });
      var ph = pf.prices.slice().sort(function (a, b) { return a.item < b.item ? -1 : a.item > b.item ? 1 : a.date < b.date ? 1 : -1; });
      function prev(x) { var o = pf.prices.filter(function (y) { return y.item === x.item && y.date < x.date; }).sort(function (a, b) { return a.date < b.date ? 1 : -1; })[0]; return o; }
      var items = S().stock.filter(function (x) { return x.sup === s.id; });
      return P8.hero({ id: s.id, icon: 'briefcase', title: esc(s.n), sub: catN(D.SUP_CATS, s.cat) + ' · ' + esc(s.city), chips: stc(SUP_ST, s.st),
          facts: [[L('Kontak', 'Contact'), esc(s.contact) + sub(esc(s.phone))], [L('Alamat', 'Address'), esc(s.city)], [L('Termin bayar', 'Payment terms'), s.term + ' ' + t(L('hari', 'days'))], [L('Lead time', 'Lead time'), s.lead + ' ' + t(L('hari', 'days'))], [L('Rating kualitas', 'Quality rating'), supRating(s.q)], [L('Rating delivery', 'Delivery rating'), supRating(s.dr)]] }) +
        P.kpis([
          { k: L('Order 12 bulan', 'Orders 12 months'), v: n0(pf.orders), icon: 'clipboard' },
          { k: L('Tepat waktu', 'On time'), v: pct(pf.otd), s: n0(pf.onTime) + ' / ' + n0(pf.orders), icon: 'truck', tone: pf.otd == null ? null : pf.otd >= 90 ? 'ok' : pf.otd >= 75 ? 'warn' : 'crit' },
          { k: L('Isu kualitas', 'Quality issues'), v: n0(pf.issues), icon: 'alert', tone: pf.issues ? 'warn' : 'ok' },
          { k: L('Belanja', 'Spend'), v: rpj(pf.spend), s: t(L('invoice + PO aktif', 'invoices + active POs')), icon: 'coins' },
          { k: L('AP terbuka', 'Open AP'), v: rpj(pf.openAp), icon: 'clock', go: P.open('AP-003') ? 'AP-003' : null }
        ]) +
        '<div class="g2-10">' + card(L('Riwayat harga', 'Price history'), P.table(ph, [
            { h: L('Item', 'Item'), v: function (x) { return itemL(x.item) + sub(itemN(x.item)); } },
            { h: L('Tanggal', 'Date'), v: function (x) { return esc(dt(x.date)); } },
            { h: L('Harga', 'Price'), cls: 'r num', v: function (x) { return rp(x.price); } },
            { h: L('Perubahan', 'Change'), cls: 'r num', v: function (x) { var o = prev(x); return o ? '<span class="' + (x.price > o.price ? 'su10-neg' : 'su10-up') + '">' + sgn((x.price - o.price) / o.price * 100, function (v) { return pct(v); }) + '</span>' : '—'; } }
          ], function (x) { return { t: itemN(x.item), r: rp(x.price), s: esc(dt(x.date)) }; }, null, { empty: L('Belum ada riwayat harga.', 'No price history yet.') }), { icon: 'history', count: ph.length }) +
          card(L('Item yang dipasok', 'Items supplied'), items.length ? '<ul class="su10-ul">' + items.map(function (x) { return '<li>' + stockLink(x.code) + ' <span>' + t(x.n) + '</span> ' + stockSt(x) + '</li>'; }).join('') + '</ul>' : A.empty(L('Bukan supplier utama item stok.', 'Not the preferred supplier of any stock item.')), { icon: 'package', count: items.length }) + '</div>' +
        '<div class="g2-10">' + card(L('Purchase order', 'Purchase orders'), P.table(pos, [poCols()[0], poCols()[3], poCols()[4], poCols()[6]], poCard, function (p) { return href('PUR-006', p.id); }, { empty: L('Belum ada PO.', 'No PO yet.') }), { icon: 'invoice', count: pos.length }) +
          card(L('Invoice supplier', 'Supplier invoices'), P.table(exps, [
            { h: L('Invoice', 'Invoice'), v: function (e) { return P.expLink(e.id) + sub(esc(e.sinv || '')); } },
            { h: L('Tanggal', 'Date'), v: function (e) { return esc(dt(e.date)); } },
            { h: L('Jumlah', 'Amount'), cls: 'r num', v: function (e) { return rpj(e.amt + e.tax); } },
            { h: 'PO', v: function (e) { return e.po ? poLink(e.po) : '—'; } },
            { h: L('Status', 'Status'), v: function (e) { return stc(F.EXP_ST, F.expSt(e)); } }
          ], function (e) { return { t: esc(e.id), r: rpj(e.amt + e.tax), s: esc(e.sinv || '') + ' · ' + esc(dt(e.date)), chip: stc(F.EXP_ST, F.expSt(e)) }; }, null, { empty: L('Belum ada invoice.', 'No invoice yet.') }), { icon: 'file', count: exps.length }) + '</div>';
    }
  };
  // One wrapper class per screen so the su10 styles never leak into other phases.
  ['PRICE-001', 'PRICE-002', 'PRICE-003', 'PRICE-004', 'PRICE-005', 'INV-001', 'INV-002', 'INV-003', 'INV-004', 'INV-005', 'PUR-001', 'PUR-002', 'PUR-003', 'PUR-004', 'PUR-005', 'PUR-006', 'PUR-007'].forEach(function (id) {
    var r0 = V[id].render; V[id].render = function (c) { return '<div class="su10">' + r0(c) + '</div>'; };
  });
})();
