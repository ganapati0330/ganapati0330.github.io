/* ===== フテ猫 戦国合戦 : ゲームロジック（DOM非依存） ===== */
'use strict';
var VERSION = 'v9.4';
var TURN_LIMIT = 15; // 既定（サイズごとに SIZES[].turns）

// ---- 兵種 ----
// atk 攻撃, def 守り, mov 移動力, rmin/rmax 射程, cost 編成コスト
var UNIT_TYPES = {
  ashigaru: { id:'ashigaru', name:'足軽', kana:'あしがる', ch:'足', men:300, atk:5, def:4, mov:3, rmin:1, rmax:1, cost:2,
    desc:'やりを もった きほんの へいし。うごき・こうげき・まもりは ふつう。きば に よわいが、てっぽう には つよい。' },
  kiba:     { id:'kiba', name:'騎馬', kana:'きば', ch:'騎', men:50, atk:7, def:5, mov:5, rmin:1, rmax:1, cost:5,
    desc:'うまに のった エリート。はやくて つよくて かたい！ あしがる・てっぽう に とつげき。山に はいれず、川は にがて。' },
  teppo:    { id:'teppo', name:'鉄砲', kana:'てっぽう', ch:'鉄', men:50, atk:9, def:2, mov:2, rmin:2, rmax:2, cost:4,
    desc:'2マス はなれた てきを うつ。こうげきは さいきょう だが、まもりが よわく、あしがる・きば に よわい。うごいた ターンは うてない。' },
  yumi:     { id:'yumi', name:'弓', kana:'ゆみ', ch:'弓', men:200, atk:5, def:2, mov:3, rmin:1, rmax:3, cost:3,
    desc:'いちばん とおくまで とどく（1〜3マス）。うごいてから うてる。うごき・こうげきは ふつうで、まもりは よわい。' },
  kosaku:   { id:'kosaku', name:'工作', kana:'こうさく', ch:'工', men:150, atk:2, def:6, mov:2, rmin:1, rmax:1, cost:3,
    desc:'うごきが おそく こうげきは よわいが、まもりは かたい。じょうへき・もんを おおきく こわす（6）。まもりでは なおす（+2、こわれた あなは なおせない）。川に はしを かけられる。' },
  ninja:    { id:'ninja', name:'忍者', kana:'にんじゃ', ch:'忍', men:20, atk:6, def:2, mov:4, rmin:1, rmax:1, cost:4,
    desc:'かべや 山を のりこえ、もんを あけられる。こうげきは つよいが まもりは よわい。てきの となりに いくまで みつからない。' },
  konida:   { id:'konida', name:'小荷駄', kana:'こにだ', ch:'糧', men:100, atk:0, def:2, mov:4, rmin:1, rmax:1, cost:0,
    desc:'兵糧を はこぶ 補給の 隊。たたかえない。本隊（みかた 3隊いじょう）の 2マス いないまで はこぶと 兵糧が ふえる。森・山・丘で ひとりだと 敵に おそわれやすい。' },
  taisho:   { id:'taisho', name:'大将', kana:'たいしょう', ch:'将', men:100, atk:6, def:6, mov:4, rmin:1, rmax:1, cost:0,
    desc:'ぐんの リーダー。よろいが かたい。となりの みかたが つよくなる。やられたら まけ！' }
};
var BUY_ORDER = ['ashigaru','yumi','kiba','teppo','kosaku','ninja'];

// 相性ボーナス（攻撃側→防御側）
var BONUS = {
  kiba:   { ashigaru:1.3, teppo:1.5, yumi:1.3, kosaku:1.2 },
  ashigaru:{ teppo:1.3 },
  yumi:   { kosaku:1.2 },
  ninja:  { taisho:1.3, teppo:1.3 }
};

// ---- 地形 ----
// . 平地  = 道  f 森  h 丘  m 山  r 川  b 橋  W 城壁  G 門  C 城内  K 本丸
var TERRAIN = {
  '.': { id:'plain', name:'へいち', def:1.0 },
  '=': { id:'road',  name:'みち',   def:1.0 },
  'f': { id:'forest',name:'もり',   def:0.8 },
  'h': { id:'hill',  name:'おか',   def:0.8 },
  'm': { id:'mount', name:'やま',   def:0.65 },
  'r': { id:'river', name:'かわ',   def:1.3 },
  'b': { id:'bridge',name:'はし',   def:1.1 },
  'W': { id:'wall',  name:'じょうへき', def:0.6 },
  'G': { id:'gate',  name:'もん',   def:0.7 },
  'C': { id:'court', name:'じょうない', def:0.85 },
  'K': { id:'keep',  name:'ほんまる', def:0.65 },
  'M': { id:'peak',  name:'けわしい山', def:0.6 },
  's': { id:'sea',   name:'うみ',   def:1.3 }
};
var WALL_HP = 10, GATE_HP = 8, REPAIR_AMOUNT = 2;

// ---- 城テンプレート ----
// 記号: W 石垣  P 柵(木の壁)  G 門  C 城内  K 本丸  ~ 堀  B 橋  s 海  m 山  h 丘  f 森  . 平地  = 道  (空白)=周りの地形のまま
var CASTLES = [
  { id:'hira', adj:{ def:{ ashigaru:-1 } }, name:'ひらじろ', kana:'平城', desc:'ひろい へいちに たつ しろ。まっすぐ せめこめ！',
    t: [
      'WWWWW',
      'WCCCW',
      'WCKCW',
      'WCCCW',
      'WWGWW'
    ], gen:{ forest:1, hill:1, mount:0.3, river:0.35 } },
  { id:'toride', adj:{ def:{ ashigaru:-1 } }, name:'とりで', kana:'砦', desc:'きの さくで かこった ちいさな とりで。かべは よわいが まわりは おかだらけ。',
    t: [
      ' hh     hh ',
      ' h PPPPP h ',
      '   PCCCP   ',
      '   PCKCP   ',
      '   PCCCP   ',
      ' h PPGPP h ',
      ' hh     hh '
    ], gen:{ forest:1.3, hill:1.5, mount:0.3, river:0.3 } },
  { id:'yama', adj:{ def:{ yumi:-1 } }, name:'やまじろ', kana:'山城', desc:'やまの うえの しろ。みちは せまい。にんじゃの でばん！',
    t: [
      'mmm     mmm',
      'mm WWWWW mm',
      'm  WCCCW  m',
      'm  WCKCW  m',
      'mm WCCCW mm',
      'mmmWWGWWmmm',
      'mmmmh.hmmmm',
      ' mmm . mmm ',
      '  m  .  m  '
    ], gen:{ forest:1.2, hill:1.2, mount:1.4, river:0.2 } },
  { id:'mizu', adj:{ def:{} }, name:'みずじろ', kana:'水城', desc:'ほりに かこまれた しろ。はしを わたるか およぐか？',
    t: [
      '~~~~~~~~~~~',
      '~.WWWWWWW.~',
      '~.WCCCCCW.~',
      '~.WCCKCCW.~',
      '~.WCCCCCW.~',
      '~.WWWGWWW.~',
      '~~~~~B~~~~~'
    ], gen:{ forest:0.8, hill:0.6, mount:0.2, river:0.6 } },
  { id:'nino', adj:{ def:{ ashigaru:1 } }, name:'にのまるじろ', kana:'二の丸城', desc:'そとの かべを やぶっても、なかに もう ひとつ かべ！ もんは 3つ。',
    t: [
      'WWWWWWWWWWW',
      'WCCCCCCCCCW',
      'WCWWWWWWWCW',
      'WCWCCCCCWCW',
      'WCWCCKCCWCW',
      'WCWCCCCCWCW',
      'WCWWWGWWWCW',
      'WCCCCCCCCCW',
      'WWGWWWWWGWW'
    ], gen:{ forest:1, hill:1, mount:0.4, river:0.35 } },
  { id:'umi', adj:{ def:{ yumi:-1 }, atk:{ ashigaru:1 } }, name:'うみじろ', kana:'海城', desc:'うみに つきでた しろ。せめる みちは まえだけ。にんじゃだけ うみを およげる。',
    t: [
      'sssssssssssss',
      'sss WWWWW sss',
      'ss  WCCCW  ss',
      'ss  WCKCW  ss',
      'ss  WCCCW  ss',
      'sss WWGWW sss',
      'ss         ss'
    ], gen:{ forest:0.9, hill:0.8, mount:0.3, river:0, sea:true } },
  { id:'oo', name:'おおじろ', kana:'大城', desc:'ほり・2つの もん・うちがわの かべ。いちばん かたい きょだいな しろ！',
    t: [
      '~~~~~~~~~~~~~~~',
      '~WWWWWWWWWWWWW~',
      '~WCCCCCCCCCCCW~',
      '~WCCWWWWWWWCCW~',
      '~WCCWCCCCCWCCW~',
      '~WCCWCCKCCWCCW~',
      '~WCCWCCCCCWCCW~',
      '~WCCWWWGWWWCCW~',
      '~WCCCCCCCCCCCW~',
      '~WWWGWWWWWGWWW~',
      '~~~~B~~~~~B~~~~'
    ], gen:{ forest:0.9, hill:0.8, mount:0.3, river:0.3 } }
,
  // ---- 実在の 城（国取りで つかう） ----
  { id:'koriyama', real:true, name:'吉田郡山城', kana:'山城（曲輪の連なる 大きな 山城）', mult:1.55, minSize:1,
    t: [
      'mmmmmmmmmmmmmmm',
      'mmmWWWWWWWWWmmm',
      'mmmWCCCWCCCWmmm',
      'mmmWCCCWCKCWmmm',
      'mmmWCCCGCCCWmmm',
      'mmmWWGWWWWWWmmm',
      'mmmmWCCCWmmmmmm',
      'mmmmWCCCWmmmmmm',
      'mmmmWWGWWmmmmmm',
      'mmmhh   hhmmmmm'
    ], gen:{ forest:1.2, hill:1.2, mount:1.3, river:0.3 } },
  { id:'gassan', real:true, name:'月山富田城', kana:'山城（七曲りと 山中御殿）', mult:1.7, minSize:1,
    t: [
      'mmmmmWWWWWmmmmm',
      'mmmmmWCKCWmmmmm',
      'mmmmmWWGWWmmmmm',
      'mmmmWWCCCWWmmmm',
      'mmmmWCCCCCWmmmm',
      'mmmmWWWWGWWmmmm',
      'mmmmmmmm=mmmmmm',
      'mmmmmm==mmmmmmm',
      'mmmmmm=mmmmmmmm',
      '~mmWWWWGWWWWmmm',
      '~mmWCCCCCCCWmmm',
      '~mmWCCCCCCCWmmm',
      '~mmWWWWGWWWWmmm',
      '~~             '
    ], gen:{ forest:1, hill:1, mount:1.2, river:0.4 } },
  { id:'yakata', real:true, name:'大内館', kana:'館（堀と 土塁で かこんだ 方形の 館）', mult:1.3, minSize:0,
    t: [
      '~~~~~~~~~~~~~',
      '~PPPPPPPPPPP~',
      '~PCCCCCCCCCP~',
      '~PCCCCKCCCCP~',
      '~PCCCCCCCCCP~',
      '~PPPPPGPPPPP~',
      '~~~~~~B~~~~~~'
    ], gen:{ forest:0.6, hill:0.6, mount:0.2, river:0.4 } },
  { id:'sakurao', real:true, name:'桜尾城', kana:'海城（海に つきでた 城）', mult:1.4, minSize:0,
    t: [
      'sssssssssssss',
      'sssWWWWWWWsss',
      'sssWCCKCCWsss',
      'sssWCCCCCWsss',
      'ssWWWWGWWWWss',
      'ssWCCCCCCCWss',
      'ssWWWGWWWWWss',
      'ss         ss'
    ], gen:{ forest:0.8, hill:0.8, mount:0.3, river:0, sea:true } },
  { id:'katsuyama', real:true, name:'且山城', kana:'山城（海を みおろす 山の 城）', mult:1.45, minSize:0,
    t: [
      'sssmmmmmmmmmm',
      'ssmmWWWWWWWmm',
      'ssmmWCCKCCWmm',
      'ssmmWWWGWWWmm',
      'sssmmWCCCWmmm',
      'sssmmWWGWWmmm',
      'ssssmmh hmmmm'
    ], gen:{ forest:1, hill:1, mount:0.8, river:0.2 } },
  { id:'kanayama', real:true, name:'佐東銀山城', kana:'山城（武田山の 頂に たつ）', mult:1.5, minSize:0,
    t: [
      'mmmmmmmmmmm~~',
      'mmWWWWWWWmm~~',
      'mmWCCKCCWmm~~',
      'mmWCCCCCWmm~~',
      'mmWWWGWWWmm~~',
      'mmmWCCCWmmm~~',
      'mmmWWGWWmmm~~',
      'mmmh   hmm ~~'
    ], gen:{ forest:1, hill:1, mount:1, river:0.2 } },
  { id:'ridge', real:true, name:'尾根の城', kana:'山城（尾根に 曲輪が ならぶ 連郭式）', mult:1.45, minSize:0,
    t: [
      'mmmmmmmmmmmmmmm',
      'mWWWWWWWWWWWWWm',
      'mWCCCGCKCGCCCWm',
      'mWCCCWCCCWCCCWm',
      'mWWGWWWWWWWGWWm',
      'mmm mmmmmmm mmm'
    ], gen:{ forest:1.2, hill:1, mount:1, river:0.3 } },
  { id:'ridge_r', real:true, name:'川ぞいの 尾根の城', kana:'山城（川を 見おろす 尾根の 城）', mult:1.5, minSize:0,
    t: [
      'mmmmmmmmmmmmmmm',
      'mWWWWWWWWWWWWWm',
      'mWCCKGCCCGCCCWm',
      'mWCCCWCCCWCCCWm',
      'mWWWWWWWWWWWGWm',
      'mmmmmmmmmmm mmm',
      '~~~~~~~~~~~B~~~'
    ], gen:{ forest:1, hill:1, mount:0.8, river:0 } },
  { id:'kagami', real:true, name:'鏡山城', kana:'山城（小さな 山の 城）', mult:1.35, minSize:0,
    t: [
      'hhhhhhhhhhh',
      'hhWWWWWWWhh',
      'hhWCCKCCWhh',
      'hhWCCCCCWhh',
      'hhWWWGWWWhh',
      'hhhh   hhhh'
    ], gen:{ forest:1, hill:1.4, mount:0.5, river:0.3 } },
  { id:'yamajiro_s', real:true, name:'小さな 山城', kana:'山城（土塁と 柵の 小さな 城）', mult:1.3, minSize:0,
    t: [
      'mmmmmmmmmmm',
      'mmmPPPPPmmm',
      'mmmPCKCPmmm',
      'mmPPPGPPPmm',
      'mmPCCCCCPmm',
      'mmPPPPGPPmm',
      'mmmmh hmmmm'
    ], gen:{ forest:1.2, hill:1.2, mount:1, river:0.2 } },
  { id:'kannabe', real:true, name:'神辺城', kana:'平山城（川べりの 丘の 城）', mult:1.4, minSize:0,
    t: [
      'mmmmmmmmmmm',
      'mmWWWWWWWmm',
      'mmWCCKCCWmm',
      'mmWWWGWWWmm',
      'hhWCCCCCWhh',
      'hhWCCCCCWhh',
      'hhWWWWGWWhh',
      '~~~~~~B~~~~'
    ], gen:{ forest:0.8, hill:1, mount:0.4, river:0 } },
  { id:'odaka', real:true, name:'尾高城', kana:'平山城（堀切で わけた 曲輪）', mult:1.35, minSize:0,
    t: [
      'hhhhhhhhhhhhh',
      'hWWWWWhWWWWWh',
      'hWCKCWhWCCCWh',
      'hWCCCGGGCCCWh',
      'hWWWWWhWWGWWh',
      'hhhhhhhhh hhh'
    ], gen:{ forest:0.8, hill:1, mount:0.3, river:0.3 } },
  { id:'fuse', real:true, name:'布勢天神山城', kana:'平城（湖山池の ほとり）', mult:1.35, minSize:0,
    t: [
      '~~~~~hhhhhhhh',
      '~~~~WWWWWWWhh',
      '~~~~WCCKCCWhh',
      '~~~~WCCCCCWhh',
      '~~~~WWWWGWWhh',
      '~~~~hhhh hhhh'
    ], gen:{ forest:0.8, hill:0.8, mount:0.3, river:0.2 } },
  { id:'takada', real:true, name:'高田城', kana:'山城（本丸と 二の丸の 山城）', mult:1.45, minSize:0,
    t: [
      'mmmmmmmmmmmmm',
      'mmWWWWWmmmmmm',
      'mmWCKCWmmmmmm',
      'mmWWGWWWWWWmm',
      'mmWCCCCCCCWmm',
      'mmWCCCCCCCWmm',
      'mmWWWWWWGWWmm',
      'mmmmmmmh hmmm'
    ], gen:{ forest:1, hill:1, mount:1, river:0.3 } },
  { id:'matsuyama', real:true, name:'備中松山城', kana:'山城（高い 山に だんだんの 曲輪）', mult:1.55, minSize:1,
    t: [
      'mmmmWWWWWmmmm',
      'mmmmWCKCWmmmm',
      'mmmWWWGWWWmmm',
      'mmmWCCCCCWmmm',
      'mmmWGWWWWWmmm',
      'mmmWCCCCCWmmm',
      'mmmWWWWWGWmmm',
      'mmmWCCCCCWmmm',
      'mmmWWGWWWWmmm',
      'mmmhh hhmmmmm'
    ], gen:{ forest:1, hill:1, mount:1.3, river:0.2 } }
];
var MAPS = CASTLES; // 互換

// ---- マップの大きさ ----
var SIZES = [
  { id:'s', name:'ちいさい', w:15, h:12, turns:15, max:12, pts:{ atk:28, def:24 } },
  { id:'m', name:'ふつう',   w:21, h:16, turns:20, max:16, pts:{ atk:40, def:32 } },
  { id:'l', name:'おおきい', w:27, h:20, turns:25, max:20, pts:{ atk:52, def:38 } }
];
var PALISADE_HP = 5;

var SQ3G = Math.sqrt(3);
// 地形生成用の乱数（シード固定）
function mapRng(seed) {
  var a = (seed >>> 0) || 1;
  return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}

// 城テンプレート＋自動生成の地形で行文字列を作る
function generateRows(castle, size, seed, env) {
  var R = mapRng(seed);
  var tw = castle.t[0].length, th = castle.t.length;
  var W = Math.max(size.w, tw + 4, (env && env.minW) || 0), H = Math.max(size.h, th + 1 + 6, (env && env.minH) || 0);
  var ox = Math.floor((W - tw) / 2), oy = 1;      // 城は上側（oy は奇数行にそろえる）
  var g = [], r, c;
  for (r = 0; r < H; r++) { g.push([]); for (c = 0; c < W; c++) g[r].push('.'); }
  var castleBottom = oy + th - 1;
  var spawnTop = H - 4;
  function inT(cc, rr) { return rr >= oy && rr < oy + th && cc >= ox && cc < ox + tw && castle.t[rr - oy][cc - ox] !== ' '; }
  function free(cc, rr) { return rr >= 0 && rr < H && cc >= 0 && cc < W && !inT(cc, rr); }
  // 実際の 地形（国取り）：城の 本丸を 基準に 海・国を きめる
  var kr0 = -1, kc0 = -1;
  for (r = 0; r < th; r++) for (c = 0; c < tw; c++) if (castle.t[r][c] === 'K') { kr0 = r; kc0 = c; }
  var kx = SQ3G * (ox + kc0 + 0.5 * ((oy + kr0) & 1)), ky = 1.5 * (oy + kr0);
  var geo = null;
  if (env) {
    if (env.setup) env.setup(W, H, kx, ky);
    geo = []; for (r = 0; r < H; r++) { geo.push([]); for (c = 0; c < W; c++) geo[r].push(env.land(SQ3G * (c + 0.5 * (r & 1)) - kx, 1.5 * r - ky)); }
    env.grid = geo;
  }
  var pf = (env && env.prof) || { mount: 1, forest: 1, hill: 1 };
  var gsea = env ? false : castle.gen.sea;
  // 海
  if (gsea) {
    for (r = 0; r <= castleBottom; r++) for (c = 0; c < W; c++) {
      if (r >= oy && c >= ox && c < ox + tw) continue;
      g[r][c] = 's';
    }
    for (r = castleBottom + 1; r < Math.min(H - 5, castleBottom + 3); r++) { for (c = 0; c < W; c++) if (c < ox - 1 - (r - castleBottom) * 2 || c > ox + tw + (r - castleBottom) * 2) g[r][c] = 's'; }
  }
  // かたまり（森・丘・山）
  var area = W * H;
  function blob(ch, n, len, rowMin, rowMax) {
    for (var i = 0; i < n; i++) {
      var cc = Math.floor(R() * W), rr = rowMin + Math.floor(R() * Math.max(1, rowMax - rowMin));
      for (var k = 0; k < len; k++) {
        if (free(cc, rr) && g[rr][cc] === '.') g[rr][cc] = ch;
        var nb = neighbors(cc, rr)[Math.floor(R() * 6)]; cc = nb[0]; rr = nb[1];
        if (rr < 0 || rr >= H || cc < 0 || cc >= W) break;
      }
    }
  }
  if (geo) for (r = 0; r < H; r++) for (c = 0; c < W; c++) {
    if (inT(c, r)) continue;
    if (env.world) { var tt = geo[r][c].t; g[r][c] = 'smMhfr.'.indexOf(tt) >= 0 ? tt : '.'; }
    else if (geo[r][c].sea) g[r][c] = 's';
  }
  // 世界地図の 道（峠の ほそい 道も）
  function hexAtXY(x, y) { var rr = Math.round(y / 1.5); return [Math.round(x / SQ3G - 0.5 * (rr & 1)), rr]; }
  if (env && env.roads) env.roads().forEach(function (rd) {
    for (var k = 1; k < rd.pts.length; k++) {
      var a = rd.pts[k - 1], b = rd.pts[k], n = Math.max(1, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / 0.35)), prev = null;
      for (var j = 0; j <= n; j++) {
        var h = hexAtXY(kx + a[0] + (b[0] - a[0]) * j / n, ky + a[1] + (b[1] - a[1]) * j / n), hc = h[0], hr = h[1];
        if (hr < 0 || hr >= H || hc < 0 || hc >= W || inT(hc, hr)) { prev = null; continue; }
        // となりどうしで つながるように（ななめの すきまを うめる）
        if (prev && hexDist(prev[0], prev[1], hc, hr) > 1) { var nb0 = neighbors(prev[0], prev[1]); for (var q = 0; q < 6; q++) if (hexDist(nb0[q][0], nb0[q][1], hc, hr) === 1 && nb0[q][1] >= 0 && nb0[q][1] < H && nb0[q][0] >= 0 && nb0[q][0] < W && !inT(nb0[q][0], nb0[q][1])) { paintRoad(nb0[q][0], nb0[q][1], rd.sea); break; } }
        paintRoad(hc, hr, rd.sea); prev = h;
      }
    }
  });
  function paintRoad(cc, rr, sea) { var cur = g[rr][cc]; if (cur === 's') return; g[rr][cc] = cur === 'r' ? 'b' : '='; }
  blob('f', Math.round(area / 34 * castle.gen.forest * pf.forest), 4 + Math.floor(R() * 3), 0, H);
  blob('h', Math.round(area / 70 * castle.gen.hill * pf.hill), 3, 0, H - 4);
  blob('m', Math.round(area / 110 * castle.gen.mount * pf.mount), 3, 0, H - 5);
  // 川（城と出陣地のあいだを横切る）
  var riverRow = -1;
  var riverP = env && env.prof && env.prof.river !== undefined ? env.prof.river : castle.gen.river;
  if (R() < riverP && spawnTop - castleBottom >= 5) {
    riverRow = castleBottom + 2 + Math.floor(R() * (spawnTop - castleBottom - 4));
    var rr2 = riverRow;
    for (c = 0; c < W; c++) {
      if (free(c, rr2) && g[rr2][c] !== 's') g[rr2][c] = 'r';
      if (R() < 0.25) { var nr = rr2 + (R() < 0.5 ? -1 : 1); if (nr > castleBottom + 1 && nr < spawnTop - 1) { rr2 = nr; if (free(c, rr2) && g[rr2][c] !== 's') g[rr2][c] = 'r'; } }
    }
    // 道とは別に 1〜2 本の橋
    var nb2 = 1 + Math.floor(R() * 2);
    for (var bi = 0; bi < nb2; bi++) { var bc = Math.floor(R() * W); for (r = castleBottom + 1; r < spawnTop; r++) if (g[r][bc] === 'r') g[r][bc] = 'b'; }
  }
  // テンプレートを書き込む
  var MAP = { '~':'r', 'B':'b', 'P':'P' };
  // 城の 建物（壁・門・曲輪）の 位置
  var built = [];
  for (r = 0; r < th; r++) for (c = 0; c < tw; c++) if ('WPGCK'.indexOf(castle.t[r][c]) >= 0) built.push([ox + c, oy + r]);
  function nearBuilt(cc, rr) { var m = 99; for (var i = 0; i < built.length; i++) { var d = hexDist(cc, rr, built[i][0], built[i][1]); if (d < m) m = d; } return m; }
  for (r = 0; r < th; r++) for (c = 0; c < tw; c++) {
    var ch = castle.t[r][c]; if (ch === ' ') continue;
    if (ch === 'm') {
      // 山は 城から はなれるほど まばらに（しぜんな 山すそ）
      var dm = nearBuilt(ox + c, oy + r);
      if (dm >= 3) { if (R() < 0.3) g[oy + r][ox + c] = R() < 0.5 ? 'h' : 'f'; continue; }
      if (dm === 2 && R() < 0.3) { g[oy + r][ox + c] = 'h'; continue; }
    }
    g[oy + r][ox + c] = MAP[ch] || ch;
  }
  // 道：いちばん外の門から下へ（世界地図では いちばん 近い 道へ つなぐ）
  for (r = 0; r < H; r++) for (c = 0; c < W; c++) {
    if (g[r][c] !== 'G') continue;
    if (env && env.world) {
      var bl = r + 1 < H ? g[r + 1][c] : null;
      if (!bl || 'WPCKG'.indexOf(bl) >= 0) continue;
      connectGate(c, r + 1); continue;
    }
    // 外側の門＝下のマスが城の外
    var below = r + 1 < H ? g[r + 1][c] : null;
    if (!below || 'WPCKG'.indexOf(below) >= 0) continue;
    var cc2 = c, center = Math.floor(W / 2);
    for (var r3 = r + 1; r3 < H; r3++) {
      var cur = g[r3][cc2];
      if (cur === 'r') g[r3][cc2] = 'b';
      else if (cur === 's') { if (!env) break; g[r3][cc2] = '='; }
      else if ('WPGCK'.indexOf(cur) < 0 && cur !== 'b') g[r3][cc2] = '=';
      // 下の行へ：ときどき中央に寄る（隣接を保つ）
      if (r3 > r + 2 && R() < 0.35 && cc2 !== center) {
        var odd = r3 & 1, step = cc2 < center ? 1 : -1;
        // odd 行→次行で c / c+1、even 行→ c-1 / c に隣接
        if (odd && step === 1) cc2 += 1; else if (!odd && step === -1) cc2 -= 1;
      }
    }
  }
  // 国取り：領内に つくった 柵・堀・砦
  if (geo) for (r = 0; r < spawnTop; r++) for (c = 0; c < W; c++) {
    var fb = geo[r][c].bld; if (!fb || inT(c, r) || 'smMWPGCK'.indexOf(g[r][c]) >= 0) continue;
    if (fb === 'saku') g[r][c] = 'P';
    else if (fb === 'hori') g[r][c] = 'r';
    else if (fb === 'toride') {
      g[r][c] = 'C';
      neighbors(c, r).forEach(function (nb, i) {
        var nc = nb[0], nr = nb[1]; if (nr < 0 || nr >= spawnTop || nc < 0 || nc >= W || inT(nc, nr) || 'sMWPGCK'.indexOf(g[nr][nc]) >= 0) return;
        g[nr][nc] = (i === 4 || i === 5) && !g.__gate ? 'G' : 'P';   // 下がわに 門
        if (i === 4 || i === 5) g.__gate = 1;
      });
      g.__gate = 0;
    }
  }
  // 出陣地（下 4 行）は平地に
  for (r = spawnTop; r < H; r++) for (c = 0; c < W; c++) if ('mrsM'.indexOf(g[r][c]) >= 0) g[r][c] = '.';
  // 世界地図：出陣地から 城まで 歩いて いけなければ 道を ひらく（けわしい 山の きりとおし）
  if (env && env.world) ensureReach();
  if (env) env.keepXY = [kx, ky];
  // 門の 下から いちばん 近い 道（または 出陣地）まで 道を つける
  function connectGate(c0, r0) {
    var prev = {}, q = [[c0, r0]], k0 = c0 + ',' + r0; prev[k0] = null; var goal = null;
    for (var h = 0; h < q.length && !goal; h++) {
      var cur = q[h];
      if ((g[cur[1]][cur[0]] === '=' || cur[1] >= spawnTop) && h > 0) { goal = cur; break; }
      neighbors(cur[0], cur[1]).forEach(function (nb) {
        if (nb[1] < 0 || nb[1] >= H || nb[0] < 0 || nb[0] >= W) return; var kk = nb[0] + ',' + nb[1]; if (kk in prev) return;
        var ch = g[nb[1]][nb[0]]; if ('sMWPGCK'.indexOf(ch) >= 0 || inT(nb[0], nb[1])) return;
        prev[kk] = cur; q.push(nb);
      });
    }
    if (!goal) return;
    for (var p0 = goal; p0; p0 = prev[p0[0] + ',' + p0[1]]) { var ch2 = g[p0[1]][p0[0]]; if ('WPGCK'.indexOf(ch2) >= 0) continue; g[p0[1]][p0[0]] = ch2 === 'r' ? 'b' : (ch2 === 'b' ? 'b' : '='); }
  }
  // 出陣地から 城の まわりへ（けわしい 山 しか なければ きりとおしを つける）
  function ensureReach() {
    var seen = {}, q = [], cx = Math.floor(W / 2);
    for (var c1 = 0; c1 < W; c1++) { q.push([c1, H - 1]); seen[c1 + ',' + (H - 1)] = null; }
    var ok = false;
    for (var h = 0; h < q.length; h++) {
      var cur = q[h];
      if (built.some(function (b) { return hexDist(b[0], b[1], cur[0], cur[1]) === 1; })) { ok = true; break; }
      neighbors(cur[0], cur[1]).forEach(function (nb) {
        if (nb[1] < 0 || nb[1] >= H || nb[0] < 0 || nb[0] >= W) return; var kk = nb[0] + ',' + nb[1]; if (kk in seen) return;
        var ch = g[nb[1]][nb[0]]; if ('sMWPGCK'.indexOf(ch) >= 0) return;
        seen[kk] = cur; q.push(nb);
      });
    }
    if (ok) return;
    // まっすぐ 上へ きりとおし
    var gate = null; for (var rr = 0; rr < H; rr++) for (var cc = 0; cc < W; cc++) if (g[rr][cc] === 'G' && (!gate || rr > gate[1])) gate = [cc, rr];
    var c2 = gate ? gate[0] : cx;
    for (var r2 = H - 1; r2 > (gate ? gate[1] : 0); r2--) { var ch3 = g[r2][c2]; if ('WPGCK'.indexOf(ch3) >= 0) break; g[r2][c2] = ch3 === 'r' ? 'b' : '='; }
  }
  return g.map(function (row) { return row.join(''); });
}

// ---- 大将キャラ ----
var CHARS = [
  { id:'fute',  name:'フテ猫',      spr:'fute_inf',  win:'fute_joy',  lose:'fute_sad',   color:'#e8842a' },
  { id:'kuro',  name:'クロネコさん', spr:'kuro_inf',  win:'kuro_joy',  lose:'kuro_angry', color:'#5a5a7a' },
  { id:'chap',  name:'チャッピーちゃん', spr:'chap_joy', win:'chap_joy', lose:'chap_idea', color:'#7cc7e8' },
  { id:'akari', name:'あかりちゃん', spr:'akari_smile', win:'akari_smile', lose:'akari_wow', color:'#f0a8c8' }
];

// ---- ヘックス（odd-r オフセット, pointy-top） ----
function neighbors(c, r) {
  var odd = r & 1;
  return odd ? [[c+1,r],[c-1,r],[c,r-1],[c+1,r-1],[c,r+1],[c+1,r+1]]
             : [[c+1,r],[c-1,r],[c-1,r-1],[c,r-1],[c-1,r+1],[c,r+1]];
}
function toCube(c, r) { var x = c - ((r - (r & 1)) >> 1); var z = r; return [x, -x - z, z]; }
function hexDist(c1, r1, c2, r2) {
  var a = toCube(c1, r1), b = toCube(c2, r2);
  return Math.max(Math.abs(a[0]-b[0]), Math.abs(a[1]-b[1]), Math.abs(a[2]-b[2]));
}
function key(c, r) { return c + ',' + r; }

// ---- 乱数（テスト用にシード可能） ----
var RNG = { seed: 12345, mode: 'math' };
function rand() {
  if (RNG.mode === 'seed') { RNG.seed = (RNG.seed * 1103515245 + 12345) & 0x7fffffff; return RNG.seed / 0x7fffffff; }
  return Math.random();
}

// ---- ゲーム状態 ----
function buildMap(mapDef) {
  var tiles = [];
  for (var r = 0; r < mapDef.rows.length; r++) {
    var row = [];
    for (var c = 0; c < mapDef.rows[r].length; c++) {
      var ch = mapDef.rows[r][c], wood = false;
      if (ch === 'P') { ch = 'W'; wood = true; }
      var t = { c:c, r:r, ch:ch, terr:TERRAIN[ch].id, hp:0, maxHp:0, broken:false, open:false, wood:wood };
      if (ch === 'W') t.hp = t.maxHp = wood ? PALISADE_HP : WALL_HP;
      if (ch === 'G') t.hp = t.maxHp = GATE_HP;
      row.push(t);
    }
    tiles.push(row);
  }
  return { w: mapDef.rows[0].length, h: mapDef.rows.length, tiles: tiles };
}
function tileAt(G, c, r) {
  if (r < 0 || r >= G.map.h || c < 0 || c >= G.map.w) return null;
  return G.map.tiles[r][c];
}
function unitAt(G, c, r) {
  for (var i = 0; i < G.units.length; i++) { var u = G.units[i]; if (u.hp > 0 && u.c === c && u.r === r) return u; }
  return null;
}
function findKeep(G) {
  for (var r = 0; r < G.map.h; r++) for (var c = 0; c < G.map.w; c++) if (G.map.tiles[r][c].ch === 'K') return G.map.tiles[r][c];
  return null;
}
function listTiles(G, ch) {
  var out = [];
  for (var r = 0; r < G.map.h; r++) for (var c = 0; c < G.map.w; c++) if (G.map.tiles[r][c].ch === ch) out.push(G.map.tiles[r][c]);
  return out;
}

// 移動コスト: null = 入れない
// side: 'atk' / 'def'
function moveCost(G, u, t) {
  if (!t) return null;
  var ty = u.type, s = u.side;
  switch (t.ch) {
    case '.': case '=': case 'C': case 'K': case 'b': return 1;
    case 'f': return ty === 'kiba' ? 3 : 2;
    case 'h': return 2;
    case 'm': if (ty === 'kiba') return null; return ty === 'ninja' ? 2 : 3;
    case 'M': return null;
    case 'r': if (ty === 'kiba') return 4; return (ty === 'ninja') ? 2 : 3;
    case 's': return ty === 'ninja' ? 3 : null;
    case 'W':
      if (t.broken) return 2;
      if (s === 'def') return 1;
      if (ty === 'ninja') return 2;
      return null;
    case 'G':
      if (t.broken || t.open || s === 'def') return 1;
      if (ty === 'ninja') return 2;
      return null;
  }
  return null;
}
function defMod(G, u, t) {
  var m = TERRAIN[t.ch].def;
  if (G.fortLv && u && u.side === 'def' && 'WGCK'.indexOf(t.ch) >= 0 && !t.wood && t.r <= (G.castleBottom || 99)) m *= 1 - 0.06 * G.fortLv;
  if (t.ch === 'W' && t.wood) m = 0.75;
  if (t.ch === 'W' && t.broken) m = 0.9;
  if (t.ch === 'G' && t.broken) m = 0.9;
  return m;
}

// 到達可能ヘックス（Dijkstra）。敵ユニットのいるマスは通れない。味方は通れるが止まれない。
function reachable(G, u) {
  var start = key(u.c, u.r);
  var dist = {}; dist[start] = 0;
  var from = {};
  var open = [[0, u.c, u.r]];
  while (open.length) {
    open.sort(function (a, b) { return a[0] - b[0]; });
    var cur = open.shift();
    var d = cur[0], c = cur[1], r = cur[2];
    if (d > dist[key(c, r)]) continue;
    var nb = neighbors(c, r);
    for (var i = 0; i < nb.length; i++) {
      var t = tileAt(G, nb[i][0], nb[i][1]);
      if (!t) continue;
      var cost = moveCost(G, u, t);
      if (cost === null) continue;
      var occ = unitAt(G, t.c, t.r);
      if (occ && occ.side !== u.side) {
        // 隠れている忍者は通れない（ぶつかる）扱い
        continue;
      }
      var nd = d + cost;
      if (nd > u.mov) continue;
      var k = key(t.c, t.r);
      if (dist[k] === undefined || nd < dist[k]) { dist[k] = nd; from[k] = key(c, r); open.push([nd, t.c, t.r]); }
    }
  }
  var res = {};
  for (var k2 in dist) {
    if (k2 === start) { res[k2] = { cost: 0 }; continue; }
    var p = k2.split(',').map(Number);
    if (unitAt(G, p[0], p[1])) continue; // 味方がいる→止まれない
    res[k2] = { cost: dist[k2] };
  }
  res.__from = from;
  return res;
}
function pathTo(reach, c, r) {
  var from = reach.__from, k = key(c, r), out = [];
  while (k) { var p = k.split(',').map(Number); out.unshift(p); k = from[k]; }
  return out;
}

// 可視性（忍者の隠密）
function isVisibleTo(G, u, side) {
  if (u.side === side) return true;
  if (u.type !== 'ninja') return true;
  if (u.revealed) return true;
  for (var i = 0; i < G.units.length; i++) {
    var v = G.units[i];
    if (v.hp <= 0 || v.side !== side) continue;
    if (hexDist(v.c, v.r, u.c, u.r) <= 1) return true;
  }
  return false;
}

// 攻撃可能か（位置 c,r から target）
function canAttackFrom(G, u, c, r, target, moved) {
  if (target.hp <= 0 || target.side === u.side || u.type === 'konida') return false;
  if (u.type === 'teppo' && moved) return false;
  var d = hexDist(c, r, target.c, target.r);
  return d >= u.rmin && d <= u.rmax;
}
function generalAdjacent(G, u) {
  for (var i = 0; i < G.units.length; i++) {
    var v = G.units[i];
    if (v.hp > 0 && v.side === u.side && v.type === 'taisho' && v !== u && hexDist(v.c, v.r, u.c, u.r) <= 1) return true;
  }
  return false;
}
var DMG_SCALE = 1.4, FAR_SHOT = 0.55, TAISHO_GUARD = 0.75;
function estimateDamage(G, a, aC, aR, d) {
  var base = a.atk * (a.hp / 10);
  var bonus = (BONUS[a.type] && BONUS[a.type][d.type]) || 1;
  var t = tileAt(G, d.c, d.r);
  var terr = defMod(G, d, t);
  var gen = generalAdjacent(G, a) ? 1.2 : 1;
  var dist = hexDist(aC, aR, d.c, d.r);
  var fall = dist >= 3 ? FAR_SHOT : 1;
  if (d.type === 'taisho') fall *= TAISHO_GUARD;
  var sm = (G && G.sideMult && G.sideMult[a.side]) || 1;
  var dmg = base * (1 - d.def * 0.07) * bonus * terr * gen * fall * DMG_SCALE * sm;
  return Math.max(dmg, 0.5);
}
// その隊の いまの 人数（騎馬は 騎、鉄砲は 挺）
function defMen(G) { var m = 0; G.units.forEach(function (u) { if (u.side === 'def' && u.hp > 0 && !u.fled && u.type !== 'taisho') m += menOf(u); }); return m; }
function defFoodDays(G) { if (G.defFood === undefined) return null; var m = defMen(G); return m ? Math.floor(G.defFood / (m * 0.0025)) : 999; }
function atkMen(G) { var m = 0; G.units.forEach(function (u) { if (u.side === 'atk' && u.hp > 0 && !u.fled && u.type !== 'taisho' && u.type !== 'konida') m += menOf(u); }); return m; }
// ---- 補給（小荷駄隊） ----
function activeConvoy(G, side) { return G.units.filter(function (u) { return u.type === 'konida' && u.side === side && u.hp > 0 && !u.delivered; })[0] || null; }
// 国ざかい（攻め口）に 小荷駄隊を だす。days 日ぶんの 兵糧（いまの 人数で）
function sendSupply(G, days, side) {
  side = side || 'atk'; if (G.food === undefined || activeConvoy(G, side)) return null;
  var F = G.fronts && G.fronts[0] ? G.fronts[0] : { c: Math.floor(G.map.w / 2), r: G.map.h - 1 }, best = null;
  for (var r = 0; r < G.map.h; r++) for (var c = 0; c < G.map.w; c++) {
    var t = G.map.tiles[r][c]; if ('.=fhb'.indexOf(t.ch) < 0 || unitAt(G, c, r)) continue;
    var d = hexDist(c, r, F.c, F.r) + (G.map.h - 1 - r) * 0.2; if (!best || d < best[1]) best = [t, d];
  }
  if (!best) return null;
  var u = makeUnit('konida', side, null); u.c = best[0].c; u.r = best[0].r; u.revealed = true;
  u.cargo = days * Math.max(1, atkMen(G)); u.cargoDays = days; G.units.push(u);
  return u;
}
// きせつの おわり（その がわの 番の おわり）：おそわれる・とどける
function convoyStep(G, side) {
  var notes = G.notes || (G.notes = []);
  G.units.forEach(function (u) {
    if (u.type !== 'konida' || u.side !== side || u.hp <= 0 || u.delivered) return;
    var t = tileAt(G, u.c, u.r), guard = G.units.some(function (o) { return o !== u && o.side === side && o.hp > 0 && !o.fled && o.type !== 'konida' && hexDist(o.c, o.r, u.c, u.r) <= 2; });
    if (u.moved && !guard) {   // 野伏せり・伏兵に おそわれる
      var ch = 'fmh'.indexOf(t.ch) >= 0 ? 0.35 : 0.12;
      if (rand() < ch) {
        var dmg = 3 + Math.floor(rand() * 4), lost = Math.min(u.hp, dmg) / u.hp;
        u.cargo = Math.round(u.cargo * (1 - lost * 0.8)); u.hp = Math.max(0, u.hp - dmg);
        notes.push({ c: u.c, r: u.r, side: side, text: u.hp > 0 ? '小荷駄隊が 伏兵に おそわれた！ 兵糧が へった' : '小荷駄隊が 伏兵に おそわれ、兵糧を うばわれた…' });
        if (u.hp <= 0) return;
      }
    }
    // 本隊（みかた 3隊いじょう）の 2マス いないに とどけば 兵糧が ふえる
    var near = G.units.filter(function (o) { return o !== u && o.side === side && o.hp > 0 && !o.fled && o.type !== 'konida' && hexDist(o.c, o.r, u.c, u.r) <= 2; });
    var army = G.units.filter(function (o) { return o.side === side && o.hp > 0 && !o.fled && o.type !== 'konida'; });
    if (near.length >= Math.min(3, army.length)) {
      var men = Math.max(1, atkMen(G)), add = u.cargo; G.food += add; u.delivered = true; var dc = u.c, dr = u.r; u.hp = 0; u.c = -99; u.r = -99;
      notes.push({ c: dc, r: dr, side: side, text: '小荷駄隊が 本隊に とどいた！ 兵糧 +' + Math.floor(add / men) + '日ぶん' });
    }
  });
}
// 兵糧が あと 何日 もつか
function foodDays(G) { if (G.food === undefined) return null; return Math.max(0, Math.floor(G.food / Math.max(1, atkMen(G)))); }
function menOf(u) { return Math.max(1, Math.round(u.hp * UNIT_TYPES[u.type].men / 10)); }
function menUnit(type) { return type === 'kiba' ? '騎' : type === 'teppo' ? '挺' : '人'; }
function rollDamage(est) {
  var v = est * (0.85 + rand() * 0.3);
  return Math.max(1, Math.round(v));
}

// 戦闘を実行。戻り値: {dmg, counter, killed, counterKilled}
function doAttack(G, a, d) {
  var res = { dmg: 0, counter: 0, killed: false, counterKilled: false };
  var est = estimateDamage(G, a, a.c, a.r, d);
  res.dmg = rollDamage(est);
  d.hp -= res.dmg;
  if (a.type === 'ninja') a.revealed = true;
  if (d.type === 'ninja') d.revealed = true;
  if (d.hp <= 0) { d.hp = 0; res.killed = true; }
  else {
    var dist = hexDist(a.c, a.r, d.c, d.r);
    var canCounter = dist >= d.rmin && dist <= d.rmax;
    if (canCounter) {
      var est2 = estimateDamage(G, d, d.c, d.r, a) * 0.8;
      res.counter = rollDamage(est2);
      a.hp -= res.counter;
      if (a.hp <= 0) { a.hp = 0; res.counterKilled = true; }
    }
  }
  a.acted = true;
  return res;
}

// 城壁・門への攻撃
function wallDamage(u) {
  switch (u.type) {
    case 'kosaku': return 6;
    case 'teppo': return 3;
    case 'yumi': return 1;
    case 'ninja': return 1;
    default: return 2;
  }
}
function canHitWallFrom(G, u, c, r, t, moved) {
  if (!t || (t.ch !== 'W' && t.ch !== 'G') || t.broken) return false;
  if (u.side === 'def' || u.type === 'konida') return false;
  if (unitAt(G, t.c, t.r)) return false;
  if (wallDamage(u) <= 0) return false;
  if (u.type === 'teppo' && moved) return false;
  var d = hexDist(c, r, t.c, t.r);
  return d >= u.rmin && d <= u.rmax;
}
function doHitWall(G, u, t) {
  var dmg = wallDamage(u);
  t.hp -= dmg;
  if (t.hp <= 0) { t.hp = 0; t.broken = true; }
  u.acted = true;
  return dmg;
}
function canRepairFrom(G, u, c, r, t) {
  if (u.type !== 'kosaku' || u.side !== 'def') return false;
  if (!t || (t.ch !== 'W' && t.ch !== 'G')) return false;
  if (t.broken) return false;            // こわれて あいた あなは ふさげない
  if (t.hp >= t.maxHp) return false;
  return hexDist(c, r, t.c, t.r) <= 1;
}
function doRepair(G, u, t) {
  t.hp = Math.min(t.maxHp, t.hp + REPAIR_AMOUNT);
  u.acted = true;
}
function canOpenGateFrom(G, u, c, r, t) {
  if (u.type !== 'ninja' || u.side !== 'atk') return false;
  if (!t || t.ch !== 'G' || t.open || t.broken) return false;
  return hexDist(c, r, t.c, t.r) <= 1;
}
function doOpenGate(G, u, t) { t.open = true; u.acted = true; u.revealed = true; }
function canCloseGateFrom(G, u, c, r, t) {
  if (u.side !== 'def') return false;
  if (!t || t.ch !== 'G' || !t.open || t.broken) return false;
  if (unitAt(G, t.c, t.r) && unitAt(G, t.c, t.r).side === 'atk') return false;
  return hexDist(c, r, t.c, t.r) <= 1;
}
function doCloseGate(G, u, t) { t.open = false; u.acted = true; }
function canBuildBridgeFrom(G, u, c, r, t) {
  if (u.type !== 'kosaku') return false;
  if (!t || t.ch !== 'r') return false;
  return hexDist(c, r, t.c, t.r) <= 1;
}
function doBuildBridge(G, u, t) { t.ch = 'b'; t.terr = 'bridge'; u.acted = true; }

// ---- ユニット生成・配置 ----
var uidSeq = 1;
function makeUnit(type, side, charId) {
  var T = UNIT_TYPES[type];
  return { id: uidSeq++, type: type, side: side, atk: T.atk, def: T.def, mov: T.mov, rmin: T.rmin, rmax: T.rmax,
           hp: 10, c: -1, r: -1, acted: false, moved: false, revealed: false, charId: charId || null };
}
function defaultArmy(side, sizeIndex, castleIndex) {
  var si = sizeIndex || 0;
  var A = [
    { ashigaru: 4, kiba: 2, yumi: 1, teppo: 0, kosaku: 1, ninja: 1 },
    { ashigaru: 5, kiba: 2, yumi: 2, teppo: 1, kosaku: 2, ninja: 1 },
    { ashigaru: 6, kiba: 3, yumi: 2, teppo: 2, kosaku: 2, ninja: 1 }
  ];
  var D = [
    { ashigaru: 5, kiba: 0, yumi: 2, teppo: 1, kosaku: 1, ninja: 0 },
    { ashigaru: 6, kiba: 0, yumi: 3, teppo: 1, kosaku: 2, ninja: 0 },
    { ashigaru: 7, kiba: 0, yumi: 3, teppo: 2, kosaku: 2, ninja: 0 }
  ];
  var src = (side === 'atk' ? A : D)[si], o = {};
  for (var k in src) o[k] = src[k];
  var a = castleAdj(castleIndex, side);
  for (var k2 in a) o[k2] = Math.max(0, (o[k2] || 0) + a[k2]);
  return o;
}
function castleAdj(ci, side) { var c = CASTLES[ci || 0]; return (c && c.adj && c.adj[side]) || {}; }
function pointsFor(side, sizeIndex, castleIndex) {
  var p = SIZES[sizeIndex || 0].pts[side], a = castleAdj(castleIndex, side);
  for (var k in a) p += UNIT_TYPES[k].cost * a[k];
  return p;
}
function maxUnitsFor(sizeIndex) { return SIZES[sizeIndex || 0].max; }
function armyCost(army) {
  var s = 0; for (var k in army) s += UNIT_TYPES[k].cost * army[k]; return s;
}
function armyCount(army) { var s = 0; for (var k in army) s += army[k]; return s; }
var POINTS = { atk: 28, def: 22 };
var MAX_UNITS = 12;

// 配置：防衛側は城内/城壁、攻撃側は下側
function placeArmies(G) {
  var keep = findKeep(G);
  var walls = listTiles(G, 'W'), courts = listTiles(G, 'C'), gates = listTiles(G, 'G');
  gates.sort(function (a, b) { return b.r - a.r; });
  var gate = gates[0];
  function gd(t) { var m = 99; gates.forEach(function (q) { if (q.r === gate.r) m = Math.min(m, hexDist(t.c, t.r, q.c, q.r)); }); return m; }
  // 城壁：攻め手側（下）・門に近い順
  walls.sort(function (a, b) { return (b.r - a.r) || gd(a) - gd(b); });
  // 城内：本丸と門のあいだを優先（門に近いほう→本丸まわり）
  courts.sort(function (a, b) { return gd(a) - gd(b) || (b.r - a.r); });
  var used = {};
  function put(u, t) { u.c = t.c; u.r = t.r; used[key(t.c, t.r)] = true; }
  function nextFree(list) { for (var i = 0; i < list.length; i++) if (!used[key(list[i].c, list[i].r)]) return list[i]; return null; }
  var defs = G.units.filter(function (u) { return u.side === 'def' && !(u.dfront && G.defFronts && G.defFronts[u.dfront]); });   // 援軍は あとで 入口に
  var atks = G.units.filter(function (u) { return u.side === 'atk'; });
  // 防衛側
  defs.forEach(function (u) {
    if (u.type === 'taisho') put(u, keep);
  });
  // 大将の護衛：本丸のとなりに足軽を 2 たい
  var guardSpots = courts.filter(function (t) { return hexDist(t.c, t.r, keep.c, keep.r) === 1; });
  var nGuard = 0;
  defs.forEach(function (u) {
    if (u.type !== 'ashigaru' || nGuard >= 2 || u.c >= 0) return;
    var t = nextFree(guardSpots); if (t) { put(u, t); u.guard = true; nGuard++; }
  });
  defs.forEach(function (u) {
    if (u.type === 'yumi' || u.type === 'teppo') { var t = nextFree(walls); if (t) put(u, t); }
  });
  defs.forEach(function (u) {
    if (u.c >= 0) return;
    var t = nextFree(courts) || nextFree(walls);
    if (t) put(u, t);
  });
  // 攻撃側：下 3 行の中央付近、平地優先
  var spots = [];
  for (var r = G.map.h - 1; r >= G.map.h - 4; r--) for (var c = 0; c < G.map.w; c++) {
    var t = G.map.tiles[r][c];
    if (t.ch === 'm' || t.ch === 'r' || t.ch === 'W' || t.ch === 's') continue;
    spots.push(t);
  }
  var cx = Math.floor(G.map.w / 2);
  spots.sort(function (a, b) { return (Math.abs(a.c - cx) + (G.map.h - 1 - a.r) * 1.5) - (Math.abs(b.c - cx) + (G.map.h - 1 - b.r) * 1.5); });
  // 大将はやや後ろ、騎馬・足軽は前
  var order = { ashigaru: 0, kiba: 0, kosaku: 1, ninja: 1, yumi: 2, teppo: 2, taisho: 3 };
  atks.sort(function (a, b) { return order[a.type] - order[b.type]; });
  // 前列=上の行（敵に近い）
  spots.sort(function (a, b) { return (a.r - b.r) || (Math.abs(a.c - cx) - Math.abs(b.c - cx)); });
  var front = spots.filter(function (t) { return t.r === G.map.h - 4 || t.r === G.map.h - 3; });
  var back = spots.filter(function (t) { return t.r >= G.map.h - 2; });
  front.sort(function (a, b) { return (a.r - b.r) || (Math.abs(a.c - cx) - Math.abs(b.c - cx)); });
  back.sort(function (a, b) { return (a.r - b.r) || (Math.abs(a.c - cx) - Math.abs(b.c - cx)); });
  // 守りの 援軍：それぞれの 入口の まわり
  G.units.forEach(function (u) {
    if (u.side !== 'def' || !u.dfront || !G.defFronts || !G.defFronts[u.dfront]) return;
    var F = G.defFronts[u.dfront], cand = [];
    for (var r3 = 0; r3 < G.map.h; r3++) for (var c3 = 0; c3 < G.map.w; c3++) { var t3 = G.map.tiles[r3][c3]; if ('.=fhbC'.indexOf(t3.ch) < 0 || used[key(c3, r3)]) continue; var o3 = unitAt(G, c3, r3); if (o3 && o3 !== u) continue; var d3 = hexDist(c3, r3, F.c, F.r); if (d3 <= 5) cand.push([t3, d3]); }
    cand.sort(function (a, b) { return a[1] - b[1]; });
    if (cand.length) put(u, cand[0][0]);
  });
  atks.forEach(function (u) {
    if (u.front && G.fronts && G.fronts[u.front]) {   // ほかの 国からの 軍：その 攻め口の まわり
      var F = G.fronts[u.front], cand = [];
      for (var r2 = 0; r2 < G.map.h; r2++) for (var c2 = 0; c2 < G.map.w; c2++) { var t2 = G.map.tiles[r2][c2]; if ('.=fhb'.indexOf(t2.ch) < 0 || used[key(c2, r2)] || unitAt(G, c2, r2)) continue; var dd = hexDist(c2, r2, F.c, F.r); if (dd <= 4) cand.push([t2, dd]); }
      cand.sort(function (a, b) { return a[1] - b[1]; });
      if (cand.length) { put(u, cand[0][0]); return; }
    }
    var t = (order[u.type] <= 1 ? nextFree(front) : nextFree(back)) || nextFree(front) || nextFree(back) || nextFree(spots);
    if (t) put(u, t);
  });
}

function newGame(opts) {
  // opts: {mapIndex, playerSide:'atk'|'def', playerChar, cpuChar, playerArmy, cpuArmy, difficulty}
  var castle = CASTLES[opts.mapIndex || 0], si = opts.sizeIndex || 0, size = SIZES[si];
  var seed = opts.mapSeed || Math.floor(Math.random() * 1e9) + 1;
  var env = opts.env || null;
  var mapDef = { id: castle.id, name: castle.name, rows: generateRows(castle, size, seed, env) };
  var G = { map: buildMap(mapDef), mapDef: mapDef, castle: castle, sizeIndex: si, turnLimit: size.turns, mapSeed: seed, units: [], turn: 1, side: 'atk', playerSide: opts.playerSide,
            cpuSide: opts.playerSide === 'atk' ? 'def' : 'atk', over: false, winner: null, log: [], difficulty: opts.difficulty || 'normal',
            chars: {} };
  G.chars[opts.playerSide] = opts.playerChar;
  G.chars[G.cpuSide] = opts.cpuChar;
  function addArmy(side, army, charId, list) {
    G.units.push(makeUnit('taisho', side, charId));
    if (list) {
      // 国取り：兵の かず（hp）を ひきついだ へい
      list.forEach(function (it) { var u = makeUnit(it.type, side, null); u.hp = Math.max(0.05, Math.min(10, it.hp || 10)); u.ref = it.uid; if (it.front) u.front = it.front; if (it.dfront) u.dfront = it.dfront; G.units.push(u); });
      return;
    }
    for (var k in army) for (var i = 0; i < army[k]; i++) G.units.push(makeUnit(k, side, null));
  }
  addArmy(opts.playerSide, opts.playerArmy, opts.playerChar, opts.playerUnits);
  addArmy(G.cpuSide, opts.cpuArmy, opts.cpuChar, opts.cpuUnits);
  G.generals = opts.generals || null;   // {atk:{name,charId,crest,color}, def:{...}}
  G.sideMult = opts.sideMult || null;   // 大将（家臣）の 武で こうげき力 アップ
  G.campaign = !!opts.campaign;
  // 国ざかいから すすむ ぶん ターンを ふやす
  if (G.map.h > size.h) G.turnLimit = size.turns + Math.ceil((G.map.h - size.h) / 1.2) + 3;
  // 兵糧：攻め手が もってきた 日数ぶん（へいが へると ながもち）。ターン制限の かわり
  if (opts.food) { G.food = opts.food * Math.max(1, atkMen(G)); G.food0 = opts.food; G.turnLimit = 999; }
  // 城の 兵糧（石）：守りの へいが 1日 1人 2.5合
  if (opts.defFood !== undefined) G.defFood = opts.defFood;
  // 城の 改築：石垣・門が かたく、城の 中の 守りが つよい
  G.fortLv = opts.fortLv || 0; G.castleBottom = castle.t.length + 1;
  if (G.fortLv) G.map.tiles.forEach(function (row) { row.forEach(function (t) {
    if (t.ch === 'W' && !t.wood && t.hp) { t.hp = t.maxHp = t.maxHp + 3 * G.fortLv; }
    if (t.ch === 'G') { t.hp = t.maxHp = t.maxHp + 2 * G.fortLv; }
  }); });
  // こわれた 城：石垣・門は 4わりの つよさから（工作で なおせる）
  if (opts.ruin) { G.ruin = true; G.map.tiles.forEach(function (row) { row.forEach(function (t) {
    if ((t.ch === 'W' && !t.wood || t.ch === 'G') && t.hp) t.hp = Math.max(1, Math.ceil(t.maxHp * 0.4)); }); }); }
  if (env) setupGeo(G, env);
  placeArmies(G);
  return G;
}

// ---- 実地形：国・方角・退き口 ----
// 画面の 角度 a（右=0, 下=+90°）へ 本丸から まっすぐ のばして、地図の はしの マスを えらぶ
function edgeHexAt(G, ang) {
  var keep = findKeep(G), kx = SQ3G * (keep.c + 0.5 * (keep.r & 1)), ky = 1.5 * keep.r;
  var dx = Math.cos(ang), dy = Math.sin(ang), last = null;
  for (var s = 0; s < 400; s += 0.5) {
    var x = kx + dx * s, y = ky + dy * s, r = Math.round(y / 1.5), c = Math.round(x / SQ3G - 0.5 * (r & 1));
    if (r < 0 || r >= G.map.h || c < 0 || c >= G.map.w) break;
    last = [c, r];
  }
  return last;
}
function exitOK(t) { return t && '.=fhb'.indexOf(t.ch) >= 0; }
// 援軍の 入口：みちが 国に はいる ところ、または その 城の ばしょ（地図の そとなら はしっこ）
function defAnchor(G, env, f) {
  var kxy1 = env.keepXY || [0, 0], best = null, lastIn = null;
  for (var k = 0; k < f.path.length; k++) {
    var bq = env.toBattle(f.path[k]), rr = Math.round((kxy1[1] + bq[1]) / 1.5), cc = Math.round((kxy1[0] + bq[0]) / SQ3G - 0.5 * (rr & 1));
    var inside = rr >= 1 && rr < G.map.h - 1 && cc >= 1 && cc < G.map.w - 1;
    if (!inside) { if (f.path.length === 1) best = [Math.max(1, Math.min(G.map.w - 2, cc)), Math.max(1, Math.min(G.map.h - 2, rr))]; continue; }
    lastIn = [cc, rr]; if (!best) best = [cc, rr];
    if (f.inTo[k]) { best = [cc, rr]; break; }
  }
  if (!best) best = lastIn || [Math.floor(G.map.w / 2), 1];
  var bt = null; for (var r2 = 0; r2 < G.map.h; r2++) for (var c2 = 0; c2 < G.map.w; c2++) { var t2 = G.map.tiles[r2][c2]; if ('.=fhbC'.indexOf(t2.ch) < 0) continue; var d2 = hexDist(c2, r2, best[0], best[1]); if (!bt || d2 < bt[1]) bt = [t2, d2]; }
  return bt ? { c: bt[0].c, r: bt[0].r, name: f.name } : null;
}
function setupGeo(G, env) {
  var r, c; G.env = env;
  for (r = 0; r < G.map.h; r++) for (c = 0; c < G.map.w; c++) { var cell = env.grid && env.grid[r] && env.grid[r][c], tl = G.map.tiles[r][c]; tl.prov = cell && !cell.sea ? cell.prov : null; tl.bld = cell && cell.bld && '.=fh'.indexOf(tl.ch) >= 0 ? cell.bld : null; }
  G.north = env.north;  // 画面での 北の 向き（ラジアン）
  G.geoInfo = { from: env.from, fromName: env.fromName, to: env.to, toName: env.toName, names: env.names || {}, river: env.riverName || null };
  G.exits = { atk: [], def: [] };
  // 攻め手：うしろ（下の はし）が 退き口＝出撃した 国へ
  var cx = Math.floor(G.map.w / 2), bot = [];
  for (c = 0; c < G.map.w; c++) { var t = G.map.tiles[G.map.h - 1][c]; if (exitOK(t)) bot.push(t); }
  bot.sort(function (a, b) { return Math.abs(a.c - cx) - Math.abs(b.c - cx); });
  bot.slice(0, 5).forEach(function (t) { G.exits.atk.push({ c: t.c, r: t.r, to: env.from, name: env.fromName }); });
  // 援軍（守り）の 入口
  G.env = env; G.defFronts = [null];
  (env.defFronts || []).forEach(function (f) { G.defFronts.push(defAnchor(G, env, f)); });
  // 同時攻撃：ほかの 国からの 攻め口（道が 国に はいる ところ）
  G.fronts = [{ c: cx, r: G.map.h - 1, from: env.from, name: env.fromName }];
  var kxy0 = env.keepXY || [0, 0];
  (env.fronts || []).forEach(function (f) {
    var best = null;
    for (var k = 0; k < f.path.length; k++) {
      var bq = env.toBattle(f.path[k]), rr = Math.round((kxy0[1] + bq[1]) / 1.5), cc = Math.round((kxy0[0] + bq[0]) / SQ3G - 0.5 * (rr & 1));
      if (rr < 1 || rr >= G.map.h - 1 || cc < 1 || cc >= G.map.w - 1) { if (best && f.inTo[k]) break; continue; }
      var t3 = G.map.tiles[rr][cc]; if (!exitOK(t3)) continue;
      best = [cc, rr]; if (f.inTo[k]) break;   // 国に はいった ところ
    }
    if (!best) { var e0 = edgeHexAt(G, f.ang); best = e0 || [cx, G.map.h - 1]; }
    G.fronts.push({ c: best[0], r: best[1], from: f.from, name: f.name });
    var near = [];
    for (r = 0; r < G.map.h; r++) for (c = 0; c < G.map.w; c++) { var t4 = G.map.tiles[r][c]; if (exitOK(t4) && hexDist(c, r, best[0], best[1]) <= 1) near.push(t4); }
    near.slice(0, 3).forEach(function (t5) { G.exits.atk.push({ c: t5.c, r: t5.r, to: f.from, name: f.name }); });
  });
  // 守り手：みかたの となりの 国への 道が 地図の そとへ でる ところ
  var used = {}, keep = findKeep(G), kxy = env.keepXY || [SQ3G * (keep.c + 0.5 * (keep.r & 1)), 1.5 * keep.r];
  function hexXY(x, y) { var rr = Math.round(y / 1.5); return [Math.round(x / SQ3G - 0.5 * (rr & 1)), rr]; }
  (env.escapes || []).forEach(function (e) {
    var p = null;
    if (e.path && env.toBattle) {
      for (var k = 0; k < e.path.length; k++) {
        var b = env.toBattle(e.path[k]), h = hexXY(kxy[0] + b[0], kxy[1] + b[1]);
        if (h[1] < 0 || h[1] >= G.map.h || h[0] < 0 || h[0] >= G.map.w) break;
        p = h;
      }
    } else if (e.ang !== undefined) p = edgeHexAt(G, e.ang);
    if (!p) return;
    // その ちかくの 通れる マス（はしに ちかい ほど よい）を 3つ
    var cand = [];
    for (r = 0; r < G.map.h; r++) for (c = 0; c < G.map.w; c++) {
      var t2 = G.map.tiles[r][c]; if (!exitOK(t2) || used[key(c, r)]) continue;
      if (G.exits.atk.some(function (q) { return q.c === c && q.r === r; })) continue;
      var edge = Math.min(r, c, G.map.h - 1 - r, G.map.w - 1 - c);
      cand.push({ t: t2, d: hexDist(c, r, p[0], p[1]) + edge * 0.6 });
    }
    cand.sort(function (a, b) { return a.d - b.d; });
    cand.slice(0, 3).forEach(function (q) { if (q.d > 7) return; used[key(q.t.c, q.t.r)] = 1; G.exits.def.push({ c: q.t.c, r: q.t.r, to: e.to, name: e.name }); });
  });
}
function exitAt(G, side, c, r) {
  if (!G.exits) return null; var l = G.exits[side];
  for (var i = 0; i < l.length; i++) if (l[i].c === c && l[i].r === r) return l[i];
  return null;
}
// 全軍 撤退：攻めては 兵を まとめて ひきあげる（しんがりで すこし へる）。守りは 退き口から となりへ にげる（城は すてる）
function canRetreat(G, side) { if (!G || G.over) return false; if (side === 'atk') return true; return !!(G.exits && G.exits.def && G.exits.def.length); }
function retreatAll(G, side) {
  if (!canRetreat(G, side)) return null;
  var lost = 0;
  if (side === 'atk') {
    unitsOf(G, 'atk').forEach(function (u) { if (u.type === 'taisho' || u.type === 'konida') return; var d = Math.round(u.hp * 0.1 * 100) / 100; u.hp = Math.max(0.5, u.hp - d); lost += d * UNIT_TYPES[u.type].men / 10; });
    G.over = true; G.winner = 'def'; G.reason = 'せめてが 撤退した';
  } else {
    var e = G.exits.def[0];
    unitsOf(G, 'def').forEach(function (u) { var d = u.type === 'taisho' ? 0 : Math.round(u.hp * 0.15 * 100) / 100; u.hp = Math.max(0.5, u.hp - d); lost += u.type === 'taisho' ? 0 : d * UNIT_TYPES[u.type].men / 10; u.fled = true; u.fledTo = e.to; u.fledName = e.name; u.acted = true; u.c = -99; u.r = -99; });
    G.over = true; G.winner = 'atk'; G.reason = 'まもりが 城を すてて ' + e.name + 'へ 撤退した';
  }
  return { lost: Math.round(lost), to: side === 'def' ? G.exits.def[0].name : null };
}
function canFlee(G, u) { return !!(u && u.hp > 0 && !u.fled && exitAt(G, u.side, u.c, u.r)); }
function doFlee(G, u) {
  var e = exitAt(G, u.side, u.c, u.r); if (!e) return null;
  u.fled = true; u.fledTo = e.to; u.fledName = e.name; u.acted = true; u.c = -99; u.r = -99;
  return e;
}
function escaped(G, side) {
  return G.units.filter(function (u) { return u.side === side && u.type !== 'taisho' && u.type !== 'konida' && u.hp > 0 && u.fled; })
    .map(function (u) { return { uid: u.ref, type: u.type, hp: u.hp, to: u.fledTo }; });
}

// 合戦のあと：生きのこった へい（国取りへ もどす）
function survivors(G, side) {
  return G.units.filter(function (u) { return u.side === side && u.type !== 'taisho' && u.type !== 'konida' && u.hp > 0 && !u.fled; })
    .map(function (u) { return { uid: u.ref, type: u.type, hp: u.hp }; });
}
// 合流：へった 隊が となりの おなじ 兵種の 隊に はいる
function mergeTargets(G, u) {
  if (!u || u.type === 'taisho' || u.type === 'konida' || u.hp <= 0 || u.fled) return [];
  return hexNbs(u.c, u.r).map(function (n) { return unitAt(G, n[0], n[1]); }).filter(function (t) { return t && t !== u && t.side === u.side && t.type === u.type && t.hp > 0 && t.hp < 10 && !t.fled; });
}
function doMerge(G, u, t) {
  var mv = Math.min(u.hp, 10 - t.hp); if (mv <= 0) return 0;
  t.hp = Math.round((t.hp + mv) * 100) / 100; u.hp = Math.round((u.hp - mv) * 100) / 100; u.acted = true;
  if (u.hp <= 0.01) { var i = G.units.indexOf(u); if (i >= 0) G.units.splice(i, 1); }
  return mv;
}
function unitsOf(G, side) { return G.units.filter(function (u) { return u.hp > 0 && u.side === side && !u.fled; }); }
function general(G, side) { for (var i = 0; i < G.units.length; i++) { var u = G.units[i]; if (u.side === side && u.type === 'taisho') return u; } return null; }

// 勝敗判定（ターン終了時に呼ぶ）
function checkVictory(G) {
  if (G.over) return G.winner;
  var ga = general(G, 'atk'), gd = general(G, 'def');
  if (gd && gd.hp <= 0) { G.over = true; G.winner = 'atk'; G.reason = 'てきの たいしょうを たおした！'; return 'atk'; }
  if (ga && ga.hp <= 0) { G.over = true; G.winner = 'def'; G.reason = 'せめての たいしょうを たおした！'; return 'def'; }
  if (gd && gd.fled) { G.over = true; G.winner = 'atk'; G.reason = 'まもりの たいしょうが ' + (gd.fledName || 'となりの国') + 'へ にげた！'; return 'atk'; }
  if (ga && ga.fled) { G.over = true; G.winner = 'def'; G.reason = 'せめての たいしょうが ' + (ga.fledName || 'もとの国') + 'へ ひきあげた'; return 'def'; }
  var keep = findKeep(G);
  var occ = unitAt(G, keep.c, keep.r);
  if (occ && occ.side === 'atk' && G.side === 'atk') { G.over = true; G.winner = 'atk'; G.reason = 'ほんまるを おとした！'; return 'atk'; }
  if (unitsOf(G, 'atk').filter(function (u) { return u.type !== 'konida'; }).length === 0) { G.over = true; G.winner = 'def'; G.reason = 'せめてを ぜんめつ させた！'; return 'def'; }
  if (unitsOf(G, 'def').length === 0) { G.over = true; G.winner = 'atk'; G.reason = 'まもりてを ぜんめつ させた！'; return 'atk'; }
  return null;
}

// ---- 合戦の とちゅうの 援軍 ----
// 道すじ（世界の マス）から 合戦場の 入口を きめる。inTo：その マスが 戦場の 国か
function reinfEntry(G, path, inTo) {
  var env = G.env; if (!env || !env.toBattle) return { c: Math.floor(G.map.w / 2), r: G.map.h - 1 };
  var kxy = env.keepXY || [0, 0], best = null, lastIn = null;
  for (var k = 0; k < path.length; k++) {
    var bq = env.toBattle(path[k]), rr = Math.round((kxy[1] + bq[1]) / 1.5), cc = Math.round((kxy[0] + bq[0]) / SQ3G - 0.5 * (rr & 1));
    var inside = rr >= 1 && rr < G.map.h - 1 && cc >= 1 && cc < G.map.w - 1;
    if (!inside) { if (path.length === 1) best = [Math.max(1, Math.min(G.map.w - 2, cc)), Math.max(1, Math.min(G.map.h - 2, rr))]; continue; }
    lastIn = [cc, rr]; if (!best) best = [cc, rr];
    if (inTo && inTo[k]) { best = [cc, rr]; break; }
  }
  if (!best) best = lastIn || [Math.floor(G.map.w / 2), G.map.h - 1];
  var bt = null;
  for (var r2 = 0; r2 < G.map.h; r2++) for (var c2 = 0; c2 < G.map.w; c2++) { var t2 = G.map.tiles[r2][c2]; if ('.=fhbC'.indexOf(t2.ch) < 0) continue; var d2 = hexDist(c2, r2, best[0], best[1]); if (!bt || d2 < bt[1]) bt = [t2, d2]; }
  return bt ? { c: bt[0].c, r: bt[0].r } : { c: best[0], r: best[1] };
}
// list：[{uid,type,hp}]。delay 日 あとに entry の まわりに あらわれる
function queueReinf(G, side, list, entry, delay, name) {
  (G.pendingRein = G.pendingRein || []).push({ side: side, list: list, entry: entry, due: G.turn + Math.max(0, delay), name: name });
}
function spawnDue(G) {
  if (!G.pendingRein || !G.pendingRein.length) return;
  G.pendingRein = G.pendingRein.filter(function (p) {
    if (p.side !== G.side || p.due > G.turn) return true;
    var cand = [];
    for (var r = 0; r < G.map.h; r++) for (var c = 0; c < G.map.w; c++) { var t = G.map.tiles[r][c]; if ('.=fhbC'.indexOf(t.ch) < 0 || unitAt(G, c, r)) continue; var d = hexDist(c, r, p.entry.c, p.entry.r); if (d <= 6) cand.push([t, d]); }
    cand.sort(function (a, b) { return a[1] - b[1]; });
    var n = 0;
    p.list.forEach(function (it, i) { var t = cand[i]; if (!t) return; var u = makeUnit(it.type, p.side, null); u.hp = Math.max(0.05, Math.min(10, it.hp)); u.ref = it.uid; u.c = t[0].c; u.r = t[0].r; u.revealed = true; u.reinf = true; G.units.push(u); n++; });
    (G.notes || (G.notes = [])).push({ c: p.entry.c, r: p.entry.r, side: p.side, text: '🚩 ' + p.name + 'から 援軍 ' + n + '隊が とうちゃく！' });
    return false;
  });
}
function endTurn(G) {
  checkVictory(G);
  if (G.over) return;
  if (G.food !== undefined) convoyStep(G, G.side);
  if (G.side === 'atk') { G.side = 'def'; }
  else {
    G.side = 'atk'; G.turn++;
    if (G.food !== undefined) {   // 1日 すぎる：兵糧を たべる
      G.food -= atkMen(G);
      if (G.food < 0) { G.food = 0; G.over = true; G.winner = 'def'; G.reason = 'せめての 兵糧が つきた！（ひきあげ）'; return; }
      if (G.defFood !== undefined) {   // 守りも 城の 蔵から たべる
        G.defFood -= defMen(G) * 0.0025;
        if (G.defFood < 0) { G.defFood = 0; G.over = true; G.winner = 'atk'; G.reason = '城の 兵糧が つきて 開城した！'; return; }
      }
      // CPU の 攻め手は 兵糧が へると 小荷駄隊を よぶ（2回まで）
      if (G.playerSide === 'def' && foodDays(G) <= 4 && (G.cpuSupply || 0) < 2 && !activeConvoy(G, 'atk')) {
        var cv = sendSupply(G, 8, 'atk'); if (cv) { G.cpuSupply = (G.cpuSupply || 0) + 1; (G.notes || (G.notes = [])).push({ c: cv.c, r: cv.r, side: 'atk', text: 'てきの 小荷駄隊が あらわれた！ おそえば 兵糧が とどかない' }); }
      }
    }
    if (G.turn > (G.turnLimit || TURN_LIMIT)) { G.over = true; G.winner = 'def'; G.reason = 'しろを まもりきった！'; return; }
  }
  spawnDue(G);
  G.units.forEach(function (u) { if (u.side === G.side) { u.acted = false; u.moved = false; } });
}

// ---- AI ----
// 本丸までの距離場（攻撃側視点、壁は壊せる前提でコスト加算）
function distanceField(G, side, unitType) {
  var keep = findKeep(G);
  var dist = {}; dist[key(keep.c, keep.r)] = 0;
  var open = [[0, keep.c, keep.r]];
  var dummy = { type: unitType || 'ashigaru', side: side };
  while (open.length) {
    open.sort(function (a, b) { return a[0] - b[0]; });
    var cur = open.shift(); var d = cur[0];
    if (d > dist[key(cur[1], cur[2])]) continue;
    var nb = neighbors(cur[1], cur[2]);
    for (var i = 0; i < nb.length; i++) {
      var t = tileAt(G, nb[i][0], nb[i][1]); if (!t) continue;
      var cost = moveCost(G, dummy, t);
      if (cost === null) {
        if (t.ch === 'W') cost = side === 'atk' ? 6 : 1;
        else if (t.ch === 'G') cost = side === 'atk' ? 3 : 1;
        else if (t.ch === 'm') cost = 6;
        else continue;
      }
      var nd = d + cost, k = key(t.c, t.r);
      if (dist[k] === undefined || nd < dist[k]) { dist[k] = nd; open.push([nd, t.c, t.r]); }
    }
  }
  return dist;
}

function threatAt(G, side, c, r, uDef) {
  // 敵から受けうるダメージ合計の概算
  var sum = 0;
  G.units.forEach(function (e) {
    if (e.hp <= 0 || e.side === side) return;
    var d = hexDist(e.c, e.r, c, r);
    var reach = e.mov + e.rmax;
    if (d <= reach) {
      var tmp = { type: uDef.type, def: uDef.def, hp: uDef.hp, c: c, r: r, side: side };
      sum += estimateDamage(G, e, e.c, e.r, tmp) * (d <= e.rmax ? 1 : 0.6);
    }
  });
  return sum;
}

// 退却するか（0=しない, 1=兵だけ, 2=大将も）
function aiRout(G, side) {
  if (!G.exits || !G.exits[side] || !G.exits[side].length) return 0;
  function pw(sd) { var p = 0; unitsOf(G, sd).forEach(function (u) { if (u.type !== 'taisho') p += u.atk * u.hp; }); return p; }
  var me = pw(side), en = pw(side === 'atk' ? 'def' : 'atk');
  var g = general(G, side);
  if (side === 'atk') {
    if (G.turn >= 4 && me < en * 0.22) return 2;
    if (g && g.hp <= 2 && me < en * 0.4) return 2;
  } else {
    if (me < en * 0.22) return 2;
    if (me < en * 0.3) return 1;
  }
  return 0;
}
// 1ユニットの最善手を決める。戻り値 {move:[c,r], action:{kind, target}}
function aiPlan(G, u) {
  var side = u.side, enemy = side === 'atk' ? 'def' : 'atk';
  var reach = reachable(G, u);
  var keep = findKeep(G);
  var field = distanceField(G, side, u.type);
  var enemies = unitsOf(G, enemy).filter(function (e) { return isVisibleTo(G, e, side); });
  var best = null;
  var hard = G.difficulty === 'hard', easy = G.difficulty === 'easy';
  var gateTiles = listTiles(G, 'G');
  var anyOpen = gateTiles.some(function (g) { return g.open || g.broken; }) || listTiles(G, 'W').some(function (w) { return w.broken; });
  var rout = aiRout(G, side), myExits = rout && G.exits ? G.exits[side] : null;
  // 攻め手の 隊列：おくれた 隊（7わり目）の 本丸までの きょり
  var grp = null;
  if (side === 'atk' && u.type !== 'taisho' && G.map.h > SIZES[G.sizeIndex || 0].h + 4) {
    var ds = unitsOf(G, 'atk').filter(function (o) { return o.type !== 'taisho'; }).map(function (o) { var v = field[key(o.c, o.r)]; return v === undefined ? 99 : v; }).sort(function (a, b) { return a - b; });
    if (ds.length >= 3) { grp = ds[Math.floor(ds.length * 0.7)]; if (grp > 90) grp = null; }
  }
  if (myExits && !myExits.length) myExits = null;
  if (myExits && u.type === 'taisho' && !(threatAt(G, side, u.c, u.r, u) >= u.hp * 0.8 || rout === 2)) myExits = null;

  if (u.type === 'konida') {   // 小荷駄：本隊（みかたが あつまって いる ところ）へ、あぶない ところは さける
    var arm = unitsOf(G, side).filter(function (o) { return o.type !== 'konida' && o.type !== 'taisho'; }), bk = null;
    if (!arm.length) arm = unitsOf(G, side).filter(function (o) { return o.type !== 'konida'; });
    for (var k0 in reach) { if (k0 === '__from') continue; var p0 = k0.split(',').map(Number);
      var ds2 = arm.map(function (o) { return hexDist(p0[0], p0[1], o.c, o.r); }).sort(function (a, b) { return a - b; }), dd2 = ds2.length ? ds2[Math.min(2, ds2.length - 1)] : 0;
      var sc1 = -dd2 * 3 - threatAt(G, side, p0[0], p0[1], u) * 1.2; if (!bk || sc1 > bk.score) bk = { score: sc1, move: p0, action: { kind: 'wait' } }; }
    return bk;
  }
  for (var k in reach) {
    if (k === '__from') continue;
    var p = k.split(',').map(Number), c = p[0], r = p[1];
    var moved = !(c === u.c && r === u.r);
    var t = tileAt(G, c, r);
    if (myExits) {
      // 退却：いちばん 近い 退き口へ
      var ex = exitAt(G, side, c, r), dEx = 99;
      myExits.forEach(function (q) { dEx = Math.min(dEx, hexDist(c, r, q.c, q.r)); });
      var sc0 = ex ? 100 : -dEx * 3 - threatAt(G, side, c, r, u) * 0.3;
      if (!best || sc0 > best.score) best = { score: sc0, move: [c, r], action: ex ? { kind: 'flee' } : { kind: 'wait' } };
      continue;
    }
    if (side === 'def' && u.guard && keep && hexDist(c, r, keep.c, keep.r) > 2) continue;
    // 守りの大将は本丸を はなれない
    if (side === 'def' && u.type === 'taisho' && keep && t.ch !== 'K' && tileAt(G, u.c, u.r).ch === 'K') continue;
    var score = 0;
    var action = { kind: 'wait' };

    // 位置の価値
    var dk = field[k]; if (dk === undefined) dk = 99;
    var urg = G.food !== undefined ? Math.min(1, Math.max(0, 1 - foodDays(G) / Math.max(1, G.food0))) : Math.min(1, G.turn / (G.turnLimit || TURN_LIMIT)); // 残りが少ないほど強気
    if (side === 'atk') {
      if (u.type === 'taisho') score += -dk * 0.25 - 2; // 大将は後方で指揮
      else {
        score += -dk * 1.6 * (1 + urg);
        // とおい 道のり：城に ちかづくまでは 足なみを そろえる（ぬけがけ しない）
        if (grp !== null && dk > 7 && dk < grp - 4) score -= (grp - 4 - dk) * 3.2 * (1 - urg);
      }
    } else {
      // 防衛：城内・城壁にいることが大事、大将は本丸
      if (u.type === 'taisho') score += -hexDist(c, r, keep.c, keep.r) * 4;
      else {
        if (t.ch === 'W' && !t.broken) score += 4;
        else if (t.ch === 'C' || t.ch === 'K') score += 2.5;
        else if (t.ch === 'G') score += 2;
        else score += -dk * 0.5;
      }
    }
    var tmpU = { type: u.type, def: u.def, hp: u.hp };
    var thr = threatAt(G, side, c, r, tmpU);
    score += -thr * (u.type === 'taisho' ? 3 : (side === 'atk' ? 0.45 * (1 - 0.6 * urg) : 0.45));
    score += (1 - defMod(G, u, t)) * 4;

    // 行動候補
    var bestAct = 0;
    // 攻撃
    for (var i = 0; i < enemies.length; i++) {
      var e = enemies[i];
      if (!canAttackFrom(G, u, c, r, e, moved)) continue;
      var tmpA = { type: u.type, atk: u.atk, hp: u.hp, side: u.side, c: c, r: r };
      var dmg = estimateDamage(G, tmpA, c, r, e);
      var kill = dmg >= e.hp;
      var val = Math.min(dmg, e.hp) * 1.4 + (kill ? 5 : 0);
      if (e.type === 'taisho') val += kill ? 40 : dmg * 1.0;
      if (e.type === 'kosaku' && side === 'def') val += 2;
      if (e.type === 'konida') val += 8;   // 補給を たつ
      // 反撃
      var dd = hexDist(c, r, e.c, e.r);
      if (!kill && dd >= e.rmin && dd <= e.rmax) {
        var cnt = estimateDamage(G, e, e.c, e.r, { type: u.type, def: u.def, hp: u.hp, c: c, r: r, side: side }) * 0.8;
        val -= cnt * (u.type === 'taisho' ? 1.5 : 0.7);
      }
      if (val > bestAct) { bestAct = val; action = { kind: 'attack', target: e }; }
    }
    // 壁・門
    if (side === 'atk') {
      var nb = [];
      for (var rr = 0; rr < G.map.h; rr++) for (var cc = 0; cc < G.map.w; cc++) {
        var w = G.map.tiles[rr][cc];
        if (w.ch !== 'W' && w.ch !== 'G') continue;
        if (hexDist(c, r, cc, rr) <= u.rmax) nb.push(w);
      }
      for (var j = 0; j < nb.length; j++) {
        var w2 = nb[j];
        if (canOpenGateFrom(G, u, c, r, w2)) {
          var v = anyOpen ? 6 : 25;
          if (v > bestAct) { bestAct = v; action = { kind: 'open', target: w2 }; }
        }
        if (canHitWallFrom(G, u, c, r, w2, moved)) {
          var wd = wallDamage(u);
          var v2 = (anyOpen ? 1.5 : 4) * wd + (wd >= w2.hp ? 8 : 0);
          // 本丸に近い壁ほど価値
          v2 += Math.max(0, 6 - (field[key(w2.c, w2.r)] || 6)) * 0.5;
          if (w2.ch === 'G') v2 += 2;
          if (v2 > bestAct) { bestAct = v2; action = { kind: 'wall', target: w2 }; }
        }
      }
      if (u.type === 'kosaku') {
        var nbr = neighbors(c, r);
        var here = field[k] === undefined ? 99 : field[k];
        for (var qb = 0; qb < nbr.length; qb++) {
          var rt = tileAt(G, nbr[qb][0], nbr[qb][1]);
          if (!canBuildBridgeFrom(G, u, c, r, rt)) continue;
          var fr = field[key(rt.c, rt.r)]; if (fr === undefined) fr = 99;
          var vb = fr < here ? 9 : 1;
          if (vb > bestAct) { bestAct = vb; action = { kind: 'bridge', target: rt }; }
        }
      }
    } else {
      if (u.type === 'kosaku') {
        var nbs = neighbors(c, r).concat([[c, r]]);
        for (var q = 0; q < nbs.length; q++) {
          var wt = tileAt(G, nbs[q][0], nbs[q][1]);
          if (canRepairFrom(G, u, c, r, wt)) {
            var max = wt.maxHp;
            var v3 = 3 + (wt.maxHp - wt.hp) * 0.8;
            if (v3 > bestAct) { bestAct = v3; action = { kind: 'repair', target: wt }; }
          }
          if (canCloseGateFrom(G, u, c, r, wt)) { var v4 = 10; if (v4 > bestAct) { bestAct = v4; action = { kind: 'close', target: wt }; } }
        }
      } else {
        var nbs2 = neighbors(c, r).concat([[c, r]]);
        for (var q2 = 0; q2 < nbs2.length; q2++) {
          var gt = tileAt(G, nbs2[q2][0], nbs2[q2][1]);
          if (canCloseGateFrom(G, u, c, r, gt)) { var v5 = 8; if (v5 > bestAct) { bestAct = v5; action = { kind: 'close', target: gt }; } }
        }
      }
    }
    score += bestAct;
    if (easy) score += (rand() - 0.5) * 6;
    else if (!hard) score += (rand() - 0.5) * 2;
    if (!best || score > best.score) best = { score: score, move: [c, r], action: action };
  }
  return best;
}

// AI 1ユニット実行（UI 側がアニメーションのために順に呼ぶ）
function aiExecute(G, u, plan) {
  var events = [];
  if (plan.move[0] !== u.c || plan.move[1] !== u.r) {
    events.push({ kind: 'move', unit: u, from: [u.c, u.r], to: plan.move });
    u.c = plan.move[0]; u.r = plan.move[1]; u.moved = true;
  }
  var a = plan.action;
  if (a.kind === 'attack') { var res = doAttack(G, u, a.target); events.push({ kind: 'attack', unit: u, target: a.target, res: res }); }
  else if (a.kind === 'wall') { var dmg = doHitWall(G, u, a.target); events.push({ kind: 'wall', unit: u, tile: a.target, dmg: dmg }); }
  else if (a.kind === 'open') { doOpenGate(G, u, a.target); events.push({ kind: 'open', unit: u, tile: a.target }); }
  else if (a.kind === 'close') { doCloseGate(G, u, a.target); events.push({ kind: 'close', unit: u, tile: a.target }); }
  else if (a.kind === 'repair') { doRepair(G, u, a.target); events.push({ kind: 'repair', unit: u, tile: a.target }); }
  else if (a.kind === 'bridge') { doBuildBridge(G, u, a.target); events.push({ kind: 'bridge', unit: u, tile: a.target }); }
  else if (a.kind === 'flee') { var fc = u.c, fr = u.r, ex = doFlee(G, u); if (ex) events.push({ kind: 'flee', unit: u, c: fc, r: fr, exit: ex }); }
  u.acted = true;
  return events;
}
function aiOrder(G, side) {
  var pri = { ninja: 0, kosaku: 1, kiba: 2, ashigaru: 3, yumi: 4, teppo: 5, taisho: 6, konida: 7 };
  return unitsOf(G, side).filter(function (u) { return !u.acted; }).sort(function (a, b) { return pri[a.type] - pri[b.type]; });
}

if (typeof module !== 'undefined') {
  module.exports = { retreatAll: retreatAll, canRetreat: canRetreat, mergeTargets: mergeTargets, doMerge: doMerge, reinfEntry: reinfEntry, queueReinf: queueReinf, spawnDue: spawnDue, defAnchor: defAnchor, defFoodDays: defFoodDays, defMen: defMen, sendSupply: sendSupply, convoyStep: convoyStep, activeConvoy: activeConvoy, foodDays: foodDays, atkMen: atkMen, VERSION: VERSION, TURN_LIMIT: TURN_LIMIT, UNIT_TYPES: UNIT_TYPES, MAPS: MAPS, CHARS: CHARS, TERRAIN: TERRAIN,
    neighbors: neighbors, hexDist: hexDist, newGame: newGame, reachable: reachable, pathTo: pathTo, doAttack: doAttack, endTurn: endTurn,
    checkVictory: checkVictory, aiPlan: aiPlan, aiExecute: aiExecute, aiOrder: aiOrder, defaultArmy: defaultArmy, armyCost: armyCost,
    POINTS: POINTS, tileAt: tileAt, unitAt: unitAt, findKeep: findKeep, listTiles: listTiles, moveCost: moveCost, RNG: RNG,
    canHitWallFrom: canHitWallFrom, doHitWall: doHitWall, canOpenGateFrom: canOpenGateFrom, doOpenGate: doOpenGate,
    canRepairFrom: canRepairFrom, doRepair: doRepair, canAttackFrom: canAttackFrom, estimateDamage: estimateDamage, setTune: function (s, f, tg) { DMG_SCALE = s; FAR_SHOT = f; if (tg) TAISHO_GUARD = tg; },
    isVisibleTo: isVisibleTo, unitsOf: unitsOf, general: general, canCloseGateFrom: canCloseGateFrom, doCloseGate: doCloseGate,
    survivors: survivors, escaped: escaped, canFlee: canFlee, doFlee: doFlee, exitAt: exitAt, menOf: menOf, REPAIR: REPAIR_AMOUNT, setRepair: function (v) { REPAIR_AMOUNT = v; }, armyCount: armyCount, MAX_UNITS: MAX_UNITS, CASTLES: CASTLES, SIZES: SIZES, generateRows: generateRows, pointsFor: pointsFor, maxUnitsFor: maxUnitsFor, key: key, distanceField: distanceField, canBuildBridgeFrom: canBuildBridgeFrom, doBuildBridge: doBuildBridge };
}
