/* JFRESH OS — Phase 7 screens (part 2): NP-04 Route & Fleet (ROUTE-001, ROUTE-002, DRIVER-001,
   VEHICLE-001), NP-05 Driver mobile (DRIVER-MOB-001 … 003), NP-06 Manifest & Bags (MANIFEST-001,
   BAG-001), NP-07 Evidence & POD (EVIDENCE-001, POD-001) and NP-08 Issues (ISSUE-001, ISSUE-002).
   Driver screens follow "one screen = one job": one big primary button, Bahasa Indonesia first. */
(function () {
  var A = window.JFAPP, E = window.JFLOG, H = A && A.P5, G = A && A.P7;
  if (!A || !E || !H || !G) return;
  var V = A.V, T = A.T, L = A.L, t = A.t, esc = A.esc, ic = A.ic, can = A.can, fmt = A.fmt, href = A.href;
  var open = H.open, lnk = H.lnk, tabs = H.tabs, card = H.card, kv = H.kv, note = H.note, tile = H.tile, tiles = H.tiles, dlg = H.dlg, fld = H.fld, inp = H.inp, sel = H.sel, area = H.area, num = H.num;
  var cx = G.cx, stC = G.stC, priC = G.priC, kindC = G.kindC, sevC = G.sevC, liveC = G.liveC, tripC = G.tripC, mfC = G.mfC, hm = G.hm, dts = G.dts, day = G.day, when = G.when, agoS = G.agoS, minT = G.minT;
  var pname = G.pname, cname = G.cname, emp = G.emp, ordLink = G.ordLink, mob = G.mob, after = G.after, fail = G.fail, vals = G.vals, opts = G.opts, av = G.av, reach = G.reach, navUrl = G.navUrl, contactOf = G.contactOf, instr = G.instr;
  var etaBox = G.etaBox, freshC = G.freshC, trackBanner = G.trackBanner, map = G.map, driverMarks = G.driverMarks, legend = G.legend, live = G.live, photoIn = G.photoIn, photos = G.photos, resetPh = G.resetPh, stepper = G.stepper, choice = G.choice;
  var sigPad = G.sigPad, sigBind = G.sigBind, sigVal = G.sigVal, img = G.img, acts = G.acts;
  var DONE = ['completed', 'atplant', 'received', 'cancelled'];
  function isDone(o) { return DONE.indexOf(o.st) >= 0; }
  function qhref(over) { return H.qhref(over); }
  function bar(v, max, o) {
    o = o || {}; var p = max ? Math.min(100, Math.round(v / max * 100)) : 0, tn = v > max ? 'crit' : p >= 85 ? 'warn' : 'ok';
    return '<span class="lb7 lb7-' + tn + '" title="' + esc(v + ' / ' + max + (o.u ? ' ' + o.u : '')) + '"><i style="width:' + p + '%"></i></span><small class="num">' + v + '/' + max + (o.u ? ' ' + esc(o.u) : '') + '</small>';
  }
  function go(s, rec, q) { A.go(s, rec, q); }
  function toastLater(msg, tn) { setTimeout(function () { A.toast(msg, tn); }, 320); }

  /* ================= NP-04 · ROUTE-001 Route Planner ================= */
  function tripRow(tr) {
    var d = E.driver(tr.drv), v = E.vehicle(tr.veh), ld = E.load(tr), pl = E.plan(tr), late = pl.filter(function (x) { return x.late && !x.actual; }).length, r = E.route(tr.route);
    return { tr: tr, d: d, v: v, ld: ld, pl: pl, late: late, r: r, over: pl.end > E.at(E.TODAY, d.shift[1]) };
  }
  function routeEdit(id) {
    var r = id ? E.route(id) : { n: '', area: '', start: '08:00', end: '14:00', min: 240, km: 30, maxStops: 6, drv: '', veh: '' };
    dlg({ title: id ? L('Ubah rute ' + id, 'Edit route ' + id) : L('Tambah rute', 'Add route'), icon: 'route',
      body: '<div class="f6-g">' + fld(L('Nama rute', 'Route name'), inp('n', r.n), { req: true }) + fld(L('Area', 'Area'), inp('area', r.area)) + fld(L('Mulai', 'Start'), inp('start', r.start, { type: 'time' }), { req: true }) + fld(L('Selesai', 'End'), inp('end', r.end, { type: 'time' }), { req: true }) +
        fld(L('Perkiraan durasi (menit)', 'Estimated duration (min)'), inp('min', r.min, { num: true })) + fld(L('Perkiraan jarak (km)', 'Estimated distance (km)'), inp('km', r.km, { num: true })) + fld(L('Maks. stop', 'Max stops'), inp('maxStops', r.maxStops, { num: true })) +
        fld(L('Driver utama', 'Default driver'), sel('drv', [['', '—']].concat(E.state().drivers.map(function (x) { return [x.id, [x.n, x.n]]; })), r.drv || '')) + fld(L('Kendaraan utama', 'Default vehicle'), sel('veh', [['', '—']].concat(E.state().vehicles.map(function (x) { return [x.id, [x.id + ' · ' + x.plate, x.id + ' · ' + x.plate]]; })), r.veh || '')) + '</div>' +
        (id ? fld(L('Alasan perubahan', 'Reason for change'), inp('reason', ''), { req: true, wide: true }) : ''),
      onOk: function (v) { if (id && !v.reason) return E.MSG.reason; var res = E.saveRoute(cx(), id || null, v); if (!res.ok) return res.msg; after(id ? L('Rute diperbarui.', 'Route updated.') : L('Rute ditambahkan.', 'Route added.')); return true; } });
  }
  V['ROUTE-001'] = {
    render: function (c) {
      var c0 = cx(), q = c.q, tab = q.tab || 'today', trips = E.state().trips.filter(function (x) { return (x.date || E.TODAY) === E.TODAY; }), rows = trips.map(tripRow), active = trips.filter(function (x) { return x.st !== 'done'; });
      var head = A.pageHead(null, t(L('Rencanakan rute, cek muatan dan kapasitas sebelum berangkat. Perubahan urutan stop selalu dengan alasan.', 'Plan routes, check load and capacity before departure. Reordering stops always needs a reason.')),
        A.pbtn('lg.dispatch', 'ghost', L('Dispatch Board', 'Dispatch Board'), 'columns', { go: 'DISPATCH-001' }) + A.pbtn('lg.route.edit', 'primary', L('Tambah Rute', 'Add Route'), 'plus', { act: 'newRoute' }));
      var strip = tiles([
        tile({ k: L('Rute hari ini', 'Routes today'), v: trips.length, s: active.length + ' ' + t(L('masih berjalan', 'still running')) }),
        tile({ k: L('Stop direncanakan', 'Planned stops'), v: rows.reduce(function (s, r) { return s + r.ld.stops; }, 0), s: rows.reduce(function (s, r) { return s + E.doneCount(r.tr); }, 0) + ' ' + t(L('selesai', 'done')) }),
        tile({ k: L('Stop berisiko terlambat', 'Stops at risk of delay'), v: rows.reduce(function (s, r) { return s + r.late; }, 0), s: t(L('dibanding jendela waktu', 'against the time window')), tone: rows.some(function (r) { return r.late; }) ? 'warn' : '' }),
        tile({ k: L('Kendaraan siap', 'Vehicles ready'), v: E.vehicles().filter(function (v) { return v.cur === 'idle'; }).length, s: E.vehicles().filter(function (v) { return v.cur === 'maint'; }).length + ' ' + t(L('perawatan', 'in maintenance')), href: open('VEHICLE-001') ? href('VEHICLE-001') : null })
      ], 'tls5-4');
      var body;
      if (tab === 'master') {
        body = card(L('Master rute', 'Route master'), A.list(E.routes(), [
          { h: L('Rute', 'Route'), v: function (r) { return '<b>' + esc(r.id) + ' · ' + esc(r.n) + '</b><small class="sub5">' + esc(r.area || '') + '</small>'; } },
          { h: L('Jam', 'Hours'), cls: 'num', v: function (r) { return esc(r.start + '–' + r.end); } }, { h: L('Durasi · jarak', 'Duration · distance'), cls: 'num', v: function (r) { return esc(minT(r.min || 0)) + ' · ' + (r.km || 0) + ' km'; } },
          { h: L('Maks. stop', 'Max stops'), cls: 'num', v: function (r) { return r.maxStops; } }, { h: L('Property', 'Properties'), v: function (r) { return (r.stops || []).length + ' <small class="sub5">' + esc((r.stops || []).slice(0, 3).map(E.propName).join(', ')) + ((r.stops || []).length > 3 ? '…' : '') + '</small>'; } },
          { h: L('Driver · kendaraan', 'Driver · vehicle'), v: function (r) { return (r.drv ? esc(E.first(r.drv)) : '—') + '<small class="sub5">' + esc(r.veh || '—') + '</small>'; } }
        ], function (r) { return { t: esc(r.id + ' · ' + r.n), r: esc(r.start + '–' + r.end), s: (r.stops || []).length + ' property · ' + (r.drv ? esc(E.first(r.drv)) : '—') + ' · ' + esc(r.veh || '—') }; }, function (r) { return href('ROUTE-002', r.id); }), { icon: 'route', count: E.routes().length });
      } else {
        var mp = map({ trips: active, fit: false, drivers: driverMarks(c0, active, function (tr) { return href('ROUTE-002', tr.id); }), stopLabels: false, cls: 'm7-plan' });
        var list = rows.length ? '<div class="rt7l">' + rows.map(function (r) {
          var tr = r.tr, done = E.doneCount(tr);
          return '<a class="rt7 rt7-' + G.colorOf(tr) + '" href="' + href('ROUTE-002', tr.id) + '"><span class="rt7-h">' + av(tr.drv) + '<span><b>' + esc(r.d.n) + '</b><small>' + esc(tr.veh + ' · ' + r.v.plate) + (r.r ? ' · ' + esc(r.r.id + ' ' + r.r.n) : '') + '</small></span>' + liveC(E.liveStatus(tr)) + '</span>' +
            '<span class="rt7-m"><span>' + ic('pin') + done + '/' + r.ld.stops + ' ' + t(L('stop', 'stops')) + '</span><span>' + ic('clock') + t(L('selesai ± ', 'ends ~ ')) + '<b class="num">' + hm(r.pl.end) + '</b></span><span>' + ic('user') + t(L('shift s/d ', 'shift to ')) + esc(r.d.shift[1]) + '</span></span>' +
            '<span class="rt7-l">' + t(L('Muatan', 'Load')) + ' ' + bar(r.ld.bags, r.v.cap.bags, { u: 'bag' }) + '</span>' +
            (r.late || r.over || r.ld.bags > r.v.cap.bags || r.v.maint === 'repair' ? '<span class="rt7-w">' + [r.late ? A.chip('warn', L(r.late + ' stop berisiko terlambat', r.late + ' stops at risk'), 'clock') : '', r.over ? A.chip('warn', L('Melewati shift', 'Past shift end'), 'user') : '', r.ld.bags > r.v.cap.bags ? A.chip('crit', L('Kelebihan muatan', 'Overloaded'), 'weight') : '', r.v.maint === 'repair' ? A.chip('crit', L('Kendaraan perawatan', 'Vehicle in maintenance'), 'truck') : ''].join('') + '</span>' : '') + '</a>';
        }).join('') + '</div>' : A.empty(L('Belum ada rute hari ini. Tugaskan order di Dispatch Board.', 'No route today yet. Assign orders on the Dispatch Board.'));
        body = '<div class="g7-2 g7-map"><div class="g7-c">' + card(L('Peta rute hari ini', 'Today\'s route map'), mp + legend(), { icon: 'route' }) + '</div><div class="g7-c">' + card(L('Rute hari ini', 'Today\'s routes'), list, { icon: 'truck', count: rows.length }) + '</div></div>';
      }
      return head + strip + tabs([['today', L('Rute Hari Ini', 'Today\'s Routes'), 'truck'], ['master', L('Master Rute', 'Route Master'), 'route', E.routes().length]], tab, 'tab', { def: 'today' }) + body;
    },
    act: { newRoute: function () { routeEdit(null); } }
  };

  /* ================= NP-04 · ROUTE-002 Route Detail (trip or route master) ================= */
  V['ROUTE-002'] = {
    title: function (rec) { return rec ? L('Rute ' + rec, 'Route ' + rec) : null; },
    render: function (c) {
      var c0 = cx(), rec = c.rec;
      if (!rec) { setTimeout(function () { go('ROUTE-001'); }, 0); return A.stateCard('empty', L('Pilih rute dari daftar.', 'Choose a route from the list.'), A.btn('blue', L('Ke Daftar Rute', 'To Route List'), 'route', { go: 'ROUTE-001' })); }
      var r = E.route(rec);
      if (r) {
        var trT = E.state().trips.filter(function (x) { return x.route === r.id && (x.date || E.TODAY) === E.TODAY; });
        var hd = '<section class="card c6-hd"><div class="c6-hd-m"><div class="c6-hd-t"><h1>' + esc(r.id + ' · ' + r.n) + ' ' + A.chip(r.status === 'active' ? 'ok' : 'mute', r.status === 'active' ? L('Aktif', 'Active') : L('Nonaktif', 'Inactive')) + '</h1><p>' + esc(r.area || '') + ' · ' + esc(r.start + '–' + r.end) + ' · ' + esc(minT(r.min || 0)) + ' · ' + (r.km || 0) + ' km</p></div></div>' +
          (can('lg.route.edit') ? '<div class="c6-hd-a">' + A.btn('ghost', L('Ubah Rute', 'Edit Route'), 'edit', { act: 'editRoute', val: r.id }) + '</div>' : '') + '</section>';
        var dests = (r.stops || []).map(function (p) { return { p: E.loc(p), n: E.propName(p) }; });
        var stops = '<ol class="sl7l">' + (r.stops || []).map(function (p, i) { return '<li><span class="sl7-n">' + (i + 1) + '</span><b>' + pname(p) + '</b><small class="sub5">' + cname((E.prop(p) || {}).cl) + '</small></li>'; }).join('') + '</ol>';
        return hd + '<div class="g7-2"><div class="g7-c">' + card(L('Property di rute', 'Properties on the route'), stops, { icon: 'hotel', count: (r.stops || []).length }) +
          card(L('Standar rute', 'Route standard'), kv([[L('Driver utama', 'Default driver'), r.drv ? emp(r.drv) : '—'], [L('Kendaraan utama', 'Default vehicle'), r.veh ? esc(r.veh + ' · ' + E.vehicle(r.veh).plate) : '—'], [L('Maks. stop', 'Max stops'), r.maxStops], [L('Kapasitas', 'Capacity'), r.veh ? E.vehicle(r.veh).cap.bags + ' bag · ' + E.vehicle(r.veh).cap.kg + ' kg' : '—']]), { icon: 'file' }) + '</div><div class="g7-c">' +
          card(L('Peta', 'Map'), map({ dests: dests, fit: true }), { icon: 'pin' }) +
          card(L('Hari ini', 'Today'), trT.length ? trT.map(function (x) { return '<p>' + lnk('ROUTE-002', x.id, esc(x.id) + ' · ' + esc(E.empName(x.drv))) + ' ' + liveC(E.liveStatus(x)) + '</p>'; }).join('') : A.empty(L('Rute ini belum dipakai hari ini.', 'This route is not used today.')), { icon: 'truck' }) + '</div></div>';
      }
      var tr = E.trip(rec);
      if (!tr) return A.stateCard('empty', L('Rute tidak ditemukan.', 'Route not found.'), A.backBtn('blue'));
      var x = tripRow(tr), os = E.tripOrders(tr), pl = x.pl, dsp = can('lg.dispatch');
      var b = [];
      if (open('TRACK-002') && tr.track && tr.track.on) b.push(A.btn('ghost', L('Lacak Live', 'Live Tracking'), 'pin', { go: 'TRACK-002', rec: tr.id }));
      if (open('TIMELINE-001')) b.push(A.btn('ghost', L('Timeline', 'Timeline'), 'history', { go: 'TIMELINE-001', rec: tr.id }));
      var hd2 = '<section class="card c6-hd"><div class="c6-hd-m">' + av(tr.drv, 'av7-l') + '<div class="c6-hd-t"><h1>' + esc(x.d.n) + ' ' + liveC(E.liveStatus(tr)) + '</h1><p><span class="mono6">' + esc(tr.id) + '</span> · ' + esc(tr.veh + ' · ' + x.v.plate) + (x.r ? ' · ' + lnk('ROUTE-002', x.r.id, esc(x.r.id + ' ' + x.r.n)) : '') + ' · ' + t(L('Shift ', 'Shift ')) + esc(x.d.shift.join('–')) + '</p></div></div>' + (b.length ? '<div class="c6-hd-a">' + b.join('') + '</div>' : '') + '</section>';
      var warn = [];
      if (x.ld.bags > x.v.cap.bags) warn.push(note(t(L('Kelebihan muatan: ' + x.ld.bags + ' dari ' + x.v.cap.bags + ' bag. Pindahkan order ke kendaraan lain.', 'Overloaded: ' + x.ld.bags + ' of ' + x.v.cap.bags + ' bags. Move an order to another vehicle.')), 'weight', 'crit'));
      if (x.over) warn.push(note(t(L('Rute diperkirakan selesai ' + hm(pl.end) + ', melewati akhir shift ' + x.d.shift[1] + '.', 'Route expected to end ' + hm(pl.end) + ', past the shift end ' + x.d.shift[1] + '.')), 'clock', 'warn'));
      if (x.r && x.ld.stops > x.r.maxStops) warn.push(note(t(L('Terlalu banyak stop: ' + x.ld.stops + ' dari maksimal ' + x.r.maxStops + '.', 'Too many stops: ' + x.ld.stops + ' of max ' + x.r.maxStops + '.')), 'pin', 'warn'));
      var summ = tiles([
        tile({ k: L('Stop', 'Stops'), v: E.doneCount(tr) + '/' + x.ld.stops, s: t(L('selesai', 'done')) }),
        tile({ k: L('Muatan rencana', 'Planned load'), v: x.ld.bags + ' bag', s: x.ld.kg + ' kg · ' + t(L('kapasitas ', 'capacity ')) + x.v.cap.bags + ' bag', tone: x.ld.bags > x.v.cap.bags ? 'crit' : '' }),
        tile({ k: L('Perkiraan selesai', 'Expected end'), v: hm(pl.end), s: t(L('kembali di plant', 'back at the plant')), tone: x.over ? 'warn' : '' }),
        tile({ k: L('Berisiko terlambat', 'At risk of delay'), v: x.late, s: t(L('stop belum dimulai', 'stops not started')), tone: x.late ? 'warn' : '' })
      ], 'tls5-4');
      var rows = '<ol class="rs7l">' + os.map(function (o, i) {
        var row = pl.filter(function (z) { return z.ord === o.id; })[0] || {}, mv = dsp && ['assigned', 'ready'].indexOf(o.st) >= 0, cur = ['ontheway', 'arrived', 'inprogress'].indexOf(o.st) >= 0;
        return '<li class="rs7' + (cur ? ' is-cur' : '') + (isDone(o) ? ' is-done' : '') + (o.st === 'issue' ? ' is-iss' : '') + '"><span class="rs7-n">' + (isDone(o) && o.st !== 'cancelled' ? ic('check') : i + 1) + '</span><div class="rs7-b"><a href="' + href('ORDER-003', o.id) + '"><b>' + pname(o.prop) + '</b></a> ' + kindC(o.kind) + (o.pri !== 'normal' ? priC(o.pri) : '') +
          '<small class="sub5">' + esc(o.win.join('–')) + ' · ' + o.bags + ' bag · <span class="mono6">' + esc(o.id) + '</span></small></div><div class="rs7-e">' + (row.eta ? '<b class="num">' + hm(row.eta) + '</b><small>' + t(row.actual ? L('aktual', 'actual') : L('perkiraan', 'expected')) + '</small>' : '—') + (row.late && !row.actual ? A.chip('warn', L('+' + row.delay + ' mnt', '+' + row.delay + ' min')) : '') + '</div>' +
          '<div class="rs7-s">' + stC(o) + '</div>' + (mv ? '<div class="rs7-mv">' + A.btn('ghost', '', 'arrow', { act: 'mv', val: tr.id + '|' + o.id + '|up', cls: 'btn-sm rs7-up' }) + A.btn('ghost', '', 'arrow', { act: 'mv', val: tr.id + '|' + o.id + '|down', cls: 'btn-sm rs7-dn' }) + '</div>' : '') + '</li>';
      }).join('') + '</ol>' + (os.length ? '<p class="sub5">' + ic('factory') + t(L('Kembali ke plant ± ', 'Back at the plant ~ ')) + '<b class="num">' + hm(pl.end) + '</b></p>' : '');
      var mk = driverMarks(c0, [tr]);
      return hd2 + warn.join('') + summ + '<div class="g7-2 g7-map"><div class="g7-c">' + card(L('Urutan stop', 'Stop order'), rows, { icon: 'list', count: os.length }) + '</div><div class="g7-c">' + card(L('Peta rute', 'Route map'), map({ trips: [tr], fit: true, drivers: mk, stopLabels: true }), { icon: 'route' }) + card(L('Muatan kendaraan', 'Vehicle load'), '<p class="rt7-l">' + bar(x.ld.bags, x.v.cap.bags, { u: 'bag' }) + '</p><p class="rt7-l">' + bar(x.ld.kg, x.v.cap.kg, { u: 'kg' }) + '</p>', { icon: 'weight' }) + '</div></div>';
    },
    act: {
      editRoute: function (el) { routeEdit(el.getAttribute('data-val')); },
      mv: function (el) {
        var p = el.getAttribute('data-val').split('|'), o = E.order(p[1]);
        dlg({ title: L('Ubah urutan stop', 'Change stop order'), icon: 'swap', sub: pname(o.prop) + ' · ' + t(p[2] === 'up' ? L('naik satu', 'one up') : L('turun satu', 'one down')) + '. ' + t(L('Driver dan klien diberi tahu, ETA dihitung ulang.', 'Driver and client are notified, ETA is recalculated.')),
          body: fld(L('Alasan', 'Reason'), inp('reason', ''), { req: true, wide: true }),
          onOk: function (v) { var r = E.moveStop(cx(), p[0], p[1], p[2], v.reason); if (!r.ok) return r.msg; after(L('Urutan stop diubah.', 'Stop order changed.')); return true; } });
      }
    }
  };

  /* ================= NP-04 · DRIVER-001 Driver Assignment ================= */
  V['DRIVER-001'] = {
    render: function (c) {
      var c0 = cx(), list = E.drivers(c0), q = c.q;
      if (q.st) list = list.filter(function (d) { return d.avail === q.st; });
      var all = E.drivers(c0);
      var strip = tiles(Object.keys(E.AVAIL).filter(function (k) { return k !== 'done'; }).map(function (k) { return tile({ k: E.AVAIL[k][0], v: all.filter(function (d) { return d.avail === k; }).length, s: all.filter(function (d) { return d.avail === k; }).map(function (d) { return d.d.short; }).join(', ') || '—', href: qhref({ st: q.st === k ? null : k }) }); }), 'tls5-4');
      var tbl = A.list(list, [
        { h: L('Driver', 'Driver'), v: function (d) { return '<span class="dr7">' + av(d.d.id) + '<span><b>' + esc(d.d.n) + '</b><small class="sub5">' + esc(T(d.d.area)) + '</small></span></span>'; } },
        { h: 'Shift', cls: 'num', v: function (d) { return esc(d.d.shift.join('–')); } },
        { h: L('Ketersediaan', 'Availability'), v: function (d) { return A.chip(E.AVAIL[d.avail][1], E.AVAIL[d.avail][0]); } },
        { h: L('Kendaraan', 'Vehicle'), v: function (d) { return d.veh ? esc(d.veh) + '<small class="sub5">' + esc(E.vehicle(d.veh).plate) + '</small>' : '<span class="t6-mute">—</span>'; } },
        { h: L('Rute', 'Route'), v: function (d) { return d.route ? esc(d.route) : '—'; } },
        { h: L('Pickup · Delivery', 'Pickup · Delivery'), cls: 'num', v: function (d) { return d.pick + ' · ' + d.del; } },
        { h: L('Sisa tugas', 'Tasks left'), cls: 'num', v: function (d) { return '<b>' + d.left + '</b>'; } },
        { h: L('Status live', 'Live status'), v: function (d) { return d.trip && d.trip.st !== 'done' ? liveC(d.live) : liveC(d.live === 'ended' ? 'ended' : 'idle'); } }
      ], function (d) { return { t: esc(d.d.n), r: esc(d.d.shift.join('–')), s: (d.veh ? esc(d.veh) + ' · ' : '') + d.left + ' ' + t(L('tugas tersisa', 'tasks left')), chip: A.chip(E.AVAIL[d.avail][1], E.AVAIL[d.avail][0]) }; },
        function (d) { return d.trip ? href(d.trip.track && d.trip.track.on && open('TRACK-002') ? 'TRACK-002' : 'ROUTE-002', d.trip.id) : null; }, { empty: L('Tidak ada driver dengan status ini.', 'No driver with this status.') });
      return A.pageHead(null, t(L('Siapa yang tersedia, sedang di rute, dan berapa tugas yang tersisa. Tugaskan order dari Dispatch Board.', 'Who is available, on a route, and how many tasks are left. Assign orders from the Dispatch Board.')),
        A.pbtn('lg.dispatch', 'primary', L('Ke Dispatch Board', 'To Dispatch Board'), 'columns', { go: 'DISPATCH-001' })) + strip + card(L('Driver', 'Drivers'), tbl, { icon: 'users', count: list.length }) +
        note(t(L('Lokasi driver hanya tampil selama perjalanan aktif. Di luar shift tidak ada pelacakan.', 'A driver location only shows during an active trip. Outside the shift there is no tracking.')), 'lock', 'info');
    }
  };

  /* ================= NP-04 · VEHICLE-001 Vehicle Assignment ================= */
  V['VEHICLE-001'] = {
    render: function (c) {
      var vs = E.vehicles(), dsp = can('lg.dispatch');
      var strip = tiles(Object.keys(E.VEH_CUR).map(function (k) { return tile({ k: E.VEH_CUR[k][0], v: vs.filter(function (v) { return v.cur === k; }).length, s: vs.filter(function (v) { return v.cur === k; }).map(function (v) { return v.v.id; }).join(', ') || '—', tone: k === 'maint' && vs.some(function (v) { return v.cur === 'maint'; }) ? 'crit' : '' }); }), 'tls5-4');
      var cards = '<div class="vh7l">' + vs.map(function (x) {
        var v = x.v, m = E.MAINT[v.maint];
        return '<article class="card vh7' + (v.maint === 'repair' ? ' is-maint' : '') + '"><div class="vh7-h">' + ic('truck') + '<div><b>' + esc(v.id) + '</b><small class="mono6">' + esc(v.plate) + '</small></div>' + A.chip(E.VEH_CUR[x.cur][1], E.VEH_CUR[x.cur][0]) + '</div>' +
          kv([[L('Jenis', 'Type'), t(E.VEH_TYPE[v.type])], [L('Kapasitas', 'Capacity'), v.cap.bags + ' bag · ' + v.cap.kg + ' kg'], [L('Driver · rute', 'Driver · route'), x.drv ? esc(E.first(x.drv)) + (x.route ? ' · ' + esc(x.route) : '') : '—'],
            [L('Muatan sekarang', 'On board now'), bar(x.onboard, v.cap.bags, { u: 'bag' })], [L('Rencana hari ini', 'Planned today'), bar(x.plan.bags, v.cap.bags, { u: 'bag' })],
            [L('Perawatan', 'Maintenance'), A.chip(m[1], m[0]) + '<small class="sub5">' + t(L('Servis berikutnya ', 'Next service ')) + esc(dts(v.next)) + (v.note ? ' · ' + esc(T(v.note)) : '') + '</small>']]) +
          '<div class="vh7-a">' + (x.trip && open('ROUTE-002') ? A.btn('ghost', L('Lihat Rute', 'View Route'), 'route', { go: 'ROUTE-002', rec: x.trip.id, cls: 'btn-sm' }) : '') + (dsp ? A.btn('ghost', L('Ubah Status', 'Change Status'), 'cog', { act: 'maint', val: v.id, cls: 'btn-sm' }) : '') + '</div></article>';
      }).join('') + '</div>';
      return A.pageHead(null, t(L('Kapasitas, muatan dan perawatan. Kendaraan dalam perawatan tidak bisa ditugaskan.', 'Capacity, load and maintenance. A vehicle in maintenance cannot be assigned.'))) + strip + cards;
    },
    act: {
      maint: function (el) {
        var v = E.vehicle(el.getAttribute('data-val'));
        dlg({ title: L('Status kendaraan ' + v.id, 'Vehicle status ' + v.id), icon: 'truck', sub: esc(v.plate),
          body: fld('Status', sel('maint', opts(E.MAINT), v.maint), { req: true, wide: true }) + fld(L('Alasan / catatan', 'Reason / note'), inp('reason', ''), { req: true, wide: true }),
          onOk: function (x) { var r = E.setVehicle(cx(), v.id, x.maint, x.reason); if (!r.ok) return r.msg; after(L('Status kendaraan diperbarui.', 'Vehicle status updated.')); return true; } });
      }
    }
  };

  /* ================= NP-05 · DRIVER-MOB-001 Driver Today ================= */
  function stopTarget(o) {
    if (o.st === 'ontheway') return ['DRIVER-MOB-002', o.id];
    if (o.st === 'arrived' || o.st === 'inprogress') return o.kind === 'pickup' ? (o.exec && o.st === 'inprogress' ? ['EVIDENCE-001', o.id] : ['DRIVER-MOB-003', o.id]) : ['POD-001', o.id];
    return ['DRIVER-MOB-002', o.id];
  }
  function openMf(tr) { return E.state().manifests.filter(function (m) { return m.trip === tr.id && ['handed', 'received'].indexOf(m.st) < 0 && !(m.ho && m.ho.drv); }); }
  function driverCta(h) {
    var tr = h.trip, f = h.focus;
    if (tr.st === 'done') return { done: true };
    if (f && h.cur) {
      if (f.st === 'issue') return { wait: true, o: f };
      var tg = stopTarget(f);
      return { o: f, l: f.st === 'ontheway' ? L('BUKA PERJALANAN', 'OPEN TRIP') : L('LANJUTKAN', 'CONTINUE'), icon: f.st === 'ontheway' ? 'truck' : 'clipboard', go: tg[0], rec: tg[1] };
    }
    if (f) return { o: f, l: L('MULAI PERJALANAN', 'START TRIP'), icon: 'play', act: 'start', val: f.id };
    if (tr.track && tr.track.on && !tr.ret) return { l: L('KEMBALI KE PLANT', 'RETURN TO PLANT'), icon: 'factory', act: 'ret' };
    if (tr.ret && !tr.atPlant) return { l: L('SAYA SUDAH TIBA DI PLANT', 'I HAVE ARRIVED AT THE PLANT'), icon: 'factory', act: 'plant' };
    if (openMf(tr).length) return { l: L('SERAHKAN MANIFEST', 'HAND OVER MANIFEST'), icon: 'filecheck', go: 'HANDOVER-001', rec: openMf(tr)[0].id };
    if (tr.atPlant || h.allDone) return { l: L('SELESAI SHIFT', 'END SHIFT'), icon: 'flag', act: 'endShift' };
    return null;
  }
  function nextCard(h) {
    var cta = driverCta(h);
    if (!cta) return '';
    if (cta.done) return A.stateCard('success', L('Shift selesai. Lokasi tidak lagi dibagikan. Terima kasih!', 'Shift complete. Location is no longer shared. Thank you!'), null, L('Selesai untuk hari ini', 'Done for today'));
    var o = cta.o, ct = o ? contactOf(o) : null;
    var main = cta.go ? A.btn('primary', cta.l, cta.icon, { go: cta.go, rec: cta.rec, cls: 'btn-xl' }) : cta.act ? A.btn('primary', cta.l, cta.icon, { act: cta.act, val: cta.val, cls: 'btn-xl' }) : '';
    if (cta.wait) main = note(t(L('Supervisor sedang memutuskan masalah di stop ini. Tunggu instruksi di chat.', 'The supervisor is deciding the issue at this stop. Wait for instructions in chat.')), 'hourglass', 'warn') + A.btn('primary', 'Chat', 'message', { go: 'CHAT-001', rec: o.id, cls: 'btn-xl' });
    if (!o) {
      var tr = h.trip;
      return '<section class="card nx7"><span class="nx7-k">' + t(L('Langkah berikutnya', 'Next step')) + '</span><h2>' + ic('factory') + esc(E.D.PLANT.n) + '</h2>' +
        (tr.ret && !tr.atPlant ? '<p class="sub5">' + t(L('Dalam perjalanan kembali ke plant.', 'On the way back to the plant.')) + '</p>' : tr.atPlant ? '<p class="sub5">' + t(L('Tiba di plant ', 'Arrived at the plant ')) + esc(String(tr.atPlant).slice(11, 16)) + '</p>' : '<p class="sub5">' + t(L('Semua stop selesai.', 'All stops done.')) + '</p>') +
        (openMf(tr).length ? '<p>' + ic('clipboard') + openMf(tr).length + ' ' + t(L('manifest perlu diserahkan ke receiving', 'manifest(s) to hand over to receiving')) + '</p>' : '') + '<div class="nx7-a">' + main + '</div></section>';
    }
    return '<section class="card nx7' + (h.cur ? ' is-cur' : '') + '"><span class="nx7-k">' + t(h.cur ? L('Tugas sekarang', 'Current task') : L('Tugas berikutnya', 'Next task')) + '</span>' +
      '<div class="nx7-h">' + kindC(o.kind) + stC(o) + (o.pri !== 'normal' ? priC(o.pri) : '') + '</div><h2>' + pname(o.prop) + '</h2><p class="sub5">' + cname(o.cl) + ' · ' + esc((E.prop(o.prop) || {}).addr || '') + '</p>' +
      '<div class="nx7-m"><span>' + ic('clock') + '<b class="num">' + esc(o.win.join('–')) + '</b></span><span>' + ic('package') + o.bags + ' bag</span>' + (ct ? '<span>' + ic('user') + esc(ct.n) + '</span>' : '') + '</div>' +
      (o.st === 'ontheway' || ['assigned', 'ready'].indexOf(o.st) >= 0 ? '<div id="dm7-eta">' + etaBox(o) + '</div>' : '') + instr(o) +
      '<div class="nx7-a">' + main + '</div><div class="nx7-s">' + reach(ct) + A.btn('ghost', 'Chat', 'message', { go: 'CHAT-001', rec: o.id, cls: 'btn-sm' }) + A.btn('ghost', L('ADA MASALAH', 'REPORT ISSUE'), 'alert', { go: 'ISSUE-001', rec: o.id, cls: 'btn-sm' }) + '</div></section>';
  }
  V['DRIVER-MOB-001'] = {
    title: function () { return L('Hari Ini', 'Today'); },
    render: function () {
      var c0 = cx(), h = E.driverHome(c0);
      if (!E.myDriver(c0)) return A.stateCard('noperm', L('Layar ini khusus driver.', 'This screen is for drivers.'), A.backBtn('blue'));
      if (!h) return A.pageHead(L('Halo, ' + (c0.name || ''), 'Hello, ' + (c0.name || '')), esc(day(E.TODAY))) + trackBanner(null) + A.stateCard('empty', L('Belum ada tugas hari ini. Supervisor akan menugaskan rute.', 'No task today yet. The supervisor will assign a route.'));
      var tr = h.trip, v = E.vehicle(tr.veh), r = E.route(tr.route), d = E.driver(tr.drv), os = h.orders;
      var hello = '<div class="hi7"><div><h1>' + t(L('Halo, ', 'Hello, ')) + esc(d.short) + '</h1><p>' + esc(day(E.TODAY)) + ' · ' + esc(dts(E.TODAY)) + ' · ' + esc(tr.veh + ' ' + v.plate) + (r ? ' · ' + esc(r.n) : '') + '</p></div>' + liveC(E.liveStatus(tr)) + '</div>';
      var st = tiles([
        tile({ k: L('Pickup', 'Pickup'), v: h.pick }), tile({ k: L('Delivery', 'Delivery'), v: h.del }),
        tile({ k: L('Selesai', 'Done'), v: h.done + '/' + os.filter(function (o) { return o.st !== 'cancelled'; }).length }), tile({ k: L('Masalah', 'Issues'), v: h.issues, tone: h.issues ? 'warn' : '', href: h.issues ? href('ISSUE-001') : null })
      ], 'tls5-4 tls7-d');
      var list = '<ol class="ds7l">' + os.map(function (o, i) {
        var cur = h.cur && h.cur.id === o.id, nx = !h.cur && h.next && h.next.id === o.id, tg = stopTarget(o), lk = !isDone(o) && o.st !== 'cancelled';
        var inner = '<span class="ds7-n">' + (isDone(o) && o.st !== 'cancelled' ? ic('check') : i + 1) + '</span><span class="ds7-b"><b>' + pname(o.prop) + '</b><small>' + t(E.KIND[o.kind]) + ' · ' + esc(o.win.join('–')) + ' · ' + o.bags + ' bag</small></span>' + stC(o);
        return '<li class="ds7' + (cur ? ' is-cur' : nx ? ' is-next' : '') + (isDone(o) ? ' is-done' : '') + '">' + (lk ? '<a href="' + href(tg[0], tg[1]) + '">' + inner + '</a>' : '<span class="ds7-r">' + inner + '</span>') + '</li>';
      }).join('') + '</ol>';
      var nts = E.notifs(c0).slice(0, 4);
      var nt = nts.length ? card(L('Notifikasi', 'Notifications'), '<ul class="nt7">' + nts.map(function (n) { return '<li>' + ic((E.NOTIF[n.kind] || ['', 'bell'])[1]) + '<span><b>' + t((E.NOTIF[n.kind] || [L(n.kind, n.kind)])[0]) + '</b> ' + t(E.notifText(n)) + '<small>' + esc(when(n.at)) + '</small></span></li>'; }).join('') + '</ul>', { icon: 'bell' }) : '';
      return hello + trackBanner(tr) + nextCard(h) + st + card(L('Stop hari ini', 'Today\'s stops'), list, { icon: 'route', count: os.length, link: ['TIMELINE-001', L('Timeline', 'Timeline'), tr.id] }) + nt;
    },
    after: function () {
      var h = E.driverHome(cx()); if (!h || !h.focus) return;
      var id = h.focus.id;
      live('dm7-eta', function () { return etaBox(E.order(id)); }, 15);
    },
    act: {
      start: function (el) {
        var r = E.startTrip(cx(), el.getAttribute('data-val'));
        if (!r.ok) return fail(r);
        go('DRIVER-MOB-002', r.order.id); toastLater(L('Perjalanan dimulai. Lokasi dibagikan untuk operasional selama perjalanan.', 'Trip started. Location is shared for operations during the trip.'));
      },
      ret: function () { var r = E.returnToPlant(cx()); if (!r.ok) return fail(r); after(L('Kembali ke plant. Receiving melihat perkiraan kedatangan Anda.', 'Returning to the plant. Receiving sees your expected arrival.')); },
      plant: function () { var r = E.arriveAtPlant(cx()); if (!r.ok) return fail(r); after(L('Tiba di plant. Pelacakan lokasi berhenti. Serahkan manifest ke receiving.', 'Arrived at the plant. Location tracking stopped. Hand the manifest to receiving.')); },
      endShift: function () {
        dlg({ title: L('Selesai shift?', 'End the shift?'), icon: 'flag', sub: t(L('Lokasi berhenti dibagikan dan rute ditutup.', 'Location sharing stops and the route is closed.')), ok: L('SELESAI SHIFT', 'END SHIFT'),
          onOk: function () { var r = E.endShift(cx()); if (!r.ok) return r.msg; after(L('Shift selesai. Terima kasih!', 'Shift complete. Thank you!')); return true; } });
      }
    }
  };

  /* ================= NP-05 · DRIVER-MOB-002 Trip Detail ================= */
  function ownGate(c0, o) {
    if (!o) return A.stateCard('empty', L('Tugas tidak ditemukan.', 'Task not found.'), A.btn('blue', L('Ke Hari Ini', 'To Today'), 'calendar', { go: 'DRIVER-MOB-001' }));
    if (!E.ownsOrder(c0, o)) return A.stateCard('noperm', E.MSG.notyours, A.btn('blue', L('Ke Hari Ini', 'To Today'), 'calendar', { go: 'DRIVER-MOB-001' }));
    return null;
  }
  function weakNote(tr) {
    var p = E.position(tr);
    if (p && p.fresh !== 'live') return note(t(L('Koneksi internet lemah. Data tetap tersimpan di HP dan dikirim saat sinyal kembali.', 'Weak internet connection. Data stays on the phone and is sent when the signal is back.')), 'wifioff', 'warn');
    return '';
  }
  V['DRIVER-MOB-002'] = {
    title: function () { return L('Perjalanan', 'Trip'); },
    render: function (c) {
      var c0 = cx(), o = E.order(c.rec), g = ownGate(c0, o); if (g) return g;
      var tr = E.tripOf(o), p = E.prop(o.prop) || {}, ct = contactOf(o), pin = E.D.PINS[o.prop], pos = E.canSeeLocation(c0, tr) ? E.position(tr) : null;
      var cta;
      if (['assigned', 'ready'].indexOf(o.st) >= 0) cta = E.curOrder(tr) ? note(t(L('Selesaikan stop yang sedang berjalan dulu.', 'Finish the current stop first.')), 'info', 'info') : A.btn('primary', L('MULAI PERJALANAN', 'START TRIP'), 'play', { act: 'start', val: o.id, cls: 'btn-xl' });
      else if (o.st === 'ontheway') cta = A.btn('primary', L('SAYA SUDAH TIBA', 'I HAVE ARRIVED'), 'pin', { act: 'arrive', val: o.id, cls: 'btn-xl' });
      else if (o.st === 'arrived') cta = A.btn('primary', o.kind === 'pickup' ? L('MULAI PICKUP', 'START PICKUP') : L('MULAI DELIVERY', 'START DELIVERY'), o.kind === 'pickup' ? 'clipboard' : 'package', { act: 'begin', val: o.id, cls: 'btn-xl' });
      else if (o.st === 'inprogress') { var tg = stopTarget(o); cta = A.btn('primary', L('LANJUTKAN', 'CONTINUE'), 'clipboard', { go: tg[0], rec: tg[1], cls: 'btn-xl' }); }
      else if (o.st === 'issue') cta = note(t(L('Menunggu keputusan supervisor. Lihat chat untuk instruksi.', 'Waiting for the supervisor\'s decision. See chat for instructions.')), 'hourglass', 'warn');
      else cta = A.btn('primary', L('Ke Hari Ini', 'To Today'), 'calendar', { go: 'DRIVER-MOB-001', cls: 'btn-xl' });
      var mk = pos ? [{ trip: tr, p: pos, st: E.liveStatus(tr), n: T(L('Saya', 'Me')) }] : [];
      return '<div class="dm7">' + trackBanner(tr) + weakNote(tr) +
        '<section class="card dm7-h"><div class="nx7-h">' + kindC(o.kind) + stC(o) + (o.pri !== 'normal' ? priC(o.pri) : '') + '</div><h1>' + pname(o.prop) + '</h1><p class="sub5">' + cname(o.cl) + '</p><p>' + ic('pin') + esc(p.addr || '') + '</p>' +
        '<div class="nx7-m"><span>' + ic('clock') + t(L('Jendela ', 'Window ')) + '<b class="num">' + esc(o.win.join('–')) + '</b></span><span>' + ic('package') + o.bags + ' bag · ' + t(E.CAT[o.cat] || L(o.cat, o.cat)) + '</span></div>' +
        '<div id="dm2-eta">' + (['ontheway', 'assigned', 'ready'].indexOf(o.st) >= 0 ? etaBox(o, { big: true }) : '') + '</div></section>' +
        '<div class="dm7-cta">' + cta + '</div>' +
        card(L('Peta', 'Map'), map({ trips: [tr], fit: true, focus: tr.id, drivers: mk, dests: [{ p: E.loc(o.prop), n: E.propName(o.prop) }], stopLabels: false, labels: false }) + '<a class="btn btn-ghost" href="' + navUrl(o) + '" target="_blank" rel="noopener">' + ic('route') + '<span>' + t(L('Buka Navigasi', 'Open Navigation')) + '</span></a>', { icon: 'pin' }) +
        (pin ? note('<b>' + t(L('Titik ambil: ', 'Pickup point: ')) + esc(T(pin[0])) + '</b>', 'pin', 'info') : '') + instr(o) +
        card(L('Kontak di lokasi', 'Contact on site'), ct ? '<p><b>' + esc(ct.n) + '</b> · ' + esc(T(ct.pos)) + '</p>' + reach(ct, { big: true }) : A.empty(L('Belum ada kontak. Hubungi CS lewat chat.', 'No contact yet. Contact CS through chat.')), { icon: 'user' }) +
        '<div class="dm7-sec">' + A.btn('ghost', 'Chat', 'message', { go: 'CHAT-001', rec: o.id }) + A.btn('danger', L('ADA MASALAH', 'REPORT ISSUE'), 'alert', { go: 'ISSUE-001', rec: o.id }) + '</div></div>';
    },
    after: function (c) { var id = c.rec; live('dm2-eta', function () { var o = E.order(id); return o && ['ontheway', 'assigned', 'ready'].indexOf(o.st) >= 0 ? etaBox(o, { big: true }) : ''; }, 10); },
    act: {
      start: function (el) { var r = E.startTrip(cx(), el.getAttribute('data-val')); if (!r.ok) return fail(r); after(L('Perjalanan dimulai. Lokasi dibagikan untuk operasional.', 'Trip started. Location shared for operations.')); },
      arrive: function (el) {
        var r = E.arrive(cx(), el.getAttribute('data-val')); if (!r.ok) return fail(r);
        var o = r.order; go(o.kind === 'pickup' ? 'DRIVER-MOB-003' : 'POD-001', o.id); toastLater(L('Kedatangan tercatat ' + E.hm(E.now()) + '. Klien diberi tahu.', 'Arrival recorded ' + E.hm(E.now()) + '. Client notified.'));
      },
      begin: function (el) { var r = E.beginExec(cx(), el.getAttribute('data-val')); if (!r.ok) return fail(r); go(r.order.kind === 'pickup' ? 'DRIVER-MOB-003' : 'POD-001', r.order.id); }
    }
  };

  /* ================= NP-05 · DRIVER-MOB-003 Arrived / Pickup Execution ================= */
  V['DRIVER-MOB-003'] = {
    title: function () { return L('Pickup di Lokasi', 'Pickup on Site'); },
    render: function (c) {
      var c0 = cx(), o = E.order(c.rec), g = ownGate(c0, o); if (g) return g;
      if (o.kind !== 'pickup') { setTimeout(function () { go('POD-001', o.id); }, 0); return ''; }
      if (o.st === 'completed' || isDone(o)) return A.stateCard('success', L('Pickup ini sudah selesai.', 'This pickup is already complete.'), A.btn('primary', L('Tugas Berikutnya', 'Next Task'), 'arrow', { go: 'DRIVER-MOB-001' }) + A.btn('ghost', L('Lihat Bukti', 'View Evidence'), 'camera', { go: 'EVIDENCE-001', rec: o.id }));
      if (['arrived', 'inprogress'].indexOf(o.st) < 0) return A.stateCard('warning', L('Tekan SAYA SUDAH TIBA dulu di layar perjalanan.', 'Tap SAYA SUDAH TIBA on the trip screen first.'), A.btn('primary', L('Ke Perjalanan', 'To Trip'), 'truck', { go: 'DRIVER-MOB-002', rec: o.id }));
      var x = o.exec || {}, arrAt = E.evAt(o, 'arrived');
      return '<div class="dm7">' + weakNote(E.tripOf(o)) + '<section class="card dm7-h"><div class="nx7-h">' + kindC(o.kind) + stC(o) + '</div><h1>' + pname(o.prop) + '</h1><p class="sub5">' + t(L('Tiba ', 'Arrived ')) + esc(String(arrAt || '').slice(11, 16)) + ' · ' + t(L('estimasi ', 'estimate ')) + o.bags + ' bag</p></section>' +
        '<form class="card f6 f7d" id="f7p" onsubmit="return false">' +
        '<div class="f7d-r"><span class="f7d-l">' + t(L('Jumlah bag', 'Bags')) + ' <i>*</i></span>' + stepper('bags', x.bags || o.bags, L('bag', 'bags'), { min: 1, max: 99, big: true, label: L('Jumlah bag', 'Bags') }) + '</div>' +
        '<div class="f7d-r"><span class="f7d-l">' + t(L('Container / troli', 'Containers / trolleys')) + '</span>' + stepper('cont', x.cont || 0, '', { min: 0, max: 20, big: true, label: L('Container', 'Containers') }) + '</div>' +
        fld(L('Perkiraan berat (kg)', 'Estimated weight (kg)'), inp('kg', x.kg != null ? x.kg : (o.kg || ''), { num: true }), { wide: true, hint: t(L('Perkiraan saja. Berat pasti ditimbang di plant.', 'Estimate only. The exact weight is measured at the plant.')) }) +
        fld(L('Kategori', 'Category'), choice('cat', opts(E.CAT).map(function (z) { return [z[0], z[1]]; }), x.cat || o.cat, { cls: 'ch7-w' }), { wide: true }) +
        fld(L('Kondisi', 'Condition'), choice('cond', Object.keys(E.COND).map(function (k) { return [k, E.COND[k][0], k === 'good' ? 'checkc' : 'alert', E.COND[k][1]]; }), x.cond || 'good', { cls: 'ch7-w' }), { wide: true }) +
        fld(L('Barang khusus', 'Special item'), inp('special', x.special || '', { ph: L('Contoh: gaun pengantin, linen bernoda darah', 'Example: wedding dress, blood-stained linen') }), { wide: true }) +
        '<div class="f5 f5-w"><span>' + t(L('Foto', 'Photos')) + '</span>' + photoIn('pk', L('Ambil Foto', 'Take Photo'), { big: true }) + '</div>' +
        fld(L('Catatan', 'Notes'), area('notes', x.notes || '', L('Contoh: 1 bag basah dipisah', 'Example: 1 wet bag kept apart')), { wide: true }) +
        note(t(L('Tidak perlu menghitung item satu per satu. Hitung item dilakukan di receiving plant.', 'No need to count items one by one. Items are counted at plant receiving.')), 'info', 'info') +
        '<p class="dlg5-e" role="alert" id="f7p-e"></p></form>' +
        '<div class="dm7-cta abar7">' + A.btn('primary', L('SELESAIKAN PICKUP', 'COMPLETE PICKUP'), 'checkc', { act: 'save', val: o.id, cls: 'btn-xl' }) + '</div>' +
        '<div class="dm7-sec">' + A.btn('ghost', 'Chat', 'message', { go: 'CHAT-001', rec: o.id }) + A.btn('danger', L('ADA MASALAH', 'REPORT ISSUE'), 'alert', { go: 'ISSUE-001', rec: o.id }) + '</div></div>';
    },
    act: {
      save: function (el) {
        var id = el.getAttribute('data-val'), f = document.getElementById('f7p'), v = vals(f);
        var r = E.savePickup(cx(), id, { bags: num(v.bags), cont: num(v.cont) || 0, kg: v.kg === '' ? '' : num(v.kg), cat: v.cat, cond: v.cond, special: v.special, notes: v.notes, photos: photos('pk') });
        if (!r.ok) { document.getElementById('f7p-e').textContent = T(r.msg); return; }
        resetPh('pk'); go('EVIDENCE-001', id);
        if (r.diff) toastLater(L('Jumlah bag berbeda dari estimasi (' + (r.diff > 0 ? '+' : '') + r.diff + '). Tercatat untuk supervisor.', 'Bag count differs from the estimate (' + (r.diff > 0 ? '+' : '') + r.diff + '). Recorded for the supervisor.'), 'warn');
      }
    }
  };

  /* ================= NP-07 · EVIDENCE-001 Evidence Capture / Timeline ================= */
  V['EVIDENCE-001'] = {
    title: function () { return L('Bukti & Konfirmasi', 'Evidence & Confirmation'); },
    render: function (c) {
      var c0 = cx(), o = E.order(c.rec);
      if (!c.rec) return A.stateCard('empty', L('Buka bukti dari detail order atau tugas driver.', 'Open evidence from an order or a driver task.'), A.backBtn('blue'));
      if (!o) return A.stateCard('empty', L('Order tidak ditemukan.', 'Order not found.'), A.backBtn('blue'));
      var mine = E.ownsOrder(c0, o) && can('lg.drv.task');
      // Driver: confirm the pickup handover with the client PIC.
      if (mine && o.kind === 'pickup' && o.st === 'inprogress' && o.exec) {
        var ct = contactOf(o), x = o.exec;
        return '<div class="dm7"><section class="card dm7-h"><span class="nx7-k">' + t(L('Barang diserahkan', 'Items handed over')) + '</span><h1>' + pname(o.prop) + '</h1>' +
          kv([[L('Jumlah bag', 'Bags'), '<b class="num">' + x.bags + '</b>' + (x.cont ? ' + ' + x.cont + ' container' : '')], [L('Perkiraan berat', 'Estimated weight'), x.kg ? fmt.kg(x.kg) : '—'], [L('Kategori', 'Category'), t(E.CAT[x.cat] || L(x.cat, x.cat))], [L('Kondisi', 'Condition'), A.chip(E.COND[x.cond][1], E.COND[x.cond][0])], x.special ? [L('Barang khusus', 'Special item'), esc(x.special)] : null]) +
          '<p>' + A.btn('ghost', L('Ubah', 'Change'), 'edit', { go: 'DRIVER-MOB-003', rec: o.id, cls: 'btn-sm' }) + '</p></section>' +
          '<form class="card f6 f7d" id="f7e" onsubmit="return false"><h2 class="h5">' + ic('user') + t(L('PIC klien', 'Client PIC')) + '</h2><div class="f6-g">' + fld(L('Nama PIC', 'PIC name'), inp('pic', ct ? ct.n : ''), { req: true }) + fld(L('Jabatan', 'Position'), inp('picPos', ct ? T(ct.pos) : '')) + '</div>' +
          '<h2 class="h5">' + ic('sign') + t(L('Tanda tangan klien', 'Client signature')) + '</h2>' + sigPad('sg7e') +
          '<details class="nos7"><summary>' + t(L('Klien tidak bisa tanda tangan?', 'Client cannot sign?')) + '</summary>' + fld(L('Alasan', 'Reason'), inp('nosignReason', '', { ph: L('Contoh: PIC sedang rapat, diserahkan ke security', 'Example: PIC in a meeting, handed to security') }), { wide: true }) + '<div class="f5 f5-w"><span>' + t(L('Foto bukti', 'Photo evidence')) + ' <i>*</i></span>' + photoIn('ns', L('Ambil Foto', 'Take Photo'), { big: true, multi: false }) + '</div></details>' +
          '<p class="dlg5-e" role="alert" id="f7e-e"></p></form>' +
          note(t(L('Pickup selesai berarti cucian sudah di mobil. Receiving di plant tetap mengecek dan menerima secara terpisah.', 'Pickup complete means the laundry is in the van. Plant receiving still checks and receives separately.')), 'info', 'info') +
          '<div class="dm7-cta abar7">' + A.btn('primary', L('KONFIRMASI PENYERAHAN', 'CONFIRM HANDOVER'), 'checkc', { act: 'confirm', val: o.id, cls: 'btn-xl' }) + '</div></div>';
      }
      var evs = E.evidence(c0, o.id);
      if (!evs) return A.stateCard('noperm', E.MSG.scope, A.backBtn('blue'));
      var comp = E.evidenceComplete(o), mf = E.mfOf(o.id);
      var pics = evs.filter(function (e) { return e.img && !e.superseded; });
      var hd = '<section class="card c6-hd"><div class="c6-hd-m"><div class="c6-hd-t"><h1>' + t(L('Bukti ', 'Evidence ')) + '<span class="mono6">' + esc(o.id) + '</span> ' + kindC(o.kind) + stC(o) + '</h1><p>' + cname(o.cl) + ' · ' + pname(o.prop) + ' · ' + esc(day(o.date)) + ' ' + esc(o.win.join('–')) + '</p></div></div>' +
        '<div class="c6-hd-a">' + (open('ORDER-003') ? A.btn('ghost', L('Detail Order', 'Order Detail'), 'file', { go: 'ORDER-003', rec: o.id }) : '') + (mf && open('MANIFEST-001') ? A.btn('ghost', L('Manifest', 'Manifest'), 'clipboard', { go: 'MANIFEST-001', rec: mf.id }) : '') + (mine && !isDone(o) ? A.btn('ghost', L('Tambah Bukti', 'Add Evidence'), 'camera', { act: 'addEv', val: o.id }) : '') + '</div></section>';
      var chk = card(L('Kelengkapan bukti', 'Evidence completeness'), comp.ok ? note(t(L('Bukti lengkap: tiba, PIC/penerima, tanda tangan (atau foto + alasan) dan selesai.', 'Evidence complete: arrival, PIC/recipient, signature (or photo + reason) and completion.')), 'checkc', 'ok')
        : isDone(o) ? note(t(L('Bukti belum lengkap: ', 'Evidence incomplete: ')) + comp.miss.map(function (k) { return esc(T((E.EV_KIND[k] || [L(k, k)])[0])); }).join(', '), 'alert', 'warn') : note(t(L('Bukti dikumpulkan saat tugas berjalan.', 'Evidence is collected while the task runs.')), 'info', 'info'), { icon: 'filecheck' });
      var gal = pics.length ? card(L('Foto & tanda tangan', 'Photos & signatures'), '<div class="gl7">' + pics.map(function (e) { return '<figure>' + img(e.img, T((E.EV_KIND[e.kind] || [L(e.kind, e.kind)])[0])) + '<figcaption>' + t((E.EV_KIND[e.kind] || [L(e.kind, e.kind)])[0]) + ' · ' + esc(String(e.at).slice(11, 16)) + '</figcaption></figure>'; }).join('') + '</div>', { icon: 'image', count: pics.length }) : '';
      return hd + '<div class="g7-2"><div class="g7-c">' + chk + card(L('Timeline bukti', 'Evidence timeline'), G.evList(evs), { icon: 'history', count: evs.length }) + '</div><div class="g7-c">' + gal +
        (o.pod ? card('POD', kv([[L('Penerima', 'Recipient'), esc(o.pod.recv)], [L('Bag', 'Bags'), o.pod.bags + (o.pod.pkg ? ' · ' + o.pod.pkg + ' paket' : '')], [L('Waktu', 'Time'), esc(when(o.pod.at))]]), { icon: 'sign' }) : '') +
        note(t(L('Bukti yang sudah selesai tidak bisa diubah. Koreksi dibuat sebagai catatan baru dengan alasan.', 'Completed evidence cannot be edited. A correction is a new record with a reason.')), 'lock', 'info') + '</div></div>';
    },
    after: function () { sigBind('sg7e'); },
    act: acts({
      amend: function (el) { G.amendDlg(el.getAttribute('data-val')); },
      confirm: function (el) {
        var id = el.getAttribute('data-val'), f = document.getElementById('f7e'), v = vals(f), sg = sigVal('sg7e'), ph = photos('ns')[0] || null;
        var r = E.confirmPickup(cx(), id, { pic: v.pic, picPos: v.picPos, sign: sg, nosignReason: v.nosignReason, photo: ph });
        if (!r.ok) { document.getElementById('f7e-e').textContent = T(r.msg); var d = f.querySelector('details'); if (r.code === 'sign' && !sg && d) d.open = true; return; }
        resetPh('ns');
        var h = E.driverHome(cx()), nx = h && h.next;
        A.success(L('Pickup selesai.', 'Pickup complete.'), nx ? { l: L('Tugas Berikutnya', 'Next Task'), go: 'DRIVER-MOB-001', icon: 'arrow' } : { l: L('Ke Hari Ini', 'To Today'), go: 'DRIVER-MOB-001', icon: 'calendar' }, null,
          t(L('Manifest ', 'Manifest ')) + '<b class="mono6">' + esc(r.manifest.id) + '</b> · ' + r.manifest.bags + ' bag ' + t(L('dalam perjalanan ke plant. Klien sudah diberi tahu.', 'on the way to the plant. The client was notified.')));
      },
      addEv: function (el) {
        var id = el.getAttribute('data-val'); resetPh('ae');
        dlg({ title: L('Tambah bukti', 'Add evidence'), icon: 'camera', body: '<div class="f5 f5-w"><span>' + t(L('Foto', 'Photo')) + '</span>' + photoIn('ae', L('Ambil Foto', 'Take Photo'), { multi: false }) + '</div>' + fld(L('Catatan', 'Note'), area('note', ''), { wide: true }),
          onOk: function (v) { var ph = photos('ae')[0]; if (!ph && !v.note) return L('Pilih foto atau tulis catatan.', 'Choose a photo or write a note.'); var r = ph ? E.addEvidence(cx(), id, 'photo', v.note || null, ph) : E.addEvidence(cx(), id, 'note', v.note); if (!r.ok) return r.msg; resetPh('ae'); after(L('Bukti ditambahkan.', 'Evidence added.')); return true; } });
      }
    })
  };

  /* ================= NP-07 · POD-001 Delivery Confirmation (two steps) ================= */
  var POD = {};
  V['POD-001'] = {
    title: function () { return L('Konfirmasi Delivery', 'Delivery Confirmation'); },
    render: function (c) {
      var c0 = cx(), o = E.order(c.rec), g = ownGate(c0, o); if (g) return g;
      if (o.kind !== 'delivery') { setTimeout(function () { go('DRIVER-MOB-003', o.id); }, 0); return ''; }
      if (isDone(o)) return A.stateCard('success', L('Delivery ini sudah selesai.', 'This delivery is already complete.'), A.btn('primary', L('Tugas Berikutnya', 'Next Task'), 'arrow', { go: 'DRIVER-MOB-001' }) + A.btn('ghost', L('Lihat Bukti', 'View Evidence'), 'camera', { go: 'EVIDENCE-001', rec: o.id }));
      if (['arrived', 'inprogress'].indexOf(o.st) < 0) return A.stateCard('warning', L('Tekan SAYA SUDAH TIBA dulu di layar perjalanan.', 'Tap SAYA SUDAH TIBA on the trip screen first.'), A.btn('primary', L('Ke Perjalanan', 'To Trip'), 'truck', { go: 'DRIVER-MOB-002', rec: o.id }));
      var step = c.q.step === '2' && POD[o.id] ? 2 : 1, ct = contactOf(o), d = POD[o.id] || {};
      var steps = '<ol class="stp6 stp7 stp7-2"><li class="' + (step === 1 ? 'now' : 'done') + '"><span class="stp6-n">' + (step > 1 ? ic('check') : 1) + '</span><span>' + t(L('Serahkan', 'Hand over')) + '</span></li><li class="' + (step === 2 ? 'now' : '') + '"><span class="stp6-n">2</span><span>' + t(L('Tanda tangan', 'Signature')) + '</span></li></ol>';
      var head = '<section class="card dm7-h"><div class="nx7-h">' + kindC(o.kind) + stC(o) + '</div><h1>' + pname(o.prop) + '</h1><p class="sub5">' + t(L('Rencana ', 'Planned ')) + '<b>' + o.bags + ' bag</b> · ' + esc(E.svcName(o.svc)) + '</p>' + steps + '</section>';
      if (step === 1) {
        return '<div class="dm7">' + weakNote(E.tripOf(o)) + head + '<form class="card f6 f7d" id="f7d" onsubmit="return false">' +
          fld(L('Nama penerima', 'Recipient name'), inp('recv', d.recv || (ct ? ct.n : '')), { req: true, wide: true }) +
          '<div class="f7d-r"><span class="f7d-l">' + t(L('Bag diserahkan', 'Bags handed over')) + ' <i>*</i></span>' + stepper('bags', d.bags != null ? d.bags : o.bags, L('bag', 'bags'), { min: 0, max: 99, big: true, label: L('Bag diserahkan', 'Bags handed over') }) + '</div>' +
          '<div class="f7d-r"><span class="f7d-l">' + t(L('Paket / gantungan', 'Packages / hangers')) + '</span>' + stepper('pkg', d.pkg || 0, '', { min: 0, max: 99, big: true, label: L('Paket', 'Packages') }) + '</div>' +
          fld(L('Kondisi', 'Condition'), choice('cond', Object.keys(E.COND).map(function (k) { return [k, E.COND[k][0], k === 'good' ? 'checkc' : 'alert', E.COND[k][1]]; }), d.cond || 'good', { cls: 'ch7-w' }), { wide: true }) +
          '<div class="f5 f5-w"><span>' + t(L('Foto bukti pengiriman', 'Delivery photo')) + ' <i>*</i></span>' + photoIn('pod', L('Ambil Foto', 'Take Photo'), { big: true, multi: false }) + '</div>' +
          fld(L('Catatan / alasan selisih', 'Note / reason for a difference'), area('issue', d.issue || '', L('Wajib bila jumlah bag berbeda', 'Required when the bag count differs')), { wide: true }) +
          '<p class="dlg5-e" role="alert" id="f7d-e"></p></form><div class="dm7-cta abar7">' + A.btn('primary', L('SERAHKAN & KONFIRMASI', 'HAND OVER & CONFIRM'), 'arrow', { act: 'step1', val: o.id, cls: 'btn-xl' }) + '</div>' +
          '<div class="dm7-sec">' + A.btn('ghost', 'Chat', 'message', { go: 'CHAT-001', rec: o.id }) + A.btn('danger', L('ADA MASALAH', 'REPORT ISSUE'), 'alert', { go: 'ISSUE-001', rec: o.id }) + '</div></div>';
      }
      return '<div class="dm7">' + head + '<section class="card">' + kv([[L('Penerima', 'Recipient'), '<b>' + esc(d.recv) + '</b>'], [L('Bag', 'Bags'), d.bags + (d.pkg ? ' · ' + d.pkg + ' paket' : '') + (d.bags !== o.bags ? ' ' + A.chip('warn', L('beda dari rencana ' + o.bags, 'differs from plan ' + o.bags)) : '')], [L('Kondisi', 'Condition'), A.chip(E.COND[d.cond][1], E.COND[d.cond][0])], [L('Foto', 'Photo'), img(d.photo, 'POD')]]) +
        '<p>' + A.btn('ghost', L('Ubah', 'Change'), 'edit', { go: 'POD-001', rec: o.id, cls: 'btn-sm' }) + '</p></section>' +
        '<section class="card"><h2 class="h5">' + ic('sign') + t(L('Tanda tangan penerima', 'Recipient signature')) + '</h2>' + sigPad('sg7d') + '<p class="dlg5-e" role="alert" id="f7d2-e"></p></section>' +
        '<div class="dm7-cta abar7">' + A.btn('primary', L('SELESAIKAN DELIVERY', 'COMPLETE DELIVERY'), 'checkc', { act: 'finish', val: o.id, cls: 'btn-xl' }) + '</div></div>';
    },
    after: function () { sigBind('sg7d'); },
    act: {
      step1: function (el) {
        var id = el.getAttribute('data-val'), o = E.order(id), v = vals(document.getElementById('f7d')), e = document.getElementById('f7d-e'), ph = photos('pod')[0] || (POD[id] && POD[id].photo);
        var b = num(v.bags);
        if (!v.recv) { e.textContent = T(L('Isi nama penerima.', 'Enter the recipient name.')); return; }
        if (b == null || isNaN(b) || b < 0) { e.textContent = T(L('Isi jumlah bag yang diserahkan.', 'Enter the bags handed over.')); return; }
        if (b !== o.bags && !v.issue) { e.textContent = T(L('Jumlah bag berbeda dari rencana (' + o.bags + '). Tulis alasannya.', 'Bag count differs from the plan (' + o.bags + '). Give the reason.')); return; }
        if (!ph) { e.textContent = T(L('Ambil foto bukti pengiriman.', 'Take a delivery photo.')); return; }
        if (o.st === 'arrived') E.beginExec(cx(), id);
        POD[id] = { recv: v.recv, bags: b, pkg: num(v.pkg) || 0, cond: v.cond || 'good', issue: v.issue, photo: ph }; resetPh('pod');
        go('POD-001', id, { step: '2' });
      },
      finish: function (el) {
        var id = el.getAttribute('data-val'), d = POD[id], sg = sigVal('sg7d');
        if (!sg) { document.getElementById('f7d2-e').textContent = T(L('Minta tanda tangan penerima.', 'Ask for the recipient signature.')); return; }
        var r = E.confirmDelivery(cx(), id, Object.assign({}, d, { sign: sg }));
        if (!r.ok) { document.getElementById('f7d2-e').textContent = T(r.msg); return; }
        delete POD[id];
        A.success(L('Delivery selesai.', 'Delivery complete.'), { l: L('Tugas Berikutnya', 'Next Task'), go: 'DRIVER-MOB-001', icon: 'arrow' }, null,
          esc(d.recv) + ' · ' + d.bags + ' bag · ' + esc(E.hm(E.now())) + '. ' + t(L('Klien menerima bukti pengiriman.', 'The client receives the proof of delivery.')) + (d.bags !== E.order(id).bags ? ' ' + t(L('Selisih bag dikirim ke supervisor.', 'The bag difference went to the supervisor.')) : ''));
      }
    }
  };

  /* ================= NP-06 · MANIFEST-001 Manifest Detail ================= */
  function bagFlags(b) { return (b.special ? A.chip('appr', L('Khusus', 'Special'), 'star') : '') + (b.damaged ? A.chip('crit', L('Rusak', 'Damaged')) : '') + (b.wet ? A.chip('warn', L('Basah', 'Wet'), 'droplet') : '') + (b.scan ? A.chip('ok', L('Discan', 'Scanned'), 'scan') : ''); }
  function bagC(b) { var x = E.BAG_ST[b.st] || ['', 'mute']; return A.chip(x[1], x[0]); }
  function barcode(code) {
    var s = String(code), x = 4, bars = '';
    for (var i = 0; i < s.length; i++) { var n = s.charCodeAt(i); for (var k = 0; k < 4; k++) { var w = 1 + ((n >> k) & 1) * 2; if (k % 2 === 0) bars += '<rect x="' + x + '" y="4" width="' + w + '" height="44"/>'; x += w + 1; } }
    return '<svg class="bc7" viewBox="0 0 ' + (x + 4) + ' 52" role="img" aria-label="' + esc(code) + '">' + bars + '</svg><span class="mono6 bc7-t">' + esc(code) + '</span>';
  }
  function mfList(c0, q) {
    var list = E.manifests(c0, { st: q.st });
    return A.pageHead(null, t(L('Manifest dibuat otomatis saat pickup dikonfirmasi. Setiap perubahan bag membuat versi baru.', 'A manifest is created automatically when a pickup is confirmed. Every bag change makes a new version.')), A.btn('ghost', L('Pelacakan Bag', 'Bag Tracking'), 'package', { go: 'BAG-001' })) +
      A.filters([{ k: 'st', l: 'Status', opts: opts(E.MF_ST) }], { force: true }) +
      card(L('Manifest', 'Manifests'), A.list(list, [
        { h: 'Manifest', v: function (m) { return '<b class="mono6">' + esc(m.id) + '</b><small class="sub5">v' + (m.ver || 1) + '</small>'; } },
        { h: L('Klien · Property', 'Client · Property'), v: function (m) { var o = E.order(m.ord); return '<b>' + cname(o.cl) + '</b><small class="sub5">' + pname(o.prop) + '</small>'; } },
        { h: L('Driver', 'Driver'), v: function (m) { var tr = E.trip(m.trip); return tr ? esc(E.first(tr.drv)) + '<small class="sub5">' + esc(tr.veh) + '</small>' : '—'; } },
        { h: L('Pickup', 'Pickup'), cls: 'num', v: function (m) { return esc(when(m.pickAt)); } }, { h: L('Bag', 'Bags'), cls: 'num', v: function (m) { return m.bags + (m.cont ? ' + ' + m.cont : '') + '<small class="sub5">' + (m.kg || 0) + ' kg</small>'; } },
        { h: 'Status', v: function (m) { return mfC(m.st); } }
      ], function (m) { var o = E.order(m.ord); return { t: '<span class="mono6">' + esc(m.id) + '</span>', r: m.bags + ' bag', s: pname(o.prop) + ' · ' + esc(when(m.pickAt)), chip: mfC(m.st) }; }, function (m) { return href('MANIFEST-001', m.id); }, { empty: L('Belum ada manifest.', 'No manifest yet.') }), { icon: 'clipboard', count: list.length });
  }
  V['MANIFEST-001'] = {
    title: function (rec) { return rec ? L('Manifest ' + rec, 'Manifest ' + rec) : L('Manifest', 'Manifests'); },
    render: function (c) {
      var c0 = cx();
      if (!c.rec) return mfList(c0, c.q);
      var m = E.manifest(c.rec); if (!m) return A.stateCard('empty', L('Manifest tidak ditemukan.', 'Manifest not found.'), A.backBtn('blue'));
      var o = E.order(m.ord); if (!E.canSeeOrder(c0, o) && !E.ownsOrder(c0, o)) return A.stateCard('noperm', E.MSG.scope, A.backBtn('blue'));
      var tr = E.trip(m.trip), rc = E.reconcile(m.id), bags = E.state().bags.filter(function (b) { return b.mf === m.id; }), edit = (can('lg.manifest.edit') || (tr && E.ownsOrder(c0, o))) && m.st !== 'received';
      var b = [];
      if (edit) b.push(A.btn('primary', L('Scan Bag', 'Scan Bag'), 'scan', { act: 'scan', val: m.id }), A.btn('ghost', L('Tambah Bag', 'Add Bag'), 'plus', { act: 'add', val: m.id }), A.btn('ghost', L('Tandai Bag', 'Mark Bag'), 'tag', { act: 'mark', val: m.id }));
      if (open('HANDOVER-001') && ['arrived', 'discrepancy', 'intransit'].indexOf(m.st) >= 0) b.push(A.btn('ghost', L('Handover', 'Handover'), 'filecheck', { go: 'HANDOVER-001', rec: m.id }));
      var hd = '<section class="card c6-hd"><div class="c6-hd-m"><div class="c6-hd-t"><h1><span class="mono6">' + esc(m.id) + '</span> ' + mfC(m.st) + ' <small class="sub5">v' + (m.ver || 1) + '</small></h1><p><b>' + cname(o.cl) + '</b> · ' + pname(o.prop) + ' · ' + (open('ORDER-003') ? ordLink(o.id) : '<span class="mono6">' + esc(o.id) + '</span>') + '</p></div></div>' + (b.length ? '<div class="c6-hd-a">' + b.join('') + '</div>' : '') + '</section>';
      var strip = tiles([
        tile({ k: L('Diambil (pickup)', 'Picked up'), v: rc.pick, s: m.bags + ' bag' + (m.cont ? ' + ' + m.cont + ' container' : '') }),
        tile({ k: L('Tiba di plant', 'Arrived at plant'), v: rc.arr == null ? '—' : rc.arr, s: rc.arr == null ? t(L('belum dihitung', 'not counted yet')) : rc.match ? t(L('cocok', 'matches')) : t(L('selisih ', 'difference ')) + rc.diff, tone: rc.arr != null && !rc.match ? 'crit' : rc.match ? 'ok' : '' }),
        tile({ k: L('Discan', 'Scanned'), v: rc.scanned + '/' + rc.live, s: t(L('QR / barcode / RFID siap', 'QR / barcode / RFID ready')) }),
        tile({ k: L('Perkiraan berat', 'Estimated weight'), v: (m.kg || 0) + ' kg', s: t(E.CAT[m.cat] || L(m.cat, m.cat)) })
      ], 'tls5-4');
      var info = card(L('Data manifest', 'Manifest data'), kv([[L('Order', 'Order'), '<span class="mono6">' + esc(o.id) + '</span> · ' + t(E.KIND[o.kind])], [L('Driver', 'Driver'), tr ? emp(tr.drv) : '—'], [L('Kendaraan', 'Vehicle'), tr ? esc(tr.veh + ' · ' + E.vehicle(tr.veh).plate) : '—'], [L('Waktu pickup', 'Pickup time'), esc(when(m.pickAt))],
        [L('Barang khusus', 'Special items'), T(m.special) ? esc(T(m.special)) : '—'], [L('Catatan', 'Notes'), T(m.notes) ? esc(T(m.notes)) : '—'],
        m.ho ? [L('Handover', 'Handover'), (m.ho.count != null ? m.ho.count + ' bag · ' + t(E.COND[m.ho.cond || 'good'][0]) : '—') + '<small class="sub5">' + t(L('Driver: ', 'Driver: ')) + (m.ho.drv ? esc(String(m.ho.drv).slice(11, 16)) : '—') + ' · ' + t(L('Receiving: ', 'Receiving: ')) + (m.ho.rcv ? esc(String(m.ho.rcv).slice(11, 16)) : '—') + '</small>'] : null]) +
        (m.st === 'discrepancy' ? note(t(L('Selisih handover: ', 'Handover difference: ')) + esc(T(m.ho.reason) || '') + (m.ho.issue && open('ISSUE-002') ? ' · ' + lnk('ISSUE-002', m.ho.issue, esc(m.ho.issue)) : ''), 'alert', 'crit') : ''), { icon: 'clipboard' });
      var bl = A.list(bags, [
        { h: 'Bag', v: function (x) { return '<b class="mono6">' + esc(x.id) + '</b><small class="sub5 mono6">' + esc(x.code) + '</small>'; } }, { h: L('Jenis', 'Type'), v: function (x) { return x.kind === 'container' ? t(L('Container', 'Container')) : 'Bag'; } },
        { h: 'Status', v: function (x) { return bagC(x); } }, { h: L('Tanda', 'Flags'), v: function (x) { return bagFlags(x) || '<span class="t6-mute">—</span>'; } }
      ], function (x) { return { t: '<span class="mono6">' + esc(x.id) + '</span>', r: x.kind === 'container' ? 'Container' : 'Bag', s: '<span class="mono6">' + esc(x.code) + '</span>', chip: bagC(x) + bagFlags(x) }; }, function (x) { return href('BAG-001', x.id); });
      var hist = card(L('Versi & perubahan', 'Versions & changes'), m.hist && m.hist.length ? '<ol class="tl6">' + m.hist.slice().reverse().map(function (h) { return '<li class="tl6-i"><span class="tl6-d"></span><div><b>' + esc(h[0]) + (h[3] ? ' · ' + esc(h[3]) : '') + '</b><small>' + esc(when(h[1])) + ' · ' + emp(h[2]) + '</small>' + (h[4] ? '<span class="tl6-r">' + esc(h[4]) + '</span>' : '') + '</div></li>'; }).join('') + '</ol>' : A.empty(L('Versi 1, belum ada perubahan.', 'Version 1, no change yet.')), { icon: 'history' });
      return hd + strip + '<div class="g7-2"><div class="g7-c">' + card(L('Daftar bag', 'Bag list'), bl, { icon: 'package', count: bags.length }) + '</div><div class="g7-c">' + info + hist + '</div></div>';
    },
    act: {
      scan: function (el) {
        var id = el.getAttribute('data-val'), next = E.state().bags.filter(function (b) { return b.mf === id && !b.scan && b.st !== 'removed'; })[0];
        dlg({ title: L('Scan bag', 'Scan bag'), icon: 'scan', sub: t(L('Arahkan kamera ke QR / barcode, atau ketik kodenya.', 'Point the camera at the QR / barcode, or type the code.')),
          body: fld(L('Kode bag', 'Bag code'), inp('code', '', { ph: next ? L('Contoh: ' + next.code, 'Example: ' + next.code) : '' }), { req: true, wide: true }) + (next ? '<p class="sub5">' + t(L('Demo: kode bag berikutnya yang belum discan ', 'Demo: the next unscanned bag code ')) + '<b class="mono6">' + esc(next.code) + '</b></p>' : ''),
          onOk: function (v) { var r = E.bagAction(cx(), id, 'scan', { code: v.code }); if (!r.ok) return r.msg; after(L(r.bag.id + ' discan.', r.bag.id + ' scanned.')); return true; } });
      },
      add: function (el) {
        var id = el.getAttribute('data-val');
        dlg({ title: L('Tambah bag', 'Add bag'), icon: 'plus', body: fld(L('Jenis', 'Type'), sel('kind', [['bag', 'Bag'], ['container', L('Container', 'Container')]], 'bag'), { wide: true }) + fld(L('Alasan', 'Reason'), inp('reason', ''), { req: true, wide: true }),
          onOk: function (v) { var r = E.bagAction(cx(), id, 'add', { kind: v.kind, reason: v.reason }); if (!r.ok) return r.msg; after(L('Bag ditambahkan, manifest versi ' + r.manifest.ver + '.', 'Bag added, manifest version ' + r.manifest.ver + '.')); return true; } });
      },
      mark: function (el) {
        var id = el.getAttribute('data-val'), bags = E.state().bags.filter(function (b) { return b.mf === id && b.st !== 'removed'; });
        dlg({ title: L('Tandai bag', 'Mark bag'), icon: 'tag',
          body: fld('Bag', sel('bag', bags.map(function (b) { return [b.id, b.id + ' · ' + T(E.BAG_ST[b.st][0])]; }), bags[0] && bags[0].id), { req: true, wide: true }) +
            fld(L('Tindakan', 'Action'), sel('act', [['special', L('Barang khusus (ya/tidak)', 'Special item (on/off)')], ['damaged', L('Bag rusak', 'Damaged bag')], ['missing', L('Bag hilang', 'Missing bag')], ['remove', L('Lepas dari manifest', 'Remove from manifest')]], 'special'), { req: true, wide: true }) +
            fld(L('Alasan', 'Reason'), inp('reason', ''), { wide: true, hint: t(L('Wajib untuk rusak, hilang dan lepas.', 'Required for damaged, missing and remove.')) }),
          onOk: function (v) { var r = E.bagAction(cx(), id, v.act, { bag: v.bag, reason: v.reason }); if (!r.ok) return r.msg; after(v.act === 'missing' ? L('Bag ditandai hilang. Supervisor menerima masalah ini.', 'Bag marked missing. The supervisor receives this issue.') : L('Bag diperbarui, manifest versi ' + r.manifest.ver + '.', 'Bag updated, manifest version ' + r.manifest.ver + '.'), v.act === 'missing' ? 'warn' : null); return true; } });
      }
    }
  };

  /* ================= NP-06 · BAG-001 Bag Tracking ================= */
  V['BAG-001'] = {
    title: function (rec) { return rec ? L('Bag ' + rec, 'Bag ' + rec) : null; },
    render: function (c) {
      var c0 = cx(), q = c.q;
      if (c.rec) {
        var b = E.bag(c.rec); if (!b) return A.stateCard('empty', L('Bag tidak ditemukan.', 'Bag not found.'), A.backBtn('blue'));
        var o = E.order(b.ord); if (!E.canSeeOrder(c0, o) && !E.ownsOrder(c0, o)) return A.stateCard('noperm', E.MSG.scope, A.backBtn('blue'));
        var m = E.manifest(b.mf);
        return '<section class="card c6-hd"><div class="c6-hd-m"><div class="c6-hd-t"><h1><span class="mono6">' + esc(b.id) + '</span> ' + bagC(b) + bagFlags(b) + '</h1><p>' + cname(b.cl) + ' · ' + pname(b.prop) + '</p></div></div><div class="c6-hd-a">' + A.btn('ghost', L('Manifest', 'Manifest'), 'clipboard', { go: 'MANIFEST-001', rec: b.mf }) + '</div></section>' +
          '<div class="g7-2"><div class="g7-c">' + card(L('Data bag', 'Bag data'), kv([[L('Kode scan', 'Scan code'), barcode(b.code)], [L('Jenis', 'Type'), b.kind === 'container' ? t(L('Container', 'Container')) : 'Bag'], [L('Kategori', 'Category'), t(E.CAT[b.cat] || L(b.cat, b.cat))], ['Manifest', '<span class="mono6">' + esc(b.mf) + '</span> ' + mfC(m.st)], [L('Order', 'Order'), '<span class="mono6">' + esc(b.ord) + '</span>'], [L('Diambil', 'Picked up'), esc(when(b.at))], [L('Terakhir discan', 'Last scanned'), b.scan ? esc(when(b.scan)) : '—']]) +
            note(t(L('Struktur siap untuk QR, barcode atau RFID. Prototipe memakai kode teks.', 'Ready for QR, barcode or RFID. The prototype uses a text code.')), 'scan', 'info'), { icon: 'package' }) + '</div><div class="g7-c">' +
          card(L('Riwayat bag', 'Bag history'), b.hist && b.hist.length ? '<ol class="tl6">' + b.hist.slice().reverse().map(function (h) { return '<li class="tl6-i"><span class="tl6-d"></span><div><b>' + esc(h[0]) + '</b><small>' + esc(when(h[1])) + ' · ' + emp(h[2]) + '</small>' + (h[3] ? '<span class="tl6-r">' + esc(h[3]) + '</span>' : '') + '</div></li>'; }).join('') + '</ol>' : A.empty(L('Belum ada perubahan sejak pickup.', 'No change since pickup.')), { icon: 'history' }) + '</div></div>';
      }
      var all = E.bags(c0, {}), list = E.bags(c0, { st: q.st, q: q.q });
      var strip = tiles(['intransit', 'arrived', 'received', 'missing'].map(function (k) { return tile({ k: E.BAG_ST[k][0], v: all.filter(function (b) { return b.st === k; }).length, tone: k === 'missing' && all.some(function (b) { return b.st === 'missing'; }) ? 'crit' : '', href: qhref({ st: q.st === k ? null : k }) }); }), 'tls5-4');
      return A.pageHead(null, t(L('Setiap bag punya ID dan kode scan dari pickup sampai receiving.', 'Every bag has an ID and a scan code from pickup to receiving.')), A.btn('ghost', L('Daftar Manifest', 'Manifest List'), 'clipboard', { go: 'MANIFEST-001' })) + strip +
        A.filters([{ k: 'st', l: 'Status', opts: opts(E.BAG_ST) }], { search: L('Cari bag, kode, order atau property', 'Search bag, code, order or property'), force: true }) +
        card(L('Bag', 'Bags'), A.list(list, [
          { h: 'Bag', v: function (x) { return '<b class="mono6">' + esc(x.id) + '</b><small class="sub5 mono6">' + esc(x.code) + '</small>'; } }, { h: L('Order · Property', 'Order · Property'), v: function (x) { return '<span class="mono6">' + esc(x.ord) + '</span><small class="sub5">' + pname(x.prop) + '</small>'; } },
          { h: L('Klien', 'Client'), v: function (x) { return cname(x.cl); } }, { h: 'Manifest', v: function (x) { return '<span class="mono6">' + esc(x.mf) + '</span>'; } },
          { h: 'Status', v: function (x) { return bagC(x); } }, { h: L('Tanda', 'Flags'), v: function (x) { return bagFlags(x) || '<span class="t6-mute">—</span>'; } }
        ], function (x) { return { t: '<span class="mono6">' + esc(x.id) + '</span>', r: esc(x.mf), s: pname(x.prop), chip: bagC(x) + bagFlags(x) }; }, function (x) { return href('BAG-001', x.id); }, { empty: L('Tidak ada bag yang cocok.', 'No matching bag.') }), { icon: 'package', count: list.length });
    }
  };

  /* ================= NP-08 · ISSUE-001 Report Issue (ADA MASALAH) ================= */
  V['ISSUE-001'] = {
    title: function () { return L('Ada Masalah', 'Report Issue'); },
    render: function (c) {
      var c0 = cx(), o = c.rec ? E.order(c.rec) : null, drv = E.myDriver(c0);
      if (c.rec && !o) return A.stateCard('empty', L('Order tidak ditemukan.', 'Order not found.'), A.backBtn('blue'));
      if (o && drv && !E.ownsOrder(c0, o)) return A.stateCard('noperm', E.MSG.notyours, A.backBtn('blue'));
      var choices;
      if (!o) {
        var src = drv ? (E.myTrip(c0) ? E.tripOrders(E.myTrip(c0)) : []) : E.orders(c0, { date: E.TODAY });
        choices = src.filter(function (x) { return x.st !== 'cancelled'; }).map(function (x) { return [x.id, x.id + ' · ' + E.propName(x.prop) + ' · ' + x.win[0]]; });
      }
      var mine = drv ? E.issues(c0, {}).filter(function (i) { return i.drv === drv && (i.at || '').slice(0, 10) === E.TODAY; }) : [];
      var types = '<div class="it7" role="radiogroup" aria-label="' + t(L('Jenis masalah', 'Issue type')) + '">' + Object.keys(E.ISSUE_TYPES).map(function (k) { var x = E.ISSUE_TYPES[k]; return '<label class="it7-i it7-' + x[1] + '"><input type="radio" name="type" value="' + k + '"><span>' + ic(x[2]) + '<b>' + t(x[0]) + '</b></span></label>'; }).join('') + '</div>';
      return '<div class="dm7">' + (o ? '<section class="card dm7-h"><div class="nx7-h">' + kindC(o.kind) + stC(o) + '</div><h1>' + pname(o.prop) + '</h1><p class="sub5"><span class="mono6">' + esc(o.id) + '</span> · ' + esc(o.win.join('–')) + '</p></section>' : '') +
        '<form class="card f6 f7d" id="f7i" onsubmit="return false">' + (o ? '' : fld(L('Tugas / order', 'Task / order'), sel('ord', [['', L('Tidak terkait order (mis. kendaraan)', 'Not linked to an order (e.g. vehicle)')]].concat(choices), ''), { wide: true })) +
        '<h2 class="h5">' + ic('alert') + t(L('1. Pilih alasan', '1. Choose the reason')) + ' <i>*</i></h2>' + types +
        '<h2 class="h5">' + ic('camera') + t(L('2. Foto', '2. Photo')) + '</h2>' + photoIn('is', L('Ambil Foto', 'Take Photo'), { big: true, multi: false }) +
        '<h2 class="h5">' + ic('edit') + t(L('3. Catatan', '3. Notes')) + '</h2>' + area('note', '', L('Ceritakan singkat apa yang terjadi', 'Briefly describe what happened')) +
        '<div class="f7d-r"><span class="f7d-l">' + t(L('Perkiraan terlambat (menit)', 'Expected delay (min)')) + '</span>' + stepper('delay', 0, L('mnt', 'min'), { min: 0, max: 240, big: true, label: L('Perkiraan terlambat', 'Expected delay') }) + '</div>' +
        '<h2 class="h5">' + ic('flag') + t(L('4. Tindakan', '4. Action')) + '</h2>' + choice('action', Object.keys(E.ISSUE_ACT).map(function (k) { return [k, E.ISSUE_ACT[k][0], E.ISSUE_ACT[k][1]]; }), 'continue', { cls: 'ch7-w' }) +
        '<p class="dlg5-e" role="alert" id="f7i-e"></p></form><div class="dm7-cta abar7">' + A.btn('danger', L('KIRIM LAPORAN', 'SEND REPORT'), 'alert', { act: 'send', val: o ? o.id : '', cls: 'btn-xl' }) + '</div>' +
        (mine.length ? card(L('Laporan saya hari ini', 'My reports today'), '<ul class="is7l">' + mine.map(function (i) { return '<li>' + sevC(i.sev) + '<b>' + t(E.ISSUE_TYPES[i.type][0]) + '</b> · ' + esc(T(i.note)) + '<small>' + esc(when(i.at)) + ' · ' + A.chip(E.ISSUE_ST[i.st][1], E.ISSUE_ST[i.st][0]) + (i.res ? ' · ' + esc(T(i.res)) : '') + '</small></li>'; }).join('') + '</ul>', { icon: 'history' }) : '') + '</div>';
    },
    act: {
      send: function (el) {
        var f = document.getElementById('f7i'), v = vals(f), id = el.getAttribute('data-val') || v.ord || null, e = document.getElementById('f7i-e');
        if (!v.type) { e.textContent = T(L('Pilih alasan masalah dulu.', 'Choose the issue reason first.')); return; }
        var r = E.reportIssue(cx(), id, { type: v.type, note: v.note, photo: photos('is')[0] || null, action: v.action, delay: num(v.delay) || 0 });
        if (!r.ok) { e.textContent = T(r.msg); return; }
        resetPh('is');
        var i = r.issue, drv = E.myDriver(cx());
        A.success(i.st === 'resolved' ? L('Masalah dicatat. Lanjutkan tugas.', 'Issue recorded. Continue the task.') : i.sev === 'crit' ? L('Laporan kritis terkirim ke supervisor.', 'Critical report sent to the supervisor.') : L('Laporan terkirim ke supervisor.', 'Report sent to the supervisor.'),
          drv ? { l: L('Ke Hari Ini', 'To Today'), go: 'DRIVER-MOB-001', icon: 'calendar' } : open('ISSUE-002') ? { l: L('Buka Masalah', 'Open Issue'), go: 'ISSUE-002', rec: i.id, icon: 'alert' } : null, null,
          '<span class="mono6">' + esc(i.id) + '</span> · ' + t(E.ISSUE_TYPES[i.type][0]) + ' · ' + t(E.SEV[i.sev][0]) + (i.st === 'review' ? ' · ' + t(L('menunggu keputusan supervisor', 'waiting for the supervisor\'s decision')) : ''));
      }
    }
  };

  /* ================= NP-08 · ISSUE-002 Supervisor Issue Inbox ================= */
  function decideOpts(i) {
    if (i.type === 'bagdiff' && i.mf) return ['found', 'accept', 'close'];
    var o = i.ord && E.order(i.ord);
    if (o && o.st === 'issue') return ['continue', 'reschedule', 'return', 'cancel'];
    return ['close'];
  }
  function decideDlg(id) {
    var i = E.issue(id), op = decideOpts(i), o = i.ord && E.order(i.ord);
    dlg({ title: L('Putuskan masalah', 'Decide the issue'), icon: 'check', sub: '<b class="mono6">' + esc(i.id) + '</b> · ' + t(E.ISSUE_TYPES[i.type][0]) + (o ? ' · ' + pname(o.prop) : ''),
      body: fld(L('Keputusan', 'Decision'), sel('dec', op.map(function (k) { return [k, E.DECIDE[k]]; }), op[0]), { req: true, wide: true }) +
        '<div id="dd7-r" hidden><div class="f6-g">' + fld(L('Tanggal baru', 'New date'), inp('date', E.TODAY, { type: 'date' })) + fld(L('Jam mulai', 'From'), inp('w0', o ? o.win[0] : '14:00', { type: 'time' })) + fld(L('Jam selesai', 'To'), inp('w1', o ? o.win[1] : '15:00', { type: 'time' })) + '</div></div>' +
        fld(L('Catatan keputusan', 'Decision note'), inp('note', ''), { req: true, wide: true }),
      after: function (el) { var s = el.querySelector('[name=dec]'); function u() { el.querySelector('#dd7-r').hidden = s.value !== 'reschedule'; } s.addEventListener('change', u); u(); },
      onOk: function (v) { var r = E.decide(cx(), id, v.dec, { note: v.note, date: v.date, win: [v.w0, v.w1] }); if (!r.ok) return r.msg; after(L('Keputusan tersimpan dan tercatat di audit.', 'Decision saved and audited.')); return true; } });
  }
  V['ISSUE-002'] = {
    title: function (rec) { return rec ? L('Masalah ' + rec, 'Issue ' + rec) : null; },
    render: function (c) {
      var c0 = cx(), q = c.q, mg = can('lg.issue.manage');
      if (c.rec) {
        var i = E.issue(c.rec); if (!i) return A.stateCard('empty', L('Masalah tidak ditemukan.', 'Issue not found.'), A.backBtn('blue'));
        if (!E.issues(c0, {}).some(function (x) { return x.id === i.id; })) return A.stateCard('noperm', E.MSG.noperm, A.backBtn('blue'));
        var o = i.ord && E.order(i.ord), tp = E.ISSUE_TYPES[i.type], b = [];
        if (mg && i.st !== 'resolved') b.push(A.btn('primary', L('Putuskan', 'Decide'), 'check', { act: 'decide', val: i.id }));
        if (o && open('ORDER-003')) b.push(A.btn('ghost', L('Detail Order', 'Order Detail'), 'file', { go: 'ORDER-003', rec: o.id }));
        if (o && E.canChat(c0, o) && open('CHAT-001')) b.push(A.btn('ghost', 'Chat', 'message', { go: 'CHAT-001', rec: o.id }));
        if (i.trip && open('TRACK-002') && E.trip(i.trip).track.on) b.push(A.btn('ghost', L('Lacak Driver', 'Track Driver'), 'pin', { go: 'TRACK-002', rec: i.trip }));
        if (i.mf && open('MANIFEST-001')) b.push(A.btn('ghost', 'Manifest', 'clipboard', { go: 'MANIFEST-001', rec: i.mf }));
        var hd = '<section class="card c6-hd' + (i.sev === 'crit' && i.st !== 'resolved' ? ' card-crit7' : '') + '"><div class="c6-hd-m"><span class="is7-ic is7-' + i.sev + '">' + ic(tp[2]) + '</span><div class="c6-hd-t"><h1>' + t(tp[0]) + ' ' + sevC(i.sev) + A.chip(E.ISSUE_ST[i.st][1], E.ISSUE_ST[i.st][0]) + '</h1><p><span class="mono6">' + esc(i.id) + '</span> · ' + esc(when(i.at)) + ' · ' + emp(i.by) + (o ? ' · ' + pname(o.prop) : i.veh ? ' · ' + esc(i.veh) : '') + '</p></div></div>' + (b.length ? '<div class="c6-hd-a">' + b.join('') + '</div>' : '') + '</section>';
        var det = card(L('Detail', 'Details'), kv([[L('Catatan', 'Notes'), esc(T(i.note))], [L('Tindakan driver', 'Driver action'), t(E.ISSUE_ACT[i.action][0])], [L('Pemilik', 'Owner'), emp(i.owner)], [L('Langkah berikutnya', 'Next action'), T(i.next) ? esc(T(i.next)) : '—'],
          o ? [L('Order', 'Order'), '<span class="mono6">' + esc(o.id) + '</span> · ' + cname(o.cl) + ' ' + stC(o)] : null, i.drv ? [L('Driver', 'Driver'), emp(i.drv)] : null, i.delay ? [L('Alasan terlambat', 'Delay reason'), t(E.DELAY[i.delay] || L(i.delay, i.delay)) + (o && o.delay ? ' · +' + o.delay + ' ' + t(L('mnt', 'min')) : '')] : null,
          i.st === 'resolved' ? [L('Keputusan', 'Decision'), esc(T(i.res)) + '<small class="sub5">' + esc(when(i.resAt)) + (i.resBy ? ' · ' + emp(i.resBy) : '') + '</small>'] : null]) + (i.photo ? '<div class="gl7"><figure>' + img(i.photo, 'Foto') + '</figure></div>' : ''), { icon: 'alert' });
        var mf = i.mf && E.manifest(i.mf), rc = mf && E.reconcile(mf.id);
        var rec2 = mf ? card(L('Rekonsiliasi bag', 'Bag reconciliation'), kv([[L('Diambil', 'Picked up'), rc.pick + ' bag'], [L('Tiba', 'Arrived'), rc.arr == null ? '—' : rc.arr + ' bag'], [L('Selisih', 'Difference'), rc.diff == null ? '—' : '<b class="' + (rc.diff ? 't6-crit' : '') + '">' + rc.diff + '</b>'], ['Status', mfC(mf.st)]]), { icon: 'package' }) : '';
        var hist = card(L('Riwayat', 'History'), '<ol class="tl6">' + [['create', i.at, i.by, null]].concat(i.hist || []).map(function (h) { return '<li class="tl6-i"><span class="tl6-d"></span><div><b>' + (h[0] === 'create' ? t(L('Dilaporkan', 'Reported')) : t(L('Diputuskan: ', 'Decided: ')) + t(E.DECIDE[h[3]] || L(h[3], h[3]))) + '</b><small>' + esc(when(h[1])) + ' · ' + emp(h[2]) + '</small>' + (h[4] ? '<span class="tl6-r">' + esc(h[4]) + '</span>' : '') + '</div></li>'; }).join('') + '</ol>', { icon: 'history' });
        return hd + '<div class="g7-2"><div class="g7-c">' + det + '</div><div class="g7-c">' + rec2 + hist + '</div></div>';
      }
      var all = E.issues(c0, {}), list = E.issues(c0, { st: q.st || (q.all ? null : 'open'), sev: q.sev, type: q.type });
      var opn = all.filter(function (i) { return i.st !== 'resolved'; });
      var strip = tiles([
        tile({ k: L('Kritis terbuka', 'Open critical'), v: opn.filter(function (i) { return i.sev === 'crit'; }).length, tone: opn.some(function (i) { return i.sev === 'crit'; }) ? 'crit' : '', href: qhref({ sev: 'crit', st: null }) }),
        tile({ k: L('Review supervisor', 'Supervisor review'), v: opn.filter(function (i) { return i.st === 'review'; }).length, tone: 'warn', href: qhref({ st: 'review' }) }),
        tile({ k: L('Terbuka', 'Open'), v: opn.length, href: qhref({ st: null, sev: null }) }),
        tile({ k: L('Selesai hari ini', 'Resolved today'), v: all.filter(function (i) { return i.st === 'resolved' && String(i.resAt || '').slice(0, 10) === E.TODAY; }).length, tone: 'ok', href: qhref({ st: 'resolved' }) })
      ], 'tls5-4');
      var tbl = A.list(list, [
        { h: L('Masalah', 'Issue'), v: function (i) { return '<span class="is7-t">' + ic(E.ISSUE_TYPES[i.type][2]) + '<span><b>' + t(E.ISSUE_TYPES[i.type][0]) + '</b><small class="sub5 mono6">' + esc(i.id) + '</small></span></span>'; } },
        { h: L('Keparahan', 'Severity'), v: function (i) { return sevC(i.sev); } },
        { h: L('Order · Property', 'Order · Property'), v: function (i) { return i.ord ? '<span class="mono6">' + esc(i.ord) + '</span><small class="sub5">' + pname(i.prop) + '</small>' : i.veh ? esc(i.veh) : '—'; } },
        { h: L('Driver', 'Driver'), v: function (i) { return i.drv ? esc(E.first(i.drv)) : '—'; } }, { h: L('Waktu', 'Time'), cls: 'num', v: function (i) { return esc(when(i.at)); } },
        { h: L('Pemilik · langkah berikutnya', 'Owner · next action'), v: function (i) { return emp(i.owner) + '<small class="sub5">' + esc(T(i.next) || '—') + '</small>'; } },
        { h: 'Status', v: function (i) { return A.chip(E.ISSUE_ST[i.st][1], E.ISSUE_ST[i.st][0]); } }
      ], function (i) { return { t: t(E.ISSUE_TYPES[i.type][0]), r: esc(String(i.at).slice(11, 16)), s: (i.prop ? pname(i.prop) + ' · ' : '') + esc(T(i.note)), chip: sevC(i.sev) + A.chip(E.ISSUE_ST[i.st][1], E.ISSUE_ST[i.st][0]) }; }, function (i) { return href('ISSUE-002', i.id); }, { empty: L('Tidak ada masalah terbuka.', 'No open issue.') });
      return A.pageHead(null, t(L('Masalah logistik menurut keparahan. Setiap masalah punya pemilik dan langkah berikutnya.', 'Logistics issues by severity. Every issue has an owner and a next action.')), A.pbtn('lg.issue.report', 'ghost', L('Laporkan Masalah', 'Report Issue'), 'plus', { go: 'ISSUE-001' })) + strip +
        A.filters([{ k: 'st', l: 'Status', opts: opts(E.ISSUE_ST) }, { k: 'sev', l: L('Keparahan', 'Severity'), opts: Object.keys(E.SEV).map(function (k) { return [k, E.SEV[k][0]]; }) }, { k: 'type', l: L('Jenis', 'Type'), opts: Object.keys(E.ISSUE_TYPES).map(function (k) { return [k, E.ISSUE_TYPES[k][0]]; }) }], { force: true }) +
        card(L('Inbox masalah', 'Issue inbox'), tbl, { icon: 'alert', count: list.length });
    },
    act: { decide: function (el) { decideDlg(el.getAttribute('data-val')); } }
  };

  G.bagC = bagC; G.bagFlags = bagFlags; G.decideDlg = decideDlg; G.bar = bar; G.openMf = openMf; G.ownGate = ownGate; G.weakNote = weakNote;
})();
