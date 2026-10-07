/* JFRESH OS — Phase 7 screens (part 3): NP-09 Plant Arrival & Handover (ARRIVAL-001, HANDOVER-001),
   NP-10 Live Tracking (TRACK-001 … 003), Task Chat (CHAT-001), Route Timeline (TIMELINE-001) and the
   logistics KPI board (LOG-KPI-001). Location is only shown during an active trip; stale positions are
   always labelled as last known; every live view is written to the location access log. */
(function () {
  var A = window.JFAPP, E = window.JFLOG, H = A && A.P5, G = A && A.P7;
  if (!A || !E || !H || !G) return;
  var V = A.V, T = A.T, L = A.L, t = A.t, esc = A.esc, ic = A.ic, can = A.can, fmt = A.fmt, href = A.href;
  var open = H.open, lnk = H.lnk, tabs = H.tabs, card = H.card, kv = H.kv, note = H.note, tile = H.tile, tiles = H.tiles, dlg = H.dlg, fld = H.fld, inp = H.inp, sel = H.sel, area = H.area, num = H.num;
  var cx = G.cx, stC = G.stC, priC = G.priC, kindC = G.kindC, sevC = G.sevC, liveC = G.liveC, tripC = G.tripC, mfC = G.mfC, hm = G.hm, dts = G.dts, day = G.day, when = G.when, agoS = G.agoS, minT = G.minT;
  var pname = G.pname, cname = G.cname, emp = G.emp, ordLink = G.ordLink, mob = G.mob, after = G.after, fail = G.fail, vals = G.vals, opts = G.opts, av = G.av, reach = G.reach, contactOf = G.contactOf;
  var etaBox = G.etaBox, freshC = G.freshC, trackBanner = G.trackBanner, map = G.map, driverMarks = G.driverMarks, legend = G.legend, live = G.live, photoIn = G.photoIn, photos = G.photos, resetPh = G.resetPh, stepper = G.stepper, choice = G.choice, img = G.img;
  var DONE = ['completed', 'atplant', 'received', 'cancelled'];
  function qhref(over) { return H.qhref(over); }
  function go(s, rec, q) { A.go(s, rec, q); }

  /* ================= NP-09 · ARRIVAL-001 Arrival Board ================= */
  var AR_LANES = [['expected', L('Diharapkan', 'Expected'), 'clock'], ['soon', L('Segera Tiba', 'Arriving Soon'), 'truck'], ['arrived', L('Tiba di Plant', 'Arrived'), 'factory'], ['issue', L('Selisih / Masalah', 'Difference / Issue'), 'alert'], ['done', L('Sudah Diserahkan', 'Handed Over'), 'checkc']];
  function arCard(cd, lane) {
    var tr = cd.trip, m0 = cd.mfs.filter(function (m) { return ['arrived', 'discrepancy', 'intransit'].indexOf(m.st) >= 0; })[0] || cd.mfs[0];
    var go0 = (lane === 'arrived' || lane === 'issue') && m0 && open('HANDOVER-001') ? href('HANDOVER-001', m0.id) : lane === 'done' && m0 ? href('MANIFEST-001', m0.id) : tr.track && tr.track.on && open('TRACK-002') ? href('TRACK-002', tr.id) : m0 ? href('MANIFEST-001', m0.id) : null;
    var p = E.position(tr);
    return '<' + (go0 ? 'a href="' + go0 + '"' : 'div') + ' class="ac7 ac7-' + lane + '"><span class="ac7-h">' + av(tr.drv) + '<span><b>' + esc(E.empName(tr.drv)) + '</b><small>' + esc(tr.veh + ' · ' + E.vehicle(tr.veh).plate) + '</small></span></span>' +
      '<span class="ac7-m"><span>' + ic('package') + '<b class="num">' + cd.bags + '</b> bag</span>' + (cd.eta ? '<span>' + ic('clock') + 'ETA <b class="num">' + hm(cd.eta) + '</b></span>' : tr.atPlant ? '<span>' + ic('factory') + t(L('Tiba ', 'Arrived ')) + esc(String(tr.atPlant).slice(11, 16)) + '</span>' : '') + '</span>' +
      (cd.mfs.length ? '<span class="ac7-f">' + cd.mfs.map(function (m) { return '<span><span class="mono6">' + esc(m.id) + '</span> ' + mfC(m.st) + '</span>'; }).join('') + '</span>' : '') +
      (cd.pend ? '<span class="sub5">' + ic('basket') + cd.pend + ' ' + t(L('pickup belum selesai', 'pickups not done yet')) + '</span>' : '') +
      (p && p.fresh !== 'live' && lane !== 'done' ? '<span class="sub5">' + freshC(p) + '</span>' : '') + '</' + (go0 ? 'a' : 'div') + '>';
  }
  function arLanes(c0, lane) {
    var ln = E.arrivals(c0);
    if (mob()) return '<nav class="tabs scroll tabs5 seg5 ln7t">' + AR_LANES.map(function (l) { return '<a href="' + qhref({ lane: l[0] === 'soon' ? null : l[0] }) + '" aria-selected="' + (l[0] === lane) + '">' + ic(l[2]) + '<span>' + t(l[1]) + '</span><b>' + ln[l[0]].length + '</b></a>'; }).join('') + '</nav>' +
      '<div class="ln7-m">' + (ln[lane].length ? ln[lane].map(function (cd) { return arCard(cd, lane); }).join('') : A.empty(L('Lajur ini kosong.', 'This lane is empty.'))) + '</div>';
    return '<div class="ln7 ln7-5">' + AR_LANES.map(function (l) { return '<section class="ln7-c ln7-' + l[0] + '"><h3>' + ic(l[2]) + '<span>' + t(l[1]) + '</span><b class="num">' + ln[l[0]].length + '</b></h3><div class="ln7-b">' + (ln[l[0]].length ? ln[l[0]].map(function (cd) { return arCard(cd, l[0]); }).join('') : '<p class="ln7-e">' + t(L('Kosong', 'Empty')) + '</p>') + '</div></section>'; }).join('') + '</div>';
  }
  V['ARRIVAL-001'] = {
    render: function (c) {
      var c0 = cx(), ln = E.arrivals(c0), lane = c.q.lane || 'soon';
      if (!ln) return A.stateCard('noperm', E.MSG.noperm, A.backBtn('blue'));
      var mfs = E.manifests(c0, {}).filter(function (m) { return String(m.pickAt).slice(0, 10) === E.TODAY; });
      var strip = tiles([
        tile({ k: L('Menuju plant', 'Heading to the plant'), v: ln.expected.length + ln.soon.length, s: ln.soon.length + ' ' + t(L('segera tiba (≤ 30 mnt)', 'arriving soon (≤ 30 min)')) }),
        tile({ k: L('Menunggu handover', 'Waiting for handover'), v: ln.arrived.length, s: t(L('kendaraan di plant', 'vehicles at the plant')), tone: ln.arrived.length ? 'warn' : '' }),
        tile({ k: L('Selisih bag', 'Bag differences'), v: ln.issue.length, s: t(L('menunggu keputusan supervisor', 'waiting for the supervisor')), tone: ln.issue.length ? 'crit' : '' }),
        tile({ k: L('Bag dalam perjalanan', 'Bags in transit'), v: E.state().bags.filter(function (b) { return b.st === 'intransit'; }).length, s: t(L('dari manifest pickup hari ini', 'from today\'s pickup manifests')) })
      ], 'tls5-4');
      var rec = card(L('Rekonsiliasi manifest hari ini', 'Today\'s manifest reconciliation'), A.list(mfs, [
        { h: 'Manifest', v: function (m) { return '<b class="mono6">' + esc(m.id) + '</b>'; } }, { h: L('Klien · Property', 'Client · Property'), v: function (m) { var o = E.order(m.ord); return '<b>' + cname(o.cl) + '</b><small class="sub5">' + pname(o.prop) + '</small>'; } },
        { h: L('Driver', 'Driver'), v: function (m) { return esc(E.first(E.trip(m.trip).drv)); } }, { h: L('Diambil', 'Picked up'), cls: 'num', v: function (m) { return E.reconcile(m.id).pick; } },
        { h: L('Tiba', 'Arrived'), cls: 'num', v: function (m) { var r = E.reconcile(m.id); return r.arr == null ? '—' : r.arr; } },
        { h: L('Selisih', 'Difference'), cls: 'num', v: function (m) { var r = E.reconcile(m.id); return r.diff == null ? '—' : r.diff === 0 ? A.chip('ok', L('Cocok', 'Match')) : '<b class="t6-crit">' + r.diff + '</b>'; } },
        { h: 'Status', v: function (m) { return mfC(m.st); } }
      ], function (m) { var r = E.reconcile(m.id); return { t: '<span class="mono6">' + esc(m.id) + '</span>', r: r.pick + (r.arr != null ? ' → ' + r.arr : ''), s: pname(E.order(m.ord).prop), chip: mfC(m.st) }; }, function (m) { return href(['arrived', 'discrepancy'].indexOf(m.st) >= 0 && open('HANDOVER-001') ? 'HANDOVER-001' : 'MANIFEST-001', m.id); }, { empty: L('Belum ada manifest hari ini.', 'No manifest today yet.') }), { icon: 'clipboard', count: mfs.length });
      return A.pageHead(null, t(L('Kendaraan menuju plant dan manifest yang harus diterima. Tiba di plant belum berarti diterima receiving.', 'Vehicles heading to the plant and manifests to receive. Arrived at the plant is not yet received.')), A.btn('ghost', L('Pelacakan Bag', 'Bag Tracking'), 'package', { go: 'BAG-001' })) +
        strip + '<div id="ar7-live">' + arLanes(c0, lane) + '</div>' + rec;
    },
    after: function (c) { var lane = c.q.lane || 'soon'; live('ar7-live', function () { return arLanes(cx(), lane); }, 20); }
  };

  /* ================= NP-09 · HANDOVER-001 Receiving Handover (both sides) ================= */
  function hoList(c0) {
    var drv = E.myDriver(c0), list;
    if (drv) { var tr = E.myTrip(c0); list = tr ? E.state().manifests.filter(function (m) { return m.trip === tr.id; }) : []; }
    else list = E.manifests(c0, {}).filter(function (m) { return ['intransit', 'arrived', 'discrepancy', 'handed'].indexOf(m.st) >= 0; });
    var pend = list.filter(function (m) { return ['handed', 'received'].indexOf(m.st) < 0; });
    return A.pageHead(null, drv ? t(L('Serahkan manifest ke receiving setelah tiba di plant.', 'Hand the manifests to receiving after arriving at the plant.')) : t(L('Verifikasi jumlah dan kondisi bag, lalu konfirmasi dua pihak.', 'Verify bag count and condition, then confirm on both sides.'))) +
      (list.length ? '<div class="oc7l">' + list.map(function (m) { var o = E.order(m.ord), tr = E.trip(m.trip); return '<a class="oc7' + (pend.indexOf(m) >= 0 ? ' is-act' : '') + '" href="' + href('HANDOVER-001', m.id) + '"><span class="oc7-h"><span class="mono6">' + esc(m.id) + '</span>' + mfC(m.st) + '</span><b>' + pname(o.prop) + '</b><span class="sub5">' + (m.bags + (m.cont || 0)) + ' bag · ' + esc(E.first(tr.drv)) + ' · ' + esc(tr.veh) + '</span>' + hoSides(m, true) + '</a>'; }).join('') + '</div>'
        : A.stateCard('empty', L('Tidak ada manifest menunggu handover.', 'No manifest waiting for handover.')));
  }
  function hoSides(m, small) {
    var ho = m.ho || {};
    function sd(k, l, icn) { var at = ho[k]; return '<span class="hs7' + (at ? ' is-ok' : '') + '">' + ic(at ? 'checkc' : icn) + '<span><b>' + t(l) + '</b>' + (small ? '' : '<small>' + (at ? esc(String(at).slice(11, 16)) + (k === 'rcv' && ho.rcvBy ? ' · ' + emp(ho.rcvBy) : '') : t(L('menunggu', 'waiting'))) + '</small>') + '</span></span>'; }
    return '<span class="hs7l">' + sd('drv', L('Driver menyerahkan', 'Driver hands over'), 'truck') + sd('rcv', L('Receiving menerima', 'Receiving accepts'), 'factory') + '</span>';
  }
  V['HANDOVER-001'] = {
    title: function (rec) { return rec ? L('Handover ' + rec, 'Handover ' + rec) : null; },
    render: function (c) {
      var c0 = cx(); if (!c.rec) return hoList(c0);
      var m = E.manifest(c.rec); if (!m) return A.stateCard('empty', L('Manifest tidak ditemukan.', 'Manifest not found.'), A.backBtn('blue'));
      var o = E.order(m.ord), tr = E.trip(m.trip), drv = E.myDriver(c0), ho = m.ho || {}, rc = E.reconcile(m.id), pick = rc.pick;
      if (drv && (!tr || tr.drv !== drv)) return A.stateCard('noperm', E.MSG.notyours, A.backBtn('blue'));
      var hd = '<section class="card c6-hd"><div class="c6-hd-m"><div class="c6-hd-t"><h1><span class="mono6">' + esc(m.id) + '</span> ' + mfC(m.st) + '</h1><p><b>' + cname(o.cl) + '</b> · ' + pname(o.prop) + ' · ' + esc(E.empName(tr.drv)) + ' · ' + esc(tr.veh + ' ' + E.vehicle(tr.veh).plate) + '</p></div></div>' +
        (open('MANIFEST-001') ? '<div class="c6-hd-a">' + A.btn('ghost', L('Detail Manifest', 'Manifest Detail'), 'clipboard', { go: 'MANIFEST-001', rec: m.id }) + '</div>' : '') + '</section>';
      var exp = '<section class="card ho7-x"><span class="nx7-k">' + t(L('Bag menurut manifest pickup', 'Bags on the pickup manifest')) + '</span><b class="ho7-n num">' + pick + '</b><span class="sub5">' + m.bags + ' bag' + (m.cont ? ' + ' + m.cont + ' container' : '') + ' · ' + (m.kg || 0) + ' kg · ' + t(E.CAT[m.cat] || L(m.cat, m.cat)) + (T(m.special) ? ' · ' + esc(T(m.special)) : '') + '</span>' + hoSides(m) + '</section>';
      var body = '';
      if (m.st === 'received') body = A.stateCard('success', L('Manifest sudah diterima receiving. Bag masuk proses produksi.', 'The manifest is received. The bags enter production.'), open('OPS-RCV-001') ? A.btn('primary', L('Ke Receiving', 'To Receiving'), 'factory', { go: 'OPS-RCV-001' }) : null);
      else if (drv) {
        if (ho.drv) body = note(t(L('Anda sudah menyerahkan manifest ini ', 'You handed over this manifest at ')) + esc(String(ho.drv).slice(11, 16)) + '. ' + t(m.st === 'handed' ? L('Receiving sudah menerima.', 'Receiving accepted it.') : L('Menunggu konfirmasi receiving.', 'Waiting for receiving to confirm.')), 'checkc', 'ok') + A.btn('primary', L('Ke Hari Ini', 'To Today'), 'calendar', { go: 'DRIVER-MOB-001', cls: 'btn-xl' });
        else if (!(tr.atPlant || tr.ret || ho.arrAt)) body = note(t(L('Konfirmasi setelah tiba di plant.', 'Confirm after arriving at the plant.')), 'info', 'info');
        else body = note(t(L('Serahkan ' + pick + ' bag ke petugas receiving, lalu tekan tombol di bawah.', 'Hand ' + pick + ' bags to the receiving officer, then tap the button below.')), 'package', 'info') + '<div class="dm7-cta">' + A.btn('primary', L('SERAHKAN & KONFIRMASI', 'HAND OVER & CONFIRM'), 'filecheck', { act: 'conf', val: m.id, cls: 'btn-xl' }) + '</div>';
      } else {
        var verified = ho.count != null;
        if (!verified || m.st === 'intransit' || (m.st === 'arrived' && !verified)) {
          body = '<form class="card f6 f7d" id="f7h" onsubmit="return false"><h2 class="h5">' + ic('scan') + t(L('Verifikasi kedatangan', 'Verify arrival')) + '</h2>' +
            '<div class="f7d-r"><span class="f7d-l">' + t(L('Jumlah bag tiba', 'Bags arrived')) + ' <i>*</i></span>' + stepper('count', pick, L('bag', 'bags'), { min: 0, max: 199, big: true, label: L('Jumlah bag tiba', 'Bags arrived') }) + '</div><p id="h7-d" class="h7-d" aria-live="polite"></p>' +
            fld(L('Kondisi', 'Condition'), choice('cond', Object.keys(E.COND).map(function (k) { return [k, E.COND[k][0], k === 'good' ? 'checkc' : 'alert', E.COND[k][1]]; }), 'good', { cls: 'ch7-w' }), { wide: true }) +
            fld(L('Catatan', 'Notes'), area('notes', ''), { wide: true }) +
            '<div id="h7-x" hidden>' + fld(L('Alasan selisih', 'Reason for the difference'), inp('reason', ''), { req: true, wide: true }) + '<div class="f5 f5-w"><span>' + t(L('Foto bukti', 'Photo evidence')) + ' <i>*</i></span>' + photoIn('ho', L('Ambil Foto', 'Take Photo'), { big: true, multi: false }) + '</div></div>' +
            '<p class="dlg5-e" role="alert" id="f7h-e"></p><div class="f6-a">' + A.btn('primary', L('Verifikasi', 'Verify'), 'check', { act: 'verify', val: m.id }) + '</div></form>';
        } else if (m.st === 'discrepancy') {
          var iss = ho.issue && E.issue(ho.issue);
          body = note(t(L('Selisih handover: pickup ', 'Handover difference: picked up ')) + pick + ' → ' + t(L('tiba ', 'arrived ')) + ho.count + '. ' + esc(T(ho.reason) || '') + ' ' + t(E.MSG.pending), 'alert', 'crit') +
            (iss && iss.st === 'resolved' ? A.btn('primary', L('TERIMA & KONFIRMASI', 'ACCEPT & CONFIRM'), 'checkc', { act: 'conf', val: m.id, cls: 'btn-xl' }) : iss && open('ISSUE-002') ? A.btn('ghost', L('Buka Masalah', 'Open Issue'), 'alert', { go: 'ISSUE-002', rec: iss.id }) : '');
        } else if (m.st === 'handed') {
          body = note(t(L('Handover dikonfirmasi dua pihak. Mulai receiving untuk menghitung item dan memasukkan ke produksi.', 'Handover confirmed by both sides. Start receiving to count items and send them to production.')), 'checkc', 'ok') + '<div class="dm7-cta">' + A.btn('primary', L('MULAI RECEIVING', 'START RECEIVING'), 'factory', { act: 'rcv', val: m.id, cls: 'btn-xl' }) + '</div>';
        } else {
          body = card(L('Hasil verifikasi', 'Verification result'), kv([[L('Bag tiba', 'Bags arrived'), '<b class="num">' + ho.count + '</b> ' + (rc.match ? A.chip('ok', L('Cocok', 'Match')) : A.chip('crit', L('Selisih ' + rc.diff, 'Difference ' + rc.diff)))], [L('Kondisi', 'Condition'), A.chip(E.COND[ho.cond || 'good'][1], E.COND[ho.cond || 'good'][0])], ho.notes ? [L('Catatan', 'Notes'), esc(ho.notes)] : null, [L('Diverifikasi', 'Verified'), esc(when(ho.verAt)) + ' · ' + emp(ho.rcvBy)]]), { icon: 'check' }) +
            (ho.rcv ? note(t(L('Receiving sudah konfirmasi. Menunggu driver menekan SERAHKAN & KONFIRMASI.', 'Receiving confirmed. Waiting for the driver to tap SERAHKAN & KONFIRMASI.')), 'hourglass', 'warn') : '<div class="dm7-cta">' + A.btn('primary', L('TERIMA & KONFIRMASI', 'ACCEPT & CONFIRM'), 'checkc', { act: 'conf', val: m.id, cls: 'btn-xl' }) + '</div>');
        }
      }
      return hd + '<div class="g7-2"><div class="g7-c">' + exp + body + '</div><div class="g7-c">' +
        card(L('Bag', 'Bags'), '<ul class="bg7l">' + E.state().bags.filter(function (b) { return b.mf === m.id; }).map(function (b) { return '<li><span class="mono6">' + esc(b.id) + '</span>' + G.bagC(b) + G.bagFlags(b) + '</li>'; }).join('') + '</ul>', { icon: 'package', count: rc.live }) +
        note(t(L('Tiba di plant ≠ diterima. Receiving dimulai terpisah setelah kedua pihak konfirmasi.', 'Arrived at the plant ≠ received. Receiving starts separately after both sides confirm.')), 'info', 'info') + '</div></div>';
    },
    after: function (c) {
      var f = document.getElementById('f7h'); if (!f) return;
      var m = E.manifest(c.rec), pick = m.bags + (m.cont || 0);
      function u() { var n = +f.querySelector('[name=count]').value, d = n - pick, el = document.getElementById('h7-d'); f.querySelector('#h7-x').hidden = d === 0; el.className = 'h7-d' + (d ? ' is-diff' : ' is-ok'); el.innerHTML = d ? ic('alert') + t(L('Jumlah bag berbeda: ' + (d > 0 ? '+' : '') + d + '. Isi alasan dan foto bukti.', 'Bag count differs: ' + (d > 0 ? '+' : '') + d + '. Give a reason and a photo.')) : ic('checkc') + t(L('Jumlah cocok dengan manifest.', 'Count matches the manifest.')); }
      f.addEventListener('input', u); u();
    },
    act: {
      verify: function (el) {
        var id = el.getAttribute('data-val'), v = vals(document.getElementById('f7h'));
        var r = E.hoVerify(cx(), id, { count: num(v.count), cond: v.cond, notes: v.notes, reason: v.reason, photo: photos('ho')[0] || null });
        if (!r.ok) { document.getElementById('f7h-e').textContent = T(r.msg); return; }
        resetPh('ho'); after(r.match ? L('Jumlah cocok. Tekan TERIMA & KONFIRMASI.', 'Count matches. Tap TERIMA & KONFIRMASI.') : L('Selisih handover dicatat dan dikirim ke supervisor.', 'Handover difference recorded and sent to the supervisor.'), r.match ? null : 'warn');
      },
      conf: function (el) { var r = E.hoConfirm(cx(), el.getAttribute('data-val')); if (!r.ok) return fail(r); after(r.complete ? L('Handover selesai, dikonfirmasi dua pihak.', 'Handover complete, confirmed by both sides.') : L('Konfirmasi tersimpan. Menunggu pihak lain.', 'Confirmation saved. Waiting for the other side.')); },
      rcv: function (el) { var r = E.startReceiving(cx(), el.getAttribute('data-val')); if (!r.ok) return fail(r); after(L('Receiving dimulai. Status order: Diterima Receiving.', 'Receiving started. Order status: Received.')); }
    }
  };

  /* ================= NP-10 · Location access gate (§79) ================= */
  var REASON = null;   // owner: reason given once per session, logged per trip view
  function gate(c0, trips) {
    if (E.needsReason(c0) && !REASON) {
      return '<section class="card gt7">' + ic('lock') + '<h2>' + t(L('Alasan melihat lokasi driver', 'Reason to view driver locations')) + '</h2><p>' + t(L('Lokasi driver adalah data pribadi. Setiap akses dicatat: siapa, kapan, driver mana dan alasannya.', 'Driver location is personal data. Every access is logged: who, when, which driver and why.')) + '</p>' +
        '<form id="gt7" class="f6" onsubmit="return false">' + fld(L('Alasan', 'Reason'), sel('reason', [['', L('Pilih alasan', 'Choose a reason')], [T(L('Review keterlambatan klien', 'Client delay review')), L('Review keterlambatan klien', 'Client delay review')], [T(L('Masalah kritis / eskalasi', 'Critical issue / escalation')), L('Masalah kritis / eskalasi', 'Critical issue / escalation')], [T(L('Audit operasional', 'Operational audit')), L('Audit operasional', 'Operational audit')]], ''), { req: true, wide: true }) +
        '<p class="dlg5-e" role="alert" id="gt7-e"></p><div class="f6-a">' + A.btn('primary', L('Lihat Lokasi', 'View Location'), 'eye', { act: 'gate' }) + '</div></form></section>';
    }
    (trips || []).forEach(function (tr) { E.logView(c0, tr.id, REASON); });
    return null;
  }
  var GATE_ACT = { gate: function () { var v = vals(document.getElementById('gt7')); if (!v.reason) { document.getElementById('gt7-e').textContent = T(E.MSG.reason); return; } REASON = v.reason; A.rerender(); } };

  /* ================= NP-10 · TRACK-001 Live Operations Map ================= */
  function sideList(c0, act) {
    return act.length ? '<ul class="tk7l">' + act.map(function (tr) {
      var o = E.curOrder(tr) || E.nextOrder(tr), e = o ? E.eta(o) : null, p = E.canSeeLocation(c0, tr) ? E.position(tr) : null, ls = E.liveStatus(tr), os = E.tripOrders(tr).filter(function (x) { return x.st !== 'cancelled'; });
      return '<li><a class="tk7 tk7-' + ls + '" href="' + href('TRACK-002', tr.id) + '"><span class="tk7-h">' + av(tr.drv) + '<span><b>' + esc(E.empName(tr.drv)) + '</b><small>' + esc(tr.veh) + (tr.route ? ' · ' + esc(tr.route) : '') + '</small></span>' + liveC(ls) + '</span>' +
        (o ? '<span class="tk7-o">' + kindC(o.kind) + '<b>' + pname(o.prop) + '</b></span>' : tr.ret ? '<span class="tk7-o">' + ic('factory') + t(L('Kembali ke plant', 'Returning to the plant')) + '</span>' : '') +
        '<span class="tk7-m">' + (e && !e.arrived ? '<span>ETA <b class="num">' + hm(e.at) + '</b>' + (e.late ? ' · +' + e.delay + ' ' + t(L('mnt', 'min')) : '') + '</span>' : '') + '<span>' + E.doneCount(tr) + '/' + os.length + ' stop</span></span>' + freshC(p) + '</a></li>';
    }).join('') + '</ul>' : A.empty(L('Tidak ada trip aktif.', 'No active trip.'));
  }
  function mapBox(c0, act, sel0) { return map({ trips: act, drivers: driverMarks(c0, act, function (tr) { return href('TRACK-002', tr.id); }), sel: sel0, stopLabels: false, cls: 'm7-live', label: L('Peta live operasional', 'Live operations map') }) + legend(); }
  V['TRACK-001'] = {
    render: function (c) {
      var c0 = cx(), tab = c.q.tab || 'map', act = E.trips(c0).filter(function (tr) { return tr.track && tr.track.on; });
      var g = gate(c0, act); if (g) return A.pageHead(null, '') + g;
      var lst = act.map(E.liveStatus), done = E.trips(c0).filter(function (tr) { return !(tr.track && tr.track.on); });
      var strip = tiles([
        tile({ k: L('Trip aktif', 'Active trips'), v: act.length, s: t(L('lokasi dibagikan', 'location shared')) }),
        tile({ k: L('Bergerak · di lokasi', 'Moving · on site'), v: lst.filter(function (s) { return s === 'moving' || s === 'returning'; }).length + ' · ' + lst.filter(function (s) { return s === 'arrived'; }).length }),
        tile({ k: L('Terlambat · masalah', 'Delayed · issue'), v: lst.filter(function (s) { return s === 'delayed'; }).length + ' · ' + lst.filter(function (s) { return s === 'issue'; }).length, tone: lst.some(function (s) { return s === 'delayed' || s === 'issue'; }) ? 'warn' : '' }),
        tile({ k: L('Sinyal lemah · offline', 'Weak · offline'), v: lst.filter(function (s) { return s === 'weak'; }).length + ' · ' + lst.filter(function (s) { return s === 'offline'; }).length, tone: lst.some(function (s) { return s === 'weak' || s === 'offline'; }) ? 'warn' : '' })
      ], 'tls5-4');
      var head = A.pageHead(null, t(L('Posisi driver hanya selama trip aktif. Lokasi lama selalu ditandai sebagai lokasi terakhir.', 'Driver positions only during an active trip. Old locations are always marked as last known.')), A.pbtn('lg.dispatch', 'ghost', L('Dispatch Board', 'Dispatch Board'), 'columns', { go: 'DISPATCH-001' }));
      var tb = tabs([['map', L('Peta', 'Map'), 'pin'], ['list', L('Daftar Driver', 'Driver List'), 'list', act.length], can('lg.audit') || can('lg.dispatch') ? ['log', L('Log Akses Lokasi', 'Location Access Log'), 'eye'] : null].filter(Boolean), tab, 'tab', { def: 'map' });
      var body;
      if (tab === 'log') {
        var lg = E.locLog(c0);
        body = card(L('Log akses lokasi', 'Location access log'), A.list(lg, [
          { h: L('Waktu', 'Time'), cls: 'num', v: function (x) { return esc(when(x.at)); } }, { h: L('Siapa', 'Who'), v: function (x) { var ct = E.contact(x.who); return '<b>' + esc(ct ? ct.n : x.name || E.empName(x.who)) + '</b><small class="sub5">' + esc(x.role || '') + '</small>'; } },
          { h: L('Driver · trip', 'Driver · trip'), v: function (x) { return esc(E.empName(x.drv)) + '<small class="sub5 mono6">' + esc(x.trip) + '</small>'; } }, { h: L('Alasan / konteks', 'Reason / context'), v: function (x) { return esc(T(x.reason)); } }
        ], function (x) { var ct = E.contact(x.who); return { t: esc(ct ? ct.n : x.name || E.empName(x.who)), r: esc(String(x.at).slice(11, 16)), s: esc(E.first(x.drv)) + ' · ' + esc(T(x.reason)) }; }, null, { empty: L('Belum ada akses lokasi.', 'No location access yet.') }), { icon: 'eye', count: lg.length }) +
          note(t(L('Log disimpan ' + E.cfg().retention + ' hari lalu dihapus otomatis.', 'The log is kept ' + E.cfg().retention + ' days, then deleted automatically.')), 'lock', 'info');
      } else if (!act.length) {
        body = A.stateCard('empty', L('Tidak ada trip aktif. Lokasi hanya tampil selama perjalanan.', 'No active trip. Location shows only during a trip.')) + (done.length ? card(L('Trip selesai hari ini', 'Trips finished today'), done.map(function (tr) { return '<p>' + (open('TIMELINE-001') ? lnk('TIMELINE-001', tr.id, esc(E.empName(tr.drv)) + ' · ' + esc(tr.id)) : esc(tr.id)) + ' ' + liveC(E.liveStatus(tr)) + '</p>'; }).join(''), { icon: 'history' }) : '');
      } else if (tab === 'list' || mob()) {
        body = (mob() && tab !== 'list' ? '<div id="tk7-map">' + mapBox(c0, act) + '</div>' : '') + card(L('Driver aktif', 'Active drivers'), '<div id="tk7-side">' + sideList(c0, act) + '</div>', { icon: 'users', count: act.length });
      } else {
        body = '<div class="tk7g"><div class="card tk7-map" id="tk7-map">' + mapBox(c0, act) + '</div><aside class="card tk7-s"><h2 class="h5">' + ic('users') + t(L('Driver aktif', 'Active drivers')) + '</h2><div id="tk7-side">' + sideList(c0, act) + '</div></aside></div>';
      }
      return head + strip + tb + body + note(t(L('Pelacakan berhenti otomatis saat rute selesai, tiba di plant atau shift berakhir. Tidak ada pelacakan 24/7.', 'Tracking stops automatically when the route ends, at the plant or at shift end. No 24/7 tracking.')), 'lock', 'info');
    },
    after: function () {
      live('tk7-map', function () { var c0 = cx(); return mapBox(c0, E.trips(c0).filter(function (tr) { return tr.track && tr.track.on; })); }, 10);
      live('tk7-side', function () { var c0 = cx(); return sideList(c0, E.trips(c0).filter(function (tr) { return tr.track && tr.track.on; })); }, 10);
    },
    act: GATE_ACT
  };

  /* ================= NP-10 · TRACK-002 Driver Live Detail ================= */
  function liveHead(c0, tr) {
    var p = E.canSeeLocation(c0, tr) ? E.position(tr) : null, o = E.curOrder(tr), nx = E.nextOrder(tr), os = E.tripOrders(tr).filter(function (x) { return x.st !== 'cancelled'; }), e = o ? E.eta(o) : nx ? E.eta(nx) : null;
    return tiles([
      tile({ k: L('Tugas sekarang', 'Current task'), v: o ? E.propName(o.prop) : '—', s: o ? t(E.KIND[o.kind]) + ' · ' + t(E.stLabel(o)) : tr.ret ? t(L('Kembali ke plant', 'Returning to plant')) : '' }),
      tile({ k: L('Stop berikutnya', 'Next stop'), v: nx ? E.propName(nx.prop) : '—', s: nx ? esc(nx.win.join('–')) : '' }),
      tile({ k: 'ETA', v: e && !e.arrived ? hm(e.at) : e && e.arrived ? t(L('Di lokasi', 'On site')) : '—', s: e && e.late ? t(L('terlambat ', 'late ')) + e.delay + ' ' + t(L('mnt', 'min')) : e && e.stale ? t(L('perkiraan dari lokasi terakhir', 'estimate from last location')) : '', tone: e && e.late ? 'warn' : '' }),
      tile({ k: L('Progres', 'Progress'), v: E.doneCount(tr) + '/' + os.length, s: freshC(p) })
    ], 'tls5-4');
  }
  V['TRACK-002'] = {
    title: function (rec) { var tr = E.trip(rec); return tr ? L('Live · ' + E.empName(tr.drv), 'Live · ' + E.empName(tr.drv)) : null; },
    render: function (c) {
      var c0 = cx(), tr = E.trip(c.rec);
      if (!tr) return A.stateCard('empty', L('Trip tidak ditemukan.', 'Trip not found.'), A.btn('blue', L('Ke Live Map', 'To Live Map'), 'pin', { go: 'TRACK-001' }));
      var d = E.driver(tr.drv), v = E.vehicle(tr.veh), on = tr.track && tr.track.on;
      if (on) { var g = gate(c0, [tr]); if (g) return g; }
      var o = E.curOrder(tr), b = [];
      if (o && open('CHAT-001')) b.push(A.btn('ghost', 'Chat', 'message', { go: 'CHAT-001', rec: o.id }));
      if (open('ROUTE-002')) b.push(A.btn('ghost', L('Rute & Urutan', 'Route & Order'), 'route', { go: 'ROUTE-002', rec: tr.id }));
      if (open('TIMELINE-001')) b.push(A.btn('ghost', 'Timeline', 'history', { go: 'TIMELINE-001', rec: tr.id }));
      if (on && can('lg.dispatch')) b.push(A.btn('ghost', tr.signal === 'weak' ? L('Demo: Sinyal Kembali', 'Demo: Signal Back') : L('Demo: Sinyal Lemah', 'Demo: Weak Signal'), 'wifioff', { act: 'sig', val: tr.id }));
      var hd = '<section class="card c6-hd"><div class="c6-hd-m">' + av(tr.drv, 'av7-l') + '<div class="c6-hd-t"><h1>' + esc(d.n) + ' ' + liveC(E.liveStatus(tr)) + '</h1><p>' + esc(tr.veh + ' · ' + v.plate) + (tr.route ? ' · ' + esc(tr.route + ' ' + (E.route(tr.route) || {}).n) : '') + ' · Shift ' + esc(d.shift.join('–')) + '</p>' + reach({ phone: d.phone }) + '</div></div>' + (b.length ? '<div class="c6-hd-a">' + b.join('') + '</div>' : '') + '</section>';
      if (!on) return hd + A.stateCard('empty', tr.st === 'done' ? L('Shift selesai. Pelacakan berhenti; tidak ada lokasi ditampilkan.', 'Shift ended. Tracking stopped; no location is shown.') : tr.atPlant ? L('Driver di plant. Pelacakan berhenti setelah rute selesai.', 'Driver at the plant. Tracking stopped after the route ended.') : L('Perjalanan belum dimulai. Lokasi tampil setelah MULAI PERJALANAN.', 'The trip has not started. Location shows after MULAI PERJALANAN.'), null, L('Lokasi tidak dibagikan', 'Location not shared'));
      var pl = E.plan(tr), stops = '<ol class="rs7l">' + E.tripOrders(tr).map(function (x, i) {
        var row = pl.filter(function (z) { return z.ord === x.id; })[0] || {}, cur = ['ontheway', 'arrived', 'inprogress'].indexOf(x.st) >= 0, dn = DONE.indexOf(x.st) >= 0;
        return '<li class="rs7' + (cur ? ' is-cur' : '') + (dn ? ' is-done' : '') + '"><span class="rs7-n">' + (dn && x.st !== 'cancelled' ? ic('check') : i + 1) + '</span><div class="rs7-b"><a href="' + href('ORDER-003', x.id) + '"><b>' + pname(x.prop) + '</b></a> ' + kindC(x.kind) + '<small class="sub5">' + esc(x.win.join('–')) + ' · SLA ' + (x.slaTat || (E.sla(x) || {}).tat || '—') + ' ' + t(L('j', 'h')) + '</small></div><div class="rs7-e">' + (row.eta ? '<b class="num">' + hm(row.eta) + '</b><small>' + t(row.actual ? L('aktual', 'actual') : L('perkiraan', 'expected')) + '</small>' : '—') + (row.late && !row.actual ? A.chip('warn', '+' + row.delay) : '') + '</div><div class="rs7-s">' + stC(x) + '</div></li>';
      }).join('') + '</ol>';
      var iss = E.issues(c0, { trip: tr.id }).filter(function (i) { return i.st !== 'resolved'; });
      return hd + trackBanner(tr) + '<div id="t2-head">' + liveHead(c0, tr) + '</div>' + (o ? '<div id="t2-eta">' + etaBox(o) + '</div>' : '') +
        '<div class="g7-2 g7-map"><div class="g7-c">' + card(L('Peta', 'Map'), '<div id="t2-map">' + map({ trips: [tr], fit: true, drivers: driverMarks(c0, [tr]), stopLabels: true }) + '</div>', { icon: 'pin' }) + '</div><div class="g7-c">' + card(L('Stop', 'Stops'), stops, { icon: 'list' }) +
        (iss.length ? card(L('Masalah terbuka', 'Open issues'), '<ul class="is7l">' + iss.map(function (i) { return '<li>' + sevC(i.sev) + '<b>' + t(E.ISSUE_TYPES[i.type][0]) + '</b> · ' + esc(T(i.note)) + (open('ISSUE-002') ? ' ' + lnk('ISSUE-002', i.id, t(L('Buka', 'Open'))) : '') + '</li>'; }).join('') + '</ul>', { icon: 'alert', cls: 'card-crit7' }) : '') + '</div></div>';
    },
    after: function (c) {
      var id = c.rec;
      live('t2-head', function () { var tr = E.trip(id); return tr ? liveHead(cx(), tr) : ''; }, 10);
      live('t2-eta', function () { var tr = E.trip(id), o = tr && E.curOrder(tr); return o ? etaBox(o) : ''; }, 10);
      live('t2-map', function () { var tr = E.trip(id); return tr ? map({ trips: [tr], fit: true, drivers: driverMarks(cx(), [tr]), stopLabels: true }) : ''; }, 10);
    },
    act: Object.assign({ sig: function (el) { var tr = E.trip(el.getAttribute('data-val')), r = E.signal(cx(), tr.id, tr.signal === 'weak' ? 'ok' : 'weak'); if (!r.ok) return fail(r); after(tr.signal === 'weak' ? L('Simulasi: sinyal lemah. Lokasi dibekukan di posisi terakhir.', 'Simulation: weak signal. Location frozen at the last position.') : L('Simulasi: sinyal kembali.', 'Simulation: signal back.')); } }, GATE_ACT)
  };

  /* ================= NP-10 · TRACK-003 Client Tracking ================= */
  var CL_STEPS = [['assigned', L('Driver Ditugaskan', 'Driver Assigned'), 'user'], ['ontheway', L('Dalam Perjalanan', 'On The Way'), 'truck'], ['near', L('Hampir Tiba', 'Almost There'), 'pin'], ['arrived', L('Tiba', 'Arrived'), 'flag'], ['completed', L('Selesai', 'Completed'), 'checkc']];
  function clView(c0, id) {
    var x = E.clientTrack(c0, id); if (!x) return '';
    var o = x.o, st = x.st, idx = { assigned: 0, ready: 0, ontheway: 1, delayed: 1, near: 2, arrived: 3, inprogress: 3, completed: 4, issue: 1 }[st];
    var steps = '<ol class="cs7">' + CL_STEPS.map(function (s, i) { return '<li class="' + (i < idx ? 'done' : i === idx ? 'now' : '') + '">' + ic(i < idx ? 'checkc' : s[2]) + '<span>' + t(s[1]) + '</span></li>'; }).join('') + '</ol>';
    var msg = st === 'near' ? '<p class="cmg7 cmg7-n">' + ic('pin') + t(L('Driver JFRESH hampir tiba', 'The JFRESH driver is almost there')) + '</p>'
      : st === 'delayed' && x.eta ? '<p class="cmg7 cmg7-d">' + ic('clock') + t(L((o.kind === 'delivery' ? 'Delivery' : 'Pickup') + ' diperkirakan terlambat ' + x.eta.delay + ' menit', (o.kind === 'delivery' ? 'Delivery' : 'Pickup') + ' is expected ' + x.eta.delay + ' min late')) + '</p>'
        : st === 'arrived' || st === 'inprogress' ? '<p class="cmg7 cmg7-a">' + ic('flag') + t(L('Driver JFRESH sudah tiba', 'The JFRESH driver has arrived')) + '</p>'
          : st === 'completed' ? '<p class="cmg7 cmg7-c">' + ic('checkc') + t(o.kind === 'delivery' ? L('Delivery selesai', 'Delivery complete') : L('Pickup selesai. Cucian dalam perjalanan ke plant.', 'Pickup complete. The laundry is on the way to the plant.')) + '</p>'
            : st === 'issue' ? '<p class="cmg7 cmg7-d">' + ic('alert') + t(L('Ada kendala pada tugas ini. Tim JFRESH sedang menanganinya.', 'There is a problem with this task. The JFRESH team is handling it.')) + '</p>' : '';
    var mp = x.live ? map({ dests: [{ p: x.dest, n: E.propName(o.prop) }], drivers: [{ p: x.pos, st: E.liveStatus(E.tripOf(o)), n: 'JFRESH' }], fit: true, client: true, label: L('Posisi driver JFRESH', 'JFRESH driver position') }) + '<p class="sub5">' + freshC(x.pos) + '</p>'
      : '<div class="m7-off">' + ic('lock') + '<span>' + t(st === 'completed' ? L('Perjalanan selesai. Lokasi driver tidak lagi dibagikan.', 'The trip is complete. The driver location is no longer shared.') : L('Peta tampil saat driver sedang menuju lokasi Anda.', 'The map shows while the driver is on the way to you.')) + '</span></div>';
    var pod = o.pod ? kv([[L('Penerima', 'Recipient'), esc(o.pod.recv)], [L('Bag diterima', 'Bags received'), o.pod.bags + (o.pod.pkg ? ' · ' + o.pod.pkg + ' paket' : '')], [L('Waktu', 'Time'), esc(when(o.pod.at))]]) : o.exec && st === 'completed' ? kv([[L('Bag diambil', 'Bags collected'), o.exec.bags + (o.exec.cont ? ' + ' + o.exec.cont + ' container' : '')], [L('Waktu', 'Time'), esc(when(E.evAt(o, 'completed')))]]) : '';
    return '<section class="card ct7"><div class="nx7-h">' + kindC(o.kind) + '<span class="mono6">' + esc(o.id) + '</span></div><h2>' + pname(o.prop) + '</h2><p class="sub5">' + esc(day(o.date)) + ' · ' + esc(o.win.join('–')) + ' · ' + o.bags + ' bag</p>' + steps + msg +
      (x.eta && !x.eta.arrived && st !== 'completed' ? etaBox(o, { big: true }) : '') + (x.driver ? '<p class="ct7-d">' + ic('user') + t(L('Driver: ', 'Driver: ')) + '<b>' + esc(x.driver) + '</b>' + (x.plate ? ' · ' + esc(x.plate) : '') + '</p>' : '') + '</section>' +
      card(L('Lokasi', 'Location'), mp, { icon: 'pin' }) + (pod ? card(L('Bukti', 'Proof'), pod + (open('EVIDENCE-001') ? '<p>' + lnk('EVIDENCE-001', o.id, t(L('Lihat bukti lengkap', 'View full proof'))) + '</p>' : ''), { icon: 'sign' }) : '');
  }
  V['TRACK-003'] = {
    title: function () { return L('Lacak Driver', 'Track Driver'); },
    render: function (c) {
      var c0 = cx();
      if (!E.isClient(c0)) return A.stateCard('noperm', L('Layar ini untuk klien.', 'This screen is for clients.'), A.backBtn('blue'));
      var list = E.clientActive(c0), rec = c.rec;
      if (rec && !E.clientTrack(c0, rec)) return A.stateCard('noperm', E.MSG.scope, A.btn('blue', L('Lacak Driver', 'Track Driver'), 'pin', { go: 'TRACK-003' }));
      if (!rec) { var a = list.filter(function (o) { return ['ontheway', 'arrived', 'inprogress'].indexOf(o.st) >= 0; }); if (a.length === 1) rec = a[0].id; }
      if (!rec) {
        return A.pageHead(null, t(L('Status pickup dan delivery hari ini untuk property Anda.', 'Today\'s pickup and delivery status for your properties.'))) + (list.length ? '<div class="oc7l">' + list.map(function (o) { var x = E.clientTrack(c0, o.id), act = x.live; return '<a class="oc7' + (act ? ' is-act' : '') + '" href="' + href('TRACK-003', o.id) + '"><span class="oc7-h">' + kindC(o.kind) + tripC(x.st) + '</span><b>' + pname(o.prop) + '</b><span class="sub5">' + esc(o.win.join('–')) + ' · ' + o.bags + ' bag' + (x.eta && !x.eta.arrived && x.st !== 'completed' ? ' · ETA ' + hm(x.eta.at) : '') + '</span>' + (act ? '<span class="oc7-go">' + ic('pin') + t(L('Lacak', 'Track')) + '</span>' : '') + '</a>'; }).join('') + '</div>'
          : A.stateCard('empty', L('Tidak ada pickup atau delivery aktif hari ini.', 'No active pickup or delivery today.'), A.btn('primary', L('Minta Pickup', 'Request Pickup'), 'plus', { go: 'ORDER-002' })));
      }
      var x = E.clientTrack(c0, rec), tr = E.tripOf(x.o);
      if (x.live && tr) E.logView(c0, tr.id, null);
      return '<div id="ct7-live">' + clView(c0, rec) + '</div><div class="dm7-sec">' + (E.canChat(c0, x.o) && open('CHAT-001') ? A.btn('primary', L('Chat dengan JFRESH', 'Chat with JFRESH'), 'message', { go: 'CHAT-001', rec: rec }) : '') + A.btn('ghost', L('Detail Order', 'Order Detail'), 'file', { go: 'ORDER-003', rec: rec }) + (list.length > 1 ? A.btn('ghost', L('Semua Hari Ini', 'All Today'), 'list', { go: 'TRACK-003' }) : '') + '</div>' +
        note(t(L('Anda hanya melihat driver yang menuju property Anda, selama perjalanan berlangsung.', 'You only see the driver heading to your property, while the trip is running.')), 'lock', 'info');
    },
    after: function (c) {
      var c0 = cx(); if (!E.isClient(c0)) return;
      var rec = c.rec; if (!rec) { var a = E.clientActive(c0).filter(function (o) { return ['ontheway', 'arrived', 'inprogress'].indexOf(o.st) >= 0; }); if (a.length === 1) rec = a[0].id; }
      if (rec) live('ct7-live', function () { return clView(cx(), rec); }, 10);
    }
  };

  /* ================= NP-10 · CHAT-001 Task Chat ================= */
  function who(m, c0) {
    if (m.by === 'sys') return null;
    var ct = E.contact(m.by); if (ct) return { n: ct.n, role: L('Klien', 'Client'), me: E.isClient(c0) };
    var me = !E.isClient(c0) && m.by === E.empId(c0), d = E.driver(m.by);
    return { n: E.isClient(c0) ? 'JFRESH · ' + (d ? d.short : String(E.empName(m.by)).split(' ')[0]) : E.empName(m.by), role: d ? L('Driver', 'Driver') : m.by === 'EMP-081' ? L('CS', 'CS') : L('Supervisor', 'Supervisor'), me: me };
  }
  function msgRow(m, c0, o) {
    if (m.kind === 'sys') return '<li class="cm7s">' + ic('info') + '<span>' + t(E.CHAT_SYS[m.body] || L(m.body, m.body)) + (m.extra != null ? ' · ' + esc(T(m.extra)) + (typeof m.extra === 'number' ? ' ' + t(L('menit', 'min')) : '') : '') + '</span><small>' + esc(String(m.at).slice(11, 16)) + '</small></li>';
    var w = who(m, c0), body;
    if (m.kind === 'text') body = '<p>' + esc(T(m.body)) + '</p>';
    else if (m.kind === 'photo') body = img(m.body, T(L('Foto', 'Photo')));
    else if (m.kind === 'file') body = '<p>' + ic('file') + esc(String(m.extra && m.extra.n || 'file')) + '</p>';
    else if (m.kind === 'pin') { var pn = typeof m.extra === 'string' ? E.D.PINS[m.extra] : null, lab = m.extra && m.extra.n ? T(m.extra.n) : pn ? T(pn[0]) : T(m.body); body = '<p class="cm7-p">' + ic('pin') + '<b>' + esc(lab) + '</b><small>' + pname(o.prop) + '</small></p>'; }
    else if (m.kind === 'loc') body = '<p class="cm7-p">' + ic('pin') + '<b>' + t(L('Lokasi dibagikan', 'Location shared')) + '</b>' + (m.extra && m.extra.age != null ? '<small>' + (m.extra.fresh === 'live' ? t(L('lokasi saat ini', 'current location')) : t(L('lokasi terakhir ', 'last known ')) + esc(agoS(m.extra.age))) + '</small>' : '<small>' + pname(o.prop) + '</small>') + '</p>';
    else if (m.kind === 'ref') body = '<p class="cm7-p">' + ic('link') + (open('ORDER-003') ? ordLink(m.extra) : '<span class="mono6">' + esc(m.extra) + '</span>') + '</p>';
    var canPromote = !m.ev && ['photo', 'file', 'pin', 'loc'].indexOf(m.kind) >= 0 && (can('lg.evidence.amend') || can('lg.dispatch') || (can('lg.drv.task') && E.ownsOrder(c0, o)));
    return '<li class="cm7' + (w.me ? ' is-me' : '') + '"><span class="cm7-w"><b>' + esc(w.n) + '</b> · ' + t(w.role) + '</span><div class="cm7-b">' + body + '</div><small>' + esc(String(m.at).slice(11, 16)) + (m.ev ? ' · ' + ic('filecheck') + t(L('jadi bukti', 'used as evidence')) : '') + '</small>' +
      (canPromote ? '<button type="button" class="lnk cm7-pr" data-act="promote" data-val="' + m.id + '">' + ic('filecheck') + t(L('Jadikan Bukti', 'Use as Evidence')) + '</button>' : '') + '</li>';
  }
  function rooms(c0, cur) {
    var rs = E.rooms(c0);
    return rs.length ? '<ul class="cr7l">' + rs.map(function (r) { var o = r.o, l = r.last; return '<li><a class="cr7' + (o.id === cur ? ' is-on' : '') + '" href="' + href('CHAT-001', o.id) + '"' + (o.id === cur ? ' aria-current="true"' : '') + '><span class="cr7-h"><b>' + pname(o.prop) + '</b><small class="num">' + (l ? esc(String(l.at).slice(11, 16)) : '') + '</small></span><span class="cr7-s">' + kindC(o.kind) + '<span class="mono6">' + esc(o.id) + '</span>' + stC(o) + '</span>' +
      (l ? '<span class="cr7-l">' + esc(l.kind === 'sys' ? T(E.CHAT_SYS[l.body] || L(l.body, l.body)) : l.kind === 'text' ? T(l.body) : l.kind === 'photo' ? T(L('Foto', 'Photo')) : l.kind === 'pin' ? T(L('Pin lokasi', 'Location pin')) : l.kind === 'loc' ? T(L('Lokasi', 'Location')) : T(L('Referensi', 'Reference'))) + '</span>' : '') + '</a></li>'; }).join('') + '</ul>' : A.empty(L('Belum ada chat tugas. Chat dibuat otomatis untuk setiap order aktif.', 'No task chat yet. A chat is created automatically for each active order.'));
  }
  function msgs(c0, id) { var o = E.order(id), list = E.messages(c0, id) || []; return list.length ? '<ol class="cm7l">' + list.map(function (m) { return msgRow(m, c0, o); }).join('') + '</ol>' : A.empty(L('Belum ada pesan.', 'No messages yet.')); }
  V['CHAT-001'] = {
    title: function (rec) { return rec ? L('Chat ' + rec, 'Chat ' + rec) : null; },
    render: function (c) {
      var c0 = cx(), id = c.rec, o = id && E.order(id);
      if (!id) return A.pageHead(null, t(L('Satu ruang chat untuk setiap order. Driver, supervisor, CS dan PIC klien dalam satu percakapan.', 'One chat room per order. Driver, supervisor, CS and the client PIC in one conversation.'))) + card(L('Ruang chat', 'Chat rooms'), rooms(c0, null), { icon: 'message' });
      if (!o) return A.stateCard('empty', L('Order tidak ditemukan.', 'Order not found.'), A.backBtn('blue'));
      if (!E.canChat(c0, o)) return A.stateCard('noperm', E.MSG.scope, A.btn('blue', L('Ruang Chat', 'Chat Rooms'), 'message', { go: 'CHAT-001' }));
      var ps = E.participants(o), closed = DONE.indexOf(o.st) >= 0 && o.date < E.TODAY;
      var head = '<div class="cx7-h"><div><b>' + pname(o.prop) + '</b> ' + kindC(o.kind) + stC(o) + '<small class="sub5"><span class="mono6">' + esc(o.id) + '</span> · ' + esc(o.win.join('–')) + ' · ' + ps.map(function (p) { return esc(E.isClient(c0) && p.role !== 'client' ? (p.role === 'drv' ? 'Driver ' + String(p.n).split(' ')[0] : p.role === 'cs' ? 'CS JFRESH' : 'Supervisor JFRESH') : p.n); }).join(', ') + '</small></div>' +
        (E.isClient(c0) ? A.btn('ghost', L('Lacak', 'Track'), 'pin', { go: 'TRACK-003', rec: o.id, cls: 'btn-sm' }) : open('ORDER-003') ? A.btn('ghost', L('Order', 'Order'), 'file', { go: 'ORDER-003', rec: o.id, cls: 'btn-sm' }) : '') + '</div>';
      var comp = closed ? note(t(L('Order sudah selesai. Chat hanya bisa dibaca.', 'The order is complete. The chat is read-only.')), 'lock', 'info')
        : '<div class="cx7-c"><div class="cx7-q">' + '<label class="btn btn-ghost btn-sm">' + ic('camera') + '<span>' + t(L('Foto', 'Photo')) + '</span><input type="file" accept="image/*" class="sr" data-photo="chat" data-autosend="chat"></label>' +
          A.btn('ghost', 'Pin', 'pin', { act: 'pin', cls: 'btn-sm' }) + A.btn('ghost', L('Lokasi', 'Location'), 'route', { act: 'loc', cls: 'btn-sm' }) + A.btn('ghost', L('Referensi', 'Reference'), 'link', { act: 'ref', cls: 'btn-sm' }) + '</div>' +
          '<form class="cx7-f" id="cx7-f" onsubmit="return false"><label class="sr" for="cx7-in">' + t(L('Pesan', 'Message')) + '</label><input id="cx7-in" name="msg" autocomplete="off" placeholder="' + t(L('Tulis pesan…', 'Write a message…')) + '">' + A.btn('primary', L('Kirim', 'Send'), 'arrow', { act: 'send' }) + '</form></div>';
      var room = '<section class="card cx7-r">' + head + '<div class="cx7-m" id="cx7-m">' + msgs(c0, id) + '</div>' + comp + '</section>';
      if (mob()) return room;
      return '<div class="cx7g"><aside class="card cx7-a"><h2 class="h5">' + ic('message') + t(L('Ruang chat', 'Chat rooms')) + '</h2>' + rooms(c0, id) + '</aside>' + room + '</div>';
    },
    after: function (c) {
      var id = c.rec, box = document.getElementById('cx7-m'); if (!id || !box) return;
      box.scrollTop = box.scrollHeight;
      var inpEl = document.getElementById('cx7-in'); if (inpEl) inpEl.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); sendText(id); } });
      var n0 = (E.messages(cx(), id) || []).length;
      var iv = setInterval(function () { var b = document.getElementById('cx7-m'); if (!b || A.S.rec !== id) { clearInterval(iv); return; } E.tick(); var n = (E.messages(cx(), id) || []).length; if (n !== n0) { n0 = n; b.innerHTML = msgs(cx(), id); b.scrollTop = b.scrollHeight; } }, 6000);
      G.onPhoto.chat = function (src) { var r = E.send(cx(), id, 'photo', src); if (!r.ok) return fail(r); G.resetPh('chat'); refresh(id); };
    },
    act: {
      send: function () { sendText(A.S.rec); },
      pin: function () { var r = E.send(cx(), A.S.rec, 'pin', null, null); if (!r.ok) return fail(r); refresh(A.S.rec); },
      loc: function () { var r = E.send(cx(), A.S.rec, 'loc', null, null); if (!r.ok) return fail(r); refresh(A.S.rec); },
      ref: function () {
        var c0 = cx(), id = A.S.rec, list = E.orders(c0, { date: E.TODAY }).filter(function (o) { return o.id !== id; });
        if (E.isClient(c0)) list = list.filter(function (o) { return o.cl === c0.client; });
        if (E.myDriver(c0)) { var tr = E.myTrip(c0); list = tr ? E.tripOrders(tr).filter(function (o) { return o.id !== id; }) : []; }
        if (!list.length) return A.toast(L('Tidak ada order lain untuk dirujuk.', 'No other order to reference.'), 'warn');
        dlg({ title: L('Rujuk order lain', 'Reference another order'), icon: 'link', body: fld('Order', sel('ref', list.map(function (o) { return [o.id, o.id + ' · ' + E.propName(o.prop) + ' · ' + o.win[0]]; }), list[0].id), { req: true, wide: true }),
          onOk: function (v) { var r = E.send(cx(), id, 'ref', null, v.ref); if (!r.ok) return r.msg; refresh(id); return true; } });
      },
      promote: function (el) { var r = E.promote(cx(), el.getAttribute('data-val')); if (!r.ok) return fail(r); refresh(A.S.rec); A.toast(L('Lampiran disimpan sebagai bukti transaksi.', 'Attachment saved as transaction evidence.')); }
    }
  };
  function refresh(id) { var b = document.getElementById('cx7-m'); if (b) { b.innerHTML = msgs(cx(), id); b.scrollTop = b.scrollHeight; } else A.rerender(); }
  function sendText(id) { var el = document.getElementById('cx7-in'); if (!el) return; var r = E.send(cx(), id, 'text', el.value); if (!r.ok) return fail(r); el.value = ''; refresh(id); el.focus(); }

  /* ================= NP-10 · TIMELINE-001 Route Timeline ================= */
  V['TIMELINE-001'] = {
    title: function (rec) { var tr = rec && E.trip(rec); return tr ? L('Timeline · ' + E.empName(tr.drv), 'Timeline · ' + E.empName(tr.drv)) : null; },
    render: function (c) {
      var c0 = cx(), id = c.rec, drv = E.myDriver(c0);
      if (!id && drv) { var mt = E.myTrip(c0); id = mt && mt.id; if (!id) return A.stateCard('empty', L('Belum ada perjalanan hari ini.', 'No trip today yet.')); }
      if (!id) {
        var trs = E.trips(c0);
        return A.pageHead(null, t(L('Urutan kejadian setiap rute: shift, berangkat, tiba, pickup, delivery, masalah, kembali dan selesai.', 'Each route\'s events: shift, depart, arrive, pickup, delivery, issue, return and complete.'))) + (trs.length ? '<div class="rt7l">' + trs.map(function (tr) {
          var rows = E.timeline(c0, tr.id) || [], last = rows[rows.length - 1];
          return '<a class="rt7 rt7-' + G.colorOf(tr) + '" href="' + href('TIMELINE-001', tr.id) + '"><span class="rt7-h">' + av(tr.drv) + '<span><b>' + esc(E.empName(tr.drv)) + '</b><small>' + esc(tr.id + ' · ' + tr.veh) + '</small></span>' + liveC(E.liveStatus(tr)) + '</span><span class="rt7-m"><span>' + ic('history') + rows.length + ' ' + t(L('kejadian', 'events')) + '</span>' + (last ? '<span>' + t(E.TL[last.k] ? E.TL[last.k][0] : L(last.k, last.k)) + ' · ' + esc(String(last.at).slice(11, 16)) + '</span>' : '') + '</span></a>';
        }).join('') + '</div>' : A.stateCard('empty', L('Belum ada perjalanan hari ini.', 'No trip today yet.')));
      }
      var tr = E.trip(id); if (!tr) return A.stateCard('empty', L('Trip tidak ditemukan.', 'Trip not found.'), A.backBtn('blue'));
      var rows = E.timeline(c0, id); if (!rows) return A.stateCard('noperm', E.MSG.notyours, A.backBtn('blue'));
      var os = E.tripOrders(tr), pl = E.plan(tr), d = E.driver(tr.drv);
      var strip = tiles([
        tile({ k: L('Mulai shift', 'Shift start'), v: tr.shiftStart ? String(tr.shiftStart).slice(11, 16) : '—', s: t(L('jadwal ', 'planned ')) + d.shift[0] }),
        tile({ k: L('Stop selesai', 'Stops done'), v: E.doneCount(tr) + '/' + os.filter(function (o) { return o.st !== 'cancelled'; }).length }),
        tile({ k: L('Masalah', 'Issues'), v: rows.filter(function (r) { return r.k === 'issue'; }).length, tone: rows.some(function (r) { return r.k === 'issue'; }) ? 'warn' : '' }),
        tile({ k: tr.atPlant ? L('Tiba di plant', 'At the plant') : L('Perkiraan selesai', 'Expected end'), v: tr.atPlant ? String(tr.atPlant).slice(11, 16) : hm(pl.end), s: tr.st === 'done' ? t(L('shift selesai', 'shift ended')) : '' })
      ], 'tls5-4');
      var tl = '<ol class="tl7">' + rows.map(function (r) {
        var k = E.TL[r.k] || [L(r.k, r.k), 'info'], o = r.ord && E.order(r.ord);
        return '<li class="tl7-i tl7-' + r.k + '"><span class="tl7-t num">' + esc(String(r.at).slice(11, 16)) + '</span><span class="tl7-ic">' + ic(k[1]) + '</span><div><b>' + t(k[0]) + '</b>' + (o ? ' · ' + (open('ORDER-003') ? lnk('ORDER-003', o.id, pname(o.prop)) : pname(o.prop)) : r.ref ? ' · <span class="mono6">' + esc(r.ref) + '</span>' : '') + '<small>' + emp(r.by) + (r.iss && open('ISSUE-002') ? ' · ' + lnk('ISSUE-002', r.iss, esc(r.iss)) : '') + '</small></div></li>';
      }).join('') + (tr.st !== 'done' ? '<li class="tl7-i tl7-next"><span class="tl7-t num">' + hm(pl.end) + '</span><span class="tl7-ic">' + ic('factory') + '</span><div><b>' + t(L('Perkiraan kembali ke plant', 'Expected back at the plant')) + '</b></div></li>' : '') + '</ol>';
      var hd = '<section class="card c6-hd"><div class="c6-hd-m">' + av(tr.drv, 'av7-l') + '<div class="c6-hd-t"><h1>' + esc(d.n) + ' ' + liveC(E.liveStatus(tr)) + '</h1><p><span class="mono6">' + esc(tr.id) + '</span> · ' + esc(tr.veh) + (tr.route ? ' · ' + esc(tr.route + ' ' + (E.route(tr.route) || {}).n) : '') + ' · ' + esc(day(E.TODAY)) + '</p></div></div>' +
        '<div class="c6-hd-a">' + (open('TRACK-002') && tr.track && tr.track.on ? A.btn('ghost', L('Lacak Live', 'Live Tracking'), 'pin', { go: 'TRACK-002', rec: tr.id }) : '') + (open('ROUTE-002') ? A.btn('ghost', L('Rute', 'Route'), 'route', { go: 'ROUTE-002', rec: tr.id }) : '') + '</div></section>';
      return hd + strip + '<div class="g7-2"><div class="g7-c">' + card(L('Timeline', 'Timeline'), tl, { icon: 'history', count: rows.length }) + '</div><div class="g7-c">' + card(L('Peta rute', 'Route map'), map({ trips: [tr], fit: true, stopLabels: true, drivers: driverMarks(c0, [tr]) }), { icon: 'route' }) + '</div></div>';
    }
  };

  /* ================= LOG-KPI-001 Logistics KPI (§76–§77) ================= */
  function kTone(def, v) { if (v == null) return ''; var good = def[3] === 'higher' ? v >= def[4] : v <= def[4]; var near = def[3] === 'higher' ? v >= def[4] - 3 : v <= def[4] * 1.25; return good ? 'ok' : near ? 'warn' : 'crit'; }
  function kVal(def, v) { return v == null ? '—' : v + (def[2] === '%' ? '%' : def[2] ? ' ' + T(def[2]) : ''); }
  V['LOG-KPI-001'] = {
    render: function () {
      var all = E.kpi(), per = E.kpiByDriver();
      var grid = '<div class="tls5 tls5-4 kp7">' + E.KPIS.map(function (d) { var v = all.k[d[0]], tn = kTone(d, v); return tile({ k: d[1], v: kVal(d, v), s: t(L('Target ', 'Target ')) + (d[3] === 'higher' ? '≥ ' : '≤ ') + kVal(d, d[4]) + (all.today[d[0]] != null ? ' · ' + t(L('hari ini ', 'today ')) + kVal(d, all.today[d[0]]) : ''), tone: tn }); }).join('') + '</div>';
      var cols = ['arrOn', 'pickOn', 'delOn', 'evid', 'hoAcc', 'routeIss', 'perDay'].map(function (k) { return E.KPIS.filter(function (d) { return d[0] === k; })[0]; });
      var tbl = A.list(per, [{ h: L('Driver', 'Driver'), v: function (x) { return '<span class="dr7">' + av(x.id) + '<b>' + esc(x.d ? x.d.n : E.empName(x.id)) + '</b></span>'; } }].concat(cols.map(function (d) { return { h: d[1], cls: 'num', v: function (x) { var v = x.k[d[0]], tn = kTone(d, v); return '<span class="t6-' + (tn === 'ok' ? 'ok' : tn === 'crit' ? 'crit' : tn === 'warn' ? 'warn' : '') + '">' + esc(kVal(d, v)) + '</span>'; } }; })),
        function (x) { return { t: esc(x.d ? x.d.n : x.id), r: esc(kVal(cols[2], x.k.delOn)), s: t(L('Tepat waktu ', 'On time ')) + esc(kVal(cols[0], x.k.arrOn)) + ' · ' + t(L('Bukti ', 'Evidence ')) + esc(kVal(cols[3], x.k.evid)) }; },
        function (x) { return open('PERSON-001') ? href('PERSON-001', x.id) : null; });
      return A.pageHead(null, t(L('12 KPI logistik dihitung otomatis dari data trip, bukti dan handover (30 hari terakhir + hari ini).', '12 logistics KPIs calculated automatically from trips, evidence and handovers (last 30 days + today).'))) + grid +
        card(L('Per driver', 'Per driver'), tbl, { icon: 'users', count: per.length }) +
        note(t(L('KPI driver mengisi Personal Score Fase 5: tepat waktu delivery, kepatuhan rute, akurasi POD, jumlah masalah dan km per stop.', 'Driver KPIs feed the Phase 5 Personal Score: delivery on time, route compliance, POD accuracy, issue count and km per stop.')) + (open('PERSON-001') ? ' ' + lnk('PERSON-001', 'EMP-002', t(L('Lihat contoh: Ketut', 'See example: Ketut'))) : ''), 'link', 'info');
    }
  };
})();
