#!/usr/bin/env node
/* Runs the Phase 7 order, pickup, delivery & live logistics test cases against assets/js/jfos-logi.js. Exit code 1 on failure. */
global.window = undefined;
const M = require('../assets/js/jfos-logi.js');
const T = require('../assets/js/jfos-logi-tests.js');
const res = T.run(M);
let fail = 0;
for (const r of res) { if (!r.ok) fail++; console.log((r.ok ? 'PASS' : 'FAIL') + '  ' + r.id + '  ' + r.n[1] + (r.err ? '\n      ' + r.err : '')); }
console.log(`\n${res.length - fail}/${res.length} passed`);
process.exit(fail ? 1 : 0);
