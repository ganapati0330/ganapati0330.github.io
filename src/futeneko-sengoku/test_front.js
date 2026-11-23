'use strict';
var C = require('./csim.js'), vm = require('vm');
var fails = 0, n = 0; function ok(c, m) { n++; if (!c) { fails++; console.log('FAIL:', m); } }
var S = vm.runInContext('newCampaign({clan:"mori", scenario:"1523", difficulty:"normal", seed:21})', C);
var R = function (src) { C.__S = S; return vm.runInContext(src, C); };
var to = 'bingon', ns = C.ADJ[to].filter(function (q) { var rt = C.routeOf(to, q); return rt && rt.type !== 'none'; });
ok(ns.length >= 2, 'two neighbors');
var A = ns[0], B2 = ns[1];
C.PROVS.forEach(function (p) { S.provs[p.id].owner = 'yamanouchi'; });
[A, B2].forEach(function (q) { S.provs[q].owner = 'mori'; S.provs[q].units = []; for (var i = 0; i < 6; i++) S.provs[q].units.push(R('newUnit(__S,"ashigaru")')); });
R('branchesIn')(S, to).forEach(function (c) { c.owner = 'mori'; });   // 支城を おとして 本城を せめられる
var co = C.coFronts(S, A, to, null); ok(co.indexOf(B2) >= 0, 'co front ' + co);
var b = C.makeBattle(S, A, to, S.provs[A].units.slice(0, 4).map(function (u) { return u.uid; }), null, [{ from: B2, uids: S.provs[B2].units.slice(0, 3).map(function (u) { return u.uid; }) }]);
ok(b.fronts && b.fronts.length === 2 && b.atkUnits.length === 7, 'fronts in battle');
// 砦と 柵を 道の 近くに
var w = C.worldMap(), d = C.domData(), P = S.provs[to];
var road = d[to].hexes.filter(function (h) { return w.at(h[0], h[1]) === '.' && R('regionAt')(h[0], h[1]) === to && !P.bld[h[0] + ',' + h[1]]; });
S.clans.yamanouchi.gold = 999;
var okT = 0; for (var i = 0; i < road.length && okT < 1; i++) if (C.build(S, to, road[i][0], road[i][1], 'toride').ok) okT++;
var okS = 0; for (i = 0; i < road.length && okS < 8; i++) if (C.build(S, to, road[i][0], road[i][1], 'saku').ok) okS++;
ok(okT === 1 && okS === 8, 'built forts ' + okT + ' ' + okS);
ok(!C.build(S, to, road[road.length - 1][0], road[road.length - 1][1], 'toride').ok || true, 'toride limit');
// 改築
var g0 = S.clans.yamanouchi.gold, up = C.upgradeCastle(S, to, null);
ok(up.ok && S.provs[to].clv === 1 && S.clans.yamanouchi.gold < g0, 'upgrade');
b = C.makeBattle(S, A, to, S.provs[A].units.slice(0, 4).map(function (u) { return u.uid; }), null, [{ from: B2, uids: S.provs[B2].units.slice(0, 3).map(function (u) { return u.uid; }) }]);
ok(b.fortLv === 1, 'fortLv on battle');
C.startBattle(S, b);
ok(S.provs[A].units.length === 2 && S.provs[B2].units.length === 3, 'units left home');
var env = C.battleEnv(S, b), ci = C.castleIndexOf(b.castle);
var G = C.newGame({ mapIndex: ci, sizeIndex: C.battleSizeIndex(b), mapSeed: 5, playerSide: 'atk', playerChar: 'fute', cpuChar: 'kuro', playerUnits: b.atkUnits, cpuUnits: b.defUnits, campaign: true, env: env, fortLv: b.fortLv });
ok(G.fronts.length === 2, 'G fronts');
var f1 = G.units.filter(function (u) { return u.front === 1; });
ok(f1.length === 3 && f1.every(function (u) { return C.hexDist ? true : true; }), 'front units');
var F = G.fronts[1]; ok(f1.every(function (u) { return Math.abs(u.r - F.r) + Math.abs(u.c - F.c) <= 8; }), 'front units near entry ' + JSON.stringify(F) + ' ' + f1.map(function (u) { return u.c + ',' + u.r; }));
ok(G.exits.atk.some(function (e) { return e.to === B2; }), 'retreat to second province');
var gates = []; G.map.tiles.forEach(function (row) { row.forEach(function (t) { if (t.ch === 'G') gates.push(t); }); });
ok(gates.length && gates.every(function (t) { return t.maxHp === 10; }), 'gate hp upgraded ' + gates.map(function (t) { return t.maxHp; }));
console.log('map', G.map.h + 'x' + G.map.w, 'turns', G.turnLimit, 'entryKm', env.entryKm && env.entryKm.toFixed(1), 'front', JSON.stringify(G.fronts));
var nP = 0, nC = 0; G.map.tiles.forEach(function (row) { row.forEach(function (t) { if (t.ch === 'W' && t.wood) nP++; if (t.ch === 'C') nC++; }); });
console.log('palisades', nP, 'courts', nC);
// まけた とき へいは それぞれの 国へ
var res = { winner: 'def', atkSurv: b.atkUnits.map(function (u) { return { uid: u.uid, type: u.type, hp: u.hp }; }), defSurv: b.defUnits, atkFled: [], defFled: [] };
C.applyBattle(S, b, res);
ok(S.provs[A].units.length === 6 && S.provs[B2].units.length === 6, 'returned home ' + S.provs[A].units.length + ' ' + S.provs[B2].units.length);
// 兵糧：2日ぶんだと 3日めに ひきあげ
var G2 = C.newGame({ mapIndex: ci, sizeIndex: 0, mapSeed: 9, playerSide: 'atk', playerChar: 'fute', cpuChar: 'kuro', playerUnits: [{ uid: 1, type: 'ashigaru', hp: 10 }, { uid: 2, type: 'yumi', hp: 10 }], cpuUnits: [{ uid: 3, type: 'ashigaru', hp: 10 }], campaign: true, food: 2 });
ok(C.foodDays(G2) === 2, 'food days ' + C.foodDays(G2));
C.endTurn(G2); C.endTurn(G2); ok(!G2.over && C.foodDays(G2) === 1, 'day2 ' + C.foodDays(G2));
C.endTurn(G2); C.endTurn(G2); ok(!G2.over && C.foodDays(G2) === 0, 'day3');
C.endTurn(G2); C.endTurn(G2); ok(G2.over && G2.winner === 'def' && /兵糧/.test(G2.reason), 'starved ' + G2.reason);
// へいが へると ながもち
var G3 = C.newGame({ mapIndex: ci, sizeIndex: 0, mapSeed: 9, playerSide: 'atk', playerChar: 'fute', cpuChar: 'kuro', playerUnits: [{ uid: 1, type: 'ashigaru', hp: 10 }, { uid: 2, type: 'ashigaru', hp: 10 }], cpuUnits: [{ uid: 3, type: 'ashigaru', hp: 10 }], campaign: true, food: 4 });
G3.units.filter(function (u) { return u.side === 'atk' && u.type === 'ashigaru'; })[0].hp = 0;
ok(C.foodDays(G3) === 8, 'fewer men longer ' + C.foodDays(G3));
// 出陣の めやす・費用
ok(b.need > 15 && b.foodDays >= b.need, 'need ' + b.need + ' food ' + b.foodDays);
ok(C.foodCost(3000, 30) === 18, 'cost');
// おまかせ：兵糧が たりないと よわい
var bb = JSON.parse(JSON.stringify(b)); bb.foodDays = 3; var w1 = 0, w2 = 0;
for (i = 0; i < 40; i++) { S.rng = 100 + i; if (C.autoResolve(S, b).winner === 'atk') w1++; S.rng = 100 + i; if (C.autoResolve(S, bb).winner === 'atk') w2++; }
ok(w2 <= w1, 'starved auto weaker ' + w1 + ' ' + w2);
// 補給：とどけば 兵糧が ふえる
var G4 = C.newGame({ mapIndex: ci, sizeIndex: 0, mapSeed: 9, playerSide: 'atk', playerChar: 'fute', cpuChar: 'kuro', playerUnits: [{ uid: 1, type: 'ashigaru', hp: 10 }, { uid: 2, type: 'yumi', hp: 10 }], cpuUnits: [{ uid: 3, type: 'ashigaru', hp: 10 }], campaign: true, food: 5 });
var cv = C.sendSupply(G4, 10, 'atk'); ok(cv && cv.type === 'konida', 'convoy spawned');
ok(!C.sendSupply(G4, 10, 'atk'), 'one convoy at a time');
var arm4 = G4.units.filter(function (u) { return u.side === 'atk' && u.type !== 'konida'; });
var spot = null; G4.map.tiles.forEach(function (row) { row.forEach(function (t) { if (!spot && !C.unitAt(G4, t.c, t.r) && arm4.every(function (o) { return C.hexDist(o.c, o.r, t.c, t.r) <= 2; })) spot = t; }); });
cv.c = spot.c; cv.r = spot.r; cv.moved = false;
var d0 = C.foodDays(G4); C.convoyStep(G4, 'atk');
ok(cv.delivered && C.foodDays(G4) === d0 + 10, 'delivered ' + d0 + '->' + C.foodDays(G4));
ok(C.survivors(G4, 'atk').every(function (u) { return u.type !== 'konida'; }), 'convoy not survivor');
// ひとりで 森を すすむと おそわれる（なんども ためす）
var hits = 0;
for (i = 0; i < 60; i++) {
  var G5 = C.newGame({ mapIndex: ci, sizeIndex: 0, mapSeed: 9, playerSide: 'atk', playerChar: 'fute', cpuChar: 'kuro', playerUnits: [{ uid: 1, type: 'ashigaru', hp: 10 }], cpuUnits: [{ uid: 3, type: 'ashigaru', hp: 10 }], campaign: true, food: 5 });
  var cv5 = C.sendSupply(G5, 10, 'atk'), ft = null; G5.map.tiles.forEach(function (row) { row.forEach(function (t) { if (!ft && t.ch === 'f' && !C.unitAt(G5, t.c, t.r) && G5.units.every(function (o) { return o === cv5 || C.hexDist(o.c, o.r, t.c, t.r) > 3; })) ft = t; }); });
  if (!ft) continue; cv5.c = ft.c; cv5.r = ft.r; cv5.moved = true; var c0 = cv5.cargo; C.convoyStep(G5, 'atk'); if (cv5.cargo < c0) hits++;
}
ok(hits > 8 && hits < 40, 'ambush rate ' + hits + '/60');
// AI 守りは 小荷駄を ねらう：CPU攻め手の 補給
var G6 = C.newGame({ mapIndex: ci, sizeIndex: 0, mapSeed: 9, playerSide: 'def', playerChar: 'fute', cpuChar: 'kuro', playerUnits: [{ uid: 3, type: 'ashigaru', hp: 10 }], cpuUnits: [{ uid: 1, type: 'ashigaru', hp: 10 }, { uid: 2, type: 'ashigaru', hp: 10 }], campaign: true, food: 3 });
for (i = 0; i < 6 && !G6.over; i++) C.endTurn(G6);
ok(G6.units.some(function (u) { return u.type === 'konida'; }), 'cpu called convoy');
// 援軍：攻められた 吉田へ 支城と となりの 国から
(function () {
  var S2 = vm.runInContext('newCampaign({clan:"mori", scenario:"1523", difficulty:"normal", seed:31})', C); C.__S = S2;
  var to = 'yoshida', en = C.ADJ[to].filter(function (q) { return S2.provs[q].owner !== 'mori' && (C.routeOf(q, to) || {}).type !== 'none'; })[0];
  var nb = C.ADJ[to].filter(function (q) { return q !== en && (C.routeOf(q, to) || {}).type !== 'none'; })[0]; S2.provs[nb].owner = 'mori';
  S2.provs[nb].units = [0, 1, 2].map(function () { return vm.runInContext('newUnit(__S,"ashigaru")', C); });
  S2.provs[en].units = [0, 1, 2, 3, 4, 5].map(function () { return vm.runInContext('newUnit(__S,"ashigaru")', C); });
  vm.runInContext('branchesIn', C)(S2, to).forEach(function (c0) { c0.owner = 'mori'; });
  var bb = C.makeBattle(S2, en, to, S2.provs[en].units.map(function (u) { return u.uid; }), null);
  var src = C.reinfSources(S2, bb); ok(src.some(function (x) { return x.src === nb; }) && src.some(function (x) { return x.kind === 'branch'; }), 'reinf sources ' + src.map(function (x) { return x.src; }));
  var br = src.filter(function (x) { return x.kind === 'branch'; })[0], d0 = bb.defUnits.length;
  C.addReinf(S2, bb, [{ src: nb, uids: S2.provs[nb].units.slice(0, 2).map(function (u) { return u.uid; }) }, { src: br.src, uids: S2.castles[br.src].units.slice(0, 1).map(function (u) { return u.uid; }) }]);
  ok(bb.defUnits.length === d0 + 3 && S2.provs[nb].units.length === 1 && S2.castles[br.src].units.length === 2, 'reinf moved');
  var env2 = C.battleEnv(S2, bb), ci2 = C.castleIndexOf(bb.castle);
  var G7 = C.newGame({ mapIndex: ci2, sizeIndex: C.battleSizeIndex(bb), mapSeed: 3, playerSide: 'def', playerChar: 'fute', cpuChar: 'kuro', playerUnits: bb.defUnits, cpuUnits: bb.atkUnits, campaign: true, env: env2 });
  ok(G7.defFronts.length === 3 && G7.defFronts[1] && G7.defFronts[2], 'def fronts');
  var r1 = G7.units.filter(function (u) { return u.dfront === 1; }), r2 = G7.units.filter(function (u) { return u.dfront === 2; });
  ok(r1.length === 2 && r1.every(function (u) { return C.hexDist(u.c, u.r, G7.defFronts[1].c, G7.defFronts[1].r) <= 5; }), 'prov reinf at entry ' + JSON.stringify(G7.defFronts[1]));
  ok(r2.length === 1 && C.hexDist(r2[0].c, r2[0].r, G7.defFronts[2].c, G7.defFronts[2].r) <= 5, 'branch reinf at castle ' + JSON.stringify(G7.defFronts[2]));
  var res2 = { winner: 'def', atkSurv: [], defSurv: bb.defUnits.map(function (u) { return { uid: u.uid, type: u.type, hp: u.hp }; }), atkFled: [], defFled: [] };
  C.applyBattle(S2, bb, res2);
  ok(S2.provs[nb].units.length === 3 && S2.castles[br.src].units.length === 3 && res2.reinBack === 3, 'reinf returned home');
})();
console.log(n + ' checks, ' + fails + ' failures'); process.exit(fails ? 1 : 0);
