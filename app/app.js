/* ==========================================================================
   JFRESH OS — Phase 2 app shell
   Role-based shell (sidebar / rail / bottom nav), router, permission checks,
   screen states and shared UI helpers. Screens live in screens.js and are
   registered in JFAPP.V by screen ID from the shared config (jfos-config.js).

   Route: #/<role>/<SCREEN-ID>[/<record>][?state=loading|empty|error|warning|success|noperm|offline&k=v]

   Phase 4: the shell runs only inside a valid session (jfos-access.js). The
   session decides role, plant, permissions, menus and landing page; the URL
   role segment never grants access. Every render goes through
   JFACCESS.authorize(). A production backend must repeat the same checks.
   ========================================================================== */
(function () {
  var C = window.JFOS, DB = window.JFDB, X = window.JFACCESS;
  if (X) X.registerScreens(C);
  var AX = { ctx: null, R: null, denied: null, warned: false, lastTouch: 0 };
  var MQ_M = window.matchMedia('(max-width: 699px)');
  var MQ_T = window.matchMedia('(min-width: 700px) and (max-width: 1239px)');
  var S = { role: 'operator', screen: null, rec: null, q: {}, force: null, lang: 'id', sbCollapsed: false, sbOpen: false, sheet: false, timer: null, cur: null };
  try { S.lang = localStorage.getItem('jfresh-lang') === 'en' ? 'en' : 'id'; } catch (e) {}
  try { S.sbCollapsed = localStorage.getItem('jfos-sb') === '1'; } catch (e) {}
  // Phase 3 components (JFDS) read the language from JF.lang().
  if (!window.JF) window.JF = { lang: function () { return S.lang; }, onLang: function () {} };

  /* ---------- Basics ---------- */
  function T(p) { return p == null ? '' : (Array.isArray(p) ? (S.lang === 'en' ? p[1] : p[0]) : String(p)); }
  function L(id, en) { return [id, en === undefined ? id : en]; }
  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function t(p) { return esc(T(p)); }
  function ic(n, cls) { return '<svg class="i' + (cls ? ' ' + cls : '') + '" aria-hidden="true"><use href="#i-' + n + '"/></svg>'; }
  function R() { return AX.R || C.ROLES[S.role]; }
  function can(p) { return !p || (AX.ctx ? X.can(AX.ctx, p) : C.can(S.role, p)); }
  function mode() { return MQ_M.matches ? 'm' : (MQ_T.matches ? 't' : 'd'); }
  /* Plant / client scope (§13, §63): screens only ever see records inside the
     session's scope. The arrays hold the same objects, so edits still save. */
  function db() {
    var d = DB.get(), ctx = AX.ctx;
    if (!ctx || (ctx.allPlants && ctx.plant === X.ALL && !ctx.client)) return d;
    var w = Object.create(d);
    w.orders = d.orders.filter(function (o) { return X.inScope(ctx, o); });
    w.issues = d.issues.filter(function (i) { var o = DB.order(i.ord); return !o || X.inScope(ctx, o); });
    return w;
  }
  function now() { return Date.now(); }

  var fmt = {
    num: function (n, d) { return Number(n).toLocaleString(S.lang === 'en' ? 'en-US' : 'id-ID', { minimumFractionDigits: d || 0, maximumFractionDigits: d == null ? 1 : d }); },
    kg: function (n) { return n == null ? '—' : fmt.num(n, n % 1 ? 1 : 0) + ' kg'; },
    rp: function (n) { return 'Rp ' + Number(Math.round(n)).toLocaleString('id-ID'); },
    rpShort: function (n) { return n >= 1e9 ? 'Rp ' + fmt.num(n / 1e9, 2) + (S.lang === 'en' ? ' B' : ' M') : n >= 1e6 ? 'Rp ' + fmt.num(n / 1e6, 1) + (S.lang === 'en' ? ' M' : ' jt') : fmt.rp(n); },
    time: function (ts) { var d = new Date(ts); return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0'); },
    date: function (ts) {
      var d = new Date(ts), m = S.lang === 'en' ? ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] : ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
      return d.getDate() + ' ' + m[d.getMonth()] + ' ' + d.getFullYear();
    },
    when: function (ts) {
      var d = new Date(ts), td = new Date(); td.setHours(0, 0, 0, 0);
      if (ts >= td.getTime() && ts < td.getTime() + 864e5) return (S.lang === 'en' ? 'Today ' : 'Hari ini ') + fmt.time(ts);
      if (ts >= td.getTime() - 864e5 && ts < td.getTime()) return (S.lang === 'en' ? 'Yesterday ' : 'Kemarin ') + fmt.time(ts);
      return fmt.date(ts) + ' ' + fmt.time(ts);
    },
    dur: function (ms) {
      var neg = ms < 0; ms = Math.abs(ms);
      var h = Math.floor(ms / 36e5), m = Math.floor(ms % 36e5 / 6e4), d = Math.floor(h / 24);
      var en = S.lang === 'en', s;
      if (d >= 2) s = d + (en ? ' days' : ' hari');
      else if (h) s = h + (en ? ' h ' : ' jam ') + m + (en ? ' min' : ' menit');
      else s = m + (en ? ' min' : ' menit');
      return { s: s, neg: neg };
    },
    ago: function (ts) { var x = fmt.dur(now() - ts); return S.lang === 'en' ? x.s + ' ago' : x.s + ' lalu'; }
  };

  /* SLA chip: info / warning (≤ 1 h) / critical (late). Always icon + text. */
  function slaInfo(due) {
    var left = due - now(), d = fmt.dur(left);
    if (left < 0) return { tone: 'crit', icon: 'alert', txt: S.lang === 'en' ? 'Late ' + d.s : 'Terlambat ' + d.s };
    if (left <= 36e5) return { tone: 'warn', icon: 'clock', txt: S.lang === 'en' ? d.s + ' left' : d.s + ' tersisa' };
    return { tone: 'info', icon: 'clock', txt: S.lang === 'en' ? d.s + ' left' : d.s + ' tersisa' };
  }
  function slaChip(due, big) { var x = slaInfo(due); return '<span class="chip ' + x.tone + (big ? ' chip-lg' : '') + '" data-due="' + due + '">' + ic(x.icon) + '<span>' + esc(x.txt) + '</span></span>'; }
  function chip(tone, txt, icon) { return '<span class="chip ' + tone + '">' + (icon ? ic(icon) : '') + '<span>' + t(txt) + '</span></span>'; }
  function stage(k) { return C.STAGES.filter(function (s) { return s.k === k; })[0]; }
  function stageIdx(k) { return C.STAGES.map(function (s) { return s.k; }).indexOf(k); }
  function typeL(k) { return DB.TYPES[k] || [k, k]; }
  function cname(id) { var c = DB.client(id); return c ? c.n : id; }

  /* ---------- Audit (§23): user, time, event, record, previous, new ---------- */
  function audit(ev, rec, from, to) {
    var d = db();
    d.audit.unshift({ at: now(), by: R().person, uid: AX.ctx ? AX.ctx.uid : null, role: AX.ctx ? AX.ctx.roleKey : S.role, ev: ev, rec: rec, from: from == null ? null : String(from), to: to == null ? null : String(to) });
    var o = DB.order(rec);
    if (o) o.history.push({ at: now(), by: R().person, ev: ev, from: from, to: to });
  }

  /* ---------- Router ---------- */
  function parse() {
    var h = (location.hash || '').replace(/^#\/?/, '');
    var qi = h.indexOf('?'), qs = qi >= 0 ? h.slice(qi + 1) : '';
    if (qi >= 0) h = h.slice(0, qi);
    var p = h.split('/').filter(Boolean).map(decodeURIComponent);
    var q = {};
    qs.split('&').forEach(function (kv) { if (!kv) return; var a = kv.split('='); q[decodeURIComponent(a[0])] = decodeURIComponent(a[1] || ''); });
    var role = C.ROLES[p[0]] ? p[0] : 'operator';
    var screen = p[1] && C.screen(p[1]) ? p[1] : C.ROLES[role].nav[0].s;
    if (AX.ctx) { role = AX.ctx.exp; if (!p[1] || !C.screen(p[1])) screen = AX.ctx.landing; }
    return { role: role, screen: screen, rec: p[2] || null, q: q, urlRole: p[0] || null, urlScreen: p[1] || null };
  }
  function href(screen, rec, q, role) {
    var h = '#/' + (role || S.role) + '/' + screen + (rec ? '/' + encodeURIComponent(rec) : '');
    var qs = []; for (var k in q || {}) if (q[k] != null) qs.push(k + '=' + encodeURIComponent(q[k]));
    return h + (qs.length ? '?' + qs.join('&') : '');
  }
  function go(screen, rec, q) { location.hash = href(screen, rec, q); }

  /* Safe back: each screen has an explicit parent; the first one this role can open wins. */
  var PARENT = {
    'OPS-RCV-001': ['OPS-RCV-002'], 'OPS-RCV-002': ['OPS-TSK-001', 'OPS-BRD-001'],
    'OPS-SRT-001': ['OPS-SRT-002'], 'OPS-SRT-002': ['OPS-TSK-001', 'OPS-BRD-001'],
    'OPS-WSH-001': ['OPS-WSH-002'], 'OPS-WSH-002': ['OPS-TSK-001', 'OPS-BRD-001'],
    'OPS-QC-001': ['OPS-QC-002'], 'OPS-QC-003': ['OPS-QC-001'], 'OPS-QC-002': ['OPS-TSK-001'],
    'OPS-PAC-001': ['OPS-PAC-002'], 'OPS-PAC-002': ['OPS-TSK-001', 'OPS-BRD-001'],
    'OPS-PKP-001': ['OPS-PKP-002'], 'OPS-DLV-001': ['OPS-DLV-002'], 'OPS-DLV-003': ['OPS-DLV-001'],
    'OPS-TRK-001': ['OPS-HIS-001', 'OPS-BRD-001', 'SLA-MON-001'], 'QLT-ISS-002': ['QLT-ISS-001'],
    'FIN-INV-002': ['FIN-INV-001'], 'FIN-PAY-001': ['FIN-PAY-002'], 'FIN-CN-002': ['FIN-CN-001'],
    'COM-CLI-002': ['COM-CLI-001'], 'COM-CTR-002': ['COM-CTR-001'], 'COM-RTC-002': ['COM-RTC-001'], 'INV-ADJ-001': ['INV-STK-001'],
    'CLT-ORD-002': ['CLT-ORD-001'], 'SYS-USR-001': ['SYS-HUB-001'], 'SYS-ROL-001': ['SYS-HUB-001'], 'SYS-AUD-001': ['SYS-HUB-001'], 'SYS-MD-001': ['SYS-HUB-001'], 'SYS-SET-001': ['SYS-HUB-001'],
    'RPT-OPS-001': ['RPT-LIB-001'], 'RPT-FIN-001': ['RPT-LIB-001'], 'RPT-COM-001': ['RPT-LIB-001'], 'RPT-CLI-001': ['RPT-LIB-001'], 'RPT-PPL-001': ['RPT-LIB-001'],
    'QLT-DSH-001': ['RPT-LIB-001'], 'SLA-MON-001': ['RPT-LIB-001'], 'PRD-DSH-001': ['RPT-LIB-001'], 'FIN-AR-001': ['RPT-LIB-001'], 'INV-STK-001': ['RPT-LIB-001'], 'OPS-BRD-001': ['RPT-LIB-001'],
    'LOG-FLT-001': ['RPT-LIB-001'], 'APR-INB-001': [], 'OPS-ISS-001': [],
    'NOTIF-002': ['NOTIF-001'], 'NOTIF-003': ['NOTIF-001'], 'USER-002': ['USER-001'], 'USER-003': ['USER-001'], 'USER-004': ['USER-001']
  };
  function navItems(r) { return r.nav.concat(r.extra || []); }
  function isRoot(id) { var r = R(); return navItems(r).concat(r.mnav).some(function (n) { return n.s === id || (n.also || []).indexOf(id) >= 0; }); }
  function parentOf(id) {
    if (isRoot(id)) return null;
    var c = (PARENT[id] || []).filter(function (p) { return can(C.screen(p).p); });
    return c[0] || R().nav[0].s;
  }
  function chain(id) { var out = [id], p, guard = 0; while ((p = parentOf(out[0])) && guard++ < 6) { out.unshift(p); if (isRoot(p)) break; } return out; }
  function activeNav(id) {
    if (C.screen(id).p4) return 'menu';      // profile, notifications, help: reached from the header / Lainnya
    var ch = chain(id);
    for (var i = ch.length - 1; i >= 0; i--) {
      var hit = navItems(R()).concat(R().mnav).filter(function (n) { return n.s === ch[i] || (n.also || []).indexOf(ch[i]) >= 0; })[0];
      if (hit) return hit.k;
    }
    return 'home';
  }

  /* ---------- Session & access (Phase 4 · NP-02, NP-05, NP-07) ---------- */
  // Experience = Phase 2 role shell. Menus, person, plant and client come from the session.
  function buildR(ctx) {
    var base = C.ROLES[ctx.exp], land = C.screen(ctx.landing);
    function lainnya(n) { return n.k === 'menu' ? Object.assign({}, n, { l: L('Lainnya', 'More') }) : n; }
    var nav = ctx.nav.slice(), mnav = ctx.mnav.map(lainnya);
    // A landing page outside the shared menu (e.g. QC Inspector → QC queue) gets its own entry.
    if (land && !nav.some(function (n) { return n.s === ctx.landing; })) {
      var item = { k: 'land', l: land.n, i: land.icon || 'shield', s: ctx.landing };
      nav.splice(1, 0, item);
      var tasks = mnav.filter(function (n) { return n.k !== 'menu'; }), menu = mnav.filter(function (n) { return n.k === 'menu'; });
      tasks.splice(1, 0, Object.assign({}, item, { l: L('QC', 'QC') }));
      mnav = tasks.slice(0, 4).concat(menu);
    }
    var site = ctx.client ? cname(ctx.client) : ctx.exp === 'driver' && ctx.employee && ctx.employee.vehicle ? 'Armada ' + ctx.employee.vehicle : T(X.plantName(ctx.plant));
    AX.R = Object.assign({}, base, {
      nav: nav, mnav: mnav, extra: (base.extra || []).filter(function (n) { return X.canScreen(ctx, n.s); }),
      person: ctx.name, title: ctx.role.n, site: site, clientId: ctx.client, perms: ctx.perms, roleKey: ctx.roleKey
    });
  }
  // Where an ended or refused session goes (login.html routes, see login.js).
  function toLogin(code) {
    var next = '?next=' + encodeURIComponent(location.hash || '');
    var map = { none: '#/', expired: '#/sesi-berakhir?why=expired', revoked: '#/sesi-berakhir?why=revoked', changed: '#/sesi-berakhir?why=changed',
      inactive: '#/nonaktif', suspended: '#/ditangguhkan', locked: '#/terkunci', no_role: '#/tanpa-peran?c=no_role', no_plant: '#/tanpa-peran?c=no_plant', no_employee: '#/tanpa-peran?c=no_employee' };
    var keepNext = code === 'none' || code === 'expired';
    AX.ctx = null; AX.R = null;
    location.replace('login.html' + (keepNext ? next : '') + (map[code] || '#/'));
  }
  // The record a route points at, for the plant / client scope check.
  function recordOf(rec) {
    if (!rec) return null;
    var o = DB.order(rec); if (o) return o;
    var i = DB.issue && DB.issue(rec); if (i) return DB.order(i.ord) || null;
    return null;
  }
  function guard() {
    var v = X.validate();
    if (!v.ok) { toLogin(v.code); return false; }
    AX.ctx = v.ctx; buildR(v.ctx);
    return v;
  }
  function logout() { X.logout('user'); AX.ctx = null; location.replace('login.html?out=1#/'); }
  function sessionSwitch(res, msg) {
    if (!res || !res.ok) { toast(L('Anda tidak memiliki akses.', 'You do not have access.'), 'crit'); return; }
    AX.ctx = res.ctx; buildR(res.ctx);
    location.hash = href(res.ctx.landing, null, null, res.ctx.exp);
    if (S.screen === res.ctx.landing) render();
    setTimeout(function () { toast(msg); }, 250);
  }

  // Session timer (§50): warn before idle expiry, end the session when it runs out,
  // pick up admin changes (role, permission, plant, status) on the next check.
  function sessionTick() {
    if (!AX.ctx) return;
    var v = X.validate();
    if (!v.ok) { toLogin(v.code); return; }
    var left = X.expiresAt(v.ses) - X.now();
    if (left <= X.POLICY.warnBefore) showWarn(left); else hideWarn();
    if (v.changed) { AX.ctx = v.ctx; buildR(v.ctx); render(); setTimeout(function () { toast(L('Hak akses Anda diperbarui.', 'Your access was updated.'), 'warn'); }, 250); }
  }
  function showWarn(left) {
    var el = document.getElementById('sx'); if (!el) return;
    var m = Math.max(0, Math.ceil(left / 1000)), txt = m >= 60 ? Math.ceil(m / 60) + (S.lang === 'en' ? ' min' : ' menit') : m + (S.lang === 'en' ? ' sec' : ' detik');
    if (el.hidden) {
      el.innerHTML = '<div class="sx-p" role="alertdialog" aria-modal="true" aria-labelledby="sx-t" aria-describedby="sx-d"><span class="state-ic st-warn-ic">' + ic('clock') + '</span>' +
        '<h2 id="sx-t">' + t(L('Sesi Anda akan segera berakhir', 'Your session is about to end')) + '</h2>' +
        '<p id="sx-d">' + t(L('Tidak ada aktivitas. Sesi berakhir dalam', 'No activity. The session ends in')) + ' <b id="sx-n">' + esc(txt) + '</b>.</p>' +
        '<div class="ds-btnbar">' + btn('ghost', L('Keluar', 'Sign Out'), 'logout', { act: 'logout' }) + btn('primary', L('Perpanjang Sesi', 'Extend Session'), 'refresh', { act: 'extend', id: 'sx-go' }) + '</div></div>';
      el.hidden = false; AX.warned = true;
      var b = document.getElementById('sx-go'); if (b) b.focus();
    } else { var n = document.getElementById('sx-n'); if (n) n.textContent = txt; }
  }
  function hideWarn() { var el = document.getElementById('sx'); if (el && !el.hidden) { el.hidden = true; el.innerHTML = ''; } AX.warned = false; }
  function activity() {
    if (!AX.ctx || AX.warned) return;                 // while warning, only "Perpanjang Sesi" extends
    var n = X.now(); if (n - AX.lastTouch < 15000) return;
    AX.lastTouch = n; X.touch();
  }

  /* Popover menus: profile, plant, notifications shortcut */
  function closePops() { document.querySelectorAll('.pop').forEach(function (p) { p.hidden = true; }); document.querySelectorAll('[aria-expanded="true"]').forEach(function (b) { b.setAttribute('aria-expanded', 'false'); }); }
  function openPop(id, anchor) {
    var p = document.getElementById(id); if (!p) return;
    var was = !p.hidden; closePops(); if (was) return;
    p.hidden = false; anchor.setAttribute('aria-expanded', 'true');
    var r = anchor.getBoundingClientRect(), w = p.offsetWidth, vw = document.documentElement.clientWidth;
    p.style.top = Math.round(r.bottom + 6) + 'px';
    p.style.left = Math.round(Math.max(12, Math.min(r.right - w, vw - w - 12))) + 'px';
    var f = p.querySelector('a,button'); if (f) f.focus({ preventScroll: true });
  }
  function plantPop() {
    var ctx = AX.ctx; if (!ctx || ctx.client || ctx.plants.length < 2) return '';
    return '<div class="pop" id="pop-plant" role="menu" hidden><div class="pop-cap">' + t(L('Pilih plant', 'Choose plant')) + '</div>' + ctx.plants.map(function (pid) {
      return '<button type="button" class="pop-a' + (pid === ctx.plant ? ' is-on' : '') + '" role="menuitemradio" aria-checked="' + (pid === ctx.plant) + '" data-act="plant" data-val="' + esc(pid) + '">' + ic(pid === X.ALL ? 'layers' : 'building') + '<span>' + t(X.plantName(pid)) + '</span></button>';
    }).join('') + '</div>';
  }
  function plantBtn() {
    var ctx = AX.ctx; if (!ctx || ctx.client) return '';
    var label = t(X.plantName(ctx.plant));
    if (ctx.plants.length < 2) return '<span class="hd-plant is-static hide-m">' + ic('building') + '<span>' + label + '</span></span>';
    return '<button type="button" class="hd-plant hide-m" id="hd-plant" aria-haspopup="menu" aria-expanded="false" aria-label="' + t(L('Plant aktif', 'Active plant')) + ': ' + label + '">' + ic('building') + '<span class="hide-m">' + label + '</span>' + ic('chevd') + '</button>';
  }
  function meItems(sheet) {
    var ctx = AX.ctx; if (!ctx) return '';
    var cls = sheet ? 'sheet-a' : 'pop-a';
    function a(screen, icon, label) { var on = S.screen === screen; return '<a class="' + cls + (on && sheet ? ' on' : '') + '" href="' + href(screen) + '" role="menuitem">' + (sheet ? '<span class="ni">' + ic(icon) + '</span><span class="nl">' + t(label) + '</span>' : ic(icon) + '<span>' + t(label) + '</span>') + '</a>'; }
    var h = a('USER-001', 'user', L('Profil Saya', 'My Profile')) + a('NOTIF-001', 'bell', L('Notifikasi', 'Notifications'));
    if (ctx.roles.length > 1 && ctx.user.switchRole) h += a('USER-003', 'swap', L('Ganti Peran', 'Switch Role'));
    if (!ctx.client && ctx.plants.length > 1) h += a('USER-004', 'building', L('Ganti Plant', 'Switch Plant'));
    h += a('USER-002', 'key', L('Ganti Password', 'Change Password')) + a('HELP-001', 'help', L('Bantuan', 'Help'));
    return h;
  }
  function mePop() {
    var r = R();
    return '<div class="pop" id="pop-me" role="menu" hidden><div class="pop-h"><span class="av">' + esc(r.person.charAt(0)) + '</span><span><b>' + esc(AX.ctx ? AX.ctx.fullName : r.person) + '</b><small>' + t(r.title) + ' · ' + esc(r.site) + '</small></span></div>' +
      meItems(false) + '<div class="pop-row"><span>' + t(L('Bahasa', 'Language')) + '</span>' + langSw() + '</div><div class="pop-sep"></div>' +
      '<button type="button" class="pop-a danger" data-act="logout" role="menuitem">' + ic('logout') + '<span>' + t(L('Keluar', 'Sign Out')) + '</span></button></div>';
  }
  function unread() { return AX.ctx ? X.unread(AX.ctx) : 0; }

  /* ---------- Shell ---------- */
  var STATE_OPTS = ['default', 'loading', 'empty', 'error', 'warning', 'success', 'noperm', 'offline'];
  // Demo bar: who is signed in, screen states and admin simulations (§49–§51, §60, §61).
  var SIMS = [
    ['', L('Simulasi admin…', 'Admin simulation…')],
    ['near', L('Sesi hampir habis', 'Session about to expire')],
    ['expire', L('Sesi berakhir', 'Session expired')],
    ['perm', L('Cabut 1 hak akses', 'Remove 1 permission')],
    ['plant', L('Cabut akses plant', 'Remove plant access')],
    ['inactive', L('Nonaktifkan akun', 'Deactivate account')],
    ['force', L('Paksa logout', 'Force logout')]
  ];
  function demoBar() {
    var st = STATE_OPTS.map(function (k) { var x = k === 'default' ? C.STATES['default'] : C.STATES[k]; return '<option value="' + k + '"' + ((S.force || 'default') === k ? ' selected' : '') + '>' + t(x.t) + '</option>'; }).join('');
    var sc = C.screen(S.screen), spec = sc && sc.p4 ? '../phase4/screens.html#' + esc(S.screen) : '../phase2/np06-screen-framework.html#' + esc(S.screen);
    var ctx = AX.ctx, sims = SIMS.filter(function (x) { return !(x[0] === 'plant' && ctx && ctx.client); });
    return '<div class="demo" role="region" aria-label="Demo">' +
      '<span class="demo-tag">' + ic('monitor') + '<span>' + t(L('Demo', 'Demo')) + '</span></span>' +
      (ctx ? '<span class="demo-who">' + ic('user') + '<span>' + esc(ctx.user.u) + ' · <b>' + t(ctx.role.n) + '</b></span></span>' +
        '<button type="button" class="demo-l" data-act="switch-account">' + ic('swap') + '<span>' + t(L('Ganti akun', 'Switch account')) + '</span></button>' : '') +
      '<label class="demo-f hide-m"><span class="sr">' + t(L('Simulasi admin', 'Admin simulation')) + '</span><select id="demo-sim">' + sims.map(function (x) { return '<option value="' + x[0] + '">' + t(x[1]) + '</option>'; }).join('') + '</select></label>' +
      '<label class="demo-f hide-m hide-t"><span>' + t(L('State layar', 'Screen state')) + '</span><select id="demo-state">' + st + '</select></label>' +
      '<span class="demo-sp"></span>' +
      '<a class="demo-l hide-m" href="' + spec + '">' + ic('file') + '<span>' + esc(S.screen) + '</span></a>' +
      '<button type="button" class="demo-l hide-m" id="demo-reset">' + ic('refresh') + '<span>' + t(L('Reset data', 'Reset data')) + '</span></button>' +
      '</div>';
  }
  function runSim(k) {
    var ctx = AX.ctx; if (!ctx || !k) return;
    if (k === 'near') { X.admin.nearExpiry(); sessionTick(); return; }
    if (k === 'expire') { X.admin.expire(); sessionTick(); return; }
    if (k === 'perm') {
      // Remove the permission behind the second menu item (never the home page).
      var n = R().nav.filter(function (x) { return x.s && x.s !== ctx.landing; })[0], p = n && C.screen(n.s).p;
      if (!p) { toast(L('Tidak ada hak akses yang bisa dicabut.', 'No permission to remove.'), 'warn'); return; }
      X.admin.setPerms(ctx.uid, ctx.acc.grant, ctx.acc.deny.concat([p]), 'Admin (demo)'); sessionTick(); return;
    }
    if (k === 'plant') { X.admin.setPlants(ctx.uid, [], 'Admin (demo)'); sessionTick(); return; }
    if (k === 'inactive') { X.admin.setStatus(ctx.uid, 'inactive', 'Admin (demo)'); sessionTick(); return; }
    if (k === 'force') { X.admin.forceLogout(ctx.uid, 'Admin (demo)'); sessionTick(); return; }
  }
  function navLink(n, cls) {
    var on = n.k === activeNav(S.screen);
    var badge = n.k === 'apr' ? aprCount() : n.k === 'issue' || n.k === 'issues' ? issueCount() : 0;
    return '<a class="' + cls + (on ? ' on' : '') + '" href="' + (n.s ? href(n.s) : '#') + '"' + (on ? ' aria-current="page"' : '') + (n.k === 'menu' ? ' data-sheet="1"' : '') + '>' +
      '<span class="ni">' + ic(n.i) + (badge ? '<b class="nb">' + badge + '</b>' : '') + '</span><span class="nl">' + t(n.l) + '</span></a>';
  }
  function aprCount() { return can('apr.view') ? db().approvals.filter(function (a) { return a.status === 'wait' && can(a.perm); }).length : 0; }
  function issueCount() { return db().issues.filter(function (i) { return i.status === 'open' || i.status === 'review'; }).length; }
  function greet() { var h = new Date().getHours(); return h < 11 ? L('Selamat Pagi', 'Good Morning') : h < 15 ? L('Selamat Siang', 'Good Afternoon') : h < 18 ? L('Selamat Sore', 'Good Afternoon') : L('Selamat Malam', 'Good Evening'); }

  function shell() {
    var r = R(), m = mode();
    var side = '<aside class="sb" aria-label="' + t(L('Navigasi utama', 'Main navigation')) + '">' +
      '<div class="sb-top"><a class="sb-logo" href="' + href(r.nav[0].s) + '"><img src="../assets/brand/jfresh-logo.png" alt="J\'Fresh Laundry" width="605" height="373"></a>' +
      '<button type="button" class="sb-tg" id="sb-toggle" aria-label="' + t(L('Ciutkan / buka menu', 'Collapse / expand menu')) + '">' + ic('sidebar') + '</button></div>' +
      '<div class="sb-os">JFRESH <b>OS</b></div>' +
      '<nav class="sb-nav">' + r.nav.map(function (n) { return navLink(n, 'sb-a'); }).join('') + '</nav>' +
      '<div class="sb-foot">' +
        '<a class="sb-a' + (S.screen === 'HELP-001' ? ' on' : '') + '" href="' + href('HELP-001') + '"><span class="ni">' + ic('help') + '</span><span class="nl">' + t(L('Bantuan', 'Help')) + '</span></a>' +
        '<a class="sb-a' + (S.screen === 'USER-001' ? ' on' : '') + '" href="' + href('USER-001') + '"><span class="ni">' + ic('user') + '</span><span class="nl">' + t(L('Profil', 'Profile')) + '</span></a>' +
        '<button type="button" class="sb-a" data-act="logout"><span class="ni">' + ic('logout') + '</span><span class="nl">' + t(L('Keluar', 'Sign Out')) + '</span></button>' +
      '</div>' +
      '<a class="sb-me" href="' + href('USER-001') + '"><span class="av">' + esc(r.person.charAt(0)) + '</span><span class="sb-me-t"><b>' + esc(r.person) + '</b><small>' + t(r.title) + ' · ' + esc(r.site) + '</small></span></a>' +
      '</aside>';
    var bottom = '<nav class="bn" aria-label="' + t(L('Navigasi bawah', 'Bottom navigation')) + '">' + r.mnav.map(function (n) { return navLink(n, 'bn-a'); }).join('') + '</nav>';
    var sheetItems = navItems(r).filter(function (n) { return !r.mnav.some(function (x) { return x.s === n.s || (x.also || []).indexOf(n.s) >= 0; }); });
    var sheet = '<div class="sheet" id="sheet" hidden><div class="sheet-bg" data-sheet="0"></div><div class="sheet-p" role="dialog" aria-label="Menu">' +
      '<div class="sheet-h"><b>' + t(L('Menu', 'Menu')) + '</b><button type="button" class="ib" data-sheet="0" aria-label="' + t(L('Tutup', 'Close')) + '">' + ic('x') + '</button></div>' +
      '<a class="sheet-me" href="' + href('USER-001') + '"><span class="av">' + esc(r.person.charAt(0)) + '</span><span><b>' + esc(r.person) + '</b><small>' + t(r.title) + ' · ' + esc(r.site) + '</small></span></a>' +
      '<nav class="sheet-nav">' + sheetItems.map(function (n) { return navLink(n, 'sheet-a'); }).join('') + meItems(true) + '</nav>' +
      '<div class="sheet-row"><span>' + t(L('Bahasa', 'Language')) + '</span>' + langSw() + '</div>' +
      '<button type="button" class="sheet-a danger" data-act="logout"><span class="ni">' + ic('logout') + '</span><span class="nl">' + t(L('Keluar', 'Sign Out')) + '</span></button>' +
      '<div class="sheet-row"><span>' + t(L('State layar (demo)', 'Screen state (demo)')) + '</span><select id="demo-state-m">' + STATE_OPTS.map(function (k) { return '<option value="' + k + '"' + ((S.force || 'default') === k ? ' selected' : '') + '>' + t(C.STATES[k].t) + '</option>'; }).join('') + '</select></div>' +
      '<button type="button" class="sheet-a" id="demo-reset-m"><span class="ni">' + ic('refresh') + '</span><span class="nl">' + t(L('Reset data demo', 'Reset demo data')) + '</span></button>' +
      '</div></div>';
    document.getElementById('app').innerHTML = demoBar() +
      '<div class="os g-' + r.group + (S.sbCollapsed ? ' sb-c' : '') + (S.sbOpen ? ' sb-o' : '') + '" id="os">' + side + '<div class="sb-scrim" id="sb-scrim"></div>' +
      '<div class="os-main"><header class="hd" id="hd"></header><div id="banner"></div><main class="view" id="view" tabindex="-1"></main></div>' + bottom + sheet + '</div>' +
      '<div class="toast" id="toast" role="status" aria-live="polite" hidden></div>' +
      mePop() + plantPop() + '<div class="sx" id="sx" hidden></div>';
    bindShell();
  }
  function langSw() { return '<div class="lsw" role="group" aria-label="Bahasa / Language"><button type="button" data-lang="id" aria-pressed="' + (S.lang === 'id') + '">ID</button><button type="button" data-lang="en" aria-pressed="' + (S.lang === 'en') + '">EN</button></div>'; }

  function header() {
    var s = C.screen(S.screen), r = R(), ch = chain(S.screen), root = isRoot(S.screen), m = mode();
    var par = parentOf(S.screen);
    var crumbs = ch.length > 1 ? '<nav class="crumb" aria-label="Breadcrumb">' + ch.map(function (id, i) {
      var sc = C.screen(id); return i < ch.length - 1 ? '<a href="' + href(id) + '">' + t(sc.n) + '</a>' + ic('chevr') : '<span aria-current="page">' + t(cur().title || sc.n) + '</span>';
    }).join('') + '</nav>' : '';
    var apr = (r.extra || []).some(function (n) { return n.k === 'apr'; }) && can('apr.view') ? '<a class="ib hd-apr" href="' + href('APR-INB-001') + '" aria-label="' + t(L('Persetujuan', 'Approvals')) + '" title="' + t(L('Persetujuan', 'Approvals')) + '">' + ic('filecheck') + (aprCount() ? '<b class="nb">' + aprCount() + '</b>' : '') + '</a>' : '';
    var search = r.group === 'management' ? '<label class="hd-search hide-m hide-t">' + ic('search') + '<input type="search" placeholder="' + t(L('Cari order, klien, invoice…', 'Search orders, clients, invoices…')) + '" id="hd-q"></label>' : '';
    document.getElementById('hd').innerHTML =
      '<button type="button" class="ib hd-menu hide-d hide-m" id="sb-open" aria-label="Menu">' + ic('menu') + '</button>' +
      (par && !root ? '<a class="ib hd-back" href="' + href(par) + '" aria-label="' + t(L('Kembali', 'Back')) + '">' + ic('arrowl') + '</a>' : '<img class="hd-logo hide-d hide-t" src="../assets/brand/jfresh-logo.png" alt="J\'Fresh Laundry" width="605" height="373">') +
      '<div class="hd-t">' + (crumbs ? '<div class="hide-m">' + crumbs + '</div>' : '') + '<div class="hd-title">' + t(cur().title || s.n) + '</div></div>' +
      '<span class="hd-sp"></span>' + search + apr +
      plantBtn() +
      '<a class="ib hd-bell" href="' + href('NOTIF-001') + '" aria-label="' + t(L('Notifikasi', 'Notifications')) + (unread() ? ' · ' + unread() + ' ' + t(L('belum dibaca', 'unread')) : '') + '"' + (S.screen === 'NOTIF-001' ? ' aria-current="page"' : '') + '>' + ic('bell') + (unread() ? '<b class="nb nbc">' + (unread() > 9 ? '9+' : unread()) + '</b>' : '') + '</a>' +
      '<span class="hide-m hide-t">' + langSw() + '</span>' +
      '<button type="button" class="hd-meb" id="hd-me" aria-haspopup="menu" aria-expanded="false" aria-label="' + t(L('Menu profil', 'Profile menu')) + '"><span class="av">' + esc(r.person.charAt(0)) + '</span><span class="hide-m hide-t"><b>' + esc(r.person) + '</b><small>' + t(r.title) + '</small></span>' + ic('chevd', 'hide-m') + '</button>';
  }

  /* ---------- Screen states ---------- */
  function stateCard(kind, msg, actions, title) {
    var icons = { empty: 'package', error: 'xc', noperm: 'lock', success: 'checkc', warning: 'alert', offline: 'wifioff' };
    var titles = { empty: L('Belum ada data', 'Nothing here yet'), error: L('Ada yang belum berhasil', 'Something did not work'), noperm: L('Tidak ada akses', 'No access'), success: L('Berhasil', 'Done'), warning: L('Perlu perhatian', 'Needs attention'), offline: L('Sedang offline', 'You are offline') };
    return '<section class="state st-' + kind + '" role="' + (kind === 'error' || kind === 'noperm' ? 'alert' : 'status') + '"><span class="state-ic">' + ic(icons[kind]) + '</span>' +
      '<h2>' + t(title || titles[kind]) + '</h2><p>' + t(msg) + '</p>' + (actions ? '<div class="state-a">' + actions + '</div>' : '') + '</section>';
  }
  function skeleton(a) {
    var row = '<div class="sk sk-row"></div>', card = '<div class="sk sk-card"></div>';
    var h = '<div class="skel" aria-busy="true" aria-label="' + t(C.STATES.loading.ex) + '"><div class="sk sk-title"></div>';
    if (a === 'T01' || a === 'T08') h += '<div class="sk-grid">' + card + card + card + card + '</div><div class="sk sk-block"></div>';
    else if (a === 'T05' || a === 'T09' || a === 'T07') h += '<div class="sk sk-bar"></div>' + row + row + row + row + row;
    else if (a === 'T04' || a === 'T03') h += '<div class="sk sk-bar"></div><div class="sk-grid">' + card + card + card + '</div><div class="sk sk-btn"></div>';
    else h += card + card + card;
    return h + '<p class="sk-t">' + t(C.STATES.loading.ex) + '</p></div>';
  }
  function banner() {
    var b = document.getElementById('banner'), s = C.screen(S.screen);
    var html = '';
    if (S.force === 'offline') html += '<div class="bnr crit">' + ic('wifioff') + '<span>' + t(C.STATES.offline.ex) + '</span></div>';
    if (S.force === 'warning') html += '<div class="bnr warn">' + ic('alert') + '<span>' + t(s.warn) + '</span></div>';
    b.innerHTML = html;
  }

  /* ---------- Render ---------- */
  var V = {};
  function cur() { return S.cur || {}; }
  function render(first) {
    if (X && !guard()) return;
    var p = parse();
    // The URL role never grants access: the session's experience replaces it.
    if (AX.ctx && (p.urlRole !== AX.ctx.exp || !p.urlScreen)) { location.replace(href(p.screen, p.rec, p.q, AX.ctx.exp)); return; }
    closePops();
    S.role = p.role; S.screen = p.screen; S.rec = p.rec; S.q = p.q;
    S.force = p.q.state && STATE_OPTS.indexOf(p.q.state) > 0 ? p.q.state : null;
    S.cur = V[S.screen] || { render: function () { return stateCard('empty', L('Layar ini belum dibuat.', 'This screen is not built yet.')); } };
    if (S.cur.title && typeof S.cur.title === 'function') S.cur = Object.assign({}, S.cur, { title: S.cur.title(S.rec) });
    S.sbOpen = false; S.sheet = false;
    shell();
    header(); banner();
    var s = C.screen(S.screen), view = document.getElementById('view');
    document.body.classList.toggle('focus', s.a === 'T04' || (s.a === 'T06' && R().group !== 'management'));
    document.title = T(s.n) + ' · JFRESH OS';
    clearTimeout(S.timer);
    // §35: one gate before anything renders — permission, then plant / client scope.
    var az = AX.ctx ? X.authorize(AX.ctx, S.screen, recordOf(S.rec)) : { ok: can(s.p) };
    if (!az.ok || S.force === 'noperm') {
      if (!az.ok && AX.denied !== location.hash) { AX.denied = location.hash; X.audit('AUTH.ACCESS_DENIED', { uid: AX.ctx.uid, target: S.screen + (S.rec ? '/' + S.rec : ''), reason: az.code }); }
      var home = AX.ctx ? AX.ctx.landing : R().nav[0].s;
      view.innerHTML = '<div class="pg">' + stateCard('noperm', az.code === 'scope' ? L('Data ini berada di luar plant atau akun Anda.', 'This record is outside your plant or account.') : L('Anda tidak memiliki akses ke halaman ini.', 'You do not have access to this page.'),
        btn('blue', L('Kembali', 'Back'), 'arrowl', { go: home }), L('Anda tidak memiliki akses.', 'You do not have access.')) + '</div>';
      return;
    }
    if (S.force === 'empty') { view.innerHTML = '<div class="pg">' + pageHead() + stateCard('empty', s.emp, backBtn()) + '</div>'; return; }
    if (S.force === 'error') { view.innerHTML = '<div class="pg">' + pageHead() + stateCard('error', s.err, btn('blue', L('Coba Lagi', 'Try Again'), 'refresh', { act: 'retry' }) + backBtn('ghost')) + '</div>'; return; }
    if (S.force === 'success') { view.innerHTML = '<div class="pg">' + stateCard('success', s.ok && T(s.ok) !== '—' ? s.ok : L('Tersimpan.', 'Saved.'), backBtn()) + '</div>'; return; }
    // Fast shell first, then content. Lazy pieces (charts) fill in after.
    view.innerHTML = '<div class="pg">' + skeleton(s.a) + '</div>';
    var delay = S.force === 'loading' ? 0 : (first ? 120 : 160);
    if (S.force === 'loading') return;
    S.timer = setTimeout(function () {
      try { view.innerHTML = '<div class="pg pg-' + s.a + '">' + S.cur.render({ rec: S.rec, q: S.q, s: s }) + '</div>'; }
      catch (e) { console.error(e); view.innerHTML = '<div class="pg">' + stateCard('error', s.err) + '</div>'; }
      if (S.cur.after) S.cur.after({ rec: S.rec, q: S.q, s: s });
      if (window.JFDS && view.querySelector('.ds')) window.JFDS.lang(view);
      if (!first) view.focus({ preventScroll: true });
    }, delay);
  }
  function rerender() { var y = window.scrollY; render(); setTimeout(function () { window.scrollTo(0, y); }, 200); }

  /* ---------- Shared UI pieces ---------- */
  function btn(kind, label, icon, o) {
    o = o || {};
    var a = (o.go ? ' data-go="' + esc(o.go) + '"' + (o.rec ? ' data-rec="' + esc(o.rec) + '"' : '') + (o.qs ? ' data-qs="' + esc(o.qs) + '"' : '') : '') + (o.act ? ' data-act="' + esc(o.act) + '"' : '') + (o.id ? ' id="' + o.id + '"' : '') + (o.val ? ' data-val="' + esc(o.val) + '"' : '');
    return '<button type="button" class="btn btn-' + kind + (o.cls ? ' ' + o.cls : '') + '"' + a + '>' + (icon ? ic(icon) : '') + '<span>' + t(label) + '</span></button>';
  }
  // Show a button only when the role holds its permission (hide, never disable).
  function pbtn(perm, kind, label, icon, o) { return can(perm) ? btn(kind, label, icon, o) : ''; }
  function backBtn(kind) { var p = parentOf(S.screen) || R().nav[0].s; return btn(kind || 'blue', L('Kembali', 'Back'), 'arrowl', { go: p }); }
  function pageHead(title, sub, actions, opts) {
    var s = C.screen(S.screen);
    return '<div class="ph' + (opts && opts.hideM ? ' ph-hm' : '') + '"><div class="ph-t"><h1>' + t(title || cur().title || s.n) + '</h1>' + (sub ? '<p class="ph-s">' + sub + '</p>' : '') + '</div>' + (actions ? '<div class="ph-a">' + actions + '</div>' : '') + '</div>';
  }
  function attn(items) {
    return '<div class="attn">' + items.map(function (x) {
      var tag = x.go ? 'a' : 'div';
      return '<' + tag + ' class="at at-' + (x.tone || 'info') + '"' + (x.go ? ' href="' + href(x.go, x.rec, x.qs) + '"' : '') + '><span class="at-ic">' + ic(x.icon || 'bell') + '</span>' +
        '<span class="at-v num">' + esc(x.v) + (x.u ? '<small>' + esc(x.u) + '</small>' : '') + '</span><span class="at-k">' + t(x.k) + '</span>' + (x.d ? '<span class="at-d ' + (x.dt || '') + '">' + esc(x.d) + '</span>' : '') + '</' + tag + '>';
    }).join('') + '</div>';
  }
  function section(title, body, o) {
    o = o || {};
    return '<section class="card' + (o.cls ? ' ' + o.cls : '') + '"><div class="card-h"><h2>' + (o.icon ? ic(o.icon) : '') + '<span>' + t(title) + '</span></h2>' + (o.count != null ? '<span class="cnt num">' + o.count + '</span>' : '') +
      (o.link ? '<a class="card-l" href="' + href(o.link[0], o.link[2]) + '">' + t(o.link[1]) + ic('chevr') + '</a>' : '') + '</div>' + body + '</section>';
  }
  function rowLink(o) {
    return '<a class="rl' + (o.tone ? ' rl-' + o.tone : '') + '" href="' + o.href + '"><span class="rl-ic">' + ic(o.icon || 'file') + '</span><span class="rl-t"><b>' + o.t + '</b>' + (o.s ? '<span>' + o.s + '</span>' : '') + '</span>' +
      (o.n != null ? '<span class="rl-n num">' + o.n + '</span>' : '') + (o.chip || '') + ic('chevr', 'rl-go') + '</a>';
  }
  function empty(msg) { return '<div class="empty-in">' + ic('checkc') + '<span>' + t(msg) + '</span></div>'; }
  function toast(msg, tone) {
    var el = document.getElementById('toast'); if (!el) return;
    el.className = 'toast ' + (tone || 'ok'); el.innerHTML = ic(tone === 'crit' ? 'alert' : 'checkc') + '<span>' + t(msg) + '</span>'; el.hidden = false;
    clearTimeout(toast._t); toast._t = setTimeout(function () { el.hidden = true; }, 2600);
  }

  /* Stage progress (8 stages) */
  function stepper(stageKey, compact) {
    var i0 = stageIdx(stageKey);
    return '<ol class="stp' + (compact ? ' stp-c' : '') + '">' + C.STAGES.map(function (st, i) {
      var cls = i < i0 ? 'done' : i === i0 ? 'now' : '';
      return '<li class="' + cls + '"><span class="stp-n">' + (i < i0 ? ic('check') : i + 1) + '</span><span class="stp-l">' + t(st.l) + '</span></li>';
    }).join('') + '</ol>';
  }

  /* Duplicate protection (§31): lock the CTA, show progress, idempotency key. */
  function submit(key, el, fn, label) {
    var d = db();
    if (d.done[key]) { toast(L('Sudah tersimpan sebelumnya. Tidak dikirim dua kali.', 'Already saved. Not sent twice.'), 'warn'); return false; }
    if (el) { if (el.disabled) return false; el.disabled = true; el.classList.add('busy'); var sp = el.querySelector('span'); if (sp) sp.textContent = T(label || L('Menyimpan…', 'Saving…')); }
    document.querySelectorAll('.btn').forEach(function (b) { if (b !== el) b.disabled = true; });
    setTimeout(function () { d.done[key] = now(); fn(); DB.save(); }, 650);
    return true;
  }
  /* Success state with next action and auto return (§30) */
  function success(msg, next, back, extra) {
    var view = document.getElementById('view');
    var sec = 6;
    view.innerHTML = '<div class="pg">' + '<section class="state st-success big" role="status"><span class="state-ic">' + ic('checkc') + '</span><h2>' + t(msg) + '</h2>' +
      (extra ? '<p>' + extra + '</p>' : '') +
      (S.force === 'offline' ? '<p class="off-note">' + ic('wifioff') + t(L('Disimpan di perangkat. Akan dikirim otomatis saat online.', 'Saved on this device. Sent automatically when online.')) + '</p>' : '') +
      '<div class="state-a">' + (next ? btn('primary', next.l, next.icon || 'arrow', { go: next.go, rec: next.rec, qs: next.qs }) : '') + (back ? btn('ghost', back.l, 'list', { go: back.go }) : '') + '</div>' +
      (back ? '<p class="auto" id="auto">' + t(L('Kembali ke antrian dalam', 'Back to the queue in')) + ' <b id="auto-n">' + sec + '</b> ' + t(L('detik', 'seconds')) + ' · <button type="button" class="lnk" id="auto-x">' + t(L('Tetap di sini', 'Stay here')) + '</button></p>' : '') +
      '</section></div>';
    if (back) {
      var iv = setInterval(function () {
        var n = document.getElementById('auto-n'); if (!n) { clearInterval(iv); return; }
        sec--; n.textContent = sec; if (sec <= 0) { clearInterval(iv); go(back.go); }
      }, 1000);
      var x = document.getElementById('auto-x'); if (x) x.onclick = function () { clearInterval(iv); var a = document.getElementById('auto'); if (a) a.remove(); };
    }
  }

  /* Responsive list: table on PC/iPad, cards on mobile (never a squeezed table). */
  function list(rows, cols, card, rowHref, o) {
    o = o || {};
    if (!rows.length) return empty(o.empty || C.screen(S.screen).emp);
    var vis = cols.filter(function (c) { return !c.perm || can(c.perm); });
    var tbl = '<div class="tblw hide-m"><table class="tbl' + (o.dense ? ' dense' : '') + '"><thead><tr>' + vis.map(function (c) { return '<th class="' + (c.cls || '') + '">' + t(c.h) + '</th>'; }).join('') + (rowHref ? '<th class="go"><span class="sr">' + t(L('Buka', 'Open')) + '</span></th>' : '') + '</tr></thead><tbody>' +
      rows.map(function (r) { var h = rowHref && rowHref(r); return '<tr' + (h ? ' data-href="' + esc(h) + '" tabindex="0"' : '') + '>' + vis.map(function (c) { return '<td class="' + (c.cls || '') + '">' + c.v(r) + '</td>'; }).join('') + (h ? '<td class="go">' + ic('chevr') + '</td>' : '') + '</tr>'; }).join('') + '</tbody></table></div>';
    var cards = '<div class="mcards hide-d hide-t">' + rows.map(function (r) { var c = card(r), h = rowHref && rowHref(r); var tag = h ? 'a' : 'div'; return '<' + tag + ' class="mc"' + (h ? ' href="' + esc(h) + '"' : '') + '><span class="mc-t"><b>' + c.t + '</b>' + (c.r ? '<span class="mc-r num">' + c.r + '</span>' : '') + '</span>' + (c.s ? '<span class="mc-s">' + c.s + '</span>' : '') + (c.chip ? '<span class="mc-c">' + c.chip + '</span>' : '') + '</' + tag + '>'; }).join('') + '</div>';
    return tbl + cards;
  }
  /* Filter bar: management gets filters; frontline never does (§20). */
  function filters(defs, o) {
    o = o || {};
    if (R().group !== 'management' && !o.force) return '';
    return '<div class="fb">' + (o.search ? '<label class="fb-s">' + ic('search') + '<input type="search" data-f="q" value="' + esc(S.q.q || '') + '" placeholder="' + t(o.search) + '"></label>' : '') +
      defs.map(function (d) {
        return '<label class="fb-f"><span class="sr">' + t(d.l) + '</span><select data-f="' + d.k + '"><option value="">' + t(d.l) + ': ' + t(L('Semua', 'All')) + '</option>' +
          d.opts.map(function (op) { return '<option value="' + esc(op[0]) + '"' + (S.q[d.k] === op[0] ? ' selected' : '') + '>' + t(op[1]) + '</option>'; }).join('') + '</select></label>';
      }).join('') + (o.export && can('rpt.export') ? '<button type="button" class="btn btn-ghost btn-sm" data-act="export">' + ic('download') + '<span>' + t(L('Export', 'Export')) + '</span></button>' : '') + '</div>';
  }
  function applyFilters(rows, defs, searchFn) {
    var q = (S.q.q || '').toLowerCase();
    return rows.filter(function (r) {
      if (q && searchFn && searchFn(r).toLowerCase().indexOf(q) < 0) return false;
      return defs.every(function (d) { return !S.q[d.k] || d.fn(r, S.q[d.k]); });
    });
  }

  /* ---------- Small charts (single axis, thin marks, hover titles, table fallback) ---------- */
  function barChart(data, o) {
    o = o || {};
    var w = 640, h = o.h || 220, pl = 44, pr = 10, pt = 16, pb = 30, max = Math.max.apply(null, data.map(function (d) { return d.v; })) || 1;
    var nice = Math.pow(10, Math.floor(Math.log10(max))), top = Math.ceil(max / nice) * nice;
    var bw = (w - pl - pr) / data.length, gap = Math.max(4, bw * 0.28);
    var g = '';
    for (var i = 0; i <= 4; i++) { var y = pt + (h - pt - pb) * (1 - i / 4); g += '<line x1="' + pl + '" x2="' + (w - pr) + '" y1="' + y + '" y2="' + y + '" class="grid"/><text x="' + (pl - 8) + '" y="' + (y + 4) + '" class="ax" text-anchor="end">' + esc(o.fmtAx ? o.fmtAx(top * i / 4) : fmt.num(top * i / 4, 0)) + '</text>'; }
    var bars = data.map(function (d, i) {
      var bh = (h - pt - pb) * d.v / top, x = pl + i * bw + gap / 2, y = h - pb - bh, bwi = bw - gap, r = Math.min(4, bwi / 2, bh);
      var path = 'M' + x + ' ' + (h - pb) + 'V' + (y + r) + 'Q' + x + ' ' + y + ' ' + (x + r) + ' ' + y + 'H' + (x + bwi - r) + 'Q' + (x + bwi) + ' ' + y + ' ' + (x + bwi) + ' ' + (y + r) + 'V' + (h - pb) + 'Z';
      return '<g class="bar' + (d.hi ? ' hi' : '') + '" tabindex="0"><title>' + esc(d.l + ': ' + (o.fmt ? o.fmt(d.v) : fmt.num(d.v))) + '</title><rect x="' + (pl + i * bw) + '" y="' + pt + '" width="' + bw + '" height="' + (h - pt - pb) + '" class="hit"/><path d="' + path + '"/>' +
        (data.length <= 16 && (i % Math.ceil(data.length / 8) === 0 || data.length <= 8) ? '<text x="' + (x + bwi / 2) + '" y="' + (h - 10) + '" class="ax" text-anchor="middle">' + esc(d.l) + '</text>' : '') + '</g>';
    }).join('');
    return '<figure class="chart"><svg viewBox="0 0 ' + w + ' ' + h + '" role="img" aria-label="' + esc(o.label || '') + '">' + g + '<line x1="' + pl + '" x2="' + (w - pr) + '" y1="' + (h - pb) + '" y2="' + (h - pb) + '" class="base"/>' + bars + '</svg>' + tableFallback(data, o) + '</figure>';
  }
  function lineChart(series, labels, o) {
    o = o || {};
    var w = 640, h = o.h || 220, pl = 44, pr = 12, pt = 16, pb = 30;
    var all = []; series.forEach(function (s) { all = all.concat(s.v); });
    var min = o.min != null ? o.min : 0, max = Math.max.apply(null, all);
    var span = max - min || 1, top = o.max != null ? o.max : min + span * 1.1;
    function X(i) { return pl + (w - pl - pr) * i / (labels.length - 1); }
    function Y(v) { return pt + (h - pt - pb) * (1 - (v - min) / (top - min)); }
    var g = '';
    for (var i = 0; i <= 4; i++) { var v = min + (top - min) * i / 4, y = Y(v); g += '<line x1="' + pl + '" x2="' + (w - pr) + '" y1="' + y + '" y2="' + y + '" class="grid"/><text x="' + (pl - 8) + '" y="' + (y + 4) + '" class="ax" text-anchor="end">' + esc(o.fmtAx ? o.fmtAx(v) : fmt.num(v, 0)) + '</text>'; }
    labels.forEach(function (l, i) { if (i % Math.ceil(labels.length / 7) === 0 || i === labels.length - 1) g += '<text x="' + X(i) + '" y="' + (h - 10) + '" class="ax" text-anchor="middle">' + esc(l) + '</text>'; });
    if (o.target != null) g += '<line x1="' + pl + '" x2="' + (w - pr) + '" y1="' + Y(o.target) + '" y2="' + Y(o.target) + '" class="tgt"/><text x="' + (w - pr) + '" y="' + (Y(o.target) - 6) + '" class="ax tgt-l" text-anchor="end">' + esc(T(L('Target', 'Target')) + ' ' + (o.fmt ? o.fmt(o.target) : o.target)) + '</text>';
    var lines = series.map(function (s, si) {
      var d = s.v.map(function (v, i) { return (i ? 'L' : 'M') + X(i).toFixed(1) + ' ' + Y(v).toFixed(1); }).join('');
      var last = s.v.length - 1;
      return '<path d="' + d + '" class="ln s' + si + '"/>' + s.v.map(function (v, i) { return '<g class="pt s' + si + '"><title>' + esc(labels[i] + ' · ' + T(s.n) + ': ' + (o.fmt ? o.fmt(v) : fmt.num(v))) + '</title><circle cx="' + X(i) + '" cy="' + Y(v) + '" r="10" class="hit"/><circle cx="' + X(i) + '" cy="' + Y(v) + '" r="' + (i === last ? 4.5 : 2.5) + '"/></g>'; }).join('');
    }).join('');
    var legend = series.length > 1 ? '<figcaption class="lg">' + series.map(function (s, si) { return '<span><i class="sw s' + si + '"></i>' + t(s.n) + '</span>'; }).join('') + '</figcaption>' : '';
    return '<figure class="chart">' + legend + '<svg viewBox="0 0 ' + w + ' ' + h + '" role="img" aria-label="' + esc(o.label || '') + '">' + g + lines + '</svg>' +
      tableFallback(labels.map(function (l, i) { return { l: l, v: series[0].v[i] }; }), o) + '</figure>';
  }
  function tableFallback(data, o) {
    return '<details class="chart-t"><summary>' + t(L('Lihat sebagai tabel', 'View as table')) + '</summary><table class="tbl dense"><tbody>' + data.map(function (d) { return '<tr><td>' + esc(d.l) + '</td><td class="r num">' + esc(o.fmt ? o.fmt(d.v) : fmt.num(d.v)) + '</td></tr>'; }).join('') + '</tbody></table></details>';
  }
  function hbars(rows, o) {
    o = o || {};
    var max = Math.max.apply(null, rows.map(function (r) { return r.v; })) || 1;
    return '<div class="hb">' + rows.map(function (r) {
      return '<div class="hb-r' + (r.hi ? ' hi' : '') + '"' + (r.go ? ' data-go="' + esc(r.go) + '"' + (r.qs ? ' data-qs="' + esc(r.qs) + '"' : '') + ' role="button" tabindex="0"' : '') + '><span class="hb-l">' + (r.icon ? ic(r.icon) : '') + t(r.l) + '</span><span class="hb-t"><i style="width:' + Math.max(2, r.v / max * 100) + '%"></i></span><span class="hb-v num">' + esc(o.fmt ? o.fmt(r.v) : r.v) + '</span></div>';
    }).join('') + '</div>';
  }

  /* ---------- Events ---------- */
  function bindShell() {
    var sim = document.getElementById('demo-sim');
    if (sim) sim.onchange = function () { var v = this.value; this.value = ''; runSim(v); };
    function setState(v) { var q = Object.assign({}, S.q); if (v === 'default') delete q.state; else q.state = v; location.hash = href(S.screen, S.rec, q); }
    var st = document.getElementById('demo-state'); if (st) st.onchange = function () { setState(this.value); };
    var stm = document.getElementById('demo-state-m'); if (stm) stm.onchange = function () { setState(this.value); };
    function rs() { DB.reset(); toast(L('Data demo dikembalikan.', 'Demo data restored.')); rerender(); }
    var r1 = document.getElementById('demo-reset'); if (r1) r1.onclick = rs;
    var r2 = document.getElementById('demo-reset-m'); if (r2) r2.onclick = rs;
  }
  document.addEventListener('click', function (e) {
    var el;
    activity();
    if ((el = e.target.closest('[data-lang]'))) { S.lang = el.getAttribute('data-lang'); try { localStorage.setItem('jfresh-lang', S.lang); } catch (x) {} if (X) X.setLang(S.lang); document.documentElement.lang = S.lang; rerender(); return; }
    if ((el = e.target.closest('[data-reveal]')) && window.JFDS) { window.JFDS.reveal(el); return; }
    if ((el = e.target.closest('#hd-me'))) { openPop('pop-me', el); return; }
    if ((el = e.target.closest('#hd-plant'))) { openPop('pop-plant', el); return; }
    if (!e.target.closest('.pop')) closePops();
    if ((el = e.target.closest('[data-sheet]'))) { e.preventDefault(); var sh = document.getElementById('sheet'); if (sh) sh.hidden = el.getAttribute('data-sheet') !== '1'; return; }
    if ((el = e.target.closest('#sb-toggle'))) {
      if (mode() === 'd') { S.sbCollapsed = !S.sbCollapsed; try { localStorage.setItem('jfos-sb', S.sbCollapsed ? '1' : '0'); } catch (x) {} document.getElementById('os').classList.toggle('sb-c', S.sbCollapsed); }
      else document.getElementById('os').classList.toggle('sb-o');
      return;
    }
    if ((el = e.target.closest('#sb-open'))) { document.getElementById('os').classList.add('sb-o'); return; }
    if ((el = e.target.closest('#sb-scrim'))) { document.getElementById('os').classList.remove('sb-o'); return; }
    if ((el = e.target.closest('tr[data-href]'))) { location.hash = el.getAttribute('data-href'); return; }
    if ((el = e.target.closest('[data-go]'))) {
      var q = {}; (el.getAttribute('data-qs') || '').split('&').forEach(function (kv) { if (kv) { var a = kv.split('='); q[a[0]] = a[1]; } });
      go(el.getAttribute('data-go'), el.getAttribute('data-rec'), q); return;
    }
    if ((el = e.target.closest('[data-act]'))) {
      var a = el.getAttribute('data-act');
      if (a === 'logout') { logout(); return; }
      if (a === 'switch-account') { X.logout('switch'); location.replace('login.html#/'); return; }
      if (a === 'extend') { X.extend(); AX.lastTouch = X.now(); hideWarn(); toast(L('Sesi diperpanjang.', 'Session extended.')); return; }
      if (a === 'plant') { var pid = el.getAttribute('data-val'); closePops(); if (pid === AX.ctx.plant) return; var res = X.switchPlant(pid); if (res.ok) { AX.ctx = res.ctx; buildR(res.ctx); rerender(); setTimeout(function () { toast(L('Plant aktif: ' + X.plantName(pid)[0], 'Active plant: ' + X.plantName(pid)[1])); }, 250); } else toast(L('Anda tidak memiliki akses.', 'You do not have access.'), 'crit'); return; }
      if (a === 'retry') { var q2 = Object.assign({}, S.q); delete q2.state; location.hash = href(S.screen, S.rec, q2); return; }
      if (a === 'export') { audit('SYS.CHANGE', T(C.screen(S.screen).n), null, 'Export'); toast(L('File export disiapkan (CSV).', 'Export file prepared (CSV).')); return; }
      var h = cur().act && cur().act[a];
      if (h) h(el, e);
    }
  });
  document.addEventListener('keydown', function (e) {
    activity();
    if (e.key === 'Escape') { var open = document.querySelector('.pop:not([hidden])'); if (open) { var b = document.querySelector('[aria-expanded="true"]'); closePops(); if (b) b.focus(); return; } }
    if (e.key !== 'Enter' && e.key !== ' ') return;
    var el = e.target.closest('tr[data-href],[role="button"][data-go]');
    if (el) { e.preventDefault(); el.click(); }
  });
  document.addEventListener('change', function (e) {
    var el = e.target.closest('[data-f]');
    if (el) { var q = Object.assign({}, S.q); if (el.value) q[el.getAttribute('data-f')] = el.value; else delete q[el.getAttribute('data-f')]; location.hash = href(S.screen, S.rec, q); }
  });
  document.addEventListener('keyup', function (e) {
    var el = e.target.closest('input[data-f="q"]');
    if (el && e.key === 'Enter') { var q = Object.assign({}, S.q); if (el.value) q.q = el.value; else delete q.q; location.hash = href(S.screen, S.rec, q); }
  });
  window.addEventListener('hashchange', function () { render(); window.scrollTo(0, 0); });
  function onMode() { if (S.screen) rerender(); }
  (MQ_M.addEventListener ? MQ_M.addEventListener('change', onMode) : MQ_M.addListener(onMode));
  (MQ_T.addEventListener ? MQ_T.addEventListener('change', onMode) : MQ_T.addListener(onMode));
  // Live SLA chips
  setInterval(function () {
    document.querySelectorAll('[data-due]').forEach(function (el) { var x = slaInfo(+el.getAttribute('data-due')); el.className = 'chip ' + x.tone + (el.classList.contains('chip-lg') ? ' chip-lg' : ''); el.querySelector('span').textContent = x.txt; });
  }, 30000);

  window.JFAPP = {
    V: V, S: S, T: T, L: L, t: t, esc: esc, ic: ic, can: can, R: R, db: db, fmt: fmt, now: now, mode: mode, href: href, go: go,
    slaInfo: slaInfo, slaChip: slaChip, chip: chip, stage: stage, stageIdx: stageIdx, typeL: typeL, cname: cname, audit: audit,
    btn: btn, pbtn: pbtn, backBtn: backBtn, pageHead: pageHead, attn: attn, section: section, rowLink: rowLink, empty: empty, toast: toast, stepper: stepper,
    submit: submit, success: success, list: list, filters: filters, applyFilters: applyFilters, barChart: barChart, lineChart: lineChart, hbars: hbars,
    stateCard: stateCard, greet: greet, rerender: rerender, parentOf: parentOf, aprCount: aprCount, issueCount: issueCount,
    toLogin: toLogin, logout: logout, ctx: function () { return AX.ctx; }, sessionSwitch: sessionSwitch, buildR: buildR,
    start: function () {
      document.documentElement.lang = S.lang;
      if (X) {
        if (!guard()) return;
        if (!location.hash) location.replace(href(AX.ctx.landing, null, null, AX.ctx.exp));
        setInterval(sessionTick, 5000);
        window.addEventListener('storage', function (e) { if (e.key === 'jfos-access-v1') sessionTick(); });   // logout / changes in another tab
        window.addEventListener('scroll', activity, { passive: true });
      } else if (!location.hash) location.replace(href('HOM-OPR-001', null, null, 'operator'));
      render(true);
    }
  };
})();
