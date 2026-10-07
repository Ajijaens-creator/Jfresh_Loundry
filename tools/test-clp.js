#!/usr/bin/env node
/* Runs the Phase 11 client portal test cases against assets/js/jfos-clp.js, installed on the Phase 4–10 engines like the app. Exit code 1 on failure. */
global.window = undefined;
const R = '../assets/js/';
const C = require(R + 'jfos-config.js'), X = require(R + 'jfos-access.js');
const P = require(R + 'jfos-perf.js'); P.install(C, X);
const CM = require(R + 'jfos-comm.js'); CM.install(C, X, P);
const LG = require(R + 'jfos-logi.js'); LG.install(C, X, P, CM);
const PR = require(R + 'jfos-prod.js'); PR.install(C, X, P, CM, LG);
const DL = require(R + 'jfos-dlv.js'); DL.install(C, X, P, CM, LG, PR);
const F = require(R + 'jfos-fin.js'); F.install(C, X, P, CM, LG, PR, DL);
const T = require(R + 'jfos-clp-tests.js');
const K = require(R + 'jfos-clp.js'); K.install(C, X, P, CM, LG, PR, DL, F);
const res = T.run({ C, X, P, CM, LG, PR, DL, F, K });
let fail = 0;
for (const r of res) { if (!r.ok) fail++; console.log((r.ok ? 'PASS' : 'FAIL') + '  ' + r.id + '  ' + r.n[1] + (r.err ? '\n      ' + r.err : '')); }
console.log(`\n${res.length - fail}/${res.length} passed`);
process.exit(fail ? 1 : 0);
