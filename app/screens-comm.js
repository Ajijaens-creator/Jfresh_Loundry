/* JFRESH OS — Phase 6 screens (part 1): shared helpers, NP-01 Client & Property Master
   (CLIENT-001 … 003, PROPERTY-001 … 003), NP-02 Contacts (CONTACT-001, 002) and NP-03
   Services (SERVICE-001, 002). Every number comes from the commercial engine
   (assets/js/jfos-comm.js); every protected action goes through the engine, which
   checks the permission and writes the audit trail. Pricing, credit and margin are
   only rendered for roles with the matching permission (§63). */
(function () {
  var A = window.JFAPP, M = window.JFCOMM, H = A && A.P5;
  if (!A || !M || !H) return;
  var V = A.V, T = A.T, L = A.L, t = A.t, esc = A.esc, ic = A.ic, can = A.can, fmt = A.fmt, href = A.href;
  var open = H.open, lnk = H.lnk, sum = H.sum, pct = H.pct, rpj = H.rpj, mon = H.mon, tabs = H.tabs, card = H.card, kv = H.kv, note = H.note, tile = H.tile, tiles = H.tiles, dlg = H.dlg, fld = H.fld, inp = H.inp, sel = H.sel, area = H.area, num = H.num, ring = H.ring, delta = H.delta, spark = H.spark, drill = H.drill;
  A.addParents(M.PARENTS);
  function cx() { return A.ctx(); }

  /* ================= Shared helpers (also used by screens-comm2.js / screens-comm3.js) ================= */
  function dt(s) { if (!s) return '—'; var p = String(s).slice(0, 10).split('-'); return +p[2] + ' ' + mon(p[0] + '-' + p[1], true) + (String(s).length > 10 ? ' ' + String(s).slice(11, 16) : ''); }
  function dts(s) { if (!s) return '—'; var p = String(s).slice(0, 10).split('-'); return +p[2] + ' ' + mon(p[0] + '-' + p[1]) + ' ' + p[0].slice(2); }
  function st(map, k) { var x = map[k] || [k, 'mute']; return A.chip(x[1] === 'orange' ? 'appr' : x[1], x[0]); }
  function clSt(k) { return st(M.CLIENT_ST, k); }
  function prSt(k) { return st(M.PROP_ST, k); }
  function ctrSt(c) { return st(M.CTR_ST, typeof c === 'string' ? c : M.ctrStatus(c)); }
  function rcSt(r) { return st(M.RC_ST, typeof r === 'string' ? r : M.rcStatus(r)); }
  function hSt(k) { return st(M.HEALTH_ST, k); }
  function aprSt(k) { return st(M.APR_ST, k); }
  function riskC(k) { return st(M.RISK, k); }
  function sevC(k) { var x = M.SEV[k] || M.SEV.info; return A.chip(x[1], x[0]); }
  function slaC(k) { return st(M.SLA_ST, k); }
  function tone(k) { var x = M.HEALTH_ST[k]; return x ? (x[1] === 'orange' ? 'warn' : x[1]) : 'mute'; }
  function hRing(h, size) { if (!h || h.score == null) return '<span class="hr6-na">' + ic('alert') + '<small>' + t(L('Data belum lengkap', 'Incomplete data')) + '</small></span>'; return ring(h.score, { size: size || 72, band: { tone: tone(h.st), n: M.HEALTH_ST[h.st][0] }, label: 'Client Health' }); }
  function hMini(h) { return h && h.score != null ? '<span class="hm6 t6-' + tone(h.st) + '"><b class="num">' + fmt.num(h.score, 0) + '</b>' + t(M.HEALTH_ST[h.st][0]) + '</span>' : '<span class="hm6 t6-mute">' + t(L('Data kurang', 'Incomplete')) + '</span>'; }
  function left(n) { if (n == null) return '—'; var tn = n < 0 ? 'crit' : n <= 30 ? 'crit' : n <= 90 ? 'warn' : 'ok'; return A.chip(tn, n < 0 ? L(Math.abs(n) + ' hari lalu', Math.abs(n) + ' days ago') : L(n + ' hari', n + ' days'), 'clock'); }
  function lock(txt) { return '<span class="lk6" title="' + esc(T(txt || L('Butuh izin khusus', 'Needs a specific permission'))) + '">' + ic('lock') + '<span>' + t(L('Terbatas', 'Restricted')) + '</span></span>'; }
  function price(v, o) { if (!can('com.rate.view')) return lock(L('Harga hanya untuk tim komersial dan finance', 'Pricing is for the commercial and finance team only')); return v == null ? '—' : (o && o.short ? rpj(v) : fmt.rp(v)); }
  function money(v, perm) { if (perm && !can(perm)) return lock(); return v == null ? '—' : rpj(v); }
  function rpFull(v) { return v == null ? '—' : fmt.rp(v); }
  function n0(v) { return v == null ? '—' : fmt.num(v, 0); }
  function emp(id) { return esc(M.empName(id)); }
  function cname(id) { return esc(M.clientName(id)); }
  function pname(id) { return esc(M.propName(id)); }
  function sname(id) { return esc(M.svcName(id)); }
  function clLink(id) { return lnk('CLIENT-002', id, cname(id)); }
  function prLink(id) { return lnk('PROPERTY-002', id, pname(id)); }
  function ctLink(id) { var c = M.contact(id); return c ? lnk('CONTACT-002', id, esc(c.n)) : '—'; }
  function ctrLink(no) { return lnk('CONTRACT-002', no, esc(no)); }
  function rcLink(id) { return lnk('RATE-002', id, esc(id)); }
  function initials(n) { return String(n || '?').replace(/^(Bpk\.|Ibu|Mr\.|Mrs\.)\s*/i, '').split(/\s+/).slice(0, 2).map(function (x) { return x.charAt(0); }).join('').toUpperCase(); }
  function avatar(n, cls) { return '<span class="av6 ' + (cls || '') + '" aria-hidden="true">' + esc(initials(n)) + '</span>'; }
  function roleChips(c, max) { var r = c.roles.slice(0, max || 99); return '<span class="rc6">' + r.map(function (k) { var x = M.CT_ROLES.filter(function (y) { return y[0] === k; })[0]; return x ? '<span class="rc6-c rc6-' + x[2] + '">' + t(x[1]) + '</span>' : ''; }).join('') + (c.roles.length > r.length ? '<span class="rc6-c">+' + (c.roles.length - r.length) + '</span>' : '') + '</span>'; }
  function waNum(p) { return String(p || '').replace(/\D/g, ''); }
  // Contact buttons: Call, WhatsApp, Email (mobile quick access §56).
  function reach(c, o) {
    if (!c) return '';
    o = o || {};
    return '<span class="ra6' + (o.big ? ' ra6-b' : '') + '">' + (c.phone ? '<a class="btn btn-ghost btn-sm" href="tel:' + esc(waNum(c.phone)) + '">' + ic('phone') + '<span>' + t(L('Telepon', 'Call')) + '</span></a>' : '') +
      (c.wa ? '<a class="btn btn-sm ra6-wa" href="https://wa.me/' + esc(waNum(c.wa)) + '" target="_blank" rel="noopener">' + ic('message') + '<span>WhatsApp</span></a>' : '') +
      (c.email ? '<a class="btn btn-ghost btn-sm" href="mailto:' + esc(c.email) + '">' + ic('file') + '<span>Email</span></a>' : '') + '</span>';
  }
  function after(msg, tone2) { A.rerender(); setTimeout(function () { A.toast(msg, tone2); }, 280); }
  function fail(r) { A.toast(r && r.msg ? r.msg : M.MSG.invalid, 'crit'); return false; }
  function vals(root) { var v = {}; (root || document).querySelectorAll('[name]').forEach(function (f) { if (f.type === 'checkbox') { if (f.getAttribute('data-multi')) { v[f.name] = v[f.name] || []; if (f.checked) v[f.name].push(f.value); } else v[f.name] = f.checked; } else v[f.name] = String(f.value).trim(); }); return v; }
  function opts(map, blank) { var o = Object.keys(map).map(function (k) { return [k, Array.isArray(map[k]) && Array.isArray(map[k][0]) ? map[k][0] : map[k]]; }); return blank ? [['', blank]].concat(o) : o; }
  function clientOpts(blank) { var o = M.visibleClients(cx()).map(function (c) { return [c.id, [c.n, c.n]]; }); return blank ? [['', blank]].concat(o) : o; }
  function propOpts(cl, blank) { var o = (cl ? M.propsOf(cl, true) : M.state().props).filter(function (p) { return M.canSeeClient(cx(), p.cl); }).map(function (p) { return [p.id, [p.n, p.n]]; }); return blank ? [['', blank]].concat(o) : o; }
  function amOpts() { return M.D.AMS.map(function (a) { return [a.id, [a.n, a.n]]; }); }
  function checks(name, items, on) { return '<div class="ck6">' + items.map(function (x) { return '<label class="ck6-i"><input type="checkbox" name="' + name + '" data-multi="1" value="' + esc(x[0]) + '"' + (on.indexOf(x[0]) >= 0 ? ' checked' : '') + '><span>' + t(x[1]) + '</span></label>'; }).join('') + '</div>'; }
  function more(id, rec, q, label) { return open(id) ? '<a class="more5" href="' + href(id, rec, q) + '">' + t(label || L('Lihat semua', 'View all')) + ic('chevr') + '</a>' : ''; }
  function mob() { return A.mode() === 'm'; }
  function pad() { return A.mode() === 't'; }
  // §56: no full pricing / contract editing on a small phone screen.
  function noEditOnPhone(what) { return A.stateCard('warning', L(T(what) + ' dibuka di iPad atau PC. Di HP tersedia ringkasan dan tindak lanjut cepat.', T(what) + ' opens on an iPad or PC. The phone shows the summary and quick follow-up.'), A.backBtn('blue'), L('Buka di layar lebih besar', 'Open on a larger screen')); }
  function tlRow(e) {
    var ev = M.EVENTS[e.ev] || [e.ev, e.ev];
    return '<li class="tl6-i"><span class="tl6-d" aria-hidden="true"></span><div><b>' + t(ev) + '</b>' + (e.prop ? ' · ' + pname(e.prop) : '') + (e.rec ? ' · <span class="mono6">' + esc(e.rec) + '</span>' : '') +
      '<small>' + dt(e.at) + ' · ' + emp(e.by) + '</small>' + (e.from != null || e.to != null ? '<span class="tl6-v">' + (e.from != null ? '<s>' + esc(T(e.from)) + '</s> → ' : '') + '<b>' + esc(T(e.to == null ? '—' : e.to)) + '</b></span>' : '') +
      (e.reason ? '<span class="tl6-r">' + esc(T(e.reason)) + '</span>' : '') + (e.doc ? '<span class="tl6-doc">' + ic('file') + esc(e.doc) + '</span>' : '') + '</div></li>';
  }
  function timeline(list, max) { return list.length ? '<ol class="tl6">' + list.slice(0, max || 200).map(tlRow).join('') + '</ol>' : A.empty(L('Belum ada riwayat komersial.', 'No commercial history yet.')); }
  // §49 Account Manager actions
  function amActs(cl, prop) {
    var b = [];
    if (can('com.opp.manage')) b.push(A.btn('ghost', L('Follow-up', 'Follow-up'), 'phone', { act: 'task', val: cl + '|followup|' + (prop || ''), cls: 'btn-sm' }), A.btn('ghost', 'Meeting', 'calendar', { act: 'task', val: cl + '|meeting|' + (prop || ''), cls: 'btn-sm' }), A.btn('ghost', 'Proposal', 'file', { act: 'task', val: cl + '|proposal|' + (prop || ''), cls: 'btn-sm' }), A.btn('ghost', L('Catatan', 'Note'), 'edit', { act: 'task', val: cl + '|note|' + (prop || ''), cls: 'btn-sm' }), A.btn('ghost', 'Opportunity', 'sparkles', { act: 'oppNew', val: cl + '|' + (prop || ''), cls: 'btn-sm' }));
    if (can('com.client.view') && !M.isClient(cx())) b.push(A.btn('ghost', L('Eskalasi risiko', 'Escalate risk'), 'alert', { act: 'task', val: cl + '|escalate|' + (prop || ''), cls: 'btn-sm' }));
    if (can('com.rate.edit')) { var rc = M.rateCards(cx(), { cl: cl })[0]; if (rc) b.push(A.btn('ghost', L('Ajukan harga', 'Request pricing'), 'tag', { go: 'RATE-003', rec: rc.id, cls: 'btn-sm' })); }
    if (can('com.renewal.manage')) { var c0 = M.activeContracts(cl).filter(function (x) { return !M.renewalOf(x.no) && M.days(M.TODAY, x.end) <= 120; })[0]; if (c0) b.push(A.btn('ghost', L('Mulai renewal', 'Start renewal'), 'refresh', { act: 'rnwStart', val: c0.no, cls: 'btn-sm' })); }
    return b.length ? '<div class="am6" role="group" aria-label="' + t(L('Tindakan Account Manager', 'Account Manager actions')) + '">' + b.join('') + '</div>' : '';
  }
  var ACT = {
    task: function (el) {
      var p = el.getAttribute('data-val').split('|'), cl = p[0], kind = p[1], prop = p[2] || null, k = M.TASK_KINDS[kind];
      dlg({ title: k[0], sub: cname(cl) + (prop ? ' · ' + pname(prop) : ''), icon: k[1],
        body: fld(L('Keterangan', 'Description'), area('t', '', kind === 'escalate' ? L('Risiko apa dan dampaknya?', 'Which risk and its impact?') : L('Apa yang akan dilakukan?', 'What will be done?')), { req: true }) + (kind === 'note' ? '' : fld(L('Tanggal', 'Date'), inp('due', M.addDays(M.TODAY, kind === 'meeting' ? 3 : 2), { type: 'date' }), { req: true })),
        onOk: function (v) { var r = M.addTask(cx(), cl, { kind: kind, t: v.t, due: v.due, prop: prop }); if (!r.ok) return r.msg; after(L(T(k[0]) + ' dicatat di timeline klien.', k[0][1] + ' recorded on the client timeline.')); return true; } });
    },
    taskDone: function (el) { var r = M.doneTask(cx(), el.getAttribute('data-val')); if (!r.ok) return fail(r); after(L('Tindakan selesai.', 'Action done.')); },
    oppNew: function (el) {
      var p = el.getAttribute('data-val').split('|'), cl = p[0] || '', prop = p[1] || '';
      dlg({ title: L('Opportunity baru', 'New opportunity'), icon: 'sparkles',
        body: fld(L('Nama opportunity', 'Opportunity name'), inp('n', ''), { req: true, wide: true }) + fld(L('Klien', 'Client'), sel('cl', clientOpts(), cl || 'CL-07')) + fld('Property', sel('prop', propOpts(cl || 'CL-07', L('Semua property', 'All properties')), prop)) +
          fld(L('Tipe', 'Type'), sel('type', opts(M.OPP_TYPES), 'service')) + fld(L('Potensi revenue / bulan (Rp)', 'Potential revenue / month (Rp)'), inp('rev', '', { num: true }), { req: true }) + fld(L('Probabilitas (%)', 'Probability (%)'), inp('prob', '50', { num: true })) +
          (can('com.margin.view') ? fld(L('Potensi margin (%)', 'Potential margin (%)'), inp('margin', '', { num: true })) : '') + fld('Next action', inp('next', '')) + fld(L('Jatuh tempo', 'Due'), inp('due', M.addDays(M.TODAY, 14), { type: 'date' })),
        onOk: function (v) { var r = M.saveOpp(cx(), { n: v.n, cl: v.cl, prop: v.prop || null, type: v.type, rev: num(v.rev), prob: num(v.prob), margin: v.margin, next: v.next, due: v.due }); if (!r.ok) return r.msg; after(L('Opportunity ' + r.opp.id + ' dibuat.', 'Opportunity ' + r.opp.id + ' created.')); return true; } });
    },
    rnwStart: function (el) { var r = M.startRenewal(cx(), el.getAttribute('data-val')); if (!r.ok) return fail(r); after(L('Renewal dimulai: Account Review.', 'Renewal started: Account Review.')); }
  };
  function acts(extra) { return Object.assign({}, ACT, extra || {}); }

  A.P6 = { cx: cx, dt: dt, dts: dts, clSt: clSt, prSt: prSt, ctrSt: ctrSt, rcSt: rcSt, hSt: hSt, aprSt: aprSt, riskC: riskC, sevC: sevC, slaC: slaC, tone: tone, hRing: hRing, hMini: hMini, left: left, lock: lock, price: price, money: money, rpFull: rpFull, n0: n0,
    emp: emp, cname: cname, pname: pname, sname: sname, clLink: clLink, prLink: prLink, ctLink: ctLink, ctrLink: ctrLink, rcLink: rcLink, avatar: avatar, roleChips: roleChips, reach: reach, after: after, fail: fail, vals: vals, opts: opts,
    clientOpts: clientOpts, propOpts: propOpts, amOpts: amOpts, checks: checks, more: more, mob: mob, pad: pad, noEditOnPhone: noEditOnPhone, timeline: timeline, tlRow: tlRow, amActs: amActs, acts: acts };

  /* ================= NP-01 · CLIENT-001 Client List ================= */
  var HEALTH_OPTS = [['healthy', 'Healthy'], ['attention', 'Need Attention'], ['risk', 'At Risk'], ['critical', 'Critical'], ['nodata', L('Data belum lengkap', 'Incomplete data')]];
  var RNW_OPTS = [['due', L('Berakhir ≤ 90 hari', 'Ending ≤ 90 days')], ['review', 'Account Review'], ['proposal', 'Proposal'], ['negotiation', L('Negosiasi', 'Negotiation')], ['approval', 'Approval'], ['none', L('Tidak ada renewal', 'No renewal')]];
  V['CLIENT-001'] = {
    render: function (c) {
      var q = c.q, c0 = cx(), list = M.searchClients(c0, { q: q.q, type: q.type, status: q.status, am: q.am, city: q.city, health: q.health, renewal: q.rnw }), all = M.visibleClients(c0);
      var exp90 = M.renewals(c0).filter(function (x) { return x.left >= 0 && x.left <= 90; }).length, risky = all.filter(function (x) { var h = M.health(x.id); return h && (h.st === 'risk' || h.st === 'critical'); }).length;
      var head = A.pageHead(null, t(L('Master data klien dan property. Satu klien (grup) bisa punya banyak property.', 'Client and property master data. One client (group) can have many properties.')), A.pbtn('com.client.create', 'primary', L('Tambah Klien', 'Add Client'), 'plus', { go: 'CLIENT-003' }));
      var strip = tiles([
        tile({ k: L('Klien', 'Clients'), v: all.length, s: all.filter(function (x) { return x.status === 'active'; }).length + ' ' + t(L('aktif', 'active')) }),
        tile({ k: 'Property', v: M.state().props.filter(function (p) { return M.canSeeClient(c0, p.cl) && p.status === 'active'; }).length, s: t(L('property aktif', 'active properties')), href: open('PROPERTY-001') ? href('PROPERTY-001') : null }),
        tile({ k: L('Kontrak ≤ 90 hari', 'Contracts ≤ 90 days'), v: exp90, s: t(L('perlu renewal', 'need renewal')), tone: exp90 ? 'warn' : '', href: open('RENEW-001') ? href('RENEW-001') : null }),
        tile({ k: L('Health berisiko', 'Health at risk'), v: risky, s: 'At Risk + Critical', tone: risky ? 'crit' : '', href: open('HEALTH-001') ? href('HEALTH-001') : null })
      ], 'tls5-4');
      var fb = A.filters([
        { k: 'type', l: L('Jenis', 'Type'), opts: opts(M.CLIENT_TYPES) }, { k: 'status', l: 'Status', opts: Object.keys(M.CLIENT_ST).map(function (k) { return [k, M.CLIENT_ST[k][0]]; }) },
        { k: 'am', l: 'Account Manager', opts: amOpts() }, { k: 'city', l: L('Lokasi', 'Location'), opts: M.cities().map(function (x) { return [x, [x, x]]; }) },
        { k: 'health', l: 'Health', opts: HEALTH_OPTS }, { k: 'rnw', l: 'Renewal', opts: RNW_OPTS }
      ], { search: L('Cari klien, property, kode, telepon, kontak, no. kontrak', 'Search client, property, code, phone, contact, contract no.'), force: true });
      var rows = list.map(function (x) { return { c: x, h: M.health(x.id), props: M.propsOf(x.id, true), next: M.activeContracts(x.id).sort(function (a, b) { return M.ms(a.end) - M.ms(b.end); })[0] || null, rev: M.clientMonth(x.id, 12).rev }; });
      var tbl = A.list(rows, [
        { h: L('Klien', 'Client'), v: function (r) { return '<b>' + esc(r.c.n) + '</b>' + (r.c.group ? ' <span class="gp6">' + t(L('Grup', 'Group')) + '</span>' : '') + '<small class="sub5">' + esc(r.c.id) + ' · ' + esc(r.c.legal) + '</small>'; } },
        { h: L('Jenis', 'Type'), v: function (r) { return t(M.CLIENT_TYPES[r.c.type]); } },
        { h: 'Property', cls: 'r num', v: function (r) { return r.props.length; } },
        { h: L('Lokasi', 'Location'), v: function (r) { return esc(r.c.city); } },
        { h: 'Account Manager', v: function (r) { return emp(r.c.am); } },
        { h: L('Revenue (Sep)', 'Revenue (Sep)'), cls: 'r num', v: function (r) { return r.rev ? rpj(r.rev) : '—'; } },
        { h: 'Health', v: function (r) { return hMini(r.h); } },
        { h: L('Kontrak berikut', 'Next contract end'), v: function (r) { return r.next ? left(M.days(M.TODAY, r.next.end)) : '—'; } },
        { h: 'Status', v: function (r) { return clSt(r.c.status); } }
      ], function (r) { var pc = M.recommend(r.c.id, null, 'ops'), c1 = pc && pc.primary[0]; return { t: esc(r.c.n), r: r.h && r.h.score != null ? fmt.num(r.h.score, 0) : '', s: t(M.CLIENT_TYPES[r.c.type]) + ' · ' + esc(r.c.city) + ' · ' + r.props.length + ' property · ' + emp(r.c.am), chip: clSt(r.c.status) + (r.h ? ' ' + hSt(r.h.st) : '') }; }, function (r) { return href('CLIENT-002', r.c.id); }, { dense: true, empty: q.q ? L('Tidak ada klien yang cocok dengan "' + q.q + '".', 'No client matches "' + q.q + '".') : L('Belum ada klien. Tambahkan klien pertama.', 'No clients yet. Add the first client.') });
      return head + strip + card(L('Daftar Klien', 'Client List'), fb + tbl, { icon: 'users', count: list.length });
    }
  };

  /* ================= NP-01 · CLIENT-002 Client 360 ================= */
  var C360_TABS = [['ov', 'Overview', 'grid'], ['props', L('Property', 'Properties'), 'hotel', null, 'com.property.view'], ['contacts', L('Kontak', 'Contacts'), 'idcard', null, 'com.contact.view'], ['svc', L('Layanan', 'Services'), 'washer', null, 'com.service.view'],
    ['ctr', L('Kontrak', 'Contracts'), 'contract', null, 'com.contract.view'], ['price', L('Harga', 'Pricing'), 'tag', null, 'com.rate.view'], ['sla', 'SLA', 'clock', null, 'com.sla.view'], ['fin', 'Finance', 'coins', null, 'com.finance.view'],
    ['docs', L('Dokumen', 'Documents'), 'file', null, 'com.doc.view'], ['hist', L('Riwayat', 'History'), 'history', null, 'com.history.view'], ['health', 'Health', 'gauge', null, 'com.health.view'], ['opp', 'Opportunity', 'sparkles', null, 'com.opp.view']];
  function c360Head(s, c) {
    var cl = s.c, fin = can('com.finance.view');
    return '<section class="card c6-hd"><div class="c6-hd-m">' + avatar(cl.n, 'av6-l') + '<div class="c6-hd-t"><h1>' + esc(cl.n) + ' ' + clSt(cl.status) + '</h1>' +
      '<p><span class="tg6">' + t(M.CLIENT_TYPES[cl.type]) + '</span><span class="tg6">' + t(cl.ind) + '</span>' + (cl.group ? '<span class="tg6 tg6-b">' + t(L('Grup · ' + s.props.length + ' property', 'Group · ' + s.props.length + ' properties')) + '</span>' : '') + '<span class="sub5">' + esc(cl.id) + ' · ' + t(L('Sejak ', 'Since ')) + dt(cl.start) + '</span></p></div>' +
      '<div class="c6-hd-h">' + hRing(s.health, mob() ? 56 : 72) + '<small>' + (s.health && s.health.score != null ? t(M.HEALTH_ST[s.health.st][0]) : '') + '</small></div></div>' +
      kv([['Account Manager', emp(cl.am)], [L('Termin pembayaran', 'Payment terms'), cl.terms ? 'Net ' + cl.terms : t(L('Tunai', 'Cash'))], [L('Limit kredit', 'Credit limit'), fin ? rpj(cl.credit) : lock()], [L('Renewal berikut', 'Next renewal'), s.next ? esc(s.next.no) + ' · ' + left(s.nextLeft) : '—']]) +
      '<div class="c6-hd-a">' + A.pbtn('com.client.edit', 'ghost', 'Edit', 'edit', { go: 'CLIENT-003', rec: cl.id, cls: 'btn-sm' }) + A.pbtn('com.property.create', 'primary', L('Tambah Property', 'Add Property'), 'plus', { go: 'PROPERTY-003', qs: 'cl=' + cl.id, cls: 'btn-sm' }) + '</div></section>';
  }
  function c360Tiles(s) {
    var fin = can('com.finance.view');
    return tiles([
      tile({ k: L('Property aktif', 'Active properties'), v: s.activeProps, s: s.props.length + ' ' + t(L('total', 'total')), href: H.qhref({ tab: 'props' }) }),
      tile({ k: L('Revenue (Sep)', 'Revenue (Sep)'), v: rpj(s.rev), s: 'MoM ' + delta(s.revGrowth, { u: '%' }) + ' · YoY ' + delta(s.yoy, { u: '%' }) }),
      tile({ k: 'Outstanding AR', v: fin ? rpj(s.ar) : lock(), s: fin && s.overdue ? t(L('Jatuh tempo ', 'Overdue ')) + rpj(s.overdue) : '', tone: fin && s.overdue ? 'warn' : '', href: fin ? H.qhref({ tab: 'fin' }) : null }),
      tile({ k: 'SLA', v: pct(s.sla), s: s.slaRule ? esc(s.slaRule.id) + ' · ' + s.slaRule.tat + ' ' + t(L('jam', 'h')) : '', tone: s.sla != null && s.sla < 97 ? 'warn' : '', href: H.qhref({ tab: 'sla' }) }),
      tile({ k: L('Kontrak aktif', 'Active contracts'), v: s.activeContracts, s: s.next ? t(L('Renewal ', 'Renewal ')) + dts(s.next.end) : t(L('Belum ada kontrak aktif', 'No active contract')), tone: s.nextLeft != null && s.nextLeft <= 60 ? 'warn' : '', href: H.qhref({ tab: 'ctr' }) }),
      tile({ k: L('Komplain terbuka', 'Open complaints'), v: s.openComplaints, s: t(L('dari Quality', 'from Quality')), tone: s.openComplaints >= 2 ? 'warn' : '' }),
      tile({ k: L('Opportunity terbuka', 'Open opportunities'), v: s.openOpps, href: H.qhref({ tab: 'opp' }) })
    ], 'tls6-7');
  }
  function insightCard(i) {
    function row(k, icon, v, cls) { return '<li class="in6-' + cls + '"><span class="in6-k">' + ic(icon) + k + '</span><span>' + esc(T(v)) + '</span></li>'; }
    return card(L('Insight klien', 'Client insight'), '<ul class="in6">' + row('WHAT', 'chart', i.what, 'w') + row('WHY', 'bulb', i.why, 'y') + row('RISK', 'alert', i.risk, 'r') + row('OPPORTUNITY', 'sparkles', i.opp, 'o') + row('ACTION', 'target', i.action, 'a') + '</ul>', { icon: 'sparkles' });
  }
  function propTable(cl, compact) {
    var props = M.propsOf(cl, true);
    return A.list(props, [
      { h: L('Nama property', 'Property'), v: function (p) { return '<b>' + esc(p.n) + '</b><small class="sub5">' + esc(p.id) + '</small>'; } },
      { h: L('Lokasi', 'Location'), v: function (p) { return esc(p.city); } },
      { h: L('PIC operasional', 'Operational PIC'), v: function (p) { var o = M.contact(p.op); return o ? esc(o.n) + ' <small class="sub5">' + esc(T(o.pos)) + '</small>' : '—'; } },
      { h: 'Pickup', v: function (p) { return esc(T(p.pickup)); } },
      compact ? null : { h: L('Layanan', 'Services'), cls: 'r num', v: function (p) { return M.svcConfig(p.id).filter(function (x) { return x.active; }).length; } },
      compact ? null : { h: L('Tagihan', 'Billing'), v: function (p) { return t(M.BILLING[p.billing]); } },
      { h: 'Status', v: function (p) { return prSt(p.status); } }
    ].filter(Boolean), function (p) { var o = M.contact(p.op); return { t: esc(p.n), s: esc(p.city) + ' · ' + (o ? esc(o.n) : '—') + ' · ' + esc(T(p.pickup)), chip: prSt(p.status) }; }, function (p) { return open('PROPERTY-002') ? href('PROPERTY-002', p.id) : null; }, { dense: true, empty: L('Belum ada property.', 'No property yet.') });
  }
  function recoCard(cl, q, prefix) {
    var pk = q.purp || 'ops', pr = q.rprop || (M.propsOf(cl)[0] || {}).id, r = M.recommend(cl, pr, pk);
    var props = M.propsOf(cl);
    return card(L('Siapa yang dihubungi?', 'Who to contact?'), tabs(M.PURPOSES.map(function (p) { return [p[0], p[1]]; }), pk, 'purp', { seg: true, def: 'ops', label: L('Topik', 'Topic') }) +
      (props.length > 1 ? '<div class="mrow5"><span>Property</span>' + tabs(props.map(function (p) { return [p.id, p.n.replace(M.clientName(cl), '').replace(/^\s*[·-]?\s*/, '') || p.n]; }), pr, 'rprop', { seg: true, def: props[0].id, label: 'Property' }) + '</div>' : '') +
      (r && r.primary.length ? '<ul class="rec6">' + r.primary.map(function (c, i) { return '<li>' + avatar(c.n) + '<div><b>' + ctLink(c.id) + '</b>' + (i === 0 ? ' ' + A.chip('ok', L('Rekomendasi', 'Recommended'), 'star') : '') + '<small>' + esc(T(c.pos)) + ' · ' + esc(M.scopeLabel(c)) + '</small>' + roleChips(c, 4) + '</div>' + reach(c) + '</li>'; }).join('') +
        r.escalation.map(function (c) { return '<li class="rec6-e">' + avatar(c.n) + '<div><b>' + ctLink(c.id) + '</b> ' + A.chip('appr', L('Eskalasi', 'Escalation'), 'alert') + '<small>' + esc(T(c.pos)) + '</small></div>' + reach(c) + '</li>'; }).join('') + '</ul>' + note(t(r.why), 'info') : A.empty(L('Belum ada contact untuk topik ini. Tambahkan kontak dengan peran yang sesuai.', 'No contact for this topic yet. Add a contact with the matching role.'))), { icon: 'idcard' });
  }
  function contactTree(cl) {
    var group = M.contacts(cx(), { cl: cl, level: 'group' }), props = M.propsOf(cl, true);
    function item(c) { return '<li>' + avatar(c.n) + '<div><b>' + ctLink(c.id) + '</b><small>' + esc(T(c.pos)) + ' · ' + esc(M.scopeLabel(c)) + '</small>' + roleChips(c, mob() ? 2 : 4) + '</div>' + (mob() ? reach(c) : '') + '</li>'; }
    return '<div class="org6"><div class="org6-g"><h3 class="h5">' + ic('building') + t(L('Tingkat grup · semua property', 'Group level · all properties')) + '</h3>' + (group.length ? '<ul class="org6-l">' + group.map(item).join('') + '</ul>' : A.empty(L('Belum ada contact tingkat grup.', 'No group-level contact yet.'))) + '</div>' +
      props.map(function (p) { var cs = M.contacts(cx(), { cl: cl, prop: p.id, level: 'property' }); return '<div class="org6-p"><h3 class="h5">' + ic('hotel') + prLink(p.id) + ' <span class="cnt num">' + cs.length + '</span></h3>' + (cs.length ? '<ul class="org6-l">' + cs.map(item).join('') + '</ul>' : A.empty(L('Belum ada contact.', 'No contact yet.'))) + '</div>'; }).join('') + '</div>';
  }
  function svcTable(prop, o) {
    o = o || {};
    var rows = M.svcConfig(prop).map(function (x) { return M.svcLine(prop, x.svc); });
    return A.list(rows, [
      { h: L('Layanan', 'Service'), v: function (l) { return '<b>' + esc(l.sv.n) + '</b><small class="sub5">' + esc(l.svc) + '</small>'; } },
      { h: L('Unit', 'Unit'), v: function (l) { return esc(l.sv.unit); } },
      { h: L('Harga klien', 'Client rate'), cls: 'r num', v: function (l) { return price(l.rate) + (can('com.rate.view') && l.rate !== l.master ? '<small class="sub5">' + t(L('Master ', 'Master ')) + fmt.rp(l.master) + '</small>' : ''); } },
      { h: 'SLA', cls: 'r', v: function (l) { return l.sla + ' ' + t(L('jam', 'h')) + (l.sla !== l.masterSla ? ' <small class="sub5">' + t(L('standar ', 'standard ')) + l.masterSla + '</small>' : ''); } },
      { h: 'Status', v: function (l) { return l.active ? A.chip('ok', L('Aktif', 'Active')) : A.chip('mute', L('Nonaktif', 'Inactive')); } },
      { h: L('Instruksi khusus', 'Special instruction'), v: function (l) { return l.cfg && T(l.cfg.instr) ? esc(T(l.cfg.instr)) : '—'; } }
    ], function (l) { return { t: esc(l.sv.n), r: can('com.rate.view') ? rpFull(l.rate) : '', s: l.sla + ' ' + t(L('jam', 'h')) + ' · ' + esc(l.sv.unit) + (l.cfg && T(l.cfg.instr) ? ' · ' + esc(T(l.cfg.instr)) : ''), chip: l.active ? A.chip('ok', L('Aktif', 'Active')) : A.chip('mute', L('Nonaktif', 'Inactive')) }; }, null, { dense: true, empty: L('Belum ada layanan aktif untuk property ini.', 'No active service for this property yet.') });
  }
  function finBlock(cl) {
    var f = M.finance(cl);
    if (!f) return A.empty(L('Belum ada data keuangan.', 'No financial data yet.'));
    var bk = [['current', L('Lancar', 'Current')], ['b30', L('1–30 hari', '1–30 days')], ['b60', L('31–60 hari', '31–60 days')], ['b90', L('61–90 hari', '61–90 days')], ['b90p', L('90+ hari', '90+ days')]];
    return tiles([tile({ k: 'Outstanding AR', v: rpj(f.total), s: t(L('Jatuh tempo ', 'Overdue ')) + rpj(f.overdue) + ' · ' + pct(f.overdueShare, 0), tone: f.overdueShare > 50 ? 'warn' : '' }), tile({ k: L('Limit kredit', 'Credit limit'), v: f.credit ? rpj(f.credit) : '—', s: f.util != null ? t(L('Terpakai ', 'Used ')) + pct(f.util, 0) : '', tone: f.over ? 'crit' : f.util > 80 ? 'warn' : '' }), tile({ k: L('Termin', 'Terms'), v: f.terms ? 'Net ' + f.terms : t(L('Tunai', 'Cash')) }), tile({ k: L('Perilaku bayar', 'Payment behaviour'), v: f.payDays != null ? '+' + f.payDays + t(L(' hari', ' d')) : '—', s: t(L('rata-rata lewat jatuh tempo', 'average past due date')), tone: f.payDays > 14 ? 'warn' : '' })], 'tls5-4') +
      (f.util != null ? '<div class="ut6" role="img" aria-label="' + esc(T(L('Pemakaian kredit ', 'Credit utilisation ')) + pct(f.util, 0)) + '"><i class="t6-' + (f.over ? 'crit' : f.util > 80 ? 'warn' : 'ok') + '" style="width:' + Math.min(100, f.util) + '%"></i></div>' : '') +
      '<div class="ag5">' + bk.map(function (b) { return '<div class="ag5-c' + (b[0] !== 'current' && f.buckets[b[0]] > 0 ? ' ag5-w' : '') + '"><small>' + t(b[1]) + '</small><b class="num">' + rpj(f.buckets[b[0]]) + '</b></div>'; }).join('') + '</div>' +
      A.list(f.items, [{ h: 'Invoice', v: function (i) { return '<b class="mono6">' + esc(i.inv) + '</b>'; } }, { h: L('Terbit', 'Issued'), v: function (i) { return dt(i.issued); } }, { h: L('Jatuh tempo', 'Due'), v: function (i) { return dt(i.due); } }, { h: L('Nilai', 'Amount'), cls: 'r num', v: function (i) { return fmt.rp(i.amt); } }, { h: L('Umur', 'Age'), v: function (i) { return i.age > 0 ? A.chip(i.age > 30 ? 'crit' : 'warn', L(i.age + ' hari lewat', i.age + ' days late')) : A.chip('ok', L('Belum jatuh tempo', 'Not due')); } }],
        function (i) { return { t: esc(i.inv), r: rpj(i.amt), s: t(L('Jatuh tempo ', 'Due ')) + dt(i.due), chip: i.age > 0 ? A.chip('crit', L(i.age + ' hari lewat', i.age + ' days late')) : '' }; }, null, { dense: true, empty: L('Tidak ada piutang terbuka.', 'No open receivables.') }) +
      note(t(L('Sumber: ledger AR Financial Health (Phase 5). Data tidak disalin.', 'Source: the Financial Health AR ledger (Phase 5). Data is not copied.')), 'link') + (open('FIN-005') ? more('FIN-005', null, null, L('Buka AR Aging', 'Open AR Aging')) : '');
  }
  function profitBlock(cl, compact) {
    if (!can('com.margin.view')) return note(t(L('Biaya dan margin hanya untuk Owner dan Finance.', 'Cost and margin are for the Owner and Finance only.')), 'lock');
    var p = M.profit(cl);
    if (!p.rev) return A.empty(L('Belum ada transaksi untuk dihitung.', 'No transactions to calculate yet.'));
    return kv([['Revenue', '<b>' + rpj(p.rev) + '</b>'], [L('Biaya langsung', 'Direct cost'), rpj(p.cost)], [L('Kontribusi', 'Contribution'), '<b>' + rpj(p.contrib) + '</b>'], ['Margin', pct(p.margin)], [L('Biaya/kg', 'Cost/kg'), 'Rp ' + n0(p.costKg)], [L('Profit/kg', 'Profit/kg'), 'Rp ' + n0(p.profitKg)]]) +
      (compact ? '' : A.list(p.props, [{ h: 'Property', v: function (x) { return '<b>' + esc(x.n) + '</b>'; } }, { h: 'Revenue', cls: 'r num', v: function (x) { return rpj(x.rev); } }, { h: L('Biaya', 'Cost'), cls: 'r num', v: function (x) { return rpj(x.cost); } }, { h: 'Margin', cls: 'r num', v: function (x) { return pct(x.margin); } }, { h: 'Profit/kg', cls: 'r num', v: function (x) { return 'Rp ' + n0(x.profitKg); } }],
        function (x) { return { t: esc(x.n), r: pct(x.margin), s: rpj(x.rev) + ' · Rp ' + n0(x.profitKg) + '/kg' }; }, function (x) { return open('HEALTH-001') ? href('HEALTH-001', null, { cl: cl, tab: 'profit', prop: x.prop }) : null; }, { dense: true }));
  }
  function healthBlock(cl) {
    var h = M.health(cl);
    var head = '<div class="hh6">' + hRing(h, 96) + '<div>' + (h.score != null ? '<b>' + t(M.HEALTH_ST[h.st][0]) + '</b>' + (h.trend != null ? ' ' + delta(h.trend, { u: ' pt' }) + ' <small class="sub5">' + t(L('vs bulan lalu', 'vs last month')) + '</small>' : '') : '<b>' + t(L('Data belum lengkap', 'Incomplete data')) + '</b>') +
      '<small class="sub5">' + t(L('Dihitung ', 'Calculated ')) + H.dtt(h.at) + ' · ' + t(L('data bulan ', 'data month ')) + mon(h.calc, true) + '</small></div></div>';
    var warn = h.incomplete ? note(t(L('Sumber data belum lengkap (' + h.gaps.map(function (k) { return T(M.HEALTH_DIMS.filter(function (d) { return d.k === k; })[0].n); }).join(', ') + '). Skor dihitung dari bobot yang tersedia dan bukan angka final.', 'Source data is incomplete (' + h.gaps.map(function (k) { return M.HEALTH_DIMS.filter(function (d) { return d.k === k; })[0].n[1]; }).join(', ') + '). The score uses the available weights and is not final.')), 'alert', 'warn') : '';
    return head + warn + dimTable(cl, h);
  }
  function dimTable(cl, h) {
    return A.list(h.dims, [
      { h: L('Dimensi', 'Dimension'), v: function (d) { return '<b>' + t(d.n) + '</b>' + (d.note ? '<small class="sub5">' + t(d.note) + '</small>' : ''); } },
      { h: L('Metrik', 'Metric'), cls: 'r num', v: function (d) { return d.v == null ? '—' : fmt.num(d.v, Math.abs(d.v) < 1 && d.v ? 2 : 1) + t(d.unit || ''); } },
      { h: L('Skor', 'Score'), cls: 'r num', v: function (d) { return d.s == null ? '—' : '<b>' + fmt.num(d.s, 0) + '</b>'; } },
      { h: L('Bobot', 'Weight'), cls: 'r num', v: function (d) { return d.s == null ? '<s>' + d.w + '%</s>' : pct(d.ew, 0); } },
      { h: L('Tren', 'Trend'), v: function (d) { return d.trend == null ? '—' : delta(d.trend, { u: '' }); } },
      { h: 'Status', v: function (d) { return hSt(d.st); } }
    ], function (d) { return { t: t(d.n), r: d.s == null ? '—' : fmt.num(d.s, 0), s: (d.v == null ? '—' : fmt.num(d.v, 1) + t(d.unit || '')) + ' · ' + t(L('Bobot ', 'Weight ')) + d.w + '%', chip: hSt(d.st) }; }, function (d) { return open('HEALTH-001') ? href('HEALTH-001', null, { cl: cl, dim: d.k }) : null; }, { dense: true });
  }
  function oppList(cl) {
    var list = M.opps(cx(), { cl: cl }), sug = can('com.opp.manage') ? M.suggestOpps(cl) : [];
    return A.list(list, [
      { h: 'Opportunity', v: function (o) { return '<b>' + esc(T(o.n)) + '</b><small class="sub5">' + esc(o.id) + ' · ' + t(M.OPP_TYPES[o.type]) + '</small>'; } },
      { h: 'Property', v: function (o) { return o.prop ? pname(o.prop) : (o.props || []).map(M.propName).join(', ') || t(L('Semua', 'All')); } },
      { h: L('Potensi/bln', 'Potential/mo'), cls: 'r num', v: function (o) { return rpj(o.rev); } },
      { h: L('Prob.', 'Prob.'), cls: 'r num', v: function (o) { return pct(o.prob, 0); } },
      { h: L('Tahap', 'Stage'), v: function (o) { return A.chip(o.stage === 'won' ? 'ok' : o.stage === 'lost' ? 'crit' : 'info', M.OPP_STAGES.filter(function (s) { return s[0] === o.stage; })[0][1]); } },
      { h: 'Next action', v: function (o) { return esc(T(o.next)) + '<small class="sub5">' + dt(o.due) + '</small>'; } }
    ], function (o) { return { t: esc(T(o.n)), r: rpj(o.rev), s: pct(o.prob, 0) + ' · ' + esc(T(o.next)), chip: A.chip('info', M.OPP_STAGES.filter(function (s) { return s[0] === o.stage; })[0][1]) }; }, function (o) { return open('OPP-002') ? href('OPP-002', o.id) : null; }, { dense: true, empty: L('Belum ada opportunity.', 'No opportunity yet.') }) +
      (sug.length ? '<h3 class="h5">' + ic('bulb') + t(L('Saran dari data layanan', 'Suggestions from service data')) + '</h3><ul class="sg6">' + sug.map(function (x) { return '<li>' + ic('sparkles') + '<span>' + t(x.t) + '</span>' + A.btn('ghost', L('Jadikan opportunity', 'Make opportunity'), 'plus', { act: 'oppNew', val: cl + '|' + x.prop, cls: 'btn-sm' }) + '</li>'; }).join('') + '</ul>' : '');
  }
  function tasksCard(cl) {
    var ts = M.tasks(cl).filter(function (x) { return !x.done; });
    return ts.length ? card(L('Tindak lanjut terbuka', 'Open follow-ups'), '<ul class="tk6">' + ts.slice(0, 5).map(function (x) { var k = M.TASK_KINDS[x.kind]; return '<li>' + ic(k[1]) + '<div><b>' + t(k[0]) + '</b> · ' + esc(x.t) + '<small>' + (x.due ? dt(x.due) + ' · ' : '') + emp(x.by) + '</small></div>' + (can('com.opp.manage') ? A.btn('ghost', L('Selesai', 'Done'), 'check', { act: 'taskDone', val: x.id, cls: 'btn-sm' }) : '') + '</li>'; }).join('') + '</ul>', { icon: 'calendar', count: ts.length }) : '';
  }
  V['CLIENT-002'] = {
    title: function (rec) { var c = M.client(rec); return c ? c.n : 'Client 360'; },
    render: function (c) {
      var cl = c.rec || 'CL-07', s = M.summary(cx(), cl);
      if (!s) return A.stateCard('empty', L('Klien tidak ditemukan.', 'Client not found.'), A.backBtn());
      var avail = C360_TABS.filter(function (x) { return !x[4] || can(x[4]); }), tab = avail.some(function (x) { return x[0] === c.q.tab; }) ? c.q.tab : 'ov', body = '';
      switch (tab) {
        case 'ov': {
          var i = M.insight(cl), risks = M.risks(cl), rn = s.next ? M.renewalCard(s.next.no) : null;
          var keyContacts = ['contract', 'ops', 'billing'].map(function (p) { var r = M.recommend(cl, (s.props[0] || {}).id, p); return r && r.primary[0] ? { p: M.PURPOSES.filter(function (x) { return x[0] === p; })[0], c: r.primary[0] } : null; }).filter(Boolean);
          var contactsCard = card(L('Kontak kunci', 'Key contacts'), '<ul class="rec6">' + keyContacts.map(function (k) { return '<li>' + avatar(k.c.n) + '<div><b>' + ctLink(k.c.id) + '</b><small>' + t(k.p[1]) + ' · ' + esc(T(k.c.pos)) + '</small></div>' + reach(k.c) + '</li>'; }).join('') + '</ul>', { icon: 'idcard', right: more('CLIENT-002', cl, { tab: 'contacts' }) });
          var left2 = (s.health && can('com.health.view') ? insightCard(i) : '') + (can('com.property.view') ? card(L('Daftar Property', 'Property List'), propTable(cl, true), { icon: 'hotel', count: s.props.length, right: more('CLIENT-002', cl, { tab: 'props' }) }) : '');
          var right2 = contactsCard + (rn ? card(L('Renewal berikut', 'Next renewal'), kv([[L('Kontrak', 'Contract'), ctrLink(rn.no)], [L('Berakhir', 'Ends'), dt(rn.end) + ' · ' + left(rn.left)], [L('Tahap', 'Stage'), rn.stage ? esc(T(M.STAGES.filter(function (x) { return x[0] === rn.stage; })[0][1])) : '—'], [L('Risiko', 'Risk'), riskC(rn.risk)], ['Next action', esc(T(rn.next))]]) + more('RENEW-002', rn.no, null, L('Buka renewal', 'Open renewal')), { icon: 'refresh' }) : '') +
            (risks.length ? card(L('Risiko klien', 'Client risks'), '<ul class="al5">' + risks.slice(0, 5).map(function (r) { return '<li class="t-' + (r.sev === 'crit' ? 'crit' : 'warn') + '">' + ic('alert') + '<span>' + t(r.t) + '</span></li>'; }).join('') + '</ul>', { icon: 'alert', count: risks.length }) : '') + tasksCard(cl);
          body = (mob() ? contactsCard + left2 + right2.replace(contactsCard, '') : '<div class="grid2 c6-ov"><div class="stack5">' + left2 + '</div><div class="stack5">' + right2 + '</div></div>');
          break;
        }
        case 'props': body = card(L('Daftar Property', 'Property List'), propTable(cl), { icon: 'hotel', count: s.props.length, right: A.pbtn('com.property.create', 'ghost', L('Tambah Property', 'Add Property'), 'plus', { go: 'PROPERTY-003', qs: 'cl=' + cl, cls: 'btn-sm' }) }); break;
        case 'contacts': body = '<div class="grid2"><div>' + card(L('Struktur kontak', 'Contact structure'), contactTree(cl), { icon: 'users', right: A.pbtn('com.contact.manage', 'ghost', L('Tambah Kontak', 'Add Contact'), 'plus', { act: 'ctNew', val: cl, cls: 'btn-sm' }) }) + '</div><div>' + recoCard(cl, c.q) + '</div></div>'; break;
        case 'svc': body = s.props.map(function (p) { return card(p.n, svcTable(p.id), { icon: 'washer', right: more('SERVICE-002', null, { prop: p.id }, L('Atur layanan', 'Configure services')) }); }).join(''); break;
        case 'ctr': body = card(L('Kontrak', 'Contracts'), A.list(M.contracts(cx(), { cl: cl }), [
          { h: L('No. kontrak', 'Contract no.'), v: function (x) { return '<b class="mono6">' + esc(x.no) + '</b>'; } }, { h: 'Property', v: function (x) { return x.props.length === M.propsOf(cl, true).length && x.props.length > 1 ? t(L('Semua property', 'All properties')) : x.props.map(M.propName).join(', '); } },
          { h: L('Periode', 'Period'), v: function (x) { return dts(x.start) + ' – ' + dts(x.end); } }, { h: 'Status', v: function (x) { return ctrSt(x); } }, { h: L('Versi', 'Version'), cls: 'r', v: function (x) { return 'v' + x.v; } }
        ], function (x) { return { t: esc(x.no), s: dts(x.start) + ' – ' + dts(x.end) + ' · v' + x.v, chip: ctrSt(x) }; }, function (x) { return href('CONTRACT-002', x.no); }, { dense: true, empty: L('Belum ada kontrak aktif.', 'No active contract yet.') }), { icon: 'contract', right: A.pbtn('com.contract.create', 'ghost', L('Buat Kontrak', 'New Contract'), 'plus', { go: 'CONTRACT-003', qs: 'cl=' + cl, cls: 'btn-sm' }) }); break;
        case 'price': body = M.rateCards(cx(), { cl: cl }).map(function (r) { return card(r.n + ' · v' + r.v, kv([[L('Berlaku', 'Valid'), dt(r.eff) + ' – ' + dt(r.exp)], ['Status', rcSt(r)], ['Property', r.prop ? pname(r.prop) : t(L('Semua property', 'All properties'))]]) + A.list(r.lines, [{ h: L('Layanan', 'Service'), v: function (l) { return '<b>' + sname(l.svc) + '</b>'; } }, { h: 'Master', cls: 'r num', v: function (l) { return fmt.rp(M.service(l.svc).price); } }, { h: L('Klien', 'Client'), cls: 'r num', v: function (l) { return '<b>' + fmt.rp(M.lineFinal(l)) + '</b>'; } }], function (l) { return { t: sname(l.svc), r: fmt.rp(M.lineFinal(l)) }; }, null, { dense: true }), { icon: 'tag', right: more('RATE-002', r.id, null, L('Detail', 'Detail')) }); }).join('') || A.stateCard('empty', L('Belum ada Rate Card.', 'No Rate Card yet.'), A.pbtn('com.rate.edit', 'primary', L('Buat Rate Card', 'Create Rate Card'), 'plus', { go: 'RATE-001' })); break;
        case 'sla': {
          var sp = M.slaPerf(cl);
          body = tiles([tile({ k: 'On-time', v: pct(sp.ot), s: n0(sp.n) + ' order' }), tile({ k: 'At Risk', v: n0(sp.risk), tone: 'warn' }), tile({ k: 'Late', v: n0(sp.late), tone: sp.late ? 'crit' : '' }), tile({ k: L('Rata-rata TAT', 'Average TAT'), v: (sp.avgTat == null ? '—' : fmt.num(sp.avgTat, 1)) + ' ' + t(L('jam', 'h')) })], 'tls5-4') +
            card(L('SLA per property & layanan', 'SLA per property & service'), A.list(sp.rows, [{ h: 'Property', v: function (r) { return pname(r.prop); } }, { h: L('Layanan', 'Service'), v: function (r) { return sname(r.svc); } }, { h: 'On Track', cls: 'r num', v: function (r) { return n0(r.on); } }, { h: 'At Risk', cls: 'r num', v: function (r) { return n0(r.risk); } }, { h: 'Late', cls: 'r num', v: function (r) { return n0(r.late); } }, { h: 'On-time', cls: 'r num', v: function (r) { return pct(r.ot); } }, { h: 'TAT', cls: 'r num', v: function (r) { return fmt.num(r.tat, 1) + 'h'; } }],
              function (r) { return { t: pname(r.prop) + ' · ' + sname(r.svc), r: pct(r.ot), s: r.late + ' late · TAT ' + r.tat + 'h' }; }, null, { dense: true, empty: L('Belum ada data SLA.', 'No SLA data yet.') }), { icon: 'clock', right: more('SLA-001', null, { cl: cl }) });
          break;
        }
        case 'fin': body = '<div class="grid2">' + card(L('AR & kredit', 'AR & credit'), finBlock(cl), { icon: 'coins' }) + card(L('Profitabilitas (Sep)', 'Profitability (Sep)'), profitBlock(cl), { icon: 'percent' }) + '</div>'; break;
        case 'docs': body = card(L('Dokumen', 'Documents'), docList(M.docs(cx(), { cl: cl })), { icon: 'file', right: more('DOC-001', null, { cl: cl }) }); break;
        case 'hist': body = card(L('Timeline komersial', 'Commercial timeline'), timeline(M.timeline(cl), 40), { icon: 'history', right: more('HISTORY-001', null, { cl: cl }) }); break;
        case 'health': body = '<div class="grid2">' + card('Client Health', healthBlock(cl), { icon: 'gauge', right: more('HEALTH-001', null, { cl: cl }, L('Drill-down', 'Drill-down')) }) + card(L('Insight', 'Insight'), insightCard(M.insight(cl)).replace(/^<section class="card">|<\/section>$/g, ''), { icon: 'sparkles' }) + '</div>'; break;
        case 'opp': body = card('Opportunity', oppList(cl), { icon: 'sparkles', right: A.pbtn('com.opp.manage', 'ghost', L('Opportunity baru', 'New opportunity'), 'plus', { act: 'oppNew', val: cl, cls: 'btn-sm' }) }); break;
      }
      return c360Head(s, c) + (tab === 'ov' ? c360Tiles(s) + amActs(cl) : '') + tabs(avail.map(function (x) { return [x[0], x[1], x[2]]; }), tab, 'tab', { def: 'ov', label: 'Client 360' }) + body;
    },
    act: acts({ ctNew: function (el) { contactDlg(null, el.getAttribute('data-val')); } })
  };
  function docList(list) {
    return A.list(list, [
      { h: L('Dokumen', 'Document'), v: function (d) { return '<b>' + esc(d.n) + '</b><small class="sub5">' + esc(d.id) + ' · ' + esc(d.file) + '</small>'; } }, { h: L('Tipe', 'Type'), v: function (d) { return t(M.DOC_TYPES[d.type]); } },
      { h: L('Terkait', 'Related'), v: function (d) { return d.prop ? pname(d.prop) : d.ctr ? esc(d.ctr) : cname(d.cl); } }, { h: L('Tanggal', 'Date'), v: function (d) { return dt(d.date); } }, { h: L('Versi', 'Version'), cls: 'r', v: function (d) { return 'v' + d.v; } }, { h: 'Status', v: function (d) { return st(M.DOC_ST, d.status); } }
    ], function (d) { return { t: esc(d.n), s: t(M.DOC_TYPES[d.type]) + ' · v' + d.v + ' · ' + dt(d.date), chip: st(M.DOC_ST, d.status) }; }, function (d) { return open('DOC-001') ? href('DOC-001', d.id, { cl: d.cl }) : null; }, { dense: true, empty: L('Belum ada dokumen.', 'No document yet.') });
  }
  A.P6.docList = docList; A.P6.finBlock = finBlock; A.P6.profitBlock = profitBlock; A.P6.healthBlock = healthBlock; A.P6.dimTable = dimTable; A.P6.insightCard = insightCard; A.P6.svcTable = svcTable; A.P6.oppList = oppList; A.P6.recoCard = recoCard; A.P6.contactTree = contactTree; A.P6.propTable = propTable;

  /* ================= NP-01 · CLIENT-003 Create / Edit Client ================= */
  V['CLIENT-003'] = {
    title: function (rec) { return rec ? L('Ubah Klien', 'Edit Client') : L('Tambah Klien', 'Add Client'); },
    render: function (c) {
      var cl = c.rec ? M.client(c.rec) : null, isNew = !cl;
      if (!isNew && !M.canSeeClient(cx(), cl.id)) return A.stateCard('noperm', M.MSG.scope);
      if (isNew && !can('com.client.create')) return A.stateCard('noperm', M.MSG.noperm);
      var d = cl || { n: '', legal: '', type: 'hotel', ind: '', tax: '', addr: '', bill: '', city: '', status: 'prospect', am: (cx() && cx().employee) ? cx().employee.id : 'EMP-040', terms: 30, credit: 0, taxable: true, notes: '', group: false };
      var finOk = can('com.credit.edit');
      return A.pageHead(null, isNew ? t(L('Data diisi sekali dan dipakai di property, kontrak, invoice dan portal.', 'Entered once and reused in properties, contracts, invoices and the portal.')) : esc(cl.id) + ' · ' + t(L('Status, termin dan limit kredit dicatat di audit; termin dan limit kredit lewat persetujuan.', 'Status, terms and credit limit are audited; terms and credit limit go through approval.'))) +
        '<form class="card f6" id="f6" onsubmit="return false">' +
        '<h2 class="h5">' + ic('building') + t(L('Identitas', 'Identity')) + '</h2><div class="f6-g">' +
        fld(L('Nama klien', 'Client name'), inp('n', d.n), { req: true }) + fld(L('Nama legal', 'Legal name'), inp('legal', d.legal)) + fld(L('Jenis klien', 'Client type'), sel('type', opts(M.CLIENT_TYPES), d.type), { req: true }) + fld(L('Industri', 'Industry'), inp('ind', T(d.ind))) +
        fld(L('Grup / induk', 'Group / parent'), '<label class="sw6"><input type="checkbox" name="group"' + (d.group ? ' checked' : '') + '><span>' + t(L('Klien ini adalah grup dengan beberapa property', 'This client is a group with several properties')) + '</span></label>') + fld('NPWP', inp('tax', d.tax, { ph: L('01.234.567.8-901.000', '01.234.567.8-901.000') })) + '</div>' +
        '<h2 class="h5">' + ic('pin') + t(L('Alamat', 'Address')) + '</h2><div class="f6-g">' + fld(L('Alamat utama', 'Main address'), inp('addr', d.addr), { wide: true }) + fld(L('Alamat tagihan', 'Billing address'), inp('bill', d.bill), { wide: true, hint: t(L('Kosongkan bila sama dengan alamat utama.', 'Leave empty when it is the main address.')) }) + fld(L('Kota / area', 'City / area'), inp('city', d.city)) + '</div>' +
        '<h2 class="h5">' + ic('briefcase') + t(L('Komersial', 'Commercial')) + '</h2><div class="f6-g">' + fld('Status', sel('status', Object.keys(M.CLIENT_ST).map(function (k) { return [k, M.CLIENT_ST[k][0]]; }), d.status)) + fld('Account Manager', sel('am', amOpts(), d.am)) +
        fld(L('Termin pembayaran (hari)', 'Payment terms (days)'), finOk ? inp('terms', d.terms, { num: true }) : inp('terms', d.terms, { ro: true }), { hint: isNew ? '' : t(L('Perubahan masuk inbox persetujuan.', 'Changes go to the approval inbox.')) }) +
        fld(L('Limit kredit (Rp)', 'Credit limit (Rp)'), can('com.finance.view') ? (finOk ? inp('credit', d.credit, { num: true }) : inp('credit', d.credit, { ro: true })) : lock(), { hint: isNew ? '' : t(L('Perubahan masuk inbox persetujuan.', 'Changes go to the approval inbox.')) }) +
        fld(L('Mata uang', 'Currency'), inp('cur', 'IDR', { ro: true })) + fld(L('Kena pajak', 'Taxable'), '<label class="sw6"><input type="checkbox" name="taxable"' + (d.taxable ? ' checked' : '') + '><span>PPN 11%</span></label>') + '</div>' +
        fld(L('Catatan', 'Notes'), area('notes', T(d.notes)), { wide: true }) + (isNew ? '' : fld(L('Alasan perubahan', 'Reason for change'), inp('reason', '', { ph: L('Wajib bila status, termin, kredit atau AM berubah', 'Required when status, terms, credit or AM change') }), { wide: true })) +
        '<p class="dlg5-e" role="alert" id="f6-e"></p><div class="f6-a">' + A.backBtn('ghost') + A.btn('primary', isNew ? L('Simpan Klien', 'Save Client') : L('Simpan Perubahan', 'Save Changes'), 'check', { act: 'save' }) + '</div></form>';
    },
    act: {
      save: function () {
        var v = vals(document.getElementById('f6')), id = A.S.rec || null, cl = id ? M.client(id) : null;
        var d = { id: id, n: v.n, legal: v.legal, type: v.type, ind: v.ind, tax: v.tax, addr: v.addr, bill: v.bill || v.addr, city: v.city, status: v.status, am: v.am, taxable: v.taxable, notes: v.notes, group: v.group, reason: v.reason };
        if (v.terms !== undefined && can('com.credit.edit')) d.terms = num(v.terms);
        if (v.credit !== undefined && can('com.credit.edit')) d.credit = num(v.credit);
        if (cl && d.terms === cl.terms) delete d.terms; if (cl && d.credit === cl.credit) delete d.credit;
        var r = M.saveClient(cx(), d);
        if (!r.ok) { document.getElementById('f6-e').textContent = T(r.msg); return; }
        A.go('CLIENT-002', r.client.id);
        setTimeout(function () { A.toast(r.pending && r.pending.length ? L('Tersimpan. ' + r.pending.length + ' perubahan menunggu persetujuan.', 'Saved. ' + r.pending.length + ' change(s) awaiting approval.') : L('Data klien tersimpan.', 'Client saved.')); }, 300);
      }
    }
  };

  /* ================= NP-01 · PROPERTY-001 Property List ================= */
  V['PROPERTY-001'] = {
    render: function (c) {
      var q = c.q, c0 = cx(), list = M.searchProps(c0, { q: q.q, cl: q.cl, city: q.city, svc: q.svc, status: q.status, sla: q.sla, pic: q.pic });
      var fb = A.filters([{ k: 'cl', l: L('Grup klien', 'Client group'), opts: clientOpts() }, { k: 'city', l: L('Lokasi', 'Location'), opts: M.cities().map(function (x) { return [x, [x, x]]; }) }, { k: 'svc', l: L('Layanan', 'Service'), opts: M.services().map(function (s) { return [s.id, [s.n, s.n]]; }) }, { k: 'sla', l: 'SLA', opts: M.slaRules(c0).map(function (r) { return [r.id, [r.id, r.id]]; }) }, { k: 'status', l: 'Status', opts: Object.keys(M.PROP_ST).map(function (k) { return [k, M.PROP_ST[k][0]]; }) }],
        { search: L('Cari property, grup, PIC operasional', 'Search property, group, operational PIC'), force: true });
      return A.pageHead(null, t(L('Setiap property punya PIC, jadwal pickup, layanan, SLA dan tagihan sendiri.', 'Each property has its own PIC, pickup schedule, services, SLA and billing.')), A.pbtn('com.property.create', 'primary', L('Tambah Property', 'Add Property'), 'plus', { go: 'PROPERTY-003' })) +
        card(L('Daftar Property', 'Property List'), fb + A.list(list, [
          { h: 'Property', v: function (p) { return '<b>' + esc(p.n) + '</b><small class="sub5">' + esc(p.id) + '</small>'; } }, { h: L('Grup klien', 'Client group'), v: function (p) { return cname(p.cl); } }, { h: L('Lokasi', 'Location'), v: function (p) { return esc(p.city); } },
          { h: L('PIC operasional', 'Operational PIC'), v: function (p) { var o = M.contact(p.op); return o ? esc(o.n) : '—'; } }, { h: 'Pickup', v: function (p) { return esc(T(p.pickup)); } },
          { h: L('Layanan', 'Services'), v: function (p) { return M.svcConfig(p.id).filter(function (x) { return x.active; }).map(function (x) { return M.svcName(x.svc); }).join(', ') || '—'; } },
          { h: 'SLA', v: function (p) { var r = M.slaFor({ cl: p.cl, prop: p.id, svc: (M.svcConfig(p.id)[0] || {}).svc }); return r.rule ? esc(r.rule.id) + ' · ' + r.tat + 'h' : '—'; } }, { h: 'Status', v: function (p) { return prSt(p.status); } }
        ], function (p) { var o = M.contact(p.op); return { t: esc(p.n), s: cname(p.cl) + ' · ' + esc(p.city) + ' · ' + (o ? esc(o.n) : '—'), chip: prSt(p.status) }; }, function (p) { return href('PROPERTY-002', p.id); }, { dense: true, empty: L('Belum ada property.', 'No property yet.') }), { icon: 'hotel', count: list.length });
    }
  };

  /* ================= NP-01 · PROPERTY-002 Property Detail ================= */
  V['PROPERTY-002'] = {
    title: function (rec) { var p = M.prop(rec); return p ? p.n : L('Detail Property', 'Property Detail'); },
    render: function (c) {
      var p = M.prop(c.rec || 'PR-07A'); if (!p || !M.canSeeClient(cx(), p.cl)) return A.stateCard('empty', L('Property tidak ditemukan.', 'Property not found.'), A.backBtn());
      var cts = [['op', L('PIC operasional', 'Operational PIC')], ['pick', L('Kontak pickup', 'Pickup contact')], ['cmp', L('Kontak komplain', 'Complaint contact')], ['bill', L('PIC tagihan', 'Billing PIC')]];
      var ctrs = M.contractsForProp(p.id).filter(function (x) { return can('com.contract.view'); }), sp = M.slaPerf(p.cl, p.id), live = sp.live.filter(function (x) { return !x.done; });
      var head = '<section class="card c6-hd"><div class="c6-hd-m">' + avatar(p.n, 'av6-l') + '<div class="c6-hd-t"><h1>' + esc(p.n) + ' ' + prSt(p.status) + '</h1><p><span class="tg6">' + t(M.CLIENT_TYPES[p.type] || p.type) + '</span><span class="tg6 tg6-b">' + (open('CLIENT-002') ? lnk('CLIENT-002', p.cl, cname(p.cl)) : cname(p.cl)) + '</span><span class="sub5">' + esc(p.id) + ' · ' + esc(p.addr) + ', ' + esc(p.city) + '</span></p></div></div>' +
        '<div class="c6-hd-a">' + A.pbtn('com.property.edit', 'ghost', 'Edit', 'edit', { go: 'PROPERTY-003', rec: p.id, cls: 'btn-sm' }) + (open('SERVICE-002') ? A.btn('ghost', L('Atur Layanan', 'Configure Services'), 'washer', { go: 'SERVICE-002', qs: 'prop=' + p.id, cls: 'btn-sm' }) : '') + '</div></section>';
      var who = card(L('PIC & kontak', 'PICs & contacts'), '<ul class="rec6">' + cts.map(function (x) { var ct = M.contact(p[x[0]]); return ct ? '<li>' + avatar(ct.n) + '<div><b>' + ctLink(ct.id) + '</b><small>' + t(x[1]) + ' · ' + esc(T(ct.pos)) + '</small></div>' + reach(ct) + '</li>' : ''; }).join('') + '</ul>', { icon: 'idcard', right: more('CONTACT-001', null, { cl: p.cl, prop: p.id }) });
      var ops = card(L('Operasional', 'Operations'), kv([['Pickup', esc(T(p.pickup))], [L('Pengiriman', 'Delivery'), esc(T(p.delivery))], [L('Tagihan', 'Billing'), t(M.BILLING[p.billing])], [L('Mulai', 'Start'), dt(p.start)]]) + (T(p.instr) ? note(esc(T(p.instr)), 'clipboard') : ''), { icon: 'truck' });
      var svc = card(L('Layanan & SLA', 'Services & SLA'), svcTable(p.id), { icon: 'washer' });
      var sla = card(L('SLA berjalan', 'Running SLA'), tiles([tile({ k: 'On-time', v: pct(sp.ot) }), tile({ k: 'Late', v: n0(sp.late), tone: sp.late ? 'warn' : '' }), tile({ k: 'TAT', v: (sp.avgTat == null ? '—' : fmt.num(sp.avgTat, 1)) + 'h' })], 'tls5-3') +
        (live.length ? '<ul class="ck6l">' + live.map(function (k) { return '<li><a href="' + href('SLA-002', k.id) + '"><b class="mono6">' + esc(k.id) + '</b> · ' + sname(k.o.svc) + '</a>' + slaC(k.st) + '<span class="cb6"><i class="t6-' + (k.lvl || 'ok') + '" style="width:' + Math.min(100, k.pct) + '%"></i></span><small>' + fmt.num(k.pct, 0) + '% · ' + t(L('sisa ', 'left ')) + fmt.num(Math.max(0, k.left), 1) + 'h</small></li>'; }).join('') + '</ul>' : A.empty(L('Tidak ada order dengan SLA berjalan.', 'No order with a running SLA.'))), { icon: 'clock', right: more('SLA-001', null, { prop: p.id }) });
      var ctr = can('com.contract.view') ? card(L('Kontrak', 'Contracts'), ctrs.length ? '<ul class="ln6">' + ctrs.map(function (x) { return '<li>' + ctrLink(x.no) + ' v' + x.v + ' · ' + dts(x.start) + ' – ' + dts(x.end) + ' ' + ctrSt(x) + (x.props.length > 1 ? '<small class="sub5">' + t(L('Kontrak multi-property (' + x.props.length + ')', 'Multi-property contract (' + x.props.length + ')')) + '</small>' : '') + '</li>'; }).join('') + '</ul>' : A.empty(L('Belum ada kontrak aktif.', 'No active contract yet.')), { icon: 'contract' }) : '';
      if (mob()) return head + who + ops + sla + svc + ctr;
      return head + '<div class="grid2"><div class="stack5">' + who + ops + ctr + '</div><div class="stack5">' + svc + sla + '</div></div>' + (can('com.client.view') && !M.isClient(cx()) ? amActs(p.cl, p.id) : '');
    },
    act: acts()
  };

  /* ================= NP-01 · PROPERTY-003 Create / Edit Property ================= */
  V['PROPERTY-003'] = {
    title: function (rec) { return rec ? L('Ubah Property', 'Edit Property') : L('Tambah Property', 'Add Property'); },
    render: function (c) {
      var p = c.rec ? M.prop(c.rec) : null, isNew = !p, clId = p ? p.cl : (c.q.cl || 'CL-07'), cl = M.client(clId);
      if (isNew && !can('com.property.create')) return A.stateCard('noperm', M.MSG.noperm);
      if (!cl || !M.canSeeClient(cx(), clId)) return A.stateCard('noperm', M.MSG.scope);
      var d = p || { n: '', type: cl.type, addr: cl.addr, city: cl.city, op: '', bill: '', pick: '', cmp: '', pickup: '', delivery: '', billing: cl.group ? 'group' : 'client', status: 'active', instr: '' };
      var co = [['', L('Pilih kontak', 'Choose a contact')]].concat(M.contacts(cx(), { cl: clId }).map(function (x) { return [x.id, [x.n + ' · ' + T(x.pos), x.n + ' · ' + (Array.isArray(x.pos) ? x.pos[1] : x.pos)]]; }));
      return A.pageHead(null, isNew ? t(L('Alamat dan jenis diambil dari data klien; ubah bila property berbeda.', 'Address and type come from the client record; change them when the property differs.')) : esc(p.id) + ' · ' + cname(p.cl)) +
        '<form class="card f6" id="f6" onsubmit="return false"><div class="f6-g">' +
        fld(L('Klien (grup)', 'Client (group)'), isNew ? sel('cl', clientOpts(), clId) : inp('clv', cl.n, { ro: true }), { req: true }) + fld(L('Nama property', 'Property name'), inp('n', d.n), { req: true }) + fld(L('Jenis property', 'Property type'), sel('type', opts(M.CLIENT_TYPES), d.type)) +
        fld(L('Alamat', 'Address'), inp('addr', d.addr), { wide: true }) + fld(L('Kota / area', 'City / area'), inp('city', d.city)) + fld('Status', sel('status', Object.keys(M.PROP_ST).map(function (k) { return [k, M.PROP_ST[k][0]]; }), d.status)) + '</div>' +
        '<h2 class="h5">' + ic('idcard') + t(L('PIC (dari kontak klien)', 'PICs (from client contacts)')) + '</h2><div class="f6-g">' + fld(L('PIC operasional', 'Operational PIC'), sel('op', co, d.op)) + fld(L('PIC tagihan', 'Billing PIC'), sel('bill', co, d.bill)) + fld(L('Kontak pickup', 'Pickup contact'), sel('pick', co, d.pick)) + fld(L('Kontak komplain', 'Complaint contact'), sel('cmp', co, d.cmp)) + '</div>' +
        '<h2 class="h5">' + ic('truck') + t(L('Jadwal & tagihan', 'Schedule & billing')) + '</h2><div class="f6-g">' + fld(L('Jadwal pickup', 'Pickup schedule'), inp('pickup', T(d.pickup), { ph: L('Setiap hari 07:00', 'Daily 07:00') })) + fld(L('Jadwal pengiriman', 'Delivery schedule'), inp('delivery', T(d.delivery), { ph: L('Setiap hari 16:00', 'Daily 16:00') })) + fld(L('Pengaturan tagihan', 'Billing arrangement'), sel('billing', opts(M.BILLING), d.billing)) + '</div>' +
        fld(L('Instruksi khusus', 'Special instructions'), area('instr', T(d.instr)), { wide: true }) + (isNew ? '' : fld(L('Alasan perubahan status', 'Reason for a status change'), inp('reason', ''), { wide: true })) +
        '<p class="dlg5-e" role="alert" id="f6-e"></p><div class="f6-a">' + A.backBtn('ghost') + A.btn('primary', L('Simpan Property', 'Save Property'), 'check', { act: 'save' }) + '</div></form>';
    },
    act: {
      save: function () {
        var v = vals(document.getElementById('f6')), id = A.S.rec || null, p = id ? M.prop(id) : null;
        var r = M.saveProperty(cx(), { id: id, cl: v.cl || (p && p.cl), n: v.n, type: v.type, addr: v.addr, city: v.city, status: v.status, op: v.op || null, bill: v.bill || null, pick: v.pick || null, cmp: v.cmp || null, pickup: v.pickup || undefined, delivery: v.delivery || undefined, billing: v.billing, instr: v.instr, reason: v.reason });
        if (!r.ok) { document.getElementById('f6-e').textContent = T(r.msg); return; }
        A.go('PROPERTY-002', r.prop.id); setTimeout(function () { A.toast(L('Property tersimpan.', 'Property saved.')); }, 300);
      }
    }
  };

  /* ================= NP-02 · CONTACT-001 Contact Directory ================= */
  function contactDlg(ct, cl) {
    var c0 = ct || { n: '', pos: '', dept: '', cl: cl || 'CL-07', scope: 'single', props: [], phone: '', email: '', pref: 'wa', roles: [] };
    var clId = c0.cl, props = M.propsOf(clId, true).map(function (p) { return [p.id, [p.n, p.n]]; });
    dlg({ title: ct ? L('Ubah kontak', 'Edit contact') : L('Tambah kontak', 'Add contact'), sub: cname(clId), icon: 'idcard',
      body: '<div class="f6-g">' + fld(L('Nama', 'Name'), inp('n', c0.n), { req: true }) + fld(L('Posisi', 'Position'), inp('pos', T(c0.pos))) + fld(L('Departemen', 'Department'), inp('dept', T(c0.dept))) +
        fld(L('Telepon / WhatsApp', 'Phone / WhatsApp'), inp('phone', c0.phone, { ph: '+62 812 …' })) + fld('Email', inp('email', c0.email, { type: 'email' })) + fld(L('Cara kontak utama', 'Preferred method'), sel('pref', opts(M.PREF), c0.pref)) + '</div>' +
        fld(L('Cakupan', 'Scope'), sel('scope', opts(M.CT_SCOPE), c0.scope), { req: true, hint: t(L('Semua = tingkat grup. Satu / terpilih = tingkat property.', 'All = group level. Single / selected = property level.')) }) + fld('Property', checks('props', props, c0.props), { wide: true }) +
        fld(L('Peran kontak', 'Contact roles'), checks('roles', M.CT_ROLES.map(function (r) { return [r[0], r[1]]; }), c0.roles), { req: true, wide: true }),
      onOk: function (v) { var r = M.saveContact(cx(), { id: ct ? ct.id : null, n: v.n, pos: v.pos, dept: v.dept, cl: clId, phone: v.phone, email: v.email, pref: v.pref, scope: v.scope, props: v.props || [], roles: v.roles || [] }); if (!r.ok) return r.msg; after(L('Kontak tersimpan.', 'Contact saved.')); return true; } });
  }
  A.P6.contactDlg = contactDlg;
  V['CONTACT-001'] = {
    render: function (c) {
      var q = c.q, view = q.view === 'org' ? 'org' : 'list', cl = q.cl || '', c0 = cx();
      var head = A.pageHead(null, t(L('Kontak tingkat grup (keputusan, kontrak, harga) dan tingkat property (operasional, pickup, komplain).', 'Group-level contacts (decisions, contracts, pricing) and property-level contacts (operations, pickup, complaints).')), A.pbtn('com.contact.manage', 'primary', L('Tambah Kontak', 'Add Contact'), 'plus', { act: 'ctNew', val: cl || 'CL-07' }));
      var vt = tabs([['list', L('Daftar Kontak', 'Contact List'), 'list'], ['org', L('Struktur Organisasi', 'Organisation'), 'users']], view, 'view', { def: 'list', label: L('Tampilan', 'View') });
      if (view === 'org') {
        var oc = cl || 'CL-07';
        return head + vt + A.filters([{ k: 'cl', l: L('Klien', 'Client'), opts: clientOpts() }], { force: true }) + '<div class="grid2"><div>' + card(cname(oc), contactTree(oc), { icon: 'building' }) + '</div><div>' + recoCard(oc, q) + '</div></div>';
      }
      var list = M.contacts(c0, { q: q.q, cl: cl || null, level: q.level || null, role: q.role || null, prop: q.prop || null });
      var fb = A.filters([{ k: 'cl', l: L('Klien', 'Client'), opts: clientOpts() }, { k: 'level', l: 'Level', opts: [['group', L('Grup', 'Group')], ['property', 'Property']] }, { k: 'role', l: L('Peran', 'Role'), opts: M.CT_ROLES.map(function (r) { return [r[0], r[1]]; }) }].concat(cl ? [{ k: 'prop', l: 'Property', opts: propOpts(cl) }] : []), { search: L('Cari nama, posisi, property, telepon', 'Search name, position, property, phone'), force: true });
      return head + vt + card(L('Daftar Kontak', 'Contact List'), fb + A.list(list, [
        { h: L('Nama', 'Name'), v: function (x) { return '<span class="nm6">' + avatar(x.n) + '<span><b>' + esc(x.n) + '</b><small class="sub5">' + esc(T(x.pos)) + '</small></span></span>'; } },
        { h: L('Klien', 'Client'), v: function (x) { return cname(x.cl); } }, { h: 'Level', v: function (x) { return x.level === 'group' ? A.chip('info', L('Grup', 'Group'), 'building') : A.chip('mute', 'Property', 'hotel'); } },
        { h: L('Cakupan', 'Scope'), v: function (x) { return esc(M.scopeLabel(x)); } }, { h: L('Peran', 'Roles'), v: function (x) { return roleChips(x, 3); } }, { h: L('Kontak', 'Reach'), v: function (x) { return esc(x.phone) + '<small class="sub5">' + esc(x.email) + '</small>'; } }
      ], function (x) { return { t: esc(x.n), s: esc(T(x.pos)) + ' · ' + cname(x.cl) + ' · ' + esc(M.scopeLabel(x)), chip: reach(x) }; }, function (x) { return href('CONTACT-002', x.id); }, { dense: true, empty: L('Belum ada contact.', 'No contact yet.') }), { icon: 'idcard', count: list.length }) +
        (cl ? recoCard(cl, q) : '');
    },
    act: { ctNew: function (el) { contactDlg(null, el.getAttribute('data-val')); } }
  };

  /* ================= NP-02 · CONTACT-002 Contact Detail ================= */
  V['CONTACT-002'] = {
    title: function (rec) { var c = M.contact(rec); return c ? c.n : L('Detail Kontak', 'Contact Detail'); },
    render: function (c) {
      var ct = M.contact(c.rec || 'CT-074'); if (!ct || !M.canSeeClient(cx(), ct.cl)) return A.stateCard('empty', L('Kontak tidak ditemukan.', 'Contact not found.'), A.backBtn());
      var has = function (r) { return ct.roles.indexOf(r) >= 0 ? A.chip('ok', L('Ya', 'Yes')) : A.chip('mute', L('Tidak', 'No')); };
      var prof = '<section class="card ct6"><div class="ct6-h">' + avatar(ct.n, 'av6-xl') + '<div><h1>' + esc(ct.n) + ' ' + (ct.active ? A.chip('ok', L('Aktif', 'Active')) : A.chip('mute', L('Nonaktif', 'Inactive'))) + '</h1><p>' + esc(T(ct.pos)) + ' · ' + (open('CLIENT-002') ? clLink(ct.cl) : cname(ct.cl)) + '</p>' + roleChips(ct) + '</div></div>' + reach(ct, { big: true }) + '</section>';
      var info = card(L('Detail', 'Detail'), kv([[L('Departemen', 'Department'), esc(T(ct.dept) || '—')], ['Level', ct.level === 'group' ? t(L('Grup', 'Group')) : 'Property'], [L('Cakupan', 'Scope'), t(M.CT_SCOPE[ct.scope]) + (ct.scope !== 'all' ? ': ' + ct.props.map(function (p) { return prLink(p); }).join(', ') : '')], [L('Telepon', 'Phone'), esc(ct.phone || '—')], ['WhatsApp', esc(ct.wa || '—')], ['Email', esc(ct.email || '—')], [L('Cara kontak utama', 'Preferred contact'), t(M.PREF[ct.pref])], [L('Pengambil keputusan', 'Decision maker'), has('decision')], [L('Kontak tagihan', 'Billing contact'), has('billing')]]) + (T(ct.notes) ? note(esc(T(ct.notes)), 'edit') : ''), { icon: 'user' });
      var roles = card(L('Peran kontak', 'Contact roles'), '<ul class="rl6">' + M.CT_ROLES.map(function (r) { var on = ct.roles.indexOf(r[0]) >= 0; return '<li class="' + (on ? 'on' : '') + '">' + ic(on ? 'checkc' : 'minus') + '<span>' + t(r[1]) + '</span></li>'; }).join('') + '</ul>', { icon: 'clipboard' });
      var acts2 = (can('com.contact.manage') ? A.btn('ghost', 'Edit', 'edit', { act: 'edit' }) + (ct.active ? A.btn('ghost', L('Nonaktifkan', 'Deactivate'), 'ban', { act: 'off' }) : A.btn('ghost', L('Aktifkan', 'Activate'), 'check', { act: 'on' })) : '');
      return prof + (acts2 ? '<div class="f6-a f6-al">' + acts2 + '</div>' : '') + (mob() ? info + roles : '<div class="grid2">' + info + roles + '</div>');
    },
    act: {
      edit: function () { contactDlg(M.contact(A.S.rec)); },
      off: function () { dlg({ title: L('Nonaktifkan kontak', 'Deactivate contact'), sub: t(L('Kontak tidak dihapus; riwayat tetap tersimpan.', 'The contact is not deleted; history is kept.')), body: fld(L('Alasan', 'Reason'), area('r', ''), { req: true }), ok: L('Nonaktifkan', 'Deactivate'), icon: 'ban', onOk: function (v) { var r = M.setContactActive(cx(), A.S.rec, false, v.r); if (!r.ok) return r.msg; after(L('Kontak dinonaktifkan.', 'Contact deactivated.')); return true; } }); },
      on: function () { var r = M.setContactActive(cx(), A.S.rec, true); if (!r.ok) return fail(r); after(L('Kontak aktif kembali.', 'Contact active again.')); }
    }
  };

  /* ================= NP-03 · SERVICE-001 Service Catalog ================= */
  V['SERVICE-001'] = {
    render: function () {
      var list = M.services();
      return A.pageHead(null, t(L('Service Master adalah standar global. Tarif dan SLA klien diatur per property di Layanan per Klien.', 'The Service Master is the global standard. Client rates and SLA are set per property in Client Service Selection.'))) +
        tabs([['cat', L('Katalog Layanan', 'Service Catalog'), 'washer'], ['sel', L('Layanan per Klien', 'Client Service Selection'), 'layers']], 'cat', 'tab', { def: 'cat', hf: function (k) { return k === 'sel' ? href('SERVICE-002') : href('SERVICE-001'); } }) +
        '<div class="sv6">' + list.map(function (s) {
          var used = M.state().cs.filter(function (x) { return x.svc === s.id && x.active; }).length;
          return '<article class="sv6-c"><span class="sv6-i">' + ic(s.icon) + '</span><div><b>' + esc(s.n) + '</b><small class="mono6">' + esc(s.id) + '</small></div>' +
            '<dl><div><dt>' + t(L('Unit', 'Unit')) + '</dt><dd>' + t(M.UNITS[s.unit]) + '</dd></div><div><dt>' + t(L('Harga master', 'Master price')) + '</dt><dd>' + price(s.price) + '</dd></div><div><dt>' + t(L('SLA standar', 'Standard SLA')) + '</dt><dd>' + s.sla + ' ' + t(L('jam', 'h')) + '</dd></div><div><dt>' + t(L('Dipakai', 'Used by')) + '</dt><dd>' + used + ' property</dd></div></dl>' +
            '<p>' + esc(T(s.desc)) + '</p><small class="sub5">' + esc(T(s.proc)) + '</small><small class="sub5">' + t(L('Item: ', 'Items: ')) + esc(T(s.items)) + '</small>' +
            '<div class="sv6-f">' + (s.active ? A.chip('ok', L('Aktif', 'Active')) : A.chip('mute', L('Nonaktif', 'Inactive'))) + (can('com.rate.approve') && !mob() ? A.btn('ghost', L('Ubah harga master', 'Change master price'), 'edit', { act: 'master', val: s.id, cls: 'btn-sm' }) : '') + '</div></article>';
        }).join('') + '</div>' + note(t(L('Mengubah harga master tidak mengubah tarif klien. Tarif klien hanya berubah lewat pengajuan Rate Card dan persetujuan.', 'Changing a master price never changes client rates. Client rates only change through a Rate Card request and approval.')), 'shield');
    },
    act: {
      master: function (el) {
        var s = M.service(el.getAttribute('data-val'));
        dlg({ title: L('Ubah harga master', 'Change master price'), sub: esc(s.n) + ' · ' + fmt.rp(s.price), icon: 'tag', body: fld(L('Harga master baru (Rp)', 'New master price (Rp)'), inp('p', s.price, { num: true }), { req: true }) + fld(L('Alasan', 'Reason'), area('r', ''), { req: true }),
          onOk: function (v) { var r = M.setMasterPrice(cx(), s.id, num(v.p), v.r); if (!r.ok) return r.msg; after(L('Harga master diubah. ' + r.kept + ' tarif klien tetap.', 'Master price changed. ' + r.kept + ' client rate(s) unchanged.')); return true; } });
      }
    }
  };

  /* ================= NP-03 · SERVICE-002 Client Service Selection ================= */
  V['SERVICE-002'] = {
    render: function (c) {
      var c0 = cx(), prop = c.q.prop || 'PR-07A', p = M.prop(prop);
      if (!p || !M.canSeeClient(c0, p.cl)) return A.stateCard('noperm', M.MSG.scope);
      var rows = M.services().map(function (s) { return M.svcLine(prop, s.id); }), on = rows.filter(function (l) { return l.active; });
      var propSel = '<div class="fb"><label class="fb-f"><span class="sr">Property</span><select data-f="prop">' + M.state().props.filter(function (x) { return M.canSeeClient(c0, x.cl) && (!c.q.cl || x.cl === c.q.cl); }).map(function (x) { return '<option value="' + x.id + '"' + (x.id === prop ? ' selected' : '') + '>' + esc(M.clientName(x.cl) + ' · ' + x.n) + '</option>'; }).join('') + '</select></label></div>';
      return A.pageHead(null, t(L('Hanya layanan yang dipilih untuk property ini yang bisa dipesan. Tarif dan SLA khusus menimpa standar.', 'Only services enabled for this property can be ordered. Custom rates and SLA override the standard.'))) +
        tabs([['cat', L('Katalog Layanan', 'Service Catalog'), 'washer'], ['sel', L('Layanan per Klien', 'Client Service Selection'), 'layers']], 'sel', 'tab', { def: 'sel', hf: function (k) { return k === 'cat' ? href('SERVICE-001') : href('SERVICE-002', null, { prop: prop }); } }) +
        card(L('Layanan untuk ', 'Services for ') + p.n, propSel + A.list(rows, [
          { h: L('Layanan', 'Service'), v: function (l) { return '<b>' + esc(l.sv.n) + '</b><small class="sub5">' + esc(l.svc) + (l.custom ? ' · ' + t(L('khusus klien', 'client-specific')) : ' · ' + t(L('standar', 'standard'))) + '</small>'; } },
          { h: L('Unit', 'Unit'), v: function (l) { return esc(l.sv.unit); } },
          { h: 'Master', cls: 'r num', v: function (l) { return price(l.master); } },
          { h: L('Harga klien', 'Client rate'), cls: 'r num', v: function (l) { return l.active ? '<b>' + price(l.rate) + '</b>' + (can('com.rate.view') && l.rc ? '<small class="sub5">' + esc(l.rc) + '</small>' : '') : '—'; } },
          { h: 'SLA', cls: 'r', v: function (l) { return l.active ? l.sla + 'h' + (l.sla !== l.masterSla ? ' <small class="sub5">std ' + l.masterSla + 'h</small>' : '') : '—'; } },
          { h: L('Instruksi', 'Instruction'), v: function (l) { return l.cfg && T(l.cfg.instr) ? esc(T(l.cfg.instr)) : '—'; } },
          { h: 'Status', v: function (l) { return l.active ? A.chip('ok', L('Aktif', 'Active')) : l.cfg ? A.chip('mute', L('Nonaktif', 'Inactive')) : A.chip('mute', L('Tidak dipilih', 'Not enabled')); } },
          { h: '', v: function (l) { return can('com.service.edit') ? A.btn('ghost', L('Atur', 'Set'), 'edit', { act: 'cfg', val: l.svc, cls: 'btn-sm' }) : ''; } }
        ], function (l) { return { t: esc(l.sv.n), r: l.active && can('com.rate.view') ? rpFull(l.rate) : '', s: l.active ? l.sla + 'h' + (l.cfg && T(l.cfg.instr) ? ' · ' + esc(T(l.cfg.instr)) : '') : t(L('Tidak dipilih', 'Not enabled')), chip: l.active ? A.chip('ok', L('Aktif', 'Active')) : '' }; }, null, { dense: true }), { icon: 'layers', count: on.length }) +
        note(t(L('Tarif klien diambil dari Rate Card yang berlaku. Untuk mengubah tarif, ajukan lewat Editor Tarif (butuh persetujuan).', 'Client rates come from the Rate Card in force. To change a rate, request it in the Rate Editor (approval needed).')), 'tag');
    },
    act: {
      cfg: function (el) {
        var prop = A.S.q.prop || 'PR-07A', svc = el.getAttribute('data-val'), row = M.svcRow(prop, svc) || { active: false, instr: '', items: '', express: false, minCharge: 0, notes: '' }, l = M.svcLine(prop, svc), rc = l.rc || (M.rateCards(cx(), { cl: M.prop(prop).cl })[0] || {}).id;
        dlg({ title: L('Atur layanan', 'Configure service'), sub: esc(l.sv.n) + ' · ' + pname(prop), icon: 'washer',
          body: fld('Status', '<label class="sw6"><input type="checkbox" name="active"' + (row.active ? ' checked' : '') + '><span>' + t(L('Layanan aktif untuk property ini', 'Service enabled for this property')) + '</span></label>') +
            fld(L('Instruksi khusus', 'Special instruction'), inp('instr', T(row.instr))) + fld(L('Item berlaku', 'Applicable items'), inp('items', T(row.items))) + fld(L('Kebutuhan pickup', 'Pickup requirement'), inp('pickup', T(row.pickup))) +
            fld(L('Boleh express', 'Express eligible'), '<label class="sw6"><input type="checkbox" name="express"' + (row.express ? ' checked' : '') + '><span>' + t(L('Ya', 'Yes')) + '</span></label>') + fld(L('Minimum charge (Rp)', 'Minimum charge (Rp)'), inp('minCharge', row.minCharge || 0, { num: true })) + fld(L('Catatan', 'Notes'), inp('notes', T(row.notes))) +
            (can('com.rate.edit') && rc ? note(t(L('Tarif: ', 'Rate: ')) + (can('com.rate.view') ? fmt.rp(l.rate) : '') + ' · <a class="lnk5" href="' + href('RATE-003', rc, { svc: svc }) + '">' + t(L('Ajukan perubahan tarif', 'Request a rate change')) + '</a>', 'tag') : ''),
          onOk: function (v) { var r = M.saveSvcConfig(cx(), prop, svc, { active: v.active, instr: v.instr, items: v.items, pickup: v.pickup, express: v.express, minCharge: num(v.minCharge) || 0, notes: v.notes }); if (!r.ok) return r.msg; after(L('Layanan diperbarui.', 'Service updated.')); return true; } });
      }
    }
  };
})();
