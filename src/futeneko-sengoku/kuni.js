/* ===== フテ猫 戦国合戦 : 国取り 画面 ===== */
'use strict';
var KS = null;            // 国取りの 状態
var kSel = null;          // えらんでいる 国
var kMode = 'idle';       // idle / attack / move
var kMap = { cv: null, ctx: null, W: 0, H: 0, dpr: 1, grid: null, gw: 0, gh: 0, cell: 3, s: 1, x: 0, y: 0, img: null };
var KK = 260, KLAT = 1.22, KLON0 = 130.62, KLAT0 = 35.86; // 地図の 投影
var OKI_SHIFT = [-0.56, -0.47]; // 隠岐を 出雲の 近くに ずらして 枠で かこむ
var kNew = { clan: 'mori', face: 'fute', difficulty: 'normal', scenario: '1523' };
var kCpuRunning = false;

function kProj(lon, lat) { return [(lon - KLON0) * KK, (KLAT0 - lat) * KK * KLAT]; }
function kSave() { if (!KS) return; try { localStorage.setItem(SAVE_KEY, serialize(KS)); } catch (e) {} }
function kLoad() { try { var t = localStorage.getItem(SAVE_KEY); return t ? deserialize(t) : null; } catch (e) { return null; } }
function kHasSave() { var s = kLoad(); return !!(s && !s.over); }
function kClear() { try { localStorage.removeItem(SAVE_KEY); } catch (e) {} }
// 合戦の とちゅうを ほぞん（ページを とじても つづきから できる）
var BSAVE_KEY = SAVE_KEY + '-battle';
function bKey(b) { return [b.from, b.to, b.castleId || '', b.atkClan, b.defClan || '', KS ? KS.year + '-' + KS.season : ''].join('|'); }
function kSaveBattle() {
  if (!G || !G.campaign || !G.kBattle || !KS || KS.pendingBattle !== G.kBattle) return;
  var kb = G.kBattle;
  try { G.kBattle = null; var t = JSON.stringify({ key: bKey(kb), log: LOG.slice(-60), g: G }); G.kBattle = kb; localStorage.setItem(BSAVE_KEY, t); } catch (e) { G.kBattle = kb; }
}
function kLoadBattle(b) { try { var o = JSON.parse(localStorage.getItem(BSAVE_KEY) || 'null'); if (o && o.g && o.key === bKey(b)) return o; } catch (e) {} return null; }
function kClearBattle() { try { localStorage.removeItem(BSAVE_KEY); } catch (e) {} }
// プレイヤーが その 家の きまった 顔を えらんでいるか
function isArtSrc(src) { if (!src || typeof LORD_ART === 'undefined') return false; for (var n in LORD_ART) if (LORD_ART[n] === src) return true; return false; }
function usesDefaultFace(cid, face) { var d = CLAN_BASE[cid] && CLAN_BASE[cid].face; return face === (d || 'fute'); }
// 当主の 肖像（img の src）：武将絵 → キャラ → なし
function portraitSrc(cid) {
  var C = CLANS[cid]; if (!C) return null;
  if (KS && cid === KS.player && !usesDefaultFace(cid, KS.face)) return SPR[charById(KS.face).spr];
  var a = lordArt(C.lord); if (a) return a;
  if (KS && cid === KS.player) return SPR[charById(KS.face).spr];
  return C.face ? SPR[charById(C.face).spr] : null;
}
// 合戦の 大将の 絵
function portraitChar(cid) {
  var C = CLANS[cid];
  if (cid === KS.player && !usesDefaultFace(cid, KS.face)) return KS.face;
  if (lordArt(C.lord)) return 'art:' + C.lord;
  if (cid === KS.player) return KS.face;
  return C.face && C.face !== KS.face ? C.face : 'clan:' + cid;
}
function faceOf(cid) {
  if (cid === KS.player) return KS.face;
  var f = CLANS[cid].face;
  if (!f || f === KS.face) return 'clan:' + cid;
  return f;
}
function clanSpr(cid) { return portraitSrc(cid); }
// 城の もちぬしを 大きく（家の 色の おび・家紋・関係）
function ownerBand(cid) {
  if (!cid || !CLANS[cid]) return '<div class="kowner" style="background:#888">🏳 もちぬし なし（あき城）</div>';
  var me = cid === KS.player, rl = relationOf(KS, KS.player, cid), R0 = REL_INFO[rl];
  return '<div class="kowner" style="background:' + CLANS[cid].color + '">' + crestHtml(cid, 30) + '<span><b>' + CLANS[cid].name + 'の 城</b><small>' + CLANS[cid].lord + '</small></span>' +
    (me ? '<em class="krel" style="background:#fff;color:#2a6a2a">⭐ じぶん</em>' : '<em class="krel" style="background:' + R0.col + ';border:1.5px solid #fff">' + R0.icon + ' ' + R0.name + '</em>') + '</div>';
}
function crestHtml(cid, size) {
  var C = CLANS[cid], sp = KS ? clanSpr(cid) : (lordArt(C.lord) || (C.face ? SPR[charById(C.face).spr] : null));
  size = size || 40;
  if (sp) return '<span class="kcrest" style="width:' + size + 'px;height:' + size + 'px;border-color:' + C.color + '"><img' + (isArtSrc(sp) ? ' class="art"' : '') + ' src="' + sp + '" alt=""></span>';
  return '<span class="kcrest" style="width:' + size + 'px;height:' + size + 'px;background:' + C.color + ';border-color:' + C.color + ';font-size:' + Math.round(size * 0.55) + 'px">' + C.crest + '</span>';
}

// ---- はじめる（モード選び） ----
function openModeBox() {
  $('contBtn').style.display = kHasSave() ? '' : 'none';
  $('modeBox').classList.add('on');
}

// ---- 大名えらび ----
function openClanScreen() {
  $('modeBox').classList.remove('on');
  show('clanScreen'); renderClanScreen();
}
function renderClanScreen() {
  var sc = applyScenario(kNew.scenario);
  if (!CLANS[kNew.clan]) kNew.clan = 'mori';
  var sb = $('scenList'); sb.innerHTML = '';
  SCENARIOS.forEach(function (s) {
    var b = document.createElement('button'); b.className = 'opt kscen' + (s.id === kNew.scenario ? ' sel' : '');
    b.innerHTML = '<b>' + s.title + '</b><small>' + s.sub + '</small>';
    b.onclick = function () { SFX.tap(); kNew.scenario = s.id; renderClanScreen(); };
    sb.appendChild(b);
  });
  $('scenDesc').textContent = sc.desc;
  var box = $('clanList'); box.innerHTML = '';
  CLAN_ORDER.forEach(function (cid) {
    var C = CLANS[cid], st = sc.start[cid], np = Object.keys(st.provs).length, nu = 0;
    for (var p in st.provs) for (var t in st.provs[p]) nu += st.provs[p][t];
    var b = document.createElement('button'); b.className = 'kclan' + (kNew.clan === cid ? ' sel' : '');
    var face = (cid === kNew.clan && !usesDefaultFace(cid, kNew.face)) ? SPR[charById(kNew.face).spr] : (lordArt(C.lord) || (C.face ? SPR[charById(C.face).spr] : null));
    var al = (sc.allies || []).filter(function (a) { return a[0] === cid || a[1] === cid; }).map(function (a) { return CLANS[a[0] === cid ? a[1] : a[0]].name; });
    b.innerHTML = (face ? '<span class="kcrest" style="border-color:' + C.color + '"><img' + (isArtSrc(face) ? ' class="art"' : '') + ' src="' + face + '" alt=""></span>' : '<span class="kcrest" style="background:' + C.color + ';border-color:' + C.color + '">' + C.crest + '</span>') +
      '<span class="kci"><b>' + C.lord + '</b><small>' + C.name + '・' + np + 'りょうち・へい ' + nu + '・家臣 ' + OFFICERS.filter(function (d) { return (d.cs && d.cs[sc.id] || d.c) === cid && sc.year >= d.y0 && sc.year <= d.y1 && !(d.sameAs && C.lord === d.sameAs) && !(d.notLord && C.lord === d.name); }).length + (al.length ? '・🤝' + al.join('・') : '') + '</small><em>' + C.desc + '</em></span>' +
      (cid === 'mori' ? '<span class="krec">おすすめ</span>' : '');
    b.onclick = function () { SFX.tap(); kNew.clan = cid; renderClanScreen(); };
    box.appendChild(b);
  });
  var fb = $('faceList'); fb.innerHTML = '';
  CHARS.forEach(function (ch) {
    var b = document.createElement('button'); b.className = 'charbtn small' + (kNew.face === ch.id ? ' sel' : '');
    b.innerHTML = '<img src="' + SPR[ch.spr] + '" alt=""><span>' + ch.name + '</span>';
    b.onclick = function () { SFX.tap(); kNew.face = ch.id; renderClanScreen(); };
    fb.appendChild(b);
  });
  ['easy', 'normal', 'hard'].forEach(function (d) { $('kdif_' + d).classList.toggle('sel', kNew.difficulty === d); });
}
function startCampaign() {
  kUndoClear(); KS = newCampaign({ clan: kNew.clan, face: kNew.face, difficulty: kNew.difficulty, scenario: kNew.scenario });
  kSel = provsOf(KS, KS.player)[0]; kMode = 'idle';
  kSave(); openMap();
  kIntro();
}
function kIntro() {
  var C = CLANS[KS.player], sc = SCEN_BY[KS.scenario], al = alliesOf(KS, KS.player).map(function (a) { return CLANS[a].name; });
  kModal(eraName(KS.year) + '年（' + KS.year + '）' + SEASONS[KS.season],
    '<p class="small">' + sc.desc + '</p>' +
    '<div class="kintro">' + crestHtml(KS.player, 72) + '<p><b>' + C.lord + '</b>（' + C.name + '）<br>' + C.desc + (al.length ? '<br>🤝 同盟：' + al.join('・') : '') + '</p></div>' +
    '<ul class="khelp"><li>きせつ ごとに、じぶんの 国 1つで <b>3つまで</b> めいれい できる（出陣・徴兵・内政・移動・調略から、おなじ ものは 1回ずつ）。</li>' +
    '<li><b>出陣</b>：となりを せめる。<b>徴兵</b>：へいを やとう。<b>内政</b>：石高を ふやす。<b>移動</b>：へいを となりへ。<b>調略</b>：家ごと したがわせる・内応・同盟。</li>' +
    '<li><b>家臣</b>を 城主に すると つよくなる（武＝合戦、政＝お金・内政、智＝守り・調略）。👥ボタンで 家臣を 見よう。</li>' +
    '<li>お金（貫）は <b>秋の 年貢</b>で まとめて はいる。ほかの きせつは 商いの 収入だけ。中国地方の ' + PROVS.length + 'の りょうちを ぜんぶ とれば 統一！</li>' + (teppoOk(KS) ? '' : '<li>鉄砲は ' + TEPPO_YEAR + '年に 伝わるまで やとえない。</li>') + '</ul>',
    [{ label: 'はじめる', cls: 'act', fn: function () { kCloseModal(); kShowEvents(); } }]);
}
function continueCampaign() {
  $('modeBox').classList.remove('on');
  KS = kLoad(); if (!KS) return; kUndoClear();
  kMap.grid = null;
  kSel = provsOf(KS, KS.player)[0] || null; kMode = 'idle';
  openMap();
  if (KS.pendingBattle) kResumeBattle(KS.pendingBattle);
  else if (KS.phase === 'cpu') kRunCpu();
  else kShowEvents();
}

// ---- 地図 ----
function openMap() {
  show('mapScreen');
  kMap.cv = $('kcv'); kMap.ctx = kMap.cv.getContext('2d');
  if (!kMap.grid) kBuildGrid();
  kUpdate(); kResize(); kFit(kWhole); kRender();
}
function kDecode(str, shift) {
  var v = str.split(','), pts = [], x = 0, y = 0;
  for (var i = 0; i < v.length; i += 2) { x += +v[i]; y += +v[i + 1]; var lon = x / 1000, lat = y / 1000; if (shift) { lon += shift[0]; lat += shift[1]; } pts.push(kProj(lon, lat)); }
  return pts;
}
function kPathOf(rings) { var p = new Path2D(); rings.forEach(function (r) { r.forEach(function (q, i) { if (i) p.lineTo(q[0], q[1]); else p.moveTo(q[0], q[1]); }); p.closePath(); }); return p; }
function kBuildGrid() {
  var minX = 1e9, maxX = -1e9, minY = 1e9, maxY = -1e9;
  function bound(r) { r.forEach(function (q) { minX = Math.min(minX, q[0]); maxX = Math.max(maxX, q[0]); minY = Math.min(minY, q[1]); maxY = Math.max(maxY, q[1]); }); }
  kMap.paths = {}; kMap.oki = null;
  PROVS.forEach(function (p) {
    var rings = [], okiR = [];
    CHUGOKU_GEO.provs[p.id].forEach(function (s) {
      var first = s.split(',', 2), lat0 = +first[1] / 1000;
      if (p.id === 'izumo' && lat0 > 35.9) { var r = kDecode(s, OKI_SHIFT); okiR.push(r); bound(r); }
      else { var r2 = kDecode(s); rings.push(r2); bound(r2); }
    });
    kMap.paths[p.id] = kPathOf(rings.concat(okiR));
    if (okiR.length) kMap.oki = okiR;
  });
  // 隠岐の 枠
  if (kMap.oki) {
    var a = 1e9, b = -1e9, c = 1e9, d = -1e9;
    kMap.oki.forEach(function (r) { r.forEach(function (q) { a = Math.min(a, q[0]); b = Math.max(b, q[0]); c = Math.min(c, q[1]); d = Math.max(d, q[1]); }); });
    kMap.okiBox = [a - 14, c - 22, b - a + 28, d - c + 32];
  }
  var vx0 = minX - 30, vx1 = maxX + 30, vy0 = minY - 30, vy1 = maxY + 40;
  kMap.near = CHUGOKU_GEO.near.map(function (n) { return kPathOf(n.rings.map(function (s) { return kDecode(s); })); });
  kMap.view = [vx0, vy0, vx1 - vx0, vy1 - vy0];
  kMap.bw = vx1 - vx0; kMap.bh = vy1 - vy0;
  kMap.hit = document.createElement('canvas').getContext('2d');
  kMap.labels = {}; PROVS.forEach(function (p) { var l = CHUGOKU_GEO.labels[p.id]; kMap.labels[p.id] = kProj(l[0], l[1]); });
  // しまもよう（行き先 表示用）
  var pc = document.createElement('canvas'); pc.width = pc.height = 12; var px = pc.getContext('2d');
  px.strokeStyle = 'rgba(255,255,255,0.55)'; px.lineWidth = 3; px.beginPath(); px.moveTo(-2, 14); px.lineTo(14, -2); px.stroke(); px.beginPath(); px.moveTo(-8, 8); px.lineTo(8, -8); px.stroke(); px.beginPath(); px.moveTo(4, 20); px.lineTo(20, 4); px.stroke();
  kMap.stripe = pc;
  kBuildTerrain();
  kMap.grid = true;
}
// 世界ヘックス地図の 地形（山・森・川）と 道を 国取り地図に かさねる
function kBuildTerrain() {
  var w = worldMap(); if (!w) return;
  var cv = document.createElement('canvas'); cv.width = w.w * 2 + 1; cv.height = w.h;
  var x = cv.getContext('2d'), img = x.createImageData(cv.width, cv.height), d = img.data;
  var COL = { M: [62, 46, 36, 190], m: [118, 96, 72, 105], f: [28, 92, 40, 52], h: [150, 140, 60, 40], r: [50, 120, 220, 210], s: [90, 150, 210, 255] };
  for (var r = 0; r < w.h; r++) for (var c = 0; c < w.w; c++) {
    var col = COL[w.T[r * w.w + c]]; if (!col) continue;
    for (var k = 0; k < 2; k++) { var i = (r * cv.width + 2 * c + (r & 1) + k) * 4; d[i] = col[0]; d[i + 1] = col[1]; d[i + 2] = col[2]; d[i + 3] = col[3]; }
  }
  x.putImageData(img, 0, 0);
  kMap.terr = cv;
  var sx = KK / w.KX / 2, sy = 0.8660254 * KK * KLAT / w.KY;
  kMap.terrRect = [(WORLD.lon0 - KLON0) * KK - 0.5 * sx * 2 * 0.5, (KLAT0 - WORLD.lat0) * KK * KLAT - 0.5 * sy, cv.width * sx, cv.height * sy];
  var land = new Path2D(); PROVS.forEach(function (p) { land.addPath(kMap.paths[p.id]); }); kMap.land = land;
  // ヘックスの 中心（国取り地図の 座標）と 大きさ
  var N = w.w * w.h, HX = new Float32Array(N), HY = new Float32Array(N);
  for (var r1 = 0; r1 < w.h; r1++) for (var c1 = 0; c1 < w.w; c1++) { var l1 = w.ll(c1, r1), q0 = kProj(l1[0], l1[1]); HX[r1 * w.w + c1] = q0[0]; HY[r1 * w.w + c1] = q0[1]; }
  kMap.HX = HX; kMap.HY = HY;
  var mr = Math.floor(w.h / 2), mc = Math.floor(w.w / 2);
  kMap.hexW = HX[mr * w.w + mc + 1] - HX[mr * w.w + mc];           // となりとの きょり（よこ）
  kMap.hexRow = HY[(mr + 1) * w.w + mc] - HY[mr * w.w + mc];        // 行の たかさ
  // 国ごとの ヘックスの かたち（えらんだ 国・ねらう 国の ぬりに つかう）
  kMap.hexPaths = {};
  var hw = kMap.hexW / 2, hr = kMap.hexRow / 1.5;
  for (r1 = 0; r1 < w.h; r1++) for (c1 = 0; c1 < w.w; c1++) {
    var pv1 = w.provAt(c1, r1); if (!pv1) continue;
    var P1 = kMap.hexPaths[pv1] || (kMap.hexPaths[pv1] = new Path2D()), x1 = HX[r1 * w.w + c1], y1 = HY[r1 * w.w + c1];
    P1.moveTo(x1, y1 - hr); P1.lineTo(x1 + hw, y1 - hr / 2); P1.lineTo(x1 + hw, y1 + hr / 2); P1.lineTo(x1, y1 + hr); P1.lineTo(x1 - hw, y1 + hr / 2); P1.lineTo(x1 - hw, y1 - hr / 2); P1.closePath();
  }
  // 国ざかいの 線（ヘックスの へり）：となりあう 2国ごと
  kMap.borders = {};
  for (var rr = 0; rr < w.h; rr++) for (var cc = 0; cc < w.w; cc++) {
    var a = w.provAt(cc, rr); if (!a) continue;
    var nb = hexNbs(cc, rr);
    for (var j = 0; j < 3; j++) {   // 右・右下・左下 だけ みれば 重複しない
      var n = [nb[0], nb[4], nb[5]][j], bq = w.provAt(n[0], n[1]); if (!bq || bq === a) continue;
      var key2 = [a, bq].sort().join('|'), p1 = w.ll(cc, rr), p2 = w.ll(n[0], n[1]);
      var q1 = kProj(p1[0], p1[1]), q2 = kProj(p2[0], p2[1]);
      (kMap.borders[key2] || (kMap.borders[key2] = [])).push([(q1[0] + q2[0]) / 2, (q1[1] + q2[1]) / 2, q2[0] - q1[0], q2[1] - q1[1]]);
    }
  }
  // 道すじ（国取り地図の 座標）
  kMap.routes = WORLD.routes.map(function (rt) {
    var pts = [];
    if (rt.path) rt.path.forEach(function (h, i) { if (i % 2 && i !== rt.path.length - 1) return; var q = w.ll(h[0], h[1]); pts.push(kProj(q[0], q[1])); });
    var mid = null;
    if (rt.path) {
      // 峠は いちばん けわしい ところ、それ以外は まんなか
      var mh = rt.path[Math.floor(rt.path.length / 2)];
      if (rt.type === 'pass') { var ms = rt.path.filter(function (h) { return w.at(h[0], h[1]) === 'm' || w.at(h[0], h[1]) === '='; }); var mm = rt.path.filter(function (h) { var t = w.at(h[0], h[1]); return t === 'm'; }); if (mm.length) mh = mm[Math.floor(mm.length / 2)]; }
      var qm = w.ll(mh[0], mh[1]); mid = kProj(qm[0], qm[1]);
    }
    if (!rt.path) { var la = CHUGOKU_GEO.labels[rt.a], lb = CHUGOKU_GEO.labels[rt.b], q1 = kProj(la[0], la[1]), q2 = kProj(lb[0], lb[1]); mid = [(q1[0] + q2[0]) / 2, (q1[1] + q2[1]) / 2]; }
    return { a: rt.a, b: rt.b, type: rt.type, name: rt.name, pts: pts, mid: mid };
  });
}
// ---- ヘックスで かいた 中国地方（地形 ＋ 持ち主の いろ）----
var KHEX_GLYPH = { f: 'forest', h: 'hill', m: 'mount', M: 'snow' };
function kHash(c, r) { var h = (c * 374761393 + r * 668265263) >>> 0; h = (h ^ (h >>> 13)) * 1274126177 >>> 0; return (h & 1023) / 1023; }
function kShade(hex, k) { var n = parseInt(hex.slice(1), 16), R = n >> 16, G = (n >> 8) & 255, B = n & 255; return 'rgb(' + Math.round(R * k) + ',' + Math.round(G * k) + ',' + Math.round(B * k) + ')'; }
function kHexOwner(c, r, pv) {
  var rg = regionAt(c, r); if (rg && rg.indexOf('_') > 0 && KS.castles[rg] && KS.castles[rg].owner) return KS.castles[rg].owner;
  return KS.provs[pv].owner;
}
function kHexLayer() {
  var w = worldMap(); if (!w || !kMap.HX) return null;
  var key = PROVS.map(function (p) { return KS.provs[p.id].owner; }).join(',') + '|' + (KS.castles ? Object.keys(KS.castles).map(function (k) { return KS.castles[k].owner; }).join(',') : '');
  var gOK = gfxOn && gfxOn() ? 1 : 0; key += gOK;
  if (kMap.hexKey === key && kMap.hexCv) return kMap.hexCv;
  var T0 = performance.now(), t = kMap.terrRect, P = Math.min(3900 / t[2], 2900 / t[3], 11 / kMap.hexW);   // 1ヘックス 11px くらい（スマホの 上限に おさまる）
  var cv = kMap.hexCv || document.createElement('canvas'); cv.width = Math.ceil(t[2] * P); cv.height = Math.ceil(t[3] * P);
  var x = cv.getContext('2d'); x.clearRect(0, 0, cv.width, cv.height);
  var hw = kMap.hexW / 2 * P, hr = kMap.hexRow / 1.5 * P;
  function hexP(cx, cy, k) { x.beginPath(); x.moveTo(cx, cy - hr * k); x.lineTo(cx + hw * k, cy - hr * k / 2); x.lineTo(cx + hw * k, cy + hr * k / 2); x.lineTo(cx, cy + hr * k); x.lineTo(cx - hw * k, cy + hr * k / 2); x.lineTo(cx - hw * k, cy - hr * k / 2); x.closePath(); }
  // ちいさな 地形の 絵（さきに 縮小して おく）
  var gl = {}, gw = Math.max(6, Math.round(hw * 2.1));
  if (gOK) for (var gk in KHEX_GLYPH) { var im = gx(KHEX_GLYPH[gk]); if (!im) continue; var gc = document.createElement('canvas'), gh = Math.round(gw * im.naturalHeight / im.naturalWidth); gc.width = gw; gc.height = gh; gc.getContext('2d').drawImage(im, 0, 0, gw, gh); gl[gk] = gc; }
  var rgbC = {};
  for (var r = 0; r < w.h; r++) for (var c = 0; c < w.w; c++) {
    var i = r * w.w + c, tt = w.T[i]; if (tt === 's') continue;
    var cx = (kMap.HX[i] - t[0]) * P, cy = (kMap.HY[i] - t[1]) * P, pv = w.provAt(c, r), nz = 0.92 + kHash(c, r) * 0.16;
    hexP(cx, cy, 1.04);
    if (tt === 'X') { x.fillStyle = '#d9cfb4'; x.fill(); continue; }   // 中国地方の そと
    x.fillStyle = kShade(TER_COL[tt] || '#ccc', nz); x.fill();
    if (pv && tt !== 'X') {
      var ow = kHexOwner(c, r, pv);
      if (ow && CLANS[ow]) { x.globalAlpha = tt === 'r' ? 0.18 : tt === 'M' ? 0.3 : 0.46; x.fillStyle = CLANS[ow].color; x.fill(); x.globalAlpha = 1; }
    }
    var g = gl[tt]; if (g) x.drawImage(g, cx - g.width / 2, cy + hr * 0.75 - g.height);
  }
  // ヘックスの へり（うすく）
  x.strokeStyle = 'rgba(40,30,20,0.14)'; x.lineWidth = 0.7; x.beginPath();
  for (r = 0; r < w.h; r++) for (c = 0; c < w.w; c++) {
    var j = r * w.w + c; if (w.T[j] === 's' || w.T[j] === 'X') continue;
    var ex = (kMap.HX[j] - t[0]) * P, ey = (kMap.HY[j] - t[1]) * P;   // 上・右上・右下 の 3辺だけ（となりと 重ならない）
    x.moveTo(ex - hw, ey - hr / 2); x.lineTo(ex, ey - hr); x.lineTo(ex + hw, ey - hr / 2); x.lineTo(ex + hw, ey + hr / 2);
  }
  x.stroke();
  kMap.hexCv = cv; kMap.hexKey = key; kMap.hexP = P; kMap.hexMs = Math.round(performance.now() - T0);
  return cv;
}
// ちかよったら：見えている ヘックスを くわしく（大きな 絵で）
function kHexDetail(c) {
  var w = worldMap(), s = kMap.s; if (!w || !kMap.HX || kMap.hexW * s < 20) return;
  var t = kMap.terrRect, x0 = -kMap.x / s, y0 = -kMap.y / s, x1 = (kMap.W - kMap.x) / s, y1 = (kMap.H - kMap.y) / s;
  var sx = t[2] / (w.w * 2 + 1), sy = t[3] / w.h;
  var r0 = Math.max(0, Math.floor((y0 - t[1]) / sy) - 2), r1 = Math.min(w.h - 1, Math.ceil((y1 - t[1]) / sy) + 2);
  var c0 = Math.max(0, Math.floor((x0 - t[0]) / sx / 2) - 3), c1 = Math.min(w.w - 1, Math.ceil((x1 - t[0]) / sx / 2) + 3);
  if ((r1 - r0) * (c1 - c0) > 9000) return;
  var hw = kMap.hexW / 2, hr = kMap.hexRow / 1.5, gw = hw * 2.15;
  for (var r = r0; r <= r1; r++) for (var cc = c0; cc <= c1; cc++) {
    var i = r * w.w + cc, tt = w.T[i], g = KHEX_GLYPH[tt]; if (!g) continue;
    var im = gx(g); if (!im) continue;
    var cx = kMap.HX[i], cy = kMap.HY[i], gh = gw * im.naturalHeight / im.naturalWidth;
    c.drawImage(im, cx - gw / 2, cy + hr * 0.75 - gh, gw, gh);
  }
}
// 支城の 所領：持ち主が 本城と ちがえば その家の いろで ぬる。どの 所領も さかいを うすく
function kRegionLayer() {
  var w = worldMap(), R0 = castleRegions(); if (!w || !R0 || !KS.castles) return null;
  var key = Object.keys(KS.castles).map(function (k) { return KS.castles[k].owner + '/' + KS.provs[KS.castles[k].prov].owner; }).join(',');
  if (kMap.regKey === key && kMap.reg) return kMap.reg;
  var cv = document.createElement('canvas'); cv.width = w.w * 2 + 1; cv.height = w.h;
  var x = cv.getContext('2d'), img = x.createImageData(cv.width, cv.height), d = img.data, rgb = {};
  function col(cid) { if (!rgb[cid]) { var h = CLANS[cid].color.replace('#', ''); if (h.length === 3) h = h.replace(/(.)/g, '$1$1'); rgb[cid] = [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]; } return rgb[cid]; }
  for (var r = 0; r < w.h; r++) for (var c = 0; c < w.w; c++) {
    var o = R0.own[r * w.w + c]; if (o < 0) continue; var id = R0.ids[o];
    var isBr = id.indexOf('_') > 0, C0 = isBr ? KS.castles[id] : null, foreign = C0 && C0.owner && C0.owner !== KS.provs[C0.prov].owner;
    var edge = false; hexNbs(c, r).forEach(function (n) { if (n[0] < 0 || n[1] < 0 || n[0] >= w.w || n[1] >= w.h) return; var o2 = R0.own[n[1] * w.w + n[0]]; if (o2 >= 0 && o2 !== o && R0.ids[o2].split('_')[0] === id.split('_')[0]) edge = true; });
    var px = null;
    if (foreign) { var q = col(C0.owner); px = edge ? [q[0] * 0.5, q[1] * 0.5, q[2] * 0.5, 255] : [q[0], q[1], q[2], 235]; }
    else if (edge) px = [255, 250, 230, 120];
    if (!px) continue;
    for (var k = 0; k < 2; k++) { var i = (r * cv.width + 2 * c + (r & 1) + k) * 4; d[i] = px[0]; d[i + 1] = px[1]; d[i + 2] = px[2]; d[i + 3] = px[3]; }
  }
  x.putImageData(img, 0, 0);
  kMap.reg = cv; kMap.regKey = key; return cv;
}
// 国ざかい：ヘックスの へり。pid を わたすと その 国の まわり（海岸も）だけ
function kDrawMyLand(c, lw) {
  var w = worldMap(); if (!w || !kMap.HX || !KS || typeof regionOwner !== 'function') return;
  var sig = KS.player + '|' + PROVS.map(function (p) { return KS.provs[p.id].owner; }).join(',') + '|' + Object.keys(KS.castles || {}).map(function (k) { return KS.castles[k].owner; }).join(',');
  if (kMap.myLandSig !== sig) {
    var hw = kMap.hexW / 2, hr = kMap.hexRow / 1.5, CX = [0, hw, hw, 0, -hw, -hw], CY = [-hr, -hr / 2, hr / 2, hr, hr / 2, -hr / 2], EDGE = { 0: [1, 2], 1: [4, 5], 2: [5, 0], 3: [0, 1], 4: [3, 4], 5: [2, 3] };
    var me = KS.player, own = new Uint8Array(w.w * w.h);
    for (var r = 0; r < w.h; r++) for (var cc = 0; cc < w.w; cc++) if (w.provAt(cc, r) && regionOwner(KS, cc, r) === me) own[r * w.w + cc] = 1;
    var pp = new Path2D();
    for (r = 0; r < w.h; r++) for (cc = 0; cc < w.w; cc++) {
      var i = r * w.w + cc; if (!own[i]) continue; var nb = hexNbs(cc, r);
      for (var j = 0; j < 6; j++) { var n = nb[j]; if (n[0] >= 0 && n[1] >= 0 && n[0] < w.w && n[1] < w.h && own[n[1] * w.w + n[0]]) continue; var e = EDGE[j]; pp.moveTo(kMap.HX[i] + CX[e[0]], kMap.HY[i] + CY[e[0]]); pp.lineTo(kMap.HX[i] + CX[e[1]], kMap.HY[i] + CY[e[1]]); }
    }
    kMap.myLand = pp; kMap.myLandSig = sig;
  }
  c.lineCap = 'round'; c.strokeStyle = 'rgba(0,0,0,0.45)'; c.lineWidth = 5.2 * lw; c.stroke(kMap.myLand);
  c.strokeStyle = '#ffe24a'; c.lineWidth = 3.2 * lw; c.stroke(kMap.myLand);
}
function kDrawHexBorders(c, lw, pid, col, wd, plain) {
  var w = worldMap(); if (!w || !kMap.HX) return;
  var hw = kMap.hexW / 2, hr = kMap.hexRow / 1.5;
  // かど： 0=上 1=右上 2=右下 3=下 4=左下 5=左上 ／ となり（hexNbs の じゅん）： 0=右 1=左 2=左上 3=右上 4=左下 5=右下
  var CX = [0, hw, hw, 0, -hw, -hw], CY = [-hr, -hr / 2, hr / 2, hr, hr / 2, -hr / 2], EDGE = { 0: [1, 2], 1: [4, 5], 2: [5, 0], 3: [0, 1], 4: [3, 4], 5: [2, 3] };
  if (!pid) {
    if (!kMap.bordPath) {
      var bp = new Path2D(), cp = new Path2D();
      for (var r = 0; r < w.h; r++) for (var cc = 0; cc < w.w; cc++) {
        var a = w.provAt(cc, r); if (!a) continue; var nb = hexNbs(cc, r), i = r * w.w + cc;
        for (var j = 0; j < 6; j++) {
          var n = nb[j], b = n[0] >= 0 && n[1] >= 0 && n[0] < w.w && n[1] < w.h ? w.provAt(n[0], n[1]) : null;
          if (b === a) continue; if (b && (j === 1 || j === 2 || j === 3)) continue;   // 国どうしは かたがわだけ
          var e = EDGE[j], P0 = b ? bp : cp; P0.moveTo(kMap.HX[i] + CX[e[0]], kMap.HY[i] + CY[e[0]]); P0.lineTo(kMap.HX[i] + CX[e[1]], kMap.HY[i] + CY[e[1]]);
        }
      }
      kMap.bordPath = bp; kMap.coastPath = cp;
    }
    c.lineCap = 'round';
    c.strokeStyle = 'rgba(255,250,235,0.85)'; c.lineWidth = 2.4 * lw; c.stroke(kMap.coastPath);
    c.strokeStyle = 'rgba(40,25,15,0.8)'; c.lineWidth = 1.8 * lw; c.stroke(kMap.bordPath);
    return;
  }
  kMap.provEdge = kMap.provEdge || {};
  var dm = plain ? null : kDomainSet(pid), key = pid + (dm ? '#' + dm.sig : '');
  if (!kMap.provEdge[key]) {
    var pp = new Path2D(), inS = dm ? function (cc, rr) { return dm.has(cc, rr); } : function (cc, rr) { return w.provAt(cc, rr) === pid; };
    for (var r2 = 0; r2 < w.h; r2++) for (var c2 = 0; c2 < w.w; c2++) {
      if (!inS(c2, r2)) continue; var nb2 = hexNbs(c2, r2), i2 = r2 * w.w + c2;
      for (var j2 = 0; j2 < 6; j2++) { var n2 = nb2[j2]; if (n2[0] >= 0 && n2[1] >= 0 && n2[0] < w.w && n2[1] < w.h && inS(n2[0], n2[1])) continue; var e2 = EDGE[j2]; pp.moveTo(kMap.HX[i2] + CX[e2[0]], kMap.HY[i2] + CY[e2[0]]); pp.lineTo(kMap.HX[i2] + CX[e2[1]], kMap.HY[i2] + CY[e2[1]]); }
    }
    kMap.provEdge[key] = pp;
  }
  c.lineCap = 'round'; c.strokeStyle = 'rgba(0,0,0,0.45)'; c.lineWidth = (wd + 2) * lw; c.stroke(kMap.provEdge[key]);
  c.strokeStyle = col; c.lineWidth = wd * lw; c.stroke(kMap.provEdge[key]);
}
// えらんだ 国の 領地：国の なかで その家が もつ ところ ＋ となりの 国で その家が もつ 支城の 所領
function kDomainSet(pid) {
  if (!KS || !KS.castles || !KS.provs[pid] || !KS.provs[pid].owner || typeof regionAt !== 'function') return null;
  var own = KS.provs[pid].owner, w = worldMap(), nb = {}, sig = [];
  (ADJ[pid] || []).concat((CHUGOKU_GEO.adj && CHUGOKU_GEO.adj[pid]) || []).forEach(function (q) { nb[q] = 1; });
  var extra = {}, drop = {};
  Object.keys(KS.castles).forEach(function (id) {
    var C0 = KS.castles[id];
    if (C0.prov === pid && C0.owner !== own) { drop[id] = 1; sig.push('-' + id); }
    else if (C0.prov !== pid && nb[C0.prov] && C0.owner === own && KS.provs[C0.prov].owner !== own) { extra[id] = 1; sig.push('+' + id); }
  });
  if (!sig.length) return null;   // ふつうの 国ざかいと おなじ
  return { sig: sig.join(','), has: function (c, r) {
    var p = w.provAt(c, r); if (!p) return false; var g = regionAt(c, r);
    if (p === pid) return !drop[g]; return !!extra[g] && p === KS.castles[g].prov;
  } };
}
function kDrawRegions(c) {
  var cv = kRegionLayer(); if (!cv || !kMap.terrRect) return;
  c.save(); c.clip(kMap.land); c.imageSmoothingEnabled = false; var t = kMap.terrRect; c.drawImage(cv, t[0], t[1], t[2], t[3]); c.restore();
}
function kDrawTerrain(c, lw) {
  if (!kMap.terr) return;
  c.save(); c.clip(kMap.land); c.imageSmoothingEnabled = true;
  var t = kMap.terrRect; c.drawImage(kMap.terr, t[0], t[1], t[2], t[3]); c.restore();
}
// えらんだ 国の となりへの 道を はっきり
function kNeighborInfo(pid) {
  var set = {}; (CHUGOKU_GEO.adj[pid] || []).forEach(function (q) { set[q] = 1; }); (ADJ[pid] || []).forEach(function (q) { set[q] = 1; });
  return Object.keys(set).map(function (q) { var rt = routeOf(pid, q); return { q: q, type: rt ? rt.type : 'none', name: rt ? rt.name : null }; });
}
// 地図の しるしの 大きさ：ズームしても 画面で 大きく なりすぎない
function kU(base) { return Math.min(1.6, base * Math.max(1, Math.pow(kMap.s, 0.3)) / kMap.s); }
var RT_COL = { land: '#ffcf5a', pass: '#ff8a3a', sea: '#7fd0ff', none: '#ff3030' };
function kDrawFocus(c, lw) {
  if (!kSel || !kMap.routes) return;
  var u = kU(1);
  kNeighborInfo(kSel).forEach(function (nb) {
    var key2 = [kSel, nb.q].sort().join('|');
    if (nb.type === 'none') {
      // とおれない 国ざかい：あかい ×の 線
      var segs = kMap.borders[key2] || []; if (!segs.length) return;
      c.strokeStyle = 'rgba(255,40,40,0.95)'; c.lineWidth = 4 * lw;
      segs.forEach(function (sg) { var L = Math.hypot(sg[2], sg[3]) || 1, hx = -sg[3] / L * 3 * lw * 2.2, hy = sg[2] / L * 3 * lw * 2.2; c.beginPath(); c.moveTo(sg[0] - hx, sg[1] - hy); c.lineTo(sg[0] + hx, sg[1] + hy); c.stroke(); });
      var m = segs[Math.floor(segs.length / 2)];
      kTag(c, m[0], m[1], '🚫 山で とおれない', '#c62828', u);
      return;
    }
    var rt = kMap.routes.filter(function (r0) { return (r0.a === kSel && r0.b === nb.q) || (r0.b === kSel && r0.a === nb.q); })[0]; if (!rt || !rt.pts.length) return;
    c.beginPath(); rt.pts.forEach(function (q, i) { if (i) c.lineTo(q[0], q[1]); else c.moveTo(q[0], q[1]); });
    c.lineJoin = 'round'; c.lineCap = 'round';
    c.strokeStyle = 'rgba(40,20,10,0.85)'; c.lineWidth = 7 * lw; c.setLineDash(nb.type === 'sea' ? [8 * lw, 6 * lw] : []); c.stroke();
    c.strokeStyle = RT_COL[nb.type]; c.lineWidth = 4 * lw; c.stroke(); c.setLineDash([]);
    var mid = rt.mid || rt.pts[Math.floor(rt.pts.length / 2)];
    kTag(c, mid[0], mid[1], nb.type === 'sea' ? '⛵ 海路' : nb.type === 'pass' ? '⛰ ' + (rt.name && rt.name !== '峠道' ? rt.name : '峠道') : '🛤 陸路', nb.type === 'sea' ? '#1e6aa8' : nb.type === 'pass' ? '#b4501a' : '#7a5a10', u);
  });
}
function kTag(c, x, y, txt, col, u) {
  c.save(); c.translate(x, y); c.scale(u, u);
  c.font = 'bold 11px sans-serif'; var w2 = c.measureText(txt).width + 10;
  c.fillStyle = col; c.beginPath(); if (c.roundRect) c.roundRect(-w2 / 2, -9, w2, 18, 9); else c.rect(-w2 / 2, -9, w2, 18); c.fill();
  c.strokeStyle = '#fff'; c.lineWidth = 1.5; c.stroke();
  c.fillStyle = '#fff'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(txt, 0, 1);
  c.restore();
}
function kDrawRoutes(c, lw) {
  if (!kMap.routes) return;
  var u = kU(1);
  kMap.routes.forEach(function (rt) {
    if (rt.type === 'none') return;
    c.beginPath(); rt.pts.forEach(function (q, i) { if (i) c.lineTo(q[0], q[1]); else c.moveTo(q[0], q[1]); });
    if (rt.type === 'sea') { c.strokeStyle = 'rgba(255,255,255,0.9)'; c.setLineDash([5 * lw, 4 * lw]); c.lineWidth = 2 * lw; }
    else { c.strokeStyle = rt.type === 'pass' ? 'rgba(90,45,20,0.9)' : 'rgba(150,90,40,0.8)'; c.setLineDash(rt.type === 'pass' ? [3 * lw, 2.5 * lw] : []); c.lineWidth = (rt.type === 'pass' ? 2.2 : 1.8) * lw; }
    c.stroke(); c.setLineDash([]);
  });
  // 峠・海路・とおれない 山の しるし
  kMap.routes.forEach(function (rt) {
    if (rt.type === 'land' || !rt.mid) return;
    var ic = rt.type === 'sea' ? '⛵' : rt.type === 'pass' ? '⛰' : '🚫', q = rt.mid;
    c.save(); c.translate(q[0], q[1]); c.scale(u, u);
    c.font = '13px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
    if (rt.type === 'none') { c.fillStyle = 'rgba(255,255,255,0.8)'; c.beginPath(); c.arc(0, 0, 9, 0, Math.PI * 2); c.fill(); }
    c.fillText(ic, 0, 0);
    if (rt.type === 'pass' && rt.name && rt.name !== '峠道' && kMap.s > 1.3) { c.font = 'bold 9px sans-serif'; c.lineWidth = 3; c.strokeStyle = 'rgba(255,255,255,0.9)'; c.strokeText(rt.name, 0, 12); c.fillStyle = '#4a2a14'; c.fillText(rt.name, 0, 12); }
    c.restore();
  });
}
// まわりの 国の 名前（めやす）
var NEAR_LABELS = [['但馬', 134.62, 35.42], ['播磨', 134.62, 34.95], ['讃岐', 133.95, 34.25], ['伊予', 132.95, 33.85], ['豊前', 131.02, 33.72], ['筑前', 130.70, 33.83], ['周防灘', 131.55, 33.85, 1], ['瀬戸内海', 133.15, 34.22, 1], ['日本海', 132.0, 35.45, 1]];
function kResize() {
  var cv = kMap.cv; kMap.dpr = Math.min(2, window.devicePixelRatio || 1);
  kMap.W = cv.offsetWidth; kMap.H = cv.offsetHeight;
  cv.width = Math.round(kMap.W * kMap.dpr); cv.height = Math.round(kMap.H * kMap.dpr);
}
function kAvail() { var top = ($('khud').offsetHeight || 60) + 4, bot = document.body.classList.contains('side') ? 4 : ($('kbottom').offsetHeight || 120) + 4; return { top: top, h: Math.max(80, kMap.H - top - bot) }; }
function kFit(whole) {
  var a = kAvail(), v = kMap.view, bw = v[2], bh = v[3];
  var sFit = Math.min(kMap.W / bw, a.h / bh);
  kMap.s = sFit;
  kMap.x = (kMap.W - bw * kMap.s) / 2 - v[0] * kMap.s; kMap.y = a.top + (a.h - bh * kMap.s) / 2 - v[1] * kMap.s;
  // たて長の 画面では 大きめに して じぶんの 国を まんなかに
  if (!whole && KS) {
    kMap.s = kMap.W < a.h * 1.2 ? Math.min(a.h / bh * 0.95, sFit * 2.2) : sFit * 1.9;
    var mine = provsOf(KS, KS.player), cx = 0, cy = 0;
    (mine.length ? mine : [PROVS[0].id]).forEach(function (pid) { var q = kMap.labels[pid]; cx += q[0]; cy += q[1]; });
    var n = Math.max(1, mine.length); cx /= n; cy /= n;
    kMap.x = kMap.W / 2 - cx * kMap.s; kMap.y = a.top + a.h / 2 - cy * kMap.s;
  }
}
var kWhole = false;
function kColorOf(pid) { var o = KS.provs[pid].owner; return o ? CLANS[o].color : '#ccc'; }
function kAtkTargets() { return kSel && KS.provs[kSel].owner === KS.player ? attackTargets(KS, kSel, KS.player) : []; }
function kTargets() {
  if (!kSel) return [];
  if (kMode === 'attack') return kAtkTargets().map(function (t) { return t.to; });
  if (kMode === 'move') return ADJ[kSel].filter(function (q) { return KS.provs[q].owner === KS.player; });
  if (kMode === 'scheme') return ADJ[kSel].filter(function (q) { return KS.provs[q].owner !== KS.player && KS.provs[q].owner !== IKKI; });
  return [];
}
function kRender() {
  if (!KS || !kMap.ctx || !kMap.paths) return;
  var c = kMap.ctx;
  c.setTransform(kMap.dpr, 0, 0, kMap.dpr, 0, 0);
  // 海
  var grd = c.createLinearGradient(0, 0, 0, kMap.H); grd.addColorStop(0, '#6aa8d6'); grd.addColorStop(1, '#3b78b0');
  c.fillStyle = grd; c.fillRect(0, 0, kMap.W, kMap.H);
  c.save(); c.translate(kMap.x, kMap.y); c.scale(kMap.s, kMap.s);
  var lw = 1 / kMap.s;
  // なみ
  c.strokeStyle = 'rgba(255,255,255,0.16)'; c.lineWidth = 1.4 * lw;
  var v = kMap.view;
  for (var wy = v[1]; wy < v[1] + v[3]; wy += 30) for (var wx = v[0] + ((wy / 30) % 2) * 26; wx < v[0] + v[2]; wx += 52) { c.beginPath(); c.arc(wx, wy, 7, Math.PI * 1.1, Math.PI * 1.9); c.stroke(); }
  // まわりの 国（四国・九州・播磨）
  kMap.near.forEach(function (p) { c.fillStyle = '#d9cfb4'; c.fill(p); c.strokeStyle = 'rgba(120,100,70,0.5)'; c.lineWidth = 1 * lw; c.stroke(p); });
  var tg = kTargets();
  // 中国地方を ヘックスで（地形 ＋ 持ち主の いろ。支城の 所領も）
  var hl = kHexLayer();
  if (hl) { var tr = kMap.terrRect; c.imageSmoothingEnabled = kMap.hexW * kMap.s < 22; c.drawImage(hl, tr[0], tr[1], tr[2], tr[3]); c.imageSmoothingEnabled = true; }
  else PROVS.forEach(function (p) { c.fillStyle = kColorOf(p.id); c.fill(kMap.paths[p.id]); });
  kHexDetail(c);
  // えらんだ 国・ねらえる 国
  PROVS.forEach(function (p) {
    var path = (kMap.hexPaths && kMap.hexPaths[p.id]) || kMap.paths[p.id];
    if (p.id === kSel) { c.fillStyle = 'rgba(255,255,230,0.30)'; c.fill(path); }
    else if (tg.indexOf(p.id) >= 0) {
      c.fillStyle = kMode === 'attack' ? 'rgba(255,50,30,0.32)' : kMode === 'scheme' ? 'rgba(150,60,220,0.34)' : 'rgba(60,140,255,0.32)'; c.fill(path);
      c.save(); c.clip(path); c.fillStyle = c.createPattern(kMap.stripe, 'repeat'); c.setTransform(1, 0, 0, 1, 0, 0); c.fillRect(0, 0, kMap.W * kMap.dpr, kMap.H * kMap.dpr); c.restore();
    }
  });
  // 隠岐（はこの 中の 島）は ヘックスの 外なので 国の いろで
  if (kMap.okiBox) { var ob0 = kMap.okiBox; c.save(); c.beginPath(); c.rect(ob0[0], ob0[1], ob0[2], ob0[3]); c.clip(); PROVS.forEach(function (p) { c.fillStyle = kColorOf(p.id); c.fill(kMap.paths[p.id]); c.strokeStyle = 'rgba(255,250,235,0.9)'; c.lineWidth = 2 * lw; c.stroke(kMap.paths[p.id]); }); c.restore(); }
  // 国ざかい（ヘックスの へりに そって）
  kDrawHexBorders(c, lw);
  kDrawRoutes(c, lw);
  kDrawFocus(c, lw);
  // じぶんの 領地ぜんぶ（本城・支城の 所領）を 黄色い 線で、えらんだ 国は 白い 点線で
  if (kSel) { c.save(); c.setLineDash([7 * lw, 5 * lw]); kDrawHexBorders(c, lw, kSel, '#ffffff', 2.2, true); c.restore(); }
  kDrawMyLand(c, lw);   // 黄色が うえ（国ざかいが かさなる ところは 黄色）
  tg.forEach(function (q) { kDrawHexBorders(c, lw, q, kMode === 'attack' ? '#ff5a3a' : kMode === 'scheme' ? '#c48aff' : '#5aa8ff', 2.6); });
  // 隠岐の 枠
  if (kMap.okiBox) { var ob = kMap.okiBox; c.strokeStyle = 'rgba(255,255,255,0.8)'; c.lineWidth = 1.5 * lw; c.setLineDash([6 * lw, 4 * lw]); c.strokeRect(ob[0], ob[1], ob[2], ob[3]); c.setLineDash([]);
    c.fillStyle = '#fff'; c.font = 'bold ' + (11 * lw * Math.max(1, kMap.s)) + 'px sans-serif'; c.textAlign = 'left'; c.textBaseline = 'top'; c.fillText('隠岐（出雲）', ob[0] + 4 * lw, ob[1] + 3 * lw); }
  // 地名（まわり・海）
  NEAR_LABELS.forEach(function (n) { var q = kProj(n[1], n[2]); c.font = (n[3] ? 'italic ' : 'bold ') + (n[3] ? 14 : 12) * lw + 'px serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = n[3] ? 'rgba(255,255,255,0.55)' : 'rgba(110,90,60,0.8)'; c.fillText(n[0], q[0], q[1]); });
  // 城
  kMap.cRects = [];
  PROVS.forEach(function (p) {
    var pin = kProj(p.pin[0], p.pin[1]), u = kU(1) ;
    var art = gx(castleArtOf(KS, p.id, null)), P0o = KS.provs[p.id].owner;
    kMap.cRects.push({ key: p.id, main: true, x0: pin[0] - 26 * u, x1: pin[0] + 26 * u, y0: pin[1] - (art ? 58 * art.naturalHeight / art.naturalWidth - 10 : 22) * u, y1: pin[1] + 9 * u });
    if (art) {   // 城の 絵（山城・平城・海城・館…）
      c.save(); c.translate(pin[0], pin[1]); c.scale(u, u);
      var aw = 58, ah = aw * art.naturalHeight / art.naturalWidth;
      var oc0 = P0o && CLANS[P0o] ? CLANS[P0o].color : '#888';
      c.fillStyle = oc0; c.globalAlpha = 0.6; c.beginPath(); c.ellipse(0, 6, aw * 0.46, 6, 0, 0, Math.PI * 2); c.fill(); c.globalAlpha = 1;
      c.strokeStyle = 'rgba(255,255,255,0.8)'; c.lineWidth = 1.2; c.stroke();
      c.drawImage(art, -aw / 2, 8 - ah, aw, ah);
      // もちぬしの 旗
      c.strokeStyle = '#222'; c.lineWidth = 1.2; c.beginPath(); c.moveTo(aw * 0.36, 8 - ah + 2); c.lineTo(aw * 0.36, 8 - ah + 20); c.stroke();
      c.fillStyle = oc0; c.fillRect(aw * 0.36, 8 - ah + 2, 11, 8); c.strokeStyle = '#fff'; c.lineWidth = 0.8; c.strokeRect(aw * 0.36, 8 - ah + 2, 11, 8);
      c.restore(); return;
    }
    c.save(); c.translate(pin[0], pin[1]); c.scale(u, u);
    c.fillStyle = 'rgba(0,0,0,0.25)'; c.beginPath(); c.ellipse(0, 6, 11, 3, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#8a7a5a'; c.fillRect(-9, 1, 18, 5);
    c.fillStyle = '#fbf8ef'; c.strokeStyle = '#3d2a1a'; c.lineWidth = 1; c.fillRect(-7, -5, 14, 7); c.strokeRect(-7, -5, 14, 7);
    c.fillStyle = '#34465a'; c.beginPath(); c.moveTo(-10, -5); c.lineTo(0, -11); c.lineTo(10, -5); c.closePath(); c.fill();
    c.fillStyle = '#fbf8ef'; c.fillRect(-4, -15, 8, 5); c.fillStyle = '#34465a'; c.beginPath(); c.moveTo(-7, -15); c.lineTo(0, -20); c.lineTo(7, -15); c.closePath(); c.fill();
    c.restore();
  });
  // 支城（ちいさな 櫓と 持ち主の 旗）
  var atkT = kMode === 'attack' ? kAtkTargets() : [];
  kMap.brPos = {};
  var w0 = worldMap(), bh0 = branchHexes();
  if (w0 && bh0 && KS.castles) Object.keys(KS.castles).forEach(function (id) {
    var C0 = KS.castles[id], h = bh0[id], ll0 = w0.ll(h[0], h[1]), q = kProj(ll0[0], ll0[1]), u = kU(0.9);
    kMap.brPos[id] = q;
    var isT = atkT.some(function (t) { return t.castle === id; });
    c.save(); c.translate(q[0], q[1]); c.scale(u, u);
    if (isT) { c.beginPath(); c.arc(0, -4, 13, 0, Math.PI * 2); c.fillStyle = 'rgba(255,60,30,0.45)'; c.fill(); c.strokeStyle = '#ff5a3a'; c.lineWidth = 2.5; c.stroke(); }
    var bart = gx(castleArtOf(KS, C0.prov, id));
    kMap.cRects.push({ key: id, main: false, x0: q[0] - 17 * u, x1: q[0] + 17 * u, y0: q[1] - (bart ? 38 * bart.naturalHeight / bart.naturalWidth - 6 : 17) * u, y1: q[1] + 7 * u });
    if (bart) {
      var bw = 38, bh2 = bw * bart.naturalHeight / bart.naturalWidth, oc = C0.owner ? CLANS[C0.owner].color : '#999';
      c.fillStyle = oc; c.globalAlpha = 0.55; c.beginPath(); c.ellipse(0, 2, bw * 0.46, 4.5, 0, 0, Math.PI * 2); c.fill(); c.globalAlpha = 1;
      c.drawImage(bart, -bw / 2, 4 - bh2, bw, bh2);
      c.fillStyle = oc; c.fillRect(bw * 0.38, 4 - bh2 - 2, 8, 6); c.strokeStyle = '#222'; c.lineWidth = 1; c.beginPath(); c.moveTo(bw * 0.38, 4 - bh2 - 2); c.lineTo(bw * 0.38, 4 - bh2 + 12); c.stroke();
    } else {
    c.fillStyle = '#fbf8ef'; c.strokeStyle = '#3d2a1a'; c.lineWidth = 1; c.fillRect(-5, -6, 10, 7); c.strokeRect(-5, -6, 10, 7);
    c.fillStyle = '#4a3a2a'; c.beginPath(); c.moveTo(-7, -6); c.lineTo(0, -11); c.lineTo(7, -6); c.closePath(); c.fill();
    c.fillStyle = C0.owner ? CLANS[C0.owner].color : '#999'; c.fillRect(5, -16, 7, 5); c.strokeStyle = '#222'; c.beginPath(); c.moveTo(5, -16); c.lineTo(5, -4); c.stroke();
    }
    if (kMap.s > 1.6) { c.font = 'bold 8px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'top'; c.lineWidth = 2.5; c.strokeStyle = 'rgba(255,255,255,0.9)'; c.strokeText(brName(id), 0, 3); c.fillStyle = '#3a2210'; c.fillText(brName(id), 0, 3); }
    // 支城の 兵の かず
    if (C0.owner && kMap.s > 1.1) { var bm = menTotal(C0.units), bt9 = bm >= 1000 ? (bm / 1000).toFixed(1).replace('.0', '') + '千' : String(bm);
      c.font = 'bold 8px sans-serif'; var bw9 = Math.max(14, c.measureText(bt9).width + 6), by9 = bart ? 4 - 38 * bart.naturalHeight / bart.naturalWidth : -16;
      c.fillStyle = 'rgba(30,20,10,0.85)'; c.beginPath(); if (c.roundRect) c.roundRect(-bw9 / 2 - 12, by9 - 4, bw9, 11, 5); else c.rect(-bw9 / 2 - 12, by9 - 4, bw9, 11); c.fill();
      c.strokeStyle = CLANS[C0.owner].color; c.lineWidth = 1.2; c.stroke();
      c.fillStyle = '#fff'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(bt9, -12, by9 + 1.5); }
    c.restore();
  });
  // 山・川・町の 名前（ちかよったとき）
  c.save(); c.setTransform(kMap.dpr, 0, 0, kMap.dpr, 0, 0); kGeoLabels(c); c.restore();
  // 家紋・国名・兵の かず
  var sc = kU(1.15);
  PROVS.forEach(function (p) {
    var P = KS.provs[p.id], lab = kMap.labels[p.id];
    c.save(); c.translate(lab[0], lab[1]); c.scale(sc, sc);
    var cr = 15, cy = -6;
    c.beginPath(); c.arc(0, cy, cr + 1.5, 0, Math.PI * 2); c.fillStyle = 'rgba(0,0,0,0.25)'; c.fill();
    c.beginPath(); c.arc(0, cy, cr, 0, Math.PI * 2); c.fillStyle = '#fff'; c.fill(); c.lineWidth = 3; c.strokeStyle = CLANS[P.owner].color; c.stroke();
    var sp = clanSpr(P.owner), im = sp ? kImg(sp) : null;
    if (im && im.complete && im.naturalWidth) { c.save(); c.beginPath(); c.arc(0, cy, cr - 2, 0, Math.PI * 2); c.clip(); if (isArtSrc(sp)) c.drawImage(im, -cr, cy - cr, cr * 2, cr * 2); else { var isc = (cr * 2.3) / im.naturalHeight; c.drawImage(im, -im.naturalWidth * isc / 2, cy - cr + 1, im.naturalWidth * isc, im.naturalHeight * isc); } c.restore(); }
    else { c.fillStyle = CLANS[P.owner].color; c.font = 'bold 17px serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(CLANS[P.owner].crest, 0, cy + 1); }
    c.font = 'bold 13px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'top';
    c.lineWidth = 4; c.strokeStyle = 'rgba(255,255,255,0.92)'; c.strokeText(p.name, 0, cy + cr + 2); c.fillStyle = '#2b1d14'; c.fillText(p.name, 0, cy + cr + 2);
    var mn = menTotal(P.units); if (KS.castles) branchesIn(KS, p.id).forEach(function (c9) { if (c9.owner && c9.owner === P.owner) mn += menTotal(c9.units); });   // 本城 ＋ おなじ 家の 支城
    var mtx = mn >= 1000 ? (mn / 1000).toFixed(1).replace('.0', '') + '千' : String(mn);
    c.font = 'bold 10px sans-serif'; var bw2 = Math.max(18, c.measureText(mtx).width + 8);
    c.fillStyle = '#2b1d14'; c.beginPath(); if (c.roundRect) c.roundRect(cr * 0.85 - bw2 / 2 + 4, cy - cr * 0.75 - 8, bw2, 16, 8); else c.rect(cr * 0.85 - bw2 / 2 + 4, cy - cr * 0.75 - 8, bw2, 16); c.fill();
    c.fillStyle = '#fff'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(mtx, cr * 0.85 + 4, cy - cr * 0.75 + 0.5);
    // じぶんとの 関係（同盟・中立・敵対）
    var rel = relationOf(KS, KS.player, P.owner);
    if (rel !== 'self') { var RI = REL_INFO[rel], rt = RI.icon + RI.name; c.font = 'bold 9px sans-serif'; var rw = c.measureText(rt).width + 8, ry = cy + cr + 17;
      c.fillStyle = RI.col; c.beginPath(); if (c.roundRect) c.roundRect(-rw / 2, ry, rw, 13, 6); else c.rect(-rw / 2, ry, rw, 13); c.fill();
      c.strokeStyle = 'rgba(255,255,255,0.9)'; c.lineWidth = 1.2; c.stroke(); c.fillStyle = '#fff'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(rt, 0, ry + 7); }
    if (P.owner === KS.player && !P.acted && cmdCount(P) === 0 && KS.phase === 'player') { c.beginPath(); c.arc(-cr * 0.85, cy - cr * 0.75, 6, 0, Math.PI * 2); c.fillStyle = '#ffe24a'; c.fill(); c.strokeStyle = '#7a5a00'; c.lineWidth = 1.5; c.stroke(); }
    c.restore();
  });
  // カーソルが のっている 城：白い わく
  var hv = kMap.hover && (kMap.cRects || []).filter(function (r0) { return r0.key === kMap.hover; })[0];
  if (hv) { var pd = 3 * lw, rx = hv.x0 - pd, ry = hv.y0 - pd, rw = hv.x1 - hv.x0 + pd * 2, rh = hv.y1 - hv.y0 + pd * 2;
    c.save(); c.lineJoin = 'round'; c.shadowColor = 'rgba(0,0,0,0.6)'; c.shadowBlur = 6 * lw; c.strokeStyle = '#fff'; c.lineWidth = 2.6 * lw; c.strokeRect(rx, ry, rw, rh); c.shadowBlur = 0;
    c.fillStyle = 'rgba(255,255,255,0.14)'; c.fillRect(rx, ry, rw, rh);
    var ow9 = hv.main ? KS.provs[hv.key].owner : KS.castles[hv.key].owner, nm = (hv.main ? castleNameOf(KS, hv.key) : brName(hv.key)) + (ow9 && CLANS[ow9] ? '（' + CLANS[ow9].name + '）' : ''), fz = 12 * lw; c.font = 'bold ' + fz + 'px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'bottom';
    var tw = c.measureText(nm).width; c.fillStyle = 'rgba(255,255,255,0.95)'; c.fillRect((hv.x0 + hv.x1) / 2 - tw / 2 - 4 * lw, ry - fz - 6 * lw, tw + 8 * lw, fz + 5 * lw); c.fillStyle = '#3a2210'; c.fillText(nm, (hv.x0 + hv.x1) / 2, ry - 3 * lw); c.restore(); }
  c.restore();
  // 方位
  c.fillStyle = 'rgba(255,255,255,0.8)'; c.font = 'bold 12px serif'; c.textAlign = 'center'; c.fillText('北 ▲', kMap.W - 28, ($('khud').offsetHeight || 50) + 16);
}
var kImgs = {};
function kImg(src) { if (!kImgs[src]) { var im = new Image(); im.onload = function () { kRender(); }; im.src = src; kImgs[src] = im; } return kImgs[src]; }

// ---- 画面の 情報 ----
function kUpdate() {
  if (!KS) return;
  var me = KS.clans[KS.player];
  $('kDate').textContent = eraName(KS.year) + '年 ' + SEASONS_K[KS.season];
  $('kGold').textContent = '💰' + kan(me.gold);
  $('kKoku').textContent = '🌾 ' + Math.round(effKoku(KS, KS.player) * 10) / 10 + '万石';
  var nBr = KS.castles ? Object.keys(KS.castles).filter(function (k) { return KS.castles[k].owner === KS.player; }).length : 0, nPv = provsOf(KS, KS.player).length;
  $('kProv').textContent = (KS.clans[KS.player].streak >= 2 ? '🔥' + KS.clans[KS.player].streak + '連勝　' : '') + '🏯 ' + (nPv + nBr) + '城（' + nPv + '/' + PROVS.length + '国）　⚔ ' + menStr(menTotal(totalArmy(KS, KS.player).concat(KS.castles ? [].concat.apply([], Object.keys(KS.castles).filter(function (k) { return KS.castles[k].owner === KS.player; }).map(function (k) { return KS.castles[k].units; })) : [])));
  $('kEndBtn').disabled = KS.phase !== 'player' || KS.over;
  $('kLegend').style.bottom = (document.body.classList.contains('side') ? 6 : ($('kbottom').offsetHeight || 150) + 6) + 'px';
  var last = KS.log.slice(-2);
  $('kLog').innerHTML = last.map(function (e) { return '<div class="lg ' + kLogCls(e.kind) + '">' + e.text + '</div>'; }).join('');
  kInfo();
  kRender();
}
function kLogCls(k) { return k === 'good' ? 'me' : k === 'bad' ? 'cpu' : 'sys'; }
function offTxt(o) { return o ? '<b>' + o.name + '</b>（武' + o.st[0] + ' 政' + o.st[1] + ' 智' + o.st[2] + '）' : 'なし'; }
function menTotal(units) { var n = 0; units.forEach(function (u) { if (u.type !== 'kiba' && u.type !== 'teppo') n += menOf(u); else n += menOf(u); }); return n; }
function menStr(n) { return n.toLocaleString('ja-JP') + '人'; }
function unitSummary(units) {
  var cnt = {}, men = {}; units.forEach(function (u) { cnt[u.type] = (cnt[u.type] || 0) + 1; men[u.type] = (men[u.type] || 0) + menOf(u); });
  var order = ['ashigaru', 'yumi', 'kiba', 'teppo', 'kosaku', 'ninja'];
  var s = order.filter(function (t) { return cnt[t]; }).map(function (t) { return UNIT_TYPES[t].name + men[t] + menUnit(t); }).join(' ');
  return s || 'へい なし';
}
function avgHp(units) { if (!units.length) return 0; return Math.round(units.reduce(function (s, u) { return s + u.hp; }, 0) / units.length * 10) / 10; }
function kInfo() {
  var box = $('kInfo');
  if (KS.phase === 'cpu') { box.innerHTML = '<p class="hint">ほかの 大名が うごいています…</p>'; $('kActs').innerHTML = ''; return; }
  if (!kSel) { box.innerHTML = '<p class="hint">国を クリックして えらぼう。きいろい ● は まだ めいれい していない 国。</p>'; $('kActs').innerHTML = ''; return; }
  var p = PROV_BY[kSel], P = KS.provs[kSel], C = CLANS[P.owner];
  var mine = P.owner === KS.player;
  var ally = isAlly(KS, KS.player, P.owner);
  var html = '<div class="kirow">' + crestHtml(P.owner, 34) + '<div><b>' + p.name + '</b>（' + p.kuni + '）　' + castleNameOf(KS, kSel) + '（' + CASTLES[castleIndexOf(p.castle)].kana + '）<br><small>' + C.lord + '（' + C.name + '）' + (ally ? '・🤝同盟' : '') + '・石高 ' + P.koku + '万石' + (silverOf(KS, kSel) ? '・銀山' : '') + '</small></div></div>';
  if (P.owner !== KS.player) { var rl = relationOf(KS, KS.player, P.owner), RL = REL_INFO[rl], lw0 = lastWar(KS, KS.player, P.owner);
    html += '<div class="kunits"><span class="krel" style="background:' + RL.col + '">' + RL.icon + ' ' + RL.name + '</span> ' + RL.desc + (lw0 !== undefined ? '（さいごの 合戦：' + (KS.turn - lw0 === 0 ? 'この きせつ' : (KS.turn - lw0) + 'きせつ まえ') + '）' : '') + '</div>'; }
  var ofc = officerAt(KS, kSel);
  html += '<div class="kunits">本城：<span class="kbr" data-main="' + kSel + '" style="border-color:' + CLANS[P.owner].color + '">🏯 ' + castleNameOf(KS, kSel) + '（' + menStr(menTotal(P.units)) + '・🍙' + castleFood(KS, kSel, null).toLocaleString('ja-JP') + '石・改築Lv' + (P.clv || 0) + (P.ruin ? '・🔥こわれている' : '') + '）</span></div>';
  html += '<div class="kunits">城主：' + offTxt(ofc) + (P.naio && P.naio === KS.player ? '　🦊内応あり' : '') + '</div>';
  if (mine && KS.officers) { var oh = officersHere(KS, KS.player, kSel).filter(function (o) { return o !== ofc; });
    html += '<div class="kunits">👥 この 国に いる 家臣：' + (oh.length ? oh.map(function (o) { return o.name + (o.at !== kSel ? '（' + locName(KS, o.at) + '）' : '') + (offBusy(KS, o) ? '✓' : ''); }).join('・') : (ofc ? '城主だけ' : 'いない（👥家臣から 移動させよう）')) + '</div>'; }
  var myBr = KS.castles ? branchesIn(KS, kSel).filter(function (c9) { return c9.owner && c9.owner === P.owner; }) : [];
  if (myBr.length) html += '<div class="kunits">⚔ 城ぜんぶの へい：<b>' + menStr(menTotal(P.units) + myBr.reduce(function (a, c9) { return a + menTotal(c9.units); }, 0)) + '</b>（本城 ' + menStr(menTotal(P.units)) + myBr.map(function (c9) { return '・' + brName(c9.id) + ' ' + menStr(menTotal(c9.units)); }).join('') + '）</div>';
  html += '<div class="kunits">' + (myBr.length ? '本城の ' : '') + 'へい ' + menStr(menTotal(P.units)) + '（' + P.units.length + '隊：' + unitSummary(P.units) + '）' + (mine && KS.phase === 'player' && canMergeUnits(P.units) ? ' <span class="kbr" data-main="' + kSel + '">🔗 へった 隊を まとめる</span>' : '') + '<br>動員の めやす ' + menStr(P.koku * MEN_PER_KOKU) + '</div>';
  var nbl = kNeighborInfo(kSel).map(function (nb) {
    var ic = nb.type === 'sea' ? '⛵' : nb.type === 'pass' ? '⛰' : nb.type === 'land' ? '🛤' : '🚫';
    return '<span class="knb ' + nb.type + '">' + ic + PROV_BY[nb.q].name + (nb.type === 'pass' && nb.name && nb.name !== '峠道' ? '（' + nb.name + '）' : '') + '</span>';
  }).join(' ');
  html += '<div class="kunits">となりへの 道：' + nbl + '</div>';
  if (KS.castles) html += '<div class="kunits">支城：' + branchesIn(KS, kSel).map(function (c) { return '<span class="kbr" data-br="' + c.id + '" style="border-color:' + (c.owner ? CLANS[c.owner].color : '#999') + '">🏯' + brName(c.id) + '（' + (c.owner ? CLANS[c.owner].name : 'だれも いない') + '・' + c.units.length + '隊・🍙' + castleFood(KS, c.prov, c.id) + '石・所領' + Math.round(branchShare(c.id) * 100) + '%' + (c.ruin ? '・🔥こわれている' : '') + (c.owner === KS.player && P.owner !== KS.player ? '・年貢 約' + kan(nenguOf(KS, kSel, KS.player)) : '') + '）</span>'; }).join(' ') + '</div>';
  if (P.bld) { var bs = ['town', 'mine', 'meibutsu', 'salt'].map(function (t) { var n = t === 'town' ? bldCount(P, 'town') : bldCount(P, t); return n ? BLD[t].icon + (t === 'meibutsu' ? MEIBUTSU[kSel] : BLD[t].name + n) : ''; }).filter(Boolean).join(' ');
    html += '<div class="kunits">領内：' + (bs || 'なし') + (mine ? '　収入 +' + kan(provSplit(KS, kSel, false)[KS.player] || 0) + '/きせつ' : '') + '</div>'; }
  // 年貢と 農民の 不満
  if (P.owner === IKKI) html += '<div class="kunits ktax">🌾 農民が 一揆を おこして おさめている 国（一揆衆・' + P.units.length + '隊）。せめて とりかえそう</div>';
  else {
    var fu = Math.round(P.fuman || 0), fd = fumanDelta(KS, kSel), fcol = fu >= IKKI_LINE ? '#e53935' : fu >= 45 ? '#ff8f00' : fu >= 25 ? '#d4b23a' : '#5bbf5b';
    var fbar = '<span class="kfbar"><i style="width:' + fu + '%;background:' + fcol + '"></i><em style="left:' + IKKI_LINE + '%"></em></span>';
    if (mine) {
      var t0 = taxOf(P), nen = nenguOf(KS, kSel, KS.player);
      html += '<div class="kunits ktax">年貢：' + (KS.phase === 'player' ? '<button class="ktx" data-d="-1"' + (t0 <= TAX_MIN + 0.01 ? ' disabled' : '') + '>−</button>' : '') + '<b>' + taxName(t0) + '</b>（' + Math.round(t0 * 100) + '%）' +
        (KS.phase === 'player' ? '<button class="ktx" data-d="1"' + (t0 >= TAX_MAX - 0.01 ? ' disabled' : '') + '>＋</button>' : '') + '　秋の 年貢 約 ' + kan(nen) +
        '<br>農民の 不満 ' + fbar + ' ' + fu + '（' + fumanWord(fu) + '）　つぎの きせつ ' + (fd >= 0 ? '+' : '') + Math.round(fd) + (fu >= 45 ? '<br><span class="r">⚠ 不満が ' + IKKI_LINE + 'を こえると 一揆が おきる！ 兵が すくないと 国を うばわれる</span>' : '') + '</div>';
    } else html += '<div class="kunits ktax">農民の ようす ' + fbar + ' ' + fumanWord(fu) + '</div>';
  }
  if (kMode === 'attack') html += '<p class="hint">あかく 光る 国を クリックして せめる 国を えらぶ</p>';
  else if (kMode === 'move') html += '<p class="hint">あおく 光る じぶんの 国を クリックして いどう先を えらぶ</p>';
  else if (kMode === 'scheme') html += '<p class="hint">むらさきに 光る 国を クリックして 調略する あいてを えらぶ</p>';
  else if (mine && P.acted) html += '<p class="hint">とったばかりの 国は この きせつ めいれい できない</p>';
  else if (mine && cmdCount(P)) html += '<p class="hint">この きせつに した こと：' + CMD_KINDS.filter(function (k) { return didCmd(P, k); }).map(function (k) { return CMD_NAME[k]; }).join('・') + '（あと ' + Math.max(0, MAX_CMDS - cmdCount(P)) + 'つ）</p>';
  box.innerHTML = html;
  [].forEach.call(box.querySelectorAll('.kbr[data-main]'), function (e) { e.onclick = function () { SFX.tap(); kMainCastleBox(e.dataset.main); }; });
  [].forEach.call(box.querySelectorAll('.kbr[data-br]'), function (e) { e.onclick = function () { SFX.tap(); kCastleBox(e.dataset.br); }; });
  [].forEach.call(box.querySelectorAll('.ktx'), function (b) { b.onclick = function () { SFX.tap(); kSnap('年貢'); setTax(KS, kSel, taxOf(KS.provs[kSel]) + 0.1 * +b.dataset.d); kSave(); kUpdate(); }; });
  var acts = $('kActs'); acts.innerHTML = '';
  function btn(label, fn, cls, dis) { var b = document.createElement('button'); b.className = 'act ' + (cls || ''); b.textContent = label; b.disabled = !!dis; b.onclick = function () { SFX.tap(); fn(); }; acts.appendChild(b); }
  if (kMode !== 'idle') { btn('やめる', function () { kMode = 'idle'; kUpdate(); }, 'sub'); return; }
  // めいれいは 城の 画面から（下には 城を ひらく ボタンだけ）
  if (mine && KS.phase === 'player') {
    btn('🏯 ' + castleNameOf(KS, kSel) + 'の めいれい（' + cmdCount(P) + '/' + MAX_CMDS + '）', function () { kMainCastleBox(kSel); }, 'katk', false);
    btn('📜 城と めいれいの 一覧', function () { kLandBox('castle'); }, 'sub', false);
  }
  if (false) {
    var canAtk = ADJ[kSel].some(function (q) { return KS.provs[q].owner !== KS.player; }) && P.units.length > 0;
    var canMv = ADJ[kSel].some(function (q) { return KS.provs[q].owner === KS.player; }) && P.units.length > 0;
    canMv = canMv && P.units.some(function (u) { return u.mv !== KS.turn; });
    var mainAtk = canAtk && !didCmd(P, 'attack'), brAtk = sortieBranches(kSel);
    btn('⚔ 出陣' + (didCmd(P, 'attack') && !brAtk.length ? '✓' : ''), function () { if (!brAtk.length) { kMode = 'attack'; kUpdate(); } else kSortieBox(kSel); }, 'katk', !mainAtk && !brAtk.length);
    btn('🪖 徴兵' + (didCmd(P, 'recruit') ? '✓' : ''), kRecruitBox, '', P.units.length >= PROV_CAP || didCmd(P, 'recruit'));
    btn('🌾 内政' + (didCmd(P, 'develop') ? '✓' : ''), function () { openDomain(kSel); }, 'kdev', didCmd(P, 'develop'));
    btn('🚶 移動' + (didCmd(P, 'move') ? '✓' : ''), function () { kMode = 'move'; kUpdate(); }, 'sub', !canMv || didCmd(P, 'move'));
    btn('🦊 調略' + (didCmd(P, 'scheme') ? '✓' : ''), function () { kMode = 'scheme'; kUpdate(); }, 'kscheme', didCmd(P, 'scheme') || !ADJ[kSel].some(function (q) { return KS.provs[q].owner !== KS.player; }));
  }

  if (mine && (P.acted || didCmd(P, 'develop') || cmdFull(P) || KS.phase !== 'player')) btn('🗾 領内', function () { openDomain(kSel); }, 'sub');
  if (kUndoStack.length && KS.phase === 'player') btn('↩ もどす', kUndo, 'undo');
}
// ---- ひとつ 前に もどす（徴兵・内政・移動・城主 だけ。合戦・調略・きせつの おわりは もどせない） ----
var kUndoStack = [];
function kSnap(what) { kUndoStack.push({ s: serialize(KS), what: what, sel: kSel }); if (kUndoStack.length > 20) kUndoStack.shift(); }
function kUndoClear() { kUndoStack = []; }
function kUndo() {
  var u = kUndoStack.pop(); if (!u) return;
  var S2 = deserialize(u.s); if (!S2) return;
  KS = S2; kSel = u.sel; kMode = 'idle'; kSave();
  banner('「' + u.what + '」を とりけした', 1200); kUpdate();
}

// ---- 地図の 操作 ----
// 国取り地図に 地名：ズームすると 山・川・峠、もっと よると 町・村も
function kGeoLabels(c) {
  var sZ = kMap.s; if (sZ < 2.2) return;
  var rects = [], W0 = kMap.W, H0 = kMap.H;
  function scr(lon, lat) { var q = kProj(lon, lat); return [kMap.x + q[0] * sZ, kMap.y + q[1] * sZ]; }
  function put(text, x, y, fz, col, rot, bold) {
    if (x < -40 || y < -20 || x > W0 + 40 || y > H0 + 20) return false;
    c.font = (bold === false ? '' : 'bold ') + fz + 'px sans-serif'; var tw = c.measureText(text).width + 4, th = fz + 2;
    for (var i = 0; i < rects.length; i++) { var q = rects[i]; if (x - tw / 2 < q[0] + q[2] && x + tw / 2 > q[0] && y - th / 2 < q[1] + q[3] && y + th / 2 > q[1]) return false; }
    rects.push([x - tw / 2, y - th / 2, tw, th]);
    c.save(); c.translate(x, y); if (rot) c.rotate(rot); c.textAlign = 'center'; c.textBaseline = 'middle'; c.lineJoin = 'round';
    c.lineWidth = 3; c.strokeStyle = 'rgba(255,255,255,0.88)'; c.strokeText(text, 0, 0); c.fillStyle = col; c.fillText(text, 0, 0); c.restore(); return true;
  }
  // 国の 家紋・名前の ところは あける
  PROVS.forEach(function (p) { var q = kMap.labels[p.id], x = kMap.x + q[0] * sZ, y = kMap.y + q[1] * sZ; rects.push([x - 40, y - 34, 80, 62]); });
  var fz = sZ >= 5 ? 13 : 12;
  GEO_NAMES.forEach(function (g) { if (g[3] === 'l') { var p = scr(g[1], g[2]); put(g[0], p[0], p[1], fz + 1, '#1d4f9a'); } });
  (WORLD.peaks || []).map(function (pk) { return [pk.name, pk.at[0], pk.at[1]]; }).concat(GEO_NAMES.filter(function (g) { return g[3] === 'm'; })).forEach(function (g) { var p = scr(g[1], g[2]); put('▲' + g[0], p[0], p[1], fz, '#6a3a12'); });
  (WORLD.rivers || []).forEach(function (rv) {
    var pts = rv.pts.map(function (q) { return scr(q[0], q[1]); }), L = 0, seg = [], i;
    for (i = 1; i < pts.length; i++) { var dl = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); seg.push([pts[i - 1], pts[i], L, dl]); L += dl; }
    var step = Math.max(260, L / 3), done = 0;
    for (var pos = Math.min(L / 2, step / 2); pos < L && done < 3; pos += step) {
      for (i = 0; i < seg.length; i++) if (pos <= seg[i][2] + seg[i][3]) break;
      if (i >= seg.length) break;
      var a = seg[i][0], b = seg[i][1], f = (pos - seg[i][2]) / Math.max(1, seg[i][3]), ang = Math.atan2(b[1] - a[1], b[0] - a[0]);
      if (ang > Math.PI / 2) ang -= Math.PI; if (ang < -Math.PI / 2) ang += Math.PI;
      if (put(rv.name, a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, fz, '#1559b8', ang)) done++;
    }
  });
  if (sZ >= 3.5) GEO_NAMES.forEach(function (g) {
    if (g[3] === 'l' || g[3] === 'm' || (g[3] === 'v' && sZ < 5.5)) return;
    var p = scr(g[1], g[2]), big = g[3] === 't';
    if (put(g[0], p[0], p[1] - 9, big ? fz : fz - 1, g[3] === 'i' ? '#1d4f9a' : big ? '#2a1a0a' : '#4a3a2a', 0, big || g[3] === 'i') && g[3] !== 'i') {
      c.beginPath(); c.arc(p[0], p[1], big ? 3.5 : 2.5, 0, Math.PI * 2); c.fillStyle = big ? '#3a2410' : '#6a5440'; c.fill(); c.lineWidth = 1.2; c.strokeStyle = '#fff'; c.stroke();
    }
  });
}
// 地図の 点 → いちばん ちかい ヘックスの 国
function kProvAtMap(mx, my) {
  var w = worldMap(); if (!w || !kMap.HX) return null;
  var t = kMap.terrRect, sx = t[2] / (w.w * 2 + 1), sy = t[3] / w.h, r0 = Math.round((my - t[1]) / sy - 0.5), c0 = Math.round(((mx - t[0]) / sx - 1) / 2), best = null;
  for (var r = r0 - 2; r <= r0 + 2; r++) for (var c = c0 - 2; c <= c0 + 2; c++) {
    if (r < 0 || c < 0 || r >= w.h || c >= w.w) continue; var i = r * w.w + c, d = Math.pow(kMap.HX[i] - mx, 2) + Math.pow(kMap.HY[i] - my, 2);
    if (!best || d < best[1]) best = [i, d, c, r];
  }
  if (!best || best[1] > Math.pow(kMap.hexW, 2)) return null;
  return w.provAt(best[2], best[3]) || null;
}
function kTap(sx, sy) {
  if (!KS || KS.over) return;
  var wx = (sx - kMap.x) / kMap.s, wy = (sy - kMap.y) / kMap.s;
  // 城の 絵の 上（白い わくの はんい）は 城を えらぶ
  var ck = kCastleAt(wx, wy);
  if (ck) {
    kMap.hover = ck.key;
    if (ck.main) {
      if (kMode === 'attack' && KS.phase === 'player') { var tm = kAtkTargets().filter(function (t) { return t.to === ck.key && !t.castle; })[0]; if (tm) { SFX.tap(); kAttackBox(kSel, tm.to, null); return; } }
      if (kMode === 'idle' || KS.phase !== 'player') { SFX.tap(); kSel = ck.key; kUpdate(); kMainCastleBox(ck.key); return; }
    } else {
      if (kMode === 'attack' && KS.phase === 'player') { var tb = kAtkTargets().filter(function (t) { return t.castle === ck.key; })[0]; if (tb) { SFX.tap(); kAttackBox(kSel, tb.to, tb.castle); return; } }
      if (kMode === 'idle' || KS.phase !== 'player') { SFX.tap(); kCastleBox(ck.key); return; }
    }
  }
  var i = -1, sc = kU(1.15);
  // 家紋の 上を 優先
  PROVS.forEach(function (p, k) { var q = kMap.labels[p.id], dx = q[0] - wx, dy = q[1] - 6 * sc - wy; if (dx * dx + dy * dy < Math.pow(18 * sc, 2)) i = k; });
  if (i < 0) { var hp = kProvAtMap(wx, wy); if (hp) PROVS.forEach(function (p, k) { if (p.id === hp) i = k; }); }
  if (i < 0) PROVS.forEach(function (p, k) { if (i < 0 && kMap.hit.isPointInPath(kMap.paths[p.id], wx, wy)) i = k; });
  if (i < 0) { // 海：いちばん ちかい 家紋
    var bd = Math.pow(40 / kMap.s, 2);
    PROVS.forEach(function (p, k) { var q = kMap.labels[p.id], dx = q[0] - wx, dy = q[1] - wy, d = dx * dx + dy * dy; if (d < bd) { bd = d; i = k; } });
  }
  if (i < 0) return;
  var pid = PROVS[i].id;
  if (KS.phase !== 'player') { kSel = pid; kUpdate(); return; }
  if (kMode === 'attack') { var t0 = kAtkTargets().filter(function (t) { return t.to === pid; })[0]; if (t0) { SFX.tap(); kAttackBox(kSel, pid, t0.castle); } else { kMode = 'idle'; kSel = pid; kUpdate(); } return; }
  if (kMode === 'move') { if (kTargets().indexOf(pid) >= 0) { SFX.tap(); kMoveBox(kSel, pid); } else { kMode = 'idle'; kSel = pid; kUpdate(); } return; }
  if (kMode === 'scheme') { if (kTargets().indexOf(pid) >= 0) { SFX.tap(); kSchemeBox(kSel, pid); } else { kMode = 'idle'; kSel = pid; kUpdate(); } return; }
  SFX.tap(); kSel = pid; kUpdate();
}
// その 点に ある 城（わくの なかで いちばん ちいさい もの）
function kCrestAt(wx, wy) {
  var sc = kU(1.15), hit = null;
  PROVS.forEach(function (p) { var q = kMap.labels[p.id], dx = q[0] - wx, dy = q[1] - 6 * sc - wy; if (dx * dx + dy * dy < Math.pow(18 * sc, 2)) hit = p.id; });
  return hit;
}
function kCastleAt(wx, wy) {
  if (kMap.labels && kCrestAt(wx, wy)) return null;   // 家紋の 上は 国を えらぶ
  var best = null;
  (kMap.cRects || []).forEach(function (r0) { if (wx >= r0.x0 && wx <= r0.x1 && wy >= r0.y0 && wy <= r0.y1) { var a = (r0.x1 - r0.x0) * (r0.y1 - r0.y0); if (!best || a < best.a) best = { a: a, r: r0 }; } });
  return best ? best.r : null;
}
function kInitInput() {
  var kcv = $('kcv');
  kcv.addEventListener('mousemove', function (e) {
    if (e.buttons || !KS) return;
    var ep = evPt(e, kcv), wx = (ep[0] - kMap.x) / kMap.s, wy = (ep[1] - kMap.y) / kMap.s;
    var ck = kCastleAt(wx, wy), k = ck ? ck.key : null;
    kcv.style.cursor = ck ? 'pointer' : '';
    if (k !== kMap.hover) { kMap.hover = k; kRender(); }
  });
  kcv.addEventListener('mouseleave', function () { if (kMap.hover) { kMap.hover = null; kRender(); } });
  panZoom($('kcv'), {
    cam: function () { return { x: kMap.x, y: kMap.y, s: kMap.s }; }, minS: 0.3, maxS: 14,
    set: function (x, y, s) { kMap.x = x; kMap.y = y; kMap.s = s; },
    after: function () { kRender(); },
    tap: function (x, y) { kTap(x, y); }
  });
}

// ---- モーダル ----
function kModal(title, body, btns, wide) {
  $('kTitle').textContent = title; $('kBody').innerHTML = body;
  $('kBox').querySelector('.card').classList.toggle('wide', !!wide);
  var bb = $('kBtns'); bb.innerHTML = '';
  (btns || []).forEach(function (b) { var e = document.createElement('button'); e.className = b.cls || 'act'; e.textContent = b.label; e.disabled = !!b.disabled; if (b.id) e.id = b.id; e.onclick = function () { SFX.tap(); b.fn(); }; bb.appendChild(e); });
  $('kBox').classList.add('on');
}
function kCloseModal() { $('kBox').classList.remove('on'); }

// へいの かずを えらぶ ぶひん（type ごとに ＋−）
function pickerHtml(units, init, pre) {
  pre = pre || '';
  var by = {}; units.forEach(function (u) { (by[u.type] = by[u.type] || []).push(u); });
  var order = ['ashigaru', 'yumi', 'kiba', 'teppo', 'kosaku', 'ninja'], h = '';
  order.forEach(function (t) {
    if (!by[t]) return;
    var n = init === 'all' ? by[t].length : (init && typeof init === 'object') ? Math.min(by[t].length, init[t] || 0) : 0;
    h += '<div class="arow"><span class="uic blue">' + UNIT_TYPES[t].ch + '</span><span class="uname"><b>' + UNIT_TYPES[t].name + '隊</b><small>' + by[t].length + '隊・' + menTotal(by[t]) + menUnit(t) + '</small></span>' +
      '<button class="pm" data-p="' + pre + '" data-t="' + t + '" data-d="-1">－</button><span class="num" id="pk_' + pre + t + '" data-max="' + by[t].length + '">' + n + '</span><button class="pm" data-p="' + pre + '" data-t="' + t + '" data-d="1">＋</button></div>';
  });
  return h;
}
function pickerBind(onChange, root) {
  Array.prototype.forEach.call((root || $('kBody')).querySelectorAll('.pm'), function (b) {
    b.onclick = function () { SFX.tap(); var t = b.getAttribute('data-t'), el = $('pk_' + (b.getAttribute('data-p') || '') + t), v = +el.textContent + (+b.getAttribute('data-d')); v = Math.max(0, Math.min(+el.getAttribute('data-max'), v)); el.textContent = v; if (onChange) onChange(); };
  });
}
function pickerUids(units, pre) {
  var out = [], by = {}; pre = pre || '';
  units.slice().sort(function (a, b) { return b.hp - a.hp; }).forEach(function (u) { (by[u.type] = by[u.type] || []).push(u); });
  for (var t in by) { var el = $('pk_' + pre + t); var n = el ? +el.textContent : 0; by[t].slice(0, n).forEach(function (u) { out.push(u.uid); }); }
  return out;
}

// ---- おとした 支城の 配置：のこす 兵を じぶんで きめる ----
function kDeployBox(id, pid, backUids, done) {
  var C0 = KS.castles[id], P = KS.provs[pid];
  var pool = C0.units.concat(P.units.filter(function (u) { return backUids.indexOf(u.uid) >= 0; })), init = {};
  C0.units.forEach(function (u) { init[u.type] = (init[u.type] || 0) + 1; });
  kModal('🏯 ' + brName(id) + 'に のこす 兵', '<p class="small">おとした 支城に のこす 隊を えらぶ（1〜8隊）。のこりは <b>' + PROV_BY[pid].name + '</b>へ もどる。</p>' + pickerHtml(pool, init) + '<p id="kDep" class="small"></p>', [
    { label: 'けってい', cls: 'act', id: 'kDepOk', fn: function () {
      var r = redeploy(KS, id, pid, backUids, pickerUids(pool)); if (!r.ok) { banner(r.msg, 1400); return; }
      kSave(); kCloseModal(); done(); } }]);
  function upd() {
    var k = pickerUids(pool).length, back = pool.length - k, room = PROV_CAP - (P.units.length - backUids.length);
    $('kDep').innerHTML = '🏯 ' + brName(id) + ' ' + k + '隊　／　' + PROV_BY[pid].name + 'へ ' + back + '隊' + (k < 1 ? '<br><span class="r">1隊は のこそう</span>' : k > 8 ? '<br><span class="r">支城は 8たいまで</span>' : back > room ? '<br><span class="r">' + PROV_BY[pid].name + 'に はいりきらない</span>' : '');
    $('kDepOk').disabled = k < 1 || k > 8 || back > room;
  }
  pickerBind(upd); upd();
}
// ---- 支城 ----
// 守備兵の 内わけ（兵種ごと：隊・人数・元気）
function garrisonHtml(units) {
  if (!units.length) return '<p class="small r">守備兵 なし</p>';
  var by = {}; units.forEach(function (u) { (by[u.type] = by[u.type] || []).push(u); });
  var h = '<table class="kgar"><tr><th></th><th>兵種</th><th>隊</th><th>人数</th><th>元気</th></tr>';
  BUY_ORDER.concat(['taisho']).forEach(function (t) {
    var l = by[t]; if (!l) return; var T = UNIT_TYPES[t], hp = l.reduce(function (a, u) { return a + u.hp; }, 0) / l.length;
    h += '<tr><td><span class="uic blue">' + T.ch + '</span></td><td>' + T.name + '</td><td>' + l.length + '</td><td><b>' + menTotal(l).toLocaleString('ja-JP') + menUnit(t) + '</b></td><td><span class="kfbar"><i style="width:' + hp * 10 + '%;background:' + (hp >= 7 ? '#5bbf5b' : hp >= 4 ? '#d4b23a' : '#e53935') + '"></i></span></td></tr>';
  });
  return h + '<tr class="tot"><td></td><td>ごうけい</td><td>' + units.length + '</td><td><b>' + menStr(menTotal(units)) + '</b></td><td></td></tr></table>';
}
// こわれた 城を なおす
function repairRowHtml(pid, cid, mine) {
  if (!isRuined(KS, pid, cid)) return '';
  var c = repairCost(KS, pid, cid), g = KS.clans[KS.player].gold;
  return '<div class="kbrow" style="background:#fff0e0;border-radius:8px;padding:6px"><span class="kbrn">🔥 <b>城が こわれて いる</b><br><small>おとされた ときに 石垣・門が こわれた。守りが よわい（合戦で 石垣・門が 4わりの つよさ）。改築も できない。</small></span>' +
    (mine ? '<button class="kmini" data-rep="1"' + (g < c ? ' disabled' : '') + '>🔨 なおす<br>💰' + kan(c) + '</button>' : '') + '</div>';
}
function bindRepair(pid, cid, back) {
  [].forEach.call($('kBody').querySelectorAll('[data-rep]'), function (e) { e.onclick = function () {
    SFX.tap(); kSnap('城の 修理'); var r = repairCastle(KS, pid, cid); if (!r.ok) { kUndoStack.pop(); return; }
    SFX.repair && SFX.repair(); logC(KS, (cid ? brName(cid) : castleNameOf(KS, pid)) + 'を なおした（💰' + kan(r.cost) + '）', 'good'); kSave(); kUpdate(); back(); }; });
}
// へった 隊を まとめる ボタン
function mergeRowHtml(units, mine) {
  if (!mine || !canMergeUnits(units)) return '';
  return '<div class="kbrow"><span class="kbrn"><small>へった 隊が ある。おなじ 兵種どうし まとめると 隊の かずが へって、1隊が つよく なる（人数は おなじ）。</small></span><button class="kmini" data-mrg="1">🔗 隊を まとめる</button></div>';
}
function bindMerge(units, name, back) {
  [].forEach.call($('kBody').querySelectorAll('[data-mrg]'), function (e) { e.onclick = function () {
    SFX.tap(); kSnap('隊を まとめる'); var n0 = units.length, g = mergeUnits(units);
    if (g) logC(KS, name + 'の 隊を まとめた（' + n0 + '隊 → ' + units.length + '隊）', 'good');
    kSave(); kUpdate(); back(); }; });
}
// 兵糧の ようす
function riceHtml(pid, cid) {
  var f = castleFood(KS, pid, cid), cap = castleFoodCap(KS, pid, cid), d = castleFoodDays(KS, pid, cid);
  return '<div class="kodds">🍙 兵糧 <b>' + f.toLocaleString('ja-JP') + '石</b>／蔵 ' + cap.toLocaleString('ja-JP') + '石　<span class="kfbar"><i style="width:' + Math.min(100, f / cap * 100) + '%;background:#d9b44a"></i></span><br>' +
    'いまの 守備兵で <b class="' + (d < 15 ? 'r' : d < 30 ? 'y' : 'g') + '">約' + (d > 365 ? '365日いじょう' : d + '日') + '</b> 籠城できる（1人 1日 2.5合）。秋に 米が はいる。</div>';
}
// 兵糧を はこぶ（じぶんの 城どうし。めいれいは つかわない）
function kRiceMoveBox(loc, back) {
  var a = locPC(KS, loc), nm = locName(KS, loc), have = castleFood(KS, a[0], a[1]), ds = riceDests(KS, loc), pick = null;
  function row(d) { var b = locPC(KS, d), f = castleFood(KS, b[0], b[1]), cap = castleFoodCap(KS, b[0], b[1]), dd = castleFoodDays(KS, b[0], b[1]);
    return '<button class="koff" data-d="' + d + '"' + (f >= cap ? ' disabled style="opacity:.5"' : '') + '><b>' + (b[1] ? '🏰 ' : '🏯 ') + locName(KS, d) + '</b><small>' + PROV_BY[b[0]].name + (b[1] ? 'の 支城' : 'の 本城') + '　🍙' + f.toLocaleString('ja-JP') + '／' + cap.toLocaleString('ja-JP') + '石（' + (dd > 365 ? '1年いじょう' : dd + '日') + '）' + (f >= cap ? '・蔵いっぱい' : '') + '</small></button>'; }
  var h = '<p class="small"><b>' + nm + '</b>の 蔵 🍙' + have.toLocaleString('ja-JP') + '石 から、領地の なかの じぶんの 城へ はこぶ（つながって いる 国なら どこでも）。すぐ とどく（めいれいは つかわない）。</p>' +
    (ds.length ? '<div class="koffs">' + ds.map(row).join('') + '</div>' : '<p class="small r">はこべる 城が ない（領地の なかに ほかの 城が ない）</p>');
  kModal('🍙 ' + nm + 'から 兵糧を はこぶ', h, [{ label: 'もどる', cls: 'act sub', fn: back }]);
  [].forEach.call($('kBody').querySelectorAll('[data-d]'), function (e) { e.onclick = function () {
    SFX.tap(); var d = e.dataset.d, b = locPC(KS, d), room = castleFoodCap(KS, b[0], b[1]) - castleFood(KS, b[0], b[1]), mx = Math.max(0, Math.min(have, room));
    if (mx < 1) return;
    var st = Math.max(1, Math.round(mx / 50)), def = Math.min(mx, Math.max(st, Math.round(mx / 2)));
    kModal('🍙 ' + nm + ' → ' + locName(KS, d), '<p class="small">はこぶ 石を えらぶ（さいだい ' + mx.toLocaleString('ja-JP') + '石）。</p><div class="kamt"><input type="range" id="kRm" min="1" max="' + mx + '" step="1" value="' + def + '"><b id="kRmV"></b></div><p class="small" id="kRmW"></p>', [
      { label: '🍙 はこぶ', cls: 'act', fn: function () { kSnap('兵糧を はこぶ'); var r = moveRice(KS, loc, d, +$('kRm').value); if (!r.ok) { kUndoStack.pop(); banner(r.msg, 1200); return; }
          logC(KS, nm + 'から ' + locName(KS, d) + 'へ 兵糧 ' + r.koku.toLocaleString('ja-JP') + '石を はこんだ', 'good'); kSave(); kUpdate(); back(); } },
      { label: 'もどる', cls: 'act sub', fn: function () { kRiceMoveBox(loc, back); } }]);
    var upd = function () { var k = +$('kRm').value, fa = have - k, fb = castleFood(KS, b[0], b[1]) + k;
      $('kRmV').textContent = k.toLocaleString('ja-JP') + '石';
      $('kRmW').innerHTML = nm + ' ' + have.toLocaleString('ja-JP') + ' → <b>' + fa.toLocaleString('ja-JP') + '石</b>（' + castleDaysAt(a, fa) + '）<br>' + locName(KS, d) + ' ' + castleFood(KS, b[0], b[1]).toLocaleString('ja-JP') + ' → <b>' + fb.toLocaleString('ja-JP') + '石</b>（' + castleDaysAt(b, fb) + '）'; };
    $('kRm').oninput = upd; upd();
  }; });
}
// ---- 領地の 城どうしの 出し入れ（城の 画面に まとめて ならべる）----
// from → to へ 隊を えらんで うつす
function kTroopPairBox(from, to, back) {
  var free = locUnits(KS, from).filter(function (u) { return u.mv !== KS.turn; }), room = locCap(KS, to) - locUnits(KS, to).length, nf = locName(KS, from), nt = locName(KS, to);
  if (!free.length) { banner(nf + 'に うつせる 隊が ない（この きせつ もう うごいた）', 1500); return; }
  kModal('🚶 ' + nf + ' → ' + nt, '<p class="small">うつす 隊を えらぶ（' + nt + 'には あと ' + room + '隊 はいる・すぐ つく・めいれいは つかわない）。うつした 隊は この きせつ もう うつせない。</p>' + pickerHtml(free, 0, 'tm_') + '<p class="small" id="kTmW"></p>', [
    { label: '🚶 うつす', cls: 'act', id: 'kTmOk', fn: function () { var ids = pickerUids(free, 'tm_'); kSnap('兵を うつす'); var r = moveTroops(KS, from, to, ids); if (!r.ok) { kUndoStack.pop(); banner(r.msg, 1300); return; }
        logC(KS, nf + 'から ' + nt + 'へ へい ' + menStr(r.men) + '（' + r.n + '隊）を うつした', 'good'); kSave(); kUpdate(); back(); } },
    { label: 'もどる', cls: 'act sub', fn: back }]);
  pickerBind(function () { var ids = pickerUids(free, 'tm_'), mv = free.filter(function (u) { return ids.indexOf(u.uid) >= 0; }); $('kTmW').innerHTML = mv.length ? menStr(menTotal(mv)) + '（' + mv.length + '隊）を うつす' + (mv.length > room ? '<br><span class="r">はいりきらない</span>' : '') : ''; $('kTmOk').disabled = !mv.length || mv.length > room; });
  $('kTmOk').disabled = true;
}
// from → to へ 兵糧を はこぶ
function kRicePairBox(from, to, back) {
  var a = locPC(KS, from), b = locPC(KS, to), nf = locName(KS, from), nt = locName(KS, to), have = castleFood(KS, a[0], a[1]);
  var room = castleFoodCap(KS, b[0], b[1]) - castleFood(KS, b[0], b[1]), mx = Math.max(0, Math.min(have, room));
  if (mx < 1) { banner(room < 1 ? nt + 'の 蔵が いっぱい' : nf + 'に 兵糧が ない', 1400); return; }
  var def = Math.max(1, Math.round(mx / 2));
  kModal('🍙 ' + nf + ' → ' + nt, '<p class="small">はこぶ 石を えらぶ（さいだい ' + mx.toLocaleString('ja-JP') + '石・すぐ とどく・めいれいは つかわない）。</p><div class="kamt"><input type="range" id="kRm" min="1" max="' + mx + '" step="1" value="' + def + '"><b id="kRmV"></b></div><p class="small" id="kRmW"></p>', [
    { label: '🍙 はこぶ', cls: 'act', fn: function () { kSnap('兵糧を はこぶ'); var r = moveRice(KS, from, to, +$('kRm').value); if (!r.ok) { kUndoStack.pop(); banner(r.msg, 1200); return; }
        logC(KS, nf + 'から ' + nt + 'へ 兵糧 ' + r.koku.toLocaleString('ja-JP') + '石を はこんだ', 'good'); kSave(); kUpdate(); back(); } },
    { label: 'もどる', cls: 'act sub', fn: back }]);
  var upd = function () { var k = +$('kRm').value; $('kRmV').textContent = k.toLocaleString('ja-JP') + '石';
    $('kRmW').innerHTML = nf + ' ' + have.toLocaleString('ja-JP') + ' → <b>' + (have - k).toLocaleString('ja-JP') + '石</b>（' + castleDaysAt(a, have - k) + '）<br>' + nt + ' ' + castleFood(KS, b[0], b[1]).toLocaleString('ja-JP') + ' → <b>' + (castleFood(KS, b[0], b[1]) + k).toLocaleString('ja-JP') + '石</b>（' + castleDaysAt(b, castleFood(KS, b[0], b[1]) + k) + '）'; };
  $('kRm').oninput = upd; upd();
}
// 城の 画面に いれる：領地の ほかの 城と 兵・兵糧の 出し入れ
function linkSectionHtml(loc, mine) {
  if (!mine) return '';
  var ds = domainLocs(KS, loc); if (!ds.length) return '<h4>領地の 城と 出し入れ</h4><p class="small">領地の なかに ほかの 城が ない</p>';
  var here = locPC(KS, loc)[0];
  ds.sort(function (x, y) { var px = locPC(KS, x)[0], py = locPC(KS, y)[0]; return (px === here ? 0 : 1) - (py === here ? 0 : 1) || (KS.castles[x] ? 1 : 0) - (KS.castles[y] ? 1 : 0); });
  return '<h4>領地の 城と 出し入れ <small>（すぐ とどく・めいれいは つかわない）</small></h4>' + ds.map(function (d) {
    var pc = locPC(KS, d), u = locUnits(KS, d), f = castleFood(KS, pc[0], pc[1]);
    return '<div class="kbrow klink"><span class="kbrn" data-open="' + d + '">' + (pc[1] ? '🏰 ' : '🏯 ') + '<b>' + locName(KS, d) + '</b><br><small>' + PROV_BY[pc[0]].name + (pc[1] ? 'の 支城' : 'の 本城') + '・⚔' + menStr(menTotal(u)) + '（' + u.length + '/' + locCap(KS, d) + '隊）・🍙' + f.toLocaleString('ja-JP') + '石</small></span>' +
      '<span class="klbtn"><button class="kmini" data-tsnd="' + d + '" title="この 城から へいを おくる">⚔ へい おくる</button><button class="kmini sub" data-tget="' + d + '" title="へいを この 城へ よぶ">⚔ へい よぶ</button>' +
      '<button class="kmini" data-rsnd="' + d + '" title="兵糧を おくる">🍙 米 おくる</button><button class="kmini sub" data-rget="' + d + '" title="兵糧を よぶ">🍙 米 よぶ</button></span></div>';
  }).join('');
}
function bindLinkSection(loc, back) {
  function on(sel, fn) { [].forEach.call($('kBody').querySelectorAll(sel), function (e) { e.onclick = function () { SFX.tap(); fn(e); }; }); }
  on('[data-tsnd]', function (e) { kTroopPairBox(loc, e.dataset.tsnd, back); });
  on('[data-tget]', function (e) { kTroopPairBox(e.dataset.tget, loc, back); });
  on('[data-rsnd]', function (e) { kRicePairBox(loc, e.dataset.rsnd, back); });
  on('[data-rget]', function (e) { kRicePairBox(e.dataset.rget, loc, back); });
  on('[data-open]', function (e) { var d = e.dataset.open; if (KS.castles[d]) kCastleBox(d); else kMainCastleBox(d); });
}
// 兵を うつす（領地の なか。めいれいは つかわない）
function kTroopMoveBox(loc, back) {
  var nm = locName(KS, loc), ds = domainLocs(KS, loc), src = locUnits(KS, loc), free = src.filter(function (u) { return u.mv !== KS.turn; });
  function row(d) { var u = locUnits(KS, d), cap = locCap(KS, d), pc = locPC(KS, d);
    return '<button class="koff" data-d="' + d + '"' + (u.length >= cap ? ' disabled style="opacity:.5"' : '') + '><b>' + (pc[1] ? '🏰 ' : '🏯 ') + locName(KS, d) + '</b><small>' + PROV_BY[pc[0]].name + (pc[1] ? 'の 支城' : 'の 本城') + '　⚔' + menStr(menTotal(u)) + '（' + u.length + '/' + cap + '隊）' + (u.length >= cap ? '・いっぱい' : '') + '</small></button>'; }
  var h = '<p class="small"><b>' + nm + '</b>の へい ' + menStr(menTotal(src)) + '（' + src.length + '隊）を、領地の なかの じぶんの 城へ うつす（つながって いる 国なら どこでも・すぐ つく・めいれいは つかわない）。うつした 隊は この きせつ もう うつせない。' + (free.length < src.length ? '<br>この きせつ もう うごいた 隊：' + (src.length - free.length) : '') + '</p>' +
    (!free.length ? '<p class="small r">うつせる 隊が ない</p>' : ds.length ? '<div class="koffs">' + ds.map(row).join('') + '</div>' : '<p class="small r">うつせる 城が ない（領地の なかに ほかの 城が ない）</p>');
  kModal('🚶 ' + nm + 'から 兵を うつす', h, [{ label: 'もどる', cls: 'act sub', fn: back }]);
  [].forEach.call($('kBody').querySelectorAll('[data-d]'), function (e) { e.onclick = function () {
    SFX.tap(); var d = e.dataset.d, room = locCap(KS, d) - locUnits(KS, d).length;
    kModal('🚶 ' + nm + ' → ' + locName(KS, d), '<p class="small">うつす 隊を えらぶ（' + locName(KS, d) + 'には あと ' + room + '隊 はいる）。</p>' + pickerHtml(free, 0, 'tm_') + '<p class="small" id="kTmW"></p>', [
      { label: '🚶 うつす', cls: 'act', id: 'kTmOk', fn: function () { var ids = pickerUids(free, 'tm_'); kSnap('兵を うつす'); var r = moveTroops(KS, loc, d, ids); if (!r.ok) { kUndoStack.pop(); banner(r.msg, 1300); return; }
          logC(KS, nm + 'から ' + locName(KS, d) + 'へ へい ' + menStr(r.men) + '（' + r.n + '隊）を うつした', 'good'); kSave(); kUpdate(); back(); } },
      { label: 'もどる', cls: 'act sub', fn: function () { kTroopMoveBox(loc, back); } }]);
    pickerBind(function () { var ids = pickerUids(free, 'tm_'), mv = free.filter(function (u) { return ids.indexOf(u.uid) >= 0; }); $('kTmW').innerHTML = mv.length ? menStr(menTotal(mv)) + '（' + mv.length + '隊）を うつす' + (mv.length > room ? '<br><span class="r">はいりきらない</span>' : '') : ''; $('kTmOk').disabled = !mv.length || mv.length > room; });
    var ids0 = pickerUids(free, 'tm_'); $('kTmOk').disabled = !ids0.length;
  }; });
}
function castleDaysAt(pc, food) { var men = menOfUnits(castleUnits(KS, pc[0], pc[1])); var d = men ? Math.floor(food / (men * RICE_PER_MAN)) : 999; return d > 365 ? '1年いじょう もつ' : d + '日 もつ'; }
// 兵糧を かう
function kRiceBox(pid, cid, back) {
  var f = castleFood(KS, pid, cid), cap = castleFoodCap(KS, pid, cid), room = cap - f, gold = KS.clans[KS.player].gold;
  var mx = Math.max(0, Math.min(room, Math.floor(gold * KAN / RICE_PRICE)));
  kModal('🍙 兵糧を かう', '<p class="small">1石 ' + RICE_PRICE + '貫。蔵に あと ' + room.toLocaleString('ja-JP') + '石 はいる。</p>' + (mx >= 10 ? '<div class="kamt"><input type="range" id="kRice" min="10" max="' + mx + '" step="10" value="' + Math.min(mx, Math.max(10, Math.round(room / 20) * 10)) + '"><b id="kRiceV"></b></div>' : '<p class="r">かえない（蔵が いっぱい か お金が たりない）</p>'), [
    { label: 'かう', cls: 'act', id: 'kRiceOk', disabled: mx < 10, fn: function () { var k = +$('kRice').value; kSnap('兵糧'); var r = buyRice(KS, pid, cid, k); if (!r.ok) { kUndoStack.pop(); banner(r.msg, 1200); return; } logC(KS, (cid ? brName(cid) : castleNameOf(KS, pid)) + 'に 兵糧 ' + r.koku + '石を いれた', 'good'); kSave(); kUpdate(); back(); } },
    { label: 'やめる', cls: 'act sub', fn: back }]);
  if (mx >= 10) { var upd = function () { var k = +$('kRice').value; $('kRiceV').innerHTML = k + '石<br><small>💰' + kan(Math.ceil(k * RICE_PRICE / KAN * 100) / 100) + '</small>'; }; $('kRice').oninput = upd; upd(); }
}
// 本城を クリック：守備兵・兵糧・支城への 配置
function kMainCastleBox(pid) {
  var P = KS.provs[pid], mine = P.owner === KS.player && KS.phase === 'player', ci = castleIndexOf(PROV_BY[pid].castle);
  var brs = KS.castles ? Object.keys(KS.castles).filter(function (k) { var c0 = KS.castles[k]; return c0.owner === P.owner && castleLinks(KS, k).indexOf(pid) >= 0; }) : [];
  var body = ownerBand(P.owner) + '<div class="kintro"><p><b>' + castleNameOf(KS, pid) + '</b>（' + PROV_BY[pid].name + 'の 本城・' + CASTLES[ci].kana + '）<br>🏯 改築 Lv' + (P.clv || 0) + '／' + CASTLE_LV_MAX + '</p></div>' +
    repairRowHtml(pid, null, mine) + '<h4>守備兵</h4>' + garrisonHtml(P.units) + mergeRowHtml(P.units, mine) + riceHtml(pid, null) +
    linkSectionHtml(pid, mine);
  var btns = [];
  if (mine) {
    var full0 = P.acted || cmdFull(P), hasEn = ADJ[pid].some(function (q) { return KS.provs[q].owner !== KS.player; });
    var go0 = function (m) { return function () { kCloseModal(); kSel = pid; kMode = m; kUpdate(); }; };
    var rdone = didCmd(P, 'recruit') || P.acted || cmdFull(P);
    btns.push({ label: '⚔ 出陣' + (didCmd(P, 'attack') ? '✓' : ''), cls: 'act', disabled: full0 || didCmd(P, 'attack') || !P.units.length || !hasEn, fn: go0('attack') });
    btns.push({ label: '🪖 徴兵' + (didCmd(P, 'recruit') ? '✓' : ''), cls: 'act', disabled: rdone || (P.units.length >= PROV_CAP && !P.units.some(function (u) { return u.hp < 10; })), fn: function () { kRecruitBox(pid, null, function () { kMainCastleBox(pid); }); } });
    btns.push({ label: '🌾 内政', cls: 'act', fn: function () { kCloseModal(); kSel = pid; openDomain(pid); } });
    btns.push({ label: '🦊 調略' + (didCmd(P, 'scheme') ? '✓' : ''), cls: 'act', disabled: full0 || didCmd(P, 'scheme') || !hasEn, fn: go0('scheme') });
    btns.push({ label: '🎖 城主', cls: 'act sub', fn: function () { kAssignBox(pid, function () { kMainCastleBox(pid); }); } });
    btns.push({ label: '🍙 兵糧を かう', cls: 'act', fn: function () { kRiceBox(pid, null, function () { kMainCastleBox(pid); }); } });
  }
  btns.push({ label: 'とじる', cls: 'act sub', fn: kCloseModal });
  kModal('🏯 本城' + (mine ? '（めいれい ' + cmdCount(P) + '/' + MAX_CMDS + '）' : ''), body, btns);
  var back = function () { kMainCastleBox(pid); };
  bindLinkSection(pid, back);
  bindMerge(P.units, castleNameOf(KS, pid), back); bindRepair(pid, null, back);
}
function kCastleBox(id) {
  var C0 = KS.castles[id], P = KS.provs[C0.prov], mine = C0.owner === KS.player, links = mine && KS.phase === 'player' ? castleLinks(KS, id) : [];
  var body = ownerBand(C0.owner) + '<div class="kintro"><p><b>' + brName(id) + '</b>（' + PROV_BY[C0.prov].name + 'の 支城・' + CASTLES[castleIndexOf(brTpl(id))].kana + '）' + (C0.owner && C0.owner !== P.owner ? '<br><small>この 国の 本城は ' + (P.owner ? CLANS[P.owner].name : 'だれも いない') + '</small>' : '') + '</p></div>' +
    '<p class="small">🏯 改築 Lv' + (C0.lv || 0) + '／' + CASTLE_LV_MAX + (C0.lv ? '（守り ×' + lvMult(C0.lv).toFixed(2) + '）' : '') + '</p>' +
    repairRowHtml(C0.prov, id, mine && KS.phase === 'player') + '<h4>守備兵</h4>' + garrisonHtml(C0.units) + mergeRowHtml(C0.units, mine && KS.phase === 'player') + riceHtml(C0.prov, id) +
    '<p class="small">' + (P.owner === C0.owner ? '本城と 同じ 家。せめられると 本城から 後詰めが くる。' : C0.owner === KS.player ? 'てきの 国の 中の みかたの 城。ここが あれば ' + castleNameOf(KS, C0.prov) + '（本城）を せめられる。' : 'この 城を おとさないと、この 道から 本城へは せめられない。') + '</p>' +
    '<p class="small">🗾 所領：' + PROV_BY[C0.prov].name + 'の 約' + Math.round(branchShare(id) * 100) + '%（地図で 色の かわる ところ）' + (C0.owner && C0.owner !== P.owner ? '。その ぶんの 年貢・収入は ' + CLANS[C0.owner].name + 'に はいる' : '') + '</p>' +
    linkSectionHtml(id, mine && KS.phase === 'player');
  var btns = [];
  if (mine && KS.phase === 'player') {
    var bt = branchTargets(KS, id), ok = canBranchAttack(KS, id) && bt.length;
    btns.push({ label: '⚔ ここから 出陣' + (C0.atk === KS.turn ? '✓' : ''), cls: 'act', disabled: !ok, fn: function () { if (ok) kBranchAtkBox(id); } });
    var bst = branchSchemeTargets(KS, id);
    btns.push({ label: '🦊 調略' + (C0.sch === KS.turn ? '✓' : ''), cls: 'act', disabled: C0.sch === KS.turn || !bst.length, fn: function () { kBranchSchemeBox(id); } });
    btns.push({ label: '🪖 徴兵' + (C0.rec === KS.turn ? '✓' : ''), cls: 'act', disabled: C0.rec === KS.turn || (C0.units.length >= 8 && !C0.units.some(function (u) { return u.hp < 10; })), fn: function () { kRecruitBox(C0.prov, id, function () { kCastleBox(id); }); } });
    btns.push({ label: '🍙 兵糧を かう', cls: 'act', fn: function () { kRiceBox(C0.prov, id, function () { kCastleBox(id); }); } });
  }
  if (mine) btns.push({ label: '🌾 内政（改築）', cls: 'act kdev', fn: function () { kCloseModal(); openDomain(C0.prov, id); } });
  btns.push({ label: 'とじる', cls: 'act sub', fn: kCloseModal });
  kModal('🏯 支城', body, btns);
  bindLinkSection(id, function () { kCastleBox(id); });
  bindMerge(C0.units, brName(id), function () { kCastleBox(id); }); bindRepair(C0.prov, id, function () { kCastleBox(id); });
}
// この 国から 出陣できる 支城（国の なかの 支城と、となりの てきの 国に ある みかたの 支城）
function sortieBranches(pid) {
  return Object.keys(KS.castles || {}).filter(function (id) {
    var C0 = KS.castles[id]; if (C0.owner !== KS.player || !canBranchAttack(KS, id) || !branchTargets(KS, id).length) return false;
    return C0.prov === pid || (KS.provs[C0.prov].owner !== KS.player && (ADJ[pid] || []).indexOf(C0.prov) >= 0);
  });
}
// どの 城から 出陣するか
function kSortieBox(pid) {
  var P = KS.provs[pid], canMain = !didCmd(P, 'attack') && P.units.length && ADJ[pid].some(function (q) { return KS.provs[q].owner !== KS.player; });
  function offs(at) { var l = officersOf(KS, KS.player).filter(function (o) { return o.at === at; }); return l.length ? '👤' + l.map(function (o) { return o.name + (offBusy(KS, o) ? '✓' : ''); }).join('・') : '👤 家臣なし'; }
  var h = '<p class="small">出陣する 城を えらぶ → せめる 城を えらぶ → ほかの 城から 応援を だすか きめる。大将は 出陣する 城と 応援の 城に いる 家臣から。</p><div class="koffs">' +
    '<button class="koff" data-m="1"' + (canMain ? '' : ' disabled style="opacity:.5"') + '><b>🏯 ' + castleNameOf(KS, pid) + '（本城）</b><small>' + menStr(menTotal(P.units)) + '（' + P.units.length + '隊）・' + offs(pid) + (canMain ? '' : '<br>この きせつは もう 出陣した') + '<br>国の 出陣の めいれいを つかう</small></button>';
  sortieBranches(pid).forEach(function (id) { var C0 = KS.castles[id];
    h += '<button class="koff" data-b="' + id + '"><b>🏰 ' + brName(id) + '（' + PROV_BY[C0.prov].name + 'の 支城）</b><small>' + menStr(menTotal(C0.units)) + '（' + C0.units.length + '隊）・' + offs(id) + '<br>めいれいは つかわない（支城 ごとに きせつ 1かい）</small></button>'; });
  h += '</div>';
  kModal('⚔ どの 城から 出陣？', h, [{ label: 'やめる', cls: 'act sub', fn: kCloseModal }]);
  [].forEach.call($('kBody').querySelectorAll('[data-m]'), function (e) { e.onclick = function () { SFX.tap(); kCloseModal(); kMode = 'attack'; kUpdate(); }; });
  [].forEach.call($('kBody').querySelectorAll('[data-b]'), function (e) { e.onclick = function () { SFX.tap(); kBranchAtkBox(e.dataset.b); }; });
}
// 支城から 調略する 国を えらぶ
function kBranchSchemeBox(id) {
  var C0 = KS.castles[id], list = branchSchemeTargets(KS, id);
  var h = '<p class="small"><b>' + brName(id) + '</b>から 調略する。はたらくのは この 城に いる 家臣（智）。支城 ごとに きせつ 1かい、国の めいれいは つかわない。</p><div class="koffs">';
  list.forEach(function (q) { var o = KS.provs[q].owner, R0 = REL_INFO[relationOf(KS, KS.player, o)];
    h += '<button class="koff" data-q="' + q + '"><b>' + PROV_BY[q].name + '（' + CLANS[o].name + '）</b><small><span class="krel" style="background:' + R0.col + '">' + R0.icon + ' ' + R0.name + '</span>　' + CLANS[o].lord + '・' + provsOf(KS, o).length + 'りょうち</small></button>'; });
  h += '</div>';
  kModal('🦊 ' + brName(id) + 'から 調略', h, [{ label: 'もどる', cls: 'act sub', fn: function () { kCastleBox(id); } }]);
  [].forEach.call($('kBody').querySelectorAll('[data-q]'), function (e) { e.onclick = function () { SFX.tap(); kSchemeBox(C0.prov, e.dataset.q, id); }; });
}
// 支城から せめる 城を えらぶ
function kBranchAtkBox(id) {
  var C0 = KS.castles[id], list = branchTargets(KS, id);
  var h = '<p class="small"><b>' + brName(id) + '</b>の 守備兵（' + menStr(menTotal(C0.units)) + '・' + C0.units.length + '隊）で せめる。支城からの 出陣は きせつに 1かい（国の めいれいは つかわない）。</p><div class="koffs">';
  list.forEach(function (t, i) {
    var own = t.owner, st = tgtStrength(KS, t), du = t.castle ? KS.castles[t.castle].units : KS.provs[t.to].units;
    h += '<button class="koff" data-t="' + i + '"><b>' + (t.castle ? '🏰 ' : '🏯 ') + targetName(KS, t) + '</b><small>' + CLANS[own].name + '・' + menStr(menTotal(du)) + (t.to === C0.prov ? '・おなじ 国（すぐ ちかく）' : '・' + (routeOf(C0.prov, t.to) ? { land: '🛤陸路', pass: '⛰峠道', sea: '⛵海路' }[routeOf(C0.prov, t.to).type] || '' : '')) + (isAlly(KS, KS.player, own) ? '・🤝同盟中' : '') + '</small></button>';
  });
  h += '</div>';
  kModal('⚔ ' + brName(id) + 'から 出陣', h, [{ label: 'もどる', cls: 'act sub', fn: function () { kCastleBox(id); } }]);
  [].forEach.call($('kBody').querySelectorAll('[data-t]'), function (e) { e.onclick = function () { SFX.tap(); var t = list[+e.dataset.t]; kAttackBox(C0.prov, t.to, t.castle, id); }; });
}
function kGarrisonBox(id, dir, pid, back) {
  back = back || function () { kCastleBox(id); };
  var C0 = KS.castles[id], P = KS.provs[pid], src = dir === 'in' ? P.units : C0.units, nm = pid === C0.prov ? '本城' : PROV_BY[pid].name;
  kModal(dir === 'in' ? brName(id) + 'に 守備兵を いれる' : brName(id) + 'から ' + nm + 'へ もどす', '<p class="small">' + (dir === 'in' ? nm + 'の 軍から えらぶ（支城は 8たいまで）' : '支城の 守備兵から えらぶ') + '</p>' + pickerHtml(src, 0), [
    { label: 'けってい', cls: 'act', fn: function () { var ids = pickerUids(src); kSnap('守備兵'); var r = dir === 'in' ? garrison(KS, id, ids, [], pid) : garrison(KS, id, [], ids, pid); if (!r.ok) { kUndoStack.pop(); banner(r.msg, 1400); return; } kSave(); kUpdate(); back(); } },
    { label: 'やめる', cls: 'act sub', fn: function () { back(); } }]);
  pickerBind();
}
// ---- 出陣 ----
function kAttackBox(from, to, castleId, src) {
  var B = KS.provs[to], p = PROV_BY[to], tgt = { to: to, castle: castleId || null }, loc = src || from;
  var A = src ? { units: KS.castles[src].units } : KS.provs[from], fromNm = src ? brName(src) + '（' + PROV_BY[from].name + 'の 支城）' : castleNameOf(KS, from) + '（' + PROV_BY[from].name + 'の 本城）';
  var C0 = castleId ? KS.castles[castleId] : null, own = C0 ? C0.owner : B.owner, dU = C0 ? C0.units : B.units, rel = C0 ? reliefOf(KS, castleId) : [];
  var co = coSources(KS, loc, to, castleId || null);
  var need = needDays(KS, src ? makeBranchBattle(KS, src, to, A.units.map(function (u) { return u.uid; }), castleId || null) : makeBattle(KS, from, to, A.units.map(function (u) { return u.uid; }), castleId || null));
  var tplKana = CASTLES[castleIndexOf(C0 ? brTpl(castleId) : p.castle)].kana;
  function rtTxt(pv) { if (pv === to) return 'おなじ 国'; var rq = routeOf(pv, to); return rq ? (rq.type === 'sea' ? '⛵海路' : rq.type === 'pass' ? '⛰峠道' : '🛤陸路') : ''; }
  var body = '<p>⚔ <b>' + fromNm + '</b><br>→ <b>' + targetName(KS, tgt) + '</b>（' + tplKana + '）</p>' +
    (src && from === to ? '<p class="small kroute">🏰 ' + brName(src) + 'から おなじ 国の ' + (C0 ? '支城' : '本城') + 'へ すぐ せめかかる（国ざかいを こえない）。</p>' : '') +
    (C0 && !src ? '<p class="small kroute">🏯 ' + (from === to ? 'じぶんの 国に のこる てきの 支城。' : p.name + 'に はいる 道を まもる 支城。おとすと ' + castleNameOf(KS, to) + '（本城）を せめられる。') + '</p>' : '') +
    (from !== to ? kRouteHtml(from, to) : '') +
    (isAlly(KS, KS.player, own) ? '<p class="r"><b>⚠ ' + CLANS[own].name + 'とは 同盟中！ せめると 同盟が きれます。</b></p>' : '') +
    '<p class="small">まもり：' + CLANS[own].lord + '　へい ' + menStr(menTotal(dU)) + '（' + unitSummary(dU) + '）' + (rel.length ? '<br>＋ 本城からの 後詰め ' + menStr(menTotal(rel)) : '') + '</p>' +
    (C0 ? '' : '<p class="small">てきの 城主：' + offTxt(officerAt(KS, to)) + '</p>') +
    '<h4>① つれていく へい（' + (src ? brName(src) : castleNameOf(KS, from)) + '）</h4>' + pickerHtml(A.units, 'all') +
    '<h4>② ほかの 城から 応援</h4>' + (co.length ? '<p class="small">おくる 城だけ へいを えらぶ（0なら おくらない）。応援の 城に いる 家臣も 大将に できる。' + (co.some(function (c) { return !c.castle; }) ? '本城からの 応援は その 国の 出陣の めいれいを つかう。' : '') + '</p>' +
      co.map(function (c, i) { var offs = officersOf(KS, KS.player).filter(function (o) { return o.at === c.loc; });
        return '<details class="kco"' + (i < 0 ? ' open' : '') + '><summary>' + (c.castle ? '🏰 ' : '🏯 ') + c.name + ' <small>' + menStr(menTotal(c.units)) + '・' + rtTxt(c.castle ? KS.castles[c.castle].prov : c.from) + (offs.length ? '・👤' + offs.map(function (o) { return o.name; }).join('・') : '') + '</small> <b id="kcoN' + i + '"></b></summary>' + pickerHtml(c.units, 0, 'co' + i + '_') + '</details>'; }).join('')
      : '<p class="small">応援に だせる 城は ない（おなじ 城を せめられる みかたの 城が ない・もう 出陣した）。</p>') +
    '<h4>③ 大将</h4><div class="koffpick">⚔ 大将（武）：<select id="kAtkOff"></select><small id="kAtkOffP"></small></div><p class="small" id="kAtkOffW"></p>' +
    '<h4>🍙 兵糧（なん日ぶん もっていくか）</h4><p class="small">めやす <b>' + need + '日</b>（' + (from !== to ? '国ざかいから 城まで すすんで せめる' : '城を せめる') + '）。へいが おおいほど 1日の 量が おおい。つきると ひきあげる。</p>' +
    '<div class="kamt"><input type="range" id="kFood" min="5" max="' + Math.max(need * 2, 30) + '" step="1" value="' + need + '"><b id="kFoodV"></b></div><p id="kFoodW" class="small"></p>' +
    '<div id="kOdds" class="kodds"></div>' +
    '<p class="small">のこした へいは それぞれの 城を まもる。生きのこった へいは もとの 城へ もどる（本城を おとしたら そこに はいる）。</p>';
  function coUnits(c, i) { var qi = pickerUids(c.units, 'co' + i + '_'), pv = c.castle ? KS.castles[c.castle].prov : c.from; return c.units.filter(function (u) { return qi.indexOf(u.uid) >= 0 && !(pv !== to && seaRoute(pv, to) && u.type === 'kiba'); }); }
  // 大将の こうほ：出陣する 城に いる 家臣 ＋ へいを だす 応援の 城に いる 家臣
  function genList() {
    var at = {}; at[loc] = '';
    co.forEach(function (c, i) { if (coUnits(c, i).length) at[c.loc] = c.castle ? brName(c.castle) : castleNameOf(KS, c.from); });
    return freeOfficers(KS, KS.player).filter(function (o) { return at[o.at] !== undefined; }).map(function (o) { return { o: o, via: at[o.at] }; }).sort(function (a, b) { return b.o.st[0] - a.o.st[0]; });
  }
  function refreshGen() {
    var sel = $('kAtkOff'), cur = sel.value, gl = genList(), lordHere = !src ? officerAt(KS, from) : null;
    if (!gl.some(function (g) { return g.o.id === cur; })) cur = lordHere && gl.some(function (g) { return g.o === lordHere; }) ? lordHere.id : (gl[0] ? gl[0].o.id : '');
    sel.innerHTML = gl.map(function (g) { return '<option value="' + g.o.id + '"' + (g.o.id === cur ? ' selected' : '') + '>' + (premiumP(g.o.st[0]) > 0 ? '★' : '') + g.o.name + '（武' + g.o.st[0] + '）' + (g.via ? '・応援：' + g.via : g.o.prov === loc ? '・城主' : '') + '</option>'; }).join('') + '<option value=""' + (cur ? '' : ' selected') + '>侍大将（家臣なし）</option>';
    var nHere = officersOf(KS, KS.player).filter(function (o) { return o.at === loc; }).length;
    $('kAtkOffW').innerHTML = gl.length ? '' : (nHere ? 'この 城の 家臣は この きせつ もう はたらいた。' : 'この 城には 家臣が いない。') + (co.length ? '応援の 城から へいを だすと、そこの 家臣を 大将に できる。' : '👥家臣から 移動させよう。');
  }
  function odds() {
    var ids = pickerUids(A.units), us = A.units.filter(function (u) { return ids.indexOf(u.uid) >= 0 && !(from !== to && seaRoute(from, to) && u.type === 'kiba'); });
    var st = strength(us) * (from !== to ? routeMult(from, to) : 1), nf = 1;
    co.forEach(function (c, i) { var qs = coUnits(c, i), pv = c.castle ? KS.castles[c.castle].prov : c.from; if ($('kcoN' + i)) $('kcoN' + i).textContent = qs.length ? '→ ' + menStr(menTotal(qs)) : ''; if (qs.length && !(c.castle && pv === from && !src)) nf++; us = us.concat(qs); st += strength(qs) * (pv !== to ? routeMult(pv, to) : 1); });
    refreshGen();
    var ao0 = offPicked('kAtkOff'); $('kAtkOffP').textContent = ' ' + (offPremTxt(ao0, 0) ? offPremTxt(ao0, 0).replace('大成功', '奇襲') : '');
    var r = st * warMult(ao0) * (nf > 1 ? 1 + 0.08 * (nf - 1) : 1) / tgtStrength(KS, tgt), t = r >= 1.3 ? ['かなり ゆうり', 'g'] : r >= 1.0 ? ['ゆうり', 'g'] : r >= 0.8 ? ['ごかく', 'y'] : r >= 0.6 ? ['ふり', 'r'] : ['とても ふり', 'r'];
    var left = A.units.length - A.units.filter(function (u) { return ids.indexOf(u.uid) >= 0; }).length;
    $('kOdds').innerHTML = 'かちめ：<b class="' + t[1] + '">' + t[0] + '</b>（' + us.length + '隊・' + menStr(menTotal(us)) + (nf > 1 ? '・' + nf + 'か所から' : '') + '）' +
      (left === 0 && (src || isFrontier(KS, from)) ? '<br><span class="r">⚠ ' + (src ? brName(src) : PROV_BY[from].name) + 'が からっぽに なる！ てきに とられるかも</span>' : '　るすばん ' + left + '隊');
    var fd = +$('kFood').value, gold = KS.clans[KS.player].gold, locs = [loc];
    co.forEach(function (c, i) { if (coUnits(c, i).length) locs.push(c.loc); });
    var rp = ricePlan(KS, locs, menTotal(us) * fd * RICE_PER_MAN), fc = rp.gold;
    $('kFoodV').innerHTML = fd + '日<br><small>🍙' + rp.koku.toLocaleString('ja-JP') + '石</small>';
    $('kFoodW').innerHTML = (fd < need ? '<span class="r">⚠ めやす（' + need + '日）より すくない！ とちゅうで ひきあげるかも</span><br>' : '') +
      '🏯 城の 蔵から <b>' + rp.fromStore.toLocaleString('ja-JP') + '石</b>' + (rp.take.length ? '（' + rp.take.map(function (t) { return locName(KS, t[0]) + ' ' + t[1].toLocaleString('ja-JP'); }).join('・') + '）' : '') +
      (rp.short ? '<br>たりない <b>' + rp.short.toLocaleString('ja-JP') + '石</b>は いそいで かう 💰' + kan(fc) + (fc > gold ? '　<span class="r">お金が たりない</span>' : '') : '　お金は いらない');
    $('kFight').disabled = $('kAuto').disabled = ids.length === 0 || fc > gold;
  }
  kModal('出陣', body, [
    { label: '⚔ 合戦する', cls: 'act', id: 'kFight', fn: function () { kLaunch(from, to, 'fight', castleId || null, coPick(), foodPick(), offPicked('kAtkOff'), src); } },
    { label: '🎲 おまかせ', cls: 'act sub', id: 'kAuto', fn: function () { kLaunch(from, to, 'auto', castleId || null, coPick(), foodPick(), offPicked('kAtkOff'), src); } },
    { label: 'やめる', cls: 'act sub', fn: kCloseModal }
  ]);
  function foodPick() { return +$('kFood').value; }
  function coPick() { return co.map(function (c, i) { var u = pickerUids(c.units, 'co' + i + '_'); return c.castle ? { castle: c.castle, uids: u } : { from: c.from, uids: u }; }).filter(function (e) { return e.uids.length; }); }
  pickerBind(odds); $('kFood').oninput = odds; $('kAtkOff').onchange = odds; odds();
}
var CMD_NAME = { attack: '出陣', recruit: '徴兵', develop: '内政', move: '移動', scheme: '調略' };
function kRouteHtml(from, to) {
  var rt = routeOf(from, to); if (!rt) return '';
  var t = rt.type === 'sea' ? '⛵ <b>海路</b>：船で わたって 上陸する。<b>騎馬は つれていけない</b>（のこる）。攻め手 すこし ふり。'
        : rt.type === 'pass' ? '⛰ <b>峠道（' + rt.name + '）</b>：けわしい 山の ほそい 道を こえる。守りが すこし ゆうり。'
        : '🛤 <b>陸路</b>：ひらけた 道で せめこむ。';
  return '<p class="small kroute">' + t + '</p>';
}
function kLaunch(from, to, how, castleId, extra, food, gen, src) {
  var ids = pickerUids(src ? KS.castles[src].units : KS.provs[from].units); if (!ids.length) return;
  kCloseModal(); kMode = 'idle';
  var b = src ? makeBranchBattle(KS, src, to, ids, castleId || null, extra || []) : makeBattle(KS, from, to, ids, castleId || null, extra || []);
  if (food) {   // 兵糧は 城の 蔵から（出陣する 城 → 応援の 城）。たりない ぶんだけ お金
    b.foodDays = food; b.foodCost = 0;
    var rl = [src || from].concat((extra || []).map(function (e) { return e.castle || e.from; })), rp = ricePlan(KS, rl, menTotal(b.atkUnits) * food * RICE_PER_MAN);
    if (!applyRicePlan(KS, KS.player, rp)) { banner('お金が たりない', 1200); return; }
    if (rp.fromStore) logC(KS, '城の 蔵から 兵糧 ' + rp.fromStore.toLocaleString('ja-JP') + '石を もちだした' + (rp.short ? '（たりない ' + rp.short.toLocaleString('ja-JP') + '石は 💰' + kan(rp.gold) + 'で かった）' : ''), 'sys');
    else if (rp.gold) logC(KS, '兵糧 ' + rp.short.toLocaleString('ja-JP') + '石を 💰' + kan(rp.gold) + 'で かった', 'sys');
  }
  if (gen) {   // えらんだ 大将。武が 高いと 奇襲（てきの 守りが はじめから よわる）
    b.atkOff = gen.id; useOfficer(KS, gen.id);
    if (cRand(KS) < premiumP(gen.st[0])) { b.defUnits.forEach(function (u) { u.hp = Math.max(1, u.hp - 1.5); }); b.kishu = true; logC(KS, '★ ' + gen.name + 'の 奇襲が きまった！ てきの 守りが みだれた', 'good'); setTimeout(function () { banner('★ ' + gen.name + 'の 奇襲！', 1500); }, 300); }
  }
  b.playerSide = 'atk'; kUndoClear();
  startBattle(KS, b); kSave();
  logC(KS, (b.atkOff ? KS.officers[b.atkOff].name : CLANS[KS.player].lord) + 'が ' + b.castleName + 'へ 出陣！（兵糧 ' + b.foodDays + '日ぶん・' + menStr(menTotal(b.atkUnits)) + (b.fronts ? '・' + b.fronts.map(function (f) { return f.castle ? brName(f.castle) : PROV_BY[f.from].name; }).join('と ') + 'から 同時に' : src ? '・' + brName(src) + 'から' : '') + '）', 'good');
  if (how === 'auto' || !b.defUnits.length) kAutoBattle(b);
  else kFightBattle(b);
}

// ---- 合戦（じっさいに たたかう） ----
function kFightBattle(b) {
  var pSide = b.playerSide, cSide = pSide === 'atk' ? 'def' : 'atk';
  var pUnits = pSide === 'atk' ? b.atkUnits : b.defUnits, cUnits = pSide === 'atk' ? b.defUnits : b.atkUnits;
  var cClan = pSide === 'atk' ? b.defClan : b.atkClan;
  var ao = b.atkOff ? KS.officers[b.atkOff] : null, dO = b.defOff ? KS.officers[b.defOff] : null;
  var gens = {}, sm = { atk: warMult(ao), def: warMult(dO) * (1 + (offI(dO) - 50) / 400) };
  gens.atk = { name: ao ? ao.name : CLANS[b.atkClan].lord + 'の 侍大将' }; gens.def = { name: dO ? dO.name : (b.defClan ? CLANS[b.defClan].lord + 'の 侍大将' : '城代') };
  var pLead = (pSide === 'atk' ? ao : dO), cLead = (pSide === 'atk' ? dO : ao);
  var pChar = pLead && pLead.lord ? portraitChar(KS.player) : (pLead ? 'clan:' + KS.player : KS.face);
  var cChar = cLead && cLead.lord ? portraitChar(cClan) : 'clan:' + cClan;
  var env = battleEnv(KS, b);
  G = newGame({ mapIndex: castleIndexOf(b.castle), sizeIndex: battleSizeIndex(b), mapSeed: battleSeed(KS, b.to), playerSide: pSide,
                playerChar: pChar, cpuChar: cChar, playerUnits: pUnits, cpuUnits: cUnits, difficulty: KS.difficulty,
                generals: gens, sideMult: sm, campaign: true, env: env, fortLv: b.fortLv || 0, food: b.foodDays || 0, defFood: b.defFood, ruin: b.ruin });
  G.kBattle = b;
  var intro = (b.castleName || castleNameOf(KS, b.to)) + 'の 合戦！ ' + (pSide === 'atk' ? 'しろを せめろ' : 'しろを まもれ') + (G.food !== undefined ? '（せめての 兵糧 ' + b.foodDays + '日ぶん。つきたら ひきあげ）' : '（' + G.turnLimit + 'ターン）');
  if (env) {
    intro += '　' + env.fromName + 'の 軍が ' + env.fromDir + 'の ' + (env.entryKm ? '国ざかい（城まで 約' + Math.round(env.entryKm) + 'km）' : 'ほう') + 'から ' + (env.route === 'sea' ? '海路で 上陸して' : env.route === 'pass' ? env.routeName + 'を こえて' : '') + ' せめこむ。本丸に はいれば かち。';
    (env.fronts || []).forEach(function (f) { intro += f.name + 'の 軍も ' + f.dir + 'から ' + (f.sea ? '海路で ' : '') + 'せめこむ。'; });
    if ((env.defFronts || []).length) intro += '守りの 援軍が ' + env.defFronts.map(function (f) { return f.name; }).join('・') + 'から かけつける。';
    if (b.fortLv) intro += '城は 改築 Lv' + b.fortLv + '（石垣・門が かたい）。';
    if (b.ruin) intro += '城は まだ こわれた まま（石垣・門が よわい）。';
    intro += env.escapes.length ? '守りの 退き口：' + env.escapes.map(function (e) { return e.name + '（' + e.dir + '）'; }).join('・') : '守りに にげ場は ない（籠城）';
  }
  beginBattle(intro);
  kSaveBattle();
}
function kBattleFinished() {
  var b = G.kBattle, pSide = G.playerSide;
  kClearBattle();
  var res = { winner: G.winner, atkSurv: survivors(G, 'atk'), defSurv: survivors(G, 'def'), atkFled: escaped(G, 'atk'), defFled: escaped(G, 'def'), defFood: G.defFood };
  // 攻めての のこり 兵糧（人日 → 石）。とどいて いない 小荷駄の 荷も
  if (G.food !== undefined) { var cv = 0; G.units.forEach(function (u) { if (u.type === 'konida' && u.side === 'atk' && u.hp > 0 && !u.delivered) cv += u.cargo || 0; }); res.atkFood = (G.food + cv) * RICE_PER_MAN; res.foodOut = G.food <= 0; }
  // 大将を うしなった がわは、のこりの へいも すこし にげる
  G = null;
  $('resultBox').classList.remove('on');
  kFinishBattle(b, res);
}
function fledStr(list) {
  var by = {}; list.forEach(function (u) { by[u.to] = (by[u.to] || 0) + menTotal([u]); });
  return Object.keys(by).map(function (k) { return (PROV_BY[k] ? PROV_BY[k].name : k) + 'へ ' + menStr(by[k]); }).join('、');
}
function kAutoBattle(b) {
  kClearBattle();
  var res = autoResolve(KS, b);
  kFinishBattle(b, res, true);
}
function kFinishBattle(b, res, auto) {
  var pSide = b.playerSide || (b.defClan === KS.player ? 'def' : 'atk');
  var myFled = (pSide === 'atk' ? res.atkFled : res.defFled) || [], enFled = (pSide === 'atk' ? res.defFled : res.atkFled) || [];
  var before = menTotal(pSide === 'atk' ? b.atkUnits : b.defUnits), after = menTotal(pSide === 'atk' ? res.atkSurv : res.defSurv);
  var eBefore = menTotal(pSide === 'atk' ? b.defUnits : b.atkUnits), eAfter = menTotal(pSide === 'atk' ? res.defSurv : res.atkSurv);
  var fledTxt = (myFled.length ? '<br>みかたの 退却：' + fledStr(myFled) : '') + (enFled.length ? '<br>てきの 退却：' + fledStr(enFled) : '');
  applyBattle(KS, b, res); kSave();
  openMap();
  var win = res.winner === pSide, nm = b.castleName || PROV_BY[b.to].name;
  var txt = pSide === 'atk' ? (win ? nm + 'を 攻め落とした！' : nm + 'を 落とせなかった…') : (win ? nm + 'を まもりきった！' : nm + 'を うばわれた…');
  (win ? SFX.win : SFX.lose)();
  var img = SPR[(win ? charById(KS.face).win : charById(KS.face).lose) || 'fute_joy'];
  kModal(win ? 'しょうり！' : 'はいぼく…', '<div class="kres"><img src="' + img + '" alt=""><p><b>' + txt + '</b>' + (auto ? '（おまかせ）' : '') + '</p>' +
    '<p class="small">みかた ' + menStr(before) + ' → ' + menStr(after) + '　／　てき ' + menStr(eBefore) + ' → ' + menStr(eAfter) + fledTxt + (res.prisMen ? '<br>' + (pSide === 'atk' ? '🙇 てきの へい ' + menStr(res.prisMen) + 'が 降参して みかたに くわわった' : '🙇 みかたの へい ' + menStr(res.prisMen) + 'が てきに 降参した') : '') +
    (res.killMen ? '<br>🙇 ' + (res.killSide === pSide ? 'たおした てきの へい ' + menStr(res.killMen) + 'が 降参して みかたに くわわった' : 'やぶれた みかたの へい ' + menStr(res.killMen) + 'が てきに くだった') : '') +
    (res.volMen ? '<br>🔥 ' + (res.volSide === pSide ? res.streak + '連勝！ うわさを きいて 志願兵 ' + menStr(res.volMen) + 'が みかたに くわわった' : 'てきは ' + res.streak + '連勝。志願兵 ' + menStr(res.volMen) + 'が てきに くわわった') : '') +
    (res.lootRice ? '<br>🍙 ' + (pSide === 'def' ? 'にげた てきの 兵糧 ' + res.lootRice + '石を てに いれた（城の 蔵へ）' : 'ひきあげる とき 兵糧 ' + res.lootRice + '石を てきに うばわれた') : '') +
    (res.reinBack ? '<br>🚩 援軍 ' + res.reinBack + '隊は もとの 城へ もどった' : '') +
    (b.castleId && win && pSide === 'atk' && res.keptN ? '<br>🏯 ' + b.castleName + 'に ' + res.keptN + '隊を のこし' + (res.backN ? '、' + res.backN + '隊は ' + (b.srcCastle ? brName(b.srcCastle) : PROV_BY[b.from].name) + 'へ もどった' : 'た') : '') + '</p></div>',
    [{ label: 'つぎへ', cls: 'act', fn: function () { kCloseModal(); if (b.castleId && win && pSide === 'atk' && res.backUids && KS.provs[b.from].owner === KS.player && KS.castles[b.castleId].owner === KS.player) kDeployBox(b.castleId, b.from, res.backUids, kAfterBattle); else kAfterBattle(); } }]);
}
function kAfterBattle() {
  if (KS.over) return kGameOver();
  if (KS.phase === 'cpu') kRunCpu();
  else kUpdate();
}
function kResumeBattle(b) {
  // 中断していた 合戦：ほぞんが あれば その ばめんから つづける
  var pSide = b.playerSide || (b.defClan === KS.player ? 'def' : 'atk');
  b.playerSide = pSide;
  var o = kLoadBattle(b);
  if (o) {
    var me = o.g.units.filter(function (u) { return u.side === pSide && u.hp > 0 && !u.fled && u.type !== 'taisho' && u.type !== 'konida'; }).length;
    var en = o.g.units.filter(function (u) { return u.side !== pSide && u.hp > 0 && !u.fled && u.type !== 'taisho' && u.type !== 'konida'; }).length;
    kModal('合戦の とちゅう', '<p>' + (b.castleName || PROV_BY[b.to].name) + 'での 合戦が とちゅうでした。<br>' + (o.g.over ? '<b>' + (o.g.winner === pSide ? 'かち' : 'まけ') + '</b>で おわって います。</p>' : '<b>' + o.g.turn + '日め</b>の ばめんから つづけられます。</p>') + '<p class="small">のこっている へい：みかた ' + me + '隊／てき ' + en + '隊</p>', [
      { label: '⚔ つづきから', cls: 'act', fn: function () { kCloseModal(); kResumeFight(b, o); } }
    ]);
    return;
  }
  // ほぞんが ない（まえの 版の データなど）：合戦中に よんだ 援軍は もとの 城へ もどして、はじめから
  if (returnMid(KS, b)) kSave();
  kModal('合戦の とちゅう', '<p>' + PROV_BY[b.to].name + 'での 合戦が とちゅうでした。</p>', [
    { label: '⚔ 合戦する', cls: 'act', fn: function () { kCloseModal(); kFightBattle(b); } },
    { label: '🎲 おまかせ', cls: 'act sub', fn: function () { kCloseModal(); kAutoBattle(b); } }
  ]);
}
function kResumeFight(b, o) {
  G = o.g; G.kBattle = b;
  if (G.over) { LOG = o.log || []; return kBattleFinished(); }   // けっかの 画面で とじていた
  beginBattle('―― ' + G.turn + '日めの つづきから ――', true);
  LOG = (o.log || []).concat(LOG); renderLog(); updateHud();
}

// ---- 徴兵 ----
// 担当の 家臣を えらぶ（stat：0=武 1=政 2=智）。この きせつ まだ はたらいて いない 家臣だけ
var STAT_NAME = ['武', '政', '智'];
function offPickHtml(id, stat, pid, label) {
  var isC = !!(pid && KS.castles && KS.castles[pid]);   // 支城：その 城に いる 家臣だけ
  var fr = (isC ? freeOfficers(KS, KS.player).filter(function (o) { return o.at === pid; }) : pid ? freeHere(KS, KS.player, pid) : freeOfficers(KS, KS.player)).sort(function (a, b) { return b.st[stat] - a.st[stat]; });
  var here = pid && !isC ? officerAt(KS, pid) : null, def = here && !offBusy(KS, here) ? here.id : (fr[0] ? fr[0].id : '');
  if (!fr.length) { var n0 = isC ? officersOf(KS, KS.player).filter(function (o) { return o.at === pid; }).length : pid ? officersHere(KS, KS.player, pid).length : 0;
    return '<p class="small r">' + label + '：' + (pid && !n0 ? (isC ? brName(pid) : PROV_BY[pid].name) + 'には 家臣が いない。👥家臣から この 城へ 移動させよう（城主なしでも できるが ふつうの 結果）' : 'この 城の 家臣は この きせつ みんな はたらいた') + '</p>'; }
  return '<div class="koffpick">' + label + '：<select id="' + id + '">' + fr.map(function (o) {
    return '<option value="' + o.id + '"' + (o.id === def ? ' selected' : '') + '>' + (premiumP(o.st[stat]) > 0 ? '★' : '') + o.name + '（' + STAT_NAME[stat] + o.st[stat] + '）' + (o.prov === pid ? '・城主' : o.at !== pid ? '・' + locName(KS, o.at) : '') + '</option>'; }).join('') + '</select>' +
    '<small id="' + id + 'P"></small></div>';
}
function offPicked(id) { var el = $(id); return el && el.value ? KS.officers[el.value] : null; }
function offPremTxt(o, stat) { var p = o ? premiumP(o.st[stat]) : 0; return p > 0 ? '★大成功 ' + Math.round(p * 100) + '%' : ''; }
function kRecruitBox(pid, cs, back) {
  pid = pid || kSel; cs = cs || null;
  var P = cs ? KS.castles[cs] : KS.provs[pid], gold = KS.clans[KS.player].gold, pts = {}, CAP = cs ? 8 : PROV_CAP, where = cs ? brName(cs) : PROV_BY[pid].name;
  var done = function () { kCloseModal(); kSave(); kUpdate(); if (back) back(); };
  var h = offPickHtml('kRecOff', 1, cs || pid, '🧑‍💼 担当（政）') +
    '<p class="small">お金 💰' + kan(gold) + '　' + (cs ? 'この 城' : 'この国') + 'の 隊 ' + P.units.length + '/' + CAP + '　1人 から やとえる。へっている 隊が あれば さきに うめる（補充）。大成功だと 2わり おおく あつまる。</p>' +
    '<div class="kodds">🪖 いま ' + where + 'の へい：<b>' + menStr(menTotal(P.units)) + '</b>（' + P.units.length + '隊）' + (P.units.length ? '<br><small>' + unitSummary(P.units) + '</small>' : '') + '</div>';
  BUY_ORDER.forEach(function (t) {
    var T = UNIT_TYPES[t];
    if (t === 'teppo' && !teppoOk(KS)) { h += '<div class="arow"><span class="uic blue" style="opacity:.4">' + T.ch + '</span><span class="uname"><b style="color:#aaa">' + T.name + '</b><small>' + TEPPO_YEAR + '年に 伝来するまで やとえない</small></span></div>'; return; }
    var cur = P.units.filter(function (u) { return u.type === t; });
    h += '<div class="arow kbuy"><span class="uic blue">' + T.ch + '</span><span class="uname"><b>' + T.name + '</b>' + (cur.length ? '<small style="color:#2a6a2a"><b>　いま ' + menTotal(cur).toLocaleString('ja-JP') + menUnit(t) + '（' + cur.length + '隊）</b></small>' : '<small>　いま 0</small>') + '<small id="rcp_' + t + '"></small></span>' +
      '<div class="kctl"><button class="pm big sub0" data-t="' + t + '" data-d="0" title="0に もどす">0</button><button class="pm big minus" data-t="' + t + '" data-d="-' + T.men + '">−隊</button><button class="pm big minus" data-t="' + t + '" data-d="-10">−10</button>' +
      '<button class="pm" data-t="' + t + '" data-d="-1">－</button><input class="rcin" type="number" inputmode="numeric" min="0" step="1" id="rc_' + t + '" value="0"><button class="pm" data-t="' + t + '" data-d="1">＋</button>' +
      '<button class="pm big" data-t="' + t + '" data-d="10">+10</button><button class="pm big" data-t="' + t + '" data-d="' + T.men + '">+隊</button></div></div>';
  });
  h += '<div id="kCost" class="kodds"></div>';
  function off() { return offPicked('kRecOff') || undefined; }
  function upd() {
    var o = off(), pl = planRecruit(KS, pid, pts, o, cs), menAdd = 0;
    for (var t in pts) menAdd += pts[t] || 0;
    if ($('kRecOffP')) $('kRecOffP').textContent = ' ' + offPremTxt(o, 1);
    BUY_ORDER.forEach(function (t) {
      var el = $('rc_' + t); if (el && document.activeElement !== el) el.value = pts[t] || 0;
      var pe = $('rcp_' + t); if (pe) pe.textContent = '1' + menUnit(t) + ' 💰' + (Math.round(recruitCost(KS, pid, t, o) * KAN / UNIT_TYPES[t].men * 10) / 10) + '貫';
    });
    $('kCost').innerHTML = 'やとった あと：<b>' + menStr(menTotal(P.units) + Math.round(menAdd)) + '</b>（' + (P.units.length + pl.newN) + '隊）<br>ごうけい 💰<b>' + kan(pl.cost) + '</b>（' + Math.round(menAdd).toLocaleString('ja-JP') + '人' + (pl.fill ? '・補充あり' : '') + (pl.newN ? '・新しい 隊 ' + pl.newN : '') + '）　のこり 💰' + kan(gold - pl.cost) +
      (P.units.length + pl.newN > CAP ? '<br><span class="r">隊が ' + CAP + 'を こえる</span>' : '') + (pl.cost > gold ? '<br><span class="r">お金が たりない</span>' : '');
    $('kRecOk').disabled = (!pl.fill && !pl.newN) || pl.cost > gold || P.units.length + pl.newN > CAP;
    Array.prototype.forEach.call($('kBody').querySelectorAll('.pm'), function (b) { var t = b.getAttribute('data-t'), d = +b.getAttribute('data-d'); if (d <= 0) b.disabled = !(pts[t] > 0); });
  }
  kModal('徴兵（' + where + '）', h, [
    { label: '🪖 やとう', cls: 'act', id: 'kRecOk', fn: function () { var o = off(); kSnap('徴兵'); var r = recruitPts(KS, pid, pts, o ? o.id : null, cs); if (!r.ok) { kUndoStack.pop(); banner(r.msg, 1200); return; }
        logC(KS, (r.off ? r.off + 'が ' : '') + where + 'で へいを ' + r.men.toLocaleString('ja-JP') + '人 やとった' + (r.fill ? '（補充あり）' : ''), 'good');
        if (r.premium) { logC(KS, '★ 大成功！ ' + r.off + 'の よびかけで さらに ' + r.premium.toLocaleString('ja-JP') + '人 あつまった', 'good'); banner('★ 大成功！ ＋' + r.premium + '人', 1500); }
        done(); } },
    { label: 'やめる', cls: 'act sub', fn: back || kCloseModal }
  ]);
  Array.prototype.forEach.call($('kBody').querySelectorAll('.pm'), function (b) {
    b.onclick = function () { SFX.tap(); var t = b.getAttribute('data-t'), d = +b.getAttribute('data-d'); pts[t] = d === 0 ? 0 : Math.max(0, (pts[t] || 0) + d); upd(); };
  });
  Array.prototype.forEach.call($('kBody').querySelectorAll('.rcin'), function (el) { el.oninput = function () { pts[el.id.slice(3)] = Math.max(0, Math.floor(+el.value || 0)); upd(); }; el.onblur = upd; });
  if ($('kRecOff')) $('kRecOff').onchange = upd;
  upd();
}
// ---- 内政 ----
// お金を えらぶ スライダー（500貫きざみ）
function amtHtml(id, min, max, val) { return '<div class="kamt"><input type="range" id="' + id + '" min="' + min + '" max="' + max + '" step="5" value="' + val + '"><b id="' + id + 'V"></b></div>'; }
// ---- 移動 ----
function kMoveBox(from, to) {
  var A = KS.provs[from];
  kModal('移動 ' + PROV_BY[from].name + ' → ' + PROV_BY[to].name, '<p class="small">' + PROV_BY[to].name + 'の へい ' + KS.provs[to].units.length + '/' + PROV_CAP + '</p>' + pickerHtml(A.units, 'none'),
    [{ label: '🚶 うごかす', cls: 'act', fn: function () { kSnap('移動'); var r = moveUnits(KS, from, to, pickerUids(A.units)); if (!r.ok) kUndoStack.pop(); if (r.ok) { logC(KS, PROV_BY[from].name + 'から ' + PROV_BY[to].name + 'へ ' + r.n + '隊 いどう', 'good'); kMode = 'idle'; kCloseModal(); kSave(); kUpdate(); } else banner(r.msg, 1200); } },
     { label: 'やめる', cls: 'act sub', fn: kCloseModal }]);
  pickerBind();
}

// ---- 史実イベント ----
var SPEAKER_CLAN = { '尼子詮久':'amago', '陶隆房':'ouchi', '陶興房':'ouchi', '神屋寿禎':null };
function speakerAvatar(name) {
  if (name.charAt(0) === '#') return '<span class="kav nar">📜</span>';
  if (name === '神屋寿禎') return '<span class="kav nar">💰</span>';
  var cid = null;
  for (var c in CLANS) if (CLANS[c].lord === name) cid = c;
  if (cid === KS.player) return '<span class="kav"><img src="' + portraitSrc(cid) + '" alt=""></span>';
  var art = lordArt(name);
  if (art) { var cc = cid || SPEAKER_CLAN[name]; return '<span class="kav" style="border-color:' + (cc && CLANS[cc] ? CLANS[cc].color : '#c9b48a') + '"><img class="art" src="' + art + '" alt=""></span>'; }
  if (!cid) { for (var k2 in KS.officers) if (KS.officers[k2].name === name) cid = KS.officers[k2].clan; }
  if (!cid && SPEAKER_CLAN[name]) cid = SPEAKER_CLAN[name];
  if (cid && CLANS[cid] && CLANS[cid].lord === name && CLANS[cid].face && CLANS[cid].face !== KS.face) return '<span class="kav" style="border-color:' + CLANS[cid].color + '"><img src="' + SPR[charById(CLANS[cid].face).spr] + '" alt=""></span>';
  var col = cid && CLANS[cid] ? CLANS[cid].color : '#8a7a5a';
  return '<span class="kav" style="background:' + col + ';border-color:' + col + '">' + name.charAt(0) + '</span>';
}
function kShowEvents(done) {
  if (!KS || !KS.pendingEvents || !KS.pendingEvents.length) { if (done) done(); return; }
  var ev = KS.pendingEvents.shift(); kSave();
  var h = '<p class="kevdate">' + eraName(ev.y) + '年（' + ev.y + '）' + SEASONS_K[ev.s] + '</p><div class="kev">';
  ev.lines.forEach(function (ln) {
    var nar = ln[0].charAt(0) === '#';
    h += '<div class="kline' + (nar ? ' nar' : '') + '">' + speakerAvatar(ln[0]) + '<div class="kbub">' + (nar ? '' : '<b>' + ln[0] + '</b>') + '<span>' + ln[1] + '</span></div></div>';
  });
  h += '</div>';
  if (ev.note) h += '<div class="knote"><b>📖 史実では</b><p>' + ev.note + '</p></div>';
  var btns = [];
  if (ev.choices) ev.choices.forEach(function (lab, i) { btns.push({ label: lab, cls: i ? 'act sub' : 'act', fn: function () { chooseEvent(KS, ev.id, i); kSave(); kCloseModal(); kUpdate(); kShowEvents(done); } }); });
  else btns.push({ label: 'つぎへ', cls: 'act', fn: function () { kCloseModal(); kUpdate(); kShowEvents(done); } });
  kModal(ev.title, h, btns);
  if (!ev.small) SFX.turn();
}
function openHistory() {
  var list = (KS.history || []).slice().reverse();
  var h = list.length ? '' : '<p>まだ できごとは ありません。</p>';
  list.forEach(function (e) { h += '<details class="khist"><summary><span class="lt">' + e.y + '年' + SEASONS_K[e.s] + '</span> ' + e.title + '</summary><p>' + e.note + '</p></details>'; });
  kModal('📖 れきし（できごと）', h, [{ label: 'とじる', cls: 'act sub', fn: kCloseModal }]);
}

// ---- 城主の 任命 ----
function kAssignBox(pid, back) {
  var cur = officerAt(KS, pid);
  var offs = officersOf(KS, KS.player).sort(function (a, b) { return (b.st[0] + b.st[1] + b.st[2]) - (a.st[0] + a.st[1] + a.st[2]); });
  var h = '<p class="small">' + PROV_BY[pid].name + 'の 城主を えらぶ。武＝合戦の つよさ、政＝収入・内政・徴兵、智＝守り・調略。<br>ほかの 城に いる 家臣を えらぶと この 城へ 移動して くる（この きせつは もう はたらけない）。ほかの 城の 城主だった ときは、その 城は 城主なしに なります。</p><div class="koffs">';
  offs.forEach(function (o) {
    h += '<button class="koff' + (cur && cur.id === o.id ? ' sel' : '') + '" data-o="' + o.id + '"' + (o.at !== pid && offBusy(KS, o) ? ' disabled style="opacity:.5"' : '') + '><b>' + o.name + (o.lord ? '（大名）' : '') + '</b><span class="kst"><i style="width:' + o.st[0] + '%" class="w"></i></span><span class="kst"><i style="width:' + o.st[1] + '%" class="p"></i></span><span class="kst"><i style="width:' + o.st[2] + '%" class="i"></i></span>' +
      '<small>武' + o.st[0] + ' 政' + o.st[1] + ' 智' + o.st[2] + '　📍' + locName(KS, o.at) + (o.prov ? '（城主）' : '') + (o.at !== pid ? (offBusy(KS, o) ? '・✓はたらいた（うごけない）' : '・移動して くる') : '') + '</small></button>';
  });
  h += '</div>';
  kModal('城主（' + PROV_BY[pid].name + '）', h, [{ label: back ? 'もどる' : 'とじる', cls: 'act sub', fn: back || kCloseModal }]);
  Array.prototype.forEach.call($('kBody').querySelectorAll('.koff'), function (b) {
    b.onclick = function () { SFX.tap(); var oid = b.getAttribute('data-o'), o = KS.officers[oid], far = o.at !== pid;
      if (far && offBusy(KS, o)) return;
      kSnap('城主'); if (!setOfficer(KS, pid, oid, true)) return; logC(KS, o.name + 'を ' + PROV_BY[pid].name + 'の 城主に した' + (far ? '（移動したので この きせつは はたらけない）' : ''), 'good'); kSave(); kUpdate(); if (back) back(); else kCloseModal(); };
  });
}
function kOfficersBox() {
  var mine = officersOf(KS, KS.player).sort(function (a, b) { return (b.st[0] + b.st[1] + b.st[2]) - (a.st[0] + a.st[1] + a.st[2]); });
  var nFree = mine.filter(function (o) { return !offBusy(KS, o); }).length;
  var h = '<p class="small">出陣・徴兵・内政・調略は 家臣に まかせる（えらぶ 画面で 担当を きめる）。家臣は <b>1きせつに 1つ</b> はたらく。<br>⚔出陣＝<b>武</b>（★奇襲）・🪖徴兵＝<b>政</b>（★2わり 多く あつまる）・🌾内政＝<b>政</b>（★田畑の 石高 倍／費用 半分 もどる）・🦊調略＝<b>智</b>（★おまけの 成果）。のうりょく 66 から ★大成功が でて、100 で 5わり。</p>' +
    '<p class="small">この きせつ あいている 家臣：<b>' + nFree + '</b>／' + mine.length + '人</p>' +
    '<p class="small">家臣は <b>いる 城の 国</b>でしか はたらけない。ほかの 国で はたらかせる ときは 🚶移動（その きせつは もう はたらけない）。</p>' +
    '<table class="ktab"><tr><th>なまえ</th><th>武</th><th>政</th><th>智</th><th>得意</th><th>いる 城</th><th>こんき</th></tr>';
  function cell(v) { return '<td' + (v >= 80 ? ' style="color:#c27a00;font-weight:bold"' : '') + '>' + v + '</td>'; }
  mine.forEach(function (o) {
    var best = [0, 1, 2].sort(function (a, b) { return o.st[b] - o.st[a]; })[0], role = ['⚔出陣', '🪖徴兵・🌾内政', '🦊調略'][best];
    h += '<tr' + (offBusy(KS, o) ? ' style="opacity:.55"' : '') + '><td>' + (o.lord && lordArt(o.name) ? '<img class="kmini" src="' + portraitSrc(KS.player) + '" alt="">' : '') + '<b>' + o.name + '</b>' + (o.lord ? '（大名）' : '') + '</td>' + cell(o.st[0]) + cell(o.st[1]) + cell(o.st[2]) +
      '<td><small>' + role + (premiumP(o.st[best]) > 0 ? ' ★' + Math.round(premiumP(o.st[best]) * 100) + '%' : '') + '</small></td><td class="kloc">📍' + locName(KS, o.at) + (o.prov ? '<br>' + PROV_BY[o.prov].name + 'の 城主' : o.at && KS.castles[o.at] ? '<br>' + PROV_BY[KS.castles[o.at].prov].name + 'の 支城' : '') + '</td><td><small>' + (offBusy(KS, o) ? '✓はたらいた' : 'あいてる') + '</small>' +
      (!offBusy(KS, o) && KS.phase === 'player' && locsOf(KS, KS.player).length > 1 ? '<br><button class="kmv koffmv" data-o="' + o.id + '">🚶移動</button>' : '') + '</td></tr>'; });
  h += '</table><h4>ほかの 家の おもな 武将</h4><table class="ktab">';
  Object.keys(KS.officers).map(function (k) { return KS.officers[k]; }).filter(function (o) { return o.clan !== KS.player; })
    .sort(function (a, b) { return Math.max(b.st[0], b.st[1], b.st[2]) - Math.max(a.st[0], a.st[1], a.st[2]); }).slice(0, 14)
    .forEach(function (o) { h += '<tr><td>' + (o.lord && lordArt(o.name) ? '<img class="kmini" src="' + lordArt(o.name) + '" alt="">' : '') + '<b>' + o.name + '</b><br><small>' + CLANS[o.clan].name + '</small></td><td>' + o.st[0] + '</td><td>' + o.st[1] + '</td><td>' + o.st[2] + '</td><td>' + (o.prov ? PROV_BY[o.prov].name : '—') + '</td></tr>'; });
  h += '</table>';
  kModal('家臣（' + mine.length + '人）', h, [{ label: 'とじる', cls: 'act sub', fn: kCloseModal }]);
  Array.prototype.forEach.call($('kBody').querySelectorAll('.koffmv'), function (b) { b.onclick = function () { SFX.tap(); kOffMoveBox(b.getAttribute('data-o')); }; });
}
// ---- 領地の 一覧 ----
function kLandBox(tab) {
  tab = tab || 'castle';
  var me = KS.player, h = '<div class="ktabs"><button class="ktab1' + (tab === 'castle' ? ' on' : '') + '" data-tab="castle">🏯 城と めいれい</button><button class="ktab1' + (tab === 'rel' ? ' on' : '') + '" data-tab="rel">🤝 大名との 関係</button></div>';
  if (tab === 'rel') h += kRelTable(); else h += kCastleTable();
  kModal('📜 領地と 大名の 一覧', h, [{ label: 'とじる', cls: 'act sub', fn: kCloseModal }], true);
  [].forEach.call($('kBody').querySelectorAll('[data-tab]'), function (e) { e.onclick = function () { SFX.tap(); kLandBox(e.dataset.tab); }; });
  if (tab === 'castle') kCastleTableBind(); else kRelTableBind();
}
function kCastleTable() {
  var me = KS.player, provs = {}, h = '', ph = KS.phase === 'player';
  PROVS.forEach(function (p) {
    var mine = KS.provs[p.id].owner === me, brs = branchesIn(KS, p.id).filter(function (c) { return c.owner === me; });
    if (mine || brs.length) provs[p.id] = { mine: mine, brs: brs };
  });
  var ids = Object.keys(provs), totMen = 0, totU = 0, nC = 0;
  function offsAt(at) { return officersOf(KS, me).filter(function (o) { return o.at === at; }); }
  function offCell(at, lord) { var l = offsAt(at); return l.length ? l.map(function (o) { return (o === lord ? '🎖' : '') + o.name + (offBusy(KS, o) ? '✓' : ''); }).join('<br>') : '<span style="color:#aaa">—</span>'; }
  function foodCell(pid, cid, units) { var f = castleFood(KS, pid, cid), d = castleFoodDays(KS, pid, cid, units); return f.toLocaleString('ja-JP') + '石<br><small class="' + (d < 15 ? 'r' : '') + '">' + (d > 365 ? '1年いじょう' : d + '日') + '</small>'; }
  // めいれいの ボタン（できる＝青、した＝✓、できない＝うすい）
  var AN = { atk: '出陣', rec: '徴兵', dev: '内政', sch: '調略' };
  function act(icon, done, can, key, kind) { return done ? '<span class="kact done" title="' + AN[kind] + '（した）">' + icon + '✓</span>' : '<button class="kact" title="' + AN[kind] + '" data-k="' + key + '" data-a="' + kind + '"' + (can && ph ? '' : ' disabled') + '>' + icon + '<small>' + AN[kind] + '</small></button>'; }
  h += '<table class="ktab kland"><tr><th>城</th><th>へい</th><th>🍙兵糧</th><th>家臣</th><th>めいれい</th></tr>';
  ids.forEach(function (pid) {
    var P = KS.provs[pid], g = provs[pid], sh = kokuShareOf(KS, pid, me), inc = provSplit(KS, pid, false)[me] || 0, nen = nenguOf(KS, pid, me);
    h += '<tr class="kprow" data-p="' + pid + '"><td colspan="5"><b>' + PROV_BY[pid].name + '</b>（' + PROV_BY[pid].kuni + '）' + (g.mine ? '' : ' <small>てきの 国の なかの 所領</small>') +
      '<br><small>🌾' + Math.round(P.koku * sh * 10) / 10 + '万石' + (sh < 0.999 ? '（' + Math.round(sh * 100) + '%）' : '') + '・💰+' + kan(inc) + '/きせつ・秋の 年貢 約' + kan(nen) +
      (g.mine ? '・年貢 ' + Math.round(taxOf(P) * 10) + '公' + (10 - Math.round(taxOf(P) * 10)) + '民・不満 ' + Math.round(P.fuman || 0) + '・本城の めいれい ' + cmdCount(P) + '/' + MAX_CMDS : '') + '</small></td></tr>';
    if (g.mine) { nC++; totMen += menTotal(P.units); totU += P.units.length;
      var full = P.acted || cmdFull(P), hasEn = ADJ[pid].some(function (q) { return KS.provs[q].owner !== me; });
      h += '<tr class="kcrow" data-main="' + pid + '"><td>🏯 ' + castleNameOf(KS, pid) + '<br><small>本城・改築Lv' + (P.clv || 0) + (P.ruin ? '・<b class="r">🔥こわれ</b>' : '') + '</small></td><td>' + menStr(menTotal(P.units)) + '<br><small>' + P.units.length + '/' + PROV_CAP + '隊</small></td><td>' + foodCell(pid, null, P.units) + '</td><td><small>' + offCell(pid, officerAt(KS, pid)) + '</small></td><td class="kacts">' +
        act('⚔', didCmd(P, 'attack'), !full && hasEn && P.units.length, pid, 'atk') + act('🪖', didCmd(P, 'recruit'), !full, pid, 'rec') + act('🌾', false, true, pid, 'dev') + act('🦊', didCmd(P, 'scheme'), !full && hasEn, pid, 'sch') + '</td></tr>'; }
    g.brs.forEach(function (c) { nC++; totMen += menTotal(c.units); totU += c.units.length;
      h += '<tr class="kcrow" data-br="' + c.id + '"><td>🏰 ' + brName(c.id) + '<br><small>支城・所領' + Math.round(branchShare(c.id) * 100) + '%' + (c.ruin ? '・<b class="r">🔥こわれ</b>' : '') + (c.lv ? '・改築Lv' + c.lv : '') + '</small></td><td>' + menStr(menTotal(c.units)) + '<br><small>' + c.units.length + '/8隊</small></td><td>' + foodCell(pid, c.id, c.units) + '</td><td><small>' + offCell(c.id, null) + '</small></td><td class="kacts">' +
        act('⚔', c.atk === KS.turn, canBranchAttack(KS, c.id) && branchTargets(KS, c.id).length, c.id, 'atk') + act('🪖', c.rec === KS.turn, true, c.id, 'rec') + act('🌾', false, true, c.id, 'dev') + act('🦊', c.sch === KS.turn, branchSchemeTargets(KS, c.id).length, c.id, 'sch') + '</td></tr>'; });
  });
  h += '</table>';
  var nP = provsOf(KS, me).length;
  return '<div class="kodds">🗾 <b>' + nP + '国</b>・🏯 <b>' + nC + '城</b>（本城 ' + nP + '・支城 ' + (nC - nP) + '）<br>🌾 石高 <b>' + Math.round(effKoku(KS, me) * 10) / 10 + '万石</b>　💰 収入 約' + kan(income(KS, me)) + '/きせつ（秋は 年貢が はいる）<br>⚔ へい <b>' + menStr(totMen) + '</b>（' + totU + '隊）　👥 家臣 ' + officersOf(KS, me).length + '人</div>' +
    '<p class="small">めいれいは <b>城 ごと</b>：⚔出陣 🪖徴兵 🌾内政 🦊調略。本城は 国の めいれい（3つまで）、支城は それぞれ きせつに 1かい。城の なまえを タップすると その 城の 画面。🎖＝城主、✓＝この きせつ もう した。</p>' + h;
}
function kCastleTableBind() {
  var me = KS.player, back = function () { kLandBox('castle'); };
  [].forEach.call($('kBody').querySelectorAll('.kcrow td:not(.kacts)'), function (td) { td.onclick = function () { var e = td.parentNode; SFX.tap(); var pid = e.dataset.main || KS.castles[e.dataset.br].prov; if (KS.provs[pid].owner === me) kSel = pid; kUpdate(); if (e.dataset.main) kMainCastleBox(e.dataset.main); else kCastleBox(e.dataset.br); }; });
  [].forEach.call($('kBody').querySelectorAll('.kprow'), function (e) { e.onclick = function () { SFX.tap(); kSel = e.dataset.p; kCloseModal(); kUpdate(); }; });
  [].forEach.call($('kBody').querySelectorAll('button.kact'), function (b) { b.onclick = function (ev) {
    ev.stopPropagation(); SFX.tap(); var k = b.dataset.k, a = b.dataset.a, isC = !!KS.castles[k], pid = isC ? KS.castles[k].prov : k;
    if (!isC) {
      if (a === 'rec') return kRecruitBox(pid, null, back);
      kCloseModal(); kSel = pid;
      if (a === 'dev') return openDomain(pid);
      kMode = a === 'atk' ? 'attack' : 'scheme'; kUpdate(); return;
    }
    if (a === 'atk') return kBranchAtkBox(k);
    if (a === 'rec') return kRecruitBox(pid, k, back);
    if (a === 'sch') return kBranchSchemeBox(k);
    kCloseModal(); openDomain(pid, k);
  }; });
}
function kRelTable() {
  var me = KS.player, mine = provsOf(KS, me), nb = {};
  mine.forEach(function (p) { (ADJ[p] || []).forEach(function (q) { nb[KS.provs[q].owner] = 1; }); });
  var rows = CLAN_ORDER.concat([IKKI]).filter(function (c) { return c !== me && KS.clans[c] && KS.clans[c].alive && provsOf(KS, c).length; });
  var ord = { hostile: 0, ally: 1, neutral: 2 };
  rows.sort(function (a, b) { return ord[relationOf(KS, me, a)] - ord[relationOf(KS, me, b)] || (nb[b] ? 1 : 0) - (nb[a] ? 1 : 0) || provsOf(KS, b).length - provsOf(KS, a).length; });
  var h = '<p class="small"><span class="krel" style="background:' + REL_INFO.ally.col + '">🤝 同盟</span> おたがい せめない（せめると 同盟が きれる）　<span class="krel" style="background:' + REL_INFO.neutral.col + '">〰 中立</span> いまは 合戦して いない　<span class="krel" style="background:' + REL_INFO.hostile.col + '">⚔ 敵対</span> この 1年に 合戦した</p>';
  h += '<table class="ktab kland"><tr><th>家</th><th>関係</th><th>りょうち</th><th>へい</th><th>石高</th></tr>';
  rows.forEach(function (c) {
    var R0 = REL_INFO[relationOf(KS, me, c)], lw0 = lastWar(KS, me, c), pv = provsOf(KS, c), br = Object.keys(KS.castles || {}).filter(function (k) { return KS.castles[k].owner === c; }).length;
    var men = 0; pv.forEach(function (q) { men += menTotal(KS.provs[q].units); }); Object.keys(KS.castles || {}).forEach(function (k) { if (KS.castles[k].owner === c) men += menTotal(KS.castles[k].units); });
    h += '<tr class="krrow" data-c="' + c + '"><td style="text-align:left">' + crestHtml(c, 22) + ' <b>' + CLANS[c].name + '</b><br><small>' + CLANS[c].lord + (nb[c] ? '・<b>となり</b>' : '') + '</small></td><td><span class="krel" style="background:' + R0.col + '">' + R0.icon + ' ' + R0.name + '</span>' + (lw0 !== undefined ? '<br><small>合戦：' + (KS.turn - lw0 === 0 ? 'この きせつ' : (KS.turn - lw0) + 'きせつ まえ') + '</small>' : '') + '</td><td>' + pv.length + '国' + (br ? '<br><small>支城 ' + br + '</small>' : '') + '</td><td>' + menStr(men) + '</td><td>' + Math.round(effKoku(KS, c) * 10) / 10 + '万石</td></tr>';
  });
  return h + '</table><p class="small">行を タップすると その 家の 本拠を 地図で えらぶ。同盟は 🦊調略で むすべる。</p>';
}
function kRelTableBind() {
  [].forEach.call($('kBody').querySelectorAll('.krrow'), function (e) { e.onclick = function () { SFX.tap(); var c = e.dataset.c, cap = KS.capital && KS.capital[c] && KS.provs[KS.capital[c]].owner === c ? KS.capital[c] : provsOf(KS, c)[0]; kSel = cap; kCloseModal(); kUpdate(); }; });
}
// 家臣を べつの 城へ
function kOffMoveBox(oid, back) {
  back = back || kOfficersBox;
  var o = KS.officers[oid]; if (!o) return;
  var locs = locsOf(KS, KS.player).filter(function (a) { return a !== o.at; });
  var h = '<p><b>' + o.name + '</b>（武' + o.st[0] + ' 政' + o.st[1] + ' 智' + o.st[2] + '）は いま <b>' + locLong(KS, o.at) + '</b>に いる。</p>' +
    '<p class="small">うつる 城を えらぶ。移動した きせつは もう はたらけない。つぎの きせつから その 国で 出陣・徴兵・内政・調略が できる。' + (o.prov ? '<br>いまは ' + PROV_BY[o.prov].name + 'の 城主。うごくと その 城は 城主なしに なる。' : '') + '</p><div class="koffs">';
  locs.forEach(function (a) {
    var pv = locProv(KS, a), here = officersOf(KS, KS.player).filter(function (x) { return x.at === a; }), br = !!KS.castles[a];
    var lord = br ? null : officerAt(KS, a);
    h += '<button class="koff" data-a="' + a + '"><b>' + (br ? '🏰 ' : '🏯 ') + locName(KS, a) + '</b><small>' + PROV_BY[pv].name + (br ? 'の 支城' : 'の 本城') + '　城主：' + (br ? '—' : lord ? lord.name : 'いない') + '<br>いる 家臣：' + (here.length ? here.map(function (x) { return x.name; }).join('・') : 'なし') + '</small></button>';
  });
  h += '</div>';
  kModal('🚶 ' + o.name + 'を 移動', h, [{ label: 'もどる', cls: 'act sub', fn: back }]);
  Array.prototype.forEach.call($('kBody').querySelectorAll('.koff'), function (b) {
    b.onclick = function () { SFX.tap(); var a = b.getAttribute('data-a'); kSnap('家臣の 移動');
      if (!moveOfficer(KS, oid, a)) return;
      logC(KS, o.name + 'が ' + locLong(KS, a) + 'へ うつった', 'good'); kSave(); kUpdate(); back(); };
  });
}
// ---- 調略 ----
function kSchemeBox(from, to, cs) {
  var B = KS.provs[to], tc = B.owner, me = cs ? null : officerAt(KS, from), th = officerAt(KS, to), myC = cs ? KS.castles[cs].owner : KS.provs[from].owner;
  var gold = KS.clans[KS.player].gold, hi = Math.min(SCHEME_MAX, gold - gold % 5), poor = gold < SCHEME_MIN;
  var def = Math.max(SCHEME_MIN, Math.min(hi, SCHEME_COST));
  var h = '<div class="kintro">' + crestHtml(tc, 52) + '<p><b>' + CLANS[tc].lord + '</b>（' + CLANS[tc].name + '・' + provsOf(KS, tc).length + 'りょうち）<br><small>' + PROV_BY[to].name + 'の 城主：' + offTxt(th) + '</small></p></div>' +
    '<p class="small">いまの 関係：<span class="krel" style="background:' + REL_INFO[relationOf(KS, KS.player, tc)].col + '">' + REL_INFO[relationOf(KS, KS.player, tc)].icon + ' ' + REL_INFO[relationOf(KS, KS.player, tc)].name + '</span></p>' +
    offPickHtml('kSchOff', 2, cs || from, '🦊 はたらく 人（智）') +
    (poor ? '<p class="r">お金が たりない（💰' + kan(SCHEME_MIN) + 'から）</p>' : '<h4>つかう お金（おおいほど せいこうしやすい）</h4>' + amtHtml('kSchAmt', SCHEME_MIN, Math.max(SCHEME_MIN, hi), def)) +
    '<div class="kschemes">' +
    '<button class="kopt" id="ksSubmit"><b>🙇 したがわせる</b><small>家ごと みかたに（りょうち・へい・家臣も）。小さな 家だけ。</small><em id="ksSubmitP"></em></button>' +
    '<button class="kopt" id="ksNaio"><b>🦊 内応させる</b><small>' + PROV_BY[to].name + 'の 城の へいを よわらせ、つぎの 攻撃で 城を もろくする。</small><em id="ksNaioP"></em></button>' +
    '<button class="kopt" id="ksAlly"><b>🤝 同盟を むすぶ</b><small>おたがい せめなくなる（政が 大事）。</small><em id="ksAllyP"></em></button></div>';
  kModal('調略（' + (cs ? brName(cs) : PROV_BY[from].name) + ' → ' + PROV_BY[to].name + '）', h, [{ label: 'やめる', cls: 'act sub', fn: kCloseModal }]);
  function amt() { return $('kSchAmt') ? +$('kSchAmt').value : SCHEME_COST; }
  function upd() {
    var a = amt();
    if ($('kSchAmt')) $('kSchAmt').nextElementSibling.textContent = '💰' + kan(a);
    if ($('kSchOffP')) $('kSchOffP').textContent = ' ' + offPremTxt(offPicked('kSchOff'), 2);
    [['ksSubmit', 'submit', 'むり'], ['ksNaio', 'naio', 'むり'], ['ksAlly', 'ally', '同盟ずみ']].forEach(function (q) {
      var pc = Math.round(schemeOddsAmt(KS, from, to, q[1], a, offPicked('kSchOff') || (cs ? null : undefined), myC) * 100);
      $(q[0] + 'P').textContent = pc <= 0 ? q[2] : pc + '%'; $(q[0]).disabled = poor || pc <= 0;
    });
  }
  if ($('kSchAmt')) $('kSchAmt').oninput = upd;
  if ($('kSchOff')) $('kSchOff').onchange = upd;
  upd();
  function go(kind) {
    var so = offPicked('kSchOff'), r = scheme(KS, from, to, kind, amt(), so ? so.id : null, cs || null); kUndoClear(); kMode = 'idle'; kCloseModal(); kSave();
    if (!r.ok) { banner(r.msg, 1400); kUpdate(); return; }
    (r.win ? SFX.win : SFX.lose)();
    banner((r.premium ? '★ 大成功！ ' : '') + (r.win ? '調略 せいこう！' : '調略 しっぱい…'), 1400);
    if (KS.over) return kGameOver();
    kUpdate();
  }
  $('ksSubmit').onclick = function () { SFX.tap(); go('submit'); };
  $('ksNaio').onclick = function () { SFX.tap(); go('naio'); };
  $('ksAlly').onclick = function () { SFX.tap(); go('ally'); };
}

// ---- 季節を おわる → CPU ----
function kEndSeason() {
  if (!KS || KS.phase !== 'player') return;
  var left = provsOf(KS, KS.player).filter(function (pid) { return !KS.provs[pid].acted && cmdCount(KS.provs[pid]) === 0; }).length;
  function go() { kCloseModal(); kMode = 'idle'; kUndoClear(); KS.repFrom = (KS.logSeq || 0) + 1; KS.repSnap = kClanSnap(); KS.repLabel = eraName(KS.year) + '年 ' + SEASONS_K[KS.season]; cpuBegin(KS); kSave(); kRunCpu(); }
  if (left > 0) kModal('きせつを おわる？', '<p>まだ めいれい していない 国が ' + left + 'か国 あります。</p>', [{ label: 'おわる', cls: 'act', fn: go }, { label: 'もどる', cls: 'act sub', fn: kCloseModal }]);
  else go();
}
function kRunCpu() {
  if (kCpuRunning) return; kCpuRunning = true;
  kUpdate();
  setTimeout(function () {
    kCpuRunning = false;
    var r = cpuNext(KS); kSave();
    if (r.type === 'battle') {
      var b = r.battle; b.playerSide = 'def'; kSave(); kUpdate();
      if (!b.defUnits.length) { kAutoBattle(b); return; }
      kSel = b.to;
      kDefenseBox(b);
      return;
    }
    if (r.type === 'over') return kGameOver();
    // きせつ おわり
    var nLog = KS.log.length;
    seasonEnd(KS); kSave();
    kUpdate();
    banner(eraName(KS.year) + '年 ' + SEASONS_K[KS.season] + (KS.season === 2 ? '（年貢）' : ''), 1400);
    SFX.turn();
    if (KS.over) return kGameOver();
    // じぶんの 国で 一揆が おきたら しらせる
    var ik = KS.log.slice(Math.max(0, nLog - 2)).filter(function (l) { return l.kind === 'bad' && /一揆/.test(l.text); });
    setTimeout(function () { kSeasonReport(function () {
      if (!ik.length) return kShowEvents();
      var taken = ik.some(function (l) { return /大一揆/.test(l.text); });
      if (taken) SFX.lose();
      kModal(taken ? '大一揆！' : '一揆が おきた', '<div class="kintro"><span class="kcrest" style="background:' + CLANS[IKKI].color + ';border-color:' + CLANS[IKKI].color + '">一</span><p>' + ik.map(function (l) { return l.text; }).join('<br>') + '</p></div>' +
        '<p class="small">年貢を かるくすると 不満は へる。' + (taken ? '一揆衆の 国は せめて とりかえせる。' : '') + '</p>', [{ label: 'わかった', cls: 'act', fn: function () { kCloseModal(); kShowEvents(); } }]);
    }); }, 1500);
  }, 350);
}
// ---- きせつの できごと（ほかの 国の おもな うごき）----
function kClanSnap() {
  var o = {}; CLAN_ORDER.concat([IKKI]).forEach(function (cid) {
    if (!KS.clans[cid] || (!KS.clans[cid].alive && cid !== IKKI)) return;
    var pv = provsOf(KS, cid), men = 0, koku = 0, nc = pv.length;
    pv.forEach(function (pid) { men += menTotal(KS.provs[pid].units); koku += KS.provs[pid].koku; });
    if (KS.castles) for (var k in KS.castles) if (KS.castles[k].owner === cid) { nc++; men += menTotal(KS.castles[k].units); }
    o[cid] = { pv: pv.length, castles: nc, men: men, koku: Math.round(koku * 10) / 10, alive: KS.clans[cid].alive };
  });
  return o;
}
var REP_RULES = [
  [/ほろびた|統一/, '💀', 9], [/攻め落とした|を おとした|開城/, '🏯', 8], [/大一揆|一揆が おきた/, '🌾', 7], [/したがった|に くわわった！?$|家ごと/, '🙇', 7],
  [/同盟を むすんだ|同盟が きれた/, '🤝', 6], [/せめてきた/, '⚔', 6], [/まもりきった|ひきあげた/, '🛡', 5], [/内応|調略/, '🦊', 4],
  [/当主が|なくなった|はなれ|家臣に くわわった|とらえ/, '👤', 4], [/降参した|まだ 抵抗/, '🏳', 3]
];
function kSeasonReport(next) {
  var from = KS.repFrom || 0, items = [];
  KS.log.forEach(function (l) {
    if (!l.n || l.n < from) return;
    if (/^――|^【|年貢が はいった|降参して .*くわわった|不満を つのらせて/.test(l.text)) return;
    for (var i = 0; i < REP_RULES.length; i++) if (REP_RULES[i][0].test(l.text)) { items.push({ ic: REP_RULES[i][1], pr: REP_RULES[i][2], text: l.text, mine: l.kind !== 'sys' }); return; }
  });
  // 各家の うごき（領地・城・兵・石高の ふえ へり）
  var a = KS.repSnap || {}, b = kClanSnap(), rows = [];
  Object.keys(Object.assign({}, a, b)).forEach(function (cid) {
    var x = a[cid] || { pv: 0, castles: 0, men: 0, koku: 0 }, y = b[cid] || { pv: 0, castles: 0, men: 0, koku: 0 };
    if (!y.pv && !x.pv && cid === IKKI) return;
    var dc = y.castles - x.castles, dm = y.men - x.men, dk = Math.round((y.koku - x.koku) * 10) / 10;
    if (!dc && Math.abs(dm) < 100 && !dk) return;
    rows.push({ cid: cid, dc: dc, dm: dm, dk: dk, y: y });
  });
  rows.sort(function (p, q) { return Math.abs(q.dc) * 1000 + Math.abs(q.dm) / 10 - (Math.abs(p.dc) * 1000 + Math.abs(p.dm) / 10); });
  if (!items.length && !rows.length) return next();
  items.sort(function (p, q) { return q.pr - p.pr; });
  function sg(v, u) { return v > 0 ? '<span class="g">+' + v.toLocaleString('ja-JP') + u + '</span>' : v < 0 ? '<span class="r">' + v.toLocaleString('ja-JP') + u + '</span>' : '<span style="opacity:.4">±0</span>'; }
  var h = (items.length ? '<ul class="krep">' + items.slice(0, 14).map(function (it) { return '<li' + (it.mine ? ' class="mine"' : '') + '>' + it.ic + ' ' + it.text + '</li>'; }).join('') + '</ul>' + (items.length > 14 ? '<p class="small">ほか ' + (items.length - 14) + 'けん（📜記録で 見られる）</p>' : '') : '<p class="small">大きな いくさは なかった。</p>') +
    (rows.length ? '<h4>各家の うごき</h4><table class="ktab krept"><tr><th>家</th><th>城</th><th>兵</th><th>石高</th></tr>' + rows.slice(0, 10).map(function (r) {
      return '<tr' + (r.cid === KS.player ? ' class="mine"' : '') + '><td>' + (CLANS[r.cid] ? '<span class="kdot" style="background:' + CLANS[r.cid].color + '"></span>' + CLANS[r.cid].name : r.cid) + (r.y.alive === false ? '（ほろびた）' : '') + '</td><td>' + r.y.castles + ' ' + sg(r.dc, '') + '</td><td>' + sg(r.dm, '人') + '</td><td>' + sg(r.dk, '万石') + '</td></tr>'; }).join('') + '</table>' : '');
  kModal('📜 ' + (KS.repLabel || '') + 'の できごと', h, [{ label: 'つぎへ', cls: 'act', fn: function () { kCloseModal(); next(); } }]);
}
// 攻められた：援軍を えらんで まもる（援軍は それぞれの 城から すすんでくる）
function kDefenseBox(b, sel) {
  sel = sel || {};
  var A = CLANS[b.atkClan], srcs = reinfSources(KS, b), addMen = 0;
  srcs.forEach(function (sr) { var l = sel[sr.src] || []; addMen += menTotal(sr.units.filter(function (u) { return l.indexOf(u.uid) >= 0; })); });
  var h = '<div class="kintro">' + crestHtml(b.atkClan, 60) + '<p><b>' + A.lord + '</b>が ' + PROV_BY[b.from].name + 'から <b>' + (b.castleName || PROV_BY[b.to].name) + '</b>（' + PROV_BY[b.to].name + (b.castleId ? 'の 支城' : 'の 本城') + '）に せめてきた！<br>' +
    'てき ' + menStr(menTotal(b.atkUnits)) + '（' + unitSummary(b.atkUnits) + '）<br>城の 守り ' + menStr(menTotal(b.defUnits)) + '（' + unitSummary(b.defUnits) + '）</p></div>';
  h += '<h4>🚩 援軍</h4>';
  if (srcs.length) {
    h += '<p class="small">ボタンで 援軍を おくる 城と へいを えらぶ。援軍は その 城の ほうから 合戦場へ むかう。合戦の とちゅうでも「🚩援軍」で よべる。</p>';
    srcs.forEach(function (sr, i) { var l = sel[sr.src] || [], m = menTotal(sr.units.filter(function (u) { return l.indexOf(u.uid) >= 0; }));
      var tot = menTotal(sr.units);
      h += '<div class="kbrow"><span class="kbrn">' + (sr.kind === 'prov' ? '🏯 ' : '🏰 ') + '<b>' + sr.name + '</b><br><small>' +
        (m ? '<b style="color:#2a6a2a">✓ 援軍 ' + menStr(m) + 'を おくる</b>（のこり ' + menStr(tot - m) + 'で 城を まもる）' : 'いる へい ' + menStr(tot) + '・まだ おくらない') + '</small></span>' +
        '<button class="kmini' + (m ? ' sub' : '') + '" data-rs="' + i + '">🚩 ' + (m ? 'えらびなおす' : '援軍を おくる') + '</button></div>'; });
    var dm = menTotal(b.defUnits), am = menTotal(b.atkUnits);
    h += '<div class="kodds">まもる へい：城の 守り ' + menStr(dm) + (addMen ? ' ＋ 援軍 <b style="color:#2a6a2a">' + menStr(addMen) + '</b> ＝ <b>' + menStr(dm + addMen) + '</b>' : '') + '<br>せめてくる てき：<b>' + menStr(am) + '</b>' +
      (addMen ? '<br><small>援軍は 合戦が はじまると それぞれの 城の ほうから かけつける。</small>' : '') + '</div>';
  } else h += '<p class="small">援軍を おくれる 城が ない（となりの じぶんの 国・おなじ 国の 城に へいが いない）。</p>';
  function picks() { return Object.keys(sel).map(function (k) { return { src: k, uids: sel[k] }; }).filter(function (e) { return e.uids.length; }); }
  function go(fn) { var pk = picks(); if (pk.length) { addReinf(KS, b, pk); logC(KS, '援軍が ' + (b.castleName || PROV_BY[b.to].name) + 'へ むかった（' + pk.map(function (e) { return KS.castles[e.src] ? brName(e.src) : e.src === b.to ? castleNameOf(KS, b.to) : PROV_BY[e.src].name; }).join('・') + 'から）', 'good'); } kSave(); kCloseModal(); fn(b); }
  kModal('てきが せめてきた！', h,
    [{ label: '⚔ 合戦を 指揮する', cls: 'act', fn: function () { go(kFightBattle); } },
     { label: '🎲 おまかせで 決着', cls: 'act sub', fn: function () { go(kAutoBattle); } }]);
  $('kBody').insertAdjacentHTML('beforeend', '<p class="small">⚔＝じぶんで 兵を うごかして たたかう' + (addMen ? '（援軍も いっしょに）' : '') + '。🎲＝けっかだけ すぐ きまる' + (addMen ? '（援軍も 数に はいる）' : '') + '。</p>');
  [].forEach.call($('kBody').querySelectorAll('[data-rs]'), function (e) { e.onclick = function () {
    SFX.tap(); var sr = srcs[+e.dataset.rs];
    kModal('🚩 ' + sr.name + 'から 援軍', '<p class="small">おくる へいを えらぶ（のこりは ' + sr.name + 'を まもる）。</p>' + pickerHtml(sr.units, 0, 'rs_'), [
      { label: 'けってい', cls: 'act', fn: function () { sel[sr.src] = pickerUids(sr.units, 'rs_'); kDefenseBox(b, sel); } },
      { label: 'やめる', cls: 'act sub', fn: function () { kDefenseBox(b, sel); } }]);
    pickerBind();
  }; });
}
function kGameOver() {
  kUpdate();
  var win = KS.winner === KS.player;
  var img = SPR[(win ? charById(KS.face).win : charById(KS.face).lose) || 'fute_joy'];
  kClear();
  (win ? SFX.win : SFX.lose)();
  kModal(win ? '中国地方 統一！' : 'ほろびて しまった…',
    '<div class="kres"><img src="' + img + '" alt=""><p><b>' + (win ? CLANS[KS.player].lord + 'は ' + KS.year + '年 ' + SEASONS_K[KS.season] + 'に 中国地方を 統一した！' : CLANS[KS.player].name + 'は ' + KS.year + '年に ほろびた…') + '</b></p></div>',
    [{ label: 'タイトルへ', cls: 'act', fn: function () { kCloseModal(); KS = null; show('title'); } }]);
}
function openKLog() {
  var h = KS.log.slice().reverse().map(function (e) { return '<div class="lg ' + kLogCls(e.kind) + '"><span class="lt">' + e.y + SEASONS_K[e.s] + '</span>' + e.text + '</div>'; }).join('');
  $('logFull').innerHTML = h; $('logBox').classList.add('on');
}

function kInit() {
  $('ngBtn').onclick = function () { SFX.tap(); openClanScreen(); };
  $('contBtn').onclick = function () { SFX.tap(); continueCampaign(); };
  $('quickBtn').onclick = function () { SFX.tap(); $('modeBox').classList.remove('on'); show('setupScreen'); initSetup(); };
  $('modeClose').onclick = function () { SFX.tap(); $('modeBox').classList.remove('on'); };
  $('kBackBtn').onclick = function () { SFX.tap(); show('title'); };
  $('kGoBtn').onclick = function () {
    SFX.tap();
    if (kHasSave()) { kModal('あたらしく はじめる？', '<p>まえの つづきは きえて しまいます。</p>', [{ label: 'はじめる', cls: 'act', fn: function () { kCloseModal(); startCampaign(); } }, { label: 'もどる', cls: 'act sub', fn: kCloseModal }]); }
    else startCampaign();
  };
  ['easy', 'normal', 'hard'].forEach(function (d) { $('kdif_' + d).onclick = function () { SFX.tap(); kNew.difficulty = d; renderClanScreen(); }; });
  $('kEndBtn').onclick = function () { SFX.tap(); kEndSeason(); };
  $('kFitBtn').onclick = function () { SFX.tap(); kWhole = !kWhole; kFit(kWhole); kRender(); };
  $('kOffBtn').onclick = function () { SFX.tap(); kOfficersBox(); };
  $('kLandBtn').onclick = function () { SFX.tap(); kLandBox(); };
  $('kHistBtn').onclick = function () { SFX.tap(); openHistory(); };
  $('kLog').onclick = function () { SFX.tap(); openKLog(); };
  $('kHelpBtn').onclick = function () { SFX.tap(); $('helpBox').classList.add('on'); };
  $('kQuitBtn').onclick = function () { SFX.tap(); kModal('タイトルに もどる', '<p>ここまでの すすみは ほぞん されています。「はじめる → つづきから」で また あそべます。</p>', [{ label: 'もどる', cls: 'act', fn: function () { kCloseModal(); show('title'); } }, { label: 'やめる', cls: 'act sub', fn: kCloseModal }]); };
  $('backMapBtn').onclick = function () { SFX.tap(); kBattleFinished(); };
  kInitInput(); initDomainInput();
  window.addEventListener('resize', function () { if ($('mapScreen').classList.contains('on')) { kResize(); kFit(); kRender(); } });
}

// ==== 領内マップ（国の 中を ヘックスで 見て 開墾・町・鉱山・名産・塩田） ====
var DS = { pid: null, mode: null, sel: null, s: 1, x: 0, y: 0, rho: 10, built: 0 };
var TER_COL = { '.': '#a8d58a', '=': '#d9c08a', f: '#6aa85a', h: '#c2c97a', m: '#9a8f86', M: '#6d5f55', r: '#5fb0e8', s: '#4f8fc6', X: '#cfc8b5' };
var TER_NAME = { '.': '平地', '=': '道', f: '森', h: '丘', m: '山', M: 'けわしい山', r: '川', s: '海・湖' };
function openDomain(pid, branchId) {
  var d = domData(); if (!d || !KS) return;
  if (!KS.provs[pid].bld) initDomain(KS, pid);
  DS.pid = pid; DS.mode = null; DS.sel = null; DS.built = 0; DS.snapped = false; DS.branch = branchId || null; DS.wide = false;
  var C0 = branchId ? KS.castles[branchId] : null;
  DS.who = C0 ? C0.owner : KS.provs[pid].owner;
  // 内政は 領地 ぜんぶが 対象（めいれいは つかわない・お金の かぎり）
  var canAct = KS.phase === 'player';
  DS.provOK = KS.provs[pid].owner === KS.player && canAct;
  DS.devBr = {}; DS.brOK = {};
  if (KS.castles) Object.keys(KS.castles).forEach(function (k) { if (KS.castles[k].owner === KS.player) DS.brOK[k] = canAct; });
  // はじめに うつす はんい：えらんだ 城の まわり。⤢で 領地 ぜんぶ
  var hx = d[pid].hexes, x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
  if (C0) hx = hx.filter(function (h) { return regionAt(h[0], h[1]) === branchId; });
  hx.forEach(function (h) { var q = domXY(h[0], h[1]); x0 = Math.min(x0, q[0]); x1 = Math.max(x1, q[0]); y0 = Math.min(y0, q[1]); y1 = Math.max(y1, q[1]); });
  DS.bb = [x0 - 2, y0 - 2, x1 + 2, y1 + 2];
  var ax0 = 1e9, ax1 = -1e9, ay0 = 1e9, ay1 = -1e9; DS.myProvs = {};
  PROVS.forEach(function (p9) { d[p9.id].hexes.forEach(function (h) { if (regionOwner(KS, h[0], h[1]) !== KS.player) return; DS.myProvs[p9.id] = 1; var q = domXY(h[0], h[1]); ax0 = Math.min(ax0, q[0]); ax1 = Math.max(ax1, q[0]); ay0 = Math.min(ay0, q[1]); ay1 = Math.max(ay1, q[1]); }); });
  DS.bbAll = ax0 < 1e9 ? [ax0 - 2, ay0 - 2, ax1 + 2, ay1 + 2] : DS.bb;
  Object.keys(DS.myProvs).forEach(function (q) { if (!KS.provs[q].bld) initDomain(KS, q); });
  DS.canBuild = canAct && Object.keys(DS.myProvs).length > 0;
  // 担当の 奉行（政）：城主が あいていれば 城主、いなければ 政の いちばん 高い 家臣
  KS.curOff = null;
  if (DS.canBuild) { var fr0 = freeOfficers(KS, KS.player).filter(domOffOK).sort(function (a, b) { return b.st[1] - a.st[1]; }), h0 = officerAt(KS, pid); if (h0 && !domOffOK(h0)) h0 = null; KS.curOff = h0 && !offBusy(KS, h0) && h0.clan === KS.player ? h0.id : (fr0[0] ? fr0[0].id : null); }
  show('domScreen');
  var cv = $('dcv'); DS.cv = cv; DS.ctx = cv.getContext('2d');
  domResize(); DS.wide = Object.keys(DS.myProvs || {}).length > 1; domPanel(); var bL = DS.bb; if (DS.wide) DS.bb = DS.bbAll; domFit(); DS.bb = bL; domRender();   // はじめから 領地 ぜんぶを 見せる
}
// 内政の 奉行に なれる 家臣：この 国の 城か、いっしょに 内政する 支城に いる
function domOffOK(o) { return !!(o && o.clan === KS.player); }   // 内政の 奉行は どの 城の 家臣でも
function domXY(c, r) { return [(c + 0.5 * (r & 1)) * 1.7320508, r * 1.5]; }   // 半径1の ヘックス
function domResize() { var cv = DS.cv; DS.dpr = Math.min(2, window.devicePixelRatio || 1); DS.W = cv.offsetWidth; DS.H = cv.offsetHeight; cv.width = Math.round(DS.W * DS.dpr); cv.height = Math.round(DS.H * DS.dpr); }
function domArea() { var top = ($('dhud').offsetHeight || 50) + 4, bot = document.body.classList.contains('side') ? 4 : ($('dbottom').offsetHeight || 150) + 4; return { top: top, h: Math.max(80, DS.H - top - bot) }; }
function domFit() {
  var a = domArea(), bb = DS.bb, bw = bb[2] - bb[0], bh = bb[3] - bb[1];
  DS.s = Math.min(DS.W / bw, a.h / bh) * 0.96;
  // 小さすぎると タップしにくいので 城の まわりを 大きめに
  if (DS.s < 9 && !DS.wide) { DS.s = Math.min(16, Math.max(9, DS.s * 2.2)); var cas = DS.branch ? branchHexes()[DS.branch] : castleHex(DS.pid), q = domXY(cas[0], cas[1]); DS.x = DS.W / 2 - q[0] * DS.s; DS.y = a.top + a.h / 2 - q[1] * DS.s; return; }
  DS.x = (DS.W - bw * DS.s) / 2 - bb[0] * DS.s; DS.y = a.top + (a.h - bh * DS.s) / 2 - bb[1] * DS.s;
}
function domHexPath(c, x, y, r) { c.beginPath(); for (var i = 0; i < 6; i++) { var a = Math.PI / 180 * (60 * i - 30); var px = x + r * Math.cos(a), py = y + r * Math.sin(a); if (i) c.lineTo(px, py); else c.moveTo(px, py); } c.closePath(); }
// この 画面で その マスに たてて よいか（本国の 内政、または じぶんの 支城の 所領）
function domHexOK(cc, r) {
  var w = worldMap(), pv = w.provAt(cc, r); if (!pv || KS.phase !== 'player') return null;
  return regionOwner(KS, cc, r) === KS.player ? pv : null;   // じぶんの 領地なら どこでも
}
// ---- 地名（町・村・湖・島・山）。[名前, 経度, 緯度, しゅるい] ----
var GEO_NAMES = [
  // 安芸
  ['可部', 132.51, 34.52, 't'], ['廿日市', 132.33, 34.35, 't'], ['厳島', 132.32, 34.29, 'i'], ['草津', 132.40, 34.37, 't'], ['海田', 132.53, 34.37, 't'],
  ['西条', 132.74, 34.43, 't'], ['竹原', 132.91, 34.34, 't'], ['三原', 133.08, 34.40, 't'], ['向原', 132.70, 34.61, 'v'], ['千代田', 132.55, 34.68, 'v'],
  ['弥山', 132.32, 34.27, 'm'], ['吉田', 132.70, 34.665, 't'], ['甲田', 132.78, 34.62, 'v'], ['高宮', 132.63, 34.76, 'v'], ['美土里', 132.59, 34.82, 'v'],
  ['八千代', 132.56, 34.64, 'v'], ['白木', 132.67, 34.57, 'v'], ['志和', 132.62, 34.48, 'v'], ['河内', 132.83, 34.47, 'v'], ['豊栄', 132.87, 34.57, 'v'], ['大朝', 132.42, 34.77, 'v'],
  // 備後
  ['三次', 132.85, 34.80, 't'], ['庄原', 133.02, 34.86, 't'], ['東城', 133.27, 34.89, 't'], ['府中', 133.24, 34.57, 't'], ['尾道', 133.20, 34.41, 't'],
  ['鞆の浦', 133.38, 34.38, 't'], ['神辺', 133.38, 34.54, 't'], ['甲山', 133.06, 34.59, 'v'], ['吉舎', 132.95, 34.73, 'v'], ['西城', 133.18, 34.95, 'v'],
  // 周防・長門
  ['山口', 131.47, 34.18, 't'], ['防府', 131.57, 34.05, 't'], ['岩国', 132.22, 34.17, 't'], ['柳井', 132.10, 33.96, 't'], ['富田', 131.81, 34.05, 't'],
  ['萩', 131.40, 34.41, 't'], ['長府', 130.99, 33.99, 't'], ['錦', 131.97, 34.27, 'v'], ['大島', 132.25, 33.92, 'i'],
  // 石見
  ['益田', 131.84, 34.68, 't'], ['浜田', 132.08, 34.90, 't'], ['大森', 132.44, 35.11, 't'], ['温泉津', 132.34, 35.10, 't'], ['江津', 132.22, 35.01, 't'],
  ['川本', 132.49, 34.99, 'v'], ['津和野', 131.77, 34.47, 't'], ['大江高山', 132.40, 35.07, 'm'], ['邑智', 132.62, 34.88, 'v'],
  // 出雲
  ['広瀬', 133.18, 35.33, 't'], ['末次', 133.05, 35.47, 't'], ['杵築', 132.69, 35.40, 't'], ['平田', 132.80, 35.43, 't'], ['木次', 132.90, 35.29, 'v'],
  ['赤名', 132.71, 35.00, 'v'], ['美保関', 133.32, 35.56, 't'], ['安来', 133.25, 35.43, 't'], ['船通山', 133.17, 35.20, 'm'], ['宍道湖', 132.95, 35.45, 'l'], ['中海', 133.20, 35.47, 'l'],
  // 伯耆
  ['米子', 133.33, 35.43, 't'], ['倉吉', 133.82, 35.43, 't'], ['八橋', 133.62, 35.50, 'v'], ['根雨', 133.43, 35.28, 'v'], ['境', 133.23, 35.54, 't'], ['弓ヶ浜', 133.29, 35.49, 'v'],
  // 因幡
  ['鳥取', 134.24, 35.50, 't'], ['若桜', 134.40, 35.34, 'v'], ['智頭', 134.23, 35.27, 'v'], ['鹿野', 134.06, 35.46, 'v'], ['湖山池', 134.17, 35.50, 'l'],
  // 美作
  ['津山', 134.00, 35.07, 't'], ['勝山', 133.69, 35.09, 'v'], ['久世', 133.75, 35.07, 'v'], ['林野', 134.16, 34.99, 'v'],
  // 備前
  ['岡山', 133.92, 34.66, 't'], ['西大寺', 134.04, 34.66, 't'], ['牛窓', 134.15, 34.62, 't'], ['長船', 134.10, 34.68, 'v'], ['和気', 134.16, 34.80, 'v'], ['熊山', 134.12, 34.75, 'm'], ['児島', 133.85, 34.50, 'i'],
  // 備中
  ['松山', 133.62, 34.79, 't'], ['総社', 133.75, 34.67, 't'], ['倉敷', 133.77, 34.59, 't'], ['玉島', 133.66, 34.54, 't'], ['笠岡', 133.51, 34.50, 't'],
  ['新見', 133.47, 34.98, 't'], ['成羽', 133.55, 34.78, 'v'], ['鷲羽山', 133.81, 34.44, 'm'],
  // 隠岐
  ['西郷', 133.32, 36.20, 't'], ['島後', 133.32, 36.27, 'i'], ['島前', 133.05, 36.08, 'i']
];
// 経度・緯度 → 世界マップの マス
function llHex(lon, lat) { var w = worldMap(); return w.hexAtKm((lon - WORLD.lon0) * w.KX, (WORLD.lat0 - lat) * w.KY); }
// その マスに いちばん ちかい 町・村（6km いない）
function placeNear(c, r) {
  var best = null; GEO_NAMES.forEach(function (g) { if (g[3] !== 't' && g[3] !== 'v') return; var h = llHex(g[1], g[2]), dd = hexDist(c, r, h[0], h[1]); if (dd <= 6 && (!best || dd < best[1])) best = [g[0], dd]; });
  return best ? best[0] : null;
}
// 領内マップに 地名を かく（かさならない ように）
function domLabels(c, s, rects) {
  var W0 = DS.W, H0 = DS.H;
  function free(x, y, w, h) { for (var i = 0; i < rects.length; i++) { var q = rects[i]; if (x < q[0] + q[2] && x + w > q[0] && y < q[1] + q[3] && y + h > q[1]) return false; } return true; }
  function put(text, x, y, fz, col, opt) {
    opt = opt || {}; if (x < -60 || y < -30 || x > W0 + 60 || y > H0 + 30) return false;
    c.font = (opt.bold === false ? '' : 'bold ') + fz + 'px sans-serif'; var tw = c.measureText(text).width + 4, th = fz + 2;
    if (!opt.force && !free(x - tw / 2, y - th / 2, tw, th)) return false;
    rects.push([x - tw / 2, y - th / 2, tw, th]);
    c.save(); c.translate(x, y); if (opt.rot) c.rotate(opt.rot);
    c.textAlign = 'center'; c.textBaseline = 'middle'; c.lineJoin = 'round';
    c.lineWidth = opt.halo || 3.5; c.strokeStyle = opt.haloCol || 'rgba(255,255,255,0.9)'; c.strokeText(text, 0, 0); c.fillStyle = col; c.fillText(text, 0, 0); c.restore();
    return true;
  }
  function at(lon, lat) { var h = llHex(lon, lat), q = domXY(h[0], h[1]); return [DS.x + q[0] * s, DS.y + q[1] * s]; }
  var fz = Math.max(12, Math.min(17, s * 0.95));
  // 海・湖
  NEAR_LABELS.forEach(function (n) { if (!n[3]) return; var p = at(n[1], n[2]); put(n[0], p[0], p[1], fz * 1.5, 'rgba(30,70,140,0.75)', { bold: false, haloCol: 'rgba(255,255,255,0.35)', halo: 2 }); });
  GEO_NAMES.forEach(function (g) { if (g[3] !== 'l') return; var p = at(g[1], g[2]); put(g[0], p[0], p[1], fz * 1.2, '#1d4f9a', { haloCol: 'rgba(255,255,255,0.6)' }); });
  // 山（▲）
  (WORLD.peaks || []).map(function (pk) { return [pk.name, pk.at[0], pk.at[1]]; }).concat(GEO_NAMES.filter(function (g) { return g[3] === 'm'; })).forEach(function (g) {
    var p = at(g[1], g[2]); if (put('▲' + g[0], p[0], p[1] - fz * 0.4, fz, '#6a3a12')) { }
  });
  // 峠
  (WORLD.passes || []).forEach(function (ps) { var p = at(ps.at[0], ps.at[1]); put('⛰' + ps.name, p[0], p[1] + fz * 0.8, fz * 0.92, '#7a4a10'); });
  // 川（ながれに そって、ところどころ）
  (WORLD.rivers || []).forEach(function (rv) {
    var pts = rv.pts.map(function (q) { return at(q[0], q[1]); }), seg = [], L = 0, i;
    for (i = 1; i < pts.length; i++) { var dl = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); seg.push([pts[i - 1], pts[i], L, dl]); L += dl; }
    var step = Math.max(240, L / 3), done = 0;
    for (var pos = Math.min(L / 2, step / 2); pos < L && done < 4; pos += step) {
      for (i = 0; i < seg.length; i++) if (pos >= seg[i][2] && pos <= seg[i][2] + seg[i][3]) break;
      if (i >= seg.length) break;
      var a = seg[i][0], b = seg[i][1], f = (pos - seg[i][2]) / Math.max(1, seg[i][3]), x = a[0] + (b[0] - a[0]) * f, y = a[1] + (b[1] - a[1]) * f;
      var ang = Math.atan2(b[1] - a[1], b[0] - a[0]); if (ang > Math.PI / 2) ang -= Math.PI; if (ang < -Math.PI / 2) ang += Math.PI;
      if (put(rv.name, x, y, fz * 1.05, '#1559b8', { rot: ang, haloCol: 'rgba(235,245,255,0.95)' })) done++;
    }
  });
  // 町・村・島
  GEO_NAMES.forEach(function (g) {
    if (g[3] === 'l' || g[3] === 'm') return;
    var p = at(g[1], g[2]), big = g[3] === 't';
    if (g[3] !== 'i' && p[0] > -20 && p[1] > -20 && p[0] < W0 + 20 && p[1] < H0 + 20) { c.beginPath(); c.arc(p[0], p[1], big ? 4 : 3, 0, Math.PI * 2); c.fillStyle = big ? '#3a2410' : '#6a5440'; c.fill(); c.lineWidth = 1.5; c.strokeStyle = '#fff'; c.stroke(); }
    put(g[0], p[0], p[1] - fz * 0.85, big ? fz : fz * 0.88, g[3] === 'i' ? '#1d4f9a' : big ? '#2a1a0a' : '#4a3a2a', { bold: big || g[3] === 'i' });
  });
}
function domRender() {
  if (!DS.ctx) return;
  var c = DS.ctx, w = worldMap(), d = domData(), P = KS.provs[DS.pid], pid = DS.pid, cas = castleHex(pid);
  c.setTransform(DS.dpr, 0, 0, DS.dpr, 0, 0); c.fillStyle = '#3f7fb8'; c.fillRect(0, 0, DS.W, DS.H);
  var s = DS.s;
  // 見えている はんい
  var r0 = Math.floor((-DS.y / s) / 1.5) - 1, r1 = Math.ceil(((DS.H - DS.y) / s) / 1.5) + 1;
  var c0 = Math.floor((-DS.x / s) / 1.732) - 1, c1 = Math.ceil(((DS.W - DS.x) / s) / 1.732) + 1;
  r0 = Math.max(0, r0); c0 = Math.max(0, c0); r1 = Math.min(w.h - 1, r1); c1 = Math.min(w.w - 1, c1);
  var valid = {};
  for (var r = r0; r <= r1; r++) for (var cc = c0; cc <= c1; cc++) {
    var t = w.at(cc, r), pv = w.provAt(cc, r), q = domXY(cc, r), x = DS.x + q[0] * s, y = DS.y + q[1] * s, k = hkey(cc, r);
    var PV = pv ? KS.provs[pv] : null, ro = pv ? (regionOwner(KS, cc, r) || PV.owner) : null;
    var mine = pv === pid || ro === DS.who;   // この 国、または じぶんの 所領
    domHexPath(c, x, y, s * 1.02); c.fillStyle = TER_COL[t] || '#ccc'; c.fill();
    if (!pv && t !== 's') { c.fillStyle = 'rgba(70,60,50,0.45)'; c.fill(); }
    if (pv && s >= 8) {
      var im = t === 'f' ? gx('forest') : (t === 'm' || t === 'M') ? gx(t === 'M' ? 'snow' : 'mount') : t === 'h' ? gx('hill') : null;
      if (im && !(PV.bld && PV.bld[k])) { var ww = s * 1.9, hh = ww * im.naturalHeight / im.naturalWidth; c.drawImage(im, x - ww / 2, y + s * 0.75 - hh, ww, hh); }
    }
    if (PV && PV.bld && PV.bld[k] === 'field') { domHexPath(c, x, y, s * 0.98); c.fillStyle = '#e9cf5a'; c.fill(); c.strokeStyle = 'rgba(150,110,20,0.6)'; c.lineWidth = 1; for (var li = -2; li <= 2; li++) { c.beginPath(); c.moveTo(x - s * 0.7, y + li * s * 0.28); c.lineTo(x + s * 0.7, y + li * s * 0.28); c.stroke(); } }
    if (pv && ro !== DS.who) { domHexPath(c, x, y, s * 1.02); c.fillStyle = CLANS[ro] ? CLANS[ro].color : '#888'; c.globalAlpha = pv === pid ? 0.4 : 0.3; c.fill(); c.fillStyle = '#2a2018'; c.globalAlpha = pv === pid ? 0.25 : 0.45; c.fill(); c.globalAlpha = 1; }
    var hp = DS.mode && DS.canBuild ? domHexOK(cc, r) : null;
    if (hp) { var ok = canBuild(KS, hp, cc, r, DS.mode, DS.who).ok; if (ok) { valid[k] = 1; domHexPath(c, x, y, s * 0.9); c.fillStyle = 'rgba(80,230,120,0.45)'; c.fill(); c.strokeStyle = '#fff'; c.lineWidth = Math.max(1, s * 0.08); c.stroke(); } }
  }
  // 国ざかい
  c.strokeStyle = 'rgba(120,20,20,0.85)'; c.lineWidth = Math.max(1.5, s * 0.14);
  for (r = r0; r <= r1; r++) for (cc = c0; cc <= c1; cc++) {
    if (w.provAt(cc, r) !== pid) continue;
    var nb = hexNbs(cc, r), q2 = domXY(cc, r);
    for (var j = 0; j < 6; j++) { if (w.provAt(nb[j][0], nb[j][1]) === pid) continue; var q3 = domXY(nb[j][0], nb[j][1]), mx = (q2[0] + q3[0]) / 2, my = (q2[1] + q3[1]) / 2, vx = q3[0] - q2[0], vy = q3[1] - q2[1], L = Math.hypot(vx, vy); c.beginPath(); c.moveTo(DS.x + (mx - vy / L * 0.58) * s, DS.y + (my + vx / L * 0.58) * s); c.lineTo(DS.x + (mx + vy / L * 0.58) * s, DS.y + (my - vx / L * 0.58) * s); c.stroke(); }
  }
  // 所領の さかい（本城・支城ごと）
  c.lineWidth = Math.max(1.5, s * 0.16); c.setLineDash([Math.max(3, s * 0.4), Math.max(2, s * 0.3)]);
  for (r = r0; r <= r1; r++) for (cc = c0; cc <= c1; cc++) {
    var pa = w.provAt(cc, r); if (!pa) continue;
    var rg = regionAt(cc, r), nb2 = hexNbs(cc, r), qa = domXY(cc, r);
    for (var j2 = 0; j2 < 3; j2++) { var n2 = [nb2[0], nb2[4], nb2[5]][j2], pb = w.provAt(n2[0], n2[1]); if (!pb || regionAt(n2[0], n2[1]) === rg) continue;
      var oa = regOwnerOf(KS, rg) || KS.provs[pa].owner, ob = regOwnerOf(KS, regionAt(n2[0], n2[1])) || KS.provs[pb].owner;
      if (pa !== pb && oa === ob) continue;   // 国ざかいは べつに かく
      if (pa !== pid && pb !== pid && oa !== DS.who && ob !== DS.who) continue;
      c.strokeStyle = oa !== ob ? '#fff36a' : 'rgba(255,255,255,0.55)';
      var qb = domXY(n2[0], n2[1]), mx2 = (qa[0] + qb[0]) / 2, my2 = (qa[1] + qb[1]) / 2, vx2 = qb[0] - qa[0], vy2 = qb[1] - qa[1], L2 = Math.hypot(vx2, vy2);
      c.beginPath(); c.moveTo(DS.x + (mx2 - vy2 / L2 * 0.58) * s, DS.y + (my2 + vx2 / L2 * 0.58) * s); c.lineTo(DS.x + (mx2 + vy2 / L2 * 0.58) * s, DS.y + (my2 - vx2 / L2 * 0.58) * s); c.stroke(); }
  }
  c.setLineDash([]);
  // 建物・鉱脈・城
  c.textAlign = 'center'; c.textBaseline = 'middle';
  var fs = Math.max(9, s * 1.15);
  function icon(cc2, rr2, txt, bg) { var q4 = domXY(cc2, rr2), x2 = DS.x + q4[0] * s, y2 = DS.y + q4[1] * s; if (x2 < -s || y2 < -s || x2 > DS.W + s || y2 > DS.H + s) return; if (bg) { c.beginPath(); c.arc(x2, y2, s * 0.8, 0, Math.PI * 2); c.fillStyle = bg; c.fill(); } c.font = fs + 'px sans-serif'; c.fillText(txt, x2, y2 + 1); }
  var dep = d[pid].dep;
  for (var dk in dep) { var p0 = dk.split(',').map(Number); if (!(P.bld && P.bld[dk])) { icon(p0[0], p0[1], '◆', 'rgba(255,255,255,0.75)'); c.fillStyle = '#7a2fb0'; } }
  var visP = {}; visP[pid] = 1; Object.keys(DS.myProvs || {}).forEach(function (k9) { visP[k9] = 1; });
  Object.keys(visP).forEach(function (vp) { if (vp === pid) return; var dp = d[vp].dep, PV = KS.provs[vp]; for (var dk2 in dp) { var p02 = dk2.split(',').map(Number); if (!(PV.bld && PV.bld[dk2]) && regionOwner(KS, p02[0], p02[1]) === KS.player) icon(p02[0], p02[1], '◆', 'rgba(255,255,255,0.75)'); } });
  Object.keys(visP).forEach(function (vp) { var PB = KS.provs[vp]; for (var bk in (PB.bld || {})) { var b = PB.bld[bk], p1 = bk.split(',').map(Number); if (vp !== pid && regionOwner(KS, p1[0], p1[1]) !== DS.who) continue; if (b === 'field') { if (s >= 14) icon(p1[0], p1[1], '🌾'); continue; }
      if (b === 'toride' && gx('castle_toride')) { var ti = gx('castle_toride'), q9 = domXY(p1[0], p1[1]), tw9 = s * 2.2, th9 = tw9 * ti.naturalHeight / ti.naturalWidth; c.drawImage(ti, DS.x + q9[0] * s - tw9 / 2, DS.y + q9[1] * s + s * 0.6 - th9, tw9, th9); continue; }
      icon(p1[0], p1[1], BLD[b === 'town0' ? 'town' : b].icon, 'rgba(255,250,235,0.85)'); } });
  // 支城（持ち主の いろの わく と 名前）
  var bhx = branchHexes() || {};
  DS.ctaps = [];
  function castleTag(h, name, own, big, art, key) {
    var q7 = domXY(h[0], h[1]), x7 = DS.x + q7[0] * s, y7 = DS.y + q7[1] * s, rr7 = s * (big ? 0.95 : 0.85), im7 = art ? gx(art) : null;
    var tw0 = s * (big ? 2.8 : 2.1), th0 = s * (big ? 4.2 : 3.2);
    if (im7) { tw0 = s * (big ? 5.6 : 4.2) * 0.85; th0 = tw0 / 0.85 * im7.naturalHeight / im7.naturalWidth; }
    if (key) DS.ctaps.push({ key: key, x: x7, y: y7, w: tw0, h: th0, own: own });
    if (im7) {   // 城の 絵：足もとに 持ち主の いろ
      var aw7 = s * (big ? 5.6 : 4.2), ah7 = aw7 * im7.naturalHeight / im7.naturalWidth;
      c.fillStyle = own && CLANS[own] ? CLANS[own].color : '#888'; c.globalAlpha = 0.7; c.beginPath(); c.ellipse(x7, y7 + s * 0.35, aw7 * 0.44, s * 0.45, 0, 0, Math.PI * 2); c.fill(); c.globalAlpha = 1;
      c.drawImage(im7, x7 - aw7 / 2, y7 + s * 0.55 - ah7, aw7, ah7);
      rr7 = ah7 - s * 0.55;
    } else {
    c.beginPath(); c.arc(x7, y7, rr7, 0, Math.PI * 2); c.fillStyle = 'rgba(255,250,235,0.95)'; c.fill(); c.lineWidth = Math.max(2, s * 0.2); c.strokeStyle = own && CLANS[own] ? CLANS[own].color : '#888'; c.stroke();
    c.font = Math.max(9, s * (big ? 1.15 : 1)) + 'px sans-serif'; c.fillStyle = '#000'; c.fillText(big ? '🏯' : '🏰', x7, y7 + 1);
    }
    var fz = Math.max(10, Math.min(16, s * 0.8)); c.font = 'bold ' + fz + 'px sans-serif'; c.lineWidth = 3; c.strokeStyle = '#fff';
    var lab = name + (own && CLANS[own] ? '（' + CLANS[own].name + '）' : ''); c.strokeText(lab, x7, y7 - rr7 - fz * 0.7); c.fillStyle = own && CLANS[own] ? '#2a1a0a' : '#555'; c.fillText(lab, x7, y7 - rr7 - fz * 0.7);
    var tw7 = c.measureText(lab).width; lrects.push([x7 - tw7 / 2 - 2, y7 - rr7 - fz * 1.3, tw7 + 4, fz + 4], [x7 - rr7, y7 - rr7, rr7 * 2, rr7 * 2]);
  }
  var lrects = [];
  // 見えている 国の 城を ぜんぶ（本城・支城）
  PROVS.forEach(function (p9) {
    var ch = castleHex(p9.id); if (ch && ch[1] >= r0 - 2 && ch[1] <= r1 + 2 && ch[0] >= c0 - 2 && ch[0] <= c1 + 2) castleTag(ch, castleNameOf(KS, p9.id), KS.provs[p9.id].owner, true, castleArtOf(KS, p9.id, null), p9.id);
    branchesIn(KS, p9.id).forEach(function (c8) { var h8 = bhx[c8.id]; if (h8 && h8[1] >= r0 - 2 && h8[1] <= r1 + 2 && h8[0] >= c0 - 2 && h8[0] <= c1 + 2) castleTag(h8, brName(c8.id), c8.owner || KS.provs[p9.id].owner, false, castleArtOf(KS, p9.id, c8.id), c8.id); });
  });
  // 地名（山・川・峠・町・湖）
  domLabels(c, s, lrects);
  c.textAlign = 'center'; c.textBaseline = 'middle';
  // 鉱脈の 名前
  if (s >= 10) for (dk in dep) { var p2 = dk.split(',').map(Number), q5 = domXY(p2[0], p2[1]); c.font = 'bold ' + Math.max(10, s * 0.75) + 'px sans-serif'; c.lineWidth = 3; c.strokeStyle = '#fff'; c.strokeText(dep[dk].name, DS.x + q5[0] * s, DS.y + (q5[1] + 1.25) * s); c.fillStyle = '#5a1f80'; c.fillText(dep[dk].name, DS.x + q5[0] * s, DS.y + (q5[1] + 1.25) * s); }
  // えらんだ マス
  if (DS.sel) { var q6 = domXY(DS.sel[0], DS.sel[1]); domHexPath(c, DS.x + q6[0] * s, DS.y + q6[1] * s, s * 0.98); c.strokeStyle = '#ffe24a'; c.lineWidth = Math.max(2, s * 0.18); c.stroke(); }
  // カーソルが のっている じぶんの 城：白い わく
  var hv = DS.hover && (DS.ctaps || []).filter(function (t) { return t.key === DS.hover; })[0];
  if (hv) { var x0 = hv.x - hv.w / 2 - 3, y0 = hv.y - hv.h + DS.s * 0.6 - 3, ww = hv.w + 6, hh = hv.h + DS.s * 0.3 + 6;
    c.save(); c.shadowColor = 'rgba(0,0,0,0.6)'; c.shadowBlur = 6; c.strokeStyle = '#fff'; c.lineWidth = 3; c.strokeRect(x0, y0, ww, hh); c.shadowBlur = 0; c.fillStyle = 'rgba(255,255,255,0.14)'; c.fillRect(x0, y0, ww, hh);
    c.font = 'bold 12px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'top'; c.fillStyle = '#fff'; c.strokeStyle = 'rgba(0,0,0,0.7)'; c.lineWidth = 3; var tip = 'タップで 徴兵・家臣'; c.strokeText(tip, hv.x, y0 + hh + 3); c.fillText(tip, hv.x, y0 + hh + 3); c.restore(); }
  DS.valid = valid;
}
function domPanel() {
  var P = KS.provs[DS.pid], pid = DS.pid, w = worldMap(), d = domData();
  var who = DS.who, regs = provRegions(KS, pid).filter(function (g) { return g.owner === who; }), fsh = 0, nF = 0;
  regs.forEach(function (g) { fsh += g.fshare; nF += g.fields; });
  var sp = provSplit(KS, pid, false), nen = nenguOf(KS, pid, who);
  $('dTitle').textContent = '🗾 ' + CLANS[KS.player].name + 'の 領地（' + (DS.branch ? brName(DS.branch) : PROV_BY[pid].name) + ' ふきん）';
  $('dStat').textContent = '💰' + kan(KS.clans[KS.player].gold) + '　🌾' + Math.round(P.koku * fsh * 10) / 10 + '万石（田畑 ' + nF + '）　秋の 年貢 約' + kan(nen) + '　🏘 +' + kan(Math.max(0, (sp[who] || 0))) + '/きせつ';
  var info = '';
  if (DS.sel) {
    var spv = w.provAt(DS.sel[0], DS.sel[1]) || pid, SP = KS.provs[spv];
    var k = hkey(DS.sel[0], DS.sel[1]), t = w.at(DS.sel[0], DS.sel[1]), b = SP.bld && SP.bld[k], dep = d[spv].dep[k], cas = castleHex(spv);
    var pn = placeNear(DS.sel[0], DS.sel[1]);
    info = '<b>' + (TER_NAME[t] || '') + '</b>' + (spv !== pid ? '　<small>' + PROV_BY[spv].name + '</small>' : '') + (pn ? '　<small>📍' + pn + 'の あたり</small>' : '');
    if (DS.sel[0] === cas[0] && DS.sel[1] === cas[1]) info += '　🏯 ' + castleNameOf(KS, spv);
    if (b) info += '　' + (b === 'town0' ? '🏘 城下町' : BLD[b].icon + ' ' + BLD[b].name + (b === 'meibutsu' ? '（' + MEIBUTSU[spv] + '）' : b === 'mine' && dep ? '（' + MINE_NAME[dep.type] + '・+' + kan(MINE_INC[dep.type]) + '/きせつ）' : ''));
    if (dep && !b) info += '　◆ 鉱脈：' + dep.name + '（' + MINE_NAME[dep.type] + '）';
    var ro2 = regionAt(DS.sel[0], DS.sel[1]); if (ro2 && w.provAt(DS.sel[0], DS.sel[1])) { var ow2 = regOwnerOf(KS, ro2) || SP.owner; info += '　<small>（' + (ro2.indexOf('_') > 0 ? brName(ro2) : castleNameOf(KS, spv)) + 'の 所領・' + (CLANS[ow2] ? CLANS[ow2].name : '') + '）</small>'; }
    if (DS.mode && DS.canBuild) { var hp1 = domHexOK(DS.sel[0], DS.sel[1]); var ch = hp1 ? canBuild(KS, hp1, DS.sel[0], DS.sel[1], DS.mode, DS.who) : { ok: false, msg: 'ここは じぶんの 領地では ない' }; if (!ch.ok && ch.msg) info += '<br><span style="color:#ffb0a0">' + ch.msg + '</span>'; }
  } else info = DS.canBuild ? (DS.mode ? 'みどりの マスを タップすると ' + BLD[DS.mode].name + 'を たてる。' + BLD[DS.mode].desc : 'たてたい ものを えらんで、マップの みどりの マスを タップ。いくつでも たてられる（お金の かぎり）。') :
    'いまは 見るだけ（ほかの 大名の ばん）。';
  // 担当の 奉行
  if (DS.canBuild) {
    var fr1 = officersOf(KS, KS.player).filter(function (o) { return (!offBusy(KS, o) || o.id === KS.curOff) && domOffOK(o); }).sort(function (a, b) { return b.st[1] - a.st[1]; });
    var co = KS.curOff && KS.officers[KS.curOff];
    info = '<div class="koffpick">🧑‍💼 奉行（政）：<select id="dOff">' + (fr1.length ? fr1.map(function (o) { return '<option value="' + o.id + '"' + (o.id === KS.curOff ? ' selected' : '') + '>' + (premiumP(o.st[1]) > 0 ? '★' : '') + o.name + '（政' + o.st[1] + '）</option>'; }).join('') : '<option value="">この 城に あいている 家臣なし</option>') + '</select><small>' + (co ? offPremTxt(co, 1) + '（田畑は 石高 倍・ほかは 費用 半分 もどる）' : '') + '</small></div>' + info;
  }
  var brL = Object.keys(DS.brOK || {}).filter(function (k2) { return k2 !== DS.branch; });
  if (!DS.sel && DS.canBuild) info += '<br><small>🗾 <b>領地 ぜんぶ</b>（本城・支城の 所領、' + Object.keys(DS.myProvs || {}).length + 'か国）で たてられる。めいれいは つかわない（お金の かぎり）。⤢で 領地 ぜんぶを 見る。</small>';
  if (!DS.sel) info += '<br><small>🏯 じぶんの 城を タップすると、その 城の 徴兵・家臣の 配置が できる。</small>';
  if (DS.canBuild && !DS.sel) info += '<br><small>くらい ところは ほかの 家の 土地。黄色い 点線が 持ち主の さかい。</small>';
  if (DS.built) info += '<br><small>この 内政で たてた もの：' + DS.built + 'つ（↩で とりけし できる）</small>';
  $('dInfo').innerHTML = info;
  if ($('dOff')) $('dOff').onchange = function () { KS.curOff = $('dOff').value || null; domPanel(); domRender(); };
  var acts = $('dActs'); acts.innerHTML = '';
  var bk = document.createElement('button'); bk.className = 'dbld dback'; bk.innerHTML = '↩ 地図へ もどる<small>国取りの 地図に もどる</small>'; bk.onclick = function () { SFX.tap(); closeDomain(); }; acts.appendChild(bk);
  if (!DS.canBuild) return;
  // 城の 改築（この 国の 本城 / 支城の 所領なら その 支城）
  var upC = DS.branch || null, upOK = DS.branch ? (DS.brOK[DS.branch] || DS.devBr[DS.branch]) : DS.provOK;
  // こわれた 城は さきに なおす（いつでも できる）
  [[pid, null]].concat(Object.keys(KS.castles || {}).filter(function (k) { var C9 = KS.castles[k]; return C9.owner === KS.player && (C9.prov === pid || DS.brOK[k] !== undefined); }).map(function (k) { return [KS.castles[k].prov, k]; })).forEach(function (pc) {
    if (!isRuined(KS, pc[0], pc[1]) || (!pc[1] && KS.provs[pc[0]].owner !== KS.player)) return;
    var rc = repairCost(KS, pc[0], pc[1]), rb = document.createElement('button'); rb.className = 'dbld'; rb.style.background = '#ffe0c0'; rb.disabled = KS.clans[KS.player].gold < rc;
    rb.innerHTML = '🔨 ' + (pc[1] ? brName(pc[1]) : castleNameOf(KS, pc[0])) + 'を なおす<small>💰' + kan(rc) + '・🔥こわれた 石垣と 門</small>';
    rb.onclick = function () { SFX.tap(); kSnap('城の 修理'); var r = repairCastle(KS, pc[0], pc[1]); if (!r.ok) { kUndoStack.pop(); banner(r.msg, 1200); return; } SFX.repair && SFX.repair(); logC(KS, (pc[1] ? brName(pc[1]) : castleNameOf(KS, pc[0])) + 'を なおした（💰' + kan(r.cost) + '）', 'good'); kSave(); domPanel(); domRender(); };
    acts.appendChild(rb);
  });
  if (upOK) {
    var cu = canUpgrade(KS, pid, upC, KS.player), lv0 = castleLv(KS, pid, upC), ub = document.createElement('button');
    ub.className = 'dbld'; ub.disabled = !cu.ok;
    ub.innerHTML = '🏯 ' + (upC ? brName(upC) : castleNameOf(KS, pid)) + 'を 改築 Lv' + lv0 + (lv0 < CASTLE_LV_MAX ? '→' + (lv0 + 1) : '') + '<small>' + (lv0 < CASTLE_LV_MAX ? '💰' + kan(upgradeCost(KS, pid, upC)) + '・石垣と 門が かたく' : 'いちばん 上') + '</small>';
    ub.onclick = function () { SFX.tap(); if (!DS.snapped) { kSnap('内政'); DS.snapped = true; } DS.stack = DS.stack || []; DS.stack.push(serialize(KS)); var r = upgradeCastle(KS, pid, upC, KS.player); if (!r.ok) { DS.stack.pop(); banner(r.msg, 1400); return; } if (upC) DS.devBr[upC] = 1; DS.built++; SFX.repair && SFX.repair(); logC(KS, (upC ? brName(upC) : castleNameOf(KS, pid)) + 'を 改築した（Lv' + r.lv + '）', 'good'); kSave(); domPanel(); domRender(); };
    acts.appendChild(ub);
  }
  // ボタンは 領地 ぜんぶで かぞえる（どこかで たてられれば えらべる）
  var myP = Object.keys(DS.myProvs || {}); if (!myP.length) myP = [pid];
  function mineIn(q, h) { return regionOwner(KS, h[0], h[1]) === who; }
  ['field', 'town', 'mine', 'meibutsu', 'salt', 'saku', 'hori', 'toride'].forEach(function (type) {
    var B0 = BLD[type], cnt = 0, deps = 0, sea = false, townLeft = 0, meis = [];
    myP.forEach(function (q) {
      cnt += bldCountIn(KS, q, who, type);
      if (type === 'mine') Object.keys(d[q].dep).forEach(function (dk) { var h = dk.split(',').map(Number); if (mineIn(q, h) && !(KS.provs[q].bld && KS.provs[q].bld[dk])) deps++; });
      if (type === 'salt' && !sea) sea = d[q].hexes.some(function (h) { return mineIn(q, h) && nearAny(h[0], h[1], 1, function (c, r) { return w.at(c, r) === 's'; }); });
      if (type === 'town') townLeft += Math.max(0, Math.floor(bldCountIn(KS, q, who, 'field') / FIELDS_PER_TOWN) - bldCountIn(KS, q, who, 'town'));
      if (type === 'meibutsu' && MEIBUTSU[q] && meis.indexOf(MEIBUTSU[q]) < 0) meis.push(MEIBUTSU[q]);
    });
    var any = type === 'mine' ? deps > 0 : type === 'salt' ? sea : true;
    var cost = bldCost(KS, pid, type, -1, -1, who);   // 平地の ねだん（森・丘は たかい）
    var b = document.createElement('button'); b.className = 'dbld' + (DS.mode === type ? ' on' : ''); b.disabled = !any;
    var sub = type === 'meibutsu' ? meis.slice(0, 3).join('・') : type === 'field' ? '石高 +0.5' : type === 'town' ? '+' + kan(B0.inc) + '・あと ' + townLeft : type === 'mine' ? (any ? '鉱脈 ' + deps + 'か所' : '鉱脈なし') : type === 'salt' ? (any ? '+' + kan(B0.inc) : '海が ない') : B0.war ? (type === 'toride' ? '合戦で 小さな 城に' : type === 'saku' ? '合戦で てきの 足どめ' : '合戦で わたりにくい') : '+' + kan(B0.inc);
    b.innerHTML = B0.icon + ' ' + B0.name + (cnt ? '×' + cnt : '') + '<small>💰' + kan(cost) + '・' + sub + '</small>';
    b.onclick = function () { SFX.tap(); DS.mode = DS.mode === type ? null : type; domPanel(); if (DS.mode && !DS.wide) { DS.wide = true; var b0 = DS.bb; DS.bb = DS.bbAll; domFit(); DS.bb = b0; } domRender(); };
    acts.appendChild(b);
  });
  if (DS.built) { var u = document.createElement('button'); u.className = 'act undo'; u.textContent = '↩ もどす'; u.onclick = function () { SFX.tap(); domUndo(); }; acts.appendChild(u); }
}
function domTap(sx, sy) {
  var wx = (sx - DS.x) / DS.s, wy = (sy - DS.y) / DS.s, r = Math.round(wy / 1.5), c = Math.round(wx / 1.7320508 - 0.5 * (r & 1));
  // いちばん 近い ヘックスを さがす
  var best = null; [[c, r]].concat(hexNbs(c, r)).forEach(function (h) { var q = domXY(h[0], h[1]), dd = Math.hypot(q[0] - wx, q[1] - wy); if (!best || dd < best[2]) best = [h[0], h[1], dd]; });
  // 城を タップ：その 城の 徴兵・家臣（たてる ものを えらんで いて、たてられる マスなら たてる ほうを さき）
  var onValid = DS.mode && DS.canBuild && DS.valid && DS.valid[hkey(best[0], best[1])];
  if (!onValid && DS.ctaps) { var hit = domCastleAt(sx, sy);
    if (hit) { SFX.tap(); kDomCastleBox(hit.key); return; } }
  DS.sel = [best[0], best[1]];
  if (DS.mode && DS.canBuild && DS.valid && DS.valid[hkey(best[0], best[1])]) {
    if (!DS.snapped) { kSnap('内政'); DS.snapped = true; DS.snapIdx = kUndoStack.length; }
    DS.stack = DS.stack || []; DS.stack.push(serialize(KS));
    var hp0 = domHexOK(best[0], best[1]), rg0 = regionAt(best[0], best[1]), isBr = rg0 && DS.brOK[rg0] !== undefined;
    var r0 = build(KS, hp0, best[0], best[1], DS.mode, DS.who);
    if (r0.ok) { DS.built++; if (isBr) DS.devBr[rg0] = 1; SFX.repair && SFX.repair(); logC(KS, (isBr ? brName(rg0) + 'の 所領' : PROV_BY[hp0].name) + 'に ' + BLD[DS.mode].name + 'を たてた（💰' + kan(r0.cost) + '）', 'good');
      if (r0.premium) { var bn = KS.officers[KS.curOff] ? KS.officers[KS.curOff].name : ''; var pt = DS.mode === 'field' ? '石高が 倍 ふえた（+1万石）' : '費用が 半分 もどった'; logC(KS, '★ 大成功！ ' + bn + 'の はたらきで ' + pt, 'good'); banner('★ 大成功！ ' + pt, 1400); }
      kSave(); }
    else DS.stack.pop();
  }
  domPanel(); domRender();
}
// 領内の 中で ひとつ ずつ もどす
function domUndo() {
  if (!DS.stack || !DS.stack.length) return;
  var S2 = deserialize(DS.stack.pop()); if (!S2) return;
  KS = S2; DS.built = Math.max(0, DS.built - 1);
  if (!DS.built && DS.snapped) { kUndoStack.pop(); DS.snapped = false; }
  kSave(); domPanel(); domRender();
}
// 内政画面で 城を タップ：守備兵・徴兵・家臣の 配置
function kDomCastleBox(loc) {
  var isC = !!KS.castles[loc], C0 = isC ? KS.castles[loc] : null, pid = isC ? C0.prov : loc, P = KS.provs[pid];
  var units = isC ? C0.units : P.units, nm = isC ? brName(loc) : castleNameOf(KS, pid), cap = isC ? 8 : PROV_CAP, ph = KS.phase === 'player';
  var offs = officersOf(KS, KS.player).filter(function (o) { return o.at === loc; });
  var recDone = isC ? C0.rec === KS.turn : (didCmd(P, 'recruit') || P.acted || cmdFull(P));
  var back = function () { kDomCastleBox(loc); domPanel(); domRender(); };
  var h = '<div class="kintro">' + crestHtml(KS.player, 44) + '<p><b>' + nm + '</b>（' + PROV_BY[pid].name + (isC ? 'の 支城' : 'の 本城') + '）</p></div>' +
    repairRowHtml(pid, isC ? loc : null, ph) + '<h4>守備兵（' + units.length + '/' + cap + '隊）</h4>' + garrisonHtml(units) + mergeRowHtml(units, ph) +
    '<h4>👤 この 城に いる 家臣</h4>' + (offs.length ? offs.map(function (o) {
      return '<div class="kbrow"><span class="kbrn"><b>' + o.name + '</b>' + (o.prov === loc ? '（城主）' : '') + '<br><small>武' + o.st[0] + ' 政' + o.st[1] + ' 智' + o.st[2] + (offBusy(KS, o) ? '・✓この きせつ はたらいた' : '') + '</small></span>' +
        (ph && !offBusy(KS, o) && locsOf(KS, KS.player).length > 1 ? '<button class="kmini sub" data-omv="' + o.id + '">🚶 ほかの 城へ</button>' : '') + '</div>'; }).join('') : '<p class="small">いない</p>') +
    (isC ? '' : '<p class="small">城主：' + offTxt(officerAt(KS, pid)) + '</p>') + linkSectionHtml(loc, ph);
  var btns = [];
  if (ph) {
    btns.push({ label: '🪖 この 城で 徴兵' + (recDone ? '✓' : ''), cls: 'act', disabled: recDone || units.length >= cap && !units.some(function (u) { return u.hp < 10; }), fn: function () { kRecruitBox(pid, isC ? loc : null, back); } });
    btns.push({ label: '👤 家臣を よぶ', cls: 'act', fn: function () { kCallOffBox(loc, back); } });

    if (!isC) btns.push({ label: '🎖 城主を えらぶ', cls: 'act sub', fn: function () { kAssignBox(pid, back); } });
  }
  btns.push({ label: 'とじる', cls: 'act sub', fn: function () { kCloseModal(); domPanel(); domRender(); } });
  kModal((isC ? '🏰 ' : '🏯 ') + nm, h, btns);
  bindMerge(units, nm, back); bindRepair(pid, isC ? loc : null, back); bindLinkSection(loc, back);
  [].forEach.call($('kBody').querySelectorAll('[data-omv]'), function (e) { e.onclick = function () { SFX.tap(); kOffMoveBox(e.dataset.omv, back); }; });
}
// この 城へ 家臣を よぶ（よばれた 家臣は この きせつ はたらけない）
function kCallOffBox(loc, back) {
  var nm = KS.castles[loc] ? brName(loc) : castleNameOf(KS, loc);
  var list = officersOf(KS, KS.player).filter(function (o) { return o.at !== loc; }).sort(function (a, b) { return (b.st[0] + b.st[1] + b.st[2]) - (a.st[0] + a.st[1] + a.st[2]); });
  var h = '<p class="small">' + nm + 'へ うつす 家臣を えらぶ。うつった きせつは もう はたらけない。城主だった 家臣を よぶと、もとの 城は 城主なしに なる。</p><div class="koffs">';
  list.forEach(function (o) { var bz = offBusy(KS, o);
    h += '<button class="koff" data-o="' + o.id + '"' + (bz ? ' disabled style="opacity:.5"' : '') + '><b>' + o.name + (o.lord ? '（大名）' : '') + '</b><small>武' + o.st[0] + ' 政' + o.st[1] + ' 智' + o.st[2] + '　📍' + locName(KS, o.at) + (o.prov ? '（城主）' : '') + (bz ? '・✓はたらいた' : '') + '</small></button>'; });
  h += list.length ? '</div>' : '</div><p class="small">ほかの 城に 家臣は いない。</p>';
  kModal('👤 ' + nm + 'へ 家臣を よぶ', h, [{ label: 'もどる', cls: 'act sub', fn: back }]);
  [].forEach.call($('kBody').querySelectorAll('[data-o]'), function (e) { e.onclick = function () { SFX.tap(); var o = KS.officers[e.dataset.o]; kSnap('家臣の 移動');
    if (!moveOfficer(KS, o.id, loc)) { kUndoStack.pop(); return; } logC(KS, o.name + 'が ' + locLong(KS, loc) + 'へ うつった', 'good'); kSave(); back(); }; });
}
function closeDomain() { DS.ctx = null; DS.stack = []; kMode = 'idle'; if (KS) KS.curOff = null; openMap(); }
function domCastleAt(sx, sy) {
  return (DS.ctaps || []).filter(function (t) { return t.own === KS.player && sx > t.x - t.w / 2 && sx < t.x + t.w / 2 && sy > t.y - t.h + DS.s * 0.6 && sy < t.y + DS.s * 0.9; })[0] || null;
}
function initDomainInput() {
  var cv = $('dcv');
  cv.addEventListener('mousemove', function (e) {
    if (e.buttons || !KS || !DS.ctx) return;
    var ep = evPt(e, cv), h = domCastleAt(ep[0], ep[1]), k = h ? h.key : null;
    var onV = DS.mode && DS.valid; cv.style.cursor = h ? 'pointer' : '';
    if (k !== DS.hover) { DS.hover = k; domRender(); }
  });
  cv.addEventListener('mouseleave', function () { if (DS.hover) { DS.hover = null; domRender(); } });
  panZoom(cv, {
    cam: function () { return { x: DS.x, y: DS.y, s: DS.s }; }, minS: 3, maxS: 60,
    set: function (x, y, s) { DS.x = x; DS.y = y; DS.s = s; },
    after: function () { domRender(); },
    tap: function (x, y) { domTap(x, y); }
  });
  $('dDoneBtn').onclick = function () { SFX.tap(); closeDomain(); };
  $('dFitBtn').onclick = function () { SFX.tap(); DS.wide = !DS.wide; var b0 = DS.bb; if (DS.wide && DS.bbAll) DS.bb = DS.bbAll; domFit(); DS.bb = b0; domRender(); };
  window.addEventListener('resize', function () { if (DS.ctx && $('domScreen').classList.contains('on')) { domResize(); domRender(); } });
}
