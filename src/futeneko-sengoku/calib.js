// 実際の合戦（AI対AI）と おまかせ の 勝率を くらべる
var C = require('./csim.js'), vm = require('vm');
var g = require('./game.js'); g.RNG.mode = 'seed';
function units(spec) { var out = [], id = 1; for (var t in spec) for (var i = 0; i < spec[t]; i++) out.push({ uid: id++, type: t, hp: 10 }); return out; }
var cases = process.argv[2] === 'k' ? [
  ['umi', { ashigaru: 6, yumi: 2, kiba: 1, kosaku: 1, ninja: 1 }, { ashigaru: 3, yumi: 2, kosaku: 1 }],
  ['toride', { ashigaru: 6, yumi: 2, kiba: 1, kosaku: 1, ninja: 1 }, { ashigaru: 3, yumi: 2, kosaku: 1 }],
  ['yama', { ashigaru: 6, yumi: 2, kiba: 1, kosaku: 1, ninja: 1 }, { ashigaru: 3, yumi: 2, kosaku: 1 }],
  ['nino', { ashigaru: 6, yumi: 2, kiba: 1, kosaku: 1, ninja: 1 }, { ashigaru: 3, yumi: 2, kosaku: 1 }],
  ['mizu', { ashigaru: 6, yumi: 2, kiba: 1, kosaku: 1, ninja: 1 }, { ashigaru: 3, yumi: 2, kosaku: 1 }],
  ['hira', { ashigaru: 6, yumi: 2, kiba: 1, kosaku: 1, ninja: 1 }, { ashigaru: 3, yumi: 2, kosaku: 1 }],
  ['oo', { ashigaru: 8, yumi: 3, kiba: 2, kosaku: 2, ninja: 1 }, { ashigaru: 4, yumi: 3, kosaku: 1 }]
] : [
  ['hira', { ashigaru: 5, yumi: 2, kiba: 2, kosaku: 1 }, { ashigaru: 4, yumi: 2, teppo: 1 }],
  ['yama', { ashigaru: 6, yumi: 2, kiba: 2, kosaku: 1, ninja: 1 }, { ashigaru: 5, yumi: 2, teppo: 1 }],
  ['oo', { ashigaru: 8, yumi: 3, kiba: 3, kosaku: 2, teppo: 2 }, { ashigaru: 6, yumi: 3, teppo: 2, kosaku: 1 }],
  ['toride', { ashigaru: 4, yumi: 1, kiba: 1 }, { ashigaru: 3, yumi: 2 }],
  ['hira', { ashigaru: 4, yumi: 1, kiba: 1 }, { ashigaru: 4, yumi: 2, teppo: 1 }]
];
cases.forEach(function (cs) {
  var b = { atkUnits: units(cs[1]), defUnits: units(cs[2]), castle: cs[0] };
  var ci = C.castleIndexOf(cs[0]), si = C.battleSizeIndex(b), tw = 0, aw = 0, N = 12;
  for (var s = 0; s < N; s++) {
    g.RNG.seed = 300 + s * 11;
    var G = g.newGame({ mapIndex: ci, sizeIndex: si, mapSeed: 40 + s, playerSide: 'atk', playerChar: 'fute', cpuChar: 'kuro', playerUnits: b.atkUnits, cpuUnits: b.defUnits, campaign: true });
    var gd = 0; while (!G.over && gd++ < 400) { g.aiOrder(G, G.side).forEach(function (u) { if (u.hp > 0 && !u.acted) g.aiExecute(G, u, g.aiPlan(G, u)); }); g.endTurn(G); }
    if (G.winner === 'atk') tw++;
  }
  var S = vm.runInContext('newCampaign({clan:"mori", seed: 5})', C);
  for (var k = 0; k < 400; k++) if (C.autoResolve(S, b).winner === 'atk') aw++;
  var ratio = C.strength(b.atkUnits) / C.strength(b.defUnits);
  console.log(cs[0], 'str ratio', ratio.toFixed(2), 'tactical', (tw / N * 100).toFixed(0) + '%', 'auto', (aw / 4).toFixed(0) + '%');
});
