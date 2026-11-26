/* JFRESH OS — ALL-001 Semua Modul (full-access accounts only).

   One page that lists every menu screen of every role, grouped by module (Fase 4–12).
   The list is built from the role menus themselves, so a new screen added to any role
   menu shows up here without editing this file.

   Opening a screen: a full-access account (owner) may open every staff screen to look at it
   (JFACCESS.canScreen). Buttons inside a screen still check their own permission, so the
   owner sees the page but does not gain other roles' actions. Client portal screens stay
   with client accounts. In mode asli only screens already connected to the server open. */
(function () {
  var A = window.JFAPP, X = window.JFACCESS, C = window.JFOS;
  if (!A || !X || !C) return;
  var T = A.T, L = A.L, t = A.t, esc = A.esc, ic = A.ic;
  A.addParents({ 'ALL-001': [] });

  // Module = screen ID prefix. Order follows the business flow.
  var MODS = [
    { k: 'home', n: L('Beranda per Peran', 'Role Home Pages'), d: L('Halaman awal tiap peran', 'Each role\'s start page'), i: 'home', ids: ['HOM-', 'DRIVER-MOB-', 'OPS-TSK-'] },
    { k: 'comm', n: L('Klien & Komersial', 'Clients & Commercial'), d: L('Fase 6', 'Phase 6'), i: 'hotel', ids: ['CLIENT-0', 'PROPERTY-', 'CONTACT-', 'SERVICE-', 'SLA-0', 'CONTRACT-', 'RATE-', 'DOC-', 'HISTORY-', 'HEALTH-', 'OPP-', 'RENEW-', 'APPROVAL-', 'COM-'] },
    { k: 'logi', n: L('Order, Pickup & Logistik', 'Orders, Pickup & Logistics'), d: L('Fase 7', 'Phase 7'), i: 'truck', ids: ['ORDER-', 'SCHEDULE-', 'DISPATCH-', 'ROUTE-', 'DRIVER-', 'VEHICLE-', 'BAG-', 'TRACK-', 'TIMELINE-', 'CHAT-', 'ISSUE-', 'HANDOVER-', 'ARRIVAL-', 'LOG-'] },
    { k: 'ops', n: L('Operasional & Kualitas', 'Operations & Quality'), d: L('Fase 2–4', 'Phase 2–4'), i: 'clipboard', ids: ['OPS-', 'QLT-', 'SLA-MON-', 'PRD-', 'RPT-OPS-'] },
    { k: 'prod', n: L('Produksi Laundry', 'Laundry Production'), d: L('Fase 8', 'Phase 8'), i: 'washer', ids: ['PROD-', 'CHK-', 'MNT-'] },
    { k: 'dlv', n: L('Delivery & Penutupan', 'Delivery & Closure'), d: L('Fase 9', 'Phase 9'), i: 'package', ids: ['REL-', 'DISP-', 'DRV-HO-', 'COMP-', 'BILL-', 'RETURN-', 'REC-', 'DLV-', 'FEEDBACK-'] },
    { k: 'fin', n: L('Keuangan, Costing & Supply', 'Finance, Costing & Supply'), d: L('Fase 10', 'Phase 10'), i: 'coins', ids: ['ACC-', 'AR-', 'AP-', 'CASH-', 'BUD-', 'ITEM-', 'HPP-', 'PRICE-', 'INV-', 'PUR-', 'AST-', 'CFO-', 'RPT-FIN-'] },
    { k: 'perf', n: L('Eksekutif & Kinerja', 'Executive & Performance'), d: L('Fase 5', 'Phase 5'), i: 'chart', ids: ['FIN-', 'GOAL-', 'KPI-', 'XSCORE-', 'TEAM-', 'PERF-', 'RACE-', 'REFL-', 'DI-', 'REPORT-', 'RPT-', 'APR-', 'AUD-'] },
    { k: 'clp', n: L('Portal Klien', 'Client Portal'), d: L('Fase 11 · dibuka lewat akun klien', 'Phase 11 · opened with a client account'), i: 'users', ids: ['CLP-', 'CLIENT-DEL-', 'CLT-'] },
    { k: 'sys', n: L('Admin Sistem & Tata Kelola', 'System Admin & Governance'), d: L('Fase 11', 'Phase 11'), i: 'shield', ids: ['ADM-', 'CFG-', 'NTF-', 'SEC-', 'INT-', 'SYS-'] },
    { k: 'go', n: L('Implementasi & Go-Live', 'Implementation & Go-Live'), d: L('Fase 12', 'Phase 12'), i: 'flag', ids: ['BUILD-', 'IMP-', 'QA-', 'SVL-', 'RLB-', 'DATA-', 'MIG-', 'UAT-', 'CUT-', 'LIVE-', 'OPT-', 'HELP-'] },
    { k: 'other', n: L('Lainnya', 'Other'), d: L('Layar lain', 'Other screens'), i: 'grid', ids: [] }
  ];
  function modOf(id) {
    // The client-portal home page belongs with the portal, not with the staff home pages.
    if (id === 'HOM-CLT-001') return 'clp';
    var best = null, len = 0;
    MODS.forEach(function (m) { m.ids.forEach(function (p) { if (id.indexOf(p) === 0 && p.length > len) { best = m.k; len = p.length; } }); });
    return best || 'other';
  }
  function roleName(k) { var r = X.ROLES[k] || C.ROLES[k]; return r && r.n ? T(r.n) : k; }

  // Every screen in any role menu → { id, name, roles[] }
  function catalog() {
    var cfg = C, seen = {}, out = [];
    var order = Object.keys(cfg.ROLES);
    order.forEach(function (rk) {
      (function walk(items) {
        (items || []).forEach(function (n) {
          if (n.sub) return walk(n.sub);
          if (!n.s || n.s === 'ALL-001') return;
          var sc = cfg.screen(n.s); if (!sc) return;
          var e = seen[n.s];
          if (!e) { e = seen[n.s] = { id: n.s, n: sc.n, roles: [], client: false }; out.push(e); }
          if (e.roles.indexOf(rk) < 0) e.roles.push(rk);
        });
      })(cfg.ROLES[rk].nav);
    });
    out.forEach(function (e) { e.client = e.roles.every(function (r) { return X.ROLES[r] ? X.ROLES[r].group === 'client' : r === 'client'; }); e.m = modOf(e.id); });
    return out;
  }

  var M = { q: '' };
  function status(ctx, e) {
    if (X.canScreen(ctx, e.id)) return { ok: true };
    if (e.client) return { ok: false, why: L('Lewat akun klien', 'Via a client account') };
    if (X.isCloud && X.isCloud()) return { ok: false, why: L('Belum aktif di mode asli', 'Not live yet') };
    return { ok: false, why: L('Tidak ada akses', 'No access') };
  }

  A.V['ALL-001'] = {
    render: function () {
      var ctx = A.ctx(), all = catalog();
      var open = all.filter(function (e) { return status(ctx, e).ok; }).length;
      var cards = MODS.map(function (m) {
        var rows = all.filter(function (e) { return e.m === m.k; });
        if (!rows.length) return '';
        rows.sort(function (a, b) { return a.id < b.id ? -1 : 1; });
        var items = rows.map(function (e) {
          var st = status(ctx, e), more = e.roles.length > 3 ? ' +' + (e.roles.length - 3) : '';
          var who = e.roles.slice(0, 3).map(roleName).join(' · ') + more;
          var key = (T(e.n) + ' ' + e.id + ' ' + e.roles.map(roleName).join(' ')).toLowerCase();
          var inner = '<span class="am-t"><b>' + esc(T(e.n)) + '</b><span class="am-id num">' + esc(e.id) + '</span><span class="am-r">' + esc(who) + '</span></span>';
          return st.ok
            ? '<a class="am-i" data-k="' + esc(key) + '" href="' + A.href(e.id) + '">' + inner + ic('chevr', 'am-go') + '</a>'
            : '<div class="am-i am-off" data-k="' + esc(key) + '">' + inner + '<span class="am-lock">' + ic('lock') + '<span>' + t(st.why) + '</span></span></div>';
        }).join('');
        return '<details class="card am-g" open data-m="' + m.k + '"><summary class="card-h"><h2>' + ic(m.i) + '<span>' + t(m.n) + '</span></h2><span class="am-d">' + t(m.d) + '</span><span class="cnt num">' + rows.length + '</span></summary><div class="am-l">' + items + '</div></details>';
      }).join('');
      var sub = t(L('Semua layar dari semua peran, dikelompokkan per modul. Akun akses penuh bisa membuka layar untuk melihat isinya; tombol aksi tetap mengikuti izin masing-masing peran.',
        'Every screen of every role, grouped by module. A full-access account can open a screen to look at it; action buttons still follow each role\'s permissions.'));
      return A.pageHead(null, sub) +
        '<div class="am-top"><div class="am-sum"><b class="num">' + all.length + '</b> ' + t(L('layar', 'screens')) + ' · <b class="num">' + open + '</b> ' + t(L('bisa dibuka dari akun ini', 'open from this account')) + '</div>' +
        '<label class="am-s">' + ic('search') + '<input id="am-q" type="search" value="' + esc(M.q) + '" placeholder="' + esc(T(L('Cari layar, ID atau peran…', 'Search screen, ID or role…'))) + '" aria-label="' + esc(T(L('Cari layar', 'Search screens'))) + '"></label></div>' +
        '<div class="am-none" hidden>' + A.stateCard('empty', L('Tidak ada layar yang cocok.', 'No matching screen.')) + '</div>' +
        '<div class="am-grid">' + cards + '</div>';
    },
    after: function () {
      var q = document.getElementById('am-q'); if (!q) return;
      function apply() {
        M.q = q.value; var v = q.value.trim().toLowerCase(), any = false;
        document.querySelectorAll('.am-g').forEach(function (g) {
          var n = 0;
          g.querySelectorAll('.am-i').forEach(function (i) { var hit = !v || i.getAttribute('data-k').indexOf(v) >= 0; i.hidden = !hit; if (hit) n++; });
          g.hidden = !n; if (n) any = true;
          if (v && n) g.open = true;
        });
        var none = document.querySelector('.am-none'); if (none) none.hidden = any;
      }
      q.addEventListener('input', apply);
      if (M.q) apply();
    }
  };
})();
