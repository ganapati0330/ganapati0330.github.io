/* ===== フテ猫 戦国合戦 : 国取り（DOM非依存） ===== */
'use strict';

// ---- 大名家（すべての シナリオの もと） ----
var CLAN_BASE = {
  mori:       { name:'毛利家',   crest:'毛', color:'#3f9a4a', face:'fute', aggr:1.0 },
  ouchi:      { name:'大内家',   crest:'大', color:'#7a4aa8', face:'chap', aggr:1.15 },
  amago:      { name:'尼子家',   crest:'尼', color:'#c9403a', face:'kuro', aggr:1.15 },
  kikkawa:    { name:'吉川家',   crest:'吉', color:'#2f8a8a', face:null, aggr:0.7 },
  takeda:     { name:'安芸武田家', crest:'武', color:'#b8a030', face:null, aggr:0.9 },
  kobayakawa: { name:'小早川家', crest:'小', color:'#4a7ac8', face:null, aggr:0.7 },
  yamanouchi: { name:'山内家',   crest:'内', color:'#9a6a9a', face:null, aggr:0.7 },
  yamana:     { name:'山名家',   crest:'山', color:'#707a8a', face:null, aggr:0.7 },
  yoshimi:    { name:'吉見家',   crest:'見', color:'#a07040', face:null, aggr:0.7 },
  ogasawara:  { name:'小笠原家', crest:'笠', color:'#c07a50', face:null, aggr:0.7 },
  sho:        { name:'庄家',     crest:'庄', color:'#3a90c0', face:null, aggr:0.8 },
  mimura:     { name:'三村家',   crest:'三', color:'#3a90c0', face:null, aggr:0.8 },
  urakami:    { name:'浦上家',   crest:'浦', color:'#e0902a', face:null, aggr:0.8 }
};
var CLANS = {}, CLAN_ORDER = [];

// ---- 領地（18） ----
// kuni: むかしの 国、castle: CASTLES の id、koku: 石高（万石・めやす）、pin: 城の 経度・緯度
var PROVS = [
  { id:'nagato',  name:'長門',     kuni:'長門', castleName:'且山城',     castle:'katsuyama',    koku:13, pin:[130.97, 34.05] },
  { id:'suo',     name:'周防',     kuni:'周防', castleName:'大内館',     castle:'yakata',   koku:17, pin:[131.47, 34.18] },
  { id:'akiw',    name:'佐西',     kuni:'安芸', castleName:'桜尾城',     castle:'sakurao', koku:6,  pin:[132.33, 34.35] },
  { id:'sato',    name:'佐東',     kuni:'安芸', castleName:'佐東銀山城', castle:'kanayama',   koku:8,  pin:[132.47, 34.48] },
  { id:'yoshida', name:'吉田',     kuni:'安芸', castleName:'吉田郡山城', castle:'koriyama',   koku:6,  pin:[132.70, 34.67] },
  { id:'oasa',    name:'大朝',     kuni:'安芸', castleName:'小倉山城',   castle:'ridge', koku:5,  pin:[132.47, 34.77] },
  { id:'kagami',  name:'東西条',   kuni:'安芸', castleName:'鏡山城',     castle:'kagami',   koku:7,  pin:[132.74, 34.42] },
  { id:'nuta',    name:'沼田',     kuni:'安芸', castleName:'高山城',     castle:'ridge_r',   koku:6,  pin:[132.98, 34.43] },
  { id:'bingon',  name:'備後北部', kuni:'備後', castleName:'甲山城',     castle:'yamajiro_s', koku:8,  pin:[133.00, 34.83] },
  { id:'bingos',  name:'備後南部', kuni:'備後', castleName:'神辺城',     castle:'kannabe',   koku:12, pin:[133.37, 34.55] },
  { id:'iwamiw',  name:'石見西部', kuni:'石見', castleName:'三本松城',   castle:'ridge',   koku:7,  pin:[131.77, 34.47] },
  { id:'iwamie',  name:'石見東部', kuni:'石見', castleName:'温湯城',     castle:'yamajiro_s', koku:6,  pin:[132.49, 35.00], silver:15, silverYear:1527 },
  { id:'izumo',   name:'出雲',     kuni:'出雲', castleName:'月山富田城', castle:'gassan',     koku:19, pin:[133.19, 35.37] },
  { id:'hoki',    name:'伯耆',     kuni:'伯耆', castleName:'尾高城',     castle:'odaka',   koku:10, pin:[133.39, 35.40] },
  { id:'inaba',   name:'因幡',     kuni:'因幡', castleName:'布勢天神山城', castle:'fuse', koku:9,  pin:[134.17, 35.50] },
  { id:'mimasaka',name:'美作',     kuni:'美作', castleName:'高田城',     castle:'takada',   koku:19, pin:[133.69, 35.09] },
  { id:'bitchu',  name:'備中',     kuni:'備中', castleName:'猿掛城',     castle:'matsuyama',   koku:18, pin:[133.62, 34.81] },
  { id:'bizen',   name:'備前',     kuni:'備前', castleName:'三石城',     castle:'ridge_r',   koku:22, pin:[134.27, 34.83] }
];
var ADJ = (typeof CHUGOKU_GEO !== 'undefined') ? CHUGOKU_GEO.adj : {};   // world.js が あれば 下で 道から つくりなおす
// ---- 国ごとの 地形の 特ちょう（山・森・丘の こさ、川） ----
var PROV_TERRAIN = {
  nagato:  { mount: 1.0, forest: 1.0, hill: 1.2, river: 0.3, riverName: '木屋川' },
  suo:     { mount: 0.9, forest: 1.0, hill: 1.1, river: 0.7, riverName: '椹野川' },
  akiw:    { mount: 1.2, forest: 1.1, hill: 1.0, river: 0.3, riverName: '御手洗川' },
  sato:    { mount: 1.0, forest: 0.9, hill: 1.0, river: 0.95, riverName: '太田川' },
  yoshida: { mount: 1.4, forest: 1.3, hill: 1.2, river: 0.9, riverName: '可愛川' },
  oasa:    { mount: 1.6, forest: 1.5, hill: 1.2, river: 0.4, riverName: '江の川' },
  kagami:  { mount: 0.9, forest: 1.0, hill: 1.4, river: 0.3, riverName: '黒瀬川' },
  nuta:    { mount: 1.1, forest: 1.1, hill: 1.1, river: 0.8, riverName: '沼田川' },
  bingon:  { mount: 1.5, forest: 1.4, hill: 1.3, river: 0.8, riverName: '西城川' },
  bingos:  { mount: 0.7, forest: 0.8, hill: 1.0, river: 0.9, riverName: '芦田川' },
  iwamiw:  { mount: 1.6, forest: 1.5, hill: 1.0, river: 0.8, riverName: '津和野川' },
  iwamie:  { mount: 1.5, forest: 1.4, hill: 1.0, river: 0.95, riverName: '江の川' },
  izumo:   { mount: 1.0, forest: 1.0, hill: 1.0, river: 0.9, riverName: '飯梨川' },
  hoki:    { mount: 0.8, forest: 0.9, hill: 1.0, river: 0.85, riverName: '日野川' },
  inaba:   { mount: 1.0, forest: 1.0, hill: 1.0, river: 0.9, riverName: '千代川' },
  mimasaka:{ mount: 1.4, forest: 1.3, hill: 1.3, river: 0.9, riverName: '旭川' },
  bitchu:  { mount: 1.2, forest: 1.1, hill: 1.2, river: 0.9, riverName: '高梁川' },
  bizen:   { mount: 0.9, forest: 0.9, hill: 1.2, river: 0.5, riverName: '八塔寺川' }
};
// ---- 世界ヘックス地図（world.js）：中国地方 ぜんたいを 1まいの ヘックスで ----
var WM = null;
function worldMap() {
  if (WM || typeof WORLD === 'undefined') return WM;
  function unrle(s) { var out = [], i = 0; while (i < s.length) { var ch = s[i++], n = ''; while (i < s.length && s.charCodeAt(i) >= 48 && s.charCodeAt(i) <= 57) n += s[i++]; var k = n ? +n : 1; for (var j = 0; j < k; j++) out.push(ch); } return out; }
  var T = unrle(WORLD.terr), P = unrle(WORLD.prov);
  var KX = 111.32 * Math.cos(WORLD.latm * Math.PI / 180), KY = 110.57, RH = WORLD.d * 0.8660254;
  WM = { w: WORLD.w, h: WORLD.h, T: T, P: P, KX: KX, KY: KY,
    at: function (c, r) { return c < 0 || r < 0 || c >= WORLD.w || r >= WORLD.h ? null : T[r * WORLD.w + c]; },
    provAt: function (c, r) { if (c < 0 || r < 0 || c >= WORLD.w || r >= WORLD.h) return null; var ch = P[r * WORLD.w + c]; return ch >= 'a' && ch <= 'z' ? WORLD.provs[ch.charCodeAt(0) - 97] : null; },
    km: function (c, r) { return [WORLD.d * (c + 0.5 * (r & 1)), RH * r]; },
    hexAtKm: function (x, y) { var r = Math.round(y / RH); return [Math.round(x / WORLD.d - 0.5 * (r & 1)), r]; },
    ll: function (c, r) { var q = this.km(c, r); return [WORLD.lon0 + q[0] / KX, WORLD.lat0 - q[1] / KY]; } };
  // 道の 一覧
  WM.route = {};
  WORLD.routes.forEach(function (rt) { if (!WM.route[rt.a]) WM.route[rt.a] = {}; if (!WM.route[rt.b]) WM.route[rt.b] = {}; WM.route[rt.a][rt.b] = rt; WM.route[rt.b][rt.a] = rt; });
  return WM;
}
// 国どうしの 道（type: land=平地の道, pass=峠道, sea=海路, none=山で とおれない）
function routeOf(a, b) { var w = worldMap(); return w && w.route[a] ? w.route[a][b] || null : null; }
// 道の マス（a から b の じゅん）
function routePath(a, b) { var rt = routeOf(a, b); if (!rt || !rt.path) return null; return rt.a === a ? rt.path : rt.path.slice().reverse(); }
var ROUTE_LABEL = { land: '陸路', pass: '峠道', sea: '海路', none: '山で とおれない' };
function routeText(a, b) { var rt = routeOf(a, b); if (!rt) return ''; return rt.type === 'pass' ? (rt.name && rt.name !== '峠道' ? '峠道（' + rt.name + '）' : '峠道') : ROUTE_LABEL[rt.type]; }
// 道で つながる となり（地図の 国境が となりでも、けわしい 山で 道が なければ となりでは ない）
if (typeof WORLD !== 'undefined') {
  ADJ = {};
  WORLD.provs.forEach(function (p) { ADJ[p] = []; });
  WORLD.routes.forEach(function (rt) { if (rt.type === 'none') return; ADJ[rt.a].push(rt.b); ADJ[rt.b].push(rt.a); });
}
var DIR8 = ['東', '北東', '北', '北西', '西', '南西', '南', '南東'];
function dirName(e, n) { var a = Math.atan2(n, e); return DIR8[((Math.round(a / (Math.PI / 4)) % 8) + 8) % 8]; }
var BKM = 1 / Math.sqrt(3);
var BATTLE_MAX_H = 32;   // 合戦マップの いちばん 大きい 高さ（行）   // 合戦マップの 1単位（ヘックス半径）＝ 世界地図の マス間隔(1km) ÷ √3
// 合戦の 地形：世界地図から 城の まわりを きりだす（攻め手の 道が 画面の 下から くるように 回す）
function battleEnv(S, b) {
  var w = worldMap(); if (!w) return null;
  var cas = castleHexOf(b.to, b.castleId), K = w.km(cas[0], cas[1]);
  var st0 = b.srcCastle && branchHexes() && branchHexes()[b.srcCastle] ? branchHexes()[b.srcCastle] : WORLD.castles[b.from];   // 支城から 出る ときは その 支城から
  var path = (b.from !== b.to && routePath(b.from, b.to)) || [st0, cas];
  if (b.srcCastle && b.from !== b.to) path = [st0].concat(path);
  if (b.from !== b.to && b.castleId) {   // 支城：道を 支城の ところで きる
    var bi = 0, bd = 1e9; path.forEach(function (h, i) { var dd = Math.hypot(h[0] - cas[0], h[1] - cas[1]); if (dd < bd) { bd = dd; bi = i; } });
    path = path.slice(0, bi + 1).concat([cas]);
  }
  var rtype = (routeOf(b.from, b.to) || {}).type || 'land';
  // 世界(km, 東=+x 南=+y) ⇔ 合戦(右, 下)
  var d = [0, 1], rt = [1, 0];
  function setDown(v) { var L = Math.hypot(v[0], v[1]) || 1; d = [v[0] / L, v[1] / L]; rt = [-d[1], d[0]]; }
  function toWorld(dx, dy) { return [K[0] + (dx * rt[0] + dy * d[0]) * BKM, K[1] + (dx * rt[1] + dy * d[1]) * BKM]; }
  function toBattle(x, y) { var vx = (x - K[0]) / BKM, vy = (y - K[1]) / BKM; return [vx * rt[0] + vy * rt[1], vx * d[0] + vy * d[1]]; }
  // 攻め手の 道が 城から dist km の ところ（いちばん 遠い 点）を 下に する
  function pointOnPath(pth, dist) {
    var best = null;
    for (var i = pth.length - 1; i >= 0; i--) { var q = w.km(pth[i][0], pth[i][1]); var dd = Math.hypot(q[0] - K[0], q[1] - K[1]); if (dd <= dist) best = q; else if (best) break; }
    return best || w.km(pth[0][0], pth[0][1]);
  }
  var env = { prof: { mount: 0, forest: 0, hill: 0, river: 0 }, world: true, route: rtype, routeName: routeText(b.from, b.to),
    from: b.from, fromName: b.srcCastle ? brName(b.srcCastle) : PROV_BY[b.from].name, to: b.to, toName: PROV_BY[b.to].name, names: {} };
  // 国ざかい（道が この 国に はいる ところ）から はじめる：その きょりまで 地図を のばす
  function entryKm(pth) {
    for (var i = 0; i < pth.length; i++) if (w.provAt(pth[i][0], pth[i][1]) === b.to) { var q = w.km(pth[i][0], pth[i][1]); return Math.hypot(q[0] - K[0], q[1] - K[1]); }
    return 0;
  }
  var ek = b.from !== b.to ? entryKm(path) : 0;
  env.entryKm = ek;
  if (ek > 0) { env.minH = Math.min(BATTLE_MAX_H, Math.ceil((ek + 2) / (1.5 * BKM)) + 9); if (env.minH > 22) env.minW = Math.min(27, env.minH - 4); }
  // 援軍の 入口：となりの 国は 道が この 国に はいる ところ、おなじ 国の 城は その 城の ばしょ
  var bh9 = branchHexes() || {};
  env.defFronts = (b.defFronts || []).map(function (f) { return defEntryInfo(S, b, f.src); });
  // 同時攻撃：ほかの 国からの 道
  env.fronts = (b.fronts || []).slice(1).map(function (f) {
    var s0 = f.castle && bh9[f.castle] ? bh9[f.castle] : WORLD.castles[f.from];
    var rp = f.from !== b.to ? routePath(f.from, b.to) : null, pth = rp ? (f.castle ? [s0].concat(rp) : rp) : [s0, cas], fq = w.km(s0[0], s0[1]);
    return { from: f.from, name: f.castle ? brName(f.castle) : PROV_BY[f.from].name, path: pth, inTo: pth.map(function (h) { return w.provAt(h[0], h[1]) === b.to; }),
             ang: Math.atan2(0, 0), dir: dirName(fq[0] - K[0], K[1] - fq[1]), sea: (routeOf(f.from, b.to) || {}).type === 'sea' };
  });
  PROVS.forEach(function (p) { env.names[p.id] = p.name; });
  // generateRows から よばれる：地図の 大きさが きまったら 向きを きめる
  env.setup = function (Wd, Hd, kx, ky) {
    var bottom = (1.5 * (Hd - 1) - ky) * BKM;
    var q = pointOnPath(path, Math.max(3, bottom * 0.95));
    setDown([q[0] - K[0], q[1] - K[1]]);
    env.north = Math.atan2(-d[1], -rt[1]);   // 画面での 北（ラジアン）
    var fp = w.km(st0[0], st0[1]); env.fromDir = dirName(fp[0] - K[0], K[1] - fp[1]);
  };
  // 合戦の マス(dx,dy は 本丸からの ずれ)の 地形
  env.land = function (dx, dy) {
    var p = toWorld(dx, dy), h = w.hexAtKm(p[0], p[1]), t = w.at(h[0], h[1]);
    if (t === null || t === 'X') t = 'M';
    if (t === '=') t = '.';
    var pv2 = w.provAt(h[0], h[1]), bd = pv2 && S.provs[pv2].bld ? S.provs[pv2].bld[h[0] + ',' + h[1]] : null;
    if (h[0] === cas[0] && h[1] === cas[1]) bd = null;
    return { sea: t === 's', t: t, prov: pv2, bld: bd || null };
  };
  // 道（世界地図の 道すじを 合戦の 座標で）
  env.roads = function () {
    var out = [];
    WORLD.routes.forEach(function (r0) {
      if (!r0.path || r0.type === 'none') return;
      var pts = r0.path.map(function (h) { var q = w.km(h[0], h[1]); return toBattle(q[0], q[1]); });
      out.push({ pts: pts, sea: r0.type === 'sea', a: r0.a, b: r0.b });
    });
    return out;
  };
  // 守りの 退き口：みかたの となりの 国への 道が 地図の そとへ でる ところ
  env.escapes = [];
  if (b.defClan) ADJ[b.to].forEach(function (q) {
    if (q === b.from || S.provs[q].owner !== b.defClan) return;
    var pth = routePath(b.to, q); if (!pth) return;
    var fq = w.km(WORLD.castles[q][0], WORLD.castles[q][1]);
    env.escapes.push({ to: q, name: PROV_BY[q].name, path: pth, dir: dirName(fq[0] - K[0], K[1] - fq[1]), sea: (routeOf(b.to, q) || {}).type === 'sea' });
  });
  // 支城の 守りは 同じ 家の 本城へ にげられる
  if (b.castleId && b.defClan && S.provs[b.to].owner === b.defClan) {
    var mc = WORLD.castles[b.to], ln = [], n = Math.max(1, Math.round(Math.hypot(mc[0] - cas[0], mc[1] - cas[1])));
    for (var i = 0; i <= n; i++) ln.push([Math.round(cas[0] + (mc[0] - cas[0]) * i / n), Math.round(cas[1] + (mc[1] - cas[1]) * i / n)]);
    var mk = w.km(mc[0], mc[1]);
    env.escapes.unshift({ to: b.to, name: castleNameOf(S, b.to), path: ln, dir: dirName(mk[0] - K[0], K[1] - mk[1]) });
  }
  env.toBattle = function (h) { var q = w.km(h[0], h[1]); return toBattle(q[0], q[1]); };
  return env;
}
var PROV_BY = {}; PROVS.forEach(function (p, i) { p.idx = i; PROV_BY[p.id] = p; });
var TEPPO_YEAR = 1543;   // 鉄砲 伝来

// ---- シナリオ ----
var SCENARIOS = [
  { id:'1523', year:1523, season:1, title:'元就 家督を つぐ', sub:'1523年（大永3年）夏',
    desc:'おいの 幸松丸が なくなり、27さいの 毛利元就が 毛利家の 当主に。毛利は 安芸の 吉田だけを おさめる 小さな 国人。西の 大内、北の 尼子という 二つの 大勢力に はさまれて いる。',
    order:['mori','ouchi','amago','kikkawa','takeda','kobayakawa','yamanouchi','yamana','yoshimi','ogasawara','sho','urakami'],
    clans: {
      mori:       { lord:'毛利元就', st:[78,92,100], desc:'安芸 吉田郡山城の 若き 当主。いまは 尼子家に したがっている。ここから 中国地方の 統一を めざす！' },
      ouchi:      { lord:'大内義興', st:[84,86,82], desc:'周防・長門を 本拠に 北九州まで おさめる 西国 一の 大名。安芸にも 鏡山城・桜尾城を もつ。' },
      amago:      { lord:'尼子経久', st:[86,86,98], desc:'出雲の 謀将。いきおいに のって 安芸・石見・伯耆へ 手を のばす。' },
      kikkawa:    { lord:'吉川興経', st:[72,50,50], desc:'安芸 大朝の 国人。毛利と 縁が ふかい。' },
      takeda:     { lord:'武田光和', st:[82,55,55], desc:'安芸 佐東銀山城の 城主。もとは 安芸の 守護の 家がら。' },
      kobayakawa: { lord:'小早川興平', st:[62,66,66], desc:'安芸 沼田の 国人。瀬戸内の 水軍を もつ。' },
      yamanouchi: { lord:'山内直通', st:[64,60,60], desc:'備後 北部、甲山城の 国人。' },
      yamana:     { lord:'山名誠豊', st:[55,64,60], desc:'備後・伯耆・因幡に 力を もつ 名門。' },
      yoshimi:    { lord:'吉見頼興', st:[66,60,62], desc:'石見 津和野の 国人。' },
      ogasawara:  { lord:'小笠原長隆', st:[64,56,56], desc:'石見 温湯城の 国人。この 近くで のちに 銀山が みつかる。' },
      sho:        { lord:'庄為資', st:[70,60,62], desc:'備中の 国人。' },
      urakami:    { lord:'浦上村宗', st:[72,70,70], desc:'備前 三石城の 実力者。美作にも 力を のばす。' }
    },
    start: {
      mori:       { gold:60,  provs:{ yoshida:{ ashigaru:3, yumi:1, kiba:1 } } },
      ouchi:      { gold:220, provs:{ suo:{ ashigaru:5, yumi:2, kiba:2, kosaku:1 }, nagato:{ ashigaru:4, yumi:1, kiba:1 }, akiw:{ ashigaru:3, yumi:2 }, kagami:{ ashigaru:4, yumi:2, kosaku:1 } } },
      amago:      { gold:160, provs:{ izumo:{ ashigaru:6, yumi:2, kiba:2, kosaku:1, ninja:1 } } },
      kikkawa:    { gold:50,  provs:{ oasa:{ ashigaru:3, yumi:1, kiba:1 } } },
      takeda:     { gold:70,  provs:{ sato:{ ashigaru:4, yumi:2, kiba:1, kosaku:1 } } },
      kobayakawa: { gold:50,  provs:{ nuta:{ ashigaru:3, yumi:2, kiba:1 } } },
      yamanouchi: { gold:50,  provs:{ bingon:{ ashigaru:3, yumi:1, kiba:1 } } },
      yamana:     { gold:120, provs:{ bingos:{ ashigaru:4, yumi:1, kiba:1 }, hoki:{ ashigaru:3, yumi:1, kiba:1 }, inaba:{ ashigaru:3, yumi:2 } } },
      yoshimi:    { gold:50,  provs:{ iwamiw:{ ashigaru:3, yumi:2, kosaku:1 } } },
      ogasawara:  { gold:40,  provs:{ iwamie:{ ashigaru:3, yumi:1 } } },
      sho:        { gold:60,  provs:{ bitchu:{ ashigaru:4, yumi:1, kiba:1 } } },
      urakami:    { gold:90,  provs:{ bizen:{ ashigaru:4, yumi:1, kiba:1 }, mimasaka:{ ashigaru:3, yumi:1 } } }
    },
    allies: [['mori', 'amago'], ['mori', 'kikkawa'], ['amago', 'takeda']]
  },
  { id:'1554', year:1554, season:0, title:'厳島の 戦い 前夜', sub:'1554年（天文23年）春',
    desc:'毛利元就は 安芸・備後の 国人を まとめあげた。大内家の 実権を にぎった 陶晴賢と ついに 対決する！',
    order:['mori','ouchi','amago','yoshimi','mimura','urakami','yamana'],
    clans: {
      mori:    { lord:'毛利元就', st:[78,92,100], desc:'安芸・備後を まとめた 知将。「三本の矢」の おしえで 有名。ここから 中国地方の 統一を めざす！' },
      ouchi:   { lord:'陶晴賢', st:[90,58,70], name:'陶家（大内）', crest:'陶', desc:'大内家の 実権を にぎる 猛将。周防・長門を おさえる 中国地方 最大の 勢力。' },
      amago:   { lord:'尼子晴久', st:[80,72,72], desc:'出雲の 月山富田城に いる 山陰の 雄。かたい 城と 多くの 兵を もつ。' },
      yoshimi: { lord:'吉見正頼', st:[74,64,70], desc:'石見 津和野の 大名。陶家と 対立し、毛利と 手を むすぶ。' },
      mimura:  { lord:'三村家親', st:[80,66,70], desc:'備中の 大名。備中を まとめつつある。' },
      urakami: { lord:'浦上宗景', st:[74,72,78], desc:'備前の 大名。東の いりぐちを まもる。' },
      yamana:  { lord:'山名豊定', st:[50,60,58], desc:'因幡の 守護。名門だが 力は おとろえ気味。' }
    },
    castles: { bitchu:'備中松山城', bizen:'天神山城', iwamie:'山吹城' },
    start: {
      mori:    { gold:200, provs:{ yoshida:{ ashigaru:5, yumi:2, kiba:1, kosaku:1, ninja:1 }, oasa:{ ashigaru:4, yumi:2, kiba:1 }, sato:{ ashigaru:5, yumi:2, kiba:1 }, nuta:{ ashigaru:4, yumi:2, kosaku:1 }, bingon:{ ashigaru:4, yumi:1 }, bingos:{ ashigaru:4, yumi:2, kiba:1 } } },
      ouchi:   { gold:220, provs:{ suo:{ ashigaru:6, yumi:3, kiba:2, teppo:1, kosaku:1 }, nagato:{ ashigaru:4, yumi:1, kiba:1 }, akiw:{ ashigaru:3, yumi:2, kosaku:1 }, kagami:{ ashigaru:4, yumi:2, teppo:1 }, iwamie:{ ashigaru:3, yumi:1 } } },
      amago:   { gold:180, provs:{ izumo:{ ashigaru:6, yumi:2, kiba:2, teppo:1, kosaku:1, ninja:1 }, hoki:{ ashigaru:4, yumi:1, kiba:1 }, mimasaka:{ ashigaru:4, yumi:1 } } },
      yoshimi: { gold:60,  provs:{ iwamiw:{ ashigaru:4, yumi:2, kosaku:1 } } },
      mimura:  { gold:70,  provs:{ bitchu:{ ashigaru:4, yumi:1, kiba:1 } } },
      urakami: { gold:80,  provs:{ bizen:{ ashigaru:4, yumi:1, kiba:1, teppo:1 } } },
      yamana:  { gold:60,  provs:{ inaba:{ ashigaru:3, yumi:2 } } }
    },
    allies: [['mori', 'yoshimi']]
  }
];
var SCEN_BY = {}; SCENARIOS.forEach(function (s) { SCEN_BY[s.id] = s; });
function applyScenario(sid) {
  var sc = SCEN_BY[sid] || SCENARIOS[0];
  if (typeof CUR_SCEN !== 'undefined') CUR_SCEN = sc.id;
  CLANS = {}; CLAN_ORDER = sc.order.slice();
  CLAN_ORDER.forEach(function (cid) {
    var b = CLAN_BASE[cid], o = sc.clans[cid] || {}, c = { id: cid };
    for (var k in b) c[k] = b[k];
    for (var k2 in o) c[k2] = o[k2];
    CLANS[cid] = c;
  });
  CLANS[IKKI] = { id: IKKI, name: '一揆衆', lord: '一揆の 頭目', crest: '一', color: '#8d8a5c', aggr: 0 };
  return sc;
}
function castleNameOf(S, pid) { var sc = SCEN_BY[S.scenario]; return (sc && sc.castles && sc.castles[pid]) || PROV_BY[pid].castleName; }
function silverOf(S, pid) { var p = PROV_BY[pid]; return (p.silver && S.year >= (p.silverYear || 0)) ? p.silver : 0; }
function teppoOk(S) { return S.year >= TEPPO_YEAR; }
applyScenario('1523');

var SEASONS = ['はる', 'なつ', 'あき', 'ふゆ'];
var SEASONS_K = ['春', '夏', '秋', '冬'];
var GOLD_PER_COST = 10;      // へいの コスト1 あたりの 金
var DEVELOP_COST = 50;       // 内政
var PROV_CAP = 19;           // 1つの 国に おける へいの かず
var HEAL_PER_SEASON = 2;
var BASE_INCOME = 5;      // どの りょうちにも まいきせつ はいる 商いの 収入
var NENGU = 6;            // 秋の 年貢（石高 × 6。五公五民の とき）
// ---- 年貢の 割合と 農民の 不満・一揆 ----
var IKKI = 'ikki';
var TAX_MIN = 0.3, TAX_MAX = 0.7, TAX_DEF = 0.5, IKKI_LINE = 60;
function taxOf(P) { return P.tax === undefined ? TAX_DEF : P.tax; }
function taxName(t) { var k = Math.round(t * 10); return k + '公' + (10 - k) + '民'; }
function setTax(S, pid, t) { var P = S.provs[pid]; if (P.owner !== S.player) return { ok: false }; P.tax = Math.round(Math.max(TAX_MIN, Math.min(TAX_MAX, t)) * 10) / 10; return { ok: true }; }
// 1きせつ ごとの 不満の ふえかた（年貢が おもいほど ふえる。政の たかい 城主・町は しずめる）
function fumanDelta(S, pid) {
  var P = S.provs[pid], o = S.officers ? officerAt(S, pid) : null;
  return (taxOf(P) - 0.5) * 60 - 2 - (offP(o) - 50) / 25 - Math.min(3, bldCount(P, 'town'));
}
function fumanWord(f) { return f >= IKKI_LINE ? '一揆寸前！' : f >= 45 ? 'あぶない' : f >= 25 ? 'ざわざわ' : 'おだやか'; }
function ikkiSize(P) { return Math.max(3, Math.min(12, Math.round(P.koku * 0.6))); }
// 一揆が おきる：守りが かてば しずまる。まければ 国は 一揆衆の ものに
function ikkiRise(S, pid) {
  var P = S.provs[pid], old = P.owner, nm = PROV_BY[pid].name, n = ikkiSize(P), reb = [];
  for (var i = 0; i < n; i++) reb.push(newUnit(S, i % 4 === 3 ? 'yumi' : 'ashigaru'));
  var dS = strength(P.units) * 1.25 * (0.8 + cRand(S) * 0.4), aS = strength(reb) * (0.75 + cRand(S) * 0.5) * (0.8 + P.fuman / 250);
  var who = old === S.player ? 'bad' : 'sys';
  if (dS >= aS) {
    P.units.forEach(function (u) { u.hp = Math.max(1, u.hp - 1 - Math.floor(cRand(S) * 3)); });
    P.fuman = 40; P.koku = Math.max(1, Math.round(P.koku * 0.95 * 10) / 10);
    logC(S, nm + 'で 一揆が おきた！ ' + CLANS[old].name + 'が しずめたが、田畑が あれた', who);
    return { put: true };
  }
  // 守りの 生きのこりは となりの じぶんの 国へ
  var esc = ADJ[pid].filter(function (q) { return S.provs[q].owner === old; });
  if (esc.length) { var D = S.provs[esc[0]]; D.units = D.units.concat(P.units.map(function (u) { return { uid: u.uid, type: u.type, hp: Math.max(1, Math.floor(u.hp / 2)) }; }).slice(0, Math.max(0, PROV_CAP - D.units.length))); }
  var lost = P.officer && S.officers ? S.officers[P.officer] : null;
  if (lost) { lost.prov = null; if (!lost.lord && !esc.length) delete S.officers[lost.id]; }
  P.officer = null; P.naio = null;
  P.owner = IKKI; P.units = reb; P.tax = TAX_MIN; P.fuman = 0; P.done = {};
  if (S.castles) branchesIn(S, pid).forEach(function (c) { if (c.owner === old) { c.owner = IKKI; c.units = [newUnit(S, 'ashigaru'), newUnit(S, 'ashigaru')]; } });
  logC(S, nm + 'で 大一揆！ 農民が ' + CLANS[old].name + 'を おいだし、一揆衆が 国を おさめた', who);
  checkClans(S);
  if (S.officers && S.clans[old] && S.clans[old].alive) autoAssign(S, old, old !== S.player);
  return { taken: true };
}
// 1きせつ ごとの 不満・一揆の しょり
function seasonFuman(S) {
  if (!S.clans[IKKI]) S.clans[IKKI] = { gold: 0, alive: true };
  PROVS.forEach(function (p) {
    var P = S.provs[p.id]; if (!P.owner) return;
    if (P.owner === IKKI) {   // 一揆衆の 国：農民が あつまって 兵が もどる
      if (P.units.length < ikkiSize(P)) P.units.push(newUnit(S, 'ashigaru'));
      return;
    }
    P.fuman = Math.max(0, Math.min(100, (P.fuman || 0) + fumanDelta(S, p.id) + (P.warHit || 0))); P.warHit = 0;
    if (P.fuman >= IKKI_LINE && cRand(S) < (P.fuman - IKKI_LINE + 10) / 70) ikkiRise(S, p.id);
    else if (P.owner === S.player && P.fuman >= 45) logC(S, PROV_BY[p.id].name + 'の 農民が 不満を つのらせている（不満 ' + Math.round(P.fuman) + '）', 'bad');
  });
}
var KAN = 100;            // 画面では お金 ×100 を「貫」で あらわす
function kan(g) { return (Math.round(g) * KAN).toLocaleString('ja-JP') + '貫'; }
var MEN_PER_KOKU = 250;   // 1万石あたり 250人（動員の めやす）
var LUCK_SPREAD = 3.2;
var CASTLE_MULT = { hira:1.35, toride:1.3, yama:1.45, mizu:1.4, nino:1.45, umi:1.4, oo:1.6 };
function castleMult(id) { if (CASTLE_MULT[id]) return CASTLE_MULT[id]; var cs = CASTLES[castleIndexOf(id)]; return (cs && cs.mult) || 1.4; }

var ERAS = [[1504, '永正'], [1521, '大永'], [1528, '享禄'], [1532, '天文'], [1555, '弘治'], [1558, '永禄'], [1570, '元亀'], [1573, '天正'], [1592, '文禄'], [1596, '慶長'], [1615, '元和']];
function eraName(year) {
  var e = ERAS[0];
  for (var i = 0; i < ERAS.length; i++) if (year >= ERAS[i][0]) e = ERAS[i];
  var n = year - e[0] + 1;
  return e[1] + (n === 1 ? '元' : n);
}

// ---- 乱数 ----
function cRand(S) { S.rng = (S.rng * 1103515245 + 12345) & 0x7fffffff; return S.rng / 0x7fffffff; }

// ---- 作成 ----
function newCampaign(opts) {
  var sc = applyScenario(opts.scenario || '1523');
  var S = { v: 3, scenario: sc.id, year: sc.year, season: sc.season, turn: 1, player: opts.clan || 'mori', allies: (sc.allies || []).map(function (a) { return a.slice(); }), face: opts.face || 'fute', difficulty: opts.difficulty || 'normal',
            seed: opts.seed || (1 + Math.floor(Math.random() * 1e9)), rng: 0, uid: 1, clans: {}, provs: {}, log: [], over: false, winner: null,
            phase: 'player', cpu: null };
  S.rng = S.seed & 0x7fffffff;
  CLAN_ORDER.forEach(function (cid) {
    var st = sc.start[cid];
    var gold = st.gold;
    if (cid === S.player) gold += S.difficulty === 'easy' ? 100 : S.difficulty === 'hard' ? -40 : 0;
    S.clans[cid] = { gold: gold, alive: true };
  });
  S.clans[IKKI] = { gold: 0, alive: true };
  PROVS.forEach(function (p) { S.provs[p.id] = { owner: null, koku: p.koku, units: [], acted: false, tax: TAX_DEF, fuman: 10 }; });
  CLAN_ORDER.forEach(function (cid) {
    var st = sc.start[cid];
    for (var pid in st.provs) {
      var P = S.provs[pid]; P.owner = cid;
      var a = st.provs[pid];
      for (var t in a) for (var i = 0; i < a[t]; i++) P.units.push(newUnit(S, t));
    }
  });
  logC(S, eraName(S.year) + '年（' + S.year + '）' + SEASONS_K[S.season] + '。' + CLANS[S.player].lord + 'の 国取りが はじまった！', 'sys');
  PROVS.forEach(function (p) { if (!S.provs[p.id].owner) throw new Error('no owner ' + p.id); });
  PROVS.forEach(function (p) { initDomain(S, p.id); });
  initCastles(S);
  initOfficers(S);
  S.firedEv = {}; S.pendingEvents = []; S.history = []; S.clanOv = {}; S.fieldFix = 1;
  if (typeof fireEvents === 'function') fireEvents(S);
  return S;
}
function newUnit(S, type) { return { uid: S.uid++, type: type, hp: 10 }; }
function logC(S, text, kind) { S.logSeq = (S.logSeq || 0) + 1; S.log.push({ y: S.year, s: S.season, text: text, kind: kind || 'sys', n: S.logSeq }); if (S.log.length > 400) S.log.shift(); }

// ---- 便利関数 ----
function provsOf(S, cid) { return PROVS.filter(function (p) { return S.provs[p.id].owner === cid; }).map(function (p) { return p.id; }); }
function strength(units) { var s = 0; units.forEach(function (u) { var T = UNIT_TYPES[u.type]; s += (T.atk * 0.6 + T.def * 0.4) * u.hp / 10; }); return s; }
function defStrength(S, pid) { var o = S.officers ? officerAt(S, pid) : null; return strength(S.provs[pid].units) * castleMult(PROV_BY[pid].castle) * lvMult(S.provs[pid].clv) * (S.provs[pid].ruin ? RUIN_DEF : 1) * warMult(o) * (1 + (offI(o) - 50) / 400) + 1; }
function isFrontier(S, pid) { var o = S.provs[pid].owner; return ADJ[pid].some(function (q) { return S.provs[q].owner !== o; }); }
function provRevenue(S, pid) { var o = S.officers ? officerAt(S, pid) : null; return ((S.season === 2 ? S.provs[pid].koku * NENGU * taxOf(S.provs[pid]) / TAX_DEF : 0) + silverOf(S, pid) + BASE_INCOME + bldIncome(S, pid)) * (1 + (offP(o) - 50) / 200); }
function lostShare(S, pid) { var own = S.provs[pid].owner, n = 0; branchesIn(S, pid).forEach(function (c) { if (c.owner && c.owner !== own) n += branchShare(c.id); }); return n; }
// 国の 収入を 所領の 持ち主ごとに わける：年貢は 田畑の かず、商い・銀は 土地の ひろさ、建物は たっている 所領の 持ち主へ
function regOwnerOf(S, id) { return id.indexOf('_') > 0 ? (S.castles && S.castles[id] ? S.castles[id].owner : null) : S.provs[id].owner; }
function provRegions(S, pid) {
  var P = S.provs[pid], out = [{ id: pid, owner: P.owner, land: 1 }];
  branchesIn(S, pid).forEach(function (c) { var l = branchShare(c.id); out[0].land -= l; out.push({ id: c.id, owner: c.owner || P.owner, land: l }); });
  var F = 0, fc = {}, bi = {}, d = domData();
  if (P.bld) for (var k in P.bld) {
    var xy = k.split(','), rid = regionAt(+xy[0], +xy[1]) || pid, b = P.bld[k];
    if (b === 'field') { F++; fc[rid] = (fc[rid] || 0) + 1; }
    else if (b === 'town' || b === 'meibutsu' || b === 'salt') bi[rid] = (bi[rid] || 0) + BLD[b].inc;
    else if (b === 'mine' && d && d[pid].dep[k]) bi[rid] = (bi[rid] || 0) + MINE_INC[d[pid].dep[k].type];
  }
  out.forEach(function (g) { g.fields = fc[g.id] || 0; g.fshare = F ? g.fields / F : g.land; g.bld = bi[g.id] || 0; });
  return out;
}
function regTax(S, g) { return g.id.indexOf('_') > 0 && S.castles[g.id] && g.owner !== S.provs[S.castles[g.id].prov].owner ? (S.castles[g.id].tax || TAX_DEF) : taxOf(S.provs[g.id.split('_')[0]]); }
// { 家: 収入 }（autumn=true で 秋の 年貢を いれて 見つもる）
function provSplit(S, pid, autumn) {
  var P = S.provs[pid], o = S.officers ? officerAt(S, pid) : null, om = 1 + (offP(o) - 50) / 200, out = {};
  var nen = (autumn || S.season === 2) ? P.koku * NENGU : 0, base = BASE_INCOME + silverOf(S, pid);
  provRegions(S, pid).forEach(function (g) {
    if (!g.owner || g.owner === IKKI) return;
    var v = (nen * g.fshare * regTax(S, g) / TAX_DEF + base * g.land + g.bld) * (g.owner === P.owner ? om : 1);
    out[g.owner] = (out[g.owner] || 0) + v;
  });
  return out;
}
// その 家が この 国で とる 年貢（秋）
function nenguOf(S, pid, cid) {
  var P = S.provs[pid], o = S.officers ? officerAt(S, pid) : null, om = 1 + (offP(o) - 50) / 200, v = 0;
  provRegions(S, pid).forEach(function (g) { if (g.owner === cid) v += P.koku * NENGU * g.fshare * regTax(S, g) / TAX_DEF * (cid === P.owner ? om : 1); });
  return v;
}
function kokuShareOf(S, pid, cid) { var v = 0; provRegions(S, pid).forEach(function (g) { if (g.owner === cid) v += g.fshare; }); return v; }
function income(S, cid) {
  var g = 0;
  PROVS.forEach(function (p) { var sp = provSplit(S, p.id); if (sp[cid]) g += sp[cid]; });
  g = Math.round(g);
  if (cid !== S.player) { if (S.difficulty === 'hard') g = Math.round(g * 1.3); if (S.difficulty === 'easy') g = Math.round(g * 0.8); }
  return g;
}
function totalKoku(S, cid) { var k = 0; provsOf(S, cid).forEach(function (pid) { k += S.provs[pid].koku; }); return k; }
// 支城の 所領を いれた 石高（表示用）
function effKoku(S, cid) {
  var k = 0; PROVS.forEach(function (p) { var sh = kokuShareOf(S, p.id, cid); if (sh) k += S.provs[p.id].koku * sh; });
  return k;
}
function totalUnits(S, cid) { var n = 0; provsOf(S, cid).forEach(function (pid) { n += S.provs[pid].units.length; }); if (S.castles) for (var k in S.castles) if (S.castles[k].owner === cid) n += S.castles[k].units.length; return n; }
// 支城と 兵を 出し入れ できる 国：本城が 同じ 家なら 本城、ちがえば となりの じぶんの 国
function castleLinks(S, castleId) {
  var C0 = S.castles[castleId]; if (!C0 || !C0.owner) return [];
  if (S.provs[C0.prov].owner === C0.owner) return [C0.prov];
  return ADJ[C0.prov].filter(function (q) { return S.provs[q].owner === C0.owner && routeOf(C0.prov, q) && routeOf(C0.prov, q).type !== 'none'; });
}
// 支城の 守備兵を 出し入れ（pid の 軍と。省略で 本城）
function garrison(S, castleId, uidsIn, uidsOut, pid) {
  var C0 = S.castles[castleId], links = castleLinks(S, castleId);
  pid = pid || links[0];
  if (!pid || links.indexOf(pid) < 0) return { ok: false, msg: '兵を 出し入れ できる みかたの 国が ない' };
  var P = S.provs[pid];
  var mvIn = P.units.filter(function (u) { return uidsIn.indexOf(u.uid) >= 0; }), mvOut = C0.units.filter(function (u) { return uidsOut.indexOf(u.uid) >= 0; });
  if (C0.units.length - mvOut.length + mvIn.length > 8) return { ok: false, msg: '支城には 8たいまで' };
  if (P.units.length - mvIn.length + mvOut.length > PROV_CAP) return { ok: false, msg: PROV_BY[pid].name + 'に はいりきらない' };
  P.units = P.units.filter(function (u) { return uidsIn.indexOf(u.uid) < 0; }).concat(mvOut);
  C0.units = C0.units.filter(function (u) { return uidsOut.indexOf(u.uid) < 0; }).concat(mvIn);
  return { ok: true };
}
// 支城と 国の 兵を まとめて わけなおす：keep に ある uid を 支城へ、ほかを 国へ
function redeploy(S, castleId, pid, uids, keep) {
  var C0 = S.castles[castleId], P = S.provs[pid];
  var pool = C0.units.concat(P.units.filter(function (u) { return uids.indexOf(u.uid) >= 0; }));
  var inC = pool.filter(function (u) { return keep.indexOf(u.uid) >= 0; }), out = pool.filter(function (u) { return keep.indexOf(u.uid) < 0; });
  if (!inC.length) return { ok: false, msg: '支城に 1隊は のこそう' };
  if (inC.length > 8) return { ok: false, msg: '支城には 8たいまで' };
  var rest = P.units.filter(function (u) { return uids.indexOf(u.uid) < 0; });
  if (rest.length + out.length > PROV_CAP) return { ok: false, msg: PROV_BY[pid].name + 'に はいりきらない（' + PROV_CAP + 'たいまで）' };
  C0.units = inC; P.units = rest.concat(out);
  return { ok: true };
}
// おとした 支城に のこす 守備兵の かず
var BRANCH_KEEP = 3;
function unitCost(type) { return UNIT_TYPES[type].cost * GOLD_PER_COST; }
var TEPPO_EARLY = 2;   // 伝来 まえの 鉄砲は 南蛮・明からの ゆにゅう品で ねだん 2ばい
function recruitCost(S, pid, type, o) { if (o === undefined) o = S.officers ? officerAt(S, pid) : null; return Math.max(5, Math.round(unitCost(type) * (type === 'teppo' && !teppoOk(S) ? TEPPO_EARLY : 1) * (1 - (offP(o) - 50) / 400))); }
function maxKoku(pid) { return Math.round(PROV_BY[pid].koku * 1.5); }   // CPU の 内政の めやすに だけ つかう（ルールの 上限では ない）
function cpuKokuGoal(S, pid) { return PROV_BY[pid].koku * (S.difficulty === 'hard' ? 2 : 1.5); }

// ---- 同盟 ----
function isAlly(S, a, b) { if (!a || !b || a === b) return false; return (S.allies || []).some(function (p) { return (p[0] === a && p[1] === b) || (p[0] === b && p[1] === a); }); }
function breakAlliance(S, a, b, why) {
  if (!isAlly(S, a, b)) return;
  S.allies = S.allies.filter(function (p) { return !((p[0] === a && p[1] === b) || (p[0] === b && p[1] === a)); });
  logC(S, CLANS[a].name + 'と ' + CLANS[b].name + 'の 同盟が きれた' + (why ? '（' + why + '）' : ''), (a === S.player || b === S.player) ? 'bad' : 'sys');
}
// ---- 家どうしの 関係：🤝同盟 ／ 中立 ／ ⚔敵対（この 1年に 合戦した）----
var HOSTILE_TURNS = 4;
function warKey(a, b) { return a < b ? a + '|' + b : b + '|' + a; }
function noteWar(S, a, b) { if (!a || !b || a === b) return; (S.wars || (S.wars = {}))[warKey(a, b)] = S.turn; }
function lastWar(S, a, b) { return S.wars ? S.wars[warKey(a, b)] : undefined; }
function relationOf(S, a, b) {
  if (!a || !b || a === b) return 'self';
  if (b === IKKI || a === IKKI) return 'hostile';
  if (isAlly(S, a, b)) return 'ally';
  var w = lastWar(S, a, b); if (w !== undefined && S.turn - w < HOSTILE_TURNS) return 'hostile';
  return 'neutral';
}
var REL_INFO = { ally: { icon: '🤝', name: '同盟', col: '#2e9e4a', desc: 'おたがい せめない' }, neutral: { icon: '〰', name: '中立', col: '#8a8070', desc: 'いまは 合戦して いない。せめて くる ことも ある' }, hostile: { icon: '⚔', name: '敵対', col: '#d9362b', desc: 'この 1年に 合戦した あいて' }, self: { icon: '', name: 'じぶん', col: '#333', desc: '' } };
function alliesOf(S, cid) { var o = []; (S.allies || []).forEach(function (p) { if (p[0] === cid) o.push(p[1]); else if (p[1] === cid) o.push(p[0]); }); return o; }

// ---- 季節のはじめ ----
function seasonStart(S) {
  CLAN_ORDER.forEach(function (cid) {
    if (!S.clans[cid].alive) return;
    var inc = income(S, cid);
    S.clans[cid].gold += inc;
    if (cid === S.player && S.season === 2) logC(S, '秋の 年貢が はいった！ ＋' + kan(inc), 'good');
  });
  PROVS.forEach(function (p) {
    var P = S.provs[p.id]; P.acted = false; P.done = {};
    P.units.forEach(function (u) { u.hp = Math.min(u.full || 10, u.hp + HEAL_PER_SEASON); });
  });
  if (S.castles) for (var k in S.castles) S.castles[k].units.forEach(function (u) { u.hp = Math.min(u.full || 10, u.hp + HEAL_PER_SEASON); });
  seasonFuman(S);
  // CPU は お金が あれば こわれた 城を なおす
  PROVS.forEach(function (p) { var P = S.provs[p.id]; if (P.ruin && P.owner && P.owner !== S.player && S.clans[P.owner] && S.clans[P.owner].gold >= repairCost(S, p.id, null) * 1.5) repairCastle(S, p.id, null); });
  if (S.castles) for (var k2 in S.castles) { var C2 = S.castles[k2]; if (C2.ruin && C2.owner && C2.owner !== S.player && S.clans[C2.owner] && S.clans[C2.owner].gold >= repairCost(S, C2.prov, k2) * 1.5) repairCastle(S, C2.prov, k2); }
  if (S.season === 2) harvestRice(S);
  S.phase = 'player';
}

// ---- 命令 ----
// 1つの 国で、きせつごとに 出陣・徴兵・内政・移動・調略を それぞれ 1回ずつ できる（acted＝とったばかりで うごけない）
var CMD_KINDS = ['attack', 'recruit', 'develop', 'move', 'scheme'];
function didCmd(P, k) { return !!(P.done && P.done[k]); }
function markCmd(P, k) { if (!P.done) P.done = {}; P.done[k] = 1; }
function cmdCount(P) { return P.done ? Object.keys(P.done).length : 0; }
var MAX_CMDS = 3;   // プレイヤーは 1つの 国で きせつごとに 3つまで
function cmdFull(P) { return cmdCount(P) >= MAX_CMDS; }
function canCommand(S, pid) { var P = S.provs[pid]; return !S.over && S.phase === 'player' && P.owner === S.player && !P.acted; }
// こまかく やとう：pts = {type: 1/10隊の かず}。へった 隊を さきに うめて、のこりで 新しい 隊を つくる
// pts：兵種ごとの 人数（1人 から）。o：担当の 家臣
function planRecruit(S, pid, pts, o, cs) {
  var P = cs ? S.castles[cs] : S.provs[pid], cost = 0, newN = 0, fill = 0, plan = {};
  for (var t in pts) {
    var men = Math.max(0, Math.round(pts[t] || 0)); if (!men) continue;
    var k = men * 10 / UNIT_TYPES[t].men;   // 隊の 1/10 を 1 と した かず（はんぱも あり）
    cost += recruitCost(S, pid, t, o) * k / 10;
    var room = 0; P.units.forEach(function (u) { if (u.type === t) room += Math.max(0, 10 - u.hp); });
    var f = Math.min(room, k), rest = k - f;
    fill += f; newN += Math.ceil(rest / 10 - 1e-9); plan[t] = { fill: f, rest: rest, men: men };
  }
  return { cost: Math.round(cost * 100) / 100, newN: newN, fill: fill, plan: plan };
}
// cs：支城（その 支城で やとう。支城 ごとに きせつ 1かい、8たいまで）
function recruitPts(S, pid, pts, oid, cs) {
  var P = cs ? S.castles[cs] : S.provs[pid], cid = P.owner, o = oid ? S.officers[oid] : undefined, pl = planRecruit(S, pid, pts, o, cs), CAP = cs ? 8 : PROV_CAP;
  if (!pl.fill && !pl.newN) return { ok: false, msg: 'へいを えらんでね' };
  if (pl.cost > S.clans[cid].gold) return { ok: false, msg: 'お金が たりない' };
  if (cs && P.rec === S.turn) return { ok: false, msg: 'この 支城は この きせつ もう 徴兵した' };
  if (P.units.length + pl.newN > CAP) return { ok: false, msg: 'この 城には もう はいれない（' + CAP + 'たいまで）' };
  S.clans[cid].gold -= pl.cost;
  var men = 0;
  for (var t in pl.plan) {
    var f = pl.plan[t].fill, rest = pl.plan[t].rest;
    men += pl.plan[t].men;
    // へっている 隊から（すくない じゅん）
    P.units.filter(function (u) { return u.type === t && u.hp < 10; }).sort(function (a, b) { return a.hp - b.hp; })
      .forEach(function (u) { var add = Math.min(10 - u.hp, f); u.hp += add; u.full = Math.max(u.full || 0, u.hp); f -= add; });
    while (rest > 1e-9) { var nu = newUnit(S, t); nu.hp = Math.min(10, rest); nu.full = nu.hp; rest -= nu.hp; P.units.push(nu); }
  }
  if (cs) P.rec = S.turn; else markCmd(P, 'recruit');
  // 大成功：のぞむ 人が おおく あつまる（2わり ふえる、お金は そのまま）
  var prem = 0;
  if (o) { useOfficer(S, oid); if (cRand(S) < premiumP(offP(o))) {
    for (var t2 in pl.plan) {
      var T2 = UNIT_TYPES[t2], extra = pl.plan[t2].men * 0.2 * 10 / T2.men;
      P.units.filter(function (u) { return u.type === t2 && u.hp < 10; }).forEach(function (u) { var a = Math.min(10 - u.hp, extra); u.hp += a; u.full = Math.max(u.full || 0, u.hp); extra -= a; });
      if (extra > 1e-9 && P.units.length < CAP) { var nu2 = newUnit(S, t2); nu2.hp = Math.min(10, extra); nu2.full = nu2.hp; P.units.push(nu2); }
      prem += Math.round(pl.plan[t2].men * 0.2);
    }
  } }
  return { ok: true, cost: pl.cost, n: pl.newN, fill: pl.fill, men: Math.round(men), premium: prem, off: o ? o.name : null };
}
function recruit(S, pid, order) {   // order: {type: count}
  var P = S.provs[pid], cid = P.owner, cost = 0, n = 0;
  for (var t in order) { cost += recruitCost(S, pid, t) * order[t]; n += order[t]; }
  if (n <= 0) return { ok: false, msg: 'へいを えらんでね' };
  if (order.teppo && !teppoOk(S)) return { ok: false, msg: '鉄砲は ' + TEPPO_YEAR + '年に 伝わるまで つかえない' };
  if (cost > S.clans[cid].gold) return { ok: false, msg: 'お金が たりない' };
  if (P.units.length + n > PROV_CAP) return { ok: false, msg: 'この国には もう はいれない（' + PROV_CAP + 'たいまで）' };
  S.clans[cid].gold -= cost;
  for (var t2 in order) for (var i = 0; i < order[t2]; i++) P.units.push(newUnit(S, t2));
  markCmd(P, 'recruit');
  return { ok: true, cost: cost, n: n };
}
// ==== 領内（国の 中の ヘックス）：開墾・町・鉱山・名産・塩田 ====
var BLD = {
  field:    { name: '田畑',  icon: '🌾', cost: 7, desc: '開墾して 石高 +0.5万石。水を ひける ところ（川や 田畑の 近く）なら いくらでも' },
  town:     { name: '町',    icon: '🏘', cost: 14, inc: 2, desc: '市を ひらいて まいきせつ +200貫。町 1つを 田畑 6マスで ささえる' },
  mine:     { name: '鉱山',  icon: '⛏', cost: 20, desc: '鉱脈（◆）を ほる。まいきせつ 収入' },
  meibutsu: { name: '名産',  icon: '🏺', cost: 16, inc: 4, desc: 'その 国の 名産品を つくる 工房（町の となりなら いくつでも）。まいきせつ +400貫' },
  salt:     { name: '塩田',  icon: '🧂', cost: 9, inc: 2, desc: '海べで 塩を つくる。まいきせつ +200貫' },
  saku:     { name: '柵',    icon: '🚧', cost: 3,  war: 1, desc: '木の 柵。合戦で てきの 足を とめる（こわせる）。道や 城の まわりに' },
  hori:     { name: '堀',    icon: '〰', cost: 5, war: 1, desc: '空堀・水堀。合戦で 川のように わたりにくい' },
  toride:   { name: '砦',    icon: '🏰', cost: 16, war: 1, desc: '小さな 城。合戦で 柵に かこまれた 曲輪に なり、守りの へいが こもる（所領に 2つまで）' }
};
// 城の 改築（Lv0〜3）：石垣・門が かたくなり、守りが つよい
var CASTLE_LV_MAX = 3, CASTLE_LV_COST = [25, 50, 80];
function castleLv(S, pid, cid) { return cid ? ((S.castles[cid] && S.castles[cid].lv) || 0) : (S.provs[pid].clv || 0); }
function upgradeCost(S, pid, cid) { var lv = castleLv(S, pid, cid); return lv >= CASTLE_LV_MAX ? null : Math.round(CASTLE_LV_COST[lv] * (cid ? 0.6 : 1)); }
function canUpgrade(S, pid, cid, who) {
  var lv = castleLv(S, pid, cid), cost = upgradeCost(S, pid, cid);
  var own = cid ? S.castles[cid].owner : S.provs[pid].owner; who = who || own;
  if (own !== who) return { ok: false, msg: 'じぶんの 城で ないと できない' };
  if (cost === null) return { ok: false, msg: 'もう いちばん 上（Lv' + CASTLE_LV_MAX + '）' };
  if (isRuined(S, pid, cid)) return { ok: false, msg: 'こわれて いる。さきに 🔨なおす' };
  if (S.clans[who].gold < cost) return { ok: false, msg: 'お金が たりない（💰' + kan(cost) + '）', cost: cost };
  return { ok: true, cost: cost, lv: lv + 1 };
}
function upgradeCastle(S, pid, cid, who) {
  var ch = canUpgrade(S, pid, cid, who); if (!ch.ok) return ch;
  var own = cid ? S.castles[cid].owner : S.provs[pid].owner;
  S.clans[own].gold -= ch.cost;
  if (cid) S.castles[cid].lv = ch.lv; else S.provs[pid].clv = ch.lv;
  return ch;
}
function lvMult(lv) { return 1 + 0.12 * (lv || 0); }
// ---- こわれた 城：おとされた 城は 石垣・門が こわれて 守りが よわい。お金で なおす ----
var RUIN_DEF = 0.75;
function isRuined(S, pid, cid) { return !!(cid ? S.castles[cid] && S.castles[cid].ruin : S.provs[pid] && S.provs[pid].ruin); }
function repairCost(S, pid, cid) { return cid ? 6 + 2 * ((S.castles[cid].lv) || 0) : 12 + 4 * (S.provs[pid].clv || 0); }
function repairCastle(S, pid, cid) {
  var o = cid ? S.castles[cid] : S.provs[pid], own = o.owner;
  if (!o.ruin) return { ok: false, msg: 'こわれて いない' };
  var c = repairCost(S, pid, cid); if (S.clans[own].gold < c) return { ok: false, msg: 'お金が たりない' };
  S.clans[own].gold -= c; o.ruin = 0; return { ok: true, cost: c };
}
var MINE_INC = { iron: 3, copper: 4, silver: 6 }, MINE_NAME = { iron: '鉄（たたら）', copper: '銅', silver: '銀' };
var FIELDS_PER_TOWN = 6;   // 町 1つを ささえるのに いる 田畑（食べもの）
// 鉱脈（おおよその 場所）
var DEPOSITS = [
  ['石見銀山', 132.44, 35.11, 'silver'], ['吉岡銅山', 133.47, 34.87, 'copper'], ['奥出雲の たたら', 133.05, 35.20, 'iron'],
  ['日野の たたら', 133.38, 35.20, 'iron'], ['備後の たたら', 133.12, 34.98, 'iron'], ['柵原', 134.07, 34.97, 'copper'],
  ['石見の たたら', 132.05, 34.62, 'iron'], ['長登銅山', 131.23, 34.27, 'copper'], ['岩美の 鉱山', 134.37, 35.55, 'copper'],
  ['美作の たたら', 133.82, 35.16, 'iron'], ['周防の 銅', 131.85, 34.15, 'copper'], ['安芸の たたら', 132.45, 34.72, 'iron']
];
// 国ごとの 名産品
var MEIBUTSU = { nagato: '赤間硯', suo: '大内塗', akiw: '宮島の 細工', sato: '太田川の 材木', yoshida: '吉田の 和紙', oasa: '大朝の 牛',
  kagami: '西条の 酒', nuta: '沼田の 塩', bingon: '比婆の 牛', bingos: '備後表（畳おもて）', iwamiw: '石州半紙', iwamie: '江の川の 鮎',
  izumo: '出雲大社の 門前市', hoki: '大山の 牛馬市', inaba: '因州和紙', mimasaka: '美作の 湯', bitchu: '備中青江の 刀', bizen: '備前焼' };
var DOM = null;   // 国ごとの マスの 一覧（はじめて つかうとき つくる）
function domData() {
  if (DOM) return DOM;
  var w = worldMap(); if (!w) return null;
  DOM = {};
  PROVS.forEach(function (p) { DOM[p.id] = { hexes: [], dep: {} }; });
  for (var r = 0; r < w.h; r++) for (var c = 0; c < w.w; c++) { var pv = w.provAt(c, r); if (pv && DOM[pv]) DOM[pv].hexes.push([c, r]); }
  DEPOSITS.forEach(function (d) {
    var h0 = w.hexAtKm((d[1] - WORLD.lon0) * w.KX, (WORLD.lat0 - d[2]) * w.KY), best = null;
    for (var rr = h0[1] - 6; rr <= h0[1] + 6; rr++) for (var cc = h0[0] - 6; cc <= h0[0] + 6; cc++) {
      var pv = w.provAt(cc, rr), t = w.at(cc, rr); if (!pv || 'mhf'.indexOf(t) < 0) continue;
      var dd = Math.abs(cc - h0[0]) + Math.abs(rr - h0[1]); if (!best || dd < best[3]) best = [cc, rr, pv, dd];
    }
    if (best) DOM[best[2]].dep[best[0] + ',' + best[1]] = { type: d[3], name: d[0] };
  });
  return DOM;
}
function hkey(c, r) { return c + ',' + r; }
function hexNbs(c, r) { var o = r & 1; return o ? [[c + 1, r], [c - 1, r], [c, r - 1], [c + 1, r - 1], [c, r + 1], [c + 1, r + 1]] : [[c + 1, r], [c - 1, r], [c - 1, r - 1], [c, r - 1], [c - 1, r + 1], [c, r + 1]]; }
function nearAny(c, r, dist, fn) {
  var seen = {}, q = [[c, r, 0]]; seen[hkey(c, r)] = 1;
  for (var i = 0; i < q.length; i++) { var cur = q[i]; if (fn(cur[0], cur[1])) return true; if (cur[2] >= dist) continue;
    hexNbs(cur[0], cur[1]).forEach(function (n) { var k = hkey(n[0], n[1]); if (!seen[k]) { seen[k] = 1; q.push([n[0], n[1], cur[2] + 1]); } }); }
  return false;
}
function castleHex(pid) { return WORLD.castles[pid]; }
// 国の はじめの ようす（城下町と もとからの 田畑）
function initDomain(S, pid) {
  var P = S.provs[pid], d = domData(); if (!d) return;
  P.bld = {}; var w = worldMap(), cas = castleHex(pid), ck = hkey(cas[0], cas[1]);
  // 城下町：城の となりの 平地
  var nb = hexNbs(cas[0], cas[1]).filter(function (n) { var t = w.at(n[0], n[1]); return w.provAt(n[0], n[1]) === pid && (t === '.' || t === '=' || t === 'h'); });
  if (nb.length) P.bld[hkey(nb[0][0], nb[0][1])] = 'town0';
  // もとからの 田畑：石高 ×2 マス（川や 城の 近くの 平地から）
  var cand = d[pid].hexes.filter(function (h) { return fieldTerrainOK(w.at(h[0], h[1])) && hkey(h[0], h[1]) !== ck && !P.bld[hkey(h[0], h[1])]; })
    .map(function (h) { var t = w.at(h[0], h[1]), sc = (t === '.' ? 0 : 3) + Math.hypot(h[0] - cas[0], h[1] - cas[1]) * 0.25;
      if (nearAny(h[0], h[1], 1, function (c, r) { return w.at(c, r) === 'r'; })) sc -= 4; return [h, sc]; })
    .sort(function (a, b) { return a[1] - b[1]; });
  var n = Math.round(P.koku * 2);
  for (var i = 0; i < cand.length && n > 0; i++) { P.bld[hkey(cand[i][0][0], cand[i][0][1])] = 'field'; n--; }
  balanceFields(S, pid);
}
// 支城の 所領にも 田畑が あるように：たりない 所領へ 本城の とおくの 田畑を うつす
function balanceFields(S, pid) {
  var P = S.provs[pid], w = worldMap(), d = domData(), bh = branchHexes(); if (!P.bld || !w || !d || !bh) return;
  var cas = castleHex(pid), keys = Object.keys(P.bld).filter(function (k) { return P.bld[k] === 'field'; }), F = keys.length; if (!F) return;
  (BRANCHES[pid] || []).forEach(function (b, i) {
    var id = pid + '_' + i, h0 = bh[id], want = Math.round(F * branchShare(id)), have = keys.filter(function (k) { var xy = k.split(','); return regionAt(+xy[0], +xy[1]) === id; }).length;
    if (have >= want) return;
    var cand = d[pid].hexes.filter(function (h) { return regionAt(h[0], h[1]) === id && fieldTerrainOK(w.at(h[0], h[1])) && !P.bld[hkey(h[0], h[1])] && !(h[0] === h0[0] && h[1] === h0[1]); })
      .map(function (h) { var sc = (w.at(h[0], h[1]) === '.' ? 0 : 3) + Math.hypot(h[0] - h0[0], h[1] - h0[1]) * 0.3; if (nearAny(h[0], h[1], 1, function (c, r) { return w.at(c, r) === 'r'; })) sc -= 3; return [h, sc]; })
      .sort(function (a, b) { return a[1] - b[1]; });
    var donors = keys.filter(function (k) { var xy = k.split(','); return (regionAt(+xy[0], +xy[1]) || pid) === pid; })
      .sort(function (a, b) { var p = a.split(','), q = b.split(','); return Math.hypot(+q[0] - cas[0], +q[1] - cas[1]) - Math.hypot(+p[0] - cas[0], +p[1] - cas[1]); });
    for (var j = 0; have < want && j < cand.length && donors.length; j++) {
      var dk = donors.shift(); delete P.bld[dk]; keys.splice(keys.indexOf(dk), 1);
      var nk = hkey(cand[j][0][0], cand[j][0][1]); P.bld[nk] = 'field'; keys.push(nk); have++;
    }
  });
}
function fieldTerrainOK(t) { return t === '.' || t === 'h' || t === 'f'; }
function bldCount(P, type) { var n = 0; for (var k in (P.bld || {})) if (P.bld[k] === type || (type === 'town' && P.bld[k] === 'town0')) n++; return n; }
function bldCost(S, pid, type, c, r, who) {
  var b = BLD[type], cost = b.cost, w = worldMap(), P0 = S.provs[pid]; who = who || P0.owner;
  if (type === 'field' && w) {
    var tt = w.at(c, r); if (tt === 'f') cost *= 1.5; else if (tt === 'h') cost *= 1.2;   // 森・丘の 開墾は たいへん
    // ひらけば ひらくほど 人手が たりなくなり 高くなる（上限は ない）。所領の ひろさに おうじて
    var land = 0; provRegions(S, pid).forEach(function (g) { if (g.owner === who) land += g.land; });
    var f0 = Math.max(4, Math.round(PROV_BY[pid].koku * 2 * Math.max(0.15, land))), extra = Math.max(0, bldCountIn(S, pid, who, 'field') - f0);
    cost *= 1 + extra / (f0 * 2);   // ゆるやかに 高く
  }
  var o = S.curOff && S.officers[S.curOff] && S.officers[S.curOff].clan === who ? S.officers[S.curOff] : S.officers && who === P0.owner ? officerAt(S, pid) : null;
  return Math.max(2, Math.round(cost * (1 - (offP(o) - 50) / 200)));
}
// その マスに たてられるか
// その 家が この 国で もつ 城の マス（本城・支城）
function anchorsOf(S, pid, who) {
  var a = [], bh = branchHexes() || {}; if (S.provs[pid].owner === who) a.push(castleHex(pid));
  branchesIn(S, pid).forEach(function (c0) { if (c0.owner === who && bh[c0.id]) a.push(bh[c0.id]); });
  return a;
}
// who の 所領の 中の 建物の かず
function bldCountIn(S, pid, who, type) {
  var P = S.provs[pid], n = 0; for (var k in (P.bld || {})) { var b = P.bld[k]; if (!(b === type || (type === 'town' && b === 'town0'))) continue; var xy = k.split(','); if ((regionOwner(S, +xy[0], +xy[1]) || P.owner) === who) n++; }
  return n;
}
function canBuild(S, pid, c, r, type, who) {
  var w = worldMap(), d = domData(), P = S.provs[pid]; if (!w || !d) return { ok: false };
  who = who || P.owner;
  if (w.provAt(c, r) !== pid) return { ok: false, msg: 'この 国の 中で ないと だめ' };
  var k = hkey(c, r), t = w.at(c, r), cas = castleHex(pid), anc = anchorsOf(S, pid, who), bh = branchHexes() || {};
  if (P.bld && P.bld[k]) return { ok: false, msg: 'もう たっている' };
  if ((c === cas[0] && r === cas[1]) || branchesIn(S, pid).some(function (c0) { var h = bh[c0.id]; return h && h[0] === c && h[1] === r; })) return { ok: false, msg: '城が ある' };
  var ro = regionOwner(S, c, r) || P.owner; if (ro !== who) return { ok: false, msg: ro === IKKI ? '一揆衆の 土地' : (CLANS[ro] ? CLANS[ro].name : 'ほかの 家') + 'の 所領' };
  var isAnc = function (cc, rr) { return anc.some(function (h) { return h[0] === cc && h[1] === rr; }); };
  var mine = function (cc, rr) { var b = P.bld[hkey(cc, rr)]; return b; };
  if (type === 'field') {
    if (!fieldTerrainOK(t)) return { ok: false, msg: '平地・丘・森 で ないと ひらけない' };
    if (!nearAny(c, r, 2, function (cc, rr) { var tt = w.at(cc, rr); return tt === 'r' || mine(cc, rr) === 'field' || isAnc(cc, rr); })) return { ok: false, msg: '川や 田畑・城の 近く（2マス）で ないと 水が ひけない' };
  } else if (type === 'town') {
    if (t !== '.' && t !== '=' && t !== 'h') return { ok: false, msg: '平地で ないと 町は つくれない' };
    var nf = bldCountIn(S, pid, who, 'field'), nt = bldCountIn(S, pid, who, 'town');
    if (nt + 1 > Math.floor(nf / FIELDS_PER_TOWN)) return { ok: false, msg: '田畑が たりない（町 1つを 田畑 ' + FIELDS_PER_TOWN + 'マスで ささえる。いまは 田畑 ' + nf + 'マス・町 ' + nt + '）' };
    if (!nearAny(c, r, 1, function (cc, rr) { var tt = w.at(cc, rr), b = mine(cc, rr); return tt === '=' || b === 'town' || b === 'town0' || isAnc(cc, rr); })) return { ok: false, msg: '道や 城・町の となりで ないと 人が あつまらない' };
  } else if (type === 'mine') {
    var dep = d[pid].dep[k]; if (!dep) return { ok: false, msg: '鉱脈（◆）の ある マスだけ' };
    if (dep.type === 'silver' && S.year < 1527) return { ok: false, msg: '銀は まだ みつかって いない（1527年）' };
  } else if (type === 'meibutsu') {
    if (t !== '.' && t !== '=' && t !== 'h') return { ok: false, msg: '平地で ないと だめ' };
    if (!nearAny(c, r, 1, function (cc, rr) { var b = mine(cc, rr); return b === 'town' || b === 'town0'; })) return { ok: false, msg: '町の となりで ないと だめ' };
  } else if (type === 'saku' || type === 'hori') {
    if ('.hf='.indexOf(t) < 0) return { ok: false, msg: '平地・丘・森・道で ないと つくれない' };
  } else if (type === 'toride') {
    if ('.h'.indexOf(t) < 0) return { ok: false, msg: '平地か 丘で ないと 砦は つくれない' };
    if (bldCountIn(S, pid, who, 'toride') >= 2) return { ok: false, msg: '砦は 所領に 2つまで' };
    if (nearAny(c, r, 2, function (cc, rr) { return P.bld[hkey(cc, rr)] === 'toride' || isAnc(cc, rr); })) return { ok: false, msg: '城や ほかの 砦から 3マス はなして' };
  } else if (type === 'salt') {
    if (!fieldTerrainOK(t) && t !== '=') return { ok: false, msg: '海べの 平地だけ' };
    if (!nearAny(c, r, 1, function (cc, rr) { return w.at(cc, rr) === 's'; })) return { ok: false, msg: '海の となりで ないと 塩は とれない' };
  }
  var cost = bldCost(S, pid, type, c, r, who);
  if (S.clans[who].gold < cost) return { ok: false, msg: 'お金が たりない（💰' + kan(cost) + '）', cost: cost };
  return { ok: true, cost: cost };
}
function build(S, pid, c, r, type, who) {
  var P = S.provs[pid]; who = who || P.owner;
  var chk = canBuild(S, pid, c, r, type, who); if (!chk.ok) return chk;
  if (!P.bld) P.bld = {};
  S.clans[who].gold -= chk.cost; P.bld[hkey(c, r)] = type;
  if (type === 'field') P.koku = Math.round((P.koku + 0.5) * 10) / 10;
  // 担当の 家臣の 大成功：田畑は 石高が 倍、ほかは 費用が 半分 もどる
  var bo = S.curOff && S.officers[S.curOff], prem = false;
  if (bo && bo.clan === who && cRand(S) < premiumP(offP(bo))) {
    prem = true;
    if (type === 'field') P.koku = Math.round((P.koku + 0.5) * 10) / 10; else S.clans[who].gold += Math.round(chk.cost / 2);
  }
  if (bo && bo.clan === who) bo.busy = S.turn;
  chk.premium = prem;
  // 内政は めいれいを つかわない（お金の かぎり、領地の どこでも）
  return { ok: true, cost: chk.cost, premium: prem };
}
// 建物の 収入（まいきせつ）
function bldIncome(S, pid) {
  var P = S.provs[pid], d = domData(), g = 0; if (!P.bld) return 0;
  for (var k in P.bld) {
    var b = P.bld[k];
    if (b === 'town' || b === 'meibutsu' || b === 'salt') g += BLD[b].inc;
    else if (b === 'mine' && d && d[pid].dep[k]) g += MINE_INC[d[pid].dep[k].type];
  }
  return g;
}
// ==== 支城（国ごとに 本城の ほか 2つ。おおよその 場所） ====
var BRANCHES = {
  nagato: [['霜降城', 131.27, 34.03, 'yama'], ['深川城', 131.18, 34.37, 'toride']],
  suo: [['若山城', 131.80, 34.06, 'yama'], ['鞍掛山城', 132.12, 34.20, 'yamajiro_s']],
  akiw: [['宮尾城', 132.32, 34.30, 'umi'], ['草津城', 132.39, 34.37, 'toride']],
  sato: [['己斐城', 132.43, 34.40, 'toride'], ['府中出張城', 132.50, 34.41, 'yamajiro_s']],
  yoshida: [['猿掛城', 132.64, 34.66, 'yamajiro_s'], ['五龍城', 132.73, 34.65, 'yama']],
  oasa: [['日山城', 132.43, 34.75, 'yama'], ['駿河丸城', 132.48, 34.76, 'toride']],
  kagami: [['頭崎城', 132.80, 34.48, 'yama'], ['槌山城', 132.84, 34.47, 'yamajiro_s']],
  nuta: [['新高山城', 133.00, 34.44, 'yama'], ['木村城', 132.92, 34.36, 'toride']],
  bingon: [['五品嶽城', 133.27, 34.89, 'yama'], ['比叡尾山城', 132.86, 34.82, 'yamajiro_s']],
  bingos: [['鞆城', 133.38, 34.385, 'umi'], ['八ツ尾山城', 133.24, 34.58, 'yama']],
  iwamiw: [['七尾城', 131.85, 34.66, 'yamajiro_s'], ['三隅城', 132.00, 34.77, 'yama']],
  iwamie: [['山吹城', 132.44, 35.11, 'yama'], ['本明城', 132.18, 34.87, 'yamajiro_s']],
  izumo: [['白鹿城', 133.07, 35.49, 'yama'], ['三刀屋城', 132.90, 35.29, 'yamajiro_s']],
  hoki: [['羽衣石城', 133.79, 35.43, 'yama'], ['江美城', 133.43, 35.28, 'toride']],
  inaba: [['鳥取城', 134.23, 35.51, 'yama'], ['鹿野城', 134.05, 35.46, 'hira']],
  mimasaka: [['三星城', 134.15, 35.03, 'yama'], ['神楽尾城', 134.00, 35.07, 'yamajiro_s']],
  bitchu: [['幸山城', 133.74, 34.66, 'yamajiro_s'], ['佐井田城', 133.65, 34.92, 'yama']],
  bizen: [['天神山城', 134.12, 34.86, 'yama'], ['沼城', 134.03, 34.71, 'toride']]
};
var BRANCH_SHARE = 0.2;
var BRANCH_DEF = 1.3;     // 支城は 山や 堀を いかした ちいさな 城で 守りやすい   // ほかの 家が もつ 支城 1つにつき 国の 収入の 1/4 を とられる
// 支城の マス（その国の 中の 通れる マス。本城から 2マス いじょう はなす）
var BR_HEX = null;
function branchHexes() {
  if (BR_HEX) return BR_HEX;
  var w = worldMap(); if (!w) return null;
  BR_HEX = {};
  Object.keys(BRANCHES).forEach(function (pid) {
    var cas = WORLD.castles[pid];
    BRANCHES[pid].forEach(function (b, i) {
      var h0 = w.hexAtKm((b[1] - WORLD.lon0) * w.KX, (WORLD.lat0 - b[2]) * w.KY), best = null;
      for (var rr = h0[1] - 10; rr <= h0[1] + 10; rr++) for (var cc = h0[0] - 10; cc <= h0[0] + 10; cc++) {
        if (w.provAt(cc, rr) !== pid || '.=fhm'.indexOf(w.at(cc, rr)) < 0) continue;
        if (Math.abs(cc - cas[0]) + Math.abs(rr - cas[1]) < 3) continue;
        var dd = Math.hypot(cc - h0[0], rr - h0[1]); if (!best || dd < best[2]) best = [cc, rr, dd];
      }
      BR_HEX[pid + '_' + i] = best ? [best[0], best[1]] : [cas[0] + 3, cas[1]];
    });
  });
  return BR_HEX;
}
// ---- 支城の 所領（国の 中を 本城・支城の ちかい ほうで わける） ----
var REGION = null, REG_MAX = 0.33, REG_W = { '.': 1, '=': 1, h: 0.8, f: 0.4, m: 0.3, M: 0.05 };
function castleRegions() {
  if (REGION) return REGION;
  var w = worldMap(), bh = branchHexes(); if (!w || !bh) return null;
  var N = w.w * w.h, own = new Int16Array(N).fill(-1), dist = new Float64Array(N).fill(1e9), ids = [];
  var share = {};
  PROVS.forEach(function (p) {
    var src = [[WORLD.castles[p.id], 'main', 1.25]];   // 本城の まわりは 少し ひろく
    (BRANCHES[p.id] || []).forEach(function (b, i) { src.push([bh[p.id + '_' + i], p.id + '_' + i, 1]); });
    var q = [];
    src.forEach(function (sv) { var id = ids.length; ids.push(sv[1] === 'main' ? p.id : sv[1]); var h = sv[0], k = h[1] * w.w + h[0]; if (w.provAt(h[0], h[1]) !== p.id) return; dist[k] = 0; own[k] = id; q.push([0, h[0], h[1], id, sv[2]]); });
    while (q.length) {   // 小さい 国ごとの ダイクストラ（線形さがし で 十分）
      var bi = 0; for (var j = 1; j < q.length; j++) if (q[j][0] < q[bi][0]) bi = j;
      var e = q[bi]; q[bi] = q[q.length - 1]; q.pop();
      if (e[0] > dist[e[2] * w.w + e[1]]) continue;
      hexNbs(e[1], e[2]).forEach(function (n) {
        if (n[0] < 0 || n[1] < 0 || n[0] >= w.w || n[1] >= w.h || w.provAt(n[0], n[1]) !== p.id) return;
        var t = w.at(n[0], n[1]), cst = (t === 'M' ? 4 : t === 'm' ? 2.2 : t === 'f' ? 1.4 : t === 'r' ? 1.5 : 1) / e[4], k = n[1] * w.w + n[0], nd = e[0] + cst;
        if (nd < dist[k]) { dist[k] = nd; own[k] = e[3]; q.push([nd, n[0], n[1], e[3], e[4]]); }
      });
    }
  });
  var tot = {};
  for (var r = 0; r < w.h; r++) for (var c = 0; c < w.w; c++) {
    var k = r * w.w + c; if (own[k] < 0) continue; var pv = w.provAt(c, r), wt = REG_W[w.at(c, r)] || 0;
    tot[pv] = (tot[pv] || 0) + wt; var id = ids[own[k]]; share[id] = (share[id] || 0) + wt;
  }
  Object.keys(share).forEach(function (id) { var pv = id.split('_')[0]; share[id] = tot[pv] ? share[id] / tot[pv] : 0; });
  // 支城の 所領は 国の 1/3 まで：とおい マスから 本城の 直轄へ もどす
  var mainIdx = {}; ids.forEach(function (id, i) { if (id.indexOf('_') < 0) mainIdx[id] = i; });
  ids.forEach(function (id, i) {
    if (id.indexOf('_') < 0 || share[id] <= REG_MAX) return;
    var pv = id.split('_')[0], hs = [];
    for (var k = 0; k < N; k++) if (own[k] === i) hs.push(k);
    hs.sort(function (a, b) { return dist[b] - dist[a]; });
    for (var j = 0; j < hs.length && share[id] > REG_MAX; j++) {
      var k2 = hs[j], wt = (REG_W[w.T[k2]] || 0) / tot[pv]; own[k2] = mainIdx[pv]; share[id] -= wt; share[pv] += wt;
    }
  });
  REGION = { own: own, ids: ids, share: share };
  return REGION;
}
// その マスを もつ 城（'pid' か 'pid_i'）
function regionAt(c, r) { var R0 = castleRegions(), w = worldMap(); if (!R0 || c < 0 || r < 0 || c >= w.w || r >= w.h) return null; var o = R0.own[r * w.w + c]; return o < 0 ? null : R0.ids[o]; }
// 支城の 所領が 国の 何わりか（収入の わけまえ）
function branchShare(cid) { var R0 = castleRegions(); var v = R0 && R0.share[cid] !== undefined ? R0.share[cid] : BRANCH_SHARE; return Math.max(0.05, Math.min(REG_MAX, v)); }
function regionOwner(S, c, r) { var id = regionAt(c, r); if (!id) return null; return id.indexOf('_') > 0 && S.castles && S.castles[id] ? S.castles[id].owner : S.provs[id] ? S.provs[id].owner : null; }
function initCastles(S) {
  S.castles = {};
  Object.keys(BRANCHES).forEach(function (pid) {
    BRANCHES[pid].forEach(function (b, i) {
      var id = pid + '_' + i, own = S.provs[pid].owner;
      S.castles[id] = { id: id, prov: pid, owner: own, units: own ? [newUnit(S, 'ashigaru'), newUnit(S, 'ashigaru'), newUnit(S, 'yumi')] : [] };
    });
  });
}
function brName(id) { var a = id.split('_'), b = BRANCHES[a[0]][+a[1]]; return b[0]; }
function brTpl(id) { var a = id.split('_'); return BRANCHES[a[0]][+a[1]][3]; }
function branchesIn(S, pid) { return (BRANCHES[pid] || []).map(function (b, i) { return S.castles[pid + '_' + i]; }).filter(Boolean); }
function castleHexOf(pid, cid) { return cid ? branchHexes()[cid] : WORLD.castles[pid]; }
// 攻め口の 支城：となりの 国 from から 道で はいって いちばん 近い 支城
function gateCastle(S, from, to) {
  var br = branchesIn(S, to); if (!br.length) return null;
  var pth = routePath(from, to), w = worldMap(), entry = WORLD.castles[from];
  if (pth) { for (var i = 0; i < pth.length; i++) if (w.provAt(pth[i][0], pth[i][1]) === to) { entry = pth[i]; break; } }
  var bh = branchHexes(); br.sort(function (a, b) { var p = bh[a.id], q = bh[b.id]; return Math.hypot(p[0] - entry[0], p[1] - entry[1]) - Math.hypot(q[0] - entry[0], q[1] - entry[1]); });
  return br[0];
}
// pid の 軍が せめられる 城の 一覧（{to, castle(支城id か null), owner}）
function attackTargets(S, pid, cid) {
  cid = cid || S.provs[pid].owner;
  var out = [], seen = {};
  function push(t) { var k = t.to + '/' + (t.castle || ''); if (seen[k]) return; seen[k] = 1; if (t.owner && t.owner !== cid) out.push(t); }
  // じぶんの 国に のこる てきの 支城（とりのこし）
  [pid].concat(ADJ[pid] || []).forEach(function (q) {
    if (S.provs[q].owner === cid) { branchesIn(S, q).forEach(function (c) { if (c.owner !== cid) push({ to: q, castle: c.id, owner: c.owner }); }); return; }
    if (q === pid) return;
    var g = gateCastle(S, pid, q);
    if (g && g.owner !== cid) push({ to: q, castle: g.id, owner: g.owner });
    else push({ to: q, castle: null, owner: S.provs[q].owner });
  });
  return out;
}
// 支城から 出陣：せめられる 城（その 国の なかの てきの 城 と、その 国から 道の ある となり）
function branchTargets(S, id) {
  var C0 = S.castles[id], cid = C0.owner, P = C0.prov, out = [], seen = {};
  function push(t) { var k = t.to + '/' + (t.castle || ''); if (seen[k] || !t.owner || t.owner === cid) return; seen[k] = 1; out.push(t); }
  if (S.provs[P].owner !== cid) push({ to: P, castle: null, owner: S.provs[P].owner });
  branchesIn(S, P).forEach(function (c) { if (c.id !== id) push({ to: P, castle: c.id, owner: c.owner }); });
  attackTargets(S, P, cid).forEach(push);
  return out;
}
// 支城から 調略できる 家（その 支城の 国と となりの 国の、ほかの 家）
function branchSchemeTargets(S, id) {
  var C0 = S.castles[id], P = C0.prov, out = [];
  [P].concat(ADJ[P] || []).forEach(function (q) { var o = S.provs[q].owner; if (o && o !== C0.owner && o !== IKKI && out.indexOf(q) < 0) out.push(q); });
  return out;
}
function canBranchAttack(S, id) { var C0 = S.castles[id]; return !!(C0 && C0.owner && C0.units.length && C0.atk !== S.turn); }
function makeBranchBattle(S, id, to, uids, castleId, extra) {
  var b = makeBattle(S, S.castles[id].prov, to, uids, castleId || null, extra || [], id);
  b.need = needDays(S, b); b.foodDays = Math.round(b.need * 1.3);
  return b;
}
// 応援に だせる 城：おなじ 城を せめられる じぶんの 国（本城）と 支城。loc＝出陣する 城（国 id か 支城 id）
function coSources(S, loc, to, castleId) {
  var isC = !!(S.castles && S.castles[loc]), cid = isC ? S.castles[loc].owner : S.provs[loc].owner, out = [];
  function hits(list) { return list.some(function (t) { return t.to === to && (t.castle || null) === (castleId || null); }); }
  provsOf(S, cid).forEach(function (q) {
    if (!isC && q === loc) return;
    var P = S.provs[q]; if (!P.units.length || P.acted || didCmd(P, 'attack') || (cid === S.player && cmdFull(P))) return;
    if (hits(attackTargets(S, q, cid))) out.push({ key: q, from: q, name: castleNameOf(S, q) + '（' + PROV_BY[q].name + 'の 本城）', units: P.units, loc: q });
  });
  Object.keys(S.castles || {}).forEach(function (id) {
    var C0 = S.castles[id]; if (id === loc || C0.owner !== cid || !C0.units.length || C0.atk === S.turn) return;
    if (hits(branchTargets(S, id))) out.push({ key: id, castle: id, name: brName(id) + '（' + PROV_BY[C0.prov].name + 'の 支城）', units: C0.units, loc: id });
  });
  return out;
}
function targetName(S, t) { return t.castle ? brName(t.castle) + '（' + PROV_BY[t.to].name + 'の 支城）' : castleNameOf(S, t.to) + '（' + PROV_BY[t.to].name + 'の 本城）'; }
// 後詰め：支城が せめられたら 同じ 家の 本城から 助けが くる（本城の 軍の 半分まで、4たいまで）
function reliefOf(S, castleId) {
  var C0 = S.castles[castleId], P = S.provs[C0.prov];
  if (!C0.owner || P.owner !== C0.owner) return [];
  if (P.units.length < 6) return [];   // 本城が 手うすなら 助けは だせない
  return P.units.slice().sort(function (a, b) { return strength([b]) - strength([a]); }).slice(0, Math.min(3, Math.floor((P.units.length - 4) / 2)));
}
function tgtStrength(S, t) {
  if (!t.castle) return defStrength(S, t.to);
  return (strength(S.castles[t.castle].units) + strength(reliefOf(S, t.castle))) * castleMult(brTpl(t.castle)) * lvMult(S.castles[t.castle].lv) * (S.castles[t.castle].ruin ? RUIN_DEF : 1) * BRANCH_DEF + 1;
}
// CPU・おまかせの 内政：お金の ぶんだけ 田畑 → 町 の じゅんに たてる
function develop(S, pid, amount) {
  var P = S.provs[pid], cid = P.owner, w = worldMap(), d = domData();
  amount = Math.round(amount === undefined ? DEVELOP_COST : amount);
  if (S.clans[cid].gold < Math.min(amount, 5)) return { ok: false, msg: 'お金が たりない' };
  if (!w || !d) return { ok: false, msg: 'ちずが ない' };
  if (!P.bld) initDomain(S, pid);
  var spent = 0, add = 0, k0 = P.koku, cas = castleHex(pid);
  var hx = d[pid].hexes.slice().sort(function (a, b) { return Math.hypot(a[0] - cas[0], a[1] - cas[1]) - Math.hypot(b[0] - cas[0], b[1] - cas[1]); });
  // これまでと 同じ はやさ：50金で 石高 +1（政 80いじょうは +2）。田畑の マスを ひらいて あらわす
  var nField = Math.floor(amount / DEVELOP_COST) * (offP(officerAt(S, pid)) >= 80 ? 4 : 2), cost1 = Math.round(DEVELOP_COST / 2);
  for (var i = 0; i < hx.length && nField > 0; i++) {
    var ch = canBuild(S, pid, hx[i][0], hx[i][1], 'field');
    if (!ch.ok) { if (/石高/.test(ch.msg || '')) break; continue; }
    if (S.clans[cid].gold < cost1) break;
    P.bld[hkey(hx[i][0], hx[i][1])] = 'field'; P.koku = Math.round((P.koku + 0.5) * 10) / 10; nField--;
    if (nField % (offP(officerAt(S, pid)) >= 80 ? 4 : 2) === 0) { S.clans[cid].gold -= DEVELOP_COST; spent += DEVELOP_COST; }
  }
  if (!spent) return { ok: false, msg: 'たてられる ところが ない' };
  markCmd(P, 'develop');
  return { ok: true, add: Math.round((P.koku - k0) * 10) / 10, spent: spent };
}
function moveUnits(S, from, to, uids) {
  var A = S.provs[from], B = S.provs[to];
  if (A.owner !== B.owner || ADJ[from].indexOf(to) < 0) return { ok: false, msg: 'となりの じぶんの 国にだけ うごかせる' };
  var mv = A.units.filter(function (u) { return uids.indexOf(u.uid) >= 0 && u.mv !== S.turn; });
  if (!mv.length) return { ok: false, msg: uids.length ? 'この きせつに うごいた へいは もう うごけない' : 'へいを えらんでね' };
  if (B.units.length + mv.length > PROV_CAP) return { ok: false, msg: PROV_CAP + 'たいを こえてしまう' };
  var ids2 = mv.map(function (u) { return u.uid; });
  A.units = A.units.filter(function (u) { return ids2.indexOf(u.uid) < 0; });
  mv.forEach(function (u) { u.mv = S.turn; });
  B.units = B.units.concat(mv); markCmd(A, 'move');
  return { ok: true, n: mv.length };
}
// 出陣の じゅんび（へいを 国から とりだす）
// 道の ちがいによる 攻め手の 力（海路＝船で 上陸、峠道＝守りが 待ちぶせ しやすい）
var PASS_MULT = 0.92;
function routeMult(a, b) { var rt = routeOf(a, b); return !rt ? 1 : rt.type === 'sea' ? 0.85 : rt.type === 'pass' ? PASS_MULT : 1; }
function seaRoute(a, b) { var rt = routeOf(a, b); return !!(rt && rt.type === 'sea'); }
// castleId：支城を せめる ときの 城（null＝本城）
// extra = [{from: 国, uids: [...]}]：ほかの 国からも 同時に せめる
function makeBattle(S, from, to, uids, castleId, extra, src) {
  var A = S.provs[from], B = S.provs[to], aClan = src ? S.castles[src].owner : A.owner;
  if (castleId === undefined) { var tg = attackTargets(S, from).filter(function (t) { return t.to === to; })[0]; castleId = tg ? tg.castle : null; }
  // pv：国、cs：支城（あれば その 支城の へい）
  function pick(pv, ids, cs) { var l = (cs ? S.castles[cs].units : S.provs[pv].units).filter(function (u) { return ids.indexOf(u.uid) >= 0; }); if (pv !== to && seaRoute(pv, to)) l = l.filter(function (u) { return u.type !== 'kiba'; }); return l; }   // 騎馬は 船に のせられない
  var atk = pick(from, uids, src).map(cloneU), fronts = [{ from: from, castle: src || null }], unitFrom = {};
  atk.forEach(function (u) { unitFrom[u.uid] = src || from; });
  (extra || []).forEach(function (e) {
    if (e.castle) {   // 応援：ほかの 支城から
      var EC = S.castles[e.castle]; if (!EC || e.castle === src || EC.owner !== aClan) return;
      var lc = pick(EC.prov, e.uids || [], e.castle); if (!lc.length) return;
      var fc = EC.prov === from && !src ? 0 : fronts.length; if (fc) fronts.push({ from: EC.prov, castle: e.castle });
      lc.forEach(function (u) { var cu = cloneU(u); if (fc) cu.front = fc; atk.push(cu); unitFrom[u.uid] = e.castle; });
      return;
    }
    if ((e.from === from && !src) || S.provs[e.from].owner !== aClan) return;
    var l = pick(e.from, e.uids || []); if (!l.length) return;
    var fi = fronts.length; fronts.push({ from: e.from });
    l.forEach(function (u) { var cu = cloneU(u); cu.front = fi; atk.push(cu); unitFrom[u.uid] = e.from; });
  });
  var ao = officerAt(S, from), dO = castleId ? null : officerAt(S, to);
  var b;
  if (castleId) {
    var C0 = S.castles[castleId], rel = reliefOf(S, castleId);
    b = { from: from, to: to, castleId: castleId, castleName: brName(castleId), atkClan: A.owner, defClan: C0.owner, atkUnits: atk, defUnits: C0.units.map(cloneU).concat(rel.map(cloneU)), castle: brTpl(castleId),
          relief: rel.map(function (u) { return u.uid; }), atkOff: ao ? ao.id : null, defOff: null, naio: false, fortLv: C0.lv || 0 };
  } else b = { from: from, to: to, castleId: null, castleName: castleNameOf(S, to), atkClan: A.owner, defClan: B.owner, atkUnits: atk, defUnits: B.units.map(cloneU), castle: PROV_BY[to].castle,
           atkOff: ao ? ao.id : null, defOff: dO ? dO.id : null, naio: B.naio === A.owner, fortLv: B.clv || 0 };
  b.unitFrom = unitFrom; if (fronts.length > 1) b.fronts = fronts;
  b.ruin = isRuined(S, to, castleId || null) ? 1 : 0;
  if (src) { b.atkClan = aClan; b.srcCastle = src; b.atkOff = null; if (!castleId) { b.defClan = B.owner; b.naio = B.naio === aClan; } }
  b.defFood = castleFood(S, to, castleId || null);   // 城の 蔵（石）
  b.need = needDays(S, b); b.foodDays = Math.round(b.need * 1.3);   // CPU は じゅうぶん もっていく（プレイヤーは 出陣の とき えらぶ）
  return b;
}
// ---- 城の 兵糧（石）：籠城の とき 守りの へいが たべる ----
var RICE_PER_MAN = 0.0025;       // 1人 1日 2.5合
var RICE_PRICE = 3;              // 1石 3貫（100貫 = 1 の お金で 33石）
function castleFoodCap(S, pid, cid) { return cid ? 220 + 120 * ((S.castles[cid] && S.castles[cid].lv) || 0) : Math.round(600 + S.provs[pid].koku * 60 + 300 * (S.provs[pid].clv || 0)); }
function castleFood(S, pid, cid) {
  var o = cid ? S.castles[cid] : S.provs[pid];
  if (o.food === undefined) o.food = cid ? 120 : Math.round(S.provs[pid].koku * 60);
  return o.food;
}
function setCastleFood(S, pid, cid, v) { (cid ? S.castles[cid] : S.provs[pid]).food = Math.max(0, Math.round(v)); }
function castleUnits(S, pid, cid) { return cid ? S.castles[cid].units : S.provs[pid].units; }
// いまの 守備兵で なん日 もつか
function castleFoodDays(S, pid, cid, units) {
  var men = menOfUnits(units || castleUnits(S, pid, cid)); return men ? Math.floor(castleFood(S, pid, cid) / (men * RICE_PER_MAN)) : 999;
}
function menOfUnits(list) { var n = 0; list.forEach(function (u) { n += Math.round(UNIT_TYPES[u.type].men * u.hp / 10); }); return n; }
// ---- 兵糧を はこぶ：じぶんの 城どうし（おなじ 国か となりの 国）----
function locPC(S, loc) { return S.castles && S.castles[loc] ? [S.castles[loc].prov, loc] : [loc, null]; }
// 領地の なかで つながって いる じぶんの 城（本城・支城が ある 国を となりづたいに たどる）
function domainLocs(S, loc) {
  var own = locOwner(S, loc); if (!own) return [];
  var has = {}; locsOf(S, own).forEach(function (d) { has[locPC(S, d)[0]] = 1; });
  var start = locPC(S, loc)[0], seen = {}, q = [start]; seen[start] = 1;
  while (q.length) { var p = q.shift(); (ADJ[p] || []).forEach(function (n) { if (has[n] && !seen[n]) { seen[n] = 1; q.push(n); } }); }
  return locsOf(S, own).filter(function (d) { return d !== loc && seen[locPC(S, d)[0]]; });
}
function riceDests(S, loc) { return domainLocs(S, loc); }
function locUnits(S, loc) { var pc = locPC(S, loc); return pc[1] ? S.castles[pc[1]].units : S.provs[pc[0]].units; }
function locCap(S, loc) { return S.castles && S.castles[loc] ? 8 : PROV_CAP; }
// 兵を うつす：領地の なかなら どこへでも（めいれいは つかわない。うごいた 隊は その きせつ もう うごけない）
function moveTroops(S, from, to, uids) {
  if (domainLocs(S, from).indexOf(to) < 0) return { ok: false, msg: '領地の そとへは うつせない' };
  var src = locUnits(S, from), mv = src.filter(function (u) { return uids.indexOf(u.uid) >= 0 && u.mv !== S.turn; });
  if (!mv.length) return { ok: false, msg: 'うつす へいを えらんでね' };
  if (locUnits(S, to).length + mv.length > locCap(S, to)) return { ok: false, msg: locName(S, to) + 'に はいりきらない（' + locCap(S, to) + 'たいまで）' };
  var ids = mv.map(function (u) { return u.uid; }), pa = locPC(S, from), pb = locPC(S, to);
  if (pa[1]) S.castles[pa[1]].units = src.filter(function (u) { return ids.indexOf(u.uid) < 0; }); else S.provs[pa[0]].units = src.filter(function (u) { return ids.indexOf(u.uid) < 0; });
  mv.forEach(function (u) { u.mv = S.turn; locUnits(S, to).push(u); });
  return { ok: true, n: mv.length, men: menOfUnits(mv) };
}
function moveRice(S, from, to, koku) {
  var a = locPC(S, from), b = locPC(S, to), own = locOwner(S, from);
  if (!own || locOwner(S, to) !== own) return { ok: false, msg: 'じぶんの 城どうしで ないと はこべない' };
  if (riceDests(S, from).indexOf(to) < 0) return { ok: false, msg: 'とおすぎて はこべない' };
  var have = castleFood(S, a[0], a[1]), room = castleFoodCap(S, b[0], b[1]) - castleFood(S, b[0], b[1]);
  koku = Math.max(0, Math.min(Math.round(koku), have, room));
  if (!koku) return { ok: false, msg: room <= 0 ? 'むこうの 蔵が いっぱい' : 'はこぶ 兵糧が ない' };
  setCastleFood(S, a[0], a[1], have - koku); setCastleFood(S, b[0], b[1], castleFood(S, b[0], b[1]) + koku);
  return { ok: true, koku: koku };
}
// ---- 出陣の 兵糧：まず 城の 蔵から。たりない ぶんだけ お金で いそいで かう ----
var RUSH_PRICE = 1.5;   // いそぎの かいいれは ふつうの 1.5ばい
function ricePlan(S, locs, koku) {
  var need = Math.ceil(koku), take = [], seen = {};
  (locs || []).forEach(function (loc) { if (need <= 0 || !loc || seen[loc]) return; seen[loc] = 1; var pc = locPC(S, loc), have = castleFood(S, pc[0], pc[1]), k = Math.min(have, need); if (k > 0) { take.push([loc, k]); need -= k; } });
  var short = Math.max(0, need);
  return { koku: Math.ceil(koku), take: take, fromStore: Math.ceil(koku) - short, short: short, gold: Math.ceil(short * RICE_PRICE * RUSH_PRICE / KAN) };
}
function applyRicePlan(S, cid, plan) {
  if (S.clans[cid].gold < plan.gold) return false;
  plan.take.forEach(function (t) { var pc = locPC(S, t[0]); setCastleFood(S, pc[0], pc[1], castleFood(S, pc[0], pc[1]) - t[1]); });
  S.clans[cid].gold -= plan.gold; return true;
}
// お金で 兵糧を かいいれる（石）
function buyRice(S, pid, cid, koku) {
  var own = cid ? S.castles[cid].owner : S.provs[pid].owner, cap = castleFoodCap(S, pid, cid), have = castleFood(S, pid, cid);
  koku = Math.max(0, Math.min(koku, cap - have)); var cost = Math.ceil(koku * RICE_PRICE / KAN * 100) / 100;
  if (!koku) return { ok: false, msg: '蔵が いっぱい' };
  if (S.clans[own].gold < cost) return { ok: false, msg: 'お金が たりない' };
  S.clans[own].gold -= cost; setCastleFood(S, pid, cid, have + koku); return { ok: true, koku: koku, cost: cost };
}
// 秋：とれた 米の 一部が 城の 蔵に はいる
function harvestRice(S) {
  PROVS.forEach(function (p) {
    var P = S.provs[p.id]; if (!P.owner || P.owner === IKKI) return;
    setCastleFood(S, p.id, null, Math.min(castleFoodCap(S, p.id, null), castleFood(S, p.id, null) + P.koku * 50));
  });
  if (S.castles) for (var k in S.castles) { var c0 = S.castles[k]; if (!c0.owner) continue; setCastleFood(S, c0.prov, k, Math.min(castleFoodCap(S, c0.prov, k), castleFood(S, c0.prov, k) + 60)); }
}
// ---- 兵糧 ----
var FOOD_PRICE = 0.2;   // 1000人の 1日ぶん（×100貫）
function foodCost(men, days) { return Math.ceil(men / 1000 * days * FOOD_PRICE); }
// 城まで すすんで せめおとすのに かかる めやすの 日数（国ざかいからの きょりで かわる）
function needDays(S, b) {
  var si = battleSizeIndex(b), sz = SIZES[si], env = battleEnv(S, b), cs = CASTLES[castleIndexOf(b.castle)];
  var h = Math.max(sz.h, (cs ? cs.t.length : 5) + 7, (env && env.minH) || 0);
  return sz.turns + (h > sz.h ? Math.ceil((h - sz.h) / 1.2) + 3 : 0);
}
// 同時攻撃に くわわれる 国（おなじ 城を せめられる じぶんの 国）
function coFronts(S, from, to, castleId) {
  var cid = S.provs[from].owner;
  return ADJ[to].concat(to === from ? [] : []).filter(function (q) {
    if (q === from || S.provs[q].owner !== cid) return false;
    var P = S.provs[q]; if (P.acted || didCmd(P, 'attack') || (q !== from && cid === S.player && cmdFull(P)) || !P.units.length) return false;
    return attackTargets(S, q, cid).some(function (t) { return t.to === to && (t.castle || null) === (castleId || null); });
  });
}
// 合戦の あと：へいを もとの 国へ（とられていたら 出陣した 国へ）
function sendHome(S, b, list) {
  var A = S.provs[b.from];
  list.forEach(function (u) {
    var h = b.unitFrom && b.unitFrom[u.uid], HC = h && S.castles && S.castles[h];
    if (HC && HC.owner === b.atkClan && HC.units.length < 8) { HC.units.push(u); return; }   // 支城から 出た 隊は 支城へ
    var P = h && !HC && S.provs[h].owner === b.atkClan ? S.provs[h] : (A.owner === b.atkClan ? A : null);
    if (!P && HC) { var near = [HC.prov].concat(ADJ[HC.prov] || []).filter(function (q) { return S.provs[q].owner === b.atkClan; })[0]; P = near ? S.provs[near] : null; }
    if (P && P.units.length < PROV_CAP) P.units.push(u);
  });
}
function cloneU(u) { return { uid: u.uid, type: u.type, hp: u.hp }; }
function startBattle(S, b) {
  var A = S.provs[b.from];
  if (b.defClan && isAlly(S, b.atkClan, b.defClan)) breakAlliance(S, b.atkClan, b.defClan, CLANS[b.atkClan].name + 'が うらぎった');
  noteWar(S, b.atkClan, b.defClan);
  var ids = b.atkUnits.map(function (u) { return u.uid; });
  A.units = A.units.filter(function (u) { return ids.indexOf(u.uid) < 0; });
  (b.fronts || []).slice(1).forEach(function (f) {
    if (f.castle) { var FC = S.castles[f.castle]; FC.units = FC.units.filter(function (u) { return ids.indexOf(u.uid) < 0; }); FC.atk = S.turn; return; }
    var F = S.provs[f.from]; F.units = F.units.filter(function (u) { return ids.indexOf(u.uid) < 0; }); markCmd(F, 'attack'); });
  // 本城と おなじ 国の 支城から 本隊に くわわった 隊
  Object.keys(b.unitFrom || {}).forEach(function (uid) { var h = b.unitFrom[uid]; if (S.castles && S.castles[h] && h !== b.srcCastle) { var HC = S.castles[h]; HC.units = HC.units.filter(function (u) { return String(u.uid) !== String(uid); }); HC.atk = S.turn; } });
  if (b.relief && b.relief.length) { var Bp = S.provs[b.to]; Bp.units = Bp.units.filter(function (u) { return b.relief.indexOf(u.uid) < 0; }); }
  if (b.srcCastle) { var SC = S.castles[b.srcCastle]; SC.units = SC.units.filter(function (u) { return ids.indexOf(u.uid) < 0; }); SC.atk = S.turn; }
  else markCmd(A, 'attack');
  if (b.foodCost) S.clans[b.atkClan].gold = Math.max(0, S.clans[b.atkClan].gold - b.foodCost);
  S.pendingBattle = b;
}
// 合戦の けっか を 国に もどす
// 降参した へい：のこった てきの 何割かが かった がわに くわわる（城主の 政で かわる）
function prisonerRate(S, b) { var o = b.atkOff && S.officers ? S.officers[b.atkOff] : null; return Math.max(0.3, Math.min(0.65, 0.42 + (offP(o) - 50) / 250 + streakBonus(S, b.atkClan))); }
function takePrisoners(S, b, list) {
  var rate = prisonerRate(S, b), joined = [], rest = [], men = 0;
  list.forEach(function (u) {
    var j = Math.round(u.hp * rate);
    if (j >= 1) { var nu = newUnit(S, u.type); nu.hp = j; joined.push(nu); men += j * UNIT_TYPES[u.type].men / 10; }
    if (u.hp - j >= 1) rest.push({ uid: u.uid, type: u.type, hp: u.hp - j });
  });
  return { joined: joined, rest: rest, men: Math.round(men), rate: rate };
}
// 城の 絵（縄張りの 型 → 絵）
var CASTLE_ART = { koriyama: 'yama', gassan: 'yama', matsuyama: 'yama', takada: 'yama', kanayama: 'yama', katsuyama: 'yama', ridge: 'yama', ridge_r: 'yama', oo: 'yama',
  kagami: 'yamas', yamajiro_s: 'yamas', yama: 'yamas', kannabe: 'hirayama', odaka: 'hirayama', nino: 'hirayama', fuse: 'hira', hira: 'hira', mizu: 'hira',
  sakurao: 'umi', umi: 'umi', yakata: 'yakata', toride: 'toride' };
// cid（支城）か pid（本城）の 絵の 名前。おとされた きせつは 焼け跡
function castleArtOf(S, pid, cid) {
  var k = cid || pid; if (S && ((S.fallen && S.fallen[k] === S.turn) || isRuined(S, pid, cid))) return 'castle_ruin';
  return 'castle_' + (CASTLE_ART[cid ? brTpl(cid) : PROV_BY[pid].castle] || 'yamas');
}
// ---- 援軍：攻められた がわが ほかの 国・城から へいを おくる ----
// 援軍を だせる ところ：となりの じぶんの 国（道が ある）と、おなじ 国の じぶんの 城（本城・支城）
function reinfSources(S, b) {
  var cid = b.defClan, out = [];
  if (!cid) return out;
  ADJ[b.to].forEach(function (q) { var rt = routeOf(q, b.to); if (q !== b.from && S.provs[q].owner === cid && rt && rt.type !== 'none' && S.provs[q].units.length) out.push({ src: q, kind: 'prov', name: PROV_BY[q].name + '（' + castleNameOf(S, q) + '）', units: S.provs[q].units }); });
  if (b.castleId) { if (S.provs[b.to].owner === cid && S.provs[b.to].units.length && !(b.relief || []).length) out.push({ src: b.to, kind: 'main', name: castleNameOf(S, b.to) + '（本城）', units: S.provs[b.to].units }); }
  branchesIn(S, b.to).forEach(function (c0) { if (c0.id !== b.castleId && c0.owner === cid && c0.units.length) out.push({ src: c0.id, kind: 'branch', name: brName(c0.id) + '（支城）', units: c0.units }); });
  return out;
}
// 援軍の 入口の 道すじ（となりの 国は 道、おなじ 国の 城は その 城の ばしょ）
function defEntryInfo(S, b, src) {
  var w = worldMap(), cas = WORLD.castles[b.to], bh9 = branchHexes() || {};
  if (S.castles[src] || src === b.to) { var h9 = src === b.to ? WORLD.castles[b.to] : bh9[src]; return { name: src === b.to ? castleNameOf(S, b.to) : brName(src), path: [h9], inTo: [true] }; }
  var pth = (routePath(src, b.to) || [WORLD.castles[src], cas]).slice();
  return { name: PROV_BY[src].name, path: pth, inTo: pth.map(function (h) { return w.provAt(h[0], h[1]) === b.to; }) };
}
// list: [{src, uids}] を 合戦に くわえる（へいは もとの 場所から はなれる）
function addReinf(S, b, list) {
  b.reinf = b.reinf || {}; b.defFronts = b.defFronts || [];
  list.forEach(function (e) {
    var isCastle = !!S.castles[e.src], pool = isCastle ? S.castles[e.src].units : S.provs[e.src].units;
    var mv = pool.filter(function (u) { return e.uids.indexOf(u.uid) >= 0; }); if (!mv.length) return;
    if (isCastle) S.castles[e.src].units = pool.filter(function (u) { return e.uids.indexOf(u.uid) < 0; }); else S.provs[e.src].units = pool.filter(function (u) { return e.uids.indexOf(u.uid) < 0; });
    var fi = b.defFronts.length + 1; b.defFronts.push({ src: e.src, castle: isCastle });
    mv.forEach(function (u) { var cu = cloneU(u); cu.dfront = fi; b.defUnits.push(cu); b.reinf[u.uid] = e.src; });
  });
}
// 合戦の とちゅうで 援軍を だせる 城（side：プレイヤーの がわ）
function midSources(S, b, side) {
  var cid = side === 'atk' ? b.atkClan : b.defClan, w = worldMap(), out = [], bh = branchHexes() || {};
  var tgt = b.castleId ? bh[b.castleId] : WORLD.castles[b.to], tq = w.km(tgt[0], tgt[1]);
  function add(src, kind, name, units, hex, path) {
    if (!units.length) return; var q = w.km(hex[0], hex[1]), km = Math.hypot(q[0] - tq[0], q[1] - tq[1]);
    out.push({ src: src, kind: kind, name: name, units: units, hex: hex, path: path, km: Math.round(km), delay: Math.max(1, Math.round(km / 9)) });
  }
  ADJ[b.to].concat([b.to]).forEach(function (q) {
    if (S.provs[q].owner !== cid) return;
    if (q === b.to) { if (b.castleId) add(q, 'main', castleNameOf(S, q) + '（本城）', S.provs[q].units, WORLD.castles[q], [WORLD.castles[q]]); return; }
    var rt = routeOf(q, b.to); if (!rt || rt.type === 'none') return;
    if (side === 'atk' && seaRoute(q, b.to)) return;   // とちゅうの 海路は むり
    add(q, 'prov', PROV_BY[q].name + '（' + castleNameOf(S, q) + '）', S.provs[q].units, WORLD.castles[q], routePath(q, b.to) || [WORLD.castles[q]]);
  });
  if (side === 'def') branchesIn(S, b.to).forEach(function (c0) { if (c0.id !== b.castleId && c0.owner === cid) add(c0.id, 'branch', brName(c0.id) + '（支城）', c0.units, bh[c0.id], [bh[c0.id]]); });
  return out;
}
// 援軍を だす：城から へいを はなし、合戦の あとに もどれる ように しるす
function dispatchMid(S, b, side, srcObj, uids) {
  var isC = !!S.castles[srcObj.src], pool = isC ? S.castles[srcObj.src].units : S.provs[srcObj.src].units;
  var mv = pool.filter(function (u) { return uids.indexOf(u.uid) >= 0; }); if (!mv.length) return null;
  if (isC) S.castles[srcObj.src].units = pool.filter(function (u) { return uids.indexOf(u.uid) < 0; }); else S.provs[srcObj.src].units = pool.filter(function (u) { return uids.indexOf(u.uid) < 0; });
  b.mid = (b.mid || []).concat(mv.map(function (u) { return { side: side, src: srcObj.src, u: cloneU(u) }; }));
  if (side === 'atk') { b.unitFrom = b.unitFrom || {}; mv.forEach(function (u) { b.unitFrom[u.uid] = srcObj.src; }); if (!b.fronts) b.fronts = [{ from: b.from }]; }
  else { b.reinf = b.reinf || {}; mv.forEach(function (u) { b.reinf[u.uid] = srcObj.src; }); }
  var w = worldMap();
  return { list: mv.map(cloneU), path: srcObj.path, inTo: srcObj.path.map(function (h) { return w.provAt(h[0], h[1]) === b.to; }), delay: srcObj.delay, name: srcObj.name };
}
// 合戦を はじめから やりなおす とき：とちゅうで よんだ 援軍を もとの 城へ もどす
function returnMid(S, b) {
  var m = b.mid || []; if (!m.length) return 0;
  m.forEach(function (o) {
    var clan = o.side === 'atk' ? b.atkClan : b.defClan, C0 = S.castles[o.src], P0 = S.provs[o.src];
    if (C0 && C0.owner === clan && C0.units.length < 8) C0.units.push(o.u);
    else if (P0 && P0.owner === clan && P0.units.length < PROV_CAP) P0.units.push(o.u);
    else if (C0 && S.provs[C0.prov].owner === clan && S.provs[C0.prov].units.length < PROV_CAP) S.provs[C0.prov].units.push(o.u);
    if (b.unitFrom) delete b.unitFrom[o.u.uid]; if (b.reinf) delete b.reinf[o.u.uid];
  });
  b.mid = []; return m.length;
}
function backReinf(S, b, list) {
  list.forEach(function (u) {
    var src = b.reinf[u.uid], C0 = S.castles[src];
    if (C0) { if (C0.owner === b.defClan && C0.units.length < 8) C0.units.push(u); else if (S.provs[C0.prov].owner === b.defClan && S.provs[C0.prov].units.length < PROV_CAP) S.provs[C0.prov].units.push(u); }
    else if (S.provs[src] && S.provs[src].owner === b.defClan && S.provs[src].units.length < PROV_CAP) S.provs[src].units.push(u);
  });
}
// たおした てきの へいの 一部は 降参して かった がわに くわわる（けがの かるい へい）
var KILL_JOIN = 0.25;
function killJoinRate(S, b, side) { var o = S.officers ? S.officers[side === 'atk' ? b.atkOff : b.defOff] : null, cl = side === 'atk' ? b.atkClan : b.defClan; return Math.max(0.15, Math.min(0.4, KILL_JOIN + (offP(o) - 50) / 400 + streakBonus(S, cl))); }
// 連勝（つづけて かった かず）：評判で 降参・志願・寝返りが ふえる
function streakOf(S, cid) { return cid && S.clans[cid] ? S.clans[cid].streak || 0 : 0; }
function streakBonus(S, cid) { return Math.min(5, streakOf(S, cid)) * 0.02; }
// まけた がわが うしなった へい（にげた・生きのこった ぶんは のぞく）を 兵種ごとに
function lostByType(init, surv, fled) {
  // 兵種ごとの へった かず（合流で 隊が まとまっても ただしく なるように 合計で くらべる）
  var ids = {}, by = {}; (init || []).forEach(function (u) { if (u.type === 'taisho' || u.type === 'konida') return; ids[u.uid] = 1; by[u.type] = (by[u.type] || 0) + u.hp; });
  (surv || []).concat(fled || []).forEach(function (u) { if (ids[u.uid] && by[u.type] !== undefined) by[u.type] -= u.hp; });
  Object.keys(by).forEach(function (t) { if (by[t] <= 0) delete by[t]; });
  return by;
}
// 隊を まとめる：おなじ 兵種で へった 隊どうしを あわせ、10わり（満員）の 隊に する
function canMergeUnits(list) {
  var by = {}; (list || []).forEach(function (u) { (by[u.type] = by[u.type] || []).push(u); });
  return Object.keys(by).some(function (t) { var a = by[t], sum = a.reduce(function (s0, u) { return s0 + u.hp; }, 0); return a.length > Math.ceil(sum / 10 - 1e-6); });
}
function mergeUnits(list) {
  var by = {}, order = [];
  list.forEach(function (u) { if (!by[u.type]) { by[u.type] = []; order.push(u.type); } by[u.type].push(u); });
  var out = [], gone = 0;
  order.forEach(function (t) {
    var a = by[t].slice().sort(function (x, y) { return y.hp - x.hp; }), sum = a.reduce(function (s0, u) { return s0 + u.hp; }, 0), n = Math.max(1, Math.ceil(sum / 10 - 1e-6));
    a.forEach(function (u, i) { if (i < n) { var v = Math.min(10, sum); u.hp = Math.round(v * 100) / 100; sum -= v; if (u.full !== undefined) u.full = Math.max(u.full, u.hp); out.push(u); } else gone++; });
  });
  list.length = 0; out.forEach(function (u) { list.push(u); });
  return gone;
}
function killJoin(S, b, res) {
  var w = res.winner, lose = w === 'atk' ? 'def' : 'atk';
  var by = lostByType(lose === 'atk' ? b.atkUnits : b.defUnits, lose === 'atk' ? res.atkSurv : res.defSurv, lose === 'atk' ? res.atkFled : res.defFled);
  var rate = killJoinRate(S, b, w), out = [], men = 0;
  Object.keys(by).forEach(function (t) {
    var hp = Math.round(by[t] * rate);
    while (hp >= 1) { var nu = newUnit(S, t); nu.hp = Math.min(10, hp); hp -= nu.hp; out.push(nu); men += nu.hp * UNIT_TYPES[t].men / 10; }
  });
  return { list: out, men: Math.round(men) };
}
// 攻めてが ひきあげた とき：のこした 兵糧（石）
function lootRice(b, res) {
  if (res.winner !== 'def' || res.foodOut) return 0;
  var left = res.atkFood !== undefined ? res.atkFood : menOfUnits(b.atkUnits) * RICE_PER_MAN * (b.foodDays || 0) * 0.35;   // おまかせは めやす
  var share = res.atkSurv && res.atkSurv.length ? 0.5 : 0.8;   // ぜんめつなら ほとんど、にげたなら 半分を おいていく
  return Math.round(left * share);
}
function applyBattle(S, b, res) {
  // 援軍の 生きのこりは あとで じぶんの 城へ もどる
  var rein = [];
  if (b.reinf && res.defSurv) { rein = res.defSurv.filter(function (u) { return b.reinf[u.uid]; }); res.defSurv = res.defSurv.filter(function (u) { return !b.reinf[u.uid]; }); }
  noteWar(S, b.atkClan, b.defClan);
  var kj = killJoin(S, b, res), loot = lootRice(b, res);
  // 連勝の かず
  var wc0 = res.winner === 'atk' ? b.atkClan : b.defClan, lc0 = res.winner === 'atk' ? b.defClan : b.atkClan;
  if (wc0 && S.clans[wc0]) S.clans[wc0].streak = (S.clans[wc0].streak || 0) + 1;
  if (lc0 && S.clans[lc0]) S.clans[lc0].streak = 0;
  var stk = streakOf(S, wc0);
  if (stk >= 2 && wc0 !== IKKI) {   // 2連勝から 志願兵：1連勝 ふえるごとに 足軽 90人（さいだい 450人）
    var vhp = Math.min(15, (stk - 1) * 3);
    while (vhp > 0) { var vu = newUnit(S, 'ashigaru'); vu.hp = Math.min(10, vhp); vhp -= vu.hp; vu._vol = 1; kj.list.push(vu); }
  }
  var out = applyBattle0(S, b, res);
  if (rein.length) { backReinf(S, b, rein); res.reinBack = rein.length; }
  // たおした てきの 降参兵：かった がわの 城へ（いっぱいなら となりの 国へ）
  var wc = res.winner === 'atk' ? b.atkClan : b.defClan;
  if (kj.list.length && wc) {
    var put = 0, C1 = b.castleId ? S.castles[b.castleId] : null, P1 = S.provs[b.to];
    // 支城を おとした ときは 出陣した 国へ（城に のこす 隊の かずは かえない）
    var spots = C1 && res.winner === 'atk' ? [[S.provs[b.from].units, PROV_CAP, S.provs[b.from].owner], [P1.units, PROV_CAP, P1.owner]]
      : [[C1 ? C1.units : null, 8, C1 ? C1.owner : null], [P1.units, PROV_CAP, P1.owner]].concat(res.winner === 'atk' ? [[S.provs[b.from].units, PROV_CAP, S.provs[b.from].owner]] : []);
    var vput = 0;
    kj.list.forEach(function (u) {
      var v = u._vol; delete u._vol;
      for (var i = 0; i < spots.length; i++) { var sp = spots[i]; if (sp[0] && sp[2] === wc && sp[0].length < sp[1]) { sp[0].push(u); if (v) vput += u.hp * UNIT_TYPES[u.type].men / 10; else put += u.hp * UNIT_TYPES[u.type].men / 10; return; } }
    });
    put = Math.round(put); vput = Math.round(vput);
    if (vput) { res.volMen = vput; res.streak = stk; res.volSide = res.winner; logC(S, '🔥 ' + CLANS[wc].name + 'が ' + stk + '連勝！ うわさを きいた 志願兵 ' + vput.toLocaleString('ja-JP') + '人が あつまった', wc === S.player ? 'good' : 'sys'); }
    if (put) { res.killMen = put; res.killSide = res.winner; logC(S, 'たおした てきの へい ' + put.toLocaleString('ja-JP') + '人が 降参して ' + CLANS[wc].name + 'に くわわった', wc === S.player ? 'good' : (b.atkClan === S.player || b.defClan === S.player ? 'bad' : 'sys')); }
  }
  // 攻めてが にげた：のこした 兵糧を 城の 蔵へ
  if (loot > 0 && b.defClan) {
    var cid = b.castleId || null, own = cid ? S.castles[cid].owner : S.provs[b.to].owner;
    if (own === b.defClan) {
      var cap = castleFoodCap(S, b.to, cid), cur = castleFood(S, b.to, cid), add = Math.max(0, Math.min(loot, Math.round(cap * 1.5) - cur));
      if (add > 0) { setCastleFood(S, b.to, cid, cur + add); res.lootRice = add; logC(S, CLANS[b.defClan].name + 'は にげた てきの 兵糧 ' + add + '石を てに いれた', b.defClan === S.player ? 'good' : (b.atkClan === S.player ? 'bad' : 'sys')); }
    }
  }
  return out;
}
function applyBattle0(S, b, res) {
  // 城の 兵糧：たべた ぶん へる（おまかせは めやすで）
  if (b.defFood !== undefined) {
    var left = res.defFood !== undefined ? res.defFood : Math.max(0, b.defFood - menOfUnits(b.defUnits) * RICE_PER_MAN * Math.min(b.foodDays || 20, 25) * 0.5);
    setCastleFood(S, b.to, b.castleId || null, res.winner === 'atk' ? left * 0.5 : left);   // おとした 城の 蔵は 半分 のこる
  }
  if (S.provs[b.to]) S.provs[b.to].warHit = (S.provs[b.to].warHit || 0) + 4;   // いくさで 田畑が あれる
  var A = S.provs[b.from], B = S.provs[b.to];
  // 退き口から にげた 隊：その 国へ（じぶんの 国の ときだけ）
  function sendFled(list, clan) {
    (list || []).forEach(function (u) {
      var P = S.provs[u.to]; if (!P || P.owner !== clan || P.units.length >= PROV_CAP) return;
      P.units.push({ uid: u.uid, type: u.type, hp: u.hp });
    });
  }
  var atkName = CLANS[b.atkClan].name, defName = b.defClan ? CLANS[b.defClan].name : '';
  if (b.castleId) {   // ---- 支城の 合戦 ----
    var C0 = S.castles[b.castleId];
    sendFled(res.atkFled, b.atkClan); sendFled(res.defFled, b.defClan);
    if (res.winner === 'atk') {
      var pr = takePrisoners(S, b, res.defSurv); res.defSurv = pr.rest; res.prisMen = pr.men;
      var winners = res.atkSurv.concat(pr.joined);
      C0.owner = b.atkClan; C0.ruin = 1; (S.fallen || (S.fallen = {}))[b.castleId] = S.turn;
      // 支城には 3隊だけ のこす（降参した へいと よわった 隊から）。のこりは 出陣した 国へ もどる
      var jid = pr.joined.map(function (u) { return u.uid; });
      var order = winners.slice().sort(function (x, y) { return (jid.indexOf(y.uid) >= 0) - (jid.indexOf(x.uid) >= 0) || x.hp - y.hp; });
      var room = A.owner === b.atkClan ? Math.max(0, PROV_CAP - A.units.length) : 0;
      var keep = b.atkClan === S.player ? BRANCH_KEEP : 8;   // CPU は これまでどおり 支城に つめる
      var nKeep = Math.min(8, Math.max(Math.min(keep, order.length), order.length - room));
      C0.units = order.slice(0, nKeep);
      var ret = order.slice(nKeep), toA = ret.filter(function (u) { var h = b.unitFrom && b.unitFrom[u.uid]; return !h || (S.castles[h] ? false : h === b.from || S.provs[h].owner !== b.atkClan); });
      if (A.owner === b.atkClan) A.units = A.units.concat(toA); else sendHome(S, b, toA);
      sendHome(S, b, ret.filter(function (u) { return toA.indexOf(u) < 0; }));   // ほかの 方面の 軍は じぶんの 国へ
      res.keptN = nKeep; res.backN = ret.length; res.backUids = A.owner === b.atkClan ? toA.map(function (u) { return u.uid; }) : [];
      if (pr.men) logC(S, 'てきの へい ' + pr.men.toLocaleString('ja-JP') + '人が 降参して ' + atkName + 'に くわわった', b.atkClan === S.player ? 'good' : 'sys');
      // まけた 守りは その国の 本城（自分の 国なら）か となりの 自分の 国へ
      if (b.defClan && res.defSurv.length) {
        var home = S.provs[b.to].owner === b.defClan ? b.to : (ADJ[b.to].filter(function (q) { return S.provs[q].owner === b.defClan; })[0] || null);
        if (home) { var Hm = S.provs[home]; Hm.units = Hm.units.concat(res.defSurv.slice(0, Math.max(0, PROV_CAP - Hm.units.length))); }
      }
      logC(S, atkName + 'が ' + brName(b.castleId) + '（' + PROV_BY[b.to].name + 'の 支城）を おとした！', b.atkClan === S.player ? 'good' : (b.defClan === S.player ? 'bad' : 'sys'));
    } else {
      var rl = b.relief || [], back = res.defSurv.filter(function (u) { return rl.indexOf(u.uid) >= 0; });
      C0.units = res.defSurv.filter(function (u) { return rl.indexOf(u.uid) < 0; }).slice(0, 8);
      if (back.length) { var Hp = S.provs[b.to]; if (Hp.owner === b.defClan) Hp.units = Hp.units.concat(back.slice(0, Math.max(0, PROV_CAP - Hp.units.length))); }
      sendHome(S, b, res.atkSurv);
      logC(S, defName + 'が ' + brName(b.castleId) + 'を まもりきった', b.defClan === S.player ? 'good' : (b.atkClan === S.player ? 'bad' : 'sys'));
    }
    S.pendingBattle = null; checkClans(S);
    return;
  }
  if (res.winner === 'atk') {
    // 本城が おちた：のこりの 支城の 多くは 降参する
    branchesIn(S, b.to).forEach(function (c) {
      if (c.owner !== b.defClan || !b.defClan) return;
      if (cRand(S) < 0.6) { c.owner = b.atkClan; c.units = c.units.map(function (u) { return { uid: u.uid, type: u.type, hp: Math.max(1, Math.floor(u.hp / 2)) }; }); logC(S, brName(c.id) + 'は 降参した', b.atkClan === S.player ? 'good' : 'sys'); }
      else logC(S, brName(c.id) + 'は まだ 抵抗している', b.defClan === S.player ? 'good' : 'sys');
    });
    // のこった 守りの 何割かは 降参して みかたに
    var pr2 = takePrisoners(S, b, res.defSurv); res.defSurv = pr2.rest; res.prisMen = pr2.men;
    B.owner = b.atkClan; B.units = res.atkSurv.concat(pr2.joined).slice(0, PROV_CAP); B.acted = true; B.ruin = 1; (S.fallen || (S.fallen = {}))[b.to] = S.turn;
    B.fuman = Math.max(B.owner === IKKI ? 0 : 20, Math.min(B.fuman || 0, 40)); if (b.defClan === IKKI) B.tax = TAX_DEF;
    if (pr2.men) logC(S, 'てきの へい ' + pr2.men.toLocaleString('ja-JP') + '人が 降参して ' + atkName + 'に くわわった', b.atkClan === S.player ? 'good' : 'sys');
    sendFled(res.atkFled, b.atkClan); sendFled(res.defFled, b.defClan);
    // にげおくれた 守り手は 兵が 半分に
    if (res.defFled) res.defSurv = res.defSurv.map(function (u) { return { uid: u.uid, type: u.type, hp: Math.floor(u.hp / 2) }; }).filter(function (u) { return u.hp > 0; });
    // まけた がわの 生きのこりは となりの 自分の国へ にげる
    var esc = null;
    if (b.defClan) {
      esc = ADJ[b.to].filter(function (q) { return S.provs[q].owner === b.defClan; });
      if (esc.length && res.defSurv.length) {
        var dst = S.provs[esc[0]]; var room = PROV_CAP - dst.units.length;
        dst.units = dst.units.concat(res.defSurv.slice(0, Math.max(0, room)));
      }
    }
    B.naio = null;
    var lost = B.officer && S.officers ? S.officers[B.officer] : null;
    B.officer = null;
    if (lost) {
      lost.prov = null;
      var ao2 = b.atkOff ? S.officers[b.atkOff] : null;
      if (!lost.lord && cRand(S) < 0.3 + (offP(ao2) - 50) / 200 + (offI(ao2) - 50) / 300 + streakBonus(S, b.atkClan) * 2) {
        lost.clan = b.atkClan;
        logC(S, lost.name + 'を とらえ、' + CLANS[b.atkClan].name + 'の 家臣に むかえた！', b.atkClan === S.player ? 'good' : 'sys');
      } else if (!lost.lord && !(esc && esc.length)) {
        delete S.officers[lost.id];
        logC(S, lost.name + 'は 行方しれずに なった', 'sys');
      }
    }
    logC(S, atkName + 'が ' + PROV_BY[b.to].name + '（' + castleNameOf(S, b.to) + '）を 攻め落とした！', b.atkClan === S.player ? 'good' : (b.defClan === S.player ? 'bad' : 'sys'));
  } else {
    B.units = res.defSurv.slice(0, PROV_CAP);
    sendFled(res.atkFled, b.atkClan); sendFled(res.defFled, b.defClan);
    sendHome(S, b, res.atkSurv);
    logC(S, defName + 'が ' + PROV_BY[b.to].name + 'を まもりきった（' + atkName + 'は ひきあげた）', b.defClan === S.player ? 'good' : (b.atkClan === S.player ? 'bad' : 'sys'));
  }
  S.pendingBattle = null;
  checkClans(S);
  if (S.officers) { if (b.atkClan) autoAssign(S, b.atkClan, b.atkClan !== S.player); if (b.defClan && S.clans[b.defClan].alive) autoAssign(S, b.defClan, b.defClan !== S.player); }
}
function checkClans(S) {
  CLAN_ORDER.forEach(function (cid) {
    if (S.clans[cid].alive && provsOf(S, cid).length === 0) {
      S.clans[cid].alive = false;
      // のこった 支城は その 国の 持ち主へ
      if (S.castles) for (var k in S.castles) { var c0 = S.castles[k]; if (c0.owner === cid) { c0.owner = S.provs[c0.prov].owner; c0.units = []; } }
      S.allies = (S.allies || []).filter(function (p) { return p[0] !== cid && p[1] !== cid; });
      if (S.officers) dropClanOfficers(S, cid);
      logC(S, CLANS[cid].name + 'は ほろびた…', cid === S.player ? 'bad' : 'sys');
    }
  });
  if (!S.clans[S.player].alive) { S.over = true; S.winner = null; S.phase = 'over'; }
  else if (provsOf(S, S.player).length === PROVS.length) { S.over = true; S.winner = S.player; S.phase = 'over'; logC(S, '中国地方を 統一した！', 'good'); }
}

// ---- おまかせ合戦（すばやく けっかを きめる） ----
function autoResolve(S, b) {
  var atk = b.atkUnits.map(cloneU), def = b.defUnits.map(cloneU);
  var ao = b.atkOff && S.officers ? S.officers[b.atkOff] : null, dO = b.defOff && S.officers ? S.officers[b.defOff] : null;
  var mult = castleMult(b.castle) * lvMult(b.fortLv) * (b.ruin ? RUIN_DEF : 1) * (b.castleId ? BRANCH_DEF : 1) * (1 + (offI(dO) - 50) / 400) * (b.naio ? 0.85 : 1);
  var am = warMult(ao) * routeMult(b.from, b.to) * (b.fronts ? 1 + 0.08 * (b.fronts.length - 1) : 1), dm = warMult(dO);
  if (b.foodDays && b.need && b.foodDays < b.need) am *= Math.max(0.3, 0.3 + 0.7 * b.foodDays / b.need);   // 兵糧が たりないと 力を だしきれない
  // 籠城：城の 兵糧が せめての 兵糧より さきに つきると 守りきれない
  if (b.defFood !== undefined) {
    var dMen = menOfUnits(b.defUnits), dDays = dMen ? b.defFood / (dMen * RICE_PER_MAN) : 999;
    if (b.foodDays && dDays < b.foodDays) dm *= Math.max(0.45, 0.45 + 0.55 * dDays / b.foodDays);
  }   // 何か所からも せめると 守りが ばらける
  if (!def.length) return { winner: 'atk', atkSurv: atk, defSurv: [] };
  var start = atk.reduce(function (s, u) { return s + u.hp; }, 0);
  function power(list) { var p = 0; list.forEach(function (u) { p += UNIT_TYPES[u.type].atk * u.hp / 10; }); return p; }
  function hit(list, dmg) {
    while (dmg > 0) {
      var alive = list.filter(function (u) { return u.hp > 0; }); if (!alive.length) return;
      var u = alive[Math.floor(cRand(S) * alive.length)];
      var d = Math.min(u.hp, Math.max(1, Math.round(dmg > 3 ? 3 : dmg))); u.hp -= d; dmg -= d;
    }
  }
  // その合戦の 運・士気（攻め手の いきおい）
  var luck = Math.exp(((cRand(S) + cRand(S) + cRand(S)) / 3 - 0.5) * LUCK_SPREAD);
  for (var round = 0; round < 10; round++) {
    var pa = power(atk) * am * luck * (0.85 + cRand(S) * 0.3), pd = power(def) * dm * (0.85 + cRand(S) * 0.3);
    hit(def, pa * 0.55 / mult);
    hit(atk, pd * 0.55);
    atk = atk.filter(function (u) { return u.hp > 0; }); def = def.filter(function (u) { return u.hp > 0; });
    if (!def.length) return { winner: 'atk', atkSurv: atk, defSurv: [] };
    var now = atk.reduce(function (s, u) { return s + u.hp; }, 0);
    if (!atk.length || now < start * 0.35) return { winner: 'def', atkSurv: atk, defSurv: def };
  }
  return { winner: 'def', atkSurv: atk, defSurv: def };
}

// ---- CPU 大名 ----
function cpuThreshold(S, cid) {
  var base = S.difficulty === 'hard' ? 1.0 : S.difficulty === 'easy' ? 1.4 : 1.22;
  // お金が あまっている 大名は すこし むりしてでも せめる（にらみあいを やぶる）
  var rich = Math.max(0.7, 1 - S.clans[cid].gold / 2500);
  return base * rich / (CLANS[cid].aggr || 1);
}
// CPU が プレイヤーを せめるときに もとめる 兵力の ゆとり
function playerGuard(S) { return S.difficulty === 'easy' ? 1.6 : S.difficulty === 'hard' ? 1.1 : 1.3; }
// プレイヤーを せめはじめる ターン（さいしょの ゆうよ）
function truceTurns(S) { return S.difficulty === 'easy' ? 6 : S.difficulty === 'hard' ? 3 : 4; }
// 1つの 国の 行動を きめる（返り値: {kind, ...}）
function cpuDecide(S, pid) {
  var P = S.provs[pid], cid = P.owner, C = S.clans[cid];
  var neigh = ADJ[pid];
  var tgts = attackTargets(S, pid, cid).filter(function (t) { return !isAlly(S, cid, t.owner); });
  var hostileBorder = neigh.some(function (q) { return S.provs[q].owner !== cid; });
  // こうげき
  if (!didCmd(P, 'attack') && tgts.length && P.units.length >= 4) {
    var keepN = Math.max(1, Math.round(P.units.length * 0.25));
    var sorted = P.units.slice().sort(function (a, b) { return strength([b]) - strength([a]); });
    var send0 = sorted.slice(0, P.units.length - keepN);
    var best = null;
    tgts.forEach(function (t) {
      var q = t.to;
      if (t.owner === S.player && S.turn <= truceTurns(S)) return;
      var send = seaRoute(pid, q) ? send0.filter(function (u) { return u.type !== 'kiba'; }) : send0;
      if (!send.length) return;
      var ratio = strength(send) * routeMult(pid, q) / tgtStrength(S, t);
      if (t.owner === S.player) ratio /= playerGuard(S) * (seaRoute(pid, q) && S.difficulty !== 'hard' ? 1.25 : 1);
      var sc = ratio + PROV_BY[q].koku / (t.castle ? 120 : 60) + (t.owner === S.player && S.difficulty === 'hard' ? 0.15 : 0) + cRand(S) * 0.2;
      if (ratio >= cpuThreshold(S, cid) && (!best || sc > best.sc)) best = { q: q, castle: t.castle, sc: sc, send: send };
    });
    // さいしょの 1年は すこし おとなしく
    if (best && (S.turn > 2 || cRand(S) < 0.4)) return { kind: 'attack', to: best.q, castle: best.castle, uids: best.send.map(function (u) { return u.uid; }) };
  }
  // 調略（智の 高い 城主が いれば ときどき）
  var myO = officerAt(S, pid);
  if (!didCmd(P, 'scheme') && S.officers && myO && offI(myO) >= 75 && C.gold >= SCHEME_COST + 40 && cRand(S) < 0.25) {
    var sc2 = null;
    neigh.forEach(function (q) { var oc = S.provs[q].owner; if (oc === cid || (oc === S.player && S.turn <= truceTurns(S))) return;
      var p2 = oc === S.player && S.difficulty === 'easy' ? 0 : schemeOdds(S, pid, q, 'submit'); if (p2 > 0.35 && (!sc2 || p2 > sc2.p)) sc2 = { q: q, p: p2, k: 'submit' };
      var p3 = schemeOdds(S, pid, q, 'ally'); if (oc !== S.player && p3 > 0.5 && !sc2) sc2 = { q: q, p: p3, k: 'ally' }; });
    if (sc2) return { kind: 'scheme', to: sc2.q, how: sc2.k };
  }
  // 徴兵（前線を 優先）
  var front = hostileBorder;
  if (!didCmd(P, 'recruit') && P.units.length < PROV_CAP && C.gold >= 20 && (front || P.units.length < 4)) {
    var budget = Math.floor(C.gold * (front ? 0.7 : 0.4)), order = {}, room = PROV_CAP - P.units.length, cnt = 0;
    var pref = ['ashigaru', 'yumi', 'ashigaru', 'kiba', 'ashigaru', 'kosaku', 'yumi'];
    if (teppoOk(S)) pref.push('teppo');
    if (cid === 'amago' || cid === 'ouchi') { pref.push('kiba'); if (teppoOk(S)) pref.push('teppo'); }
    var guard = 0;
    while (room > 0 && guard++ < 30) {
      var t = pref[Math.floor(cRand(S) * pref.length)];
      if (unitCost(t) > budget) { if (unitCost('ashigaru') > budget) break; t = 'ashigaru'; }
      order[t] = (order[t] || 0) + 1; budget -= unitCost(t); room--; cnt++;
    }
    if (cnt) return { kind: 'recruit', order: order };
  }
  // 後方の兵を 前線へ
  if (!didCmd(P, 'move') && !front && P.units.length > 2) {
    var fr = neigh.filter(function (q) { return S.provs[q].owner === cid && isFrontier(S, q) && S.provs[q].units.length < PROV_CAP - 2; });
    if (fr.length) {
      var dst = fr[0], n = Math.min(P.units.length - 2, PROV_CAP - S.provs[dst].units.length);
      if (n > 0) return { kind: 'move', to: dst, uids: P.units.slice(0, n).map(function (u) { return u.uid; }) };
    }
  }
  if (!didCmd(P, 'develop') && C.gold >= DEVELOP_COST + 30 && P.koku < cpuKokuGoal(S, pid)) return { kind: 'develop' };
  return { kind: 'wait' };
}
// CPU フェーズ：プレイヤーへの 攻撃が おきたら そこで とまる
function cpuGarrison(S, cid) {
  // 前線の 支城に 守備兵を 2〜3たい おく（へっていたら 本城から おぎなう）
  provsOf(S, cid).forEach(function (pid) {
    var P = S.provs[pid];
    branchesIn(S, pid).forEach(function (c) {
      if (c.owner !== cid || c.units.length >= 3 || P.units.length < 8) return;
      var u = P.units.slice().sort(function (a, b) { return b.hp - a.hp; })[0];
      garrison(S, c.id, [u.uid], []);
    });
  });
}
function cpuBegin(S) {
  S.phase = 'cpu';
  CLAN_ORDER.forEach(function (cid) { if (cid !== S.player && S.clans[cid].alive && S.castles) cpuGarrison(S, cid); });
  var queue = [];
  CLAN_ORDER.forEach(function (cid) {
    if (cid === S.player || !S.clans[cid].alive) return;
    provsOf(S, cid).forEach(function (pid) { queue.push(pid); });
  });
  // まぜる
  for (var i = queue.length - 1; i > 0; i--) { var j = Math.floor(cRand(S) * (i + 1)); var tmp = queue[i]; queue[i] = queue[j]; queue[j] = tmp; }
  S.cpu = { queue: queue };
}
var CPU_CMDS = 0;   // 0＝むずかしさで きめる（CPU は 1つの 国で きせつごとに かんたん・ふつう 1つ、むずかしい 2つまで）
function cpuCmds(S) { return CPU_CMDS || (S.difficulty === 'hard' ? 2 : 1); }
function cpuNext(S) {
  if (S.over) return { type: 'over' };
  while (S.cpu && S.cpu.queue.length) {
    var pid = S.cpu.queue.shift();
    var P = S.provs[pid];
    if (!P.owner || P.owner === S.player || P.owner === IKKI || P.acted || !S.clans[P.owner].alive || cmdCount(P) >= cpuCmds(S)) continue;
    var d = cpuDecide(S, pid);
    if (d.kind === 'wait') continue;
    if (d.kind !== 'attack' && cmdCount(P) + 1 < cpuCmds(S)) S.cpu.queue.unshift(pid);   // つづけて もう1つ
    if (d.kind === 'attack') {
      var b = makeBattle(S, pid, d.to, d.uids, d.castle || null);
      startBattle(S, b);
      if (b.defClan === S.player) {
        logC(S, CLANS[b.atkClan].lord + 'が ' + PROV_BY[pid].name + 'から ' + b.castleName + 'に せめてきた！（' + b.atkUnits.length + 'たい）', 'bad');
        return { type: 'battle', battle: b };
      }
      applyBattle(S, b, autoResolve(S, b));
      if (S.over) return { type: 'over' };
    } else if (d.kind === 'recruit') recruit(S, pid, d.order);
    else if (d.kind === 'develop') develop(S, pid);
    else if (d.kind === 'move') moveUnits(S, pid, d.to, d.uids);
    else if (d.kind === 'scheme') { var sr = scheme(S, pid, d.to, d.how); if (S.over) return { type: 'over' }; }
    markCmd(P, d.kind);   // しっぱいしても 同じ めいれいは もう しない
  }
  return { type: 'done' };
}
function seasonEnd(S) {
  S.cpu = null;
  S.season++; S.turn++;
  if (S.season > 3) { S.season = 0; S.year++; }
  seasonStart(S);
  logC(S, '―― ' + eraName(S.year) + '年 ' + SEASONS_K[S.season] + ' ――', 'sys');
  officerSeason(S);
  // 同盟は ときどき きれる
  (S.allies || []).slice().forEach(function (p) { if (cRand(S) < ALLY_BREAK) breakAlliance(S, p[0], p[1]); });
  // できごと
  if (typeof fireEvents === 'function') fireEvents(S);
}
var ALLY_BREAK = 0.03;

// ---- 合戦の 大きさ・地形のたね ----
function battleSizeIndex(b) { var m = Math.max(b.atkUnits.length, b.defUnits.length), s = m <= 9 ? 0 : m <= 14 ? 1 : 2; var cs = CASTLES[castleIndexOf(b.castle)]; return Math.max(s, (cs && cs.minSize) || 0); }
function battleSeed(S, pid) { return (S.seed % 100000) * 31 + PROV_BY[pid].idx * 7919 + 1; }
function castleIndexOf(id) { for (var i = 0; i < CASTLES.length; i++) if (CASTLES[i].id === id) return i; return 0; }


// ---- 家臣（武・政・智、登場年〜去る年） ----
// c: 仕える家（シナリオで ちがう ときは cs）、df: 寝返り {y: 年, to: 家}
var OFFICERS = [
  // 毛利家
  { id:'shiji',    name:'志道広良',   st:[52,82,78], c:'mori', y0:1523, y1:1557 },
  { id:'katsura',  name:'桂元澄',     st:[66,62,70], c:'mori', y0:1523, y1:1569 },
  { id:'fukubaraH',name:'福原広俊',   st:[58,72,60], c:'mori', y0:1523, y1:1560 },
  { id:'inoue',    name:'井上元兼',   st:[55,68,50], c:'mori', y0:1523, y1:1550 },
  { id:'takamoto', name:'毛利隆元',   st:[52,86,72], c:'mori', y0:1540, y1:1563 },
  { id:'motoharu', name:'吉川元春',   st:[96,58,66], c:'mori', y0:1547, y1:1586 },
  { id:'takakage', name:'小早川隆景', st:[78,90,94], c:'mori', y0:1544, y1:1597 },
  { id:'kuchiba',  name:'口羽通良',   st:[62,74,72], c:'mori', y0:1545, y1:1582 },
  { id:'kodama',   name:'児玉就忠',   st:[50,80,66], c:'mori', y0:1540, y1:1562 },
  { id:'fukubaraS',name:'福原貞俊',   st:[68,72,70], c:'mori', y0:1545, y1:1593 },
  { id:'akagawa',  name:'赤川元保',   st:[55,75,65], c:'mori', y0:1540, y1:1567 },
  { id:'kokushi',  name:'国司元相',   st:[70,60,60], c:'mori', y0:1540, y1:1592 },
  { id:'shishido', name:'宍戸隆家',   st:[70,58,60], c:'mori', y0:1534, y1:1592 },
  { id:'nomi',     name:'乃美宗勝',   st:[80,50,64], c:'mori', y0:1550, y1:1592 },
  { id:'kumagai',  name:'熊谷信直',   st:[88,45,50], c:'takeda', cs:{ '1554':'mori' }, y0:1523, y1:1593, df:{ y:1533, to:'mori' } },
  { id:'kagawa',   name:'香川光景',   st:[70,55,60], c:'takeda', cs:{ '1554':'mori' }, y0:1523, y1:1570 },
  { id:'kunitsune',name:'吉川国経',   st:[60,70,72], c:'kikkawa', y0:1523, y1:1531 },
  // 大内家・陶家
  { id:'okifusa',  name:'陶興房',     st:[86,72,82], c:'ouchi', y0:1523, y1:1539 },
  { id:'harukata', name:'陶隆房',     st:[90,58,70], c:'ouchi', y0:1538, y1:1555, sameAs:'陶晴賢' },
  { id:'yoshitaka',name:'大内義隆',   st:[48,80,72], c:'ouchi', y0:1523, y1:1551 },
  { id:'naito',    name:'内藤興盛',   st:[64,76,66], c:'ouchi', y0:1523, y1:1554 },
  { id:'sugi',     name:'杉重矩',     st:[62,68,60], c:'ouchi', y0:1530, y1:1553 },
  { id:'hironaka', name:'弘中隆包',   st:[80,64,80], c:'ouchi', y0:1540, y1:1555 },
  { id:'reizei',   name:'冷泉隆豊',   st:[76,55,62], c:'ouchi', y0:1540, y1:1551 },
  { id:'sagara',   name:'相良武任',   st:[30,82,78], c:'ouchi', y0:1535, y1:1551 },
  { id:'era',      name:'江良房栄',   st:[72,60,76], c:'ouchi', y0:1550, y1:1555 },
  { id:'yoshinaga',name:'大内義長',   st:[40,50,40], c:'ouchi', y0:1551, y1:1557 },
  // 尼子家
  { id:'kunihisa', name:'尼子国久',   st:[86,52,58], c:'amago', y0:1523, y1:1554 },
  { id:'kamei',    name:'亀井秀綱',   st:[58,76,72], c:'amago', y0:1523, y1:1550 },
  { id:'haruhisa', name:'尼子晴久',   st:[80,72,72], c:'amago', y0:1530, y1:1561, notLord:true },
  { id:'sanehisa', name:'尼子誠久',   st:[80,45,50], c:'amago', y0:1530, y1:1554 },
  { id:'ushio',    name:'牛尾幸清',   st:[70,56,56], c:'amago', y0:1530, y1:1566 },
  { id:'uyama',    name:'宇山久兼',   st:[64,72,66], c:'amago', y0:1540, y1:1566 },
  { id:'honjo',    name:'本城常光',   st:[86,44,54], c:'amago', y0:1540, y1:1562 },
  { id:'shikanosuke', name:'山中幸盛', st:[92,52,72], c:'amago', y0:1560, y1:1578 },
  { id:'tachihara',name:'立原久綱',   st:[66,66,76], c:'amago', y0:1555, y1:1600 },
  // 浦上家・三村家
  { id:'yoshiie',  name:'宇喜多能家', st:[74,70,80], c:'urakami', y0:1523, y1:1534 },
  { id:'naoie',    name:'宇喜多直家', st:[76,82,99], c:'urakami', y0:1550, y1:1581 },
  { id:'motochika',name:'三村元親',   st:[76,58,60], c:'mimura', y0:1555, y1:1575 },
  // ---- ふやした 武将（史実を もとに） ----
  // 毛利家
  { id:'watanabeK',name:'渡辺通',     st:[72,45,50], c:'mori', y0:1523, y1:1543 },
  { id:'kodamaN',  name:'児玉就方',   st:[70,55,60], c:'mori', y0:1540, y1:1586 },
  { id:'hiragaH',  name:'平賀広相',   st:[62,58,60], c:'mori', y0:1548, y1:1567 },
  { id:'amanoT',   name:'天野隆重',   st:[72,60,62], c:'ouchi', cs:{ '1554':'mori' }, y0:1530, y1:1584, df:{ y:1551, to:'mori' } },
  { id:'sugihara', name:'杉原盛重',   st:[82,55,68], c:'mori', y0:1553, y1:1581 },
  { id:'murakami', name:'村上武吉',   st:[80,62,74], c:'mori', y0:1555, y1:1604 },
  { id:'masuda',   name:'益田藤兼',   st:[66,68,64], c:'ouchi', y0:1550, y1:1597, df:{ y:1557, to:'mori' } },
  { id:'motoharuN',name:'吉川元長',   st:[82,60,66], c:'mori', y0:1565, y1:1587 },
  { id:'hiroie',   name:'吉川広家',   st:[74,72,82], c:'mori', y0:1577, y1:1625 },
  { id:'motokiyo', name:'毛利元清',   st:[72,68,70], c:'mori', y0:1566, y1:1597 },
  { id:'hidekane', name:'毛利秀包',   st:[74,62,64], c:'mori', y0:1582, y1:1601 },
  { id:'ekei',     name:'安国寺恵瓊', st:[22,84,92], c:'mori', y0:1569, y1:1600 },
  { id:'shimizu',  name:'清水宗治',   st:[72,66,74], c:'mimura', cs:{ '1523':'sho' }, y0:1555, y1:1582, df:{ y:1567, to:'mori' } },
  // 大内家・陶家
  { id:'sugiO',    name:'杉興運',     st:[62,64,60], c:'ouchi', y0:1523, y1:1551 },
  { id:'miyagawa', name:'宮川房長',   st:[70,40,50], c:'ouchi', y0:1548, y1:1554 },
  { id:'miuraF',   name:'三浦房清',   st:[66,40,48], c:'ouchi', y0:1548, y1:1555 },
  { id:'naitoT',   name:'内藤隆世',   st:[60,55,52], c:'ouchi', y0:1551, y1:1557 },
  // 尼子家
  { id:'akana',    name:'赤穴光清',   st:[72,48,58], c:'amago', y0:1523, y1:1542 },
  { id:'tagoT',    name:'多胡辰敬',   st:[68,74,82], c:'amago', y0:1523, y1:1562 },
  { id:'okihisa',  name:'塩冶興久',   st:[70,45,48], c:'amago', y0:1523, y1:1534 },
  { id:'kawazoe',  name:'河副久盛',   st:[60,60,60], c:'amago', y0:1540, y1:1566 },
  { id:'yonehara', name:'米原綱寛',   st:[66,50,56], c:'amago', y0:1550, y1:1571 },
  { id:'yoshihisa',name:'尼子義久',   st:[52,62,58], c:'amago', y0:1556, y1:1566 },
  { id:'tomohisa', name:'尼子倫久',   st:[60,55,55], c:'amago', y0:1561, y1:1566 },
  { id:'katsuhisa',name:'尼子勝久',   st:[62,60,64], c:'amago', y0:1568, y1:1578 },
  // 安芸武田家・小早川家・山内家
  { id:'nobuzane', name:'武田信実',   st:[50,48,46], c:'takeda', y0:1530, y1:1541 },
  { id:'masahira', name:'小早川正平', st:[58,55,52], c:'kobayakawa', y0:1538, y1:1543 },
  { id:'okikage',  name:'小早川興景', st:[55,56,52], c:'kobayakawa', y0:1523, y1:1541 },
  { id:'takamichi',name:'山内隆通',   st:[62,60,60], c:'yamanouchi', cs:{ '1554':'mori' }, y0:1538, y1:1598 },
  // 山名家
  { id:'suketoyo', name:'山名祐豊',   st:[58,60,58], c:'yamana', y0:1528, y1:1580 },
  { id:'kakiya',   name:'垣屋続成',   st:[64,58,62], c:'yamana', y0:1523, y1:1573 },
  { id:'takanobu', name:'武田高信',   st:[74,50,60], c:'yamana', y0:1550, y1:1582 },
  { id:'toyokuni', name:'山名豊国',   st:[50,64,64], c:'yamana', y0:1565, y1:1626 },
  // 吉見家・小笠原家・庄家・三村家
  { id:'masayori', name:'吉見正頼',   st:[74,64,70], c:'yoshimi', y0:1530, y1:1588, sameAs:'吉見正頼' },
  { id:'shimose',  name:'下瀬頼定',   st:[66,52,58], c:'yoshimi', y0:1550, y1:1590 },
  { id:'hiroyori', name:'吉見広頼',   st:[58,58,58], c:'yoshimi', y0:1555, y1:1598 },
  { id:'nagakatsu',name:'小笠原長雄', st:[70,56,60], c:'ogasawara', y0:1540, y1:1569 },
  { id:'shoT',     name:'庄高資',     st:[62,50,52], c:'sho', y0:1545, y1:1571 },
  { id:'iechika',  name:'三村家親',   st:[80,66,70], c:'mimura', cs:{ '1523':'sho' }, y0:1540, y1:1566, sameAs:'三村家親' },
  { id:'chikashige',name:'三村親成',  st:[62,64,68], c:'mimura', y0:1550, y1:1604 },
  { id:'ishikawa', name:'石川久式',   st:[62,58,56], c:'mimura', y0:1560, y1:1575 },
  // 浦上家・宇喜多家
  { id:'masamune', name:'浦上政宗',   st:[60,60,58], c:'urakami', y0:1531, y1:1564 },
  { id:'munekage', name:'浦上宗景',   st:[74,72,78], c:'urakami', y0:1540, y1:1580, sameAs:'浦上宗景' },
  { id:'shimamura',name:'島村盛実',   st:[68,48,52], c:'urakami', y0:1523, y1:1559 },
  { id:'tadaie',   name:'宇喜多忠家', st:[62,52,54], c:'urakami', y0:1555, y1:1609 },
  { id:'togawa',   name:'戸川秀安',   st:[72,60,62], c:'urakami', y0:1560, y1:1597 },
  { id:'akashi',   name:'明石景親',   st:[60,66,66], c:'urakami', y0:1560, y1:1600 },
  { id:'okaI',     name:'岡家利',     st:[62,64,60], c:'urakami', y0:1565, y1:1592 },
  { id:'osafune',  name:'長船貞親',   st:[68,50,50], c:'urakami', y0:1565, y1:1589 }
];
var OFF_BY = {}; OFFICERS.forEach(function (o) { OFF_BY[o.id] = o; });
function offClan(def, S) { return (def.cs && def.cs[S.scenario]) || def.c; }
function lordId(cid) { return 'lord:' + cid; }
// 家臣を じゅんびする
function initOfficers(S) {
  var sc = SCEN_BY[S.scenario];
  S.officers = {}; S.capital = {};
  CLAN_ORDER.forEach(function (cid) { var st0 = sc.start[cid]; if (st0) S.capital[cid] = Object.keys(st0.provs)[0]; });
  CLAN_ORDER.forEach(function (cid) {
    var L = sc.clans[cid] || {}, st = L.st || [60, 60, 60];
    S.officers[lordId(cid)] = { id: lordId(cid), name: CLANS[cid].lord, st: st.slice(), clan: cid, prov: null, lord: true };
  });
  OFFICERS.forEach(function (d) {
    var cid = offClan(d, S);
    if (!CLANS[cid] || S.year < d.y0 || S.year > d.y1) return;
    if (d.notLord && CLANS[cid].lord === d.name) return;
    if (d.sameAs && CLANS[cid].lord === d.sameAs) return;
    if (d.df && S.year >= d.df.y) cid = d.df.to;
    if (!CLANS[cid]) return;
    S.officers[d.id] = { id: d.id, name: d.name, st: d.st.slice(), clan: cid, prov: null, lord: false };
  });
  CLAN_ORDER.forEach(function (cid) { autoAssign(S, cid, true); });
  S.seenOff = {}; Object.keys(S.officers).forEach(function (k) { S.seenOff[k] = 1; });
}
function officersOf(S, cid) { return Object.keys(S.officers || {}).map(function (k) { return S.officers[k]; }).filter(function (o) { return o.clan === cid; }); }
function officerAt(S, pid) { var o = S.provs[pid].officer; return o && S.officers[o] ? S.officers[o] : null; }
// ---- 家臣に 仕事を まかせる（1きせつ 1つ）。のうりょくが 高いと 大成功が ある ----
function offBusy(S, o) { return !!(o && o.busy === S.turn); }
function freeOfficers(S, cid) { return officersOf(S, cid).filter(function (o) { return !offBusy(S, o); }); }
function useOfficer(S, oid) { var o = oid && S.officers[oid]; if (o) o.busy = S.turn; return o || null; }
// ---- 家臣の いばしょ（o.at）：本城＝国の id、支城＝支城の id。城主は その国の 本城に いる ----
function locProv(S, at) { return at && S.castles && S.castles[at] ? S.castles[at].prov : at; }
function locOwner(S, at) { if (!at) return null; if (S.castles && S.castles[at]) return S.castles[at].owner; return S.provs[at] ? S.provs[at].owner : null; }
function locName(S, at) { if (!at) return '—'; if (S.castles && S.castles[at]) return brName(at); return S.provs[at] ? castleNameOf(S, at) : '—'; }
function locLong(S, at) { if (!at) return '—'; return S.castles && S.castles[at] ? brName(at) + '（' + PROV_BY[S.castles[at].prov].name + '）' : PROV_BY[at].name + '・' + castleNameOf(S, at); }
// その国で しごとが できるか：国の 本城・支城に いる。となりの 国の 支城に いる ときは、その 支城と つながる じぶんの 国でも はたらける
function offHere(S, o, pid) {
  if (!o || !o.at || !pid) return false;
  if (o.at === pid) return true;
  var C0 = S.castles && S.castles[o.at]; if (!C0) return false;
  if (C0.prov === pid) return true;
  return S.provs[C0.prov].owner !== o.clan && (ADJ[pid] || []).indexOf(C0.prov) >= 0 && S.provs[pid].owner === o.clan;
}
function officersHere(S, cid, pid) { return officersOf(S, cid).filter(function (o) { return offHere(S, o, pid); }); }
function freeHere(S, cid, pid) { return officersHere(S, cid, pid).filter(function (o) { return !offBusy(S, o); }); }
function locsOf(S, cid) {
  var out = provsOf(S, cid).slice();
  if (S.castles) Object.keys(S.castles).forEach(function (id) { if (S.castles[id].owner === cid) out.push(id); });
  return out;
}
// 城を うしなった 家臣は ちかくの じぶんの 城へ にげる
function offHomeFix(S, cid) {
  var mine = provsOf(S, cid); if (!mine.length) return;
  var cap = S.capital && S.capital[cid] && mine.indexOf(S.capital[cid]) >= 0 ? S.capital[cid] : mine[0];
  officersOf(S, cid).forEach(function (o) {
    if (o.prov && S.provs[o.prov].owner === cid) { o.at = o.prov; return; }
    if (o.at && locOwner(S, o.at) === cid) return;
    var p0 = locProv(S, o.at), nb = p0 ? (ADJ[p0] || []).filter(function (q) { return S.provs[q].owner === cid; }) : [];
    o.at = nb[0] || cap;
  });
}
// 家臣を べつの 城へ うつす：この きせつは もう はたらけない
function moveOfficer(S, oid, to) {
  var o = S.officers[oid]; if (!o || offBusy(S, o) || o.at === to || locOwner(S, to) !== o.clan) return false;
  if (o.prov && o.prov !== to) { S.provs[o.prov].officer = null; o.prov = null; }
  o.at = to; o.busy = S.turn;
  return true;
}
// 大成功の 見こみ：のうりょく 65 から 上がり、100 で 5わり
function premiumP(v) { return Math.max(0, Math.min(0.5, (v - 65) / 70)); }
function offW(o) { return o ? o.st[0] : 45; }
function offP(o) { return o ? o.st[1] : 45; }
function offI(o) { return o ? o.st[2] : 45; }
function warMult(o) { return 1 + (offW(o) - 50) / 250; }
// 城主を おく
function setOfficer(S, pid, oid, manual) {
  var P = S.provs[pid];
  if (oid) {
    var o = S.officers[oid]; if (!o || o.clan !== P.owner) return false;
    if (manual && o.at !== pid) { if (offBusy(S, o)) return false; o.busy = S.turn; }   // ほかの 城から うつって くる
    if (o.prov && o.prov !== pid) S.provs[o.prov].officer = null;   // まえの 城を はなれる
    var cur = P.officer && S.officers[P.officer];
    if (cur && cur.id !== oid) { cur.prov = null; cur.at = pid; }   // まえの 城主は その 城に のこる
    P.officer = oid; o.prov = pid; o.at = pid;
  } else { var c2 = P.officer && S.officers[P.officer]; if (c2) c2.prov = null; P.officer = null; }
  return true;
}
// 自動で 城主を きめる（CPU・はじめ）：大名は 本拠、武の 高い 家臣は 前線
function autoAssign(S, cid, first) {
  var mine = provsOf(S, cid); if (!mine.length) return;
  var offs = officersOf(S, cid);
  // 城を うしなった 家臣は いったん 浪人あつかい（城なし）
  offs.forEach(function (o) { if (o.prov && S.provs[o.prov].owner !== cid) { S.provs[o.prov].officer = null; o.prov = null; } });
  if (!first && cid === S.player) {
    // プレイヤーは 空いた 城だけ、その 城に いる 家臣で うめる（よその 城の 家臣は うごかさない）
    offHomeFix(S, cid);
    mine.filter(function (pid) { return !S.provs[pid].officer; }).forEach(function (pid) {
      var o = offs.filter(function (x) { return !x.prov && x.at === pid; }).sort(function (a, b) { return (b.st[0] + b.st[1]) - (a.st[0] + a.st[1]); })[0];
      if (o) setOfficer(S, pid, o.id);
    });
    return;
  }
  mine.forEach(function (pid) { S.provs[pid].officer = null; });
  offs.forEach(function (o) { o.prov = null; });
  var cap = S.capital && S.capital[cid], home = (cap && mine.indexOf(cap) >= 0) ? cap : mine[0], L = S.officers[lordId(cid)];
  if (L && L.clan === cid) setOfficer(S, home, L.id);
  var rest = offs.filter(function (o) { return !o.lord; }).sort(function (a, b) { return b.st[0] - a.st[0]; });
  var front = mine.filter(function (pid) { return pid !== home && isFrontier(S, pid); });
  var back = mine.filter(function (pid) { return pid !== home && !isFrontier(S, pid); });
  front.concat(back).forEach(function (pid) { var o = rest.shift(); if (o) setOfficer(S, pid, o.id); });
  offHomeFix(S, cid);
}
// 季節ごと：登場・死去・寝返り
function officerSeason(S) {
  if (!S.officers) return;
  OFFICERS.forEach(function (d) {
    var o = S.officers[d.id];
    if (!o && !S.seenOff[d.id] && S.year >= d.y0 && S.year <= d.y1) {
      var cid = offClan(d, S);
      if (CLANS[cid] && ((d.notLord && CLANS[cid].lord === d.name) || (d.sameAs && CLANS[cid].lord === d.sameAs))) { S.seenOff[d.id] = 1; return; }
      if (d.df && S.year >= d.df.y) cid = d.df.to;
      S.seenOff[d.id] = 1;
      if (!CLANS[cid] || !S.clans[cid].alive) return;
      S.officers[d.id] = { id: d.id, name: d.name, st: d.st.slice(), clan: cid, prov: null, lord: false };
      offHomeFix(S, cid);
      logC(S, d.name + 'が ' + CLANS[cid].name + 'の 家臣に くわわった', cid === S.player ? 'good' : 'sys');
      if (typeof sayEvent === 'function') sayEvent(S, S.officers[d.id], 'join');
      return;
    }
    if (o && S.year > d.y1) {
      if (typeof sayEvent === 'function') sayEvent(S, o, 'die');
      if (o.prov) S.provs[o.prov].officer = null;
      delete S.officers[d.id];
      logC(S, d.name + 'が なくなった', o.clan === S.player ? 'bad' : 'sys');
      return;
    }
    if (o && d.df && S.year === d.df.y && S.season === 0 && o.clan !== d.df.to && S.clans[d.df.to] && S.clans[d.df.to].alive && !o.lord) {
      var from = o.clan;
      if (o.prov) S.provs[o.prov].officer = null; o.prov = null; o.clan = d.df.to;
      logC(S, d.name + 'が ' + CLANS[from].name + 'を はなれ ' + CLANS[d.df.to].name + 'に ついた！', d.df.to === S.player ? 'good' : 'sys');
      if (typeof sayEvent === 'function') sayEvent(S, o, 'defect');
    }
  });
  streakDefect(S);
  CLAN_ORDER.forEach(function (cid) { if (S.clans[cid].alive) autoAssign(S, cid, cid !== S.player); });
}
// 連勝している 家へ、となりの 家の 武将が 寝返る（智が ひくい ほど、主家が まけつづける ほど おこりやすい）
function streakDefect(S) {
  CLAN_ORDER.forEach(function (cid) {
    var k = streakOf(S, cid); if (k < 2 || !S.clans[cid].alive || cid === IKKI) return;
    var mine = provsOf(S, cid), nb = {};
    mine.forEach(function (p) { (ADJ[p] || []).forEach(function (q) { var oc = S.provs[q].owner; if (oc && oc !== cid && oc !== IKKI && !isAlly(S, cid, oc)) nb[oc] = 1; }); });
    var cand = Object.keys(S.officers).map(function (id) { return S.officers[id]; }).filter(function (o) { return nb[o.clan] && !o.lord; });
    var done = false;
    cand.forEach(function (o) {
      if (done) return;
      var p = Math.min(0.3, 0.035 * Math.min(6, k)) * (1 + (55 - offI(o)) / 100) * (provsOf(S, o.clan).length < mine.length ? 1.4 : 0.8);
      if (cRand(S) >= p) return;
      var from = o.clan; done = true;
      if (o.prov) S.provs[o.prov].officer = null; o.prov = null; o.clan = cid; o.at = null; o.lord = false;
      offHomeFix(S, cid);
      logC(S, '🔥 ' + CLANS[cid].name + 'の ' + k + '連勝を みて、' + CLANS[from].name + 'の ' + o.name + 'が 寝返った！', cid === S.player ? 'good' : from === S.player ? 'bad' : 'sys');
      if (typeof sayEvent === 'function') sayEvent(S, o, 'defect');
    });
  });
}
// 滅んだ 家の 家臣は 浪人に（いなくなる）
function dropClanOfficers(S, cid) { officersOf(S, cid).forEach(function (o) { if (o.prov) S.provs[o.prov].officer = null; delete S.officers[o.id]; }); }

// ---- 調略 ----
var SCHEME_COST = 30;
function schemeOdds(S, from, to, kind, me, cid) {
  if (me === undefined) me = officerAt(S, from);
  var them = officerAt(S, to), tc = S.provs[to].owner, myC = cid || S.provs[from].owner;
  if (tc === IKKI) return 0;
  var myI = offI(me), myP = offP(me), thI = offI(them);
  if (kind === 'ally') {
    if (isAlly(S, myC, tc)) return 0;
    var big = provsOf(S, tc).length;
    return Math.max(0.05, Math.min(0.85, 0.35 + (myP - 60) / 100 - big * 0.03));
  }
  if (kind === 'submit') {
    var tn = provsOf(S, tc).length, mn = provsOf(S, myC).length;
    if (tn > 2 || tn >= mn + 1 || S.officers[lordId(tc)] && S.officers[lordId(tc)].clan !== tc) return 0;
    if (strength(S.provs[to].units) > strength(totalArmy(S, myC)) * 0.9) return 0.05;
    return Math.max(0.05, Math.min(0.8, 0.25 + (myI - thI) / 120 - (tn - 1) * 0.12));
  }
  // 内応
  return Math.max(0.1, Math.min(0.8, 0.3 + (myI - thI) / 150));
}
function totalArmy(S, cid) { var u = []; provsOf(S, cid).forEach(function (pid) { u = u.concat(S.provs[pid].units); }); return u; }
// 調略に つかう お金で せいこうの 見こみが かわる（きほんは SCHEME_COST）
var SCHEME_MIN = 10, SCHEME_MAX = 120;
function schemeOddsAmt(S, from, to, kind, amount, me, cid) {
  var p = schemeOdds(S, from, to, kind, me, cid); if (p <= 0) return 0;
  return Math.max(0.02, Math.min(0.9, p * Math.pow(amount / SCHEME_COST, 0.6)));
}
function scheme(S, from, to, kind, amount, oid, cs) {
  var A = S.provs[from], cid = cs ? S.castles[cs].owner : A.owner, B = S.provs[to], tc = B.owner;
  amount = Math.round(amount === undefined ? SCHEME_COST : Math.max(SCHEME_MIN, Math.min(SCHEME_MAX, amount)));
  if (S.clans[cid].gold < amount) return { ok: false, msg: 'お金が たりない' };
  var me = oid ? S.officers[oid] : (cs ? null : officerAt(S, from));
  var p = schemeOddsAmt(S, from, to, kind, amount, me, cid);
  if (p <= 0) return { ok: false, msg: kind === 'submit' ? 'あいてが 大きすぎて したがわない' : 'もう 同盟して いる' };
  if (cs && S.castles[cs].sch === S.turn) return { ok: false, msg: 'この 支城は この きせつ もう 調略した' };
  S.clans[cid].gold -= amount; if (cs) S.castles[cs].sch = S.turn; else markCmd(A, 'scheme'); if (oid) useOfficer(S, oid);
  var who = me ? me.name : CLANS[cid].lord;
  var win = cRand(S) < p, prem = !!(oid && cRand(S) < premiumP(offI(me)));
  if (!win) {
    if (prem) { S.clans[cid].gold += Math.round(amount / 2); logC(S, who + 'の 調略は しっぱいしたが、うまく ひきあげて お金を 半分 とりもどした', cid === S.player ? 'sys' : 'sys'); return { ok: true, win: false, p: p, premium: true }; }
    logC(S, who + 'の 調略は しっぱいした（' + CLANS[tc].name + '）', cid === S.player ? 'bad' : 'sys');
    if (kind === 'submit' && cRand(S) < 0.3 && isAlly(S, cid, tc)) breakAlliance(S, cid, tc, '調略が ばれた');
    return { ok: true, win: false, p: p };
  }
  if (prem) {   // 大成功の おまけ
    if (kind === 'naio') { B.units.forEach(function (u) { u.hp = Math.max(1, u.hp - 2); }); logC(S, '★ ' + who + 'の 大成功！ 内応者が ふえ、守りが さらに よわった', 'good'); }
    else { S.clans[cid].gold += Math.round(amount * 0.8); logC(S, '★ ' + who + 'の 大成功！ あいてから 礼金が とどいた（＋' + kan(Math.round(amount * 0.8)) + '）', cid === S.player ? 'good' : 'sys'); }
  }
  if (kind === 'ally') {
    S.allies.push([cid, tc]);
    logC(S, who + 'の はたらきで ' + CLANS[cid].name + 'と ' + CLANS[tc].name + 'が 同盟を むすんだ！', cid === S.player ? 'good' : 'sys');
  } else if (kind === 'submit') {
    // 家ごと したがう：りょうち・へい・家臣が こちらへ
    provsOf(S, tc).forEach(function (pid) { S.provs[pid].owner = cid; S.provs[pid].acted = true; });
    if (S.castles) for (var k in S.castles) if (S.castles[k].owner === tc) S.castles[k].owner = cid;
    officersOf(S, tc).forEach(function (o) { o.clan = cid; o.lord = false; });
    S.allies = (S.allies || []).filter(function (pp) { return pp[0] !== tc && pp[1] !== tc; });
    S.clans[cid].gold += Math.floor(S.clans[tc].gold / 2);
    S.clans[tc].alive = false;
    logC(S, CLANS[tc].lord + 'が ' + CLANS[cid].name + 'に したがった！（' + who + 'の 調略）', cid === S.player ? 'good' : 'sys');
    checkClans(S);
  } else {
    // 内応：まもりの へいが よわる
    B.units.forEach(function (u) { u.hp = Math.max(1, u.hp - 3); });
    B.naio = cid;
    logC(S, who + 'の 調略で ' + PROV_BY[to].name + 'の 城に 内応者が でた！（まもりの へいが よわった）', cid === S.player ? 'good' : 'sys');
  }
  return { ok: true, win: true, p: p };
}

// ---- 保存 ----
var SAVE_KEY = 'futeneko-sengoku-kunitori-v2';  // v3 データも おなじ 場所に
function serialize(S) { return JSON.stringify(S); }
function deserialize(txt) {
  var S = JSON.parse(txt); if (!S || (S.v !== 2 && S.v !== 3)) return null; applyScenario(S.scenario);
  if (S.v === 2) { initOfficers(S); S.v = 3; }   // まえの 保存データにも 家臣を くわえる
  S.firedEv = S.firedEv || {}; S.pendingEvents = S.pendingEvents || []; S.history = S.history || []; S.clanOv = S.clanOv || {};
  if (typeof applyClanOv === 'function') applyClanOv(S);
  PROVS.forEach(function (p) { if (!S.provs[p.id].bld) initDomain(S, p.id); });
  if (!S.castles) initCastles(S);
  if (!S.fieldFix) { PROVS.forEach(function (p) { balanceFields(S, p.id); }); S.fieldFix = 1; }
  if (!S.clans[IKKI]) S.clans[IKKI] = { gold: 0, alive: true };
  if (S.officers) CLAN_ORDER.forEach(function (cid) { if (S.clans[cid] && S.clans[cid].alive) offHomeFix(S, cid); });   // まえの データに いばしょを
  return S;
}

if (typeof module !== 'undefined') {
  module.exports = { ricePlan: ricePlan, applyRicePlan: applyRicePlan, domainLocs: domainLocs, moveTroops: moveTroops, riceDests: riceDests, moveRice: moveRice, relationOf: relationOf, noteWar: noteWar, lastWar: lastWar, branchSchemeTargets: branchSchemeTargets, scheme: scheme, schemeOddsAmt: schemeOddsAmt, isRuined: isRuined, repairCost: repairCost, repairCastle: repairCastle, mergeUnits: mergeUnits, canMergeUnits: canMergeUnits, coSources: coSources, branchTargets: branchTargets, canBranchAttack: canBranchAttack, makeBranchBattle: makeBranchBattle, streakOf: streakOf, streakDefect: streakDefect, moveOfficer: moveOfficer, offHere: offHere, freeHere: freeHere, officersHere: officersHere, offHomeFix: offHomeFix, locsOf: locsOf, locName: locName, locProv: locProv, setOfficer: setOfficer, returnMid: returnMid, defEntryInfo: defEntryInfo, midSources: midSources, dispatchMid: dispatchMid, reinfSources: reinfSources, addReinf: addReinf, backReinf: backReinf, offBusy: offBusy, freeOfficers: freeOfficers, useOfficer: useOfficer, premiumP: premiumP, castleFood: castleFood, castleFoodCap: castleFoodCap, castleFoodDays: castleFoodDays, buyRice: buyRice, harvestRice: harvestRice, menOfUnits: menOfUnits, RICE_PER_MAN: RICE_PER_MAN, castleArtOf: castleArtOf, CASTLE_ART: CASTLE_ART, foodCost: foodCost, needDays: needDays, FOOD_PRICE: FOOD_PRICE, castleLv: castleLv, upgradeCastle: upgradeCastle, canUpgrade: canUpgrade, upgradeCost: upgradeCost, coFronts: coFronts, sendHome: sendHome, provSplit: provSplit, provRegions: provRegions, nenguOf: nenguOf, balanceFields: balanceFields, anchorsOf: anchorsOf, bldCountIn: bldCountIn, redeploy: redeploy, IKKI: IKKI, taxOf: taxOf, setTax: setTax, fumanDelta: fumanDelta, ikkiRise: ikkiRise, seasonFuman: seasonFuman, castleRegions: castleRegions, regionAt: regionAt, branchShare: branchShare, regionOwner: regionOwner, attackTargets: attackTargets, garrison: garrison, castleLinks: castleLinks, branchHexes: branchHexes, recruitPts: recruitPts, planRecruit: planRecruit, build: build, canBuild: canBuild, bldIncome: bldIncome, domData: domData, initDomain: initDomain, battleEnv: battleEnv, routeOf: routeOf, worldMap: worldMap, CLANS: CLANS, CLAN_ORDER: CLAN_ORDER, PROVS: PROVS, ADJ: ADJ, PROV_BY: PROV_BY, newCampaign: newCampaign, seasonStart: seasonStart,
    recruit: recruit, develop: develop, moveUnits: moveUnits, makeBattle: makeBattle, startBattle: startBattle, applyBattle: applyBattle,
    autoResolve: autoResolve, cpuBegin: cpuBegin, cpuNext: cpuNext, seasonEnd: seasonEnd, provsOf: provsOf, strength: strength,
    defStrength: defStrength, income: income, battleSizeIndex: battleSizeIndex, battleSeed: battleSeed, castleIndexOf: castleIndexOf,
    serialize: serialize, deserialize: deserialize, eraName: eraName, totalUnits: totalUnits, totalKoku: totalKoku, PROV_CAP: PROV_CAP,
    setLuck: function (v) { LUCK_SPREAD = v; }, canCommand: canCommand, cpuDecide: cpuDecide, unitCost: unitCost, checkClans: checkClans };
}
