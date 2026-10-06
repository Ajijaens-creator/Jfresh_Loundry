/* JFRESH OS — Phase 5 screens (part 1): shared helpers, NP-01 Executive Business
   Health, NP-02 Financial Health, NP-03 Goal Cascade, NP-04 KPI Master, NP-05 XScore.
   Every number comes from the performance engine (assets/js/jfos-perf.js); every
   protected action goes through the engine, which checks the permission and audits. */
(function () {
  var A = window.JFAPP, C = window.JFOS, X = window.JFACCESS, P = window.JFPERF;
  if (!A || !P) return;
  var V = A.V, D = P.D;
  var T = A.T, L = A.L, t = A.t, esc = A.esc, ic = A.ic, can = A.can, fmt = A.fmt, href = A.href;
  A.addParents(P.PARENTS);

  /* ================= Shared helpers (also used by screens-perf2.js) ================= */
  function cx() { return A.ctx(); }
  function open(id) { var c = cx(); return c ? X.canScreen(c, id) : can((C.screen(id) || {}).p); }
  function lnk(id, rec, label, q) { return open(id) ? '<a class="lnk5" href="' + href(id, rec, q) + '">' + label + '</a>' : label; }
  function by(arr, k, v) { return arr.filter(function (x) { return x[k] === v; })[0]; }
  function sum(a) { return a.reduce(function (s, x) { return s + (+x || 0); }, 0); }
  function sc1(v) { return v == null ? '—' : fmt.num(v, 1); }
  function pct(v, d) { return v == null || isNaN(v) ? '—' : fmt.num(v, d == null ? 1 : d) + '%'; }
  function fv(v, unit) {
    if (v == null || isNaN(v)) return '—';
    var u = T(unit) || '';
    if (u === 'Rp') return fmt.rpShort(v);
    if (u === '%') return fmt.num(v, Math.abs(v) < 1 ? 2 : 1) + '%';
    if (u.indexOf('Rp/') === 0) return 'Rp ' + fmt.num(v, 0) + u.slice(2);
    return fmt.num(v, v % 1 ? (Math.abs(v) < 1 ? 2 : 1) : 0) + (u ? ' ' + u : '');
  }
  function rpj(v) { return fmt.rpShort(v); }
  var MON = { id: ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'], en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] };
  function mon(ym, yr) { var p = String(ym).split('-'); return MON[A.S.lang === 'en' ? 'en' : 'id'][+p[1] - 1] + (yr ? ' ' + p[0] : ''); }
  function dt(s) { if (!s) return '—'; var p = String(s).slice(0, 10).split('-'); return fmt.date(new Date(+p[0], +p[1] - 1, +p[2]).getTime()) + (String(s).length > 10 ? ' ' + String(s).slice(11, 16) : ''); }
  function dtt(ms) { return ms ? fmt.date(ms) + ' ' + fmt.time(ms) : '—'; }
  function emp(id) { return P.empName(id); }
  function stc(st) { var x = P.ST[st] || P.ST.progress; return A.chip(x.tone, x.n, x.icon); }
  function bandc(b) { return A.chip(b.tone, b.n); }
  function sevc(sev) { var x = P.SEV[sev] || P.SEV.info; return A.chip(x.tone, x.n); }
  function lifec(s) { var x = P.LIFE[s] || P.LIFE.draft; return A.chip(x.tone, x.n); }
  function trendc(k) { var x = P.TREND[k] || P.TREND.stable; return A.chip(x.tone, x.n, x.icon); }
  function dot(st) { return '<i class="dot5 d-' + ((P.ST[st] || {}).tone || 'mute') + '" aria-hidden="true"></i>'; }
  function bar(v, tone) { return '<span class="pb5" role="img" aria-label="' + esc(pct(v, 0)) + '"><i class="t-' + (tone || 'info') + '" style="width:' + Math.max(2, Math.min(100, v || 0)) + '%"></i></span>'; }
  function delta(d, o) {
    o = o || {};
    if (d == null || isNaN(d)) return '';
    var flat = Math.abs(d) < 0.05, good = o.dir === 'lower' ? d < 0 : d > 0, tone = flat ? 'mute' : good ? 'ok' : 'crit';
    return '<span class="dl5 dl-' + tone + '">' + ic(flat ? 'minus' : d > 0 ? 'arrowup' : 'arrowdn') + '<span>' + (d > 0 ? '+' : '') + (o.fmt ? o.fmt(d) : fmt.num(d, 1)) + (o.u || '') + '</span></span>';
  }
  var PROG_SRC = { kpi: L('KPI', 'KPIs'), ms: L('milestone', 'milestones'), race: 'race', children: L('goal turunan', 'child goals'), manual: L('koreksi manual', 'manual adjustment'), none: L('belum ada data', 'no data yet') };
  function progSrcLabel(src) { return String(src || 'none').split('+').map(function (k) { return PROG_SRC[k] ? t(PROG_SRC[k]) : esc(k); }).join(' + '); }
  function ring(score, o) {
    o = o || {};
    var sz = o.size || 88, sw = o.sw || Math.max(6, Math.round(sz / 10)), r = (sz - sw) / 2, c = 2 * Math.PI * r, v = Math.max(0, Math.min(100, score || 0)), band = o.band || P.band(score || 0), m = sz / 2;
    return '<span class="ring5 r-' + band.tone + '" style="--sz:' + sz + 'px" role="img" aria-label="' + esc((o.label ? T(o.label) + ': ' : '') + sc1(score) + ' · ' + T(band.n)) + '">' +
      '<svg viewBox="0 0 ' + sz + ' ' + sz + '" aria-hidden="true"><circle cx="' + m + '" cy="' + m + '" r="' + r + '" class="rt" stroke-width="' + sw + '"/>' +
      '<circle cx="' + m + '" cy="' + m + '" r="' + r + '" class="rv" stroke-width="' + sw + '" stroke-dasharray="' + (c * v / 100).toFixed(1) + ' ' + c.toFixed(1) + '" transform="rotate(-90 ' + m + ' ' + m + ')"/></svg>' +
      '<b class="num">' + sc1(score) + '</b></span>';
  }
  function spark(vals, o) {
    o = o || {};
    vals = (vals || []).filter(function (v) { return v != null && !isNaN(v); });
    if (vals.length < 2) return '';
    var w = o.w || 96, h = o.h || 28, mn = Math.min.apply(null, vals), mx = Math.max.apply(null, vals), sp = mx - mn || 1, n = vals.length;
    if (o.bars) {
      var bw = w / n;
      return '<svg class="spk5" viewBox="0 0 ' + w + ' ' + h + '" aria-hidden="true">' + vals.map(function (v, i) { var bh = 4 + (h - 4) * (v - mn) / sp; return '<rect x="' + (i * bw + 1).toFixed(1) + '" y="' + (h - bh).toFixed(1) + '" width="' + Math.max(2, bw - 3).toFixed(1) + '" height="' + bh.toFixed(1) + '" rx="1.5"' + (i === n - 1 ? ' class="hi"' : '') + '/>'; }).join('') + '</svg>';
    }
    var pts = vals.map(function (v, i) { return (i * (w - 4) / (n - 1) + 2).toFixed(1) + ',' + (h - 3 - (h - 6) * (v - mn) / sp).toFixed(1); });
    return '<svg class="spk5" viewBox="0 0 ' + w + ' ' + h + '" aria-hidden="true"><polyline points="' + pts.join(' ') + '"/><circle cx="' + pts[n - 1].split(',')[0] + '" cy="' + pts[n - 1].split(',')[1] + '" r="2.6"/></svg>';
  }
  function qhref(over) {
    var q = Object.assign({}, A.S.q, over || {});
    Object.keys(q).forEach(function (k) { if (q[k] == null || q[k] === '') delete q[k]; });
    delete q.state;
    return href(A.S.screen, A.S.rec, q);
  }
  // Tabs / segmented control. items: [key, label, icon?, count?]
  function tabs(items, cur, key, o) {
    o = o || {};
    return '<nav class="tabs scroll tabs5' + (o.seg ? ' seg5' : '') + '" aria-label="' + t(o.label || L('Bagian', 'Sections')) + '">' + items.map(function (x) {
      var on = x[0] === cur, over = {}; over[key] = x[0] === (o.def || '') ? null : x[0];
      return '<a href="' + (o.hf ? o.hf(x[0]) : qhref(over)) + '" aria-selected="' + on + '"' + (on ? ' aria-current="true"' : '') + '>' + (x[2] ? ic(x[2]) : '') + '<span>' + t(x[1]) + '</span>' + (x[3] != null ? '<b>' + x[3] + '</b>' : '') + '</a>';
    }).join('') + '</nav>';
  }
  function after(msg, tone) { A.rerender(); setTimeout(function () { A.toast(msg, tone); }, 280); }
  function fail(r) { A.toast(r && r.msg ? r.msg : P.MSG.invalid, 'crit'); return false; }
  function card(title, body, o) { return A.section(title, body, o); }
  function kv(items) { return '<dl class="kv5">' + items.filter(Boolean).map(function (x) { return '<div><dt>' + t(x[0]) + '</dt><dd>' + x[1] + '</dd></div>'; }).join('') + '</dl>'; }
  function note(txt, icon, tone) { return '<p class="note5' + (tone ? ' n-' + tone : '') + '">' + ic(icon || 'info') + '<span>' + txt + '</span></p>'; }
  function tile(o) {
    var tag = o.href ? 'a' : 'div';
    return '<' + tag + ' class="tl5' + (o.tone ? ' tl-' + o.tone : '') + (o.ring != null ? ' tl5-r' : '') + '"' + (o.href ? ' href="' + o.href + '"' : '') + '>' +
      '<span class="tl5-k">' + t(o.k) + '</span>' + (o.ring != null ? ring(o.ring, { size: o.size || 72, label: o.k }) : '<span class="tl5-v num">' + o.v + '</span>') +
      '<span class="tl5-s">' + (o.s || '') + '</span>' + (o.spark || '') + '</' + tag + '>';
  }
  function tiles(list, cls) { return '<div class="tls5' + (cls ? ' ' + cls : '') + '">' + list.join('') + '</div>'; }
  function peopleOpts(blank) {
    var o = D.PEOPLE.map(function (p) { return [p.id, [p.n + ' · ' + p.title[0], p.n + ' · ' + p.title[1]]]; }).concat([['EMP-050', ['Aji Jaens · Owner / CEO', 'Aji Jaens · Owner / CEO']]]);
    return blank ? [['', L('Pilih', 'Choose')]].concat(o) : o;
  }

  /* Dialog: a small modal form. onOk(values) returns true to close, or a message to show. */
  function dlg(o) {
    var old = document.querySelector('.dlg5'); if (old) old.remove();
    var prev = document.activeElement, el = document.createElement('div');
    el.className = 'dlg5';
    el.innerHTML = '<div class="dlg5-bg"></div><div class="dlg5-p" role="dialog" aria-modal="true" aria-labelledby="dlg5-t"><div class="dlg5-h"><h2 id="dlg5-t">' + t(o.title) + '</h2>' +
      '<button type="button" class="ib dlg5-x" aria-label="' + t(L('Tutup', 'Close')) + '">' + ic('x') + '</button></div>' +
      '<div class="dlg5-b">' + (o.sub ? '<p class="dlg5-s">' + o.sub + '</p>' : '') + (o.body || '') + '<p class="dlg5-e" role="alert"></p></div>' +
      '<div class="dlg5-f">' + A.btn('ghost', L('Batal', 'Cancel'), 'x', { cls: 'dlg5-c' }) + (o.onOk ? A.btn('primary', o.ok || L('Simpan', 'Save'), o.icon || 'check', { cls: 'dlg5-ok' }) : '') + '</div></div>';
    document.body.appendChild(el);
    function close() { el.remove(); document.removeEventListener('keydown', key, true); if (prev && prev.focus) prev.focus(); }
    function key(e) {
      if (e.key === 'Escape') { e.stopPropagation(); close(); return; }
      if (e.key === 'Tab') { var f = el.querySelectorAll('button,input,select,textarea'); if (!f.length) return; var a = f[0], z = f[f.length - 1]; if (e.shiftKey && document.activeElement === a) { e.preventDefault(); z.focus(); } else if (!e.shiftKey && document.activeElement === z) { e.preventDefault(); a.focus(); } }
    }
    el.querySelector('.dlg5-bg').onclick = close; el.querySelector('.dlg5-x').onclick = close; el.querySelector('.dlg5-c').onclick = close;
    var ok = el.querySelector('.dlg5-ok');
    if (ok) ok.onclick = function () {
      var v = {}; el.querySelectorAll('[name]').forEach(function (f) { v[f.name] = f.type === 'checkbox' ? f.checked : String(f.value).trim(); });
      var r = o.onOk(v, el);
      if (r === true) close(); else if (r) el.querySelector('.dlg5-e').textContent = T(r);
    };
    document.addEventListener('keydown', key, true);
    if (o.after) o.after(el);
    var first = el.querySelector('input,select,textarea') || ok || el.querySelector('.dlg5-c'); if (first) first.focus();
    return close;
  }
  function fld(label, input, o) { return '<label class="f5' + (o && o.wide ? ' f5-w' : '') + '"><span>' + t(label) + (o && o.req ? ' <i>*</i>' : '') + '</span>' + input + (o && o.hint ? '<small>' + o.hint + '</small>' : '') + '</label>'; }
  function inp(name, v, o) { o = o || {}; return '<input name="' + name + '" value="' + esc(v == null ? '' : v) + '"' + (o.type ? ' type="' + o.type + '"' : '') + (o.num ? ' inputmode="decimal"' : '') + (o.ph ? ' placeholder="' + t(o.ph) + '"' : '') + (o.ro ? ' readonly' : '') + ' autocomplete="off">'; }
  function sel(name, opts, v) { return '<select name="' + name + '">' + opts.map(function (op) { return '<option value="' + esc(op[0]) + '"' + (String(op[0]) === String(v == null ? '' : v) ? ' selected' : '') + '>' + t(op[1]) + '</option>'; }).join('') + '</select>'; }
  function area(name, v, ph) { return '<textarea name="' + name + '" rows="3"' + (ph ? ' placeholder="' + t(ph) + '"' : '') + '>' + esc(v || '') + '</textarea>'; }
  function num(s) { if (s == null || s === '') return null; var n = Number(String(s).replace(/\s/g, '').replace(',', '.')); return isNaN(n) ? NaN : n; }
  function download(name, content, mime) {
    var b = new Blob([content], { type: mime || 'text/plain' }), u = URL.createObjectURL(b), a = document.createElement('a');
    a.href = u; a.download = name; document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(u); a.remove(); }, 800);
  }
  // Drill-down chain (§5): every step opens the next level, never a dead end.
  function drill(steps) {
    return '<ol class="drill5">' + steps.map(function (s) {
      var go = s.go && open(s.go), tag = go ? 'a' : 'span';
      return '<li><' + tag + ' class="dr5"' + (go ? ' href="' + href(s.go, s.rec, s.q) + '"' : '') + '><span class="dr5-ic">' + ic(s.i) + '</span><b>' + t(s.l) + '</b>' + (s.s ? '<small>' + esc(s.s) + '</small>' : '') + '</' + tag + '></li>';
    }).join('') + '</ol>';
  }
  // KPI lines as a responsive list (table on PC / iPad, cards on mobile).
  function kpiList(lines, o) {
    o = o || {};
    var cols = [
      { h: L('KPI', 'KPI'), v: function (l) { return '<b>' + t(l.k.n) + '</b><small class="sub5">' + esc(l.k.code) + (l.k.src === 'manual' ? ' · ' + t(L('Input Manual', 'Manual Input')) : '') + '</small>'; } },
      o.cat ? { h: L('Kategori', 'Category'), v: function (l) { return t(P.CATS[l.k.cat] || '—'); } } : null,
      { h: L('Bobot', 'Weight'), cls: 'r num', v: function (l) { return pct(l.weight != null ? l.weight : l.k.weight, 0); } },
      { h: L('Target', 'Target'), cls: 'r num', v: function (l) { return l.k.dir === 'range' ? fv(l.k.lo, l.k.unit) + '–' + fv(l.k.hi, l.k.unit) : fv(l.target != null ? l.target : l.k.target, l.k.unit); } },
      { h: L('Aktual', 'Actual'), cls: 'r num', v: function (l) { return '<b>' + fv(l.monthly !== undefined ? l.monthly : l.actual, l.k.unit) + '</b>'; } },
      { h: L('Pencapaian', 'Achievement'), cls: 'r num', v: function (l) { return pct(l.ach); } },
      { h: L('Skor', 'Score'), cls: 'r num', v: function (l) { return sc1(l.pts); } },
      { h: L('Weighted', 'Weighted'), cls: 'r num', v: function (l) { return fmt.num(l.ws, 2); } },
      o.trend ? { h: L('Tren', 'Trend'), v: function (l) { return trendc(l.trend); } } : null,
      { h: L('Status', 'Status'), v: function (l) { return stc(l.st); } }
    ].filter(Boolean);
    return A.list(lines, cols, function (l) {
      return { t: t(l.k.n), r: pct(l.ach), s: esc(l.k.code) + ' · ' + t(L('Bobot', 'Weight')) + ' ' + pct(l.weight != null ? l.weight : l.k.weight, 0) + ' · ' + t(L('Aktual', 'Actual')) + ' ' + fv(l.monthly !== undefined ? l.monthly : l.actual, l.k.unit), chip: stc(l.st) };
    }, o.noLink ? null : function (l) { return open('KPI-DTL-001') && P.kpi(l.k.code) ? href('KPI-DTL-001', l.k.code) : null; }, { dense: true, empty: L('Belum ada KPI.', 'No KPIs yet.') });
  }
  function weightMsg(check) { return '<p class="wm5 ' + (check.ok ? 'ok' : 'crit') + '" role="status">' + ic(check.ok ? 'checkc' : 'alert') + '<span>' + t(check.msg) + '</span><b class="num">' + fmt.num(check.total, 2) + '%</b></p>'; }
  function months(n) { return D.HIST_MONTHS.slice(-(n || 6)).map(function (m) { return mon(m); }); }

  A.P5 = {
    cx: cx, open: open, lnk: lnk, by: by, sum: sum, sc1: sc1, pct: pct, fv: fv, rpj: rpj, mon: mon, dt: dt, dtt: dtt, emp: emp, stc: stc, bandc: bandc, sevc: sevc, lifec: lifec, trendc: trendc,
    dot: dot, bar: bar, delta: delta, ring: ring, spark: spark, qhref: qhref, tabs: tabs, after: after, fail: fail, card: card, kv: kv, note: note, tile: tile, tiles: tiles,
    peopleOpts: peopleOpts, dlg: dlg, fld: fld, inp: inp, sel: sel, area: area, num: num, download: download, drill: drill, kpiList: kpiList, weightMsg: weightMsg, months: months
  };

  /* ================= Attention items (§6) — shared by NP-01 and the pillar detail ================= */
  function attItem(a) {
    var sev = P.SEV[a.sev] || P.SEV.info, pil = by(P.PILLARS, 'k', a.pillar);
    var acts = P.ATT_ACTIONS.filter(function (x) {
      if (x[3] && !can(x[3])) return false;
      if (x[0] === 'source') return open(a.src);
      if (x[0] === 'review') return open('KPI-DTL-001') || open(a.src);
      if (x[0] === 'approve') return open('APR-INB-001');
      return true;
    });
    return '<li class="att5 at5-' + sev.tone + '"><div class="att5-m"><span class="att5-ic">' + ic(a.sev === 'crit' || a.sev === 'high' ? 'alert' : 'bell') + '</span>' +
      '<div class="att5-t"><b>' + t(a.t) + '</b><small>' + [pil ? T(pil.short) : '', a.fin ? T(L('Dampak ', 'Impact ')) + rpj(a.fin) : '', T(L('Due ', 'Due ')) + dt(a.due), emp(a.owner)].filter(Boolean).map(esc).join(' · ') + '</small></div>' + sevc(a.sev) + '</div>' +
      (acts.length ? '<div class="att5-a">' + acts.map(function (x) { return '<button type="button" class="btn btn-ghost btn-sm" data-act="att" data-val="' + esc(a.id + '|' + x[0]) + '">' + ic(x[2]) + '<span>' + t(x[1]) + '</span></button>'; }).join('') + '</div>' : '') + '</li>';
  }
  function attAct(el) {
    var p = el.getAttribute('data-val').split('|'), a = by(D.ATTENTION, 'id', p[0]), k = p[1], c = cx();
    if (!a) return;
    if (k === 'review') { if (a.kpi && open('KPI-DTL-001')) A.go('KPI-DTL-001', a.kpi); else A.go(a.src, a.rec, a.tab ? { tab: a.tab } : null); return; }
    if (k === 'source') { A.go(a.src, a.rec, a.tab ? { tab: a.tab } : null); return; }
    if (k === 'approve') { A.go('APR-INB-001'); return; }
    if (k === 'investigate') { var r = P.insightAct(c, a.id, 'investigate', { owner: a.owner }); if (r.ok) after(L('Investigasi dibuat sebagai tugas untuk ' + emp(a.owner) + '.', 'Investigation created as a task for ' + emp(a.owner) + '.')); else fail(r); return; }
    if (k === 'assign') {
      dlg({ title: L('Assign owner', 'Assign owner'), sub: t(a.t), body: fld(L('Owner', 'Owner'), sel('owner', peopleOpts(), a.owner), { req: true }) + fld(L('Catatan', 'Note'), area('note', '', L('Opsional', 'Optional')), { wide: true }), ok: L('Assign', 'Assign'), icon: 'usercheck',
        onOk: function (v) { var r = P.insightAct(c, a.id, 'assign', { owner: v.owner, note: v.note }); if (!r.ok) return r.msg; after(L('Ditugaskan ke ' + emp(v.owner) + '.', 'Assigned to ' + emp(v.owner) + '.')); return true; } });
      return;
    }
    if (k === 'action') {
      dlg({ title: L('Buat aksi', 'Create action'), sub: t(a.t), body: fld(L('Aksi', 'Action'), area('note', '', L('Apa yang harus dilakukan?', 'What needs to happen?')), { req: true, wide: true }) + fld(L('PIC', 'Owner'), sel('owner', peopleOpts(), a.owner)) + fld(L('Due date', 'Due date'), inp('due', a.due, { type: 'date' })), ok: L('Buat Aksi', 'Create Action'), icon: 'plus',
        onOk: function (v) { if (!v.note) return P.MSG.invalid; var r = P.insightAct(c, a.id, 'task', v); if (!r.ok) return r.msg; after(L('Aksi ' + r.task.id + ' dibuat.', 'Action ' + r.task.id + ' created.')); return true; } });
    }
  }
  A.P5.attItem = attItem; A.P5.attAct = attAct;

  /* ================= NP-01 · HOM-EXE-001 Executive Business Health ================= */
  var PERIODS = [['today', L('Hari Ini', 'Today')], ['mtd', 'MTD'], ['ytd', 'YTD']];
  function drillChain() {
    return drill([
      { go: 'HOM-EXE-001', i: 'gauge', l: L('Business Health', 'Business Health') }, { go: 'EXE-PIL-001', rec: 'ops', i: 'layers', l: L('Pilar', 'Pillar'), s: 'Operations' },
      { go: 'KPI-DTL-001', rec: 'OPS-01', i: 'chart', l: 'KPI', s: 'SLA' }, { go: 'TEAM-DTL-001', rec: 'dlv', i: 'users', l: L('Tim', 'Team'), s: 'Delivery' },
      { go: 'PERF-USR-001', rec: 'EMP-063', i: 'user', l: L('User', 'User'), s: 'Gede Wira' }, { go: 'RACE-DLY-001', i: 'zap', l: 'Race', s: 'Daily Race' },
      { go: 'RACE-DLY-001', q: { scope: 'all', ev: '1' }, i: 'filecheck', l: L('Bukti', 'Evidence'), s: 'POD · GPS' }
    ]);
  }
  V['HOM-EXE-001'] = {
    render: function (c) {
      var per = c.q.p || 'mtd', s = P.strip(), h = P.health(), fh = P.fin.health(), x = P.xscore(), rev = s.rev, cash = P.fin.cash(), ar = P.fin.ar(), g = P.fin.growth(), pl = P.fin.pl();
      var revV = per === 'today' ? rev.today : per === 'ytd' ? rev.ytd : rev.mtd;
      var revS = per === 'today' ? T(L('vs kemarin ', 'vs yesterday ')) + delta(rev.dod, { u: '%' }) : per === 'ytd' ? t(L('Target ', 'Target ')) + rpj(rev.ytdTarget) + ' · ' + pct(rev.ytdVs) + ' · YoY ' + delta(rev.yoy, { u: '%' }) : t(L('Target ', 'Target ')) + rpj(rev.mtdTarget) + ' · ' + pct(rev.vsTarget) + ' · MoM ' + delta(rev.mom, { u: '%' });
      var att = P.attention(), slaK = P.kpi('OPS-01');
      var strip = tiles([
        tile({ k: 'Business Health', ring: h.score, s: bandc(h.band), href: href('EXE-PIL-001', 'fin') }),
        tile({ k: 'Financial Health', ring: fh.score, s: delta(fh.score - fh.hist[fh.hist.length - 1]) + ' ' + t(L('vs Agu', 'vs Aug')), href: open('FIN-HLT-001') ? href('FIN-HLT-001') : null }),
        tile({ k: 'XScore', ring: x.score, s: delta(x.delta) + ' ' + t(L('vs Agu', 'vs Aug')), href: open('XSC-001') ? href('XSC-001') : null }),
        tile({ k: L('Revenue ' + (per === 'today' ? 'Hari Ini' : per.toUpperCase()), 'Revenue ' + (per === 'today' ? 'Today' : per.toUpperCase())), v: rpj(revV), s: revS, spark: spark(P.kpi('FIN-01').hist, { bars: true }), href: open('FIN-HLT-001') ? href('FIN-HLT-001', null, { tab: 'rev' }) : null }),
        tile({ k: L('Net Profit (Sep)', 'Net Profit (Sep)'), v: rpj(s.net), s: 'NM ' + pct(s.nm) + ' · MoM ' + delta(g.mom.net, { u: '%' }), spark: spark([1, 2, 3, 4, 5, 6].map(function (i) { return P.fin.pl(i).net; })), href: open('FIN-HLT-001') ? href('FIN-HLT-001', null, { tab: 'pl' }) : null }),
        tile({ k: L('Kas Tersedia', 'Cash Available'), v: rpj(cash.available), s: t(L('Free cash ', 'Free cash ')) + rpj(cash.free), href: open('FIN-HLT-001') ? href('FIN-HLT-001', null, { tab: 'cash' }) : null, tone: cash.free < P.cfg().cashBuffer ? 'warn' : '' }),
        tile({ k: 'SLA', v: pct(s.sla), s: t(L('Target ', 'Target ')) + pct(slaK.target, 0) + ' ' + delta(s.sla - slaK.hist[4]), spark: spark(slaK.hist), href: href('KPI-DTL-001', 'OPS-01'), tone: s.sla < slaK.target ? 'warn' : '' }),
        tile({ k: L('Outstanding AR', 'Outstanding AR'), v: rpj(ar.total), s: t(L('Jatuh tempo ', 'Overdue ')) + rpj(ar.overdue) + ' · DSO ' + fmt.num(ar.dso, 1), href: open('FIN-HLT-001') ? href('FIN-HLT-001', null, { tab: 'ar' }) : null, tone: ar.overdueRatio > 30 ? 'crit' : '' })
      ], 'tls5-8');
      var pillars = '<div class="pls5">' + h.pillars.map(function (p) {
        var inds = p.inds.slice(0, 3);
        return '<article class="pl5"><a class="pl5-h" href="' + href('EXE-PIL-001', p.k) + '"><span class="pl5-ic">' + ic(p.icon) + '</span><b>' + t(p.n) + '</b>' + ic('chevr', 'pl5-go') + '</a>' +
          '<div class="pl5-m">' + ring(p.score, { size: 64, label: p.n }) + '<span class="pl5-b">' + bandc(p.band) + '<span>' + delta(p.delta) + ' <small>' + t(L('vs Agu', 'vs Aug')) + '</small></span><small>' + t(L('Bobot ', 'Weight ')) + p.w + '%</small></span>' + spark(p.trend, { w: 70, h: 26 }) + '</div>' +
          '<ul class="pl5-i">' + inds.map(function (i) { return '<li>' + dot(i.st) + '<span>' + t(i.n) + '</span><b class="num">' + fv(i.actual, i.unit) + '</b></li>'; }).join('') + '</ul>' +
          (p.top ? '<p class="pl5-t t-' + (P.SEV[p.top.sev] || P.SEV.info).tone + '">' + ic('alert') + '<span>' + t(p.top.t) + '</span></p>' : '') + '</article>';
      }).join('') + '</div>';
      var quick = [['DI-INS-001', 'usercheck', L('Assign', 'Assign'), L('Tugaskan ke tim', 'Assign to a team')], ['DI-BRF-001', 'eye', L('Review', 'Review'), L('Tinjau brief & laporan', 'Review brief & reports')], ['DI-INS-001', 'search', L('Investigate', 'Investigate'), L('Telusuri akar masalah', 'Find the root cause'), { type: 'diagnostic' }], ['APR-INB-001', 'filecheck', L('Approve', 'Approve'), L('Setujui & lanjutkan', 'Approve & continue')]]
        .filter(function (q) { return open(q[0]); }).map(function (q) { return '<a class="qa5" href="' + href(q[0], null, q[4]) + '"><span class="qa5-ic">' + ic(q[1]) + '</span><b>' + t(q[2]) + '</b><small>' + t(q[3]) + '</small></a>'; }).join('');
      return A.pageHead(null, esc(T(A.greet())) + ', ' + esc(A.R().person) + ' · ' + t(L('Pantau. Pahami. Ambil aksi.', 'Observe. Understand. Act.')) + ' · ' + dt(P.TODAY), tabs(PERIODS, per, 'p', { seg: true, def: 'mtd', label: L('Periode', 'Period') })) +
        strip +
        card(L('Enam Pilar Kesehatan Bisnis', 'Six Business Health Pillars'), pillars, { icon: 'layers', link: ['EXE-PIL-001', L('Lihat detail', 'View detail'), 'fin'] }) +
        '<div class="grid2 g5-att">' +
          card(L('Perlu Perhatian Hari Ini', 'Needs Attention Today'), '<ol class="atts5">' + att.slice(0, 6).map(attItem).join('') + '</ol>' + (att.length > 6 ? '<p class="more5">' + t(L(att.length - 6 + ' item lain di Executive Brief', att.length - 6 + ' more items in the Executive Brief')) + '</p>' : ''), { icon: 'alert', count: att.length, link: open('DI-BRF-001') ? ['DI-BRF-001', L('Lihat semua', 'See all')] : null }) +
          '<div class="stack5">' + (quick ? card(L('Tindakan Cepat', 'Quick Actions'), '<div class="qas5">' + quick + '</div>', { icon: 'zap' }) : '') +
          card(L('Alur Drill-down', 'Drill-down Path'), drillChain() + note(t(L('Business Health → Pilar → KPI → Tim → User → Race → Bukti. Tidak ada KPI yang buntu.', 'Business Health → Pillar → KPI → Team → User → Race → Evidence. No KPI is a dead end.')), 'route'), { icon: 'route' }) + '</div>' +
        '</div>';
    },
    act: { att: attAct }
  };

  /* ================= NP-01 · EXE-PIL-001 Pillar detail ================= */
  function pillarKey(rec) { return by(P.PILLARS, 'k', rec) ? rec : 'fin'; }
  V['EXE-PIL-001'] = {
    title: function (rec) { return by(P.PILLARS, 'k', pillarKey(rec)).n; },
    render: function (c) {
      var pk = pillarKey(c.rec), p = P.pillar(pk), dim = by(D.XDIMS, 'k', p.dim), lines = P.lines(dim.sc), items = P.attention().filter(function (a) { return a.pillar === pk; });
      var k0 = lines.slice().sort(function (a, b) { return (a.pts - b.pts) || (b.k.weight - a.k.weight); })[0], tm = k0 && k0.k.teams && k0.k.teams[0] ? P.team(k0.k.teams[0]) : null;
      var lead = tm ? tm.lead : (k0 ? k0.k.owner : null), race = P.state().daily.filter(function (r) { return tm && r.team === tm.k; })[0];
      var indCols = [
        { h: L('Indikator', 'Indicator'), v: function (i) { return '<b>' + t(i.n) + '</b>'; } },
        { h: L('Target', 'Target'), cls: 'r num', v: function (i) { return i.dir === 'binary' ? (i.zero ? '0' : t(L('Ya', 'Yes'))) : i.dir === 'range' ? fv(i.lo, i.unit) + '–' + fv(i.hi, i.unit) : fv(i.target, i.unit); } },
        { h: L('Aktual', 'Actual'), cls: 'r num', v: function (i) { return '<b>' + fv(i.actual, i.unit) + '</b>'; } },
        { h: L('Pencapaian', 'Achievement'), cls: 'r num', v: function (i) { return pct(i.ach); } },
        { h: L('Status', 'Status'), v: function (i) { return stc(i.st); } },
        { h: 'KPI', v: function (i) { return lnk('KPI-DTL-001', i.kpi, esc(i.kpi)); } }
      ];
      return A.pageHead(null, t(L('Bobot ' + p.w + '% dari Business Health · dimensi XScore ', 'Weight ' + p.w + '% of Business Health · XScore dimension ')) + t(dim.n), A.btn('ghost', L('Business Health', 'Business Health'), 'arrowl', { go: 'HOM-EXE-001' })) +
        tabs(P.PILLARS.map(function (x) { return [x.k, x.short, x.icon]; }), pk, null, { hf: function (k) { return href('EXE-PIL-001', k); }, label: L('Pilar', 'Pillar') }) +
        '<div class="grid2">' +
          card(L('Skor pilar', 'Pillar score'), '<div class="hero5">' + ring(p.score, { size: 116, label: p.n }) + '<div>' + bandc(p.band) + '<p class="hero5-d">' + delta(p.delta) + ' ' + t(L('dibanding Agustus', 'versus August')) + '</p>' + kv([[L('Indikator', 'Indicators'), p.inds.length], [L('On track', 'On track'), p.inds.filter(function (i) { return i.st === 'on'; }).length + ' / ' + p.inds.length], [L('Issue terbuka', 'Open issues'), items.length]]) + '</div></div>' +
            A.lineChart([{ n: L('Skor dimensi', 'Dimension score'), v: p.trend }], months(), { h: 180, min: Math.max(0, Math.floor(Math.min.apply(null, p.trend) - 6)), max: 100, label: T(p.n) }), { icon: p.icon }) +
          card(L('Issue utama', 'Top issues'), items.length ? '<ol class="atts5">' + items.map(attItem).join('') + '</ol>' : A.empty(L('Tidak ada issue terbuka di pilar ini.', 'No open issues in this pillar.')), { icon: 'alert', count: items.length }) +
        '</div>' +
        card(L('Indikator pilar', 'Pillar indicators'), A.list(p.inds, indCols, function (i) { return { t: t(i.n), r: fv(i.actual, i.unit), s: t(L('Target ', 'Target ')) + fv(i.target, i.unit) + ' · ' + pct(i.ach), chip: stc(i.st) }; }, function (i) { return open('KPI-DTL-001') ? href('KPI-DTL-001', i.kpi) : null; }, { dense: true }), { icon: 'list' }) +
        card(T(L('KPI scorecard ', 'Scorecard KPIs ')) + T(dim.n), kpiList(lines), { icon: 'chart', link: open('KPI-MST-001') ? ['KPI-MST-001', L('KPI Master', 'KPI Master')] : null }) +
        (k0 ? card(L('Drill-down dari KPI terlemah', 'Drill-down from the weakest KPI'), drill([
          { go: 'EXE-PIL-001', rec: pk, i: p.icon, l: p.short, s: sc1(p.score) }, { go: 'KPI-DTL-001', rec: k0.k.code, i: 'chart', l: 'KPI', s: T(k0.k.n) },
          tm ? { go: 'TEAM-DTL-001', rec: tm.k, i: 'users', l: L('Tim', 'Team'), s: T(tm.n) } : null, lead ? { go: 'PERF-USR-001', rec: lead, i: 'user', l: L('User', 'User'), s: emp(lead) } : null,
          { go: 'RACE-DLY-001', q: tm ? { team: tm.k } : null, i: 'zap', l: 'Race', s: race ? T(race.n) : 'Daily Race' }, { go: race ? 'RACE-DLY-001' : 'KPI-DTL-001', rec: race ? null : k0.k.code, q: race ? { ev: '1' } : null, i: 'filecheck', l: L('Bukti', 'Evidence'), s: T(P.SRC[k0.k.src] || '') }
        ].filter(Boolean)), { icon: 'route' }) : '');
    },
    act: { att: attAct }
  };

  /* ================= NP-02 · FIN-HLT-001 Financial Health & Cash Position ================= */
  var FIN_TABS = [['sum', L('Ringkasan', 'Overview'), 'gauge'], ['cash', L('Kas', 'Cash'), 'coins'], ['rev', 'Revenue', 'trend'], ['pl', 'P&L', 'file'], ['exp', L('Biaya & Unit', 'Costs & Units'), 'scale'], ['ar', 'AR', 'clock'], ['ap', 'AP', 'calendar'], ['score', L('Skor', 'Score'), 'target']];
  var SEG_DIMS = [['plant', 'Plant'], ['client', L('Klien', 'Client')], ['property', L('Properti', 'Property')], ['service', L('Layanan', 'Service')]];
  function flowBars(map, labels) { var rows = Object.keys(map).filter(function (k) { return map[k] > 0; }).map(function (k) { return { l: labels[k], v: map[k] }; }).sort(function (a, b) { return b.v - a.v; }); return rows.length ? A.hbars(rows, { fmt: rpj }) : A.empty(L('Tidak ada transaksi.', 'No transactions.')); }
  function finSum() {
    var fh = P.fin.health(), cash = P.fin.cash(), rev = P.fin.revenue(), pl = P.fin.pl(), ar = P.fin.ar(), ap = P.fin.ap(), fc = P.fin.forecast();
    return '<div class="grid2 g5-hero">' + card('Financial Health Score', '<div class="hero5">' + ring(fh.score, { size: 116, label: 'Financial Health' }) + '<div>' + bandc(fh.band) + '<p class="hero5-d">' + delta(fh.score - fh.hist[fh.hist.length - 1]) + ' ' + t(L('vs Agustus', 'vs August')) + '</p>' + spark(fh.hist.concat([fh.score]), { w: 140, h: 34 }) + '</div></div>', { icon: 'gauge', link: ['FIN-HLT-001', L('Lihat scorecard', 'View scorecard')] }) +
      card(L('Peringatan forecast kas', 'Cash forecast alerts'), fc.alerts.length ? '<ul class="al5">' + fc.alerts.map(function (a) { return '<li class="t-' + P.SEV[a.sev].tone + '">' + ic('alert') + '<span>' + t(a.t) + '</span></li>'; }).join('') + '</ul>' : A.empty(L('Tidak ada risiko kas 30 hari.', 'No 30-day cash risk.')), { icon: 'alert', count: fc.alerts.length }) + '</div>' +
      tiles([
        tile({ k: L('Kas tersedia', 'Available cash'), v: rpj(cash.available), s: t(L('Total ', 'Total ')) + rpj(cash.total), href: qhref({ tab: 'cash' }) }),
        tile({ k: 'Free cash', v: rpj(cash.free), s: t(L('Setelah AP 30 hari', 'After 30-day AP')), href: qhref({ tab: 'ap' }), tone: cash.free < P.cfg().cashBuffer ? 'warn' : '' }),
        tile({ k: 'Revenue MTD', v: rpj(rev.mtd), s: pct(rev.vsTarget) + t(L(' dari target', ' of target')), href: qhref({ tab: 'rev' }) }),
        tile({ k: L('Net margin (Sep)', 'Net margin (Sep)'), v: pct(pl.nm), s: t(L('Net profit ', 'Net profit ')) + rpj(pl.net), href: qhref({ tab: 'pl' }), tone: pl.nm < 20 ? 'warn' : '' }),
        tile({ k: 'Outstanding AR', v: rpj(ar.total), s: 'DSO ' + fmt.num(ar.dso, 1) + t(L(' hari', ' days')), href: qhref({ tab: 'ar' }), tone: ar.overdueRatio > 30 ? 'crit' : '' }),
        tile({ k: L('AP 7 hari', 'AP 7 days'), v: rpj(ap.due7), s: t(L('Hari ini ', 'Today ')) + rpj(ap.dueToday), href: qhref({ tab: 'ap' }) })
      ], 'tls5-6') +
      card(L('Perlu perhatian keuangan', 'Financial items needing attention'), '<ol class="atts5">' + P.attention().filter(function (a) { return a.pillar === 'fin'; }).map(attItem).join('') + '</ol>', { icon: 'bell' });
  }
  function finCash(q) {
    var cash = P.fin.cash(), fp = q.fp || 'mtd', f = P.fin.flow(fp), fc = P.fin.forecast();
    var pos = [[L('Total kas', 'Total cash'), cash.total], [L('Kas di tangan', 'Cash on hand'), cash.onHand], ['Petty cash', cash.petty], [L('Saldo bank', 'Bank balance'), cash.bank], [L('Kas operasional', 'Operating cash'), cash.operational], [L('Kas dibatasi', 'Restricted cash'), cash.restricted], [L('Kas tersedia', 'Available cash'), cash.available], [L('Kewajiban 30 hari', 'Committed (30 days)'), cash.committed], ['Free cash', cash.free]];
    var acc = can('fin.cash.accounts') ? A.list(cash.accounts, [
      { h: L('Rekening', 'Account'), v: function (a) { return '<b>' + esc(a.n) + '</b><small class="sub5">' + esc(a.id) + '</small>'; } },
      { h: L('Jenis', 'Type'), v: function (a) { return esc(a.type); } },
      { h: L('Saldo', 'Balance'), cls: 'r num', v: function (a) { return '<b>' + fmt.rp(a.bal) + '</b>'; } },
      { h: L('Mata uang', 'Currency'), v: function (a) { return esc(a.cur); } },
      { h: L('Update terakhir', 'Last update'), v: function (a) { return dt(a.upd); } },
      { h: L('Mutasi hari ini', 'Movement today'), cls: 'r num', v: function (a) { return a.mov ? (a.mov > 0 ? '+' : '−') + rpj(Math.abs(a.mov)) : '—'; } },
      { h: L('Status', 'Status'), v: function (a) { return a.restricted ? A.chip('appr', L('Dibatasi', 'Restricted'), 'lock') + '<small class="sub5">' + t(a.why) + '</small>' : A.chip('ok', L('Tersedia', 'Available')); } }
    ], function (a) { return { t: esc(a.n), r: rpj(a.bal), s: esc(a.cur) + ' · ' + dt(a.upd), chip: a.restricted ? A.chip('appr', L('Dibatasi', 'Restricted'), 'lock') : '' }; }, null, { dense: true }) : note(t(L('Saldo per rekening hanya untuk pengguna dengan izin "Lihat saldo per rekening".', 'Balances per account are only shown to users with the "View balances per account" permission.')), 'lock');
    return '<div class="grid2">' + card(L('Posisi kas', 'Cash position'), '<div class="tblw"><table class="tbl dense pos5"><tbody>' + pos.map(function (r, i) { return '<tr' + (i === 6 || i === 8 ? ' class="em5"' : '') + '><td>' + t(r[0]) + '</td><td class="r num">' + fmt.rp(r[1]) + '</td></tr>'; }).join('') + '</tbody></table></div>' + note(t(L('Kas tersedia = total − kas dibatasi. Free cash = kas tersedia − kewajiban 30 hari.', 'Available = total − restricted. Free cash = available − 30-day obligations.')), 'info'), { icon: 'coins' }) +
      card(L('Forecast kas', 'Cash forecast'), '<div class="fc5">' + [['7', fc.in7, fc.out7, fc.proj7], ['30', fc.in30, fc.out30, fc.proj30]].map(function (r) {
        return '<div class="fc5-c"><b>' + t(L(r[0] + ' hari', r[0] + ' days')) + '</b>' + kv([[L('Kas masuk', 'Cash in'), '+' + rpj(r[1])], [L('Kas keluar', 'Cash out'), '−' + rpj(r[2])], [L('Proyeksi kas', 'Projected cash'), '<b>' + rpj(r[3]) + '</b>']]) + '</div>';
      }).join('') + '</div>' + (fc.alerts.length ? '<ul class="al5">' + fc.alerts.map(function (a) { return '<li class="t-' + P.SEV[a.sev].tone + '">' + ic('alert') + '<span>' + t(a.t) + '</span></li>'; }).join('') + '</ul>' : '') + note(t(L('Buffer kas minimum ', 'Minimum cash buffer ')) + rpj(fc.buffer), 'shield'), { icon: 'trend' }) + '</div>' +
      card(L('Arus kas', 'Cash flow'), tabs(P.FLOW_PERIODS, fp, 'fp', { seg: true, def: 'mtd', label: L('Periode', 'Period') }) +
        tiles([tile({ k: L('Kas masuk', 'Cash in'), v: rpj(f.tin), tone: '' }), tile({ k: L('Kas keluar', 'Cash out'), v: rpj(f.tout) }), tile({ k: L('Arus kas bersih', 'Net cash flow'), v: (f.net < 0 ? '−' : '+') + rpj(Math.abs(f.net)), s: t(L('Kas masuk − kas keluar', 'Cash in − cash out')), tone: f.net < 0 ? 'crit' : 'ok' })], 'tls5-3') +
        '<div class="grid2"><div><h3 class="h5">' + t(L('Kas masuk', 'Cash in')) + '</h3>' + flowBars(f.inn, P.FLOW_IN) + '</div><div><h3 class="h5">' + t(L('Kas keluar', 'Cash out')) + '</h3>' + flowBars(f.out, P.FLOW_OUT) + '</div></div>', { icon: 'refresh' }) +
      card(L('Saldo per rekening', 'Balance per account'), acc, { icon: 'building' });
  }
  function finRev(q) {
    var rev = P.fin.revenue(), dim = q.seg || 'client', segs = P.fin.segments(dim), tot = sum(segs.map(function (s) { return s.rev; })), m = D.FIN.plMonths;
    return tiles([
      tile({ k: L('Hari ini', 'Today'), v: rpj(rev.today), s: t(L('vs kemarin ', 'vs yesterday ')) + delta(rev.dod, { u: '%' }) }),
      tile({ k: 'MTD', v: rpj(rev.mtd), s: t(L('Target ', 'Target ')) + rpj(rev.mtdTarget) + ' · ' + pct(rev.vsTarget), tone: rev.vsTarget < 95 ? 'warn' : '' }),
      tile({ k: 'YTD', v: rpj(rev.ytd), s: t(L('Target ', 'Target ')) + rpj(rev.ytdTarget) + ' · ' + pct(rev.ytdVs) }),
      tile({ k: L('September', 'September'), v: rpj(rev.sep), s: 'MoM ' + delta(rev.mom, { u: '%' }) + ' · YoY ' + delta(rev.yoy, { u: '%' }) })
    ], 'tls5-4') +
      card(L('Tren revenue bulanan', 'Monthly revenue trend'), A.barChart(m.slice(1).map(function (mm, i) { return { l: mon(mm), v: D.FIN.pl.revenue[i + 1], hi: i === m.length - 2 }; }), { h: 200, fmt: function (v) { return 'Rp ' + fmt.num(v, 0) + (A.S.lang === 'en' ? ' M' : ' jt'); }, fmtAx: function (v) { return fmt.num(v, 0); }, label: 'Revenue (Rp jt)' }) + note(t(L('September tahun lalu: ', 'September last year: ')) + rpj(rev.sepLy) + ' · YoY ' + delta(rev.yoy, { u: '%' }), 'calendar'), { icon: 'trend' }) +
      card(L('Drill-down revenue', 'Revenue drill-down'), tabs(SEG_DIMS, dim, 'seg', { seg: true, def: 'client', label: L('Dimensi', 'Dimension') }) +
        A.hbars(segs.map(function (s) { return { l: [s.n, s.n], v: s.rev }; }), { fmt: rpj }) +
        A.list(segs, [
          { h: L('Nama', 'Name'), v: function (s) { return '<b>' + esc(s.n) + '</b>'; } },
          { h: 'Revenue', cls: 'r num', v: function (s) { return rpj(s.rev); } }, { h: L('Porsi', 'Share'), cls: 'r num', v: function (s) { return pct(s.rev / tot * 100); } },
          { h: 'kg', cls: 'r num', v: function (s) { return fmt.num(s.kg, 0); } }, { h: 'pcs', cls: 'r num', v: function (s) { return fmt.num(s.pcs, 0); } },
          { h: 'Rp/kg', cls: 'r num', v: function (s) { return fmt.num(Math.round(s.rev / s.kg), 0); } }
        ], function (s) { return { t: esc(s.n), r: rpj(s.rev), s: fmt.num(s.kg, 0) + ' kg · ' + fmt.num(s.pcs, 0) + ' pcs · ' + pct(s.rev / tot * 100) }; }, null, { dense: true }), { icon: 'layers' });
  }
  function finPL(q) {
    var m = D.FIN.plMonths, i = q.m != null && m[+q.m] ? +q.m : m.length - 1, pl = P.fin.pl(i), g = P.fin.growth();
    var rows = [['Revenue', pl.revenue, 1], ['COGS', -pl.cogs], ['Gross Profit', pl.gross, 1], ['Operating Expense', -pl.opex], ['Operating Profit', pl.op, 1], [L('Pendapatan / biaya lain', 'Other income / expense'), pl.other], [L('Laba sebelum pajak', 'Profit before tax'), pl.pretax, 1], [L('Pajak', 'Tax'), -pl.tax], ['Net Profit', pl.net, 2]];
    var gr = [['Gross profit', 'gross', '%'], ['Operating profit', 'op', '%'], ['Net profit', 'net', '%'], ['Net margin', 'margin', ' pt'], [L('Total biaya', 'Total cost'), 'cost', '%']];
    return '<div class="mrow5"><span>' + t(L('Bulan', 'Month')) + '</span>' + tabs(m.map(function (mm, j) { return [String(j), mon(mm, j === 0)]; }), String(i), 'm', { seg: true, def: String(m.length - 1), label: L('Bulan', 'Month') }) + '</div>' +
      tiles([tile({ k: 'Gross margin', v: pct(pl.gm), tone: pl.gm < 58 ? 'warn' : '' }), tile({ k: 'Operating margin', v: pct(pl.om) }), tile({ k: 'Net margin', v: pct(pl.nm), tone: pl.nm < 20 ? 'warn' : '' }), tile({ k: 'Net profit', v: rpj(pl.net) })], 'tls5-4') +
      '<div class="grid2">' + card(T(L('Laba rugi ', 'Profit & loss ')) + mon(pl.m, true), '<div class="tblw"><table class="tbl dense plt5"><thead><tr><th>' + t(L('Baris', 'Line')) + '</th><th class="r">Rp</th><th class="r">% Rev</th></tr></thead><tbody>' + rows.map(function (r) {
        return '<tr class="' + (r[2] === 2 ? 'em5 big' : r[2] ? 'em5' : '') + '"><td>' + t(r[0]) + '</td><td class="r num">' + (r[1] < 0 ? '−' : '') + fmt.rp(Math.abs(r[1])) + '</td><td class="r num">' + pct(Math.abs(r[1]) / pl.revenue * 100) + '</td></tr>';
      }).join('') + '</tbody></table></div>', { icon: 'file' }) +
      card(L('Pertumbuhan laba', 'Profit growth'), '<div class="tblw"><table class="tbl dense"><thead><tr><th></th><th class="r">MoM</th><th class="r">QoQ</th><th class="r">YoY</th></tr></thead><tbody>' + gr.map(function (r) {
        var lower = r[1] === 'cost';
        return '<tr><td>' + t(r[0]) + '</td>' + ['mom', 'qoq', 'yoy'].map(function (k) { return '<td class="r">' + delta(g[k][r[1]], { u: r[2], dir: lower ? 'lower' : 'higher' }) + '</td>'; }).join('') + '</tr>';
      }).join('') + '</tbody></table></div>' + note(t(L('MoM: Sep vs Agu · QoQ: Q3 vs Q2 · YoY: Sep 2026 vs Sep 2025', 'MoM: Sep vs Aug · QoQ: Q3 vs Q2 · YoY: Sep 2026 vs Sep 2025')), 'calendar') +
        A.lineChart([{ n: 'Net profit (Rp jt)', v: D.FIN.pl.revenue.slice(1).map(function (x, j) { return Math.round(P.fin.pl(j + 1).net / 1e6); }) }], m.slice(1).map(function (mm) { return mon(mm); }), { h: 170, label: 'Net profit' }), { icon: 'trend' }) + '</div>' +
      '<div class="grid2">' + card('COGS (Sep)', A.hbars(D.FIN.cogsLines.map(function (x) { return { l: x[0], v: x[1] * 1e6 }; }), { fmt: rpj }), { icon: 'washer' }) + card('Operating Expense (Sep)', A.hbars(D.FIN.opexLines.map(function (x) { return { l: x[0], v: x[1] * 1e6 }; }), { fmt: rpj }), { icon: 'building' }) + '</div>';
  }
  function finExp(q) {
    var e = P.fin.expenses(), dim = q.ue || 'plant', ue = P.fin.ue(dim), tt = ue.total;
    return card(L('Budget vs aktual (Sep)', 'Budget vs actual (Sep)'), A.list(e.rows, [
      { h: L('Kategori', 'Category'), v: function (r) { return '<b>' + t(r.n) + '</b>'; } },
      { h: 'Budget', cls: 'r num', v: function (r) { return rpj(r.budget); } }, { h: L('Aktual', 'Actual'), cls: 'r num', v: function (r) { return '<b>' + rpj(r.actual) + '</b>'; } },
      { h: L('Varian', 'Variance'), cls: 'r num', v: function (r) { return (r.var > 0 ? '+' : r.var < 0 ? '−' : '') + rpj(Math.abs(r.var)); } },
      { h: L('Varian %', 'Variance %'), cls: 'r', v: function (r) { return delta(r.pct, { u: '%', dir: 'lower' }); } },
      { h: L('Tren', 'Trend'), v: function (r) { return spark(r.trend, { w: 70, h: 22 }); } },
      { h: L('Status', 'Status'), v: function (r) { return r.alert ? A.chip('crit', L('Di atas batas ' + e.threshold + '%', 'Over the ' + e.threshold + '% limit'), 'alert') : A.chip('ok', L('Dalam budget', 'Within budget')); } }
    ], function (r) { return { t: t(r.n), r: rpj(r.actual), s: 'Budget ' + rpj(r.budget) + ' · ' + (r.pct > 0 ? '+' : '') + fmt.num(r.pct, 1) + '%', chip: r.alert ? A.chip('crit', L('Over budget', 'Over budget'), 'alert') : '' }; }, null, { dense: true }) +
      kv([[L('Total budget', 'Total budget'), rpj(e.budget)], [L('Total aktual', 'Total actual'), rpj(e.actual)], [L('Varian total', 'Total variance'), delta(e.varPct, { u: '%', dir: 'lower' })], [L('Batas alert', 'Alert threshold'), e.threshold + '%']]), { icon: 'scale' }) +
      card('Unit economics', tiles([
        tile({ k: L('Revenue / kg', 'Revenue / kg'), v: 'Rp ' + fmt.num(tt.revKg, 0) }), tile({ k: L('Biaya / kg', 'Cost / kg'), v: 'Rp ' + fmt.num(tt.costKg, 0) }), tile({ k: L('Profit / kg', 'Profit / kg'), v: 'Rp ' + fmt.num(tt.profitKg, 0) }),
        tile({ k: L('Revenue / pcs', 'Revenue / pcs'), v: 'Rp ' + fmt.num(tt.revPcs, 0) }), tile({ k: L('Biaya / pcs', 'Cost / pcs'), v: 'Rp ' + fmt.num(tt.costPcs, 0) }), tile({ k: L('Margin kontribusi', 'Contribution margin'), v: pct(tt.margin) })
      ], 'tls5-6') + tabs(SEG_DIMS, dim, 'ue', { seg: true, def: 'plant', label: L('Dimensi', 'Dimension') }) +
        A.list(ue.rows, [
          { h: L('Nama', 'Name'), v: function (r) { return '<b>' + esc(r.n) + '</b>'; } }, { h: 'Rev/kg', cls: 'r num', v: function (r) { return fmt.num(r.revKg, 0); } }, { h: L('Biaya/kg', 'Cost/kg'), cls: 'r num', v: function (r) { return fmt.num(r.costKg, 0); } },
          { h: 'Profit/kg', cls: 'r num', v: function (r) { return '<b>' + fmt.num(r.profitKg, 0) + '</b>'; } }, { h: 'Rev/pcs', cls: 'r num', v: function (r) { return fmt.num(r.revPcs, 0); } }, { h: 'Profit/pcs', cls: 'r num', v: function (r) { return fmt.num(r.profitPcs, 0); } },
          { h: 'Margin', cls: 'r num', v: function (r) { return pct(r.margin); } }
        ], function (r) { return { t: esc(r.n), r: pct(r.margin), s: 'Profit/kg Rp ' + fmt.num(r.profitKg, 0) + ' · Profit/pcs Rp ' + fmt.num(r.profitPcs, 0) }; }, null, { dense: true }), { icon: 'percent' });
  }
  function finAR() {
    var ar = P.fin.ar();
    return tiles([
      tile({ k: L('Total AR', 'Total AR'), v: rpj(ar.total) }), tile({ k: L('AR jatuh tempo', 'Overdue AR'), v: rpj(ar.overdue), s: pct(ar.overdueRatio) + t(L(' dari AR', ' of AR')), tone: ar.overdueRatio > 30 ? 'crit' : 'warn' }),
      tile({ k: 'DSO', v: fmt.num(ar.dso, 1) + t(L(' hari', ' days')) }), tile({ k: 'Collection rate', v: pct(ar.collection), tone: ar.collection < 95 ? 'warn' : '' }), tile({ k: L('AR > 60 hari', 'AR > 60 days'), v: pct(ar.over60Share), tone: ar.over60Share > 5 ? 'crit' : '' })
    ], 'tls5-5') +
      '<div class="grid2">' + card('AR aging', A.hbars(P.BUCKETS.map(function (b) { return { l: b[1], v: ar.buckets[b[0]], hi: b[0] !== 'current' && ar.buckets[b[0]] > 0 }; }), { fmt: rpj }), { icon: 'clock' }) +
      card(L('Klien jatuh tempo terbesar', 'Top overdue clients'), A.list(ar.top, [
        { h: L('Klien', 'Client'), v: function (r) { return '<b>' + esc(P.clientName(r.cl)) + '</b>'; } }, { h: L('Jatuh tempo', 'Overdue'), cls: 'r num', v: function (r) { return rpj(r.amt); } }, { h: L('Umur tertua', 'Oldest'), cls: 'r num', v: function (r) { return r.oldest + t(L(' hari', ' d')); } }
      ], function (r) { return { t: esc(P.clientName(r.cl)), r: rpj(r.amt), s: r.oldest + t(L(' hari', ' days')) }; }, null, { dense: true }), { icon: 'alert' }) + '</div>' +
      card(L('Jatuh tempo 14 hari ke depan', 'Due in the next 14 days'), A.list(ar.upcoming, [
        { h: 'Invoice', v: function (i) { return '<b>' + esc(i.inv) + '</b>'; } }, { h: L('Klien', 'Client'), v: function (i) { return esc(P.clientName(i.cl)); } }, { h: L('Jatuh tempo', 'Due'), v: function (i) { return dt(i.due); } }, { h: L('Nilai', 'Amount'), cls: 'r num', v: function (i) { return rpj(i.amt); } }
      ], function (i) { return { t: esc(i.inv) + ' · ' + esc(P.clientName(i.cl)), r: rpj(i.amt), s: dt(i.due) }; }, null, { dense: true }), { icon: 'calendar' }) +
      card(L('Semua invoice terbuka', 'All open invoices'), A.list(ar.items.slice().sort(function (a, b) { return b.age - a.age; }), [
        { h: 'Invoice', v: function (i) { return '<b>' + esc(i.inv) + '</b>'; } }, { h: L('Klien', 'Client'), v: function (i) { return esc(P.clientName(i.cl)); } }, { h: L('Terbit', 'Issued'), v: function (i) { return dt(i.issued); } },
        { h: L('Jatuh tempo', 'Due'), v: function (i) { return dt(i.due); } }, { h: L('Umur', 'Age'), cls: 'r num', v: function (i) { return i.age > 0 ? i.age + t(L(' hari', ' d')) : '—'; } },
        { h: 'Bucket', v: function (i) { return A.chip(i.bucket === 'current' ? 'info' : i.bucket === 'b30' ? 'warn' : 'crit', by(P.BUCKETS.map(function (b) { return { k: b[0], l: b[1] }; }), 'k', i.bucket).l); } }, { h: L('Nilai', 'Amount'), cls: 'r num', v: function (i) { return '<b>' + rpj(i.amt) + '</b>'; } }
      ], function (i) { return { t: esc(i.inv) + ' · ' + esc(P.clientName(i.cl)), r: rpj(i.amt), s: t(L('Jatuh tempo ', 'Due ')) + dt(i.due) + (i.age > 0 ? ' · ' + i.age + t(L(' hari', ' days')) : '') }; }, null, { dense: true }), { icon: 'file', count: ar.items.length });
  }
  function finAP() {
    var ap = P.fin.ap(), cash = P.fin.cash();
    return tiles([tile({ k: L('Jatuh tempo hari ini', 'Due today'), v: rpj(ap.dueToday), tone: ap.dueToday ? 'warn' : '' }), tile({ k: L('7 hari', '7 days'), v: rpj(ap.due7) }), tile({ k: L('30 hari', '30 days'), v: rpj(ap.due30) }), tile({ k: 'Free cash', v: rpj(cash.free), s: t(L('Kas tersedia ', 'Available ')) + rpj(cash.available) + ' − AP 30', tone: cash.free < P.cfg().cashBuffer ? 'warn' : 'ok' })], 'tls5-4') +
      '<div class="grid2">' + card(L('Kewajiban 30 hari per kategori', '30-day obligations by category'), A.hbars(Object.keys(P.AP_CATS).filter(function (k) { return ap.byCat[k]; }).map(function (k) { return { l: P.AP_CATS[k], v: ap.byCat[k] }; }), { fmt: rpj }), { icon: 'layers' }) +
      card(L('Daftar kewajiban', 'Obligations'), A.list(ap.items.slice().sort(function (a, b) { return a.days - b.days; }), [
        { h: L('Kewajiban', 'Obligation'), v: function (x) { return '<b>' + t(x.n) + '</b><small class="sub5">' + t(P.AP_CATS[x.cat]) + '</small>'; } }, { h: L('Jatuh tempo', 'Due'), v: function (x) { return dt(x.due); } },
        { h: L('Sisa hari', 'Days left'), cls: 'r num', v: function (x) { return x.days <= 0 ? A.chip('warn', L('Hari ini', 'Today')) : x.days; } }, { h: L('Nilai', 'Amount'), cls: 'r num', v: function (x) { return '<b>' + rpj(x.amt) + '</b>'; } }
      ], function (x) { return { t: t(x.n), r: rpj(x.amt), s: dt(x.due) + ' · ' + t(P.AP_CATS[x.cat]) }; }, null, { dense: true }), { icon: 'calendar', count: ap.items.length }) + '</div>';
  }
  function finScore() {
    var fh = P.fin.health(), check = P.validateWeights(fh.lines.map(function (l) { return l.k.weight; }));
    return '<div class="grid2 g5-hero">' + card('Financial Health Score', '<div class="hero5">' + ring(fh.score, { size: 116, label: 'Financial Health' }) + '<div>' + bandc(fh.band) + weightMsg(check) + '</div></div>' + A.lineChart([{ n: 'Financial Health', v: fh.hist.concat([fh.score]) }], months(), { h: 160, min: 60, max: 100, label: 'Financial Health' }), { icon: 'gauge' }) +
      card(L('Definisi skor', 'Score definition'), note(t(L('Financial Health Score hanya mengukur keuangan: pertumbuhan revenue, net margin, arus kas, collection, AR > 60 hari, kontrol biaya dan quick ratio. Berbeda dari Business Health dan XScore.', 'The Financial Health Score measures finance only: revenue growth, net margin, cash flow, collection, AR over 60 days, cost control and quick ratio. It is different from Business Health and XScore.')), 'info') +
        kv(fh.lines.map(function (l) { return [l.k.n, pct(l.k.weight, 0)]; })), { icon: 'list' }) + '</div>' +
      card(L('Scorecard Financial Health', 'Financial Health scorecard'), kpiList(fh.lines), { icon: 'target' });
  }
  V['FIN-HLT-001'] = {
    render: function (c) {
      var tab = by(FIN_TABS.map(function (x) { return { k: x[0] }; }), 'k', c.q.tab) ? c.q.tab : 'sum';
      var body = tab === 'cash' ? finCash(c.q) : tab === 'rev' ? finRev(c.q) : tab === 'pl' ? finPL(c.q) : tab === 'exp' ? finExp(c.q) : tab === 'ar' ? finAR() : tab === 'ap' ? finAP() : tab === 'score' ? finScore() : finSum();
      return A.pageHead(null, t(L('Kas, arus kas, profit, AR dan AP dalam satu tampilan · data per ', 'Cash, cash flow, profit, AR and AP in one view · data as of ')) + dt(P.TODAY)) +
        tabs(FIN_TABS.map(function (x) { return [x[0], x[1], x[2]]; }), tab, 'tab', { def: 'sum', label: L('Bagian keuangan', 'Finance sections') }) + body;
    },
    act: { att: attAct }
  };

  /* ================= NP-03 · GOL-CAS-001 Goal Cascade & Orbital Goal ================= */
  function lvl(k) { return by(P.LEVELS, 'k', k); }
  function goalCard(g, o) {
    o = o || {};
    var L0 = lvl(g.lvl), tone = (P.ST[g.status] || P.ST.progress).tone;
    return '<a class="gc5 lv5-' + g.lvl + '" href="' + href('GOL-DTL-001', g.id) + '"><span class="gc5-l">' + ic(L0.icon) + '<span>' + t(L0.n) + '</span></span>' +
      '<b class="gc5-n">' + t(g.n) + '</b><span class="gc5-m">' + esc(g.id) + ' · ' + esc(emp(g.owner)) + ' · ' + dt(g.end) + '</span>' +
      '<span class="gc5-p">' + bar(g.progress, tone) + '<b class="num">' + pct(g.progress, 0) + '</b></span><span class="gc5-s">' + stc(g.status) + (g.progSrc === 'manual' ? A.chip('appr', L('Koreksi manual', 'Manual adjustment'), 'edit') : '') + '</span></a>';
  }
  function goalTree(id) {
    var g = P.goal(id), kids = g.kids.map(function (k) { return k.id; });
    return '<li>' + goalCard(g) + (kids.length ? '<ul class="gt5">' + kids.map(goalTree).join('') + '</ul>' : '') + '</li>';
  }
  V['GOL-CAS-001'] = {
    render: function (c) {
      var all = P.state().goals.map(function (g) { return P.goal(g.id); }), st = c.q.st || '', inv = P.validateCascade();
      var counts = {}; all.forEach(function (g) { counts[g.lvl] = (counts[g.lvl] || 0) + 1; });
      var stCounts = {}; all.forEach(function (g) { stCounts[g.status] = (stCounts[g.status] || 0) + 1; });
      var roots = all.filter(function (g) { return !g.parent; });
      var legend = '<ol class="lvl5">' + P.LEVELS.map(function (l, i) { return '<li class="lv5-' + l.k + '"><span class="lvl5-ic">' + ic(l.icon) + '</span><b>' + t(l.n) + '</b><small>' + t(l.p) + ' · ' + (counts[l.k] || 0) + ' goal</small></li>'; }).join('') + '</ol>';
      var stTabs = [['', L('Semua', 'All'), null, all.length]].concat(['on', 'risk', 'off', 'completed', 'cancelled'].map(function (k) { return [k, P.ST[k].n, null, stCounts[k] || 0]; }));
      var list = st ? '<div class="gl5">' + all.filter(function (g) { return g.status === st; }).sort(function (a, b) { return P.lvlIdx(a.lvl) - P.lvlIdx(b.lvl); }).map(function (g) { return goalCard(g); }).join('') + '</div>' : '<ul class="gt5 gt5-root">' + roots.map(function (g) { return goalTree(g.id); }).join('') + '</ul>';
      if (st && !all.some(function (g) { return g.status === st; })) list = A.empty(L('Tidak ada goal dengan status ini.', 'No goals with this status.'));
      return A.pageHead(null, t(L('Dari Roadmap 3 tahun sampai Daily Race. Setiap level terhubung ke level di atasnya.', 'From the 3-year roadmap down to Daily Race. Every level links to the one above.')), A.pbtn('goal.edit', 'primary', L('Tambah Goal', 'Add Goal'), 'plus', { act: 'add' })) +
        card(L('Alur goal', 'Goal cascade'), legend + (inv.length ? note(t(L(inv.length + ' goal belum terhubung dengan benar.', inv.length + ' goals are not linked correctly.')), 'alert', 'crit') : note(t(L('Semua ' + all.length + ' goal terhubung ke level di atasnya.', 'All ' + all.length + ' goals link to the level above.')), 'checkc', 'ok')), { icon: 'route' }) +
        tabs(stTabs, st, 'st', { def: '', label: L('Status goal', 'Goal status') }) + card(st ? P.ST[st].n : L('Pohon goal', 'Goal tree'), list, { icon: 'target' });
    },
    act: {
      add: function () {
        var c = cx(), lv = P.LEVELS.slice(1).map(function (l) { return [l.k, l.n]; });
        var parents = P.state().goals.filter(function (g) { return g.status !== 'cancelled'; }).map(function (g) { return [g.id, [lvl(g.lvl).n[0] + ' · ' + g.id + ' · ' + g.n[0], lvl(g.lvl).n[1] + ' · ' + g.id + ' · ' + g.n[1]]]; });
        dlg({ title: L('Tambah goal', 'Add goal'), body: fld(L('Level', 'Level'), sel('lvl', lv, 'weekly'), { req: true }) + fld(L('Goal induk (satu level di atas)', 'Parent goal (one level up)'), sel('parent', parents, 'ST-2610-02'), { req: true, wide: true }) +
          fld(L('Nama goal', 'Goal name'), inp('n', '', { ph: L('Contoh: Uptime dryer ≥ 98% minggu 42', 'Example: Dryer uptime ≥ 98% in week 42') }), { req: true, wide: true }) + fld(L('Target', 'Target'), inp('target', '')) + fld(L('Owner', 'Owner'), sel('owner', peopleOpts(), 'EMP-021')) + fld(L('Selesai', 'End'), inp('end', '2026-10-11', { type: 'date' })),
          ok: L('Simpan Goal', 'Save Goal'), onOk: function (v) {
            if (!v.n) return P.MSG.invalid;
            var id = { quarterly: 'QG-', stracon: 'ST-', weekly: 'WR-', daily: 'DR-', business: 'BG-', orbital: 'OG-' }[v.lvl] + String(Date.now()).slice(-5);
            var r = P.goalCreate(c, { id: id, lvl: v.lvl, parent: v.parent, n: [v.n, v.n], owner: v.owner, start: P.TODAY, end: v.end, target: [v.target || '—', v.target || '—'] });
            if (!r.ok) return r.msg; after(L('Goal ' + id + ' disimpan dan terhubung ke ' + v.parent + '.', 'Goal ' + id + ' saved and linked to ' + v.parent + '.')); return true;
          } });
      }
    }
  };

  /* ================= NP-03 · GOL-DTL-001 Goal detail ================= */
  var GOAL_TABS = [['ov', 'Overview', 'eye'], ['kpi', 'KPI', 'chart'], ['ms', 'Milestone', 'flag'], ['race', 'Race', 'zap'], ['iss', 'Issues', 'alert'], ['ins', 'Insights', 'sparkles'], ['ev', L('Bukti', 'Evidence'), 'filecheck'], ['hist', L('Riwayat', 'History'), 'history']];
  function ancestors(g) { var out = [], p = g.parent, guard = 0; while (p && guard++ < 8) { var x = P.goalRaw(p); if (!x) break; out.unshift(x); p = x.parent; } return out; }
  V['GOL-DTL-001'] = {
    title: function (rec) { var g = P.goalRaw(rec); return g ? g.n : L('Detail Goal', 'Goal Detail'); },
    render: function (c) {
      var g = P.goal(c.rec);
      if (!g) return A.stateCard('empty', P.MSG.notfound, A.btn('blue', L('Goal Cascade', 'Goal Cascade'), 'arrowl', { go: 'GOL-CAS-001' }));
      var tab = c.q.tab || 'ov', L0 = lvl(g.lvl), anc = ancestors(g), codes = g.kpis || [];
      var races = P.state().daily.filter(function (r) { return r.goal === g.id; }), weeks = P.weekly().filter(function (w) { return w.goal === g.id; });
      var issues = P.state().issues.filter(function (i) { return codes.indexOf(i.kpi) >= 0 || races.some(function (r) { return r.kpi === i.kpi; }); });
      var ins = D.INSIGHTS.filter(function (x) { return codes.indexOf(x.src) >= 0; });
      var hist = P.auditLog().filter(function (e) { return e.target && String(e.target).indexOf(g.id) === 0; });
      var body;
      if (tab === 'kpi') body = card(L('KPI terhubung', 'Linked KPIs'), kpiList(g.lines), { icon: 'chart' });
      else if (tab === 'ms') body = card('Milestone', g.ms && g.ms.length ? '<ol class="ms5">' + g.ms.map(function (m) { return '<li class="' + (m[2] ? 'done' : '') + '">' + ic(m[2] ? 'checkc' : 'clock') + '<b>' + t(m[0]) + '</b><small>' + dt(m[1]) + '</small></li>'; }).join('') + '</ol>' : A.empty(L('Goal ini tidak memakai milestone.', 'This goal has no milestones.')), { icon: 'flag' });
      else if (tab === 'race') body = card('Daily Race', races.length ? '<div class="rc5s">' + races.map(function (r) { return A.P5.raceCard ? A.P5.raceCard(r) : esc(r.id); }).join('') + '</div>' : A.empty(L('Belum ada Daily Race untuk goal ini.', 'No Daily Race for this goal yet.')), { icon: 'zap', count: races.length }) +
        (weeks.length ? card('Weekly Race', A.list(weeks, [{ h: 'Race', v: function (w) { return '<b>' + t(w.n) + '</b>'; } }, { h: L('Target', 'Target'), cls: 'r num', v: function (w) { return fv(w.target, w.unit); } }, { h: L('Aktual', 'Actual'), cls: 'r num', v: function (w) { return fv(w.actual, w.unit); } }, { h: L('Status', 'Status'), v: function (w) { return stc(w.st); } }], function (w) { return { t: t(w.n), r: fv(w.actual, w.unit), chip: stc(w.st) }; }, null, { dense: true }), { icon: 'flag' }) : '') +
        (g.kids.length ? card(L('Goal turunan', 'Child goals'), '<div class="gl5">' + g.kids.map(function (k) { return goalCard(P.goal(k.id)); }).join('') + '</div>', { icon: 'route' }) : '');
      else if (tab === 'iss') body = card('Issues', issues.length ? A.list(issues, [{ h: 'Issue', v: function (i) { return '<b>' + t(i.n) + '</b><small class="sub5">' + esc(i.id) + ' · ' + esc(i.kpi) + '</small>'; } }, { h: 'Owner', v: function (i) { return esc(emp(i.owner)); } }, { h: 'Due', v: function (i) { return dt(i.due); } }, { h: L('Status', 'Status'), v: function (i) { return stc(i.status); } }], function (i) { return { t: t(i.n), s: esc(emp(i.owner)) + ' · ' + dt(i.due), chip: stc(i.status) }; }, function () { return open('REFL-001') ? href('REFL-001', null, { tab: 'iss' }) : null; }, { dense: true }) : A.empty(L('Tidak ada issue terkait.', 'No related issues.')), { icon: 'alert', count: issues.length });
      else if (tab === 'ins') body = card('Insights', ins.length ? ins.map(function (x) { return A.P5.insightCard ? A.P5.insightCard(x, true) : t(x.t); }).join('') : A.empty(L('Belum ada insight untuk goal ini.', 'No insights for this goal yet.')), { icon: 'sparkles' });
      else if (tab === 'ev') body = card(L('Bukti', 'Evidence'), '<ul class="ev5">' + g.lines.map(function (l) { return '<li>' + ic(l.k.src === 'manual' ? 'edit' : 'database') + '<span><b>' + t(l.k.n) + '</b><small>' + t(P.SRC[l.k.src] || '') + ' · ' + t(l.k.evid) + (l.k.manual ? ' · ' + t(L('Input manual oleh ', 'Manual input by ')) + esc(emp(l.k.manual.by)) + ': ' + t(l.k.manual.reason) : '') + '</small></span></li>'; }).join('') +
        races.map(function (r) { return (r.ev.sys || []).map(function (e) { return '<li>' + ic('database') + '<span><b>' + t(e[1]) + '</b><small>' + t(P.SRC[e[0]] || e[0]) + ' · ' + t(r.n) + '</small></span></li>'; }).join(''); }).join('') + '</ul>' + (!g.lines.length && !races.length ? A.empty(L('Progres goal ini dihitung dari goal turunan.', 'This goal\'s progress comes from its child goals.')) : ''), { icon: 'filecheck' });
      else if (tab === 'hist') body = card(L('Riwayat', 'History'), kv([[L('Versi', 'Version'), 'v' + (g.v || 1)], [L('Mulai', 'Start'), dt(g.start)], [L('Selesai', 'End'), dt(g.end)]]) + (g.adj ? note(t(L('Progres dikoreksi manual menjadi ', 'Progress manually set to ')) + pct(g.adj.v, 0) + ' · ' + esc(g.adj.reason) + ' · ' + dtt(g.adj.at), 'edit', 'warn') : '') +
        (hist.length ? '<ol class="aud5">' + hist.map(function (e) { return '<li><b>' + t(P.EVENTS[e.ev] || e.ev) + '</b><small>' + dtt(e.at) + ' · ' + esc(e.by) + (e.from != null ? ' · ' + esc(e.from) + ' → ' + esc(e.to) : '') + (e.reason ? ' · ' + esc(e.reason) : '') + '</small></li>'; }).join('') + '</ol>' : note(t(L('Belum ada perubahan sejak versi ini.', 'No changes since this version.')), 'history')), { icon: 'history' });
      else body = '<div class="grid2">' + card(L('Informasi goal', 'Goal information'), kv([[L('Level', 'Level'), t(L0.n) + ' · ' + t(L0.p)], ['ID', esc(g.id)], [L('Tema', 'Theme'), t(P.THEMES[g.theme] || '—')], ['Owner', lnk('PERF-USR-001', g.owner, esc(emp(g.owner)))], [L('Periode', 'Period'), dt(g.start) + ' – ' + dt(g.end)], [L('Target', 'Target'), t(g.target || '—')], [L('Dampak', 'Impact'), t(g.impact || '—')], [L('Sumber progres', 'Progress source'), esc(g.progSrc)], [L('Versi', 'Version'), 'v' + (g.v || 1)]]), { icon: 'target' }) +
        card(L('Terhubung ke atas', 'Linked upward'), anc.length ? '<ol class="anc5">' + anc.map(function (a) { return '<li>' + lnk('GOL-DTL-001', a.id, ic(lvl(a.lvl).icon) + '<span><small>' + t(lvl(a.lvl).n) + '</small><b>' + t(a.n) + '</b></span>') + '</li>'; }).join('') + '<li class="me">' + ic(L0.icon) + '<span><small>' + t(L0.n) + '</small><b>' + t(g.n) + '</b></span></li></ol>' : note(t(L('Roadmap adalah level tertinggi.', 'The roadmap is the top level.')), 'route') +
          (g.kids.length ? '<h3 class="h5">' + t(L('Goal turunan', 'Child goals')) + '</h3><div class="gl5">' + g.kids.map(function (k) { return goalCard(P.goal(k.id)); }).join('') + '</div>' : ''), { icon: 'route' }) + '</div>';
      return A.pageHead(null, t(L0.n) + ' · ' + esc(g.id), A.pbtn('goal.adjust', 'ghost', L('Koreksi Progres', 'Adjust Progress'), 'edit', { act: 'adjust' })) +
        '<div class="ghd5">' + ring(g.progress, { size: 96, label: L('Progres', 'Progress'), band: { tone: (P.ST[g.status] || P.ST.progress).tone, n: P.ST[g.status] ? P.ST[g.status].n : g.status } }) + '<div><b class="ghd5-n">' + t(g.n) + '</b><span>' + stc(g.status) + ' ' + t(L('Progres dari ', 'Progress from ')) + progSrcLabel(g.progSrc) + '</span>' + note(t(L('Progres diambil dari KPI, milestone dan race. Koreksi manual butuh izin dan alasan.', 'Progress comes from KPIs, milestones and races. Manual adjustment needs permission and a reason.')), 'info') + '</div></div>' +
        tabs(GOAL_TABS, tab, 'tab', { def: 'ov', label: L('Bagian goal', 'Goal sections') }) + body;
    },
    act: {
      adjust: function () {
        var c = cx(), g = P.goal(A.S.rec);
        dlg({ title: L('Koreksi progres manual', 'Manual progress adjustment'), sub: t(g.n), body: fld(L('Progres (%)', 'Progress (%)'), inp('v', g.progress, { num: true }), { req: true }) + fld(L('Alasan', 'Reason'), area('reason', '', L('Wajib diisi', 'Required')), { req: true, wide: true }), ok: L('Simpan Koreksi', 'Save Adjustment'),
          onOk: function (v) { var n = num(v.v); if (n == null || isNaN(n)) return P.MSG.invalid; var r = P.goalAdjust(c, g.id, n, v.reason); if (!r.ok) return r.msg; after(L('Progres dikoreksi dan dicatat di audit.', 'Progress adjusted and logged in the audit.')); return true; } });
      }
    }
  };

  /* ================= NP-04 · KPI-MST-001 KPI Master, contract & weighting ================= */
  var KPI_TABS = [['lib', L('Library KPI', 'KPI Library'), 'list'], ['board', L('Weight Board', 'Weight Board'), 'scale'], ['life', L('Lifecycle & Versi', 'Lifecycle & Versions'), 'history']];
  function scName(id) { var s = P.scorecard(id); return s ? s.n : id; }
  V['KPI-MST-001'] = {
    render: function (c) {
      var tab = c.q.tab || 'lib', body;
      if (tab === 'board') {
        var scId = c.q.sc && P.scorecard(c.q.sc) ? c.q.sc : 'XS-FIN', b = P.board(scId), s = P.scorecard(scId);
        body = tabs(P.state().scorecards.map(function (x) { return [x.id, x.id === 'FH' ? 'Financial Health' : x.id === 'R2-UBD' ? 'R2RE Ubud' : T(x.n).replace('XScore · ', '')]; }), scId, 'sc', { seg: true, def: 'XS-FIN', label: 'Scorecard' }) +
          card(T(s.n) + ' · v' + s.v, weightMsg(b.check) + '<div class="wb5">' + b.rows.map(function (k) {
            var rec = P.PRI[k.pri].rec, out = k.weight < rec[0] || k.weight > rec[1];
            return '<div class="wb5-r"><span class="wb5-n"><b>' + t(k.n) + '</b><small>' + esc(k.code) + ' · ' + t(P.CATS[k.cat]) + ' · ' + t(P.PRI[k.pri].n) + ' (' + t(L('saran ', 'suggested ')) + rec[0] + '–' + rec[1] + '%)</small></span>' +
              '<span class="wb5-b">' + bar(k.weight * 2.5, out ? 'warn' : 'info') + '</span><b class="wb5-w num">' + pct(k.weight, 0) + '</b>' + lifec(k.status) +
              (can('kpi.weight') ? '<button type="button" class="btn btn-ghost btn-sm" data-act="weight" data-val="' + esc(k.code) + '">' + ic('edit') + '<span>' + t(L('Bobot', 'Weight')) + '</span></button>' : '') + '</div>';
          }).join('') + '</div>' + note(t(L('Prioritas hanya menyarankan rentang bobot. Bobot akhir ditentukan manajemen dan total wajib tepat 100%.', 'Priority only suggests a weight range. Management sets the final weight and the total must be exactly 100%.')), 'info') +
            '<div class="ds-btnbar">' + A.pbtn('kpi.approve', 'primary', L('Aktifkan Scorecard', 'Activate Scorecard'), 'checkc', { act: 'activate', val: scId }) + A.pbtn('kpi.edit', 'ghost', L('Tambah KPI', 'Add KPI'), 'plus', { go: 'KPI-EDT-001', rec: 'new', qs: 'sc=' + scId }) + '</div>', { icon: 'scale' });
      } else if (tab === 'life') {
        var all = P.state().kpis.slice().sort(function (a, b) { return (a.code < b.code ? -1 : a.code > b.code ? 1 : 0) || (b.v - a.v); });
        var cnt = {}; P.library().forEach(function (k) { cnt[k.status] = (cnt[k.status] || 0) + 1; });
        body = card('Lifecycle', '<ol class="life5">' + P.LIFE_ORDER.map(function (s) { return '<li class="lf-' + P.LIFE[s].tone + '"><b class="num">' + (cnt[s] || 0) + '</b><span>' + t(P.LIFE[s].n) + '</span></li>'; }).join('') + '</ol>' + note(t(L('Perubahan target, bobot, formula, owner atau agregasi setelah KPI aktif membuat versi baru. Riwayat dihitung dengan versinya sendiri dan tidak pernah dihitung ulang.', 'Changing the target, weight, formula, owner or aggregation after a KPI is active creates a new version. History keeps its own version and is never recalculated.')), 'lock'), { icon: 'history' }) +
          card(L('Semua versi KPI', 'All KPI versions'), A.list(all, [
            { h: 'KPI', v: function (k) { return '<b>' + t(k.n) + '</b><small class="sub5">' + esc(k.code) + ' · ' + esc(k.sc) + '</small>'; } }, { h: L('Versi', 'Version'), cls: 'num', v: function (k) { return 'v' + k.v; } },
            { h: L('Status', 'Status'), v: function (k) { return lifec(k.status) + (k.retire ? A.chip('crit', L('Akan dinonaktifkan', 'Retiring')) : ''); } }, { h: L('Berlaku', 'Effective'), v: function (k) { return k.eff ? dt(k.eff) : '—'; } },
            { h: L('Target', 'Target'), cls: 'r num', v: function (k) { return fv(k.target, k.unit); } }, { h: L('Bobot', 'Weight'), cls: 'r num', v: function (k) { return pct(k.weight, 0); } }, { h: L('Alasan', 'Reason'), v: function (k) { return t(k.reason); } },
            { h: L('Tindakan', 'Actions'), v: function (k) { return (P.TRANSITIONS[k.status] || []).filter(function (to) { return to !== 'active' && can(to === 'review' || to === 'draft' ? 'kpi.edit' : 'kpi.approve'); }).map(function (to) { return '<button type="button" class="btn btn-ghost btn-sm" data-act="trans" data-val="' + esc(k.code + '|' + k.v + '|' + to) + '"><span>' + t(P.LIFE[to].n) + '</span></button>'; }).join(''); } }
          ], function (k) { return { t: t(k.n) + ' · v' + k.v, s: esc(k.code) + ' · ' + fv(k.target, k.unit) + ' · ' + pct(k.weight, 0), chip: lifec(k.status) }; }, null, { dense: true }), { icon: 'list', count: all.length });
      } else {
        var defs = [
          { k: 'cat', l: L('Kategori', 'Category'), opts: P.CAT_ORDER.map(function (k) { return [k, P.CATS[k]]; }), fn: function (k, v) { return k.cat === v; } },
          { k: 'sc', l: 'Scorecard', opts: P.state().scorecards.map(function (s) { return [s.id, s.n]; }), fn: function (k, v) { return k.sc === v; } },
          { k: 'st', l: L('Status', 'Status'), opts: P.LIFE_ORDER.map(function (s) { return [s, P.LIFE[s].n]; }), fn: function (k, v) { return k.status === v; } },
          { k: 'pri', l: L('Prioritas', 'Priority'), opts: Object.keys(P.PRI).map(function (p) { return [p, P.PRI[p].n]; }), fn: function (k, v) { return k.pri === v; } }
        ];
        var rows = A.applyFilters(P.sortKpis(P.library()), defs, function (k) { return k.code + ' ' + T(k.n); });
        var byCat = {}; P.library().forEach(function (k) { byCat[k.cat] = (byCat[k.cat] || 0) + 1; });
        body = '<div class="cats5">' + P.CAT_ORDER.map(function (k) { return '<a class="cat5' + (c.q.cat === k ? ' on' : '') + '" href="' + qhref({ cat: c.q.cat === k ? null : k }) + '">' + ic(P.CAT_ICON[k]) + '<b>' + t(P.CATS[k]) + '</b><small class="num">' + (byCat[k] || 0) + ' KPI</small></a>'; }).join('') + '</div>' +
          A.filters(defs, { search: L('Cari kode atau nama KPI', 'Search KPI code or name'), force: true }) +
          card(L('Library KPI', 'KPI Library'), A.list(rows, [
            { h: 'KPI', v: function (k) { return '<b>' + t(k.n) + '</b><small class="sub5">' + esc(k.code) + ' · ' + t(P.SRC[k.src] || '') + '</small>'; } }, { h: L('Kategori', 'Category'), v: function (k) { return t(P.CATS[k.cat]); } },
            { h: 'Scorecard', v: function (k) { return esc(k.sc); } }, { h: L('Arah', 'Direction'), v: function (k) { return ic(k.dir === 'lower' ? 'arrowdn' : k.dir === 'higher' ? 'arrowup' : k.dir === 'range' ? 'scale' : 'checkc') + '<span class="sr">' + t(P.DIRS[k.dir]) + '</span>'; } },
            { h: L('Target', 'Target'), cls: 'r num', v: function (k) { return k.dir === 'range' ? fv(k.lo, k.unit) + '–' + fv(k.hi, k.unit) : fv(k.target, k.unit); } }, { h: L('Bobot', 'Weight'), cls: 'r num', v: function (k) { return pct(k.weight, 0); } },
            { h: L('Prioritas', 'Priority'), v: function (k) { return t(P.PRI[k.pri].n); } }, { h: L('Status', 'Status'), v: function (k) { return lifec(k.status) + ' <small class="sub5">v' + k.v + '</small>'; } }
          ], function (k) { return { t: t(k.n), r: pct(k.weight, 0), s: esc(k.code) + ' · ' + t(P.CATS[k.cat]) + ' · ' + fv(k.target, k.unit), chip: lifec(k.status) }; }, function (k) { return P.kpi(k.code) ? href('KPI-DTL-001', k.code) : href('KPI-EDT-001', k.code); }, { dense: true }), { icon: 'list', count: rows.length });
      }
      return A.pageHead(null, t(L('KPI resmi, bobot scorecard 100% dan versi yang tidak mengubah riwayat.', 'Official KPIs, 100% scorecard weights and versions that never change history.')), A.pbtn('kpi.edit', 'primary', L('Buat KPI', 'Create KPI'), 'plus', { go: 'KPI-EDT-001', rec: 'new' })) +
        tabs(KPI_TABS, tab, 'tab', { def: 'lib', label: L('Bagian KPI', 'KPI sections') }) + body;
    },
    act: {
      weight: function (el) {
        var c = cx(), code = el.getAttribute('data-val'), k = P.proposed(code), scId = k.sc;
        dlg({ title: L('Ubah bobot', 'Change weight'), sub: t(k.n) + ' · ' + esc(code) + ' · ' + t(P.weightHint(k)),
          body: fld(L('Bobot (%)', 'Weight (%)'), inp('w', k.weight, { num: true }), { req: true }) + '<div id="wprev"></div>' + fld(L('Alasan perubahan', 'Reason for change'), area('reason', '', L('Wajib bila KPI sudah aktif', 'Required once the KPI is active')), { wide: true }),
          after: function (el2) {
            var f = el2.querySelector('[name="w"]'), box = el2.querySelector('#wprev');
            function upd() { var n = num(f.value); var ws = P.board(scId).rows.map(function (r) { return r.code === code ? (isNaN(n) || n == null ? 0 : n) : r.weight; }); box.innerHTML = weightMsg(P.validateWeights(ws)); }
            f.addEventListener('input', upd); upd();
          },
          onOk: function (v) { var n = num(v.w); if (n == null || isNaN(n) || n < 0 || n > 100) return P.MSG.invalid; var r = P.kpiSave(c, code, { weight: n }, v.reason); if (!r.ok) return r.msg; var ck = P.board(scId).check; after(r.newVersion ? L('Versi v' + r.k.v + ' (draft) dibuat. ' + ck.msg[0], 'Version v' + r.k.v + ' (draft) created. ' + ck.msg[1]) : ck.msg, ck.ok ? 'ok' : 'warn'); return true; } });
      },
      activate: function (el) { var r = P.activateScorecard(cx(), el.getAttribute('data-val')); if (!r.ok) { A.toast(r.msg, 'crit'); return; } after(L('Scorecard aktif v' + r.v + ' · ' + r.applied + ' perubahan diterapkan.', 'Scorecard live v' + r.v + ' · ' + r.applied + ' changes applied.')); },
      trans: function (el) { var p = el.getAttribute('data-val').split('|'), r = P.kpiTransition(cx(), p[0], +p[1], p[2]); if (!r.ok) { A.toast(r.msg, 'crit'); return; } after(L(p[0] + ' v' + p[1] + ' → ' + P.LIFE[p[2]].n[0], p[0] + ' v' + p[1] + ' → ' + P.LIFE[p[2]].n[1])); }
    }
  };

  /* ================= NP-04 · KPI-EDT-001 KPI editor ================= */
  V['KPI-EDT-001'] = {
    title: function (rec) { return rec === 'new' || !rec ? L('KPI Baru', 'New KPI') : L('Ubah KPI ' + rec, 'Edit KPI ' + rec); },
    render: function (c) {
      var isNew = !c.rec || c.rec === 'new', k = isNew ? { code: '', n: ['', ''], sc: c.q.sc || 'XS-OPS', cat: 'operations', dir: 'higher', target: '', unit: '%', weight: 0, pri: 'medium', agg: 'ratio', src: 'production', floor: 80, cap: 100, owner: 'EMP-010', reviewer: 'EMP-010', approver: 'EMP-050', formula: ['', ''], evid: L('Otomatis dari data transaksi', 'Automatic from transaction data'), status: 'draft', v: 1, freq: 'monthly' } : P.proposed(c.rec);
      if (!k) return A.stateCard('empty', P.MSG.notfound, A.btn('blue', 'KPI Master', 'arrowl', { go: 'KPI-MST-001' }));
      var edit = can('kpi.edit'), wEdit = can('kpi.weight'), live = !isNew && (k.status !== 'draft' && k.status !== 'review');
      function ro(x) { return '<span class="f5-ro">' + x + '</span>'; }
      var scs = P.state().scorecards.map(function (s) { return [s.id, s.n]; }), cats = P.CAT_ORDER.map(function (x) { return [x, P.CATS[x]]; }), dirs = Object.keys(P.DIRS).map(function (x) { return [x, P.DIRS[x]]; });
      var pris = Object.keys(P.PRI).map(function (x) { return [x, P.PRI[x].n]; }), aggs = Object.keys(P.AGG).map(function (x) { return [x, P.AGG[x].n]; }), srcs = Object.keys(P.SRC).map(function (x) { return [x, P.SRC[x]]; });
      var freq = [['daily', L('Harian', 'Daily')], ['weekly', L('Mingguan', 'Weekly')], ['monthly', L('Bulanan', 'Monthly')], ['quarterly', L('Kuartalan', 'Quarterly')]];
      function F(label, name, input, roVal, o) { return fld(label, edit ? input : ro(roVal), o); }
      var vers = isNew ? [] : P.versions(k.code);
      return A.pageHead(null, isNew ? t(L('KPI baru selalu mulai sebagai draft.', 'A new KPI always starts as a draft.')) : esc(k.code) + ' · v' + k.v + ' · ' + T(P.LIFE[k.status].n), isNew ? '' : A.btn('ghost', L('Detail KPI', 'KPI Detail'), 'chart', { go: P.kpi(k.code) ? 'KPI-DTL-001' : 'KPI-MST-001', rec: P.kpi(k.code) ? k.code : null })) +
        (live ? note(t(L('KPI ini sedang berlaku. Mengubah target, bobot, formula, owner, agregasi, floor, cap atau stretch membuat versi draft baru; versi berlaku tetap dipakai sampai scorecard diaktifkan ulang. Alasan wajib diisi.', 'This KPI is in force. Changing target, weight, formula, owner, aggregation, floor, cap or stretch creates a new draft version; the version in force keeps working until the scorecard is re-activated. A reason is required.')), 'lock', 'warn') : '') +
        (!edit ? note(t(P.MSG.noperm), 'lock') : '') +
        '<form class="kf5" id="kf5" onsubmit="return false">' +
        card(L('Identitas KPI', 'KPI identity'), '<div class="fg5">' +
          F(L('Kode KPI', 'KPI code'), 'code', inp('code', k.code, { ro: !isNew, ph: L('Contoh: OPS-06', 'Example: OPS-06') }), esc(k.code), { req: true }) +
          F(L('Nama KPI', 'KPI name'), 'n', inp('n', T(k.n)), t(k.n), { req: true, wide: true }) +
          F('Scorecard', 'sc', sel('sc', scs, k.sc), t(scName(k.sc)), { req: true }) + F(L('Kategori', 'Category'), 'cat', sel('cat', cats, k.cat), t(P.CATS[k.cat]), { req: true }) +
          F(L('Deskripsi / formula', 'Description / formula'), 'formula', area('formula', T(k.formula || k.desc)), t(k.formula || k.desc), { wide: true }) +
          F(L('Sumber data', 'Data source'), 'src', sel('src', srcs, k.src), t(P.SRC[k.src])) + F(L('Frekuensi', 'Frequency'), 'freq', sel('freq', freq, k.freq || 'monthly'), esc(k.freq || 'monthly')) +
          F(L('Bukti yang diperlukan', 'Evidence required'), 'evid', inp('evid', T(k.evid)), t(k.evid), { wide: true }) + '</div>', { icon: 'idcard' }) +
        card(L('Target & perhitungan', 'Target & calculation'), '<div class="fg5">' +
          F(L('Arah', 'Direction'), 'dir', sel('dir', dirs, k.dir), t(P.DIRS[k.dir]), { req: true }) + F(L('Satuan', 'Unit'), 'unit', inp('unit', T(k.unit)), t(k.unit)) +
          F(L('Target', 'Target'), 'target', inp('target', k.target, { num: true }), fv(k.target, k.unit), { req: true }) +
          F(L('Batas bawah (range)', 'Lower bound (range)'), 'lo', inp('lo', k.lo, { num: true }), k.lo == null ? '—' : fv(k.lo, k.unit)) + F(L('Batas atas (range)', 'Upper bound (range)'), 'hi', inp('hi', k.hi, { num: true }), k.hi == null ? '—' : fv(k.hi, k.unit)) +
          F(L('Stretch target', 'Stretch target'), 'stretch', inp('stretch', k.stretch, { num: true }), k.stretch == null ? '—' : fv(k.stretch, k.unit)) +
          F(L('Floor (%)', 'Floor (%)'), 'floor', inp('floor', k.floor, { num: true, ph: L('kosong = tanpa floor', 'empty = no floor') }), k.floor == null ? '—' : pct(k.floor, 0), { hint: t(L('Di bawah floor skor = 0.', 'Below the floor the score is 0.')) }) +
          F(L('Cap (%)', 'Cap (%)'), 'cap', inp('cap', k.cap, { num: true }), pct(k.cap, 0)) +
          F(L('Metode agregasi', 'Aggregation method'), 'agg', sel('agg', aggs, k.agg), t(P.AGG[k.agg].n)) + '</div>', { icon: 'cog' }) +
        card(L('Bobot & prioritas', 'Weight & priority'), '<div class="fg5">' +
          F(L('Prioritas', 'Priority'), 'pri', sel('pri', pris, k.pri), t(P.PRI[k.pri].n), { hint: '<span id="whint">' + t(P.weightHint(k)) + '</span>' }) +
          fld(L('Bobot (%)', 'Weight (%)'), wEdit ? inp('weight', k.weight, { num: true }) : ro(pct(k.weight, 0)) + '<input type="hidden" name="weight" value="' + esc(k.weight) + '">', { req: true, hint: !wEdit ? t(L('Hanya pemegang izin bobot yang dapat mengubah.', 'Only weight-permission holders can change this.')) : '' }) +
          '<div class="f5 f5-w" id="wcheck"></div></div>', { icon: 'scale' }) +
        card(L('Tanggung jawab', 'Accountability'), '<div class="fg5">' +
          F('Owner', 'owner', sel('owner', peopleOpts(), k.owner), esc(emp(k.owner))) + F('Reviewer', 'reviewer', sel('reviewer', peopleOpts(), k.reviewer), esc(emp(k.reviewer))) + F('Approver', 'approver', sel('approver', peopleOpts(), k.approver), esc(emp(k.approver))) +
          fld(L('Status', 'Status'), ro(lifec(k.status) + ' · v' + k.v + (k.eff ? ' · ' + t(L('berlaku ', 'effective ')) + dt(k.eff) : ''))) +
          (edit && !isNew ? fld(L('Alasan perubahan', 'Reason for change'), area('reason', '', L('Wajib bila KPI sudah berlaku', 'Required when the KPI is in force')), { wide: true, req: live }) : '') + '</div>', { icon: 'users' }) +
        '</form>' +
        (vers.length ? card(L('Versi', 'Versions'), '<ol class="aud5">' + vers.map(function (x) { return '<li><b>v' + x.v + ' · ' + t(P.LIFE[x.status].n) + '</b><small>' + (x.eff ? dt(x.eff) + ' · ' : '') + fv(x.target, x.unit) + ' · ' + pct(x.weight, 0) + ' · ' + t(x.reason) + '</small></li>'; }).join('') + '</ol>', { icon: 'history' }) : '') +
        (edit || wEdit ? A.actionBar(A.btn('primary', isNew ? L('Simpan Draft', 'Save Draft') : L('Simpan Perubahan', 'Save Changes'), 'check', { act: 'save' }),
          (!isNew && k.status === 'draft' && edit ? A.btn('ghost', L('Kirim ke Review', 'Send to Review'), 'arrow', { act: 'tr', val: 'review' }) : '') +
          (!isNew && (k.status === 'review') && can('kpi.approve') ? A.btn('ghost', L('Setujui', 'Approve'), 'filecheck', { act: 'tr', val: 'approved' }) : '') +
          (!isNew && edit ? A.btn('ghost', L('Salin', 'Copy'), 'layers', { act: 'copy' }) : '') + (!isNew && wEdit ? A.btn('ghost', L('Nonaktifkan', 'Deactivate'), 'ban', { act: 'deact' }) : '')) : '');
    },
    after: function (c) {
      var f = document.getElementById('kf5'); if (!f) return;
      var isNew = !c.rec || c.rec === 'new';
      function upd() {
        var w = f.querySelector('[name="weight"]'), s = f.querySelector('[name="sc"]'), pri = f.querySelector('[name="pri"]'), box = document.getElementById('wcheck'), hint = document.getElementById('whint');
        var scId = s ? s.value : P.proposed(c.rec).sc, code = isNew ? '__new' : c.rec, n = num(w ? w.value : 0);
        var rows = P.board(scId).rows.filter(function (r) { return r.code !== code; }).map(function (r) { return r.weight; }).concat([isNaN(n) || n == null ? 0 : n]);
        if (box) box.innerHTML = '<span>' + t(L('Weight board ', 'Weight board ')) + esc(scId) + '</span>' + weightMsg(P.validateWeights(rows));
        if (hint && pri) hint.textContent = T(P.weightHint({ pri: pri.value }));
      }
      f.addEventListener('input', upd); f.addEventListener('change', upd); upd();
    },
    act: {
      save: function () {
        var c = cx(), f = document.getElementById('kf5'), v = {}, isNew = !A.S.rec || A.S.rec === 'new';
        f.querySelectorAll('[name]').forEach(function (x) { v[x.name] = String(x.value).trim(); });
        var nums = ['target', 'lo', 'hi', 'stretch', 'floor', 'cap', 'weight'], bad = nums.filter(function (k) { return v[k] !== undefined && v[k] !== '' && isNaN(num(v[k])); });
        if (bad.length || !v.n || v.target === '' || (isNew && !v.code)) { A.toast(P.MSG.invalid, 'crit'); return; }
        var rec = { n: [v.n, v.n], sc: v.sc, cat: v.cat, dir: v.dir, unit: v.unit, target: num(v.target), lo: num(v.lo), hi: num(v.hi), stretch: num(v.stretch), floor: v.floor === '' ? null : num(v.floor), cap: num(v.cap) || 100, weight: num(v.weight) || 0, pri: v.pri, agg: v.agg, src: v.src, freq: v.freq, owner: v.owner, reviewer: v.reviewer, approver: v.approver, formula: [v.formula, v.formula], evid: [v.evid, v.evid] };
        if (rec.dir !== 'range') { delete rec.lo; delete rec.hi; }
        if (rec.stretch == null) delete rec.stretch;
        if (isNew) {
          rec.code = v.code.toUpperCase();
          var r = P.kpiCreate(c, rec); if (!r.ok) { A.toast(r.msg, 'crit'); return; }
          A.go('KPI-EDT-001', rec.code); setTimeout(function () { A.toast(L('Draft KPI ' + rec.code + ' disimpan.', 'KPI draft ' + rec.code + ' saved.')); }, 400); return;
        }
        var cur = P.proposed(A.S.rec), ch = {};
        Object.keys(rec).forEach(function (k) { var a = rec[k], b = cur[k]; if (Array.isArray(a)) { if (!b || T(b) !== a[0]) ch[k] = a; } else if (a !== (b === undefined ? null : b)) ch[k] = a; });
        if (!can('kpi.weight')) delete ch.weight;
        var r2 = P.kpiSave(c, A.S.rec, ch, v.reason);
        if (!r2.ok) { A.toast(r2.msg, 'crit'); return; }
        if (r2.same) { A.toast(L('Tidak ada perubahan.', 'No changes.'), 'warn'); return; }
        after(r2.newVersion ? L('Versi baru v' + r2.k.v + ' dibuat sebagai draft. Versi berlaku tetap dipakai.', 'New version v' + r2.k.v + ' created as a draft. The version in force keeps working.') : L('Perubahan disimpan.', 'Changes saved.'));
      },
      tr: function (el) { var k = P.proposed(A.S.rec), r = P.kpiTransition(cx(), k.code, k.v, el.getAttribute('data-val')); if (!r.ok) { A.toast(r.msg, 'crit'); return; } after(L('Status: ' + P.LIFE[r.k.status].n[0], 'Status: ' + P.LIFE[r.k.status].n[1])); },
      copy: function () {
        var c = cx(), k = P.proposed(A.S.rec);
        dlg({ title: L('Salin KPI', 'Copy KPI'), sub: t(k.n), body: fld(L('Kode baru', 'New code'), inp('code', k.code + '-B'), { req: true }) + fld('Scorecard', sel('sc', P.state().scorecards.map(function (s) { return [s.id, s.n]; }), k.sc)), ok: L('Salin', 'Copy'), icon: 'layers',
          onOk: function (v) { if (!v.code) return P.MSG.invalid; var r = P.kpiCopy(c, k.code, v.code.toUpperCase(), v.sc); if (!r.ok) return r.msg; A.go('KPI-EDT-001', r.k.code); setTimeout(function () { A.toast(L('Disalin sebagai draft ' + r.k.code + '.', 'Copied as draft ' + r.k.code + '.')); }, 400); return true; } });
      },
      deact: function () {
        var c = cx(), k = P.proposed(A.S.rec);
        dlg({ title: L('Nonaktifkan KPI', 'Deactivate KPI'), sub: t(L('KPI keluar dari scorecard saat scorecard diaktifkan ulang. Bobotnya harus dibagi ke KPI lain agar total tetap 100%.', 'The KPI leaves the scorecard when it is re-activated. Its weight must move to other KPIs so the total stays 100%.')), body: fld(L('Alasan', 'Reason'), area('reason', ''), { req: true, wide: true }), ok: L('Nonaktifkan', 'Deactivate'), icon: 'ban',
          onOk: function (v) { var r = P.kpiDeactivate(c, k.code, v.reason); if (!r.ok) return r.msg; var ck = P.board(k.sc).check; after(L('Draft penonaktifan dibuat. ' + ck.msg[0], 'Deactivation draft created. ' + ck.msg[1]), 'warn'); return true; } });
      }
    }
  };

  /* ================= NP-04 · KPI-DTL-001 KPI detail & drill-down ================= */
  V['KPI-DTL-001'] = {
    title: function (rec) { var k = P.kpi(rec) || P.proposed(rec); return k ? k.n : L('Detail KPI', 'KPI Detail'); },
    render: function (c) {
      var k = P.kpi(c.rec) || P.proposed(c.rec);
      if (!k) return A.stateCard('empty', P.MSG.notfound, A.btn('blue', 'KPI Master', 'arrowl', { go: 'KPI-MST-001' }));
      var l = P.line(k), teams = (k.teams || []).map(P.team).filter(Boolean), goal = k.goal ? P.goalRaw(k.goal) : null, isR2 = k.sc === 'R2-UBD';
      var races = P.state().daily.filter(function (r) { return r.kpi === k.code || (isR2 ? false : P.kpi(r.kpi) && P.kpi(r.kpi).parent === k.code); });
      var hist = isR2 ? l.vals || P.r2Line(k, 'W40').vals : (k.hist || []).slice(0, -1).concat([l.actual]);
      var labels = isR2 ? D.R2_WEEKS.map(function (w) { return T(w.n); }) : months(hist.length);
      var owner = cx(), isOwner = owner && owner.employee && owner.employee.id === k.owner;
      var dimK = by(D.XDIMS, 'sc', k.sc);
      return A.pageHead(null, esc(k.code) + ' · ' + t(P.CATS[k.cat]) + ' · ' + t(scName(k.sc)) + ' · v' + k.v, (can('kpi.edit') || can('kpi.weight') ? A.btn('ghost', L('Ubah KPI', 'Edit KPI'), 'edit', { go: 'KPI-EDT-001', rec: k.code }) : '') + ((isOwner || can('kpi.edit')) && !isR2 ? A.btn('ghost', L('Input Manual', 'Manual Input'), 'database', { act: 'manual' }) : '')) +
        tiles([
          tile({ k: L('Aktual', 'Actual'), v: fv(l.actual, k.unit), s: k.src === 'manual' ? A.chip('appr', L('Input Manual', 'Manual Input'), 'edit') : t(P.SRC[k.src] || '') }),
          tile({ k: L('Target', 'Target'), v: k.dir === 'range' ? fv(k.lo, k.unit) + '–' + fv(k.hi, k.unit) : fv(k.target, k.unit), s: t(P.DIRS[k.dir]) + (k.stretch != null ? ' · stretch ' + fv(k.stretch, k.unit) : '') }),
          tile({ k: L('Pencapaian', 'Achievement'), v: pct(l.ach), s: 'Floor ' + (P.floorOf(k) == null ? '—' : P.floorOf(k) + '%') + ' · Cap ' + (k.cap || 100) + '%' }),
          tile({ k: L('Skor', 'Score'), ring: l.pts, s: stc(l.st) }),
          tile({ k: L('Bobot · weighted', 'Weight · weighted'), v: pct(k.weight, 0) + ' · ' + fmt.num(l.ws, 2), s: t(P.PRI[k.pri].n) })
        ], 'tls5-5') +
        (k.manual ? note(t(L('Input manual oleh ', 'Manual input by ')) + esc(emp(k.manual.by)) + ' · ' + t(k.manual.reason) + (k.manual.ev ? ' · ' + t(L('bukti ', 'evidence ')) + esc(k.manual.ev) : ''), 'edit', 'warn') : '') +
        '<div class="grid2">' + card(isR2 ? L('Tren mingguan', 'Weekly trend') : L('Tren 6 bulan', '6-month trend'), A.lineChart([{ n: k.n, v: hist.map(function (v) { return v == null ? 0 : +v; }) }], labels, { h: 190, target: k.dir === 'range' ? null : k.target, fmt: function (v) { return fv(v, k.unit); }, fmtAx: function (v) { return T(k.unit) === 'Rp' ? fmt.num(v / 1e6, 0) : fmt.num(v, Math.abs(v) < 10 ? 1 : 0); }, min: Math.min.apply(null, hist.filter(function (v) { return v != null; }).concat([k.target])) * 0.96, label: T(k.n) }), { icon: 'trend' }) +
          card(L('Kontrak KPI', 'KPI contract'), kv([[L('Formula', 'Formula'), t(k.formula || k.desc)], [L('Agregasi', 'Aggregation'), t(P.AGG[k.agg] ? P.AGG[k.agg].n : k.agg)], [L('Sumber', 'Source'), t(P.SRC[k.src] || k.src)], [L('Bukti', 'Evidence'), t(k.evid)], ['Owner', lnk('PERF-USR-001', k.owner, esc(emp(k.owner)))], ['Reviewer · Approver', esc(emp(k.reviewer)) + ' · ' + esc(emp(k.approver))], [L('Berlaku', 'Effective'), (k.eff ? dt(k.eff) : '—') + ' · v' + k.v + ' · ' + T(P.LIFE[k.status].n)], goal ? ['Goal', lnk('GOL-DTL-001', goal.id, t(goal.n))] : null, k.parent ? [L('KPI induk', 'Parent KPI'), lnk('KPI-DTL-001', k.parent, esc(k.parent))] : null]), { icon: 'filecheck' }) + '</div>' +
        card(L('Drill-down', 'Drill-down'), drill([
          dimK ? { go: 'EXE-PIL-001', rec: dimK.pillar, i: dimK.icon, l: L('Pilar', 'Pillar'), s: T(dimK.n) } : { go: 'R2RE-001', i: 'clipboard', l: 'R2RE', s: 'W40' },
          { i: 'chart', l: 'KPI', s: k.code }, teams[0] ? { go: 'TEAM-DTL-001', rec: teams[0].k, i: 'users', l: L('Tim', 'Team'), s: T(teams[0].n) } : null,
          { go: 'PERF-USR-001', rec: teams[0] ? teams[0].lead : k.owner, i: 'user', l: L('User', 'User'), s: emp(teams[0] ? teams[0].lead : k.owner) },
          { go: 'RACE-DLY-001', q: teams[0] ? { team: teams[0].k } : null, i: 'zap', l: 'Race', s: races[0] ? T(races[0].n) : 'Daily Race' }, { go: races[0] ? 'RACE-DLY-001' : null, q: { ev: '1' }, i: 'filecheck', l: L('Bukti', 'Evidence'), s: T(P.SRC[k.src] || '') }
        ].filter(Boolean)), { icon: 'route' }) +
        (teams.length ? card(L('Tim yang berkontribusi', 'Contributing teams'), '<div class="tms5">' + teams.map(function (tm) { return '<a class="tm5" href="' + href('TEAM-DTL-001', tm.k) + '">' + ring(tm.score, { size: 52 }) + '<span><b>' + t(tm.n) + '</b><small>' + tm.members.length + ' ' + t(L('anggota', 'members')) + ' · Lead ' + esc(emp(tm.lead)) + '</small></span></a>'; }).join('') + '</div>', { icon: 'users' }) : '') +
        (races.length && A.P5.raceCard ? card(L('Race terkait', 'Related races'), '<div class="rc5s">' + races.map(A.P5.raceCard).join('') + '</div>', { icon: 'zap' }) : '');
    },
    act: {
      manual: function () {
        var c = cx(), k = P.kpi(A.S.rec);
        dlg({ title: L('Input manual KPI', 'Manual KPI input'), sub: t(L('Data transaksi tetap diutamakan. Input manual diberi label, wajib alasan atau bukti, dan tercatat di audit.', 'Transaction data always comes first. Manual input is labelled, needs a reason or evidence, and is audited.')),
          body: fld(T(L('Nilai aktual', 'Actual value')) + ' (' + T(k.unit) + ')', inp('v', k.actual, { num: true }), { req: true }) + fld(L('Alasan', 'Reason'), area('reason', ''), { wide: true }) + fld(L('Bukti (nama file / nomor dokumen)', 'Evidence (file name / document no.)'), inp('ev', '')), ok: L('Simpan Input', 'Save Input'),
          onOk: function (v) { var n = num(v.v); if (n == null || isNaN(n)) return P.MSG.invalid; var r = P.manualInput(c, k.code, n, v.reason, v.ev); if (!r.ok) return r.msg; after(L('Input manual disimpan dan diberi label.', 'Manual input saved and labelled.')); return true; } });
      }
    }
  };

  /* ================= NP-05 · XSC-001 XScore (Ambidex) ================= */
  var XPER = [['30d', '30D'], ['q', L('Kuartal', 'Quarter')], ['6m', '6M'], ['12m', '12M']];
  V['XSC-001'] = {
    render: function (c) {
      var per = c.q.p || '30d', x = P.xscore(per === '30d' ? null : per), bands = P.cfg().bands, gx = x.groups;
      var hist12 = x.hist12, labels12 = ['Okt', 'Nov', 'Des', 'Jan', 'Feb', 'Mar'].map(function (m, i) { return A.S.lang === 'en' ? ['Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'][i] : m; }).concat(months());
      var dims = '<div class="dims5">' + x.dims.map(function (d) {
        var lines = P.lines(d.sc), weak = lines.slice().sort(function (a, b) { return a.pts - b.pts; })[0], h = P.dimHist(d.k);
        return '<article class="dim5"><div class="dim5-h"><span class="pl5-ic">' + ic(d.icon) + '</span><b>' + t(d.n) + '</b>' + A.chip(d.g === 'explore' ? 'appr' : 'info', d.g === 'explore' ? L('Eksplorasi', 'Exploration') : L('Eksploitasi', 'Exploitation')) + '</div>' +
          '<div class="pl5-m">' + ring(d.score, { size: 60, label: d.n }) + '<span class="pl5-b">' + bandc(P.band(d.score)) + '<small>' + t(L('Bobot ', 'Weight ')) + d.w + '% · ' + t(L('efektif ', 'effective ')) + fmt.num(d.eff, 2) + '%</small><span>' + delta(h[5] - h[4]) + '</span></span>' + spark(h, { w: 70, h: 26 }) + '</div>' +
          '<ul class="pl5-i">' + lines.slice(0, 3).map(function (l) { return '<li>' + dot(l.st) + '<span>' + lnk('KPI-DTL-001', l.k.code, t(l.k.n)) + '</span><b class="num">' + pct(l.ach, 0) + '</b></li>'; }).join('') + '</ul>' +
          (weak ? '<p class="pl5-t">' + ic('target') + '<span>' + t(L('Fokus: ', 'Focus: ')) + lnk('KPI-DTL-001', weak.k.code, t(weak.k.n)) + '</span></p>' : '') + '</article>';
      }).join('') + '</div>';
      return A.pageHead(null, t(L('Satu skor kinerja 0–100 dari kerangka KPI Ambidex: menjalankan bisnis hari ini dan membangun masa depan.', 'One 0–100 performance score from the Ambidex KPI framework: running today\'s business and building the future.')), tabs(XPER, per, 'p', { seg: true, def: '30d', label: L('Periode', 'Period') }) + A.pbtn('xscore.config', 'ghost', L('Atur Bobot', 'Configure Weights'), 'cog', { act: 'cfg' })) +
        '<div class="grid2 g5-hero">' + card('XScore', '<div class="hero5">' + ring(x.score, { size: 132, label: 'XScore' }) + '<div>' + bandc(x.band) + '<p class="hero5-d">' + delta(x.delta) + ' ' + t(L('vs Agustus (skor bulan berjalan)', 'vs August (current month score)')) + '</p>' +
          kv([[L('Periode', 'Period'), t(by(XPER.map(function (p) { return { k: p[0], l: p[1] }; }), 'k', per).l)], [L('Skor bulan ini', 'This month'), sc1(x.now)], [L('Bobot dimensi', 'Dimension weights'), x.dimCheck.ok ? A.chip('ok', L('100%', '100%')) : A.chip('crit', x.dimCheck.msg)]]) + '</div></div>', { icon: 'gauge' }) +
          card('Ambidex', '<div class="amb5"><div class="amb5-bar" role="img" aria-label="' + esc(T(L('Eksploitasi ', 'Exploitation ')) + gx.exploit.w + '% · ' + T(L('Eksplorasi ', 'Exploration ')) + gx.explore.w + '%') + '"><i style="width:' + gx.exploit.w + '%"></i><i class="ex" style="width:' + gx.explore.w + '%"></i></div>' +
            '<div class="amb5-g"><div><b>' + t(L('Eksploitasi', 'Exploitation')) + ' · ' + gx.exploit.w + '%</b><span class="num">' + sc1(gx.exploit.score) + '</span><small>' + t(L('Menjalankan bisnis hari ini: keuangan, operasional, klien, kualitas, people.', 'Running today\'s business: financial, operations, client, quality, people.')) + '</small></div>' +
            '<div><b>' + t(L('Eksplorasi', 'Exploration')) + ' · ' + gx.explore.w + '%</b><span class="num">' + sc1(gx.explore.score) + '</span><small>' + t(L('Membangun masa depan: inovasi, otomasi, keberlanjutan, layanan baru.', 'Building the future: innovation, automation, sustainability, new services.')) + '</small></div></div></div>' +
            note(t(L('Bobot efektif = bobot grup × bobot dimensi ÷ total bobot dimensi di grupnya.', 'Effective weight = group weight × dimension weight ÷ total dimension weight in its group.')), 'percent'), { icon: 'scale' }) + '</div>' +
        card(L('Dimensi XScore', 'XScore dimensions'), dims, { icon: 'layers' }) +
        '<div class="grid2">' + card(L('Tren 12 bulan', '12-month trend'), A.lineChart([{ n: 'XScore', v: hist12 }], labels12, { h: 200, min: 50, max: 100, label: 'XScore' }), { icon: 'trend' }) +
          card(L('Band status', 'Status bands'), '<ol class="bands5">' + bands.map(function (b, i) { var hi = i ? bands[i - 1].min - 1 : 100; return '<li class="t-' + b.tone + (b.k === x.band.k ? ' on' : '') + '"><b class="num">' + (i === bands.length - 1 ? '< ' + bands[i - 1].min : b.min + '–' + hi) + '</b><span>' + t(b.n) + '</span></li>'; }).join('') + '</ol>' + note(t(L('Band dapat diatur oleh pemegang izin konfigurasi XScore.', 'Bands can be configured by holders of the XScore configuration permission.')), 'cog') + A.pbtn('xscore.config', 'ghost', L('Atur Band', 'Configure Bands'), 'edit', { act: 'bands' }), { icon: 'list' }) + '</div>';
    },
    act: {
      cfg: function () {
        var c = cx(), cf = P.cfg();
        dlg({ title: L('Bobot XScore & Ambidex', 'XScore & Ambidex weights'), sub: t(L('Total grup dan total dimensi masing-masing wajib tepat 100%.', 'Group total and dimension total must each be exactly 100%.')),
          body: '<div class="fg5">' + fld(L('Eksploitasi (%)', 'Exploitation (%)'), inp('exploit', cf.ambidex.exploit, { num: true })) + fld(L('Eksplorasi (%)', 'Exploration (%)'), inp('explore', cf.ambidex.explore, { num: true })) +
            D.XDIMS.map(function (d) { var x = by(cf.dims, 'k', d.k); return fld(T(d.n) + ' (%)', inp('d_' + d.k, x.w, { num: true })); }).join('') + '</div><div id="xprev"></div>',
          after: function (el) {
            function upd() { var v = function (n) { return num(el.querySelector('[name="' + n + '"]').value) || 0; }; el.querySelector('#xprev').innerHTML = weightMsg(P.validateWeights([v('exploit'), v('explore')])) + weightMsg(P.validateWeights(D.XDIMS.map(function (d) { return v('d_' + d.k); }))); }
            el.addEventListener('input', upd); upd();
          },
          onOk: function (v) { var r = P.setAmbidex(c, num(v.exploit), num(v.explore), D.XDIMS.map(function (d) { return { k: d.k, w: num(v['d_' + d.k]) }; })); if (!r.ok) return r.msg; after(L('Bobot XScore disimpan dan dicatat di audit.', 'XScore weights saved and logged in the audit.')); return true; } });
      },
      bands: function () {
        var c = cx(), b = P.cfg().bands;
        dlg({ title: L('Band status XScore', 'XScore status bands'), sub: t(L('Isi batas bawah tiap band dari atas ke bawah. Band terakhir selalu mulai dari 0.', 'Enter each band\'s lower bound from top to bottom. The last band always starts at 0.')),
          body: '<div class="fg5">' + b.map(function (x, i) { return fld(x.n, inp('b' + i, x.min, { num: true, ro: i === b.length - 1 })); }).join('') + '</div>', ok: L('Simpan Band', 'Save Bands'),
          onOk: function (v) { var nb = b.map(function (x, i) { return Object.assign({}, x, { min: num(v['b' + i]) }); }); var r = P.setBands(c, nb); if (!r.ok) return r.msg; after(L('Band status disimpan.', 'Status bands saved.')); return true; } });
      }
    }
  };
})();
