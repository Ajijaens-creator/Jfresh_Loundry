#!/usr/bin/env node
/* Runs the Phase 11 System Admin & Governance test cases against assets/js/jfos-sys.js, installed on the Phase 4–10 engines like the app. Exit code 1 on failure. */
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
// The client portal (JFCLP) is optional here: load it only when it exists.
let CLP = null;
if (fs.existsSync(path.join(__dirname, R, 'jfos-clp.js'))) {
  try { CLP = require(R + 'jfos-clp.js'); if (CLP && CLP.install) CLP.install(C, X, P, CM, LG, PR, DL, F); } catch (e) { console.log('note: jfos-clp.js not loaded (' + e.message + ')'); CLP = null; }
}
const S = require(R + 'jfos-sys.js'); S.install(C, X, P, CM, LG, PR, DL, F, CLP);
const T = require(R + 'jfos-sys-tests.js');
const res = T.run(S, C, X, F);
let fail = 0;
for (const r of res) { if (!r.ok) fail++; console.log((r.ok ? 'PASS' : 'FAIL') + '  ' + r.id + '  ' + r.n[1] + (r.err ? '\n      ' + r.err : '')); }
console.log(`\n${res.length - fail}/${res.length} passed`);
process.exit(fail ? 1 : 0);
