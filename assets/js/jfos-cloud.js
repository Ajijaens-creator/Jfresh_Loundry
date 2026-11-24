/* ==========================================================================
   JFRESH OS — server connection for mode asli (Supabase)
   Loaded on every page after jfos-site.js and jfos-access.js. In demo mode it
   does nothing. In mode asli it:
     · signs in with Supabase Auth (email + password, no OTP),
     · reads the account's roles, permissions and plants with my_access(),
     · hands them to JFACCESS.adoptCloud(), so every screen keeps using the
       same resolve() / authorize() path as before,
     · checks the server session again on start and every few minutes, so a
       deactivated account or a role change takes effect without a new login.
   The publishable key below is meant to be public: the database only answers
   what row level security allows the signed-in account to see.
   ========================================================================== */
(function (root) {
  var SITE = root.JFSITE || {}, X = root.JFACCESS;
  var CFG = {
    url: 'https://qixksilrbyslmomxlevi.supabase.co',
    key: 'sb_publishable_1rYLhJdxxhSwyvF6YXlpSQ_TXxvA2lv'
  };
  var C = { on: !!SITE.cloud && !!X, cfg: CFG };
  root.JFCLOUD = C;
  if (!C.on) return;
  if (!root.supabase || !root.supabase.createClient) { C.on = false; C.broken = true; return; }

  var sb = root.supabase.createClient(CFG.url, CFG.key, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false, storageKey: 'jfos-sb-auth' }
  });
  C.sb = sb;

  function offline() { return root.navigator && root.navigator.onLine === false; }
  function errCode(error) {
    if (!error) return 'system';
    if (offline() || /fetch|network|Failed to fetch|Load failed/i.test(error.message || '')) return 'network';
    if (error.status === 429) return 'too_many';
    if (error.status === 400 || error.status === 401 || /invalid/i.test(error.message || '')) return 'invalid';
    return 'system';
  }
  function log(event, target, details) { sb.rpc('log_event', { p_event: event, p_target: target || null, p_details: details || {} }).then(function () {}, function () {}); }
  C.log = log;

  // Read the signed-in account from the server and refresh the local copy.
  C.pull = function () {
    return sb.auth.getSession().then(function (r) {
      if (!r.data || !r.data.session) return { ok: false, code: 'none' };
      return Promise.all([sb.rpc('my_access'), sb.from('plants').select('id,name,short_name,active').eq('active', true).order('id')]).then(function (x) {
        var a = x[0], p = x[1];
        if (a.error) return { ok: false, code: errCode(a.error) };
        if (!a.data) return { ok: false, code: 'invalid' };
        var u = X.adoptCloud(a.data, (p && p.data) || []);
        return { ok: true, u: u, access: a.data };
      });
    }, function (e) { return { ok: false, code: errCode(e) }; });
  };

  function statusCode(a) { return a.status === 'active' ? 'locked' : a.status; }

  // Login page: email + password → local session. Same result shape as JFACCESS.login().
  C.signIn = function (email, password, o) {
    email = String(email || '').trim().toLowerCase();
    if (!email) return Promise.resolve({ ok: false, code: 'empty_user', field: 'user' });
    if (!password) return Promise.resolve({ ok: false, code: 'empty_pass', field: 'pass' });
    if (offline()) return Promise.resolve({ ok: false, code: 'network' });
    return sb.auth.signInWithPassword({ email: email, password: password }).then(function (r) {
      if (r.error) return { ok: false, code: errCode(r.error) };
      return C.pull().then(function (p) {
        if (!p.ok) { sb.auth.signOut(); return p; }
        if (!p.access.active) { log('AUTH.LOGIN_FAIL', email, { reason: p.access.status }); sb.auth.signOut(); return { ok: false, code: statusCode(p.access) }; }
        var res = X.startCloudSession(p.u, o);
        if (!res.ok) { log('AUTH.LOGIN_FAIL', email, { reason: res.code }); sb.auth.signOut(); return res; }
        log('AUTH.LOGIN_OK', email, { role: p.u.roles.map(function (x) { return x.k; }).join(',') });
        return res;
      });
    }, function (e) { return { ok: false, code: errCode(e) }; });
  };

  C.signOut = function () { try { return sb.auth.signOut().then(function () {}, function () {}); } catch (e) { return Promise.resolve(); } };
  // Every logout (button, idle timeout, forced) also ends the server session.
  var logout0 = X.logout;
  X.logout = function (why) { var r = logout0.apply(X, arguments); C.signOut(); X.dropCloud(); return r; };

  C.changePassword = function (old, p1, p2) {
    var v0 = X.validate(); if (!v0.ok) return Promise.resolve(v0);
    var v = X.validatePassword(p1, p2); if (!v.ok) return Promise.resolve(v);
    if (p1 === old) return Promise.resolve({ ok: false, code: 'pw_same', field: 'p1' });
    var email = v0.ctx.user.email;
    return sb.auth.signInWithPassword({ email: email, password: old }).then(function (r) {
      if (r.error) return { ok: false, code: errCode(r.error) === 'invalid' ? 'pw_old' : errCode(r.error), field: errCode(r.error) === 'invalid' ? 'old' : undefined };
      return sb.auth.updateUser({ password: p1 }).then(function (u) {
        if (u.error) return { ok: false, code: /weak|short|characters/i.test(u.error.message || '') ? 'pw_short' : errCode(u.error), field: /weak|short|characters/i.test(u.error.message || '') ? 'p1' : undefined };
        log('AUTH.PW_CHANGED', email, { reason: 'profile' });
        return { ok: true };
      });
    }, function (e) { return { ok: false, code: errCode(e) }; });
  };

  // Call an Edge Function with the signed-in token.
  C.fn = function (name, body) {
    return sb.functions.invoke(name, { body: body }).then(function (r) {
      if (r.error) {
        var ctx = r.error.context;
        if (ctx && typeof ctx.json === 'function') return ctx.json().then(function (j) { return { ok: false, code: j && j.code || 'system', msg: j && j.error }; }, function () { return { ok: false, code: 'system' }; });
        return { ok: false, code: errCode(r.error) };
      }
      return r.data || { ok: true };
    }, function (e) { return { ok: false, code: errCode(e) }; });
  };

  // App pages: confirm the server session now and every 5 minutes. A missing or
  // ended server session ends the local one; role / plant / permission changes
  // arrive through adoptCloud() and the app's session timer re-renders.
  C.watch = function (onEnd) {
    function check() {
      if (offline()) return;
      C.pull().then(function (r) {
        if (r.ok && r.access.active) return;
        if (r.ok || r.code === 'none' || r.code === 'invalid') { X.logout(r.ok ? statusCode(r.access) : 'revoked'); if (onEnd) onEnd(r.ok ? statusCode(r.access) : 'revoked'); }
      });
    }
    check();
    setInterval(check, 5 * 60e3);
  };
})(typeof window !== 'undefined' ? window : this);
