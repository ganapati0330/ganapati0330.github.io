'use strict';
// 支城から 出陣
var C = require('./csim.js'), vm = require('vm');
var fails = 0, n = 0; function ok(c, m) { n++; if (!c) { fails++; console.log('FAIL:', m); } }
function mk() { var S = vm.runInContext('newCampaign({clan:"mori", scenario:"1523", difficulty:"normal", seed:9})', C); C.__S = S; return S; }
var R = function (src) { return vm.runInContext(src, C); };
var S = mk();
var br = 'bingon_1'; S.castles[br].owner = 'mori'; S.castles[br].units = [0, 1, 2, 3, 4].map(function () { return R('newUnit(__S, "ashigaru")'); });
var tg = R('branchTargets')(S, br);
ok(tg.some(function (t) { return t.to === 'bingon' && !t.castle; }), 'can attack the main castle of the province it sits in');
ok(tg.some(function (t) { return t.to !== 'bingon'; }), 'can attack neighbours too: ' + tg.map(function (t) { return t.to + '/' + (t.castle || ''); }).join(','));
var ids = S.castles[br].units.map(function (u) { return u.uid; });
var b = R('makeBranchBattle')(S, br, 'bingon', ids, null);
ok(b.atkClan === 'mori' && b.defClan === S.provs.bingon.owner && b.atkUnits.length === 5 && b.srcCastle === br, 'battle set up');
var env = R('battleEnv')(S, b); env.setup(15, 15, 0, 0);
ok(env && env.fromName === '比叡尾山城' && env.fromDir, 'battle env from the branch: ' + env.fromDir);
R('startBattle')(S, b);
ok(S.castles[br].units.length === 0 && S.castles[br].atk === S.turn && !R('canBranchAttack')(S, br), 'units left the branch, once per season');
// まけ：支城へ もどる
var surv = b.atkUnits.slice(0, 3).map(function (u) { return { uid: u.uid, type: u.type, hp: 5 }; });
R('applyBattle')(S, b, { winner: 'def', atkSurv: surv, defSurv: b.defUnits.slice(), atkFled: [], defFled: [] });
ok(S.castles[br].units.length === 3 && S.provs.bingon.owner !== 'mori', 'losers return to the branch: ' + S.castles[br].units.length);
// かち：本城を とる
S = mk(); S.castles[br].owner = 'mori'; S.castles[br].units = [0, 1, 2, 3].map(function () { return R('newUnit(__S, "ashigaru")'); });
ids = S.castles[br].units.map(function (u) { return u.uid; });
b = R('makeBranchBattle')(S, br, 'bingon', ids, null); R('startBattle')(S, b);
R('applyBattle')(S, b, { winner: 'atk', atkSurv: b.atkUnits.slice(), defSurv: [], atkFled: [], defFled: [] });
ok(S.provs.bingon.owner === 'mori' && S.provs.bingon.units.length >= 4, 'took the main castle');
// となりの 国の 支城を おとす：のこりは 支城へ
S = mk(); var own = 'yoshida_0'; S.castles[own].units = [0, 1, 2, 3, 4, 5, 6].map(function () { return R('newUnit(__S, "ashigaru")'); });
var t2 = R('branchTargets')(S, own).filter(function (t) { return t.castle; })[0];
if (t2) {
  ids = S.castles[own].units.map(function (u) { return u.uid; });
  b = R('makeBranchBattle')(S, own, t2.to, ids, t2.castle); R('startBattle')(S, b);
  R('applyBattle')(S, b, { winner: 'atk', atkSurv: b.atkUnits.slice(), defSurv: [], atkFled: [], defFled: [] });
  ok(S.castles[t2.castle].owner === 'mori' && S.castles[own].units.length > 0, 'branch->branch: kept ' + S.castles[t2.castle].units.length + ', back ' + S.castles[own].units.length);
} else ok(true, 'no branch target');
// 本城から 出陣し、支城から 応援
S = mk(); var tgs = R('attackTargets')(S, 'yoshida', 'mori'), T = tgs.filter(function (t) { return !t.castle; })[0] || tgs[0];
var cs = R('coSources')(S, 'yoshida', T.to, T.castle);
var own0 = cs.filter(function (c) { return c.castle && S.castles[c.castle].prov === 'yoshida'; })[0];
ok(!!own0, 'own branch can support: ' + cs.map(function (c) { return c.key; }).join(','));
if (own0) {
  var n0 = S.castles[own0.castle].units.length;
  b = R('makeBattle')(S, 'yoshida', T.to, S.provs.yoshida.units.slice(0, 2).map(function (u) { return u.uid; }), T.castle, [{ castle: own0.castle, uids: S.castles[own0.castle].units.slice(0, 2).map(function (u) { return u.uid; }) }]);
  ok(b.atkUnits.length === 4 && b.unitFrom[S.castles[own0.castle].units[0].uid] === own0.castle, 'support units join');
  R('startBattle')(S, b);
  ok(S.castles[own0.castle].units.length === n0 - 2 && S.castles[own0.castle].atk === S.turn, 'support left the branch');
  R('applyBattle')(S, b, { winner: 'def', atkSurv: b.atkUnits.slice(), defSurv: b.defUnits.slice(), atkFled: [], defFled: [] });
  ok(S.castles[own0.castle].units.length === n0, 'support came home to the branch');
  var env2 = R('battleEnv')(S, b); ok(!!env2, 'env ok');
}
// 支城から 出陣し、本城から 応援（べつの 攻め口）
S = mk(); var br2 = 'bingon_1'; S.castles[br2].owner = 'mori'; S.castles[br2].units = [0, 1, 2].map(function () { return R('newUnit(__S, "ashigaru")'); });
var T2 = R('branchTargets')(S, br2).filter(function (t) { return t.to !== 'bingon' && R('attackTargets')(S, 'yoshida', 'mori').some(function (x) { return x.to === t.to && (x.castle || null) === (t.castle || null); }); })[0];
if (T2) {
  var cs2 = R('coSources')(S, br2, T2.to, T2.castle);
  ok(cs2.some(function (c) { return c.from === 'yoshida'; }), 'main castle can support a branch sortie');
  b = R('makeBranchBattle')(S, br2, T2.to, S.castles[br2].units.map(function (u) { return u.uid; }), T2.castle, [{ from: 'yoshida', uids: [S.provs.yoshida.units[0].uid] }]);
  ok(b.fronts && b.fronts.length === 2 && b.fronts[0].castle === br2, 'two fronts');
  var e3 = R('battleEnv')(S, b); ok(e3.fronts.length === 1 && e3.fronts[0].name === '吉田', 'second front from 吉田');
} else ok(true, 'skip');
console.log(n + ' checks, ' + fails + ' failures');
