/* ==========================================================================
   JFRESH OS — Phase 4 documentation data (Access & App Shell NP 1.0)
   NP-01 … NP-07 summaries, screen specifications (§72 inventory with the §73
   fields), responsive test checklist (§77) and the Definition of Done (§78).
   Read by phase4/index.html, phase4/screens.html and phase4/tests.html.
   ========================================================================== */
(function (root) {
  function L(a, b) { return [a, b === undefined ? a : b]; }
  var D = {};
  var APP = '../app/login.html';

  /* ---------- Phase 4 reference visuals ---------- */
  D.VISUALS = [
    { k: 'V4-01', f: '01-login-authentication.jpg', t: L('Login & Autentikasi', 'Login & Authentication') },
    { k: 'V4-02', f: '02-user-access-role-resolution.jpg', t: L('Akses User & Resolusi Peran', 'User Access & Role Resolution') },
    { k: 'V4-03', f: '03-role-based-landing.jpg', t: L('Landing Berdasarkan Peran', 'Role-Based Landing') },
    { k: 'V4-04', f: '04-app-shell-structure.jpg', t: L('Struktur App Shell', 'App Shell Structure') },
    { k: 'V4-05', f: '05-new-request.jpg', t: L('Request Baru', 'New Request') },
    { k: 'V4-05b', f: '05b-laundry-operations.jpg', t: L('Operasional Laundry', 'Laundry Operations') },
    { k: 'V4-06', f: '06-item-picker.jpg', t: L('Pemilih Item', 'Item Picker') },
    { k: 'V4-07', f: '07-notification-center.jpg', t: L('Pusat Notifikasi', 'Notification Center') },
    { k: 'V4-07b', f: '07b-history-tracking.jpg', t: L('Riwayat & Tracking', 'History & Tracking') }
  ];

  /* ---------- NP-01 … NP-07 ---------- */
  D.NP = [
    { k: 'NP-01', id: 'np01', ic: 'lock', v: 'V4-01', t: L('Login & Autentikasi', 'Login & Authentication'),
      d: L('Masuk dengan username atau email dan password. Tanpa OTP. Pesan error umum yang tidak membocorkan status akun.', 'Sign in with username or email and password. No OTP. Generic errors that never reveal account status.'),
      built: [L('Username/Email, Password dengan tombol tampil/sembunyi, Ingat Saya, Masuk, Lupa Password?', 'Username/Email, Password with show/hide, Remember me, Sign In, Forgot Password?'),
        L('Validasi: "Username atau email wajib diisi.", "Password wajib diisi.", "Username atau password belum benar."', 'Validation: "Username or email is required.", "Password is required.", "Username or password is not correct."'),
        L('Loading "Memproses...", tombol terkunci, tidak bisa kirim dua kali', 'Loading "Processing...", button locked, no double submit'),
        L('5x salah → akun dikunci 15 menit; percobaan beruntun dari perangkat yang sama diperlambat', '5 wrong attempts → 15-minute lock; rapid attempts from one device are throttled'),
        L('State: tidak aktif, ditangguhkan, terkunci, terlalu banyak percobaan, koneksi, sistem. Tanpa kode HTTP/API.', 'States: inactive, suspended, locked, too many attempts, connection, system. No HTTP/API codes.')],
      links: [[L('Buka login', 'Open login'), APP], [L('Akun terkunci', 'Locked account'), APP + '#/terkunci'], [L('Koneksi gagal', 'Connection error'), APP + '#/koneksi']] },
    { k: 'NP-02', id: 'np02', ic: 'usercheck', v: 'V4-02', t: L('Akses User & Resolusi Peran', 'User Access & Role Resolution'),
      d: L('Setelah login sistem menentukan sendiri: status akun → karyawan → peran → plant → hak akses → menu → halaman awal. User tidak memilih peran bebas.', 'After sign-in the system decides on its own: account status → employee → role → plant → permissions → menu → landing page. Users never pick a role freely.'),
      built: [L('Karyawan dan akun user adalah data terpisah; karyawan resign tetap tersimpan, akunnya dinonaktifkan', 'Employee and user account are separate records; a resigned employee stays on record, the account is deactivated'),
        L('Peran = pengalaman (menu, beranda). Hak akses = tindakan. Contoh: QC Inspector memakai shell operator dengan hak akses QC saja.', 'Role = experience (menu, home). Permission = actions. Example: QC Inspector uses the operator shell with QC permissions only.'),
        L('Multi-peran: peran default, ganti hanya di antara peran yang diberikan, tercatat di audit', 'Multiple roles: a default role, switching only among assigned roles, recorded in the audit'),
        L('Plant scope: data order dan masalah difilter per plant; user multi-plant memakai pemilih plant', 'Plant scope: orders and issues filtered by plant; multi-plant users get a plant selector'),
        L('Klien hanya melihat data kliennya sendiri, termasuk lewat link langsung', 'Clients see only their own data, including through direct links')],
      links: [[L('Masuk sebagai saras (2 peran, 2 plant)', 'Sign in as saras (2 roles, 2 plants)'), APP + '#/?u=saras'], [L('Akun tanpa peran', 'Account without a role'), APP + '#/tanpa-peran?c=no_role']] },
    { k: 'NP-03', id: 'np03', ic: 'home', v: 'V4-03', t: L('Landing Berdasarkan Peran', 'Role-Based Landing Pages'),
      d: L('Tidak ada satu beranda untuk semua. Setiap peran membuka halaman yang menjawab pertanyaan utamanya.', 'There is no single home for everyone. Each role opens on the page that answers its main question.'),
      built: [L('Operator: "Apa yang harus saya kerjakan sekarang?" · Menunggu / Diproses / Ada Masalah / Siap Dikirim · Terima Cucian', 'Operator: "What should I do now?" · Waiting / In Process / Issues / Ready to Ship · Receive Laundry'),
        L('Driver: Rute Hari Ini · Mulai Rute', 'Driver: Today\'s Route · Start Route'),
        L('Supervisor: Operasional Hari Ini · Perlu Perhatian', 'Supervisor: Operations Today · Needs Attention'),
        L('Finance: Finance Hari Ini · Sales: Klien & Kontrak · Owner: Executive Overview + Alert Penting', 'Finance: Finance Today · Sales: Clients & Contracts · Owner: Executive Overview + Important Alerts'),
        L('Klien: Layanan Saya, terisolasi per klien', 'Client: My Service, isolated per client')],
      links: [[L('Masuk sebagai made (operator)', 'Sign in as made (operator)'), APP + '#/?u=made'], [L('Masuk sebagai ketut (driver)', 'Sign in as ketut (driver)'), APP + '#/?u=ketut'], [L('Masuk sebagai aji (owner)', 'Sign in as aji (owner)'), APP + '#/?u=aji']] },
    { k: 'NP-04', id: 'np04', ic: 'sidebar', v: 'V4-04', t: L('Struktur App Shell', 'App Shell Structure'),
      d: L('Desktop: sidebar + topbar. iPad: rail / drawer. Mobile: header ringkas + bottom nav maksimal 5 item dengan "Lainnya".', 'Desktop: sidebar + top bar. iPad: rail / drawer. Mobile: compact header + bottom nav with at most 5 items including "More".'),
      built: [L('Sidebar per peran (bisa diciutkan), bawah: Bantuan / Profil / Keluar', 'Role-based sidebar (collapsible), bottom: Help / Profile / Sign Out'),
        L('Topbar: pencarian (manajemen), plant, ID|EN, notifikasi dengan jumlah belum dibaca, menu profil', 'Top bar: search (management), plant, ID|EN, notifications with unread count, profile menu'),
        L('Breadcrumb hanya di desktop/iPad, kedalaman 2–3 level', 'Breadcrumb on desktop/iPad only, 2–3 levels deep'),
        L('Mobile bukan desktop yang dikecilkan: kartu, tombol besar, bottom nav', 'Mobile is not a shrunken desktop: cards, large buttons, bottom nav')],
      links: [[L('Buka aplikasi', 'Open the app'), APP]] },
    { k: 'NP-05', id: 'np05', ic: 'route', v: 'V4-04', t: L('Perilaku Navigasi', 'Navigation Behaviour'),
      d: L('Menu hanya menampilkan modul yang diizinkan. Link langsung ke halaman terlarang ditolak dengan pesan ramah.', 'Menus show only permitted modules. Direct links to forbidden pages are refused with a friendly message.'),
      built: [L('Menu disusun dari peran × hak akses × perangkat; item tanpa izin tidak tampil', 'Menus built from role × permission × device; items without permission are not shown'),
        L('Satu gerbang authorize() sebelum layar dirender: izin, lalu scope plant/klien', 'One authorize() gate before a screen renders: permission, then plant/client scope'),
        L('"Anda tidak memiliki akses." dengan tombol Kembali; tercatat sebagai AUTH.ACCESS_DENIED', '"You do not have access." with a Back button; recorded as AUTH.ACCESS_DENIED'),
        L('Segmen peran di URL tidak memberi akses; sistem menggantinya dengan peran sesi', 'The role segment in the URL grants nothing; the session role replaces it'),
        L('Tanpa sesi → halaman login, lalu kembali ke halaman yang diminta', 'No session → sign-in page, then back to the requested page')],
      links: [[L('Coba link terlarang (masuk sebagai made)', 'Try a forbidden link (sign in as made)'), APP + '?next=' + encodeURIComponent('#/operator/FIN-INV-001') + '#/?u=made']] },
    { k: 'NP-06', id: 'np06', ic: 'bell', v: 'V4-07', t: L('Profil, Bahasa & Notifikasi', 'Profile, Language & Notifications'),
      d: L('Profil hanya-baca untuk data yang diatur admin. Bahasa Indonesia default. Notifikasi difilter per peran, plant dan klien.', 'Profile is read-only for admin-managed data. Indonesian by default. Notifications filtered by role, plant and client.'),
      built: [L('Profil: nama, Employee ID, peran, plant, bahasa, ganti password, keluar. Peran, hak akses dan Employee ID tidak bisa diubah user.', 'Profile: name, Employee ID, role, plant, language, change password, sign out. Role, permissions and Employee ID cannot be edited by the user.'),
        L('ID|EN hanya mengubah bahasa, tidak mengubah data, hak akses atau alur', 'ID|EN changes language only, never data, permissions or workflow'),
        L('Notifikasi: Kritis (merah), Peringatan (kuning), Operasional (biru), Informasi; ikon, judul, konteks, waktu, belum dibaca, tombol aksi', 'Notifications: Critical (red), Warning (amber), Operational (blue), Information; icon, title, context, time, unread, action button'),
        L('Preferensi In-App / Email / Push; notifikasi kritis tidak bisa dimatikan', 'Preferences In-App / Email / Push; critical notifications cannot be turned off')],
      links: [[L('Masuk sebagai budi (finance)', 'Sign in as budi (finance)'), APP + '#/?u=budi']] },
    { k: 'NP-07', id: 'np07', ic: 'shield', v: 'V4-01', t: L('Sesi, Keamanan & Pemulihan', 'Session, Security & Recovery'),
      d: L('Lupa password tanpa OTP, sesi berakhir saat tidak aktif dengan peringatan sebelumnya, perubahan akses admin langsung berlaku.', 'Password recovery without OTP, sessions end after inactivity with a warning first, admin access changes apply at once.'),
      built: [L('Lupa password: pesan sama untuk akun ada / tidak ada; link sekali pakai, berlaku 30 menit', 'Forgot password: same message whether or not the account exists; single-use link valid for 30 minutes'),
        L('Password Baru / Konfirmasi: "Password minimal 8 karakter.", "Password tidak sama.", "Password berhasil diperbarui."', 'New / Confirm password: "Password must be at least 8 characters.", "Passwords do not match.", "Password updated."'),
        L('Sesi: 30 menit tanpa aktivitas (8 jam dengan Ingat Saya), peringatan 2 menit sebelum dengan "Perpanjang Sesi"', 'Session: 30 minutes idle (8 hours with Remember me), warning 2 minutes before with "Extend Session"'),
        L('Status akun ACTIVE / INACTIVE / SUSPENDED / LOCKED; perubahan peran/hak akses/plant dibaca ulang di setiap pemeriksaan sesi', 'Account status ACTIVE / INACTIVE / SUSPENDED / LOCKED; role/permission/plant changes are re-read on every session check'),
        L('Audit: User ID, Employee ID, waktu, event, pelaku, target, lama/baru, perangkat/sesi, alasan', 'Audit: User ID, Employee ID, time, event, actor, target, old/new, device/session, reason')],
      links: [[L('Lupa password', 'Forgot password'), APP + '#/lupa'], [L('Sesi berakhir', 'Session expired'), APP + '#/sesi-berakhir?why=expired']] }
  ];

  /* ---------- Screen specifications (§72 inventory, §73 fields) ---------- */
  var ALL = L('Semua peran', 'All roles'), STAFF = L('Semua staf internal', 'All internal staff');
  var COMMON_RESP = L('Desktop: kartu tengah dengan panel brand · iPad: kartu tengah · Mobile: satu kolom, tombol penuh', 'Desktop: centred card with brand panel · iPad: centred card · Mobile: single column, full-width buttons');
  var LANG = L('Indonesia default, ID|EN; bahasa tidak mengubah data atau hak akses', 'Indonesian default, ID|EN; language never changes data or permissions');
  function S(o) { return Object.assign({ lang: LANG, nv: ['NV-03'] }, o); }
  D.SCREENS = [
    S({ id: 'AUTH-001', g: 'AUTH', n: L('Login', 'Login'), purpose: L('Masuk ke JFRESH OS dengan akun pribadi', 'Sign in to JFRESH OS with a personal account'), roles: ALL, entry: L('URL aplikasi, link langsung tanpa sesi, logout', 'App URL, direct link without a session, sign-out'),
      main: L('Logo resmi, Username/Email, Password (tampil/sembunyi), Ingat Saya, Lupa Password?, ID|EN', 'Official logo, Username/Email, Password (show/hide), Remember me, Forgot Password?, ID|EN'), primary: L('Masuk', 'Sign In'), secondary: L('Lupa Password?', 'Forgot Password?'),
      valid: L('Username/email wajib; password wajib; salah → "Username atau password belum benar." (sama untuk user tidak terdaftar)', 'Username/email required; password required; wrong → "Username or password is not correct." (same for unknown users)'), perm: L('Publik', 'Public'),
      states: L('Default, error field, error umum, loading "Memproses...", terkunci, terlalu banyak percobaan, koneksi, sistem', 'Default, field error, general error, loading "Processing...", locked, too many attempts, connection, system'), audit: 'AUTH.LOGIN_OK · AUTH.LOGIN_FAIL · ACC.LOCKED', resp: COMMON_RESP,
      nb: ['NB-17', 'NB-18'], nv: ['V4-01'], comps: 'Input.Text, Input.Password, Input.Checkbox, Button.Primary, Feedback.Inline, Nav.LangSwitch', link: APP + '#/' }),
    S({ id: 'AUTH-002', g: 'AUTH', n: L('Lupa Password', 'Forgot Password'), purpose: L('Minta link reset tanpa OTP', 'Request a reset link without OTP'), roles: ALL, entry: L('Lupa Password? di login', 'Forgot Password? on sign-in'),
      main: L('Username atau email, penjelasan singkat', 'Username or email, short explanation'), primary: L('Kirim Link Reset', 'Send Reset Link'), secondary: L('Kembali ke Login', 'Back to Login'),
      valid: L('Wajib diisi; selalu menampilkan "Jika akun terdaftar, instruksi reset password akan dikirim ke email terkait."', 'Required; always shows "If the account exists, password reset instructions will be sent to its email."'), perm: L('Publik', 'Public'),
      states: L('Default, loading, terkirim, koneksi, sistem', 'Default, loading, sent, connection, system'), audit: 'AUTH.RESET_REQ', resp: COMMON_RESP, nb: ['NB-17'], nv: ['V4-01'], comps: 'Input.Text, Button.Primary, Button.Ghost, Feedback.Inline', link: APP + '#/lupa' }),
    S({ id: 'AUTH-003', g: 'AUTH', n: L('Password Baru', 'New Password'), purpose: L('Buat password baru dari link email', 'Set a new password from the email link'), roles: ALL, entry: L('Link reset di email (sekali pakai, 30 menit)', 'Reset link in email (single use, 30 minutes)'),
      main: L('Password Baru, Konfirmasi Password, aturan minimal 8 karakter', 'New Password, Confirm Password, 8-character minimum'), primary: L('Simpan Password', 'Save Password'), secondary: L('Kembali ke Login', 'Back to Login'),
      valid: L('"Password minimal 8 karakter." · "Password tidak sama." · link kedaluwarsa/dipakai → minta link baru', '"Password must be at least 8 characters." · "Passwords do not match." · expired/used link → request a new one'), perm: L('Token reset valid', 'Valid reset token'),
      states: L('Default, error field, loading, link tidak berlaku', 'Default, field error, loading, link not valid'), audit: 'AUTH.PW_CHANGED (semua sesi akun diakhiri)', resp: COMMON_RESP, nb: ['NB-17'], nv: ['V4-01'], comps: 'Input.Password, Button.Primary, Feedback.Inline' }),
    S({ id: 'AUTH-004', g: 'AUTH', n: L('Reset Berhasil', 'Reset Success'), purpose: L('Konfirmasi password baru tersimpan', 'Confirm the new password is saved'), roles: ALL, entry: L('Setelah AUTH-003', 'After AUTH-003'),
      main: L('"Password berhasil diperbarui."', '"Password updated."'), primary: L('Kembali ke Login', 'Back to Login'), secondary: '—', valid: '—', perm: L('Publik', 'Public'), states: L('Sukses', 'Success'), audit: '—', resp: COMMON_RESP, nb: ['NB-17'], nv: ['V4-01'], comps: 'Feedback state, Button.Primary', link: APP + '#/reset-berhasil' }),
    S({ id: 'AUTH-005', g: 'AUTH', n: L('Akun Tidak Aktif / Ditangguhkan', 'Account Inactive / Suspended'), purpose: L('Jelaskan kenapa tidak bisa masuk dan siapa yang dihubungi', 'Explain why sign-in is blocked and who to contact'), roles: ALL, entry: L('Login dengan akun INACTIVE/SUSPENDED, atau sesi berjalan saat admin menonaktifkan', 'Sign-in with an INACTIVE/SUSPENDED account, or an open session when an admin deactivates'),
      main: L('Pesan ramah, tanpa detail teknis', 'Friendly message, no technical detail'), primary: L('Kembali ke Login', 'Back to Login'), secondary: '—', valid: L('Status hanya tampil jika password benar', 'Status only shown when the password is correct'), perm: L('Publik', 'Public'),
      states: L('Tidak aktif, ditangguhkan', 'Inactive, suspended'), audit: 'AUTH.FORCED_LOGOUT (jika sesi berjalan)', resp: COMMON_RESP, nb: ['NB-17'], nv: ['V4-01'], comps: 'Feedback state, Button.Primary', link: APP + '#/nonaktif' }),
    S({ id: 'AUTH-006', g: 'AUTH', n: L('Akun Terkunci', 'Account Locked'), purpose: L('Beri tahu kunci sementara setelah percobaan gagal', 'Explain the temporary lock after failed attempts'), roles: ALL, entry: L('5 percobaan salah, atau admin mengunci', '5 wrong attempts, or locked by an admin'),
      main: L('"Akun sementara dikunci." + opsi Lupa Password', '"Your account is temporarily locked." + Forgot Password option'), primary: L('Lupa Password?', 'Forgot Password?'), secondary: L('Kembali ke Login', 'Back to Login'), valid: '—', perm: L('Publik', 'Public'),
      states: L('Terkunci (15 menit otomatis buka)', 'Locked (opens automatically after 15 minutes)'), audit: 'ACC.LOCKED', resp: COMMON_RESP, nb: ['NB-17', 'NB-18'], nv: ['V4-01'], comps: 'Feedback state, Button.Primary', link: APP + '#/terkunci' }),
    S({ id: 'AUTH-007', g: 'AUTH', n: L('Sesi Berakhir', 'Session Expired'), purpose: L('Masuk kembali setelah sesi habis atau diakhiri', 'Sign back in after the session ended'), roles: ALL, entry: L('Idle melewati batas, logout paksa, password diganti', 'Idle past the limit, forced logout, password changed'),
      main: L('"Sesi Anda telah berakhir" · "Silakan masuk kembali untuk melanjutkan."', '"Your session has ended" · "Please sign in again to continue."'), primary: L('Masuk Kembali', 'Sign In Again'), secondary: '—', valid: '—', perm: L('Publik', 'Public'),
      states: L('Habis waktu, diakhiri admin, hak akses berubah', 'Timed out, ended by admin, access changed'), audit: 'AUTH.SESSION_EXPIRED · AUTH.FORCED_LOGOUT', resp: COMMON_RESP, nb: ['NB-17', 'NB-18'], nv: ['V4-01'], comps: 'Feedback state, Button.Primary', link: APP + '#/sesi-berakhir?why=expired' }),
    S({ id: 'AUTH-008', g: 'AUTH', n: L('Inisialisasi Akses', 'Access Initialisation'), purpose: L('Tampilkan langkah resolusi akses; tangani akun tanpa peran/plant/karyawan', 'Show the access resolution steps; handle accounts with no role/plant/employee'), roles: ALL, entry: L('Setelah login berhasil', 'After a successful sign-in'),
      main: L('10 langkah: sesi, akun, status, karyawan, peran, plant, hak akses, bahasa, menu, halaman awal', '10 steps: session, account, status, employee, role, plant, permissions, language, menu, landing'), primary: L('Otomatis ke halaman awal', 'Automatic to landing page'), secondary: '—',
      valid: L('Tanpa peran / plant / karyawan → pesan "Hubungi administrator"', 'No role / plant / employee → "Contact your administrator"'), perm: L('Sesi valid', 'Valid session'), states: L('Memproses, tanpa peran, tanpa plant, tanpa data karyawan', 'Processing, no role, no plant, no employee record'), audit: 'AUTH.LOGIN_OK', resp: COMMON_RESP, nb: ['NB-17'], nv: ['V4-02'], comps: 'Stepper.Progress, Feedback state', link: APP + '#/tanpa-peran?c=no_role' }),
    S({ id: 'AUTH-009', g: 'AUTH', n: L('Koneksi / Sistem Bermasalah', 'Connection / System Error'), purpose: L('Pesan ramah tanpa kode teknis', 'Friendly message without technical codes'), roles: ALL, entry: L('Perangkat offline atau server gagal saat login/reset', 'Device offline or server failure during sign-in/reset'),
      main: L('"Tidak dapat terhubung. Periksa koneksi internet." · tidak menjanjikan penyimpanan offline', '"Cannot connect. Check your internet connection." · never promises offline storage'), primary: L('Coba Lagi', 'Try Again'), secondary: '—', valid: '—', perm: L('Publik', 'Public'),
      states: L('Offline, server error', 'Offline, server error'), audit: '—', resp: COMMON_RESP, nb: ['NB-17'], nv: ['V4-01'], comps: 'Feedback state, Button.Primary', link: APP + '#/koneksi' }),

    S({ id: 'SHELL-001', g: 'SHELL', n: L('Shell Desktop', 'Desktop Shell'), purpose: L('Kerangka kerja manajemen di layar lebar', 'Management workspace on wide screens'), roles: STAFF, entry: L('Setiap layar aplikasi ≥ 1240 px', 'Every app screen ≥ 1240 px'),
      main: L('Sidebar per peran (bisa diciutkan) · topbar: breadcrumb, pencarian (manajemen), plant, ID|EN, notifikasi, profil · bawah sidebar: Bantuan, Profil, Keluar', 'Role sidebar (collapsible) · top bar: breadcrumb, search (management), plant, ID|EN, notifications, profile · sidebar bottom: Help, Profile, Sign Out'),
      primary: L('Navigasi modul', 'Module navigation'), secondary: L('Menu profil', 'Profile menu'), valid: '—', perm: L('Menu = peran × hak akses', 'Menu = role × permission'), states: L('Sidebar terbuka / ciut, menu aktif jelas', 'Sidebar expanded / collapsed, clear active item'),
      audit: 'AUTH.ACCESS_DENIED, AUTH.PLANT_SWITCH', resp: L('Desktop saja', 'Desktop only'), nb: ['NB-17'], nv: ['V4-04', 'NV-03'], comps: 'Nav.Sidebar, Nav.Topbar, Nav.Breadcrumb, Nav.LangSwitch' }),
    S({ id: 'SHELL-002', g: 'SHELL', n: L('Shell iPad', 'iPad Shell'), purpose: L('Supervisor dan manajer di lantai produksi', 'Supervisors and managers on the floor'), roles: STAFF, entry: L('700–1239 px', '700–1239 px'),
      main: L('Rail ikon + drawer saat dibuka, topbar ringkas, breadcrumb', 'Icon rail + drawer when opened, compact top bar, breadcrumb'), primary: L('Navigasi modul', 'Module navigation'), secondary: L('Menu profil', 'Profile menu'), valid: '—', perm: L('Sama dengan desktop', 'Same as desktop'),
      states: L('Rail, drawer terbuka', 'Rail, drawer open'), audit: '—', resp: L('iPad saja', 'iPad only'), nb: ['NB-17'], nv: ['V4-04'], comps: 'Nav.Sidebar (rail), Nav.Topbar' }),
    S({ id: 'SHELL-003', g: 'SHELL', n: L('Shell Mobile', 'Mobile Shell'), purpose: L('Frontline, driver dan klien di ponsel', 'Frontline, drivers and clients on phones'), roles: ALL, entry: L('< 700 px', '< 700 px'),
      main: L('Header ringkas (logo/kembali, judul, notifikasi, avatar) · bottom nav maksimal 5 item dengan "Lainnya" · tanpa breadcrumb', 'Compact header (logo/back, title, notifications, avatar) · bottom nav max 5 items with "More" · no breadcrumb'),
      primary: L('Bottom nav', 'Bottom nav'), secondary: L('Lainnya (sheet)', 'More (sheet)'), valid: '—', perm: L('Bottom nav = 4 tugas utama yang diizinkan', 'Bottom nav = 4 permitted main tasks'), states: L('Sheet Lainnya terbuka', 'More sheet open'), audit: '—', resp: L('Mobile saja; bukan desktop yang dikecilkan', 'Mobile only; not a shrunken desktop'), nb: ['NB-17'], nv: ['V4-04'], comps: 'Nav.BottomNav, Nav.Topbar (compact)' }),

    S({ id: 'USER-001', g: 'USER', n: L('Profil Saya', 'My Profile'), purpose: L('Lihat data akun dan hak akses', 'See account data and permissions'), roles: ALL, entry: L('Menu profil, sidebar Profil, sheet Lainnya', 'Profile menu, sidebar Profile, More sheet'),
      main: L('Foto (opsional), nama, Employee ID, username, email, peran, plant, departemen, bahasa, daftar hak akses', 'Photo (optional), name, Employee ID, username, email, role, plant, department, language, permission list'), primary: L('Ganti Password', 'Change Password'), secondary: L('Keluar, Ganti Peran/Plant (jika ada)', 'Sign Out, Switch Role/Plant (if any)'),
      valid: L('Peran, hak akses, Employee ID hanya-baca', 'Role, permissions, Employee ID read-only'), perm: L('Sesi valid', 'Valid session'), states: L('Default', 'Default'), audit: '—', resp: L('Desktop 2 kolom · iPad/mobile 1 kolom', 'Desktop 2 columns · iPad/mobile 1 column'), nb: ['NB-17'], nv: ['V4-04'], comps: 'Card, Tag, Nav.LangSwitch, Button' }),
    S({ id: 'USER-002', g: 'USER', n: L('Ganti Password', 'Change Password'), purpose: L('Ganti password dari dalam aplikasi', 'Change the password from inside the app'), roles: ALL, entry: 'USER-001',
      main: L('Password Lama, Password Baru, Konfirmasi', 'Current, New, Confirm password'), primary: L('Simpan Password', 'Save Password'), secondary: L('Batal', 'Cancel'),
      valid: L('Password lama benar; minimal 8 karakter; sama; berbeda dari yang lama', 'Current password correct; at least 8 characters; matching; different from the current one'), perm: L('Sesi valid', 'Valid session'), states: L('Default, error field, loading, sukses', 'Default, field error, loading, success'), audit: 'AUTH.PW_CHANGED', resp: L('Form satu kolom maks 520 px', 'Single-column form max 520 px'), nb: ['NB-17'], nv: ['V4-01'], comps: 'Input.Password, Button.Primary, Feedback.Inline' }),
    S({ id: 'USER-003', g: 'USER', n: L('Ganti Peran', 'Switch Role'), purpose: L('Pindah di antara peran yang diberikan', 'Move between assigned roles'), roles: L('User multi-peran yang diizinkan', 'Permitted multi-role users'), entry: L('Menu profil', 'Profile menu'),
      main: L('Daftar peran yang diberikan, default ditandai, halaman awal tiap peran', 'Assigned roles, default marked, landing page for each'), primary: L('Pilih peran', 'Choose role'), secondary: L('Kembali', 'Back'),
      valid: L('Peran di luar penugasan ditolak dan dicatat', 'Roles outside the assignment are refused and logged'), perm: 'user.switchRole', states: L('Default, satu peran saja', 'Default, single role only'), audit: 'AUTH.ROLE_SWITCH · AUTH.ACCESS_DENIED', resp: L('Daftar pilihan maks 640 px', 'Option list max 640 px'), nb: ['NB-17', 'NB-18'], nv: ['V4-02'], comps: 'Input.Options (radio cards), Status chip' }),
    S({ id: 'USER-004', g: 'USER', n: L('Ganti Plant', 'Switch Plant'), purpose: L('Pindah plant aktif untuk user multi-plant', 'Change the active plant for multi-plant users'), roles: L('User dengan > 1 plant', 'Users with > 1 plant'), entry: L('Pemilih plant di topbar, menu profil', 'Plant selector in the top bar, profile menu'),
      main: L('Plant yang diberikan (+ Semua Plant untuk akses penuh)', 'Assigned plants (+ All Plants for full access)'), primary: L('Pilih plant', 'Choose plant'), secondary: L('Kembali', 'Back'), valid: L('Plant di luar penugasan ditolak', 'Plants outside the assignment are refused'), perm: L('Penugasan plant', 'Plant assignment'),
      states: L('Default, satu plant saja', 'Default, single plant only'), audit: 'AUTH.PLANT_SWITCH', resp: L('Popover di desktop, layar penuh di mobile', 'Popover on desktop, full screen on mobile'), nb: ['NB-17'], nv: ['V4-02'], comps: 'Input.Options, Popover menu' }),

    S({ id: 'NOTIF-001', g: 'NOTIF', n: L('Pusat Notifikasi', 'Notification Center'), purpose: L('Semua notifikasi yang relevan untuk user ini', 'Every notification relevant to this user'), roles: ALL, entry: L('Ikon lonceng (dengan jumlah belum dibaca)', 'Bell icon (with unread count)'),
      main: L('Tab Semua/Kritis/Peringatan/Operasional/Informasi, kartu: ikon, judul, konteks, waktu, belum dibaca', 'Tabs All/Critical/Warning/Operational/Information, cards: icon, title, context, time, unread'), primary: L('Buka notifikasi', 'Open notification'), secondary: L('Tandai semua dibaca, Pengaturan', 'Mark all as read, Settings'),
      valid: '—', perm: L('Filter peran × plant × klien; tombol aksi hanya ke layar yang diizinkan', 'Role × plant × client filter; action buttons only to permitted screens'), states: L('Ada belum dibaca, semua dibaca, kosong', 'Unread, all read, empty'), audit: '—', resp: L('Daftar penuh di semua perangkat; tab bisa digeser di mobile', 'Full list on every device; tabs scroll on mobile'), nb: ['NB-16'], nv: ['V4-07'], comps: 'Card.Alert, Nav.Tabs, Status' }),
    S({ id: 'NOTIF-002', g: 'NOTIF', n: L('Detail Notifikasi', 'Notification Detail'), purpose: L('Konteks dan tindakan untuk satu notifikasi', 'Context and action for one notification'), roles: ALL, entry: 'NOTIF-001',
      main: L('Kategori, judul, waktu, detail, tindakan disarankan', 'Category, title, time, details, suggested action'), primary: L('Tombol aksi (mis. Lihat Stok)', 'Action button (e.g. View Stock)'), secondary: L('Kembali', 'Back'),
      valid: L('Notifikasi milik user lain/klien lain → tidak ada akses', 'Another user\'s / client\'s notification → no access'), perm: L('Sama dengan NOTIF-001', 'Same as NOTIF-001'), states: L('Default, tidak ada akses', 'Default, no access'), audit: '—', resp: L('Maks 720 px', 'Max 720 px'), nb: ['NB-16'], nv: ['V4-07'], comps: 'Card.Alert, Feedback.Inline, Button.Primary' }),
    S({ id: 'NOTIF-003', g: 'NOTIF', n: L('Pengaturan Notifikasi', 'Notification Settings'), purpose: L('Pilih kategori dan saluran', 'Choose categories and channels'), roles: ALL, entry: 'NOTIF-001',
      main: L('Kategori: Kritis (wajib), Peringatan, Operasional, Informasi · Saluran: In-App (wajib), Email, Push', 'Categories: Critical (always on), Warning, Operational, Information · Channels: In-App (always on), Email, Push'), primary: L('Simpan', 'Save'), secondary: L('Kembali', 'Back'),
      valid: L('Kritis dan In-App tidak bisa dimatikan', 'Critical and In-App cannot be turned off'), perm: L('Sesi valid', 'Valid session'), states: L('Default, tersimpan', 'Default, saved'), audit: '—', resp: L('Maks 720 px', 'Max 720 px'), nb: ['NB-16'], nv: ['V4-07'], comps: 'Input.Toggle, Button.Primary' }),

    S({ id: 'LAND-001', g: 'LAND', n: L('Landing Operator', 'Operator Landing'), purpose: L('"Apa yang harus saya kerjakan sekarang?"', '"What should I do now?"'), roles: L('Receiving Operator, QC Inspector', 'Receiving Operator, QC Inspector'), entry: L('Login peran operator', 'Operator sign-in'),
      main: L('Menunggu / Diproses / Ada Masalah / Siap Dikirim, daftar tugas hari ini', 'Waiting / In Process / Issues / Ready to Ship, today\'s task list'), primary: L('Terima Cucian', 'Receive Laundry'), secondary: L('Tugas Saya / Riwayat / Ada Masalah', 'My Tasks / History / Report Issue'),
      valid: '—', perm: 'home.op', states: L('Default, kosong, loading, offline', 'Default, empty, loading, offline'), audit: '—', resp: L('Mobile-first, tombol besar, tanpa filter', 'Mobile-first, large buttons, no filters'), nb: ['NB-04', 'NB-06', 'NB-07'], nv: ['V4-03'], comps: 'Card.KPI, Card.Action, Data.List', link: APP + '#/?u=made' }),
    S({ id: 'LAND-002', g: 'LAND', n: L('Landing Driver', 'Driver Landing'), purpose: L('Rute dan stop berikutnya', 'Route and next stop'), roles: L('Driver / Pickup', 'Driver / Pickup'), entry: L('Login driver', 'Driver sign-in'),
      main: L('Pickup / pengiriman tersisa, stop berikutnya, Rute Hari Ini (waktu, tujuan, jenis, status, kontak)', 'Pickups / deliveries left, next stop, Today\'s Route (time, destination, type, status, contact)'), primary: L('Mulai Rute', 'Start Route'), secondary: L('Lihat Rute, Ada Masalah', 'View Route, Report Issue'),
      valid: '—', perm: 'home.drv', states: L('Default, tidak ada stop, offline', 'Default, no stops, offline'), audit: '—', resp: L('Mobile', 'Mobile'), nb: ['NB-03', 'NB-10', 'NB-15'], nv: ['V4-03'], comps: 'Card.KPI, Card.Task, Data.List', link: APP + '#/?u=ketut' }),
    S({ id: 'LAND-003', g: 'LAND', n: L('Landing Supervisor', 'Supervisor Landing'), purpose: L('Operasional hari ini dan yang perlu perhatian', 'Today\'s operations and what needs attention'), roles: L('Supervisor, Operations Manager', 'Supervisor, Operations Manager'), entry: L('Login supervisor', 'Supervisor sign-in'),
      main: L('Beban kerja, Menunggu, Risiko SLA, Ada Masalah, Siap Dikirim, Perlu Perhatian, bottleneck, SLA berisiko, tim', 'Workload, Waiting, SLA risk, Issues, Ready to Ship, Needs Attention, bottleneck, SLA at risk, team'), primary: L('Tinjau Masalah', 'Review Issues'), secondary: L('Lihat Papan', 'Open Board'),
      valid: '—', perm: 'home.spv', states: L('Default, loading, error', 'Default, loading, error'), audit: '—', resp: L('iPad-first', 'iPad-first'), nb: ['NB-16', 'NB-11'], nv: ['V4-03'], comps: 'Card.KPI, Card.Alert, Chart', link: APP + '#/?u=saras' }),
    S({ id: 'LAND-004', g: 'LAND', n: L('Landing Finance', 'Finance Landing'), purpose: L('Finance hari ini', 'Finance today'), roles: 'Finance', entry: L('Login finance', 'Finance sign-in'),
      main: L('Siap ditagih, invoice terbuka, jatuh tempo, terlambat, umur piutang, pembayaran terbaru', 'Ready to bill, open invoices, due, overdue, receivable age, latest payments'), primary: L('Buat Tagihan', 'Create Bills'), secondary: L('Catat Pembayaran', 'Record Payment'),
      valid: '—', perm: 'home.fin', states: L('Default, loading, error', 'Default, loading, error'), audit: '—', resp: L('Desktop-first', 'Desktop-first'), nb: ['NB-12', 'NB-13'], nv: ['V4-03'], comps: 'Card.KPI, Chart, Data.List', link: APP + '#/?u=budi' }),
    S({ id: 'LAND-005', g: 'LAND', n: L('Landing Sales', 'Sales Landing'), purpose: L('Klien & kontrak', 'Clients & contracts'), roles: L('Sales / Account', 'Sales / Account'), entry: L('Login sales', 'Sales sign-in'),
      main: L('Klien aktif, kontrak habis ≤ 60 hari, SLA klien, komplain, renewal, dokumen', 'Active clients, contracts ending ≤ 60 days, client SLA, complaints, renewals, documents'), primary: L('Lihat Renewal', 'View Renewals'), secondary: L('Tambah Klien', 'Add Client'),
      valid: '—', perm: 'home.sal', states: L('Default, loading, error', 'Default, loading, error'), audit: '—', resp: L('Desktop-first', 'Desktop-first'), nb: ['NB-01'], nv: ['V4-03'], comps: 'Card.KPI, Data.List', link: APP + '#/?u=ayu' }),
    S({ id: 'LAND-006', g: 'LAND', n: L('Landing Owner', 'Owner Landing'), purpose: L('Executive overview dan alert penting', 'Executive overview and important alerts'), roles: 'Owner / CEO', entry: L('Login owner', 'Owner sign-in'),
      main: L('Revenue, volume, SLA, quality, piutang, profitabilitas, alert penting, tren, performa klien', 'Revenue, volume, SLA, quality, receivables, profitability, important alerts, trend, client performance'), primary: L('Buka Persetujuan', 'Open Approvals'), secondary: L('Lihat Laporan', 'View Reports'),
      valid: '—', perm: 'home.exe', states: L('Default, loading, error', 'Default, loading, error'), audit: '—', resp: L('Desktop-first', 'Desktop-first'), nb: ['NB-16'], nv: ['V4-03'], comps: 'Card.KPI, Card.Alert, Chart, Data.Table', link: APP + '#/?u=aji' }),
    S({ id: 'LAND-007', g: 'LAND', n: L('Landing Klien', 'Client Landing'), purpose: L('Layanan saya', 'My service'), roles: L('Client Portal', 'Client Portal'), entry: L('Login klien', 'Client sign-in'),
      main: L('Pesanan berjalan, pengiriman berikutnya, invoice belum dibayar, SLA, pesanan aktif dengan tracking', 'Orders in progress, next delivery, unpaid invoices, SLA, active orders with tracking'), primary: L('Minta Pickup', 'Request Pickup'), secondary: L('Pesanan, Invoice', 'Orders, Invoices'),
      valid: L('Hanya data klien sendiri', 'Own client data only'), perm: 'home.clt', states: L('Default, kosong', 'Default, empty'), audit: 'AUTH.ACCESS_DENIED (link ke data klien lain)', resp: L('Mobile-first', 'Mobile-first'), nb: ['NB-19'], nv: ['V4-03'], comps: 'Card.KPI, Card.Action, Stepper.Process', link: APP + '#/?u=sari.grandvista' })
  ];

  /* ---------- §77 Responsive test checklist (manual, verified by screenshot at 1440 / 900 / 390) ---------- */
  D.RESPONSIVE = [
    ['RSP-01', L('Login: desktop 2 kolom (brand | form), iPad dan mobile satu kartu', 'Login: desktop 2 columns (brand | form), iPad and mobile one card')],
    ['RSP-02', L('Tidak ada scroll horizontal di 1440, 900, 390 px', 'No horizontal scroll at 1440, 900, 390 px')],
    ['RSP-03', L('Target sentuh minimal 44 px untuk tombol, link menu, toggle password', 'Touch targets at least 44 px for buttons, menu links, password toggle')],
    ['RSP-04', L('Desktop: sidebar + topbar; iPad: rail/drawer; mobile: bottom nav ≤ 5 item', 'Desktop: sidebar + top bar; iPad: rail/drawer; mobile: bottom nav ≤ 5 items')],
    ['RSP-05', L('Breadcrumb tampil di desktop/iPad, tidak di mobile', 'Breadcrumb on desktop/iPad, not on mobile')],
    ['RSP-06', L('Menu profil dan pemilih plant tidak keluar layar', 'Profile menu and plant selector stay on screen')],
    ['RSP-07', L('Peringatan sesi: dialog di desktop, bottom sheet di mobile', 'Session warning: dialog on desktop, bottom sheet on mobile')],
    ['RSP-08', L('Notifikasi: tab bisa digeser di mobile, kartu tidak terpotong', 'Notifications: tabs scroll on mobile, cards never cut off')]
  ];

  /* ---------- §79 Non-negotiables ---------- */
  D.DONT = [L('OTP di login biasa', 'OTP on normal login'), L('User bebas memilih peran', 'Users freely choosing any role'), L('Satu landing untuk semua', 'One universal landing page'), L('Satu sidebar untuk semua', 'One universal sidebar'),
    L('Modul tampil tanpa izin', 'Modules shown without permission'), L('Tampilan frontend menggantikan otorisasi backend', 'Frontend visibility replacing backend authorization'), L('Data klien bocor antar tenant', 'Client data across tenants'),
    L('Hapus riwayat karyawan saat user dinonaktifkan', 'Deleting employee history when a user is deactivated'), L('Error keamanan teknis ke user', 'Technical security errors to users'), L('Mengubah logo atau palet J\'Fresh', 'Changing the J\'Fresh logo or palette'),
    L('Mobile sebagai desktop yang dikecilkan', 'Mobile as a miniaturised desktop'), L('Beranda frontline yang penuh', 'An overloaded frontline home')];

  /* ---------- §78 Definition of Done (status is honest: see notes) ---------- */
  D.DOD = [
    [L('Login username/email + password tanpa OTP', 'Username/email + password login without OTP'), 'done', 'index.html#np01'],
    [L('Pesan validasi dan error sesuai brief, tanpa kode teknis', 'Validation and error copy as briefed, no technical codes'), 'done', 'tests.html#login'],
    [L('Peran dan hak akses ditentukan otomatis, least privilege', 'Role and permissions resolved automatically, least privilege'), 'done', 'tests.html#access'],
    [L('Landing berbeda per peran', 'A different landing page per role'), 'done', 'tests.html#landing'],
    [L('Sidebar / bottom nav per peran dan hak akses', 'Sidebar / bottom nav per role and permission'), 'done', 'index.html#np04'],
    [L('Link langsung terlarang ditolak dengan ramah', 'Forbidden direct links refused politely'), 'done', 'index.html#np05'],
    [L('Scope plant dan isolasi klien', 'Plant scope and client isolation'), 'done', 'tests.html#access'],
    [L('Profil, bahasa ID|EN, notifikasi + preferensi', 'Profile, ID|EN language, notifications + preferences'), 'done', 'index.html#np06'],
    [L('Lupa / reset password, sesi berakhir, peringatan sesi, logout', 'Forgot / reset password, session expiry, session warning, sign-out'), 'done', 'index.html#np07'],
    [L('Status akun ACTIVE / INACTIVE / SUSPENDED / LOCKED', 'Account status ACTIVE / INACTIVE / SUSPENDED / LOCKED'), 'done', 'tests.html#login'],
    [L('Audit event akses (§58) tampil di Sistem › Audit', 'Access audit events (§58) shown in System › Audit'), 'done', 'index.html#np07'],
    [L('Spesifikasi semua layar §72 dengan field §73', 'Specs for every §72 screen with the §73 fields'), 'done', 'screens.html'],
    [L('Desktop, iPad, mobile diperiksa', 'Desktop, iPad, mobile checked'), 'done', 'tests.html#responsive'],
    [L('Otorisasi backend & isolasi tenant di server', 'Backend authorization & tenant isolation on the server'), 'backend', 'index.html#backend']
  ];

  if (typeof module !== 'undefined' && module.exports) module.exports = D;
  else root.JFACCESS_DOCS = D;
})(typeof window !== 'undefined' ? window : this);
