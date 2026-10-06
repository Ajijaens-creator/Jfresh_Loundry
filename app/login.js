/* ==========================================================================
   JFRESH OS — Login & account recovery (Phase 4 · NP-01, NP-07)
   AUTH-001 Login · AUTH-002 Forgot Password · AUTH-003 Reset Password ·
   AUTH-004 Reset Success · AUTH-005 Account Inactive · AUTH-006 Account
   Locked · AUTH-007 Session Expired · AUTH-009 Connection Error.
   Built only from Phase 3 components (JFDS) and tokens. No OTP.

   Routes: login.html#/            login
           login.html#/lupa        forgot password
           login.html#/reset/<t>   new password (link from email)
           login.html#/reset-berhasil
           login.html#/nonaktif · #/terkunci · #/ditangguhkan · #/tanpa-peran
           login.html#/sesi-berakhir?why=expired|revoked|changed
           login.html#/koneksi
   ?next=<app hash> returns the user to the page they asked for after login.
   ========================================================================== */
(function () {
  var X = window.JFACCESS, DS = window.JFDS, L = DS.L, ic = DS.ic, esc = DS.esc;
  var LANG = 'id';
  try { LANG = localStorage.getItem('jfresh-lang') === 'en' ? 'en' : 'id'; } catch (e) {}
  window.JF = window.JF || { lang: function () { return LANG; }, onLang: function () {} };
  function T(p) { return Array.isArray(p) ? (LANG === 'en' ? p[1] : p[0]) : String(p == null ? '' : p); }
  function t(p) { return esc(T(p)); }
  var card = document.getElementById('card');
  var busy = false;

  function qs() { var q = {}; location.search.replace(/^\?/, '').split('&').forEach(function (kv) { if (!kv) return; var a = kv.split('='); q[decodeURIComponent(a[0])] = decodeURIComponent(a[1] || ''); }); return q; }
  function route() {
    var h = (location.hash || '').replace(/^#\/?/, ''), qi = h.indexOf('?'), q = {};
    if (qi >= 0) { h.slice(qi + 1).split('&').forEach(function (kv) { var a = kv.split('='); q[a[0]] = decodeURIComponent(a[1] || ''); }); h = h.slice(0, qi); }
    var p = h.split('/').filter(Boolean);
    return { v: p[0] || '', arg: p[1] || null, q: q };
  }
  function go(h) { location.hash = '#/' + h; }

  function langSw() {
    return '<div class="ds-langswitch au-lang" role="group" aria-label="Bahasa / Language"><button type="button" data-lang="id" aria-pressed="' + (LANG === 'id') + '">ID</button><button type="button" data-lang="en" aria-pressed="' + (LANG === 'en') + '">EN</button></div>';
  }
  function head(title1, title2, sub) {
    return '<div class="au-card__top">' + langSw() + '</div><img class="au-card__logo" src="../assets/brand/jfresh-logo.png" alt="J\'Fresh Laundry" width="605" height="373">' +
      '<h1 class="au-h"><span>' + t(title1) + '</span>' + (title2 ? '<b>' + t(title2) + '</b>' : '') + '</h1>' + (sub ? '<p class="au-p">' + t(sub) + '</p>' : '');
  }
  function alertBox(type, msg, extra) { return '<div class="au-alert">' + DS.Feedback.Inline({ type: type, text: msg }) + (extra || '') + '</div>'; }
  function paint(html) { card.innerHTML = html; DS.lang(card); var f = card.querySelector('[autofocus]'); if (f && window.matchMedia('(min-width: 700px)').matches) f.focus(); }

  /* ---------- AUTH-001 Login ---------- */
  function viewLogin(r, state) {
    state = state || {};
    var remembered = (function () { try { var raw = localStorage.getItem('jfos-access-v1'); return raw ? JSON.parse(raw).remember : null; } catch (e) { return null; } })();
    var userVal = state.user != null ? state.user : (r.q.u || remembered || '');
    var e = state.err || null;
    var userErr = e && e.field === 'user', passErr = e && e.field === 'pass';
    var alert = '';
    if (e && !e.field) alert = alertBox(e.code === 'network' || e.code === 'system' ? 'warning' : 'error', X.MSG[e.code] || X.MSG.system,
      e.code === 'network' || e.code === 'system' ? '' : (e.code === 'too_many' ? '' : ''));
    if (r.q.out === '1') alert = alertBox('success', L('Anda sudah keluar. Sampai jumpa lagi.', 'You are signed out. See you again.'));
    if (r.q.pw === '1') alert = alertBox('success', L('Password berhasil diperbarui. Silakan masuk.', 'Password updated. Please sign in.'));
    paint(head(L('Selamat Datang di', 'Welcome to'), 'JFRESH OS', L('Masuk untuk melanjutkan', 'Sign in to continue')) + alert +
      '<form class="au-form" id="f-login" novalidate>' +
      DS.Input.Text({ label: L('Username atau Email', 'Username or Email'), icon: 'user', placeholder: L('Username atau email', 'Username or email'), value: userVal, name: 'username', autocomplete: 'username', autocapitalize: 'none', spellcheck: 'false', req: true,
        state: userErr ? 'error' : null, help: userErr ? X.MSG[e.code] : null }).replace('<input ', '<input autofocus ') +
      DS.Input.Password({ label: L('Password', 'Password'), placeholder: L('Password', 'Password'), name: 'password', autocomplete: 'current-password', req: true, state: passErr ? 'error' : null, help: passErr ? X.MSG[e.code] : null }) +
      '<div class="au-row">' + DS.Input.Checkbox({ label: L('Ingat saya', 'Remember me'), checked: !!remembered }) + '</div>' +
      DS.Button.Primary({ label: L('Masuk', 'Sign In'), icon: 'arrow', type: 'submit', size: 'lg', block: true, cls: 'au-cta' }) +
      '<a class="au-link" href="#/lupa">' + t(L('Lupa Password?', 'Forgot Password?')) + '</a>' +
      '</form>');
    // icon after the label (visual 01: "Masuk →")
    var btn = card.querySelector('.au-cta'); btn.appendChild(btn.querySelector('svg'));
    // Links from the Phase 4 docs (#/?u=<demo account>) prefill the demo password too.
    if (r.q.u && !state.user && X.DEMO.some(function (d) { return d.u === r.q.u; })) card.querySelector('input[name="password"]').value = X.DEMO_PASSWORD;
    var f = document.getElementById('f-login');
    f.addEventListener('submit', function (ev) {
      ev.preventDefault();
      if (busy) return;                                     // §6: no duplicate submission
      var u = f.querySelector('input[name="username"]').value, p = f.querySelector('input[name="password"]').value, rem = f.querySelector('.ds-check input').checked;
      busy = true; btn.disabled = true; btn.classList.add('is-busy'); btn.setAttribute('aria-busy', 'true');
      btn.querySelector('span').textContent = T(L('Memproses...', 'Processing...'));
      setTimeout(function () {
        var res = X.login(u, p, { remember: rem });
        busy = false;
        if (res.ok) return viewResolving(r, res);
        if (res.code === 'inactive') return go('nonaktif');
        if (res.code === 'suspended') return go('ditangguhkan');
        if (res.code === 'locked') return go('terkunci');
        if (res.code === 'no_role' || res.code === 'no_plant' || res.code === 'no_employee') return go('tanpa-peran?c=' + res.code);
        viewLogin(r, { user: u, err: res });
        var bad = card.querySelector(res.field === 'pass' ? 'input[name="password"]' : 'input[name="username"]');
        if (bad && res.field) bad.focus();
      }, 650);
    });
  }

  /* After login: §70 initialisation steps, then the role landing page (§7). */
  function viewResolving(r, res) {
    var steps = X.STEPS;
    paint(head(L('Menyiapkan akun Anda', 'Preparing your account'), null, null) +
      '<ol class="au-steps" id="steps">' + steps.map(function (s) { return '<li><span class="au-steps__dot">' + ic('check') + '</span><span>' + t(s[1]) + '</span></li>'; }).join('') + '</ol>');
    var lis = card.querySelectorAll('#steps li'), i = 0;
    var iv = setInterval(function () {
      if (i < lis.length) { lis[i].classList.add('is-done'); i++; return; }
      clearInterval(iv);
      var v = X.validate(); if (!v.ok) return go('sesi-berakhir?why=' + v.code);
      var next = qs().next, target = '#/' + v.ctx.exp + '/' + v.ctx.landing;
      if (next && /^#\/[a-z]+\/[A-Z0-9-]+/.test(next)) target = next;
      location.href = 'index.html' + target;
    }, 70);
  }

  /* ---------- AUTH-002 Forgot Password ---------- */
  function viewForgot(r, state) {
    state = state || {};
    if (state.sent) {
      paint(head(L('Cek Email Anda', 'Check Your Email'), null, null) +
        '<div class="au-state">' + '<span class="au-state__ic is-success">' + ic('checkc') + '</span>' + '<p>' + t(X.MSG.reset_sent) + '</p>' +
        '<p class="au-p">' + t(L('Link berlaku 30 menit. Periksa juga folder spam.', 'The link is valid for 30 minutes. Check your spam folder too.')) + '</p></div>' +
        DS.Button.Primary({ label: L('Kembali ke Login', 'Back to Sign In'), icon: 'arrowl', href: '#/', size: 'lg', block: true }) +
        '<p class="au-demo-hint">' + ic('monitor') + '<span>' + t(L('Demo: email reset muncul di panel “Kotak email demo”.', 'Demo: the reset email appears in the “Demo inbox” panel.')) + '</span></p>');
      demo(); return;
    }
    var e = state.err;
    paint(head(L('Lupa Password?', 'Forgot Password?'), null, L('Masukkan username atau email akun Anda. Kami kirim link untuk membuat password baru.', 'Enter your username or email. We will send a link to create a new password.')) +
      (e && !e.field ? alertBox('warning', X.MSG[e.code]) : '') +
      '<form class="au-form" id="f-forgot" novalidate>' +
      DS.Input.Text({ label: L('Username atau Email', 'Username or Email'), icon: 'user', name: 'username', autocomplete: 'username', autocapitalize: 'none', value: state.user || '', req: true, state: e && e.field ? 'error' : null, help: e && e.field ? X.MSG.empty_user : null }).replace('<input ', '<input autofocus ') +
      DS.Button.Primary({ label: L('Kirim Link Reset', 'Send Reset Link'), icon: 'arrow', type: 'submit', size: 'lg', block: true, cls: 'au-cta' }) +
      '<a class="au-link" href="#/">' + ic('arrowl') + t(L('Kembali ke Login', 'Back to Sign In')) + '</a></form>');
    var f = document.getElementById('f-forgot'), btn = card.querySelector('.au-cta');
    f.addEventListener('submit', function (ev) {
      ev.preventDefault(); if (busy) return;
      var u = f.querySelector('input').value;
      busy = true; btn.disabled = true; btn.classList.add('is-busy'); btn.querySelector('span').textContent = T(L('Mengirim...', 'Sending...'));
      setTimeout(function () {
        busy = false; var res = X.requestReset(u);
        if (!res.ok) return viewForgot(r, { user: u, err: { code: res.code, field: res.code === 'empty_user' ? 'user' : null } });
        viewForgot(r, { sent: true });
      }, 600);
    });
  }

  /* ---------- AUTH-003 Reset Password ---------- */
  function viewReset(r, state) {
    state = state || {};
    var token = r.arg;
    if (!X.checkToken(token)) {
      paint(head(L('Link Tidak Berlaku', 'Link Not Valid'), null, null) + stateBlock('warning', 'clock', X.MSG.reset_bad) +
        DS.Button.Primary({ label: L('Minta Link Baru', 'Request a New Link'), icon: 'refresh', href: '#/lupa', size: 'lg', block: true }) +
        '<a class="au-link" href="#/">' + t(L('Kembali ke Login', 'Back to Sign In')) + '</a>');
      return;
    }
    var e = state.err;
    paint(head(L('Buat Password Baru', 'Create a New Password'), null, L('Gunakan minimal 8 karakter yang mudah Anda ingat tetapi sulit ditebak orang lain.', 'Use at least 8 characters that are easy for you to remember and hard for others to guess.')) +
      '<form class="au-form" id="f-reset" novalidate>' +
      DS.Input.Password({ label: L('Password Baru', 'New Password'), name: 'p1', autocomplete: 'new-password', req: true, state: e && e.field === 'p1' ? 'error' : null, help: e && e.field === 'p1' ? X.MSG[e.code] : L('Minimal 8 karakter.', 'At least 8 characters.') }).replace('<input ', '<input autofocus ') +
      DS.Input.Password({ label: L('Konfirmasi Password', 'Confirm Password'), name: 'p2', autocomplete: 'new-password', req: true, state: e && e.field === 'p2' ? 'error' : null, help: e && e.field === 'p2' ? X.MSG[e.code] : null }) +
      DS.Button.Primary({ label: L('Simpan Password', 'Save Password'), icon: 'check', type: 'submit', size: 'lg', block: true, cls: 'au-cta' }) + '</form>');
    var f = document.getElementById('f-reset'), btn = card.querySelector('.au-cta');
    f.addEventListener('submit', function (ev) {
      ev.preventDefault(); if (busy) return;
      var p1 = f.querySelector('input[name="p1"]').value, p2 = f.querySelector('input[name="p2"]').value;
      busy = true; btn.disabled = true; btn.classList.add('is-busy'); btn.querySelector('span').textContent = T(L('Menyimpan...', 'Saving...'));
      setTimeout(function () {
        busy = false; var res = X.resetPassword(token, p1, p2);
        if (res.ok) return go('reset-berhasil');
        if (res.code === 'reset_bad') return viewReset(r);
        viewReset(r, { err: res });
      }, 600);
    });
  }

  /* ---------- State screens ---------- */
  function stateBlock(tone, icon, msg, sub) {
    return '<div class="au-state"><span class="au-state__ic is-' + tone + '">' + ic(icon) + '</span><p>' + t(msg) + '</p>' + (sub ? '<p class="au-p">' + t(sub) + '</p>' : '') + '</div>';
  }
  function viewState(kind, r) {
    var S = {
      'reset-berhasil': { t: L('Password Berhasil Diperbarui', 'Password Updated'), tone: 'success', icon: 'checkc', m: L('Password berhasil diperbarui.', 'Your password has been updated.'), s: L('Semua sesi lama sudah ditutup. Silakan masuk dengan password baru.', 'All old sessions were closed. Sign in with your new password.'), cta: [L('Kembali ke Login', 'Back to Sign In'), 'arrowl', '#/'] },
      nonaktif: { t: L('Akun Tidak Aktif', 'Account Inactive'), tone: 'warning', icon: 'user', m: L('Akun Anda tidak aktif.', 'Your account is inactive.'), s: L('Hubungi administrator untuk mengaktifkan kembali akun Anda.', 'Contact your administrator to reactivate your account.'), cta: [L('Kembali ke Login', 'Back to Sign In'), 'arrowl', '#/'] },
      ditangguhkan: { t: L('Akun Ditangguhkan', 'Account Suspended'), tone: 'warning', icon: 'ban', m: L('Akun Anda sedang ditangguhkan.', 'Your account is suspended.'), s: L('Hubungi administrator untuk informasi lebih lanjut.', 'Contact your administrator for more information.'), cta: [L('Kembali ke Login', 'Back to Sign In'), 'arrowl', '#/'] },
      terkunci: { t: L('Akun Sementara Dikunci', 'Account Temporarily Locked'), tone: 'error', icon: 'lock', m: L('Akun sementara dikunci.', 'Your account is temporarily locked.'), s: L('Terlalu banyak percobaan masuk. Coba lagi beberapa saat, atau buat password baru.', 'Too many sign-in attempts. Try again in a while, or create a new password.'), cta: [L('Lupa Password?', 'Forgot Password?'), 'key', '#/lupa'], cta2: [L('Kembali ke Login', 'Back to Sign In'), '#/'] },
      'tanpa-peran': { t: L('Akses Belum Siap', 'Access Not Ready'), tone: 'warning', icon: 'shield', m: X.MSG[r.q.c] || X.MSG.no_role, s: L('Akun Anda aman. Administrator perlu melengkapi pengaturannya.', 'Your account is safe. An administrator needs to finish setting it up.'), cta: [L('Kembali ke Login', 'Back to Sign In'), 'arrowl', '#/'] },
      'sesi-berakhir': r.q.why === 'revoked' || r.q.why === 'inactive' || r.q.why === 'suspended' || r.q.why === 'locked' ?
        { t: L('Sesi Anda Diakhiri', 'Your Session Was Ended'), tone: 'warning', icon: 'logout', m: r.q.why === 'revoked' ? L('Sesi Anda diakhiri oleh administrator atau karena password diganti.', 'Your session was ended by an administrator or because the password changed.') : X.MSG[r.q.why], s: L('Silakan masuk kembali untuk melanjutkan.', 'Please sign in again to continue.'), cta: [L('Masuk Kembali', 'Sign In Again'), 'arrow', '#/'] } :
        { t: L('Sesi Anda telah berakhir', 'Your session has ended'), tone: 'info', icon: 'clock', m: L('Silakan masuk kembali untuk melanjutkan.', 'Please sign in again to continue.'), s: L('Demi keamanan, sesi ditutup setelah tidak ada aktivitas.', 'For security, sessions close after a period of no activity.'), cta: [L('Masuk Kembali', 'Sign In Again'), 'arrow', '#/'] },
      koneksi: { t: L('Tidak Dapat Terhubung', 'Cannot Connect'), tone: 'warning', icon: 'wifioff', m: L('Tidak dapat terhubung.', 'Cannot connect.'), s: L('Periksa koneksi internet, lalu coba lagi. Tidak ada data yang disimpan selama offline.', 'Check your internet connection, then try again. Nothing is saved while offline.'), cta: [L('Coba Lagi', 'Try Again'), 'refresh', '#/koneksi?retry=1'] }
    }[kind];
    if (kind === 'koneksi' && r.q.retry === '1') { if (X.net() === 'online') return go(''); }
    var next = qs().next;
    paint(head(S.t, null, null) + stateBlock(S.tone, S.icon, S.m, S.s) +
      DS.Button.Primary({ label: S.cta[0], icon: S.cta[1], href: S.cta[2] + (next && S.cta[2] === '#/' ? '' : ''), size: 'lg', block: true }) +
      (S.cta2 ? '<a class="au-link" href="' + S.cta2[1] + '">' + t(S.cta2[0]) + '</a>' : ''));
  }

  /* ---------- Trust row + demo panel ---------- */
  function trust() {
    document.getElementById('trust').innerHTML = [['shield', L('Profesional', 'Professional')], ['checkc', L('Terpercaya', 'Trusted')], ['droplet', L('Ramah Lingkungan', 'Eco-friendly')]].map(function (x) { return '<li>' + ic(x[0]) + '<span>' + t(x[1]) + '</span></li>'; }).join('');
  }
  function demo() {
    var el = document.getElementById('demo');
    var mails = X.outbox().slice(0, 3), net = X.net();
    var open = (function () { try { return sessionStorage.getItem('jfos-demo-open') === '1'; } catch (e) { return false; } })();
    // A link from the documentation names a role: suggest the matching demo account.
    var want = (/^#\/([a-z]+)\//.exec(qs().next || '') || [])[1], sug = null;
    if (want) X.USERS.some(function (u) { var d = u.roles.filter(function (r) { return r.def; })[0]; if (u.status === 'active' && d && X.ROLES[d.k].exp === want) { sug = u; return true; } return false; });
    if (sug) open = true;
    el.innerHTML = '<details class="au-demo__p"' + (open ? ' open' : '') + '><summary>' + ic('monitor') + '<span>' + t(L('Panel demo: akun & simulasi', 'Demo panel: accounts & simulation')) + '</span>' + ic('chevd') + '</summary><div class="au-demo__b">' +
      '<p class="au-demo__note">' + t(L('Prototipe tanpa server. Semua akun memakai password', 'Prototype without a server. Every account uses the password')) + ' <code>' + esc(X.DEMO_PASSWORD) + '</code>.</p>' +
      (sug ? '<p class="au-demo-hint au-demo-sug">' + ic('bulb') + '<span>' + t(L('Halaman yang Anda buka untuk peran', 'The page you opened is for the role')) + ' <b>' + t(X.ROLES[sug.roles.filter(function (r) { return r.def; })[0].k].n) + '</b>. ' + t(L('Akun demo:', 'Demo account:')) + ' <button type="button" class="au-inl" data-fill="' + esc(sug.u) + '">' + esc(sug.u) + '</button></span></p>' : '') +
      '<h3>' + t(L('Akun demo', 'Demo accounts')) + '</h3><div class="au-demo__acc">' + X.DEMO.map(function (d) { return '<button type="button" data-fill="' + esc(d.u) + '"><b>' + esc(d.u) + '</b><small>' + t(d.d) + '</small></button>'; }).join('') + '</div>' +
      '<h3>' + t(L('Koneksi (simulasi)', 'Connection (simulated)')) + '</h3><div class="ds-segment" role="group">' + [['online', 'Online'], ['offline', 'Offline'], ['error', L('Server error', 'Server error')]].map(function (n) { return '<button type="button" data-net="' + n[0] + '" aria-pressed="' + (net === n[0]) + '">' + t(n[1]) + '</button>'; }).join('') + '</div>' +
      '<h3>' + t(L('Kotak email demo', 'Demo inbox')) + '</h3>' + (mails.length ? '<ul class="au-demo__mail">' + mails.map(function (m) { var live = !m.used && m.exp > X.now(); return '<li><small>' + esc(m.to) + '</small><span>' + t(L('Reset password JFRESH OS', 'JFRESH OS password reset')) + '</span>' + (live ? '<a href="#/reset/' + esc(m.token) + '">' + t(L('Buka link reset', 'Open reset link')) + '</a>' : '<em>' + t(m.used ? L('Sudah dipakai', 'Used') : L('Kedaluwarsa', 'Expired')) + '</em>') + '</li>'; }).join('') + '</ul>' : '<p class="au-demo__note">' + t(L('Belum ada email.', 'No email yet.')) + '</p>') +
      '<button type="button" class="au-inl au-demo__rst" data-reset-acc>' + ic('refresh') + '<span>' + t(L('Pulihkan semua akun demo', 'Restore all demo accounts')) + '</span></button>' +
      '<p class="au-demo__links"><a href="../phase4/index.html">' + t(L('Dokumentasi Fase 4', 'Phase 4 documentation')) + '</a> · <a href="../phase4/tests.html">' + t(L('Hasil tes', 'Test results')) + '</a></p>' +
      '</div></details>';
    DS.lang(el);
    el.querySelector('details').addEventListener('toggle', function () { try { sessionStorage.setItem('jfos-demo-open', this.open ? '1' : '0'); } catch (e) {} });
  }

  function render() {
    var r = route();
    document.documentElement.lang = LANG;
    var titles = { '': L('Masuk', 'Sign In'), lupa: L('Lupa Password', 'Forgot Password'), reset: L('Password Baru', 'New Password') };
    document.title = T(titles[r.v] || L('Akun', 'Account')) + ' · JFRESH OS';
    if (r.v === '') {
      // Already signed in with a valid session → straight to the app.
      var v = X.validate();
      if (v.ok && r.q.u && v.ctx.user.u !== r.q.u) X.logout('switch');            // docs link for another demo account
      else if (v.ok && !r.q.out) { var nx = qs().next; location.replace('index.html' + (nx && /^#\/[a-z]+\/[A-Z0-9-]+/.test(nx) ? nx : '#/' + v.ctx.exp + '/' + v.ctx.landing)); return; }
      viewLogin(r);
    } else if (r.v === 'lupa') viewForgot(r);
    else if (r.v === 'reset') viewReset(r);
    else viewState(r.v, r);
    trust(); demo(); DS.lang(document.querySelector('.au-brand'));
  }

  document.addEventListener('click', function (e) {
    var x = e.target.closest('[data-lang]');
    if (x) { LANG = x.getAttribute('data-lang'); try { localStorage.setItem('jfresh-lang', LANG); } catch (er) {} X.setLang(LANG); render(); return; }
    if ((x = e.target.closest('[data-fill]'))) {
      if (route().v !== '') go('');
      setTimeout(function () { var u = card.querySelector('input[name="username"]'), p = card.querySelector('input[name="password"]'); if (u) u.value = x.getAttribute('data-fill'); if (p) { p.value = X.DEMO_PASSWORD; p.focus(); } }, 30);
      return;
    }
    if ((x = e.target.closest('[data-net]'))) { X.setNet(x.getAttribute('data-net')); demo(); return; }
    if ((x = e.target.closest('[data-reset-acc]'))) { X._resetStore(); go(''); render(); return; }
    if ((x = e.target.closest('[data-reveal]'))) { DS.reveal(x); return; }
  });
  window.addEventListener('hashchange', render);
  window.addEventListener('offline', function () { go('koneksi'); });
  if (navigator.onLine === false) location.hash = '#/koneksi';
  render();
})();
