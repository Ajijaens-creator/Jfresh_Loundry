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
  A.addParents({ 'USER-010': [], 'USER-011': [] });
  if (!CL || !CL.on) {
    ['USER-010', 'USER-011'].forEach(function (k) { V[k] = { render: function () { return A.pageHead() + A.stateCard('empty', L('Halaman ini hanya tersedia di mode asli.', 'This page is only available in real mode.'), A.backBtn()); } }; });
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
