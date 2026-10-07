/* JFRESH OS — Phase 10 screens (part 5): assets & depreciation (AST-001…005), budget, reconciliation and
   monthly close (BUD-001…004), CFO financial health, ratios, scale-up decisions, investment scenarios and
   recommended actions (CFO-001…007).
   Desktop first for the CFO, budget and reconciliation; iPad for asset review and the CFO quick view;
   phone shows only the executive summary and alerts. Every number comes from the finance engine
   (assets/js/jfos-fin-sup.js, jfos-fin-cfo.js); every score drills to inputs, weights, actual values,
   targets, contribution, assumptions and data freshness. Scenario inputs are assumptions, never facts,
   and no score or scenario ever authorises capex. Machine operations stay in Phase 8 (linked, not copied). */
(function () {
  var A = window.JFAPP, P = A && A.P10, H = A && A.P5, P8 = A && A.P8; if (!A || !P || !H || !P8) return;
  var F = P.F, V = A.V, T = A.T, L = A.L, t = A.t, esc = A.esc, ic = A.ic, can = A.can, href = A.href;
  var lnk = H.lnk, card = H.card, kv = H.kv, note = H.note, dlg = H.dlg, fld = H.fld, inp = H.inp, sel = H.sel, area = H.area;
  var rp = P.rp, rpj = P.rpj, n0 = P.n0, pct = P.pct, dt = P.dt, mon = P.mon, emp = P.emp, stc = P.stc, mono = P.mono;
  var JT = 1e6;

  /* ================= Local helpers ================= */
  function cx() { return P.cx(); }
  function mAdd(p, n) { var y = +p.slice(0, 4), m = +p.slice(5, 7) - 1 + n; y += Math.floor(m / 12); m = ((m % 12) + 12) % 12; return y + '-' + String(m + 1).padStart(2, '0'); }
  function plantN(id) { var x = (F.D.PLANTS || []).filter(function (p) { return p[0] === id; })[0]; return x ? t(x[1]) : esc(id || '—'); }
  function plantOpts(skip) { return (F.D.PLANTS || []).filter(function (p) { return p[0] !== skip; }).map(function (p) { return [p[0], Array.isArray(p[1]) ? p[1] : [p[1], p[1]]]; }); }
  function catN(k) { var c = F.AST_CATS[k]; return c ? t(c[0]) : esc(k); }
  function sgn(v) { return v > 0 ? '+' : ''; }
  // Ratio value with its unit (×, %, days, months).
  function fr(v, u) { if (v == null || isNaN(v)) return '—'; return u === '%' ? pct(v) : u === 'd' ? n0(v, 1) + ' ' + t(L('hari', 'days')) : u === 'mo' ? n0(v, 1) + ' ' + t(L('bln', 'mo')) : n0(v, 2) + '×'; }
  // A decision input value with its unit (Rp, %, x, d, mo, '' or a bilingual unit).
  function fv(v, u) {
    if (v == null || (typeof v === 'number' && isNaN(v))) return '—';
    if (typeof v === 'string') return esc(v);
    if (u === 'Rp') return rpj(v); if (u === '%') return pct(v); if (u === 'x' || u === 'd' || u === 'mo') return fr(v, u);
    if (Array.isArray(u)) return n0(v, v % 1 ? 1 : 0) + ' ' + t(u);
    return n0(v, v % 1 ? 1 : 0) + (u ? ' ' + esc(u) : '');
  }
  function tick(ok, warn) { return ok ? (warn ? A.chip('warn', L('Lolos, ada catatan', 'Passed, with a note'), 'alert') : A.chip('ok', L('Lolos', 'Passed'), 'checkc')) : A.chip('crit', L('Belum', 'Not yet'), 'xc'); }
  function freshR(R) { return P.fresh({ src: L('rasio periode ' + R.p + ' (' + T(F.PER_ST[R.perSt][0]) + ') + rasio live per ' + R.live, 'ratios of period ' + R.p + ' (' + F.PER_ST[R.perSt][0][1] + ') + live ratios at ' + R.live), at: R.at, kind: 'mixed' }); }
  function freshD(fq) { return fq ? P.fresh({ src: fq.src, at: fq.at, kind: fq.kind }) : ''; }
  function rows2(list) { return '<ul class="cf10-ul">' + list.filter(Boolean).map(function (x) { return '<li>' + (typeof x === 'string' ? x : t(x)) + '</li>'; }).join('') + '</ul>'; }
  function ckList(list) { return '<ul class="cf10k">' + list.map(function (g) { return '<li class="' + (g.ok ? 'ok' : 'no') + '">' + ic(g.ok ? 'checkc' : 'xc') + '<span>' + t(g.n) + (g.v ? ' <small class="sub5">' + esc(g.v) + '</small>' : '') + '</span></li>'; }).join('') + '</ul>'; }
  function scrBtn(s, rec, label, q) { return P.open(s) ? A.btn('ghost', label, 'arrow', { go: s, rec: rec, qs: q, cls: 'btn-sm' }) : ''; }
  function Lx(l, s) { return [l[0] + s, l[1] + s]; }
  function months(from, to) { var out = []; for (var m = from; m <= to; m = mAdd(m, 1)) out.push(m); return out; }

  /* ================= AST-001 Asset Dashboard ================= */
  V['AST-001'] = {
    render: function (c) {
      var d = F.astDash(cx()); if (!d) return A.empty(L('Tidak ada akses.', 'No access.'));
      var maint = (d.bySt.maint || 0) + (d.bySt.repair || 0), repl = F.replacement(cx()) || [], cur = F.curPeriod(), run = F.depRun(cur);
      var maxC = Math.max.apply(null, d.byCat.map(function (x) { return x.cost; }).concat([1]));
      var head = P.head(t(L('Nilai perolehan, penyusutan, NBV dan status aset. NBV per akhir periode ' + d.p + '; penyusutan bulanan dari periode berjalan.', 'Acquisition cost, depreciation, NBV and asset status. NBV at the end of period ' + d.p + '; monthly depreciation from the running period.')),
        A.pbtn('ast.edit', 'primary', L('Tambah Aset', 'Add Asset'), 'plus', { go: 'AST-002', qs: 'add=1' }), P.fresh({ src: L('register aset + ledger ' + d.p, 'asset register + ledger ' + d.p), kind: 'ledger', at: F.nowS() }));
      var k = P.kpis([
        { k: L('Jumlah aset', 'Assets'), v: n0(d.n), s: t(L('aktif, idle, maintenance, repair', 'active, idle, maintenance, repair')), icon: 'building', go: 'AST-002' },
        { k: L('Nilai perolehan', 'Acquisition cost'), v: rpj(d.cost), s: rp(d.cost), icon: 'coins', go: 'AST-002' },
        { k: L('Akumulasi penyusutan', 'Accumulated depreciation'), v: rpj(d.acc), s: t(L('per ', 'at ')) + mon(d.p), icon: 'arrowdn', go: 'AST-004', q: { p: d.p } },
        { k: L('Nilai buku (NBV)', 'Net book value (NBV)'), v: rpj(d.nbv), s: pct(d.cost ? d.nbv / d.cost * 100 : null, 0) + ' ' + t(L('dari perolehan', 'of cost')), icon: 'scale', go: 'AST-002' },
        { k: L('Penyusutan / bulan', 'Depreciation / month'), v: rpj(d.monthly), s: mon(cur) + ' · ' + (run.posted ? t(L('sudah diposting', 'posted')) : t(L('belum diposting', 'not posted'))), icon: 'trend', go: 'AST-004', tone: run.posted ? 'ok' : 'warn' },
        { k: L('Maintenance / repair', 'Maintenance / repair'), v: n0(maint), s: t(L('aset sedang tidak produktif', 'assets out of production')), icon: 'wrench', tone: maint ? 'warn' : 'ok', go: 'AST-002', q: { st: 'repair' } }
      ]);
      var cat = card(L('Per kategori', 'By category'), P.table(d.byCat, [
        { h: L('Kategori', 'Category'), v: function (x) { return lnk('AST-002', null, '<b>' + catN(x.cat) + '</b>', { cat: x.cat }) + '<small class="sub5">GL ' + esc(F.AST_CATS[x.cat][1]) + '</small>'; } },
        { h: L('Aset', 'Assets'), cls: 'r num', v: function (x) { return n0(x.n); } },
        { h: L('Perolehan', 'Cost'), cls: 'r num', v: function (x) { return rpj(x.cost); } },
        { h: 'NBV', cls: 'r num', v: function (x) { return rpj(x.nbv); } },
        { h: L('NBV % ', 'NBV %'), v: function (x) { return P.bar(x.nbv, x.cost, x.nbv / x.cost < 0.25 ? 'warn' : 'info') + '<small class="sub5">' + pct(x.nbv / x.cost * 100, 0) + '</small>'; } },
        { h: L('Porsi biaya', 'Cost share'), v: function (x) { return P.bar(x.cost, maxC, 'info'); } }
      ], function (x) { return { t: catN(x.cat), r: rpj(x.nbv), s: n0(x.n) + ' ' + t(L('aset', 'assets')) + ' · ' + t(L('perolehan ', 'cost ')) + rpj(x.cost) }; }), { icon: 'layers' });
      var st = card(L('Per status', 'By status'), '<div class="cf10a-st">' + Object.keys(F.AST_ST).filter(function (s) { return d.bySt[s]; }).map(function (s) {
        return '<a class="cf10a-sti" href="' + href('AST-002', null, { st: s }) + '">' + stc(F.AST_ST, s) + '<b class="num">' + d.bySt[s] + '</b></a>';
      }).join('') + '</div>', { icon: 'flag' });
      var war = card(L('Garansi segera habis (≤ 240 hari)', 'Warranties ending soon (≤ 240 days)'), d.warrantySoon.length ? '<ul class="cf10a-l">' + d.warrantySoon.map(function (a) { return '<li>' + P.astLink(a.code) + ' <span>' + t(a.n) + '</span><b class="num">' + dt(a.warranty) + '</b></li>'; }).join('') + '</ul>' : A.empty(L('Tidak ada garansi yang segera habis.', 'No warranty ending soon.')), { icon: 'shield', count: d.warrantySoon.length, link: ['AST-002', L('Semua garansi', 'All warranties')] });
      var full = card(L('Sudah habis disusutkan', 'Fully depreciated'), d.full.length ? '<ul class="cf10a-l">' + d.full.map(function (a) { return '<li>' + P.astLink(a.code) + ' <span>' + t(a.n) + '</span>' + stc(F.AST_ST, a.st) + '</li>'; }).join('') + '</ul>' : A.empty(L('Belum ada.', 'None yet.')), { icon: 'checkc', count: d.full.length });
      var rp3 = repl.filter(function (r) { return r.out !== 'maintain'; }).slice(0, 4);
      var rc = card(L('Insight penggantian', 'Replacement insight'), rp3.length ? '<ul class="cf10a-l">' + rp3.map(function (r) { return '<li>' + P.astLink(r.a.code) + ' <span>' + t(r.a.n) + ' · ' + t(L('umur ', 'age ')) + r.ageP + '% · NBV ' + r.nbvP + '%</span>' + stc(F.REPL_OUT, r.out) + '</li>'; }).join('') + '</ul>' : A.empty(L('Semua mesin cukup dipertahankan.', 'Every machine can be maintained.')), { icon: 'refresh', link: ['AST-005', L('Lihat semua', 'See all')] });
      return head + k + '<div class="g2-10 cf10a-g">' + cat + '<div class="col10">' + st + rc + '</div>' + war + full + '</div>';
    }
  };

  /* ================= AST-002 Asset Register ================= */
  var VIEW_AST = [['', L('Register', 'Register'), 'list'], ['war', L('Garansi', 'Warranty'), 'shield'], ['trf', L('Transfer', 'Transfer'), 'swap'], ['doc', L('Dokumen', 'Documents'), 'file']];
  function addAssetDlg() {
    var links = (F.PR && F.PR.state ? F.PR.state().mach : []).filter(function (m) { return !F.asset(m.id); });
    dlg({ title: L('Tambah aset', 'Add asset'), icon: 'plus', ok: L('Simpan & jurnal', 'Save & journal'),
      sub: t(L('Aset baru dijurnal Dr aset tetap / Cr utang usaha. Penyusutan garis lurus mulai bulan berikutnya.', 'A new asset is journalised Dr fixed asset / Cr accounts payable. Straight-line depreciation starts the next month.')),
      body: '<div class="g2-10">' + fld(L('Nama aset', 'Asset name'), inp('n', ''), { req: true, wide: true }) + fld(L('Kategori', 'Category'), sel('cat', P.opts(F.AST_CATS), 'machine'), { req: true }) +
        fld(L('Merek / model', 'Brand / model'), inp('brand', '')) + fld(L('Nomor seri', 'Serial number'), inp('serial', '')) +
        fld(L('Tanggal perolehan', 'Acquisition date'), inp('acq', F.today(), { type: 'date' }), { req: true }) + fld(L('Harga perolehan (Rp juta)', 'Acquisition cost (Rp million)'), inp('cost', '', { num: true }), { req: true }) +
        fld(L('Masa manfaat (bulan)', 'Useful life (months)'), inp('life', '96', { num: true }), { req: true }) + fld(L('Nilai sisa (%)', 'Residual value (%)'), inp('res', '10', { num: true })) +
        fld(L('Lokasi', 'Location'), sel('loc', plantOpts(), 'PL-01')) + fld(L('Vendor', 'Vendor'), sel('vendor', [['', L('—', '—')]].concat((F.state().sups || []).map(function (s) { return [s.id, [s.n, s.n]]; })), '')) +
        fld(L('Garansi sampai', 'Warranty until'), inp('warranty', '', { type: 'date' })) + fld(L('Mesin Fase 8 (machine link)', 'Phase 8 machine (machine link)'), sel('link', [['', L('Tidak ada', 'None')]].concat(links.map(function (m) { return [m.id, [m.id + ' · ' + T(m.n), m.id + ' · ' + m.n[1]]]; })), '')) + '</div>',
      onOk: function (v) {
        var r = F.addAsset(cx(), { n: v.n, cat: v.cat, brand: v.brand, serial: v.serial, acq: v.acq, cost: v.cost === '' ? null : Number(String(v.cost).replace(',', '.')) * JT, life: v.life, res: v.res, loc: v.loc, vendor: v.vendor || null, warranty: v.warranty || null, link: v.link || null });
        if (!r.ok) return r.msg; P.after(L('Aset ' + r.asset.code + ' ditambahkan dan dijurnal.', 'Asset ' + r.asset.code + ' added and journalised.')); setTimeout(function () { A.go('AST-003', r.asset.code); }, 300); return true;
      } });
  }
  function transferDlg(code) {
    var a = F.asset(code); if (!a) return;
    P.reasonDlg({ title: L('Transfer aset ' + a.code, 'Transfer asset ' + a.code), icon: 'swap', ok: L('Transfer', 'Transfer'), sub: t(a.n) + ' · ' + t(L('lokasi sekarang ', 'current location ')) + plantN(a.loc),
      body: fld(L('Pindah ke', 'Move to'), sel('to', plantOpts(a.loc), plantOpts(a.loc)[0][0]), { req: true }),
      fn: function (reason, v) { return F.transferAsset(cx(), a.code, v.to, reason); }, done: L('Aset dipindahkan. Riwayat transfer tercatat.', 'Asset moved. Transfer history recorded.') });
  }
  function statusDlg(code) {
    var a = F.asset(code); if (!a) return;
    var o = P.opts(F.AST_ST).filter(function (x) { return x[0] !== a.st; });
    P.reasonDlg({ title: L('Ubah status ' + a.code, 'Change status of ' + a.code), icon: 'flag', ok: L('Ubah status', 'Change status'), sub: t(a.n) + ' · ' + t(L('status sekarang: ', 'current status: ')) + t(F.AST_ST[a.st][0]),
      body: fld(L('Status baru', 'New status'), sel('to', o, o[0][0]), { req: true }) + note(t(L('Status "Dilepas" menjurnal pelepasan (Dr akumulasi + rugi pelepasan, Cr aset) dan tidak bisa dibatalkan.', '"Disposed" journalises the disposal (Dr accumulated + loss on disposal, Cr asset) and cannot be undone.')), 'alert', 'warn'),
      fn: function (reason, v) { return F.setAssetStatus(cx(), a.code, v.to, reason); }, done: L('Status aset diubah. Riwayat tercatat.', 'Asset status changed. History recorded.') });
  }
  V['AST-002'] = {
    render: function (c) {
      var all = F.assets(cx()), view = c.q.v || '', p = F.lastClosed();
      var defs = [
        { k: 'cat', l: L('Kategori', 'Category'), opts: P.opts(F.AST_CATS), fn: function (a, v) { return a.cat === v; } },
        { k: 'st', l: L('Status', 'Status'), opts: P.opts(F.AST_ST), fn: function (a, v) { return a.st === v; } },
        { k: 'loc', l: L('Lokasi', 'Location'), opts: plantOpts(), fn: function (a, v) { return a.loc === v; } }];
      var rows = A.applyFilters(all, defs, function (a) { return [a.code, T(a.n), a.brand, a.serial, a.link || ''].join(' '); });
      if (view === 'war') rows = rows.filter(function (a) { return a.warranty; }).sort(function (a, b) { return a.warranty < b.warranty ? 1 : -1; });
      var tot = rows.reduce(function (s, a) { var d = F.depAt(a, p); s.cost += a.cost; s.acc += d.acc; s.nbv += d.nbv; s.mon += a.st === 'disposed' || d.full ? 0 : d.monthly; return s; }, { cost: 0, acc: 0, nbv: 0, mon: 0 });
      function warC(a) { if (!a.warranty) return '<span class="sub5">—</span>'; var left = Math.round((new Date(a.warranty) - new Date(F.today())) / 864e5); return dt(a.warranty) + ' ' + (left < 0 ? A.chip('mute', L('Habis', 'Expired')) : left <= 240 ? A.chip('warn', L(left + ' hari', left + ' days')) : A.chip('ok', L('Aktif', 'Active'))); }
      var cols = [
        { h: L('Aset', 'Asset'), v: function (a) { return P.astLink(a.code) + '<b class="cf10a-n">' + t(a.n) + '</b><small class="sub5">' + esc(a.brand) + ' · SN ' + esc(a.serial) + (a.link ? ' · ' + ic('washer') + esc(a.link) : '') + '</small>'; } },
        { h: L('Kategori', 'Category'), v: function (a) { return catN(a.cat); } },
        { h: L('Perolehan', 'Acquisition'), cls: 'r num', v: function (a) { return rp(a.cost) + '<small class="sub5">' + dt(a.acq) + '</small>'; } },
        { h: L('Masa manfaat', 'Useful life'), cls: 'r num', v: function (a) { var d = F.depAt(a, p); return n0(a.life) + ' ' + t(L('bln', 'mo')) + '<small class="sub5">' + t(L('Garis lurus', 'Straight line')) + ' · ' + d.months + '/' + a.life + '</small>'; } },
        { h: L('Penyusutan/bln', 'Dep./month'), cls: 'r num', v: function (a) { var d = F.depAt(a, p); return d.full ? '<span class="sub5">' + t(L('selesai', 'done')) + '</span>' : rp(d.monthly); } },
        { h: L('Akumulasi', 'Accumulated'), cls: 'r num', v: function (a) { return rp(F.depAt(a, p).acc); } },
        { h: 'NBV', cls: 'r num', v: function (a) { return '<b>' + rp(F.depAt(a, p).nbv) + '</b>'; } },
        { h: L('Lokasi / PIC', 'Location / owner'), v: function (a) { return plantN(a.loc) + '<small class="sub5">' + emp(a.user) + '</small>'; } },
        view === 'doc' ? { h: L('Dokumen', 'Documents'), v: function (a) { return a.docs.map(function (d) { return '<span class="cf10a-doc">' + ic('file') + t(d) + '</span>'; }).join(''); } }
          : { h: L('Vendor / garansi', 'Vendor / warranty'), v: function (a) { return (a.vendor ? P.supLink(a.vendor) : '—') + '<small class="sub5">' + warC(a) + '</small>'; } },
        { h: L('Status', 'Status'), v: function (a) { return stc(F.AST_ST, a.st); } },
        view === 'trf' && can('ast.edit') ? { h: L('Aksi', 'Action'), v: function (a) { return ['disposed', 'retired'].indexOf(a.st) < 0 ? A.btn('ghost', L('Transfer', 'Transfer'), 'swap', { act: 'trf', val: a.code, cls: 'btn-sm' }) : ''; } } : null
      ].filter(Boolean);
      var trf = view === 'trf' ? card(L('Riwayat transfer', 'Transfer history'), P.table(F.state().astEv.filter(function (e) { return e.kind === 'transfer'; }).slice().reverse(), [
        { h: L('Tanggal', 'Date'), v: function (e) { return dt(e.at); } }, { h: L('Aset', 'Asset'), v: function (e) { return P.astLink(e.code); } },
        { h: L('Dari → ke', 'From → to'), v: function (e) { return plantN(e.from) + ' → ' + plantN(e.to); } }, { h: L('Oleh', 'By'), v: function (e) { return emp(e.by); } }, { h: L('Alasan', 'Reason'), v: function (e) { return t(e.reason); } }
      ], function (e) { return { t: esc(e.code), r: dt(e.at), s: plantN(e.from) + ' → ' + plantN(e.to) + ' · ' + t(e.reason) }; }, null, { empty: L('Belum ada transfer.', 'No transfer yet.') }), { icon: 'swap' }) : '';
      return P.head(t(L('Setiap aset: perolehan, masa manfaat, penyusutan garis lurus, NBV per ' + p + ', lokasi, PIC, vendor, garansi dan status.', 'Every asset: acquisition, useful life, straight-line depreciation, NBV at ' + p + ', location, owner, vendor, warranty and status.')),
        A.pbtn('ast.edit', 'primary', L('Tambah Aset', 'Add Asset'), 'plus', { act: 'add' }), P.fresh({ src: L('register aset · NBV per ' + p, 'asset register · NBV at ' + p), kind: 'ledger' })) +
        H.tabs(VIEW_AST.map(function (x) { return [x[0], x[1], x[2]]; }), view, 'v', { def: '' }) +
        A.filters(defs, { search: L('Cari kode, nama, serial, mesin', 'Search code, name, serial, machine') }) +
        P.kpis([{ k: L('Aset', 'Assets'), v: n0(rows.length), icon: 'list' }, { k: L('Perolehan', 'Cost'), v: rpj(tot.cost), icon: 'coins' }, { k: L('Akumulasi', 'Accumulated'), v: rpj(tot.acc), icon: 'arrowdn' }, { k: 'NBV', v: rpj(tot.nbv), icon: 'scale' }, { k: L('Penyusutan/bln', 'Dep./month'), v: rpj(tot.mon), icon: 'trend', go: 'AST-004' }], 'cf10a-k') +
        note(t(L('Rumus: Penyusutan bulanan = (Harga perolehan − Nilai sisa) ÷ Masa manfaat (bulan). Mulai bulan setelah perolehan, berhenti di akhir masa manfaat.', 'Formula: Monthly depreciation = (Acquisition cost − Residual value) ÷ Useful life (months). Starts the month after acquisition, stops at the end of the useful life.')), 'help') +
        card(view === 'war' ? L('Garansi', 'Warranty') : view === 'doc' ? L('Dokumen aset', 'Asset documents') : L('Register', 'Register'), P.table(rows, cols, function (a) { var d = F.depAt(a, p); return { t: esc(a.code) + ' · ' + t(a.n), r: rpj(d.nbv), s: catN(a.cat) + ' · ' + plantN(a.loc) + ' · ' + t(L('perolehan ', 'cost ')) + rpj(a.cost), chip: stc(F.AST_ST, a.st) }; }, function (a) { return href('AST-003', a.code); }), { icon: 'list', count: rows.length }) + trf;
    },
    after: function (c) { if (c.q.add && can('ast.edit')) setTimeout(addAssetDlg, 50); },
    act: { add: function () { addAssetDlg(); }, trf: function (el) { transferDlg(el.getAttribute('data-val')); } }
  };

  /* ================= AST-003 Asset Detail ================= */
  V['AST-003'] = {
    title: function (rec) { var a = rec && F.asset(rec); return a ? L(a.code + ' · ' + T(a.n), a.code + ' · ' + a.n[1]) : null; },
    render: function (c) {
      var a = c.rec ? F.asset(c.rec) : null;
      if (!a) {
        var list = F.assets(cx()).filter(function (x) { return x.link; });
        return P.head(t(L('Pilih aset mesin untuk melihat data keuangan (Fase 10) berdampingan dengan data operasional mesin (Fase 8).', 'Choose a machine asset to see its financial data (Phase 10) next to its machine operations (Phase 8).'))) +
          '<div class="cf10a-pick">' + list.map(function (x) { var d = F.depAt(x, F.lastClosed()), m = F.PR && F.PR.machine ? F.PR.machine(x.link) : null;
            return '<a class="card cf10a-pc" href="' + href('AST-003', x.code) + '"><span class="cf10a-pc-h">' + ic('washer') + '<b class="mono6">' + esc(x.code) + '</b>' + stc(F.AST_ST, x.st) + '</span><b>' + t(x.n) + '</b><small>' + ic('link') + esc(x.link) + (m ? ' · ' + stc(F.PR.MACH_ST, m.st) : '') + '</small><span class="cf10a-pc-f"><span>NBV <b class="num">' + rpj(d.nbv) + '</b></span><span>' + t(L('Umur ', 'Age ')) + '<b class="num">' + d.months + '/' + x.life + '</b></span></span></a>';
          }).join('') + '</div>';
      }
      var p = F.lastClosed(), cur = F.curPeriod(), d = F.depAt(a, p), x = F.machineLink(a.code), ev = F.astEvents(a.code), rl = (F.replacement(cx(), a.code) || [])[0];
      var depAmt = Math.round(a.cost * (1 - a.res / 100)), live = ['disposed', 'retired'].indexOf(a.st) < 0;
      var hero = P8.hero({ id: a.code + (a.link ? ' · ' + a.link : ''), icon: a.cat === 'vehicle' ? 'truck' : a.cat === 'machine' ? 'washer' : 'building', title: t(a.n), sub: catN(a.cat) + ' · ' + esc(a.brand) + ' · SN ' + esc(a.serial) + ' · ' + plantN(a.loc),
        chips: stc(F.AST_ST, a.st) + (d.full ? A.chip('mute', L('Habis disusutkan', 'Fully depreciated')) : ''),
        facts: [[L('Harga perolehan', 'Acquisition cost'), rp(a.cost), 'num'], [Lx(L('Akumulasi per ', 'Accumulated at '), p), rp(d.acc), 'num'], [L('NBV', 'NBV'), rp(d.nbv), 'num'], [L('Penyusutan/bln', 'Depreciation/month'), d.full ? '—' : rp(d.monthly), 'num'], [L('Masa manfaat terpakai', 'Useful life used'), d.months + ' / ' + a.life + ' ' + t(L('bln', 'mo')), 'num']] });
      var fin = card(L('Data keuangan', 'Financial data'), kv([
        [L('Tanggal perolehan', 'Acquisition date'), dt(a.acq)], [L('Harga perolehan', 'Acquisition cost'), rp(a.cost)], [L('Nilai sisa', 'Residual value'), pct(a.res, 0) + ' · ' + rp(a.cost - depAmt)],
        [L('Nilai yang disusutkan', 'Depreciable amount'), rp(depAmt)], [L('Metode', 'Method'), t(L('Garis lurus', 'Straight line'))], [L('Masa manfaat', 'Useful life'), n0(a.life) + ' ' + t(L('bulan', 'months'))],
        [L('Penyusutan bulanan', 'Monthly depreciation'), '<b>' + rp(d.monthly) + '</b><small class="sub5">' + rp(depAmt) + ' ÷ ' + a.life + '</small>'],
        [Lx(L('Akumulasi per ', 'Accumulated at '), p), rp(d.acc)], [Lx(L('NBV per ', 'NBV at '), p), '<b>' + rp(d.nbv) + '</b>'],
        x ? [L('Biaya maintenance 12 bln', 'Maintenance cost 12 months'), rp(x.mnt12)] : null, x ? [L('Nilai ganti baru', 'Replacement value'), rp(x.repl)] : null,
        [L('Vendor', 'Vendor'), a.vendor ? P.supLink(a.vendor) : '—'], [L('Garansi', 'Warranty'), a.warranty ? dt(a.warranty) : '—'], [L('PIC', 'Responsible'), emp(a.user)],
        a.jv ? [L('Jurnal perolehan', 'Acquisition journal'), P.jvLink(a.jv)] : null]), { icon: 'coins' });
      // Depreciation schedule: six past periods, the running one, and the next three.
      var sched = months(mAdd(cur, -6), mAdd(cur, 3)).filter(function (m) { return m > a.acq.slice(0, 7); }).map(function (m) { var y = F.depAt(a, m), z = F.depAt(a, mAdd(m, -1)); return { p: m, dep: y.acc - z.acc, acc: y.acc, nbv: y.nbv, jv: (F.state().depPosted || {})[m] || null }; });
      var sc = card(L('Jadwal penyusutan', 'Depreciation schedule'), d.full && !sched.some(function (r) { return r.dep > 0; }) ? note(t(L('Aset sudah habis disusutkan (' + a.life + ' bulan). NBV tetap ' + rp(d.nbv) + ' = nilai sisa sampai dilepas.', 'The asset is fully depreciated (' + a.life + ' months). NBV stays at ' + rp(d.nbv) + ' = residual value until disposal.')), 'checkc', 'info') : P.table(sched, [
        { h: L('Periode', 'Period'), v: function (r) { return mon(r.p) + (r.p === cur ? ' ' + A.chip('info', L('berjalan', 'running')) : r.p > cur ? ' ' + A.chip('mute', L('proyeksi', 'projected')) : ''); } },
        { h: L('Penyusutan', 'Depreciation'), cls: 'r num', v: function (r) { return rpj(r.dep); } }, { h: L('Akumulasi', 'Accumulated'), cls: 'r num', v: function (r) { return rpj(r.acc); } },
        { h: 'NBV', cls: 'r num', v: function (r) { return rpj(r.nbv); } }, { h: L('Posting', 'Posting'), v: function (r) { return r.jv ? P.jvLink(r.jv) : r.p > cur ? '<span class="sub5">—</span>' : A.chip('warn', L('Belum', 'Not yet')); } }
      ], function (r) { return { t: mon(r.p), r: rpj(r.nbv), s: t(L('Penyusutan ', 'Depreciation ')) + rp(r.dep) + ' · ' + (r.jv ? esc(r.jv) : t(L('belum diposting', 'not posted'))) }; }, function (r) { return href('AST-004', null, { p: r.p }); }), { icon: 'trend', link: ['AST-004', L('Run penyusutan', 'Depreciation run')] });
      var ml = '';
      if (x) {
        var wo = x.wos.filter(function (w) { return w.st !== 'ready'; });
        ml = card(L('Machine link · data operasional Fase 8', 'Machine link · Phase 8 operations'), note(t(L('Data operasional dibaca langsung dari sistem maintenance Fase 8; tidak disalin ke Finance. Buka layar Fase 8 untuk jadwal, checklist dan work order.', 'Operational data is read live from the Phase 8 maintenance system; it is not copied into Finance. Open the Phase 8 screens for schedules, checklists and work orders.')), 'link', 'info') +
          kv([[L('Mesin', 'Machine'), lnk('MNT-003', a.link, mono(a.link) + (x.m ? ' · ' + t(x.m.n) : ''))], [L('Status live', 'Live status'), x.live && F.PR.MACH_ST[x.live] ? stc(F.PR.MACH_ST, x.live) : '—'],
            [L('Utilisasi 30 hari', '30-day utilisation'), x.util == null ? '—' : pct(x.util, 0)], [L('Siklus 30 hari / total', 'Cycles 30 days / lifetime'), n0(x.cycles30) + ' / ' + n0(x.cyclesLife)], [L('Jam operasi', 'Operating hours'), n0(x.hours)],
            [L('Downtime 30 hari', '30-day downtime'), n0(x.dtMin / 60, 1) + ' ' + t(L('jam', 'h')) + ' · ' + x.breakdowns + ' ' + t(L('breakdown', 'breakdowns'))],
            [L('Work order terbuka', 'Open work orders'), wo.length ? wo.map(function (w) { return lnk('MNT-006', w.id, mono(w.id)) + ' ' + (F.PR.WO_ST[w.st] ? stc(F.PR.WO_ST, w.st) : ''); }).join(' ') : t(L('Tidak ada', 'None'))]]) +
          '<div class="cf10a-btns">' + scrBtn('MNT-003', a.link, L('Detail mesin', 'Machine detail')) + scrBtn('MNT-005', null, L('Riwayat maintenance', 'Maintenance history'), 'm=' + a.link) + scrBtn('MNT-006', null, L('Work order', 'Work orders')) + scrBtn('PROD-MACH-001', null, L('Status mesin live', 'Live machine status')) + '</div>', { icon: 'washer' });
      }
      var rc = rl ? P.rec({ title: L('Insight penggantian', 'Replacement insight'), icon: 'refresh', chip: stc(F.REPL_OUT, rl.out), tone: F.REPL_OUT[rl.out][1], sig: L('Umur ' + rl.ageP + '% masa manfaat · NBV ' + rl.nbvP + '% · maintenance ' + rl.mntP + '% harga baru', 'Age ' + rl.ageP + '% of useful life · NBV ' + rl.nbvP + '% · maintenance ' + rl.mntP + '% of new price'),
        why: rl.sig, impact: REPL_IMP[rl.out], rec: REPL_REC[rl.out], act: { n: L('Lihat semua insight', 'See all insights'), s: 'AST-005' } }) : '';
      var evc = card(L('Riwayat aset', 'Asset history'), P.table(ev, [
        { h: L('Tanggal', 'Date'), v: function (e) { return dt(e.at); } }, { h: L('Kejadian', 'Event'), v: function (e) { return t(EV_N[e.kind] || L(e.kind, e.kind)); } },
        { h: L('Dari → ke', 'From → to'), v: function (e) { return e.kind === 'status' ? stc(F.AST_ST, e.from) + ' → ' + stc(F.AST_ST, e.to) : (e.from ? plantN(e.from) + ' → ' : '') + plantN(e.to); } },
        { h: L('Oleh', 'By'), v: function (e) { return emp(e.by); } }, { h: L('Alasan', 'Reason'), v: function (e) { return t(e.reason); } }
      ], function (e) { return { t: t(EV_N[e.kind] || L(e.kind, e.kind)), r: dt(e.at), s: t(e.reason) + ' · ' + emp(e.by) }; }, null, { empty: L('Belum ada transfer atau perubahan status.', 'No transfer or status change yet.') }), { icon: 'clock', count: ev.length });
      var docs = card(L('Dokumen', 'Documents'), '<ul class="cf10a-l">' + a.docs.map(function (d) { return '<li>' + ic('file') + '<span>' + t(d) + '</span></li>'; }).join('') + '</ul>', { icon: 'file' });
      var bar = live && can('ast.edit') ? P8.abar(P8.xl('primary', L('Transfer', 'Transfer'), 'swap', { act: 'trf', val: a.code }), P8.xl('ghost', L('Ubah Status', 'Change Status'), 'flag', { act: 'st', val: a.code })) : '';
      return hero + '<div class="cf10a-2">' + '<div class="col10">' + fin + rc + docs + '</div><div class="col10">' + ml + sc + evc + '</div></div>' + bar;
    },
    act: { trf: function (el) { transferDlg(el.getAttribute('data-val')); }, st: function (el) { statusDlg(el.getAttribute('data-val')); } }
  };
  var EV_N = { add: L('Ditambahkan', 'Added'), transfer: L('Transfer', 'Transfer'), status: L('Perubahan status', 'Status change') };
  var REPL_IMP = { replace: L('Biaya maintenance dan downtime terus naik sementara nilai buku hampir habis; risiko breakdown saat puncak produksi.', 'Maintenance cost and downtime keep rising while book value is nearly gone; breakdown risk at production peaks.'),
    repair: L('Perbaikan tepat waktu menjaga kapasitas tanpa capex baru.', 'A timely repair protects capacity without new capex.'), add: L('Mesin sudah bekerja di batas kapasitas; antrian menunda batch berikutnya.', 'The machine is at its capacity limit; queues delay the next batches.'), maintain: L('Mesin masih ekonomis; tidak ada tindakan khusus.', 'The machine is still economical; no special action.') };
  var REPL_REC = { replace: L('Siapkan penggantian lewat skenario dan PR capex (persetujuan Owner); jangan diputuskan otomatis.', 'Prepare a replacement through a scenario and a capex PR (Owner approval); never decided automatically.'),
    repair: L('Perbaiki lewat work order Fase 8 dan pantau biaya maintenance.', 'Repair through a Phase 8 work order and watch the maintenance cost.'), add: L('Evaluasi tambah kapasitas di scenario builder.', 'Evaluate added capacity in the scenario builder.'), maintain: L('Pertahankan dengan maintenance terjadwal.', 'Maintain with scheduled maintenance.') };

  /* ================= AST-004 Depreciation ================= */
  V['AST-004'] = {
    render: function (c) {
      var cur = F.curPeriod(), p = c.q.p || cur, run = F.depRun(p), ps = F.perSt(p + '-01'), jv = (F.state().depPosted || {})[p] || null;
      var hist = months('2026-04', cur).map(function (m) { var r = F.depRun(m); return { p: m, total: r.total, n: r.rows.length, jv: (F.state().depPosted || {})[m] || null, st: F.perSt(m + '-01') }; });
      var canPost = !run.posted && can('ast.dep') && p <= cur && ps !== 'closed' && ps !== 'locked';
      var accT = run.rows.reduce(function (s, r) { return s + r.acc; }, 0), nbvT = run.rows.reduce(function (s, r) { return s + r.nbv; }, 0);
      return P.head(t(L('Penyusutan garis lurus per periode: nilai, akumulasi, NBV dan status posting. Satu posting per periode.', 'Straight-line depreciation per period: amount, accumulated, NBV and posted status. One posting per period.')),
        canPost ? A.btn('primary', L('Posting Penyusutan ' + mon(p), 'Post Depreciation ' + mon(p)), 'check', { act: 'post', val: p }) : '', P.fresh({ src: L('register aset · periode ' + p + ' (' + T(F.PER_ST[ps][0]) + ')', 'asset register · period ' + p + ' (' + F.PER_ST[ps][0][1] + ')'), kind: run.posted ? 'ledger' : 'live' })) +
        P.deskOnly() + P.perTabs(p, 'p', months('2026-04', cur).slice(-7)) +
        P.kpis([{ k: Lx(L('Penyusutan ', 'Depreciation '), mon(p)), v: rpj(run.total), s: rp(run.total), icon: 'trend' },
          { k: L('Status posting', 'Posting status'), v: run.posted ? t(L('Diposting', 'Posted')) : t(L('Belum', 'Not yet')), s: jv ? P.jvLink(jv) : t(F.PER_ST[ps][0]), icon: run.posted ? 'checkc' : 'clock', tone: run.posted ? 'ok' : 'warn' },
          { k: L('Aset disusutkan', 'Assets depreciated'), v: n0(run.rows.length), icon: 'list' }, { k: L('Akumulasi', 'Accumulated'), v: rpj(accT), icon: 'arrowdn' }, { k: 'NBV', v: rpj(nbvT), icon: 'scale' }]) +
        note('<b>' + t(L('Rumus', 'Formula')) + ':</b> ' + t(L('Penyusutan bulanan = Nilai yang disusutkan ÷ Masa manfaat (bulan); Nilai yang disusutkan = Harga perolehan − Nilai sisa. Jurnal: Dr 6700 Beban penyusutan / Cr 1590 Akumulasi penyusutan.', 'Monthly Depreciation = Depreciable Amount ÷ Useful Life Months; Depreciable Amount = Acquisition cost − Residual value. Journal: Dr 6700 Depreciation expense / Cr 1590 Accumulated depreciation.')), 'help') +
        (!run.posted && p <= cur && (ps === 'closed' || ps === 'locked') ? note(t(L('Periode ini sudah ditutup: penyusutan tidak bisa diposting.', 'This period is closed: depreciation cannot be posted.')), 'lock', 'warn') : '') +
        '<div class="g21-10">' + card(Lx(L('Run penyusutan ', 'Depreciation run '), mon(p)), P.table(run.rows, [
          { h: L('Aset', 'Asset'), v: function (r) { return P.astLink(r.a.code) + ' <span>' + t(r.a.n) + '</span>'; } },
          { h: L('Perolehan', 'Cost'), cls: 'r num', v: function (r) { return rp(r.a.cost); } },
          { h: L('Rumus', 'Formula'), cls: 'r num', v: function (r) { return '<small class="sub5">' + rpj(Math.round(r.a.cost * (1 - r.a.res / 100))) + ' ÷ ' + r.a.life + '</small>'; } },
          { h: L('Penyusutan', 'Depreciation'), cls: 'r num', v: function (r) { return '<b>' + rp(r.dep) + '</b>'; } },
          { h: L('Akumulasi', 'Accumulated'), cls: 'r num', v: function (r) { return rp(r.acc); } }, { h: 'NBV', cls: 'r num', v: function (r) { return rp(r.nbv); } }
        ], function (r) { return { t: esc(r.a.code) + ' · ' + t(r.a.n), r: rp(r.dep), s: t(L('Akumulasi ', 'Accumulated ')) + rpj(r.acc) + ' · NBV ' + rpj(r.nbv) }; }, function (r) { return href('AST-003', r.a.code); }), { icon: 'list', count: run.rows.length }) +
        '<div class="col10">' + card(jv ? Lx(L('Jurnal ', 'Journal '), jv) : L('Jurnal (pratinjau)', 'Journal (preview)'), (jv ? P.traceChain(F.trace ? F.trace(jv) : []) : '') + P.jlines(run.lines.slice(0, 1).concat([{ a: '1590', c: run.total, m: L(run.rows.length + ' aset', run.rows.length + ' assets') }])), { icon: 'file' }) +
        card(L('Riwayat posting', 'Posting history'), P.table(hist.slice().reverse(), [
          { h: L('Periode', 'Period'), v: function (h) { return mon(h.p) + ' ' + stc(F.PER_ST, h.st); } }, { h: L('Total', 'Total'), cls: 'r num', v: function (h) { return rp(h.total); } },
          { h: L('Jurnal', 'Journal'), v: function (h) { return h.jv ? P.jvLink(h.jv) : A.chip('warn', L('Belum', 'Not yet')); } }
        ], function (h) { return { t: mon(h.p), r: rp(h.total), s: h.jv ? esc(h.jv) : t(L('belum diposting', 'not posted')) }; }, function (h) { return href('AST-004', null, { p: h.p }); }), { icon: 'clock' }) + '</div></div>';
    },
    act: { post: function (el) { var p = el.getAttribute('data-val'), run = F.depRun(p);
      P.confirmDlg({ title: L('Posting penyusutan ' + mon(p), 'Post depreciation ' + mon(p)), icon: 'check', ok: L('Posting', 'Post'), sub: t(L(run.rows.length + ' aset · total ' + rp(run.total) + '. Jurnal Dr 6700 / Cr 1590 dibuat satu kali untuk periode ini.', run.rows.length + ' assets · total ' + rp(run.total) + '. One Dr 6700 / Cr 1590 journal is created for this period.')),
        fn: function () { return F.postDep(cx(), p); }, done: L('Penyusutan diposting.', 'Depreciation posted.') }); } }
  };

  /* ================= AST-005 Replacement Insight ================= */
  V['AST-005'] = {
    render: function (c) {
      var list = F.replacement(cx()) || [], f = c.q.o || '', rows = f ? list.filter(function (r) { return r.out === f; }) : list, cnt = {};
      list.forEach(function (r) { cnt[r.out] = (cnt[r.out] || 0) + 1; });
      return P.head(t(L('Umur, NBV, downtime, biaya maintenance, utilisasi, kapasitas dan energi → Pertahankan / Perbaiki / Ganti / Tambah Kapasitas. Data mesin dari Fase 8.', 'Age, NBV, downtime, maintenance cost, utilisation, capacity and energy → Maintain / Repair / Replace / Add Capacity. Machine data from Phase 8.')), '', P.fresh({ src: L('register aset + Fase 8 live', 'asset register + Phase 8 live'), kind: 'mixed' })) +
        P.kpis(Object.keys(F.REPL_OUT).map(function (k) { return { k: F.REPL_OUT[k][0], v: n0(cnt[k] || 0), tone: F.REPL_OUT[k][1], icon: { replace: 'refresh', repair: 'wrench', add: 'plus', maintain: 'checkc' }[k], go: 'AST-005', q: { o: k } }; })) +
        H.tabs([['', L('Semua', 'All'), 'list', list.length]].concat(Object.keys(F.REPL_OUT).map(function (k) { return [k, F.REPL_OUT[k][0], null, cnt[k] || 0]; })), f, 'o', { def: '', seg: true }) +
        card(L('Perbandingan mesin', 'Machine comparison'), P.table(rows, [
          { h: L('Aset', 'Asset'), v: function (r) { return P.astLink(r.a.code) + ' <span>' + t(r.a.n) + '</span><small class="sub5">' + esc(r.a.link) + '</small>'; } },
          { h: L('Umur', 'Age'), cls: 'r num', v: function (r) { return pct(r.ageP, 0); } }, { h: 'NBV', cls: 'r num', v: function (r) { return pct(r.nbvP, 0); } },
          { h: L('Maint./harga baru', 'Maint./new price'), cls: 'r num', v: function (r) { return pct(r.mntP); } }, { h: L('Downtime 30h', 'Downtime 30d'), cls: 'r num', v: function (r) { return n0(r.x.dtMin / 60, 1) + ' ' + t(L('jam', 'h')); } },
          { h: L('Utilisasi', 'Utilisation'), cls: 'r num', v: function (r) { return pct(r.util, 0); } }, { h: L('Beban tahap', 'Stage load'), cls: 'r num', v: function (r) { return pct(r.capPct, 0); } },
          { h: L('Energi vs terbaik', 'Energy vs best'), cls: 'r num', v: function (r) { return r.effGap == null ? '—' : sgn(r.effGap) + pct(r.effGap, 0); } },
          { h: L('Hasil', 'Outcome'), v: function (r) { return stc(F.REPL_OUT, r.out); } }
        ], function (r) { return { t: esc(r.a.code) + ' · ' + t(r.a.n), r: '', s: t(L('Umur ', 'Age ')) + r.ageP + '% · NBV ' + r.nbvP + '%', chip: stc(F.REPL_OUT, r.out) }; }, function (r) { return href('AST-003', r.a.code); }), { icon: 'columns', count: rows.length }) +
        note(t(L('Aturan: Ganti bila umur ≥ 100% masa manfaat, atau maintenance 12 bln ≥ 6% harga baru dengan NBV ≤ 25%, atau ada breakdown pada umur ≥ 90%. Perbaiki bila ada breakdown, mesin sedang repair, atau maintenance ≥ 4%. Tambah kapasitas bila utilisasi ≥ 85% atau beban tahap ≥ 90%.', 'Rules: Replace when age ≥ 100% of useful life, or 12-month maintenance ≥ 6% of the new price with NBV ≤ 25%, or a breakdown at age ≥ 90%. Repair when there is a breakdown, the machine is under repair, or maintenance ≥ 4%. Add capacity when utilisation ≥ 85% or stage load ≥ 90%.')), 'help') +
        '<div class="g2-10">' + rows.filter(function (r) { return r.out !== 'maintain'; }).map(function (r) {
          return P.rec({ title: L(r.a.code + ' · ' + T(r.a.n), r.a.code + ' · ' + r.a.n[1]), icon: 'refresh', chip: stc(F.REPL_OUT, r.out), tone: F.REPL_OUT[r.out][1],
            sig: L('Umur ' + r.ageP + '% · NBV ' + r.nbvP + '% · maintenance ' + r.mntP + '% harga baru', 'Age ' + r.ageP + '% · NBV ' + r.nbvP + '% · maintenance ' + r.mntP + '% of new price'), why: r.sig, impact: REPL_IMP[r.out], rec: REPL_REC[r.out],
            act: r.out === 'replace' || r.out === 'add' ? { n: L('Buka scenario builder', 'Open the scenario builder'), s: 'CFO-005' } : { n: L('Buka detail aset', 'Open the asset detail'), s: 'AST-003', rec: r.a.code } });
        }).join('') + '</div>';
    }
  };

  /* ================= BUD-001 Budget Dashboard ================= */
  function budCfgDlg() {
    var c0 = F.budCfg();
    P.reasonDlg({ title: L('Ubah ambang status budget', 'Change budget status thresholds'), icon: 'edit', ok: L('Simpan versi baru', 'Save new version'),
      sub: t(L('Varian merugikan (%): biaya di atas budget atau pendapatan/laba di bawah budget. Perubahan membuat versi baru (v' + (c0.v + 1) + ').', 'Adverse variance (%): cost above budget or revenue/profit below budget. A change creates a new version (v' + (c0.v + 1) + ').')),
      body: '<div class="g2-10">' + fld(L('Good ≤', 'Good ≤'), inp('good', c0.good, { num: true })) + fld(L('On Track ≤', 'On Track ≤'), inp('ontrack', c0.ontrack, { num: true })) + fld(L('Watch ≤', 'Watch ≤'), inp('watch', c0.watch, { num: true })) + fld(L('Over Budget ≤ (di atasnya Critical)', 'Over Budget ≤ (above it Critical)'), inp('over', c0.over, { num: true })) + '</div>',
      fn: function (reason, v) { return F.setBudCfg(cx(), v, reason); }, done: L('Ambang budget disimpan sebagai versi baru.', 'Budget thresholds saved as a new version.') });
  }
  function cfgTable(c0) {
    return '<div class="cf10b-th">' + [['good', c0.good], ['ontrack', c0.ontrack], ['watch', c0.watch], ['over', c0.over]].map(function (x) { return '<span>' + stc(F.BUD_ST, x[0]) + '<b class="num">≤ ' + sgn(x[1]) + n0(x[1], 1) + '%</b></span>'; }).join('') + '<span>' + stc(F.BUD_ST, 'critical') + '<b class="num">> ' + sgn(c0.over) + n0(c0.over, 1) + '%</b></span></div>';
  }
  V['BUD-001'] = {
    render: function (c) {
      var d = F.budDash(cx()); if (!d) return A.empty(L('Tidak ada akses.', 'No access.'));
      var mo = d.month, rv = mo.rows.filter(function (r) { return r.k === 'revenue'; })[0], np = mo.rows.filter(function (r) { return r.k === 'netprofit'; })[0], cfg = F.budCfg(), w = d.worst[0];
      var bad = (mo.cnt.over || 0) + (mo.cnt.critical || 0), ytdR = d.ytd.rows.filter(function (r) { return r.k === 'revenue'; })[0], mtdR = d.mtd.rows.filter(function (r) { return r.k === 'revenue'; })[0];
      var full = d.rev.filter(function (x) { return !x.mtd; }), labels = full.map(function (x) { return mon(x.p, false); });
      return P.head(t(L('Budget vs aktual untuk ' + mon(d.p) + ' (periode tertutup terakhir), YTD dan MTD berjalan. Aktual selalu dari ledger yang sudah diposting.', 'Budget vs actual for ' + mon(d.p) + ' (latest closed period), YTD and the running MTD. Actuals always come from the posted ledger.')),
        A.btn('ghost', L('Budget vs Aktual', 'Budget vs Actual'), 'chart', { go: 'BUD-002' }), P.fresh({ src: L('ledger ' + d.p + ' + MTD ' + F.today(), 'ledger ' + d.p + ' + MTD ' + F.today()), kind: 'mixed' })) +
        P.kpis([
          { k: Lx(L('Pendapatan ', 'Revenue '), mon(d.p)), v: rpj(rv.a), s: t(L('budget ', 'budget ')) + rpj(rv.b) + ' · ' + sgn(rv.vp) + pct(rv.vp), tone: P.tone(rv.st), icon: 'coins', go: 'BUD-002', q: { p: d.p } },
          { k: Lx(L('Laba bersih ', 'Net profit '), mon(d.p)), v: rpj(np.a), s: t(L('budget ', 'budget ')) + rpj(np.b) + ' · ' + sgn(np.vp) + pct(np.vp), tone: P.tone(np.st), icon: 'trend', go: 'BUD-002', q: { p: d.p } },
          { k: L('Pendapatan YTD', 'Revenue YTD'), v: rpj(ytdR.a), s: t(L('budget ', 'budget ')) + rpj(ytdR.b) + ' · ' + sgn(ytdR.vp) + pct(ytdR.vp), tone: P.tone(ytdR.st), icon: 'calendar', go: 'BUD-002', q: { p: d.p, ytd: 1 } },
          { k: Lx(L('Pendapatan MTD ', 'Revenue MTD '), mon(d.mtd.p, false)), v: rpj(mtdR.a), s: t(L('budget pro-rata ', 'pro-rated budget ')) + rpj(mtdR.b) + ' (' + pct(d.mtd.pro * 100, 0) + ')', tone: P.tone(mtdR.st), icon: 'clock', go: 'BUD-002', q: { p: d.mtd.p } },
          { k: L('Over / Critical', 'Over / Critical'), v: n0(bad), s: t(L('dari ' + mo.rows.length + ' kategori', 'of ' + mo.rows.length + ' categories')), tone: bad ? 'crit' : 'ok', icon: 'alert', go: 'BUD-002', q: { p: d.p } }
        ]) +
        '<div class="g21-10">' + card(L('Tren pendapatan: budget vs aktual', 'Revenue trend: budget vs actual'), A.lineChart([{ n: L('Aktual', 'Actual'), v: full.map(function (x) { return x.a; }) }, { n: L('Budget', 'Budget'), v: full.map(function (x) { return x.b; }) }], labels, { fmt: rpj, fmtAx: rpj, label: T(L('Pendapatan', 'Revenue')) }) + '<small class="sub5">' + t(L('Bulan penuh dari ledger. Bulan berjalan (MTD) dibandingkan dengan budget pro-rata di kartu MTD.', 'Full months from the ledger. The running month (MTD) is compared with the pro-rated budget in the MTD tile.')) + '</small>', { icon: 'trend' }) +
        card(Lx(L('Status per kategori · ', 'Status by category · '), mon(d.p)), '<ul class="cf10b-st">' + mo.rows.map(function (r) { return '<li><a href="' + href('BUD-002', null, { p: d.p }) + '">' + t(r.n) + '</a>' + P.prog(r.a, r.b, r.st) + stc(F.BUD_ST, r.st) + '</li>'; }).join('') + '</ul>', { icon: 'list' }) + '</div>' +
        '<div class="g2-10">' + (w ? P.rec({ title: L('Varian terbesar', 'Largest variance'), icon: 'alert', tone: P.tone(w.st), chip: stc(F.BUD_ST, w.st),
          sig: L(T(w.n) + ' ' + sgn(w.vp) + w.vp + '% vs budget ' + mon(d.p), w.n[1] + ' ' + sgn(w.vp) + w.vp + '% vs budget ' + mon(d.p)),
          why: d.worst.map(function (r) { return L(T(r.n) + ': budget ' + rpj(r.b) + ', aktual ' + rpj(r.a) + ' (merugikan ' + r.adverse + '%)', r.n[1] + ': budget ' + rpj(r.b) + ', actual ' + rpj(r.a) + ' (adverse ' + r.adverse + '%)'); }),
          impact: L('Selisih ' + rpj(Math.abs(w.v)) + ' menekan laba bersih bulan ini.', 'A ' + rpj(Math.abs(w.v)) + ' gap squeezes this month\'s net profit.'),
          rec: L('Review akun ' + w.accs.join(', ') + ' dan penyebab varian bersama pemilik cost center.', 'Review accounts ' + w.accs.join(', ') + ' and the variance cause with the cost centre owner.'),
          act: { n: L('Buka budget vs aktual', 'Open budget vs actual'), s: 'BUD-002', q: 'p=' + d.p } }) : '') +
        card(Lx(L('Ambang status (v', 'Status thresholds (v'), cfg.v + ')'), cfgTable(cfg) + '<p class="sub5">' + t(L('Berlaku sejak ', 'Effective since ')) + dt(cfg.eff) + (cfg.by ? ' · ' + emp(cfg.by) : '') + (cfg.reason ? ' · ' + t(cfg.reason) : '') + '</p>' +
          (F.state().budCfgHist.length ? '<details class="cf10b-h"><summary>' + t(L('Versi sebelumnya', 'Previous versions')) + '</summary>' + F.state().budCfgHist.slice().reverse().map(function (h) { return '<div><b>v' + h.v + '</b> · ' + dt(h.eff) + '–' + dt(h.until) + cfgTable(h) + '</div>'; }).join('') + '</details>' : ''),
          { icon: 'filter', right: A.pbtn('bud.edit', 'ghost', L('Ubah', 'Change'), 'edit', { act: 'cfg', cls: 'btn-sm' }) }) + '</div>' +
        card(L('Riwayat perubahan budget', 'Budget change history'), P.table(d.hist, [
          { h: L('Waktu', 'Time'), v: function (h) { return dt(h.at); } }, { h: L('Kategori', 'Category'), v: function (h) { var b = F.budLine(h.k); return b ? t(b.n) : esc(h.k); } }, { h: L('Periode', 'Period'), v: function (h) { return mon(h.p); } },
          { h: L('Dari → ke', 'From → to'), cls: 'r num', v: function (h) { return rpj(h.from) + ' → <b>' + rpj(h.to) + '</b>'; } }, { h: L('Oleh', 'By'), v: function (h) { return emp(h.by); } }, { h: L('Alasan', 'Reason'), v: function (h) { return t(h.reason); } }
        ], function (h) { return { t: esc(h.k) + ' · ' + mon(h.p), r: rpj(h.to), s: t(h.reason) }; }, null, { empty: L('Belum ada perubahan.', 'No change yet.') }), { icon: 'clock', count: d.hist.length });
    },
    act: { cfg: budCfgDlg }
  };

  /* ================= BUD-002 Budget vs Actual ================= */
  function budEditDlg(k, p0) {
    var b = F.budLine(k); if (!b) return;
    var open = Object.keys(b.m).filter(function (m) { return F.perSt(m + '-01') === 'open'; });
    if (!open.length) { A.toast(L('Tidak ada periode budget yang masih open.', 'No budget period is still open.'), 'warn'); return; }
    var p = open.indexOf(p0) >= 0 ? p0 : open[0];
    P.reasonDlg({ title: L('Ubah budget ' + T(b.n), 'Change budget ' + b.n[1]), icon: 'edit', ok: L('Simpan versi', 'Save version'),
      sub: t(L('Hanya periode open. Nilai lama tetap tercatat di riwayat (tidak ditimpa).', 'Open periods only. The old value stays in the history (never overwritten).')),
      body: '<div class="g2-10">' + fld(L('Periode', 'Period'), sel('p', open.map(function (m) { return [m, [mon(m) + ' · ' + rpj(b.m[m]), mon(m) + ' · ' + rpj(b.m[m])]]; }), p), { req: true }) + fld(L('Budget baru (Rp juta)', 'New budget (Rp million)'), inp('amt', Math.round(b.m[p] / JT * 10) / 10, { num: true }), { req: true }) + '</div>',
      fn: function (reason, v) { return F.setBudget(cx(), k, v.p, v.amt === '' ? null : Number(String(v.amt).replace(',', '.')) * JT, reason); }, done: L('Budget disimpan. Riwayat versi tercatat.', 'Budget saved. Version history recorded.') });
  }
  V['BUD-002'] = {
    render: function (c) {
      var cur = F.curPeriod(), p = c.q.p || F.lastClosed(), ytd = !!c.q.ytd, r = F.budVsActual(cx(), p, { ytd: ytd }); if (!r) return A.empty(L('Tidak ada akses.', 'No access.'));
      var q0 = Object.assign({}, c.q); if (ytd) delete q0.ytd; else q0.ytd = 1;
      var cols = [
        { h: L('Kategori', 'Category'), v: function (x) { return '<b>' + t(x.n) + '</b><small class="sub5">' + t(F.BUD_KIND[x.kind]) + (x.cc ? ' · ' + esc(x.cc) : '') + ' · ' + (x.accs || []).map(function (a) { return lnk('ACC-003', null, esc(a), { acc: a }); }).join(', ') + '</small>'; } },
        { h: L('Budget', 'Budget'), cls: 'r num', v: function (x) { return rp(x.b); } }, { h: L('Aktual', 'Actual'), cls: 'r num', v: function (x) { return '<b>' + rp(x.a) + '</b>'; } },
        { h: L('Varian', 'Variance'), cls: 'r num', v: function (x) { return '<span class="' + (x.adverse > 0 ? 't-crit' : '') + '">' + sgn(x.v) + rp(x.v) + '</span>'; } },
        { h: L('Varian %', 'Variance %'), cls: 'r num', v: function (x) { return x.vp == null ? '—' : sgn(x.vp) + pct(x.vp); } },
        { h: L('Realisasi', 'Usage'), v: function (x) { return P.prog(x.a, x.b, x.st); } }, { h: L('Status', 'Status'), v: function (x) { return stc(F.BUD_ST, x.st); } },
        can('bud.edit') ? { h: '', v: function (x) { return A.btn('ghost', L('Ubah', 'Edit'), 'edit', { act: 'edit', val: x.k, cls: 'btn-sm' }); } } : null
      ].filter(Boolean);
      var hist = F.state().budHist.slice().reverse();
      return P.head(t(L('Budget, aktual, varian dan status per kategori. ' + (ytd ? 'Year to date ' + r.from + ' s/d ' + r.to + '.' : 'Bulan ' + mon(p) + '.') + (r.pro != null ? ' Budget bulan berjalan dipro-rata ' + pct(r.pro * 100, 0) + '.' : ''), 'Budget, actual, variance and status per category. ' + (ytd ? 'Year to date ' + r.from + ' to ' + r.to + '.' : 'Month ' + mon(p) + '.') + (r.pro != null ? ' The running month\'s budget is pro-rated ' + pct(r.pro * 100, 0) + '.' : ''))),
        A.btn('ghost', ytd ? L('Tampilkan bulanan', 'Show monthly') : L('Tampilkan YTD', 'Show YTD'), 'calendar', { go: 'BUD-002', qs: Object.keys(q0).map(function (k) { return k + '=' + q0[k]; }).join('&') }),
        P.fresh({ src: L('ledger ' + r.from + ' s/d ' + r.to + ' · periode ' + T(F.PER_ST[r.perSt][0]), 'ledger ' + r.from + ' to ' + r.to + ' · period ' + F.PER_ST[r.perSt][0][1]), kind: p === cur ? 'live' : 'ledger' })) +
        P.deskOnly() + P.perTabs(p, 'p', months('2026-04', cur).slice(-7)) +
        P.kpis(Object.keys(F.BUD_ST).map(function (k) { return { k: F.BUD_ST[k][0], v: n0(r.cnt[k] || 0), tone: F.BUD_ST[k][1] }; })) +
        card(ytd ? Lx(L('YTD ', 'YTD '), mon(p)) : mon(p), P.table(r.rows, cols, function (x) { return { t: t(x.n), r: sgn(x.vp) + pct(x.vp), s: t(L('Budget ', 'Budget ')) + rpj(x.b) + ' · ' + t(L('aktual ', 'actual ')) + rpj(x.a), chip: stc(F.BUD_ST, x.st) }; }), { icon: 'chart', count: r.rows.length }) +
        '<div class="g2-10">' + card(L('Cara status dihitung', 'How the status is computed'), '<p>' + t(L('Varian = aktual − budget; Varian % = varian ÷ budget × 100. Status memakai varian merugikan: biaya di atas budget, atau pendapatan/laba di bawah budget. Capex di bawah budget selalu On Track.', 'Variance = actual − budget; Variance % = variance ÷ budget × 100. The status uses the adverse variance: cost above budget, or revenue/profit below budget. Capex below budget is always On Track.')) + '</p>' + cfgTable(r.cfg) +
          '<p class="sub5">' + t(L('Per plant / departemen: kolom cost center (CC) menunjukkan pemilik budget; aktual diambil dari akun ledger yang tertulis.', 'By plant / department: the cost centre (CC) column shows the budget owner; actuals come from the listed ledger accounts.')) + '</p>', { icon: 'help', link: ['BUD-001', L('Ambang & versi', 'Thresholds & versions')] }) +
        card(L('Riwayat versi budget', 'Budget version history'), P.table(hist, [
          { h: L('Waktu', 'Time'), v: function (h) { return dt(h.at); } }, { h: L('Kategori · periode', 'Category · period'), v: function (h) { var b = F.budLine(h.k); return (b ? t(b.n) : esc(h.k)) + ' · ' + mon(h.p); } },
          { h: L('Dari → ke', 'From → to'), cls: 'r num', v: function (h) { return rpj(h.from) + ' → <b>' + rpj(h.to) + '</b>'; } }, { h: L('Oleh · alasan', 'By · reason'), v: function (h) { return emp(h.by) + '<small class="sub5">' + t(h.reason) + '</small>'; } }
        ], function (h) { return { t: esc(h.k) + ' · ' + mon(h.p), r: rpj(h.to), s: t(h.reason) }; }, null, { empty: L('Belum ada perubahan.', 'No change yet.') }), { icon: 'clock', count: hist.length }) + '</div>';
    },
    act: { edit: function (el) { budEditDlg(el.getAttribute('data-val'), A.S.q.p); } }
  };

  /* ================= BUD-003 Reconciliation Center ================= */
  function signDlg(k) {
    var rc = F.reconCenter(cx()), r = rc && rc.rows.filter(function (x) { return x.k === k; })[0]; if (!r) return;
    P.reasonDlg({ title: L('Sign-off rekonsiliasi', 'Reconciliation sign-off'), icon: 'checkc', ok: L('Sign-off', 'Sign off'), optional: !r.diff, label: r.diff ? L('Penjelasan selisih & bukti', 'Difference explanation & evidence') : L('Catatan (opsional)', 'Note (optional)'),
      sub: t(r.n) + ' · ' + t(L('buku ', 'book ')) + rp(r.book) + ' · ' + t(r.extN) + ' ' + rp(r.ext) + (r.diff ? ' · ' + t(L('selisih ', 'difference ')) + rp(r.diff) : ''),
      body: r.diff ? note(t(L('Selisih tidak pernah dihapus diam-diam: tulis penyebab dan bukti; penyesuaian dibuat lewat jurnal terpisah.', 'A difference is never silently cleared: write the cause and evidence; any adjustment goes through a separate journal.')), 'alert', 'warn') : '',
      fn: function (reason) { return F.reconSign(cx(), k, reason); }, done: L('Rekonsiliasi di-sign-off.', 'Reconciliation signed off.') });
  }
  V['BUD-003'] = {
    render: function (c) {
      var rc = F.reconCenter(cx()); if (!rc) return A.empty(L('Tidak ada akses.', 'No access.'));
      var cols = [
        { h: L('Rekonsiliasi', 'Reconciliation'), v: function (r) { return '<b>' + t(r.n) + '</b><small class="sub5">' + t(r.ev) + '</small>'; } },
        { h: L('Saldo buku', 'Book balance'), cls: 'r num', v: function (r) { return rp(r.book); } },
        { h: L('Eksternal / fisik', 'External / physical'), cls: 'r num', v: function (r) { return rp(r.ext) + '<small class="sub5">' + t(r.extN) + '</small>'; } },
        { h: L('Selisih', 'Difference'), cls: 'r num', v: function (r) { return r.diff ? '<b class="t-crit">' + sgn(r.diff) + rp(r.diff) + '</b>' : '<span class="sub5">0</span>'; } },
        { h: L('Status', 'Status'), v: function (r) { return stc(F.RECON_ST, r.st); } },
        { h: L('Reviewer', 'Reviewer'), v: function (r) { return r.by ? emp(r.by) + '<small class="sub5">' + dt(r.at) + (r.note ? ' · ' + esc(r.note) : '') + '</small>' : '<span class="sub5">' + t(L('belum', 'not yet')) + '</span>'; } },
        { h: L('Aksi', 'Action'), v: function (r) { return '<span class="cf10r-a">' + lnk(r.scr, r.rec || null, ic('arrow') + t(L('Sumber', 'Source'))) + (can('rec.do') && r.k !== 'opname' && !r.by ? A.btn('ghost', L('Sign-off', 'Sign off'), 'checkc', { act: 'sign', val: r.k, cls: 'btn-sm' }) : '') + '</span>'; } }
      ];
      var open = rc.rows.filter(function (r) { return !r.by; }).length;
      return P.head(t(L('Saldo buku vs rekening koran, hitung fisik dan subledger. Setiap selisih butuh penjelasan, bukti dan reviewer.', 'Book balance vs bank statement, physical count and subledger. Every difference needs an explanation, evidence and a reviewer.')), A.btn('ghost', L('Rekonsiliasi bank', 'Bank reconciliation'), 'scale', { go: 'CASH-005' }), P.fresh({ src: L('ledger + subledger + hitung fisik', 'ledger + subledgers + physical counts'), at: rc.at, kind: 'live' })) +
        P.deskOnly() +
        P.kpis(Object.keys(F.RECON_ST).map(function (k) { return { k: F.RECON_ST[k][0], v: n0(rc.cnt[k] || 0), tone: F.RECON_ST[k][1] === 'appr' ? 'appr' : F.RECON_ST[k][1] }; }).concat([{ k: L('Belum di-sign-off', 'Not signed off'), v: n0(open), icon: 'clock', tone: open ? 'warn' : 'ok' }])) +
        card(L('Pusat rekonsiliasi', 'Reconciliation centre'), P.table(rc.rows, cols, function (r) { return { t: t(r.n), r: r.diff ? rp(r.diff) : '0', s: t(L('Buku ', 'Book ')) + rpj(r.book) + ' · ' + t(r.extN) + ' ' + rpj(r.ext), chip: stc(F.RECON_ST, r.st) }; }), { icon: 'scale', count: rc.rows.length }) +
        note(t(L('Bank: sign-off dilakukan setelah semua mutasi rekening koran cocok di Rekonsiliasi Bank (CASH-005). Stock opname: selisih diselesaikan lewat persetujuan opname.', 'Bank: sign-off happens once every statement line matches in Bank Reconciliation (CASH-005). Stock count: the difference is settled through the stock count approval.')), 'help');
    },
    act: { sign: function (el) { signDlg(el.getAttribute('data-val')); } }
  };

  /* ================= BUD-004 Monthly Close ================= */
  V['BUD-004'] = {
    render: function (c) {
      var p = c.q.p || F.lastClosed(), cs = F.closeStatus(p), ck = F.closeCheck(p), lockd = cs.perSt === 'closed' || cs.perSt === 'locked';
      var canTick = (can('rec.do') || can('fin.close')) && !lockd;
      var blockers = cs.items.filter(function (i) { return i.st !== 'done'; });
      var closeBtn = '';
      if (can('fin.close') && !lockd) closeBtn = ck.ok && cs.perSt === 'soft' ? A.btn('primary', L('CLOSE PERIOD ' + mon(p), 'CLOSE PERIOD ' + mon(p)), 'lock', { act: 'close', val: p }) : A.chip('mute', L('CLOSE PERIOD terkunci', 'CLOSE PERIOD locked'), 'lock');
      var list = '<ol class="cf10c">' + cs.items.map(function (i) {
        var auto = i.auto.ok ? (i.auto.warn ? '<small class="cf10c-w">' + ic('alert') + t(i.auto.warn) + '</small>' : '<small class="cf10c-ok">' + ic('checkc') + t(L('Cek otomatis lolos', 'Automatic check passed')) + '</small>') : '<small class="cf10c-no">' + ic('xc') + t(i.auto.why) + (i.auto.rec ? ' · ' + lnk(i.scr, i.auto.rec, mono(i.auto.rec)) : '') + '</small>';
        var act = i.st === 'done' ? (can('fin.close') && !lockd ? A.btn('ghost', L('Buka lagi', 'Reopen'), 'refresh', { act: 'untick', val: i.k, cls: 'btn-sm' }) : '') : canTick ? A.btn(i.auto.ok ? 'primary' : 'ghost', L('Tandai selesai', 'Mark done'), 'check', { act: 'tick', val: i.k, cls: 'btn-sm' }) : '';
        return '<li class="cf10c-i' + (i.st === 'done' ? ' done' : '') + '"><span class="cf10c-c">' + ic(i.st === 'done' ? 'checkc' : 'clock') + '</span><span class="cf10c-b"><b>' + t(i.n) + '</b>' + auto +
          (i.st === 'done' ? '<small class="sub5">' + t(L('Selesai ', 'Done ')) + dt(i.at) + ' · ' + emp(i.by) + (i.note ? ' · ' + esc(i.note) : '') + '</small>' : '') + '</span><span class="cf10c-a">' + lnk(i.scr, null, ic('arrow') + t(L('Buka', 'Open'))) + act + '</span></li>';
      }).join('') + '</ol>';
      return P.head(t(L('Checklist closing ' + mon(p) + '. CLOSE PERIOD hanya untuk user berwenang, setelah semua 8 item selesai.', 'Close checklist for ' + mon(p) + '. CLOSE PERIOD only for authorised users, after all 8 items are done.')), closeBtn, P.fresh({ src: L('cek otomatis dari ledger, opname & penyusutan', 'automatic checks from the ledger, stock count & depreciation'), kind: 'live' })) +
        P.deskOnly() + P.perTabs(p, 'p', F.periods().filter(function (x) { return x.p >= '2026-07' && x.p <= F.curPeriod(); }).map(function (x) { return x.p; })) +
        P.kpis([{ k: L('Status periode', 'Period status'), v: t(F.PER_ST[cs.perSt][0]), icon: 'lock', go: 'ACC-005' }, { k: L('Checklist', 'Checklist'), v: cs.done + ' / ' + cs.total, s: P.bar(cs.done, cs.total, cs.ready ? 'ok' : 'warn'), icon: 'list', tone: cs.ready ? 'ok' : 'warn' },
          { k: L('Blocker', 'Blockers'), v: n0(blockers.length), icon: 'alert', tone: blockers.length ? 'crit' : 'ok' }]) +
        (cs.perSt === 'open' && !lockd ? note(t(L('Periode masih Open. Soft close dulu di Kontrol Periode sebelum CLOSE PERIOD.', 'The period is still Open. Soft close it in Period Control before CLOSE PERIOD.')), 'help', 'info') : '') +
        (lockd ? note(t(L('Periode sudah ditutup. Perubahan hanya lewat jurnal penyesuaian di periode berjalan.', 'The period is closed. Changes only through adjustment journals in the running period.')), 'lock', 'info') : '') +
        '<div class="g21-10">' + card(Lx(L('Checklist closing ', 'Close checklist '), mon(p)), list, { icon: 'clipboard', count: cs.done + '/' + cs.total }) +
        '<div class="col10">' + card(L('Blocker CLOSE PERIOD', 'CLOSE PERIOD blockers'), blockers.length ? ckList(blockers.map(function (i) { return { ok: false, n: i.n, v: i.auto.ok ? T(L('menunggu tanda selesai', 'waiting to be marked done')) : T(i.auto.why) }; })) : A.empty(L('Tidak ada blocker. Periode siap ditutup.', 'No blockers. The period is ready to close.')), { icon: 'alert' }) +
        card(L('Riwayat status periode', 'Period status history'), (F.period(p).log || []).length ? '<ul class="cf10a-l">' + F.period(p).log.slice().reverse().map(function (l) { return '<li>' + stc(F.PER_ST, l.from) + ' → ' + stc(F.PER_ST, l.to) + '<span>' + dt(l.at) + ' · ' + emp(l.by) + (l.reason ? ' · ' + t(l.reason) : '') + '</span></li>'; }).join('') + '</ul>' : A.empty(L('Belum ada perubahan status.', 'No status change yet.')), { icon: 'clock', link: ['ACC-005', L('Kontrol periode', 'Period control')] }) + '</div></div>';
    },
    act: {
      tick: function (el) { var k = el.getAttribute('data-val'), p = A.S.q.p || F.lastClosed(), i = F.closeStatus(p).items.filter(function (x) { return x.k === k; })[0];
        if (!i.auto.ok) { A.toast(i.auto.why, 'crit'); return; }
        P.reasonDlg({ title: L('Tandai selesai: ' + T(i.n), 'Mark done: ' + i.n[1]), icon: 'check', ok: L('Tandai selesai', 'Mark done'), optional: true, label: L('Catatan review (opsional)', 'Review note (optional)'), fn: function (note0) { return F.closeTick(cx(), p, k, note0); }, done: L('Item closing selesai.', 'Close item done.') }); },
      untick: function (el) { var k = el.getAttribute('data-val'), p = A.S.q.p || F.lastClosed();
        P.reasonDlg({ title: L('Buka lagi item closing', 'Reopen a close item'), icon: 'refresh', ok: L('Buka lagi', 'Reopen'), fn: function (reason) { return F.closeUntick(cx(), p, k, reason); }, done: L('Item closing dibuka lagi.', 'Close item reopened.') }); },
      close: function (el) { var p = el.getAttribute('data-val');
        P.reasonDlg({ title: L('CLOSE PERIOD ' + mon(p), 'CLOSE PERIOD ' + mon(p)), icon: 'lock', ok: L('Tutup periode', 'Close period'), optional: true, label: L('Catatan (opsional)', 'Note (optional)'),
          sub: t(L('Setelah ditutup, jurnal periode ini tidak bisa diubah; koreksi lewat penyesuaian di periode berjalan.', 'Once closed, this period\'s journals cannot change; corrections go through adjustments in the running period.')),
          fn: function (reason) { var r = F.setPeriod(cx(), p, 'closed', reason || null); if (!r.ok && r.missing) r.msg = L(T(r.msg) + ' ' + r.missing.join(', '), r.msg[1] + ' ' + r.missing.join(', ')); return r; }, done: L('Periode ditutup.', 'Period closed.') }); }
    }
  };

  /* ================= CFO-001 CFO Financial Health ================= */
  function ratioTile(r) {
    return '<a class="cf10t cf10t-' + (F.RATIO_ST[r.st] || F.RATIO_ST.info)[1] + '" href="' + href('CFO-002', r.k) + '"><span class="cf10t-h"><b>' + t(r.n) + '</b>' + stc(F.RATIO_ST, r.st) + '</span>' +
      '<span class="cf10t-v num">' + fr(r.v, r.u) + H.delta(r.delta, { dir: r.th ? r.th.dir : 'higher', fmt: function (x) { return r.u === 'x' ? n0(x, 2) : n0(x, 1); } }) + '</span>' +
      '<span class="cf10t-s">' + t(L('Target ', 'Target ')) + (r.th ? (r.th.dir === 'lower' ? '≤ ' : '≥ ') + fr(r.th.target, r.u) : '—') + '</span><span class="cf10t-f">' + ic(r.live ? 'refresh' : 'clock') + t(r.live ? L('Live ' + r.asOf, 'Live ' + r.asOf) : L('Periode ' + r.p, 'Period ' + r.p)) + '</span></a>';
  }
  function healthBlock(h, o) {
    o = o || {};
    var tot = h.rows.reduce(function (s, r) { return s + r.w; }, 0);
    return '<div class="cf10h">' + '<div class="cf10h-r">' + H.ring(h.score, { size: o.size || 120, band: { tone: h.tone, n: h.bandN }, label: h.n }) + '<span>' + stc({ x: [h.bandN, h.tone] }, 'x') + '<small class="sub5">' + t(L('Model v', 'Model v')) + h.v + ' · ' + t(L('periode ', 'period ')) + esc(h.p) + '</small></span></div>' +
      '<div class="tblw"><table class="tbl dense cf10h-t"><thead><tr><th>' + t(L('Dimensi', 'Dimension')) + '</th><th class="r">' + t(L('Bobot', 'Weight')) + '</th><th class="r">' + t(L('Skor', 'Score')) + '</th><th class="r">' + t(L('Kontribusi', 'Contribution')) + '</th></tr></thead><tbody>' +
      h.rows.map(function (r) { return '<tr><td>' + t(r.n) + (o.items && r.items ? '<small class="sub5">' + r.items.map(function (i) { return t(i.n) + ' ' + (i.u ? fr(i.v, i.u) : n0(i.v)); }).join(' · ') + '</small>' : '') + '</td><td class="r num">' + pct(r.w, 0) + '</td><td class="r num">' + (r.sc == null ? '—' : n0(r.sc)) + '</td><td class="r num">' + n0(r.contrib, 1) + '</td></tr>'; }).join('') +
      '</tbody><tfoot><tr><th>' + t(L('Total', 'Total')) + '</th><th class="r num' + (Math.abs(tot - 100) > 0.01 ? ' t-crit' : '') + '">' + pct(tot, 0) + '</th><th class="r num">' + n0(h.score) + '</th><th class="r num">' + n0(h.rows.reduce(function (s, r) { return s + r.contrib; }, 0), 1) + '</th></tr></tfoot></table></div></div>';
  }
  function decCard(d) {
    return '<a class="cf10d cf10d-' + d.tone + '" href="' + href('CFO-004', d.k) + '"><span class="cf10d-h">' + ic(d.icon) + '<b>' + t(d.k === 'hold' ? d.n : DEC_TITLE[d.k] || d.n) + '</b></span><span class="cf10d-o">' + A.chip(d.tone, d.outN) + (d.score != null ? '<b class="num">' + d.score + '</b>' : '<b class="num">' + d.n_on + '/6</b>') + '</span><span class="cf10d-s">' + t(d.sig) + '</span></a>';
  }
  var DEC_TITLE = { branch: L('Buka Cabang Baru', 'Open New Branch'), sales: L('Tambah Tim Sales', 'Add Sales Team'), ops: L('Tambah Tim Operasional', 'Add Operations Team'), machine: L('Tambah Mesin', 'Add Machine'), client: L('Tambah Klien Baru', 'Add New Client'), invest: L('Tambah Investasi / Capex', 'Increase Investment / Capex'), pricing: L('Review Harga', 'Review Pricing'), hold: L('Hold Expansion', 'Hold Expansion') };
  V['CFO-001'] = {
    render: function (c) {
      var h = F.cfoHome(cx()); if (!h) return A.empty(L('Tidak ada akses.', 'No access.'));
      var R = h.ratios, hl = h.health, al = F.alerts(cx()).filter(function (a) { return a.sev !== 'info'; }).slice(0, 6);
      var row1 = P.kpis([
        { k: L('Kas tersedia', 'Cash available'), v: rpj(h.cash), s: t(L('tanpa rekening dibatasi', 'excl. restricted accounts')), icon: 'coins', go: 'CASH-001' },
        { k: L('Pendapatan MTD', 'Revenue MTD'), v: rpj(h.revMtd), s: mon(F.curPeriod()) + ' · ' + t(L('s/d ', 'to ')) + dt(F.today()), icon: 'trend', go: 'ACC-001' },
        { k: L('Laba bersih MTD', 'Net profit MTD'), v: rpj(h.netMtd), s: pct(h.revMtd ? h.netMtd / h.revMtd * 100 : null) + ' ' + t(L('margin', 'margin')), icon: 'chart', go: 'ACC-001', tone: h.netMtd < 0 ? 'crit' : null },
        { k: L('Piutang (AR)', 'Outstanding AR'), v: rpj(h.ar), s: t(L('jatuh tempo ', 'overdue ')) + rpj(h.arOver), icon: 'clock', go: 'AR-004', tone: h.arOver ? 'warn' : null },
        { k: L('Free cash', 'Free cash'), v: rpj(h.free), s: t(L('kas tersedia − komitmen 30 hari', 'available − 30-day commitments')), icon: 'card', go: 'CASH-001' },
        { k: L('Forecast kas 30 hari', 'Forecast cash 30 days'), v: rpj(h.fc ? h.fc.close : null), s: t(L('skenario dasar · ', 'base case · ')) + dt(h.fcEnd), icon: 'calendar', go: 'CASH-004' }
      ]);
      var ratios = '<div class="cf10t-g">' + R.list.map(ratioTile).join('') + '</div>';
      var acts = (h.actions || []).slice(0, 3);
      return P.head(t(L('Posisi keuangan, 12 rasio inti, skor kesehatan, keputusan scale-up dan aksi teratas. Setiap angka bisa dibuka sampai ke sumbernya.', 'Financial position, 12 core ratios, health score, scale-up decisions and top actions. Every figure opens down to its source.')),
        A.btn('ghost', L('Rekomendasi Aksi', 'Recommended Actions'), 'star', { go: 'CFO-007' }), P.fresh({ src: L('kas, AR & MTD live', 'cash, AR & MTD live'), at: h.at, kind: 'live' })) +
        '<h2 class="cf10-h">' + t(L('Posisi hari ini', 'Position today')) + '</h2>' + row1 +
        (al.length ? '<div class="hide-d hide-t">' + card(L('Alert', 'Alerts'), '<ul class="cf10a-l">' + al.map(function (a) { return '<li>' + A.chip(a.sev === 'crit' ? 'crit' : 'appr', a.t) + '<span>' + lnk(a.s, a.rec, t(a.c)) + '</span></li>'; }).join('') + '</ul>', { icon: 'bell', count: al.length }) + '</div>' : '') +
        '<div class="hide-m"><h2 class="cf10-h">' + t(L('12 rasio inti', '12 core ratios')) + ' <span>' + freshR(R) + '</span></h2>' + P.kpis([{ k: L('Healthy', 'Healthy'), v: R.cnt.healthy, tone: 'ok' }, { k: L('Watch', 'Watch'), v: R.cnt.watch, tone: 'warn' }, { k: L('Critical', 'Critical'), v: R.cnt.critical, tone: R.cnt.critical ? 'crit' : 'ok' }], 'cf10-cnt') + ratios + '</div>' +
        '<div class="g2-10 cf10-r3">' + card(L('Skor Kesehatan Keuangan', 'Financial Health Score'), healthBlock(hl) + '<p class="sub5">' + t(hl.sum) + '</p>' + freshD({ src: L('rasio ' + hl.p, 'ratios ' + hl.p), at: hl.fresh, kind: 'mixed' }), { icon: 'gauge', link: ['CFO-004', L('Rincian & bobot', 'Detail & weights'), 'health'] }) +
        '<div class="col10 hide-m">' + card(L('Keputusan scale-up', 'Scale-up decisions'), '<div class="cf10d-g">' + h.cards.map(decCard).join('') + '</div>' + note(t(L('Tidak ada keputusan ekspansi dari satu metrik; capex tidak pernah disetujui otomatis.', 'No expansion decision comes from one metric; capex is never auto-approved.')), 'shield', 'info'), { icon: 'flag', link: ['CFO-003', L('Pusat keputusan', 'Decision center')] }) + '</div></div>' +
        '<h2 class="cf10-h">' + t(L('Aksi teratas', 'Top recommended actions')) + '</h2><div class="g3-10">' + acts.map(function (a) {
          return P.rec({ title: a.n, icon: 'star', chip: A.chip(a.pri === 1 ? 'crit' : 'warn', L('Prioritas ' + a.pri, 'Priority ' + a.pri)), tone: a.pri === 1 ? 'crit' : 'warn', sig: a.why, impact: a.impact, rec: a.n, act: { n: a.done ? L('Sudah jadi keputusan', 'Already a decision') : L('Jadikan keputusan', 'Make it a decision'), s: 'CFO-007' } });
        }).join('') + '</div>';
    }
  };

  /* ================= CFO-002 Ratio Detail ================= */
  var RATIO_GO = { current: 'CASH-001', quick: 'AR-004', cash: 'CASH-001', ocf: 'CASH-004', runway: 'CASH-004', gpm: 'HPP-001', npm: 'ACC-001', dso: 'AR-004', ccc: 'AR-004', de: 'ACC-001', roi: 'AST-001', mos: 'ACC-001' };
  function thDlg(k) {
    var r = F.ratio(cx(), k), th = F.thAt(k); if (!r || !th) return;
    var hint = th.dir === 'lower' ? L('Lebih rendah lebih baik: target < watch < critical.', 'Lower is better: target < watch < critical.') : L('Lebih tinggi lebih baik: target > watch > critical.', 'Higher is better: target > watch > critical.');
    P.reasonDlg({ title: L('Ubah ambang ' + T(r.n), 'Change the ' + r.n[1] + ' threshold'), icon: 'filter', ok: L('Simpan versi v' + (Math.max.apply(null, F.thHist(k).map(function (x) { return x.v; })) + 1), 'Save version v' + (Math.max.apply(null, F.thHist(k).map(function (x) { return x.v; })) + 1)),
      sub: t(hint) + ' ' + t(L('Periode lalu tetap memakai ambang yang berlaku saat itu.', 'Past periods keep the threshold that applied then.')),
      body: '<div class="g2-10">' + fld(L('Target', 'Target'), inp('target', th.target, { num: true }), { req: true }) + fld(L('Batas Watch', 'Watch limit'), inp('watch', th.watch, { num: true }), { req: true }) +
        fld(L('Batas Critical', 'Critical limit'), inp('crit', th.crit, { num: true }), { req: true }) + fld(L('Berlaku mulai', 'Effective from'), inp('eff', F.today(), { type: 'date' }), { req: true }) + '</div>',
      fn: function (reason, v) { return F.setThreshold(cx(), k, { target: v.target, watch: v.watch, crit: v.crit, eff: v.eff || F.today() }, reason); }, done: L('Ambang disimpan sebagai versi baru.', 'Threshold saved as a new version.') });
  }
  V['CFO-002'] = {
    title: function (rec) { var d = rec && F.ratioDef(rec); return d ? L('Rasio · ' + T(d.n), 'Ratio · ' + d.n[1]) : null; },
    render: function (c) {
      var k = c.rec && F.ratioDef(c.rec) ? c.rec : 'current', ps = F.periods().filter(function (x) { return x.p >= '2026-04' && x.st !== 'open'; }).map(function (x) { return x.p; }), p = ps.indexOf(c.q.p) >= 0 ? c.q.p : F.lastClosed();
      var R = F.ratios(cx(), p), r = F.ratio(cx(), k, p); if (!r) return A.empty(L('Tidak ada akses.', 'No access.'));
      var th = r.th, hist = F.thHist(k), dir = th && th.dir === 'lower' ? '≤' : '≥', u = r.u;
      var tabs = H.tabs(R.list.map(function (x) { return [x.k, x.n, null]; }), k, 'r', { hf: function (kk) { return href('CFO-002', kk, c.q.p ? { p: c.q.p } : null); }, label: L('Rasio', 'Ratios') });
      var hero = P8.hero({ id: (r.live ? T(L('Live per ', 'Live at ')) + r.asOf : T(L('Periode ', 'Period ')) + r.p), icon: 'percent', title: t(r.n), sub: t(r.what), chips: stc(F.RATIO_ST, r.st) + (r.th && r.th.note ? A.chip('info', L('Ambang dengan konteks', 'Threshold with context'), 'help') : ''),
        facts: [[L('Aktual', 'Actual'), fr(r.v, u), 'num'], [L('Target', 'Target'), th ? dir + ' ' + fr(th.target, u) : '—', 'num'], [L('Sebelumnya', 'Previous'), fr(r.prev, u) + ' ' + H.delta(r.delta, { dir: th ? th.dir : 'higher', fmt: function (x) { return u === 'x' ? n0(x, 2) : n0(x, 1); } }), 'num'], [L('Gap ke target', 'Gap to target'), r.gap == null ? '—' : sgn(r.gap) + (u === 'x' ? n0(r.gap, 2) : n0(r.gap, 1)), 'num'], [L('Skor 0–100', 'Score 0–100'), r.score == null ? '—' : n0(r.score), 'num']] });
      var inputs = card(L('Rumus & input', 'Formula & inputs'), '<p class="cf10-f">' + ic('hash') + '<b>' + t(r.f) + '</b></p>' + '<div class="tblw"><table class="tbl dense cf10x-t"><thead><tr><th>' + t(L('Input', 'Input')) + '</th><th class="r">' + t(L('Nilai', 'Value')) + '</th><th>' + t(L('Sumber data', 'Data source')) + '</th></tr></thead><tbody>' +
        r.inp.map(function (i) { return '<tr><td>' + t(i.n) + '</td><td class="r num">' + (i.u === 'Rp' ? rp(i.v) : i.u === '%' ? pct(i.v) : i.u === 'd' ? fr(i.v, 'd') : n0(i.v, 1)) + '</td><td><small>' + (typeof i.src === 'string' ? esc(i.src) : t(i.src)) + '</small></td></tr>'; }).join('') +
        '<tr class="tot"><th>' + t(r.n) + '</th><td class="r num"><b>' + fr(r.v, u) + '</b></td><td><small>' + t(r.src) + '</small></td></tr></tbody></table></div>' +
        (r.bep ? '<p class="sub5">BEP ' + rp(r.bep.bep) + ' · ' + t(L('biaya tetap ', 'fixed cost ')) + rp(r.bep.fixed) + ' · CMR ' + pct(r.bep.cmr) + ' · ' + t(L('semi-variabel dihitung ', 'semi-variable counted ')) + pct(r.bep.semi * 100, 0) + ' ' + t(L('variabel', 'variable')) + '</p>' : ''), { icon: 'list' });
      var ser = r.series.filter(function (s) { return s.v != null; });
      var trend = card(L('Tren', 'Trend'), ser.length > 1 ? A.lineChart([{ n: r.n, v: ser.map(function (s) { return u === 'x' ? Math.round(s.v * 100) / 100 : Math.round(s.v * 10) / 10; }) }], ser.map(function (s) { return s.live ? T(L('live', 'live')) : mon(s.p, false); }), { fmt: function (v) { return T(fr(v, u)).replace(/&[^;]+;/g, ''); }, fmtAx: function (v) { return u === 'x' ? A.fmt.num(v, 1) : A.fmt.num(v, 0); }, target: th ? th.target : null, label: T(r.n) }) : A.empty(L('Belum cukup data.', 'Not enough data yet.')), { icon: 'trend' });
      var thc = card(Lx(L('Ambang (v', 'Threshold (v'), (th ? th.v : '—') + ')'), (th ? kv([[L('Arah', 'Direction'), t(th.dir === 'lower' ? L('Lebih rendah lebih baik', 'Lower is better') : L('Lebih tinggi lebih baik', 'Higher is better'))], [L('Healthy', 'Healthy'), dir + ' ' + fr(th.target, u)], [L('Watch', 'Watch'), th.dir === 'lower' ? '> ' + fr(th.target, u) + ' … ≤ ' + fr(th.crit, u) : '≥ ' + fr(th.crit, u) + ' … < ' + fr(th.target, u)], [L('Critical', 'Critical'), (th.dir === 'lower' ? '> ' : '< ') + fr(th.crit, u)], [L('Batas watch (skor)', 'Watch limit (score)'), fr(th.watch, u)], [L('Berlaku sejak', 'Effective since'), dt(th.eff)], th.note ? [L('Konteks', 'Context'), t(th.note)] : null]) : '') +
        '<h3 class="cf10-h3">' + t(L('Riwayat versi', 'Version history')) + '</h3>' + P.table(hist, [
          { h: 'v', v: function (x) { return '<b>v' + x.v + '</b>' + (th && x.v === th.v ? ' ' + A.chip('ok', L('berlaku', 'in force')) : x.eff > F.today() ? ' ' + A.chip('info', L('terjadwal', 'scheduled')) : ''); } }, { h: L('Berlaku', 'Effective'), v: function (x) { return dt(x.eff); } },
          { h: L('Target / watch / critical', 'Target / watch / critical'), cls: 'num', v: function (x) { return fr(x.target, u) + ' / ' + fr(x.watch, u) + ' / ' + fr(x.crit, u); } },
          { h: L('Oleh · alasan', 'By · reason'), v: function (x) { return emp(x.by) + '<small class="sub5">' + (x.reason ? t(x.reason) : x.note ? t(x.note) : t(L('Ambang awal', 'Initial threshold'))) + '</small>'; } }
        ], function (x) { return { t: 'v' + x.v + ' · ' + dt(x.eff), r: fr(x.target, u), s: x.reason ? t(x.reason) : '' }; }), { icon: 'filter', right: A.pbtn('cfo.th', 'ghost', L('Ubah ambang', 'Change threshold'), 'edit', { act: 'th', val: k, cls: 'btn-sm' }) });
      var rec = P.rec({ title: L('Insight', 'Insight'), icon: 'bulb', tone: P.tone(r.st), chip: stc(F.RATIO_ST, r.st), sig: r.insight,
        why: [L(T(r.f) + ' = ' + T(fr(r.v, u)).replace(/&[^;]+;/g, ''), r.f[1] + ' = ' + T(fr(r.v, u)).replace(/&[^;]+;/g, '')), r.src], impact: r.risk, rec: r.rec, act: { n: L('Buka sumber', 'Open the source'), s: RATIO_GO[k] } });
      return P.head(t(L('Aktual, target, sebelumnya, tren, gap, status, rumus, sumber data, insight, risiko dan rekomendasi.', 'Actual, target, previous, trend, gap, status, formula, data source, insight, risk and recommendation.')),
        '<label class="cf10-ps"><span>' + t(L('Periode', 'Period')) + '</span><select data-f="p">' + ps.slice().reverse().map(function (x) { return '<option value="' + x + '"' + (x === p ? ' selected' : '') + '>' + esc(mon(x)) + ' · ' + t(F.PER_ST[F.perSt(x + '-01')][0]) + '</option>'; }).join('') + '</select></label>',
        P.fresh({ src: r.src, at: R.at, kind: r.live ? 'live' : 'ledger' })) + P.deskOnly() + tabs + hero + '<div class="g2-10"><div class="col10">' + rec + inputs + '</div><div class="col10">' + trend + thc + '</div></div>';
    },
    act: { th: function (el) { thDlg(el.getAttribute('data-val')); } }
  };

  /* ================= CFO-003 Scale-Up Decision Center ================= */
  function decRec(d, o) {
    o = o || {};
    return P.rec({ title: DEC_TITLE[d.k] || d.n, icon: d.icon, tone: d.tone, chip: A.chip(d.tone, d.outN) + (d.score != null ? ' <b class="num cf10d-sc">' + t(L('Skor ', 'Score ')) + d.score + '</b>' : ''),
      sig: d.sig, why: d.why && d.why.length ? d.why : [L('—', '—')], impact: d.impact, rec: d.rec, act: o.act || (P.open(d.act.s) ? A.btn('primary', d.act.n, 'arrow', { go: d.act.s, rec: d.act.rec, cls: 'btn-sm' }) : '') + ' ' + (o.noDetail ? '' : A.btn('ghost', L('Input & bobot', 'Inputs & weights'), 'list', { go: 'CFO-004', rec: d.k, cls: 'btn-sm' })) });
  }
  V['CFO-003'] = {
    render: function (c) {
      var ds = F.decisions(cx()); if (!ds) return A.empty(L('Tidak ada akses.', 'No access.'));
      var hold = ds.filter(function (d) { return d.k === 'hold'; })[0];
      return P.head(t(L('Delapan keputusan scale-up dari skor gabungan, bukan dari satu metrik. Setiap kartu: SIGNAL, WHY, IMPACT, RECOMMENDATION, ACTION; skor bisa dibuka sampai input dan bobotnya.', 'Eight scale-up decisions from combined scores, never from one metric. Every card: SIGNAL, WHY, IMPACT, RECOMMENDATION, ACTION; each score opens down to its inputs and weights.')),
        A.btn('ghost', L('Scenario Builder', 'Scenario Builder'), 'zap', { go: 'CFO-005' }), freshD(ds[0].fresh)) +
        (hold.out === 'hold' ? note(t(L('HOLD EXPANSION aktif: ', 'HOLD EXPANSION active: ')) + t(hold.sig), 'ban', 'crit') : '') +
        '<div class="cf10d-g cf10d-top">' + ds.map(decCard).join('') + '</div>' +
        note(t(L('Rekomendasi tidak pernah menyetujui capex: setiap investasi lewat PR/PO dengan persetujuan Owner.', 'A recommendation never approves capex: every investment goes through a PR/PO with Owner approval.')), 'shield', 'info') +
        '<div class="g2-10">' + ds.map(function (d) { return decRec(d); }).join('') + '</div>';
    }
  };

  /* ================= CFO-004 Decision Detail ================= */
  function healthDec() {
    var h = F.health(cx()); if (!h) return null;
    return Object.assign({}, h, { k: 'health', icon: 'gauge', outN: h.bandN, out: h.band, sig: h.sum, why: h.weak.map(function (w) { return L(T(w.n) + ': skor ' + w.sc + ' (bobot ' + w.w + '%)', w.n[1] + ': score ' + w.sc + ' (weight ' + w.w + '%)'); }),
      impact: L('Skor kesehatan berbobot 40% di skor buka cabang.', 'The health score weighs 40% in the branch score.'), rec: h.band === 'healthy' ? L('Pertahankan; perbaiki dimensi terlemah.', 'Maintain; improve the weakest dimensions.') : L('Perbaiki dimensi terlemah sebelum ekspansi.', 'Improve the weakest dimensions before expanding.'),
      act: { n: L('Buka rasio terlemah', 'Open the weakest ratio'), s: 'CFO-002', rec: (h.weak[0] && h.weak[0].items && h.weak[0].items[0] ? h.weak[0].items[0].k : 'current') }, assume: [L('Bobot dimensi mengikuti aturan Fase 5: total 100%.', 'Dimension weights follow the Phase 5 rule: total 100%.'), L('Pertumbuhan revenue MoM dinilai −3% (0) sampai +3% (100).', 'Revenue growth MoM is scored from −3% (0) to +3% (100).')],
      fresh: { src: L('rasio ' + h.p, 'ratios ' + h.p), at: h.fresh, kind: 'mixed' } });
  }
  function modelDlg(k) {
    var m = F.modelAt(k); if (!m) return;
    var body = '<div class="g2-10">' + m.w.map(function (x) { return fld(F.DIM_N[x[0]] || L(x[0], x[0]), inp('w_' + x[0], x[1], { num: true })); }).join('') + '</div><p class="cf10m-t" role="status">' + t(L('Total', 'Total')) + ': <b class="num">100%</b></p>';
    P.reasonDlg({ title: L('Ubah bobot ' + T(F.MODEL_N[k]), 'Change the ' + F.MODEL_N[k][1] + ' weights'), icon: 'filter', ok: L('Simpan versi v' + (m.v + 1), 'Save version v' + (m.v + 1)), sub: t(L('Total bobot harus 100%. Versi lama tetap tersimpan dan tercatat di audit.', 'Weights must total 100%. The old version is kept and audited.')), body: body,
      fn: function (reason, v) { var w = {}; m.w.forEach(function (x) { w[x[0]] = v['w_' + x[0]]; }); return F.setModel(cx(), k, w, reason); }, done: L('Bobot model disimpan sebagai versi baru.', 'Model weights saved as a new version.') });
    setTimeout(function () {
      var el = document.querySelector('.dlg5'); if (!el) return;
      function upd() { var s = 0; el.querySelectorAll('input[name^="w_"]').forEach(function (i) { s += Number(String(i.value).replace(',', '.')) || 0; }); var b = el.querySelector('.cf10m-t b'); if (b) { b.textContent = A.fmt.num(s, 1) + '%'; b.className = 'num ' + (Math.abs(s - 100) < 0.005 ? 't-ok' : 't-crit'); } }
      el.addEventListener('input', upd); upd();
    }, 30);
  }
  V['CFO-004'] = {
    title: function (rec) { return rec ? (rec === 'health' ? F.MODEL_N.health : DEC_TITLE[rec] || null) : null; },
    render: function (c) {
      var keys = ['health', 'branch', 'sales', 'ops', 'machine', 'client', 'invest', 'pricing', 'hold'], k = keys.indexOf(c.rec) >= 0 ? c.rec : 'branch';
      var d = k === 'health' ? healthDec() : F.decision(cx(), k); if (!d) return A.empty(L('Tidak ada akses.', 'No access.'));
      var tabs = H.tabs(keys.map(function (x) { return [x, x === 'health' ? L('Kesehatan', 'Health') : DEC_TITLE[x], null]; }), k, 'k', { hf: function (kk) { return href('CFO-004', kk); }, label: L('Keputusan', 'Decisions') });
      var m = k !== 'hold' ? F.modelAt(k) : null, tw = d.rows ? d.rows.reduce(function (s, r) { return s + (r.w || 0); }, 0) : 0;
      var hero = P8.hero({ id: k === 'hold' ? T(L('Sinyal hold', 'Hold signals')) : T(L('Model v', 'Model v')) + d.v + ' · ' + T(L('berlaku ', 'effective ')) + d.eff, icon: d.icon, title: t(k === 'health' ? d.n : DEC_TITLE[k]), sub: t(d.sig), chips: A.chip(d.tone, d.outN),
        facts: [[L('Skor', 'Score'), d.score != null ? n0(d.score) : d.n_on + ' / 6', 'num'], [L('Hasil', 'Outcome'), t(d.outN)], [L('Periode sumber', 'Source period'), esc(d.p)], d.missing && d.missing.length ? [L('Input kosong', 'Missing inputs'), esc(d.missing.join(', '))] : null] });
      var rows = d.rows || [];
      var tbl = '<div class="tblw"><table class="tbl dense cf10x-t"><thead><tr><th>' + t(L('Input', 'Input')) + '</th><th class="r">' + t(L('Nilai aktual', 'Actual value')) + '</th><th class="r">' + t(L('Target', 'Target')) + '</th><th class="r">' + t(L('Skor 0–100', 'Score 0–100')) + '</th><th class="r">' + t(L('Bobot', 'Weight')) + '</th><th class="r">' + t(L('Kontribusi', 'Contribution')) + '</th><th>' + t(L('Sumber', 'Source')) + '</th></tr></thead><tbody>' +
        rows.map(function (r) {
          var val = k === 'hold' ? esc(r.v) : k === 'health' ? (r.items || []).map(function (i) { return lnk('CFO-002', i.k === 'growth' ? null : i.k, t(i.n)) + ' ' + (i.u ? fr(i.v, i.u) : n0(i.v)); }).join('<br>') : fv(r.v, r.u);
          var tgt = k === 'hold' ? (r.on ? A.chip('crit', L('Aktif', 'Active')) : A.chip('ok', L('Tidak aktif', 'Off'))) : k === 'health' ? '—' : fv(r.target, r.u);
          return '<tr' + (r.sc == null ? ' class="cf10x-miss"' : '') + '><td><b>' + t(r.n) + '</b>' + (r.assume ? ' ' + A.chip('warn', L('Asumsi', 'Assumption'), 'help') : '') + (r.note ? '<small class="sub5">' + t(r.note) + '</small>' : '') + '</td><td class="r num">' + val + '</td><td class="r num">' + tgt + '</td><td class="r num">' + (r.sc == null ? '—' : n0(r.sc)) + '</td><td class="r num">' + (r.w == null ? '—' : pct(r.w, 0)) + '</td><td class="r num">' + (r.contrib == null ? '—' : n0(r.contrib, 1)) + '</td><td><small>' + (r.src ? (typeof r.src === 'string' ? esc(r.src) : t(r.src)) : k === 'health' ? t(L('Rasio ', 'Ratios ')) + esc(d.p) : '—') + '</small></td></tr>';
        }).join('') + '</tbody>' + (k !== 'hold' ? '<tfoot><tr><th>' + t(L('Total', 'Total')) + '</th><td></td><td></td><td class="r num"><b>' + n0(d.score) + '</b></td><td class="r num' + (Math.abs(tw - 100) > 0.01 ? ' t-crit' : '') + '"><b>' + pct(tw, 0) + '</b></td><td class="r num"><b>' + n0(rows.reduce(function (s, r) { return s + (r.contrib || 0); }, 0), 1) + '</b></td><td></td></tr></tfoot>' : '') + '</table></div>' + (k !== 'hold' ? '<p class="cf10-f">' + ic('hash') + '<b>' + t(L('Skor = Σ(skor × bobot) ÷ Σ bobot input yang tersedia; kontribusi = skor × bobot ÷ 100. Skor input 0–100 dihitung linear antara batas buruk dan baik terhadap target.', 'Score = Σ(score × weight) ÷ Σ weight of available inputs; contribution = score × weight ÷ 100. Each input score 0–100 is linear between its bad and good limits against the target.')) + '</b></p>' : '');
      var trans = card(L('Transparansi skor: input, bobot, nilai, target, kontribusi', 'Score transparency: inputs, weights, values, targets, contribution'), tbl + (k === 'hold' ? note(t(L('Hold bila ≥ 3 dari 6 sinyal aktif; hati-hati bila 2.', 'Hold when ≥ 3 of 6 signals are active; caution at 2.')), 'help') : ''), { icon: 'list', count: rows.length });
      var extra = '';
      if (d.gates) extra += card(L('Syarat buka cabang (semua wajib)', 'Branch conditions (all required)'), ckList(d.gates) + note(t(L('Rekomendasi buka cabang butuh skor ≥ 75 dan semua syarat terpenuhi.', 'A branch recommendation needs a score ≥ 75 and every condition met.')), 'shield', 'info'), { icon: 'checkc', count: d.gates.filter(function (g) { return g.ok; }).length + '/' + d.gates.length });
      if (k === 'ops') extra += card(L('Kebutuhan tim operasional', 'Operations team need'), kv([[L('Tingkat kebutuhan', 'Need level'), A.chip(d.tone, d.outN)], [L('Area', 'Area'), t(d.area)], [L('Shift', 'Shift'), t(d.shift)], [L('Headcount', 'Headcount'), d.hc[0] ? '<b class="num">' + d.hc[0] + '–' + d.hc[1] + '</b> ' + t(L('orang', 'people')) : t(L('Belum perlu', 'Not needed'))]]) + '<div class="cf10a-btns">' + scrBtn('PROD-CAP-001', null, L('Kapasitas Fase 8', 'Phase 8 capacity')) + '</div>', { icon: 'users' });
      if (d.scn) extra += card(L('Skenario dryer (asumsi)', 'Dryer scenario (assumptions)'), kv([['ROI', pct(d.scn.roi)], [L('Payback', 'Payback'), n0(d.scn.payback, 1) + ' ' + t(L('bln', 'mo'))], [L('Tambahan efektif', 'Effective addition'), n0(d.scn.addKgDay) + ' kg/' + t(L('hari', 'day'))]]) + '<div class="cf10a-btns">' + scrBtn('CFO-005', 'SCN-01', L('Buka skenario', 'Open the scenario')) + '</div>', { icon: 'zap' });
      if (d.sub && d.sub.scn) extra += card(L('Skenario Sanur (asumsi)', 'Sanur scenario (assumptions)'), kv([[L('Capex', 'Capex'), rpj(d.sub.scn.capex)], [L('Porsi kas', 'Cash share'), rpj(d.sub.scn.capexCash)], ['ROI', pct(d.sub.scn.roi)], [L('Payback', 'Payback'), d.sub.scn.payback == null ? '—' : n0(d.sub.scn.payback, 1) + ' ' + t(L('bln', 'mo'))]]) + '<div class="cf10a-btns">' + scrBtn('CFO-005', 'SCN-03', L('Buka skenario', 'Open the scenario')) + '</div>', { icon: 'zap' });
      var ass = card(L('Asumsi & kesegaran data', 'Assumptions & data freshness'), rows2((d.assume || []).concat(rows.filter(function (r) { return r.assume; }).map(function (r) { return L(T(r.n) + ': input manajemen / survei, bukan transaksi', r.n[1] + ': management / survey input, not transactions'); }))) + '<p>' + freshD(d.fresh) + '</p>', { icon: 'help' });
      var mc = m ? card(Lx(L('Bobot model (v', 'Model weights (v'), m.v + ')'), P.table(F.modelHist(k), [
        { h: 'v', v: function (x) { return '<b>v' + x.v + '</b>' + (x.v === m.v ? ' ' + A.chip('ok', L('berlaku', 'in force')) : ''); } }, { h: L('Berlaku', 'Effective'), v: function (x) { return dt(x.eff); } },
        { h: L('Bobot', 'Weights'), v: function (x) { return '<small>' + x.w.map(function (w) { return t(F.DIM_N[w[0]] || L(w[0], w[0])) + ' ' + w[1] + '%'; }).join(' · ') + '</small>'; } },
        { h: L('Oleh · alasan', 'By · reason'), v: function (x) { return emp(x.by) + '<small class="sub5">' + (x.reason ? t(x.reason) : t(L('Bobot awal', 'Initial weights'))) + '</small>'; } }
      ], function (x) { return { t: 'v' + x.v + ' · ' + dt(x.eff), r: '', s: x.w.map(function (w) { return w[0] + ' ' + w[1]; }).join(', ') }; }), { icon: 'filter', right: A.pbtn('cfo.model', 'ghost', L('Ubah bobot', 'Change weights'), 'edit', { act: 'model', val: k, cls: 'btn-sm' }) }) : '';
      return P.head(t(L('Transparansi penuh: input, bobot, nilai aktual, target, kontribusi, asumsi dan kesegaran data.', 'Full transparency: inputs, weights, actual values, targets, contribution, assumptions and data freshness.')), A.btn('ghost', L('Pusat keputusan', 'Decision center'), 'flag', { go: 'CFO-003' }), freshD(d.fresh)) +
        P.deskOnly() + tabs + hero + '<div class="g21-10"><div class="col10">' + decRec(d, { noDetail: true }) + '</div><div class="col10">' + (extra || ass) + '</div></div>' + trans + '<div class="g2-10">' + (mc || '') + (extra ? ass : '') + '</div>';
    },
    act: { model: function (el) { modelDlg(el.getAttribute('data-val')); } }
  };

  /* ================= CFO-005 Scenario Builder ================= */
  var SCN_IN = [['capex', L('Capex', 'Capex'), L('Rp juta', 'Rp million')], ['capKg', L('Kapasitas tambahan', 'Added capacity'), L('kg/hari', 'kg/day')], ['labor', L('Tenaga kerja tambahan', 'Additional labour'), L('Rp juta/bln', 'Rp million/mo')],
    ['maint', L('Maintenance', 'Maintenance'), L('Rp juta/bln', 'Rp million/mo')], ['energy', L('Energi', 'Energy'), L('Rp juta/bln', 'Rp million/mo')], ['ovh', L('Overhead lain', 'Other overhead'), L('Rp juta/bln', 'Rp million/mo')],
    ['vol', L('Volume diharapkan (utilisasi 0–1)', 'Expected volume (utilisation 0–1)'), L('rasio', 'ratio')], ['price', L('Harga jual', 'Selling price'), L('Rp/kg', 'Rp/kg')], ['life', L('Umur ekonomis', 'Useful life'), L('bulan', 'months')],
    ['rate', L('Bunga pembiayaan', 'Financing rate'), L('% / tahun', '% / year')]];
  function scnDlg(base) {
    var i0 = base ? base.inp : { capex: 285, capKg: 1250, labor: 0, maint: 0.8, energy: 3.1, ovh: 0, vol: 0.5, price: 8300, life: 96, rate: 0, fin: 'cash', start: '' };
    dlg({ title: L('Skenario baru', 'New scenario'), icon: 'zap', ok: L('Hitung & simpan', 'Calculate & save'),
      sub: t(L('Semua input adalah ASUMSI, bukan fakta. Hasil dihitung otomatis; skenario tidak menyetujui capex.', 'Every input is an ASSUMPTION, not a fact. Outputs are computed; a scenario never approves capex.')),
      body: fld(L('Nama skenario', 'Scenario name'), inp('n', base ? T(base.n) + ' (v2)' : ''), { req: true, wide: true }) + '<div class="g2-10">' +
        SCN_IN.map(function (x) { return fld(L(T(x[1]) + ' (' + T(x[2]) + ')', x[1][1] + ' (' + x[2][1] + ')'), inp(x[0], i0[x[0]] == null ? '' : i0[x[0]], { num: true }), { req: ['capex', 'capKg', 'vol', 'price', 'life'].indexOf(x[0]) >= 0 }); }).join('') +
        fld(L('Pembiayaan', 'Financing'), sel('fin', P.opts(F.SCN_FIN), i0.fin || 'cash')) + fld(L('Tanggal mulai', 'Start date'), inp('start', i0.start || '', { type: 'date' })) + '</div>',
      onOk: function (v) { var r = F.createScenario(cx(), v.n, v); if (!r.ok) return r.msg; P.after(L('Skenario ' + r.scn.id + ' dibuat.', 'Scenario ' + r.scn.id + ' created.')); setTimeout(function () { A.go('CFO-005', r.scn.id); }, 300); return true; } });
  }
  function outKv(o) {
    return P.kpis([
      { k: L('Tambahan kapasitas efektif', 'Effective added capacity'), v: n0(o.addKgDay) + ' kg/' + t(L('hari', 'day')), s: '+' + pct(o.capPct) + ' ' + t(L('volume', 'volume')), icon: 'layers' },
      { k: L('Revenue / bln', 'Revenue / month'), v: rpj(o.rev), icon: 'coins' }, { k: L('Biaya / bln', 'Cost / month'), v: rpj(o.cost), s: t(L('variabel ', 'variable ')) + rpj(o.varC) + ' · ' + t(L('tetap ', 'fixed ')) + rpj(o.fixAdd), icon: 'arrowdn' },
      { k: L('Laba tambahan / bln', 'Added profit / month'), v: rpj(o.profit), tone: o.profit > 0 ? 'ok' : 'crit', icon: 'trend' },
      { k: L('Dampak HPP/kg', 'HPP/kg impact'), v: sgn(o.hppD) + pct(o.hppD), s: rp(o.hpp0) + ' → ' + rp(o.hpp1), icon: 'gauge' },
      { k: 'ROI', v: pct(o.roi), s: t(L('laba × 12 ÷ capex', 'profit × 12 ÷ capex')), icon: 'percent' },
      { k: L('Payback', 'Payback'), v: o.payback == null ? '—' : n0(o.payback, 1) + ' ' + t(L('bln', 'mo')), s: t(L('capex ÷ (laba + penyusutan)', 'capex ÷ (profit + depreciation)')), icon: 'clock' },
      { k: L('Runway setelah investasi', 'Runway after investment'), v: o.runway == null ? '—' : n0(o.runway, 1) + ' ' + t(L('bln', 'mo')), s: t(L('kas ', 'cash ')) + rpj(o.cash), tone: o.runway != null && o.runway < 1.5 ? 'warn' : null, icon: 'card' },
      { k: L('BEP baru', 'New BEP'), v: rpj(o.bep), s: 'MoS ' + pct(o.mosPct), icon: 'scale' },
      { k: L('Dampak utang (D/E)', 'Debt impact (D/E)'), v: n0(o.de, 2) + '×', s: t(L('dari ', 'from ')) + n0(o.de0, 2) + '×', tone: o.de > o.de0 ? 'warn' : null, icon: 'building' }
    ], 'cf10s-k');
  }
  V['CFO-005'] = {
    title: function (rec) { return rec ? L('Skenario ' + rec, 'Scenario ' + rec) : null; },
    render: function (c) {
      var all = F.scenarios(cx()); if (!all) return A.empty(L('Tidak ada akses.', 'No access.'));
      var s = all.filter(function (x) { return x.id === c.rec; })[0] || all[0], o = s.out, b = o.base;
      var list = '<div class="cf10s-l">' + all.map(function (x) { return '<a class="cf10s-i' + (x.id === s.id ? ' on' : '') + '" href="' + href('CFO-005', x.id) + '"><b class="mono6">' + esc(x.id) + '</b><span>' + t(x.n) + '</span><small>' + rpj(x.out.capex) + ' · ROI ' + pct(x.out.roi) + ' · ' + t(F.SCN_FIN[x.out.fin]) + '</small></a>'; }).join('') + '</div>';
      var inpT = '<div class="tblw"><table class="tbl dense"><thead><tr><th>' + t(L('Input (asumsi)', 'Input (assumption)')) + '</th><th class="r">' + t(L('Nilai', 'Value')) + '</th></tr></thead><tbody>' +
        SCN_IN.map(function (x) { var v = s.inp[x[0]]; return '<tr><td>' + t(x[1]) + ' <small class="sub5">' + t(x[2]) + '</small></td><td class="r num">' + (v == null ? '—' : n0(v, v % 1 ? 2 : 0)) + '</td></tr>'; }).join('') +
        '<tr><td>' + t(L('Pembiayaan', 'Financing')) + '</td><td class="r">' + t(F.SCN_FIN[s.inp.fin || 'cash']) + '</td></tr><tr><td>' + t(L('Tanggal mulai', 'Start date')) + '</td><td class="r">' + dt(s.inp.start) + '</td></tr></tbody></table></div>';
      var baseC = card(Lx(L('Basis (fakta dari ledger ', 'Base (facts from the ledger '), b.p + ')'), kv([[L('Pendapatan', 'Revenue'), rpj(b.rev)], [L('Biaya variabel / kg', 'Variable cost / kg'), rp(b.varKg)], [L('Biaya tetap', 'Fixed cost'), rpj(b.fixed)], [L('Volume', 'Volume'), P.kg(b.kg)], [L('Kas tersedia', 'Available cash'), rpj(b.cash)], [L('Free cash', 'Free cash'), rpj(b.free)], ['BEP', rpj(b.bep)]]), { icon: 'database' });
      return P.head(t(L('Capex, kapasitas, tenaga kerja, maintenance, volume, harga, umur, pembiayaan → kapasitas efektif (setelah bottleneck finishing), revenue, biaya, HPP, laba, ROI, payback, runway, BEP, margin of safety, utang.', 'Capex, capacity, labour, maintenance, volume, price, life, financing → effective capacity (after the finishing bottleneck), revenue, cost, HPP, profit, ROI, payback, runway, BEP, margin of safety, debt.')),
        A.pbtn('cfo.scn', 'primary', L('Skenario Baru', 'New Scenario'), 'plus', { act: 'new' }) + A.pbtn('cfo.scn', 'ghost', L('Duplikat & ubah', 'Duplicate & edit'), 'copy', { act: 'dup', val: s.id }) + A.btn('ghost', L('Bandingkan', 'Compare'), 'columns', { go: 'CFO-006', qs: 'ids=' + all.slice(0, 3).map(function (x) { return x.id; }).filter(function (id) { return id !== s.id; }).slice(0, 2).concat([s.id]).join(',') }),
        P.fresh({ src: L('basis ledger ' + b.p + ' + asumsi skenario', 'ledger base ' + b.p + ' + scenario assumptions'), kind: 'snapshot', at: s.at })) + P.deskOnly() +
        '<div class="cf10s">' + '<aside>' + card(L('Skenario', 'Scenarios'), list, { icon: 'zap', count: all.length }) + '</aside><div class="col10">' +
        P8.hero({ id: s.id + ' · ' + T(L('dibuat ', 'created ')) + s.at, icon: 'zap', title: t(s.n), sub: t(L('Oleh ', 'By ')) + emp(s.by) + ' · ' + t(F.SCN_FIN[o.fin]), chips: A.chip('warn', L('ASUMSI, bukan fakta', 'ASSUMPTIONS, not facts'), 'help') + A.chip('mute', L('Capex belum disetujui', 'Capex not approved'), 'lock'),
          facts: [[L('Investasi', 'Investment'), rp(o.capex), 'num'], [L('Porsi kas', 'Cash share'), rp(o.capexCash), 'num'], ['ROI', pct(o.roi), 'num'], [L('Payback', 'Payback'), o.payback == null ? '—' : n0(o.payback, 1) + ' ' + t(L('bln', 'mo')), 'num']] }) +
        '<h2 class="cf10-h">' + t(L('Hasil (dihitung)', 'Outputs (computed)')) + '</h2>' + outKv(o) +
        (o.bottleneck ? note(t(o.bottleneck), 'alert', 'warn') : '') +
        '<div class="g2-10">' + card(L('Input skenario: ASUMSI', 'Scenario inputs: ASSUMPTIONS'), inpT, { icon: 'edit' }) + '<div class="col10">' + card(L('Risiko', 'Risks'), o.risk.length ? rows2(o.risk) : A.empty(L('Tidak ada risiko khusus.', 'No specific risk.')), { icon: 'alert', count: o.risk.length }) +
        card(L('Asumsi perhitungan', 'Calculation assumptions'), rows2(o.assume), { icon: 'help' }) + baseC + '</div></div>' +
        note(t(L('Skenario tidak pernah menyetujui capex. Investasi tetap lewat purchase request dan PO capex dengan persetujuan Owner.', 'A scenario never approves capex. An investment still goes through a purchase request and a capex PO with Owner approval.')) + (P.open('PUR-002') ? ' ' + lnk('PUR-002', null, t(L('Buat purchase request', 'Create a purchase request'))) : ''), 'shield', 'info') + '</div></div>';
    },
    act: { new: function () { scnDlg(null); }, dup: function (el) { scnDlg(F.scenario(cx(), el.getAttribute('data-val'))); } }
  };

  /* ================= CFO-006 Scenario Comparison ================= */
  V['CFO-006'] = {
    render: function (c) {
      var all = F.scenarios(cx()); if (!all) return A.empty(L('Tidak ada akses.', 'No access.'));
      var ids = (c.q.ids || '').split(',').filter(function (x) { return all.some(function (s) { return s.id === x; }); }).slice(0, 3), cmp = F.compareScn(cx(), ids), cols = cmp.cols;
      if (!ids.length) ids = cols.slice(1).map(function (x) { return x.id; });
      function tog(id) { var on = ids.indexOf(id) >= 0, nx = on ? ids.filter(function (x) { return x !== id; }) : ids.concat([id]).slice(-3); return '<a class="cf10s-tg' + (on ? ' on' : '') + '" href="' + href('CFO-006', null, nx.length ? { ids: nx.join(',') } : null) + '" aria-pressed="' + on + '">' + ic(on ? 'checkc' : 'plus') + '<b class="mono6">' + esc(id) + '</b></a>'; }
      var M = [
        [L('Investasi', 'Investment'), function (o) { return rp(o.capex); }], [L('Pembiayaan', 'Financing'), function (o) { return o.fin ? t(F.SCN_FIN[o.fin]) : '—'; }],
        [L('Revenue tambahan / bln', 'Added revenue / month'), function (o) { return rpj(o.rev); }], [L('Laba tambahan / bln', 'Added profit / month'), function (o) { return rpj(o.profit); }],
        [L('Kas setelah investasi', 'Cash after investment'), function (o) { return rpj(o.cash); }], ['ROI', function (o) { return pct(o.roi); }],
        [L('Payback', 'Payback'), function (o) { return o.payback == null ? '—' : n0(o.payback, 1) + ' ' + t(L('bln', 'mo')); }], ['BEP', function (o) { return rpj(o.bep) + '<small class="sub5">MoS ' + pct(o.mosPct) + '</small>'; }],
        [L('Runway', 'Runway'), function (o) { return o.runway == null ? '—' : n0(o.runway, 1) + ' ' + t(L('bln', 'mo')); }],
        [L('Kapasitas efektif', 'Effective capacity'), function (o) { return '+' + n0(o.addKgDay) + ' kg/' + t(L('hari', 'day')) + '<small class="sub5">+' + pct(o.capPct) + '</small>'; }],
        ['D/E', function (o) { return n0(o.de, 2) + '×'; }], [L('Risiko', 'Risk'), function (o) { return o.risk && o.risk.length ? rows2(o.risk) : '<span class="sub5">—</span>'; }]];
      var tbl = '<div class="tblw"><table class="tbl dense cf10v-t"><thead><tr><th></th>' + cols.map(function (x) { return '<th>' + (x.id === 'CUR' ? t(x.n) : lnk('CFO-005', x.id, mono(x.id)) + '<small class="sub5">' + t(x.n) + '</small>') + '</th>'; }).join('') + '</tr></thead><tbody>' +
        M.map(function (m) { return '<tr><th>' + t(m[0]) + '</th>' + cols.map(function (x) { return '<td class="' + (m[0][1] === 'Risk' ? '' : 'num') + '">' + m[1](x.out) + '</td>'; }).join('') + '</tr>'; }).join('') + '</tbody></table></div>';
      var cards = '<div class="cf10v-cards">' + cols.map(function (x) { return card(x.id === 'CUR' ? x.n : L(x.id + ' · ' + T(x.n), x.id + ' · ' + x.n[1]), kv(M.slice(0, 11).map(function (m) { return [m[0], m[1](x.out)]; })), { icon: x.id === 'CUR' ? 'building' : 'zap' }); }).join('') + '</div>';
      return P.head(t(L('Saat ini vs sampai 3 skenario: investasi, revenue, laba, kas, ROI, payback, BEP, runway, kapasitas dan risiko. Skenario = asumsi.', 'Current vs up to 3 scenarios: investment, revenue, profit, cash, ROI, payback, BEP, runway, capacity and risk. Scenarios = assumptions.')),
        A.btn('ghost', L('Scenario Builder', 'Scenario Builder'), 'zap', { go: 'CFO-005' }), P.fresh({ src: L('basis ledger ' + cmp.base.p + ' + asumsi', 'ledger base ' + cmp.base.p + ' + assumptions'), kind: 'snapshot' })) +
        P.deskOnly() + '<div class="cf10s-tgs"><span>' + t(L('Pilih maks. 3:', 'Pick up to 3:')) + '</span>' + all.map(function (s) { return tog(s.id); }).join('') + '</div>' +
        '<div class="hide-m">' + card(L('Perbandingan', 'Comparison'), tbl, { icon: 'columns', count: cols.length - 1 }) + '</div><div class="hide-d hide-t">' + cards + '</div>' +
        note(t(L('Kolom "Saat ini" memakai fakta ledger ' + cmp.base.p + '. Kolom skenario memakai asumsi input; capex tetap butuh persetujuan Owner lewat PO.', 'The "Current" column uses ledger facts for ' + cmp.base.p + '. Scenario columns use input assumptions; capex still needs Owner approval through a PO.')), 'help');
    }
  };

  /* ================= CFO-007 Recommended Actions ================= */
  function decideDlg(id) {
    var a = (F.actions(cx()) || []).filter(function (x) { return x.id === id; })[0]; if (!a) return;
    var ppl = [[a.owner, [F.empName(a.owner), F.empName(a.owner)]]].concat((H.peopleOpts() || []).filter(function (o) { return o[0] !== a.owner; }));
    dlg({ title: L('Jadikan keputusan', 'Make it a decision'), icon: 'flag', ok: L('Buat keputusan', 'Create decision'), sub: t(a.n) + ' · ' + t(a.impact),
      body: '<div class="g2-10">' + fld(L('Owner', 'Owner'), sel('owner', ppl, a.owner), { req: true }) + fld(L('Jatuh tempo', 'Due date'), inp('due', new Date(new Date(F.today()).getTime() + 14 * 864e5).toISOString().slice(0, 10), { type: 'date' }), { req: true }) +
        fld(L('KPI terkait', 'Linked KPI'), inp('kpi', a.kpi || 'FIN-01')) + '</div>' +
        '<fieldset class="cf10q-f"><legend>' + t(L('Juga buat di Performance OS (Fase 5)', 'Also create in the Performance OS (Phase 5)')) + '</legend>' +
        '<label class="cf10q-c"><input type="checkbox" name="race" checked><span>' + t(L('Race mingguan (terhubung goal BG-H2-01)', 'Weekly race (linked to goal BG-H2-01)')) + '</span></label>' +
        '<label class="cf10q-c"><input type="checkbox" name="r2re" checked><span>' + t(L('Item R2RE (review KPI)', 'R2RE item (KPI review)')) + '</span></label>' +
        '<label class="cf10q-c"><input type="checkbox" name="refl"><span>' + t(L('Item refleksi', 'Reflection item')) + '</span></label></fieldset>',
      onOk: function (v) { var r = F.actDecide(cx(), id, { owner: v.owner, due: v.due, kpi: v.kpi || null, race: !!v.race, r2re: !!v.r2re, refl: !!v.refl }); if (!r.ok) return r.msg;
        P.after(L('Keputusan ' + (r.act.dec || '') + ' dibuat' + (r.act.race ? ' + race ' + r.act.race : '') + '.', 'Decision ' + (r.act.dec || '') + ' created' + (r.act.race ? ' + race ' + r.act.race : '') + '.')); return true; } });
  }
  V['CFO-007'] = {
    render: function (c) {
      var acts = F.actions(cx()); if (!acts) return A.empty(L('Tidak ada akses.', 'No access.'));
      var items = F.actItems();
      function doneLine(d) { return '<span class="cf10q-d">' + A.chip('ok', L('Keputusan dibuat', 'Decision created'), 'checkc') + (d.dec ? lnk('DI-005', null, mono(d.dec)) : '') + (d.race ? ' · ' + lnk('RACE-001', null, mono(d.race)) : '') + (d.r2re ? ' · ' + lnk('RACE-003', null, 'R2RE') : '') + (d.refl ? ' · ' + t(L('Refleksi', 'Reflection')) : '') + '<small class="sub5">' + emp(d.owner) + ' · ' + t(L('jatuh tempo ', 'due ')) + dt(d.due) + '</small></span>'; }
      var list = acts.map(function (a) {
        var ev = (a.ev || []).map(function (e) { return lnk(e.s, e.rec || null, t(e.n)); }).join(' · ');
        var act = a.done ? doneLine(a.done) : (A.pbtn('cfo.act', 'primary', L('Jadikan keputusan', 'Make it a decision'), 'flag', { act: 'decide', val: a.id, cls: 'btn-sm' }) + (a.cta && a.cta.s !== 'CFO-007' ? ' ' + scrBtn(a.cta.s, a.cta.rec, a.cta.l) : ''));
        return P.rec({ title: a.n, icon: 'star', tone: a.pri === 1 ? 'crit' : 'warn', chip: A.chip(a.pri === 1 ? 'crit' : 'warn', L('Prioritas ' + a.pri, 'Priority ' + a.pri)) + (a.kpi ? ' ' + lnk('KPI-DTL-001', a.kpi, A.chip('info', L('KPI ' + a.kpi, 'KPI ' + a.kpi))) : ''),
          sig: a.why, why: [L('Owner: ' + F.empName(a.owner), 'Owner: ' + F.empName(a.owner)), L('Bukti: ' + (a.ev || []).map(function (e) { return T(e.n); }).join(', '), 'Evidence: ' + (a.ev || []).map(function (e) { return e.n[1]; }).join(', '))],
          impact: a.impact, rec: a.n, act: act + (ev ? '<small class="sub5 cf10q-ev">' + ic('link') + ev + '</small>' : '') });
      }).join('');
      return P.head(t(L('3–5 aksi teratas dengan prioritas, dampak, owner dan bukti. Insight → keputusan → aksi → race → hasil → refleksi (Fase 5).', 'Top 3–5 actions with priority, impact, owner and evidence. Insight → decision → action → race → result → reflection (Phase 5).')), A.btn('ghost', L('CFO Dashboard', 'CFO Dashboard'), 'gauge', { go: 'CFO-001' }), P.fresh({ src: L('rasio, keputusan, AR, AP & closing', 'ratios, decisions, AR, AP & close'), kind: 'mixed' })) +
        P.kpis([{ k: L('Aksi teratas', 'Top actions'), v: n0(acts.length), icon: 'star' }, { k: L('Prioritas 1', 'Priority 1'), v: n0(acts.filter(function (a) { return a.pri === 1; }).length), icon: 'alert', tone: 'crit' }, { k: L('Sudah jadi keputusan', 'Already decisions'), v: n0(items.length), icon: 'checkc', tone: items.length ? 'ok' : null, go: 'DI-005' }]) +
        '<div class="cf10q-l">' + list + '</div>' +
        card(L('Keputusan dari rekomendasi CFO', 'Decisions from CFO recommendations'), P.table(items.slice().reverse(), [
          { h: L('Aksi', 'Action'), v: function (d) { return '<b>' + t(d.n) + '</b><small class="sub5">' + esc(d.id) + ' · ' + dt(d.at) + '</small>'; } },
          { h: L('Keputusan', 'Decision'), v: function (d) { return d.dec ? lnk('DI-005', null, mono(d.dec)) : '—'; } }, { h: L('Race', 'Race'), v: function (d) { return d.race ? lnk('RACE-001', null, mono(d.race)) : '—'; } },
          { h: 'R2RE', v: function (d) { return d.r2re ? A.chip('ok', L('Ya', 'Yes')) : '—'; } }, { h: L('Refleksi', 'Reflection'), v: function (d) { return d.refl ? A.chip('ok', L('Ya', 'Yes')) : '—'; } },
          { h: L('Owner · jatuh tempo', 'Owner · due'), v: function (d) { return emp(d.owner) + '<small class="sub5">' + dt(d.due) + (d.kpi ? ' · KPI ' + esc(d.kpi) : '') + '</small>'; } }
        ], function (d) { return { t: t(d.n), r: esc(d.dec || ''), s: emp(d.owner) + ' · ' + dt(d.due) }; }, null, { empty: L('Belum ada rekomendasi yang dijadikan keputusan.', 'No recommendation has become a decision yet.') }), { icon: 'filecheck', count: items.length });
    },
    act: { decide: function (el) { decideDlg(el.getAttribute('data-val')); } }
  };
})();
