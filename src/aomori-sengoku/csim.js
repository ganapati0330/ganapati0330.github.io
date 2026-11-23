// game.js + campaign.js を 同じ空間で読み込む
var vm = require('vm'), fs = require('fs');
var ctx = { module: {}, console: console, Math: Math, JSON: JSON };
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(__dirname + '/game.js', 'utf8').replace(/if \(typeof module !== 'undefined'\) \{[\s\S]*?\n\}\n/, ''), ctx);
vm.runInContext(fs.readFileSync(__dirname + '/geo.js', 'utf8'), ctx);
vm.runInContext(fs.readFileSync(__dirname + '/world.js', 'utf8'), ctx);
vm.runInContext(fs.readFileSync(__dirname + '/campaign.js', 'utf8').replace(/if \(typeof module !== 'undefined'\) \{[\s\S]*$/, ''), ctx);
vm.runInContext(fs.readFileSync(__dirname + '/events.js', 'utf8').replace(/if \(typeof module !== 'undefined'\)[\s\S]*$/, ''), ctx);
module.exports = ctx;
if (require.main === module) {
  var C = ctx, mode = process.argv[2] || 'allcpu', N = +process.argv[3] || 20, diff = process.argv[4] || 'normal', scen = process.argv[5] || '1571', PC = process.argv[6] || (scen === '1590' ? 'kunohe' : 'oura');
  var res = {}, years = [], playerDeath = [], peak = [], at1560 = [], evCount = {};
  for (var g = 0; g < N; g++) {
    var S = vm.runInContext('newCampaign({clan:"' + PC + '", scenario:"' + scen + '", difficulty:"' + diff + '", seed:' + (1000 + g * 77) + '})', ctx);
    var guard = 0;
    if (process.env.FIKKI) ['oura', 'hiyama', 'hei'].forEach(function (pid) { var P = S.provs[pid]; P.units = P.units.slice(0, 1); P.fuman = 100; ctx.ikkiRise(S, pid); });
    while (!S.over && guard++ < 200) {
      if (process.env.MTAX) C.provsOf(S, PC).forEach(function (pid) { S.provs[pid].tax = +process.env.MTAX; });
      // プレイヤー（毛利）
      if (mode === 'allcpu') { if (ctx.cpuGarrison) ctx.cpuGarrison(S, PC); C.provsOf(S, PC).forEach(function (pid) { for (var k = 0; k < (+process.env.PCMD || 3); k++) { if (S.over || S.provs[pid].acted || S.provs[pid].owner !== PC) return; var d = C.cpuDecide(S, pid); if (d.kind === 'wait') return; if (d.kind === 'attack') { var b = C.makeBattle(S, pid, d.to, d.uids, d.castle || null); C.startBattle(S, b); C.applyBattle(S, b, C.autoResolve(S, b)); } else if (d.kind === 'recruit') C.recruit(S, pid, d.order); else if (d.kind === 'develop') C.develop(S, pid); else if (d.kind === 'move') C.moveUnits(S, pid, d.to, d.uids); else if (d.kind === 'scheme') ctx.scheme(S, pid, d.to, d.how); ctx.markCmd(S.provs[pid], d.kind); if (d.kind === 'attack') return; } }); }
      if (S.over) break;
      C.cpuBegin(S);
      var r;
      while ((r = C.cpuNext(S)).type === 'battle') { C.applyBattle(S, r.battle, C.autoResolve(S, r.battle)); }
      if (S.over) break;
      C.seasonEnd(S);
      if (S.year === (scen === '1590' ? 1595 : 1580) && S.season === 0) at1560.push(C.provsOf(S, PC).length);
      // 整合性
      Object.keys(S.provs).forEach(function (pid) { var P = S.provs[pid]; if (P.units.length > C.PROV_CAP) throw new Error('cap ' + pid); P.units.forEach(function (u) { if (u.hp < 1 || u.hp > 10) throw new Error('hp ' + u.hp); }); if (!P.owner) throw new Error('no owner'); });
      Object.keys(S.provs).forEach(function (pid) { var o = S.provs[pid].officer; if (!o) return; var O = S.officers[o]; if (!O) throw new Error('missing officer ' + o); if (O.prov !== pid) throw new Error('officer prov mismatch ' + O.name); if (O.clan !== S.provs[pid].owner) throw new Error('officer clan mismatch ' + O.name + ' ' + O.clan + ' at ' + pid + ' of ' + S.provs[pid].owner); });
      Object.keys(S.officers).forEach(function (k) { var O = S.officers[k]; if (O.prov && S.provs[O.prov].officer !== k) throw new Error('dangling prov ' + O.name); if (!S.clans[O.clan] || !S.clans[O.clan].alive) throw new Error('officer of dead clan ' + O.name); });
      var ids = {}; Object.keys(S.provs).forEach(function (pid) { S.provs[pid].units.forEach(function (u) { if (ids[u.uid]) throw new Error('dup uid'); ids[u.uid] = 1; }); }); Object.keys(S.castles || {}).forEach(function (k) { S.castles[k].units.forEach(function (u) { if (ids[u.uid]) throw new Error('dup uid castle'); ids[u.uid] = 1; }); });
    }
    (S.history || []).forEach(function (h) { evCount[h.id] = (evCount[h.id] || 0) + 1; });
    S.log.forEach(function (l) { if (/大一揆/.test(l.text)) evCount.ikkiTaken = (evCount.ikkiTaken || 0) + 1; else if (/一揆が おきた/.test(l.text)) evCount.ikkiPut = (evCount.ikkiPut || 0) + 1; });
    evCount.ikkiEnd = (evCount.ikkiEnd || 0) + C.PROVS.filter(function (p) { return S.provs[p.id].owner === 'ikki'; }).length;
    var w = S.winner || (S.over ? 'player-dead' : 'none@' + S.year);
    if (!S.over) { var top = ctx.CLAN_ORDER.map(c => [c, C.provsOf(S, c).length]).sort((a, b) => b[1] - a[1])[0]; w = 'none(top ' + top[0] + ' ' + top[1] + ')'; }
    res[w] = (res[w] || 0) + 1; years.push(S.year); if (w === 'player-dead') playerDeath.push(S.year);
  }
  if (process.env.EV) console.log('events', JSON.stringify(evCount));
  if (process.env.DY) console.log('death years', JSON.stringify(playerDeath.sort()));
  console.log(scen, mode, diff, JSON.stringify(res), PC + '@mid', JSON.stringify(at1560), 'avg end year', (years.reduce((a, b) => a + b, 0) / years.length).toFixed(1));
}
