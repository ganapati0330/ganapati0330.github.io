'use strict';
// たおした てきが 仲間に なる・にげた てきの 兵糧を うばう
var C = require('./csim.js'), vm = require('vm');
var fails = 0, n = 0; function ok(c, m) { n++; if (!c) { fails++; console.log('FAIL:', m); } }
function mk() { var S = vm.runInContext('newCampaign({clan:"mori", scenario:"1523", difficulty:"normal", seed:11})', C); return S; }
var S = mk(), R = function (src) { C.__S = S; return vm.runInContext(src, C); };
var to = 'yoshida', from = vm.runInContext('ADJ', C)[to].filter(function (q) { return S.provs[q].owner !== 'mori'; })[0];
var D = S.provs[to]; D.units = []; for (var i = 0; i < 6; i++) D.units.push(R('newUnit(__S, "ashigaru")'));
var atk = []; for (i = 0; i < 8; i++) atk.push(R('newUnit(__S, "ashigaru")'));
var b = { from: from, to: to, castleId: null, atkClan: S.provs[from].owner, defClan: 'mori', atkUnits: atk.map(function (u) { return { uid: u.uid, type: u.type, hp: u.hp }; }), defUnits: D.units.slice(), foodDays: 20, defFood: R('castleFood(__S, "yoshida", null)') };
var food0 = R('castleFood(__S, "yoshida", null)');
// 攻めては 3隊（へった）で にげた。のこり 兵糧 40石
var surv = atk.slice(0, 3).map(function (u) { return { uid: u.uid, type: u.type, hp: 4 }; });
var res = { winner: 'def', atkSurv: surv, defSurv: D.units.slice(), atkFled: [], defFled: [], atkFood: 40, defFood: food0 };
R('applyBattle')(S, b, res);
ok(res.killMen > 0 && D.units.length > 6, 'defeated attackers join defender: ' + res.killMen + ' / ' + D.units.length);
ok(res.lootRice === 20, 'half of left rice looted: ' + res.lootRice);
ok(R('castleFood(__S, "yoshida", null)') === food0 + 20, 'rice into castle store');
// 兵糧ぎれで ひきあげた ときは うばえない
S = mk(); D = S.provs[to]; D.units = [R('newUnit(__S, "yumi")')];
b.defUnits = D.units.slice();
res = { winner: 'def', atkSurv: surv, defSurv: D.units.slice(), atkFled: [], defFled: [], atkFood: 0, foodOut: true };
R('applyBattle')(S, b, res); ok(!res.lootRice, 'no loot when food ran out');
// ぜんめつ させたら 8割
S = mk(); D = S.provs[to]; D.units = [R('newUnit(__S, "yumi")')]; b.defUnits = D.units.slice();
res = { winner: 'def', atkSurv: [], defSurv: D.units.slice(), atkFled: [], defFled: [], atkFood: 50 };
R('applyBattle')(S, b, res); ok(res.lootRice === 40, 'annihilated -> 80%: ' + res.lootRice);
// おまかせ（atkFood なし）でも めやすで 手に入る
S = mk(); D = S.provs[to]; D.units = [R('newUnit(__S, "yumi")')]; b.defUnits = D.units.slice();
res = { winner: 'def', atkSurv: surv, defSurv: D.units.slice() };
R('applyBattle')(S, b, res); ok(res.lootRice > 0 && res.killMen > 0, 'auto battle loot/join: ' + res.lootRice + ' ' + res.killMen);
// 攻めて かった ときも たおした 守りの 一部が くわわる
S = mk(); var B2 = S.provs[from]; var dU = B2.units.slice(0, 6);
var atk2 = []; for (i = 0; i < 8; i++) atk2.push(R('newUnit(__S, "ashigaru")'));
var b2 = { from: to, to: from, castleId: null, atkClan: 'mori', defClan: B2.owner, atkUnits: atk2.slice(), defUnits: dU.map(function (u) { return { uid: u.uid, type: u.type, hp: u.hp }; }) };
S.provs[to].units = [];
res = { winner: 'atk', atkSurv: atk2.slice(), defSurv: [], atkFled: [], defFled: [] };
R('applyBattle')(S, b2, res);
ok(S.provs[from].owner === 'mori' && res.killMen > 0 && S.provs[from].units.length > 8, 'attacker gains: ' + res.killMen + ' / ' + S.provs[from].units.length);
// 連勝：志願兵と 寝返り
S = mk(); D = S.provs[to]; D.units = [R('newUnit(__S, "yumi")')];
S.clans.mori.streak = 3;
b = { from: from, to: to, castleId: null, atkClan: S.provs[from].owner, defClan: 'mori', atkUnits: atk.map(function (u) { return { uid: u.uid, type: u.type, hp: u.hp }; }), defUnits: D.units.slice(), foodDays: 20 };
res = { winner: 'def', atkSurv: [], defSurv: D.units.slice(), atkFled: [], defFled: [] };
R('applyBattle')(S, b, res);
ok(S.clans.mori.streak === 4 && res.volMen === 270 && S.clans[b.atkClan].streak === 0, '4連勝 -> 志願兵 270: ' + res.volMen + ' streak ' + S.clans.mori.streak);
var r1 = { winner: 'atk', atkSurv: [], defSurv: [], atkFled: [], defFled: [] };
ok(!res.lootRice || res.lootRice > 0, 'ok');
var OFFX = {}; (function () { var S0 = mk(); Object.keys(S0.officers).forEach(function (k) { OFFX[k] = S0.officers[k].clan; }); })();
// 寝返り：連勝中は となりの 家の 武将が くる（なんきせつか まわす）
var S3 = mk(); S3.clans.mori.streak = 6; var got = 0;
for (var k = 0; k < 30 && !got; k++) { R('streakDefect')(S3); got = R('officersOf')(S3, 'mori').filter(function (o) { return !o.lord && OFFX[o.id] !== 'mori'; }).length; }
function noop() {}
ok(got > 0, 'defection while on a streak');
ok(R('officersOf')(S3, 'mori').every(function (o) { return o.at && R('locOwner')(S3, o.at) === 'mori'; }), 'defector placed in our castle');
var S4 = mk(); var before = JSON.stringify(Object.keys(S4.officers).map(function (k2) { return S4.officers[k2].clan; }));
for (k = 0; k < 30; k++) R('streakDefect')(S4);
ok(before === JSON.stringify(Object.keys(S4.officers).map(function (k2) { return S4.officers[k2].clan; })), 'no streak, no defection');
console.log(n + ' checks, ' + fails + ' failures');
