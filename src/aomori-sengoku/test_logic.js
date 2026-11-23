'use strict';
var g = require('./game.js');
var fails = 0, n = 0;
function ok(cond, msg) { n++; if (!cond) { fails++; console.log('FAIL:', msg); } }

// 1. マップ整合性・城の密閉性
g.CASTLES.forEach(function (m0, mi) { m0.t.forEach(function (row) { ok(row.length === m0.t[0].length, 'template width ' + m0.id); }); });
var COMBOS = [];
g.CASTLES.forEach(function (c, mi) { for (var si = 0; si < 3; si++) for (var sd = 1; sd <= 6; sd++) COMBOS.push([mi, si, sd * 7919 + mi * 31 + si]); });
COMBOS.forEach(function (cb) {
  var mi = cb[0], si = cb[1];
  var m = { id: g.CASTLES[mi].id + '/' + si + '/' + cb[2] };
  var G = g.newGame({ mapIndex: mi, sizeIndex: si, mapSeed: cb[2], playerSide: 'atk', playerChar: 'fute', cpuChar: 'kuro', playerArmy: g.defaultArmy('atk', si), cpuArmy: g.defaultArmy('def', si) });
  ok(G.map.w >= g.SIZES[si].w && G.map.h >= g.SIZES[si].h, 'size ' + m.id);
  ok(G.units.length === 2 + g.armyCount(g.defaultArmy('atk', si)) + g.armyCount(g.defaultArmy('def', si)), 'unit count ' + m.id);
  ok(g.listTiles(G, 'K').length === 1, 'one keep ' + m.id);
  ok(g.listTiles(G, 'G').length >= 1, 'gate ' + m.id);
  // 攻撃側足軽が壁を壊さずに本丸へ行けないこと（BFS）
  var dummy = { type: 'ashigaru', side: 'atk', mov: 999 };
  var start = G.units.filter(function (u) { return u.side === 'atk' && u.type === 'ashigaru'; })[0];
  var seen = {}, q = [[start.c, start.r]]; seen[start.c + ',' + start.r] = 1; var reachedKeep = false;
  while (q.length) { var p = q.shift(); g.neighbors(p[0], p[1]).forEach(function (nb) { var t = g.tileAt(G, nb[0], nb[1]); if (!t) return; if (g.moveCost(G, dummy, t) === null) return; var k = nb[0] + ',' + nb[1]; if (seen[k]) return; seen[k] = 1; if (t.ch === 'K') reachedKeep = true; q.push(nb); }); }
  ok(!reachedKeep, 'castle enclosed ' + m.id);
  // 出陣した攻め手が城の外の地面（壁の隣）に歩いて行けること
  ok(Object.keys(seen).some(function (k) { var p = k.split(',').map(Number); return g.neighbors(p[0], p[1]).some(function (n) { var t = g.tileAt(G, n[0], n[1]); return t && (t.ch === 'W' || t.ch === 'G'); }); }), 'walls approachable ' + m.id);
  // 忍者は入れる
  var nin = { type: 'ninja', side: 'atk', mov: 999 };
  seen = {}; q = [[start.c, start.r]]; reachedKeep = false;
  while (q.length) { var p2 = q.shift(); g.neighbors(p2[0], p2[1]).forEach(function (nb) { var t = g.tileAt(G, nb[0], nb[1]); if (!t) return; if (g.moveCost(G, nin, t) === null) return; var k = nb[0] + ',' + nb[1]; if (seen[k]) return; seen[k] = 1; if (t.ch === 'K') reachedKeep = true; q.push(nb); }); }
  ok(reachedKeep, 'ninja can reach keep ' + m.id);
  // 壁を全部壊せば足軽が本丸へ届く
  g.listTiles(G, 'W').concat(g.listTiles(G, 'G')).forEach(function (t) { t.broken = true; });
  seen = {}; q = [[start.c, start.r]]; reachedKeep = false;
  while (q.length) { var p3 = q.shift(); g.neighbors(p3[0], p3[1]).forEach(function (nb) { var t = g.tileAt(G, nb[0], nb[1]); if (!t) return; if (g.moveCost(G, dummy, t) === null) return; var k = nb[0] + ',' + nb[1]; if (seen[k]) return; seen[k] = 1; if (t.ch === 'K') reachedKeep = true; q.push(nb); }); }
  ok(reachedKeep, 'keep reachable after breach ' + m.id);
  g.listTiles(G, 'W').concat(g.listTiles(G, 'G')).forEach(function (t) { t.broken = false; });
  // 全ユニット配置済み・重複なし
  var pos = {};
  G.units.forEach(function (u) { ok(u.c >= 0 && u.r >= 0, 'placed ' + u.type); var k = u.c + ',' + u.r; ok(!pos[k], 'no overlap ' + k + ' ' + m.id); pos[k] = 1; });
  // 防衛側は城内
  G.units.forEach(function (u) { if (u.side === 'def') { var t = g.tileAt(G, u.c, u.r); ok('WCKG'.indexOf(t.ch) >= 0, 'def inside ' + u.type + ' ' + m.id); } });
});

// 2. 戦闘
g.RNG.mode = 'seed';
(function () {
  var G = g.newGame({ mapIndex: 0, playerSide: 'atk', playerChar: 'fute', cpuChar: 'kuro', playerArmy: g.defaultArmy('atk'), cpuArmy: g.defaultArmy('def') });
  var a = G.units.filter(function (u) { return u.side === 'atk' && u.type === 'kiba'; })[0];
  var d = G.units.filter(function (u) { return u.side === 'def' && u.type === 'yumi'; })[0];
  a.c = 7; a.r = 7; d.c = 7; d.r = 8;
  var res = g.doAttack(G, a, d);
  ok(res.dmg >= 1 && res.dmg <= 20, 'dmg range');
  ok(d.hp === 10 - res.dmg || d.hp === 0, 'hp reduced');
  ok(a.acted, 'acted flag');
  // 鉄砲は移動後撃てない
  var t = G.units.filter(function (u) { return u.side === 'atk' && u.type === 'ashigaru'; })[0];
  t.type = 'teppo'; t.rmin = 2; t.rmax = 2; d.hp = 10;
  ok(!g.canAttackFrom(G, t, 7, 6, d, true), 'teppo no attack after move');
  ok(g.canAttackFrom(G, t, 7, 6, d, false), 'teppo attack range 2');
  ok(!g.canAttackFrom(G, t, 7, 7, d, false), 'teppo not range 1 (7,7)-(7,8) dist=' + g.hexDist(7, 7, 7, 8));
})();

// 3. 壁・門
(function () {
  var G = g.newGame({ mapIndex: 0, playerSide: 'atk', playerChar: 'fute', cpuChar: 'kuro', playerArmy: g.defaultArmy('atk'), cpuArmy: g.defaultArmy('def') });
  var k = G.units.filter(function (u) { return u.side === 'atk' && u.type === 'kosaku'; })[0];
  var gate = g.listTiles(G, 'G')[0];
  // 門の下隣
  var below = g.neighbors(gate.c, gate.r).map(function (p) { return g.tileAt(G, p[0], p[1]); }).filter(function (t) { return t && t.r > gate.r; })[0];
  k.c = below.c; k.r = below.r;
  ok(g.canHitWallFrom(G, k, k.c, k.r, gate, true), 'kosaku can hit gate');
  g.doHitWall(G, k, gate); ok(gate.hp === 2, 'gate hp 2');
  k.acted = false; g.doHitWall(G, k, gate); ok(gate.broken && gate.hp === 0, 'gate broken');
  var ash = { type: 'ashigaru', side: 'atk' };
  ok(g.moveCost(G, ash, gate) === 1, 'broken gate passable');
  // 忍者が門を開ける
  var G2 = g.newGame({ mapIndex: 2, playerSide: 'atk', playerChar: 'fute', cpuChar: 'kuro', playerArmy: g.defaultArmy('atk'), cpuArmy: g.defaultArmy('def') });
  var nin = G2.units.filter(function (u) { return u.type === 'ninja'; })[0];
  var gate2 = g.listTiles(G2, 'G')[0];
  var b2 = g.neighbors(gate2.c, gate2.r).map(function (p) { return g.tileAt(G2, p[0], p[1]); }).filter(function (t) { return t && t.r > gate2.r; })[0];
  nin.c = b2.c; nin.r = b2.r;
  ok(g.canOpenGateFrom(G2, nin, nin.c, nin.r, gate2), 'ninja can open');
  g.doOpenGate(G2, nin, gate2);
  ok(g.moveCost(G2, ash, gate2) === 1, 'open gate passable');
  // 修理
  var ko = G2.units.filter(function (u) { return u.side === 'def' && u.type === 'kosaku'; })[0];
  var wall = g.listTiles(G2, 'W')[0]; wall.hp = 2; ko.c = wall.c; ko.r = wall.r + 1; ko.acted = false;
  // 隣接させる
  var nb = g.neighbors(wall.c, wall.r)[0]; ko.c = nb[0]; ko.r = nb[1];
  ok(g.canRepairFrom(G2, ko, ko.c, ko.r, wall), 'can repair');
  g.doRepair(G2, ko, wall); ok(wall.hp === 2 + g.REPAIR, 'repaired');
})();

// 4. 隠密
(function () {
  var G = g.newGame({ mapIndex: 0, playerSide: 'def', playerChar: 'fute', cpuChar: 'kuro', playerArmy: g.defaultArmy('def'), cpuArmy: g.defaultArmy('atk') });
  var nin = G.units.filter(function (u) { return u.type === 'ninja'; })[0];
  ok(!g.isVisibleTo(G, nin, 'def'), 'ninja hidden at start');
  ok(g.isVisibleTo(G, nin, 'atk'), 'ninja visible to own');
  var d = G.units.filter(function (u) { return u.side === 'def' && u.type === 'ashigaru'; })[0];
  d.c = nin.c; d.r = nin.r - 1;
  ok(g.isVisibleTo(G, nin, 'def'), 'ninja visible when adjacent');
})();

// 5. AI vs AI シミュレーション：必ず終わる、両陣営が勝てる
var wins = { atk: 0, def: 0 }, turns = [];
for (var mi = 0; mi < g.CASTLES.length; mi++) for (var s = 0; s < 6; s++) {
  g.RNG.seed = 1000 + s * 7 + mi;
  var G = g.newGame({ mapIndex: mi, playerSide: 'atk', playerChar: 'fute', cpuChar: 'kuro', playerArmy: g.defaultArmy('atk'), cpuArmy: g.defaultArmy('def'), difficulty: 'normal' });
  var guard = 0;
  while (!G.over && guard++ < 400) {
    var order = g.aiOrder(G, G.side);
    for (var i = 0; i < order.length; i++) { var u = order[i]; if (u.hp <= 0 || u.acted) continue; var plan = g.aiPlan(G, u); ok(plan, 'plan exists'); g.aiExecute(G, u, plan); }
    g.endTurn(G);
  }
  ok(G.over, 'game ends map' + mi + ' seed' + s);
  // 位置の整合性
  var pos = {}; G.units.forEach(function (u) { if (u.hp > 0) { var k = u.c + ',' + u.r; ok(!pos[k], 'no overlap end'); pos[k] = 1; var t = g.tileAt(G, u.c, u.r); ok(t, 'on map'); } });
  wins[G.winner]++; turns.push(G.turn);
}
console.log('AI vs AI wins:', wins, 'avg turn', (turns.reduce(function (a, b) { return a + b; }, 0) / turns.length).toFixed(1));
ok(wins.atk > 0 && wins.def > 0, 'both sides can win');

// 6. 橋かけ
(function () {
  var G = g.newGame({ mapIndex: 3, playerSide: 'atk', playerChar: 'fute', cpuChar: 'kuro', playerArmy: g.defaultArmy('atk'), cpuArmy: g.defaultArmy('def') });
  var ko = G.units.filter(function (u) { return u.side === 'atk' && u.type === 'kosaku'; })[0];
  var river = g.listTiles(G, 'r').filter(function (t) { return t.r === 7; })[0];
  var nb = g.neighbors(river.c, river.r).map(function (p) { return g.tileAt(G, p[0], p[1]); }).filter(function (t) { return t && t.ch === '.'; })[0];
  ko.c = nb.c; ko.r = nb.r;
  ok(g.canBuildBridgeFrom(G, ko, ko.c, ko.r, river), 'kosaku can bridge');
  g.doBuildBridge(G, ko, river);
  ok(river.ch === 'b' && g.moveCost(G, { type: 'kiba', side: 'atk' }, river) === 1, 'bridge passable');
  ok(!g.canBuildBridgeFrom(G, G.units.filter(function (u) { return u.type === 'kiba'; })[0], ko.c, ko.r, g.listTiles(G, 'r')[0]), 'only kosaku bridges');
  ok(g.UNIT_TYPES.kiba.def > g.UNIT_TYPES.ashigaru.def && g.UNIT_TYPES.teppo.def < g.UNIT_TYPES.ashigaru.def && g.UNIT_TYPES.kosaku.def >= 6, 'stat profile');
})();
console.log(n + ' checks, ' + fails + ' failures');
process.exit(fails ? 1 : 0);
