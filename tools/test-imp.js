#!/usr/bin/env node
/* Runs the Phase 12 Engine A (JFIMP: build, One Data, QA, security validation, reliability) test cases against assets/js/jfos-imp.js,
   installed on the Phase 4–11 engines like the app. Exit code 1 on failure. */
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
const CLP = require(R + 'jfos-clp.js'); CLP.install(C, X, P, CM, LG, PR, DL, F);
const S = require(R + 'jfos-sys.js'); S.install(C, X, P, CM, LG, PR, DL, F, CLP);
const I = require(R + 'jfos-imp.js'); I.install(C, X, P, CM, LG, PR, DL, F, CLP, S);
const T = require(R + 'jfos-imp-tests.js');
// Regression manifest check (§24): the real case count of every earlier suite + this one.
const counts = [];
['access', 'comm', 'logi', 'perf', 'prod', 'dlv', 'fin', 'clp', 'sys'].forEach((k) => {
  const f = path.join(__dirname, R, 'jfos-' + k + '-tests.js');
  if (fs.existsSync(f)) { try { counts.push([k, require(f).cases.length]); } catch (e) { console.log('note: ' + k + ' tests not loaded (' + e.message + ')'); } }
});
counts.push(['imp', T.cases.length]);
const res = T.run({ C, X, P, CM, LG, PR, DL, F, CLP, S, I, counts });
let fail = 0;
for (const r of res) { if (!r.ok) fail++; console.log((r.ok ? 'PASS' : 'FAIL') + '  ' + r.id + '  ' + r.n[1] + (r.err ? '\n      ' + r.err : '')); }
console.log(`\n${res.length - fail}/${res.length} passed`);
process.exit(fail ? 1 : 0);
