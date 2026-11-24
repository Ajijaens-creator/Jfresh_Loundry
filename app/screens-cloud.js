/* JFRESH OS — mode asli screens (Supabase): team, accounts and access.

   Flow for a new staff member (agreed with the owner, 2026-11-24):
     1. HR (hr.manage) registers the employee in USER-011 Data Karyawan:
        name, position, department, plant, email, phone.
        The employee shows as "Menunggu akses".
     2. A user admin (sys.users: owner, super admin, system admin) opens
        USER-010 Akun & Akses, presses "Buat Akun" on that employee, sets a
        temporary password and ticks the roles. One person may hold several roles.
     A user admin can also do both at once ("Tambah Akun").

   Reads and writes go straight to the database; row level security and the
   guards in supabase/migrations decide what is allowed (nobody changes their
   own access, only a full-access user grants owner / super admin / all plants).
   Creating an account and resetting a password go through the admin-users
   Edge Function. */
(function () {
  var A = window.JFAPP, X = window.JFACCESS, DS = window.JFDS, CL = window.JFCLOUD, V = A.V;
  var T = A.T, L = A.L, t = A.t, esc = A.esc, ic = A.ic;
  A.addParents({ 'USER-000': [], 'USER-010': [], 'USER-011': [], 'MD-PLT-001': [], 'MD-CLT-001': [], 'MD-SVC-001': [], 'MD-VEH-001': [] });
  if (!CL || !CL.on) {
    ['USER-000', 'USER-010', 'USER-011', 'MD-PLT-001', 'MD-CLT-001', 'MD-SVC-001', 'MD-VEH-001'].forEach(function (k) { V[k] = { render: function () { return A.pageHead() + A.stateCard('empty', L('Halaman ini hanya tersedia di mode asli.', 'This page is only available in real mode.'), A.backBtn()); } }; });
    return;
  }
  var sb = CL.sb;

  var ERR = {
    dup: L('Email ini sudah punya akun.', 'This email already has an account.'),
    has_account: L('Karyawan ini sudah punya akun.', 'This employee already has an account.'),
    email: L('Email belum benar.', 'The email is not valid.'),
    name: L('Nama wajib diisi.', 'Name is required.'),
    pw_short: L('Password minimal 8 karakter.', 'Password must be at least 8 characters.'),
    role: L('Centang minimal satu peran.', 'Tick at least one role.'),
    plant: L('Pilih minimal satu plant.', 'Choose at least one plant.'),
    noperm: L('Anda tidak boleh mengubah akun ini.', 'You may not change this account.'),
    self: L('Akses Anda sendiri hanya bisa diubah oleh admin lain.', 'Only another admin can change your own access.'),
    network: L('Tidak dapat terhubung. Periksa koneksi internet.', 'Cannot connect. Check your internet connection.'),
    system: L('Belum berhasil. Coba lagi.', 'That did not work. Try again.')
  };
  function errMsg(code, raw) {
    if (ERR[code]) return ERR[code];
    if (/own access|own roles/i.test(raw || '')) return ERR.self;
    if (/full-access|only a full/i.test(raw || '')) return ERR.noperm;
    if (/duplicate|already/i.test(raw || '')) return ERR.dup;
    return ERR.system;
  }
  function me() { return A.ctx(); }
  function full() { var c = me(); return !!(c && c.full); }
  function canAdmin() { return X.can(me(), 'sys.users'); }
  function b(kind, label, icon, attrs) { return '<button type="button" class="btn btn-' + kind + '" ' + (attrs || '') + '>' + (icon ? ic(icon) : '') + '<span>' + t(label) + '</span></button>'; }
  function field(label, html, help) { return '<label class="ds-field"><span class="ds-label">' + t(label) + '</span>' + html + (help ? '<span class="ds-help">' + t(help) + '</span>' : '') + '</label>'; }
  function input(nm, type, val, ph, auto) { return '<div class="ds-control"><input name="' + nm + '" type="' + type + '" value="' + esc(val || '') + '"' + (ph ? ' placeholder="' + esc(T(ph)) + '"' : '') + ' autocomplete="' + (auto || 'off') + '"' + (type === 'email' || nm === 'password' ? ' autocapitalize="none"' : '') + '></div>'; }
  function select(nm, opts, sel) { return '<div class="ds-control"><select name="' + nm + '">' + opts.map(function (o) { return '<option value="' + esc(o[0]) + '"' + (o[0] === sel ? ' selected' : '') + '>' + esc(T(o[1])) + '</option>'; }).join('') + '</select><span class="ds-control__end">' + ic('chevd') + '</span></div>'; }
  function val(f, n) { var el = f.querySelector('[name="' + n + '"]'); return el ? String(el.value || '').trim() : ''; }
  function checked(f, n) { return Array.prototype.slice.call(f.querySelectorAll('input[name="' + n + '"]:checked')).map(function (x) { return x.value; }); }
  function emailOk(e) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e); }
  function skel() { return '<div class="skel"><div class="sk sk-title"></div><div class="sk sk-row"></div><div class="sk sk-row"></div><div class="sk sk-row"></div></div>'; }
  function loadErr(x) { return A.stateCard('error', L('Data belum berhasil dimuat. Coba lagi.', 'Could not load the data. Try again.'), b('blue', L('Coba Lagi', 'Try Again'), 'refresh', 'data-x="reload"')); }
  function errBox(M) { return M.err ? '<div class="acc-err">' + DS.Feedback.Inline({ type: 'error', text: M.err }) + '</div>' : ''; }
  function busy(on) { var g = document.getElementById('acc-go'); if (g) { g.disabled = on; g.classList.toggle('busy', on); } }

  /* ---------- shared reference data ---------- */
  var REF = null;
  function loadRef() {
    if (REF) return Promise.resolve(REF);
    return Promise.all([
      sb.from('roles').select('key,name_id,name_en,role_group').eq('active', true).neq('role_group', 'client').order('key'),
      sb.from('plants').select('id,name,short_name').eq('active', true).order('id')
    ]).then(function (r) {
      if (r[0].error || r[1].error) throw (r[0].error || r[1].error);
      var order = ['owner', 'superadmin', 'sysadmin', 'opsmgr', 'supervisor', 'operator', 'qc', 'prod1', 'prod2', 'prod3', 'driver', 'maint', 'supply', 'assetadm', 'finance', 'sales', 'hr', 'raceleader', 'implead', 'qalead', 'datalead', 'trainer'];
      var roles = r[0].data.slice().sort(function (a, c) { var i = order.indexOf(a.key), j = order.indexOf(c.key); return (i < 0 ? 99 : i) - (j < 0 ? 99 : j); });
      REF = { roles: roles, plants: r[1].data };
      return REF;
    });
  }
  function roleName(k) { var r = REF && REF.roles.filter(function (x) { return x.key === k; })[0]; return r ? L(r.name_id, r.name_en) : (X.ROLES[k] ? X.ROLES[k].n : L(k, k)); }
  function plantName(id) { var p = REF && REF.plants.filter(function (x) { return x.id === id; })[0]; return p ? (p.short_name || p.name) : (id || '—'); }
  function grantable(k) { return full() || (k !== 'owner' && k !== 'superadmin'); }
  function plantOpts(withNone) { return (withNone ? [['', L('— Pilih plant —', '— Choose plant —')]] : []).concat(REF.plants.map(function (p) { return [p.id, L(p.name, p.name)]; })); }

  /* =====================================================================
     USER-011 Data Karyawan (HR + user admins)
     ===================================================================== */
  var E = { view: 'list', id: null, rows: null, err: null, q: '', loadErr: false };
  function loadEmp() {
    E.loadErr = false;
    return Promise.all([loadRef(), sb.rpc('employees_overview')]).then(function (r) {
      if (r[1].error) throw r[1].error;
      E.rows = r[1].data || [];
    }).catch(function () { E.loadErr = true; });
  }
  function accChip(e) {
    if (e.account_id) return e.account_status === 'active' ? A.chip('ok', L('Punya akun', 'Has account'), 'checkc') : A.chip('mute', L('Akun nonaktif', 'Account inactive'), 'ban');
    if (e.status !== 'active') return A.chip('mute', L('Tidak aktif', 'Not active'), 'ban');
    return A.chip('warn', L('Menunggu akses', 'Waiting for access'), 'hourglass');
  }
  function empList() {
    var q = E.q.trim().toLowerCase();
    var rows = E.rows.filter(function (e) { return !q || [e.full_name, e.job_title, e.department, e.email].join(' ').toLowerCase().indexOf(q) >= 0; });
    var waiting = E.rows.filter(function (e) { return !e.account_id && e.status === 'active'; }).length;
    var list = rows.map(function (e) {
      return '<article class="acc-r"><div class="acc-h"><span class="av">' + esc((e.full_name || '?').charAt(0).toUpperCase()) + '</span><div class="acc-n"><b>' + esc(e.full_name) + '</b><small>' + esc([e.job_title, e.department].filter(Boolean).join(' · ') || '—') + '</small></div>' + accChip(e) + '</div>' +
        '<div class="acc-m"><span>' + ic('building') + esc(plantName(e.plant_id)) + '</span><span>' + ic('message') + esc(e.email || '—') + (e.phone ? ' · ' + esc(e.phone) : '') + '</span>' +
        (e.roles && e.roles.length ? '<span>' + ic('shield') + e.roles.map(function (k) { return '<span class="ds-tag">' + t(roleName(k)) + '</span>'; }).join(' ') + '</span>' : '') + '</div>' +
        '<div class="acc-a">' + b('ghost', L('Ubah Data', 'Edit'), 'edit', 'data-e="edit" data-id="' + esc(e.id) + '"') +
          (!e.account_id && e.status === 'active' && canAdmin() ? b('primary', L('Buat Akun', 'Create Account'), 'key', 'data-e="account" data-id="' + esc(e.id) + '"') : '') + '</div></article>';
    }).join('');
    return A.pageHead(null, t(L('Daftarkan karyawan baru di sini. Setelah itu admin membuatkan akun dan memberi peran.', 'Register new employees here. An admin then creates the account and assigns roles.')),
        b('primary', L('Tambah Karyawan', 'Add Employee'), 'plus', 'data-e="new"')) + errBox(E) +
      (waiting ? '<div class="acc-note">' + ic('hourglass') + '<span>' + t(L(waiting + ' karyawan menunggu akses dari admin.', waiting + ' employees are waiting for access from an admin.')) + '</span>' + (canAdmin() ? '<a href="' + A.href('USER-010') + '">' + t(L('Buka Akun & Akses', 'Open Accounts & Access')) + '</a>' : '') + '</div>' : '') +
      '<div class="acc-tools">' + DS.Input.Search({ label: L('Cari karyawan', 'Search employees'), name: 'eq', value: E.q, placeholder: L('Nama, jabatan, email...', 'Name, position, email...') }) + '<span class="hint">' + rows.length + ' ' + t(L('karyawan', 'employees')) + '</span></div>' +
      (list ? '<div class="acc-list">' + list + '</div>' : A.empty(L('Belum ada karyawan. Tekan Tambah Karyawan.', 'No employees yet. Press Add Employee.')));
  }
  function empForm(e) {
    e = e || {};
    return A.pageHead(e.id ? L('Ubah Data Karyawan', 'Edit Employee') : L('Tambah Karyawan', 'Add Employee'), t(L('Data ini dipakai untuk akun, jadwal dan laporan tim.', 'This record is used for the account, schedules and team reports.'))) + errBox(E) +
      '<form class="ds acc-f" id="emp-f" novalidate>' +
        field(L('Nama lengkap', 'Full name'), input('full_name', 'text', e.full_name, L('cth. Made Wirana', 'e.g. Made Wirana'), 'name')) +
        '<div class="acc-2">' + field(L('Jabatan', 'Position'), input('position', 'text', e.job_title, L('cth. Operator Receiving', 'e.g. Receiving Operator'))) +
          field(L('Departemen', 'Department'), input('department', 'text', e.department, L('cth. Operasional', 'e.g. Operations'))) + '</div>' +
        field(L('Plant / lokasi kerja', 'Plant / work location'), select('plant_id', plantOpts(true), e.plant_id || (REF.plants.length === 1 ? REF.plants[0].id : ''))) +
        '<div class="acc-2">' + field(L('Email', 'Email'), input('email', 'email', e.email, L('nama@email.com', 'name@email.com')), L('Dipakai untuk masuk ke JFRESH OS.', 'Used to sign in to JFRESH OS.')) +
          field(L('No. HP / WhatsApp', 'Phone / WhatsApp'), input('phone', 'tel', e.phone, '08...')) + '</div>' +
        (e.id ? field(L('Status', 'Status'), select('status', [['active', L('Aktif', 'Active')], ['inactive', L('Tidak aktif', 'Inactive')], ['resigned', L('Sudah keluar', 'Resigned')]], e.status)) : '') +
        '<div class="row2">' + b('ghost', L('Batal', 'Cancel'), 'arrowl', 'data-e="back"') + '<button type="submit" class="btn btn-primary" id="acc-go">' + ic('check') + '<span>' + t(L('Simpan', 'Save')) + '</span></button></div>' +
      '</form>';
  }
  function empPaint() {
    var root = document.getElementById('emp-root'); if (!root) return;
    if (E.loadErr) { root.innerHTML = loadErr(); return; }
    if (!E.rows) { root.innerHTML = skel(); return; }
    var e = E.id && E.rows.filter(function (x) { return x.id === E.id; })[0];
    root.innerHTML = E.view === 'new' ? empForm(null) : E.view === 'edit' && e ? empForm(e) : empList();
    DS.lang(root);
    var q = root.querySelector('input[name="eq"]');
    if (q) q.addEventListener('input', function () { E.q = this.value; var pos = this.selectionStart; empPaint(); var n = document.querySelector('#emp-root input[name="eq"]'); if (n) { n.focus(); try { n.setSelectionRange(pos, pos); } catch (x) {} } });
    var f = root.querySelector('#emp-f'); if (f) f.addEventListener('submit', function (ev) { ev.preventDefault(); empSave(f); });
  }
  function empGo(view, id) { E.view = view; E.id = id || null; E.err = null; empPaint(); window.scrollTo(0, 0); }
  function empSave(f) {
    var row = { full_name: val(f, 'full_name'), job_title: val(f, 'position') || null, department: val(f, 'department') || null, plant_id: val(f, 'plant_id') || null, email: val(f, 'email').toLowerCase() || null, phone: val(f, 'phone') || null };
    if (f.querySelector('[name="status"]')) row.status = val(f, 'status');
    if (!row.full_name) { E.err = T(ERR.name); return empPaint(); }
    if (row.email && !emailOk(row.email)) { E.err = T(ERR.email); return empPaint(); }
    if (!row.plant_id) { E.err = T(ERR.plant); return empPaint(); }
    row.short_name = row.full_name.split(' ')[0];
    busy(true);
    var p = E.view === 'edit' ? sb.from('employees').update(row).eq('id', E.id) : sb.from('employees').insert(row);
    p.then(function (r) {
      busy(false);
      if (r.error) { E.err = T(errMsg(null, r.error.message)); return empPaint(); }
      CL.log(E.view === 'edit' ? 'EMP.UPDATED' : 'EMP.CREATED', row.full_name, {});
      A.toast(E.view === 'edit' ? L('Data karyawan disimpan.', 'Employee saved.') : L('Karyawan ditambahkan. Status: menunggu akses.', 'Employee added. Status: waiting for access.'));
      E.rows = null; empGo('list'); loadEmp().then(empPaint);
    });
  }
  /* =====================================================================
     USER-000 Beranda (mode asli). No demo numbers: only what is real today
     (the team and accounts) and the modules that are still being connected.
     ===================================================================== */
  var SOON = [
    [L('Order & Pickup', 'Orders & Pickup'), 'truck'],
    [L('Produksi Laundry', 'Laundry Production'), 'shirt'], [L('Pengiriman', 'Delivery'), 'route'],
    [L('Invoice & Keuangan', 'Invoices & Finance'), 'coins'], [L('Laporan', 'Reports'), 'chart']
  ];
  V['USER-000'] = {
    title: function () { return L('Beranda', 'Home'); },
    render: function () {
      var c = A.ctx(), short = [];
      if (X.can(c, 'hr.manage') || X.can(c, 'sys.users')) short.push(A.btn('primary', L('Data Karyawan', 'Employees'), 'idcard', { go: 'USER-011' }));
      if (X.can(c, 'sys.users')) short.push(A.btn('ghost', L('Akun & Akses', 'Accounts & Access'), 'shield', { go: 'USER-010' }));
      if (X.can(c, 'sys.master')) short.push(A.btn('ghost', L('Klien & Properti', 'Clients & Properties'), 'hotel', { go: 'MD-CLT-001' }), A.btn('ghost', L('Layanan & Harga', 'Services & Prices'), 'tag', { go: 'MD-SVC-001' }), A.btn('ghost', L('Kendaraan', 'Vehicles'), 'truck', { go: 'MD-VEH-001' }), A.btn('ghost', L('Plant', 'Plants'), 'building', { go: 'MD-PLT-001' }));
      short.push(A.btn('ghost', L('Profil Saya', 'My Profile'), 'user', { go: 'USER-001' }));
      return '<div class="acc">' +
        '<div class="acc-r"><div class="acc-n"><h1 class="acc-hi">' + t(L('Halo, ', 'Hello, ')) + esc(c.name) + '</h1>' +
        '<p class="acc-sub">' + t(c.role.n) + ' · ' + esc(T(X.plantName(c.plant))) + '</p></div>' +
        '<p>' + t(L('Ini mode asli: akun dan data di sini milik J\'Fresh, bukan data contoh.', 'This is real mode: accounts and data here belong to J\'Fresh, not sample data.')) + '</p>' +
        '<div class="acc-a">' + short.join('') + '</div></div>' +
        '<div class="acc-r"><div class="acc-n"><h2 class="acc-hi2">' + t(L('Modul operasional', 'Operational modules')) + '</h2>' +
        '<p class="acc-sub">' + t(L('Sedang disambungkan ke server satu per satu. Modul muncul di menu setelah siap, mulai dalam keadaan kosong.', 'Being connected to the server one by one. Each appears in the menu once ready, starting empty.')) + '</p></div>' +
        '<ul class="acc-soon">' + SOON.map(function (m) { return '<li>' + ic(m[1]) + '<span>' + t(m[0]) + '</span><small>' + t(L('Menyusul', 'Coming')) + '</small></li>'; }).join('') + '</ul></div>' +
        '</div>';
    }
  };

  V['USER-011'] = {
    render: function () { return '<div id="emp-root" class="acc"></div>'; },
    after: function () { empPaint(); if (!E.rows) loadEmp().then(empPaint); }
  };

  /* =====================================================================
     USER-010 Akun & Akses (user admins: sys.users)
     ===================================================================== */
  var M = { view: 'list', id: null, emp: null, users: null, emps: null, err: null, q: '', loadErr: false, edits: {} };
  function loadAcc() {
    M.loadErr = false;
    return Promise.all([loadRef(),
      sb.from('profiles').select('id,email,display_name,status,full_access,all_plants,default_plant_id,employee_id,client_id,created_at,' +
        'user_roles!user_roles_user_id_fkey(role_key,is_default),user_plants(plant_id),employees(full_name,job_title,department,phone)').order('created_at'),
      sb.rpc('employees_overview')
    ]).then(function (r) {
      if (r[1].error) throw r[1].error;
      if (r[2].error) throw r[2].error;
      M.users = (r[1].data || []).filter(function (u) { return !u.client_id; });
      M.emps = r[2].data || [];
      M.edits = {};
    }).catch(function () { M.loadErr = true; });
  }
  function uname(u) { return u.display_name || (u.employees && u.employees.full_name) || u.email; }
  function stChip(u) {
    if (u.status === 'active') return A.chip('ok', L('Aktif', 'Active'), 'checkc');
    if (u.status === 'inactive') return A.chip('mute', L('Nonaktif', 'Inactive'), 'ban');
    if (u.status === 'suspended') return A.chip('warn', L('Ditangguhkan', 'Suspended'), 'ban');
    return A.chip('crit', L('Terkunci', 'Locked'), 'lock');
  }
  function curRoles(u) { return M.edits[u.id] ? M.edits[u.id] : (u.user_roles || []).map(function (r) { return r.role_key; }); }
  function dirty() { return Object.keys(M.edits).filter(function (id) { var u = findU(id); var a = (u.user_roles || []).map(function (r) { return r.role_key; }).sort().join(','); return a !== M.edits[id].slice().sort().join(','); }); }
  function findU(id) { return M.users.filter(function (u) { return u.id === id; })[0]; }
  function locked(u) { return u.id === me().user.uuid || (u.full_access && !full()); }

  function accList() {
    var q = M.q.trim().toLowerCase();
    var waiting = M.emps.filter(function (e) { return !e.account_id && e.status === 'active'; });
    var users = M.users.filter(function (u) { return !q || (uname(u) + ' ' + u.email).toLowerCase().indexOf(q) >= 0; });
    var roles = REF.roles, nd = dirty().length;

    var wait = waiting.length ? A.section(L('Menunggu Akses', 'Waiting for Access'), '<p class="hint">' + t(L('Karyawan yang sudah didaftarkan HR tapi belum punya akun.', 'Employees HR registered who have no account yet.')) + '</p><div class="acc-wait">' + waiting.map(function (e) {
      return '<div class="acc-w"><div class="acc-n"><b>' + esc(e.full_name) + '</b><small>' + esc([e.job_title, plantName(e.plant_id), e.email].filter(Boolean).join(' · ')) + '</small></div>' + b('primary', L('Buat Akun', 'Create Account'), 'key', 'data-x="fromemp" data-id="' + esc(e.id) + '"') + '</div>';
    }).join('') + '</div>', { icon: 'hourglass', count: waiting.length }) : '';

    var head = '<tr><th class="acc-sticky" scope="col">' + t(L('Nama', 'Name')) + '</th>' + roles.map(function (r) { return '<th scope="col" class="acc-rh"><span>' + t(L(r.name_id, r.name_en)) + '</span></th>'; }).join('') + '<th scope="col">' + t(L('Plant', 'Plant')) + '</th><th scope="col">' + t(L('Status', 'Status')) + '</th><th scope="col"><span class="sr">' + t(L('Aksi', 'Actions')) + '</span></th></tr>';
    var body = users.map(function (u) {
      var cur = curRoles(u), lk = locked(u), ch = M.edits[u.id] && dirty().indexOf(u.id) >= 0;
      var plants = u.full_access || u.all_plants ? t(L('Semua', 'All')) : (u.user_plants || []).map(function (p) { return esc(plantName(p.plant_id)); }).join(', ') || '—';
      return '<tr class="' + (ch ? 'is-ch' : '') + '"><th scope="row" class="acc-sticky"><b>' + esc(uname(u)) + '</b><small>' + esc(u.email) + '</small>' + (u.id === me().user.uuid ? '<small class="acc-you">' + t(L('Akun Anda', 'Your account')) + '</small>' : '') + '</th>' +
        roles.map(function (r) {
          var on = cur.indexOf(r.key) >= 0, dis = lk || !grantable(r.key) || (u.full_access && r.key === 'owner');
          return '<td class="acc-c"><input type="checkbox" class="acc-cb" data-u="' + esc(u.id) + '" data-r="' + esc(r.key) + '"' + (on ? ' checked' : '') + (dis ? ' disabled' : '') + ' aria-label="' + esc(T(L(r.name_id, r.name_en)) + ' · ' + uname(u)) + '"></td>';
        }).join('') +
        '<td class="acc-pl">' + plants + '</td><td>' + stChip(u) + '</td>' +
        '<td class="acc-ra">' + (lk ? '' : '<button type="button" class="btn btn-ghost btn-sm" data-x="menu" data-id="' + esc(u.id) + '" aria-label="' + esc(T(L('Aksi', 'Actions'))) + '">' + ic('more') + '</button>') + '</td></tr>';
    }).join('');

    return A.pageHead(null, t(L('Centang peran untuk setiap orang. Satu orang boleh punya beberapa peran.', 'Tick the roles for each person. One person may hold several roles.')),
        b('ghost', L('Data Karyawan', 'Employees'), 'idcard', 'data-x="emps"') + b('primary', L('Tambah Akun', 'Add Account'), 'plus', 'data-x="new"')) +
      errBox(M) + wait +
      A.section(L('Peran per Orang', 'Roles per Person'),
        '<div class="acc-tools">' + DS.Input.Search({ label: L('Cari nama atau email', 'Search name or email'), name: 'aq', value: M.q, placeholder: L('Cari...', 'Search...') }) + '<span class="hint">' + users.length + ' ' + t(L('akun', 'accounts')) + '</span></div>' +
        (users.length ? '<div class="acc-mx" role="region" aria-label="' + esc(T(L('Tabel peran', 'Role table'))) + '" tabindex="0"><table class="acc-t"><thead>' + head + '</thead><tbody>' + body + '</tbody></table></div>' : A.empty(L('Belum ada akun.', 'No accounts yet.'))) +
        '<div class="acc-save' + (nd ? ' is-on' : '') + '"><span>' + (nd ? t(L(nd + ' orang diubah. Simpan supaya berlaku.', nd + ' people changed. Save to apply.')) : t(L('Ubah centang, lalu tekan Simpan.', 'Change the ticks, then press Save.'))) + '</span>' +
          (nd ? b('ghost', L('Batalkan', 'Discard'), 'xc', 'data-x="discard"') : '') + '<button type="button" class="btn btn-primary" id="acc-go" data-x="saveroles"' + (nd ? '' : ' disabled') + '>' + ic('check') + '<span>' + t(L('Simpan Perubahan', 'Save Changes')) + '</span></button></div>',
        { icon: 'shield', count: users.length });
  }

  function roleChecks(sel) {
    return '<div class="acc-ck">' + REF.roles.filter(function (r) { return grantable(r.key); }).map(function (r) {
      return '<label class="ds-check"><input type="checkbox" name="roles" value="' + esc(r.key) + '"' + (sel.indexOf(r.key) >= 0 ? ' checked' : '') + '><span>' + t(L(r.name_id, r.name_en)) + '</span></label>';
    }).join('') + '</div>';
  }
  function plantChecks(sel, all) {
    return (full() ? '<label class="ds-check"><input type="checkbox" name="all"' + (all ? ' checked' : '') + '><span>' + t(L('Semua plant', 'All plants')) + '</span></label>' : '') +
      '<div class="acc-ck">' + REF.plants.map(function (p) { return '<label class="ds-check"><input type="checkbox" name="plant" value="' + esc(p.id) + '"' + (sel.indexOf(p.id) >= 0 ? ' checked' : '') + '><span>' + esc(p.name) + '</span></label>'; }).join('') + '</div>';
  }
  function newForm(e) {
    var pl = e && e.plant_id ? [e.plant_id] : (REF.plants.length === 1 ? [REF.plants[0].id] : []);
    return A.pageHead(L('Buat Akun', 'Create Account'), e ? esc(e.full_name) + (e.job_title ? ' · ' + esc(e.job_title) : '') : t(L('Isi data staf. Berikan email dan password ini ke staf secara langsung.', 'Fill in the staff details. Give this email and password to the staff member in person.'))) + errBox(M) +
      '<form class="ds acc-f" id="acc-f" novalidate>' +
        (e ? '' : field(L('Nama lengkap', 'Full name'), input('name', 'text', '', L('cth. Made Wirana', 'e.g. Made Wirana'), 'name')) +
          '<div class="acc-2">' + field(L('Jabatan', 'Position'), input('position', 'text', '', L('cth. Driver', 'e.g. Driver'))) + field(L('No. HP (opsional)', 'Phone (optional)'), input('phone', 'tel', '', '08...')) + '</div>') +
        field(L('Email untuk masuk', 'Sign-in email'), input('email', 'email', e && e.email || '', L('nama@email.com', 'name@email.com'))) +
        field(L('Password sementara', 'Temporary password'), input('password', 'text', '', L('minimal 8 karakter', 'at least 8 characters'), 'new-password'), L('Minta staf mengganti password di Profil setelah masuk pertama kali.', 'Ask the staff member to change it in Profile after the first sign-in.')) +
        '<fieldset class="acc-fs"><legend class="ds-label">' + t(L('Peran (boleh lebih dari satu)', 'Roles (one or more)')) + '</legend>' + roleChecks([]) + '</fieldset>' +
        field(L('Peran utama', 'Main role'), select('main', [['', L('— Otomatis: peran pertama yang dicentang —', '— Automatic: first ticked role —')]].concat(REF.roles.filter(function (r) { return grantable(r.key); }).map(function (r) { return [r.key, L(r.name_id, r.name_en)]; })), ''), L('Menentukan menu dan halaman awal setelah masuk.', 'Decides the menu and landing page after sign-in.')) +
        '<fieldset class="acc-fs"><legend class="ds-label">' + t(L('Plant', 'Plant')) + '</legend>' + plantChecks(pl, false) + '</fieldset>' +
        '<div class="row2">' + b('ghost', L('Batal', 'Cancel'), 'arrowl', 'data-x="back"') + '<button type="submit" class="btn btn-primary" id="acc-go">' + ic('check') + '<span>' + t(L('Buat Akun', 'Create Account')) + '</span></button></div>' +
      '</form>';
  }
  function menuView(u) {
    var def = ((u.user_roles || []).filter(function (r) { return r.is_default; })[0] || {}).role_key;
    var pl = (u.user_plants || []).map(function (p) { return p.plant_id; });
    return A.pageHead(uname(u), esc(u.email)) + errBox(M) +
      '<div class="acc-menu">' +
        A.section(L('Peran Utama & Plant', 'Main Role & Plant'),
          '<form class="ds acc-f" id="acc-pf" novalidate>' +
            field(L('Peran utama', 'Main role'), select('main', (u.user_roles || []).map(function (r) { return [r.role_key, roleName(r.role_key)]; }), def), L('Peran lain diatur lewat centang di tabel.', 'Other roles are set with the ticks in the table.')) +
            '<fieldset class="acc-fs"><legend class="ds-label">' + t(L('Plant', 'Plant')) + '</legend>' + plantChecks(pl, !!u.all_plants) + '</fieldset>' +
            '<button type="submit" class="btn btn-primary" id="acc-go">' + ic('check') + '<span>' + t(L('Simpan', 'Save')) + '</span></button></form>', { icon: 'building' }) +
        A.section(L('Atur Ulang Password', 'Reset Password'),
          '<form class="ds acc-f" id="acc-pw" novalidate>' + field(L('Password baru', 'New password'), input('password', 'text', '', L('minimal 8 karakter', 'at least 8 characters'), 'new-password'), L('Berikan ke staf, minta diganti di Profil.', 'Give it to the staff member; ask them to change it in Profile.')) +
            '<button type="submit" class="btn btn-ghost" id="acc-pwgo">' + ic('key') + '<span>' + t(L('Simpan Password', 'Save Password')) + '</span></button></form>', { icon: 'key' }) +
        A.section(L('Status Akun', 'Account Status'), '<p>' + stChip(u) + '</p><p class="hint">' + t(u.status === 'active' ? L('Akun nonaktif tidak bisa masuk. Data dan riwayatnya tetap tersimpan.', 'An inactive account cannot sign in. Its data and history are kept.') : L('Aktifkan supaya staf bisa masuk lagi.', 'Activate so the staff member can sign in again.')) + '</p>' +
          (u.status === 'active' ? b('ghost', L('Nonaktifkan Akun', 'Deactivate Account'), 'ban', 'data-x="off" data-id="' + esc(u.id) + '"') : b('primary', L('Aktifkan Akun', 'Activate Account'), 'checkc', 'data-x="on" data-id="' + esc(u.id) + '"')), { icon: 'user' }) +
      '</div>' + b('ghost', L('Kembali ke daftar', 'Back to list'), 'arrowl', 'data-x="back"');
  }

  function accPaint() {
    var root = document.getElementById('acc-root'); if (!root) return;
    if (M.loadErr) { root.innerHTML = loadErr(); return; }
    if (!M.users) { root.innerHTML = skel(); return; }
    var u = M.id && findU(M.id), e = M.emp && M.emps.filter(function (x) { return x.id === M.emp; })[0];
    root.innerHTML = M.view === 'new' ? newForm(e || null) : M.view === 'menu' && u ? menuView(u) : accList();
    DS.lang(root);
    var q = root.querySelector('input[name="aq"]');
    if (q) q.addEventListener('input', function () { M.q = this.value; var pos = this.selectionStart; accPaint(); var n = document.querySelector('#acc-root input[name="aq"]'); if (n) { n.focus(); try { n.setSelectionRange(pos, pos); } catch (x) {} } });
    var f = root.querySelector('#acc-f'); if (f) f.addEventListener('submit', function (ev) { ev.preventDefault(); createAcc(f, e); });
    var pf = root.querySelector('#acc-pf'); if (pf) pf.addEventListener('submit', function (ev) { ev.preventDefault(); savePlant(pf, u); });
    var pw = root.querySelector('#acc-pw'); if (pw) pw.addEventListener('submit', function (ev) { ev.preventDefault(); savePw(pw, u); });
  }
  function accGo(view, id, emp) { M.view = view; M.id = id || null; M.emp = emp || null; M.err = null; accPaint(); window.scrollTo(0, 0); }
  function reloadAcc(msg) { if (msg) A.toast(msg); M.users = null; accGo('list'); loadAcc().then(accPaint); }
  function fail(code, raw) { M.err = T(errMsg(code, raw)); accPaint(); var el = document.querySelector('.acc-err'); if (el) el.scrollIntoView({ block: 'center' }); }

  function createAcc(f, e) {
    var roles = checked(f, 'roles'), main = val(f, 'main'), plants = checked(f, 'plant'), allEl = f.querySelector('input[name="all"]'), all = !!(allEl && allEl.checked);
    var email = val(f, 'email').toLowerCase(), pw = f.querySelector('[name="password"]').value, name = e ? e.full_name : val(f, 'name');
    if (!name) return fail('name'); if (!emailOk(email)) return fail('email'); if (pw.length < 8) return fail('pw_short');
    if (!roles.length) return fail('role'); if (!all && !plants.length) return fail('plant');
    if (!main || roles.indexOf(main) < 0) main = roles[0];
    busy(true);
    CL.fn('admin-users', { action: 'create', email: email, password: pw, name: name, employee_id: e ? e.id : null, position: e ? null : (val(f, 'position') || null), phone: e ? null : (val(f, 'phone') || null),
      roles: roles, default_role: main, plants: plants, all_plants: all }).then(function (r) {
      busy(false);
      if (!r || !r.ok) return fail(r && r.code, r && r.msg);
      reloadAcc(L('Akun ' + name + ' berhasil dibuat. Berikan email dan password ke staf.', 'Account for ' + name + ' created. Give the email and password to the staff member.'));
    });
  }
  // Save the role ticks of every changed person. Each person: remove unticked roles, add ticked ones, keep one main role.
  function saveRoles() {
    var ids = dirty(); if (!ids.length) return;
    var bad = ids.filter(function (id) { return !M.edits[id].length; });
    if (bad.length) return fail('role');
    busy(true);
    var chain = Promise.resolve(), failed = null;
    ids.forEach(function (id) {
      chain = chain.then(function () {
        if (failed) return;
        var u = findU(id), before = (u.user_roles || []).map(function (r) { return r.role_key; }), after = M.edits[id];
        var oldDef = ((u.user_roles || []).filter(function (r) { return r.is_default; })[0] || {}).role_key;
        var def = after.indexOf(oldDef) >= 0 ? oldDef : after[0];
        var del = before.filter(function (k) { return after.indexOf(k) < 0; }), add = after.filter(function (k) { return before.indexOf(k) < 0; });
        var p = del.length ? sb.from('user_roles').delete().eq('user_id', id).in('role_key', del) : Promise.resolve({ error: null });
        return p.then(function (r) {
          if (r.error) throw r.error;
          return add.length ? sb.from('user_roles').insert(add.map(function (k) { return { user_id: id, role_key: k, is_default: k === def && oldDef !== def }; })) : { error: null };
        }).then(function (r) {
          if (r.error) throw r.error;
          if (oldDef === def || add.indexOf(def) >= 0) return { error: null };
          return sb.from('user_roles').update({ is_default: true }).eq('user_id', id).eq('role_key', def);
        }).then(function (r) {
          if (r.error) throw r.error;
          return sb.from('profiles').update({ can_switch_role: after.length > 1 }).eq('id', id);
        }).then(function (r) {
          if (r.error) throw r.error;
          CL.log('ACC.ROLE_CHANGED', u.email, { from: before, to: after });
        }).catch(function (e) { failed = { u: u, e: e }; });
      });
    });
    chain.then(function () {
      busy(false);
      if (failed) { M.err = T(L('Peran ' + uname(failed.u) + ' belum tersimpan: ', 'Roles for ' + uname(failed.u) + ' not saved: ')) + T(errMsg(null, failed.e && failed.e.message)); var keep = M.err; loadAcc().then(function () { M.err = keep; accPaint(); }); return; }
      reloadAcc(L('Peran disimpan. Berlaku saat staf membuka aplikasi berikutnya.', 'Roles saved. They apply the next time the staff member opens the app.'));
    });
  }
  function savePlant(f, u) {
    var main = val(f, 'main'), plants = checked(f, 'plant'), allEl = f.querySelector('input[name="all"]'), all = !!(allEl && allEl.checked);
    if (!all && !plants.length) return fail('plant');
    var oldDef = ((u.user_roles || []).filter(function (r) { return r.is_default; })[0] || {}).role_key;
    busy(true);
    var p = main && main !== oldDef ? sb.from('user_roles').update({ is_default: false }).eq('user_id', u.id).then(function (r) { if (r.error) throw r.error; return sb.from('user_roles').update({ is_default: true }).eq('user_id', u.id).eq('role_key', main); }) : Promise.resolve({ error: null });
    p.then(function (r) {
      if (r.error) throw r.error;
      return sb.from('profiles').update({ all_plants: all, default_plant_id: all ? null : plants[0] }).eq('id', u.id);
    }).then(function (r) {
      if (r.error) throw r.error;
      return sb.from('user_plants').delete().eq('user_id', u.id);
    }).then(function (r) {
      if (r.error) throw r.error;
      return all ? { error: null } : sb.from('user_plants').insert(plants.map(function (pid) { return { user_id: u.id, plant_id: pid }; }));
    }).then(function (r) {
      if (r.error) throw r.error;
      CL.log('ACC.PLANT_CHANGED', u.email, { main: main, plants: all ? ['*'] : plants });
      busy(false); reloadAcc(L('Peran utama dan plant disimpan.', 'Main role and plant saved.'));
    }).catch(function (e) { busy(false); fail(null, e && e.message); });
  }
  function savePw(f, u) {
    var pw = f.querySelector('[name="password"]').value;
    if (pw.length < 8) return fail('pw_short');
    var g = document.getElementById('acc-pwgo'); if (g) g.disabled = true;
    CL.fn('admin-users', { action: 'set_password', user_id: u.id, password: pw }).then(function (r) {
      if (g) g.disabled = false;
      if (!r || !r.ok) return fail(r && r.code, r && r.msg);
      A.toast(L('Password baru disimpan. Berikan ke staf.', 'New password saved. Give it to the staff member.'));
      f.reset();
    });
  }
  function setStatus(id, status) {
    var u = findU(id);
    sb.from('profiles').update({ status: status, locked_until: null }).eq('id', id).then(function (r) {
      if (r.error) return fail(null, r.error.message);
      CL.log(status === 'active' ? 'ACC.ACTIVATED' : 'ACC.DEACTIVATED', u.email, {});
      reloadAcc(status === 'active' ? L('Akun diaktifkan.', 'Account activated.') : L('Akun dinonaktifkan. Staf ini tidak bisa masuk lagi.', 'Account deactivated. This person can no longer sign in.'));
    });
  }

  document.addEventListener('change', function (e) {
    var cb = e.target.closest('#acc-root .acc-cb'); if (!cb) return;
    var id = cb.getAttribute('data-u'), k = cb.getAttribute('data-r'), u = findU(id);
    var cur = curRoles(u).slice();
    if (cb.checked && cur.indexOf(k) < 0) cur.push(k); else if (!cb.checked) cur = cur.filter(function (x) { return x !== k; });
    M.edits[id] = cur;
    var y = window.scrollY, mx = document.querySelector('.acc-mx'), sx = mx ? mx.scrollLeft : 0;
    accPaint();
    var mx2 = document.querySelector('.acc-mx'); if (mx2) mx2.scrollLeft = sx; window.scrollTo(0, y);
  });
  /* =====================================================================
     MD-PLT-001 Master Data · Plant (sys.master)
     A plant is never deleted: other records point to it. It is switched off.
     ===================================================================== */
  var P = { view: 'list', id: null, rows: null, err: null, loadErr: false };
  function loadPlants() {
    P.loadErr = false;
    return sb.from('plants').select('id,name,short_name,active,created_at').order('id').then(function (r) {
      if (r.error) throw r.error;
      P.rows = r.data || [];
    }).catch(function () { P.loadErr = true; });
  }
  function nextPlantId() {
    var n = 0; (P.rows || []).forEach(function (p) { var m = /^PL-(\d+)$/.exec(p.id); if (m) n = Math.max(n, +m[1]); });
    return 'PL-' + String(n + 1).padStart(2, '0');
  }
  function pltList() {
    var list = P.rows.map(function (p) {
      return '<article class="acc-r"><div class="acc-h"><span class="av">' + ic('building') + '</span><div class="acc-n"><b>' + esc(p.name) + '</b><small>' + esc(p.id) + (p.short_name ? ' · ' + esc(p.short_name) : '') + '</small></div>' +
        (p.active ? A.chip('ok', L('Aktif', 'Active'), 'checkc') : A.chip('mute', L('Nonaktif', 'Inactive'), 'ban')) + '</div>' +
        '<div class="acc-a">' + b('ghost', L('Ubah', 'Edit'), 'edit', 'data-p="edit" data-id="' + esc(p.id) + '"') +
          (p.active ? b('ghost', L('Nonaktifkan', 'Deactivate'), 'ban', 'data-p="off" data-id="' + esc(p.id) + '"') : b('ghost', L('Aktifkan', 'Activate'), 'check', 'data-p="on" data-id="' + esc(p.id) + '"')) + '</div></article>';
    }).join('');
    return A.pageHead(null, t(L('Lokasi laundry milik J\'Fresh. Plant dipakai untuk karyawan, akun, order dan laporan.', 'J\'Fresh laundry locations. Plants are used for employees, accounts, orders and reports.')),
        b('primary', L('Tambah Plant', 'Add Plant'), 'plus', 'data-p="new"')) + errBox(P) +
      (list ? '<div class="acc-list">' + list + '</div>' : A.empty(L('Belum ada plant. Tekan Tambah Plant.', 'No plants yet. Press Add Plant.')));
  }
  function pltForm(p) {
    var isNew = !p; p = p || { id: nextPlantId() };
    return A.pageHead(isNew ? L('Tambah Plant', 'Add Plant') : L('Ubah Plant', 'Edit Plant'), t(L('Kode plant tidak bisa diubah setelah disimpan.', 'The plant code cannot change after saving.'))) + errBox(P) +
      '<form class="ds acc-f" id="plt-f" novalidate>' +
        '<div class="acc-2">' + field(L('Kode plant', 'Plant code'), isNew ? input('id', 'text', p.id, 'PL-03') : '<div class="ds-control"><input name="id" type="text" value="' + esc(p.id) + '" readonly></div>', L('Format PL-01, PL-02, ...', 'Format PL-01, PL-02, ...')) +
          field(L('Nama singkat', 'Short name'), input('short_name', 'text', p.short_name, L('cth. Ubud', 'e.g. Ubud'))) + '</div>' +
        field(L('Nama plant', 'Plant name'), input('name', 'text', p.name, L('cth. J\'Fresh Plant Ubud', 'e.g. J\'Fresh Plant Ubud'))) +
        '<div class="row2">' + b('ghost', L('Batal', 'Cancel'), 'arrowl', 'data-p="back"') + '<button type="submit" class="btn btn-primary" id="acc-go">' + ic('check') + '<span>' + t(L('Simpan', 'Save')) + '</span></button></div>' +
      '</form>';
  }
  function pltPaint() {
    var root = document.getElementById('plt-root'); if (!root) return;
    if (P.loadErr) { root.innerHTML = loadErr(); return; }
    if (!P.rows) { root.innerHTML = skel(); return; }
    var p = P.id && P.rows.filter(function (x) { return x.id === P.id; })[0];
    root.innerHTML = P.view === 'new' ? pltForm(null) : P.view === 'edit' && p ? pltForm(p) : pltList();
    DS.lang(root);
    var f = root.querySelector('#plt-f'); if (f) f.addEventListener('submit', function (ev) { ev.preventDefault(); pltSave(f); });
  }
  function pltGo(view, id) { P.view = view; P.id = id || null; P.err = null; pltPaint(); window.scrollTo(0, 0); }
  function pltDone(msg) { REF = null; loadPlants().then(function () { P.view = 'list'; P.id = null; P.err = null; pltPaint(); A.toast(msg); }); }
  function pltSave(f) {
    var isNew = P.view === 'new', id = val(f, 'id').toUpperCase(), row = { name: val(f, 'name'), short_name: val(f, 'short_name') || null };
    if (isNew && !/^PL-\d{2,3}$/.test(id)) { P.err = T(L('Kode plant harus seperti PL-03.', 'The plant code must look like PL-03.')); return pltPaint(); }
    if (!row.name) { P.err = T(L('Nama plant wajib diisi.', 'Plant name is required.')); return pltPaint(); }
    if (isNew && P.rows.some(function (x) { return x.id === id; })) { P.err = T(L('Kode plant ini sudah dipakai.', 'This plant code is already used.')); return pltPaint(); }
    busy(true);
    var q = isNew ? sb.from('plants').insert(Object.assign({ id: id, active: true }, row)) : sb.from('plants').update(row).eq('id', P.id);
    q.then(function (r) {
      busy(false);
      if (r.error) { P.err = T(errMsg(null, r.error.message)); return pltPaint(); }
      CL.log(isNew ? 'MD.PLANT_CREATED' : 'MD.PLANT_UPDATED', isNew ? id : P.id, { name: row.name });
      pltDone(isNew ? L('Plant ditambahkan.', 'Plant added.') : L('Plant disimpan.', 'Plant saved.'));
    }, function () { busy(false); P.err = T(ERR.network); pltPaint(); });
  }
  function pltActive(id, on) {
    if (!on && P.rows.filter(function (x) { return x.active; }).length < 2) { P.err = T(L('Minimal harus ada satu plant aktif.', 'At least one plant must stay active.')); return pltPaint(); }
    sb.from('plants').update({ active: on }).eq('id', id).then(function (r) {
      if (r.error) { P.err = T(errMsg(null, r.error.message)); return pltPaint(); }
      CL.log(on ? 'MD.PLANT_ON' : 'MD.PLANT_OFF', id, {});
      pltDone(on ? L('Plant diaktifkan.', 'Plant activated.') : L('Plant dinonaktifkan. Data lamanya tetap tersimpan.', 'Plant deactivated. Its records are kept.'));
    }, function () { P.err = T(ERR.network); pltPaint(); });
  }
  V['MD-PLT-001'] = {
    render: function () { return '<div id="plt-root" class="acc"></div>'; },
    after: function () { pltPaint(); if (!P.rows) loadPlants().then(pltPaint); }
  };
  document.addEventListener('click', function (e) {
    var el = e.target.closest('#plt-root [data-p], #plt-root [data-x]'); if (!el) return;
    var x = el.getAttribute('data-p'), id = el.getAttribute('data-id');
    if (x === 'new') pltGo('new');
    else if (x === 'edit') pltGo('edit', id);
    else if (x === 'back') pltGo('list');
    else if (x === 'off') pltActive(id, false);
    else if (x === 'on') pltActive(id, true);
    else if (el.getAttribute('data-x') === 'reload') { P.rows = null; pltPaint(); loadPlants().then(pltPaint); }
  });

  /* =====================================================================
     MD-CLT-001 Master Data · Klien & Properti (sys.master)
     Client = the company J'Fresh bills. Property = each place J'Fresh picks
     up from and delivers to. Never deleted, only switched off.
     ===================================================================== */
  var TYPES = [['hotel', L('Hotel', 'Hotel')], ['resort', L('Resort', 'Resort')], ['villa', L('Villa', 'Villa')], ['spa', L('Spa & wellness', 'Spa & wellness')], ['fnb', L('Restoran / F&B', 'Restaurant / F&B')], ['personal', L('Pelanggan pribadi', 'Personal customer')], ['other', L('Lainnya', 'Other')]];
  var CST = { prospect: ['info', L('Prospek', 'Prospect'), 'star'], active: ['ok', L('Aktif', 'Active'), 'checkc'], onhold: ['warn', L('Ditahan', 'On hold'), 'pause'], inactive: ['mute', L('Nonaktif', 'Inactive'), 'ban'] };
  var K = { view: 'list', id: null, pid: null, rows: null, props: null, err: null, q: '', loadErr: false };
  function typeName(k) { var x = TYPES.filter(function (t2) { return t2[0] === k; })[0]; return x ? x[1] : L(k || '—', k || '—'); }
  function loadClients() {
    K.loadErr = false;
    return Promise.all([loadRef(),
      sb.from('clients').select('id,name,legal_name,client_type,tax_id,billing_address,city,plant_id,contact_name,contact_phone,contact_email,payment_terms_days,notes,status').order('id'),
      sb.from('properties').select('id,client_id,name,property_type,address,city,plant_id,contact_name,contact_phone,pickup_schedule,delivery_schedule,instructions,status').order('id')
    ]).then(function (r) {
      if (r[1].error) throw r[1].error;
      if (r[2].error) throw r[2].error;
      K.rows = r[1].data || []; K.props = r[2].data || [];
    }).catch(function () { K.loadErr = true; });
  }
  function nextCode(rows, re, fmt) { var n = 0; rows.forEach(function (x) { var m = re.exec(x.id); if (m) n = Math.max(n, +m[1]); }); return fmt(n + 1); }
  function nextClientId() { return nextCode(K.rows, /^CL-(\d+)$/, function (n) { return 'CL-' + String(n).padStart(2, '0'); }); }
  function nextPropId(cid) {
    var mine = K.props.filter(function (p) { return p.client_id === cid; }), base = cid.replace(/^CL-/, 'PR-'), used = mine.map(function (p) { return p.id; });
    for (var i = 0; i < 26; i++) { var id = base + String.fromCharCode(65 + i); if (used.indexOf(id) < 0 && !K.props.some(function (p) { return p.id === id; })) return id; }
    return base + '-' + (mine.length + 1);
  }
  function propsOf(cid) { return K.props.filter(function (p) { return p.client_id === cid; }); }
  function area(nm, v, ph) { return '<div class="ds-control"><textarea name="' + nm + '" rows="2" maxlength="500"' + (ph ? ' placeholder="' + esc(T(ph)) + '"' : '') + '>' + esc(v || '') + '</textarea></div>'; }
  function cltList() {
    var q = K.q.trim().toLowerCase();
    var rows = K.rows.filter(function (c) { return !q || [c.id, c.name, c.legal_name, c.city, c.contact_name].join(' ').toLowerCase().indexOf(q) >= 0; });
    var list = rows.map(function (c) {
      var st = CST[c.status] || CST.active, n = propsOf(c.id).filter(function (p) { return p.status === 'active'; }).length;
      return '<article class="acc-r"><div class="acc-h"><span class="av">' + esc((c.name || '?').charAt(0).toUpperCase()) + '</span><div class="acc-n"><b>' + esc(c.name) + '</b><small>' + esc(c.id) + ' · ' + t(typeName(c.client_type)) + (c.city ? ' · ' + esc(c.city) : '') + '</small></div>' + A.chip(st[0], st[1], st[2]) + '</div>' +
        '<div class="acc-m"><span>' + ic('hotel') + t(L(n + ' properti aktif', n + ' active properties')) + '</span><span>' + ic('building') + esc(plantName(c.plant_id)) + '</span>' + (c.contact_name ? '<span>' + ic('user') + esc(c.contact_name) + (c.contact_phone ? ' · ' + esc(c.contact_phone) : '') + '</span>' : '') + '</div>' +
        '<div class="acc-a">' + b('primary', L('Buka', 'Open'), 'arrow', 'data-k="open" data-id="' + esc(c.id) + '"') + b('ghost', L('Ubah', 'Edit'), 'edit', 'data-k="edit" data-id="' + esc(c.id) + '"') + '</div></article>';
    }).join('');
    return A.pageHead(null, t(L('Klien yang ditagih J\'Fresh, dan properti tempat pickup dan pengiriman.', 'Clients J\'Fresh bills, and the properties it picks up from and delivers to.')),
        b('primary', L('Tambah Klien', 'Add Client'), 'plus', 'data-k="new"')) + errBox(K) +
      '<div class="acc-tools">' + DS.Input.Search({ label: L('Cari klien', 'Search clients'), name: 'kq', value: K.q, placeholder: L('Nama, kota, kontak...', 'Name, city, contact...') }) + '<span class="hint">' + rows.length + ' ' + t(L('klien', 'clients')) + '</span></div>' +
      (list ? '<div class="acc-list">' + list + '</div>' : A.empty(K.rows.length ? L('Tidak ada klien yang cocok.', 'No matching clients.') : L('Belum ada klien. Tekan Tambah Klien.', 'No clients yet. Press Add Client.')));
  }
  function cltForm(c) {
    var isNew = !c; c = c || { id: nextClientId(), client_type: 'hotel', payment_terms_days: 30, status: 'active', plant_id: REF.plants.length === 1 ? REF.plants[0].id : '' };
    return A.pageHead(isNew ? L('Tambah Klien', 'Add Client') : L('Ubah Klien', 'Edit Client'), t(L('Kode klien tidak bisa diubah setelah disimpan.', 'The client code cannot change after saving.'))) + errBox(K) +
      '<form class="ds acc-f" id="clt-f" novalidate>' +
        '<div class="acc-2">' + field(L('Kode klien', 'Client code'), '<div class="ds-control"><input name="id" type="text" value="' + esc(c.id) + '"' + (isNew ? '' : ' readonly') + '></div>') +
          field(L('Jenis', 'Type'), select('client_type', TYPES, c.client_type)) + '</div>' +
        field(L('Nama klien', 'Client name'), input('name', 'text', c.name, L('cth. Jaens Spa Group', 'e.g. Jaens Spa Group'))) +
        '<div class="acc-2">' + field(L('Nama badan usaha (untuk invoice)', 'Legal name (for invoices)'), input('legal_name', 'text', c.legal_name, L('cth. PT Jaens Spa Indonesia', 'e.g. PT Jaens Spa Indonesia'))) +
          field(L('NPWP', 'Tax ID'), input('tax_id', 'text', c.tax_id, '00.000.000.0-000.000')) + '</div>' +
        field(L('Alamat penagihan', 'Billing address'), area('billing_address', c.billing_address)) +
        '<div class="acc-2">' + field(L('Kota / area', 'City / area'), input('city', 'text', c.city, L('cth. Ubud', 'e.g. Ubud'))) +
          field(L('Plant yang melayani', 'Serving plant'), select('plant_id', plantOpts(true), c.plant_id)) + '</div>' +
        '<div class="acc-2">' + field(L('Nama kontak', 'Contact name'), input('contact_name', 'text', c.contact_name)) +
          field(L('No. HP / WhatsApp kontak', 'Contact phone / WhatsApp'), input('contact_phone', 'tel', c.contact_phone, '08...')) + '</div>' +
        '<div class="acc-2">' + field(L('Email kontak / tagihan', 'Contact / billing email'), input('contact_email', 'email', c.contact_email, L('nama@email.com', 'name@email.com'))) +
          field(L('Jatuh tempo (hari)', 'Payment terms (days)'), input('payment_terms_days', 'number', String(c.payment_terms_days == null ? 30 : c.payment_terms_days)), L('0 = bayar tunai saat pengiriman.', '0 = cash on delivery.')) + '</div>' +
        field(L('Status', 'Status'), select('status', Object.keys(CST).map(function (k) { return [k, CST[k][1]]; }), c.status)) +
        field(L('Catatan', 'Notes'), area('notes', c.notes)) +
        '<div class="row2">' + b('ghost', L('Batal', 'Cancel'), 'arrowl', 'data-k="' + (isNew ? 'back' : 'open') + '" data-id="' + esc(c.id) + '"') + '<button type="submit" class="btn btn-primary" id="acc-go">' + ic('check') + '<span>' + t(L('Simpan', 'Save')) + '</span></button></div>' +
      '</form>';
  }
  function cltDetail(c) {
    var st = CST[c.status] || CST.active, ps = propsOf(c.id);
    var info = [[L('Badan usaha', 'Legal name'), c.legal_name], [L('NPWP', 'Tax ID'), c.tax_id], [L('Alamat penagihan', 'Billing address'), c.billing_address], [L('Plant', 'Plant'), plantName(c.plant_id)],
      [L('Kontak', 'Contact'), [c.contact_name, c.contact_phone, c.contact_email].filter(Boolean).join(' · ')], [L('Jatuh tempo', 'Payment terms'), c.payment_terms_days ? T(L(c.payment_terms_days + ' hari', c.payment_terms_days + ' days')) : T(L('Tunai saat pengiriman', 'Cash on delivery'))], [L('Catatan', 'Notes'), c.notes]]
      .filter(function (x) { return x[1]; }).map(function (x) { return '<div><dt>' + t(x[0]) + '</dt><dd>' + esc(x[1]) + '</dd></div>'; }).join('');
    var plist = ps.map(function (p) {
      return '<article class="acc-r"><div class="acc-h"><span class="av">' + ic('hotel') + '</span><div class="acc-n"><b>' + esc(p.name) + '</b><small>' + esc(p.id) + ' · ' + t(typeName(p.property_type)) + (p.city ? ' · ' + esc(p.city) : '') + '</small></div>' +
        (p.status === 'active' ? A.chip('ok', L('Aktif', 'Active'), 'checkc') : A.chip('mute', L('Nonaktif', 'Inactive'), 'ban')) + '</div>' +
        '<div class="acc-m">' + (p.address ? '<span>' + ic('pin') + esc(p.address) + '</span>' : '') + (p.pickup_schedule || p.delivery_schedule ? '<span>' + ic('clock') + esc([p.pickup_schedule && T(L('Pickup ', 'Pickup ')) + p.pickup_schedule, p.delivery_schedule && T(L('Antar ', 'Delivery ')) + p.delivery_schedule].filter(Boolean).join(' · ')) + '</span>' : '') +
          (p.contact_name ? '<span>' + ic('user') + esc(p.contact_name) + (p.contact_phone ? ' · ' + esc(p.contact_phone) : '') + '</span>' : '') + '</div>' +
        '<div class="acc-a">' + b('ghost', L('Ubah', 'Edit'), 'edit', 'data-k="pedit" data-id="' + esc(p.id) + '"') +
          (p.status === 'active' ? b('ghost', L('Nonaktifkan', 'Deactivate'), 'ban', 'data-k="poff" data-id="' + esc(p.id) + '"') : b('ghost', L('Aktifkan', 'Activate'), 'check', 'data-k="pon" data-id="' + esc(p.id) + '"')) + '</div></article>';
    }).join('');
    return A.pageHead(c.name, t(c.id + ' · ' + T(typeName(c.client_type))), b('ghost', L('Semua Klien', 'All Clients'), 'arrowl', 'data-k="back"') + b('ghost', L('Ubah Klien', 'Edit Client'), 'edit', 'data-k="edit" data-id="' + esc(c.id) + '"')) + errBox(K) +
      '<div class="acc-r"><div class="acc-h"><div class="acc-n"><b>' + t(L('Data klien', 'Client details')) + '</b></div>' + A.chip(st[0], st[1], st[2]) + '</div>' + (info ? '<dl class="md-dl">' + info + '</dl>' : '') + '</div>' +
      '<div class="acc-tools"><h2 class="acc-hi2">' + t(L('Properti', 'Properties')) + ' (' + ps.length + ')</h2><span class="hd-sp"></span>' + b('primary', L('Tambah Properti', 'Add Property'), 'plus', 'data-k="pnew"') + '</div>' +
      (plist ? '<div class="acc-list">' + plist + '</div>' : A.empty(L('Belum ada properti. Tambahkan minimal satu lokasi pickup.', 'No properties yet. Add at least one pickup location.'))) +
      ratesCard(c);
  }
  function propForm(c, p) {
    var isNew = !p; p = p || { id: nextPropId(c.id), property_type: c.client_type, city: c.city, plant_id: c.plant_id };
    return A.pageHead(isNew ? L('Tambah Properti', 'Add Property') : L('Ubah Properti', 'Edit Property'), t(c.name)) + errBox(K) +
      '<form class="ds acc-f" id="prp-f" novalidate>' +
        '<div class="acc-2">' + field(L('Kode properti', 'Property code'), '<div class="ds-control"><input name="id" type="text" value="' + esc(p.id) + '"' + (isNew ? '' : ' readonly') + '></div>') +
          field(L('Jenis', 'Type'), select('property_type', TYPES, p.property_type)) + '</div>' +
        field(L('Nama properti', 'Property name'), input('name', 'text', p.name, L('cth. Jaens Spa Ubud', 'e.g. Jaens Spa Ubud'))) +
        field(L('Alamat pickup & pengiriman', 'Pickup & delivery address'), area('address', p.address)) +
        '<div class="acc-2">' + field(L('Kota / area', 'City / area'), input('city', 'text', p.city)) +
          field(L('Plant yang melayani', 'Serving plant'), select('plant_id', plantOpts(true), p.plant_id)) + '</div>' +
        '<div class="acc-2">' + field(L('Kontak di lokasi', 'On-site contact'), input('contact_name', 'text', p.contact_name)) +
          field(L('No. HP kontak', 'Contact phone'), input('contact_phone', 'tel', p.contact_phone, '08...')) + '</div>' +
        '<div class="acc-2">' + field(L('Jadwal pickup', 'Pickup schedule'), input('pickup_schedule', 'text', p.pickup_schedule, L('cth. Setiap hari 07:00', 'e.g. Daily 07:00'))) +
          field(L('Jadwal antar', 'Delivery schedule'), input('delivery_schedule', 'text', p.delivery_schedule, L('cth. Setiap hari 16:00', 'e.g. Daily 16:00'))) + '</div>' +
        field(L('Instruksi untuk driver', 'Instructions for the driver'), area('instructions', p.instructions, L('cth. Masuk lewat pintu servis belakang.', 'e.g. Use the back service entrance.'))) +
        '<div class="row2">' + b('ghost', L('Batal', 'Cancel'), 'arrowl', 'data-k="open" data-id="' + esc(c.id) + '"') + '<button type="submit" class="btn btn-primary" id="acc-go">' + ic('check') + '<span>' + t(L('Simpan', 'Save')) + '</span></button></div>' +
      '</form>';
  }
  function cltPaint() {
    var root = document.getElementById('clt-root'); if (!root) return;
    if (K.loadErr) { root.innerHTML = loadErr(); return; }
    if (!K.rows) { root.innerHTML = skel(); return; }
    var c = K.id && K.rows.filter(function (x) { return x.id === K.id; })[0], p = K.pid && K.props.filter(function (x) { return x.id === K.pid; })[0];
    root.innerHTML = K.view === 'new' ? cltForm(null) : K.view === 'edit' && c ? cltForm(c) : K.view === 'open' && c ? cltDetail(c) :
      K.view === 'pnew' && c ? propForm(c, null) : K.view === 'pedit' && c && p ? propForm(c, p) : K.view === 'rates' && c && R.rows ? ratesForm(c) : cltList();
    if (K.view === 'open' && c && R.cid !== c.id) loadRates(c.id).then(cltPaint);
    DS.lang(root);
    var q = root.querySelector('input[name="kq"]');
    if (q) q.addEventListener('input', function () { K.q = this.value; var pos = this.selectionStart; cltPaint(); var n = document.querySelector('#clt-root input[name="kq"]'); if (n) { n.focus(); try { n.setSelectionRange(pos, pos); } catch (x) {} } });
    var f = root.querySelector('#clt-f'); if (f) f.addEventListener('submit', function (ev) { ev.preventDefault(); cltSave(f); });
    var g = root.querySelector('#prp-f'); if (g) g.addEventListener('submit', function (ev) { ev.preventDefault(); propSave(g); });
    var h = root.querySelector('#rate-f'); if (h) h.addEventListener('submit', function (ev) { ev.preventDefault(); ratesSave(h); });
  }
  function cltGo(view, id, pid) { K.view = view; K.id = id || null; K.pid = pid || null; K.err = null; cltPaint(); window.scrollTo(0, 0); }
  function cltReload(view, id, msg) { loadClients().then(function () { cltGo(view, id); if (msg) A.toast(msg); }); }
  function cltSave(f) {
    var isNew = K.view === 'new', id = isNew ? val(f, 'id').toUpperCase() : K.id, terms = parseInt(val(f, 'payment_terms_days'), 10);
    var row = { name: val(f, 'name'), legal_name: val(f, 'legal_name') || null, client_type: val(f, 'client_type'), tax_id: val(f, 'tax_id') || null, billing_address: val(f, 'billing_address') || null,
      city: val(f, 'city') || null, plant_id: val(f, 'plant_id') || null, contact_name: val(f, 'contact_name') || null, contact_phone: val(f, 'contact_phone') || null,
      contact_email: val(f, 'contact_email').toLowerCase() || null, payment_terms_days: isNaN(terms) ? 30 : terms, status: val(f, 'status'), notes: val(f, 'notes') || null };
    if (isNew && !/^CL-\d{2,4}$/.test(id)) { K.err = T(L('Kode klien harus seperti CL-01.', 'The client code must look like CL-01.')); return cltPaint(); }
    if (isNew && K.rows.some(function (x) { return x.id === id; })) { K.err = T(L('Kode klien ini sudah dipakai.', 'This client code is already used.')); return cltPaint(); }
    if (!row.name) { K.err = T(L('Nama klien wajib diisi.', 'Client name is required.')); return cltPaint(); }
    if (row.contact_email && !emailOk(row.contact_email)) { K.err = T(ERR.email); return cltPaint(); }
    if (row.payment_terms_days < 0 || row.payment_terms_days > 180) { K.err = T(L('Jatuh tempo antara 0 dan 180 hari.', 'Payment terms must be 0 to 180 days.')); return cltPaint(); }
    busy(true);
    (isNew ? sb.from('clients').insert(Object.assign({ id: id }, row)) : sb.from('clients').update(row).eq('id', id)).then(function (r) {
      busy(false);
      if (r.error) { K.err = T(errMsg(null, r.error.message)); return cltPaint(); }
      CL.log(isNew ? 'MD.CLIENT_CREATED' : 'MD.CLIENT_UPDATED', id, { name: row.name, status: row.status });
      cltReload('open', id, isNew ? L('Klien ditambahkan. Sekarang tambahkan propertinya.', 'Client added. Now add its properties.') : L('Klien disimpan.', 'Client saved.'));
    }, function () { busy(false); K.err = T(ERR.network); cltPaint(); });
  }
  function propSave(f) {
    var isNew = K.view === 'pnew', cid = K.id, id = isNew ? val(f, 'id').toUpperCase() : K.pid;
    var row = { name: val(f, 'name'), property_type: val(f, 'property_type'), address: val(f, 'address') || null, city: val(f, 'city') || null, plant_id: val(f, 'plant_id') || null,
      contact_name: val(f, 'contact_name') || null, contact_phone: val(f, 'contact_phone') || null, pickup_schedule: val(f, 'pickup_schedule') || null, delivery_schedule: val(f, 'delivery_schedule') || null, instructions: val(f, 'instructions') || null };
    if (isNew && !/^PR-[A-Z0-9-]{2,12}$/.test(id)) { K.err = T(L('Kode properti harus seperti PR-01A.', 'The property code must look like PR-01A.')); return cltPaint(); }
    if (isNew && K.props.some(function (x) { return x.id === id; })) { K.err = T(L('Kode properti ini sudah dipakai.', 'This property code is already used.')); return cltPaint(); }
    if (!row.name) { K.err = T(L('Nama properti wajib diisi.', 'Property name is required.')); return cltPaint(); }
    if (!row.plant_id) { K.err = T(ERR.plant); return cltPaint(); }
    busy(true);
    (isNew ? sb.from('properties').insert(Object.assign({ id: id, client_id: cid, status: 'active' }, row)) : sb.from('properties').update(row).eq('id', id)).then(function (r) {
      busy(false);
      if (r.error) { K.err = T(errMsg(null, r.error.message)); return cltPaint(); }
      CL.log(isNew ? 'MD.PROPERTY_CREATED' : 'MD.PROPERTY_UPDATED', id, { client: cid, name: row.name });
      cltReload('open', cid, isNew ? L('Properti ditambahkan.', 'Property added.') : L('Properti disimpan.', 'Property saved.'));
    }, function () { busy(false); K.err = T(ERR.network); cltPaint(); });
  }
  function propActive(id, on) {
    sb.from('properties').update({ status: on ? 'active' : 'inactive' }).eq('id', id).then(function (r) {
      if (r.error) { K.err = T(errMsg(null, r.error.message)); return cltPaint(); }
      CL.log(on ? 'MD.PROPERTY_ON' : 'MD.PROPERTY_OFF', id, {});
      cltReload('open', K.id, on ? L('Properti diaktifkan.', 'Property activated.') : L('Properti dinonaktifkan. Data lamanya tetap tersimpan.', 'Property deactivated. Its records are kept.'));
    }, function () { K.err = T(ERR.network); cltPaint(); });
  }
  V['MD-CLT-001'] = {
    render: function () { return '<div id="clt-root" class="acc"></div>'; },
    after: function () { cltPaint(); if (!K.rows) loadClients().then(cltPaint); }
  };
  document.addEventListener('click', function (e) {
    var el = e.target.closest('#clt-root [data-k], #clt-root [data-x]'); if (!el) return;
    var k = el.getAttribute('data-k'), id = el.getAttribute('data-id');
    if (k === 'new') cltGo('new');
    else if (k === 'edit') cltGo('edit', id);
    else if (k === 'open') cltGo('open', id);
    else if (k === 'back') cltGo('list');
    else if (k === 'pnew') cltGo('pnew', K.id);
    else if (k === 'rates') cltGo('rates', K.id);
    else if (k === 'pedit') cltGo('pedit', K.id, id);
    else if (k === 'poff') propActive(id, false);
    else if (k === 'pon') propActive(id, true);
    else if (el.getAttribute('data-x') === 'reload') { K.rows = null; R.cid = null; cltPaint(); loadClients().then(cltPaint); }
  });

  /* =====================================================================
     MD-SVC-001 Master Data · Layanan & Harga (sys.master)
     List price per unit. A client's contract price lives in client_rates and
     is set from the client page (Harga Kontrak).
     ===================================================================== */
  var UNITS = [['kg', L('per kg', 'per kg')], ['pcs', L('per potong', 'per piece')], ['set', L('per set', 'per set')], ['m2', L('per m²', 'per m²')]];
  var S = { view: 'list', id: null, rows: null, err: null, loadErr: false };
  function rp(n) { return 'Rp ' + Number(n || 0).toLocaleString('id-ID'); }
  function unitName(u) { var x = UNITS.filter(function (y) { return y[0] === u; })[0]; return x ? x[1] : L(u, u); }
  function loadSvc() {
    S.loadErr = false;
    return sb.from('services').select('id,name,description,unit,base_price,sla_hours,active').order('id').then(function (r) { if (r.error) throw r.error; S.rows = r.data || []; }).catch(function () { S.loadErr = true; });
  }
  function svcList() {
    var list = S.rows.map(function (v) {
      return '<article class="acc-r"><div class="acc-h"><span class="av">' + ic('washer') + '</span><div class="acc-n"><b>' + esc(v.name) + '</b><small>' + esc(v.id) + (v.sla_hours ? ' · ' + t(L('selesai ' + v.sla_hours + ' jam', 'done in ' + v.sla_hours + ' h')) : '') + '</small></div>' +
        (v.active ? A.chip('ok', L('Aktif', 'Active'), 'checkc') : A.chip('mute', L('Nonaktif', 'Inactive'), 'ban')) + '</div>' +
        '<div class="acc-m"><span>' + ic('tag') + '<b>' + rp(v.base_price) + '</b>&nbsp;' + t(unitName(v.unit)) + '</span>' + (v.description ? '<span>' + ic('file') + esc(v.description) + '</span>' : '') + '</div>' +
        '<div class="acc-a">' + b('ghost', L('Ubah', 'Edit'), 'edit', 'data-s="edit" data-id="' + esc(v.id) + '"') +
          (v.active ? b('ghost', L('Nonaktifkan', 'Deactivate'), 'ban', 'data-s="off" data-id="' + esc(v.id) + '"') : b('ghost', L('Aktifkan', 'Activate'), 'check', 'data-s="on" data-id="' + esc(v.id) + '"')) + '</div></article>';
    }).join('');
    return A.pageHead(null, t(L('Daftar layanan dan harga standar. Harga kontrak tiap klien diatur di halaman klien.', 'Services and their list price. Each client\'s contract price is set on the client page.')),
        b('primary', L('Tambah Layanan', 'Add Service'), 'plus', 'data-s="new"')) + errBox(S) +
      (list ? '<div class="acc-list">' + list + '</div>' : A.empty(L('Belum ada layanan. Tekan Tambah Layanan.', 'No services yet. Press Add Service.')));
  }
  function svcForm(v) {
    var isNew = !v; v = v || { id: nextCode(S.rows, /^SV-(\d+)$/, function (n) { return 'SV-' + String(n).padStart(3, '0'); }), unit: 'kg', sla_hours: 24 };
    return A.pageHead(isNew ? L('Tambah Layanan', 'Add Service') : L('Ubah Layanan', 'Edit Service'), t(L('Harga di sini adalah harga standar, bukan harga kontrak klien.', 'This is the list price, not a client\'s contract price.'))) + errBox(S) +
      '<form class="ds acc-f" id="svc-f" novalidate>' +
        '<div class="acc-2">' + field(L('Kode layanan', 'Service code'), '<div class="ds-control"><input name="id" type="text" value="' + esc(v.id) + '"' + (isNew ? '' : ' readonly') + '></div>') +
          field(L('Satuan', 'Unit'), select('unit', UNITS, v.unit)) + '</div>' +
        field(L('Nama layanan', 'Service name'), input('name', 'text', v.name, L('cth. Cuci Reguler', 'e.g. Regular Wash'))) +
        '<div class="acc-2">' + field(L('Harga standar (Rp per satuan)', 'List price (Rp per unit)'), input('base_price', 'number', v.base_price == null ? '' : String(v.base_price), '7500')) +
          field(L('Selesai dalam (jam)', 'Done within (hours)'), input('sla_hours', 'number', v.sla_hours == null ? '' : String(v.sla_hours), '24')) + '</div>' +
        field(L('Keterangan', 'Description'), area('description', v.description, L('cth. Cuci, kering, lipat standar.', 'e.g. Standard wash, dry, fold.'))) +
        '<div class="row2">' + b('ghost', L('Batal', 'Cancel'), 'arrowl', 'data-s="back"') + '<button type="submit" class="btn btn-primary" id="acc-go">' + ic('check') + '<span>' + t(L('Simpan', 'Save')) + '</span></button></div>' +
      '</form>';
  }
  function svcPaint() {
    var root = document.getElementById('svc-root'); if (!root) return;
    if (S.loadErr) { root.innerHTML = loadErr(); return; }
    if (!S.rows) { root.innerHTML = skel(); return; }
    var v = S.id && S.rows.filter(function (x) { return x.id === S.id; })[0];
    root.innerHTML = S.view === 'new' ? svcForm(null) : S.view === 'edit' && v ? svcForm(v) : svcList();
    DS.lang(root);
    var f = root.querySelector('#svc-f'); if (f) f.addEventListener('submit', function (ev) { ev.preventDefault(); svcSave(f); });
  }
  function svcGo(view, id) { S.view = view; S.id = id || null; S.err = null; svcPaint(); window.scrollTo(0, 0); }
  function svcDone(msg) { loadSvc().then(function () { svcGo('list'); A.toast(msg); }); }
  function svcSave(f) {
    var isNew = S.view === 'new', id = isNew ? val(f, 'id').toUpperCase() : S.id, price = parseInt(val(f, 'base_price'), 10), sla = parseInt(val(f, 'sla_hours'), 10);
    var row = { name: val(f, 'name'), unit: val(f, 'unit'), base_price: price, sla_hours: isNaN(sla) ? null : sla, description: val(f, 'description') || null };
    if (isNew && !/^SV-\d{3,4}$/.test(id)) { S.err = T(L('Kode layanan harus seperti SV-001.', 'The service code must look like SV-001.')); return svcPaint(); }
    if (isNew && S.rows.some(function (x) { return x.id === id; })) { S.err = T(L('Kode layanan ini sudah dipakai.', 'This service code is already used.')); return svcPaint(); }
    if (!row.name) { S.err = T(L('Nama layanan wajib diisi.', 'Service name is required.')); return svcPaint(); }
    if (isNaN(price) || price < 0) { S.err = T(L('Isi harga standar (angka, Rp).', 'Enter the list price (a number, Rp).')); return svcPaint(); }
    if (row.sla_hours != null && (row.sla_hours < 1 || row.sla_hours > 720)) { S.err = T(L('Waktu selesai antara 1 dan 720 jam.', 'Completion time must be 1 to 720 hours.')); return svcPaint(); }
    busy(true);
    (isNew ? sb.from('services').insert(Object.assign({ id: id, active: true }, row)) : sb.from('services').update(row).eq('id', id)).then(function (r) {
      busy(false);
      if (r.error) { S.err = T(errMsg(null, r.error.message)); return svcPaint(); }
      CL.log(isNew ? 'MD.SERVICE_CREATED' : 'MD.SERVICE_UPDATED', id, { price: price, unit: row.unit });
      svcDone(isNew ? L('Layanan ditambahkan.', 'Service added.') : L('Layanan disimpan.', 'Service saved.'));
    }, function () { busy(false); S.err = T(ERR.network); svcPaint(); });
  }
  function svcActive(id, on) {
    sb.from('services').update({ active: on }).eq('id', id).then(function (r) {
      if (r.error) { S.err = T(errMsg(null, r.error.message)); return svcPaint(); }
      CL.log(on ? 'MD.SERVICE_ON' : 'MD.SERVICE_OFF', id, {});
      svcDone(on ? L('Layanan diaktifkan.', 'Service activated.') : L('Layanan dinonaktifkan.', 'Service deactivated.'));
    }, function () { S.err = T(ERR.network); svcPaint(); });
  }
  V['MD-SVC-001'] = {
    render: function () { return '<div id="svc-root" class="acc"></div>'; },
    after: function () { svcPaint(); if (!S.rows) loadSvc().then(svcPaint); }
  };
  document.addEventListener('click', function (e) {
    var el = e.target.closest('#svc-root [data-s], #svc-root [data-x]'); if (!el) return;
    var k = el.getAttribute('data-s'), id = el.getAttribute('data-id');
    if (k === 'new') svcGo('new'); else if (k === 'edit') svcGo('edit', id); else if (k === 'back') svcGo('list');
    else if (k === 'off') svcActive(id, false); else if (k === 'on') svcActive(id, true);
    else if (el.getAttribute('data-x') === 'reload') { S.rows = null; svcPaint(); loadSvc().then(svcPaint); }
  });

  /* ---------- Harga Kontrak on the client page (client_rates) ---------- */
  var R = { cid: null, rows: null, svcs: null };
  function loadRates(cid) {
    R.cid = cid; R.rows = null;
    return Promise.all([sb.from('services').select('id,name,unit,base_price,active').order('id'), sb.from('client_rates').select('service_id,price,active').eq('client_id', cid)]).then(function (r) {
      if (r[0].error || r[1].error) throw (r[0].error || r[1].error);
      R.svcs = r[0].data || []; R.rows = r[1].data || [];
    }).catch(function () { R.rows = []; R.svcs = []; R.err = true; });
  }
  function rateOf(sid) { return (R.rows || []).filter(function (x) { return x.service_id === sid && x.active; })[0]; }
  function ratesCard(c) {
    if (R.cid !== c.id || !R.rows) return '<div class="acc-r">' + skel() + '</div>';
    var used = R.svcs.filter(function (v) { return rateOf(v.id); });
    var rows = used.map(function (v) { var r = rateOf(v.id), d = v.base_price ? Math.round((r.price - v.base_price) / v.base_price * 100) : 0;
      return '<tr><td><b>' + esc(v.name) + '</b><small>' + esc(v.id) + '</small></td><td class="num">' + rp(v.base_price) + '</td><td class="num"><b>' + rp(r.price) + '</b>' + (d ? ' <small>(' + (d > 0 ? '+' : '') + d + '%)</small>' : '') + '</td><td>' + t(unitName(v.unit)) + '</td></tr>'; }).join('');
    return '<div class="acc-r"><div class="acc-h"><div class="acc-n"><b>' + t(L('Harga kontrak', 'Contract prices')) + '</b><small>' + t(L('Harga yang dipakai saat menagih klien ini. Layanan tanpa harga kontrak belum bisa ditagih.', 'Prices used when billing this client. Services without a contract price cannot be billed yet.')) + '</small></div>' + b('ghost', L('Atur Harga', 'Set Prices'), 'tag', 'data-k="rates"') + '</div>' +
      (rows ? '<div class="acc-mx"><table class="acc-t md-t"><thead><tr><th>' + t(L('Layanan', 'Service')) + '</th><th>' + t(L('Harga standar', 'List price')) + '</th><th>' + t(L('Harga kontrak', 'Contract price')) + '</th><th>' + t(L('Satuan', 'Unit')) + '</th></tr></thead><tbody>' + rows + '</tbody></table></div>'
        : A.empty(L('Belum ada harga kontrak. Tekan Atur Harga.', 'No contract prices yet. Press Set Prices.'))) + '</div>';
  }
  function ratesForm(c) {
    var svcs = R.svcs.filter(function (v) { return v.active || rateOf(v.id); });
    return A.pageHead(L('Harga Kontrak', 'Contract Prices'), t(c.name + ' · ' + T(L('kosongkan untuk layanan yang tidak dipakai klien ini.', 'leave empty for services this client does not use.')))) + errBox(K) +
      (svcs.length ? '<form class="ds acc-f" id="rate-f" novalidate>' + svcs.map(function (v) { var r = rateOf(v.id);
        return field(L(v.name + ' · standar ' + rp(v.base_price) + ' ' + T(unitName(v.unit)), v.name + ' · list ' + rp(v.base_price) + ' ' + T(unitName(v.unit))), input('r_' + v.id, 'number', r ? String(r.price) : '', L('Harga kontrak (Rp)', 'Contract price (Rp)')));
      }).join('') +
        '<div class="row2">' + b('ghost', L('Batal', 'Cancel'), 'arrowl', 'data-k="open" data-id="' + esc(c.id) + '"') + '<button type="submit" class="btn btn-primary" id="acc-go">' + ic('check') + '<span>' + t(L('Simpan Harga', 'Save Prices')) + '</span></button></div></form>'
        : A.empty(L('Belum ada layanan aktif. Tambahkan dulu di Master Data · Layanan & Harga.', 'No active services yet. Add them first in Master Data · Services & Prices.')));
  }
  function ratesSave(f) {
    var cid = K.id, up = [], off = [], bad = false;
    R.svcs.forEach(function (v) {
      var el = f.querySelector('[name="r_' + v.id + '"]'); if (!el) return;
      var raw = String(el.value || '').trim(), cur = rateOf(v.id);
      if (raw === '') { if (cur) off.push(v.id); return; }
      var n = parseInt(raw, 10); if (isNaN(n) || n < 0) { bad = true; return; }
      if (!cur || cur.price !== n) up.push({ client_id: cid, service_id: v.id, price: n, active: true });
    });
    if (bad) { K.err = T(L('Harga harus angka 0 atau lebih.', 'Prices must be numbers, 0 or more.')); return cltPaint(); }
    if (!up.length && !off.length) return cltGo('open', cid);
    busy(true);
    Promise.all([up.length ? sb.from('client_rates').upsert(up, { onConflict: 'client_id,service_id' }) : Promise.resolve({}),
      off.length ? sb.from('client_rates').update({ active: false }).eq('client_id', cid).in('service_id', off) : Promise.resolve({})]).then(function (r) {
      busy(false);
      var er = r[0].error || r[1].error; if (er) { K.err = T(errMsg(null, er.message)); return cltPaint(); }
      CL.log('MD.RATES_UPDATED', cid, { set: up.map(function (x) { return x.service_id + '=' + x.price; }), removed: off });
      loadRates(cid).then(function () { cltGo('open', cid); A.toast(L('Harga kontrak disimpan.', 'Contract prices saved.')); });
    }, function () { busy(false); K.err = T(ERR.network); cltPaint(); });
  }

  /* =====================================================================
     MD-VEH-001 Master Data · Kendaraan (sys.master)
     ===================================================================== */
  var VT = [['van', L('Mobil van', 'Van')], ['pickup', L('Mobil pickup', 'Pickup truck')], ['motor', L('Motor', 'Motorbike')], ['truck', L('Truk', 'Truck')], ['other', L('Lainnya', 'Other')]];
  var VST = { active: ['ok', L('Siap jalan', 'In service'), 'checkc'], repair: ['warn', L('Di bengkel', 'In repair'), 'wrench'], inactive: ['mute', L('Nonaktif', 'Inactive'), 'ban'] };
  var Q = { view: 'list', id: null, rows: null, emps: null, err: null, loadErr: false };
  function loadVeh() {
    Q.loadErr = false;
    return Promise.all([loadRef(), sb.from('vehicles').select('id,plate,vehicle_type,capacity_kg,plant_id,driver_employee_id,status,notes').order('id'),
      sb.from('employees').select('id,full_name,status').order('full_name')]).then(function (r) {
      if (r[1].error) throw r[1].error;
      Q.rows = r[1].data || []; Q.emps = (r[2] && r[2].data) || [];
    }).catch(function () { Q.loadErr = true; });
  }
  function empName(id) { var e = (Q.emps || []).filter(function (x) { return x.id === id; })[0]; return e ? e.full_name : (id || ''); }
  function vehList() {
    var list = Q.rows.map(function (v) { var st = VST[v.status] || VST.active, vt = VT.filter(function (x) { return x[0] === v.vehicle_type; })[0];
      return '<article class="acc-r"><div class="acc-h"><span class="av">' + ic('truck') + '</span><div class="acc-n"><b>' + esc(v.plate) + '</b><small>' + esc(v.id) + ' · ' + t(vt ? vt[1] : L(v.vehicle_type, v.vehicle_type)) + (v.capacity_kg ? ' · ' + v.capacity_kg + ' kg' : '') + '</small></div>' + A.chip(st[0], st[1], st[2]) + '</div>' +
        '<div class="acc-m"><span>' + ic('building') + esc(plantName(v.plant_id)) + '</span><span>' + ic('user') + (v.driver_employee_id ? esc(empName(v.driver_employee_id)) : t(L('Belum ada driver tetap', 'No regular driver'))) + '</span>' + (v.notes ? '<span>' + ic('file') + esc(v.notes) + '</span>' : '') + '</div>' +
        '<div class="acc-a">' + b('ghost', L('Ubah', 'Edit'), 'edit', 'data-v="edit" data-id="' + esc(v.id) + '"') + '</div></article>';
    }).join('');
    return A.pageHead(null, t(L('Kendaraan pickup dan pengiriman, plant asalnya, dan driver tetapnya.', 'Pickup and delivery vehicles, their plant and regular driver.')),
        b('primary', L('Tambah Kendaraan', 'Add Vehicle'), 'plus', 'data-v="new"')) + errBox(Q) +
      (list ? '<div class="acc-list">' + list + '</div>' : A.empty(L('Belum ada kendaraan. Tekan Tambah Kendaraan.', 'No vehicles yet. Press Add Vehicle.')));
  }
  function vehForm(v) {
    var isNew = !v; v = v || { id: nextCode(Q.rows, /^JF-(\d+)$/, function (n) { return 'JF-' + String(n).padStart(2, '0'); }), vehicle_type: 'van', status: 'active', plant_id: REF.plants.length === 1 ? REF.plants[0].id : '' };
    var emps = [['', L('— Belum ada —', '— None —')]].concat((Q.emps || []).filter(function (e) { return e.status === 'active' || e.id === v.driver_employee_id; }).map(function (e) { return [e.id, L(e.full_name, e.full_name)]; }));
    return A.pageHead(isNew ? L('Tambah Kendaraan', 'Add Vehicle') : L('Ubah Kendaraan', 'Edit Vehicle'), t(L('Driver dipilih dari Data Karyawan.', 'The driver is picked from Employees.'))) + errBox(Q) +
      '<form class="ds acc-f" id="veh-f" novalidate>' +
        '<div class="acc-2">' + field(L('Kode kendaraan', 'Vehicle code'), '<div class="ds-control"><input name="id" type="text" value="' + esc(v.id) + '"' + (isNew ? '' : ' readonly') + '></div>') +
          field(L('Nomor polisi', 'Plate number'), input('plate', 'text', v.plate, 'DK 1234 AB')) + '</div>' +
        '<div class="acc-2">' + field(L('Jenis', 'Type'), select('vehicle_type', VT, v.vehicle_type)) + field(L('Kapasitas (kg)', 'Capacity (kg)'), input('capacity_kg', 'number', v.capacity_kg ? String(v.capacity_kg) : '', '400')) + '</div>' +
        '<div class="acc-2">' + field(L('Plant', 'Plant'), select('plant_id', plantOpts(true), v.plant_id)) + field(L('Driver tetap', 'Regular driver'), select('driver_employee_id', emps, v.driver_employee_id || '')) + '</div>' +
        field(L('Status', 'Status'), select('status', Object.keys(VST).map(function (k) { return [k, VST[k][1]]; }), v.status)) +
        field(L('Catatan', 'Notes'), area('notes', v.notes, L('cth. Servis berikutnya 1 Des.', 'e.g. Next service 1 Dec.'))) +
        '<div class="row2">' + b('ghost', L('Batal', 'Cancel'), 'arrowl', 'data-v="back"') + '<button type="submit" class="btn btn-primary" id="acc-go">' + ic('check') + '<span>' + t(L('Simpan', 'Save')) + '</span></button></div>' +
      '</form>';
  }
  function vehPaint() {
    var root = document.getElementById('veh-root'); if (!root) return;
    if (Q.loadErr) { root.innerHTML = loadErr(); return; }
    if (!Q.rows) { root.innerHTML = skel(); return; }
    var v = Q.id && Q.rows.filter(function (x) { return x.id === Q.id; })[0];
    root.innerHTML = Q.view === 'new' ? vehForm(null) : Q.view === 'edit' && v ? vehForm(v) : vehList();
    DS.lang(root);
    var f = root.querySelector('#veh-f'); if (f) f.addEventListener('submit', function (ev) { ev.preventDefault(); vehSave(f); });
  }
  function vehGo(view, id) { Q.view = view; Q.id = id || null; Q.err = null; vehPaint(); window.scrollTo(0, 0); }
  function vehSave(f) {
    var isNew = Q.view === 'new', id = isNew ? val(f, 'id').toUpperCase() : Q.id, cap = parseInt(val(f, 'capacity_kg'), 10);
    var row = { plate: val(f, 'plate').toUpperCase().replace(/\s+/g, ' '), vehicle_type: val(f, 'vehicle_type'), capacity_kg: isNaN(cap) ? null : cap, plant_id: val(f, 'plant_id') || null, driver_employee_id: val(f, 'driver_employee_id') || null, status: val(f, 'status'), notes: val(f, 'notes') || null };
    if (isNew && !/^JF-\d{2,3}$/.test(id)) { Q.err = T(L('Kode kendaraan harus seperti JF-01.', 'The vehicle code must look like JF-01.')); return vehPaint(); }
    if (isNew && Q.rows.some(function (x) { return x.id === id; })) { Q.err = T(L('Kode kendaraan ini sudah dipakai.', 'This vehicle code is already used.')); return vehPaint(); }
    if (!row.plate) { Q.err = T(L('Nomor polisi wajib diisi.', 'Plate number is required.')); return vehPaint(); }
    if (Q.rows.some(function (x) { return x.plate === row.plate && x.id !== id; })) { Q.err = T(L('Nomor polisi ini sudah terdaftar.', 'This plate is already registered.')); return vehPaint(); }
    if (!row.plant_id) { Q.err = T(ERR.plant); return vehPaint(); }
    busy(true);
    (isNew ? sb.from('vehicles').insert(Object.assign({ id: id }, row)) : sb.from('vehicles').update(row).eq('id', id)).then(function (r) {
      busy(false);
      if (r.error) { Q.err = T(errMsg(null, r.error.message)); return vehPaint(); }
      CL.log(isNew ? 'MD.VEHICLE_CREATED' : 'MD.VEHICLE_UPDATED', id, { plate: row.plate, status: row.status });
      loadVeh().then(function () { vehGo('list'); A.toast(isNew ? L('Kendaraan ditambahkan.', 'Vehicle added.') : L('Kendaraan disimpan.', 'Vehicle saved.')); });
    }, function () { busy(false); Q.err = T(ERR.network); vehPaint(); });
  }
  V['MD-VEH-001'] = {
    render: function () { return '<div id="veh-root" class="acc"></div>'; },
    after: function () { vehPaint(); if (!Q.rows) loadVeh().then(vehPaint); }
  };
  document.addEventListener('click', function (e) {
    var el = e.target.closest('#veh-root [data-v], #veh-root [data-x]'); if (!el) return;
    var k = el.getAttribute('data-v'), id = el.getAttribute('data-id');
    if (k === 'new') vehGo('new'); else if (k === 'edit') vehGo('edit', id); else if (k === 'back') vehGo('list');
    else if (el.getAttribute('data-x') === 'reload') { Q.rows = null; vehPaint(); loadVeh().then(vehPaint); }
  });

  document.addEventListener('click', function (e) {
    var el = e.target.closest('#acc-root [data-x], #emp-root [data-x], #emp-root [data-e]'); if (!el) return;
    var x = el.getAttribute('data-x'), ex = el.getAttribute('data-e'), id = el.getAttribute('data-id');
    if (ex === 'new') empGo('new');
    else if (ex === 'edit') empGo('edit', id);
    else if (ex === 'back') empGo('list');
    else if (ex === 'account') { M.view = 'new'; M.emp = id; M.id = null; M.err = null; location.hash = A.href('USER-010'); }
    else if (x === 'reload') { if (document.getElementById('emp-root')) { E.rows = null; empPaint(); loadEmp().then(empPaint); } else { M.users = null; accPaint(); loadAcc().then(accPaint); } }
    else if (x === 'emps') location.hash = A.href('USER-011');
    else if (x === 'new') accGo('new');
    else if (x === 'fromemp') accGo('new', null, id);
    else if (x === 'menu') accGo('menu', id);
    else if (x === 'back') accGo('list');
    else if (x === 'discard') { M.edits = {}; accPaint(); }
    else if (x === 'saveroles') saveRoles();
    else if (x === 'off') setStatus(id, 'inactive');
    else if (x === 'on') setStatus(id, 'active');
  });
  window.addEventListener('hashchange', function () {
    if (location.hash.indexOf('/USER-010') < 0) { M.view = 'list'; M.id = null; M.emp = null; M.users = null; M.err = null; M.edits = {}; }
    if (location.hash.indexOf('/USER-011') < 0) { E.view = 'list'; E.id = null; E.rows = null; E.err = null; }
  });

  V['USER-010'] = {
    render: function () { return '<div id="acc-root" class="acc"></div>'; },
    after: function () { accPaint(); if (!M.users) loadAcc().then(accPaint); }
  };
})();
