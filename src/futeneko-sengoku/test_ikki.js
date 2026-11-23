'use strict';
var C = require('./csim.js'), vm = require('vm');
var fails = 0, n = 0; function ok(c, m) { n++; if (!c) { fails++; console.log('FAIL:', m); } }
var S = vm.runInContext('newCampaign({clan:"mori", scenario:"1523", difficulty:"normal", seed:11})', C);
var R = function (src) { C.__S = S; return vm.runInContext(src, C); };
var P = S.provs.yoshida;
ok(C.taxOf(P) === 0.5, 'default tax');
ok(C.setTax(S, 'yoshida', 0.9).ok && P.tax === 0.7, 'clamp max');
ok(C.setTax(S, 'yoshida', 0.1).ok && P.tax === 0.3, 'clamp min');
ok(!C.setTax(S, 'izumo', 0.6).ok, 'not own');
P.tax = 0.5; S.season = 2; var r5 = R('provRevenue')(S, 'yoshida'); P.tax = 0.7; var r7 = R('provRevenue')(S, 'yoshida'); ok(r7 > r5 * 1.2, 'heavy tax more income ' + r5 + ' ' + r7);
ok(C.fumanDelta(S, 'yoshida') > 5, 'heavy tax raises unrest'); P.tax = 0.3; ok(C.fumanDelta(S, 'yoshida') < -5, 'light tax lowers unrest');
// しずめる
P.tax = 0.5; P.fuman = 100; var u0 = P.units.length; P.units = P.units.concat([0, 1, 2, 3, 4, 5, 6, 7].map(function () { return R('newUnit(__S,"ashigaru")'); }));
var a = C.ikkiRise(S, 'yoshida'); ok(a.put && P.owner === 'mori' && P.fuman === 40, 'suppressed');
// うばわれる
var B = S.provs.bizen, bo = B.owner; B.units = []; B.fuman = 100; var b = C.ikkiRise(S, 'bizen');
ok(b.taken && B.owner === 'ikki' && B.units.length >= 3, 'taken by ikki');
ok(R('branchesIn')(S, 'bizen').every(function (c) { return c.owner !== bo; }), 'branches flipped');
// 一揆衆は 調略できない・CPUで うごかない・せめられる
ok(R('schemeOdds')(S, R('ADJ').bizen.filter(function (q) { return S.provs[q].owner !== 'ikki'; })[0], 'bizen', 'submit') === 0, 'no scheme vs ikki');
var nb = R('ADJ').bizen[0]; S.provs[nb].owner = 'mori'; S.provs[nb].units = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(function () { return R('newUnit(__S,"kiba")'); });
var tg = R('attackTargets')(S, nb, 'mori'); ok(tg.some(function (t) { return t.to === 'bizen'; }), 'can target ikki land: ' + JSON.stringify(tg.map(function (t) { return t.to + ':' + t.castle; })));
// 季節を まわしても こわれない
for (var i = 0; i < 12; i++) { R('cpuBegin')(S); var rr; while ((rr = R('cpuNext')(S)).type === 'battle') R('applyBattle')(S, rr.battle, R('autoResolve')(S, rr.battle)); if (S.over) break; R('seasonEnd')(S); }
ok(true, 'seasons ran');
console.log(n + ' checks, ' + fails + ' failures'); process.exit(fails ? 1 : 0);
