/* ==========================================================================
   JFRESH OS — site environment (which copy of the app is this?)
   One codebase serves every copy. The hostname decides the environment:
     beta.jfreshlaundry.app  -> 'beta'    (demo data + switch user, for testers)
     jfreshlaundry.app / www -> 'live'    (real use)
     *.vercel.app            -> 'preview' (automatic preview of a branch/PR)
     anything else           -> 'local'

   Two modes:
     demo  · demo accounts (password jfresh123) and demo data in this browser
     asli  · real accounts (Supabase Auth) and, step by step, real data on the server

   beta is always demo. live switches to asli for everyone only when LIVE_CLOUD
   is true: flip it only with the owner's explicit OK, after the real login and
   data path has been tested. Until then a tester can open the real mode on any
   copy except beta with ?mode=asli (back with ?mode=demo); the choice is kept
   in this browser.
   ========================================================================== */
(function (root) {
  var LIVE_CLOUD = false;
  var host = (root.location && root.location.hostname || '').toLowerCase();
  var env = host === 'beta.jfreshlaundry.app' ? 'beta'
    : (host === 'jfreshlaundry.app' || host === 'www.jfreshlaundry.app') ? 'live'
    : /\.vercel\.app$/.test(host) ? 'preview'
    : 'local';
  var KEY = 'jfos-site-mode', pick = null;
  try {
    var m = /[?&]mode=(asli|demo)\b/.exec(root.location && root.location.search || '');
    if (m && env !== 'beta') root.localStorage.setItem(KEY, m[1]);
    pick = root.localStorage.getItem(KEY);
  } catch (e) {}
  var cloud = env === 'beta' ? false : pick === 'asli' ? true : pick === 'demo' ? false : (env === 'live' && LIVE_CLOUD);
  var S = { env: env, host: host, cloud: cloud, demo: !cloud, mode: cloud ? 'asli' : 'demo', trial: cloud && !(env === 'live' && LIVE_CLOUD) };
  root.JFSITE = S;

  // Testers must always see which copy and which mode they are on.
  var text = env === 'beta' ? 'BETA · data demo, bukan data asli'
    : S.trial ? 'UJI MODE ASLI · akun asli' + (env === 'preview' ? ' · preview' : '')
    : env === 'preview' ? 'PREVIEW · versi uji'
    : null;
  if (!text) return;
  function ribbon() {
    if (document.getElementById('jfsite-ribbon')) return;
    var b = document.createElement('div');
    b.id = 'jfsite-ribbon';
    b.setAttribute('role', 'note');
    b.textContent = text;
    var st = document.createElement('style');
    st.textContent = '#jfsite-ribbon{bottom:12px}@media (max-width:699px){#jfsite-ribbon{bottom:auto!important;top:4px;left:50%!important;transform:translateX(-50%);white-space:nowrap;font-size:11px!important;padding:3px 10px!important}}';
    document.head.appendChild(st);
    b.style.cssText = 'position:fixed;left:12px;z-index:99999;padding:6px 12px;border-radius:999px;' +
      'background:' + (S.trial ? '#0754A6;color:#fff' : '#F59E0B;color:#111827') + ';font:600 12px/1.2 Inter,system-ui,sans-serif;box-shadow:0 2px 8px rgba(0,0,0,.2);pointer-events:none';
    document.body.appendChild(b);
    try { var tag = env === 'beta' ? '[BETA] ' : S.trial ? '[UJI] ' : '[PREVIEW] '; document.title = tag + document.title.replace(/^\[(BETA|PREVIEW|UJI)\] /, ''); } catch (e) {}
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ribbon); else ribbon();
})(typeof window !== 'undefined' ? window : this);
