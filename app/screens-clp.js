/* JFRESH OS — Phase 11 screens: Client Portal (NP-01…NP-06), CLP-001…CLP-015.
   Client side: simple, hospitality-first, mobile first — large numbers, large buttons, one primary action,
   details only after a tap. Every number and every action goes through the client portal engine
   (assets/js/jfos-clp.js), which isolates the client and the property scope and audits every change.
   Staff side (same screens, separate view): the case queue and case actions (clp.case.manage) on CLP-010 / CLP-012,
   and approval of waiting reschedule / cancel / schedule requests (lg.dispatch) on CLP-004. */
(function () {
  var A = window.JFAPP, K = window.JFCLP, H = A && A.P5, G = A && A.P7;
  if (!A || !K || !H || !G) return;
  var V = A.V, T = A.T, L = A.L, t = A.t, esc = A.esc, ic = A.ic, href = A.href, fmt = A.fmt, can = A.can;
  var card = H.card, kv = H.kv, note = H.note, dlg = H.dlg, fld = H.fld, inp = H.inp, sel = H.sel, area = H.area, open = H.open;
  A.addParents(K.PARENTS);
  function cx() { return A.ctx(); }
  function sc() { return K.scope(cx()) || {}; }
  function vals(el) { return G.vals(el); }

  /* ---------- Formatting ---------- */
  function rp(v) { return v == null || isNaN(v) ? '—' : (v < 0 ? '−' : '') + fmt.rp(Math.abs(v)); }
  function rps(v) { return v == null || isNaN(v) ? '—' : fmt.rpShort(v); }
  function kg(v) { return v == null ? '' : fmt.kg(v); }
  function day(d) { if (!d) return '—'; d = String(d).slice(0, 10); if (d === K.today()) return T(L('Hari ini', 'Today')); if (d === K.u.addDays(K.today(), 1)) return T(L('Besok', 'Tomorrow')); return T(K.u.dLabel(d)); }
  function tx(v) { return v == null ? "" : Array.isArray(v) ? t(v) : esc(v); }
  function posRole(u) { var r = T(u.roleName), p = u.pos || ""; return esc(p && p.toLowerCase() !== String(r).toLowerCase() ? p + " · " + r : r); }
  function dtm(s) { if (!s) return '—'; s = String(s); return esc(day(s)) + (s.length > 10 ? ' · ' + esc(s.slice(11, 16)) : ''); }
  function win(w) { return w && w.length ? esc(w.join('–')) : ''; }
  function mono(id) { return '<span class="mono6">' + esc(id) + '</span>'; }
  function initials(n) { return String(n || '?').split(/\s+/).slice(0, 2).map(function (x) { return x.charAt(0); }).join('').toUpperCase(); }
  function errMsg(r) { if (!r) return K.MSG.invalid; if (r.errors) { var k = Object.keys(r.errors).filter(function (x) { return r.errors[x]; })[0]; if (k) return r.errors[k]; } return r.msg || K.MSG.invalid; }
  function fail(r) { A.toast(errMsg(r), 'crit'); return false; }
  function after(msg, tone) { A.rerender(); setTimeout(function () { A.toast(msg, tone); }, 280); }
  function goToast(id, rec, msg, q) { A.go(id, rec, q); setTimeout(function () { A.toast(msg); }, 420); }
  var KIND = { pickup: L('Pickup', 'Pickup'), delivery: L('Delivery', 'Delivery'), process: L('Produksi', 'Production') };

  /* ---------- Shared client pieces ---------- */
  // Subtle Bali touch (§1, §69): a faint frangipani and temple silhouette, in its own corner, never behind text.
  function deco() {
    var petals = [0, 72, 144, 216, 288].map(function (a) { return '<ellipse cx="60" cy="38" rx="13" ry="24" transform="rotate(' + a + ' 60 60)"/>'; }).join('');
    return '<span class="cp11-deco" aria-hidden="true"><svg viewBox="0 0 160 120"><g class="cp11-temple"><path d="M118 112V96h22v16M112 96h34l-6-10h-22zM116 86h26l-5-9h-16zM120 77h18l-4-8h-10zM124 69h10l-5-9z"/></g>' +
      '<g class="cp11-flower">' + petals + '<circle cx="60" cy="60" r="7" class="cp11-fc"/></g></svg></span>';
  }
  function propSel() {
    var s = sc(), ps = K.props(cx()), c = K.client(s.cl) || {};
    if (!s.client || !ps.length) return '';
    if (ps.length < 2) return '<span class="cp11-ps cp11-ps-1">' + ic('building') + '<span><b>' + esc(ps[0].n) + '</b><small>' + esc(c.n || '') + '</small></span></span>';
    return '<label class="cp11-ps">' + ic('building') + '<span class="sr">' + t(L('Pilih property', 'Choose property')) + '</span><select data-cp11-prop="1">' +
      '<option value="all"' + (s.sel === 'all' ? ' selected' : '') + '>' + esc(c.n || '') + ' · ' + t(L('Semua Property', 'All Properties')) + '</option>' +
      ps.map(function (p) { return '<option value="' + esc(p.id) + '"' + (s.sel === p.id ? ' selected' : '') + '>' + esc(p.n) + '</option>'; }).join('') + '</select>' + ic('chevd') + '</label>';
  }
  function hero(title, sub, o) {
    o = o || {};
    return '<section class="cp11-hero' + (o.cls ? ' ' + o.cls : '') + '"><div class="cp11-hero-t"><h1>' + title + '</h1>' + (sub ? '<p>' + sub + '</p>' : '') + (o.sel === false ? '' : propSel()) + (o.extra || '') + '</div>' + deco() + '</section>';
  }
  function tile(o) {
    var tag = o.go ? 'a' : 'div';
    return '<' + tag + ' class="cp11-tile cp11-t-' + (o.tone || 'info') + '"' + (o.go ? ' href="' + href(o.go, o.rec, o.q) + '"' : '') + '><span class="cp11-tile-ic">' + ic(o.icon) + '</span><span class="cp11-tile-b"><b class="num">' + o.v + '</b><span>' + t(o.k) + '</span>' + (o.s ? '<small>' + o.s + '</small>' : '') + '</span></' + tag + '>';
  }
  function tiles(list, cls) { return '<div class="cp11-tiles' + (cls ? ' ' + cls : '') + '">' + list.filter(Boolean).map(tile).join('') + '</div>'; }
  function track5(steps, o) {
    o = o || {};
    return '<ol class="cp11-tr' + (o.mini ? ' cp11-tr-m' : '') + '">' + steps.map(function (s) {
      return '<li class="cp11-s-' + s.st + '"><span class="cp11-tr-d">' + ic(s.st === 'done' ? 'check' : s.i) + '</span><span class="cp11-tr-l">' + t(s.l) + '</span>' + (o.times ? '<small>' + (s.at ? esc(String(s.at).slice(11, 16)) : '&nbsp;') + '</small>' : '') + '</li>';
    }).join('') + '</ol>';
  }
  function stChip(r) { return A.chip(r.tone, r.label, r.icon); }
  function jobHref(r) { var s = sc(), x = r.link.s; if (x === 'CLP-005' && !(s.perms && s.perms.track)) x = 'CLP-006'; return href(x, r.link.rec); }
  function jobCard(r, o) {
    o = o || {};
    var sub = [t(KIND[r.kind]), mono(r.ord || r.id), T(r.svcName) !== '—' ? t(r.svcName) : '', r.kg ? esc(kg(r.kg)) : r.bags ? esc(r.bags + ' bag') : ''].filter(Boolean).join(' · ');
    var when = r.eta && r.eta.at ? '<span class="cp11-eta' + (r.eta.late ? ' is-late' : '') + '">' + ic('clock') + 'ETA ' + esc(r.eta.at) + '</span>' : r.win ? '<span class="cp11-when">' + esc(day(r.date)) + ' · ' + win(r.win) + '</span>' : '<span class="cp11-when">' + esc(day(r.date)) + '</span>';
    return '<a class="cp11-job cp11-j-' + r.tone + '" href="' + jobHref(r) + '"><span class="cp11-job-ic">' + ic(r.icon) + '</span><span class="cp11-job-b"><b>' + esc(r.propName) + '</b><small>' + sub + '</small></span>' +
      '<span class="cp11-job-r">' + stChip(r) + when + '</span>' + ic('chevr', 'cp11-go') + (o.track === false ? '' : '<span class="cp11-job-tr">' + track5(r.steps, { mini: true }) + '</span>') + '</a>';
  }
  function blocked() { return A.stateCard('noperm', K.MSG.blocked, null, L('Akses tidak aktif', 'Access not active')); }
  function noAccess(back) { return A.stateCard('noperm', K.MSG.scope, A.btn('blue', L('Kembali', 'Back'), 'arrowl', { go: back || 'HOM-CLT-001' }), L('Tidak ada akses', 'No access')); }
  function loadErr() { return A.stateCard('error', K.MSG.loadErr, A.btn('blue', K.MSG.retry, 'refresh', { act: 'retry' })); }
  function emptyBox(msg, actions) { return '<div class="cp11-empty">' + ic('package') + '<p>' + t(msg) + '</p>' + (actions ? '<div class="cp11-empty-a">' + actions + '</div>' : '') + '</div>'; }
  function clientOnly() { return A.stateCard('noperm', L('Layar ini untuk pengguna portal klien.', 'This screen is for client portal users.'), A.backBtn('blue')); }
  // Client guard: returns an html string to show instead of the screen, or null.
  function guard() { var s = sc(); if (!s.client) return clientOnly(); if (s.blocked) return blocked(); return null; }
  function contactCard(title, sub) {
    return '<section class="cp11-help">' + ic('headset') + '<div><b>' + t(title || L('Butuh bantuan cepat?', 'Need quick help?')) + '</b><span>' + t(sub || L('Tim kami siap membantu Anda.', 'Our team is ready to help you.')) + '</span></div>' +
      '<a class="btn btn-outline" href="tel:+62361900100">' + ic('phone') + '<span>' + t(L('Hubungi Kami', 'Contact Us')) + '</span></a></section>';
  }
  function search(ph, val) { return '<label class="cp11-q">' + ic('search') + '<input type="search" data-f="q" value="' + esc(val || '') + '" placeholder="' + t(ph) + '" enterkeyhint="search"></label>'; }
  function selF(key, label, opts, v) { return '<label class="cp11-f"><span class="sr">' + t(label) + '</span><select data-f="' + key + '"><option value="">' + t(label) + ': ' + t(L('Semua', 'All')) + '</option>' + opts.map(function (o) { return '<option value="' + esc(o[0]) + '"' + (String(v || '') === String(o[0]) ? ' selected' : '') + '>' + t(o[1]) + '</option>'; }).join('') + '</select></label>'; }
  function dateF(key, label, v) { return '<label class="cp11-f cp11-fd"><span>' + t(label) + '</span><input type="date" data-f="' + key + '" value="' + esc(v || '') + '"></label>'; }
  function back(id, label) { return '<a class="cp11-back" href="' + href(id) + '">' + ic('arrowl') + '<span>' + t(label || L('Kembali', 'Back')) + '</span></a>'; }

  /* Property selector (§3, §24): remembered by the engine for every portal screen. */
  document.addEventListener('change', function (e) {
    var el = e.target.closest && e.target.closest('[data-cp11-prop]');
    if (!el) return;
    var r = K.setProp(cx(), el.value);
    if (!r.ok) { fail(r); return; }
    var q = Object.assign({}, A.S.q); delete q.prop; A.go(A.S.screen, A.S.rec, q); A.rerender();
  });

  /* ---------- Self-service dialogs (§7, §9, §10) ---------- */
  function winOpts() { return K.WINDOWS.map(function (w) { return [w.join('|'), w.join('–')]; }); }
  // Pickup orders the client can still move or cancel: before the driver leaves for reschedule, before on-the-way for cancel.
  function movable(kind) {
    var ok = kind === 'cancel' ? ['requested', 'sched', 'assigned'] : ['requested', 'sched', 'assigned', 'otw', 'arrived'];
    return K.active(cx(), 'all').filter(function (r) { return r.kind === 'pickup' && ok.indexOf(r.st) >= 0; });
  }
  function ordPick(kind, id) {
    if (id) return '<input type="hidden" name="ord" value="' + esc(id) + '">';
    var list = movable(kind);
    return fld(L('Pesanan pickup', 'Pickup order'), sel('ord', list.map(function (r) { return [r.id, [r.id + ' · ' + r.propName + ' · ' + day(r.date) + ' ' + (r.win || []).join('–'), r.id + ' · ' + r.propName + ' · ' + day(r.date) + ' ' + (r.win || []).join('–')]]; })), { req: true, wide: true });
  }
  function reschedDlg(id) {
    if (!id && !movable('resched').length) { A.toast(L('Tidak ada pickup yang bisa dijadwalkan ulang.', 'No pickup can be rescheduled.'), 'warn'); return; }
    dlg({ title: L('Request Reschedule', 'Request Reschedule'), icon: 'calendar', ok: L('Kirim Permintaan', 'Send Request'),
      sub: t(L('Pickup yang belum berjalan langsung dipindah. Pickup yang sedang berjalan atau dari jadwal rutin menunggu konfirmasi tim JFRESH.', 'A pickup that has not started moves at once. A running pickup or one from the recurring schedule waits for the JFRESH team.')),
      body: ordPick('resched', id) + fld(L('Tanggal baru', 'New date'), '<input type="date" name="date" min="' + esc(K.today()) + '" value="' + esc(K.u.addDays(K.today(), 1)) + '">', { req: true }) +
        fld(L('Jendela waktu', 'Time window'), sel('win', winOpts(), '09:00|10:00'), { req: true }) + fld(L('Alasan', 'Reason'), area('reason', '', L('Contoh: tamu check-out lebih siang', 'Example: guests check out later')), { req: true, wide: true }),
      onOk: function (v, el) {
        v = vals(el); var r = K.requestReschedule(cx(), v.ord, { date: v.date, win: String(v.win).split('|'), reason: v.reason });
        if (!r.ok) return errMsg(r);
        goToast('CLP-004', r.request.id, r.applied ? L('Jadwal pickup diperbarui.', 'Pickup schedule updated.') : L('Permintaan terkirim. Menunggu konfirmasi tim JFRESH.', 'Request sent. Waiting for the JFRESH team.'));
        return true;
      } });
  }
  function cancelDlg(id) {
    if (!id && !movable('cancel').length) { A.toast(L('Tidak ada pickup yang bisa dibatalkan.', 'No pickup can be cancelled.'), 'warn'); return; }
    dlg({ title: L('Batalkan Permintaan', 'Cancel Request'), icon: 'xc', ok: L('Batalkan Pickup', 'Cancel Pickup'),
      sub: t(L('Pickup yang sudah berjalan tidak bisa dibatalkan dari portal.', 'A pickup already under way cannot be cancelled from the portal.')),
      body: ordPick('cancel', id) + fld(L('Alasan pembatalan', 'Cancellation reason'), area('reason', '', L('Contoh: linen belum siap', 'Example: linen not ready')), { req: true, wide: true }),
      onOk: function (v, el) {
        v = vals(el); var r = K.requestCancel(cx(), v.ord, { reason: v.reason });
        if (!r.ok) return errMsg(r);
        goToast('CLP-004', r.request.id, r.applied ? L('Pickup dibatalkan.', 'Pickup cancelled.') : L('Permintaan pembatalan terkirim.', 'Cancellation request sent.'));
        return true;
      } });
  }
  function schedDlg(schId) {
    var acts = [['skip', L('Lewati satu hari', 'Skip one day'), 'xc'], ['reschedule', L('Pindah tanggal', 'Move a date'), 'calendar'], ['pause', L('Jeda sementara', 'Pause for a while'), 'pause']];
    dlg({ title: L('Ubah Jadwal Rutin', 'Change Recurring Schedule'), icon: 'calendar', ok: L('Kirim Permintaan', 'Send Request'),
      sub: t(L('Jadwal rutin mengikuti kontrak. Perubahan selalu menunggu persetujuan tim JFRESH.', 'The recurring schedule follows the contract. Changes always wait for the JFRESH team.')),
      body: fld(L('Perubahan', 'Change'), G.choice('act', acts, 'skip'), { req: true, wide: true }) +
        fld(L('Tanggal (lewati / mulai jeda)', 'Date (skip / pause from)'), '<input type="date" name="date" min="' + esc(K.today()) + '" value="' + esc(K.u.addDays(K.today(), 1)) + '">') +
        fld(L('Pindah dari tanggal', 'Move from date'), '<input type="date" name="from" min="' + esc(K.today()) + '">') + fld(L('Ke tanggal', 'To date'), '<input type="date" name="to" min="' + esc(K.today()) + '">') +
        fld(L('Alasan', 'Reason'), area('reason', ''), { req: true, wide: true }),
      onOk: function (v, el) {
        v = vals(el); var f = { act: v.act, reason: v.reason };
        if (v.act === 'reschedule') { f.from = v.from; f.to = v.to; } else { f.date = v.date; if (v.act === 'pause') { f.from = v.date; f.to = v.to || null; } }
        var r = K.requestScheduleChange(cx(), schId, f);
        if (!r.ok) return errMsg(r);
        goToast('CLP-004', r.request.id, L('Permintaan terkirim. Menunggu persetujuan tim JFRESH.', 'Request sent. Waiting for the JFRESH team.'));
        return true;
      } });
  }

  /* ---------- Documents: view / download / share (§14) ---------- */
  function docView(id) {
    var r = K.viewDoc(cx(), id); if (!r.ok) return fail(r);
    dlg({ title: L(r.title, r.title), icon: 'download', ok: L('Unduh', 'Download'), sub: esc(r.sub),
      body: '<div class="cp11-doc">' + kv(r.rows.map(function (x) { return [L(x[0], x[0]), esc(x[1])]; })) + '</div>',
      onOk: function () { docDownload(id); return true; } });
  }
  function docDownload(id) {
    var r = K.downloadDoc(cx(), id); if (!r.ok) return fail(r);
    H.download(r.name, r.body, r.mime); A.toast(L('Dokumen diunduh.', 'Document downloaded.'));
  }
  function docShare(id) {
    dlg({ title: L('Bagikan Dokumen', 'Share Document'), icon: 'link', ok: L('Bagikan', 'Share'), sub: mono(id) + ' · ' + t(L('Tautan berlaku 7 hari.', 'The link is valid for 7 days.')),
      body: fld(L('Email penerima', 'Recipient email'), inp('to', '', { type: 'email', ph: L('nama@perusahaan.com', 'name@company.com') }), { req: true, wide: true }) + fld(L('Pesan (opsional)', 'Message (optional)'), area('note', ''), { wide: true }),
      onOk: function (v, el) { v = vals(el); var r = K.shareDoc(cx(), id, { to: v.to, note: v.note }); if (!r.ok) return errMsg(r); A.toast(L('Dokumen dibagikan ke ' + r.share.to + ' (berlaku sampai ' + r.share.exp.slice(0, 10) + ').', 'Document shared with ' + r.share.to + ' (valid until ' + r.share.exp.slice(0, 10) + ').')); return true; } });
  }
  // Sharing depends on the user's client role only (the engine re-checks on share): ask the engine once per user.
  var SHARE = {};
  function shareRole(id) { var u = cx().uid; if (!(u in SHARE)) SHARE[u] = K.canShare(cx(), id); return SHARE[u]; }
  var DOC_TONE = { pod: 'ok', dn: 'info', sc: 'ok', ret: 'warn', inv: 'appr', stmt: 'appr', res: 'info', contract: 'mute' };
  function docRow(d, o) {
    o = o || {};
    var share = o.share !== false && d.share && shareRole(d.id);
    return '<div class="cp11-docr"><span class="cp11-docr-ic cp11-dt-' + (DOC_TONE[d.type] || 'info') + '">' + ic(d.icon) + '</span><span class="cp11-docr-b"><b>' + t(d.n) + '</b><small>' + t(d.typeLabel) + ' · ' + esc(d.propName) + ' · ' + esc(day(d.date)) + '</small></span>' +
      '<span class="cp11-docr-a">' + A.btn('ghost', L('Lihat', 'View'), 'eye', { act: 'docView', val: d.id, cls: 'btn-sm' }) + A.btn('ghost', L('Unduh', 'Download'), 'download', { act: 'docGet', val: d.id, cls: 'btn-sm' }) +
      (share ? A.btn('ghost', L('Bagikan', 'Share'), 'link', { act: 'docShare', val: d.id, cls: 'btn-sm' }) : '') + '</span></div>';
  }
  function docChips(list) {
    return '<div class="cp11-dchips">' + list.map(function (d) { return '<button type="button" class="cp11-dchip cp11-dt-' + (DOC_TONE[d.type] || 'info') + '" data-act="docView" data-val="' + esc(d.id) + '">' + ic(d.icon) + '<span>' + t(d.typeLabel) + '</span></button>'; }).join('') + '</div>';
  }
  var DOC_ACT = { docView: function (el) { docView(el.getAttribute('data-val')); }, docGet: function (el) { docDownload(el.getAttribute('data-val')); }, docShare: function (el) { docShare(el.getAttribute('data-val')); } };
  function acts(x) { return Object.assign({}, DOC_ACT, { resched: function (el) { reschedDlg(el.getAttribute('data-val')); }, cancelOrd: function (el) { cancelDlg(el.getAttribute('data-val')); }, schedChg: function (el) { schedDlg(el.getAttribute('data-val')); } }, x || {}); }

  /* ---------- Job detail: one service in motion (§12, §13) ---------- */
  var MSG_ST = {
    requested: L('Permintaan Anda sudah diterima. Tim JFRESH akan mengonfirmasi jadwal.', 'Your request was received. The JFRESH team will confirm the schedule.'),
    sched: L('Pickup sudah dijadwalkan.', 'The pickup is scheduled.'), assigned: L('Driver JFRESH sudah ditugaskan.', 'A JFRESH driver is assigned.'),
    otw: L('Driver JFRESH sedang menuju lokasi Anda.', 'The JFRESH driver is on the way to you.'), arrived: L('Driver JFRESH sudah tiba.', 'The JFRESH driver has arrived.'),
    process: L('Cucian Anda sedang diproses di plant JFRESH.', 'Your laundry is being processed at the JFRESH plant.'), washing: L('Cucian Anda sedang dicuci.', 'Your laundry is being washed.'),
    finishing: L('Cucian Anda dalam finishing dan pemeriksaan kualitas.', 'Your laundry is in finishing and quality check.'), packing: L('Cucian Anda sedang dikemas.', 'Your laundry is being packed.'),
    ready: L('Cucian siap dikirim.', 'The laundry is ready to deliver.'), dassigned: L('Driver JFRESH sudah ditugaskan untuk delivery.', 'A JFRESH driver is assigned for delivery.'),
    dotw: L('Cucian sedang dalam pengiriman.', 'The laundry is out for delivery.'), darrived: L('Driver JFRESH sudah tiba untuk delivery.', 'The JFRESH driver has arrived for delivery.'),
    delivered: L('Cucian sudah diterima.', 'The laundry has been received.'), done: L('Layanan selesai.', 'Service complete.'),
    issue: L('Ada kendala pada layanan ini. Tim JFRESH sedang menanganinya.', 'There is a problem with this service. The JFRESH team is handling it.'),
    returned: L('Sebagian cucian dikembalikan ke plant untuk ditangani ulang.', 'Part of the laundry went back to the plant for rework.'), cancelled: L('Layanan ini dibatalkan.', 'This service was cancelled.')
  };
  function jobDetail(r, tr) {
    var s = sc(), c0 = cx();
    var head = '<section class="card cp11-jd"><div class="cp11-jd-h"><span class="cp11-kind">' + ic(r.kind === 'process' ? 'washer' : 'truck') + t(KIND[r.kind]) + '</span>' + mono(r.ord || r.id) + '<span class="hd-sp"></span>' + stChip(r) + '</div>' +
      '<h2>' + esc(r.propName) + '</h2><p class="cp11-mut">' + [T(r.svcName) !== '—' ? t(r.svcName) : '', r.kg ? esc(kg(r.kg)) : '', r.bags ? esc(r.bags + ' bag') : '', r.pcs ? esc(fmt.num(r.pcs, 0) + ' pcs') : ''].filter(Boolean).join(' · ') + '</p>' +
      (r.eta && r.eta.at && r.step < 4 ? '<div class="cp11-etab' + (r.eta.late ? ' is-late' : '') + '">' + ic('truck') + '<span><small>ETA</small><b class="num">' + esc(r.eta.at) + '</b></span>' + (r.eta.min != null ? '<span><small>' + t(L('Perkiraan', 'Estimate')) + '</small><b class="num">' + esc(r.eta.min) + ' ' + t(L('menit', 'min')) + '</b></span>' : '') +
        (r.eta.late ? '<em>' + ic('alert') + t(L('Diperkirakan terlambat ' + r.eta.delay + ' menit', 'Expected ' + r.eta.delay + ' min late')) + '</em>' : r.eta.near ? '<em class="ok">' + ic('pin') + t(L('Hampir tiba', 'Almost there')) + '</em>' : '') + '</div>' : '') +
      track5(r.steps, { times: true }) + '<p class="cp11-msg cp11-m-' + r.tone + '">' + ic(r.icon) + '<span>' + t(MSG_ST[r.st] || '') + '</span></p>' +
      '<p class="cp11-upd">' + ic('clock') + t(L('Update terakhir', 'Last update')) + ': ' + dtm(tr ? tr.lastUpdate : r.upd) + (r.win ? ' · ' + t(L('Jadwal', 'Schedule')) + ' ' + esc(day(r.date)) + ' ' + win(r.win) : '') + '</p></section>';
    var mapC = '';
    if (tr) {
      var live = tr.live && tr.pos && tr.pos.x != null && tr.dest;
      mapC = card(L('Lokasi Driver', 'Driver Location'), live ? G.map({ dests: [{ p: tr.dest, n: r.propName }], drivers: [{ p: { pos: [tr.pos.x, tr.pos.y], fresh: tr.pos.fresh || 'live' }, st: 'moving', n: 'JFRESH' }], fit: true, client: true, label: L('Posisi driver JFRESH', 'JFRESH driver position') }) +
        (tr.driver ? '<p class="cp11-drv">' + ic('user') + t(L('Driver', 'Driver')) + ': <b>' + esc(tr.driver) + '</b>' + (tr.plate ? ' · ' + esc(tr.plate) : '') + '</p>' : '')
        : '<div class="cp11-off">' + ic('lock') + '<span>' + t(tr.ended ? L('Perjalanan selesai. Lokasi driver tidak lagi dibagikan.', 'The trip is complete. The driver location is no longer shared.') : L('Peta tampil saat driver sedang menuju lokasi Anda.', 'The map shows while the driver is on the way to you.')) + '</span></div>', { icon: 'pin' });
    }
    var pod = tr && tr.pod ? card(L('Bukti Terima (POD)', 'Proof of Delivery (POD)'), kv([[L('Penerima', 'Recipient'), esc(tr.pod.recv) + (tr.pod.role ? ' · ' + esc(tr.pod.role) : '')], [L('Waktu', 'Time'), dtm(tr.pod.at)], [L('Paket / item', 'Packages / items'), esc((tr.pod.pkgs || 0) + ' · ' + (tr.pod.qty || 0))], [L('Berat', 'Weight'), esc(kg(tr.pod.kg))], [L('Tanda tangan', 'Signature'), tr.pod.sign ? ic('checkc') : '—']]) +
      '<div class="cp11-row">' + A.btn('ghost', L('Lihat POD', 'View POD'), 'eye', { act: 'docView', val: tr.pod.id, cls: 'btn-sm' }) + A.btn('ghost', L('Unduh', 'Download'), 'download', { act: 'docGet', val: tr.pod.id, cls: 'btn-sm' }) + '</div>', { icon: 'filecheck' }) : '';
    var docs = K.docsFor(c0, r.id);
    var docC = docs.length ? card(L('Dokumen Terkait', 'Related Documents'), docChips(docs), { icon: 'file', link: open('CLP-007') ? ['CLP-007', L('Lihat Semua', 'View All')] : null }) : '';
    var b = [];
    if (tr && tr.chat && open('CHAT-001')) b.push(A.btn('primary', L('Chat dengan JFRESH', 'Chat with JFRESH'), 'message', { go: 'CHAT-001', rec: tr.chat.rec }));
    b.push('<a class="btn btn-ghost" href="tel:' + esc((tr ? tr.contact.phone : '+62 361 900 100').replace(/[^\d+]/g, '')) + '">' + ic('phone') + '<span>' + t(L('Hubungi JFRESH', 'Contact JFRESH')) + '</span></a>');
    if (!tr && r.active && r.kind !== 'process' && s.perms.track) b.push(A.btn('blue', L('Lihat Tracking', 'View Tracking'), 'pin', { go: 'CLP-005', rec: r.id }));
    if (r.kind === 'pickup' && s.perms.pickup && ['requested', 'sched', 'assigned', 'otw', 'arrived'].indexOf(r.st) >= 0) {
      b.push(A.btn('ghost', L('Reschedule', 'Reschedule'), 'calendar', { act: 'resched', val: r.id }));
      if (['requested', 'sched', 'assigned'].indexOf(r.st) >= 0) b.push(A.btn('ghost', L('Batalkan', 'Cancel'), 'xc', { act: 'cancelOrd', val: r.id }));
    }
    if (r.req) b.push(A.btn('ghost', L('Lihat Permintaan', 'View Request'), 'file', { go: 'CLP-004', rec: r.req }));
    if (s.perms.complaint) b.push(A.btn('ghost', L('Laporkan Masalah', 'Report a Problem'), 'alert', { go: 'CLP-011', qs: 'ref=' + encodeURIComponent(r.dlv || r.ord || r.id) }));
    return '<div class="cp11-two"><div class="cp11-col">' + head + mapC + '</div><div class="cp11-col">' + pod + docC +
      card(L('Butuh sesuatu?', 'Need something?'), '<div class="cp11-acts">' + b.join('') + '</div>', { icon: 'headset' }) + '</div></div>';
  }

  /* ================= CLP-001 Client Home (NP-01 §3–§6) ================= */
  V['CLP-001'] = {
    title: function () { return L('Beranda', 'Home'); },
    render: function () {
      var g = guard(); if (g) return g;
      var c0 = cx(), h = K.home(c0); if (!h) return loadErr();
      var s = sc(), cards = h.cards;
      var sum = tiles([
        { k: cards.pickupToday.l, v: esc(cards.pickupToday.n), icon: 'truck', tone: 'ok', go: s.perms.order ? 'CLP-006' : null },
        { k: cards.deliveryOnTheWay.l, v: esc(cards.deliveryOnTheWay.n), icon: 'route', tone: 'info', go: s.perms.track ? 'CLP-005' : null },
        { k: cards.openIssues.l, v: esc(cards.openIssues.n), icon: 'alert', tone: cards.openIssues.n ? 'crit' : 'ok', go: 'CLP-010' },
        cards.outstandingInvoice ? { k: cards.outstandingInvoice.l, v: esc(rps(cards.outstandingInvoice.amt)), s: esc(cards.outstandingInvoice.count) + ' invoice', icon: 'invoice', tone: 'appr', go: 'CLP-008' } : null
      ], 'cp11-tiles-4');
      var QI = { pickup: 'plus', track: 'pin', invoice: 'invoice', issue: 'alert' };
      var quick = h.quick.length ? '<nav class="cp11-quick" aria-label="' + t(L('Aksi cepat', 'Quick actions')) + '">' + h.quick.map(function (q) { return '<a class="cp11-qa cp11-qa-' + q.k + '" href="' + href(q.s) + '">' + ic(QI[q.k] || q.i) + '<span>' + t(q.l) + '</span></a>'; }).join('') + '</nav>' : '';
      var pend = s.perms.order ? K.requests(c0, {}).filter(function (r) { return r.stLive === 'submitted'; }) : [];
      var pendN = pend.length ? '<a class="cp11-notice" href="' + href(pend.length === 1 ? 'CLP-004' : 'CLP-004', pend.length === 1 ? pend[0].id : null) + '">' + ic('clock') + '<span><b>' + esc(pend.length) + ' ' + t(L('permintaan menunggu konfirmasi', 'request(s) waiting for confirmation')) + '</b><small>' + pend.map(function (r) { return esc(r.id) + ' · ' + t(r.typeLabel); }).slice(0, 2).join(' · ') + '</small></span>' + ic('chevr') + '</a>' : '';
      var act = s.perms.order ? card(L('Aktivitas Terbaru', 'Recent Activity'), h.activity.length ? '<div class="cp11-jobs">' + h.activity.map(function (r) { return jobCard(r); }).join('') + '</div>' : emptyBox(h.empty || K.MSG.emptyActive, s.perms.pickup ? A.btn('primary', L('Buat Pickup', 'Create Pickup'), 'plus', { go: 'CLP-003' }) : ''),
        { icon: 'list', link: ['CLP-006', L('Lihat Semua', 'View All')] }) : '';
      var side = '';
      if (s.perms.order) {
        var sch = K.schedules(c0);
        side += card(L('Jadwal Rutin', 'Recurring Schedule'), sch.length ? '<ul class="cp11-sch">' + sch.slice(0, 4).map(function (x) { return '<li>' + ic(x.pick < '12:00' ? 'sparkles' : 'clock') + '<span><b>' + esc(x.propName) + '</b><small>' + t(x.daysLabel) + ' · ' + t(x.pickLabel) + ' ' + win(x.pickWin) + '</small></span></li>'; }).join('') + '</ul>' : '<p class="cp11-mut">' + t(L('Belum ada jadwal rutin.', 'No recurring schedule yet.')) + '</p>', { icon: 'calendar' });
      }
      side += contactCard();
      return hero(t(h.greet) + ',<br><span>' + esc(h.name) + '</span>', t(L('Pantau setiap pesanan laundry Anda dengan mudah.', 'Follow every laundry order with ease.')), { cls: 'cp11-hero-home' }) +
        sum + quick + pendN + '<div class="cp11-main"><div class="cp11-col">' + act + '</div><aside class="cp11-col cp11-side">' + side + '</aside></div>';
    }
  };

  /* ================= CLP-002 Client Login (NP-01 §3): signed-in account and access summary ================= */
  V['CLP-002'] = {
    title: function () { return L('Akun & Login', 'Account & Sign-in'); },
    render: function () {
      var c0 = cx(), s = sc();
      if (!s.client) return A.stateCard('noperm', L('Login klien ada di halaman login JFRESH OS.', 'Client sign-in is on the JFRESH OS sign-in page.'), A.backBtn('blue'));
      if (s.blocked) return blocked();
      var c = K.client(s.cl) || {}, me = K.userRec(c0.uid);
      var perms = K.CP_KEYS.map(function (k) { return '<li class="' + (s.perms[k] ? 'on' : 'off') + '">' + ic(s.perms[k] ? 'checkc' : 'minus') + '<span>' + t(K.CP_LABEL[k]) + '</span></li>'; }).join('');
      return hero(t(L('Akun Saya', 'My Account')), t(L('Anda masuk ke portal klien JFRESH.', 'You are signed in to the JFRESH client portal.')), { sel: false }) +
        '<div class="cp11-two"><div class="cp11-col">' + card(L('Profil', 'Profile'), '<div class="cp11-me"><span class="cp11-av">' + esc(initials(c0.fullName || c0.name)) + '</span><span><b>' + esc(c0.fullName || c0.name) + '</b><small>' + esc(me ? me.pos || '' : '') + (me ? ' · ' : '') + esc(c.n || '') + '</small></span></div>' +
          kv([[L('Username', 'Username'), esc(c0.user ? c0.user.u : '')], [L('Email', 'Email'), esc(me ? me.email : (c0.user && c0.user.email) || '')], [L('Role', 'Role'), t(s.roleName)], [L('Cakupan property', 'Property scope'), t(K.SCOPES[s.scope]) + ' · ' + esc(K.props(c0).map(function (p) { return p.n; }).join(', '))]]), { icon: 'user' }) +
        card(L('Hak Akses Portal', 'Portal Permissions'), '<ul class="cp11-perms">' + perms + '</ul>', { icon: 'shield' }) + '</div><div class="cp11-col">' +
        card(L('Keamanan Login', 'Sign-in Security'), '<ul class="cp11-list">' + [[L('Masuk dengan email atau username dan password.', 'Sign in with email or username and password.'), 'key'], [L('Lupa password? Gunakan "Lupa Password" di halaman login.', 'Forgot your password? Use "Forgot Password" on the sign-in page.'), 'help'], [L('"Ingat Saya" hanya di perangkat pribadi.', '"Remember Me" only on a personal device.'), 'lock']].map(function (x) { return '<li>' + ic(x[1]) + '<span>' + t(x[0]) + '</span></li>'; }).join('') + '</ul>' +
          '<div class="cp11-acts">' + (open('USER-002') ? A.btn('ghost', L('Ganti Password', 'Change Password'), 'key', { go: 'USER-002' }) : '') + A.btn('ghost', L('Keluar', 'Sign Out'), 'logout', { act: 'logout' }) + '</div>', { icon: 'key' }) + contactCard() + '</div></div>';
    }
  };

  /* ================= CLP-003 Pickup Request (NP-02 §7–§10): 1 Detail · 2 Schedule · 3 Confirmation ================= */
  var PK = null;
  function pkInit(o) {
    var c0 = cx(), d = o.defaults;
    PK = { uid: c0.uid, step: 1, err: {}, mode: 'pickup', sch: null, f: { prop: d.prop, svc: d.svc, bags: 4, kg: '', pcs: '', pic: d.pic, phone: d.phone, notes: '', instr: d.instr, date: K.today(), win: null } };
  }
  function pkCollect() {
    var box = document.getElementById('cp11-pk'); if (!box || !PK) return;
    var v = vals(box);
    ['prop', 'svc', 'bags', 'kg', 'pcs', 'pic', 'phone', 'notes', 'instr', 'date'].forEach(function (k) { if (k in v) PK.f[k] = v[k]; });
    if ('win' in v && v.win) PK.f.win = v.win.split('|');
    if ('sch' in v) PK.sch = v.sch || null;
  }
  function ferr(k) { return PK.err[k] ? '<small class="cp11-ferr">' + ic('alert') + t(PK.err[k]) + '</small>' : ''; }
  function pkF(label, html, k, o) { o = o || {}; return '<div class="cp11-fl' + (o.wide ? ' cp11-fl-w' : '') + (PK.err[k] ? ' has-err' : '') + '"><span class="cp11-fl-l">' + t(label) + (o.req ? ' <i>*</i>' : '') + (o.opt ? ' <em>' + t(L('(opsional)', '(optional)')) + '</em>' : '') + '</span>' + html + ferr(k) + '</div>'; }
  function pkBody(o) {
    var f = PK.f, step = PK.step, s = sc();
    var steps = [[L('Detail', 'Detail'), L('Isi informasi pickup', 'Pickup information')], [L('Jadwal', 'Schedule'), L('Pilih tanggal & waktu', 'Choose date & time')], [L('Konfirmasi', 'Confirmation'), L('Periksa dan kirim', 'Check and send')]];
    var bar = '<ol class="cp11-steps">' + steps.map(function (x, i) { var n = i + 1; return '<li class="' + (n < step ? 'done' : n === step ? 'now' : '') + '"><span>' + (n < step ? ic('check') : n) + '</span><b>' + t(x[0]) + '</b><small>' + t(x[1]) + '</small></li>'; }).join('') + '</ol>';
    var body = '';
    if (step === 1) {
      var props = o.props;
      body = '<h2 class="cp11-h2">' + t(L('Detail Permintaan', 'Request Detail')) + '</h2><div class="cp11-form">' +
        pkF(L('Property', 'Property'), props.length > 1 ? '<select name="prop" data-cp11-pkprop="1">' + props.map(function (p) { return '<option value="' + esc(p.id) + '"' + (p.id === f.prop ? ' selected' : '') + '>' + esc(p.n) + '</option>'; }).join('') + '</select>' : '<input type="hidden" name="prop" value="' + esc(f.prop) + '"><b class="cp11-fix">' + ic('building') + esc(K.propName(f.prop)) + '</b>', 'prop', { req: true }) +
        pkF(L('Layanan', 'Service'), '<div class="cp11-svc" role="radiogroup">' + o.svcs.map(function (x) { return '<label class="cp11-svc-i"><input type="radio" name="svc" value="' + esc(x.svc) + '"' + (x.svc === f.svc ? ' checked' : '') + '><span>' + ic(x.express ? 'zap' : 'washer') + '<b>' + esc(x.n) + '</b><small>' + (x.desc ? t(x.desc) : '') + (x.sla ? ' · ' + esc(x.sla) + ' ' + t(L('jam', 'h')) : '') + '</small></span></label>'; }).join('') + '</div>', 'svc', { req: true, wide: true }) +
        pkF(L('Jumlah bag', 'Bags'), G.stepper('bags', f.bags, L('bag', 'bags'), { min: 1, max: 99, label: L('Jumlah bag', 'Bags') }), 'bags', { req: true }) +
        pkF(L('Estimasi berat', 'Estimated weight'), '<span class="cp11-unit"><input name="kg" type="number" inputmode="decimal" min="0" max="2000" value="' + esc(f.kg) + '" placeholder="75"><em>kg</em></span>', 'kg', { opt: true }) +
        pkF(L('Estimasi pcs', 'Estimated pieces'), '<span class="cp11-unit"><input name="pcs" type="number" inputmode="numeric" min="0" value="' + esc(f.pcs) + '" placeholder="120"><em>pcs</em></span>', 'pcs', { opt: true }) +
        pkF(L('PIC di lokasi', 'On-site PIC'), '<input name="pic" value="' + esc(f.pic) + '" autocomplete="name">', 'pic', { req: true }) +
        pkF(L('Telepon PIC', 'PIC phone'), '<input name="phone" type="tel" value="' + esc(f.phone) + '" autocomplete="tel">', 'phone', { req: true }) +
        pkF(L('Catatan untuk driver', 'Notes for the driver'), '<textarea name="notes" rows="2" maxlength="500" placeholder="' + t(L('Contoh: pickup di area loading dock belakang.', 'Example: pick up at the rear loading dock.')) + '">' + tx(f.notes) + '</textarea>', 'notes', { wide: true, opt: true }) +
        pkF(L('Instruksi khusus', 'Special instruction'), '<textarea name="instr" rows="2" maxlength="500">' + esc(f.instr) + '</textarea>', 'instr', { wide: true, opt: true }) + '</div>' +
        '<div class="cp11-fbar">' + A.btn('primary', L('Lanjut ke Jadwal', 'Continue to Schedule'), 'arrow', { act: 'pkNext', cls: 'btn-xl' }) + '</div>';
    } else if (step === 2) {
      var today = K.today(), dates = [[today, L('Hari ini', 'Today')], [K.u.addDays(today, 1), L('Besok', 'Tomorrow')], [K.u.addDays(today, 2), K.u.dLabel(K.u.addDays(today, 2))]];
      body = '<h2 class="cp11-h2">' + t(L('Jadwal Pickup', 'Pickup Schedule')) + '</h2><div class="cp11-form">' +
        (o.schedules.length ? pkF(L('Jenis permintaan', 'Request type'), G.choice('mode', [['pickup', L('Pickup baru', 'New pickup'), 'plus'], ['extra', L('Extra pickup (di luar jadwal rutin)', 'Extra pickup (outside the recurring schedule)'), 'calendar']], PK.mode), 'mode', { wide: true }) +
          (PK.mode === 'extra' ? pkF(L('Jadwal rutin', 'Recurring schedule'), sel('sch', o.schedules.map(function (x) { return [x.id, [x.propName + ' · ' + T(x.pickLabel) + ' ' + x.pickWin.join('–'), x.propName + ' · ' + E0(x.pickLabel) + ' ' + x.pickWin.join('–')]]; }), PK.sch || o.schedules[0].id), 'sch', { wide: true }) : '') : '') +
        pkF(L('Tanggal pickup', 'Pickup date'), '<div class="cp11-dates">' + dates.map(function (d) { return '<button type="button" class="cp11-dbtn' + (f.date === d[0] ? ' on' : '') + '" data-act="pkDate" data-val="' + esc(d[0]) + '">' + t(d[1]) + '</button>'; }).join('') + '<input type="date" name="date" min="' + esc(today) + '" value="' + esc(f.date) + '"></div>', 'date', { req: true, wide: true }) +
        pkF(L('Jendela waktu pickup', 'Pickup window'), '<div class="cp11-wins">' + G.choice('win', o.windows.map(function (w) { var past = f.date === today && K.u.ms(today + ' ' + w[1]) <= K.now(); return past ? null : [w.join('|'), w.join('–'), 'clock']; }).filter(Boolean), f.win ? f.win.join('|') : '') + '</div>', 'win', { req: true, wide: true }) + '</div>' +
        '<div class="cp11-fbar">' + A.btn('ghost', L('Kembali', 'Back'), 'arrowl', { act: 'pkBack' }) + A.btn('primary', L('Lanjut ke Konfirmasi', 'Continue to Confirmation'), 'arrow', { act: 'pkNext', cls: 'btn-xl' }) + '</div>';
    } else {
      var svc = o.svcs.filter(function (x) { return x.svc === f.svc; })[0] || {}, sch = PK.mode === 'extra' ? o.schedules.filter(function (x) { return x.id === PK.sch; })[0] : null;
      body = '<h2 class="cp11-h2">' + t(L('Periksa Permintaan', 'Check Your Request')) + '</h2>' +
        kv([[L('Property', 'Property'), '<b>' + esc(K.propName(f.prop)) + '</b>'], [L('Jenis', 'Type'), t(PK.mode === 'extra' ? K.REQ_TYPES.extra : K.REQ_TYPES.pickup) + (sch ? ' · ' + t(sch.pickLabel) + ' ' + win(sch.pickWin) : '')], [L('Layanan', 'Service'), esc(svc.n || f.svc)],
          [L('Tanggal & jam', 'Date & time'), '<b>' + esc(day(f.date)) + ' · ' + win(f.win) + '</b>'], [L('Estimasi', 'Estimate'), esc(f.bags + ' bag') + (f.kg ? ' · ' + esc(f.kg) + ' kg' : '') + (f.pcs ? ' · ' + esc(f.pcs) + ' pcs' : '')],
          [L('PIC', 'PIC'), esc(f.pic) + ' · ' + esc(f.phone)], f.notes ? [L('Catatan', 'Notes'), tx(f.notes)] : null, f.instr ? [L('Instruksi khusus', 'Special instruction'), esc(f.instr)] : null]) +
        note(t(L('Setelah dikirim Anda mendapat Request ID. Tarif dan ketentuan mengikuti kontrak.', 'After sending you get a Request ID. Rates and terms follow the contract.')), 'bulb', 'info') +
        '<div class="cp11-fbar">' + A.btn('ghost', L('Ubah', 'Edit'), 'edit', { act: 'pkBack' }) + A.btn('primary', L('KIRIM PERMINTAAN', 'SEND REQUEST'), 'check', { act: 'pkSend', cls: 'btn-xl' }) + '</div>';
    }
    return bar + '<section class="card cp11-pkc">' + body + '</section>';
  }
  function E0(x) { return Array.isArray(x) ? x[1] : x; }
  function pkOpts() { return K.pickupOptions(cx(), PK ? PK.f.prop : undefined); }
  function pkPaint() { var o = pkOpts(), box = document.getElementById('cp11-pk'); if (box && o) { box.innerHTML = pkBody(o); window.scrollTo(0, 0); } }
  function pkSend(force, reason) {
    var f = PK.f, body = { prop: f.prop, svc: f.svc, date: f.date, win: f.win || [], bags: f.bags, kg: f.kg, pcs: f.pcs, pic: f.pic, phone: f.phone, notes: f.notes, instr: f.instr };
    if (PK.mode === 'extra') body.sch = PK.sch;
    var r = PK.mode === 'extra' ? K.extraPickup(cx(), body, { force: force, reason: reason }) : K.requestPickup(cx(), body, { force: force, reason: reason });
    return r;
  }
  V['CLP-003'] = {
    title: function () { return L('Buat Permintaan Pickup', 'Create Pickup Request'); },
    render: function (c) {
      var g = guard(); if (g) return g;
      var c0 = cx();
      if (!PK || PK.uid !== c0.uid || c.q.fresh) { var o0 = K.pickupOptions(c0, c.q.prop); if (!o0) return noAccess('CLP-006'); pkInit(o0); }
      if (c.q.mode === 'extra' && PK.step === 1 && PK.mode !== 'extra') { PK.mode = 'extra'; PK.sch = c.q.sch || null; }
      var o = pkOpts(); if (!o) return noAccess('CLP-006');
      if (PK.mode === 'extra' && !PK.sch && o.schedules[0]) PK.sch = o.schedules[0].id;
      var s = sc();
      var sch = card(L('Jadwal Rutin Anda', 'Your Recurring Schedule'), o.schedules.length ? '<ul class="cp11-sch">' + o.schedules.map(function (x) {
        return '<li>' + ic(x.pick < '12:00' ? 'sparkles' : 'clock') + '<span><b>' + t(x.pickLabel) + ' · ' + win(x.pickWin) + '</b><small>' + t(x.daysLabel) + ' · ' + t(x.svcName) + (x.paused ? ' · ' + t(L('dijeda', 'paused')) : '') + '</small></span>' +
          '<span class="cp11-sch-a">' + A.btn('ghost', L('Extra', 'Extra'), 'plus', { act: 'pkExtra', val: x.id, cls: 'btn-sm' }) + A.btn('ghost', L('Ubah', 'Change'), 'calendar', { act: 'schedChg', val: x.id, cls: 'btn-sm' }) + '</span></li>';
      }).join('') + '</ul>' + note(t(L('Jadwal ini tetap berjalan sesuai kontrak. Perlu pickup tambahan? Pilih Extra.', 'This schedule keeps running under the contract. Need an additional pickup? Choose Extra.')), 'calendar', 'warn') : '<p class="cp11-mut">' + t(L('Belum ada jadwal rutin untuk property ini.', 'No recurring schedule for this property yet.')) + '</p>', { icon: 'calendar', right: o.schedules.length ? A.chip('ok', L('Aktif', 'Active'), 'checkc') : '' });
      var more = card(L('Opsi Lainnya', 'More Options'), '<div class="cp11-opts">' +
        '<button type="button" class="cp11-opt" data-act="pkExtra" data-val="">' + ic('plus') + '<span><b>' + t(L('Request Extra Pickup', 'Request Extra Pickup')) + '</b><small>' + t(L('Pickup tambahan di luar jadwal rutin', 'An additional pickup outside the schedule')) + '</small></span>' + ic('chevr') + '</button>' +
        '<button type="button" class="cp11-opt" data-act="resched" data-val="">' + ic('calendar') + '<span><b>' + t(L('Request Reschedule', 'Request Reschedule')) + '</b><small>' + t(L('Ubah jadwal pickup yang sudah ada', 'Move a pickup already requested')) + '</small></span>' + ic('chevr') + '</button>' +
        '<button type="button" class="cp11-opt cp11-opt-x" data-act="cancelOrd" data-val="">' + ic('xc') + '<span><b>' + t(L('Batalkan Permintaan', 'Cancel a Request')) + '</b><small>' + t(L('Batalkan pickup yang sudah diajukan', 'Cancel a pickup already requested')) + '</small></span>' + ic('chevr') + '</button></div>', { icon: 'more' });
      var info = card(L('Informasi Penting', 'Important'), '<ul class="cp11-list">' + o.info.map(function (x) { return '<li>' + ic('bulb') + '<span>' + t(x) + '</span></li>'; }).join('') + '</ul>', { icon: 'bulb' });
      return hero(t(L('Buat Permintaan Pickup', 'Create Pickup Request')), t(L('Atur jadwal pickup laundry dengan mudah dan cepat.', 'Arrange a laundry pickup quickly and easily.')), { sel: false }) +
        '<div class="cp11-main"><div class="cp11-col" id="cp11-pk">' + pkBody(o) + '</div><aside class="cp11-col cp11-side">' + sch + more + info + '</aside></div>';
    },
    act: acts({
      pkNext: function () {
        pkCollect(); var v = K.validatePickup(cx(), PK.step, PK.f);
        if (PK.step === 2 && PK.mode === 'extra' && !PK.sch) { v.ok = false; v.errors.sch = L('Pilih jadwal rutin.', 'Choose a recurring schedule.'); }
        PK.err = v.errors; if (!v.ok) { pkPaint(); A.toast(errMsg(v), 'crit'); return; }
        PK.step = Math.min(3, PK.step + 1); pkPaint();
      },
      pkBack: function () { pkCollect(); PK.err = {}; PK.step = Math.max(1, PK.step - 1); pkPaint(); },
      pkDate: function (el) { pkCollect(); PK.f.date = el.getAttribute('data-val'); PK.f.win = null; pkPaint(); },
      pkExtra: function (el) {
        if (!PK) return; pkCollect(); var id = el.getAttribute('data-val'), o = pkOpts();
        if (!o.schedules.length) { A.toast(L('Property ini belum punya jadwal rutin.', 'This property has no recurring schedule.'), 'warn'); return; }
        PK.mode = 'extra'; PK.sch = id || PK.sch || o.schedules[0].id; PK.err = {};
        if (PK.step === 3) PK.step = 2; pkPaint(); A.toast(L('Extra pickup dipilih. Lengkapi detail dan jadwal.', 'Extra pickup selected. Complete the details and schedule.'));
      },
      pkSend: function (el) {
        var r = pkSend(false);
        if (!r.ok && r.code === 'dup') {
          dlg({ title: L('Sudah ada pickup di jam yang sama', 'A pickup already exists at that time'), icon: 'alert', ok: L('Tetap Kirim', 'Send Anyway'),
            sub: t(K.MSG.dup) + '<br>' + r.dup.map(function (x) { return mono(x.id) + ' · ' + esc(day(x.date)) + ' ' + win(x.win); }).join('<br>'),
            body: fld(L('Alasan pickup tambahan', 'Reason for the additional pickup'), area('reason', ''), { req: true, wide: true }),
            onOk: function (v, el2) { v = vals(el2); var r2 = pkSend(true, v.reason); if (!r2.ok) return errMsg(r2); PK = null; goToast('CLP-004', r2.request.id, K.MSG.sent); return true; } });
          return;
        }
        if (!r.ok) { if (r.errors) { PK.err = r.errors; PK.step = r.errors.date || r.errors.win ? 2 : 1; pkPaint(); } return fail(r); }
        PK = null; goToast('CLP-004', r.request.id, K.MSG.sent);
      }
    })
  };
  document.addEventListener('change', function (e) {
    var el = e.target.closest && e.target.closest('#cp11-pk');
    if (!el || !PK) return;
    if (e.target.name === 'prop') { pkCollect(); PK.sch = null; PK.mode = 'pickup'; var o = K.pickupOptions(cx(), PK.f.prop); if (o) { PK.f.svc = o.defaults.svc; PK.f.instr = o.defaults.instr; } A.rerender(); }
    else if (e.target.name === 'mode' || e.target.name === 'date') { pkCollect(); if (e.target.name === 'mode') PK.mode = e.target.value; else PK.f.win = null; pkPaint(); }
  });

  /* ================= CLP-004 Pickup Confirmation / Request detail (§10) — client view and staff approval ================= */
  function reqFields(r) {
    var F = r.fields || {}, out = [];
    if (F.svc) out.push([L('Layanan', 'Service'), t(K.svcName(F.svc))]);
    if (F.date) out.push([L('Tanggal & jam', 'Date & time'), '<b>' + esc(day(F.date)) + (F.win ? ' · ' + win(F.win) : '') + '</b>']);
    if (F.from) out.push([L('Sebelumnya', 'Before'), esc(F.from)]);
    if (F.bags) out.push([L('Estimasi', 'Estimate'), esc(F.bags + ' bag') + (F.kg ? ' · ' + esc(F.kg) + ' kg' : '') + (F.pcs ? ' · ' + esc(F.pcs) + ' pcs' : '')]);
    if (F.pic) out.push([L('PIC', 'PIC'), esc(F.pic) + (F.phone ? ' · ' + esc(F.phone) : '')]);
    if (F.notes) out.push([L('Catatan', 'Notes'), tx(F.notes)]);
    if (F.instr) out.push([L('Instruksi khusus', 'Special instruction'), esc(F.instr)]);
    if (F.act) out.push([L('Perubahan', 'Change'), esc({ skip: T(L('Lewati', 'Skip')), reschedule: T(L('Pindah tanggal', 'Move date')), pause: T(L('Jeda', 'Pause')) }[F.act] || F.act) + ' ' + esc([F.date, F.from, F.to].filter(Boolean).join(' → '))]);
    if (F.reason) out.push([L('Alasan', 'Reason'), tx(F.reason)]);
    return out;
  }
  function reqRow(r, staff) {
    return '<a class="cp11-req" href="' + href('CLP-004', r.id) + '"><span class="cp11-req-ic cp11-j-' + r.tone + '">' + ic(r.type === 'cancel' ? 'xc' : r.type === 'pickup' || r.type === 'extra' ? 'truck' : 'calendar') + '</span><span class="cp11-job-b"><b>' + t(r.typeLabel) + ' · ' + mono(r.id) + '</b><small>' + (staff ? esc(K.clientName(r.cl)) + ' · ' : '') + esc(r.propName) + ' · ' + dtm(r.at) + ' · ' + esc(r.byName) + '</small></span>' + A.chip(r.tone, r.stLabel) + ic('chevr', 'cp11-go') + '</a>';
  }
  function timeline(list) {
    return '<ol class="cp11-tl">' + list.map(function (x) { return '<li' + (x.internal ? ' class="is-int"' : '') + '><span class="cp11-tl-d"></span><div><b>' + t(x.label) + (x.internal ? ' ' + A.chip('mute', L('Internal', 'Internal'), 'lock') : '') + '</b><small>' + dtm(x.at) + ' · ' + t(x.by) + '</small>' + (x.note ? '<p>' + t(x.note) + '</p>' : '') + '</div></li>'; }).join('') + '</ol>';
  }
  V['CLP-004'] = {
    title: function (rec) { return rec ? L('Permintaan ' + rec, 'Request ' + rec) : L('Permintaan Saya', 'My Requests'); },
    render: function (c) {
      var c0 = cx(), s = sc();
      if (s.client && s.blocked) return blocked();
      var staff = !s.client;
      if (!c.rec) {
        if (staff) {
          var pend = K.pendingRequests(c0), all = K.requests(c0, {}).slice(0, 40);
          return A.pageHead(L('Permintaan Klien', 'Client Requests'), t(L('Reschedule, pembatalan dan perubahan jadwal rutin dari portal klien yang menunggu tim operasional.', 'Reschedules, cancellations and recurring schedule changes from the client portal waiting for operations.'))) +
            tiles([{ k: L('Menunggu persetujuan', 'Waiting for approval'), v: esc(pend.length), icon: 'clock', tone: pend.length ? 'appr' : 'ok' }, { k: L('Total permintaan', 'Total requests'), v: esc(all.length), icon: 'list', tone: 'info' }], 'cp11-tiles-2') +
            card(L('Menunggu Persetujuan', 'Waiting for Approval'), pend.length ? '<div class="cp11-jobs">' + pend.map(function (r) { return reqRow(r, true); }).join('') + '</div>' : A.empty(L('Tidak ada permintaan yang menunggu.', 'No requests waiting.')), { icon: 'clock', count: pend.length }) +
            card(L('Semua Permintaan', 'All Requests'), A.list(all, [
              { h: L('Permintaan', 'Request'), v: function (r) { return mono(r.id); } }, { h: L('Jenis', 'Type'), v: function (r) { return t(r.typeLabel); } }, { h: L('Klien', 'Client'), v: function (r) { return esc(K.clientName(r.cl)); } },
              { h: L('Property', 'Property'), v: function (r) { return esc(r.propName); } }, { h: L('Order', 'Order'), v: function (r) { return r.ord ? mono(r.ord) : '—'; } }, { h: L('Waktu', 'Time'), v: function (r) { return dtm(r.at); } }, { h: L('Status', 'Status'), v: function (r) { return A.chip(r.tone, r.stLabel); } }
            ], function (r) { return { t: mono(r.id) + ' · ' + t(r.typeLabel), s: esc(K.clientName(r.cl)) + ' · ' + esc(r.propName) + ' · ' + dtm(r.at), chip: A.chip(r.tone, r.stLabel) }; }, function (r) { return href('CLP-004', r.id); }, { dense: true, empty: L('Belum ada permintaan.', 'No requests yet.') }), { icon: 'list' });
        }
        var list = K.requests(c0, {});
        return hero(t(L('Permintaan Saya', 'My Requests')), t(L('Setiap permintaan punya Request ID, waktu, peminta dan status.', 'Every request has a Request ID, time, requester and status.'))) +
          (list.length ? '<div class="cp11-jobs">' + list.map(function (r) { return reqRow(r); }).join('') + '</div>' : emptyBox(L('Belum ada permintaan.', 'No requests yet.'))) +
          (s.perms.pickup ? '<div class="cp11-row">' + A.btn('primary', L('Buat Pickup', 'Create Pickup'), 'plus', { go: 'CLP-003' }) + '</div>' : '');
      }
      var r = K.request(c0, c.rec); if (!r) return noAccess(staff ? 'CLP-004' : 'CLP-006');
      var fresh = r.stLive === 'submitted' || (r.st === 'done' && r.timeline.length <= 2);
      var head = '<section class="cp11-conf cp11-c-' + r.tone + '">' + ic(r.stLive === 'rejected' ? 'xc' : r.stLive === 'submitted' ? 'clock' : 'checkc', 'cp11-conf-ic') + '<div><small>' + t(r.typeLabel) + '</small><h2>' + (fresh && !staff ? t(r.stLive === 'submitted' ? L('Permintaan terkirim', 'Request sent') : L('Permintaan selesai', 'Request completed')) : esc(r.id)) + '</h2>' +
        '<p>' + t(L('Request ID', 'Request ID')) + ' <b class="mono6">' + esc(r.id) + '</b></p></div>' + A.chip(r.tone, r.stLabel) + '</section>';
      var det = card(L('Detail Permintaan', 'Request Detail'), kv([[L('Request ID', 'Request ID'), mono(r.id)], [L('Waktu', 'Time'), dtm(r.at)], [L('Peminta', 'Requester'), esc(r.byName)], staff ? [L('Klien', 'Client'), esc(K.clientName(r.cl))] : null, [L('Property', 'Property'), esc(r.propName)], [L('Status', 'Status'), A.chip(r.tone, r.stLabel)]].concat(reqFields(r))), { icon: 'file' });
      var ord = r.order ? card(L('Pesanan Terkait', 'Linked Order'), kv([[L('Order', 'Order'), mono(r.order.id)], [L('Status order', 'Order status'), t(r.order.stLabel)], [L('Jadwal', 'Schedule'), esc(day(r.order.date)) + ' · ' + win(r.order.win)], [L('Layanan', 'Service'), t(r.order.svcName)], [L('Estimasi', 'Estimate'), esc((r.order.bags || 0) + ' bag') + (r.order.kg ? ' · ' + esc(kg(r.order.kg)) : '')]]) +
        (!staff ? '<div class="cp11-acts">' + (s.perms.track ? A.btn('blue', L('Lihat Tracking', 'View Tracking'), 'pin', { go: 'CLP-005', rec: r.order.id }) : A.btn('ghost', L('Lihat Pesanan', 'View Order'), 'list', { go: 'CLP-006', rec: r.order.id })) +
          (s.perms.pickup && ['requested', 'scheduled', 'assigned', 'ready'].indexOf(r.order.st) >= 0 && !(r.stLive === 'submitted' && (r.type === 'reschedule' || r.type === 'cancel')) ? A.btn('ghost', L('Reschedule', 'Reschedule'), 'calendar', { act: 'resched', val: r.order.id }) + A.btn('ghost', L('Batalkan', 'Cancel'), 'xc', { act: 'cancelOrd', val: r.order.id }) : '') + '</div>' : (open('ORDER-003') ? '<div class="cp11-acts">' + A.btn('ghost', L('Buka Order', 'Open Order'), 'file', { go: 'ORDER-003', rec: r.order.id }) + '</div>' : '')), { icon: 'truck' }) : '';
      var appr = '';
      if (staff && r.stLive === 'submitted' && ['reschedule', 'cancel', 'schedule'].indexOf(r.type) >= 0) {
        appr = can('lg.dispatch') ? '<section class="card cp11-appr">' + ic('clock') + '<div><b>' + t(L('Menunggu persetujuan operasional', 'Waiting for operations approval')) + '</b><span>' + t(L('Setujui untuk menjalankan perubahan lewat Phase 7, atau tolak dengan alasan. Klien mendapat notifikasi.', 'Approve to apply the change through Phase 7, or reject with a reason. The client is notified.')) + '</span></div>' +
          '<div class="cp11-acts">' + A.btn('ghost', L('Tolak', 'Reject'), 'xc', { act: 'reqReject', val: r.id }) + A.btn('primary', L('Setujui', 'Approve'), 'check', { act: 'reqApprove', val: r.id }) + '</div></section>'
          : note(t(L('Menunggu persetujuan tim dispatch.', 'Waiting for the dispatch team.')), 'clock', 'warn');
      } else if (!staff && r.stLive === 'submitted') appr = note(t(L('Permintaan ini menunggu konfirmasi tim JFRESH. Anda akan mendapat notifikasi.', 'This request waits for the JFRESH team. You will be notified.')), 'clock', 'warn');
      return (staff ? A.pageHead(L('Permintaan ' + r.id, 'Request ' + r.id), esc(K.clientName(r.cl)) + ' · ' + esc(r.propName)) : '') + head + appr +
        '<div class="cp11-two"><div class="cp11-col">' + det + '</div><div class="cp11-col">' + ord + card(L('Riwayat', 'History'), timeline(r.timeline), { icon: 'history' }) + '</div></div>' +
        (!staff ? '<div class="cp11-row">' + back('CLP-004', L('Semua Permintaan', 'All Requests')) + '</div>' : '');
    },
    act: acts({
      reqApprove: function (el) {
        var id = el.getAttribute('data-val');
        dlg({ title: L('Setujui permintaan', 'Approve request'), icon: 'check', ok: L('Setujui', 'Approve'), sub: mono(id),
          body: fld(L('Catatan (opsional)', 'Note (optional)'), area('note', ''), { wide: true }),
          onOk: function (v, e2) { v = vals(e2); var r = K.approveRequest(cx(), id, v.note || null); if (!r.ok) return errMsg(r); after(L('Permintaan disetujui dan dijalankan.', 'Request approved and applied.')); return true; } });
      },
      reqReject: function (el) {
        var id = el.getAttribute('data-val');
        dlg({ title: L('Tolak permintaan', 'Reject request'), icon: 'xc', ok: L('Tolak', 'Reject'), sub: mono(id) + ' · ' + t(L('Alasan dikirim ke klien.', 'The reason is sent to the client.')),
          body: fld(L('Alasan', 'Reason'), area('reason', ''), { req: true, wide: true }),
          onOk: function (v, e2) { v = vals(e2); var r = K.rejectRequest(cx(), id, v.reason); if (!r.ok) return errMsg(r); after(L('Permintaan ditolak.', 'Request rejected.'), 'warn'); return true; } });
      }
    })
  };

  /* ================= CLP-005 Tracking (NP-03 §12, §13) ================= */
  V['CLP-005'] = {
    title: function (rec) { return rec ? L('Tracking ' + rec, 'Tracking ' + rec) : L('Tracking', 'Tracking'); },
    render: function (c) {
      var g = guard(); if (g) return g;
      var c0 = cx(), s = sc();
      if (c.rec) {
        var tr = K.track(c0, c.rec); if (!tr) return noAccess('CLP-005');
        return hero(t(L('Tracking', 'Tracking')), esc(tr.row.propName) + ' · ' + mono(tr.row.ord || tr.row.id), { sel: false }) + jobDetail(tr.row, tr) + '<div class="cp11-row">' + back('CLP-005', L('Semua Tracking', 'All Tracking')) + '</div>';
      }
      var st = K.trackStats(c0) || {}, list = K.active(c0);
      return hero(t(L('Tracking', 'Tracking')), t(L('Pantau pickup, proses dan delivery Anda secara real-time.', 'Follow your pickups, processing and deliveries in real time.'))) +
        tiles([{ k: L('Pesanan Aktif', 'Active Orders'), v: esc(st.active || 0), icon: 'list', tone: 'info' }, { k: L('Selesai Bulan Ini', 'Completed This Month'), v: esc(st.doneMonth || 0), icon: 'checkc', tone: 'ok' },
          { k: L('Tepat Waktu', 'On Time'), v: st.ontime == null ? '—' : esc(fmt.num(st.ontime, 1) + '%'), icon: 'clock', tone: 'ok' }, { k: L('Perlu Perhatian', 'Needs Attention'), v: esc(st.attention || 0), icon: 'alert', tone: st.attention ? 'crit' : 'ok', go: st.attention ? 'CLP-010' : null }], 'cp11-tiles-4') +
        card(L('Sedang Berjalan', 'In Progress'), list.length ? '<div class="cp11-jobs">' + list.map(function (r) { return jobCard(r); }).join('') + '</div>' : emptyBox(K.MSG.emptyActive, s.perms.pickup ? A.btn('primary', L('Buat Pickup', 'Create Pickup'), 'plus', { go: 'CLP-003' }) : ''), { icon: 'pin', count: list.length }) +
        note(t(L('Anda hanya melihat layanan untuk property Anda. Lokasi driver tampil selama perjalanan berlangsung.', 'You only see services for your properties. The driver location shows while the trip is running.')), 'lock', 'info');
    },
    act: acts()
  };

  /* ================= CLP-006 Orders & History (NP-03 §11, §15) ================= */
  var ST_OPTS = [['done', L('Selesai', 'Completed')], ['issue', L('Ada Kendala', 'Issue')], ['cancelled', L('Dibatalkan', 'Cancelled')]];
  V['CLP-006'] = {
    title: function (rec) { return rec ? L('Pesanan ' + rec, 'Order ' + rec) : L('Pesanan & Riwayat', 'Orders & History'); },
    render: function (c) {
      var g = guard(); if (g) return g;
      var c0 = cx(), s = sc(), q = c.q;
      if (c.rec) { var r0 = K.job(c0, c.rec); if (!r0) return noAccess('CLP-006'); return hero(t(L('Detail Pesanan', 'Order Detail')), esc(r0.propName) + ' · ' + mono(r0.ord || r0.id), { sel: false }) + jobDetail(r0, null) + '<div class="cp11-row">' + back('CLP-006', L('Semua Pesanan', 'All Orders')) + '</div>'; }
      var tab = q.tab === 'history' || q.tab === 'docs' ? q.tab : 'active';
      var act = K.active(c0), hist = K.history(c0, { from: q.from, to: q.to, svc: q.svc, st: q.st, q: tab === 'history' ? q.q : '' }), docs = K.docs(c0, {});
      var out = hero(t(L('Pesanan & Riwayat', 'Orders & History')), t(L('Pesanan aktif, riwayat dan dokumen dalam satu tempat.', 'Active orders, history and documents in one place.')));
      out += '<div class="cp11-bar">' + search(L('Cari order, POD, invoice…', 'Search order, POD, invoice…'), q.q) + (s.perms.pickup ? A.btn('primary', L('Buat Pickup', 'Create Pickup'), 'plus', { go: 'CLP-003' }) : '') + '</div>';
      if (q.q && tab !== 'history') {
        var sr = K.search(c0, q.q);
        out += card(L('Hasil Pencarian', 'Search Results'), (sr.orders.length + sr.docs.length + sr.invoices.length) ? '<div class="cp11-jobs">' + sr.orders.slice(0, 8).map(function (r) { return jobCard(r, { track: false }); }).join('') + '</div>' + sr.docs.slice(0, 8).map(function (d) { return docRow(d); }).join('') +
          sr.invoices.map(function (iv) { return '<a class="cp11-req" href="' + href('CLP-009', iv.id) + '"><span class="cp11-req-ic cp11-j-' + iv.tone + '">' + ic('invoice') + '</span><span class="cp11-job-b"><b>' + mono(iv.id) + '</b><small>' + esc(iv.propName) + ' · ' + t(iv.periodLabel) + '</small></span>' + A.chip(iv.tone, iv.stLabel) + ic('chevr', 'cp11-go') + '</a>'; }).join('') : A.empty(L('Tidak ada hasil.', 'No results.')), { icon: 'search' });
      }
      out += H.tabs([['active', L('Aktif', 'Active'), 'truck', act.length], ['history', L('Riwayat', 'History'), 'history'], ['docs', L('Dokumen', 'Documents'), 'file', docs.length]], tab, 'tab', { def: 'active', seg: true });
      if (tab === 'active') {
        var pend = s.perms.order ? K.requests(c0, {}).filter(function (r) { return r.stLive === 'submitted'; }) : [];
        out += (pend.length ? '<a class="cp11-notice" href="' + href('CLP-004') + '">' + ic('clock') + '<span><b>' + esc(pend.length) + ' ' + t(L('permintaan menunggu konfirmasi', 'request(s) waiting for confirmation')) + '</b><small>' + t(L('Lihat semua permintaan', 'See all requests')) + '</small></span>' + ic('chevr') + '</a>' : '') +
          (act.length ? '<div class="cp11-jobs">' + act.map(function (r) { return jobCard(r); }).join('') + '</div>' : emptyBox(K.MSG.emptyActive, s.perms.pickup ? A.btn('primary', L('Buat Pickup', 'Create Pickup'), 'plus', { go: 'CLP-003' }) : ''));
      } else if (tab === 'history') {
        var svcs = {}; K.history(c0, {}).forEach(function (r) { if (r.svc) svcs[r.svc] = r.svcName; });
        out += '<div class="cp11-filters">' + dateF('from', L('Dari', 'From'), q.from) + dateF('to', L('Sampai', 'To'), q.to) + selF('svc', L('Layanan', 'Service'), Object.keys(svcs).map(function (k) { return [k, svcs[k]]; }), q.svc) + selF('st', L('Status', 'Status'), ST_OPTS, q.st) + '</div>';
        out += card(L('Riwayat Pesanan', 'Order History'), A.list(hist, [
          { h: L('Order', 'Order'), v: function (r) { return mono(r.ord || r.id); } }, { h: L('Property', 'Property'), v: function (r) { return esc(r.propName); } }, { h: L('Layanan', 'Service'), v: function (r) { return t(r.svcName); } },
          { h: L('Qty', 'Qty'), cls: 'r num', v: function (r) { return r.kg ? esc(kg(r.kg)) : r.pcs ? esc(r.pcs + ' pcs') : r.bags ? esc(r.bags + ' bag') : '—'; } }, { h: L('Status', 'Status'), v: function (r) { return stChip(r); } }, { h: L('Tanggal', 'Date'), v: function (r) { return esc(day(r.date)); } }
        ], function (r) { return { t: mono(r.ord || r.id) + ' · ' + esc(r.propName), s: t(r.svcName) + ' · ' + esc(day(r.date)) + (r.kg ? ' · ' + esc(kg(r.kg)) : ''), chip: stChip(r) }; }, function (r) { return href('CLP-006', r.id); }, { empty: L('Belum ada riwayat untuk filter ini.', 'No history for this filter.') }), { icon: 'history', count: hist.length });
      } else {
        out += (docs.length ? '<div class="cp11-docs">' + docs.slice(0, 12).map(function (d) { return docRow(d); }).join('') + '</div>' : emptyBox(K.MSG.emptyDoc)) + (open('CLP-007') ? '<div class="cp11-row">' + A.btn('ghost', L('Pusat Dokumen', 'Document Center'), 'file', { go: 'CLP-007' }) + '</div>' : '');
      }
      return out;
    },
    act: acts()
  };

  /* ================= CLP-007 Document Center (NP-03 §14) ================= */
  V['CLP-007'] = {
    title: function () { return L('Pusat Dokumen', 'Document Center'); },
    render: function (c) {
      var g = guard(); if (g) return g;
      var c0 = cx(), q = c.q, all = K.docs(c0, { q: q.q, ref: q.ref }), list = all.filter(function (d) { return !q.type || d.type === q.type; });
      var types = Object.keys(K.DOC_TYPES).filter(function (k) { return all.some(function (d) { return d.type === k; }); });
      return hero(t(L('Pusat Dokumen', 'Document Center')), t(L('POD, delivery note, service completion, invoice dan dokumen lainnya.', 'POD, delivery notes, service completion, invoices and more.'))) +
        '<div class="cp11-bar">' + search(L('Cari nomor dokumen, order, property…', 'Search document, order, property…'), q.q) + '</div>' +
        (types.length ? H.tabs([['', L('Semua', 'All'), 'layers', all.length]].concat(types.map(function (k) { return [k, K.DOC_TYPES[k][0], K.DOC_TYPES[k][1], all.filter(function (d) { return d.type === k; }).length]; })), q.type || '', 'type', { def: '' }) : '') +
        (q.ref ? note(t(L('Dokumen untuk ', 'Documents for ')) + mono(q.ref) + ' · <a class="lnk5" href="' + href('CLP-007') + '">' + t(L('Tampilkan semua', 'Show all')) + '</a>', 'filter', 'info') : '') +
        (list.length ? '<div class="cp11-docs">' + list.map(function (d) { return docRow(d); }).join('') + '</div>' : emptyBox(K.MSG.emptyDoc)) +
        note(t(L('Setiap dokumen yang dilihat, diunduh atau dibagikan tercatat. Kontrak hanya tampil untuk role yang berwenang.', 'Every view, download or share is logged. Contracts show only for authorised roles.')), 'lock', 'info');
    },
    act: acts()
  };

  /* ================= CLP-008 Billing Overview (NP-04 §16, §17, §19) — read only ================= */
  function invNo(id) { var p = String(id).split('-'); return '#' + p[p.length - 1]; }
  function invCard(iv) {
    return '<a class="cp11-inv" href="' + href('CLP-009', iv.id) + '"><span class="cp11-mb"><small>' + t(iv.monthLabel) + '</small><b>' + esc(invNo(iv.id)) + '</b></span><span class="cp11-inv-b"><b>' + esc(iv.propName) + '</b><small>' + t(L('Periode ', 'Period ')) + t(iv.periodLabel) + '</small><small>' + iv.svcNames.map(function (x) { return t(x); }).join(', ') + (iv.kg ? ' · ' + esc(kg(iv.kg)) : '') + '</small></span>' +
      '<span class="cp11-inv-r"><b class="num">' + esc(rp(iv.total)) + '</b>' + A.chip(iv.tone, iv.stLabel, iv.st === 'paid' ? 'checkc' : iv.st === 'overdue' ? 'alert' : 'clock') + '<small>' + (iv.st === 'paid' ? (iv.paidAt ? t(L('Dibayar ', 'Paid ')) + esc(day(iv.paidAt)) : '') : iv.st === 'partial' ? t(L('Sisa ', 'Open ')) + esc(rp(iv.open)) : t(L('Jatuh tempo ', 'Due ')) + esc(day(iv.due)) + (iv.daysLate ? ' · ' + esc(iv.daysLate) + ' ' + t(L('hari', 'days')) : '')) + '</small></span>' + ic('chevr', 'cp11-go') + '</a>';
  }
  function stmtDlg() {
    var to = K.today(), from = K.u.addDays(to, -90);
    dlg({ title: L('Statement of Account', 'Statement of Account'), icon: 'download', ok: L('Unduh Statement', 'Download Statement'), sub: t(L('Saldo awal, invoice, pembayaran dan saldo akhir untuk property yang dipilih.', 'Opening balance, invoices, payments and closing balance for the selected properties.')),
      body: fld(L('Dari', 'From'), '<input type="date" name="from" value="' + esc(from) + '">', { req: true }) + fld(L('Sampai', 'To'), '<input type="date" name="to" value="' + esc(to) + '" max="' + esc(to) + '">', { req: true }),
      onOk: function (v, el) {
        v = vals(el); var r = K.statement(cx(), { from: v.from, to: v.to }); if (!r.ok) return errMsg(r);
        var rows = r.rows.map(function (x) { return '<tr><td>' + esc(x.date) + '</td><td>' + esc(x.ref) + '</td><td>' + esc(T(x.desc)) + '</td><td style="text-align:right">' + (x.debit ? esc(rp(x.debit)) : '') + '</td><td style="text-align:right">' + (x.credit ? esc(rp(x.credit)) : '') + '</td><td style="text-align:right">' + esc(rp(x.bal)) + '</td></tr>'; }).join('');
        var html = '<!doctype html><html lang="id"><head><meta charset="utf-8"><title>Statement of Account</title><style>body{font:14px/1.5 Inter,system-ui,sans-serif;color:#0B2545;margin:32px}table{border-collapse:collapse;width:100%}td,th{border-bottom:1px solid #E3EAF4;padding:6px 8px;text-align:left}p{color:#5B6B82}</style></head><body><h1>Statement of Account</h1><p>' +
          esc(r.client) + ' · ' + esc(r.props.join(', ')) + ' · ' + esc(r.from) + ' – ' + esc(r.to) + '</p><table><thead><tr><th>' + t(L('Tanggal', 'Date')) + '</th><th>Ref</th><th>' + t(L('Keterangan', 'Description')) + '</th><th>Debit</th><th>' + t(L('Kredit', 'Credit')) + '</th><th>Saldo</th></tr></thead><tbody><tr><td></td><td></td><td>' + t(L('Saldo awal', 'Opening balance')) + '</td><td></td><td></td><td style="text-align:right">' + esc(rp(r.opening)) + '</td></tr>' + rows +
          '<tr><td></td><td></td><td><b>' + t(L('Saldo akhir', 'Closing balance')) + '</b></td><td style="text-align:right">' + esc(rp(r.invoiced)) + '</td><td style="text-align:right">' + esc(rp(r.paid)) + '</td><td style="text-align:right"><b>' + esc(rp(r.closing)) + '</b></td></tr></tbody></table></body></html>';
        H.download('Statement-' + r.cl + '-' + r.from + '-' + r.to + '.html', html, 'text/html'); A.toast(L('Statement diunduh.', 'Statement downloaded.')); return true;
      } });
  }
  function financeDlg(inv) {
    dlg({ title: L('Hubungi Finance', 'Contact Finance'), icon: 'message', ok: L('Kirim', 'Send'), sub: (inv ? mono(inv) + ' · ' : '') + t(L('Pertanyaan Anda dicatat sebagai laporan Masalah Invoice dan dijawab tim finance.', 'Your question is logged as an Invoice Issue report and answered by the finance team.')),
      body: fld(L('Pertanyaan', 'Question'), area('msg', '', L('Contoh: mohon rincian pemakaian minggu kedua.', 'Example: please send the usage detail of week two.')), { req: true, wide: true }),
      onOk: function (v, el) { v = vals(el); var r = K.contactFinance(cx(), { inv: inv || null, msg: v.msg }); if (!r.ok) return errMsg(r); goToast('CLP-012', r.case.id, L('Pertanyaan terkirim ke finance (' + r.case.id + ').', 'Question sent to finance (' + r.case.id + ').')); return true; } });
  }
  var BILL_ACT = { stmt: function () { stmtDlg(); }, finance: function (el) { financeDlg(el.getAttribute('data-val') || null); } };
  V['CLP-008'] = {
    title: function () { return L('Billing & Invoice', 'Billing & Invoice'); },
    render: function (c) {
      var g = guard(); if (g) return g;
      var c0 = cx(), b = K.billing(c0); if (!b) return loadErr();
      var q = c.q, stv = ['open', 'paid', 'overdue'].indexOf(q.st) >= 0 ? q.st : '', list = K.invoices(c0, { st: stv, q: q.q }), S0 = b.summary;
      return hero(t(L('Billing & Invoice', 'Billing & Invoice')), t(L('Semua tagihan Anda dalam satu tempat.', 'All your invoices in one place.'))) +
        tiles([{ k: L('Total Tagihan', 'Outstanding'), v: esc(rp(S0.outstanding.amt)), s: esc(S0.outstanding.count) + ' invoice', icon: 'file', tone: 'info', go: 'CLP-008', q: { st: 'open' } },
          { k: L('Jatuh Tempo Bulan Ini', 'Due This Month'), v: esc(rp(S0.dueMonth.amt)), s: esc(S0.dueMonth.count) + ' invoice', icon: 'hourglass', tone: 'appr' },
          { k: L('Terlambat Bayar', 'Overdue'), v: esc(rp(S0.overdue.amt)), s: esc(S0.overdue.count) + ' invoice', icon: 'alert', tone: S0.overdue.count ? 'crit' : 'ok', go: 'CLP-008', q: { st: 'overdue' } },
          S0.paid ? { k: L('Sudah Dibayar', 'Paid'), v: esc(rp(S0.paid.amt)), s: esc(S0.paid.count) + ' invoice', icon: 'checkc', tone: 'ok', go: 'CLP-008', q: { st: 'paid' } } : null], 'cp11-tiles-4 cp11-tiles-money') +
        '<div class="cp11-bar">' + H.tabs([['', L('Semua', 'All')], ['open', L('Belum Dibayar', 'Unpaid')], ['paid', L('Sudah Dibayar', 'Paid')], ['overdue', L('Terlambat', 'Overdue')]], stv, 'st', { def: '' }) + search(L('Cari invoice…', 'Search invoice…'), q.q) + '</div>' +
        (list.length ? '<div class="cp11-invs">' + list.map(invCard).join('') + '</div>' : emptyBox(b.empty || L('Tidak ada invoice untuk filter ini.', 'No invoices for this filter.'))) +
        (b.canStatement ? '<button type="button" class="cp11-cta" data-act="stmt">' + ic('download') + '<span>' + t(L('Download Statement of Account', 'Download Statement of Account')) + '</span></button>' : '') +
        '<section class="cp11-help">' + ic('bulb') + '<div><b>' + t(L('Perlu bantuan?', 'Need help?')) + '</b><span>' + t(L('Jika ada pertanyaan mengenai invoice atau pembayaran, hubungi tim finance kami.', 'If you have a question about an invoice or payment, contact our finance team.')) + '</span></div>' + A.btn('outline', L('Hubungi Finance', 'Contact Finance'), 'headset', { act: 'finance' }) + '</section>' +
        note(t(L('Tarif, pajak, nilai invoice dan kontrak tidak dapat diubah dari portal.', 'Rates, tax, invoice amounts and contracts cannot be changed from the portal.')), 'lock', 'info');
    },
    act: acts(BILL_ACT)
  };

  /* ================= CLP-009 Invoice Detail (NP-04 §18, §19) — read only ================= */
  V['CLP-009'] = {
    title: function (rec) { return rec ? L('Invoice ' + rec, 'Invoice ' + rec) : L('Detail Invoice', 'Invoice Detail'); },
    render: function (c) {
      var g = guard(); if (g) return g;
      var c0 = cx(), s = sc(), iv = c.rec ? K.invoice(c0, c.rec) : null; if (!iv) return noAccess('CLP-008');
      var head = '<section class="card cp11-ivh"><span class="cp11-mb"><small>' + t(iv.monthLabel) + '</small><b>' + esc(invNo(iv.id)) + '</b></span><div><small>' + t(L('Invoice', 'Invoice')) + '</small><h2 class="mono6">' + esc(iv.no) + '</h2><p>' + esc(iv.propName) + ' · ' + t(iv.periodLabel) + '</p></div>' + A.chip(iv.tone, iv.stLabel) + '</section>';
      var money = tiles([{ k: L('Total', 'Total'), v: esc(rp(iv.totalAmt)), icon: 'invoice', tone: 'info' }, iv.paidAmt != null ? { k: L('Dibayar', 'Paid'), v: esc(rp(iv.paidAmt)), icon: 'checkc', tone: 'ok' } : null,
        { k: L('Sisa Tagihan', 'Outstanding'), v: esc(rp(iv.outstanding)), icon: 'coins', tone: iv.outstanding ? (iv.st === 'overdue' ? 'crit' : 'appr') : 'ok' }, { k: L('Jatuh Tempo', 'Due Date'), v: esc(day(iv.due)), s: iv.daysLate ? t(L('Terlambat ' + iv.daysLate + ' hari', iv.daysLate + ' days late')) : '', icon: 'calendar', tone: iv.st === 'overdue' ? 'crit' : 'info' }], 'cp11-tiles-4 cp11-tiles-money');
      var info = card(L('Informasi Invoice', 'Invoice Information'), kv([[L('No. Invoice', 'Invoice No.'), mono(iv.no)], [L('Periode', 'Period'), t(iv.periodLabel)], [L('Terbit', 'Issued'), esc(day(iv.issued))], [L('Jatuh tempo', 'Due'), esc(day(iv.due))],
        [L('Kontrak', 'Contract'), iv.contract ? mono(iv.contract.no) + (iv.contract.v ? ' · v' + esc(iv.contract.v) : '') : '—'], [L('Termin', 'Terms'), iv.terms ? esc(iv.terms) + ' ' + t(L('hari', 'days')) : '—'], iv.po ? [L('PO', 'PO'), esc(iv.po)] : null,
        [L('Layanan', 'Service'), esc(iv.service)], [L('Kuantitas', 'Quantity'), esc(fmt.num(iv.quantity, 1) + ' ' + (iv.unit || ''))]]), { icon: 'file' });
      var lines = '<div class="tblw"><table class="tbl dense cp11-ivl"><thead><tr><th>' + t(L('Layanan', 'Service')) + '</th><th class="r">' + t(L('Qty', 'Qty')) + '</th><th class="r">' + t(L('Tarif', 'Rate')) + '</th><th class="r">' + t(L('Jumlah', 'Amount')) + '</th></tr></thead><tbody>' +
        iv.lines.map(function (l) { return '<tr><td>' + t(l.svcName) + (l.date ? '<small class="sub5">' + esc(day(l.date)) + '</small>' : '') + '</td><td class="r num">' + esc(fmt.num(l.qty, 1) + ' ' + l.unit) + '</td><td class="r num">' + esc(rp(l.rate)) + '</td><td class="r num">' + esc(rp(l.amt)) + '</td></tr>'; }).join('') + '</tbody><tfoot>' +
        [[L('Subtotal', 'Subtotal'), iv.subtotal], iv.surcharge ? [L('Biaya tambahan', 'Surcharge'), iv.surcharge] : null, [L('Diskon', 'Discount'), -iv.discount], [L('Pajak', 'Tax') , iv.tax, iv.taxPct], [L('Total', 'Total'), iv.totalAmt, null, true], iv.paidAmt != null ? [L('Dibayar', 'Paid'), -iv.paidAmt] : null, [L('Sisa', 'Outstanding'), iv.outstanding, null, true]].filter(Boolean).map(function (x) { return '<tr' + (x[3] ? ' class="cp11-tot"' : '') + '><th colspan="3">' + t(x[0]) + (x[2] ? ' (' + esc(x[2]) + '%)' : '') + '</th><td class="r num">' + esc(rp(x[1])) + '</td></tr>'; }).join('') + '</tfoot></table></div>';
      var linesC = card(L('Rincian Tagihan', 'Billing Detail'), lines, { icon: 'list' });
      var pays = iv.payments ? card(L('Pembayaran', 'Payments'), iv.payments.length ? '<ul class="cp11-list">' + iv.payments.map(function (p) { return '<li>' + ic('coins') + '<span><b>' + esc(rp(p.amt)) + '</b><small>' + esc(day(p.date)) + (p.ref ? ' · ' + esc(p.ref) : '') + '</small></span></li>'; }).join('') + '</ul>' : '<p class="cp11-mut">' + t(L('Belum ada pembayaran.', 'No payments yet.')) + '</p>', { icon: 'coins' }) : '';
      var sp = iv.support, sup = '';
      function det(title, n, body) { return '<details class="cp11-det"><summary>' + t(title) + ' <b>' + esc(n) + '</b></summary>' + body + '</details>'; }
      sup += det(L('Order', 'Orders'), sp.orders.length, sp.orders.length ? '<ul class="cp11-list">' + sp.orders.map(function (o) { return '<li>' + ic(o.kind === 'delivery' ? 'truck' : 'basket') + '<span><a class="lnk5" href="' + href('CLP-006', o.id) + '">' + mono(o.id) + '</a><small>' + esc(day(o.date)) + ' · ' + t(o.svcName) + ' · ' + esc((o.bags || 0) + ' bag') + (o.kg ? ' · ' + esc(kg(o.kg)) : '') + '</small></span></li>'; }).join('') + '</ul>' : '<p class="cp11-mut">—</p>');
      sup += det(L('Pemakaian', 'Usage'), sp.usage.length, '<ul class="cp11-list">' + sp.usage.map(function (u) { return '<li>' + ic('scale') + '<span><b>' + t(u.svcName) + '</b><small>' + esc(fmt.num(u.qty, 1) + ' ' + u.unit) + ' × ' + esc(rp(u.rate)) + ' = ' + esc(rp(u.amt)) + '</small></span></li>'; }).join('') + '</ul>');
      sup += det(L('POD', 'POD'), sp.pods.length, sp.pods.length ? '<ul class="cp11-list">' + sp.pods.map(function (p) { return '<li>' + ic('filecheck') + '<span><b class="mono6">' + esc(p.id) + '</b><small>' + dtm(p.at) + ' · ' + esc(p.recv) + '</small></span>' + A.btn('ghost', L('Lihat', 'View'), 'eye', { act: 'docView', val: p.id, cls: 'btn-sm' }) + '</li>'; }).join('') + '</ul>' : '<p class="cp11-mut">—</p>');
      sup += det(L('Delivery', 'Deliveries'), sp.deliveries.length, sp.deliveries.length ? '<ul class="cp11-list">' + sp.deliveries.map(function (d) { return '<li>' + ic('truck') + '<span><a class="lnk5" href="' + href('CLP-006', d.id) + '">' + mono(d.id) + '</a><small>' + esc(day(d.date)) + ' · ' + esc((d.pkgs || 0) + ' pkg · ' + (d.qty || 0) + ' pcs') + (d.kg ? ' · ' + esc(kg(d.kg)) : '') + '</small></span></li>'; }).join('') + '</ul>' : '<p class="cp11-mut">—</p>');
      var actsH = '<div class="cp11-acts">' + A.btn('primary', L('Download Invoice', 'Download Invoice'), 'download', { act: 'docGet', val: iv.id }) + (s.perms.payment ? A.btn('ghost', L('Download Statement', 'Download Statement'), 'file', { act: 'stmt' }) : '') + A.btn('ghost', L('Hubungi Finance', 'Contact Finance'), 'headset', { act: 'finance', val: iv.id }) + '</div>';
      return head + money + actsH + '<div class="cp11-two"><div class="cp11-col">' + linesC + card(L('Dokumen Pendukung', 'Supporting Documents'), sup, { icon: 'layers' }) + '</div><div class="cp11-col">' + info + pays +
        card(L('Tidak dapat diubah dari portal', 'Cannot be changed from the portal'), '<ul class="cp11-list cp11-no">' + iv.notAllowed.map(function (x) { return '<li>' + ic('lock') + '<span>' + t(x) + '</span></li>'; }).join('') + '</ul>', { icon: 'lock' }) + '</div></div>' +
        '<div class="cp11-row">' + back('CLP-008', L('Semua Invoice', 'All Invoices')) + '</div>';
    },
    act: acts(BILL_ACT)
  };

  /* ================= CLP-010 Complaint List (NP-05 §20–§22) — client list and staff case queue ================= */
  var CAT_TONE = { missing: 'crit', wrongqty: 'appr', stain: 'appr', smell: 'info', damage: 'crit', latepickup: 'info', latedelivery: 'info', invoice: 'appr', quality: 'ok', other: 'mute' };
  function catIc(cat, icon) { return '<span class="cp11-cat cp11-c-' + (CAT_TONE[cat] || 'info') + '">' + ic(icon) + '</span>'; }
  function caseCard(x) {
    return '<a class="cp11-case" href="' + href('CLP-012', x.id) + '">' + catIc(x.cat, x.icon) + '<span class="cp11-job-b"><b class="mono6">' + esc(x.id) + '</b><span class="cp11-case-t">' + t(x.catLabel) + '</span><small>' + ic('pin') + esc(x.propName) + '</small><small>' + ic('calendar') + t(x.atLabel) + ' ' + esc(x.time) + '</small></span>' +
      '<span class="cp11-job-r">' + A.chip(x.tone, x.stLabel) + (x.overdue ? A.chip('crit', L('Lewat target', 'Past target'), 'clock') : '') + '</span>' + ic('chevr', 'cp11-go') + '</a>';
  }
  function staffCases(c) {
    var c0 = cx(), q = c.q, f = { st: q.st || 'open', q: q.q, cat: q.cat, mine: q.mine === '1' }, list = K.cases(c0, f), all = K.cases(c0, {});
    var n = function (fn) { return all.filter(fn).length; };
    return A.pageHead(L('Kasus Klien', 'Client Cases'), t(L('Komplain dan permintaan layanan dari portal klien. Setiap tindakan tercatat dan klien mendapat notifikasi.', 'Complaints and service requests from the client portal. Every action is logged and the client is notified.'))) +
      tiles([{ k: L('Laporan Baru', 'New'), v: esc(n(function (x) { return x.st === 'new'; })), icon: 'inbox', tone: 'info', go: 'CLP-010', q: { st: 'new' } },
        { k: L('Dalam Proses', 'In Progress'), v: esc(n(function (x) { return ['assigned', 'review'].indexOf(x.st) >= 0; })), icon: 'clock', tone: 'appr', go: 'CLP-010', q: { st: 'progress' } },
        { k: L('Menunggu Klien', 'Waiting Client'), v: esc(n(function (x) { return x.st === 'waiting'; })), icon: 'message', tone: 'warn', go: 'CLP-010', q: { st: 'waiting' } },
        { k: L('Tindakan Diperlukan', 'Action Required'), v: esc(n(function (x) { return x.st === 'action'; })), icon: 'alert', tone: 'crit', go: 'CLP-010', q: { st: 'action' } },
        { k: L('Lewat Target', 'Past Target'), v: esc(n(function (x) { return x.overdue; })), icon: 'hourglass', tone: n(function (x) { return x.overdue; }) ? 'crit' : 'ok' }], 'cp11-tiles-5') +
      '<div class="cp11-bar">' + H.tabs([['open', L('Terbuka', 'Open')], ['new', L('Baru', 'New')], ['waiting', L('Menunggu Klien', 'Waiting Client')], ['action', L('Tindakan', 'Action')], ['done', L('Selesai', 'Done')], ['all', L('Semua', 'All')]], q.st || 'open', 'st', { def: 'open' }) +
        search(L('Cari kasus, klien, deskripsi…', 'Search case, client, description…'), q.q) + selF('cat', L('Kategori', 'Category'), Object.keys(K.CATS).map(function (k) { return [k, K.CATS[k][0]]; }), q.cat) +
        '<a class="btn btn-sm ' + (f.mine ? 'btn-blue' : 'btn-ghost') + '" href="' + H.qhref({ mine: f.mine ? null : '1' }) + '">' + ic('user') + '<span>' + t(L('Kasus saya', 'My cases')) + '</span></a></div>' +
      card(L('Antrian Kasus', 'Case Queue'), A.list(f.st === 'all' ? K.cases(c0, { q: q.q, cat: q.cat, mine: f.mine }) : list, [
        { h: L('Kasus', 'Case'), v: function (x) { return mono(x.id) + '<small class="sub5">' + t(x.catLabel) + '</small>'; } }, { h: L('Klien', 'Client'), v: function (x) { return esc(K.clientName(x.cl)) + '<small class="sub5">' + esc(x.propName) + '</small>'; } },
        { h: L('Prioritas', 'Priority'), v: function (x) { return A.chip(K.PRI[x.pri][1], x.priLabel); } }, { h: L('Status', 'Status'), v: function (x) { return A.chip(x.tone, x.stLabel); } }, { h: L('Pemilik', 'Owner'), v: function (x) { return esc(x.owner || '—'); } },
        { h: L('Target', 'Target'), v: function (x) { return x.overdue ? A.chip('crit', L(dtm(x.target), dtm(x.target)), 'clock') : dtm(x.target); } }, { h: L('Update', 'Updated'), v: function (x) { return dtm(x.upd); } }
      ], function (x) { return { t: mono(x.id) + ' · ' + t(x.catLabel), r: '', s: esc(K.clientName(x.cl)) + ' · ' + esc(x.propName) + ' · ' + esc(x.owner || '—'), chip: A.chip(x.tone, x.stLabel) + (x.overdue ? ' ' + A.chip('crit', L('Lewat target', 'Past target')) : '') }; }, function (x) { return href('CLP-012', x.id); }, { dense: true, empty: K.MSG.emptyCase }), { icon: 'inbox' });
  }
  V['CLP-010'] = {
    title: function () { var s = sc(); return s.client ? L('Bantuan & Masalah', 'Help & Issues') : L('Kasus Klien', 'Client Cases'); },
    render: function (c) {
      var s = sc();
      if (!s.client) return staffCases(c);
      if (s.blocked) return blocked();
      var c0 = cx(), q = c.q, sm = K.caseSummary(c0), list = K.cases(c0, { st: q.st || '', q: q.q }), opt = K.caseOptions(c0) || {};
      return hero(t(L('Bantuan & Masalah', 'Help & Issues')), t(L('Laporkan masalah, cek status, atau berikan feedback dengan mudah.', 'Report a problem, check the status or give feedback with ease.'))) +
        tiles([{ k: L('Laporan Baru', 'New Reports'), v: esc(sm.new), icon: 'file', tone: 'info', go: 'CLP-010', q: { st: 'new' } }, { k: L('Dalam Proses', 'In Progress'), v: esc(sm.progress), icon: 'clock', tone: 'appr', go: 'CLP-010', q: { st: 'progress' } },
          { k: L('Selesai', 'Resolved'), v: esc(sm.done), icon: 'checkc', tone: 'ok', go: 'CLP-010', q: { st: 'done' } }, { k: L('Menunggu Anda', 'Waiting for You'), v: esc(sm.waiting), icon: 'alert', tone: sm.waiting ? 'crit' : 'mute', go: 'CLP-010', q: { st: 'waiting' } }], 'cp11-tiles-4') +
        (opt.canCreate ? '<a class="cp11-cta cp11-cta-big" href="' + href('CLP-011') + '">' + ic('plus') + '<span><b>' + t(L('Laporkan Masalah', 'Report a Problem')) + '</b><small>' + t(L('Sampaikan kendala atau permintaan layanan', 'Tell us about a problem or a service request')) + '</small></span>' + ic('chevr') + '</a>' : '') +
        '<div class="cp11-bar cp11-bar-h"><h2 class="cp11-h2">' + t(L('Laporan Anda', 'Your Reports')) + '</h2>' + selF('st', L('Status', 'Status'), [['new', K.CASE_ST.new[0]], ['progress', L('Dalam Proses', 'In Progress')], ['waiting', K.CASE_ST.waiting[0]], ['done', L('Selesai', 'Resolved')], ['open', L('Terbuka', 'Open')]], q.st) + '</div>' +
        (list.length ? '<div class="cp11-cases">' + list.map(caseCard).join('') + '</div>' : emptyBox(q.st ? L('Tidak ada laporan untuk status ini.', 'No reports with this status.') : K.MSG.emptyCase)) + contactCard();
    }
  };

  /* ================= CLP-011 Create Complaint (NP-05 §20, §21) — KIRIM LAPORAN ================= */
  V['CLP-011'] = {
    title: function () { return L('Laporkan Masalah', 'Report a Problem'); },
    render: function (c) {
      var g = guard(); if (g) return g;
      var c0 = cx(), s = sc(), o = K.caseOptions(c0); if (!o || !o.canCreate) return A.stateCard('noperm', K.MSG.noperm, A.btn('blue', L('Kembali', 'Back'), 'arrowl', { go: 'CLP-010' }));
      var q = c.q, ref = q.ref || '', cat = K.CATS[q.cat] ? q.cat : '', refObj = o.refs.filter(function (x) { return x.id === ref; })[0];
      var prop = refObj ? refObj.prop : s.sel !== 'all' ? s.sel : (o.props[0] || {}).id;
      var refs = o.refs.slice(); if (ref && !refObj) refs.unshift({ id: ref, label: L(ref, ref) });
      return hero(t(L('Laporkan Masalah', 'Report a Problem')), t(L('Ceritakan singkat apa yang terjadi. Tim JFRESH akan segera menindaklanjuti.', 'Tell us briefly what happened. The JFRESH team will follow up soon.')), { sel: false }) +
        '<section class="card cp11-pkc" id="cp11-case"><div class="cp11-form">' +
        '<div class="cp11-fl cp11-fl-w"><span class="cp11-fl-l">' + t(L('Kategori', 'Category')) + ' <i>*</i></span><div class="cp11-cats" role="radiogroup">' + o.cats.map(function (x) { return '<label class="cp11-cat-i"><input type="radio" name="cat" value="' + esc(x.k) + '"' + (x.k === cat ? ' checked' : '') + ' data-pri="' + esc(x.pri) + '"><span>' + catIc(x.k, x.i) + '<b>' + t(x.l) + '</b></span></label>'; }).join('') + '</div></div>' +
        '<div class="cp11-fl"><span class="cp11-fl-l">' + t(L('Property', 'Property')) + ' <i>*</i></span>' + sel('prop', o.props.map(function (p) { return [p.id, L(p.n, p.n)]; }), prop) + '</div>' +
        '<div class="cp11-fl"><span class="cp11-fl-l">' + t(L('Order / Delivery / Invoice', 'Order / Delivery / Invoice')) + ' <em>' + t(L('(opsional)', '(optional)')) + '</em></span>' + sel('ref', [['', L('Tidak terkait', 'Not linked')]].concat(refs.map(function (x) { return [x.id, x.label]; })), ref) + '</div>' +
        '<div class="cp11-fl cp11-fl-w"><span class="cp11-fl-l">' + t(L('Deskripsi', 'Description')) + ' <i>*</i></span><textarea name="desc" rows="4" maxlength="1000" placeholder="' + t(L('Contoh: 4 sarung bantal masih ada noda minyak.', 'Example: 4 pillowcases still have oil stains.')) + '"></textarea></div>' +
        '<div class="cp11-fl cp11-fl-w"><span class="cp11-fl-l">' + t(L('Foto', 'Photo')) + ' <em>' + t(L('(opsional)', '(optional)')) + '</em></span>' + G.photoIn('cp11case', L('Tambah Foto', 'Add Photo')) + '</div>' +
        '<div class="cp11-fl cp11-fl-w"><span class="cp11-fl-l">' + t(L('Prioritas', 'Priority')) + '</span><div id="cp11-pri">' + G.choice('pri', o.pri.map(function (x) { return [x.k, L(T(x.l) + ' · ' + x.h + ' jam', E0(x.l) + ' · ' + x.h + ' h'), null, x.k === 'critical' ? 'crit' : x.k === 'high' ? 'warn' : null]; }), cat ? K.CATS[cat][2] : 'normal') + '</div></div>' +
        '<div class="cp11-fl"><span class="cp11-fl-l">' + t(L('PIC', 'PIC')) + '</span><input name="pic" value="' + esc(o.pic || '') + '"></div></div>' +
        '<div class="cp11-fbar">' + A.btn('ghost', L('Batal', 'Cancel'), 'x', { go: 'CLP-010' }) + A.btn('primary', L('KIRIM LAPORAN', 'SEND REPORT'), 'check', { act: 'caseSend', cls: 'btn-xl' }) + '</div></section>';
    },
    act: {
      caseSend: function (el) {
        if (el.disabled) return;
        var box = document.getElementById('cp11-case'), v = vals(box), ph = G.photos('cp11case');
        var r = K.createCase(cx(), { prop: v.prop, cat: v.cat, desc: v.desc, ref: v.ref || null, pri: v.pri, pic: v.pic, photo: ph[0] || null });
        if (!r.ok) return fail(r);
        el.disabled = true; G.resetPh('cp11case');
        goToast('CLP-012', r.case.id, L('Laporan terkirim: ' + r.case.id, 'Report sent: ' + r.case.id));
      }
    }
  };
  document.addEventListener('change', function (e) {
    var el = e.target; if (!el || el.name !== 'cat' || !el.closest || !el.closest('#cp11-case')) return;
    var p = el.getAttribute('data-pri'), r = document.querySelector('#cp11-pri input[value="' + p + '"]'); if (r) r.checked = true;
  });

  /* ================= CLP-012 Complaint Detail (NP-05 §22, §23) — client view and staff actions ================= */
  var CASE_BTN = { assigned: ['assign', L('Tugaskan', 'Assign'), 'user'], review: ['review', L('Mulai Review', 'Start Review'), 'eye'], waiting: ['ask', L('Tanya Klien', 'Ask Client'), 'message'], action: ['action', L('Tindakan Diperlukan', 'Action Required'), 'alert'], resolved: ['resolve', L('Selesaikan', 'Resolve'), 'checkc'], closed: ['close', L('Tutup Kasus', 'Close Case'), 'lock'] };
  function stars(n) { var h = ''; for (var i = 1; i <= 5; i++) h += ic('star', i <= n ? 'cp11-star on' : 'cp11-star'); return '<span class="cp11-stars" role="img" aria-label="' + n + '/5">' + h + '</span>'; }
  function caseActDlg(id, act, st) {
    var cfg = {
      assign: { title: L('Tugaskan kasus', 'Assign case'), body: fld(L('Pemilik kasus', 'Case owner'), sel('emp', (window.JFACCESS ? window.JFACCESS.EMPLOYEES : []).filter(function (e) { return ['EMP-050'].indexOf(e.id) < 0; }).map(function (e) { return [e.id, L(e.n + ' · ' + T(e.dept || ''), e.n + ' · ' + E0(e.dept || ''))]; }), (cx().employee || {}).id), { req: true, wide: true }) },
      review: { title: st === 'resolved' ? L('Buka kembali kasus', 'Reopen case') : L('Mulai review', 'Start review'), note: st === 'resolved', internal: true, label: st === 'resolved' ? L('Alasan', 'Reason') : L('Catatan (opsional)', 'Note (optional)') },
      ask: { title: L('Tanya klien', 'Ask the client'), note: true, label: L('Pertanyaan untuk klien', 'Question for the client') },
      action: { title: L('Tindakan diperlukan', 'Action required'), internal: true, label: L('Catatan (opsional)', 'Note (optional)') },
      resolve: { title: L('Selesaikan kasus', 'Resolve case'), note: true, label: L('Catatan resolusi (terlihat klien)', 'Resolution note (visible to the client)') },
      close: { title: L('Tutup kasus', 'Close case'), note: st !== 'resolved', label: st !== 'resolved' ? L('Alasan', 'Reason') : L('Catatan (opsional)', 'Note (optional)') },
      note: { title: L('Catatan internal', 'Internal note'), note: true, label: L('Catatan (tidak terlihat klien)', 'Note (not visible to the client)') }
    }[act];
    var realAct = act === 'review' && st === 'resolved' ? 'reopen' : act;
    dlg({ title: cfg.title, icon: 'edit', ok: L('Simpan', 'Save'), sub: mono(id),
      body: (cfg.body || '') + (act !== 'assign' ? fld(cfg.label, area('note', ''), { req: !!cfg.note, wide: true }) : '') + (cfg.internal ? '<label class="cp11-chk"><input type="checkbox" name="internal"> <span>' + t(L('Catatan internal (tidak terlihat klien)', 'Internal note (not visible to the client)')) + '</span></label>' : ''),
      onOk: function (v, el) {
        v = vals(el);
        var r = act === 'note' ? K.caseNote(cx(), id, v.note) : K.caseAct(cx(), id, realAct, { note: v.note, emp: v.emp, internal: !!v.internal });
        if (!r.ok) return errMsg(r); after(L('Kasus diperbarui.', 'Case updated.')); return true;
      } });
  }
  V['CLP-012'] = {
    title: function (rec) { return rec ? L('Laporan ' + rec, 'Report ' + rec) : L('Detail Laporan', 'Report Detail'); },
    render: function (c) {
      var c0 = cx(), s = sc();
      if (s.client && s.blocked) return blocked();
      var x = c.rec ? K.case(c0, c.rec) : null; if (!x) return noAccess('CLP-010');
      var staff = !s.client;
      var head = '<section class="card cp11-ch">' + catIc(x.cat, x.icon) + '<div><small class="mono6">' + esc(x.id) + '</small><h2>' + t(x.catLabel) + '</h2><p>' + ic('pin') + esc(x.propName) + (staff ? ' · ' + esc(K.clientName(x.cl)) : '') + '</p></div>' + A.chip(x.tone, x.stLabel) + '</section>';
      var wait = x.st === 'waiting' ? '<section class="card cp11-wait">' + ic('message') + '<div><b>' + t(staff ? L('Menunggu jawaban klien', 'Waiting for the client') : L('Tim JFRESH menunggu jawaban Anda', 'The JFRESH team is waiting for your answer')) + '</b>' + (x.question ? '<p>' + t(x.question) + '</p>' : '') +
        (x.canReply ? '<div id="cp11-reply">' + '<textarea name="msg" rows="3" placeholder="' + t(L('Tulis balasan Anda…', 'Write your reply…')) + '"></textarea>' + G.photoIn('cp11reply', L('Tambah Foto', 'Add Photo')) + A.btn('primary', L('Kirim Balasan', 'Send Reply'), 'check', { act: 'caseReply', val: x.id }) + '</div>' : '') + '</div></section>' : '';
      var info = card(L('Detail Laporan', 'Report Detail'), kv([[L('Nomor kasus', 'Case number'), mono(x.id)], [L('Dilaporkan', 'Reported'), dtm(x.at)], [L('Prioritas', 'Priority'), A.chip(K.PRI[x.pri][1], x.priLabel)], x.ref ? [L('Referensi', 'Reference'), mono(x.ref)] : null, x.pic ? [L('PIC', 'PIC'), esc(x.pic)] : null,
        [L('Pemilik', 'Owner'), x.owner ? (staff ? esc(x.owner) : t(L('Tim JFRESH · ', 'JFRESH team · ')) + esc(x.owner)) : t(L('Belum ditugaskan', 'Not assigned yet'))], [L('Update terakhir', 'Last update'), dtm(x.upd)],
        [L('Target resolusi', 'Resolution target'), dtm(x.target) + (x.overdue ? ' ' + A.chip('crit', L('Lewat target', 'Past target'), 'clock') : '')], x.photo ? [L('Foto', 'Photo'), ic('camera') + ' ' + t(L('Terlampir', 'Attached'))] : null]) +
        '<div class="cp11-desc"><small>' + t(L('Deskripsi', 'Description')) + '</small><p>' + t(x.desc) + '</p></div>', { icon: 'file' });
      var res = x.res ? card(L('Resolusi', 'Resolution'), '<p class="cp11-res">' + ic('checkc') + '<span>' + t(x.res) + '</span></p><small class="cp11-mut">' + dtm(x.resAt) + '</small>', { icon: 'checkc' }) : '';
      var fb = '';
      if (x.fb) fb = card(L('Feedback', 'Feedback'), '<p>' + stars(x.fb.r) + ' <b>' + esc(x.fb.r) + '/5</b></p>' + (x.fb.c ? '<p>' + esc(x.fb.c) + '</p>' : '') + '<small class="cp11-mut">' + dtm(x.fb.at) + '</small>', { icon: 'star' });
      else if (x.canFeedback) fb = '<section class="card cp11-fb" id="cp11-fb"><h2 class="cp11-h2">' + t(L('Bagaimana penanganan kami?', 'How did we do?')) + '</h2><div class="cp11-rate" role="radiogroup">' + [1, 2, 3, 4, 5].map(function (n) { return '<label><input type="radio" name="rating" value="' + n + '"><span>' + ic('star') + '<b>' + n + '</b></span></label>'; }).join('') + '</div>' +
        '<textarea name="comment" rows="2" placeholder="' + t(L('Komentar (opsional)', 'Comment (optional)')) + '"></textarea>' + A.btn('primary', L('Kirim Feedback', 'Send Feedback'), 'star', { act: 'caseFb', val: x.id }) + '</section>';
      var staffBar = '';
      if (staff && x.actions && sc().manage) {
        var btns = x.actions.map(function (to) { var b = CASE_BTN[to]; if (!b) return ''; var lab = to === 'review' && x.st === 'resolved' ? L('Buka Kembali', 'Reopen') : b[1]; return A.btn(to === 'resolved' ? 'primary' : 'ghost', lab, b[2], { act: 'caseAct', val: b[0], cls: 'btn-sm' }); });
        if (['new', 'assigned', 'review', 'action'].indexOf(x.st) >= 0 && x.actions.indexOf('assigned') < 0) btns.unshift(A.btn('ghost', L('Tugaskan', 'Assign'), 'user', { act: 'caseAct', val: 'assign', cls: 'btn-sm' }));
        btns.push(A.btn('ghost', L('Catatan Internal', 'Internal Note'), 'lock', { act: 'caseAct', val: 'note', cls: 'btn-sm' }));
        staffBar = '<section class="card cp11-sbar"><b>' + ic('briefcase') + t(L('Tindakan tim', 'Team actions')) + '</b><div class="cp11-acts">' + btns.join('') + '</div></section>';
      }
      return (staff ? A.pageHead(L('Kasus ' + x.id, 'Case ' + x.id), esc(K.clientName(x.cl)) + ' · ' + esc(x.propName)) : '') + head + staffBar + wait +
        '<div class="cp11-two"><div class="cp11-col">' + info + res + fb + '</div><div class="cp11-col">' + card(L('Timeline', 'Timeline'), timeline(x.timeline), { icon: 'history' }) + (staff ? '' : contactCard()) + '</div></div>' +
        '<div class="cp11-row">' + back('CLP-010', staff ? L('Antrian Kasus', 'Case Queue') : L('Semua Laporan', 'All Reports')) + '</div>';
    },
    act: {
      caseReply: function (el) { var box = document.getElementById('cp11-reply'), v = vals(box), id = el.getAttribute('data-val'); var r = K.replyCase(cx(), id, { msg: v.msg, photo: G.photos('cp11reply')[0] || null }); if (!r.ok) return fail(r); G.resetPh('cp11reply'); after(L('Balasan terkirim.', 'Reply sent.')); },
      caseFb: function (el) { var box = document.getElementById('cp11-fb'), v = vals(box); var r = K.caseFeedback(cx(), el.getAttribute('data-val'), { rating: +v.rating, comment: v.comment }); if (!r.ok) return fail(r); after(L('Terima kasih atas feedback Anda.', 'Thank you for your feedback.')); },
      caseAct: function (el) { var x = K.case(cx(), A.S.rec); if (!x) return; caseActDlg(x.id, el.getAttribute('data-val'), x.st); }
    }
  };

  /* ================= CLP-013 Client User List (NP-06 §24–§29) ================= */
  function usersTabs(cur) { return '<nav class="tabs scroll tabs5 seg5 cp11-utabs">' + [['CLP-013', null, L('Pengguna', 'Users'), 'users', 'u'], ['CLP-015', null, L('Property', 'Property'), 'building', 'p'], ['CLP-015', { tab: 'roles' }, L('Role & Akses', 'Roles & Access'), 'shield', 'r']].map(function (x) { var on = x[4] === cur; return '<a href="' + href(x[0], null, x[1]) + '" aria-selected="' + on + '"' + (on ? ' aria-current="true"' : '') + '>' + ic(x[3]) + '<span>' + t(x[2]) + '</span></a>'; }).join('') + '</nav>'; }
  function myRank() { var s = sc(); return (K.CROLES[s.role] || {}).rank || 0; }
  function accessForm(u) {
    var s = sc(), ps = K.props(cx()), role = u ? u.role : 'fo', scope = u ? u.scope : (s.scope === 'all' ? 'single' : 'single'), uprops = u ? u.props : [ps[0] && ps[0].id];
    var roles = K.CROLE_ORDER.filter(function (k) { return K.CROLES[k].rank <= myRank(); }).map(function (k) { return [k, K.CROLES[k].n]; });
    var scopes = Object.keys(K.SCOPES).filter(function (k) { return k !== 'all' || s.scope === 'all'; }).map(function (k) { return [k, K.SCOPES[k]]; });
    var perms = u ? u.perms : (function () { var o = {}; K.CP_KEYS.forEach(function (k) { o[k] = (K.CROLES[role].perms || []).indexOf(k) >= 0; }); return o; })();
    return fld(L('Role', 'Role'), sel('role', roles, role), { req: true }) + fld(L('Cakupan property', 'Property scope'), sel('scope', scopes, scope), { req: true }) +
      '<div class="f5 f5-w"><span>' + t(L('Property', 'Property')) + '</span><div class="cp11-chks">' + ps.map(function (p) { return '<label class="cp11-chk"><input type="checkbox" name="props" data-multi="1" value="' + esc(p.id) + '"' + (scope === 'all' || uprops.indexOf(p.id) >= 0 ? ' checked' : '') + '> <span>' + esc(p.n) + '</span></label>'; }).join('') + '</div><small>' + t(L('Untuk "Semua Property" pilihan ini diabaikan.', 'Ignored for "All Properties".')) + '</small></div>' +
      fld(L('Awal akses', 'Access start'), '<input type="date" name="start" value="' + esc(u ? u.start || '' : K.today()) + '">') + fld(L('Akhir akses', 'Access end'), '<input type="date" name="end" value="' + esc(u ? u.end || '' : '') + '">', { hint: t(L('Kosongkan bila tanpa batas.', 'Leave empty for no end.')) }) +
      (u ? '<div class="f5 f5-w"><span>' + t(L('Hak akses', 'Permissions')) + '</span><div class="cp11-chks">' + K.CP_KEYS.map(function (k) { return '<label class="cp11-chk"><input type="checkbox" name="perm" data-multi="1" value="' + k + '"' + (perms[k] ? ' checked' : '') + (s.perms[k] ? '' : ' disabled') + '> <span>' + t(K.CP_LABEL[k]) + '</span></label>'; }).join('') + '</div><small>' + t(L('Perbedaan dari default role disimpan sebagai pengecualian.', 'Differences from the role default are saved as overrides.')) + '</small></div>' : '');
  }
  function addUserDlg() {
    dlg({ title: L('Tambah Pengguna', 'Add User'), icon: 'plus', ok: L('Kirim Undangan', 'Send Invitation'), sub: t(L('Pengguna baru menerima undangan dan aktif setelah menerimanya. Akses tidak bisa melebihi akses Anda.', 'The new user gets an invitation and becomes active after accepting it. Access can never exceed your own.')),
      body: fld(L('Nama', 'Name'), inp('name', ''), { req: true }) + fld(L('Email', 'Email'), inp('email', '', { type: 'email' }), { req: true }) + fld(L('Telepon', 'Phone'), inp('phone', '', { type: 'tel' })) + fld(L('Posisi', 'Position'), inp('pos', '')) + accessForm(null),
      onOk: function (v, el) {
        v = vals(el); var r = K.addClientUser(cx(), { name: v.name, email: v.email, phone: v.phone, pos: v.pos, role: v.role, scope: v.scope, props: v.scope === 'all' ? [] : v.props || [], start: v.start, end: v.end || null });
        if (!r.ok) return errMsg(r); goToast('CLP-014', r.user.uid, L('Undangan dikirim ke ' + r.invite.to + '.', 'Invitation sent to ' + r.invite.to + '.')); return true;
      } });
  }
  function userCard(u) {
    return '<a class="cp11-user" href="' + href('CLP-014', u.uid) + '"><span class="cp11-av">' + esc(initials(u.name)) + '</span><span class="cp11-job-b"><b>' + esc(u.name) + '</b><small>' + posRole(u) + '</small><small>' + ic('building') + u.propNames.map(function (x) { return t(x); }).join(', ') + '</small></span>' +
      '<span class="cp11-job-r">' + A.chip(u.tone, u.stLabel) + (u.expired ? A.chip('warn', L('Akses berakhir', 'Access ended')) : '') + '</span>' + ic('chevr', 'cp11-go') + '</a>';
  }
  V['CLP-013'] = {
    title: function () { return L('Pengguna & Akses', 'Users & Access'); },
    render: function (c) {
      var g = guard(); if (g) return g;
      var c0 = cx(), q = c.q, d = K.clientUsers(c0, { q: q.q, st: q.st, prop: q.prop }), sm = d.summary;
      return hero(t(L('Pengguna & Akses', 'Users & Access')), t(L('Kelola anggota tim Anda dan atur akses ke property.', 'Manage your team members and their property access.')), { sel: false }) + usersTabs('u') +
        card(L('Ringkasan Pengguna', 'User Summary'), tiles([{ k: L('Total Pengguna', 'Total Users'), v: esc(sm.total), icon: 'users', tone: 'info', go: 'CLP-013' }, { k: L('Aktif', 'Active'), v: esc(sm.active), icon: 'usercheck', tone: 'ok', go: 'CLP-013', q: { st: 'active' } },
          { k: L('Nonaktif Sementara', 'Suspended'), v: esc(sm.suspended), icon: 'clock', tone: 'appr', go: 'CLP-013', q: { st: 'suspended' } }, { k: L('Tidak Aktif', 'Inactive'), v: esc(sm.inactive), icon: 'xc', tone: 'crit', go: 'CLP-013', q: { st: 'inactive' } }, sm.invited ? { k: L('Diundang', 'Invited'), v: esc(sm.invited), icon: 'inbox', tone: 'info', go: 'CLP-013', q: { st: 'invited' } } : null], 'cp11-tiles-5 cp11-tiles-sm'), { icon: 'users' }) +
        '<div class="cp11-bar">' + search(L('Cari nama, email, atau posisi…', 'Search name, email or position…'), q.q) + selF('prop', L('Property', 'Property'), K.props(c0).map(function (p) { return [p.id, L(p.n, p.n)]; }), q.prop) + selF('st', L('Status', 'Status'), Object.keys(K.CU_ST).map(function (k) { return [k, K.CU_ST[k][0]]; }), q.st) + '</div>' +
        '<button type="button" class="cp11-cta" data-act="addUser">' + ic('plus') + '<span>' + t(L('Tambah Pengguna', 'Add User')) + '</span>' + ic('chevr') + '</button>' +
        (d.empty ? note(t(d.empty), 'bulb', 'info') : '') +
        (d.list.length ? '<div class="cp11-users hide-d">' + d.list.map(userCard).join('') + '</div><div class="hide-m hide-t">' + card(L('Daftar Pengguna', 'User List'), A.list(d.list, [
          { h: L('Nama', 'Name'), v: function (u) { return '<b>' + esc(u.name) + '</b><small class="sub5">' + esc(u.email) + '</small>'; } }, { h: L('Posisi', 'Position'), v: function (u) { return esc(u.pos || '—'); } }, { h: L('Role', 'Role'), v: function (u) { return t(u.roleName); } },
          { h: L('Property', 'Property'), v: function (u) { return u.propNames.map(function (x) { return t(x); }).join(', '); } }, { h: L('Akses', 'Access'), v: function (u) { return esc(u.start || '—') + (u.end ? ' → ' + esc(u.end) : ''); } },
          { h: L('Login terakhir', 'Last login'), v: function (u) { return u.lastLogin ? dtm(u.lastLogin) : '—'; } }, { h: L('Status', 'Status'), v: function (u) { return A.chip(u.tone, u.stLabel); } }
        ], function (u) { return { t: esc(u.name), s: t(u.roleName) }; }, function (u) { return href('CLP-014', u.uid); }, { dense: true }), { icon: 'list', count: d.list.length }) + '</div>' : emptyBox(K.MSG.emptyUser)) +
        note(t(L('Setiap perubahan akses tercatat: siapa, apa yang berubah, sebelum, sesudah, alasan dan waktu.', 'Every access change is logged: who, what changed, before, after, reason and time.')), 'shield', 'info');
    },
    act: { addUser: function () { addUserDlg(); } }
  };

  /* ================= CLP-014 Client User Detail ================= */
  function diff(b, a) {
    if (!b && !a) return '';
    if (!b) return '<small class="cp11-mut">' + esc(Object.keys(a || {}).filter(function (k) { return a[k] != null && String(a[k]) !== ''; }).map(function (k) { return k + ': ' + (Array.isArray(a[k]) ? a[k].join(',') : a[k]); }).join(' · ')) + '</small>';
    var keys = Object.keys(Object.assign({}, b, a)).filter(function (k) { return JSON.stringify(b[k]) !== JSON.stringify(a[k]); });
    return keys.length ? '<ul class="cp11-diff">' + keys.map(function (k) { var f = function (v) { return v == null || v === '' ? '—' : Array.isArray(v) ? (v.join(', ') || '—') : String(v); }; return '<li><b>' + esc(k) + '</b> <s>' + esc(f(b[k])) + '</s> → <span>' + esc(f(a[k])) + '</span></li>'; }).join('') + '</ul>' : '';
  }
  function statusDlg(uid, kind) {
    var cfg = { suspend: [L('Nonaktifkan sementara', 'Suspend user'), K.suspend, L('Pengguna dinonaktifkan sementara.', 'User suspended.')], deactivate: [L('Nonaktifkan pengguna', 'Deactivate user'), K.deactivate, L('Pengguna dinonaktifkan.', 'User deactivated.')], reactivate: [L('Aktifkan kembali', 'Reactivate user'), K.reactivate, L('Pengguna aktif kembali.', 'User reactivated.')] }[kind];
    dlg({ title: cfg[0], icon: kind === 'reactivate' ? 'usercheck' : 'lock', ok: cfg[0], sub: t(L('Perubahan berlaku segera dan tercatat di riwayat akses.', 'The change applies at once and is logged in the access history.')),
      body: fld(L('Alasan', 'Reason'), area('reason', ''), { req: true, wide: true }),
      onOk: function (v, el) { v = vals(el); var r = cfg[1](cx(), uid, v.reason); if (!r.ok) return errMsg(r); after(cfg[2]); return true; } });
  }
  function editDlg(u) {
    dlg({ title: L('Ubah Akses', 'Edit Access'), icon: 'edit', ok: L('Simpan Perubahan', 'Save Changes'), sub: esc(u.name) + ' · ' + t(L('Alasan wajib diisi. Pengguna perlu login ulang bila role atau property berubah.', 'A reason is required. The user signs in again when the role or properties change.')),
      body: fld(L('Telepon', 'Phone'), inp('phone', u.phone)) + fld(L('Posisi', 'Position'), inp('pos', u.pos)) + accessForm(u) + fld(L('Alasan perubahan', 'Reason for the change'), area('reason', ''), { req: true, wide: true }),
      onOk: function (v, el) {
        v = vals(el); var base = K.CROLES[v.role] ? K.CROLES[v.role].perms : [], chosen = v.perm || [];
        var grant = chosen.filter(function (k) { return base.indexOf(k) < 0; }), deny = base.filter(function (k) { return chosen.indexOf(k) < 0; });
        var r = K.editAccess(cx(), u.uid, { role: v.role, scope: v.scope, props: v.scope === 'all' ? [] : v.props || [], start: v.start || null, end: v.end || null, grant: grant, deny: deny, phone: v.phone, pos: v.pos }, v.reason);
        if (!r.ok) return errMsg(r); after(L('Akses diperbarui.', 'Access updated.')); return true;
      } });
  }
  V['CLP-014'] = {
    title: function (rec) { var u = rec && K.userRec(rec); return u ? L(u.name, u.name) : L('Detail Pengguna', 'User Detail'); },
    render: function (c) {
      var g = guard(); if (g) return g;
      var c0 = cx(), u = c.rec ? K.clientUser(c0, c.rec) : null; if (!u) return noAccess('CLP-013');
      var head = '<section class="card cp11-uh"><span class="cp11-av cp11-av-l">' + esc(initials(u.name)) + '</span><div><h2>' + esc(u.name) + '</h2><p>' + posRole(u) + '</p></div>' + A.chip(u.tone, u.stLabel) + (u.expired ? A.chip('warn', L('Akses berakhir', 'Access ended'), 'clock') : '') + '</section>';
      var b = [];
      if (u.editable) {
        b.push(A.btn('primary', L('Ubah Akses', 'Edit Access'), 'edit', { act: 'uEdit' }));
        if (u.st === 'active') b.push(A.btn('ghost', L('Nonaktifkan Sementara', 'Suspend'), 'pause', { act: 'uSt', val: 'suspend' }));
        if (u.st === 'active' || u.st === 'suspended') b.push(A.btn('ghost', L('Nonaktifkan', 'Deactivate'), 'xc', { act: 'uSt', val: 'deactivate' }));
        if (u.st === 'suspended' || u.st === 'inactive') b.push(A.btn('ghost', L('Aktifkan Kembali', 'Reactivate'), 'usercheck', { act: 'uSt', val: 'reactivate' }));
        if (u.st === 'invited') b.push(A.btn('ghost', L('Demo: undangan diterima', 'Demo: invitation accepted'), 'checkc', { act: 'uAccept' }));
      }
      var acts0 = b.length ? '<div class="cp11-acts">' + b.join('') + '</div>' : note(t(u.uid === c0.uid ? L('Ini akun Anda. Akses Anda diatur oleh administrator perusahaan Anda.', 'This is your account. Your access is managed by your company administrator.') : L('Akses pengguna ini di atas kewenangan Anda.', 'This user\'s access is above your authority.')), 'lock', 'info');
      var det = card(L('Data Pengguna', 'User Data'), kv([[L('Nama', 'Name'), esc(u.name)], [L('Email', 'Email'), esc(u.email)], [L('Telepon', 'Phone'), esc(u.phone || '—')], [L('Posisi', 'Position'), esc(u.pos || '—')], [L('Role', 'Role'), t(u.roleName)],
        [L('Cakupan property', 'Property scope'), t(u.scopeLabel) + ' · ' + u.propNames.map(function (x) { return t(x); }).join(', ')], [L('Awal akses', 'Access start'), esc(u.start ? day(u.start) : '—')], [L('Akhir akses', 'Access end'), esc(u.end ? day(u.end) : t(L('Tanpa batas', 'No end')))],
        [L('Status', 'Status'), A.chip(u.tone, u.stLabel)], [L('Login terakhir', 'Last login'), u.lastLogin ? dtm(u.lastLogin) : '—']]), { icon: 'user' });
      var perms = card(L('Hak Akses', 'Permissions'), '<ul class="cp11-perms">' + K.CP_KEYS.map(function (k) { var over = u.grant.indexOf(k) >= 0 ? ' · ' + T(L('ditambahkan', 'granted')) : u.deny.indexOf(k) >= 0 ? ' · ' + T(L('dicabut', 'removed')) : ''; return '<li class="' + (u.perms[k] ? 'on' : 'off') + '">' + ic(u.perms[k] ? 'checkc' : 'minus') + '<span>' + t(K.CP_LABEL[k]) + (over ? '<small>' + esc(over) + '</small>' : '') + '</span></li>'; }).join('') + '</ul>', { icon: 'shield' });
      var hist = card(L('Riwayat Akses', 'Access History'), u.history.length ? '<ol class="cp11-tl">' + u.history.map(function (h) { return '<li><span class="cp11-tl-d"></span><div><b>' + t(h.label) + '</b><small>' + dtm(h.at) + ' · ' + esc(h.actor) + '</small>' + (h.reason ? '<p>' + t(L('Alasan: ', 'Reason: ')) + tx(h.reason) + '</p>' : '') + diff(h.before, h.after) + '</div></li>'; }).join('') + '</ol>' : '<p class="cp11-mut">' + t(L('Belum ada perubahan akses.', 'No access changes yet.')) + '</p>', { icon: 'history' });
      var logins = card(L('Login Terakhir', 'Recent Sign-ins'), u.logins.length ? '<ul class="cp11-list">' + u.logins.map(function (l) { return '<li>' + ic(l.ok ? 'checkc' : 'alert') + '<span><b>' + dtm(l.at) + '</b><small>' + esc(l.device || '') + ' · ' + t(l.ok ? L('Berhasil', 'Success') : L('Gagal', 'Failed')) + '</small></span></li>'; }).join('') + '</ul>' : '<p class="cp11-mut">' + t(L('Belum pernah login.', 'Never signed in.')) + '</p>', { icon: 'key' });
      return head + acts0 + '<div class="cp11-two"><div class="cp11-col">' + det + perms + '</div><div class="cp11-col">' + hist + logins + '</div></div><div class="cp11-row">' + back('CLP-013', L('Semua Pengguna', 'All Users')) + '</div>';
    },
    act: {
      uEdit: function () { var u = K.clientUser(cx(), A.S.rec); if (u) editDlg(u); },
      uSt: function (el) { statusDlg(A.S.rec, el.getAttribute('data-val')); },
      uAccept: function () { var r = K.acceptInvite(A.S.rec); if (!r.ok) return fail(r); after(L('Undangan diterima. Pengguna aktif.', 'Invitation accepted. The user is active.')); }
    }
  };

  /* ================= CLP-015 Property Access ================= */
  V['CLP-015'] = {
    title: function () { return L('Akses Property', 'Property Access'); },
    render: function (c) {
      var g = guard(); if (g) return g;
      var c0 = cx(), pa = K.propertyAccess(c0); if (!pa) return noAccess('CLP-013');
      var roles = c.q.tab === 'roles';
      var body;
      if (roles) {
        body = card(L('Role & Hak Akses Default', 'Roles & Default Permissions'), '<div class="tblw hide-m"><table class="tbl dense cp11-mx"><thead><tr><th>' + t(L('Role', 'Role')) + '</th>' + K.CP_KEYS.map(function (k) { return '<th class="c">' + t(K.CP_LABEL[k]) + '</th>'; }).join('') + '<th class="c">' + t(L('Kontrak', 'Contract')) + '</th></tr></thead><tbody>' +
          pa.roles.map(function (r) { return '<tr><th>' + t(r.n) + '</th>' + K.CP_KEYS.map(function (k) { return '<td class="c">' + (r.perms[k] ? ic('checkc', 'cp11-y') : ic('minus', 'cp11-n')) + '</td>'; }).join('') + '<td class="c">' + (r.contract ? ic('checkc', 'cp11-y') : ic('minus', 'cp11-n')) + '</td></tr>'; }).join('') + '</tbody></table></div>' +
          '<div class="cp11-roles hide-d hide-t">' + pa.roles.map(function (r) { return '<div class="cp11-role"><b>' + t(r.n) + '</b><span>' + K.CP_KEYS.filter(function (k) { return r.perms[k]; }).map(function (k) { return A.chip('info', K.CP_LABEL[k]); }).join(' ') + '</span></div>'; }).join('') + '</div>' +
          note(t(L('Hak akses per pengguna bisa ditambah atau dicabut di Detail Pengguna, tidak pernah melebihi akses Anda sendiri.', 'Per-user permissions can be added or removed in User Detail, never above your own access.')), 'bulb', 'info'), { icon: 'shield' });
      } else {
        body = '<div class="cp11-props">' + pa.props.map(function (p) {
          return '<section class="card cp11-prop' + (p.inScope ? '' : ' is-out') + '"><div class="cp11-prop-h">' + ic('building') + '<div><b>' + esc(p.n) + '</b><small>' + esc(p.city || '') + '</small></div>' + A.chip(p.active ? 'ok' : 'mute', L(p.active + ' user aktif', p.active + ' active users')) + '</div>' +
            (p.users.length ? '<ul class="cp11-pu">' + p.users.map(function (u) { return '<li><a href="' + href('CLP-014', u.uid) + '"><span class="cp11-av cp11-av-s">' + esc(initials(u.name)) + '</span><span><b>' + esc(u.name) + '</b><small>' + t(u.roleName) + ' · ' + t(K.SCOPES[u.scope]) + '</small></span>' + A.chip(K.CU_ST[u.st][1], K.CU_ST[u.st][0]) + '</a></li>'; }).join('') + '</ul>' : '<p class="cp11-mut">' + t(K.MSG.emptyUser) + '</p>') +
            (p.inScope ? '' : '<p class="cp11-mut">' + ic('lock') + t(L('Di luar cakupan akses Anda.', 'Outside your access scope.')) + '</p>') + '</section>';
        }).join('') + '</div>';
      }
      return hero(t(L('Akses Property', 'Property Access')), t(L('Siapa yang bisa mengakses property mana.', 'Who can reach which property.')), { sel: false }) + usersTabs(roles ? 'r' : 'p') + body +
        '<div class="cp11-row">' + A.btn('primary', L('Tambah Pengguna', 'Add User'), 'plus', { act: 'addUser' }) + '</div>';
    },
    act: { addUser: function () { addUserDlg(); } }
  };

  /* ---------- Old routes render the Phase 11 screens (HOM-CLT-001 stays the client landing) ---------- */
  Object.keys(K.ALIAS).forEach(function (old) { V[old] = V[K.ALIAS[old]]; });
})();
