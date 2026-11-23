'use strict';
// 支城を おとした あとの 兵の ゆくえ
var C = require('./csim.js'), vm = require('vm');
var fails = 0, n = 0; function ok(c, m) { n++; if (!c) { fails++; console.log('FAIL:', m); } }
var S = vm.runInContext('newCampaign({clan:"oura", scenario:"1571", difficulty:"normal", seed:7})', C);
var R = function (src) { C.__S = S; return vm.runInContext(src, C); };
var cid = Object.keys(S.castles).filter(function (k) { return S.castles[k].prov === 'ishikawa'; })[0];
S.provs.ishikawa.owner = 'ishikawa' in S.clans ? 'ishikawa' : S.provs.ishikawa.owner; S.castles[cid].owner = S.provs.ishikawa.owner;
var A = S.provs.oura; A.owner = 'oura';
var army = []; for (var i = 0; i < 9; i++) army.push(R('newUnit(__S, "ashigaru")'));
A.units = [];
var b = { from: 'oura', to: 'ishikawa', castleId: cid, castleName: 'X', atkClan: 'oura', defClan: S.castles[cid].owner, atkUnits: army, defUnits: S.castles[cid].units.slice(), relief: [] };
army.forEach(function (u, i) { u.hp = 10 - (i % 4); });
var res = { winner: 'atk', atkSurv: army.slice(), defSurv: [], atkFled: [], defFled: [] };
R('applyBattle')(S, b, res);
// たおした てきの 降参兵は 出陣した 国へ くわわる（その ぶんは のぞいて しらべる）
var kjN = A.units.filter(function (u) { return army.indexOf(u) < 0; }).length; A.units = A.units.filter(function (u) { return army.indexOf(u) >= 0; });
ok(kjN >= 1 && res.killMen > 0, 'defeated enemies join: ' + kjN);
var C0 = S.castles[cid];
ok(C0.owner === 'oura', 'captured');
ok(C0.units.length === 3, 'keeps 3 in castle: ' + C0.units.length);
ok(A.units.length === 6, '6 back home: ' + A.units.length);
ok(res.keptN === 3 && res.backN === 6, 'result counts');
ok(Math.max.apply(null, C0.units.map(function (u) { return u.hp; })) <= Math.min.apply(null, A.units.map(function (u) { return u.hp; })), 'weak ones garrison');
var links = R('castleLinks')(S, cid);
ok(links.indexOf('oura') >= 0, 'oura linked: ' + links);
var r = R('garrison')(S, cid, [], C0.units.map(function (u) { return u.uid; }).slice(0, 2), 'oura');
ok(r.ok && C0.units.length === 1 && A.units.length === 8, 'move out to oura');
r = R('garrison')(S, cid, [A.units[0].uid], [], 'oura'); ok(r.ok && C0.units.length === 2, 'move in from oura');
ok(!R('garrison')(S, cid, [], [C0.units[0].uid], 'hei').ok, 'non-adjacent refused');
// 国が 満杯なら 支城に のこる（8たいまで）
A.units = []; for (i = 0; i < R('PROV_CAP') - 2; i++) A.units.push(R('newUnit(__S, "yumi")'));
C0.owner = b.defClan; C0.units = [];
var army2 = []; for (i = 0; i < 9; i++) army2.push(R('newUnit(__S, "ashigaru")'));
var res2 = { winner: 'atk', atkSurv: army2, defSurv: [], atkFled: [], defFled: [] };
R('applyBattle')(S, Object.assign({}, b, { atkUnits: army2 }), res2);
ok(C0.units.length === 7 && A.units.length === R('PROV_CAP'), 'overflow stays: ' + C0.units.length + ' / ' + A.units.length);
// 配置の やりなおし
(function () {
  var S2 = vm.runInContext('newCampaign({clan:"oura", scenario:"1571", difficulty:"normal", seed:9})', C); C.__S = S2;
  var id = Object.keys(S2.castles).filter(function (k) { return S2.castles[k].prov === 'ishikawa'; })[0], A2 = S2.provs.oura;
  A2.units = []; var arm = []; for (var i = 0; i < 8; i++) arm.push(vm.runInContext('newUnit(__S, "' + (i < 5 ? 'ashigaru' : 'yumi') + '")', C));
  var b2 = { from: 'oura', to: 'ishikawa', castleId: id, castleName: 'X', atkClan: 'oura', defClan: S2.castles[id].owner, atkUnits: arm, defUnits: [], relief: [] };
  var r2 = { winner: 'atk', atkSurv: arm.slice(), defSurv: [], atkFled: [], defFled: [] };
  vm.runInContext('applyBattle', C)(S2, b2, r2);
  ok(r2.backUids.length === 5 && S2.castles[id].units.length === 3, 'back uids');
  var rd = vm.runInContext('redeploy', C);
  var keep = arm.slice(0, 1).map(function (u) { return u.uid; });
  ok(rd(S2, id, 'oura', r2.backUids, keep).ok && S2.castles[id].units.length === 1 && A2.units.length === 7, 'keep 1');
  ok(!rd(S2, id, 'oura', [], []).ok, 'must keep 1');
  var all = A2.units.concat(S2.castles[id].units).map(function (u) { return u.uid; });
  ok(rd(S2, id, 'oura', A2.units.map(function (u) { return u.uid; }), all).ok && S2.castles[id].units.length === 8 && A2.units.length === 0, 'keep all 8');
})();
console.log(n + ' checks, ' + fails + ' failures'); process.exit(fails ? 1 : 0);
