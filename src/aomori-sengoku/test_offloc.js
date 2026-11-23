'use strict';
// 家臣の いばしょと 移動
var C = require('./csim.js'), vm = require('vm');
var fails = 0, n = 0; function ok(c, m) { n++; if (!c) { fails++; console.log('FAIL:', m); } }
var S = vm.runInContext('newCampaign({clan:"oura", scenario:"1571", difficulty:"normal", seed:5})', C);
C.__S = S; var R = function (src) { return vm.runInContext(src, C); };
S.provs.namioka.owner = 'oura'; S.provs.iizume.owner = 'oura';   // しらべやすく 国を ふやす
R('offHomeFix')(S, 'oura');
var offs = R('officersOf(__S, "oura")');
if (offs.filter(function (o) { return !o.lord; }).length === 0) console.log('note: no retainers');
ok(offs.every(function (o) { return o.at && R('locOwner')(S, o.at) === 'oura'; }), 'every officer has a home castle');
ok(offs.filter(function (o) { return o.prov; }).every(function (o) { return o.at === o.prov; }), 'lords of castles live there');
// 全家の 家臣も
ok(Object.keys(S.officers).every(function (k) { var o = S.officers[k]; return !S.clans[o.clan].alive || !R('provsOf')(S, o.clan).length || (o.at && R('locOwner')(S, o.at) === o.clan); }), 'all clans placed');
var lord = S.officers['lord:oura'];
ok(R('offHere')(S, lord, lord.at) && !R('offHere')(S, lord, 'namioka' === lord.at ? 'iizume' : 'namioka'), 'works only where he is');
// 移動
var other = R('provsOf(__S, "oura")').filter(function (p) { return p !== lord.at; })[0];
var from = lord.at;
ok(R('moveOfficer')(S, lord.id, other), 'move ok');
ok(lord.at === other && lord.busy === S.turn && !lord.prov && !S.provs[from].officer, 'moved, busy, left lordship');
ok(!R('moveOfficer')(S, lord.id, from), 'cannot move twice in a season');
ok(R('freeHere')(S, 'oura', other).indexOf(lord) < 0, 'busy officer not free');
// 支城へ
S.turn++;
var br = Object.keys(S.castles).filter(function (k) { return S.castles[k].owner === 'oura'; })[0];
ok(R('moveOfficer')(S, lord.id, br) && R('offHere')(S, lord, S.castles[br].prov), 'branch castle counts for its province');
// 城を うしなうと にげる
S.turn++;
S.castles[br].owner = 'nanbu'; R('offHomeFix')(S, 'oura');
ok(R('locOwner')(S, lord.at) === 'oura', 'fled from lost castle to ' + lord.at);
// 城主の 任命：ほかの 城から くると はたらけない
S.turn++;
var o2 = offs.filter(function (o) { return !o.lord; })[0] || lord, tgt = R('provsOf(__S, "oura")').filter(function (p) { return p !== o2.at; })[0];
ok(R('setOfficer')(S, tgt, o2.id, true) && o2.at === tgt && o2.busy === S.turn, 'assign far -> moved & busy');
// まえの データ（at なし）
var txt = R('serialize')(S).replace(/,"at":"[^"]*"/g, '');
var S2 = R('deserialize')(txt);
ok(Object.keys(S2.officers).every(function (k) { var o = S2.officers[k]; return !S2.clans[o.clan].alive || !R('provsOf')(S2, o.clan).length || o.at; }), 'old save gets homes');
console.log(n + ' checks, ' + fails + ' failures');
