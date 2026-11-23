'use strict';
// 中国地方 世界ヘックス地図の 生成（ビルド時に 1回）
//  海陸・国＝国土数値情報（geo.js）、標高＝尾根・峠・山・川・湖の モデル（実測の 標高データでは ない）
var fs = require('fs'), vm = require('vm');
var ctx = { console: console, Math: Math };
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(__dirname + '/geo.js', 'utf8'), ctx);
var GEO = ctx.CHUGOKU_GEO;
var PROVS = ['nagato', 'suo', 'akiw', 'sato', 'yoshida', 'oasa', 'kagami', 'nuta', 'bingon', 'bingos', 'iwamiw', 'iwamie', 'izumo', 'hoki', 'inaba', 'mimasaka', 'bitchu', 'bizen'];
var PNAME = { nagato: '長門', suo: '周防', akiw: '佐西', sato: '佐東', yoshida: '吉田', oasa: '大朝', kagami: '東西条', nuta: '沼田', bingon: '備後北部', bingos: '備後南部', iwamiw: '石見西部', iwamie: '石見東部', izumo: '出雲', hoki: '伯耆', inaba: '因幡', mimasaka: '美作', bitchu: '備中', bizen: '備前' };
var PIN = { nagato: [130.97, 34.05], suo: [131.47, 34.18], akiw: [132.33, 34.35], sato: [132.47, 34.48], yoshida: [132.70, 34.67], oasa: [132.47, 34.77], kagami: [132.74, 34.42], nuta: [132.98, 34.43], bingon: [133.00, 34.83], bingos: [133.37, 34.55], iwamiw: [131.77, 34.47], iwamie: [132.49, 35.00], izumo: [133.19, 35.37], hoki: [133.39, 35.40], inaba: [134.17, 35.50], mimasaka: [133.69, 35.09], bitchu: [133.62, 34.81], bizen: [134.27, 34.83] };
var SANIN = { iwamiw: 1, iwamie: 1, izumo: 1, hoki: 1, inaba: 1 };

// ---- 格子 ----
var D = 1.0;                       // となりの マスまで 1.0km
var LON0 = 130.75, LAT0 = 35.72, LAT_M = 34.8;
var KX = 111.32 * Math.cos(LAT_M * Math.PI / 180), KY = 110.57;
var W = Math.ceil((134.62 - LON0) * KX / D), H = Math.ceil((LAT0 - 33.86) * KY / (D * 0.8660254));
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
// 湖（宍道湖・中海）
var LAKES = [[132.955, 35.452, 8.2, 3.2], [133.205, 35.475, 5.8, 3.8]];
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
  ['大山', 133.546, 35.371, 1100, 6.5], ['蒜山', 133.67, 35.30, 600, 5], ['氷ノ山', 134.52, 35.35, 800, 6], ['扇ノ山', 134.43, 35.44, 600, 5],
  ['那岐山', 134.17, 35.18, 600, 5], ['後山', 134.38, 35.18, 600, 5], ['道後山', 133.20, 35.07, 500, 5], ['比婆山', 133.02, 35.06, 500, 5],
  ['船通山', 133.18, 35.17, 450, 4], ['三瓶山', 132.62, 35.14, 650, 4], ['恐羅漢山', 132.08, 34.60, 750, 7], ['冠山', 132.08, 34.47, 750, 7],
  ['寂地山', 131.98, 34.43, 650, 5], ['阿佐山', 132.32, 34.73, 650, 6], ['臥竜山', 132.19, 34.66, 600, 5], ['十種ヶ峰', 131.65, 34.40, 450, 4],
  ['野呂山', 132.68, 34.27, 450, 3.5], ['極楽寺山', 132.27, 34.40, 300, 4], ['弥山', 132.32, 34.28, 350, 2.2], ['吾妻山', 133.05, 35.11, 400, 4],
  ['毛無山', 133.47, 35.24, 500, 4], ['花知ヶ仙', 133.48, 35.12, 350, 4], ['大万木山', 132.92, 35.08, 400, 4]
];
// 峠（山陽と山陰を むすぶ 道）：ここだけ 尾根を こえられる
var PASSES = [
  ['四十曲峠', [[133.62, 35.11], [133.56, 35.16], [133.49, 35.22], [133.43, 35.28]], 520],
  ['人形峠', [[133.98, 35.19], [133.93, 35.26], [133.89, 35.31], [133.86, 35.39]], 540],
  ['志戸坂峠', [[134.32, 35.07], [134.34, 35.16], [134.31, 35.22], [134.24, 35.28]], 520],
  ['明地峠', [[133.47, 34.97], [133.43, 35.07], [133.40, 35.15], [133.38, 35.23]], 500],
  ['王貫峠', [[133.28, 34.91], [133.22, 35.01], [133.15, 35.10], [133.10, 35.18]], 520],
  ['赤名峠', [[132.83, 34.84], [132.76, 34.94], [132.70, 35.01], [132.73, 35.11]], 500],
  ['野坂峠', [[131.78, 34.48], [131.72, 34.41], [131.65, 34.33], [131.55, 34.24]], 480],
  ['市木越え', [[132.49, 34.99], [132.46, 34.91], [132.44, 34.84], [132.47, 34.78]], 500],
  ['山代越え', [[131.95, 34.55], [131.98, 34.45], [132.04, 34.36], [132.10, 34.27]], 470]
];
var RIVERS = [
  ['江の川', [[132.33, 34.74], [132.47, 34.72], [132.62, 34.66], [132.72, 34.68], [132.85, 34.80], [132.75, 34.88], [132.62, 34.93], [132.49, 35.00], [132.38, 35.03], [132.23, 35.01]], 300],
  ['太田川', [[132.15, 34.62], [132.30, 34.55], [132.40, 34.52], [132.48, 34.47], [132.46, 34.40], [132.45, 34.35]], 260],
  ['芦田川', [[133.05, 34.62], [133.20, 34.57], [133.32, 34.52], [133.38, 34.48], [133.38, 34.44]], 240],
  ['沼田川', [[132.95, 34.50], [133.03, 34.42], [133.08, 34.38]], 200],
  ['高梁川', [[133.40, 35.05], [133.50, 34.95], [133.62, 34.80], [133.68, 34.68], [133.73, 34.53]], 300],
  ['旭川', [[133.65, 35.25], [133.72, 35.08], [133.85, 34.95], [133.92, 34.80], [133.93, 34.66], [133.96, 34.58]], 330],
  ['吉井川', [[134.00, 35.15], [134.00, 35.06], [134.10, 34.95], [134.15, 34.80], [134.13, 34.62]], 300],
  ['日野川', [[133.30, 35.13], [133.38, 35.22], [133.42, 35.32], [133.38, 35.43], [133.35, 35.46]], 320],
  ['千代川', [[134.30, 35.25], [134.25, 35.38], [134.22, 35.48], [134.20, 35.535]], 300],
  ['斐伊川', [[133.10, 35.15], [133.00, 35.25], [132.88, 35.35], [132.86, 35.43]], 300],
  ['飯梨川', [[133.17, 35.25], [133.18, 35.37], [133.20, 35.44]], 260],
  ['錦川', [[131.95, 34.45], [132.05, 34.32], [132.10, 34.22], [132.18, 34.17]], 260],
  ['佐波川', [[131.65, 34.30], [131.60, 34.15], [131.58, 34.05]], 240],
  ['椹野川', [[131.47, 34.25], [131.45, 34.12], [131.42, 34.03]], 200],
  ['高津川', [[131.90, 34.45], [131.80, 34.55], [131.80, 34.65], [131.83, 34.69]], 260],
  ['黒瀬川', [[132.75, 34.43], [132.68, 34.30], [132.62, 34.22]], 200],
  ['西城川', [[133.10, 35.00], [133.02, 34.90], [132.88, 34.81]], 260]
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
    var PN = { 'hoki|mimasaka': '四十曲峠', 'inaba|mimasaka': '志戸坂峠', 'bitchu|hoki': '明地峠', 'iwamie|oasa': '市木越え', 'bingon|izumo': '王貫峠', 'iwamie|yoshida': '江の川の谷', 'iwamiw|suo': '野坂峠' }[[pr[0], pr[1]].sort().join('|')];
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
var js = '/* 中国地方の 世界ヘックス地図（海陸・国境＝国土数値情報を 加工。山・峠・川は 地理の 知識に もとづく モデルで、実測の 標高では ありません） */\nvar WORLD = ' + JSON.stringify(OUT) + ';\n';
fs.writeFileSync(__dirname + '/world.js', js);
console.log('world.js', js.length, 'bytes; terr', OUT.terr.length, 'prov', OUT.prov.length);
// 確認用の 画像データ
fs.writeFileSync('/tmp/world_dbg.json', JSON.stringify({ w: W, h: H, T: T2.join(''), prov: provChars.join(''), cas: CAS, elev: Array.prototype.map.call(elev, function (v) { return Math.round(v); }) }));
