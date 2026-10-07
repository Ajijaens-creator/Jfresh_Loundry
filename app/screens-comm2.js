/* JFRESH OS — Phase 6 screens (part 2): NP-04 Contracts (CONTRACT-001 … 004), NP-05 Rate Cards
   (RATE-001 … 003), NP-06 SLA (SLA-001, 002) and NP-07 Documents & History (DOC-001, HISTORY-001).
   Contracts and rate cards are versioned: a change always creates a new version that goes to the
   approval inbox; old versions and the invoices priced on them never change (§19, §26). */
(function () {
  var A = window.JFAPP, M = window.JFCOMM, H = A && A.P5, P = A && A.P6;
  if (!A || !M || !H || !P) return;
  var V = A.V, T = A.T, L = A.L, t = A.t, esc = A.esc, ic = A.ic, can = A.can, fmt = A.fmt, href = A.href;
  var open = H.open, lnk = H.lnk, pct = H.pct, rpj = H.rpj, tabs = H.tabs, card = H.card, kv = H.kv, note = H.note, tile = H.tile, tiles = H.tiles, dlg = H.dlg, fld = H.fld, inp = H.inp, sel = H.sel, area = H.area, num = H.num;
  var cx = P.cx, dt = P.dt, dts = P.dts, ctrSt = P.ctrSt, rcSt = P.rcSt, aprSt = P.aprSt, slaC = P.slaC, left = P.left, lock = P.lock, price = P.price, rpFull = P.rpFull, n0 = P.n0, emp = P.emp, cname = P.cname, pname = P.pname, sname = P.sname;
  var clLink = P.clLink, prLink = P.prLink, ctrLink = P.ctrLink, rcLink = P.rcLink, after = P.after, fail = P.fail, vals = P.vals, opts = P.opts, clientOpts = P.clientOpts, propOpts = P.propOpts, amOpts = P.amOpts, checks = P.checks, more = P.more, mob = P.mob, noEditOnPhone = P.noEditOnPhone, timeline = P.timeline;

  function stOpts(map) { return Object.keys(map).map(function (k) { return [k, map[k][0]]; }); }
  function propsTxt(list) { return (list || []).map(function (p) { return pname(p); }).join(', ') || '—'; }
  function period(a, b) { return dts(a) + ' – ' + dts(b); }
  function errBox() { return '<p class="dlg5-e" role="alert" id="f6-e"></p>'; }
  function showErr(r) { var e = document.getElementById('f6-e'); if (e) e.textContent = T(r && r.msg ? r.msg : M.MSG.invalid); else fail(r); }
  function pendingFor(rec, kinds) { return M.approvals(cx(), { st: 'pending' }).filter(function (a) { return a.rec === rec && (!kinds || kinds.indexOf(a.kind) >= 0); }); }
  function aprNote(list) {
    if (!list.length) return '';
    return note(list.map(function (a) { return '<b>' + esc(a.id) + '</b> · ' + t(M.APR_KINDS[a.kind].n) + (a.svc ? ' ' + sname(a.svc) : '') + ': ' + esc(String(T(a.from == null ? '—' : a.from))) + ' → <b>' + esc(String(T(a.to))) + '</b>'; }).join('<br>') +
      (open('APPROVAL-001') ? ' · <a class="lnk5" href="' + href('APPROVAL-001', null, { id: list[0].id }) + '">' + t(L('Buka inbox persetujuan', 'Open the approval inbox')) + '</a>' : ''), 'hourglass', 'info');
  }

  /* ================= NP-04 · CONTRACT-001 Contract List ================= */
  V['CONTRACT-001'] = {
    render: function (c) {
      var q = c.q, c0 = cx(), all = M.contracts(c0), list = M.contracts(c0, { cl: q.cl, st: q.st, prop: q.prop, q: q.q });
      var n = function (s) { return all.filter(function (x) { return M.ctrStatus(x) === s; }).length; };
      var inReview = M.contractNos().filter(function (no) { var v = M.contractVersions(no); return M.canSeeClient(c0, v[0].cl) && v.some(function (x) { return x.status === 'review'; }); }).length;
      var exp90 = all.filter(function (x) { var l = M.days(M.TODAY, x.end); return l >= 0 && l <= 90 && ['active', 'expiring'].indexOf(M.ctrStatus(x)) >= 0; }).length;
      var fb = A.filters([{ k: 'cl', l: L('Klien', 'Client'), opts: clientOpts() }, { k: 'prop', l: 'Property', opts: propOpts(q.cl) }, { k: 'st', l: 'Status', opts: stOpts(M.CTR_ST) }],
        { search: L('Cari nomor kontrak, klien, property', 'Search contract no., client, property'), force: true });
      return A.pageHead(null, t(L('Setiap perubahan kontrak menjadi versi baru. Versi lama tetap tersimpan untuk transaksi historis.', 'Every contract change becomes a new version. Old versions stay for historical transactions.')), mob() ? '' : A.pbtn('com.contract.create', 'primary', L('Buat Kontrak', 'Create Contract'), 'plus', { go: 'CONTRACT-003' })) +
        tiles([
          tile({ k: L('Kontrak aktif', 'Active contracts'), v: n('active') + n('expiring'), s: n('approved') + ' ' + t(L('disetujui, belum mulai', 'approved, not started')), href: H.qhref({ st: 'active' }) }),
          tile({ k: L('Berakhir ≤ 90 hari', 'Ending ≤ 90 days'), v: exp90, s: t(L('perlu renewal', 'need renewal')), tone: exp90 ? 'warn' : '', href: open('RENEW-001') ? href('RENEW-001') : null }),
          tile({ k: L('Menunggu persetujuan', 'Awaiting approval'), v: inReview, s: t(L('versi dalam review', 'versions in review')), tone: inReview ? 'info' : '', href: open('APPROVAL-001') ? href('APPROVAL-001', null, { kind: 'contract' }) : null }),
          tile({ k: L('Berakhir', 'Expired'), v: n('expired'), s: t(L('tanpa kontrak pengganti', 'without a replacement')), tone: n('expired') ? 'crit' : '', href: H.qhref({ st: 'expired' }) })
        ], 'tls5-4') +
        card(L('Daftar Kontrak', 'Contract List'), fb + A.list(list, [
          { h: L('No. kontrak', 'Contract no.'), v: function (x) { return '<b class="mono6">' + esc(x.no) + '</b><small class="sub5">v' + x.v + ' · ' + t(M.RENEW[x.renew]) + '</small>'; } },
          { h: L('Klien', 'Client'), v: function (x) { return cname(x.cl); } },
          { h: 'Property', v: function (x) { return x.props.length > 2 ? x.props.length + ' property' : propsTxt(x.props); } },
          { h: L('Periode', 'Period'), v: function (x) { return period(x.start, x.end); } },
          { h: L('Sisa', 'Left'), v: function (x) { var s = M.ctrStatus(x); return ['active', 'expiring', 'expired'].indexOf(s) >= 0 ? left(M.days(M.TODAY, x.end)) : '—'; } },
          { h: L('Termin', 'Terms'), cls: 'r', v: function (x) { return 'Net ' + x.terms; } },
          { h: L('Pemilik', 'Owner'), v: function (x) { return emp(x.owner); } },
          { h: 'Status', v: function (x) { return ctrSt(x) + (M.contractVersions(x.no).some(function (y) { return y.status === 'review'; }) && x.status !== 'review' ? ' ' + A.chip('info', L('Versi baru di review', 'New version in review'), 'hourglass') : ''); } }
        ], function (x) { return { t: esc(x.no) + ' · ' + cname(x.cl), s: period(x.start, x.end) + ' · v' + x.v + ' · ' + propsTxt(x.props), chip: ctrSt(x) }; }, function (x) { return href('CONTRACT-002', x.no); },
          { dense: true, empty: q.q || q.st || q.cl ? L('Tidak ada kontrak yang cocok dengan filter.', 'No contract matches the filter.') : L('Belum ada kontrak aktif.', 'No active contract yet.') }), { icon: 'contract', count: list.length });
    }
  };

  /* ================= NP-04 · CONTRACT-002 Contract Detail ================= */
  var FLOW = ['draft', 'review', 'approved', 'active', 'expiring', 'expired'];
  function lifecycle(s) {
    var i0 = FLOW.indexOf(s), side = i0 < 0;
    return '<ol class="stp6" aria-label="' + t(L('Siklus kontrak', 'Contract lifecycle')) + '">' + FLOW.map(function (k, i) {
      var cls = side ? '' : i < i0 ? 'done' : i === i0 ? 'now' : '';
      return '<li class="' + cls + '"' + (i === i0 ? ' aria-current="step"' : '') + '><span class="stp6-n">' + (cls === 'done' ? ic('check') : i + 1) + '</span><span>' + t(M.CTR_ST[k][0]) + '</span></li>';
    }).join('') + (side ? '<li class="now stp6-x"><span class="stp6-n">' + ic('flag') + '</span><span>' + t(M.CTR_ST[s][0]) + '</span></li>' : '') + '</ol>';
  }
  function fieldVal(c, k) {
    if (k === 'credit' && !can('com.finance.view')) return lock();
    if (k === 'rc') return c.rc ? (can('com.rate.view') ? rcLink(c.rc) : esc(c.rc) + ' ' + lock(L('Harga hanya untuk tim komersial dan finance', 'Pricing is for the commercial and finance team only'))) : '—';
    if (k === 'sla') return c.sla ? lnk('SLA-002', c.sla, esc(c.sla)) : '—';
    if (k === 'props') return c.props.map(function (p) { return prLink(p); }).join(', ');
    if (k === 'attach') return (c.attach || []).length ? c.attach.map(function (d) { return open('DOC-001') ? '<a class="lnk5" href="' + href('DOC-001', null, { q: d }) + '">' + ic('file') + esc(d) + '</a>' : esc(d); }).join(' ') : '—';
    if (k === 'start' || k === 'end') return dt(c[k]);
    return esc(M.fmtField(k, c[k]));
  }
  V['CONTRACT-002'] = {
    title: function (rec) { return rec || L('Detail Kontrak', 'Contract Detail'); },
    render: function (c) {
      var no = c.rec || 'CTR-2026-001', vs = M.contractVersions(no);
      if (!vs.length) return A.stateCard('empty', L('Kontrak tidak ditemukan.', 'Contract not found.'), A.backBtn());
      if (!M.canSeeClient(cx(), vs[0].cl)) return A.stateCard('noperm', M.MSG.scope, A.backBtn());
      var cur = M.contract(no), x = c.q.v ? M.contractV(no, c.q.v) || cur : cur, s = M.ctrStatus(x), rn = M.renewalCard(no), review = vs.filter(function (y) { return y.status === 'review'; })[0];
      var acts = [];
      if (!mob() && can('com.contract.edit') && !review && ['active', 'expiring', 'approved', 'draft', 'returned'].indexOf(M.ctrStatus(cur)) >= 0) acts.push(A.btn('primary', x.status === 'draft' ? L('Ubah draft', 'Edit draft') : L('Buat versi baru', 'Create new version'), 'edit', { go: 'CONTRACT-003', rec: no, cls: 'btn-sm' }));
      if (vs.length > 1) acts.push(A.btn('ghost', L('Bandingkan versi', 'Compare versions'), 'scale', { go: 'CONTRACT-004', rec: no, cls: 'btn-sm' }));
      (M.CTR_FLOW[s] || []).forEach(function (to) {
        var need = to === 'approved' || to === 'active' ? 'com.contract.approve' : 'com.contract.edit';
        if (!can(need) || (x !== cur && x.status !== 'draft')) return;
        var lbl = { review: [L('Kirim untuk review', 'Send for review'), 'filecheck'], approved: [L('Setujui', 'Approve'), 'check'], active: [L('Aktifkan', 'Activate'), 'play'], terminated: [L('Akhiri kontrak', 'Terminate'), 'ban'], archived: [L('Arsipkan draft', 'Archive draft'), 'trash'], draft: [L('Kembalikan ke draft', 'Back to draft'), 'arrowl'] }[to];
        if (lbl) acts.push(A.btn(to === 'terminated' ? 'ghost' : 'ghost', lbl[0], lbl[1], { act: 'st', val: x.v + '|' + to, cls: 'btn-sm' + (to === 'terminated' ? ' btn6-crit' : '') }));
      });
      if (can('com.contract.edit') && ['active', 'expiring'].indexOf(s) >= 0) acts.push(A.btn('ghost', L('Ajukan syarat khusus', 'Request special term'), 'star', { act: 'special', cls: 'btn-sm' }));
      if (can('com.renewal.manage') && rn && !rn.r && rn.left <= 120 && ['active', 'expiring', 'expired'].indexOf(s) >= 0) acts.push(A.btn('ghost', L('Mulai renewal', 'Start renewal'), 'refresh', { act: 'rnwStart', val: no, cls: 'btn-sm' }));
      var head = '<section class="card c6-hd"><div class="c6-hd-m"><span class="av6 av6-l" aria-hidden="true">' + ic('contract') + '</span><div class="c6-hd-t"><h1><span class="mono6">' + esc(no) + '</span> ' + ctrSt(s) + '</h1>' +
        '<p><span class="tg6">v' + x.v + (x === cur ? ' · ' + t(L('berlaku', 'in force')) : '') + '</span><span class="tg6">' + t(M.RENEW[x.renew]) + '</span>' + clLink(x.cl) + '</p></div>' +
        '<div class="c6-hd-h">' + (['active', 'expiring', 'expired'].indexOf(s) >= 0 ? left(M.days(M.TODAY, x.end)) : '') + '</div></div>' + lifecycle(s) +
        kv([[L('Periode', 'Period'), period(x.start, x.end)], [L('Berlaku sejak', 'Effective from'), dt(x.eff)], [L('Pemilik kontrak', 'Contract owner'), emp(x.owner)], ['Approver', emp(x.approver) + (x.apprBy ? ' · ' + A.chip('ok', L('disetujui', 'approved'), 'check') : '')]]) +
        (acts.length ? '<div class="c6-hd-a">' + acts.join('') + '</div>' : '') + '</section>';
      var warn = x !== cur ? note(t(L('Anda melihat versi lama v' + x.v + '. Versi yang berlaku: ', 'You are viewing old version v' + x.v + '. Version in force: ')) + '<a class="lnk5" href="' + href('CONTRACT-002', no) + '">v' + cur.v + '</a>', 'history', 'warn') : '';
      var pend = review ? note(t(L('Versi v' + review.v + ' menunggu persetujuan: ', 'Version v' + review.v + ' is waiting for approval: ')) + esc(T(review.reason)) + (vs.length > 1 ? ' · <a class="lnk5" href="' + href('CONTRACT-004', no, { a: cur.v, b: review.v }) + '">' + t(L('Lihat perubahan', 'See the changes')) + '</a>' : ''), 'hourglass', 'info') : '';
      var terms = card(L('Isi kontrak', 'Contract terms'), kv(M.CTR_FIELDS.map(function (f) { return [f[1], fieldVal(x, f[0])]; })), { icon: 'file' });
      var linked = card(L('Terhubung', 'Linked'), kv([
        ['Rate Card', x.rc ? (can('com.rate.view') ? rcLink(x.rc) + ' ' + rcSt(M.rateCard(x.rc)) : lock()) : '—'],
        ['SLA', x.sla ? lnk('SLA-002', x.sla, esc(x.sla)) + ' · ' + (M.state().sla.filter(function (r) { return r.id === x.sla; })[0] || { tat: '—' }).tat + ' ' + t(L('jam', 'h')) : '—'],
        ['Renewal', rn && rn.stage ? (open('RENEW-002') ? lnk('RENEW-002', no, t(M.STAGES.filter(function (z) { return z[0] === rn.stage; })[0][1])) : t(M.STAGES.filter(function (z) { return z[0] === rn.stage; })[0][1])) + (rn.newCtr ? ' → ' + ctrLink(rn.newCtr) : '') : '—'],
        [L('Kontak kontrak', 'Contract contact'), x.strat ? P.ctLink(x.strat) : '—']
      ]) + P.reach(M.contact(x.strat)), { icon: 'link' });
      var ver = card(L('Riwayat versi', 'Version history'), A.list(vs, [
        { h: L('Versi', 'Version'), v: function (y) { return '<b>v' + y.v + '</b>' + (y === cur ? ' ' + A.chip('ok', L('berlaku', 'in force')) : ''); } },
        { h: 'Status', v: function (y) { return ctrSt(y.status === 'active' || y.status === 'approved' ? M.ctrStatus(y) : y.status); } },
        { h: L('Berlaku', 'Effective'), v: function (y) { return dt(y.eff); } },
        { h: L('Alasan', 'Reason'), v: function (y) { return esc(T(y.reason)); } },
        { h: L('Dibuat', 'Created'), v: function (y) { return emp(y.by) + '<small class="sub5">' + dt(y.at) + '</small>'; } },
        { h: L('Disetujui', 'Approved'), v: function (y) { return y.apprBy ? emp(y.apprBy) : '—'; } }
      ], function (y) { return { t: 'v' + y.v + ' · ' + esc(T(y.reason)), s: dt(y.eff) + ' · ' + emp(y.by), chip: ctrSt(y.status === 'active' || y.status === 'approved' ? M.ctrStatus(y) : y.status) }; }, function (y) { return href('CONTRACT-002', no, y === cur ? null : { v: y.v }); }, { dense: true }), { icon: 'history', count: vs.length, right: vs.length > 1 ? more('CONTRACT-004', no, null, L('Bandingkan', 'Compare')) : '' });
      var docs = M.docs(cx(), { ctr: no, all: true });
      var docCard = can('com.doc.view') ? card(L('Dokumen', 'Documents'), docs.length ? '<ul class="ln6">' + docs.map(function (d) { return '<li>' + ic('file') + '<div><b>' + esc(d.n) + '</b> <span class="tg6">v' + d.v + '</span><small>' + esc(d.file) + ' · ' + dt(d.date) + '</small></div>' + A.chip(M.DOC_ST[d.status][1], M.DOC_ST[d.status][0]) + '</li>'; }).join('') + '</ul>' : A.empty(L('Belum ada dokumen untuk kontrak ini.', 'No document for this contract yet.')), { icon: 'file', right: more('DOC-001', null, { ctr: no }) }) : '';
      var hist = can('com.history.view') ? card(L('Riwayat kontrak', 'Contract history'), timeline(M.timeline(x.cl).filter(function (e) { return e.rec === no; }), 8), { icon: 'history', right: more('HISTORY-001', null, { cl: x.cl }) }) : '';
      return warn + pend + head + '<div class="grid2"><div>' + terms + ver + '</div><div>' + linked + docCard + hist + '</div></div>';
    },
    act: P.acts({
      st: function (el) {
        var p = el.getAttribute('data-val').split('|'), v = +p[0], to = p[1], no = A.S.rec, needR = ['terminated', 'archived', 'draft'].indexOf(to) >= 0;
        var go = function (reason) { var r = M.setContractStatus(cx(), no, v, to, reason); if (!r.ok) return r.msg; after(L('Status kontrak: ' + T(M.CTR_ST[to][0]) + '.', 'Contract status: ' + M.CTR_ST[to][0][1] + '.')); return true; };
        if (!needR && to !== 'review') { var r0 = go(); if (r0 !== true) fail({ msg: r0 }); return; }
        dlg({ title: { review: L('Kirim untuk review', 'Send for review'), terminated: L('Akhiri kontrak', 'Terminate contract'), archived: L('Arsipkan draft', 'Archive draft'), draft: L('Kembalikan ke draft', 'Back to draft') }[to], sub: esc(no) + ' v' + v, icon: 'check',
          body: needR ? fld(L('Alasan', 'Reason'), area('reason', '', L('Wajib diisi dan masuk audit trail', 'Required and written to the audit trail')), { req: true }) : note(t(L('Draft dikirim ke inbox persetujuan. Approver tidak boleh pengaju sendiri.', 'The draft goes to the approval inbox. The approver cannot be the requester.')), 'filecheck'),
          onOk: function (vv) { return go(vv.reason); } });
      },
      special: function () {
        var no = A.S.rec, cur = M.contract(no);
        dlg({ title: L('Ajukan syarat khusus', 'Request special term'), sub: esc(no), icon: 'star',
          body: fld(L('Syarat sekarang', 'Current term'), inp('from', T(cur.special) || '—', { ro: true }), { wide: true }) + fld(L('Syarat baru', 'New term'), area('to', '', L('Contoh: pickup Minggu gratis', 'Example: free Sunday pickup')), { req: true }) +
            fld(L('Tanggal berlaku', 'Effective date'), inp('eff', M.TODAY, { type: 'date' })) + fld(L('Alasan', 'Reason'), area('reason', ''), { req: true }) + fld(L('Lampiran', 'Attachment'), inp('attach', '', { ph: L('Nama file pendukung (opsional)', 'Supporting file name (optional)') })),
          onOk: function (v) { if (!v.to) return L('Isi syarat baru.', 'Enter the new term.'); var r = M.request(cx(), 'special', { cl: cur.cl, rec: no, from: T(cur.special) || '—', to: v.to, reason: L(v.reason, v.reason), eff: v.eff, attach: v.attach }); if (!r.ok) return r.msg; after(L('Syarat khusus diajukan (' + r.approval.id + ').', 'Special term requested (' + r.approval.id + ').')); return true; } });
      }
    })
  };

  /* ================= NP-04 · CONTRACT-003 Contract Editor ================= */
  V['CONTRACT-003'] = {
    title: function (rec) { return rec ? L('Versi Baru Kontrak', 'New Contract Version') : L('Buat Kontrak', 'Create Contract'); },
    render: function (c) {
      var no = c.rec, cur = no ? M.contract(no) : null, isNew = !cur;
      if (no && !cur) return A.stateCard('empty', L('Kontrak tidak ditemukan.', 'Contract not found.'), A.backBtn());
      if (isNew && !can('com.contract.create')) return A.stateCard('noperm', M.MSG.noperm, A.backBtn());
      if (!isNew && !can('com.contract.edit')) return A.stateCard('noperm', M.MSG.noperm, A.backBtn());
      if (cur && !M.canSeeClient(cx(), cur.cl)) return A.stateCard('noperm', M.MSG.scope, A.backBtn());
      if (mob()) return noEditOnPhone(L('Editor kontrak', 'The contract editor'));
      if (!isNew && M.contractVersions(no).some(function (y) { return y.status === 'review'; })) return A.stateCard('warning', L('Masih ada versi yang menunggu persetujuan. Putuskan dulu sebelum membuat versi baru.', 'A version is still waiting for approval. Decide it before creating a new version.'), A.btn('blue', L('Buka kontrak', 'Open contract'), 'contract', { go: 'CONTRACT-002', rec: no }));
      var cl = cur ? cur.cl : (c.q.cl || 'CL-07'), d = cur || { props: M.propsOf(cl).map(function (p) { return p.id; }), start: M.addDays(M.TODAY, 30), end: M.addDays(M.TODAY, 394), renew: 'manual', terms: (M.client(cl) || {}).terms || 30, credit: L('Limit sesuai master klien', 'Limit per client master'), scope: [], sla: null, rc: null, minVol: 0, pickup: L('Setiap hari', 'Daily'), cycle: 'monthly', tax: L('PPN 11%', 'VAT 11%'), special: '', notes: '', owner: (cx().employee || {}).id || 'EMP-040', approver: 'EMP-050' };
      var used = M.state().cs.filter(function (x) { return M.prop(x.prop).cl === cl; }).map(function (x) { return x.svc; });
      var svcItems = M.services().filter(function (s) { return used.indexOf(s.id) >= 0 || (d.scope || []).indexOf(s.id) >= 0; }).map(function (s) { return [s.id, [s.n, s.n]]; });
      var slaOpts = [['', L('— Pilih SLA —', '— Choose SLA —')]].concat(M.slaRules(cx(), { cl: cl, std: true }).map(function (r) { return [r.id, [r.id + ' · ' + T(r.n) + ' · ' + r.tat + ' jam', r.id + ' · ' + r.n[1] + ' · ' + r.tat + 'h']]; }));
      var rcOpts = [['', L('— Pilih Rate Card —', '— Choose Rate Card —')]].concat(M.rateCards(cx(), { cl: cl }).map(function (r) { return [r.id, [r.id + ' · ' + r.n, r.id + ' · ' + r.n]]; }));
      var clSel = isNew ? '<div class="fb"><label class="fb-f"><span class="sr">' + t(L('Klien', 'Client')) + '</span><select data-f="cl">' + M.visibleClients(cx()).map(function (x) { return '<option value="' + x.id + '"' + (x.id === cl ? ' selected' : '') + '>' + esc(x.n) + '</option>'; }).join('') + '</select></label></div>' : '';
      return A.pageHead(null, isNew ? t(L('Draft baru. Setelah lengkap, kirim untuk review dan persetujuan.', 'New draft. When complete, send it for review and approval.')) : esc(no) + ' · v' + cur.v + ' → v' + (M.contractVersions(no)[0].v + 1) + ' · ' + t(L('versi lama tidak ditimpa; versi baru masuk inbox persetujuan.', 'the old version is not overwritten; the new version goes to the approval inbox.'))) +
        clSel + '<form class="card f6" id="f6" onsubmit="return false">' +
        '<h2 class="h5">' + ic('hotel') + t(L('Klien & property', 'Client & properties')) + '</h2><p class="sub5">' + cname(cl) + '</p>' + checks('props', M.propsOf(cl).map(function (p) { return [p.id, [p.n, p.n]]; }), d.props) +
        '<h2 class="h5">' + ic('calendar') + t(L('Periode', 'Period')) + '</h2><div class="f6-g">' + fld(L('Mulai', 'Start'), inp('start', d.start, { type: 'date' }), { req: true }) + fld(L('Berakhir', 'End'), inp('end', d.end, { type: 'date' }), { req: true }) + fld(L('Tipe perpanjangan', 'Renewal type'), sel('renew', opts(M.RENEW), d.renew)) +
        (isNew ? '' : fld(L('Berlaku sejak (versi baru)', 'Effective from (new version)'), inp('eff', M.TODAY, { type: 'date' }), { req: true, hint: t(L('Transaksi sebelum tanggal ini tetap memakai v' + cur.v + '.', 'Transactions before this date keep v' + cur.v + '.')) })) + '</div>' +
        '<h2 class="h5">' + ic('washer') + t(L('Layanan & standar', 'Services & standards')) + '</h2>' + checks('scope', svcItems, d.scope || []) + '<div class="f6-g">' + fld('SLA', sel('sla', slaOpts, d.sla)) + fld('Rate Card', can('com.rate.view') ? sel('rc', rcOpts, d.rc) : inp('rc', d.rc || '', { ro: true })) +
        fld(L('Volume minimum (kg/bulan)', 'Minimum volume (kg/month)'), inp('minVol', d.minVol, { num: true })) + fld(L('Jadwal pickup', 'Pickup schedule'), inp('pickup', T(d.pickup))) + '</div>' +
        '<h2 class="h5">' + ic('coins') + t(L('Tagihan', 'Billing')) + '</h2><div class="f6-g">' + fld(L('Termin pembayaran (hari)', 'Payment terms (days)'), inp('terms', d.terms, { num: true }), { req: true }) + fld(L('Siklus tagihan', 'Billing cycle'), sel('cycle', opts(M.CYCLE), d.cycle)) +
        fld(L('Syarat kredit', 'Credit terms'), can('com.finance.view') ? inp('credit', T(d.credit)) : lock()) + fld(L('Aturan pajak', 'Tax rule'), inp('tax', T(d.tax))) + '</div>' +
        '<h2 class="h5">' + ic('star') + t(L('Lainnya', 'Other')) + '</h2><div class="f6-g">' + fld(L('Syarat khusus', 'Special conditions'), area('special', T(d.special)), { wide: true }) + fld(L('Pemilik kontrak', 'Contract owner'), sel('owner', amOpts(), d.owner)) +
        fld('Approver', sel('approver', [['EMP-050', ['Aji Jaens · Owner', 'Aji Jaens · Owner']], ['EMP-030', ['Budi Santoso · Finance', 'Budi Santoso · Finance']]], d.approver)) + fld(L('Catatan', 'Notes'), area('notes', T(d.notes)), { wide: true }) + '</div>' +
        (isNew ? '' : fld(L('Alasan perubahan', 'Reason for change'), area('reason', '', L('Wajib. Tampil di inbox persetujuan dan timeline klien.', 'Required. Shown in the approval inbox and the client timeline.')), { req: true, wide: true })) +
        errBox() + '<div class="f6-a">' + A.backBtn('ghost') + (isNew ? A.btn('ghost', L('Simpan draft', 'Save draft'), 'file', { act: 'save', val: 'draft' }) + A.btn('primary', L('Simpan & kirim review', 'Save & send for review'), 'filecheck', { act: 'save', val: 'review' }) : A.btn('primary', L('Kirim versi baru untuk persetujuan', 'Send new version for approval'), 'filecheck', { act: 'save', val: 'version' })) + '</div></form>';
    },
    act: {
      save: function (el) {
        var mode = el.getAttribute('data-val'), f = document.getElementById('f6'), v = vals(f), no = A.S.rec, cur = no ? M.contract(no) : null, cl = cur ? cur.cl : (A.S.q.cl || 'CL-07');
        var d = { cl: cl, props: v.props || [], start: v.start, end: v.end, renew: v.renew, terms: num(v.terms), scope: v.scope || [], sla: v.sla || null, rc: v.rc || null, minVol: num(v.minVol) || 0, pickup: L(v.pickup, v.pickup), cycle: v.cycle, tax: L(v.tax, v.tax), special: v.special ? L(v.special, v.special) : '', owner: v.owner, approver: v.approver, notes: v.notes ? L(v.notes, v.notes) : '' };
        if (v.credit !== undefined) d.credit = L(v.credit, v.credit);
        if (cur) {
          var ord = function (list, base) { return list.slice().sort(function (x, y) { var i = base.indexOf(x), j = base.indexOf(y); return (i < 0 ? 999 : i) - (j < 0 ? 999 : j); }); };
          d.scope = ord(d.scope, cur.scope || []); d.props = ord(d.props, cur.props || []);
          if (cur.special && T(cur.special) === v.special) d.special = cur.special;
          if (T(cur.notes) === v.notes) d.notes = cur.notes; if (T(cur.pickup) === v.pickup) d.pickup = cur.pickup; if (T(cur.tax) === v.tax) d.tax = cur.tax; if (v.credit === undefined || T(cur.credit) === v.credit) d.credit = cur.credit;
          delete d.cl;
          var r = M.newVersion(cx(), no, d, v.reason, v.eff);
          if (!r.ok) return showErr(r);
          A.go('CONTRACT-002', no); setTimeout(function () { A.toast(L('Versi v' + r.contract.v + ' (' + r.changed + ' perubahan) menunggu persetujuan ' + r.approval.id + '.', 'Version v' + r.contract.v + ' (' + r.changed + ' changes) awaits approval ' + r.approval.id + '.')); }, 300);
          return;
        }
        var r2 = M.createContract(cx(), d);
        if (!r2.ok) return showErr(r2);
        if (mode === 'review') { var r3 = M.setContractStatus(cx(), r2.contract.no, 1, 'review'); if (!r3.ok) A.toast(r3.msg, 'warn'); }
        A.go('CONTRACT-002', r2.contract.no); setTimeout(function () { A.toast(mode === 'review' ? L('Draft ' + r2.contract.no + ' dikirim untuk review.', 'Draft ' + r2.contract.no + ' sent for review.') : L('Draft ' + r2.contract.no + ' tersimpan.', 'Draft ' + r2.contract.no + ' saved.')); }, 300);
      }
    }
  };

  /* ================= NP-04 · CONTRACT-004 Version Comparison ================= */
  V['CONTRACT-004'] = {
    title: function () { return L('Perbandingan Versi', 'Version Comparison'); },
    render: function (c) {
      var no = c.rec || 'CTR-2026-001', vs = M.contractVersions(no);
      if (!vs.length) return A.stateCard('empty', L('Kontrak tidak ditemukan.', 'Contract not found.'), A.backBtn());
      if (!M.canSeeClient(cx(), vs[0].cl)) return A.stateCard('noperm', M.MSG.scope, A.backBtn());
      if (vs.length < 2) return A.stateCard('empty', L('Belum ada versi lain untuk dibandingkan.', 'No other version to compare yet.'), A.btn('blue', L('Buka kontrak', 'Open contract'), 'contract', { go: 'CONTRACT-002', rec: no }));
      var b = +(c.q.b || vs[0].v), a = +(c.q.a || (vs.filter(function (y) { return y.v < b; })[0] || vs[1]).v), cmp = M.compare(no, a, b);
      if (!cmp) return A.stateCard('empty', L('Versi tidak ditemukan.', 'Version not found.'), A.backBtn());
      var vo = vs.map(function (y) { return [y.v, ['v' + y.v + ' · ' + T(M.CTR_ST[y.status] ? M.CTR_ST[y.status][0] : y.status), 'v' + y.v]]; });
      function vsel(k, cur) { return '<label class="fb-f"><span>' + (k === 'a' ? t(L('Lama', 'Old')) : t(L('Baru', 'New'))) + '</span><select data-f="' + k + '">' + vo.map(function (o) { return '<option value="' + o[0] + '"' + (+o[0] === cur ? ' selected' : '') + '>' + esc(T(o[1])) + '</option>'; }).join('') + '</select></label>'; }
      var only = c.q.only === '1';
      var rows = cmp.rows.filter(function (r) { return !only || r.changed; }).map(function (r) { if (r.k === 'start' || r.k === 'end') return Object.assign({}, r, { old: T(dt(r.old)), now: T(dt(r.now)) }); return r.k === 'credit' && !can('com.finance.view') ? Object.assign({}, r, { old: '•••', now: '•••' }) : r; });
      function side(v, x) { return '<div class="cv6-h"><b>v' + v.v + '</b> ' + ctrSt(v.status === 'active' || v.status === 'approved' ? M.ctrStatus(v) : v.status) + '<small>' + t(L('Berlaku ', 'Effective ')) + dt(v.eff) + ' · ' + emp(v.by) + ' · ' + dt(v.at) + '</small><small>' + esc(T(v.reason)) + '</small></div>'; }
      return A.pageHead(null, ctrLink(no) + ' · ' + cname(cmp.a.cl) + ' · <b>' + cmp.changed + '</b> ' + t(L('field berubah', 'fields changed'))) +
        '<div class="fb">' + vsel('a', a) + vsel('b', b) + '<a class="btn btn-ghost btn-sm" href="' + H.qhref({ only: only ? null : '1' }) + '" aria-pressed="' + only + '">' + ic('filter') + '<span>' + t(only ? L('Tampilkan semua field', 'Show all fields') : L('Hanya yang berubah', 'Changes only')) + '</span></a></div>' +
        '<section class="card"><div class="cv6"><div></div>' + side(cmp.a) + side(cmp.b) + '</div>' +
        '<div class="cv6-t" role="table" aria-label="' + t(L('Perbandingan field', 'Field comparison')) + '">' + rows.map(function (r) {
          return '<div class="cv6-r' + (r.changed ? ' cv6-ch' : '') + '" role="row"><span class="cv6-k" role="rowheader">' + t(r.n) + (r.changed ? ' <span class="tg6 tg6-b">' + t(L('berubah', 'changed')) + '</span>' : '') + '</span>' +
            '<span class="cv6-o" role="cell"><small class="hide-d hide-t">v' + a + '</small>' + esc(r.old) + '</span><span class="cv6-n" role="cell"><small class="hide-d hide-t">v' + b + '</small>' + esc(r.now) + '</span></div>';
        }).join('') + '</div></section>' +
        note(t(L('Invoice yang terbit sebelum tanggal berlaku versi baru tetap memakai versi lama.', 'Invoices issued before the new version\'s effective date keep the old version.')), 'history');
    }
  };

  /* ================= NP-05 · RATE-001 Rate Card List ================= */
  V['RATE-001'] = {
    render: function (c) {
      var q = c.q, c0 = cx(), all = M.rateCards(c0), list = M.rateCards(c0, { cl: q.cl, st: q.st, q: q.q });
      var pend = M.approvals(c0, { st: 'pending' }).filter(function (a) { return a.kind === 'rate' || a.kind === 'discount'; });
      var overlaps = all.filter(function (r) { return M.rateOverlaps(r).length; });
      var n = function (s) { return all.filter(function (r) { return M.rcStatus(r) === s; }).length; };
      var fb = A.filters([{ k: 'cl', l: L('Klien', 'Client'), opts: clientOpts() }, { k: 'st', l: 'Status', opts: stOpts(M.RC_ST) }], { search: L('Cari Rate Card, klien', 'Search Rate Card, client'), force: true });
      return A.pageHead(null, t(L('Harga master = standar JFRESH. Harga klien = harga kontrak per klien / property. Invoice selalu memakai tarif yang berlaku pada tanggal transaksi.', 'Master price = the JFRESH standard. Client rate = the contract price per client / property. Invoices always use the rate valid on the transaction date.'))) +
        tiles([
          tile({ k: L('Rate Card aktif', 'Active Rate Cards'), v: n('active') + n('expiring'), s: n('scheduled') + ' ' + t(L('terjadwal', 'scheduled')) }),
          tile({ k: L('Segera berakhir', 'Expiring'), v: n('expiring'), s: t(L('≤ 30 hari', '≤ 30 days')), tone: n('expiring') ? 'warn' : '', href: H.qhref({ st: 'expiring' }) }),
          tile({ k: L('Perubahan menunggu', 'Changes pending'), v: pend.length, s: t(L('tarif & diskon', 'rates & discounts')), tone: pend.length ? 'info' : '', href: open('APPROVAL-001') ? href('APPROVAL-001', null, { kind: 'rate' }) : null }),
          tile({ k: L('Tumpang tindih', 'Overlaps'), v: overlaps.length, s: t(L('tanpa aturan prioritas', 'without a priority rule')), tone: overlaps.length ? 'crit' : '' })
        ], 'tls5-4') +
        (overlaps.length ? note(t(L('Ada tarif aktif yang tumpang tindih tanpa aturan prioritas: ', 'Active rates overlap without a priority rule: ')) + overlaps.map(function (r) { return rcLink(r.id); }).join(', '), 'alert', 'crit') : '') +
        card(L('Daftar Rate Card', 'Rate Card List'), fb + A.list(list, [
          { h: 'Rate Card', v: function (r) { return '<b>' + esc(r.n) + '</b><small class="sub5">' + esc(r.id) + ' · v' + r.v + (r.prio ? ' · ' + t(L('prioritas ', 'priority ')) + r.prio : '') + '</small>'; } },
          { h: L('Klien', 'Client'), v: function (r) { return cname(r.cl); } },
          { h: L('Berlaku untuk', 'Applies to'), v: function (r) { return r.prop ? pname(r.prop) : t(L('Semua property', 'All properties')); } },
          { h: L('Kontrak', 'Contract'), v: function (r) { return r.ctr ? '<span class="mono6">' + esc(r.ctr) + '</span>' : '—'; } },
          { h: L('Masa berlaku', 'Validity'), v: function (r) { return period(r.eff, r.exp); } },
          { h: L('Layanan', 'Services'), cls: 'r num', v: function (r) { return r.lines.length; } },
          { h: 'Status', v: function (r) { return rcSt(r) + (pend.some(function (a) { return a.rec === r.id; }) ? ' ' + A.chip('info', L('Ada pengajuan', 'Change pending'), 'hourglass') : ''); } }
        ], function (r) { return { t: esc(r.n), s: (r.prop ? pname(r.prop) : t(L('Semua property', 'All properties'))) + ' · ' + period(r.eff, r.exp) + ' · v' + r.v, chip: rcSt(r) }; }, function (r) { return href('RATE-002', r.id); }, { dense: true, empty: L('Belum ada Rate Card.', 'No Rate Card yet.') }), { icon: 'tag', count: list.length }) +
        (open('SERVICE-001') ? note(t(L('Mengubah harga master tidak mengubah harga klien yang sudah disetujui. ', 'Changing a master price does not change approved client rates. ')) + '<a class="lnk5" href="' + href('SERVICE-001') + '">' + t(L('Buka Katalog Layanan', 'Open the Service Catalog')) + '</a>', 'info') : '');
    }
  };

  /* ================= NP-05 · RATE-002 Rate Card Detail ================= */
  function lineRows(r) {
    return r.lines.map(function (l) { var sv = M.service(l.svc) || { n: l.svc, unit: 'kg', price: null }, fin = M.lineFinal(l); return { l: l, sv: sv, fin: fin, vs: sv.price ? Math.round((fin - sv.price) / sv.price * 1000) / 10 : null }; });
  }
  V['RATE-002'] = {
    title: function (rec) { return rec || L('Detail Rate Card', 'Rate Card Detail'); },
    render: function (c) {
      var id = c.rec || 'RC-07', vs = M.rcVersions(id);
      if (!vs.length) return A.stateCard('empty', L('Rate Card tidak ditemukan.', 'Rate Card not found.'), A.backBtn());
      if (!M.canSeeClient(cx(), vs[0].cl)) return A.stateCard('noperm', M.MSG.scope, A.backBtn());
      var cur = M.rateCard(id), r = c.q.v ? M.rcV(id, c.q.v) || cur : cur, tab = c.q.tab || 'lines', ov = M.rateOverlaps(r), pend = pendingFor(id, ['rate', 'discount']);
      var acts = (!mob() && can('com.rate.edit') ? A.btn('primary', L('Ajukan perubahan tarif', 'Request rate change'), 'edit', { go: 'RATE-003', rec: id, cls: 'btn-sm' }) : '');
      var head = '<section class="card c6-hd"><div class="c6-hd-m"><span class="av6 av6-l" aria-hidden="true">' + ic('tag') + '</span><div class="c6-hd-t"><h1>' + esc(r.n) + ' ' + rcSt(r) + '</h1>' +
        '<p><span class="tg6">' + esc(id) + ' · v' + r.v + '</span><span class="tg6">' + (r.prop ? pname(r.prop) : t(L('Semua property', 'All properties'))) + '</span>' + clLink(r.cl) + '</p></div></div>' +
        kv([[L('Masa berlaku', 'Validity'), period(r.eff, r.exp)], [L('Kontrak', 'Contract'), r.ctr ? (open('CONTRACT-002') ? ctrLink(r.ctr) : esc(r.ctr)) : '—'], [L('Prioritas', 'Priority'), r.prio ? t(L('Tinggi (' + r.prio + ') · menimpa Rate Card klien', 'High (' + r.prio + ') · overrides the client card')) : t(L('Standar', 'Standard'))], ['Approver', emp(r.approver)], [L('Alasan versi', 'Version reason'), esc(T(r.reason))], [L('Mata uang', 'Currency'), esc(r.cur || 'IDR')]]) +
        (acts ? '<div class="c6-hd-a">' + acts + '</div>' : '') + '</section>';
      var warn = (r !== cur ? note(t(r.v > cur.v ? L('Anda melihat versi berikutnya v' + r.v + '. ', 'You are viewing upcoming version v' + r.v + '. ') : L('Anda melihat versi lama v' + r.v + '. ', 'You are viewing old version v' + r.v + '. ')) + '<a class="lnk5" href="' + href('RATE-002', id) + '">' + t(L('Buka versi berlaku', 'Open the version in force')) + '</a>', 'history', 'warn') : '') +
        vs.filter(function (y) { return M.rcStatus(y) === 'scheduled' && y !== r; }).map(function (y) { return note(t(L('Versi v' + y.v + ' terjadwal berlaku ', 'Version v' + y.v + ' takes effect on ')) + dt(y.eff) + ' · ' + esc(T(y.reason)) + ' · <a class="lnk5" href="' + href('RATE-002', id, { v: y.v }) + '">' + t(L('Lihat', 'View')) + '</a>', 'calendar', 'info'); }).join('') +
        (ov.length ? note(t(L('Tumpang tindih dengan ', 'Overlaps with ')) + ov.map(function (o) { return rcLink(o.rc) + ' v' + o.v + ' (' + o.svcs.map(M.svcName).join(', ') + ')'; }).join(', ') + t(L(' tanpa aturan prioritas. Tentukan prioritas sebelum invoice berikutnya.', ' without a priority rule. Set a priority before the next invoice.')), 'alert', 'crit') : '') + aprNote(pend);
      var body = '';
      if (tab === 'lines') {
        var rows = lineRows(r);
        body = card(L('Baris tarif', 'Rate lines'), A.list(rows, [
          { h: L('Layanan', 'Service'), v: function (x) { return '<b>' + esc(x.sv.n) + '</b><small class="sub5">' + esc(x.l.svc) + ' · ' + esc(T(x.l.item) || T(x.l.cat) || t(L('Semua item', 'All items'))) + '</small>'; } },
          { h: L('Unit', 'Unit'), v: function (x) { return esc(x.sv.unit); } },
          { h: 'Master', cls: 'r num', v: function (x) { return rpFull(x.sv.price); } },
          { h: L('Harga klien', 'Client rate'), cls: 'r num', v: function (x) { return rpFull(x.l.client); } },
          { h: L('Diskon', 'Discount'), cls: 'r num', v: function (x) { return x.l.disc ? x.l.disc + '%' : '—'; } },
          { h: 'Surcharge', cls: 'r num', v: function (x) { return x.l.sur ? rpFull(x.l.sur) : '—'; } },
          { h: L('Min. charge', 'Min. charge'), cls: 'r num', v: function (x) { return x.l.minCharge ? rpFull(x.l.minCharge) : '—'; } },
          { h: L('Harga final', 'Final price'), cls: 'r num', v: function (x) { return '<b>' + rpFull(x.fin) + '</b>'; } },
          { h: L('vs master', 'vs master'), cls: 'r', v: function (x) { return x.vs == null ? '—' : H.delta(x.vs, { u: '%' }); } },
          { h: L('Pajak', 'Tax'), cls: 'r num', v: function (x) { return (x.l.tax == null ? 11 : x.l.tax) + '%'; } }
        ], function (x) { return { t: esc(x.sv.n), r: rpFull(x.fin), s: t(L('Master ', 'Master ')) + rpFull(x.sv.price) + (x.l.disc ? ' · ' + t(L('diskon ', 'discount ')) + x.l.disc + '%' : '') + ' · ' + esc(x.sv.unit) }; }, null, { dense: true }), { icon: 'tag', count: rows.length }) +
          note(t(L('Harga final = harga klien − diskon + surcharge. Minimum charge berlaku per order.', 'Final price = client rate − discount + surcharge. Minimum charge applies per order.')), 'info');
      } else if (tab === 'hist') {
        var h = M.rateHistory(id);
        body = card(L('Riwayat perubahan tarif', 'Rate change history'), A.list(h, [
          { h: L('Layanan', 'Service'), v: function (x) { return '<b>' + sname(x.svc) + '</b>'; } },
          { h: L('Lama', 'Old'), cls: 'r num', v: function (x) { return rpFull(x.from); } },
          { h: L('Baru', 'New'), cls: 'r num', v: function (x) { return '<b>' + rpFull(x.to) + '</b>' + (x.disc != null ? '<small class="sub5">' + t(L('diskon ', 'discount ')) + x.disc + '%</small>' : ''); } },
          { h: L('Selisih', 'Difference'), cls: 'r', v: function (x) { return x.from ? H.delta(Math.round((x.to - x.from) / x.from * 1000) / 10, { u: '%' }) : '—'; } },
          { h: L('Berlaku', 'Effective'), v: function (x) { return dt(x.eff); } },
          { h: L('Alasan', 'Reason'), v: function (x) { return esc(T(x.reason)); } },
          { h: L('Diajukan / disetujui', 'Requested / approved'), v: function (x) { return emp(x.by) + ' / ' + emp(x.appr) + '<small class="sub5">' + dt(x.at) + '</small>'; } }
        ], function (x) { return { t: sname(x.svc) + ' · ' + rpFull(x.from) + ' → ' + rpFull(x.to), s: t(L('Berlaku ', 'Effective ')) + dt(x.eff) + ' · ' + esc(T(x.reason)) }; }, null, { dense: true, empty: L('Belum ada perubahan tarif.', 'No rate change yet.') }), { icon: 'history', count: h.length });
      } else if (tab === 'inv') {
        var inv = M.invoiceLines(r.cl).filter(function (l) { return l.rc === id; });
        body = card(L('Harga invoice historis', 'Historical invoice pricing'), A.list(inv, [
          { h: 'Invoice', v: function (l) { return '<b class="mono6">' + esc(l.inv) + '</b>'; } },
          { h: L('Tanggal', 'Date'), v: function (l) { return dt(l.date); } },
          { h: 'Property', v: function (l) { return pname(l.prop); } },
          { h: L('Layanan', 'Service'), v: function (l) { return sname(l.svc); } },
          { h: L('Qty', 'Qty'), cls: 'r num', v: function (l) { return n0(l.qty); } },
          { h: L('Tarif', 'Rate'), cls: 'r num', v: function (l) { return rpFull(l.rate); } },
          { h: L('Versi', 'Version'), v: function (l) { return '<span class="tg6">' + esc(l.rc) + ' v' + l.v + '</span>'; } },
          { h: L('Nilai', 'Amount'), cls: 'r num', v: function (l) { return rpFull(l.amount); } }
        ], function (l) { return { t: esc(l.inv) + ' · ' + sname(l.svc), r: rpFull(l.amount), s: dt(l.date) + ' · ' + n0(l.qty) + ' × ' + rpFull(l.rate) + ' · v' + l.v }; }, null, { dense: true, empty: L('Belum ada invoice dengan Rate Card ini.', 'No invoice with this Rate Card yet.') }), { icon: 'invoice', count: inv.length }) +
          note(t(L('Setiap baris memakai versi tarif yang berlaku pada tanggal transaksinya. Invoice lama tidak pernah dihitung ulang.', 'Each line uses the rate version valid on its transaction date. Old invoices are never recalculated.')), 'history');
      } else {
        body = card(L('Versi Rate Card', 'Rate Card versions'), A.list(vs, [
          { h: L('Versi', 'Version'), v: function (y) { return '<b>v' + y.v + '</b>' + (y === cur ? ' ' + A.chip('ok', L('berlaku', 'in force')) : ''); } },
          { h: L('Masa berlaku', 'Validity'), v: function (y) { return period(y.eff, y.exp); } },
          { h: L('Alasan', 'Reason'), v: function (y) { return esc(T(y.reason)); } },
          { h: L('Dibuat', 'Created'), v: function (y) { return emp(y.by) + '<small class="sub5">' + dt(y.at) + '</small>'; } },
          { h: 'Status', v: function (y) { return rcSt(y); } }
        ], function (y) { return { t: 'v' + y.v + ' · ' + period(y.eff, y.exp), s: esc(T(y.reason)), chip: rcSt(y) }; }, function (y) { return href('RATE-002', id, y === cur ? null : { v: y.v }); }, { dense: true }), { icon: 'layers', count: vs.length });
      }
      return warn + head + tabs([['lines', L('Tarif', 'Rates'), 'tag'], ['hist', L('Riwayat', 'History'), 'history'], ['inv', L('Invoice historis', 'Historical invoices'), 'invoice'], ['ver', L('Versi', 'Versions'), 'layers', vs.length]], tab, 'tab', { def: 'lines' }) + body;
    }
  };

  /* ================= NP-05 · RATE-003 Rate Editor ================= */
  function preview(f) {
    var box = document.getElementById('rp6'); if (!box || !f) return;
    var id = A.S.rec || 'RC-07', kind = A.S.q.kind || 'rate', svc = f.querySelector('[name=svc]').value, cur = M.rateCard(id), line = cur.lines.filter(function (l) { return l.svc === svc; })[0], sv = M.service(svc);
    var to = num(f.querySelector('[name=to]').value), eff = f.querySelector('[name=eff]').value, vol = M.svcVolume(cur, svc), html = '';
    if (kind === 'rate') {
      var chk = to ? M.rateChangeCheck(id, svc, to, eff) : null, from = line ? line.client : null, diff = from && to ? Math.round((to - from) / from * 1000) / 10 : null;
      html = kv([[L('Tarif lama', 'Old rate'), from ? rpFull(from) : t(L('Belum ada (baris baru)', 'None (new line)'))], [L('Tarif baru', 'New rate'), to ? '<b>' + rpFull(to) + '</b>' : '—'], [L('Selisih', 'Difference'), diff == null ? '—' : H.delta(diff, { u: '%' })], [L('vs master', 'vs master'), sv && to ? H.delta(Math.round((to - sv.price) / sv.price * 1000) / 10, { u: '%' }) + ' <small class="sub5">' + rpFull(sv.price) + '</small>' : '—'], [L('Dampak revenue / bulan', 'Revenue impact / month'), from && to ? H.delta((to - from) * vol / 1e6, { u: ' jt', fmt: function (d) { return fmt.num(d, 1); } }) + ' <small class="sub5">' + n0(vol) + ' ' + esc(sv.unit) + '</small>' : '—']]) +
        (chk && !chk.ok ? note(t(chk.msg), 'alert', 'crit') : '') + (chk && chk.ok && chk.warn.length ? note(chk.warn.map(t).join(' '), 'alert', 'warn') : '');
    } else {
      var d0 = line ? line.disc || 0 : 0, fin = line && to != null ? Math.round(line.client * (1 - to / 100) + (line.sur || 0)) : null;
      html = kv([[L('Diskon lama', 'Old discount'), d0 + '%'], [L('Diskon baru', 'New discount'), to != null && !isNaN(to) ? '<b>' + to + '%</b>' : '—'], [L('Harga final baru', 'New final price'), fin ? rpFull(fin) + ' <small class="sub5">' + t(L('dari ', 'from ')) + rpFull(line ? M.lineFinal(line) : null) + '</small>' : '—'], [L('Dampak revenue / bulan', 'Revenue impact / month'), line && to != null && !isNaN(to) ? H.delta(-line.client * (to - d0) / 100 * vol / 1e6, { u: ' jt', fmt: function (d) { return fmt.num(d, 1); } }) : '—']]) +
        (!line ? note(t(L('Layanan ini belum ada di Rate Card. Ajukan tarifnya dulu.', 'This service is not on the Rate Card yet. Request its rate first.')), 'alert', 'warn') : '') + (to > 20 ? note(t(L('Diskon di atas 20% butuh alasan bisnis yang jelas.', 'A discount above 20% needs a clear business reason.')), 'alert', 'warn') : '');
    }
    var ov = M.rateOverlaps(cur);
    box.innerHTML = html + (ov.length ? note(t(L('Rate Card ini tumpang tindih dengan ', 'This Rate Card overlaps ')) + ov.map(function (o) { return esc(o.rc); }).join(', ') + '.', 'alert', 'crit') : '');
  }
  V['RATE-003'] = {
    title: function () { return L('Editor Tarif', 'Rate Editor'); },
    render: function (c) {
      var id = c.rec || 'RC-07', cur = M.rateCard(id);
      if (!can('com.rate.edit')) return A.stateCard('noperm', M.MSG.noperm, A.backBtn());
      if (!cur) return A.stateCard('error', M.MSG.rateSave, A.backBtn(), L('Rate Card tidak ditemukan', 'Rate Card not found'));
      if (!M.canSeeClient(cx(), cur.cl)) return A.stateCard('noperm', M.MSG.scope, A.backBtn());
      if (mob()) return noEditOnPhone(L('Editor tarif', 'The rate editor'));
      var kind = c.q.kind === 'discount' ? 'discount' : 'rate', props = cur.prop ? [cur.prop] : M.propsOf(cur.cl).map(function (p) { return p.id; });
      var used = M.state().cs.filter(function (x) { return props.indexOf(x.prop) >= 0; }).map(function (x) { return x.svc; });
      var svcs = M.services().filter(function (s) { return cur.lines.some(function (l) { return l.svc === s.id; }) || (kind === 'rate' && used.indexOf(s.id) >= 0); });
      var svc = c.q.svc && svcs.some(function (s) { return s.id === c.q.svc; }) ? c.q.svc : (svcs[0] || {}).id, line = cur.lines.filter(function (l) { return l.svc === svc; })[0];
      var effDef = M.addDays(M.TODAY, 7);
      return A.pageHead(null, rcLink(id) + ' · ' + cname(cur.cl) + ' · ' + t(L('alur: Draft → Review → Persetujuan → Berlaku', 'flow: Draft → Review → Approval → Effective'))) +
        tabs([['rate', L('Ubah tarif', 'Change rate'), 'tag'], ['discount', L('Diskon', 'Discount'), 'percent']], kind, 'kind', { seg: true, def: 'rate', label: L('Jenis perubahan', 'Change type') }) +
        '<div class="grid2"><form class="card f6" id="f6" onsubmit="return false"><div class="f6-g">' +
        fld(L('Layanan', 'Service'), sel('svc', svcs.map(function (s) { return [s.id, [s.n + (cur.lines.some(function (l) { return l.svc === s.id; }) ? '' : ' (baru)'), s.n + (cur.lines.some(function (l) { return l.svc === s.id; }) ? '' : ' (new)')]]; }), svc), { req: true }) +
        fld(kind === 'rate' ? L('Tarif baru (Rp / unit)', 'New rate (Rp / unit)') : L('Diskon baru (%)', 'New discount (%)'), inp('to', kind === 'rate' ? (line ? line.client : '') : (line ? line.disc || 0 : 0), { num: true }), { req: true }) +
        fld(L('Tanggal berlaku', 'Effective date'), inp('eff', effDef, { type: 'date' }), { req: true, hint: t(L('Tidak boleh di masa lalu dan tidak melewati ', 'Not in the past and not after ')) + dt(cur.exp) }) +
        fld(L('Lampiran pendukung', 'Supporting attachment'), inp('attach', '', { ph: L('Contoh: Proposal_Harga_2027.pdf', 'Example: Price_Proposal_2027.pdf') })) + '</div>' +
        fld(L('Alasan perubahan', 'Reason for change'), area('reason', '', L('Wajib. Contoh: penyesuaian biaya chemical', 'Required. Example: chemical cost adjustment')), { req: true, wide: true }) +
        errBox() + '<div class="f6-a">' + A.backBtn('ghost') + A.btn('ghost', L('Simpan draft', 'Save draft'), 'file', { act: 'send', val: 'draft' }) + A.btn('primary', L('Kirim untuk persetujuan', 'Send for approval'), 'filecheck', { act: 'send', val: 'send' }) + '</div></form>' +
        '<div>' + card(L('Pratinjau perubahan', 'Change preview'), '<div id="rp6" aria-live="polite"></div>', { icon: 'scale' }) +
        card(L('Tarif sekarang', 'Current rates'), '<ul class="ln6">' + cur.lines.map(function (l) { return '<li>' + ic('tag') + '<div><b>' + sname(l.svc) + '</b><small>' + rpFull(l.client) + (M.lineFinal(l) !== l.client ? (l.disc ? ' · −' + l.disc + '%' : '') + ' → ' + rpFull(M.lineFinal(l)) : '') + '</small></div></li>'; }).join('') + '</ul>', { icon: 'list' }) + '</div></div>';
    },
    after: function () {
      var f = document.getElementById('f6'); if (!f) return;
      preview(f);
      f.addEventListener('input', function () { preview(f); });
      f.querySelector('[name=svc]').addEventListener('change', function (e) {
        var id = A.S.rec || 'RC-07', line = M.rateCard(id).lines.filter(function (l) { return l.svc === e.target.value; })[0], kind = A.S.q.kind || 'rate';
        f.querySelector('[name=to]').value = kind === 'rate' ? (line ? line.client : '') : (line ? line.disc || 0 : 0); preview(f);
      });
    },
    act: {
      send: function (el) {
        var f = document.getElementById('f6'), v = vals(f), id = A.S.rec || 'RC-07', kind = A.S.q.kind || 'rate', draft = el.getAttribute('data-val') === 'draft';
        var r = kind === 'rate' ? M.requestRateChange(cx(), id, v.svc, num(v.to), v.eff, v.reason, { attach: v.attach, draft: draft }) : M.requestDiscount(cx(), id, v.svc, num(v.to), v.eff, v.reason, { attach: v.attach });
        if (!r.ok) return showErr(r);
        A.go('RATE-002', id); setTimeout(function () { A.toast(draft ? L('Draft ' + r.approval.id + ' tersimpan. Ajukan dari inbox persetujuan.', 'Draft ' + r.approval.id + ' saved. Submit it from the approval inbox.') : L('Perubahan dikirim (' + r.approval.id + '). Tarif lama tetap berlaku sampai disetujui.', 'Change sent (' + r.approval.id + '). The old rate stays until approved.')); }, 300);
      }
    }
  };

  /* ================= NP-06 · SLA-001 SLA Dashboard ================= */
  function bar(cl) { return '<span class="sb6" role="img" aria-label="' + esc(cl.pct + '%') + '"><i class="t6-' + (cl.st === 'paused' ? 'mute' : cl.lvl === 'crit' ? 'crit' : cl.lvl ? 'warn' : 'ok') + '" style="width:' + Math.min(100, cl.pct) + '%"></i><b>75</b><b>90</b></span>'; }
  function hrs(h) { var neg = h < 0, a = Math.abs(h), hh = Math.floor(a), mm = Math.round((a - hh) * 60); return (neg ? '−' : '') + hh + t(L('j ', 'h ')) + (mm ? mm + 'm' : ''); }
  function clockActs(k) {
    if (!can('com.sla.clock')) return '';
    if (k.done) return '';
    return k.paused ? A.btn('ghost', L('Lanjutkan', 'Resume'), 'play', { act: 'clk', val: k.id + '|resume', cls: 'btn-sm' }) : A.btn('ghost', L('Jeda', 'Pause'), 'clock', { act: 'clk', val: k.id + '|pause', cls: 'btn-sm' }) + A.btn('ghost', L('Selesai', 'Complete'), 'check', { act: 'clk', val: k.id + '|complete', cls: 'btn-sm' });
  }
  function clockList(list) {
    if (!list.length) return A.empty(L('Belum ada order dengan SLA berjalan.', 'No order with a running SLA yet.'));
    return '<ul class="ck6l">' + list.map(function (k) {
      var p = M.prop(k.o.prop);
      return '<li class="ck6l-i t6b-' + (k.st === 'paused' ? 'mute' : k.lvl === 'crit' ? 'crit' : k.lvl ? 'warn' : 'ok') + '"><div class="ck6l-h"><a class="lnk5" href="' + href('SLA-002', k.id) + '"><b class="mono6">' + esc(k.id) + '</b></a> ' + slaC(k.st) + '<span class="sub5">' + pname(k.o.prop) + ' · ' + sname(k.o.svc) + ' · ' + esc(T(k.o.cat)) + '</span></div>' +
        bar(k) + '<div class="ck6l-m"><span><b class="num">' + fmt.num(k.pct, 0) + '%</b> ' + t(L('terpakai', 'used')) + '</span><span>' + (k.done ? t(L('Selesai ', 'Completed ')) + H.dtt(k.done) : (k.left >= 0 ? t(L('Sisa ', 'Left ')) + hrs(k.left) : t(L('Lewat ', 'Over by ')) + hrs(-k.left))) + '</span><span>' + t(L('Target ', 'Target ')) + k.tat + t(L(' jam', 'h')) + (k.rule ? ' · ' + esc(k.rule.id) : '') + '</span><span>' + t(L('Jatuh tempo ', 'Due ')) + H.dtt(k.due) + '</span></div>' +
        (k.paused ? '<small class="sub5">' + ic('clock') + esc(T((k.o.ev.filter(function (e) { return e[0] === 'pause'; }).slice(-1)[0] || [])[2] || '')) + '</small>' : '') + '<div class="ck6l-a">' + clockActs(k) + '</div></li>';
    }).join('') + '</ul>';
  }
  function ruleScope(r) { return M.SLA_PREC.filter(function (p) { return r[p[0]]; }).map(function (p) { var k = p[0], v = r[k]; return '<span class="tg6">' + t(p[2]) + ': ' + esc(k === 'cl' ? M.clientName(v) : k === 'prop' ? M.propName(v) : k === 'svc' ? M.svcName(v) : k === 'pri' ? T(M.PRI[v]) : k === 'win' ? T(M.WIN[v]) : T(v)) + '</span>'; }).join('') || '<span class="tg6">' + t(L('Standar global', 'Global default')) + '</span>'; }
  var CLK_ACT = {
    clk: function (el) {
      var p = el.getAttribute('data-val').split('|'), id = p[0], act = p[1];
      if (act === 'pause') {
        dlg({ title: L('Jeda SLA clock', 'Pause SLA clock'), sub: esc(id), icon: 'clock', body: fld(L('Alasan jeda', 'Pause reason'), area('reason', '', L('Contoh: menunggu konfirmasi klien', 'Example: waiting for client confirmation')), { req: true }) + note(t(L('Waktu jeda tidak dihitung ke SLA dan tercatat di audit.', 'Paused time does not count toward the SLA and is audited.')), 'info'),
          onOk: function (v) { var r = M.clockAct(cx(), id, 'pause', v.reason); if (!r.ok) return r.msg; after(L('SLA clock dijeda.', 'SLA clock paused.')); return true; } });
        return;
      }
      var r = M.clockAct(cx(), id, act); if (!r.ok) return fail(r);
      after(act === 'resume' ? L('SLA clock berjalan lagi.', 'SLA clock running again.') : r.clock.st === 'done' ? L('Selesai tepat waktu.', 'Completed on time.') : L('Selesai terlambat. Tercatat di performa SLA.', 'Completed late. Recorded in SLA performance.'), r.clock.st === 'donelate' ? 'warn' : 'ok');
    }
  };
  V['SLA-001'] = {
    render: function (c) {
      var c0 = cx(), tab = c.q.tab || (mob() ? 'live' : 'live'), live = M.orders(c0, { cl: c.q.cl });
      var running = live.filter(function (k) { return !k.done; }), risk = running.filter(function (k) { return k.st === 'atrisk'; }).length, late = running.filter(function (k) { return k.st === 'late'; }).length, paused = running.filter(function (k) { return k.paused; }).length;
      var cls = M.visibleClients(c0).filter(function (x) { return x.type !== 'personal' && x.status === 'active'; }), perf = cls.map(function (x) { return { c: x, p: M.slaPerf(x.id), r: M.slaFor({ cl: x.id }).rule }; }).filter(function (x) { return x.p.n; });
      var tot = perf.reduce(function (s, x) { s.n += x.p.n; s.ok += x.p.on + x.p.risk; return s; }, { n: 0, ok: 0 }), conf = M.slaConflicts();
      var due = M.slaRules(c0).filter(function (r) { return r.reviewDue && M.days(M.TODAY, r.reviewDue) <= 14; });
      var strip = tiles([
        tile({ k: L('SLA berjalan', 'Running SLA'), v: running.length, s: paused + ' ' + t(L('dijeda', 'paused')), href: H.qhref({ tab: null }) }),
        tile({ k: 'At Risk', v: risk, s: t(L('≥ 75% waktu terpakai', '≥ 75% time used')), tone: risk ? 'warn' : '' }),
        tile({ k: 'Late', v: late, s: t(L('melewati target', 'past target')), tone: late ? 'crit' : '' }),
        tile({ k: L('On-time bulan ini', 'On-time this month'), v: tot.n ? pct(Math.round(tot.ok / tot.n * 1000) / 10) : '—', s: n0(tot.n) + ' order', href: H.qhref({ tab: 'perf' }) })
      ], 'tls5-4');
      var notes = (conf.length ? note(t(L('Aturan SLA bentrok tanpa prioritas: ', 'SLA rules conflict without precedence: ')) + conf.map(function (x) { return esc(x.a) + ' ↔ ' + esc(x.b); }).join(', '), 'alert', 'crit') : '') +
        (due.length ? note(t(L('Review SLA jatuh tempo: ', 'SLA review due: ')) + due.map(function (r) { return lnk('SLA-002', r.id, esc(r.id)) + ' (' + dt(r.reviewDue) + ')'; }).join(', '), 'calendar', 'warn') : '');
      var fb = M.isClient(c0) ? '' : A.filters([{ k: 'cl', l: L('Klien', 'Client'), opts: clientOpts() }], { force: true });
      var body = '';
      if (tab === 'live') body = card(L('SLA clock', 'SLA clocks'), fb + clockList(live), { icon: 'clock', count: running.length }) + note(t(L('Peringatan otomatis: 75% Info · 90% Warning · 100% Late, ke Supervisor lalu Ops Manager.', 'Automatic alerts: 75% Info · 90% Warning · 100% Late, to the Supervisor then the Ops Manager.')), 'bell');
      else if (tab === 'perf') body = card(L('Performa SLA per klien', 'SLA performance by client'), A.list(perf, [
        { h: L('Klien', 'Client'), v: function (x) { return '<b>' + esc(x.c.n) + '</b>'; } },
        { h: L('Aturan', 'Rule'), v: function (x) { return x.r ? esc(x.r.id) + ' · ' + x.r.tat + 'h' : '—'; } },
        { h: 'Order', cls: 'r num', v: function (x) { return n0(x.p.n); } },
        { h: 'On-time', cls: 'r num', v: function (x) { return '<b>' + pct(x.p.ot) + '</b>'; } },
        { h: 'At Risk', cls: 'r num', v: function (x) { return n0(x.p.risk); } },
        { h: 'Late', cls: 'r num', v: function (x) { return x.p.late ? '<b class="t6-crit">' + n0(x.p.late) + '</b>' : '0'; } },
        { h: L('Rata-rata TAT', 'Avg. TAT'), cls: 'r num', v: function (x) { return x.p.avgTat + 'h'; } }
      ], function (x) { return { t: esc(x.c.n), r: pct(x.p.ot), s: x.p.n + ' order · late ' + x.p.late + ' · TAT ' + x.p.avgTat + 'h' }; }, function (x) { return open('CLIENT-002') ? href('CLIENT-002', x.c.id, { tab: 'sla' }) : null; }, { dense: true }), { icon: 'chart' });
      else if (tab === 'rules') {
        var rules = M.slaRules(c0, { cl: c.q.cl, std: !!c.q.cl });
        body = card(L('Aturan SLA', 'SLA rules'), fb + A.list(rules, [
          { h: L('Aturan', 'Rule'), v: function (r) { return '<b>' + esc(T(r.n)) + '</b><small class="sub5">' + esc(r.id) + '</small>'; } },
          { h: L('Cakupan', 'Scope'), v: function (r) { return ruleScope(r); } },
          { h: 'Target', cls: 'r num', v: function (r) { return '<b>' + r.tat + 'h</b>'; } },
          { h: 'Cutoff', v: function (r) { return esc(r.pickCut) + ' / ' + esc(r.delCut); } },
          { h: L('Berlaku', 'Valid'), v: function (r) { return dts(r.eff) + (r.exp ? ' – ' + dts(r.exp) : ''); } },
          { h: L('Spesifisitas', 'Specificity'), cls: 'r num', v: function (r) { return M.slaSpec(r); } }
        ], function (r) { return { t: esc(T(r.n)), r: r.tat + 'h', s: esc(r.id) + ' · ' + r.pickCut + '/' + r.delCut }; }, function (r) { return href('SLA-002', r.id); }, { dense: true }), { icon: 'list', count: rules.length, right: can('com.sla.edit') && !mob() ? A.btn('ghost', L('Tambah aturan', 'Add rule'), 'plus', { act: 'rule', cls: 'btn-sm' }) : '' });
      } else {
        var q = c.q, cl = q.tcl || 'CL-01', props = M.propsOf(cl), pr = q.tprop && props.some(function (p) { return p.id === q.tprop; }) ? q.tprop : (props[0] || {}).id, svc = q.tsvc || 'SV-006', at = (q.tat || '2026-10-10') + ' ' + (q.th || '10:00');
        var res = M.slaFor({ cl: cl, prop: pr, svc: svc, pri: q.tpri || 'high', cat: null, at: at });
        function s2(k, o, v) { return '<label class="fb-f"><span>' + t(k[1]) + '</span><select data-f="' + k[0] + '">' + o.map(function (x) { return '<option value="' + esc(x[0]) + '"' + (String(x[0]) === String(v) ? ' selected' : '') + '>' + esc(T(x[1])) + '</option>'; }).join('') + '</select></label>'; }
        body = card(L('Hirarki override', 'Override hierarchy'), '<ol class="hy6">' + M.SLA_PREC.map(function (p, i) { return '<li><span class="hy6-n">' + (i + 1) + '</span><b>' + t(p[2]) + '</b><small>' + t(L('bobot ', 'weight ')) + p[1] + '</small></li>'; }).join('') + '</ol>' +
          note(t(L('Aturan paling spesifik menang: Property > Klien > Layanan > Kategori item > Prioritas > Hari/jam. Dua aturan dengan cakupan sama dan target berbeda = konflik.', 'The most specific rule wins: Property > Client > Service > Item category > Priority > Day/time. Two rules with the same scope and different targets = a conflict.')), 'info'), { icon: 'layers' }) +
          card(L('Uji aturan', 'Rule tester'), '<div class="fb">' + s2(['tcl', L('Klien', 'Client')], clientOpts(), cl) + s2(['tprop', ['Property', 'Property']], props.map(function (p) { return [p.id, [p.n, p.n]]; }), pr) + s2(['tsvc', L('Layanan', 'Service')], M.services().map(function (s) { return [s.id, [s.n, s.n]]; }), svc) +
            s2(['tpri', L('Prioritas', 'Priority')], opts(M.PRI), q.tpri || 'high') + s2(['tat', L('Tanggal', 'Date')], [['2026-10-07', L('Rabu 7 Okt', 'Wed 7 Oct')], ['2026-10-10', L('Sabtu 10 Okt', 'Sat 10 Oct')], ['2026-10-12', L('Senin 12 Okt', 'Mon 12 Oct')]], q.tat || '2026-10-10') + '</div>' +
            (res.rule ? '<p class="hh6"><b class="num">' + res.tat + ' ' + t(L('jam', 'hours')) + '</b> · ' + lnk('SLA-002', res.rule.id, esc(res.rule.id)) + ' · ' + esc(T(res.rule.n)) + '</p>' : '') +
            '<ol class="tl6">' + res.chain.map(function (r, i) { return '<li class="tl6-i"><span class="tl6-d" aria-hidden="true"></span><div><b>' + esc(r.id) + '</b> · ' + r.tat + 'h ' + (i === 0 ? A.chip('ok', L('Dipakai', 'Applied'), 'check') : A.chip('mute', L('Ditimpa', 'Overridden'))) + '<small>' + ruleScope(r) + '</small></div></li>'; }).join('') + '</ol>' +
            (res.conflict ? note(t(L('Konflik: ', 'Conflict: ')) + res.conflict.map(function (r) { return esc(r.id); }).join(', '), 'alert', 'crit') : ''), { icon: 'search' });
      }
      return A.pageHead(null, t(L('SLA dihitung otomatis dari aturan yang paling spesifik. Clock bisa dijeda dengan alasan.', 'SLA is calculated from the most specific rule. The clock can be paused with a reason.'))) + strip + notes +
        tabs([['live', L('SLA berjalan', 'Running'), 'clock', running.length], ['perf', L('Performa', 'Performance'), 'chart'], ['rules', L('Aturan', 'Rules'), 'list'], ['hier', L('Hirarki', 'Hierarchy'), 'layers']], tab, 'tab', { def: 'live' }) + body;
    },
    act: Object.assign({}, CLK_ACT, {
      rule: function () {
        dlg({ title: L('Tambah aturan SLA', 'Add SLA rule'), icon: 'clock',
          body: fld(L('Nama aturan', 'Rule name'), inp('n', ''), { req: true, wide: true }) + fld(L('Klien', 'Client'), sel('cl', clientOpts(L('Semua klien', 'All clients')), '')) + fld('Property', sel('prop', propOpts(null, L('Semua property', 'All properties')), '')) +
            fld(L('Layanan', 'Service'), sel('svc', [['', L('Semua layanan', 'All services')]].concat(M.services().map(function (s) { return [s.id, [s.n, s.n]]; })), '')) + fld(L('Prioritas', 'Priority'), sel('pri', [['', L('Semua', 'All')]].concat(opts(M.PRI)), '')) + fld(L('Hari / jam', 'Day / time'), sel('win', [['', L('Semua', 'All')]].concat(opts(M.WIN)), '')) +
            fld(L('Target (jam)', 'Turnaround (hours)'), inp('tat', '', { num: true }), { req: true }) + fld(L('Cutoff pickup', 'Pickup cutoff'), inp('pickCut', '09:00', { type: 'time' })) + fld(L('Cutoff kirim', 'Delivery cutoff'), inp('delCut', '17:00', { type: 'time' })) +
            fld(L('Berlaku', 'Effective'), inp('eff', M.TODAY, { type: 'date' }), { req: true }) + fld(L('Berakhir', 'Expiry'), inp('exp', '', { type: 'date' })) + fld(L('Penalti', 'Penalty'), inp('penalty', '')) + fld(L('Kompensasi', 'Compensation'), inp('comp', '')),
          onOk: function (v) {
            if (v.prop && v.cl && M.prop(v.prop).cl !== v.cl) return L('Property harus milik klien yang dipilih.', 'The property must belong to the chosen client.');
            var r = M.saveSlaRule(cx(), { n: v.n, cl: v.cl || (v.prop ? M.prop(v.prop).cl : null), prop: v.prop || null, svc: v.svc || null, pri: v.pri || null, win: v.win || null, tat: num(v.tat), pickCut: v.pickCut, delCut: v.delCut, eff: v.eff, exp: v.exp || null, penalty: v.penalty ? L(v.penalty, v.penalty) : '', comp: v.comp ? L(v.comp, v.comp) : '' });
            if (!r.ok) return r.msg; after(L('Aturan ' + r.rule.id + ' aktif.', 'Rule ' + r.rule.id + ' is active.')); return true;
          } });
      }
    })
  };

  /* ================= NP-06 · SLA-002 SLA Detail (rule or clock) ================= */
  V['SLA-002'] = {
    title: function (rec) { return rec || L('Detail SLA', 'SLA Detail'); },
    render: function (c) {
      var id = c.rec || 'SLA-07';
      if (/^ORD-/.test(id)) {
        var o = M.state().orders.filter(function (x) { return x.id === id; })[0];
        if (!o || !M.canSeeClient(cx(), M.prop(o.prop).cl)) return A.stateCard('empty', L('Order tidak ditemukan.', 'Order not found.'), A.backBtn());
        var k = M.clock(o), q = M.slaFor({ cl: M.prop(o.prop).cl, prop: o.prop, svc: o.svc, cat: o.cat, pri: o.pri, at: o.ev[0][1] });
        var evN = { start: L('Mulai', 'Start'), pause: L('Dijeda', 'Paused'), resume: L('Dilanjutkan', 'Resumed'), complete: L('Selesai', 'Completed') };
        return A.pageHead(esc(id), pname(o.prop) + ' · ' + sname(o.svc) + ' · ' + esc(T(o.cat)) + ' · ' + n0(o.kg) + ' kg') +
          '<section class="card c6-hd"><div class="c6-hd-m"><div class="c6-hd-t"><h1>' + slaC(k.st) + ' <b class="num">' + fmt.num(k.pct, 0) + '%</b></h1>' + bar(k) + '</div></div>' +
          kv([['Target', k.tat + ' ' + t(L('jam', 'hours'))], [L('Terpakai', 'Used'), hrs(k.used)], [L('Sisa', 'Left'), k.done ? '—' : hrs(k.left)], [L('Jatuh tempo', 'Due'), H.dtt(k.due)], [L('Aturan', 'Rule'), k.rule ? lnk('SLA-002', k.rule.id, esc(k.rule.id)) : t(L('Standar layanan', 'Service default'))], [L('Prioritas', 'Priority'), t(M.PRI[o.pri] || o.pri)]]) +
          '<div class="c6-hd-a">' + clockActs(k) + (can('com.sla.clock') && !k.done ? A.btn('ghost', L('Ajukan pengecualian', 'Request exception'), 'flag', { act: 'exc', val: (k.rule || {}).id + '|' + o.prop, cls: 'btn-sm' }) : '') + '</div></section>' +
          '<div class="grid2">' + card(L('Riwayat clock', 'Clock history'), '<ol class="tl6">' + o.ev.map(function (e) { return '<li class="tl6-i"><span class="tl6-d" aria-hidden="true"></span><div><b>' + t(evN[e[0]]) + '</b><small>' + dt(e[1]) + '</small>' + (e[2] ? '<span class="tl6-r">' + esc(T(e[2])) + '</span>' : '') + '</div></li>'; }).join('') + '</ol>', { icon: 'history' }) +
          card(L('Kenapa aturan ini?', 'Why this rule?'), '<ol class="tl6">' + q.chain.map(function (r, i) { return '<li class="tl6-i"><span class="tl6-d" aria-hidden="true"></span><div><b>' + esc(r.id) + '</b> · ' + r.tat + 'h ' + (i === 0 ? A.chip('ok', L('Dipakai', 'Applied'), 'check') : A.chip('mute', L('Ditimpa', 'Overridden'))) + '<small>' + ruleScope(r) + '</small></div></li>'; }).join('') + '</ol>', { icon: 'layers' }) + '</div>';
      }
      var r = M.state().sla.filter(function (x) { return x.id === id; })[0];
      if (!r || (r.cl && !M.canSeeClient(cx(), r.cl)) || (M.isClient(cx()) && !r.cl)) return A.stateCard('empty', L('Aturan SLA tidak ditemukan.', 'SLA rule not found.'), A.backBtn());
      var conf = M.slaConflicts(r), applied = M.state().orders.filter(function (o) { var k = M.clock(o); return k.rule && k.rule.id === id; }).map(function (o) { return M.clock(o); });
      var props = r.prop ? [r.prop] : r.cl ? M.propsOf(r.cl).map(function (p) { return p.id; }) : [];
      return A.pageHead(esc(T(r.n)), esc(r.id) + ' · ' + (r.status === 'active' ? A.chip('ok', L('Aktif', 'Active')) : A.chip('mute', r.status))) +
        (conf.length ? note(t(L('Bentrok dengan ', 'Conflicts with ')) + conf.map(function (x) { return lnk('SLA-002', x.b, esc(x.b)) + ' (' + x.tatB + 'h)'; }).join(', ') + t(L(' tanpa urutan prioritas.', ' without precedence.')), 'alert', 'crit') : '') +
        (r.reviewDue ? note(t(L('Review SLA jatuh tempo ', 'SLA review due ')) + dt(r.reviewDue), 'calendar', M.days(M.TODAY, r.reviewDue) <= 14 ? 'warn' : '') : '') +
        '<div class="grid2">' + card(L('Aturan', 'Rule'), kv([
          [L('Cakupan', 'Scope'), ruleScope(r)], ['Target', '<b>' + r.tat + ' ' + t(L('jam', 'hours')) + '</b>'], [L('Cutoff pickup', 'Pickup cutoff'), esc(r.pickCut)], [L('Cutoff kirim', 'Delivery cutoff'), esc(r.delCut)],
          [L('Eskalasi', 'Escalation'), esc(T(r.esc))], [L('Penalti', 'Penalty'), esc(T(r.penalty)) || '—'], [L('Kompensasi', 'Compensation'), esc(T(r.comp)) || '—'], [L('Review', 'Review'), esc(T(r.review))],
          [L('Berlaku', 'Valid'), dt(r.eff) + (r.exp ? ' – ' + dt(r.exp) : '')], [L('Spesifisitas', 'Specificity'), M.slaSpec(r)]
        ]), { icon: 'clock' }) +
        '<div>' + (props.length ? card(L('Property yang memakai', 'Properties using it'), '<ul class="ln6">' + props.map(function (p) { var perf = M.slaPerf(null, p); return '<li>' + ic('hotel') + '<div><b>' + prLink(p) + '</b><small>' + (perf.n ? 'On-time ' + pct(perf.ot) + ' · ' + perf.n + ' order' : t(L('Belum ada order bulan ini', 'No order this month'))) + '</small></div></li>'; }).join('') + '</ul>', { icon: 'hotel' }) : '') +
        card(L('SLA berjalan dengan aturan ini', 'Running SLA on this rule'), clockList(applied), { icon: 'clock', count: applied.length }) + '</div></div>';
    },
    act: Object.assign({}, CLK_ACT, {
      exc: function (el) {
        var p = el.getAttribute('data-val').split('|'), rule = p[0] !== 'undefined' ? p[0] : null, prop = p[1], base = M.state().sla.filter(function (x) { return x.id === rule; })[0];
        dlg({ title: L('Ajukan pengecualian SLA', 'Request SLA exception'), sub: pname(prop) + (base ? ' · ' + esc(base.id) + ' ' + base.tat + 'h' : ''), icon: 'flag',
          body: fld(L('Target baru (jam)', 'New turnaround (hours)'), inp('to', base ? base.tat + 6 : 30, { num: true }), { req: true }) + fld(L('Berlaku', 'Effective'), inp('eff', M.TODAY, { type: 'date' })) + fld(L('Alasan', 'Reason'), area('reason', '', L('Contoh: volume event akhir pekan', 'Example: weekend event volume')), { req: true }),
          onOk: function (v) { var r = M.request(cx(), 'slaexc', { cl: M.prop(prop).cl, prop: prop, rec: rule || 'SLA-STD-ALL', from: base ? base.tat : 24, to: num(v.to), reason: L(v.reason, v.reason), eff: v.eff }); if (!r.ok) return r.msg; after(L('Pengecualian diajukan (' + r.approval.id + ').', 'Exception requested (' + r.approval.id + ').')); return true; } });
      }
    })
  };

  /* ================= NP-07 · DOC-001 Client Document Center ================= */
  function docDlg(base) {
    base = base || {};
    var cl = base.cl || A.S.q.cl || 'CL-07';
    dlg({ title: base.n ? L('Unggah versi baru', 'Upload new version') : L('Unggah dokumen', 'Upload document'), sub: base.n ? esc(base.n) + ' · v' + base.v + ' → v' + (base.v + 1) : '', icon: 'upload',
      body: fld(L('Nama dokumen', 'Document name'), inp('n', base.n || '', base.n ? { ro: true } : {}), { req: true, wide: true }) + fld(L('Tipe', 'Type'), base.n ? inp('type', base.type, { ro: true }) : sel('type', opts(M.DOC_TYPES), 'proposal'), { req: true }) +
        fld(L('Klien', 'Client'), base.n ? inp('cl', cl, { ro: true }) : sel('cl', clientOpts(), cl), { req: true }) + fld('Property', base.n ? inp('prop', base.prop || '', { ro: true }) : sel('prop', propOpts(cl, L('Semua property', 'All properties')), '')) +
        fld(L('Kontrak terkait', 'Related contract'), base.n ? inp('ctr', base.ctr || '', { ro: true }) : sel('ctr', [['', L('Tidak ada', 'None')]].concat(M.contracts(cx(), { cl: cl }).map(function (x) { return [x.no, [x.no, x.no]]; })), '')) +
        fld('File', '<input type="file" name="fileIn" accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.png">', { req: true, hint: t(L('PDF, Word, Excel atau foto.', 'PDF, Word, Excel or photo.')) }) +
        fld(L('Berlaku', 'Effective'), inp('eff', M.TODAY, { type: 'date' })) + fld(L('Kedaluwarsa', 'Expiry'), inp('exp', base.exp || '', { type: 'date' })) +
        fld(L('Bagikan ke portal klien', 'Share to the client portal'), '<label class="sw6"><input type="checkbox" name="share"' + (base.share ? ' checked' : '') + '><span>' + t(L('Klien bisa melihat dokumen ini', 'The client can see this document')) + '</span></label>') + fld(L('Catatan', 'Notes'), inp('notes', '')),
      onOk: function (v, el) {
        var f = el.querySelector('[name=fileIn]'), file = f && f.files && f.files[0] ? f.files[0].name : '';
        var r = M.addDoc(cx(), { n: v.n, type: v.type, cl: v.cl, prop: v.prop || null, ctr: v.ctr || null, file: file, eff: v.eff || null, exp: v.exp || null, share: v.share, notes: v.notes });
        if (!r.ok) return r.msg; after(r.superseded ? L('Versi v' + r.doc.v + ' tersimpan. Versi sebelumnya tetap tersimpan.', 'Version v' + r.doc.v + ' saved. The previous version is kept.') : L('Dokumen ' + r.doc.id + ' tersimpan.', 'Document ' + r.doc.id + ' saved.')); return true;
      } });
  }
  V['DOC-001'] = {
    render: function (c) {
      var q = c.q, c0 = cx(), list = M.docs(c0, { cl: q.cl, type: q.type, st: q.st, ctr: q.ctr, q: q.q, all: q.all === '1' }), all = M.docs(c0, {});
      var exp = all.filter(function (d) { return d.exp && d.status === 'active' && M.days(M.TODAY, d.exp) <= 60; });
      var fb = A.filters([{ k: 'cl', l: L('Klien', 'Client'), opts: clientOpts() }, { k: 'type', l: L('Tipe', 'Type'), opts: opts(M.DOC_TYPES) }, { k: 'st', l: 'Status', opts: stOpts(M.DOC_ST) }], { search: L('Cari nama dokumen, nomor, file', 'Search document name, number, file'), force: !M.isClient(c0) });
      var mg = can('com.doc.manage') && !mob();
      return A.pageHead(null, t(L('Satu tempat untuk dokumen klien. File baru untuk dokumen yang sama menjadi versi baru; versi lama tetap tersimpan.', 'One place for client documents. A new file for the same document becomes a new version; old versions stay.')), mg ? A.btn('primary', L('Unggah dokumen', 'Upload document'), 'upload', { act: 'up' }) : '') +
        (M.isClient(c0) ? '' : tiles([tile({ k: L('Dokumen aktif', 'Active documents'), v: all.filter(function (d) { return d.status === 'active'; }).length }), tile({ k: L('Kedaluwarsa ≤ 60 hari', 'Expiring ≤ 60 days'), v: exp.length, tone: exp.length ? 'warn' : '' }), tile({ k: L('Dibagikan ke klien', 'Shared with clients'), v: all.filter(function (d) { return d.share; }).length }), tile({ k: L('Versi lama', 'Superseded'), v: M.docs(c0, { st: 'superseded' }).length, href: H.qhref({ all: '1' }) })], 'tls5-4')) +
        card(L('Dokumen', 'Documents'), fb + '<div class="fb"><a class="btn btn-ghost btn-sm" href="' + H.qhref({ all: q.all === '1' ? null : '1' }) + '" aria-pressed="' + (q.all === '1') + '">' + ic('history') + '<span>' + t(q.all === '1' ? L('Sembunyikan versi lama', 'Hide old versions') : L('Tampilkan versi lama', 'Show old versions')) + '</span></a></div>' + A.list(list, [
          { h: L('Dokumen', 'Document'), v: function (d) { return '<b>' + esc(d.n) + '</b><small class="sub5">' + esc(d.id) + ' · ' + esc(d.file) + '</small>'; } },
          { h: L('Tipe', 'Type'), v: function (d) { return t(M.DOC_TYPES[d.type]); } },
          { h: L('Klien / property', 'Client / property'), v: function (d) { return cname(d.cl) + (d.prop ? '<small class="sub5">' + pname(d.prop) + '</small>' : ''); } },
          { h: L('Kontrak', 'Contract'), v: function (d) { return d.ctr ? '<span class="mono6">' + esc(d.ctr) + '</span>' : '—'; } },
          { h: L('Versi', 'Version'), cls: 'r', v: function (d) { return 'v' + d.v; } },
          { h: L('Tanggal', 'Date'), v: function (d) { return dt(d.date) + (d.exp ? '<small class="sub5">' + t(L('s/d ', 'until ')) + dt(d.exp) + '</small>' : ''); } },
          { h: L('Oleh', 'By'), v: function (d) { return emp(d.by); } },
          { h: 'Status', v: function (d) { return A.chip(M.DOC_ST[d.status][1], M.DOC_ST[d.status][0]) + (d.share && !M.isClient(c0) ? ' <span class="tg6" title="' + esc(T(L('Dibagikan ke portal klien', 'Shared to the client portal'))) + '">' + ic('eye') + '</span>' : ''); } },
          mg ? { h: '', v: function (d) { return d.status === 'active' ? A.btn('ghost', L('Versi baru', 'New version'), 'upload', { act: 'ver', val: d.id, cls: 'btn-sm' }) + A.btn('ghost', L('Arsipkan', 'Archive'), 'trash', { act: 'arc', val: d.id, cls: 'btn-sm' }) : ''; } } : null
        ].filter(Boolean), function (d) { return { t: esc(d.n), s: t(M.DOC_TYPES[d.type]) + ' · v' + d.v + ' · ' + dt(d.date) + ' · ' + esc(d.file), chip: A.chip(M.DOC_ST[d.status][1], M.DOC_ST[d.status][0]) }; }, null, { dense: true, empty: q.q ? L('Tidak ada dokumen yang cocok.', 'No matching document.') : L('Belum ada dokumen.', 'No document yet.') }), { icon: 'file', count: list.length });
    },
    act: {
      up: function () { docDlg(); },
      ver: function (el) { var d = M.state().docs.filter(function (x) { return x.id === el.getAttribute('data-val'); })[0]; if (d) docDlg(d); },
      arc: function (el) {
        var id = el.getAttribute('data-val');
        dlg({ title: L('Arsipkan dokumen', 'Archive document'), sub: esc(id), icon: 'trash', body: fld(L('Alasan', 'Reason'), area('reason', ''), { req: true }) + note(t(L('Dokumen tidak dihapus; tetap bisa dicari di versi lama.', 'The document is not deleted; it stays searchable with old versions.')), 'info'),
          onOk: function (v) { var r = M.setDocStatus(cx(), id, 'archived', v.reason); if (!r.ok) return r.msg; after(L('Dokumen diarsipkan.', 'Document archived.')); return true; } });
      }
    }
  };

  /* ================= NP-07 · HISTORY-001 Commercial Timeline ================= */
  V['HISTORY-001'] = {
    render: function (c) {
      var q = c.q, c0 = cx(), cl = q.cl || '', grp = q.ev || '', audit = q.view === 'audit' && can('com.health.adjust');
      var list = cl ? M.timeline(cl, { ev: grp || null, prop: q.prop || null }) : M.timeline(null, { ev: grp || null }).filter(function (e) { return M.canSeeClient(c0, e.cl); });
      var fb = A.filters([{ k: 'cl', l: L('Klien', 'Client'), opts: clientOpts() }].concat(cl ? [{ k: 'prop', l: 'Property', opts: propOpts(cl) }] : []), { force: true });
      var head = A.pageHead(null, t(L('Siapa, kapan, nilai lama, nilai baru, alasan dan dokumen untuk setiap perubahan komersial.', 'Who, when, old value, new value, reason and document for every commercial change.')));
      var views = can('com.health.adjust') ? tabs([['tl', 'Timeline', 'history'], ['audit', 'Audit trail', 'shield']], audit ? 'audit' : 'tl', 'view', { seg: true, def: 'tl' }) : '';
      if (audit) {
        var log = M.auditLog(cl || null).slice(0, 150);
        return head + views + card('Audit trail', fb + A.list(log, [
          { h: L('Waktu', 'Time'), v: function (e) { return H.dtt(e.at); } }, { h: L('Kejadian', 'Event'), v: function (e) { return '<b class="mono6">' + esc(e.ev) + '</b>'; } }, { h: L('Oleh', 'By'), v: function (e) { return esc(e.by) + '<small class="sub5">' + esc(e.uid || '') + '</small>'; } },
          { h: L('Data', 'Record'), v: function (e) { return esc(e.rec || '—'); } }, { h: L('Lama → baru', 'Old → new'), v: function (e) { return e.from != null || e.to != null ? esc(String(T(e.from == null ? '—' : e.from))) + ' → <b>' + esc(String(T(e.to == null ? '—' : e.to))) + '</b>' : '—'; } }, { h: L('Alasan', 'Reason'), v: function (e) { return esc(T(e.reason) || '—'); } }
        ], function (e) { return { t: esc(e.ev), s: H.dtt(e.at) + ' · ' + esc(e.by) + ' · ' + esc(e.rec || '') }; }, null, { dense: true, empty: L('Belum ada catatan audit.', 'No audit entries yet.') }), { icon: 'shield', count: log.length });
      }
      return head + views + card(L('Timeline komersial', 'Commercial timeline'), fb + tabs(M.TL_GROUPS.map(function (g) { return [g[0], g[1]]; }), grp, 'ev', { seg: true, def: '', label: L('Jenis kejadian', 'Event type') }) +
        (cl ? '' : '<p class="sub5">' + t(L('Semua klien. Pilih klien untuk timeline per property.', 'All clients. Choose a client for a per-property timeline.')) + '</p>') +
        (cl ? timeline(list, 200) : '<ol class="tl6">' + list.slice(0, 120).map(function (e) { return P.tlRow(e).replace('<div><b>', '<div><span class="tg6">' + cname(e.cl) + '</span> <b>'); }).join('') + '</ol>') + (list.length ? '' : A.empty(L('Belum ada riwayat komersial.', 'No commercial history yet.'))), { icon: 'history', count: list.length });
    }
  };
})();
