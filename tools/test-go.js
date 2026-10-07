#!/usr/bin/env node
/* Runs the Phase 12 Engine B (JFGO: migration, UAT, cutover, go-live, improvement) test cases against assets/js/jfos-go.js,
   installed on the Phase 4–11 engines (and JFHELP / JFIMP when present) in the same order as app/index.html. Exit code 1 on failure. */
global.window = undefined;
const fs = require('fs'), path = require('path');
const R = '../assets/js/';
const has = f => fs.existsSync(path.join(__dirname, R, f));
const C = require(R + 'jfos-config.js'), X = require(R + 'jfos-access.js');
const P = require(R + 'jfos-perf.js'); P.install(C, X);
const CM = require(R + 'jfos-comm.js'); CM.install(C, X, P);
const LG = require(R + 'jfos-logi.js'); LG.install(C, X, P, CM);
const PR = require(R + 'jfos-prod.js'); PR.install(C, X, P, CM, LG);
const DL = require(R + 'jfos-dlv.js'); DL.install(C, X, P, CM, LG, PR);
const F = require(R + 'jfos-fin.js'); F.install(C, X, P, CM, LG, PR, DL);
function opt(file, name, fn) {
  if (!has(file)) return null;
  try { const m = require(R + file); if (m && m.install) fn(m); global[name] = m; return m; } catch (e) { console.log('note: ' + file + ' not loaded (' + e.message + ')'); return null; }
}
const CLP = opt('jfos-clp.js', 'JFCLP', m => m.install(C, X, P, CM, LG, PR, DL, F));
const S = opt('jfos-sys.js', 'JFSYS', m => m.install(C, X, P, CM, LG, PR, DL, F, CLP));
const H = opt('jfos-help.js', 'JFHELP', m => m.install(C, X, P, CM, LG, PR, DL, F, CLP, S));
const I = opt('jfos-imp.js', 'JFIMP', m => m.install(C, X, P, CM, LG, PR, DL, F, CLP, S));
const G = require(R + 'jfos-go.js'); G.install(C, X, P, CM, LG, PR, DL, F, CLP, S, I); global.JFGO = G;
const T = require(R + 'jfos-go-tests.js');
const res = T.run(G, C, X, F, { CM, LG, PR, DL, CLP, S, H, I });
let fail = 0;
for (const r of res) { if (!r.ok) fail++; console.log((r.ok ? 'PASS' : 'FAIL') + '  ' + r.id + '  ' + r.n[1] + (r.err ? '\n      ' + r.err : '')); }
console.log(`\n${res.length - fail}/${res.length} passed`);
process.exit(fail ? 1 : 0);
