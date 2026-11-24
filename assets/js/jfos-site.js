/* ==========================================================================
   JFRESH OS — site environment (which copy of the app is this?)
   One codebase serves every copy. The hostname decides the environment:
     beta.jfreshlaundry.app  -> 'beta'    (demo data + switch user, for testers)
     jfreshlaundry.app / www -> 'live'    (real use, later without demo data)
     *.vercel.app            -> 'preview' (automatic preview of a branch/PR)
     anything else           -> 'local'
   LIVE_DEMO stays true until the owner approves turning demo data off on the
   live domain. Flip it to false only with that approval.
   ========================================================================== */
(function (root) {
  var LIVE_DEMO = true;
  var host = (root.location && root.location.hostname || '').toLowerCase();
  var env = host === 'beta.jfreshlaundry.app' ? 'beta'
    : (host === 'jfreshlaundry.app' || host === 'www.jfreshlaundry.app') ? 'live'
    : /\.vercel\.app$/.test(host) ? 'preview'
    : 'local';
  var S = { env: env, host: host, demo: env === 'live' ? LIVE_DEMO : true };
  root.JFSITE = S;

  // Testers must always see that they are on the beta (or a preview) copy.
  if (env !== 'beta' && env !== 'preview') return;
  function ribbon() {
    if (document.getElementById('jfsite-ribbon')) return;
    var b = document.createElement('div');
    b.id = 'jfsite-ribbon';
    b.setAttribute('role', 'note');
    b.textContent = env === 'beta' ? 'BETA · data demo, bukan data asli' : 'PREVIEW · versi uji';
    b.style.cssText = 'position:fixed;left:12px;bottom:12px;z-index:99999;padding:6px 12px;border-radius:999px;' +
      'background:#F59E0B;color:#111827;font:600 12px/1.2 Inter,system-ui,sans-serif;box-shadow:0 2px 8px rgba(0,0,0,.2);pointer-events:none';
    document.body.appendChild(b);
    try { document.title = (env === 'beta' ? '[BETA] ' : '[PREVIEW] ') + document.title.replace(/^\[(BETA|PREVIEW)\] /, ''); } catch (e) {}
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ribbon); else ribbon();
})(typeof window !== 'undefined' ? window : this);
