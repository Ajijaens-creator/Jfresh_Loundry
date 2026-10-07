/* JFRESH OS — Phase 9 screens (part 2): the mobile screens. Driver handover (DRV-HO-001) and POD
   capture (DLV-POD-001), delivery issues ADA MASALAH (DLV-ISSUE-001), client delivery tracking
   (CLIENT-DEL-001) and client feedback (FEEDBACK-001). One-hand mobile layout: one decision per
   screen, the main action at the bottom. Trip start, arrival, route and ETA are Phase 7 actions
   called through its engine; the delivery engine adds handover, POD and reconciliation on top. */
(function () {
  var A = window.JFAPP, E = window.JFDLV, LG = window.JFLOG, H = A && A.P5, G = A && A.P7, P8 = A && A.P8, P = A && A.P9;
  if (!A || !E || !LG || !H || !G || !P8 || !P) return;
  var V = A.V, T = A.T, L = A.L, t = A.t, esc = A.esc, ic = A.ic, can = A.can, href = A.href;
  var lnk = H.lnk, tabs = H.tabs, card = H.card, kv = H.kv, note = H.note, dlg = H.dlg, fld = H.fld, inp = H.inp, sel = H.sel, area = H.area;
  var after = G.after, fail = G.fail, vals = G.vals, choice = G.choice, stepper = G.stepper, photoIn = G.photoIn, photos = G.photos, resetPh = G.resetPh, sigPad = G.sigPad, sigBind = G.sigBind, sigVal = G.sigVal, img = G.img, when = G.when;
  var cx = P.cx, go = P.go, kg = P.kg, pcs = P.pcs, cname = P.cname, pname = P.pname, first = P.first, win = P.win, stC = P.stC, issC = P.issC, sevC = P.sevC, slaC = P.slaC, recC = P.recC, dLink = P.dLink;
  var reasonDlg = P8.reasonDlg;
  function me() { return E.empId(cx()); }
  function cta(btn) { return '<div class="dm7-cta abar7">' + btn + '</div>'; }
  function steps3(cur) {
    var list = [L('Verifikasi', 'Verify'), L('Penerima', 'Recipient'), L('Konfirmasi', 'Confirm')];
    return '<ol class="stp6 stp7 st9">' + list.map(function (x, i) { return '<li class="' + (i < cur ? 'done' : i === cur ? 'now' : '') + '"><span class="stp6-n">' + (i < cur ? ic('check') : i + 1) + '</span><span>' + t(x) + '</span></li>'; }).join('') + '</ol>';
  }
  function mhead(d, extra) {
    return '<section class="card dm7-h dh9"><div class="nx7-h"><span class="mono6">' + esc(d.id) + '</span>' + stC(d) + P.priC(d.pri) + '</div><h1>' + pname(d.prop) + '</h1><p class="sub5">' + cname(d.cl) + ' · ' + win(d) + '</p>' +
      '<div class="dh9-f"><div><span>' + t(L('Order', 'Order')) + '</span><b class="mono6">' + esc(d.ord || d.oref || '—') + '</b></div><div><span>' + t(L('Paket', 'Packages')) + '</span><b class="num">' + d.pkgs + '</b></div><div><span>' + t(L('Berat', 'Weight')) + '</span><b class="num">' + kg(d.kg) + '</b></div><div><span>' + t(L('Jumlah', 'Quantity')) + '</span><b class="num">' + pcs(d.qty) + '</b></div></div>' + (extra || '') + '</section>';
  }
  function secBtns(d) {
    return '<div class="dm7-sec">' + (d.ord && H.open('CHAT-001') ? A.btn('ghost', 'Chat', 'message', { go: 'CHAT-001', rec: d.ord }) : '') + A.btn('danger', L('ADA MASALAH', 'REPORT ISSUE'), 'alert', { go: 'DLV-ISSUE-001', rec: d.id }) + '</div>';
  }
  function ownGate(c0, d) {
    if (!d) return A.stateCard('empty', L('Delivery tidak ditemukan.', 'Delivery not found.'), A.btn('blue', L('Delivery Hari Ini', 'Today\'s Deliveries'), 'package', { go: 'DRV-HO-001' }));
    if (E.driverOf(d) !== me()) return A.stateCard('noperm', L('Delivery ini bukan tugas Anda.', 'This delivery is not your task.'), A.btn('blue', L('Delivery Hari Ini', 'Today\'s Deliveries'), 'package', { go: 'DRV-HO-001' }));
    return null;
  }

  /* ================= NP-04 · DRV-HO-001 Delivery Handover (driver, mobile) ================= */
  function nextFor(d) {
    var o = E.order(d.ord), s0 = E.status(d);
    if (d.pod) return null;
    if (!o) return { l: L('Menunggu dispatch', 'Waiting for dispatch'), i: 'clock' };
    if (['assigned', 'ready'].indexOf(o.st) >= 0) return { l: L('MULAI PENGIRIMAN', 'START DELIVERY'), i: 'play' };
    if (o.st === 'ontheway') return { l: L('SAYA SUDAH TIBA', 'I HAVE ARRIVED'), i: 'pin' };
    if (['arrived', 'inprogress'].indexOf(o.st) >= 0) return { l: d.ho && d.ho.verified ? L('KONFIRMASI PENERIMAAN', 'CONFIRM RECEIPT') : L('SERAH TERIMA', 'HANDOVER'), i: 'filecheck' };
    return { l: T(E.DLV_ST[s0][0]), i: 'info' };
  }
  function homeList(c0) {
    var list = E.driverDeliveries(c0), open = list.filter(function (d) { return !d.pod && ['returned', 'cancelled'].indexOf(d.st) < 0; }), done = list.filter(function (d) { return d.pod || d.st === 'returned'; });
    var cur = open.filter(function (d) { var o = E.order(d.ord); return o && ['ontheway', 'arrived', 'inprogress'].indexOf(o.st) >= 0; })[0] || open[0];
    var nx = cur ? '<section class="card nx8"><span class="nx8-k">' + t(L('Delivery berikutnya', 'Next delivery')) + '</span><div class="nx8-b"><span class="nx8-ic">' + ic('truck') + '</span><div><h2>' + pname(cur.prop) + '</h2><p>' + esc(cur.id) + ' · ' + win(cur) + ' · ' + cur.pkgs + ' ' + t(L('paket', 'pkg')) + '</p></div></div><div class="nx8-a">' + A.btn('primary', nextFor(cur).l, nextFor(cur).i, { go: 'DRV-HO-001', rec: cur.id, cls: 'btn-xl' }) + '</div></section>' : '';
    function row(d) { var n = nextFor(d); return P.drow(d, { go: 'DRV-HO-001', icon: 'package', right: d.pod ? A.chip('ok', L('POD TERSIMPAN', 'POD SAVED'), 'checkc') : stC(d), meta: n && !d.pod ? '<span>' + ic(n.i) + '<b>' + t(n.l) + '</b></span>' : '' }); }
    return P8.hello(esc(G.day(E.TODAY)) + ' · ' + t(L('Delivery & serah terima', 'Delivery & handover'))) + nx +
      (open.length > 1 ? '<h3 class="h8">' + ic('list') + t(L('Belum terkirim', 'Not delivered yet')) + '</h3>' + P.dlist(open.filter(function (d) { return d !== cur; }).map(row), L('Tidak ada.', 'None.')) : '') +
      (done.length ? '<h3 class="h8">' + ic('checkc') + t(L('Selesai hari ini', 'Done today')) + '</h3>' + P.dlist(done.map(row), L('Tidak ada.', 'None.')) : '') +
      (!list.length ? A.stateCard('empty', L('Belum ada delivery hari ini.', 'No delivery today yet.'), H.open('DRIVER-MOB-001') ? A.btn('blue', L('Ke Tugas Hari Ini', 'To Today\'s Tasks'), 'calendar', { go: 'DRIVER-MOB-001' }) : '') : '');
  }
  V['DRV-HO-001'] = {
    title: function (rec) { return rec ? L('Serah Terima', 'Handover') : L('Delivery Hari Ini', 'Today\'s Deliveries'); },
    render: function (c) {
      var c0 = cx();
      if (!c.rec) return homeList(c0);
      var d = E.dlv(c.rec), g = ownGate(c0, d); if (g) return g;
      E.sync();
      var o = E.order(d.ord), s0 = E.status(d);
      if (d.pod) return A.stateCard('success', L('POD tersimpan ' + d.pod.id + '. Barang sudah diterima ' + d.pod.recv + '.', 'POD saved ' + d.pod.id + '. Goods received by ' + d.pod.recv + '.'), A.btn('primary', L('Delivery Berikutnya', 'Next Delivery'), 'arrow', { go: 'DRV-HO-001' }) + (H.open('DRIVER-MOB-001') ? A.btn('ghost', L('Tugas Hari Ini', 'Today\'s Tasks'), 'calendar', { go: 'DRIVER-MOB-001' }) : ''), L('Delivery selesai', 'Delivery complete'));
      if (d.st === 'returned') return A.stateCard('warning', L('Barang dibawa kembali ke plant (' + (d.ret || '') + '). Serahkan ke Team 3 saat tiba.', 'The goods go back to the plant (' + (d.ret || '') + '). Hand them to Team 3 on arrival.'), A.btn('blue', L('Delivery Hari Ini', 'Today\'s Deliveries'), 'package', { go: 'DRV-HO-001' }));
      if (!o) return A.stateCard('warning', L('Delivery ini belum ditugaskan. Tunggu dispatch.', 'This delivery is not assigned yet. Wait for dispatch.'), A.backBtn());
      var gate = E.gate(d.ord);
      if (['assigned', 'ready'].indexOf(o.st) >= 0) {
        return '<div class="dm7">' + mhead(d, gate ? note(t(gate), 'lock', 'crit') : '') + card(L('Sebelum berangkat', 'Before you leave'), kv([[L('Instruksi', 'Instructions'), esc(T(d.instr) || '—')], [L('Kontak', 'Contact'), esc((E.contact(d.ct) || {}).n || '—')], [L('Kendaraan', 'Vehicle'), esc(E.vehOf(d) || '—')]]), { icon: 'clipboard' }) +
          cta(gate ? A.btn('primary', L('MULAI PENGIRIMAN', 'START DELIVERY'), 'lock', { act: 'start', val: d.id, cls: 'btn-xl is-off' }) : A.btn('primary', L('MULAI PENGIRIMAN', 'START DELIVERY'), 'play', { act: 'start', val: d.id, cls: 'btn-xl' })) + secBtns(d) + '</div>';
      }
      if (o.st === 'ontheway') {
        return '<div class="dm7">' + G.trackBanner(E.tripOf(d)) + mhead(d) + '<div id="eta9d">' + G.etaBox(o, { big: true }) + '</div>' + cta(A.btn('primary', L('SAYA SUDAH TIBA', 'I HAVE ARRIVED'), 'pin', { act: 'arrive', val: d.id, cls: 'btn-xl' })) + secBtns(d) + '</div>';
      }
      if (o.st === 'issue') return '<div class="dm7">' + mhead(d) + note(t(L('Menunggu keputusan supervisor. Lihat chat untuk instruksi.', 'Waiting for the supervisor\'s decision. See chat for instructions.')), 'hourglass', 'warn') + secBtns(d) + '</div>';
      if (['arrived', 'inprogress'].indexOf(o.st) < 0) return A.stateCard('warning', E.DLV_ST[s0][0], A.backBtn());
      if (!d.ho || !d.ho.start) {
        return '<div class="dm7">' + mhead(d, '<p class="ok9">' + ic('flag') + t(L('Anda sudah tiba di lokasi', 'You have arrived at the site')) + ' · ' + esc(P.hm(LG.evAt(o, 'arrived'))) + '</p>') + cta(A.btn('primary', L('TIBA DI LOKASI · MULAI SERAH TERIMA', 'AT SITE · START HANDOVER'), 'filecheck', { act: 'hostart', val: d.id, cls: 'btn-xl' })) + secBtns(d) + '</div>';
      }
      if (d.ho.verified) return '<div class="dm7">' + mhead(d, steps3(2)) + note(t(L('Verifikasi selesai. Lanjut ke tanda tangan penerima.', 'Verification done. Continue to the recipient signature.')), 'checkc', 'ok') + cta(A.btn('primary', L('LANJUT KE KONFIRMASI', 'CONTINUE TO CONFIRM'), 'arrow', { go: 'DLV-POD-001', rec: d.id, cls: 'btn-xl' })) + '<div class="dm7-sec">' + A.btn('ghost', L('Ubah Verifikasi', 'Edit Verification'), 'edit', { act: 'reverify', val: d.id }) + '</div></div>';
      var ct = E.contact(d.ct), ho = d.ho;
      return '<div class="dm7">' + mhead(d, steps3(0)) + '<form class="card f6 f7d" id="f9h" onsubmit="return false">' +
        '<h2 class="h5">' + ic('checkc') + t(L('Verifikasi di lokasi', 'On-site verification')) + '</h2>' +
        '<label class="cb9"><input type="checkbox" name="prop"' + (ho.prop ? ' checked' : '') + '><span>' + t(L('Nama property sesuai: ', 'Property matches: ')) + '<b>' + pname(d.prop) + '</b></span></label>' +
        '<div class="f7d-r"><span class="f7d-l">' + t(L('Paket diserahkan', 'Packages handed over')) + ' <i>*</i><small>' + t(L('Rencana: ', 'Planned: ')) + d.pkgs + '</small></span>' + stepper('pkgs', ho.pkgs != null ? ho.pkgs : d.pkgs, L('paket', 'pkg'), { min: 0, max: 99, big: true, label: L('Paket', 'Packages') }) + '</div>' +
        fld(L('Kondisi paket', 'Package condition'), choice('cond', Object.keys(E.COND).map(function (k) { return [k, E.COND[k][0], E.COND[k][2], E.COND[k][1] === 'ok' ? null : E.COND[k][1]]; }), ho.cond || 'good', { cls: 'ch7-w' }), { wide: true }) +
        '<h2 class="h5">' + ic('user') + t(L('Data penerima', 'Recipient')) + '</h2>' +
        fld(L('Nama penerima', 'Recipient name'), inp('recv', ho.recv || (ct ? ct.n : '')), { req: true, wide: true }) + fld(L('Jabatan', 'Role'), inp('role', ho.role || (ct && ct.role ? T(ct.role) : '')), { wide: true }) +
        fld(L('Catatan (wajib bila kondisi tidak baik)', 'Notes (required if the condition is not good)'), area('notes', ho.notes || '', L('Paket diterima dalam kondisi baik.', 'Packages received in good condition.')), { wide: true }) +
        '<p class="dlg5-e" role="alert" id="f9h-e"></p></form>' + cta(A.btn('primary', L('LANJUT KE KONFIRMASI', 'CONTINUE TO CONFIRM'), 'arrow', { act: 'verify', val: d.id, cls: 'btn-xl' })) + secBtns(d) + '</div>';
    },
    after: function (c) { var d = c.rec && E.dlv(c.rec), o = d && E.order(d.ord); if (o && o.st === 'ontheway') G.live('eta9d', function () { return G.etaBox(E.order(d.ord), { big: true }); }, 10); },
    act: {
      start: function (el) { var d = E.dlv(el.getAttribute('data-val')), r = LG.startTrip(cx(), d.ord); if (!r.ok) return fail(r); after(L('Perjalanan dimulai. Klien melihat status Dalam Perjalanan.', 'Trip started. The client sees On The Way.')); },
      arrive: function (el) { var d = E.dlv(el.getAttribute('data-val')), r = LG.arrive(cx(), d.ord); if (!r.ok) return fail(r); after(L('Tiba di lokasi. Klien diberi tahu.', 'Arrived at the site. The client is notified.')); },
      hostart: function (el) { var r = E.hoStart(cx(), el.getAttribute('data-val')); if (!r.ok) return fail(r); A.rerender(); },
      reverify: function (el) { var d = E.dlv(el.getAttribute('data-val')); d.ho.verified = false; A.rerender(); },
      verify: function (el) {
        var id = el.getAttribute('data-val'), f = document.getElementById('f9h'), v = vals(f), e = document.getElementById('f9h-e');
        var r = E.hoVerify(cx(), id, { prop: !!f.querySelector('[name=prop]').checked, recv: v.recv, role: v.role, pkgs: v.pkgs, cond: v.cond, notes: v.notes });
        if (!r.ok) { e.textContent = T(r.msg); return; }
        go('DLV-POD-001', id);
      }
    }
  };

  /* ================= NP-05 · DLV-POD-001 POD Capture (driver, mobile) ================= */
  V['DLV-POD-001'] = {
    title: function () { return L('Konfirmasi Penerimaan', 'Confirm Receipt'); },
    render: function (c) {
      var c0 = cx(), d = E.dlv(c.rec), g = ownGate(c0, d); if (g) return g;
      if (d.pod) return A.stateCard('success', L('POD sudah tersimpan: ' + d.pod.id + '.', 'POD already saved: ' + d.pod.id + '.'), A.btn('primary', L('Delivery Berikutnya', 'Next Delivery'), 'arrow', { go: 'DRV-HO-001' }));
      if (!d.ho || !d.ho.verified) return A.stateCard('warning', L('Selesaikan verifikasi serah terima dulu.', 'Finish the handover verification first.'), A.btn('primary', L('Ke Serah Terima', 'To Handover'), 'filecheck', { go: 'DRV-HO-001', rec: d.id }));
      var ho = d.ho, diff = ho.pkgs !== d.pkgs || ho.cond === 'damaged' || ho.cond === 'partial';
      var sum = '<section class="card rs9 rs9-' + (diff ? 'warn' : 'ok') + '"><span class="rs9-ic">' + ic(diff ? 'alert' : 'checkc') + '</span><div><h2>' + t(diff ? L('Ada selisih', 'Difference') : L('Barang telah diterima.', 'The goods have been received.')) + '</h2><p>' + esc(ho.recv) + (ho.role ? ' · ' + esc(ho.role) : '') + ' · ' + ho.pkgs + ' / ' + d.pkgs + ' ' + t(L('paket', 'pkg')) + ' · ' + t(E.COND[ho.cond][0]) + '</p></div></section>';
      var rec = diff ? '<section class="card f6"><h2 class="h5">' + ic('scale') + t(L('Rekonsiliasi di lokasi', 'On-site reconciliation')) + '</h2>' +
        fld(L('Jenis selisih', 'Difference type'), choice('type', Object.keys(E.REC_TYPES).map(function (k) { return [k, E.REC_TYPES[k]]; }), ho.pkgs < d.pkgs ? 'missing' : ho.pkgs > d.pkgs ? 'extra' : ho.cond === 'damaged' ? 'damaged' : 'qty', { cls: 'ch8-grid' }), { req: true, wide: true }) +
        '<div class="f6-g">' + fld(L('Jumlah item diterima', 'Items received'), inp('qty', d.qty, { num: true })) + fld(L('Berat diterima (kg)', 'Weight received (kg)'), inp('kg', '', { num: true, ph: L('opsional', 'optional') })) + '</div>' +
        fld(L('Alasan selisih', 'Reason'), area('reason', '', L('Contoh: satu paket tertinggal di plant', 'Example: one package was left at the plant')), { req: true, wide: true }) +
        fld(L('Foto bukti selisih', 'Difference photo'), photoIn('rc9', L('Ambil Foto', 'Take Photo')), { req: true, wide: true }) +
        fld(L('Keputusan PIC klien', 'Client PIC decision'), choice('acc', [['full', E.ACC.full[0], 'checkc'], ['partial', E.ACC.partial[0], 'minus', 'appr']], 'full', { cls: 'ch7-w' }), { req: true, wide: true, hint: t(L('Klien menolak semua? Kembali dan pilih ADA MASALAH · Klien Menolak.', 'The client rejects everything? Go back and choose ADA MASALAH · Client Rejects.')) }) +
        '<div class="f6-g" id="pt9" hidden>' + fld(L('Qty diterima', 'Accepted qty'), inp('accQty', '', { num: true })) + fld(L('Qty ditolak', 'Rejected qty'), inp('rejQty', '', { num: true })) + '</div>' +
        '<label class="cb9" id="pt9r" hidden><input type="checkbox" name="retReq" checked><span>' + t(L('Bawa yang ditolak kembali ke plant (BUAT RETURN)', 'Take the rejected items back to the plant (BUAT RETURN)')) + '</span></label></section>' : '';
      return '<div class="dm7">' + mhead(d, steps3(2)) + sum + rec +
        '<section class="card"><h2 class="h5">' + ic('sign') + t(L('Tanda tangan penerima', 'Recipient signature')) + ' <i class="req9">*</i></h2>' + sigPad('sg9') + '</section>' +
        '<section class="card"><h2 class="h5">' + ic('camera') + t(L('Foto serah terima', 'Handover photo')) + ' <i class="req9">*</i></h2>' + photoIn('pod9', L('Ambil Foto', 'Take Photo'), { big: true, multi: false }) + '<label class="cb9"><input type="checkbox" name="loc" checked><span>' + t(L('Catat lokasi serah terima (jika diizinkan)', 'Record the handover location (if permitted)')) + '</span></label></section>' +
        '<p class="dlg5-e" role="alert" id="f9p-e"></p>' + cta(A.btn(diff ? 'primary' : 'ok', L('KONFIRMASI PENERIMAAN', 'CONFIRM RECEIPT'), 'checkc', { act: 'confirm', val: d.id, cls: 'btn-xl btn-ok9' })) +
        '<div class="dm7-sec">' + A.btn('ghost', L('Kembali ke Verifikasi', 'Back to Verification'), 'arrowl', { act: 'back', val: d.id }) + A.btn('danger', L('ADA MASALAH', 'REPORT ISSUE'), 'alert', { go: 'DLV-ISSUE-001', rec: d.id }) + '</div></div>';
    },
    after: function () {
      sigBind('sg9');
      document.querySelectorAll('[name=acc]').forEach(function (r) { r.addEventListener('change', function () { var p = this.value === 'partial'; document.getElementById('pt9').hidden = !p; document.getElementById('pt9r').hidden = !p; }); });
    },
    act: {
      back: function (el) { var d = E.dlv(el.getAttribute('data-val')); d.ho.verified = false; go('DRV-HO-001', d.id); },
      confirm: function (el) {
        var id = el.getAttribute('data-val'), d = E.dlv(id), e = document.getElementById('f9p-e'), v = vals(document.getElementById('view')), sg = sigVal('sg9'), ph = photos('pod9')[0];
        var loc = document.querySelector('[name=loc]'), f = { sign: sg, photo: ph, loc: !loc || loc.checked };
        if (document.querySelector('[name=type]')) f.rec = { type: v.type, reason: v.reason, photo: photos('rc9')[0] || null, acc: v.acc, accQty: v.accQty, rejQty: v.rejQty, retReq: !!(document.querySelector('[name=retReq]') || {}).checked }, f.qty = v.qty, f.kg = v.kg;
        var r = E.podConfirm(cx(), id, f);
        if (!r.ok) { e.textContent = T(r.msg); e.scrollIntoView({ block: 'center' }); return; }
        resetPh('pod9'); resetPh('rc9');
        A.success(L('POD TERSIMPAN', 'POD SAVED'), { l: L('Delivery Berikutnya', 'Next Delivery'), go: 'DRV-HO-001', icon: 'arrow' }, null,
          esc(r.pod.id) + ' · ' + esc(r.pod.recv) + ' · ' + r.pod.pkgs + ' ' + t(L('paket', 'pkg')) + ' · ' + esc(P.hm(r.pod.at)) + '. ' + t(r.rec.res === 'ok' ? L('Rekonsiliasi SESUAI. Klien menerima bukti pengiriman.', 'Reconciliation MATCHED. The client receives the proof of delivery.') : r.rec.review === 'pending' ? L('Selisih dikirim ke supervisor untuk review.', 'The difference went to the supervisor for review.') : L('Selisih diterima PIC klien dan tercatat.', 'The difference was accepted by the client PIC and recorded.')) + (d.ret ? ' ' + t(L('Return ' + d.ret + ' dibuat.', 'Return ' + d.ret + ' created.')) : ''));
      }
    }
  };
  // The Phase 7 delivery confirmation hands over to the Phase 9 handover when the order belongs to a Phase 9 delivery.
  if (V['POD-001']) {
    var pod7 = V['POD-001'], r7 = pod7.render;
    V['POD-001'] = Object.assign({}, pod7, { render: function (c) { var d = E.byOrd(c.rec); if (d && !E.isClient(cx())) { setTimeout(function () { go('DRV-HO-001', d.id); }, 0); return ''; } return r7.call(pod7, c); } });
  }

  /* ================= NP-07 · DLV-ISSUE-001 Delivery Issue (ADA MASALAH) ================= */
  var CLIENT_TYPES = ['missing', 'wrongitem', 'qty', 'damaged', 'quality', 'other'];
  function issueForm(c0, d) {
    var cli = E.isClient(c0), o = E.order(d.ord), atSite = o && ['ontheway', 'arrived', 'inprogress'].indexOf(o.st) >= 0 && !d.pod;
    var types = cli ? CLIENT_TYPES : Object.keys(E.ISSUE_TYPES);
    var acts = cli ? [] : atSite ? ['return', 'redelivery', 'review', 'note'] : d.pod ? ['review', 'partial', 'complaint', 'note'] : ['review', 'note'];
    if (!cli && !can('dlv.issue.manage')) acts = acts.filter(function (k) { return k !== 'complaint'; });
    return '<div class="dm7">' + mhead(d, cli ? '' : (atSite ? '<p class="ok9">' + ic('pin') + t(L('Di lokasi klien', 'At the client site')) + '</p>' : '')) + '<form class="card f6" id="f9i" onsubmit="return false">' +
      fld(L('Pilih jenis masalah', 'Choose the issue type'), choice('type', types.map(function (k) { var x = E.ISSUE_TYPES[k]; return [k, x[0], x[2], x[1] === 'crit' ? 'crit' : null]; }), '', { cls: 'ch8-grid ch9-t' }), { req: true, wide: true }) +
      (acts.length ? fld(L('Tindakan lanjut', 'Next action'), choice('action', acts.map(function (k) { return [k, E.ISSUE_ACT[k][0], E.ISSUE_ACT[k][1]]; }), acts[0], { cls: 'ch7-w' }), { req: true, wide: true }) : '') +
      fld(L('Catatan', 'Notes'), area('note', '', cli ? L('Ceritakan apa yang terjadi', 'Tell us what happened') : L('Contoh: klien menolak karena ada noda pada 2 towel', 'Example: the client rejected it because of stains on 2 towels')), { req: cli, wide: true }) +
      fld(L('Foto bukti', 'Photo evidence'), photoIn('is9', L('Ambil Foto', 'Take Photo')), { wide: true, hint: t(L('Wajib (foto atau catatan) untuk rusak, ditolak, item salah dan kualitas.', 'Required (photo or note) for damaged, rejected, wrong item and quality.')) }) +
      '<p class="dlg5-e" role="alert" id="f9i-e"></p></form>' + cta(A.btn('danger', atSite && !cli ? L('BUAT RETURN / KIRIM LAPORAN', 'CREATE RETURN / SEND REPORT') : L('KIRIM LAPORAN', 'SEND REPORT'), 'alert', { act: 'send', val: d.id, cls: 'btn-xl', id: 'b9i' })) +
      '<div class="dm7-sec">' + A.btn('ghost', L('Batal', 'Cancel'), 'x', { go: cli ? 'CLIENT-DEL-001' : E.driverOf(d) === me() ? 'DRV-HO-001' : 'DISP-002', rec: d.id }) + '</div></div>';
  }
  function issueCard(i, manage) {
    var d = E.dlv(i.dlv), x = E.ISSUE_TYPES[i.type] || E.ISSUE_TYPES.other;
    return '<section class="card is8 is8-' + (i.sev === 'crit' ? 'crit' : i.sev === 'warn' ? 'high' : 'low') + (['resolved', 'closed'].indexOf(i.st) >= 0 ? ' is-done' : '') + '"><div class="is8-h">' + sevC(i.sev) + '<b>' + t(x[0]) + '</b>' + issC(i) + '<span class="sub5 num">' + esc(i.id) + ' · ' + esc(when(i.at)) + '</span></div>' +
      '<p>' + esc(T(i.note)) + '</p><div class="is8-m">' + (d ? '<span>' + ic('truck') + (E.isClient(cx()) ? lnk('CLIENT-DEL-001', d.id, esc(d.id)) : dLink(d.id)) + '</span><span>' + ic('building') + pname(d.prop) + '</span>' : '') +
      '<span>' + ic('user') + t(i.src === 'client' ? L('Klien', 'Client') : i.src === 'driver' ? L('Driver', 'Driver') : L('Staf', 'Staff')) + '</span>' + (i.action ? '<span>' + ic(E.ISSUE_ACT[i.action] ? E.ISSUE_ACT[i.action][1] : 'flag') + t(E.ISSUE_ACT[i.action] ? E.ISSUE_ACT[i.action][0] : L(i.action, i.action)) + '</span>' : '') +
      (i.ret ? '<span>' + ic('arrowl') + lnk('RETURN-001', i.ret, esc(i.ret)) + '</span>' : '') + (i.cmp ? '<span>' + ic('flag') + esc(i.cmp) + '</span>' : '') + '</div>' + (i.photo ? '<div class="ev8">' + img(i.photo, 'bukti') + '</div>' : '') +
      (i.res ? note(t(L('Penyelesaian: ', 'Resolution: ')) + esc(T(i.res)) + (i.resBy && !E.isClient(cx()) ? ' · ' + first(i.resBy) : ''), 'checkc', 'ok') : '') +
      (manage && ['resolved', 'closed'].indexOf(i.st) < 0 ? '<div class="ho8-a">' + A.btn('blue', L('Putuskan', 'Decide'), 'checkc', { act: 'decide', val: i.id, cls: 'btn-sm' }) + '</div>' : '') + '</section>';
  }
  V['DLV-ISSUE-001'] = {
    title: function (rec) { return rec ? L('Ada Masalah?', 'Report an Issue') : null; },
    render: function (c) {
      var c0 = cx(), cli = E.isClient(c0);
      if (c.rec) {
        var d = E.dlv(c.rec);
        if (!d || !E.canSee(c0, d)) return A.stateCard('noperm', L('Anda tidak memiliki akses ke delivery ini.', 'You do not have access to this delivery.'), A.backBtn());
        if (cli && ['delivered', 'completed'].indexOf(d.st) < 0) return A.stateCard('warning', L('Laporan bisa dibuat setelah barang diterima. Untuk pengiriman berjalan, gunakan Chat.', 'You can report after the goods are delivered. For a running delivery, use Chat.'), (d.ord && H.open('CHAT-001') ? A.btn('primary', 'Chat', 'message', { go: 'CHAT-001', rec: d.ord }) : '') + A.btn('ghost', L('Kembali', 'Back'), 'arrowl', { go: 'CLIENT-DEL-001', rec: d.id }));
        if (!can('dlv.issue.report')) return A.stateCard('noperm', L('Anda tidak memiliki akses.', 'You do not have access.'), A.backBtn());
        if (c.q.list !== '1') return issueForm(c0, d);
      }
      var tab = c.q.tab || 'open', all = E.issues(c0, c.rec ? { dlv: c.rec } : {}), open = all.filter(function (i) { return ['resolved', 'closed'].indexOf(i.st) < 0; }), list = tab === 'open' ? open : all;
      var manage = can('dlv.issue.manage');
      return A.pageHead(null, t(cli ? L('Laporan Anda setelah barang diterima. Tim JFRESH menindaklanjuti setiap laporan.', 'Your reports after delivery. The JFRESH team follows up every report.') : L('Masalah dari driver, klien dan staf. Supervisor memutuskan tindak lanjut.', 'Issues from drivers, clients and staff. The supervisor decides the follow-up.'))) +
        (manage ? P8.bigCount([{ k: L('Baru', 'New'), v: all.filter(function (i) { return i.st === 'new'; }).length, icon: 'bell', tone: 'crit' }, { k: L('Dalam review', 'In review'), v: all.filter(function (i) { return i.st === 'review'; }).length, icon: 'users', tone: 'warn' }, { k: L('Kritis terbuka', 'Critical open'), v: open.filter(function (i) { return i.sev === 'crit'; }).length, icon: 'alert' }, { k: L('Selesai', 'Resolved'), v: all.length - open.length, icon: 'checkc', tone: 'ok' }]) : '') +
        tabs([['open', L('Terbuka', 'Open'), 'alert', open.length], ['all', L('Semua', 'All'), 'list', all.length]], tab, 'tab', { def: 'open' }) +
        (list.length ? list.map(function (i) { return issueCard(i, manage); }).join('') : A.empty(c.s.emp));
    },
    act: {
      send: function (el) {
        var id = el.getAttribute('data-val'), f = document.getElementById('f9i'), v = vals(f), e = document.getElementById('f9i-e'), c0 = cx();
        var r = E.reportIssue(c0, id, { type: v.type, action: v.action, note: v.note, photo: photos('is9')[0] || null });
        if (!r.ok) { e.textContent = T(r.msg); return; }
        resetPh('is9');
        var d = E.dlv(id), i = r.issue;
        if (E.isClient(c0)) return A.success(L('Laporan terkirim', 'Report sent'), { l: L('Lihat Pengiriman', 'View Delivery'), go: 'CLIENT-DEL-001', rec: id, icon: 'truck' }, null, esc(i.id) + ' · ' + t(L('Tim JFRESH akan menghubungi Anda.', 'The JFRESH team will contact you.')));
        if (i.ret) return A.success(L('Return dibuat', 'Return created'), { l: L('Delivery Berikutnya', 'Next Delivery'), go: 'DRV-HO-001', icon: 'arrow' }, null, esc(i.ret) + ' · ' + t(L('Bawa barang kembali ke plant dan serahkan ke Team 3. Klien dan supervisor sudah diberi tahu.', 'Take the goods back to the plant and hand them to Team 3. The client and supervisor are notified.')));
        A.success(L('Masalah terkirim', 'Issue sent'), { l: L('Kembali', 'Back'), go: E.driverOf(d) === me() ? 'DRV-HO-001' : 'DISP-002', rec: d.pod && E.driverOf(d) === me() ? null : id, icon: 'arrowl' }, null, esc(i.id) + ' · ' + t(i.st === 'resolved' ? L('Dicatat sebagai catatan.', 'Recorded as a note.') : L('Supervisor menerima laporan ini.', 'The supervisor received this report.')));
      },
      decide: function (el) {
        var id = el.getAttribute('data-val'), i = E.issue(id), d = E.dlv(i.dlv);
        var opts = Object.keys(E.ISS_DEC).filter(function (k) { return (k !== 'complaint' || !i.cmp); });
        dlg({ title: L('Putuskan tindak lanjut', 'Decide the follow-up'), icon: 'checkc', sub: '<b>' + esc(i.id) + '</b> · ' + t(E.ISSUE_TYPES[i.type][0]) + ' · ' + pname(d.prop),
          body: fld(L('Keputusan', 'Decision'), choice('dec', opts.map(function (k) { return [k, E.ISS_DEC[k]]; }), 'resolve', { cls: 'ch7-w' }), { req: true, wide: true }) +
            '<div class="f6-g" id="rd9" hidden>' + fld(L('Tanggal kirim ulang', 'Redelivery date'), inp('date', E.TODAY, { type: 'date' })) + fld(L('Jam mulai', 'From'), inp('w0', '15:00', { type: 'time' })) + fld(L('Jam selesai', 'To'), inp('w1', '16:00', { type: 'time' })) + fld(L('Paket', 'Packages'), inp('pkgs', '1', { num: true })) + '</div>' +
            fld(L('Catatan keputusan', 'Decision note'), area('note', ''), { req: true, wide: true }),
          after: function (box) { box.querySelectorAll('[name=dec]').forEach(function (r) { r.addEventListener('change', function () { box.querySelector('#rd9').hidden = this.value !== 'redelivery'; }); }); },
          onOk: function (x, box) { x = vals(box); var r = E.decideIssue(cx(), id, x.dec, { note: x.note, date: x.date, win: [x.w0, x.w1], pkgs: +x.pkgs || 1 }); if (!r.ok) return r.msg; after(r.cmp ? L('Kasus komplain ' + r.cmp.id + ' dibuat dan tampil di Fase 6.', 'Complaint case ' + r.cmp.id + ' created and visible in Phase 6.') : r.dlv ? L('Pengiriman ulang ' + r.dlv.id + ' dibuat.', 'Redelivery ' + r.dlv.id + ' created.') : L('Keputusan tersimpan.', 'Decision saved.')); return true; } });
      }
    }
  };

  /* ================= NP-03 · CLIENT-DEL-001 Client Delivery Tracking (mobile) ================= */
  function clSteps(step) {
    return '<ol class="cs7 cs9">' + E.CL_STEPS.map(function (s, i) { return '<li class="' + (step != null && i < step ? 'done' : i === step ? 'now' : '') + '">' + ic(step != null && i < step ? 'checkc' : s[2]) + '<span>' + t(s[1]) + '</span></li>'; }).join('') + '</ol>';
  }
  function clCard(c0, d) {
    var v = E.clientView(c0, d.id), s0 = v.st;
    return '<a class="oc7 oc9' + (E.ACTIVE.indexOf(s0) >= 0 ? ' is-act' : '') + '" href="' + href('CLIENT-DEL-001', d.id) + '"><span class="oc7-h"><span class="mono6">' + esc(d.ord || d.oref || d.id) + '</span>' + (v.done ? A.chip('ok', L('Selesai', 'Completed'), 'checkc') : stC(d)) + '</span><b>' + pname(d.prop) + '</b><span class="sub5">' + win(d) + ' · ' + d.pkgs + ' ' + t(L('paket', 'pkg')) + '</span>' +
      (v.eta && !v.eta.arrived && ['ontheway', 'near'].indexOf(s0) >= 0 ? '<span class="oc9-e">' + ic('clock') + t(L('Estimasi tiba ', 'Arriving ')) + '<b class="num">' + esc(E.hm(v.eta.at)) + '</b></span>' : '') + (v.canRate ? '<span class="oc9-r">' + ic('star') + t(L('Beri rating', 'Rate it')) + '</span>' : '') + '</a>';
  }
  function clDetail(c0, id) {
    var v = E.clientView(c0, id); if (!v) return '';
    var d = v.d, s0 = v.st, o = v.track ? v.track.o : null, tr = v.track;
    var top = '<section class="card ct7 ct9"><div class="nx7-h"><span>' + t(L('Pengiriman Anda', 'Your delivery')) + '</span>' + (v.done ? A.chip('ok', L('ORDER COMPLETE', 'ORDER COMPLETE'), 'checkc') : stC(d)) + '</div>' +
      '<div class="ct9-h"><div><b class="mono6">' + esc(d.ord || d.oref || d.id) + '</b><h2>' + pname(d.prop) + '</h2><p class="sub5">' + win(d) + '</p></div>' +
      (v.eta && !v.eta.arrived && ['ontheway', 'near'].indexOf(s0) >= 0 ? '<div class="ct9-e"><span>' + t(L('Estimasi tiba', 'Estimated arrival')) + '</span><b class="num">' + esc(E.hm(v.eta.at)) + '</b><small>' + esc(G.minT(v.eta.min)) + ' ' + t(L('lagi', 'left')) + '</small></div>' : '') + '</div>' +
      (s0 === 'near' ? '<p class="cmg7 cmg7-n">' + ic('pin') + t(L('Driver JFRESH hampir tiba', 'The JFRESH driver is almost there')) + '</p>' : s0 === 'arrived' || s0 === 'handover' ? '<p class="cmg7 cmg7-a">' + ic('flag') + t(L('Driver JFRESH sudah tiba', 'The JFRESH driver has arrived')) + '</p>' : s0 === 'issue' || s0 === 'returned' ? '<p class="cmg7 cmg7-d">' + ic('alert') + t(L('Ada kendala pada pengiriman ini. Tim JFRESH sedang menanganinya.', 'There is a problem with this delivery. The JFRESH team is handling it.')) + '</p>' : '') +
      clSteps(v.step) + '</section>';
    var mp = v.live && tr ? card(L('Lokasi driver', 'Driver location'), G.map({ dests: [{ p: tr.dest, n: E.propName(d.prop) }], drivers: [{ p: tr.pos, st: LG.liveStatus(LG.tripOf(o)), n: 'JFRESH' }], fit: true, client: true, label: L('Posisi driver JFRESH', 'JFRESH driver position') }) + '<p class="sub5">' + G.freshC(tr.pos) + '</p>', { icon: 'pin' }) : '';
    var drv = v.driver ? '<section class="card dr9">' + ic('user') + '<div><b>' + esc(v.driver) + '</b><small>' + t(L('Driver JFRESH', 'JFRESH driver')) + (v.plate ? ' · ' + esc(v.plate) : '') + '</small></div>' + (o && H.open('CHAT-001') ? A.btn('blue', 'Chat', 'message', { go: 'CHAT-001', rec: o.id, cls: 'btn-sm' }) : '') + '</section>' : '';
    var facts = '<section class="card"><div class="dh9-f"><div><span>' + t(L('Paket', 'Packages')) + '</span><b class="num">' + (v.pod ? v.pod.pkgs + ' / ' : '') + d.pkgs + '</b></div><div><span>' + t(L('Berat', 'Weight')) + '</span><b class="num">' + kg(d.kg) + '</b></div><div><span>' + t(L('Jadwal', 'Window')) + '</span><b class="num">' + esc(d.win.join('–')) + '</b></div></div></section>';
    var pod = v.pod ? card(L('Bukti pengiriman', 'Proof of delivery'), kv([[L('Diterima oleh', 'Received by'), esc(v.pod.recv)], [L('Waktu', 'Time'), esc(when(v.pod.at))], [L('Paket', 'Packages'), v.pod.pkgs + ' / ' + d.pkgs], [L('Kondisi', 'Condition'), A.chip(E.COND[v.pod.cond][1], E.COND[v.pod.cond][0])], [L('SLA', 'SLA'), slaC(v.sla)]]) + '<p>' + A.btn('ghost', L('Lihat POD', 'View POD'), 'sign', { act: 'doc', val: 'pod|' + d.id, cls: 'btn-sm' }) + '</p>', { icon: 'sign' }) : '';
    var tl = E.timeline(c0, d.id), tlh = tl && tl.rows.length ? card(L('Riwayat layanan', 'Service history'), '<ol class="tl9">' + tl.rows.map(function (r) { var x = E.TL[r.k]; return '<li><span class="tl9-t num">' + esc(when(r.at)) + '</span><span class="tl9-ic">' + ic(x[1]) + '</span><b>' + t(x[0]) + '</b></li>'; }).join('') + '</ol>', { icon: 'history' }) : '';
    var done = v.done ? '<section class="card ok9b">' + ic('checkc') + '<div><h2>ORDER COMPLETE</h2><p>' + t(L('Terima kasih. Layanan sudah selesai.', 'Thank you. The service is complete.')) + '</p></div></section>' : '';
    var act = (v.canRate ? A.btn('primary', L('Beri Rating', 'Rate the Service'), 'star', { go: 'FEEDBACK-001', rec: d.id, cls: 'btn-xl' }) : '') + (v.canIssue ? A.btn(v.canRate ? 'ghost' : 'danger', L('Ada Masalah?', 'Report a Problem'), 'alert', { go: 'DLV-ISSUE-001', rec: d.id }) : '');
    return top + done + mp + drv + facts + pod + (v.fb ? note(t(L('Rating Anda: ', 'Your rating: ')) + '★ ' + v.fb.dr + ' · ' + t(L('kualitas ', 'quality ')) + '★ ' + v.fb.qr, 'star', 'ok') : '') + tlh + (act ? '<div class="dm7-sec">' + act + '</div>' : '') +
      note(t(L('Anda hanya melihat driver yang menuju property Anda, selama perjalanan berlangsung.', 'You only see the driver heading to your property, while the trip is running.')), 'lock', 'info');
  }
  V['CLIENT-DEL-001'] = {
    title: function () { return L('Pengiriman Anda', 'Your Deliveries'); },
    render: function (c) {
      var c0 = cx();
      if (!E.isClient(c0)) return A.stateCard('noperm', L('Layar ini untuk klien.', 'This screen is for clients.'), A.backBtn('blue'));
      if (c.rec) { if (!E.clientView(c0, c.rec)) return A.stateCard('noperm', L('Data ini berada di luar akun Anda.', 'This record is outside your account.'), A.btn('blue', L('Pengiriman Anda', 'Your Deliveries'), 'truck', { go: 'CLIENT-DEL-001' })); return '<div class="dm7" id="cd9">' + clDetail(c0, c.rec) + '</div>'; }
      var list = E.clientDeliveries(c0), act = list.filter(function (d) { return E.ACTIVE.indexOf(E.status(d)) >= 0 || E.status(d) === 'waiting'; }), rest = list.filter(function (d) { return act.indexOf(d) < 0; });
      return A.pageHead(null, t(L('Status pengiriman ke property Anda, dari siap dikirim sampai diterima.', 'Delivery status to your properties, from ready to delivered.'))) +
        (list.length ? (act.length ? '<h3 class="h8">' + ic('truck') + t(L('Aktif', 'Active')) + '</h3><div class="oc7l">' + act.map(function (d) { return clCard(c0, d); }).join('') + '</div>' : '') + (rest.length ? '<h3 class="h8">' + ic('checkc') + t(L('Terkirim & selesai', 'Delivered & completed')) + '</h3><div class="oc7l">' + rest.map(function (d) { return clCard(c0, d); }).join('') + '</div>' : '')
          : A.stateCard('empty', L('Belum ada pengiriman.', 'No deliveries yet.')));
    },
    after: function (c) { var d = c.rec && E.dlv(c.rec); if (d && E.ACTIVE.indexOf(E.status(d)) >= 0) G.live('cd9', function () { E.sync(); return clDetail(cx(), d.id); }, 10); },
    act: P.DOC_ACT
  };

  /* ================= NP-10 · FEEDBACK-001 Client Feedback ================= */
  function stars(name) { return '<div class="sr9" role="radiogroup">' + [5, 4, 3, 2, 1].map(function (n) { return '<input type="radio" id="' + name + n + '" name="' + name + '" value="' + n + '"><label for="' + name + n + '" title="' + n + '">' + ic('star') + '</label>'; }).join('') + '</div>'; }
  V['FEEDBACK-001'] = {
    title: function (rec) { return rec ? L('Beri Rating', 'Rate the Service') : null; },
    render: function (c) {
      var c0 = cx();
      if (E.isClient(c0)) {
        if (c.rec) {
          var v = E.clientView(c0, c.rec); if (!v) return A.stateCard('noperm', L('Data ini berada di luar akun Anda.', 'This record is outside your account.'), A.backBtn());
          if (v.fb) return A.stateCard('success', L('Terima kasih, feedback sudah dikirim.', 'Thank you, feedback was already sent.'), A.btn('blue', L('Lihat Pengiriman', 'View Delivery'), 'truck', { go: 'CLIENT-DEL-001', rec: c.rec }));
          if (!v.done) return A.stateCard('warning', L('Feedback bisa dikirim setelah order selesai.', 'Feedback can be sent once the order is complete.'), A.btn('blue', L('Lihat Pengiriman', 'View Delivery'), 'truck', { go: 'CLIENT-DEL-001', rec: c.rec }));
          var d = v.d;
          return '<div class="dm7"><section class="card dm7-h"><div class="nx7-h"><span class="mono6">' + esc(d.ord || d.oref || d.id) + '</span>' + A.chip('ok', L('Selesai', 'Completed'), 'checkc') + '</div><h1>' + pname(d.prop) + '</h1><p class="sub5">' + win(d) + '</p></section>' +
            '<form class="card f6" id="f9f" onsubmit="return false">' + fld(L('Bagaimana pengirimannya?', 'How was the delivery?'), stars('dr'), { req: true, wide: true }) + fld(L('Bagaimana kualitas cucian?', 'How was the laundry quality?'), stars('qr'), { req: true, wide: true }) +
            fld(L('Komentar (opsional)', 'Comment (optional)'), area('c', '', L('Contoh: pengiriman tepat waktu, barang bersih dan rapi', 'Example: on time, clean and neat')), { wide: true }) + '<p class="dlg5-e" role="alert" id="f9f-e"></p></form>' +
            cta(A.btn('primary', L('KIRIM FEEDBACK', 'SEND FEEDBACK'), 'checkc', { act: 'send', val: d.id, cls: 'btn-xl' })) + '</div>';
        }
        var list = E.clientDeliveries(c0).filter(function (d) { return d.st === 'completed'; });
        return A.pageHead(null, t(L('Beri rating untuk pengiriman yang sudah selesai.', 'Rate your completed deliveries.'))) + (list.length ? '<div class="oc7l">' + list.map(function (d) { var f = d.fb && E.feedback(d.fb); return '<a class="oc7 oc9" href="' + href('FEEDBACK-001', d.id) + '"><span class="oc7-h"><span class="mono6">' + esc(d.ord || d.oref || d.id) + '</span>' + (f ? A.chip('ok', '★ ' + f.dr + ' · ★ ' + f.qr) : A.chip('appr', L('Belum dinilai', 'Not rated'), 'star')) + '</span><b>' + pname(d.prop) + '</b><span class="sub5">' + win(d) + '</span></a>'; }).join('') + '</div>' : A.empty(L('Belum ada order selesai.', 'No completed order yet.')));
      }
      var all = E.state().fb.slice().sort(function (a, b) { return String(b.at).localeCompare(a.at); }), k = E.kpi(30);
      return A.pageHead(null, t(L('Rating dan komentar klien setelah order selesai. Masuk ke KPI pengalaman klien dan Client Health.', 'Client ratings and comments after completion. They feed the client experience KPIs and Client Health.'))) +
        P8.bigCount([{ k: L('Rating pengiriman 30 hari', 'Delivery rating, 30 days'), v: k.rateD == null ? '—' : k.rateD + '/5', icon: 'star', tone: 'ok' }, { k: L('Rating kualitas 30 hari', 'Quality rating, 30 days'), v: k.rateQ == null ? '—' : k.rateQ + '/5', icon: 'sparkles' }, { k: L('Jumlah rating', 'Ratings'), v: k.n.ratings, icon: 'users' }, { k: L('Penerimaan penuh', 'Full acceptance'), v: k.acc + '%', icon: 'checkc' }]) +
        A.list(all, [{ h: L('Feedback', 'Feedback'), v: function (f) { return '<span class="mono6">' + esc(f.id) + '</span>'; } }, { h: L('Delivery', 'Delivery'), v: function (f) { return dLink(f.dlv); } }, { h: L('Klien', 'Client'), v: function (f) { return cname(f.cl); } }, { h: L('Pengiriman', 'Delivery'), cls: 'num', v: function (f) { return '★ ' + f.dr; } }, { h: L('Kualitas', 'Quality'), cls: 'num', v: function (f) { return '★ ' + f.qr; } }, { h: L('Komentar', 'Comment'), v: function (f) { return esc(f.c ? T(f.c) : '—'); } }, { h: L('Waktu', 'Time'), cls: 'num', v: function (f) { return esc(when(f.at)); } }],
          function (f) { return { t: cname(f.cl), r: '★ ' + f.dr + ' · ★ ' + f.qr, s: esc(f.c ? T(f.c) : '') + ' · ' + esc(when(f.at)) }; }, null, { empty: c.s.emp });
    },
    act: {
      send: function (el) {
        var id = el.getAttribute('data-val'), v = vals(document.getElementById('f9f')), r = E.submitFeedback(cx(), id, { dr: v.dr, qr: v.qr, c: v.c });
        if (!r.ok) { document.getElementById('f9f-e').textContent = T(r.msg); return; }
        A.success(L('Terima kasih atas feedback Anda', 'Thank you for your feedback'), { l: L('Lihat Pengiriman', 'View Delivery'), go: 'CLIENT-DEL-001', rec: id, icon: 'truck' }, null, '★ ' + r.fb.dr + ' · ★ ' + r.fb.qr);
      }
    }
  };
})();
