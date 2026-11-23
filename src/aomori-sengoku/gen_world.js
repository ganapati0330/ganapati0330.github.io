'use strict';
// 北奥羽 世界ヘックス地図の 生成（ビルド時に 1回）
//  海陸・国＝国土数値情報（geo.js）、標高＝尾根・峠・山・川・湖の モデル（実測の 標高データでは ない）
var fs = require('fs'), vm = require('vm');
var ctx = { console: console, Math: Math };
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(__dirname + '/geo.js', 'utf8'), ctx);
var GEO = ctx.CHUGOKU_GEO;
var PROVS = ['oura', 'ishikawa', 'daikoji', 'namioka', 'iizume', 'sotogahama', 'tanabu', 'shichinohe', 'gonohe', 'hachinohe', 'sannohe', 'kunohe', 'iwate', 'shiwa', 'hei', 'kazuno', 'hinai', 'hiyama', 'minato'];
var PNAME = { oura: '大浦', ishikawa: '石川', daikoji: '大光寺', namioka: '浪岡', iizume: '飯詰', sotogahama: '外ヶ浜', tanabu: '田名部', shichinohe: '七戸', gonohe: '五戸', hachinohe: '八戸', sannohe: '三戸', kunohe: '九戸', iwate: '岩手', shiwa: '斯波', hei: '閉伊', kazuno: '鹿角', hinai: '比内', hiyama: '檜山', minato: '湊' };
var PIN = { oura: [140.394, 40.618], ishikawa: [140.497, 40.549], daikoji: [140.553, 40.609], namioka: [140.590, 40.714], iizume: [140.476, 40.842], sotogahama: [140.663, 40.856],
  tanabu: [141.19, 41.30], shichinohe: [141.156, 40.699], gonohe: [141.302, 40.530], hachinohe: [141.462, 40.508], sannohe: [141.262, 40.381], kunohe: [141.302, 40.275],
  iwate: [141.152, 39.700], shiwa: [141.163, 39.557], hei: [141.92, 39.645], kazuno: [140.81, 40.13], hinai: [140.59, 40.225], hiyama: [140.115, 40.165], minato: [140.072, 39.758] };
// 日本海に 水が ながれる がわ（奥羽山脈の 西）
var SANIN = { oura: 1, ishikawa: 1, daikoji: 1, namioka: 1, iizume: 1, sotogahama: 1, kazuno: 1, hinai: 1, hiyama: 1, minato: 1 };

// ---- 格子 ----
var D = 1.0;                       // となりの マスまで 1.0km
var LON0 = 139.60, LAT0 = 41.64, LAT_M = 40.5;
var KX = 111.32 * Math.cos(LAT_M * Math.PI / 180), KY = 110.57;
var W = Math.ceil((142.10 - LON0) * KX / D), H = Math.ceil((LAT0 - 39.44) * KY / (D * 0.8660254));
function xy(c, r) { return [D * (c + 0.5 * (r & 1)), D * 0.8660254 * r]; }
function ll(c, r) { var p = xy(c, r); return [LON0 + p[0] / KX, LAT0 - p[1] / KY]; }
function kmOf(lon, lat) { return [(lon - LON0) * KX, (LAT0 - lat) * KY]; }
function hexOf(lon, lat) { var p = kmOf(lon, lat), r = Math.round(p[1] / (D * 0.8660254)); return [Math.round(p[0] / D - 0.5 * (r & 1)), r]; }
function nbs(c, r) { var o = r & 1; return o ? [[c + 1, r], [c - 1, r], [c, r - 1], [c + 1, r - 1], [c, r + 1], [c + 1, r + 1]] : [[c + 1, r], [c - 1, r], [c - 1, r - 1], [c, r - 1], [c - 1, r + 1], [c, r + 1]]; }
function inb(c, r) { return c >= 0 && r >= 0 && c < W && r < H; }
var N = W * H; function I(c, r) { return r * W + c; }
var T0 = Date.now(); console.log('grid', W, 'x', H, '=', N);

// ---- 海陸と 国 ----
function dec(str) { var v = str.split(','), x = 0, y = 0, pts = []; for (var i = 0; i < v.length; i += 2) { x += +v[i]; y += +v[i + 1]; pts.push([x / 1000, y / 1000]); } return pts; }
var POLY = [];
Object.keys(GEO.provs).forEach(function (pid) { GEO.provs[pid].forEach(function (s) { POLY.push({ p: PROVS.indexOf(pid), pts: dec(s) }); }); });
GEO.near.forEach(function (n) { n.rings.forEach(function (s) { POLY.push({ p: 99, pts: dec(s) }); }); });
POLY.forEach(function (q) { var b = [999, 999, -999, -999]; q.pts.forEach(function (p) { b[0] = Math.min(b[0], p[0]); b[1] = Math.min(b[1], p[1]); b[2] = Math.max(b[2], p[0]); b[3] = Math.max(b[3], p[1]); }); q.b = b; });
function provAt(lon, lat) {
  for (var i = 0; i < POLY.length; i++) {
    var q = POLY[i], b = q.b; if (lon < b[0] || lon > b[2] || lat < b[1] || lat > b[3]) continue;
    var ins = false, pts = q.pts;
    for (var a = 0, z = pts.length - 1; a < pts.length; z = a++) { var xi = pts[a][0], yi = pts[a][1], xj = pts[z][0], yj = pts[z][1]; if (((yi > lat) !== (yj > lat)) && (lon < (xj - xi) * (lat - yi) / (yj - yi) + xi)) ins = !ins; }
    if (ins) return q.p;
  }
  return -1;
}
// 湖（十和田湖・小川原湖・十三湖・八郎潟）[経度, 緯度, 東西の 半径km, 南北の 半径km]
var LAKES = [[140.885, 40.465, 4.6, 4.4], [141.335, 40.79, 2.6, 7.6], [140.37, 41.02, 2.6, 2.2], [140.02, 39.98, 5.5, 11.5]];
function inLake(lon, lat) { return LAKES.some(function (L) { var dx = (lon - L[0]) * KX / L[2], dy = (lat - L[1]) * KY / L[3]; return dx * dx + dy * dy <= 1; }); }
var prov = new Int16Array(N).fill(-1), r, c, i;
// 行ごとの 走査線で 多角形を ぬる（はやい）
for (r = 0; r < H; r++) {
  var lat = LAT0 - D * 0.8660254 * r / KY, off = 0.5 * (r & 1);
  POLY.forEach(function (q) {
    if (lat < q.b[1] || lat > q.b[3]) return;
    var xs = [], pts = q.pts;
    for (var a = 0, z = pts.length - 1; a < pts.length; z = a++) { var yi = pts[a][1], yj = pts[z][1]; if ((yi > lat) !== (yj > lat)) xs.push(pts[a][0] + (pts[z][0] - pts[a][0]) * (lat - yi) / (yj - yi)); }
    xs.sort(function (u, v) { return u - v; });
    for (var m = 0; m + 1 < xs.length; m += 2) {
      var c0 = Math.ceil((xs[m] - LON0) * KX / D - off), c1 = Math.floor((xs[m + 1] - LON0) * KX / D - off);
      for (var cc = Math.max(0, c0); cc <= Math.min(W - 1, c1); cc++) prov[I(cc, r)] = q.p;
    }
  });
}
for (r = 0; r < H; r++) for (c = 0; c < W; c++) { var g = ll(c, r); if (prov[I(c, r)] >= 0 && prov[I(c, r)] < 99 && inLake(g[0], g[1])) prov[I(c, r)] = -1; }

// ---- 距離場（海から・尾根から） ----
function bfs(src) {
  var dist = new Float32Array(N).fill(1e9), q = [];
  for (i = 0; i < N; i++) if (src(i)) { dist[i] = 0; q.push(i); }
  for (var h = 0; h < q.length; h++) { var k = q[h], cc = k % W, rr = (k / W) | 0; nbs(cc, rr).forEach(function (n) { if (!inb(n[0], n[1])) return; var j = I(n[0], n[1]); if (dist[j] > dist[k] + D) { dist[j] = dist[k] + D; q.push(j); } }); }
  return dist;
}
var coast = bfs(function (k) { return prov[k] === -1; });
var isSan = function (p) { return p >= 0 && p < 99 && SANIN[PROVS[p]]; };
var isYo = function (p) { return p >= 0 && p < 99 && !SANIN[PROVS[p]]; };
var ridge = bfs(function (k) {
  var p = prov[k]; if (p < 0 || p >= 99) return false; var cc = k % W, rr = (k / W) | 0;
  return nbs(cc, rr).some(function (n) { if (!inb(n[0], n[1])) return false; var q = prov[I(n[0], n[1])]; return (isSan(p) && isYo(q)) || (isYo(p) && isSan(q)); });
});

// ---- ノイズ ----
function hash2(x, y, s) { var h = (x * 374761393 + y * 668265263 + s * 982451653) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; }
function vnoise(x, y, s) { var x0 = Math.floor(x), y0 = Math.floor(y), fx = x - x0, fy = y - y0; fx = fx * fx * (3 - 2 * fx); fy = fy * fy * (3 - 2 * fy);
  var a = hash2(x0, y0, s), b = hash2(x0 + 1, y0, s), c2 = hash2(x0, y0 + 1, s), d = hash2(x0 + 1, y0 + 1, s); return (a * (1 - fx) + b * fx) * (1 - fy) + (c2 * (1 - fx) + d * fx) * fy; }
function fbm(x, y, s) { return vnoise(x / 14, y / 14, s) * 0.55 + vnoise(x / 6, y / 6, s + 1) * 0.3 + vnoise(x / 2.5, y / 2.5, s + 2) * 0.15; }

// ---- 山・峠・川（地理の 知識に もとづく おおよその 位置） ----
var PEAKS = [
  ['岩木山', 140.303, 40.656, 1250, 4.5], ['八甲田山', 140.877, 40.659, 1100, 7], ['白神岳', 140.01, 40.51, 900, 6], ['釜臥山', 141.09, 41.30, 650, 5],
  ['岩手山', 140.997, 39.853, 1500, 6], ['八幡平', 140.86, 39.96, 1050, 8], ['森吉山', 140.55, 39.98, 950, 6], ['秋田駒ヶ岳', 140.80, 39.76, 1100, 5],
  ['早池峰山', 141.49, 39.56, 1300, 7], ['姫神山', 141.24, 39.84, 700, 3.5], ['七時雨山', 141.13, 40.07, 650, 4], ['折爪岳', 141.37, 40.24, 520, 4],
  ['戸来岳', 141.03, 40.45, 650, 5], ['名久井岳', 141.29, 40.40, 330, 2.5], ['階上岳', 141.62, 40.40, 400, 3], ['太平山', 140.33, 39.80, 750, 6],
  ['寒風山', 139.80, 39.92, 350, 3], ['本山', 139.73, 39.96, 450, 3], ['梵珠山', 140.56, 40.84, 300, 4], ['田代岳', 140.41, 40.42, 750, 5],
  ['安家森', 141.55, 40.05, 750, 9], ['峠ノ神山', 141.75, 39.85, 700, 9], ['十和田山', 140.92, 40.40, 650, 5], ['烏帽子岳', 140.85, 40.12, 600, 5]
];
// 峠（山を こえる 道）：ここだけ 尾根を こえられる
var PASSES = [
  ['来満峠', [[141.17, 40.33], [141.08, 40.31], [140.98, 40.29], [140.86, 40.26]], 470],
  ['矢立峠', [[140.62, 40.50], [140.61, 40.45], [140.60, 40.41], [140.58, 40.36]], 420],
  ['中山峠', [[141.29, 40.17], [141.25, 40.10], [141.22, 40.03], [141.20, 39.97]], 460],
  ['区界峠', [[141.25, 39.72], [141.38, 39.68], [141.50, 39.66], [141.65, 39.64]], 480],
  ['大間越', [[140.02, 40.52], [139.99, 40.46], [139.98, 40.40], [140.00, 40.33]], 300],
  ['坂梨峠', [[140.85, 40.18], [140.95, 40.12], [141.05, 40.06], [141.12, 39.98]], 480],
  ['七戸越え', [[141.16, 40.70], [141.04, 40.74], [140.92, 40.78], [140.80, 40.82]], 420],
  ['阿仁越え', [[140.40, 40.20], [140.39, 40.10], [140.38, 40.00], [140.30, 39.90]], 420],
  ['十和田越え', [[140.78, 40.25], [140.86, 40.32], [140.98, 40.40], [141.10, 40.47]], 480]
];
var RIVERS = [
  ['岩木川', [[140.17, 40.50], [140.27, 40.53], [140.40, 40.57], [140.45, 40.63], [140.46, 40.72], [140.43, 40.82], [140.41, 40.92], [140.38, 40.99]], 300],
  ['平川', [[140.64, 40.47], [140.59, 40.52], [140.56, 40.58], [140.53, 40.64], [140.49, 40.68]], 260],
  ['浅瀬石川', [[140.80, 40.60], [140.70, 40.62], [140.61, 40.63], [140.55, 40.65]], 260],
  ['堤川', [[140.86, 40.72], [140.80, 40.78], [140.76, 40.83]], 220],
  ['馬淵川', [[141.38, 40.00], [141.31, 40.12], [141.30, 40.21], [141.30, 40.28], [141.27, 40.36], [141.34, 40.44], [141.43, 40.49], [141.52, 40.55]], 300],
  ['新井田川', [[141.48, 40.27], [141.50, 40.38], [141.53, 40.48], [141.55, 40.52]], 220],
  ['五戸川', [[141.08, 40.49], [141.20, 40.52], [141.31, 40.53], [141.45, 40.59], [141.52, 40.62]], 230],
  ['奥入瀬川', [[140.94, 40.51], [141.06, 40.57], [141.20, 40.62], [141.33, 40.64], [141.42, 40.66]], 250],
  ['高瀬川', [[141.34, 40.86], [141.38, 40.89], [141.41, 40.90]], 120],
  ['米代川', [[140.95, 40.05], [140.85, 40.13], [140.79, 40.22], [140.70, 40.26], [140.58, 40.27], [140.45, 40.24], [140.37, 40.22], [140.24, 40.20], [140.10, 40.20], [140.02, 40.215]], 300],
  ['阿仁川', [[140.40, 39.95], [140.39, 40.05], [140.38, 40.15], [140.38, 40.22]], 260],
  ['北上川', [[141.21, 40.03], [141.18, 39.90], [141.15, 39.77], [141.15, 39.70], [141.17, 39.60], [141.17, 39.47]], 300],
  ['雫石川', [[140.92, 39.70], [141.02, 39.70], [141.10, 39.70], [141.15, 39.70]], 240],
  ['閉伊川', [[141.42, 39.67], [141.60, 39.65], [141.78, 39.63], [141.95, 39.64]], 300],
  ['久慈川', [[141.55, 40.12], [141.68, 40.17], [141.80, 40.19]], 220],
  ['雄物川', [[140.25, 39.55], [140.15, 39.66], [140.08, 39.72], [140.04, 39.74]], 160],
  ['赤石川', [[140.18, 40.58], [140.19, 40.66], [140.20, 40.74], [140.19, 40.78]], 220],
  ['田名部川', [[141.12, 41.35], [141.18, 41.30], [141.22, 41.27]], 140]
];
function segDist(px, py, ax, ay, bx, by) { var vx = bx - ax, vy = by - ay, L = vx * vx + vy * vy, t = L ? Math.max(0, Math.min(1, ((px - ax) * vx + (py - ay) * vy) / L)) : 0; var dx = ax + vx * t - px, dy = ay + vy * t - py; return [Math.sqrt(dx * dx + dy * dy), t]; }
// ポリラインまでの 距離と 位置（0=はじめ〜1=おわり）
function polyDist(px, py, pts) {
  var best = [1e9, 0], tot = 0, acc = 0, lens = [];
  for (var k = 1; k < pts.length; k++) { var l = Math.hypot(pts[k][0] - pts[k - 1][0], pts[k][1] - pts[k - 1][1]); lens.push(l); tot += l; }
  for (k = 1; k < pts.length; k++) { var s = segDist(px, py, pts[k - 1][0], pts[k - 1][1], pts[k][0], pts[k][1]); if (s[0] < best[0]) best = [s[0], (acc + s[1] * lens[k - 1]) / tot]; acc += lens[k - 1]; }
  return best;
}
var KM = function (pts) { return pts.map(function (p) { return kmOf(p[0], p[1]); }); };
var RIV_KM = RIVERS.map(function (rv) { return KM(rv[1]); }), PASS_KM = PASSES.map(function (ps) { return KM(ps[1]); });

// ---- 標高 ----
var elev = new Float32Array(N), riverAt = new Int8Array(N).fill(-1);
for (r = 0; r < H; r++) for (c = 0; c < W; c++) {
  var k = I(c, r); if (prov[k] === -1) { elev[k] = -10; continue; }
  var p0 = xy(c, r), x = p0[0], y = p0[1], cd = coast[k];
  var e = 25 + 470 * (1 - Math.exp(-cd / 16));
  var taper = Math.min(1, cd / 9);
  e += 640 * Math.exp(-Math.pow(ridge[k] / 7.5, 2)) * taper;
  e += (fbm(x, y, 7) - 0.5) * 330 * Math.min(1, cd / 5 + 0.3);
  PEAKS.forEach(function (pk) { var q = kmOf(pk[1], pk[2]); var dd = Math.hypot(x - q[0], y - q[1]); if (dd < pk[4] * 3) e += pk[3] * Math.exp(-Math.pow(dd / pk[4], 2)); });
  // 峠の 道すじ
  PASS_KM.forEach(function (pp, j) { var s = polyDist(x, y, pp); if (s[0] < 3.2) { var lim = PASSES[j][2] - 60 * Math.sin(s[1] * Math.PI) * 0 + Math.max(0, s[0] - 0.9) * 230; e = Math.min(e, lim); } });
  // 川の 谷
  RIV_KM.forEach(function (rp, j) { var s = polyDist(x, y, rp); if (s[0] < 3) { var v = 12 + RIVERS[j][2] * Math.pow(1 - s[1], 1.3); e = Math.min(e, v + Math.max(0, s[0] - 0.7) * 210); if (s[0] < 0.62) riverAt[k] = j; } });
  elev[k] = e;
}
// ---- 地形 ----
// s=海・湖 X=ほかの地方 M=けわしい山（とおれない） m=山 h=丘 f=森 .=平地 r=川
console.timeLog && console.log('elev done', Date.now()-T0);
var T = new Array(N);
for (r = 0; r < H; r++) for (c = 0; c < W; c++) {
  var k2 = I(c, r), e2 = elev[k2], pv = prov[k2], p1 = xy(c, r);
  if (pv === -1) { T[k2] = 's'; continue; }
  if (pv === 99) { T[k2] = 'X'; continue; }
  var fz = fbm(p1[0], p1[1], 31);
  if (riverAt[k2] >= 0) T[k2] = 'r';
  else if (e2 >= 800) T[k2] = 'M';
  else if (e2 >= 500) T[k2] = 'm';
  else if (e2 >= 270) T[k2] = fz > 0.5 ? 'f' : 'h';
  else T[k2] = fz > 0.62 ? 'f' : (fz < 0.2 && e2 > 150 ? 'h' : '.');
}
// 城の マス
var CAS = {};
PROVS.forEach(function (pid, pi) {
  var h0 = hexOf(PIN[pid][0], PIN[pid][1]), best = null;
  for (var rr = h0[1] - 12; rr <= h0[1] + 12; rr++) for (var cc = h0[0] - 12; cc <= h0[0] + 12; cc++) {
    if (!inb(cc, rr) || prov[I(cc, rr)] !== pi || T[I(cc, rr)] === 'M' || T[I(cc, rr)] === 'r') continue;
    var dd = Math.hypot(cc - h0[0], rr - h0[1]); if (!best || dd < best[2]) best = [cc, rr, dd];
  }
  CAS[pid] = [best[0], best[1]];
  // 城の まわりは とおれるように（城下）
  var q0 = xy(best[0], best[1]);
  for (rr = best[1] - 3; rr <= best[1] + 3; rr++) for (cc = best[0] - 3; cc <= best[0] + 3; cc++) { if (!inb(cc, rr)) continue; var kk = I(cc, rr), q1 = xy(cc, rr); if (Math.hypot(q1[0] - q0[0], q1[1] - q0[1]) <= 2.1 && T[kk] === 'M') T[kk] = 'm'; }
});

// ---- 道（国どうしの ルート） ----
function cost(k, mode, onRoad) {
  var t = T[k];
  if (t === 's') return mode === 'sea' ? 1.1 : null;
  if (t === 'X' || t === 'M') return null;
  var base = { '.': 1, f: 1.7, h: 1.7, m: 3.6, r: 2.6 }[t];
  return onRoad[k] ? Math.min(base, 0.75) : base;
}
function Heap() { var a = []; this.size = function () { return a.length; };
  this.push = function (pr, v) { a.push([pr, v]); var i2 = a.length - 1; while (i2 > 0) { var p2 = (i2 - 1) >> 1; if (a[p2][0] <= a[i2][0]) break; var t2 = a[p2]; a[p2] = a[i2]; a[i2] = t2; i2 = p2; } };
  this.pop = function () { var top = a[0], last = a.pop(); if (a.length) { a[0] = last; var i2 = 0; for (;;) { var l = 2 * i2 + 1, rr2 = l + 1, m2 = i2; if (l < a.length && a[l][0] < a[m2][0]) m2 = l; if (rr2 < a.length && a[rr2][0] < a[m2][0]) m2 = rr2; if (m2 === i2) break; var t3 = a[m2]; a[m2] = a[i2]; a[i2] = t3; i2 = m2; } } return top; }; }
function astar(a, b, allow, mode, onRoad) {
  var start = I(a[0], a[1]), goal = I(b[0], b[1]);
  var g = new Float64Array(N).fill(1e9), from = new Int32Array(N).fill(-1), heap = new Heap(); heap.push(0, start); g[start] = 0;
  var gb = xy(b[0], b[1]);
  function hh(k) { var q = xy(k % W, (k / W) | 0); return Math.hypot(q[0] - gb[0], q[1] - gb[1]) * 0.7; }
  while (heap.size()) {
    var cur = heap.pop();
    var k = cur[1]; if (k === goal) break;
    if (cur[0] - hh(k) > g[k] + 1e-6) continue;
    var cc = k % W, rr = (k / W) | 0;
    var ns = nbs(cc, rr);
    for (var j = 0; j < 6; j++) {
      var n = ns[j]; if (!inb(n[0], n[1])) continue; var kn = I(n[0], n[1]);
      if (!allow(kn)) continue;
      var cst = cost(kn, mode, onRoad); if (cst === null) continue;
      if (mode === 'sea' && (T[k] === 's') !== (T[kn] === 's')) cst += 5;   // 乗り降り
      var ng = g[k] + cst;
      if (ng < g[kn]) { g[kn] = ng; from[kn] = k; heap.push(ng + hh(kn), kn); }
    }
  }
  if (from[goal] < 0) return null;
  var path = [], k3 = goal; while (k3 !== start) { path.push(k3); k3 = from[k3]; } path.push(start); path.reverse();
  return { path: path, cost: g[goal] };
}
console.log('terr done', Date.now()-T0);
var onRoad = new Uint8Array(N);
var ADJ = GEO.adj, ROUTES = [], seen = {};
// 近い 組から 道を ひく（あとの 道は 先の 道を つかう）
var pairs = [];
PROVS.forEach(function (a) { (ADJ[a] || []).forEach(function (b) { var key = [a, b].sort().join('|'); if (seen[key]) return; seen[key] = 1; pairs.push([a, b]); }); });
pairs.sort(function (p, q) { var d1 = Math.hypot(PIN[p[0]][0] - PIN[p[1]][0], PIN[p[0]][1] - PIN[p[1]][1]), d2 = Math.hypot(PIN[q[0]][0] - PIN[q[1]][0], PIN[q[0]][1] - PIN[q[1]][1]); return d1 - d2; });
function nameNear(path, ai, bi) {
  // いちばん 高い ところに 近い 峠の 名前
  var mid = path.slice(4, Math.max(5, path.length - 4)), top = mid[0];
  mid.forEach(function (k) { if (elev[k] > elev[top]) top = k; });
  var q = xy(top % W, (top / W) | 0), best = null;
  PASS_KM.forEach(function (pp, j) {
    var e0 = PASSES[j][1][0], e1 = PASSES[j][1][PASSES[j][1].length - 1], h0 = hexOf(e0[0], e0[1]), h1 = hexOf(e1[0], e1[1]);
    var p0 = prov[I(h0[0], h0[1])], p1 = prov[I(h1[0], h1[1])];
    if ([p0, p1].filter(function (x) { return x === ai || x === bi; }).length < 1) return;
    var s2 = polyDist(q[0], q[1], pp); if (s2[0] < 6 && (!best || s2[0] < best[1])) best = [PASSES[j][0], s2[0]]; });
  return best ? best[0] : null;
}
pairs.forEach(function (pr) {
  var ai = PROVS.indexOf(pr[0]), bi = PROVS.indexOf(pr[1]);
  var land = function (k) { return prov[k] === ai || prov[k] === bi; };
  var res = astar(CAS[pr[0]], CAS[pr[1]], land, 'land', onRoad), type = 'land', name = null;
  if (res) {
    var mCount = res.path.filter(function (k) { return T[k] === 'm'; }).length;
    var PN = { 'kazuno|sannohe': '来満峠', 'hinai|ishikawa': '矢立峠', 'iwate|kunohe': '中山峠', 'hei|iwate': '区界峠', 'hiyama|oura': '大間越', 'iwate|kazuno': '坂梨峠', 'shichinohe|sotogahama': '七戸越え', 'gonohe|kazuno': '十和田越え', 'hinai|minato': '阿仁越え' }[[pr[0], pr[1]].sort().join('|')];
    if (mCount >= 2) { type = 'pass'; name = PN || '峠道'; }
    res.path.forEach(function (k) { onRoad[k] = 1; });
  } else {
    var sea = function (k) { return prov[k] === ai || prov[k] === bi || prov[k] === -1; };
    res = astar(CAS[pr[0]], CAS[pr[1]], sea, 'sea', onRoad);
    if (res) { type = 'sea'; name = '海路'; } else type = 'none';
  }
  ROUTES.push({ a: pr[0], b: pr[1], type: type, name: name, cost: res ? +res.cost.toFixed(1) : null, path: res ? res.path : null });
  console.log(PNAME[pr[0]] + '-' + PNAME[pr[1]], type, name || '', res ? res.path.length + 'km' : '');
});

// ---- 海路（陸で となりあわない 海ぞいの 国：みじかい 船の 道） ----
PROVS.forEach(function (a, ai) { PROVS.forEach(function (b, bi) {
  if (ai >= bi || (ADJ[a] || []).indexOf(b) >= 0) return;
  var sea = function (k) { return prov[k] === ai || prov[k] === bi || prov[k] === -1; };
  var res = astar(CAS[a], CAS[b], sea, 'sea', onRoad); if (!res) return;
  var ns = res.path.filter(function (k) { return T[k] === 's'; }).length;
  if (ns > 45) return;
  ROUTES.push({ a: a, b: b, type: 'sea', name: '海路', cost: +res.cost.toFixed(1), path: res.path });
  console.log(PNAME[a] + '-' + PNAME[b], 'sea', ns + 'km');
}); });
// ---- 書き出し ----
function rle(arr) { var out = '', prev = null, n = 0; for (var k = 0; k <= arr.length; k++) { var v = k < arr.length ? arr[k] : null; if (v === prev) { n++; continue; } if (prev !== null) out += prev + (n > 1 ? String(n) : ''); prev = v; n = 1; } return out; }
// 道の マスにも しるし（地図表示用）
var T2 = T.slice(); for (i = 0; i < N; i++) if (onRoad[i] && T2[i] !== 's' && T2[i] !== 'r') T2[i] = '=';
var provChars = Array.prototype.map.call(prov, function (p) { return p < 0 ? '~' : p === 99 ? '_' : String.fromCharCode(97 + p); });
var OUT = {
  w: W, h: H, d: D, lon0: LON0, lat0: LAT0, latm: LAT_M,
  terr: rle(T2), prov: rle(provChars), provs: PROVS, castles: CAS,
  routes: ROUTES.map(function (R0) { return { a: R0.a, b: R0.b, type: R0.type, name: R0.name, path: R0.path ? R0.path.map(function (k) { return [k % W, (k / W) | 0]; }) : null }; }),
  rivers: RIVERS.map(function (rv) { return { name: rv[0], pts: rv[1] }; }),
  passes: PASSES.map(function (ps) { var m = ps[1][Math.floor(ps[1].length / 2)]; return { name: ps[0], at: m }; }),
  peaks: PEAKS.filter(function (pk) { return pk[3] >= 500; }).map(function (pk) { return { name: pk[0], at: [pk[1], pk[2]] }; })
};
var js = '/* 北奥羽の 世界ヘックス地図（海陸・国境＝国土数値情報を 加工。山・峠・川は 地理の 知識に もとづく モデルで、実測の 標高では ありません） */\nvar WORLD = ' + JSON.stringify(OUT) + ';\n';
fs.writeFileSync(__dirname + '/world.js', js);
console.log('world.js', js.length, 'bytes; terr', OUT.terr.length, 'prov', OUT.prov.length);
// 確認用の 画像データ
fs.writeFileSync('/tmp/world_dbg.json', JSON.stringify({ w: W, h: H, T: T2.join(''), prov: provChars.join(''), cas: CAS, elev: Array.prototype.map.call(elev, function (v) { return Math.round(v); }) }));
