/* JFRESH OS — Phase 7 screens (part 1): shared helpers (map, ETA, photo, signature,
   steppers, assign dialog), NP-01 Order (ORDER-001 … 003), NP-02 Recurring Schedule
   (SCHEDULE-001, 002) and NP-03 Dispatch Board (DISPATCH-001). Every number comes from the
   logistics engine (assets/js/jfos-logi.js); every protected action goes through the
   engine, which checks permission, task assignment and client scope and writes the audit. */
(function () {
  var A = window.JFAPP, E = window.JFLOG, H = A && A.P5;
  if (!A || !E || !H) return;
  var V = A.V, T = A.T, L = A.L, t = A.t, esc = A.esc, ic = A.ic, can = A.can, fmt = A.fmt, href = A.href;
  var open = H.open, lnk = H.lnk, tabs = H.tabs, card = H.card, kv = H.kv, note = H.note, tile = H.tile, tiles = H.tiles, dlg = H.dlg, fld = H.fld, inp = H.inp, sel = H.sel, area = H.area, num = H.num;
  A.addParents(E.PARENTS);
  function cx() { return A.ctx(); }
  var CM = window.JFCOMM, G;

  /* ================= Shared helpers (also used by screens-logi2.js / screens-logi3.js) ================= */
  function tone(map, k) { var x = map[k]; return x ? x[1] : 'mute'; }
  function stC(o, st) { st = st || o.st; var x = E.ST[st] || ['', 'mute', 'file']; return A.chip(x[1], E.stLabel(o, st), x[2]); }
  function priC(p, all) { var x = E.PRI[p] || E.PRI.normal; return p === 'normal' && !all ? '<span class="pr7 pr7-n">' + t(x[0]) + '</span>' : '<span class="pr7 pr7-' + p + '">' + (E.priRank(p) >= 4 ? ic('zap') : '') + t(x[0]) + '</span>'; }
  function kindC(k) { return '<span class="k7 k7-' + k + '">' + ic(k === 'pickup' ? 'basket' : 'package') + '<span>' + t(E.KIND[k]) + '</span></span>'; }
  function sevC(s) { var x = E.SEV[s] || E.SEV.info; return A.chip(x[1], x[0], s === 'crit' ? 'alert' : s === 'warn' ? 'alert' : 'bell'); }
  function liveC(k) { var x = E.LIVE_ST[k] || E.LIVE_ST.idle; return '<span class="lv7 lv7-' + k + '"><i></i>' + t(x[0]) + '</span>'; }
  function tripC(k) { var x = E.TRIP_ST[k] || E.TRIP_ST.assigned; return A.chip(x[1], x[0]); }
  function mfC(k) { var x = E.MF_ST[k] || ['', 'mute']; return A.chip(x[1], x[0]); }
  function hm(ms) { return ms == null ? '—' : E.hm(ms); }
  var MON = { id: ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'], en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] };
  function dts(d) { if (!d) return '—'; var p = String(d).slice(0, 10).split('-'); return +p[2] + ' ' + MON[A.S.lang === 'en' ? 'en' : 'id'][+p[1] - 1]; }
  function day(d) { if (d === E.TODAY) return T(L('Hari ini', 'Today')); if (d === E.addDays(E.TODAY, 1)) return T(L('Besok', 'Tomorrow')); return dts(d); }
  function when(s) { if (!s) return '—'; s = String(s); return (s.slice(0, 10) === E.TODAY ? '' : dts(s) + ' ') + s.slice(11, 16); }
  function agoS(sec) { sec = Math.max(0, Math.round(sec)); return sec < 60 ? T(L(sec + ' dtk lalu', sec + ' sec ago')) : sec < 3600 ? T(L(Math.floor(sec / 60) + ' menit lalu', Math.floor(sec / 60) + ' min ago')) : T(L(Math.floor(sec / 3600) + ' jam lalu', Math.floor(sec / 3600) + ' h ago')); }
  function minT(m) { return m < 60 ? T(L(m + ' menit', m + ' min')) : T(L(Math.floor(m / 60) + ' j ' + (m % 60) + ' mnt', Math.floor(m / 60) + ' h ' + (m % 60) + ' min')); }
  function pname(id) { return esc(E.propName(id)); }
  function cname(id) { return esc(E.clientName(id)); }
  function emp(id) { return esc(E.empName(id)); }
  function ordLink(id, label) { return lnk('ORDER-003', id, label || '<span class="mono6">' + esc(id) + '</span>'); }
  function mob() { return A.mode() === 'm'; }
  function after(msg, tn) { A.rerender(); setTimeout(function () { A.toast(msg, tn); }, 280); }
  function fail(r) { A.toast(r && r.msg ? r.msg : E.MSG.invalid, 'crit'); return false; }
  function vals(root) { var v = {}; (root || document).querySelectorAll('[name]').forEach(function (f) { if (f.type === 'checkbox') { if (f.getAttribute('data-multi')) { v[f.name] = v[f.name] || []; if (f.checked) v[f.name].push(f.value); } else v[f.name] = f.checked; } else if (f.type === 'radio') { if (f.checked) v[f.name] = f.value; else if (!(f.name in v)) v[f.name] = ''; } else v[f.name] = String(f.value).trim(); }); return v; }
  function opts(map) { return Object.keys(map).map(function (k) { return [k, Array.isArray(map[k]) && Array.isArray(map[k][0]) ? map[k][0] : map[k]]; }); }
  function initials(n) { return String(n || '?').split(/\s+/).slice(0, 2).map(function (x) { return x.charAt(0); }).join('').toUpperCase(); }
  function av(id, cls) { return '<span class="av7 ' + (cls || '') + '" aria-hidden="true">' + esc(initials(E.empName(id))) + '</span>'; }
  function waNum(p) { return String(p || '').replace(/\D/g, ''); }
  function reach(c, o) {
    if (!c) return ''; o = o || {};
    return '<span class="ra7' + (o.big ? ' ra7-b' : '') + '">' + (c.phone ? '<a class="btn btn-ghost btn-sm" href="tel:' + esc(waNum(c.phone)) + '">' + ic('phone') + '<span>' + t(L('Telepon', 'Call')) + '</span></a>' : '') +
      (c.wa || c.phone ? '<a class="btn btn-sm ra7-wa" href="https://wa.me/' + esc(waNum(c.wa || c.phone)) + '" target="_blank" rel="noopener">' + ic('message') + '<span>WhatsApp</span></a>' : '') + '</span>';
  }
  function navUrl(o) { var p = E.prop(o.prop) || {}; return 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent((p.n || '') + ', ' + (p.addr || '') + ', Bali'); }
  function contactOf(o) { var c = o.ct && E.contact(o.ct); if (c) return c; var p = E.prop(o.prop); return p && p.pick ? E.contact(p.pick) : null; }
  function instr(o) { return T(o.instr) ? note(esc(T(o.instr)), 'info', 'info') : ''; }

  /* ETA (§59–§60): duration, clock time and freshness. Stale data is shown as last known, never as live. */
  function etaBox(o, o2) {
    o2 = o2 || {};
    var e = E.eta(o);
    if (!e) return '<div class="eta7 eta7-none">' + ic('clock') + '<span>' + t(L('ETA belum tersedia', 'ETA not available yet')) + '</span></div>';
    if (e.arrived) return '<div class="eta7 eta7-arr">' + ic('pin') + '<span><b>' + t(L('Tiba', 'Arrived')) + ' ' + hm(e.at) + '</b>' + (e.late ? ' ' + A.chip('warn', L('Terlambat ' + e.delay + ' mnt', e.delay + ' min late')) : '') + '</span></div>';
    var fr = e.projected ? '<span class="eta7-f">' + ic('route') + t(L('Perkiraan dari rencana rute', 'Estimate from the route plan')) + '</span>'
      : e.stale ? '<span class="eta7-f eta7-st">' + ic('wifioff') + t(L('Lokasi terakhir · ', 'Last known location · ')) + esc(agoS(e.age)) + ' · ' + t(e.fresh === 'offline' ? L('Offline', 'Offline') : L('Sinyal lemah', 'Weak connection')) + '</span>'
        : '<span class="eta7-f eta7-lv">' + ic('refresh') + t(L('Diperbarui ', 'Updated ')) + esc(agoS(e.age)) + '</span>';
    return '<div class="eta7' + (o2.big ? ' eta7-b' : '') + (e.stale ? ' is-stale' : '') + (e.late ? ' is-late' : '') + '"><div class="eta7-r"><span class="eta7-k">ETA</span><b class="num">' + (e.stale ? '± ' : '') + esc(minT(e.min)) + '</b></div>' +
      '<div class="eta7-r"><span class="eta7-k">' + t(L('Tiba sekitar', 'Arrival')) + '</span><b class="num">' + hm(e.at) + '</b></div>' + fr +
      (e.late ? '<span class="eta7-d">' + ic('alert') + t(L('Diperkirakan terlambat ' + e.delay + ' menit', 'Expected ' + e.delay + ' min late')) + '</span>' : e.near && !e.stale ? '<span class="eta7-n">' + ic('pin') + t(L('Hampir tiba', 'Almost there')) + '</span>' : '') + '</div>';
  }
  function freshC(p) {
    if (!p) return '<span class="fr7 fr7-off">' + ic('lock') + t(L('Tidak dilacak (di luar perjalanan)', 'Not tracked (outside a trip)')) + '</span>';
    if (p.fresh === 'live') return '<span class="fr7 fr7-live"><i></i>' + t(L('Live · ', 'Live · ')) + esc(agoS(p.age)) + '</span>';
    return '<span class="fr7 fr7-' + p.fresh + '">' + ic('wifioff') + t(p.fresh === 'weak' ? L('Sinyal lemah · lokasi terakhir ', 'Weak connection · last known ') : L('Offline · lokasi terakhir ', 'Offline · last known ')) + esc(agoS(p.age)) + '</span>';
  }
  function trackBanner(trip) {
    if (trip && trip.track && trip.track.on) return '<div class="tb7 tb7-on" role="status">' + ic('pin') + '<b>' + t(L('LOKASI SEDANG DIBAGIKAN UNTUK OPERASIONAL', 'LOCATION IS SHARED FOR OPERATIONS')) + '</b><small>' + t(L('Sejak ', 'Since ')) + esc(String(trip.track.from).slice(11, 16)) + ' · ' + t(L('berhenti otomatis saat rute selesai atau shift berakhir', 'stops automatically when the route ends or the shift ends')) + '</small></div>';
    return '<div class="tb7" role="status">' + ic('lock') + '<span>' + t(L('Lokasi tidak dibagikan. Pelacakan hanya berjalan setelah MULAI PERJALANAN.', 'Location is not shared. Tracking only runs after MULAI PERJALANAN.')) + '</span></div>';
  }

  /* Schematic map (south Bali). Not GPS: positions come from the engine's last ping. */
  var COLORS = ['c0', 'c1', 'c2', 'c3', 'c4'];
  function colorOf(t0) { var i = E.state().trips.indexOf(t0); return COLORS[(i < 0 ? 0 : i) % COLORS.length]; }
  var LAND = 'M250 0H1000V380C900 400 760 400 700 450C660 480 650 520 600 520C560 520 540 540 520 560C500 580 520 640 520 640H330C330 600 360 570 400 560C420 520 400 470 360 440C320 410 280 380 250 330Z';
  var AREAS = [['Ubud', 600, 108], ['Gianyar', 760, 230], ['Denpasar', 470, 318], ['Seminyak', 318, 372], ['Kuta', 405, 452], ['Sanur', 676, 410], ['Nusa Dua', 520, 600], ['Uluwatu', 410, 628]];
  function map(o) {
    o = o || {};
    var pts = [], body = '', trips = o.trips || [], vb;
    trips.forEach(function (tr) { pts.push(E.PLANT); if (!o.client) E.tripOrders(tr).forEach(function (x) { if (x.st !== 'cancelled') pts.push(E.loc(x.prop)); }); });
    (o.dests || []).forEach(function (d) { pts.push(d.p); });
    (o.drivers || []).forEach(function (d) { if (d.p) pts.push(d.p.pos); });
    if (o.fit && pts.length) {
      var xs = pts.map(function (p) { return p[0]; }), ys = pts.map(function (p) { return p[1]; }), x0 = Math.min.apply(null, xs) - 70, x1 = Math.max.apply(null, xs) + 70, y0 = Math.min.apply(null, ys) - 60, y1 = Math.max.apply(null, ys) + 60;
      var w = Math.max(320, x1 - x0), h = Math.max(220, y1 - y0); if (w / h > 1.7) h = w / 1.7; else if (w / h < 1.05) w = h * 1.05;
      var cxm = (x0 + x1) / 2, cym = (y0 + y1) / 2; vb = [Math.round(cxm - w / 2), Math.round(cym - h / 2), Math.round(w), Math.round(h)];
    } else vb = [240, 60, 600, 590];
    var k = vb[2] / 600;   // keep marks the same size on zoomed maps
    body += '<rect x="-200" y="-200" width="1400" height="1100" class="m7-sea"/><path d="' + LAND + '" class="m7-land"/>';
    body += '<path d="M520 372L550 160M520 372L382 412M382 412L372 604M520 372L622 430M520 372L370 390M550 160L628 182M382 412L520 560" class="m7-road"/>';
    AREAS.forEach(function (a) { body += '<text x="' + a[1] + '" y="' + a[2] + '" class="m7-area" style="font-size:' + (13 * k).toFixed(1) + 'px">' + a[0] + '</text>'; });
    trips.forEach(function (tr) {
      if (o.client) return;
      var c = colorOf(tr), os = E.tripOrders(tr).filter(function (x) { return x.st !== 'cancelled'; }), path = [E.PLANT].concat(os.map(function (x) { return E.loc(x.prop); })).concat([E.PLANT]);
      body += '<polyline points="' + path.map(function (p) { return p.join(','); }).join(' ') + '" class="m7-rt m7-' + c + (o.focus && o.focus !== tr.id ? ' is-dim' : '') + '" style="stroke-width:' + (3.2 * k).toFixed(1) + 'px"/>';
      os.forEach(function (x, i) {
        var p = E.loc(x.prop), st = ['completed', 'atplant', 'received'].indexOf(x.st) >= 0 ? 'done' : ['ontheway', 'arrived', 'inprogress'].indexOf(x.st) >= 0 ? 'cur' : x.st === 'issue' ? 'iss' : 'next', r = 11 * k;
        var lab = o.labels !== false && (!o.focus || o.focus === tr.id);
        body += '<g class="m7-stop m7-' + st + ' m7-' + c + (o.focus && o.focus !== tr.id ? ' is-dim' : '') + '"><title>' + esc((i + 1) + '. ' + E.propName(x.prop) + ' · ' + T(E.stLabel(x)) + ' · ' + x.win.join('–')) + '</title><circle cx="' + p[0] + '" cy="' + p[1] + '" r="' + r.toFixed(1) + '"/><text x="' + p[0] + '" y="' + (p[1] + 4 * k).toFixed(1) + '" style="font-size:' + (11 * k).toFixed(1) + 'px">' + (i + 1) + '</text>' +
          (lab && o.stopLabels ? '<text x="' + (p[0] + 15 * k).toFixed(1) + '" y="' + (p[1] + 4 * k).toFixed(1) + '" class="m7-sl" style="font-size:' + (11.5 * k).toFixed(1) + 'px">' + esc(E.propName(x.prop)) + '</text>' : '') + '</g>';
      });
    });
    (o.dests || []).forEach(function (d) { var p = d.p, s = 13 * k; body += '<g class="m7-dest"><title>' + esc(d.n) + '</title><path d="M' + p[0] + ' ' + p[1] + 'l' + (-s * 0.7).toFixed(1) + ' ' + (-s * 1.5).toFixed(1) + 'a' + (s * 0.85).toFixed(1) + ' ' + (s * 0.85).toFixed(1) + ' 0 1 1 ' + (s * 1.4).toFixed(1) + ' 0z"/><circle cx="' + p[0] + '" cy="' + (p[1] - s * 1.55).toFixed(1) + '" r="' + (s * 0.33).toFixed(1) + '" class="m7-dc"/>' + (d.n ? '<text x="' + (p[0] + s).toFixed(1) + '" y="' + (p[1] - s * 1.2).toFixed(1) + '" class="m7-sl" style="font-size:' + (12 * k).toFixed(1) + 'px">' + esc(d.n) + '</text>' : '') + '</g>'; });
    var pl = E.PLANT, ps = 14 * k;
    body += '<g class="m7-plant"><title>' + esc(E.D.PLANT.n) + '</title><rect x="' + (pl[0] - ps).toFixed(1) + '" y="' + (pl[1] - ps).toFixed(1) + '" width="' + (ps * 2).toFixed(1) + '" height="' + (ps * 2).toFixed(1) + '" rx="' + (5 * k).toFixed(1) + '"/><use href="#i-factory" x="' + (pl[0] - ps * 0.62).toFixed(1) + '" y="' + (pl[1] - ps * 0.62).toFixed(1) + '" width="' + (ps * 1.24).toFixed(1) + '" height="' + (ps * 1.24).toFixed(1) + '"/>' +
      (o.plantLabel !== false ? '<text x="' + pl[0] + '" y="' + (pl[1] + ps + 13 * k).toFixed(1) + '" class="m7-pl" style="font-size:' + (11.5 * k).toFixed(1) + 'px">' + esc(E.D.PLANT.n) + '</text>' : '') + '</g>';
    (o.drivers || []).forEach(function (d) {
      if (!d.p) return;
      var p = d.p.pos, r = 17 * k, live = d.p.fresh === 'live', c = d.trip ? colorOf(d.trip) : 'c0', tag = d.href ? 'a' : 'g';
      body += '<' + tag + ' class="m7-drv m7-' + c + ' m7-s-' + d.st + (live ? '' : ' is-stale') + (o.focus && d.trip && o.focus !== d.trip.id ? ' is-dim' : '') + (o.sel === (d.trip && d.trip.id) ? ' is-sel' : '') + '"' + (d.href ? ' href="' + d.href + '"' : '') + '><title>' + esc(d.n + ' · ' + T(E.LIVE_ST[d.st] ? E.LIVE_ST[d.st][0] : '') + (live ? '' : ' · ' + T(L('lokasi terakhir', 'last known location')))) + '</title>' +
        (live && d.st === 'moving' ? '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="' + (r * 1.7).toFixed(1) + '" class="m7-pulse"/>' : '') +
        '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="' + r.toFixed(1) + '" class="m7-dot"/><use href="#i-truck" x="' + (p[0] - r * 0.6).toFixed(1) + '" y="' + (p[1] - r * 0.6).toFixed(1) + '" width="' + (r * 1.2).toFixed(1) + '" height="' + (r * 1.2).toFixed(1) + '"/>' +
        '<text x="' + p[0] + '" y="' + (p[1] - r - 6 * k).toFixed(1) + '" class="m7-dl" style="font-size:' + (12.5 * k).toFixed(1) + 'px">' + esc(d.n) + (live ? '' : ' ?') + '</text></' + tag + '>';
    });
    return '<figure class="m7' + (o.cls ? ' ' + o.cls : '') + '"><svg viewBox="' + vb.join(' ') + '" role="img" aria-label="' + esc(T(o.label || L('Peta skematik', 'Schematic map'))) + '" preserveAspectRatio="xMidYMid meet">' + body + '</svg>' +
      (o.caption !== false ? '<figcaption>' + ic('info') + t(L('Peta skematik untuk prototipe. Produksi memakai peta & GPS asli.', 'Schematic map for the prototype. Production uses a real map & GPS.')) + '</figcaption>' : '') + '</figure>';
  }
  function driverMarks(ctx, list, hrefFn) {
    return list.map(function (tr) { var p = E.canSeeLocation(ctx, tr) ? E.position(tr) : null; return { trip: tr, p: p, st: E.liveStatus(tr), n: E.first(tr.drv), href: hrefFn ? hrefFn(tr) : null }; });
  }
  function legend() { return '<ul class="lg7">' + ['moving', 'arrived', 'delayed', 'issue', 'weak', 'offline', 'ended'].map(function (k) { return '<li>' + liveC(k) + '</li>'; }).join('') + '</ul>'; }

  /* Live refresh: only the live containers redraw (never the whole screen). */
  var LIVE = [];
  function live(id, fn, sec) {
    var iv = setInterval(function () {
      var el = document.getElementById(id); if (!el) { clearInterval(iv); return; }
      try { E.tick(); el.innerHTML = fn(); } catch (e) { console.error(e); }
    }, (sec || 5) * 1000);
    LIVE.push(iv);
  }
  window.addEventListener('hashchange', function () { LIVE.forEach(clearInterval); LIVE = []; });

  /* Photo capture (downscaled on the device), signature pad, steppers, choice chips. */
  var PH = {};
  function photoIn(name, label, o) {
    o = o || {}; PH[name] = PH[name] || [];
    return '<div class="ph7" data-ph="' + name + '"><div class="ph7-l" data-thumbs="' + name + '">' + thumbs(name) + '</div><label class="ph7-add' + (o.big ? ' ph7-big' : '') + '"><input type="file" accept="' + (o.file ? 'image/*,application/pdf,.doc,.docx,.xls,.xlsx' : 'image/*') + '"' + (o.file ? '' : ' capture="environment"') + ' data-photo="' + name + '"' + (o.multi === false ? '' : ' multiple') + ' class="sr">' + ic(o.file ? 'upload' : 'camera') + '<span>' + t(label || L('Ambil Foto', 'Take Photo')) + '</span></label></div>';
  }
  function thumbs(name) { return (PH[name] || []).map(function (src, i) { return '<span class="ph7-t">' + (/^data:image/.test(src) ? '<img src="' + src + '" alt="">' : ic('file')) + '<button type="button" class="ph7-x" data-ph-x="' + name + '|' + i + '" aria-label="' + t(L('Hapus foto', 'Remove photo')) + '">' + ic('x') + '</button></span>'; }).join(''); }
  function photos(name) { return (PH[name] || []).slice(); }
  function resetPh(name) { PH[name] = []; }
  function readImg(file, cb) {
    var rd = new FileReader();
    rd.onload = function () {
      if (!/^image\//.test(file.type)) { cb(rd.result.length > 400000 ? 'file:' + file.name : rd.result); return; }
      var img = new Image();
      img.onload = function () { var m = 720, s = Math.min(1, m / Math.max(img.width, img.height)), c = document.createElement('canvas'); c.width = Math.round(img.width * s); c.height = Math.round(img.height * s); c.getContext('2d').drawImage(img, 0, 0, c.width, c.height); cb(c.toDataURL('image/jpeg', 0.7)); };
      img.onerror = function () { A.toast(L('Foto belum bisa dibaca. Coba Lagi.', 'The photo could not be read. Try Again.'), 'crit'); };
      img.src = rd.result;
    };
    rd.readAsDataURL(file);
  }
  document.addEventListener('change', function (e) {
    var el = e.target.closest && e.target.closest('[data-photo]'); if (!el) return;
    var name = el.getAttribute('data-photo'); PH[name] = PH[name] || [];
    Array.prototype.slice.call(el.files || []).slice(0, 4).forEach(function (f) { readImg(f, function (src) { PH[name].push(src); var b = document.querySelector('[data-thumbs="' + name + '"]'); if (b) b.innerHTML = thumbs(name); if (el.getAttribute('data-autosend')) { var fn = el.getAttribute('data-autosend'); if (G.onPhoto[fn]) G.onPhoto[fn](src, f); } }); });
    el.value = '';
  });
  document.addEventListener('click', function (e) {
    var x = e.target.closest && e.target.closest('[data-ph-x]');
    if (x) { var p = x.getAttribute('data-ph-x').split('|'); (PH[p[0]] || []).splice(+p[1], 1); var b = document.querySelector('[data-thumbs="' + p[0] + '"]'); if (b) b.innerHTML = thumbs(p[0]); return; }
    var s = e.target.closest && e.target.closest('[data-step]');
    if (s) { var inpEl = document.querySelector('input[name="' + s.getAttribute('data-step').split('|')[0] + '"]'); if (!inpEl) return; var d = +s.getAttribute('data-step').split('|')[1], v = Math.max(+(inpEl.getAttribute('min') || 0), Math.min(+(inpEl.getAttribute('max') || 999), (+inpEl.value || 0) + d)); inpEl.value = v; inpEl.dispatchEvent(new Event('input', { bubbles: true })); return; }
    var sc = e.target.closest && e.target.closest('[data-sig-clear]');
    if (sc) { var cv = document.getElementById(sc.getAttribute('data-sig-clear')); if (cv) { cv.getContext('2d').clearRect(0, 0, cv.width, cv.height); cv.removeAttribute('data-signed'); } }
  });
  function stepper(name, v, unit, o) {
    o = o || {};
    return '<div class="st7' + (o.big ? ' st7-b' : '') + '"><button type="button" class="st7-m" data-step="' + name + '|-1" aria-label="' + t(L('Kurangi', 'Decrease')) + '">' + ic('minus') + '</button><label class="st7-v"><input name="' + name + '" type="number" inputmode="numeric" min="' + (o.min || 0) + '" max="' + (o.max || 99) + '" value="' + esc(v) + '" aria-label="' + esc(T(o.label || name)) + '">' + (unit ? '<em>' + t(unit) + '</em>' : '') + '</label><button type="button" class="st7-p" data-step="' + name + '|1" aria-label="' + t(L('Tambah', 'Increase')) + '">' + ic('plus') + '</button></div>';
  }
  function choice(name, list, v, o) {
    o = o || {};
    return '<div class="ch7' + (o.cls ? ' ' + o.cls : '') + '" role="radiogroup">' + list.map(function (x) { return '<label class="ch7-i' + (x[3] ? ' ch7-' + x[3] : '') + '"><input type="radio" name="' + name + '" value="' + esc(x[0]) + '"' + (String(x[0]) === String(v) ? ' checked' : '') + '><span>' + (x[2] ? ic(x[2]) : '') + t(x[1]) + '</span></label>'; }).join('') + '</div>';
  }
  function sigPad(id) {
    return '<div class="sg7"><canvas id="' + id + '" width="640" height="220" aria-label="' + t(L('Area tanda tangan', 'Signature area')) + '"></canvas><span class="sg7-h">' + t(L('Tanda tangan di sini', 'Sign here')) + '</span><button type="button" class="btn btn-ghost btn-sm sg7-c" data-sig-clear="' + id + '">' + ic('refresh') + '<span>' + t(L('Ulangi', 'Reset')) + '</span></button></div>';
  }
  function sigBind(id) {
    var c = document.getElementById(id); if (!c) return;
    var g = c.getContext('2d'), down = false, last = null;
    g.lineWidth = 3.2; g.lineCap = 'round'; g.lineJoin = 'round'; g.strokeStyle = '#0B3D78';
    function pt(e) { var r = c.getBoundingClientRect(); return [(e.clientX - r.left) * c.width / r.width, (e.clientY - r.top) * c.height / r.height]; }
    c.addEventListener('pointerdown', function (e) { down = true; last = pt(e); c.setPointerCapture(e.pointerId); e.preventDefault(); });
    c.addEventListener('pointermove', function (e) { if (!down) return; var p = pt(e); g.beginPath(); g.moveTo(last[0], last[1]); g.lineTo(p[0], p[1]); g.stroke(); last = p; c.setAttribute('data-signed', '1'); });
    ['pointerup', 'pointercancel', 'pointerleave'].forEach(function (k) { c.addEventListener(k, function () { down = false; }); });
  }
  function sigVal(id) { var c = document.getElementById(id); return c && c.getAttribute('data-signed') ? c.toDataURL('image/png') : null; }
  // Seeded evidence uses drawn placeholders; captured evidence keeps the real image.
  var SEED_IMG = {
    bags: '<rect width="160" height="110" fill="#EAF4FC"/><path d="M28 92c-4-30 8-48 26-50 18 2 30 20 26 50z" fill="#fff" stroke="#9DB8D6" stroke-width="3"/><path d="M78 94c-4-34 10-54 30-56 20 2 34 22 30 56z" fill="#fff" stroke="#9DB8D6" stroke-width="3"/><path d="M46 42c2-8 14-8 16 0M98 38c2-8 16-8 18 0" stroke="#9DB8D6" stroke-width="3" fill="none"/>',
    stain: '<rect width="160" height="110" fill="#F6F1E7"/><rect x="22" y="20" width="116" height="70" rx="6" fill="#fff" stroke="#D8C9A8" stroke-width="3"/><ellipse cx="70" cy="52" rx="16" ry="10" fill="#E8C77A" opacity=".7"/><ellipse cx="102" cy="64" rx="10" ry="7" fill="#E8C77A" opacity=".6"/>',
    wet: '<rect width="160" height="110" fill="#E3F3FB"/><path d="M40 92c-4-30 10-50 40-52 30 2 44 22 40 52z" fill="#fff" stroke="#7FB9DE" stroke-width="3"/><path d="M68 64q4-8 8 0a4 4 0 0 1-8 0zM88 74q4-8 8 0a4 4 0 0 1-8 0z" fill="#3BA3DD"/>',
    pod: '<rect width="160" height="110" fill="#EEF6EF"/><rect x="40" y="34" width="80" height="58" rx="6" fill="#fff" stroke="#9CCBA8" stroke-width="3"/><path d="M62 62l12 12 24-24" stroke="#1E8E4E" stroke-width="5" fill="none" stroke-linecap="round"/>'
  };
  function img(src, alt) {
    if (!src) return '';
    if (/^seed:/.test(src)) { var k = src.slice(5); return '<svg class="im7" viewBox="0 0 160 110" role="img" aria-label="' + esc(alt || k) + '">' + (SEED_IMG[k] || SEED_IMG.bags) + '</svg>'; }
    if (/^data:image/.test(src)) return '<img class="im7" src="' + src + '" alt="' + esc(alt || '') + '">';
    return '<span class="im7 im7-f">' + ic('file') + '<small>' + esc(String(src).replace(/^file:/, '').slice(0, 40)) + '</small></span>';
  }

  /* Assign dialog (§15, §21): driver + vehicle with the capacity check before saving. */
  function assignDlg(ordId, preDrv) {
    var o = E.order(ordId), t0 = E.tripOf(o);
    var drvs = E.drivers(cx()), vs = E.vehicles();
    var dOpt = drvs.map(function (d) { return [d.d.id, [d.d.n + ' · ' + T(E.AVAIL[d.avail][0]) + (d.veh ? ' · ' + d.veh : ''), d.d.n + ' · ' + E.AVAIL[d.avail][0][1] + (d.veh ? ' · ' + d.veh : '')]]; });
    var dv = preDrv || (t0 ? t0.drv : o.prefDrv) || drvs.filter(function (d) { return d.avail === 'available'; }).map(function (d) { return d.d.id; })[0] || drvs[0].d.id;
    function vehFor(d) { var cur = drvs.filter(function (x) { return x.d.id === d; })[0]; return cur && cur.veh ? cur.veh : (o.prefVeh && E.vehicle(o.prefVeh).maint !== 'repair' ? o.prefVeh : vs.filter(function (v) { return !v.trip && v.v.maint !== 'repair'; }).map(function (v) { return v.v.id; })[0]); }
    var vOpt = vs.map(function (v) { return [v.v.id, [v.v.id + ' · ' + v.v.plate + ' · ' + v.v.cap.bags + ' bag' + (v.v.maint === 'repair' ? ' · perawatan' : v.drv ? ' · ' + E.first(v.drv) : ''), v.v.id + ' · ' + v.v.plate + ' · ' + v.v.cap.bags + ' bags' + (v.v.maint === 'repair' ? ' · maintenance' : v.drv ? ' · ' + E.first(v.drv) : '')]]; });
    var rOpt = [['', L('Rute driver / otomatis', 'Driver route / automatic')]].concat(E.routes().map(function (r) { return [r.id, [r.id + ' · ' + r.n, r.id + ' · ' + r.n]]; }));
    function check(el) {
      var v = vals(el), c = E.checkAssign(ordId, v.drv, v.veh), box = el.querySelector('#as7-c');
      box.innerHTML = (c.blocks.length ? c.blocks.map(function (b) { return '<li class="cv7-b">' + ic('xc') + t(b[1]) + '</li>'; }).join('') : '') + (c.warns.length ? c.warns.map(function (w) { return '<li class="cv7-w">' + ic('alert') + t(w[1]) + '</li>'; }).join('') : '') +
        (!c.blocks.length && !c.warns.length ? '<li class="cv7-ok">' + ic('checkc') + t(L('Kapasitas, shift dan jadwal aman.', 'Capacity, shift and schedule are fine.')) + '</li>' : '');
      el.querySelector('#as7-r').hidden = !c.warns.length && !(t0 && t0.drv !== v.drv);
    }
    dlg({ title: t0 ? L('Pindahkan / ubah penugasan', 'Reassign') : L('Tugaskan driver & kendaraan', 'Assign driver & vehicle'), sub: '<b>' + esc(o.id) + '</b> · ' + pname(o.prop) + ' · ' + esc(o.win.join('–')) + ' · ' + o.bags + ' bag', icon: 'user',
      body: '<div class="f6-g">' + fld(L('Driver', 'Driver'), sel('drv', dOpt, dv), { req: true }) + fld(L('Kendaraan', 'Vehicle'), sel('veh', vOpt, vehFor(dv)), { req: true }) + fld(L('Rute', 'Route'), sel('route', rOpt, o.prefRoute || '')) + '</div>' +
        '<ul class="cv7" id="as7-c" aria-live="polite"></ul><div id="as7-r" hidden>' + fld(L('Alasan (wajib bila ada peringatan atau pindah driver)', 'Reason (required with warnings or a driver change)'), inp('reason', ''), { req: true, wide: true }) + '</div>',
      ok: L('Tugaskan', 'Assign'),
      after: function (el) { check(el); el.querySelector('[name=drv]').addEventListener('change', function () { var vv = vehFor(this.value); if (vv) el.querySelector('[name=veh]').value = vv; check(el); }); el.querySelector('[name=veh]').addEventListener('change', function () { check(el); }); },
      onOk: function (v) { var r = E.assign(cx(), ordId, v.drv, v.veh, { force: true, reason: v.reason, route: v.route || null }); if (!r.ok) return r.msg; after(L(o.id + ' ditugaskan ke ' + E.first(v.drv) + ' · ' + r.trip.veh + '.', o.id + ' assigned to ' + E.first(v.drv) + ' · ' + r.trip.veh + '.')); return true; } });
  }
  function reschedDlg(ordId, issId) {
    var o = E.order(ordId);
    dlg({ title: L('Jadwalkan ulang', 'Reschedule'), sub: '<b>' + esc(o.id) + '</b> · ' + pname(o.prop), icon: 'calendar',
      body: '<div class="f6-g">' + fld(L('Tanggal', 'Date'), inp('date', o.date < E.TODAY ? E.TODAY : o.date, { type: 'date' }), { req: true }) + fld(L('Jam mulai', 'From'), inp('w0', o.win[0], { type: 'time' }), { req: true }) + fld(L('Jam selesai', 'To'), inp('w1', o.win[1], { type: 'time' }), { req: true }) + '</div>' + fld(L('Alasan', 'Reason'), inp('reason', ''), { req: true, wide: true, hint: t(L('Klien menerima notifikasi jadwal baru.', 'The client receives a new-schedule notification.')) }),
      onOk: function (v) { var r = issId ? E.decide(cx(), issId, 'reschedule', { note: v.reason, date: v.date, win: [v.w0, v.w1] }) : E.reschedule(cx(), ordId, v.date, [v.w0, v.w1], v.reason); if (!r.ok) return r.msg; after(L('Jadwal baru tersimpan, klien diberi tahu.', 'New schedule saved, client notified.')); return true; } });
  }
  function priDlg(ordId) {
    var o = E.order(ordId);
    dlg({ title: L('Ubah prioritas', 'Prioritise'), sub: '<b>' + esc(o.id) + '</b> · ' + pname(o.prop), icon: 'zap',
      body: fld(L('Prioritas', 'Priority'), choice('pri', opts(E.PRI).map(function (x) { return [x[0], x[1]]; }), o.pri), { wide: true }) + fld(L('Alasan', 'Reason'), inp('reason', ''), { req: true, wide: true }),
      onOk: function (v, el) { v = vals(el); var r = E.prioritize(cx(), ordId, v.pri, v.reason); if (!r.ok) return r.msg; after(L('Prioritas diubah.', 'Priority changed.')); return true; } });
  }
  function cancelDlg(ordId) {
    var o = E.order(ordId);
    dlg({ title: L('Batalkan order', 'Cancel order'), sub: '<b>' + esc(o.id) + '</b> · ' + pname(o.prop), icon: 'xc', ok: L('Batalkan Order', 'Cancel Order'),
      body: fld(L('Alasan pembatalan', 'Cancellation reason'), area('reason', '', L('Contoh: klien membatalkan lewat telepon', 'Example: the client cancelled by phone')), { req: true, wide: true }),
      onOk: function (v) { var r = E.setStatus(cx(), ordId, 'cancelled', { reason: v.reason }); if (!r.ok) return r.msg; after(L('Order dibatalkan.', 'Order cancelled.')); return true; } });
  }
  var ACT = {
    assign: function (el) { assignDlg(el.getAttribute('data-val')); },
    ready: function (el) { var r = E.markReady(cx(), el.getAttribute('data-val')); if (!r.ok) return fail(r); after(L('Order siap berangkat.', 'Order ready to go.')); },
    resched: function (el) { reschedDlg(el.getAttribute('data-val')); },
    pri: function (el) { priDlg(el.getAttribute('data-val')); },
    cancel: function (el) { cancelDlg(el.getAttribute('data-val')); },
    submitDraft: function (el) { var r = E.submitDraft(cx(), el.getAttribute('data-val')); if (!r.ok) return fail(r); after(L('Draft dikirim sebagai request.', 'Draft sent as a request.')); }
  };
  function acts(extra) { return Object.assign({}, ACT, extra || {}); }

  G = {
    cx: cx, stC: stC, priC: priC, kindC: kindC, sevC: sevC, liveC: liveC, tripC: tripC, mfC: mfC, hm: hm, dts: dts, day: day, when: when, agoS: agoS, minT: minT, pname: pname, cname: cname, emp: emp, ordLink: ordLink, mob: mob,
    after: after, fail: fail, vals: vals, opts: opts, av: av, reach: reach, navUrl: navUrl, contactOf: contactOf, instr: instr, etaBox: etaBox, freshC: freshC, trackBanner: trackBanner, map: map, driverMarks: driverMarks, legend: legend,
    live: live, photoIn: photoIn, photos: photos, resetPh: resetPh, stepper: stepper, choice: choice, sigPad: sigPad, sigBind: sigBind, sigVal: sigVal, img: img, assignDlg: assignDlg, reschedDlg: reschedDlg, acts: acts, colorOf: colorOf, onPhoto: {}, tone: tone
  };
  A.P7 = G;

  /* ================= NP-01 · ORDER-001 Order List ================= */
  var TABS = [['', L('Semua', 'All'), 'list'], ['pickup', L('Pickup', 'Pickup'), 'basket'], ['delivery', L('Delivery', 'Delivery'), 'package'], ['ondemand', L('On Demand', 'On Demand'), 'zap'], ['scheduled', L('Terjadwal', 'Scheduled'), 'calendar']];
  V['ORDER-001'] = {
    title: function () { return A.ctx() && A.ctx().client ? L('Pickup & Delivery Saya', 'My Pickups & Deliveries') : null; },
    render: function (c) {
      var c0 = cx(), q = c.q, isC = E.isClient(c0), tab = q.tab || '';
      var f = { q: q.q, st: q.st, pri: q.pri, src: tab === 'ondemand' || tab === 'scheduled' ? tab : q.src, kind: tab === 'pickup' || tab === 'delivery' ? tab : q.kind, date: q.date === 'all' ? null : q.date || null };
      var all = E.orders(c0, {}), list = E.orders(c0, f);
      if (isC) {
        var mine = all.filter(function (o) { return o.date >= E.TODAY || ['completed', 'atplant', 'received', 'cancelled'].indexOf(o.st) < 0; });
        return A.pageHead(null, t(L('Status pickup dan delivery untuk property Anda.', 'Pickup and delivery status for your properties.')), A.pbtn('lg.order.create', 'primary', L('Minta Pickup', 'Request Pickup'), 'plus', { go: 'ORDER-002' })) +
          (mine.length ? '<div class="oc7l">' + mine.map(function (o) { var tr = E.tripOf(o), act = ['ontheway', 'arrived', 'inprogress'].indexOf(o.st) >= 0;
            return '<a class="oc7' + (act ? ' is-act' : '') + '" href="' + href(act ? 'TRACK-003' : 'ORDER-003', o.id) + '"><span class="oc7-h">' + kindC(o.kind) + stC(o) + '</span><b>' + pname(o.prop) + '</b><span class="sub5">' + esc(day(o.date)) + ' · ' + esc(o.win.join('–')) + ' · ' + o.bags + ' bag · <span class="mono6">' + esc(o.id) + '</span></span>' +
              (tr && ['assigned', 'ready', 'ontheway', 'arrived', 'inprogress'].indexOf(o.st) >= 0 ? '<span class="oc7-d">' + ic('user') + t(L('Driver: ', 'Driver: ')) + esc(E.first(tr.drv)) + (o.st === 'ontheway' ? ' · ETA ' + hm((E.eta(o) || {}).at) : '') + '</span>' : '') + (act ? '<span class="oc7-go">' + ic('pin') + t(L('Lacak', 'Track')) + '</span>' : '') + '</a>'; }).join('') + '</div>'
            : A.stateCard('empty', L('Belum ada pickup atau delivery. Tekan Minta Pickup untuk membuat permintaan.', 'No pickup or delivery yet. Tap Request Pickup to create one.'), A.pbtn('lg.order.create', 'primary', L('Minta Pickup', 'Request Pickup'), 'plus', { go: 'ORDER-002' })));
      }
      var today = all.filter(function (o) { return o.date === E.TODAY; }), un = today.filter(function (o) { return E.laneOf(o) === 'unassigned'; });
      var head = A.pageHead(null, t(L('Semua permintaan pickup & delivery: terjadwal, on demand, manual, dari kontrak dan aplikasi klien.', 'Every pickup & delivery request: scheduled, on demand, manual, contract and client app.')),
        A.pbtn('lg.dispatch', 'ghost', L('Dispatch Board', 'Dispatch Board'), 'columns', { go: 'DISPATCH-001' }) + A.pbtn('lg.order.create', 'primary', L('Buat Order', 'Create Order'), 'plus', { go: 'ORDER-002' }));
      var strip = tiles([
        tile({ k: L('Order hari ini', 'Today\'s orders'), v: today.length, s: today.filter(function (o) { return o.kind === 'pickup'; }).length + ' pickup · ' + today.filter(function (o) { return o.kind === 'delivery'; }).length + ' delivery' }),
        tile({ k: L('Terjadwal', 'Scheduled'), v: today.filter(function (o) { return o.src === 'scheduled'; }).length, s: t(L('dari jadwal rutin', 'from recurring schedules')), href: open('SCHEDULE-001') ? href('SCHEDULE-001') : null }),
        tile({ k: L('Urgent / Express', 'Urgent / Express'), v: today.filter(function (o) { return E.priRank(o.pri) >= 3 && ['completed', 'atplant', 'received', 'cancelled'].indexOf(o.st) < 0; }).length, s: t(L('masih berjalan', 'still open')), tone: 'warn' }),
        tile({ k: L('Menunggu ditugaskan', 'Waiting for assignment'), v: un.length, s: t(L('ke dispatch', 'to dispatch')), tone: un.length ? 'crit' : '', href: open('DISPATCH-001') ? href('DISPATCH-001') : null })
      ], 'tls5-4');
      var fb = A.filters([
        { k: 'st', l: 'Status', opts: Object.keys(E.ST).map(function (k) { return [k, E.ST[k][0]]; }) }, { k: 'pri', l: L('Prioritas', 'Priority'), opts: opts(E.PRI) },
        { k: 'src', l: L('Sumber', 'Source'), opts: opts(E.SRC) }, { k: 'date', l: L('Tanggal', 'Date'), opts: [[E.TODAY, L('Hari ini', 'Today')], [E.addDays(E.TODAY, 1), L('Besok', 'Tomorrow')]] }
      ], { search: L('Cari order, klien atau property', 'Search order, client or property'), force: true });
      var tbl = A.list(list, [
        { h: L('No. Order', 'Order No.'), v: function (o) { return '<b class="mono6">' + esc(o.id) + '</b>' + (o.dupOf ? ' ' + A.chip('warn', L('Ganda?', 'Duplicate?')) : ''); } },
        { h: L('Klien · Property', 'Client · Property'), v: function (o) { return '<b>' + cname(o.cl) + '</b><small class="sub5">' + pname(o.prop) + '</small>'; } },
        { h: L('Jenis · Layanan', 'Type · Service'), v: function (o) { return kindC(o.kind) + '<small class="sub5">' + esc(E.svcName(o.svc)) + '</small>'; } },
        { h: L('Tanggal · Jam', 'Date · Time'), cls: 'num', v: function (o) { return esc(day(o.date)) + '<small class="sub5">' + esc(o.win.join('–')) + '</small>'; } },
        { h: L('Prioritas', 'Priority'), v: function (o) { return priC(o.pri); } },
        { h: 'Status', v: function (o) { return stC(o); } },
        { h: L('Driver', 'Driver'), v: function (o) { var tr = E.tripOf(o); return tr ? esc(E.first(tr.drv)) + '<small class="sub5">' + esc(tr.veh) + '</small>' : '<span class="t6-mute">—</span>'; } },
        { h: L('Sumber', 'Source'), v: function (o) { return t(E.SRC[o.src]); } }
      ], function (o) { return { t: esc(E.propName(o.prop)), r: esc(o.win[0]), s: esc(o.id) + ' · ' + t(E.KIND[o.kind]) + ' · ' + esc(day(o.date)) + (E.tripOf(o) ? ' · ' + esc(E.first(E.tripOf(o).drv)) : ''), chip: stC(o) + ' ' + (o.pri !== 'normal' ? priC(o.pri) : '') }; },
        function (o) { return href('ORDER-003', o.id); }, { empty: L('Tidak ada order yang cocok dengan filter.', 'No order matches the filter.') });
      return head + strip + tabs(TABS.map(function (x) { return [x[0], x[1], x[2], x[0] ? all.filter(function (o) { return o.kind === x[0] || o.src === x[0]; }).length : all.length]; }), tab, 'tab', { def: '' }) + fb + card(L('Order', 'Orders'), tbl, { icon: 'list', count: list.length });
    }
  };

  /* ================= NP-01 · ORDER-002 Create Order / Request Pickup ================= */
  var WIN_PRESET = [['07:00', '08:00'], ['09:00', '10:00'], ['10:00', '11:00'], ['13:00', '14:00'], ['16:00', '17:00']];
  function propChoices(c0) {
    var props = CM.state().props.filter(function (p) { return p.status === 'active' && (!c0.client || p.cl === c0.client); });
    var groups = {}; props.forEach(function (p) { (groups[p.cl] = groups[p.cl] || []).push(p); });
    return Object.keys(groups).map(function (cl) { return '<optgroup label="' + esc(E.clientName(cl)) + '">' + groups[cl].map(function (p) { return '<option value="' + p.id + '">' + esc(p.n) + '</option>'; }).join('') + '</optgroup>'; }).join('');
  }
  function contactOpts(prop) { var p = E.prop(prop); if (!p) return ''; return CM.state().contacts.filter(function (c) { return c.cl === p.cl && (c.scope === 'all' || (c.props || []).indexOf(prop) >= 0) && c.status !== 'inactive'; }).map(function (c) { return '<option value="' + c.id + '"' + (c.id === p.pick ? ' selected' : '') + '>' + esc(c.n) + ' · ' + esc(T(c.pos)) + '</option>'; }).join(''); }
  function slaPreview(v) {
    var p = E.prop(v.prop); if (!p || !v.svc) return '';
    var s = CM.slaFor({ cl: p.cl, prop: p.id, svc: v.svc, pri: v.pri === 'express' || v.pri === 'superexpress' ? 'express' : null });
    return '<span class="sl7">' + ic('clock') + '<b>SLA ' + s.tat + ' ' + t(L('jam', 'h')) + '</b><small>' + esc(T(s.rule.n)) + '</small></span>';
  }
  function dupPreview(v) {
    if (!v.prop || !v.date || !v.w0 || !v.w1) return '';
    var d = E.duplicates({ prop: v.prop, kind: v.kind || 'pickup', date: v.date, win: [v.w0, v.w1] });
    if (!d.length) return '';
    return '<div class="dp7" role="alert">' + ic('alert') + '<div><b>' + t(E.MSG.dup) + '</b>' + d.map(function (x) { return '<span>' + ordLink(x.o.id) + ' · ' + esc(x.o.win.join('–')) + ' · ' + t(E.stLabel(x.o)) + (x.same.svc ? ' · ' + t(L('layanan sama', 'same service')) : '') + '</span>'; }).join('') + '</div></div>';
  }
  V['ORDER-002'] = {
    title: function () { return A.ctx() && A.ctx().client ? L('Minta Pickup', 'Request Pickup') : null; },
    render: function (c) {
      var c0 = cx(), isC = E.isClient(c0), q = c.q;
      var props = CM.state().props.filter(function (p) { return p.status === 'active' && (!c0.client || p.cl === c0.client); });
      if (!props.length) return A.stateCard('empty', L('Belum ada property aktif.', 'No active property yet.'));
      var p0 = q.prop && props.some(function (p) { return p.id === q.prop; }) ? q.prop : props[0].id, now = E.hm(E.now()), date = now > '15:00' ? E.addDays(E.TODAY, 1) : E.TODAY;
      var svcs = CM.services().filter(function (s) { return s.status !== 'inactive'; }).map(function (s) { return [s.id, s.n]; });
      return A.pageHead(null, isC ? t(L('Pilih property, jam dan perkiraan jumlah bag. Tim kami akan menugaskan driver.', 'Choose the property, time and estimated bags. Our team will assign a driver.')) : t(L('Order dicek terhadap order ganda (property, tanggal, jam, jenis) sebelum disimpan.', 'Orders are checked for duplicates (property, date, time, type) before saving.'))) +
        '<form class="card f6" id="f7" onsubmit="return false">' +
        '<h2 class="h5">' + ic('hotel') + t(L('Lokasi', 'Location')) + '</h2><div class="f6-g">' +
        fld(isC ? 'Property' : L('Klien · Property', 'Client · Property'), '<select name="prop">' + propChoices(c0).replace('value="' + p0 + '"', 'value="' + p0 + '" selected') + '</select>', { req: true }) +
        fld(L('Kontak PIC', 'Contact PIC'), '<select name="ct" id="f7-ct">' + contactOpts(p0) + '</select>') + '</div>' +
        '<h2 class="h5">' + ic('calendar') + t(L('Waktu', 'Time')) + '</h2>' +
        (isC ? '<input type="hidden" name="kind" value="pickup">' : fld(L('Jenis', 'Type'), choice('kind', [['pickup', L('Pickup', 'Pickup'), 'basket'], ['delivery', L('Delivery', 'Delivery'), 'package']], 'pickup'), { wide: true })) +
        '<div class="f6-g">' + fld(L('Tanggal', 'Date'), inp('date', date, { type: 'date' }), { req: true }) + '<div class="f5"><span>' + t(L('Jendela waktu', 'Time window')) + ' <i>*</i></span><div class="tw7">' + inp('w0', '09:00', { type: 'time' }) + '<span>–</span>' + inp('w1', '10:00', { type: 'time' }) + '</div>' +
        '<div class="tw7-p">' + WIN_PRESET.map(function (w) { return '<button type="button" class="tw7-b" data-win="' + w.join('|') + '">' + w.join('–') + '</button>'; }).join('') + '</div></div></div>' +
        '<h2 class="h5">' + ic('package') + t(L('Cucian', 'Laundry')) + '</h2><div class="f6-g">' +
        fld(L('Layanan', 'Service'), sel('svc', svcs, 'SV-006'), { req: true }) + fld(L('Kategori', 'Category'), sel('cat', opts(E.CAT), 'linen')) +
        fld(L('Perkiraan jumlah bag', 'Estimated bags'), stepper('bags', 4, L('bag', 'bags'), { min: 1, max: 99, label: L('Perkiraan jumlah bag', 'Estimated bags') }), { req: true }) + fld(L('Perkiraan berat (kg)', 'Estimated weight (kg)'), inp('kg', '', { num: true, ph: L('opsional', 'optional') })) + '</div>' +
        fld(L('Prioritas', 'Priority'), choice('pri', opts(E.PRI).filter(function (x) { return !isC || x[0] !== 'superexpress'; }).map(function (x) { return [x[0], x[1]]; }), 'normal'), { wide: true }) +
        '<div id="f7-sla" class="f7-sla">' + slaPreview({ prop: p0, svc: 'SV-006', pri: 'normal' }) + '</div>' +
        (isC ? '' : fld(L('Sumber', 'Source'), sel('src', opts(E.SRC).filter(function (x) { return ['manual', 'ondemand', 'contract', 'walkin'].indexOf(x[0]) >= 0; }), 'manual'))) +
        fld(L('Instruksi khusus', 'Special instructions'), area('instr', '', L('Contoh: ambil di Loading Dock B', 'Example: collect at Loading Dock B')), { wide: true }) +
        '<div id="f7-dup"></div><p class="dlg5-e" role="alert" id="f7-e"></p><div class="f6-a">' + A.backBtn('ghost') + (isC ? '' : A.btn('ghost', L('Simpan Draft', 'Save Draft'), 'edit', { act: 'draft' })) +
        A.btn('primary', isC ? L('Kirim Permintaan', 'Send Request') : L('Buat Order', 'Create Order'), 'check', { act: 'save' }) + '</div></form>';
    },
    after: function () {
      var f = document.getElementById('f7'); if (!f) return;
      function upd() { var v = vals(f); document.getElementById('f7-sla').innerHTML = slaPreview(v); document.getElementById('f7-dup').innerHTML = dupPreview(v); }
      f.querySelector('[name=prop]').addEventListener('change', function () { document.getElementById('f7-ct').innerHTML = contactOpts(this.value); upd(); });
      f.addEventListener('change', upd); f.addEventListener('input', function (e) { if (e.target.name === 'w0' || e.target.name === 'w1') upd(); });
      f.querySelectorAll('[data-win]').forEach(function (b) { b.addEventListener('click', function () { var w = b.getAttribute('data-win').split('|'); f.querySelector('[name=w0]').value = w[0]; f.querySelector('[name=w1]').value = w[1]; upd(); }); });
      upd();
    },
    act: {
      save: function (el) { submitOrder(false); }, draft: function () { submitOrder(true); }
    }
  };
  function submitOrder(draft, force, reason) {
    var f = document.getElementById('f7'), v = vals(f), c0 = cx();
    var d = { prop: v.prop, ct: v.ct || null, kind: v.kind || 'pickup', date: v.date, win: [v.w0, v.w1], svc: v.svc, cat: v.cat, bags: num(v.bags), kg: v.kg, pri: v.pri || 'normal', src: v.src, instr: v.instr, draft: draft };
    var r = E.createOrder(c0, d, { force: force, reason: reason });
    if (!r.ok && r.code === 'dup') {
      dlg({ title: L('Kemungkinan order ganda', 'Possible duplicate order'), icon: 'alert', ok: L('Tetap Buat Order', 'Create Anyway'),
        sub: t(L('Sudah ada order untuk property, tanggal dan jam yang sama:', 'There is already an order for the same property, date and time:')),
        body: '<ul class="cv7">' + r.dup.map(function (x) { return '<li class="cv7-w">' + ic('file') + '<span><b class="mono6">' + esc(x.o.id) + '</b> · ' + esc(E.propName(x.o.prop)) + ' · ' + esc(x.o.win.join('–')) + ' · ' + t(E.stLabel(x.o)) + ' · ' + t(E.SRC[x.o.src]) + '</span></li>'; }).join('') + '</ul>' +
          fld(L('Alasan order tambahan', 'Reason for the extra order'), inp('reason', ''), { req: true, wide: true }),
        onOk: function (vv) { if (!vv.reason) return E.MSG.reason; submitOrder(draft, true, vv.reason); return true; } });
      return;
    }
    if (!r.ok) { document.getElementById('f7-e').textContent = T(r.msg); return; }
    var o = r.order;
    A.success(E.isClient(c0) ? L('Permintaan pickup terkirim.', 'Pickup request sent.') : draft ? L('Draft order tersimpan.', 'Order draft saved.') : L('Order dibuat.', 'Order created.'),
      { l: L('Lihat Order', 'View Order'), go: 'ORDER-003', rec: o.id, icon: 'file' }, open('DISPATCH-001') && !draft ? { l: L('Ke Dispatch Board', 'To Dispatch Board'), go: 'DISPATCH-001' } : null,
      '<span class="mono6">' + esc(o.id) + '</span> · ' + pname(o.prop) + ' · ' + esc(day(o.date)) + ' ' + esc(o.win.join('–')) + (o.slaTat ? ' · SLA ' + o.slaTat + ' ' + t(L('jam', 'h')) : ''));
  }

  /* ================= NP-01 · ORDER-003 Order Detail ================= */
  function flowOf(o) { return o.kind === 'pickup' ? ['requested', 'assigned', 'ready', 'ontheway', 'arrived', 'inprogress', 'completed', 'atplant', 'received'] : ['requested', 'assigned', 'ready', 'ontheway', 'arrived', 'inprogress', 'completed']; }
  function lifecycle(o) {
    var fl = flowOf(o), cur = o.st === 'issue' ? o.prevSt : o.st === 'scheduled' || o.st === 'draft' ? 'requested' : o.st, i0 = fl.indexOf(cur);
    return '<ol class="stp6 stp7">' + fl.map(function (s, i) {
      var cls = o.st === 'cancelled' ? '' : i < i0 ? 'done' : i === i0 ? (o.st === 'issue' ? 'now stp6-x' : 'now') : '';
      return '<li class="' + cls + '"><span class="stp6-n">' + (i < i0 && o.st !== 'cancelled' ? ic('check') : i === i0 && o.st === 'issue' ? ic('alert') : i + 1) + '</span><span>' + t(E.stLabel(o, s)) + '</span></li>';
    }).join('') + '</ol>';
  }
  function evRow(e) {
    var k = E.EV_KIND[e.kind] || [L(e.kind, e.kind), 'file'], d = e.data;
    var txt = d == null ? '' : typeof d === 'string' ? (E.COND[d] ? T(E.COND[d][0]) : /^issue:/.test(d) ? d.slice(6) : d === 'nosign' ? T(L('Foto bukti tanpa tanda tangan', 'Photo without signature')) : E.D.PHOTOS[d] ? '' : d)
      : d.bags != null ? d.bags + ' bag' + (d.cont ? ' + ' + d.cont + ' container' : '') + (d.kg ? ' · ' + d.kg + ' kg' : '') + (d.pkg ? ' · ' + d.pkg + ' paket' : '')
        : d.nosign ? T(L('Tanpa tanda tangan: ', 'No signature: ')) + d.reason : d.pos ? T(L('Lokasi tercatat', 'Location recorded')) + (d.fresh && d.fresh !== 'live' ? ' (' + T(L('sinyal lemah', 'weak signal')) + ')' : '') : d.noLoc ? T(L('Lokasi tidak diizinkan', 'Location not permitted')) : d.n ? T(d.n) : '';
    return '<li class="ev7' + (e.superseded ? ' is-old' : '') + (e.amends ? ' is-amend' : '') + '"><span class="ev7-t num">' + esc(String(e.at).slice(11, 16)) + '</span><span class="ev7-ic">' + ic(k[1]) + '</span><div><b>' + t(e.amends ? L('Koreksi: ', 'Amended: ') : '') + t(k[0]) + '</b>' + (txt ? ' · ' + esc(txt) : '') + '<small>' + emp(e.by) + (e.src ? ' · ' + t(L('dari chat', 'from chat')) : '') + (e.superseded ? ' · ' + t(L('dikoreksi', 'corrected')) : '') + (e.reason ? ' · ' + t(L('alasan: ', 'reason: ')) + esc(T(e.reason)) : '') + '</small>' +
      (e.img && (e.kind === 'photo' || e.kind === 'sign') ? '<span class="ev7-im">' + img(e.img, T(k[0])) + '</span>' : '') + '</div>' + (can('lg.evidence.amend') && !e.superseded && ['done', 'arrive'].indexOf(e.kind) < 0 ? '<button type="button" class="btn btn-ghost btn-sm" data-act="amend" data-val="' + e.id + '">' + ic('edit') + '<span>' + t(L('Koreksi', 'Correct')) + '</span></button>' : '') + '</li>';
  }
  function evList(list) { return list && list.length ? '<ol class="ev7l">' + list.map(evRow).join('') + '</ol>' : A.empty(L('Belum ada bukti.', 'No evidence yet.')); }
  function amendDlg(evId) {
    var e = E.state().evidence.filter(function (x) { return x.id === evId; })[0]; if (!e) return;
    var cur = typeof e.data === 'string' ? e.data : JSON.stringify(e.data);
    dlg({ title: L('Koreksi bukti', 'Correct evidence'), icon: 'edit', sub: t(L('Bukti asli tidak diubah. Koreksi disimpan sebagai catatan baru dengan alasan, user dan waktu.', 'The original is not changed. The correction is a new record with reason, user and time.')),
      body: fld(L('Nilai sebelumnya', 'Previous value'), inp('old', cur, { ro: true }), { wide: true }) + fld(L('Nilai yang benar', 'Correct value'), inp('val', e.kind === 'bags' && e.data ? e.data.bags : cur), { req: true, wide: true }) + fld(L('Alasan koreksi', 'Reason'), inp('reason', ''), { req: true, wide: true }),
      onOk: function (v) { var data = e.kind === 'bags' && e.data ? Object.assign({}, e.data, { bags: num(v.val) }) : v.val; var r = E.amendEvidence(cx(), evId, data, v.reason); if (!r.ok) return r.msg; after(L('Koreksi bukti tersimpan sebagai catatan baru.', 'Correction saved as a new record.')); return true; } });
  }
  G.evList = evList; G.amendDlg = amendDlg; G.lifecycle = lifecycle;
  V['ORDER-003'] = {
    render: function (c) {
      var c0 = cx(), o = E.order(c.rec);
      if (!o) return A.stateCard('empty', L('Order tidak ditemukan.', 'Order not found.'), A.backBtn('blue'));
      if (!E.canSeeOrder(c0, o)) return A.stateCard('noperm', E.MSG.scope, A.backBtn('blue'));
      var isC = E.isClient(c0), tr = E.tripOf(o), p = E.prop(o.prop) || {}, ct = contactOf(o), mf = E.mfOf(o.id), sl = E.sla(o), active = ['ontheway', 'arrived', 'inprogress'].indexOf(o.st) >= 0;
      var b = [];
      if (!isC) {
        if (o.st === 'draft') b.push(A.pbtn('lg.order.create', 'primary', L('Kirim Request', 'Send Request'), 'check', { act: 'submitDraft', val: o.id }));
        if (['requested', 'scheduled', 'assigned', 'ready'].indexOf(o.st) >= 0 && can('lg.dispatch')) b.push(A.btn(o.trip ? 'ghost' : 'primary', o.trip ? L('Pindah Driver', 'Reassign') : L('Tugaskan', 'Assign'), 'user', { act: 'assign', val: o.id }));
        if (o.st === 'assigned' && o.trip && can('lg.dispatch')) b.push(A.btn('ghost', L('Tandai Siap', 'Mark Ready'), 'check', { act: 'ready', val: o.id }));
        if (['draft', 'requested', 'scheduled', 'assigned', 'ready'].indexOf(o.st) >= 0 && can('lg.order.edit')) b.push(A.btn('ghost', L('Jadwal Ulang', 'Reschedule'), 'calendar', { act: 'resched', val: o.id }), A.btn('ghost', L('Prioritas', 'Priority'), 'zap', { act: 'pri', val: o.id }), A.btn('ghost', L('Batalkan', 'Cancel'), 'xc', { act: 'cancel', val: o.id }));
        if (active && tr && open('TRACK-002')) b.push(A.btn('ghost', L('Lacak Live', 'Live Tracking'), 'pin', { go: 'TRACK-002', rec: tr.id }));
      } else if (active || ['assigned', 'ready'].indexOf(o.st) >= 0) b.push(A.btn('primary', L('Lacak Driver', 'Track Driver'), 'pin', { go: 'TRACK-003', rec: o.id }));
      if (E.canChat(c0, o) && open('CHAT-001')) b.push(A.btn('ghost', 'Chat', 'message', { go: 'CHAT-001', rec: o.id }));
      if (!isC && can('lg.issue.report') && ['completed', 'atplant', 'received', 'cancelled'].indexOf(o.st) < 0) b.push(A.btn('ghost', L('Ada Masalah', 'Report Issue'), 'alert', { go: 'ISSUE-001', rec: o.id }));
      var hd = '<section class="card c6-hd"><div class="c6-hd-m"><div class="c6-hd-t"><h1><span class="mono6">' + esc(o.id) + '</span> ' + kindC(o.kind) + stC(o) + (o.pri !== 'normal' ? priC(o.pri) : '') + '</h1><p><b>' + cname(o.cl) + '</b> · ' + pname(o.prop) + ' · ' + esc(day(o.date)) + ' ' + esc(o.win.join('–')) + '</p></div></div>' +
        lifecycle(o) + (b.length ? '<div class="c6-hd-a">' + b.join('') + '</div>' : '') + '</section>';
      var sum = card(L('Ringkasan order', 'Order summary'), kv([
        [L('No. Order', 'Order No.'), '<span class="mono6">' + esc(o.id) + '</span>'], [L('Klien', 'Client'), cname(o.cl)], ['Property', pname(o.prop) + '<small class="sub5">' + esc(p.addr || '') + '</small>'],
        [L('Kontak PIC', 'Contact PIC'), ct ? esc(ct.n) + '<small class="sub5">' + esc(T(ct.pos)) + '</small>' + (isC ? '' : reach(ct)) : '—'], [L('Layanan', 'Service'), esc(E.svcName(o.svc))], [L('Jenis', 'Type'), kindC(o.kind)],
        [L('Tanggal · jam', 'Date · time'), esc(day(o.date)) + ' · ' + esc(o.win.join('–'))], [L('Prioritas', 'Priority'), priC(o.pri, true)],
        ['SLA', sl ? sl.tat + ' ' + t(L('jam', 'h')) + '<small class="sub5">' + esc(T(sl.rule.n)) + '</small>' : '—'], [L('Perkiraan', 'Estimate'), o.bags + ' bag' + (o.kg ? ' · ' + fmt.kg(o.kg) : '') + ' · ' + t(E.CAT[o.cat] || L(o.cat, o.cat))],
        isC ? null : [L('Sumber', 'Source'), t(E.SRC[o.src]) + (o.sch ? ' · ' + lnk('SCHEDULE-002', o.sch, esc(o.sch)) : '') + (o.genAt ? '<small class="sub5">' + t(L('Dibuat otomatis ', 'Auto-generated ')) + esc(when(o.genAt)) + (o.ctr ? ' · ' + esc(o.ctr) : '') + '</small>' : '')],
        isC ? null : [L('Dibuat', 'Created'), emp(o.by) + '<small class="sub5">' + esc(when(o.at)) + '</small>'], ['Status', stC(o)]
      ]) + instr(o) + (o.dupOf && !isC ? note(t(L('Dibuat walau mirip ', 'Created although similar to ')) + ordLink(o.dupOf) + ': ' + esc(o.dupReason || ''), 'alert', 'warn') : ''), { icon: 'file' });
      var drv = tr ? card(L('Driver & perjalanan', 'Driver & trip'), kv([[L('Driver', 'Driver'), esc(isC ? E.first(tr.drv) : E.empName(tr.drv))], isC ? null : [L('Kendaraan', 'Vehicle'), esc(tr.veh + ' · ' + E.vehicle(tr.veh).plate)], isC ? null : [L('Rute', 'Route'), tr.route ? lnk('ROUTE-002', tr.id, esc(tr.route + ' · ' + (E.route(tr.route) || {}).n)) : '—'], [L('Status perjalanan', 'Trip status'), tripC(E.tripStatus(o))]]) +
        (['assigned', 'ready', 'ontheway', 'arrived', 'inprogress'].indexOf(o.st) >= 0 ? etaBox(o) : '') + (!isC && open('TIMELINE-001') ? '<p>' + lnk('TIMELINE-001', tr.id, ic('history') + t(L('Timeline rute', 'Route timeline'))) + '</p>' : ''), { icon: 'truck' })
        : card(L('Driver & perjalanan', 'Driver & trip'), A.empty(L('Belum ada driver ditugaskan.', 'No driver assigned yet.')), { icon: 'truck' });
      var ex = o.exec ? card(L('Hasil pickup', 'Pickup result'), kv([[L('Bag', 'Bags'), o.exec.bags + (o.exec.cont ? ' + ' + o.exec.cont + ' container' : '') + (o.exec.bags !== o.bags ? ' <small class="sub5">' + t(L('estimasi ', 'estimate ')) + o.bags + '</small>' : '')], [L('Berat (estimasi)', 'Weight (estimate)'), fmt.kg(o.exec.kg)], [L('Kategori', 'Category'), t(E.CAT[o.exec.cat] || L(o.exec.cat, o.exec.cat))], [L('Kondisi', 'Condition'), A.chip(E.COND[o.exec.cond][1], E.COND[o.exec.cond][0])], o.exec.special ? [L('Barang khusus', 'Special item'), esc(o.exec.special)] : null]) +
        (mf ? '<p>' + lnk('MANIFEST-001', mf.id, ic('clipboard') + t(L('Manifest ', 'Manifest ')) + esc(mf.id)) + ' ' + mfC(mf.st) + '</p>' : ''), { icon: 'clipboard' }) : '';
      var pod = o.pod ? card('POD', kv([[L('Penerima', 'Recipient'), esc(o.pod.recv)], [L('Bag diserahkan', 'Bags delivered'), o.pod.bags + (o.pod.pkg ? ' · ' + o.pod.pkg + ' paket' : '')], [L('Kondisi', 'Condition'), A.chip(E.COND[o.pod.cond][1], E.COND[o.pod.cond][0])], [L('Waktu', 'Time'), esc(when(o.pod.at))], o.pod.issue ? [L('Catatan', 'Note'), esc(o.pod.issue)] : null]), { icon: 'sign' }) : '';
      var evs = E.evidence(c0, o.id);
      var ev = evs ? card(L('Bukti transaksi', 'Transaction evidence'), evList(evs) + (open('EVIDENCE-001') && evs.length ? '<p>' + lnk('EVIDENCE-001', o.id, t(L('Buka bukti lengkap', 'Open full evidence'))) + '</p>' : ''), { icon: 'camera', count: evs.filter(function (e) { return !e.superseded; }).length }) : '';
      var iss = isC ? [] : E.issues(c0, { ord: o.id });
      var issC = iss.length ? card(L('Masalah', 'Issues'), '<ul class="is7l">' + iss.map(function (i) { return '<li>' + sevC(i.sev) + '<b>' + t(E.ISSUE_TYPES[i.type][0]) + '</b> · ' + esc(T(i.note)) + '<small>' + esc(when(i.at)) + ' · ' + emp(i.by) + ' · ' + A.chip(E.ISSUE_ST[i.st][1], E.ISSUE_ST[i.st][0]) + '</small>' + (open('ISSUE-002') ? lnk('ISSUE-002', i.id, t(L('Buka', 'Open'))) : '') + '</li>'; }).join('') + '</ul>', { icon: 'alert' }) : '';
      var hist = card(L('Riwayat status', 'Status history'), '<ol class="tl6">' + o.ev.slice().reverse().map(function (e) { return '<li class="tl6-i"><span class="tl6-d" aria-hidden="true"></span><div><b>' + t(E.stLabel(o, e[0])) + '</b><small>' + esc(when(e[1])) + ' · ' + (isC && e[2] !== 'system' && !E.contact(e[2]) ? 'JFRESH' : emp(e[2])) + '</small>' + (e[3] && !isC ? '<span class="tl6-r">' + esc(T(e[3])) + '</span>' : '') + '</div></li>'; }).join('') + '</ol>', { icon: 'history' });
      if (isC && o.st === 'issue') issC = note(t(L('Ada kendala pada tugas ini. Tim JFRESH sedang menanganinya dan akan menghubungi Anda.', 'There is a problem with this task. The JFRESH team is handling it and will contact you.')), 'alert', 'warn');
      return hd + '<div class="g7-2"><div class="g7-c">' + sum + ex + pod + issC + '</div><div class="g7-c">' + drv + ev + hist + '</div></div>';
    },
    act: acts({ amend: function (el) { amendDlg(el.getAttribute('data-val')); } })
  };

  /* ================= NP-02 · SCHEDULE-001 Recurring Schedule ================= */
  function daysTxt(s) { if (s.days.length === 7) return T(L('Setiap hari', 'Every day')); if (s.days.join() === '1,2,3,4,5,6') return T(L('Senin–Sabtu', 'Mon–Sat')); return s.days.map(function (d) { return T(E.DAYS[d]); }).join(', '); }
  function schSt(s) { return s.cancelled ? A.chip('mute', L('Dibatalkan', 'Cancelled')) : s.next ? A.chip('mute', L('Versi lama', 'Superseded')) : s.active ? A.chip('ok', L('Aktif', 'Active')) : A.chip('warn', L('Dijeda', 'Paused')); }
  G.daysTxt = daysTxt; G.schSt = schSt;
  V['SCHEDULE-001'] = {
    render: function (c) {
      var c0 = cx(), q = c.q, tab = q.tab || 'list', all = E.schedules(c0, {}), list = E.schedules(c0, { st: q.st, cl: q.cl });
      if (q.q) { var qq = q.q.toLowerCase(); list = list.filter(function (s) { return (s.id + ' ' + E.propName(s.prop) + ' ' + E.clientName(s.cl)).toLowerCase().indexOf(qq) >= 0; }); }
      var tmr = E.addDays(E.TODAY, 1), occT = E.calendar(c0, tmr, 1).filter(function (o) { return !o.skipped && !o.paused; });
      var hol = E.state().holidays.filter(function (h) { return h.d >= E.TODAY && h.d <= E.addDays(E.TODAY, 14); });
      var head = A.pageHead(null, t(L('Jadwal pickup rutin per property. Setiap hari pukul ' + E.cfg().genAt + ' sistem membuat order dari jadwal aktif.', 'Recurring pickups per property. Every day at ' + E.cfg().genAt + ' the system creates orders from active schedules.')),
        A.pbtn('lg.schedule.edit', 'ghost', L('Buat Order Besok', 'Generate Tomorrow'), 'refresh', { act: 'gen' }) + A.pbtn('lg.schedule.edit', 'primary', L('Tambah Jadwal', 'Add Schedule'), 'plus', { go: 'SCHEDULE-002' }));
      var strip = tiles([
        tile({ k: L('Jadwal aktif', 'Active schedules'), v: all.filter(function (s) { return s.active; }).length, s: t(L('property dilayani rutin', 'properties on a routine')) }),
        tile({ k: L('Dijeda', 'Paused'), v: all.filter(function (s) { return !s.active; }).length, s: all.filter(function (s) { return !s.active; }).map(function (s) { return E.propName(s.prop); }).join(', ') || '—', tone: all.some(function (s) { return !s.active; }) ? 'warn' : '' }),
        tile({ k: L('Pengecualian 14 hari', 'Exceptions next 14 days'), v: hol.length, s: t(L('libur, tutup, acara', 'holidays, closures, events')), href: qhref({ tab: 'hol' }) }),
        tile({ k: L('Order otomatis besok', 'Auto orders tomorrow'), v: occT.length, s: t(L('akan dibuat ', 'created at ')) + E.cfg().genAt })
      ], 'tls5-4');
      var body;
      if (tab === 'cal') {
        var days = []; for (var i = 0; i < 7; i++) days.push(E.addDays(E.TODAY, i));
        body = '<div class="cal7">' + days.map(function (d) {
          var occ = E.calendar(c0, d, 1).sort(function (a, b) { return a.pick.localeCompare(b.pick); }), hd = E.state().holidays.filter(function (h) { return h.d === d; });
          return '<section class="cal7-d' + (d === E.TODAY ? ' is-today' : '') + '"><h3>' + t(E.DAYS[new Date(E.ms(d)).getUTCDay()]) + ' <b>' + esc(dts(d)) + '</b></h3>' + hd.map(function (h) { return '<span class="cal7-h">' + ic('flag') + esc(T(h.n)) + '</span>'; }).join('') +
            '<ul>' + occ.map(function (o) { var s = E.schedule(o.sch); return '<li class="' + (o.skipped || o.paused ? 'is-off' : '') + '"><a href="' + href('SCHEDULE-002', s.id) + '"><b class="num">' + esc(o.pick) + '</b> ' + pname(s.prop) + '</a>' +
              (o.paused ? A.chip('warn', L('Dijeda', 'Paused')) : o.skipped ? A.chip('mute', o.rule === 'skip' ? L('Dilewati (libur)', 'Skipped (holiday)') : L('Dilewati', 'Skipped')) : o.confirm ? A.chip('warn', L('Perlu konfirmasi', 'Needs confirmation')) : o.rule === 'earlier' ? A.chip('info', L('Dimajukan', 'Moved earlier')) : o.rule === 'later' ? A.chip('info', L('Dimundurkan', 'Moved later')) : o.extra ? A.chip('appr', L('Ekstra', 'Extra')) : o.moved ? A.chip('info', L('Dipindah', 'Moved')) : '') + '</li>'; }).join('') + '</ul></section>';
        }).join('') + '</div>';
      } else if (tab === 'hol') {
        body = card(L('Kalender pengecualian', 'Exception calendar'), A.list(E.state().holidays.slice().sort(function (a, b) { return a.d.localeCompare(b.d); }), [
          { h: L('Tanggal', 'Date'), v: function (h) { return esc(dts(h.d)); } }, { h: L('Jenis', 'Type'), v: function (h) { return t(E.HOL_KIND[h.kind]); } }, { h: L('Keterangan', 'Description'), v: function (h) { return esc(T(h.n)); } },
          { h: 'Property', v: function (h) { return h.prop ? pname(h.prop) : t(L('Semua property', 'All properties')); } }, { h: L('Aturan jadwal', 'Schedule rule'), v: function (h) { return t(E.HOL_RULE[h.rule]) + (h.min ? ' ' + h.min + ' ' + t(L('mnt', 'min')) : ''); } }
        ], function (h) { return { t: esc(T(h.n)), r: esc(dts(h.d)), s: t(E.HOL_KIND[h.kind]) + ' · ' + t(E.HOL_RULE[h.rule]) }; }, null), { icon: 'flag' }) + note(t(L('Aturan libur umum mengikuti pilihan di tiap jadwal; pengecualian per property memakai aturannya sendiri.', 'Public holidays follow each schedule\'s rule; property exceptions use their own rule.')), 'info');
      } else {
        var fb = A.filters([{ k: 'st', l: 'Status', opts: [['active', L('Aktif', 'Active')], ['paused', L('Dijeda', 'Paused')]] }, { k: 'cl', l: L('Klien', 'Client'), opts: CM.state().clients.filter(function (x) { return all.some(function (s) { return s.cl === x.id; }); }).map(function (x) { return [x.id, [x.n, x.n]]; }) }], { search: L('Cari property atau klien', 'Search property or client'), force: true });
        body = fb + card(L('Daftar jadwal', 'Schedule list'), A.list(list, [
          { h: L('Klien', 'Client'), v: function (s) { return '<b>' + cname(s.cl) + '</b><small class="sub5 mono6">' + esc(s.id) + '</small>'; } }, { h: 'Property', v: function (s) { return pname(s.prop); } },
          { h: L('Hari', 'Days'), v: function (s) { return esc(daysTxt(s)); } }, { h: 'Pickup', cls: 'num', v: function (s) { return '<b>' + esc(s.pick) + '</b>'; } }, { h: 'Delivery', cls: 'num', v: function (s) { return esc(s.del); } },
          { h: L('Frekuensi', 'Frequency'), v: function (s) { return t(E.FREQ[s.freq]); } }, { h: L('Rute · driver', 'Route · driver'), v: function (s) { return esc(s.route || '—') + '<small class="sub5">' + (s.drv ? esc(E.first(s.drv)) + ' · ' + esc(s.veh || '') : t(L('belum ada driver', 'no driver yet'))) + '</small>'; } },
          { h: 'Status', v: function (s) { return schSt(s); } }
        ], function (s) { return { t: pname(s.prop), r: esc(s.pick), s: esc(daysTxt(s)) + ' · ' + t(E.FREQ[s.freq]) + ' · Delivery ' + esc(s.del), chip: schSt(s) }; }, function (s) { return href('SCHEDULE-002', s.id); }), { icon: 'calendar', count: list.length });
        var feat = all.filter(function (s) { return s.freq === 'multi' && s.active; });
        if (feat.length) body += card(L('Contoh: beberapa kali sehari', 'Example: multiple times per day'), '<div class="ft7">' + feat.map(function (s) { return '<div class="ft7-i"><b>' + pname(s.prop) + '</b>' + A.chip('appr', L('Auto Order aktif', 'Auto Order enabled'), 'zap') + '<span>' + ic('basket') + 'Pickup <b class="num">' + esc(s.pick) + '</b></span><span>' + ic('package') + 'Delivery <b class="num">' + esc(s.del) + '</b></span><span>' + esc(daysTxt(s)) + ' · ' + t(L('Berlaku ', 'Valid ')) + esc(dts(s.eff)) + (s.end ? ' – ' + esc(dts(s.end)) : '') + '</span>' + (s.note ? '<small class="sub5">' + esc(T(s.note)) + '</small>' : '') + '</div>'; }).join('') + '</div>', { icon: 'zap' });
      }
      return head + strip + tabs([['list', L('Daftar Jadwal', 'Schedule List'), 'list'], ['cal', L('Kalender 7 Hari', '7-Day Calendar'), 'calendar'], ['hol', L('Libur & Pengecualian', 'Holidays & Exceptions'), 'flag', hol.length]], tab, 'tab', { def: 'list' }) + body;
    },
    act: {
      gen: function () {
        var d = E.addDays(E.TODAY, 1), conf = E.calendar(cx(), d, 1).filter(function (o) { return o.confirm && !o.paused; });
        function run(ok) { var r = E.generate(cx(), d, { confirmed: ok }); if (!r.ok) return fail(r); after(L(r.made.length + ' order dibuat untuk besok, ' + r.skipped.length + ' dilewati (dijeda, libur atau sudah ada).', r.made.length + ' orders created for tomorrow, ' + r.skipped.length + ' skipped (paused, holiday or already there).')); }
        if (!conf.length) return run(false);
        dlg({ title: L('Konfirmasi jadwal khusus', 'Confirm special dates'), icon: 'flag', sub: t(L('Beberapa jadwal besok butuh konfirmasi karena acara khusus:', 'Some schedules tomorrow need confirmation because of special events:')), body: '<ul class="cv7">' + conf.map(function (o) { return '<li class="cv7-w">' + ic('flag') + esc(E.propName(E.schedule(o.sch).prop) + ' · ' + o.pick + ' · ' + T(o.hol.n)) + '</li>'; }).join('') + '</ul>', ok: L('Konfirmasi & Buat', 'Confirm & Generate'), onOk: function () { run(true); return true; } });
      }
    }
  };
  function qhref(over) { return H.qhref(over); }

  /* ================= NP-02 · SCHEDULE-002 Schedule Editor ================= */
  V['SCHEDULE-002'] = {
    title: function (rec) { return rec ? L('Jadwal ' + rec, 'Schedule ' + rec) : L('Tambah Jadwal', 'Add Schedule'); },
    render: function (c) {
      var c0 = cx(), s = c.rec ? E.schedule(c.rec) : null, isNew = !s, edit = can('lg.schedule.edit');
      if (c.rec && !s) return A.stateCard('empty', L('Jadwal tidak ditemukan.', 'Schedule not found.'), A.backBtn('blue'));
      if (isNew && !edit) return A.stateCard('noperm', E.MSG.noperm, A.backBtn('blue'));
      var d = s || { prop: '', svc: 'SV-006', days: [1, 2, 3, 4, 5, 6], pick: '09:00', del: '16:00', freq: 'days', eff: E.addDays(E.TODAY, 1), end: '', hol: 'earlier', route: '', drv: '', veh: '', bags: 5, kg: 40, cat: 'linen', pri: 'normal' };
      var props = CM.state().props.filter(function (p) { return p.status === 'active'; }).map(function (p) { return [p.id, [E.clientName(p.cl) + ' · ' + p.n, E.clientName(p.cl) + ' · ' + p.n]]; });
      var form = '<form class="card f6" id="f7s" onsubmit="return false">' +
        '<h2 class="h5">' + ic('hotel') + t(L('Klien & layanan', 'Client & service')) + '</h2><div class="f6-g">' + fld(L('Klien · Property', 'Client · Property'), sel('prop', [['', L('Pilih property', 'Choose a property')]].concat(props), d.prop), { req: true }) +
        fld(L('Layanan', 'Service'), sel('svc', CM.services().map(function (x) { return [x.id, x.n]; }), d.svc), { req: true }) + fld(L('Kontrak', 'Contract'), inp('ctrv', d.ctr || T(L('otomatis dari kontrak aktif', 'automatic from active contract')), { ro: true })) + fld(L('Kategori', 'Category'), sel('cat', opts(E.CAT), d.cat)) + '</div>' +
        '<h2 class="h5">' + ic('calendar') + t(L('Pola hari & jam', 'Day pattern & time')) + '</h2>' + fld(L('Hari', 'Days'), '<div class="ck6 dy7">' + E.DAYS.map(function (x, i) { return '<label class="ck6-i"><input type="checkbox" name="days" data-multi="1" value="' + i + '"' + (d.days.indexOf(i) >= 0 ? ' checked' : '') + '><span>' + t(x) + '</span></label>'; }).join('') + '</div>', { req: true, wide: true }) +
        '<div class="f6-g">' + fld(L('Frekuensi', 'Frequency'), sel('freq', opts(E.FREQ), d.freq)) + fld(L('Jam pickup', 'Pickup time'), inp('pick', d.pick, { type: 'time' }), { req: true }) + fld(L('Jam delivery', 'Delivery time'), inp('del', d.del, { type: 'time' }), { req: true }) +
        fld(L('Berlaku mulai', 'Effective date'), inp('eff', isNew ? d.eff : E.addDays(E.TODAY, 1), { type: 'date' }), { req: true, hint: isNew ? '' : t(L('Perubahan berlaku mulai tanggal ini sebagai versi baru.', 'Changes apply from this date as a new version.')) }) + fld(L('Berakhir', 'End date'), inp('end', d.end || '', { type: 'date' })) +
        fld(L('Aturan hari libur', 'Holiday rule'), sel('hol', opts(E.HOL_RULE), d.hol)) + '</div>' +
        '<h2 class="h5">' + ic('route') + t(L('Preferensi', 'Preferences')) + '</h2><div class="f6-g">' + fld(L('Rute', 'Route'), sel('route', [['', '—']].concat(E.routes().map(function (r) { return [r.id, [r.id + ' · ' + r.n, r.id + ' · ' + r.n]]; })), d.route || '')) +
        fld(L('Driver', 'Driver'), sel('drv', [['', '—']].concat(E.state().drivers.map(function (x) { return [x.id, [x.n, x.n]]; })), d.drv || '')) + fld(L('Kendaraan', 'Vehicle'), sel('veh', [['', '—']].concat(E.state().vehicles.map(function (x) { return [x.id, [x.id + ' · ' + x.plate, x.id + ' · ' + x.plate]]; })), d.veh || '')) +
        fld(L('Prioritas', 'Priority'), sel('pri', opts(E.PRI), d.pri)) + fld(L('Perkiraan bag', 'Estimated bags'), inp('bags', d.bags, { num: true })) + fld(L('Perkiraan kg', 'Estimated kg'), inp('kg', d.kg, { num: true })) + '</div>' +
        (isNew ? '' : fld(L('Alasan perubahan', 'Reason for change'), inp('reason', ''), { req: true, wide: true })) +
        '<p class="dlg5-e" role="alert" id="f7s-e"></p><div class="f6-a">' + A.backBtn('ghost') + (edit && (isNew || (!s.next && !s.cancelled)) ? A.btn('primary', isNew ? L('Simpan Jadwal', 'Save Schedule') : L('Simpan Jadwal Mendatang', 'Save Future Schedule'), 'check', { act: 'save' }) : '') + '</div></form>';
      if (isNew) return A.pageHead(null, t(L('Jadwal rutin membuat order otomatis setiap hari sesuai pola hari.', 'A recurring schedule creates orders automatically on its days.'))) + form;
      var occ = []; for (var i = 0; i < 14; i++) E.occurrences(s, E.addDays(E.TODAY, i)).forEach(function (o) { occ.push(o); });
      var log = E.auditLog({}).filter(function (a) { return a.rec === s.id || (a.ev === 'SCHEDULE.CHANGE' && a.from === s.id); });
      var actsB = edit && s.active && !s.next ? [A.btn('ghost', L('Jadwal Ulang Sekali', 'Reschedule Once'), 'calendar', { act: 'sa', val: 'reschedule' }), A.btn('ghost', L('Lewati Sekali', 'Skip Once'), 'arrow', { act: 'sa', val: 'skip' }), A.btn('ghost', L('Tambah Pickup Ekstra', 'Add Extra Pickup'), 'plus', { act: 'sa', val: 'extra' }), A.btn('ghost', L('Jeda', 'Pause'), 'hourglass', { act: 'sa', val: 'pause' }), A.btn('danger', L('Batalkan Jadwal', 'Cancel Schedule'), 'xc', { act: 'sa', val: 'cancel' })]
        : edit && !s.active && !s.cancelled && !s.next ? [A.btn('primary', L('Lanjutkan Jadwal', 'Resume Schedule'), 'play', { act: 'sa', val: 'resume' })] : [];
      var hd = '<section class="card c6-hd"><div class="c6-hd-m"><div class="c6-hd-t"><h1>' + pname(s.prop) + ' ' + schSt(s) + '</h1><p><b>' + cname(s.cl) + '</b> · <span class="mono6">' + esc(s.id) + '</span> · ' + esc(daysTxt(s)) + ' · Pickup <b>' + esc(s.pick) + '</b> · Delivery ' + esc(s.del) +
        (s.prev ? ' · ' + t(L('versi dari ', 'version of ')) + lnk('SCHEDULE-002', s.prev, esc(s.prev)) : '') + (s.next ? ' · ' + t(L('diganti ', 'replaced by ')) + lnk('SCHEDULE-002', s.next, esc(s.next)) : '') + '</p>' + (s.paused ? note(esc(T(s.paused)), 'hourglass', 'warn') : '') + '</div></div>' + (actsB.length ? '<div class="c6-hd-a">' + actsB.join('') + '</div>' : '') + '</section>';
      var up = card(L('14 hari ke depan', 'Next 14 days'), occ.length ? '<ul class="oc7s">' + occ.map(function (o) { return '<li class="' + (o.skipped || o.paused ? 'is-off' : '') + '"><b>' + esc(day(o.date)) + '</b> <span class="num">' + esc(o.pick) + '</span> ' + (o.skipped ? A.chip('mute', L('Dilewati', 'Skipped')) : o.paused ? A.chip('warn', L('Dijeda', 'Paused')) : o.confirm ? A.chip('warn', L('Perlu konfirmasi', 'Needs confirmation')) : o.rule === 'earlier' ? A.chip('info', L('Dimajukan', 'Moved earlier')) : o.rule === 'later' ? A.chip('info', L('Dimundurkan', 'Moved later')) : o.extra ? A.chip('appr', L('Ekstra', 'Extra')) : o.moved ? A.chip('info', L('Dipindah dari ', 'Moved from ') + dts(o.moved)) : '') + (o.hol ? '<small class="sub5">' + esc(T(o.hol.n)) + '</small>' : '') + '</li>'; }).join('') + '</ul>' : A.empty(L('Tidak ada pickup dalam 14 hari.', 'No pickup in 14 days.')), { icon: 'calendar' });
      var hist = card(L('Riwayat perubahan', 'Change history'), log.length ? '<ol class="tl6">' + log.map(function (a) { return '<li class="tl6-i"><span class="tl6-d"></span><div><b>' + t(E.EVENTS[a.ev] || [a.ev, a.ev]) + '</b><small>' + esc(E.isoT(a.at)) + ' · ' + esc(a.by) + '</small>' + (a.to ? '<span class="tl6-v">' + esc(a.to) + '</span>' : '') + (a.reason ? '<span class="tl6-r">' + esc(a.reason) + '</span>' : '') + '</div></li>'; }).join('') + '</ol>' : A.empty(L('Belum ada perubahan sejak dibuat.', 'No change since it was created.')), { icon: 'history' });
      return hd + '<div class="g7-2"><div class="g7-c">' + (edit && !s.next && !s.cancelled ? form : card(L('Detail jadwal', 'Schedule detail'), kv([[L('Layanan', 'Service'), esc(E.svcName(s.svc))], [L('Frekuensi', 'Frequency'), t(E.FREQ[s.freq])], [L('Berlaku', 'Valid'), esc(dts(s.eff)) + (s.end ? ' – ' + esc(dts(s.end)) : '')], [L('Aturan libur', 'Holiday rule'), t(E.HOL_RULE[s.hol])], [L('Rute · driver', 'Route · driver'), esc((s.route || '—') + ' · ' + (s.drv ? E.first(s.drv) : '—'))], [L('Kontrak', 'Contract'), esc(s.ctr || '—')]]), { icon: 'file' })) + '</div><div class="g7-c">' + up + hist + '</div></div>';
    },
    act: {
      save: function () {
        var v = vals(document.getElementById('f7s')), r = E.saveSchedule(cx(), A.S.rec || null, { prop: v.prop, svc: v.svc, days: v.days || [], pick: v.pick, del: v.del, freq: v.freq, eff: v.eff, end: v.end, hol: v.hol, route: v.route, drv: v.drv, veh: v.veh, pri: v.pri, bags: v.bags, kg: v.kg, cat: v.cat, reason: v.reason });
        if (!r.ok) { document.getElementById('f7s-e').textContent = T(r.msg); return; }
        A.go('SCHEDULE-002', r.schedule.id); setTimeout(function () { A.toast(A.S.rec ? L('Versi jadwal baru tersimpan.', 'New schedule version saved.') : L('Jadwal tersimpan.', 'Schedule saved.')); }, 300);
      },
      sa: function (el) {
        var act = el.getAttribute('data-val'), s = E.schedule(A.S.rec), tm = E.addDays(E.TODAY, 1);
        var body = act === 'skip' ? fld(L('Tanggal yang dilewati', 'Date to skip'), inp('date', tm, { type: 'date' }), { req: true }) :
          act === 'reschedule' ? '<div class="f6-g">' + fld(L('Tanggal asal', 'Original date'), inp('from', tm, { type: 'date' }), { req: true }) + fld(L('Tanggal baru', 'New date'), inp('to', E.addDays(tm, 1), { type: 'date' }), { req: true }) + fld(L('Jam pickup', 'Pickup time'), inp('pick', s.pick, { type: 'time' })) + '</div>' :
            act === 'extra' ? '<div class="f6-g">' + fld(L('Tanggal', 'Date'), inp('date', tm, { type: 'date' }), { req: true }) + fld(L('Jam pickup', 'Pickup time'), inp('pick', '14:00', { type: 'time' }), { req: true }) + '</div>' :
              act === 'cancel' ? fld(L('Berakhir mulai', 'Ends on'), inp('date', E.TODAY, { type: 'date' })) : '';
        var title = { skip: L('Lewati sekali', 'Skip once'), reschedule: L('Jadwal ulang sekali', 'Reschedule once'), extra: L('Tambah pickup ekstra', 'Add extra pickup'), pause: L('Jeda jadwal', 'Pause schedule'), resume: L('Lanjutkan jadwal', 'Resume schedule'), cancel: L('Batalkan jadwal', 'Cancel schedule') }[act];
        dlg({ title: title, icon: 'calendar', sub: pname(s.prop) + ' · ' + esc(s.pick), body: body + (act === 'resume' ? '' : fld(L('Alasan', 'Reason'), inp('reason', ''), { req: true, wide: true })),
          onOk: function (v) { var r = E.scheduleAction(cx(), s.id, act, v); if (!r.ok) return r.msg; after(L('Perubahan jadwal tersimpan dan tercatat di audit.', 'Schedule change saved and audited.')); return true; } });
      }
    }
  };

  /* ================= NP-03 · DISPATCH-001 Dispatch Board ================= */
  function dCard(o) {
    var tr = E.tripOf(o), e = o.st === 'ontheway' ? E.eta(o) : null, lane = E.laneOf(o), sl = o.slaTat || (E.sla(o) || {}).tat;
    var b = lane === 'unassigned' && can('lg.dispatch') ? A.btn('primary', L('Tugaskan', 'Assign'), 'user', { act: 'assign', val: o.id, cls: 'btn-sm' })
      : lane === 'assigned' && can('lg.dispatch') ? A.btn('ghost', L('Siap', 'Ready'), 'check', { act: 'ready', val: o.id, cls: 'btn-sm' }) + A.btn('ghost', L('Pindah', 'Move'), 'swap', { act: 'assign', val: o.id, cls: 'btn-sm' })
        : lane === 'ready' && can('lg.dispatch') ? A.btn('ghost', L('Pindah', 'Move'), 'swap', { act: 'assign', val: o.id, cls: 'btn-sm' })
          : (lane === 'ontheway' || lane === 'atloc') && tr && open('TRACK-002') ? A.btn('ghost', L('Lacak', 'Track'), 'pin', { go: 'TRACK-002', rec: tr.id, cls: 'btn-sm' }) + (open('CHAT-001') ? A.btn('ghost', 'Chat', 'message', { go: 'CHAT-001', rec: o.id, cls: 'btn-sm' }) : '')
            : lane === 'issue' && open('ISSUE-002') ? A.btn('danger', L('Buka Masalah', 'Open Issue'), 'alert', { go: 'ISSUE-002', rec: (E.issues(cx(), { ord: o.id }).filter(function (i) { return i.st !== 'resolved'; })[0] || {}).id, cls: 'btn-sm' }) : '';
    var crit = E.state().issues.some(function (i) { return i.ord === o.id && i.sev === 'crit' && i.st !== 'resolved'; });
    return '<article class="dc7 dc7-' + o.pri + (crit ? ' is-crit' : '') + '"><a class="dc7-a" href="' + href('ORDER-003', o.id) + '"><span class="dc7-h"><b>' + cname(o.cl) + '</b>' + (o.pri !== 'normal' ? priC(o.pri) : '') + '</span><span class="dc7-p">' + pname(o.prop) + '</span>' +
      '<span class="dc7-m">' + kindC(o.kind) + '<span class="num">' + ic('clock') + esc(o.win.join('–')) + '</span></span><span class="dc7-m"><span>' + ic('package') + o.bags + ' bag' + (o.kg ? ' · ' + o.kg + ' kg' : '') + '</span>' + (sl ? '<span>SLA ' + sl + ' ' + t(L('j', 'h')) + '</span>' : '') + '</span>' +
      (tr ? '<span class="dc7-d">' + av(tr.drv) + '<span><b>' + esc(E.first(tr.drv)) + '</b> · ' + esc(tr.veh) + (tr.route ? ' · ' + esc(tr.route) : '') + '</span></span>' : '') +
      (e ? '<span class="dc7-e' + (e.late ? ' is-late' : '') + (e.stale ? ' is-stale' : '') + '">ETA <b class="num">' + hm(e.at) + '</b> · ' + esc(minT(e.min)) + (e.stale ? ' · ' + t(L('sinyal lemah', 'weak signal')) : '') + (e.late ? ' · +' + e.delay + ' ' + t(L('mnt', 'min')) : '') + '</span>' : '') +
      '<span class="dc7-s">' + stC(o) + '<span class="mono6">' + esc(o.id) + '</span></span></a>' + (b ? '<div class="dc7-b">' + b + '</div>' : '') + '</article>';
  }
  function attPanel(list, max) {
    if (!list.length) return '<p class="att7-ok">' + ic('checkc') + t(L('Tidak ada yang perlu perhatian sekarang.', 'Nothing needs attention right now.')) + '</p>';
    return '<ul class="att7">' + list.slice(0, max || 99).map(function (a) {
      var go = a.ord ? href('ORDER-003', a.ord) : a.iss && open('ISSUE-002') ? href('ISSUE-002', a.iss) : a.trip && open('TRACK-002') ? href('TRACK-002', a.trip) : null;
      return '<li class="att7-' + a.sev + '">' + (go ? '<a href="' + go + '">' : '<span>') + '<span class="att7-k">' + ic(a.sev === 'crit' ? 'alert' : 'clock') + t(E.ATT_KIND[a.kind] || L(a.kind, a.kind)) + '</span><b>' + t(a.txt) + '</b>' + (go ? '</a>' : '</span>') + '</li>';
    }).join('') + '</ul>';
  }
  G.attPanel = attPanel; G.dCard = dCard;
  V['DISPATCH-001'] = {
    render: function (c) {
      var c0 = cx(), q = c.q, board = E.board(c0, { kind: q.kind, drv: q.drv, route: q.route }), att = E.attention(c0), lane = q.lane || 'unassigned';
      var head = A.pageHead(null, esc(day(E.TODAY)) + ' · ' + esc(dts(E.TODAY)) + ' · ' + t(L('rencana kerja harian tim pickup & delivery', 'daily plan for the pickup & delivery team')),
        A.pbtn('lg.track.fleet', 'ghost', L('Lihat Peta', 'View Map'), 'pin', { go: 'TRACK-001' }) + A.pbtn('lg.order.create', 'primary', L('Buat Order', 'Create Order'), 'plus', { go: 'ORDER-002' }));
      var fb = A.filters([{ k: 'kind', l: L('Jenis', 'Type'), opts: opts(E.KIND) }, { k: 'drv', l: L('Driver', 'Driver'), opts: E.state().drivers.map(function (d) { return [d.id, [d.n, d.n]]; }) }, { k: 'route', l: L('Rute', 'Route'), opts: E.routes().map(function (r) { return [r.id, [r.id + ' · ' + r.n, r.id + ' · ' + r.n]]; }) }], { force: true });
      var crit = att.filter(function (a) { return a.sev === 'crit'; }).length;
      var attC = card(L('Perlu perhatian', 'Needs attention'), attPanel(att, 8) + (att.length > 8 ? '<details class="att7-m"><summary>' + t(L('Lihat ' + (att.length - 8) + ' lainnya', 'Show ' + (att.length - 8) + ' more')) + '</summary>' + attPanel(att.slice(8)) + '</details>' : ''), { icon: 'alert', count: att.length, cls: crit ? 'card-crit7' : '' });
      var lanes;
      if (mob()) {
        lanes = '<nav class="tabs scroll tabs5 seg5 ln7t" aria-label="' + t(L('Lajur', 'Lanes')) + '">' + E.LANES.map(function (l) { var on = l[0] === lane; return '<a href="' + qhref({ lane: l[0] === 'unassigned' ? null : l[0] }) + '" aria-selected="' + on + '">' + ic(l[2]) + '<span>' + t(l[1]) + '</span><b>' + board[l[0]].length + '</b></a>'; }).join('') + '</nav>' +
          '<div class="ln7-m">' + (board[lane].length ? board[lane].map(dCard).join('') : A.empty(L('Lajur ini kosong.', 'This lane is empty.'))) + '</div>';
      } else {
        lanes = '<div class="ln7" role="list">' + E.LANES.map(function (l) {
          var items = board[l[0]], many = l[0] === 'completed' && items.length > 4;
          return '<section class="ln7-c ln7-' + l[0] + '" role="listitem" aria-label="' + esc(T(l[1])) + '"><h3>' + ic(l[2]) + '<span>' + t(l[1]) + '</span><b class="num">' + items.length + '</b></h3><div class="ln7-b">' + (items.length ? (many ? items.slice(0, 4) : items).map(dCard).join('') + (many ? '<a class="more5" href="' + href('ORDER-001', null, { st: 'completed' }) + '">' + t(L('Lihat ' + (items.length - 4) + ' lainnya', 'View ' + (items.length - 4) + ' more')) + ic('chevr') + '</a>' : '') : '<p class="ln7-e">' + t(L('Kosong', 'Empty')) + '</p>') + '</div></section>';
        }).join('') + '</div>';
      }
      var nts = E.notifs(c0).slice(0, 6);
      var ntC = card(L('Notifikasi supervisor', 'Supervisor notifications'), nts.length ? '<ul class="nt7">' + nts.map(function (n) { return '<li>' + ic((E.NOTIF[n.kind] || ['', 'bell'])[1]) + '<span><b>' + t((E.NOTIF[n.kind] || [L(n.kind, n.kind)])[0]) + '</b> ' + t(E.notifText(n)) + '<small>' + esc(when(n.at)) + '</small></span></li>'; }).join('') + '</ul>' : A.empty(L('Belum ada notifikasi.', 'No notifications yet.')), { icon: 'bell' });
      return head + fb + attC + lanes + ntC;
    },
    act: acts()
  };

  /* Phase 2 logistics routes → the Phase 7 screen (no duplicate logistics screens). */
  Object.keys(E.ALIAS).forEach(function (old) {
    var to = E.ALIAS[old];
    V[old] = { render: function (c) { setTimeout(function () { if (location.hash.indexOf('/' + old) >= 0) location.replace(href(to, c.rec, c.q)); }, 0); return A.stateCard('empty', L('Layar ini sudah digabung ke modul Logistik Fase 7.', 'This screen is now part of the Phase 7 Logistics module.'), A.btn('blue', L('Buka', 'Open'), 'arrow', { go: to, rec: c.rec }), L('Membuka layar baru…', 'Opening the new screen…')); } };
  });
})();
