/* JFRESH OS — Phase 4 screens: profile, password, role & plant switch,
   notification center and help (NP-06). Built from the app helpers and the
   Phase 3 components (JFDS). Data comes only from the session (JFACCESS):
   nothing here can widen what the session allows. */
(function () {
  var A = window.JFAPP, C = window.JFOS, X = window.JFACCESS, DS = window.JFDS, V = A.V;
  var T = A.T, L = A.L, t = A.t, esc = A.esc, ic = A.ic, href = A.href, fmt = A.fmt;
  function ctx() { return A.ctx(); }
  function langSw() { return '<div class="lsw" role="group" aria-label="Bahasa / Language"><button type="button" data-lang="id" aria-pressed="' + (A.S.lang === 'id') + '">ID</button><button type="button" data-lang="en" aria-pressed="' + (A.S.lang === 'en') + '">EN</button></div>'; }
  function ro() { return '<span class="ro" title="' + t(L('Diatur oleh admin', 'Managed by admin')) + '">' + ic('lock') + '<span>' + t(L('Diatur admin', 'Set by admin')) + '</span></span>'; }
  function row(icon, label, value, extra) { return '<div><dt>' + ic(icon) + '<span>' + t(label) + '</span></dt><dd>' + value + '</dd>' + (extra || '<span></span>') + '</div>'; }
  function val(form, name) { var el = form.querySelector('[name="' + name + '"]'); return el ? el.value : ''; }

  /* ---------- USER-001 Profil Saya ---------- */
  V['USER-001'] = {
    render: function () {
      var c = ctx(), u = c.user, e = c.employee, r = A.R();
      var statusChip = A.chip('ok', L('Aktif', 'Active'), 'checkc');
      var perms = c.perms.map(function (p) { return '<span class="ds-tag">' + t(C.PERMS[p] || [p, p]) + '</span>'; }).join('');
      var acts = [A.btn('ghost', L('Ganti Password', 'Change Password'), 'key', { go: 'USER-002' })];
      if (c.roles.length > 1 && u.switchRole) acts.push(A.btn('ghost', L('Ganti Peran', 'Switch Role'), 'swap', { go: 'USER-003' }));
      if (!c.client && c.plants.length > 1) acts.push(A.btn('ghost', L('Ganti Plant', 'Switch Plant'), 'building', { go: 'USER-004' }));
      return A.pageHead(null, t(L('Data akun dan hak akses Anda', 'Your account and access'))) +
        '<div class="prof">' +
          '<div class="prof-side" style="display:grid;gap:var(--jf-space-4)">' +
            '<section class="prof-card"><span class="av xl">' + esc(c.name.charAt(0)) + '</span><h2>' + esc(c.fullName) + '</h2><p class="ph-s">' + t(c.role.n) + ' · ' + esc(r.site) + '</p>' + statusChip +
              '<p class="hint">' + t(L('Foto profil opsional.', 'Profile photo is optional.')) + '</p></section>' +
            '<div class="ds-btnbar" style="display:grid;gap:var(--jf-space-2)">' + acts.join('') + A.btn('ghost', L('Keluar', 'Sign Out'), 'logout', { act: 'logout', cls: 'btn-danger-ghost' }) + '</div>' +
          '</div>' +
          '<div style="display:grid;gap:var(--jf-space-4);min-width:0">' +
            '<dl class="prof-dl">' +
              row('user', L('Nama', 'Name'), esc(c.fullName)) +
              (c.client ? row('hotel', L('Klien', 'Client'), esc(A.cname(c.client)), ro()) : row('idcard', L('Employee ID', 'Employee ID'), '<span class="num">' + esc(e.id) + '</span>', ro())) +
              row('hash', L('Username', 'Username'), esc(u.u)) +
              row('message', L('Email', 'Email'), esc(u.email)) +
              row('shield', L('Peran', 'Role'), t(c.role.n) + (c.roles.length > 1 ? ' <small class="hint">(' + c.roles.length + ' ' + t(L('peran', 'roles')) + ')</small>' : ''), ro()) +
              (c.client ? '' : row('building', L('Plant', 'Plant'), t(X.plantName(c.plant)), ro())) +
              (e ? row('briefcase', L('Departemen', 'Department'), t(e.dept)) : '') +
              row('globe', L('Bahasa', 'Language'), langSw()) +
            '</dl>' +
            A.section(L('Hak Akses', 'Permissions'), '<p class="hint">' + t(L('Hak akses menentukan tindakan yang boleh Anda lakukan. Hanya admin yang dapat mengubahnya.', 'Permissions decide what you may do. Only an admin can change them.')) + '</p><div class="perm-list">' + perms + '</div>', { icon: 'key', count: c.perms.length }) +
          '</div>' +
        '</div>';
    }
  };

  /* ---------- USER-002 Ganti Password ---------- */
  function pwForm(err) {
    err = err || {};
    function f(name, label, auto) {
      var e = err.field === name;
      return DS.Input.Password({ label: label, name: name, autocomplete: auto, req: true, state: e ? 'error' : null, help: e ? X.MSG[err.code] : (name === 'p1' ? X.MSG.pw_short : null) });
    }
    return '<form class="ds pw-f" id="f-pw" novalidate style="display:grid;gap:var(--jf-space-4);max-width:520px">' +
      (err.code && !err.field ? DS.Feedback.Inline({ type: 'error', text: X.MSG[err.code] || X.MSG.system }) : '') +
      f('old', L('Password Lama', 'Current Password'), 'current-password') + f('p1', L('Password Baru', 'New Password'), 'new-password') + f('p2', L('Konfirmasi Password', 'Confirm Password'), 'new-password') +
      '<div class="row2">' + A.btn('ghost', L('Batal', 'Cancel'), 'arrowl', { go: 'USER-001' }) + '<button type="submit" class="btn btn-primary" id="pw-go">' + ic('check') + '<span>' + t(L('Simpan Password', 'Save Password')) + '</span></button></div>' +
      '</form>';
  }
  function bindPw() {
    var f = document.getElementById('f-pw'); if (!f) return;
    f.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var b = document.getElementById('pw-go'); if (b.disabled) return;
      b.disabled = true; b.classList.add('busy'); b.querySelector('span').textContent = T(L('Memproses...', 'Processing...'));
      setTimeout(function () {
        var res = X.changePassword(val(f, 'old'), val(f, 'p1'), val(f, 'p2'));
        if (res.ok) { A.success(L('Password berhasil diperbarui.', 'Password updated.'), { l: L('Kembali ke Profil', 'Back to Profile'), go: 'USER-001', icon: 'user' }); return; }
        if (res.code && !res.field && !X.MSG[res.code]) { A.toLogin(res.code); return; }
        document.getElementById('pw-wrap').innerHTML = pwForm(res); bindPw();
        var bad = document.querySelector('#f-pw [name="' + res.field + '"]'); if (bad) bad.focus();
      }, 500);
    });
  }
  V['USER-002'] = {
    render: function () { return A.pageHead(null, t(L('Gunakan minimal 8 karakter. Password lama diperlukan.', 'Use at least 8 characters. Your current password is required.'))) + '<section class="card" id="pw-wrap">' + pwForm() + '</section>'; },
    after: bindPw
  };

  /* ---------- USER-003 Ganti Peran (only assigned roles) ---------- */
  V['USER-003'] = {
    render: function () {
      var c = ctx();
      if (c.roles.length < 2 || !c.user.switchRole) return A.pageHead() + A.stateCard('empty', L('Akun Anda hanya memiliki satu peran.', 'Your account has one role only.'), A.btn('blue', L('Kembali', 'Back'), 'arrowl', { go: 'USER-001' }), L('Tidak ada peran lain', 'No other role'));
      return A.pageHead(null, t(L('Pilih peran untuk sesi ini. Menu dan halaman awal ikut berubah.', 'Choose the role for this session. Menus and the landing page change with it.'))) +
        '<div class="pick" role="radiogroup" aria-label="' + t(L('Peran', 'Role')) + '">' + c.roles.map(function (k) {
          var R = X.ROLES[k], on = k === c.roleKey, land = C.screen(R.landing);
          return '<button type="button" class="pick-o' + (on ? ' is-on' : '') + '" role="radio" aria-checked="' + on + '" data-act="role" data-val="' + k + '"><span class="ic">' + ic(R.group === 'frontline' ? 'clipboard' : 'gauge') + '</span>' +
            '<span class="pick-t"><b>' + t(R.n) + (k === c.defRole ? ' <span class="ds-tag">' + t(L('Default', 'Default')) + '</span>' : '') + '</b><small>' + t(L('Halaman awal: ', 'Landing: ')) + t(land ? land.n : R.landing) + '</small></span><span class="chk">' + (on ? A.chip('ok', L('Aktif', 'Active'), 'checkc') : '') + '</span></button>';
        }).join('') + '</div><p class="hint" style="margin-top:var(--jf-space-3)">' + ic('history') + ' ' + t(L('Setiap pergantian peran dicatat di audit log.', 'Every role switch is recorded in the audit log.')) + '</p>';
    },
    act: {
      role: function (el) {
        var k = el.getAttribute('data-val'); if (k === ctx().roleKey) return;
        A.sessionSwitch(X.switchRole(k), L('Peran aktif: ' + X.ROLES[k].n[0], 'Active role: ' + X.ROLES[k].n[1]));
      }
    }
  };

  /* ---------- USER-004 Ganti Plant (only assigned plants) ---------- */
  V['USER-004'] = {
    render: function () {
      var c = ctx();
      if (c.client || c.plants.length < 2) return A.pageHead() + A.stateCard('empty', L('Akun Anda hanya memiliki satu plant.', 'Your account has one plant only.'), A.btn('blue', L('Kembali', 'Back'), 'arrowl', { go: 'USER-001' }), L('Tidak ada plant lain', 'No other plant'));
      return A.pageHead(null, t(L('Data yang tampil mengikuti plant aktif.', 'The data you see follows the active plant.'))) +
        '<div class="pick" role="radiogroup" aria-label="Plant">' + c.plants.map(function (pid) {
          var on = pid === c.plant;
          return '<button type="button" class="pick-o' + (on ? ' is-on' : '') + '" role="radio" aria-checked="' + on + '" data-act="plant" data-val="' + esc(pid) + '"><span class="ic">' + ic(pid === X.ALL ? 'layers' : 'building') + '</span>' +
            '<span class="pick-t"><b>' + t(X.plantName(pid)) + '</b><small>' + t(pid === X.ALL ? L('Gabungan semua plant', 'All plants combined') : L('Order, tim dan stok plant ini', 'Orders, team and stock of this plant')) + '</small></span><span class="chk">' + (on ? A.chip('ok', L('Aktif', 'Active'), 'checkc') : '') + '</span></button>';
        }).join('') + '</div>';
    }
  };

  /* ---------- NOTIF-001 Notification center ---------- */
  var CAT_ORDER = ['crit', 'warn', 'ops', 'info'];
  function ntItem(n) {
    var cat = X.CATS[n.cat];
    return '<a class="nt' + (n.read ? '' : ' is-unread') + '" href="' + href('NOTIF-002', n.id) + '"><span class="nt-ic ' + n.cat + '">' + ic(cat.icon) + '</span>' +
      '<span class="nt-t">' + t(n.t) + (n.read ? '' : '<span class="sr"> · ' + t(L('belum dibaca', 'unread')) + '</span>') + '</span><span class="nt-m"><span>' + esc(fmt.ago(n.at)) + '</span><span class="nt-cat ' + n.cat + '">' + t(cat.n) + '</span></span>' +
      '<span class="nt-c">' + t(n.c) + '</span></a>';
  }
  V['NOTIF-001'] = {
    render: function () {
      var c = ctx(), all = X.notifsFor(c), cat = A.S.q.cat && X.CATS[A.S.q.cat] ? A.S.q.cat : '', list = all.filter(function (n) { return !cat || n.cat === cat; });
      var un = all.filter(function (n) { return !n.read; }).length;
      var tabs = '<div class="nt-tabs" role="tablist">' + [['', L('Semua', 'All'), all.length]].concat(CAT_ORDER.map(function (k) { return [k, X.CATS[k].n, all.filter(function (n) { return n.cat === k; }).length]; })).map(function (x) {
        var on = x[0] === cat;
        return '<a role="tab" aria-selected="' + on + '" class="seg-a' + (on ? ' on' : '') + '" href="' + href('NOTIF-001', null, x[0] ? { cat: x[0] } : null) + '">' + (x[0] ? '<i class="dot ' + x[0] + '"></i>' : '') + t(x[1]) + ' <span class="num">' + x[2] + '</span></a>';
      }).join('') + '</div>';
      return A.pageHead(null, un ? t(L(un + ' belum dibaca', un + ' unread')) : t(L('Semua sudah dibaca', 'All read')),
          (un ? A.btn('ghost', L('Tandai semua dibaca', 'Mark all as read'), 'check', { act: 'readall' }) : '') + A.btn('ghost', L('Pengaturan', 'Settings'), 'cog', { go: 'NOTIF-003' })) +
        tabs + (list.length ? '<div class="nt-list" style="margin-top:var(--jf-space-4)">' + list.map(ntItem).join('') + '</div>' : A.empty(L('Belum ada notifikasi.', 'No notifications yet.')));
    },
    act: { readall: function () { X.markRead(ctx(), 'all'); A.toast(L('Semua notifikasi ditandai dibaca.', 'All notifications marked as read.')); A.rerender(); } }
  };

  /* ---------- NOTIF-002 Notification detail ---------- */
  V['NOTIF-002'] = {
    title: function (rec) { var c = ctx(), n = c && X.notifsFor(c).filter(function (x) { return x.id === rec; })[0]; return n ? n.t : L('Detail Notifikasi', 'Notification Detail'); },
    render: function (o) {
      var c = ctx(), n = X.notifsFor(c).filter(function (x) { return x.id === o.rec; })[0];
      // Only notifications addressed to this user, role, plant or client can be opened.
      if (!n) return A.stateCard('noperm', L('Anda tidak memiliki akses ke halaman ini.', 'You do not have access to this page.'), A.btn('blue', L('Kembali', 'Back'), 'arrowl', { go: 'NOTIF-001' }), L('Anda tidak memiliki akses.', 'You do not have access.'));
      var cat = X.CATS[n.cat];
      return '<div class="nt-detail">' +
        '<div class="nt" style="border:1px solid var(--jf-border);border-radius:var(--jf-radius-card);background:var(--jf-surface-card)"><span class="nt-ic ' + n.cat + '">' + ic(cat.icon) + '</span><span class="nt-t">' + t(n.t) + '</span><span class="nt-m"><span>' + esc(fmt.when(n.at)) + '</span><span class="nt-cat ' + n.cat + '">' + t(cat.n) + '</span></span><span class="nt-c">' + t(n.c) + '</span></div>' +
        (n.d ? '<dl class="prof-dl">' + n.d.map(function (x) { return '<div><dt><span>' + t(x[0]) + '</span></dt><dd>' + t(x[1]) + '</dd><span></span></div>'; }).join('') + '</dl>' : '') +
        (n.hint ? '<div class="ds">' + DS.Feedback.Inline({ type: n.cat === 'crit' ? 'error' : n.cat === 'warn' ? 'warning' : 'info', title: L('Tindakan disarankan:', 'Suggested action:'), text: n.hint }) + '</div>' : '') +
        '<div class="row2">' + A.btn('ghost', L('Kembali', 'Back'), 'arrowl', { go: 'NOTIF-001' }) + (n.cta ? A.btn('primary', n.cta.l, 'arrow', { go: n.cta.s }) : '') + '</div></div>';
    },
    after: function (o) { var c = ctx(); if (c && X.notifsFor(c).some(function (x) { return x.id === o.rec && !x.read; })) { X.markRead(c, [o.rec]); var b = document.querySelector('.hd-bell .nb'); var u = X.unread(c); if (b) { if (u) b.textContent = u > 9 ? '9+' : u; else b.remove(); } } }
  };

  /* ---------- NOTIF-003 Notification settings ---------- */
  function tg(key, label, sub, on, locked) {
    return '<div class="pref-r"><span><span><b>' + t(label) + '</b>' + (sub ? '<small>' + t(sub) + '</small>' : '') + '</span></span>' +
      (locked ? '<span class="lock">' + ic('lock') + t(L('Wajib aktif', 'Always on')) + '</span>' : '') +
      '<label class="ds-toggle"><input type="checkbox" role="switch" data-pref="' + key + '"' + (on ? ' checked' : '') + (locked ? ' disabled' : '') + '><span class="sr">' + t(label) + '</span></label></div>';
  }
  V['NOTIF-003'] = {
    render: function () {
      var c = ctx(), p = X.prefs(c);
      var catSub = { crit: L('Masalah serius yang butuh tindakan segera', 'Serious problems that need action now'), warn: L('SLA hampir habis, stok menipis', 'SLA almost due, stock running low'), ops: L('Order baru, jadwal, pengiriman', 'New orders, schedules, deliveries'), info: L('Pengumuman dan pembaruan sistem', 'Announcements and system updates') };
      return A.pageHead(null, t(L('Pilih notifikasi yang ingin Anda terima.', 'Choose which notifications you receive.'))) +
        '<div class="ds" style="display:grid;gap:var(--jf-space-5);max-width:720px">' +
        A.section(L('Kategori', 'Categories'), '<div class="pref">' + CAT_ORDER.map(function (k) { return tg(k, X.CATS[k].n, catSub[k], p[k], k === 'crit'); }).join('') + '</div>', { icon: 'bell' }) +
        A.section(L('Saluran', 'Channels'), '<div class="pref">' + X.CHANNELS.map(function (ch) { return tg(ch[0], ch[1], ch[0] === 'app' ? L('Pesan keamanan dan sistem selalu tampil di aplikasi', 'Security and system messages always show in the app') : null, p[ch[0]], ch[0] === 'app'); }).join('') + '</div>', { icon: 'phone' }) +
        '<div class="row2">' + A.btn('ghost', L('Kembali', 'Back'), 'arrowl', { go: 'NOTIF-001' }) + A.btn('primary', L('Simpan', 'Save'), 'check', { act: 'save' }) + '</div></div>';
    },
    act: {
      save: function () {
        var c = ctx(), p = X.prefs(c);
        document.querySelectorAll('[data-pref]').forEach(function (el) { p[el.getAttribute('data-pref')] = el.checked; });
        X.setPrefs(c, p); A.toast(L('Pengaturan notifikasi disimpan.', 'Notification settings saved.'));
      }
    }
  };

  /* ---------- HELP-001 Bantuan (by experience) ---------- */
  var HELP = {
    frontline: [
      ['scale', L('Cara Terima Cucian', 'How to Receive Laundry'), [L('Buka Beranda, tekan Terima Cucian.', 'Open Home, tap Receive Laundry.'), L('Pilih order dari daftar.', 'Pick the order from the list.'), L('Timbang, isi berat dan jumlah bag.', 'Weigh, enter weight and bag count.'), L('Tekan Simpan. Selesai.', 'Tap Save. Done.')]],
      ['scan', L('Cara Scan Barcode', 'How to Scan a Barcode'), [L('Tekan ikon scan di layar tugas.', 'Tap the scan icon on the task screen.'), L('Arahkan kamera ke label bag.', 'Point the camera at the bag label.'), L('Order terbuka otomatis.', 'The order opens automatically.')]],
      ['alert', L('Cara Laporkan Masalah', 'How to Report a Problem'), [L('Tekan Ada Masalah.', 'Tap Report Issue.'), L('Pilih jenis masalah.', 'Choose the problem type.'), L('Tambah foto bila perlu, lalu Kirim.', 'Add a photo if needed, then Send.')]]
    ],
    driver: [
      ['route', L('Cara Mulai Rute', 'How to Start the Route'), [L('Buka Beranda, lihat Rute Hari Ini.', 'Open Home, check Today\'s Route.'), L('Tekan Mulai Rute di stop pertama.', 'Tap Start Route on the first stop.'), L('Ikuti urutan stop.', 'Follow the stop order.')]],
      ['checkc', L('Cara Konfirmasi Pengiriman', 'How to Confirm a Delivery'), [L('Buka stop pengiriman.', 'Open the delivery stop.'), L('Hitung bag, minta tanda tangan penerima.', 'Count bags, get the receiver\'s signature.'), L('Tekan Konfirmasi.', 'Tap Confirm.')]],
      ['alert', L('Cara Laporkan Masalah', 'How to Report a Problem'), [L('Tekan Ada Masalah.', 'Tap Report Issue.'), L('Pilih jenis masalah, tambah foto.', 'Choose the problem type, add a photo.'), L('Tekan Kirim.', 'Tap Send.')]]
    ],
    management: [
      ['filecheck', L('Cara Menyetujui Permintaan', 'How to Approve a Request'), [L('Buka Persetujuan dari header.', 'Open Approvals from the header.'), L('Baca alasan dan nilai sebelum / sesudah.', 'Read the reason and the before / after values.'), L('Setujui atau tolak dengan catatan.', 'Approve or reject with a note.')]],
      ['gauge', L('Cara Membaca Dashboard', 'How to Read the Dashboard'), [L('Kartu atas: angka utama hari ini.', 'Top cards: today\'s key numbers.'), L('Merah = kritis, kuning = peringatan.', 'Red = critical, amber = warning.'), L('Klik kartu untuk melihat detail.', 'Click a card to see the detail.')]],
      ['building', L('Cara Ganti Plant', 'How to Switch Plant'), [L('Klik nama plant di header.', 'Click the plant name in the header.'), L('Pilih plant. Data ikut berubah.', 'Choose a plant. The data follows.')]]
    ],
    client: [
      ['truck', L('Cara Minta Pickup', 'How to Request a Pickup'), [L('Tekan Minta Pickup di Beranda.', 'Tap Request Pickup on Home.'), L('Pilih lokasi, tanggal dan jumlah bag.', 'Choose location, date and bag count.'), L('Tekan Kirim.', 'Tap Send.')]],
      ['invoice', L('Cara Melihat Invoice', 'How to View Invoices'), [L('Buka menu Invoice.', 'Open the Invoice menu.'), L('Pilih invoice untuk melihat detail.', 'Pick an invoice to see the detail.')]]
    ]
  };
  V['HELP-001'] = {
    render: function () {
      var c = ctx(), key = c.exp === 'driver' ? 'driver' : c.group;
      return A.pageHead(null, t(L('Panduan singkat sesuai peran Anda', 'Short guides for your role'))) +
        '<div class="help-l">' + (HELP[key] || HELP.frontline).map(function (h) {
          return '<section class="help-c"><h3>' + ic(h[0]) + '<span>' + t(h[1]) + '</span></h3><ol>' + h[2].map(function (s) { return '<li>' + t(s) + '</li>'; }).join('') + '</ol></section>';
        }).join('') + '</div>' +
        A.section(L('Butuh bantuan lain?', 'Need more help?'), '<p class="hint">' + t(c.client ? L('Hubungi tim J\'Fresh melalui menu Komplain atau account manager Anda.', 'Contact the J\'Fresh team from the Complaint menu or your account manager.') : L('Hubungi supervisor atau admin sistem. Lupa password? Gunakan Lupa Password di halaman masuk.', 'Contact your supervisor or the system admin. Forgot your password? Use Forgot Password on the sign-in page.')) + '</p>', { icon: 'headset' });
    }
  };
})();
