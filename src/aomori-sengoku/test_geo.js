'use strict';
// 国取りの 実地形マップ：全国 × 攻め口 × 大きさ で 生成チェック ＋ 退却つき AI 対戦
var C = require('./csim.js'), vm = require('vm');
var fails = 0, n = 0, stats = { sea: 0, tiles: 0, exitsDef: 0, maps: 0, noEsc: 0 };
function ok(c, m) { n++; if (!c) { fails++; if (fails < 40) console.log('FAIL:', m); } }
var S = vm.runInContext('newCampaign({clan:"oura", scenario:"1571", difficulty:"normal", seed:1234})', C);
function bfs(G, start, u, goal) {
  var seen = {}, q = [start]; seen[start[0] + ',' + start[1]] = 1;
  while (q.length) {
    var p = q.shift(); if (goal(C.tileAt(G, p[0], p[1]))) return true;
    C.neighbors(p[0], p[1]).forEach(function (nb) { var t = C.tileAt(G, nb[0], nb[1]); if (!t || C.moveCost(G, u, t) === null) return; var k = nb[0] + ',' + nb[1]; if (seen[k]) return; seen[k] = 1; q.push(nb); });
  }
  return false;
}
var battles = 0, endings = {}, fledSeen = { atk: 0, def: 0 };
C.PROVS.forEach(function (T) {
  C.ADJ[T.id].forEach(function (from) {
    // 守り＝尼子、攻め＝毛利、ほかの となりは 尼子（退き口が できる）
    C.PROVS.forEach(function (p) { S.provs[p.id].owner = 'nanbu'; });
    S.provs[from].owner = 'oura';
    [0, 1, 2].forEach(function (si) {
      var mk = function (k, n2) { var a = []; for (var i = 0; i < n2; i++) a.push({ uid: k + i, type: ['ashigaru', 'yumi', 'kiba', 'teppo', 'kosaku'][i % 5], hp: 10 }); return a; };
      var b = { from: from, to: T.id, atkClan: 'oura', defClan: 'nanbu', castle: T.castle, atkUnits: mk('a', [9, 14, 19][si]), defUnits: mk('d', [7, 11, 15][si]) };
      var env = C.battleEnv(S, b);
      var ci = C.castleIndexOf(T.castle);
      var G = C.newGame({ mapIndex: ci, sizeIndex: Math.max(si, C.CASTLES[ci].minSize || 0), mapSeed: 777 + si, playerSide: 'atk', playerChar: 'fute', cpuChar: 'kuro', playerUnits: b.atkUnits, cpuUnits: b.defUnits, campaign: true, env: env });
      var id = T.id + '<-' + from + '/' + si;
      stats.maps++;
      G.map.tiles.forEach(function (row) { row.forEach(function (t) { stats.tiles++; if (t.ch === 's') stats.sea++; }); });
      var pos = {};
      G.units.forEach(function (u) { ok(u.c >= 0 && u.r >= 0, 'placed ' + u.type + ' ' + id); var k = u.c + ',' + u.r; ok(!pos[k], 'overlap ' + id); pos[k] = 1; var t = C.tileAt(G, u.c, u.r); ok(t && t.ch !== 's' && t.ch !== 'M', 'not in sea/peak ' + id); });
      G.units.forEach(function (u) { if (u.side === 'def') ok('WCKG'.indexOf(C.tileAt(G, u.c, u.r).ch) >= 0, 'def inside ' + id); });
      ok(C.listTiles(G, 'K').length === 1, 'keep ' + id);
      // 壁を こわせば 足軽が 本丸へ
      var st = G.units.filter(function (u) { return u.side === 'atk' && u.type === 'ashigaru'; })[0];
      C.listTiles(G, 'W').concat(C.listTiles(G, 'G')).forEach(function (t) { t.broken = true; });
      ok(bfs(G, [st.c, st.r], { type: 'ashigaru', side: 'atk' }, function (t) { return t.ch === 'K'; }), 'keep reachable ' + id);
      C.listTiles(G, 'W').concat(C.listTiles(G, 'G')).forEach(function (t) { t.broken = false; });
      // 退き口
      ok(G.exits.atk.length >= 1, 'atk exits ' + id);
      var nEsc = env.escapes.length; if (!nEsc) stats.noEsc++;
      if (nEsc) { ok(G.exits.def.length >= 1, 'def exits ' + id + ' esc=' + nEsc); stats.exitsDef++; }
      // 本丸から 守りの 退き口へ 歩いて いけるか（門を あけた 状態）
      C.listTiles(G, 'G').forEach(function (t) { t.open = true; });
      G.exits.def.forEach(function (e) {
        var k = C.findKeep(G);
        ok(bfs(G, [k.c, k.r], { type: 'ashigaru', side: 'def' }, function (t) { return t.c === e.c && t.r === e.r; }), 'def exit reachable ' + id + ' ' + e.name);
      });
      C.listTiles(G, 'G').forEach(function (t) { t.open = false; });
      G.exits.atk.concat(G.exits.def).forEach(function (e) { var t = C.tileAt(G, e.c, e.r); ok(t && '.=fhb'.indexOf(t.ch) >= 0, 'exit terrain ' + id); });
      // AI 同士で 最後まで（退却あり）
      if (si === 0) {
        battles++;
        var guard = 0;
        while (!G.over && guard++ < 400) {
          var list = C.aiOrder(G, G.side);
          list.forEach(function (u) { if (G.over || u.hp <= 0 || u.fled) return; var pl = C.aiPlan(G, u); if (pl) C.aiExecute(G, u, pl); C.checkVictory(G); });
          if (!G.over) C.endTurn(G);
        }
        ok(G.over, 'battle ends ' + id);
        endings[G.reason] = (endings[G.reason] || 0) + 1;
        fledSeen.atk += C.escaped(G, 'atk').length; fledSeen.def += C.escaped(G, 'def').length;
        // 国取りへ 反映
        var res = { winner: G.winner, atkSurv: C.survivors(G, 'atk'), defSurv: C.survivors(G, 'def'), atkFled: C.escaped(G, 'atk'), defFled: C.escaped(G, 'def') };
        var S2 = JSON.parse(JSON.stringify(S));
        S2.provs[from].units = []; S2.provs[T.id].units = [];
        C.applyBattle(S2, b, res);
        var ids = {}; Object.keys(S2.provs).forEach(function (pid) { S2.provs[pid].units.forEach(function (u) { ok(!ids[u.uid], 'dup ' + u.uid + ' ' + id); ids[u.uid] = 1; ok(u.hp >= 1 && u.hp <= 10, 'hp ' + id); }); ok(S2.provs[pid].units.length <= C.PROV_CAP, 'cap ' + id); });
        res.defFled.forEach(function (u) { if (S2.provs[u.to].owner === 'nanbu') ok(S2.provs[u.to].units.some(function (x) { return x.uid === u.uid; }), 'fled arrived ' + id); });
      }
    });
  });
});
// 支城の 合戦マップ（となりからの 攻め口 と 国の 中の とりのこし）
var brMaps = 0;
Object.keys(S.castles).forEach(function (cid) {
  var C0 = S.castles[cid], pid = C0.prov;
  var froms = C.ADJ[pid].slice(0, 2).concat([pid]);
  froms.forEach(function (from) {
    C.PROVS.forEach(function (p) { S.provs[p.id].owner = 'nanbu'; });
    S.provs[from].owner = 'oura'; if (from === pid) { S.provs[pid].owner = 'oura'; }
    C0.owner = 'nanbu';
    var mk = function (k, n2) { var a = []; for (var i = 0; i < n2; i++) a.push({ uid: k + i, type: ['ashigaru', 'yumi', 'kiba', 'teppo', 'kosaku'][i % 5], hp: 10 }); return a; };
    var tpl = vm.runInContext('brTpl', C)(cid);
    var b = { from: from, to: pid, castleId: cid, atkClan: 'oura', defClan: 'nanbu', castle: tpl, atkUnits: mk('a', 9), defUnits: mk('d', 4) };
    var env = C.battleEnv(S, b), ci = C.castleIndexOf(tpl);
    var G = C.newGame({ mapIndex: ci, sizeIndex: C.CASTLES[ci].minSize || 0, mapSeed: 99, playerSide: 'atk', playerChar: 'fute', cpuChar: 'kuro', playerUnits: b.atkUnits, cpuUnits: b.defUnits, campaign: true, env: env });
    var id = cid + '<-' + from; brMaps++;
    G.units.forEach(function (u) { ok(u.c >= 0 && u.r >= 0, 'br placed ' + id); var t = C.tileAt(G, u.c, u.r); ok(t && t.ch !== 's' && t.ch !== 'M', 'br not sea ' + id); });
    var st = G.units.filter(function (u) { return u.side === 'atk' && u.type === 'ashigaru'; })[0];
    C.listTiles(G, 'W').concat(C.listTiles(G, 'G')).forEach(function (t) { t.broken = true; });
    ok(bfs(G, [st.c, st.r], { type: 'ashigaru', side: 'atk' }, function (t) { return t.ch === 'K'; }), 'br keep reachable ' + id);
  });
});
console.log('branch maps', brMaps);
console.log('maps', stats.maps, 'sea%', (stats.sea / stats.tiles * 100).toFixed(1), 'noEscape', stats.noEsc, 'battles', battles, 'fled', JSON.stringify(fledSeen));
console.log('endings', JSON.stringify(endings));
console.log(n + ' checks, ' + fails + ' failures');
