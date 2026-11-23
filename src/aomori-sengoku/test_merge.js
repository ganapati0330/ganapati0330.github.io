'use strict';
var C = require('./csim.js'), vm = require('vm');
var fails = 0, n = 0; function ok(c, m) { n++; if (!c) { fails++; console.log('FAIL:', m); } }
var R = function (src) { return vm.runInContext(src, C); };
var L = [{ uid: 1, type: 'ashigaru', hp: 3 }, { uid: 2, type: 'ashigaru', hp: 4.5 }, { uid: 3, type: 'yumi', hp: 2 }, { uid: 4, type: 'ashigaru', hp: 8 }, { uid: 5, type: 'yumi', hp: 10 }];
ok(R('canMergeUnits')(L), 'mergeable');
var g = R('mergeUnits')(L);
var ash = L.filter(function (u) { return u.type === 'ashigaru'; }), yu = L.filter(function (u) { return u.type === 'yumi'; });
ok(g === 1 && ash.length === 2 && yu.length === 2, 'merged: ' + JSON.stringify(L));
ok(Math.abs(ash.reduce(function (s, u) { return s + u.hp; }, 0) - 15.5) < 1e-6 && ash[0].hp === 10, 'men kept');
ok(!R('canMergeUnits')(L), 'nothing more to merge');
// lostByType は 合計で
var init = [{ uid: 1, type: 'ashigaru', hp: 4 }, { uid: 2, type: 'ashigaru', hp: 5 }];
var by = R('lostByType')(init, [{ uid: 2, type: 'ashigaru', hp: 9 }], []);
ok(!by.ashigaru, 'merge is not a loss: ' + JSON.stringify(by));
// 合戦の 合流
var G = { units: [], map: { w: 10, h: 10, tiles: [] } };
var a = { side: 'atk', type: 'ashigaru', hp: 3, c: 2, r: 2 }, b = { side: 'atk', type: 'ashigaru', hp: 6, c: 3, r: 2 }, e = { side: 'def', type: 'ashigaru', hp: 2, c: 2, r: 3 };
G.units = [a, b, e];
var mt = R('mergeTargets')(G, a);
ok(mt.length === 1 && mt[0] === b, 'adjacent same side same type');
R('doMerge')(G, a, b);
ok(b.hp === 9 && G.units.indexOf(a) < 0, 'merged into b, a removed');
var c2 = { side: 'atk', type: 'ashigaru', hp: 5, c: 4, r: 2 }; G.units.push(c2);
R('doMerge')(G, c2, b); ok(b.hp === 10 && c2.hp === 4 && G.units.indexOf(c2) >= 0 && c2.acted, 'partial merge keeps the rest');
console.log(n + ' checks, ' + fails + ' failures');
