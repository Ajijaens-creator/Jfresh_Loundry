#!/usr/bin/env node
/* Runs the Phase 4 access test cases against assets/js/jfos-access.js. Exit code 1 on failure. */
global.window = undefined;
const C = require('../assets/js/jfos-config.js');
global.JFOS = C;
const X = require('../assets/js/jfos-access.js');
X.registerScreens(C);
const T = require('../assets/js/jfos-access-tests.js');
const res = T.run(X);
let fail = 0;
for (const r of res) { if (!r.ok) fail++; console.log((r.ok ? 'PASS' : 'FAIL') + '  ' + r.id + '  ' + r.n[1] + (r.err ? '\n      ' + r.err : '')); }
console.log(`\n${res.length - fail}/${res.length} passed`);
process.exit(fail ? 1 : 0);
