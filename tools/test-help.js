#!/usr/bin/env node
/* Runs the Phase 12 Smart Help & Guided Learning test cases against assets/js/jfos-help.js, installed on the Phase 4–11 engines like the app
   (same order as app/index.html: … JFCLP → JFSYS → JFHELP → JFIMP → JFGO, then app.js registers the Phase 4 screens). Exit code 1 on failure. */
global.window = undefined;
const fs = require('fs'), path = require('path');
const R = '../assets/js/';
const C = require(R + 'jfos-config.js'), X = require(R + 'jfos-access.js');
const P = require(R + 'jfos-perf.js'); P.install(C, X);
const CM = require(R + 'jfos-comm.js'); CM.install(C, X, P);
const LG = require(R + 'jfos-logi.js'); LG.install(C, X, P, CM);
const PR = require(R + 'jfos-prod.js'); PR.install(C, X, P, CM, LG);
const DL = require(R + 'jfos-dlv.js'); DL.install(C, X, P, CM, LG, PR);
const F = require(R + 'jfos-fin.js'); F.install(C, X, P, CM, LG, PR, DL);
function opt(file, fn) {
  if (!fs.existsSync(path.join(__dirname, R, file))) return null;
  try { const m = require(R + file); if (m && m.install) fn(m); return m; } catch (e) { console.log('note: ' + file + ' not loaded (' + e.message + ')'); return null; }
}
const CLP = opt('jfos-clp.js', (m) => m.install(C, X, P, CM, LG, PR, DL, F));
const SYS = opt('jfos-sys.js', (m) => m.install(C, X, P, CM, LG, PR, DL, F, CLP));
const H = require(R + 'jfos-help.js'); H.install(C, X, P, CM, LG, PR, DL, F, CLP, SYS);
// Phase 12 sibling engines install after JFHELP (optional: they may not exist yet).
const IMP = opt('jfos-imp.js', (m) => m.install(C, X, P, CM, LG, PR, DL, F, CLP, SYS));
opt('jfos-go.js', (m) => m.install(C, X, P, CM, LG, PR, DL, F, CLP, SYS, IMP));
X.registerScreens(C);   // what app/app.js does at start
// Real V renderers of the app (help content must point at screens that exist).
const appDir = path.join(__dirname, '../app');
const src = fs.readdirSync(appDir).filter((f) => /^screens-.*\.js$/.test(f)).map((f) => fs.readFileSync(path.join(appDir, f), 'utf8')).join('\n');
const vids = [...new Set([...src.matchAll(/V\['([A-Z0-9-]+)'\]\s*=/g)].map((m) => m[1]))];
const T = require(R + 'jfos-help-tests.js');
const res = T.run(H, C, X, { SYS, PR, FN: F, DL, LG, CM, CLP, vids });
let fail = 0;
for (const r of res) { if (!r.ok) fail++; console.log((r.ok ? 'PASS' : 'FAIL') + '  ' + r.id + '  ' + r.n[1] + (r.err ? '\n      ' + r.err : '')); }
console.log(`\n${res.length - fail}/${res.length} passed`);
process.exit(fail ? 1 : 0);
