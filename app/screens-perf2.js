/* JFRESH OS — Phase 5 screens (part 2): NP-06 Teamwork Score, NP-07 Personal Score &
   HR Performance, NP-08 Daily / Weekly Race & R2RE, NP-09 Monthly Reflection & Strategy,
   NP-10 Decision Intelligence & Executive Reporting. Helpers come from screens-perf.js. */
(function () {
  var A = window.JFAPP, X = window.JFACCESS, P = window.JFPERF, H = A && A.P5;
  if (!A || !P || !H) return;
  var V = A.V, D = P.D;
  var T = A.T, L = A.L, t = A.t, esc = A.esc, ic = A.ic, can = A.can, fmt = A.fmt, href = A.href;
  var cx = H.cx, open = H.open, lnk = H.lnk, by = H.by, sum = H.sum, sc1 = H.sc1, pct = H.pct, fv = H.fv, rpj = H.rpj, dt = H.dt, dtt = H.dtt, emp = H.emp, stc = H.stc, bandc = H.bandc, sevc = H.sevc, trendc = H.trendc;
  var dot = H.dot, bar = H.bar, delta = H.delta, ring = H.ring, spark = H.spark, qhref = H.qhref, tabs = H.tabs, after = H.after, card = H.card, kv = H.kv, note = H.note, tile = H.tile, tiles = H.tiles;
  var peopleOpts = H.peopleOpts, dlg = H.dlg, fld = H.fld, inp = H.inp, sel = H.sel, area = H.area, num = H.num, download = H.download, drill = H.drill, kpiList = H.kpiList, weightMsg = H.weightMsg, months = H.months;
  function initials(n) { return String(n).split(' ').map(function (w) { return w.charAt(0); }).slice(0, 2).join(''); }
  function person(id) { return by(D.PEOPLE, 'id', id); }
  var EMP_ST = { tetap: ['ok', L('Tetap', 'Permanent')], kontrak: ['info', L('Kontrak', 'Contract')], probation: ['warn', L('Probation', 'Probation')] };
  function empSt(s) { var x = EMP_ST[s] || EMP_ST.tetap; return A.chip(x[0], x[1]); }
  var M12 = ['2025-10', '2025-11', '2025-12', '2026-01', '2026-02', '2026-03', '2026-04', '2026-05', '2026-06', '2026-07', '2026-08', '2026-09'];
  function teamName(k) { var tm = by(D.TEAMS, 'k', k); return tm ? tm.n : k; }

  /* ================= NP-06 · TEAM-001 Teamwork Score ================= */
  V['TEAM-001'] = {
    render: function () {
      var teams = P.teams().slice().sort(function (a, b) { return b.score - a.score; }), avg = Math.round(sum(teams.map(function (x) { return x.score; })) / teams.length * 10) / 10;
      var low = teams[teams.length - 1];
      return A.pageHead(null, t(L('Skor tim dihitung dari KPI bersama tim, bukan rata-rata skor anggota.', 'Team score comes from shared team KPIs, not an average of member scores.'))) +
        tiles([tile({ k: L('Rata-rata Teamwork Score', 'Average Teamwork Score'), ring: avg }), tile({ k: L('Tim', 'Teams'), v: teams.length, s: teams.filter(function (x) { return x.score >= 85; }).length + ' ' + t(L('tim healthy ke atas', 'teams healthy or better')) }),
          tile({ k: L('Tim terbaik', 'Top team'), v: t(teams[0].n), s: sc1(teams[0].score) + ' · ' + T(teams[0].band.n), href: href('TEAM-DTL-001', teams[0].k), tone: 'ok' }), tile({ k: L('Perlu perhatian', 'Needs attention'), v: t(low.n), s: sc1(low.score) + ' · ' + T(low.band.n), href: href('TEAM-DTL-001', low.k), tone: low.band.tone })], 'tls5-4') +
        card(L('Skor tim', 'Team scores'), '<div class="tcs5">' + teams.map(function (tm) {
          var mAvg = P.memberAvg(tm.k);
          return '<a class="tc5" href="' + href('TEAM-DTL-001', tm.k) + '"><div class="tc5-h"><b>' + t(tm.n) + '</b>' + bandc(tm.band) + '</div><div class="pl5-m">' + ring(tm.score, { size: 64, label: tm.n }) + '<span class="pl5-b"><span>' + delta(tm.delta) + ' <small>' + t(L('vs Agu', 'vs Aug')) + '</small></span><small>Lead ' + esc(emp(tm.lead)) + '</small><small>' + tm.members.length + ' ' + t(L('anggota', 'members')) + '</small></span>' + spark(tm.trend, { w: 70, h: 26 }) + '</div>' +
            '<p class="tc5-c">' + t(L('Rata-rata anggota ', 'Member average ')) + '<b class="num">' + sc1(mAvg) + '</b> · ' + t(L('KPI tim ', 'Team KPIs ')) + tm.lines.length + '</p></a>';
        }).join('') + '</div>' + note(t(L('Teamwork Score = Σ (skor KPI tim × bobot). Kontribusi anggota ditampilkan terpisah di detail tim.', 'Teamwork Score = Σ (team KPI score × weight). Member contribution is shown separately in the team detail.')), 'info'), { icon: 'users' });
    }
  };

  /* ================= NP-06 · TEAM-DTL-001 Team detail ================= */
  V['TEAM-DTL-001'] = {
    title: function (rec) { var tm = by(D.TEAMS, 'k', rec); return tm ? tm.n : L('Detail Tim', 'Team Detail'); },
    render: function (c) {
      var tm = P.team(c.rec);
      if (!tm) return A.stateCard('empty', P.MSG.notfound, A.btn('blue', 'Teamwork Score', 'arrowl', { go: 'TEAM-001' }));
      var check = P.validateWeights(tm.lines.map(function (l) { return l.k.weight; })), members = tm.members.map(function (m) { return P.person(m); }).filter(Boolean);
      var races = P.state().daily.filter(function (r) { return r.team === tm.k; }), weak = tm.lines.slice().sort(function (a, b) { return a.pts - b.pts; })[0], c0 = cx();
      var cols = [
        { h: 'KPI', v: function (l) { return '<b>' + t(l.k.n) + '</b><small class="sub5">' + esc(l.k.code) + (l.k.parent ? ' · ' + t(L('mendukung ', 'supports ')) + esc(l.k.parent) : '') + '</small>'; } },
        { h: L('Bobot', 'Weight'), cls: 'r num', v: function (l) { return pct(l.k.weight, 0); } },
        { h: L('Target', 'Target'), cls: 'r num', v: function (l) { return l.k.dir === 'range' ? fv(l.k.lo, l.k.unit) + '–' + fv(l.k.hi, l.k.unit) : l.k.dir === 'binary' ? t(L('Ya', 'Yes')) : fv(l.k.target, l.k.unit); } },
        { h: L('Aktual', 'Actual'), cls: 'r num', v: function (l) { return '<b>' + (l.k.dir === 'binary' ? (l.actual ? t(L('Ya', 'Yes')) : t(L('Tidak', 'No'))) : fv(l.actual, l.k.unit)) + '</b>'; } },
        { h: L('Pencapaian', 'Achievement'), cls: 'r num', v: function (l) { return pct(l.ach); } }, { h: 'Weighted', cls: 'r num', v: function (l) { return fmt.num(l.ws, 2); } },
        { h: L('Status', 'Status'), v: function (l) { return stc(l.st); } }
      ];
      return A.pageHead(null, t(L('Lead ', 'Lead ')) + esc(emp(tm.lead)) + ' · Reviewer ' + esc(emp(tm.reviewer)) + ' · ' + tm.members.length + ' ' + t(L('anggota', 'members'))) +
        '<div class="grid2 g5-hero">' + card('Teamwork Score', '<div class="hero5">' + ring(tm.score, { size: 116, label: tm.n }) + '<div>' + bandc(tm.band) + '<p class="hero5-d">' + delta(tm.delta) + ' ' + t(L('vs Agustus', 'vs August')) + '</p>' + weightMsg(check) + '</div></div>' +
          A.lineChart([{ n: 'Teamwork Score', v: tm.trend }], months(), { h: 160, min: Math.floor(Math.min.apply(null, tm.trend) - 5), max: 100, label: 'Teamwork Score' }), { icon: 'users' }) +
          card(L('Tim ≠ rata-rata anggota', 'Team ≠ member average'), kv([['Teamwork Score', '<b>' + sc1(tm.score) + '</b>'], [L('Rata-rata Personal Score anggota', 'Member Personal Score average'), sc1(P.memberAvg(tm.k))], [L('Rata-rata kontribusi anggota', 'Member contribution average'), sc1(sum(members.map(function (m) { return m.contrib; })) / (members.length || 1))]]) +
            note(t(L('Skor tim berasal dari hasil KPI bersama. Kontribusi anggota dicatat terpisah dan masuk ke Personal Score lewat porsi tim.', 'The team score comes from shared KPI results. Member contribution is recorded separately and feeds Personal Score through the team share.')), 'info') +
            (weak ? note(t(L('Fokus minggu ini: ', 'Focus this week: ')) + t(weak.k.n) + ' (' + pct(weak.ach) + ')', 'target', weak.st === 'on' ? 'ok' : 'warn') : ''), { icon: 'scale' }) + '</div>' +
        card(L('Scorecard tim', 'Team scorecard'), A.list(tm.lines, cols, function (l) { return { t: t(l.k.n), r: pct(l.ach), s: pct(l.k.weight, 0) + ' · ' + fv(l.actual, l.k.unit) + ' / ' + fv(l.k.target, l.k.unit), chip: stc(l.st) }; }, function (l) { return l.k.parent && P.kpi(l.k.parent) && open('KPI-DTL-001') ? href('KPI-DTL-001', l.k.parent) : null; }, { dense: true }), { icon: 'list' }) +
        card(L('Kontribusi anggota', 'Member contribution'), A.list(members, [
          { h: L('Anggota', 'Member'), v: function (m) { return '<span class="who5"><span class="av sm">' + esc(initials(m.n)) + '</span><span><b>' + esc(m.n) + '</b><small class="sub5">' + t(m.title) + '</small></span></span>'; } },
          { h: L('Kontribusi', 'Contribution'), cls: 'r num', v: function (m) { return sc1(m.contrib); } }, { h: 'Personal Score', cls: 'r num', v: function (m) { return '<b>' + sc1(m.score) + '</b>'; } },
          { h: L('Status', 'Status'), v: function (m) { return bandc(m.band); } }, { h: L('Tren', 'Trend'), v: function (m) { return trendc(m.trend); } }
        ], function (m) { return { t: esc(m.n), r: sc1(m.score), s: t(L('Kontribusi ', 'Contribution ')) + sc1(m.contrib) + ' · ' + t(m.title), chip: bandc(m.band) }; }, function (m) { return open('PERF-USR-001') && P.canSeePerson(c0, m.id) ? href('PERF-USR-001', m.id) : null; }, { dense: true }), { icon: 'user', count: members.length }) +
        (races.length ? card(L('Race tim hari ini', 'Team races today'), '<div class="rc5s">' + races.map(function (r) { return raceCard(r); }).join('') + '</div>', { icon: 'zap', count: races.length }) : '') +
        card(L('Drill-down', 'Drill-down'), drill([{ go: 'TEAM-001', i: 'users', l: L('Tim', 'Team'), s: T(tm.n) }, weak ? { go: weak.k.parent ? 'KPI-DTL-001' : null, rec: weak.k.parent, i: 'chart', l: 'KPI', s: T(weak.k.n) } : null, { i: 'clock', l: L('Shift', 'Shift'), s: T(L('Pagi · Malam', 'Day · Night')) }, { go: 'PERF-USR-001', rec: tm.lead, i: 'user', l: L('Anggota', 'Member'), s: emp(tm.lead) }, { go: 'RACE-DLY-001', q: { team: tm.k }, i: 'zap', l: 'Race', s: races[0] ? T(races[0].n) : 'Daily Race' }, { go: 'RACE-DLY-001', q: { team: tm.k, ev: '1' }, i: 'filecheck', l: L('Bukti', 'Evidence') }].filter(Boolean)), { icon: 'route' });
    },
    act: { 'race-upd': raceUpdAct }
  };

  /* ================= NP-07 · Personal Score ================= */
  function kpiRows(p, simple) {
    return '<ul class="pk5">' + p.lines.map(function (l) {
      var tone = P.ST[l.st].tone;
      return '<li><div class="pk5-h"><b>' + t(l.k.n) + '</b><span class="num">' + fv(l.actual, l.k.unit) + ' <small>/ ' + (l.k.dir === 'binary' ? t(L('Ya', 'Yes')) : fv(l.k.target, l.k.unit)) + '</small></span></div>' + bar(Math.min(100, l.ach || 0), tone) +
        '<div class="pk5-s">' + stc(l.st) + (simple ? '' : '<small>' + t(L('Bobot ', 'Weight ')) + l.k.weight + '% · ' + t(L('skor ', 'score ')) + sc1(l.pts) + '</small>') + '</div></li>';
    }).join('') + '</ul>';
  }
  V['PERF-001'] = {
    render: function () {
      var c = cx(), id = c && c.employee && c.employee.id, p = id ? P.person(id) : null;
      if (!p) return A.pageHead() + A.stateCard('empty', L('Belum ada scorecard pribadi untuk akun ini.', 'There is no personal scorecard for this account yet.'), A.btn('blue', L('Beranda', 'Home'), 'arrowl', { go: c ? c.landing : A.R().nav[0].s }));
      var mine = P.daily(c, 'mine'), tm = P.team(p.team);
      return A.pageHead(null, esc(p.n) + ' · ' + t(p.title)) +
        '<section class="me5"><div class="me5-r">' + ring(p.score, { size: 132, label: L('Skor Saya', 'My Score') }) + '</div><div class="me5-t"><small>' + t(L('Skor Saya bulan ini', 'My score this month')) + '</small>' + bandc(p.band) +
          '<p>' + delta(p.delta) + ' ' + t(L('dibanding bulan lalu', 'compared with last month')) + '</p><p class="me5-f">' + t(L('KPI saya ', 'My KPIs ')) + p.f.ind + '% · ' + t(L('kontribusi tim ', 'team contribution ')) + p.f.team + '%</p></div></section>' +
        card(L('Target hari ini', 'Today\'s targets'), mine.length ? '<div class="rc5s">' + mine.map(function (r) { return raceCard(r, { upd: true, simple: true }); }).join('') + '</div>' : A.empty(L('Tidak ada race untuk Anda hari ini.', 'No race for you today.')), { icon: 'zap', count: mine.length }) +
        card(L('KPI saya', 'My KPIs'), kpiRows(p, true), { icon: 'target' }) +
        '<div class="grid2">' + card(L('Tim saya', 'My team'), '<div class="hero5">' + ring(tm.score, { size: 72, label: tm.n }) + '<div><b>' + t(tm.n) + '</b><br>' + bandc(tm.band) + '<p class="hero5-d">' + t(L('Kontribusi saya ', 'My contribution ')) + '<b class="num">' + sc1(p.contrib) + '</b></p></div></div>', { icon: 'users' }) +
          card(L('Ringkasan', 'Summary'), '<ul class="sw5"><li class="ok">' + ic('star') + '<span><small>' + t(L('Paling kuat', 'Strongest')) + '</small><b>' + t(p.strength.k.n) + '</b></span></li><li class="warn">' + ic('target') + '<span><small>' + t(L('Perlu ditingkatkan', 'To improve')) + '</small><b>' + t(p.attention.k.n) + '</b></span></li></ul>', { icon: 'sparkles' }) + '</div>';
    },
    act: { 'race-upd': raceUpdAct }
  };

  V['PERF-HR-001'] = {
    render: function (c) {
      var c0 = cx(), all = P.people().filter(function (p) { return P.canSeePerson(c0, p.id); });
      var defs = [
        { k: 'team', l: L('Tim', 'Team'), opts: D.TEAMS.map(function (x) { return [x.k, x.n]; }), fn: function (p, v) { return p.team === v; } },
        { k: 'role', l: L('Peran', 'Role'), opts: Object.keys(D.ROLE_KPIS).map(function (r) { return [r, D.ROLE_KPIS[r].n]; }), fn: function (p, v) { return p.role === v; } },
        { k: 'band', l: L('Status', 'Status'), opts: P.cfg().bands.map(function (b) { return [b.k, b.n]; }), fn: function (p, v) { return p.band.k === v; } },
        { k: 'emp', l: L('Status kerja', 'Employment'), opts: Object.keys(EMP_ST).map(function (k) { return [k, EMP_ST[k][1]]; }), fn: function (p, v) { return p.st === v; } }
      ];
      var rows = A.applyFilters(all, defs, function (p) { return p.n + ' ' + p.id; }).sort(function (a, b) { return b.score - a.score; });
      var f = P.cfg().personal;
      return A.pageHead(null, t(L('Personal Score sesuai cakupan Anda. Skor membantu keputusan HR, tidak menggantikannya.', 'Personal Score within your scope. Scores support HR decisions and never replace them.'))) +
        tiles([tile({ k: L('Karyawan', 'Employees'), v: all.length }), tile({ k: L('Rata-rata', 'Average'), ring: Math.round(sum(all.map(function (p) { return p.score; })) / (all.length || 1) * 10) / 10 }),
          tile({ k: L('Di bawah 75', 'Below 75'), v: all.filter(function (p) { return p.score < 75; }).length, tone: 'warn' }), tile({ k: 'PIP · Probation', v: all.filter(function (p) { return p.hr.pip; }).length + ' · ' + all.filter(function (p) { return p.st === 'probation'; }).length })], 'tls5-4') +
        A.filters(defs, { search: L('Cari nama atau ID', 'Search name or ID'), force: true }) +
        card(L('Karyawan', 'Employees'), A.list(rows, [
          { h: L('Karyawan', 'Employee'), v: function (p) { return '<span class="who5"><span class="av sm">' + esc(initials(p.n)) + '</span><span><b>' + esc(p.n) + '</b><small class="sub5">' + esc(p.id) + ' · ' + t(p.title) + '</small></span></span>'; } },
          { h: L('Tim', 'Team'), v: function (p) { return t(teamName(p.team)); } }, { h: L('Status kerja', 'Employment'), v: function (p) { return empSt(p.st) + (p.hr.pip ? A.chip('crit', 'PIP') : ''); } },
          { h: 'Personal Score', cls: 'r num', v: function (p) { return '<b>' + sc1(p.score) + '</b>'; } }, { h: L('3 bln', '3 mo'), cls: 'r num', v: function (p) { return sc1(p.avg3); } },
          { h: L('Tren', 'Trend'), v: function (p) { return spark(p.hist.filter(function (x) { return x > 0; }), { w: 70, h: 22 }); } }, { h: L('Status', 'Status'), v: function (p) { return bandc(p.band); } }
        ], function (p) { return { t: esc(p.n), r: sc1(p.score), s: t(teamName(p.team)) + ' · ' + t(p.title), chip: bandc(p.band) }; }, function (p) { return href('PERF-USR-001', p.id); }, { dense: true }), { icon: 'idcard', count: rows.length }) +
        card(L('Formula Personal Score', 'Personal Score formula'), '<ul class="fm5">' + [['def', L('Default', 'Default')], ['drv', 'Driver'], ['spv', 'Supervisor'], ['sales', 'Sales']].map(function (r) { var x = f[r[0]] || f.def; return '<li><b>' + t(r[1]) + '</b><span>' + bar(x.ind, 'info') + '</span><small class="num">' + x.ind + '% KPI · ' + x.team + '% ' + t(L('tim', 'team')) + '</small></li>'; }).join('') + '</ul>' +
          note(t(L('Porsi tim = 50% Teamwork Score + 50% kontribusi anggota.', 'Team share = 50% Teamwork Score + 50% member contribution.')), 'info') + A.pbtn('hr.config', 'ghost', L('Atur Formula', 'Configure Formula'), 'cog', { act: 'formula' }), { icon: 'percent' });
    },
    act: {
      formula: function () {
        var c = cx(), roles = [['def', L('Default (Receiving, QC, Finance, Produksi)', 'Default (Receiving, QC, Finance, Production)')], ['drv', 'Driver'], ['spv', 'Supervisor'], ['sales', 'Sales']];
        dlg({ title: L('Formula Personal Score', 'Personal Score formula'), body: fld(L('Peran', 'Role'), sel('role', roles, 'def')) + '<div class="fg5">' + fld(L('KPI individu (%)', 'Individual KPI (%)'), inp('ind', 70, { num: true })) + fld(L('Kontribusi tim (%)', 'Team contribution (%)'), inp('team', 30, { num: true })) + '</div>',
          after: function (el) { var r = el.querySelector('[name="role"]'); r.onchange = function () { var x = P.formula(r.value); el.querySelector('[name="ind"]').value = x.ind; el.querySelector('[name="team"]').value = x.team; }; },
          onOk: function (v) { var res = P.setFormula(c, v.role, num(v.ind), num(v.team)); if (!res.ok) return res.msg; after(L('Formula disimpan dan dicatat di audit.', 'Formula saved and logged in the audit.')); return true; } });
      }
    }
  };

  var HR_TABS = [['kpi', L('KPI & Skor', 'KPI & Score'), 'target'], ['att', L('Kehadiran', 'Attendance'), 'calendar'], ['coach', 'Coaching', 'users'], ['train', L('Pelatihan', 'Training'), 'idcard'], ['ach', L('Pencapaian', 'Achievement'), 'star'], ['rec', L('Rekognisi', 'Recognition'), 'sparkles'], ['prob', 'Probation', 'clock'], ['pip', 'PIP', 'alert'], ['promo', L('Kesiapan Promosi', 'Promotion Readiness'), 'arrowup'], ['hist', L('Riwayat', 'History'), 'history']];
  var PROMO = { ready: ['ok', L('Siap dipertimbangkan', 'Ready to consider')], '6-12': ['info', L('6–12 bulan', '6–12 months')], notyet: ['mute', L('Belum', 'Not yet')] };
  V['PERF-USR-001'] = {
    title: function (rec) { var p = person(rec); return p ? p.n : L('Profil Kinerja', 'Performance Profile'); },
    render: function (c) {
      var c0 = cx(), p = person(c.rec) ? P.person(c.rec) : null;
      if (!p) return A.stateCard('empty', P.MSG.notfound, A.btn('blue', L('Kembali', 'Back'), 'arrowl', { go: 'PERF-HR-001' }));
      if (!P.canSeePerson(c0, p.id)) return A.stateCard('noperm', L('Karyawan ini di luar cakupan Anda.', 'This employee is outside your scope.'), A.btn('blue', L('Kembali', 'Back'), 'arrowl', { go: 'PERF-HR-001' }));
      var tab = c.q.tab || 'kpi', hr = p.hr, sig = P.hrSignals(p.id), notes = P.hrNotes(p.id), body, tm = P.team(p.team);
      function lst(rows, fn, emptyMsg) { return rows.length ? '<ul class="hr5">' + rows.map(fn).join('') + '</ul>' : A.empty(emptyMsg || L('Belum ada catatan.', 'No records yet.')); }
      if (tab === 'att') { var a = hr.att; body = tiles([tile({ k: L('Hari kerja', 'Working days'), v: a.days }), tile({ k: L('Hadir', 'Present'), v: a.present, s: pct(a.present / a.days * 100) }), tile({ k: L('Terlambat', 'Late'), v: a.late, tone: a.late > 2 ? 'warn' : '' }), tile({ k: L('Absen', 'Absent'), v: a.absent, tone: a.absent ? 'crit' : '' }), tile({ k: L('Cuti', 'Leave'), v: a.leave })], 'tls5-5'); }
      else if (tab === 'coach') body = lst(hr.coaching.concat(notes.filter(function (n) { return n.kind === 'coaching'; }).map(function (n) { return [n.at, n.by, [n.text, n.text], ['', '']]; })), function (x) { return '<li>' + ic('users') + '<span><b>' + t(x[2]) + '</b><small>' + (typeof x[0] === 'number' ? dtt(x[0]) : dt(x[0])) + ' · ' + esc(x[1]) + (T(x[3]) ? ' · ' + t(x[3]) : '') + '</small></span></li>'; });
      else if (tab === 'train') body = lst(hr.training, function (x) { return '<li>' + ic('idcard') + '<span><b>' + t(x[0]) + '</b><small>' + dt(x[1]) + ' · ' + x[3] + t(L(' jam', ' h')) + '</small></span>' + A.chip(x[2] === 'done' ? 'ok' : 'info', x[2] === 'done' ? L('Selesai', 'Done') : L('Dijadwalkan', 'Planned')) + '</li>'; });
      else if (tab === 'ach') body = lst(hr.achievement, function (x) { return '<li>' + ic('star') + '<span><b>' + t(x[0]) + '</b><small>' + dt(x[1]) + '</small></span></li>'; });
      else if (tab === 'rec') body = lst(hr.recognition.concat(notes.filter(function (n) { return n.kind === 'recognition'; }).map(function (n) { return [[n.text, n.text], null, n.by, n.at]; })), function (x) { return '<li>' + ic('sparkles') + '<span><b>' + t(x[0]) + '</b><small>' + (x[1] ? dt(x[1]) : dtt(x[3])) + ' · ' + esc(x[2]) + '</small></span></li>'; });
      else if (tab === 'prob') body = kv([[L('Status', 'Status'), hr.probation.st === 'ongoing' ? A.chip('warn', L('Berjalan', 'Ongoing')) : A.chip('ok', L('Lulus', 'Passed'))], [L('Berakhir', 'Ends'), hr.probation.end ? dt(hr.probation.end) : '—'], [L('Bergabung', 'Joined'), dt(p.join)]]);
      else if (tab === 'pip') body = hr.pip ? kv([[L('Mulai', 'Start'), dt(hr.pip.start)], [L('Selesai', 'End'), dt(hr.pip.end)], [L('Ditetapkan oleh', 'Set by'), esc(hr.pip.by)], [L('Sasaran', 'Goals'), hr.pip.goals.map(function (g) { return t(g); }).join('<br>')]]) + note(t(L('PIP ditetapkan oleh atasan dan HR, bukan oleh sistem.', 'A PIP is set by the manager and HR, never by the system.')), 'shield') : A.empty(L('Tidak dalam PIP.', 'Not on a PIP.'));
      else if (tab === 'promo') { var pr = PROMO[hr.promo.k] || PROMO.notyet; body = kv([[L('Kesiapan', 'Readiness'), A.chip(pr[0], pr[1])], [L('Catatan', 'Note'), t(hr.promo.note)], [L('Rata-rata 6 bulan', '6-month average'), sc1(p.avg6)]]) + note(t(P.HR_RULE), 'shield'); }
      else if (tab === 'hist') body = A.lineChart([{ n: 'Personal Score', v: p.hist.map(function (x) { return x || null; }).filter(function (x) { return x != null; }) }], M12.filter(function (m, i) { return p.hist[i] > 0; }).map(function (m) { return H.mon(m); }), { h: 200, min: 40, max: 100, label: 'Personal Score' }) +
        lst(notes, function (n) { return '<li>' + ic('edit') + '<span><b>' + t(P.HR_NOTE_KINDS[n.kind]) + ': ' + esc(n.text) + '</b><small>' + dtt(n.at) + ' · ' + esc(n.by) + '</small></span></li>'; }, L('Belum ada catatan HR baru.', 'No new HR notes.'));
      else body = '<div class="grid2">' + card(T(L('KPI peran ', 'Role KPIs ')) + T(p.roleN), kpiRows(p, false), { icon: 'target' }) + card(L('Perhitungan skor', 'Score calculation'), kv([[L('Skor KPI individu', 'Individual KPI score'), sc1(p.ind) + ' × ' + p.f.ind + '%'], [L('Porsi tim', 'Team share'), sc1(p.teamPart) + ' × ' + p.f.team + '%'], ['Teamwork Score ' + T(tm.n), lnk('TEAM-DTL-001', tm.k, sc1(p.teamScore))], [L('Kontribusi anggota', 'Member contribution'), sc1(p.contrib)], ['Personal Score', '<b>' + sc1(p.score) + '</b>']]) +
        note(t(L('Personal Score = KPI individu × ' + p.f.ind + '% + (50% Teamwork Score + 50% kontribusi) × ' + p.f.team + '%.', 'Personal Score = individual KPI × ' + p.f.ind + '% + (50% Teamwork Score + 50% contribution) × ' + p.f.team + '%.')), 'percent'), { icon: 'percent' }) + '</div>';
      var profile = '<section class="pf5"><span class="pf5-av" aria-hidden="true">' + esc(initials(p.n)) + '</span><div class="pf5-t"><b>' + esc(p.n) + '</b><small>' + esc(p.id) + ' · ' + t(p.title) + '</small><span>' + t(teamName(p.team)) + ' · ' + esc(P.D && X ? T(X.plantName(p.plant)) : p.plant) + ' · ' + empSt(p.st) + (hr.pip ? A.chip('crit', 'PIP') : '') + '</span></div>' +
        '<div class="pf5-s">' + ring(p.score, { size: 96, label: 'Personal Score' }) + '<span>' + bandc(p.band) + delta(p.delta) + '</span></div></section>';
      return A.pageHead(null, t(L('Profil kinerja dan HR', 'Performance & HR profile')), A.pbtn('hr.manage', 'ghost', L('Tambah Catatan HR', 'Add HR Note'), 'plus', { act: 'note' })) + profile +
        tiles([tile({ k: L('Skor kini', 'Current'), v: sc1(p.score) }), tile({ k: L('Rata-rata 3 bulan', '3-month avg'), v: sc1(p.avg3) }), tile({ k: L('Rata-rata 6 bulan', '6-month avg'), v: sc1(p.avg6) }), tile({ k: L('Tren 12 bulan', '12-month trend'), v: '', s: trendc(p.trend), spark: spark(p.hist.filter(function (x) { return x > 0; }), { w: 120, h: 30 }) })], 'tls5-4') +
        '<div class="grid2">' + card(L('Ringkasan kinerja', 'Performance summary'), '<ul class="sw5"><li class="ok">' + ic('star') + '<span><small>' + t(L('Kekuatan', 'Strength')) + '</small><b>' + t(p.strength.k.n) + ' · ' + pct(p.strength.ach) + '</b></span></li><li class="warn">' + ic('target') + '<span><small>' + t(L('Perlu perhatian', 'Needs attention')) + '</small><b>' + t(p.attention.k.n) + ' · ' + pct(p.attention.ach) + '</b></span></li><li class="info">' + ic('trend') + '<span><small>' + t(L('Perubahan 3 bulan', '3-month change')) + '</small><b>' + delta(p.improve) + '</b></span></li></ul>', { icon: 'sparkles' }) +
          card(L('Rekomendasi (keputusan tetap di manusia)', 'Recommendations (people decide)'), (sig.length ? '<ul class="sig5">' + sig.map(function (s) { return '<li>' + ic('bulb') + '<span><b>' + t(s.t) + '</b><small>' + t(s.why) + '</small></span></li>'; }).join('') + '</ul>' : A.empty(L('Tidak ada sinyal khusus.', 'No specific signals.'))) + note(t(P.HR_RULE), 'shield'), { icon: 'bulb' }) + '</div>' +
        tabs(HR_TABS, tab, 'tab', { def: 'kpi', label: L('Tab HR', 'HR tabs') }) + card(by(HR_TABS.map(function (x) { return { k: x[0], l: x[1] }; }), 'k', tab).l, body, { icon: by(HR_TABS.map(function (x) { return { k: x[0], i: x[2] }; }), 'k', tab).i });
    },
    act: {
      note: function () {
        var c = cx(), id = A.S.rec;
        dlg({ title: L('Tambah catatan HR', 'Add HR note'), sub: esc(emp(id)), body: fld(L('Jenis', 'Kind'), sel('kind', Object.keys(P.HR_NOTE_KINDS).map(function (k) { return [k, P.HR_NOTE_KINDS[k]]; }), 'coaching')) + fld(L('Catatan', 'Note'), area('text', ''), { req: true, wide: true }), ok: L('Simpan Catatan', 'Save Note'),
          onOk: function (v) { var r = P.hrNote(c, id, v.kind, v.text); if (!r.ok) return r.msg; after(L('Catatan HR disimpan.', 'HR note saved.')); return true; } });
      }
    }
  };

  /* ================= NP-08 · Daily Race, Weekly Race ================= */
  function canUpd(r) { var c = cx(); return can('race.edit') || (c && c.employee && c.employee.id === r.pic); }
  function evid(r) {
    var sys = (r.ev && r.ev.sys) || [];
    if (!sys.length && !(r.ev && r.ev.files)) return A.chip('warn', L('Perlu upload bukti', 'Evidence upload needed'), 'alert');
    return sys.map(function (e) { var label = ic('database') + '<span>' + t(L('Otomatis: ', 'Automatic: ')) + t(e[1]) + (e[2] > 1 ? ' (' + e[2] + ')' : '') + '</span>'; return e[3] && open(e[3]) ? '<a class="chip ok" href="' + href(e[3]) + '">' + label + '</a>' : '<span class="chip ok">' + label + '</span>'; }).join('') +
      (r.ev && r.ev.files ? A.chip('info', L(r.ev.files + ' file terlampir', r.ev.files + ' file attached'), 'file') : '');
  }
  function raceCard(r, o) {
    o = o || {};
    var st = P.ST[r.status] || P.ST.progress, g = P.goalRaw(r.goal);
    return '<article class="rc5 t-' + st.tone + '"><div class="rc5-h"><b>' + t(r.n) + '</b>' + stc(r.status) + '</div>' +
      (o.simple ? '' : '<div class="rc5-m">' + [g ? lnk('GOL-DTL-001', g.id, esc(g.id)) : '', P.kpi(r.kpi) ? lnk('KPI-DTL-001', r.kpi, esc(r.kpi)) : esc(r.kpi), lnk('PERF-USR-001', r.pic, esc(emp(r.pic)))].filter(Boolean).join(' · ') + '</div>') +
      '<div class="rc5-p">' + bar(r.prog, st.tone) + '<span class="num">' + fv(r.actual, r.unit) + ' / ' + fv(r.target, r.unit) + ' · ' + pct(r.prog, 0) + '</span></div>' +
      '<div class="rc5-d">' + ic('clock') + '<span>' + t(L('Deadline ', 'Deadline ')) + dt(r.deadline) + '</span></div>' +
      (T(r.blocker) ? '<p class="rc5-b">' + ic('alert') + '<span><small>' + t(L('Blocker', 'Blocker')) + '</small>' + t(r.blocker) + '</span></p>' : '') +
      (T(r.result) ? '<p class="rc5-r">' + ic('checkc') + '<span>' + t(r.result) + '</span></p>' : '') + (T(r.follow) ? '<p class="rc5-r">' + ic('arrow') + '<span>' + t(r.follow) + '</span></p>' : '') +
      '<div class="rc5-e">' + evid(r) + '</div>' + (o.upd && canUpd(r) && r.status !== 'done' ? '<button type="button" class="btn btn-blue btn-sm" data-act="race-upd" data-val="' + esc(r.id) + '">' + ic('edit') + '<span>' + t(L('Update Progres', 'Update Progress')) + '</span></button>' : '') + '</article>';
  }
  H.raceCard = raceCard;
  function raceUpdAct(el) {
    var c = cx(), r = by(P.state().daily, 'id', el.getAttribute('data-val'));
    dlg({ title: L('Update progres race', 'Update race progress'), sub: t(r.n),
      body: '<div class="fg5">' + fld(T(L('Aktual', 'Actual')) + (T(r.unit) ? ' (' + T(r.unit) + ')' : ''), inp('actual', r.actual, { num: true }), { req: true, hint: t(L('Target ', 'Target ')) + fv(r.target, r.unit) }) + fld(L('Status', 'Status'), sel('status', [['on', P.ST.on.n], ['risk', P.ST.risk.n], ['off', P.ST.off.n], ['done', P.ST.done.n]], r.status)) + '</div>' +
        fld(L('Blocker', 'Blocker'), area('blocker', T(r.blocker)), { wide: true }) + fld(L('Hasil', 'Result'), inp('result', T(r.result))) + fld(L('Tindak lanjut', 'Follow-up'), inp('follow', T(r.follow))) +
        (H.open && !(r.ev && r.ev.sys && r.ev.sys.length) ? note(t(L('Race ini belum punya bukti otomatis dari sistem. Lampirkan foto atau dokumen di aplikasi produksi.', 'This race has no automatic system evidence yet. Attach a photo or document in the production app.')), 'alert', 'warn') : ''),
      ok: L('Simpan Update', 'Save Update'),
      onOk: function (v) { var n = num(v.actual); if (n == null || isNaN(n)) return P.MSG.invalid; var res = P.raceUpdate(c, r.id, { actual: n, status: v.status, blocker: v.blocker ? [v.blocker, v.blocker] : '', result: v.result ? [v.result, v.result] : '', follow: v.follow ? [v.follow, v.follow] : '' }); if (!res.ok) return res.msg; after(L('Progres race diperbarui.', 'Race progress updated.')); return true; } });
  }
  function raceTabs(cur) {
    return tabs([['RACE-DLY-001', 'Daily Race', 'zap'], ['RACE-WK-001', 'Weekly Race', 'flag'], ['R2RE-001', 'R2RE', 'clipboard'], ['REFL-001', 'Monthly Reflection', 'history']].filter(function (x) { return open(x[0]); }), cur, null, { hf: function (k) { return href(k); }, label: 'Race' });
  }
  V['RACE-DLY-001'] = {
    render: function (c) {
      var c0 = cx(), mineOk = c0 && c0.employee && P.daily(c0, 'mine').length, frontline = A.R().group !== 'management';
      var scope = c.q.scope || (frontline && mineOk ? 'mine' : 'all'), rows = P.daily(c0, scope === 'mine' ? 'mine' : null);
      if (c.q.team) rows = rows.filter(function (r) { return r.team === c.q.team; });
      var order = { off: 0, risk: 1, on: 2, done: 3 };
      rows = rows.slice().sort(function (a, b) { return (order[a.status] - order[b.status]) || (a.deadline < b.deadline ? -1 : 1); });
      var all = P.daily(c0), up = all.filter(P.needsUpload).length;
      return A.pageHead(null, t(L('Eksekusi harian yang terhubung ke goal dan KPI · ', 'Daily execution linked to goals and KPIs · ')) + dt(P.TODAY), A.pbtn('race.edit', 'primary', L('Tambah Race', 'Add Race'), 'plus', { act: 'add' })) + raceTabs('RACE-DLY-001') +
        tiles([tile({ k: L('Race hari ini', 'Races today'), v: all.length }), tile({ k: L('Selesai', 'Done'), v: all.filter(function (r) { return r.status === 'done'; }).length, tone: 'ok' }), tile({ k: 'At Risk', v: all.filter(function (r) { return r.status === 'risk'; }).length, tone: 'warn' }), tile({ k: 'Off Track', v: all.filter(function (r) { return r.status === 'off'; }).length, tone: 'crit' }), tile({ k: L('Perlu upload bukti', 'Needs evidence upload'), v: up, s: t(L('Bukti otomatis diutamakan', 'Automatic evidence first')) })], 'tls5-5') +
        '<div class="fb">' + tabs([['all', L('Semua', 'All')], ['mine', L('Race saya', 'My races')]].filter(function (x) { return x[0] === 'all' || mineOk; }), scope, 'scope', { seg: true, def: frontline && mineOk ? 'mine' : 'all', label: L('Cakupan', 'Scope') }) +
          (c.q.team ? A.chip('info', L('Tim: ' + T(teamName(c.q.team)), 'Team: ' + T(teamName(c.q.team))), 'users') + '<a class="lnk5" href="' + qhref({ team: null }) + '">' + t(L('Hapus filter', 'Clear filter')) + '</a>' : '') + '</div>' +
        (rows.length ? '<div class="rc5s">' + rows.map(function (r) { return raceCard(r, { upd: true }); }).join('') + '</div>' : A.empty(L('Tidak ada race untuk filter ini.', 'No races for this filter.')));
    },
    act: {
      'race-upd': raceUpdAct,
      add: function () {
        var c = cx(), goals = P.state().goals.filter(function (g) { return (g.lvl === 'weekly' || g.lvl === 'daily' || g.lvl === 'stracon') && g.status !== 'cancelled'; }).map(function (g) { return [g.id, [g.id + ' · ' + g.n[0], g.id + ' · ' + g.n[1]]]; });
        var kpis = P.kpis('R2-UBD').concat(P.kpis('XS-OPS')).map(function (k) { return [k.code, [k.code + ' · ' + k.n[0], k.code + ' · ' + k.n[1]]]; });
        dlg({ title: L('Tambah Daily Race', 'Add Daily Race'), body: fld(L('Aktivitas', 'Activity'), inp('n', ''), { req: true, wide: true }) + fld('Goal', sel('goal', goals, 'WR-41-01'), { req: true, wide: true }) + fld('KPI', sel('kpi', kpis, 'R2-UPT'), { req: true }) +
          '<div class="fg5">' + fld(L('Target', 'Target'), inp('target', 1, { num: true }), { req: true }) + fld(L('Satuan', 'Unit'), inp('unit', '')) + fld('PIC', sel('pic', peopleOpts(), 'EMP-021')) + fld(L('Tim', 'Team'), sel('team', D.TEAMS.map(function (x) { return [x.k, x.n]; }), 'ops')) + fld('Deadline', inp('deadline', '17:00', { type: 'time' })) + '</div>', ok: L('Simpan Race', 'Save Race'),
          onOk: function (v) { var n = num(v.target); if (!v.n || n == null || isNaN(n)) return P.MSG.invalid; var r = P.raceAdd(c, { n: [v.n, v.n], goal: v.goal, kpi: v.kpi, target: n, unit: v.unit, pic: v.pic, team: v.team, deadline: P.TODAY + ' ' + (v.deadline || '17:00') }); if (!r.ok) return r.msg; after(L('Race ' + r.r.id + ' dibuat.', 'Race ' + r.r.id + ' created.')); return true; } });
      }
    }
  };
  V['RACE-WK-001'] = {
    render: function () {
      var w = P.weekly();
      return A.pageHead(null, t(L('Minggu 41 · 5–11 Okt 2026 · total berjalan dinilai terhadap pace hari ke-2 dari 7', 'Week 41 · 5–11 Oct 2026 · running totals judged against day 2 of 7 pace'))) + raceTabs('RACE-WK-001') +
        tiles([tile({ k: L('Fokus minggu ini', 'This week\'s focus'), v: w.length }), tile({ k: 'On Track', v: w.filter(function (x) { return x.st === 'on'; }).length, tone: 'ok' }), tile({ k: 'At Risk', v: w.filter(function (x) { return x.st === 'risk'; }).length, tone: 'warn' }), tile({ k: 'Off Track', v: w.filter(function (x) { return x.st === 'off'; }).length, tone: 'crit' })], 'tls5-4') +
        card('Weekly Race', A.list(w, [
          { h: L('Fokus mingguan', 'Weekly focus'), v: function (x) { return '<b>' + t(x.n) + '</b><small class="sub5">' + lnk('GOL-DTL-001', x.goal, esc(x.goal)) + ' · ' + esc(x.kpi) + '</small>'; } },
          { h: L('Target', 'Target'), cls: 'r num', v: function (x) { return fv(x.target, x.unit); } }, { h: L('Aktual', 'Actual'), cls: 'r num', v: function (x) { return '<b>' + fv(x.actual, x.unit) + '</b>'; } },
          { h: L('Pencapaian', 'Achievement'), cls: 'r num', v: function (x) { return pct(x.ach) + (x.pace != null ? '<small class="sub5">pace ' + pct(x.pace) + '</small>' : ''); } },
          { h: L('Varian', 'Variance'), cls: 'r num', v: function (x) { return (x.variance > 0 ? '+' : x.variance < 0 ? '−' : '') + fv(Math.abs(x.variance), x.unit); } },
          { h: 'PIC', v: function (x) { return lnk('PERF-USR-001', x.pic, esc(emp(x.pic))); } }, { h: 'Issue', cls: 'r num', v: function (x) { return x.issues || 0; } },
          { h: L('Bukti', 'Evidence'), v: function (x) { return x.ev ? A.chip('ok', x.ev, 'database') : A.chip('warn', L('Perlu bukti', 'Needs evidence')); } }, { h: L('Status', 'Status'), v: function (x) { return stc(x.st); } }
        ], function (x) { return { t: t(x.n), r: pct(x.pace != null ? x.pace : x.ach), s: fv(x.actual, x.unit) + ' / ' + fv(x.target, x.unit) + ' · ' + esc(emp(x.pic)), chip: stc(x.st) }; }, null, { dense: true }), { icon: 'flag' }) +
        note(t(L('Race dengan pace (mis. revenue) dinilai terhadap target × hari berjalan agar tidak tampak gagal di awal minggu.', 'Paced races (e.g. revenue) are judged against target × elapsed days so they do not look failed early in the week.')), 'info');
    }
  };

  /* ================= NP-08 · R2RE KPI Review Board & meeting mode ================= */
  var WEEKS = P.REFL_WEEKS;
  function wkOf(q) { return WEEKS.indexOf(q.wk) >= 0 ? q.wk : 'W40'; }
  function wkTabs(wk, extra) { return tabs(WEEKS.map(function (w) { var x = by(D.R2_WEEKS, 'k', w); return [w, x.n]; }), wk, 'wk', { seg: true, def: 'W40', label: L('Minggu', 'Week'), hf: extra }); }
  V['R2RE-001'] = {
    render: function (c) {
      var wk = wkOf(c.q), b = P.r2Board(wk), rv = b.reviews, cats = P.CAT_ORDER.filter(function (k) { return b.lines.some(function (l) { return l.k.cat === k; }); });
      var groups = cats.map(function (cat) {
        var ls = b.lines.filter(function (l) { return l.k.cat === cat; }), w = sum(ls.map(function (l) { return l.k.weight; }));
        return '<section class="r2g5"><h3 class="h5">' + ic(P.CAT_ICON[cat]) + '<span>' + t(P.CATS[cat]) + '</span><small class="num">' + pct(w, 0) + '</small></h3>' + A.list(ls, [
          { h: 'KPI', v: function (l) { return '<b>' + t(l.k.n) + '</b><small class="sub5">' + esc(l.k.code) + ' · PIC ' + esc(emp(l.k.owner)) + '</small>'; } },
          { h: L('Bobot', 'Weight'), cls: 'r num', v: function (l) { return pct(l.k.weight, 0); } }, { h: L('Target', 'Target'), cls: 'r num', v: function (l) { return fv(l.k.target, l.k.unit); } },
          { h: L('Aktual', 'Actual'), cls: 'r num', v: function (l) { return '<b>' + fv(l.actual, l.k.unit) + '</b>'; } }, { h: L('Pencapaian', 'Achievement'), cls: 'r num', v: function (l) { return pct(l.ach); } },
          { h: 'Weighted', cls: 'r num', v: function (l) { return fmt.num(l.ws, 2); } }, { h: L('vs minggu lalu', 'vs last week'), v: function (l) { return trendc(l.trend); } },
          { h: L('Status', 'Status'), v: function (l) { return stc(l.st); } }, { h: 'Review', v: function (l) { return rv[l.k.code] && rv[l.k.code].reviewed ? A.chip('ok', L('Direview', 'Reviewed'), 'checkc') : A.chip('mute', L('Belum', 'Not yet')); } }
        ], function (l) { return { t: t(l.k.n), r: pct(l.ach), s: fv(l.actual, l.k.unit) + ' / ' + fv(l.k.target, l.k.unit) + ' · ' + pct(l.k.weight, 0), chip: stc(l.st) + (rv[l.k.code] && rv[l.k.code].reviewed ? A.chip('ok', L('Direview', 'Reviewed'), 'checkc') : '') }; }, function (l) { return href('R2RE-MTG-001', l.k.code, { wk: wk }); }, { dense: true }) + '</section>';
      }).join('');
      var first = b.lines.filter(function (l) { return !(rv[l.k.code] && rv[l.k.code].reviewed); })[0] || b.lines[0];
      return A.pageHead(null, t(L('Tim ', 'Team ')) + t(b.team.n) + ' · Race Leader ' + esc(emp(b.leader)) + ' · ' + t(b.week.d) + ' · ' + t(b.sc.n) + ' v' + b.sc.v, A.btn('primary', L('Mulai Meeting Mode', 'Start Meeting Mode'), 'target', { go: 'R2RE-MTG-001', rec: first.k.code, qs: 'wk=' + wk })) + raceTabs('R2RE-001') + wkTabs(wk) +
        tiles([tile({ k: L('Skor minggu ini', 'Week score'), ring: b.score }), tile({ k: L('Minggu lalu', 'Last week'), v: sc1(b.prev), s: delta(b.score - b.prev) }), tile({ k: 'KPI', v: b.counts.total, s: b.counts.on + ' on · ' + b.counts.risk + ' risk · ' + b.counts.off + ' off' }), tile({ k: L('Sudah direview', 'Reviewed'), v: b.reviewed + ' / ' + b.counts.total, tone: b.reviewed === b.counts.total ? 'ok' : '' })], 'tls5-4') +
        weightMsg(b.check) + card(L('KPI per kategori', 'KPIs by category'), groups + note(t(L('Urutan: kategori → bobot terbesar → kritis / at risk dulu → pencapaian terendah.', 'Order: category → highest weight → critical / at risk first → lowest achievement.')), 'sort'), { icon: 'clipboard' }) +
        card(L('Hak Race Leader', 'Race Leader rights'), '<div class="grid2"><ul class="can5">' + P.LEADER_ACTIONS.map(function (x) { return '<li class="ok">' + ic('checkc') + '<span>' + t(x[1]) + '</span></li>'; }).join('') + '</ul><ul class="can5">' + P.LEADER_CANNOT.map(function (x) { return '<li class="no">' + ic('lock') + '<span>' + t(L('Tidak bisa ubah: ', 'Cannot change: ')) + t(x[1]) + '</span></li>'; }).join('') + '</ul></div>', { icon: 'shield' });
    }
  };
  V['R2RE-MTG-001'] = {
    title: function (rec) { var k = P.kpi(rec); return k ? k.n : 'R2RE'; },
    render: function (c) {
      var wk = wkOf(c.q), b = P.r2Board(wk), i = b.lines.map(function (l) { return l.k.code; }).indexOf(c.rec);
      if (i < 0) return A.stateCard('empty', P.MSG.notfound, A.btn('blue', 'R2RE', 'arrowl', { go: 'R2RE-001' }));
      var l = b.lines[i], k = l.k, rv = b.reviews[k.code] || {}, prev = b.lines[i - 1], st = P.ST[l.st];
      var labels = D.R2_WEEKS.map(function (w) { return T(w.n).replace('Minggu ', 'M').replace('Week ', 'W'); });
      return '<div class="mtg5"><div class="mtg5-top"><span>' + t(L('KPI ', 'KPI ')) + (i + 1) + t(L(' dari ', ' of ')) + b.lines.length + ' · ' + t(b.week.n) + '</span>' + bar((i + 1) / b.lines.length * 100, 'info') + '</div>' +
        '<section class="mtg5-k t-' + st.tone + '"><div><span class="chip info">' + ic(P.CAT_ICON[k.cat]) + '<span>' + t(P.CATS[k.cat]) + '</span></span><h1>' + t(k.n) + '</h1><small>' + esc(k.code) + ' · PIC ' + esc(emp(k.owner)) + '</small></div>' +
        '<div class="mtg5-n">' + kv([[L('Target', 'Target'), ic('lock') + ' ' + fv(k.target, k.unit)], [L('Aktual', 'Actual'), '<b>' + fv(l.actual, k.unit) + '</b>'], [L('Pencapaian', 'Achievement'), pct(l.ach)], [L('Bobot', 'Weight'), ic('lock') + ' ' + pct(k.weight, 0)], [L('Minggu lalu', 'Last week'), fv(l.prev, k.unit)], [L('Status', 'Status'), stc(l.st) + trendc(l.trend)]]) + '</div></section>' +
        card(L('Tren mingguan', 'Weekly trend'), A.lineChart([{ n: k.n, v: l.vals.map(function (v) { return v == null ? 0 : v; }) }], labels, { h: 150, target: k.target, fmt: function (v) { return fv(v, k.unit); }, fmtAx: function (v) { return T(k.unit) === 'Rp' ? fmt.num(v / 1e6, 0) : fmt.num(v, 1); }, min: Math.min.apply(null, l.vals.concat([k.target])) * 0.97, label: T(k.n) }), { icon: 'trend' }) +
        note(t(P.MSG.protected), 'lock') +
        '<form class="kf5" id="mtg5" onsubmit="return false">' + card(L('Diskusi', 'Discussion'), '<div class="fg5">' +
          fld(L('Mengapa terjadi?', 'Why did it happen?'), area('why', rv.why || ''), { wide: true }) + fld('Root cause', area('rootCause', rv.rootCause || ''), { wide: true }) +
          fld(L('Dampak', 'Impact'), area('impact', rv.impact || '')) + fld(L('Recovery action', 'Recovery action'), area('recovery', rv.recovery || '')) +
          fld('PIC', sel('pic', peopleOpts(true), rv.pic || '')) + fld(L('Due date', 'Due date'), inp('due', rv.due || '', { type: 'date' })) +
          fld(L('Bukti', 'Evidence'), inp('evidence', rv.evidence || '', { ph: L('Nomor dokumen / link sistem', 'Document no. / system link') })) + fld(L('Keputusan', 'Decision'), inp('decision', rv.decision || '')) +
          '<label class="ck5"><input type="checkbox" name="issue"' + (rv.issue ? ' checked' : '') + '><span>' + t(L('Catat sebagai issue', 'Log as an issue')) + '</span></label>' +
          '<label class="ck5"><input type="checkbox" name="carry"' + (rv.carry ? ' checked' : '') + '><span>' + t(L('Bawa issue ke minggu depan', 'Carry the issue forward')) + '</span></label>' +
          '<label class="ck5"><input type="checkbox" name="closed"' + (rv.closed ? ' checked' : '') + '><span>' + t(L('Tutup diskusi KPI ini', 'Close this KPI discussion')) + '</span></label></div>', { icon: 'clipboard' }) + '</form>' +
        A.actionBar(A.btn('primary', i < b.lines.length - 1 ? L('Simpan & KPI Berikutnya', 'Save & Next KPI') : L('Simpan & Selesai', 'Save & Finish'), 'arrow', { act: 'next' }),
          (prev ? A.btn('ghost', L('Sebelumnya', 'Previous'), 'arrowl', { go: 'R2RE-MTG-001', rec: prev.k.code, qs: 'wk=' + wk }) : '') + A.btn('ghost', L('Board', 'Board'), 'list', { go: 'R2RE-001', qs: 'wk=' + wk })) + '</div>';
    },
    act: {
      next: function () {
        var c = cx(), wk = wkOf(A.S.q), code = A.S.rec, f = document.getElementById('mtg5'), v = {};
        f.querySelectorAll('[name]').forEach(function (x) { v[x.name] = x.type === 'checkbox' ? x.checked : String(x.value).trim(); });
        var rec = {}; Object.keys(v).forEach(function (k) { if (v[k] !== '' && v[k] !== false) rec[k] = v[k]; });
        var r = P.r2Review(c, wk, code, rec);
        if (!r.ok) { A.toast(r.msg, 'crit'); return; }
        var nx = P.r2Next(wk, code);
        if (nx) { A.go('R2RE-MTG-001', nx, { wk: wk }); setTimeout(function () { A.toast(L('Tersimpan. KPI berikutnya.', 'Saved. Next KPI.')); }, 350); }
        else { A.go('R2RE-001', null, { wk: wk }); setTimeout(function () { A.toast(L('Review R2RE ' + wk + ' selesai.', 'R2RE ' + wk + ' review finished.')); }, 350); }
      }
    }
  };

  /* ================= NP-09 · REFL-001 Monthly Reflection & Strategy ================= */
  var REFL_TABS = [['dash', 'Dashboard', 'gauge'], ['tbl', L('Konsolidasi', 'Consolidated'), 'list'], ['trend', L('Tren', 'Trend'), 'trend'], ['iss', L('Issue', 'Issues'), 'alert'], ['ins', 'Insight', 'sparkles'], ['sum', L('Ringkasan & Strategi', 'Summary & Strategy'), 'target'], ['stra', 'STRACON', 'clipboard'], ['appr', L('Persetujuan', 'Approval'), 'filecheck']];
  function weeksOf(q) { if (!q.w || q.w === 'all') return WEEKS.slice(); var w = q.w.split(',').filter(function (x) { return WEEKS.indexOf(x) >= 0; }); return w.length ? w : WEEKS.slice(); }
  function weekSel(sel) {
    var all = sel.length === WEEKS.length;
    return '<div class="wks5" role="group" aria-label="' + t(L('Pilih minggu', 'Choose weeks')) + '"><a class="wk5' + (all ? ' on' : '') + '" href="' + qhref({ w: null }) + '" aria-pressed="' + all + '">' + t(L('Semua Minggu', 'All Weeks')) + '</a>' + WEEKS.map(function (w, i) {
      var on = !all && sel.indexOf(w) >= 0, nxt = on ? sel.filter(function (x) { return x !== w; }) : (all ? [w] : sel.concat([w]));
      nxt = WEEKS.filter(function (x) { return nxt.indexOf(x) >= 0; });
      return '<a class="wk5' + (on ? ' on' : '') + '" href="' + qhref({ w: !nxt.length || nxt.length === WEEKS.length ? null : nxt.join(',') }) + '" aria-pressed="' + on + '">W' + (i + 1) + '</a>';
    }).join('') + '</div>';
  }
  function insightBlock(l) {
    var n = l.note || {}, issues = P.state().issues.filter(function (i) { return i.kpi === l.k.code; });
    return '<article class="ins5"><div class="ins5-h"><b>' + t(l.k.n) + '</b>' + stc(l.st) + trendc(l.trend) + '</div><dl class="ins5-d">' +
      [['WHAT', t(L('Pencapaian ', 'Achievement ')) + pct(l.ach) + ' · ' + fv(l.monthly, l.k.unit) + ' / ' + fv(l.target, l.k.unit)], ['WHY', t(n.why || L('Sesuai rencana', 'As planned'))], ['TREND', t(P.TREND[l.trend].n) + ' · ' + l.vals.map(function (v) { return fv(v, l.k.unit); }).join(' → ')], ['IMPACT', t(n.impact || '—') + (issues.filter(function (i) { return i.fin; }).map(function (i) { return ' · ' + T(i.fin); }).join(''))], ['RECOMMENDATION', t(n.rec || L('Pertahankan', 'Keep it up'))]]
        .map(function (x) { return '<div><dt>' + x[0] + '</dt><dd>' + x[1] + '</dd></div>'; }).join('') + '</dl></article>';
  }
  function approverCtx() { return { uid: 'USR-050', name: 'Aji Jaens', perms: X.rolePerms('owner') }; }
  V['REFL-001'] = {
    render: function (c) {
      var sel = weeksOf(c.q), R = P.reflection(sel), tab = c.q.tab || 'dash', st = R.status, body;
      var flow = P.REFL_FLOW, idx = flow.map(function (f) { return f[0]; }).indexOf(st.status), frozen = st.status === 'frozen';
      if (tab === 'tbl') body = card(L('Tabel konsolidasi', 'Consolidated table'), A.list(R.lines, [
          { h: 'KPI', v: function (l) { return '<b>' + t(l.k.n) + '</b><small class="sub5">' + t(P.CATS[l.k.cat]) + ' · ' + t(P.AGG[l.k.agg].n) + '</small>'; } },
          { h: L('Bobot', 'Weight'), cls: 'r num', v: function (l) { return pct(l.weight, 2); } }].concat(WEEKS.map(function (w, i) { return { h: 'W' + (i + 1), cls: 'r num', v: function (l) { return l.vals[i] == null ? '<span class="mute5">—</span>' : fv(l.vals[i], l.k.unit); } }; })).concat([
          { h: L('Bulanan', 'Monthly'), cls: 'r num', v: function (l) { return '<b>' + fv(l.monthly, l.k.unit) + '</b>'; } }, { h: L('Target', 'Target'), cls: 'r num', v: function (l) { return fv(l.target, l.k.unit); } },
          { h: L('Pencapaian', 'Achievement'), cls: 'r num', v: function (l) { return pct(l.ach); } }, { h: 'Weighted', cls: 'r num', v: function (l) { return fmt.num(l.ws, 2); } },
          { h: L('Tren', 'Trend'), v: function (l) { return trendc(l.trend); } }, { h: L('Status', 'Status'), v: function (l) { return stc(l.st); } }]),
        function (l) { return { t: t(l.k.n), r: pct(l.ach), s: t(P.AGG[l.k.agg].n) + ' · ' + fv(l.monthly, l.k.unit) + ' / ' + fv(l.target, l.k.unit), chip: stc(l.st) }; }, function (l) { return open('KPI-DTL-001') ? href('KPI-DTL-001', l.k.code) : null; }, { dense: true }) +
        '<div class="grid2">' + card(L('Metode agregasi', 'Aggregation methods'), '<ul class="agg5">' + Object.keys(P.AGG).filter(function (k) { return k !== 'formula'; }).map(function (k) { var a = P.AGG[k]; return '<li>' + ic(a.icon) + '<span><b>' + t(a.n) + '</b><small>' + t(a.d) + ' · ' + t(L('contoh ', 'e.g. ')) + t(a.ex) + '</small></span></li>'; }).join('') + '</ul>', { icon: 'cog' }) +
          card(L('Normalisasi bobot', 'Weight normalisation'), weightMsg(P.validateWeights(R.lines.map(function (l) { return l.weight; }))) + note(t(L('Setiap scorecard mingguan bernilai 100%. Bobot bulanan dirata-rata lalu dinormalisasi ke 100%, tidak pernah dijumlah menjadi 400%.', 'Each weekly scorecard is 100%. Monthly weights are averaged and normalised to 100%, never added up to 400%.')), 'scale'), { icon: 'scale' }) + '</div>', { icon: 'list' });
      else if (tab === 'trend') body = card(L('Tren minggu ke minggu', 'Week-over-week trend'), '<div class="trs5">' + P.trendSeries().map(function (s) {
          var tr = P.trendOf(s.vals, s.k.dir);
          return '<article class="tr5"><div class="tr5-h"><b>' + t(s.k.n) + '</b>' + trendc(tr) + '</div>' + spark(s.vals, { w: 220, h: 44 }) + '<small class="num">' + s.vals.map(function (v) { return fv(v, s.k.unit); }).join(' → ') + '</small></article>';
        }).join('') + '</div>' + A.barChart(R.weekScores.map(function (v, i) { return { l: 'W' + (i + 1), v: v, hi: i === 3 }; }), { h: 170, label: T(L('Skor R2RE per minggu', 'R2RE score per week')), fmt: function (v) { return sc1(v); } }), { icon: 'trend' });
      else if (tab === 'iss') { var iss = P.state().issues; body = card(L('Register issue', 'Issue register'), A.list(iss, [
          { h: 'Issue', v: function (i) { return '<b>' + t(i.n) + '</b><small class="sub5">' + esc(i.id) + ' · ' + esc(i.kpi) + ' · ' + t(L('ditemukan ', 'found ')) + esc(i.week) + '</small>'; } },
          { h: 'Root cause', v: function (i) { return t(i.rc); } }, { h: L('Dampak', 'Impact'), v: function (i) { return t(i.impact) + (i.fin ? '<small class="sub5">' + t(i.fin) + '</small>' : ''); } },
          { h: 'Owner', v: function (i) { return esc(emp(i.owner)); } }, { h: L('Umur', 'Age'), cls: 'r num', v: function (i) { return P.issueAge(i) + t(L(' hari', ' d')); } },
          { h: L('Status', 'Status'), v: function (i) { return stc(i.status) + (i.carried ? A.chip('appr', L('Dibawa ke Okt', 'Carried to Oct'), 'arrow') : ''); } },
          { h: '', v: function (i) { return i.status !== 'resolved' && !i.carried && (can('race.lead') || can('refl.edit')) ? '<button type="button" class="btn btn-ghost btn-sm" data-act="carry" data-val="' + esc(i.id) + '">' + ic('arrow') + '<span>' + t(L('Bawa ke depan', 'Carry forward')) + '</span></button>' : ''; } }
        ], function (i) { return { t: t(i.n), r: P.issueAge(i) + t(L(' hari', ' d')), s: esc(i.id) + ' · ' + esc(emp(i.owner)) + ' · ' + t(i.action), chip: stc(i.status) + (i.carried ? A.chip('appr', L('Dibawa', 'Carried'), 'arrow') : '') }; }, null, { dense: true }) +
        note(t(L('Carry forward menyimpan minggu ditemukan, umur, owner, KPI terkait dan riwayat issue.', 'Carry forward keeps the week found, age, owner, linked KPI and issue history.')), 'history') +
        '<ol class="aud5">' + iss.filter(function (i) { return i.hist; }).map(function (i) { return '<li><b>' + esc(i.id) + '</b><small>' + i.hist.map(function (h) { return dt(h[0]) + ' ' + T(h[1]); }).join(' · ') + '</small></li>'; }).join('') + '</ol>', { icon: 'alert', count: iss.length }); }
      else if (tab === 'ins') body = card(L('Insight per KPI', 'Insight per KPI'), '<div class="inss5">' + R.lines.map(insightBlock).join('') + '</div>', { icon: 'sparkles' });
      else if (tab === 'sum') body = '<div class="grid2">' + card(L('Ringkasan bulan', 'Month summary'), '<ul class="sw5">' +
          '<li class="ok">' + ic('checkc') + '<span><small>' + t(L('Berjalan baik', 'Went well')) + '</small><b>' + R.summary.well.map(function (k) { return t(k.n); }).join(', ') + '</b></span></li>' +
          '<li class="warn">' + ic('alert') + '<span><small>' + t(L('Perlu perhatian', 'Needs attention')) + '</small><b>' + R.summary.attention.map(function (k) { return t(k.n); }).join(', ') + '</b></span></li>' +
          '<li class="ok">' + ic('star') + '<span><small>' + t(L('Kemenangan terbesar', 'Biggest win')) + '</small><b>' + t(R.summary.win.k.n) + ' · ' + pct(R.summary.win.ach) + '</b></span></li>' +
          '<li class="crit">' + ic('xc') + '<span><small>' + t(L('Risiko terbesar', 'Biggest risk')) + '</small><b>' + t(R.summary.risk.k.n) + ' · ' + pct(R.summary.risk.ach) + '</b></span></li>' +
          '<li class="info">' + ic('bulb') + '<span><small>' + t(L('Peluang terbesar', 'Biggest opportunity')) + '</small><b>' + t(R.summary.opp) + '</b></span></li></ul>', { icon: 'sparkles' }) +
        card(L('Menuju goal', 'Toward the goal'), R.goals.map(function (g) { return '<a class="gp5" href="' + href('GOL-DTL-001', g.id) + '"><b>' + t(g.n) + '</b>' + bar(g.progress, P.ST[g.status] ? P.ST[g.status].tone : 'info') + '<span>' + pct(g.progress, 0) + ' · ' + T(P.ST[g.status] ? P.ST[g.status].n : g.status) + '</span></a>'; }).join(''), { icon: 'target' }) + '</div>' +
        card(L('Strategy board', 'Strategy board'), A.list(P.state().strategy, [
          { h: L('Strategi', 'Strategy'), v: function (s) { return '<b>' + t(s.n) + '</b><small class="sub5">' + lnk('GOL-DTL-001', s.goal, esc(s.goal)) + ' · ' + lnk('KPI-DTL-001', s.kpi, esc(s.kpi)) + '</small>'; } },
          { h: 'Owner', v: function (s) { return esc(emp(s.owner)); } }, { h: 'Due', v: function (s) { return dt(s.due); } }, { h: L('Dampak', 'Impact'), v: function (s) { return t(s.impact); } }, { h: L('Status', 'Status'), v: function (s) { return stc(s.status); } }
        ], function (s) { return { t: t(s.n), s: esc(emp(s.owner)) + ' · ' + dt(s.due) + ' · ' + t(s.impact), chip: stc(s.status) }; }, null, { dense: true }), { icon: 'route' });
      else if (tab === 'stra') { var d = P.state().stracon, SRC = { gap: L('Gap KPI', 'KPI gap'), issue: L('Issue terbuka', 'Open issue'), carry: L('Dibawa', 'Carried'), insight: L('Insight', 'Insight'), goal: 'Goal' };
        body = card(L('STRACON Oktober 2026', 'STRACON October 2026'), (d ? '<div class="stra5-h">' + A.chip(d.status === 'active' ? 'ok' : d.status === 'review' ? 'info' : 'mute', d.status === 'active' ? L('Aktif', 'Active') : d.status === 'review' ? 'Review' : 'Draft') + '<span>' + esc(d.id) + ' · ' + d.items.length + ' ' + t(L('item', 'items')) + ' · ' + dtt(d.at) + '</span></div>' +
          A.list(d.items, [{ h: L('Sumber', 'Source'), v: function (x) { return A.chip('info', SRC[x.src] || x.src); } }, { h: L('Rencana', 'Plan'), v: function (x) { return '<b>' + t(x.t) + '</b>' + (x.why ? '<small class="sub5">' + t(x.why) + '</small>' : ''); } }, { h: 'KPI', v: function (x) { return x.kpi ? esc(x.kpi) : '—'; } }, { h: 'Owner', v: function (x) { return x.owner ? esc(emp(x.owner)) : '—'; } }],
            function (x) { return { t: t(x.t), s: T(SRC[x.src] || x.src) + (x.kpi ? ' · ' + x.kpi : '') + (x.owner ? ' · ' + emp(x.owner) : '') }; }, null, { dense: true }) +
          '<div class="ds-btnbar">' + (d.status === 'draft' ? A.pbtn('stracon.create', 'blue', L('Kirim ke Review', 'Send to Review'), 'arrow', { act: 'stra', val: 'review' }) : '') + (d.status === 'review' ? A.pbtn('refl.approve', 'primary', L('Aktifkan STRACON', 'Activate STRACON'), 'checkc', { act: 'stra', val: 'active' }) : '') + A.pbtn('stracon.create', 'ghost', L('Buat Ulang Draft', 'Regenerate Draft'), 'refresh', { act: 'straNew' }) + '</div>'
          : A.empty(L('Belum ada draft STRACON bulan depan.', 'No STRACON draft for next month yet.')) + A.pbtn('stracon.create', 'primary', L('Buat Draft STRACON', 'Create STRACON Draft'), 'sparkles', { act: 'straNew' })) +
          note(t(L('Draft diisi dari gap KPI, issue terbuka, insight, rekomendasi, progres goal dan aksi yang dibawa. Draft wajib direview sebelum diaktifkan.', 'The draft is filled from KPI gaps, open issues, insights, recommendations, goal progress and carried actions. It must be reviewed before activation.')), 'info'), { icon: 'clipboard' }); }
      else if (tab === 'appr') { var nx = P.reflNext(), curPerm = idx >= 0 && flow[idx] ? flow[idx][2] : null, permNext = nx ? (nx[0] === 'frozen' ? 'refl.approve' : curPerm) : null;
        body = card(L('Alur persetujuan', 'Approval flow'), '<ol class="flow5">' + flow.map(function (f, i) { return '<li class="' + (i < idx ? 'done' : i === idx ? 'now' : '') + '"><span class="flow5-n">' + (i < idx ? ic('check') : i + 1) + '</span><b>' + t(f[1]) + '</b></li>'; }).join('') + '</ol>' +
          (frozen ? note(t(L('Frozen ', 'Frozen ')) + dtt(st.frozenAt) + ' · ' + t(L('skor terkunci ', 'locked score ')) + sc1(st.snapshot.score) + ' · v' + st.v + '. ' + T(P.MSG.frozen), 'lock', 'warn') : '') +
          '<div class="ds-btnbar">' + (nx && can(permNext) ? A.btn('primary', nx[0] === 'frozen' ? L('Setujui & Freeze', 'Approve & Freeze') : T(L('Kirim ke ', 'Send to ')) + T(nx[1]), 'arrow', { act: 'flow', val: nx[0] }) : '') +
          (!frozen && idx > 0 && can(curPerm) ? A.btn('ghost', L('Kembalikan ke Draft', 'Send back to Draft'), 'arrowl', { act: 'flow', val: 'draft' }) : '') + (frozen && (can('refl.edit') || can('refl.approve')) ? A.btn('blue', L('Ajukan Amandemen', 'Request Amendment'), 'edit', { act: 'amend' }) : '') + '</div>' +
          (nx && !can(permNext) ? note(t(L('Langkah berikutnya dilakukan oleh pemegang izin: ', 'The next step is done by the holder of: ')) + t(window.JFOS.PERMS[permNext] || permNext), 'lock') : '') +
          '<h3 class="h5">' + t(L('Riwayat', 'History')) + '</h3>' + (st.log.length ? '<ol class="aud5">' + st.log.map(function (x) { return '<li><b>' + esc(x.from) + ' → ' + esc(x.to) + '</b><small>' + dtt(x.at) + ' · ' + esc(x.name || x.by) + '</small></li>'; }).join('') + '</ol>' : A.empty(L('Belum ada perubahan status.', 'No status changes yet.'))) +
          (st.amend.length ? '<h3 class="h5">' + t(L('Amandemen', 'Amendments')) + '</h3><ol class="aud5">' + st.amend.map(function (a) { return '<li><b>v' + a.v + ' · ' + esc(a.reason) + '</b><small>' + dtt(a.at) + ' · approver ' + esc(a.approverName) + (a.change ? ' · ' + esc(a.change) : '') + '</small></li>'; }).join('') + '</ol>' : ''), { icon: 'filecheck' }); }
      else body = tiles([
          tile({ k: L('Skor reflection', 'Reflection score'), ring: R.score }), tile({ k: L('Bulan lalu (W36)', 'Last month (W36)'), v: sc1(R.prevScore), s: delta(R.score - R.prevScore) }), tile({ k: 'XScore', v: sc1(R.xscore), s: delta(R.xdelta), href: open('XSC-001') ? href('XSC-001') : null }),
          tile({ k: L('Progres goal', 'Goal progress'), v: pct(R.goalProg, 0) }), tile({ k: 'KPI', v: R.counts.total, s: R.counts.on + ' on · ' + R.counts.risk + ' risk · ' + R.counts.off + ' off' }), tile({ k: 'Issue', v: R.openIssues + ' ' + t(L('terbuka', 'open')), s: R.closedIssues + ' ' + t(L('selesai', 'closed')), tone: R.openIssues ? 'warn' : 'ok' })
        ], 'tls5-6') + weightMsg(P.validateWeights(R.lines.map(function (l) { return l.weight; }))) +
        '<div class="grid2">' + card(L('Skor per minggu', 'Score per week'), A.barChart(R.weekScores.map(function (v, i) { return { l: 'W' + (i + 1), v: v, hi: sel.indexOf(WEEKS[i]) >= 0 }; }), { h: 180, label: 'R2RE', fmt: function (v) { return sc1(v); } }), { icon: 'chart' }) +
          card(L('KPI paling menentukan', 'KPIs that matter most'), kpiList(R.lines.slice().sort(function (a, b) { return (b.weight * (100 - b.pts)) - (a.weight * (100 - a.pts)); }).slice(0, 4), { noLink: false }), { icon: 'target' }) + '</div>';
      return A.pageHead(null, t(L('Refleksi September 2026 dari 4 R2RE · status ', 'September 2026 reflection from 4 R2REs · status ')) + t(flow[idx] ? flow[idx][1] : st.status) + ' · v' + st.v) + raceTabs('REFL-001') + weekSel(sel) +
        tabs(REFL_TABS, tab, 'tab', { def: 'dash', label: L('Bagian reflection', 'Reflection sections') }) + body;
    },
    act: {
      carry: function (el) { var r = P.carryForward(cx(), el.getAttribute('data-val')); if (!r.ok) { A.toast(r.msg, 'crit'); return; } after(L('Issue dibawa ke Oktober dengan riwayatnya.', 'Issue carried to October with its history.')); },
      straNew: function () { var r = P.straconDraft(cx()); if (!r.ok) { A.toast(r.msg, 'crit'); return; } after(L('Draft STRACON dibuat (' + r.d.items.length + ' item). Review sebelum diaktifkan.', 'STRACON draft created (' + r.d.items.length + ' items). Review before activation.')); },
      stra: function (el) { var r = P.straconTransition(cx(), el.getAttribute('data-val')); if (!r.ok) { A.toast(r.msg, 'crit'); return; } after(L('Status STRACON diperbarui.', 'STRACON status updated.')); },
      flow: function (el) { var r = P.reflTransition(cx(), el.getAttribute('data-val')); if (!r.ok) { A.toast(r.msg, 'crit'); return; } after(L('Status reflection diperbarui.', 'Reflection status updated.')); },
      amend: function () {
        var c = cx(), ap = approverCtx();
        dlg({ title: L('Amandemen reflection', 'Reflection amendment'), sub: t(L('Reflection sudah frozen. Perubahan butuh alasan, approver dan menjadi versi baru.', 'The reflection is frozen. A change needs a reason, an approver and becomes a new version.')),
          body: fld(L('Perubahan', 'Change'), inp('change', ''), { wide: true }) + fld(L('Alasan', 'Reason'), area('reason', ''), { req: true, wide: true }) + fld('Approver', sel('approver', [['USR-050', 'Aji Jaens · Owner / CEO'], ['none', L('Belum dipilih', 'Not chosen')]], 'USR-050'), { req: true }), ok: L('Ajukan', 'Submit'),
          onOk: function (v) { var r = P.reflAmend(c, v.reason, v.approver === 'USR-050' ? ap : null, v.change); if (!r.ok) return r.msg; after(L('Amandemen v' + r.v + ' dicatat.', 'Amendment v' + r.v + ' recorded.')); return true; } });
      }
    }
  };

  /* ================= NP-10 · Decision intelligence ================= */
  function insightCard(x, compact) {
    var ty = P.INS_TYPE[x.type], tasks = P.tasksFor(x.id);
    var acts = P.MGMT_ACTIONS.filter(function (a) { return a[0] === 'open' ? true : a[0] === 'approve' ? can('apr.view') && open('APR-INB-001') : can('di.act'); });
    return '<article class="ins5"><div class="ins5-h">' + A.chip('info', ty.n, ty.icon) + sevc(x.sev) + '<b>' + t(x.t) + '</b></div><dl class="ins5-d">' +
      [['WHAT', t(x.what)], ['WHY', t(x.why)], ['RISK', t(x.risk)], ['RECOMMENDATION', t(x.rec)], ['ACTION', x.acts.map(function (a) { var m = by(P.MGMT_ACTIONS.map(function (y) { return { k: y[0], l: y[1] }; }), 'k', a[0]); return esc(T(m ? m.l : a[0])) + (a[1] && /^EMP/.test(a[1]) ? ' → ' + esc(emp(a[1])) : ''); }).join(' · ')]].map(function (r) { return '<div><dt>' + r[0] + '</dt><dd>' + r[1] + '</dd></div>'; }).join('') + '</dl>' +
      '<p class="ins5-m">' + t(L('Dampak ', 'Impact ')) + rpj(x.impact) + ' · KPI ' + lnk('KPI-DTL-001', x.src, esc(x.src)) + (tasks.length ? ' · ' + tasks.length + ' ' + t(L('tindak lanjut', 'follow-ups')) : '') + '</p>' +
      (compact ? '' : '<div class="att5-a">' + acts.map(function (a) { return '<button type="button" class="btn btn-ghost btn-sm" data-act="ins" data-val="' + esc(x.id + '|' + a[0]) + '">' + ic(a[2]) + '<span>' + t(a[1]) + '</span></button>'; }).join('') + '</div>') +
      (tasks.length && !compact ? '<ul class="tk5">' + tasks.map(function (k) { return '<li>' + ic('checkc') + '<span>' + esc(k.id) + ' · ' + esc(k.act) + (k.owner ? ' → ' + esc(emp(k.owner)) : '') + (k.due ? ' · ' + dt(k.due) : '') + (k.note ? ' · ' + esc(k.note) : '') + '</span></li>'; }).join('') + '</ul>' : '') + '</article>';
  }
  H.insightCard = insightCard;
  function insAct(el) {
    var p = el.getAttribute('data-val').split('|'), x = P.insight(p[0]), a = p[1], c = cx();
    if (a === 'open') { var o = by(x.acts.map(function (y) { return { k: y[0], s: y[1], tab: y[2] }; }), 'k', 'open'); if (o && open(o.s)) A.go(o.s, null, o.tab ? { tab: o.tab } : null); else A.go('KPI-DTL-001', x.src); return; }
    if (a === 'approve') { A.go('APR-INB-001'); return; }
    if (a === 'investigate') { var r = P.insightAct(c, x.id, 'investigate'); if (!r.ok) { A.toast(r.msg, 'crit'); return; } after(L('Investigasi ' + r.task.id + ' dibuat.', 'Investigation ' + r.task.id + ' created.')); return; }
    var body = (a === 'assign' || a === 'task' || a === 'review' ? fld(a === 'review' ? L('Reviewer', 'Reviewer') : 'Owner', sel('owner', peopleOpts(), 'EMP-010')) : '') + (a === 'due' || a === 'task' ? fld(L('Due date', 'Due date'), inp('due', '2026-10-13', { type: 'date' })) : '') + fld(L('Catatan', 'Note'), area('note', ''), { wide: true, req: a === 'note' });
    var lab = by(P.MGMT_ACTIONS.map(function (y) { return { k: y[0], l: y[1] }; }), 'k', a).l;
    dlg({ title: lab, sub: t(x.t), body: body, ok: lab, onOk: function (v) { var r = P.insightAct(c, x.id, a, v); if (!r.ok) return r.msg; after(L('Tindak lanjut ' + r.task.id + ' dicatat.', 'Follow-up ' + r.task.id + ' recorded.')); return true; } });
  }
  function diTabs(cur) { return tabs([['DI-BRF-001', 'Executive Brief', 'bulb'], ['DI-INS-001', 'Insight', 'sparkles'], ['DI-DEC-001', 'Decision Log', 'filecheck'], ['DI-RPT-001', 'Report Library', 'file']].filter(function (x) { return open(x[0]); }), cur, null, { hf: function (k) { return href(k); }, label: 'Decision Intelligence' }); }
  V['DI-BRF-001'] = {
    render: function () {
      var b = P.brief();
      function sec(title, icon, rows, go) { return '<section class="brf5"><h3 class="h5">' + ic(icon) + '<span>' + t(title) + '</span>' + (go && open(go[0]) ? '<a class="card-l" href="' + href(go[0], null, go[1]) + '">' + t(L('Detail', 'Detail')) + ic('chevr') + '</a>' : '') + '</h3>' + kv(rows) + '</section>'; }
      return A.pageHead(null, t(L('Ringkasan untuk keputusan hari ini · ', 'Brief for today\'s decisions · ')) + dt(P.TODAY)) + diTabs('DI-BRF-001') +
        '<div class="brfs5">' +
          sec(L('Keuangan', 'Financial'), 'coins', [[L('Kas tersedia', 'Available cash'), rpj(b.fin.cash)], ['Revenue MTD', rpj(b.fin.rev) + ' · ' + pct(b.fin.revVs)], [L('Net profit (Sep)', 'Net profit (Sep)'), rpj(b.fin.net) + ' · NM ' + pct(b.fin.nm)], ['AR', rpj(b.fin.ar) + ' · ' + t(L('jatuh tempo ', 'overdue ')) + rpj(b.fin.arOver)]], ['FIN-HLT-001']) +
          sec(L('Operasional', 'Operations'), 'washer', [[L('Volume (Sep)', 'Volume (Sep)'), fmt.num(b.ops.vol, 0) + ' kg'], ['SLA', pct(b.ops.sla)], [L('Kapasitas', 'Capacity'), pct(b.ops.cap)]], ['EXE-PIL-001']) +
          sec(L('Klien', 'Client'), 'hotel', [[L('Pertumbuhan', 'Growth'), pct(b.cli.growth)], [L('Penurunan', 'Decline'), t(b.cli.decline)], [L('Komplain /1.000', 'Complaints /1,000'), fmt.num(b.cli.complaint, 1)]]) +
          sec('People', 'users', [['Teamwork Score', sc1(b.ppl.team)], [L('Karyawan perlu perhatian', 'Employees needing attention'), b.ppl.risk]], ['TEAM-001']) +
          sec('Ambidex', 'target', [['XScore', sc1(b.amb.xscore) + ' ' + delta(b.amb.xdelta)], [L('Progres goal', 'Goal progress'), pct(b.amb.goal, 0)], ['Weekly Race on track', esc(b.amb.race)], ['Reflection', sc1(b.amb.refl)]], ['XSC-001']) +
        '</div>' +
        '<div class="grid2">' + card(L('Alert prioritas', 'Priority alerts'), '<ol class="atts5">' + b.alerts.map(H.attItem).join('') + '</ol>' + note(t(L('Urutan: severity → dampak finansial → bobot KPI → dampak strategis → due time.', 'Order: severity → financial impact → KPI weight → strategic impact → due time.')), 'sort'), { icon: 'alert', count: b.alerts.length }) +
          card(L('Rekomendasi', 'Recommendations'), b.recs.map(function (x) { return insightCard(x, true); }).join(''), { icon: 'bulb', link: open('DI-INS-001') ? ['DI-INS-001', L('Semua insight', 'All insights')] : null }) + '</div>';
    },
    act: { att: H.attAct }
  };
  V['DI-INS-001'] = {
    render: function (c) {
      var ty = c.q.type || '', all = P.insights(), rows = ty ? all.filter(function (x) { return x.type === ty; }) : all;
      return A.pageHead(null, t(L('Setiap insight menjawab WHAT · WHY · RISK · RECOMMENDATION · ACTION.', 'Every insight answers WHAT · WHY · RISK · RECOMMENDATION · ACTION.'))) + diTabs('DI-INS-001') +
        tabs([['', L('Semua', 'All'), null, all.length]].concat(Object.keys(P.INS_TYPE).map(function (k) { return [k, P.INS_TYPE[k].n, P.INS_TYPE[k].icon, all.filter(function (x) { return x.type === k; }).length]; })), ty, 'type', { def: '', label: L('Jenis insight', 'Insight type') }) +
        (ty ? note(t(P.INS_TYPE[ty].d), P.INS_TYPE[ty].icon) : '') +
        '<div class="inss5">' + rows.map(function (x) { return insightCard(x); }).join('') + '</div>' + (!can('di.act') ? note(t(L('Tindakan manajemen hanya untuk pemegang izin tindak lanjut insight.', 'Management actions are only for holders of the insight action permission.')), 'lock') : '');
    },
    act: { ins: insAct }
  };
  var DEC_ST = ['notstarted', 'progress', 'on', 'risk', 'done', 'cancelled'];
  V['DI-DEC-001'] = {
    render: function () {
      var rows = P.decisions();
      return A.pageHead(null, t(L('Keputusan penting, owner, hasil yang diharapkan dan hasil aktual.', 'Important decisions, owners, expected and actual results.')), A.pbtn('di.act', 'primary', L('Catat Keputusan', 'Record Decision'), 'plus', { act: 'add' })) + diTabs('DI-DEC-001') +
        card('Decision Log', A.list(rows, [
          { h: L('Keputusan', 'Decision'), v: function (d) { return '<b>' + t(d.d) + '</b><small class="sub5">' + esc(d.id) + ' · ' + dt(d.at) + (d.src ? ' · ' + esc(d.src) : '') + '</small>'; } },
          { h: 'Owner', v: function (d) { return esc(emp(d.owner)); } }, { h: 'Due', v: function (d) { return dt(d.due); } }, { h: L('Hasil diharapkan', 'Expected result'), v: function (d) { return t(d.exp || '—'); } },
          { h: 'Follow-up', v: function (d) { return dt(d.fu); } }, { h: L('Hasil aktual', 'Actual result'), v: function (d) { return t(d.act || '—'); } }, { h: L('Status', 'Status'), v: function (d) { return stc(d.status); } },
          { h: '', v: function (d) { return can('di.act') ? '<button type="button" class="btn btn-ghost btn-sm" data-act="upd" data-val="' + esc(d.id) + '">' + ic('edit') + '<span>' + t(L('Update', 'Update')) + '</span></button>' : ''; } }
        ], function (d) { return { t: t(d.d), s: esc(emp(d.owner)) + ' · ' + dt(d.due) + ' · ' + t(d.exp || ''), chip: stc(d.status) }; }, null, { dense: true }), { icon: 'filecheck', count: rows.length });
    },
    act: {
      add: function () {
        var c = cx();
        dlg({ title: L('Catat keputusan', 'Record decision'), body: fld(L('Keputusan', 'Decision'), inp('d', ''), { req: true, wide: true }) + fld(L('Sumber / insight', 'Source / insight'), sel('src', [['', '—']].concat(P.insights().map(function (x) { return [x.id, [x.id + ' · ' + x.t[0], x.id + ' · ' + x.t[1]]]; })), '')) +
          '<div class="fg5">' + fld('Owner', sel('owner', peopleOpts(), 'EMP-010'), { req: true }) + fld('Due', inp('due', '2026-10-13', { type: 'date' }), { req: true }) + fld('Follow-up', inp('fu', '2026-10-16', { type: 'date' })) + '</div>' + fld(L('Hasil diharapkan', 'Expected result'), inp('exp', ''), { wide: true }), ok: L('Simpan', 'Save'),
          onOk: function (v) { if (!v.d) return P.MSG.invalid; var r = P.decisionAdd(c, { d: [v.d, v.d], src: v.src || null, owner: v.owner, due: v.due, fu: v.fu || v.due, exp: v.exp ? [v.exp, v.exp] : '' }); if (!r.ok) return r.msg; after(L('Keputusan ' + r.d.id + ' dicatat.', 'Decision ' + r.d.id + ' recorded.')); return true; } });
      },
      upd: function (el) {
        var c = cx(), d = by(P.decisions(), 'id', el.getAttribute('data-val'));
        dlg({ title: L('Update keputusan', 'Update decision'), sub: t(d.d), body: fld(L('Status', 'Status'), sel('status', DEC_ST.map(function (k) { return [k, P.ST[k].n]; }), d.status)) + fld(L('Hasil aktual', 'Actual result'), inp('act', T(d.act)), { wide: true }) + fld(L('Bukti', 'Evidence'), inp('ev', d.ev || '')),
          onOk: function (v) { var r = P.decisionUpdate(c, d.id, { status: v.status, act: v.act ? [v.act, v.act] : d.act, ev: v.ev }); if (!r.ok) return r.msg; after(L('Keputusan diperbarui.', 'Decision updated.')); return true; } });
      }
    }
  };
  var SCORES = [
    ['Business Health Score', L('Snapshot kondisi bisnis dari 6 pilar (keuangan, operasional, klien, kualitas, people, masa depan).', 'Condition snapshot of six business pillars (financial, operations, client, quality, people, future).')],
    ['Financial Health Score', L('Scorecard khusus keuangan: revenue, margin, kas, collection, AR, biaya, quick ratio.', 'Finance-only scorecard: revenue, margin, cash, collection, AR, cost, quick ratio.')],
    ['XScore', L('Kinerja periode pada kerangka KPI Ambidex (eksploitasi 80% · eksplorasi 20%).', 'Period performance on the Ambidex KPI framework (exploitation 80% · exploration 20%).')],
    ['Teamwork Score', L('Hasil KPI bersama tim, bukan rata-rata skor anggota.', 'Shared team KPI results, never an average of member scores.')],
    ['Personal Score', L('KPI individu + kontribusi tim, formula sesuai peran.', 'Individual KPIs + team contribution, formula by role.')]
  ];
  V['DI-RPT-001'] = {
    render: function (c) {
      var c0 = cx(), reps = P.reports(c0), cur = by(reps, 'k', c.q.r) || null;
      var prev = cur && cur.allowed ? P.reportRows(cur.k) : null;
      return A.pageHead(null, t(L('Laporan siap pakai. Export PDF, Excel atau CSV sesuai izin.', 'Ready-made reports. Export to PDF, Excel or CSV where permitted.'))) + diTabs('DI-RPT-001') +
        '<div class="rps5">' + reps.map(function (r) {
          return '<article class="rp5' + (cur && cur.k === r.k ? ' on' : '') + (r.allowed ? '' : ' off') + '"><div class="rp5-h"><span class="pl5-ic">' + ic(r.icon) + '</span><b>' + t(r.n) + '</b></div><p>' + t(r.d) + '</p>' +
            (r.allowed ? '<div class="rp5-a"><a class="btn btn-ghost btn-sm" href="' + qhref({ r: r.k }) + '">' + ic('eye') + '<span>' + t(L('Pratinjau', 'Preview')) + '</span></a>' + (r.exportable ? P.EXPORT_FORMATS.map(function (f) { return '<button type="button" class="btn btn-ghost btn-sm" data-act="exp" data-val="' + esc(r.k + '|' + f[0]) + '">' + ic('download') + '<span>' + f[1] + '</span></button>'; }).join('') : '') + '</div>' + (!r.exportable ? '<small class="sub5">' + t(L('Lihat saja (tanpa izin export)', 'View only (no export permission)')) + '</small>' : '')
              : A.chip('mute', L('Tanpa akses', 'No access'), 'lock')) + '</article>';
        }).join('') + '</div>' +
        (prev ? card(T(L('Pratinjau: ', 'Preview: ')) + T(cur.n), '<div class="tblw"><table class="tbl dense"><thead><tr>' + prev[0].map(function (h) { return '<th>' + t(h) + '</th>'; }).join('') + '</tr></thead><tbody>' + prev.slice(1).map(function (row) { return '<tr>' + row.map(function (v) { return '<td class="' + (typeof v === 'number' ? 'r num' : '') + '">' + (typeof v === 'number' ? (v > 1e5 ? rpj(v) : fmt.num(v, v % 1 ? 1 : 0)) : v == null ? '—' : t(v)) + '</td>'; }).join('') + '</tr>'; }).join('') + '</tbody></table></div>', { icon: 'eye' }) : '') +
        card(L('Lima skor, lima arti', 'Five scores, five meanings'), '<ul class="sc5d">' + SCORES.map(function (s) { return '<li><b>' + esc(s[0]) + '</b><span>' + t(s[1]) + '</span></li>'; }).join('') + '</ul>', { icon: 'info' });
    },
    act: {
      exp: function (el) {
        var p = el.getAttribute('data-val').split('|'), r = P.exportReport(cx(), p[0], p[1]);
        if (!r.ok) { A.toast(r.msg, 'crit'); return; }
        if (p[1] === 'csv') download(r.name, '﻿' + r.content, 'text/csv;charset=utf-8');
        else if (p[1] === 'xls') download(r.name, '<html><head><meta charset="utf-8"></head><body>' + r.content + '</body></html>', 'application/vnd.ms-excel');
        else {
          var w = window.open('', '_blank');
          if (!w) { A.toast(L('Pop-up diblokir. Izinkan pop-up untuk export PDF.', 'Pop-up blocked. Allow pop-ups to export PDF.'), 'warn'); return; }
          w.document.write('<!doctype html><html><head><meta charset="utf-8"><title>' + esc(r.name) + '</title><style>body{font-family:Inter,Arial,sans-serif;padding:24px;color:#0B1E37}h1{color:#0754A6;font-size:20px}table{border-collapse:collapse;width:100%}td,th{border:1px solid #D6E2F0;padding:6px 8px;font-size:12px;text-align:left}th{background:#E6EEF7}</style></head><body><h1>JFRESH OS · ' + esc(r.name) + '</h1><table>' + r.rows.map(function (row, i) { return '<tr>' + row.map(function (v) { return (i ? '<td>' : '<th>') + esc(Array.isArray(v) ? T(v) : v == null ? '' : v) + (i ? '</td>' : '</th>'); }).join('') + '</tr>'; }).join('') + '</table></body></html>');
          w.document.close(); w.focus(); setTimeout(function () { w.print(); }, 300);
        }
        A.toast(L('Laporan ' + r.name + ' diexport.', 'Report ' + r.name + ' exported.'));
      }
    }
  };
})();
