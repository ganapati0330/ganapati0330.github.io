var C = require('./csim.js'), vm = require('vm');
var S = vm.runInContext('newCampaign({clan:"mori", seed: 5})', C);
function units(n, t) { var o = []; for (var i = 0; i < n; i++) o.push({ uid: i, type: t || 'ashigaru', hp: 10 }); return o; }
var castle = process.argv[2] || 'hira';
var out = [];
[[8, 8], [10, 8], [12, 8], [14, 8], [16, 8], [19, 12]].forEach(function (ab) {
  var b = { atkUnits: units(ab[0]), defUnits: units(ab[1]), castle: castle }, w = 0;
  for (var k = 0; k < 400; k++) if (C.autoResolve(S, b).winner === 'atk') w++;
  out.push((ab[0] / ab[1]).toFixed(2) + ':' + (w / 4).toFixed(0) + '%');
});
console.log(castle, out.join('  '));
