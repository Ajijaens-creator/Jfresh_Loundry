/* JFRESH OS — Phase 9 screens (part 1): shared delivery helpers (A.P9), printable documents
   (Delivery Note, POD, Return Note, Redelivery Note, Completion Summary), Ready to Deliver &
   Release (REL-001, REL-002), the delivery dispatch board and detail (DISP-001, DISP-002), the POD
   detail (DLV-POD-002) and delivery reconciliation (REC-001).
   iPad first for the supervisor. Every number comes from the delivery engine (assets/js/jfos-dlv.js),
   which reads Phase 7 for route, driver, tracking and ETA and Phase 8 for the batch; it never
   copies tracking. Permission and client scope are checked again inside the engine. */
(function () {
  var A = window.JFAPP, E = window.JFDLV, H = A && A.P5, G = A && A.P7, P8 = A && A.P8;
  if (!A || !E || !H || !G || !P8) return;
  var V = A.V, T = A.T, L = A.L, t = A.t, esc = A.esc, ic = A.ic, can = A.can, href = A.href;
  var lnk = H.lnk, tabs = H.tabs, card = H.card, kv = H.kv, note = H.note, dlg = H.dlg, fld = H.fld, inp = H.inp, sel = H.sel, area = H.area;
  var after = G.after, fail = G.fail, vals = G.vals, choice = G.choice, img = G.img, when = G.when;
  var hero = P8.hero, abar = P8.abar, xl = P8.xl, bigCount = P8.bigCount, reasonDlg = P8.reasonDlg;
  A.addParents(E.PARENTS);
  function cx() { return A.ctx(); }
  function go(id, rec, q) { A.go(id, rec, q); }

  /* ================= Shared helpers (also used by screens-dlv2.js / screens-dlv3.js) ================= */
  function hm(s) { return s ? String(s).slice(11, 16) : '—'; }
  function kg(v) { return v == null ? '—' : A.fmt.num(v, v % 1 ? 1 : 0) + ' kg'; }
  function pcs(v) { return v == null ? '—' : A.fmt.num(v, 0) + ' pcs'; }
  function pk(v) { return v == null ? '—' : v + ' ' + T(L('paket', v === 1 ? 'package' : 'packages')); }
  function rp(v) { return v == null ? '—' : A.fmt.rp(v); }
  function cname(id) { return esc(E.clientName(id)); }
  function pname(id) { return esc(E.propName(id)); }
  function first(id) { return id ? esc(E.first(id)) : '—'; }
  function emp(id) { return id ? esc(E.empName(id)) : '—'; }
  function win(d) { return esc(G.day(d.date)) + ' · <span class="num">' + esc(d.win.join('–')) + '</span>'; }
  function lab(x) { return x ? x[0] : L('—', '—'); }
  function stC(d) { var s0 = E.status(d), x = E.DLV_ST[s0] || [L(s0, s0), 'mute']; return A.chip(x[1], x[0]); }
  function relC(r) { var s0 = E.relSt(r), x = E.REL_ST[s0]; return A.chip(x[1], x[0]); }
  function billC(d) { var s0 = E.billSt(d), x = E.BILL_ST[s0]; return A.chip(x[1], x[0]); }
  function issC(i) { var x = E.ISS_ST[i.st] || E.ISS_ST.new; return A.chip(x[1], x[0]); }
  function retC(r) { var x = E.RET_ST[r.st]; return A.chip(x[1], x[0]); }
  function sevC(s) { var x = E.SEV[s] || E.SEV.info; return A.chip(x[1], x[0], s === 'info' ? 'bell' : 'alert'); }
  function slaC(sla) { if (!sla || !sla.st) return A.chip('mute', E.SLA_ST.pending[0]); var x = E.SLA_ST[sla.st]; return A.chip(x[1], sla.st === 'late' && sla.min ? [T(x[0]) + ' +' + sla.min + ' ' + T(L('mnt', 'min')), x[0][1] + ' +' + sla.min + ' min'] : x[0]); }
  function recC(rec) { if (!rec) return A.chip('mute', L('Belum direkonsiliasi', 'Not reconciled')); var x = E.REC_RES[rec.res]; return A.chip(x[1], rec.res === 'ok' ? L('SESUAI', 'MATCHED') : L('ADA SELISIH', 'DIFFERENCE')) + (rec.review ? ' ' + A.chip(E.REV_ST[rec.review][1], E.REV_ST[rec.review][0]) : ''); }
  function priC(p) { return p && p !== 'normal' && E.PRI[p] ? A.chip(E.priRank(p) >= 4 ? 'crit' : 'warn', E.PRI[p][0], 'zap') : ''; }
  function dLink(id, label) { return lnk('DISP-002', id, label || '<span class="mono6">' + esc(id) + '</span>'); }
  function oLink(id) { return id ? G.ordLink(id) : '<span class="sub5">' + t(L('belum ada', 'none yet')) + '</span>'; }
  // A delivery's order: the live Phase 7 order, else the archived order number.
  function dOrd(d) { return d.ord ? G.ordLink(d.ord) : d.oref ? '<span class="mono6">' + esc(d.oref) + '</span>' : oLink(null); }
  function bLink(id) { return id ? (P8.bLink ? P8.bLink(id) : '<span class="mono6">' + esc(id) + '</span>') : '—'; }
  // One row of a check list: ok, failed (with its kind), value.
  function checks(list, o) {
    o = o || {};
    return '<ul class="ck9">' + list.map(function (c) {
      var kind = c.kind === 'ovr' ? L('bisa override', 'override allowed') : c.kind === 'hard' ? L('wajib', 'required') : c.kind === 'fix' ? L('perbaiki dulu', 'fix first') : null;
      return '<li class="' + (c.ok ? 'ok' : c.kind === 'ovr' ? 'ovr' : 'no') + '">' + ic(c.ok ? 'checkc' : c.kind === 'ovr' ? 'alert' : 'xc') + '<span><b>' + t(c.n) + '</b><small>' + esc(c.v == null ? '' : String(c.v)) + (!c.ok && kind && !o.plain ? ' · ' + t(kind) : '') + '</small></span></li>';
    }).join('') + '</ul>';
  }
  // Sent vs received, side by side (§20).
  function compare(d) {
    var rec = d.rec, sent = rec ? rec.sent : { pkgs: d.pkgs, qty: d.qty, kg: d.kg }, rcv = rec ? rec.recv : null;
    function cell(a, b, f) { var diff = b != null && a != null && a !== b; return '<td class="num">' + f(a) + '</td><td class="num' + (diff ? ' t-crit' : '') + '">' + (b == null ? '—' : f(b)) + (diff ? ' <small>(' + (b > a ? '+' : '') + A.fmt.num(b - a, (b - a) % 1 ? 1 : 0) + ')</small>' : '') + '</td>'; }
    return '<div class="tblw"><table class="tbl cmp9"><thead><tr><th></th><th>' + t(L('Dikirim (Plant)', 'Dispatched (Plant)')) + '</th><th>' + t(L('Diterima (Klien)', 'Received (Client)')) + '</th></tr></thead><tbody>' +
      '<tr><th>' + t(L('Paket', 'Packages')) + '</th>' + cell(sent.pkgs, rcv && rcv.pkgs, function (v) { return v; }) + '</tr>' +
      '<tr><th>' + t(L('Jumlah', 'Quantity')) + '</th>' + cell(sent.qty, rcv && rcv.qty, pcs) + '</tr>' +
      '<tr><th>' + t(L('Berat', 'Weight')) + '</th>' + cell(sent.kg, rcv && rcv.kg, kg) + '</tr></tbody></table></div>';
  }
  function dhero(d, o) {
    o = o || {};
    return hero({ id: d.id + (d.ord || d.oref ? ' · ' + (d.ord || d.oref) : ''), icon: o.icon || 'truck', title: pname(d.prop), sub: cname(d.cl) + ' · ' + win(d) + (d.attempt > 1 ? ' · ' + t(L('Pengiriman ulang ke-' + d.attempt, 'Attempt ' + d.attempt)) : ''),
      chips: stC(d) + priC(d.pri) + (d.hold ? A.chip('warn', L('Ditahan', 'On hold'), 'pause') : '') + (o.chips || ''),
      facts: o.facts || [[L('Paket', 'Packages'), d.pkgs, 'num'], [L('Jumlah', 'Quantity'), pcs(d.qty), 'num'], [L('Berat', 'Weight'), kg(d.kg), 'num'], [L('Driver', 'Driver'), first(E.driverOf(d))], [L('Batch', 'Batch'), esc(d.batch || '—')]], extra: o.extra });
  }
  // A delivery row for queues and lists (big tap target on the iPad).
  function drow(d, o) {
    o = o || {};
    var link = o.href || href(o.go || 'DISP-002', d.id);
    return '<a class="q8' + (d.rec && d.rec.review === 'pending' ? ' q8-late' : E.late(d) ? ' q8-risk' : '') + '" href="' + link + '"><span class="q8-i">' + ic(o.icon || 'truck') + '</span>' +
      '<span class="q8-b"><span class="q8-h"><b class="mono6">' + esc(d.id) + '</b>' + priC(d.pri) + (d.attempt > 1 ? A.chip('appr', L('Kirim ulang', 'Redelivery'), 'refresh') : '') + (o.chip || '') + '</span>' +
      '<b class="q8-t">' + cname(d.cl) + '</b><span class="q8-s">' + pname(d.prop) + ' · ' + win(d) + '</span>' +
      '<span class="q8-m"><span>' + ic('package') + '<b class="num">' + d.pkgs + '</b></span><span>' + ic('layers') + '<b class="num">' + pcs(d.qty) + '</b></span><span>' + ic('scale') + '<b class="num">' + kg(d.kg) + '</b></span>' + (E.driverOf(d) ? '<span>' + ic('user') + '<b>' + first(E.driverOf(d)) + '</b></span>' : '') + (o.meta || '') + '</span></span>' +
      '<span class="q8-r">' + (o.right != null ? o.right : stC(d)) + ic('chevr', 'q8-go') + '</span></a>';
  }
  function dlist(rows, empty) { return rows.length ? '<div class="q8l">' + rows.join('') + '</div>' : A.empty(empty); }
  function evPh(src, alt) { return src ? '<div class="ev9">' + img(src, alt) + '</div>' : ''; }

  /* ---------- Printable documents (§53) ---------- */
  // A small deterministic QR-style mark: the reference text is printed under it for manual entry.
  function qr(text) {
    var n = 21, h = 0, cells = ''; text = String(text || '');
    for (var i = 0; i < text.length; i++) h = (h * 31 + text.charCodeAt(i)) >>> 0;
    function fin(x, y) { return '<rect x="' + x + '" y="' + y + '" width="7" height="7" fill="none" stroke="#0B3D78" stroke-width="1"/><rect x="' + (x + 2) + '" y="' + (y + 2) + '" width="3" height="3"/>'; }
    for (var y = 0; y < n; y++) for (var x = 0; x < n; x++) {
      if ((x < 8 && y < 8) || (x > 12 && y < 8) || (x < 8 && y > 12)) continue;
      h = (h * 1103515245 + 12345) >>> 0; if ((h >> 16) & 1) cells += '<rect x="' + x + '" y="' + y + '" width="1" height="1"/>';
    }
    return '<svg class="qr9" viewBox="-1 -1 23 23" role="img" aria-label="QR ' + esc(text) + '"><g fill="#0B3D78">' + fin(0.5, 0.5) + fin(13.5, 0.5) + fin(0.5, 13.5) + cells + '</g></svg>';
  }
  var DOCS = { note: L('Surat Jalan / Delivery Note', 'Delivery Note'), pod: L('Bukti Pengiriman (POD)', 'Proof of Delivery (POD)'), ret: L('Nota Return', 'Return Note'), redel: L('Nota Pengiriman Ulang', 'Redelivery Note'), comp: L('Ringkasan Penyelesaian Layanan', 'Service Completion Summary') };
  function docBody(kind, d) {
    var p = d.pod ? E.podView(d.pod) : null, r = d.ret ? E.ret(d.ret) : null, cd = d.comp ? d.comp.data : null, rows, ref;
    var head = [[L('Klien', 'Client'), cname(d.cl)], [L('Property', 'Property'), pname(d.prop)], [L('Order', 'Order'), esc(d.ord || d.oref || '—')], [L('Delivery', 'Delivery'), esc(d.id)], [L('Batch', 'Batch'), esc(d.batch || '—')], [L('Layanan', 'Service'), esc(E.svcName(d.svc))]];
    if (kind === 'note') { ref = 'JFRESH|DN|' + d.id; rows = head.concat([[L('Jadwal', 'Schedule'), esc(d.date + ' ' + d.win.join('–'))], [L('Paket', 'Packages'), d.pkgs], [L('Jumlah', 'Quantity'), pcs(d.qty)], [L('Berat', 'Weight'), kg(d.kg)], [L('Driver', 'Driver'), emp(E.driverOf(d))], [L('Kendaraan', 'Vehicle'), esc(E.vehOf(d) || '—')], [L('Instruksi', 'Instructions'), esc(T(d.instr) || '—')]]); }
    else if (kind === 'pod') { ref = (p && p.ref) || 'JFRESH|POD|' + d.id; rows = head.concat(p ? [[L('No. POD', 'POD no.'), esc(p.id) + (p.ver > 1 ? ' · v' + p.ver : '')], [L('Penerima', 'Recipient'), esc(p.recv) + (p.role ? ' · ' + esc(p.role) : '')], [L('Waktu', 'Time'), esc(p.at)], [L('Paket diterima', 'Packages received'), p.pkgs + ' / ' + d.pkgs], [L('Jumlah', 'Quantity'), pcs(p.qty)], [L('Kondisi', 'Condition'), t(E.COND[p.cond] ? E.COND[p.cond][0] : p.cond)], [L('Catatan', 'Notes'), esc(p.notes || '—')], [L('Lokasi', 'Location'), p.loc ? t(L('Tercatat saat serah terima', 'Recorded at handover')) : t(L('Tidak diizinkan', 'Not permitted'))]] : []); }
    else if (kind === 'ret' && r) { ref = 'JFRESH|RET|' + r.id; rows = head.concat([[L('No. Return', 'Return no.'), esc(r.id)], [L('Alasan', 'Reason'), t(E.ISSUE_TYPES[r.reason] ? E.ISSUE_TYPES[r.reason][0] : L(r.reason, r.reason))], [L('Catatan', 'Notes'), esc(T(r.note))], [L('Paket', 'Packages'), r.pkgs], [L('Jumlah', 'Quantity'), pcs(r.qty)], [L('Berat', 'Weight'), kg(r.kg)], [L('Tindakan', 'Action needed'), t(E.RET_NEED[r.need] || L(r.need, r.need))], [L('Status', 'Status'), t(E.RET_ST[r.st][0])]]); }
    else if (kind === 'redel') { ref = 'JFRESH|RD|' + d.id; rows = head.concat([[L('Delivery asli', 'Original delivery'), esc(d.orig || '—')], [L('Return', 'Return'), esc(d.ret || '—')], [L('Percobaan', 'Attempt'), d.attempt], [L('Jadwal', 'Schedule'), esc(d.date + ' ' + d.win.join('–'))], [L('Paket', 'Packages'), d.pkgs], [L('Jumlah', 'Quantity'), pcs(d.qty)]]); }
    else if (kind === 'comp' && cd) { ref = 'JFRESH|SC|' + d.id + '|v' + d.comp.ver; rows = head.concat([[L('Selesai', 'Completed'), esc(cd.date + ' ' + cd.time)], [L('Total waktu proses', 'Total turnaround'), cd.tat != null ? esc(G.minT(cd.tat)) : '—'], [L('Jumlah akhir', 'Final quantity'), pcs(cd.qty)], [L('Berat akhir', 'Final weight'), kg(cd.kg)], [L('Paket', 'Packages'), cd.pkgs], [L('SLA pickup / produksi / delivery', 'Pickup / production / delivery SLA'), [cd.slaPick, cd.slaProd, cd.slaDel].map(function (s) { return t(E.SLA_ST[s][0]); }).join(' · ')], [L('SLA keseluruhan', 'Overall SLA'), t(E.SLA_ST[cd.overall][0])], [L('Hasil penerimaan', 'Acceptance'), t(E.ACC[cd.delRes] ? E.ACC[cd.delRes][0] : cd.delRes)], [L('Masalah selesai', 'Issues resolved'), esc(cd.issRes)], [L('Versi', 'Version'), 'v' + d.comp.ver]]); }
    else return null;
    var sig = kind === 'pod' && p ? '<div class="doc9-sig"><div>' + (p.sign && /^data:image/.test(p.sign) ? '<img src="' + p.sign + '" alt="">' : img('seed:pod', 'POD')) + '<span>' + t(L('Tanda tangan penerima', 'Recipient signature')) + ' · ' + esc(p.recv) + '</span></div><div>' + img(p.photo, 'POD') + '<span>' + t(L('Foto serah terima', 'Handover photo')) + '</span></div></div>'
      : '<div class="doc9-sig doc9-sig-e"><div><i></i><span>' + t(L('Diserahkan oleh (JFRESH)', 'Handed over by (JFRESH)')) + '</span></div><div><i></i><span>' + t(L('Diterima oleh (Klien)', 'Received by (Client)')) + '</span></div></div>';
    return '<article class="doc9-p"><header><img src="../assets/brand/jfresh-logo.png" alt="J\'Fresh Laundry" width="605" height="373"><div><h2>' + t(DOCS[kind]) + '</h2><p>JFRESH Laundry & Linen Care · Plant Ubud · ' + esc(E.TODAY) + '</p></div>' + qr(ref) + '</header>' +
      '<table class="doc9-t"><tbody>' + rows.map(function (x) { return '<tr><th>' + t(x[0]) + '</th><td>' + x[1] + '</td></tr>'; }).join('') + '</tbody></table>' + sig +
      '<footer><span class="mono6">' + esc(ref) + '</span><span>' + t(L('Dokumen dibuat dari data sistem. Perubahan hanya lewat amandemen tercatat.', 'Generated from system data. Changes only through a recorded amendment.')) + '</span></footer></article>';
  }
  function openDoc(kind, id) {
    var d = E.dlv(id), body = d && docBody(kind, d);
    if (!body) { A.toast(L('Dokumen belum tersedia.', 'The document is not available yet.'), 'warn'); return; }
    var old = document.querySelector('.doc9'); if (old) old.remove();
    var el = document.createElement('div'); el.className = 'doc9'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'true'); el.setAttribute('aria-label', T(DOCS[kind]));
    el.innerHTML = '<div class="doc9-bar">' + A.btn('primary', L('Cetak / Simpan PDF', 'Print / Save PDF'), 'print', { cls: 'doc9-pr' }) + A.btn('ghost', L('Tutup', 'Close'), 'x', { cls: 'doc9-x' }) + '</div>' + body;
    document.body.appendChild(el); document.body.classList.add('doc9-on');
    function close() { el.remove(); document.body.classList.remove('doc9-on'); document.removeEventListener('keydown', key, true); }
    function key(e) { if (e.key === 'Escape') close(); }
    el.querySelector('.doc9-x').onclick = close; el.querySelector('.doc9-pr').onclick = function () { window.print(); };
    document.addEventListener('keydown', key, true); el.querySelector('.doc9-x').focus();
  }
  function docBtns(d) {
    var list = [['note', 'file', true], ['pod', 'sign', !!d.pod], ['ret', 'arrowl', !!(d.ret && E.ret(d.ret) && E.ret(d.ret).dlv === d.id)], ['redel', 'refresh', !!d.orig], ['comp', 'checkc', !!d.comp]];
    return '<div class="doc9-l">' + list.filter(function (x) { return x[2]; }).map(function (x) { return A.btn('ghost', DOCS[x[0]], x[1], { act: 'doc', val: x[0] + '|' + d.id, cls: 'btn-sm' }); }).join('') + '</div>';
  }
  var DOC_ACT = { doc: function (el) { var p = el.getAttribute('data-val').split('|'); openDoc(p[0], p[1]); } };

  var P = { cx: cx, go: go, hm: hm, kg: kg, pcs: pcs, pk: pk, rp: rp, cname: cname, pname: pname, first: first, emp: emp, win: win, lab: lab, stC: stC, relC: relC, billC: billC, issC: issC, retC: retC, sevC: sevC, slaC: slaC, recC: recC, priC: priC,
    dLink: dLink, oLink: oLink, dOrd: dOrd, bLink: bLink, checks: checks, compare: compare, dhero: dhero, drow: drow, dlist: dlist, evPh: evPh, qr: qr, DOCS: DOCS, openDoc: openDoc, docBtns: docBtns, DOC_ACT: DOC_ACT };
  A.P9 = P;

  /* ================= NP-01 · REL-001 Ready to Deliver Queue ================= */
  V['REL-001'] = {
    render: function (c) {
      var c0 = cx(), all = E.releases(c0, {}), tab = c.q.tab || 'open', by = {};
      ['waiting', 'ready', 'hold', 'issue', 'released'].forEach(function (k) { by[k] = []; });
      all.forEach(function (r) { by[E.relSt(r)].push(r); });
      var relToday = by.released.filter(function (r) { return r.relAt && r.relAt.slice(0, 10) === E.TODAY; });
      var list = tab === 'open' ? all.filter(function (r) { return E.relSt(r) !== 'released'; }) : by[tab] || [];
      var rows = list.map(function (r) {
        var v = E.relView(r), s0 = E.relSt(r), fail = E.relChecks(r).filter(function (x) { return !x.ok; });
        return '<a class="q8' + (s0 === 'issue' ? ' q8-late' : s0 === 'hold' ? ' q8-risk' : '') + '" href="' + href('REL-002', r.id) + '"><span class="q8-i">' + ic('package') + '</span><span class="q8-b"><span class="q8-h"><b class="mono6">' + esc(r.id) + '</b><span class="sub5 mono6">' + esc(v.batch) + '</span>' + (v.live ? A.chip('info', L('Live dari produksi', 'Live from production'), 'factory') : '') + priC(v.pri) + '</span>' +
          '<b class="q8-t">' + cname(v.cl) + '</b><span class="q8-s">' + pname(v.prop) + (v.date ? ' · ' + esc(G.day(v.date)) + (v.win ? ' <span class="num">' + esc(v.win.join('–')) + '</span>' : '') : '') + '</span>' +
          '<span class="q8-m"><span>' + ic('package') + '<b class="num">' + v.pkgs + '</b></span><span>' + ic('layers') + '<b class="num">' + pcs(v.qty) + '</b></span><span>' + ic('scale') + '<b class="num">' + kg(v.kg) + '</b></span><span>' + ic(v.qcSt === 'pass' ? 'checkc' : 'alert') + '<b>QC ' + esc(v.qcSt || '—') + '</b></span>' +
          (fail.length && s0 !== 'released' ? '<span class="t-warn">' + ic('alert') + '<b>' + fail.map(function (x) { return T(x.n); }).join(', ') + '</b></span>' : '') + (r.dlv ? '<span>' + ic('truck') + '<b class="mono6">' + esc(r.dlv) + '</b></span>' : '') + '</span></span>' +
          '<span class="q8-r">' + relC(r) + ic('chevr', 'q8-go') + '</span></a>';
      });
      return A.pageHead(null, t(L('Barang siap kirim dari produksi. Lepas ke Logistics hanya setelah semua cek lulus.', 'Ready goods from production. Release to Logistics only after every check passes.'))) +
        bigCount([
          { k: L('Menunggu Release', 'Waiting Release'), v: by.waiting.length, icon: 'clock', go: 'REL-001', qs: 'tab=waiting' }, { k: L('Siap Release', 'Ready'), v: by.ready.length, icon: 'checkc', tone: by.ready.length ? 'ok' : '', go: 'REL-001', qs: 'tab=ready' },
          { k: L('Ditahan', 'Hold'), v: by.hold.length, icon: 'pause', tone: by.hold.length ? 'warn' : '', go: 'REL-001', qs: 'tab=hold' }, { k: L('Ada Masalah', 'Issue'), v: by.issue.length, icon: 'alert', tone: by.issue.length ? 'crit' : '', go: 'REL-001', qs: 'tab=issue' },
          { k: L('Di-release hari ini', 'Released today'), v: relToday.length, icon: 'truck', go: 'REL-001', qs: 'tab=released' }
        ]) +
        tabs([['open', L('Belum di-release', 'Not released'), 'inbox', all.length - by.released.length], ['waiting', L('Menunggu', 'Waiting'), 'clock', by.waiting.length], ['ready', L('Siap', 'Ready'), 'checkc', by.ready.length], ['hold', L('Ditahan', 'Hold'), 'pause', by.hold.length], ['issue', L('Masalah', 'Issue'), 'alert', by.issue.length], ['released', L('Di-release', 'Released'), 'truck', by.released.length]], tab, 'tab', { def: 'open' }) +
        dlist(rows, c.s.emp);
    }
  };

  /* ================= NP-01 · REL-002 Release Detail ================= */
  function windowDlg(r, v) {
    dlg({ title: L('Ubah jadwal kirim', 'Change the delivery schedule'), icon: 'calendar', sub: '<b>' + esc(r.id) + '</b> · ' + pname(v.prop),
      body: '<div class="f6-g">' + fld(L('Tanggal', 'Date'), inp('date', v.date && v.date >= E.TODAY ? v.date : E.TODAY, { type: 'date' }), { req: true }) + fld(L('Jam mulai', 'From'), inp('w0', v.win ? v.win[0] : '14:00', { type: 'time' }), { req: true }) + fld(L('Jam selesai', 'To'), inp('w1', v.win ? v.win[1] : '15:00', { type: 'time' }), { req: true }) + '</div>' + fld(L('Alasan', 'Reason'), inp('reason', ''), { req: true, wide: true }),
      onOk: function (x) { var res = E.setRelWindow(cx(), r.id, x.date, [x.w0, x.w1], x.reason); if (!res.ok) return res.msg; after(L('Jadwal kirim diperbarui.', 'Delivery schedule updated.')); return true; } });
  }
  V['REL-002'] = {
    title: function (rec) { return rec ? L('Release ' + rec, 'Release ' + rec) : null; },
    render: function (c) {
      var c0 = cx(), r = E.rel(c.rec);
      if (!r) return A.stateCard('empty', L('Data release tidak ditemukan.', 'Release record not found.'), A.backBtn());
      var v = E.relView(r), s0 = E.relSt(r), chk = E.relChecks(r), fail = chk.filter(function (x) { return !x.ok; }), hard = fail.filter(function (x) { return x.kind !== 'ovr'; }), ovr = fail.filter(function (x) { return x.kind === 'ovr'; });
      var canRel = can('dlv.release'), b = v.b;
      var facts = [[L('Paket', 'Packages'), v.pkgs, 'num'], [L('Jumlah', 'Quantity'), pcs(v.qty), 'num'], [L('Berat', 'Weight'), kg(v.kg), 'num'], [L('QC', 'QC'), v.qcSt === 'pass' ? t(L('Lulus', 'Passed')) : esc(v.qcSt || '—')], [L('Batas SLA', 'SLA due'), esc(v.sla ? when(String(v.sla).replace('T', ' ').slice(0, 16)) : '—')]];
      var h = hero({ id: r.id + ' · ' + v.batch, icon: 'package', title: pname(v.prop), sub: cname(v.cl) + ' · ' + (v.ord ? t(L('Order ', 'Order ')) + '<b class="mono6">' + esc(v.ord) + '</b> · ' : '') + (v.date ? esc(G.day(v.date)) + (v.win ? ' · <span class="num">' + esc(v.win.join('–')) + '</span>' : '') : ''), chips: relC(r) + priC(v.pri) + (v.live ? A.chip('info', L('Live dari produksi', 'Live from production'), 'factory') : A.chip('mute', L('Snapshot produksi', 'Production snapshot'))), facts: facts });
      var info = card(L('Detail release', 'Release detail'), kv([[L('Order', 'Order'), oLink(v.ord)], [L('Klien', 'Client'), cname(v.cl)], [L('Property', 'Property'), pname(v.prop)], [L('Layanan', 'Service'), esc(E.svcName(v.svc))], [L('Batch', 'Batch'), v.live ? bLink(v.batch) : esc(v.batch)],
        [L('Status QC', 'QC status'), A.chip(v.qcSt === 'pass' ? 'ok' : 'warn', v.qcSt === 'pass' ? L('Lulus', 'Passed') : L('Sebagian', 'Partial'))], [L('Label', 'Label'), v.label ? A.chip('ok', L('Lengkap', 'Complete')) : A.chip('warn', L('Belum dikonfirmasi', 'Not confirmed'))], [L('Instruksi', 'Instructions'), esc(T(v.instr) || '—')],
        b && b.pack ? [L('Rincian paket', 'Packages'), b.pack.pkgs.map(function (p, i) { return '<span class="pk9">' + (i + 1) + ' · ' + kg(p.kg) + '</span>'; }).join(' ')] : null]), { icon: 'file' });
      var ck = card(L('Checklist release', 'Release checklist'), checks(chk) + (ovr.length && !hard.length && s0 !== 'released' ? note(t(L('Cek kuning boleh di-override supervisor dengan alasan. Override tercatat dengan nama, peran dan waktu.', 'Amber checks can be overridden by a supervisor with a reason. The override is recorded with name, role and time.')), 'shield', 'warn') : ''), { icon: 'checkc', count: (chk.length - fail.length) + '/' + chk.length });
      var extra = '';
      if (r.hold && s0 === 'hold') extra += note('<b>' + t(L('Ditahan: ', 'On hold: ')) + '</b>' + esc(T(r.hold.reason || r.hold)) + (r.hold.by ? ' · ' + first(r.hold.by) : ''), 'pause', 'warn');
      if (s0 === 'issue') extra += note('<b>' + t(L('Masalah: ', 'Issue: ')) + '</b>' + esc(T(r.issue || L('Masalah kritis terbuka', 'Critical issue open'))), 'alert', 'crit');
      if (r.ovr) extra += note('<b>' + t(L('Override: ', 'Override: ')) + '</b>' + esc(r.ovr.reason) + ' · ' + esc(r.ovr.name || E.empName(r.ovr.by)) + ' (' + esc(r.ovr.role || '') + ') · ' + esc(r.ovr.at) + ' · ' + t(L('celah: ', 'gaps: ')) + esc(r.ovr.gaps.join(', ')), 'shield', 'warn');
      if (s0 === 'released') extra += note(t(L('Di-release ke Logistics ', 'Released to Logistics ')) + esc(when(r.relAt)) + ' · ' + first(r.relBy) + (r.dlv ? ' · ' + dLink(r.dlv, t(L('Buka delivery ', 'Open delivery ')) + esc(r.dlv)) : ''), 'truck', 'ok');
      var side = '';
      if (canRel && s0 !== 'released') {
        if (s0 === 'hold') side += xl('blue', L('LEPAS HOLD', 'RELEASE HOLD'), 'play', { act: 'unhold', val: r.id });
        else if (s0 === 'issue') side += xl('blue', L('MASALAH SELESAI', 'ISSUE RESOLVED'), 'checkc', { act: 'resolve', val: r.id });
        else {
          if (!v.label && !v.live) side += A.btn('ghost', L('Konfirmasi Label', 'Confirm Label'), 'tag', { act: 'label', val: r.id });
          if (!v.live && fail.some(function (x) { return x.k === 'date' || x.k === 'win'; })) side += A.btn('ghost', L('Ubah Jadwal', 'Change Schedule'), 'calendar', { act: 'win', val: r.id });
          side += A.btn('ghost', 'HOLD', 'pause', { act: 'hold', val: r.id }) + A.btn('danger', L('ADA MASALAH', 'REPORT ISSUE'), 'alert', { act: 'issue', val: r.id });
        }
      }
      var main = canRel && ['waiting', 'ready'].indexOf(s0) >= 0 ? (hard.length ? xl('primary', L('RELEASE KE LOGISTICS', 'RELEASE TO LOGISTICS'), 'truck', { act: 'release', val: r.id, cls: 'is-off' }) : xl('primary', ovr.length ? L('OVERRIDE & RELEASE', 'OVERRIDE & RELEASE') : L('RELEASE KE LOGISTICS', 'RELEASE TO LOGISTICS'), 'truck', { act: 'release', val: r.id })) : '';
      return h + extra + '<div class="g2-9">' + info + ck + '</div>' + (main || side ? abar(main, side) : '');
    },
    act: {
      release: function (el) {
        var id = el.getAttribute('data-val'), r = E.rel(id), chk = E.relChecks(r), fail = chk.filter(function (x) { return !x.ok; }), hard = fail.filter(function (x) { return x.kind !== 'ovr'; });
        function done(res) { A.success(L('Di-release ke Logistics.', 'Released to Logistics.'), { l: L('Buka Delivery', 'Open Delivery'), go: 'DISP-002', rec: res.dlv.id, icon: 'truck' }, { l: L('Antrian Siap Kirim', 'Ready Queue'), go: 'REL-001' }, esc(res.dlv.id) + (res.dlv.ord ? ' · ' + esc(res.dlv.ord) : '') + ' · ' + t(L('Dispatcher menerima tugas delivery baru.', 'The dispatcher receives a new delivery task.'))); }
        if (hard.length) return A.toast(L('Belum bisa release: ' + hard.map(function (x) { return T(x.n); }).join(', ') + '.', 'Cannot release yet: ' + hard.map(function (x) { return x.n[1]; }).join(', ') + '.'), 'crit');
        if (fail.length) {
          if (!can('dlv.override')) return A.toast(L('Perlu override supervisor.', 'A supervisor override is needed.'), 'crit');
          return reasonDlg({ title: L('Override & release', 'Override & release'), icon: 'shield', sub: t(L('Celah: ', 'Gaps: ')) + fail.map(function (x) { return T(x.n); }).join(', '), label: L('Alasan override', 'Override reason'), ok: L('OVERRIDE & RELEASE', 'OVERRIDE & RELEASE'),
            fn: function (reason) { return E.release(cx(), id, { reason: reason }); }, done: L('Di-release dengan override.', 'Released with an override.'), then: function (res) { setTimeout(function () { done(res); }, 300); } });
        }
        var res = E.release(cx(), id, {}); if (!res.ok) return fail(res); done(res);
      },
      hold: function (el) { var id = el.getAttribute('data-val'); reasonDlg({ title: L('Tahan release', 'Hold the release'), icon: 'pause', label: L('Alasan hold', 'Hold reason'), fn: function (x) { return E.holdRel(cx(), id, x); }, done: L('Release ditahan.', 'Release on hold.') }); },
      unhold: function (el) { var id = el.getAttribute('data-val'); reasonDlg({ title: L('Lepas hold', 'Release the hold'), icon: 'play', label: L('Catatan', 'Note'), fn: function (x) { return E.unholdRel(cx(), id, x); }, done: L('Hold dilepas.', 'Hold released.') }); },
      issue: function (el) {
        var id = el.getAttribute('data-val');
        dlg({ title: L('Ada masalah sebelum release', 'Issue before release'), icon: 'alert', ok: L('SIMPAN MASALAH', 'SAVE ISSUE'), body: fld(L('Tingkat', 'Severity'), choice('sev', [['crit', L('Kritis · tahan release', 'Critical · block release'), 'alert', 'crit'], ['warn', L('Peringatan', 'Warning'), 'bell', 'warn']], 'crit'), { wide: true }) + fld(L('Apa masalahnya?', 'What is the issue?'), area('note', ''), { req: true, wide: true }) + fld(L('Foto', 'Photo'), G.photoIn('rel9'), { wide: true }),
          onOk: function (x, el2) { x = vals(el2); var r = E.relIssue(cx(), id, { note: x.note, sev: x.sev, photo: G.photos('rel9')[0] || null }); if (!r.ok) return r.msg; G.resetPh('rel9'); after(L('Masalah tercatat, supervisor diberi tahu.', 'Issue recorded, supervisor notified.'), 'warn'); return true; } });
      },
      resolve: function (el) { var id = el.getAttribute('data-val'); reasonDlg({ title: L('Masalah selesai', 'Issue resolved'), icon: 'checkc', label: L('Penyelesaian', 'Resolution'), fn: function (x) { return E.resolveRelIssue(cx(), id, x); }, done: L('Masalah selesai. Cek ulang lalu release.', 'Issue resolved. Re-check, then release.') }); },
      label: function (el) { var r = E.confirmLabel(cx(), el.getAttribute('data-val')); if (!r.ok) return fail(r); after(L('Label + QR dikonfirmasi.', 'Label + QR confirmed.')); },
      win: function (el) { var r = E.rel(el.getAttribute('data-val')); windowDlg(r, E.relView(r)); }
    }
  };

  /* ================= NP-02 · DISP-001 Delivery Dispatch Board ================= */
  function laneCard(d) {
    var o = E.order(d.ord), e = d.ord ? E.eta(d) : null;
    return '<a class="ln9-c' + (d.rec && d.rec.review === 'pending' ? ' is-crit' : E.late(d) ? ' is-warn' : '') + '" href="' + href('DISP-002', d.id) + '"><span class="ln9-h"><b class="mono6">' + esc(d.id) + '</b>' + priC(d.pri) + (d.hold ? A.chip('warn', L('Hold', 'Hold'), 'pause') : '') + '</span>' +
      '<b class="ln9-t">' + pname(d.prop) + '</b><span class="ln9-s">' + cname(d.cl) + '</span>' +
      '<span class="ln9-m"><span class="num">' + ic('clock') + esc(d.win.join('–')) + '</span><span class="num">' + ic('package') + d.pkgs + ' · ' + kg(d.kg) + '</span></span>' +
      '<span class="ln9-f">' + (E.driverOf(d) ? G.av(E.driverOf(d), 'av9') + '<span>' + first(E.driverOf(d)) + (E.vehOf(d) ? ' · ' + esc(E.vehOf(d)) : '') + '</span>' : '<span class="t-warn">' + ic('user') + t(L('Belum ada driver', 'No driver yet')) + '</span>') +
      (e && !e.arrived && ['ontheway', 'near'].indexOf(E.status(d)) >= 0 ? '<b class="num ln9-eta">ETA ' + esc(E.hm(e.at)) + '</b>' : '') + (o ? '' : '') + '</span></a>';
  }
  V['DISP-001'] = {
    render: function (c) {
      var c0 = cx(), b = E.board(c0), att = E.attention(c0), view = c.q.v || 'board';
      var all = [].concat.apply([], E.LANES.map(function (l) { return b[l[0]]; }));
      var counts = bigCount(E.LANES.map(function (l, i) { return { k: l[1], v: b[l[0]].length, icon: l[2], tone: l[0] === 'exception' && b[l[0]].length ? 'crit' : l[0] === 'waiting' && b[l[0]].length ? 'warn' : l[0] === 'delivered' ? 'ok' : '' }; }));
      var attHtml = att.length ? card(L('Perlu perhatian', 'Needs attention'), '<ul class="at9">' + att.slice(0, 8).map(function (a) {
        var link = a.dlv ? href(a.kind === 'recdiff' ? 'REC-001' : a.kind === 'complete' ? 'COMP-001' : 'DISP-002', a.dlv) : a.ret ? href('RETURN-001', a.ret) : a.rel ? href('REL-002', a.rel) : '#';
        return '<li class="at9-' + a.sev + '"><a href="' + link + '">' + ic(a.sev === 'info' ? 'info' : 'alert') + '<span><b>' + t(E.ATT_KIND[a.kind]) + '</b><small>' + t(a.txt) + '</small></span>' + ic('chevr') + '</a></li>';
      }).join('') + '</ul>', { icon: 'bell', count: att.length }) : '';
      var board = '<div class="ln9">' + E.LANES.map(function (l) { return '<section class="ln9-l ln9-' + l[0] + '"><h3>' + ic(l[2]) + '<span>' + t(l[1]) + '</span><b class="num">' + b[l[0]].length + '</b></h3>' + (b[l[0]].length ? b[l[0]].map(laneCard).join('') : '<p class="ln9-e">' + t(L('Kosong', 'Empty')) + '</p>') + '</section>'; }).join('') + '</div>';
      var tbl = A.list(all, [
        { h: L('Delivery', 'Delivery'), v: function (d) { return '<b class="mono6">' + esc(d.id) + '</b>'; } }, { h: L('Klien / Property', 'Client / Property'), v: function (d) { return cname(d.cl) + '<br><small>' + pname(d.prop) + '</small>'; } },
        { h: L('Paket', 'Pkg'), cls: 'num', v: function (d) { return d.pkgs; } }, { h: L('Berat', 'Weight'), cls: 'num', v: function (d) { return kg(d.kg); } }, { h: L('Jadwal', 'Window'), cls: 'num', v: function (d) { return esc(d.win.join('–')); } },
        { h: L('Driver', 'Driver'), v: function (d) { return first(E.driverOf(d)); } }, { h: L('Status', 'Status'), v: stC }
      ], function (d) { return { t: esc(d.id) + ' · ' + pname(d.prop), r: esc(d.win.join('–')), s: cname(d.cl) + ' · ' + d.pkgs + ' pkg · ' + kg(d.kg), chip: stC(d) }; }, function (d) { return href('DISP-002', d.id); });
      return A.pageHead(null, esc(G.day(E.TODAY)) + ' · ' + t(L('Driver, kendaraan dan rute diatur lewat engine Fase 7; status delivery mengikuti trip secara langsung.', 'Driver, vehicle and route run through the Phase 7 engine; delivery status follows the trip directly.')),
        A.pbtn('dlv.release.view', 'ghost', L('Siap Kirim', 'Ready Release'), 'package', { go: 'REL-001' }) + (H.open('DISPATCH-001') ? A.btn('ghost', L('Dispatch Fase 7', 'Phase 7 Dispatch'), 'columns', { go: 'DISPATCH-001' }) : '') + (H.open('TRACK-001') ? A.btn('ghost', L('Live Tracking', 'Live Tracking'), 'pin', { go: 'TRACK-001' }) : '')) +
        counts + attHtml + tabs([['board', L('Papan', 'Board'), 'columns'], ['list', L('Daftar', 'List'), 'list', all.length]], view, 'v', { def: 'board' }) + (view === 'list' ? tbl : board);
    }
  };

  /* ================= NP-02 · DISP-002 Delivery Detail ================= */
  function issueMini(i) { return '<li>' + sevC(i.sev) + '<span><b>' + t(E.ISSUE_TYPES[i.type] ? E.ISSUE_TYPES[i.type][0] : L(i.type, i.type)) + '</b><small>' + esc(T(i.note)) + ' · ' + esc(when(i.at)) + '</small></span>' + issC(i) + '</li>'; }
  V['DISP-002'] = {
    title: function (rec) { return rec ? L('Delivery ' + rec, 'Delivery ' + rec) : null; },
    render: function (c) {
      var c0 = cx(), d = E.dlv(c.rec);
      if (!d) return A.stateCard('empty', L('Delivery tidak ditemukan.', 'Delivery not found.'), A.backBtn());
      if (!E.canSee(c0, d)) return A.stateCard('noperm', L('Anda tidak memiliki akses ke delivery ini.', 'You do not have access to this delivery.'), A.backBtn());
      E.sync();
      var s0 = E.status(d), o = E.order(d.ord), canD = can('dlv.dispatch'), pre = ['waiting', 'assigned', 'ready'].indexOf(d.st) >= 0;
      var steps = [L('Siap', 'Ready'), L('Ditugaskan', 'Assigned'), L('Di jalan', 'On the way'), L('Tiba', 'Arrived'), L('Terkirim', 'Delivered'), L('Selesai', 'Completed')];
      var si = { waiting: 0, assigned: 1, ready: 1, ontheway: 2, near: 2, arrived: 3, handover: 3, delivered: 4, issue: d.pod ? 4 : 3, completed: 6, returned: 3, cancelled: 0 }[s0];
      var h = dhero(d, { extra: P8.step8(steps, si) });
      var live = o && ['ontheway', 'arrived', 'inprogress'].indexOf(o.st) >= 0 ? card(L('Live dari Fase 7', 'Live from Phase 7'), '<div id="eta9">' + G.etaBox(o, { big: true }) + '</div>' + G.map({ trips: [E.tripOf(d)].filter(Boolean), drivers: G.driverMarks(c0, [E.tripOf(d)].filter(Boolean)), fit: true, focus: E.tripOf(d) && E.tripOf(d).id, stopLabels: true, cls: 'm9' }), { icon: 'pin' }) : '';
      var info = card(L('Detail delivery', 'Delivery detail'), kv([[L('Order', 'Order'), dOrd(d)], [L('Release', 'Release'), d.rel ? lnk('REL-002', d.rel, '<span class="mono6">' + esc(d.rel) + '</span>') : '—'], [L('Batch', 'Batch'), bLink(d.batch)], [L('Layanan', 'Service'), esc(E.svcName(d.svc))],
        [L('Jadwal', 'Window'), win(d)], [L('Driver', 'Driver'), emp(E.driverOf(d))], [L('Kendaraan', 'Vehicle'), esc(E.vehOf(d) || '—')], [L('Rute', 'Route'), esc(E.routeOf(d) || '—')], [L('Kontak', 'Contact'), esc((E.contact(d.ct) || {}).n || '—')],
        [L('Instruksi', 'Instructions'), esc(T(d.instr) || '—')], [L('SLA', 'SLA'), slaC(d.sla)], d.hold ? [L('Hold', 'Hold'), esc(T(d.hold.reason)) + ' · ' + first(d.hold.by)] : null]), { icon: 'file' });
      var pod = d.pod ? (function () { var p = E.podView(d.pod); return card(L('Bukti pengiriman', 'Proof of delivery'), kv([[L('No. POD', 'POD no.'), lnk('DLV-POD-002', d.id, '<span class="mono6">' + esc(p.id) + '</span>') + (p.ver > 1 ? ' · v' + p.ver : '')], [L('Penerima', 'Recipient'), esc(p.recv) + (p.role ? ' · ' + esc(p.role) : '')], [L('Waktu', 'Time'), esc(when(p.at))], [L('Paket', 'Packages'), p.pkgs + ' / ' + d.pkgs], [L('Kondisi', 'Condition'), A.chip(E.COND[p.cond][1], E.COND[p.cond][0])]]), { icon: 'sign', link: ['DLV-POD-002', L('Detail', 'Detail'), d.id] }); })() : '';
      var rec = d.rec ? card(L('Rekonsiliasi', 'Reconciliation'), recC(d.rec) + compare(d), { icon: 'scale', link: ['REC-001', L('Detail', 'Detail'), d.id] }) : '';
      var iss = d.issues.length ? card(L('Masalah', 'Issues'), '<ul class="im9">' + d.issues.map(E.issue).filter(Boolean).map(issueMini).join('') + '</ul>', { icon: 'alert', count: d.issues.length, link: ['DLV-ISSUE-001', L('Kelola', 'Manage'), d.id] }) : '';
      var chain = E.chain(d.id), ch = chain.length > 1 ? card(L('Rantai pengiriman', 'Delivery chain'), '<ol class="chn9">' + chain.map(function (x) { return '<li' + (x.dlv.id === d.id ? ' class="is-cur"' : '') + '>' + dLink(x.dlv.id) + ' · ' + esc(x.dlv.date) + ' · ' + stC(x.dlv) + (x.ret ? ' · ' + lnk('RETURN-001', x.ret.id, esc(x.ret.id)) : '') + '</li>'; }).join('') + '</ol>', { icon: 'refresh', link: ['REDEL-001', L('Detail', 'Detail'), d.id] }) : '';
      var close = (d.pod || d.comp) ? card(L('Penyelesaian & billing', 'Completion & billing'), kv([[L('Service completion', 'Service completion'), d.comp ? A.chip('ok', L('Selesai v' + d.comp.ver, 'Completed v' + d.comp.ver)) + ' · ' + esc(when(d.comp.at)) : A.chip('appr', L('Belum', 'Not yet'))], [L('Billing', 'Billing'), billC(d) + (d.bill && d.bill.id ? ' · <span class="mono6">' + esc(d.bill.id) + '</span>' : '')]]) +
        '<p class="hr8-x">' + lnk('COMP-001', d.id, t(L('Buka completion', 'Open completion'))) + ' · ' + lnk('DLV-TIMELINE-001', d.id, t(L('Timeline lengkap', 'Full timeline'))) + (d.comp ? ' · ' + lnk('BILL-002', d.id, t(L('Validasi billing', 'Billing validation'))) : '') + '</p>', { icon: 'checkc' }) : '';
      var docs = card(L('Dokumen', 'Documents'), docBtns(d), { icon: 'print' });
      var side = '', main = '';
      if (canD && pre && d.st !== 'cancelled') {
        if (!d.ord) main = xl('primary', L('BUAT TUGAS DISPATCH', 'CREATE DISPATCH TASK'), 'truck', { act: 'link', val: d.id });
        else if (!E.tripOf(d)) main = xl('primary', L('Tugaskan Driver', 'Assign Driver'), 'user', { act: 'assign', val: d.id });
        else side += A.btn('ghost', L('Ganti Driver', 'Reassign'), 'user', { act: 'assign', val: d.id });
        side += A.btn('ghost', L('Ubah Jadwal', 'Change Window'), 'calendar', { act: 'resched', val: d.id }) + (d.hold ? A.btn('blue', L('Lepas Hold', 'Release Hold'), 'play', { act: 'unhold', val: d.id }) : A.btn('ghost', 'Hold', 'pause', { act: 'hold', val: d.id })) + A.btn('danger', L('Batal', 'Cancel'), 'xc', { act: 'cancel', val: d.id });
      }
      if (d.ord && H.open('TRACK-002') && o && ['ontheway', 'arrived', 'inprogress'].indexOf(o.st) >= 0) side += A.btn('ghost', L('Buka Tracking', 'Open Tracking'), 'pin', { go: 'TRACK-002', rec: d.ord });
      if (d.ord && H.open('CHAT-001')) side += A.btn('ghost', L('Hubungi Klien', 'Contact Client'), 'message', { go: 'CHAT-001', rec: d.ord });
      return h + (d.hold ? note('<b>' + t(L('Ditahan: ', 'On hold: ')) + '</b>' + esc(T(d.hold.reason)), 'pause', 'warn') : '') + live + '<div class="g2-9">' + info + (pod || rec ? '<div class="col9">' + pod + rec + '</div>' : docs) + '</div>' + iss + ch + close + (pod || rec ? docs : '') + (main || side ? abar(main, side) : '');
    },
    after: function (c) { var d = E.dlv(c.rec), o = d && E.order(d.ord); if (o && ['ontheway', 'arrived', 'inprogress'].indexOf(o.st) >= 0) G.live('eta9', function () { return G.etaBox(E.order(d.ord), { big: true }); }, 10); },
    act: Object.assign({
      link: function (el) { var r = E.dispatchLink(cx(), el.getAttribute('data-val')); if (!r.ok) return fail(r); after(L('Tugas dispatch ' + r.ord + ' dibuat di Fase 7.', 'Dispatch task ' + r.ord + ' created in Phase 7.')); },
      assign: function (el) { var d = E.dlv(el.getAttribute('data-val')); G.assignDlg(d.ord); },
      resched: function (el) {
        var d = E.dlv(el.getAttribute('data-val'));
        dlg({ title: L('Ubah jendela kirim', 'Change the delivery window'), icon: 'calendar', sub: '<b>' + esc(d.id) + '</b> · ' + pname(d.prop),
          body: '<div class="f6-g">' + fld(L('Tanggal', 'Date'), inp('date', d.date < E.TODAY ? E.TODAY : d.date, { type: 'date' }), { req: true }) + fld(L('Jam mulai', 'From'), inp('w0', d.win[0], { type: 'time' }), { req: true }) + fld(L('Jam selesai', 'To'), inp('w1', d.win[1], { type: 'time' }), { req: true }) + '</div>' + fld(L('Alasan', 'Reason'), inp('reason', ''), { req: true, wide: true, hint: t(L('Klien menerima jadwal baru.', 'The client receives the new schedule.')) }),
          onOk: function (x) { var r = E.setWindow(cx(), d.id, x.date, [x.w0, x.w1], x.reason); if (!r.ok) return r.msg; after(L('Jadwal baru tersimpan.', 'New window saved.')); return true; } });
      },
      hold: function (el) { var id = el.getAttribute('data-val'); reasonDlg({ title: L('Tahan delivery', 'Hold the delivery'), icon: 'pause', label: L('Alasan', 'Reason'), fn: function (x) { return E.holdDlv(cx(), id, x); }, done: L('Delivery ditahan. Driver tidak bisa berangkat.', 'Delivery on hold. The driver cannot leave.') }); },
      unhold: function (el) { var id = el.getAttribute('data-val'); reasonDlg({ title: L('Lepas hold', 'Release the hold'), icon: 'play', label: L('Catatan', 'Note'), fn: function (x) { return E.unholdDlv(cx(), id, x); }, done: L('Hold dilepas.', 'Hold released.') }); },
      cancel: function (el) { var id = el.getAttribute('data-val'); reasonDlg({ title: L('Batalkan delivery', 'Cancel the delivery'), icon: 'xc', label: L('Alasan pembatalan', 'Cancellation reason'), ok: L('Batalkan', 'Cancel delivery'), fn: function (x) { return E.cancelDlv(cx(), id, x); }, done: L('Delivery dibatalkan.', 'Delivery cancelled.') }); }
    }, DOC_ACT)
  };

  /* ================= NP-05 · DLV-POD-002 POD Detail ================= */
  V['DLV-POD-002'] = {
    title: function () { return L('Detail POD', 'POD Detail'); },
    render: function (c) {
      var d = E.dlv(c.rec);
      if (!d || !d.pod) return A.stateCard('empty', L('POD belum ada untuk delivery ini.', 'No POD for this delivery yet.'), A.backBtn());
      if (!E.canSee(cx(), d)) return A.stateCard('noperm', L('Anda tidak memiliki akses.', 'You do not have access.'), A.backBtn());
      var p = d.pod, v = E.podView(p);
      var h = dhero(d, { icon: 'sign', chips: A.chip('ok', L('POD TERSIMPAN', 'POD SAVED'), 'checkc') + (p.ver > 1 ? A.chip('appr', 'v' + p.ver) : ''), facts: [[L('No. POD', 'POD no.'), esc(p.id)], [L('Penerima', 'Recipient'), esc(v.recv)], [L('Waktu', 'Time'), esc(when(p.at))], [L('Paket', 'Packages'), v.pkgs + ' / ' + d.pkgs, 'num'], [L('Driver', 'Driver'), first(p.by)]] });
      var det = card(L('Data POD', 'POD data'), kv([[L('Nama penerima', 'Recipient name'), esc(v.recv)], [L('Jabatan', 'Role'), esc(v.role || '—')], [L('Waktu', 'Time'), esc(p.at)], [L('Lokasi', 'Location'), p.loc ? t(L('Tercatat saat serah terima', 'Recorded at handover')) : t(L('Tidak diizinkan', 'Not permitted'))], [L('Paket diterima', 'Packages received'), v.pkgs + ' / ' + d.pkgs], [L('Jumlah', 'Quantity'), pcs(v.qty)], [L('Berat', 'Weight'), kg(v.kg)], [L('Kondisi', 'Condition'), A.chip(E.COND[v.cond][1], E.COND[v.cond][0])], [L('Catatan', 'Notes'), esc(v.notes || '—')], [L('Order / Delivery', 'Order / Delivery'), oLink(d.ord) + ' · ' + dLink(d.id)]]), { icon: 'file' });
      var ev = card(L('Bukti', 'Evidence'), '<div class="pe9"><figure>' + (p.sign && /^data:image/.test(p.sign) ? '<img class="im7 sg9" src="' + p.sign + '" alt="">' : img('seed:pod', 'sign')) + '<figcaption>' + t(L('Tanda tangan penerima', 'Recipient signature')) + '</figcaption></figure><figure>' + img(p.photo, 'POD') + '<figcaption>' + t(L('Foto serah terima', 'Handover photo')) + '</figcaption></figure><figure class="pe9-q">' + P.qr(p.ref || 'JFRESH|POD|' + d.id) + '<figcaption class="mono6">' + esc(p.ref || 'JFRESH|POD|' + d.id) + '</figcaption></figure></div>', { icon: 'camera' });
      var am = p.amend.length ? card(L('Amandemen', 'Amendments'), '<div class="tblw"><table class="tbl dense"><thead><tr><th>#</th><th>' + t(L('Data', 'Field')) + '</th><th>' + t(L('Dari', 'From')) + '</th><th>' + t(L('Menjadi', 'To')) + '</th><th>' + t(L('Alasan', 'Reason')) + '</th><th>' + t(L('Oleh', 'By')) + '</th><th>' + t(L('Waktu', 'Time')) + '</th></tr></thead><tbody>' +
        p.amend.map(function (a) { return '<tr><td class="num">' + a.n + '</td><td>' + t(E.POD_FIELDS[a.field]) + '</td><td>' + esc(String(a.from)) + '</td><td><b>' + esc(String(a.to)) + '</b></td><td>' + esc(a.reason) + '</td><td>' + first(a.by) + '</td><td class="num">' + esc(when(a.at)) + '</td></tr>'; }).join('') + '</tbody></table></div>' + note(t(L('POD asli tetap tersimpan; amandemen hanya menambah versi.', 'The original POD stays stored; amendments only add a version.')), 'lock'), { icon: 'edit', count: p.amend.length }) : '';
      var side = docBtns(d), main = can('dlv.pod.amend') && !(d.comp && d.comp.frozen) ? A.btn('blue', L('Koreksi POD', 'Amend POD'), 'edit', { act: 'amend', val: d.id }) : '';
      return h + '<div class="g2-9">' + det + ev + '</div>' + am + (d.comp && d.comp.frozen ? note(t(L('Service sudah completed: POD terkunci. Koreksi lewat amandemen completion.', 'Service is completed: the POD is locked. Correct it through a completion amendment.')), 'lock', 'info') : '') + abar(main, side);
    },
    act: Object.assign({
      amend: function (el) {
        var id = el.getAttribute('data-val');
        dlg({ title: L('Koreksi POD', 'Amend POD'), icon: 'edit', sub: t(L('Aslinya tetap tersimpan. Setiap koreksi butuh alasan.', 'The original stays. Every correction needs a reason.')),
          body: fld(L('Data', 'Field'), sel('field', Object.keys(E.POD_FIELDS).map(function (k) { return [k, E.POD_FIELDS[k]]; }), 'recv'), { req: true, wide: true }) + fld(L('Nilai baru', 'New value'), inp('value', ''), { req: true, wide: true, hint: t(L('Kondisi: good / note / damaged / partial', 'Condition: good / note / damaged / partial')) }) + fld(L('Alasan', 'Reason'), area('reason', ''), { req: true, wide: true }),
          onOk: function (x) { var r = E.amendPod(cx(), id, x); if (!r.ok) return r.msg; after(L('Amandemen POD tersimpan · v' + r.pod.ver, 'POD amendment saved · v' + r.pod.ver)); return true; } });
      }
    }, DOC_ACT)
  };

  /* ================= NP-06 · REC-001 Delivery Reconciliation ================= */
  function recDetail(d) {
    var rec = d.rec, ok = rec.res === 'ok', pend = rec.review === 'pending';
    var res = '<section class="card rs9 rs9-' + (ok ? 'ok' : pend ? 'crit' : 'warn') + '"><span class="rs9-ic">' + ic(ok ? 'checkc' : 'alert') + '</span><div><h2>' + t(ok ? L('SESUAI', 'MATCHED') : L('ADA SELISIH', 'DIFFERENCE')) + '</h2><p>' + t(ok ? L('Jumlah paket dan item sesuai.', 'Package and item counts match.') : L(T(E.REC_TYPES[rec.type] || L('Selisih', 'Difference')) + ' · ' + T(rec.reason || ''), (E.REC_TYPES[rec.type] || L('Difference', 'Difference'))[1] + ' · ' + T(rec.reason || ''))) + '</p></div>' + (rec.review ? A.chip(E.REV_ST[rec.review][1], E.REV_ST[rec.review][0]) : '') + '</section>';
    var det = card(L('Dikirim vs diterima', 'Dispatched vs received'), compare(d) + kv([[L('Keputusan penerimaan', 'Acceptance'), A.chip(E.ACC[rec.acc][1], E.ACC[rec.acc][0], E.ACC[rec.acc][2])], rec.acc === 'partial' ? [L('Diterima / ditolak', 'Accepted / rejected'), pcs(rec.accQty) + ' / ' + pcs(rec.rejQty)] : null, rec.pic ? [L('PIC klien', 'Client PIC'), esc(rec.pic)] : null, rec.notes ? [L('Catatan', 'Notes'), esc(rec.notes)] : null,
      rec.revBy ? [L('Review', 'Review'), first(rec.revBy) + ' · ' + esc(when(rec.revAt)) + ' · ' + esc(T(rec.revNote || ''))] : null, d.ret ? [L('Return', 'Return'), lnk('RETURN-001', d.ret, esc(d.ret))] : null, d.redel ? [L('Kirim ulang', 'Redelivery'), dLink(d.redel)] : null]), { icon: 'scale' });
    var ev = card(L('Foto bukti', 'Photo evidence'), '<div class="pe9">' + (d.pod ? '<figure>' + img(d.pod.photo, 'POD') + '<figcaption>POD</figcaption></figure>' : '') + (rec.photo ? '<figure>' + img(rec.photo, 'diff') + '<figcaption>' + t(L('Selisih', 'Difference')) + '</figcaption></figure>' : '') + '</div>', { icon: 'camera' });
    var main = pend && can('dlv.rec.review') ? xl('primary', L('SETUJUI SELISIH', 'APPROVE DIFFERENCE'), 'checkc', { act: 'approve', val: d.id }) : '';
    var side = pend && can('dlv.rec.review') ? A.btn('blue', L('Setujui & Kirim Ulang yang Kurang', 'Approve & Redeliver Missing'), 'refresh', { act: 'redeliver', val: d.id }) : '';
    return dhero(d, { icon: 'scale', chips: recC(rec) }) + res + '<div class="g2-9">' + det + ev + '</div>' + (main || side ? abar(main, side) : '');
  }
  V['REC-001'] = {
    render: function (c) {
      var c0 = cx();
      if (c.rec) { var d = E.dlv(c.rec); if (!d || !E.canSee(c0, d)) return A.stateCard('noperm', L('Anda tidak memiliki akses.', 'You do not have access.'), A.backBtn()); if (!d.rec) return A.stateCard('empty', L('Delivery ini belum direkonsiliasi (belum ada POD).', 'This delivery is not reconciled yet (no POD).'), A.btn('blue', L('Buka Delivery', 'Open Delivery'), 'truck', { go: 'DISP-002', rec: d.id })); return recDetail(d); }
      var q = E.recQueue(c0), tab = c.q.tab || 'pending';
      var pend = q.filter(function (d) { return d.rec.review === 'pending'; }), diff = q.filter(function (d) { return d.rec.res === 'diff'; }), okL = q.filter(function (d) { return d.rec.res === 'ok'; });
      var list = tab === 'pending' ? pend : tab === 'diff' ? diff : tab === 'ok' ? okL : q;
      var tot = q.length, acc = tot ? Math.round(okL.length / tot * 1000) / 10 : null;
      return A.pageHead(null, t(L('Bandingkan yang dikirim plant dengan yang diterima klien. Selisih besar menunggu keputusan supervisor.', 'Compare what the plant sent with what the client received. Large differences wait for a supervisor decision.'))) +
        bigCount([{ k: L('Menunggu review', 'Waiting review'), v: pend.length, icon: 'alert', tone: pend.length ? 'crit' : '', go: 'REC-001' }, { k: L('Ada selisih', 'Differences'), v: diff.length, icon: 'scale', tone: diff.length ? 'warn' : '', go: 'REC-001', qs: 'tab=diff' }, { k: L('Sesuai', 'Matched'), v: okL.length, icon: 'checkc', tone: 'ok', go: 'REC-001', qs: 'tab=ok' }, { k: L('Akurasi', 'Accuracy'), v: acc == null ? '—' : acc + '%', icon: 'gauge' }]) +
        tabs([['pending', L('Menunggu review', 'Waiting review'), 'alert', pend.length], ['diff', L('Ada selisih', 'Difference'), 'scale', diff.length], ['ok', L('Sesuai', 'Matched'), 'checkc', okL.length], ['all', L('Semua', 'All'), 'list', tot]], tab, 'tab', { def: 'pending' }) +
        dlist(list.map(function (d) { return drow(d, { go: 'REC-001', icon: 'scale', right: recC(d.rec), meta: '<span>' + ic('sign') + '<b>' + (d.pod ? d.pod.pkgs : '—') + ' / ' + d.pkgs + '</b></span>' }); }), tab === 'pending' ? L('Tidak ada selisih yang menunggu review.', 'No difference is waiting for review.') : c.s.emp);
    },
    act: {
      approve: function (el) { var id = el.getAttribute('data-val'); reasonDlg({ title: L('Setujui selisih', 'Approve the difference'), icon: 'checkc', label: L('Catatan keputusan', 'Decision note'), fn: function (x) { return E.recReview(cx(), id, 'approve', { note: x }); }, done: L('Selisih disetujui. Delivery bisa diselesaikan.', 'Difference approved. The delivery can be completed.') }); },
      redeliver: function (el) {
        var id = el.getAttribute('data-val'), d = E.dlv(id), nowH = E.hm(E.now()), w0 = String(Math.min(20, +nowH.slice(0, 2) + 2)).padStart(2, '0') + ':00', w1 = String(Math.min(21, +nowH.slice(0, 2) + 3)).padStart(2, '0') + ':00';
        dlg({ title: L('Setujui & kirim ulang yang kurang', 'Approve & redeliver what is missing'), icon: 'refresh', sub: '<b>' + esc(d.id) + '</b> · ' + pname(d.prop) + ' · ' + t(L('kurang ', 'missing ')) + Math.max(0, d.pkgs - d.pod.pkgs) + ' ' + t(L('paket', 'pkg')),
          body: '<div class="f6-g">' + fld(L('Tanggal', 'Date'), inp('date', E.TODAY, { type: 'date' }), { req: true }) + fld(L('Jam mulai', 'From'), inp('w0', w0, { type: 'time' }), { req: true }) + fld(L('Jam selesai', 'To'), inp('w1', w1, { type: 'time' }), { req: true }) + '</div>' + fld(L('Catatan keputusan', 'Decision note'), area('note', ''), { req: true, wide: true }),
          onOk: function (x) { var r = E.recReview(cx(), id, 'redeliver', { note: x.note, date: x.date, win: [x.w0, x.w1] }); if (!r.ok) return r.msg; after(L('Disetujui. Pengiriman ulang ' + r.redel.id + ' dibuat.', 'Approved. Redelivery ' + r.redel.id + ' created.')); return true; } });
      }
    }
  };
})();
