'use strict';
var C = require('./csim.js'), vm = require('vm');
var fails = 0, n = 0; function ok(c, m) { n++; if (!c) { fails++; console.log('FAIL:', m); } }
function mk() { var S = vm.runInContext('newCampaign({clan:"mori", scenario:"1523", difficulty:"normal", seed:4})', C); C.__S = S; return S; }
var R = function (src) { return vm.runInContext(src, C); };
var S = mk(), to = R('ADJ').yoshida.filter(function (q) { return S.provs[q].owner !== 'mori'; })[0];
var b = R('makeBattle')(S, 'yoshida', to, S.provs.yoshida.units.map(function (u) { return u.uid; }), null);
var d0 = R('defStrength')(S, to);
R('startBattle')(S, b); R('applyBattle')(S, b, { winner: 'atk', atkSurv: b.atkUnits.slice(), defSurv: [], atkFled: [], defFled: [] });
ok(S.provs[to].owner === 'mori' && S.provs[to].ruin === 1, 'captured castle is ruined');
ok(R('castleArtOf')(S, to, null) === 'castle_ruin', 'ruin art');
S.turn++; ok(R('castleArtOf')(S, to, null) === 'castle_ruin', 'still ruined next season');
ok(!R('canUpgrade')(S, to, null, 'mori').ok, 'cannot upgrade while ruined');
var g0 = S.clans.mori.gold, rc = R('repairCost')(S, to, null), r = R('repairCastle')(S, to, null);
ok(r.ok && !S.provs[to].ruin && S.clans.mori.gold === g0 - rc, 'repaired for ' + rc);
ok(R('castleArtOf')(S, to, null) !== 'castle_ruin', 'normal art again');
// こわれた 城は 守りが よわい
S.provs[to].ruin = 1; var d1 = R('defStrength')(S, to); S.provs[to].ruin = 0; var d2 = R('defStrength')(S, to);
ok(d1 < d2, 'ruined weaker ' + d1.toFixed(1) + ' < ' + d2.toFixed(1));
// 合戦：石垣が よわい
S.provs[to].ruin = 1; var b2 = R('makeBattle')(S, to, 'yoshida', [], null); ok(b2.ruin === 0, 'target yoshida not ruined');
S.provs.yoshida.ruin = 1; b2 = R('makeBattle')(S, to, 'yoshida', [], null); ok(b2.ruin === 1, 'battle knows ruin');
// CPU は なおす
S = mk(); var cpuP = Object.keys(S.provs).filter(function (k) { return S.provs[k].owner && S.provs[k].owner !== 'mori' && S.provs[k].owner !== 'ikki'; })[0];
S.provs[cpuP].ruin = 1; S.clans[S.provs[cpuP].owner].gold = 999; R('seasonStart')(S);
ok(!S.provs[cpuP].ruin, 'cpu repairs');
console.log(n + ' checks, ' + fails + ' failures');
